# Knowledge: Form 1040 Line 1e — Taxable Dependent Care Benefits (Form 2441 Line 26)

Built from: spec (`lines/1e.md`), dependency map (`dependencies/1e.md`), backend compute service, frontend childcare-expenses component, unit tests, E2E tests, output models, semantic field map.
Last updated: 2026-05-07 (created during 1e.xlsx Code Validation walkthrough — Issues #1–#5 closed; #6–#9 still open).

---

## 1. What is Line 1e?

Form 1040 line 1e reports the **taxable portion of employer-provided dependent care benefits** — exactly Form 2441 line 26. It is the residual of W-2 box 10 (and any DCFSA grace-period / forfeiture adjustments) that fails one of four limits:

| Limit | Mechanism |
|---|---|
| Statutory cap (IRC §129(a)(2)) | $5,000 (most filers) / $2,500 (MFS-no-exception) — `DEPENDENT_CARE_BENEFITS_LIMIT_*` |
| Plan-defined cap | `planMaxExcludable` from the employer's plan documents (when lower than statutory) |
| Earned-income limit (Pub 503) | min(taxpayer earned income, spouse earned income on MFJ); deemed income substitutes when student/disabled |
| Qualified-expense limit | line 16 (qualified expenses incurred this year) |

When **none** of these clip the amount, line 26 = 0 and line 1e is null. When any clip, line 26 captures the disallowed excess.

**§129(d) bypass:** if the employer's plan failed nondiscrimination testing, line 25 (excluded) = 0 and line 26 = line 15 (everything taxable). Highly compensated employee scenario.

**Two-pass architecture:** Form 2441 spans Part III (exclusion, line 1e) and Part II (credit, Schedule 3 line 2). Phase 1 runs in `prepare()` BEFORE AGI; Phase 2 runs after `buildForm1040` produces AGI. See §5.

**"DCB" PDF write-in:** Per IRS instructions, write "DCB" on the dotted line next to line 1e when the amount is positive. Rendered as a free-text overlay (no fillable PDF field exists) — see §6.

---

## 2. Personal Form ID

| Form ID | Role |
|---|---|
| `childcare-expenses` | Single per-return form (NOT per-spouse). Drives Form 2441 Parts I + II + III, line 1e, and Schedule 3 line 2. |

Cross-form integration:
- W-2 statement entries (`users/{uid}/w-2/{entryId}`) for box 10 (`dependentCareBenefitsAmount`) and per-spouse earned income (`wagesTipsOtherCompAmount` filtered by SSN)
- `filing-status` for MFS detection (statutory cap + credit gating)
- `you` / `spouse` for SSN-based W-2 attribution
- `prison-inmate-wages-taxpayer` / `-spouse` for the §21 earned-income carve-out (Pub 503)

---

## 3. Form Sections + YAML Fields — `childcare-expenses`

### `generalQuestions`

| Field | Type | Notes |
|---|---|---|
| `hasCareExpenses` | boolean | "Did you pay for care of a child under 13 / disabled spouse / disabled dependent?" — **NOT currently read by backend** (1e.xlsx Issue #8). Outer gate exists in form schema but is bypassed. |
| `didReceiveDependentCareBenefits` | boolean | HARD gate. When W-2 box 10 > 0 AND not exactly true → emits `DEPENDENT_CARE_BENEFITS_FORM_REQUIRED` (blocking). HARD (not soft) — no auto-fill convenience to preserve. |
| `marriedFilingSeparatelyException` | boolean | IRC §21(e)(2) separation exception. When MFS AND true → treated as unmarried for §21/§129: $5,000 cap + credit allowed. |
| `studentOrDisabledDeemedIncome` | boolean | Taxpayer student/disabled flag. When true → deemed income = $250/mo (1 person) or $500/mo (≥2). |
| `studentOrDisabledMonths` | integer | Months 0–12 (clamped). Deemed amount per month × months. |
| `studentOrDisabledDeemedIncomeSpouse` | boolean | Spouse-side mirror. **Skipped on MFS** since 2026-05-07 (Issue #2). |
| `studentOrDisabledMonthsSpouse` | integer | Spouse months 0–12. |

### `careProviders`

Repeatable list (up to 3 fully captured; rest signaled by `moreThanThreeCareProviders` boolean). Each entry has `providerName`, `providerIdentifyingNumber`, `providerAddress`, `amountPaidToProvider`, `providerHouseholdEmployee`. Drives Form 2441 Part I display only — no compute impact on line 1e.

### `qualifyingPersons`

Repeatable list (up to 3 captured; `moreThanThreeQualifyingPersons` boolean). Each entry has `qualifyingFirstName`, `qualifyingLastName`, `qualifyingSSN`, `qualifiedExpensesForPerson`, `qualifyingOver12AndDisabled`. Drives:
- `countQualifyingPersons()` → tier selection ($3k vs $6k for line 27, $250 vs $500/mo for deemed)
- `sumQualifiedExpenses()` → line 30 (fallback for line 16 when `line16QualifiedExpensesForBenefits` not provided)

### `dependentCareBenefits` (Part III specific)

| Field | Type | Notes |
|---|---|---|
| `alreadyIncludedInBox1Amount` | number | Portion of W-2 box 10 already taxed in box 1. Step 4: `line12 = max(0, totalBenefits − alreadyInBox1)`. |
| `planMaxExcludable` | number | Employer plan max (when lower than IRS cap). Step 12: `line21 = min(statutoryCap, planMax)`. |
| `line13GracePeriodBenefitsUsed` | number | Prior-year DCFSA grace period (2½ months under §125 cafeteria plans). Added to current-year benefits. |
| `line14ForfeitedOrCarriedForward` | number | Forfeited under "use it or lose it"; subtracted from line 12 + line 13. |
| `line16QualifiedExpensesForBenefits` | number | When provided, supersedes `sumQualifiedExpenses()` for line 16. |
| `additionalEarnedIncomeTaxpayer` | number | Non-W-2 earned income (Pub 503 — qualifying disability pay; SE earnings out of scope). Added to taxpayerEarned BEFORE deemed max. |
| `additionalEarnedIncomeSpouse` | number | Spouse-side mirror. **Skipped on MFS** since 2026-05-07. |
| `employerPlanFailed129dTest` | boolean | When true → §129(d) bypass: line25 = 0, line26 = line15 (full amount taxable). |

### `creditComputation` (Part II specific)

| Field | Type | Notes |
|---|---|---|
| `priorYearQualifiedExpensesPaidThisYear` | number | Pub 503 Worksheet A line 9b. **Partial implementation** (1e.xlsx Issue #9) — used directly without prior-year recomputation. |

---

## 4. Backend Compute Logic

Function-name references only (per the 2026-05-06 codification — line numbers drift with refactors). All in `TaxReturnComputeService.java` unless noted.

### Entry points

| Function | Phase | Role |
|---|---|---|
| `computeDependentCareBenefits(childcareData, filingStatus, you, spouse, w2Entries, taxpayerInmateWages, spouseInmateWages, isMfsReturn, flags)` | Phase 1 (in `prepare()`) | Computes Form 2441 Part III + Part II lines 3-6; sets line 1e; defers Part II 7-11 by leaving `line7=null` etc. Returns `DependentCareComputation(line1e, form2441, mfsCreditDisallowed)`. |
| `finalizeForm2441PartII(dependentCare, form1040, schedule3)` | Phase 2 (after `buildForm1040`) | Computes Part II line 7 (AGI), line 8 (applicable %), line 9a/9c, line 10 (tax-liability limit via Credit Limit Worksheet), line 11 (credit). Early-return on `mfsCreditDisallowed`. |
| `applyChildDependentCareCredit(schedule3, dependentCare)` | After Phase 2 | Wires `form2441.line11` → `schedule3.nonrefundableCredits.childDependentCareCredit`. No-ops on null line 11 (so MFS-no-exception cascades to schedule 3 line 2 = null automatically). |

### Helpers

| Function | Role |
|---|---|
| `sumW2DependentCareBenefitsForSsns(w2Entries, ssns...)` | SSN-filtered W-2 box 10 sum (added 2026-05-07 for Issue #2). Replaces unfiltered sum on MFS. |
| `sumW2DependentCareBenefits(w2Entries)` | Legacy unfiltered sum — used only as fallback when neither SSN is populated (test-data / partial-setup scenarios). |
| `sumW2WagesForSsn(w2Entries, ssn)` | Per-SSN box 1 sum (drives `taxpayerEarned` / `spouseEarned`). |
| `dependentCareApplicablePercentage(agi)` | Returns the §21(a)(2) sliding-scale rate: 35% at AGI ≤ $15k; reduce 1% per $2k over (rounded up); floor 20%. Returns null when agi is null (Phase 1 → defers Part II). |
| `countQualifyingPersons(qualifyingPersons)` | Counts entries with at least one populated input. Drives $3k vs $6k tier + $250 vs $500/mo deemed tier. |
| `sumQualifiedExpenses(qualifyingPersons)` | Sum of per-person `qualifiedExpensesForPerson`. Used for line 30 (and as line 16 fallback). |
| `clampMonths(value)` | Bounds 0..12 for student/disabled months. |
| `hasAnyChildcareData(data)` | Triggers Form 2441 instantiation. **Over-broad** (1e.xlsx Issue #6) — any non-empty sub-map. |
| `hasPositiveAmount(amount)` | Trigger for hasBenefits / blocking flags. |

### Compute order (gated by file-name conventions)

```
prepare()
  → isMfsReturn = (filing-status == MFS)
  → computeDependentCareBenefits(..., isMfsReturn, ...)        ← Phase 1
  → buildForm1040(..., dependentCare.line1e(), ...)            ← line 1e enters wages, AGI computed
  → computeLine12 / 13 / 14 / 15 / 16 / 17 / 18                ← totalTaxBeforeCredits available
  → finalizeForm2441PartII(dependentCare, form1040, schedule3) ← Phase 2 (gated by mfsCreditDisallowed)
  → applyChildDependentCareCredit(schedule3, dependentCare)    ← cascades on null line 11
```

### MFS gating cascade (Issues #1 + #2)

| Boolean | Source | Effect |
|---|---|---|
| `isMfsReturn` | derived in `prepare()` from `filing-status` | Single source of truth; passed into `computeTips`, `computeMedicaidWaiverPayments`, `computeDependentCareBenefits`, `sumHouseholdEmployeeWages` |
| `isMfs` (inside `computeDependentCareBenefits`) | derived inline from filingStatus param | Drives statutory cap branch |
| `mfsException` | from `generalQuestions.marriedFilingSeparatelyException` | Drives the cap upgrade ($2,500 → $5,000) when separation exception met |
| `mfsCreditDisallowed` | `isMfs && !mfsException`, stored on `DependentCareComputation` | Skips Part II finalization (Issue #1) |

### Blocking flags inventory

| Flag | Trigger |
|---|---|
| `DEPENDENT_CARE_BENEFITS_FORM_REQUIRED` | W-2 box 10 > 0 AND `didReceiveDependentCareBenefits != true` |

Single blocking flag — most data-quality issues silently default to safe values. See `1e.xlsx` Validation Flags sheet for the silent-skip table.

---

## 5. Two-Pass Architecture

The defining feature of line 1e. Form 2441 spans an exclusion (Part III) AND a credit (Part II); the credit needs AGI which doesn't exist until after lines 1–11 run.

### Phase 1 — `computeDependentCareBenefits`

Runs in `prepare()` BEFORE the income aggregation. Computes:
- Part III lines 12–31 (full)
- Part II lines 3–6 (qualified-expenses pool, earned income, line-3-limited)
- Part II lines 7, 8, 9a, 9b, 9c, 10, 11 = **null** (deferred — AGI not available)

Returns `DependentCareComputation(line1e, form2441, mfsCreditDisallowed)`. Line 1e flows into `buildForm1040` immediately.

### Phase 2 — `finalizeForm2441PartII`

Runs AFTER `buildForm1040` (AGI computed) AND AFTER `computeLine16-18` (`totalTaxBeforeCredits` available). Computes:
- Line 7 = AGI
- Line 8 = `dependentCareApplicablePercentage(agi)`
- Line 9a = line 6 × line 8
- Line 9c = 9a + 9b
- Line 10 = `totalTaxBeforeCredits − Σ prior Schedule 3 nonrefundable credits` (Credit Limit Worksheet, excluding child-dependent-care-credit itself)
- Line 11 = min(9c, 10)

Phase 2 is GATED by `mfsCreditDisallowed` (Issue #1). When true → entire Phase 2 skipped, lines 7–11 stay null.

### Phase 3 — `applyChildDependentCareCredit`

Wires `form2441.line11` → `schedule3.nonrefundableCredits.childDependentCareCredit`. No-ops on null. So MFS-no-exception cascades automatically (Phase 2 leaves line 11 null → schedule 3 line 2 stays null).

### Order constraints

The Phase 2 Credit Limit Worksheet (line 10) must run AFTER FTC + Form 8880 + Form 8863 LLC because those are in the "prior Schedule 3 nonrefundable credits" sum. See `sumSchedule3NonrefundableCreditsExcluding5695` for the exact set.

---

## 6. Schedule 3 Line 2 Wire-Up

```
Schedule 3.nonrefundableCredits.childDependentCareCredit  =  Form 2441 line 11  (rounded)
```

Set by `applyChildDependentCareCredit` only when `form2441.line11 > 0`. When null (MFS-no-exception, or Phase 2 skipped for any reason), Schedule 3 line 2 stays null.

Schedule 3 line 2 → Schedule 3 total nonrefundable → Form 1040 line 20 → line 22 (reduces tax).

### "DCB" PDF overlay (added 2026-05-07, Issue #3)

The IRS form has no fillable PDF field for the "DCB" write-in label next to line 1e. Rendered via the new generic `extraTextOverlays` mechanism on `<app-pdf-readonly-preview>`:

```typescript
// form-tax-return-1040.component.ts → buildExtraTextOverlays()
if (Number(dcb) > 0) {
  overlays.push({ page: 1, x: 475, y: 284, text: 'DCB', size: 9 });
}
```

Generic — future write-in labels (line 8z type, line 1h other earned income type) can reuse the same input.

---

## 7. Frontend Forms

### `form-childcare-expenses.component.ts`

Single component — NOT per-spouse. Restructured 2026-05-21 into a 5-section layout:

1. **Screening** — `hasCareExpenses` gate.
2. **People you cared for** — qualifying-person rows with the new dependent picker (lists dependents from `/api/personal/dependents`, computes age at year-end, shows "Under 13" / "Over 12 — verify disability" badge; clicking "Add as person you cared for" pre-fills first name, last name, SSN, and sets the disability flag to No when under 13).
3. **Care providers** — provider rows. SSN/EIN field uses the `appTin` directive (`appTin="any"`) for formatting, plus `autocomplete="off"` and `data-1p-ignore="true"`. Qualifying-person SSN uses `appTin="individual"`.
4. **Employer-provided benefits** — visible when W-2 Box 10 > 0 or explicit Yes. Includes the W-2 attribution panel showing per-W-2 employer name + Box 10 amount + recipient label ("You" / "Spouse" / "Unknown" based on SSN match against household identification forms). Primary Part III questions only (alreadyInBox1, line 13 grace period, line 14 forfeiture). MFS separation exception shown inline when filing status is MFS.
5. **Less common situations** — collapsible. Houses deemed income (taxpayer + spouse on MFJ), prior-year care expenses paid in 2025 (line 9b), plan max excludable, line 16 expenses override, additional earned income not on W-2, and the §129(d) nondiscrimination failure question. Auto-expands on load when any of these fields are already populated.

Section headers drop the IRS Form 2441 part structure (`(Part I)` / `(Part II)` / `(Part III)` suffixes were removed). Plain-English label rewrites applied to the MFS exception question, the §129(d) nondiscrimination question, the forfeited-benefits label (dropped "rolled over" wording — Dependent Care FSAs only have grace periods, not true carryovers), and the over-12-and-disabled question (added explicit help text reminding users that children under 13 should answer No).

### Sidebar entry

| Section | Sidebar label | Form ID |
|---|---|---|
| Personal | Childcare expenses | `childcare-expenses` |

### PDF export

- Form 2441 itself (`f2441`) renders via the standard tax-return PDF templates when Form 2441 is generated.
- Form 1040 line 1e amount renders via `line1e_taxable_dependent_care_benefits` field.
- Form 1040 "DCB" write-in renders via the `extraTextOverlays` overlay (see §6 / Issue #3).

---

## 8. Unit + E2E Test Coverage (refreshed 2026-05-07)

### Unit tests — `TaxReturnComputeServiceTest.java` — **14 dedicated tests**

| Test | Branch covered |
|---|---|
| `computesDependentCareBenefitsLine1e` | Happy path — MFJ, both spouses with W-2 box 10, line26 > 0 |
| `computesDependentCareDeemedIncomeAndCreditLimits` | Student/disabled deemed income path |
| `computesMfsWithSeparationExceptionUsesFiveThousandCap` | MFS WITH separation exception → $5,000 cap |
| `computesBox1DeductionReducesLine12` | `alreadyIncludedInBox1Amount` carve-out |
| `computesPlanMaxCapLine21` | Plan max cap (existing, narrower) |
| `computesNondiscriminationTestFailureMakesFullyTaxable` | §129(d) bypass — line25=0, line26=line15 |
| `computesPartIICreditFinalizesAfterAgi` | Phase 2 happy path — credit > 0 with positive expenses |
| `computesPartIICreditNotAllowedOnMfsWithoutException` | Issue #1 lock-in — IRC §21(e)(2); line11 null + Schedule 3 line 2 null |
| `computesPartIICreditAllowedOnMfsWithSeparationException` | Issue #1 sanity — separation exception → credit allowed |
| `mfsExcludesSpouseW2Box10FromLine1e` | Issue #2 lock-in — SSN filter excludes spouse W-2 box 10 on MFS |
| `computesMfsWithoutExceptionCapsExclusionAtTwoFiveHundred` | Issue #4(a) — MFS-no-exception $2,500 cap (clean, single W-2) |
| `computesPlanMaxLimitsExclusionBelowStatutory` | Issue #4(b) — `line21 = min(planMax, statutoryCap)` |
| `computesZeroEarnedIncomeMakesAllBenefitsTaxable` | Issue #4(d) — earned income floor → all benefits taxable |
| `computesTwoQualifyingPersonsUsesSixThousandExpenseLimit` | Issue #4(f) — line27 = $6,000 with ≥2 qualifying persons |

### E2E tests — `e2e/tests/line1e-dependent-care.spec.ts` — **11 tests**

| Test | Scenario |
|---|---|
| `basic taxable benefits flow to line 1e` | Happy path |
| `line 16 falls back to qualifying person expenses` | line30 fallback for line16 |
| `MFJ spouse earned income limit reduces exclusion` | line19 earned-income cap |
| `MFS statutory limit caps exclusion at 2500` | MFS-no-exception cap (E2E) |
| `MFS with separation exception applies 5000 cap` | MFS-with-exception (E2E) |
| `carryover and forfeiture adjust taxable benefits` | line13/line14 mechanics |
| `multiple W-2 entries aggregate box 10 totals` | MFJ aggregation |
| `Form 2441 shows deemed income and Part II/III credit lines` | Deemed income visible on PDF |
| `box 1 deduction reduces line 12 and clears taxable benefits` | alreadyInBox1 carve-out (E2E) |
| `plan max cap limits exclusion below statutory cap` | planMaxExcludable (E2E) |
| `§129(d) nondiscrimination failure makes full amount taxable` | §129(d) bypass (E2E) |
| `Part II credit computed after two-pass AGI finalization` | Phase 2 (E2E) |

**Untested at the E2E layer:** SSN filter (covered by unit test); MFS-no-exception credit blocking (Issue #1 — could add later).

---

## 9. Known Implementation Gaps

See `outstanding.md` for tracked items. Summary of OPEN items from the 1e.xlsx audit (as of 2026-05-07):

| Issue | Type | Severity | Status |
|---|---|---|---|
| #6 — `hasAnyChildcareData` over-broad (single Boolean answer triggers full Form 2441) | Backend | LOW | OPEN — pending walkthrough |
| #7 — No advisory when spouse earned income = 0 on MFJ (UX trap) | Backend + UX | LOW | OPEN — pending walkthrough |
| #8 — `hasCareExpenses` outer gate not read by backend | Backend + UI dual-layer | MEDIUM | OPEN — pending walkthrough |
| #9 — Worksheet A line 9b partial (no prior-year recomputation) | Backend | LOW | OPEN — already deferred in `dependencies/1e.md` |

**Closed items (from this audit):**
- #1 — MFS-no-exception credit gate (closed 2026-05-07; `mfsCreditDisallowed` boolean on `DependentCareComputation` record)
- #2 — SSN-filter on W-2 box 10 sum (closed 2026-05-07; `sumW2DependentCareBenefitsForSsns` helper + `isMfsReturn` parameter)
- #3 — "DCB" write-in PDF label (closed 2026-05-07; generic `extraTextOverlays` mechanism)
- #4 — Test coverage gaps (closed 2026-05-07; +4 unit tests; (e) deferred to Issue #8 closure)
- #5 — This knowledge file (closed 2026-05-07)

---

## 10. Key Constants

All in `ReferenceData.java` unless noted:

| Constant | Value | IRC reference |
|---|---|---|
| `DEPENDENT_CARE_BENEFITS_LIMIT_OTHER` | $5,000 | IRC §129(a)(2)(A) |
| `DEPENDENT_CARE_BENEFITS_LIMIT_MFS` | $2,500 | IRC §129(a)(2)(A) |
| `DEPENDENT_CARE_EXPENSE_LIMIT_ONE` | $3,000 | IRC §21(c) |
| `DEPENDENT_CARE_EXPENSE_LIMIT_TWO_OR_MORE` | $6,000 | IRC §21(c) |

Hard-coded inside `computeDependentCareBenefits` / `dependentCareApplicablePercentage`:

| Constant | Value | Notes |
|---|---|---|
| Deemed income (1 person) | $250/month | Pub 503 / IRC §21(d)(2) |
| Deemed income (≥2 persons) | $500/month | Pub 503 / IRC §21(d)(2) |
| Months clamp | 0–12 | calendar year; `clampMonths()` |
| Applicable percentage table | 35% at AGI ≤ $15k; reduce 1% per $2k over (rounded up); floor 20% | IRC §21(a)(2) |
| Applicable percentage AGI threshold | $15,000 | IRC §21(a)(2) |
| Applicable percentage AGI step | $2,000 | IRC §21(a)(2) |
| Applicable percentage floor | 20% | IRC §21(a)(2) |

Statutory references (rules, not configurable constants):
- IRS Pub 503 (Child and Dependent Care Expenses) — definitive earned-income carve-outs and deemed-income mechanics
- IRC §21 — dependent care credit (Part II)
- IRC §21(e)(2) — MFS joint-filing requirement + separation exception
- IRC §129 — employer-provided dependent care assistance exclusion (Part III)
- IRC §129(d) — nondiscrimination test (the §129(d) bypass branch)
- IRC §125 — cafeteria plans (DCFSA grace period authority)
- IRS Notice 2020-29 — DCFSA pandemic-era grace-period guidance (general DCFSA rules)

---

## Verification log

- **2026-05-07** — 1e.xlsx Code Validation walkthrough through Issue #5 (Issues #1–#5 closed; #6–#9 open):
  - **Issue #1** (MFS-no-exception credit not blocked — IRC §21(e)(2)): Added `boolean mfsCreditDisallowed` field to `DependentCareComputation` record; Phase 1 sets it via `isMfs && !mfsException`; `finalizeForm2441PartII` early-returns on true; `applyChildDependentCareCredit` no-op on null cascade preserves Schedule 3 wire-up gating. Tests: `computesPartIICreditNotAllowedOnMfsWithoutException`, `computesPartIICreditAllowedOnMfsWithSeparationException`. Net +2 tests.
  - **Issue #2** (SSN filter on W-2 box 10 sum): New helper `sumW2DependentCareBenefitsForSsns(w2Entries, ssns...)`; `computeDependentCareBenefits` now takes `boolean isMfsReturn` and SSN-filters; spouse-side defensive reads (spouseSsn, spouseEarned, spouseInmateWages, additionalEarnedSpouse, deemedSpouse) gated on isMfsReturn — single-guard cascade matching line 1c/1d. Falls back to legacy unfiltered sum when neither SSN is populated. Test: `mfsExcludesSpouseW2Box10FromLine1e`. Net +1 test.
  - **Issue #3** (DCB write-in PDF label): Generic `extraTextOverlays` input on `<app-pdf-readonly-preview>` (`ExtraTextOverlay` interface exported); `applyExtraOverlays` runs after `applyValues` in `buildFilledPdf` (so both preview render and "Save as PDF" pick up overlays); disabled in debug mode. Form 1040 component populates a single `{ page: 1, x: 475, y: 284, text: 'DCB', size: 9 }` overlay when `dependentCareBenefits > 0`. Visual placement may need nudging post-deploy. Mechanism reusable for future write-ins.
  - **Issue #4** (Test coverage gaps): Added 4 new unit tests — MFS-no-exception cap (clean), planMax<statutory, zero-earned-income, ≥2 qualifying persons → $6k limit. Total +4 tests; cumulative line 1e unit-test count = 14. (e) hasCareExpenses outer-gate test deferred to Issue #8 closure.
  - **Issue #5** (Knowledge file missing): Created this file mirroring `knowledge/line-1d-medicaid-waiver-payments.md` structure — function-name convention applied throughout per 1c.xlsx Issue #9. 11 sections + verification log.
- Backend test count: 680/680 passing as of 2026-05-07 (was 671 before Issue #1; +9 net = +2 (#1) +1 (#2) +0 (#3) +4 (#4) +0 (#5) plus +2 medicaid-waiver auto-set Issue #4 from line 1d closure carried over).
