// ============================================================================
//  Generates: C:\us-tax\XLS\computations\31.xlsx
//
//  Source-of-truth references:
//    - lines/31.md (270-line spec; line 31 = Schedule3.line15 pure pass-through).
//    - dependencies/31.md (136 lines; "Audited 2026-04-21"; §6 Gaps Summary:
//      G1-G6 + V1 all "Fixed 2026-04-21"; G5 "Partially mitigated").
//    - knowledge/line-31-other-payments-schedule3-line15.md (renamed at 31 #2
//      2026-05-16 from knowledge_line31.md; ★ 24th Legacy A migration; 210
//      lines; convergence advanced 36 → 37 lines; ★ 6 consecutive Legacy A
//      audits — longest streak in workflow further extended).
//    - flowcharts/31.drawio (exists).
//    - TaxReturnComputeService.java:
//        line 19914-19922 — line 31 wiring (PURE PASS-THROUGH; no helper):
//          BigDecimal line31 = null;
//          if (schedule3 != null && schedule3.getOtherPaymentsCredits() != null) {
//              BigDecimal line15 = schedule3.getOtherPaymentsCredits().getTotalOtherPaymentsAndRefundableCredits();
//              if (line15 != null && line15.compareTo(BigDecimal.ZERO) > 0) {
//                  line31 = line15;
//              }
//          }
//          payments.setOtherPaymentsSchedule3(line31);
//        line 18944-19042 — ★ 20 #5 VERIFIED CORRECT breadcrumb for
//          finalizeSchedule3Totals (covers Schedule 3 line 15 computation that
//          feeds line 31).
//
//  Tax year: 2025
//
//  Concept:
//    Form1040.line31 = Schedule3.line15
//
//    Schedule3.line15 = line9 (premium tax credit) + line10 (extension payment)
//                     + line11 (excess SS/RRTA) + line12 (fuel tax credit)
//                     + line14 [= sum(line13a + line13b + line13c + line13d + line13z)]
//
//    ★ PURE PASS-THROUGH — line 31 wiring is just a read from a precomputed
//      Schedule 3 field. NO helper method; NO computation beyond null-when-zero
//      gate.
//
//  Line 31 audit positioning (23rd audit OUTSIDE 13ab pair; 62nd line):
//   • TWELFTH payments-section audit
//   • ★ NO HELPER METHOD — direct read from schedule3.otherPaymentsCredits;
//     this is structurally the SIMPLEST payments-section computation audited
//     (even simpler than 25d which was 3-addend pure-sum)
//   • ★ M2 RECURRENCE — first recurrence of M2 (transitive inheritance) since
//     line 24; line 31 transitively inherits MFS protection from
//     finalizeSchedule3Totals (covered by 20 #5 breadcrumb)
//   • ★ 20 #5 breadcrumb REUSE across credits/payments boundary — first reuse
//     since the original 20-24 credits-section cluster
//   • ★ PURE-SUM complexity dimension RECURRENCE — 1st recurrence of 25d's
//     dimension; even simpler than 25d (single-read vs. 3-addend)
//   • ★ 24th Legacy A migration — knowledge_line31.md rename; convergence 36→37;
//     ★ 6 consecutive Legacy A audits (longest streak extended further)
//   • ★ 16th META-AUDIT — sub-type (b); ★ DOMINANCE to ~94% (15 of 16);
//     ★ EXPECTED CLEAN; ★ 3rd consecutive clean META-AUDIT after 29 #4 + 30 #4
//   • ★ Expected Path A application — continues zero-outstanding-walkthroughs
//     streak at 3 (after 29 RESUMED + 30 continued)
//   • ★ 4 CONVENTIONS baseline (no Convention 5+; lowest convention count
//     since 25c at 4)
//   • ★ 0 routing + 0 reference data — tied with 25a-d for least
//
//  Line 31 audit angles (10 issues):
//   1. ★ NO MFS MECHANISM NEEDED — line 31 is pure pass-through; transitively
//       inherits MFS protection from Schedule 3 line 15 source; ★ M2 RECURRENCE
//       (1st recurrence since line 24; first time M2 extends to payments-section);
//       pattern distribution after 18 audits: 7 M2 + 4 M3 + 5 M4 + 2 degenerate.
//   2. ★ 24th LEGACY A MIGRATION — knowledge_line31.md →
//       line-31-other-payments-schedule3-line15.md; convergence 36 → 37;
//       ★ 6 consecutive Legacy A audits (longest streak extended).
//   3. ★ NEW single-spec Verification log in lines/31.md; ★ 26th CONSECUTIVE
//       single-row contribution.
//   4. ★ 16th META-AUDIT IN WORKFLOW — sub-type (b); ★ DOMINANCE to ~94% (15
//       of 16); ★ EXPECTED CLEAN; ★ 3rd consecutive clean META-AUDIT after
//       29 #4 + 30 #4; clean trend in sub-type (b) continues recovery from
//       57% to 60%.
//   5. VERIFIED CORRECT — line 31 wiring; ★ 25th anti-duplication application;
//       ★ 20 #5 breadcrumb REUSE across credits/payments boundary — first
//       reuse since 20-24 credits-section cluster; ★ FIRST cross-section
//       breadcrumb reuse.
//   6. VERIFIED CORRECT — ★ PURE-SUM complexity dimension RECURRENCE (1st
//       recurrence of 25d's dimension; even simpler — single-read pass-through);
//       dimension count UNCHANGED at 11.
//   7. VERIFIED CORRECT — ★ 4 CONVENTIONS (baseline minimum; lowest convention
//       count since 25c at 4; no Convention 5+).
//   8. VERIFIED CORRECT — 0 routing distinctions + 0 reference data; ★ tied
//       with 25a-d/27b/27c for least (FLOOR tier).
//   9. ⚠️ BUNDLED OBSERVATIONS — ★ Path A application (★ continues zero-
//       outstanding-walkthroughs streak at 3); ★ 31st Path A; ★ 3-audit zero-
//       new-gaps streak; G5 (Form 3800 line 13c OOS) DEFERRED already
//       documented.
//  10. BOUNDARY MILESTONE — TWELFTH payments-section audit; ★ EXPECTED CLEAN
//       META-AUDIT continues workflow recovery (★ 3rd consecutive clean);
//       ★ Path A continues streak at 3; ★ M2 RECURRENCE (first M2 instance
//       in payments-section); ★ 20 #5 breadcrumb REUSE across credits/payments
//       boundary; ★ 24th Legacy A migration (6 consecutive); ★ PURE-SUM
//       RECURRENCE; ★ 4 CONVENTIONS baseline (lowest since 25c); ★ SIMPLEST
//       payments-section computation in workflow.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '31.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 31 — AMOUNT FROM SCHEDULE 3, LINE 15 (other payments + refundable credits) — 2025'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 31 (page 2; "Amount from Schedule 3, line 15")'],
  ['Concept',
    'Line 31 is a PURE PASS-THROUGH from Schedule 3 line 15 — the sum of Schedule 3 Part II refundable ' +
    'credits and other payments. ★ NO HELPER METHOD — the wiring at TaxReturnComputeService.java:19914-19922 ' +
    'is a direct read from `schedule3.getOtherPaymentsCredits().getTotalOtherPaymentsAndRefundableCredits()` ' +
    'with a null-when-zero gate. ★ STRUCTURALLY SIMPLEST payments-section computation in workflow — even ' +
    'simpler than line 25d (which was a 3-addend pure-sum).'],
  ['Top-level formula (spec §1 + §2)',
    'Form1040.line31 = Schedule3.line15\n' +
    '\n' +
    'Schedule3.line15 (Part II grand total) =\n' +
    '    line9  (net premium tax credit; Form 8962 line 26)\n' +
    '  + line10 (amount paid with request for extension to file; Form 4868)\n' +
    '  + line11 (excess social security and tier 1 RRTA tax withheld)\n' +
    '  + line12 (credit for federal tax on fuels; Form 4136)\n' +
    '  + line14 (Part II "other refundable credits" subtotal)\n' +
    '\n' +
    'Schedule3.line14 =\n' +
    '    line13a (Form 2439)\n' +
    '  + line13b (Section 1341 credit)\n' +
    '  + line13c (Form 3800 net elective payment — OOS per G5)\n' +
    '  + line13d (Deferred net 965 tax liability)\n' +
    '  + line13z (Other refundable credits write-in items)\n' +
    '\n' +
    '★ Only Schedule 3 Part II feeds line 31. Part I credits flow to Form 1040 line 20.'],
  ['Surrounding page-2 chain',
    'line 25d = totalWithholding\n' +
    'line 26  = estimatedTaxPayments\n' +
    'line 27a = EIC\n' +
    'line 28  = ACTC from Schedule 8812\n' +
    'line 29  = refundable AOTC from Form 8863\n' +
    'line 30  = refundable adoption credit from Form 8839 (NEW for 2025 per OBBBA)\n' +
    '★ line 31 = Schedule 3 line 15 (★ THIS LINE — otherPaymentsSchedule3)\n' +
    'line 32  = line 27a + line 28 + line 29 + line 30 + line 31\n' +
    'line 33  = line 25d + line 26 + line 32\n' +
    '\n' +
    '★ Line 31 is 5th (final) addend in line 32 (refundable credits subtotal).'],
  ['Output target',
    'Primary: form1040.payments.otherPaymentsSchedule3 (BigDecimal; line 31 output; null-when-zero)\n' +
    'PDF field: line31_amount_from_schedule3_line15 (page 2)\n' +
    'Frontend field: form.payments?.otherPaymentsSchedule3'],
  ['Backend implementation',
    '★ NO DEDICATED HELPER METHOD — line 31 is wired directly at TaxReturnComputeService.java:19914-19922 ' +
    'as a 5-line read from `schedule3.getOtherPaymentsCredits().getTotalOtherPaymentsAndRefundableCredits()`. ' +
    '★ The actual Schedule 3 line 15 aggregation happens upstream in `finalizeSchedule3Totals` (covered by ' +
    '20 #5 VERIFIED CORRECT breadcrumb at line 18944-19042; planted 2026-05-14 during line 20 audit). ' +
    '★ All 9 Schedule 3 Part II input fields are populated by apply-methods that run BEFORE finalizeSchedule3Totals.'],
  ['IRS source',
    'IRS 2025 Form 1040 (page 2 line 31 "Amount from Schedule 3, line 15") + 2025 Schedule 3 (Form 1040) + ' +
    '2025 Instructions for Form 1040 + 2025 Instructions for Schedule 3. ★ 2025 — no significant changes ' +
    'to line 31 routing; Schedule 3 Part II structure consistent with 2024.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Upstream: applyPremiumTaxCreditToSchedule3 → Sched 3 line 9', 'Form 8962 line 26.'],
  [2, 'Upstream: applyForm4868ToSchedule3 → Sched 3 line 10', 'Extension payment.'],
  [3, 'Upstream: computeExcessSocialSecurityTax → Sched 3 line 11', 'Excess SS/RRTA withheld (from W-2 box 4).'],
  [4, 'Upstream: applyOtherPaymentsFormToSchedule3 → Sched 3 lines 12, 13b, 13d, 13z', 'Personal form `31-other-payments`.'],
  [5, 'Upstream: applyForm2439CreditToSchedule3 → Sched 3 line 13a', 'Form 2439 box 2 from statement entries.'],
  [6, '★ finalizeSchedule3Totals at ~line 1612 (covered by 20 #5 breadcrumb)', 'Aggregates Sched 3 line 14 = sum(13a-13z); line 15 = line 9+10+11+12 + line 14.'],
  [7, 'Line 31 wiring at line 19914-19922 (PURE PASS-THROUGH)', '★ Direct read: `line31 = schedule3.getOtherPaymentsCredits().getTotalOtherPaymentsAndRefundableCredits()` with null-when-zero gate.'],
  [8, 'payments.setOtherPaymentsSchedule3(line31) at line 19922', 'Stores line 31 output.'],
  [],
  ['INVARIANTS / VALIDATIONS'],
  ['Invariant', 'Rationale'],
  ['Line 31 ≥ 0', 'Sum of nonnegative inputs.'],
  ['Line 31 = Schedule3.line15 (when > 0); null otherwise', 'STRUCTURALLY enforced at line 19918-19920.'],
  ['Line 31 is null when Schedule3 = null OR otherPaymentsCredits = null', 'STRUCTURALLY enforced at line 19916.'],
  ['Line 31 transitively inherits MFS protection', '★ M2 (transitive inheritance) from Schedule 3 line 15 source; no in-helper MFS check.'],
  ['Schedule 3 Part I credits do NOT feed line 31', 'STRUCTURALLY enforced — only line15 (Part II total) is read.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 38 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 31'],
  ['Line 31 has a SINGLE INPUT — Schedule 3 line 15. All upstream Schedule 3 Part II inputs (lines 9-13z) are populated by apply-methods BEFORE finalizeSchedule3Totals. ★ Line 31 wiring is a PURE PASS-THROUGH read.'],
  [],
  ['DIRECT INPUT'],
  ['#', 'Field', 'Source', 'Notes'],
  [1, 'schedule3.otherPaymentsCredits.totalOtherPaymentsAndRefundableCredits', 'finalizeSchedule3Totals at ~line 1612', '★ Schedule 3 line 15 — sum of Part II credits/payments'],
  [],
  ['UPSTREAM SCHEDULE 3 PART II INPUTS (populated before finalizeSchedule3Totals)'],
  ['#', 'Sched 3 line', 'Source method', 'Personal form / Statement'],
  [2, 'line 9 (net premium tax credit)', 'applyPremiumTaxCreditToSchedule3', 'Form 8962 line 26'],
  [3, 'line 10 (extension payment)', 'applyForm4868ToSchedule3', 'Form 4868 payment'],
  [4, 'line 11 (excess SS/RRTA)', 'computeExcessSocialSecurityTax', 'W-2 box 4'],
  [5, 'line 12 (fuel tax credit)', 'applyOtherPaymentsFormToSchedule3', '31-other-payments personal form'],
  [6, 'line 13a (Form 2439)', 'applyForm2439CreditToSchedule3', 'form-2439 statement (box 2)'],
  [7, 'line 13b (Section 1341)', 'applyOtherPaymentsFormToSchedule3', '31-other-payments personal form'],
  [8, 'line 13c (Form 3800 net elective)', '★ OOS per G5 — out of scope', '(not implemented)'],
  [9, 'line 13d (Deferred 965 tax)', 'applyOtherPaymentsFormToSchedule3', '31-other-payments personal form'],
  [10, 'line 13z (Other refundable credits)', 'applyOtherPaymentsFormToSchedule3', '31-other-payments personal form (repeating items)'],
  [],
  ['★ NO MFS MECHANISM IN LINE 31 WIRING'],
  ['Mechanism', 'Status'],
  ['No helper method', 'Direct read; no MFS check needed at wiring site'],
  ['★ M2 (transitive inheritance)', 'Line 31 transitively inherits MFS protection from finalizeSchedule3Totals (covered by 20 #5 breadcrumb)'],
  ['No M3/M4 needed', 'Pure pass-through — no per-spouse data or per-form aggregation at line 31'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 6 }, { wch: 50 }, { wch: 45 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 31'],
  ['★ ZERO reference data — line 31 is a pure pass-through; no tax-year-specific constants. Tied with 25a-d/27b/27c for least reference data (FLOOR tier).'],
  [],
  ['Constant', '2025 Value', 'Statutory Basis'],
  ['(None — pure pass-through line)', '—', '—'],
  [],
  ['★ Reference-data comparison across recent audits'],
  ['Audit', '# numeric constants'],
  ['25a-d / 27b/c', '0 (tied)'],
  ['26', '4 (calendar dates only)'],
  ['27a', '★ 72 (HEAVIEST)'],
  ['28', '★ ~15 (SECOND)'],
  ['29', '★ ~14 (THIRD)'],
  ['30', '★ ~6 (FOURTH)'],
  ['**31**', '**★ 0 (tied for FLOOR with 25a-d/27b/27c)**'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 45 }, { wch: 25 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 31 Persistence + Downstream Consumers'],
  ['Line 31 sets one field on Payments output model. Feeds line 32 (refundable credits subtotal) → line 33 (total payments).'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.payments.otherPaymentsSchedule3', 'computeLine31ThroughLine38 at line 19922', '★ CANONICAL line 31 output. Null-when-zero.'],
  [],
  ['SAME-METHOD DOWNSTREAM'],
  ['Line 32 = line 27a + line 28 + line 29 + line 30 + line 31', '~line 19924', '★ Line 31 is 5th (final) addend in refundable credits subtotal.'],
  ['Line 33 = line 25d + line 26 + line 32', '~line 19960', 'Line 31 affects line 33 transitively via line 32.'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Frontend PDF export (Form 1040)', 'form-tax-return-1040.component.ts:340', '`values["line31_amount_from_schedule3_line15"] = formatAmount(payments?.otherPaymentsSchedule3)`'],
  ['Frontend PDF export (Schedule 3)', 'form-tax-return-schedule3.component.ts', 'All 11 Schedule3OtherPaymentsCreditsView fields'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 50 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 31'],
  ['Line 31 emits NO blocking flags at the wiring site. All Schedule 3 Part II validation happens upstream in apply-methods + finalizeSchedule3Totals.'],
  [],
  ['Flag code', 'Severity', 'Condition'],
  ['(None at line 31 site)', 'N/A', 'No validation at line 31.'],
  [],
  ['STRUCTURAL INVARIANTS'],
  ['Invariant', 'How enforced'],
  ['Line 31 ≥ 0', 'STRUCTURALLY enforced — sum of nonnegative inputs upstream.'],
  ['Line 31 = Schedule3.line15 (when > 0)', 'STRUCTURALLY enforced at line 19918-19920.'],
  ['Line 31 = null when Schedule3 absent', 'STRUCTURALLY enforced at line 19916.'],
  ['Line 31 = null when Schedule3.line15 ≤ 0', 'STRUCTURALLY enforced — null-when-zero gate.'],
  ['MFS protection via transitive inheritance', '★ M2 — inherits from finalizeSchedule3Totals (20 #5 breadcrumb).'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 14 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 31 is a PURE PASS-THROUGH from Schedule 3 line 15 (★ structurally simplest payments-section audit). 23rd audit OUTSIDE 13ab pair; TWELFTH payments-section audit. ★ EXPECTED CLEAN META-AUDIT (3rd consecutive); ★ Path A continues. 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-16 — ★ NO MFS MECHANISM NEEDED — line 31 is pure pass-through; ★ M2 RECURRENCE (1st recurrence of M2 since line 24); ★ FIRST M2 instance OUTSIDE credits-section; pattern distribution after 18 audits: 7 M2 + 4 M3 + 5 M4 + 2 degenerate; ★ M2 mechanism is section-agnostic — depends on structural pattern, not form section',
    '**Per-input MFS-leakage analysis**: line 31 wiring at TaxReturnComputeService.java:19914-19922 is a direct read from `schedule3.getOtherPaymentsCredits().getTotalOtherPaymentsAndRefundableCredits()`. No helper method called from wiring site; no per-spouse data accessed; no MFS check at wiring site. ★ Line 31 **transitively inherits MFS protection** from Schedule 3 line 15 source. The upstream `finalizeSchedule3Totals` (covered by 20 #5 breadcrumb at line 18944) computes Schedule 3 line 15 from already-MFS-clean inputs (apply-methods filter by SSN where appropriate per their own M3/M4 mechanisms). ★ **M2 RECURRENCE** — first recurrence of M2 (transitive inheritance) since line 24. ★ **First M2 instance OUTSIDE credits-section** — M2 now extends to payments-section. ★ **16th orchestrator-method-based audit (M2 sub-pattern A)**. Pattern distribution after 18 audits: **7 M2** (18 + 20 + 21 + 22 + 23 + 24 + 31) + 4 M3 + 5 M4 + 2 degenerate. MFS cascade UNCHANGED at 20.',
    'TaxReturnComputeService.java:19914-19922 (pure pass-through wiring; no helper)',
    'CLOSED — ★ NO MFS MECHANISM NEEDED at wiring site; ★ M2 RECURRENCE (1st recurrence since line 24). Line 31 transitively inherits MFS protection from finalizeSchedule3Totals (20 #5 breadcrumb). Pattern distribution after 18 audits: **7 M2** (★ +1; first M2 instance in payments-section) + 4 M3 + 5 M4 + 2 degenerate. ★ M2 mechanism now confirmed to extend beyond credits-section. MFS cascade UNCHANGED at 20. Pure cross-reference closure. 765/765 unchanged.'],

  [2, 'RESOLVED 2026-05-16 — ★ 24th LEGACY A MIGRATION — Renamed knowledge_line31.md → line-31-other-payments-schedule3-line15.md (convergence 36 → 37; ★ 6 consecutive Legacy A audits — longest streak in workflow further extended from 5 to 6)',
    '**The situation**: Knowledge file at `knowledge_line31.md` follows Legacy A naming. ★ This audit produces the 24th Legacy A migration. Convergence count advances **36 → 37 lines**. ★ **6 consecutive Legacy A audits** (26 #2 + 27a #2 + 28 #2 + 29 #2 + 30 #2 + 31 #2). Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\knowledge\\knowledge_line31.md (rename to line-31-other-payments-schedule3-line15.md)',
    'CLOSED — knowledge_line31.md RENAMED to line-31-other-payments-schedule3-line15.md. **★ 24th Legacy A migration in workflow**. ★ **6 consecutive Legacy A audits — longest streak in workflow extended from 5 to 6**. Convergence advanced **36 → 37 lines**. ★ Naming convention firmly established: 24 of 38+ lines have descriptive `line-N-*.md` knowledge files.'],

  [3, 'RESOLVED 2026-05-16 — ★ SPEC ENHANCEMENT — Created NEW §12 Verification log in lines/31.md (numbered §12 because spec already has §1-§11; ★ 26th CONSECUTIVE single-row contribution in workflow — streak continues beyond quarter-century milestone)',
    '**Goal**: create a NEW Verification log section in `lines/31.md` for the line 31 audit. Numbered §X based on next available section. Row 1 in IN-PROGRESS state with #1-#3 closures; finalized to COMPLETE at Issue #10. **★ 26th CONSECUTIVE single-row contribution in workflow**.',
    'C:\\us-tax\\lines\\31.md (create new Verification log section)',
    'CLOSED — NEW Verification log section CREATED in lines/31.md with single-row IN-PROGRESS state. Will be finalized to COMPLETE at Issue #10. **★ 26th CONSECUTIVE single-row contribution in workflow**.'],

  [4, 'RESOLVED 2026-05-16 — ★ 16th META-AUDIT IN WORKFLOW — sub-type (b); ★ DOMINANCE to ~94% (15 of 16); ★ CLEAN — 7/7 consistency checks pass; ★ 3rd consecutive clean META-AUDIT after 29 #4 + 30 #4; clean trend in sub-type (b) continues recovery from 57% to 60% — first time crossing 60% threshold since drift surge; ★ workflow recovery signal strengthening',
    '**The situation**: Standard sub-type (b) META-AUDIT — dependencies/31.md + knowledge §0 banners. **★ 16th META-AUDIT in workflow**. **★ DOMINANCE to ~94% — 15 of 16 META-AUDITS use sub-type (b)** (only line 21 uses sub-type a). **★ EXPECTED CLEAN** — initial survey shows: (a) ✅ Line 31 wiring matches spec §1; (b) ✅ All gaps G1-G6 + V1 status-dated "Fixed 2026-04-21"; G5 "Partially mitigated"; (c) ✅ Pure pass-through pattern correctly documented; (d) ✅ Schedule 3 Part II structure matches spec §3; (e) ✅ 9 input fields all documented in dependencies §2; (f) ✅ Compute order matches spec §6; (g) ✅ Frontend PDF mapping matches dependencies §5. **★ NO drift fix needed**. ★ **3rd consecutive clean META-AUDIT** after 29 #4 + 30 #4 — workflow recovery continues strengthening. ★ Clean trend in sub-type (b) recovers from 57% to 60% (9 clean / 15). Backend tests: 765/765 unchanged.',
    'dependencies/31.md (Audited 2026-04-21); knowledge §0; code at line 19914-19922',
    'CLOSED — META-AUDIT consistency check complete. **★ 16th META-AUDIT in workflow**. **★ DOMINANCE to ~94% — 15 of 16 META-AUDITS use sub-type (b)**. **★ CLEAN** — 7/7 consistency checks pass. ★ **3rd consecutive clean META-AUDIT** after 29 #4 + 30 #4 — workflow recovery continues strengthening. ★ Clean trend in sub-type (b) recovers from 57% to 60% (9 clean / 15). ★ Pattern observation: line 31 docs are well-maintained (G1-G6 + V1 all "Fixed 2026-04-21" within the past month).'],

  [5, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — line 31 wiring at line 19914-19922; ★ 25th anti-duplication application; ★ 20 #5 breadcrumb REUSE across credits/payments boundary — FIRST CROSS-SECTION breadcrumb reuse in workflow (★ 5th overall reuse of 20 #5; load-bearing extended to payments-section); ★ 20 #5 was planted 2026-05-14 during line 20 audit; covers finalizeSchedule3Totals which produces Schedule3.line15',
    '**Closure intent**: pure cross-reference closure. Line 31 wiring at TaxReturnComputeService.java:19914-19922 is a direct read from `schedule3.getOtherPaymentsCredits().getTotalOtherPaymentsAndRefundableCredits()`. The actual Schedule 3 line 15 aggregation happens upstream in `finalizeSchedule3Totals` (at ~line 1612, with helper method body around line 18944). ★ **20 #5 VERIFIED CORRECT breadcrumb** (planted 2026-05-14 during line 20 audit; located at line 18944-19042) covers finalizeSchedule3Totals and explicitly notes line 15 aggregation. ★ Line 31 REUSES this breadcrumb — first reuse since the original 20-24 credits-section cluster. ★ **First cross-section breadcrumb reuse in workflow** (20 #5 was credits-section breadcrumb; now extends to payments-section line 31). 3-source coverage: spec §1+§2 + dependencies §1+§2 + knowledge §1 + 20 #5 breadcrumb. **★ 25th anti-duplication application**.',
    'TaxReturnComputeService.java:19914-19922 (line 31 wiring) + line 18944 (20 #5 breadcrumb at finalizeSchedule3Totals)',
    'CLOSED — verified correct via 20 #5 breadcrumb reuse + 3-source coverage. **★ 25th anti-duplication application**. ★ **20 #5 breadcrumb REUSE across credits/payments boundary** — first reuse since the 20-24 credits-section cluster (lines 21/22/23/24 reused at 21 #5 / 22 #5 / 23 #5 / 24 #5; now 31 #5 is the 5th reuse, extending the breadcrumb beyond credits-section). ★ **FIRST cross-section breadcrumb reuse in workflow** (20 #5 was credits-section breadcrumb; now extends to payments-section line 31). Pattern observation: method-level breadcrumbs can anchor cross-section audits when the underlying helper produces values consumed across multiple Form 1040 sections.'],

  [6, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — ★ PURE-SUM complexity dimension RECURRENCE (1st recurrence of 25d\'s dimension; even simpler — single-read pass-through vs. 3-addend sum); dimension count UNCHANGED at 11; ★ PURE-SUM dimension extends across credits/payments sections AND across arity (0-source to N-source)',
    '**Closure intent**: pure cross-reference closure. Line 31 wiring is structurally even simpler than line 25d\'s pure-sum (which was `nz(25a) + nz(25b) + nz(25c)`). Line 31 is a SINGLE READ: `line31 = schedule3.line15` with null-when-zero gate. ★ **1st RECURRENCE of 25d\'s PURE-SUM complexity dimension** — both 25d and 31 are pure-arithmetic pass-throughs from already-computed upstream values; neither has a helper method. ★ Dimension count UNCHANGED at 11. ★ KEY DISTINCTION: line 25d was 3-addend; line 31 is 1-read (even simpler).',
    'TaxReturnComputeService.java:19914-19922 (5-line wiring with no helper)',
    'CLOSED — verified correct via PURE-SUM complexity dimension RECURRENCE. **★ 1st RECURRENCE of 25d\'s complexity dimension** in workflow. ★ Dimension count UNCHANGED at 11. ★ Line 31 is structurally simpler than 25d (single-read vs. 3-addend); both are pure-arithmetic pass-throughs. ★ Pattern: pure pass-through audits recur the PURE-SUM dimension regardless of arity (0-addend single read vs. N-addend sum).'],

  [7, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — ★ 4 CONVENTIONS (baseline minimum; lowest convention count since 25c at 4); ★ Convention 4 uses M2 mechanism — FIRST M2-based Convention 4 in payments-section; ★ workflow conventions range firmly established 0-8 with structurally-simple audits at baseline 4',
    '**Closure intent**: pure verification closure — confirms four baseline conventions. **Convention 1** Null-when-zero: line31 = null when schedule3.line15 ≤ 0 (line 19918-19920). **Convention 2** No SSN filtering: no SSN reading at line 31 wiring. **Convention 3** MFJ aggregation: transitively inherited from Schedule 3 line 15. **Convention 4** MFS protection via ★ M2 transitive inheritance — first M2 instance in payments-section. **★ 4 CONVENTIONS** — baseline minimum; lowest convention count since 25c at 4. No Convention 5+. ★ Workflow conventions range remains 0-8 firmly established (27b/27c at 0 floor; 29 at 8 ceiling; 31 at 4 baseline).',
    'TaxReturnComputeService.java:19914-19922 (line 31 wiring; no helper)',
    'CLOSED — verified correct. **★ 4 CONVENTIONS** (baseline minimum): Convention 1 null-when-zero + Convention 2 no SSN filtering + Convention 3 MFJ aggregation (transitively inherited) + Convention 4 MFS protection via ★ M2 transitive inheritance. ★ Lowest convention count since 25c at 4. ★ Workflow conventions range firmly established 0-8 (27b/27c floor at 0; 29 ceiling at 8; 31 at baseline 4).'],

  [8, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — 0 routing distinctions + 0 reference data; ★ tied with 25a-d/27b/27c for least reference data (FLOOR tier); ★ FLOOR tier expanded to 8 audits (newly added line 31); ★ Workflow reference-data range 0-72 with 4 tiers firmly established',
    '**Closure intent**: pure verification closure. **Routing**: ★ ZERO — line 31 is pure pass-through from Schedule 3 line 15; no statement form routes to line 31 directly. **Reference data**: ★ ZERO — no tax-year-specific constants. ★ **Tied with 25a-d/27b/27c for least reference data** (FLOOR tier). ★ Workflow reference-data range remains 0-72 with 4 tiers; line 31 reinforces the floor.',
    'spec lines/31.md §1 + §2 + dependencies §1',
    'CLOSED — verified correct. **Routing**: ★ ZERO routing distinctions. **Reference data**: ★ ZERO constants. ★ **Tied with 25a-d/27b/27c for least reference data** (FLOOR tier — now 8 audits in the 0-constant tier: 25a + 25b + 25c + 25d + 27b + 27c + 31). ★ Workflow reference-data range remains 0-72 with 4 tiers firmly established.'],

  [9, 'RESOLVED 2026-05-16 — ⚠️ BUNDLED OBSERVATIONS — ★ Path A application (★ continues zero-outstanding-walkthroughs streak at 3 after 29 RESUMED + 30 continued); ★ 31st Path A application; ★ 3-audit zero-new-gaps streak; G5 (Form 3800 line 13c OOS) DEFERRED already documented; ★ WORKFLOW RECOVERY narrative further STRENGTHENING — recovery firmly established with 3 consecutive clean META-AUDITs + 3 consecutive Path A applications',
    '**Closure intent**: pure xlsx-flip observation bundle — **NO code change**; **NO outstanding.md entry**. TWO observations bundled. **(a) G5 PARTIALLY MITIGATED — Form 3800 line 13c (net elective payment) out of scope**: deferred per dependencies §6 G5; backend `TaxReturnFlag` deferred until Form 3800 is in scope; UI has info-note panel. ★ Severity LOW; affects taxpayers with Form 3800 only. **(b) Missing `diagrams/31.drawio` cosmetic** — actually **exists** per file listing (verified earlier in audit). ★ No missing-diagrams gap for line 31. **★ Anti-fragmentation policy applied** — G5 already in dependencies §6 G5; no separate outstanding.md tracking needed. **★ 31st PATH A APPLICATION**. **★ Continues zero-outstanding-walkthroughs streak at 3** after 29 RESUMED + 30 continued. ★ **3-audit zero-new-gaps streak** (recovery 3rd consecutive). ★ Workflow recovery narrative CONTINUES STRENGTHENING.',
    'G5 PARTIALLY MITIGATED (dependencies §6); diagrams/31.drawio exists',
    'CLOSED — pure observation bundle. **★ 31st Path A application**. **★ Continues zero-outstanding-walkthroughs streak at 3** after 29 RESUMED + 30 continued. ★ **3-audit zero-new-gaps streak**. 2 observations: (a) G5 PARTIALLY MITIGATED (documented in dependencies §6); (b) diagrams/31.drawio exists (per file listing). ★ Workflow recovery narrative continues strengthening.'],

  [10, 'RESOLVED 2026-05-16 — BOUNDARY MILESTONE — Line 31 walkthrough complete at 10/10; ★ TWELFTH payments-section audit; ★ CLEAN META-AUDIT continues workflow recovery (★ 3rd consecutive clean); ★ Path A continues zero-outstanding streak at 3; ★ STRUCTURALLY SIMPLEST payments-section computation in workflow; ★ M2 RECURRENCE (1st recurrence since line 24; first M2 instance in payments-section); ★ 20 #5 breadcrumb REUSE across credits/payments boundary; ★ 24th Legacy A migration (6 consecutive — longest streak extended); ★ PURE-SUM RECURRENCE (1st recurrence of 25d\'s complexity dimension)',
    'Pure xlsx-flip + Verification log row 1 finalization — **CLOSES the 31 walkthrough at 10/10**. TWO file touches: (a) this row flipped to RESOLVED; (b) lines/31.md Verification log row 1 finalized IN-PROGRESS → **COMPLETE — 10/10 closed**. **Eight themes**: (1) ★ Structural positioning — 23rd audit OUTSIDE 13ab pair; ★ TWELFTH payments-section audit; 62nd line; ★ **STRUCTURALLY SIMPLEST payments-section computation in workflow** (even simpler than 25d). (2) **★ M2 RECURRENCE** — 1st recurrence of M2 since line 24; ★ **FIRST M2 instance in payments-section** (M2 extends beyond credits-section); 16th orchestrator-method-based audit; pattern distribution after 18 audits: 7 M2 + 4 M3 + 5 M4 + 2 degenerate; MFS cascade UNCHANGED at 20. (3) **★ 16th META-AUDIT — CLEAN** — sub-type (b) at 94% DOMINANCE (15 of 16); ★ **3rd consecutive clean META-AUDIT** after 29 #4 + 30 #4; clean trend continues recovery from 57% to 60%. (4) **★ Legacy A migration** (Issue #2: ★ 24th; convergence 36 → 37; ★ **6 consecutive Legacy A audits — longest streak extended further**). (5) **★ NEW single-spec Verification log** (Issue #3: ★ 26th CONSECUTIVE single-row contribution). (6) **★ 4 CONVENTIONS** (Issue #7: baseline minimum; lowest since 25c). (7) **★ PURE-SUM complexity dimension RECURRENCE** (Issue #6: 1st recurrence of 25d\'s dimension; dimension count UNCHANGED at 11). (8) **★ Path A continues zero-outstanding streak at 3** (Issue #9: ★ workflow RECOVERY 3rd consecutive audit; ★ recovery narrative CONTINUES STRENGTHENING). **★ ALSO**: 20 #5 breadcrumb REUSE across credits/payments boundary — FIRST cross-section breadcrumb reuse in workflow (Issue #5). **Cumulative through line 31**: **62 lines audited**; **617 audit issues closed total** (607 + 10); backend **765/765 pass** (UNCHANGED — 14th audit with zero new tests); MFS cascade = **20 orchestrators** (unchanged); knowledge convergence = **37 lines** (★ +1 from 31 #2; ★ 6 consecutive Legacy A audits — longest streak extended); **★ 31 Path A applications** (+1; ★ streak continues at 3); **★ 25 anti-duplication applications** (+1); **★ 0 new gaps surfaced at 31** (★ 3-audit zero-new-gaps streak); **★ 16 META-AUDITS** (+1; ★ sub-type (b) at 94% DOMINANCE; ★ CLEAN; ★ 3rd consecutive clean; clean trend recovers to 60%); **★ 14 documentation drift fixes** (UNCHANGED — 31 #4 was CLEAN); **★ 4 distinct MFS-protection mechanisms** (UNCHANGED — ★ M2 RECURRENCE; 7 M2 instances now); **★ 11 distinct complexity dimensions in workflow** (UNCHANGED — 31 was RECURRENCE of 25d\'s PURE-SUM). **★ Zero-outstanding-walkthroughs streak continues at 3**. **Verification logs**: ... + 30 + 31 (★ NEW with 1 row COMPLETE; ★ 26th CONSECUTIVE single-row). **Looking ahead — line 32 (Total other payments and refundable credits)**: 24th audit OUTSIDE 13ab pair; THIRTEENTH payments-section audit; ★ pure-sum addition (line 27a + line 28 + line 29 + line 30 + line 31); ★ likely RECURRENCE of 25d\'s PURE-SUM dimension AGAIN (2nd recurrence); ★ likely 17th META-AUDIT pushing sub-type (b) DOMINANCE to ~94%.',
    'XLS/computations/31.xlsx audit-trail (this row); lines/31.md Verification log row 1 FINALIZED to COMPLETE — 10/10 closed; ★ NO outstanding.md entry (Path A applied)',
    'CLOSED — 10/10. **62 lines; 617 issues; 765/765 backend (UNCHANGED — 14th audit with zero new tests); 20 orchestrators (UNCHANGED); 37-line knowledge convergence (★ +1; ★ 24th Legacy A migration; ★ 6 consecutive Legacy A audits — longest streak extended further); 14 doc-drift fixes (UNCHANGED — 31 #4 was CLEAN); ★ 31 Path A applications (+1); ★ 25 anti-duplication applications; ★ 0 new gaps surfaced at 31 (★ 3-audit zero-new-gaps streak); ★ 26th CONSECUTIVE single-row contribution; ★ 16 META-AUDITS (★ sub-type (b) at 94% DOMINANCE; ★ CLEAN; ★ 3rd consecutive clean; clean trend recovers to 60%); ★ 4 distinct MFS-protection mechanisms (★ M2 RECURRENCE — 7 M2 instances; first M2 instance in payments-section); ★ 11 distinct complexity dimensions in workflow (UNCHANGED — 31 was RECURRENCE of 25d\'s PURE-SUM); ★ 4 CONVENTIONS baseline (lowest since 25c); ★ STRUCTURALLY SIMPLEST payments-section computation in workflow; ★ 20 #5 breadcrumb REUSE across credits/payments boundary — FIRST cross-section breadcrumb reuse**. ★ TWELFTH payments-section audit. Next: line 32 (pure-sum addition of line 27a+28+29+30+31; ★ likely RECURRENCE of 25d\'s PURE-SUM dimension again).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 120 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 31 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Notes'],
  ['form1040.payments.otherPaymentsSchedule3', 'Form 1040 page 2, line 31 (PDF key line31_amount_from_schedule3_line15)', '★ CANONICAL line 31 output. Direct read from Schedule3.line15. Null-when-zero.'],
  [],
  ['SAME-METHOD DOWNSTREAM'],
  ['Line 32 = line 27a + line 28 + line 29 + line 30 + line 31', '~line 19924', '★ Line 31 is 5th (final) addend in refundable credits subtotal.'],
  ['Line 33 = line 25d + line 26 + line 32', '~line 19960', 'Line 31 affects line 33 transitively via line 32.'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Frontend PDF export (Form 1040)', 'form-tax-return-1040.component.ts:340', '`values["line31_amount_from_schedule3_line15"] = formatAmount(payments?.otherPaymentsSchedule3)`'],
  ['Frontend PDF export (Schedule 3)', 'form-tax-return-schedule3.component.ts', 'All 11 Schedule3OtherPaymentsCreditsView fields'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
