# ExamPass — central backend database

Schema for the central service that backs the app. It replaces the bundled
`src/data/institutions.ts` registry and stores the cross-tenant audit trail.

> **System-of-record boundary:** per-student and per-staff master data lives in
> each institution's own OSIM database (one `osim_<code>` DB per tenant). This
> central DB holds the **directory + connection records**, the **device registry**,
> and a **denormalized audit snapshot** of what was scanned / authenticated. PII
> written here is for audit, not authority.

## Files

| File | Purpose |
|---|---|
| `schema.sql` | All tables + reference data (`exam_category`). Idempotent reference seeds. |
| `seed_institutions.sql` | The 24 institutions, **generated from `TENANTS`** in `src/data/institutions.ts`. Idempotent upsert. |

## Load order

```bash
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/seed_institutions.sql
```

Target engine: **PostgreSQL 14+**. This is the canonical definition AND exactly
what the local `api/` Docker stack loads on first init (`postgres:16-alpine`) —
one schema, no separate "online" port. The running container on this always-on
server *is* the online database; the app reaches it through the API.

## Tables

**Directory** — `institution` (the college list), `institution_credential`
(per-tenant API keys, encrypted, rotatable), `institution_setting`
(org-specific eligibility knobs).

**Devices & app auth** — `app_device` (registered installs + attestation),
`directory_app_token` (hashed app-level tokens for the directory endpoints).

**Sessions & scans** — `exam_session` (a sitting an operator opens), `scan_log`
(audit core only: institution, session, device, exam_no, reg_no, student_name,
authorized, reason, scanned_at — no derivable/PII-heavy verdict fields).

**Audit** — `auth_log` (sign-in / membership checks), `api_error_log` (OSIM API
**failures only**, no request/response bodies — written only when a call fails).

**Optional** — `institution_staff` (PII cache of `api/staff/all` for centralized
membership checks; drop it if the app queries each tenant directly).

**Reference** — `exam_category` (OSIM exam types), `schema_migrations`.

## Retention / partitioning (keeps `scan_log` flat)

`scan_log` is **range-partitioned by month** on `scanned_at`. Retention is just
dropping old monthly partitions (instant, no VACUUM). A fresh DB seeds the
current ±1..2 months; two helper functions manage the rest:

```sql
SELECT scan_log_ensure_partition(date '2027-02-01');  -- create one month (idempotent)
SELECT scan_log_maintain(18, 2);  -- ensure now+2 months exist, DROP partitions >18 months old
```

Schedule `scan_log_maintain()` **once a month** to make the table self-trimming.
This needs no host changes and no extensions (`pg_cron` isn't in the alpine image):

```bash
# example: monthly via the API host's crontab (adjust retention to taste)
0 3 1 * *  docker exec exampass-db psql -U exampass -d exampass -c "SELECT scan_log_maintain(18,2);"
```

With an 18-month window the table plateaus and stays flat. A `scan_log_default`
partition guarantees a scan write never fails even if maintenance lapses.

## Keeping the seed in sync with the bundle

`seed_institutions.sql` is generated from `TENANTS`. When you edit
`src/data/institutions.ts`, regenerate it so the bundled list and the DB agree.
The generator lives in git history (the command used to produce this file); the
mapping is `TenantInfo` → `institution` column-for-column. Only `stemmuco` and
`makumira` are seeded `active`; the rest are `provisional` (no credential row)
until a key is generated. Entries with `name_confirmed = false` are placeholders
whose display name still needs confirming.

## Handling

- **`institution_credential.api_key_enc`** (`BYTEA`) is stored encoded at rest
  (reversible, so not hashed). Managed by the API via `CRED_ENC_KEY`.
- **`directory_app_token.token_hash`** stores a **SHA-256 hash** — verified,
  never returned.
- **Least privilege:** the listing endpoint (`/institutions`) needs only
  `institution`; the connection endpoint needs `institution_credential`. Grant
  separately.
- **PII:** `scan_log`, `auth_log`, `api_access_log`, `institution_staff` hold
  personal data — set retention/scrub policies; `api_access_log` stores only
  masked tails.
