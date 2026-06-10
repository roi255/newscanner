/* examTypes.ts — OSIM exam categories. We surface the four types invigilators
 * actually scan; ca/ca2 are both shown as one "Mid-Semester (CW)". Retakes /
 * carries are the student's class_mode (verdict.admission_status), not a type. */

export interface ExamType {
  value: string; // exam_category sent to OSIM
  label: string;
}

/** The four selectable exam types (Session form). Mid-Semester (CW) is the only
 * bundle — it covers both CW-1 (ca) and CW-2 (ca2); the others are 1:1. */
export const EXAM_TYPES: ExamType[] = [
  { value: "fe", label: "Final Exam (UE)" }, // own category: fe
  { value: "ca", label: "Mid-Semester (CW)" }, // bundles ca (CW-1) + ca2 (CW-2)
  { value: "fe-sp", label: "FE (Special Exam)" }, // own category: fe-sp
  { value: "fe-sup", label: "FE Supplementary" }, // own category: fe-sup
];

/** Full label map (covers every category the QR/verdict might carry). */
const LABELS: Record<string, string> = {
  fe: "Final Exam (UE)",
  ca: "Mid-Semester (CW)",
  ca2: "Mid-Semester (CW)",
  "fe-sp": "FE (Special Exam)",
  "fe-sup": "FE Supplementary",
  "ca-sup": "CA Supplementary",
  "re-sup": "2nd Supplementary",
  "re-sup3": "3rd Supplementary",
  "re-sup4": "4th Supplementary",
  cat: "Course Attendance",
};

export function examCategoryLabel(cat?: string): string {
  const v = (cat || "").toLowerCase();
  return LABELS[v] ?? (cat || "—");
}
