/* config.ts — DEV-ONLY static OSIM connections (local testing).
 *
 * ⚠️ NOT for production: anything here ships inside the app bundle. Real
 * connections come from the central directory (directory.ts) and are cached in
 * the device secure store (secureStore.ts); see resolver.ts. Each tenant's
 * token is read from an UNTRACKED .env (kept out of source control) and inlined
 * at build time so live scanning works in dev + the test APK.
 *
 * Institution ids match those in src/data/exam.ts. */
import { OsimConnection } from "./types";

const stemmucoKey = process.env.EXPO_PUBLIC_STEMMUCO_DEV_KEY ?? "";
const makumiraKey = process.env.EXPO_PUBLIC_MAKUMIRA_DEV_KEY ?? "";

export const DEV_OSIM_CONNECTIONS: Record<string, OsimConnection | null> = {
  stemmuco: stemmucoKey
    ? { baseUrl: "https://stemmuco.osim.cloud", abbr: "STEMMUCO", apiKey: stemmucoKey }
    : null,
  makumira: makumiraKey
    ? { baseUrl: "https://osim.makumira.ac.tz", abbr: "TUMA", apiKey: makumiraKey }
    : null,
};

export function getStaticOsimConnection(instId: string): OsimConnection | null {
  return DEV_OSIM_CONNECTIONS[instId] ?? null;
}
