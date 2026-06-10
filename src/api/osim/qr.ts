/* qr.ts — parse the OSIM exam-card QR payload.
 *
 * Real STEMMUCO format (abbreviated keys), e.g.:
 *   [exm(fe),std(BAED-2512287786),yr(22),sem()]
 *     exm = exam category   std = exam number   yr = year_id   sem = semester
 *
 * Older/long form ([exam(...),studentid(...),year(...),sem(...),ver(...)]) is
 * also accepted. Note: `sem` and `ver` may be empty/absent on real cards — the
 * scanner supplies the semester from the session when the QR omits it. */
import { ExamCardQR } from "./types";

export function parseExamCardQr(raw: string): ExamCardQR | null {
  if (!raw) return null;

  // Match `key(value)` only when the key starts after [ , whitespace or string start.
  const field = (...keys: string[]): string => {
    for (const key of keys) {
      const m = raw.match(new RegExp(`(?:^|[\\[,\\s])${key}\\(([^)]*)\\)`, "i"));
      if (m) return m[1].trim();
    }
    return "";
  };

  const qr: ExamCardQR = {
    examCategory: field("exm", "exam"),
    examNo: field("std", "studentid"),
    yearId: field("yr", "year"),
    semester: field("sem"),
    verifyUrl: field("ver"),
  };

  // The exam number is the one field we can't scan without.
  if (!qr.examNo) return null;
  return qr;
}
