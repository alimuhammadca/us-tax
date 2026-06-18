// ============================================================================
//  Generates: C:\us-tax\XLS\computations\13b.xlsx
//
//  Source-of-truth references:
//    - lines/13ab.md (2025 IRS-verified developer-ready spec; sections 4–8)
//    - dependencies/13ab.md (compute-order: 11b → 12e → 13b → 13a)
//    - knowledge/line-13ab-qbi-additional-deductions.md (renamed via 13a #2)
//    - TaxReturnComputeService.computeSchedule1A() at line ~20350 (orchestrator)
//    - Schedule 1-A Part II tips logic at line ~20415–20477
//    - Schedule 1-A Part III overtime logic at line ~20479–20514
//    - Schedule 1-A Part IV car loan interest logic at line ~20516–20566
//    - Schedule 1-A Part V senior deduction logic at line ~20568–20607
//    - Phaseout helpers: computeTipsOvertimePhaseout (~20684; round DOWN),
//      computeCarLoanPhaseout (~20698; round UP), computeSeniorPhaseout (~20711)
//    - Sources helpers: sumW2Box7TipsForSsn (~20647), sum1099NecTipsForSsn (~20665)
//    - ReferenceData.java:79–98 (SCHEDULE_1A_* constants — 13 total)
//    - IRS 2025 Schedule 1-A (Form 1040) + 2025 instructions
//    - call site: prepare() at line ~723 (where computeSchedule1A is invoked)
//
//  Tax year: 2025
//
//  Concept:
//    Line 13b = Schedule 1-A line 38 = Part II + Part III + Part IV + Part V totals
//      line13TipsDeduction (line 13)
//    + line21OvertimeDeduction (line 21)
//    + line30CarLoanInterestDeduction (line 30)
//    + line37EnhancedSeniorDeduction (line 37)
//
//    Schedule 1-A is brand-new for 2025 (OBBBA — One Big Beautiful Bill Act).
//    All four parts use MAGI (Schedule 1-A Part I line 3) for phaseout.
//
//    MAGI = AGI(line 11b) + Puerto Rico exclusion + Form 2555 line 45
//                         + Form 2555 line 50 + Form 4563 line 15
//
//    Per-part computation:
//      Part II (tips):
//        raw = W-2 box 7 (SSN-matched) + Form 4137 line 4 + 1099-NEC trade tips (capped)
//              + manual entries (taxpayer + spouse if MFJ)
//        capped = min(raw, $25,000)
//        phaseout = floor((MAGI − threshold) / $1k) × $100  (round DOWN)
//        line13 = max(0, capped − phaseout)
//
//      Part III (overtime):
//        raw = manual W-2 box 1 portion + manual non-W2 portion (per spouse if MFJ)
//        capped = min(raw, $12,500 single or $25,000 MFJ)
//        phaseout = floor((MAGI − threshold) / $1k) × $100  (round DOWN; same as tips)
//        line21 = max(0, capped − phaseout)
//
//      Part IV (car loan interest) — NO MFJ restriction:
//        per-vehicle net = paid × (origPrincipal/refiBalance if refinanced)
//                          − Schedule E exclusion − Schedule C exclusion − Schedule F exclusion
//        totalNet = sum per-vehicle (floored at 0 per vehicle)
//        capped = min(totalNet, $10,000)
//        phaseout = ceil((MAGI − threshold) / $1k) × $200  (round UP)
//        line30 = max(0, capped − phaseout)
//
//      Part V (senior deduction):
//        eligibleCount = (taxpayerSeniorEligible ? 1 : 0) + (spouseSeniorEligible ? 1 : 0 if MFJ)
//        seniorBase = eligibleCount × $6,000
//        phaseout = 0.06 × max(0, MAGI − threshold)  (continuous, not bucketed)
//        line37 = max(0, seniorBase − phaseout)
//
//      Total: line38 = line13 + line21 + line30 + line37
//        → Form 1040 line 13b
//
//    Filing-status gates (per spec §§5.1, 6.1, 8.1):
//      Parts II, III, V: MFJ-only when married — MFS taxpayer CANNOT claim
//      Part IV: NO MFJ restriction — applies to any filing status
//
//  Critical 2025 compute-order rule:
//    Schedule 1-A is computed FIRST (line 13b authoritative), THEN
//    computeLine13a re-invokes (second pass) using the resolved line13b for
//    taxIncBeforeQbi = AGI − line12e − line13b. See 13a #5 two-pass breadcrumb.
//
//  Line 13b audit positioning (PAIR-COMPLETION):
//   • 2nd and FINAL sub-line in the 13ab tightly-coupled pair (mirrors 7ab + 11ab)
//   • Cumulative position: 39th line; 2nd audit OUTSIDE the 12abcde cluster
//   • CLOSES the 13ab pair across all dimensions:
//       (a) Verification log row 2 (pair-completion at 2 rows = SMALLEST pair-log shape)
//       (b) Sibling-mate knowledge cross-reference (no new rename; 13a #2 migrated)
//       (c) Cross-reference seed: 13a #4 PAIR seed → 13b #4 extension (PAIR COMPLETE)
//
//  Line 13b audit angles (10 issues):
//   1. ⚠️ HIGH-PRIORITY MFS DEFENSIVE GAP — computeSchedule1A's Part I MAGI
//       unconditionally adds spouse Form 2555 line 45 + line 50 to MAGI. On MFS,
//       stale spouse Form 2555 inflates MAGI → reduces Part IV car-loan-interest
//       deduction (the only Part that runs on MFS). Defense-in-depth null-shadow
//       at call site. Adds 17th orchestrator to the MFS-guard cascade (new max).
//   2. DOCUMENTATION HYGIENE — Knowledge file sibling-mate cross-reference
//       (no rename; shared file already migrated via 13a #2). Convergence unchanged.
//   3. SPEC ENHANCEMENT — Verification log row 2 appended; PAIR COMPLETE at 2 rows
//       (SMALLEST pair-log shape in workflow; mirrors 7ab + 11ab).
//   4. CROSS-REFERENCE EXTENSION — 13a #4 PAIR-scale seed → 13b #4 extension at
//       line-14 sum site. Closes the pair-scale seed → extend × 1 pattern.
//   5. VERIFIED CORRECT — Part II tips computation (sources + cap + phaseout +
//       MFJ-only gate + multiple-employer worksheet equivalence).
//   6. VERIFIED CORRECT — Part III overtime computation (filing-status-specific
//       cap + same phaseout as tips + sources from manual fields only).
//   7. VERIFIED CORRECT — Part IV car loan interest (NO MFJ restriction;
//       refinancing proportionalization; Schedule C/E/F double-deduction prevention;
//       round-UP phaseout; integer buckets via CEILING).
//   8. VERIFIED CORRECT — Part V senior deduction (DOB-derived or explicit-flag
//       eligibility; continuous 6% phaseout; AMTI add-back via Form 6251 line 1w).
//   9. OBSERVATION — Multiple-employer tip-cap allocation: IRS Schedule 1-A
//       instructions Part II have an "allocation worksheet" for multi-employer tips;
//       backend aggregates and caps once. Mathematically equivalent per knowledge §5.2.
//       Anti-fragmentation policy (10th Path A application).
//  10. BOUNDARY MILESTONE — CLOSES the 13ab pair-completion audit across all
//       dimensions (Verification log row 2; sibling-mate cascade; pair-scale seed
//       extension; PAIR COMPLETE at every dimension). 39th line audited.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '13b.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 13b — ADDITIONAL DEDUCTIONS FROM SCHEDULE 1-A LINE 38'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 13b (page 2; numeric amount; NEW for 2025 per OBBBA)'],
  ['Concept',
    'Sum of 4 new deductions introduced by OBBBA (One Big Beautiful Bill Act, 2025): ' +
    'tips (Part II) + overtime (Part III) + car loan interest (Part IV) + enhanced senior (Part V). ' +
    'Sourced exclusively from Schedule 1-A line 38. PAIR-completion audit closing the 13ab pair.'],
  ['Mapping (spec §4.1)', 'line13b = Schedule1A.line38 = line13 + line21 + line30 + line37'],
  ['Filing-status gates',
    'Parts II / III / V (tips, overtime, senior) are MFJ-only when married — MFS filers cannot claim.\n' +
    'Part IV (car loan interest) has NO MFJ restriction — applies to any filing status.\n' +
    'Backend: `eligibleForPerPersonParts = !isMarried || isMfj` gates Parts II/III/V at line ~20376.'],
  ['Critical compute order',
    'Schedule 1-A computed FIRST (line 13b authoritative), THEN computeLine13a second-pass uses\n' +
    'taxIncBeforeQbi = AGI − line12e − line13b (per spec §9 + IRS Form 8995 instructions).\n' +
    'See 13a #5 two-pass breadcrumb at TaxReturnComputeService.java:~763.'],
  ['Output target', 'form1040.deductions.additionalDeductions (BigDecimal; whole-dollar HALF_UP) = schedule1A.line38Total'],
  ['Backend method', 'computeSchedule1A() in TaxReturnComputeService.java at line ~20350; called from prepare() at line ~723 (single-pass)'],
  ['IRS source',
    'IRS 2025 Schedule 1-A (Form 1040) + 2025 instructions. Statutory anchor: OBBBA 2025 (One Big Beautiful Bill ' +
    'Act) — introduced all 4 new deductions effective tax year 2025. Each Part has its own statutory subsection.'],
  [],
  ['STEP-BY-STEP COMPUTATION — Part I MAGI (Schedule 1-A line 3)'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Compute Modified AGI (MAGI) — the base for all phaseouts',
    'MAGI = AGI(line 11b) + Puerto Rico excluded income + Form 2555 line 45 (FEIE) + Form 2555 line 50 ' +
    '(housing exclusion) + Form 4563 line 15 (American Samoa exclusion)\n' +
    'Per spec §4.3 + Schedule 1-A line 2a/2b/2c/2d. Form 2555 values prefer computed (taxpayer + spouse on MFJ); ' +
    'fall back to manual entries on additional-deductions-taxpayer form.\n' +
    '⚠️ MFS GAP: spouse Form 2555 values added unconditionally; see Code Validation #1.'],
  [],
  ['STEP-BY-STEP COMPUTATION — Part II Tips (Schedule 1-A line 13)'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Filing-status gate (MFJ-only when married)', '`eligibleForPerPersonParts = !isMarried || isMfj` — false on MFS → tips = $0.'],
  [2, 'Eligibility gates (per spouse)',
    'Each spouse independently: `taxpayerReceivedQualifiedTips=true` AND `taxpayerTippedOccupationConfirmed=true` ' +
    '(spouse: same with `spouse` prefix, MFJ only). Both spouses must have valid SSN per spec §5.1.'],
  [3, 'Sum raw qualified tips per person',
    'rawTips = W-2 box 7 (SSN-matched; sumW2Box7TipsForSsn) + Form 4137 line 4 (unreported tips) +\n' +
    '          manual entry (taxpayerManualTipsFromNonStatementSources) +\n' +
    '          1099-NEC trade tips (sum1099NecTipsForSsn, capped by taxpayerTradeTipsNetIncomeCap if set)'],
  [4, 'Combine taxpayer + spouse if MFJ', 'totalRaw = taxpayerRawTips + spouseRawTips (combined cap; not per-person)'],
  [5, 'Apply cap', 'capped = min(totalRaw, $25,000)'],
  [6, 'Apply phaseout (round DOWN)',
    'threshold = $150,000 (single) or $300,000 (MFJ)\n' +
    'phaseout = floor((MAGI − threshold) / $1k) × $100  → integer buckets (FLOOR rounding)\n' +
    'line13 = max(0, capped − phaseout)'],
  [],
  ['STEP-BY-STEP COMPUTATION — Part III Overtime (Schedule 1-A line 21)'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Filing-status gate (MFJ-only when married)', 'Same `eligibleForPerPersonParts` gate as Part II.'],
  [2, 'Eligibility gates (per spouse)',
    '`taxpayerReceivedQualifiedOvertime=true` (spouse: same with prefix). Valid SSN required per spec §6.1.'],
  [3, 'Sum raw qualified overtime per person',
    'rawOvertime = taxpayerOvertimeFromW2Box1Amount + taxpayerOvertimeFromNonW2SourcesAmount\n' +
    'NOTE: No statement-import path — fully manual entry (per spec §6.2).'],
  [4, 'Combine taxpayer + spouse if MFJ', 'totalRaw = taxpayerRawOvertime + spouseRawOvertime'],
  [5, 'Apply filing-status-specific cap',
    'cap = $12,500 (single/HOH/QSS) or $25,000 (MFJ)\n' +
    'capped = min(totalRaw, cap)'],
  [6, 'Apply phaseout (round DOWN, same shape as tips)',
    'threshold = $150,000 (single) or $300,000 (MFJ)  — same thresholds as tips\n' +
    'phaseout = floor((MAGI − threshold) / $1k) × $100  (FLOOR rounding)\n' +
    'line21 = max(0, capped − phaseout)'],
  [],
  ['STEP-BY-STEP COMPUTATION — Part IV Car Loan Interest (Schedule 1-A line 30)'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'NO filing-status restriction', 'Part IV available regardless of filing status — runs on MFS, Single, MFJ, HOH, QSS.'],
  [2, 'Eligibility gate', 'taxpayerHadInputs AND paidCarLoanInterestOnNewVehicle=true AND carLoanVehicles list non-empty.'],
  [3, 'Per-vehicle: raw interest paid',
    'paid = vehicleLoanInterestPaidAmount'],
  [4, 'Per-vehicle: refinancing proportionalization (if applicable)',
    'IF vehicleWasRefinanced AND originalPrincipal < refinancedBalance:\n' +
    '  paid = paid × (vehicleOriginalLoanPrincipal / vehicleRefinancedLoanBalance)\n' +
    'Rationale: only the portion attributable to purchase-money principal is deductible.'],
  [5, 'Per-vehicle: subtract Schedule C/E/F exclusions',
    'net = max(0, paid − interestAlreadyDeductedOnScheduleEAmount\n' +
    '              − interestAlreadyDeductedOnScheduleCAmount\n' +
    '              − interestAlreadyDeductedOnScheduleFAmount)\n' +
    'Prevents double-deduction of interest already claimed on Schedule C (business), E (rental), or F (farm).'],
  [6, 'Sum across all vehicles', 'totalNet = Σ per-vehicle net'],
  [7, 'Apply cap', 'capped = min(totalNet, $10,000)'],
  [8, 'Apply phaseout (round UP)',
    'threshold = $100,000 (single) or $200,000 (MFJ)\n' +
    'phaseout = ceil((MAGI − threshold) / $1k) × $200  → integer buckets (CEILING rounding; opposite of tips/overtime)\n' +
    'line30 = max(0, capped − phaseout)'],
  [],
  ['STEP-BY-STEP COMPUTATION — Part V Senior Deduction (Schedule 1-A line 37)'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Filing-status gate (MFJ-only when married)', 'Same `eligibleForPerPersonParts` gate as Parts II/III.'],
  [2, 'Per-spouse eligibility derivation',
    'taxpayerSeniorEligible = (taxpayerBornBeforeJan2_1961 if explicitly set)\n' +
    '                       OR (dateOfBirth ≤ Jan 1, 1961, via isBornBeforeJan2_1961)\n' +
    'Same for spouse if MFJ. Per IRC §63(f)(1)(A) day-before-65 rule (12d #5 + 12d #6).'],
  [3, 'Count eligibles', 'eligibleCount = (taxpayer eligible ? 1 : 0) + (spouse eligible ? 1 : 0)  // 0/1/2'],
  [4, 'Compute base', 'seniorBase = eligibleCount × $6,000'],
  [5, 'Apply continuous 6% phaseout (NOT bucketed)',
    'threshold = $75,000 (single) or $150,000 (MFJ)\n' +
    'phaseout = 0.06 × max(0, MAGI − threshold)  — exact rate, not integer buckets\n' +
    'line37 = max(0, seniorBase − phaseout)'],
  [],
  ['STEP-BY-STEP COMPUTATION — Schedule 1-A Line 38 Total → Form 1040 Line 13b'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Sum all 4 Parts', 'line38Total = line13Tips + line21Overtime + line30CarLoan + line37Senior'],
  [2, 'Persist on Schedule1A output model',
    'schedule1A.setLine38Total(line38Total)\n' +
    'Wired into Form 1040 in prepare() at line ~745: form1040.getDeductions().setAdditionalDeductions(line13b)'],
  [3, 'Triggers line 13a second pass (per 13a #5)',
    'If line38Total > 0, prepare() at line ~766 re-invokes computeLine13a with the resolved line13b,\n' +
    'producing the authoritative taxIncBeforeQbi = AGI − line12e − line13b → final line 13a.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 35 }, { wch: 70 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 13b'],
  ['Schedule 1-A draws from per-person personal forms + 5 statement types + 2 computed forms (Form 2555 + Form 4137). Three eligibility-gate booleans control which Parts compute.'],
  [],
  ['#', 'Source', 'Field', 'Type', 'Role', 'XLS input form reference'],
  // Gate booleans
  [1, 'additional-deductions-taxpayer form', 'hadAdditionalDeductions', 'Boolean', 'Top-level gate — when false AND spouse gate false, entire Schedule 1-A returns null', 'XLS/input_forms/form-additional-deductions.xlsx'],
  [2, 'additional-deductions-spouse form', 'spouseHasAdditionalDeductionInputs', 'Boolean', 'Spouse-side gate; same shape as taxpayer', 'XLS/input_forms/form-additional-deductions.xlsx'],
  // Part I MAGI
  [3, 'computed Adjustments (line 11b)', 'line11bAmountFromLine11aAdjustedGrossIncome (AGI)', 'BigDecimal', 'Base for MAGI; subtrahend for all phaseouts', '(internal — line 11ab computation)'],
  [4, 'additional-deductions-taxpayer form', 'puertoRicoExcludedIncome', 'BigDecimal', 'Schedule 1-A line 2a (PR exclusion)', 'XLS/input_forms/form-additional-deductions.xlsx'],
  [5, 'computed Form 2555', 'foreignEarnedIncomeExclusion (line 45)', 'BigDecimal', 'Schedule 1-A line 2b (FEIE); prefer computed; fallback manual', '(internal — Form 2555 computation)'],
  [6, 'computed Form 2555', 'housingExclusionAmount (line 50)', 'BigDecimal', 'Schedule 1-A line 2c (housing exclusion); prefer computed', '(internal — Form 2555 computation)'],
  [7, 'additional-deductions-taxpayer form', 'form4563Line15ExcludedIncome', 'BigDecimal', 'Schedule 1-A line 2d (American Samoa Form 4563 line 15)', 'XLS/input_forms/form-additional-deductions.xlsx'],
  // Part II tips
  [8, 'additional-deductions-taxpayer form', 'taxpayerReceivedQualifiedTips', 'Boolean', 'Part II eligibility gate (per IRS Tipped Occupations list — IRS.gov/TippedOccupations)', 'XLS/input_forms/form-additional-deductions.xlsx'],
  [9, 'additional-deductions-taxpayer form', 'taxpayerTippedOccupationConfirmed', 'Boolean', 'Part II occupation confirmation gate', 'XLS/input_forms/form-additional-deductions.xlsx'],
  [10, 'W-2 statement', 'socialSecurityTipsAmount (box 7)', 'BigDecimal', 'Statement-imported tip income; SSN-matched via sumW2Box7TipsForSsn', 'XLS/input_forms/form-w-2.xlsx'],
  [11, 'computed Form 4137', 'line4UnreportedTips', 'BigDecimal', 'Unreported cash tips (allocated W-2 box 8 + manual)', '(internal — Form 4137 computation)'],
  [12, 'additional-deductions-taxpayer form', 'taxpayerManualTipsFromNonStatementSources', 'BigDecimal', 'Manual entry for tips not captured by W-2/Form 4137', 'XLS/input_forms/form-additional-deductions.xlsx'],
  [13, '1099-NEC statement', 'nonemployeeCompensationAmount + isTipIncome=true', 'BigDecimal + Boolean', 'Self-employment / trade tips; SSN-matched via sum1099NecTipsForSsn', 'XLS/input_forms/form-1099-nec.xlsx'],
  [14, 'additional-deductions-taxpayer form', 'taxpayerTradeTipsNetIncomeCap', 'BigDecimal', 'Optional cap on 1099-NEC trade tips per net-income limitation', 'XLS/input_forms/form-additional-deductions.xlsx'],
  [15, 'additional-deductions-taxpayer form', 'taxpayerHasMultipleTipEmployers', 'Boolean', 'Informational flag (does not change computation; see Code Validation #9)', 'XLS/input_forms/form-additional-deductions.xlsx'],
  // Part III overtime
  [16, 'additional-deductions-taxpayer form', 'taxpayerReceivedQualifiedOvertime', 'Boolean', 'Part III eligibility gate', 'XLS/input_forms/form-additional-deductions.xlsx'],
  [17, 'additional-deductions-taxpayer form', 'taxpayerOvertimeFromW2Box1Amount', 'BigDecimal', 'Manual W-2 box 1 overtime portion (no auto-import)', 'XLS/input_forms/form-additional-deductions.xlsx'],
  [18, 'additional-deductions-taxpayer form', 'taxpayerOvertimeFromNonW2SourcesAmount', 'BigDecimal', 'Manual non-W2 overtime (1099 / employer statement)', 'XLS/input_forms/form-additional-deductions.xlsx'],
  // Part IV car loan
  [19, 'additional-deductions-taxpayer form', 'paidCarLoanInterestOnNewVehicle', 'Boolean', 'Part IV eligibility gate (return-level)', 'XLS/input_forms/form-additional-deductions.xlsx'],
  [20, 'additional-deductions-taxpayer form (carLoanVehicles list)', 'vehicleLoanInterestPaidAmount', 'BigDecimal', 'Per-vehicle raw interest paid', 'XLS/input_forms/form-additional-deductions.xlsx'],
  [21, 'additional-deductions-taxpayer form (carLoanVehicles list)', 'vehicleWasRefinanced + vehicleOriginalLoanPrincipal + vehicleRefinancedLoanBalance', 'Boolean + 2× BigDecimal', 'Refinancing limitation — proportionalize interest', 'XLS/input_forms/form-additional-deductions.xlsx'],
  [22, 'additional-deductions-taxpayer form (carLoanVehicles list)', 'interestAlreadyDeductedOnScheduleEAmount', 'BigDecimal', 'Rental Schedule E exclusion (no double-deduction)', 'XLS/input_forms/form-additional-deductions.xlsx'],
  [23, 'additional-deductions-taxpayer form (carLoanVehicles list)', 'interestAlreadyDeductedOnScheduleCAmount', 'BigDecimal', 'Business Schedule C exclusion (no double-deduction)', 'XLS/input_forms/form-additional-deductions.xlsx'],
  [24, 'additional-deductions-taxpayer form (carLoanVehicles list)', 'interestAlreadyDeductedOnScheduleFAmount', 'BigDecimal', 'Farm Schedule F exclusion (no double-deduction)', 'XLS/input_forms/form-additional-deductions.xlsx'],
  [25, 'additional-deductions-taxpayer form (carLoanVehicles list)', 'vehicleVin', 'String', 'VIN required for each applicable passenger vehicle (per spec §7.3)', 'XLS/input_forms/form-additional-deductions.xlsx'],
  // Part V senior
  [26, 'additional-deductions-taxpayer form', 'taxpayerBornBeforeJan2_1961', 'Boolean (nullable)', 'Part V eligibility — explicit override; falls back to dateOfBirth derivation', 'XLS/input_forms/form-additional-deductions.xlsx'],
  [27, 'identification (you/spouse)', 'dateOfBirth', 'String (YYYY-MM-DD)', 'Senior eligibility fallback via isBornBeforeJan2_1961 helper', 'XLS/input_forms/form-identification-*.xlsx'],
  // Filing status + SSN
  [28, 'filing-status form', 'filingStatus', 'String', 'Drives MFJ/MFS gates + caps (overtime $12.5k vs $25k) + phaseout thresholds (single vs MFJ)', 'XLS/input_forms/form-filing-status.xlsx'],
  [29, 'identification (you/spouse)', 'ssn', 'String', 'SSN-matches W-2 box 7 + 1099-NEC trade tips to taxpayer vs spouse', 'XLS/input_forms/form-identification-*.xlsx'],
  // Spouse fields (Part II/III/V on MFJ)
  [30, 'additional-deductions-spouse form', '(parallel field set with `spouse*` prefix)', 'Various', 'Spouse-side inputs for Parts II/III/V on MFJ. ⚠️ NOT used on MFS (eligibleForPerPersonParts gate); spouse Form 2555 leaks into MAGI — see Code Validation #1', 'XLS/input_forms/form-additional-deductions.xlsx'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 60 }, { wch: 22 }, { wch: 75 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Schedule 1-A (Line 13b)'],
  ['All 13 constants centralized in ReferenceData.java:79–98. NEW for 2025 (OBBBA — One Big Beautiful Bill Act).'],
  [],
  ['Constant', 'Value (2025)', 'Statutory Basis', 'Backend identifier'],
  [],
  ['Part II — Tips (spec §5.4)'],
  ['Tips cap (combined)', '$25,000', 'OBBBA 2025 §A.II', 'ReferenceData.SCHEDULE_1A_TIPS_CAP'],
  ['Tips phaseout threshold — Single/HOH/QSS', '$150,000', 'OBBBA 2025 §A.II', 'ReferenceData.SCHEDULE_1A_TIPS_PHASEOUT_SINGLE'],
  ['Tips phaseout threshold — MFJ', '$300,000', 'OBBBA 2025 §A.II', 'ReferenceData.SCHEDULE_1A_TIPS_PHASEOUT_MFJ'],
  [],
  ['Part II + III shared — Phaseout step (round DOWN)'],
  ['Tips/Overtime phaseout step', '$100 per $1k above threshold', 'OBBBA 2025', 'ReferenceData.SCHEDULE_1A_TIPS_OVERTIME_STEP_AMOUNT'],
  [],
  ['Part III — Overtime (spec §6.4)'],
  ['Overtime cap — Single/HOH/QSS', '$12,500', 'OBBBA 2025 §A.III', 'ReferenceData.SCHEDULE_1A_OVERTIME_CAP_SINGLE'],
  ['Overtime cap — MFJ', '$25,000', 'OBBBA 2025 §A.III', 'ReferenceData.SCHEDULE_1A_OVERTIME_CAP_MFJ'],
  ['Overtime phaseout thresholds', '(same as tips: $150k single / $300k MFJ)', 'OBBBA 2025 §A.III', 'reuses SCHEDULE_1A_TIPS_PHASEOUT_* constants'],
  [],
  ['Part IV — Car Loan Interest (spec §7.4)'],
  ['Car loan cap', '$10,000', 'OBBBA 2025 §A.IV', 'ReferenceData.SCHEDULE_1A_CAR_LOAN_CAP'],
  ['Car loan phaseout threshold — Single/HOH/QSS/MFS', '$100,000', 'OBBBA 2025 §A.IV', 'ReferenceData.SCHEDULE_1A_CAR_LOAN_PHASEOUT_SINGLE'],
  ['Car loan phaseout threshold — MFJ', '$200,000', 'OBBBA 2025 §A.IV', 'ReferenceData.SCHEDULE_1A_CAR_LOAN_PHASEOUT_MFJ'],
  ['Car loan phaseout step (round UP)', '$200 per $1k above threshold', 'OBBBA 2025', 'ReferenceData.SCHEDULE_1A_CAR_LOAN_STEP_AMOUNT'],
  [],
  ['Part V — Enhanced Senior Deduction (spec §8.2)'],
  ['Senior deduction per eligible person', '$6,000', 'OBBBA 2025 §A.V', 'ReferenceData.SCHEDULE_1A_SENIOR_BASE_PER_PERSON'],
  ['Senior phaseout threshold — Single/HOH/QSS', '$75,000', 'OBBBA 2025 §A.V', 'ReferenceData.SCHEDULE_1A_SENIOR_PHASEOUT_SINGLE'],
  ['Senior phaseout threshold — MFJ', '$150,000', 'OBBBA 2025 §A.V', 'ReferenceData.SCHEDULE_1A_SENIOR_PHASEOUT_MFJ'],
  ['Senior phaseout rate (continuous)', '6% × excess MAGI', 'OBBBA 2025 §A.V', 'ReferenceData.SCHEDULE_1A_SENIOR_PHASEOUT_RATE = 0.06'],
  [],
  ['Day-before-65 anchor (Part V eligibility)'],
  ['Born-before date for 2025', 'January 2, 1961', 'IRC §63(f)(1)(A) "day before 65th birthday" rule', 'helper isBornBeforeJan2_1961()'],
  [],
  ['Statutory anchors'],
  ['OBBBA 2025 (One Big Beautiful Bill Act)', '— (statute)', 'YES — introduced all 4 Schedule 1-A parts effective TY2025', '—'],
  ['IRC §63(f)(1)(A)', '— (statute)', 'YES — day-before-65 rule for Part V senior eligibility', '—'],
  ['IRS Schedule 1-A 2025 instructions', '— (IRS guidance)', 'YES — operational rules, phaseout formulas, eligibility', '—'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 60 }, { wch: 35 }, { wch: 55 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Schedule 1-A Output Object + Wiring'],
  ['Beyond the line-13b numeric, computeSchedule1A produces a full Schedule1A object + triggers line 13a second-pass + recomputes line 14 + line 15.'],
  [],
  ['Output target', 'Where wired', 'Effect', 'XLS output reference'],
  ['form1040.deductions.additionalDeductions (line 13b)', 'prepare() at line ~745: form1040.getDeductions().setAdditionalDeductions(line38Total)', '★ CANONICAL line 13b output. Whole-dollar HALF_UP. Sourced from schedule1A.line38Total.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 13b cell)'],
  ['Schedule1A.magi', 'computeSchedule1A line ~20624', 'MAGI = AGI + PR + Form 2555 (45 + 50) + Form 4563 line 15. PDF Part I line 3.', 'XLS/output_forms/form-tax-return-schedule-1a.xlsx'],
  ['Schedule1A.line13TipsDeduction', 'computeSchedule1A line ~20625', 'Part II final after cap + phaseout.', 'XLS/output_forms/form-tax-return-schedule-1a.xlsx'],
  ['Schedule1A.line21OvertimeDeduction', 'computeSchedule1A line ~20626', 'Part III final after cap + phaseout.', 'XLS/output_forms/form-tax-return-schedule-1a.xlsx'],
  ['Schedule1A.line30CarLoanInterestDeduction', 'computeSchedule1A line ~20627', 'Part IV final after refinancing + Schedule C/E/F exclusions + cap + phaseout.', 'XLS/output_forms/form-tax-return-schedule-1a.xlsx'],
  ['Schedule1A.line37EnhancedSeniorDeduction', 'computeSchedule1A line ~20628', 'Part V final after continuous 6% phaseout.', 'XLS/output_forms/form-tax-return-schedule-1a.xlsx'],
  ['Schedule1A.line38Total', 'computeSchedule1A line ~20629', '★ Sum of all 4 Parts — feeds Form 1040 line 13b.', 'XLS/output_forms/form-tax-return-schedule-1a.xlsx'],
  ['Schedule1A.taxpayerRawTips / spouseRawTips', 'computeSchedule1A lines ~20630–20631', 'Audit-trail: per-person pre-cap raw amounts.', 'XLS/output_forms/form-tax-return-schedule-1a.xlsx'],
  ['Schedule1A.taxpayerRawOvertime / spouseRawOvertime', 'computeSchedule1A lines ~20632–20633', 'Audit-trail: per-person pre-cap raw amounts.', 'XLS/output_forms/form-tax-return-schedule-1a.xlsx'],
  ['Schedule1A.taxpayerSeniorEligible / spouseSeniorEligible', 'computeSchedule1A lines ~20634–20635', 'Per-spouse eligibility booleans.', 'XLS/output_forms/form-tax-return-schedule-1a.xlsx'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 14 (total deductions)', 'prepare() line ~803 + line ~829 (else)', '★★ line14 = line12e + line13a + line13b. Composite via 13a #4 forward seed.', 'XLS/output_forms/form-tax-return-1040.xlsx'],
  ['Form 1040 line 15 (taxable income)', 'prepare() line ~808 + line ~834 (else)', '★★ line15 = max(0, AGI − line14). First audit with zero-floor rule (future line 15 audit).', 'XLS/output_forms/form-tax-return-1040.xlsx'],
  ['Form 1040 line 13a (QBI) — triggers second pass', 'prepare() line ~766 (per 13a #5)', '★★ Schedule 1-A line38Total > 0 triggers computeLine13a second-pass with authoritative line13b.', 'XLS/output_forms/form-tax-return-1040.xlsx'],
  ['Form 6251 AMTI — line 1w add-back', 'computeLine17 ~line 8093', 'Senior deduction (Part V line 37) is added back to AMTI per OBBBA (does NOT reduce AMT base).', 'XLS/output_forms/form-tax-return-6251.xlsx'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 75 }, { wch: 75 }, { wch: 95 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Schedule 1-A / Line 13b'],
  ['Schedule 1-A intentionally emits NO blocking flags. Eligibility is handled via gating booleans (per spec §10.2). Missing data → silent zero contribution to the corresponding Part.'],
  [],
  ['Flag code', 'Severity', 'Condition', 'Where emitted'],
  ['(None)', 'N/A', 'Schedule 1-A is designed with no blocking flags. Per dependencies/13ab.md §6 — Line 13b flags table is empty.', 'computeSchedule1A — no flags.add() calls'],
  [],
  ['DESIGN RATIONALE'],
  ['Note', 'Detail'],
  ['Eligibility gates handle invalid data', 'If `taxpayerReceivedQualifiedTips=false`, Part II is silently skipped — no error. User saw the gate question and answered no.'],
  ['MFJ-only gates handle filing-status', 'On MFS, Parts II/III/V silently zero out. No flag. User saw filing-status in advance.'],
  ['Multi-employer tip allocation', 'IRS instructions include an allocation worksheet for >1 employer. Backend aggregates and caps once — mathematically equivalent. No flag fires for multi-employer scenario.'],
  ['Refinancing partial deduction', 'If origPrincipal ≥ refiBalance, no proportionalization applied (treated as if not refinanced). No advisory flag.'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 12 }, { wch: 80 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 13b is the Schedule 1-A composite total (tips + overtime + car loan + senior). Sibling pair-completion audit — closes the 13ab pair across all dimensions: Verification log row 2 + sibling-mate knowledge cross-reference + pair-scale seed → extend × 1 pattern. 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-13 — ⚠️ HIGH-PRIORITY MFS DEFENSIVE GAP FIXED at computeSchedule1A (spouse Form 2555 was leaking into Part I MAGI)',
    'computeSchedule1A() at TaxReturnComputeService.java:~20350 has an INLINE filing-status filter at line 20376 (`eligibleForPerPersonParts = !isMarried || isMfj`) that correctly blocks Parts II/III/V on MFS. BUT the Part I MAGI computation at lines 20397+20402 was UNCONDITIONALLY adding spouse Form 2555 line 45 (FEIE) + line 50 (housing exclusion) to MAGI. On MFS this inflated MAGI → pushed the taxpayer past Part IV car-loan-interest phaseout threshold ($100k single/MFS) → silently UNDER-stated the legitimate car-loan-interest deduction (Part IV is the ONLY Part that runs on MFS per spec §7.1). Direction OPPOSITE 13a #1 (over-deduction): taxpayer self-harm via under-deduction. **Closure applied (Option A — call-site null-shadow at prepare() ~line 723; matches 13a #1 + 12a #1 SURGICAL precedent)**: (1) ~38-line breadcrumb above the call site documenting per-field MFS-leakage classification (6 fields total; 2 actual leak vectors: form2555Spouse.foreignEarnedIncomeExclusion + housingExclusionAmount), two-level MFS handling in Schedule 1-A (per-Part gates + MAGI block), the Part-IV-on-MFS-still-runs context, and 17-orchestrator cascade reference; (2) changed `additionalDeductionsSpouse` → `isMfsReturn ? null : additionalDeductionsSpouse` at line ~723 (defense-in-depth); (3) changed `form2555Spouse` → `isMfsReturn ? null : form2555Spouse` at line ~723 (actual leak fix). Null-tolerant downstream: getBoolean(null,...) returns null + existing `form2555Spouse != null` checks at lines 20395+20400. NEW lock-in test `mfsExcludesSpouseForm2555FromSchedule1AMagi`: MFS taxpayer ($80k US wages + $10k taxpayer FEIE) + STALE spouse Form 2555 ($50k spouse FEIE) + $5k car loan interest. Log confirms post-fix: `magi=90000 ... carLoan=5000 line38=5000` — MAGI = AGI ($80k) + taxpayer FEIE ($10k) only; spouse $50k FEIE correctly excluded. Pre-fix would have produced magi=$140k → past $100k threshold → ceil($40k/$1k) × $200 = $8k phaseout → max(0, $5k − $8k) = **$0 Part IV deduction**. **Single-guard MFS cascade now applied to 17 orchestrators — NEW CODEBASE MAXIMUM** (was 16 after 13a #1; second MFS guard added OUTSIDE the 12abcde cluster). Cascade roster (17): 1c + 1d + 1e + 1f + 1g + 1h + 1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities + computeSocialSecurityBenefits + computeCapitalGainLoss + computeOtherIncomes + computeIncomeAdjustments + buildStandardDeductionIndicators + computeLine13a + **computeSchedule1A (NEW)**. Backend: 761 → **762** (+1 lock-in test).',
    'TaxReturnComputeService.java:~720 (38-line MFS breadcrumb); ~723 + ~735 (call-site null-shadows); TaxReturnComputeServiceTest.java:~13206 (mfsExcludesSpouseForm2555FromSchedule1AMagi lock-in test)',
    'CLOSED — MFS guard applied at call site (both deductionsSpouse and form2555Spouse); lock-in test added. Backend 762/762 pass (+1). 17th orchestrator in MFS cascade — new codebase maximum.'],

  [2, 'RESOLVED 2026-05-13 — DOCUMENTATION HYGIENE — Knowledge file sibling-mate cross-reference (pair-complete; no new rename)',
    '**Closure applied** — pure audit-trail confirmation; no file changes. Knowledge file `knowledge/line-13ab-qbi-additional-deductions.md` is SHARED across the 13ab pair; already renamed from Legacy A `knowledge_line13ab.md` via 13a #2 on 2026-05-13 (plain `mv`; folder not under git). **Repo-wide scan** (grep "knowledge_line13ab") found 5 hits, all appropriate historical context: `generate-13b.js` Issue #2 narrative (this row); `outstanding.md` 13a closure entry (historical; precedent: leave); `history.md` original creation 2026-04-17 + 13a #2 rename entry (historical; precedent: leave); `generate-13a.js` Issue #2 narrative (historical; the audit-trail anchor); `lines/13ab.md` Verification log row 1 mentions the rename (historical; precedent: leave). **Zero stale references.** Pair-aligned cross-reference cascade now at **1 sibling-mate** (after 13b #2 today) = closed pair shape = 2-of-2 pair-completion structure (1 rename via 13a #2 + 1 sibling-mate via 13b #2). Same shape as 7ab + 11ab pairs (1 + 1 each). Naming convergence **STAYS at 20 lines** (unchanged from post-13a state). Anti-redundancy pattern reinforced: same as 12abcde cluster (12a #2 migrates; 12b/c/d/e #2 sibling-mate × 4) — but at pair-scale instead of cluster-scale.',
    'C:\\us-tax\\knowledge\\line-13ab-qbi-additional-deductions.md (canonical path; shared with 13a — already renamed via 13a #2)',
    'CLOSED — pure audit-trail closure. Sibling-mate cross-reference confirmed; pair-aligned cascade = 1; convergence unchanged at 20; zero stale references found.'],

  [3, 'RESOLVED 2026-05-13 — SPEC ENHANCEMENT — Verification log row 2 appended to lines/13ab.md (IN-PROGRESS; finalizes at Issue #10)',
    '**Closure applied**: appended row 2 to the `## 13) Verification log` section in `lines/13ab.md` (created via 13a #3). Row captures the 13b walkthrough state in IN-PROGRESS form (#1 MFS Schedule 1-A MAGI guard — 17th orchestrator; #2 sibling-mate cross-reference — convergence unchanged; #3 this row append; #4–#10 IN-PROGRESS; backend 761 → 762 +1 from `mfsExcludesSpouseForm2555FromSchedule1AMagi`). Will be finalized to "COMPLETE — 10/10 closed" after Issue #10 closes (append-then-finalize pattern from 13a #3 → 13a #10). **Pair-aligned final shape**: 2 rows = **SMALLEST pair-aligned log shape in the workflow** (matches 7ab + 11ab pair pattern; contrasts with 12abcde 5-row LARGEST cluster log; the cluster-vs-pair structural max differential is 5 vs 2). **PAIR COMPLETE milestone at the log dimension** — first of three pair-completion dimensions to be closed today (the other two: sibling-mate cross-reference cascade via 13b #2 already done; 13a #4 PAIR seed → 13b #4 extension pending). Backend tests: 762/762 unchanged (pure doc append; no functional impact).',
    'lines/13ab.md (row 2 appended in IN-PROGRESS state at end of existing table; finalized COMPLETE by Issue #10)',
    'CLOSED — row 2 appended IN-PROGRESS. Will finalize to COMPLETE — 10/10 closed at Issue #10. Closes pair log at SMALLEST 2-row pair-aligned shape.'],

  [4, 'RESOLVED 2026-05-13 — CROSS-REFERENCE EXTENSION — 13a #4 PAIR-scale forward seed → 13b #4 extension (CLOSES the pair-scale seed → extend × 1 pattern)',
    '**Closure applied**: extended the 13a #4 forward-cross-reference SEED breadcrumb at TaxReturnComputeService.java:~875 (above the SECOND-PASS line-14 sum site) with FOUR changes: (1) **header timestamp update** — "13a #4 seed, 2026-05-13" → "13a #4 seed, 2026-05-13; EXTENDED 13b #4, 2026-05-13 — PAIR COMPLETE"; (2) **operand 2 status flip** — `IN-PROGRESS 2026-05-13` → `closed 2026-05-13` + cross-reference to 13a #1 MFS guard (16th orchestrator in cascade); (3) **operand 3 expansion** — replaced `13b audit (FUTURE)` placeholder with full provenance: `schedule1A.getLine38Total()` from computeSchedule1A at ~line 723 + 4-part composite breakdown (Part II line 13 tips + Part III line 21 overtime + Part IV line 30 car loan + Part V line 37 senior) + NEW for 2025 (OBBBA) note + cross-reference to 13b #1 MFS guard at computeSchedule1A (17th orchestrator in cascade — NEW CODEBASE MAX); (4) **PAIR COMPLETE milestone section added** — 13ab pair-scale seed → extend × 1 pattern CLOSED; SECOND pair-scale completion in workflow (after 10 #4 → 11a/b #4 × 2); THIRD complete seed → extend pattern total (after 10 #4 PAIR × 2 + 12a #4 CLUSTER × 4 + 13a #4 PAIR × 1); FUTURE EXTENSION POINTS section flipped "13b #4 — replace..." → "13b #4 — extended 2026-05-13 — PAIR COMPLETE"; line-14-audit upgrade hook preserved for future. Pure documentation closure — no functional change.',
    'TaxReturnComputeService.java:~875 (13a #4 seed breadcrumb; 4 edits applied; PAIR COMPLETE milestone)',
    'CLOSED — pair-scale seed → extend × 1 pattern complete. THIRD complete seed → extend pattern in workflow (PAIR + CLUSTER + PAIR). All 3 pair-completion structural dimensions now closed for 13ab.'],

  [5, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — Part II tips computation (sources + cap + phaseout + MFJ-only gate + multi-employer worksheet equivalence)',
    '**Closure applied**: added ~40-line VERIFIED CORRECT breadcrumb above the Part II header comment block at TaxReturnComputeService.java:~20461. Structure: (1) statutory anchor (IRS 2025 Schedule 1-A Part II + spec §5 + OBBBA 2025 §A.II); (2) **5-stage computation chain** — filing-status gate, per-spouse eligibility (4 conditions: SSN + opt-in + qualified-tips + tipped-occupation-confirmed), 4-source-channel aggregation, COMBINED cap, ROUND-DOWN phaseout; (3) **4 source channels** documented in detail — (a) W-2 box 7 via sumW2Box7TipsForSsn, (b) Form 4137 line 4 unreported tips, (c) manual entry, (d) 1099-NEC trade tips via sum1099NecTipsForSsn with optional net-income cap; (4) **combined-cap rationale** — $25k MFJ-COMBINED per spec §5.3 (NOT per-person); (5) **round-DOWN phaseout** — RoundingMode.FLOOR contrasted with Part IV CEILING; (6) **multi-employer worksheet equivalence note** with anti-fragmentation cross-reference to 13b #9; (7) **canonical regression tests** — 4 tests + MFS-gate test (schedule1ATipsDeductionBelowPhaseout, schedule1ATipsDeductionPhasedOut, schedule1ANecTradeTipsAutoImport, schedule1ANecTradeTipsCappedByNetIncomeCap, schedule1AMarriedFilingSeparatelyBlocksPerPersonParts). Pure documentation closure — no functional change. Backend tests: **762/762 unchanged**.',
    'TaxReturnComputeService.java:~20461 (above Part II header; ~40-line breadcrumb)',
    'CLOSED — verified correct. Part II tips computation now anchored at code site with 5-stage chain + 4-source catalog + multi-employer equivalence note + 5 regression test cross-references.'],

  [6, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — Part III overtime computation (parallel structure with Part II; 3 key differences documented)',
    '**Closure applied**: added ~38-line VERIFIED CORRECT breadcrumb above the Part III header comment block at TaxReturnComputeService.java:~20566. Structure documents the PARALLEL STRUCTURE to Part II with 3 explicit differences: (1) **DIFFERENCE 1 — sources MANUAL ONLY** (no statement auto-import) — `taxpayerOvertimeFromW2Box1Amount` + `taxpayerOvertimeFromNonW2SourcesAmount`; rationale per spec §6.2 — 2025 W-2 forms not required to separately identify qualifying overtime amount (first year of OBBBA); user self-reports via worksheet-based / reasonable-method reconstruction; contrasts with Part II 4-source channels including W-2 box 7 auto-import; (2) **DIFFERENCE 2 — filing-status-specific cap** ($12.5k single / $25k MFJ / $0 MFS via gate) contrasted with Part II flat $25k combined; IRC §A.III design rationale — overtime is per-worker structure vs tips per-household; (3) **DIFFERENCE 3 — phaseout SHARED with Part II** — REUSES SCHEDULE_1A_TIPS_PHASEOUT_* constants + SCHEDULE_1A_TIPS_OVERTIME_STEP_AMOUNT (constant name explicitly acknowledges sharing); helper `computeTipsOvertimePhaseout` shared; FLOOR rounding contrasted with Part IV CEILING. Plus SAME-AS-PART-II summary (gate + eligibility + combined cap + floor-at-zero). Plus canonical regression tests (schedule1AOvertimeDeductionSingle + schedule1AOvertimeDeductionCappedAtMfjLimit + schedule1AMarriedFilingSeparatelyBlocksPerPersonParts). Pure documentation closure — no functional change. Backend tests: **762/762 unchanged**.',
    'TaxReturnComputeService.java:~20566 (above Part III header; ~38-line breadcrumb)',
    'CLOSED — verified correct. Part III overtime now anchored at code site with 3 differences-from-Part-II + filing-status cap table + shared-phaseout note + 3 regression test cross-references.'],

  [7, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — Part IV car loan interest (THE most architecturally distinct Part; 5 distinguishing features documented)',
    '**Closure applied**: added ~56-line VERIFIED CORRECT breadcrumb above the Part IV header comment block at TaxReturnComputeService.java:~20645. Structure documents Part IV as THE MOST architecturally distinct Part with 5 distinguishing features: (1) **FEATURE 1 — NO MFJ restriction** (Part IV runs on MFS — the only Part that does; per spec §7.1; critical for 13b #1 MFS guard rationale); (2) **FEATURE 2 — per-vehicle iteration** (return-level, reads only deductionsTaxpayer.carLoanVehicles); (3) **FEATURE 3 — refinancing proportionalization** with worked example ($20k orig + $25k refi cash-out + $2k interest → $1,600 deductible; only purchase-money portion qualifies); (4) **FEATURE 4 — Schedule C/E/F double-deduction prevention** (subtract per-vehicle scheduleE + scheduleC + scheduleF amounts; defensive against out-of-scope Schedule C/F inputs); (5) **FEATURE 5 — round-UP CEILING phaseout** contrasted with Parts II/III FLOOR: at $100 over threshold, CEILING = $200 reduction vs FLOOR = $0; cap $10k + thresholds $100k/$200k + step $200/$1k all amplify the more-aggressive reduction. Plus subtle user-attested gates (VIN + first lien + US final assembly + new vehicle — not separately enforced per spec §7.2-§7.3). Plus **5 canonical regression tests** including the 13b #1 lock-in test (`mfsExcludesSpouseForm2555FromSchedule1AMagi`) confirming Part IV on MFS not reduced by stale spouse FEIE. Pure documentation closure — no functional change. Backend tests: **762/762 unchanged**.',
    'TaxReturnComputeService.java:~20645 (above Part IV header; ~56-line breadcrumb)',
    'CLOSED — verified correct. Part IV car loan interest now anchored at code site with 5 distinguishing features + refinancing worked example + CEILING-vs-FLOOR contrast + MFS cross-reference + 5 regression test cross-references.'],

  [8, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — Part V senior deduction (dual-eligibility derivation + continuous 6% phaseout + AMTI add-back at Form 6251 line 1w)',
    '**Closure applied**: added ~50-line VERIFIED CORRECT breadcrumb above the Part V header comment block at TaxReturnComputeService.java:~20757. Structure: (1) statutory anchor (IRS 2025 Schedule 1-A Part V + spec §8 + OBBBA 2025 §A.V + IRC §63(f)(1)(A) day-before-birthday rule); (2) **5-stage computation chain** — filing-status gate, dual-eligibility derivation, eligible count, base, continuous 6% phaseout; (3) **DUAL-ELIGIBILITY DERIVATION** documented in detail — prefer explicit `taxpayerBornBeforeJan2_1961` flag; fallback to `dateOfBirth` string via `isBornBeforeJan2_1961` helper; consistency note with 12d #5 + 12d #6 semantic-key `_1961` alignment; (4) **★ PHASEOUT-SHAPE COMPARISON TABLE** — worked example "$500 over threshold" showing Part II/III FLOOR = $0, Part IV CEILING = $200, **Part V CONTINUOUS = $30** (every dollar above threshold reduces by 6¢; smoothest of the four Parts); (5) **★ AMT INTERACTION** — Senior deduction ADDED BACK to AMTI at Form 6251 line 1w via computeLine17 ~line 8093; CRITICAL contrast — tips/overtime/car-loan are NOT added back; rationale (Congress designated senior deduction as AMT preference item); cross-reference for future line-17 audit; (6) **worked example** (MFJ both eligible, MAGI $180k → $10,200 matches canonical test); (7) **3 canonical regression tests** — `schedule1ASeniorDeductionTaxpayerEligible`, `schedule1ASeniorDeductionMfjBothEligibleWithPhaseout`, `schedule1AMarriedFilingSeparatelyBlocksPerPersonParts`. Pure documentation closure — no functional change. Backend tests: **762/762 unchanged**.',
    'TaxReturnComputeService.java:~20757 (above Part V header; ~50-line breadcrumb)',
    'CLOSED — verified correct. Part V senior deduction now anchored at code site with dual-eligibility derivation + IRC §63(f)(1)(A) day-before-birthday rule + continuous-vs-bucketed phaseout comparison table + AMT add-back interaction + worked example + 3 regression test cross-references.'],

  [9, 'RESOLVED 2026-05-13 — OBSERVATION — Multi-employer tip-cap allocation worksheet vs aggregate-and-cap (mathematically equivalent)',
    '**Closure applied** — pure observation; no code change; no new breadcrumb. **The rule**: IRS Schedule 1-A Part II instructions specify a multi-employer allocation worksheet when total tips from >1 employer exceed the $25k cap; the worksheet allocates the cap proportionally across employers. **The backend approach**: aggregate all tip sources (W-2 box 7 across all employers via sumW2Box7TipsForSsn + Form 4137 + 1099-NEC + manual) into `totalRawTips`, then apply $25k cap ONCE at ~line 20510. **Mathematical equivalence proven**: when total ≤ $25k, both approaches return total_tips (no cap binds; per-employer allocation = full allocation per employer); when total > $25k, both return $25k (worksheet: Σ proportional allocations = $25k × Σ(emp/total) = $25k; backend: min(total, $25k) = $25k). The worksheet exists for IRS audit transparency (per-employer allocation visibility), not for arithmetic differentiation; the IRS doesn\'t require submitting the worksheet (it\'s a computation aid). **UI surface**: `taxpayerHasMultipleTipEmployers` + `spouseHasMultipleTipEmployers` are INFORMATIONAL ONLY — set by user; backend does NOT use them in computation (per knowledge §5.2). **3-source coverage adequate**: spec §5.3 + knowledge §5.2 + existing 13b #5 breadcrumb at TaxReturnComputeService.java:~20461 ("Multi-employer worksheet equivalence: IRS instructions Part II have an \\"allocation worksheet\\" for taxpayers with tips from >1 employer when total > $25k cap. Backend aggregates totalRawTips then caps once — mathematically equivalent (per knowledge §5.2)."). Adding a 4th-source breadcrumb at the aggregation site would be redundant per anti-fragmentation policy. **Anti-fragmentation policy applied** — **10th Path A application** in the workflow (after 7a #9 + 8 #9 + 10 #9 + 11b #8 + 12a #9 + 12c #9 + 12d #9 + 13a #9 + prior pair audits; pattern: "user-attested data / IRS-accepted approximation / spec-documented design — no new outstanding entry"). **Anti-fragmentation streak: 13 → 14 consecutive walkthroughs with zero new outstanding.md entries** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/**13b**). Pure xlsx-flip audit-trail acknowledgment. Backend tests: **762/762 unchanged**.',
    'TaxReturnComputeService.java:~20510 (totalRawTips aggregation + single cap); spec §5.3 + knowledge §5.2 + 13b #5 breadcrumb at ~line 20461 (3-source coverage)',
    'CLOSED — pure observation. Mathematical equivalence verified; user-facing booleans informational. **10th Path A application** (streak: 13 → 14 consecutive zero-outstanding walkthroughs). No new breadcrumb (3-source coverage adequate); no new outstanding entry. Backend unchanged.'],

  [10, 'RESOLVED 2026-05-13 — BOUNDARY MILESTONE — Line 13b closes the 13ab tightly-coupled pair across ALL 4 DIMENSIONS (PAIR COMPLETE)',
    'Pure xlsx-flip observation — **CLOSES the 13b walkthrough at 10/10** AND **CLOSES the 13ab pair across all 4 dimensions** simultaneously. **The 4 pair-completion dimensions**: (1) **Verification log at 2 rows** = pair-aligned SMALLEST pair-log shape (mirrors 7ab + 11ab; contrasts with 12abcde 5-row LARGEST cluster log); row 2 finalized COMPLETE — 10/10 closed today. (2) **Sibling-mate cross-reference cascade at 1** = pair-aligned max (13a #2 rename + 13b #2 cross-reference = closed pair shape). (3) **Cross-reference seed → extend × 1 pattern COMPLETE** — 13a #4 PAIR seed (closed today) + 13b #4 extension (closed today) at TaxReturnComputeService.java:~875; THIRD complete seed-extend pattern in the workflow (after 10 #4 PAIR seed × 2 + 12a #4 CLUSTER seed × 4); SECOND pair-scale completion. (4) **MFS-cascade extension** to 17 orchestrators (NEW CODEBASE MAXIMUM; was 16 after 13a #1; SECOND MFS guard added OUTSIDE the 12abcde cluster after 13a #1). **Cumulative through line 13b**: 39 lines audited (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + 11b + 12a + 12b + 12c + 12d + 12e + 13a + **13b**); 387 audit issues closed total (377 + 10); backend **762/762** (+1 from `mfsExcludesSpouseForm2555FromSchedule1AMagi` lock-in test); MFS-guard cascade = **17 orchestrators (NEW CODEBASE MAX)** — cascade roster: 1c + 1d + 1e + 1f + 1g + 1h + 1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities + computeSocialSecurityBenefits + computeCapitalGainLoss + computeOtherIncomes + computeIncomeAdjustments + buildStandardDeductionIndicators + computeLine13a + **computeSchedule1A (NEW)**; knowledge-file naming convergence = 20 lines (unchanged — shared file already migrated via 13a #2); 5 documentation drift fixes (unchanged); FIRST @Deprecated annotation (12c #8; unchanged); **10 Path A anti-fragmentation applications** (+1 from 13b #9 multi-employer tip-cap worksheet equivalence); **14 consecutive walkthroughs with zero new outstanding.md entries** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/**13b**). **Looking ahead — line 14 (total deductions composite)**: 1st audit OUTSIDE the 13ab pair. Composite audit — will upgrade the 13a #4 + 13b #4 forward seed at TaxReturnComputeService.java:~875 from SEEDED → VERIFIED CORRECT (per the "Future line 14 audit" hook in the seed). Will document the 3-operand sum (line12e + line13a + line13b) + the zero-floor interaction with downstream line 15 (line 15 = max(0, AGI − line14)). Line 14 has no separate orchestrator (inline-computed at TaxReturnComputeService.java:~911 second-pass and ~3315 first-pass) — likely 4th defensive-gap-NOT-needed Issue #1 in workflow (after 9 #1 + 11a/b #1 + 12b/c/d/e #1).',
    'XLS/computations/13b.xlsx audit-trail (this row); lines/13ab.md Verification log row 2 FINALIZED to COMPLETE — 10/10 closed + PAIR COMPLETE marker',
    'CLOSED — 13b walkthrough complete (10/10). 13ab PAIR COMPLETE across all 4 dimensions. 39 lines audited; MFS cascade = 17 (NEW CODEBASE MAX). Line 14 (total deductions composite) queued next — will upgrade 13a/b #4 seed from SEEDED → VERIFIED CORRECT.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 110 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 13b Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.deductions.additionalDeductions', 'Form 1040 page 2, line 13b (numeric box)', 'XLS/output_forms/form-tax-return-1040.xlsx', '★ CANONICAL line 13b output. BigDecimal; whole-dollar HALF_UP rounded. Sourced from schedule1A.line38Total.'],
  ['Schedule1A.line38Total', 'Schedule 1-A page 2, line 38', 'XLS/output_forms/form-tax-return-schedule-1a.xlsx', '★ Sum of all 4 Parts. Feeds Form 1040 line 13b directly.'],
  ['Schedule1A.line13TipsDeduction', 'Schedule 1-A Part II line 13', 'XLS/output_forms/form-tax-return-schedule-1a.xlsx', 'Tips after cap + phaseout.'],
  ['Schedule1A.line21OvertimeDeduction', 'Schedule 1-A Part III line 21', 'XLS/output_forms/form-tax-return-schedule-1a.xlsx', 'Overtime after cap + phaseout.'],
  ['Schedule1A.line30CarLoanInterestDeduction', 'Schedule 1-A Part IV line 30', 'XLS/output_forms/form-tax-return-schedule-1a.xlsx', 'Car loan interest after refinancing + exclusions + cap + phaseout.'],
  ['Schedule1A.line37EnhancedSeniorDeduction', 'Schedule 1-A Part V line 37', 'XLS/output_forms/form-tax-return-schedule-1a.xlsx', 'Senior deduction after continuous 6% phaseout.'],
  ['Schedule1A.magi', 'Schedule 1-A Part I line 3', 'XLS/output_forms/form-tax-return-schedule-1a.xlsx', 'MAGI = AGI + PR + Form 2555 (45 + 50) + Form 4563 line 15.'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 14 (total deductions)', 'Form 1040 page 2, line 14 (numeric box)', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ line14 = line12e + line13a + line13b. Closed via 13a #4 + 13b #4 forward seed.'],
  ['Form 1040 line 15 (taxable income)', 'Form 1040 page 2, line 15 (numeric box)', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ line15 = max(0, line11b − line14). Zero-floor rule (future line 15 audit).'],
  ['Form 1040 line 13a (QBI second-pass trigger)', 'Form 1040 page 2, line 13a (numeric box)', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ Schedule 1-A line38Total > 0 triggers computeLine13a second-pass at prepare()~line 766 (per 13a #5).'],
  [],
  ['AMT INTERACTION'],
  ['Form 6251 line 1w (AMTI add-back)', 'Form 6251 page 1, line 1w', 'XLS/output_forms/form-tax-return-6251.xlsx', 'Senior deduction (Part V line 37) is ADDED BACK to AMTI per OBBBA. Implementation at computeLine17 ~line 8093. Tips/overtime/car-loan are NOT added back (per OBBBA design).'],
  [],
  ['CONDITIONAL ATTACHMENTS'],
  ['Schedule 1-A', 'Schedule 1-A pages 1–2', 'XLS/output_forms/form-tax-return-schedule-1a.xlsx', 'Attached when schedule1A.line38Total > 0 (any Part II/III/IV/V amount nonzero).'],
  ['Form 4137 (taxpayer/spouse)', 'Form 4137 page', '(per existing tips computation)', 'Attached when unreported tip income exists; feeds Part II via tips.form4137Taxpayer().getLine4UnreportedTips().'],
  ['Form 2555 (taxpayer/spouse)', 'Form 2555 pages', '(per existing form2555 computation)', 'Lines 45 + 50 feed Schedule 1-A line 2b/2c MAGI add-back.'],
  ['Form 4563', 'Form 4563 page', '—', 'Form 4563 line 15 feeds Schedule 1-A line 2d MAGI add-back. Manual entry on additional-deductions-taxpayer form.'],
  [],
  ['NOT IN OUTPUT'],
  ['Schedule C / Schedule E / Schedule F vehicle interest', '—', '—', 'SUBTRACTED from Part IV car loan interest (no double-deduction). Per spec §7.3.'],
  ['QBI deduction (line 13a)', '—', '—', 'Separate line; computed via computeLine13a after Schedule 1-A finalizes (per spec §9 compute order).'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 65 }, { wch: 50 }, { wch: 55 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
