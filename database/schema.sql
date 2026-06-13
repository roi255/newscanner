-- ============================================================================
--  ExamPass — central backend schema
-- ----------------------------------------------------------------------------
--  Engine : PostgreSQL 14+
--  Purpose: the central service that backs the React Native app. It replaces
--           the bundled src/data/institutions.ts registry and stores the
--           cross-tenant audit trail. This file is BOTH what the local
--           postgres container loads on init AND the canonical online
--           definition — one schema, no porting later.
--
--  Tenant note: per-student/per-staff master data lives in each institution's
--  own OSIM database. This central DB holds the directory + connection details,
--  the device registry, and a denormalized audit trail. PII here is a SNAPSHOT
--  for audit, not a system of record.
--
--  Load order:  schema.sql  →  seed_institutions.sql
--  Notes      : see database/README.md (handling, PII, least-privilege).
-- ============================================================================

-- updated_at auto-touch (Postgres has no MySQL-style ON UPDATE CURRENT_TIMESTAMP)
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ============================================================================
--  A.  DIRECTORY  — the college list + how to reach each tenant
-- ============================================================================

-- A.1  institution — the registry (safe to list/search).
--      Maps 1:1 onto TenantInfo in src/data/institutions.ts.
CREATE TABLE institution (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code           VARCHAR(40)  NOT NULL UNIQUE,          -- stable slug; app Institution.id
  name           VARCHAR(200) NOT NULL,
  short_name     VARCHAR(12)  NOT NULL,                 -- logo text
  org_abbr       VARCHAR(40)  NOT NULL UNIQUE,          -- expected org_abbr; client.ts checks it
  location       VARCHAR(120),
  accent         CHAR(7)      NOT NULL DEFAULT '#1f6f4a' CHECK (accent ~ '^#[0-9A-Fa-f]{6}$'),
  base_url       VARCHAR(255) NOT NULL,                 -- no trailing slash
  logo_url       VARCHAR(255),                          -- NULL => derive base_url + /themes/img/logo.jpg
  db_name        VARCHAR(64),                           -- ops ref, e.g. osim_stemmuco
  status         VARCHAR(16)  NOT NULL DEFAULT 'provisional'
                   CHECK (status IN ('active','inactive','provisional')),
  name_confirmed BOOLEAN      NOT NULL DEFAULT false,   -- the // TODO confirm flag
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_institution_status ON institution(status);
CREATE TRIGGER trg_institution_updated BEFORE UPDATE ON institution
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- A.2  institution_credential — per-tenant connection credential (rotatable).
--      Kept in its own table, out of the listing endpoint.
--      One ACTIVE row per (tenant, environment); revoked rows kept as history.
CREATE TABLE institution_credential (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  institution_id BIGINT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  environment    VARCHAR(8) NOT NULL DEFAULT 'prod' CHECK (environment IN ('dev','prod')),
  api_key_enc    BYTEA NOT NULL,                        -- stored encoded, not in the clear
  key_hint       VARCHAR(8),                            -- last few chars, ops identification only
  status         VARCHAR(8) NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  expires_at     TIMESTAMPTZ,
  rotated_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_cred_institution ON institution_credential(institution_id);
-- partial unique index = at most one active key per (institution, environment)
CREATE UNIQUE INDEX uq_one_active_per_env
  ON institution_credential(institution_id, environment) WHERE status = 'active';
CREATE TRIGGER trg_cred_updated BEFORE UPDATE ON institution_credential
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- A.3  institution_setting — institution-configurable knobs (org-specific
--      exam-permit rules in eligibility.ts: tuma 70% threshold, dartu carry…).
CREATE TABLE institution_setting (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  institution_id BIGINT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  setting_key    VARCHAR(64) NOT NULL,
  setting_value  JSONB NOT NULL,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (institution_id, setting_key)
);
CREATE TRIGGER trg_setting_updated BEFORE UPDATE ON institution_setting
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
--  B.  DEVICES & APP-LEVEL AUTH
-- ============================================================================

-- B.1  app_device — every install that registers (session.ts getDeviceId).
CREATE TABLE app_device (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  device_uid          VARCHAR(80) NOT NULL UNIQUE,      -- stable on-device id (e.g. dev-xxxx)
  platform            VARCHAR(10) NOT NULL DEFAULT 'unknown'
                        CHECK (platform IN ('android','ios','web','unknown')),
  model               VARCHAR(120),
  app_version         VARCHAR(32),
  push_token          VARCHAR(255),
  attestation         VARCHAR(12) NOT NULL DEFAULT 'unverified'
                        CHECK (attestation IN ('unverified','verified','rejected')),
  status              VARCHAR(8)  NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked')),
  last_institution_id BIGINT REFERENCES institution(id) ON DELETE SET NULL,
  first_seen_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT now()  -- app sets on each register
);
CREATE INDEX ix_device_last_inst ON app_device(last_institution_id);

-- B.2  directory_app_token — app-level credentials for the directory endpoints
--      (directory.ts appToken). Stored HASHED (verified, never returned).
CREATE TABLE directory_app_token (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        VARCHAR(80) NOT NULL,                     -- label, e.g. "android-release"
  token_hash  CHAR(64) NOT NULL UNIQUE,                 -- sha256 hex of the bearer token
  scopes      VARCHAR(255) NOT NULL DEFAULT 'directory:list',
  status      VARCHAR(8) NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
--  C.  EXAM SESSIONS & OPERATORS
-- ============================================================================

-- C.1  exam_session — a sitting an operator opens; scans group under it.
CREATE TABLE exam_session (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  institution_id  BIGINT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  device_id       BIGINT REFERENCES app_device(id) ON DELETE SET NULL,
  exam_code       VARCHAR(16)  NOT NULL DEFAULT 'FE',
  exam_name       VARCHAR(120) NOT NULL DEFAULT 'Final Examinations',
  exam_category   VARCHAR(16)  NOT NULL,                -- fe | ca | ca2 | fe-sp | fe-sup | …
  semester        VARCHAR(8),
  year_id         VARCHAR(16),
  venue_name      VARCHAR(120),
  exam_date       DATE,
  start_time      TIME,
  end_time        TIME,
  operator_name   VARCHAR(120),
  operator_phone  VARCHAR(40),
  opened_by       VARCHAR(120),                         -- staff login_id / name
  status          VARCHAR(8) NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  opened_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at       TIMESTAMPTZ
);
CREATE INDEX ix_session_inst ON exam_session(institution_id, opened_at);

-- ============================================================================
--  D.  SCAN LOG  — every exam-card verification (immutable audit snapshot)
-- ============================================================================

-- D.1  scan_log — the AUDIT CORE only: who scanned which student, when, in which
--      sitting/device, and the verdict. Everything else from the OSIM verdict
--      (gender, phone, email, award, modules, fees, registration fields, venue,
--      operator, semester/year) is DROPPED — it's derivable, PII-heavy, or lives
--      on exam_session. Keeps the table tiny across exam seasons. `student_name`
--      is the one PII kept, so an audit row is human-readable without re-querying
--      OSIM. `decision_reason` records WHY a denial happened (for disputes).
-- PARTITIONED BY MONTH on scanned_at. Retention = DROP old monthly partitions
-- (instant, no VACUUM/bloat), so the table stays flat across exam seasons.
-- The partition key must be in the PK, hence PK (id, scanned_at).
CREATE TABLE scan_log (
  id               BIGINT GENERATED ALWAYS AS IDENTITY,
  institution_id   BIGINT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  exam_session_id  BIGINT REFERENCES exam_session(id) ON DELETE SET NULL,
  device_id        BIGINT REFERENCES app_device(id) ON DELETE SET NULL,

  exam_no          VARCHAR(40) NOT NULL,             -- the scanned QR id (the physical card)
  reg_no           VARCHAR(40),                      -- resolved student identity
  exam_category    VARCHAR(16) NOT NULL,             -- fe | ca | … (denormalized; session also has it)
  student_name     VARCHAR(160),                     -- the only PII kept (readable audit)

  authorized       BOOLEAN NOT NULL,                 -- the verdict
  decision_reason  VARCHAR(255),                     -- why (esp. for denials / disputes)
  method           VARCHAR(8) NOT NULL DEFAULT 'scan'   CHECK (method IN ('scan','lookup')),
  source           VARCHAR(8) NOT NULL DEFAULT 'online' CHECK (source IN ('cache','online')),
  seat             VARCHAR(24),

  scanned_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, scanned_at)
) PARTITION BY RANGE (scanned_at);

-- Indexes on the parent propagate to every partition automatically.
CREATE INDEX ix_scan_inst_time ON scan_log(institution_id, scanned_at);
CREATE INDEX ix_scan_session   ON scan_log(exam_session_id);
CREATE INDEX ix_scan_reg_no    ON scan_log(institution_id, reg_no);

-- Safety net so a write can NEVER fail if its month's partition is missing.
CREATE TABLE scan_log_default PARTITION OF scan_log DEFAULT;

-- Create one monthly partition (idempotent), named scan_log_YYYYMM.
CREATE OR REPLACE FUNCTION scan_log_ensure_partition(p_month date) RETURNS void AS $$
DECLARE
  start_d date := date_trunc('month', p_month)::date;
  end_d   date := (date_trunc('month', p_month) + interval '1 month')::date;
  part    text := 'scan_log_' || to_char(start_d, 'YYYYMM');
BEGIN
  IF to_regclass('public.' || part) IS NULL THEN
    EXECUTE format('CREATE TABLE %I PARTITION OF scan_log FOR VALUES FROM (%L) TO (%L);',
                   part, start_d, end_d);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Maintenance: ensure current + next `ahead` months exist, and DROP monthly
-- partitions older than `retain` months. Schedule monthly (see database/README.md).
CREATE OR REPLACE FUNCTION scan_log_maintain(retain_months int DEFAULT 18, ahead_months int DEFAULT 2)
RETURNS void AS $$
DECLARE
  m      int;
  r      record;
  cutoff date := (date_trunc('month', now()) - make_interval(months => retain_months))::date;
BEGIN
  FOR m IN 0..ahead_months LOOP
    PERFORM scan_log_ensure_partition((date_trunc('month', now()) + make_interval(months => m))::date);
  END LOOP;
  FOR r IN
    SELECT c.relname
    FROM pg_inherits i
    JOIN pg_class c ON c.oid = i.inhrelid
    JOIN pg_class p ON p.oid = i.inhparent
    WHERE p.relname = 'scan_log' AND c.relname ~ '^scan_log_\d{6}$'
  LOOP
    IF to_date(right(r.relname, 6), 'YYYYMM') < cutoff THEN
      EXECUTE format('DROP TABLE %I;', r.relname);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Seed partitions around "now" so a fresh DB is immediately ready.
DO $$
DECLARE m int;
BEGIN
  FOR m IN -1..2 LOOP
    PERFORM scan_log_ensure_partition((date_trunc('month', now()) + make_interval(months => m))::date);
  END LOOP;
END $$;

-- ============================================================================
--  E.  AUDIT LOGS  — authentication events + API failures (lean by design)
-- ============================================================================

-- E.1  auth_log — sign-in / membership-verification events.
CREATE TABLE auth_log (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  institution_id  BIGINT REFERENCES institution(id) ON DELETE SET NULL,
  device_id       BIGINT REFERENCES app_device(id) ON DELETE SET NULL,
  event_type      VARCHAR(20) NOT NULL
                    CHECK (event_type IN ('membership_check','staff_login','token_refresh','logout')),
  result          VARCHAR(8)  NOT NULL CHECK (result IN ('success','failure')),
  email           VARCHAR(160),
  login_id        VARCHAR(120),
  staff_name      VARCHAR(160),
  staff_role      VARCHAR(80),
  reason          VARCHAR(255),
  ip_address      INET,
  user_agent      VARCHAR(255),
  at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_auth_inst_time ON auth_log(institution_id, at);
CREATE INDEX ix_auth_email     ON auth_log(email);

-- E.2  api_error_log — OSIM API FAILURES only. The app writes a row ONLY when a
--      call fails (status_code <> 200). Full request/response bodies are NOT
--      stored (they were the #1 bloat source — KBs per call). Just enough to
--      diagnose: which call, which tenant/device, the code, and a short message.
--      Successful calls and the verbose device-side trail stay on the device
--      (accessLog.ts keeps the last 200 in memory) — never centralized.
CREATE TABLE api_error_log (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  institution_id  BIGINT REFERENCES institution(id) ON DELETE SET NULL,
  device_id       BIGINT REFERENCES app_device(id) ON DELETE SET NULL,
  title           VARCHAR(160) NOT NULL,                -- OSIM method path, e.g. verification/examcard
  status_code     INTEGER NOT NULL,                     -- the failing code (401/404/504/0)
  duration_ms     INTEGER,
  message         VARCHAR(255),                         -- short error message; NO payloads
  at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_error_inst_time ON api_error_log(institution_id, at);

-- E.3  otp_challenge — short-lived email OTP, the second factor AFTER the live
--      OSIM membership check. Code stored hashed, single-use, with expiry + an
--      attempt cap. Rows are disposable (no retention concern).
CREATE TABLE otp_challenge (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  institution_id BIGINT REFERENCES institution(id) ON DELETE CASCADE,
  email          VARCHAR(160) NOT NULL,
  code_hash      CHAR(64) NOT NULL,        -- sha256(lower(email) + ':' + code)
  expires_at     TIMESTAMPTZ NOT NULL,
  attempts       SMALLINT NOT NULL DEFAULT 0,
  consumed_at    TIMESTAMPTZ,              -- set once verified; single-use
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_otp_lookup ON otp_challenge(email, created_at DESC);

-- ============================================================================
--  F.  OPTIONAL CACHE  — staff membership (PII; drop if not centralizing)
-- ============================================================================

-- F.1  institution_staff — optional cache of api/staff/all for the email check.
CREATE TABLE institution_staff (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  institution_id  BIGINT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  reg_code        VARCHAR(40),
  login_id        VARCHAR(120),
  employee_id     VARCHAR(40),
  first_name      VARCHAR(80),
  middle_name     VARCHAR(80),
  last_name       VARCHAR(80),
  salutation      VARCHAR(24),
  gender          VARCHAR(16),
  email           VARCHAR(160),
  phone           VARCHAR(40),
  department      VARCHAR(120),
  department_code VARCHAR(40),
  teaching_level  VARCHAR(40),
  role            VARCHAR(80),
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (institution_id, email)
);
CREATE INDEX ix_staff_login ON institution_staff(institution_id, login_id);

-- ============================================================================
--  G.  REFERENCE DATA
-- ============================================================================

-- G.1  exam_category — OSIM exam types (examTypes.ts). `selectable` = shown in the form.
CREATE TABLE exam_category (
  code        VARCHAR(16) PRIMARY KEY,
  label       VARCHAR(80) NOT NULL,
  selectable  BOOLEAN NOT NULL DEFAULT false,
  sort_order  INTEGER NOT NULL DEFAULT 0
);
INSERT INTO exam_category (code, label, selectable, sort_order) VALUES
  ('fe',      'Final Exam (UE)',   true,  10),
  ('ca',      'Mid-Semester (CW)', true,  20),
  ('fe-sp',   'FE (Special Exam)', true,  30),
  ('fe-sup',  'FE Supplementary',  true,  40),
  ('ca2',     'Mid-Semester (CW)', false, 50),
  ('ca-sup',  'CA Supplementary',  false, 60),
  ('re-sup',  '2nd Supplementary', false, 70),
  ('re-sup3', '3rd Supplementary', false, 80),
  ('re-sup4', '4th Supplementary', false, 90),
  ('cat',     'Course Attendance', false, 100)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE schema_migrations (
  version    VARCHAR(32) PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO schema_migrations (version) VALUES ('0001_initial') ON CONFLICT DO NOTHING;
