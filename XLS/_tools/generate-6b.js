// ============================================================================
//  Generates: C:\us-tax\XLS\computations\6b.xlsx
//
//  Source-of-truth references:
//    - lines/6abcd.md §6 (taxable benefits computation for line 6b) + §7 (lump-sum election)
//    - dependencies/6abcd.md
//    - knowledge/line-6abcd-social-security.md (renamed 2026-05-12 via 6a #2)
//    - TaxReturnComputeService.computeSocialSecurityBenefits() (orchestrator with MFS guard from 6a #1)
//    - TaxReturnComputeService.computeTaxableSocialSecurityNormal() (Pub. 915 Worksheet)
//    - TaxReturnComputeService.computeTaxableSocialSecurityLumpSum() (Pub. 915 Worksheet 3)
//    - PDF semantic CSV f1_69[0] line6b_social_security_taxable_amount
//    - IRS 2025 Form 1040 line 6b instructions + Social Security Benefits Worksheet (i1040gi_2025.txt)
//    - IRS Pub. 915 (2025) Social Security and Equivalent Railroad Retirement Benefits
//    - IRC §86 (Social Security taxation), §86(e) (lump-sum election method)
//
//  Tax year: 2025
//
//  NOTE: Line 6b is the TAXABLE-amount line of the Social Security family — the value-bearing
//  counterpart to line 6a (gross/disclosure). Per the gross-vs-taxable pattern (4a #4 / 5a #4 /
//  6a #4): line 6b IS the operand in line 9 (line 6a is excluded as disclosure-only). Adding 6b
//  to the line-9 breadcrumb completes the **6a/6b bilateral coverage milestone** — third and
//  FINAL gross-vs-taxable distribution pair to achieve bilateral coverage.
//
//  Line 6b-specific verifications focus on:
//   • Pub. 915 worksheet structure (w1/w2/w5/w7 chain)
//   • Worksheet line 6 — Schedule 1 SUBSET (lines 11-20 + 23 + 25, NOT full line 26)
//   • MFS-lived-with-spouse restrictive branch
//   • 85% cap + base/second-tier bracket logic
//   • Lump-sum election fidelity (Pub. 915 Worksheet 3 with prior-year recompute)
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '6b.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 6b — SOCIAL SECURITY BENEFITS TAXABLE AMOUNT'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 6b'],
  ['Concept', 'TAXABLE amount of Social Security benefits for the return (taxpayer + spouse aggregated). Per IRS 2025 Form 1040 instructions + IRC §86: line 6b is the SS portion that enters gross income under the provisional-income tier formula. **Line 6b IS the operand in line 9** (the value-bearing counterpart to line 6a, which is disclosure-only). Per the gross-vs-taxable pattern (4a #4 → 5a #4 → 6a #4): gross side excluded from line 9, taxable side included.'],
  ['Core invariant', 'Line 6b ≥ 0 (zero-floor enforced via subtractNonNegative + max(0, ...)). Line 6b ≤ 0.85 × Line 6a (statutory 85% cap per IRC §86(a)(2)). Line 6b = 0 when provisional income is at or below base amount (concept-applies-but-zero canonical).'],
  ['Per-Return Formula',
    'PROVISIONAL INCOME (Pub. 915 Worksheet, IRS 2025 1040 instructions):\n' +
    '  w1 = line6a\n' +
    '  w2 = 0.50 × w1\n' +
    '  w3 = line1z + line2b + line3b + line4b + line5b + line7a + line8     // Form 1040 other income\n' +
    '  w4 = line2a                                                          // Tax-exempt interest\n' +
    '  w5_adj = sum(Form 2555 taxpayer lines 45+50, spouse lines 45+50, adoption exclusion) // Pub. 915 worksheet line 5 add-backs\n' +
    '  w6_sum = w2 + w3 + w4 + w5_adj                                       // IRS worksheet line 6 (modified AGI)\n' +
    '  w7_adj = Schedule 1 lines 11-20 + 23 + 25                            // IRS worksheet line 7 — SUBSET (NOT full line 26)\n' +
    '  w8 = max(0, w6_sum − w7_adj)                                         // Adjusted modified AGI\n\n' +
    'BASE AMOUNTS (IRC §86(c)) — depending on filing status:\n' +
    '  base   = MFJ $32,000 / others $25,000 / MFS-lived-with-spouse $0 (skip)\n' +
    '  second = MFJ $44,000 / others $34,000\n\n' +
    'MFS-LIVED-WITH-SPOUSE BRANCH (restrictive):\n' +
    '  if MFS AND livedWithSpouseAnyTime:\n' +
    '    return min(0.85 × w1, 0.85 × w8)                                   // 85% cap on benefits AND 85% of full provisional income\n\n' +
    'TIER COMPUTATION (50%/85%):\n' +
    '  overBase   = max(0, w8 − base)\n' +
    '  if overBase ≤ 0: return 0                                            // Concept-applies-but-zero (under base)\n' +
    '  taxableUpTo50 = min(0.50 × w1, 0.50 × overBase)\n' +
    '  overSecond = max(0, w8 − second)\n' +
    '  if overSecond > 0:\n' +
    '    plateau = min(0.50 × (second − base), 0.50 × w1)\n' +
    '    taxable = plateau + 0.85 × overSecond\n' +
    '  else:\n' +
    '    taxable = taxableUpTo50\n' +
    '  return min(0.85 × w1, taxable)                                       // Statutory 85% cap per IRC §86(a)(2)\n\n' +
    'LUMP-SUM ELECTION (Pub. 915 Worksheet 3, IRC §86(e)):\n' +
    '  if hasLumpSumBackPayment:\n' +
    '    taxableLumpSum = computeTaxableSocialSecurityLumpSum(...)          // Recompute prior-year taxable using prior-year income\n' +
    '    if electsLumpSumElection AND taxableLumpSum < taxableNormal:\n' +
    '      line6b = taxableLumpSum                                          // Election beneficial → use lower amount\n' +
    '      line6c_checked = true\n' +
    '    else:\n' +
    '      line6b = taxableNormal\n' +
    '  else:\n' +
    '    line6b = taxableNormal\n\n' +
    'FINAL 85% CAP + ZERO-FLOOR:\n' +
    '  if line6a != null AND line6b == null: line6b = 0                     // IRS rule: when benefits exist, line 6b shows 0 not blank\n' +
    '  line6b = min(0.85 × line6a, max(0, line6b))                          // Belt-and-suspenders 85% cap'],
  ['Filed', 'Form 1040 line 6b. PDF field: topmostSubform[0].Page1[0].f1_69[0] (semantic: line6b_social_security_taxable_amount). Sibling line 6a at f1_68[0].'],
  ['Backend method',
    'TaxReturnComputeService.computeSocialSecurityBenefits() — orchestrator (MFS guard from 6a #1 protects line 6b too).\n' +
    'TaxReturnComputeService.computeTaxableSocialSecurityNormal() (~line 8663) — Pub. 915 worksheet structure.\n' +
    'TaxReturnComputeService.computeTaxableSocialSecurityLumpSum() (~line 8724) — Pub. 915 Worksheet 3 lump-sum recompute.'],
  ['Output', 'form1040.income.taxableSocialSecurityBenefits (BigDecimal; never blank when line 6a is populated — IRS rule from 6a #8: when SS concept applies, line 6b shows zero if not taxable, not null). When non-null, enters the line 9 addNonNull chain as the 6th operand.'],
  ['IRS source', 'IRS 2025 Form 1040 instructions for line 6b + Social Security Benefits Worksheet (i1040gi_2025.txt lines ~6429-6750); IRS Pub. 915 (2025); IRC §86 (Social Security taxation); IRC §86(c) (base amounts); IRC §86(e) (lump-sum election method); IRC §86(a)(2) (85% statutory cap)'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Aggregate line 6a (taxpayer + spouse gross, net of SSI)', 'Performed at orchestrator; line 6a is the input to w1. MFS-protected via 6a #1 (spouse-side nulled on MFS).'],
  [2, 'Determine MFS branch from livedWithSpouseAnyTime', '`mfsLivedWithSpouseAnyTime = isMfs AND livedWithSpouseAnyTime`. Drives restrictive branch path.'],
  [3, 'Compute worksheetLine3 (other income)', '`line1z + line2b + line3b + line4b + line5b + line7a + line8` per spec §6.2 worksheet line 3. Override via `importedReturnWorksheetLine3IncomeTotal` if user-provided.'],
  [4, 'Compute worksheetLine4 (tax-exempt interest)', '`interest.line2aTaxExemptInterest()`. Override via `importedReturnWorksheetLine4TaxExemptInterest` if user-provided.'],
  [5, 'Compute worksheetLine5 (exclusion add-backs per Pub. 915)', '`Form 2555 (taxpayer + spouse) lines 45+50 + adoptionExclusion (line 1f)`. Per Pub. 915 worksheet line 5. **Gaps**: Form 8815 savings bond + Samoa/PR exclusions still deferred (spec §6.2).'],
  [6, 'Compute worksheetLine6 (Schedule 1 SUBSET adjustments)', '⚠️ **CRITICAL**: Per IRS Pub. 915 + 1040 worksheet line 7: should be Schedule 1 **lines 11-20 + 23 + 25 ONLY** (NOT full line 26). Current code uses `incomeAdjustments.line10FromSchedule1Line26()` which is the FULL line 26 total (includes lines 21, 22, 24). See 6b #5.'],
  [7, 'Apply provisional-income chain', 'w1 = line6a; w2 = 0.50×w1; w5 = w2 + w3 + w4 + w5_adj; w7 = max(0, w5 − w6). Per Pub. 915 worksheet lines 1-8.'],
  [8, 'Apply MFS-lived-with-spouse restrictive branch (if applicable)', '`if (mfsLivedWithSpouseAnyTime): return min(0.85×w1, 0.85×w7)`. Per IRS rule: "skip lines 9-16, multiply line 8 by 85%, enter on line 17, go to line 18."'],
  [9, 'Apply 50%/85% tier computation (non-MFS-with-spouse path)', 'overBase = max(0, w7 − $25k/$32k); overSecond = max(0, w7 − $34k/$44k); plateau + 0.85×overSecond OR taxableUpTo50; cap at 0.85×w1.'],
  [10, 'Compute lump-sum election (if hasLumpSumBackPayment)', 'Per Pub. 915 Worksheet 3: separates current-year regular benefits from prior-year allocations; recomputes prior-year taxable using prior-year income; sums.'],
  [11, 'Apply election decision (line 6c)', '`if electsLumpSumElection AND taxableLumpSum < taxableNormal: line6b = taxableLumpSum; line6c = true; else: line6b = taxableNormal; line6c = false`.'],
  [12, 'Force zero when concept applies', '`if line6a != null AND line6b == null: line6b = 0`. Per IRS rule: when SS concept applies but no benefits taxable, line 6b shows 0 (NOT null/blank).'],
  [13, 'Apply final 85% cap + zero-floor (belt-and-suspenders)', '`line6b = min(0.85 × line6a, max(0, line6b))`. Defensive even though normal computation already caps at 0.85×w1.'],
  [14, 'Persist on form1040.income; flow to line 9', '`income.setTaxableSocialSecurityBenefits(line6b)` (only when non-null). Line 6b is the 6th operand in the line 9 addNonNull chain — IRC §86 inclusion.'],
  [],
  ['MUTUAL EXCLUSION RULES (enforced by code or spec)'],
  ['Rule', 'Implementation', 'Why'],
  ['Line 6b ≥ 0 (zero-floor)', 'subtractNonNegative at w7 + final max(0, line6b) at line 8485.', 'Negative taxable SS benefits would imply a refund-of-prior-tax mechanism not present in IRC §86.'],
  ['Line 6b ≤ 0.85 × Line 6a (85% statutory cap)', 'Cap applied inside computeTaxableSocialSecurityNormal (line 8709) AND belt-and-suspenders at line 8484. Both apply minNonNull(0.85×w1, ...).', 'IRC §86(a)(2): no more than 85% of SS benefits can be taxable.'],
  ['Line 6b IS in line 9 (6th operand)', 'Line 9 formula at lines 4164-4167 includes line 6b. Multi-audit breadcrumb will cite 10 audits after 6a #4 + 1 more after 6b #4 (11 total).', 'IRC §86: taxable SS benefits enter gross income. Inverse confirmation of 6a #4 (gross excluded as disclosure-only).'],
  ['MFS-lived-with-spouse → no $25k base', 'mfsLivedWithSpouseAnyTime branch at line 8684 skips base/second-tier logic.', 'IRS rule: MFS filers who lived with spouse must use restrictive 85% path (no $0 base amount).'],
  ['Line 6b = 0 (not null) when benefits exist', 'Line 8479-8481: `if line6a != null AND line6b == null: line6b = 0`.', 'IRS rule: line 6b never blank when line 6a populated (canonical concept-applies-but-zero per 6a #8 contrast).'],
  ['Lump-sum election reduces line 6b only when beneficial', 'Line 8472-8476: `if electsLumpSumElection AND taxableLumpSum < taxableNormal: line6b = taxableLumpSum, line6c = true`.', 'IRC §86(e): election allows recomputing taxable amount using prior-year income — only beneficial when prior-year income lower.'],
  [],
  ['DECISION TREE — Branching by filing status / scenarios'],
  ['Scenario', 'Worksheet path', 'Line 6b result'],
  ['Single / HoH / QSS, low income (< $25k provisional)', 'Normal tier path with $25k base', '$0 (canonical concept-applies-but-zero)'],
  ['Single / HoH / QSS, mid income (>$25k, <$34k)', 'Normal tier path, 50% bracket', 'min(0.50 × w1, 0.50 × overBase)'],
  ['Single / HoH / QSS, high income (>$34k)', 'Normal tier path, 50% + 85% bracket', 'plateau + 0.85 × overSecond, capped at 0.85 × w1'],
  ['MFJ, low income (< $32k provisional)', 'Normal tier path with $32k base', '$0'],
  ['MFJ, mid income (>$32k, <$44k)', 'Normal tier path, 50% bracket', 'min(0.50 × w1, 0.50 × overBase)'],
  ['MFJ, high income (>$44k)', 'Normal tier path, 50% + 85% bracket', 'plateau + 0.85 × overSecond, capped at 0.85 × w1'],
  ['MFS, lived APART entire year', 'Normal tier path with $25k base (via 6a #1 MFS guard + line6d=true)', 'Same as single path'],
  ['MFS, lived WITH spouse any time', 'RESTRICTIVE branch: min(0.85 × w1, 0.85 × w7)', 'Max 85% of benefits per IRC §86'],
  ['Lump-sum election beneficial (Pub. 915 Worksheet 3)', 'computeTaxableSocialSecurityLumpSum → < taxableNormal', 'taxableLumpSum (less than normal); line 6c checked'],
  ['Lump-sum election NOT beneficial', 'taxableLumpSum ≥ taxableNormal', 'taxableNormal; line 6c NOT checked'],
  ['Negative net benefits (repayments > gross)', 'Orchestrator early-return per 6a path', 'Line 6a omitted; line 6b not computed; SOCIAL_SECURITY_NEGATIVE_NET_BENEFITS_MANUAL_REVIEW flag'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 6b Flows'],
  ['Consumer', 'How', 'Notes'],
  ['Form 1040 line 9 (total income) — ★ PRIMARY DOWNSTREAM', 'Line 9 formula at lines 4164-4167 — line 6b is the 6th operand. Multi-audit breadcrumb will reach 11 audit IDs after 6b #4.', '★ CRITICAL: IRC §86 inclusion. Carries to AGI → taxable income → tax.'],
  ['Form 1040 line 11a/11b (AGI), line 15 (taxable income)', 'Indirect via line 9 contribution.', 'Carries the taxable SS amount through the income waterfall.'],
  ['Form 1040 line 6c (lump-sum election checkbox)', 'Set TRUE inside computeSocialSecurityBenefits when election applied AND beneficial.', 'Future 6c audit will deep-dive this; line 6b is the operand of the comparison.'],
  ['NOT IN OUTPUT — Schedule B', '—', 'Social Security distributions don\'t flow to Schedule B (interest + dividends only).'],
  ['NOT IN OUTPUT — Form 6251 AMT', '—', 'No SS-specific AMT adjustment.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 28 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 6b'],
  ['Line 6b inputs overlap heavily with line 6a (same statement filtering + accumulation) PLUS the Pub. 915 worksheet structure (lines 1z/2b/3b/4b/5b/7a/8/2a/Form 2555/adoption/Schedule 1 adjustments).'],
  [],
  ['#', 'Source xlsx', 'Field path / model key', 'Label / box', 'Required?', 'Role in line 6b compute', 'Cross-reference'],
  [],
  ['UPSTREAM LINE INPUTS — Line 6a is the primary input'],
  [1, 'form-tax-return-1040.xlsx', 'income.socialSecurityBenefits (line 6a)', 'Form 1040 line 6a (gross net benefits)', 'YES — primary input', 'w1 = line6a. Drives 50% (w2) and 85% cap.', '6a #3 net-benefits formula'],
  [],
  ['UPSTREAM LINE INPUTS — Worksheet line 3 (other income)'],
  [2, 'form-tax-return-1040.xlsx', 'income.totalWagesLine1z', 'Form 1040 line 1z (wages)', 'YES — worksheet line 3', 'Component of worksheetLine3 sum.', '1z #7'],
  [3, 'form-tax-return-1040.xlsx', 'income.taxableInterest (line 2b)', 'Form 1040 line 2b (taxable interest)', 'YES — worksheet line 3', 'Component of worksheetLine3 sum.', '2b #5'],
  [4, 'form-tax-return-1040.xlsx', 'income.ordinaryDividends (line 3b)', 'Form 1040 line 3b (ordinary dividends)', 'YES — worksheet line 3', 'Component of worksheetLine3 sum.', '3b #5'],
  [5, 'form-tax-return-1040.xlsx', 'income.taxableIraDistributions (line 4b)', 'Form 1040 line 4b (taxable IRA)', 'YES — worksheet line 3', 'Component of worksheetLine3 sum.', '4b #5'],
  [6, 'form-tax-return-1040.xlsx', 'income.taxablePensionsAnnuities (line 5b)', 'Form 1040 line 5b (taxable pension)', 'YES — worksheet line 3', 'Component of worksheetLine3 sum.', '5b #5'],
  [7, 'form-tax-return-1040.xlsx', 'income.capitalGainOrLossLine7a', 'Form 1040 line 7a (capital gain/loss)', 'YES — worksheet line 3', 'Component of worksheetLine3 sum. Fallback: `manualCapitalGainLossLine7a` (user-entered on SS form).', 'Future 7a audit'],
  [8, 'form-tax-return-1040.xlsx', 'income.line8FromSchedule1 (line 8)', 'Form 1040 line 8 (other income)', 'YES — worksheet line 3', 'Component of worksheetLine3 sum. Fallback: `manualOtherIncomeLine8` (user-entered on SS form).', 'Future 8 audit'],
  [],
  ['UPSTREAM LINE INPUTS — Worksheet line 4 (tax-exempt interest)'],
  [9, 'form-tax-return-1040.xlsx', 'income.taxExemptInterest (line 2a)', 'Form 1040 line 2a (tax-exempt interest)', 'YES — worksheet line 4', 'Per Pub. 915 worksheet line 4. Fallback: `importedReturnWorksheetLine4TaxExemptInterest`.', '2a #7'],
  [],
  ['UPSTREAM LINE INPUTS — Worksheet line 5 (exclusion add-backs)'],
  [10, 'form-tax-return-2555.xlsx (taxpayer + spouse)', 'foreignEarnedIncome.line45 + line50', 'Form 2555 lines 45 + 50 (foreign earned income + housing exclusion)', 'YES — worksheet line 5', 'Per Pub. 915 worksheet line 5 first bullet. Added back to provisional income. Computed via computeForm2555ExclusionForSsWorksheet.', 'Pub. 915 + spec §6.2'],
  [11, 'form-tax-return-1040.xlsx', 'income.line1f (adoption benefits)', 'Form 1040 line 1f (W-2 adoption benefits excluded)', 'YES — worksheet line 5', 'Per Pub. 915 worksheet line 5 second bullet. Excluded employer adoption benefits added back.', 'IRC §137 / Form 8839'],
  ['', '', '', 'GAP — Form 8815 savings bond interest exclusion', 'NO — deferred', 'Pub. 915 worksheet line 5 third bullet. NOT yet wired in code.', 'Spec §6.2; outstanding.md candidate'],
  ['', '', '', 'GAP — Samoa / Puerto Rico exclusions (Form 4563)', 'NO — deferred', 'Pub. 915 worksheet line 5 fourth bullet. NOT yet wired in code.', 'Spec §6.2; outstanding.md candidate'],
  [],
  ['UPSTREAM LINE INPUTS — Worksheet line 6 (Schedule 1 adjustments subset)'],
  [12, 'form-tax-return-1040-schedule-1.xlsx', '⚠️ Schedule 1 LINES 11-20 + 23 + 25 (subset)', 'IRS Pub. 915 worksheet line 7 (SUBSET, NOT full line 26)', 'YES — worksheet line 6', '⚠️ **CURRENTLY WRONG**: code reads `incomeAdjustments.line10FromSchedule1Line26()` which is the FULL line 26 total (includes lines 21, 22, 24a-z). Per IRS 2025 Pub. 915 worksheet line 7: lines 11-20 + 23 + 25 ONLY. See 6b #5.', '6b #5 (potential bug)'],
  [],
  ['PERSONAL FORM INPUTS — Social Security Benefits Taxpayer'],
  [13, 'form-social-security-benefits-taxpayer.xlsx', 'livedWithSpouseAnyTimeDuringTaxYear', 'Did you live with spouse any time?', 'YES on MFS', 'Drives mfsLivedWithSpouseAnyTime restrictive branch (line 8684).', 'IRC §86; Pub. 915'],
  [14, 'form-social-security-benefits-taxpayer.xlsx', 'livedApartFromSpouseEntireTaxYear', 'Lived apart entire year?', 'YES on MFS', 'Drives line 6d checkbox; also drives non-restrictive path eligibility on MFS.', 'IRC §86(c)(6); spec §8'],
  [15, 'form-social-security-benefits-taxpayer.xlsx', 'hasLumpSumBackPaymentForPriorYears', 'Lump-sum back payment received?', 'NO — flag', 'Gates lump-sum recomputation.', 'IRC §86(e); Pub. 915 Worksheet 3'],
  [16, 'form-social-security-benefits-taxpayer.xlsx', 'electsLumpSumElectionMethod', 'Elects lump-sum method?', 'NO — flag', 'Required for line 6c = true. Election applied only if `taxableLumpSum < taxableNormal`.', 'IRC §86(e); spec §7.4'],
  [17, 'form-social-security-benefits-taxpayer.xlsx', 'lumpSumDetails[] (repeating)', 'Per-prior-year allocation', 'NO (required if elects)', 'List of: lumpSumAllocatedToPriorYear, priorYearBenefitsPreviouslyReported, priorYearTaxableBenefitsPreviouslyReported, priorYearOtherIncomeForRecompute, priorYearTaxExemptInterestForRecompute, priorYearAdjustmentsForRecompute.', 'Pub. 915 Worksheet 3'],
  [],
  ['PERSONAL FORM INPUTS — Worksheet Manual Overrides (Fallback)'],
  [18, 'form-social-security-benefits-taxpayer.xlsx', 'importedReturnWorksheetLine3IncomeTotal', 'Manual override line 3', 'NO — override', 'Replaces auto-computed worksheetLine3 sum when user has imported-return scenario.', 'Imported-return flow'],
  [19, 'form-social-security-benefits-taxpayer.xlsx', 'importedReturnWorksheetLine4TaxExemptInterest', 'Manual override line 4', 'NO — override', 'Replaces auto-computed line 2a tax-exempt interest.', 'Imported-return flow'],
  [20, 'form-social-security-benefits-taxpayer.xlsx', 'importedReturnWorksheetLine6AdjustmentsTotal', 'Manual override line 6', 'NO — override', 'Replaces auto-computed Schedule 1 line 26 total — could be used to manually correct the 6b #5 bug if user enters the correct subset.', 'Imported-return flow + 6b #5'],
  [21, 'form-social-security-benefits-taxpayer.xlsx', 'manualCapitalGainLossLine7a', 'Manual override line 7a', 'NO — override', 'Fallback when capital gain/loss not computed.', 'Future 7a audit'],
  [22, 'form-social-security-benefits-taxpayer.xlsx', 'manualOtherIncomeLine8', 'Manual override line 8', 'NO — override', 'Fallback when line 8 not computed.', 'Future 8 audit'],
  [],
  ['RETURN-LEVEL INPUTS'],
  [23, 'form-filing-status.xlsx', 'filingStatus', 'Filing status', 'YES — return-level', 'Drives MFJ vs other base/second-tier amounts ($32k vs $25k; $44k vs $34k). Drives MFS restrictive branch.', 'IRC §86(c); spec §6.3'],
  [24, 'form-identification-taxpayer.xlsx', 'taxpayerIdentity.ssn', 'Taxpayer SSN', 'YES', 'Drives SSA-1099 + RRB-1099 attribution → line 6a → w1.', '6a #1, #5'],
  [25, 'form-identification-spouse.xlsx', 'spouseIdentity.spouseSsn', 'Spouse SSN', 'YES on MFJ', 'Nulled on MFS via 6a #1 guard.', '6a #1'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 42 }, { wch: 65 }, { wch: 55 }, { wch: 30 }, { wch: 80 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 6b'],
  [],
  ['Constant', 'Value', 'Source', 'Used by line 6b?', 'Notes'],
  [],
  ['Direct — Provisional-income base amounts (IRC §86(c))'],
  ['SS_BASE_AMOUNT_MFJ', '$32,000', 'IRC §86(c)(2)', 'YES — Step 9', 'Hard-coded inline at line 8689 (`new BigDecimal("32000")`). Stable since IRC §86 enactment (1983); NOT inflation-indexed.'],
  ['SS_BASE_AMOUNT_OTHER', '$25,000', 'IRC §86(c)(1)', 'YES — Step 9', 'Hard-coded inline at line 8689. Applies to Single/HOH/QSS AND MFS-lived-apart. Stable since 1983.'],
  ['SS_BASE_AMOUNT_MFS_WITH_SPOUSE', '$0 (skip threshold)', 'IRC §86(c)(1) + (c)(2)', 'YES — restrictive branch', 'MFS who lived with spouse any time has NO base amount; skips lines 9-16 of IRS worksheet.'],
  [],
  ['Direct — Second-tier amounts (IRC §86(c))'],
  ['SS_SECOND_TIER_MFJ', '$44,000', 'IRC §86(c)(2)(B)', 'YES — Step 9', 'Hard-coded inline at line 8690 (`new BigDecimal("44000")`). Stable since 1993; NOT inflation-indexed.'],
  ['SS_SECOND_TIER_OTHER', '$34,000', 'IRC §86(c)(1)(B)', 'YES — Step 9', 'Hard-coded inline at line 8690. Applies to Single/HOH/QSS AND MFS-lived-apart. Stable since 1993.'],
  [],
  ['Direct — Tax-fraction multipliers (IRC §86(a))'],
  ['SS_50_PERCENT_RATE', '0.50', 'IRC §86(a)(1)', 'YES — Step 7/9', 'Hard-coded inline at lines 8675, 8697, 8702-8703 (`new BigDecimal("0.50")`). 50% rate applies to bracket 1.'],
  ['SS_85_PERCENT_CAP', '0.85', 'IRC §86(a)(2)', 'YES — Step 9/13', 'Hard-coded inline at lines 8484, 8485, 8705, 8709 (`new BigDecimal("0.85")`). Statutory maximum taxable fraction.'],
  ['SS_PLATEAU_AMOUNT_MFJ', '$6,000 (=0.50 × ($44,000 − $32,000))', 'IRC §86 derived', 'YES — computed inline', 'Computed dynamically as `0.50 × (secondBase − baseAmount)` at line 8702 — not stored as constant.'],
  ['SS_PLATEAU_AMOUNT_OTHER', '$4,500 (=0.50 × ($34,000 − $25,000))', 'IRC §86 derived', 'YES — computed inline', 'Same dynamic computation; equals $4,500 for Single/HOH/QSS/MFS-apart.'],
  [],
  ['Statutory references'],
  ['Provisional income / SS taxation', 'IRC §86', 'Line 6b: taxable portion of SS benefits computed via provisional-income tiers per Pub. 915 worksheet.'],
  ['Lump-sum election method', 'IRC §86(e)', 'Allows recomputing prior-year taxable using prior-year income. Per Pub. 915 Worksheet 3.'],
  ['85% statutory maximum', 'IRC §86(a)(2)', 'No more than 85% of SS benefits taxable.'],
  ['Base amount thresholds', 'IRC §86(c)', '$32k MFJ / $25k others / $0 MFS-with-spouse — NOT inflation-indexed.'],
  ['Foreign earned income exclusion add-back', 'IRC §86(b)(2)(A) + IRC §911', 'Form 2555 exclusion added back to provisional income.'],
  ['Adoption exclusion add-back', 'IRC §86(b)(2)(A) + IRC §137', 'Employer adoption assistance added back to provisional income.'],
  [],
  ['IMPORTANT NOTE — All SS thresholds are HARD-CODED INLINE'],
  ['Observation', '$25k/$32k/$34k/$44k base + second-tier amounts are inline literals (lines 8689-8690) — NOT in ReferenceData.', 'Stable IRC §86 thresholds since 1983/1993 — never adjusted for inflation. Moving to ReferenceData has low priority unless Congress enacts inflation-indexing legislation.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 45 }, { wch: 50 }, { wch: 35 }, { wch: 22 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 6b IS the Income Operand'],
  ['Line 6b is the value-bearing line that enters line 9 → AGI → taxable income → tax owed.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['Form 1040 line 6b (the cell itself)', 'TaxReturnComputeService.buildIncome() — income.setTaxableSocialSecurityBenefits(line6b)', '★ Primary output. Stored when non-null. Whole-dollar HALF_UP rounded. Always present (zero, never null) when line 6a is populated.'],
  ['Form 1040 line 9 (total income)', 'Line 9 formula at lines 4164-4167 — line 6b is the 6th operand.', '★★ CRITICAL: IRC §86 inclusion. Carries to AGI → taxable income → tax.'],
  ['Form 1040 line 11a/11b (AGI), line 15 (taxable income)', 'Indirect via line 9.', 'Taxable SS amount propagates through income waterfall.'],
  ['Form 1040 line 6c (lump-sum election checkbox)', 'Set TRUE when election applied AND beneficial (taxableLumpSum < taxableNormal).', 'Line 6b is the operand of the election comparison; future 6c audit will deep-dive.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Schedule B', '—', 'Social Security distributions don\'t flow to Schedule B.'],
  ['Form 6251 AMT', '—', 'No SS-specific AMT adjustment.'],
  ['Schedule 1', '—', 'Line 6b is on Form 1040 directly; not on Schedule 1.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 6b Participates in Shared 6abcd Flags'],
  ['No line-6b-specific blocking flags. Same flag set as line 6a (covered by 6a Validation Flags sheet). One advisory specific to lump-sum + IRA-coordination:'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['SOCIAL_SECURITY_STATEMENT_UPLOAD_REQUIRED', 'BLOCKING', 'hadAnyBenefits=true AND statements missing', '6a Validation Flags'],
  ['MISSING_UPLOADED_SSA_1099', 'BLOCKING', 'receivedSsa1099 but not uploaded', '6a Validation Flags'],
  ['MISSING_UPLOADED_RRB_1099', 'BLOCKING', 'receivedRrb1099 but not uploaded', '6a Validation Flags'],
  ['SOCIAL_SECURITY_LUMP_SUM_ALLOCATION_REQUIRED', 'ADVISORY', 'electsLumpSumElection=true but lumpSumDetails empty', 'TaxReturnComputeService.java:8460-8464'],
  ['SOCIAL_SECURITY_NEGATIVE_NET_BENEFITS_MANUAL_REVIEW', 'ADVISORY', 'line6a < 0 (repayments > gross)', 'TaxReturnComputeService.java:8367'],
  ['SOCIAL_SECURITY_IRA_COORDINATION_MANUAL_REVIEW', 'ADVISORY', 'IRA deduction non-zero AND taxable SS non-zero (Pub. 590-A coordination)', 'TaxReturnComputeService.java:511'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 6b shares the same orchestrator + per-person aggregator with line 6a. Most concerns extend prior 6a closures via multi-audit-trail consolidation. **The big-ticket item is Issue #5** — potential bug in worksheet line 6 (currently uses full Schedule 1 line 26 instead of Pub. 915-specified subset). Verified 2026-05-12.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — MFS GUARD CASCADE EXTENDED TO LINE 6b (2-AUDIT CONSOLIDATION)', 'Line 6b is in the 6a #1 high-leverage MFS cascade (3+ outputs: line 6a/6b/6d). **Line 6b is the BOTTOM-LINE REVENUE-BEARING line** of the SS pair (line 6b IS in line 9 per 6b #4; line 6a is excluded per 6a #4 gross-vs-taxable pattern), so MFS protection here has direct bottom-line tax impact. **Closure applied**: (1) extended MFS-guard breadcrumb at TaxReturnComputeService.java:8249-8302 from citing "6a #1" to "6a #1 + 6b #1, both verified 2026-05-12" — multi-audit-trail consolidation now **2 audit IDs** at this site; (2) added explicit bottom-line-tax-impact sentence citing 6b #4 line-9 11-audit consolidation + 6a/6b bilateral coverage milestone, noting the harsh $0 MFS-with-spouse base amount compounds spouse-leakage tax impact; (3) **extended lock-in test** `mfsExcludesSpouseSocialSecurityFromLine6a` to bump stale spouse SSA from $15k to $50k (pushes aggregated provisional income over $25k base AND $34k second-tier) AND added new assertion: `income.getTaxableSocialSecurityBenefits() = $0` (taxpayer-only path, w7=$10k below $25k base). Without the MFS guard, aggregated w7=$35k would produce line 6b = $5,350 ($4,500 plateau + $850 from $1,000 second-tier overflow at 85%) — the new test now exposes line 6b leakage at the taxable-amount stage, not just at gross.', 'TaxReturnComputeService.java:8249-8302 (extended 2-audit MFS-guard breadcrumb with bottom-line-tax-impact sentence); test mfsExcludesSpouseSocialSecurityFromLine6a (bumped spouse SSA to $50k + added line 6b assertion at $0)', 'CLOSED — multi-audit consolidation extended + lock-in test strengthened to assert line 6b protection.'],
  [2, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — KNOWLEDGE FILE ALREADY RENAMED VIA 6a #2', '`knowledge/line-6abcd-social-security.md` (renamed from `knowledge-line-6abcd-social-security.md` during 6a #2 earlier today) is a shared file covering all four SS-family lines (6a + 6b + 6c + 6d). No YAML frontmatter to update (file uses plain `# Knowledge: Form 1040 Lines 6a / 6b / 6c / 6d — Social Security Benefits` heading — same as line-5abc-pension-annuity.md). Header-comment reference in `generate-6b.js` already uses the new name (written after the rename). Two historical inbound markdown references preserved per audit-trail-preserves-history convention. **Line 1c → 6abcd knowledge-file naming convergence remains complete across 13 lines** (1c, 1d, 1e, 1f, 1g, 1h, 1i, 1z, 2ab, 3ab, 4abc, 5abc, 6abcd). Pure xlsx-flip closure — same shape as 2b #3 (closed via 2a #4), 3b #2 + 3c #2 (closed via 3a #2), 4b #2 + 4c #2 (closed via 4a #2), 5b #2 + 5c #2 (closed via 5a #2).', 'C:\\us-tax\\knowledge\\line-6abcd-social-security.md (already correctly named)', 'CLOSED via 6a #2 — pure xlsx-flip closure. No action needed for 6b walkthrough.'],
  [3, 'RESOLVED 2026-05-12 — SPEC ENHANCEMENT — VERIFICATION LOG SECTION CREATED IN lines/6abcd.md', 'lines/6abcd.md did NOT have a Verification log section. The 6a audit closed without adding one. **Closure applied**: appended a new `## Verification log` section at the end of the file (after §13 Practical developer cheat sheet) with TWO rows: (1) **2026-05-12 — 6a walkthrough COMPLETE 10/10** with full narrative summary of all 10 6a closures (MFS guard added; knowledge rename; net-benefits formula breadcrumb; line-9 10-audit consolidation; canonical 0-vs-null; SSI exclusion; RRB SSEB-only; no-blank-when-fully-taxable; lump-sum back payments; cluster-positioning); (2) **2026-05-12 — 6b walkthrough IN PROGRESS 3/10** capturing #1 (MFS extension to 2-audit + test extension to assert line 6b $0 vs $5,350 contra-factual) + #2 (pure xlsx-flip via 6a #2) + #3 (this section creation). The 6b row will be finalized to "COMPLETE — 10/10 closed" during end-of-walkthrough docs-update step. Audit-trail-per-walkthrough convention preserved. **NEW section creation** (unlike 5b #3 / 5c #3 which appended rows to an existing section); same shape as the original section creation in 2ab.md / 3abc.md / 4abc.md / 5abc.md.', 'lines/6abcd.md (new Verification log section with 6a complete + 6b in-progress rows)', 'CLOSED — spec verification log section created. 2 rows now present (6a complete + 6b in progress).'],
  [4, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — LINE 6b IS IN LINE 9 (11-AUDIT CONSOLIDATION + 6a/6b BILATERAL COVERAGE MILESTONE — 3rd AND FINAL gross-vs-taxable pair)', 'Line 9 formula at TaxReturnComputeService.java:4167-4170: line 6b is the 6th operand (INTENTIONALLY INCLUDED per IRC §86). Inverse confirmation of 6a #4 (line 6a EXCLUDED as gross/disclosure-only). **Closure applied**: extended the line-9 breadcrumb at lines 4137-4167 from **10 audit IDs** to **11 audit IDs** (added "+ 6b.xlsx Code Validation #4" to the 2026-05-12 verification block). Added line 6b operand sentence parallel to lines 4b / 5b: "Line 6b is the 6th operand — verified INCLUDED (6b #4, IRC §86 taxable Social Security benefits as gross income via Pub. 915 provisional-income tiers; inverse confirmation of 6a #4 exclusion)." **MILESTONE: 6a/6b BILATERAL COVERAGE COMPLETE — 3rd AND FINAL gross-vs-taxable pair**: 4a/4b first (4b #5 from 2026-05-11), 5a/5b second (5b #5 from 2026-05-12), 6a/6b third (6b #4 today). Updated the gross-vs-taxable pattern note to reflect that all three pairs now have bilateral coverage — verification template fully exercised. **No future bilateral milestones remain** (line 7a is a capital gain composite; line 8 is other income composite — neither has a gross sibling). Multi-audit-trail consolidation at the line-9 site now spans **11 audits** (1z #7 + 2a #7 + 2b #5 + 3a #5 + 3b #5 + 4a #4 + 4b #5 + 5a #4 + 5b #5 + 6a #4 + 6b #4) — densest cross-audit citation site in the codebase. Pure documentation extension — no formula change. Lock-in test `line9EqualsLine1zPlusOtherIncomeLines` confirms.', 'TaxReturnComputeService.java:4137-4170 (extended 11-audit breadcrumb + line 6b operand sentence + 3rd-and-final bilateral milestone note); test line9EqualsLine1zPlusOtherIncomeLines', 'CLOSED — verified-correct cross-reference. 11-audit consolidation + 3rd-and-final bilateral coverage milestone.'],
  [5, 'RESOLVED 2026-05-12 — ⚠️ BUG FIXED — Worksheet line 6 NOW USES Pub. 915 SUBSET (lines 11-20 + 23 + 25) instead of full Schedule 1 line 26', '⚠️ **DIRECT IRS RULE VIOLATION FIXED**: Per IRS 2025 Form 1040 Social Security Benefits Worksheet line 7 (verified at i1040gi_2025.txt lines 6618-6620, 6633-6637, 6731-6734): "Enter the total of the amounts from Schedule 1 (Form 1040), lines 11 through 20, and 23 and 25." **Pre-fix**: TaxReturnComputeService.java:8448 called `line10FromSchedule1Line26()` which is the FULL line 26 total — INCLUDED lines 21 (student loan interest), 22 (reserved), and via line25 the line24a-24z write-ins. **Excluded items per IRS rule**: lines 21, 22, 24. Reason for IRS exclusion of line 21: student-loan-interest phaseout depends on MAGI which itself depends on taxable SS → circular dependency. (Note: line 25 IS the line24a-z sum which the IRS INCLUDES — the "line 24 excluded" reference in IRS rule refers to the write-in detail itself, not its subtotal.) **Direction of bug**: user-favorable (less line 6b → less tax) but IRS-violating. **Closure applied (Option A)**: (1) added new computed field `line10FromSchedule1Pub915Subset` to `IncomeAdjustmentsComputation` record + setter at line 7971 returning `sumAmounts(line11, line12, line13, line14, line15, line16, line17, line18, line19a, line20, line23) + line25` (EXCLUDES line21 + line22); (2) added 11-line breadcrumb above the new subset calculation citing IRS i1040gi_2025.txt source lines + reason for line 21 exclusion (MAGI circularity); (3) updated `computeSocialSecurityBenefits` worksheetLine6 site at line 8455-8470 to call the new Pub915Subset accessor + replaced 3-line comment with 15-line breadcrumb documenting the pre-fix bug + IRS source + direction + cross-reference to new lock-in test; (4) added lock-in test `socialSecurityWorksheetExcludesStudentLoanInterestFromLine6Subset` — Single filer, SS=$20k, wages=$25k, $2,500 student loan interest deduction → POST-FIX line 6b = $5,350 (w7=$35k crosses $34k second-tier by $1k → plateau $4,500 + 0.85 × $1k = $5,350); PRE-FIX would have produced $3,750. Bug under-stated by $1,600. Backend regression: **754 → 755** (+1 from new lock-in test); ALL 755 tests pass; NO existing test broke (verified via full mvn test). The 4 existing SS tests + scheduleOneAdjustmentsReduceTaxableSocialSecurity (uses line20 IRA deduction which is INCLUDED in both old and new aggregations) all continue passing.', 'TaxReturnComputeService.java:7967-7984 (new Pub915Subset field in computeIncomeAdjustments + 11-line breadcrumb); line 8455-8470 (15-line breadcrumb above worksheetLine6 + accessor change); line 19594-19599 (IncomeAdjustmentsComputation record signature extension); test socialSecurityWorksheetExcludesStudentLoanInterestFromLine6Subset', 'CLOSED — IRS rule violation fixed. New Pub915Subset accessor + 11-line + 15-line breadcrumbs + lock-in test. Regression: 754 → 755 pass.'],
  [6, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — PUB. 915 WORKSHEET STRUCTURE (w1/w2/w5/w7 chain) at computeTaxableSocialSecurityNormal', 'Per IRS 2025 Pub. 915 + 1040 worksheet (i1040gi_2025.txt ~lines 6580-6750) + spec §6.2: w1=line6a, w2=0.50×w1, w5=w2+w3+w4+w5_adj (= IRS worksheet line 6 "Combine lines 2, 3, 4, and 5"), w7=max(0, w5−w6) (= IRS worksheet line 8 "Subtract line 7 from line 6"). Code at TaxReturnComputeService.java:8711-8719 implements this chain — verified correct post-6b #5 worksheet line 6 fix. **Closure applied**: replaced the 2-line inline comment with a **31-line breadcrumb** at lines 8707-8737 documenting: (a) IRS Pub. 915 + 2025 1040 worksheet source citation; (b) **variable-name-to-IRS-worksheet-line mapping table** with explicit indexing-offset documentation (our w5 = IRS line 6, our w7 = IRS line 8 — predates 2025 worksheet layout reconciliation; renaming would be churn); (c) worksheet line 5 wiring detail (Form 2555 + adoption WIRED; Form 8815 + Samoa/PR DEFERRED); (d) three protections — addNonNull null-preserve, subtractNonNegative zero-floor, early-return ZERO when ≤0 per IRS rule (i1040gi_2025.txt line 6607-6609); (e) cross-references to 6b #5 (worksheet line 6 fix), 6b #7 (MFS-lived-with-spouse branch), 6b #8 (85% cap). Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:8707-8737 (31-line breadcrumb above w1/w2/w5/w7 chain with variable-name-to-IRS-worksheet-line mapping table)', 'CLOSED — verified correct. 31-line breadcrumb with indexing-offset documentation.'],
  [7, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — MFS-LIVED-WITH-SPOUSE RESTRICTIVE BRANCH', 'Per IRS 2025 Form 1040 instructions (i1040gi_2025.txt lines 6651-6657): "If you are married filing separately and you lived with your spouse at any time in 2025, skip lines 9 through 16, multiply line 8 by 85% (0.85), and enter the result on line 17. Then, go to line 18." Code at TaxReturnComputeService.java:8751-8753 implements `if (mfsLivedWithSpouseAnyTime): return minNonNull(multiply(w1, 0.85), multiply(w7, 0.85))` — produces `min(0.85 × line6a, 0.85 × w7)` skipping base/second-tier logic. **Closure applied**: 16-line breadcrumb at lines 8751-8767 above the restrictive branch documenting (a) IRS rule citation with i1040gi_2025.txt line numbers (6651-6657); (b) **CRITICAL DISTINCTION** between two mutually exclusive MFS branches: MFS-lived-APART → NORMAL tier path with $25k base + 6d=TRUE vs MFS-lived-WITH-spouse → restrictive branch + 6d=FALSE; (c) IRC §86(c) 1983 anti-loophole rationale (prevents married couples from filing separately to escape SS taxation); (d) IRS worksheet step mapping (line 17 + 18 → line 19 = line 6b); (e) concrete tax-impact example — MFS + $20k SS + $30k wages: restrictive branch produces line 6b=$17,000 vs MFS-apart same income → $9,600 ($7,400 difference); (f) note that 85% cap is BUILT-IN here (independent of orchestrator belt-and-suspenders cap at line 8484-8485); (g) cross-reference to existing lock-in test `computesMfsLivedWithSpouseSocialSecurityUsingWorksheetBranch`. Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:8751-8767 (16-line breadcrumb above MFS-with-spouse restrictive branch); existing test computesMfsLivedWithSpouseSocialSecurityUsingWorksheetBranch unchanged', 'CLOSED — verified correct. 16-line breadcrumb with mutually-exclusive-branches distinction + concrete tax-impact example.'],
  [8, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — 85% FINAL CAP + BASE/SECOND-TIER BRACKET LOGIC + ZERO-FLOOR + FORCE-ZERO-WHEN-CONCEPT-APPLIES', 'Three-protection chain at the orchestrator output (TaxReturnComputeService.java:8515-8523) finalizes line 6b: (1) **Force zero when concept applies**: `if line6a != null AND line6b == null: line6b = 0` — per IRS 2025 1040 worksheet "STOP. None of your social security benefits are taxable. Enter -0- on Form 1040 line 6b" (i1040gi_2025.txt line 6644-6647) + 6a #8 canonical concept-applies-but-zero; (2) **85% statutory cap (belt-and-suspenders, redundant defense-in-depth)**: `maxTaxable = 0.85 × line6a` per IRC §86(a)(2) — already applied inside computeTaxableSocialSecurityNormal at line 8772 AND inside the MFS-with-spouse branch (6b #7); kept here to defend against future refactors that might bypass the internal cap; (3) **Zero-floor**: `max(0, line6b)` clamps to ≥ 0. Composed: `line6b = min(0.85 × line6a, max(0, line6b))` — classic clamp-to-[0, cap] idiom. **Closure applied**: replaced the 1-line IRS comment with a **31-line breadcrumb** at lines 8515-8545 enumerating each protection with failure-mode rationale + IRS rule citations + belt-and-suspenders defense-in-depth rationale + the composed-clamp idiom + IRC §86 hard-coded threshold acknowledgment ($25k/$32k base, $34k/$44k second-tier, 0.50/0.85 multipliers — stable since 1983/1993, NOT inflation-indexed; low-priority ReferenceData migration) + cross-references to 6a #8, 6b #5/#6/#7. Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:8515-8545 (31-line breadcrumb above three-protection chain documenting force-zero + 85%-cap + zero-floor + composed-clamp idiom + IRC §86 thresholds)', 'CLOSED — verified correct. 31-line breadcrumb with failure-mode-per-protection rationale.'],
  [9, 'RESOLVED 2026-05-12 — OBSERVATION + DEFERRAL — LUMP-SUM ELECTION (computeTaxableSocialSecurityLumpSum) FIDELITY GAPS + PRIOR-YEAR-CONTEXT ASSUMPTIONS', 'Implementation at TaxReturnComputeService.java:8839-8915 correctly implements Pub. 915 Worksheet 3: (1) separates current-year regular benefits from prior-year allocations; (2) recomputes prior-year taxable using prior-year other income / tax-exempt interest / adjustments from `lumpSumDetails`; (3) sums current-year-base + sum-of-prior-year-additional. **The knowledge file "Gap 2 simplified approximation" description is OUTDATED** — code actually does the full prior-year recompute. **Three fidelity gaps documented**: (i) prior-year `worksheetLine5` HARDCODED NULL (line 8895-8898) — Form 2555 + adoption exclusions in PRIOR years not added back; (ii) prior-year filing status ASSUMED SAME as current year — wrong thresholds if user changed status (marriage/divorce/death-of-spouse); (iii) initial `taxableLumpSum = taxableNormal` when `lumpSumDetails` empty — CORRECT FALLBACK (not a true gap); `SOCIAL_SECURITY_LUMP_SUM_ALLOCATION_REQUIRED` advisory flag fires to inform user. **Closure applied**: (1) expanded existing JavaDoc to a 30+ line breadcrumb at TaxReturnComputeService.java:8828-8866 documenting Pub. 915 Worksheet 3 source citation + 4-step algorithm with code line citations + three gaps with impact + rarity assessment + clarification that gap (iii) is correct fallback; (2) **NEW outstanding.md entry** "Line 6b: Lump-Sum Election Prior-Year Fidelity Gaps (Form 2555 + Filing-Status Changes) — Deferred 2026-05-12" — ~2-3 hour scope (YAML per-year filing status + Form 2555 exclusion fields, backend per-row thread-through, frontend UI, 2 lock-in tests); Low priority (niche user demographic). Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:8828-8866 (30+ line JavaDoc breadcrumb above lump-sum method); outstanding.md (new entry for prior-year gaps)', 'CLOSED — observation + deferral. JavaDoc breadcrumb + outstanding.md entry. Knowledge file Gap 2 description noted as outdated.'],
  [10, 'RESOLVED 2026-05-12 — OBSERVATION — 6a/6b BILATERAL COVERAGE COMPLETE — 3rd AND FINAL gross-vs-taxable pair', 'The 6a/6b pair is the **third and FINAL of three gross-vs-taxable distribution-line pairs** on Form 1040 to achieve bilateral coverage at the line-9 breadcrumb (gross-side exclusion via 6a #4; taxable-side inclusion via 6b #4 today). **Pattern progress through history**: 4a/4b first (4b #5/#10 from 2026-05-11), 5a/5b second (5b #5/#10 from 2026-05-12), 6a/6b third (6b #4/#10 today — milestone). **After this audit**: ALL gross-vs-taxable distribution pairs on Form 1040 have bilateral coverage. Future audits will NOT establish new bilateral milestones — line 7a is a capital gain composite (no gross sibling), line 8 is other income composite (no gross sibling), lines 2a/2b are exempt-vs-taxable (not gross-vs-taxable subset), lines 3a/3b are qualified-subset-of-ordinary (not gross-vs-taxable). The line-9 breadcrumb already documents the milestone after the 6b #4 update. **Cumulative through 6b**: 23 lines audited (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6a + 6b); 227 audit issues closed total (217 prior + 10 from 6b); backend 755/755 tests pass (was 754, +1 from 6b #5 socialSecurityWorksheetExcludesStudentLoanInterestFromLine6Subset lock-in test); 11-audit consolidation at line-9 site (densest cross-audit citation in the codebase); 11 MFS-protected orchestrators; 13-line knowledge-file naming convergence; 1 NEW Verification log section in lines/6abcd.md (6b #3); 1 HIGH-PRIORITY IRS rule violation fixed (6b #5 Schedule 1 line 26 → Pub. 915 subset); 1 NEW outstanding.md entry (6b #9 lump-sum prior-year fidelity gaps); **THREE complete gross-vs-taxable bilateral pairs** (4a/4b + 5a/5b + 6a/6b — milestone reached today). Pure xlsx-flip observation.', 'XLS/computations/6b.xlsx audit-trail (this row); no code change', 'CLOSED — pure xlsx-flip observation. Completes gross-vs-taxable bilateral coverage across all three distribution-line pairs (FINAL pair).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 100 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 6b Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.taxableSocialSecurityBenefits', 'topmostSubform[0].Page1[0].f1_69[0] (line6b_social_security_taxable_amount)', 'form-tax-return-1040.xlsx (line 6b cell)', '★ Primary output. Whole-dollar HALF_UP rounded. Always zero (not null) when line 6a is populated.'],
  ['form1040.income.socialSecurityBenefits (sibling)', 'topmostSubform[0].Page1[0].f1_68[0] (line6a_social_security_benefits)', 'form-tax-return-1040.xlsx (line 6a cell)', 'Line 6a — gross/disclosure (NEVER blank when SS concept applies per 6a #8).'],
  ['form1040.income.line6cLumpSumElection', 'c1_41[0] / line6c_lump_sum_election', 'form-tax-return-1040.xlsx (line 6c checkbox)', 'Set TRUE when lump-sum election applied AND beneficial (taxableLumpSum < taxableNormal).'],
  ['form1040.income.line6dMfsLivedApartAllYear', 'c1_42[0] / line6d_mfs_lived_apart_all_year', 'form-tax-return-1040.xlsx (line 6d checkbox)', 'Set TRUE when MFS AND lived apart entire year.'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 9 (total income)', '—', 'form-tax-return-1040.xlsx (line 9 cell)', '★★ INCLUDED as 6th operand. Carries to line 11a/11b AGI, line 15 taxable income, line 16 tax.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Schedule B', '—', '—', 'Social Security distributions don\'t flow to Schedule B.'],
  ['Form 6251 AMT', '—', '—', 'No SS-specific AMT adjustment.'],
  ['Schedule 1', '—', '—', 'Line 6b is on Form 1040 directly.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 70 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
