/* session.ts — staff-login auth + short-lived, rotatable token lifecycle.
 *
 * Flow: staff signs in (staffId + PIN) against the institution's OSIM; the
 * server returns { accessToken, refreshToken, expiresIn, identity }. The access
 * token is short-lived and used as the envelope token for data calls; when it's
 * near expiry (or a 401 comes back) we rotate it with the refresh token. Tokens
 * live only in the device secure store, scoped per institution, wiped on logout.
 *
 * Server endpoints expected (per OSIM deployment):
 *   POST <baseUrl>/osimapp/staff/login    { staffId, pin, deviceId }
 *        -> { accessToken, refreshToken, expiresIn, instid, instabbr, instname }
 *   POST <baseUrl>/osimapp/staff/refresh  { refreshToken }
 *        -> { accessToken, refreshToken, expiresIn }
 *   POST <baseUrl>/osimapp/staff/logout   { refreshToken }   (optional revoke)
 */
import * as SecureStore from "expo-secure-store";
import { OsimSession, OsimIdentity } from "./types";

const SESS_PREFIX = "osim_sess_";
const DEVICE_KEY = "osim_device_id";
const REFRESH_SKEW_MS = 60_000; // refresh ~60s before expiry
const DEFAULT_TTL_MS = 5 * 60_000; // fallback if server omits expiresIn

const skey = (instId: string) => SESS_PREFIX + instId.replace(/[^A-Za-z0-9._-]/g, "_");

/* ---- device id (stable, persisted; identifier, not a secret) ---- */
export async function getDeviceId(): Promise<string> {
  try {
    let id = await SecureStore.getItemAsync(DEVICE_KEY);
    if (!id) {
      id = "dev-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
      await SecureStore.setItemAsync(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "dev-unknown";
  }
}

/* ---- session storage ---- */
export async function getStoredSession(instId: string): Promise<OsimSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(skey(instId));
    return raw ? (JSON.parse(raw) as OsimSession) : null;
  } catch {
    return null;
  }
}

async function storeSession(instId: string, s: OsimSession): Promise<void> {
  try {
    await SecureStore.setItemAsync(skey(instId), JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export async function clearSession(instId: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(skey(instId));
  } catch {
    /* ignore */
  }
}

/* ---- network helper ---- */
async function post(baseUrl: string, path: string, body: unknown): Promise<any> {
  try {
    const r = await fetch(`${baseUrl.replace(/\/+$/, "")}/osimapp/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => null);
    return j ?? { error: r.status || 0 };
  } catch (e) {
    return { error: 0, message: `Network error: ${String(e)}` };
  }
}

function toSession(d: any, staffId: string, prev?: OsimSession): OsimSession {
  return {
    accessToken: d.accessToken,
    refreshToken: d.refreshToken ?? prev?.refreshToken ?? "",
    expiresAt: Date.now() + (d.expiresIn ? Number(d.expiresIn) * 1000 : DEFAULT_TTL_MS),
    identity:
      prev?.identity ??
      ({ instid: d.instid, instabbr: d.instabbr, instname: d.instname, instremote: d.instremote } as OsimIdentity),
    staffId,
  };
}

/* ---- staff login ---- */
export async function staffLogin(
  instId: string,
  baseUrl: string,
  staffId: string,
  pin: string
): Promise<{ ok: boolean; identity?: OsimIdentity; message: string }> {
  const deviceId = await getDeviceId();
  const res = await post(baseUrl, "staff/login", { staffId, pin, deviceId });
  const d = res?.data ?? res;
  if (!d || (typeof res?.error === "number" && res.error !== 200) || !d.accessToken) {
    return { ok: false, message: res?.message || "Sign-in failed — check your credentials" };
  }
  const identity: OsimIdentity = {
    instid: d.instid,
    instabbr: d.instabbr,
    instname: d.instname,
    instremote: d.instremote ?? null,
  };
  await storeSession(instId, toSession(d, staffId, { identity } as OsimSession));
  return { ok: true, identity, message: "ok" };
}

/* ---- rotate ---- */
export async function refreshSession(instId: string, baseUrl: string): Promise<boolean> {
  const s = await getStoredSession(instId);
  if (!s?.refreshToken) return false;
  const res = await post(baseUrl, "staff/refresh", { refreshToken: s.refreshToken });
  const d = res?.data ?? res;
  if (!d?.accessToken) return false;
  await storeSession(instId, toSession(d, s.staffId, s)); // rotates refreshToken too if returned
  return true;
}

/** Valid access token, refreshing if expired/near-expiry. Null if no/dead session. */
export async function getValidAccessToken(instId: string, baseUrl: string): Promise<string | null> {
  let s = await getStoredSession(instId);
  if (!s) return null;
  if (Date.now() >= s.expiresAt - REFRESH_SKEW_MS) {
    const ok = await refreshSession(instId, baseUrl);
    if (!ok) {
      await clearSession(instId);
      return null;
    }
    s = await getStoredSession(instId);
  }
  return s?.accessToken ?? null;
}

/** Best-effort server-side revoke + local clear. */
export async function endSession(instId: string, baseUrl: string): Promise<void> {
  const s = await getStoredSession(instId);
  if (s?.refreshToken) {
    void post(baseUrl, "staff/logout", { refreshToken: s.refreshToken });
  }
  await clearSession(instId);
}
