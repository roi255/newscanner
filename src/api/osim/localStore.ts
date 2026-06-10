/* localStore.ts — persisted offline cache of scanned verdicts + the session log,
 * per institution (AsyncStorage). Lets the scanner survive app restarts: cached
 * students and the session history are restored when the session resumes. */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Student, LogEntry } from "../../data/exam";

export interface CachedVerdict {
  regId: string;
  student: Student;
  authorized: boolean;
}

export interface CacheSnapshot {
  verdicts: CachedVerdict[];
  log: LogEntry[];
}

const key = (instId: string) => `osim_cache_${instId}`;

export async function loadCacheSnapshot(instId: string): Promise<CacheSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(key(instId));
    return raw ? (JSON.parse(raw) as CacheSnapshot) : null;
  } catch {
    return null;
  }
}

export async function saveCacheSnapshot(instId: string, snapshot: CacheSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(key(instId), JSON.stringify(snapshot));
  } catch {
    /* best-effort cache */
  }
}

export async function clearCacheSnapshot(instId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key(instId));
  } catch {
    /* ignore */
  }
}
