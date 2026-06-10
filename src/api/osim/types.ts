/* OSIM app-API types — mirror the contract in osim/application/controllers/
 * apiapp.php + api.php (request envelope, response envelope, identity, and the
 * exam-permit eligibility inputs ported from
 * application/views/student/data_examination_cards_semester.php). */

/** Per-institution connection. baseUrl identifies the institution (one OSIM
 * deployment = one institution); abbr is the expected org_abbr. The access
 * token is NOT here — it's minted by staff login (see session.ts) and kept in
 * the secure store. `apiKey` is optional and only used by the dev static
 * fallback (a raw pre-shared key for local testing). */
export interface OsimConnection {
  baseUrl: string; // e.g. https://sis.institution.ac.tz
  abbr: string; // expected org_abbr — confirms we reached the right tenant
  apiKey?: string; // DEV-ONLY raw key; production uses staff-login tokens
}

/** Short-lived, rotatable session minted by staff login. */
export interface OsimSession {
  accessToken: string; // used as the envelope token for data calls
  refreshToken: string; // rotates the access token (and itself)
  expiresAt: number; // epoch ms when accessToken expires
  identity: OsimIdentity; // org identity returned at login (tenant binding)
  staffId: string;
}

/** POST body OSIM expects (apiapp.php verifyRequest). */
export interface OsimEnvelope<T = unknown> {
  token: string;
  checksum: string;
  requestData: T;
}

/** Standard response envelope: { data, error, message } (apiapp.php flush). */
export interface OsimResponse<T = unknown> {
  data: T | null;
  error: number; // 200 ok · 401/402/403 auth · 404 not found · 504 no record · 0 transport
  message: string;
}

/** Institution identity the server stamps into auth/registerDevice responses
 * (apiapp.php:78-80, 156-158) — org_abbr / org_name. */
export interface OsimIdentity {
  instid: string; // = org_abbr
  instabbr: string; // = org_abbr
  instname: string; // = org_name
  instremote?: string | null;
}

/** Subset of student/basicInformation (getStudentInformation). */
export interface OsimStudent {
  registration_number: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  gender?: string;
  profile_photo?: string | null; // base64
  programme_name?: string;
  programme_code?: string;
  current_class_code?: string;
  current_year_of_study?: string;
  current_nta_level?: string;
  registration_status?: string; // "Registered" | "Not Registered"
  fee_sponsor_name?: string;
  admission_year?: string;
}

/** Inputs to the exam-permit eligibility rule (ported from the view). Ideally
 * OSIM computes this server-side and returns ExamPermitVerdict directly. */
export interface ExamEnrollment {
  orgAbbr: string;
  regConfirmStatus: number; // 1 = semester registration confirmed
  feeRequiredAmount: number;
  feeAmountPaid: number;
  studentLoanAmount: number;
  registeredCredit: number;
  requiredCredit: number;
  examCategory: string; // fe | fe-sup | fe-sp | ca | ca2 | ...
  isCarryOrRetake?: boolean; // dartu FE exception
  semesterNumericValue: number;
  programFeePlan: { planNo: number; semesterId: number; amount: number }[];
}

export interface ExamPermitVerdict {
  authorized: boolean;
  reason: string;
  fee: { required: number; paid: number; balance: number };
}

/* ---- Real OSIM exam-card scanner contract (api.php verification/<method>) ---- */

/** Parsed from the exam-card QR:
 *  [exam(<cat>),studentid(<exam_no>),year(<year_id>),sem(<sem>),ver(<verifyUrl>)] */
export interface ExamCardQR {
  examCategory: string; // fe | fe-sup | fe-sp | ca | ca2
  examNo: string; // the exam number (this is the scan's studentID)
  yearId: string;
  semester: string;
  verifyUrl: string; // <base>/api/verification/examcard/
}

/** requestData for POST api/verification/examcard (registers the scan). */
export interface ExamCardScanInput {
  studentID: string; // = examNo from the QR
  year_id: string;
  semester: string | number;
  exam_category: string;
  device_id: string;
  operator_name: string;
  operator_phone: string;
  venue_name: string;
}

/** responseData from getExamCardVerification — the scan verdict. */
export interface ExamCardVerdict {
  exam_no: string;
  reg_no: string;
  profile_photo: string;
  exam_category: string;
  award_title: string;
  award_code: string;
  index_number: string;
  admission_status: string;
  student_name: string;
  gender: string;
  mobile_number: string;
  email_address: string;
  fee_balance: number;
  class_code: string;
  semester: string;
  yos: string;
  year: string;
  registration_status: string; // "Registered" | "Not-Registered" ⇒ authorized
  reg_confirm_date: string;
  reg_confirm_status: number;
  registered_modules?: ExamModule[] | null;
}

export interface ExamModule {
  module_code: string;
  module_title: string;
  credit_point?: string;
}
