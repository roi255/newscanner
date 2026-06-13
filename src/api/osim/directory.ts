/* directory.ts — client for the central institution directory.
 *
 * This is the server-side table you described: it stores each institution's
 * name, abbr, OSIM base URL, and key token. The app queries it at selection
 * time to learn how to reach the chosen institution, then scopes to it.
 *
 * SECURITY: the directory endpoint returns a secret (the OSIM api_key), so it
 * MUST be authenticated (app-level credential / device attestation) and ideally
 * return a short-lived / rotatable token. The app caches the result in the
 * device secure store and clears it on logout. The directory base URL is set
 * via configureDirectory() — left null here, so the app falls back to mock/dev
 * config until the central service exists. */
import { OsimConnection } from "./types";

export interface DirectoryEntry {
  id: string;
  name: string;
  abbr: string;
  baseUrl: string;
  short: string;
  location: string;
  accent: string;
  logo: string;
}

type DirectoryConfig = {
  baseUrl: string | null; // central registry, e.g. https://registry.exampass.example
  appToken?: string | null; // app-level auth for the directory endpoint
};

const config: DirectoryConfig = { baseUrl: null, appToken: null };

export function configureDirectory(next: Partial<DirectoryConfig>) {
  Object.assign(config, next);
}

export function isDirectoryConfigured(): boolean {
  return !!config.baseUrl;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/json" };
  if (config.appToken) h["Authorization"] = `Bearer ${config.appToken}`;
  return h;
}

/** Non-secret listing for the institution search. Empty query → the full list. */
export async function searchDirectory(query: string): Promise<DirectoryEntry[]> {
  if (!config.baseUrl) return [];
  try {
    const r = await fetch(`${config.baseUrl.replace(/\/+$/, "")}/institutions?q=${encodeURIComponent(query)}`, {
      headers: headers(),
    });
    const j = await r.json().catch(() => null);
    const list = (j?.data ?? j) as DirectoryEntry[] | null;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** The full registry (no query) — fetched once, cached on-device, filtered client-side. */
export async function listInstitutions(): Promise<DirectoryEntry[]> {
  return searchDirectory("");
}

/** Fetch the (secret-free) connection for one tenant: { baseUrl, abbr }. The
 * access token is NOT here — staff login mints it. The directory endpoint must
 * be authenticated (see configureDirectory.appToken). */
export async function fetchInstitutionConnection(instId: string): Promise<OsimConnection | null> {
  if (!config.baseUrl) return null;
  try {
    const r = await fetch(
      `${config.baseUrl.replace(/\/+$/, "")}/institutions/${encodeURIComponent(instId)}/connection`,
      { headers: headers() }
    );
    const j = await r.json().catch(() => null);
    const c = (j?.data ?? j) as Partial<OsimConnection> | null;
    if (c && c.baseUrl && c.abbr) {
      return { baseUrl: c.baseUrl, abbr: c.abbr };
    }
    return null;
  } catch {
    return null;
  }
}

/* ---- OTP (email second factor, served by the same directory API) ---- */

async function postJSON(path: string, body: unknown): Promise<any> {
  if (!config.baseUrl) return { ok: false, message: "Verification service unavailable" };
  try {
    const r = await fetch(`${config.baseUrl.replace(/\/+$/, "")}${path}`, {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await r.json().catch(() => ({}))) ?? {};
  } catch {
    return { ok: false, message: "No connection — check your internet and try again" };
  }
}

/** Request an OTP for a (already membership-verified) email. In dev the API
 * echoes the code, which we print to the Metro/npx console so you don't have to
 * open Mailpit. */
export async function requestOtp(instId: string, email: string): Promise<{ ok: boolean; message?: string }> {
  const j = await postJSON("/otp/request", { institution: instId, email });
  if (__DEV__ && j?.devCode) {
    console.log(
      `\n┌──────────────── DEV OTP ────────────────\n│  ${email}\n│  CODE: ${j.devCode}\n└─────────────────────────────────────────\n`
    );
  }
  return { ok: !!j?.ok, message: j?.message };
}

/** Verify an OTP code. */
export async function verifyOtp(
  instId: string,
  email: string,
  code: string
): Promise<{ ok: boolean; message?: string }> {
  const j = await postJSON("/otp/verify", { institution: instId, email, code });
  return { ok: !!j?.ok, message: j?.message };
}
