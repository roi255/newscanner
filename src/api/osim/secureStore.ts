/* secureStore.ts — per-institution OSIM connections in the device Keychain/
 * Keystore (expo-secure-store), scoped per institution and wiped on logout. */
import * as SecureStore from "expo-secure-store";
import { OsimConnection } from "./types";

const PREFIX = "osim_conn_";
const INDEX_KEY = "osim_conn_index"; // tracks which institution ids are stored

const key = (instId: string) => PREFIX + instId.replace(/[^A-Za-z0-9._-]/g, "_");

async function readIndex(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(INDEX_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

async function writeIndex(ids: string[]) {
  try {
    await SecureStore.setItemAsync(INDEX_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch {
    /* ignore */
  }
}

export async function storeConnection(instId: string, conn: OsimConnection): Promise<void> {
  try {
    await SecureStore.setItemAsync(key(instId), JSON.stringify(conn));
    const idx = await readIndex();
    if (!idx.includes(instId)) await writeIndex([...idx, instId]);
  } catch {
    /* store unavailable — fail closed (no caching) */
  }
}

export async function getStoredConnection(instId: string): Promise<OsimConnection | null> {
  try {
    const raw = await SecureStore.getItemAsync(key(instId));
    return raw ? (JSON.parse(raw) as OsimConnection) : null;
  } catch {
    return null;
  }
}

export async function removeStoredConnection(instId: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key(instId));
    await writeIndex((await readIndex()).filter((id) => id !== instId));
  } catch {
    /* ignore */
  }
}

/** Wipe all scoped connections (call on sign-out). */
export async function clearStoredConnections(): Promise<void> {
  const idx = await readIndex();
  await Promise.all(idx.map((id) => SecureStore.deleteItemAsync(key(id)).catch(() => {})));
  await writeIndex([]);
}
