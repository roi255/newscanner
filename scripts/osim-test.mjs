/* osim-test.mjs — read-only test of the live OSIM exam-card API.
 *
 * Uses api/verification/all_examcards { exam_category } — which server-side
 * auto-resolves the CURRENT academic year + semester and returns the roster
 * (each card has year_id, reg_no, exam_no, fee_balance, registration_status…).
 * This is read-only (no scan registered). We then locate one student and store
 * their verdict locally. Creds in scripts/osim.local.json.
 *
 * Run:  node scripts/osim-test.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { md5 } = require("js-md5");
const { sha1 } = require("js-sha1");

const here = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(readFileSync(path.join(here, "osim.local.json"), "utf8"));
const { baseUrl, token } = cfg;
const examCategory = cfg.exam_category || "fe";

function phpJsonEncode(value) {
  let json = JSON.stringify(value);
  json = json.replace(/\//g, "\\/");
  json = json.replace(/[\u0080-\uffff]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
  return json;
}
const checksum = (tok, data) => sha1(md5(tok + phpJsonEncode(data)));

async function call(rel, requestData) {
  const body = { token, checksum: checksum(token, requestData), requestData };
  const url = `${baseUrl.replace(/\/+$/, "")}/${rel}`;
  const t0 = Date.now();
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    /* XML/error */
  }
  return { http: r.status, status: json?.status ?? null, data: json?.responseData ?? null, raw: json ? undefined : text.slice(0, 300), ms: Date.now() - t0 };
}

// If we have full scan params (year_id), do the targeted examcard verify;
// otherwise fall back to the read-only current-year roster sync.
if (cfg.examNo && String(cfg.year_id || "").length) {
  const payload = {
    studentID: cfg.examNo,
    year_id: String(cfg.year_id),
    semester: String(cfg.semester),
    exam_category: examCategory,
    device_id: "exampass-test",
    operator_name: "ExamPass API Test",
    operator_phone: "0000000000",
    venue_name: "ExamPass API Test",
  };
  console.log(`examcard verify → ${baseUrl}\n${JSON.stringify(payload, null, 2)}\n`);
  const r = await call("api/verification/examcard", payload);
  console.log(`http=${r.http} status=${JSON.stringify(r.status)} ms=${r.ms}`);
  if (r.raw) console.log("raw:", r.raw);
  if (r.data) {
    console.log(`\n✓ VERDICT:\n${JSON.stringify(r.data, null, 2)}`);
    writeFileSync(path.join(here, "osim-pulled-student.json"), JSON.stringify({ pulledAt: new Date().toISOString(), verdict: r.data }, null, 2));
    console.log(`\n✓ Stored → scripts/osim-pulled-student.json`);
  }
  process.exit(0);
}

console.log(`OSIM read-only sync → ${baseUrl}  category=${examCategory}\n`);
const res = await call("api/verification/all_examcards", { exam_category: examCategory });
console.log(`http=${res.http} status=${JSON.stringify(res.status)} ms=${res.ms}`);
if (res.raw) console.log("raw:", res.raw);

const list = Array.isArray(res.data) ? res.data : res.data?.data;
if (Array.isArray(list)) {
  console.log(`✓ Roster pulled: ${list.length} cards`);
  writeFileSync(path.join(here, "osim-examcards.json"), JSON.stringify({ pulledAt: new Date().toISOString(), count: list.length, cards: list }, null, 2));

  const wantExam = (cfg.examNo || "").toLowerCase();
  const wantReg = (cfg.studentId || "").toLowerCase();
  const hit = list.find(
    (c) =>
      (wantExam && String(c.exam_no || "").toLowerCase() === wantExam) ||
      (wantReg && String(c.reg_no || "").toLowerCase() === wantReg)
  );
  if (hit) {
    console.log(`\n✓ Found student:\n${JSON.stringify(hit, null, 2)}`);
    writeFileSync(path.join(here, "osim-pulled-student.json"), JSON.stringify({ pulledAt: new Date().toISOString(), verdict: hit }, null, 2));
    console.log(`\nyear_id = ${hit.year_id ?? hit.academic_year_id ?? "(see record)"}`);
  } else {
    console.log("\n(student not found in this category — try a different exam_category)");
    console.log("sample record keys:", list[0] ? Object.keys(list[0]).join(", ") : "(empty)");
  }
} else {
  console.log("No roster array returned.");
}
