# Knowledge: Form 1040 Lines 13a and 13b — QBI Deduction & Schedule 1-A (2025)

Tax year: **2025**
Last updated: **2026-04-17** (all gaps resolved)

---

## 1. What these lines do

| Line | What it is |
|---|---|
| **13a** | Qualified business income (QBI) deduction from **Form 8995** (below threshold) or **Form 8995-A** (above threshold) |
| **13b** | Additional deductions from **Schedule 1-A line 38** — the 2025 deductions for tips, overtime, car loan interest, and senior |

Both contribute to line 14 (total deductions) and ultimately reduce line 15 (taxable income).

**Critical compute-order rule:** line 13b must be computed BEFORE line 13a because the QBI deduction's taxable-income base requires subtracting line 13b from AGI. `computeLine13a()` is invoked a second time after `computeSchedule1A()` completes so the correct `line13b` value is used.

---

## 2. Key 2025 amounts

### Line 13a — QBI deduction

| Threshold / constant | Value |
|---|---|
| Form 8995 (below threshold) vs Form 8995-A (above) threshold — MFJ | **$394,600** |
| Form 8995 threshold — all other filing statuses | **$197,300** |
| Phase-in range — MFJ | **$100,000** (upper threshold $494,600) |
| Phase-in range — all other | **$50,000** (upper threshold $247,300) |
| QBI deduction rate | **20%** |
| W-2 wage limit rate (50% of W-2 wages) | **50%** |
| W-2/UBIA alternative rate (25% wages + 2.5% UBIA) | **25% / 2.5%** |

### Line 13b — Schedule 1-A amounts

| Part | Cap | Phaseout threshold | Phaseout rate | Phaseout rounding |
|---|---|---|---|---|
| II — Tips | $25,000 combined | $150k single / $300k MFJ | $100 per $1k above threshold | Round DOWN to nearest $1k |
| III — Overtime | $12,500 single / $25,000 MFJ | $150k single / $300k MFJ | $100 per $1k above threshold | Round DOWN to nearest $1k |
| IV — Car loan interest | $10,000 | $100k single / $200k MFJ | $200 per $1k above threshold | Round UP to nearest $1k |
| V — Senior deduction | $6,000 per eligible person | $75k single / $150k MFJ | 6% × excess MAGI | Continuous |

---

## 3. Critical compute order

```
Line 11b (AGI) → Line 12e (std/itemized) → Line 13b (Schedule 1-A) → Line 13a (QBI)
```

The IRS Form 8995 and 8995-A instructions require:
```
taxable_income_before_qbi = Form1040_line11b(AGI) - Form1040.line12e - Form1040.line13b
```

**Implementation:** `computeLine13a()` is called twice in `prepare()`. The first call (inside `computeLine12()`) passes `line13b = null` and produces a preliminary value used internally. After `computeSchedule1A()` finalises `line13b`, `computeLine13a()` is called again with the real `line13b` — that result is the authoritative Form 1040 line 13a.

---

## 4. Line 13a — QBI deduction logic

### 4.1 QBI source types (supported)

| Source | How read |
|---|---|
| 1099-DIV box 5 section 199A dividends | Statement `section199ADividendsAmount`; aggregated with SSN matching |
| K-1 (Form 1065) section 199A fields | `section199AQualifiedBusinessIncomeAmount`, `section199AW2WagesAmount`, `section199AUbiaQualifiedPropertyAmount`, `section199AIsSstb`, REIT/PTP fields |
| K-1 (Form 1120-S) section 199A fields | Same K-1 field set |
| K-1 (Form 1041) section 199A fields | Same K-1 field set |
| Prior-year QBI loss carryforward | Manual entry in `qbi-deduction-taxpayer` / `qbi-deduction-spouse` form |
| Prior-year REIT/PTP loss carryforward | Manual entry in same forms; reduces REIT/PTP component before computing deduction |
| Manual QBI adjustment (supplemental) | Manual entry in `qbi-deduction-taxpayer` form (blocked above threshold) |

### 4.2 Form 8995 / 8995-A routing

```
shouldUseForm8995A(filingStatus, taxableIncomeBeforeQbi):
  if taxableIncomeBeforeQbi > threshold(filingStatus) → Form 8995-A
  else → Form 8995
```

Both forms use the same `taxableIncomeBeforeQbi`; only the QBI component computation differs.

### 4.3 Below-threshold path (Form 8995)

```
netQbi = max(0, qualifiedBusinessIncomeAmount - priorYearQbiLossCarryforward)
qbiDeductionComponent = 20% × netQbi
netReitPtp = max(0, qualifiedReitAndPtpAmount - priorYearReitPtpLossCarryforward)
reitPtpComponent = 20% × netReitPtp
tentativeDeduction = qbiDeductionComponent + reitPtpComponent
taxableIncomeLimitationBase = max(0, taxableIncomeBeforeQbi - netCapitalGainAndQualifiedDividends)
taxableIncomeLimitation = 20% × taxableIncomeLimitationBase
line13a = min(tentativeDeduction, taxableIncomeLimitation)
→ Form 8995 line 15
```

`netCapitalGainAndQualifiedDividends` = `max(line7a, 0) + qualifiedDividends` — the IRS-prescribed formula from Form 8995 instructions.

### 4.4 Above-threshold path (Form 8995-A, per activity)

```
phaseInPct = (taxableIncomeBeforeQbi − threshold) / phaseInRange   [clamped 0–1]

For each K-1 activity:

  if SSTB AND taxableIncomeBeforeQbi ≥ upperThreshold:
    limitedAmount = $0                                 ← fully phased out

  if SSTB AND in phase-in band:
    applicablePct = 1 − phaseInPct
    adjQBI  = activity.QBI  × applicablePct
    adjW2   = activity.W2   × applicablePct
    adjUBIA = activity.UBIA × applicablePct
    tentativeForSstb = 20% × adjQBI
    wageUbiaLimitForSstb = max(50%×adjW2, 25%×adjW2 + 2.5%×adjUBIA)
    limitedAmount = min(tentativeForSstb, wageUbiaLimitForSstb)

  if non-SSTB AND taxableIncomeBeforeQbi ≥ upperThreshold:
    tentative = 20% × activity.QBI
    wageUbiaLimit = max(50%×W2, 25%×W2 + 2.5%×UBIA)
    limitedAmount = min(tentative, wageUbiaLimit)      ← full W-2/UBIA limitation

  if non-SSTB AND in phase-in band:
    tentative = 20% × activity.QBI
    wageUbiaLimit = max(50%×W2, 25%×W2 + 2.5%×UBIA)
    reduction = max(0, tentative − wageUbiaLimit) × phaseInPct
    limitedAmount = tentative − reduction

Total over all activities + REIT/PTP (net of carryforward); apply same taxable income cap.
→ Form 8995-A line 39
```

### 4.5 Carryforwards

- `priorYearQbiLossCarryforward` reduces current-year QBI before computing deduction. Negative net QBI becomes next-year carryforward (not a negative deduction; `line13a >= 0` always).
- `priorYearReitPtpLossCarryforward` reduces current-year REIT/PTP component before computing deduction. Stored on `Form8995.priorYearReitPtpLossCarryforward` and `Form8995A.priorYearReitPtpLossCarryforward`.

### 4.6 Out-of-scope gates (blocking flags)

| Condition | Flag emitted |
|---|---|
| Schedule C or F QBI sources present | `LINE13A_SELF_EMPLOYMENT_OUT_OF_SCOPE_TAXPAYER/SPOUSE` |
| Cooperative patron of agricultural/horticultural cooperative | `LINE13A_COOPERATIVE_PATRON_UNSUPPORTED` |
| Manual QBI adjustment with above-threshold income | `LINE13A_MANUAL_QBI_THRESHOLD_UNSUPPORTED` |
| Negative K-1 QBI with above-threshold income | `LINE13A_NEGATIVE_K1_QBI_THRESHOLD_UNSUPPORTED` |
| Above threshold but no K-1 activity details | `LINE13A_COMPLEX_QBI_THRESHOLD_UNSUPPORTED` |
| K-1 missing section 199A fields | `LINE13A_MISSING_K1_*_199A_DETAILS_TAXPAYER/SPOUSE` |

---

## 5. Line 13b — Schedule 1-A logic

### 5.1 Part I — MAGI (Schedule 1-A line 3)

```
MAGI = AGI(line11b) + Puerto Rico exclusion + Form2555.line45 + Form2555.line50 + Form4563.line15
```

- Form 2555 values: preferentially pulled from computed Form 2555 output; falls back to manual entries in `additional-deductions-taxpayer` form.
- MAGI drives phaseouts for Parts II, III, IV, V.

### 5.2 Part II — Tips (line 13)

**Eligibility gate:** `!isMarried || isMfj` (MFS excluded) AND taxpayer/spouse has valid SSN AND `taxpayerReceivedQualifiedTips = true` AND `taxpayerTippedOccupationConfirmed = true`.

**Sources:**
- W-2 box 7 (`socialSecurityTipsAmount`) filtered to taxpayer or spouse SSN
- Form 4137 line 4 (`unreportedTips`) from `computeForm4137()` for tip-income-taxpayer/spouse
- 1099-NEC entries where `isTipIncome = true` and `recipientTIN` SSN-matches taxpayer or spouse; amount capped by `taxpayerTradeTipsNetIncomeCap` / `spouseTradeTipsNetIncomeCap` when set
- Manual entry: `taxpayerManualTipsFromNonStatementSources` / `spouseManualTipsFromNonStatementSources`

**Computation:**
```
totalRawTips = w2Box7 + form4137Line4 + necTips(capped) + manual  (taxpayer + spouse if MFJ)
capped = min(totalRawTips, $25,000)
excessMAGI = max(0, MAGI - threshold)
phaseoutBuckets = floor(excessMAGI / 1000)           ← round DOWN
phaseout = phaseoutBuckets × $100
line13TipsDeduction = max(0, capped - phaseout)
```

**Multiple employers:** When tips come from more than one employer and total tips exceed $25,000, the IRS Schedule 1-A instructions include a multiple-employer allocation worksheet that allocates the cap proportionally across employers. The total deduction computed here is mathematically identical to the worksheet result. The UI surfaces `taxpayerHasMultipleTipEmployers` / `spouseHasMultipleTipEmployers` with an informational note.

### 5.3 Part III — Overtime (line 21)

**Eligibility gate:** Same MFJ/SSN gate as Part II.

**Sources:** Manual entries only — `taxpayerOvertimeFromW2Box1Amount` + `taxpayerOvertimeFromNonW2SourcesAmount` (no auto-import from statements).

**Computation:** Same phaseout formula as tips; cap is $12,500 single / $25,000 MFJ.

### 5.4 Part IV — Car loan interest (line 30)

**Eligibility gate:** No MFJ restriction; any filing status. Gated by `paidCarLoanInterestOnNewVehicle = true` and at least one vehicle in `carLoanVehicles` list.

**Per-vehicle net:**
```
rawInterest = vehicleLoanInterestPaidAmount
if vehicleWasRefinanced AND originalPrincipal < refinancedBalance:
    rawInterest = rawInterest × (vehicleOriginalLoanPrincipal / vehicleRefinancedLoanBalance)
net = rawInterest
    − interestAlreadyDeductedOnScheduleEAmount   (rental)
    − interestAlreadyDeductedOnScheduleCAmount   (business — prevents double-deduction)
    − interestAlreadyDeductedOnScheduleFAmount   (farming — prevents double-deduction)
net = max(0, net)
```

**Computation:**
```
totalNetInterest = sum of net per-vehicle
capped = min(totalNetInterest, $10,000)
excessMAGI = max(0, MAGI - threshold)
phaseoutBuckets = ceil(excessMAGI / 1000)            ← round UP
phaseout = phaseoutBuckets × $200
line30CarLoanDeduction = max(0, capped - phaseout)
```

### 5.5 Part V — Senior deduction (line 37)

**Eligibility gate:** Same MFJ/SSN gate. Taxpayer or spouse born before January 2, 1961. Derives from `taxpayerBornBeforeJan2_1961` field; falls back to `dateOfBirth` from identification form.

**Computation:**
```
eligibleCount = (taxpayerSeniorEligible ? 1 : 0) + (spouseSeniorEligible ? 1 : 0)
seniorBase = eligibleCount × $6,000
phaseout = 6% × max(0, MAGI - threshold)
line37SeniorDeduction = max(0, seniorBase - phaseout)
```

**AMT treatment:** `line37` is added back to AMTI in Form 6251 (implemented at `computeLine17()` ~line 8093).

### 5.6 Line 38 total

```
line38 = line13TipsDeduction + line21OvertimeDeduction + line30CarLoanDeduction + line37SeniorDeduction
→ Form1040.line13b = line38
```

---

## 6. Backend implementation

### 6.1 Core methods (`TaxReturnComputeService.java`)

| Method | Approx line | Purpose |
|---|---|---|
| `computeLine13a()` | ~2949 | QBI deduction routing + Form 8995/8995-A computation |
| `collectQbiInputsForPerson()` | ~3100 | Aggregates QBI inputs per person from statements + manual form |
| `validateQbiStatementGating()` | ~3350 | Flags missing K-1 section 199A details; flags cooperative patron |
| `validateQbiThresholdPath()` | ~3390 | Flags unsupported above-threshold paths (manual, negative K-1) |
| `compute8995AQbiDeductionComponent()` | ~3448 | Above-threshold W-2/UBIA limitation with SSTB applicable-percentage and phase-in, per activity |
| `computeQbiWageUbiaLimit()` | ~3508 | W-2/UBIA limit: max(50%×W2, 25%×W2 + 2.5%×UBIA) |
| `shouldUseForm8995A()` | ~3569 | Threshold routing gate |
| `sum1099NecTipsForSsn()` | ~16xxx | Scans 1099-NEC entries for `isTipIncome=true` with SSN match |
| `computeSchedule1A()` | ~16773 | Full Schedule 1-A Parts I–V computation |
| `computeTipsOvertimePhaseout()` | ~16xxx | Round-down phaseout helper (tips + overtime) |
| `computeCarLoanPhaseout()` | ~16xxx | Round-up phaseout helper (car loan) |
| `computeSeniorPhaseout()` | ~16xxx | Continuous 6% phaseout helper (senior) |

### 6.2 Flags emitted

| Flag code | Blocking | Condition |
|---|---|---|
| `LINE13A_SELF_EMPLOYMENT_OUT_OF_SCOPE_TAXPAYER` | Yes | `hasScheduleCOrScheduleFQbiSources = true` for taxpayer |
| `LINE13A_SELF_EMPLOYMENT_OUT_OF_SCOPE_SPOUSE` | Yes | Same for spouse |
| `LINE13A_MISSING_K1_1065_199A_DETAILS_TAXPAYER` | Yes | K-1 1065 uploaded but has no section 199A fields |
| `LINE13A_MISSING_K1_1065_199A_DETAILS_SPOUSE` | Yes | Same for spouse |
| `LINE13A_MISSING_K1_1120S_199A_DETAILS_TAXPAYER` | Yes | K-1 1120-S uploaded but no 199A fields |
| `LINE13A_MISSING_K1_1041_199A_DETAILS_TAXPAYER` | Yes | K-1 1041 uploaded but no 199A fields |
| `LINE13A_MANUAL_QBI_THRESHOLD_UNSUPPORTED` | Yes | Manual QBI adjustment used when above threshold |
| `LINE13A_NEGATIVE_K1_QBI_THRESHOLD_UNSUPPORTED` | Yes | Negative K-1 QBI above threshold (netting not supported) |
| `LINE13A_COMPLEX_QBI_THRESHOLD_UNSUPPORTED` | Yes | Above threshold but no K-1 activity details available |
| `LINE13A_COOPERATIVE_PATRON_UNSUPPORTED` | Yes | `isCooperativePatronOfAgriculturalHorticulturalCooperative = true` |

### 6.3 Output models

- **`Form8995.java`**: `qualifiedBusinessIncomeAmount`, `priorYearQualifiedBusinessLossCarryforward`, `netQualifiedBusinessIncomeAfterCarryforward`, `qualifiedReitAndPtpAmount`, `priorYearReitPtpLossCarryforward`, `netQualifiedReitAndPtpAmount`, `tentativeQualifiedBusinessIncomeDeduction`, `taxableIncomeBeforeQualifiedBusinessIncomeDeduction`, `netCapitalGainAndQualifiedDividends`, `taxableIncomeLimitation`, `line15QualifiedBusinessIncomeDeduction`
- **`Form8995A.java`**: Same fields, `line39QualifiedBusinessIncomeDeduction` instead of `line15`
- **`Schedule1A.java`**: `magi`, `line13TipsDeduction`, `line21OvertimeDeduction`, `line30CarLoanInterestDeduction`, `line37EnhancedSeniorDeduction`, `line38Total`, `taxpayerSeniorEligible`, `spouseSeniorEligible`, header
- **`Deductions.java`** fields: `qualifiedBusinessIncomeDeduction` (= line 13a), `additionalDeductions` (= line 13b)

### 6.4 ReferenceData.java constants

```
QBI_DEDUCTION_RATE                    = 0.20
QBI_THRESHOLD_MFJ                     = 394600
QBI_THRESHOLD_ALL_OTHER               = 197300
QBI_PHASEIN_RANGE_MFJ                 = 100000
QBI_PHASEIN_RANGE_ALL_OTHER           =  50000
QBI_W2_LIMIT_RATE                     = 0.50
QBI_W2_LIMIT_ALTERNATIVE_WAGES_RATE   = 0.25
QBI_W2_LIMIT_ALTERNATIVE_UBIA_RATE    = 0.025

SCHEDULE_1A_TIPS_CAP                  = 25000
SCHEDULE_1A_TIPS_PHASEOUT_SINGLE      = 150000
SCHEDULE_1A_TIPS_PHASEOUT_MFJ         = 300000
SCHEDULE_1A_TIPS_OVERTIME_STEP_AMOUNT = 100      ← $100 per $1k, round DOWN
SCHEDULE_1A_OVERTIME_CAP_SINGLE       = 12500
SCHEDULE_1A_OVERTIME_CAP_MFJ          = 25000
SCHEDULE_1A_CAR_LOAN_CAP              = 10000
SCHEDULE_1A_CAR_LOAN_PHASEOUT_SINGLE  = 100000
SCHEDULE_1A_CAR_LOAN_PHASEOUT_MFJ     = 200000
SCHEDULE_1A_CAR_LOAN_STEP_AMOUNT      = 200      ← $200 per $1k, round UP
SCHEDULE_1A_SENIOR_BASE_PER_PERSON    = 6000
SCHEDULE_1A_SENIOR_PHASEOUT_SINGLE    = 75000
SCHEDULE_1A_SENIOR_PHASEOUT_MFJ       = 150000
SCHEDULE_1A_SENIOR_PHASEOUT_RATE      = 0.06
```

---

## 7. Frontend / YAML

### 7.1 Personal forms

| Form ID | Person | Coverage |
|---|---|---|
| `qbi-deduction-taxpayer` | Taxpayer | Statement upload confirmation, out-of-scope screening (incl. cooperative patron), prior-year QBI + REIT/PTP carryforward, supplemental manual adjustment |
| `qbi-deduction-spouse` | Spouse | Same (spouse-prefixed fields) |
| `additional-deductions-taxpayer` | Taxpayer | All of Schedule 1-A Parts I–V for taxpayer + Part IV car loan vehicles (with refinancing + all three schedule exclusions) |
| `additional-deductions-spouse` | Spouse | Parts II, III, V spouse amounts only (Part IV is return-level on taxpayer form) |

### 7.2 YAML files

- `C:\us-tax\yamls\13a-qualified-business-income-taxpayer.yaml`
- `C:\us-tax\yamls\13a-qualified-business-income-spouse.yaml`
- `C:\us-tax\yamls\13b-additional-deductions-taxpayer.yaml`
- `C:\us-tax\yamls\13b-additional-deductions-spouse.yaml`

### 7.3 Angular components

- `form-qbi-deduction.component.ts` / `.html` — line 13a intake
- `form-additional-deductions.component.ts` / `.html` — line 13b intake (handles both taxpayer and spouse person)
- `form-1099-nec.component.ts` — `isTipIncome` checkbox for 1099-NEC tip flagging
- Tax return display: `form-tax-return-8995.component.ts`, `form-tax-return-8995a.component.ts`, `form-tax-return-schedule-1a.component.ts`
- Sidebar: QBI in Deductions section; Schedule 1-A in Deductions section; conditionally shown when computed data exists

---

## 8. Test coverage

### 8.1 Unit tests (`TaxReturnComputeServiceTest.java`) — 368 total as of 2026-04-17

**Line 13a — QBI (7 tests):**
1. `computesLine13aFrom1099DivSection199ADividendsAndCarryforward` — 1099-DIV box 5 + carryforward; Form 8995
2. `computesLine13aFromK1Section199AFieldsBelowThreshold` — K-1 1065 below threshold; Form 8995
3. `computesLine13aFromK1Section199AFieldsAboveThresholdUsingForm8995A` — K-1 above threshold; Form 8995-A; W-2 limit applied
4. `flagsLine13aWhenUploadedK1MissingStable199ADetails` — missing 199A fields → blocking flag
5. `flagsLine13aWhenComplexThresholdNeedsUnsupported8995APath` — manual QBI above threshold → blocking flag
6. `computesLine13aWithCorrectTaxableIncomeWhenSchedule1ADeductionsPresent` — second-pass line13b subtraction ($10k 1-A → taxIncBeforeQbi reduced → limitation $4,850 not $6,000)
7. `computesLine13aWithReitPtpLossCarryforward` — gross REIT/PTP $15k − carryforward $5k = net $10k → deduction $2k
8. `line13aSstbActivityInPhaseInBandGetsPartialDeduction` — SSTB K-1 at $220k single → applicable pct 0.546 → deduction $10,920
9. `flagsLine13aCooperativePatronUnsupported` — cooperative patron flag emitted

**Line 13b — Schedule 1-A (13 tests):**
1. `schedule1ATipsDeductionBelowPhaseout` — $5k tips single, below $150k → $5k
2. `schedule1ATipsDeductionPhasedOut` — $20k tips, MAGI $160k → $19k
3. `schedule1AOvertimeDeductionSingle` — $8k overtime below cap → $8k
4. `schedule1AOvertimeDeductionCappedAtMfjLimit` — $35k total MFJ → capped at $25k
5. `schedule1ACarLoanInterestWithPhaseout` — $3k loan, MAGI $105k → $2k after phaseout
6. `schedule1ASeniorDeductionTaxpayerEligible` — DOB 1955, AGI $50k → $6k
7. `schedule1ASeniorDeductionMfjBothEligibleWithPhaseout` — both spouses, AGI $180k → $10,200
8. `schedule1AMarriedFilingSeparatelyBlocksPerPersonParts` — MFS: tips $0, senior $0, car loan $2k still applies
9. `schedule1ACombinedMultipleParts` — tips + overtime + car loan combined
10. `schedule1ANecTradeTipsAutoImport` — W-2 box 7 $1k + 1099-NEC `isTipIncome` $2k = $3k
11. `schedule1ANecTradeTipsCappedByNetIncomeCap` — $8k NEC tips capped by $5k cap field → $5k
12. `schedule1ACarLoanRefinancingProportionalizesInterest` — $2k × (20k/25k) = $1,600 deduction
13. `schedule1ACarLoanScheduleCAndFExclusionsReduceDeductibleInterest` — $3k − $800 Sched C − $200 Sched F = $2k

### 8.2 E2E tests

**line13a-qbi-deduction.spec.ts (3 tests):**
1. 1099-DIV box 5 + carryforward → Form 8995 line 15 = 240
2. Self-employment QBI marked → blocking flag emitted, Form 8995 null
3. K-1 1065 section 199A → Form 8995 line 15 = 100

**line13b-additional-deductions.spec.ts (8 tests):**
1. Single tips below phaseout → line13 = $5,000
2. MFJ combined tips → line13 = $22,000
3. Overtime single → line21 = $10,000
4. Car loan below phaseout → line30 = $4,000
5. Senior deduction eligible → line37 = $6,000
6. Combined tips + overtime + car loan → line38 = $7,500
7. MFS: tips blocked, car loan still applies → line30 = $2,000
8. Tips phaseout (single, MAGI $160k, W-2 box 7 $20k → line13 = $19,000)

**line14-total-deductions.spec.ts (5 tests cross-reference 13a/13b):**
- line14 = line12e + line13a + line13b verified across standard-only, tips 13b, overtime 13b, K-1 13a, and combined scenarios

---

## 9. Known gaps

None. All implementation gaps resolved as of 2026-04-17.
