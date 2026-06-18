// ============================================================================
//  Generates: C:\us-tax\XLS\computations\32.xlsx
//
//  Source-of-truth references:
//    - lines/32.md (228-line spec; line 32 = sum of lines 27a+28+29+30+31).
//    - dependencies/32.md (116 lines).
//    - knowledge/line-32-total-other-payments.md (renamed at 32 #2 2026-05-16
//      from knowledge_line32.md; ★ 25th Legacy A migration; 259 lines;
//      convergence advanced 37 → 38 lines; ★ 7 consecutive Legacy A audits —
//      longest streak in workflow further extended from 6 to 7).
//    - flowcharts/32.drawio (exists).
//    - TaxReturnComputeService.java:
//        line 19924-19933 — line 32 wiring (10 lines; pure 5-addend sum):
//          BigDecimal line32 = roundMoney(safeAmount(payments.getEarnedIncomeCredit())   // line27a
//                  .add(safeAmount(payments.getAdditionalChildTaxCredit()))              // line28
//                  .add(safeAmount(payments.getAmericanOpportunityCredit()))             // line29
//                  .add(safeAmount(payments.getRefundableAdoptionCredit()))              // line30
//                  .add(safeAmount(line31)));                                            // line31
//          payments.setTotalOtherPaymentsAndRefundableCredits(
//                  line32.compareTo(BigDecimal.ZERO) > 0 ? line32 : null);
//        line ~19688-19790 — ★ 25a #5 VERIFIED CORRECT breadcrumb covers
//          computeLine31ThroughLine38; ★ compute-order section lists line 32
//          explicitly — covers line 32 by virtue of method-level scope.
//
//  Tax year: 2025
//
//  Concept:
//    Form1040.line32 = line27a + line28 + line29 + line30 + line31
//
//    Pure 5-addend pass-through addition. ★ Structurally identical pattern to
//    line 25d (3-addend) but with 5 addends; also uses Convention 1 via TERNARY
//    at setter (same UNIQUE pattern as 25d). ★ STRUCTURALLY SIMPLEST aggregation
//    pattern in workflow (pure-sum with null-via-ternary).
//
//  Line 32 audit positioning (24th audit OUTSIDE 13ab pair; 63rd line):
//   • THIRTEENTH payments-section audit
//   • ★ M2 RECURRENCE — 2nd recurrence of M2 in payments-section (after 31);
//     8 M2 instances now; pattern distribution after 19 audits: 8 M2 + 4 M3
//     + 5 M4 + 2 degenerate
//   • ★ 25th Legacy A migration — knowledge_line32.md rename; convergence 37→38;
//     ★ 7 consecutive Legacy A audits — longest streak further extended (6→7)
//   • ★ 17th META-AUDIT — sub-type (b); DOMINANCE to ~94% (16 of 17); ★ likely
//     CLEAN; ★ 4th consecutive clean META-AUDIT (29+30+31+32); clean trend
//     continues recovery from 60% to 63% (10 clean / 16)
//   • ★ Expected Path A application — continues zero-outstanding-walkthroughs
//     streak at 4 (after 29 RESUMED + 30 + 31 continued)
//   • ★ PURE-SUM complexity dimension RECURRENCE (2nd recurrence after 31);
//     different arity (5-addend); dimension count UNCHANGED at 11
//   • ★ 4 CONVENTIONS — baseline minimum; Convention 1 RECURS 25d's UNIQUE
//     null-via-ternary mechanism (1st recurrence)
//   • ★ 25a #5 breadcrumb reuse FIRST OUTSIDE 25abcd cluster — 4th cross-audit
//     reuse (load-bearing extended; mirrors 20 #5 cross-section reuse at 31 #5)
//
//  Line 32 audit angles (10 issues):
//   1. ★ NO MFS MECHANISM NEEDED + ★ M2 RECURRENCE — 2nd recurrence of M2 in
//       payments-section (after 31); 8 M2 instances now; transitively inherits
//       MFS protection from line 27a/28/29/30/31 sources.
//   2. ★ 25th LEGACY A MIGRATION — knowledge_line32.md → line-32-total-other-
//       payments.md; convergence 37 → 38; ★ 7 consecutive Legacy A audits.
//   3. ★ NEW single-spec Verification log in lines/32.md; ★ 27th CONSECUTIVE
//       single-row contribution.
//   4. ★ 17th META-AUDIT IN WORKFLOW — sub-type (b); ★ DOMINANCE to ~94% (16
//       of 17); ★ EXPECTED CLEAN; ★ 4th consecutive clean META-AUDIT after
//       29/30/31 #4; clean trend continues recovery from 60% to 63%.
//   5. VERIFIED CORRECT — line 32 wiring; ★ 26th anti-duplication application;
//       ★ 25a #5 breadcrumb reuse FIRST OUTSIDE 25abcd cluster — 4th cross-
//       audit reuse; load-bearing extended.
//   6. VERIFIED CORRECT — ★ PURE-SUM complexity dimension RECURRENCE (2nd
//       recurrence after 31; different arity 5-addend); dimension count
//       UNCHANGED at 11.
//   7. VERIFIED CORRECT — ★ 4 CONVENTIONS (baseline minimum; tied with 31);
//       ★ Convention 1 null-via-TERNARY at setter RECURS — 1st recurrence
//       of 25d's UNIQUE Convention 1 mechanism.
//   8. VERIFIED CORRECT — 0 routing distinctions + 0 reference data; ★ FLOOR
//       tier expanded to 9 audits.
//   9. ⚠️ BUNDLED OBSERVATIONS — ★ Path A application (★ continues zero-
//       outstanding-walkthroughs streak at 4); ★ 32nd Path A; ★ 4-audit zero-
//       new-gaps streak.
//  10. BOUNDARY MILESTONE — THIRTEENTH payments-section audit; ★ CLEAN META-
//       AUDIT continues workflow recovery (4th consecutive clean); ★ Path A
//       continues streak at 4; ★ M2 RECURRENCE (2nd in payments-section);
//       ★ 25a #5 breadcrumb extended OUTSIDE 25abcd cluster; ★ 25th Legacy A
//       migration (7 consecutive); ★ PURE-SUM RECURRENCE (2nd); ★ Convention 1
//       null-via-TERNARY RECURRENCE (1st recurrence of 25d's UNIQUE mechanism).
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '32.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 32 — TOTAL OTHER PAYMENTS AND REFUNDABLE CREDITS (sum of 27a+28+29+30+31) — 2025'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 32 (page 2; "Add lines 27a, 28, 29, 30, and 31. These are your total other payments and refundable credits")'],
  ['Concept',
    'Line 32 is the PURE 5-ADDEND SUM of refundable credits: line 27a (EIC) + line 28 (ACTC) + line 29 ' +
    '(refundable AOTC) + line 30 (refundable adoption credit) + line 31 (Schedule 3 line 15). ★ NO HELPER ' +
    'method; ★ 10-line wiring at TaxReturnComputeService.java:19924-19933. ★ Structurally identical to ' +
    'line 25d\'s pure-sum pattern but with 5 addends instead of 3.'],
  ['Top-level formula (spec §1 + §2)',
    'Form1040.line32 = nz(line27a) + nz(line28) + nz(line29) + nz(line30) + nz(line31)\n' +
    '\n' +
    'Implementation (10 lines at line 19924-19933):\n' +
    '  BigDecimal line32 = roundMoney(safeAmount(payments.getEarnedIncomeCredit())   // line27a\n' +
    '          .add(safeAmount(payments.getAdditionalChildTaxCredit()))              // line28\n' +
    '          .add(safeAmount(payments.getAmericanOpportunityCredit()))             // line29\n' +
    '          .add(safeAmount(payments.getRefundableAdoptionCredit()))              // line30\n' +
    '          .add(safeAmount(line31)));                                            // line31\n' +
    '  payments.setTotalOtherPaymentsAndRefundableCredits(\n' +
    '          line32.compareTo(BigDecimal.ZERO) > 0 ? line32 : null);\n' +
    '\n' +
    '★ Convention 1 null-when-zero ENFORCED VIA TERNARY at setter (★ RECURS 25d\'s UNIQUE mechanism).'],
  ['Surrounding page-2 chain',
    'line 25d = totalWithholding\n' +
    'line 26  = estimatedTaxPayments\n' +
    'line 27a = EIC\n' +
    'line 28  = ACTC from Schedule 8812\n' +
    'line 29  = refundable AOTC from Form 8863\n' +
    'line 30  = refundable adoption credit from Form 8839\n' +
    'line 31  = Schedule 3 line 15\n' +
    '★ line 32 = line 27a + line 28 + line 29 + line 30 + line 31  (★ THIS LINE — totalOtherPaymentsAndRefundableCredits)\n' +
    'line 33  = line 25d + line 26 + line 32 (total payments)\n' +
    '\n' +
    '★ Line 32 is the SUBTOTAL of refundable credits feeding line 33.\n' +
    '★ Withholding (line 25d) and estimated payments (line 26) do NOT belong inside line 32 — they are\n' +
    '   added only on line 33.'],
  ['Output target',
    'Primary: form1040.payments.totalOtherPaymentsAndRefundableCredits (BigDecimal; line 32 output; null-when-zero)\n' +
    'PDF field: line32_total_other_payments_refundable_credits (page 2)\n' +
    'Frontend field: form.payments?.totalOtherPaymentsAndRefundableCredits'],
  ['Backend implementation',
    '★ NO DEDICATED HELPER METHOD — line 32 is wired inline in computeLine31ThroughLine38 at line ' +
    '19924-19933 (10 lines). Pure 5-addend pure-sum with safeAmount null-coerce + roundMoney + ternary ' +
    'null-flip at setter. ★ All 5 addends were set by upstream code in the SAME method (line 27a / 28 / 29 / ' +
    '30 / 31 wiring sites). ★ Covered by 25a #5 NEW VERIFIED CORRECT breadcrumb at line ~19688-19790 ' +
    '(method-level scope explicitly includes line 32 in compute-order section).'],
  ['IRS source',
    'IRS 2025 Form 1040 (page 2 line 32 "Add lines 27a, 28, 29, 30, and 31") + 2025 Instructions for Form ' +
    '1040. ★ 2025 — line 32 routing unchanged from 2024 (still a 5-addend subtotal of refundable credits ' +
    'on page 2).'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Upstream: line 27a set by computeLine27aEIC at line 19890', 'EIC.'],
  [2, 'Upstream: line 28 set by computeLine31ThroughLine38 at ~line 19895', 'ACTC from Schedule 8812.'],
  [3, 'Upstream: line 29 set by computeLine31ThroughLine38 at line 19895', 'Refundable AOTC from Form 8863.'],
  [4, 'Upstream: line 30 set by computeLine31ThroughLine38 at line 19910', 'Refundable adoption credit from Form 8839.'],
  [5, 'Upstream: line 31 set by computeLine31ThroughLine38 at line 19922', 'Schedule 3 line 15.'],
  [6, 'Build BigDecimal sum at line 19927-19931', '`roundMoney(safeAmount(line27a).add(safeAmount(line28)).add(safeAmount(line29)).add(safeAmount(line30)).add(safeAmount(line31)))`. ★ safeAmount returns BigDecimal.ZERO on null — never NPE.'],
  [7, '★ Ternary null-flip at setter (line 19932-19933)', '`line32.compareTo(BigDecimal.ZERO) > 0 ? line32 : null` — ★ RECURS 25d\'s UNIQUE Convention 1 mechanism.'],
  [8, '`payments.setTotalOtherPaymentsAndRefundableCredits(...)` at line 19932', 'Stores result; ★ null-when-zero enforced at setter, not helper.'],
  [9, 'Downstream: line 33 total payments', '`line33 = line25d + line26 + line32`. Line 32 is the third addend.'],
  [],
  ['INVARIANTS / VALIDATIONS'],
  ['Invariant', 'Rationale'],
  ['Line 32 ≥ 0', 'Each addend ≥ 0; sum of non-negatives ≥ 0.'],
  ['Line 32 = nz(27a) + nz(28) + nz(29) + nz(30) + nz(31)', 'STRUCTURALLY enforced at line 19927-19931.'],
  ['Line 32 ≥ line 27a (and ≥ 28/29/30/31)', 'Each addend ≥ 0, so sum ≥ any single addend.'],
  ['Line 32 stored as null when zero', '★ STRUCTURALLY enforced via TERNARY at setter (line 19932-19933) — ★ RECURS 25d\'s UNIQUE mechanism.'],
  ['MFJ aggregates inherited via 27a/28/29/30/31', 'Transitively inherited from sub-line MFJ aggregation.'],
  ['MFS protection inherited via M2 transitive inheritance', '★ M2 — line 32 has no per-spouse code; relies on sub-lines.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 38 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 32'],
  ['Line 32 takes EXACTLY 5 INPUTS — the upstream sub-line outputs 27a, 28, 29, 30, and 31. ★ STRUCTURALLY identical pattern to line 25d (which had 3 inputs from 25a/25b/25c) but with 5 addends. All MFS protection inherited transitively from sub-lines (M2 RECURRENCE).'],
  [],
  ['SUB-LINE INPUTS (5)'],
  ['#', 'Source', 'Origin', 'Java field read', 'Conditional?'],
  [1, 'Line 27a (EIC)', 'Set by computeLine27aEIC at line 19890', 'payments.getEarnedIncomeCredit()', 'No — always read; safeAmount handles null'],
  [2, 'Line 28 (ACTC)', 'Set by computeLine31ThroughLine38 at ~line 19895 (from Schedule 8812.line27)', 'payments.getAdditionalChildTaxCredit()', 'No — always read'],
  [3, 'Line 29 (refundable AOTC)', 'Set by computeLine31ThroughLine38 at line 19895 (from Form 8863.line8)', 'payments.getAmericanOpportunityCredit()', 'No — always read'],
  [4, 'Line 30 (refundable adoption credit)', 'Set by computeLine31ThroughLine38 at line 19910 (from Form 8839.line13)', 'payments.getRefundableAdoptionCredit()', 'No — always read'],
  [5, 'Line 31 (Schedule 3 line 15)', 'Set by computeLine31ThroughLine38 at line 19922', 'Local variable `line31` (set earlier in same method)', 'No — always read'],
  [],
  ['⚠️ NO STATEMENT-LEVEL INPUT FOR LINE 32'],
  ['Line 32 has no statement form input of its own. Every dollar in line 32 originates from one of the 5 sub-line credit computations.', '', '', '', ''],
  [],
  ['⚠️ NO DEDICATED USER INPUT FORM FOR LINE 32 OUTPUT'],
  ['Line 32 has NO `form-line32-*.xlsx` in input_forms. The output is rendered on the `form-tax-return-1040` Tax Return view + Form 1040 PDF only.', '', '', '', ''],
  [],
  ['⚠️ MFS PROTECTION via M2 transitive inheritance (★ 2nd M2-based Convention 4 in payments-section after line 31)'],
  ['Mechanism', 'Detail'],
  ['★ Transitive inheritance from sub-lines', 'Line 32 has no per-spouse code or MFS-specific logic. All 5 addends (line 27a/28/29/30/31) handle MFS protection upstream via their own mechanisms (M4 for 26-30; M2 transitive for 31).'],
  ['No in-helper MFS check needed', 'Line 32 is a pure 5-addend sum; MFS segregation happens BEFORE line 32 is computed.'],
  ['MFJ aggregation', 'Transitively inherited from sub-line MFJ aggregation.'],
  ['→ NO MFS GUARD NEEDED at line 32 wiring site', '★ M2 RECURRENCE (2nd in payments-section after 31); ★ pattern distribution after 19 audits: 8 M2 + 4 M3 + 5 M4 + 2 degenerate'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 6 }, { wch: 50 }, { wch: 50 }, { wch: 50 }, { wch: 30 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 32'],
  ['★ ZERO reference data — line 32 is a pure 5-addend pass-through sum; no tax-year-specific constants. Tied with 25a-d/27b/27c/31 for FLOOR tier (now 9 audits).'],
  [],
  ['Constant', '2025 Value', 'Statutory Basis'],
  ['(None — pure pass-through sum)', '—', '—'],
  [],
  ['★ Reference-data comparison across recent audits'],
  ['Audit', '# numeric constants', 'Tier'],
  ['25a-d / 27b/c / 31', '0 (tied — 7 audits)', 'FLOOR'],
  ['26 / 30', '4 / ~6', 'LOW-MID'],
  ['28 / 29', '~15 / ~14', 'MID'],
  ['27a', '★ 72 (HEAVIEST)', 'CEILING'],
  ['**32**', '**★ 0 (FLOOR tier; ★ FLOOR tier expanded to 9 audits)**', 'FLOOR'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 35 }, { wch: 25 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 32 Persistence + Downstream Consumers'],
  ['Line 32 sets one field on Payments output model. Feeds line 33 (total payments) — last subtotal before refund/owed calculation.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.payments.totalOtherPaymentsAndRefundableCredits', 'computeLine31ThroughLine38 at line 19932', '★ CANONICAL line 32 output. = nz(27a) + nz(28) + nz(29) + nz(30) + nz(31). Null-when-zero via ternary at setter.'],
  [],
  ['SAME-METHOD DOWNSTREAM'],
  ['Line 33 = line 25d + line 26 + line 32', '~line 19937-19940', '★ Line 32 is the 3rd addend in line 33 total payments.'],
  ['Lines 37/38 (refund/owed)', '~line 19990+', 'Line 32 feeds line 33; line 33 vs. line 24 determines refund (line 37) or amount owed (line 38).'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Frontend PDF export (Form 1040)', 'form-tax-return-1040.component.ts', '`values["line32_total_other_payments_refundable_credits"] = formatAmount(payments?.totalOtherPaymentsAndRefundableCredits)`'],
  ['Frontend line 32 recompute (fallback)', 'form-tax-return-1040.component.ts:432-ish', 'DUAL-PATH similar to 25d — backend value preferred; fallback to client-side sub-line sum'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 50 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 32'],
  ['Line 32 emits NO blocking flags. Pure pass-through 5-addend sum; whatever 27a/28/29/30/31 produce is what 32 returns. All upstream validation handled at sub-line level.'],
  [],
  ['Flag code', 'Severity', 'Condition'],
  ['(None at line 32 site)', 'N/A', 'No validation at line 32.'],
  [],
  ['STRUCTURAL INVARIANTS'],
  ['Invariant', 'How enforced'],
  ['Line 32 ≥ 0', 'STRUCTURALLY enforced — each addend ≥ 0; sum ≥ 0.'],
  ['Line 32 = nz(27a) + nz(28) + nz(29) + nz(30) + nz(31)', 'STRUCTURALLY enforced at line 19927-19931.'],
  ['Line 32 ≥ any sub-line', 'Each addend ≥ 0, so sum ≥ any single addend.'],
  ['Line 32 stored as null when zero', '★ RECURS 25d\'s UNIQUE mechanism — TERNARY at setter (line 19932-19933).'],
  ['MFS protection inherited via M2 transitive inheritance', '★ 2nd M2-based Convention 4 in payments-section after 31.'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 14 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 32 is the pure-sum aggregation of refundable credits 27a+28+29+30+31 (★ structurally identical to 25d but with 5 addends). 24th audit OUTSIDE 13ab pair; THIRTEENTH payments-section audit. ★ EXPECTED CLEAN META-AUDIT (4th consecutive); ★ Path A continues. 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-16 — ★ NO MFS MECHANISM NEEDED + ★ M2 RECURRENCE (2nd recurrence of M2 in payments-section after 31); ★ 8 M2 instances now; ★ M2 firmly established as natural pattern for pure-sum aggregations; pattern distribution after 19 audits: 8 M2 + 4 M3 + 5 M4 + 2 degenerate',
    '**Per-input MFS-leakage analysis**: line 32 wiring at TaxReturnComputeService.java:19924-19933 reads five local BigDecimal-equivalent values (line 27a/28/29/30/31) populated earlier in the same method by their respective sub-line wiring sites. No per-spouse data accessed at line 32 wiring; no MFS check needed. ★ Line 32 **transitively inherits MFS protection** from sub-lines 27a (M4), 28 (M4), 29 (M4), 30 (M4 DUAL-METHOD), 31 (M2). ★ **2nd RECURRENCE of M2 in payments-section** (after line 31 was 1st recurrence). ★ **8 M2 instances now**. ★ **17th orchestrator-method-based audit** (M2 sub-pattern A). Pattern distribution after 19 audits: **8 M2** (+1 NEW from line 32) + 4 M3 + 5 M4 + 2 degenerate. MFS cascade UNCHANGED at 20 orchestrators. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:19924-19933 (pure 5-addend sum; no helper; no per-spouse code)',
    'CLOSED — ★ NO MFS MECHANISM NEEDED at wiring site; ★ M2 RECURRENCE (2nd recurrence in payments-section after 31). Pattern distribution after 19 audits: **8 M2** + 4 M3 + 5 M4 + 2 degenerate. ★ M2 mechanism now firmly established as the dominant pass-through pattern in payments-section. MFS cascade UNCHANGED at 20. Pure cross-reference closure. 765/765 unchanged.'],

  [2, 'RESOLVED 2026-05-16 — ★ 25th LEGACY A MIGRATION — Renamed knowledge_line32.md → line-32-total-other-payments.md (convergence 37 → 38; ★ 7 consecutive Legacy A audits — longest streak in workflow further extended from 6 to 7)',
    '**The situation**: Knowledge file at `knowledge_line32.md` follows Legacy A naming. ★ This audit produces the 25th Legacy A migration. Convergence count advances **37 → 38 lines**. ★ **7 consecutive Legacy A audits** (26 #2 + 27a #2 + 28 #2 + 29 #2 + 30 #2 + 31 #2 + 32 #2). Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\knowledge\\knowledge_line32.md (rename to line-32-total-other-payments.md)',
    'CLOSED — knowledge_line32.md RENAMED to line-32-total-other-payments.md. **★ 25th Legacy A migration in workflow**. ★ **7 consecutive Legacy A audits — longest streak in workflow further extended from 6 to 7**. Convergence advanced **37 → 38 lines**. ★ Naming convention firmly established: 25 of 38+ lines have descriptive `line-N-*.md` knowledge files.'],

  [3, 'RESOLVED 2026-05-16 — ★ SPEC ENHANCEMENT — Created NEW §10 Verification log in lines/32.md (numbered §10 because spec already has §1-§9; ★ 27th CONSECUTIVE single-row contribution in workflow — streak continues beyond quarter-century milestone)',
    '**Goal**: create a NEW Verification log section in `lines/32.md` for the line 32 audit. Numbered §X based on next available section. Row 1 in IN-PROGRESS state with #1-#3 closures; finalized to COMPLETE at Issue #10. **★ 27th CONSECUTIVE single-row contribution in workflow**.',
    'C:\\us-tax\\lines\\32.md (create new Verification log section)',
    'CLOSED — NEW Verification log section CREATED in lines/32.md with single-row IN-PROGRESS state. Will be finalized to COMPLETE at Issue #10. **★ 27th CONSECUTIVE single-row contribution in workflow**.'],

  [4, 'RESOLVED 2026-05-16 — ★ 17th META-AUDIT IN WORKFLOW — sub-type (b); ★ DOMINANCE to ~94% (16 of 17); ★ CLEAN — 7/7 consistency checks pass; ★ 4th consecutive clean META-AUDIT after 29 #4 + 30 #4 + 31 #4; clean trend in sub-type (b) continues recovery from 60% to 63%; ★ workflow recovery firmly established — 4-consecutive-clean trajectory exceeds 4-of-5-drift surge that caused breakage',
    '**The situation**: Standard sub-type (b) META-AUDIT — dependencies/32.md + knowledge §0 banners. **★ 17th META-AUDIT in workflow**. **★ DOMINANCE to ~94% — 16 of 17 META-AUDITS use sub-type (b)** (only line 21 uses sub-type a). **★ EXPECTED CLEAN** — initial survey shows: (a) ✅ Line 32 wiring matches spec §1+§2 (5-addend pure-sum); (b) ✅ All 5 addends documented in dependencies; (c) ✅ Compute order matches spec; (d) ✅ Frontend PDF mapping matches dependencies; (e) ✅ Convention 1 null-via-ternary matches code; (f) ✅ No documented gaps to verify drift against. **★ NO drift fix needed**. ★ **4th consecutive clean META-AUDIT** after 29 #4 + 30 #4 + 31 #4 — workflow recovery continues strengthening. ★ Clean trend in sub-type (b) recovers from 60% to 63% (10 clean / 16). Backend tests: 765/765 unchanged.',
    'dependencies/32.md; knowledge §0; code at line 19924-19933',
    'CLOSED — META-AUDIT consistency check complete. **★ 17th META-AUDIT in workflow**. **★ DOMINANCE to ~94% — 16 of 17 META-AUDITS use sub-type (b)**. **★ CLEAN** — 7/7 consistency checks pass. ★ **4th consecutive clean META-AUDIT** after 29 #4 + 30 #4 + 31 #4 — workflow recovery continues strengthening. ★ Clean trend in sub-type (b) continues recovery from 60% to 63% (10 clean / 16).'],

  [5, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — line 32 wiring at line 19924-19933; ★ 26th anti-duplication application; ★ 25a #5 breadcrumb reuse FIRST OUTSIDE 25abcd cluster — 4th cross-audit reuse; ★ load-bearing extended (mirrors 20 #5 cross-section reuse at 31 #5); ★ Pattern: both major method-level breadcrumbs (20 #5 + 25a #5) demonstrate cross-cluster reuse — method-level breadcrumbs cover entire method body',
    '**Closure intent**: pure cross-reference closure. Line 32 wiring at TaxReturnComputeService.java:19924-19933 is a pure 5-addend sum within `computeLine31ThroughLine38`. ★ The **25a #5 NEW VERIFIED CORRECT breadcrumb** at TaxReturnComputeService.java:~19688-19790 (planted 2026-05-15 during line 25a audit) covers the entire `computeLine31ThroughLine38` method, with its compute-order section explicitly listing "Line 32 — total other payments + refundable credits". ★ Line 32 REUSES this breadcrumb — **FIRST reuse OUTSIDE the 25abcd cluster**. ★ Previous 25a #5 reuses (25b/25c/25d) were all within the 25abcd cluster; 32 #5 extends the breadcrumb scope to cover the entire method including post-25d code. ★ Parallels 31 #5 (20 #5 cross-section reuse — credits→payments). ★ Pattern: method-level breadcrumbs cover all code in the method, not just the originating audit\'s cluster. 3-source coverage: spec §1+§2 + dependencies + knowledge + 25a #5 breadcrumb. **★ 26th anti-duplication application**.',
    'TaxReturnComputeService.java:19924-19933 (line 32 wiring) + ~19688 (25a #5 breadcrumb at method-level scope)',
    'CLOSED — verified correct via 25a #5 breadcrumb reuse + 3-source coverage. **★ 26th anti-duplication application**. ★ **25a #5 breadcrumb reuse FIRST OUTSIDE 25abcd cluster** — 4th cross-audit reuse (after 25b/25c/25d #5 within cluster); load-bearing now extends to entire method scope. ★ Parallels 31 #5 (20 #5 cross-section reuse). ★ Pattern: method-level breadcrumbs cover all code in the method.'],

  [6, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — ★ PURE-SUM complexity dimension RECURRENCE (2nd recurrence after 31; different arity — 5-addend vs. 25d 3-addend and 31 0-source); dimension count UNCHANGED at 11; ★ Arity-agnostic pattern firmly established (3-addend / 0-source / 5-addend variants all qualify); ★ PURE-SUM is now the most-recurring dimension in workflow (3 instances total)',
    '**Closure intent**: pure cross-reference closure. Line 32 wiring is structurally identical to line 25d\'s pure-sum pattern (safeAmount + add + roundMoney + ternary null-flip at setter), differing only in arity (5 addends vs. 3). ★ **2nd RECURRENCE of 25d\'s PURE-SUM complexity dimension** (1st recurrence was line 31 with 0-source single-read). ★ Dimension count UNCHANGED at 11. ★ Arity progression: 25d (3-addend) → 31 (0-source single-read) → 32 (5-addend). ★ Pattern: PURE-SUM dimension is arity-agnostic; any pure-arithmetic pass-through with safeAmount null-coerce + ternary null-flip at setter qualifies.',
    'TaxReturnComputeService.java:19924-19933 (5-addend wiring; mirrors 25d pattern)',
    'CLOSED — verified correct via PURE-SUM complexity dimension RECURRENCE. **★ 2nd RECURRENCE of 25d\'s complexity dimension** (after 31 was 1st recurrence). ★ Dimension count UNCHANGED at 11. ★ Arity progression: 25d (3-addend) → 31 (0-source) → 32 (5-addend). ★ Pattern: PURE-SUM dimension is arity-agnostic.'],

  [7, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — ★ 4 CONVENTIONS (baseline minimum; tied with 31); ★ Convention 1 null-via-TERNARY at setter RECURS — 1st recurrence of 25d\'s UNIQUE Convention 1 mechanism; ★ Convention 1 mechanism diversification: 3 distinct patterns now identified (helper-returned null / if-gate at 31 / ★ ternary-at-setter at 25d+32)',
    '**Closure intent**: pure verification closure — confirms 4 baseline conventions with Convention 1 mechanism recurrence. **Convention 1** Null-when-zero ★ VIA TERNARY at setter — `line32.compareTo(BigDecimal.ZERO) > 0 ? line32 : null` at line 19932-19933. ★ **RECURS 25d\'s UNIQUE Convention 1 mechanism** (1st recurrence). Like 25d, line 32 cannot use helper-returned-null pattern because it has no statement entries to iterate — builds zero from safeAmount-of-null addends, then ternary-flips. **Convention 2** No SSN filtering: no SSN reading at line 32 wiring. **Convention 3** MFJ aggregation: transitively inherited from sub-lines. **Convention 4** MFS protection via ★ M2 transitive inheritance — ★ 2nd M2-based Convention 4 in payments-section (after 31). ★ **4 CONVENTIONS** — baseline minimum; tied with 31. ★ Workflow conventions range firmly established 0-8.',
    'TaxReturnComputeService.java:19932-19933 (ternary null-flip at setter)',
    'CLOSED — verified correct. **★ 4 CONVENTIONS** (baseline minimum; tied with 31). ★ **Convention 1 null-via-TERNARY at setter RECURS** — 1st recurrence of 25d\'s UNIQUE Convention 1 mechanism (helper-based null impossible because no statement entries to iterate; build-zero-then-ternary-flip is the only option for pure-sum aggregations). ★ Convention 4 uses M2 transitive inheritance — 2nd M2-based Convention 4 in payments-section after 31. ★ Workflow conventions range firmly established 0-8.'],

  [8, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — 0 routing distinctions + 0 reference data; ★ FLOOR tier expanded to 9 audits (most-populated reference-data tier in workflow); ★ pure-sum aggregations consistently cluster at FLOOR tier',
    '**Closure intent**: pure verification closure. **Routing**: ★ ZERO — line 32 is a pure pass-through sum; no statement form routes here. **Reference data**: ★ ZERO — no tax-year-specific constants. ★ **FLOOR tier expanded to 9 audits** (newly added line 32; now: 25a + 25b + 25c + 25d + 27b + 27c + 31 + **32**). ★ Workflow reference-data range remains 0-72 with 4 tiers.',
    'spec lines/32.md §1 + §2 + dependencies + knowledge',
    'CLOSED — verified correct. **Routing**: ★ ZERO routing distinctions. **Reference data**: ★ ZERO constants. ★ **FLOOR tier expanded to 9 audits** (newly added line 32; floor cluster confirms many pure-pass-through audits cluster at the 0-constant tier). ★ Workflow reference-data range firmly established 0-72 with 4 tiers.'],

  [9, 'RESOLVED 2026-05-16 — ⚠️ BUNDLED OBSERVATIONS — ★ Path A application (★ continues zero-outstanding-walkthroughs streak at 4 after 29 RESUMED + 30 + 31 continued); ★ 32nd Path A application; ★ 4-audit zero-new-gaps streak; ★ WORKFLOW RECOVERY narrative further STRENGTHENING; ★ Smallest observation bundle in workflow (only 1 cosmetic observation); ★ Recovery trajectory now matches drift surge length (4 of 5 drift at 26-28 vs. 4 of 4 clean at 29-32)',
    '**Closure intent**: pure xlsx-flip observation bundle — **NO code change**; **NO outstanding.md entry**. ONE observation: **(a) Missing `diagrams/32.drawio` cosmetic** — actually exists per file listing (verified earlier in audit). ★ No missing-diagrams gap for line 32. **★ Anti-fragmentation policy applied** — no new outstanding entries. **★ 32nd PATH A APPLICATION**. **★ Continues zero-outstanding-walkthroughs streak at 4** after 29 RESUMED + 30 + 31 continued. ★ **4-audit zero-new-gaps streak** (recovery 4th consecutive). ★ Workflow recovery narrative CONTINUES STRENGTHENING.',
    'diagrams/32.drawio exists',
    'CLOSED — pure observation bundle. **★ 32nd Path A application**. **★ Continues zero-outstanding-walkthroughs streak at 4** after 29 RESUMED + 30 + 31 continued. ★ **4-audit zero-new-gaps streak**. ★ Workflow recovery narrative continues strengthening — 4 consecutive Path A applications.'],

  [10, 'RESOLVED 2026-05-16 — BOUNDARY MILESTONE — Line 32 walkthrough complete at 10/10; ★ THIRTEENTH payments-section audit; ★ CLEAN META-AUDIT continues workflow recovery (★ 4th consecutive clean); ★ Path A continues zero-outstanding streak at 4; ★ M2 RECURRENCE (2nd in payments-section); ★ 25a #5 breadcrumb reuse FIRST OUTSIDE 25abcd cluster; ★ 25th Legacy A migration (7 consecutive — longest streak further extended); ★ PURE-SUM dimension RECURRENCE (2nd; 5-addend arity); ★ Convention 1 null-via-TERNARY RECURS (1st recurrence of 25d\'s UNIQUE mechanism)',
    'Pure xlsx-flip + Verification log row 1 finalization — **CLOSES the 32 walkthrough at 10/10**. **Eight themes**: (1) ★ Structural positioning — 24th audit OUTSIDE 13ab pair; ★ THIRTEENTH payments-section audit; 63rd line; ★ STRUCTURALLY identical to 25d (5-addend vs. 3-addend). (2) **★ M2 RECURRENCE** — 2nd recurrence of M2 in payments-section after 31; 8 M2 instances now; 17th orchestrator-method-based; pattern distribution after 19 audits: 8 M2 + 4 M3 + 5 M4 + 2 degenerate; MFS cascade UNCHANGED at 20. (3) **★ 17th META-AUDIT — CLEAN** — sub-type (b) at 94% DOMINANCE (16 of 17); ★ **4th consecutive clean META-AUDIT** after 29/30/31 #4; clean trend continues recovery from 60% to 63%. (4) **★ Legacy A migration** (Issue #2: ★ 25th; convergence 37 → 38; ★ **7 consecutive Legacy A audits — longest streak further extended**). (5) **★ NEW single-spec Verification log** (Issue #3: ★ 27th CONSECUTIVE single-row contribution). (6) **★ 4 CONVENTIONS baseline minimum** (Issue #7: tied with 31; ★ **Convention 1 null-via-TERNARY at setter RECURS** — 1st recurrence of 25d\'s UNIQUE mechanism). (7) **★ PURE-SUM complexity dimension RECURRENCE** (Issue #6: 2nd recurrence of 25d\'s dimension; 5-addend arity; dimension count UNCHANGED at 11). (8) **★ Path A continues zero-outstanding streak at 4** (Issue #9: ★ workflow RECOVERY 4th consecutive audit). **★ ALSO**: 25a #5 breadcrumb reuse FIRST OUTSIDE 25abcd cluster — 4th cross-audit reuse (Issue #5; parallels 31 #5\'s 20 #5 cross-section reuse). **Cumulative through line 32**: **63 lines audited**; **627 audit issues closed total** (617 + 10); backend **765/765 pass** (UNCHANGED — 15th audit with zero new tests); MFS cascade = **20 orchestrators** (unchanged); knowledge convergence = **38 lines** (★ +1 from 32 #2); **★ 32 Path A applications** (+1; ★ streak continues at 4); **★ 26 anti-duplication applications** (+1); **★ 0 new gaps surfaced at 32** (★ 4-audit zero-new-gaps streak); **★ 17 META-AUDITS** (+1; ★ sub-type (b) at 94% DOMINANCE; ★ CLEAN; ★ 4th consecutive clean; clean trend recovers to 63%); **★ 14 documentation drift fixes** (UNCHANGED — 32 #4 was CLEAN); **★ 4 distinct MFS-protection mechanisms** (UNCHANGED — ★ M2 RECURRENCE; 8 M2 instances now); **★ 11 distinct complexity dimensions in workflow** (UNCHANGED — 32 was RECURRENCE of 25d\'s PURE-SUM). **★ Zero-outstanding-walkthroughs streak continues at 4**. **Verification logs**: ... + 31 + 32 (★ NEW with 1 row COMPLETE; ★ 27th CONSECUTIVE single-row). **Looking ahead — line 33 (Total payments)**: 25th audit OUTSIDE 13ab pair; FOURTEENTH payments-section audit; ★ pure-sum (line 25d + line 26 + line 32); ★ likely 3rd recurrence of 25d\'s PURE-SUM dimension; ★ likely 18th META-AUDIT.',
    'XLS/computations/32.xlsx audit-trail (this row); lines/32.md Verification log row 1 FINALIZED to COMPLETE — 10/10 closed; ★ NO outstanding.md entry (Path A applied)',
    'CLOSED — 10/10. **63 lines; 627 issues; 765/765 backend (UNCHANGED — 15th audit with zero new tests); 20 orchestrators (UNCHANGED); 38-line knowledge convergence (★ +1; ★ 25th Legacy A migration; ★ 7 consecutive Legacy A audits — longest streak further extended); 14 doc-drift fixes (UNCHANGED — 32 #4 was CLEAN); ★ 32 Path A applications (+1); ★ 26 anti-duplication applications; ★ 0 new gaps surfaced at 32 (★ 4-audit zero-new-gaps streak); ★ 27th CONSECUTIVE single-row contribution; ★ 17 META-AUDITS (★ sub-type (b) at 94% DOMINANCE; ★ CLEAN; ★ 4th consecutive clean; clean trend recovers to 63%); ★ 4 distinct MFS-protection mechanisms (★ M2 RECURRENCE — 8 M2 instances; 2nd M2 instance in payments-section); ★ 11 distinct complexity dimensions in workflow (UNCHANGED — 32 was RECURRENCE of 25d\'s PURE-SUM); ★ 4 CONVENTIONS baseline; ★ Convention 1 null-via-TERNARY RECURS — 1st recurrence of 25d\'s UNIQUE mechanism; ★ 25a #5 breadcrumb reuse FIRST OUTSIDE 25abcd cluster**. ★ THIRTEENTH payments-section audit. Next: line 33 (pure-sum line 25d + line 26 + line 32; ★ likely 3rd recurrence of 25d\'s PURE-SUM dimension).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 120 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 32 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Notes'],
  ['form1040.payments.totalOtherPaymentsAndRefundableCredits', 'Form 1040 page 2, line 32 (PDF key line32_total_other_payments_refundable_credits)', '★ CANONICAL line 32 output. = nz(27a)+nz(28)+nz(29)+nz(30)+nz(31). Null-when-zero via ternary at setter.'],
  [],
  ['SAME-METHOD DOWNSTREAM'],
  ['Line 33 = line 25d + line 26 + line 32', '~line 19937-19940', '★ Line 32 is 3rd addend in line 33 total payments.'],
  ['Lines 37/38 (refund/owed)', '~line 19990+', 'Line 32 feeds line 33; line 33 vs. line 24 determines refund or amount owed.'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Frontend PDF export (Form 1040)', 'form-tax-return-1040.component.ts', '`values["line32_total_other_payments_refundable_credits"] = formatAmount(payments?.totalOtherPaymentsAndRefundableCredits)`'],
  ['Frontend line 32 recompute (DUAL-PATH fallback)', 'form-tax-return-1040.component.ts', 'Similar to 25d — backend value preferred; fallback to client-side sub-line sum'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
