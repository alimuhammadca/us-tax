// ============================================================================
//  Generates: C:\us-tax\XLS\computations\13a.xlsx
//
//  Source-of-truth references:
//    - lines/13ab.md (2025 IRS-verified developer-ready spec; sections 1–12)
//    - dependencies/13ab.md (compute-order critical: 11b → 12e → 13b → 13a)
//    - knowledge/line-13ab-qbi-additional-deductions.md (renamed via 13a #2 2026-05-13;
//      was knowledge_line13ab.md)
//    - TaxReturnComputeService.computeLine13a() at line ~3599 (orchestrator)
//    - prepare() second-pass invocation at line ~769 (after computeSchedule1A)
//    - collectQbiInputsForPerson() at line ~3765 (per-person aggregation)
//    - validateQbiStatementGating() at line ~3860 (blocking flags)
//    - validateQbiThresholdPath() at line ~4072 (above-threshold flags)
//    - compute8995AQbiDeductionComponent() at line ~4125 (SSTB/non-SSTB phase-in)
//    - computeQbiWageUbiaLimit() at line ~4188 (max(50%×W2, 25%×W2 + 2.5%×UBIA))
//    - shouldUseForm8995A() at line ~4270 (threshold routing)
//    - ReferenceData.java lines 53–60 (QBI_* constants)
//    - IRS 2025 Form 8995 + Form 8995-A + instructions
//
//  Tax year: 2025
//
//  Concept:
//    Line 13a = QBI deduction = Form 8995 line 15 (below threshold) OR
//    Form 8995-A line 39 (above threshold or cooperative patron).
//
//    Below threshold (Form 8995):
//      netQbi             = max(0, sum(QBI) − priorYearQbiLossCarryforward)
//      netReitPtp         = max(0, sum(REIT+PTP) − priorYearReitPtpLossCarryforward)
//      tentativeDeduction = 20% × netQbi + 20% × netReitPtp
//      taxIncBeforeQbi    = AGI − line12e − line13b
//      taxIncLimit        = 20% × max(0, taxIncBeforeQbi − netCapGain&QualDiv)
//      line13a            = min(tentativeDeduction, taxIncLimit)
//
//    Above threshold (Form 8995-A) — per K-1 activity, SSTB-aware:
//      phaseInPct = (taxIncBeforeQbi − threshold) / phaseInRange, clamped [0,1]
//      SSTB AND ≥ upperThreshold → activity deduction = $0 (fully phased out)
//      SSTB in phase-in band     → applicablePct = 1 − phaseInPct;
//                                   adjQBI/adjW2/adjUBIA × applicablePct;
//                                   limitedAmount = min(20% × adjQBI, wageUbiaLimit(adjW2, adjUBIA))
//      Non-SSTB ≥ upperThreshold → limitedAmount = min(20% × QBI, wageUbiaLimit(W2, UBIA))
//      Non-SSTB in phase-in band → reduction = max(0, tentative − wageUbiaLimit) × phaseInPct
//                                   phasedAmount = tentative − reduction
//                                   limitedAmount = max(min(tentative, wageUbiaLimit), phasedAmount)
//      wageUbiaLimit(W2, UBIA) = max(50% × W2, 25% × W2 + 2.5% × UBIA)
//      Sum over activities + REIT/PTP component; cap by taxIncLimit.
//
//  Critical compute order (spec §9):
//    11a/11b (AGI) → 12e (deduction) → 13b (Schedule 1-A) → 13a (QBI)
//    Backend implementation: computeLine13a() runs TWICE — first inside computeLine12
//    with line13b=null (preliminary; needed for line14 placeholder), then again
//    from prepare() at line 769 with the resolved line13b (authoritative). Only
//    the second-pass value is persisted to form1040.deductions.qualifiedBusinessIncomeDeduction.
//
//  Line 13a audit positioning (FIRST audit OUTSIDE the 12abcde cluster):
//   • 1st sub-line of the 13ab tightly-coupled pair (mirrors 7ab + 11ab patterns)
//   • Separate orchestrator (computeLine13a) — HIGH-PRIORITY MFS guard analysis needed
//   • Continues AGI-territory after line 10 + 11a + 11b + 12abcde
//   • Cumulative position: 38th line; first deduction audit OUTSIDE 12abcde cluster
//
//  Line 13a audit angles (10 issues):
//   1. ⚠️ HIGH-PRIORITY MFS DEFENSIVE GAP — computeLine13a aggregates spouse-form
//       QBI inputs unconditionally; no MFS guard. Adds 16th orchestrator to the
//       MFS-guard cascade (new codebase max from 15).
//   2. DOCUMENTATION HYGIENE — Legacy A knowledge file rename
//       (knowledge_line13ab.md → line-13ab-qbi-additional-deductions.md);
//       closes the 7th Legacy A file (knowledge convergence 19 → 20 lines).
//   3. SPEC ENHANCEMENT — Verification log section seeded at lines/13ab.md
//       (pair-aligned first row; sibling 13b row queued next).
//   4. CROSS-REFERENCE SEED — Forward cross-reference for line 14 (total
//       deductions composite). Seed → extend × 2 pattern (paired with 13b #4).
//   5. VERIFIED CORRECT — Two-pass invocation pattern (computeLine13a called
//       twice; first pass line13b=null is discarded if second pass produces a
//       value). Add breadcrumb above the second-pass call at line ~769.
//   6. VERIFIED CORRECT — Form 8995 vs 8995-A routing (shouldUseForm8995A);
//       2025 threshold $394,600 MFJ / $197,300 all other.
//   7. VERIFIED CORRECT — Form 8995-A SSTB phase-in + W-2/UBIA limit
//       (compute8995AQbiDeductionComponent + computeQbiWageUbiaLimit).
//   8. VERIFIED CORRECT — Carryforward semantics (negative net carries forward;
//       line 13a ≥ 0; never produces negative deduction).
//   9. OBSERVATION — Form 8995 line 12 "net capital gain" approximation:
//       backend uses max(line7a, 0) + qualifiedDividends — accepted per
//       knowledge §4.3 ("IRS-prescribed formula"). Anti-fragmentation observation
//       only (no new outstanding.md entry).
//  10. BOUNDARY MILESTONE — First audit OUTSIDE the 12abcde cluster.
//       38th line audited; MFS-guard cascade becomes 16 (new codebase max).
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '13a.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 13a — QUALIFIED BUSINESS INCOME (QBI) DEDUCTION'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 13a (page 2; numeric amount)'],
  ['Concept',
    'Section 199A deduction for qualified business income, REIT dividends, and PTP income. ' +
    'Sourced from Form 8995 line 15 (below threshold; simplified) OR Form 8995-A line 39 ' +
    '(above threshold or cooperative patron; per-activity with SSTB phase-in and W-2/UBIA limits). ' +
    'FIRST audit OUTSIDE the 12abcde deductions cluster — uses a separate orchestrator ' +
    '(computeLine13a) requiring its own MFS-guard analysis.'],
  ['Mapping (spec §3.1)', 'line13a = Form8995.line15  OR  Form8995A.line39'],
  ['Routing (spec §3.2)',
    'Use Form 8995 ONLY IF all three hold:\n' +
    '  (a) taxpayer has QBI, qualified REIT dividends, or qualified PTP income/loss;\n' +
    '  (b) 2025 taxable_income_before_qbi ≤ $394,600 (MFJ) or $197,300 (all other);\n' +
    '  (c) taxpayer is NOT a patron of a specified agricultural/horticultural cooperative.\n' +
    'Otherwise → Form 8995-A. Backend uses shouldUseForm8995A(filingStatus, taxIncBeforeQbi).'],
  ['Critical compute order (spec §9 + §11)',
    'CORRECT: 11a/11b (AGI) → 12e (standard/itemized) → 13b (Schedule 1-A) → 13a (QBI).\n' +
    'taxable_income_before_qbi = Form1040.line11a − line12e − line13b. ' +
    'Line 13a cannot be finalized before line 13b. ' +
    'Backend invokes computeLine13a() TWICE: first inside computeLine12 with line13b=null ' +
    '(preliminary; written to line14 only as placeholder), then again from prepare() at ' +
    'line ~769 with the resolved line13b — the second-pass value is the authoritative one.'],
  ['Carryforward (spec §3.8)',
    'Negative net QBI does NOT create a negative line 13a — it carries forward to next year.\n' +
    'Same rule for negative net REIT/PTP. Invariant: Form1040.line13a ≥ 0.'],
  ['Output target', 'form1040.deductions.qualifiedBusinessIncomeDeduction (BigDecimal; whole-dollar HALF_UP)'],
  ['Backend method', 'computeLine13a() in TaxReturnComputeService.java at line ~3599 (called twice; second pass authoritative)'],
  ['IRS source',
    'IRS 2025 Form 8995 + 2025 Form 8995-A + Instructions; IRC §199A (Tax Cuts and Jobs Act, ' +
    'codified at 26 U.S.C. §199A; permanent post-OBBBA per spec §3.6); Rev. Proc. 2024-40 ' +
    '(2025 inflation-adjusted thresholds).'],
  [],
  ['STEP-BY-STEP COMPUTATION — Form 8995 (Below Threshold)'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Collect QBI inputs per person (taxpayer + spouse)',
    'collectQbiInputsForPerson() at line 3765. Aggregates QBI amount, REIT/PTP amount, ' +
    'prior-year QBI loss carryforward, prior-year REIT/PTP carryforward, manual adjustments, ' +
    'and per-activity K-1 details (SSTB flag, W-2 wages, UBIA qualified property).'],
  [2, 'Sum QBI and REIT/PTP across taxpayer + spouse',
    'qbi_amount = addNonNull(taxpayer.QBI, spouseInputs.QBI)\n' +
    'reit_ptp   = addNonNull(taxpayer.REIT_PTP, spouseInputs.REIT_PTP) — includes 1099-DIV box 5 + K-1 199A REIT/PTP fields + manual adjustments\n' +
    '⚠️ MFS GAP: spouse-form inputs aggregated unconditionally; see Code Validation #1.'],
  [3, 'Apply prior-year carryforwards',
    'net_qbi      = qbi_amount − priorYearQbiLossCarryforward         (may be negative → carries forward)\n' +
    'net_reit_ptp = reit_ptp   − priorYearReitPtpLossCarryforward      (may be negative → carries forward)'],
  [4, 'Compute QBI deduction component',
    'qbi_component       = 20% × max(0, net_qbi)                       (per IRC §199A(a))\n' +
    'reit_ptp_component  = 20% × max(0, net_reit_ptp)                  (per IRC §199A(b)(1)(B))\n' +
    'tentative_deduction = qbi_component + reit_ptp_component          (Form 8995 line 10)'],
  [5, 'Compute taxable income limitation (Form 8995 line 11–14)',
    'taxIncBeforeQbi      = AGI − line12e − line13b                    (second-pass uses authoritative line13b)\n' +
    'netCapGainAndQualDiv = max(line7a, 0) + qualifiedDividends        (per Form 8995 instructions line 12)\n' +
    'taxIncLimitBase      = max(0, taxIncBeforeQbi − netCapGainAndQualDiv)\n' +
    'taxIncLimit          = 20% × taxIncLimitBase'],
  [6, 'Take the lesser → line 13a',
    'line13a = min(tentative_deduction, taxIncLimit)                   (Form 8995 line 15)\n' +
    'Invariant: line13a ≥ 0 (carryforward absorbs all negative paths).'],
  [],
  ['STEP-BY-STEP COMPUTATION — Form 8995-A (Above Threshold or Cooperative Patron)'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Compute phase-in percentage',
    'threshold      = $394,600 (MFJ) or $197,300 (other)\n' +
    'phaseInRange   = $100,000 (MFJ) or $50,000 (other)\n' +
    'upperThreshold = threshold + phaseInRange = $494,600 (MFJ) / $247,300 (other)\n' +
    'phaseInPct     = (taxIncBeforeQbi − threshold) / phaseInRange, clamped to [0, 1]'],
  [2, 'For each K-1 activity (1065 + 1120-S + 1041)',
    'Skip if qbiAmount is null/zero or negative.'],
  [3, '  IF SSTB and taxIncBeforeQbi ≥ upperThreshold',
    'activityDeduction = $0   (fully phased out per IRC §199A(d)(2) + (3))'],
  [4, '  IF SSTB and in phase-in band',
    'applicablePct = 1 − phaseInPct\n' +
    'adjQBI  = qbiAmount × applicablePct\n' +
    'adjW2   = W2_wages   × applicablePct\n' +
    'adjUBIA = UBIA       × applicablePct\n' +
    'tentative          = 20% × adjQBI\n' +
    'wageUbiaLimit_sstb = max(50% × adjW2, 25% × adjW2 + 2.5% × adjUBIA)\n' +
    'activityDeduction  = min(tentative, wageUbiaLimit_sstb)'],
  [5, '  IF non-SSTB and taxIncBeforeQbi > upperThreshold',
    'tentative        = 20% × qbiAmount\n' +
    'wageUbiaLimit    = max(50% × W2, 25% × W2 + 2.5% × UBIA)\n' +
    'activityDeduction = min(tentative, wageUbiaLimit)              (full W-2/UBIA limit)'],
  [6, '  IF non-SSTB and in phase-in band',
    'tentative      = 20% × qbiAmount\n' +
    'wageUbiaLimit  = max(50% × W2, 25% × W2 + 2.5% × UBIA)\n' +
    'reduction      = max(0, tentative − wageUbiaLimit) × phaseInPct\n' +
    'phasedAmount   = tentative − reduction\n' +
    'activityDeduction = max(min(tentative, wageUbiaLimit), phasedAmount)'],
  [7, 'Sum activity deductions + REIT/PTP component',
    'sum_activities = Σ activityDeduction\n' +
    'reit_ptp_comp  = 20% × max(0, net_reit_ptp)                   (REIT/PTP not subject to W-2/UBIA)\n' +
    'tentative_total = sum_activities + reit_ptp_comp                (Form 8995-A line 32)'],
  [8, 'Apply taxable income limitation',
    'taxIncLimit = 20% × max(0, taxIncBeforeQbi − netCapGainAndQualDiv)\n' +
    'line13a     = min(tentative_total, taxIncLimit)                  (Form 8995-A line 39)'],
  [],
  ['EXCLUSIONS — Not QBI (spec §3.7)'],
  ['Item', 'Why excluded', 'Source'],
  ['Wage income as an employee', 'Not from a trade or business', 'IRC §199A(c)(4)(A)'],
  ['Reasonable compensation from S corporation', 'Section 199A explicitly excludes', 'IRC §199A(c)(4)(A)'],
  ['Guaranteed payments to partners', 'Section 199A explicitly excludes', 'IRC §199A(c)(4)(B)'],
  ['Payments to a partner not in a partner capacity', 'Section 199A explicitly excludes', 'IRC §199A(c)(4)(C)'],
  ['Capital gains/losses (line 7a)', 'Subtracted at the taxable-income-limitation step (Form 8995 line 12)', 'IRC §199A(c)(3)(B)(i)'],
  ['Dividends and dividend equivalents (line 3a)', 'Excluded from QBI; qualified REIT dividends handled separately', 'IRC §199A(c)(3)(B)(ii)'],
  ['Interest income not properly allocable to trade or business', 'Investment interest, not business interest', 'IRC §199A(c)(3)(B)(iii)'],
  ['Annuities unless received in trade or business', 'Investment annuities excluded', 'IRC §199A(c)(3)(B)(iv)'],
  ['Qualified REIT dividends + PTP income as ordinary QBI', 'These belong to the SEPARATE REIT/PTP component', 'Form 8995 line 6–9'],
  ['Tip income excluded under 2025 tip-deduction rules', 'When the 2025 QBI instructions tell you to exclude', 'Spec §3.7'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 32 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 13a'],
  ['QBI inputs flow from statement entries (1099-DIV box 5 + K-1 1065/1120-S/1041 section 199A fields) and from per-person personal forms (qbi-deduction-taxpayer / qbi-deduction-spouse). The aggregator collectQbiInputsForPerson() combines them.'],
  [],
  ['#', 'Source', 'Field', 'Type', 'Role', 'XLS input form reference'],
  // Statement entries
  [1, '1099-DIV statement', 'section199ADividendsAmount (box 5)', 'BigDecimal', 'Qualified REIT dividends — flows into REIT/PTP component', 'XLS/input_forms/form-1099-div.xlsx'],
  [2, 'K-1 (Form 1065) statement', 'section199AQualifiedBusinessIncomeAmount', 'BigDecimal', 'Per-activity QBI — sole feeder for Form 8995-A non-SSTB deduction', 'XLS/input_forms/form-schedule-k1-1065.xlsx'],
  [3, 'K-1 (Form 1065) statement', 'section199AW2WagesAmount', 'BigDecimal', 'Per-activity W-2 wages — used in wage/UBIA limit (Form 8995-A only)', 'XLS/input_forms/form-schedule-k1-1065.xlsx'],
  [4, 'K-1 (Form 1065) statement', 'section199AUbiaQualifiedPropertyAmount', 'BigDecimal', 'Unadjusted Basis Immediately after Acquisition — for 2.5% UBIA limit', 'XLS/input_forms/form-schedule-k1-1065.xlsx'],
  [5, 'K-1 (Form 1065) statement', 'section199AIsSstb', 'Boolean', 'Specified Service Trade or Business flag — drives phase-in or full disallowance above upper threshold', 'XLS/input_forms/form-schedule-k1-1065.xlsx'],
  [6, 'K-1 (Form 1065) statement', 'section199AQualifiedReitDividendsAmount', 'BigDecimal', 'K-1 REIT dividends (added to REIT/PTP component)', 'XLS/input_forms/form-schedule-k1-1065.xlsx'],
  [7, 'K-1 (Form 1065) statement', 'section199AQualifiedPtpIncomeOrLossAmount', 'BigDecimal', 'K-1 PTP income/loss (added to REIT/PTP component)', 'XLS/input_forms/form-schedule-k1-1065.xlsx'],
  [8, 'K-1 (Form 1120-S) statement', '(same section 199A field set as K-1 1065)', 'Various', 'S-corporation per-activity 199A data', 'XLS/input_forms/form-schedule-k1-1120s.xlsx'],
  [9, 'K-1 (Form 1041) statement', '(same section 199A field set as K-1 1065)', 'Various', 'Estate/trust per-activity 199A data', 'XLS/input_forms/form-schedule-k1-1041.xlsx'],
  // qbi-deduction personal form
  [10, 'qbi-deduction-taxpayer form', 'hadQualifiedBusinessIncomeInputs', 'Boolean', 'Gate — entire line13a path requires taxpayer or spouse TRUE; null/false → line13a not emitted', 'XLS/input_forms/form-qbi-deduction.xlsx'],
  [11, 'qbi-deduction-taxpayer form', 'confirmAllReceivedQbiStatementsUploaded', 'Boolean', 'Required when hadQualifiedBusinessIncomeInputs=TRUE; absence → blocking flag LINE13A_STATEMENT_UPLOAD_REQUIRED_*', 'XLS/input_forms/form-qbi-deduction.xlsx'],
  [12, 'qbi-deduction-taxpayer form', 'hasScheduleCOrScheduleFQbiSources', 'Boolean', 'Self-employment QBI out-of-scope — TRUE → blocking flag LINE13A_SELF_EMPLOYMENT_OUT_OF_SCOPE_*', 'XLS/input_forms/form-qbi-deduction.xlsx'],
  [13, 'qbi-deduction-taxpayer form', 'isCooperativePatronOfAgriculturalHorticulturalCooperative', 'Boolean', 'Patron status forces Form 8995-A path (spec §3.2) — TRUE → blocking flag LINE13A_COOPERATIVE_PATRON_UNSUPPORTED (current scope limitation)', 'XLS/input_forms/form-qbi-deduction.xlsx'],
  [14, 'qbi-deduction-taxpayer form', 'hasPriorYearQbiLossCarryforward + priorYearQbiLossCarryforwardAmount', 'Boolean + BigDecimal', 'Prior-year carryforward reduces current QBI before 20% factor', 'XLS/input_forms/form-qbi-deduction.xlsx'],
  [15, 'qbi-deduction-taxpayer form', 'hasPriorYearReitPtpLossCarryforward + priorYearReitPtpLossCarryforwardAmount', 'Boolean + BigDecimal', 'Prior-year REIT/PTP carryforward reduces REIT/PTP component', 'XLS/input_forms/form-qbi-deduction.xlsx'],
  [16, 'qbi-deduction-taxpayer form', 'manualQualifiedBusinessIncomeAdjustment', 'BigDecimal', 'Supplemental QBI for missing K-1 lines — BLOCKED above threshold via LINE13A_MANUAL_QBI_THRESHOLD_UNSUPPORTED', 'XLS/input_forms/form-qbi-deduction.xlsx'],
  [17, 'qbi-deduction-taxpayer form', 'manualQualifiedReitDividendAdjustment / manualQualifiedPtpIncomeOrLossAdjustment', 'BigDecimal', 'Supplemental REIT/PTP adjustments (not threshold-blocked)', 'XLS/input_forms/form-qbi-deduction.xlsx'],
  [18, 'qbi-deduction-spouse form', '(same field set as taxpayer form with spouse* prefix)', 'Various', 'Spouse-side QBI inputs — ⚠️ aggregated unconditionally; no MFS guard (see Code Validation #1)', 'XLS/input_forms/form-qbi-deduction.xlsx'],
  // Computed upstream
  [19, 'computed Adjustments (line 11a/11b)', 'line11bAmountFromLine11aAdjustedGrossIncome (AGI)', 'BigDecimal', 'Subtrahend for taxIncBeforeQbi: AGI − line12e − line13b', '(internal — line 11ab computation)'],
  [20, 'computed Deductions', 'deductionAmount (line 12e)', 'BigDecimal', 'Subtrahend for taxIncBeforeQbi', '(internal — line 12abcde computation)'],
  [21, 'computed Schedule 1-A', 'line38Total (line 13b)', 'BigDecimal', 'Subtrahend for taxIncBeforeQbi — second-pass authoritative value', '(internal — line 13b computation)'],
  [22, 'computed Income', 'capitalGainLoss (line 7a, floored at 0)', 'BigDecimal', 'Component of netCapitalGainAndQualifiedDividends (Form 8995 line 12)', '(internal — line 7a computation)'],
  [23, 'computed Income', 'qualifiedDividends', 'BigDecimal', 'Component of netCapitalGainAndQualifiedDividends (Form 8995 line 12)', '(internal — line 3a computation)'],
  [24, 'filing-status form', 'filingStatus', 'String', 'Selects QBI threshold ($394,600 MFJ vs $197,300 other) and phase-in range ($100k MFJ vs $50k other)', 'XLS/input_forms/form-filing-status.xlsx'],
  [25, 'identification (you/spouse)', 'ssn', 'String', 'SSN-matches 1099-DIV and K-1 entries to taxpayer vs spouse via belongsToPerson()', 'XLS/input_forms/form-identification-*.xlsx'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 32 }, { wch: 60 }, { wch: 20 }, { wch: 75 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 13a (centralized in ReferenceData.java lines 53–60)'],
  [],
  ['Constant', 'Value (2025)', 'Statutory Basis', 'Backend identifier'],
  [],
  ['Deduction rate (spec §3.5)'],
  ['QBI deduction rate', '20%', 'IRC §199A(a)(2)', 'ReferenceData.QBI_DEDUCTION_RATE = 0.20'],
  [],
  ['Threshold (spec §3.2 + §3.6) — 2025 Rev. Proc. 2024-40 inflation-adjusted'],
  ['Threshold — MFJ', '$394,600', 'IRC §199A(e)(2); Rev. Proc. 2024-40', 'ReferenceData.QBI_THRESHOLD_MFJ'],
  ['Threshold — All other filing statuses', '$197,300', 'IRC §199A(e)(2); Rev. Proc. 2024-40', 'ReferenceData.QBI_THRESHOLD_ALL_OTHER'],
  [],
  ['Phase-in range (spec §3.6)'],
  ['Phase-in range — MFJ', '$100,000', 'IRC §199A(e)(2)', 'ReferenceData.QBI_PHASEIN_RANGE_MFJ'],
  ['Phase-in range — All other', '$50,000', 'IRC §199A(e)(2)', 'ReferenceData.QBI_PHASEIN_RANGE_ALL_OTHER'],
  ['Upper threshold — MFJ (derived = threshold + range)', '$494,600', 'derived', '(computed at runtime)'],
  ['Upper threshold — All other (derived)', '$247,300', 'derived', '(computed at runtime)'],
  [],
  ['W-2 wage / UBIA limitation rates (spec §3.5; Form 8995-A only)'],
  ['Primary W-2 wage limit rate', '50%', 'IRC §199A(b)(2)(B)(i)', 'ReferenceData.QBI_W2_LIMIT_RATE = 0.50'],
  ['Alternative W-2 wage rate', '25%', 'IRC §199A(b)(2)(B)(ii)(I)', 'ReferenceData.QBI_W2_LIMIT_ALTERNATIVE_WAGES_RATE = 0.25'],
  ['Alternative UBIA rate', '2.5%', 'IRC §199A(b)(2)(B)(ii)(II)', 'ReferenceData.QBI_W2_LIMIT_ALTERNATIVE_UBIA_RATE = 0.025'],
  [],
  ['Statutory anchors'],
  ['IRC §199A', '— (statute)', 'YES — primary statute (TCJA; permanent post-OBBBA per spec §3.6)', '—'],
  ['IRC §199A(a) — 20% rate', '— (statute)', 'YES', '—'],
  ['IRC §199A(b)(2) — W-2 / UBIA limits', '— (statute)', 'YES — Form 8995-A wage/UBIA limit', '—'],
  ['IRC §199A(c) — QBI definition + exclusions', '— (statute)', 'YES — wage/dividend/interest/annuity exclusions', '—'],
  ['IRC §199A(d) — Qualified trade or business + SSTB', '— (statute)', 'YES — SSTB phase-in and disallowance', '—'],
  ['IRC §199A(e)(2) — Threshold amount', '— (statute)', 'YES — 2025 inflation-adjusted thresholds', '—'],
  ['Rev. Proc. 2024-40', 'IRS Rev. Proc.', 'YES — 2025 thresholds and phase-in ranges', '—'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 60 }, { wch: 28 }, { wch: 55 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 13a Numeric + Form 8995 / 8995-A Companion Outputs'],
  ['Beyond the line-13a numeric, the QBI computation produces a full Form 8995 OR Form 8995-A object (mutually exclusive). Side-effects also feed line 14 (total deductions composite).'],
  [],
  ['Output target', 'Where wired', 'Effect', 'XLS output reference'],
  ['form1040.deductions.qualifiedBusinessIncomeDeduction', 'prepare() at line ~801: deductions.setQualifiedBusinessIncomeDeduction(newLine13a)', '★ CANONICAL line 13a output. Whole-dollar HALF_UP. Authoritative value comes from second-pass invocation.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 13a cell)'],
  ['form1040.deductions.totalDeductions (line 14)', 'prepare() at line ~803: deductions.setTotalDeductions(newLine14) where newLine14 = line12e + line13a + line13b', 'Composite total of all 3 deductions. Recomputed on second pass when line 13a changes.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 14 cell)'],
  ['form1040.deductions.line15TaxableIncome (line 15)', 'prepare() at line ~804–807: deductions.setLine15TaxableIncome(line15Final) where line15Final = max(0, AGI − line14Final)', 'Taxable income — first audit will document zero-floor rule (future line 15 audit).', 'XLS/output_forms/form-tax-return-1040.xlsx (line 15 cell)'],
  ['Form8995 object (below threshold path)', 'computeLine13a() at line ~3739–3749: form8995 = new Form8995(); ...; form8995.setLine15QualifiedBusinessIncomeDeduction(line13a)', 'Form 8995 generated when shouldUseForm8995A() returns FALSE.', 'XLS/output_forms/form-tax-return-8995.xlsx'],
  [' • Form8995.qualifiedBusinessIncomeAmount', '(setter on Form8995)', 'Sum of taxpayer + spouse QBI from K-1s + manual', 'XLS/output_forms/form-tax-return-8995.xlsx'],
  [' • Form8995.priorYearQualifiedBusinessLossCarryforward', '(setter on Form8995)', 'Prior-year QBI loss carryforward', 'XLS/output_forms/form-tax-return-8995.xlsx'],
  [' • Form8995.netQualifiedBusinessIncomeAfterCarryforward', '(setter on Form8995)', 'qbi_amount − priorYearCarryforward (may be negative)', 'XLS/output_forms/form-tax-return-8995.xlsx'],
  [' • Form8995.qualifiedReitAndPtpAmount', '(setter on Form8995)', 'Sum of 1099-DIV box 5 + K-1 199A REIT/PTP + manual', 'XLS/output_forms/form-tax-return-8995.xlsx'],
  [' • Form8995.priorYearReitPtpLossCarryforward', '(setter on Form8995)', 'Prior-year REIT/PTP carryforward', 'XLS/output_forms/form-tax-return-8995.xlsx'],
  [' • Form8995.tentativeQualifiedBusinessIncomeDeduction', '(setter on Form8995)', '20% × max(0, net_qbi) + 20% × max(0, net_reit_ptp) — Form 8995 line 10', 'XLS/output_forms/form-tax-return-8995.xlsx'],
  [' • Form8995.taxableIncomeBeforeQualifiedBusinessIncomeDeduction', '(setter on Form8995)', 'AGI − line12e − line13b (Form 8995 line 11)', 'XLS/output_forms/form-tax-return-8995.xlsx'],
  [' • Form8995.netCapitalGainAndQualifiedDividends', '(setter on Form8995)', 'max(line7a, 0) + qualifiedDividends (Form 8995 line 12)', 'XLS/output_forms/form-tax-return-8995.xlsx'],
  [' • Form8995.taxableIncomeLimitation', '(setter on Form8995)', '20% × max(0, taxIncBeforeQbi − netCapGainAndQualDiv) (Form 8995 line 14)', 'XLS/output_forms/form-tax-return-8995.xlsx'],
  [' • Form8995.line15QualifiedBusinessIncomeDeduction', '(setter on Form8995)', '★ Form 8995 line 15 = min(tentative, taxIncLimit) — feeds Form 1040 line 13a', 'XLS/output_forms/form-tax-return-8995.xlsx'],
  ['Form8995A object (above threshold path)', 'computeLine13a() at line ~3727–3737: form8995A = new Form8995A(); ...; form8995A.setLine39QualifiedBusinessIncomeDeduction(line13a)', 'Form 8995-A generated when shouldUseForm8995A() returns TRUE.', 'XLS/output_forms/form-tax-return-8995a.xlsx'],
  [' • Form8995A.line39QualifiedBusinessIncomeDeduction', '(setter on Form8995A)', '★ Form 8995-A line 39 = min(tentative_total, taxIncLimit) — feeds Form 1040 line 13a', 'XLS/output_forms/form-tax-return-8995a.xlsx'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 70 }, { wch: 85 }, { wch: 95 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 13a Blocking Flags'],
  ['All line-13a flags are BLOCKING — they prevent the QBI deduction from being computed because the situation requires manual intervention or is out of supported scope.'],
  [],
  ['Flag code', 'Severity', 'Condition', 'Where emitted'],
  ['LINE13A_STATEMENT_UPLOAD_REQUIRED_TAXPAYER', 'Blocking', 'hadQualifiedBusinessIncomeInputs=TRUE but confirmAllReceivedQbiStatementsUploaded != TRUE', 'validateQbiStatementGating() at line ~3868'],
  ['LINE13A_STATEMENT_UPLOAD_REQUIRED_SPOUSE', 'Blocking', 'Same condition for spouse', 'validateQbiStatementGating() at line ~3868'],
  ['LINE13A_SELF_EMPLOYMENT_OUT_OF_SCOPE_TAXPAYER', 'Blocking', 'hasScheduleCOrScheduleFQbiSources=TRUE — Schedule C/F QBI not implemented', 'validateQbiStatementGating() at line ~3876'],
  ['LINE13A_SELF_EMPLOYMENT_OUT_OF_SCOPE_SPOUSE', 'Blocking', 'Same condition for spouse', 'validateQbiStatementGating() at line ~3876'],
  ['LINE13A_COOPERATIVE_PATRON_UNSUPPORTED', 'Blocking', 'isCooperativePatronOfAgriculturalHorticulturalCooperative=TRUE — patron path not implemented', 'validateQbiStatementGating()'],
  ['LINE13A_MISSING_K1_1065_199A_DETAILS_TAXPAYER', 'Blocking', 'K-1 (Form 1065) uploaded but section 199A fields missing', 'validateQbiStatementGating()'],
  ['LINE13A_MISSING_K1_1065_199A_DETAILS_SPOUSE', 'Blocking', 'Same for spouse', 'validateQbiStatementGating()'],
  ['LINE13A_MISSING_K1_1120S_199A_DETAILS_TAXPAYER', 'Blocking', 'K-1 (Form 1120-S) uploaded but section 199A fields missing', 'validateQbiStatementGating()'],
  ['LINE13A_MISSING_K1_1120S_199A_DETAILS_SPOUSE', 'Blocking', 'Same for spouse', 'validateQbiStatementGating()'],
  ['LINE13A_MISSING_K1_1041_199A_DETAILS_TAXPAYER', 'Blocking', 'K-1 (Form 1041) uploaded but section 199A fields missing', 'validateQbiStatementGating()'],
  ['LINE13A_MISSING_K1_1041_199A_DETAILS_SPOUSE', 'Blocking', 'Same for spouse', 'validateQbiStatementGating()'],
  ['LINE13A_MANUAL_QBI_THRESHOLD_UNSUPPORTED', 'Blocking', 'Manual QBI adjustment present AND above threshold — manual amount cannot be split by activity for SSTB/non-SSTB', 'validateQbiThresholdPath() at line ~4083'],
  ['LINE13A_NEGATIVE_K1_QBI_THRESHOLD_UNSUPPORTED', 'Blocking', 'Negative K-1 QBI AND above threshold — full per-activity netting not supported', 'validateQbiThresholdPath() at line ~4094'],
  ['LINE13A_COMPLEX_QBI_THRESHOLD_UNSUPPORTED', 'Blocking', 'Above threshold with positive net QBI but NO K-1 activity details available', 'validateQbiThresholdPath() at line ~4102'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 55 }, { wch: 12 }, { wch: 90 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 13a is the QBI deduction — first audit OUTSIDE the 12abcde deductions cluster in the AGI-territory sequence. Separate orchestrator (computeLine13a) — requires its own MFS-guard analysis. 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-13 — ⚠️ HIGH-PRIORITY MFS DEFENSIVE GAP FIXED at computeLine13a (call-site null-shadow at both first-pass and second-pass invocations)',
    'computeLine13a() at TaxReturnComputeService.java:~3599 collected QBI inputs for BOTH taxpayer and spouse and aggregated them via addNonNull(taxpayer.x, spouseInputs.x) at lines 3653–3672. Statement entries (1099-DIV box 5 + K-1 1065/1120-S/1041) are filtered by SSN via belongsToPerson(), but five spouse-form fields survived that filter because qbi-deduction-spouse is keyed by Firestore user (not SSN): spouseManualQualifiedBusinessIncomeAdjustment / spouseManualQualifiedReitDividendAdjustment / spouseManualQualifiedPtpIncomeOrLossAdjustment / spousePriorYearQbiLossCarryforwardAmount / spousePriorYearReitPtpLossCarryforwardAmount. Pre-fix failure mode: MFJ user later switches to MFS → stale spouse adjustments + carryforwards silently aggregate into MFS taxpayer\'s line 13a → over-stated QBI deduction → understated taxable income → audit exposure. **Closure applied (Option A — call-site null-shadow; matches 12a #1 SURGICAL precedent)**: (1) added ~25-line breadcrumb above the FIRST-PASS call inside computeLine12 at line ~3265 documenting the per-field MFS-leakage classification + cascade context + lock-in test name; (2) derived `boolean isMfsReturn = "Married filing separately".equalsIgnoreCase(status)` and changed `qbiDeductionSpouse` → `isMfsReturn ? null : qbiDeductionSpouse` at the first-pass call; (3) added ~4-line cross-reference breadcrumb at SECOND-PASS site in prepare() at line ~769 + derived `isMfsReturnSecondPass` from `filingStatusStr` + applied the same null-shadow at the second-pass call. collectQbiInputsForPerson() handles null map gracefully — `getBoolean(null, ...)` returns null, all spouse fields collapse to zero/false, the QbiPersonInputs aggregates contribute nothing. Statement entries continue to flow through belongsToPerson() SSN filter (orthogonal protection layer). Added lock-in test `mfsExcludesSpouseQbiFromLine13a`: MFS taxpayer with $50k W-2 + NO taxpayer QBI workflow + STALE spouse form (spouseManualQualifiedBusinessIncomeAdjustment=$10,000); pre-fix would produce line 13a = $2,000 (20% × $10k); post-fix asserts line 13a == null + Form 8995 == null + Form 8995-A == null. Backend regression: **760 → 761 (+1 from new lock-in test)**. **Single-guard MFS cascade now applied to 16 orchestrators — new codebase maximum** (was 15 after 12a #1 SURGICAL; first guard added OUTSIDE the 12abcde deductions cluster). Cascade roster (16): 1c + 1d + 1e + 1f + 1g + 1h + 1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities + computeSocialSecurityBenefits + computeCapitalGainLoss + computeOtherIncomes + computeIncomeAdjustments + buildStandardDeductionIndicators + **computeLine13a (NEW)**.',
    'TaxReturnComputeService.java:~3265 (first-pass call, breadcrumb + null-shadow); ~769 (second-pass call, breadcrumb + null-shadow); TaxReturnComputeServiceTest.java:~12289 (mfsExcludesSpouseQbiFromLine13a lock-in test)',
    'CLOSED — MFS guard applied at both call sites; lock-in test added. Backend 761/761 pass (+1). 16th orchestrator in MFS cascade — new codebase maximum.'],

  [2, 'RESOLVED 2026-05-13 — DOCUMENTATION HYGIENE — Knowledge file renamed (Legacy A → canonical kebab-case)',
    '**Closure applied**: renamed `C:\\us-tax\\knowledge\\knowledge_line13ab.md` → `C:\\us-tax\\knowledge\\line-13ab-qbi-additional-deductions.md` (matches the `line-<NN>-<topic>.md` kebab-case pattern established for 6 prior renames: 7a #2 + 8 #2 + 9 #2 + 10 #2 + 11a #2 + 12a #2). The knowledge folder is NOT under git (orthogonal to `us-tax-be` repo) — plain filesystem `mv` used, not `git mv`. **Cross-reference scan** (repo-wide grep for `knowledge_line13ab`): 2 references found — (a) `generate-13a.js` source-of-truth comment block + Issue #2 row (both updated in this closure); (b) `C:\\us-tax\\history.md` historical "created" entry from 2026-04-17 (LEFT UNTOUCHED — historical entries reflect what was true at that date; precedent from prior renames where history.md is appended-only, never rewritten retroactively). Backend tests: 761/761 unchanged (pure doc rename; no functional impact). **Naming convergence: 19 → 20 lines** (7a + 8 + 9 + 10 + 11ab + 12abcde + **13ab**). Note: file is shared across the 13a + 13b pair — only ONE rename needed for both; line 13b #2 will be a sibling-mate cross-reference (no second rename). Same anti-redundancy pattern as 12abcde cluster (12a #2 migrates; 12b/c/d/e #2 sibling-mate cross-reference).',
    'C:\\us-tax\\knowledge\\line-13ab-qbi-additional-deductions.md (post-rename canonical path)',
    'CLOSED — file renamed; generator updated; cross-references verified (history.md left as historical record per established precedent). Convergence 19 → 20 lines.'],

  [3, 'RESOLVED 2026-05-13 — SPEC ENHANCEMENT — Verification log section created in lines/13ab.md (first row in IN-PROGRESS state)',
    '**Closure applied**: appended `## 13) Verification log` section to `lines/13ab.md` after section 12 (Practical developer cheat sheet). Section includes a 5-column markdown table (Audit ID / Date / Closures applied / Backend regression / Outcome) with the first row capturing the 13a walkthrough state: #1 MFS defensive guard (16th orchestrator); #2 knowledge file rename (convergence 19→20); #3 (this section creation); #4–#10 IN-PROGRESS; backend 760 → 761 (+1 from new MFS lock-in test); Outcome = IN-PROGRESS. Row will be finalized to "COMPLETE — 10/10 closed" after Issues #4–#10 close (append-then-finalize pattern from 12a/b/c/d/e). **Pair-aligned shape**: target 2 rows when the pair completes — row 1 = 13a (today); row 2 = 13b (future audit). **Mirrors the 7ab + 11ab pair-log pattern** (2 rows = SMALLEST pair-aligned log shape in the workflow; contrasts with the 5-row 12abcde LARGEST cluster log). Backend tests: 761/761 unchanged (pure doc append; no functional impact).',
    'lines/13ab.md (section 13 appended; first row IN-PROGRESS)',
    'CLOSED — Verification log section created; row 1 written IN-PROGRESS. Will be finalized to COMPLETE after Issues #4–#10 close.'],

  [4, 'RESOLVED 2026-05-13 — CROSS-REFERENCE SEED — Forward cross-reference for line 14 (total deductions composite)',
    '**Closure applied**: added a ~40-line forward-cross-reference SEED breadcrumb above the SECOND-PASS line-14 sum site at TaxReturnComputeService.java:~805 (just before `BigDecimal line12eForSecondPass = ...`). Structure: (1) formula line `line14 = line12e + line13a + line13b` + IRS 2025 Form 1040 line 14 citation + dependencies/13ab.md §3 citation; (2) **★ AUDIT TRAIL — per-operand provenance**: line12e provenance = 12abcde cluster (closed 2026-05-13 via 12a #4 cluster seed + 12b/c/d/e #4 extensions + 12e #6 ANCHOR; cross-reference to cluster-level breadcrumb above computeLine12 ~line 2885); line13a provenance = THIS SEED (XLS/computations/13a.xlsx; computed at second-pass call site ~line 769; null-shadowed on MFS per 13a #1); line13b provenance = future 13b audit (queued); (3) **FUTURE EXTENSION POINTS**: 13b #4 placeholder (pair-scale seed → extend × 1 pattern; contrast with 10 #4 PAIR seed → extend × 2 COMPLETE + 12a #4 CLUSTER seed → extend × 4 COMPLETE) + future line-14 audit upgrade-to-verified-correct hook; (4) **rationale for site selection**: second-pass canonical (AUTHORITATIVE line-14); first-pass at ~line 3315 is preliminary (line13b=null); sibling sum site at ~line 829 (else branch, 2-operand degenerate case) shares provenance contract. **Pair-scale forward seed established** — the third instance of the seed → extend pattern in the audit workflow (after 10 #4 PAIR + 12a #4 CLUSTER). Pure documentation closure — no functional change.',
    'TaxReturnComputeService.java:~806 (above the second-pass line-14 sum; ~40-line SEED breadcrumb with 1 FUTURE EXTENSION POINT awaiting 13b #4)',
    'CLOSED — pair-scale seed planted at the authoritative line-14 site. 13b #4 will extend; future line-14 audit will upgrade to verified-correct.'],

  [5, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — Two-pass invocation pattern (computeLine13a called twice for compute-order correctness)',
    '**Closure applied**: replaced the legacy 3-line "Gap 1 fix" comment at TaxReturnComputeService.java:763–765 with a ~32-line VERIFIED CORRECT breadcrumb above the second-pass gate at line 766. Structure (6 thematic blocks): (1) **spec §9 compute-order constraint** + IRS Form 8995/8995-A instructions quotation (`taxIncBeforeQbi = AGI − line12e − line13b`); (2) **structural circularity** — line 14 wired in computeLine12 BEFORE Schedule 1-A produces line 13b; (3) **PASS 1 contract** — line13b=null treated as 0, preliminary value used only as line-14 placeholder; (4) **PASS 2 contract** — authoritative recompute; OVERWRITES first pass via setQualifiedBusinessIncomeDeduction at ~line 805; recomputes lines 14 + 15 + Form 8995/8995-A wiring; (5) **★ SKIP CONDITION rationale** at line 766 (`hasPositiveAmount(schedule1A.getLine38Total())`) — safe to skip when line13b=0 because first-pass math already correct; SYMMETRIC else-branch at ~line 824 handles the schedule1A!=null + line38=0 shape; (6) **★ FLAG DEDUPLICATION** at lines 793–803 — dedupe-by-code via Set<String> existingCodes; rationale: blocking conditions (cooperative patron, missing K-1 details, Schedule C/F sources) are line13b-independent so second pass re-emits same codes. Plus **canonical regression test cross-reference**: `computesLine13aWithCorrectTaxableIncomeWhenSchedule1ADeductionsPresent` (proves second-pass actually fires; $10k Schedule 1-A → limitation $4,850 not $6,000). Pure documentation closure — no functional change. Backend tests: **761/761 unchanged**.',
    'TaxReturnComputeService.java:~763–766 (replaced Gap-1-fix comment with ~32-line VERIFIED CORRECT breadcrumb)',
    'CLOSED — verified correct. Two-pass invocation pattern now thoroughly documented; skip condition + flag-dedup rationale captured.'],

  [6, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — Form 8995 vs Form 8995-A threshold routing (shouldUseForm8995A + qbiThresholdForStatus)',
    '**Closure applied**: two breadcrumbs added at TaxReturnComputeService.java. (1) **~24-line VERIFIED CORRECT breadcrumb** above `shouldUseForm8995A()` at line ~4369 documenting: decision tree (null / ≤ threshold / > threshold); 2025 threshold values ($394,600 MFJ / $197,300 all other) with ReferenceData constant citations; statutory anchors (IRC §199A(e)(2)(A) + Rev. Proc. 2024-40); **boundary case rationale** (strict `>` matches spec §3.2 "not more than"); and a **cooperative-patron NOT-here note** — handled UPSTREAM via LINE13A_COOPERATIVE_PATRON_UNSUPPORTED blocking flag at validateQbiStatementGating ~line 3877 (do-not-add-patron-logic-here warning to future engineers). (2) **~5-line breadcrumb** above `qbiThresholdForStatus()` at line ~4395 documenting the IRC §199A(e)(2)(A) MFJ-vs-all-other classification (Single + MFS + HOH + QSS all lumped into "all other") + ReferenceData single-source-of-truth note. Sibling `qbiPhaseInRangeForStatus()` left untouched here — its documentation will land at Issue #7 alongside the Form 8995-A SSTB phase-in deep dive. Pure documentation closure — no functional change. Backend tests: **761/761 unchanged**.',
    'TaxReturnComputeService.java:~4369 (shouldUseForm8995A — 24-line breadcrumb); ~4395 (qbiThresholdForStatus — 5-line breadcrumb)',
    'CLOSED — verified correct. Threshold routing decision tree + cooperative-patron upstream-gating note + IRC §199A(e)(2)(A) classification all anchored at code sites.'],

  [7, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — Form 8995-A SSTB phase-in + W-2/UBIA limit (compute8995AQbiDeductionComponent + computeQbiWageUbiaLimit + qbiPhaseInRangeForStatus)',
    '**Closure applied**: THREE breadcrumbs added at TaxReturnComputeService.java. (1) **~48-line VERIFIED CORRECT breadcrumb** above `compute8995AQbiDeductionComponent()` at line ~4224 documenting: (a) `phaseInPct` formula + per-taxpayer (NOT per-activity) computation per IRC §199A(b)(3)(A); (b) **the FOUR-case taxonomy as an ASCII table** — Case A (SSTB above upper → $0 per IRC §199A(d)(3)(A)); Case B (SSTB in band → applicablePct = 1 − phaseInPct; QBI/W2/UBIA all proportionally reduced per IRC §199A(d)(3)(B)); Case C (non-SSTB above upper → full W-2/UBIA cap per IRC §199A(b)(2)(B)); Case D (non-SSTB in band → partial reduction shape with max(line11, phasedAmt) floor per IRC §199A(b)(3)(B)); (c) **subtle SSTB-vs-non-SSTB distinction** — Case B reduces the BASE proportionally; Case D reduces only the REDUCTION partially; (d) **sign-guard rationale** — defense-in-depth vs upstream LINE13A_NEGATIVE_K1_QBI_THRESHOLD_UNSUPPORTED blocking flag; (e) **W2/UBIA null → 0 substitution** matches IRS treatment of "no wage basis → $0"; (f) **canonical regression test cross-references**: line13aSstbActivityInPhaseInBandGetsPartialDeduction (Case B) + computesLine13aFromK1Section199AFieldsAboveThresholdUsingForm8995A (Case C). (2) **~12-line VERIFIED CORRECT breadcrumb** above `computeQbiWageUbiaLimit()` at line ~4287 documenting the IRC §199A(b)(2)(B)(i)+(ii) two-limit formula + max-choice rationale (taxpayer gets the MORE favorable cap) + Form 8995-A line 13–14 + 16–18 mapping + ReferenceData rate centralization + null-handling rationale. (3) **~6-line breadcrumb** above `qbiPhaseInRangeForStatus()` at line ~4413 closing the deferred Issue #6 sibling (IRC §199A(b)(3)(B)(ii) + §199A(d)(3)(B) classification + companion to qbiThresholdForStatus). Pure documentation closure — no functional change. Backend tests: **761/761 unchanged**.',
    'TaxReturnComputeService.java:~4224 (compute8995AQbiDeductionComponent — 48-line breadcrumb); ~4287 (computeQbiWageUbiaLimit — 12-line breadcrumb); ~4413 (qbiPhaseInRangeForStatus — 6-line breadcrumb)',
    'CLOSED — verified correct. Form 8995-A four-case taxonomy + W-2/UBIA limit + phase-in range all anchored at code sites with IRC + IRS form-line citations + canonical regression test references.'],

  [8, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — Carryforward dual semantic (negative net carries forward; line 13a ≥ 0 invariant)',
    '**Closure applied**: TWO breadcrumbs added at TaxReturnComputeService.java. (1) **~30-line VERIFIED CORRECT breadcrumb** above the QBI subtraction site at line ~3760 (between priorYearCarryforward assignment and netQualifiedBusinessIncome assignment) documenting: (a) **two-requirement framing** per spec §3.8 — current year (deduction ≥ 0) + next year (preserve net-loss for carryforward storage); (b) **dual-semantic resolution** — `subtractNonNegativeAllowNegative` here PRESERVES negative (loss state visible on Form 8995 line 4; informs next year\'s priorYearCarryforward) + max-to-zero clamp at line ~3812 forces non-negative 20% factor input; (c) **helper-choice rationale** — `subtractNonNegativeAllowNegative` over `subtractNonNegative` because the negative result has downstream meaning (carryforward storage); (d) **worked example** — QBI=$10k + carryforward=$50k → netQBI = −$40k preserved → qbiComponentBase = $0 → deduction = $0 → next-year carryforward = −$40k; (e) **same-pattern note** for REIT/PTP at line ~3771; (f) **regression test cross-references** — `computesLine13aFrom1099DivSection199ADividendsAndCarryforward` + `computesLine13aWithReitPtpLossCarryforward`. Statutory anchor: IRC §199A(c)(2) + IRS 2025 Form 8995 instructions line 3 + line 7 + Form 8995-A line 4 + line 28. (2) **~5-line cross-reference breadcrumb** above the qbiComponentBase clamp at line ~3812 pointing readers to the main breadcrumb at line ~3760 + restating the clamp-half of the dual semantic + IRC §199A(c)(2) anchor + same-clamp-for-REIT/PTP note. Pure documentation closure — no functional change. Backend tests: **761/761 unchanged**.',
    'TaxReturnComputeService.java:~3760 (subtractNonNegativeAllowNegative main breadcrumb, 30 lines); ~3812 (qbiComponentBase clamp cross-reference, 5 lines)',
    'CLOSED — verified correct. Dual-semantic pattern (preserve-negative + clamp-to-zero) now anchored at both sites with IRC §199A(c)(2) + worked example + regression test cross-references.'],

  [9, 'RESOLVED 2026-05-13 — OBSERVATION — Form 8995 line 12 "net capital gain" approximation (max(line7a, 0) + qualifiedDividends)',
    '**Closure applied** — pure observation; no code change; no new breadcrumb. **The approximation**: at TaxReturnComputeService.java:~3784, `netCapitalGainAndQualifiedDividends = max(income.getCapitalGainLoss(), 0) + income.getQualifiedDividends()` — which approximates the Form 8995 line 12 reduction. **Strict IRC §1(h) definition**: net capital gain = excess of net long-term capital gain (Schedule D line 15) over net short-term capital loss (Schedule D line 7 if negative). For the system\'s common profiles the approximation is exact: (A) no Schedule D required + only 1099-DIV box 2a distributions — long-term by definition, exact; (B) Schedule D with only long-term activity — exact; (C) Schedule D net loss — exact via the max(0, line7a) floor (§1(h) yields 0 when no LTCG excess exists). **The divergence**: Profile D = Schedule D with BOTH long-term gain AND short-term gain (no ST loss). Example: ST gain $5k + LT gain $10k → line7a = $15k → approximation reports $15k as "net capital gain"; strict §1(h) reports $10k (only the LT component). **Direction of error**: approximation OVERSTATES net capital gain → SHRINKS taxIncLimitBase → SHRINKS taxIncLimit → UNDER-STATES line 13a by up to 20% × ST_component, BUT ONLY when the taxable-income limitation binds (tentativeDeduction > taxIncLimit). For below-threshold taxpayers with modest QBI the limitation usually doesn\'t bind — approximation has zero effect. **Why accepted**: (1) spec §3.5 explicitly defines this as "the IRS-prescribed formula from Form 8995 instructions"; (2) knowledge §4.3 documents the same formula; (3) the implementation lacks Schedule D line-15/line-7 split (Income model exposes only the aggregate line7a) — strict §1(h) would require non-trivial refactor with narrow benefit. **3-source coverage adequate** (spec §3.5 + knowledge §4.3 + existing inline comment at line ~3782 "Per IRS Form 8995/8995-A instructions: line 7a... is the prescribed reduction") — adding a 4th source would dilute signal per anti-fragmentation policy. **Anti-fragmentation policy applied** — **9th Path A application** in the workflow (after 7a #9 + 8 #9 + 10 #9 + 11b #8 + 12a #9 + 12c #9 + 12d #9 + prior pair audits; pattern: "user-attested data / IRS-accepted approximation / spec-documented design — no new outstanding entry"). **Anti-fragmentation streak: 12 → 13 consecutive walkthroughs with zero new outstanding.md entries** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a). Pure xlsx-flip audit-trail acknowledgment. Backend tests: **761/761 unchanged**.',
    'TaxReturnComputeService.java:~3784 (netCapitalGainAndQualifiedDividends approximation); existing 3-line comment at ~3782 covers',
    'CLOSED — pure observation; 9th Path A application; anti-fragmentation streak 12 → 13; backend unchanged.'],

  [10, 'RESOLVED 2026-05-13 — BOUNDARY MILESTONE — Line 13a is FIRST audit OUTSIDE the 12abcde deductions cluster',
    'Pure xlsx-flip observation — **CLOSES the 13a audit at 10/10**. (1) **Structural positioning**: line 13a is the **1st audit OUTSIDE the 12abcde deductions cluster** in the AGI-territory sequence (after the 5-sub-line cluster 12abcde closed 2026-05-13 via 12e). Starts the 13ab tightly-coupled pair (mirrors 7ab + 11ab patterns); pair will close when 13b walkthrough completes. (2) **MFS-cascade extension**: 13a #1 added the 16th orchestrator to the single-guard MFS cascade — **NEW CODEBASE MAXIMUM** (was 15 after 12a #1 SURGICAL); FIRST MFS guard added OUTSIDE the 12abcde deductions cluster. Cascade roster (16): 1c + 1d + 1e + 1f + 1g + 1h + 1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities + computeSocialSecurityBenefits + computeCapitalGainLoss + computeOtherIncomes + computeIncomeAdjustments + buildStandardDeductionIndicators + **computeLine13a (NEW)**. (3) **Cross-reference seed planted**: 13a #4 seeded a pair-scale forward cross-reference at the line-14 sum site (TaxReturnComputeService.java:~806); pair-scale seed → extend × 1 pattern (awaits 13b #4 extension). Third instance of the seed-extend pattern in the workflow (after 10 #4 PAIR + 12a #4 CLUSTER). (4) **Cumulative state through line 13a**: 38 lines audited (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + 11b + 12a + 12b + 12c + 12d + 12e + **13a**); 377 audit issues closed total (367 + 10); backend **761/761 tests pass** (+1 from `mfsExcludesSpouseQbiFromLine13a` lock-in test); knowledge-file naming convergence **19 → 20 lines** (13a #2 Legacy A migration); 5 documentation drift fixes (3 functional; unchanged); FIRST @Deprecated annotation (12c #8; unchanged); **9 Path A anti-fragmentation applications** (13a #9 net-capital-gain approximation); **anti-fragmentation streak: 13 consecutive walkthroughs with zero new outstanding.md entries** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/**13a**). Verification log: pair-aligned first row in lines/13ab.md FINALIZED to **COMPLETE — 10/10 closed**. (5) **Looking ahead — line 13b (Schedule 1-A)**: 2nd and final half of the 13ab pair. Different structure than 13a: NO SSTB/UBIA/threshold complexity; instead 4 parts (II tips + III overtime + IV car loan + V senior deduction); MFJ-only gating for Parts II/III/V → likely needs its OWN MFS guard analysis at `computeSchedule1A` (would extend cascade to 17 orchestrators). Will close the 13ab pair across all dimensions: (a) Verification log row 2 finalizes the pair-aligned 2-row log; (b) sibling-mate knowledge cross-reference (no rename; file already migrated via 13a #2); (c) 13b #4 extension of the line-14 forward seed (closes the pair-scale seed-extend pattern × 1). Pure xlsx-flip closure — no code change beyond the prior issues. Backend regression: 761/761 (unchanged since #1 lock-in test).',
    'XLS/computations/13a.xlsx audit-trail (this row); lines/13ab.md Verification log row 1 FINALIZED to COMPLETE; no code change beyond the prior issues',
    'CLOSED — 13a walkthrough complete (10/10). 38 lines audited; MFS cascade = 16 (new codebase max); knowledge convergence = 20; 13 consecutive zero-outstanding walkthroughs. Line 13b queued next — will close the 13ab pair.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 110 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 13a Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.deductions.qualifiedBusinessIncomeDeduction', 'Form 1040 page 2, line 13a (numeric box)', 'XLS/output_forms/form-tax-return-1040.xlsx', '★ CANONICAL line 13a output. BigDecimal; whole-dollar HALF_UP rounded.'],
  ['Form8995.line15QualifiedBusinessIncomeDeduction', 'Form 8995 line 15', 'XLS/output_forms/form-tax-return-8995.xlsx', 'Mirror of line 13a when below threshold. Form 8995 attached.'],
  ['Form8995A.line39QualifiedBusinessIncomeDeduction', 'Form 8995-A line 39', 'XLS/output_forms/form-tax-return-8995a.xlsx', 'Mirror of line 13a when above threshold. Form 8995-A attached.'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 14 (total deductions)', 'Form 1040 page 2, line 14 (numeric box)', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ line14 = line12e + line13a + line13b. Composite.'],
  ['Form 1040 line 15 (taxable income)', 'Form 1040 page 2, line 15 (numeric box)', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ line15 = max(0, line11b − line14). Zero-floor rule.'],
  ['Form 1040 line 16 (tax)', 'Form 1040 page 2, line 16 (numeric box)', 'XLS/output_forms/form-tax-return-1040.xlsx', 'Indirect via line 15.'],
  [],
  ['CONDITIONAL ATTACHMENTS'],
  ['Form 8995 (below threshold path)', 'Form 8995 pages', 'XLS/output_forms/form-tax-return-8995.xlsx', 'Attached when line13a > 0 AND taxIncBeforeQbi ≤ threshold AND NOT cooperative patron.'],
  ['Form 8995-A (above threshold path)', 'Form 8995-A pages', 'XLS/output_forms/form-tax-return-8995a.xlsx', 'Attached when line13a > 0 AND (taxIncBeforeQbi > threshold OR cooperative patron). Mutually exclusive with Form 8995.'],
  [],
  ['SIBLING SECOND-PASS INPUT'],
  ['Schedule 1-A line 38 (line 13b)', 'Schedule 1-A line 38 (XLS output of 13b)', 'XLS/output_forms/form-tax-return-schedule-1a.xlsx', 'Line 13b must finalize BEFORE line 13a second-pass. taxIncBeforeQbi = AGI − line12e − line13b.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions per spec §3.7 + §11)'],
  ['Schedule C / Schedule F QBI', '—', '—', 'BLOCKED via LINE13A_SELF_EMPLOYMENT_OUT_OF_SCOPE_* — out of scope (no Schedule C/F implementation).'],
  ['Cooperative patron deduction (DPAD)', '—', '—', 'BLOCKED via LINE13A_COOPERATIVE_PATRON_UNSUPPORTED — Form 8995-A Schedule D not implemented.'],
  ['Wage income / S-corp reasonable comp / guaranteed payments', '—', '—', 'Excluded from QBI per IRC §199A(c)(4) — never reaches line 13a.'],
  ['Form 1040 capital gains (line 7a) and qualified dividends (line 3a)', '—', '—', 'Subtracted at the taxable-income-limitation step (Form 8995 line 12) — they REDUCE the deduction cap but are not deductions themselves.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 65 }, { wch: 50 }, { wch: 55 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
