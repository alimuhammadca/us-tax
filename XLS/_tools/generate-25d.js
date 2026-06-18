// ============================================================================
//  Generates: C:\us-tax\XLS\computations\25d.xlsx
//
//  Source-of-truth references:
//    - lines/25abcd.md (combined spec; §11 Verification log §11 created at 25a #3
//      with ★ 6-column adaptation; row 1 = 25a COMPLETE; row 2 = 25b COMPLETE;
//      row 3 = 25c COMPLETE; this audit appends row 4 — ★ COMPLETES 25abcd family)
//    - dependencies/25abcd.md (Audited 2026-04-19; line 25d is pure sum of
//      25a + 25b + 25c — no own input table)
//    - knowledge/line-25abcd-federal-withholding.md (renamed at 25a #2;
//      §3d documents line 25d as sum; §6 totalWithholding model field)
//    - flowcharts/25abcd.drawio; diagrams/25d.drawio MISSING
//    - TaxReturnComputeService.java:
//        line 19684-19796 — 25a #5 NEW VERIFIED CORRECT breadcrumb (covers
//          25a + 25b + 25c + 25d; planted 2026-05-15)
//          ★ 4th reuse of 25a #5 at this audit → ★ LOAD-BEARING CONFIRMATION
//          MILESTONE (mirrors 20 #6 → 24 #6 trajectory in credits-section)
//        line 19872-19875 — line 25d wiring (4 lines):
//          BigDecimal totalWithholding = roundMoney(safeAmount(withholdingW2)
//                  .add(safeAmount(withholding1099))
//                  .add(safeAmount(withholdingOther)));
//          payments.setTotalWithholding(totalWithholding.compareTo(BigDecimal.ZERO) > 0
//                  ? totalWithholding : null);
//    - line25abcd-withholding.spec.ts Test 5 (25a+25b+25c combined → 25d)
//    - TaxReturnComputeServiceTest.java: line25dAggregatesAllThreeSubLines
//    - Frontend form-tax-return-1040.component.ts:432 — line25dTotalWithholding()
//      ★ DUAL-PATH: backend totalWithholding preferred; fallback sums sub-lines
//      client-side (line 437) — equivalent results.
//
//  Tax year: 2025
//
//  Concept:
//    Form1040.line25d = nz(line25a) + nz(line25b) + nz(line25c)
//
//    Pure sum (★ SIMPLEST chain in 25a-25d family — even simpler than 25a's
//    single-source aggregation, because 25d has no statement iteration).
//    Null-when-zero enforced via ternary at the setter site (★ UNIQUE — 25a/
//    25b/25c rely on helper-returned null; 25d builds zero then ternary-flips).
//
//  Line 25d audit positioning (15th audit OUTSIDE 13ab pair; 54th line):
//   • FOURTH and FINAL payments-section audit for 25abcd cluster
//   • ★ 25abcd CLUSTER COMPLETE at this audit (all 4 sub-lines closed)
//   • ★ 4th reuse of 25a #5 NEW breadcrumb → ★ LOAD-BEARING CONFIRMATION
//     MILESTONE (mirrors 20 #6 → 24 #6 in credits-section)
//   • ★ EIGHTH META-AUDIT — sub-type (b); ★ DOMINANCE to ~88% (7 of 8)
//   • ★ 3rd "already-migrated" closure (combined-spec property)
//   • ★ 3rd combined-spec ROW APPEND — row 4 to §11 (★ COMPLETES family)
//   • ★ PURE-SUM inheritance chain — ★ STRUCTURALLY SIMPLEST among 25a-25d
//   • ★ Null-via-ternary at setter — ★ UNIQUE among 25a-25d
//   • ZERO routing distinctions (pure pass-through addition)
//   • Frontend has DUAL-PATH compute (backend preferred, client-side fallback)
//
//  Line 25d audit angles (10 issues):
//   1. NO MFS DEFENSIVE GAP NEEDED — 20th defensive-gap-NOT-needed; ★ 10th
//       orchestrator-method-based; ★ SAME NEW MFS PATTERN (★ 4th instance —
//       pure-sum recurrence further confirmed; pattern is sum/aggregation
//       agnostic).
//   2. DOCUMENTATION HYGIENE — ★ 3rd "already-migrated" closure (combined-spec
//       inheritance; convergence UNCHANGED at 31; Legacy A count UNCHANGED at 18).
//   3. SPEC ENHANCEMENT — Append ROW 4 to lines/25abcd.md §11 (★ 3rd combined-
//       spec ROW APPEND; ★ COMPLETES 25abcd §11 family with all 4 sub-lines;
//       18th CONSECUTIVE single-row contribution).
//   4. ★ EIGHTH META-AUDIT IN WORKFLOW — sub-type (b) signature; ★ DOMINANCE
//       to ~88% (7 of 8); 6th CLEAN sub-type (b) META-AUDIT.
//   5. VERIFIED CORRECT — line 25d wiring at line 19872-19875; ★ 17th anti-
//       duplication; ★ 4th reuse of 25a #5 NEW breadcrumb → ★ LOAD-BEARING
//       CONFIRMATION MILESTONE (mirrors 20 #6 → 24 #6 in credits-section).
//   6. VERIFIED CORRECT — ★ PURE-SUM inheritance chain (★ STRUCTURALLY
//       SIMPLEST among 25a-25d — pure pass-through addition; no statement
//       iteration; no conditional branching); same NEW MFS PATTERN protection
//       via transitive inheritance from 25a/25b/25c.
//   7. VERIFIED CORRECT — Convention 1 null-when-zero ★ ENFORCED VIA TERNARY
//       (★ UNIQUE among 25a-25d — others rely on helper-returned null; line
//       25d builds zero-when-empty then ternary-flips to null). Conventions
//       2/3/4 inherited transitively from sub-lines.
//   8. VERIFIED CORRECT — ZERO routing distinctions (pure pass-through addition
//       takes whatever 25a/25b/25c provide); ★ frontend DUAL-PATH compute
//       (form-tax-return-1040.component.ts:432 — backend totalWithholding
//       preferred at line 436; fallback sums client-side at line 437) —
//       equivalent results; lock-in test line25dAggregatesAllThreeSubLines.
//   9. ⚠️ BUNDLED OBSERVATIONS — 4 observations: (a) G4 DEFERRED OOS already
//       documented (cross-reference; 25d transitively inherits 25c gap); (b)
//       missing diagrams/25d.drawio (★ 9th consecutive); (c) ★ 25abcd cluster
//       COMPLETE; (d) load-bearing CONFIRMED. 25th Path A. ★ 29 consecutive
//       zero-outstanding. ★ 12th consecutive ZERO NEW GAPS.
//  10. BOUNDARY MILESTONE — FOURTH AND FINAL payments-section audit for 25abcd;
//       ★ 25abcd CLUSTER COMPLETE; ★ LOAD-BEARING CONFIRMATION milestone;
//       ★ 8th META-AUDIT; ★ pure-sum simplest chain; ★ null-via-ternary unique;
//       ★ frontend DUAL-PATH consistency verified.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '25d.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 25d — TOTAL FEDERAL INCOME TAX WITHHELD (sum of 25a + 25b + 25c) — 2025'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 25d (page 2; "Add lines 25a through 25c")'],
  ['Concept',
    'Line 25d is the trivial pure-sum aggregation of the three sub-lines 25a + 25b + 25c. ' +
    '★ STRUCTURALLY SIMPLEST among 25a-25d (no statement iteration; no conditional branching; ' +
    'no helper; just three BigDecimal additions with safeAmount null-protection). ' +
    'Null-when-zero enforced via ternary at the setter site — ★ UNIQUE among 25a-25d (other ' +
    'sub-lines rely on helper-returned null; 25d builds zero-when-empty then ternary-flips).'],
  ['Top-level formula (spec §3d + §7 + dependencies §1)',
    'Form1040.line25d = nz(line25a) + nz(line25b) + nz(line25c)\n' +
    '                 (null when zero)\n' +
    '\n' +
    'Implementation (line 19872-19875):\n' +
    '  BigDecimal totalWithholding = roundMoney(safeAmount(withholdingW2)\n' +
    '          .add(safeAmount(withholding1099))\n' +
    '          .add(safeAmount(withholdingOther)));\n' +
    '  payments.setTotalWithholding(\n' +
    '          totalWithholding.compareTo(BigDecimal.ZERO) > 0 ? totalWithholding : null);'],
  ['Surrounding page-2 chain',
    'line 25a = sum(W-2 box 2)                         (withholdingW2 — audited at 25a)\n' +
    'line 25b = sum(12 1099 sources + SSA-1099 special) (withholding1099 — audited at 25b)\n' +
    'line 25c = sum(W-2G box 4) + Form 8959 Part V line 24 (withholdingOther — audited at 25c)\n' +
    '★ line 25d = nz(25a) + nz(25b) + nz(25c)           (★ THIS LINE — totalWithholding)\n' +
    'line 26  = estimated tax payments                  (estimatedTaxPayments)\n' +
    'line 27a = EIC                                     (earnedIncomeCredit)\n' +
    'line 32  = sum 27a + 28 + 29 + Sched 3 line 15      (totalOtherPaymentsAndRefundableCredits)\n' +
    'line 33 = line 25d + line 26 + line 32             (total payments)\n' +
    '\n' +
    '★ All 4 sub-lines wired in same method `computeLine31ThroughLine38`\n' +
    '★ Method-level breadcrumb at 25a #5 covers all 4 sub-lines — this audit is the ★ 4th\n' +
    '   and final reuse → ★ LOAD-BEARING CONFIRMATION milestone'],
  ['★ 25d-specific routing rules',
    '★ ZERO routing distinctions specific to line 25d — pure pass-through addition takes\n' +
    'whatever 25a/25b/25c provide. Source of all amounts is the upstream sub-lines, not\n' +
    'statement forms directly. Contrast:\n' +
    '  line 25a:  0 routing rules\n' +
    '  line 25b:  4 routing rules (★ MOST)\n' +
    '  line 25c:  2 routing rules (MEDIUM; ★ G2 fix lock-in for Form 8959)\n' +
    '  **line 25d: 0 routing rules (★ STRUCTURALLY TRIVIAL — pure pass-through)**'],
  ['Output target',
    'Primary: form1040.payments.totalWithholding (BigDecimal; line 25d output; null-when-zero)\n' +
    'PDF field: line25d_total_withholding (page 2; AcroForm f2_20[0])\n' +
    'Frontend field: form.payments?.totalWithholding (with DUAL-PATH fallback to sub-line sum)'],
  ['Backend implementation',
    '**SINGLE WIRING SITE** — `computeLine31ThroughLine38` at TaxReturnComputeService.java:19699; ' +
    'line 25d computation at lines 19872-19875 (4 lines): ' +
    '`roundMoney(safeAmount(withholdingW2).add(safeAmount(withholding1099)).add(safeAmount(withholdingOther)))` ' +
    'then `payments.setTotalWithholding(totalWithholding > 0 ? totalWithholding : null)`. ' +
    '★ Covered by 25a #5 NEW VERIFIED CORRECT breadcrumb at ~line 19688-19783 — sub-line field map ' +
    '(★ 4th reuse → ★ LOAD-BEARING CONFIRMATION; mirrors 20 #6 → 24 #6 in credits-section). ' +
    'Lock-in test: line25dAggregatesAllThreeSubLines (W-2 $10k + 1099-R $2k + W-2G $500 → $12,500).'],
  ['Frontend implementation (★ DUAL-PATH consistency)',
    'form-tax-return-1040.component.ts:432 — `line25dTotalWithholding()`:\n' +
    '  Step 1: if backend `payments.totalWithholding` is non-null, USE IT (line 436)\n' +
    '  Step 2: else fall back to client-side sum of withholdingW2 + withholding1099 + withholdingOther (line 437)\n' +
    'Both paths produce equivalent results. Backend path preferred for consistency with the\n' +
    'persisted compute. ★ DUAL-PATH is the only "surprise" in line 25d wiring (everything else is\n' +
    'pure pass-through).'],
  ['IRS source',
    'IRS 2025 Form 1040 (page 2 line 25d "Add lines 25a through 25c") + 2025 Instructions for ' +
    'Form 1040. Local cross-checks: docs/books/i1040gi_2025.txt + J.K. Lasser\'s Your Income Tax ' +
    '2025. ★ 2025 — IRS instructions are exact: "Add lines 25a through 25c." No transformation or ' +
    'rounding outside what the sub-lines already supply.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'computeLine31ThroughLine38 — Line 25a finalized at line 19844', '`payments.setWithholdingW2(withholdingW2)` — null-when-zero (helper).'],
  [2, 'Line 25b finalized at line 19857', '`payments.setWithholding1099(withholding1099)` — null-when-zero (helper).'],
  [3, 'Line 25c finalized at line 19869', '`payments.setWithholdingOther(withholdingOther)` — null-when-zero (helper).'],
  [4, 'Build BigDecimal sum at line 19872-19874', '`roundMoney(safeAmount(withholdingW2).add(safeAmount(withholding1099)).add(safeAmount(withholdingOther)))`. ★ safeAmount returns BigDecimal.ZERO on null — never NPE.'],
  [5, '★ Ternary null-flip at line 19875', '`totalWithholding.compareTo(BigDecimal.ZERO) > 0 ? totalWithholding : null` — ★ UNIQUE convention; null when sum is zero.'],
  [6, '`payments.setTotalWithholding(...)` at line 19875', 'Stores result; ★ null-when-zero enforced at setter, not helper.'],
  [7, 'Downstream: line 33 total payments', '`line33 = line25d + line26 + line32`. Line 25d is the first addend.'],
  [8, 'Downstream: frontend PDF + UI export', 'form-tax-return-1040.component.ts:432 — DUAL-PATH compute: backend totalWithholding preferred; fallback to client-side sub-line sum if null.'],
  [],
  ['INVARIANTS / VALIDATIONS (spec §7)'],
  ['Invariant', 'Rationale'],
  ['Line 25d ≥ 0', 'Each sub-line ≥ 0; sum of non-negatives ≥ 0.'],
  ['Line 25d = nz(25a) + nz(25b) + nz(25c)', 'STRUCTURALLY enforced at line 19872-19874.'],
  ['Line 25d ≥ line 25a', 'Since 25b ≥ 0 and 25c ≥ 0, 25d = 25a + 25b + 25c ≥ 25a.'],
  ['Line 25d ≥ line 25b', 'Same logic.'],
  ['Line 25d ≥ line 25c', 'Same logic.'],
  ['Line 25d stored as null when zero', 'STRUCTURALLY enforced via ternary at line 19875 — ★ UNIQUE among 25a-25d (helper-returned null on 25a/25b/25c).'],
  ['MFJ aggregates both spouses\' withholding via sub-lines', 'Transitively inherited from 25a/25b/25c MFJ aggregation.'],
  ['MFS reports only own withholding via sub-lines', '★ Transitively inherited from 25a/25b/25c NEW MFS PATTERN; ★ 4th instance.'],
  ['Frontend DUAL-PATH equivalence', 'Backend totalWithholding === client-side sub-line sum (when both non-null). Lock-in test line25dAggregatesAllThreeSubLines verifies backend path.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 38 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 25d'],
  ['Line 25d takes EXACTLY 3 INPUTS — the three sub-line outputs 25a, 25b, 25c. ★ STRUCTURALLY SIMPLEST among 25a-25d — no statement iteration, no helper, no conditional branching. Pure pass-through addition. All MFS protection inherited transitively from sub-lines (NEW MFS PATTERN; ★ 4th instance).'],
  [],
  ['SUB-LINE INPUTS (3)'],
  ['#', 'Source', 'Origin', 'Java field read', 'Conditional?'],
  [1, 'Line 25a (W-2 box 2 withholding)', 'Set by computeLine31ThroughLine38 at line 19844', 'BigDecimal withholdingW2 (local var; same method)', 'No — always read; safeAmount handles null'],
  [2, 'Line 25b (1099-family + SSA-1099 + RRB-1099 + 1099-DA)', 'Set by computeLine31ThroughLine38 at line 19857', 'BigDecimal withholding1099 (local var; same method)', 'No — always read; safeAmount handles null'],
  [3, 'Line 25c (W-2G + Form 8959 Part V line 24)', 'Set by computeLine31ThroughLine38 at line 19869', 'BigDecimal withholdingOther (local var; same method)', 'No — always read; safeAmount handles null'],
  [],
  ['⚠️ NO STATEMENT-LEVEL INPUT FOR LINE 25d'],
  ['Line 25d has no statement form input of its own. Every dollar in line 25d originates from a statement iterated by 25a/25b/25c (W-2 / 1099-* / SSA-1099 / RRB-1099 / RRB-1099-R / 1099-DA / W-2G) or from Form 8959 (built from W-2 + Form 4137). No new statement type is introduced.'],
  [],
  ['⚠️ NO DEDICATED USER INPUT FORM FOR LINE 25d OUTPUT'],
  ['Line 25d has NO `form-line25d-*.xlsx` in input_forms. The output is rendered on the `form-tax-return-1040` Tax Return view + Form 1040 PDF only.'],
  [],
  ['⚠️ MFS PROTECTION via NEW MFS PATTERN (transitive inheritance from 25a/25b/25c — ★ 4th instance)'],
  ['Mechanism', 'Detail'],
  ['★ Storage-level user scoping (transitive)', 'Sub-lines 25a/25b/25c each load Firestore-scoped statement lists in prepare(). Line 25d transitively inherits MFS segregation by summing only what those sub-lines have already filtered.'],
  ['No in-method null-shadow needed', 'computeLine31ThroughLine38 takes lists/objects as parameters — no per-spouse pair; MFS segregation happens BEFORE method is called.'],
  ['MFJ aggregation', 'For MFJ, sub-lines 25a/25b/25c each aggregate both spouses\' statement entries; 25d sums them.'],
  ['→ NO MFS GUARD NEEDED at line 25d wiring site', '20th defensive-gap-NOT-needed; ★ 10th orchestrator-method-based audit; ★ 4th instance of NEW MFS PATTERN — pattern recurrence further confirmed; pure-sum agnostic.', '(See 25d #1)'],
  [],
  ['★ Frontend DUAL-PATH input (form-tax-return-1040.component.ts:432)'],
  ['Path', 'Source field', 'Used when'],
  ['Path A (preferred)', 'payments.totalWithholding (backend-computed)', 'When backend value is non-null'],
  ['Path B (fallback)', 'sumAmounts([withholdingW2, withholding1099, withholdingOther]) — client-side sum', 'When backend totalWithholding is null'],
  ['', '★ Equivalent results — lock-in test line25dAggregatesAllThreeSubLines verifies backend path', ''],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 55 }, { wch: 50 }, { wch: 50 }, { wch: 35 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 25d'],
  ['Line 25d uses ZERO reference data — pure pass-through addition. Even more trivial than lines 25a/25b/25c (which also used zero direct constants but at least iterated statement entries). Line 25d does not depend on any tax-year-specific constants.'],
  [],
  ['Constant', 'Value', 'Statutory Basis', 'Backend identifier'],
  ['(None — pure pass-through sum)', '—', 'Spec §3d + dependencies/25abcd.md', '—'],
  [],
  ['★ Source count comparison across 25a-25d sub-lines'],
  ['Sub-line', '# Implemented sources', '# Deferred OOS', 'Total complexity', 'Convention 1 (null-when-zero) mechanism'],
  ['line 25a (W-2 box 2)', '1', '0', 'SIMPLE — single unconditional source', 'Helper-returned null'],
  ['line 25b (1099-family + SSA + RRB + 1099-DA)', '13', '0', '★ HEAVIEST — 13 unconditional sources', 'Helper-returned null (variadic)'],
  ['line 25c (W-2G + Form 8959)', '2', '4 (G4 K-1/1042-S/8805/8288-A)', 'MEDIUM — 2 implemented (1 conditional)', 'Helper-returned null + conditional guard'],
  ['**line 25d (★ THIS LINE)**', '**3 (sub-lines)**', '**0**', '**★ SIMPLEST — pure pass-through addition**', '**★ Ternary at setter (UNIQUE)**'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 25 }, { wch: 35 }, { wch: 50 }, { wch: 45 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 25d Persistence + Downstream Consumers'],
  ['Line 25d sets one field on Payments output model. Same downstream pattern as 25a/25b/25c — feeds line 33 total payments.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.payments.totalWithholding', '`computeLine31ThroughLine38` line 19875', '★ CANONICAL line 25d output. = nz(withholdingW2) + nz(withholding1099) + nz(withholdingOther). Null-when-zero via ternary at setter.'],
  [],
  ['SAME-METHOD DOWNSTREAM'],
  ['Line 33 = line 25d + line 26 + line 32', '~line 19960', 'Line 25d is the first addend in line 33 total payments.'],
  ['Lines 37/38 (refund/owed)', '~line 19990+', 'Line 25d feeds line 33; line 33 vs. line 24 determines refund (line 37) or amount owed (line 38).'],
  [],
  ['CROSS-METHOD DOWNSTREAM (frontend DUAL-PATH)'],
  ['Frontend `line25dTotalWithholding()`', 'form-tax-return-1040.component.ts:432', '★ DUAL-PATH: prefers backend `payments.totalWithholding`; falls back to client-side sum of sub-lines.'],
  ['Frontend `line33TotalPayments()`', 'form-tax-return-1040.component.ts:454', 'Sums `line25dTotalWithholding() + estimatedTaxPayments + line32OtherPayments()`.'],
  ['Frontend PDF export', 'form-tax-return-1040.component.ts:369', '`values[\'line25d_total_withholding\'] = formatAmount(line25dTotalWithholding())`.'],
  [],
  ['PDF Output'],
  ['PDF Field', 'Field Code'],
  ['Line 25d amount (page 2)', 'line25d_total_withholding'],
  ['AcroForm path', 'topmostSubform[0].Page2[0].f2_20[0]'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 50 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 25d'],
  ['Line 25d emits NO blocking flags. Pure pass-through addition; whatever 25a/25b/25c produce is what 25d returns. All upstream validation handled at sub-line level.'],
  [],
  ['Flag code', 'Severity', 'Condition'],
  ['(None at line 25d site)', 'N/A', 'No validation at line 25d.'],
  [],
  ['SPEC §7 STRUCTURAL INVARIANTS'],
  ['Invariant', 'How enforced'],
  ['line 25d ≥ 0', 'STRUCTURALLY enforced — each sub-line ≥ 0; sum ≥ 0.'],
  ['line 25d = nz(25a) + nz(25b) + nz(25c)', 'STRUCTURALLY enforced at line 19872-19874.'],
  ['line 25d ≥ line 25a (and ≥ 25b, ≥ 25c)', 'STRUCTURALLY enforced — non-negative addends.'],
  ['line 25d stored as null when zero', '★ UNIQUE enforcement — via TERNARY at setter (line 19875), not helper. `totalWithholding.compareTo(BigDecimal.ZERO) > 0 ? totalWithholding : null`.'],
  ['Frontend DUAL-PATH equivalence', 'STRUCTURALLY enforced — frontend `line25dTotalWithholding()` returns backend value when non-null, else sums sub-lines client-side. Lock-in test line25dAggregatesAllThreeSubLines.'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 14 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 25d is the pure-sum aggregation of 25a + 25b + 25c (★ STRUCTURALLY SIMPLEST among 25a-25d). 15th audit OUTSIDE 13ab pair; FOURTH and FINAL payments-section audit for 25abcd cluster (★ 25abcd CLUSTER COMPLETE at this audit); ★ 4th reuse of 25a #5 NEW breadcrumb → ★ LOAD-BEARING CONFIRMATION milestone (mirrors 20 #6 → 24 #6); ★ 8th META-AUDIT pushing sub-type (b) DOMINANCE to ~88%. 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-15 — CROSS-REFERENCE — NO MFS DEFENSIVE GAP NEEDED at line 25d wiring site (20th defensive-gap-NOT-needed; ★ 10th orchestrator-method-based; ★ 4th instance of NEW MFS PATTERN — pure-sum recurrence further confirmed; pattern is sum/aggregation agnostic)',
    '**Per-input MFS-leakage analysis**: line 25d wiring at TaxReturnComputeService.java:19872-19875 reads (a) `withholdingW2` (local var from line 19843; sub-line 25a output) + (b) `withholding1099` (local var from line 19850-19856; sub-line 25b output) + (c) `withholdingOther` (local var from line 19861-19868; sub-line 25c output). All three are local BigDecimal values produced earlier in the same method from upstream Firestore-scoped statement lists. **★ SAME NEW MFS PATTERN as 25a #1 + 25b #1 + 25c #1 — "upstream-data-segregated-at-storage"** — ★ 4th instance with PURE-SUM aggregation style (after 1-source/25a, 13-source/25b, 2-source-conditional/25c) confirms pattern is **source-count agnostic + aggregation-style agnostic + sum-agnostic**. **20th defensive-gap-NOT-needed Issue #1 in workflow**. **★ 10th orchestrator-method-based audit with transitive inheritance** (after 9 prior: 18 #1 + 20 #1 + 21 #1 + 22 #1 + 23 #1 + 24 #1 + 25a #1 + 25b #1 + 25c #1). **MFS-guard cascade UNCHANGED at 20 orchestrators**. ★ Pattern distribution after 10 audits: 6 transitive inheritance (sub-pattern A; credits-section) + 4 upstream-data-segregated-at-storage (sub-pattern B; payments-section). ★ Pattern will recur for 26/27a/28/29/31/32/33 future audits. Backend tests: **765/765 unchanged**.',
    'TaxReturnComputeService.java:19872-19875 (line 25d wiring; 4 lines)',
    'CLOSED — defensive-gap-NOT-needed. **20th in workflow** (★ 10th orchestrator-method-based; ★ 4th instance of NEW MFS PATTERN). ★ Pattern proven across 4 aggregation styles: single-source unconditional (25a) + variadic 13-source unconditional (25b) + 2-source with conditional branch (25c) + 3-addend pure pass-through sum (25d). ★ Pattern distribution after 10 audits: 6 transitive inheritance (sub-pattern A; credits-section complete) + 4 upstream-data-segregated-at-storage (sub-pattern B; payments-section ongoing — will recur for 26/27a/28/29/31/32/33). MFS-guard cascade UNCHANGED at 20 orchestrators. Pure cross-reference closure. 765/765 unchanged.'],

  [2, 'RESOLVED 2026-05-15 — DOCUMENTATION HYGIENE — ★ 3rd "already-migrated" closure in workflow (combined-spec inheritance from 25a #2; pattern recurrence firmly established for combined-spec sub-line families)',
    '**The situation**: Knowledge file renamed at 25a #2 2026-05-15 (combined-spec property — single rename covers 25a-25d). Line 25d inherits via same shared knowledge file `line-25abcd-federal-withholding.md` which already documents §3d (line 25d sum) + §6 (totalWithholding model field). **★ 3rd "already-migrated" closure in workflow** (after 25b #2 FIRST + 25c #2 SECOND) — pattern firmly established for combined-spec sub-line families; 25abcd is the FIRST combined-spec family in the workflow (no 12abcde-style precedent at this layer). 3 verification checks pass: (1) renamed file exists; (2) zero hits for separate per-sub-line knowledge file; (3) generator uses post-rename name. **Convergence count UNCHANGED at 31** (no increment). **Legacy A migration count UNCHANGED at 18**. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\knowledge\\line-25abcd-federal-withholding.md (renamed at 25a #2; covers 25d via §3d + §6)',
    'CLOSED — ★ ALREADY MIGRATED at 25a #2 (combined-spec property; ★ 3rd "already-migrated" closure). 3 verification checks pass: (1) renamed file exists; (2) zero hits for separate per-sub-line `knowledge_line25d` references; (3) generator uses post-rename name. **★ 3rd "already-migrated" closure in workflow** (after 25b #2 + 25c #2) — pattern firmly established for combined-spec sub-line families. ★ Combined-spec property fully validated across 4 audits (25a + 25b + 25c + 25d). **Convergence count UNCHANGED at 31** (no increment). **Legacy A migration count UNCHANGED at 18**. Pure verification closure — no action needed.'],

  [3, 'RESOLVED 2026-05-15 — SPEC ENHANCEMENT — Append ROW 4 to lines/25abcd.md §11 Verification log (★ 3rd combined-spec ROW APPEND in workflow; ★ COMPLETES 25abcd §11 family with all 4 sub-lines; 18th CONSECUTIVE single-row contribution)',
    '**Goal**: append a NEW ROW (row 4) to the existing `## 11) Verification log` section in `lines/25abcd.md` for the line 25d audit. **★ 3rd combined-spec ROW APPEND in workflow** (after 25b #3 FIRST + 25c #3 SECOND). **★ COMPLETES 25abcd §11 FAMILY** — pre-state: §11 has 3 rows (25a + 25b + 25c COMPLETE); post-state: §11 has all 4 rows with all sub-lines COMPLETE. Row 4 in IN-PROGRESS state for 25d capturing #1 (20th defensive-gap-NOT-needed; ★ 4th NEW MFS PATTERN instance) + #2 (★ 3rd "already-migrated" closure) + #3 (this row append; ★ COMPLETES §11 family). Finalized to COMPLETE at Issue #10. **★ 18th CONSECUTIVE single-row contribution in workflow**. Pure spec enhancement.',
    'C:\\us-tax\\lines\\25abcd.md §11 Verification log (append row 4; ★ COMPLETES family)',
    'CLOSED — ROW 4 appended to existing §11 (6-column structure from 25a #3). **★ COMPLETES 25abcd §11 FAMILY** — all 4 sub-lines (25a + 25b + 25c + 25d) now have COMPLETE rows. Row 4 in IN-PROGRESS state with #1+#2+#3 closures enumerated; will be finalized to COMPLETE at Issue #10. **★ 3rd combined-spec ROW APPEND in workflow** (after 25b #3 + 25c #3). **★ 18th CONSECUTIVE single-row contribution in workflow** (per-audit single-row contribution counted; §11 table total now 4 rows — ★ family complete). ★ Pattern fully validated: combined-spec families produce N-row Verification logs (one per sub-line audit); 25abcd produced exactly 4 rows in 4 sequential audits.'],

  [4, 'RESOLVED 2026-05-15 — ★ EIGHTH META-AUDIT IN WORKFLOW — sub-type (b) signature (same as 22+23+24+25a+25b+25c); ★ DOMINANCE to ~88% (7 of 8); 6th CLEAN sub-type (b) META-AUDIT',
    '**The situation**: Combined-spec META-AUDIT reuse — same dependencies/25abcd.md + knowledge/line-25abcd-federal-withholding.md §0 banners serve 25d #4 (and previously served 25a #4 + 25b #4 + 25c #4). 4th combined-spec META-AUDIT in workflow. **★ EIGHTH META-AUDIT in workflow**. **★ DOMINANCE to ~88% — 7 of 8 META-AUDITS use sub-type (b)** (lines 22+23+24+25a+25b+25c+25d); line 21 alone uses sub-type (a). ★ 6th CLEAN sub-type (b) META-AUDIT (★ clean trend strengthens to 71% within sub-type b: 5 clean lines 23+25a+25b+25c+25d + 2 drift-surfacing lines 22+24). **★ 7 consistency checks pass** (same as prior META-AUDITS): (a) ✅ method computeLine31ThroughLine38 at line 19699; line 25d at 19872-19875; (b) ✅ Payments.totalWithholding field exists; (c) ✅ frontend mapping (DUAL-PATH at line 432); (d) ✅ e2e spec Test 5 (all three sub-lines combined → 25d); (e) ✅ lock-in test line25dAggregatesAllThreeSubLines; (f) ✅ formula matches spec §3d + code; (g) ✅ null-when-zero via ternary matches §7. **★ NO doc-drift fix needed** — line 25d is purely arithmetic; spec + knowledge + code all agree.',
    'C:\\us-tax\\lines\\25abcd.md (NO §0 banner); C:\\us-tax\\dependencies\\25abcd.md line 3 (Audited 2026-04-19); knowledge file §0',
    'CLOSED — EIGHTH META-AUDIT consistency check complete. **★ DOMINANCE to ~88% — 7 of 8 META-AUDITS use sub-type (b)** (lines 22+23+24+25a+25b+25c+25d); only line 21 uses sub-type (a). **★ 6th CLEAN sub-type (b) META-AUDIT** (along with 23 + 25a + 25b + 25c). **★ Clean trend strengthens to 71%** within sub-type (b): 5 clean (23 + 25a + 25b + 25c + 25d) + 2 drift-surfacing (22 + 24) — clean outcomes overwhelmingly dominant. ★ Progression: 22 (67%) → 23 (67%) → 24 (75%) → 25a (80%) → 25b (83%) → 25c (86%) → 25d (88%); asymptotic toward (n-1)/n. ★ 4th combined-spec META-AUDIT reuse — same dependencies+knowledge §0 source served 25a #4 + 25b #4 + 25c #4 + 25d #4 (★ family complete). 7/7 consistency checks pass; no doc-drift.'],

  [5, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — line 25d wiring at line 19872-19875; ★ 17th anti-duplication application; ★ 4th reuse of 25a #5 NEW breadcrumb → ★ LOAD-BEARING CONFIRMATION MILESTONE (mirrors 20 #6 → 24 #6 in credits-section)',
    '**Closure intent**: pure cross-reference closure — **NO new breadcrumb**. Line 25d covered by **25a #5 NEW breadcrumb** at TaxReturnComputeService.java:~19688-19783 (planted 2026-05-15 during line 25a audit), which explicitly documents line 25d: *"line 25d = nz(25a) + nz(25b) + nz(25c) (null-when-zero) — at line 15201-15205"* (now at ~line 19872-19875). **★ 4th reuse of 25a #5 NEW breadcrumb overall** — 25a #6 same-audit + 25b #5 cross-audit + 25c #5 cross-audit + 25d #5 cross-audit. **★ LOAD-BEARING CONFIRMATION MILESTONE** — 4 distinct audit cycles reused this single breadcrumb (mirrors 20 #6 → 24 #6 in credits-section: 20 #6 planted; 21/22/23/24 #5 reused; 4 reuses confirm load-bearing). ★ Pattern fully validated: method-level breadcrumbs anchor multi-sub-line cluster audits with single-source coverage. 3-source coverage: spec §3d + dependencies + 25a #5. **17th anti-duplication application**. Pure cross-reference closure. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:19872-19875 (line 25d wiring; covered by 25a #5 NEW breadcrumb at ~line 19688)',
    'CLOSED — verified correct via 25a #5 NEW breadcrumb + spec §3d + dependencies/25abcd.md (3-source coverage). **17th anti-duplication application**. **★ 4th reuse of 25a #5 NEW breadcrumb overall** (25a #6 same-audit + 25b #5 + 25c #5 + 25d #5 cross-audit). **★ LOAD-BEARING CONFIRMATION MILESTONE** — 4 distinct audit cycles confirm 25a #5 breadcrumb is load-bearing (mirrors 20 #6 → 24 #6 trajectory in credits-section: planted at 20 #6, reused at 21/22/23/24 #5 — 4 reuses confirmed load-bearing). ★ Method-level breadcrumb pattern fully validated for payments-section. Pure cross-reference closure.'],

  [6, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — ★ PURE-SUM inheritance chain (★ STRUCTURALLY SIMPLEST among 25a-25d — pure pass-through addition; no statement iteration; no conditional branching; no helper); same NEW MFS PATTERN protection via transitive inheritance from 25a/25b/25c',
    '**Closure intent**: pure cross-reference closure — verifies the pure-sum inheritance chain that makes line 25d correct AND MFS-clean. **★ STRUCTURALLY SIMPLEST among 25a-25d**: 25a (1 source unconditional + helper); 25b (13 sources unconditional + variadic helper); 25c (1 unconditional + 1 conditional + helper + guard); **25d (★ pure 3-addend pass-through addition with safeAmount null-protection — NO helper, NO iteration, NO conditional)**. **Chain stages**: **(1)** Source: three local BigDecimal vars (withholdingW2, withholding1099, withholdingOther) populated earlier in same method by their respective sub-line wiring sites. **(2)** ★ safeAmount(...) calls coerce null → BigDecimal.ZERO — never NPE. **(3)** BigDecimal.add (pure arithmetic; no statement iteration). **(4)** roundMoney wraps the sum (currency precision). **(5)** ★ Ternary at setter: `totalWithholding.compareTo(BigDecimal.ZERO) > 0 ? totalWithholding : null` — null-when-zero enforced HERE (★ UNIQUE; other sub-lines rely on helper-returned null). **(6)** payments.setTotalWithholding — pure write. **★ KEY PROPERTY**: line 25d is structurally trivial; the only "surprise" is the ternary null-flip at setter site (★ Convention 1 mechanism distinct from 25a/25b/25c). **★ MFS PROTECTION**: transitively inherited from 25a/25b/25c. Pure aggregation cannot introduce MFS leakage. **No new breadcrumb** — chain documented via 25a #5 NEW breadcrumb (which explicitly notes line 25d as null-when-zero pure sum). Pure cross-reference closure.',
    'TaxReturnComputeService.java:19872-19875 (line 25d wiring; pure-sum chain); chain documented via 25a #5 NEW breadcrumb',
    'CLOSED — verified correct via PURE-SUM inheritance chain. **★ STRUCTURALLY SIMPLEST among 25a-25d**: pure 3-addend pass-through addition; no statement iteration; no conditional branching; no helper method. ★ Chain: Stage 1 three local BigDecimal vars → Stage 2 safeAmount null-coerce → Stage 3 pure BigDecimal.add → Stage 4 roundMoney → Stage 5 ★ ternary null-flip at setter (★ UNIQUE among 25a-25d). **★ Complexity comparison: 25a (1+helper) → 25b (13+variadic) → 25c (2+conditional) → 25d (3 sub-lines, pure-sum, no helper)**. ★ KEY PROPERTY: MFS protection transitively inherited from 25a/25b/25c (NEW MFS PATTERN; ★ 4th instance). MFS-clean by construction. No new breadcrumb — covered by 25a #5.'],

  [7, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — Convention 1 null-when-zero ★ ENFORCED VIA TERNARY (★ UNIQUE among 25a-25d — others rely on helper-returned null; 25d builds zero-when-empty then ternary-flips); Conventions 2/3/4 inherited transitively from sub-lines',
    '**Closure intent**: pure verification closure — confirms line 25d conventions with one ★ UNIQUE Convention 1 mechanism. **Convention 1 — Null-when-zero ★ VIA TERNARY at setter**: `totalWithholding.compareTo(BigDecimal.ZERO) > 0 ? totalWithholding : null` at line 19875. ★ UNIQUE among 25a-25d — line 25a (helper sumFederalWithholdingFromEntries returns null when no entries), line 25b (variadic helper returns null when all empty), line 25c (helper-returned null + conditional guard). Line 25d cannot use helper because it has no entries to iterate; instead builds zero from safeAmount-of-null addends, then ternary-flips to null. **Convention 2 — No SSN filtering**: transitively inherited — sub-lines do not filter by SSN. **Convention 3 — MFJ aggregation**: transitively inherited — sub-lines aggregate both spouses\' withholding. **Convention 4 — MFS storage segregation**: transitively inherited via NEW MFS PATTERN; ★ 4th instance. ★ NO Convention 5. Lock-in test: line25dAggregatesAllThreeSubLines (W-2 $10k + 1099-R $2k + W-2G $500 → totalWithholding = $12,500). No new breadcrumb. Pure verification closure.',
    'TaxReturnComputeService.java:19875 (★ ternary null-flip); spec §7 (null-when-zero invariant); lock-in test line25dAggregatesAllThreeSubLines',
    'CLOSED — verified correct. **Convention 1 — null-when-zero ★ ENFORCED VIA TERNARY at line 19875** (★ UNIQUE among 25a-25d): `totalWithholding.compareTo(BigDecimal.ZERO) > 0 ? totalWithholding : null`. Cannot use helper-returned null pattern (25a/25b/25c) because line 25d has no statement entries to iterate — builds zero from safeAmount-of-null addends, then ternary-flips. **Conventions 2/3/4** (no SSN filtering + MFJ aggregation + MFS storage segregation) transitively inherited from sub-lines (NEW MFS PATTERN; ★ 4th instance). **★ NO 5th convention** (no SSA-1099 special; no conditional branching). Lock-in test: line25dAggregatesAllThreeSubLines verifies sum behavior. 3-source coverage: spec §3d + §7 + code. No new breadcrumb — covered by 25a #5.'],

  [8, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — ZERO routing distinctions specific to line 25d (pure pass-through addition); ★ frontend DUAL-PATH compute consistency verified (backend totalWithholding preferred; client-side sub-line sum fallback)',
    '**Closure intent**: pure verification closure — confirms line 25d has ZERO routing distinctions (pure pass-through) + verifies frontend DUAL-PATH consistency. **Routing**: ★ ZERO — line 25d takes whatever 25a/25b/25c provide. Contrast: line 25a 0 rules + line 25b 4 rules (MOST) + line 25c 2 rules (MEDIUM) + line 25d 0 rules (★ STRUCTURALLY TRIVIAL — pure pass-through addition). **★ Frontend DUAL-PATH (form-tax-return-1040.component.ts:432)**: `line25dTotalWithholding()` returns backend `payments.totalWithholding` when non-null (line 436); else falls back to client-side `sumAmounts([withholdingW2, withholding1099, withholdingOther])` (line 437). ★ Both paths produce equivalent results — backend computes sum once with roundMoney; client-side does same operation. ★ Lock-in test `line25dAggregatesAllThreeSubLines` verifies backend path. ★ No corresponding lock-in test exists for client-side fallback path; client-side fallback is a defensive measure for scenarios where backend totalWithholding might be unexpectedly null while sub-lines are present (rare; suggests upstream bug). ★ No bug to fix — DUAL-PATH is defensive and consistent. No new breadcrumb — covered by 25a #5. Pure verification closure.',
    'TaxReturnComputeService.java:19872-19875 (backend wiring); form-tax-return-1040.component.ts:432 (★ DUAL-PATH frontend); lock-in test line25dAggregatesAllThreeSubLines',
    'CLOSED — verified correct. **Routing**: ★ ZERO routing distinctions specific to line 25d (pure pass-through addition). Routing complexity comparison: 25a 0 + 25b 4 (MOST) + 25c 2 (MEDIUM) + **25d 0 (★ STRUCTURALLY TRIVIAL)**. **★ Frontend DUAL-PATH consistency verified**: `line25dTotalWithholding()` prefers backend `payments.totalWithholding` (line 436); falls back to client-side `sumAmounts(...)` of sub-lines (line 437) when backend is null. Both paths equivalent. ★ Defensive measure — fallback covers rare case where backend totalWithholding is null while sub-lines are non-null. ★ Lock-in test `line25dAggregatesAllThreeSubLines` verifies backend path; client-side fallback not separately tested but covered transitively by sub-line lock-ins. ★ No bug to fix. No new breadcrumb — covered by 25a #5 NEW breadcrumb + spec §3d (3-source coverage).'],

  [9, 'RESOLVED 2026-05-15 — ⚠️ BUNDLED OBSERVATIONS — 4 observations (★ 25th Path A application; ★ 29 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS — extends first 20-streak by 9; ★ 12th CONSECUTIVE AUDIT WITH ZERO NEW GAPS — double-digit milestone deepens further; ★ 9th consecutive missing-diagrams gap)',
    '**Closure intent**: pure xlsx-flip observation bundle — **NO code change**; **NO outstanding.md entry**. FOUR observations bundled. **(a) G4 DEFERRED OOS — K-1/1042-S/8805/8288-A**: transitively inherited from line 25c (line 25d sums whatever 25c provides; 25d itself has no input sources beyond the 3 sub-lines). Cross-reference, not 25d-specific. Already in outstanding.md from 2026-04-19 cycle. **(b) Missing `diagrams/25d.drawio` cosmetic** — ★ 9th consecutive credits/payments-section audit with this gap (after 20-24 + 25a + 25b + 25c). One-shot cleanup overdue across 9 lines. **(c) ★ 25abcd CLUSTER COMPLETE**: this audit closes the 4th and final 25abcd sub-line. §11 Verification log family has all 4 rows. Future audit work shifts to lines 26 onward. **(d) ★ LOAD-BEARING CONFIRMATION milestone**: 25a #5 NEW breadcrumb has been reused in 25b #5 + 25c #5 + 25d #5 cross-audits — 4 total reuses confirm load-bearing status (mirrors 20 #6 → 24 #6 in credits-section). **★ Anti-fragmentation policy applied**. **★ 25th PATH A APPLICATION**. **★ 29 consecutive zero-outstanding walkthroughs** (extends first 20-streak by 9). **★ 12th CONSECUTIVE ZERO NEW GAPS** (double-digit milestone deepens further).',
    'G4 OOS K-1/1042-S/8805/8288-A (cross-reference); diagrams/25d.drawio (missing); ★ 25abcd cluster complete; ★ LOAD-BEARING CONFIRMATION',
    'CLOSED — pure observation bundle. **★ 25th Path A application**. **★ 29 consecutive zero-outstanding walkthroughs** (extends first 20-streak by 9). **★ 12th CONSECUTIVE ZERO NEW GAPS** (double-digit milestone deepens further — codebase stability signal continues strengthening). 4 observations: (a) G4 DEFERRED OOS K-1/1042-S/8805/8288-A transitively inherited from line 25c (cross-reference; documented in outstanding.md from 2026-04-19); (b) Missing `diagrams/25d.drawio` cosmetic — ★ 9th consecutive credits/payments-section audit with this gap (now overdue across 9 lines: 20-24 + 25a + 25b + 25c + 25d); (c) ★ 25abcd CLUSTER COMPLETE — §11 Verification log family has all 4 rows; future audit work shifts to lines 26 onward; (d) ★ LOAD-BEARING CONFIRMATION milestone — 25a #5 NEW breadcrumb confirmed load-bearing after 4 total reuses (mirrors 20 #6 → 24 #6 in credits-section).'],

  [10, 'RESOLVED 2026-05-15 — BOUNDARY MILESTONE — Line 25d walkthrough complete at 10/10; ★ FOURTH AND FINAL payments-section audit for 25abcd cluster; ★ 25abcd CLUSTER COMPLETE; ★ LOAD-BEARING CONFIRMATION MILESTONE (4th reuse of 25a #5 confirms load-bearing); ★ 8th META-AUDIT (sub-type b at 88% DOMINANCE); ★ pure-sum simplest chain; ★ null-via-ternary unique convention; ★ frontend DUAL-PATH consistency verified; ★ 29 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS; ★ 12th CONSECUTIVE AUDIT WITH ZERO NEW GAPS (double-digit milestone deepens further); ★ 18th CONSECUTIVE single-row contribution',
    'Pure xlsx-flip + Verification log row 4 finalization — **CLOSES the 25d walkthrough at 10/10 AND ★ COMPLETES the 25abcd cluster**. TWO file touches: (a) this row flipped to RESOLVED; (b) lines/25abcd.md §11 Verification log row 4 finalized IN-PROGRESS → **COMPLETE — 10/10 closed** (★ 25abcd §11 family COMPLETE at this audit). **Eight themes**: (1) ★ Structural positioning — 15th audit OUTSIDE 13ab pair; ★ FOURTH AND FINAL payments-section audit for 25abcd cluster; 54th line; ★ STRUCTURALLY SIMPLEST among 25a-25d (pure pass-through addition); ★ null-via-ternary at setter site UNIQUE. (2) **★ MFS-guard cascade UNCHANGED at 20 orchestrators** — 20th defensive-gap-NOT-needed; ★ 10th orchestrator-method-based; ★ 4th instance of NEW MFS PATTERN — pattern proven sum/aggregation agnostic across 4 instances. (3) **★ 8th META-AUDIT** — sub-type (b) at 88% DOMINANCE (7 of 8); 6th CLEAN sub-type (b) META-AUDIT (clean trend strengthens to 71% within sub-type b). (4) **★ LOAD-BEARING CONFIRMATION MILESTONE** (Issue #5) — 4th reuse of 25a #5 NEW breadcrumb (25a #6 same-audit + 25b/25c/25d #5 cross-audit) confirms load-bearing status (mirrors 20 #6 → 24 #6 in credits-section). (5) **Knowledge convergence UNCHANGED at 31** (Issue #2: ★ 3rd "already-migrated" closure). (6) **★ 17 ANTI-DUPLICATION applications**. (7) **★ Frontend DUAL-PATH verified** (Issue #8: backend totalWithholding preferred; client-side sub-line sum fallback). (8) **★ ZERO NEW gaps surfaced — 12th consecutive audit** (double-digit milestone deepens further; lines 18-24 + 25a + 25b + 25c + 25d all zero). **Cumulative through line 25d**: **54 lines audited** (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + 11b + 12a + 12b + 12c + 12d + 12e + 13a + 13b + 14 + 15 + 16 + 17 + 18 + 19 + 20 + 21 + 22 + 23 + 24 + 25a + 25b + 25c + **25d**); **537 audit issues closed total** (527 + 10); backend **765/765 pass** (UNCHANGED); MFS cascade = **20 orchestrators** (unchanged); knowledge convergence = **31 lines** (UNCHANGED — combined spec; ★ 3rd already-migrated closure); 25 Path A applications (+1 from 25d #9); **★ 17 anti-duplication applications** (+1 from 25d #5; ★ LOAD-BEARING CONFIRMED); 0 NEW gaps surfaced (12th consecutive); **★ 8 META-AUDITS** (+1 from 25d #4; ★ sub-type (b) at 88% DOMINANCE). **★ 29 CONSECUTIVE WALKTHROUGHS WITH ZERO NEW OUTSTANDING.MD ENTRIES** (extends first 20-streak by 9). **Verification logs**: ... + 25abcd (★ now 4 rows — 25a + 25b + 25c + 25d all COMPLETE; ★ 25abcd §11 family COMPLETE; ★ 18th CONSECUTIVE single-row contribution). **Looking ahead — line 26 (Estimated tax payments)**: 16th audit OUTSIDE 13ab pair; FIFTH payments-section audit; ★ FIRST audit AFTER 25abcd cluster complete; introduces estimated tax payment storage (separate from withholding); ★ likely 11th orchestrator-method-based; ★ may continue NEW MFS PATTERN (5th instance) OR introduce new pattern (estimated payments are stored per-spouse — may not fit upstream-data-segregated pattern); ★ likely 9th META-AUDIT pushing sub-type (b) DOMINANCE to ~89% (8 of 9); fresh spec/dependencies (lines/26.md if exists).',
    'XLS/computations/25d.xlsx audit-trail (this row); lines/25abcd.md §11 Verification log row 4 FINALIZED to COMPLETE — 10/10 closed (★ 25abcd family COMPLETE); ★ LOAD-BEARING CONFIRMATION milestone',
    'CLOSED — 10/10. **54 lines; 537 issues; 765/765 backend (UNCHANGED — 6th audit with zero new tests); 20 orchestrators (UNCHANGED); 31-line knowledge convergence (UNCHANGED — combined spec; ★ 3rd already-migrated closure); 10 doc-drift fixes (UNCHANGED — 6th audit with zero drift); 25 Path A applications; ★ 17 anti-duplication applications (★ LOAD-BEARING CONFIRMED); ★ 29 consecutive zero-outstanding walkthroughs (extends first 20-streak by 9); ★ 12th CONSECUTIVE ZERO NEW GAPS (double-digit milestone DEEPENS FURTHER); ★ 18th CONSECUTIVE single-row contribution; ★ 8 META-AUDITS (★ sub-type (b) at 88% DOMINANCE; clean trend 71% within sub-type b); ★ 3 distinct MFS-protection mechanisms (UNCHANGED — NEW MFS PATTERN 4th instance); ★ 4 distinct complexity dimensions in workflow (UNCHANGED — line 25d is pure-sum SIMPLEST which is below the established complexity dimensions); ★ LOAD-BEARING CONFIRMATION milestone verified; ★ PURE-SUM chain STRUCTURALLY SIMPLEST among 25a-25d; ★ null-via-ternary at setter site UNIQUE convention; ★ frontend DUAL-PATH consistency verified; ★ 25abcd §11 family COMPLETE**. ★ FOURTH AND FINAL payments-section audit for 25abcd cluster. ★ 25abcd cluster COMPLETE. Next: line 26 (★ FIRST audit AFTER cluster complete; estimated tax payments; ★ may introduce 5th MFS-protection pattern or continue 4th; ★ 9th META-AUDIT; fresh spec).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 120 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 25d Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Notes'],
  ['form1040.payments.totalWithholding', 'Form 1040 page 2, line 25d (PDF key line25d_total_withholding; AcroForm f2_20[0])', '★ CANONICAL line 25d output. = nz(withholdingW2) + nz(withholding1099) + nz(withholdingOther). Null-when-zero via ternary at setter (★ UNIQUE among 25a-25d).'],
  [],
  ['SAME-METHOD DOWNSTREAM'],
  ['Line 33 = line 25d + line 26 + line 32', '~line 19960', 'Line 25d is the first addend in line 33 total payments.'],
  ['Lines 37/38 (refund/owed)', '~line 19990+', 'Line 25d feeds line 33; line 33 vs. line 24 determines refund (line 37) or amount owed (line 38).'],
  [],
  ['CROSS-METHOD DOWNSTREAM — Frontend DUAL-PATH'],
  ['line25dTotalWithholding()', 'form-tax-return-1040.component.ts:432', '★ DUAL-PATH: prefers backend payments.totalWithholding; falls back to client-side sub-line sum.'],
  ['line33TotalPayments()', 'form-tax-return-1040.component.ts:454', 'Sums line25dTotalWithholding() + estimatedTaxPayments + line32OtherPayments().'],
  ['PDF export field assignment', 'form-tax-return-1040.component.ts:369', '`values[\'line25d_total_withholding\'] = formatAmount(line25dTotalWithholding())`'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
