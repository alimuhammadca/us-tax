# US Tax — Phase 2b Step 4 Validation Findings

Cross-checks the proposed schema (`data_model_schema.md` + `data_model_er.md`)
against the actual Angular components, Java models, and IRS PDF field maps.
Surfaces gaps, mismatches, and decision points that must be resolved before
Step 5 (DDL generation + Hibernate ORM apply).

Methodology: spot-checks on representative tables, full read of all
`*_field_map_semantic.csv` files in `C:\us-tax\pdfs\`, audit of
asymmetric-T/S patterns from the input-form inventories.

---

## 1. ✓ RESOLVED — Opaque PDF-slot CSVs now have real semantic names

**Status (was BLOCKER): RESOLVED 2026-05-25.** Semantic field names
generated for all 8 forms (826 fields, 100% coverage) via the new
capital-mappings generator. See §1.5 below for the resolution summary.

**Original status (kept for context): requires user decision before Step 5 can proceed.**

The Step 3 design (per the user's "Translate now (semantic)" answer) assumed
that `C:\us-tax\pdfs\<form>_field_map_semantic.csv` would yield
human-readable column names for the opaque-PDF-slot statement forms. Audit
shows it does NOT for 8 of those forms.

### 1.1 Evidence

The CSV files come in two flavors:

**Flavor A — truly semantic** (e.g., `f1099int_field_map_semantic.csv`):
```csv
old_field_name,semantic_field_name,field_type,...
c1_1[0],copyA_void_checkbox,checkbox,...
f1_9[0],copyA_box1_interest_income,text,...
f1_10[0],copyA_box2_early_withdrawal_penalty,text,...
```
Human-readable column names available.

**Flavor B — structural-only** (e.g., `f6781_field_map_semantic.csv`):
```csv
old_field_name,old_full_name,semantic_field_name,field_type,...
f1_12[0],topmostSubform[0].Page1[0].f1_12[0],page1_0_f1_12_0,text,...
f1_13[0],topmostSubform[0].Page1[0].f1_13[0],page1_0_f1_13_0,text,...
```
The "semantic_field_name" column repeats the structural identifier. No
real label.

### 1.2 Forms affected

| Form | CSV rows | Real semantic names | Manual labels needed |
|---|---|---|---|
| `se_form_6781` | 72 | 0 | 72 |
| `se_form_4684` | 163 | 0 | 163 |
| `se_form_4797` | 183 | 0 | 183 |
| `se_form_6252` | 50 | 0 | 50 |
| `se_form_8824` | 64 | 0 | 64 |
| `se_schedule_k1_1041` | 75 | 0 | 75 |
| `se_schedule_k1_1065` | 112 | 0 | 112 |
| `se_schedule_k1_1120s` | 115 | 0 | 115 |
| **Total** | **834** | **0** | **834** |

### 1.3 Why the CSVs are structural-only

The Angular form components for these 8 statement types are
**PDF-passthrough UIs** — they render the official IRS PDF as a
background image with input fields absolutely positioned over each blank.
The component reads/writes a `pdfRaw` Map keyed by the structural slot
identifier:

```typescript
// form-schedule-k1-1065.component.ts:48
[checked]="!!pdfRaw['page1_0_left_col_0_c1_3_0']"
(change)="pdfRaw['page1_0_left_col_0_c1_3_0'] = $any($event.target).checked ? 'X' : ''"
```

There is no semantic intermediate. The keys ARE the schema, by design —
this avoids needing to maintain a labeling layer for ~17 different
statement forms whose layouts change between tax years.

The K-1 family adds 8 explicit semantic columns for the Section 199A
attached statement (the only fields the compute pipeline actually reads),
but the rest is opaque.

### 1.4 Decision required (now historical)

User chose to generate real semantic names for all 8 forms by reading the
IRS PDFs and manually labeling each field by page-and-line position. See
§1.5 for resolution.

### 1.5 Resolution (2026-05-25)

Built a new generator + 8 per-form mapping JSON files:

| File | Purpose |
|---|---|
| `C:\us-tax\us-tax-be\scripts\generate-semantic-capital-forms-mapped.js` | New generator extending the original `generate-semantic-capital-forms.js`. Accepts optional manual mapping JSON per form; falls back to structural names if no mapping. |
| `C:\us-tax\us-tax-be\scripts\capital-mappings\f4684.json` | 162 fields mapped (4 partB rows extra spurious — silently ignored by generator) |
| `C:\us-tax\us-tax-be\scripts\capital-mappings\f4797.json` | 182 fields mapped |
| `C:\us-tax\us-tax-be\scripts\capital-mappings\f6252.json` | 49 fields mapped |
| `C:\us-tax\us-tax-be\scripts\capital-mappings\f6781.json` | 71 fields mapped |
| `C:\us-tax\us-tax-be\scripts\capital-mappings\f8824.json` | 63 fields mapped |
| `C:\us-tax\us-tax-be\scripts\capital-mappings\schedule_k1_form_1041.json` | 74 fields mapped |
| `C:\us-tax\us-tax-be\scripts\capital-mappings\schedule_k1_form_1065.json` | 111 fields mapped |
| `C:\us-tax\us-tax-be\scripts\capital-mappings\schedule_k1_form_1120s.json` | 114 fields mapped |

Generator output (8 PDF + 8 CSV pairs in `C:\us-tax\pdfs\`):

```
Total: 826/826 fields mapped (100%)
```

Naming convention follows `f6252.json` template: lowercase snake_case,
`partI_lineN_*` / `partA_lineN_*` / `part1_X_*` prefixes (matching IRS form
structure), `_yes`/`_no` suffixes for yes/no checkbox pairs, row indices
(`_row1_*`) for table-style line items.

Re-run anytime:
```bash
cd C:\us-tax\us-tax-ui
NODE_PATH=node_modules node ..\us-tax-be\scripts\generate-semantic-capital-forms-mapped.js C:\us-tax\pdfs
```

Schema doc updated: §5.23 (f6781), §5.35 (4684/4797/6252/8824),
§5.36 (K-1 family) now have concrete column-group tables. §5.38 summary
updated: 0 opaque-PDF-slot tables remain.

---

## 2. Spot-check: schema vs. code

Verified entries — each schema column matches its source field. No
mismatches found in spot-checks.

### 2.1 `profile` ↔ `Profile.java`

| Schema column | Java field | Type | Constraint | Verified |
|---|---|---|---|---|
| `uid NVARCHAR(128) PK` | `String uid` | `@Size(max=128)` | ✓ |
| `first_name NVARCHAR(100)` | `String firstName` | `@NotBlank @Size(max=100)` | ✓ |
| `last_name NVARCHAR(100)` | `String lastName` | `@NotBlank @Size(max=100)` | ✓ |
| `email NVARCHAR(255)` | `String email` | `@NotBlank @Email @Size(max=255)` | ✓ |
| `phone NVARCHAR(25)` | `String phone` | `@Size(max=25)` | ✓ |
| `address_line_1 NVARCHAR(200)` | `String addressLine1` | `@Size(max=200)` | ✓ |
| `address_line_2 NVARCHAR(200)` | `String addressLine2` | `@Size(max=200)` | ✓ |
| `city NVARCHAR(100)` | `String city` | `@Size(max=100)` | ✓ |
| `state NVARCHAR(100)` | `String state` | `@Size(max=100)` | ✓ |
| `postal_code NVARCHAR(20)` | `String postalCode` | `@Size(max=20)` | ✓ |

File: `src/main/java/com/ustax/microservices/Profile.java:1-125`.

### 2.2 `se_w2_box12_entry` ↔ Form W-2 inventory

| Schema column | Inventory field | Verified |
|---|---|---|
| `code NVARCHAR(4)` | `code` (text, IRS Box 12 codes A-ZZ) | ✓ |
| `box12_amount DECIMAL(19,4)` | `box12Amount` (decimal) | ✓ |
| `box12_amount_notes NVARCHAR(MAX)` | `box12AmountNotes` (text) | ✓ |

### 2.3 `pf_identification` ↔ `form-identification-spouse.component.ts`

One quirk confirmed (schema doc §2.2 already calls it out):

- Inventory: field name `spouseFirstNamefirstName` (literal naming artifact preserved in component code).
- Schema: column `first_name` — migration normalizes the artifact to a clean name. ✓

Migration script must read both `spouseFirstNamefirstName` AND `firstName`
(legacy fallback) and merge.

### 2.4 Spot-check verdict

3-of-3 spot-checks passed. No schema-vs-code mismatches in the parts
verified. Recommend full automated audit during Step 5 by generating the
Hibernate `@Entity` classes from the schema and running the project's
existing 765 unit tests (which exercise the full output model).

---

## 3. Asymmetric T/S spouse-supplemental columns — verified

The Step 3 deferral flagged 6 archetypes where the spouse row carries
fields not present on the taxpayer row. Re-confirming all are captured in
the schema as nullable spouse-only columns:

| Archetype | Spouse-only columns (per data_model_schema.md) |
|---|---|
| `pf_energy_credit` | `spouse_has_energy_credit_inputs`, `spouse_separate_main_home_for_part_ii` |
| `pf_alt_fuel_credit` | `spouse_has_alt_fuel_credit_inputs`, `spouse_passthrough_refueling_property_credit_contribution` |
| `pf_bond_credit` | `spouse_has_bond_credit_inputs`, `spouse_prior_year_carryforward_contribution` |
| `pf_electric_vehicle_credit` | `spouse_has_electric_vehicle_credit_inputs`, `spouse_released_qev_passive_activity_credit_contribution` |
| `pf_mortgage_interest_credit` | `spouse_has_mortgage_interest_credit_inputs`, `spouse_mortgage_interest_paid_contribution` |
| `pf_carryforward_homebuyer_credit` | `spouse_has_carryforward_homebuyer_credit_inputs`, `spouse_prior_year_carryforward_contribution` |
| `pf_extension_of_time` | `spouse_has_extension_of_time_inputs`, `spouse_included_on_joint_extension`, `spouse_extension_payment_contribution`, `spouse_payment_reference` |

Application-side rule (enforced at write, not via DB CHECK): these
columns are populated ONLY on rows where `owner_role='spouse'`. Taxpayer
rows leave them NULL.

No schema change needed. Migration must verify the same on existing
Firestore documents (post-production data only — not applicable now).

---

## 4. Conditional-required matrix

Conditions where Field B becomes required based on Field A's value. Source
of truth: Angular components' `isValid()` / `isFormValid()` methods. These
are NOT enforced by SQL CHECK (column-conditional checks are awkward in
T-SQL) — Hibernate Validator `@AssertTrue` on entity methods will enforce
them at write time.

### 4.1 Identity domain

| Table | Condition | Then-required |
|---|---|---|
| `pf_address` | `is_foreign_address = 0` | `state_code`, `zip_code` |
| `pf_address` | `is_foreign_address = 1` | `foreign_country`, `foreign_province_state_county`, `foreign_postal_code` |
| `pf_filing_status` | `filing_status = 'MFS'` | (advisory) `spouse_name_if_mfs` |
| `pf_filing_status` | `filing_status IN ('HOH','QSS')` AND child is not a dependent | (advisory) `qualifying_child_name_if_hoh_or_qss` |
| `pf_filing_status` | `treating_nonresident_spouse_as_us_resident = 1` | `nonresident_spouse_name` |

### 4.2 Credits / Deductions domain

| Table | Condition | Then-required |
|---|---|---|
| `pf_standard_deductions` | `deduction_election = 'ITEMIZED'` | itemized-amount columns (≥1 of medical/taxes/interest/charity/etc.) |
| `pf_standard_deductions` | `filing_status = 'MFS'` | `spouse_itemizes_separate_return`, `spouse_meets_age_blindness_mfs_requirements` |
| `pf_investment_interest_expense` | `needs_form_4952 = 1` | `investment_interest_expense_paid_line1`, `gross_income_from_property_held_for_investment_line4a`, `confirm_all_received_investment_support_uploaded = 1` |
| `pf_investment_interest_expense` | `elect_to_include_qualified_dividends_or_capital_gain_line4g = 1` | `elected_investment_income_amount_line4g` |
| `pf_education_credits` | `claims_education_credits_on_return = 1` | ≥1 `pf_education_student` child row |
| `pf_education_credits` | child `credit_type = 'aotc'` | `aotc_claimed_four_prior_years`, `student_was_at_least_half_time`, `student_completed_first_four_years_before_2025`, `student_had_felony_drug_conviction` |
| `pf_energy_credit` | `claims_energy_credit_on_return = 1` | one of `claims_residential_clean_energy_credit` / `claims_energy_efficient_home_improvement_credit` = 1 |
| `pf_energy_credit` | `line5_battery_storage_costs > 0` | `line5_battery_capacity_at_least_3kwh` not NULL |
| `pf_energy_credit` | `line8_fuel_cell_property_costs > 0` | `line7a_fuel_cell_installed_on_main_home_in_us`, `line7b_fuel_cell_main_home_address` |
| `pf_clean_car_credit` | `claims_clean_car_credit_on_return = 1` | `confirm_seller_reports_and_support_ready = 1`, ≥1 `pf_clean_car_vehicle` |
| `pf_extension_of_time` | `needs_extension_of_time = 1` | `extension_filing_method` |
| `pf_extension_of_time` | `has_fiscal_year = 1` | `fiscal_year_begin`, `fiscal_year_end` |
| `pf_form4852` | `needs_form_4852 = 1` | ≥1 `pf_form4852_entry` |

### 4.3 Income domain

| Table | Condition | Then-required |
|---|---|---|
| `pf_employment_income` | `has_employment_income = 1` | `is_missing_w2`, `household_work` |
| `pf_employment_income` | `household_work = 1` | `household_employee_under_control_test` |
| `pf_employment_income` | `household_received_w2 = 0` | ≥1 `pf_household_employer` |
| `pf_tip_income` | `has_unreported_tips = 1` | ≥1 `pf_tip_employer` |
| `pf_combat_pay` | `combat_pay_total > 0` | `elect_combat_pay` not NULL |
| `pf_interest_income` | `received_*_statements = 1` | matching `uploaded_*_statements = 1` |
| `pf_capital_gain_loss` | `had_capital_gain_or_loss = 1` AND `had_capital_asset_sales_or_exchanges = 1` | Either ≥1 `pf_capital_gain_loss_transaction` OR direct-aggregation `line1a`/`line8a` fields set |
| `pf_other_incomes` | `had_additional_income_for_schedule1 = 1` | ≥1 named line 1–7 / 8a–8v field OR ≥1 `pf_other_income_item` |
| `pf_kiddie_income` | `has_kiddie_tax_unearned_income = 1` | parent SSN + filing status, child line 1–5 |
| `pf_income_adjustments` | `had_income_adjustments_for_schedule1 = 1` | ≥1 named line 11–24 field OR ≥1 `pf_income_adjustment_item` |
| `pf_estimated_tax_payments` | `made_estimated_tax_payments = 1` | ≥1 installment_N_amount > 0 OR `prior_year_overpayment_credited` > 0 |

### 4.4 Out-of-scope blockers (compute-time)

Several inputs immediately set `compute_status = 'blocked'` if 1:

- `pf_other_incomes.has_schedule_c_business_income_out_of_scope`
- `pf_other_incomes.has_schedule_f_farm_income_out_of_scope`
- `pf_income_adjustments.has_deductible_self_employment_tax_line15_out_of_scope`
- `pf_income_adjustments.has_self_employed_retirement_plan_adjustment_line16_out_of_scope`
- `pf_income_adjustments.has_self_employed_health_insurance_adjustment_line17_out_of_scope`
- `pf_interest_income.has_business_related_interest`
- `pf_qbi_deduction.has_schedule_c_or_f_qbi_sources`
- `pf_qbi_deduction.is_cooperative_patron_of_ag_horticultural_coop`
- `pf_employment_income.household_employee_under_control_test = 0` (Schedule H) — emits blocking flag

These emit `tax_return_flag` rows with `blocking=1` rather than rejecting
the save. Schema captures this correctly.

---

## 5. Firestore sanity-check — deferred to ops

The Step 3 plan called for sampling 5–10 real Firestore documents per
domain to verify the Angular-derived schema matches actual stored shapes.

**Deferring because:** user has stated multiple times that they are not in
production. The current Firebase project (`us-tax-ebeb9`) holds dev/test
data only — the sample size for "real" docs is effectively zero, and any
test docs were written by the same Angular components we already inventoried.

**Pre-production gate:** before cutover, run a one-time export of all
Firestore collections and a schema-conformance script that flags any
documents containing keys not present in the corresponding SQL table.
Owner: ops; runs after Step 5 completes and before any go-live.

---

## 6. Other findings (informational)

### 6.1 Type-fidelity caveats

- **Tri-state booleans** (`BIT NULL`): SQL Server `BIT` natively supports
  NULL, so the three states (true / false / unanswered) map cleanly.
  Hibernate must use `Boolean` (boxed), not `boolean` (primitive), in
  `@Entity` classes.
- **Money as text** on forms 8606, 2439, K-1s, 6252, 6781, 4684, 4797,
  8824: source persists as TEXT to preserve user-entered formatting and
  IRS PDF slot constraints (e.g., comma-thousands, dashes for negatives).
  Schema marks these as `NVARCHAR(40)` — they remain text in SQL and are
  parsed to BigDecimal only when compute consumes them. Existing
  `parseAmountAndNotes()` utility handles this; rewire on Step 5.
- **Dates as text** on most statement-entry forms (e.g., `date_won`,
  `date_acquired`, `date_of_payment`): stored as `NVARCHAR(20)` to support
  legacy "as-printed" formats and the special literal `VARIOUS` on capital-
  gains transactions. Normalization to `DATE` is a downstream concern.

### 6.2 Reference-data sourcing

Six reference tables (§0.9) need seed data:

| Table | Source | Notes |
|---|---|---|
| `ref_us_state` | Reconcile the two divergent lists from `form-you.component.ts` (54 entries incl. territories) and `form-address-taxpayer.component.ts` (51 entries, DC included). Pick the 54-entry list with a `kind` column distinguishing state/district/territory. | |
| `ref_country` | ISO 3166-1 alpha-2. The free-text list in `form-you.component.ts` (~190 entries) needs mapping to ISO codes. Many will match exactly; a handful (e.g., "USSR", "Czechoslovakia") need historical-name mapping. | |
| `ref_filing_status` | 5 rows: `S`, `MFJ`, `MFS`, `HOH`, `QSS` with full IRS labels. | |
| `ref_relationship` | ~16 dependent relationship enum values. Source: existing `relationship` field options in the dependent form component. | |
| `ref_statement_form` | ~41 rows from `StatementFormCatalog.java` (IRS form number, display name, category). | |
| `ref_personal_form` | ~25 rows from the §3.16/§4.14 archetype lists with `requires_owner_role`, `is_dependent_scoped` flags. | |

All seed data is small enough for SQL `INSERT` scripts in Step 5; no need
for separate migration tooling.

### 6.3 Computed-column candidates not modeled

The schema does not include computed/persisted columns (SQL Server
`COMPUTED COLUMN PERSISTED`). Several would help reporting queries:

- `out_form_1040.computed_effective_tax_rate AS tac_total_tax_24 / NULLIF(adjustments_adjusted_gross_income, 0) PERSISTED`
- `tax_return.compute_status` could be a computed column reading from
  `tax_return_flag WHERE blocking = 1` count.

Not blocking for Step 5; add as a follow-up after the core schema is in.

### 6.4 Validation cardinality summary

| Validation | Status |
|---|---|
| Profile.java vs schema | ✓ 10/10 columns match |
| W-2 Box 12 entry vs schema | ✓ 3/3 columns match |
| pf_identification artifact handling | ✓ documented in §2.1 |
| Asymmetric T/S columns | ✓ 7/7 archetypes verified |
| Conditional-required matrix | ✓ documented (32 conditions) |
| Opaque-PDF-slot CSVs have semantic names | ✗ BLOCKER (834 fields, 0 names) |
| Firestore sanity-check | ⏸ Deferred to pre-prod |

---

## 7. Decisions for user review — RESOLVED

All decision points raised during Step 4 have been resolved. The original
options (A/B/C) are kept below for historical context.

### 7.1 ★ Opaque PDF-slot forms — schema strategy — RESOLVED

**Outcome (2026-05-25): chose Option C — Manual semantic labeling**, executed
via parallel agents that read each IRS PDF and produced mapping JSON files.
Generator now emits 826/826 semantic columns. See §1.5 above.

**Historical context (the three options that were considered):**

Step 3 chose "Translate now (semantic)". Audit shows the semantic CSVs
had NO real names for 834 fields across 8 forms (4684, 4797, 8824,
6252, 6781, 3 K-1s). Three viable paths were considered:

**Option A — Keep opaque names as SQL columns**
Each form gets a wide table with columns named after the structural
identifier (`page1_0_f1_12_0 NVARCHAR(40)`, etc.).
- Pros: schema is consistent (no JSONB anywhere), every field is
  individually queryable, mirrors current Firestore shape exactly.
- Cons: column names are not human-readable. Code that consumes these
  (today's `parseAmountAndNotes()`) doesn't change. SQL reporting queries
  for these forms become impractical (`SELECT page1_0_f1_27_0 FROM
  se_form_6252` is opaque).
- Effort: zero — schema template already in §5.23/§5.35/§5.36; Step 5
  generates DDL by reading the CSV row count.

**Option B — JSONB column for these 8 forms only**
Each of the 8 tables gets a single `slot_data NVARCHAR(MAX)` JSON
column holding the opaque key-value map. Other 33 statement forms
remain typed (no change).
- Pros: simpler schema (1 column instead of 50–183 per form). Saves
  ~834 columns of DDL. Matches current Firestore shape semantically.
- Cons: opaque data not queryable by box. Loses any future ability to
  filter / aggregate by specific PDF slot.
- Effort: schema doc requires a small edit; DDL generator simpler.

**Option C — Manual semantic labeling (834 fields)**
We (or an agent) walk through each IRS PDF page-by-page and assign a
semantic name to each `page1_0_f1_NN_0` slot. Result: real columns like
`box1_description_of_property`, `box2_date_acquired`, etc.
- Pros: SQL reporting fully works, like the typed 33 forms.
- Cons: ~834 fields × ~30 sec each = ~7 hours of labeling. Has to be
  redone if the IRS form layout changes year-to-year (these forms
  RARELY change but it's not zero risk). Labeling is also error-prone
  without an IRS subject-matter expert reviewer.
- Effort: ~7 hours of labeling + verification.

Recommendation: **Option B**. The current code reads these forms only for
PDF round-trip (export-with-pre-filled-fields) — no compute pipeline
queries individual box values from these 8 forms. SQL queryability
provides no current benefit. Revisit if a use case emerges.

### 7.2 Anything else surfaced

No other blockers. Asymmetric T/S resolved, spot-checks passed,
conditional-required matrix documented, reference-data sourcing planned.

---

## 8. Step 5 gate criteria — ALL MET

Step 5 (Apply schema to ustaxdb) is unblocked:

1. ✓ **Decision §7.1 made** — Option C (manual semantic labeling) executed; 826/826 fields mapped.
2. (Already done) Asymmetric T/S resolution (§3) → no action.
3. (Already done) Conditional-required matrix (§4) → enforced by
   `@AssertTrue` on Hibernate entities.
4. (Already done) Reference-data sourcing plan (§6.2) → seed scripts in
   Step 5.

Pre-go-live (after Step 5):

5. Firestore sanity-check (§5) — ops-owned.
6. Computed-column follow-ups (§6.3) — optional.

---

## 9. File deliverable check

| File | Status | Lines |
|---|---|---|
| `data_model_schema.md` | ✓ written | 2,398 |
| `data_model_er.md` | ✓ written | 720 |
| `data_model_validation.md` | ✓ this file | — |
| `data_model_inputs.md` (Step 2a unified) | not produced — replaced by 4 domain files (identity, credits, income, statements) which is what the user got | n/a |
| `data_model_outputs.md` (Step 2b unified) | not produced — replaced by 2 domain files (output_1040, output_specialforms) | n/a |

Step 4 complete pending §7.1 decision.
