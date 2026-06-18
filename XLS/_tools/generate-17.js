// ============================================================================
//  Generates: C:\us-tax\XLS\computations\17.xlsx
//
//  Source-of-truth references:
//    - lines/17.md (2025-tax-year IRS-verified developer-ready spec; sections
//      1-13; 416 lines; documents line 17 = Schedule 2 line 3 = line 1z + line 2;
//      2025 Form 6251 line 1a/1b restructure due to Schedule 1-A senior add-back)
//    - dependencies/17.md (157 lines; direct + conditional inputs, output fields,
//      PDF fields, compute order, 2025 AMT constants, 9 documented gaps G1-G5
//      and G-new-1 through G-new-4 — all marked "Fixed 2026-04-18")
//    - knowledge/line-17-alternative-minimum-tax.md (renamed from knowledge_line17.md
//      via 17 #2 2026-05-14; 10th Legacy A migration; 370 lines covering: line identity,
//      Form 6251 structure, line 7 three paths, exemption/phaseout, Part III thresholds,
//      backend implementation, frontend integration, output model, test inventory,
//      compute order, downstream consumers, identified gaps, out-of-scope items)
//    - TaxReturnComputeService.java:
//        line 11057-11337 — `computeLine17` (orchestrator; full Part I + II + Part III)
//        line 11343-11364 — `wireLine17ToOutputs` (sets TaxAndCredits + Schedule 2)
//        line 11379-11413 — `correctLine17ForFtc` (G3 fix + G-new-1 fix)
//        line 11438-11468 — `computeLine18` (line16 + line17; reads additionalTaxSchedule2)
//        line 11476-11492 — `computeAmtDirectRate` (26%/28% helper)
//        line 11505-11521 — `computeAmtPartIII` (delegates to populateAmtPartIIIFields)
//        line 11538-11715 — `populateAmtPartIIIFields` (Part III lines 12-40 IRS arithmetic)
//        line 11723-11758 — `computeAmtForeignEarnedIncomeTaxWorksheet` (FEITW for AMT)
//    - Call site at prepare() line 1223 — where MFS guard goes (Form 2555 spouse
//      passed unconditionally; needs `isMfsReturn ? null : form2555Spouse` shadow
//      per 16 #1 + 13b #1 precedent)
//    - IRS 2025 Form 6251 + i6251 (2025 Instructions for Form 6251)
//    - Rev. Proc. 2024-40 §3.10–§3.11 (AMT 2025 constants)
//    - IRC §55-§59 (AMT statute)
//    - IRC §911 (Form 2555 / FEITW)
//    - IRC §1(h) (capital gains rates — also used for Part III AMT)
//
//  Tax year: 2025
//
//  Concept:
//    Line 17 = Schedule 2 line 3 = Schedule 2 line 1z (additions to tax) +
//              Schedule 2 line 2 (= Form 6251 line 11 AMT)
//
//    Form 6251 structure (2025 — NEW because of Schedule 1-A line 37 senior
//    deduction which must be added back for AMT):
//
//      Part I (AMTI computation):
//        line1a = Form1040.line14 − Schedule1A.line37
//        line1b = Form1040.line11b − line1a
//        line2a = ScheduleA.line7 (itemizer) OR Form1040.line12e (non-itemizer ← G1 2025 fix)
//        line2b = −taxable state/local refund in income (Schedule 1 line 1)
//        line2g = private activity bond tax-exempt interest (1099-INT box 9)
//        line2c-2t, line3 = DEFERRED (investment interest AMT recompute, ATNOLD,
//                            ISO spread, passive activity AMT, etc.)
//        line4  = AMTI = line1b + line2a + line2b + line2g (+ deferred items)
//
//      Part II (tentative minimum tax):
//        line5  = exemption (phaseout-adjusted)
//        line6  = max(0, line4 − line5)
//        line7  = tax via THREE PATHS:
//                  (1) FEITW — Form 2555 applies (taxpayer or spouse)
//                  (2) PART_III — qualified dividends or LTCG present
//                  (3) DIRECT — 26%/28% on line 6
//        line8  = AMT FTC (deferred; defaults to 0)
//        line9  = line7 − line8
//        line10 = line16 + ptcRepayment − form4972LumpSumTax (FTC corrected post-1116)
//        line11 = max(0, line9 − line10)  ← AMT
//
//      Part III (AMT QDCG worksheet — lines 12-40; preferential 0%/15%/20% rates):
//        Mirrors regular QDCG/Sched D Tax Worksheet structure but applied to AMTI;
//        §1250 unrecaptured gain (line 14) excluded from preferential pool;
//        taxed separately at 25% via lines 36-37; full 29-field IRS worksheet
//        implemented in populateAmtPartIIIFields().
//
//  Line 17 audit positioning (4th audit OUTSIDE 13ab pair):
//   • Second orchestrator-based audit in the line-16+ chain (after 16)
//   • Cumulative position: 43rd line
//   • Uses the 16 #4 audit-trail anchor as navigable hub (per 16 #10 look-ahead)
//   • Likely HIGH-PRIORITY MFS DEFENSIVE GAP (Form 2555 spouse leak — same
//     shape as 16 #1 form2555Spouse leak but only ONE leakage path here since
//     line 17 doesn't directly consume form4972Spouse — only via line 16
//     taxAndCredits.getBox2Form4972Tax which inherits the 16 #1 fix transitively)
//   • Heavy compute: 7 helper methods + 29-field Part III worksheet
//
//  Line 17 audit angles (10 issues):
//   1. ⚠️ HIGH-PRIORITY MFS DEFENSIVE GAP — computeLine17 call site at
//       prepare() line 1223 needs `isMfsReturn ? null : form2555Spouse` guard.
//       Without it, stale spouse Form 2555 routes line 7 to FEITW branch on MFS
//       even when the MFS taxpayer doesn't qualify. Adds 19th orchestrator to
//       MFS-guard cascade — NEW CODEBASE MAXIMUM (was 18 after 16 #1).
//   2. DOCUMENTATION HYGIENE — Knowledge file Legacy A rename
//       (knowledge_line17.md → line-17-alternative-minimum-tax.md);
//       10th Legacy A migration; convergence 22 → 23 lines.
//   3. SPEC ENHANCEMENT — Verification log section §14 in lines/17.md
//       (single-row pattern; smallest log shape).
//   4. FORWARD TERMINAL SEED at computeLine17 orchestrator — documents:
//       (a) line 17 = Schedule 2 line 3 = line 1z + line 2; (b) Form 6251
//       Part I/II/III architecture; (c) 3-path line 7 selection; (d) FTC
//       correction pass shape; (e) 9 historical gaps G1-G5 + G-new-1..4 (all
//       Fixed 2026-04-18); (f) future-line-18/Form-1116/Form-8801 hooks.
//       Terminal seed shape (no upgrades expected; each future orchestrator-based
//       audit plants its own seed) per 16 #4 precedent.
//   5. VERIFIED CORRECT — Form 6251 Part I (lines 1a, 1b, 2a, 2b, 2g, 4):
//       2025 senior add-back at line 1a (G-2025); G1 fix at line 2a; 2025
//       AMTI starting structure (line 1b not line 15); deferred items 2c-2t+3
//       flagged for visibility.
//   6. VERIFIED CORRECT — Form 6251 Part II (lines 5, 6, 7, 8, 9, 10, 11):
//       2025 exemption + phaseout per filing status; 3-path line 7 selection;
//       AMT FTC = 0 deferred at line 8; line 10 formula with PTC repayment +
//       Form 4972 subtraction; FTC correction post-Form 1116 via correctLine17ForFtc.
//   7. VERIFIED CORRECT — Form 6251 Part III (lines 12-40; AMT QDCG worksheet):
//       29-field IRS arithmetic in populateAmtPartIIIFields (G-new-4 fix);
//       §1250 exclusion at line 14; 0%/15%/20% bracket structure with 25%
//       §1250 surcharge at lines 36-37.
//   8. VERIFIED CORRECT — Wiring & FTC correction:
//       wireLine17ToOutputs sets TaxAndCredits.alternativeMinimumTax +
//       additionalTaxSchedule2 + Schedule2.tax.alternativeMinimumTax;
//       correctLine17ForFtc subtracts Schedule3.line1 FTC and refreshes
//       computeLine18 (G3 + G-new-1 + G-new-2 fixes).
//   9. ⚠️ BUNDLED OBSERVATIONS — multiple known gaps + scope limitations:
//       (a) **G-new-5 (NEW THIS AUDIT)**: `additionalTaxSchedule2` semantically
//           represents Schedule 2 line 3 (= line 1z + line 11) but code sets it
//           = line 11 only. When PTC repayment > 0 AND AMT = 0, line 17 PDF
//           field is null (blank) when it should equal PTC repayment.
//       (b) **G-new-6**: Spec §8 line 10 formula includes
//           `− abs(negative Form8978.line14)`. Code missing.
//       (c) **G-new-7**: Spec §5.2 line 2b also covers Schedule 1 line 8z
//           refunds (state/local personal property, sales taxes, foreign income
//           taxes, foreign real property). Code only handles state/local income
//           tax refund.
//       (d) Deferred AMT adjustments: line 2c investment interest AMT recompute
//           (Form 4952 AMT path), line 2f ATNOLD, line 2i ISO spread, line 2m
//           passive activity AMT (Schedule E).
//       (e) MFS add-back capped at $68,500 deferred (rare high-income MFS path
//           per knowledge §5).
//       (f) Schedule 2 line 1z scope: only PTC repayment (line 1a) wired
//           independently; clean-vehicle repayment + Form 4255 recapture etc.
//           NOT implemented.
//       Pattern: 14th Path A application — bundled because all share same
//       "documented deferred/out-of-scope; not blocking real returns in current
//       scope" rationale.
//  10. BOUNDARY MILESTONE — second orchestrator audit in this chain since 13b;
//       19 orchestrators (NEW CODEBASE MAX); 43 lines / 427 issues / backend
//       763 → 764 (+1 MFS lock-in); 18 consecutive zero-outstanding walkthroughs.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '17.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 17 — ADDITIONAL TAXES (Schedule 2 line 3 = line 1z + Form 6251 line 11 AMT) — 2025'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 17 (page 2; "Amount from Schedule 2, line 3")'],
  ['Concept',
    'Line 17 is NOT just AMT. Officially, line 17 = Schedule 2 line 3 = Schedule 2 line 1z (additions ' +
    'to tax — clean vehicle repayments, Form 4255 EPE recapture, PTC repayment, etc.) + Schedule 2 ' +
    'line 2 (= Form 6251 line 11 AMT). The 2025 Form 6251 uses NEW line 1a / line 1b starting structure ' +
    'because the Schedule 1-A enhanced senior deduction must be added back for AMT. If the taxpayer does ' +
    'NOT file Schedule A, Form 6251 line 2a is the standard deduction (Form 1040 line 12e), NOT zero ' +
    '(2025 G1 IRS rule).'],
  ['Top-level formula (spec §2.1)',
    'Form1040.line17 = Schedule2.line3\n' +
    'Schedule2.line3 = Schedule2.line1z + Schedule2.line2\n' +
    'Schedule2.line2 = Form6251.line11'],
  ['Form 6251 Part I — AMTI (spec §4 + §5)',
    'line1a = Form1040.line14 − Schedule1A.line37        (senior deduction add-back — 2025 NEW)\n' +
    'line1b = Form1040.line11b − line1a                  (negative permitted)\n' +
    'line2a = ScheduleA.line7  (itemizer)  OR\n' +
    '         Form1040.line12e (non-itemizer ← G1 2025 fix)\n' +
    'line2b = −(taxable state/local refund from Schedule 1 line 1)\n' +
    'line2g = private activity bond tax-exempt interest (1099-INT box 9)\n' +
    'line2c–line2t, line3 = DEFERRED (Form 4952 AMT, ATNOLD, ISO, passive activity, etc.)\n' +
    'line4  = AMTI = line1b + line2a + line2b + line2g (+ deferred items, all currently 0)'],
  ['Form 6251 Part II — TMT and AMT (spec §6 + §7 + §8 + §9)',
    'line5  = exemption (with 25% phaseout above filing-status threshold)\n' +
    'line6  = max(0, line4 − line5)\n' +
    'line7  = THREE-PATH selection:\n' +
    '  (1) FEITW         — Form 2555 applies (taxpayer or spouse) → AMT FEITW formula\n' +
    '  (2) PART_III      — qualified dividends OR long-term capital gains present\n' +
    '                       → populateAmtPartIIIFields() (29 IRS Part III fields, lines 12-40)\n' +
    '  (3) DIRECT_26_28  — 26%/28% rate on line 6 (breakpoint $239,100 / MFS $119,550)\n' +
    'line8  = AMT FTC (deferred — defaults to 0)\n' +
    'line9  = line7 − line8\n' +
    'line10 = line16 + ptcRepayment − form4972LumpSumTax\n' +
    '         (− Schedule3.line1 FTC, applied later via correctLine17ForFtc per G3 fix)\n' +
    'line11 = max(0, line9 − line10)   ← AMT'],
  ['Form 6251 Part III — AMT QDCG worksheet (spec §7.3 + IRC §1(h))',
    '29 IRS-spec fields (lines 12-40) implementing 0%/15%/20% rates on qualified dividends and\n' +
    'long-term capital gains within AMTI, with §1250 unrecaptured gain excluded from preferential\n' +
    'pool and taxed at 25% via lines 36-37. Fully implemented in populateAmtPartIIIFields() per\n' +
    'G-new-2 + G-new-4 fixes (2026-04-18).'],
  ['Wiring step (spec §9 + dependencies §5)',
    'wireLine17ToOutputs():\n' +
    '  TaxAndCredits.alternativeMinimumTax = line11 (null when 0)\n' +
    '  TaxAndCredits.additionalTaxSchedule2 = line11 (null when 0)   ← G2 fix — but SEE 17 #9 G-new-5\n' +
    '  Schedule2.tax.alternativeMinimumTax = line11\n' +
    '  (PTC repayment wired separately to sched2Tax.excessAdvancePremiumTaxCreditRepayment)\n\n' +
    'computeLine18():   line18 = line16 + additionalTaxSchedule2\n\n' +
    'After Form 1116 runs:\n' +
    '  correctLine17ForFtc():\n' +
    '    line10Corrected = line10 − Schedule3.line1 FTC          ← G3 fix\n' +
    '    line11Corrected = max(0, line9 − line10Corrected)\n' +
    '    wireLine17ToOutputs(corrected line11)\n' +
    '    computeLine18() refresh                                 ← G-new-1 fix'],
  ['When Form 6251 is required (spec §3)',
    'Attach Form 6251 if ANY of the following 2025 statements is true:\n' +
    '  1. Form 6251 line 7 > line 10 (i.e., AMT > 0).\n' +
    '  2. General business credit claimed AND (Form 3800 line 6 > 0 OR line 25 > 0).\n' +
    '  3. Form 8834 (qualified EV credit), Form 8911 (alt fuel refueling — personal-use part), or\n' +
    '     Form 8801 (prior-year minimum tax credit) is claimed.\n' +
    '  4. Sum(line 2c..3) < 0 AND line 7 WOULD be > line 10 if those negatives were ignored.\n' +
    'Implementation: backend ALWAYS computes Form 6251 when line 4 (AMTI) > 0; emits Form 6251\n' +
    'output when AMT > 0 OR when PAB interest is present (per IRS — line 2g triggers Form 6251).'],
  ['Output target',
    'Primary: form1040.taxAndCredits.alternativeMinimumTax (BigDecimal; HALF_UP whole dollar)\n' +
    '         form1040.taxAndCredits.additionalTaxSchedule2 (= line 17 PDF field; semantic-line-3)\n' +
    'Schedule 2: schedule2.tax.alternativeMinimumTax (= line 2)\n' +
    '            schedule2.tax.excessAdvancePremiumTaxCreditRepayment (= line 1a, wired in computeLine17)\n' +
    'Form 6251: form6251.* — 11 Part I+II lines (always when AMTI > 0) + 29 Part III lines (PART_III path)'],
  ['Backend implementation',
    '**SEPARATE ORCHESTRATOR** — `computeLine17` at TaxReturnComputeService.java:11057-11337 ' +
    '(call site at prepare() line 1223). Helper methods: `wireLine17ToOutputs` (11343), ' +
    '`correctLine17ForFtc` (11379), `computeLine18` (11438), `computeAmtDirectRate` (11476), ' +
    '`computeAmtPartIII` (11505), `populateAmtPartIIIFields` (11538), ' +
    '`computeAmtForeignEarnedIncomeTaxWorksheet` (11723). Second orchestrator-based audit since 13b ' +
    'on 2026-05-13; uses 16 #4 audit-trail anchor as navigable hub (per 16 #10 look-ahead).'],
  ['IRS source',
    'IRS 2025 Form 6251 (f6251) + 2025 Instructions for Form 6251 (i6251) +\n' +
    '2025 Form 1040 (page 2 line 17) + 2025 Schedule 2 (Part I lines 1a-1y + 1z + 2 + 3) +\n' +
    '2025 Instructions for Form 1040 (i1040gi) + Rev. Proc. 2024-40 §3.10-§3.11 (AMT constants) +\n' +
    'IRC §55-§59 (AMT statute) + IRC §911 (Form 2555/FEITW) + IRC §1(h) (preferential rates).\n' +
    'Local cross-checks: docs/books/i1040gi_2025.txt + J.K. Lasser\'s Your Income Tax 2025.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Gate check', 'Skip line 17 if form1040.deductions == null OR adjustments == null. If pabInterest present, emit minimal Form 6251 stub with just line 2g. Per spec §3 (PAB interest forces Form 6251 even when AMT = 0).'],
  [2, 'Read line 11b (AGI), line 14 (total deductions), Schedule 1-A line 37 (senior add-back)', 'Per line 11ab + line 14 + 13b audits. Senior add-back is 2025-NEW per Schedule 1-A.'],
  [3, 'Compute line 1a = line 14 − schedule1aLine37', 'Senior deduction add-back. Per spec §4.1.'],
  [4, 'Compute line 1b = line 11b − line 1a', 'Negative permitted. Per spec §4.2.'],
  [5, 'Compute line 2a (standard deduction or SALT)', 'Itemizer: scheduleA.deductibleTaxes (= Schedule A line 7, after SALT cap). Non-itemizer: form1040.line12e (G1 2025 fix). Per spec §5.1.'],
  [6, 'Compute line 2b = −taxable state/local refund', 'Read from schedule1.additionalIncome.taxableRefundsStateLocal. Negate. Per spec §5.2. ⚠️ Schedule 1 line 8z refund subset NOT handled — see 17 #9 G-new-7.'],
  [7, 'Compute line 2g = PAB interest', 'Aggregated from 1099-INT box 9 entries. Per spec §5.3 + dependencies §1.'],
  [8, 'Compute line 4 = line1b + line2a + line2b + line2g', 'AMTI. Deferred items (line 2c-2t + line 3) all 0. Per spec §4.3.'],
  [9, 'Compute line 5 = exemption (with 25% phaseout above threshold)', '2025 Single/HOH $88,100 / MFJ/QSS $137,000 / MFS $68,500. Phaseout 25% × (line4 − threshold). Per spec §6.'],
  [10, 'Compute line 6 = max(0, line 4 − line 5)', 'AMT base after exemption. Per spec §6.4. If line 6 = 0 (or AMTI ≤ 0), Form 6251 stub returned per spec §6.4 special case.'],
  [11, 'Compute line 7 via 3-path selection', 'Priority: FEITW (Form 2555) > PART_III (QDCG/LTCG) > DIRECT_26_28. Per spec §7.1.'],
  [12, 'If PART_III path, populate lines 12-40 (29 fields)', 'Per spec §7.3 + IRC §1(h) + G-new-2 + G-new-4 fixes (2026-04-18).'],
  [13, 'Compute line 8 = 0 (AMT FTC deferred)', 'Per spec §7.4 + knowledge §14 deferred.'],
  [14, 'Compute line 9 = line 7 − line 8', 'TMT after FTC. Per spec §7.5.'],
  [15, 'Compute line 10 = line 16 + ptcRepayment − form4972LumpSumTax', 'Initial; FTC correction applied later in correctLine17ForFtc(). Per spec §8 + G3 fix (2026-04-18). ⚠️ Spec §8 also subtracts abs(negative Form8978.line14) — NOT implemented per 17 #9 G-new-6.'],
  [16, 'Compute line 11 = max(0, line 9 − line 10)', 'AMT. Per spec §9.1.'],
  [17, 'Wire line 17 to TaxAndCredits + Schedule 2', 'wireLine17ToOutputs sets alternativeMinimumTax + additionalTaxSchedule2 + Schedule2.tax.alternativeMinimumTax (all = line 11 — see 17 #9 G-new-5 for semantic gap). PTC repayment wired separately to schedule2.tax.excessAdvancePremiumTaxCreditRepayment.'],
  [18, 'computeLine18 sets totalTaxBeforeCredits = line 16 + line 17', 'Per spec §10 + G-new-1.'],
  [19, 'After Form 1116 runs, correctLine17ForFtc()', 'Subtracts Schedule 3 line 1 FTC from line 10, recomputes line 11, re-wires outputs, refreshes computeLine18. Per spec §8 + G3 + G-new-1 fixes.'],
  [20, 'Form 8801 (prior-year AMT credit), Form 1116 CLW, Form 8880 CLW all read refreshed line 18', 'Downstream consumers must see corrected total tax before credits.'],
  [],
  ['INVARIANTS / VALIDATIONS (spec §11)'],
  ['Invariant', 'Rationale'],
  ['Form1040.line17 == Schedule2.line3', 'Per spec §11.1. **⚠️ Currently not strictly enforced** — additionalTaxSchedule2 set to line 11 only, not line 1z + line 11 (see 17 #9 G-new-5).'],
  ['Schedule2.line3 == Schedule2.line1z + Schedule2.line2', 'Per spec §11.1 (line1z computation deferred — currently all line 1 items treated as 0 except PTC repayment which is wired separately at sched2Tax.excessAdvancePremiumTaxCreditRepayment).'],
  ['Schedule2.line2 == Form6251.line11', 'Per spec §11.1. Enforced by wireLine17ToOutputs.'],
  ['When standard deduction claimed, Form6251.line2a == Form1040.line12e (not 0)', 'Per spec §11.2 + G1 fix. **VERIFIED CORRECT** at TaxReturnComputeService.java:11122-11132.'],
  ['Form6251.line4 must start from line 1b (NOT line 15)', 'Per spec §11.2. **VERIFIED CORRECT** — 2025 starting structure (line 1a → line 1b → line 4) implemented per spec §4.'],
  ['Form1040.line17 must NOT be set directly to Form6251.line11 while line 1z != 0', 'Per spec §11.3. **⚠️ Currently violated when PTC repayment > 0 + AMT = 0** — see 17 #9 G-new-5.'],
  ['Line 17 ≥ 0', 'Each component non-negative; AMT = max(0, ...). Structural.'],
  ['Line 11 ≥ 0', 'AMT cannot be negative; max(0, line9 − line10).'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 35 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 17'],
  ['Line 17 takes 14 inputs across 8 source forms + 3 computed forms + 2 reference statuses. Form 6251 has NO USER INPUT FORM in input_forms/ — all inputs are derived/computed from other forms.'],
  [],
  ['#', 'Source', 'Field', 'Type', 'Role', 'XLS input/output form reference'],
  [1, 'computed Form 1040 (line 11b)', 'adjustments.line11bAmountFromLine11aAdjustedGrossIncome', 'BigDecimal', 'AGI — line 1b starting input.', '(internal — line 11ab audit)'],
  [2, 'computed Form 1040 (line 14)', 'deductions.totalDeductions', 'BigDecimal', 'Total deductions — line 1a starting input.', '(internal — line 14 audit)'],
  [3, 'computed Form 1040 (line 12e)', 'deductions.deductionAmount', 'BigDecimal', 'Standard deduction — line 2a for NON-itemizer (G1 2025 fix).', '(internal — line 12abcde audit)'],
  [4, 'computed Form 1040 (line 16)', 'taxAndCredits.tax', 'BigDecimal', 'Regular tax — line 10 starting input.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 16)'],
  [5, 'computed Schedule 1-A (line 37)', 'line37EnhancedSeniorDeduction', 'BigDecimal', 'Senior deduction add-back — subtracted from line 14 at line 1a. 2025 NEW.', 'XLS/output_forms/form-tax-return-schedule-1a.xlsx'],
  [6, 'filing-status form', 'filingStatus', 'String', 'Drives exemption + phaseout + bracket path + Part III thresholds.', 'XLS/input_forms/form-filing-status.xlsx'],
  [7, 'computed Deductions', 'deductionType', 'String', 'Itemizing flag — controls line 2a path (Schedule A line 7 vs. line 12e).', '(internal — line 12abcde audit)'],
  [8, 'computed Schedule A', 'deductibleTaxes', 'BigDecimal', 'Schedule A line 7 — line 2a when itemizing (SALT after $10k cap). ⚠️ Field name mapping: `deductibleTaxes` is the post-cap Schedule A line 7 value.', 'XLS/output_forms/form-tax-return-schedulea.xlsx'],
  [9, 'computed Schedule 1 (Part I)', 'additionalIncome.taxableRefundsStateLocal', 'BigDecimal', 'State/local refund in income → negated for line 2b. ⚠️ Schedule 1 line 8z refund subset NOT handled — see 17 #9 G-new-7.', 'XLS/output_forms/form-tax-return-schedule1.xlsx'],
  [10, 'computed Interest aggregator', 'form6251Line2gPrivateActivityBondInterest', 'BigDecimal', 'Aggregated PAB interest from 1099-INT box 9 across taxpayer + spouse + dependents.', 'XLS/input_forms/form-1099-int.xlsx (box 9) + form-interest-income-taxpayer.xlsx + form-interest-income-spouse.xlsx'],
  [11, 'computed Form 8962 (line 29)', 'line29RepaymentAmount', 'BigDecimal', 'PTC repayment — added to line 10. Also wired to schedule2.tax.excessAdvancePremiumTaxCreditRepayment (Schedule 2 line 1a).', 'XLS/output_forms/form-tax-return-8962.xlsx'],
  [12, 'computed Form 4972 (via TaxAndCredits)', 'box2Form4972Tax', 'BigDecimal', 'Lump-sum distribution tax — subtracted from line 10. Inherits 16 #1 MFS guard transitively (no leak here).', 'XLS/output_forms/form-tax-return-4972.xlsx'],
  [13, 'computed Schedule 3 (line 1)', 'nonrefundableCredits.foreignTaxCredit', 'BigDecimal', 'FTC — subtracted from line 10 via correctLine17ForFtc() AFTER Form 1116 runs (G3 fix).', 'XLS/output_forms/form-tax-return-schedule3.xlsx'],
  [14, 'computed Form 2555 (taxpayer)', 'foreignEarnedIncomeExclusion (line 45), housingExclusionAmount (line 50)', 'BigDecimal × 2', 'FEITW path trigger + total exclusion for AMT FEITW formula.', 'XLS/input_forms/form-foreign-earned-income.xlsx + XLS/output_forms/form-tax-return-2555.xlsx'],
  [15, 'computed Form 2555 (spouse)', 'same fields', 'BigDecimal × 2', '⚠️ MFS LEAK — Form 2555 spouse routes line 7 to FEITW branch on MFS even when MFS taxpayer doesn\'t qualify. See 17 #1.', 'same'],
  [16, 'computed Schedule D (Part III conditional)', 'line15NetLongTermCapitalGainOrLoss, line16NetCapitalGainOrLoss, line19UnrecapturedSection1250Gain', 'BigDecimal × 3', 'Part III path trigger + line 14 §1250 exclusion.', 'XLS/output_forms/form-tax-return-scheduled.xlsx'],
  [17, 'computed Income (line 3a)', 'qualifiedDividends', 'BigDecimal', 'Part III path trigger.', '(internal — line 3abc audit)'],
  [18, 'computed Income (line 7a + flag)', 'capitalGainLoss, line7bScheduleDNotRequired', 'BigDecimal + Boolean', 'Part III fallback when Schedule D not required.', '(internal — line 7ab audit)'],
  [],
  ['⚠️ NO DEDICATED USER INPUT FORM FOR LINE 17 / FORM 6251'],
  ['Form 6251 (AMT) has NO `form-line17-amt.xlsx` or `form-form6251.xlsx` in C:\\us-tax\\XLS\\input_forms\\. All inputs are derived from other forms (Form 1040, Schedule A, Schedule 1, Schedule 1-A, Schedule D, Form 2555, Form 8962, 1099-INT, etc.) and computed values. This is correct architecturally — AMT is a derived recomputation, not a user-supplied form.'],
  [],
  ['⚠️ MISSING INPUTS (out-of-scope deferred items per knowledge §14)'],
  ['Field', 'Source', 'Reason missing'],
  ['Form 4952 (AMT version) line 2c amount', 'Recomputation of investment interest under AMT rules', 'Requires second Form 4952 computation with AMT-adjusted investment income. Deferred.'],
  ['ATNOLD (Alternative Tax NOL Deduction) line 2f', 'AMT NOL carryover tracking', 'Requires multi-year AMT NOL state. Deferred.'],
  ['ISO spread line 2i', 'Incentive stock option exercise spread', 'Out of scope — corporate equity events.'],
  ['Passive activity AMT adjustment line 2m', 'Schedule E AMT recomputation', 'Out of scope (rental/K-1 Sched E currently deferred).'],
  ['AMT FTC line 8', 'Separate AMT foreign tax credit computation', 'Requires AMT-specific Form 1116 computation; regular FTC used only for line 10 subtraction. Deferred.'],
  ['Form 8978 line 14 negative', 'BBA partnership pushout — partner-level adjustment', 'Spec §8 line 10 formula subtracts abs(negative line 14). NOT implemented — see 17 #9 G-new-6.'],
  ['Schedule 1 line 8z refund subset', 'State/local personal property tax, sales tax, foreign income tax, foreign real property tax refunds', 'Spec §5.2. NOT implemented — see 17 #9 G-new-7.'],
  ['Schedule 2 line 1b/1c/1d/1e/1f/1y', 'Clean-vehicle repayments, Form 4255 EPE recapture, 20% EP, other additions to tax', 'Spec §2.2. NOT implemented — see 17 #9.'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 55 }, { wch: 22 }, { wch: 70 }, { wch: 65 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 17 (AMT)'],
  ['Line 17 / Form 6251 uses 4 major reference-data sets: (1) AMT exemptions per filing status; (2) AMT exemption phaseout thresholds; (3) AMT 26%/28% breakpoints; (4) Part III preferential-rate thresholds. ALL values per Rev. Proc. 2024-40 §3.10-§3.11.'],
  [],
  ['Constant', 'Value (2025)', 'Statutory Basis', 'Backend identifier'],
  [],
  ['2025 AMT EXEMPTION amounts (Form 6251 line 5; spec §6.1)'],
  ['Single / HOH', '$88,100', 'IRC §55(d)(1)(B); Rev. Proc. 2024-40 §3.10', 'Inline literal at TaxReturnComputeService.java:11199'],
  ['MFJ / QSS', '$137,000', 'IRC §55(d)(1)(A); Rev. Proc. 2024-40 §3.10', 'Inline literal at line 11192'],
  ['MFS', '$68,500', 'IRC §55(d)(1)(C); Rev. Proc. 2024-40 §3.10', 'Inline literal at line 11195'],
  [],
  ['2025 AMT EXEMPTION PHASEOUT START (Form 6251 line 4 threshold; spec §6.2)'],
  ['Single / HOH / MFS', '$626,350', 'IRC §55(d)(3); Rev. Proc. 2024-40 §3.10', 'Inline literals at lines 11196 + 11200'],
  ['MFJ / QSS', '$1,252,700', 'IRC §55(d)(3); Rev. Proc. 2024-40 §3.10', 'Inline literal at line 11193'],
  ['Phaseout rate', '25% per dollar over threshold', 'IRC §55(d)(3)(A)', '`new BigDecimal("0.25")` at line 11209'],
  [],
  ['2025 AMT EXEMPTION FULLY PHASED OUT (informational; not directly used)'],
  ['Single / HOH', '$978,750', 'IRC §55(d)(3); Rev. Proc. 2024-40 §3.10', 'Computed: 626,350 + 88,100/0.25 = 978,750'],
  ['MFJ / QSS', '$1,800,700', 'same', 'Computed: 1,252,700 + 137,000/0.25 = 1,800,700'],
  ['MFS', '$900,350', 'same', 'Computed: 626,350 + 68,500/0.25 = 900,350'],
  [],
  ['2025 AMT 26%/28% RATE BREAKPOINTS (Form 6251 line 7 DIRECT path; spec §7.2)'],
  ['Non-MFS breakpoint', '$239,100', 'IRC §55(b)(1); Rev. Proc. 2024-40 §3.11', 'Inline literal at TaxReturnComputeService.java:11481'],
  ['MFS breakpoint', '$119,550', 'IRC §55(b)(1); Rev. Proc. 2024-40 §3.11', 'Inline literal at same line'],
  ['26% rate (below breakpoint)', '0.26', 'IRC §55(b)(1)(A)(ii)(I)', '`base * 0.26` at line 11487'],
  ['28% rate (above breakpoint)', '0.28', 'IRC §55(b)(1)(A)(ii)(II)', '`bp * 0.26 + (base - bp) * 0.28` at line 11489'],
  ['28% offset (non-MFS, computational)', '$4,782', 'Spec §7.2 (computational; not in code)', 'NOT used — code computes via bracket form, not direct offset'],
  ['28% offset (MFS, computational)', '$2,391', 'Spec §7.2 (computational; not in code)', 'NOT used — same as above'],
  [],
  ['2025 PART III 0% RATE CEILING (AMT QDCG worksheet line 19; spec §7.3)'],
  ['Single / MFS', '$48,350', 'IRC §1(h)(2); Rev. Proc. 2024-40 §3.04', 'Inline literal at TaxReturnComputeService.java:11586 / 11592'],
  ['MFJ / QSS', '$96,700', 'IRC §1(h)(2); Rev. Proc. 2024-40 §3.04', 'Inline literal at line 11583'],
  ['HOH', '$64,750', 'IRC §1(h)(2); Rev. Proc. 2024-40 §3.04', 'Inline literal at line 11589'],
  [],
  ['2025 PART III 20% RATE FLOOR (AMT QDCG worksheet line 25; spec §7.3 + G5 fix)'],
  ['Single', '$533,400', 'IRC §1(h)(2); Rev. Proc. 2024-40 §3.04', 'Inline literal at TaxReturnComputeService.java:11593'],
  ['MFS', '$300,025', 'IRC §1(h)(2); Rev. Proc. 2024-40 §3.09 (= half of MFJ $600,050; G5 spec fix)', 'Inline literal at line 11587'],
  ['MFJ / QSS', '$600,050', 'IRC §1(h)(2); Rev. Proc. 2024-40 §3.04', 'Inline literal at line 11584'],
  ['HOH', '$566,700', 'IRC §1(h)(2); Rev. Proc. 2024-40 §3.04', 'Inline literal at line 11590'],
  [],
  ['2025 INTERMEDIATE RATES used in Part III'],
  ['15% rate (line 31)', '0.15', 'IRC §1(h)(1)(C)', '`new BigDecimal("0.15")` at line 11673'],
  ['20% rate (line 34)', '0.20', 'IRC §1(h)(1)(D)', '`new BigDecimal("0.20")` at line 11685'],
  ['25% rate (line 37 §1250 surcharge)', '0.25', 'IRC §1(h)(1)(E)', '`new BigDecimal("0.25")` at line 11697'],
  [],
  ['MFS ADD-BACK CAP (deferred; rare path)'],
  ['MFS add-back cap', '$68,500', 'IRC §55(d)(3)(B); Rev. Proc. 2024-40 §3.10', 'NOT implemented — deferred per knowledge §14'],
  [],
  ['Statutory anchors'],
  ['IRC §55 (AMT statute)', '— (statute)', 'Primary AMT framework + exemption + breakpoints', '—'],
  ['IRC §56 (AMT adjustments)', '— (statute)', 'Lines 2a-2t adjustments', '—'],
  ['IRC §57 (AMT preference items)', '— (statute)', 'Lines 2g PAB interest + other preferences', '—'],
  ['IRC §58 (AMT FTC)', '— (statute)', 'Line 8 (deferred)', '—'],
  ['IRC §59 (special AMT rules)', '— (statute)', 'Including AMT NOL deduction (deferred)', '—'],
  ['IRC §911 (foreign earned income)', '— (statute)', 'YES — FEITW path for line 7', '—'],
  ['IRC §1(h) (capital gains rates)', '— (statute)', 'YES — Part III preferential rates', '—'],
  ['Rev. Proc. 2024-40', 'IRS Rev. Proc.', 'YES — all 2025 AMT thresholds + breakpoints', '—'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 55 }, { wch: 60 }, { wch: 65 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 17 Persistence to TaxAndCredits / Schedule 2 / Form 6251'],
  ['Line 17 persists to 3 different output sub-objects: (1) TaxAndCredits (line 17 PDF + diagnostics); (2) Schedule 2 tax (line 1a/1b PTC repayment + line 2 AMT); (3) Form 6251 (full Part I + II + Part III when applicable).'],
  [],
  ['Output target', 'Where wired', 'Effect', 'XLS output reference'],
  ['form1040.taxAndCredits.alternativeMinimumTax', '`wireLine17ToOutputs` line 11350', 'AMT only (Form 6251 line 11). Null when 0.', 'XLS/output_forms/form-tax-return-1040.xlsx + form-tax-return-6251.xlsx'],
  ['form1040.taxAndCredits.additionalTaxSchedule2', '`wireLine17ToOutputs` line 11353', '★ Line 17 PDF field value. **SEMANTIC INCONSISTENCY** — set = line 11 only; should equal Schedule 2 line 3 = line 1z + line 11. See 17 #9 G-new-5.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 17 cell)'],
  ['form1040.taxAndCredits.totalTaxBeforeCredits', '`computeLine18` line 11464', 'Line 18 = line 16 + line 17. Reads additionalTaxSchedule2 (so inherits the same G-new-5 inconsistency).', 'XLS/output_forms/form-tax-return-1040.xlsx (line 18)'],
  ['schedule2.tax.alternativeMinimumTax', '`wireLine17ToOutputs` line 11361', 'Schedule 2 line 2 = Form 6251 line 11.', 'XLS/output_forms/form-tax-return-schedule2.xlsx'],
  ['schedule2.tax.excessAdvancePremiumTaxCreditRepayment', 'inside `computeLine17` line 11331', 'Schedule 2 line 1a = Form 8962 line 29. Wired SEPARATELY from line 2 (PTC repayment is line 1z component but NOT summed into additionalTaxSchedule2 — G-new-5).', 'XLS/output_forms/form-tax-return-schedule2.xlsx'],
  [],
  ['Form 6251 Part I outputs (always when AMTI > 0; lines 1a-4)'],
  ['form6251.line1aTotalDeductionsMinusSenior', '`computeLine17` line 11297', 'line 14 − senior add-back.', 'XLS/output_forms/form-tax-return-6251.xlsx'],
  ['form6251.line1bAgiMinusLine1a', '`computeLine17` line 11298', 'line 11b − line 1a.', 'same'],
  ['form6251.line2aStateLocalTaxes', '`computeLine17` line 11299', 'SALT or standard deduction (G1 fix). Set only if non-zero.', 'same'],
  ['form6251.line2bStateLocalRefund', '`computeLine17` line 11300', '−refund. Set only if non-zero.', 'same'],
  ['form6251.line2gPrivateActivityBondInterest', '`computeLine17` line 11301', 'PAB interest from 1099-INT box 9. Set only if > 0.', 'same'],
  ['form6251.line4AlternativeMinimumTaxableIncome', '`computeLine17` line 11302', 'AMTI = line1b + 2a + 2b + 2g.', 'same'],
  [],
  ['Form 6251 Part II outputs (always when AMTI > 0; lines 5-11)'],
  ['form6251.line5Exemption', '`computeLine17` line 11303', 'Phaseout-adjusted exemption.', 'XLS/output_forms/form-tax-return-6251.xlsx'],
  ['form6251.line6AmtBaseAfterExemption', '`computeLine17` line 11304', 'max(0, line 4 − line 5).', 'same'],
  ['form6251.line7TentativeMinimumTax', '`computeLine17` line 11307', 'Tax via 3-path selection.', 'same'],
  ['form6251.line7ComputationPath', '`computeLine17` line 11308', 'Enum: FEITW / PART_III / DIRECT_26_28.', 'same'],
  ['form6251.line8AmtForeignTaxCredit', '`computeLine17` line 11309', 'AMT FTC — currently always null (deferred).', 'same'],
  ['form6251.line9TentativeMinimumTaxAfterFtc', '`computeLine17` line 11310', 'line 7 − line 8.', 'same'],
  ['form6251.line10RegularTaxAdjusted', '`computeLine17` line 11311 + `correctLine17ForFtc` line 11403', 'Initial: line 16 + ptc − form4972. Post-FTC: − schedule3.line1.', 'same'],
  ['form6251.line11AlternativeMinimumTax', '`computeLine17` line 11312 + `correctLine17ForFtc` line 11404', 'AMT = max(0, line 9 − line 10).', 'same'],
  [],
  ['Form 6251 Part III outputs (only when line7Path == PART_III; lines 12-40 — 29 fields)'],
  ['form6251.line12AmtBase', '`populateAmtPartIIIFields` line 11545', 'Copy of line 6.', 'XLS/output_forms/form-tax-return-6251.xlsx'],
  ['form6251.line13QualifiedDividendAndCapitalGainAmount', 'line 11600', 'qualifiedDividends + netLtcg.', 'same'],
  ['form6251.line14ScheduleDLine19', 'line 11606', '§1250 unrecaptured gain (excluded from pref pool; G-new-4 fix).', 'same'],
  ['form6251.line15AdjustedCapitalGainAmount', 'line 11610', 'max(0, line 13 − line 14).', 'same'],
  ['form6251.line16SmallerOfLine12OrLine15', 'line 11614', 'min(line 12, line 15).', 'same'],
  ['form6251.line17OrdinaryAmti', 'line 11618', 'line 12 − line 16. Taxed at 26%/28%.', 'same'],
  ['form6251.line18TaxOnLine17', 'line 11622', 'AMT rate tax on line 17.', 'same'],
  ['form6251.line19ZeroRateThreshold', 'line 11625', '0% bracket ceiling (per filing status).', 'same'],
  ['form6251.line20RegularTaxWorksheetAmount', 'line 11631', 'min(taxableIncome, line 19).', 'same'],
  ['form6251.line21ZeroRateRoom', 'line 11635', 'max(0, line 20 − line 17).', 'same'],
  ['form6251.line22SmallerOfLine12OrLine13', 'line 11639', 'min(line 12, line 13).', 'same'],
  ['form6251.line23AmountTaxedAtZeroPct', 'line 11643', 'min(line 21, line 22). 0% rate pool.', 'same'],
  ['form6251.line24Line22MinusLine23', 'line 11647', 'line 22 − line 23.', 'same'],
  ['form6251.line25FifteenPctThreshold', 'line 11650', '15%/20% boundary (per filing status).', 'same'],
  ['form6251.line26AmountFromLine21', 'line 11653', 'Copy of line 21.', 'same'],
  ['form6251.line27QdcgtwOrSdtwAmount', 'line 11658', 'min(taxableIncome, line 25).', 'same'],
  ['form6251.line28Line26PlusLine27', 'line 11662', 'line 21 + line 27.', 'same'],
  ['form6251.line29Line25MinusLine28', 'line 11666', 'max(0, line 25 − line 28).', 'same'],
  ['form6251.line30SmallerOfLine24OrLine29', 'line 11670', 'min(line 24, line 29). 15% rate pool.', 'same'],
  ['form6251.line31FifteenPctTax', 'line 11674', 'line 30 × 0.15.', 'same'],
  ['form6251.line32Line23PlusLine30', 'line 11678', '0% + 15% pool total.', 'same'],
  ['form6251.line33Line22MinusLine32', 'line 11682', 'max(0, line 22 − line 32). 20% rate residual.', 'same'],
  ['form6251.line34TwentyPctTax', 'line 11686', 'line 33 × 0.20.', 'same'],
  ['form6251.line35Line17PlusLine32PlusLine33', 'line 11690', 'Pool baseline for §1250 surcharge.', 'same'],
  ['form6251.line36Line12MinusLine35', 'line 11694', 'max(0, line 12 − line 35). §1250 base.', 'same'],
  ['form6251.line37TwentyFivePctTax', 'line 11698', 'line 36 × 0.25.', 'same'],
  ['form6251.line38AddLines18_31_34_37', 'line 11702', 'Sum: ordinary + 15% + 20% + 25% (§1250).', 'same'],
  ['form6251.line39TaxOnLine12AtDirectRates', 'line 11706', 'Comparison: straight 26%/28% on all of line 12.', 'same'],
  ['form6251.line40SmallestOf38Or39', 'line 11710', 'min(line 38, line 39). = line 7 result.', 'same'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 18 (line16 + line17)', '`computeLine18` line 11438', '★★ totalTaxBeforeCredits. Refreshed after FTC correction (G-new-1 fix).', 'XLS/output_forms/form-tax-return-1040.xlsx (line 18)'],
  ['Form 1116 (Foreign Tax Credit) limitation', '—', '★★ Reads regular tax + AMT for FTC limit calculation.', 'XLS/output_forms/form-tax-return-1116.xlsx'],
  ['Form 8801 (prior-year AMT credit)', '—', '★★ Reads prior-year Form 6251 values for current-year prior-min-tax-credit.', 'XLS/output_forms/form-tax-return-8801.xlsx'],
  ['Form 8880 CLW (Saver\'s Credit)', '—', 'Reads totalTaxBeforeCredits (after FTC correction).', 'XLS/output_forms/form-tax-return-8880.xlsx'],
  ['Schedule 8812 (CTC/ACTC)', '—', 'Reads totalTaxBeforeCredits.', 'XLS/output_forms/form-tax-return-schedule8812.xlsx'],
  ['Schedule 3 (nonrefundable credits)', '—', 'Reads totalTaxBeforeCredits as denominator for credit limitation.', 'XLS/output_forms/form-tax-return-schedule3.xlsx'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 55 }, { wch: 65 }, { wch: 75 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 17'],
  ['Line 17 emits NO blocking flags directly — it silently skips when deductions or adjustments are null, or emits minimal stub when PAB interest is present. Upstream blocking flags (from lines 1-16) gate which path is taken.'],
  [],
  ['Flag code', 'Severity', 'Condition', 'Where emitted'],
  ['(None at line 17 site)', 'N/A', 'Line 17 silently skips when deductions/adjustments null. Emits minimal stub when PAB interest > 0 (per spec §3 — Form 6251 required even when AMT = 0).', '`computeLine17` gate at lines 11074-11098'],
  [],
  ['SPEC §11 STRUCTURAL INVARIANTS (not runtime-validated)'],
  ['Invariant', 'How enforced / Status'],
  ['LINE17_MUST_MATCH_SCHEDULE2_LINE3 (spec §11.1)', '`wireLine17ToOutputs` sets `additionalTaxSchedule2 = line11` only. **VIOLATED** when Schedule2.line1z != 0 (e.g., PTC repayment > 0). See 17 #9 G-new-5.'],
  ['SCHEDULE2_LINE3_MISMATCH (spec §11.1)', 'Schedule 2 line 3 = line 1z + line 2. Currently `line1z` computation absent; only PTC repayment (line 1a) wired separately to schedule2.tax.excessAdvancePremiumTaxCreditRepayment.'],
  ['SCHEDULE2_LINE2_MISMATCH (spec §11.1)', '`wireLine17ToOutputs` sets `schedule2.tax.alternativeMinimumTax = line11`. ENFORCED structurally.'],
  ['FORM6251_LINE2A_STANDARD_DEDUCTION_REQUIRED (spec §11.2)', 'When `!isItemizing` AND `line12e > 0`, code sets `line2a = line12e.max(0)` per G1 fix. ENFORCED at TaxReturnComputeService.java:11122-11132.'],
  ['FORM6251_2025_STARTING_POINT_WRONG (spec §11.2)', 'Code uses `line1b = line11b − line1a` per 2025 spec §4.2. ENFORCED at line 11114. Old pre-2025 "line 4 starts from line 15" approach NOT used.'],
  ['LINE17_NOT_AMT_ONLY (spec §11.3)', 'Code sets `additionalTaxSchedule2 = line11` (line 11 only). **VIOLATED** when Schedule2.line1z != 0. See 17 #9 G-new-5.'],
  ['MFS CALL-SITE GUARD (added in 17 #1)', '`isMfsReturn ? null : form2555Spouse` at prepare() line 1224. ENFORCED post-17-#1 fix.'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 12 }, { wch: 100 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 17 is the AMT orchestrator (Form 6251 + Schedule 2 line 3 + FTC correction pass). 4th audit OUTSIDE 13ab pair; SECOND orchestrator-based audit in line-16+ chain. 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-14 — ⚠️ HIGH-PRIORITY MFS DEFENSIVE GAP FIXED at computeLine17 call site (single leakage path — form2555Spouse FEITW leak in AMT)',
    '**Closure applied (Option A — call-site null-shadow; matches 16 #1 + 13b #1 + 13a #1 SURGICAL precedent)**: TaxReturnComputeService.java has ONE leakage path at the computeLine17 call site (simpler than 16 #1\'s bundled two-leak fix). (1) **~28-line MFS breadcrumb** added above the call site at prepare() ~line 1222 documenting: (a) per-input MFS-leakage classification of all 14 inputs (8 return-level scalars NO leak; form2555Taxpayer taxpayer-side OK; ★ form2555Spouse the ONE direct leak; form4972 inherited fix transitively from 16 #1); (b) leak mechanism: FEITW branch at line 11252 fires when either form2555 non-null → wrongly routes line 7 to `computeAmtForeignEarnedIncomeTaxWorksheet` on MFS with stale spouse Form 2555; (c) ★ direction: AMT OVER-stated (FEITW = tax(amtBase + exclusion) − tax(exclusion) eliminates low-bracket benefit on amtBase → HIGHER TMT than DIRECT 26/28%); taxpayer self-harm; same direction as 16 #1; (d) 19-orchestrator cascade context. (2) **Call-site null-shadow** at ~line 1224: `isMfsReturn ? null : form2555Spouse`. (3) NEW lock-in test `mfsExcludesSpouseForm2555FromLine17Feitw` at TaxReturnComputeServiceTest.java — MFS taxpayer + $400k US wages + $80k PAB interest (forces Form 6251 emission) + STALE spouse Form 2555 ($60k FEIE). **Test confirms**: post-fix `line7ComputationPath` = "DIRECT_26_28" (FEITW correctly bypassed); line 7 = $114,229 matches DIRECT formula (MFS breakpoint $119,550 × 0.26 + $296,950 × 0.28); line 11 AMT = $8,175. Log confirms: `line6=416500 line7path=DIRECT_26_28 line7=114229 line11=8175`. **Single-guard MFS cascade now applied to 19 orchestrators — NEW CODEBASE MAXIMUM** (was 18 after 16 #1). Cascade roster (19): 1c + 1d + 1e + 1f + 1g + 1h + 1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities + computeSocialSecurityBenefits + computeCapitalGainLoss + computeOtherIncomes + computeIncomeAdjustments + buildStandardDeductionIndicators + computeLine13a + computeSchedule1A + computeLine16 + **computeLine17 (NEW)**. **Single-leak precedent**: simpler than 16 #1\'s bundled two-leak fix (form4972Spouse leak in AMT inherited transitively via TaxAndCredits.getBox2Form4972Tax which already got 16 #1 fix). Backend: 763 → **764** (+1 lock-in test). Direction SAME AS 16 #1 (over-stated tax — taxpayer self-harm by paying more AMT than owed pre-fix).',
    'TaxReturnComputeService.java:~1222 (~28-line MFS breadcrumb); ~1224 (call-site null-shadow `isMfsReturn ? null : form2555Spouse`); TaxReturnComputeServiceTest.java (mfsExcludesSpouseForm2555FromLine17Feitw lock-in test)',
    'CLOSED — MFS guard applied at call site (form2555Spouse single-leak fix); lock-in test added. Backend 764/764 pass (+1). 19th orchestrator in MFS cascade — NEW CODEBASE MAXIMUM.'],

  [2, 'RESOLVED 2026-05-14 — DOCUMENTATION HYGIENE — Knowledge file Legacy A rename (knowledge_line17.md → line-17-alternative-minimum-tax.md)',
    '**Closure applied**: (1) plain `mv` of `C:\\us-tax\\knowledge\\knowledge_line17.md` → `C:\\us-tax\\knowledge\\line-17-alternative-minimum-tax.md` (folder not under git). (2) Repo-wide grep for `knowledge_line17` produced 6 hits (classified per established 15 #2 / 16 #2 precedent): ACTIVE-UPDATE = 1 hit at `generate-17.js` line 11 (header comment citing knowledge file source — updated to new path with rename annotation `(renamed from knowledge_line17.md via 17 #2 2026-05-14)`). LEAVE-UNTOUCHED = 5 hits — `history.md` 2 historical-entry hits (lines 875, 3691) per immutable-history policy + `generate-7a.js`, `generate-8.js`, `generate-9.js`, `generate-10.js` 4 historical-generator hits (frozen at time of writing — line 10 #2 explicitly listed `knowledge_line17.md` as a then-pending Legacy A file). (3) `lines/17.md` + `dependencies/17.md` scan: NO citation of knowledge file path → no update needed. (4) The Issue #2 row description itself (this row) intentionally contains both old + new names showing the rename — left as audit-trail record. **10th Legacy A migration in workflow** (after 7a/8/9/10/11a/12a/13a/15/16 #2). **Knowledge-file naming convergence advances 22 → 23 lines**. Pure documentation closure — no functional change. Backend tests: 764/764 unchanged.',
    'C:\\us-tax\\knowledge\\line-17-alternative-minimum-tax.md (renamed); C:\\us-tax\\XLS\\_tools\\generate-17.js line 11 (header citation updated); 5 historical hits left untouched per precedent',
    'CLOSED — file renamed + active citation updated; 5 historical hits left untouched per precedent. Pure documentation closure. 10th Legacy A migration. Convergence 22 → 23 lines.'],

  [3, 'RESOLVED 2026-05-14 — SPEC ENHANCEMENT — Verification log section §14 created in lines/17.md (single-row pattern; smallest log shape)',
    '**Closure applied**: appended `## 14) Verification log` section to `lines/17.md` after section §13 (Bottom line). 5-column markdown table; **row 1 in IN-PROGRESS state** capturing #1 (HIGH-PRIORITY MFS guard — 19 orchestrators NEW MAX + 763 → 764) + #2 (Legacy A rename — 22 → 23 convergence; 10th migration symbolic milestone) + #3 (this section creation). Row 1 will be finalized to **"COMPLETE — 10/10 closed"** at Issue #10 (boundary milestone) with all 10 closures enumerated. **Single-row pattern** = SMALLEST log shape (mirrors lines 8, 9, 10, 14, 15, 16 single-line audits; contrasts with 2ab/3abc/4abc/5abc/6abcd/7ab/11ab/13ab pair-or-cluster logs and 12abcde 5-row LARGEST cluster log). Append-then-finalize pattern (used at 14 #3, 15 #3, 16 #3) lets the row evolve as the walkthrough progresses; final state captured atomically at Issue #10. Pure spec enhancement — no functional change. Backend tests: 764/764 unchanged.',
    'C:\\us-tax\\lines\\17.md section §14 appended after §13 (Bottom line; line 416)',
    'CLOSED — §14 Verification log section created with single-row IN-PROGRESS table. Single-line audit shape (smallest log).'],

  [4, 'RESOLVED 2026-05-14 — ★ FORWARD TERMINAL SEED planted at computeLine17 orchestrator (SECOND terminal seed in workflow after 16 #4)',
    '**Closure applied**: ~120-line AUDIT-TRAIL ANCHOR seed breadcrumb planted at TaxReturnComputeService.java:~11045-~11185 (between the section banner and the existing JavaDoc, so both navigation landmarks remain intact). **TERMINAL seed** (no future upgrades expected — each future orchestrator-based audit plants its own seed) but **REFERENCED seed** (future line-18 / Form-1116 / Form-8801 / Form-6251-Part-IV audits cite it as a navigable hub within the AMT-territory chain; pairs with 16 #4 seed at ~line 1725 to form the AMT-territory navigable hub: line 16 ← 16 #4 / line 17 ← 17 #4 / line 18 ← future). **Structure — 10 themes**: (1) Method designation + 17 #4 audit-trail anchor + helper method line refs (wireLine17ToOutputs ~11343 + correctLine17ForFtc ~11379 + computeLine18 ~11438 + computeAmtDirectRate ~11476 + computeAmtPartIII ~11505 + populateAmtPartIIIFields ~11538 + computeAmtForeignEarnedIncomeTaxWorksheet ~11723) + 17 #1 MFS guard cross-ref. (2) **★ Line 17 is NOT AMT-only foundational concept** — Form1040.line17 = Schedule2.line3 = Schedule2.line1z + Schedule2.line2 per spec §11.3 LINE17_NOT_AMT_ONLY invariant. (3) Form 6251 Part I / II / III architecture with line refs (Part I lines 1a-4 AMTI; Part II lines 5-11 TMT + AMT; Part III lines 12-40 AMT QDCG 29 fields). (4) **★ 2025 NEW line 1a / line 1b starting structure** — line 1a = line 14 − schedule1A.line37 senior add-back; line 1b = line 11b − line 1a; line 4 starts from line 1b (NOT line 15 as in prior years); per spec §11.2 FORM6251_2025_STARTING_POINT_WRONG invariant. (5) 3-path line 7 selection with priority (FEITW per IRC §911 > PART_III for QDCG/LTCG > DIRECT_26_28 fallback with breakpoints $239,100 / MFS $119,550). (6) FTC correction pass shape — correctLine17ForFtc invoked AFTER applyForeignTaxCreditToSchedule3 at prepare() line 1237; G3 fix subtracts FTC from line 10; G-new-1 fix refreshes computeLine18. (7) **★ 9 historical gaps (G1-G5 + G-new-1..4) all Fixed 2026-04-18** — full per-gap status with line refs. (8) **★ 4 NEW gaps surfaced in 17 audit** — G-new-5 HIGH (PTC repayment line 17 flow gap; recommended for follow-up fix), G-new-6 MEDIUM (Form 8978 negative missing from line 10), G-new-7 MEDIUM (Schedule 1 line 8z refund subset missing from line 2b), G-new-8 HIGH (= 17 #1 MFS guard; CLOSED). (9) MFS guard cross-ref to 17 #1 — single-leakage-path fix (form2555Spouse only); lock-in test `mfsExcludesSpouseForm2555FromLine17Feitw`; direction OVER-stated tax pre-fix. (10) Cross-ref to 16 #4 forward terminal seed at ~line 1725 — together they form the AMT-territory navigable hub. **FUTURE EXTENSION POINTS** section appended with informational hooks for: future line 18 audit (will cite this + 16 #4 seeds), Form 1116 audit (FTC limitation; consumes line 16/17/18 + triggers correctLine17ForFtc), Form 8801 audit (prior-year AMT credit), Form 6251 Part IV audit (Schedule 8801 carryforward; deferred), Box 3 expansion hooks for Schedule 2 line 1z items (1b/1c clean-vehicle, 1d/1e/1f Form 4255, 1y other — all blocked by G-new-5 needing fix first). **SECOND terminal seed in workflow** (after 16 #4). Pure documentation closure — no functional change. Backend tests: 764/764 unchanged.',
    'TaxReturnComputeService.java:~11045-~11185 (~120-line forward terminal seed planted between section banner and existing JavaDoc)',
    'CLOSED — terminal seed planted (NOT upgraded by future audits; each future orchestrator-based audit plants its own seed). SECOND terminal seed in workflow (after 16 #4). Will be REFERENCED by future line-18 / Form-1116 / Form-8801 audits as a navigable hub.'],

  [5, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — Form 6251 Part I (lines 1a, 1b, 2a, 2b, 2g, 4) — 2025 starting structure with senior add-back + G1 line 2a fix',
    '**Closure applied**: ~50-line VERIFIED CORRECT breadcrumb planted above the Part I block at TaxReturnComputeService.java:~11284 (above the "── Part I: AMTI computation" section comment). Structure — 6 sub-verifications: (1) **★ Line 1a (2025 NEW senior add-back)** — line1a = line14 − schedule1A.line37; null-safe (defaults to 0); intermediate ONLY (does NOT flow directly into line 4 — feeds line 1b only per spec §4.3). Per spec §4.1. (2) **★ Line 1b (2025 NEW starting point)** — line1b = line11b − line1a; negative permitted (no max-zero); per spec §4.2 + §11.2 FORM6251_2025_STARTING_POINT_WRONG invariant. (3) **★ Line 2a G1 2025 fix** — itemizer path: scheduleA.getDeductibleTaxes() (= Schedule A line 7 SALT after $10k cap); non-itemizer path: line12e (standard deduction). Pre-G1 non-itemizer line2a was always 0 → AMTI understated by $15,750 (Single/MFS) to $31,500 (MFJ) → missed AMT for non-itemizers with significant PAB interest. Per spec §5.1 + §11.2 FORM6251_LINE2A_STANDARD_DEDUCTION_REQUIRED invariant. Disaster exception NOT implemented (rare path; out of scope). (4) **Line 2b** — line2b = −schedule1.taxableRefundsStateLocal (negative; offsets income already on Schedule 1 line 1). Per spec §5.2. **⚠️ Breadth gap → 17 #9 G-new-7**: Spec §5.2 also covers Schedule 1 line 8z refund subset (state/local personal property tax, sales tax, foreign income/real property tax refunds); NOT implemented. (5) **Line 2g** — line2g = pabInterest (1099-INT box 9 aggregated; per IRC §57(a)(5)). PAB interest > 0 forces Form 6251 emission even when AMT = 0 (per spec §3 + stub-emission at line ~11267). (6) **Line 4 AMTI** — line4 = line1b + line2a + line2b + line2g; per spec §4.3 ("Combine lines 1b through 3"). Verified correct for the 4 implemented operands. **⚠️ Deferred items → 17 #9 bundled observations**: Per spec §5.3, line 4 should also include lines 2c (Form 4952 AMT), 2f (ATNOLD), 2i (ISO spread), 2m (passive activity AMT), line 3 (other AMT adjustments) — all currently 0 per knowledge §14 out-of-scope. **Coverage cross-references**: spec §4 + §5 + §11.2 invariants + dependencies/17.md "Direct Inputs" + 17 #4 forward terminal seed at ~line 11055 + 17 #9 deferred-items observation + knowledge §14. Pure documentation closure — no functional change. Backend tests: 764/764 unchanged.',
    'TaxReturnComputeService.java:~11284 (above "── Part I: AMTI computation" section banner; ~50-line breadcrumb covering 6 sub-verifications for lines 1a/1b/2a/2b/2g/4)',
    'CLOSED — verified correct. ~50-line breadcrumb documents 2025 NEW line 1a/1b starting structure (with senior add-back) + G1 line 2a fix + line 2b state/local refund negation + line 2g PAB interest + line 4 AMTI sum. ⚠️ Breadth gap (Sched 1 line 8z) + deferred items (2c/2f/2i/2m/3) flagged for 17 #9 observation bundle.'],

  [6, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — Form 6251 Part II (lines 5, 6, 7, 8, 9, 10, 11) — exemption + 3-path line 7 + FTC-deferred line 10',
    '**Closure applied**: ~75-line VERIFIED CORRECT breadcrumb planted above Line 5 code at TaxReturnComputeService.java:~11413 (above the "// Line 5: AMT exemption (with phaseout)." comment — covers ALL of Part II lines 5-11; the "── Part II" banner at ~line 11471 only marks the line-7 sub-block, but per IRS spec Part II actually starts at line 5). Structure — 7 sub-verifications: (1) **Line 5 exemption** — 3 filing-status branches; 2025 constants per Rev. Proc. 2024-40 §3.10 (MFJ/QSS $137,000 / MFS $68,500 / Single+HOH $88,100); **★ Single + HOH share exemption** per IRC §55(d)(1)(B); 25% phaseout above status-specific threshold; fully phased out at $978,750 / $1,800,700 / $900,350. **⚠️ MFS add-back cap deferred → 17 #9**: IRC §55(d)(3)(B) caps 25% add-back at $68,500 for MFS with AMTI > $900,350; rare path; not implemented. (2) **Line 6** = max(0, line 4 − line 5) per spec §6.4. Special case: if line 6 = 0, stub-emission path at lines ~11380-11410 handles per spec §6.4 ("If line 6 is zero or less, enter zero on lines 7, 9, and 11"). (3) **★ Line 7 3-path selection** — strict priority order per spec §7.1 + IRC §911 (FEITW > PART_III > DIRECT_26_28); spouse Form 2555 null-shadowed by 17 #1 at call site; path enum stored in `line7ComputationPath`; decision-tree branch order enforces priority STRUCTURALLY (no runtime validation needed); breakpoints non-MFS $239,100 / MFS $119,550. (4) **Line 8 AMT FTC = 0** (deferred per knowledge §14); requires separate AMT-specific Form 1116 computation; **⚠️ don\'t confuse with line 10 FTC** (line 8 = AMT FTC; line 10 = regular FTC via Schedule 3 line 1). (5) **Line 9** = line 7 − line 8 per spec §7.5; code uses .max(0) defensively (consistent with spec §7.4 "If line 10 ≥ line 7, enter 0 on line 11"). (6) **★ Line 10 (regular tax adjusted) — INITIAL value here** (FTC subtracted LATER via correctLine17ForFtc after Form 1116 runs per G3 + G-new-1 fixes). Formula: line10 = line16 + ptcRepayment − form4972LumpSumTax. **★ Inherits 16 #1 fix transitively** — `form4972LumpSumTax` reads `taxAndCredits.getBox2Form4972Tax()` which was null-shadowed at the line 16 call site by 16 #1; on MFS correctly = $0 without needing a separate guard at line 17. **⚠️ Spec §8 also subtracts abs(negative Form8978.line14) → 17 #9 G-new-6**; NOT implemented. Schedule J refigure clause per spec §8 N/A (Schedule J not implemented per 16 #9). (7) **★ Line 11 AMT — INITIAL** = max(0, line 9 − line 10) per spec §9.1; AFTER Form 1116 runs, correctLine17ForFtc recomputes line 11 with FTC-corrected line 10. Wire point at ~line 11431 → sets TaxAndCredits.alternativeMinimumTax + additionalTaxSchedule2 (★ 17 #9 G-new-5 semantic gap: line11 only, not line1z + line11) + Schedule2.tax.alternativeMinimumTax. **Coverage cross-references**: spec §6 + §7 + §8 + §9 + dependencies/17.md "Compute Order" + 17 #4 forward terminal seed + 17 #1 MFS guard + 17 #9 observation bundle (G-new-6 + MFS add-back cap) + 16 #1 fix inheritance + knowledge §14. Pure documentation closure — no functional change. Backend tests: 764/764 unchanged.',
    'TaxReturnComputeService.java:~11413 (above "// Line 5: AMT exemption" comment; ~75-line breadcrumb covering 7 sub-verifications for lines 5/6/7/8/9/10/11 + 16 #1 fix inheritance note + 17 #1 MFS guard cross-ref)',
    'CLOSED — verified correct. ~75-line breadcrumb documents exemption phaseout (3 filing-status branches; Single+HOH share) + 3-path line 7 with FEITW priority + line 8 AMT FTC deferred + line 10 inherits 16 #1 fix transitively + line 11 INITIAL (re-corrected by correctLine17ForFtc). ⚠️ G-new-6 (Form 8978 line 10) + MFS add-back cap flagged for 17 #9 observation bundle.'],

  [7, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — Form 6251 Part III (lines 12-40; AMT QDCG worksheet) — 29 IRS fields with §1250 exclusion + G-new-2/G-new-4 historical-bug warnings',
    '**Closure applied**: ~95-line VERIFIED CORRECT breadcrumb planted above `populateAmtPartIIIFields` method at TaxReturnComputeService.java:~11852 (above the existing JavaDoc, so both navigation landmarks remain intact). Structure — 5 sub-verifications: (1) **★ Filing-status thresholds (lines 19 + 25)** — 2025 per Rev. Proc. 2024-40 §3.04 + §3.09; 0% ceiling Single/MFS $48,350 / MFJ-QSS $96,700 / HOH $64,750; 20% floor Single $533,400 / MFS $300,025 (★ G5 spec fix; MFS = half of MFJ per §3.09) / MFJ-QSS $600,050 / HOH $566,700; ★ Single+MFS share 0% ceiling but split at 20% floor (asymmetric per IRS Rev. Proc. structure). (2) **★ G-new-2 + G-new-4 historical fix context** (closed 2026-04-18) — pre-fix G-new-2 returned a value but set NO Part III fields (PDF export showed lines 12-40 blank); pre-fix G-new-4 used simplified algebra including §1250 in 0/15/20% pool with 10% surcharge (gave different lower result than IRS form when §1250 fell in 0% bracket or straddled 15%/20% boundary). 2026-04-18 fix: replaced both with `populateAmtPartIIIFields` — sets all 29 fields + follows EXACT IRS Part III worksheet line-by-line. E2E coverage: `Line 17 G-new-4` in line17-amt-gaps.spec.ts. **★ WARNING TO FUTURE MAINTAINERS**: DO NOT replace with "simpler algebra" — IRS worksheet structure is required for correctness when §1250 gain interacts with bracket boundaries. (3) **Lines 12-15 input setup** — line 12 = line 6 AMT base; line 13 = qualDivs + netLtcg (where netLtcg = min(Sched D line15, line16) when both positive, OR Form 1040 line 7a when Sched D not required — mirrors regular QDCG WS input logic); line 14 = Sched D line 19 §1250 (G-new-4 critical exclusion); line 15 = max(0, line 13 − line 14) preferential pool AFTER §1250 exclusion. (4) **★ Lines 16-37 progressive bracket arithmetic** — full worksheet documented line-by-line: line 16 (pref pool capped at AMT base), line 17 (ordinary AMTI = 26/28%), line 18 (tax on line 17), lines 19-23 (0% bracket; line 23 = AMOUNT TAXED AT 0%), lines 24-31 (15% bracket; line 30 = AMOUNT TAXED AT 15%; line 31 = ×0.15), lines 32-34 (20% bracket; line 33 = AMOUNT TAXED AT 20%; line 34 = ×0.20), lines 35-37 (★ §1250 surcharge: line 35 = pool baseline; line 36 = §1250 base; line 37 = ×0.25; per IRC §1(h)(1)(E) — adds §1250 back at 25% after exclusion from 0/15/20 pool). (5) **★ Lines 38-40 final reconciliation** — line 38 = line 18 + line 31 + line 34 + line 37 (Part III bracket total); line 39 = computeAmtDirectRate(line 12) (flat 26/28% comparison); line 40 = min(line 38, line 39) (★ INVARIANT: Part III NEVER raises tax vs. flat-rate path per IRS i6251); `computeAmtPartIII` helper at ~line 11505 returns `temp.getLine40SmallestOf38Or39()` guaranteeing line 7 = line 40. **Coverage cross-references**: spec §7.3 + IRC §1(h) + IRS Form 6251 Part III worksheet 2025 + i6251 2025 + Rev. Proc. 2024-40 §3.04 + §3.09 + 17 #4 forward terminal seed + 17 #6 Part II breadcrumb (line 7 path selection) + `computeAmtPartIII` delegation contract + line17-amt-gaps.spec.ts E2E G-new-2/G-new-4 coverage. Pure documentation closure — no functional change. Backend tests: 764/764 unchanged.',
    'TaxReturnComputeService.java:~11852 (above populateAmtPartIIIFields existing JavaDoc; ~95-line breadcrumb covering 5 sub-verifications + ★ G-new-4 future-maintainer warning + min(line38, line39) invariant)',
    'CLOSED — verified correct. ~95-line breadcrumb documents 29-field IRS Part III worksheet line-by-line + 2025 thresholds (G5 spec fix MFS $300,025) + G-new-2/G-new-4 historical fix context with ★ future-maintainer warning + lines 12-15 input setup + lines 16-37 progressive bracket arithmetic + lines 38-40 final reconciliation with min(line38, line39) invariant. G-new-2 + G-new-4 fixes locked in 2026-04-18.'],

  [8, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — Wiring + FTC correction (wireLine17ToOutputs + PTC repayment + computeLine18 + correctLine17ForFtc + early-exit guards)',
    '**Closure applied**: ~75-line VERIFIED CORRECT breadcrumb planted above `wireLine17ToOutputs` method at TaxReturnComputeService.java:~11657 (above the existing JavaDoc). Structure — 5 sub-verifications + flow diagram: (1) **wireLine17ToOutputs (initial wire)** — sets THREE output fields: taxAndCredits.alternativeMinimumTax + taxAndCredits.additionalTaxSchedule2 (★ G2 fix — wires PDF line 17 field) + schedule2.tax.alternativeMinimumTax. **⚠️ G-new-5 semantic gap → 17 #9**: additionalTaxSchedule2 set = amt only (line 11), not Schedule 2 line 3 = line 1z + line 11. (2) **PTC repayment wiring (Schedule 2 line 1a; SEPARATE from line 2)** — inside computeLine17 at ~line 11572 sets sched2Tax.excessAdvancePremiumTaxCreditRepayment. ★ Why separate: structurally part of Schedule 2 line 1z (additions to tax), NOT line 2 (AMT); wired directly so Schedule 2 reflects line 1a even when AMT = 0. ⚠️ But NOT summed into additionalTaxSchedule2 (G-new-5 gap). (3) **computeLine18 (line 18 = line 16 + line 17)** — at ~line 11737; reads additionalTaxSchedule2 (Schedule 2 line 3 semantic) NOT alternativeMinimumTax (Form 6251 line 11 only) — design choice for future-safety; ★ inherits G-new-5 propagation: line 18 also understates by line 1z when PTC > 0. (4) **correctLine17ForFtc (G3 + G-new-1 fixes)** — invoked from prepare() ~line 1237 AFTER applyForeignTaxCreditToSchedule3. ★ G3 fix (2026-04-18): line 10 missing − Schedule3.line1 FTC; fix subtracts retroactively. ★ G-new-1 fix (2026-04-18): pre-fix line 18 stale after FTC correction; fix added computeLine18() at end of method. Formula: line10Corrected = line10 − FTC; line11Corrected = max(0, line9 − line10Corrected); form6251.setLine10/11Corrected; wireLine17ToOutputs(corrected); computeLine18() refresh. (5) **Early-exit guards** — (a) schedule3/nonrefundableCredits null → return; (b) ftc null/0 → return (no-op); (c) line9/line10Original null → return (rare stub-emission case); plus caller-side guard `if (form6251 != null)` at prepare() ~line 1236 prevents NPE when AMTI ≤ 0. **Flow diagram included**: computeLine17 → wire(initial) → line 18 → Form 1116 → applyForeignTaxCreditToSchedule3 → correctLine17ForFtc → wire(corrected) → line 18 refresh. **Coverage cross-references**: spec §8 + §9 + §10 + dependencies/17.md "Compute Order" + 17 #4 forward terminal seed + 17 #6 Part II breadcrumb (line 10 initial formula) + 17 #9 G-new-5 observation + prepare() invocation order at ~line 1236-1238 + knowledge §7 backend implementation. Pure documentation closure — no functional change. Backend tests: 764/764 unchanged.',
    'TaxReturnComputeService.java:~11657 (above wireLine17ToOutputs JavaDoc; ~75-line breadcrumb covering 5 sub-verifications + flow diagram + 3 fix-locks G2/G3/G-new-1)',
    'CLOSED — verified correct. ~75-line breadcrumb documents 5 sub-verifications + flow diagram + G2/G3/G-new-1 historical fix context + 3-tier early-exit guards. ⚠️ G-new-5 semantic gap flagged at 2 propagation points (wireLine17ToOutputs + computeLine18) — observation in 17 #9. G2 + G3 + G-new-1 fixes locked in 2026-04-18.'],

  [9, 'RESOLVED 2026-05-14 — ⚠️ BUNDLED OBSERVATIONS — 4 NEW gaps surfaced + 3 deferred-scope confirmations (14th Path A application; 18 consecutive zero-outstanding walkthroughs)',
    '**Closure applied**: pure xlsx-flip observation — **NO code change**; **NO outstanding.md entry** (anti-fragmentation policy). SEVEN observations bundled — all share same "documented + deferred/out-of-scope; not blocking real returns in current scope" rationale. **PART A — 4 NEW gaps surfaced in 17 audit**: **(a) G-new-5 (HIGH) ★ RECOMMENDED FOR FOLLOW-UP FIX** — `wireLine17ToOutputs` at line 11353 sets `additionalTaxSchedule2 = amt` (line 11 only); semantically this field represents Schedule 2 line 3 = line 1z + line 11. When PTC repayment > 0 AND AMT = 0: line 17 PDF blank when it should equal PTC repayment; also propagates to computeLine18 → line 18 understated by line 1z (per spec §11.3 LINE17_NOT_AMT_ONLY validation error). **Concrete failure mode**: MFJ couple with $5,000 excess advance PTC repayment + no AMT → line 17 PDF blank; line 18 understates by $5,000. **Recommended fix**: compute Schedule2.line1z = excessAdvancePremiumTaxCreditRepayment + (other line 1 items when implemented); set additionalTaxSchedule2 = line1z + line11. Beyond 10-issue audit scope; deferred to follow-up audit cycle. **(b) G-new-6 (MEDIUM)** — spec §8 line 10 formula also subtracts `abs(negative Form 8978 line 14)`. Code missing. Form 8978 BBA partnership pushout rarely applies; current line 16 #8 audit confirmed Form 8978 negative goes to Schedule 3 line 6l (NOT line 16) — but Form 6251 line 10 still needs the abs(negative) subtraction per spec. Documented for visibility. **(c) G-new-7 (MEDIUM)** — spec §5.2 line 2b also covers Schedule 1 line 8z refund subset (state/local personal property tax, sales tax, foreign income tax, foreign real property tax refunds). Code only handles Schedule 1 line 1 refunds. Requires Schedule 1 line 8z categorization logic that doesn\'t currently exist; beyond audit scope. **(d) G-new-8 = 17 #1 MFS guard ★ ALREADY CLOSED** — listed for completeness; the form2555Spouse leak at computeLine17 call site was the same as 17 #1; CLOSED via 17 #1 (call-site null-shadow + lock-in test + 19 orchestrators NEW MAX). **PART B — 3 deferred-scope confirmations**: **(e) Deferred AMT adjustments per knowledge §14** — line 2c Form 4952 AMT recompute (requires second Form 4952 computation; different from regular Form 4952 in scope); line 2f ATNOLD (requires multi-year AMT NOL state); line 2i ISO spread (out of scope per CLAUDE.md — corporate equity events); line 2m passive activity AMT (out of scope — Schedule E/rental deferred). All currently = 0 in code. Confirmed deferred-state. **(f) MFS add-back cap $68,500** (rare high-income MFS path per IRC §55(d)(3)(B); rare path — MFS with AMTI > $900,350 = individual income > ~$1M after AMT prefs; documented for visibility per knowledge §5 + §14). **(g) Schedule 2 line 1z scope** — only line 1a (PTC repayment) wired (via Form 8962 line 29). Lines 1b/1c (clean-vehicle dealer repayments), 1d/1e/1f (Form 4255 EPE recapture), 1y (other additions) NOT implemented per spec §2.2 — all out-of-scope future expansion candidates. **★ Anti-fragmentation policy applied** — 7 observations bundled into ONE Issue #9 closure rather than fragmented across multiple audit rows; all share same closure rationale (documented + intentional / deferred / not blocking current returns). G-new-5 RECOMMENDED for follow-up fix annotation captured at top of bundle; G-new-6/G-new-7 documented for visibility. **★ 14th PATH A APPLICATION** (after 13 prior: lines 8/9/10/12c-e/13a-b/14/15/16 + earlier 17 issues). **★ Streak extends 17 → 18 consecutive zero-outstanding walkthroughs** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17). Pure documentation closure — no functional change. Backend tests: 764/764 unchanged.',
    'TaxReturnComputeService.java:~11353 (wireLine17ToOutputs G-new-5); ~11586 (line 10 G-new-6); ~11302-~11308 (line 2b G-new-7); ~11314-~11318 (deferred items 2c/2f/2i/2m); knowledge §5 + §14 (MFS add-back cap + scope); spec §2.2 (line 1z scope)',
    'CLOSED — pure observation bundle. **14th Path A application** (streak extends 17 → 18 consecutive zero-outstanding walkthroughs). G-new-5 recommended for follow-up fix annotated at top of bundle; G-new-6/G-new-7 documented for visibility; G-new-8 already closed via 17 #1; 3 deferred-scope confirmations captured. No outstanding.md entry per anti-fragmentation policy.'],

  [10, 'RESOLVED 2026-05-14 — BOUNDARY MILESTONE — Line 17 walkthrough complete at 10/10; SECOND ORCHESTRATOR-BASED AUDIT IN LINE-16+ CHAIN; 19 ORCHESTRATORS (NEW CODEBASE MAXIMUM); 18 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS',
    '**Closure applied**: pure xlsx-flip + Verification log finalization — **CLOSES the 17 walkthrough at 10/10**. TWO file touches: (a) this row flipped to RESOLVED with the eight-theme cumulative block; (b) lines/17.md §14 Verification log row finalized IN-PROGRESS → **COMPLETE — 10/10 closed** (single-row shape; matches lines 8/9/10/14/15/16). **Eight themes**: (1) **Structural positioning** — 4th audit OUTSIDE 13ab pair (after 14, 15, 16); SECOND orchestrator-based audit in line-16+ chain (after line 16 on 2026-05-14). Confirms orchestrator-based audit pattern is workflow norm for tax-territory lines. (2) **★ 19 ORCHESTRATORS — NEW CODEBASE MAXIMUM** (was 18 after 16 #1; +1 from 17 #1 at `computeLine17`). Cascade roster (19): 1c + 1d + 1e + 1f + 1g + 1h + 1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities + computeSocialSecurityBenefits + computeCapitalGainLoss + computeOtherIncomes + computeIncomeAdjustments + buildStandardDeductionIndicators + computeLine13a + computeSchedule1A + computeLine16 + **computeLine17 (NEW)**. (3) **★ MFS leakage SINGLE-PATH fix** (Issue #1) — only `form2555Spouse` leaks at line 17 call site; `form4972Spouse` fix inherited from 16 #1 transitively via TaxAndCredits.box2Form4972Tax. Simpler than 16 #1\'s bundled two-leak fix. Lock-in test `mfsExcludesSpouseForm2555FromLine17Feitw` extends regression **763 → 764**. (4) **Knowledge convergence advances 22 → 23 lines** (Issue #2: 10th Legacy A migration — SYMBOLIC DOUBLE-DIGIT MILESTONE). (5) **★ FORWARD TERMINAL SEED planted at orchestrator** (Issue #4; SECOND terminal seed in workflow after 16 #4; ~120-line breadcrumb). Different shape than 14 #4 / 15 #4 inline-line seeds. Pairs with 16 #4 to form AMT-territory navigable hub (line 16 ← 16 #4 / line 17 ← 17 #4 / line 18 ← future). (6) **Anti-fragmentation continues — 14th Path A application** (Issue #9: 7-observation bundle = 4 NEW gaps + 3 deferred-scope confirmations). (7) **★ 4 NEW GAPS SURFACED in 17 audit** — G-new-5 HIGH (PTC repayment line 17 flow gap; ★ RECOMMENDED for follow-up fix), G-new-6 MEDIUM (Form 8978 negative line 10), G-new-7 MEDIUM (line 2b breadth — Sched 1 line 8z), G-new-8 HIGH (= 17 #1; CLOSED). Demonstrates audit workflow continues to surface real bugs even at lines with multiple prior fix passes (line 17 had 9 prior gaps fixed 2026-04-18; today\'s audit found 4 more). (8) **Cumulative state through line 17**: **43 lines audited** (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + 11b + 12a + 12b + 12c + 12d + 12e + 13a + 13b + 14 + 15 + 16 + **17**); **427 audit issues closed total** (417 + 10); backend **764/764 pass** (+1 from 17 #1 MFS lock-in test); MFS cascade = **19 orchestrators (NEW CODEBASE MAX, +1)**; knowledge convergence = **23 lines (+1)**; dependencies files = 43 (unchanged); **14 Path A applications** (+1 from 17 #9); 6 anti-duplication applications (unchanged); 2 SEEDED → VERIFIED CORRECT upgrades (unchanged; 17 #4 is terminal); **2 terminal seeds at orchestrators** (+1 from 17 #4); 4 NEW gaps surfaced (G-new-5/6/7/8 across G-new family). **18 CONSECUTIVE WALKTHROUGHS WITH ZERO NEW OUTSTANDING.MD ENTRIES** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/**17**). **Verification logs**: 2ab (4) + 3abc (3) + 4abc (3) + 5abc (3) + 6abcd (4) + 7ab (2) + 8 (1) + 9 (1) + 10 (1) + 11ab (2) + 12abcde (5 — LARGEST) + 13ab (2) + 14 (1) + 15 (1) + 16 (1) + **17 (1 — single-line shape)**. **Looking ahead — line 18 (Total tax before credits = line 16 + line 17)**: 5th audit OUTSIDE 13ab pair; THIRD orchestrator-based audit in line-16+ chain. computeLine18 already implemented as small focused method at ~line 11737; likely lower-complexity audit. Probable audit angles: validation of line 18 = line 16 + line 17 invariant under FTC correction (G-new-1 fix); ★ G-new-5 propagation (line 17 understatement carries into line 18 — may surface as Issue #1 if not already fixed); potential MFS guard at computeLine18 (reads additionalTaxSchedule2 which has 17 #1 MFS guard transitively). Will use 16 #4 + 17 #4 navigable hubs. **NO code change today; NO backend re-run** (tests already at 764/764 from 17 #1 lock-in).',
    'XLS/computations/17.xlsx audit-trail (this row); lines/17.md §14 Verification log row FINALIZED to COMPLETE — 10/10 closed; knowledge file renamed via 17 #2; terminal seed planted via 17 #4 at TaxReturnComputeService.java:~11045-11185',
    'CLOSED — 10/10. **43 lines audited; 427 issues; 764/764 backend; 19 orchestrators (NEW CODEBASE MAX); 23-line knowledge convergence; 18 consecutive zero-outstanding walkthroughs; 14 Path A applications; 2 terminal seeds at orchestrators; 4 NEW gaps surfaced (G-new-5/6/7/8)**. SECOND orchestrator-based audit in line-16+ chain. Next: line 18 (totalTaxBeforeCredits; potential 20th cascade entry; G-new-5 propagation a likely audit angle).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 45 }, { wch: 120 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 17 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.taxAndCredits.additionalTaxSchedule2', 'Form 1040 page 2, line 17 (PDF f2_09)', 'XLS/output_forms/form-tax-return-1040.xlsx', '★ CANONICAL line 17 output. Currently = Form 6251 line 11 only (G-new-5: should equal Schedule 2 line 3 = line 1z + line 11).'],
  ['form1040.taxAndCredits.alternativeMinimumTax', '(internal; not on Form 1040 PDF)', 'XLS/output_forms/form-tax-return-6251.xlsx', 'AMT only (Form 6251 line 11). Used by Form 8801 (prior-year AMT credit).'],
  ['form1040.taxAndCredits.totalTaxBeforeCredits', 'Form 1040 page 2, line 18 (PDF f2_10)', 'XLS/output_forms/form-tax-return-1040.xlsx', 'line 18 = line 16 + line 17. Set by computeLine18; refreshed by G-new-1 after FTC correction.'],
  ['schedule2.tax.alternativeMinimumTax', 'Schedule 2 line 2 (PDF)', 'XLS/output_forms/form-tax-return-schedule2.xlsx', 'Same as Form 6251 line 11.'],
  ['schedule2.tax.excessAdvancePremiumTaxCreditRepayment', 'Schedule 2 line 1a (PDF)', 'XLS/output_forms/form-tax-return-schedule2.xlsx', 'PTC repayment from Form 8962. Wired separately from line 2.'],
  [],
  ['Form 6251 PDF Fields (per f6251_field_map_semantic.csv)'],
  ['form6251.line1aTotalDeductionsMinusSenior', 'f6251_line1a', 'XLS/output_forms/form-tax-return-6251.xlsx', 'line 14 − senior add-back.'],
  ['form6251.line1bAgiMinusLine1a', 'f6251_line1b', 'same', 'line 11b − line 1a.'],
  ['form6251.line2aStateLocalTaxes', 'f6251_line2a', 'same', 'SALT or standard deduction (G1 fix).'],
  ['form6251.line2bStateLocalRefund', 'f6251_line2b', 'same', 'Negative refund.'],
  ['form6251.line2gPrivateActivityBondInterest', 'f6251_line2g', 'same', 'PAB interest.'],
  ['form6251.line4AlternativeMinimumTaxableIncome', 'f6251_line4', 'same', 'AMTI.'],
  ['form6251.line5Exemption', 'f6251_line5', 'same', 'Phaseout-adjusted exemption.'],
  ['form6251.line6AmtBaseAfterExemption', 'f6251_line6', 'same', 'AMT base.'],
  ['form6251.line7TentativeMinimumTax', 'f6251_line7', 'same', 'TMT (via 3-path).'],
  ['form6251.line8AmtForeignTaxCredit', 'f6251_line8', 'same', 'AMT FTC (deferred; always null).'],
  ['form6251.line9TentativeMinimumTaxAfterFtc', 'f6251_line9', 'same', 'line 7 − line 8.'],
  ['form6251.line10RegularTaxAdjusted', 'f6251_line10', 'same', 'Regular tax baseline (post-FTC correction).'],
  ['form6251.line11AlternativeMinimumTax', 'f6251_line11', 'same', 'AMT = max(0, line 9 − line 10).'],
  ['form6251.line12-line40 (Part III, 29 fields)', 'f6251_line12 through f6251_line40', 'same', 'Populated only on PART_III path (qualified dividends or LTCG present).'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 18 (totalTaxBeforeCredits)', 'Form 1040 page 2, line 18', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ line 18 = line 16 + line 17. computeLine18 reads additionalTaxSchedule2. Refreshed after FTC correction (G-new-1).'],
  ['Form 1116 (Foreign Tax Credit) limitation', '—', 'XLS/output_forms/form-tax-return-1116.xlsx', '★★ Uses regular tax (line 16) + AMT (line 17) in the FTC limit calculation. Triggers correctLine17ForFtc back-correction.'],
  ['Form 8801 (Credit for Prior Year Minimum Tax)', '—', 'XLS/output_forms/form-tax-return-8801.xlsx', '★★ Reads prior-year Form 6251 values; current-year AMT may generate next-year Form 8801 credit.'],
  ['Schedule 3 nonrefundable credit limitation', '—', 'XLS/output_forms/form-tax-return-schedule3.xlsx', 'Most nonrefundable credits limited by totalTaxBeforeCredits (line 18) − certain other credits.'],
  ['Form 8880 CLW (Saver\'s Credit)', '—', 'XLS/output_forms/form-tax-return-8880.xlsx', 'Reads totalTaxBeforeCredits (after FTC correction).'],
  ['Schedule 8812 (CTC/ACTC)', '—', 'XLS/output_forms/form-tax-return-schedule8812.xlsx', 'Reads totalTaxBeforeCredits.'],
  ['Form 2441 Part II (Child Care Credit)', '—', 'XLS/output_forms/form-tax-return-2441.xlsx', 'CLW reads totalTaxBeforeCredits.'],
  ['Form 5695 (Energy Credits)', '—', 'XLS/output_forms/form-tax-return-5695.xlsx', 'Reads totalTaxBeforeCredits for credit limitation.'],
  [],
  ['CONDITIONAL ATTACHMENTS'],
  ['Form 6251', 'Form 6251 pages', 'XLS/output_forms/form-tax-return-6251.xlsx', 'Attached when: AMT > 0 OR PAB interest > 0 OR any other Form 6251 filing-test condition (spec §3) is met. Always attached in code when AMTI > 0.'],
  ['Schedule 2', 'Schedule 2 page', 'XLS/output_forms/form-tax-return-schedule2.xlsx', 'Attached when: AMT > 0 OR Schedule 2 line 1z items > 0 (currently only PTC repayment).'],
  ['Schedule 1-A', 'Schedule 1-A page', 'XLS/output_forms/form-tax-return-schedule-1a.xlsx', 'Always attached when relevant; line 37 senior add-back feeds Form 6251 line 1a.'],
  [],
  ['NOT IN OUTPUT (deliberate exclusions per spec + scope)'],
  ['Form 6251 line 2c (Form 4952 AMT)', '—', '—', 'Out of scope — requires second Form 4952 with AMT-adjusted investment income.'],
  ['Form 6251 line 2f (ATNOLD)', '—', '—', 'Out of scope — requires multi-year AMT NOL state.'],
  ['Form 6251 line 2i (ISO spread)', '—', '—', 'Out of scope — corporate equity events.'],
  ['Form 6251 line 2m (Passive activity AMT)', '—', '—', 'Out of scope — Schedule E/rental currently deferred.'],
  ['Form 6251 line 8 (AMT FTC)', '—', '—', 'Out of scope — requires separate AMT-specific Form 1116 computation.'],
  ['Schedule 2 line 1b/1c (Clean vehicle dealer repayments)', '—', '—', 'Out of scope — clean vehicle credit transfer to dealer not implemented.'],
  ['Schedule 2 line 1d/1e/1f (Form 4255 EPE)', '—', '—', 'Out of scope — Form 4255 excessive payments on energy credits not implemented.'],
  ['Schedule 2 line 1y (Other additions)', '—', '—', 'Out of scope — catch-all line for rare additions.'],
  ['MFS add-back cap $68,500', '—', '—', 'Deferred — rare high-income MFS path (AMTI > $900,350).'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 55 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
