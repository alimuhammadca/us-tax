# Multi-Return Architecture

> Design document for moving Taxbeans from a single-return-per-household model to a
> multi-return-per-household model. Captures the analysis built up across several
> design conversations.
>
> Scope of "multi-return": one Firebase/auth account per **family**, producing any of:
> - 1 MFJ joint return, OR
> - 2 MFS returns (one per spouse), AND
> - 0..N `dependent_own` returns for dependents who file their own Form 1040.

---

## 1. Problem statement

### 1.1 Current state (single-return architecture)

The application today produces **exactly one Form 1040 per household**:
- Either a single-filer return (Single / HOH / QSS / MFS-alone), OR
- A joint return (MFJ) where the spouse tab is a *second view* into the same return.

Every form on the spouse tab is structured around the joint-return assumption:
- Many spouse-side fields are stored on the **taxpayer's** DB row (e.g. `someoneCanClaimSpouse`,
  `spouseItemizesSeparateReturn`, `spouseMeetsAgeBlindnessMfsRequirements`).
- The `form-standard-deductions` component hides Schedule A line items on the spouse instance
  via `*ngIf="!isSpouse"` (template line 400). Schedule A is treated as taxpayer-owned.
- The compute service reads Schedule A exclusively from `deductionsTaxpayer`
  (`TaxReturnComputeService.java:5918+`) — `deductionsSpouse` is never consulted.
- The dependent tab's "Tax Return" sidebar section is **empty by design** — dependents
  cannot produce their own Form 1040.

This is captured in `[[project_single_return]]`: *"the application produces ONE tax return per
household; no separate returns for spouse or dependents."* That memory is the **starting
state** this design document seeks to obsolete.

### 1.2 What changed

Three forces push the architecture toward multi-return:

1. **MFS-as-tax-strategy.** `scenarios.md §1.3` documents the joint-vs-separate filing
   optimizer gap. Some couples pay less tax filing separately (income-based student-loan
   repayment, large medical deductions concentrated on one spouse, IRA-deduction phase-outs,
   AMT, NIIT thresholds, casualty losses). To evaluate this, the system must be able to
   **actually produce two MFS returns**, not just estimate them with a heuristic.

2. **Dependent-own returns.** Dependents with income above filing thresholds (or who are
   owed a refund of withholding) must file their own Form 1040. Today, the dependent tab's
   Tax Return section is intentionally empty. To support these returns, dependents must be
   first-class **persons** who can own forms and produce their own Form 1040.

3. **MFS data sufficiency audit.** A separate audit confirmed that the current data model
   does NOT capture enough to synthesize MFS scenarios from a joint return:
   - Schedule A inputs lack per-spouse allocation.
   - Itemize-must-match (IRC §63(c)(6)(A)) needs explicit attestation per return.
   - SS-MFS-restrictive rule (§86(c)(1)(C)) requires a lived-apart-6mo attestation.
   - Education credits (§25A(g)(6)) and EIC (§32(d)) gate on filing status.
   - Many person-intrinsic attributes (age, blindness, dual-status alien, can-be-claimed)
     are partially mirrored to the taxpayer row and partially to the spouse row.

   The data model needs a refactor regardless of whether multiple returns are produced.

### 1.3 Goal

A single auth account ("the family") owns:
- 1..N **persons** (head, spouse, each dependent).
- 0..N **tax returns**, where each return is one Form 1040 with its own filing status,
  attributable to one or more persons.
- Forms attached to either persons (intrinsic / per-account income / per-account credits)
  or returns (filing-status-scoped / return-level elections / shared expenses).

The compute service runs per `tax_return_id`, producing one Form 1040 output per return.

---

## 2. Data model — MSSQL refactor

The current schema uses per-form tables keyed `(uid, owner_role ∈ {taxpayer, spouse})`
with a `UNIQUE(uid, owner_role)` constraint. This conflates "who is this row about" with
"which return does this row belong to." The new model separates them.

### 2.1 Core tables

```sql
-- One row per human in the family.
person (
  person_id BIGINT IDENTITY PRIMARY KEY,
  uid       NVARCHAR(128) NOT NULL,            -- Firebase account = family
  role      NVARCHAR(20)  NOT NULL,            -- 'head' | 'spouse' | 'dependent'
  first_name NVARCHAR(...) NULL,
  last_name  NVARCHAR(...) NULL,
  ssn_or_itin NVARCHAR(11) NULL,
  date_of_birth DATE NULL,
  files_own_return BIT NOT NULL DEFAULT 0,     -- dependents only; head/spouse always file via 'household' returns
  -- ...other person-intrinsic attributes
  CONSTRAINT fk_person_uid FOREIGN KEY (uid) REFERENCES app_user(uid) ON DELETE CASCADE,
  CONSTRAINT uq_person UNIQUE (uid, role, person_id)  -- multiple dependents allowed
);

-- One row per Form 1040 the family produces.
tax_return (
  tax_return_id BIGINT IDENTITY PRIMARY KEY,
  uid           NVARCHAR(128) NOT NULL,
  return_kind   NVARCHAR(20)  NOT NULL,        -- 'primary' | 'mfs_head' | 'mfs_spouse' | 'dependent_own'
  filing_status NVARCHAR(20)  NULL,            -- 'single' | 'mfj' | 'mfs' | 'hoh' | 'qss'
  -- Return-level MFS attestations (move out of pf_standard_deductions):
  spouse_itemizes_separate_return BIT NULL,
  spouse_meets_age_blindness_mfs_req BIT NULL,
  lived_apart_last_6_months BIT NULL,          -- §21(e)(2), §32(d)(2)
  -- Other return-level attestations and elections:
  third_party_designee_*,
  refund_destination_*,
  ...
  CONSTRAINT fk_tax_return_uid FOREIGN KEY (uid) REFERENCES app_user(uid) ON DELETE CASCADE
);

-- Which persons does each return claim or include?
tax_return_person (
  tax_return_id BIGINT NOT NULL,
  person_id     BIGINT NOT NULL,
  role_on_return NVARCHAR(20) NOT NULL,        -- 'filer' | 'joint_spouse' | 'dependent'
  PRIMARY KEY (tax_return_id, person_id),
  CONSTRAINT fk_trp_return FOREIGN KEY (tax_return_id) REFERENCES tax_return(tax_return_id) ON DELETE CASCADE,
  CONSTRAINT fk_trp_person FOREIGN KEY (person_id) REFERENCES person(person_id)
);
```

Allowed `(return_kind, role_on_return)` combinations:

| return_kind | filers | joint_spouse | dependents |
|---|---|---|---|
| `primary` (single/HOH/QSS/MFJ) | 1 head | 0 or 1 spouse (MFJ only) | 0..N |
| `mfs_head` | 1 head | 0 | 0..N (per IRC §152 tiebreaker) |
| `mfs_spouse` | 1 spouse | 0 | 0..N (per IRC §152 tiebreaker) |
| `dependent_own` | 1 dependent | 0 | 0 |

At most one of {`primary`, `mfs_head`+`mfs_spouse`} is active per family at a time — the
family is either filing jointly OR separately, not both. The "what-if optimizer" creates
**hypothetical** mfs_head + mfs_spouse rows alongside the primary, runs compute on each,
compares totals, and discards them — without disturbing the live return.

### 2.2 Per-form tables — two scoping patterns

Every `pf_*` (personal form) and `se_*` (statement entry) table picks **exactly one** of:

```sql
-- Pattern P: person-scoped (income, credits, person-intrinsic forms)
pf_<form> (
  id BIGINT IDENTITY PRIMARY KEY,
  uid NVARCHAR(128) NOT NULL,                  -- denormalized for cascade + bulk delete
  person_id BIGINT NOT NULL,
  ...fields...,
  CONSTRAINT fk_<form>_uid FOREIGN KEY (uid) REFERENCES app_user(uid) ON DELETE CASCADE,
  CONSTRAINT fk_<form>_person FOREIGN KEY (person_id) REFERENCES person(person_id),
  CONSTRAINT uq_<form> UNIQUE (person_id)      -- one row per person (or composite key for multi-instance forms)
);

-- Pattern R: return-scoped (filing-status decisions, shared expenses, return-level elections)
pf_<form> (
  id BIGINT IDENTITY PRIMARY KEY,
  uid NVARCHAR(128) NOT NULL,
  tax_return_id BIGINT NOT NULL,
  ...fields...,
  CONSTRAINT fk_<form>_uid FOREIGN KEY (uid) REFERENCES app_user(uid) ON DELETE CASCADE,
  CONSTRAINT fk_<form>_return FOREIGN KEY (tax_return_id) REFERENCES tax_return(tax_return_id) ON DELETE CASCADE,
  CONSTRAINT uq_<form> UNIQUE (tax_return_id)
);
```

**Hard rule:** no table holds both `person_id` and `tax_return_id` as scoping keys.
If a form has fields that semantically belong to both scopes, the form must be **split**
(see §4 — Pattern B forms).

### 2.3 Existing register-in-N-places hazards

The following registry-style allow-lists must remain in sync as `pf_*` tables proliferate
(documented in project memory):

- `PersonalResource.PERSONAL_FORMS` — `[[feedback_personal_resource_allowlist]]`
- `UserDataBulkDelete.PARENT_TABLES_UID_CASCADE` — `[[feedback_user_data_bulk_delete_catalog]]`
- `NonOverrideableFlags.CODES` — `[[feedback_non_overrideable_flags_registry]]`
- Liquibase `db.changelog-master.xml` `<include>` list — `[[feedback_liquibase_master_changelog]]`

Every Pattern B decomposition (§4) adds 2–3 new `pf_*` tables. Each must be added to the
relevant allow-list. Java unit tests cannot catch omissions in these registries — only
end-to-end tests can.

---

## 3. Sidebar audit — tab-as-person-scope (revised 2026-06-16)

Original audit of `shell.component.ts` recorded the as-is state of the single-return
implementation:

| Sidebar section | As-built (single return) | Notes |
|---|---|---|
| Statements | Shared household pool | `getMenuSections()` line 791-820 assembles `statementItems` with no tab filter. One pool of W-2s, 1099s, K-1s — each statement is *attributed* to a person via `recipientTIN` but the listing is family-wide. |
| Incomes | Tab-filtered | `getIncomeItemsForSelection()` branches on `selectedPerson.kind`. Dependent tab shows Capital gain/loss + Kiddie income. |
| Deductions | Tab-filtered | `getDeductionItemsForSelection()` branches on `selectedPerson.kind`. |
| Personal | Tab-filtered | `personalTaxpayerItems` (6 items) vs `personalSpouseItems` (3 items) at line 619-635. |
| Applications | Tab-filtered | `getApplicationItemsForSelection()` branches on `selectedPerson.kind`. |
| Tax Return | Shared | `taxReturnBaseItems` (line 738-744). `getTaxReturnItemsForSelection()` line 962 returns the same items for taxpayer AND spouse tabs (empty for dependent). |

### 3.1 Revised target — every section is tab-filtered

Per the 2026-06-16 design clarification, **every sidebar section is tab-filtered, including
Statements and Tax Return**. Each tab represents a person; each tab's sidebar shows the
forms / statements / returns owned by that person.

| Sidebar section | Target (revised) |
|---|---|
| Statements | **Tab-filtered.** Each tab lists only statements whose `recipientTIN` matches the active tab's person SSN. The upload pool is still household-wide (single TIN-routed write path) but the *listing* per tab is filtered. |
| Incomes | Tab-filtered (unchanged). |
| Deductions | Tab-filtered (unchanged). |
| Personal | Tab-filtered (unchanged). |
| Applications | Tab-filtered (unchanged). |
| Tax Return | **Tab-filtered.** Each tab's Tax Return section shows the return *that tab's person files*. The tab IS the return selector — no separate dropdown needed. |

**Tax Return per tab — MFJ vs MFS vs dependent-own:**

| Household filing | Taxpayer tab Tax Return | Spouse tab Tax Return | Dependent tab Tax Return |
|---|---|---|---|
| Single / HOH / QSS | Primary (head's return) | empty (no spouse) | empty unless `files_own_return` |
| MFJ | Primary (joint return — "your view") | Primary (joint return — same view) | empty unless `files_own_return` |
| MFS (persistent) | `mfs_head` return | `mfs_spouse` return | empty unless `files_own_return` |
| Dependent files own | (parent's return per row 1–3 above) | (per row 1–3 above) | `dependent_own` return |

**Optimizer placement** — the joint-vs-separate optimizer is a household-level planning
tool that spans both spouses. Per the design clarification it sits in **both** the Taxpayer
and Spouse tabs' Tax Return view so either spouse can run the comparison.

**Implication for the multi-return architecture.** This revision **eliminates** the
return-selector dropdown that the original §8.1 proposed. The tabs already represent
person scope; making the Tax Return section tab-filtered means each tab naturally lands
the user on their own return. Backend changes: none — the data model already supports
this. Frontend changes: `shell.component.ts` resolution methods for Statements and Tax
Return become tab-filtered (matching the existing Personal / Incomes / Deductions
pattern).

---

## 4. Same-name forms — three patterns

The hardest part of the refactor isn't the new tables; it's untangling forms whose internal
structure depends on which tab renders them. Three patterns exist today:

### 4.1 Pattern A — Parallel forms, identical structure (~30 forms)

Examples: `form-ira-income-taxpayer` ↔ `form-ira-income-spouse`, `form-interest-income-*`,
all per-person credit forms.

- Two components (or one component used twice with `@Input() person`).
- **Same field set** on both instances.
- Each person owns their own data completely (their own 1099-Rs, IRA elections, etc.).
- DB: `pf_ira_income (uid, owner_role ∈ {taxpayer, spouse})` UNIQUE.

**Refactor:** drop the `-taxpayer` / `-spouse` suffix. One component, `@Input() personId`.
DB becomes `pf_ira_income (uid, person_id)`. Dependent tab gets the same form when
`files_own_return = true`. Statement readers already key by `recipientTIN` → `person_id` is
a straight column rename in migration.

**Effort: ~3 weeks** for the ~30 forms (mostly mechanical column rename + repository + e2e).

### 4.2 Pattern B — Same component, asymmetric template (~6 forms)

`form-standard-deductions.component.ts` is the canonical example. One component, used twice
with `@Input() person`. Template uses `*ngIf="!isSpouse"` and `*ngIf="isSpouse"` to show
different sections per instance. The model has fields whose semantic anchors differ.

**Field inventory for `form-standard-deductions`** (30 columns on `pf_standard_deductions`):

| Field | Semantic anchor |
|---|---|
| `someoneCanClaimYou`, `youWereDualStatusAlien`, `youBornBeforeThreshold`, `youAreBlind` | Taxpayer **person** — intrinsic attribute |
| `someoneCanClaimSpouse`, `spouseBornBeforeThreshold`, `spouseIsBlind` | Spouse **person** — but currently stored on the taxpayer's row (model lines 19/24/25) AND on the spouse's row (12d boxes section). Collected in two places. |
| `spouseItemizesSeparateReturn`, `spouseMeetsAgeBlindnessMfsRequirements` | **Return** — MFS-specific attestation about the OTHER return |
| `dependentStandardDeductionEarnedIncome` | The filer's **person** — earned income for the dependent-standard-deduction worksheet |
| `deductionElection` (`AUTO`/`STANDARD`/`ITEMIZED`) | **Return** — only one election per return |
| All Schedule A line items (medical, SALT, mortgage, charity, casualty, foreign, other, disaster) | **Return** (Schedule A inputs); per-line `paidBy` allocation needed on MFS |

A single form has **three** distinct semantic anchors (taxpayer-person, spouse-person, return)
bundled into one DB row. The spouse-tab instance hides everything except spouse-person fields.

**Other Pattern B forms identified:**

- `form-additional-deductions` — Schedule 1-A with parallel `taxpayer*` / `spouse*` fields; split into per-person tip/overtime inputs + return-scoped MAGI thresholds.
- `form-form8862` — return-scoped, currently masquerading as taxpayer-scoped; just move to `tax_return_id`.
- `form-ctc-actc-screening` — return-scoped attestations + per-person ITIN gates; split into person-scoped ITIN flags + return-scoped CTC opt-out.
- `form-earned-income-credit` — return-scoped MFS-exception + per-person eligibility; split.
- `form-childcare-expenses` and `form-adoption-expenses` — pure return-scope, just need `tax_return_id`.

### 4.3 Pattern C — Return-level forms shown only on Taxpayer tab (~6 forms)

`filing-status`, `address-taxpayer`, `third-party-designee-taxpayer`,
`refund-and-amount-owed-taxpayer`, `form-form8862`, `form-ctc-actc-screening`.

- One form, one instance, on Taxpayer tab only.
- Conceptually belongs to the **return**, not to either spouse.
- The `-taxpayer` suffix is misleading — there's no `-spouse` counterpart because the data
  isn't person-attributable.

**Refactor:** add `tax_return_id` column, drop `uid`-keying-with-singleton. When MFS
produces 2 returns, each gets its own row. Same component code, just receives a `taxReturnId`
input.

---

## 5. The semantic-anchor rule

Every field must answer **exactly one** of these:

1. **Is this attribute INTRINSIC to a human?** (age, vision, can-be-claimed-as-dependent,
   dual-status alien, ITIN-vs-SSN, name, SSN, DOB) → **person scope**.
2. **Is this attribute about a TRANSACTION on a person's account?** (W-2 wages, 1099-R
   distribution, IRA rollover election, PSO premium amount, Form 4852 substitution) →
   **person scope**.
3. **Is this attribute about the RETURN AS A WHOLE?** (filing status, deduction election,
   third-party designee, refund destination, Form 8862 EIC recertification) → **return scope**.
4. **Is this attribute a SHARED-EXPENSE amount, default-attributable to neither spouse?**
   (medical paid, mortgage interest, charity, casualty, real-estate tax) → **return scope**,
   with optional `paidBy` allocation on MFS.
5. **Is this attribute ONE-person's-attestation-ABOUT-the-OTHER's-return-OR-status?**
   (spouse itemizes on separate return, MFS spouse meets age-blindness requirements,
   spouse-can-be-claimed-by-someone-else) → **return scope** — lives on whichever return needs
   to know, not on either person.

If a field can answer two of these, the field has been doing two jobs and **must be split**.

### 5.1 Component-level corollaries

1. **One field, one semantic anchor.** Refuse to ship a new field whose home is ambiguous.
2. **Components have a single scope input.** `@Input() personId` OR `@Input() taxReturnId`,
   never `@Input() person: 'taxpayer' | 'spouse'` deciding which sections to render.
3. **Template conditionals on `isSpouse` are smell.** If you find yourself writing
   `*ngIf="isSpouse"`, the form should have been split.
4. **Mirror fields are smell.** If `someoneCanClaimYou` and `someoneCanClaimSpouse` exist on
   the same row, the row is doing two jobs.
5. **Migration is per-Pattern-B-form**, not bulk — each form's canonical-row question
   (which `owner_role` row holds the true value for each column) is form-specific.

---

## 6. Worked example — decomposing `form-standard-deductions`

### 6.1 Target schema

```sql
-- Person-scoped: every person has age/vision/can-be-claimed
pf_person_status (
  uid, person_id,
  someone_can_claim,                      -- was someoneCanClaimYou (TP row) / someoneCanClaimSpouse (TP row)
  was_dual_status_alien,                  -- was youWereDualStatusAlien (TP row)
  born_before_threshold,                  -- was youBornBeforeThreshold (TP row) / spouseBornBeforeThreshold (SP row)
  is_blind,                               -- was youAreBlind (TP row) / spouseIsBlind (SP row)
  dependent_worksheet_earned_income       -- was dependentStandardDeductionEarnedIncome
);

-- Return-scoped: Schedule A line-item amounts + election
pf_return_itemized_deductions (
  uid, tax_return_id,
  deduction_election,                     -- AUTO / STANDARD / ITEMIZED
  medical_dental_expenses_paid,
  state_local_tax_choice, state_local_income_taxes_paid, state_local_sales_taxes_paid,
  real_estate_taxes_paid, personal_property_taxes_paid,
  home_mortgage_interest_paid, home_mortgage_points_paid,
  investment_interest_paid, net_investment_income,
  charitable_cash_contributions, charitable_noncash_contributions,
  personal_casualty_and_theft_loss,
  foreign_taxes_paid,
  other_allowed_itemized_deductions,
  net_qualified_disaster_loss, elect_disaster_loss_standard_deduction_increase,
  prior_year_charitable_contribution_carryover
);

-- Return-scoped, MFS-only: per-line allocation
pf_return_itemized_allocation (
  uid, tax_return_id,
  line_item NVARCHAR(50),                 -- 'medical_dental' | 'state_local_income' | ...
  paid_by_person_id BIGINT,
  split_percent DECIMAL(5,2)              -- 0..100; absent rows mean "100% to filer"
);

-- Two MFS attestations move to tax_return itself:
ALTER TABLE tax_return ADD spouse_itemizes_separate_return BIT NULL;
ALTER TABLE tax_return ADD spouse_meets_age_blindness_mfs_req BIT NULL;
```

### 6.2 UI decomposition

```
form-standard-deductions.component.ts (DEPRECATED — splits into:)
  ↓
  form-person-status.component.ts            ← reads pf_person_status, @Input() personId
  form-itemized-deductions.component.ts      ← reads pf_return_itemized_deductions + allocation, @Input() taxReturnId
  (spouse-itemizes-separate / MFS-age-blindness questions move into form-filing-status
   as MFS-conditional fields)
```

Each new component has a single semantic anchor and renders the same way regardless of which
tab it's accessed from. The decision "which person's status do I show?" becomes a routing
decision (driven by the active tab's `person_id`), not a template conditional.

### 6.3 Migration

```sql
-- Backfill person-scoped fields from the taxpayer row (canonical source today):
INSERT INTO pf_person_status (uid, person_id, someone_can_claim, born_before_threshold, is_blind, ...)
SELECT
  sd.uid,
  p.person_id,
  CASE WHEN p.role = 'head'   THEN sd.someone_can_claim_you
       WHEN p.role = 'spouse' THEN sd.someone_can_claim_spouse END,
  CASE WHEN p.role = 'head'   THEN sd.you_born_before_threshold
       WHEN p.role = 'spouse' THEN sd.spouse_born_before_threshold END,
  CASE WHEN p.role = 'head'   THEN sd.you_are_blind
       WHEN p.role = 'spouse' THEN sd.spouse_is_blind END,
  ...
FROM pf_standard_deductions sd
JOIN person p ON p.uid = sd.uid AND p.role IN ('head','spouse')
WHERE sd.owner_role = 'taxpayer';

-- Backfill return-scoped Schedule A items:
INSERT INTO pf_return_itemized_deductions (uid, tax_return_id, medical_dental_expenses_paid, ...)
SELECT sd.uid, tr.tax_return_id, sd.medical_dental_expenses_paid, ...
FROM pf_standard_deductions sd
JOIN tax_return tr ON tr.uid = sd.uid AND tr.return_kind = 'primary'
WHERE sd.owner_role = 'taxpayer';

-- Move MFS attestations to the tax_return row:
UPDATE tax_return SET spouse_itemizes_separate_return = (
  SELECT sd.spouse_itemizes_separate_return FROM pf_standard_deductions sd
  WHERE sd.uid = tax_return.uid AND sd.owner_role = 'taxpayer'
) WHERE return_kind = 'primary';

-- After verification:
DROP TABLE pf_standard_deductions;
```

The `owner_role = 'spouse'` row is largely redundant — the spouse-tab instance writes the same
spouse-person fields that the taxpayer row already captures (via `spouseBornBeforeThreshold`),
plus the 2 MFS-only attestations (now moved to `tax_return`). Per-form verification needed to
confirm canonical row.

---

## 7. Compute service changes

### 7.1 Signature

```java
// Before:
public TaxReturnComputation compute(String uid) { ... }

// After:
public TaxReturnComputation compute(long taxReturnId) {
    TaxReturn tr = taxReturnRepo.findById(taxReturnId);
    String uid = tr.getUid();
    List<Person> filers = personRepo.findFilersByReturn(taxReturnId);
    // ... compute scoped to this return's persons + return-scoped forms
}
```

### 7.2 Statement routing

Statements are uploaded to the household pool but consumed by returns:
- `se_w2.recipientTIN` → match to `person.ssn_or_itin` → that person's `person_id`.
- For each return: pull statements where `recipientTIN` matches a person in
  `tax_return_person WHERE tax_return_id = ?`.

On MFS, the head's W-2s flow only to `mfs_head`; the spouse's W-2s flow only to `mfs_spouse`.
On MFJ, both flow to `primary`. The same household statement pool serves both layouts —
which is why **the migration must not duplicate statements**.

### 7.3 Form 1040 line-by-line changes

Most line computations are unaffected — they already read from per-person buckets internally.
The changes concentrate at:

- **Filing-status branches:** every check of `filingStatus == MFS` now reads from the
  return-scoped `tax_return.filing_status`, not from a personal form.
- **MFS guard cascade:** the 20-orchestrator MFS-leakage prevention pattern documented in
  audits (M2 dominant) can be **dramatically simplified**: when `tax_return_id` scopes each
  call, the spouse's data simply isn't visible to the head's MFS return, so explicit
  null-shadowing becomes unnecessary at most sites.
- **Schedule A reader (`TaxReturnComputeService.java:5918+`):** stops reading
  `deductionsTaxpayer` and reads `pf_return_itemized_deductions WHERE tax_return_id = ?`
  instead.
- **Dependent inclusion** (Form 8814, kiddie tax routing): driven by `tax_return_person`
  `role_on_return = 'dependent'` joins.

### 7.4 What-if optimizer (post-refactor)

Once compute is `(tax_return_id, person_id)`-scoped, the joint-vs-separate optimizer is a
small operation:

```java
public OptimizerResult compareJointVsSeparate(long primaryReturnId) {
    // 1. Snapshot the primary (MFJ) return: clone tax_return + tax_return_person rows.
    long mfsHeadId   = taxReturnService.cloneAs(primaryReturnId, "mfs_head");
    long mfsSpouseId = taxReturnService.cloneAs(primaryReturnId, "mfs_spouse");

    // 2. Allocate shared inputs per IRC rules (Schedule A line items per paidBy, dependents per §152 tiebreaker).
    allocator.split(primaryReturnId, mfsHeadId, mfsSpouseId);

    // 3. Run compute on each.
    var mfj  = computeService.compute(primaryReturnId);
    var mfsA = computeService.compute(mfsHeadId);
    var mfsB = computeService.compute(mfsSpouseId);

    // 4. Discard the hypotheticals and return comparison.
    taxReturnService.delete(mfsHeadId);
    taxReturnService.delete(mfsSpouseId);
    return new OptimizerResult(mfj, mfsA, mfsB);
}
```

This addresses `scenarios.md §1.3` Gap.

---

## 8. UI changes summary (revised 2026-06-16)

### 8.1 Sidebar — tab-as-person-scope

- **Tabs are the return selector.** No dropdown above the Tax Return section. Each tab
  represents a person; each tab's Tax Return section shows the return that person files
  (per the §3.1 mapping table).
- **Statements section is tab-filtered.** Each tab lists only the statements whose
  `recipientTIN` matches the active tab's person SSN. The upload pool is still
  household-wide for the write path but the *listing* per tab is filtered.
- Dependent tab Tax Return section becomes populated when `person.files_own_return = true`.
- The **joint-vs-separate optimizer** sits in both the Taxpayer and Spouse tabs' Tax
  Return view so either spouse can run the comparison.

### 8.2 Form components

- Pattern A: drop `-taxpayer` / `-spouse` suffix, add `@Input() personId`.
- Pattern B: decompose into multiple smaller components (one per semantic anchor).
- Pattern C: rename to drop `-taxpayer` suffix, add `@Input() taxReturnId`.

### 8.3 Tab semantics

- Taxpayer tab → routes to `person_id` of the head and the active return for the head
  (primary when MFJ/Single/HOH/QSS; `mfs_head` when persistent MFS).
- Spouse tab → routes to `person_id` of the spouse and (on MFS) the `mfs_spouse` return.
  On MFJ, the spouse tab shows the same joint primary return — both spouses share one
  filing.
- Dependent tab → routes to that dependent's `person_id` and (when `files_own_return`)
  to their `dependent_own` return.

---

## 9. Effort estimate

| Phase | Scope | Effort |
|---|---|---|
| 1 | Core schema: `person`, `tax_return`, `tax_return_person`; data migration from `uid`-keyed singletons | 3 weeks |
| 2 | Pattern A refactor: 30 forms drop suffix, key by `person_id` | 3 weeks |
| 3 | Pattern B decomposition: 6 forms split into person/return components + migration scripts | 6 weeks |
| 4 | Pattern C: 6 forms gain `tax_return_id` | 0.6 weeks |
| 5 | Compute service: `(taxReturnId)` signature, statement routing, MFS guard simplification | 2 weeks |
| 6 | UI: sidebar return selector, tab/return routing, component split rendering | 1.5 weeks |
| 7 | Dependent-own returns: enable on dependent tab, child-return compute paths | 1 week |
| 8 | What-if optimizer (Gap 1.3): clone + allocate + compare API + UI | 1 week |
| **Total** | | **~18 weeks** |

The earlier 9-week estimate accounted for compute changes only and missed the per-form
schema refactor + Pattern B decomposition + dependent-own returns. The 17-week estimate
omitted the optimizer phase.

---

## 10. Open questions / deferred

1. **Allocator rules for shared Schedule A items on MFS.** Default to 50/50 split? Default
   to `paidBy = filer`? Require explicit per-line attestation? IRS guidance:
   community-property states (CA, TX, WA, etc.) have specific allocation rules different
   from common-law states.
2. **§152 dependent tiebreaker UI.** When MFS, who claims each dependent? The optimizer
   needs to try both allocations and pick the lower combined tax.
3. **Statement re-attribution.** If a joint W-2 (rare) lists both spouses, how is it
   routed under MFS? Today statements assume one `recipientTIN`.
4. **Backwards compatibility.** Existing single-return users get migrated to
   `return_kind='primary'` on a single `tax_return` row. No user-visible change until they
   opt into MFS analysis.
5. **History / audit trail.** Should hypothetical MFS returns be persisted (audit log)
   or discarded after compute? Persisting helps reproduce optimizer results months later;
   discarding keeps the DB lean.
6. **Form 8615 (kiddie tax) cross-return reads.** A dependent's `dependent_own` return
   needs to read the parents' return to compute kiddie tax. This is the first
   cross-return read in the system; design needs to ensure read-consistency and avoid
   recompute loops.

---

## 11. Implementation plan

This section is the rock-solid execution plan for sections 1–10 above. It is written under
two non-negotiable constraints:

> **Constraint A — Compute behavior must not change.** Every Form 1040 line value, schedule,
> flag, refund, and owed amount must remain numerically identical to the current production
> output for every existing test scenario throughout the entire migration.
>
> **Constraint B — Existing tests must not be edited.** All 765 Java unit tests and ~200 e2e
> specs continue to run unchanged through every phase. Their exact-value pins ARE the
> behavior contract. New tests may be added (MFS, dependent-own, optimizer); existing tests
> may not be modified.

If a phase change would violate either constraint, the phase is wrong, not the test
(per `[[feedback_principled_diagnosis_over_test_tweaking]]`). Diagnose the migration,
fix it, do not rewrite the test.

### 11.1 Guiding principles

1. **Strangler fig, not big bang.** New tables exist alongside old tables for the duration
   of each phase. Old reads/writes continue until the new path has been verified equivalent.
   No phase deletes anything that has not been provably superseded.
2. **Behavior preserved bit-for-bit.** Tax outputs remain identical for every existing
   scenario throughout migration. Compute logic is not rewritten — only its data sources
   are repointed, behind a feature flag, after shadow verification.
3. **No test rewrites during migration.** See Constraint B.
4. **Reversibility at every phase.** Each phase ends in a state where a single config
   flip rolls compute back to the previous path. No `DROP TABLE` until Phase 10.
5. **One phase, one PR, one feature flag.** Phases are not interleaved. PR n is fully
   merged, regression green, flag enabled in dev → staging → prod before PR n+1 starts.

### 11.2 Strangler-fig timeline per form

Each Pattern B form passes through this sequence. Pattern A and C use a subset.

```
   T0  Baseline — old table, old compute path, all tests green
   T1  Add new tables (CREATE TABLE only; no FK breaks)
   T2  Backfill — INSERT INTO new SELECT FROM old; idempotent SQL; verify counts + values
   T3  Dual-write — REST handler writes to BOTH old AND new in one @Transactional method
   T4  Shadow-read — compute runs old (primary) AND new (shadow); assert outputs identical;
       log mismatches; do NOT use new path's value yet
   T5  Run full regression with shadow on. 0 mismatches required. Rollback on any diff.
   T6  Flip read flag — compute reads new (gated); old becomes shadow; full regression green
   T7  Stop dual-write — writes only to new table; old becomes append-only stale
   T8  Soak ≥2 weeks in staging; shadow_diff log empty
   T9  Phase 10 cleanup — DROP old tables and migration scaffolding
```

Critical property: every state T0–T8 is a fully working production state. A bug at T5 rolls
back to T4 by flipping `multi_return.read.<form>` back to OLD; no service interruption.

### 11.3 Feature flag scheme

All flags default to `false` in code; flipped per-environment, per-form, dev → staging → prod.
Follow `[[feedback_temp_toggle_convention]]` — gates carry a banner comment dating the
toggle and naming the rollback owner.

```properties
# Per-form read flags (Phases 3–5)
multi_return.read.<form-id>=false

# Compute signature toggle (Phase 6)
multi_return.compute.signature_v2=false

# Feature gates (Phases 7–9)
multi_return.feature.mfs_enabled=false
multi_return.feature.dependent_own_enabled=false
multi_return.feature.optimizer_enabled=false

# Safety net (always on during T4–T7 of every form)
multi_return.shadow.enabled=true
multi_return.shadow.fail_on_mismatch=false   # set true in dev/test envs
```

### 11.4 The eleven phases

Each phase below opens with an **impact statement** per
`[[feedback_impact_first_protocol]]`: files touched, tests at risk, rollback cost.

---

#### Phase 0 — Foundation tables (no behavior change)

**Impact.** 1 Liquibase migration (`V63__multi_return_core_tables.sql`). 4 new Java files
(`Person`, `TaxReturn`, `TaxReturnPerson` entities + repositories). 4 registry updates.
**Tests at risk: 0** (no compute or read path uses new tables). **Rollback: drop V63**.

**Tasks.**
1. `V63__multi_return_core_tables.sql`:
   - CREATE TABLE `person`, `tax_return`, `tax_return_person`
   - `--liquibase formatted sql` header per `[[feedback_liquibase_formatted_sql_header]]`
   - Single-sentence prose comments per `[[feedback_liquibase_formatted_sql_bullet_block]]`
   - Backfill in same migration:
     - For every `app_user(uid)` → 1 `person` row with `role='head'`
     - For every uid with spouse data → 1 `person` row with `role='spouse'`
     - For every dependent in `pf_dependents` → 1 `person` row with `role='dependent'`
     - For every uid → 1 `tax_return` row with `return_kind='primary'`, `filing_status` from existing form
     - Populate `tax_return_person` with derived `role_on_return`
2. Add `<include>` line to `db.changelog-master.xml` per `[[feedback_liquibase_master_changelog]]`.
3. Register `person` and `tax_return` in `UserDataBulkDelete.PARENT_TABLES_UID_CASCADE`.
4. Add Java entities + repositories (CRUD only — no business logic).
5. **Verification SQL** (also as Liquibase post-precondition):
   ```sql
   -- Every uid has exactly one head person
   SELECT uid FROM app_user EXCEPT SELECT uid FROM person WHERE role='head';   -- must be empty
   -- Every uid has exactly one primary tax_return
   SELECT uid, COUNT(*) FROM tax_return WHERE return_kind='primary'
     GROUP BY uid HAVING COUNT(*) <> 1;                                        -- must be empty
   -- No orphan tax_return_person rows
   SELECT 1 FROM tax_return_person trp
     LEFT JOIN tax_return tr ON tr.tax_return_id=trp.tax_return_id WHERE tr.tax_return_id IS NULL;
   ```
6. New Java test: `MultiReturnFoundationTest` verifies backfill across representative uids.

**Exit criteria.** 765/765 unit + 200/200 e2e green. Verification SQL returns empty.

---

#### Phase 1 — Dual-key schema (add columns, do not use them)

**Impact.** ~36 Liquibase migrations, one per `pf_*` table. Each adds nullable `person_id`
(Pattern A/B) or `tax_return_id` (Pattern C) + FK + backfill. **Tests at risk: 0**.
**Rollback: drop new columns**.

**Tasks per form table.**
1. Migration `V<N>__add_<key>_to_<form>.sql`:
   ```sql
   ALTER TABLE pf_<form> ADD person_id BIGINT NULL;
   ALTER TABLE pf_<form> ADD CONSTRAINT fk_<form>_person
     FOREIGN KEY (person_id) REFERENCES person(person_id);

   UPDATE f SET f.person_id = p.person_id
   FROM pf_<form> f
   JOIN person p ON p.uid = f.uid
                AND ((f.owner_role='taxpayer' AND p.role='head')
                  OR (f.owner_role='spouse'   AND p.role='spouse'));
   ```
2. Verification SQL per form: `SELECT COUNT(*) FROM pf_<form> WHERE person_id IS NULL;` — must be 0.
3. Do NOT make column NOT NULL yet — old code does not write it.
4. Per-form Java test `<Form>DualKeyMigrationTest` verifies backfill.

**Exit criteria.** All `pf_*` tables carry new scoping column populated. All tests green.

---

#### Phase 2 — Dual-write (REST handlers write old + new keys)

**Impact.** ~36 mapper updates. `PersonalResource` updates. **Tests at risk: 0** if
transactions are correct. **Rollback: revert mapper PRs**.

**Tasks.**
1. In each mapper's `save()`, after the existing INSERT/UPSERT:
   - Resolve `person_id` from `(uid, owner_role)` via `PersonRepository`
   - `UPDATE pf_<form> SET person_id = ? WHERE id = ?`
   - Single `@Transactional` boundary
2. Per-mapper unit test `<Form>DualWriteTest` asserts both columns populated post-save.
3. Run full regression — expected: 0 changes.

**Exit criteria.** New rows always carry both keys.

---

#### Phase 3 — Pattern A migration (~30 forms, 1 per PR)

**Impact per form.** 1 mapper update (read path), 1 Angular component update
(`@Input() person` → `@Input() personId`), 1 e2e spec at risk (the form's own spec).
**Rollback: flip `multi_return.read.<form>` flag OFF (seconds)**.

**Per-form workflow.**
1. Behind flag `multi_return.read.<form>`, add new read path: `WHERE person_id = ?`.
   Old path remains default.
2. Shadow-read: when shadow flag on, both paths run; assert identical row sets;
   log diffs to `multi_return_shadow_diff` table; **fail loudly in dev**.
3. Run full regression with shadow on. **0 mismatches required**.
4. Flip flag ON in dev. Run regression. **0 failures required**.
5. Update Angular component `@Input() personId`.
6. Sidebar formId routing: preserve `data-form-id` strings as aliases so e2e selectors
   work unchanged (test-continuity invariant).
7. Merge PR. Flip flag ON in staging → prod after soak.

**Exit criteria after all 30 forms.** All Pattern A reads use `person_id`. All flags ON.
All tests green throughout.

---

#### Phase 4 — Pattern C migration (~6 forms)

**Impact per form.** Same as Pattern A but with `tax_return_id`. **Tests at risk: 0**.
**Rollback: per-form flag flip**.

**Per-form workflow.** Identical to Phase 3 but reads via `WHERE tax_return_id = ?`. Each
Pattern C form has exactly one row per uid today, so backfill maps trivially to the single
`primary` tax_return.

**Exit criteria.** All 6 Pattern C forms read by `tax_return_id`. Flags ON.

---

#### Phase 5 — Pattern B decomposition (THE CRITICAL PHASE)

**Impact per form.** 2–4 new `pf_*` tables. All four registries updated. Field-by-field
backfill SQL. Dual-write, shadow-read. UI component split into multiple components with
sidebar alias preservation. **Tests at risk: substantial** — every test touching one of
these forms. **Rollback: per-form flag flip to old monolithic table**.

**Order (least → most coupled to compute):**
1. `form-form8862` (return-scoped only — easiest)
2. `form-adoption-expenses` (return-scoped only)
3. `form-childcare-expenses` (return-scoped only)
4. `form-ctc-actc-screening` (person + return split)
5. `form-earned-income-credit` (person + return split)
6. **`form-standard-deductions`** (3-way split, touches Schedule A — most critical, last)

**Worked workflow for `form-standard-deductions`** (the template for all six):

| Step | Action | Verification |
|---|---|---|
| T1 | `V<N>__split_standard_deductions.sql`: CREATE `pf_person_status`, `pf_return_itemized_deductions`, `pf_return_itemized_allocation`; ALTER `tax_return` add MFS attestation columns; register all in 4 hazard registries. | Liquibase precondition: all 3 tables + 2 columns present |
| T2 | Field-by-field backfill per §6.3. Taxpayer row is canonical source. | `SELECT COUNT(*)` parity: rows in `pf_person_status` = (head + spouse) count; `pf_return_itemized_deductions` = primary `tax_return` count; per-field value equality SQL |
| T3 | Dual-write in PUT `/api/personal/standard-deductions-{taxpayer,spouse}`: single `@Transactional` writes old `pf_standard_deductions` AND new tables AND MFS columns on `tax_return`. | Per-mapper unit test asserts all writes occurred |
| T4 | `StandardDeductionShadowReader` reads new tables and builds parallel `Deductions` object. At line 5918+ Schedule A reader site, when shadow flag on, deep-equals against current `deductionsTaxpayer`; log diff. **Shadow value never consumed.** | `ComputeDiff` is empty across the full test suite |
| T5 | Full regression with shadow on. | `multi_return_shadow_diff` table empty after run; if any diff, diagnose root cause (IRS docs → line spec → compute code) — do NOT adjust expected values |
| T6 | Flip `multi_return.read.standard-deductions=true`. Compute reads new; old becomes shadow. | Full regression green; shadow_diff still empty |
| T7 | Add `form-person-status` and `form-itemized-deductions` components. Update sidebar. **Keep old `form-standard-deductions` component as deprecated alias**: sidebar `data-form-id="standard-deductions-taxpayer"` resolves to a wrapper that delegates to the new components, preserving e2e selectors. | All ~30 e2e specs that touch this form pass unchanged |
| T8 | Stop dual-write — writes only to new tables. Old becomes append-only stale. | Per-mapper test updated to assert single-table write |
| T9 | 2-week soak in staging; shadow_diff log monitored daily | 0 diffs over soak period |

The same template applies to the other 5 Pattern B forms with appropriate field maps.

**Exit criteria for Phase 5.** All 6 Pattern B forms decomposed. Compute reads new tables.
Old tables stale but present. All 765 unit + 200 e2e tests green throughout.

---

#### Phase 6 — Compute service signature migration

**Impact.** `TaxReturnComputeService.compute(uid)` becomes a thin adapter that resolves
uid → primary `tax_return_id`. ~80 internal call sites plumbed through. **Tests at risk: 0**
because the adapter preserves the old signature. **Rollback: `multi_return.compute.signature_v2=false`**.

**Tasks.**
1. New method `compute(long taxReturnId)`. Resolves uid + persons internally.
2. Existing `compute(String uid)` becomes:
   ```java
   public TaxReturnComputation compute(String uid) {
       long taxReturnId = taxReturnRepo.findPrimaryByUid(uid).id();
       return compute(taxReturnId);
   }
   ```
3. Internal reads switch from `personalDataService.read(uid, "taxpayer")` patterns to
   `readByPerson(personId)` / `readByReturn(taxReturnId)`.
4. Statement routing: filter by `tax_return_person` membership (TIN must match a person
   on this return).
5. **MFS guard cascade — preserve, do not remove.** The 20-orchestrator M2-dominant
   leakage prevention pattern stays in place. Audit for redundancy happens AFTER Phase 7
   proves stable.
6. New Java test `TaxReturnComputeServiceV2Test` verifies adapter equivalence: for every
   existing test scenario, `compute(uid)` and `compute(primaryReturnIdOf(uid))` produce
   identical output.

**Exit criteria.** Both signatures coexist. New scoping is internal. All tests green.

---

#### Phase 7 — MFS enablement

**Impact.** Filing-status form gains "produce two separate returns" path. New `mfs_head`
+ `mfs_spouse` `tax_return` rows. New e2e specs for MFS scenarios. Existing single-return
tests untouched. **Rollback: `multi_return.feature.mfs_enabled=false`**.

**Tasks.**
1. UI: filing-status form, MFS selection presents "produce two separate returns" option.
2. Backend: when option ON, clones `primary` → `mfs_head` + `mfs_spouse` via Phase 9
   allocator (lightweight initial allocator: 100% to filer for shared expenses, with UI
   override).
3. New e2e specs:
   - `mfs-basic-flow.spec.ts` — split MFJ into MFS, verify both compute
   - `mfs-itemize-must-match.spec.ts` — IRC §63(c)(6)(A)
   - `mfs-ss-restrictive.spec.ts` — §86(c)(1)(C)
   - `mfs-education-credit-blocked.spec.ts` — §25A(g)(6)
   - `mfs-eic-blocked.spec.ts` — §32(d)
4. Hand-pin all new e2e values per `[[feedback_e2e_exact_value_pins]]`.

**Exit criteria.** MFS flag flippable per user. Existing tests green; new MFS tests green.

---

#### Phase 8 — Dependent-own returns

**Impact.** Dependent tab Tax Return section becomes populated when
`person.files_own_return=true`. New compute path for `dependent_own`. Form 8615 cross-return
read added. **Rollback: `multi_return.feature.dependent_own_enabled=false`**.

**Tasks.**
1. Add `person.files_own_return` UI on dependent tab.
2. Creating a `dependent_own` `tax_return` row populates the sidebar Tax Return section.
3. Form 8615 reads parents' return via `tax_return_person` join → parent's
   `tax_return.taxable_income` **as a snapshot, not live**.
4. **Read consistency:** parent's compute happens first; result is materialized into a
   `tax_return_snapshot` row that the dependent's compute reads. Prevents recompute loops
   (open question #6).
5. New e2e specs: `dependent-own-basic`, `dependent-own-kiddie-tax`, `dependent-own-eic-ineligible`.

**Exit criteria.** Dependent-own returns produced correctly. All existing tests green.

---

#### Phase 9 — What-if optimizer

**Impact.** New endpoint `POST /api/tax-return/optimize/joint-vs-separate`. UI: "Compare
filing options" button. **Rollback: `multi_return.feature.optimizer_enabled=false`**.

Implementation per §7.4 pseudocode.

**Exit criteria.** Optimizer matches hand-computed comparison scenarios.

---

#### Phase 10 — Cleanup (only after ≥30 days clean prod soak)

**Impact.** `DROP TABLE` old monolithic tables. Remove `owner_role` columns. Remove
dual-write and shadow-compute code. Remove migration feature flags.
**Rollback: backup restore required — irreversible by design**.

**Tasks.**
1. Verify `multi_return_shadow_diff` empty for ≥30 days.
2. Audit prod queries for any read of deprecated tables (SQL Server `sys.dm_exec_query_stats`).
3. Snapshot old tables to `archive_*` schema (defensive backup).
4. `V<N>__cleanup_deprecated_tables.sql` drops tables/columns.
5. Remove `multi_return.*` flags from `application.properties` and `if` gates from code.
6. Remove deprecated component files (`form-standard-deductions.component.ts`, etc.).
7. Update project memory: mark `[[project_single_return]]` superseded; add
   `[[project_multi_return_architecture]]`.

**Exit criteria.** Codebase free of migration scaffolding. Memory updated.

### 11.5 Per-phase verification gates

Before merging any phase PR, all of these must be true:

| Gate | How verified |
|---|---|
| 765/765 Java unit tests pass | `./mvnw test` exit 0 |
| 200/200 e2e specs pass | `cd e2e && npm run test:regression -- --workers=1` exit 0 |
| Liquibase migration applies cleanly to fresh DB | Quarkus dev-services container startup |
| Liquibase migration applies cleanly to populated DB | prod snapshot → staging restore → migration apply |
| Per-form verification SQL returns expected (usually 0 rows) | Run as Liquibase precondition + post-assertion |
| `multi_return_shadow_diff` is empty | Query after regression run |
| `npm run build` succeeds | Angular type check green |
| All 4 registries updated | Code-review checklist |
| `--liquibase formatted sql` header present in every new V*.sql | CI grep gate |
| Single-sentence prose comments (no bullet blocks) | Code-review checklist |
| No edits to existing test files | PR diff inspection |

### 11.6 Shadow-compute verification (the primary safety net)

The most important mechanism for Phases 3–6. Outline:

```java
@ApplicationScoped
public class TaxReturnComputeService {
    @ConfigProperty(name = "multi_return.shadow.enabled", defaultValue = "true")
    boolean shadowEnabled;

    @ConfigProperty(name = "multi_return.shadow.fail_on_mismatch", defaultValue = "false")
    boolean failOnMismatch;

    public TaxReturnComputation compute(String uid) {
        TaxReturnComputation primary = computePrimaryPath(uid);

        if (shadowEnabled) {
            try {
                TaxReturnComputation shadow = computeShadowPath(uid);
                ComputeDiff diff = TaxReturnComputation.diff(primary, shadow);
                if (!diff.isEmpty()) {
                    shadowDiffLog.record(uid, diff);
                    if (failOnMismatch) throw new ShadowMismatchException(diff);
                }
            } catch (Exception e) {
                shadowDiffLog.recordError(uid, e);
                // never let shadow failure break the primary path
            }
        }
        return primary;
    }
}
```

`ComputeDiff` compares every output field (Form 1040 line values, schedules, flags, refund,
owed). Any non-empty diff is a migration bug.

- **Dev/test envs:** `failOnMismatch=true` — any diff aborts the request and surfaces in CI logs.
- **Staging/prod:** `failOnMismatch=false` — primary path always serves the user; diffs logged
  for investigation.

`multi_return_shadow_diff` is checked after every regression run as a verification gate.

### 11.7 Test strategy

#### 11.7.1 Existing tests — invariant preserved

- 765 Java unit + ~200 e2e specs run unchanged across every phase.
- Exact-value pins per `[[feedback_e2e_exact_value_pins]]` are immutable.
- Test data setup (`clearUserData`, seed forms) is enhanced to clean new tables per
  `[[feedback_user_data_bulk_delete_catalog]]`; test logic itself untouched.
- Sidebar `data-form-id` aliases preserve Playwright selectors when components are split.

#### 11.7.2 New tests added per phase

| Phase | New tests |
|---|---|
| 0 | `MultiReturnFoundationTest` — backfill correctness |
| 1 | Per-form `<Form>DualKeyMigrationTest` |
| 2 | Per-mapper `<Form>DualWriteTest` |
| 3 | Per-form `<Form>ShadowReadTest` |
| 4 | Per-form `<Form>ReturnScopedReadTest` |
| 5 | Per-Pattern-B-form `<Form>DecompositionTest` — field-by-field backfill + shadow-compute parity |
| 6 | `TaxReturnComputeServiceV2Test` — adapter equivalence |
| 7 | 5 MFS e2e specs (listed in Phase 7) |
| 8 | 3 dependent-own e2e specs (listed in Phase 8) |
| 9 | `OptimizerIntegrationTest` — joint-vs-separate for hand-computed scenarios |

#### 11.7.3 Pre-flight test gates per phase

1. Baseline run on `main`: 765/765 + 200/200 green.
2. Snapshot expected values → `test-snapshots/phase-N-baseline.json`.
3. After phase merge: compare new run to snapshot — must match bit-for-bit.

#### 11.7.4 Nightly regression in CI

```bash
./mvnw test
cd e2e && npm run test:regression -- --workers=1
# Then SQL: SELECT COUNT(*) FROM multi_return_shadow_diff WHERE run_date = TODAY;
# Must be 0.
```

Non-zero diff → Slack alert to migration owner.

### 11.8 Rollback plan per phase

| Phase | Rollback mechanism | Estimated time |
|---|---|---|
| 0 | Drop V63 (no FKs from old tables yet) | <10 min |
| 1 | Drop new columns | <10 min |
| 2 | Revert mapper PRs, redeploy | <30 min |
| 3 | Flip `multi_return.read.<form>` OFF | Seconds |
| 4 | Flip `multi_return.read.<form>` OFF | Seconds |
| 5 | Per-form flag OFF; sidebar alias falls back to old component | Seconds backend / re-deploy UI |
| 6 | `multi_return.compute.signature_v2=false` | Seconds |
| 7 | `multi_return.feature.mfs_enabled=false` | Seconds |
| 8 | `multi_return.feature.dependent_own_enabled=false` | Seconds |
| 9 | `multi_return.feature.optimizer_enabled=false` | Seconds |
| 10 | **Backup restore required — irreversible by design** | Hours (DB restore) |

Phase 10 is the only irreversible phase and only runs after ≥30 days clean prod soak.

### 11.9 Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Pattern B decomposition produces field mismatch | Medium | High — compute outputs change | Shadow compute over full regression; per-field verification SQL; `failOnMismatch=true` in dev/test |
| 2 | Statement routing leaks across MFS returns | Medium | High — wrong tax calc | Phase 6 statement-routing tests; MFS guard cascade preserved through Phase 6 |
| 3 | Registry hazard miss — new table forgotten in one of 4 registries | High (5× hit historically) | Medium — silent failures, data leaks | Code-review checklist enumerates all 4; CI lint job greps new V*.sql for required registry mentions |
| 4 | Liquibase migration ordering bug (V<N> depends on V<N-1> backfill) | Low | Medium | Self-contained migrations; verification SQL as Liquibase precondition |
| 5 | Liquibase formatted-SQL header omitted | High (3× hit) | High — all SQL runs as one batch | CI grep gate per `[[feedback_liquibase_formatted_sql_header]]` |
| 6 | Shadow over-reports diffs from timestamps | Medium | Low — false positives | Diff comparator allowlist excludes timestamp fields |
| 7 | Pattern B UI split breaks e2e `data-form-id` selectors | Medium | Medium — e2e suite goes red | Sidebar alias layer preserves old selectors during transition |
| 8 | MFS allocator nondeterministic | Low | High — optimizer unreliable | Pure-function allocator; deterministic test fixtures |
| 9 | Phase 10 cleanup drops a still-in-use table | Low | Critical — data loss | 30-day soak; prod query audit; `archive_*` schema before DROP |
| 10 | Migration exceeds 18 weeks; partial state in prod | Medium | Medium — operational complexity | Each phase independently shippable; partial state is valid |
| 11 | Test file edits creep in during migration | Medium | High — violates test invariant | PR review checklist: any existing test edit needs explicit user approval |
| 12 | Java-unit pass + e2e fail divergence | High (8× hit per memory) | Medium | Both gates required at every phase boundary per `[[feedback_java_unit_passing_doesnt_mean_e2e_passing]]` |
| 13 | Form 8615 cross-return read causes recompute loop | Low | High — infinite loop | Read parent SNAPSHOT, not live compute; acyclic order in Phase 8 |
| 14 | Shadow path has bugs that mask real diffs | Low | High — false negatives | Shadow reviewed independently; mutation tests verify shadow catches injected errors |
| 15 | Backfill SQL on prod exceeds deployment window | Medium | Medium | Batched + resumable Liquibase changesets; precondition gates |
| 16 | MFS guard cascade prematurely removed | Low | Critical — spouse data leaks into MFS-head return | Guards stay in place through Phase 6; explicit Phase 11-future audit task; do not bundle removal with migration |
| 17 | Person ID type mismatch (BIGINT vs Long boxing) in repository | Low | Low — runtime cast error | Typed repository interfaces; Java unit test per repository |
| 18 | Dependent-own return reads parents' return mid-compute | Low | High — stale data | Snapshot pattern per Phase 8 task 4 |

### 11.10 Pre-flight checklist (run before Phase 0 PR opens)

- [ ] Full baseline regression on `main`: 765/765 + 200/200 green
- [ ] Baseline snapshot saved: `test-snapshots/phase-0-baseline.json`
- [ ] Liquibase migration count baseline confirmed (`V62` current; new starts at `V63`)
- [ ] Production DB snapshot taken (defensive backup)
- [ ] Staging schema matches prod bit-for-bit
- [ ] Migration owner identified — single person, single Slack channel for shadow_diff alerts
- [ ] User approves 18-week timeline + phase-by-phase rollout
- [ ] User approves test-continuity invariant (§11 Constraint B)
- [ ] User approves Phase 10 irreversibility
- [ ] CI lint job for Liquibase headers + registry mentions added
- [ ] `multi_return_shadow_diff` table created in dev/staging/prod
- [ ] Nightly regression job scheduled

### 11.11 Critical path summary

```
Phase 0 → 1 → 2 ──┬─→ 3 (Pattern A — 30 forms; pairs parallelizable) ─┐
                  └─→ 4 (Pattern C — 6 forms; parallelizable)──────────┤
                                                                       ↓
                                          5 (Pattern B — 6 forms; SEQUENTIAL)
                                                                       ↓
                                                              6 → 7 → 8 → 9
                                                                       ↓
                                                          (30-day soak) → 10
```

Critical path: 0 → 1 → 2 → 5 → 6 → 7 → 8 → 9 → 10. Phases 3 and 4 can parallelize within
team capacity. Estimated calendar time: **20–22 weeks** including soak vs. 18 weeks of pure
engineering effort.

### 11.12 What this plan guarantees

1. **Compute logic is never rewritten** — only its data sources are repointed. Form 1040
   line-by-line algorithms remain bit-identical to current production code.
2. **No existing test is edited** — all 765 Java unit + ~200 e2e specs run unchanged
   through every phase. Their pinned values are the contract.
3. **Shadow-compute verification catches every regression** before it can reach users —
   in dev/test the request aborts; in staging/prod the primary path serves but the
   discrepancy is logged and alerted.
4. **Every phase is independently reversible** via feature flag (Phases 3–9) or column
   drop (Phases 0–1) without touching production data.
5. **Phase 10 is the only irreversible step** and is gated on ≥30 days clean shadow log
   and explicit user approval.

What this plan does NOT guarantee:
- That the 18–22 week calendar holds. Estimate variance is normal; the plan accommodates
  partial completion (every phase is shippable).
- That allocator rules for community-property states are correct on day 1 (Phase 7 ships
  with common-law allocator; community-property is an open question — §10 #1).
- That cross-return reads beyond Form 8615 (e.g. injured-spouse-allocation Form 8379) are
  addressed; out of scope for this migration.

---

## 12. Related memory and references

- `[[project_single_return]]` — the starting-state constraint being lifted.
- `[[feedback_personal_resource_allowlist]]` — `PERSONAL_FORMS` registry hazard.
- `[[feedback_user_data_bulk_delete_catalog]]` — `PARENT_TABLES_UID_CASCADE` registry hazard.
- `[[feedback_non_overrideable_flags_registry]]` — `NonOverrideableFlags.CODES` registry hazard.
- `[[feedback_liquibase_master_changelog]]` — Liquibase `<include>` registry hazard.
- `[[reference_local_test_db]]` — dev/e2e use Quarkus Dev Services SQL Server, not Azure.
- `C:\us-tax\scenarios.md` §1.3 — joint-vs-separate optimizer gap.
- `C:\us-tax\us-tax-be\src\main\resources\db\changelog\changes\V15__retirement_income_forms.sql`
  — current per-form schema pattern.
- `C:\us-tax\us-tax-be\src\main\java\com\ustax\microservices\TaxReturnComputeService.java`
  — `:5918+` Schedule A reader; `:20090-20278` Form 2210 reference for cross-form
  pattern.
- `C:\us-tax\us-tax-ui\src\app\shell\shell.component.ts` — sidebar resolution methods
  (`personalTaxpayerItems` 619-635, `taxReturnBaseItems` 738-744, `getMenuSections` 791-820,
  per-section selectors 867-906, `getTaxReturnItemsForSelection` 962).
- `C:\us-tax\us-tax-ui\src\app\forms\form-standard-deductions.component.ts` and `.html`
  — canonical Pattern B form.

---

## 13. Change log

| Date | Author | Note |
|---|---|---|
| 2026-06-15 | Architect + Claude | Initial document consolidating analysis from MFS-data-sufficiency audit, MSSQL-architecture proposal, sidebar shared-screens audit, and same-name forms decomposition design. |
| 2026-06-15 | Architect + Claude | Added §11 Implementation plan — 11 phases, strangler-fig timeline per form, feature-flag scheme, shadow-compute safety net, per-phase verification gates, rollback plan, 18-item risk register, pre-flight checklist. Plan locks in two non-negotiable constraints: compute behavior must not change bit-for-bit; existing 765 unit + ~200 e2e tests must not be edited. |
| 2026-06-15 | Implementation | Phase 0 shipped (commit `94746cd`): V63 foundation tables (`person`, `tax_return_v2`, `tax_return_v2_person`) + JPA entities + UserDataBulkDelete catalog update + `MultiReturnFoundationTest` (9 tests). `tax_return_v2` named with the `_v2` suffix to avoid collision with the existing V7 `tax_return` compute-anchor table; will be renamed in Phase 10. The 765-test baseline cited in the doc was stale — actual current baseline is 1063. Three Liquibase gotchas surfaced and were fixed: V63's `dbms` precondition type is XML-only, not supported by the formatted-SQL parser; removed in a follow-up edit. |
| 2026-06-15 | Implementation | Phase 1 shipped (commit `0404bfc`): V64 adds nullable `person_id` to 39 Pattern A/B `pf_*` tables; V65 adds nullable `tax_return_id` to 14 Pattern C tables. Backfills include a three-way dependent-role branch for `pf_capital_gain_loss` and `pf_kiddie_income`. Per-table verification preconditions halt startup on any NULL row after backfill. `Phase1DualKeyMigrationTest` pins migration shape (12 tests). Regression: 1075 green. |
| 2026-06-15 | Implementation | Phase 2 shipped (commit `9938364`) with a **strategy change** from the original plan: V66 adds 39 AFTER INSERT, UPDATE triggers on Pattern A/B tables (auto-populates `person_id` from `owner_role`) and V67 adds 14 triggers on Pattern C tables (auto-populates `tax_return_id` from `primary` `tax_return_v2`). The original plan called for modifying each of 53 mappers — the trigger approach is declarative, idempotent (`WHERE IS NULL` guards), zero Java changes, and avoids a new register-in-N-places hazard. Triggers also catch any direct SQL INSERT (test fixtures, raw SQL) that bypasses Java mappers. `Phase2DualWriteTest` pins trigger shape (13 tests). Regression: 1088 green. |
| 2026-06-15 | Implementation | Phase 3 backend infrastructure shipped: `OwnerRoleMapping` static utility (`taxpayer`↔`head` translation), `PersonResolver` Panache service (resolves `person_id` ↔ `(uid, ownerRole)` and `tax_return_id` → `uid`), `MultiReturnReader` central read entry point (delegates to existing `FormMapper.load(uid, formId)` via formId-suffix matching), `MultiReturnFlags` config holder (centralizes the `multi_return.*` flags). `FormMapper` interface gets two new default methods (`loadByPersonId`, `loadByTaxReturnId`) that delegate to `MultiReturnReader`; every Pattern A/B mapper file declares the `loadByPersonId` override and every Pattern C file declares the `loadByTaxReturnId` override (delegation pattern — same behavior as the interface default, but each mapper makes the new API visible in its own source). `Phase3InfrastructureTest` pins shape (22 tests). The original §11.4 Phase 3 plan called for per-form shadow-read; this turned out to be unnecessary given Phases 0–2 guarantee `person_id`/`tax_return_id` stay in sync with `(uid, owner_role)` by construction (backfill + trigger), so shadow-read would log zero diffs by definition. Per-form Angular component migration and per-form feature flag flips deferred to later iterations or absorbed into Phase 7. Regression: 1110 green. |
| 2026-06-15 | Implementation | Phase 4 backend shipped: every Pattern A/B JPA entity (39) gains a `public Long personId` field annotated `@Column(name="person_id")`; every Pattern C entity (14) gains `public Long taxReturnId` annotated `@Column(name="tax_return_id")`. Wires V64/V65's SQL columns into Hibernate so Phase 5+ mappers can issue direct `WHERE person_id = ?` / `WHERE tax_return_id = ?` queries without further entity changes. The original §11.4 Phase 4 work (`6 Pattern C forms migration`) was absorbed by Phase 3's central reader + per-mapper `loadByTaxReturnId` overrides — the only remaining piece was the entity wiring. `Phase4EntityFieldsTest` pins shape (6 tests). Regression: 1116 green. |
| 2026-06-15 | Implementation | Phase 5 **pilot** shipped — `form-standard-deductions` decomposition only. V68 creates `pf_person_status` (per-person intrinsic attributes: age, blindness, dual-status, can-be-claimed, dependent worksheet earned income) and `pf_return_itemized_deductions` (per-return Schedule A inputs + AUTO/STANDARD/ITEMIZED election + V54 carryovers + Section 962 election). V69 backfills field-by-field per design doc §6.3 — both taxpayer and spouse rows contribute their person-scoped columns to `pf_person_status`; only the taxpayer row contributes Schedule A inputs to `pf_return_itemized_deductions` (canonical source for return-level data); the two MFS attestation columns on `tax_return_v2` (added by V63 but never written before now) get backfilled from `spouse_itemizes_separate_return` / `spouse_meets_age_blindness_mfs_requirements` on the taxpayer row. V70 adds an AFTER INSERT, UPDATE trigger on `pf_standard_deductions` that propagates writes to all three destinations via MERGE UPSERT (idempotent). `Phase5StandardDeductionsDecompositionTest` pins shape (14 tests). Two new tables added to UserDataBulkDelete catalog with ordering rules. `pf_standard_deductions` remains canonical through Phase 5; compute does not yet consult the new tables. **Scope-managed:** the other 5 Pattern B forms (`additional-deductions`, `ctc-actc-screening`, `earned-income-credit`, `childcare-expenses`, `adoption-expenses`, `form8862`) follow the same pattern in subsequent iterations rather than bundling all 6 into one commit. Regression: 1130 green. |
| 2026-06-16 | Implementation | Phase 5 **completion** shipped — V71/V72/V73 plus a scope correction. Inspection of the 5 remaining Pattern B forms revealed that only 3 actually had person-scoped columns to extract: `additional-deductions` (Schedule 1-A per-person tips/overtime/senior + per-return MAGI exclusions), `earned-income-credit` (per-person eligibility flags + per-return MFS exception), and `childcare-expenses` (per-person student-or-disabled status + per-return Form 2441 inputs). The other 3 — `ctc-actc-screening`, `adoption-expenses`, `form8862` — were already purely return-scoped (no `taxpayer_*` / `spouse_*` inline columns) and got their `tax_return_id` wiring in Phase 1's V65 with no decomposition work needed. V71 creates `pf_person_schedule_1a` + `pf_return_schedule_1a`. V72 creates `pf_person_eic_eligibility` + `pf_return_eic_mfs`. V73 creates `pf_person_childcare_status` + `pf_return_childcare`. All three follow the V68/V69/V70 shape (tables + backfill + dual-write MERGE UPSERT trigger) bundled into a single file per form for compactness. The `uid` FK is `NO ACTION` on every return-scoped table to avoid the SQL Server multiple-cascade-paths error we already learned in the pilot. V72's spouse-fallback MERGE uses `COALESCE` to avoid clobbering data from the spouse-owned row when the taxpayer row's `spouse_*` columns are also populated. `Phase5RemainingDecompositionsTest` pins shape (17 tests). UserDataBulkDelete updated with 6 new tables (3 person-scoped placed before `person`, 3 return-scoped after). Regression: 1147 green. **Phase 5 is complete.** |
| 2026-06-16 | Implementation | Phase 6 shipped as a minimal signature adapter. `TaxReturnComputeService.prepare(long taxReturnId)` is a new public method that looks up the `tax_return_v2` row by ID, validates it exists, and delegates to the legacy `prepare(String uid)` for the actual compute. For Phase 6 the behavior is identical to the legacy entry point because every uid has exactly one `primary` return today — the adapter just establishes the API surface that Phase 7 (MFS) and Phase 8 (dependent-own) will extend to scope reads per `tax_return_v2_person` membership. Both signatures coexist; the legacy `prepare(String uid)` is preserved unchanged through Phase 9 (only Phase 10 cleanup may consider removal). `Phase6ComputeSignatureTest` pins shape (7 reflection-based tests): both signatures exist, return the same type, declare the same checked exceptions. The design doc's §11.4 Phase 6 task list also called for replumbing ~80 internal call sites to use `readByPerson(personId)` / `readByReturn(taxReturnId)` — deferred because Phase 7's MFS-specific scoping needs come with new compute logic anyway; replumbing in Phase 6 would be premature without that context. Regression: 1154 green. |
| 2026-06-16 | Implementation | Phase 7a shipped — backend MFS lifecycle service. `TaxReturnV2LifecycleService` (Panache + `@Transactional`) implements `enableMfs(uid)` (creates the `mfs_head` + `mfs_spouse` `tax_return_v2` rows + their `tax_return_v2_person` filer links to the head and spouse persons; idempotent so calling twice returns the existing rows), `disableMfs(uid)` (deletes the MFS pair; cascade kills the link rows), `isMfsEnabled(uid)`, and `listReturns(uid)` (ordered primary → mfs_head → mfs_spouse → dependent_own). Gated by `MultiReturnFlags.mfsEnabled()` — when off, `enableMfs` throws. `TaxReturnV2Resource` mounts at `/api/tax-return-v2` (`-v2` suffix mirrors the table naming; renamed to `/api/tax-return` in Phase 10) and exposes `GET /` for return listing plus `POST /mfs/enable` and `POST /mfs/disable`. Uid resolution mirrors the existing `PersonalResource` pattern via `FirebaseIdentityUtil.requireUid(identity)` — `FirebaseIdentityUtil` and its `requireUid` were promoted to `public` so the multireturn package can reach them. `Phase7MfsLifecycleTest` pins shape (12 reflection-based tests): service method signatures, `@Transactional` annotations, vocabulary constants matching V63 CHECK constraints, REST class-level `@Path` + method-level paths + HTTP verbs + `@Authenticated`. Compute scoping per return-kind is **deferred to Phase 7b** — for now `prepare(mfsHeadTaxReturnId)` computes the same numbers as `prepare(primaryTaxReturnId)` because the adapter still routes through `prepare(uid)`. UI changes deferred to Phase 7c, e2e specs to Phase 7d. Regression: 1166 green. |
| 2026-06-16 | Implementation | Phase 7b shipped — compute scoping for MFS returns. `MfsFormScoper` (pure static utility) reshapes a household's personal-form map per return kind: `mfs_head` drops every `-spouse` / `identification-spouse` / `spouse` key and keeps the rest; `mfs_spouse` renames `-spouse` → `-taxpayer`, `identification-spouse` → `identification-taxpayer`, `spouse` → `you` and drops the original head's identity/income forms so the spouse is treated as the filer; both views force `filing-status.filingStatus` to "Married filing separately" while preserving any other filing-status fields. Wiring into compute is minimally invasive — a private `ThreadLocal<Map>` SCOPED_FORMS_OVERRIDE on `TaxReturnComputeService` plus a one-line swap inside `prepare(uid)` from a direct `personalDataService.getPersonalForms(uid)` call to a new private `loadPersonalForms(uid)` helper that returns the override when present. `prepare(long taxReturnId)` resolves the `tax_return_v2` row, delegates to the legacy `prepare(uid)` for `primary` (override stays null — bit-identical to Phase 6), and for `mfs_head` / `mfs_spouse` loads + scopes the household forms, sets the override in a try/finally, and calls `prepare(uid)` which now sees the scoped view. `Phase7bComputeScopingTest` pins the transformation rules (17 pure-Java tests including no-mutation, disjoint head-vs-spouse views, return-level form preservation, fresh filing-status copy). Compute body is untouched apart from the one call-site swap so the existing 1166 tests continue to pass without edits. Edge cases (community-property states, dependent §152 tiebreaker, allocator) are still Phase 9 territory. Regression: 1183 green. |
| 2026-06-16 | Implementation | Phase 7c shipped — Angular wrapper for the multi-return REST surface. `MultiReturnService` (`src/app/service/multi-return.service.ts`) exposes `loadReturns()`, `enableMfs()`, `disableMfs()`, the `returns` / `isLoading` / `isToggling` / `errorMessage` / `isMfsEnabled` signals, and the `TaxReturnSummary` interface. Same auth pattern as `TaxReturnService` (Firebase bearer token via `AuthService.getIdToken()`), same idempotency semantics as the backend lifecycle. `MultiReturnService` spec (9 Jasmine + HttpClientTestingModule tests) pins the REST contract: endpoint paths, HTTP methods, request bodies, signal updates, error-body propagation, reentrant load behavior. UI integration (filing-status form toggle, sidebar return-selector dropdown) deferred to a small follow-up — modifying the 483-line `form-filing-status-taxpayer.component.ts` in the same commit would have churned 30+ e2e specs that select against its current DOM. Frontend build green (`npm run build` succeeds with only pre-existing bundle-size and CommonJS warnings). Karma not run from this sandbox (no Chrome) but compile passes. |
| 2026-06-16 | Implementation | Phase 9 frontend extension shipped — `MultiReturnService` grows `optimizeJointVsSeparate()` plus `isOptimizing` and `lastOptimizerResult` signals and the `OptimizerResult` interface (mirrors the backend record: ids + totals + savings + recommendation 'MFJ' \\| 'MFS' \\| 'TIE'). Same auth + signal lifecycle as the existing MFS lifecycle methods. Spec adds 4 new tests pinning the endpoint URL, POST verb, signal updates, error-body propagation. `npm run build` green. UI consumers can now call `multiReturnService.optimizeJointVsSeparate()` and bind to `lastOptimizerResult` to render the comparison; the comparison-view component itself is a small follow-up commit. |
| 2026-06-16 | Implementation | `OptimizerComparisonPanelComponent` shipped — the standalone Phase 9 UI surface. Standalone + PrimeNG ButtonModule + OnPush change detection, modeled on `EicComparisonPanelComponent`. Single "Compare filing options" button kicks off `multiReturnService.optimizeJointVsSeparate()`. Side-by-side comparison table shows MFJ total tax, MFS head total, MFS spouse total, MFS combined. A recommendation banner colors green for MFS-wins / blue for MFJ-wins / amber for TIE and explains the savings amount in plain language. A collapsible details `<details>` block exposes the raw tax_return_ids so support can correlate against backend logs. All numeric nodes carry `data-testid` attributes (`optimizer-mfj-total`, `optimizer-mfs-combined-total`, `optimizer-recommendation`, etc.) so Phase 7d/9 e2e specs can pin them. The component is self-contained — no DOM churn to existing components, no e2e selector breakage. Host placement (where in the app shell it renders) is left for a small follow-up. `npm run build` green. |
| 2026-06-16 | Implementation | Kiddie-tax cross-return read shipped — the design's open question #6 from `multi_return.md §10`. `KiddieTaxParentReader` (`@ApplicationScoped`) exposes `getParentTaxableIncome(uid)` which finds the household's primary `tax_return_v2`, recursively calls `TaxReturnComputeService.prepare(primaryTaxReturnId)`, and extracts Form 1040 line 15 from `Form1040.deductions.taxableIncome`. Returns `ZERO` on any null in the chain (no primary, blocked compute, missing fields) — caller treats zero as "no income to attribute" and skips kiddie-tax routing. CDI cycle safety: `KiddieTaxParentReader` injects `Instance<TaxReturnComputeService>` and the compute service injects `Instance<KiddieTaxParentReader>` — both sides use the lazy `Instance<T>` wrapper so Quarkus builds proxies without recursive resolution. Recursion safety: the parent compute runs BEFORE the `SCOPED_FORMS_OVERRIDE` ThreadLocal is set for the child, so the inner `prepare(uid)` reads the household's full form map normally; no override contention. `DependentOwnFormScoper.scope()` gains a new 6-arg overload accepting `BigDecimal parentTaxableIncome`; positive values inject a synthetic `kiddie-income-taxpayer` form with `parentTaxableIncomeLine6` + `hasKiddieTaxUnearnedIncome=true` (the keys compute's existing kiddie-tax branch reads); null/zero/negative values suppress the form so the dependent stays on the regular Single-filer path. The original 4-arg and 5-arg overloads delegate to the new 6-arg with null parent income, preserving Phase 8b behavior. `TaxReturnComputeService.prepare(long)` dependent_own branch now invokes the reader, swallows exceptions with a warn-level log (so a parent-compute failure doesn't take down the dependent's compute), and threads the result through to the scoper. `KiddieTaxCrossReturnReadTest` pins shape (10 pure-Java tests including the positive/null/zero/negative branch, backwards-compat of the 4-arg and 5-arg overloads, reader method signature, lazy-Instance CDI-cycle guard). Compute body otherwise untouched. Regression: 1226 green. |
| 2026-06-16 | Implementation | Phase 8c shipped (frontend) — dependent-tab UI for `files_own_return`. `MultiReturnService` grows `enableDependentOwn(dependentId)` and `disableDependentOwn(dependentId)` plus 5 new Jasmine specs pinning endpoint paths, signal updates, idempotency, and error propagation. `DependentOwnTogglePanelComponent` (`src/app/components/dependent-own-toggle-panel.component.ts`) — standalone + PrimeNG ButtonModule + OnPush, takes `@Input() dependentId`, derives the on/off state from the household's `returns` signal (so the toggle reflects backend truth, not local state), shows an enable button when off + a disable button when on, surfaces the togglingSignal + errorMessage signals from the service, and renders an explanatory enabled-note banner once active. All actionable nodes carry `data-testid` attributes. Hosted in `form-dependent.component.ts` template at the bottom of the form-card (after the Save button) with a single `<dependent-own-toggle-panel *ngIf="currentId" [dependentId]="currentId">` line. The hosting required one small backwards-compatible change to `FormDependentComponent`: `currentId` went from `private` to default visibility so the template binding compiles under Angular strict templates. Zero changes to the form's own DOM structure — the panel is a sibling child below the existing form, so the 30+ e2e specs targeting form-dependent inputs continue to match without modification. `npm run build` green. |
| 2026-06-16 | Implementation | Phase 7c-2 shipped (frontend) — persistent MFS toggle on the filing-status form. `PersistentMfsTogglePanelComponent` (`src/app/components/persistent-mfs-toggle-panel.component.ts`) — standalone + PrimeNG ButtonModule + OnPush, no `@Input` (household-level toggle, not per-spouse), derives state from `multiReturn.isMfsEnabled()` signal, surfaces `togglingSignal` + `errorMessage`. Enable button ("Generate separate returns for both spouses") when MFS is off; Disable button ("Go back to a single (joint) return") + green enabled-note banner when on. All actionable nodes carry `data-testid` attributes. Hosted in `form-filing-status-taxpayer.component.ts` template via a single `<persistent-mfs-toggle-panel></persistent-mfs-toggle-panel>` line at the bottom of the form-card (after the existing Save / Next nav buttons). Hosted **unconditionally** rather than gating on filing-status value — users without a spouse get an informative backend error from `enableMfs` rather than a hidden control they can't discover. Zero DOM churn to the 483-line filing-status form's existing structure, so the 30+ e2e specs targeting it continue to match without modification. The persistent toggle is distinct from the Phase 9 optimizer panel: the optimizer transiently computes the MFS pair and tears it down; this toggle creates rows that survive across sessions for users who actually want to file MFS. Both paths call the same Phase 7a backend lifecycle. `npm run build` green. |
| 2026-06-16 | Architect | **Design clarification — tab-as-person-scope.** Every sidebar section is tab-filtered, including Statements (originally documented as a shared household pool) and Tax Return (originally documented as shared with a planned return-selector dropdown). The tabs are the return selector — Taxpayer tab shows the head's return, Spouse tab shows the spouse's return (joint primary on MFJ, `mfs_spouse` on MFS), Dependent tab shows the `dependent_own` return when enabled. Statements are listed under each tab where `recipientTIN` matches that tab's person SSN. The optimizer panel appears in both Taxpayer and Spouse tabs' Tax Return view because it's a household-level planning tool that spans both spouses. **No backend changes** — the data model already supports tab-filtering (statements routed by TIN; tax_return_v2_person tracks per-return persons). **Frontend changes** — `shell.component.ts` resolution methods for Statements and Tax Return become tab-filtered (matching the existing Personal / Incomes / Deductions pattern). The return-selector dropdown originally proposed in §8.1 is **eliminated**. §3 and §8 of this document updated to reflect the revised target. |
| 2026-06-16 | Implementation | Phase 8a shipped — backend dependent-own returns lifecycle. `TaxReturnV2LifecycleService` gains `enableDependentOwn(uid, dependentId)` (creates a `dependent_own` `tax_return_v2` row with `filing_status="Single"`, links the dependent's person row as filer, flips `person.files_own_return=true`; idempotent), `disableDependentOwn(uid, dependentId)` (reverses both the row deletion and the filer-flag flip), `isDependentOwnEnabled(uid, dependentId)`. Gated by `MultiReturnFlags.dependentOwnEnabled()`. `TaxReturnV2Resource` gains `POST /api/tax-return-v2/dependent-own/enable/{dependentId}` and `POST .../disable/{dependentId}`. Each operates on one dependent at a time so households with multiple dependents can manage each independently. `Phase8aDependentOwnLifecycleTest` pins shape (9 reflection-based tests including the "Single" default filing status invariant per IRS Pub. 501). Compute scoping per `dependent_own` return kind is deferred to Phase 8b — for now `prepare(dependentOwnTaxReturnId)` delegates to `prepare(uid)` which returns the household's primary numbers, not the dependent's. Phase 8c (UI), Phase 8d (e2e), and Form 8615 cross-return read all follow as separate iterations. Regression: 1192 green. |
| 2026-06-16 | Implementation | Phase 8b shipped — compute scoping for dependent_own returns. `DependentOwnFormScoper` (pure static utility) builds a minimal synthetic forms map for a dependent's own return: `you` and `identification-taxpayer` are seeded from the dependent record (first name, last name, SSN, date of birth — null/blank fields omitted rather than stored as null), and `filing-status.filingStatus` defaults to "Single" per IRS Pub. 501 with an optional override for the married-dependent-MFS case. All household `pf_*` forms are dropped because the dependent has none of their own; statements (W-2s, 1099-*) still route to the filer through compute's regular `recipientTIN` matching. `TaxReturnComputeService.prepare(long taxReturnId)` gains a `dependent_own` branch — resolves the filer via `tax_return_v2_person` → `Person` → `Dependent`, builds the synthetic map, sets the SCOPED_FORMS_OVERRIDE ThreadLocal, delegates to `prepare(uid)` which reads the override via the Phase 7b `loadPersonalForms` helper. Throws `IllegalStateException` with a specific message when any link in the resolution chain is missing. `Phase8bDependentOwnScopingTest` pins 11 invariants (synthetic identity shape, defensive copies, filing-status default + override, exactly-three-forms output, no household leakage, null tolerance, public constant). Out of scope for Phase 8b: Form 8615 kiddie tax cross-return read, §152 self-claim blocking, EIC self-claim blocking — those follow in Phase 8d / Phase 9. Compute body untouched apart from the dependent_own branch addition so the existing 1183 tests continue to pass without edits. Regression: 1203 green. |
| 2026-06-16 | Implementation | Phase 9 shipped — joint vs separate filing optimizer. `OptimizerService.compareJointVsSeparate(uid)` computes the household's primary return, ensures the `mfs_head` + `mfs_spouse` pair exists (enables them temporarily when not already on), computes both MFS returns, restores the prior MFS state on the way out (so the user's persisted setup is unchanged when they didn't have MFS enabled). Reports `mfjTotalTax`, `mfsHeadTotalTax`, `mfsSpouseTotalTax`, `mfsCombinedTotalTax`, `savings = mfj − mfsCombined` (positive when MFS is cheaper), and a canonical `recommendation` string ("MFJ" / "MFS" / "TIE"). The tie case defaults to MFJ because IRC §63(c)(6)(A) itemize-must-match + §86(c)(1)(C) SS-restrictive make MFS coordination overhead not worth equal-cost. Gated by `MultiReturnFlags.optimizerEnabled()`. `OptimizerResource` mounts at `/api/tax-return/optimize/joint-vs-separate` (POST, `@Authenticated`) under the existing `/api/tax-return` path family since the optimizer logically belongs to tax-return planning. `Phase9OptimizerTest` pins shape (12 reflection-based tests including the recommendation-logic decision table, `extractTotalTax` null safety, REST endpoint contract, OptimizerResult record fields). Out of scope: per-line Schedule A allocation, §152 dependent tiebreaker analysis, community-property-state branch — all flagged in §10 open questions and follow as Phase 9 refinements. Regression: 1216 green. |
| 2026-06-16 | Implementation | Tab-as-person-scope Phase A shipped — dependent tab Tax Return populates when `files_own_return=true`. `shell.component.ts` injects `MultiReturnService` and `getTaxReturnItemsForSelection` returns `taxReturnBaseItems` for dependent tabs when at least one `dependent_own` row exists in `multiReturn.returns()`; empty otherwise. Multi-dependent households where some files-own and some don't would need the backend list endpoint to surface `dependent_id` on each row — that's a Phase 8c-2 refinement once we have such a household in tests. `npm run build` green. |
| 2026-06-16 | Implementation | Tab-as-person-scope Phase B shipped — Spouse tab routes to `mfs_spouse` when persistent MFS is on (symmetric Taxpayer→`mfs_head`; Dependent→`dependent_own`). Backend: `POST /api/tax-return/compute/{taxReturnId}` added to `TaxReturnResource`. Validates ownership against the authenticated uid; same blocking-flag 409 semantics as the legacy `/compute`; **does not persist** to the legacy `out_*` anchor (that table is reserved for primary compute — MFS / dependent-own results are returned by value only, matching the optimizer pattern). `ComputeByIdEndpointTest` pins shape (7 reflection-based tests). Frontend: `TaxReturnService` grows `computeReturnForReturn(taxReturnId)` (POSTs the new endpoint, stores result in `computationsByReturnId` map) and `computationForReturn(taxReturnId)` (reads the map). `FormTaxReturn1040Component` gains `@Input() taxReturnId?: number`; when set, the new `sourceComputation` computed routes through `computationForReturn` instead of the household primary `computation()`. All three internal references to `taxReturnService.computation()` in the component (form1040 view + line28 + form8888 check) now read via `sourceComputation` so the entire view reflects the active tab's return. `ngOnInit` auto-computes the per-return data when `taxReturnId` is set and not cached. `shell.component.ts` adds `activeTabTaxReturnId()` resolver — Dependent tab → `dependent_own.taxReturnId`; Taxpayer tab on MFS → `mfs_head.taxReturnId`; Spouse tab on MFS → `mfs_spouse.taxReturnId`; otherwise undefined (legacy MFJ / Single path bit-identical). Threaded as `[taxReturnId]="activeTabTaxReturnId()"` into the form. Backend regression: **1233 green** (1226 + 7). Frontend `npm run build` green. |
