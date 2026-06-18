// ============================================================================
//  Generates: C:\us-tax\XLS\computations\19.xlsx
//
//  Source-of-truth references:
//    - lines/19.md (2025-tax-year spec; sections 1-11; 356 lines; defines CTC/ODC
//      formula via Schedule 8812; documents Part I + Part II-A + Part II-B + CLW-A
//      + CLW-B + Form 8862 gate + 2025 SSN/ITIN rule + 11 deferred items.
//      ⚠️ INTERNAL CONTRADICTION: §2 cites $2,000 CTC (STALE); §4c cites $2,200 (CORRECT).
//      ⚠️ Documentation drift: §2 formula `line5 = line4 * 2000` is STALE; should be 2200.)
//    - dependencies/19.md (126 lines; 27-row Direct Inputs table; correctly cites
//      $2,200 in §7 constants table; 6 documented gaps G1-G6 with current status)
//    - knowledge/line-19-child-tax-credit.md (renamed from knowledge_line19.md
//      via 19 #2 2026-05-14; 12th Legacy A migration; 342 lines covering: line
//      identity, 2025 constants, backend implementation (full algorithm walk-
//      through), output model, frontend, compute order, 7 downstream consumers,
//      ≥18 unit tests + 9 E2E tests inventory, IRS 2025 verification, 6 identified
//      gaps G1-G6 all resolved/deferred 2026-04-18, 6 out-of-scope items)
//    - TaxReturnComputeService.java:
//        line 1342 — call site (passes form2555Taxpayer + form2555Spouse unguarded)
//        line 22430-22810 — `computeSchedule8812` method (~380 lines; full Part I +
//          II-A + II-B + electsNoActc opt-out + Form 8862 gate + G7 SSN check)
//        line 22477-22484 — form2555Spouse line 2b MAGI inflation (LEAK POINT 1)
//        line 22595 — form2555Spouse hasFiling2555 ACTC trigger (LEAK POINT 2)
//    - Schedule8812.java (output model; 29 fields across Part I + II-A + II-B)
//    - Dependent.java + DependentRecord (qualifiesForCTC/qualifiesForODC predicates)
//    - IRS 2025 Form 1040 (line 19 + line 28)
//    - IRS 2025 Schedule 8812 (Form 1040)
//    - IRS 2025 Instructions for Schedule 8812
//    - Rev. Proc. 2024-40 §3.08 (CTC $2,200 + ACTC $1,700 for 2025)
//    - OBBBA (One Big Beautiful Bill Act — CTC increased to $2,200; ACTC to $1,700)
//    - docs/books/i1040gi_2025.txt + J.K. Lasser's Your Income Tax 2025
//
//  Tax year: 2025
//
//  Concept:
//    Form1040.line19 = Schedule8812.line14   (nonrefundable CTC + ODC)
//    Form1040.line28 = Schedule8812.line27   (refundable ACTC)
//
//    Both produced by SINGLE computeSchedule8812() call. Heavy compute orchestrator:
//      Part I (lines 1-14): MAGI computation + dependent counting + tentative credit
//        + phase-out + CLW-A + line 14 nonrefundable CTC+ODC
//      Part II-A (lines 15-20): ACTC eligibility + line 16a/b excess + earned-income
//        worksheet + 15% floor calculation
//      Part II-B (lines 21-27): 3+ children path + Social Security withholding +
//        Schedule 1 line 15 + Schedule 2 lines 5/6/13 + line 27a EIC + Schedule 3
//        line 11 routing
//
//    Plus electsNoActc opt-out (G4 design decision; no IRS basis) + Form 8862 gate
//    (when CTC previously denied) + 2025 SSN/ITIN rule enforcement (G7 fix).
//
//  Line 19 audit positioning (6th audit OUTSIDE 13ab pair):
//   • ★ FIRST audit OUTSIDE the tax-territory chain (lines 16/17/18 — all tax-side;
//     line 19 is FIRST credits-section line)
//   • Orchestrator-based audit at computeSchedule8812 — heavy compute
//   • Cumulative position: 45th line
//   • Uses 16 #4 + 17 #4 navigable hubs (tax-territory) — line 19 establishes
//     the credits-territory chain
//   • ⚠️ HIGH-PRIORITY MFS DEFENSIVE GAP — form2555Spouse leaks at TWO points
//     internally (single null-shadow fix; 20th orchestrator NEW CODEBASE MAX)
//   • ⚠️ DOCUMENTATION DRIFT in spec §2 — stale $2,000 CTC constant
//
//  Line 19 audit angles (10 issues):
//   1. ⚠️ HIGH-PRIORITY MFS DEFENSIVE GAP — computeSchedule8812 call site at
//       prepare() line 1342 needs `isMfsReturn ? null : form2555Spouse` guard.
//       Without it, stale spouse Form 2555 causes TWO leaks: (a) line 2b inflates
//       MAGI → under-states CTC line 14 via phase-out; (b) hasFiling2555 = true →
//       blocks ACTC line 27 unnecessarily. Direction: TAXPAYER SELF-HARM.
//       Extends MFS-guard cascade to 20 orchestrators — NEW CODEBASE MAXIMUM
//       (per line 18 #10 look-ahead).
//   2. DOCUMENTATION HYGIENE — Knowledge file Legacy A rename
//       (knowledge_line19.md → line-19-child-tax-credit.md); 12th Legacy A
//       migration; convergence 24 → 25 lines.
//   3. SPEC ENHANCEMENT — Verification log section §12 in lines/19.md
//       (single-row pattern; smallest log shape).
//   4. ★ DOCUMENTATION DRIFT FIX — lines/19.md §2 cites STALE $2,000 CTC + formula
//       `line5 = line4 * 2000`. Correct 2025 value is $2,200 per OBBBA + Rev. Proc.
//       2024-40 §3.08. §4c already correctly cites $2,200 — INTERNAL CONTRADICTION.
//       7th documentation drift fix in workflow.
//   5. VERIFIED CORRECT — Part I (lines 1-14: MAGI + dependent counting + tentative
//       credit + phase-out + CLW-A + line 14 nonrefundable CTC+ODC). 2025
//       constants confirmed: $2,200 CTC + $500 ODC + $400k/$200k phase-out
//       thresholds + $50/$1k phase-out rate. G5 fix locked in (line 10 raw excess).
//   6. VERIFIED CORRECT — Part II-A (lines 15-20: ACTC eligibility + line 16a/b
//       + earned-income worksheet + 15% floor). 2025 constants: $1,700 ACTC max +
//       $2,500 floor + 15% rate. Earned-income includes nontaxableCombatPayElection
//       per spec §6 (line 18a). electsNoActc opt-out (G4 design decision; no IRS
//       basis — kept as conservative opt-out per 2026-04-18 review).
//   7. VERIFIED CORRECT — Part II-B (lines 21-27: 3+ children path + SS withholding
//       + Schedule 1/2 additions + line 27a EIC + Schedule 3 line 11 routing).
//       G1 fix locked in 2026-04-18 (Form 8863 + EIC pre-set before
//       computeSchedule8812 so line 24 sees correct values).
//   8. VERIFIED CORRECT — Wiring + Form 8862 gate + G7 SSN/ITIN rule + electsNoActc
//       opt-out. Form 8862 gate: ctcPreviouslyDenied=true requires Form 8862 with
//       ctcEligible=true to proceed.
//   9. ⚠️ BUNDLED OBSERVATIONS — 3 observations: (a) G6 CLW-A missing Schedule 3
//       lines 5b/6f/6/6m (deferred; awaits Form 8396/5695-Part-I/8859 impl);
//       (b) Puerto Rico exclusion line 2a + Form 4563 line 2c deferred;
//       (c) Earned income worksheet edge cases (SE optional methods + treaty
//       exclusions) deferred. 16th Path A application.
//  10. BOUNDARY MILESTONE — first audit OUTSIDE tax-territory chain; 20 orchestrators
//       (NEW CODEBASE MAX); 45 lines / 447 issues / backend 764 → 765 (+1 MFS
//       lock-in); 20 consecutive zero-outstanding walkthroughs; first credits-
//       section audit (begins credits-territory chain).
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '19.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 19 — CHILD TAX CREDIT + CREDIT FOR OTHER DEPENDENTS (Schedule 8812 line 14) — 2025'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 19 (page 2; nonrefundable CTC + ODC); paired with line 28 (refundable ACTC = Schedule 8812 line 27)'],
  ['Concept',
    'Line 19 is the NONREFUNDABLE Child Tax Credit + Credit for Other Dependents from Schedule 8812. ' +
    'A SEPARATE refundable Additional Child Tax Credit (ACTC) flows to line 28 from Schedule 8812 line 27. ' +
    'Both produced by SINGLE `computeSchedule8812` orchestrator. **★ FIRST audit OUTSIDE the tax-territory ' +
    'chain** (lines 16/17/18); begins the credits-territory chain.'],
  ['Top-level formula (spec §1 + §2)',
    'Form1040.line19 = Schedule8812.line14                  (nonrefundable CTC + ODC)\n' +
    'Form1040.line28 = Schedule8812.line27                  (refundable ACTC)'],
  ['Schedule 8812 Part I — Lines 1-14 (spec §4)',
    'line1   = Form1040.line11b (AGI)\n' +
    'line2b  = Form2555.line45+50 exclusions (taxpayer + spouse[null-shadowed on MFS by 19 #1])\n' +
    'line3   = MAGI = line1 + line2b (+ Puerto Rico + Form 4563 if applicable; both deferred)\n' +
    'line4   = count of dependents with qualifiesForCTC()\n' +
    'line5   = line4 × $2,200                              ★ 2025 CONSTANT (OBBBA; increased from $2,000)\n' +
    'line6   = count of dependents with qualifiesForODC()\n' +
    'line7   = line6 × $500                                (unchanged)\n' +
    'line8   = line5 + line7                                (tentative total credit)\n' +
    'line9   = $400,000 (MFJ) or $200,000 (all others)     ★ 2025 PHASE-OUT THRESHOLD\n' +
    'line10  = max(0, line3 − line9) raw excess (G5 fix 2026-04-18)\n' +
    'line11  = ceil(line10 / $1,000) × $50                 (★ $50/$1k phase-out rate)\n' +
    'line12  = max(0, line8 − line11)                       (credit after phase-out)\n' +
    'line13  = Credit Limit Worksheet A result              (CLW-A; line 18 − prior credits)\n' +
    'line14  = min(line12, line13)                          ★ Form 1040 line 19 output'],
  ['Schedule 8812 Part II-A — Lines 15-20 (spec §6; ACTC for all filers)',
    'PRECONDITIONS — line 27 = 0 if any: line4 = 0; Form 2555 filed; G7 SSN rule fails; electsNoActc=true.\n' +
    'line15  = RESERVED (not an opt-out checkbox per spec §6a)\n' +
    'line16a = max(0, line12 − line14)                      (excess credit over tax)\n' +
    'line16b = line4 × $1,700                               ★ 2025 ACTC CEILING (OBBBA; increased from $1,600)\n' +
    'line17  = min(line16a, line16b)                        (ACTC potential)\n' +
    'line18a = earned income (line 1z + nontaxableCombatPayElection if elected)\n' +
    'line18b = nontaxable combat pay (separate field; tracked inside line 18a in current scope)\n' +
    'line19  = if line18a ≤ $2,500: 0; else line18a − $2,500   ★ $2,500 EARNED-INCOME FLOOR\n' +
    'line20  = line19 × 15%                                 ★ 15% ACTC RATE'],
  ['Schedule 8812 Part II-B — Lines 21-27 (spec §7; 3+ children OR Puerto Rico routing)',
    'ROUTING:\n' +
    '  if line16b < $5,100 (= 3 × $1,700):     line27 = min(line17, line20)   (fewer than 3 children)\n' +
    '  if Puerto Rico bona fide resident:      go to line 21 (deferred — out of scope)\n' +
    '  if line20 ≥ line17:                      line27 = line17                (earned-income covers it)\n' +
    '  else:                                    Part II-B path:\n' +
    '\n' +
    'Part II-B path (3+ children; earned-income method insufficient):\n' +
    '  line21 = sum of W-2 box 4 socialSecurityTaxWithheldAmount\n' +
    '  line22 = Schedule 1 line 15 + Schedule 2 lines 5/6/13\n' +
    '  line23 = line21 + line22\n' +
    '  line24 = Form 1040 line 27a (EIC) + Schedule 3 line 11 (G1 fix 2026-04-18: pre-set before Sched 8812)\n' +
    '  line25 = max(0, line23 − line24)\n' +
    '  line26 = max(line20, line25)\n' +
    '  line27 = min(line17, line26)                          ★ Form 1040 line 28 output'],
  ['Output target',
    'Primary: form1040.taxAndCredits.childTaxCredit (BigDecimal; line 19 output)\n' +
    '         form1040.payments.additionalChildTaxCredit (BigDecimal; line 28 output; null when 0)\n' +
    'Schedule 8812: schedule8812.* — 29 fields across Part I + II-A + II-B + electsNoActc\n' +
    'Per-dependent: dependent.childTaxCreditEligible + dependent.otherDependentCreditEligible (PDF checkboxes)'],
  ['Backend implementation',
    '**HEAVY COMPUTE ORCHESTRATOR** — `computeSchedule8812` at TaxReturnComputeService.java:22430-22810 ' +
    '(~380 lines; full Part I + II-A + II-B + electsNoActc opt-out + Form 8862 gate + G7 SSN check). ' +
    'Call site at prepare() line 1342. **★ FIRST audit OUTSIDE tax-territory chain** (lines 16/17/18). ' +
    'Begins credits-territory chain. Will use 16 #4 + 17 #4 navigable hubs.'],
  ['IRS source',
    'IRS 2025 Form 1040 (page 2 lines 19 + 28) + IRS 2025 Schedule 8812 (Form 1040) + 2025 Instructions for ' +
    'Schedule 8812 + Rev. Proc. 2024-40 §3.08 (2025 constants — CTC $2,200 + ACTC $1,700) + OBBBA (One Big ' +
    'Beautiful Bill Act — CTC permanent at $2,200; ACTC at $1,700). Local cross-checks: docs/books/i1040gi_2025.txt + ' +
    'J.K. Lasser\'s Your Income Tax 2025.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Form 8862 gate check', 'If ctcScreening.ctcPreviouslyDenied=true AND (form8862 == null OR form8862.claimsCTC != true) → emit FORM_8862_CTC_REQUIRED flag + return zero result. Per `computeSchedule8812` lines 22444-22457.'],
  [2, 'Compute MAGI (Part I lines 1-3)', 'agi = form1040.line11b; line2b = Form 2555 exclusions (taxpayer + spouse[null-shadowed on MFS by 19 #1]); magi = agi + line2b. ⚠️ G-new on this audit: form2555Spouse line 2b inflates MAGI on MFS without guard. Per lines 22462-22487.'],
  [3, 'Count CTC + ODC dependents (Part I lines 4 + 6)', 'Iterate dependents list; qualifiesForCTC()/qualifiesForODC() predicates. Mutual exclusion. Per lines 22489-22502.'],
  [4, 'Compute tentative credit (lines 5 + 7 + 8)', 'line5 = numCtcChildren × $2,200 (★ 2025; per Rev. Proc. 2024-40 §3.08); line7 = numOdcDependents × $500; line8 = line5 + line7. Per lines 22506-22511.'],
  [5, 'Apply phase-out (lines 9-12)', 'threshold = $400k MFJ / $200k others; excess = max(0, magi − threshold); line10 = raw excess (G5 fix); line11 = $50 × ceil(excess/$1k); line12 = max(0, line8 − line11). Per lines 22515-22560.'],
  [6, 'Compute Credit Limit Worksheet A (line 13)', 'wA1 = totalTaxBeforeCredits (line 18); wA3 = FTC + childcare + education + saver\'s + elderly/disabled; worksheetA = max(0, wA1 − wA3). ⚠️ G6 deferred: lines 5b/6f/6/6m awaiting Form 8396/5695-Part-I/8859 impl. Per lines 22562-22582.'],
  [7, 'Compute line 14 (nonrefundable CTC + ODC)', 'line14 = min(line12, worksheetA). Output: setLine14CtcOdcCredit + wire to TaxAndCredits.childTaxCredit (= Form 1040 line 19). Per line 22584-22587.'],
  [8, 'electsNoActc gate (G4 design decision)', 'If ctcScreening.electsNoActc=true → set line27 = 0 + return. No IRS basis but kept as conservative opt-out per 2026-04-18 review. Per lines 22589-22592.'],
  [9, 'Part II-A preconditions', 'line27 = 0 if numCtcChildren = 0 OR hasFiling2555 (★ form2555Spouse leak point 2 — fixed via 19 #1 MFS guard at call site). G7 SSN rule: ACTC requires valid SSN (ITINs start with "9"). Per lines 22594-22605.'],
  [10, 'Compute Part II-A lines 16-20', 'line16a = max(0, line12 − line14); line16b = numCtcChildren × $1,700 (★ 2025; OBBBA); line17 = min(line16a, line16b); line18a = totalWages + nontaxableCombatPayElection; line19/20 = $2,500 floor + 15% rate. Per lines 22607-22660.'],
  [11, 'Part II-A routing', 'if line16b < $5,100: line27 = min(line17, line20) — fewer than 3 children case. else if line20 >= line17: line27 = line17. else: Part II-B path. Per lines 22662-22700.'],
  [12, 'Part II-B (3+ children path)', 'line21 = W-2 box 4 sum; line22 = Schedule 1/2 additions; line23 = line21 + line22; line24 = EIC + AOTC (G1 fix); line25/26/27 = SS-withholding alternative ACTC base. Per lines 22702-22770.'],
  [13, 'Wire outputs', 'taxAndCredits.setChildTaxCredit(line14) → Form 1040 line 19. payments.setAdditionalChildTaxCredit(line27) → Form 1040 line 28 (null when 0). Per lines 1345-1356 (prepare wiring).'],
  [14, 'Per-dependent PDF checkbox flags', 'dependent.childTaxCreditEligible / .otherDependentCreditEligible set from qualifiesForCTC/qualifiesForODC. Used by Form 1040 PDF export.'],
  [],
  ['INVARIANTS / VALIDATIONS (spec §9)'],
  ['Invariant', 'Rationale'],
  ['line14 ≥ 0 AND line14 ≤ line12 AND line14 ≤ line13', 'Per spec §9. STRUCTURALLY enforced by max(0, ...) + min(...) operations.'],
  ['line27 ≥ 0 AND line27 ≤ numCtcChildren × $1,700', 'Per spec §9. line17 = min(line16a, line16b = numCtcChildren × $1,700) caps the value.'],
  ['line27 = 0 if numCtcChildren = 0', 'STRUCTURALLY enforced at Part II-A preconditions.'],
  ['line27 = 0 if Form 2555 filed', '★ STRUCTURALLY enforced at Part II-A preconditions. ⚠️ Pre-19 #1: form2555Spouse caused false-positive ACTC blocking on MFS.'],
  ['line27 = 0 if 2025 CTC/ACTC SSN rule fails', 'G7 fix: ITIN check on taxpayer (single/MFS/HOH/QSS) or "at least one valid SSN" check on MFJ.'],
  ['A dependent cannot be checked for both CTC and ODC', 'STRUCTURALLY enforced by mutual-exclusion if-else in counting loop.'],
  ['CTC/ACTC SSN rule: child must have valid SSN issued by due date', 'Delegated to dependent intake flags (qualifiesForCTC predicate).'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 40 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 19 / Line 28'],
  ['Line 19 / Line 28 takes 30+ inputs across 12 source forms + 5 computed forms + 3 reference fields. Heavy-compute orchestrator.'],
  [],
  ['#', 'Source', 'Field', 'Type', 'Role', 'XLS input/output form reference'],
  [1, 'computed Form 1040 (line 11b AGI)', 'adjustments.line11bAmountFromLine11aAdjustedGrossIncome', 'BigDecimal', 'Schedule 8812 line 1; MAGI starting point.', '(internal — line 11ab audit)'],
  [2, 'computed Form 1040 (line 18 tax before credits)', 'taxAndCredits.totalTaxBeforeCredits', 'BigDecimal', 'CLW-A line 1; nonrefundable cap.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 18; per 18 #5 breadcrumb)'],
  [3, 'computed Income (line 1z + 1i combat pay)', 'income.totalWages + income.nontaxableCombatPayElection', 'BigDecimal × 2', 'Schedule 8812 line 18a (earned income for ACTC).', '(internal — line 1z + 1i audits)'],
  [4, 'computed Form 2555 (taxpayer)', 'foreignEarnedIncomeExclusion + housingExclusionAmount', 'BigDecimal × 2', 'Schedule 8812 line 2b inflation; blocks ACTC (line 27 = 0).', 'XLS/input_forms/form-foreign-earned-income.xlsx'],
  [5, 'computed Form 2555 (spouse)', 'same fields', 'BigDecimal × 2', '⚠️ MFS LEAK — TWO leak points: (a) line 2b MAGI inflation → under-states CTC; (b) hasFiling2555 → blocks ACTC. See 19 #1.', 'same'],
  [6, 'filing-status form', 'filingStatus', 'String', 'Drives line 9 threshold ($400k MFJ / $200k others). ★ QSS uses $200k NOT $400k.', 'XLS/input_forms/form-filing-status.xlsx'],
  [7, 'dependents list (per-dependent)', 'DependentRecord.qualifiesForCTC() / .qualifiesForODC()', 'Boolean predicates × N', 'Schedule 8812 line 4 (CTC count) + line 6 (ODC count). Mutually exclusive. Delegated to intake form for 2025 SSN/ITIN rule enforcement.', 'XLS/input_forms/form-dependents.xlsx + form-dependent.xlsx'],
  [8, 'computed Schedule 3 line 1 (FTC)', 'nonrefundableCredits.foreignTaxCredit', 'BigDecimal', 'CLW-A line 2 prior-credit subtraction.', 'XLS/output_forms/form-tax-return-schedule3.xlsx'],
  [9, 'computed Schedule 3 line 2 (childcare)', 'nonrefundableCredits.childDependentCareCredit', 'BigDecimal', 'CLW-A prior-credit subtraction.', 'same'],
  [10, 'computed Schedule 3 line 3 (education)', 'nonrefundableCredits.educationCredits', 'BigDecimal', 'CLW-A prior-credit subtraction.', 'same'],
  [11, 'computed Schedule 3 line 4 (saver\'s credit)', 'nonrefundableCredits.retirementSavingsContributionsCredit', 'BigDecimal', 'CLW-A prior-credit subtraction.', 'same'],
  [12, 'computed Schedule 3 (elderly/disabled — future)', 'nonrefundableCredits.elderlyDisabledCredit', 'BigDecimal', 'CLW-A prior-credit subtraction.', 'same'],
  [13, 'ctc-actc-screening-taxpayer form', 'electsNoActc', 'Boolean', 'electsNoActc opt-out (G4 design decision; no IRS basis but kept as conservative opt-out).', 'XLS/input_forms/form-ctc-actc-screening.xlsx'],
  [14, 'ctc-actc-screening-taxpayer form', 'ctcPreviouslyDenied', 'Boolean', 'Form 8862 gate trigger.', 'same'],
  [15, 'computed Form 8862', 'form8862.claimsCTC + form8862.ctcEligible', 'Boolean × 2', 'Form 8862 recertification gate (ctcPreviouslyDenied=true requires Form 8862 with ctcEligible=true).', 'XLS/input_forms/form-form8862.xlsx'],
  [16, 'W-2 statement entries (box 4)', 'socialSecurityTaxWithheldAmount', 'BigDecimal × N', 'Part II-B line 21 (3+ children path). Summed across all W-2 entries.', 'XLS/input_forms/form-employment.xlsx + W-2 statement entries'],
  [17, 'computed Schedule 2 line 5', 'otherTaxes.uncollectedSocialSecurityMedicareTaxOnWages', 'BigDecimal', 'Part II-B line 22.', 'XLS/output_forms/form-tax-return-schedule2.xlsx'],
  [18, 'computed Schedule 2 line 6', 'otherTaxes.uncollectedSocialSecurityMedicareRrtaTax', 'BigDecimal', 'Part II-B line 22.', 'same'],
  [19, 'computed Schedule 2 line 13', 'otherTaxes.additionalMedicareTax', 'BigDecimal', 'Part II-B line 22.', 'same'],
  [20, 'computed Form 1040 (line 27a EIC; PRE-SET)', 'payments.earnedIncomeCredit', 'BigDecimal', 'Part II-B line 24. G1 FIX 2026-04-18: pre-set by computeLine27aEIC() BEFORE computeSchedule8812 runs.', '(internal — line 27a audit; future)'],
  [21, 'computed Form 8863 (refundable AOTC; PRE-SET)', 'payments.americanOpportunityCredit', 'BigDecimal', 'Part II-B line 24. G1 FIX 2026-04-18: pre-set by computeForm8863() BEFORE computeSchedule8812 runs.', '(internal — Form 8863 audit)'],
  [22, 'taxpayer/spouse identification', 'you.ssn / spouse.ssn (G7 check)', 'String', '2025 SSN/ITIN rule enforcement. ITINs start with "9" after digit-strip.', 'XLS/input_forms/form-identification-taxpayer.xlsx + form-identification-spouse.xlsx'],
  [23, 'taxpayer/spouse Schedule 1 line 15', '(SE tax; deferred)', 'BigDecimal', 'Part II-B line 22. ⚠️ SE OUT OF SCOPE per knowledge §11; deferred.', '(deferred)'],
  [24, 'Schedule 3 line 11', '(out of scope)', 'BigDecimal', 'Part II-B line 24 + CLW-A. ⚠️ Deferred for current audit.', '(deferred)'],
  [25, 'Puerto Rico exclusion flag', '(out of scope)', 'BigDecimal', 'Schedule 8812 line 2a. ⚠️ PUERTO RICO OUT OF SCOPE per spec §11.', '(deferred)'],
  [26, 'Form 4563 line 15', '(out of scope)', 'BigDecimal', 'Schedule 8812 line 2c. ⚠️ Out of scope per spec §11.', '(deferred)'],
  [],
  ['⚠️ DEDICATED USER INPUT FORM EXISTS FOR LINE 19'],
  ['Line 19 has TWO dedicated user input forms in C:\\us-tax\\XLS\\input_forms\\:'],
  ['  (a) form-ctc-actc-screening.xlsx — electsNoActc + ctcPreviouslyDenied flags (G4 + Form 8862 gate)'],
  ['  (b) form-form8862.xlsx — Form 8862 recertification when CTC previously denied'],
  ['Plus dependents form (per-dependent SSN/ITIN/ATIN + age + qualifiesForCTC/qualifiesForODC predicates) drives line 4 + line 6 counts.'],
  [],
  ['⚠️ MISSING INPUTS (out-of-scope deferred items per knowledge §11)'],
  ['Field', 'Source', 'Reason missing'],
  ['Puerto Rico exclusion (Schedule 8812 line 2a)', 'form1040.puertoRicoExcludedIncomeForSchedule8812', 'Out of scope — Puerto Rico returns not supported.'],
  ['Form 4563 line 15 (Schedule 8812 line 2c)', 'form4563.line15', 'Out of scope — Form 4563 (American Samoa exclusion) not supported.'],
  ['Schedule 1 line 15 (SE tax) — Part II-B line 22', 'schedule1.line15SelfEmploymentTax', 'Out of scope — Self-employment (Schedule SE) not supported.'],
  ['Earned income worksheet (line 18a) — SE/treaty edge cases', 'IRS worksheet for line 18a', 'SE optional methods + treaty-excluded income deferred.'],
  ['Nontaxable combat pay (line 18b separate field)', 'income.line18bNontaxableCombatPay (separate field)', 'Currently tracked inside line 18a via nontaxableCombatPayElection; line 18b not stored separately.'],
  ['Worksheet B auto-computation', 'CLW-B (Form 8396/8839/5695-Part-I/8859 path)', 'Required when Form 8396/8839/5695-Part-I/8859 credits claimed; auto-computation deferred. Manual CLW-B override field exists.'],
  ['Schedule 3 lines 5b/6f/6/6m (CLW-A subtractions — G6)', '(Form 8396/5695-Part-I/8859/etc. forms)', 'G6 open — deferred by design; awaits Form 8396/5695-Part-I/8859 implementation.'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 42 }, { wch: 55 }, { wch: 22 }, { wch: 75 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 19 / Line 28 (Schedule 8812)'],
  ['Schedule 8812 uses ~8 distinct 2025 constants. ★ CTC AMOUNT INCREASED FROM $2,000 TO $2,200 PER OBBBA. ★ ACTC MAX INCREASED FROM $1,600 TO $1,700.'],
  [],
  ['Constant', 'Value (2025)', 'Statutory Basis', 'Backend identifier'],
  [],
  ['★ CTC PER QUALIFYING CHILD (2025 OBBBA increase; line 5 multiplier)'],
  ['CTC per qualifying child', '$2,200', 'IRC §24(a)(2); OBBBA; Rev. Proc. 2024-40 §3.08', '`new BigDecimal("2200")` at TaxReturnComputeService.java:22506'],
  ['⚠️ STALE in lines/19.md §2', '$2,000 (STALE)', 'Pre-OBBBA 2024 value (now incorrect for 2025)', 'See 19 #4 documentation drift fix'],
  [],
  ['ODC PER QUALIFYING DEPENDENT (unchanged)'],
  ['ODC per qualifying dependent', '$500', 'IRC §24(h)(4); unchanged for 2025', '`new BigDecimal("500")` at TaxReturnComputeService.java:22507'],
  [],
  ['★ ACTC MAXIMUM PER QUALIFYING CHILD (2025 OBBBA increase; line 16b multiplier)'],
  ['ACTC max per qualifying child', '$1,700', 'IRC §24(h)(5); OBBBA; Rev. Proc. 2024-40 §3.08', '`new BigDecimal("1700")` at TaxReturnComputeService.java (line 16b code)'],
  [],
  ['PHASE-OUT THRESHOLDS (Schedule 8812 line 9)'],
  ['Phase-out start — MFJ', '$400,000', 'IRC §24(b)(2); Rev. Proc. 2024-40 §3.08 (joint-return threshold)', '`new BigDecimal("400000")` at line 22516'],
  ['Phase-out start — all others (Single/HOH/MFS/QSS)', '$200,000', 'IRC §24(b)(2); ★ QSS uses $200k NOT $400k', '`new BigDecimal("200000")` at line 22516'],
  ['Phase-out rate', '$50 per $1,000 (or part of $1,000) over threshold', 'IRC §24(b)(1)', '`new BigDecimal("0.05")` (= $50/$1000) at line 22536'],
  ['Phase-out increment', '$1,000 (rounded up; ceil)', 'IRC §24(b)(1)', '`new BigDecimal("1000")` at lines 22529/22534'],
  [],
  ['ACTC THRESHOLDS (Schedule 8812 Part II-A)'],
  ['ACTC earned-income floor', '$2,500', 'IRC §24(d)(1)(B)(i); unchanged for 2025', '`new BigDecimal("2500")` at line 22650 (computeSchedule8812)'],
  ['ACTC rate (15%)', '0.15', 'IRC §24(d)(1)(B)(ii); unchanged for 2025', '`new BigDecimal("0.15")` at line 22654'],
  ['Part II-B trigger (line 16b ≥ $5,100)', '$5,100', '= 3 × $1,700 (computed); not a direct statute value', '`new BigDecimal("5100")` at line 22663'],
  [],
  ['Statutory anchors'],
  ['IRC §24 (Child Tax Credit statute)', '— (statute)', 'Primary CTC framework + ACTC + phase-out + earned-income floor', '—'],
  ['OBBBA (One Big Beautiful Bill Act)', 'Public Law 119-XX', 'YES — permanent $2,200 CTC + $1,700 ACTC for 2025+', '—'],
  ['Rev. Proc. 2024-40 §3.08', 'IRS Rev. Proc.', 'YES — 2025 inflation-adjusted CTC + ACTC + thresholds', '—'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 55 }, { wch: 60 }, { wch: 60 }, { wch: 65 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 19 / Line 28 Persistence + Downstream Consumers'],
  ['Schedule 8812 emits TWO Form 1040 outputs (lines 19 + 28) + 1 full Schedule 8812 model (29 fields) + per-dependent PDF checkboxes. 4 downstream consumers + 5 PDF fields.'],
  [],
  ['Output target', 'Where wired', 'Effect', 'XLS output reference'],
  ['form1040.taxAndCredits.childTaxCredit', '`prepare()` line 1348', '★ CANONICAL line 19 output. Nonrefundable CTC + ODC = Schedule 8812 line 14.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 19 cell)'],
  ['form1040.payments.additionalChildTaxCredit', '`prepare()` line 1355', '★ CANONICAL line 28 output. Refundable ACTC = Schedule 8812 line 27. Null when 0.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 28 cell)'],
  [],
  ['Schedule 8812 model fields (29 fields; Part I + II-A + II-B + electsNoActc)'],
  ['schedule8812.line3Magi', '`computeSchedule8812` line 22487', 'MAGI (line 1 + line 2b).', 'XLS/output_forms/form-tax-return-schedule8812.xlsx'],
  ['schedule8812.line4NumQualifyingChildren', 'line 22501', 'CTC dependent count.', 'same'],
  ['schedule8812.line5CtcPotential', 'line 22509', 'numCtcChildren × $2,200.', 'same'],
  ['schedule8812.line6NumOtherDependents', 'line 22502', 'ODC dependent count.', 'same'],
  ['schedule8812.line7OdcPotential', 'line 22510', 'numOdcDependents × $500.', 'same'],
  ['schedule8812.line8TotalPotential', 'line 22511', 'line 5 + line 7.', 'same'],
  ['schedule8812.line9ThresholdAmount', 'line 22517', '$400k MFJ / $200k others.', 'same'],
  ['schedule8812.line10PhaseOutExcess', 'line 22540 (G5 fix; raw excess)', 'Raw excess over threshold; G5 fix 2026-04-18 stores raw value not rounded.', 'same'],
  ['schedule8812.line11PhaseOutReduction', 'line 22541', '$50 × ceil(excess/$1k).', 'same'],
  ['schedule8812.line12CreditAfterPhaseOut', 'line 22542', 'max(0, line 8 − line 11).', 'same'],
  ['schedule8812.line13CreditLimitWorksheetA', 'line 22582', 'CLW-A result.', 'same'],
  ['schedule8812.line14CtcOdcCredit', 'line 22587', 'min(line 12, line 13) = ★ Form 1040 line 19.', 'same'],
  ['schedule8812.line16aExcessCreditOverTax', 'line 22612', 'max(0, line 12 − line 14).', 'same'],
  ['schedule8812.line16bActcCeiling', 'line 22617', 'numCtcChildren × $1,700.', 'same'],
  ['schedule8812.line17ActcPotential', 'line 22623', 'min(line 16a, line 16b).', 'same'],
  ['schedule8812.line18aEarnedIncome', 'line 22647', 'Earned income (line 1z + combat pay if elected).', 'same'],
  ['schedule8812.line19EarnedIncomeOverFloor', 'line 22655', 'max(0, line 18a − $2,500).', 'same'],
  ['schedule8812.line20EarnedIncomeActc', 'line 22656', 'line 19 × 15%.', 'same'],
  ['schedule8812.line21WithheldPayrollTaxes', 'line 22710 (Part II-B path)', 'Sum of W-2 box 4.', 'same'],
  ['schedule8812.line22OtherTaxes', 'line 22730', 'Schedule 1 line 15 + Schedule 2 lines 5/6/13.', 'same'],
  ['schedule8812.line23TaxesTotal', 'line 22735', 'line 21 + line 22.', 'same'],
  ['schedule8812.line24RefundableCredits', 'line 22745 (G1 fix)', 'line 27a EIC + refundable AOTC (PRE-SET before computeSchedule8812).', 'same'],
  ['schedule8812.line25ExcessPayroll', 'line 22755', 'max(0, line 23 − line 24).', 'same'],
  ['schedule8812.line26AlternativeActcBase', 'line 22760', 'max(line 20, line 25).', 'same'],
  ['schedule8812.line27ActcCredit', 'line 22765', 'min(line 17, line 26) = ★ Form 1040 line 28.', 'same'],
  ['schedule8812.electsNoActc', 'line 22591 (G4 design decision)', 'true/false; opt-out flag (no IRS basis; kept as conservative opt-out).', 'same'],
  [],
  ['Per-dependent outputs (PDF checkboxes)'],
  ['dependent.childTaxCreditEligible', '`buildDependents()` (separate)', 'true when qualifiesForCTC(); PDF Form 1040 page 1 dependent checkbox.', 'XLS/output_forms/form-tax-return-1040.xlsx (Per-dependent CTC checkbox)'],
  ['dependent.otherDependentCreditEligible', '`buildDependents()` (separate)', 'true when qualifiesForODC(); PDF Form 1040 page 1 dependent checkbox.', 'same'],
  [],
  ['PRIMARY DOWNSTREAM (★★) — 4 consumers per dependencies §6'],
  ['Form 1040 line 21 (total credits)', '`computeLine20ThroughLine24`', '★★ line21 = line19 + line20 (otherCreditsSchedule3); line19 is the CTC + ODC portion.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 21)'],
  ['Form 1040 line 22 (tax after credits)', '`computeLine20ThroughLine24`', '★★ line22 = max(0, line18 − line21). Indirect dependency on line 19 via line 21.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 22)'],
  ['Form 1040 line 32 (refundable credits subtotal)', '`computeLine31ThroughLine38`', '★★ line 28 (ACTC) added to refundable subtotal.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 32)'],
  ['Form 1040 line 33 (total payments)', '`computeLine31ThroughLine38`', '★★ line 28 flows through line 32 → line 33.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 33)'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 55 }, { wch: 75 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 19 / Line 28'],
  ['computeSchedule8812 emits ONE blocking flag (FORM_8862_CTC_REQUIRED) when CTC previously denied and Form 8862 missing or claimsCTC≠true.'],
  [],
  ['Flag code', 'Severity', 'Condition', 'Where emitted'],
  ['FORM_8862_CTC_REQUIRED', 'BLOCKING', 'ctcPreviouslyDenied=true AND (form8862 == null OR !form8862.claimsCTC)', '`computeSchedule8812` line 22448'],
  ['(No other blocking flags at line 19 site)', 'N/A', 'Other failures (numCtcChildren=0, hasFiling2555, SSN rule fails, electsNoActc=true) silently zero line 27 — no flag emitted.', '—'],
  [],
  ['SPEC §9 STRUCTURAL INVARIANTS (not runtime-validated)'],
  ['Invariant', 'How enforced / Status'],
  ['line14 >= 0', 'STRUCTURALLY enforced — min(line 12, line 13); both non-negative; result non-negative.'],
  ['line14 <= line12 AND line14 <= line13', 'STRUCTURALLY enforced — min(...) operation.'],
  ['line27 >= 0', 'STRUCTURALLY enforced — max(0, ...) + min(...) operations.'],
  ['line27 <= line4 * 1700', 'STRUCTURALLY enforced — line17 = min(line16a, line16b = numCtcChildren × $1,700).'],
  ['line27 = 0 if line4 = 0', 'STRUCTURALLY enforced — Part II-A preconditions return early.'],
  ['★ line27 = 0 if Form 2555 filed', 'STRUCTURALLY enforced — hasFiling2555 trigger. ⚠️ Pre-19 #1: form2555Spouse caused false-positive on MFS; fixed via call-site null-shadow.'],
  ['line27 = 0 if 2025 CTC/ACTC SSN rule fails', 'G7 fix: ITIN check via 9-leading-digit pattern; MFJ check for "at least one valid SSN".'],
  ['Dependent cannot be checked for both CTC and ODC', 'STRUCTURALLY enforced — counting loop uses if-else (mutually exclusive).'],
  ['CTC SSN rule: child must have valid SSN issued by due date', 'Delegated to intake form dependent flags (qualifiesForCTC predicate).'],
  ['Form 8862 gate when ctcPreviouslyDenied=true', 'STRUCTURALLY enforced — emits BLOCKING flag + returns zero result.'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 14 }, { wch: 100 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 19 is the FIRST credits-section line (CTC + ODC + ACTC via Schedule 8812). ★ FIRST audit OUTSIDE the tax-territory chain (lines 16/17/18). Heavy-compute orchestrator. 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-14 — ⚠️ HIGH-PRIORITY MFS DEFENSIVE GAP FIXED at computeSchedule8812 call site (form2555Spouse leaks at TWO internal points — single null-shadow fix; ★ NEW PATTERN: single-input multi-expression leak)',
    '**Closure applied (Option A — call-site null-shadow; matches 16 #1 + 17 #1 + 13b #1 + 13a #1 SURGICAL precedent)**: TaxReturnComputeService.java has ONE leakage input at the computeSchedule8812 call site with TWO INTERNAL leak expressions — ★ NEW PATTERN distinct from 16 #1\'s bundled-two-INPUT fix; single null-shadow fixes BOTH internal expressions simultaneously. (1) **~42-line MFS breadcrumb** added above the call site at prepare() ~line 1341 documenting: (a) per-input MFS-leakage classification of all 13 inputs (8 return-level scalars NO leak; 2 list inputs filtered at intake NO leak; form2555Taxpayer taxpayer-side OK; ★ form2555Spouse the ONE direct leak with TWO internal expressions; ctcScreening/form8862/you/spouse/flags return-level NO leak); (b) leak mechanism: (i) line 22477-22484 line 2b MAGI inflation → over-states MAGI → phase-out triggers earlier → line 14 UNDER-STATED; (ii) line 22595 hasFiling2555 ACTC trigger → wrongly forces line 27 = 0; (c) IRC §24(d)(5)(B) clarification (Form 2555 blocks ACTC at FILER level); (d) direction: TAXPAYER SELF-HARM (under-states both CTC line 19 + ACTC line 28); (e) 20-orchestrator cascade context. (2) **Call-site null-shadow** at ~line 1344: `isMfsReturn ? null : form2555Spouse`. (3) NEW lock-in test `mfsExcludesSpouseForm2555FromSchedule8812` at TaxReturnComputeServiceTest.java — MFS taxpayer + $200k US wages + 1 CTC child + STALE spouse Form 2555 ($50k FEIE). **Test confirms**: post-fix `getLine3Magi() < $250,000` (spouse FEIE not added to MAGI; actual MAGI = $200k AGI); post-fix `getLine14CtcOdcCredit() = $2,200` (CTC not phase-out-reduced); post-fix `getLine27ActcCredit() != null` (Part II-A path ran, not short-circuited by hasFiling2555). Log confirms: `line21 = 2200` (= line 19 = CTC), `line22 = 34867` (= line 18 - line 21 = $37,067 - $2,200). **Single-guard MFS cascade now applied to 20 orchestrators — NEW CODEBASE MAXIMUM** (was 19 after 17 #1). Cascade roster (20): 1c + 1d + 1e + 1f + 1g + 1h + 1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities + computeSocialSecurityBenefits + computeCapitalGainLoss + computeOtherIncomes + computeIncomeAdjustments + buildStandardDeductionIndicators + computeLine13a + computeSchedule1A + computeLine16 + computeLine17 + **computeSchedule8812 (NEW)**. **★ FIRST entry in credits-territory chain** (after tax-territory lines 16/17/18). **★ NEW PATTERN: single-input multi-expression leak** — 19 #1 is the FIRST audit with one input parameter producing TWO distinct internal leak expressions; single null-shadow at call site fixes both. Cleaner than 16 #1\'s two-INPUT bundled fix. Backend: 764 → **765** (+1 lock-in test). Direction SAME AS 16 #1 + 17 #1 (taxpayer self-harm).',
    'TaxReturnComputeService.java:~1341 (~42-line MFS breadcrumb); ~1344 (call-site null-shadow `isMfsReturn ? null : form2555Spouse`); TaxReturnComputeServiceTest.java (mfsExcludesSpouseForm2555FromSchedule8812 lock-in test); 22477-22484 (LEAK POINT 1: line 2b MAGI inflation; still in computeSchedule8812 — protected by call-site shadow); 22595 (LEAK POINT 2: hasFiling2555 ACTC trigger; same protection)',
    'CLOSED — MFS guard applied at call site (form2555Spouse single-input two-internal-leak fix); lock-in test added. Backend 765/765 pass (+1). 20th orchestrator in MFS cascade — NEW CODEBASE MAXIMUM. ★ FIRST entry in credits-territory chain. ★ NEW PATTERN: single-input multi-expression leak.'],

  [2, 'RESOLVED 2026-05-14 — DOCUMENTATION HYGIENE — Knowledge file Legacy A rename (knowledge_line19.md → line-19-child-tax-credit.md; 12th Legacy A migration; convergence 24→25)',
    '**Closure applied**: (1) plain `mv` of `C:\\us-tax\\knowledge\\knowledge_line19.md` → `C:\\us-tax\\knowledge\\line-19-child-tax-credit.md` (folder not under git). (2) Repo-wide grep for `knowledge_line19` produced 2 file hits / 8 line hits (classified per established 15 #2 / 16 #2 / 17 #2 / 18 #2 precedent): ACTIVE-UPDATE = 3 generate-19.js content-citation hits at line 12 (header citation — updated to new path with rename annotation `(renamed from knowledge_line19.md via 19 #2 2026-05-14)`), line 409 (Issue #4 cross-reference to knowledge §2 + §9 — updated), line 435 (Issue #9 Where Found pointing to knowledge §11 — updated). LEAVE-UNTOUCHED = 5 hits — `history.md` 1 historical-entry hit at line 3728 (per immutable-history policy) + 4 generate-19.js hits at lines 70/398/399/400 (Issue #2 rename-description rows — both old + new names intentionally appear as part of describing the rename; leaving these untouched preserves audit-trail clarity). (3) `lines/19.md` + `dependencies/19.md` scan: NO citation of knowledge file path → no update needed. (4) ZERO hits in TaxReturnComputeService.java (code never references knowledge file path). **12th Legacy A migration in workflow** (after 7a/8/9/10/11a/12a/13a/15/16/17/18 #2). **Knowledge-file naming convergence advances 24 → 25 lines** — steady cadence after 18 #2 entered double-digit territory. Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\knowledge\\line-19-child-tax-credit.md (renamed); C:\\us-tax\\XLS\\_tools\\generate-19.js 3 ACTIVE-UPDATE hits at lines 12/409/435 + 4 LEAVE-UNTOUCHED rename-description hits at lines 70/398/399/400; history.md 1 historical hit at line 3728 left untouched',
    'CLOSED — file renamed + 3 active citations updated in generate-19.js (lines 12/409/435); 5 hits left untouched per precedent (1 history.md historical + 4 generate-19.js rename-description). Pure documentation closure. 12th Legacy A migration. Convergence 24 → 25 lines.'],

  [3, 'RESOLVED 2026-05-14 — SPEC ENHANCEMENT — Verification log section §12 created in lines/19.md (single-row pattern; smallest log shape)',
    '**Closure applied**: appended `## 12) Verification log` section to `lines/19.md` after section §11 (Deferred / Scope Notes; line 356). 5-column markdown table; **row 1 in IN-PROGRESS state** capturing #1 (HIGH-PRIORITY MFS guard — 20 orchestrators NEW MAX + ★ FIRST entry in credits-territory chain + ★ NEW PATTERN single-input multi-expression leak + backend 764 → 765) + #2 (Legacy A rename — 24 → 25 convergence; 12th migration steady cadence) + #3 (this section creation). Row 1 will be finalized to **"COMPLETE — 10/10 closed"** at Issue #10 (boundary milestone) with all 10 closures enumerated. **Single-row pattern** = SMALLEST log shape (mirrors lines 8, 9, 10, 14, 15, 16, 17, 18 single-line audits). Append-then-finalize pattern (used at 14 #3, 15 #3, 16 #3, 17 #3, 18 #3) lets the row evolve as the walkthrough progresses; final state captured atomically at Issue #10. Pure spec enhancement — no functional change. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\lines\\19.md section §12 appended after §11 (Deferred / Scope Notes; line 356)',
    'CLOSED — §12 Verification log section created with single-row IN-PROGRESS table. Single-line audit shape (smallest log).'],

  [4, 'RESOLVED 2026-05-14 — ★ DOCUMENTATION DRIFT FIX — lines/19.md §2 updated to cite $2,200 CTC (was STALE $2,000 from pre-OBBBA 2024 spec); INTERNAL CONTRADICTION with §4c resolved',
    '**Closure applied**: TWO spec edits — pure documentation; no code change. **The drift**: OBBBA + Rev. Proc. 2024-40 §3.08 set 2025 CTC at $2,200/child (up from $2,000 in 2024). Code at TaxReturnComputeService.java:22506 + comment at line 22505 (cites OBBBA explicitly) + dependencies/19.md §7 constants table + line-19-child-tax-credit.md §2 + §9 all correctly cite $2,200. But spec §2 had STALE pre-OBBBA values from the 2024 baseline that didn\'t get refreshed: (a) **§2 line 30** said `Schedule8812.line5 = Schedule8812.line4 * 2000` (formula block); (b) **§2 line 44 constants list** said `CTC per qualifying child: $2,000`. **INTERNAL CONTRADICTION**: §4c line 125 already correctly cited `line5 = line4 * 2200` — so the spec contradicted itself. **★ FIRST drift fix in workflow involving internal contradiction within same spec file** (prior 6 drift fixes were doc-vs-code; 19 #4 is also doc-vs-doc within §2 vs §4c). **Edits**: (a) `lines/19.md` §2 line 30 — updated formula to `Schedule8812.line5 = Schedule8812.line4 * 2200` with OBBBA + Rev. Proc. 2024-40 §3.08 + 19 #4 doc-drift fix 2026-05-14 inline annotation; (b) `lines/19.md` §2 line 44 — updated constant from `$2,000` to `$2,200` + annotation `(increased from $2,000 in 2024 per OBBBA + Rev. Proc. 2024-40 §3.08; doc-drift fix 19 #4 2026-05-14)`. Pure documentation closure — no functional change; spec/dependencies now align with code reality + internal contradiction resolved. **7th documentation drift fix in workflow** (after 6 prior drift fixes — 18 #4 was the 6th). **Why this matters**: spec §2 (line identity + core formula) is typically the entry point to a spec; future maintainer reading STALE $2,000 might (a) try to "fix" code to match spec (reverting to $2,000); (b) doubt OBBBA change happened; (c) lose trust in spec entirely after seeing §2 vs §4c contradiction. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\lines\\19.md §2 line 30 (updated to `* 2200` + OBBBA + 19 #4 annotations); §2 line 44 (updated to `$2,200` + 19 #4 annotations); §4c line 125 already correct; internal contradiction resolved',
    'CLOSED — 2 spec edits applied. lines/19.md §2 line 30 + line 44 now correctly cite $2,200 per OBBBA + Rev. Proc. 2024-40 §3.08 (2026-05-14). 7th documentation drift fix in workflow; ★ FIRST involving internal contradiction within same spec file. Pure documentation closure.'],

  [5, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — Schedule 8812 Part I (lines 1-14) — 6 sub-verifications including ★ 2025 OBBBA constants ($2,200 CTC) + G5 fix locked in + ⚠️ G6 deferred',
    '**Closure applied**: ~75-line VERIFIED CORRECT breadcrumb planted above `computeSchedule8812` JavaDoc at TaxReturnComputeService.java:~22461 (between section banner at line 22456-22459 and existing JavaDoc; both navigation landmarks preserved per established 16 #4 / 17 #5 / 18 #5 precedent). Structure — 6 sub-verifications: (1) **MAGI computation (lines 1-3)** per spec §4a — agi = line 11b; line 2b = Form 2555 exclusions (taxpayer + spouse with `form2555Spouse` null-shadowed via 19 #1 at call site ~line 1344); magi = sum. ⚠️ Deferred per spec §11: Puerto Rico (line 2a) + Form 4563 (line 2c) flagged in 19 #9. (2) **Dependent counting (lines 4 + 6)** per spec §4c — qualifiesForCTC/qualifiesForODC predicates; mutual exclusion STRUCTURALLY enforced by if-else (spec §9 invariant); ★ 2025 SSN/ITIN rule (spec §3b + §3c) delegated to predicates. (3) **★ Tentative credit (lines 5, 7, 8)** per spec §4c — line5 = numCtcChildren × **$2,200** (★ 2025 OBBBA; increased from $2,000 in 2024 per Rev. Proc. 2024-40 §3.08; code comment at ~line 22543 cites OBBBA explicitly; doc-drift fix 19 #4 aligned spec §2 with code); line7 = numOdcDependents × **$500** (unchanged); line8 = sum. (4) **★ Phase-out (lines 9-12)** per spec §4b + §4d + IRC §24(b) — threshold = $400k MFJ / $200k others (★ QSS uses $200k NOT $400k); code checks `"Married filing jointly"` only — QSS correctly falls into $200k branch. ★ **G5 FIX 2026-04-18**: line 10 stores RAW excess (not rounded); thousands = ceil(excess/$1k)×$1k (intermediate); line 11 = thousands × 0.05 (= $50 per $1,000 per IRC §24(b)(1)); line 12 = max(0, line 8 − line 11). (5) **CLW-A (line 13)** per spec §5a — wA1 = totalTaxBeforeCredits (= Form 1040 line 18; inherits MFS protection transitively via 17 #1 + 16 #1; ★ G-new-1 REFRESH ensures wA1 is post-FTC-corrected when FTC applies); wA3 = FTC + childcare + education + saver\'s + elderly/disabled(future); worksheetA = max(0, wA1 − wA3). ⚠️ **G6 DEFERRED** — spec §5a lists 9 Schedule 3 subtractions; code subtracts only 5; missing lines 5b (Form 8396 mortgage interest) / 6f (Form 5695 Part I clean energy) / 6 (other) / 6m (other) await Form 8396/5695-Part-I/8859 impl; CORRECT for current in-scope forms; flagged in 19 #9. (6) **★ Line 14 — Form 1040 line 19 OUTPUT** per spec §4e + §9 — line14 = min(line12, worksheetA); line14 ≥ 0 AND line14 ≤ line12 AND line14 ≤ line13 STRUCTURALLY enforced; wired at prepare() ~line 1348: `taxAndCredits.setChildTaxCredit(line14)`. **Coverage cross-references**: spec §4 + §5 + §9 + §11 + dependencies/19.md §1 + §7 + line-19-child-tax-credit.md §2 + §3 + 19 #1 MFS guard + 19 #4 doc-drift fix + 19 #9 G6 deferred + 18 #5 + 18 #6 (totalTaxBeforeCredits source) + OBBBA + Rev. Proc. 2024-40 §3.08. Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:~22461 (above computeSchedule8812 JavaDoc; ~75-line breadcrumb covering 6 sub-verifications for Part I lines 1-14)',
    'CLOSED — verified correct. ~75-line breadcrumb documents Part I lines 1-14 + ★ 2025 OBBBA constants ($2,200 CTC + $500 ODC + $400k/$200k phase-out + $50/$1k rate) + ★ G5 fix lock-in + ⚠️ G6 deferred (CLW-A 4 missing Schedule 3 subtractions) + ★ wA1 inherits G-new-1 refresh (line 18 post-FTC-corrected) + ★ QSS falls into $200k branch (not MFJ $400k).'],

  [6, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — Schedule 8812 Part II-A (lines 15-20) — 6 sub-verifications including ★ G4 electsNoActc design decision + ★ $1,700 OBBBA ACTC ceiling + G7 SSN/ITIN rule',
    '**Closure applied**: ~65-line VERIFIED CORRECT breadcrumb planted above Part II-A preconditions block at TaxReturnComputeService.java:~22705 (above the `// ── Part II-A: preconditions ──` comment). Structure — 6 sub-verifications: (1) **★ ACTC PRECONDITIONS** per spec §6a — line 27 = 0 if ANY of 5 disqualifier branches: numCtcChildren=0 OR `hasFiling2555` (★ form2555Spouse LEAK POINT 2 — protected by 19 #1 null-shadow at call site ~line 1344; per IRC §24(d)(5)(B) Form 2555 blocks ACTC at FILER level) OR G7 SSN/ITIN rule fails OR electsNoActc=true (G4 design decision) OR line16a=0. STRUCTURALLY enforced by early-return branches. (2) **★ LINE 15 RESERVED** — per spec §6a: "reserved for future use in 2025; NOT an opt-out checkbox". ★ BUT code exposes `electsNoActc` user-facing checkbox (G4 design decision; no IRS basis but kept as CONSERVATIVE OPT-OUT per 2026-04-18 review — user forfeits entitlement; no compliance risk; preserves user agency; documented in outstanding.md). (3) **★ LINE 16a/b + LINE 17** per spec §6b — line16a = max(0, line12 − line14); line16b = numCtcChildren × **$1,700** (★ 2025 OBBBA; Rev. Proc. 2024-40 §3.08; increased from $1,600 in 2024); line17 = min(line16a, line16b). ★ ODC dependents NOT counted in line 16b — only numCtcChildren; ODC NEVER becomes refundable per spec §6. (4) **★ LINE 18a/b** earned income worksheet per spec §6b — line18a = totalWages (line 1z) + nontaxableCombatPayElection (line 1i; ELECTIVE per IRC §32(c)(2)(B)(vi)). ⚠️ line 18b NOT stored separately — tracked inside line 18a via election; scope limitation per knowledge §11 (not a 2025 tax-rule violation; 19 #9 observation). ⚠️ Earned income worksheet edge cases — SE optional methods + treaty-excluded income deferred per spec §11 + knowledge §11 (19 #9 observation). (5) **★ LINES 19/20** per spec §6b — if line18a ≤ $2,500: line19/20 = 0; else line19 = line18a − $2,500; line20 = line19 × 0.15. 2025 constants UNCHANGED from 2024: $2,500 floor (IRC §24(d)(1)(B)(i)); 0.15 rate (IRC §24(d)(1)(B)(ii)). ★ Per spec §6b: 2025 form uses line 18a (NOT line 18a + line 18b) for line 19; code correctly uses line18a only. (6) **★ G7 SSN/ITIN RULE** (2025 NEW per spec §3a; G7 fix 2026-04-18) — ITINs identified by leading "9" digit; Single/MFS/HOH/QSS: ACTC blocked if filer has ITIN; MFJ: ACTC allowed when at least one spouse has valid SSN; CTC line 14 still allowed (only ACTC affected per spec §3a; ODC uses standard SSN/ITIN/ATIN rule unaffected). **Coverage cross-references**: spec §3a + §6 + §6a + §6b + §9 + §11 + dependencies/19.md §1 + §7 + line-19-child-tax-credit.md §3 + §10 (G4 design decision) + 19 #1 MFS guard at call site + 19 #5 Part I breadcrumb (line 12 + line 14 inputs to line 16a) + 19 #9 deferred-scope observations + OBBBA + Rev. Proc. 2024-40 §3.08. Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:~22705 (above Part II-A preconditions; ~65-line breadcrumb covering 6 sub-verifications)',
    'CLOSED — verified correct. ~65-line breadcrumb documents Part II-A lines 15-20 + ★ G4 electsNoActc design decision (no IRS basis but kept as conservative opt-out) + ★ $1,700 OBBBA ACTC ceiling + ★ ODC NOT counted in ACTC + line 18a earned income + line 19/20 $2,500 floor + 15% rate + ★ G7 SSN/ITIN rule (2025 NEW; ITIN check via leading "9").'],

  [7, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — Schedule 8812 Part II-A routing + Part II-B (lines 21-27) — 5 sub-verifications + G1 fix + G11 Puerto Rico expansion',
    '**Closure applied**: ~85-line VERIFIED CORRECT breadcrumb planted above Part II-A routing block at TaxReturnComputeService.java:~22869 (above the `// ── Part II-A routing / Part II-B ──` comment). Structure — 5 sub-verifications: (1) **★ Routing logic** per spec §7 — decision tree: (a) if line16b < $5,100 (= 3 × $1,700) AND NOT Puerto Rico → line27 = min(line17, line20); (b) if line20 ≥ line17 → line27 = line17 (earned-income already covers); (c) else → Part II-B path. ★ Why $5,100? = 3 × $1,700 ACTC max; below that, earned-income method always suffices. ★ G11 fix 2026-04-18 — Puerto Rico bona fide residents with ≥1 qualifying child may claim ACTC via Part II-B regardless of child count (G11 only routes existing computations; PR AGI exclusion line 2a still deferred per spec §11). ★ G7 PARTIAL — CLW-B line 14 ≈ CLW-A when Schedule 8812 directs filer to CLW-B; exact Form 8839 CLW-B formula deferred. (2) **★ Lines 21-23** per spec §7 — line21 = Σ W-2 box 4 socialSecurityTaxWithheldAmount; line22 = schedule1.line15 (SE tax; ⚠️ DEFERRED per knowledge §11 — returns 0) + schedule2.line5 + schedule2.line6 + schedule2.line13 (additionalMedicareTax); line23 = line21 + line22. ⚠️ Tier 1 RRTA tax + Additional Medicare Tax edge cases — current impl uses simple box-4 sum; per spec §7 IRS worksheet exists for advanced cases; 19 #9 observation. (3) **★ G1 FIX 2026-04-18 — CRITICAL compute-order fix at line 24**: Pre-G1 (buggy) — computeSchedule8812 ran BEFORE computeLine31ThroughLine38 → EIC + refundable AOTC = $0 when line 24 computed → line 25 OVER-stated → ACTC potentially OVER-CLAIMED. Post-G1 (correct) — (a) computeForm8863 moved BEFORE computeSchedule8812 → sets payments.americanOpportunityCredit; (b) EIC pre-set via idempotent pattern; (c) line 24 = payments.earnedIncomeCredit + payments.americanOpportunityCredit (both PRE-SET) + schedule3.line11 (future). Lock-in tests: `schedule8812_partIIB_noSsWithholding_usesEarnedIncomeMethod` + `schedule8812_partIIB_ssWithholdingExceedsEarnedIncomeMethod`. (4) **★ Lines 25-27 — alternative ACTC base** per spec §7 — line25 = max(0, line23 − line24); line26 = max(line20, line25) (★ ALTERNATIVE ACTC BASE — taxpayer gets BETTER of earned-income OR SS-withholding method; structural reason Part II-B exists); line27 = min(line17, line26) (★ caps at ACTC potential per spec §9 invariant `line27 ≤ line4 * 1700`) = ★ FORM 1040 LINE 28 OUTPUT. (5) **★ Line 27 wiring → Form 1040 line 28** at prepare() ~line 1355 — `if (actc > 0): payments.setAdditionalChildTaxCredit(actc); else: skip wiring (null)`. ★ Null-when-zero convention (legacy; affects PDF display — blank line 28 cell when ACTC = 0). **Coverage cross-references**: spec §7 + §9 + §11 + dependencies/19.md §1 + §6 + line-19-child-tax-credit.md §3 + §10 (G1 fix at "Identified Gaps") + 19 #5 Part I breadcrumb (line 12 + line 14 inputs) + 19 #6 Part II-A breadcrumb (line 17 + line 20 inputs) + 19 #9 deferred-scope observations (SE tax + Tier 1 RRTA + Puerto Rico AGI exclusion). Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:~22869 (above Part II-A routing / Part II-B block; ~85-line breadcrumb covering 5 sub-verifications + G1 fix + G11 Puerto Rico expansion)',
    'CLOSED — verified correct. ~85-line breadcrumb documents Part II-A routing + Part II-B lines 21-27 + ★ G1 FIX (compute-order: Form 8863 + EIC pre-set BEFORE Schedule 8812) + ★ G11 Puerto Rico expansion 2026-04-18 + ★ $5,100 threshold rationale (= 3 × $1,700) + ★ max(line20, line25) alternative ACTC base rationale + null-when-zero wiring convention. ⚠️ SE tax + Tier 1 RRTA + Puerto Rico AGI exclusion deferred per spec §11.'],

  [8, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — Wiring + Form 8862 gate + electsNoActc opt-out (G4 design decision) + per-dependent PDF checkboxes',
    '**Closure applied**: ~55-line VERIFIED CORRECT breadcrumb planted above the prepare() output-wiring block at TaxReturnComputeService.java:~1386 (above the `// Wire line 19...` comment that precedes the line 19 + line 28 wire-up). Structure — 4 sub-verifications: (1) **★ Form 8862 gate (CTC recertification)** per spec §10. Code INSIDE computeSchedule8812 at ~line 22443-22457 — TWO-STAGE GATE: (a) `ctcPreviouslyDenied=true` AND (form8862 == null OR !claimsCTC) → emit `FORM_8862_CTC_REQUIRED` BLOCKING flag + return zero; (b) form8862 exists but ctcEligible != true → log info + return zero silently (user chose not to claim); (c) form8862 with ctcEligible=true → proceed. Per dependencies/19.md rows 23-24 (ctc-actc-screening + Form 8862 inputs). (2) **★ electsNoActc opt-out (G4 design decision)** at ~line 22699. NO IRS basis for 2025 (spec §6a: Schedule 8812 line 15 is "reserved for future use"); kept as CONSERVATIVE OPT-OUT per 2026-04-18 review (G4 closed as accepted design decision; user forfeits ACTC entitlement; no compliance risk). CTC line 14 still computed normally; only line 27 zeroed. Wired to PDF `unmapped_c2_14_0` checkbox per dependencies/19.md row 59. (3) **★ Output wiring (line 19 + line 28)** at prepare() ~lines 1386-1400 — TWO DISTINCT CONVENTIONS: line 19 UNCONDITIONAL wire (`setChildTaxCredit(line14)` even when 0; PDF `line19_child_tax_credit_or_other_dependents_credit`); line 28 NULL-WHEN-ZERO convention (`if actc > 0: setAdditionalChildTaxCredit(actc)`; PDF `line28_additional_child_tax_credit` blank when ACTC = 0). Legacy choice; affects PDF display only; both correct for downstream consumers (line 21 always reads CTC; line 32 only reads ACTC when present). (4) **★ Per-dependent PDF checkbox flags** set in `buildDependents()` (SEPARATE method, not in computeSchedule8812). `dependent.setChildTaxCreditEligible(qualifiesForCTC() ? TRUE : null)` + `dependent.setOtherDependentCreditEligible(qualifiesForODC() ? TRUE : null)`. ★ Mutual exclusion structurally enforced by predicate definitions (per 19 #5 sub-verification 2). PDF targets per dependencies/19.md rows 60-61 (`dependent1_child_tax_credit … dependent4_child_tax_credit` for CTC; `dependent1_credit_for_other_dependents …` for ODC). **Coverage cross-references**: spec §3a + §3b + §3c + §10 + dependencies/19.md §3 (Outputs) + §4 (PDF Fields) + rows 22-24 (intake inputs) + rows 50-51 (per-dependent outputs) + line-19-child-tax-credit.md §4 + §5 + §10 (G4 design decision) + 19 #1 MFS guard at ~line 1384 + 19 #5/19 #6/19 #7 breadcrumbs (computation details). Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:~1386 (above "// Wire line 19..." comment; ~55-line breadcrumb covering 4 sub-verifications + 2 wiring conventions)',
    'CLOSED — verified correct. ~55-line breadcrumb documents Form 8862 gate (2-stage) + electsNoActc opt-out (G4 design decision; no IRS basis but kept as conservative opt-out) + output wiring (line 19 unconditional vs. line 28 null-when-zero conventions) + per-dependent PDF checkboxes (mutual exclusion). G4 + G7 fixes locked in 2026-04-18.'],

  [9, 'RESOLVED 2026-05-14 — ⚠️ BUNDLED OBSERVATIONS — 3 deferred-scope observations (16th Path A application; ★ 20 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS — first 20-walkthrough streak in workflow)',
    '**Closure applied**: pure xlsx-flip observation bundle — **NO code change**; **NO outstanding.md entry** (anti-fragmentation policy). THREE observations bundled — all share same "documented + deferred / out-of-scope; not blocking real returns in current scope" rationale. **(a) G6 CLW-A missing Schedule 3 subtractions** — lines/19.md §5 + dependencies/19.md G6 confirm Worksheet A subtracts only 5 of 9 Schedule 3 items: implemented (FTC line 1 + childcare line 2 + education line 3 + saver\'s line 4 + elderly/disabled-future line 6d); ⚠️ MISSING line 5b (Form 8396 mortgage interest credit) + 6f (Form 5695 Part I residential clean energy) + 6 (other line 6 items) + 6m (other line 6m items). All await Form 8396/5695-Part-I/8859/etc. implementation. **CLW-A is CORRECT for current in-scope forms** — missing subtractions don\'t apply because their input forms aren\'t computed; when added in future audits, CLW-A formula must be extended. **G6 OPEN — deferred by design** per dependencies/19.md gaps table. **(b) Puerto Rico exclusion (line 2a) + Form 4563 (line 2c) deferred** per spec §11. Schedule 8812 line 3 MAGI formula per spec §4a is `line3 = line1 + line2a + line2b + line2c`; implementation handles only line2b (Form 2555 exclusions). ⚠️ line2a (Puerto Rico excluded income) + line2c (Form 4563 American Samoa exclusion) NOT implemented — both deferred per project scope. Note: G11 Puerto Rico expansion in 19 #7 (2026-04-18 routing fix) handles PR residents reaching Part II-B; but income-exclusion side (line 2a) remains deferred. **(c) Earned income worksheet edge cases + line 18b separate field** (spec §11 + knowledge §11). Spec §6b notes line 18a is computed via official IRS earned-income chart/worksheet; current impl uses simplified shortcut `line18a = line1z + nontaxableCombatPayElection (if elected)`. ⚠️ Edge cases NOT handled: SE optional methods (IRC §1402(a)(15) farm + §1402(j) nonfarm — out of scope because SE blocked upstream per CLAUDE.md); treaty-excluded income (IRC §61(a) statutory exclusions — rare); line 18b separate field (spec §6b defines line 18b as total nontaxable combat pay; tracked inside line 18a via election — only PDF display distinction; functionally correct for current scope per spec §8b "plain line1z shortcut acceptable when worksheet adjustments not needed"). All three documented as out-of-scope per knowledge §11 + spec §11. **★ Anti-fragmentation policy applied** — observations only; no fixes today; no outstanding.md entry. **16th PATH A APPLICATION** (after 15 prior in workflow). **★ Streak extends 19 → 20 consecutive zero-outstanding walkthroughs** — first 20-walkthrough streak in workflow (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18/19). **★ ZERO NEW GAPS surfaced** — third consecutive audit (18 + 19) with no new gaps; line 19 had 6 prior gaps G1-G6 from 2026-04-18 audit (all resolved or deferred); audit found only deferred-scope confirmations. Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\lines\\19.md §11 (deferred items); C:\\us-tax\\knowledge\\line-19-child-tax-credit.md §11 (out of scope items; renamed from knowledge_line19.md via 19 #2); dependencies/19.md G6 (CLW-A missing Schedule 3 credits)',
    'CLOSED — pure observation bundle. **16th Path A application**; ZERO NEW GAPS surfaced; **★ 20 consecutive zero-outstanding walkthroughs — first 20-walkthrough streak in workflow** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18/19). 3 observations: G6 CLW-A missing Schedule 3 subtractions (deferred awaiting Form 8396/5695-Part-I impl) + Puerto Rico/Form 4563 line 2a/2c deferred per spec §11 + earned income worksheet edge cases (SE optional methods + treaty + line 18b separate field) deferred. No outstanding.md entry per anti-fragmentation policy.'],

  [10, 'RESOLVED 2026-05-14 — BOUNDARY MILESTONE — Line 19 walkthrough complete at 10/10; ★ FIRST AUDIT OUTSIDE TAX-TERRITORY CHAIN (begins credits-territory chain); 20 ORCHESTRATORS (NEW CODEBASE MAXIMUM); ★ 20 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS — FIRST 20-WALKTHROUGH STREAK',
    '**Closure applied**: pure xlsx-flip + Verification log finalization — **CLOSES the 19 walkthrough at 10/10**. TWO file touches: (a) this row flipped to RESOLVED with the eight-theme cumulative block; (b) lines/19.md §12 Verification log row finalized IN-PROGRESS → **COMPLETE — 10/10 closed** (single-row shape; matches lines 8/9/10/14/15/16/17/18). **Eight themes**: (1) **★ FIRST audit OUTSIDE tax-territory chain** — lines 16/17/18 all tax-side; line 19 is FIRST credits-section line. Begins credits-territory chain (line 19 → line 20 → line 21 → etc.). 6th audit OUTSIDE 13ab pair. Heavy-compute orchestrator (~380 lines Part I + II-A + II-B + Form 8862 gate + electsNoActc + G7 SSN check). (2) **★ 20 ORCHESTRATORS — NEW CODEBASE MAXIMUM** (+1 from 19 #1). Cascade roster (20): 1c-1i (7) + 7 income-territory orchestrators + buildStandardDeductionIndicators + computeLine13a + computeSchedule1A + computeLine16 + computeLine17 + **computeSchedule8812 (NEW; begins credits-territory chain)**. (3) **★ MFS leakage SINGLE-INPUT MULTI-EXPRESSION fix** (Issue #1) — `form2555Spouse` leaks at TWO INTERNAL points (line 2b MAGI inflation + hasFiling2555 ACTC trigger); single null-shadow at call site fixes BOTH simultaneously. ★ NEW PATTERN distinct from 16 #1\'s bundled-two-INPUT fix. Lock-in test `mfsExcludesSpouseForm2555FromSchedule8812` extends regression **764 → 765**. (4) **Knowledge convergence advances 24 → 25 lines** (Issue #2: 12th Legacy A migration — steady cadence in double-digit territory). (5) **★ 7th DOCUMENTATION DRIFT FIX** (Issue #4) — `lines/19.md` §2 updated to cite $2,200 CTC (was stale $2,000 from pre-OBBBA 2024); ★ **FIRST drift fix with INTERNAL CONTRADICTION** — §2 contradicted §4c (which already correctly cited $2,200); both now aligned. (6) **★ Four large VERIFIED CORRECT breadcrumbs (~280 lines total)** — Issue #5 (~75-line Part I) + Issue #6 (~65-line Part II-A) + Issue #7 (~85-line Part II-B + G1 + G11) + Issue #8 (~55-line wiring + Form 8862 + electsNoActc + per-dependent checkboxes). Largest breadcrumb-suite-per-audit so far for a single orchestrator. (7) **Anti-fragmentation continues — 16th Path A application** (Issue #9: 3-observation bundle: G6 CLW-A missing credits + Puerto Rico/Form 4563 deferred + earned-income worksheet edge cases). **★ ZERO NEW GAPS surfaced** — third consecutive audit (line 19 had 6 prior gaps G1-G6 from 2026-04-18 audit; all resolved/deferred; audit found only deferred-scope confirmations). (8) **Cumulative state through line 19**: **45 lines audited** (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + 11b + 12a + 12b + 12c + 12d + 12e + 13a + 13b + 14 + 15 + 16 + 17 + 18 + **19**); **447 audit issues closed total** (437 + 10); backend **765/765 pass** (+1 from 19 #1 MFS lock-in test); MFS cascade = **20 orchestrators (NEW CODEBASE MAX, +1)**; knowledge convergence = **25 lines (+1)**; dependencies files = 43 (unchanged); **★ 7 documentation drift fixes** across workflow (+1 from 19 #4); 16 Path A applications (+1 from 19 #9); 7 anti-duplication applications (unchanged); 2 SEEDED → VERIFIED CORRECT upgrades (unchanged); 2 terminal seeds at orchestrators (unchanged — line 19 has ~280 lines of breadcrumbs across 4 issues, substituting for a single seed). **★ 20 CONSECUTIVE WALKTHROUGHS WITH ZERO NEW OUTSTANDING.MD ENTRIES — FIRST 20-WALKTHROUGH STREAK IN WORKFLOW** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18/**19**). **Verification logs**: 2ab (4) + 3abc (3) + 4abc (3) + 5abc (3) + 6abcd (4) + 7ab (2) + 8 (1) + 9 (1) + 10 (1) + 11ab (2) + 12abcde (5 — LARGEST) + 13ab (2) + 14 (1) + 15 (1) + 16 (1) + 17 (1) + 18 (1) + **19 (1 — single-line shape)**. **Looking ahead — line 20 (Amount from Schedule 3 line 8 — total nonrefundable credits)**: 7th audit OUTSIDE 13ab pair; SECOND credits-section audit. Line 20 pulls from Schedule 3 line 8 (sum of nonrefundable credits other than CTC/ODC: line 1 FTC + line 2 childcare + line 3 education + line 4 saver\'s + line 5a residential clean energy + line 5b Form 8396 + line 6 other + line 7 subtotal); likely inline-computed at single site. Likely defensive-gap-NOT-needed Issue #1 (transitive inheritance from Schedule 3 fields). Will use 16 #4 + 17 #4 navigable hubs + 19 #5/6/7/8 breadcrumbs as upstream references.',
    'XLS/computations/19.xlsx audit-trail (this row); lines/19.md §12 Verification log row FINALIZED to COMPLETE — 10/10 closed; knowledge file renamed via 19 #2 (line-19-child-tax-credit.md); documentation drift fixed via 19 #4 (lines/19.md §2 line 30 + line 44)',
    'CLOSED — 10/10. **45 lines audited; 447 issues; 765/765 backend; 20 orchestrators (NEW CODEBASE MAX); 25-line knowledge convergence; 20 consecutive zero-outstanding walkthroughs (FIRST 20-STREAK); 7 documentation drift fixes; 16 Path A applications; 7 anti-duplication applications; 0 NEW gaps surfaced (third consecutive)**. FIRST audit OUTSIDE tax-territory chain — begins credits-territory chain. Next: line 20 (Schedule 3 line 8; likely inline-computed + defensive-gap-NOT-needed).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 120 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 19 / Line 28 Flow in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.taxAndCredits.childTaxCredit', 'Form 1040 page 2, line 19 (PDF key line19_child_tax_credit_or_other_dependents_credit)', 'XLS/output_forms/form-tax-return-1040.xlsx', '★ CANONICAL line 19 output (NONREFUNDABLE). BigDecimal whole-dollar HALF_UP. = Schedule 8812 line 14 = min(line 12, CLW-A).'],
  ['form1040.payments.additionalChildTaxCredit', 'Form 1040 page 2, line 28 (PDF key line28_additional_child_tax_credit)', 'XLS/output_forms/form-tax-return-1040.xlsx', '★ CANONICAL line 28 output (REFUNDABLE ACTC). = Schedule 8812 line 27. Null when 0.'],
  ['form1040.taxAndCredits (electsNoActc checkbox)', 'Form 1040 page 2 (PDF key unmapped_c2_14_0)', 'XLS/output_forms/form-tax-return-1040.xlsx', 'ACTC opt-out checkbox (G4 design decision; checked when electsNoActc=true). No IRS basis but kept as conservative opt-out.'],
  [],
  ['Per-dependent PDF checkboxes (Form 1040 page 1)'],
  ['dependent.childTaxCreditEligible', 'dependent1_child_tax_credit … dependent4_child_tax_credit', 'XLS/output_forms/form-tax-return-1040.xlsx', 'Per-dependent CTC checkbox; true when qualifiesForCTC().'],
  ['dependent.otherDependentCreditEligible', 'dependent1_credit_for_other_dependents … dependent4_credit_for_other_dependents', 'XLS/output_forms/form-tax-return-1040.xlsx', 'Per-dependent ODC checkbox; true when qualifiesForODC().'],
  [],
  ['Schedule 8812 PDF Fields (full Part I + II-A + II-B; 29 fields)'],
  ['schedule8812.line3Magi', 'f1_3[0]', 'XLS/output_forms/form-tax-return-schedule8812.xlsx', 'MAGI.'],
  ['schedule8812.line4-14 (Part I)', 'f1_4[0] … f1_14[0]', 'same', 'Dependent counts + tentative credit + phase-out + CLW-A + line 14 nonrefundable.'],
  ['schedule8812.line16a-19 (Part II-A)', 'f1_15[0] … f1_19[0]', 'same', 'ACTC excess + ceiling + earned-income worksheet.'],
  ['schedule8812.line20-27 (page 2)', 'f2_1[0] … f2_3[0]', 'same', 'Line 20 (line 19 × 15%) + line 21 (SS withheld) + line 27 (refundable ACTC).'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 21 (total credits)', 'Form 1040 page 2, line 21', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ line21 = line19 + line20 (otherCreditsSchedule3); line 19 is the CTC + ODC component. Required for line 22.'],
  ['Form 1040 line 22 (tax after credits)', 'Form 1040 page 2, line 22', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ line22 = max(0, line18 − line21). Indirect dependency on line 19 via line 21.'],
  ['Form 1040 line 32 (refundable credits subtotal)', 'Form 1040 page 2, line 32', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ line 28 (ACTC) flows to line 32 subtotal.'],
  ['Form 1040 line 33 (total payments)', 'Form 1040 page 2, line 33', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ line 28 → line 32 → line 33 total payments.'],
  [],
  ['CONDITIONAL ATTACHMENTS'],
  ['Schedule 8812', 'Schedule 8812 pages 1 + 2', 'XLS/output_forms/form-tax-return-schedule8812.xlsx', 'Attached when line 14 > 0 OR line 27 > 0 (sidebar conditional push per G2 fix 2026-04-18).'],
  ['Form 8862', 'Form 8862 pages', 'XLS/input_forms/form-form8862.xlsx (user intake)', 'Required when ctcPreviouslyDenied=true; triggers BLOCKING flag if missing.'],
  [],
  ['NOT IN OUTPUT (deliberate exclusions per spec + scope)'],
  ['Puerto Rico exclusion (Schedule 8812 line 2a)', '—', '—', 'Out of scope per spec §11 + knowledge §11.'],
  ['Form 4563 line 15 (Schedule 8812 line 2c)', '—', '—', 'Out of scope per spec §11 + knowledge §11.'],
  ['Schedule 1 line 15 (SE tax; Part II-B line 22)', '—', '—', 'Out of scope — Self-employment (Schedule SE) not supported.'],
  ['Line 18b (separate nontaxable combat pay field)', '—', '—', 'Tracked inside line 18a via nontaxableCombatPayElection; separate line 18b field not stored.'],
  ['CLW-B auto-computation', '—', '—', 'Required when Form 8396/8839/5695-Part-I/8859 credits claimed; auto-computation deferred. Manual override field exists.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 55 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
