/* AppState — multi-tenant scope, local cache, and the cache-first scan flow.
 * This is the old AppRoot logic, lifted into a context so it survives the
 * React Navigation migration; navigation happens via navigationRef. */
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { navigate, replace, resetTo, goBack } from "../navigation/navigationRef";
import {
  getOsimClient,
  clearScopedConnections,
  getDeviceId,
  parseExamCardQr,
  verdictToStudent,
  verdictAuthorized,
  OsimClient,
  loadCacheSnapshot,
  saveCacheSnapshot,
} from "../api/osim";
import {
  INSTITUTIONS,
  Institution,
  Staff,
  Session,
  Student,
  LogEntry,
  ScanSource,
  fetchStudent,
  isAuthorized,
  makeSeedLog,
} from "../data/exam";
import { SessionVM } from "../types";
import { loadInstitutions } from "../data/institutionsSource";
import { requestOtp, verifyOtp, isDirectoryConfigured } from "../api/osim/directory";

const nowTime = () => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

type ScanState = { fetchingOnline: boolean; processing: boolean };
type ResultState = { student: Student; authorized: boolean; source: ScanSource } | null;

type AppStateValue = {
  inst: Institution;
  institutions: Institution[];
  staff: Staff;
  exam: Session;
  session: SessionVM;
  result: ResultState;
  scanState: ScanState;
  log: LogEntry[];
  stats: { total: number; authorized: number; denied: number };
  editingSession: boolean;
  operator: { name: string; phone: string };
  operatorPrefill: { name: string; phone: string };
  localCacheCount: number;
  osimConnected: boolean | null;

  selectInstitution: (next: Institution) => void;
  verifyMembership: (email: string) => Promise<{ ok: boolean; message?: string }>;
  otpEmail: string;
  submitOtp: (code: string) => Promise<{ ok: boolean; message?: string }>;
  resendOtp: () => Promise<{ ok: boolean; message?: string }>;
  startSession: (name: string, phone: string) => void;
  syncDone: () => void;
  runOsimSync: () => Promise<number>;
  startScan: () => void; // from Home (push Scanning)
  scanNext: () => void; // from Result (replace with Scanning)
  onDetected: (code: string) => Promise<boolean>;
  simulateScan: () => void;
  clearScanTimer: () => void;
  openStudent: (s: Student) => void;
  openEntry: (e: LogEntry) => void;
  lookupStudent: (q: string) => Student | null;
  cancelScan: () => void;
  doneToHome: () => void;
  openSessionForm: () => void;
  closeSessionForm: () => void;
  saveExam: (e: Session) => void;
  logout: () => void;
};

const Ctx = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { setAccent } = useTheme();

  const [inst, setInst] = useState<Institution>(INSTITUTIONS[0]);
  // Phase 1: the picker list comes from the central directory (live → cache →
  // bundle). Bundled INSTITUTIONS stay as the offline / first-run fallback.
  const [institutions, setInstitutions] = useState<Institution[]>(INSTITUTIONS);
  // Email pending OTP verification (set after the OSIM membership check passes).
  const [otpEmail, setOtpEmail] = useState<string>("");
  const [staff, setStaff] = useState<Staff>(INSTITUTIONS[0].staff[0]);
  const [exam, setExam] = useState<Session>({ ...INSTITUTIONS[0].session });
  const [result, setResult] = useState<ResultState>(null);
  const [scanState, setScanState] = useState<ScanState>({ fetchingOnline: false, processing: false });
  const [editingSession, setEditingSession] = useState(false);
  // null = unknown, false = OSIM token/connection not resolved (e.g. .env missing)
  const [osimConnected, setOsimConnected] = useState<boolean | null>(null);
  const [log, setLog] = useState<LogEntry[]>(() => makeSeedLog(INSTITUTIONS[0]));
  // Operator running the live session (name + phone) — stamped on every scan.
  const [operator, setOperator] = useState<{ name: string; phone: string }>({ name: "", phone: "" });
  // Identity prefill for the Operator screen, populated from the verified staff
  // record after the email-membership check (so the operator isn't retyped).
  const [operatorPrefill, setOperatorPrefill] = useState<{ name: string; phone: string }>({ name: "", phone: "" });
  const [localCacheCount, setLocalCacheCount] = useState(0);

  const queueRef = useRef(0);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheRef = useRef<Set<string>>(
    new Set(INSTITUTIONS[0].students.filter((s) => s.cached).map((s) => s.code))
  );
  // Locally-stored OSIM verdicts (keyed by reg_no) — re-opening a scanned
  // student from history shows instantly from this cache.
  const osimCacheRef = useRef<Map<string, { student: Student; authorized: boolean }>>(new Map());
  const logRef = useRef<LogEntry[]>(log);
  useEffect(() => {
    logRef.current = log;
  }, [log]);

  // Load the institution list from the directory once on mount.
  useEffect(() => {
    let alive = true;
    loadInstitutions().then((list) => {
      if (alive && list.length) setInstitutions(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  const session: SessionVM = useMemo(
    () => ({
      code: exam.code,
      name: exam.name,
      venue: exam.venue,
      date: exam.date,
      time: exam.time,
      course: `${exam.code} — ${exam.name}`,
      institution: inst.name,
      invigilator: operator.name || staff.name,
      invigilatorRole: operator.name ? "Operator" : staff.role,
      currency: "$",
      examCategory: exam.examCategory,
      semester: exam.semester,
    }),
    [exam, inst, staff, operator]
  );

  const stats = useMemo(
    () => ({
      total: log.length,
      authorized: log.filter((e) => e.authorized).length,
      denied: log.filter((e) => !e.authorized).length,
    }),
    [log]
  );

  function clearScanTimer() {
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
  }

  /* Wipe every per-tenant slice so one institution's roster/history/cache can
   * NEVER bleed into another. The AppState provider is mounted once at the root
   * and never unmounts, so this state survives a logout — it must be cleared
   * explicitly whenever the active institution changes. */
  function resetTenantState() {
    setLog([]);
    setResult(null);
    setLocalCacheCount(0);
    setOsimConnected(null);
    setOperator({ name: "", phone: "" });
    setOperatorPrefill({ name: "", phone: "" });
    osimCacheRef.current = new Map();
    cacheRef.current = new Set();
    queueRef.current = 0;
    clearScanTimer();
  }

  function selectInstitution(next: Institution) {
    resetTenantState(); // drop the previous tenant's data before switching
    setInst(next);
    setStaff(next.staff[0]);
    setExam({ ...next.session });
    setAccent(next.accent); // branding comes from the institution
    // Every tenant goes through Login first. For OSIM tenants this is the
    // email-membership gate (verifyMembership); mock tenants get the legacy
    // form. On success the flow continues to the Operator confirm step.
    navigate("Login");
  }

  /* Persist the OSIM verdict cache + session log for offline resume. */
  function persistOsimCache(instId: string, logSnapshot: LogEntry[] = logRef.current) {
    const verdicts = Array.from(osimCacheRef.current.entries()).map(([regId, v]) => ({
      regId,
      student: v.student,
      authorized: v.authorized,
    }));
    void saveCacheSnapshot(instId, { verdicts, log: logSnapshot });
  }

  /* Find a synced verdict by its exam number (the QR's `std`). The cache is
   * keyed by reg_no, but each cached Student carries `code` = exam_no, so we
   * match on that for the offline scan path. */
  function findCachedByExamNo(examNo: string): { student: Student; authorized: boolean } | null {
    const q = (examNo || "").trim().toLowerCase();
    if (!q) return null;
    for (const v of osimCacheRef.current.values()) {
      if ((v.student.code || "").toLowerCase() === q) return v;
    }
    return null;
  }

  /* Prepend a scan to the session history and persist the snapshot. */
  function appendLog(student: Student, authorized: boolean, source: ScanSource) {
    const entry: LogEntry = {
      regId: student.regId,
      name: student.name,
      gender: student.gender,
      balance: student.balance,
      authorized,
      seat: student.seat,
      method: "scan",
      source,
      at: nowTime(),
    };
    setLog((prev) => {
      const next = [entry, ...prev];
      persistOsimCache(inst.id, next); // persist verdict cache + session log
      return next;
    });
  }

  /* Live session start: capture the operator, then go to the sync step which
   * downloads + caches the student roster before scanning. */
  function startSession(name: string, phone: string) {
    setOperator({ name, phone });
    queueRef.current = 0;
    cacheRef.current = new Set();
    navigate("Sync");
  }

  /* Sync step (OSIM): restore the persisted cache, then pull the current
   * exam-card roster (all_examcards) and cache it locally for offline scans. */
  async function runOsimSync(): Promise<number> {
    const instId = inst.id;
    const snap = await loadCacheSnapshot(instId);
    if (snap) {
      osimCacheRef.current = new Map(
        snap.verdicts.map((v) => [v.regId, { student: v.student, authorized: v.authorized }])
      );
      setLog(snap.log ?? []);
    } else {
      // No persisted snapshot for THIS institution → start clean so we never
      // inherit another tenant's in-memory cache/history.
      osimCacheRef.current = new Map();
      setLog([]);
    }
    const client = await getOsimClient(instId);
    setOsimConnected(!!client);
    if (!client) {
      console.warn(
        `[OSIM] No connection for "${instId}". Token empty — is EXPO_PUBLIC_STEMMUCO_DEV_KEY set in .env? Restart with: npx expo start -c`
      );
    }
    if (client) {
      // Roster PRE-LOAD via all_clearance_cards (registration-based; the server's
      // CURRENT academic year). This is an OPTIONAL optimization that fills the
      // offline cache + the "records cached" count. Live scanning never depends
      // on it: every scan carries its own year_id from the QR, and scanned
      // students cache individually — so an empty roster here is an expected
      // state (e.g. the active year isn't set yet), NOT an error.
      const resp = await client.getAllClearanceCards();
      const list = Array.isArray(resp.data) ? resp.data : [];
      // Cache in batches, bumping the count so the sync screen climbs live
      // (0 → N) instead of jumping at the end.
      const BATCH = 150;
      for (let i = 0; i < list.length; i++) {
        const student = verdictToStudent(list[i]);
        if (student.regId) osimCacheRef.current.set(student.regId, { student, authorized: verdictAuthorized(list[i]) });
        if ((i + 1) % BATCH === 0) {
          setLocalCacheCount(osimCacheRef.current.size);
          await new Promise((r) => setTimeout(r, 16)); // yield a frame so it renders
        }
      }
      if (__DEV__) {
        if (resp.error === 200 && list.length > 0) {
          console.log(`[OSIM sync] Pre-loaded ${list.length} clearance records for offline scanning.`);
        } else if (resp.error === 404 || list.length === 0) {
          // The common case when the active academic year has no roster yet.
          console.log(
            "[OSIM sync] No offline roster for the current term — running ONLINE: live scans work and each student caches as they're scanned. (To pre-load offline, set the active academic year in OSIM admin.)"
          );
        } else if (resp.error === 401 || resp.error === 403) {
          console.warn(`[OSIM sync] Roster blocked (${resp.error} ${resp.message}). Check the institution api_key.`);
        } else if (resp.error === 0) {
          console.log("[OSIM sync] Offline — couldn't pre-load the roster; live scans will cache as you go.");
        } else {
          console.log(`[OSIM sync] Roster unavailable (${resp.error} ${resp.message}); running online.`);
        }
      }
    }
    setLocalCacheCount(osimCacheRef.current.size);
    persistOsimCache(instId);
    return osimCacheRef.current.size;
  }

  /* Email-membership sign-in. We can't authenticate a staff *password* without
   * an OSIM change we're not authorized to make, so the gate is: the email must
   * belong to a registered staff member of THIS institution. Each OSIM tenant's
   * DB holds only its own users, so a match in `api/staff/all` proves the person
   * is real staff at the selected college. This proves membership, not identity
   * (no password) — a deliberate floor. On success we adopt the matched record
   * as the operator identity and move to the Operator confirm step.
   * Mock tenants (no OSIM) just proceed. */
  async function verifyMembership(email: string): Promise<{ ok: boolean; message?: string }> {
    if (!inst.osim) {
      navigate("Operator");
      return { ok: true };
    }
    const q = email.trim().toLowerCase();
    if (!q || !q.includes("@")) {
      return { ok: false, message: "Enter the email address you use on OSIM" };
    }
    const client = await getOsimClient(inst.id);
    if (!client) {
      setOsimConnected(false);
      return { ok: false, message: `Not connected to ${inst.name}. Contact your administrator.` };
    }
    const resp = await client.getStaffAll();
    if (resp.error !== 200 || !Array.isArray(resp.data)) {
      // 0 = transport/offline, 401/403 = bad key, anything else = server issue.
      const msg =
        resp.error === 0
          ? "No connection — check your internet and try again"
          : resp.message || "Couldn't reach the staff directory. Try again.";
      return { ok: false, message: msg };
    }
    // Match on email (the asked-for credential); fall back to login_id so a
    // staffer who types their OSIM username instead of email still gets in.
    const match = resp.data.find(
      (s) => (s.email || "").trim().toLowerCase() === q || (s.login_id || "").trim().toLowerCase() === q
    );
    if (!match) {
      return { ok: false, message: `No staff account with this email at ${inst.name}.` };
    }
    const fullName =
      [match.first_name, match.middle_name, match.last_name].map((p) => (p || "").trim()).filter(Boolean).join(" ") ||
      match.email ||
      "Staff";
    setStaff({ id: match.login_id || match.email || q, name: fullName, role: match.role || "Staff" });
    setOperatorPrefill({ name: fullName, phone: (match.phone || "").trim() });
    setOsimConnected(true);
    // Second factor: email OTP — only when the directory/OTP service is
    // configured. Fires AFTER the OSIM membership check, never before.
    if (isDirectoryConfigured()) {
      const sent = await requestOtp(inst.id, q);
      if (!sent.ok) return { ok: false, message: sent.message || "Couldn't send your verification code" };
      setOtpEmail(q);
      navigate("Otp");
      return { ok: true };
    }
    navigate("Operator");
    return { ok: true };
  }

  async function submitOtp(code: string): Promise<{ ok: boolean; message?: string }> {
    const r = await verifyOtp(inst.id, otpEmail, code);
    if (r.ok) {
      navigate("Operator");
      return { ok: true };
    }
    return { ok: false, message: r.message };
  }

  async function resendOtp(): Promise<{ ok: boolean; message?: string }> {
    return requestOtp(inst.id, otpEmail);
  }

  function syncDone() {
    if (!inst.osim) {
      // mock tenant: hydrate from the bundled roster
      queueRef.current = 0;
      cacheRef.current = new Set(inst.students.filter((s) => s.cached).map((s) => s.code));
      setLog(makeSeedLog(inst));
    }
    // OSIM tenant: cache + log already populated by runOsimSync
    resetTo("Main"); // drop Institution/Operator/Sync from the back stack
  }

  function startScan() {
    setScanState({ fetchingOnline: false, processing: false });
    navigate("Scanning");
  }

  function scanNext() {
    setScanState({ fetchingOnline: false, processing: false });
    replace("Scanning"); // swap Result → Scanning, keeping depth 1 above Main
  }

  function proceedWithStudent(student: Student) {
    const inCache = cacheRef.current.has(student.code);
    setScanState({ fetchingOnline: !inCache, processing: true });
    const delay = inCache ? 900 : 1900;
    clearScanTimer();
    scanTimerRef.current = setTimeout(() => {
      if (!inCache) cacheRef.current.add(student.code);
      const authorized = isAuthorized(student);
      const source: ScanSource = inCache ? "cache" : "online";
      setResult({ student, authorized, source });
      setLog((prev) => [
        {
          regId: student.regId,
          name: student.name,
          gender: student.gender,
          balance: student.balance,
          authorized,
          seat: student.seat,
          method: "scan",
          source,
          at: nowTime(),
        },
        ...prev,
      ]);
      setScanState({ fetchingOnline: false, processing: false });
      replace("Result");
    }, delay);
  }

  // Real scan: parse the exam-card QR and verify it against OSIM. The verdict is
  // mapped to a Student + Authorized/Not-Authorized and cached locally.
  async function scanWithOsim(qrRaw: string, client: OsimClient): Promise<boolean> {
    const qr = parseExamCardQr(qrRaw);
    if (__DEV__) console.log("[OSIM scan] raw QR:", JSON.stringify(qrRaw), "→ parsed:", JSON.stringify(qr));
    if (!qr || !qr.examNo) {
      if (__DEV__) console.warn("[OSIM scan] QR did not parse to an exam-card (need: exam/studentid/year/sem). Got:", qrRaw);
      return false; // not an OSIM exam-card QR
    }
    setScanState({ fetchingOnline: true, processing: true });
    const deviceId = await getDeviceId();
    const resp = await client.scanExamCard({
      studentID: qr.examNo, // exam number from the QR
      year_id: qr.yearId,
      // QR value wins; else the session's configured semester/category; else default.
      semester: qr.semester || exam.semester || "1",
      exam_category: qr.examCategory || exam.examCategory || "fe",
      device_id: deviceId,
      operator_name: operator.name || staff.name,
      operator_phone: operator.phone,
      venue_name: exam.venue,
    });
    // Online-first (registers the scan server-side + freshest fee/registration
    // status). On a TRANSPORT failure (error === 0, e.g. no network in the hall)
    // fall back to the locally-synced roster so scanning still works offline.
    if (resp.error === 0) {
      const cached = findCachedByExamNo(qr.examNo);
      if (cached) {
        setResult({ student: cached.student, authorized: cached.authorized, source: "cache" });
        appendLog(cached.student, cached.authorized, "cache");
        setScanState({ fetchingOnline: false, processing: false });
        replace("Result");
        return true;
      }
    }
    if (resp.error !== 200 || !resp.data) {
      setScanState({ fetchingOnline: false, processing: false });
      return false; // not found / error → scanner shows "card not recognized"
    }
    const student = verdictToStudent(resp.data);
    const authorized = verdictAuthorized(resp.data);
    osimCacheRef.current.set(student.regId, { student, authorized });
    setLocalCacheCount(osimCacheRef.current.size);
    setResult({ student, authorized, source: "online" });
    appendLog(student, authorized, "online");
    setScanState({ fetchingOnline: false, processing: false });
    replace("Result");
    return true;
  }

  async function onDetected(code: string): Promise<boolean> {
    // OSIM tenant → real exam-card verification only (no mock fallback).
    if (inst.osim) {
      const client = await getOsimClient(inst.id);
      if (!client) {
        setOsimConnected(false);
        console.warn("[OSIM] Scan blocked: no connection (token not loaded). Set .env + `npx expo start -c`.");
        return false;
      }
      setOsimConnected(true);
      return scanWithOsim(code, client);
    }
    const student = fetchStudent(inst, code);
    if (!student) return false;
    proceedWithStudent(student);
    return true;
  }

  function lookupStudent(q: string): Student | null {
    const query = q.trim().toLowerCase();
    if (!query) return null;
    // OSIM tenants: search the locally-cached verdicts by reg-no / exam-no.
    for (const [regId, v] of osimCacheRef.current) {
      if (regId.toLowerCase() === query || v.student.code.toLowerCase() === query) return v.student;
    }
    return fetchStudent(inst, q);
  }

  function simulateScan() {
    const list = inst.students;
    if (list.length === 0) return; // OSIM/live tenant has no mock roster to simulate
    const student = list[queueRef.current % list.length];
    queueRef.current += 1;
    proceedWithStudent(student);
  }

  function openStudent(student: Student) {
    // Prefer the locally-cached OSIM verdict (correct authorized flag).
    const cached = osimCacheRef.current.get(student.regId);
    if (cached) {
      setResult({ student: cached.student, authorized: cached.authorized, source: "cache" });
      navigate("Result");
      return;
    }
    const source: ScanSource = cacheRef.current.has(student.code) ? "cache" : "online";
    setResult({ student, authorized: isAuthorized(student), source });
    navigate("Result");
  }

  function openEntry(e: LogEntry) {
    // Prefer a locally-cached OSIM verdict; fall back to the mock roster.
    const cached = osimCacheRef.current.get(e.regId);
    if (cached) {
      setResult({ student: cached.student, authorized: cached.authorized, source: "cache" });
      navigate("Result");
      return;
    }
    const student = fetchStudent(inst, e.regId);
    if (student) openStudent(student);
  }

  function cancelScan() {
    clearScanTimer();
    setScanState({ fetchingOnline: false, processing: false });
    goBack();
  }

  function doneToHome() {
    goBack(); // Result sits directly above Main → returns to the Home tab
  }

  function openSessionForm() {
    setEditingSession(true);
  }
  function closeSessionForm() {
    setEditingSession(false);
  }
  function saveExam(e: Session) {
    setExam(e);
    setEditingSession(false);
  }

  function logout() {
    // Drop the device's scoped OSIM connections — the next sign-in re-resolves
    // from the directory/secure store for the chosen institution.
    void clearScopedConnections();
    // Clear the active tenant's in-memory roster/history so it can't show up
    // under the next institution the operator signs into.
    resetTenantState();
    resetTo("Institution");
  }

  const value: AppStateValue = {
    inst,
    institutions,
    staff,
    exam,
    session,
    result,
    scanState,
    log,
    stats,
    editingSession,
    operator,
    operatorPrefill,
    localCacheCount,
    osimConnected,
    selectInstitution,
    verifyMembership,
    otpEmail,
    submitOtp,
    resendOtp,
    startSession,
    syncDone,
    runOsimSync,
    startScan,
    scanNext,
    onDetected,
    simulateScan,
    clearScanTimer,
    openStudent,
    openEntry,
    lookupStudent,
    cancelScan,
    doneToHome,
    openSessionForm,
    closeSessionForm,
    saveExam,
    logout,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
