/* client.ts — OSIM app-API client. Builds the {token, checksum, requestData}
 * envelope using the current (short-lived) access token, POSTs to
 * <baseUrl>/osimapp/<path>, parses { data, error, message }, logs request +
 * response, and on a 401 rotates the token once and retries. */
import { osimChecksum } from "./checksum";
import { logAccess, maskToken } from "./accessLog";
import {
  OsimConnection,
  OsimEnvelope,
  OsimResponse,
  OsimIdentity,
  OsimStudent,
  ExamCardVerdict,
  ExamCardScanInput,
} from "./types";

/** Supplies the envelope token and rotates it on demand. */
export interface OsimAuth {
  getToken(): Promise<string | null>;
  /** Try to rotate after a 401. Returns true if a fresh token is now available. */
  onUnauthorized?(): Promise<boolean>;
}

export class OsimClient {
  constructor(private conn: OsimConnection, private auth: OsimAuth) {}

  get connection() {
    return this.conn;
  }

  /** Low-level call: token + envelope + POST + parse + audit-log (+ 401 retry). */
  async request<T = unknown>(path: string, requestData: unknown): Promise<OsimResponse<T>> {
    let token = await this.auth.getToken();
    if (!token) {
      const out: OsimResponse<T> = { data: null, error: 401, message: "Not signed in to this institution" };
      this.log(path, requestData, out, 0, "(none)");
      return out;
    }

    let resp = await this.send<T>(path, requestData, token);

    // Access token expired/rejected → rotate once and retry.
    if (resp.parsed.error === 401 && this.auth.onUnauthorized) {
      const rotated = await this.auth.onUnauthorized();
      if (rotated) {
        token = await this.auth.getToken();
        if (token) resp = await this.send<T>(path, requestData, token);
      }
    }

    this.log(path, requestData, resp.parsed, resp.ms, token ?? "(none)");
    return resp.parsed;
  }

  // `path` is relative to baseUrl, e.g. "api/verification/examcard".
  private async send<T>(path: string, requestData: unknown, token: string) {
    const body: OsimEnvelope = { token, checksum: osimChecksum(token, requestData), requestData };
    const url = `${this.conn.baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
    if (__DEV__) console.log(`[OSIM →] POST ${url}`, JSON.stringify(requestData));
    const started = Date.now();
    let parsed: OsimResponse<T>;
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const json: any = await r.json().catch(() => null);
      // OSIM api.php envelope: { checksum, responseData, status: { error, message } }
      if (json && typeof json === "object" && ("responseData" in json || "status" in json)) {
        parsed = {
          data: json.responseData ?? null,
          error: typeof json.status?.error === "number" ? json.status.error : r.status || 0,
          message: json.status?.message ?? "",
        };
      } else {
        parsed = json ?? { data: null, error: r.status || 0, message: "Empty/invalid response" };
      }
    } catch (err) {
      parsed = { data: null, error: 0, message: `Network error: ${String(err)}` };
    }
    if (__DEV__)
      console.log(`[OSIM ←] ${path}  error=${parsed.error}  ${parsed.message}`, parsed.data ? "(has data)" : "(no data)");
    return { parsed, ms: Date.now() - started };
  }

  private log(path: string, request: unknown, response: OsimResponse, ms: number, token: string) {
    logAccess({
      apiKey: maskToken(token),
      title: path,
      request,
      response,
      status: typeof response.error === "number" ? response.error : 0,
      ms,
      mode: __DEV__ ? "development" : "production",
    });
  }

  /* ---- real endpoints: api/verification/<method> (api.php) ---- */

  /** api/verification/student — single student verification by registration id. */
  verifyStudent(studentID: string) {
    return this.request<OsimStudent>("api/verification/student", { studentID });
  }

  /** api/verification/all_examcards — the full current exam-card roster for an
   * exam category. This is the SYNC: pull once, cache locally for offline scans. */
  getAllExamCards(examCategory: string) {
    return this.request<ExamCardVerdict[]>("api/verification/all_examcards", { exam_category: examCategory });
  }

  /** api/verification/examcard — registers the scan AND returns the verdict.
   * `input.studentID` is the EXAM NUMBER from the QR. Has a side effect (logs
   * the scan), so only call it on a real scan. Authorized ⇔
   * verdict.registration_status === "Registered" (fee cleared + reg confirmed). */
  scanExamCard(input: ExamCardScanInput) {
    return this.request<ExamCardVerdict>("api/verification/examcard", input);
  }

  /** api/verification/report — bulk-upload offline scan results. */
  uploadScannedReport(scannedReport: unknown) {
    return this.request("api/verification/report", { scanned_report: scannedReport });
  }

  /** api/verification/all_clearance_cards — the roster sync. Returns ALL
   * registered students for the server's current academic year/semester
   * (registration-based, so it works even before exam cards are generated).
   * Records are in the verdict shape (reg_no, student_name, registration_status,
   * fee_balance, …). Server uses its CURRENT year — no year param. */
  getAllClearanceCards() {
    return this.request<ExamCardVerdict[]>("api/verification/all_clearance_cards", {});
  }

  /** Confirm the token resolves to the intended institution (org_abbr match). */
  async verifyInstitution(): Promise<{ ok: boolean; identity: OsimIdentity | null; message: string }> {
    const resp = await this.request<OsimIdentity>("identity", {});
    const identity = resp.data;
    if (resp.error !== 200 || !identity) {
      return { ok: false, identity: null, message: resp.message || "Could not verify institution identity" };
    }
    const got = (identity.instabbr || identity.instid || "").toLowerCase();
    if (got !== this.conn.abbr.toLowerCase()) {
      return {
        ok: false,
        identity,
        message: `Wrong institution: resolves to "${identity.instname || got}" but "${this.conn.abbr}" was selected`,
      };
    }
    return { ok: true, identity, message: "Institution verified" };
  }
}
