/* institutionsSource.ts — Phase 1 of moving app data into the database.
 *
 * The institution list now comes from the central directory at runtime, with a
 * three-tier fallback so the app always has a usable list:
 *   1. live   — GET <directory>/institutions (when configureDirectory() is set)
 *   2. cache  — the last good response, persisted on-device (offline / next launch)
 *   3. bundle — src/data/institutions.ts TENANTS (first run with no network)
 *
 * The bundled list stays only as the offline/first-run safety net; once the
 * directory is reachable it becomes the source of truth and refreshes the cache.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Institution, INSTITUTIONS as BUNDLED, defaultSession } from "./exam";
import { DirectoryEntry, listInstitutions, isDirectoryConfigured } from "../api/osim/directory";

const CACHE_KEY = "directory_institutions_v1";

/** Map a directory entry to the app's richer Institution view-model. */
function toInstitution(e: DirectoryEntry): Institution {
  return {
    id: e.id,
    name: e.name,
    short: e.short,
    location: e.location,
    accent: e.accent,
    logo: e.logo,
    recordCount: 0,
    session: defaultSession(),
    staff: [{ id: "operator", name: "Operator", role: "Invigilator" }],
    students: [],
    osim: true,
  };
}

/** Resolve the institution list: live → cached → bundled. Never throws. */
export async function loadInstitutions(): Promise<Institution[]> {
  if (isDirectoryConfigured()) {
    try {
      const list = await listInstitutions();
      if (list.length) {
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(list)).catch(() => {});
        return list.map(toInstitution);
      }
    } catch {
      /* fall through to cache/bundle */
    }
  }
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const list = JSON.parse(raw) as DirectoryEntry[];
      if (Array.isArray(list) && list.length) return list.map(toInstitution);
    }
  } catch {
    /* fall through to bundle */
  }
  return BUNDLED;
}
