/* resolver.ts — resolves a per-institution connection + builds a scoped client.
 *
 * Resolution order: device cache → central directory (then cache). The client's
 * token comes from the connection if it carries one, else the staff-login
 * session (auto-refreshed). */
import { OsimConnection } from "./types";
import { OsimClient, OsimAuth } from "./client";
import { getStoredConnection, storeConnection, clearStoredConnections } from "./secureStore";
import { fetchInstitutionConnection, isDirectoryConfigured } from "./directory";
import { getValidAccessToken, refreshSession, clearSession } from "./session";

export async function resolveOsimConnection(instId: string): Promise<OsimConnection | null> {
  // device cache → central directory, then cache the result on-device.
  const cached = await getStoredConnection(instId);
  const base = cached ?? (await fetchInstitutionConnection(instId));
  if (base && !cached) await storeConnection(instId, base);
  return base;
}

function authFor(instId: string, conn: OsimConnection): OsimAuth {
  if (conn.apiKey) {
    // connection carries its own token — no rotation here.
    const key = conn.apiKey;
    return { getToken: async () => key, onUnauthorized: async () => false };
  }
  // Fallback — short-lived staff-login token, rotated on demand.
  return {
    getToken: () => getValidAccessToken(instId, conn.baseUrl),
    onUnauthorized: () => refreshSession(instId, conn.baseUrl),
  };
}

export async function getOsimClient(instId: string): Promise<OsimClient | null> {
  const conn = await resolveOsimConnection(instId);
  if (!conn) return null;
  return new OsimClient(conn, authFor(instId, conn));
}

/** Whether this institution has a reachable connection configured (any source). */
export async function hasOsimConnection(instId: string): Promise<boolean> {
  return (await resolveOsimConnection(instId)) !== null;
}

/** Drop device-scoped connection + clear the auth session for one institution. */
export async function clearScopedConnection(instId: string): Promise<void> {
  await clearSession(instId);
}

/** Wipe everything scoped to this device — call on sign-out. */
export async function clearScopedConnections(): Promise<void> {
  await clearStoredConnections();
}

export type AccessCheck = {
  ok: boolean;
  provisioned: boolean;
  reason?: "unreachable" | "unprovisioned";
};

/** Registration gate, run when an institution is selected. Confirms the tenant
 * is actually set up for ExamPass before the operator is let in, and caches its
 * connection so the staff-login check can reuse it. */
export async function ensureInstitutionAccess(instId: string): Promise<AccessCheck> {
  if (!isDirectoryConfigured()) {
    // The directory base URL has a baked-in default, so this only happens if it
    // was explicitly overridden to empty — treat as unreachable.
    return { ok: false, provisioned: false, reason: "unreachable" };
  }
  const cached = await getStoredConnection(instId);
  if (cached?.apiKey) return { ok: true, provisioned: true };

  const conn = await fetchInstitutionConnection(instId);
  if (!conn) return { ok: false, provisioned: false, reason: "unreachable" };
  if (conn.provisioned) {
    await storeConnection(instId, conn); // cache for resolveOsimConnection
    return { ok: true, provisioned: true };
  }
  return { ok: false, provisioned: false, reason: "unprovisioned" };
}
