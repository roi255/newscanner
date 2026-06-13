/* accessLog.ts — local audit trail mirroring OSIM's cis_sys_api_request_log
 * (AppAPIRequestLog) + cis_sys_api_app_client_req_log. OSIM logs every incoming
 * request keyed by 'osim_api_app'+token with a title, JSON payload, timestamp
 * and sys_mode; here we record the request AND the response/status per access,
 * so an invigilator session has a full, inspectable access trail. */

export interface AccessLogEntry {
  id: number;
  apiKey: string; // e.g. "osim_api_app<token-tail>" (token kept short, never the full secret)
  title: string; // the OSIM method path, e.g. "student/basicInformation"
  request: unknown; // requestData sent
  response: unknown; // parsed { data, error, message }
  status: number; // response.error code (200/404/504/...) or 0 on transport failure
  ms: number; // round-trip duration
  mode: "development" | "production";
  at: string; // ISO timestamp
}

type Listener = (entries: AccessLogEntry[]) => void;

let entries: AccessLogEntry[] = [];
let seq = 0;
const listeners = new Set<Listener>();

function emit() {
  const snapshot = entries.slice();
  listeners.forEach((l) => l(snapshot));
}

/** Record one access. `apiKey` should already be masked to a short tail. */
export function logAccess(e: Omit<AccessLogEntry, "id" | "at">): AccessLogEntry {
  const entry: AccessLogEntry = { ...e, id: ++seq, at: new Date().toISOString() };
  entries = [entry, ...entries].slice(0, 200); // keep the session's most recent 200
  emit();
  return entry;
}

export function getAccessLog(): AccessLogEntry[] {
  return entries.slice();
}

export function clearAccessLog() {
  entries = [];
  emit();
}

export function subscribeAccessLog(listener: Listener): () => void {
  listeners.add(listener);
  listener(entries.slice());
  return () => listeners.delete(listener);
}

/** Mask a token to a short tail for log labels. */
export function maskToken(token: string): string {
  if (!token) return "osim_api_app";
  return "osim_api_app·" + token.slice(-6);
}
