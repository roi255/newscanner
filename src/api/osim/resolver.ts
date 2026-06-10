/* resolver.ts — resolves a per-institution connection + builds a scoped client
 * whose token comes from the staff-login session (short-lived, rotatable).
 *
 * Connection resolution order:
 *   1. device secure store   — connection already cached on this device
 *   2. central directory      — fetch { baseUrl, abbr }, then cache it
 *   3. dev static config      — local-testing fallback (may carry a raw apiKey)
 *
 * Token resolution:
 *   - production: the staff-login session access token (auto-refreshed)
 *   - dev static: a raw pre-shared apiKey (no refresh)
 */
import { OsimConnection } from "./types";
import { OsimClient, OsimAuth } from "./client";
import { getStoredConnection, storeConnection, clearStoredConnections } from "./secureStore";
import { fetchInstitutionConnection } from "./directory";
import { getStaticOsimConnection } from "./config";
import { getValidAccessToken, refreshSession, clearSession } from "./session";

export async function resolveOsimConnection(instId: string): Promise<OsimConnection | null> {
  const cached = await getStoredConnection(instId);
  if (cached) return cached;

  const fromDirectory = await fetchInstitutionConnection(instId);
  if (fromDirectory) {
    await storeConnection(instId, fromDirectory);
    return fromDirectory;
  }

  return getStaticOsimConnection(instId);
}

function authFor(instId: string, conn: OsimConnection): OsimAuth {
  if (conn.apiKey) {
    // DEV raw key — no rotation.
    const key = conn.apiKey;
    return { getToken: async () => key, onUnauthorized: async () => false };
  }
  // Production — short-lived staff-login token, rotated on demand.
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
