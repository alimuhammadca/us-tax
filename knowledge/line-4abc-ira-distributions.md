---
name: line-4abc-ira-distributions
description: Complete implementation knowledge for Form 1040 lines 4a/4b/4c including Form 8606, QCD, HFD, rollover, and all exception paths. Tax year 2025.
type: project
---

# Lines 4a/4b/4c — IRA Distributions (Tax Year 2025)

## Overview

Lines 4a/4b/4c cover IRA distributions only (traditional, Roth, SEP, SIMPLE). Non-IRA retirement distributions belong on lines 5a/5b/5c. As of 2026-04-15, the backend is fully implemented with 319 unit tests and 4 E2E tests.

---

## 2025 IRS Constants (Verified)

| Constant | Value | Source |
|---|---|---|
| QCD annual cap per person | $108,000 | IRS Pub. 526 (2025) — confirmed |
| QCD split-interest entity sub-cap | $54,000 | IRS Pub. 526 (2025) — confirmed |
| QCD minimum age | 70½ | Unchanged by SECURE 2.0 |
| IRA-to-IRA personal rollover once-per-year rule | 1 per 12 months | Does not apply to trustee-to-trustee or Roth conversions |

---

## Computation Entry Point

`TaxReturnComputeService.computeIraDistributions()` (~line 4477)

**Called from:** `prepare()` at ~line 350, after `computeChildInterestDividends()` and before `computeInterestIncome()`.

**Inputs:**
- `iraIncomeTaxpayer` / `iraIncomeSpouse` — personal form data
- `form1099REntries` — all 1099-R entries (shared with lines 5a/5b/5c; filtered here by `iraSepSimple == true`)
- `you` / `spouse` — identification forms (SSN for TIN matching)
- `flags` — running flag list

---

## Per-Person Logic (`computeIraForPerson()` ~line 4727)

### Step 1 — Filter 1099-R entries for this person
- Filter by `iraSepSimple == true` AND `belongsToPersonIra()` (SSN-based TIN matching)
- `belongsToPersonIra()` fallback: when entry has no `recipientTIN`, uses `spouseHadIra && !taxpayerHadIra` heuristic to assign to spouse

### Step 2 — Accumulate from each 1099-R
| Field | Source | Accumulator |
|---|---|---|
| Gross (all IRA) | box 1 (`grossDistributionAmount`) | `grossIra` |
| Gross (traditional only) | box 1, entries without codes J/Q/T | `grossTraditionalIra` |
| Taxable | box 2a (`taxableAmountAmount`) | `taxableBox2a` |
| Taxable not determined | box 2b | `taxableNotDeterminedCount` |
| Roth codes | box 7 distribution code J/Q/T | `rothCodeCount` |
| Roth codes requiring Part III | box 7 distribution code J/T (not Q) | `rothCodeJOrTCount` |

`grossTraditionalIra` is accumulated for non-Roth entries only (codes J/Q/T excluded). It feeds directly into `buildForm8606()` as the starting point for Form 8606 Part I line 7.

### Step 3 — Detect exception flags
Read from personal form:
- `hasRollover` ← `hadIraRollover`
- `hasQcd` ← `hadQcd`
- `hasHfd` ← `hadHfd`
- `hasOtherLine4cWriteIn` ← `hasOtherLine4cWriteInCode`
- `hasException2` ← `hasNondeductibleTraditionalBasis` OR `hasTraditionalToRothConversion` OR `hasRothIraDistributions` OR `hadReturnOfContributionOrRecharacterization` OR `rothCodeJOrTCount > 0`

### Step 4 — Compute taxable after exceptions
```
effectiveQcdAmount = max(0, ownQcd − post70halfDeduction) + inheritedQcd
taxableAfterExceptions = max(0, taxableBox2a − (rolloverAmount + effectiveQcdAmount + hfdAmount))
```
Using `subtractNonNegative()` at each step.

### Step 5 — Form 8606 (if hasException2)
Call `buildForm8606(person, iraForm, grossTraditionalIra)` — takes `grossTraditionalIra` from Step 2.
Form 8606 taxable = `part1Line15c + part2Line18 + part3Line25c`.

### Step 6 — Build `IraPersonComputation` record
- `line4cBox3Text` = "HFD" if HFD present, then append `line4cOtherWriteInText` via semicolon-dedup `joinLine4cOtherText()`
- `hasAnyException = hasRollover || hasQcd || hasHfd || hasException2 || hasOtherLine4cWriteIn`

---

## Return-Level Aggregation

| Output | Formula |
|---|---|
| `line4cBox1` | `taxpayer.hasRollover \|\| spouse.hasRollover` |
| `line4cBox2` | `taxpayer.hasQcd \|\| spouse.hasQcd` |
| `line4cBox3` | `taxpayer.hasBox3Other \|\| spouse.hasBox3Other` |
| `grossIra` | `taxpayer.grossIra + spouse.grossIra` |
| `taxableIra` | `taxpayer.taxable + spouse.taxable` |
| `line4a` | `null` when fully taxable (no exception, gross==taxable); else `roundMoney(grossIra)` |
| `line4b` | `roundMoney(taxableIra)` |

---

## Multi-Exception Statement Rule

Counts of exception categories present (each category = 1): box1, box2, box3, exception2.

**Statement required when:** count > 1, UNLESS the waiver applies.

**Waiver:** Exactly 2 categories, one of which is Exception 2, and the other is exactly one of box1/box2/box3.

**Flag:** `LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED` (blocking) — emitted when statement required AND `exceptionBreakoutStatementPrepared != true`.

**Non-blocking flags:**
- `IRA_ROLLOVER_ATTACHMENT_REVIEW` — rollover into qualified plan or completed in following year
- `IRA_QCD_SIE_ATTACHMENT_REVIEW` — one-time QCD to split-interest entity

---

## Form 8606 (`buildForm8606(person, iraForm, grossTraditionalIra)` ~line 4842)

One per person, not joint. MFJ can have 0, 1, or 2.

**Part I** (lines 1–15c) — Traditional IRA basis:
- Line 1: `nondeductibleContributionsCurrentYear` (personal form)
- Line 2: `basisPrevFromPriorYear8606Line14` (personal form)
- Line 3: line 1 + line 2
- Line 4: `nondeductibleContributionsMadeAfterYearEndForTaxYear` (personal form)
- Line 5: line 3 − line 4
- Line 6: `valueAllTraditionalSepSimpleIrasAtYearEnd` (personal form — year-end FMV)
- **Line 7: auto-computed** = `grossTraditionalIra − rollover − fullQcd − hfd − conversion(line8) − returnOfContribution − inheritedTraditional` (all via `subtractNonNegative`; never user-entered)
- Line 8: `totalTraditionalIraConvertedToRothFor8606Line8` (personal form)
- Line 9: line 6 + line 7 + line 8
- Line 10: line 5 ÷ line 9 (ratio, 10 decimal places)
- Line 11: line 8 × line 10
- Line 12: line 7 × line 10
- Line 13: line 11 + line 12
- Line 14: line 3 − line 13 (remaining basis carried forward)
- Line 15a: line 7 − line 12
- Line 15b: `qualifiedDisasterRepaymentsTraditionalFor8606Line15b` (personal form)
- Line 15c: line 15a − line 15b (taxable traditional IRA distribution)

**Part II** (lines 16–18) — Traditional-to-Roth conversion:
- Line 16: = Part I line 8
- Line 17: = Part I line 11
- Line 18: line 16 − line 17 (taxable conversion amount)

**Part III** (lines 19–25c) — Roth IRA distributions:
- Line 19: `totalNonqualifiedRothDistributionsFor8606Line19` (personal form)
- Line 20: `qualifiedFirstTimeHomebuyerExpensesFor8606Line20`
- Line 21: line 19 − line 20
- Line 22: `rothContributionBasisFor8606Line22`
- Line 23: line 21 − line 22 (if > 0)
- Line 24: `rothConversionBasisFor8606Line24`
- Line 25a: line 23 − line 24 (if > 0)
- Line 25b: `qualifiedDisasterRepaymentsRothFor8606Line25b`
- Line 25c: line 25a − line 25b (taxable Roth distribution)

**Taxable from Form 8606:** `part1Line15c + part2Line18 + part3Line25c`

### Line 7 exclusions (all applied via `subtractNonNegative`, floored at zero)
| Exclusion | Source field |
|---|---|
| Rollovers | `totalIraRolloverAmount` |
| QCDs (full amount, before post-70½ reduction) | `totalQcdAmount` |
| HFDs | `totalHfdAmount` |
| Traditional-to-Roth conversions | `totalTraditionalIraConvertedToRothFor8606Line8` (= line 8) |
| Returns of contribution / recharacterizations | `returnOfContributionAmount` (personal form) |
| Inherited traditional IRA distributions | `inheritedTraditionalIraDistributionAmount` (personal form) |

Note: the QCD exclusion for line 7 uses the **full** `totalQcdAmount`, not `effectiveQcdAmount`. The post-70½ deductible reduction affects taxability (Step 4), not the line 7 distribution tally.

---

## Output Model Fields

### `Income.java`
| Field | Meaning |
|---|---|
| `iraDistributions` | Line 4a (null when fully taxable, no exception) |
| `taxableIraDistributions` | Line 4b |
| `line4cBox1Rollover` | Boolean |
| `line4cBox2Qcd` | Boolean |
| `line4cBox3Other` | Boolean |
| `line4cBox3Text` | String (e.g. "HFD", "HFD; XYZ") |
| `line4cExceptionBreakoutStatementRequired` | Boolean |
| `line4aRolloverAttachmentText` | String — rollover explanation for attachment |
| `line4cQcdSieAttachmentText` | String — QCD split-interest entity attachment |
| `line4cBreakoutStatementText` | String — multi-exception breakout statement |

### `TaxReturnComputation` record
| Position | Field |
|---|---|
| 7 | `form8606Taxpayer` |
| 8 | `form8606Spouse` |

### `Form8606.java`
Full set of Part I (lines 1–15c), Part II (lines 16–18), Part III (lines 19–25c) as BigDecimal fields plus `header` (ScheduleHeader) and `owner` (String: "taxpayer"/"spouse").

---

## Personal Form Fields

### `exceptionAmountsAndAttachmentFacts` section (both YAML files)
| Field | Type | Purpose |
|---|---|---|
| `totalIraRolloverAmount` | amount | Rollover exclusion |
| `totalQcdAmount` | amount | QCD exclusion (full amount) |
| `inheritedIraQcdAmount` | amount | Of QCD total, portion from inherited IRA (post-70½ reduction exempt) |
| `deductibleIraContributionsAfterAge70Half` | amount | Reduces own-IRA QCD exclusion dollar-for-dollar |
| `totalHfdAmount` | amount | HFD exclusion |
| `returnOfContributionAmount` | amount | Return of contribution / recharacterization exclusion from Form 8606 line 7 |
| `inheritedTraditionalIraDistributionAmount` | amount | Inherited traditional IRA exclusion from Form 8606 line 7 |

### `form8606PartIandPartIIInputs` section (both YAML files)
`totalTraditionalIraDistributionsFor8606Line7` **was removed** — Form 8606 line 7 is now fully auto-computed by the backend. Users no longer enter this value.

---

## Statement Gating (`validateIraStatementGating()`)

Flags emitted when gating fails:
- `IRA_STATEMENT_UPLOAD_REQUIRED` (blocking) — `hadIraDistributions=true` but upload confirmation missing
- `MISSING_UPLOADED_1099_R` (blocking) — `received1099R=true` but `uploaded1099R!=true`

---

## YAML Intake Forms

| Form ID | File | Who | Notes |
|---|---|---|---|
| `ira-income-taxpayer` | `4abc-ira-income-taxpayer.yaml` | Taxpayer | Includes statement upload check + return-level gating sections |
| `ira-income-spouse` | `4abc-ira-income-spouse.yaml` | Spouse | Excludes statement upload check and return-level gating sections |

**8 YAML sections in taxpayer form:** screening, statementUploadCheck, exceptionAnd8606TriggerScreening, exceptionAmountsAndAttachmentFacts, form8606PartIandPartIIInputs, form8606PartIIIInputs, line4cReturnLevelStatementGating, importedStatementFields (backend-only), computedOutputs (backend-only).

---

## Frontend Components

| Component | File |
|---|---|
| `FormIraIncomeTaxpayerComponent` | `form-ira-income-taxpayer.component.ts` |
| `FormIraIncomeSpouseComponent` | `form-ira-income-spouse.component.ts` |

Frontend shows live `ira1099RCount` pill. Client-side `isValid()` gate blocks save when `hadIraDistributions=true` but upload confirmations are not satisfied.

---

## Unit Tests (20 total, `TaxReturnComputeServiceTest.java`)

| Method | What it tests |
|---|---|
| `computesIraFullyTaxableWithoutExceptionsUsingLine4bOnly` | Line 4a null, 4b=$5000, no 4c, no Form 8606 |
| `computesIraWithExceptionsAndForm8606AndLine4c` | All exceptions; line7=450 (auto: 1000-200-100-50-200); taxable=571; box3Text="HFD; XYZ" |
| `computesMfjIraWithPerPerson8606AndReturnLevelAggregation` | MFJ, both Form 8606; taxpayer taxable=900, spouse taxable=450; total=1350 |
| `flagsWhenIraStatementUploadGatingFails` | Both blocking gating flags |
| `suppressesForm8606WhenAllRoth1099REntriesHaveCodeQ` | Code Q entry → no Form 8606, no exception, no line 4c |
| `assignsUntinnedIraEntryToSpouseViaFallbackHeuristic` | No recipientTIN, spouseHadIra=true → attributed to spouse |
| `mfjTaxpayerOnlyForm8606WhenSpouseHasNoTrigger` | MFJ: taxpayer Form 8606 only, spouse null |
| `mfjSpouseOnlyForm8606WhenTaxpayerHasNoTrigger` | MFJ: spouse Form 8606 only, taxpayer null |
| `form8606Part1DisasterRepaymentReducesLine15c` | line15b=200 → line15c=line15a-200 |
| `form8606Part3DisasterRepaymentReducesLine25c` | line25b=100 → line25c=line25a-100 |
| `qcdExclusionReducedByPost70HalfDeductibleContributions` | post70halfDeduction=30 → effectiveQcd=70 → taxable=80 |
| `post70HalfDeductionExceedingQcdResultsInZeroEffectiveQcd` | post70halfDeduction=80 > QCD=50 → effectiveQcd=0, full amount taxable, QCD box still checked |
| `rolloverAttachmentTextGeneratedWhenRolloverIntoQualifiedPlan` | rolloverIntoQualifiedPlanOrCompletedInFollowingYear=true → line4aRolloverAttachmentText populated |
| `qcdSieAttachmentTextGeneratedWhenOneTimeQcdToSplitInterestEntity` | hasOneTimeQcdToSplitInterestEntity=true → line4cQcdSieAttachmentText populated |
| `breakoutStatementTextGeneratedWhenMultipleExceptionsApply` | rollover+QCD both present → line4cBreakoutStatementText includes amounts |
| `inheritedIraQcdNotReducedByPost70HalfDeduction` | own QCD $80 − $30 post70half = $50; inherited $50 unchanged; effective = $100 |
| `inheritedIraQcdOnlyNoPost70HalfReduction` | all QCD from inherited IRA → post70half deduction has zero effect |
| `form8606Line7ComputedFromStatementsMinusExclusions` | gross=1200; rollover=100, qcd=100, hfd=50, conversion=200 → line7=750; line15c=750 |
| `form8606Line7ReturnOfContributionExcluded` | gross=1000; returnOfContribution=150 → line7=850; line15c=850 |
| `form8606Line7InheritedTraditionalExcluded` | gross=1000; inheritedTraditional=300 → line7=700; line15c=700 |

---

## E2E Tests (4 total, `line4abc-ira-income.spec.ts`)

1. Frontend gate blocks save when no IRA 1099-R uploaded
2. Exception-heavy MFJ case: all 4c boxes, both Form 8606, line 4a=1000, line 4b=571 (line7 auto-computed from gross minus exclusions)
3. Compute returns 409 with `LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED` when rollover+QCD and statement not prepared
4. Simple fully taxable: line 4a null, line 4b=$400, no Form 8606

---

## Known Limitations / Gaps

All known gaps are closed as of 2026-04-15.

1. ~~**Form 8606 generated for code Q (fully qualified Roth)**~~ — **Fixed 2026-04-14.** `computeIraForPerson()` now tracks `rothCodeJOrTCount` separately. When all Roth-coded 1099-R entries have code Q, Form 8606 is suppressed.

2. ~~**QCD exclusion reduction by post-70½ deductible contributions**~~ — **Fixed 2026-04-15.** `deductibleIraContributionsAfterAge70Half` field added to both YAML files and Angular components. `computeIraForPerson()` now computes `effectiveQcdAmount = max(0, ownQcd − post70halfDeduction) + inheritedQcd`. 2 unit tests added.

3. ~~**`belongsToPersonIra` fallback heuristic untested**~~ — **Fixed 2026-04-14.** Unit test `assignsUntinnedIraEntryToSpouseViaFallbackHeuristic` added.

4. ~~**MFJ one-spouse-only Form 8606 untested**~~ — **Fixed 2026-04-14.** Unit tests `mfjTaxpayerOnlyForm8606WhenSpouseHasNoTrigger` and `mfjSpouseOnlyForm8606WhenTaxpayerHasNoTrigger` added.

5. ~~**Return-level output artifacts**~~ — **Fixed 2026-04-15.** Three String fields added to `Income.java` (`line4aRolloverAttachmentText`, `line4cQcdSieAttachmentText`, `line4cBreakoutStatementText`), generated in `computeIraDistributions()`, wired via `IraComputation` record in `prepare()`, surfaced in `form-tax-return-1040.component.html`. 3 unit tests added.

6. ~~**Inherited IRA QCD**~~ — **Fixed 2026-04-15.** `inheritedIraQcdAmount` field added to both YAML files and Angular components (under `showUncommon`, inside `hadQcd === true` gate). `computeIraForPerson()` splits QCD into own vs. inherited portions; post-70½ deductible reduction applies only to own-IRA QCD. 2 unit tests added.

7. ~~**Disaster repayment path untested**~~ — **Fixed 2026-04-14.** Unit tests `form8606Part1DisasterRepaymentReducesLine15c` and `form8606Part3DisasterRepaymentReducesLine25c` added.

8. ~~**UI compliance violations (ira-income-* forms)**~~ — **Fixed 2026-04-15.** Both Angular components fully rewritten: radio buttons replacing all dropdowns, per-field `*ngIf` gates, less-common-situations toggle, plain-language labels, Form 8606 line references removed, educational framing added.

9. ~~**Form 8606 line 7 required user arithmetic**~~ — **Fixed 2026-04-15.** `totalTraditionalIraDistributionsFor8606Line7` removed as user-entered field. Backend now accumulates `grossTraditionalIra` (non-Roth 1099-R box 1 only) and computes line 7 automatically by subtracting all exclusions. Two new personal form fields added: `returnOfContributionAmount` (gated on `hadReturnOfContributionOrRecharacterization`) and `inheritedTraditionalIraDistributionAmount`. 3 unit tests added.

---

## Sources

- IRS Publication 526 (2025): $108,000 QCD cap, $54,000 SIE sub-cap — verified correct
- IRS Publication 590-B (2025): Form 8606 rules
- J.K. Lasser 2025 Professional Edition (§9.8): QCD post-70½ deduction reduction, inherited IRA QCD
- `C:/us-tax/lines/4abc.md` — line spec (accurate for 2025)
- `C:/us-tax/yamls/4abc-ira-income-taxpayer.yaml`
- `C:/us-tax/yamls/4abc-ira-income-spouse.yaml`
