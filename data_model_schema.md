# US Tax — Normalized SQL Schema (Phase 2b)

Target DB: **Azure SQL Database Serverless** (`ustaxdb`), accessed via Hibernate ORM
from the Quarkus backend. Tax year 2025.

Design choices already made:

1. **Full normalization** across input, statement, and output domains (~177 tables).
2. **Per-archetype personal-form tables** (~25 archetypes, not 50 legacy form IDs)
   with an `owner_role` discriminator merging taxpayer / spouse / dependent
   variants of the same logical form.
3. **Opaque IRS PDF-slot keys translated to semantic column names** before DDL
   (affects Forms 6252, 6781, 4684, 4797, 8824, K-1 family, etc.).
4. **All computed-output forms get tables** — no JSON-blob "tax_return" payload.

This document is the **entity catalog**. ER diagrams live in `data_model_er.md`.
DDL generation and Hibernate `@Entity` classes are Step 5 (deferred).

Source inventories: `data_model.md`, `data_model_personal_identity.md`,
`data_model_personal_credits.md`, `data_model_personal_income.md`,
`data_model_statements.md`, `data_model_output_1040.md`,
`data_model_output_specialforms.md`.

---

## 0. Conventions

### 0.1 Naming

- `snake_case`, singular nouns.
- **Domain prefixes** to keep `INFORMATION_SCHEMA.TABLES` browsable:
  - `app_user`, `profile`, `dependent`, `user_message`, `support_request` — core, no prefix
  - `pf_*` — personal forms (input)
  - `se_*` — statement entries (input)
  - `out_*` — tax-return computation outputs
  - `tax_return` — single output anchor row per user
- Child collections of an output form table use the parent name as prefix:
  `out_form_8949_transaction`, `out_form_2441_care_provider`, etc.

### 0.2 Primary keys

| Pattern | When | Example |
|---|---|---|
| Natural PK `uid NVARCHAR(128) PRIMARY KEY` | tables with one row per user | `app_user.uid`, `profile.uid`, `tax_return.uid` |
| Surrogate `id BIGINT IDENTITY(1,1) PRIMARY KEY` | everything else | `dependent.id`, `pf_identification.id`, `out_form_1040.id` |
| Composite child PK `(parent_id, idx)` | preserve persistence order of `List<T>` children | `out_form_8949_transaction(parent_id, idx)` |

Where a child collection's element order is meaningful (e.g. Form 8949
transactions are referenced by row index from elsewhere), the child table
carries an `idx INT NOT NULL` column with a unique constraint on
`(parent_id, idx)`.

### 0.3 Foreign keys

- `uid NVARCHAR(128)` references `app_user(uid)` on tables scoped to a single user.
- `<parent>_id BIGINT` references the parent table's surrogate PK.
- `dependent_id BIGINT` references `dependent(id)` on rows scoped to a dependent.
- ON DELETE CASCADE for every FK that points to a parent that, when deleted,
  invalidates the child. (Mirrors the existing `UserDataService` cascade.)
- ON UPDATE NO ACTION (Firebase UIDs do not mutate).

### 0.4 Common columns

Every persisted row carries:

| Column | Type | Default | Purpose |
|---|---|---|---|
| `created_at` | `DATETIMEOFFSET NOT NULL` | `SYSUTCDATETIME()` | Insert audit |
| `updated_at` | `DATETIMEOFFSET NOT NULL` | `SYSUTCDATETIME()` | Update audit (trigger or app-set) |

Audit columns are omitted from per-table specs below to keep them readable.

### 0.5 Owner discriminator

Forms that vary by person use:

```sql
owner_role NVARCHAR(16) NOT NULL
  CONSTRAINT ck_<table>_owner_role CHECK (owner_role IN ('taxpayer','spouse','dependent'))
```

For dependent-scoped rows, `dependent_id` is `NOT NULL`; for taxpayer/spouse,
it is `NULL`. The unique key is then:

```sql
UNIQUE (uid, owner_role, dependent_id)
```

This collapses the `users/{uid}/personal/<form>-{taxpayer,spouse,dependent}/` and
`users/{uid}/dependents/{depId}/personal/<form>/` Firestore paths into one
schema shape.

### 0.6 Data types

| Logical | SQL Server | Notes |
|---|---|---|
| Money | `DECIMAL(19,4)` | Matches `java.math.BigDecimal` use in output models; precision allows aggregate computations without overflow. |
| Percent / rate | `DECIMAL(7,4)` | e.g. F2210 daily-rate constants |
| Boolean (tri-state) | `BIT NULL` | NULL = unanswered; UI uses three-state radios pervasively |
| Boolean (strict) | `BIT NOT NULL` | Only where business logic disallows null |
| Date | `DATE` | All UI dates normalize to ISO `YYYY-MM-DD` |
| Timestamp | `DATETIMEOFFSET` | UTC; covers `created_at`, `updated_at`, `computed_at` |
| Short text | `NVARCHAR(100)` | Names, occupations, single-line free text |
| Long text | `NVARCHAR(MAX)` | Notes, descriptions, JSON overflow columns |
| Enum | `NVARCHAR(N) CHECK (col IN (...))` | Inline CHECK; lookup table only when shared across ≥3 tables |
| SSN / ITIN | `NVARCHAR(11)` | Format `NNN-NN-NNNN` (dashes preferred for display); see §0.7 PII |
| EIN | `NVARCHAR(10)` | Format `NN-NNNNNNN` |
| IRS IP PIN | `NVARCHAR(6)` | 6 digits; see PII |
| US state code | `NCHAR(2)` | FK to `ref_us_state` lookup |
| Country | `NVARCHAR(2)` | ISO 3166-1 alpha-2; FK to `ref_country` |
| ZIP | `NVARCHAR(10)` | `NNNNN` or `NNNNN-NNNN` |
| Money string with notes | two columns: `<box>_amount DECIMAL(19,4)`, `<box>_notes NVARCHAR(MAX)` | Preserves the printed-annotation pattern dominant across 1099 statements |

### 0.7 PII handling (deferred to ops, but schema-tagged)

Columns containing taxpayer-identifying data are tagged in this document with
**[PII]** for downstream Always Encrypted / column-master-key configuration.
At minimum:

- `app_user.uid` is NOT PII (opaque Firebase identifier).
- `profile.email`, `profile.phone` are PII.
- All SSN / ITIN / EIN columns.
- All `date_of_birth`, `IP PIN`, account numbers, full names.

Schema design does not block on this — Always Encrypted can be applied post-hoc
once we choose a key store. Mark in comments; revisit before production.

### 0.8 Indexes (baseline)

Every FK gets a non-clustered index automatically (Hibernate generates these).
Beyond that:

- `app_user(email)` UNIQUE WHERE NOT NULL — supports duplicate-account checks.
- `support_request(status, created_at)` — supports the support inbox view.
- `tax_return(uid)` UNIQUE — one return per user (cardinality assumption from
  `data_model.md` §1).

Domain-specific indexes are noted alongside each table.

### 0.9 Reference / lookup tables

| Table | Rows | Purpose |
|---|---|---|
| `ref_us_state` | ~54 | `(code NCHAR(2) PK, name NVARCHAR(100), kind NVARCHAR(16))` — kind ∈ `state`,`district`,`territory`. Reconciles the two divergent UI state lists. |
| `ref_country` | ~250 | `(iso2 NVARCHAR(2) PK, name NVARCHAR(100))` — replaces the ~190-entry free-text country list. |
| `ref_filing_status` | 5 | `(code NVARCHAR(8) PK, label NVARCHAR(64))` — `S, MFJ, MFS, HOH, QSS`. |
| `ref_relationship` | ~16 | Dependent relationship enum (Son, Daughter, Stepchild, …, Other). |
| `ref_statement_form` | ~41 | `(form_id NVARCHAR(32) PK, irs_form NVARCHAR(16), display_name NVARCHAR(100), category NVARCHAR(32))` — mirrors `StatementFormCatalog.java`. |
| `ref_personal_form` | ~25 | Archetype catalog with `requires_owner_role BIT`, `is_dependent_scoped BIT`. |

---

## 1. Core entities

These five tables anchor the schema. Everything else FKs back to `app_user.uid`
either directly or transitively.

### 1.1 `app_user`

The natural-key table; every other per-user row joins through `uid`.

| Column | Type | Null | Constraint | Notes |
|---|---|---|---|---|
| `uid` | `NVARCHAR(128)` | NO | PK | Firebase Auth UID |
| `created_at` | `DATETIMEOFFSET` | NO | default `SYSUTCDATETIME()` | First-touch timestamp |
| `last_login_at` | `DATETIMEOFFSET` | YES | — | Optional; not currently tracked but reserved |

No data persisted today is unique to `app_user` — Firestore implicitly created
the user as soon as any sub-document was written. We materialize it here so
every FK has a target.

### 1.2 `profile` — typed taxpayer profile (1:1 with `app_user`)

Source: `Profile.java` (`model.profile`).

| Column | Type | Null | Constraint | Notes |
|---|---|---|---|---|
| `uid` | `NVARCHAR(128)` | NO | PK, FK → app_user(uid) ON DELETE CASCADE | 1:1 |
| `first_name` | `NVARCHAR(100)` | NO | `@NotBlank` upstream | [PII] |
| `last_name` | `NVARCHAR(100)` | NO | `@NotBlank` | [PII] |
| `email` | `NVARCHAR(255)` | NO | `@Email`, UNIQUE (filtered: WHERE email IS NOT NULL) | [PII] |
| `phone` | `NVARCHAR(25)` | YES | — | [PII] |
| `address_line_1` | `NVARCHAR(200)` | YES | — | [PII] |
| `address_line_2` | `NVARCHAR(200)` | YES | — | [PII] |
| `city` | `NVARCHAR(100)` | YES | — | |
| `state` | `NVARCHAR(100)` | YES | — | Free text in current code; do NOT FK to `ref_us_state` yet — profile.state predates the lookup |
| `postal_code` | `NVARCHAR(20)` | YES | — | |

Index: `IX_profile_phone (phone) WHERE phone IS NOT NULL` — supports the
phone-based lookup in `ProfileService.findByPhone()`.

### 1.3 `dependent`

Source: `DependentRecord.java` / `DependentInput.java`.

| Column | Type | Null | Constraint | Notes |
|---|---|---|---|---|
| `id` | `BIGINT IDENTITY` | NO | PK | |
| `uid` | `NVARCHAR(128)` | NO | FK → app_user(uid) ON DELETE CASCADE | |
| `legacy_doc_id` | `NVARCHAR(40)` | YES | UNIQUE (uid, legacy_doc_id) WHERE legacy_doc_id IS NOT NULL | Firestore auto-id, retained for migration only |
| `first_name` | `NVARCHAR(100)` | YES | — | [PII] |
| `middle_initial` | `NVARCHAR(1)` | YES | — | |
| `last_name` | `NVARCHAR(100)` | YES | — | [PII] |
| `ssn` | `NVARCHAR(11)` | YES | — | [PII]; format `NNN-NN-NNNN` |
| `date_of_birth` | `DATE` | YES | — | [PII] |
| `relationship` | `NVARCHAR(32)` | YES | CHECK / FK → ref_relationship(code) | |
| `qualifies_for_ctc` | `BIT` | YES | — | Tri-state |
| `qualifies_for_odc` | `BIT` | YES | — | |
| `is_full_time_student` | `BIT` | YES | — | |
| `is_permanently_and_totally_disabled` | `BIT` | YES | — | |
| `child_lived_with_taxpayer` | `BIT` | YES | — | |
| `months_lived_with_taxpayer` | `TINYINT` | YES | CHECK (0..12) | |
| `child_lived_with_taxpayer_in_usa` | `BIT` | YES | — | |
| `child_lived_with_other_parent` | `BIT` | YES | — | |
| `is_qualifying_child_of_another_taxpayer` | `BIT` | YES | — | |

Index: `IX_dependent_uid (uid, id)` — supports the per-user listing query.

### 1.4 `user_message`

Source: `UserMessage.java`. Server-pushed messages; user cannot create.

| Column | Type | Null | Constraint | Notes |
|---|---|---|---|---|
| `id` | `BIGINT IDENTITY` | NO | PK | |
| `uid` | `NVARCHAR(128)` | NO | FK → app_user(uid) ON DELETE CASCADE | |
| `subject` | `NVARCHAR(200)` | YES | — | |
| `body` | `NVARCHAR(MAX)` | YES | — | Capped at 10k chars upstream |
| `created_at` | `DATETIMEOFFSET` | NO | default `SYSUTCDATETIME()` | |
| `read_at` | `DATETIMEOFFSET` | YES | — | Reserved; UI does not surface yet |

Index: `IX_user_message_uid_created (uid, created_at DESC)` — chronological list.

### 1.5 `support_request`

Source: `SupportRequest.java`. Global (not user-scoped) — uid denormalized.

| Column | Type | Null | Constraint | Notes |
|---|---|---|---|---|
| `id` | `BIGINT IDENTITY` | NO | PK | |
| `uid` | `NVARCHAR(128)` | YES | FK → app_user(uid) ON DELETE SET NULL | Denormalized for audit; if user deleted, request is retained |
| `subject` | `NVARCHAR(200)` | NO | `@NotBlank` | |
| `message` | `NVARCHAR(MAX)` | NO | `@NotBlank` | Capped at 5000 chars upstream |
| `user_name` | `NVARCHAR(200)` | YES | — | Snapshot at submit time [PII] |
| `user_phone` | `NVARCHAR(25)` | YES | — | Snapshot [PII] |
| `user_email` | `NVARCHAR(255)` | YES | — | Snapshot [PII] |
| `status` | `NVARCHAR(32)` | NO | CHECK IN (`open`,`in_progress`,`resolved`), default `'open'` | |
| `created_at` | `DATETIMEOFFSET` | NO | default `SYSUTCDATETIME()` | |

Index: `IX_support_request_status_created (status, created_at DESC)` — inbox sort.

### 1.6 Cascade summary

```
app_user
  ├─ profile               (1:1, CASCADE)
  ├─ dependent             (1:N, CASCADE) ─┐
  ├─ user_message          (1:N, CASCADE)  │
  ├─ tax_return            (1:1, CASCADE)  │ (§6)
  ├─ pf_*                  (1:N, CASCADE)  ├─ dependent-scoped pf_* / out_form_8814_child reference here
  ├─ se_*                  (1:N, CASCADE)  │
support_request            (denormalized; CASCADE SET NULL)
```

---

## 2. Personal forms — Identity domain

Source inventory: `data_model_personal_identity.md` (8 legacy form IDs).

Per the "per-archetype + person column" decision, these 8 legacy forms collapse
into **5 target tables** plus migration rules.

### 2.1 Reconciliation rules (legacy → target)

| Legacy form ID | Target table | Notes |
|---|---|---|
| `you` | `pf_identification` (owner_role='taxpayer') + `pf_address` | Welcome screen; superseded by split forms. Migration copies non-empty fields. |
| `identification-taxpayer` | `pf_identification` (taxpayer) | Primary source |
| `identification-spouse` | `pf_identification` (spouse) | Field name artifact `spouseFirstNamefirstName` migrates to `first_name` |
| `address-taxpayer` | `pf_address` | Household address; no spouse variant exists |
| `spouse` (legacy short form) | `pf_identification` (spouse) | Strict subset of `identification-spouse` — migration only |
| `filing-status` | `pf_filing_status` | Household-level, no owner_role |
| `digital-assets` (legacy generic) | `pf_digital_assets` (spouse) | Was wired to spouse in shell; field `hadDigitalAssetActivity` → `had_activity` |
| `digital-assets-taxpayer` | `pf_digital_assets` (taxpayer) | Field `digitalAssetsYes` → `had_activity` |
| `digital-assets-spouse` | `pf_digital_assets` (spouse) | Field `hadDigitalAssetActivity` → `had_activity` |

### 2.2 `pf_identification`

One row per `(uid, owner_role)` — taxpayer or spouse only (never dependent;
dependents use the `dependent` table).

| Column | Type | Null | Constraint | Notes |
|---|---|---|---|---|
| `id` | `BIGINT IDENTITY` | NO | PK | |
| `uid` | `NVARCHAR(128)` | NO | FK → app_user(uid) CASCADE | |
| `owner_role` | `NVARCHAR(16)` | NO | CHECK IN (`taxpayer`,`spouse`) | No dependent variant |
| `first_name` | `NVARCHAR(100)` | YES | — | [PII] |
| `middle_initial` | `NVARCHAR(1)` | YES | — | |
| `last_name` | `NVARCHAR(100)` | YES | — | [PII] |
| `ssn` | `NVARCHAR(11)` | YES | CHECK regex `[0-9]{3}-[0-9]{2}-[0-9]{4}` | [PII] |
| `date_of_birth` | `DATE` | YES | — | [PII] |
| `occupation` | `NVARCHAR(100)` | YES | — | |
| `identity_protection_pin` | `NVARCHAR(6)` | YES | CHECK regex `[0-9]{6}` | [PII] |
| `extra_payload_json` | `NVARCHAR(MAX)` | YES | — | Forward-compat overflow from the `[key:string]: unknown` index signature; null after first migrated save |

UNIQUE (uid, owner_role).

### 2.3 `pf_address`

Household address (only taxpayer fills this in the current UI). No owner_role
column — there is one address per return.

| Column | Type | Null | Constraint | Notes |
|---|---|---|---|---|
| `id` | `BIGINT IDENTITY` | NO | PK | |
| `uid` | `NVARCHAR(128)` | NO | FK → app_user(uid) CASCADE; UNIQUE | 1:1 enforced |
| `is_foreign_address` | `BIT` | YES | — | Tri-state |
| `is_main_home_in_usa` | `BIT` | YES | — | |
| `street_address` | `NVARCHAR(200)` | YES | — | [PII] |
| `apartment_number` | `NVARCHAR(40)` | YES | — | |
| `city` | `NVARCHAR(100)` | YES | — | |
| `state_code` | `NCHAR(2)` | YES | FK → ref_us_state(code) | US-only |
| `zip_code` | `NVARCHAR(10)` | YES | — | |
| `foreign_country` | `NVARCHAR(2)` | YES | FK → ref_country(iso2) | Forced to ISO2 during migration (current free-text mostly matches country names — needs cleanup) |
| `foreign_province_state_county` | `NVARCHAR(100)` | YES | — | |
| `foreign_postal_code` | `NVARCHAR(20)` | YES | — | |
| `email_address` | `NVARCHAR(255)` | YES | — | [PII]; duplicates `profile.email` — household address email, not auth email |
| `phone_number` | `NVARCHAR(40)` | YES | — | [PII] |
| `extra_payload_json` | `NVARCHAR(MAX)` | YES | — | Overflow |

Application-level rule: when `is_foreign_address=0`, US branch fields are
required; when `=1`, foreign branch fields are required. Enforced in the
service layer, not via DB CHECK (would require column-conditional checks SQL
Server doesn't support cleanly).

### 2.4 `pf_digital_assets`

| Column | Type | Null | Constraint | Notes |
|---|---|---|---|---|
| `id` | `BIGINT IDENTITY` | NO | PK | |
| `uid` | `NVARCHAR(128)` | NO | FK → app_user(uid) CASCADE | |
| `owner_role` | `NVARCHAR(16)` | NO | CHECK IN (`taxpayer`,`spouse`) | |
| `had_activity` | `BIT` | YES | — | Tri-state; reconciles `digitalAssetsYes` and `hadDigitalAssetActivity` |

UNIQUE (uid, owner_role).

### 2.5 `pf_filing_status`

| Column | Type | Null | Constraint | Notes |
|---|---|---|---|---|
| `uid` | `NVARCHAR(128)` | NO | PK, FK → app_user(uid) CASCADE | 1:1 |
| `filing_status` | `NVARCHAR(8)` | YES | FK → ref_filing_status(code) | Codes: `S`, `MFJ`, `MFS`, `HOH`, `QSS` (normalized from the long phrases in current code) |
| `spouse_name_if_mfs` | `NVARCHAR(200)` | YES | — | [PII] |
| `qualifying_child_name_if_hoh_or_qss` | `NVARCHAR(200)` | YES | — | [PII]; non-dependent child |
| `treating_nonresident_spouse_as_us_resident` | `BIT` | YES | — | |
| `nonresident_spouse_name` | `NVARCHAR(200)` | YES | — | [PII] |

---

## 3. Personal forms — Credits & Deductions domain

Source inventory: `data_model_personal_credits.md` (28 legacy form IDs → 13
archetypes + 6 child tables). Two structural shapes:

- **Group A — symmetric T/S**: single component fills both taxpayer and spouse
  documents with identical field set. Tables: `pf_standard_deductions`,
  `pf_form4852`.
- **Group B — asymmetric T/S**: taxpayer document carries the full Form 8X
  return-level fields; spouse document carries `spouse_has_inputs` gate plus a
  small contribution-only field set. Modeled as ONE archetype table where most
  columns are nullable; the `spouse_*` contribution and `spouse_has_inputs`
  fields are nullable columns that only the spouse row populates.
- **Group C — return-level only**: no owner_role.
  Tables: `pf_investment_interest_expense` (Form 4952).

For brevity, columns below are grouped by IRS form area. Every column is
nullable unless marked NOT NULL; every monetary column is `DECIMAL(19,4)`;
every tri-state boolean is `BIT NULL`. All tables include the standard
`id`, `uid`, `created_at`, `updated_at` columns described in §0.

### 3.1 `pf_standard_deductions`

Discriminator: `owner_role NVARCHAR(16) NOT NULL CHECK IN ('taxpayer','spouse')`.

Columns (28):

| Group | Columns |
|---|---|
| Election | `deduction_election` (`AUTO`/`STANDARD`/`ITEMIZED`, NOT NULL default `AUTO`), `someone_can_claim_you`, `someone_can_claim_spouse`, `you_were_dual_status_alien`, `spouse_itemizes_separate_return` (MFS only) |
| Age / blind | `you_born_before_threshold`, `you_are_blind`, `spouse_born_before_threshold`, `spouse_is_blind`, `spouse_meets_age_blindness_mfs_requirements` |
| Worksheet | `dependent_standard_deduction_earned_income DECIMAL(19,4)` |
| Itemized amounts (Schedule A inputs; only meaningful when `deduction_election='ITEMIZED'`) | `medical_dental_expenses_paid`, `state_local_tax_choice` (`Income`/`Sales`), `state_local_income_taxes_paid`, `state_local_sales_taxes_paid`, `real_estate_taxes_paid`, `personal_property_taxes_paid`, `home_mortgage_interest_paid`, `home_mortgage_points_paid`, `investment_interest_paid`, `net_investment_income`, `charitable_cash_contributions`, `charitable_non_cash_contributions`, `personal_casualty_and_theft_loss`, `foreign_taxes_paid`, `other_allowed_itemized_deductions`, `net_qualified_disaster_loss`, `elect_disaster_loss_standard_deduction_increase BIT` |

UNIQUE (uid, owner_role). Schedule A inputs are stored only on the
`taxpayer` row (application-level rule; SQL allows them on `spouse` too for
forward compat).

### 3.2 `pf_investment_interest_expense` (Form 4952)

Return-level — no owner_role column. UNIQUE on `uid`.

Columns (24):

| Group | Columns |
|---|---|
| Gate | `needs_form_4952 BIT NULL` |
| Upload checks (5 fields) | `received_interest_dividend_statements`, `uploaded_interest_dividend_statements`, `received_capital_gain_statements`, `uploaded_capital_gain_statements`, `received_schedule_k1_with_investment_interest_or_income`, `uploaded_schedule_k1_with_investment_interest_or_income`, `confirm_all_received_investment_support_uploaded` |
| Form 4952 amounts | `investment_interest_expense_paid_line1 DECIMAL(19,4)`, `disallowed_investment_interest_from_2024_line2`, `gross_income_from_property_held_for_investment_line4a`, `qualified_dividends_included_line4b`, `net_gain_from_disposition_line4d`, `net_capital_gain_limit`, `investment_expenses_line5` |
| Line 4g election | `elect_to_include_qualified_dividends_or_capital_gain_line4g BIT`, `elected_investment_income_amount_line4g`, `elected_line4e_amount_attributed_to_line4g`, `line4g_election_notes NVARCHAR(MAX)` |
| Allocation portions (3 boolean + 3 amount pairs) | `has_royalties_portion BIT`, `royalties_portion_amount`, `has_non_passive_business_portion BIT`, `non_passive_business_portion_amount`, `has_at_risk_activity_portion BIT`, `at_risk_activity_portion_amount` |
| Joint allocation | `has_joint_or_community_account_allocation_issue BIT`, `joint_or_community_account_allocation_notes NVARCHAR(MAX)` |
| AMT | `requires_amt_investment_interest_recompute BIT` |

### 3.3 `pf_education_credits` + child `pf_education_student`

Discriminator: `owner_role` ∈ (`taxpayer`,`spouse`).

`pf_education_credits` (parent):

| Group | Columns |
|---|---|
| Gate | `claims_education_credits_on_return BIT`, `received_any_1098t`, `uploaded_all_1098t`, `using_alternative_enrollment_documentation`, `confirm_all_education_support_uploaded` |
| AOTC restrictions | `aotc_previously_denied`, `refundable_aotc_restriction_applies` |
| MAGI add-backs | `has_magi_add_backs BIT`, `magi_add_back_puerto_rico DECIMAL(19,4)`, `magi_add_back_form2555_excluded`, `magi_add_back_form2555_housing`, `magi_add_back_form4563_excluded` |
| Notes | `education_credits_return_notes NVARCHAR(MAX)` |
| Spouse-only gate | `spouse_has_additional_students BIT` (NULL on taxpayer row) |

UNIQUE (uid, owner_role).

`pf_education_student` (child of `pf_education_credits`):

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `parent_id BIGINT NOT NULL` | FK → pf_education_credits(id) CASCADE | |
| `idx INT NOT NULL` | array index | UNIQUE (parent_id, idx) |
| `student_first_name`, `student_last_name` | NVARCHAR(100) | [PII] |
| `student_tin` | NVARCHAR(11) | [PII] SSN/ITIN |
| `student_relationship` | NVARCHAR(32) | enum: `taxpayer`/`spouse`/`dependent`/`other_eligible_student` |
| `credit_type` | NVARCHAR(8) | `aotc`/`llc` |
| `adjusted_qualified_education_expenses` | DECIMAL(19,4) | |
| `tax_free_education_assistance_reduction` | DECIMAL(19,4) | |
| `education_support_notes` | NVARCHAR(MAX) | |
| `institution1_name`, `institution1_address` | NVARCHAR(200) | |
| `institution1_ein` | NVARCHAR(10) | |
| `institution1_received_1098t` | BIT | |
| `institution1_prior_year_box7_checked` | BIT | |
| `has_second_institution` | BIT | |
| `institution2_name`, `institution2_address` | NVARCHAR(200) | |
| `institution2_ein` | NVARCHAR(10) | |
| `institution2_received_1098t` | BIT | |
| `institution2_prior_year_box7_checked` | BIT | |
| `aotc_claimed_four_prior_years` | BIT | AOTC-only |
| `student_was_at_least_half_time` | BIT | AOTC-only |
| `student_completed_first_four_years_before_2025` | BIT | AOTC-only |
| `student_had_felony_drug_conviction` | BIT | AOTC-only |

### 3.4 `pf_energy_credit` + child `pf_energy_credit_item` (Form 5695)

Discriminator: `owner_role` ∈ (`taxpayer`,`spouse`).

`pf_energy_credit` (parent, ~45 columns):

| Group | Columns |
|---|---|
| Gate | `claims_energy_credit_on_return BIT`, `confirm_all_energy_support_uploaded BIT`, `spouse_has_energy_credit_inputs BIT` (spouse row only), `spouse_separate_main_home_for_part_ii BIT` (spouse row only) |
| Part I selector | `claims_residential_clean_energy_credit BIT` |
| Part I — Residential Clean Energy | `line1_solar_electric_costs DECIMAL(19,4)`, `line2_solar_water_heating_costs`, `line3_small_wind_energy_costs`, `line4_geothermal_heat_pump_costs`, `line5_battery_capacity_at_least_3kwh BIT`, `line5_battery_storage_costs`, `line7a_fuel_cell_installed_on_main_home_in_us BIT`, `line7b_fuel_cell_main_home_address NVARCHAR(MAX)`, `line7c_fuel_cell_joint_occupants BIT`, `line8_fuel_cell_property_costs`, `line10_fuel_cell_capacity_kw DECIMAL(10,4)`, `line12_prior_year_carryforward`, `additional_residence_addresses_text NVARCHAR(MAX)` |
| Part II selector | `claims_energy_efficient_home_improvement_credit BIT` |
| Part II — Home Improvement gates | `part2_installed_on_main_home_in_us BIT`, `part2_original_user BIT`, `part2_five_year_use BIT`, `main_home_address NVARCHAR(MAX)`, `part2_related_to_construction BIT`, `installed_qualified_energy_property BIT`, `qualified_energy_property_original_user BIT`, `qualified_energy_property_residence_addresses_text NVARCHAR(MAX)`, `enabling_property_installed_same_year BIT`, `enabled_property_code NVARCHAR(40)`, `qualified_audit BIT`, `joint_occupants BIT`, `condominium_or_cooperative BIT` |
| Part II — amount fields | `insulation_air_sealing_costs DECIMAL(19,4)`, `other_door_costs`, `other_window_costs`, `central_air_other_costs`, `water_heater_other_costs`, `furnace_boiler_other_costs`, `enabling_property_costs`, `enabling_property_qmids_text NVARCHAR(MAX)`, `home_energy_audit_costs`, `other_heat_pump_costs`, `other_heat_pump_water_heater_costs`, `other_biomass_costs` |

UNIQUE (uid, owner_role).

`pf_energy_credit_item` (child — consolidates 8 separate UI arrays into one
table via category discriminator; this normalizes the
`doorItems/windowItems/centralAirItems/waterHeaterItems/furnaceBoilerItems/heatPumpItems/heatPumpWaterHeaterItems/biomassItems`
arrays):

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `parent_id BIGINT NOT NULL` | FK → pf_energy_credit(id) CASCADE | |
| `category` | NVARCHAR(32) NOT NULL | CHECK IN (`door`,`window`,`central_air`,`water_heater`,`furnace_boiler`,`heat_pump`,`heat_pump_water_heater`,`biomass`) |
| `idx INT NOT NULL` | array index | |
| `description` | NVARCHAR(200) | |
| `qmid` | NVARCHAR(40) | Qualified Manufacturer Identifier |
| `cost` | DECIMAL(19,4) | |

UNIQUE (parent_id, category, idx).

### 3.5 `pf_clean_car_credit` + child `pf_clean_car_vehicle` (Form 8936)

Discriminator: `owner_role` ∈ (`taxpayer`,`spouse`).

`pf_clean_car_credit` (parent):

| Column | Type | Notes |
|---|---|---|
| `claims_clean_car_credit_on_return` | BIT | |
| `confirm_seller_reports_and_support_ready` | BIT | |
| `current_year_additional_magi_addbacks` | DECIMAL(19,4) | |
| `prior_year_magi` | DECIMAL(19,4) | MAGI lookback |
| `spouse_has_clean_car_credit_inputs` | BIT | spouse row only |

UNIQUE (uid, owner_role).

`pf_clean_car_vehicle` (child — VehicleEntry):

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `parent_id BIGINT NOT NULL` | FK CASCADE | |
| `idx INT NOT NULL` | UNIQUE (parent_id, idx) | |
| `vehicle_nickname` | NVARCHAR(100) | |
| `credit_path` | NVARCHAR(32) | enum `new`/`previously-owned`/`commercial` |
| `vehicle_year` | INT | |
| `vehicle_make`, `vehicle_model` | NVARCHAR(64) | |
| `vehicle_vin` | NVARCHAR(17) | [PII] |
| `vehicle_placed_in_service_date`, `vehicle_acquired_date` | DATE | |
| `seller_report_received` | BIT | |
| `credit_transferred_to_dealer` | BIT | |
| `transferred_credit_amount` | DECIMAL(19,4) | |
| `resold_within_30_days` | BIT | |
| `new_vehicle_acquired_for_use_or_lease_not_resale` | BIT | new path |
| `new_vehicle_tentative_credit_amount` | DECIMAL(19,4) | |
| `business_use_percentage` | DECIMAL(5,2) | 0..100 |
| `previously_owned_acquired_for_use_not_resale` | BIT | previously-owned path |
| `previously_owned_sales_price` | DECIMAL(19,4) | |
| `previously_owned_claimed_in_prior_3_years` | BIT | |
| `previously_owned_can_be_claimed_as_dependent` | BIT | |

### 3.6 `pf_alt_fuel_credit` + child `pf_alt_fuel_property` (Form 8911)

`pf_alt_fuel_credit` (parent):

| Column | Type | Notes |
|---|---|---|
| `claims_alt_fuel_credit_on_return` | BIT | |
| `confirm_eligible_census_tract_support_ready` | BIT | |
| `passthrough_refueling_property_credit` | DECIMAL(19,4) | |
| `spouse_has_alt_fuel_credit_inputs` | BIT | spouse row only |
| `spouse_passthrough_refueling_property_credit_contribution` | DECIMAL(19,4) | spouse row only |

UNIQUE (uid, owner_role).

`pf_alt_fuel_property` (child — PropertyEntry):

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `parent_id BIGINT NOT NULL` | FK CASCADE | |
| `idx INT NOT NULL` | UNIQUE (parent_id, idx) | |
| `property_nickname`, `registration_number`, `property_description`, `owner_name_tin_if_different`, `property_location` | NVARCHAR(200) | |
| `construction_began_date`, `placed_in_service_date` | DATE | |
| `eligible_census_tract` | BIT | |
| `eligible_census_tract_geoid` | NVARCHAR(40) | |
| `certification_permit_number` | NVARCHAR(64) | |
| `property_cost` | DECIMAL(19,4) | |
| `business_investment_use_percentage` | DECIMAL(5,2) | 0..100 |
| `section_179_deduction` | DECIMAL(19,4) | |
| `pwa_requirements_met` | BIT | prevailing-wage / apprenticeship |
| `installed_at_main_home` | BIT | |
| `original_use_begins_with_taxpayer` | BIT | |
| `used_predominantly_outside_us` | BIT | |

### 3.7 `pf_bond_credit` + children `pf_bond_1097btc` and `pf_bond_direct` (Form 8912)

`pf_bond_credit` (parent):

| Column | Type | Notes |
|---|---|---|
| `claims_bond_credit` | BIT | |
| `prior_year_carryforward_credit` | DECIMAL(19,4) | |
| `spouse_has_bond_credit_inputs` | BIT | spouse row only |
| `spouse_prior_year_carryforward_contribution` | DECIMAL(19,4) | spouse row only |

UNIQUE (uid, owner_role).

`pf_bond_1097btc` (child — Bond1097Entry): `id`, `parent_id` FK CASCADE,
`idx`, `issuer_name NVARCHAR(200)`, `issuer_ein NVARCHAR(10)`,
`unique_identifier NVARCHAR(64)`, `credit_amount DECIMAL(19,4)`.

`pf_bond_direct` (child — DirectBondEntry):

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `parent_id BIGINT NOT NULL` | FK CASCADE | |
| `idx INT NOT NULL` | UNIQUE (parent_id, idx) | |
| `bond_type` | NVARCHAR(64) | issuer-defined enum |
| `issuer_name` | NVARCHAR(200) | |
| `issuer_city_state` | NVARCHAR(200) | |
| `issuer_ein` | NVARCHAR(10) | |
| `issue_date`, `maturity_date`, `disposal_date` | DATE | |
| `cusip_or_payment_dates` | NVARCHAR(100) | |
| `basis_amount` | DECIMAL(19,4) | |
| `credit_rate_percent` | DECIMAL(7,4) | |
| `allocation_percentage` | DECIMAL(7,4) | |
| `line19_base_credit_amount` | DECIMAL(19,4) | |

### 3.8 `pf_electric_vehicle_credit`

Small table; discriminator: `owner_role`.

| Column | Type | Notes |
|---|---|---|
| `claims_electric_vehicle_credit` | BIT | |
| `confirm_released_qev_credit_available` | BIT | taxpayer row |
| `released_qev_passive_activity_credit` | DECIMAL(19,4) | taxpayer row |
| `spouse_has_electric_vehicle_credit_inputs` | BIT | spouse row |
| `spouse_released_qev_passive_activity_credit_contribution` | DECIMAL(19,4) | spouse row |

UNIQUE (uid, owner_role).

### 3.9 `pf_mortgage_interest_credit` (Form 8396)

Discriminator: `owner_role`.

| Group | Columns |
|---|---|
| Gate | `claims_mortgage_interest_credit BIT`, `has_qualified_mcc BIT`, `main_home_within_mcc_jurisdiction BIT`, `interest_paid_to_related_person BIT`, `spouse_has_mortgage_interest_credit_inputs BIT` (spouse row), `spouse_mortgage_interest_paid_contribution DECIMAL(19,4)` (spouse row) |
| MCC info | `mcc_certificate_number NVARCHAR(64)`, `mcc_home_address NVARCHAR(MAX)`, `certificate_credit_rate_percent DECIMAL(7,4)` |
| Amounts | `total_mortgage_interest_paid DECIMAL(19,4)`, `certified_mortgage_interest_paid_override`, `certified_indebtedness_amount`, `original_mortgage_amount`, `non_spouse_owner_share_percent DECIMAL(7,4)` |
| Carryforwards | `carryforward_2022_from_2024_line16 DECIMAL(19,4)`, `carryforward_2023_from_2024_line14`, `carryforward_2024_from_2024_line17` |

UNIQUE (uid, owner_role).

### 3.10 `pf_carryforward_homebuyer_credit` (Form 8859)

Discriminator: `owner_role`.

| Column | Type | Notes |
|---|---|---|
| `claims_carryforward_homebuyer_credit` | BIT | |
| `confirm_prior_year_form_8859_available` | BIT | |
| `prior_year_form_8859_line4_carryforward` | DECIMAL(19,4) | |
| `use_schedule_8812_credit_limit_worksheet_b_override` | BIT | |
| `schedule_8812_credit_limit_worksheet_b_line14_override` | DECIMAL(19,4) | |
| `spouse_has_carryforward_homebuyer_credit_inputs` | BIT | spouse row |
| `spouse_prior_year_carryforward_contribution` | DECIMAL(19,4) | spouse row |

UNIQUE (uid, owner_role).

### 3.11 `pf_prior_min_tax_credit` (Form 8801)

Discriminator: `owner_role`.

| Group | Columns |
|---|---|
| Gate | `claims_prior_min_tax_credit BIT`, `confirm_prior_year_returns_available BIT`, `spouse_has_prior_min_tax_credit_inputs BIT` (spouse row) |
| Prior-year inputs | `prior_year_filing_status` (FK ref_filing_status), `prior_year_form_6251_line1_plus_2e DECIMAL(19,4)`, `prior_year_exclusion_item_adjustments`, `prior_year_mtcnold`, `prior_year_mtftce_on_exclusion_items`, `prior_year_form_6251_line10`, `prior_year_form_6251_line11`, `prior_year_form_8801_line26_carryforward`, `prior_year_unallowed_qualified_electric_vehicle_credit`, `prior_year_filed_form_2555 BIT`, `prior_year_uses_part_iii BIT` |
| Part III amounts | `part3_line28_amount`, `part3_line29_amount`, `part3_line30_cap_amount`, `part3_line35_amount`, `part3_line42_amount` |
| FEITW Line 3 (per-person) | `prior_year_feitw_line3 DECIMAL(19,4)` (taxpayer fills on taxpayer row; spouse contribution on spouse row — same column name) |

UNIQUE (uid, owner_role).

### 3.12 `pf_elderly_disabled_credit` (Schedule R)

Discriminator: `owner_role`.

| Group | Columns |
|---|---|
| Gate | `claims_elderly_disabled_credit BIT`, `confirm_qualification_support_ready BIT`, `mfs_lived_apart_all_year BIT` (taxpayer row), `spouse_has_elderly_disabled_credit_inputs BIT` (spouse row) |
| Per-person eligibility (T+S share columns; owner_role distinguishes rows) | `retired_on_permanent_total_disability BIT`, `received_taxable_disability_income BIT`, `taxable_disability_income_amount DECIMAL(19,4)`, `under_mandatory_retirement_age_on_jan1 BIT`, `existing_physician_statement BIT`, `nontaxable_pension_benefits DECIMAL(19,4)` |

UNIQUE (uid, owner_role).

### 3.13 `pf_extension_of_time` (Form 4868)

Discriminator: `owner_role`.

| Group | Columns |
|---|---|
| Gate | `needs_extension_of_time BIT`, `spouse_has_extension_of_time_inputs BIT` (spouse row), `spouse_included_on_joint_extension BIT` (spouse row) |
| Filing | `extension_filing_method` NVARCHAR(32) CHECK IN (`e-file`,`mail`,`electronic-payment-substitute`), `has_fiscal_year BIT`, `fiscal_year_begin DATE`, `fiscal_year_end DATE` |
| Liability | `estimated_total_tax_liability_2025 DECIMAL(19,4)`, `estimated_total_payments_excluding_extension_payment` |
| Payment | `extension_payment_amount DECIMAL(19,4)`, `spouse_extension_payment_contribution` (spouse row), `payment_method` NVARCHAR(32) CHECK IN (`Direct Pay`,`EFTPS`,`Credit card`,`Debit card`,`Check`,`None`), `payment_date DATE`, `confirmation_number NVARCHAR(64)`, `spouse_payment_reference NVARCHAR(64)` (spouse row) |
| Flags | `out_of_country_flag BIT`, `form_1040nr_special_flag BIT` |

UNIQUE (uid, owner_role).

### 3.14 `pf_form4852` + child `pf_form4852_entry`

Substitute W-2 / 1099-R. Symmetric T/S (same shape on both sides).

`pf_form4852` (parent):

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `uid` | NVARCHAR(128) FK CASCADE | |
| `owner_role` | NVARCHAR(16) NOT NULL CHECK IN (`taxpayer`,`spouse`) | |
| `needs_form_4852` | BIT | |

UNIQUE (uid, owner_role).

`pf_form4852_entry` (child — one per missing W-2/1099-R):

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `parent_id BIGINT NOT NULL` | FK CASCADE | |
| `idx INT NOT NULL` | UNIQUE (parent_id, idx) | |
| `substitute_form_type` | NVARCHAR(8) CHECK IN (`w2`,`1099-r`) | |
| `employer_or_payer_name_address_zip` | NVARCHAR(MAX) | [PII] |
| `employer_or_payer_tin` | NVARCHAR(10) | EIN |
| W-2 path (line 7a-7i) | `line7a_wages_tips_other_compensation DECIMAL(19,4)`, `line7b_social_security_wages`, `line7c_medicare_wages_and_tips`, `line7d_social_security_tips`, `line7e_federal_income_tax_withheld`, `line7f_state_income_tax_withheld`, `line7f_state_name NCHAR(2)`, `line7g_local_income_tax_withheld`, `line7g_locality_name NVARCHAR(40)`, `line7h_social_security_tax_withheld`, `line7i_medicare_tax_withheld` |
| 1099-R path (line 8a-8j) | `line8a_gross_distribution DECIMAL(19,4)`, `line8b_taxable_amount`, `line8c_taxable_amount_not_determined BIT`, `line8d_total_distribution BIT`, `line8e_capital_gain`, `line8f_federal_income_tax_withheld`, `line8g_state_income_tax_withheld`, `line8g_state_name NCHAR(2)`, `line8h_local_income_tax_withheld`, `line8h_locality_name NVARCHAR(40)`, `line8i_employee_contributions`, `line8j_distribution_codes NVARCHAR(8)`, `line8j_ira_sep_simple BIT` |
| Explanations | `line9_how_amounts_were_determined NVARCHAR(MAX)`, `line10_efforts_to_obtain NVARCHAR(MAX)` |

### 3.15 `pf_qbi_deduction` (Line 13a; Forms 8995 / 8995-A intake)

Discriminator: `owner_role`.

> **Note:** UI uses `FIELD_MAPS` to remap field names between in-memory and
> persisted forms (taxpayer-side names vs. spouse-side `spouse*` names).
> SQL schema uses the **logical** name (no `spouse_` prefix); `owner_role`
> discriminates rows.

| Group | Columns |
|---|---|
| Gate | `had_qbi_inputs BIT`, `confirm_all_received_qbi_statements_uploaded BIT` |
| Out-of-scope blockers | `has_schedule_c_or_f_qbi_sources BIT`, `is_cooperative_patron_of_ag_horticultural_coop BIT` |
| Carryforwards | `has_prior_year_qbi_loss_carryforward BIT`, `prior_year_qbi_loss_carryforward_amount DECIMAL(19,4)`, `prior_year_qbi_carryforward_notes NVARCHAR(MAX)`, `has_prior_year_reit_ptp_loss_carryforward BIT`, `prior_year_reit_ptp_loss_carryforward_amount DECIMAL(19,4)` |
| Manual adjustments | `manual_qbi_adjustment DECIMAL(19,4)`, `manual_qualified_reit_dividend_adjustment`, `manual_qualified_ptp_income_or_loss_adjustment`, `qbi_supplemental_adjustment_notes NVARCHAR(MAX)` |

UNIQUE (uid, owner_role).

### 3.16 Section 3 summary

13 parent tables + 6 child tables = **19 tables** in this domain.

| Parent | Children | Rows per user |
|---|---|---|
| pf_standard_deductions | — | 0-2 (taxpayer + spouse) |
| pf_investment_interest_expense | — | 0-1 |
| pf_education_credits | pf_education_student | 0-2 |
| pf_energy_credit | pf_energy_credit_item | 0-2 |
| pf_clean_car_credit | pf_clean_car_vehicle | 0-2 |
| pf_alt_fuel_credit | pf_alt_fuel_property | 0-2 |
| pf_bond_credit | pf_bond_1097btc, pf_bond_direct | 0-2 |
| pf_electric_vehicle_credit | — | 0-2 |
| pf_mortgage_interest_credit | — | 0-2 |
| pf_carryforward_homebuyer_credit | — | 0-2 |
| pf_prior_min_tax_credit | — | 0-2 |
| pf_elderly_disabled_credit | — | 0-2 |
| pf_extension_of_time | — | 0-2 |
| pf_form4852 | pf_form4852_entry | 0-2 |
| pf_qbi_deduction | — | 0-2 |

---

## 4. Personal forms — Income domain

Source inventory: `data_model_personal_income.md` (27 legacy form IDs → 13
archetypes + 8 child tables). Two structural patterns beyond what §3 covered:

- **Dependent-scoped reuse**: `capital-gain-loss-dependent` and
  `kiddie-income-dependent` reuse the taxpayer component via `@Input() formId`
  and persist under `users/{uid}/dependents/{dependentId}/personal/{formId}`.
  In SQL these merge into the same archetype table with
  `owner_role='dependent'` and `dependent_id NOT NULL`.
- **Backend-populated readonly fields** (e.g.
  `imported1099BRecordCount`, `combatPayTotal`,
  `imports.totalSSWagesTipsRRTAAnd4137`) are denormalized snapshots from
  statement-entry tables. We keep them as columns for query convenience but
  the statement tables are truth.
- **Legacy `employment-income`** (with `filer*`/`spouse*` prefixed fields) is
  superseded by `employment-income-taxpayer`/`-spouse`; data migration only.

### 4.1 `pf_employment_income` + child `pf_household_employer`

Discriminator: `owner_role` ∈ (`taxpayer`,`spouse`).

`pf_employment_income` (parent):

| Group | Columns |
|---|---|
| Gate | `has_employment_income BIT`, `is_missing_w2 BIT`, `household_work BIT`, `household_employee_under_control_test BIT`, `household_received_w2 BIT`, `has_inmate_wages BIT` |
| Inmate-wages snapshot | `inmate_wage_w2_ids NVARCHAR(MAX)` (JSON array of statement-entry IDs), `inmate_form_4852_indices NVARCHAR(MAX)` (JSON array of int indices), `inmate_wages_amount DECIMAL(19,4)` |

UNIQUE (uid, owner_role).

`pf_household_employer` (child):

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `parent_id BIGINT NOT NULL` | FK CASCADE | |
| `idx INT NOT NULL` | UNIQUE (parent_id, idx) | |
| `employer_name` | NVARCHAR(200) | [PII] |
| `wages` | DECIMAL(19,4) | |
| `employer_treated_as_contractor` | BIT | |
| `federal_tax_withheld` | BIT | |

### 4.2 `pf_tip_income` + child `pf_tip_employer`

Discriminator: `owner_role` ∈ (`taxpayer`,`spouse`).

`pf_tip_income` (parent):

| Column | Type | Notes |
|---|---|---|
| `has_unreported_tips` | BIT | gate |

UNIQUE (uid, owner_role).

`pf_tip_employer` (child — TipEmployerEntry):

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `parent_id BIGINT NOT NULL` | FK CASCADE | |
| `idx INT NOT NULL` | UNIQUE (parent_id, idx) | |
| `employer_name` | NVARCHAR(200) | [PII] |
| `employer_ein` | NVARCHAR(10) | EIN |
| `total_tips_received` | DECIMAL(19,4) | |
| `total_tips_reported_to_employer` | DECIMAL(19,4) | |
| `medicare_only_government_tips` | DECIMAL(19,4) | |
| `line5_under_20_per_month_tips` | DECIMAL(19,4) | |
| `allocated_tips_w2_box8` | DECIMAL(19,4) | auto-filled from W-2 |
| `has_adequate_records_unreported_less_than_allocated` | BIT | |
| `substantiated_unreported_tips_if_less_than_allocated` | DECIMAL(19,4) | |
| `non_cash_tips_fmv` | DECIMAL(19,4) | |
| `rrta_compensation_w2_box14` | DECIMAL(19,4) | |
| `rrta_compensation_w2_box14_notes` | NVARCHAR(MAX) | |
| `social_security_wages_w2_box3` | DECIMAL(19,4) | |
| `social_security_tips_w2_box7` | DECIMAL(19,4) | |

UI-only fields (`w2AutoFilledFrom`, `rRTAAutoFillSourceLabel`,
`hasGovernmentTips`, `hasNonCashTips`, `hasRrtaCompensation`) are NOT stored —
they are stripped before save per inventory note #7.

### 4.3 `pf_medicaid_waiver` + child `pf_medicaid_waiver_entry`

Discriminator: `owner_role` ∈ (`taxpayer`,`spouse`).

`pf_medicaid_waiver` (parent):

| Column | Type | Notes |
|---|---|---|
| `received_medicaid_waiver_payments` | BIT | gate |
| `include_qualified_payments_in_earned_income_for_eic_actc` | BIT | EIC/ACTC election |
| `has_trade_or_business_providing_home_care` | BIT | out-of-scope if true |
| `program_name` | NVARCHAR(200) | |
| `care_recipient_relationship` | NVARCHAR(100) | |
| `lives_with_care_recipient` | BIT | |

UNIQUE (uid, owner_role).

`pf_medicaid_waiver_entry` (child):

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `parent_id BIGINT NOT NULL` | FK CASCADE | |
| `idx INT NOT NULL` | UNIQUE (parent_id, idx) | |
| `payer_name` | NVARCHAR(200) | |
| `payer_tin` | NVARCHAR(11) | [PII] |
| `source_type` | NVARCHAR(16) | CHECK IN (`W-2`,`1099-MISC`,`1099-NEC`) |
| `qualified_notice_2014_7_amount` | DECIMAL(19,4) | |
| `w2_box12_code_ii_amount` | DECIMAL(19,4) | |
| `qualified_amount_included_in_w2_box1` | DECIMAL(19,4) | |
| `taxable_payments_not_in_w2_box1` | DECIMAL(19,4) | |
| `notes` | NVARCHAR(MAX) | |

### 4.4 `pf_uncollected_ss_medicare` + child `pf_uncollected_firm` (Form 8919)

Discriminator: `owner_role` ∈ (`taxpayer`,`spouse`).

`pf_uncollected_ss_medicare` (parent):

| Column | Type | Notes |
|---|---|---|
| `import_total_ss_wages_tips_rrta_and_4137` | DECIMAL(19,4) | backend-populated readonly snapshot |

UNIQUE (uid, owner_role).

`pf_uncollected_firm` (child — FirmEntry):

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `parent_id BIGINT NOT NULL` | FK CASCADE | |
| `idx INT NOT NULL` | UNIQUE (parent_id, idx) | |
| `firm_name` | NVARCHAR(200) | |
| `firm_federal_id_number` | NVARCHAR(10) | EIN |
| `reason_code` | NCHAR(1) | CHECK IN (`A`,`B`,`C`,`D`,`E`,`F`,`G`,`H`) — Form 8919 reason codes |
| `irs_determination_date` | DATE | |
| `received_1099_misc_or_nec` | BIT | |
| `wages_no_fica_not_w2` | DECIMAL(19,4) | |

### 4.5 `pf_combat_pay`

Discriminator: `owner_role` ∈ (`taxpayer`,`spouse`).

| Column | Type | Notes |
|---|---|---|
| `combat_pay_total` | DECIMAL(19,4) | backend-populated readonly snapshot from W-2 box 12 code Q |
| `elect_combat_pay` | BIT | |

UNIQUE (uid, owner_role).

### 4.6 `pf_interest_income`

Discriminator: `owner_role` ∈ (`taxpayer`,`spouse`).
Asymmetric: taxpayer carries return-level Schedule B Part III gates; spouse
columns for those are nullable and stay NULL.

| Group | Columns |
|---|---|
| Gate | `has_business_related_interest BIT` (out-of-scope), `had_interest_income BIT` (NOT NULL on save) |
| Upload checks (taxpayer only) | `has_uploaded_at_least_one_interest_statement BIT`, `confirm_all_received_interest_statements_uploaded BIT` |
| Manual amounts | `manual_taxable_interest_not_on_statements DECIMAL(19,4)`, `manual_tax_exempt_interest_not_on_statements`, `tax_exempt_stated_interest_from_1099_oid_box2`, `taxable_portion_from_1099_oid_box2_override` |
| Adjustments | `has_interest_adjustments BIT`, `accrued_interest_paid_adjustment DECIMAL(19,4)`, `nominee_interest_adjustment`, `taxable_bond_premium_adjustment_not_in_statements`, `treasury_bond_premium_adjustment_not_in_statements`, `tax_exempt_bond_premium_adjustment_not_in_statements`, `oid_acquisition_premium_adjustment_not_in_statements`, `payer_already_reported_net_interest_or_oid BIT`, `reducing_interest_below_1099_by_bond_premium BIT`, `reducing_oid_below_1099_by_acquisition_premium BIT` |
| Savings bond Form 8815 | `claims_savings_bond_exclusion_form_8815 BIT`, `savings_bond_exclusion_amount DECIMAL(19,4)` |
| Schedule B Part III (taxpayer only) | `has_foreign_financial_situation BIT`, `has_foreign_account_for_schedule_b_part_iii BIT`, `has_fbar_requirement BIT`, `has_foreign_trust_distribution_or_transfer BIT` |

UNIQUE (uid, owner_role).

### 4.7 `pf_dividend_income`

Discriminator: `owner_role` ∈ (`taxpayer`,`spouse`).

| Group | Columns |
|---|---|
| Gate | `had_dividend_income BIT`, `has_uploaded_at_least_one_1099div_statement BIT` (taxpayer only), `received_1099_div BIT`, `uploaded_1099_div BIT`, `confirm_all_received_1099div_uploaded BIT` (taxpayer only) |
| Manual amounts | `manual_ordinary_dividends_not_on_statements DECIMAL(19,4)`, `manual_qualified_dividends_not_on_statements` |
| Nominee | `has_nominee_dividends BIT`, `nominee_ordinary_dividends DECIMAL(19,4)`, `nominee_qualified_dividends`, `will_issue_nominee_1099div_to_actual_owner BIT` (taxpayer only), `will_file_nominee_1096_and_1099div_with_irs BIT` (taxpayer only) |
| Holding-period disallowances | `non_qualified_from_holding_period_common_61_of_121 DECIMAL(19,4)`, `non_qualified_from_holding_period_preferred_91_of_181`, `non_qualified_from_related_payment_obligation_short_sale`, `non_qualified_payments_in_lieu`, `non_qualified_surrogate_foreign_corporation_dividends`, `has_qualified_dividend_disallowances BIT` |

UNIQUE (uid, owner_role).

### 4.8 `pf_capital_gain_loss` + child `pf_capital_gain_loss_transaction`

Discriminator: `owner_role` ∈ (`taxpayer`,`spouse`,`dependent`).
For `dependent`, `dependent_id` is NOT NULL.

`pf_capital_gain_loss` (parent — superset of taxpayer + spouse fields):

| Group | Columns |
|---|---|
| Gate | `had_capital_gain_or_loss BIT`, `has_uploaded_at_least_one_capital_statement BIT` (taxpayer only), `received_1099_div_with_capital_gain_distributions BIT`, `uploaded_1099_div_with_capital_gain_distributions BIT`, `received_1099b_or_1099da BIT`, `uploaded_1099b_or_1099da BIT`, `received_form_2439 BIT`, `uploaded_form_2439 BIT`, `received_other_schedule_d_source_statements BIT`, `uploaded_other_schedule_d_source_statements BIT`, `confirm_all_received_capital_statements_uploaded BIT` |
| Schedule D triggers | `had_capital_asset_sales_or_exchanges BIT`, `has_qof_deferral_or_termination BIT`, `has_capital_losses_for_tax_year BIT`, `has_capital_loss_carryover_from_prior_year BIT`, `has_form_2439_undistributed_capital_gains BIT`, `has_other_schedule_d_source_forms BIT`, `has_any_1099div_boxes_2b_2c_2d_amounts BIT` |
| Spouse uncommon-situations gates | `has_collectibles_or_section_1202_gain BIT`, `has_real_estate_depreciation_recapture BIT`, `has_nonbusiness_bad_debt BIT`, `nonbusiness_bad_debt_face_amount DECIMAL(19,4)`, `nonbusiness_bad_debt_description NVARCHAR(MAX)` |
| Manual amounts | `manual_capital_gain_distributions_not_on_statements DECIMAL(19,4)`, `manual_other_capital_gain_adjustments`, `manual_other_capital_loss_adjustments`, `has_nominee_capital_gain_distributions BIT`, `nominee_capital_gain_distributions_to_subtract`, `confirm_nominee_statement_will_be_provided BIT` |
| Schedule D Line 1a / 8a direct aggregations | `manual_short_term_direct_aggregation_proceeds_line1a DECIMAL(19,4)`, `manual_short_term_direct_aggregation_basis_line1a`, `manual_short_term_direct_aggregation_adjustments_line1a`, `manual_long_term_direct_aggregation_proceeds_line8a`, `manual_long_term_direct_aggregation_basis_line8a`, `manual_long_term_direct_aggregation_adjustments_line8a` |
| Other-forms gain/loss | `short_term_other_forms_gain_loss_line4`, `short_term_schedule_k1_gain_loss_line5`, `long_term_other_forms_gain_loss_line11`, `long_term_schedule_k1_gain_loss_line12` |
| 28%-rate / §1250 worksheets | `twenty_eight_percent_rate_gain_worksheet_amount_line18 DECIMAL(19,4)`, `unrecaptured_section_1250_gain_worksheet_amount_line19` |
| Prior-year carryovers | `prior_year_capital_loss_carryover_short_term DECIMAL(19,4)`, `prior_year_capital_loss_carryover_long_term`, `prior_year_schedule_d_line21_allowable_loss` |
| Imported snapshots (backend-populated readonly) | `imported_1099b_record_count INT`, `imported_1099da_record_count INT`, `imported_1099b_1099da_net_gain_or_loss_total DECIMAL(19,4)`, `imported_1099div_box2a_capital_gain_distributions_total DECIMAL(19,4)`, `verified_capital_statement_totals BIT` |

UNIQUE (uid, owner_role, dependent_id).

`pf_capital_gain_loss_transaction` (child — unifies the two slightly-different
transaction shapes by including both `form_8949_box` (taxpayer side) and
`basis_reported_to_irs` (spouse side); only one is populated per row):

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `parent_id BIGINT NOT NULL` | FK CASCADE | |
| `idx INT NOT NULL` | UNIQUE (parent_id, idx) | |
| `transaction_description` | NVARCHAR(MAX) | |
| `transaction_term` | NVARCHAR(8) | CHECK IN (`short`,`long`) |
| `form_8949_box` | NCHAR(1) | CHECK IN (`A`,`B`,`C`,`D`,`E`,`F`) — populated on taxpayer/dependent rows |
| `basis_reported_to_irs` | NVARCHAR(16) | CHECK IN (`reported`,`not_reported`,`no_1099b`) — populated on spouse rows |
| `date_acquired` | NVARCHAR(16) | DATE or literal `VARIOUS`; stored as text to preserve special value |
| `date_sold_or_disposed` | NVARCHAR(16) | DATE or literal `VARIOUS` |
| `proceeds` | DECIMAL(19,4) | |
| `cost_or_other_basis` | DECIMAL(19,4) | |
| `adjustment_code` | NVARCHAR(8) | Form 8949 col (f) code |
| `adjustment_amount` | DECIMAL(19,4) | |
| `transaction_notes` | NVARCHAR(MAX) | |

CHECK: at least one of `form_8949_box` or `basis_reported_to_irs` is non-null
(application-enforced; SQL CHECK would be too brittle).

### 4.9 `pf_other_incomes` + child `pf_other_income_item`

Discriminator: `owner_role` ∈ (`taxpayer`,`spouse`).

`pf_other_incomes` (parent, ~35 columns):

| Group | Columns |
|---|---|
| Gate | `had_additional_income_for_schedule1 BIT`, `has_uploaded_at_least_one_other_income_statement BIT` (taxpayer only), `received_1099g BIT`, `uploaded_1099g BIT`, `received_1099c BIT`, `uploaded_1099c BIT`, `confirm_all_received_other_income_statements_uploaded BIT` (taxpayer only) |
| Out-of-scope gates | `has_schedule_c_business_income_out_of_scope BIT`, `has_schedule_f_farm_income_out_of_scope BIT`, `has_section_962_cfc_election BIT` |
| Schedule 1 Part I lines | `form_1099k_personal_items_disclosure_amount DECIMAL(19,4)`, `taxable_state_local_refunds_line1`, `alimony_received_line2a`, `alimony_agreement_date_line2b DATE` (taxpayer only), `other_gains_losses_line4`, `rental_real_estate_royalties_line5`, `unemployment_compensation_line7`, `repaid_unemployment_overpayment_in_2025 BIT`, `unemployment_repayment_adjustment DECIMAL(19,4)` |
| Schedule 1 line 8a–8v (20 named other-income lines) | `other_income_net_operating_loss_8a DECIMAL(19,4)`, `other_income_gambling_8b`, `other_income_cancellation_of_debt_8c`, `other_income_foreign_earned_income_exclusion_8d`, `other_income_form_8853_8e`, `other_income_form_8889_8f`, `other_income_alaska_permanent_fund_dividends_8g`, `other_income_jury_duty_pay_8h`, `other_income_prizes_awards_8i`, `other_income_hobby_income_8j`, `other_income_stock_options_8k`, `other_income_rental_personal_property_8l`, `other_income_olympic_paralympic_8m`, `other_income_section_951a_8n`, `other_income_section_951a_8o` (GILTI; different from 8n), `other_income_section_461l_8p`, `other_income_able_distributions_8q`, `other_income_scholarships_8r`, `other_income_nonqualified_deferred_comp_8t`, `other_income_wages_while_incarcerated_8u`, `other_income_digital_assets_8v` |

UNIQUE (uid, owner_role).

`pf_other_income_item` (child — Schedule 1 line 8z free-text rows):

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `parent_id BIGINT NOT NULL` | FK CASCADE | |
| `idx INT NOT NULL` | UNIQUE (parent_id, idx) | |
| `description` | NVARCHAR(MAX) | |
| `amount` | DECIMAL(19,4) | |

### 4.10 `pf_kiddie_income` (Form 8615)

Discriminator: `owner_role` ∈ (`taxpayer`,`dependent`).
For `dependent`, `dependent_id` is NOT NULL.

| Group | Columns |
|---|---|
| Gate | `has_kiddie_tax_unearned_income BIT` |
| Child filing status + amounts | `child_filing_status` (FK ref_filing_status), `child_unearned_income_line1 DECIMAL(19,4)`, `child_itemized_deduction_line2`, `child_taxable_income_line4`, `child_net_unearned_income_line5`, `child_taxable_income_not_subject_to_kiddie_tax_line14`, `child_tentative_tax_share_line13`, `child_final_tax_line18` |
| Parent info | `parent_first_name NVARCHAR(100)` [PII], `parent_last_name NVARCHAR(100)` [PII], `parent_ssn NVARCHAR(11)` [PII], `parent_filing_status` (FK ref_filing_status), `parent_taxable_income_line6 DECIMAL(19,4)`, `other_children_net_unearned_line7 DECIMAL(19,4)` |

UNIQUE (uid, owner_role, dependent_id).

### 4.11 `pf_income_adjustments` + child `pf_income_adjustment_item`

Discriminator: `owner_role` ∈ (`taxpayer`,`spouse`). The taxpayer/spouse
distinction also drives the `is_covered_by_workplace_retirement_plan` field
name (`Taxpayer`/`Spouse`) — collapsed to one column here.

`pf_income_adjustments` (parent, ~28 columns):

| Group | Columns |
|---|---|
| Gate | `had_income_adjustments_for_schedule1 BIT` |
| Out-of-scope SE gates | `has_deductible_self_employment_tax_line15_out_of_scope BIT`, `has_self_employed_retirement_plan_adjustment_line16_out_of_scope BIT`, `has_self_employed_health_insurance_adjustment_line17_out_of_scope BIT` |
| Schedule 1 Part II named lines | `educator_expenses_line11 DECIMAL(19,4)` ($300 cap), `reservist_performing_artist_fee_basis_expenses_line12` (Form 2106), `hsa_deduction_line13` (Form 8889), `moving_expenses_armed_forces_line14`, `moving_expenses_storage_fees_only_line14 BIT`, `penalty_on_early_withdrawal_of_savings_line18`, `alimony_paid_line19a`, `alimony_recipient_ssn_line19b NVARCHAR(11)` [PII], `alimony_agreement_date_line19c DATE`, `ira_deduction_line20 DECIMAL(19,4)`, `is_covered_by_workplace_retirement_plan BIT`, `ira_deduction_mfs_lived_apart_line20 BIT`, `student_loan_interest_deduction_line21` ($2,500 cap), `archer_msa_deduction_line23` (Form 8853) |
| Schedule 1 line 24a–24k named other-adjustment lines | `other_adjustment_jury_duty_pay_line24a DECIMAL(19,4)`, `other_adjustment_deductible_expenses_related_to_8l_line24b`, `other_adjustment_nontaxable_olympic_paralympic_line24c`, `other_adjustment_reforestation_amortization_line24d`, `other_adjustment_trade_act_repayment_line24e`, `other_adjustment_contributions_501c18d_line24f`, `other_adjustment_chaplain_403b_contributions_line24g`, `other_adjustment_attorney_fees_unlawful_discrimination_line24h`, `other_adjustment_attorney_fees_irs_award_line24i`, `other_adjustment_housing_deduction_form_2555_line24j`, `other_adjustment_excess_deductions_section_67e_line24k` |

UNIQUE (uid, owner_role).

`pf_income_adjustment_item` (child — line 24z free-text rows):

Same shape as `pf_other_income_item`: `(id, parent_id, idx, description, amount)`.

### 4.12 `pf_other_payments_31` + child `pf_other_payment_item`

Household-level (no `owner_role`). UNIQUE on `uid`.

`pf_other_payments_31` (parent — Schedule 3 lines 12 / 13b / 13d):

| Column | Type | Notes |
|---|---|---|
| `has_fuel_tax_credit` | BIT | gates Schedule 3 line 12 |
| `credit_for_federal_tax_on_fuels` | DECIMAL(19,4) | Form 4136 line 14 → Schedule 3 line 12 |
| `has_section_1341_credit` | BIT | |
| `section_1341_repayment_amount` | DECIMAL(19,4) | must exceed $3,000 |
| `section_1341_credit` | DECIMAL(19,4) | |
| `has_other_refundable_credits` | BIT | |
| `has_deferred_965_tax` | BIT | |
| `deferred_net_965_tax_liability` | DECIMAL(19,4) | |

`pf_other_payment_item` (child — Schedule 3 line 13z free-text rows): same
shape as `pf_other_income_item`.

### 4.13 `pf_estimated_tax_payments`

Discriminator: `owner_role` ∈ (`taxpayer`,`spouse`).

| Column | Type | Notes |
|---|---|---|
| `made_estimated_tax_payments` | BIT | gate |
| `installment_1_amount` | DECIMAL(19,4) | Q1 (Apr 15) |
| `installment_2_amount` | DECIMAL(19,4) | Q2 (Jun 16) |
| `installment_3_amount` | DECIMAL(19,4) | Q3 (Sep 15) |
| `installment_4_amount` | DECIMAL(19,4) | Q4 (Jan 15 next year) |
| `prior_year_overpayment_credited` | DECIMAL(19,4) | 2024 refund applied to 2025 |
| `amended_return_overpayment_credited` | DECIMAL(19,4) | additional refund from amended 2024 return |
| `divorce_former_spouse_ssn` | NVARCHAR(11) | [PII] for joint estimated payment apportionment |

UNIQUE (uid, owner_role).

### 4.14 Section 4 summary

13 parent tables + 8 child tables = **21 tables** in this domain.

| Parent | Children | Rows per user |
|---|---|---|
| pf_employment_income | pf_household_employer | 0-2 |
| pf_tip_income | pf_tip_employer | 0-2 |
| pf_medicaid_waiver | pf_medicaid_waiver_entry | 0-2 |
| pf_uncollected_ss_medicare | pf_uncollected_firm | 0-2 |
| pf_combat_pay | — | 0-2 |
| pf_interest_income | — | 0-2 |
| pf_dividend_income | — | 0-2 |
| pf_capital_gain_loss | pf_capital_gain_loss_transaction | 0-2-N (N dependent rows) |
| pf_other_incomes | pf_other_income_item | 0-2 |
| pf_kiddie_income | — | 0-1-N (N dependent rows) |
| pf_income_adjustments | pf_income_adjustment_item | 0-2 |
| pf_other_payments_31 | pf_other_payment_item | 0-1 |
| pf_estimated_tax_payments | — | 0-2 |

Personal-form domain total (§2 + §3 + §4): 5 + 13 + 13 = **31 parent tables**
+ 0 + 6 + 8 = **14 child tables** = **45 tables** so far.

---

## 5. Statement entries

Source inventory: `data_model_statements.md` (41 statement form IDs). Each
table has cardinality 0..N per `(uid, owner_role)` — a taxpayer can have
multiple W-2s, multiple 1099-DIVs from different payers, etc.

### 5.0 Shared patterns

To keep per-form specs compact, the following column groups appear across
most statement-entry tables. The text "see §5.0/<pattern>" in a per-form
spec is shorthand for "include all columns of that pattern."

**PRIMARY_KEY** — every statement-entry table:

```
id              BIGINT IDENTITY PRIMARY KEY
uid             NVARCHAR(128) NOT NULL FK → app_user(uid) CASCADE
owner_role      NVARCHAR(16)  NOT NULL CHECK IN ('taxpayer','spouse')
                                       -- added by Phase 2b (not in current Firestore)
tax_year        INT NULL              -- derived from calendarYear text on save
legacy_doc_id   NVARCHAR(40) NULL     -- Firestore auto-id; migration trail
```

Index: `IX_<form>_uid_owner_year (uid, owner_role, tax_year)`.

**PII_HEADER** — common 1099-series payer/recipient block:

```
void                          BIT
corrected                     BIT
calendar_year                 NVARCHAR(8)
payer_tin                     NVARCHAR(11)   -- EIN or SSN
payer_name_address            NVARCHAR(MAX)
payer_telephone               NVARCHAR(40)
recipient_tin                 NVARCHAR(11)
recipient_name                NVARCHAR(200)  -- legacy combined name
recipient_first_name          NVARCHAR(100)
recipient_last_name           NVARCHAR(100)
recipient_suffix              NVARCHAR(10)
recipient_street_address      NVARCHAR(200)
recipient_city_state_country_zip NVARCHAR(200)
account_number                NVARCHAR(40)
```

Forms that omit `void` (1098-T, 1098-E, 1099-Q, 1099-QA, 1099-LTC, 1099-SA,
RRB-1099, RRB-1099-R) get the same block minus that one column.

**AMT pattern** — every monetary box becomes two columns:

```
<box>_amount  DECIMAL(19,4) NULL
<box>_notes   NVARCHAR(MAX) NULL  -- printed annotations
```

In per-form specs below, `box <name> (AMT)` means "add both columns."

**stateInfo child** (1099-INT/DIV/OID/K/B/G — up to 2 slots):

Table `<parent_table>_state_info`:
```
id             BIGINT IDENTITY PK
parent_id      BIGINT NOT NULL FK CASCADE
idx            INT NOT NULL  -- 0..N
state          NCHAR(2)
payer_state_id NVARCHAR(40)
state_tax_withheld (AMT)
state_income (AMT)            -- present on 1099-K/MISC/G variants
```
UNIQUE (parent_id, idx).

**stateLocalInfo child** (W-2, W-2G, 1099-R — adds local-tax fields):

Table `<parent_table>_state_local_info`:
```
id BIGINT IDENTITY PK
parent_id BIGINT NOT NULL FK CASCADE
idx INT NOT NULL
state                 NCHAR(2)
employer_state_id     NVARCHAR(40)   -- "payer_state_id" on 1099-R variant
state_wages (AMT)                    -- "state_winnings" on W-2G; "state_distribution" on 1099-R
state_income_tax (AMT)
local_wages (AMT)                    -- "local_winnings" on W-2G; "local_distribution" on 1099-R
local_income_tax (AMT)
locality_name         NVARCHAR(64)
```

Per-form column-name normalization is captured in Step 4 (validation).

**coveredIndividuals child** (1095-A/B/C):

Table `<parent_table>_covered_individual`:
```
id BIGINT IDENTITY PK
parent_id BIGINT NOT NULL FK CASCADE
idx INT NOT NULL
covered_first_name      NVARCHAR(100)  -- [PII]
covered_middle_initial  NVARCHAR(1)
covered_last_name       NVARCHAR(100)  -- [PII]
covered_suffix          NVARCHAR(10)
covered_ssn_or_tin      NVARCHAR(11)   -- [PII]
covered_dob             NVARCHAR(20)   -- as printed; not normalized
coverage_start_date     NVARCHAR(20)   -- 1095-A only
coverage_termination_date NVARCHAR(20) -- 1095-A only
covered_all_12_months   BIT            -- 1095-B/C only
month_jan..month_dec    BIT x 12       -- 1095-B/C only
```

### 5.1 `se_w2`

Per-form columns beyond PRIMARY_KEY + employee/employer block:

| Group | Columns |
|---|---|
| Employee/employer | `employee_ssn` [PII], `employee_first_name`, `employee_last_name`, `employee_suffix`, `employee_address`, `employer_ein`, `employer_name_address`, `control_number` |
| W-2 boxes 1–11 (AMT × 9) | `wages_tips_other_comp`, `federal_income_tax_withheld`, `social_security_wages`, `social_security_tax_withheld`, `medicare_wages_and_tips`, `medicare_tax_withheld`, `social_security_tips`, `allocated_tips`, `dependent_care_benefits`, `nonqualified_plans` (each pair AMT) |
| Box 13 | `statutory_employee BIT`, `retirement_plan BIT`, `third_party_sick_pay BIT` |
| Gating | `has_uncommon_w2_situations BIT` |

Children:
- `se_w2_box12_entry` (parent_id, idx, code NVARCHAR(4), amount, notes)
- `se_w2_box14_other` (parent_id, idx, label NVARCHAR(64), amount, notes) — max 3 slots
- `se_w2_state_local_info` (state/local pattern)

### 5.2 `se_w2g`

Per-form columns:

| Group | Columns |
|---|---|
| Winner | `winner_tin` [PII], `winner_first_name`, `winner_last_name`, `winner_suffix`, `winner_address` (granular: street/apt/city/state/country/zip) |
| Payer | `payer_tin`, `payer_name_address` (legacy combined), granular payer columns (name/street/room/city/state/country/zip), `payer_telephone` |
| Boxes | `box1_reportable_winnings` (AMT), `date_won NVARCHAR(20)`, `type_of_wager NVARCHAR(100)`, `box4_federal_income_tax_withheld` (AMT), `box5_transaction NVARCHAR(200)`, `box6_race NVARCHAR(40)`, `box7_identical_wagers_winnings` (AMT), `box8_cashier NVARCHAR(100)`, `box10_window NVARCHAR(100)`, `box11_first_identification_number NVARCHAR(100)`, `box12_second_identification_number NVARCHAR(100)` |

Child: `se_w2g_state_local_info`.

### 5.3 `se_1099_nec`

`PII_HEADER` (with void) + boxes:

| Box | Column |
|---|---|
| 1 | `nonemployee_compensation` (AMT) |
| 2 | `direct_sales_over_5k BIT` |
| 3 | `excess_golden_parachute_payments` (AMT) |
| 4 | `federal_income_tax_withheld` (AMT) |

Child: `se_1099_nec_state_info` (2 slots).

### 5.4 `se_1099_misc`

`PII_HEADER` (with void) + boxes:

| Box | Column |
|---|---|
| 1 | `rents` (AMT) |
| 2 | `royalties` (AMT) |
| 3 | `other_income` (AMT) |
| 4 | `federal_income_tax_withheld` (AMT) |
| 5 | `fishing_boat_proceeds` (AMT) |
| 6 | `medical_and_health_care_payments` (AMT) |
| 7 | `direct_sales_over_5k BIT` |
| 8 | `substitute_payments` (AMT) |
| 9 | `crop_insurance_proceeds` (AMT) |
| 10 | `gross_proceeds_to_attorney` (AMT) |
| 11 | `fish_purchased_for_resale` (AMT) |
| 12 | `section_409a_deferrals` (AMT) |
| 13 | `fatca_filing_requirement BIT` |
| 14 | `excess_golden_parachute_payments` (AMT) |
| 15 | `nonqualified_deferred_comp` (AMT) |

Child: `se_1099_misc_state_info` (2 slots).

### 5.5 `se_1099_k`

Per-form columns (omits some PII_HEADER fields):

| Group | Columns |
|---|---|
| Filer | `filer_tin`, `filer_name_address`, `filer_telephone`, `filer_is_pse BIT`, `filer_is_epf_or_other_third_party BIT`, `transactions_are_payment_card BIT`, `transactions_are_third_party_network BIT` |
| Payee | `payee_tin`, `payee_name`, `payee_first_name`, `payee_last_name`, `payee_suffix`, `payee_street_address`, `payee_city_state_country_zip`, `pse_name_telephone`, `account_number` |
| Boxes 1a–4 | `gross_amount_transactions_1a` (AMT), `card_not_present_1b` (AMT), `merchant_category_code NVARCHAR(8)`, `number_of_payment_transactions INT`, `federal_income_tax_withheld_4` (AMT) |
| Box 5 monthly | `month_01_amount`, `month_01_notes`, ... `month_12_amount`, `month_12_notes` (12 × AMT pairs) |

Child: `se_1099_k_state_information` (2 slots).

### 5.6 `se_1095_a`

Typed `Form1095A` interface.

| Group | Columns |
|---|---|
| Header | `void BIT`, `corrected BIT`, `calendar_year NVARCHAR(8)`, `marketplace_identifier NVARCHAR(40)`, `policy_number NVARCHAR(40)`, `policy_issuer_name NVARCHAR(200)` |
| Recipient | `recipient_first_name`, `recipient_last_name`, `recipient_suffix`, `recipient_ssn` [PII], `recipient_dob NVARCHAR(20)`, address fields |
| Spouse | `spouse_first_name`, `spouse_last_name`, `spouse_suffix`, `spouse_ssn` [PII], `spouse_dob NVARCHAR(20)` |
| Policy | `policy_start_date NVARCHAR(20)`, `policy_termination_date NVARCHAR(20)` |
| Annual totals | `annual_enrollment_premiums` (AMT), `annual_slcsp_premium` (AMT), `annual_advance_payment_ptc` (AMT) |

Children:
- `se_1095_a_covered_individual` (uses §5.0 pattern, 1095-A variant)
- `se_1095_a_coverage_monthly` (parent_id, idx 0..11, `month_name`, `monthly_enrollment_premiums` (AMT), `monthly_slcsp_premium` (AMT), `monthly_advance_payment_ptc` (AMT))

### 5.7 `se_1095_b`

| Group | Columns |
|---|---|
| Header | `void BIT`, `corrected BIT`, `calendar_year NVARCHAR(8)`, `origin_of_health_coverage_code NCHAR(1)` |
| Responsible | `responsible_first_name`, `responsible_last_name`, `responsible_suffix`, `responsible_ssn_or_tin`, `responsible_dob`, address fields |
| Employer | name, EIN, address (4 fields) |
| Provider | name, EIN, telephone, address (5 fields) |

Child: `se_1095_b_covered_individual` (uses 1095-B/C variant with month flags).

### 5.8 `se_1095_c`

| Group | Columns |
|---|---|
| Header | `void BIT`, `corrected BIT`, `calendar_year NVARCHAR(8)` |
| Employee | `employee_first_name`, `employee_middle_initial`, `employee_last_name`, `employee_ssn` [PII], address fields |
| Employer | `employer_name`, `employer_ein`, address, `employer_telephone` |
| Part II | `employee_age_on_jan1 NVARCHAR(8)`, `plan_start_month NCHAR(2)` |
| Part III gate | `self_insured_coverage BIT` |

Children:
- `se_1095_c_part2_monthly_row` (parent_id, idx 0..12, `period NVARCHAR(32)`, `offer_of_coverage_code_14 NCHAR(2)`, `employee_required_contribution_15 DECIMAL(19,4)`, `section_4980h_safe_harbor_16_code NCHAR(2)`, `zip_code_17 NVARCHAR(10)`)
- `se_1095_c_part3_covered_individual` (covered-individual pattern)

### 5.9 `se_1098_t`

`PII_HEADER` minus void + boxes:

| Group | Columns |
|---|---|
| Filer | `filer_ein`, `filer_name_address`, granular filer columns, `filer_telephone_number` |
| Student | `student_tin` [PII], `student_first_name`, `student_last_name`, address fields |
| Account | `account_number` |
| Boxes | `box1_payments_received_for_qualified_tuition` (AMT), `box2 NVARCHAR(20)` (reserved), `box3 NVARCHAR(20)` (reserved), `box4_adjustments_made_for_prior_year` (AMT), `box5_scholarships_or_grants` (AMT), `box6_adjustments_to_scholarships_or_grants` (AMT), `box7_academic_period_included BIT`, `box8_at_least_half_time BIT`, `box9_graduate_student BIT`, `box10_insurance_contract_reimbursements_or_refunds` (AMT) |

### 5.10 `se_1098_e` (form_id `1099-e` in catalog, despite IRS form label)

`PII_HEADER` minus void + lender/borrower granular columns + boxes:

| Box | Column |
|---|---|
| 1 | `student_loan_interest_received` (AMT) |
| 2 | `box1_excludes_origination_fees_or_capitalized_interest_pre_2004 BIT` |

### 5.11 `se_1099_q`

`PII_HEADER` minus void + boxes:

| Box | Column |
|---|---|
| 1 | `gross_distribution` (AMT) |
| 2 | `earnings` (AMT) |
| 3 | `basis` (AMT) |
| 4 | `transfer_trustee_to_trustee BIT`, `transfer_qtp_to_roth_ira BIT` |
| 5 | `distribution_from_private_qtp BIT`, `distribution_from_state_qtp BIT`, `distribution_from_coverdell_esa BIT` |
| 6 | `recipient_not_designated_beneficiary BIT` |

### 5.12 `se_1099_qa`

PII_HEADER minus void + Box 1 `gross_distribution` (AMT), Box 2 `earnings` (AMT),
Box 3 `basis` (AMT), Box 4 `program_to_program_transfer BIT`, Box 5
`able_account_terminated BIT`, Box 6 `recipient_not_designated_beneficiary BIT`.

### 5.13 `se_1099_ltc`

Standard PII minus void + policyholder + insured blocks +
Box 1 `gross_ltc_benefits_paid` (AMT), Box 2 `accelerated_death_benefits_paid` (AMT),
Box 3 `per_diem BIT`, `reimbursed_amount BIT`, Box 4 `qualified_contract BIT`,
Box 5 `chronically_ill BIT`, `terminally_ill BIT`, `date_certified NVARCHAR(20)`.

### 5.14 `se_1099_sa`

PII_HEADER minus void + Box 1 `gross_distribution` (AMT), Box 2
`earnings_on_excess_contributions` (AMT), Box 3 `distribution_code NCHAR(1)`,
Box 4 `fmv_on_date_of_death` (AMT), Box 5 `hsa BIT`, `archer_msa BIT`, `ma_msa BIT`.

### 5.15 `se_1099_int`

PII_HEADER (with void) + `payer_rtn NVARCHAR(20)`, `fatca_filing_requirement BIT`
+ Boxes 1–13 (AMT pairs except: box 7 `foreign_country_or_territory NVARCHAR(2)`,
box 14 `tax_exempt_tax_credit_bond_cusip NVARCHAR(20)`).

Child: `se_1099_int_state_info` (2 slots).

### 5.16 `se_1099_div`

PII_HEADER (with void) + `fatca_filing_requirement BIT` + Boxes 1a–13 (AMT pairs
except: box 8 `foreign_country_or_us_possession NVARCHAR(40)`).

Child: `se_1099_div_state_info` (2 slots).

### 5.17 `se_1099_oid`

PII_HEADER (with void) + `fatca_filing_requirement BIT` + Boxes 1–11 (AMT pairs)
+ box 7 `description NVARCHAR(200)`.

Child: `se_1099_oid_state_info` (2 slots).

### 5.18 `se_1099_b`

Per-form columns:

| Group | Columns |
|---|---|
| Header | `void`, `corrected`, `calendar_year`, payer block, recipient block |
| Metadata | `second_tin_notice BIT`, `cusip_number NVARCHAR(20)`, `fatca_filing_requirement BIT`, `applicable_checkbox_on_form_8949 NCHAR(1)` CHECK IN (`A`,`B`,`C`,`D`,`E`,`F`,`X`) |
| Boxes 1a–1g | `description_of_property NVARCHAR(MAX)`, `date_acquired NVARCHAR(20)`, `date_sold_or_disposed NVARCHAR(20)`, `proceeds` (AMT), `cost_or_other_basis` (AMT), `accrued_market_discount` (AMT), `wash_sale_loss_disallowed` (AMT) |
| Box 2 type | `short_term BIT`, `long_term BIT`, `ordinary BIT` |
| Box 3 | `proceeds_from_collectibles BIT`, `proceeds_from_qof BIT` |
| Box 4 | `federal_income_tax_withheld` (AMT) |
| Box 5 | `noncovered_security BIT` |
| Box 6 | `reported_to_irs_gross_proceeds BIT`, `reported_to_irs_net_proceeds BIT` |
| Box 7 | `loss_not_allowed_based_on_1d BIT` |
| Boxes 8–11 | `profit_loss_closed_contracts` (AMT), `unrealized_profit_loss_open_contracts_prior` (AMT), `unrealized_profit_loss_open_contracts_current` (AMT), `aggregate_profit_loss_on_contracts` (AMT) |
| Box 12 | `basis_reported_to_irs BIT` |
| Box 13 | `bartering` (AMT) |

Child: `se_1099_b_state_info` (1 slot).

### 5.19 `se_1099_da` — Digital Asset Broker Transactions

Per the user decision to deduplicate `copyA_*`/`copyOther_*`: persist only the
`copyOther_*` (primary) data; Copy A is reconstructed on PDF export.

| Group | Columns (semantic names — strips `copyOther_` prefix) |
|---|---|
| Header flags | `void_checkbox BIT`, `corrected_checkbox BIT` |
| Boxes 2/3a/3b/5–9 | `box2_basis_reported_to_irs BIT`, `box3a_reported_to_irs_gross_proceeds BIT`, `box3a_reported_to_irs_net_proceeds BIT`, `box3b_reserved_for_future_use BIT`, `box3b_qof BIT`, `box5_loss_not_allowed_based_on_amount_in_1f BIT`, `box6_short_term BIT`, `box6_long_term BIT`, `box6_ordinary BIT`, `box7_check_if_1f_is_only_cash BIT`, `box8_broker_relied_on_customer_provided_acquisition_information BIT`, `box9_digital_asset_is_noncovered_security BIT` |
| Box 11a | `box11a_qualifying_stablecoins BIT`, `box11a_specified_nfts BIT` |
| Filer | `filer_name`, `filer_street_address`, `filer_room_or_suite_no`, `filer_city_or_town`, `filer_telephone_number`, `filer_state_or_province`, `filer_country`, `filer_zip_or_foreign_postal_code`, `filer_tin` |
| Recipient | `recipient_tin`, `recipient_name`, address columns |
| Account / CUSIP | `account_number`, `cusip_number` |
| Box 1 | `box1a_code_for_digital_asset`, `box1b_name_of_digital_asset`, `box1c_number_of_units NVARCHAR(40)` (text, precision), `box1d_and_1e_dates`, `box1d_date_acquired`, `box1e_date_sold_or_disposed` |
| Box 1f–1i | `box1f_proceeds NVARCHAR(40)`, `box1g_cost_or_other_basis NVARCHAR(40)`, `box1h_accrued_market_discount NVARCHAR(40)`, `box1i_wash_sale_loss_disallowed NVARCHAR(40)` (text per inventory note 7 — preserves user formatting; parsed at compute) |
| Box 4 | `box4_federal_income_tax_withheld NVARCHAR(40)` |
| Box 11 | `box11b_number_of_transactions NVARCHAR(40)`, `box11c_aggregate_gross_proceeds_of_specified_nfts NVARCHAR(40)` |
| Box 12 | `box12a_number_of_units_transferred_in_1 NVARCHAR(40)` (slots 1–3), `box12b_transfer_in_date NVARCHAR(20)` |
| Box 14–16 (state) | `box14_state_name_1 NCHAR(2)`, `box14_state_name_2 NCHAR(2)`, `box15_state_identification_no_1 NVARCHAR(40)`, `box15_state_identification_no_2 NVARCHAR(40)`, `box16_state_tax_withheld_1 NVARCHAR(40)`, `box16_state_tax_withheld_2 NVARCHAR(40)` |
| 8949 mapping | `applicable_checkbox_on_form_8949 NCHAR(1)` |

### 5.20 `se_1099_cap`

| Group | Columns |
|---|---|
| Header | void/corrected/calendar_year |
| Corporation | `corporation_tin`, `corporation_name_address`, `corporation_telephone` |
| Shareholder | `shareholder_tin`, name fields, address |
| Boxes | `date_of_sale_or_exchange NVARCHAR(20)`, `aggregate_amount_received` (AMT), `number_of_shares_exchanged DECIMAL(19,4)`, `classes_of_stock_exchanged NVARCHAR(100)`, `additional_info NVARCHAR(MAX)` |

### 5.21 `se_form_2439`

All amount fields persist as text per source (inventory note 7).

| Column | Type | Notes |
|---|---|---|
| `void BIT`, `corrected BIT` | | |
| `ric_reit_name_address` | NVARCHAR(MAX) | |
| `ric_reit_ein` | NVARCHAR(10) | |
| `shareholder_tin` | NVARCHAR(11) | [PII] |
| `shareholder_name_address` | NVARCHAR(MAX) | |
| `box1a_total_undistributed_long_term_capital_gain` | NVARCHAR(40) | text |
| `box1b_unrecaptured_section_1250_gain` | NVARCHAR(40) | text |
| `box1c_section_1202_gain` | NVARCHAR(40) | text |
| `box1d_collectibles_gain` | NVARCHAR(40) | text |
| `tax_paid_on_undistributed_gains` | NVARCHAR(40) | text |

### 5.22 `se_form_3921`

| Group | Columns |
|---|---|
| Header | void/corrected/calendar_year |
| Transferor | `transferor_tin`, `transferor_name_address` |
| Employee | `employee_tin`, name fields, address |
| Boxes 1–5 | `date_option_granted NVARCHAR(20)`, `date_option_exercised NVARCHAR(20)`, `exercise_price_per_share` (AMT), `fair_market_value_per_share` (AMT), `shares_transferred` (AMT — fractional shares ok) |
| Box 6 (other corp) | `underlying_corp_tin`, `underlying_corp_name`, address columns |

### 5.23 `se_form_6781` (Section 1256 Contracts and Straddles)

Semantic column names sourced from
`C:\us-tax\pdfs\f6781_field_map_semantic.csv` (71 fields; all mapped by
the capital-mappings generator). Per-form columns beyond PRIMARY_KEY:

| Group | Columns |
|---|---|
| Header | `names_shown_on_tax_return NVARCHAR(200)` [PII], `identifying_number NVARCHAR(11)` [PII] |
| Election boxes (Part I top) | `boxA_mixed_straddle_election BIT`, `boxB_straddle_by_straddle_identification_election BIT`, `boxC_mixed_straddle_account_election BIT`, `boxD_net_section_1256_contracts_loss_election BIT` |
| Part I Section 1256 contracts | `partI_line1_row1..3_description NVARCHAR(200)`, `partI_line1_row1..3_loss DECIMAL(19,4)`, `partI_line1_row1..3_gain DECIMAL(19,4)` (3 rows × 3 cols), then totals `partI_line2_total_losses_column_b DECIMAL(19,4)`, `partI_line2_total_gains_column_c`, `partI_line3_net_gain_or_loss`, `partI_line4_1099b_adjustments`, `partI_line5_combine_lines_3_and_4`, `partI_line6_carryback`, `partI_line7_combine_lines_5_and_6`, `partI_line8_short_term_40_pct`, `partI_line9_long_term_60_pct` |
| Part II Section A — losses from straddles | Line 10 = 2 rows × 8 cols (a–h): `partII_line10_row1..2_a_description`, `_b_date_entered`, `_c_date_closed`, `_d_gross_sales_price DECIMAL(19,4)`, `_e_cost_or_other_basis`, `_f_loss_if_e_exceeds_d`, `_g_unrecognized_gain_on_offsetting_positions`, `_h_recognized_loss`; `partII_line11a_short_term_portion DECIMAL(19,4)`, `partII_line11b_long_term_portion` |
| Part II Section B — gains from straddles | Line 12 = 2 rows × 6 cols (a–f); `partII_line13a_short_term_portion DECIMAL(19,4)`, `partII_line13b_long_term_portion` |
| Part III Unrecognized gains | Line 14 = 3 rows × 5 cols: `partIII_line14_row1..3_a_description`, `_b_date_acquired`, `_c_fair_market_value_last_business_day DECIMAL(19,4)`, `_d_cost_or_other_basis_as_adjusted`, `_e_unrecognized_gain` |

Full column list in `C:\us-tax\pdfs\f6781_field_map_semantic.csv`. The
Step 5 DDL generator reads this CSV and emits `CREATE TABLE` with the
correct type per column (BIT for checkboxes, DECIMAL(19,4) for amount
boxes, NVARCHAR for text/description, DATE for `date_*` columns).

### 5.24 `se_child_interest_dividends` — Form 8814 per-child entry

Storage path: `users/{uid}/child-interest-dividends/{entryId}`. One row per
child. Linked to `dependent.id` (not `owner_role`).

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `uid` | NVARCHAR(128) FK CASCADE | |
| `dependent_id` | BIGINT NULL FK → dependent(id) | NULL if child not yet a registered dependent |
| `child_first_name`, `child_last_name` | NVARCHAR(100) | [PII] |
| `child_ssn` | NVARCHAR(11) | [PII] |
| `line1a_taxable_interest` | DECIMAL(19,4) | |
| `line1b_tax_exempt_interest` | DECIMAL(19,4) | |
| `line2a_ordinary_dividends` | DECIMAL(19,4) | |
| `line2b_qualified_dividends` | DECIMAL(19,4) | |
| `line3_cap_gain_distributions` | DECIMAL(19,4) | |
| `statement_derived_json` | NVARCHAR(MAX) | server-supplied aggregation cache |

Index: `IX_se_child_interest_dividends_uid_dep (uid, dependent_id)`.

### 5.25 `se_form_8606`

All amount fields persist as text per inventory note 7. Per-person scoped via
`owner_role`.

| Group | Columns |
|---|---|
| Preparer flag | `paid_preparer_self_employed_checkbox BIT` |
| Taxpayer info | `taxpayer_name` [PII], `taxpayer_ssn` [PII], home address columns, foreign address columns |
| Part I lines 1–15c | `part1_line1_nondeductible_contributions NVARCHAR(40)` ... (15 fields, all NVARCHAR(40) text) |
| Part II lines 16–18 | `part2_line16_net_amount_converted_to_roth NVARCHAR(40)` ... (3 fields) |
| Part III lines 19–25c | `part3_line19_total_nonqualified_roth_distributions NVARCHAR(40)` ... (10 fields) |
| Signature/preparer block | signature fields, paid-preparer block |

UNIQUE (uid, owner_role) — typically one document per person per year;
backend aggregates if multiple.

### 5.26 `se_1099_r`

PII_HEADER + boxes:

| Box | Column |
|---|---|
| 1 | `gross_distribution` (AMT) |
| 2a | `taxable_amount` (AMT) |
| 2b | `taxable_amount_not_determined BIT`, `total_distribution BIT` |
| 3 | `capital_gain_included_in_2a` (AMT) |
| 4 | `federal_income_tax_withheld` (AMT) |
| 5 | `employee_or_roth_contributions_or_premiums` (AMT) |
| 6 | `net_unrealized_appreciation` (AMT) |
| 7 | `distribution_codes NVARCHAR(8)`, `ira_sep_simple BIT` |
| 8 | `other_amount DECIMAL(19,4)`, `other_percentage NVARCHAR(20)` |
| 9a | `your_percentage_of_total_distribution NVARCHAR(20)` |
| 9b | `total_employee_contributions` (AMT) |
| 10 | `amount_allocable_to_irr_within_5_years` (AMT) |
| 11 | `first_year_of_designated_roth_contrib NVARCHAR(20)` |
| 12 | `fatca_filing_requirement BIT` |
| 13 | `date_of_payment NVARCHAR(20)` |

Child: `se_1099_r_state_local_info` (2 slots; 1099-R variant adds
`state_distribution`/`local_distribution` (AMT) columns).

### 5.27 `se_form_5498`

Standard issuer + participant block + boxes:

| Box | Column |
|---|---|
| 1 | `ira_contributions` (AMT) |
| 2 | `rollover_contributions` (AMT) |
| 3 | `roth_conversion` (AMT) |
| 4 | `recharacterized_contributions` (AMT) |
| 5 | `fmv_of_account` (AMT) |
| 6 | `life_insurance_cost_included_in_box1` (AMT) |
| 7 | `ira_checkbox BIT`, `sep_checkbox BIT`, `simple_checkbox BIT`, `roth_ira_checkbox BIT` |
| 8 | `sep_contributions` (AMT) |
| 9 | `simple_contributions` (AMT) |
| 10 | `roth_ira_contributions` (AMT) |
| 11 | `rmd_for_next_year BIT` |
| 12 | `rmd_date NVARCHAR(20)`, `rmd_amount` (AMT) |
| 13 | `postponed_late_contributions` (AMT), `postponed_late_contributions_year NVARCHAR(8)`, `postponed_late_contributions_code NVARCHAR(16)` |
| 14 | `repayments` (AMT), `repayments_code NVARCHAR(16)` |
| 15 | `fmv_of_certain_specified_assets` (AMT), `specified_assets_codes NVARCHAR(64)` |

### 5.28 `se_rrb_1099`

| Group | Columns |
|---|---|
| Header | `corrected BIT`, `duplicate BIT`, `calendar_year NVARCHAR(8)` |
| Identifiers | `claim_number_payee_code NVARCHAR(40)`, `recipient_id_number NVARCHAR(40)` |
| Boxes 3–11 (all AMT) | `sseb_gross`, `sseb_repaid`, `net_sseb` (may be negative), `workers_comp_offset`, `sseb_prior_year_y1`, `sseb_prior_year_y2`, `sseb_prior_year_y3_plus`, `federal_income_tax_withheld`, `medicare_premiums_total` |

### 5.29 `se_rrb_1099_r`

| Group | Columns |
|---|---|
| Header | corrected, duplicate, calendar_year |
| Identifiers | claim_number_payee_code, recipient_id_number |
| Boxes 3–10 (all AMT) | `employee_contributions_cost`, `contributory_amount_paid`, `vested_dual_benefit`, `supplemental_annuity`, `total_gross_paid` (= 4+5+6), `repayments_prior_unknown_years`, `federal_income_tax_withheld`, `medicare_premiums_total` |

### 5.30 `se_ssa_1099`

| Group | Columns |
|---|---|
| Header | `calendar_year NVARCHAR(8)` |
| Beneficiary | `beneficiary_ssn` [PII], `beneficiary_first_name`, `beneficiary_last_name`, `beneficiary_suffix`, address fields, `claim_number NVARCHAR(40)` |
| Boxes 3–6 (AMT) | `benefits_paid_gross`, `benefits_repaid`, `net_benefits` (may be negative), `voluntary_federal_income_tax_withheld` |

### 5.31 `se_1099_a`

Lender + borrower + boxes: `date_of_acquisition_or_abandonment NVARCHAR(20)`,
`balance_of_principal_outstanding` (AMT), `fair_market_value_of_property` (AMT),
`borrower_personally_liable BIT`, `description_of_property NVARCHAR(MAX)`.

### 5.32 `se_1099_c`

Creditor + debtor + boxes: `date_of_identifiable_event NVARCHAR(20)`,
`amount_of_debt_discharged` (AMT), `interest_included_in_box2` (AMT),
`debt_description NVARCHAR(MAX)`, `debtor_personally_liable BIT`,
`identifiable_event_code NCHAR(1)` CHECK IN (`A`,`B`,`C`,`D`,`E`,`F`,`G`,`H`,`I`),
`fair_market_value_of_property` (AMT).

### 5.33 `se_1099_g`

PII_HEADER (with void) + boxes:

| Box | Column |
|---|---|
| 1 | `unemployment_compensation` (AMT) |
| 2 | `state_local_income_tax_refunds` (AMT) |
| 3 | `box2_year NVARCHAR(8)` |
| 4 | `federal_income_tax_withheld` (AMT) |
| 5 | `rtaa_payments` (AMT) |
| 6 | `taxable_grants` (AMT) |
| 7 | `agriculture_payments` (AMT) |
| 8 | `trade_or_business_income BIT` |
| 9 | `market_gain` (AMT) |

Child: `se_1099_g_state_info` (2 slots).

### 5.34 `se_1099_s`

Filer + transferor (granular + legacy combined) blocks + boxes:
`date_of_closing NVARCHAR(20)`, `gross_proceeds` (AMT), `cash_gross_proceeds` (AMT),
`digital_asset_gross_proceeds` (AMT), `property_address_or_legal_description NVARCHAR(MAX)`,
`buyers_part_of_real_estate_tax` (AMT), `consideration_includes_property_or_services BIT`,
`transferor_is_foreign_person BIT`, `digital_asset_code NVARCHAR(40)`,
`digital_asset_name NVARCHAR(200)`, `digital_asset_units NVARCHAR(40)`,
`digital_asset_date NVARCHAR(20)`.

### 5.35 `se_form_4684` / `se_form_4797` / `se_form_8824` / `se_form_6252`

All four forms now have fully semantic column names sourced from their
`*_field_map_semantic.csv` (generated 2026-05-25 via the
capital-mappings generator; see `data_model_validation.md` §1 for the
generator run summary). Per-form column-group summaries:

#### `se_form_6252` — Installment Sale Income (49 cols)

| Group | Columns |
|---|---|
| Header | `names_shown_on_return`, `identifying_number` |
| Property | `line1_description_of_property NVARCHAR(MAX)`, `line2a_date_acquired DATE`, `line2b_date_sold DATE` |
| Gates | `line3_sold_to_related_party_yes BIT`, `line3_..._no BIT`, `line4_can_determine_total_selling_price_yes BIT`, `line4_..._no BIT` |
| Part I — Gross Profit and Contract Price (lines 5–18) | 14 DECIMAL(19,4) amount columns: `line5_selling_price_..._mortgages_and_other_debts`, `line6_mortgages_debts_buyer_assumed`, `line7_subtract_line6_from_line5`, `line8_cost_or_other_basis_of_property_sold`, `line9_depreciation_allowed_or_allowable`, `line10_adjusted_basis_line8_minus_line9`, `line11_commissions_and_other_expenses_of_sale`, `line12_income_recapture_from_form_4797_part_iii`, `line13_add_lines_10_11_and_12`, `line14_subtract_line13_from_line5`, `line15_main_home_excluded_gain`, `line16_gross_profit_line14_minus_line15`, `line17_subtract_line13_from_line6_if_zero_or_less_zero`, `line18_contract_price_add_line7_and_line17` |
| Part II — Installment Sale Income (lines 19–26) | 8 DECIMAL(19,4) columns: `line19_gross_profit_percentage_decimal`, `line20..line26_*` |
| Part III — Related Party Installment Sale (lines 27–37) | `line27_related_party_name_address_id_line1`, `line27_..._line2`, `line28_related_party_resold_yes BIT`, `line28_..._no BIT`, 5 line29 checkboxes + `line29a_date_of_disposition DATE`, 8 amount columns `line30..line37_*` |

#### `se_form_4684` — Casualties and Thefts (162 cols)

4-section form: A (personal-use), B (business/income-producing), C (theft losses), D (revoked elections). Columns prefixed `partA_`, `partB_`, `partB_partII_` (summary), `partC_partI_`, `partC_partII_`, `partD_partI_` (election), `partD_partII_` (revocation). Common groupings:

| Group | Columns |
|---|---|
| Section A header | `section_a_federally_declared_disaster_checkbox BIT`, `names_shown_on_return`, `identifying_number`, `section_a_dr_declaration_number NVARCHAR(64)`, `section_a_em_declaration_number NVARCHAR(64)` |
| Section A property table | Line 1 = 4 columns × 4 properties (description + date + cost + insurance reimbursement) |
| Section A per-property (lines 2–9) | 8 columns × 4 properties (32 amount fields) |
| Section A totals (lines 10–18) | 9 DECIMAL(19,4) columns: `partA_line10_total_casualty_or_theft_loss_add_line9_a_through_d`, etc. through `partA_line18_smaller_of_line17_or_personal_disaster_floor` |
| Section B (lines 19–28) | Property descriptions + 8 cols × 4 properties + line 28 total |
| Section B Part II (lines 29–39) | 2-row gain/loss table + lines 30–33 + 2-row line 34 + lines 35–39 totals |
| Section C (lines 40–51) | 13 columns; line 46 splits into whole + decimal halves |
| Section C Part II (declarations) | 4 fields (name, TIN, address, prior-return dates) |
| Section D Part I — Election (lines 52–54) | 6 fields (each line spans 2 fillable rows) |
| Section D Part II — Revocation (lines 55–57) | 5 fields including `partD_partII_line56_date_prior_election_filed DATE` |

#### `se_form_4797` — Sales of Business Property (182 cols)

4-part form with per-property tables in Parts I, II, III, IV. Common groupings:

| Group | Columns |
|---|---|
| Header | `names_shown_on_return`, `identifying_number`, `line1a_gross_proceeds_from_1099b_or_1099s DECIMAL(19,4)`, `line1b_gain_partial_dispositions_macrs_assets`, `line1c_loss_partial_dispositions_macrs_assets` |
| Part I (lines 2–9) | Line 2 = 4 property rows × 7 cols (a–g: description, date acquired, date sold, gross sales price, depreciation, cost+expense, gain/loss) + lines 3 (Form 4684), 4 (Form 6252 §1231), 5 (Form 8824), 6 (line 32), 7 (combine), 8 (nonrecaptured §1231 losses), 9 (subtract) |
| Part II (lines 10–18b) | Line 10 = 4 property rows × 7 cols + lines 11–18b totals + income-producing property loss split |
| Part III (lines 19–32) | Line 19 = 4 properties × 3 cols (description, date acquired, date sold); lines 20–24 × 4 properties; §1245/§1250/§1252/§1254/§1255 recapture sections × 4 properties; lines 30/31/32 summary |
| Part IV (lines 33–35) | Two columns (Section 179 / Section 280F(b)(2)) for prior-year depreciation, recomputed depreciation, recapture amount |

#### `se_form_8824` — Like-Kind Exchanges (63 cols)

| Group | Columns |
|---|---|
| Header | `names_shown_on_return`, `identifying_number` (repeated on page 2) |
| Part I (lines 1–7) | Property given-up + received descriptions (4 text lines), 4 DATE fields, line 7 yes/no related-party checkboxes |
| Part II (lines 8–11) | Related-party name/relationship/ID/address; line 9 + line 10 yes/no pairs; line 11a/b/c exception checkboxes |
| Part III (lines 12–25) | Descriptions, 22 amount fields; line 19 has both inner (annotation) and outer (amount) columns; line 25 has 3 sub-lines a/b/c |
| Part IV (lines 26–38) | Conflict-of-interest section: certificate number split across 2 text fragments, lines 27 + 28 each spanning 2 text rows, line 29 DATE, lines 30–38 amount fields |

### 5.36 `se_schedule_k1_1041` / `se_schedule_k1_1065` / `se_schedule_k1_1120s`

All three K-1 forms now have fully semantic column names sourced from
their `schedule_k1_form_<NNNN>_field_map_semantic.csv`. The Section 199A
columns (`section199AQualifiedBusinessIncomeAmount`, etc.) are read at
compute time for line 13a QBI deduction (per
`TaxReturnComputeService.java:5208-5256`) so they remain as **explicit
typed columns** in the schema, separate from the PDF-mapped columns:

```sql
-- Semantic 199A block (present on all 3 K-1 variants; read by compute)
recipient_tin NVARCHAR(11) NOT NULL                                -- [PII]
section_199a_qualified_business_income_amount   NVARCHAR(40)
section_199a_qualified_reit_dividends_amount    NVARCHAR(40)
section_199a_qualified_ptp_income_or_loss_amount NVARCHAR(40)
section_199a_w2_wages_amount                    NVARCHAR(40)
section_199a_ubia_qualified_property_amount     NVARCHAR(40)
section_199a_is_sstb                            BIT
section_199a_statement_notes                    NVARCHAR(MAX)
```

Beyond the 199A block, each K-1 has its own PDF-mapped columns:

#### `se_schedule_k1_1041` — Trust/Estate Beneficiary (74 cols)

| Group | Columns |
|---|---|
| Header | `header_final_k1 BIT`, `header_amended_k1 BIT`, + 5 tax-year date fragments |
| Part I (Estate or Trust) | A=`part1_a_estate_or_trust_ein`, B=`part1_b_estate_or_trust_name`, C=`part1_c_fiduciary_name_address`, D=Form 1041-T checkbox + DATE filed, E=`part1_e_final_form_1041 BIT` |
| Part II (Beneficiary) | F=`part2_f_beneficiary_id_number`, G=`part2_g_beneficiary_name_address`, H=domestic/foreign checkboxes |
| Part III (Lines 1–14) | Lines 1–8 single-amount rows. Line 9 = 3 code+amount pairs (directly apportioned deductions A/B/C). Line 10 single amount. Lines 11–14 paired code+amount columns: 3+3+5+8 boxes. Naming: `part3_line11_box1_code`, `part3_line11_box1_amount`, etc. |

#### `se_schedule_k1_1065` — Partnership Partner (111 cols)

| Group | Columns |
|---|---|
| Header | `header_final_k1 BIT`, `header_amended_k1 BIT`, 5 calendar-year date fragments |
| Part I (Partnership) | A=EIN, B=name/address, C=IRS center, D=PTP checkbox |
| Part II (Partner) | E=SSN/TIN, F=name/address, G=2 partner-type checkboxes, H1=domestic/foreign, H2=Disregarded Entity TIN/name, I1=entity type, I2=retirement plan checkbox, J=6 profit/loss/capital begin+end percentages + 2 sale/exchange checkboxes, K1=6 liability begin+end fields, K2/K3=2 checkboxes, L=6 capital-account rows, M=2 yes/no, N=2 §704(c) begin+end |
| Part III (Lines 1–23) | Lines 1–10 single amounts; lines 11–13 code+amount (line 13 has 4 rows); lines 14–21 multi-row code+amount (15: 3 rows, 18: 3 rows, 19: 3 rows, 20: 4 rows, 21: 2 rows); line 16 = K-3 checkbox; lines 22–23 at-risk/passive checkboxes |

#### `se_schedule_k1_1120s` — S-Corp Shareholder (114 cols)

| Group | Columns |
|---|---|
| Header | 2 checkboxes (final/amended K-1) + 5 tax-year date fragments |
| Part I (Corporation) | A=EIN, B=name/address, C=IRS center, D=total shares |
| Part II (Shareholder) | E=SSN/EIN, F1=name/address, F2=TIN+name, F3=entity type, G=allocation %, H=shares begin+end, I=loans begin+end |
| Part III (Lines 1–17) | Lines 1–9 single amount; line 10 = 5 code+amount pairs; line 11 single amount (Section 179); line 12 = 8 code+amount pairs; line 13 = 5 credit code+amount pairs; line 14 = K-3 attached checkbox; line 15 (AMT) = 5 pairs; line 16 (basis) = 4 pairs; line 17 (other info) = 11 pairs |
| Footer | Lines 18 + 19 at-risk / passive activity checkboxes |

### 5.37 `se_1099_ptr` (Form 1099-PATR)

PII_HEADER (with void) + boxes 1–12 (AMT pairs) + box 13 `specified_coop BIT`.

### 5.38 Section 5 summary

37 statement-entry parent tables + estimated 13 child tables (state_info,
state_local_info variants per form, box12, box14, covered_individuals,
coverage_monthly, part2_monthly_row, part3_covered_individual) = **~50 tables**.

| Pattern | Count |
|---|---|
| Fully semantic-column tables | **37** — covers ALL statement forms: W-2, W-2G, 1099-NEC/MISC/K/INT/DIV/OID/B/CAP/A/C/G/S/R/Q/QA/LTC/SA/PTR, 1095-A/B/C, 1098-T/E, 5498, RRB-1099, RRB-1099-R, SSA-1099, 8606, 2439, 3921, child-interest-dividends, 4684, 4797, 6252, 6781, 8824, K-1 1041/1065/1120s |
| Opaque-PDF-slot tables | **0** (resolved 2026-05-25 via capital-mappings generator; see `data_model_validation.md` §1) |

The 8 previously-opaque forms (4684, 4797, 6252, 6781, 8824, K-1 family —
826 fields total) now have semantic columns sourced from
`C:\us-tax\pdfs\*_field_map_semantic.csv`. Regenerate with:

```bash
cd C:\us-tax\us-tax-ui
NODE_PATH=node_modules node ../us-tax-be/scripts/generate-semantic-capital-forms-mapped.js C:/us-tax/pdfs
```

Cumulative running total: 5 core + 45 personal + 50 statement = **~100 tables**
on the input side.

---

## 6. Tax-return output anchor + Form 1040

Source inventory: `data_model_output_1040.md`.

### 6.1 Normalization principle for the output side

The Java output model uses small POJOs for logical grouping
(`Form1040.filer`, `Form1040.filingStatus`, `Form1040.address`, ...) — but
all such relationships are **1:1** with Form 1040. Splitting them into
separate tables would not reduce row duplication (definitionally impossible
in 1:1) and would force JOINs on every compute write/read.

**Rule for §6-§8**: collapse all 1:1 nested POJOs into the parent table as
column groups. Split a child into its own table ONLY when:
- it is `List<T>` (true 1:N), OR
- it is referenced from multiple parents (rare; e.g. `ScheduleHeader` —
  inlined since the duplicate `(name, ssn)` cost is trivial).

This still satisfies "full normalization" — every fact stored once. It just
avoids over-decomposition of 1:1 relationships, which is a schema
simplification, not a normalization violation.

### 6.2 `tax_return` (anchor; 1:1 with `app_user`)

| Column | Type | Null | Constraint | Notes |
|---|---|---|---|---|
| `uid` | NVARCHAR(128) | NO | PK, FK → app_user(uid) CASCADE | One return per user (per `data_model.md` §1) |
| `computed_at` | DATETIMEOFFSET | YES | — | Set on each successful compute |
| `tax_year` | INT | NO | default 2025 | |
| `compute_status` | NVARCHAR(16) | NO | CHECK IN (`ok`,`blocked`,`error`), default `ok` | Mirrors top-level flag state |
| `created_at`, `updated_at` | DATETIMEOFFSET | NO | — | Audit |

All other `out_*` tables FK back to `tax_return.uid` (not to a separate
`tax_return.id`) so the cascade chain is single-step. UNIQUE on `uid` is
implicit (PK).

### 6.3 `out_form_1040`

Wide table inlining Form1040 + Filer + FilingStatus + PresidentialElection
+ DigitalAssets + StandardDeductionIndicators + Address + Spouse + Income +
Adjustments + Deductions + TaxAndCredits + Payments + Refund + AmountOwed +
ThirdPartyDesignee + Signature.

| Column | Type | Null | Notes |
|---|---|---|---|
| `tax_return_uid` | NVARCHAR(128) | NO | PK, FK → tax_return(uid) CASCADE |

Then the columns of the 17 inlined sub-types follow, with class-name prefixes
to avoid collisions:

| Group | Columns (Java field name → SQL column; representative subset) |
|---|---|
| **Filer** | `filer_first_name NVARCHAR(100)`, `filer_middle_initial NVARCHAR(1)`, `filer_last_name NVARCHAR(100)`, `filer_ssn NVARCHAR(11)` [PII], `filer_date_of_birth DATE` |
| **FilingStatus** | `filing_status NVARCHAR(8) FK ref_filing_status`, `mfs_spouse_name NVARCHAR(200)`, `mfs_spouse_ssn NVARCHAR(11)` [PII], `mfs_or_hoh_lived_apart_or_legally_separated BIT`, `hoh_qualifying_person_name NVARCHAR(200)`, `treat_nonresident_spouse_as_resident BIT`, `alien_person_name NVARCHAR(200)` |
| **PresidentialElection** | `pres_election_you BIT`, `pres_election_spouse BIT` |
| **DigitalAssets** | `digital_assets_response NVARCHAR(8)` CHECK IN (`yes`,`no`) |
| **StandardDeductionIndicators** | `someone_can_claim_you BIT`, `someone_can_claim_spouse BIT`, `spouse_itemizes_separate_return BIT`, `you_were_dual_status_alien BIT`, `you_born_before_threshold BIT`, `you_are_blind BIT`, `spouse_born_before_threshold BIT`, `spouse_is_blind BIT`, `line12d_boxes_checked_count TINYINT`, `spouse_meets_age_blindness_mfs_requirements BIT` (deprecated `spouse_itemizes_or_dual_status` dropped) |
| **Address** | `address_line_1 NVARCHAR(200)`, `address_line_2 NVARCHAR(200)`, `address_city NVARCHAR(100)`, `address_state NCHAR(2) FK ref_us_state`, `address_zip_code NVARCHAR(10)`, `address_foreign_country NVARCHAR(2) FK ref_country`, `address_foreign_province NVARCHAR(100)`, `address_postal_code NVARCHAR(20)` |
| **Spouse** | `spouse_first_name`, `spouse_middle_initial`, `spouse_last_name`, `spouse_ssn` [PII], `spouse_date_of_birth DATE` |
| **Income (lines 1a–9)** | `income_wages_1a DECIMAL(19,4)`, `income_household_employee_wages_1b`, `income_tips_1c`, `income_medicaid_waiver_1d`, `income_dependent_care_benefits_1e`, `income_adoption_benefits_1f`, `income_uncollected_ss_medicare_wages_1g`, `income_other_earned_1h`, `income_combat_pay_election_1i`, `income_total_wages_1z`, `income_tax_exempt_interest_2a`, `income_taxable_interest_2b`, `income_qualified_dividends_3a`, `income_ordinary_dividends_3b`, `income_line3c_child_dividends_in_3a BIT`, `income_line3c_child_dividends_in_3b BIT`, `income_ira_distributions_4a`, `income_taxable_ira_distributions_4b`, `income_line4c_box1_rollover BIT`, `income_line4c_box2_qcd BIT`, `income_line4c_box3_other BIT`, `income_line4c_box3_text NVARCHAR(MAX)`, `income_line4c_exception_breakout_statement_required BIT`, `income_line4a_rollover_attachment_text NVARCHAR(MAX)`, `income_line4c_qcd_sie_attachment_text NVARCHAR(MAX)`, `income_line4c_breakout_statement_text NVARCHAR(MAX)`, `income_pensions_annuities_5a`, `income_taxable_pensions_annuities_5b`, `income_line5c_box1_rollover BIT`, `income_line5c_box2_pso BIT`, `income_line5c_box3_other BIT`, `income_line5c_box3_text NVARCHAR(MAX)`, `income_social_security_benefits_6a`, `income_taxable_social_security_benefits_6b`, `income_line6c_lump_sum_election BIT`, `income_line6d_mfs_lived_apart_all_year BIT`, `income_capital_gain_loss_7a`, `income_line7b_schedule_d_not_required BIT`, `income_line7b_includes_child_capital_gain_loss BIT`, `income_line7b_child_amount_from_form_8814_line10 DECIMAL(19,4)`, `income_other_income_schedule1_8`, `income_total_income_9` |
| **Adjustments** | `adjustments_schedule1_10 DECIMAL(19,4)`, `adjustments_line11a_agi`, `adjustments_line11b_amount_from_line11a_agi`, `adjustments_adjusted_gross_income` |
| **Deductions** | `deductions_line12a_checked BIT`, `deductions_line12b_checked BIT`, `deductions_line12c_checked BIT`, `deductions_line12d_boxes_checked_count TINYINT`, `deductions_election NVARCHAR(16)` CHECK IN (`STANDARD`,`ITEMIZED`), `deductions_standard_computed DECIMAL(19,4)`, `deductions_itemized_from_schedule_a DECIMAL(19,4)`, `deductions_type NVARCHAR(16)`, `deductions_amount_12e DECIMAL(19,4)`, `deductions_qbi_13a DECIMAL(19,4)`, `deductions_additional_13b DECIMAL(19,4)`, `deductions_total_14 DECIMAL(19,4)`, `deductions_taxable_income_15 DECIMAL(19,4)`, `deductions_line15_taxable_income DECIMAL(19,4)` |
| **TaxAndCredits (lines 16–24)** | `tac_tax DECIMAL(19,4)`, `tac_regular_tax DECIMAL(19,4)`, `tac_computation_method NVARCHAR(16)` CHECK IN (`TAX_TABLE`,`TCW`,`QDCG`,`SCHEDULE_D_TW`,`F2555_FEITW`,`F8615`), `tac_box1_form_8814_tax`, `tac_box2_form_4972_tax`, `tac_ecr_box3_tax`, `tac_box1_checked BIT`, `tac_box2_checked BIT`, `tac_box3_checked BIT`, `tac_box3_code NVARCHAR(16)` CHECK IN (`962`,`ECR`,`1291TAX`,`Form 8978`,`965INC`), `tac_alternative_minimum_tax_17 DECIMAL(19,4)`, `tac_additional_tax_schedule2 DECIMAL(19,4)`, `tac_total_tax_before_credits DECIMAL(19,4)`, `tac_child_tax_credit_19 DECIMAL(19,4)`, `tac_other_credits_schedule3_20`, `tac_total_credits_21`, `tac_tax_after_credits_22`, `tac_other_taxes_23`, `tac_total_tax_24` |
| **Payments (lines 25–33)** | `pay_withholding_w2_25a DECIMAL(19,4)`, `pay_withholding_1099_25b`, `pay_withholding_other_25c`, `pay_total_withholding_25d`, `pay_estimated_tax_payments_26`, `pay_earned_income_credit_27`, `pay_additional_child_tax_credit_28`, `pay_american_opportunity_credit_29`, `pay_refundable_adoption_credit_30`, `pay_other_payments_schedule3_31`, `pay_total_other_payments_and_refundable_credits_32`, `pay_total_payments_33` |
| **Refund (lines 34–36)** | `refund_overpaid_34 DECIMAL(19,4)`, `refund_amount_35a DECIMAL(19,4)`, `refund_direct_deposit BIT`, `refund_routing_number NVARCHAR(20)` [PII], `refund_account_type NVARCHAR(16)` CHECK IN (`checking`,`savings`), `refund_account_number NVARCHAR(40)` [PII], `refund_amount_applied_to_next_year_36 DECIMAL(19,4)` |
| **AmountOwed (lines 37–38)** | `amount_owed_37 DECIMAL(19,4)`, `estimated_tax_penalty_38 DECIMAL(19,4)` |
| **ThirdPartyDesignee** | `designee_allowed BIT`, `designee_name NVARCHAR(200)`, `designee_phone NVARCHAR(40)`, `designee_pin NVARCHAR(8)` [PII] |
| **Signature** | `signature_taxpayer NVARCHAR(200)`, `signature_spouse NVARCHAR(200)`, `signature_taxpayer_occupation NVARCHAR(100)`, `signature_spouse_occupation NVARCHAR(100)`, `signature_taxpayer_ip_pin NVARCHAR(6)` [PII], `signature_spouse_ip_pin NVARCHAR(6)` [PII], `signature_date_signed DATE`, `signature_phone_number NVARCHAR(40)`, `signature_email NVARCHAR(255)` |

Total ~130 columns. Single row per `tax_return_uid`.

### 6.4 `out_form_1040_dependent`

`List<Dependent>` from Form1040.

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `tax_return_uid NVARCHAR(128)` | FK CASCADE | |
| `idx INT NOT NULL` | UNIQUE (tax_return_uid, idx) | preserves snapshot order |
| `first_name`, `middle_initial`, `last_name` | NVARCHAR(100) | [PII] |
| `ssn NVARCHAR(11)` | [PII] | |
| `date_of_birth DATE` | | |
| `relationship NVARCHAR(32)` | FK ref_relationship | |
| `child_tax_credit_eligible BIT` | | |
| `other_dependent_credit_eligible BIT` | | |
| `full_time_student BIT` | | |
| `permanently_and_totally_disabled BIT` | | |
| `lived_with_taxpayer_more_than_half_year BIT` | | |
| `months_lived_with_taxpayer TINYINT` | CHECK 0..12 | |
| `lived_with_taxpayer_in_usa BIT` | | |
| `lived_with_other_parent BIT` | | |
| `qualifying_child_of_another_taxpayer BIT` | | |

NOTE: distinct from the input `dependent` table — this is a snapshot of
who was claimed at compute time. Different table to keep input/output
separable for re-compute idempotence.

### 6.5 `out_form_1040_other_earned_income_statement`

Form1040.Income.otherEarnedIncomeStatements is `List<String>`.

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `tax_return_uid NVARCHAR(128)` | FK CASCADE | |
| `idx INT NOT NULL` | UNIQUE (tax_return_uid, idx) | |
| `statement_text NVARCHAR(MAX)` | | |

### 6.6 `out_required_attachment_form`

Form1040 has multiple `RequiredAttachmentForm` instances (4797, 4684,
ScheduleE, 2106, 3903, 2439Capital, 6252Capital, 6781Capital, 8824Capital,
ScheduleK1Capital, 8997, 8853, 8889). TaxReturnComputation aggregates these
as separate named fields, not in a list. Schema models them uniformly:

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `tax_return_uid NVARCHAR(128)` | FK CASCADE | |
| `form_code NVARCHAR(32)` | NOT NULL; CHECK IN (`form_4797`,`form_4684`,`schedule_e`,`form_2106`,`form_3903`,`form_2439_capital`,`form_6252_capital`,`form_6781_capital`,`form_8824_capital`,`schedule_k1_capital`,`form_8997`,`form_8853`,`form_8889`) | |
| `header_name NVARCHAR(200)` | [PII] | inlined from ScheduleHeader |
| `header_ssn NVARCHAR(11)` | [PII] | |
| `required BIT NOT NULL` | | |
| `requirement_reason NVARCHAR(MAX)` | | |
| `related_schedule1_amount DECIMAL(19,4)` | | |

UNIQUE (tax_return_uid, form_code).

### 6.7 `tax_return_flag`

`List<TaxReturnFlag>` from TaxReturnComputation.

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `tax_return_uid NVARCHAR(128)` | FK CASCADE | |
| `idx INT NOT NULL` | UNIQUE (tax_return_uid, idx) | |
| `code NVARCHAR(64)` | NOT NULL | |
| `message NVARCHAR(MAX)` | | |
| `blocking BIT NOT NULL` | | |

Index: `IX_tax_return_flag_blocking (tax_return_uid, blocking) WHERE blocking = 1` — fast lookup of blockers for the UI's "fix these before filing" banner.

---

## 7. Schedules (1, 1A, 2, 3, A, B, D, 8812)

Each schedule is conditionally produced. Tables are NULL-able in the sense
that the row may not exist when the schedule isn't applicable. The
`ScheduleHeader (name, ssn)` is inlined as two columns
(`header_name`, `header_ssn`) on every schedule table.

### 7.1 `out_schedule_1`

Inlines `Schedule1AdditionalIncome` (33 fields) and `Schedule1Adjustments`
(26 fields). Total ~65 columns.

PK: `tax_return_uid` (FK → tax_return(uid) CASCADE), UNIQUE.

Representative groups:
- `header_name NVARCHAR(200)` [PII], `header_ssn NVARCHAR(11)` [PII]
- AdditionalIncome lines 1, 2a, 2b, 3, 4, 5, 6, 7, 8a–8z, 9, 10 with field
  names mirroring Java: `add_inc_taxable_refunds_state_local DECIMAL(19,4)`,
  `add_inc_alimony_received`, `add_inc_alimony_received_agreement_date DATE`,
  `add_inc_business_income_loss`, `add_inc_other_gains_losses`,
  `add_inc_rental_real_estate_royalties`, `add_inc_farm_income_loss`,
  `add_inc_unemployment_compensation`,
  `add_inc_other_income_net_operating_loss_8a` ... `add_inc_other_income_digital_assets_8v`,
  `add_inc_other_income_other_8z`, `add_inc_other_income_form_8814`,
  `add_inc_total_other_income_9`, `add_inc_total_additional_income_10`
- Adjustments lines 11–26 with prefix `adj_*`: `adj_educator_expenses_11`,
  ..., `adj_alimony_paid_recipient_ssn_19b NVARCHAR(11)` [PII],
  `adj_alimony_paid_agreement_date_19c DATE`, ..., `adj_total_adjustments_to_income_26`

### 7.2 `out_schedule_1_other_income_item`

`List<Schedule1OtherIncomeItem>` (line 8z items).

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `tax_return_uid NVARCHAR(128)` | FK CASCADE | |
| `idx INT NOT NULL` | UNIQUE (tax_return_uid, idx) | |
| `description NVARCHAR(MAX)` | | |
| `amount DECIMAL(19,4)` | | |

### 7.3 `out_schedule_1_other_adjustment_item`

Same shape as 7.2 (line 24z items).

### 7.4 `out_schedule_1a`

PK: `tax_return_uid`. Columns:

| Column | Type |
|---|---|
| `header_name NVARCHAR(200)`, `header_ssn NVARCHAR(11)` | [PII] |
| `magi DECIMAL(19,4)` | Part I line 3 |
| `line13_tips_deduction DECIMAL(19,4)` | |
| `line21_overtime_deduction DECIMAL(19,4)` | |
| `line30_car_loan_interest_deduction DECIMAL(19,4)` | |
| `line37_enhanced_senior_deduction DECIMAL(19,4)` | |
| `line38_total DECIMAL(19,4)` | → Form 1040 line 13b |
| `taxpayer_raw_tips DECIMAL(19,4)` | pre-phaseout breakdown |
| `spouse_raw_tips DECIMAL(19,4)` | |
| `taxpayer_raw_overtime DECIMAL(19,4)` | |
| `spouse_raw_overtime DECIMAL(19,4)` | |
| `taxpayer_senior_eligible BIT` | |
| `spouse_senior_eligible BIT` | |

### 7.5 `out_schedule_2`

Inlines `Schedule2Tax` (12 fields) and `Schedule2OtherTaxes` (~40 fields).

PK: `tax_return_uid`. Representative columns:

- `header_name`, `header_ssn` [PII]
- **Tax (Part I)**: `tax_excess_advance_premium_tax_credit_repayment DECIMAL(19,4)`, `tax_repayment_new_clean_vehicle_credit`, `tax_repayment_previously_owned_clean_vehicle_credit`, `tax_recapture_net_epe_form_4255_line2a_col_l`, `tax_excessive_payments_form_4255`, `tax_excessive_payments_reference NVARCHAR(MAX)`, `tax_twenty_percent_excessive_payments_form_4255`, `tax_twenty_percent_excessive_payments_reference NVARCHAR(MAX)`, `tax_other_additions_to_tax`, `tax_total_additions_to_tax_2`, `tax_alternative_minimum_tax_1`, `tax_total_tax_3`
- **OtherTaxes (Part II)**: `other_self_employment_tax_4`, `other_unreported_tip_income_tax_5`, `other_uncollected_ss_medicare_tax_on_wages_6`, `other_total_additional_ss_medicare_tax_7`, `other_additional_tax_on_iras_8`, `other_form_5329_not_required BIT`, `other_household_employment_taxes_9`, `other_repayment_first_time_homebuyer_credit_10`, `other_additional_medicare_tax_11`, `other_net_investment_income_tax_12`, `other_uncollected_ss_medicare_rrta_tax_13`, lines 17a–17z (`other_*_17a` ... `other_*_17z`), `other_total_additional_taxes_18`, `other_recapture_net_epe_form_4255_line1d_col_l_19`, `other_section_965_net_tax_liability_installment_20`, `other_total_other_taxes_21`

### 7.6 Schedule 2 child tables

- `out_schedule_2_other_addition_item` — (id, tax_return_uid, idx, description NVARCHAR(MAX), form_number NVARCHAR(32), amount DECIMAL(19,4))
- `out_schedule_2_recapture_other_credit_item` — same shape as above
- `out_schedule_2_other_additional_tax_item` — (id, tax_return_uid, idx, description, amount)

### 7.7 `out_schedule_3`

Inlines `Schedule3NonrefundableCredits` (~21 fields) and
`Schedule3OtherPaymentsCredits` (~11 fields).

PK: `tax_return_uid`. Representative columns:

- `header_name`, `header_ssn` [PII]
- **NonrefundableCredits (Part I)**: `nrc_foreign_tax_credit_1 DECIMAL(19,4)`, `nrc_child_dependent_care_credit_2`, `nrc_education_credits_3`, `nrc_retirement_savings_contributions_credit_4`, `nrc_residential_clean_energy_credit_5a`, `nrc_energy_efficient_home_improvement_credit_5b`, `nrc_general_business_credit_6a`, `nrc_prior_year_minimum_tax_credit_6b`, `nrc_adoption_credit_6c`, `nrc_elderly_disabled_credit_6d`, `nrc_clean_vehicle_credit_6e`, `nrc_mortgage_interest_credit_6f`, `nrc_dc_first_time_homebuyer_credit_6g`, `nrc_qualified_electric_vehicle_credit_6h`, `nrc_alternative_fuel_vehicle_refueling_property_credit_6i`, `nrc_credit_to_holders_of_tax_credit_bonds_6j`, `nrc_amount_from_form_8978_line14_6l`, `nrc_credit_previously_owned_clean_vehicles_6m`, `nrc_other_nonrefundable_credits_6z`, `nrc_total_other_nonrefundable_credits_7`, `nrc_total_nonrefundable_credits_8`
- **OtherPaymentsCredits (Part II)**: `opc_net_premium_tax_credit_9`, `opc_amount_paid_with_extension_10`, `opc_excess_social_security_rrta_tax_withheld_11`, `opc_credit_for_federal_tax_on_fuels_12`, `opc_form_2439_13a`, `opc_section_1341_credit_13b`, `opc_net_elective_payment_election_amount_13c`, `opc_deferred_net_965_tax_liability_13d`, `opc_other_refundable_credits_13z`, `opc_total_other_payments_refundable_credits_14`, `opc_total_other_payments_and_refundable_credits_15`

### 7.8 Schedule 3 child tables

- `out_schedule_3_other_nonrefundable_credit_item` — (id, tax_return_uid, idx, description, form_number, amount)
- `out_schedule_3_other_refundable_credit_item` — (id, tax_return_uid, idx, description, amount)

### 7.9 `out_schedule_a`

PK: `tax_return_uid`. Columns mirror `ScheduleA`:

| Group | Columns |
|---|---|
| Header | `header_name`, `header_ssn` [PII] |
| Choice | `state_local_tax_choice NVARCHAR(8)` CHECK IN (`income`,`sales`) |
| Medical | `medical_dental_expenses_paid_1 DECIMAL(19,4)`, `adjusted_gross_income_2`, `medical_expense_floor_3`, `deductible_medical_expenses_4` |
| Taxes | `state_local_income_taxes_paid_5a`, `state_local_sales_taxes_paid_5a_alt`, `real_estate_taxes_paid_5b`, `personal_property_taxes_paid_5c`, `taxes_before_limit_5d`, `deductible_taxes_5e` |
| Interest | `home_mortgage_interest_paid_8a`, `home_mortgage_points_paid_8c`, `investment_interest_paid_9`, `net_investment_income`, `deductible_investment_interest`, `total_interest_paid_10` |
| Charitable | `charitable_cash_contributions_11`, `charitable_non_cash_contributions_12`, `total_charitable_contributions_14` |
| Casualty | `personal_casualty_and_theft_loss_15`, `net_qualified_disaster_loss` |
| Foreign tax | `foreign_taxes_paid`, `deductible_foreign_taxes` |
| Other | `other_allowed_itemized_deductions_16`, `total_itemized_deductions_17` |
| Indicators | `used_for_itemized_deduction BIT`, `used_for_standard_deduction_increase BIT`, `elects_to_itemize_although_less_than_standard_18 BIT` |

### 7.10 `out_schedule_b` + `out_schedule_b_interest_item` + `out_schedule_b_dividend_item`

`out_schedule_b` (PK `tax_return_uid`):

| Column | Type | Notes |
|---|---|---|
| `header_name`, `header_ssn` [PII] | | |
| `line2_total_interest DECIMAL(19,4)` | | |
| `line3_excludable_interest_series_ee_i DECIMAL(19,4)` | | |
| `line4_taxable_interest DECIMAL(19,4)` | | |
| `line6_total_ordinary_dividends DECIMAL(19,4)` | | |
| `line7a_foreign_account_or_signature_authority BIT` | | |
| `line7a_fbar_required BIT` | | |
| `line8_foreign_trust_or_distribution BIT` | | |

`out_schedule_b_interest_item` and `out_schedule_b_dividend_item` (same
shape; separate tables since they're separate `List<ScheduleBInterestItem>`
references in Java):

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `tax_return_uid NVARCHAR(128)` | FK CASCADE | |
| `idx INT NOT NULL` | UNIQUE (tax_return_uid, idx) | |
| `payer_name NVARCHAR(200)` | | |
| `amount DECIMAL(19,4)` | | |

### 7.11 `out_schedule_d`

ScheduleDTableRow appears 8 times as fields (`line1a`, `line1b`, `line2`,
`line3`, `line8a`, `line8b`, `line9`, `line10`). Each row has 4 columns
(proceeds, cost_or_other_basis, adjustments, gain_or_loss). Inline as 32
columns.

PK: `tax_return_uid`. Representative columns:

| Group | Columns |
|---|---|
| Header | `header_name`, `header_ssn` [PII] |
| QOF disposition | `qualified_opportunity_fund_disposed_yes BIT`, `qualified_opportunity_fund_disposed_no BIT` |
| Line 1a (T row) | `line1a_proceeds DECIMAL(19,4)`, `line1a_cost_or_other_basis`, `line1a_adjustments`, `line1a_gain_or_loss` |
| Line 1b (T row) | `line1b_proceeds`, `line1b_cost_or_other_basis`, `line1b_adjustments`, `line1b_gain_or_loss` |
| Line 2 (T row) | same 4 columns |
| Line 3 (T row) | same 4 columns |
| Lines 4–7 (scalar) | `line4_short_term_other_forms_gain_loss DECIMAL(19,4)`, `line5_short_term_schedule_k1_gain_loss`, `line6_short_term_capital_loss_carryover`, `line7_net_short_term_capital_gain_or_loss` |
| Lines 8a, 8b, 9, 10 (T rows) | same 4 columns each (16 columns) |
| Lines 11–22 (scalar / BIT) | `line11_long_term_other_forms_gain_loss`, `line12_long_term_schedule_k1_gain_loss`, `line13_capital_gain_distributions`, `line14_long_term_capital_loss_carryover`, `line15_net_long_term_capital_gain_or_loss`, `line16_net_capital_gain_or_loss`, `line17_both_lines_15_and_16_are_gains_yes BIT`, `line17_both_lines_15_and_16_are_gains_no BIT`, `line18_twenty_eight_percent_rate_gain DECIMAL(19,4)`, `line19_unrecaptured_section_1250_gain DECIMAL(19,4)`, `line20_qualified_dividends_and_capital_gain_worksheet_yes BIT`, `line20_schedule_d_tax_worksheet_no BIT`, `line21_allowed_capital_loss DECIMAL(19,4)`, `line22_qualified_dividends_yes BIT`, `line22_qualified_dividends_no BIT` |
| Indicators | `schedule_d_required BIT`, `form_8949_required BIT`, `requirement_reason NVARCHAR(MAX)` |
| Carryover worksheet | `next_year_short_term_capital_loss_carryover DECIMAL(19,4)`, `next_year_long_term_capital_loss_carryover DECIMAL(19,4)` |

### 7.12 `out_schedule_8812`

PK: `tax_return_uid`. All ~25 fields inlined:

`line3_magi`, `line4_num_qualifying_children INT`, `line5_ctc_potential`,
`line6_num_other_dependents INT`, `line7_odc_potential`,
`line8_total_potential`, `line9_threshold_amount`,
`line10_phase_out_excess`, `line11_phase_out_reduction`,
`line12_credit_after_phase_out`, `line13_credit_limit_worksheet_a`,
`line14_ctc_odc_credit`, `line16a_excess_credit_over_tax`,
`line16b_actc_ceiling`, `line17_actc_potential`, `line18a_earned_income`,
`line18b_combat_pay`, `line19_earned_income_over_floor`,
`line20_earned_income_actc`, `line21_withheld_payroll_taxes`,
`line22_other_taxes`, `line23_taxes_total`, `line24_refundable_credits`,
`line25_excess_payroll`, `line26_alternative_actc_base`,
`elects_no_actc BIT`, `line27_actc_credit`, `credit_limit_worksheet_b_line14`.

All `DECIMAL(19,4)` unless noted.

### 7.13 Section 6 + 7 summary

| Section | Tables |
|---|---|
| §6 anchor + Form 1040 | 6 (tax_return, out_form_1040, out_form_1040_dependent, out_form_1040_other_earned_income_statement, out_required_attachment_form, tax_return_flag) |
| §7 Schedules | 16 (out_schedule_1, _other_income_item, _other_adjustment_item, out_schedule_1a, out_schedule_2, _other_addition_item, _recapture_other_credit_item, _other_additional_tax_item, out_schedule_3, _other_nonrefundable_credit_item, _other_refundable_credit_item, out_schedule_a, out_schedule_b, _interest_item, _dividend_item, out_schedule_d, out_schedule_8812) |

Total §6+§7 = **22 tables**.

Cumulative running total: 100 + 22 = **~122 tables** before §8.

---

## 8. Special forms (output)

Source inventory: `data_model_output_specialforms.md` (38 in-scope classes
+ List<T> children). Same normalization principle as §6 — 1:1 sub-objects
inline, List<T> children get their own table.

Every parent table in this section has:
- `tax_return_uid NVARCHAR(128) NOT NULL FK → tax_return(uid) CASCADE`
- `id BIGINT IDENTITY PK` (unless cardinality is exactly 1:1 with tax_return,
  in which case `tax_return_uid` is the PK)
- `header_name NVARCHAR(200)` [PII], `header_ssn NVARCHAR(11)` [PII] (inlined
  ScheduleHeader)
- Standard `created_at`, `updated_at`

For per-person forms, an `owner_role NVARCHAR(16) CHECK IN ('taxpayer','spouse')`
column distinguishes copies; UNIQUE (tax_return_uid, owner_role).

Column counts below are approximate (refer to
`data_model_output_specialforms.md` for the exact field list).

### 8.1 Single-instance forms (1:1 with tax_return)

These are at most one row per tax return; PK = `tax_return_uid`. Inlined
1:1 sub-objects per Java class.

| Table | Source class | ~Cols | Child tables |
|---|---|---|---|
| `out_form_6251` | Form6251 | 41 | — |
| `out_form_2441` | Form2441 | 32 | out_form_2441_care_provider, out_form_2441_qualifying_person |
| `out_form_5329` | Form5329 | 4 | — |
| `out_form_4952` | Form4952Output | 18 | — |
| `out_form_8995` | Form8995 | (per inventory) | out_form_8995_business |
| `out_form_8995a` | Form8995A | (per inventory) | out_form_8995a_business, out_form_8995a_aggregation |
| `out_form_8962` | Form8962 | 40+ | out_form_8962_monthly_row, out_form_8962_policy_allocation |
| `out_form_8863` | Form8863 | (per inventory) | out_form_8863_student |
| `out_form_8839` | Form8839 | (per inventory) | out_form_8839_child |
| `out_form_8880` | Form8880 | (per inventory) | — |
| `out_form_8862` | Form8862 | (per inventory) | — |
| `out_form_8859` | Form8859 | (per inventory) | — |
| `out_form_8396` | Form8396 | 17 | — |
| `out_form_8834` | Form8834 | (per inventory) | — |
| `out_form_8911` | Form8911 (top-level credit) | (per inventory) | (Schedule A entries below) |
| `out_form_8912` | Form8912 | (per inventory) | out_form_8912_part_iii_entry, out_form_8912_direct_bond_entry |
| `out_form_8801` | Form8801 | 55 | — |
| `out_form_4868` | Form4868 | (per inventory) | — |
| `out_form_8959` | Form8959 | (per inventory) | — |
| `out_form_2210` | Form2210 | (per inventory; 4-element arrays for installment periods) | out_form_2210_period |
| `out_form_8888` | Form8888 | (per inventory; 3-account direct deposit) | out_form_8888_account |
| `out_schedule_r` | ScheduleR | (per inventory) | — |

### 8.2 Per-person forms (1:N where N ≤ 2)

`owner_role` discriminator; UNIQUE (tax_return_uid, owner_role).

| Table | Source class | Cardinality | Child tables |
|---|---|---|---|
| `out_form_8606` | Form8606 | T + S = ≤2 | — |
| `out_form_2555` | Form2555 | T + S = ≤2 | — |
| `out_form_4972` | Form4972 | T + S = ≤2 | — |
| `out_form_4137` | Form4137 | T + S = ≤2 | out_form_4137_employer (FK to parent.id) |
| `out_form_8919` | Form8919 | T + S = ≤2 | out_form_8919_firm |

### 8.3 List-of-forms (1:N with N unbounded)

The parent classes appear as `List<...>` in `TaxReturnComputation`. No
top-level "parent" object — each list item is its own row keyed on
`tax_return_uid`.

| Table | Source class | Notes | Child tables |
|---|---|---|---|
| `out_form_4852` | Form4852 | Two lists: `form4852TaxpayerList`, `form4852SpouseList`. Use `owner_role` column to distinguish. | — |
| `out_form_8814` | Form8814 | One per child. FK to `dependent.id` where match exists. | — |
| `out_form_1116` | Form1116 | One per income category (a/b/c/d/e/f) + optional summary row (`is_summary_form BIT`). | out_form_1116_country |
| `out_form_8911_schedule_a` | Form8911ScheduleA | One per refueling property. | — |
| `out_form_8936_schedule_a` | Form8936ScheduleA | One per clean vehicle. | — |
| `out_form_5695` | Form5695 | One per residential energy claim (taxpayer + optional spouse separate). | out_form_5695_qualified_cost_item |

### 8.4 `out_form_8949` (special: 3-level hierarchy)

Form8949 has `List<Form8949Page>` and each page has `List<Form8949Transaction>`.

`out_form_8949` (PK `tax_return_uid` since one per return):

| Column | Type | Notes |
|---|---|---|
| `tax_return_uid` | NVARCHAR(128) | PK, FK CASCADE |
| `header_name`, `header_ssn` | NVARCHAR(200) / NVARCHAR(11) | [PII] |
| `required BIT` | | |
| `requirement_reason NVARCHAR(MAX)` | | |

`out_form_8949_page` (1:N from out_form_8949):

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `tax_return_uid NVARCHAR(128)` | FK CASCADE | |
| `page_sequence INT` | | |
| `part NVARCHAR(4)` | CHECK IN (`I`,`II`) | |
| `term NVARCHAR(8)` | CHECK IN (`short`,`long`) | |
| `box NCHAR(1)` | CHECK IN (`A`,`B`,`C`,`D`,`E`,`F`) | |
| `schedule_d_line_reference NVARCHAR(16)` | | |
| `total_proceeds DECIMAL(19,4)` | | |
| `total_cost_or_other_basis DECIMAL(19,4)` | | |
| `total_adjustments DECIMAL(19,4)` | | |
| `total_gain_or_loss DECIMAL(19,4)` | | |

UNIQUE (tax_return_uid, page_sequence).

`out_form_8949_transaction` (1:N from out_form_8949_page):

| Column | Type | Notes |
|---|---|---|
| `id BIGINT IDENTITY` | PK | |
| `page_id BIGINT` | FK → out_form_8949_page(id) CASCADE | |
| `idx INT NOT NULL` | UNIQUE (page_id, idx) | preserves order |
| `source NVARCHAR(64)` | broker/statement source label | |
| `description_of_property NVARCHAR(MAX)` | | |
| `date_acquired NVARCHAR(16)` | DATE or literal `VARIOUS` | |
| `date_sold_or_disposed NVARCHAR(16)` | | |
| `proceeds DECIMAL(19,4)` | | |
| `cost_or_other_basis DECIMAL(19,4)` | | |
| `adjustment_code NVARCHAR(8)` | Form 8949 col (f) code | |
| `adjustment_amount DECIMAL(19,4)` | | |
| `gain_or_loss DECIMAL(19,4)` | | |

### 8.5 Generic child-table pattern

Every "List child" table in §8.1–§8.4 follows this template:

```sql
id              BIGINT IDENTITY PK
parent_id       BIGINT NOT NULL FK → <parent>(id) CASCADE
idx             INT NOT NULL                          -- preserve list order
-- ... fields from the child Java class ...
UNIQUE (parent_id, idx)
```

For child tables whose parent is keyed on `tax_return_uid` (1:1 forms),
substitute `tax_return_uid NVARCHAR(128) NOT NULL FK → tax_return(uid) CASCADE`
for `parent_id`.

### 8.6 Sample child-table column lists

`out_form_2441_care_provider`: `name`, `address_line_1`, `address_line_2`,
`identifying_number NVARCHAR(11)` [PII] (EIN/SSN), `household_employee BIT`,
`amount_paid DECIMAL(19,4)`.

`out_form_2441_qualifying_person`: `first_name` [PII], `last_name` [PII],
`ssn NVARCHAR(11)` [PII], `disabled_over_12 BIT`, `qualified_expenses DECIMAL(19,4)`.

`out_form_8839_child` (Adoption Credit, per child): per inventory — names,
adopted child SSN [PII], qualified expenses, dates.

`out_form_8863_student` (Education Credit, per student): per inventory —
student names, TIN [PII], institution info, credit type (AOTC/LLC),
adjusted qualified expenses.

`out_form_8962_monthly_row` (Premium Tax Credit, 12 rows max):
`month INT CHECK (1..12)`, `monthly_enrollment_premium DECIMAL(19,4)`,
`monthly_slcsp_premium`, `monthly_advance_payment_ptc`,
`monthly_contribution_amount`, `monthly_max_premium_assistance`,
`monthly_premium_tax_credit`.

`out_form_8962_policy_allocation`: per inventory — issuer-allocation rows for
shared policies.

`out_form_4137_employer`: `employer_name`, `employer_ein`,
`total_cash_charge_tips DECIMAL(19,4)`, `reported_cash_charge_tips DECIMAL(19,4)`.

`out_form_8919_firm`: `firm_name`, `firm_federal_id_number NVARCHAR(10)`,
`reason_code NCHAR(1) CHECK IN ('A','B','C','D','E','F','G','H')`,
`irs_determination_date DATE`, `received_1099_misc_or_nec BIT`,
`wages_no_fica_not_w2 DECIMAL(19,4)`.

`out_form_1116_country`: `country_or_territory NVARCHAR(2) FK ref_country`,
gross/deduction/loss/net columns per Form 1116, `taxes_paid BIT` (note:
primitive in Java),
`date_paid_or_accrued DATE`, `foreign_taxes_paid_usd DECIMAL(19,4)`.

`out_form_5695_qualified_cost_item`: per inventory — category, description,
QMID, cost (same shape as `pf_energy_credit_item` from §3 but on the
output side).

`out_form_8912_part_iii_entry`, `out_form_8912_direct_bond_entry`: per
inventory — bond identifiers, dates, basis, credit rate.

`out_form_2210_period`: 4-row child for the four annualized-income
installment periods; columns per Form 2210 period worksheet.

`out_form_8888_account`: 3-row child for refund-split accounts;
`account_number NVARCHAR(40)` [PII], `routing_number NVARCHAR(20)` [PII],
`account_type NVARCHAR(16)`, `amount DECIMAL(19,4)`.

### 8.7 Section 8 summary

| Bucket | Parent tables | Child tables | Total |
|---|---|---|---|
| 8.1 Single-instance | 22 | ~13 (out_form_2441_*, _8995_*, _8995a_*, _8962_*, _8863_*, _8839_*, _8912_*, _2210_*, _8888_*) | 35 |
| 8.2 Per-person | 5 | 2 (out_form_4137_employer, out_form_8919_firm) | 7 |
| 8.3 List-of-forms | 6 | 2 (out_form_1116_country, out_form_5695_qualified_cost_item) | 8 |
| 8.4 Form 8949 | 1 | 2 (page, transaction) | 3 |

**§8 total: ~53 tables.**

Cumulative running total:

| Section | Tables |
|---|---|
| §1 Core | 5 |
| §2 Identity | 5 |
| §3 Credits/Deductions | 19 |
| §4 Income | 21 |
| §5 Statement entries | ~50 |
| §6 Tax-return anchor + Form 1040 | 6 |
| §7 Schedules | 16 |
| §8 Special forms | ~53 |
| **TOTAL** | **~175 tables** |

Plus reference tables (§0.9): 6 (`ref_us_state`, `ref_country`,
`ref_filing_status`, `ref_relationship`, `ref_statement_form`,
`ref_personal_form`).

**Grand total: ~181 tables.**

---

## 9. Cross-cutting concerns

### 9.1 Cascade delete

The chain on `app_user(uid)` cascade is:
```
app_user → profile, dependent, user_message, tax_return, all pf_*, all se_*
tax_return → out_form_1040 (+ child tables), all out_schedule_*, all out_form_*
out_form_1040 → out_form_1040_dependent, out_form_1040_other_earned_income_statement, out_required_attachment_form
out_form_8949 → out_form_8949_page → out_form_8949_transaction
```

Mirrors `UserDataService.deleteUserData()` semantics today.

### 9.2 Re-compute idempotence

Every `out_*` table is deleted-and-recreated on compute. Implementation:

```sql
BEGIN TRANSACTION;
  DELETE FROM tax_return WHERE uid = @uid;  -- CASCADE clears all out_*
  INSERT INTO tax_return ...;
  INSERT INTO out_form_1040 ...;
  -- ... rest of output ...
COMMIT;
```

Alternative: keyed UPSERTs everywhere with delete-orphans on child collections.
DELETE+INSERT is simpler given the cascade.

### 9.3 Reference vs. snapshot

The `dependent` table (input) and `out_form_1040_dependent` (output) hold the
same shape but at different points in time:

- `dependent` is the live user-edited list.
- `out_form_1040_dependent` is the snapshot at last compute.

Separate tables keep them independent — editing a dependent doesn't
silently mutate a prior compute output.

Similarly: `pf_*` (input) and `out_*` (output) never share rows.

### 9.4 Type checks not enforced by SQL

Some constraints documented above are enforced application-side only:
- Conditional required fields (e.g. when `is_foreign_address=1`,
  foreign-branch columns are required).
- Cross-row uniqueness (e.g. a child's SSN should not appear in
  `out_form_1040_dependent` AND `out_form_8814` at the same time).
- Filing-status-conditional constraints (e.g. spouse columns required when
  status='MFJ').
- Numeric range checks beyond simple CHECK (e.g. line-item sums equal
  totals; these are recomputed every compute so a stale row would not
  persist).

Hibernate validators (`@AssertTrue` on entity methods) cover most of these;
SQL CHECK is used where the constraint is single-column and stable.

### 9.5 Index strategy beyond the FK baseline

| Table | Index | Justification |
|---|---|---|
| `app_user(last_login_at)` | `IX_app_user_last_login` | Future inactivity reports |
| `support_request(status, created_at DESC)` | `IX_support_inbox` | Support inbox query |
| `tax_return_flag(tax_return_uid, blocking)` | filtered `WHERE blocking = 1` | UI "fix these" banner |
| `dependent(uid)` | `IX_dependent_uid_id (uid, id)` | per-user listing |
| All `pf_*` and `se_*` parent tables | `(uid, owner_role)` | per-user/role lookup |
| All `out_*` tables | (default FK index on `tax_return_uid`) | per-return lookup |
| `profile(phone)` | filtered `WHERE phone IS NOT NULL` | phone-based lookup |

### 9.6 Naming-collision avoidance

A few archetypes share names between input and output side:
`pf_form4852` (input) vs. `out_form_4852` (output). The `pf_` / `out_`
prefix is mandatory to keep them straight in `INFORMATION_SCHEMA.TABLES`
and in Hibernate `@Table(name=...)` annotations.

---

## 10. Status & next steps

**Complete (Step 3 ER scope)**:

- §0 Conventions
- §1 Core entities
- §2 Personal forms — Identity (5 tables)
- §3 Personal forms — Credits/Deductions (19 tables)
- §4 Personal forms — Income (21 tables)
- §5 Statement entries (~50 tables)
- §6 Tax-return anchor + Form 1040 (6 tables)
- §7 Schedules (16 tables)
- §8 Special forms (~53 tables)
- §9 Cross-cutting concerns

**Step 4 (Validation) — COMPLETE**:

- ✓ Semantic column names generated for ALL 8 previously-opaque forms
  (4684, 4797, 6252, 6781, 8824, K-1 1041/1065/1120s; 826 fields total).
  Sourced from `C:\us-tax\pdfs\<form>_field_map_semantic.csv` via the
  capital-mappings generator. See `data_model_validation.md` §1 and
  schema §5.23 / §5.35 / §5.36 for column groupings.
- ✓ Asymmetric T/S spouse-supplemental columns documented across 7
  archetypes (see `data_model_validation.md` §3).
- ✓ Conditional-required enforcement matrix documented (32 conditions
  across identity, credits/deductions, and income domains; see
  `data_model_validation.md` §4) — to be enforced by Hibernate
  `@AssertTrue` on entity methods at write time.
- ⏸ Firestore sanity-check (sample 5–10 real documents per domain) —
  deferred to pre-prod ops gate; user not in production.

**Deferred to Step 5 (Apply schema)**:

- DDL file (T-SQL `CREATE TABLE`, indexes, FKs, CHECK constraints).
- Hibernate ORM `@Entity` classes (~181 classes).
- Repository interfaces.
- Reference-data seed scripts (`ref_us_state`, `ref_country`,
  `ref_filing_status`, `ref_relationship`, `ref_statement_form`,
  `ref_personal_form`).
- Migration of existing Firestore data (NOT REQUIRED per user — not in
  production).
- Compute-pipeline rewiring (replace `TaxReturnDataService.save()` to write
  through the new schema).
- Read-pipeline rewiring (replace `TaxReturnDataService.get()` to assemble
  `TaxReturnComputation` from the normalized tables).

ER diagram (Mermaid) in `data_model_er.md` — domain-level overview + per-cluster detail.
