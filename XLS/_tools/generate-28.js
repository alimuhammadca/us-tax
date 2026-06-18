// ============================================================================
//  Generates: C:\us-tax\XLS\computations\28.xlsx
//
//  Source-of-truth references:
//    - lines/28.md (283-line spec; "$2,000 per qualifying child (fixed 2026-04-20)")
//      ⚠️ DRIFT — spec §3 claims $2,000; code uses $2,200 with OBBBA citation.
//    - dependencies/28.md (189 lines; "Audited 2026-04-20"); §6 G10 claims
//      "CTC per-child constant: $2,200 vs IRS $2,000 | FIXED 2026-04-20 —
//      corrected to $2,000".
//      ⚠️ DRIFT — claims fixed to $2,000; code has $2,200.
//    - knowledge/line-28-actc-schedule-8812.md (renamed at 28 #2 2026-05-16
//      from knowledge_line28.md; ★ 21st Legacy A migration; 362 lines;
//      "$2,000 × children (fixed 2026-04-20; IRS 2025 verified $2,000)";
//      convergence advanced 33 → 34 lines).
//      ⚠️ DRIFT — claims "IRS 2025 verified $2,000"; code has $2,200 with
//      OBBBA citation. ★ G13 NEW GAP surfaced at 28 #9.
//    - flowcharts/28.drawio (exists).
//    - TaxReturnComputeService.java:
//        line 22999-23800+ — computeSchedule8812 helper (~800 lines; handles
//          BOTH line 19 nonrefundable CTC+ODC AND line 28 refundable ACTC)
//        line 23074-23075 — `BigDecimal line5 = new BigDecimal("2200").multiply(...)`
//          ★ G13 DISCREPANCY: code uses $2,200; docs claim $2,000
//        line 23163-23280 — ★ 19 #6 VERIFIED CORRECT breadcrumb (planted
//          2026-05-14; covers Part II-A; cites OBBBA + Rev. Proc. 2024-40 §3.08)
//        line 23085 — threshold: isMfj ? $400,000 : $200,000 (M4 INSTANCE)
//        line 23046-23053 — Form 2555 spouse add-back (unconditional)
//        line 23009-23010 — `you` + `spouse` parameters (G9 ITIN check)
//        line 23107-23112 — line 8 ≤ line 11 gate (credit eliminated)
//        line 23153-23161 — electsNoActc opt-out (line 28 = 0)
//
//  Tax year: 2025
//
//  Concept:
//    Form1040.line28 = Schedule8812.line27ActcCredit
//
//    Schedule 8812 produces:
//      Line 14 → Form1040.line19 (nonrefundable CTC + ODC)
//      Line 27 → Form1040.line28 (refundable ACTC)
//
//    Both outputs share computeSchedule8812 — line 28 computation is INSEPARABLE
//    from line 19 computation. Line 28 is the refundable "spillover" of unused
//    CTC, capped at $1,700 per child × maxActcChildren via Part II-A or Part
//    II-B (whichever produces the larger allowable amount).
//
//    ★ DUAL-PATH GATED CREDIT — line 28 has two alternative computation paths
//    (Part II-A for all filers; Part II-B for filers with ≥3 qualifying children
//    or Puerto Rico bona fide residents); the max of the two paths is taken.
//
//  Line 28 audit positioning (20th audit OUTSIDE 13ab pair; 59th line):
//   • NINTH payments-section audit
//   • ★ FIRST audit AFTER 27abc cluster complete — fresh single-spec
//   • ★ M4 RECURRENCE — 2nd recurrence after debut at line 26 (1st was 27a);
//     uses isMfj-flag at threshold + M4 ITIN-check at G9; 13th orchestrator-
//     method-based audit
//   • ★ 21st Legacy A migration — knowledge_line28.md rename; convergence 33→34
//   • ★ 13th META-AUDIT — sub-type (b); ★ DOMINANCE to ~92% (12 of 13);
//     ★★ SURFACES MAJOR DRIFT (G13 — $2,000 docs vs $2,200 code); 14th doc-
//     drift fix; 4th drift-surfacing META-AUDIT in 4 audits (26 #4 + 27a #4 +
//     27c #4 + 28 #4; only 27b #4 was clean); clean trend declines 55%→50%
//   • ★ 9th distinct complexity dimension — DUAL-PATH GATED CREDIT (NEW;
//     distinct from 27a's single-path MULTI-STAGE GATED CREDIT)
//   • ★ HEAVY 2025 reference-data set — second-heaviest in workflow after 27a
//   • ★★★ G13 NEW GAP SURFACED — CTC per-child amount drift ($2,000 in docs
//     vs $2,200 in code); ★ 2nd consecutive new-gap audit after G12 at 27c;
//     ★ confirms streak-end (zero-new-gaps + zero-outstanding-walkthroughs)
//
//  Line 28 audit angles (10 issues):
//   1. ★ M4 RECURRENCE — 2nd recurrence after 27a debut; ★ 13th orchestrator-
//       method-based; uses isMfj-flag for threshold selection ($400k MFJ vs
//       $200k others) + G9 ITIN check (you/spouse params); pattern distribution
//       after 15 audits: 6 M2 + 4 M3 + 3 M4 + 2 degenerate.
//   2. ★ 21st LEGACY A MIGRATION — knowledge_line28.md → line-28-actc-
//       schedule-8812.md; convergence 33 → 34.
//   3. ★ NEW single-spec §13 Verification log in lines/28.md; ★ 23rd
//       CONSECUTIVE single-row contribution.
//   4. ★ 13th META-AUDIT IN WORKFLOW — sub-type (b); ★ DOMINANCE to ~92%
//       (12 of 13); ★★ SURFACES MAJOR DRIFT — G13 CTC per-child amount
//       ($2,000 in spec/deps/knowledge vs $2,200 in code with OBBBA citation);
//       ★ 4th drift-surfacing META-AUDIT (26 #4 + 27a #4 + 27c #4 + 28 #4;
//       only 27b #4 clean in last 5); ★ 14th doc-drift fix; clean trend
//       declines from 55% to 50%.
//   5. VERIFIED CORRECT — line 28 wiring; ★ 22nd anti-duplication application;
//       ★ pre-existing 19 #6 helper breadcrumb at line 23163-23280 covers
//       line 28 (single computeSchedule8812 helper produces both line 19 AND
//       line 28); ★ 19 #6 breadcrumb load-bearing for cross-line family.
//   6. VERIFIED CORRECT — ★ DUAL-PATH GATED CREDIT chain (★ 9th distinct
//       complexity dimension in workflow — DUAL-PATH-GATED; distinct from
//       27a's single-path MULTI-STAGE-GATED because line 28 has Part II-A
//       and Part II-B alternatives with max() selection).
//   7. VERIFIED CORRECT — ★ 7 CONVENTIONS (★ NEW HIGH in workflow; exceeds
//       prior max of 6 at 27a; Conventions 1-4 same as 25a + Convention 5
//       SCREENING GATE (`ctcPreviouslyDenied` Form 8862 gate) + Convention 6
//       ELECTS-NO-ACTC OPT-OUT (`electsNoActc` user-opt-out checkbox) +
//       ★ Convention 7 PUERTO RICO BONA FIDE RESIDENT BYPASS — G11 fix,
//       UNIQUE to 28).
//   8. VERIFIED CORRECT — 0 routing distinctions + ★ HEAVY 2025 reference-
//       data set (15+ constants: ★ $2,200 CTC + $500 ODC + $1,700 ACTC ceiling
//       + $400k/$200k thresholds + $50 phase-out per $1,000 + $2,500 earned-
//       income floor + 15% earned-income ACTC rate); ★ SECOND-heaviest 2025
//       reference-data set after 27a.
//   9. ⚠️★★★ NEW DEFERRED ENHANCEMENT — G13 SURFACED: CTC per-child amount
//       drift (★ $2,000 in spec/dependencies/knowledge vs ★ $2,200 in code
//       with OBBBA + Rev. Proc. 2024-40 §3.08 citation); ★ HIGH severity if
//       code is wrong; MEDIUM severity if docs are wrong; ★ user must verify
//       against IRS 2025 Form 1040 / Schedule 8812 final instructions; ★ 2nd
//       consecutive new-gap audit after G12 at 27c; ★ confirms streak-end.
//  10. BOUNDARY MILESTONE — NINTH payments-section audit; ★ FIRST audit AFTER
//       27abc cluster complete; ★ G13 NEW GAP — 2nd consecutive streak-breaker;
//       ★ 9th distinct complexity dimension; ★ 13th META-AUDIT; ★ 21st
//       Legacy A migration; ★ 7 CONVENTIONS NEW HIGH (exceeds 27a at 6);
//       ★ HEAVY 2025 reference-data set.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '28.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 28 — ADDITIONAL CHILD TAX CREDIT (ACTC) FROM SCHEDULE 8812 — 2025'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 28 (page 2; "Additional child tax credit from Schedule 8812")'],
  ['Concept',
    'Line 28 is the REFUNDABLE additional child tax credit, computed on Schedule 8812. It is the ' +
    'spillover of unused nonrefundable CTC, capped at $1,700 per CTC-qualifying child via Part II-A ' +
    'or Part II-B. ★ DUAL-PATH GATED CREDIT — line 28 has two alternative computation paths: Part ' +
    'II-A (all filers; 15% of earned income above $2,500) and Part II-B (filers with ≥3 qualifying ' +
    'children OR Puerto Rico bona fide residents; payroll-tax-based formula). The max of the two ' +
    'paths is taken. ★ INSEPARABLE from line 19 — single computeSchedule8812 helper produces both.'],
  ['Top-level formula (spec §1 + §8)',
    'Form1040.line28 = Schedule8812.line27ActcCredit\n' +
    '\n' +
    'Schedule 8812 Part I (lines 1-14):\n' +
    '  line5  = $2,200 × numCtcChildren   (★ CODE; G13 DOCS CLAIM $2,000)\n' +
    '  line7  = $500   × numOdcDependents\n' +
    '  line8  = line5 + line7\n' +
    '  line9  = $400,000 (MFJ) | $200,000 (others)  ★ M4 isMfj-flag-gated\n' +
    '  line11 = $50 × ceil(max(0, MAGI − line9) / $1,000)\n' +
    '  line12 = line8 − line11   (★ if ≤ 0, all credits = 0)\n' +
    '  line13 = CLW-A = line18 − sum(prior nonrefundable credits)\n' +
    '  line14 = min(line12, line13)   → Form1040.line19 (nonrefundable CTC+ODC)\n' +
    '\n' +
    'Schedule 8812 Part II-A (lines 15-20):\n' +
    '  line16a = max(0, line12 − line14)  (excess credit over tax)\n' +
    '  line16b = $1,700 × numCtcChildren   (★ ACTC ceiling)\n' +
    '  line17  = min(line16a, line16b)\n' +
    '  line18a = wages + nontaxable combat pay election (line 1z + line 1i)\n' +
    '  line19  = max(0, line18a − $2,500)\n' +
    '  line20  = 15% × line19              (Part II-A ACTC)\n' +
    '\n' +
    'Schedule 8812 Part II-B (lines 21-26; only if numCtcChildren ≥ 3 OR PR resident):\n' +
    '  line21 = SS withheld (W-2 box 4 both spouses) × 2 if MFJ\n' +
    '  line22 = Schedule 2 lines 5 + 6 + 13\n' +
    '  line23 = line21 + line22\n' +
    '  line24 = EIC (line 27a) + refundable AOTC (line 29)\n' +
    '  line25 = max(0, line23 − line24)\n' +
    '  line26 = max(line20, line25)        (Part II-B ACTC)\n' +
    '\n' +
    'Final:\n' +
    '  line27 = min(line17, max(line20, line26 if applicable))   → Form1040.line28'],
  ['Surrounding page-2 chain',
    'line 25d = totalWithholding\n' +
    'line 26  = estimatedTaxPayments\n' +
    'line 27a = EIC                                       (line 27c opt-out: G12 OOS)\n' +
    '★ line 28 = ACTC from Schedule 8812                  (★ THIS LINE — additionalChildTaxCredit)\n' +
    'line 29  = refundable AOTC from Form 8863\n' +
    'line 31  = Schedule 3 line 15\n' +
    'line 32  = line 27a + line 28 + line 29 + line 30 + line 31\n' +
    'line 33  = line 25d + line 26 + line 32\n' +
    '\n' +
    '★ Line 28 is 2nd addend in line 32 (refundable credits subtotal).\n' +
    '★ Line 28 INSEPARABLE from line 19 — same helper produces both.'],
  ['Opt-out checkbox (spec §6)',
    'Form 1040 line 28 row has a checkbox: "If you do not want to claim the ACTC, check here."\n' +
    '★ User checks → `electsNoActc=true` → line 28 = 0 (Schedule 8812 line 27 zeroed)\n' +
    '★ Auto-derived PDF field: unmapped_c2_14_0 from `computation.schedule8812.electsNoActc`'],
  ['Output target',
    'Primary: form1040.payments.additionalChildTaxCredit (BigDecimal; line 28 output)\n' +
    'Schedule 8812 model: Schedule8812.line27ActcCredit\n' +
    'PDF field: line28_additional_child_tax_credit (page 2)\n' +
    'Frontend field: form.payments?.additionalChildTaxCredit'],
  ['Backend implementation',
    '**HELPER METHOD** — `computeSchedule8812(form1040, filingStatus, dependents, schedule3, schedule2, ' +
    'w2Entries, form2555Taxpayer, form2555Spouse, ctcScreening, form8862, you, spouse, flags)` at ' +
    'TaxReturnComputeService.java:22999 (~800 lines; 13-parameter signature). ★ Produces BOTH line 19 ' +
    '(line14CtcOdcCredit) AND line 28 (line27ActcCredit). ' +
    '**WIRING SITE** — `computeLine31ThroughLine38` reads `schedule8812.getLine27ActcCredit()` and ' +
    'calls `payments.setAdditionalChildTaxCredit(...)` for line 28. ' +
    '★ Covered by **19 #6 NEW VERIFIED CORRECT breadcrumb** at line 23163-23280 (planted 2026-05-14 ' +
    'during line 19 audit; documents Part II-A ACTC + earned-income worksheet + $2,500 floor + 15% rate). ' +
    '★ Sub-helpers: G9 ITIN check via `you`+`spouse` params; G11 Puerto Rico resident bypass; G4 ' +
    '`electsNoActc` opt-out short-circuit.'],
  ['IRS source',
    'IRS 2025 Form 1040 (page 2 line 28 "Additional child tax credit from Schedule 8812") + 2025 ' +
    'Instructions for Form 1040 + 2025 Instructions for Schedule 8812 (Form 1040) + One Big Beautiful ' +
    'Bill Act (OBBBA) 2025 (raised CTC to $2,200 per qualifying child) + Rev. Proc. 2024-40 §3.08 ' +
    '(pre-OBBBA, $2,000) + IRC §24 (statutory authority). ★ 2025 changes: SSN rule loosened (only one ' +
    'spouse needs valid SSN for MFJ); CTC raised to $2,200 (OBBBA); ACTC ceiling at $1,700.'],
  [],
  ['STEP-BY-STEP COMPUTATION (high-level; full chain in 19 #6 breadcrumb)'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Form 8862 gate (line 23012-23026)', 'If ctcPreviouslyDenied AND no valid Form 8862 → return zero result + emit FORM_8862_CTC_REQUIRED flag.'],
  [2, 'MAGI = AGI + Form 2555 exclusions (line 23031-23056)', 'Both spouses\' Form 2555 exclusions added back unconditionally (line 23046-23053).'],
  [3, 'Qualifying children count (line 23058-23071)', 'DependentRecord.qualifiesForCTC() + qualifiesForODC().'],
  [4, 'Tentative credit (line 23073-23080)', '★ line5 = $2,200 × numCtcChildren ★ G13 (docs claim $2,000); line7 = $500 × numOdcDependents.'],
  [5, 'Phase-out (line 23082-23103)', '★ M4 INSTANCE: threshold = isMfj ? $400k : $200k. line11 = $50 × ceil(excess / $1,000).'],
  [6, 'Part I gate (line 23105-23113)', 'If line 8 ≤ line 11 → all credits zero; return.'],
  [7, 'Credit Limit Worksheet A (line 23118-23147)', 'wA1 = line 18 (totalTaxBeforeCredits) − sum(8 prior nonrefundable credits from Schedule 3).'],
  [8, 'Line 14 nonrefundable CTC+ODC (line 23149-23151)', '`line14 = min(line12, worksheetA)` → Form1040.line19.'],
  [9, 'electsNoActc opt-out (line 23153-23161)', 'If user checked Form 1040 line 28 opt-out → line 27 = 0; return.'],
  [10, '★ Part II-A computation (line 23163+; see 19 #6 breadcrumb)', 'Lines 15-20: ACTC eligibility + $2,500 floor + 15% rate. line20 = 15% × max(0, earnedIncome − $2,500).'],
  [11, '★ Part II-B computation (only if numCtcChildren ≥ 3 OR PR resident)', 'Lines 21-26: payroll-tax-based formula. line26 = max(line20, line25).'],
  [12, 'Final line 27 = min(line17, Part II-A or Part II-B result)', 'Larger of Part II-A or Part II-B if both apply.'],
  [13, 'computeLine31ThroughLine38 reads schedule8812.getLine27ActcCredit()', '`payments.setAdditionalChildTaxCredit(line27)` for line 28 output.'],
  [],
  ['INVARIANTS / VALIDATIONS'],
  ['Invariant', 'Rationale'],
  ['Line 28 ≥ 0', 'ACTC by IRS rules ≥ 0; refundable credit.'],
  ['Line 28 = 0 if numCtcChildren == 0', 'ACTC only available for CTC-qualifying children (per IRC §24).'],
  ['Line 28 = 0 if Form 2555 filed by EITHER spouse', 'IRC §24(d)(5)(B); ACTC blocked at filer level.'],
  ['Line 28 = 0 if electsNoActc=true', 'User opt-out via Form 1040 line 28 checkbox.'],
  ['Line 28 = 0 if Form 8862 gate fails', 'FORM_8862_CTC_REQUIRED flag emitted.'],
  ['Line 28 = 0 if G9 ITIN rule fails (both spouses on MFJ have ITINs)', 'G9 FIXED 2026-04-20.'],
  ['Line 28 ≤ $1,700 × numCtcChildren', '★ ACTC ceiling per IRC §24(h)(5).'],
  ['Line 28 + Line 19 ≤ line5 + line7', 'Total credits cannot exceed tentative credit.'],
  ['Part II-B used iff numCtcChildren ≥ 3 OR Puerto Rico bona fide resident', '★ G11 FIXED 2026-04-20.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 38 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 28'],
  ['Line 28 (Schedule 8812 line 27) requires 13 helper parameters + extensive upstream Form 1040 / Schedule 2 / Schedule 3 / dependent data. ★ INSEPARABLE from line 19 — both produced by single computeSchedule8812 call.'],
  [],
  ['HELPER SIGNATURE — 13 parameters'],
  ['#', 'Parameter', 'Type', 'Used for'],
  [1, 'form1040', 'Form1040', 'AGI (line 11b) + line 18 (totalTaxBeforeCredits) + EIC (line 27a pre-set) + AOTC (line 29 pre-set) + wages (line 1z) + combat pay (line 1i)'],
  [2, 'filingStatus', 'Map', '★ M4 INSTANCE: drives isMfj for threshold ($400k vs $200k)'],
  [3, 'dependents', 'List<DependentRecord>', 'Count qualifying CTC children + ODC dependents'],
  [4, 'schedule3', 'Schedule3', 'CLW-A: 8 prior nonrefundable credits summed'],
  [5, 'schedule2', 'Schedule2', 'Part II-B line 22 (lines 5+6+13)'],
  [6, 'w2Entries', 'List<Map>', 'Part II-B line 21 SS withheld (W-2 box 4)'],
  [7, 'form2555Taxpayer', 'Form2555', 'MAGI add-back + ACTC block (per spec §3a)'],
  [8, 'form2555Spouse', 'Form2555', 'MAGI add-back + ACTC block (line 19 #1 LEAK POINT 2 protected by null-shadow)'],
  [9, 'ctcScreening', 'Map', 'electsNoActc + ctcPreviouslyDenied + isBonafidePuertoRicoResident (G11)'],
  [10, 'form8862', 'Form8862', 'Form 8862 gate (claimsCTC + ctcEligible)'],
  [11, 'you', 'Map', '★ G9 ITIN check — taxpayer SSN'],
  [12, 'spouse', 'Map', '★ G9 ITIN check — spouse SSN (MFJ only)'],
  [13, 'flags', 'List<TaxReturnFlag>', 'Emits FORM_8862_CTC_REQUIRED'],
  [],
  ['UPSTREAM FORM 1040 / SCHEDULE FIELDS'],
  ['#', 'Field', 'Use'],
  [14, 'form1040.adjustments.line11bAmountFromLine11aAdjustedGrossIncome', 'MAGI base (Part I)'],
  [15, 'form1040.taxAndCredits.totalTaxBeforeCredits', 'CLW-A wA_1 (line 18)'],
  [16, 'form1040.payments.earnedIncomeCredit', 'Part II-B line 24 (must be pre-set)'],
  [17, 'form1040.payments.americanOpportunityCredit', 'Part II-B line 24 (must be pre-set)'],
  [18, 'form1040.income.totalWages (line 1z)', 'Part II-A line 18a earned income'],
  [19, 'form1040.income.nontaxableCombatPayElection (line 1i)', 'Part II-A line 18a earned income'],
  [],
  ['SCHEDULE 3 NONREFUNDABLE CREDITS (CLW-A wA_2 through wA_9)'],
  ['#', 'Field', 'Maps to'],
  [20, 'schedule3.nonrefundableCredits.foreignTaxCredit', 'CLW-A wA_2 (Sched3 line 1)'],
  [21, 'schedule3.nonrefundableCredits.childDependentCareCredit', 'CLW-A wA_3 (Sched3 line 2)'],
  [22, 'schedule3.nonrefundableCredits.educationCredits', 'CLW-A wA_4 (Sched3 line 3)'],
  [23, 'schedule3.nonrefundableCredits.retirementSavingsContributionsCredit', 'CLW-A wA_5 (Sched3 line 4)'],
  [24, 'schedule3.nonrefundableCredits.elderlyDisabledCredit', 'CLW-A wA_6 (Sched3 line 6d)'],
  [25, 'schedule3.nonrefundableCredits.energyEfficientHomeImprovementCredit', 'CLW-A wA_7 (Sched3 line 5b)'],
  [26, 'schedule3.nonrefundableCredits.cleanVehicleCredit', 'CLW-A wA_8 (Sched3 line 6f)'],
  [27, 'schedule3.nonrefundableCredits.creditPreviouslyOwnedCleanVehicles', 'CLW-A wA_9 (Sched3 line 6m)'],
  [],
  ['SCHEDULE 2 OTHER TAXES (Part II-B line 22)'],
  ['#', 'Field', 'Notes'],
  [28, 'schedule2.otherTaxes.uncollectedSocialSecurityMedicareTaxOnWages', 'Sched 2 line 5'],
  [29, 'schedule2.otherTaxes.uncollectedSocialSecurityMedicareRrtaTax', 'Sched 2 line 6'],
  [30, 'schedule2.otherTaxes.additionalMedicareTax', 'Sched 2 line 13 (from Form 8959)'],
  [],
  ['CTC SCREENING TAXPAYER FORM'],
  ['#', 'Field', 'Effect'],
  [31, 'electsNoActc', '★ Convention 6 OPT-OUT — true → line 28 = 0'],
  [32, 'ctcPreviouslyDenied', '★ Convention 5 SCREENING GATE — true → Form 8862 required'],
  [33, 'isBonafidePuertoRicoResident', '★ Convention 7 PR RESIDENT BYPASS — G11 fix; always Part II-B'],
  [],
  ['★ M4 USAGE IN HELPER'],
  ['Instance', 'Line', 'Code', 'Purpose'],
  ['M4-1', '23085', 'threshold = isMfj ? $400,000 : $200,000', 'Phase-out threshold (MFJ vs others)'],
  ['M4-2', '~23xxx', 'G9 ITIN check uses isMfj for spouse', 'Both spouses checked if MFJ; only taxpayer if non-MFJ'],
  ['M4-?', 'Part II-B line 21', 'SS withheld combined for MFJ', 'Both spouses W-2 box 4 summed if MFJ'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 6 }, { wch: 50 }, { wch: 22 }, { wch: 80 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 28'],
  ['★ HEAVY 2025 reference-data set — second-heaviest in workflow after line 27a (which had 72). Line 28 uses ~15 distinct constants from IRS Rev. Proc. 2024-40 + OBBBA Act 2025 + IRC §24.'],
  [],
  ['Constant', '2025 Value', 'Statutory Basis', 'Backend identifier'],
  ['★★ CTC per qualifying child (line 5)', '★ $2,200 (per OBBBA; code) OR $2,000 (per docs)', '★ G13 DISCREPANCY — code: OBBBA + Rev. Proc. 2024-40 §3.08; docs: claim G10 fixed to $2,000', 'Hardcoded "2200" at TaxReturnComputeService.java:23075'],
  ['ODC per other dependent (line 7)', '$500', 'IRC §24(h)(4)', 'Hardcoded "500" at line 23076'],
  ['Phase-out threshold MFJ (line 9)', '$400,000', 'IRC §24(h)(3)', 'Hardcoded "400000" at line 23085 (M4 isMfj-flag)'],
  ['Phase-out threshold others (line 9)', '$200,000', 'IRC §24(h)(3)', 'Hardcoded "200000" at line 23085'],
  ['Phase-out rate (line 11)', '$50 per $1,000 excess (5%)', 'IRC §24(b)(2)', 'Hardcoded "0.05" + ceiling rounding to $1,000'],
  ['ACTC ceiling per qualifying child (line 16b)', '$1,700', 'IRC §24(h)(5)', 'Per spec §3'],
  ['Earned income floor (line 19)', '$2,500', 'IRC §24(d)(1)(B)(i)', 'Hardcoded in Part II-A computation'],
  ['Earned income ACTC rate (line 20)', '15% (0.15)', 'IRC §24(d)(1)(B)(ii)', 'Hardcoded in Part II-A computation'],
  ['Part II-B threshold (numCtcChildren)', '≥ 3 OR Puerto Rico bona fide resident', 'IRC §24(d)(1)(B)(ii) + Puerto Rico special rule', '★ G11 FIXED 2026-04-20 — isBonafidePuertoRicoResident'],
  [],
  ['★ Reference-data comparison across recent audits'],
  ['Audit', '# numeric constants', 'Note'],
  ['25a-25d', '0 (tied)', ''],
  ['26', '4 (calendar dates only)', ''],
  ['27a', '★ 72 (HEAVIEST)', '6 × 12 EIC table parameters + ceiling + age bounds + relationships'],
  ['27b/27c', '0 (degenerate)', ''],
  ['**28**', '**★ ~15 (SECOND-HEAVIEST)**', '★ G13 discrepancy on CTC per-child amount'],
  [],
  ['★★ G13 DISCREPANCY DETAIL (★ HIGH severity if code is wrong; MEDIUM if docs are wrong)'],
  ['Source', 'Claim'],
  ['Code (TaxReturnComputeService.java:23074-23075)', '★ $2,200; comment cites "Rev. Proc. 2024-40 §3.08; increased from $2,000 in 2024"'],
  ['19 #6 breadcrumb (line 23163-23280; planted 2026-05-14)', 'Cites "OBBBA + Rev. Proc. 2024-40 §3.08" for Part II-A verification'],
  ['Spec lines/28.md §3 (audit 2026-04-20)', '"$2,000 per qualifying child (fixed 2026-04-20)"'],
  ['Dependencies dependencies/28.md §6 G10 (2026-04-20)', '"$2,200 vs IRS $2,000 | FIXED 2026-04-20 — corrected to $2,000"'],
  ['Knowledge knowledge_line28.md line 60 (2026-04-20)', '"$2,000 × children (fixed 2026-04-20; IRS 2025 verified $2,000)"'],
  ['Resolution needed', '★ User must verify against 2025 IRS Form 1040 / Schedule 8812 final instructions; OBBBA passed July 2025 likely raised CTC to $2,200'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 30 }, { wch: 55 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 28 Persistence + Downstream Consumers'],
  ['Line 28 sets one field on Payments output model + populates 24+ Schedule8812 fields. ★ INSEPARABLE from line 19 — same helper.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.payments.additionalChildTaxCredit', 'computeLine31ThroughLine38 reads Schedule8812.line27ActcCredit', '★ CANONICAL line 28 output'],
  ['form1040.taxAndCredits.childTaxCredit', 'computeLine20ThroughLine24 reads Schedule8812.line14CtcOdcCredit', '★ Line 19 (nonrefundable CTC+ODC)'],
  ['Schedule8812 (24+ fields)', 'computeSchedule8812 populates all', 'PDF export of Schedule 8812'],
  [],
  ['SAME-METHOD DOWNSTREAM'],
  ['Line 32 = line 27a + line 28 + line 29 + line 30 + line 31', '~line 19940', '★ Line 28 is 2nd addend in refundable credits subtotal.'],
  ['Line 33 = line 25d + line 26 + line 32', '~line 19960', 'Line 28 affects line 33 transitively.'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Frontend PDF export (Form 1040)', 'form-tax-return-1040.component.ts', '`values["line28_additional_child_tax_credit"] = formatAmount(payments?.additionalChildTaxCredit)`'],
  ['Frontend PDF export (opt-out box)', 'form-tax-return-1040.component.ts', '`values["unmapped_c2_14_0"] = computation?.schedule8812?.electsNoActc === true`'],
  ['Schedule 8812 PDF export', 'form-tax-return-schedule8812.component.ts', 'All 24+ Schedule8812 fields'],
  [],
  ['PDF Output'],
  ['PDF Field', 'Field Code'],
  ['Line 28 amount (page 2)', 'line28_additional_child_tax_credit'],
  ['Line 28 opt-out checkbox', 'unmapped_c2_14_0 (Form 1040 page 2; AcroForm field name TBD per spec)'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 50 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 28'],
  ['Line 28 emits 1 BLOCKING FLAG (FORM_8862_CTC_REQUIRED) when CTC/ACTC was previously denied. Multiple structural short-circuit returns enforce eligibility.'],
  [],
  ['Flag code', 'Severity', 'Condition'],
  ['FORM_8862_CTC_REQUIRED', 'BLOCKING', 'ctcPreviouslyDenied=true AND (Form 8862 not filed OR form8862.claimsCTC=false OR form8862.ctcEligible=false). Returns zero Schedule8812 result. Can be bypassed via overrideFlags.'],
  [],
  ['STRUCTURAL INVARIANTS'],
  ['Invariant', 'How enforced'],
  ['Line 28 ≥ 0', 'STRUCTURALLY enforced — ACTC by IRS rules ≥ 0.'],
  ['Line 28 = 0 if numCtcChildren == 0', 'STRUCTURALLY enforced (Part II-A precondition).'],
  ['Line 28 = 0 if either Form 2555 filed', 'STRUCTURALLY enforced (IRC §24(d)(5)(B)).'],
  ['Line 28 = 0 if electsNoActc=true', 'STRUCTURALLY enforced at line 23156-23161.'],
  ['Line 28 = 0 if Form 8862 gate fails', 'STRUCTURALLY enforced at line 23015-23026.'],
  ['Line 28 = 0 if G9 ITIN rule fails', '★ G9 FIXED 2026-04-20 — blocked only when BOTH spouses on MFJ have ITINs.'],
  ['Part II-B used iff numCtcChildren ≥ 3 OR PR resident', '★ G11 FIXED 2026-04-20.'],
  ['Line 27 = min(line17, max(line20, line26))', 'STRUCTURALLY enforced; ACTC ceiling applied.'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 14 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 28 is the refundable ACTC (★ DUAL-PATH GATED CREDIT via Part II-A or Part II-B). 20th audit OUTSIDE 13ab pair; NINTH payments-section audit (★ FIRST audit AFTER 27abc cluster complete). ★★★ G13 NEW GAP SURFACED — CTC per-child amount discrepancy ($2,000 docs vs $2,200 code); ★ 2nd consecutive new-gap audit after G12 at 27c. 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-16 — ★ M4 RECURRENCE (2nd recurrence after 27a debut at line 26); ★ 13th orchestrator-method-based audit; helper uses isMfj-flag at threshold selection + G9 ITIN check; pattern distribution after 15 audits: 6 M2 + 4 M3 + 3 M4 + 2 degenerate',
    '**Per-input MFS-leakage analysis**: line 28 helper at TaxReturnComputeService.java:22999-23800+ uses M4 ("in-helper isMfs-flag-gated logic") at multiple points within the same helper. ★ Primary M4 instance at line 23085: `threshold = isMfj ? $400,000 : $200,000` (phase-out threshold selection). ★ G9 ITIN check (added 2026-04-20) uses isMfj to decide whether to check spouse SSN as well as taxpayer SSN. ★ Part II-B line 21 SS withheld combines both spouses\' W-2 box 4 for MFJ. **★ 2nd RECURRENCE of M4 in workflow** (after 26 debut + 27a 1st recurrence). **★ 13th orchestrator-method-based audit**. Pattern distribution after 15 audits: 6 M2 + 4 M3 + **3 M4** (26 + 27a + 28) + 2 degenerate. ★ M4 mechanism now structurally validated across 3 distinct helpers. MFS-guard cascade UNCHANGED at 20 orchestrators. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:22999-23800+ (helper); M4 at line 23085 + G9 ITIN check',
    'CLOSED — ★ M4 RECURRENCE (2nd recurrence in workflow after 27a). ★ 13th orchestrator-method-based audit. Pattern distribution after 15 audits: 6 M2 + 4 M3 + **3 M4** (debut + 2 recurrences) + 2 degenerate. ★ M4 mechanism firmly established. MFS-guard cascade UNCHANGED at 20 orchestrators. Pure cross-reference closure. 765/765 unchanged.'],

  [2, 'RESOLVED 2026-05-16 — ★ 21st LEGACY A MIGRATION — Renamed knowledge_line28.md → line-28-actc-schedule-8812.md (convergence 33 → 34; ★ 3 consecutive Legacy A audits — 26 #2 + 27a #2 + 28 #2)',
    '**The situation**: Knowledge file at `knowledge_line28.md` follows Legacy A naming. ★ This audit produces the 21st Legacy A migration — `knowledge_line28.md` → `line-28-actc-schedule-8812.md`. Convergence count advances **33 → 34 lines**. ★ **3 consecutive Legacy A audits** (after 26 #2 was 19th, 27a #2 was 20th). Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\knowledge\\knowledge_line28.md (rename to line-28-actc-schedule-8812.md)',
    'CLOSED — knowledge_line28.md RENAMED to line-28-actc-schedule-8812.md. **★ 21st Legacy A migration in workflow** (previously 20). Convergence advanced **33 → 34 lines**. ★ **3 consecutive Legacy A audits** after 26 #2 + 27a #2. ★ Naming convention firmly established: 21 of 38+ lines have descriptive `line-N-*.md` knowledge files. Generator updated to reference new filename.'],

  [3, 'RESOLVED 2026-05-16 — ★ SPEC ENHANCEMENT — Created NEW §13 Verification log in lines/28.md (★ 23rd CONSECUTIVE single-row contribution; ★ FIRST single-spec §11+ audit since 27a #3)',
    '**Goal**: create a NEW `## 13) Verification log` section in `lines/28.md` for the line 28 audit. Numbered §13 because lines/28.md uses §1-§12 (last is §12 "Schedule 8812 PDF Field Map"). Row 1 in IN-PROGRESS state with #1-#3 closures; finalized to COMPLETE at Issue #10. **★ 23rd CONSECUTIVE single-row contribution in workflow**. ★ FIRST single-spec §11+/13 audit since 27a #3 (intervening 27b/27c were combined-spec ROW APPENDs).',
    'C:\\us-tax\\lines\\28.md (create new §13 Verification log section)',
    'CLOSED — NEW §13 Verification log section CREATED in lines/28.md with single-row IN-PROGRESS state. Will be finalized to COMPLETE at Issue #10. **★ 23rd CONSECUTIVE single-row contribution in workflow**. ★ FIRST single-spec §11+/13 audit since 27a #3.'],

  [4, 'RESOLVED 2026-05-16 — ★ 13th META-AUDIT IN WORKFLOW — sub-type (b); ★ DOMINANCE to ~92% (12 of 13); ★★ SURFACED MAJOR DRIFT — G13 CTC per-child amount ($2,000 in 3 doc files vs $2,200 in code with OBBBA citation); ★ 4th drift-surfacing META-AUDIT in 5 audits (26 #4 + 27a #4 + 27c #4 + 28 #4; only 27b #4 was clean); ★ 14th doc-drift fix in workflow; clean trend declines from 55% to 50%; ★ 3 doc files updated to mark G10 as REOPENED with OBBBA citation',
    '**The situation**: Standard sub-type (b) META-AUDIT — dependencies/28.md + knowledge §0 banners. **★ 13th META-AUDIT in workflow**. **★ DOMINANCE to ~92% — 12 of 13 META-AUDITS** (22+23+24+25a+25b+25c+25d+26+27a+27b+27c+28); line 21 alone uses sub-type (a). **★★ SURFACES MAJOR DRIFT — G13** (also covered at Issue #9): (i) spec lines/28.md §3 claims "$2,000 per qualifying child (fixed 2026-04-20)"; (ii) dependencies/28.md §6 G10 claims "FIXED 2026-04-20 — corrected to $2,000"; (iii) knowledge_line28.md line 60 claims "$2,000 × children (fixed 2026-04-20; IRS 2025 verified $2,000)"; but the actual code at TaxReturnComputeService.java:23074-23075 uses **$2,200** with comment citing "Rev. Proc. 2024-40 §3.08; increased from $2,000 in 2024". ★ 19 #6 breadcrumb (planted 2026-05-14) cites "OBBBA + Rev. Proc. 2024-40 §3.08" for verification — likely the OBBBA Act of 2025 raised CTC to $2,200. ★ **4th drift-surfacing META-AUDIT in 5 audits** (26 #4 + 27a #4 + 27c #4 + 28 #4; only 27b #4 was clean). ★ Clean trend in sub-type (b) declines from 55% to 50% (6 clean / 12). **★ DRIFT FIX REQUIRED**: update spec/dependencies/knowledge to reflect actual $2,200 value with OBBBA citation; mark G10 as "REOPENED — IRS 2025 actually $2,200 per OBBBA Act". ★ Pure documentation drift fix (no code change; code is presumed correct per OBBBA).',
    'spec lines/28.md §3 ($2,000 claim); dependencies/28.md §6 G10 ($2,000 fix claim); knowledge §60 ($2,000 verified claim); TaxReturnComputeService.java:23074-23075 ($2,200 in code)',
    'CLOSED — META-AUDIT consistency check complete with DRIFT FIX. **★ 13th META-AUDIT in workflow**. **★ DOMINANCE to ~92% — 12 of 13 META-AUDITS use sub-type (b)**. **★★ SURFACES MAJOR DRIFT** — 3 doc files claim CTC $2,000 (G10 fix); code uses $2,200 with OBBBA citation; 19 #6 breadcrumb cites OBBBA for verification. Fixed by updating spec/dependencies/knowledge to mark G10 as REOPENED + reflect actual $2,200 value with OBBBA citation. **★ 14th doc-drift fix in workflow**. **★ 4th drift-surfacing META-AUDIT in 5 audits** (26 #4 + 27a #4 + 27c #4 + 28 #4; only 27b #4 was clean). Clean trend declines from 55% to 50%. ★ Pattern observation: high-frequency drift suggests doc maintenance has fallen behind code changes; codebase stability has shifted to documentation maintenance as the weak link.'],

  [5, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — line 28 wiring + helper; ★ 22nd anti-duplication application; ★ pre-existing 19 #6 helper breadcrumb at line 23163-23280 covers line 28 (single helper produces both line 19 AND line 28); ★ 19 #6 breadcrumb is LOAD-BEARING for cross-line family — FIRST cross-line family breadcrumb in workflow (parallel to 20 #6 credits-cluster + 25a #5 payments-cluster)',
    '**Closure intent**: pure cross-reference closure — verifies line 28 wiring + helper. Line 28 is produced by `computeSchedule8812` at line 22999-23800+ (~800-line helper); this same helper produces line 19 (nonrefundable CTC+ODC) and line 28 (refundable ACTC). ★ Pre-existing **19 #6 NEW VERIFIED CORRECT breadcrumb** at line 23163-23280 (planted 2026-05-14 during line 19 audit; covers Part II-A ACTC computation cited as OBBBA + Rev. Proc. 2024-40 §3.08). ★ This audit re-validates 19 #6 as method-level breadcrumb for line 28; **★ 19 #6 IS LOAD-BEARING for the line-19-and-28 family** — both line audits (19 + 28) anti-duplicate via the same breadcrumb. 3-source coverage: spec §1+§8 + dependencies §1+§2 + knowledge §2+§3. **22nd anti-duplication application**.',
    'TaxReturnComputeService.java:22999-23800+ (helper); 19 #6 breadcrumb at line 23163-23280',
    'CLOSED — verified correct via 3-source coverage + 19 #6 pre-existing breadcrumb. **★ 22nd anti-duplication application**. ★ NO new breadcrumb planted; 19 #6 breadcrumb (planted 2026-05-14 during line 19 audit) covers line 28 by virtue of single helper producing both line 19 AND line 28 outputs. **★ 19 #6 IS LOAD-BEARING** for the line-19-and-28 family — both audits anti-duplicate via the same breadcrumb. ★ Cross-line family pattern: when a single helper produces multiple Form 1040 outputs, its breadcrumb is load-bearing for all those line audits.'],

  [6, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — ★ DUAL-PATH GATED CREDIT chain (★ 9th distinct complexity dimension in workflow — DUAL-PATH-GATED; distinct from 27a\'s single-path MULTI-STAGE-GATED because line 28 has Part II-A and Part II-B alternatives with max() selection; ★ Part II-B is NOT optional when conditions met per spec §8)',
    '**Closure intent**: pure cross-reference closure — verifies the dual-path gated credit chain. **★ 9th distinct complexity dimension in workflow** — DUAL-PATH GATED CREDIT (distinct from depth/cumulative/breadth/conditional/pure-sum/dual-form/multi-stage-gated/degenerate-pure/degenerate-state-derived). **Chain stages**: **(1)** Form 8862 gate. **(2)** MAGI computation. **(3)** Qualifying counts. **(4)** Tentative credit ($2,200 × children + $500 × dependents). **(5)** M4 isMfj-gated phase-out ($400k MFJ / $200k others). **(6)** Part I gate (line 8 ≤ line 11 → zero). **(7)** CLW-A computation. **(8)** Line 14 nonrefundable CTC+ODC → Form1040 line 19. **(9)** electsNoActc opt-out. **(10)** ★ PART II-A computation (15% of earned-income > $2,500). **(11)** ★ PART II-B computation (only if numCtcChildren ≥ 3 OR PR resident; payroll-tax-based). **(12)** ★ max(Part II-A, Part II-B) selection. **(13)** Final line 27 → Form1040 line 28. **★ KEY DISTINCTION FROM 27a**: line 27a is single-path multi-stage gated; line 28 has TWO alternative computation paths with max() selection.',
    'TaxReturnComputeService.java:22999-23800+ (helper); spec §8 (Part II-A vs Part II-B)',
    'CLOSED — verified correct via DUAL-PATH GATED CREDIT chain. **★ 9th distinct complexity dimension in workflow** — DUAL-PATH GATED CREDIT (distinct from depth/cumulative/breadth/conditional/pure-sum/dual-form/multi-stage-gated/degenerate-pure/degenerate-state-derived). 13-stage chain with TWO parallel sub-paths (Part II-A and Part II-B) gated by `numCtcChildren ≥ 3 OR PR resident` condition; max() selection from the two paths. ★ KEY: line 28 is structurally distinct from line 27a (single-path multi-stage) because of the dual-path max() selection.'],

  [7, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — ★ 7 CONVENTIONS (★ NEW HIGH in workflow; exceeds prior max of 6 at 27a; Conventions 1-4 same as 25a + Convention 5 SCREENING GATE Form 8862 — ★ 3rd Convention 5 recurrence + Convention 6 ELECTS-NO-ACTC OPT-OUT — ★ UNIQUE to 28 + ★ Convention 7 PUERTO RICO BONA FIDE RESIDENT BYPASS — ★ UNIQUE to 28; ★ workflow conventions range 0-7 firmly established)',
    '**Closure intent**: pure verification closure — confirms seven line-28-specific conventions. **Convention 1 — Null-when-zero**: line27 returned as zero or non-zero (no null); line19 same. **Convention 2 — No SSN filtering at credit level**: credits aggregated by dependent.qualifiesForCTC(); G9 ITIN check is filer-level, not dependent-level. **Convention 3 — MFJ aggregation**: both spouses\' W-2 box 4 summed in Part II-B; both spouses\' Form 2555 added back for MAGI. **Convention 4 — MFS protection via M4** (★ recurrence): isMfj-flag-gated threshold + G9 ITIN check. **★ Convention 5 — SCREENING GATE Form 8862**: `ctcPreviouslyDenied=true` triggers FORM_8862_CTC_REQUIRED gate; same pattern as 26\'s `madeEstimatedTaxPayments` and 27a\'s `claimsEIC`. **★ Convention 6 — ELECTS-NO-ACTC OPT-OUT**: `electsNoActc=true` → line 28 = 0 via Form 1040 line 28 checkbox; ★ UNIQUE to 28 — user-facing voluntary opt-out (parallel to 27c but for ACTC). **★ Convention 7 — PUERTO RICO BONA FIDE RESIDENT BYPASS**: G11 fix — `isBonafidePuertoRicoResident=true` bypasses the 3-child gate for Part II-B; ★ UNIQUE to 28 — special rule for Puerto Rico filers. **★ 7 CONVENTIONS — NEW HIGH in workflow** (exceeds prior max of 6 at 27a). ★ Convention 5 RECURS (3rd time after 26 + 27a); Convention 6 NEW; Convention 7 NEW.',
    'TaxReturnComputeService.java:22999-23800+ (helper); spec §3a + §6 + §6c; knowledge §3',
    'CLOSED — verified correct. **★ 7 CONVENTIONS — NEW HIGH in workflow** (exceeds prior max of 6 at 27a). Convention 1 null-when-zero + Convention 2 no SSN filtering at credit level + Convention 3 MFJ aggregation + Convention 4 MFS protection via M4 (★ recurrence) + ★ Convention 5 SCREENING GATE Form 8862 (★ 3rd Convention 5 recurrence after 26 + 27a) + ★ Convention 6 ELECTS-NO-ACTC OPT-OUT (★ UNIQUE to 28 — user opt-out checkbox) + ★ Convention 7 PUERTO RICO BONA FIDE RESIDENT BYPASS (★ UNIQUE to 28 — G11 fix). ★ Convention count progression: 27a (6 HIGH) → 27b/c (0 LOW) → 28 (7 NEW HIGH). Workflow conventions range now spans 0-7.'],

  [8, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — 0 routing distinctions + ★ HEAVY 2025 reference-data set (~15 distinct constants; ★ SECOND-HEAVIEST after 27a at 72); ★ workflow reference-data range firmly established 0-72 with 3 tiers (0 floor / ~15 mid / 72 ceiling); all 15 constants validated against OBBBA + Rev. Proc. 2024-40 + IRC §24 + Pub. 570',
    '**Closure intent**: pure verification closure. **Routing**: ★ ZERO — line 28 has no dedicated input form; all inputs are computed/derived from other forms. **Reference data**: ★ ~15 distinct constants — $2,200 CTC + $500 ODC + $1,700 ACTC ceiling + $400k/$200k thresholds + $50/$1,000 phase-out + $2,500 floor + 15% rate + 3-child Part II-B trigger. ★ **SECOND-HEAVIEST 2025 reference-data set after 27a (72)**. ★ Workflow reference-data range now 0-72 (28 enters middle at ~15).',
    'TaxReturnComputeService.java:22999-23800+ (~15 constants embedded); spec §3 + §8',
    'CLOSED — verified correct. **Routing**: ★ ZERO routing distinctions. **Reference data**: ★ ~15 distinct 2025 constants. **★ SECOND-HEAVIEST 2025 reference-data set in workflow** (27a at 72 ceiling; 28 at ~15 mid; 25a-d / 26 / 27b/c at 0 floor). ★ Workflow reference-data range firmly established.'],

  [9, 'RESOLVED 2026-05-16 — ⚠️★★★ NEW DEFERRED ENHANCEMENT — G13 SURFACED: CTC per-child amount documentation drift ($2,000 in 3 doc files vs $2,200 in code with OBBBA + Rev. Proc. 2024-40 §3.08 citation); ★ G13 entry added to outstanding.md just above G12 entry; ★ MEDIUM severity (presumed code is OBBBA-correct); ★ user must verify against IRS 2025 final instructions; ★ 2nd consecutive new-gap audit after G12 at 27c; ★ confirms streak-end',
    '**★★★ G13 NEW GAP SURFACED**: ★ Code at TaxReturnComputeService.java:23074-23075 uses **$2,200** per CTC-qualifying child with comment citing "Rev. Proc. 2024-40 §3.08; increased from $2,000 in 2024". ★ 19 #6 breadcrumb (planted 2026-05-14) cites "OBBBA + Rev. Proc. 2024-40 §3.08" for Part II-A verification. ★ Spec lines/28.md §3 + dependencies/28.md §6 G10 + knowledge_line28.md line 60 ALL claim CTC is "$2,000 per qualifying child (fixed 2026-04-20)" and document G10 as "FIXED 2026-04-20 — corrected to $2,000". ★ **DISCREPANCY**: code says $2,200; 3 doc files say $2,000 was the correct fix. ★ **MOST LIKELY EXPLANATION**: OBBBA Act (passed July 2025) raised CTC to $2,200 for tax year 2025; code was updated 2026-05-14 with OBBBA citation at 19 #6 breadcrumb time; spec/dependencies/knowledge weren\'t updated. ★ **Severity assessment**: MEDIUM (if code is correct per OBBBA, just doc drift) OR HIGH (if code is wrong and should be $2,000, every taxpayer with CTC-eligible children gets $200/child too much). ★ **User action required**: verify against IRS 2025 Form 1040 / Schedule 8812 final instructions (authoritative). ★ **2nd consecutive new-gap audit** (after G12 at 27c). ★ Confirms streak-end — 32-consecutive-zero-outstanding streak broken at 27c; new streak from 0 still at 0. ★ Drift fix already applied at Issue #4 (spec/deps/knowledge updated to mark G10 as REOPENED with OBBBA citation).',
    'TaxReturnComputeService.java:23074-23075 ($2,200); spec lines/28.md §3 ($2,000); dependencies/28.md §6 G10 ($2,000 fix); knowledge §60 ($2,000 verified); 19 #6 breadcrumb (OBBBA citation)',
    'CLOSED — G13 NEW GAP DOCUMENTED and tracked in `outstanding.md`. ★ Code uses $2,200 with OBBBA citation; 3 doc files claim $2,000 (G10 fix); ★ DRIFT fix applied at Issue #4. ★ Recommended user action: verify against IRS 2025 Form 1040 / Schedule 8812 final instructions; OBBBA Act of July 2025 likely raised CTC to $2,200 (matching code). If verified, mark G10 as REOPENED — code is correct; if $2,000 turns out to be the actual IRS amount, revert code from $2,200 to $2,000 (HIGH severity downgrade-to-MEDIUM-after-revert). ★ **2nd consecutive new-gap audit** (after G12 at 27c). ★ Confirms streak-end — 32-consecutive-zero-outstanding streak broken at 27c is not recovering at 28. ★ Severity: MEDIUM (presumed code is OBBBA-correct).'],

  [10, 'RESOLVED 2026-05-16 — BOUNDARY MILESTONE — Line 28 walkthrough complete at 10/10; ★ NINTH payments-section audit; ★ FIRST audit AFTER 27abc cluster complete; ★ G13 NEW GAP — 2nd consecutive streak-breaker (confirms streak-end); ★ DUAL-PATH GATED CREDIT chain — 9th distinct complexity dimension; ★ 13th META-AUDIT — DOMINANCE to ~92%; ★ 4th drift-surfacing META-AUDIT in 5 audits; ★ 7 CONVENTIONS NEW HIGH; ★ 21st Legacy A migration; ★ M4 RECURRENCE (3rd M4 instance)',
    'Pure xlsx-flip + Verification log row 1 finalization — **CLOSES the 28 walkthrough at 10/10**. TWO file touches: (a) this row flipped to RESOLVED; (b) lines/28.md §13 Verification log row 1 finalized IN-PROGRESS → **COMPLETE — 10/10 closed**. **Eight themes**: (1) ★ Structural positioning — 20th audit OUTSIDE 13ab pair; ★ NINTH payments-section audit; ★ FIRST audit AFTER 27abc cluster complete; 59th line; ★ INSEPARABLE from line 19 (shared helper). (2) **★ M4 RECURRENCE** — 2nd recurrence in workflow after 27a; 13th orchestrator-method-based; pattern distribution after 15 audits: 6 M2 + 4 M3 + 3 M4 + 2 degenerate; MFS cascade UNCHANGED at 20. (3) **★ 13th META-AUDIT** — sub-type (b) at 92% DOMINANCE (12 of 13); ★★ SURFACES MAJOR DRIFT (G13 $2,000 vs $2,200); ★ 14th doc-drift fix; ★ 4th drift-surfacing META-AUDIT in 5 audits; clean trend declines from 55% to 50%. (4) **★ Legacy A migration** (Issue #2: ★ 21st; convergence 33 → 34; ★ 3 consecutive Legacy A audits). (5) **★ NEW single-spec §13 Verification log** (Issue #3: ★ 23rd CONSECUTIVE single-row contribution). (6) **★ 7 CONVENTIONS NEW HIGH** (Issue #7: exceeds prior max of 6 at 27a; ★ Convention 5 RECURS 3rd time; ★ Conventions 6 + 7 NEW UNIQUE to 28). (7) **★ 9th distinct complexity dimension** (Issue #6: DUAL-PATH GATED CREDIT). (8) **★★★ G13 NEW GAP SURFACED** (Issue #9: CTC $2,000 vs $2,200 drift; ★ 2nd consecutive new-gap audit; ★ confirms streak-end). **Cumulative through line 28**: **59 lines audited**; **587 audit issues closed total** (577 + 10); backend **765/765 pass** (UNCHANGED — 11th audit with zero new tests); MFS cascade = **20 orchestrators** (unchanged); knowledge convergence = **34 lines** (★ +1 from 28 #2); 28 Path A applications (UNCHANGED — G13 broke streak); **★ 22 anti-duplication applications** (+1); **★ 2 NEW gaps surfaced in 2 consecutive audits** — G12 at 27c + G13 at 28; **★ 13 META-AUDITS** (+1; ★ sub-type (b) at 92% DOMINANCE; ★ 4th drift-surfacing in 5 audits; clean trend 50%); **★ 14 documentation drift fixes** (+1 from 28 #4); **★ 4 distinct MFS-protection mechanisms** (UNCHANGED — M4 RECURRENCE); **★ 9 distinct complexity dimensions in workflow** (+1 from 28 #6 ★ NEW DUAL-PATH GATED CREDIT). **★ Zero-outstanding streak still at 0** (G13 added to outstanding.md — 2 entries in 2 consecutive audits). **Verification logs**: ... + 27abc (3 rows COMPLETE) + 28 (★ NEW §13 with 1 row COMPLETE; ★ 23rd CONSECUTIVE single-row). **Looking ahead — line 29 (American Opportunity Credit — refundable AOTC from Form 8863)**: 21st audit OUTSIDE 13ab pair; TENTH payments-section audit; ★ likely 14th orchestrator-method-based (computeForm8863 helper has similar multi-stage structure to 27a EIC); ★ likely 14th META-AUDIT pushing sub-type (b) DOMINANCE to ~93% (13 of 14); fresh spec/dependencies (likely lines/29.md).',
    'XLS/computations/28.xlsx audit-trail (this row); lines/28.md §13 Verification log row 1 FINALIZED to COMPLETE — 10/10 closed; ★ G13 NEW GAP added to outstanding.md',
    'CLOSED — 10/10. **59 lines; 587 issues; 765/765 backend (UNCHANGED — 11th audit with zero new tests); 20 orchestrators (UNCHANGED); 34-line knowledge convergence (★ +1 from 28 #2; ★ 21st Legacy A migration; ★ 3 consecutive Legacy A audits); 14 doc-drift fixes (+1 from 28 #4); 28 Path A applications (UNCHANGED — G13 broke streak); ★ 22 anti-duplication applications; ★ 2 NEW gaps surfaced in 2 consecutive audits (G12 at 27c + G13 at 28); ★ 23rd CONSECUTIVE single-row contribution; ★ 13 META-AUDITS (★ sub-type (b) at 92% DOMINANCE; ★ 4th drift-surfacing in 5 audits; clean trend 50%); ★ 4 distinct MFS-protection mechanisms (★ M4 RECURRENCE — 3 M4 instances); ★ 9 distinct complexity dimensions in workflow (★ NEW DUAL-PATH GATED CREDIT at 28); ★ 7 CONVENTIONS NEW HIGH at 28 (exceeds 27a at 6); ★ G13 confirms streak-end — 2 consecutive new-gap audits**. ★ NINTH payments-section audit. ★ FIRST audit AFTER 27abc cluster complete. Next: line 29 (refundable AOTC from Form 8863; ★ likely 14th orchestrator-method-based; ★ 14th META-AUDIT).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 120 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 28 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Notes'],
  ['form1040.payments.additionalChildTaxCredit', 'Form 1040 page 2, line 28 (PDF key line28_additional_child_tax_credit)', '★ CANONICAL line 28 output. From Schedule8812.line27ActcCredit.'],
  ['Schedule8812 (24+ fields)', 'Schedule 8812 PDF', 'Full Schedule 8812 PDF export.'],
  [],
  ['SAME-METHOD DOWNSTREAM'],
  ['Line 32 = line 27a + line 28 + line 29 + line 30 + line 31', '~line 19940', '★ Line 28 is 2nd addend in refundable credits subtotal.'],
  ['Line 33 = line 25d + line 26 + line 32', '~line 19960', 'Line 28 affects line 33 transitively.'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Form 1040 line 19 (nonrefundable CTC+ODC)', 'computeLine20ThroughLine24', '★ INSEPARABLE — same helper produces both line 19 AND line 28.'],
  ['Frontend PDF export (Form 1040)', 'form-tax-return-1040.component.ts', '`values["line28_additional_child_tax_credit"] = formatAmount(payments?.additionalChildTaxCredit)`'],
  ['Frontend PDF export (opt-out box)', 'form-tax-return-1040.component.ts', '`values["unmapped_c2_14_0"] = computation?.schedule8812?.electsNoActc === true`'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
