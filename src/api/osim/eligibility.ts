/* eligibility.ts — ports the exam-permit "can the student print the card" rule
 * from osim/application/views/student/data_examination_cards_semester.php
 * (lines ~193-256). A student is AUTHORIZED to sit the exam iff they're eligible
 * to print the exam permit.
 *
 * IMPORTANT: this logic is institution-configurable and lives server-side in
 * OSIM. The robust integration is a dedicated OSIM endpoint that returns the
 * verdict (see client.getExamPermit). This client-side port is the reference /
 * fallback that derives the verdict from raw fee + registration fields. */
import { ExamEnrollment, ExamPermitVerdict } from "./types";

export function evaluateExamPermit(e: ExamEnrollment): ExamPermitVerdict {
  const org = (e.orgAbbr || "").toLowerCase();

  // Student loans count toward fees paid — except for 'tuma' (handled per-branch).
  let paid = e.feeAmountPaid;
  let required = e.feeRequiredAmount;
  if (org !== "tuma") paid += e.studentLoanAmount;

  const fee = (req: number) => ({ required: req, paid, balance: Math.max(0, req - paid) });

  // Module registration must be complete before any card is issued.
  if (e.registeredCredit < e.requiredCredit) {
    return { authorized: false, reason: "Module registration incomplete", fee: fee(required) };
  }

  const cat = (e.examCategory || "").toLowerCase();
  let allowed = false;
  let reason = "Eligible — exam permit can be printed";

  if (cat === "fe" || cat === "fe-sup" || cat === "fe-sp") {
    // Final exam: full payment required.
    if (org === "dartu" && e.isCarryOrRetake) {
      return { authorized: false, reason: "Carry/Retake — final exam card not issued", fee: fee(required) };
    }
    allowed = (required === 0 && e.regConfirmStatus === 1) || (e.regConfirmStatus === 1 && paid >= required);
    if (!allowed) reason = "Pay full semester fees to access the exam card";
  } else if (cat === "ca" || cat === "ca2") {
    // Continuous assessment: first-installment threshold via payment plan.
    let req = required;
    if (org === "tuma") req = required - e.studentLoanAmount;

    const plans = e.programFeePlan || [];
    if (plans.length > 0 && paid < req) {
      for (const plan of plans) {
        if (plans.length > 1 && plan.semesterId === e.semesterNumericValue && plan.planNo === 1) {
          allowed = req > 0 ? paid / req >= (org === "tuma" ? 0.7 : 0.4) : false;
        } else if (plans.length === 1 && plan.semesterId === e.semesterNumericValue) {
          allowed = paid >= plan.amount;
        }
      }
    } else {
      allowed = paid >= req || (req > 0 && paid / req >= 0.5);
    }
    required = req;
    if (!allowed) reason = `Pay at least ${org === "tuma" ? "70%" : "40%"} (first installment) of semester fees`;
  } else {
    // Other categories: require confirmed registration + cleared fees.
    allowed = e.regConfirmStatus === 1 && (required === 0 || paid >= required);
    if (!allowed) reason = "Complete registration and clear fees";
  }

  return { authorized: allowed, reason, fee: fee(required) };
}
