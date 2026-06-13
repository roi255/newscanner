/* config.ts — DEV-ONLY static OSIM connections (local testing).
 *
 * ⚠️ NOT for production: anything here ships inside the app bundle. Real
 * connections come from the central directory (directory.ts) and are cached in
 * the device secure store (secureStore.ts); see resolver.ts. Each tenant's
 * token is read from an UNTRACKED .env (kept out of source control) and inlined
 * at build time so live scanning works in dev + the test APK.
 *
 * Tenant ids, base URLs, and abbrs come from the registry (src/data/institutions.ts).
 * A tenant only yields a connection once its EXPO_PUBLIC_<ID>_DEV_KEY is set;
 * until then it is null (inert — picker shows it, but no live scanning).
 *
 * Expo note: EXPO_PUBLIC_* vars are only inlined when referenced as STATIC
 * member expressions (process.env.EXPO_PUBLIC_X). A dynamic process.env[v] is
 * NOT replaced at build time, so every tenant key must be listed literally here. */
import { OsimConnection } from "./types";
import { TENANTS } from "../../data/institutions";

/* Per-tenant raw keys. Each line MUST stay a static process.env.EXPO_PUBLIC_*
 * reference (see Expo note above). Add the key, then fill the value in .env. */
const KEYS: Record<string, string | undefined> = {
  stemmuco: process.env.EXPO_PUBLIC_STEMMUCO_DEV_KEY,
  makumira: process.env.EXPO_PUBLIC_MAKUMIRA_DEV_KEY,
  ajuco: process.env.EXPO_PUBLIC_AJUCO_DEV_KEY,
  amucta: process.env.EXPO_PUBLIC_AMUCTA_DEV_KEY,
  bugando: process.env.EXPO_PUBLIC_BUGANDO_DEV_KEY,
  carumuco: process.env.EXPO_PUBLIC_CARUMUCO_DEV_KEY,
  chatocohest: process.env.EXPO_PUBLIC_CHATOCOHEST_DEV_KEY,
  dartu: process.env.EXPO_PUBLIC_DARTU_DEV_KEY,
  fhti: process.env.EXPO_PUBLIC_FHTI_DEV_KEY,
  hkmu: process.env.EXPO_PUBLIC_HKMU_DEV_KEY,
  kiahs: process.env.EXPO_PUBLIC_KIAHS_DEV_KEY,
  kiut: process.env.EXPO_PUBLIC_KIUT_DEV_KEY,
  ksp: process.env.EXPO_PUBLIC_KSP_DEV_KEY,
  lihas: process.env.EXPO_PUBLIC_LIHAS_DEV_KEY,
  mti: process.env.EXPO_PUBLIC_MTI_DEV_KEY,
  rhti: process.env.EXPO_PUBLIC_RHTI_DEV_KEY,
  saut: process.env.EXPO_PUBLIC_SAUT_DEV_KEY,
  smmuco: process.env.EXPO_PUBLIC_SMMUCO_DEV_KEY,
  socaite: process.env.EXPO_PUBLIC_SOCAITE_DEV_KEY,
  stc: process.env.EXPO_PUBLIC_STC_DEV_KEY,
  sumait: process.env.EXPO_PUBLIC_SUMAIT_DEV_KEY,
  tudarco: process.env.EXPO_PUBLIC_TUDARCO_DEV_KEY,
  uoa: process.env.EXPO_PUBLIC_UOA_DEV_KEY,
  wiarc: process.env.EXPO_PUBLIC_WIARC_DEV_KEY,
};

export const DEV_OSIM_CONNECTIONS: Record<string, OsimConnection | null> =
  Object.fromEntries(
    TENANTS.map((t) => {
      const key = KEYS[t.id];
      return [t.id, key ? { baseUrl: t.baseUrl, abbr: t.abbr, apiKey: key } : null];
    })
  );

export function getStaticOsimConnection(instId: string): OsimConnection | null {
  return DEV_OSIM_CONNECTIONS[instId] ?? null;
}
