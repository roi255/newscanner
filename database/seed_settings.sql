-- seed_settings.sql — institution_setting rows for org-specific exam-permit rules
-- (ported out of src/api/osim/eligibility.ts). Keyed off org_abbr so each rule
-- lands on whichever institution(s) carry that abbreviation. Idempotent.
--
-- Defaults when an institution has NO 'eligibility' row (see eligibility.ts):
--   feeLoanCounts = true, caThreshold = 0.40, caDeductLoan = false,
--   blockCarryRetakeFe = false.

-- Tumaini (org_abbr TUMA): student loans do NOT count toward fees paid; the CA
-- first-installment threshold is 70%; loan amount is deducted from CA required.
INSERT INTO institution_setting (institution_id, setting_key, setting_value)
SELECT id, 'eligibility',
       '{"feeLoanCounts": false, "caThreshold": 0.70, "caDeductLoan": true}'::jsonb
FROM institution WHERE lower(org_abbr) = 'tuma'
ON CONFLICT (institution_id, setting_key)
  DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- DARTU: carry/retake students are not issued a final-exam card.
INSERT INTO institution_setting (institution_id, setting_key, setting_value)
SELECT id, 'eligibility',
       '{"blockCarryRetakeFe": true}'::jsonb
FROM institution WHERE lower(org_abbr) = 'dartu'
ON CONFLICT (institution_id, setting_key)
  DO UPDATE SET setting_value = EXCLUDED.setting_value;
