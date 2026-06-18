# Knowledge: Line 1h — Other Earned Income

**Tax year:** 2025  
**Form:** 1040 / 1040-SR line 1h  
**Status as of:** 2026-06-01 (updated after PSO exclusion implementation)

---

## 1. What Is Line 1h

Form 1040 line 1h is the catch-all wages slot for earned income that belongs in the wages section but is not covered by lines 1a–1g. The IRS 2025 Form 1040 instructions define exactly four categories that belong here:

1. Strike or lockout benefits (other than bona fide gifts)
2. Excess elective deferrals
3. Disability pension payments (1099-R code 3) received before the recipient reaches the employer plan's minimum retirement age
4. Corrective distributions from a retirement plan (1099-R code 8 only — current year; code P belongs to a prior year)

---

## 2. What Is Implemented

### Category 1 — Strike/Lockout Benefits

**Status: Fully implemented.**

- Manual entry: `strikeBenefits.manualStrikeBenefitsAmount` from the `other-earned-income` personal form.
- Imported from 1099-MISC: entries where `box3IsStrikeBenefits == true` contribute `otherIncomeAmount` automatically.
- Backend method: `sumStrikeBenefitsFrom1099Misc()`.
- Both sources are summed: `strikeTotal = importedStrike + manualStrike`.

### Category 2 — Excess Elective Deferrals

**Status: Fully implemented (2026-04-12).**

- Backend reads W-2 box 12 codes:
  - `DEFERRAL_402G_CODES = {D, E, F}` — pre-tax 401(k), SARSEP, 403(b) only. AA/BB (Roth) excluded — already in W-2 box 1.
  - `DEFERRAL_SIMPLE_CODES = {S}` — SIMPLE plans
  - `DEFERRAL_457B_CODES = {G}` — section 457(b) plans
- SSN-filtered per taxpayer / spouse.
- Backend method: `computeExcessDeferralsForPerson()` via `computeDeferralTotalsForSsn()`.
- Age catch-up: `ageAtYearEnd >= 50` applies catch-up; `ageAtYearEnd >= 60 && ageAtYearEnd <= 63` uses enhanced catch-up (SECURE 2.0 §603).
- Computed limits from `ReferenceData` (all correct as of 2026-04-12):

| Constant | 2025 IRS value | Code value | Status |
|---|---|---|---|
| `ELECTIVE_DEFERRAL_402G_LIMIT` | $23,500 | $23,500 | Correct |
| `ELECTIVE_DEFERRAL_402G_CATCHUP` | $7,500 | $7,500 | Correct |
| `ELECTIVE_DEFERRAL_402G_ENHANCED_CATCHUP` | $11,250 | $11,250 | Correct |
| `ELECTIVE_DEFERRAL_SIMPLE_LIMIT` | $16,500 | $16,500 | Correct |
| `ELECTIVE_DEFERRAL_SIMPLE_CATCHUP` | $3,500 | $3,500 | Correct |
| `ELECTIVE_DEFERRAL_SIMPLE_ENHANCED_CATCHUP` | $5,250 | $5,250 | Correct |
| `ELECTIVE_DEFERRAL_457B_LIMIT` | $23,500 | $23,500 | Correct |
| `ELECTIVE_DEFERRAL_457B_CATCHUP` | $7,500 | $7,500 | Correct |
| `ELECTIVE_DEFERRAL_457B_ENHANCED_CATCHUP` | $11,250 | $11,250 | Correct |
| `ELECTIVE_DEFERRAL_SIMPLE_117_LIMIT` | $17,600 | $17,600 | Correct (added 2026-06-01) |
| `ELECTIVE_DEFERRAL_SIMPLE_117_CATCHUP` | $3,850 | $3,850 | Correct (added 2026-06-01) |
| `ELECTIVE_DEFERRAL_SIMPLE_117_ENHANCED_CATCHUP` | $5,775 | $5,775 | Correct (added 2026-06-01) |
| `ELECTIVE_DEFERRAL_457B_3YEAR_SPECIAL_CATCHUP_LIMIT` | $47,000 | $47,000 | Correct (added 2026-06-01; IRC §457(b)(3)) |
| `ELECTIVE_DEFERRAL_403B_15YEAR_RULE_BONUS` | $3,000 | $3,000 | Correct (added 2026-06-01; IRC §402(g)(7)) |

**IRC §402(g)(7) 403(b) 15-year-rule bonus — added 2026-06-01.** Per-person opt-in via `electiveDeferrals.{taxpayer,spouse}.uses403b15YearRule`. When true, the 402(g) limit gains an extra $3,000 (stacks with age-50 / enhanced catch-up). User must self-track $15,000 lifetime cap. Form section auto-renders only when the person has any 402(g)-pool deferral (W-2 box 12 codes D/E/F).

**IRC §457(b)(3) 3-year special pre-retirement catch-up — added 2026-06-01.** Per-person opt-in via `electiveDeferrals.{taxpayer,spouse}.uses457b3YearSpecialCatchup`. When true, the 457(b) cap becomes $47,000 (2 × regular) and the age-50 / enhanced catch-up is suppressed for the 457(b) pool only. Mutually exclusive — the special amount already contains catch-up math. Form section auto-renders only when the person has a 457(b) deferral (W-2 box 12 code G).

**SECURE 2.0 §117 SIMPLE elevated limits — added 2026-06-01.** Per-person opt-in via `electiveDeferrals.{taxpayer,spouse}.usesSimple117ElevatedLimits` on the `other-earned-income` form. When true, the SIMPLE pool uses the elevated 110% limits ($17,600 / $3,850 / $5,775 instead of $16,500 / $3,500 / $5,250). The 402(g) and 457(b) pools are unaffected. The form section auto-renders only when the person has a SIMPLE deferral (W-2 box 12 code S).

### Category 3 — Disability Pension Wages (1099-R code 3)

**Status: Fully implemented, including PSO exclusion (2026-06-01).**

- Reads 1099-R entries with distribution code 3.
- Requires user to answer `isBelowPlanMinimumRetirementAge` via the `other-earned-income` form UI.
- If `true`: uses `taxableAmountAmount` (box 2a) if present, else `grossDistributionAmount` (box 1).
- If `false`: $0 on line 1h (pension path instead via lines 5a/5b).
- Owner attribution: resolved from `recipientTIN` vs taxpayer/spouse SSN; manual owner selection required when TIN does not match either SSN.
- Blocking flags emitted when owner or minimum-retirement-age answer is missing.
- **PSO premium exclusion (IRC §402(l)):** per-person, capped at $3,000 (statutory). The compute tracks per-person disability totals, then subtracts the smaller of the qualifying premium amount and $3,000 per person, further clamped to the person's disability total via `subtractNonNegative` so line 1h never goes negative. Statement label switches to `"Disability pension wages (PSO)"` when an exclusion is applied, matching the IRS-required PSO notation on the printed return.
- **PSO fields:** `disabilityPensions.psoExclusionTaxpayer.{isEligibleRetiredPublicSafetyOfficer, electsPsoPremiumExclusion, totalQualifyingPsoPremiumsPaid}`. Mirror for `psoExclusionSpouse`. Skipped on MFS to honor spouse-isolation.
- **Cross-line shared cap (deferred enhancement):** the IRS rule shares one $3,000 cap per person across line 1h AND line 5b. Current implementation enforces $3,000 on each line independently. In practice a single 1099-R goes to line 1h XOR line 5b based on the below-min-age gate, so independent caps produce the correct answer in the common case.

### Category 4 — Corrective Distributions (1099-R code 8)

**Status: Fully implemented.**

- Only code 8 (current-year) is included; code P (prior-year) is explicitly excluded.
- IRA/SEP/SIMPLE corrective distributions (`iraSepSimple == true`) are excluded.
- Entries with both code 3 and code 8 are routed through the disability path to prevent double-counting.
- Owner attribution follows the same pattern as disability entries.

---

## 3. Known Bugs and Gaps

### Resolved — Stale 2024 Deferral Limits ✓ Fixed 2026-04-12

All three base limits updated to 2025 values per IRS Notice 2024-80. No further action needed.

### Resolved — Roth AA/BB Codes in 402(g) Pool ✓ Fixed 2026-04-12

`DEFERRAL_402G_CODES` changed to `Set.of("D", "E", "F")`. AA/BB excluded as they are already in W-2 box 1. Both backend (`TaxReturnComputeService.java`) and frontend (`form-other-earned-income.component.ts`) updated.

### Resolved — Age-60-to-63 Enhanced Catch-Up ✓ Fixed 2026-04-12

`computeExcessDeferralsForPerson()` now checks `ageAtYearEnd >= 60 && ageAtYearEnd <= 63` first (enhanced catch-up), then falls back to `ageAtYearEnd >= 50` (standard catch-up). Constants `ELECTIVE_DEFERRAL_*_ENHANCED_CATCHUP` added to `ReferenceData.java`. Frontend mirrored.

### Resolved — `isBelowPlanMinimumRetirementAge` Uses p-select ✓ Fixed 2026-04-12

Changed to radio buttons in `form-other-earned-income.component.html`. Complies with Rule 7.

### Resolved — Missing `retries: 1` in E2E spec ✓ Fixed 2026-04-12

`test.describe.configure({ retries: 1 })` added to `line1h-other-earned-income.spec.ts`.

### Gap 2 — YAML Has No Spouse-Split

The `other-earned-income` personal form is not split into taxpayer/spouse variants. All other income personal forms (e.g., `13b-additional-deductions-taxpayer/spouse`) are split. The single-form approach here is intentional because the backend computes both taxpayer and spouse excess deferrals from W-2 SSN attribution, and the disability/corrective entries each carry an `owner` field. No bug, just a design note.

### Resolved — PDF Export `line1h_statement_text` Inline Field ✓ Fixed 2026-04-12

The Form 1040 PDF has two fields for line 1h:

| CSV field name | Purpose | Location |
|---|---|---|
| `line1h_other_earned_income` | Dollar amount | Right column, standard amount box |
| `line1h_statement_text` | Write-in description | Inline text area left of the amount box — rect `(344.2, 247.002, 475.2, 258.001)`, width ≈ 131 pts |

**Amount field** correctly filled. **Description field** now filled using a fit-check:
1. `line1hStatements()` joins all statement description strings with `"; "`.
2. At 6pt minimum font, `font.widthOfTextAtSize(stmt, 6)` is tested against available width (rect width − 3pt padding).
3. If it fits: write the description directly into `line1h_statement_text`; no separate page appended.
4. If it doesn't fit: write `"Refer to attached sheet"` into `line1h_statement_text` and append the separate statement page via `appendLine1hStatementPage()`.

This follows **UI Rule 44** (write-in description field overflow). Fix in `form-tax-return-1040.component.ts` save flow (lines 452–463).

---

### Resolved — MFJ Spouse Disability E2E ✓ Fixed 2026-04-12

E2E test added: `MFJ: spouse-owned disability 1099-R auto-attributed to spouse flows to line 1h`. Seeds 1099-R with `recipientTIN: '222-22-2222'`, sets MFJ filing status, seeds spouse. Note: the frontend always renders the owner dropdown and requires explicit "Spouse" selection even when `recipientTIN` matches spouse SSN.

### Resolved — Post-Minimum-Age Routing to Lines 5a/5b ✓ Fixed 2026-04-12

E2E test added: `Post-minimum-retirement-age disability: line 1h is null, pension lines receive the amount`. Verifies `otherEarnedIncome = null` and `taxablePensionsAnnuities > 0` when `isBelowPlanMinimumRetirementAge = No`.

---

## 4. Key Field Names

### Personal Form
| Form ID | Structure |
|---|---|
| `other-earned-income` | Single form (no taxpayer/spouse split) |

### Firestore Keys (within the `other-earned-income` document)
| Key | Type | Notes |
|---|---|---|
| `strikeBenefits.manualStrikeBenefitsAmount` | number | Manual strike entry |
| `disabilityPensions.entries[].source1099RId` | string | Reference to 1099-R entry ID |
| `disabilityPensions.entries[].owner` | string | "taxpayer" or "spouse" |
| `disabilityPensions.entries[].isBelowPlanMinimumRetirementAge` | boolean | Gating question |
| `correctiveDistributions.entries[].source1099RId` | string | Reference to 1099-R entry ID |
| `correctiveDistributions.entries[].owner` | string | "taxpayer" or "spouse" |

### Statement Sources
| Statement | Relevant Fields | Purpose |
|---|---|---|
| `w-2` | `box12Entries[].code`, `box12Entries[].box12Amount`, `employeeSSN` | Excess deferral computation |
| `1099-r` | `distributionCodes`, `taxableAmountAmount`, `grossDistributionAmount`, `iraSepSimple`, `recipientTIN` | Disability pensions (code 3) and corrective distributions (code 8/P) |
| `1099-misc` | `box3IsStrikeBenefits`, `otherIncomeAmount` | Imported strike benefits |

### JSON Output Fields
| Field | JSON path | Notes |
|---|---|---|
| `otherEarnedIncome` | `form1040.income.otherEarnedIncome` | BigDecimal / number, line 1h amount |
| `otherEarnedIncomeStatements` | `form1040.income.otherEarnedIncomeStatements` | List of description strings for the return display |

### Backend Record
`OtherEarnedIncomeComputation` — private record in `TaxReturnComputeService.java` line 16478:
```
record OtherEarnedIncomeComputation(BigDecimal line1h, List<String> statements)
```

---

## 5. Compute Method

**Method:** `computeOtherEarnedIncome()` in `TaxReturnComputeService.java` (starting line 8569)

**Called from:** `prepare()` at line 343, result stored as `otherEarned`.

**Execution order:** Called after W-2 entries are loaded and after `you`/`spouse` identification forms are read. No upstream computation dependencies.

**Downstream:** `otherEarned.line1h()` is passed to `buildIncome()` which sets `income.setOtherEarnedIncome(line1h)`. Line 1h feeds `line1z` (sum of lines 1a–1h) and line 9 (total income).

---

## 6. Blocking Flags

| Flag code | Condition | Blocking |
|---|---|---|
| `LINE1H_DISABILITY_OWNER_REQUIRED` | Disability 1099-R whose recipientTIN does not match either SSN, and `owner` selection not saved | Yes |
| `LINE1H_DISABILITY_MIN_RETIREMENT_AGE_REQUIRED` | Disability 1099-R where `isBelowPlanMinimumRetirementAge` is null | Yes |
| `LINE1H_CORRECTIVE_OWNER_REQUIRED` | Corrective distribution 1099-R whose recipientTIN does not match either SSN, and `owner` selection not saved | Yes |

---

## 7. Non-Overlap Rules Enforced

- W-2 box 1 is not double-counted: excess deferrals are separately computed from box 12, not from box 1.
- Roth excess is supposed to be excluded (spec requirement) — but see Bug 2 above.
- IRA/SEP/SIMPLE corrective distributions are excluded.
- Code 3 + code 8 combined: disability path takes priority; corrective path is skipped.
- Post-minimum-retirement-age disability: $0 on line 1h.
- Scholarship/fellowship amounts go to Schedule 1 line 8r, not line 1h.
- IRA distributions go to lines 4a/4b, not line 1h.
- Prior-year corrective distributions (code P) go to the prior year, not current-year line 1h.

---

## 8. Test Coverage

### Unit Tests (TaxReturnComputeServiceTest.java)
| Test name | Coverage |
|---|---|
| `computesLine1hDisabilityPensionWages` | Code 3, below min age, taxpayer SSN match |
| `computesLine1hExcessElectiveDeferrals` | W-2 code D, $25,000 > $23,500 limit → $1,500 excess |
| `computesLine1hExcessDeferrals_age60to63_usesEnhancedCatchup` | DOB 1963, $36,000 code D → $34,750 limit → $1,250 excess |
| `computesLine1hRothDeferrals_AA_BB_notCountedAsExcess` | Code AA $30,000 → null (no excess) |
| `computesLine1hCorrectiveDistributions` | Code 8 current-year vs code P prior-year |
| `excludesIraSepSimpleCorrectiveDistributions` | iraSepSimple=true excluded |
| `prioritizesDisabilityWhenCodesInclude3And8` | Combined code 3+8, disability wins |
| `computesLine1hStrikeBenefits` | Manual + 1099-MISC imported |

### E2E Tests (line1h-other-earned-income.spec.ts)
| Test | Coverage |
|---|---|
| Disability pension wages flow to line 1h | Code 3, below min age, radio button UI confirm |
| Excess elective deferrals flow to line 1h | W-2 code D, $25,000 > $23,500 → $1,500 |
| Age 60–63 enhanced catch-up: excess deferral uses $34,750 limit | DOB 1963, $36,000 code D → $1,250 |
| Roth deferrals (AA/BB) not counted as excess | Code AA $30,000 → null |
| Corrective distributions (current year) flow to line 1h | Code 8 |
| IRA/SEP/SIMPLE corrective distributions excluded | iraSepSimple=true |
| Disability takes precedence (code 3+8) | Anti-double-count |
| Strike benefits from manual + 1099-MISC | Both sources |
| MFJ: spouse-owned disability 1099-R flows to line 1h | recipientTIN=spouse SSN, owner=Spouse selected |
| Post-minimum-age: line 1h null, pension lines receive amount | belowMinAge=No → otherEarnedIncome=null, taxablePensionsAnnuities>0 |
| LINE1H_DISABILITY_OWNER_REQUIRED flag emitted when TIN matches neither SSN | recipientTIN=999-99-9999, no owner saved → flag present, otherEarnedIncome=null |

---

## 9. PDF Export — Outputs

The Form 1040 PDF (`f1040_field_mapping_semantic.csv`) defines two fields for line 1h:

| CSV semantic name | IRS PDF field | What it receives |
|---|---|---|
| `line1h_other_earned_income` | `f1_55[0]` | `formatAmount(otherEarnedIncome)` — correctly filled |
| `line1h_statement_text` | `f1_54[0]` | Filled via fit-check — see below (fixed 2026-04-12) |

**Amount path:** `form1040.income.otherEarnedIncome` → `buildPdfFieldValues()` → `line1h_other_earned_income`.

**Description path:** `form1040.income.otherEarnedIncomeStatements` → `line1hStatements()` (joins with `"; "`) → fit-check in save flow:
- If `font.widthOfTextAtSize(stmt, 6) ≤ availableWidth` (field width − 3pt): write description directly; no separate page.
- Otherwise: write `"Refer to attached sheet"` inline; append separate page via `appendLine1hStatementPage()`.

Follows **UI Rule 44**. Implemented in `form-tax-return-1040.component.ts` save flow.

---

## 10. Primary Source References

- IRS 2025 Form 1040 instructions line 1h: `https://www.irs.gov/instructions/i1040gi`
- Local text: `C:\us-tax\docs\books\i1040gi_2025.txt`
- SECURE 2.0 Act (Pub. L. 117-328) § 109 — super catch-up for ages 60–63
- IRC § 402(g)(1) — 2025 elective deferral limit $23,500
- IRC § 408(p)(2)(E) — 2025 SIMPLE limit $16,500
- IRS Rev. Proc. 2024-40 — 2025 retirement plan limit adjustments
- Local backend: `C:\us-tax\us-tax-be\src\main\java\com\ustax\microservices\TaxReturnComputeService.java` (method `computeOtherEarnedIncome`, line 8569)
- Local frontend: `C:\us-tax\us-tax-ui\src\app\forms\form-other-earned-income.component.ts`
- Local YAML: `C:\us-tax\yamls\1h-other-earned-income.yaml`
