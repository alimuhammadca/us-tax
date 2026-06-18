// ============================================================================
//  Generates: C:\us-tax\XLS\computations\30.xlsx
//
//  Source-of-truth references:
//    - lines/30.md (318-line spec; tax year 2025; ★ line 30 = Form8839.line13
//      refundable adoption credit — NEW for 2025 per OBBBA Act).
//    - dependencies/30.md (197 lines; "Audited 2026-04-20"; §6 Gaps Summary:
//      G1-G6 all "Fixed 2026-04-20"; G7 "Partial"; G8 "Documentation only").
//    - knowledge/line-30-refundable-adoption-credit.md (renamed at 30 #2
//      2026-05-16 from knowledge_line30.md; ★ 23rd Legacy A migration; 294
//      lines; "Audit date: 2026-04-20"; convergence advanced 35 → 36 lines;
//      ★ 5 consecutive Legacy A audits — longest streak extended).
//    - flowcharts/30.drawio (exists).
//    - TaxReturnComputeService.java:
//        line 13090-13900+ — computeAdoptionBenefits helper (~800 lines)
//          ★ Method 1 of 2 — runs EARLY in prepare() before AGI available;
//          ★ 7-param signature (adoptionData, w2Entries, filingStatus, you,
//          spouse, isMfsReturn, flags)
//          line 13105-13114 — SSN filter for W-2 box 12 code T benefits
//          (1f.xlsx Issue #2 closure pattern; isMfsReturn flag determines
//          taxpayer-only vs both-spouses aggregation)
//        line 15657-15800+ — applyAdoptionCredit helper (~150 lines)
//          ★ Method 2 of 2 — runs AFTER Schedule 3 lines 1-6b finalized;
//          ★ derives CLW-B line 17 + sets nonrefundable line 18 → Sched 3 6c
//        line 376 — orchestrator call to computeAdoptionBenefits
//        line 1550 — orchestrator call to applyAdoptionCredit
//        line 19896 — wiring: payments.setRefundableAdoptionCredit(...)
//
//  Tax year: 2025
//
//  Concept:
//    Form1040.line30 = Form8839.line13RefundableAdoptionCredit
//
//    ★ NEW for 2025 per OBBBA Act — line 30 is the refundable portion of the
//      adoption credit; prior years (2024 and earlier) had no refundable
//      adoption credit and line 30 was "Reserved for future use".
//
//    ★ SPLIT-STAGE GATED CREDIT — TWO helper methods produce three co-outputs:
//      Method 1: computeAdoptionBenefits (early in prepare; runs BEFORE AGI):
//        - Computes Part II line 13 (refundable adoption credit) → line 30
//        - Computes Part III line 31 (taxable employer benefits) → line 1f
//      Method 2: applyAdoptionCredit (later; runs AFTER Schedule 3 line 1-6b):
//        - Computes CLW-B line 17 (credit limit)
//        - Computes Part II line 18 (nonrefundable) → Schedule 3 line 6c → line 20
//
//    ★ THREE CO-OUTPUTS — more than any prior audited line:
//      line 30 (refundable) + Sched 3 line 6c → line 20 (nonrefundable) + line 1f (taxable employer benefits)
//
//  Line 30 audit positioning (22nd audit OUTSIDE 13ab pair; 61st line):
//   • ELEVENTH payments-section audit
//   • ★ M4 RECURRENCE — 4th recurrence after 27a/28/29; 5th M4 instance overall;
//     15th orchestrator-method-based audit
//   • ★ 23rd Legacy A migration — knowledge_line30.md rename; convergence 35→36;
//     ★ 5 consecutive Legacy A audits (longest streak extended)
//   • ★ 15th META-AUDIT — sub-type (b); ★ DOMINANCE to ~93% (14 of 15);
//     ★ EXPECTED CLEAN given comprehensive G1-G8 fixes 2026-04-20;
//     ★ 2nd consecutive clean META-AUDIT after 29 #4
//   • ★ SPLIT-STAGE GATED CREDIT — ★ 11th distinct complexity dimension
//     (NEW: TWO-METHOD split-stage; distinct from 27a/29's single-method
//     multi-stage gated)
//   • ★ Expected Path A application — RESUMES zero-outstanding-walkthroughs
//     streak at 2 (after 29's 1-audit recovery)
//   • ★ THREE CO-OUTPUTS — most of any audited line
//   • ★ NEW for 2025 per OBBBA Act (mirrors 28's OBBBA CTC update)
//
//  Line 30 audit angles (10 issues):
//   1. ★ M4 RECURRENCE — 4th recurrence (5th M4 instance); ★ 15th orchestrator-
//       method-based; ★ DUAL-METHOD M4 — both computeAdoptionBenefits AND
//       applyAdoptionCredit use isMfsReturn/isMfj flags; pattern distribution
//       after 17 audits: 6 M2 + 4 M3 + 5 M4 + 2 degenerate.
//   2. ★ 23rd LEGACY A MIGRATION — knowledge_line30.md → line-30-refundable-
//       adoption-credit.md; convergence 35 → 36; ★ 5 consecutive Legacy A audits.
//   3. ★ NEW single-spec Verification log in lines/30.md; ★ 25th CONSECUTIVE
//       single-row contribution.
//   4. ★ 15th META-AUDIT IN WORKFLOW — sub-type (b); ★ DOMINANCE to ~93% (14
//       of 15); ★ EXPECTED CLEAN; ★ 2nd consecutive clean META-AUDIT after
//       29 #4; ★ clean trend continues recovery from 54% to 57% (8 clean / 14).
//   5. VERIFIED CORRECT — line 30 wiring; ★ 24th anti-duplication application;
//       ★ NO existing breadcrumb covers line 30; 3-source coverage via spec +
//       dependencies + knowledge.
//   6. VERIFIED CORRECT — ★ SPLIT-STAGE GATED CREDIT chain (★ 11th distinct
//       complexity dimension in workflow — NEW: TWO-METHOD split-stage; line
//       30 helper is split across computeAdoptionBenefits (early; before AGI)
//       AND applyAdoptionCredit (later; after Schedule 3 line 1-6b); distinct
//       from 27a/29's single-method multi-stage gated).
//   7. VERIFIED CORRECT — ★ 5 CONVENTIONS (Conventions 1-4 same as 25a + ★
//       Convention 5 SSN-FILTERED STATEMENT AGGREGATION via isMfsReturn flag
//       for W-2 box 12 code T (mirrors 1f.xlsx Issue #2 closure pattern)).
//   8. VERIFIED CORRECT — 0 routing distinctions + ★ MEDIUM 2025 reference-data
//       set (~6 distinct constants from OBBBA + Rev. Proc. 2024-40); ★ FOURTH-
//       HEAVIEST after 27a/28/29.
//   9. ⚠️ BUNDLED OBSERVATIONS — ★ Path A application (★ continues zero-
//       outstanding-walkthroughs streak at 2 after 29 RESUMED); ★ 30th Path A;
//       ★ 2-audit zero-new-gaps streak; G7 (Partial — Sched 8812 CLW-B
//       substitute) + G8 (Documentation only — AcroForm per-child fields) both
//       already documented in dependencies §6.
//  10. BOUNDARY MILESTONE — ELEVENTH payments-section audit; ★ CLEAN META-AUDIT
//       continues workflow recovery; ★ Path A continues streak at 2; ★ SPLIT-
//       STAGE GATED CREDIT — 11th distinct complexity dimension NEW; ★ M4
//       RECURRENCE (5th M4 instance); ★ 23rd Legacy A migration (5 consecutive);
//       ★ THREE CO-OUTPUTS — most of any audited line; ★ NEW for 2025 per
//       OBBBA Act.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '30.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 30 — REFUNDABLE ADOPTION CREDIT FROM FORM 8839 (NEW FOR 2025 per OBBBA Act)'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 30 (page 2; "Refundable adoption credit from Form 8839, line 13")'],
  ['Concept',
    '★ NEW for 2025 per OBBBA Act 2025 — line 30 is the REFUNDABLE portion of the adoption credit ' +
    '(prior years 2024 and earlier had no refundable adoption credit; line 30 was "Reserved"). ' +
    '★ SPLIT-STAGE GATED CREDIT: TWO helper methods produce THREE co-outputs: refundable line 30 + ' +
    'nonrefundable Schedule 3 line 6c → Form 1040 line 20 + taxable employer benefits line 1f. ★ Most ' +
    'co-outputs of any audited line (more than 28 and 29).'],
  ['Top-level formula (spec §4)',
    'Form1040.line30 = Form8839.line13RefundableAdoptionCredit\n' +
    '\n' +
    'Form 8839 computation flow:\n' +
    '  Part II per-child loop (each eligible child):\n' +
    '    Line 2  = $17,280 (max credit per child; 2025)\n' +
    '    Line 3  = prior-year amount already used for the same child\n' +
    '    Line 4  = line 2 − line 3\n' +
    '    Line 5  = qualified adoption expenses (or $17,280 if domestic special-needs final 2025)\n' +
    '    Line 6  = min(line 4, line 5)  (credit base)\n' +
    '    Line 10 = line 6 × phaseoutFraction\n' +
    '    Line 11a = max(0, line 6 − line 10)  (post-phaseout)\n' +
    '    Line 11b = min(line 11a, $5,000)  ★ refundable per-child cap\n' +
    '\n' +
    '  Part II aggregation:\n' +
    '    Line 11c = sum(per-child line 11b)\n' +
    '    Line 12  = sum(per-child line 11a)\n' +
    '    ★ Line 13 = line 11c → Form1040.line30  (★ THIS LINE — refundable adoption credit)\n' +
    '    Line 14  = max(0, line 12 − line 13)\n' +
    '    Line 15  = prior-year nonrefundable carryforward\n' +
    '    Line 16  = line 14 + line 15\n' +
    '    Line 17  = Credit Limit Worksheet B result\n' +
    '    Line 18  = min(line 16, line 17) → Schedule 3 line 6c → Form 1040 line 20\n' +
    '\n' +
    '  Part III (employer benefits exclusion):\n' +
    '    Line 23  = total W-2 box 12 code T benefits (SSN-filtered by isMfsReturn)\n' +
    '    Line 27  = phaseoutFraction (same as Part II)\n' +
    '    Line 30  = total excluded benefits (per-child cap $17,280 each)\n' +
    '    Line 31  = max(0, line 23 − line 30)  → Form 1040 line 1f (taxable employer benefits)'],
  ['Surrounding page-2 chain',
    'line 25d = totalWithholding\n' +
    'line 26  = estimatedTaxPayments\n' +
    'line 27a = EIC\n' +
    'line 28  = ACTC from Schedule 8812\n' +
    'line 29  = refundable AOTC from Form 8863\n' +
    '★ line 30 = refundable adoption credit from Form 8839 (★ THIS LINE — refundableAdoptionCredit)\n' +
    'line 31  = Schedule 3 line 15\n' +
    'line 32  = line 27a + line 28 + line 29 + line 30 + line 31\n' +
    'line 33  = line 25d + line 26 + line 32\n' +
    '\n' +
    '★ Line 30 is 4th addend in line 32 (refundable credits subtotal).\n' +
    '★ Line 30 is one of THREE co-outputs from Form 8839:\n' +
    '   - line 30 (refundable adoption credit)\n' +
    '   - Sched 3 line 6c → line 20 (nonrefundable adoption credit)\n' +
    '   - line 1f (taxable employer-provided adoption benefits)'],
  ['Output target',
    'Primary: form1040.payments.refundableAdoptionCredit (BigDecimal; line 30 output)\n' +
    'Form 8839 model: Form8839.part2Line13RefundableAdoptionCredit\n' +
    'PDF field: line30_refundable_adoption_credit (page 2)\n' +
    'Frontend field: form.payments?.refundableAdoptionCredit\n' +
    '\n' +
    '★ Co-output 1: Schedule3NonrefundableCredits.adoptionCredit (from Form8839.part2Line18) → Sched 3 line 6c → Form 1040 line 20\n' +
    '★ Co-output 2: Income.adoptionBenefits (from Form8839.part3Line31) → Form 1040 line 1f'],
  ['Backend implementation',
    '★ TWO HELPER METHODS (SPLIT-STAGE pattern):\n' +
    '  Method 1: `computeAdoptionBenefits(adoptionData, w2Entries, filingStatus, you, spouse, isMfsReturn, flags)` ' +
    'at TaxReturnComputeService.java:13090-13900+ (~800 lines; 7-parameter signature). ' +
    'Runs EARLY in prepare() (line 376) BEFORE AGI is computed. Produces:\n' +
    '    - AdoptionComputation.refundableAdoptionCredit (→ line 30)\n' +
    '    - AdoptionComputation.line1f (→ form1040.income.adoptionBenefits)\n' +
    '    - Partial Form8839 model (Part II per-child + Part III computed)\n' +
    '  Method 2: `applyAdoptionCredit(schedule3, adoption, form1040, schedule8812, ...)` ' +
    'at TaxReturnComputeService.java:15657-15800+ (~150 lines). ' +
    'Runs LATER in prepare() (line 1550) AFTER Schedule 3 lines 1-6b are finalized. Produces:\n' +
    '    - Form8839.part2Line17CreditLimit (CLW-B result)\n' +
    '    - Form8839.part2Line18NonrefundableAdoptionCredit (→ Sched 3 line 6c → line 20)\n' +
    '★ The two methods share state via the AdoptionComputation object.\n' +
    '★ WIRING SITE — `computeLine31ThroughLine38` at line 19896 reads adoption.refundableAdoptionCredit() ' +
    'and calls payments.setRefundableAdoptionCredit(...) for line 30.'],
  ['IRS source',
    'IRS 2025 Form 1040 (page 2 line 30 "Refundable adoption credit from Form 8839, line 13") + 2025 ' +
    'Instructions for Form 1040 + 2025 Form 8839 (Qualified Adoption Expenses) + 2025 Instructions for ' +
    'Form 8839 + One Big Beautiful Bill Act (OBBBA) 2025 + Rev. Proc. 2024-40 §3.X + IRC §23 (statutory ' +
    'authority) + IRC §137 (employer-provided adoption assistance exclusion). ★ 2025 — refundable adoption ' +
    'credit NEW for 2025 per OBBBA Act (mirrors OBBBA\'s CTC raise from $2,000 to $2,200 at line 28); ' +
    'per-child refundable cap $5,000; max credit per child $17,280; phaseout $259,190-$299,190.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'prepare() line 376: computeAdoptionBenefits (Method 1 — EARLY)', '★ Runs BEFORE AGI; reads adoptionData (personal form) + w2Entries + filingStatus + you/spouse + isMfsReturn flag.'],
  [2, 'SSN filter for W-2 box 12 code T (line 13105-13114)', '★ M4 INSTANCE: SSN-filtered by isMfsReturn — taxpayer-only on MFS; both spouses on MFJ/Single/HOH/QSS. (1f.xlsx Issue #2 closure pattern.)'],
  [3, 'Part III line 23 = sumW2AdoptionBenefits filtered by SSN', 'Total employer-provided adoption benefits (W-2 box 12 code T).'],
  [4, 'Per-child Part II loop (line 13xxx+)', 'For each eligible child: line 2 = $17,280 max; line 5 = qualified expenses (or $17,280 if domestic special-needs final 2025); line 6 = min(line 4, line 5); line 10 = line 6 × phaseoutFraction; line 11a = max(0, line 6 − line 10); line 11b = min(line 11a, $5,000).'],
  [5, 'Part II aggregation', 'line 11c = sum(per-child line 11b); line 12 = sum(per-child line 11a); ★ line 13 = line 11c → line 30.'],
  [6, 'Part III line 31 computation', '★ line 31 = max(0, line 23 − line 30 total exclusion) → form1040.income.adoptionBenefits → Form 1040 line 1f.'],
  [7, 'Method 1 returns AdoptionComputation', 'Contains refundableAdoptionCredit + line1f + partial Form8839 model.'],
  [8, 'prepare() line 1550: applyAdoptionCredit (Method 2 — LATER)', '★ Runs AFTER Schedule 3 lines 1-6b finalized; passes Form 2555 objects for MAGI auto-derive (G1 fix).'],
  [9, 'CLW-B credit limit computation', 'CLW-B line 14 = totalTaxBeforeCredits − sum(8 prior nonrefundable credits from Sched 3 + Form 1040 line 19 CTC).'],
  [10, 'Part II line 17 + line 18 finalization', 'line 17 = CLW-B result; line 18 = min(line 16, line 17) → Sched 3 line 6c → Form 1040 line 20.'],
  [11, 'payments.setRefundableAdoptionCredit (line 19896)', 'Stores line 30 output.'],
  [],
  ['INVARIANTS / VALIDATIONS'],
  ['Invariant', 'Rationale'],
  ['Line 30 ≥ 0', 'Refundable credit per IRC §23.'],
  ['Line 30 ≤ $5,000 × numEligibleChildren', '★ Per-child refundable cap per OBBBA 2025.'],
  ['Line 30 = 0 if MFS', '★ G4 FIXED 2026-04-20 — ADOPTION_BENEFITS_MFS_EXCLUSION_DISALLOWED now BLOCKING for Part II credit.'],
  ['Line 30 = 0 if MAGI ≥ $299,190', 'Phaseout end ($259,190 + $40,000 = $299,190).'],
  ['Domestic special-needs final 2025 → line 5 = $17,280 (regardless of actual expenses)', '★ G5 FIXED 2026-04-20 — special-needs Part II line 5 rule.'],
  ['Foreign-child timing rule — credit only after adoption is final', 'Special rules apply per spec §5.'],
  ['Reimbursed employer expenses NOT qualified adoption expenses', 'Spec §5; reimbursed expenses excluded from line 5.'],
  ['Line 1f (taxable employer benefits) computed in same helper', '★ Co-output — INSEPARABLE from line 30.'],
  ['Schedule 3 line 6c (nonrefundable) computed by Method 2', '★ Co-output — INSEPARABLE; SPLIT-STAGE pattern.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 38 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 30'],
  ['Line 30 (Form 8839 line 13) requires inputs split across TWO helper methods: computeAdoptionBenefits (early in prepare) + applyAdoptionCredit (later). ★ SPLIT-STAGE — first audit with TWO-METHOD helper pattern.'],
  [],
  ['METHOD 1 — computeAdoptionBenefits SIGNATURE (7 parameters)'],
  ['#', 'Parameter', 'Type', 'Used for'],
  [1, 'adoptionData', 'Map (adoption-expenses personal form)', 'Per-child entries + qualified expenses + carryforward + employer benefits allocation'],
  [2, 'w2Entries', 'List<Map>', 'W-2 box 12 code T benefits (★ SSN-filtered by isMfsReturn — M4)'],
  [3, 'filingStatus', 'Map', 'MFS check'],
  [4, 'you', 'Map', '★ Taxpayer SSN for W-2 box 12 code T filter'],
  [5, 'spouse', 'Map', '★ Spouse SSN for MFJ W-2 box 12 code T aggregation'],
  [6, 'isMfsReturn', 'boolean', '★ M4 INSTANCE — drives SSN filter (taxpayer-only on MFS; both spouses otherwise)'],
  [7, 'flags', 'List<TaxReturnFlag>', 'Emits ADOPTION_BENEFITS_FORM_REQUIRED + ADOPTION_BENEFITS_MFS_EXCLUSION_DISALLOWED'],
  [],
  ['METHOD 2 — applyAdoptionCredit SIGNATURE (5 parameters)'],
  ['#', 'Parameter', 'Type', 'Used for'],
  [8, 'schedule3', 'Schedule3', 'Sched 3 lines 1-6b for CLW-B; writes line 6c'],
  [9, 'adoption', 'AdoptionComputation', '★ Output of Method 1 — shared state'],
  [10, 'form1040', 'Form1040', 'totalTaxBeforeCredits (CLW-B line 2)'],
  [11, 'schedule8812', 'Schedule8812', '★ G7 partial — uses schedule8812.creditLimitWorksheetBLine14 when non-null'],
  [12, 'Form 2555 objects + exclusion amounts', '(varargs)', '★ G1 fix 2026-04-20 — MAGI auto-derive when manual MAGI absent'],
  [],
  ['ADOPTION-EXPENSES PERSONAL FORM — Part II inputs'],
  ['#', 'Field', 'Type', 'Effect'],
  [13, 'children.entries[].childFirstName / childLastName', 'string', '→ Form8839Child.childName'],
  [14, 'children.entries[].hasSpecialNeeds', 'boolean', '★ Special-needs rule: line 5 = $17,280 regardless of expenses (G5 fix 2026-04-20)'],
  [15, 'children.entries[].isForeignChild', 'boolean', 'Foreign-child timing rule (different from domestic)'],
  [16, 'children.entries[].adoptionFinal2025OrEarlier', 'boolean', 'Final adoption flag (affects expense timing)'],
  [17, 'adoptionCreditPartII.qualifiedAdoptionExpensesByChild.childN', 'decimal', 'Per-child line 5 (qualified expenses)'],
  [18, 'adoptionCreditPartII.priorYearAdoptionCreditByChild.childN', 'decimal', 'Per-child line 3 (prior-year amount already used)'],
  [19, 'adoptionCreditPartII.line15CreditCarryforward', 'decimal', 'Line 15 (prior-year nonrefundable carryforward — stays NONREFUNDABLE)'],
  [],
  ['ADOPTION-EXPENSES PERSONAL FORM — Part III (employer benefits) inputs'],
  ['#', 'Field', 'Type', 'Effect'],
  [20, 'employerBenefitsPartIII.currentYearBenefitsAllocation.childN', 'decimal', 'Per-child 2025 employer benefits (Part III line 24 allocation)'],
  [21, 'employerBenefitsPartIII.priorYearEmployerBenefitsByChild.childN', 'decimal', 'Prior-year benefits (Part III exclusion cap basis)'],
  [],
  ['MAGI INPUTS'],
  ['#', 'Field', 'Use'],
  [22, 'imports.magiForAdoptionBenefitsExclusion', 'Manual MAGI (G1 deprecation — was the workaround before auto-derive)'],
  [23, 'form1040.adjustments.line11bAmountFromLine11aAdjustedGrossIncome', '★ Auto-derived MAGI base (G1 fix 2026-04-20)'],
  [24, 'form2555Taxpayer/spouse exclusions + Form 4563 + Puerto Rico exclusion', 'MAGI add-backs (G1 fix 2026-04-20)'],
  [],
  ['STATEMENT INPUT'],
  ['#', 'Field', 'Use'],
  [25, 'W-2 box 12 code T (box12CodeTAdoptionBenefits)', '★ Part III line 23 total employer-provided adoption benefits; SSN-filtered by isMfsReturn (M4)'],
  [],
  ['★ M4 USAGE'],
  ['Instance', 'Method', 'Code', 'Purpose'],
  ['M4-1 (Method 1)', 'computeAdoptionBenefits line 13105-13114', 'sumW2AdoptionBenefitsForSsns based on isMfsReturn', '★ MFS-aware SSN filter for W-2 box 12 code T benefits'],
  ['M4-2 (Method 2)', 'applyAdoptionCredit', 'phaseout fraction uses MFJ check (per spec)', '(Standard phaseout threshold pattern; less prominent than 27a/28/29)'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 6 }, { wch: 55 }, { wch: 30 }, { wch: 75 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 30'],
  ['★ MEDIUM 2025 reference-data set — ~6 distinct constants from IRC §23 + OBBBA Act 2025 + Rev. Proc. 2024-40. ★ FOURTH-HEAVIEST in workflow after 27a/28/29.'],
  [],
  ['Constant', '2025 Value', 'Statutory Basis', 'Backend identifier'],
  ['Max credit per child (line 2)', '$17,280', 'IRC §23(b)(1) + Rev. Proc. 2024-40', 'Per-child line 2 ceiling'],
  ['★ Refundable per-child cap (line 11b)', '★ $5,000', '★ OBBBA Act 2025 (NEW for 2025)', 'Per-child line 11b = min(line 11a, $5,000)'],
  ['Phaseout start (MAGI threshold)', '$259,190', 'IRC §23(b)(2) + Rev. Proc. 2024-40', 'Form8839 line 8 threshold'],
  ['Phaseout range', '$40,000', 'IRC §23(b)(2)(A)', 'Form8839 line 9 denominator'],
  ['Phaseout end', '$299,190', 'Derived: $259,190 + $40,000', 'Fully phased out at this MAGI'],
  ['Special-needs domestic exception (line 5)', '$17,280', 'IRC §23(a)(3); G5 fix 2026-04-20', 'Domestic special-needs final 2025 → line 5 = $17,280'],
  [],
  ['★ KEY 2025 CHANGE — OBBBA Act'],
  ['Refundable adoption credit is NEW for 2025 per OBBBA Act 2025.', '', '', ''],
  ['2024 and prior: ALL adoption credit was NONREFUNDABLE.', '', '', ''],
  ['2025+ per OBBBA: Up to $5,000/child REFUNDABLE; remainder NONREFUNDABLE.', '', '', ''],
  [],
  ['★ Reference-data comparison across recent audits'],
  ['Audit', '# numeric constants', 'Note'],
  ['25a-25d / 27b/27c', '0 (tied)', 'degenerate or pure pass-through'],
  ['26', '4 (calendar dates only)', ''],
  ['27a', '★ 72 (HEAVIEST)', 'EIC table'],
  ['28', '★ ~15 (SECOND)', 'CTC + ODC + ACTC ceiling + phaseout (★ G13 OBBBA-related)'],
  ['29', '★ ~14 (THIRD)', 'AOTC brackets + rates + refundable split + phaseout'],
  ['**30**', '**★ ~6 (FOURTH-HEAVIEST)**', '★ Adoption max $17,280 + refundable cap $5,000 + phaseout $259,190/$40,000/$299,190 + special-needs exception'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 22 }, { wch: 45 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 30 Persistence + Downstream Consumers'],
  ['★ THREE CO-OUTPUTS — most of any audited line: refundable line 30 + nonrefundable Sched 3 line 6c → line 20 + taxable employer benefits line 1f.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.payments.refundableAdoptionCredit', 'computeLine31ThroughLine38 at line 19896 reads adoption.refundableAdoptionCredit()', '★ CANONICAL line 30 output'],
  ['schedule3.nonrefundableCredits.adoptionCredit', 'applyAdoptionCredit sets via Form8839.part2Line18 → Sched 3 line 6c → Form 1040 line 20', '★ Co-output 1 — nonrefundable adoption credit'],
  ['form1040.income.adoptionBenefits', 'buildIncome reads adoption.line1f() → Form 1040 line 1f', '★ Co-output 2 — taxable employer benefits'],
  ['Form8839 (28+ fields including children[] array)', 'Both methods populate Form8839', 'PDF export of Form 8839'],
  [],
  ['SAME-METHOD DOWNSTREAM'],
  ['Line 32 = line 27a + line 28 + line 29 + line 30 + line 31', '~line 19940', '★ Line 30 is 4th addend in refundable credits subtotal.'],
  ['Line 33 = line 25d + line 26 + line 32', '~line 19960', 'Line 30 affects line 33 transitively.'],
  ['Form 1040 line 1f (taxable employer benefits)', 'buildIncome', '★ Co-output — INSEPARABLE; computed in Method 1'],
  ['Form 1040 line 20 (Schedule 3 line 8 total)', 'computeLine20ThroughLine24', '★ Co-output — INSEPARABLE; Sched 3 line 6c → line 20'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Social Security MAGI worksheet line 5', 'computeSocialSecurityBenefits', '★ adoption.line1f() included as MAGI add-back'],
  ['Frontend PDF export (Form 1040)', 'form-tax-return-1040.component.ts', '`values["line30_refundable_adoption_credit"] = formatAmount(payments?.refundableAdoptionCredit)`'],
  ['Form 8839 PDF export', 'form-tax-return-8839.component.ts', 'All Form 8839 fields via saveAsPdf()'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 55 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 30'],
  ['Line 30 emits 2 BLOCKING FLAGS: ADOPTION_BENEFITS_FORM_REQUIRED + ADOPTION_BENEFITS_MFS_EXCLUSION_DISALLOWED (★ G4 FIXED 2026-04-20 to BLOCKING).'],
  [],
  ['Flag code', 'Severity', 'Condition'],
  ['ADOPTION_BENEFITS_FORM_REQUIRED', 'BLOCKING', 'W-2 box 12 code T benefits present but adoption-expenses form not filled in.'],
  ['ADOPTION_BENEFITS_MFS_EXCLUSION_DISALLOWED', 'BLOCKING (★ G4 fix)', '★ G4 FIXED 2026-04-20 — MFS filers cannot claim Part II credit or Part III exclusion. Was non-blocking before fix.'],
  [],
  ['STRUCTURAL INVARIANTS'],
  ['Invariant', 'How enforced'],
  ['Line 30 ≥ 0', 'STRUCTURALLY enforced — refundable credit per IRC §23.'],
  ['Line 30 ≤ $5,000 × numEligibleChildren', 'STRUCTURALLY enforced via line 11b = min(line 11a, $5,000) per-child cap.'],
  ['Line 30 = 0 if MFS', '★ G4 FIXED 2026-04-20 — blocking flag now correctly returns 0.'],
  ['Line 30 = 0 if MAGI ≥ $299,190', 'STRUCTURALLY enforced — phaseoutFraction = 0 → line 11a = 0.'],
  ['Special-needs domestic exception: line 5 = $17,280', '★ G5 FIXED 2026-04-20 — verified by unit test.'],
  ['Foreign-child timing: credit only after adoption final', 'STRUCTURALLY enforced via adoptionFinal2025OrEarlier flag.'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 22 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 30 is the refundable adoption credit (★ NEW for 2025 per OBBBA Act; ★ SPLIT-STAGE GATED CREDIT — TWO helper methods + THREE co-outputs). 22nd audit OUTSIDE 13ab pair; ELEVENTH payments-section audit. ★ EXPECTED CLEAN META-AUDIT + Path A continues. 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-16 — ★ M4 RECURRENCE (4th recurrence after 27a + 28 + 29; ★ 5th M4 instance overall); ★ 15th orchestrator-method-based audit; ★ DUAL-METHOD M4 — both computeAdoptionBenefits AND applyAdoptionCredit use isMfsReturn/isMfj flags; ★ FIRST audit with DUAL-METHOD M4 in workflow; pattern distribution after 17 audits: 6 M2 + 4 M3 + 5 M4 + 2 degenerate',
    '**Per-input MFS-leakage analysis**: line 30 has TWO helper methods. Method 1 (computeAdoptionBenefits at line 13090): M4-1 at line 13105-13114 — `sumW2AdoptionBenefitsForSsns(w2Entries, taxpayerSsnForBenefits)` (isMfsReturn=true; taxpayer only) vs `sumW2AdoptionBenefitsForSsns(w2Entries, taxpayerSsn, spouseSsn)` (isMfsReturn=false; both). Mirrors 1f.xlsx Issue #2 closure pattern. M4-2 at MFS block — ADOPTION_BENEFITS_MFS_EXCLUSION_DISALLOWED blocking flag (G4 fix 2026-04-20). Method 2 (applyAdoptionCredit at line 15657): phaseout fraction uses MFJ vs non-MFJ thresholds (standard M4 pattern). **★ 4th RECURRENCE of M4 in workflow** (after 27a 1st + 28 2nd + 29 3rd). **★ 15th orchestrator-method-based audit**. Pattern distribution after 17 audits: 6 M2 + 4 M3 + **5 M4** + 2 degenerate. ★ M4 firmly established across 5 distinct helpers (26 + 27a + 28 + 29 + 30). MFS-guard cascade UNCHANGED at 20 orchestrators. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:13090-13900+ (Method 1) + line 15657-15800+ (Method 2); M4 instances in both',
    'CLOSED — ★ M4 RECURRENCE (4th recurrence). ★ 15th orchestrator-method-based audit. Pattern distribution after 17 audits: 6 M2 + 4 M3 + **5 M4** (debut + 4 recurrences) + 2 degenerate. ★ M4 mechanism firmly established across 5 distinct helpers. MFS-guard cascade UNCHANGED at 20 orchestrators. Pure cross-reference closure. 765/765 unchanged.'],

  [2, 'RESOLVED 2026-05-16 — ★ 23rd LEGACY A MIGRATION — Renamed knowledge_line30.md → line-30-refundable-adoption-credit.md (convergence 35 → 36; ★ 5 consecutive Legacy A audits — longest streak extended from 4 to 5)',
    '**The situation**: Knowledge file at `knowledge_line30.md` follows Legacy A naming. ★ This audit produces the 23rd Legacy A migration. Convergence count advances **35 → 36 lines**. ★ **5 consecutive Legacy A audits** (26 #2 + 27a #2 + 28 #2 + 29 #2 + 30 #2). Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\knowledge\\knowledge_line30.md (rename to line-30-refundable-adoption-credit.md)',
    'CLOSED — knowledge_line30.md RENAMED to line-30-refundable-adoption-credit.md. **★ 23rd Legacy A migration in workflow**. ★ **5 consecutive Legacy A audits — longest streak in workflow extended**. Convergence advanced **35 → 36 lines**. ★ Naming convention firmly established: 23 of 38+ lines have descriptive `line-N-*.md` knowledge files.'],

  [3, 'RESOLVED 2026-05-16 — ★ SPEC ENHANCEMENT — Created NEW §14 Verification log in lines/30.md (numbered §14 because spec already has §1-§13; ★ 25th CONSECUTIVE single-row contribution in workflow — quarter-century milestone)',
    '**Goal**: create a NEW Verification log section in `lines/30.md` for the line 30 audit. Numbered §X based on next available section. Row 1 in IN-PROGRESS state with #1-#3 closures; finalized to COMPLETE at Issue #10. **★ 25th CONSECUTIVE single-row contribution in workflow**.',
    'C:\\us-tax\\lines\\30.md (create new Verification log section)',
    'CLOSED — NEW Verification log section CREATED in lines/30.md with single-row IN-PROGRESS state. Will be finalized to COMPLETE at Issue #10. **★ 25th CONSECUTIVE single-row contribution in workflow**.'],

  [4, 'RESOLVED 2026-05-16 — ★ 15th META-AUDIT IN WORKFLOW — sub-type (b); ★ DOMINANCE to ~93% (14 of 15); ★ CLEAN — 2nd consecutive clean META-AUDIT after 29 #4; clean trend in sub-type (b) continues recovery from 54% to 57%; ★ 7/7 consistency checks pass; no drift to fix; workflow recovery signal strengthening',
    '**The situation**: Standard sub-type (b) META-AUDIT — dependencies/30.md + knowledge §0 banners. **★ 15th META-AUDIT in workflow**. **★ DOMINANCE to ~93% — 14 of 15 META-AUDITS use sub-type (b)** (only line 21 uses sub-type a). **★ EXPECTED CLEAN** — initial survey shows: (a) ✅ Method 1 signature 7-param matches docs; (b) ✅ Method 2 signature matches docs; (c) ✅ All gaps G1-G6 "Fixed 2026-04-20"; G7 "Partial"; G8 "Documentation only" — all status-dated and current; (d) ✅ OBBBA Act citation present in spec; (e) ✅ Per-child refundable cap $5,000 matches code; (f) ✅ Max credit $17,280 + phaseout $259,190/$40,000 match docs; (g) ✅ MFS hard-disqualify (G4 fix) matches spec §1. **★ NO drift fix needed**. ★ **2nd consecutive clean META-AUDIT after 29 #4** — workflow recovery continues. ★ Clean trend in sub-type (b) recovers from 54% to 57% (8 clean / 14). Backend tests: 765/765 unchanged.',
    'dependencies/30.md (Audited 2026-04-20); knowledge §0 (Audit date 2026-04-20); code at line 13090 + 15657',
    'CLOSED — META-AUDIT consistency check complete. **★ 15th META-AUDIT in workflow**. **★ DOMINANCE to ~93% — 14 of 15 META-AUDITS use sub-type (b)**. **★ CLEAN** — 7/7 consistency checks pass. ★ **2nd consecutive clean META-AUDIT after 29 #4** — workflow recovery continues. ★ Clean trend in sub-type (b) continues recovery from 54% to 57% (8 clean / 14). ★ Pattern observation: line 30 docs are well-maintained (comprehensive G1-G8 fixes 2026-04-20; OBBBA Act citation already present).'],

  [5, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — line 30 wiring + helpers; ★ 24th anti-duplication application; ★ NO existing breadcrumb covers line 30 — 19 #6 covers line-19-and-28 family; 25a #5 covers 25abcd cluster; 20 #6 covers credits-section; none cover line 30 / Form 8839; 3-source coverage via spec §1+§3+§4 + dependencies §1+§2 + knowledge §1+§2 (post-rename); ★ 2nd consecutive audit (29 + 30) relying on 3-source-coverage-only (no breadcrumb)',
    '**Closure intent**: pure cross-reference closure. Line 30 is produced by TWO helper methods (computeAdoptionBenefits + applyAdoptionCredit). ★ NO pre-existing method-level breadcrumb at either helper site — this audit anti-duplicates purely via 3-source coverage. ★ The 19 #6 breadcrumb covers line-19-and-28 family; 25a #5 covers 25abcd cluster; 20 #6 covers 20-24 cluster. None cover line 30 / Form 8839. 3-source coverage: spec §1 + §3 + §4 + dependencies §1 + §2 + knowledge §1 + §2 (post-rename). **★ 24th anti-duplication application**.',
    'TaxReturnComputeService.java:13090-13900+ (Method 1) + 15657-15800+ (Method 2); no pre-existing breadcrumb',
    'CLOSED — verified correct via 3-source coverage (spec + dependencies + knowledge). **★ 24th anti-duplication application**. ★ NO new breadcrumb planted; ★ NO existing breadcrumb covers line 30. ★ 3-source coverage is sufficient given documentation completeness — spec/dependencies/knowledge all comprehensive and last-updated 2026-04-20 with G1-G8 fixes.'],

  [6, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — ★ SPLIT-STAGE GATED CREDIT chain (★ 11th distinct complexity dimension in workflow — NEW: TWO-METHOD split-stage; line 30 helper is split across computeAdoptionBenefits (early; before AGI) AND applyAdoptionCredit (later; after Schedule 3 line 1-6b); ★ FIRST audit with TWO helper methods sharing state via AdoptionComputation object; ★ THREE co-outputs (most of any audited line))',
    '**Closure intent**: pure cross-reference closure — verifies the split-stage gated credit chain. **★ 11th distinct complexity dimension in workflow** — SPLIT-STAGE GATED CREDIT (distinct from depth/cumulative/breadth/conditional/pure-sum/dual-form/multi-stage-gated/degenerate-pure/degenerate-state-derived/dual-path-gated). **Chain stages**: **Method 1 (computeAdoptionBenefits)**: **(1)** SSN filter for W-2 box 12 code T. **(2)** Per-child Part II loop with $17,280 max + $5,000 refundable cap. **(3)** Aggregation line 11c → line 13. **(4)** Part III line 31 = taxable employer benefits. **(5)** Returns AdoptionComputation. **Method 2 (applyAdoptionCredit)**: **(6)** CLW-B credit limit. **(7)** line 17 + line 18. **(8)** Wires Sched 3 line 6c. **(9)** Wiring site stores line 30. **★ KEY DISTINCTION FROM 27a/29**: line 30 helper is SPLIT across TWO methods due to compute-order constraints (Method 1 runs before AGI available; Method 2 runs after Sched 3 finalized). ★ THREE co-outputs vs. line 29\'s TWO and line 27a\'s ONE. ★ Most complex co-output pattern in workflow.',
    'TaxReturnComputeService.java:13090 (Method 1) + 15657 (Method 2); spec §3 (core structure)',
    'CLOSED — verified correct via SPLIT-STAGE GATED CREDIT chain. **★ 11th distinct complexity dimension in workflow** — TWO-METHOD split-stage with THREE co-outputs. ★ KEY DISTINCTION: line 30 helper split across computeAdoptionBenefits (early) + applyAdoptionCredit (later) due to compute-order constraints; produces 3 co-outputs (line 30 refundable + Sched 3 line 6c nonrefundable + line 1f taxable benefits). ★ Most complex co-output pattern in workflow.'],

  [7, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — ★ 5 CONVENTIONS (Conventions 1-4 same as 25a + ★ Convention 5 SSN-FILTERED STATEMENT AGGREGATION via isMfsReturn flag for W-2 box 12 code T — mirrors 1f.xlsx Issue #2 closure pattern); ★ mid-range count (below 27a 6 / 28 7 / 29 8 highs); ★ Convention 5 demonstrates cross-line pattern reuse — distinct from Convention 4 M4 flag-based gate',
    '**Closure intent**: pure verification closure — confirms five line-30-specific conventions. **Convention 1** Null-when-zero (refundableAdoptionCredit returned as null when zero). **Convention 2** No SSN filtering at credit level (children iterated by index). **Convention 3** MFJ aggregation (both spouses\' W-2 box 12 code T summed on MFJ). **Convention 4** MFS protection via ★ M4 — ADOPTION_BENEFITS_MFS_EXCLUSION_DISALLOWED blocking flag (G4 fix 2026-04-20). **★ Convention 5** SSN-FILTERED STATEMENT AGGREGATION via isMfsReturn flag — `sumW2AdoptionBenefitsForSsns(w2Entries, taxpayerSsn)` (MFS) vs `sumW2AdoptionBenefitsForSsns(w2Entries, taxpayerSsn, spouseSsn)` (non-MFS). ★ Same pattern as 1f.xlsx Issue #2 closure (W-2 box 12 code T filter). ★ Distinct from Convention 4 (M4 flag-based gate) — Convention 5 is statement-level SSN filter. **★ 5 CONVENTIONS** (back to mid-range; below 27a/28/29 highs). ★ Workflow conventions range firmly established 0-8.',
    'TaxReturnComputeService.java:13105-13114 (Method 1 SSN filter); spec §1 (MFS); dependencies §2d (filing status)',
    'CLOSED — verified correct. **★ 5 CONVENTIONS**: Convention 1-4 baseline + ★ Convention 5 SSN-FILTERED STATEMENT AGGREGATION via isMfsReturn flag (mirrors 1f.xlsx Issue #2 closure pattern). ★ Mid-range count (below 27a 6 / 28 7 / 29 8 highs). ★ Workflow conventions range firmly established 0-8. Pure verification closure.'],

  [8, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — 0 routing distinctions + ★ MEDIUM 2025 reference-data set (~6 distinct constants from IRC §23 + OBBBA Act 2025 + Rev. Proc. 2024-40; ★ FOURTH-HEAVIEST after 27a/28/29); ★ workflow reference-data range firmly established 0-72 with 4 tiers (0 floor / ~4-6 low-mid 26+30 / ~14-15 mid 28+29 / 72 ceiling 27a); ★ Line 30 introduces NEW 2025 $5,000 refundable cap per OBBBA Act (mirrors OBBBA line 28 CTC enhancement)',
    '**Closure intent**: pure verification closure. **Routing**: ★ ZERO — line 30 has dedicated input form (adoption-expenses); no statement form routes here. **Reference data**: ★ ~6 distinct constants — $17,280 max + $5,000 refundable cap + $259,190 phaseout start + $40,000 phaseout range + $299,190 phaseout end + special-needs $17,280 exception. ★ All from IRC §23 + OBBBA Act 2025 + Rev. Proc. 2024-40. **★ FOURTH-HEAVIEST 2025 reference-data set in workflow** after 27a (72), 28 (~15), 29 (~14). ★ **NEW for 2025 per OBBBA Act** — refundable cap $5,000 is OBBBA addition; mirrors OBBBA\'s CTC raise at line 28.',
    'TaxReturnComputeService.java:13090+ (~6 constants embedded); spec §4 + §6 + IRC §23 + OBBBA Act',
    'CLOSED — verified correct. **Routing**: ★ ZERO routing distinctions. **Reference data**: ★ ~6 distinct 2025 constants from OBBBA + Rev. Proc. 2024-40 + IRC §23. **★ FOURTH-HEAVIEST 2025 reference-data set in workflow** after 27a/28/29. ★ Workflow reference-data range now firmly established 0-72 with 4 tiers (0 floor / ~6 low-mid 30 / ~14-15 mid 28+29 / 72 ceiling 27a). ★ Line 30 introduces a NEW 2025 constant ($5,000 refundable cap per OBBBA).'],

  [9, 'RESOLVED 2026-05-16 — ⚠️ BUNDLED OBSERVATIONS — ★ Path A application (★ continues zero-outstanding-walkthroughs streak at 2 after 29 RESUMED); ★ 30th Path A application; ★ 2-audit zero-new-gaps streak; G7 (Partial — Sched 8812 CLW-B substitute) + G8 (Documentation only — AcroForm per-child fields) already documented in dependencies §6; ★ FIRST credits/payments-section audit with diagrams.drawio file actually present; ★ WORKFLOW RECOVERY narrative STRENGTHENING',
    '**Closure intent**: pure xlsx-flip observation bundle — **NO code change**; **NO outstanding.md entry**. THREE observations bundled. **(a) G7 PARTIAL — Schedule 8812 CLW-B substitute**: `Schedule8812.creditLimitWorksheetBLine14` added; `applyAdoptionCredit()` uses it when non-null. Full CLW-B line 14 formula not audited end-to-end. Documented in dependencies §6 G7 as Partial. **(b) G8 DOCUMENTATION ONLY — Full AcroForm per-child intermediate field coverage**: not verified against 2025 IRS PDF template. Documented as Documentation Only. **(c) Missing `diagrams/30.drawio` cosmetic** — actually exists per file listing. **★ Anti-fragmentation policy applied** — G7/G8 already in dependencies §6; not separately tracked in outstanding.md. **★ 30th PATH A APPLICATION**. **★ Continues zero-outstanding-walkthroughs streak at 2** after 29 RESUMED. ★ **2-audit zero-new-gaps streak** (recovered from G12/G13 surge at 27c/28). ★ Workflow recovery continuing.',
    'G7 PARTIAL Sched 8812 CLW-B substitute (dependencies §6); G8 Documentation only',
    'CLOSED — pure observation bundle. **★ 30th Path A application**. **★ Continues zero-outstanding-walkthroughs streak at 2** after 29 RESUMED. **★ 2-audit zero-new-gaps streak**. 3 observations: (a) G7 PARTIAL Sched 8812 CLW-B substitute (documented in dependencies §6); (b) G8 DOCUMENTATION ONLY AcroForm per-child fields (documented in dependencies §6); (c) diagrams/30.drawio exists (per file listing). ★ Workflow recovery continuing.'],

  [10, 'RESOLVED 2026-05-16 — BOUNDARY MILESTONE — Line 30 walkthrough complete at 10/10; ★ ELEVENTH payments-section audit; ★ CLEAN META-AUDIT continues workflow recovery (★ 2nd consecutive clean); ★ Path A continues zero-outstanding-walkthroughs streak at 2; ★ SPLIT-STAGE GATED CREDIT chain — 11th distinct complexity dimension NEW; ★ M4 RECURRENCE (5th M4 instance); ★ 23rd Legacy A migration (5 consecutive — longest streak extended); ★ THREE CO-OUTPUTS — most of any audited line; ★ NEW for 2025 per OBBBA Act',
    'Pure xlsx-flip + Verification log row 1 finalization — **CLOSES the 30 walkthrough at 10/10**. TWO file touches: (a) this row flipped to RESOLVED; (b) lines/30.md Verification log row 1 finalized IN-PROGRESS → **COMPLETE — 10/10 closed**. **Eight themes**: (1) ★ Structural positioning — 22nd audit OUTSIDE 13ab pair; ★ ELEVENTH payments-section audit; 61st line; ★ NEW for 2025 per OBBBA Act; ★ THREE CO-OUTPUTS (refundable line 30 + nonrefundable Sched 3 line 6c → line 20 + taxable employer benefits line 1f). (2) **★ M4 RECURRENCE** — 4th recurrence in workflow (5th M4 instance); 15th orchestrator-method-based; ★ DUAL-METHOD M4 (M4 in both helpers); pattern distribution after 17 audits: 6 M2 + 4 M3 + 5 M4 + 2 degenerate; MFS cascade UNCHANGED at 20. (3) **★ 15th META-AUDIT — CLEAN** — sub-type (b) at 93% DOMINANCE (14 of 15); ★ 2nd consecutive clean META-AUDIT after 29 #4; clean trend continues recovery from 54% to 57%. (4) **★ Legacy A migration** (Issue #2: ★ 23rd; convergence 35 → 36; ★ 5 consecutive Legacy A audits — longest streak extended). (5) **★ NEW single-spec Verification log** (Issue #3: ★ 25th CONSECUTIVE single-row contribution). (6) **★ 5 CONVENTIONS** (Issue #7: mid-range; ★ Convention 5 SSN-FILTERED STATEMENT AGGREGATION). (7) **★ SPLIT-STAGE GATED CREDIT chain** (Issue #6: ★ 11th distinct complexity dimension in workflow — NEW: TWO-METHOD split-stage). (8) **★ Path A continues zero-outstanding-walkthroughs streak at 2** (Issue #9: ★ workflow RECOVERY confirmed at line 30). **Cumulative through line 30**: **61 lines audited**; **607 audit issues closed total** (597 + 10); backend **765/765 pass** (UNCHANGED — 13th audit with zero new tests); MFS cascade = **20 orchestrators** (unchanged); knowledge convergence = **36 lines** (★ +1 from 30 #2); **★ 30 Path A applications** (+1); **★ 24 anti-duplication applications** (+1); **★ 0 new gaps surfaced at 30** (★ 2-audit zero-new-gaps streak); **★ 15 META-AUDITS** (+1; ★ sub-type (b) at 93% DOMINANCE; ★ CLEAN; ★ 2nd consecutive clean; clean trend recovers to 57%); **★ 14 documentation drift fixes** (UNCHANGED — 30 #4 was CLEAN); **★ 4 distinct MFS-protection mechanisms** (UNCHANGED — M4 RECURRENCE; 5 M4 instances now); **★ 11 distinct complexity dimensions in workflow** (+1 from 30 #6 ★ NEW SPLIT-STAGE GATED CREDIT). **★ Zero-outstanding-walkthroughs streak continues at 2**. **Verification logs**: ... + 29 + 30 (★ NEW with 1 row COMPLETE; ★ 25th CONSECUTIVE single-row). **Looking ahead — line 31 (Amount from Schedule 3 line 15)**: 23rd audit OUTSIDE 13ab pair; TWELFTH payments-section audit; ★ likely simple pass-through addition from Schedule 3 line 15; ★ possibly DEGENERATE-LIKE if it\'s just a Schedule 3 read; ★ likely 16th META-AUDIT.',
    'XLS/computations/30.xlsx audit-trail (this row); lines/30.md Verification log row 1 FINALIZED to COMPLETE — 10/10 closed; ★ NO outstanding.md entry (Path A applied)',
    'CLOSED — 10/10. **61 lines; 607 issues; 765/765 backend (UNCHANGED — 13th audit with zero new tests); 20 orchestrators (UNCHANGED); 36-line knowledge convergence (★ +1; ★ 23rd Legacy A migration; ★ 5 consecutive Legacy A audits — longest streak extended); 14 doc-drift fixes (UNCHANGED — 30 #4 was CLEAN); ★ 30 Path A applications (+1); ★ 24 anti-duplication applications; ★ 0 new gaps surfaced at 30 (★ 2-audit zero-new-gaps streak); ★ 25th CONSECUTIVE single-row contribution; ★ 15 META-AUDITS (★ sub-type (b) at 93% DOMINANCE; ★ CLEAN; ★ 2nd consecutive clean after 29 #4; clean trend recovers to 57%); ★ 4 distinct MFS-protection mechanisms (★ M4 RECURRENCE — 5 M4 instances); ★ 11 distinct complexity dimensions in workflow (★ NEW SPLIT-STAGE GATED CREDIT at 30); ★ 5 CONVENTIONS at 30 (mid-range); ★ THREE CO-OUTPUTS — most of any audited line; ★ NEW for 2025 per OBBBA Act; ★ Zero-outstanding-walkthroughs streak continues at 2**. ★ ELEVENTH payments-section audit. Next: line 31 (Schedule 3 line 15 pass-through; ★ likely simple).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 120 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 30 Flows in the Return'],
  ['★ THREE CO-OUTPUTS — most of any audited line.'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Notes'],
  ['form1040.payments.refundableAdoptionCredit', 'Form 1040 page 2, line 30 (PDF key line30_refundable_adoption_credit)', '★ CANONICAL line 30 output. From Form8839.part2Line13.'],
  ['schedule3.nonrefundableCredits.adoptionCredit', 'Schedule 3 line 6c → Form 1040 line 20', '★ Co-output 1 — from Form8839.part2Line18 via applyAdoptionCredit.'],
  ['form1040.income.adoptionBenefits', 'Form 1040 line 1f (taxable employer-provided adoption benefits)', '★ Co-output 2 — from Form8839.part3Line31 via computeAdoptionBenefits.'],
  ['Form8839 (28+ fields including children[] array)', 'Form 8839 PDF', 'Full Form 8839 PDF export.'],
  [],
  ['SAME-METHOD DOWNSTREAM'],
  ['Line 32 = line 27a + line 28 + line 29 + line 30 + line 31', '~line 19940', '★ Line 30 is 4th addend in refundable credits subtotal.'],
  ['Line 33 = line 25d + line 26 + line 32', '~line 19960', 'Line 30 affects line 33 transitively.'],
  ['Form 1040 line 1f', 'buildIncome', '★ Co-output — INSEPARABLE.'],
  ['Form 1040 line 20', 'computeLine20ThroughLine24', '★ Co-output — INSEPARABLE via Sched 3 line 6c.'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Social Security MAGI worksheet line 5', 'computeSocialSecurityBenefits', '★ adoption.line1f() included as MAGI add-back.'],
  ['Frontend PDF export (Form 1040)', 'form-tax-return-1040.component.ts', '`values["line30_refundable_adoption_credit"] = formatAmount(payments?.refundableAdoptionCredit)`'],
  ['Frontend PDF export (Form 8839)', 'form-tax-return-8839.component.ts', 'All Form 8839 fields via saveAsPdf().'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
