# Knowledge: Form 1040 Lines 6a / 6b / 6c / 6d — Social Security Benefits

Tax year: **2025**
Last updated: **2026-04-15**

---

## 1. Line Identities

| Line | Description |
|---|---|
| **6a** | Total net Social Security benefits (box 5 totals from SSA-1099 and RRB-1099) |
| **6b** | Taxable amount (worksheet result, capped at 85% of line 6a) |
| **6c** | Checkbox — lump-sum election method elected |
| **6d** | Checkbox — married filing separately and lived apart from spouse all year |

---

## 2. Statement Types Consumed

| Statement | Firestore collection | Attribution field | Line 6a field used |
|---|---|---|---|
| SSA-1099 | `users/{uid}/ssa-1099` | `beneficiarySSN` (matched to taxpayer/spouse SSN) | `netBenefitsAmount` (box 5 net benefits) |
| RRB-1099 | `users/{uid}/rrb-1099` | `recipientIdNumber` (matched to taxpayer/spouse SSN) | `netSSEBAmount` (SSEB-only portion; tier 1 equivalent) |

**Excluded from line 6:**
- SSI (`hasSupplementalSecurityIncome == true` → `supplementalSecurityIncomeAmount` subtracted from gross)
- Non-SSEB railroad amounts (tier 2, non-SSEB tier 1) → Pub. 575 / pension workflow
- One-time SSA/RRB lump-sum death benefit

---

## 3. Personal Forms

| Form ID | Firestore path | Scope | Key fields |
|---|---|---|---|
| `social-security-benefits-taxpayer` | `users/{uid}/social-security-benefits-taxpayer` | Taxpayer | All gating + return-level facts (6c/6d) |
| `social-security-benefits-spouse` | `users/{uid}/social-security-benefits-spouse` | Spouse (MFJ only) | `hadSocialSecurityBenefits`, `hasSupplementalSecurityIncome`, `supplementalSecurityIncomeAmount` |

### Taxpayer Form Fields

**Screening:**
- `hadSocialSecurityBenefits` — gate for entire workflow

**Statement upload check:**
- `hasUploadedAtLeastOneSsaOrRrbStatement`
- `receivedSsa1099`, `uploadedSsa1099`
- `receivedRrb1099`, `uploadedRrb1099`
- `confirmAllReceivedSsaRrbStatementsUploaded`

**SSI exclusion:**
- `hasSupplementalSecurityIncome`
- `supplementalSecurityIncomeAmount`

**Line 6d facts:**
- `livedWithSpouseAnyTimeDuringTaxYear`
- `livedApartFromSpouseEntireTaxYear`

**Lump-sum election:**
- `hasLumpSumBackPaymentForPriorYears`
- `electsLumpSumElectionMethod`
- `hasLumpSumAllocationByYear`
- `lumpSumDetails` — repeating list: `owner`, `priorTaxYear`, `lumpSumAllocatedToPriorYear`, `priorYearTaxableBenefitsPreviouslyReported` (+ other prior-year inputs)

**Worksheet manual overrides:**
- `manualCapitalGainLossLine7a` — fallback when capital gain/loss not computed
- `manualOtherIncomeLine8` — fallback when line 8 not computed
- `importedReturnWorksheetLine3IncomeTotal` — override for worksheet line 3
- `importedReturnWorksheetLine4TaxExemptInterest` — override for worksheet line 4
- `importedReturnWorksheetLine6AdjustmentsTotal` — override for worksheet line 6 (Schedule 1 adjustments; defaults to 0 when absent)

---

## 4. Compute Flow: `computeSocialSecurityBenefits()`

Location: `TaxReturnComputeService.java` ~line 7136

### Step 1 — Gating

```
if !taxpayerHadBenefits && !spouseHadBenefits:
    return null
validateSocialSecurityStatementGating() → emit blocking flags if needed
```

### Step 2 — Gross benefit per person (`computeSocialSecurityForPerson()` ~line 7319)

```
for each SSA-1099 entry:
    if belongsToPersonSsa1099(entry, ssn): grossBenefits += netBenefitsAmount

for each RRB-1099 entry:
    if belongsToPersonRrb1099(entry, ssn): grossBenefits += netSSEBAmount

if hasSupplementalSecurityIncome:
    grossBenefits -= supplementalSecurityIncomeAmount   // SSI exclusion

SocialSecurityPersonTotals.grossBenefits = roundMoney(grossBenefits)
```

### Step 3 — Aggregate line 6a

```
line6a = taxpayer.grossBenefits + spouse.grossBenefits
```

### Step 4 — Line 6d determination

```
isMfs = filingStatus == "Married filing separately"
livedApartAllYear = livedApartFromSpouseEntireTaxYear == true
line6d = isMfs && livedApartAllYear
```

### Step 5 — Worksheet inputs

Worksheet line 3 = first-non-null of:
- `importedReturnWorksheetLine3IncomeTotal` (manual override)
- auto-computed from: `line1z + line2b + line3b + line4b + line5b + line7a + line8`

Worksheet line 4 = first-non-null of:
- `importedReturnWorksheetLine4TaxExemptInterest` (manual override)
- `interest.line2aTaxExemptInterest()` (from interest computation)

Worksheet line 6 = first-non-null of:
- `importedReturnWorksheetLine6AdjustmentsTotal` (manual override)
- **0 (default)** — ⚠️ Schedule 1 adjustments are NOT auto-pulled from return computation

### Step 6 — Normal taxable benefits (`computeTaxableSocialSecurityNormal()` ~line 7391)

```
w1 = line6a
w2 = 0.50 × w1
w5 = w2 + worksheetLine3 + worksheetLine4  // ⚠️ NOTE: skips IRS worksheet line 5 exclusions/additions
w7 = max(0, w5 - worksheetLine6)

if mfsLivedWithSpouseAnyTime:
    taxableNormal = min(0.85 × w1, 0.85 × w7)       // MFS restrictive path
else:
    baseAmount = 32000 (MFJ) or 25000 (others)
    secondBase = 44000 (MFJ) or 34000 (others)
    overBase = max(0, w7 - baseAmount)
    if overBase <= 0: return 0
    taxableUpTo50 = min(0.50 × w1, 0.50 × overBase)
    overSecond = max(0, w7 - secondBase)
    if overSecond > 0:
        plateau = min(0.50 × (secondBase - baseAmount), 0.50 × w1)
        taxable = plateau + (0.85 × overSecond)
    else:
        taxable = taxableUpTo50
    taxableNormal = min(0.85 × w1, taxable)
```

### Step 7 — Lump-sum election (`computeTaxableSocialSecurityLumpSum()` ~line 7437)

⚠️ **Simplified approximation — not full Pub. 915 recomputation per prior year:**

```
for each row in lumpSumDetails:
    allocated = row.lumpSumAllocatedToPriorYear
    previouslyTaxed = row.priorYearTaxableBenefitsPreviouslyReported
    rowReduction = min(allocated × 0.85, previouslyTaxed)
    totalReduction += rowReduction

taxableLumpSum = max(0, taxableNormal - totalReduction)
```

### Step 8 — Choose line 6b and line 6c

```
if electsLumpSumElection && taxableLumpSum < taxableNormal:
    line6b = taxableLumpSum
    line6c = true
else:
    line6b = taxableNormal
    line6c = false

// Force zero if line 6a exists and line 6b is null
if line6a != null && line6b == null: line6b = 0

// 85% cap
line6b = min(0.85 × line6a, max(0, line6b))
```

---

## 5. TIN Matching / Attribution Logic

### SSA-1099 (`belongsToPersonSsa1099()` ~line 7482)

| Condition | Assigned to |
|---|---|
| `beneficiarySSN` present && matches taxpayer SSN | Taxpayer |
| `beneficiarySSN` present && matches spouse SSN | Spouse |
| No TIN: taxpayer had benefits | Taxpayer |
| No TIN: only spouse had benefits | Spouse |

### RRB-1099 (`belongsToPersonRrb1099()` ~line 7501)

Same logic using `recipientIdNumber` field.

---

## 6. Statement Gating & Blocking Flags

| Flag | Condition |
|---|---|
| `SOCIAL_SECURITY_STATEMENT_UPLOAD_REQUIRED` | `hadAnyBenefits == true` AND (`!hasUploadedAtLeastOneSsaOrRrbStatement` OR `!confirmAllReceivedSsaRrbStatementsUploaded` OR `ssaEntries.isEmpty() && rrbEntries.isEmpty()`) |
| `MISSING_UPLOADED_SSA_1099` | `receivedSsa1099 == true` AND (`!uploadedSsa1099` OR `ssaEntries.isEmpty()`) |
| `MISSING_UPLOADED_RRB_1099` | `receivedRrb1099 == true` AND (`!uploadedRrb1099` OR `rrbEntries.isEmpty()`) |
| `SOCIAL_SECURITY_LUMP_SUM_ALLOCATION_REQUIRED` | `electsLumpSumElection == true` AND lump-sum details list is empty (non-blocking) |

---

## 7. Output Fields

### Income.java fields

| JSON path | Java field | Line |
|---|---|---|
| `form1040.income.socialSecurityBenefits` | `socialSecurityBenefits` | Line 6a |
| `form1040.income.taxableSocialSecurityBenefits` | `taxableSocialSecurityBenefits` | Line 6b |
| `form1040.income.line6cLumpSumElection` | `line6cLumpSumElection` | Line 6c checkbox |
| `form1040.income.line6dMfsLivedApartAllYear` | `line6dMfsLivedApartAllYear` | Line 6d checkbox |

### SocialSecurityComputation private record

Fields: `line6aGrossBenefits`, `line6bTaxableBenefits`, `line6c`, `line6d`, `taxableNormal`, `taxableLumpSum`

---

## 8. Downstream Consumers

| Consumer | Field | Source |
|---|---|---|
| Line 9 total income | `form1040.income.totalIncome` | `taxableSocialSecurityBenefits` (line 6b only) |
| Line 6a worksheet | `worksheetLine3` re-use | line 6b not directly an input to line 6 worksheet itself (it's a result) |
| Social Security Benefits Worksheet | `worksheetLine3` | Includes `line5b` (pension), `line4b` (IRA), etc. |

Line 6a gross is **not** added to line 9 total income.

---

## 9. PDF Export Mapping

| Semantic key | Form 1040 PDF field | Status |
|---|---|---|
| `line6a_social_security_benefits` | `f1_68[0]` | ✅ Mapped |
| `line6b_social_security_taxable_amount` | `f1_69[0]` | ✅ Mapped |
| `line6c_lump_sum_election` | ✅ Mapped (resolved 2026-05-12 via 6c #5) | `c1_41[0]` now mapped to `line6c_lump_sum_election` |
| `line6d_mfs_lived_apart_all_year` | ✅ Mapped (resolved 2026-05-12 via 6d #5) | `c1_42[0]` now mapped to `line6d_mfs_lived_apart_all_year` |

The frontend (`form-tax-return-1040.component.ts` lines 283–284) sets `line6c_lump_sum_election` and `line6d_mfs_lived_apart_all_year`, but the CSV does not have semantic rows for these names, so checkbox fills are silently ignored.

---

## 10. Unit Tests (5 tests)

| Test | File | Line | What it covers |
|---|---|---|---|
| `computesSocialSecurityLinesWithLumpSumElectionAndLine6d` | `TaxReturnComputeServiceTest` | ~2316 | MFS+apart, lump-sum election reduces taxable ($30k → $10,850), line 6c=true, line 6d=true |
| `flagsWhenSocialSecurityStatementsAreMissingForEnabledWorkflow` | `TaxReturnComputeServiceTest` | ~2369 | Missing statements → blocking flags |
| `computesZeroTaxableSocialSecurityWhenBelowWorksheetThreshold` | `TaxReturnComputeServiceTest` | ~2400 | $12k benefits single → taxable=0, 6c=false, 6d=false |
| `computesSocialSecurityAcrossSpousesAndExcludesSsi` | `TaxReturnComputeServiceTest` | ~2437 | MFJ, both spouses, SSI exclusions ($200 taxpayer + $500 spouse) → gross=17300, taxable=0 |
| `computesMfsLivedWithSpouseSocialSecurityUsingWorksheetBranch` | `TaxReturnComputeServiceTest` | ~2488 | MFS lived-with-spouse restrictive branch → taxable = min(85%×line6a, 85%×w7) = 4250 |

---

## 11. E2E Tests (3 tests)

File: `e2e/tests/line6abcd-social-security-benefits.spec.ts`

| Test | Coverage |
|---|---|
| `Taxpayer Social Security form blocks save when no statements are uploaded` | UI gating — form blocks Save when SSA-1099 not yet entered (but form is filled) |
| `Line 6a/6b/6c/6d flow computes taxable benefits and sets checkbox flags` | Full MFS+apart path, lump-sum election, seed via API, compute via UI |
| `Low-benefit Social Security path keeps line 6b at zero and line 6c unchecked` | Below-threshold path (12k benefits, no other income) |

### E2E Patterns Observed

- Uses `seedSsaStatementApi` (inline helper — NOT using the shared `seedStatementApi` from `api-flow.ts`)
- Uses `computeReturnViaUi` (UI compute, not `computeReturnApi`) in tests 2 and 3
- No `test.describe.configure({ retries: 1 })` — single-shot tests

---

## 12. Angular Components

| Component file | Form ID |
|---|---|
| `form-social-security-benefits-taxpayer.component.ts` | `social-security-benefits-taxpayer` |
| `form-social-security-benefits-spouse.component.ts` | `social-security-benefits-spouse` |

Both are in `us-tax-ui/src/app/forms/`.

UI layout: sections rendered sequentially (`p-select` dropdowns for boolean fields, `p-inputNumber` for amounts). Lump-sum detail rows added dynamically via "Add row" button.

---

## 13. Implementation Gaps / Outstanding Items

### Gap 1 — Worksheet line 5 exclusions/additions — CLOSED 2026-06-05

IRS worksheet line 5 covers (in order of build status):
- Foreign earned income / housing (Form 2555 lines 45 and 50) — **WIRED** via `computeForm2555ExclusionForSsWorksheet`.
- Adoption benefits (Form 8839) — **WIRED** via `adoption.line1f()` (Form 8839 / line 1f equivalent).
- US possession bona-fide-resident exclusions (American Samoa / Puerto Rico / Guam / USVI / CNMI per IRS Pub. 570) — **WIRED 2026-06-05** via the unified `possession-residence-exclusion-{taxpayer,spouse}` personal form (V47) → `computePossessionExclusionForSsWorksheet` helper → orchestrator's `worksheetLine5` aggregation.
- Savings bond interest exclusion (Form 8815) — NOT a line-5 add-back; it is a worksheet-line-3 carveout (use Schedule B line 2 instead of Form 1040 line 2b). Tracked as separate Gap 6 in `XLS/Computations/6b.md`.

**Backend**: `computeTaxableSocialSecurityNormal()` now computes `w5 = w2 + worksheetLine3 + worksheetLine4 + worksheetLine5`. The `worksheetLine5` aggregation site (`TaxReturnComputeService.computeSocialSecurityBenefits` ~line 12631) combines Form 2555 (both spouses) + adoption + possession exclusions (both spouses).

**Verified by**: 3 Java unit tests (`possessionExclusionFromAmericanSamoaFlowsIntoSsWorksheetLine5`, `possessionExclusionUsesTotalOverrideWhenProvided`, `possessionExclusionSuppressedWhenScreeningFlagFalse`) + 2 e2e tests (American Samoa scenario, Puerto Rico scenario). See `XLS/Computations/6b.md` Gap 1 closure.

### Gap 2 — Lump-sum election is a simplified approximation

The backend reduces taxable benefits by `min(allocated × 0.85, previouslyTaxed)` per row. The full Pub. 915 method requires recomputing prior-year taxable benefits using prior-year AGI and income inputs. The YAML captures `priorYearOtherIncomeForRecompute`, `priorYearTaxExemptInterestForRecompute`, `priorYearAdjustmentsForRecompute`, `priorYearBenefitsPreviouslyReported` — but the backend does not use these fields in `computeTaxableSocialSecurityLumpSum()`.

**Impact**: Lump-sum election result may differ from IRS Publication 915 in cases with significant prior-year income differences.

### Gap 3 — Worksheet line 6 defaults to 0

Schedule 1 Part II adjustments (lines 11–20, 23, 25) are required to be subtracted in worksheet line 6. The backend defaults `worksheetLine6 = 0` unless the user manually enters `importedReturnWorksheetLine6AdjustmentsTotal`.

**Impact**: For returns with IRA deductions, student loan interest, or alimony, the provisional income is overstated, potentially making more benefits taxable than the correct IRS worksheet would show.

### Gap 4 — Line 6c and 6d checkboxes unmapped in PDF CSV — **FULLY RESOLVED 2026-05-12 (line 6c via 6c #5; line 6d via 6d #5)**

Pre-fix, `c1_41[0]` (line 6c) was labeled `unmapped_c1_41_0` and `c1_42[0]` (line 6d) was labeled `unmapped_c1_42_0` in `f1040_field_mapping_semantic.csv`. The frontend sets `line6c_lump_sum_election` and `line6d_mfs_lived_apart_all_year` values but the CSV had no matching semantic rows → checkbox fills silently ignored on PDF export.

**Line 6c portion — RESOLVED 2026-05-12 via 6c.xlsx Code Validation #5**: CSV row 31 updated — `c1_41[0]` now maps to `line6c_lump_sum_election`. Frontend export wires through correctly.

**Line 6d portion — RESOLVED 2026-05-12 via 6d.xlsx Code Validation #5**: CSV row 32 updated — `c1_42[0]` now maps to `line6d_mfs_lived_apart_all_year`. Frontend export wires through correctly. Same shape fix as 6c #5; three coordinated updates (CSV + dependencies + this knowledge file).

**Gap 4 is now FULLY RESOLVED across both 6c and 6d checkboxes. The 6abcd PDF export wiring is complete.**

### Gap 5 — Repayments > gross benefits special case not guarded

IRS special rules apply when total 2025 repayments exceed gross benefits. The backend has no guard or special routing for this case.

### Gap 6 — Negative box-5 handling not verified

If total box-5 from SSA-1099 / RRB-1099 is negative, IRS special rules may apply. The backend's `subtractNonNegative` calls prevent negative intermediate values but do not implement the repayment/credit treatment rules for this scenario.

### Gap 7 — IRA deduction coordination (Pub. 590-A) not implemented

When the taxpayer or spouse contributed to a traditional IRA and is covered by a workplace plan, the IRA deduction and taxable SS benefits must be coordinated using Pub. 590-A worksheets. The backend uses the plain 1040 worksheet unconditionally.

### Gap 8 — E2E spec uses `computeReturnViaUi` and inline statement seeder

Tests 2 and 3 use `computeReturnViaUi` instead of `computeReturnApi`, making them dependent on UI navigation. The `seedSsaStatementApi` is an inline helper rather than using the shared `seedStatementApi` from `api-flow.ts`. Both patterns increase brittleness. Migration to `computeReturnApi` + shared helper would align with the rest of the test suite.

---

## 14. Key Backend Locations

| Item | Location |
|---|---|
| `computeSocialSecurityBenefits()` | `TaxReturnComputeService.java` ~line 7136 |
| `computeSocialSecurityForPerson()` | `TaxReturnComputeService.java` ~line 7319 |
| `validateSocialSecurityStatementGating()` | `TaxReturnComputeService.java` ~line 7348 |
| `computeTaxableSocialSecurityNormal()` | `TaxReturnComputeService.java` ~line 7391 |
| `computeTaxableSocialSecurityLumpSum()` | `TaxReturnComputeService.java` ~line 7437 |
| `belongsToPersonSsa1099()` | `TaxReturnComputeService.java` ~line 7482 |
| `belongsToPersonRrb1099()` | `TaxReturnComputeService.java` ~line 7501 |
| `Income.java` | `src/main/java/com/ustax/model/output/Income.java` |

---

## 15. Compute Order

`computeSocialSecurityBenefits()` must run **after**:
- All of lines 1z, 2b, 3b, 4b, 5b, 7a, 8 (its worksheet line 3 uses these)
- Tax-exempt interest computation (worksheet line 4)

`computeSocialSecurityBenefits()` must run **before**:
- `computeTotalIncome()` (line 9 needs line 6b)

---

## 16. 2025 IRS Constants Used

| Constant | Value |
|---|---|
| SS base amount — MFJ | $32,000 |
| SS base amount — Single/HOH/QSS/MFS-apart | $25,000 |
| SS base amount — MFS-lived-with-spouse | $0 (skip threshold) |
| SS second-tier amount — MFJ | $44,000 |
| SS second-tier amount — Single/HOH/QSS/MFS-apart | $34,000 |
| Maximum taxable fraction | 85% of line 6a |
