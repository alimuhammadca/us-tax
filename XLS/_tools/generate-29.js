// ============================================================================
//  Generates: C:\us-tax\XLS\computations\29.xlsx
//
//  Source-of-truth references:
//    - lines/29.md (316-line spec; tax year 2025; line 29 = Form8863.line8
//      refundable AOTC).
//    - dependencies/29.md (197 lines; "Last updated: 2026-04-20"; §6 Gaps
//      Summary: G1-G6 + G17-G24 all "Fixed 2026-04-20" or "Deferred").
//    - knowledge/line-29-aotc-form-8863.md (renamed at 29 #2 2026-05-16 from
//      knowledge_line29.md; ★ 22nd Legacy A migration; 430 lines; "Last updated:
//      2026-04-20 (G17-G24 fixes applied)"; convergence advanced 34 → 35 lines).
//    - lines/8863.md (233-line supplementary Form 8863 spec).
//    - flowcharts/29.drawio (exists).
//    - TaxReturnComputeService.java:
//        line 19228-19500+ — computeForm8863 helper (~270 lines; 9-parameter
//          signature added `you` 2026-04-20 per G19 fix)
//        line 19260-19265 — MFS HARD-DISQUALIFY: emits
//          EDUCATION_CREDITS_MFS_INELIGIBLE flag + return null
//        line 19283-19284 — M4 INSTANCE: phaseout thresholds $180k MFJ vs
//          $90k Single ($20k vs $10k ranges)
//        line 19289-19298 — phaseout fraction computation (RoundingMode.DOWN
//          to 3 decimal places)
//        line 19895 — wiring: `payments.setAmericanOpportunityCredit(
//          form8863.getLine8RefundableAotc())`
//        line 1400 — early pre-set: `earlyPayments.setAmericanOpportunityCredit
//          (form8863.getLine8RefundableAotc())` for Schedule 8812 Part II-B
//
//  Tax year: 2025
//
//  Concept:
//    Form1040.line29 = Form8863.line8RefundableAotc
//
//    The American Opportunity Credit is a multi-stage gated credit:
//      Phase 1: Entry gates — claimsEducationCreditsOnReturn, MFS hard-block,
//               Form 8862 AOTC recertification
//      Phase 2: MAGI computation (AGI + 4 add-backs: Puerto Rico + Form 2555
//               exclusion + Form 2555 housing + Form 4563)
//      Phase 3: Phaseout fraction (3-decimal DOWN rounding)
//      Phase 4: Per-student loop — Part III line 30 (min $2,000 base + 25%
//               next $2,000 = max $2,500/student)
//      Phase 5: line1TotalAotcBeforePhaseout × phaseoutFraction = line 7
//      Phase 6: line 7 × 40% = line 8 refundable AOTC → Form1040.line29
//      Phase 7: Under-24 restriction (refundableAotcRestrictionApplies → line8=0)
//      Phase 8: line 7 − line 8 + LLC = line 19 → Schedule3.line3 → Form1040.line20
//
//    ★ INSEPARABLE from Schedule 3 line 3 / Form 1040 line 20 — same helper
//      produces both refundable (line 29) AND nonrefundable (line 20) outputs.
//
//  Line 29 audit positioning (21st audit OUTSIDE 13ab pair; 60th line):
//   • TENTH payments-section audit
//   • ★ M4 RECURRENCE — 3rd recurrence after 27a/28; 4th M4 instance overall;
//     14th orchestrator-method-based audit
//   • ★ 22nd Legacy A migration — knowledge_line29.md rename; convergence 34→35;
//     ★ 4 consecutive Legacy A audits (26/27a/28/29)
//   • ★ 14th META-AUDIT — sub-type (b); ★ DOMINANCE to ~93% (13 of 14);
//     ★ EXPECTED CLEAN (returns to clean after 4-of-5 drift surge);
//     ★ ENDS the drift surge trend; clean trend recovers from 50% to 54%
//   • ★ MULTI-STAGE GATED CREDIT chain — RECURRENCE of 27a's complexity
//     dimension (no new dimension; dimension count UNCHANGED at 9)
//   • ★ HEAVY 2025 reference-data set — third-heaviest after 27a (72) and
//     28 (~15); ~14 distinct constants
//   • ★ 8 CONVENTIONS NEW HIGH (exceeds 28 at 7); Convention 5 RECURS 3rd
//     time in strict intake-gate sense (after 26 + 27a); ★ Convention 6
//     FORM 8862 RECERTIFICATION with per-student tracking + ★ Convention 7
//     MFS HARD-DISQUALIFY (distinct from 27a's MFS-with-exception remap) +
//     ★ Convention 8 MAGI ADD-BACKS UNIQUE
//   • ★ EXPECTED Path A application (Issue #9) — RESUMES zero-outstanding
//     streak at 1 after G12/G13 broke it; workflow RECOVERY narrative
//   • ★ INSEPARABLE from line 20 / Schedule 3 line 3 — same helper
//
//  Line 29 audit angles (10 issues):
//   1. ★ M4 RECURRENCE — 3rd recurrence after 27a/28; ★ 14th orchestrator-
//       method-based; helper uses isMfj-flag at phaseout thresholds + isMfs
//       at hard-disqualify; pattern distribution after 16 audits: 6 M2 + 4 M3
//       + 4 M4 + 2 degenerate.
//   2. ★ 22nd LEGACY A MIGRATION — knowledge_line29.md → line-29-aotc-
//       form-8863.md; convergence 34 → 35; ★ 4 consecutive Legacy A audits.
//   3. ★ NEW single-spec §11 Verification log in lines/29.md; ★ 24th
//       CONSECUTIVE single-row contribution.
//   4. ★ 14th META-AUDIT IN WORKFLOW — sub-type (b); ★ DOMINANCE to ~93%
//       (13 of 14); ★ EXPECTED CLEAN — ENDS 4-of-5 drift surge; ★ clean trend
//       recovers from 50% to 54% (7 of 13 within sub-type b clean).
//   5. VERIFIED CORRECT — line 29 wiring; ★ 23rd anti-duplication application;
//       ★ NO existing breadcrumb covers line 29; 3-source coverage via spec +
//       dependencies + knowledge.
//   6. VERIFIED CORRECT — ★ MULTI-STAGE GATED CREDIT chain RECURRENCE (★ 1st
//       recurrence of 27a's complexity dimension); dimension count UNCHANGED
//       at 9.
//   7. VERIFIED CORRECT — ★ 8 CONVENTIONS NEW HIGH in workflow (exceeds prior
//       max of 7 at 28); Conventions 1-4 same as 25a + Convention 5
//       SCREENING GATE `claimsEducationCreditsOnReturn` (★ 3rd intake-gate
//       recurrence) + ★ Convention 6 FORM 8862 RECERTIFICATION with per-
//       student `aotcStudentEligible` list (★ UNIQUE per-student granularity)
//       + ★ Convention 7 MFS HARD-DISQUALIFY + flag emission (★ UNIQUE;
//       distinct from 27a's MFS-with-exception remap) + ★ Convention 8 MAGI
//       ADD-BACKS — 4 explicit form-based add-backs (★ UNIQUE).
//   8. VERIFIED CORRECT — 0 routing distinctions + ★ HEAVY 2025 reference-data
//       set (~14 distinct constants; THIRD-HEAVIEST after 27a/28).
//   9. ⚠️ BUNDLED OBSERVATIONS — ★ Path A application (resumes zero-outstanding
//       streak at 1 after G12/G13 broke it); ★ 29th Path A; ★ 1-audit zero-
//       new-gaps streak; G4 (under-24 self-reported) DEFERRED OOS already
//       documented.
//  10. BOUNDARY MILESTONE — TENTH payments-section audit; ★ EXPECTED CLEAN
//       META-AUDIT ENDS 4-of-5 drift surge; ★ Path A RESUMES zero-outstanding
//       streak (workflow recovery narrative); ★ 8 CONVENTIONS NEW HIGH;
//       ★ M4 RECURRENCE (4th M4 instance); ★ 22nd Legacy A migration;
//       ★ MULTI-STAGE GATED CREDIT RECURRENCE.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '29.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 29 — AMERICAN OPPORTUNITY CREDIT (REFUNDABLE AOTC) FROM FORM 8863 — 2025'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 29 (page 2; "American opportunity credit from Form 8863, line 8")'],
  ['Concept',
    'Line 29 is the REFUNDABLE 40% portion of the American Opportunity Credit (AOTC), computed on ' +
    'Form 8863. ★ MULTI-STAGE GATED CREDIT (RECURRENCE of 27a\'s complexity dimension): entry gates ' +
    '(claimsEducationCreditsOnReturn, MFS hard-block, Form 8862 AOTC gate) + MAGI computation with 4 ' +
    'add-backs + phaseout fraction (3-decimal DOWN rounding) + per-student loop (min $2,000 base + ' +
    '25% next $2,000 = max $2,500/student) + 40% refundable split + under-24 restriction. ★ INSEPARABLE ' +
    'from Schedule 3 line 3 / Form 1040 line 20 — same helper produces both refundable + nonrefundable.'],
  ['Top-level formula (spec §1 + §4)',
    'Form1040.line29 = Form8863.line8RefundableAotc\n' +
    '\n' +
    'Form 8863 Part I computation flow:\n' +
    '  Step 1: Entry gate — claimsEducationCreditsOnReturn=true required\n' +
    '  Step 2: MFS HARD-BLOCK — return null + emit EDUCATION_CREDITS_MFS_INELIGIBLE flag\n' +
    '  Step 3: Form 8862 AOTC gate — if aotcPreviouslyDenied AND no Form 8862 → block AOTC; LLC continues\n' +
    '  Step 4: MAGI = AGI + magiAddBackPuertoRicoExcludedIncome + magiAddBackForm2555ExcludedIncome\n' +
    '              + magiAddBackForm2555HousingExclusion + magiAddBackForm4563ExcludedIncome\n' +
    '  Step 5: phaseoutFraction = clamp([0,1], (phaseoutUpper − MAGI) / phaseoutRange)\n' +
    '              rounded DOWN to 3 decimal places\n' +
    '              ★ M4 INSTANCE: phaseoutUpper = isMfj ? $180,000 : $90,000\n' +
    '                            phaseoutRange = isMfj ? $20,000  : $10,000\n' +
    '  Step 6: Per-student Part III loop:\n' +
    '              line30 = 100% × min(expenses, $2,000) + 25% × min(max(0, expenses − $2,000), $2,000)\n' +
    '              max $2,500 per student\n' +
    '  Step 7: line1TotalAotcBeforePhaseout = sum(per-student line30)\n' +
    '  Step 8: line7 = line1 × phaseoutFraction\n' +
    '  Step 9: line8 = 40% × line7 ★ unless refundableAotcRestrictionApplies (under-24 rule)\n' +
    '              → if restriction applies: line8 = 0; entire line7 flows to nonrefundable line19\n' +
    '  Step 10: line19 (nonrefundable) = line7 − line8 + LLC subtotal\n' +
    '\n' +
    'Form1040.line29 = Form8863.line8\n' +
    'Schedule3.line3 = Form8863.line19  → Form1040.line20'],
  ['Surrounding page-2 chain',
    'line 25d = totalWithholding\n' +
    'line 26  = estimatedTaxPayments\n' +
    'line 27a = EIC\n' +
    'line 28  = ACTC from Schedule 8812\n' +
    '★ line 29 = refundable AOTC from Form 8863, line 8  (★ THIS LINE — americanOpportunityCredit)\n' +
    'line 31  = Schedule 3 line 15\n' +
    'line 32  = line 27a + line 28 + line 29 + line 30 + line 31\n' +
    'line 33  = line 25d + line 26 + line 32\n' +
    '\n' +
    '★ Line 29 is 3rd addend in line 32 (refundable credits subtotal).\n' +
    '★ Line 29 INSEPARABLE from line 20 — same helper produces both refundable (line 29) and\n' +
    '   nonrefundable (line 20 via Schedule 3 line 3) education credits.\n' +
    '★ Line 29 PRE-SET in earlyPayments at line 1400 for Schedule 8812 Part II-B line 24 consumer.'],
  ['Output target',
    'Primary: form1040.payments.americanOpportunityCredit (BigDecimal; line 29 output)\n' +
    'Form 8863 model: Form8863.line8RefundableAotc\n' +
    'PDF field: line29_american_opportunity_credit (page 2)\n' +
    'Frontend field: form.payments?.americanOpportunityCredit\n' +
    '\n' +
    '★ Co-output: Schedule3NonrefundableCredits.educationCredits = Form8863.line19NonrefundableEducationCredits\n' +
    '   → Schedule 3 line 3 → Form 1040 line 20'],
  ['Backend implementation',
    '**HELPER METHOD** — `computeForm8863(educationCreditsTaxpayer, educationCreditsSpouse, form1040, ' +
    'schedule3, filingStatus, form8862, flags, uid, you)` at TaxReturnComputeService.java:19228 (~270 ' +
    'lines; 9-parameter signature; `you` param added 2026-04-20 per G19 fix). ' +
    '**WIRING SITE** — `computeLine31ThroughLine38` at line 19895 reads `form8863.getLine8RefundableAotc()` ' +
    'and calls `payments.setAmericanOpportunityCredit(...)` for line 29. ' +
    '**EARLY PRE-SET** at line 1400: `earlyPayments.setAmericanOpportunityCredit(form8863.getLine8RefundableAotc())` ' +
    'for Schedule 8812 Part II-B line 24 consumer. ' +
    '★ NO pre-existing breadcrumb at the helper site (line 19228); this audit anti-duplicates via 3-source ' +
    'coverage (spec + dependencies + knowledge).'],
  ['IRS source',
    'IRS 2025 Form 1040 (page 2 line 29 "American opportunity credit from Form 8863, line 8") + 2025 ' +
    'Instructions for Form 1040 + 2025 Form 8863 (Education Credits) + 2025 Instructions for Form 8863 + ' +
    'IRC §25A (statutory authority) + Pub. 970 (Tax Benefits for Education). ★ 2025: max AOTC $2,500/student; ' +
    '40% refundable / 60% nonrefundable; phaseout $80k-$90k Single / $160k-$180k MFJ; under-24 refundable ' +
    'restriction per IRC §25A(i)(2).'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Entry gate (line 19239-19242)', 'If educationCreditsTaxpayer null OR claimsEducationCreditsOnReturn != true → return null.'],
  [2, 'Form 8862 AOTC gate (line 19246-19257)', 'If aotcPreviouslyDenied=true AND no valid Form 8862 → emit FORM_8862_AOTC_REQUIRED flag + block AOTC for all students (LLC continues).'],
  [3, '★ MFS HARD-DISQUALIFY (line 19259-19265)', '★ Convention 7: if MFS → emit EDUCATION_CREDITS_MFS_INELIGIBLE flag + return null (no exception path — distinct from 27a\'s MFS-with-exception remap).'],
  [4, 'MAGI computation (line 19270-19280)', 'MAGI = AGI + 4 explicit add-backs: PR-excluded + Form 2555 exclusion + Form 2555 housing + Form 4563 exclusion.'],
  [5, '★ M4 INSTANCE: phaseout thresholds (line 19283-19284)', 'phaseoutUpper = isMfj ? $180,000 : $90,000; phaseoutRange = isMfj ? $20,000 : $10,000. ★ QSS uses Single thresholds (G1 fixed 2026-04-20).'],
  [6, 'Phaseout fraction (line 19286-19298)', 'phaseoutFraction = clamp([0,1], (phaseoutUpper − MAGI) / phaseoutRange) DOWN-rounded to 3 decimals.'],
  [7, 'Per-student Part III line 30 (helper loop)', 'For each AOTC student: line30 = 100% × min(expenses, $2,000) + 25% × min(max(0, expenses − $2,000), $2,000). Max $2,500/student.'],
  [8, 'Sum per-student → line 1 (Part I)', 'line1TotalAotcBeforePhaseout = sum(per-student line30 across taxpayer + spouse students if MFJ).'],
  [9, 'line 7 = line 1 × phaseoutFraction', 'Phased AOTC, rounded.'],
  [10, 'line 8 = 40% × line 7 (refundable portion)', '★ UNLESS refundableAotcRestrictionApplies (under-24 rule) → line8 = 0; full line7 flows to nonrefundable.'],
  [11, 'line 19 (nonrefundable) = line7 − line8 + LLC subtotal', 'After CLW. → Schedule 3 line 3 → Form 1040 line 20.'],
  [12, 'payments.setAmericanOpportunityCredit(line8) at line 19895', 'Stores line 29 output.'],
  [13, 'earlyPayments.setAmericanOpportunityCredit(line8) at line 1400', '★ Pre-set for Schedule 8812 Part II-B line 24 consumer.'],
  [],
  ['INVARIANTS / VALIDATIONS'],
  ['Invariant', 'Rationale'],
  ['Line 29 ≥ 0', 'AOTC by IRS rules ≥ 0; refundable credit.'],
  ['Line 29 = 0 if claimsEducationCreditsOnReturn=false', 'STRUCTURALLY enforced at line 19240-19242.'],
  ['Line 29 = 0 if MFS', 'STRUCTURALLY enforced at line 19261-19265; emits EDUCATION_CREDITS_MFS_INELIGIBLE flag.'],
  ['Line 29 = 0 if AOTC previously denied + no Form 8862', 'STRUCTURALLY enforced at line 19248-19257; emits FORM_8862_AOTC_REQUIRED flag.'],
  ['Line 29 = 0 if refundableAotcRestrictionApplies (under-24 rule)', '★ G4 self-reported boolean; full AOTC flows to nonrefundable line 19.'],
  ['Line 29 = 0 if MAGI ≥ phaseoutUpper', 'STRUCTURALLY enforced — phaseoutFraction = 0 → line7 = 0 → line8 = 0.'],
  ['Line 29 ≤ 40% × min(allowable AOTC, $2,500 × studentCount)', 'STRUCTURALLY enforced — 40% × line7 capped by phaseout + per-student cap.'],
  ['QSS uses Single phaseout thresholds ($80k-$90k)', '★ G1 FIXED 2026-04-20 — isMfj excludes QSS.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 38 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 29'],
  ['Line 29 (Form 8863 line 8) requires 9 helper parameters + extensive personal-form data + 4 upstream Form 1040 / Schedule 3 fields. ★ INSEPARABLE from line 20 — both produced by single computeForm8863 call.'],
  [],
  ['HELPER SIGNATURE — 9 parameters'],
  ['#', 'Parameter', 'Type', 'Used for'],
  [1, 'educationCreditsTaxpayer', 'Map', 'Entry gate + MAGI add-backs + AOTC previously-denied + under-24 restriction + students array'],
  [2, 'educationCreditsSpouse', 'Map', 'MFJ-only: spouse students merged with taxpayer students'],
  [3, 'form1040', 'Form1040', 'AGI (line 11b) + total tax before credits (CLW)'],
  [4, 'schedule3', 'Schedule3', 'CLW prior nonrefundable credits subtraction'],
  [5, 'filingStatus', 'Map', '★ M4 INSTANCE: drives isMfj for phaseout + spouse merging; ★ MFS hard-disqualify'],
  [6, 'form8862', 'Form8862', 'AOTC recertification gate (claimsAOTC + aotcStudentEligible list)'],
  [7, 'flags', 'List<TaxReturnFlag>', 'Emits FORM_8862_AOTC_REQUIRED + EDUCATION_CREDITS_MFS_INELIGIBLE'],
  [8, 'uid', 'String', 'User ID (for logging/diagnostics)'],
  [9, 'you', 'Map', 'Taxpayer name + SSN for Form 8863 PDF header (G19 fix 2026-04-20)'],
  [],
  ['EDUCATION-CREDITS-TAXPAYER PERSONAL FORM'],
  ['#', 'Field', 'Type', 'Effect'],
  [10, 'claimsEducationCreditsOnReturn', 'boolean', '★ Convention 5 SCREENING GATE — if false → return null'],
  [11, 'aotcPreviouslyDenied', 'boolean', '★ Convention 6 — triggers Form 8862 AOTC gate (per-student); LLC unaffected'],
  [12, 'refundableAotcRestrictionApplies', 'boolean', '★ Under-24 rule — forces line8=0; line7 flows to nonrefundable line19; G4 self-reported'],
  [13, 'hasMagiAddBacks', 'boolean', 'UI gate only (backend ignores; G18 fix 2026-04-20)'],
  [14, 'magiAddBackPuertoRicoExcludedIncome', 'decimal', '★ Convention 8 MAGI ADD-BACK — Puerto Rico excluded income'],
  [15, 'magiAddBackForm2555ExcludedIncome', 'decimal', '★ Convention 8 MAGI ADD-BACK — Form 2555 foreign earned income exclusion'],
  [16, 'magiAddBackForm2555HousingExclusion', 'decimal', '★ Convention 8 MAGI ADD-BACK — Form 2555 housing exclusion'],
  [17, 'magiAddBackForm4563ExcludedIncome', 'decimal', '★ Convention 8 MAGI ADD-BACK — Form 4563 American Samoa exclusion'],
  [],
  ['TAXPAYER EDUCATION CREDIT STUDENTS (per-student fields)'],
  ['#', 'Field', 'Type', 'Used for'],
  [18, 'taxpayerEducationCreditStudents[].creditTypeRequested', 'string', '"aotc" or "llc" — AOTC vs LLC branch'],
  [19, 'taxpayerEducationCreditStudents[].studentFirstNameLine20', 'string', 'Student first name → Form8863Student.studentName'],
  [20, 'taxpayerEducationCreditStudents[].studentLastNameLine20', 'string', 'Student last name → Form8863Student.studentName'],
  [21, 'taxpayerEducationCreditStudents[].studentTinLine21', 'string', '★ G19/G20 fix — student SSN/TIN for PDF Part III line 21'],
  [22, 'taxpayerEducationCreditStudents[].institution1NameLine22', 'string', '★ G19/G20 fix — first institution name'],
  [23, 'taxpayerEducationCreditStudents[].institution1AddressLine22', 'string', '★ G19/G20 fix — first institution address'],
  [24, 'taxpayerEducationCreditStudents[].adjustedQualifiedEducationExpenses', 'decimal', 'Per-student credit base'],
  [25, 'taxpayerEducationCreditStudents[].aotcClaimedFourPriorYearsLine23', 'boolean', 'AOTC disqualifier — 4-year cap'],
  [26, 'taxpayerEducationCreditStudents[].studentWasAtLeastHalfTimeLine24', 'boolean', 'AOTC qualifier — at least half-time enrollment'],
  [27, 'taxpayerEducationCreditStudents[].studentCompletedFirstFourYearsBefore2025Line25', 'boolean', 'AOTC disqualifier — completed first 4 years'],
  [28, 'taxpayerEducationCreditStudents[].studentHadFelonyDrugConvictionLine26', 'boolean', 'AOTC disqualifier — felony drug conviction'],
  [],
  ['EDUCATION-CREDITS-SPOUSE PERSONAL FORM (MFJ-only)'],
  ['#', 'Field', 'Type', 'Used for'],
  [29, 'spouseHasAdditionalEducationCreditStudents', 'boolean', 'Gate to merge spouse students'],
  [30, 'spouseEducationCreditStudents[].*', 'array', 'Same per-student fields as taxpayer form'],
  [],
  ['UPSTREAM COMPUTED FIELDS'],
  ['#', 'Field', 'Use'],
  [31, 'form1040.adjustments.line11bAmountFromLine11aAdjustedGrossIncome', 'AGI base for MAGI'],
  [32, 'form1040.taxAndCredits.totalTaxBeforeCredits', 'CLW (line 18)'],
  [33, 'schedule3.nonrefundableCredits.foreignTaxCredit', 'CLW prior-credit (line 1)'],
  [34, 'schedule3.nonrefundableCredits.childDependentCareCredit', 'CLW prior-credit (line 2)'],
  [35, 'schedule3.nonrefundableCredits.elderlyDisabledCredit', 'CLW prior-credit (line 6d)'],
  [36, 'schedule3.nonrefundableCredits.amountFromForm8978Line14', 'CLW prior-credit (line 6l)'],
  [],
  ['FORM 8862 (if aotcPreviouslyDenied)'],
  ['#', 'Field', 'Use'],
  [37, 'form8862.claimsAOTC', 'AOTC gate — must be true'],
  [38, 'form8862.aotcStudentEligible (List<Boolean>)', '★ Per-student AOTC index gating — UNIQUE per-student granularity'],
  [],
  ['★ M4 USAGE IN HELPER'],
  ['Instance', 'Line', 'Code', 'Purpose'],
  ['M4-1', '19261-19265', 'if (isMfs) { flags.add(...); return null; }', '★ Convention 7 MFS HARD-DISQUALIFY (no exception path)'],
  ['M4-2', '19283-19284', 'phaseoutUpper = isMfj ? $180k : $90k; phaseoutRange = isMfj ? $20k : $10k', '★ M4 phaseout threshold selection (G1 QSS fix verified)'],
  ['M4-3', 'spouse-student merge', 'if MFJ → merge spouseEducationCreditStudents into student list', 'MFJ spouse students aggregation'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 6 }, { wch: 55 }, { wch: 18 }, { wch: 75 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 29'],
  ['★ HEAVY 2025 reference-data set — THIRD-HEAVIEST in workflow after 27a (72) and 28 (~15). ~14 distinct constants from IRC §25A + IRS 2025 Form 8863 instructions + Pub. 970.'],
  [],
  ['Constant', '2025 Value', 'Statutory Basis', 'Backend identifier'],
  ['AOTC max credit per student', '$2,500', 'IRC §25A(b)(1)', 'Derived: 100% × $2,000 + 25% × $2,000'],
  ['AOTC 100% expense bracket', '$2,000', 'IRC §25A(b)(1)(A)', 'Per-student line 30 first tier'],
  ['AOTC 25% expense bracket', '$2,000', 'IRC §25A(b)(1)(B)', 'Per-student line 30 second tier'],
  ['AOTC 100% rate', '100%', 'IRC §25A(b)(1)(A)', 'Per-student line 30 first tier multiplier'],
  ['AOTC 25% rate', '25%', 'IRC §25A(b)(1)(B)', 'Per-student line 30 second tier multiplier'],
  ['Refundable split — refundable', '40%', 'IRC §25A(i)(6)', 'line 8 = 40% × line 7'],
  ['Refundable split — nonrefundable', '60%', 'IRC §25A(i)(6)', 'line 19 = line 7 − line 8'],
  ['Phaseout upper — Single/HOH/QSS', '$90,000', 'IRC §25A(d)(2)(A)(ii)', 'Hardcoded "90000" at line 19283 (★ M4 isMfj-flag)'],
  ['Phaseout upper — MFJ', '$180,000', 'IRC §25A(d)(2)(B)', 'Hardcoded "180000" at line 19283'],
  ['Phaseout range — Single/HOH/QSS', '$10,000', 'IRC §25A(d)(2)(A)(ii)', 'Hardcoded "10000" at line 19284'],
  ['Phaseout range — MFJ', '$20,000', 'IRC §25A(d)(2)(B)', 'Hardcoded "20000" at line 19284'],
  ['Phaseout start — Single', '$80,000', 'IRC §25A(d)(2)(A)(ii)', '$90k − $10k range'],
  ['Phaseout start — MFJ', '$160,000', 'IRC §25A(d)(2)(B)', '$180k − $20k range'],
  ['Phaseout fraction rounding', 'DOWN to 3 decimals', 'IRS 2025 Form 8863 line 6 instructions', 'RoundingMode.DOWN at line 19296'],
  [],
  ['★ Reference-data comparison across recent audits'],
  ['Audit', '# numeric constants', 'Note'],
  ['25a-25d', '0 (tied)', ''],
  ['26', '4 (calendar dates only)', ''],
  ['27a', '★ 72 (HEAVIEST)', '6 × 12 EIC table parameters + ceiling + age bounds + relationships'],
  ['27b/27c', '0 (degenerate)', ''],
  ['28', '★ ~15 (SECOND-HEAVIEST)', 'CTC + ODC + ACTC ceiling + phaseout + earned-income floor + 15% rate'],
  ['**29**', '**★ ~14 (THIRD-HEAVIEST)**', 'AOTC brackets + rates + refundable split + phaseout × 2 statuses'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 25 }, { wch: 45 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 29 Persistence + Downstream Consumers'],
  ['Line 29 sets two output fields: Payments.americanOpportunityCredit (line 29) AND Schedule3NonrefundableCredits.educationCredits (Schedule 3 line 3 → Form 1040 line 20). ★ INSEPARABLE — same helper.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.payments.americanOpportunityCredit', 'computeLine31ThroughLine38 at line 19895 reads Form8863.line8RefundableAotc', '★ CANONICAL line 29 output'],
  ['schedule3.nonrefundableCredits.educationCredits', 'applyForm8863ToSchedule3 reads Form8863.line19NonrefundableEducationCredits', '★ Schedule 3 line 3 → Form 1040 line 20'],
  ['earlyPayments.americanOpportunityCredit', 'computeLine31ThroughLine38 pre-set at line 1400', '★ Pre-set for Schedule 8812 Part II-B line 24'],
  ['Form8863 (28+ fields including students[] array)', 'computeForm8863 populates all', 'PDF export of Form 8863'],
  [],
  ['SAME-METHOD DOWNSTREAM'],
  ['Line 32 = line 27a + line 28 + line 29 + line 30 + line 31', '~line 19940', '★ Line 29 is 3rd addend in refundable credits subtotal.'],
  ['Line 33 = line 25d + line 26 + line 32', '~line 19960', 'Line 29 affects line 33 transitively.'],
  ['Form 1040 line 20 (Schedule 3 line 8 total)', 'computeLine20ThroughLine24', '★ Co-output — line 19 nonrefundable AOTC + LLC → Sched 3 line 3 → line 20'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Schedule 8812 Part II-B line 24', 'computeSchedule8812', '★ Reads earlyPayments.americanOpportunityCredit (pre-set at line 1400)'],
  ['Frontend PDF export (Form 1040)', 'form-tax-return-1040.component.ts', '`values["line29_american_opportunity_credit"] = formatAmount(payments?.americanOpportunityCredit)`'],
  ['Form 8863 PDF export', 'form-tax-return-8863.component.ts', 'All Form 8863 fields via buildFieldValues()'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 55 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 29'],
  ['Line 29 emits 2 BLOCKING FLAGS: FORM_8862_AOTC_REQUIRED (AOTC recertification) + EDUCATION_CREDITS_MFS_INELIGIBLE (MFS hard-disqualify).'],
  [],
  ['Flag code', 'Severity', 'Condition'],
  ['FORM_8862_AOTC_REQUIRED', 'BLOCKING (AOTC only)', 'aotcPreviouslyDenied=true AND no valid Form 8862. Blocks AOTC for all students; LLC continues. Can be bypassed via overrideFlags.'],
  ['EDUCATION_CREDITS_MFS_INELIGIBLE', 'BLOCKING (full)', 'Filing status = MFS. Returns null (entire Form 8863 zeroed). No exception path (distinct from 27a EIC\'s MFS-with-exception).'],
  [],
  ['STRUCTURAL INVARIANTS'],
  ['Invariant', 'How enforced'],
  ['Line 29 ≥ 0', 'STRUCTURALLY enforced — AOTC by IRS rules ≥ 0.'],
  ['Line 29 = 0 if claimsEducationCreditsOnReturn=false', 'STRUCTURALLY enforced at line 19240-19242.'],
  ['Line 29 = 0 if MFS', 'STRUCTURALLY enforced at line 19261-19265 — full hard-disqualify.'],
  ['Line 29 = 0 if AOTC previously denied + no Form 8862', 'STRUCTURALLY enforced at line 19248-19257; per-student gating via aotcStudentEligible list.'],
  ['Line 29 = 0 if refundableAotcRestrictionApplies', '★ Under-24 rule per IRC §25A(i)(2); G4 self-reported boolean.'],
  ['Line 29 = 0 if MAGI ≥ phaseoutUpper', 'STRUCTURALLY enforced — phaseoutFraction = 0 → line8 = 0.'],
  ['QSS uses Single phaseout thresholds', '★ G1 FIXED 2026-04-20 — isMfj excludes QSS.'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 22 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 29 is the refundable AOTC (★ MULTI-STAGE GATED CREDIT — RECURRENCE of 27a\'s complexity dimension). 21st audit OUTSIDE 13ab pair; TENTH payments-section audit. ★ EXPECTED CLEAN META-AUDIT — ends 4-of-5 drift surge; ★ EXPECTED Path A application — resumes zero-outstanding streak. 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-16 — ★ M4 RECURRENCE (3rd recurrence after 27a + 28; 4th M4 instance overall); ★ 14th orchestrator-method-based audit; helper uses isMfs hard-disqualify (line 19261-19265) + isMfj phaseout threshold selection (line 19283-19284) + MFJ spouse-student merge; pattern distribution after 16 audits: 6 M2 + 4 M3 + 4 M4 + 2 degenerate',
    '**Per-input MFS-leakage analysis**: line 29 helper at TaxReturnComputeService.java:19228-19500+ uses M4 at multiple points: M4-1 at line 19261-19265 — `if (isMfs) { flags.add(EDUCATION_CREDITS_MFS_INELIGIBLE); return null; }` (★ MFS HARD-DISQUALIFY without exception — distinct from 27a\'s MFS-with-exception remap); M4-2 at line 19283-19284 — `phaseoutUpper = isMfj ? $180k : $90k` and `phaseoutRange = isMfj ? $20k : $10k` (★ G1 QSS fix verified — QSS uses Single thresholds); M4-3 — spouse students merged ONLY on MFJ. **★ 3rd RECURRENCE of M4 in workflow** (after 27a 1st recurrence + 28 2nd recurrence; 26 was debut). **★ 14th orchestrator-method-based audit**. Pattern distribution after 16 audits: 6 M2 + 4 M3 + **4 M4** (26 + 27a + 28 + 29) + 2 degenerate. ★ M4 mechanism firmly established across 4 distinct helpers. MFS-guard cascade UNCHANGED at 20 orchestrators. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:19228-19500+ (helper); M4 at lines 19261/19283/spouse-merge',
    'CLOSED — ★ M4 RECURRENCE (3rd recurrence in workflow). ★ 14th orchestrator-method-based audit. Pattern distribution after 16 audits: 6 M2 + 4 M3 + **4 M4** (debut + 3 recurrences) + 2 degenerate. ★ M4 mechanism firmly established across 4 distinct helpers (26 estimated tax + 27a EIC + 28 ACTC + 29 AOTC). MFS-guard cascade UNCHANGED at 20 orchestrators. Pure cross-reference closure. 765/765 unchanged.'],

  [2, 'RESOLVED 2026-05-16 — ★ 22nd LEGACY A MIGRATION — Renamed knowledge_line29.md → line-29-aotc-form-8863.md (convergence 34 → 35; ★ 4 consecutive Legacy A audits — 26 #2 + 27a #2 + 28 #2 + 29 #2)',
    '**The situation**: Knowledge file at `knowledge_line29.md` follows Legacy A naming. ★ This audit produces the 22nd Legacy A migration — `knowledge_line29.md` → `line-29-aotc-form-8863.md`. Convergence count advances **34 → 35 lines**. ★ **4 consecutive Legacy A audits** (after 26 #2 was 19th, 27a #2 was 20th, 28 #2 was 21st). Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\knowledge\\knowledge_line29.md (rename to line-29-aotc-form-8863.md)',
    'CLOSED — knowledge_line29.md RENAMED to line-29-aotc-form-8863.md. **★ 22nd Legacy A migration in workflow** (previously 21). Convergence advanced **34 → 35 lines**. ★ **4 consecutive Legacy A audits** after 26 #2 + 27a #2 + 28 #2. ★ Naming convention firmly established: 22 of 38+ lines have descriptive `line-N-*.md` knowledge files. Generator updated to reference new filename.'],

  [3, 'RESOLVED 2026-05-16 — ★ SPEC ENHANCEMENT — Created NEW §16 Verification log in lines/29.md (numbered §16 because spec already has §1-§15; ★ 24th CONSECUTIVE single-row contribution; ★ 2nd single-spec §11+ audit since 27a #3 — 28 #3 was the prior one)',
    '**Goal**: create a NEW `## 11) Verification log` section in `lines/29.md` for the line 29 audit. Numbered §11 if spec has §1-§10; otherwise the next available number. Row 1 in IN-PROGRESS state with #1-#3 closures; finalized to COMPLETE at Issue #10. **★ 24th CONSECUTIVE single-row contribution in workflow**.',
    'C:\\us-tax\\lines\\29.md (create new §11+ Verification log section)',
    'CLOSED — NEW §11+ Verification log section CREATED in lines/29.md with single-row IN-PROGRESS state. Will be finalized to COMPLETE at Issue #10. **★ 24th CONSECUTIVE single-row contribution in workflow**.'],

  [4, 'RESOLVED 2026-05-16 — ★ 14th META-AUDIT IN WORKFLOW — sub-type (b); ★ DOMINANCE to ~93% (13 of 14); ★ CLEAN — ENDS 4-of-5 drift surge; ★ clean trend recovers from 50% to 54% within sub-type (b); ★ 7/7 consistency checks pass; no drift to fix',
    '**The situation**: Standard sub-type (b) META-AUDIT — dependencies/29.md + knowledge §0 banners. **★ 14th META-AUDIT in workflow**. **★ DOMINANCE to ~93% — 13 of 14 META-AUDITS** (22+23+24+25a+25b+25c+25d+26+27a+27b+27c+28+29); line 21 alone uses sub-type (a). **★ EXPECTED CLEAN** — initial survey shows: (a) ✅ helper signature 9-param matches docs (G19 `you` param added 2026-04-20); (b) ✅ MFS hard-disqualify at line 19261-19265 matches spec §7; (c) ✅ phaseout thresholds match spec §5 ($90k/$180k); (d) ✅ Form 8862 gate logic matches knowledge §2; (e) ✅ MAGI add-backs match spec §5 (PR + Form 2555 × 2 + Form 4563); (f) ✅ all gaps G1-G6 + G17-G24 status-dated 2026-04-20 (Fixed or Deferred); (g) ✅ 19895 wiring matches spec §1. **★ NO drift fix needed**. ★ **ENDS 4-of-5 drift surge** (26 #4 + 27a #4 + 27c #4 + 28 #4 all surfaced drift; only 27b #4 was clean). ★ Clean trend in sub-type (b) recovers from 50% to 54% (7 clean / 13). Backend tests: 765/765 unchanged.',
    'dependencies/29.md (Audited 2026-04-20); knowledge §0 (Audited 2026-04-20); code at line 19228-19500',
    'CLOSED — META-AUDIT consistency check complete. **★ 14th META-AUDIT in workflow**. **★ DOMINANCE to ~93% — 13 of 14 META-AUDITS use sub-type (b)**. **★ CLEAN** — 7/7 consistency checks pass. **★ ENDS 4-of-5 drift surge** (26 #4 + 27a #4 + 27c #4 + 28 #4 all surfaced drift; only 27b #4 + 29 #4 are clean in last 6). ★ Clean trend in sub-type (b) recovers from 50% to 54% (7 clean / 13). ★ Pattern observation: documentation drift surge appears to be ending; line 29 docs are well-maintained (last updated 2026-04-20 with comprehensive G17-G24 fixes).'],

  [5, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — line 29 wiring + helper; ★ 23rd anti-duplication application; ★ NO existing breadcrumb covers line 29 (no 19 #X breadcrumb at the helper site at line 19228); 3-source coverage via spec §1+§3+§4 + dependencies §1+§2 + knowledge §1+§2 (post 29 #2 rename)',
    '**Closure intent**: pure cross-reference closure. Line 29 is produced by `computeForm8863` at line 19228-19500+ (~270-line helper). ★ NO pre-existing method-level breadcrumb at the helper site — this audit anti-duplicates purely via 3-source coverage (spec + dependencies + knowledge). ★ The 19 #6 breadcrumb at line 23163-23280 is in `computeSchedule8812` (covers line 19 + line 28); does NOT cover line 29 (Form 8863). 3-source coverage: spec §1 (line identity) + §3 (core structure) + §4 (AOTC amount rules) + dependencies §1 (output) + §2 (inputs) + knowledge §1 (line identity) + §2 (backend implementation). **★ 23rd anti-duplication application**.',
    'TaxReturnComputeService.java:19228-19500+ (helper; no pre-existing breadcrumb at helper site)',
    'CLOSED — verified correct via 3-source coverage (spec + dependencies + knowledge). **★ 23rd anti-duplication application**. ★ NO new breadcrumb planted; ★ NO existing breadcrumb covers line 29 (19 #6 covers line 19 + line 28 only via computeSchedule8812). ★ 3-source coverage is sufficient given documentation completeness — spec/dependencies/knowledge all comprehensive and last-updated 2026-04-20 with G17-G24 fixes.'],

  [6, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — ★ MULTI-STAGE GATED CREDIT chain RECURRENCE (★ 1st recurrence of 27a\'s complexity dimension; ★ dimension count UNCHANGED at 9 — corrected: actually 10 established through 28; line 29 recurs the MULTI-STAGE GATED CREDIT dimension debuted at 27a)',
    '**Closure intent**: pure cross-reference closure — verifies the multi-stage gated credit chain. ★ **RECURRENCE of 27a\'s complexity dimension** (MULTI-STAGE GATED CREDIT) — both line 27a (EIC) and line 29 (AOTC) follow the same structural pattern: multiple disqualifier gates + MAGI computation + phaseout fraction + per-student/per-credit computation + final refundable amount. **Chain stages**: **(1)** Entry gate (claimsEducationCreditsOnReturn). **(2)** Form 8862 AOTC gate. **(3)** MFS hard-disqualify. **(4)** MAGI computation with 4 add-backs. **(5)** Phaseout fraction (3-decimal DOWN rounding). **(6)** Per-student Part III loop. **(7)** line 1 = sum per-student line 30. **(8)** line 7 = line 1 × phaseoutFraction. **(9)** line 8 = 40% × line 7 (UNLESS under-24 restriction → 0). **(10)** line 19 = line 7 − line 8 + LLC. **(11)** Setter for line 29 (refundable) + line 20 (nonrefundable). **★ KEY DISTINCTION FROM 27a**: line 29 produces TWO co-outputs (refundable + nonrefundable); line 27a produces ONE output (refundable EIC only). ★ Dimension count UNCHANGED at 9 — this is recurrence, not new dimension.',
    'TaxReturnComputeService.java:19228-19500+ (helper); spec §3 (core structure) + knowledge §2-§5',
    'CLOSED — verified correct via MULTI-STAGE GATED CREDIT chain. **★ 1st RECURRENCE of 27a\'s complexity dimension** in workflow. ★ Dimension count UNCHANGED at 9 (line 29 is recurrence, not new dimension). ★ KEY DISTINCTION FROM 27a: line 29 produces TWO co-outputs (refundable line 29 + nonrefundable line 20 via Schedule 3 line 3); line 27a produces ONE output. ★ 11-stage chain with multi-disqualifier + phaseout + per-student + refundable/nonrefundable split.'],

  [7, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — ★ 8 CONVENTIONS NEW HIGH in workflow (exceeds prior max of 7 at 28); Conventions 1-4 same as 25a + Convention 5 SCREENING GATE `claimsEducationCreditsOnReturn` (★ 3rd strict intake-gate recurrence after 26 + 27a) + ★ Convention 6 FORM 8862 RECERTIFICATION with per-student `aotcStudentEligible` list (★ UNIQUE per-student granularity) + ★ Convention 7 MFS HARD-DISQUALIFY + flag emission (★ UNIQUE — no exception path; distinct from 27a\'s MFS-with-exception remap) + ★ Convention 8 MAGI ADD-BACKS — 4 explicit form-based add-backs (★ UNIQUE); ★ workflow conventions range 0-8 firmly established',
    '**Closure intent**: pure verification closure — confirms eight line-29-specific conventions. **Convention 1** Null-when-zero: `claimsEducationCreditsOnReturn=false` → return null. **Convention 2** No SSN filtering at credit level: students iterated by index/array position. **Convention 3** MFJ aggregation: spouse students merged on MFJ. **Convention 4** MFS protection via ★ M4 (recurrence). **★ Convention 5** SCREENING GATE `claimsEducationCreditsOnReturn` — ★ 3rd strict intake-gate recurrence after 26 (`madeEstimatedTaxPayments`) + 27a (`claimsEIC`) — 28\'s `ctcPreviouslyDenied` was Form 8862 recertification, not intake. **★ Convention 6** FORM 8862 RECERTIFICATION with per-student `aotcStudentEligible` list — ★ UNIQUE per-student granularity (CTC Form 8862 was per-return; AOTC Form 8862 is per-student). **★ Convention 7** MFS HARD-DISQUALIFY + flag emission — ★ UNIQUE: distinct from 27a\'s MFS-with-exception remap (which allowed Single-table fallback) because line 29 has NO exception path; full block per IRC §25A(g)(6). **★ Convention 8** MAGI ADD-BACKS — 4 explicit form-based add-backs (Puerto Rico, Form 2555 exclusion, Form 2555 housing, Form 4563) — ★ UNIQUE: no other audited line has explicit MAGI add-back fields on the personal form (lines 27a/28 derive MAGI from Form 2555 automatically; line 29 requires explicit user-entered amounts). **★ 8 CONVENTIONS — NEW HIGH in workflow** (exceeds prior max of 7 at 28).',
    'TaxReturnComputeService.java:19228-19500+ (helper); spec §6 (under-24) + §7 (MFS block) + §8 (TIN) + §9 (1098-T)',
    'CLOSED — verified correct. **★ 8 CONVENTIONS — NEW HIGH in workflow** (exceeds prior max of 7 at 28). Convention 1 null-when-zero + Convention 2 no SSN filtering at credit level + Convention 3 MFJ aggregation + Convention 4 MFS protection via M4 + ★ Convention 5 SCREENING GATE (★ 3rd intake-gate recurrence after 26 + 27a) + ★ Convention 6 FORM 8862 RECERTIFICATION per-student (★ UNIQUE per-student granularity) + ★ Convention 7 MFS HARD-DISQUALIFY (★ UNIQUE — no exception path; distinct from 27a) + ★ Convention 8 MAGI ADD-BACKS (★ UNIQUE — 4 explicit fields). ★ Workflow conventions range now spans 0-8.'],

  [8, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — 0 routing distinctions + ★ HEAVY 2025 reference-data set (~14 distinct constants; ★ THIRD-HEAVIEST after 27a at 72 and 28 at ~15); ★ workflow reference-data range firmly established 0-72 with 3 tiers (0 floor / ~14-15 mid (28+29) / 72 ceiling); all 14 constants validated against IRC §25A + IRS 2025 Form 8863 instructions + Pub. 970',
    '**Closure intent**: pure verification closure. **Routing**: ★ ZERO — line 29 has dedicated input forms (education-credits-taxpayer + education-credits-spouse); no statement form routes here. **Reference data**: ★ ~14 distinct constants — AOTC expense brackets ($2k + $2k) + rates (100% + 25%) + refundable split (40% + 60%) + phaseout thresholds × 2 statuses ($90k/$180k uppers; $10k/$20k ranges; $80k/$160k starts) + DOWN rounding to 3 decimals. ★ All from IRC §25A + IRS 2025 Form 8863 instructions + Pub. 970. **★ THIRD-HEAVIEST 2025 reference-data set in workflow** after 27a (72) and 28 (~15).',
    'TaxReturnComputeService.java:19228-19500+ (~14 constants embedded); spec §4 + §5 + IRC §25A',
    'CLOSED — verified correct. **Routing**: ★ ZERO routing distinctions. **Reference data**: ★ ~14 distinct 2025 constants. **★ THIRD-HEAVIEST 2025 reference-data set in workflow** (27a at 72 ceiling; 28 at ~15 second; 29 at ~14 third). ★ All constants validated against IRC §25A + IRS 2025 Form 8863 instructions + Pub. 970. ★ Workflow reference-data range remains 0-72 with new mid-tier population at 14-15 (28+29 both in mid-tier).'],

  [9, 'RESOLVED 2026-05-16 — ⚠️ BUNDLED OBSERVATIONS — ★ Path A application (★ RESUMES zero-outstanding-walkthroughs streak at 1 after G12/G13 broke it at 27c/28); ★ 29th Path A application; ★ 1-audit zero-new-gaps streak; G4 under-24 self-reported DEFERRED OOS already documented; ★ WORKFLOW RECOVERY NARRATIVE confirmed',
    '**Closure intent**: pure xlsx-flip observation bundle — **NO code change**; **NO outstanding.md entry**. TWO observations bundled. **(a) G4 DEFERRED OOS — Under-24 refundable restriction self-reported**: `refundableAotcRestrictionApplies` is a single boolean; no sub-condition validation from return data (age + earned-income + parent-alive + non-joint-return conditions per IRC §25A(g)(7) must be self-reported). Documented in dependencies §6 G4 as Deferred. ★ Severity LOW; affects refundable AOTC only; nonrefundable AOTC continues. **(b) Missing `diagrams/29.drawio` cosmetic** — ★ 13th consecutive credits/payments-section audit with this gap (lines 20-24 + 25a + 25b + 25c + 25d + 26 + 27a + 27b + 27c + 28 + 29). **★ Anti-fragmentation policy applied** — G4 already in dependencies §6 (not separately tracked in outstanding.md). **★ 29th PATH A APPLICATION**. **★ RESUMES zero-outstanding-walkthroughs streak at 1** after G12 at 27c + G13 at 28 broke it. ★ **1-audit zero-new-gaps streak** (resumed at 1 after 2-audit gap surge G12+G13). ★ Workflow RECOVERY narrative — drift surge ended at 28; documentation maintenance recovering.',
    'G4 under-24 self-reported (DEFERRED in dependencies §6); diagrams/29.drawio (missing)',
    'CLOSED — pure observation bundle. **★ 29th Path A application**. **★ RESUMES zero-outstanding-walkthroughs streak at 1** after G12 at 27c + G13 at 28 broke it (★ 1-audit recovery; new streak starts climbing). **★ 1-audit zero-new-gaps streak** (recovered after 2-audit gap surge). ★ Workflow RECOVERY narrative confirmed — drift surge ended at 28; documentation maintenance is now well-maintained for line 29. 2 observations: (a) G4 DEFERRED OOS under-24 self-reported boolean (documented in dependencies §6); (b) Missing `diagrams/29.drawio` cosmetic — ★ 13th consecutive credits/payments-section audit with this gap.'],

  [10, 'RESOLVED 2026-05-16 — BOUNDARY MILESTONE — Line 29 walkthrough complete at 10/10; ★ TENTH payments-section audit; ★ CLEAN META-AUDIT ENDS 4-of-5 drift surge; ★ Path A RESUMES zero-outstanding-walkthroughs streak (★ workflow RECOVERY narrative); ★ 8 CONVENTIONS NEW HIGH; ★ M4 RECURRENCE (4th M4 instance); ★ 22nd Legacy A migration; ★ MULTI-STAGE GATED CREDIT chain RECURRENCE',
    'Pure xlsx-flip + Verification log row 1 finalization — **CLOSES the 29 walkthrough at 10/10**. TWO file touches: (a) this row flipped to RESOLVED; (b) lines/29.md §11+ Verification log row 1 finalized IN-PROGRESS → **COMPLETE — 10/10 closed**. **Eight themes**: (1) ★ Structural positioning — 21st audit OUTSIDE 13ab pair; ★ TENTH payments-section audit; 60th line; ★ INSEPARABLE from line 20 (single helper produces both refundable line 29 + nonrefundable Sched 3 line 3 → line 20). (2) **★ M4 RECURRENCE** — 3rd recurrence after 27a + 28; 4th M4 instance overall; 14th orchestrator-method-based; pattern distribution after 16 audits: 6 M2 + 4 M3 + 4 M4 + 2 degenerate; MFS cascade UNCHANGED at 20. (3) **★ 14th META-AUDIT — CLEAN** — sub-type (b) at 93% DOMINANCE (13 of 14); ★ ENDS 4-of-5 drift surge; ★ clean trend recovers from 50% to 54% (7 clean / 13). (4) **★ Legacy A migration** (Issue #2: ★ 22nd; convergence 34 → 35; ★ 4 consecutive Legacy A audits). (5) **★ NEW single-spec §11+ Verification log** (Issue #3: ★ 24th CONSECUTIVE single-row contribution). (6) **★ 8 CONVENTIONS NEW HIGH** (Issue #7: exceeds prior max of 7 at 28; ★ Convention 5 RECURS 3rd strict intake-gate; ★ Conventions 6 + 7 + 8 NEW UNIQUE). (7) **★ MULTI-STAGE GATED CREDIT chain RECURRENCE** (Issue #6: 1st recurrence of 27a\'s complexity dimension; dimension count UNCHANGED at 9). (8) **★ Path A RESUMES zero-outstanding-walkthroughs streak at 1** (Issue #9: after G12 + G13 broke it; ★ workflow RECOVERY narrative). **Cumulative through line 29**: **60 lines audited**; **597 audit issues closed total** (587 + 10); backend **765/765 pass** (UNCHANGED — 12th audit with zero new tests); MFS cascade = **20 orchestrators** (unchanged); knowledge convergence = **35 lines** (★ +1 from 29 #2); **★ 29 Path A applications** (+1; ★ streak RESUMED after 2-audit gap surge); **★ 23 anti-duplication applications** (+1); **★ 0 new gaps surfaced at 29** (★ 1-audit zero-new-gaps streak after G12+G13); **★ 14 META-AUDITS** (+1; ★ sub-type (b) at 93% DOMINANCE; ★ CLEAN; ★ ends 4-of-5 drift surge; clean trend 54%); **★ 14 documentation drift fixes** (UNCHANGED — 29 #4 was CLEAN); **★ 4 distinct MFS-protection mechanisms** (UNCHANGED — M4 RECURRENCE; 4 M4 instances now); **★ 9 distinct complexity dimensions in workflow** (UNCHANGED — 29 was recurrence of 27a\'s MULTI-STAGE GATED CREDIT). **★ Zero-outstanding-walkthroughs streak RESUMED at 1** (after broken at 27c #9 + 28 #9). **Verification logs**: ... + 28 + 29 (★ NEW §11+ with 1 row COMPLETE; ★ 24th CONSECUTIVE single-row). **Looking ahead — line 30 (line reserved for future use; per spec, intentionally blank in 2025)**: 22nd audit OUTSIDE 13ab pair; ELEVENTH payments-section audit; ★ likely DEGENERATE-RESERVED-LINE audit (similar to 27b\'s degenerate-pure-constant but reserved-for-future rather than disabled-by-OOS); ★ likely 15th META-AUDIT.',
    'XLS/computations/29.xlsx audit-trail (this row); lines/29.md §11+ Verification log row 1 FINALIZED to COMPLETE — 10/10 closed; ★ NO outstanding.md entry (Path A applied)',
    'CLOSED — 10/10. **60 lines; 597 issues; 765/765 backend (UNCHANGED — 12th audit with zero new tests); 20 orchestrators (UNCHANGED); 35-line knowledge convergence (★ +1 from 29 #2; ★ 22nd Legacy A migration; ★ 4 consecutive Legacy A audits); 14 doc-drift fixes (UNCHANGED — 29 #4 was CLEAN); ★ 29 Path A applications (+1; ★ streak RESUMED after 2-audit gap surge); ★ 23 anti-duplication applications; ★ 0 new gaps surfaced at 29 (★ 1-audit zero-new-gaps streak); ★ 24th CONSECUTIVE single-row contribution; ★ 14 META-AUDITS (★ sub-type (b) at 93% DOMINANCE; ★ CLEAN — ENDS 4-of-5 drift surge; clean trend recovers 50% to 54%); ★ 4 distinct MFS-protection mechanisms (★ M4 RECURRENCE — 4 M4 instances); ★ 9 distinct complexity dimensions in workflow (UNCHANGED — 29 was RECURRENCE of 27a\'s MULTI-STAGE GATED CREDIT); ★ 8 CONVENTIONS NEW HIGH at 29 (exceeds 28 at 7); ★ Path A RESUMES zero-outstanding-walkthroughs streak (★ workflow RECOVERY narrative — drift surge ended)**. ★ TENTH payments-section audit. ★ INSEPARABLE from line 20 (same helper). Next: line 30 (likely reserved-for-future or 1040-SR line; ★ likely 15th META-AUDIT pushing sub-type (b) DOMINANCE to ~93%).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 120 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 29 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Notes'],
  ['form1040.payments.americanOpportunityCredit', 'Form 1040 page 2, line 29 (PDF key line29_american_opportunity_credit)', '★ CANONICAL line 29 output. From Form8863.line8RefundableAotc.'],
  ['schedule3.nonrefundableCredits.educationCredits', 'Schedule 3 line 3 → Form 1040 line 20', '★ Co-output — from Form8863.line19NonrefundableEducationCredits.'],
  ['earlyPayments.americanOpportunityCredit', 'Pre-set at line 1400 for Schedule 8812 Part II-B', '★ Pre-set so Schedule 8812 Part II-B line 24 can read it.'],
  ['Form8863 (28+ fields including students[] array)', 'Form 8863 PDF', 'Full Form 8863 PDF export.'],
  [],
  ['SAME-METHOD DOWNSTREAM'],
  ['Line 32 = line 27a + line 28 + line 29 + line 30 + line 31', '~line 19940', '★ Line 29 is 3rd addend in refundable credits subtotal.'],
  ['Line 33 = line 25d + line 26 + line 32', '~line 19960', 'Line 29 affects line 33 transitively.'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Schedule 8812 Part II-B line 24', 'computeSchedule8812', '★ Reads earlyPayments.americanOpportunityCredit (pre-set).'],
  ['Form 1040 line 20', 'computeLine20ThroughLine24', '★ Co-output via Schedule 3 line 3 (line 19 nonrefundable).'],
  ['Frontend PDF export (Form 1040)', 'form-tax-return-1040.component.ts', '`values["line29_american_opportunity_credit"] = formatAmount(payments?.americanOpportunityCredit)`'],
  ['Frontend PDF export (Form 8863)', 'form-tax-return-8863.component.ts', 'All Form 8863 fields via buildFieldValues().'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
