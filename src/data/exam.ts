/* exam.ts — multi-tenant data, shaped like the SaaS API (TS port of data.js).
 * Each institution is a tenant: its own access scope (branding accent + staff)
 * and student roster. In production these helpers become network calls:
 *   • GET /institutions                      → INSTITUTIONS
 *   • POST /auth   {institutionId, staffId}  → scoped session token
 *   • GET /institutions/{id}/students        → synced into the local cache
 *   • GET /students/{code}                   → single record (online fallback) */
import { TENANTS } from "./institutions";

export type ScanSource = "cache" | "online";
export type ScanMethod = "scan" | "lookup";

export interface Student {
  code: string; // value encoded in the QR
  name: string;
  firstName: string;
  gender: string;
  regId: string;
  program: string;
  year: string;
  level: string;
  seat: string;
  photo: string | null;
  balance: number; // balance <= 0 ⇒ authorized
  currency: string;
  cached: boolean; // part of the synced offline cache
  classCode: string;
  semester: string;
  // OSIM verdict extras (present after a live scan / cached verdict)
  admissionStatus?: string;
  examCategory?: string;
  registeredModules?: { module_code: string; module_title: string }[];
}

export interface Session {
  code: string;
  name: string;
  venue: string;
  date: string;
  time: string;
  /** OSIM exam category being scanned (fe, fe-sup, ca, …) + the active semester. */
  examCategory?: string;
  semester?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
}

export interface Institution {
  id: string;
  name: string;
  short: string;
  location: string;
  accent: string;
  recordCount: number;
  session: Session;
  staff: Staff[];
  students: Student[];
  /** true = live OSIM tenant → operator flow + real exam-card scanning. */
  osim?: boolean;
  /** institution logo URL (OSIM serves it at <baseUrl>/themes/img/logo.jpg). */
  logo?: string;
}

export interface LogEntry {
  regId: string;
  name: string;
  gender: string;
  balance: number;
  authorized: boolean;
  at: string;
  seat: string;
  method: ScanMethod;
  source: ScanSource;
}

function S(
  code: string,
  name: string,
  gender: string,
  regId: string,
  program: string,
  year: string,
  level: string,
  seat: string,
  balance: number,
  cached = true
): Student {
  const deg = program.replace(/[^A-Za-z ]/g, "").trim().split(" ")[0].toUpperCase();
  const lvlNum = parseInt((level || "").replace(/\D/g, ""), 10) || 100;
  const intake = String((2026 - Math.floor(lvlNum / 100)) % 100).padStart(2, "0");
  return {
    code,
    name,
    firstName: name.split(" ")[0],
    gender,
    regId,
    program,
    year,
    level,
    seat,
    photo: null,
    balance,
    currency: "$",
    cached,
    classCode: deg + intake + "-SEP",
    semester: "Semester 2",
  };
}

/* Default exam session every tenant starts with (overridden by the operator). */
export function defaultSession(): Session {
  return {
    code: "FE",
    name: "Final Examinations",
    venue: "Main Hall",
    date: new Date().toISOString().slice(0, 10),
    time: "09:00 – 12:00",
    examCategory: "fe",
    semester: "1",
  };
}

/* The college list, derived from the bundled tenant registry (institutions.ts).
 * Every tenant is a live OSIM tenant → operator flow + real exam-card scanning;
 * a tenant only scans once its API key is present (see src/api/osim/config.ts).
 * This whole array becomes a network call once the central directory exists. */
export const INSTITUTIONS: Institution[] = TENANTS.map((t) => ({
  id: t.id,
  name: t.name,
  short: t.short,
  location: t.location,
  accent: t.accent,
  logo: `${t.baseUrl}/themes/img/logo.jpg`,
  recordCount: 0,
  session: defaultSession(),
  staff: [{ id: "operator", name: "Operator", role: "Invigilator" }],
  students: [],
  osim: true,
}));

export function money(symbol: string, n: number): string {
  return symbol + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function getInstitution(id: string): Institution | null {
  return INSTITUTIONS.find((i) => i.id === id) || null;
}

/* Look up a record within a tenant by QR code or registration id. */
export function fetchStudent(inst: Institution | null, codeOrReg: string): Student | null {
  if (!inst) return null;
  const q = (codeOrReg || "").trim().toLowerCase();
  return inst.students.find((s) => s.code.toLowerCase() === q || s.regId.toLowerCase() === q) || null;
}

export function isAuthorized(student: Student | null): boolean {
  return !!student && student.balance <= 0;
}

/* Seed history for a tenant from its first few cached students. */
export function makeSeedLog(inst: Institution): LogEntry[] {
  const times = ["08:52", "08:49", "08:47", "08:41", "08:38"];
  return inst.students
    .filter((s) => s.cached)
    .slice(0, 5)
    .map((s, i) => ({
      regId: s.regId,
      name: s.name,
      gender: s.gender,
      balance: s.balance,
      authorized: s.balance <= 0,
      at: times[i] || "08:30",
      seat: s.seat,
      method: (i % 3 === 1 ? "lookup" : "scan") as ScanMethod,
      source: "cache" as ScanSource,
    }));
}

export const EXAM_DATA = { INSTITUTIONS, money, getInstitution, fetchStudent, isAuthorized, makeSeedLog };
