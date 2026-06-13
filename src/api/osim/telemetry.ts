/* telemetry.ts — Phase 3 audit write path. The app records scan / auth / error
 * rows into an on-device queue (survives offline + restarts) and drains it to
 * the directory in one batched POST. Delivery is at-least-once: the queue is
 * trimmed only after a confirmed ack, and only by the count actually sent (rows
 * enqueued mid-flush are preserved). Best-effort throughout — never throws into
 * the scan path. */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendTelemetry } from "./directory";
import { getDeviceId } from "./session";

export interface ScanRow {
  institution: string;
  examNo: string;
  regNo?: string;
  examCategory: string;
  studentName?: string;
  authorized: boolean;
  decisionReason?: string;
  method?: "scan" | "lookup";
  source?: "cache" | "online";
  seat?: string;
  scannedAt?: string;
  deviceUid?: string;
}
export interface AuthRow {
  institution?: string;
  eventType: "membership_check" | "staff_login" | "token_refresh" | "logout";
  result: "success" | "failure";
  email?: string;
  loginId?: string;
  staffName?: string;
  staffRole?: string;
  reason?: string;
  at?: string;
  deviceUid?: string;
}
export interface ErrorRow {
  institution?: string;
  title: string;
  statusCode: number;
  durationMs?: number;
  message?: string;
  at?: string;
  deviceUid?: string;
}

type Queue = { scans: ScanRow[]; auth: AuthRow[]; errors: ErrorRow[] };

const QUEUE_KEY = "telemetry_queue_v1";
const MAX_ROWS = 500; // cap so a long offline spell can't grow unbounded

let mem: Queue = { scans: [], auth: [], errors: [] };
let loaded = false;
let flushing = false;

async function load() {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (raw) {
      const q = JSON.parse(raw) as Partial<Queue>;
      mem = { scans: q.scans ?? [], auth: q.auth ?? [], errors: q.errors ?? [] };
    }
  } catch {
    /* start empty */
  }
  loaded = true;
}

async function persist() {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(mem));
  } catch {
    /* ignore */
  }
}

function trimOldest() {
  const total = mem.scans.length + mem.auth.length + mem.errors.length;
  if (total <= MAX_ROWS) return;
  // drop oldest scans first (highest volume, least critical for audit)
  mem.scans.splice(0, Math.min(mem.scans.length, total - MAX_ROWS));
}

export async function enqueueScan(row: ScanRow): Promise<void> {
  await load();
  mem.scans.push({ ...row, deviceUid: row.deviceUid ?? (await getDeviceId()) });
  trimOldest();
  await persist();
}

export async function enqueueAuth(row: AuthRow): Promise<void> {
  await load();
  mem.auth.push({ ...row, deviceUid: row.deviceUid ?? (await getDeviceId()) });
  trimOldest();
  await persist();
}

export async function enqueueError(row: ErrorRow): Promise<void> {
  await load();
  mem.errors.push({ ...row, deviceUid: row.deviceUid ?? (await getDeviceId()) });
  trimOldest();
  await persist();
}

/** Drain the queue to the directory. No-op when empty or already in flight. */
export async function flushTelemetry(): Promise<void> {
  await load();
  if (flushing) return;
  const sent = { scans: mem.scans.length, auth: mem.auth.length, errors: mem.errors.length };
  if (sent.scans + sent.auth + sent.errors === 0) return;

  flushing = true;
  try {
    const ok = await sendTelemetry({
      scans: mem.scans.slice(),
      auth: mem.auth.slice(),
      errors: mem.errors.slice(),
    });
    if (ok) {
      // remove exactly what we sent; rows enqueued during the flight survive
      mem.scans.splice(0, sent.scans);
      mem.auth.splice(0, sent.auth);
      mem.errors.splice(0, sent.errors);
      await persist();
    }
  } catch {
    /* keep the queue for the next attempt */
  } finally {
    flushing = false;
  }
}
