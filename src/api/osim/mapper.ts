/* mapper.ts — map a live OSIM ExamCardVerdict onto the app's Student shape +
 * the Authorized/Not-Authorized decision used by the result screen. */
import { ExamCardVerdict } from "./types";
import { Student } from "../../data/exam";

function normalizeGender(g: string): string {
  const v = (g || "").toLowerCase();
  if (v === "f" || v === "female") return "Female";
  if (v === "m" || v === "male") return "Male";
  return g || "";
}

export function verdictToStudent(v: ExamCardVerdict): Student {
  return {
    code: v.exam_no,
    name: v.student_name,
    firstName: (v.student_name || "").trim().split(/\s+/)[0] || v.student_name,
    gender: normalizeGender(v.gender),
    regId: v.reg_no,
    program: v.award_title,
    year: v.yos,
    level: v.yos,
    seat: "",
    photo: v.profile_photo || null,
    balance: Number(v.fee_balance) || 0,
    currency: "TZS ",
    cached: true,
    classCode: v.class_code,
    semester: `Semester ${v.semester}`,
    admissionStatus: v.admission_status,
    examCategory: v.exam_category,
    registeredModules: Array.isArray(v.registered_modules)
      ? v.registered_modules.map((m) => ({ module_code: m.module_code, module_title: m.module_title }))
      : [],
  };
}

/** OSIM authorization: eligible to sit ⇔ registration confirmed + fees cleared. */
export function verdictAuthorized(v: ExamCardVerdict): boolean {
  return (v.registration_status || "").toLowerCase() === "registered";
}

/** Map a roster/enrollment record (students-by-year) to a Student. Lenient —
 * field names vary by endpoint; missing fields fall back gracefully. */
export function enrollmentToStudent(e: Record<string, any>): Student | null {
  const reg = e.reg_no || e.registration_number || e.regId;
  if (!reg) return null;
  const name = [e.first_name, e.middle_name, e.last_name].filter(Boolean).join(" ") || e.student_name || e.name || reg;
  return {
    code: e.exam_no || reg,
    name,
    firstName: String(name).trim().split(/\s+/)[0] || name,
    gender: normalizeGender(e.gender || ""),
    regId: reg,
    program: e.programme_name || e.award_title || e.course_name || "",
    year: e.year_of_study || e.yos || "",
    level: e.nta_level || e.current_nta_level || "",
    seat: "",
    photo: e.photo || e.profile_photo || null,
    balance: Number(e.fee_balance) || 0,
    currency: "TZS ",
    cached: true,
    classCode: e.class_code || "",
    semester: e.semester ? `Semester ${e.semester}` : "",
  };
}

/** Roster authorization from the enrollment record's registration_status. */
export function enrollmentAuthorized(e: Record<string, any>): boolean {
  return String(e.registration_status || "").toLowerCase() === "registered";
}
