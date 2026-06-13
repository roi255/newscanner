/* examTypes.ts — OSIM exam categories. We surface the types invigilators
 * actually scan; ca/ca2 are both shown as one "Mid-Semester (CW)". Retakes /
 * carries are the student's class_mode (verdict.admission_status), not a type.
 *
 * The list now comes from the directory (`exam_category` table) and is hydrated
 * at startup via hydrateExamCategories(); the values below are the bundled
 * fallback for offline / first run. Read through getSelectableExamTypes() and
 * examCategoryLabel() so callers always see the current set. */

export interface ExamType {
  value: string; // exam_category sent to OSIM
  label: string;
}

/** Bundled selectable types (Session form). Mid-Semester (CW) covers ca + ca2. */
const BUNDLED_SELECTABLE: ExamType[] = [
  { value: "fe", label: "Final Exam (UE)" },
  { value: "ca", label: "Mid-Semester (CW)" },
  { value: "fe-sp", label: "FE (Special Exam)" },
  { value: "fe-sup", label: "FE Supplementary" },
];

/** Bundled label map (covers every category the QR/verdict might carry). */
const BUNDLED_LABELS: Record<string, string> = {
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

let selectable: ExamType[] = BUNDLED_SELECTABLE;
let labels: Record<string, string> = BUNDLED_LABELS;

/** Bundled list, exported for back-compat. Prefer getSelectableExamTypes(). */
export const EXAM_TYPES = BUNDLED_SELECTABLE;

/** The selectable types for the Session form (live set once hydrated). */
export function getSelectableExamTypes(): ExamType[] {
  return selectable;
}

export function examCategoryLabel(cat?: string): string {
  const v = (cat || "").toLowerCase();
  return labels[v] ?? (cat || "—");
}

/** Replace the in-memory category set from the directory (selectable + labels). */
export function hydrateExamCategories(cats: { code: string; label: string; selectable: boolean }[]): void {
  if (!cats.length) return;
  labels = Object.fromEntries(cats.map((c) => [c.code.toLowerCase(), c.label]));
  selectable = cats.filter((c) => c.selectable).map((c) => ({ value: c.code, label: c.label }));
}
