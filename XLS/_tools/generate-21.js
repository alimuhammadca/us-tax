// ============================================================================
//  Generates: C:\us-tax\XLS\computations\21.xlsx
//
//  Source-of-truth references:
//    - lines/21.md (2025-tax-year spec; 240 lines; defines line 21 = line 19 +
//      line 20 = total nonrefundable credits subtotal; spec §0 carries
//      "Verification note (2026-04-18)" header documenting prior audit; spec §6c
//      explicit no-floor-at-21 (floor at 22); §6b informal soft constraint
//      `line21 <= line18` expected after correct upstream credit limiting.)
//    - dependencies/21.md (124 lines; 2-row Inputs Direct Inputs table (line 19
//      childTaxCredit + line 20 otherCreditsSchedule3) + 16-row Schedule 3 Part I
//      upstream sub-table + 3-row Outputs table (totalCredits + taxAfterCredits +
//      totalTax) + Compute Order section + PDF Field Mapping table + Java Model
//      section + 2-gap table (G1 fixed 2026-04-19; G2 fixed 2026-04-19).)
//    - knowledge/line-21-total-nonrefundable-credits.md (renamed from
//      knowledge_line21.md via 21 #2 2026-05-14; 270 lines; 14th Legacy A
//      migration; convergence 26 → 27 lines.
//      Full audit covering line identity + core formula + backend implementation
//      with code excerpt + frontend + Java unit test inventory (3 added
//      2026-04-19 per G1 fix) + E2E test inventory (3 dedicated scenarios) +
//      identified gaps G1 + G2 both ★ FIXED 2026-04-19.)
//    - flowcharts/21.drawio (existing); diagrams/21.drawio MISSING (cosmetic).
//    - TaxReturnComputeService.java:
//        line 1680 — call site for computeLine20ThroughLine24
//        line 19571-19604 — computeLine20ThroughLine24 (single combined method
//          for Form 1040 lines 20, 21, 22, 24; line 21 at line 19587-19590)
//        line 19587-19590 — line 21 computation: `line21 = roundMoney(line19.add(
//          safeAmount(line20)))`; null-when-zero set at line 19590
//        line 19486-19558 — 20 #6 VERIFIED CORRECT breadcrumb (already covers
//          line 21 as sub-verification 2)
//    - line21-total-credits.spec.ts (155 lines; 3 scenarios; retries:1 already
//      present — G2 fixed 2026-04-19)
//    - TaxReturnComputeServiceTest.java:
//        line 24139 — line21_equalsLine19PlusLine20_ctcAndAotc (G1 fix lock-in)
//        line 24187 — line21_isNullWhenNoCreditsPresent (G1 fix lock-in)
//        line 24215 — line21_line22FlooredAtZeroWhenCreditsAbsorbAllTax (G1 fix)
//    - IRS 2025 Form 1040 (line 21 "Add lines 19 and 20")
//    - IRS 2025 Instructions for Form 1040 / Schedule 3 / Schedule 8812
//    - docs/books/i1040gi_2025.txt + J.K. Lasser's Your Income Tax 2025
//
//  Tax year: 2025
//
//  Concept:
//    Form1040.line21 = Form1040.line19 + Form1040.line20
//
//    Where:
//      Form1040.line19 = Schedule8812.line14 (CTC + ODC; already credit-limited)
//      Form1040.line20 = Schedule3.line8     (sum of all other nonrefundable credits)
//
//    Line 21 is the CREDIT SUBTOTAL on Form 1040 page 2 — the combined
//    nonrefundable-credit total that the line-22 zero-floor subtraction applies to.
//
//    Implementation convention:
//      Form1040.line21 = nz(Form1040.line19) + nz(Form1040.line20)
//      where nz(x) treats null as zero.
//
//    Surrounding page-2 chain:
//      line 18 = line 16 + line 17                  (totalTaxBeforeCredits)
//      line 19 = Schedule8812.line14                (childTaxCredit)
//      line 20 = Schedule3.line8                    (otherCreditsSchedule3)
//      line 21 = line 19 + line 20                  (★ THIS LINE — totalCredits)
//      line 22 = max(0, line 18 − line 21)          (taxAfterCredits — floor at 0)
//      line 23 = Schedule 2 line 21                  (otherTaxes)
//      line 24 = line 22 + line 23                  (★★ TOTAL TAX FINAL — totalTax)
//
//    ★ KEY OBSERVATION: lines 20, 21, 22, 24 ALL computed in single method
//      `computeLine20ThroughLine24`. Line 21 was previously audited 2026-04-18
//      (per spec §0 verification note); G1 (no direct Java unit test) + G2 (e2e
//      missing retries:1) both ★ FIXED 2026-04-19 per knowledge §7. This audit
//      is META-AUDIT — re-verification with current workflow integration; FIRST
//      META-AUDIT in workflow.
//
//  Line 21 audit positioning (8th audit OUTSIDE 13ab pair):
//   • THIRD credits-section audit (after lines 19 + 20)
//   • Cumulative position: 47th line
//   • ★ FIRST META-AUDIT in workflow — spec already verified 2026-04-18; this
//     audit confirms re-verification + workflow integration breadcrumbs
//   • ★ SMALLEST CREDITS-SECTION line audit-trail expected — line 21 is
//     coincidentally the simplest tax-arithmetic line in the credits territory
//     (single-operator addition; no decision tree; no reference data; no
//     orchestrator) AND was already audited 2026-04-18 with both prior gaps
//     fixed 2026-04-19. Coverage already exists at 20 #6 sub-verification 2.
//   • Uses 20 #6 breadcrumb (already covers line 21 as sub-verification 2;
//     anti-duplication policy applies); 19 #5/#6/#7/#8 breadcrumbs (line 19
//     upstream); 18 #5/#6 breadcrumbs (line 18 inheritance).
//   • Likely DEFENSIVE-GAP-NOT-NEEDED Issue #1 — inline-computed at single
//     site; reads tac.getChildTaxCredit() + safeAmount(line20); both upstream-
//     set fields are already MFS-clean
//   • ⚠️ POTENTIAL META-AUDIT NOTE — spec §0 verification note (2026-04-18)
//     already documents prior audit; no doc drift expected; consistency
//     confirmation only.
//
//  Line 21 audit angles (10 issues):
//   1. CROSS-REFERENCE — NO MFS DEFENSIVE GAP NEEDED at line 21 wiring site
//       inside computeLine20ThroughLine24 (~line 19587-19590; line19 from
//       tac.getChildTaxCredit() inherits 19 #1 MFS guard transitively; line20
//       inherits 20 #1 transitive inheritance). 13th defensive-gap-NOT-needed
//       Issue #1 in workflow; THIRD orchestrator-method-based audit with
//       transitive inheritance after 18 #1 + 20 #1.
//       MFS cascade UNCHANGED at 20 orchestrators.
//   2. DOCUMENTATION HYGIENE — Knowledge file Legacy A rename
//       (knowledge_line21.md → line-21-total-nonrefundable-credits.md); 14th
//       Legacy A migration; convergence 26 → 27 lines.
//   3. SPEC ENHANCEMENT — Verification log section §12 in lines/21.md (single-
//       row pattern; ★ 11th CONSECUTIVE single-row log in workflow).
//   4. ★ META-AUDIT CONSISTENCY CHECK — spec §0 verification note (2026-04-18)
//       documents prior audit + G1 + G2 fixed 2026-04-19; this audit confirms
//       state still matches — NO documentation drift; ★ FIRST META-AUDIT in
//       workflow (re-verification with workflow integration).
//   5. VERIFIED CORRECT — line 21 single-site wiring at ~line 19587-19590;
//       anti-duplication policy applied; **9th anti-duplication application
//       in workflow** — covered by 20 #6 sub-verification 2 already.
//   6. VERIFIED CORRECT — inheritance chain (line 19 from 19 #1 MFS guard at
//       computeSchedule8812 call site; line 20 from 20 #1 transitive; line 21
//       = pure additive composite). Pure cross-reference.
//   7. VERIFIED CORRECT — null-when-zero convention + safeAmount handling
//       + spec §6b informal invariant (line21 <= line18 expected post upstream
//       credit-limiting; not runtime-validated; soft constraint).
//   8. VERIFIED CORRECT — downstream line 22 wiring at ~line 19593-19595;
//       anti-duplication policy applied; **10th anti-duplication application
//       in workflow** — covered by 20 #6 sub-verification 3 already.
//   9. ⚠️ BUNDLED OBSERVATIONS — 2 observations: (a) missing diagrams/21.drawio
//       (flowcharts/21.drawio exists; data-flow diagram absent; cosmetic; same
//       pattern as 20 #9 (b)); (b) lines 22 + 24 audits upcoming will be
//       similarly small (both inline in computeLine20ThroughLine24; coverage
//       already provided by 20 #6 sub-verifications 3 + 4). 18th Path A.
//  10. BOUNDARY MILESTONE — third credits-section audit; 47 lines / 467 issues
//       (after closing 10) / backend 765 UNCHANGED / MFS cascade UNCHANGED at
//       20 orchestrators; 8 doc drift fixes (unchanged) / 18 Path A / 10 anti-
//       duplication / 22 consecutive zero-outstanding walkthroughs.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '21.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 21 — TOTAL NONREFUNDABLE CREDITS (Add lines 19 and 20) — 2025'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 21 (page 2; "Add lines 19 and 20")'],
  ['Concept',
    'Line 21 is the SIMPLE ADDITIVE COMPOSITE of two upstream page-2 nonrefundable-credit lines — ' +
    'line 19 (CTC + ODC from Schedule 8812 line 14) + line 20 (Schedule 3 line 8 subtotal of all other ' +
    'nonrefundable credits). Its only job is to combine the two before the line-22 zero-floor subtraction. ' +
    '★ SMALLEST credits-section line — pure single-operator addition; no decision tree; no reference data; ' +
    'no orchestrator; no validation logic. Computation complexity is UPSTREAM in line 19 (Schedule 8812 ' +
    'CTC/ODC orchestrator) + line 20 (Schedule 3 Part I 17-credit aggregator).'],
  ['Top-level formula (spec §2)',
    'Form1040.line21 = Form1040.line19 + Form1040.line20\n' +
    'where:\n' +
    '  Form1040.line19 = Schedule8812.line14 (CTC + ODC; already credit-limited by CLW-A)\n' +
    '  Form1040.line20 = Schedule3.line8     (sum of other nonrefundable credits)\n' +
    '\n' +
    'Implementation convention:\n' +
    '  Form1040.line21 = nz(Form1040.line19) + nz(Form1040.line20)\n' +
    'where nz(x) treats null as zero.'],
  ['Surrounding page-2 chain (spec §5 + knowledge §2)',
    'line 18 = line 16 + line 17                    (totalTaxBeforeCredits)\n' +
    'line 19 = Schedule8812.line14                  (childTaxCredit; CTC + ODC)\n' +
    'line 20 = Schedule3.line8                      (otherCreditsSchedule3)\n' +
    '★ line 21 = line 19 + line 20                  (★ THIS LINE — totalCredits)\n' +
    'line 22 = max(0, line 18 − line 21)            (taxAfterCredits — ★ floor at 0 here, NOT at 21)\n' +
    'line 23 = Schedule 2 line 21                    (otherTaxes)\n' +
    'line 24 = line 22 + line 23                    (★★ TOTAL TAX FINAL — totalTax)\n' +
    '\n' +
    '★ Lines 20, 21, 22, 24 ALL computed in single method `computeLine20ThroughLine24`.'],
  ['What line 21 is NOT (spec §3 + §6a)',
    'NOT a direct-entry line — pure derived sum.\n' +
    'NOT a standalone credit — has no own IRS form.\n' +
    'NOT a payment line — payment lines are 25-33.\n' +
    'NOT a refundable credit line — refundable lines are 28-31.\n' +
    'NOT the final tax after credits — that is line 22.\n' +
    'NOT independently floored — the floor happens at line 22 only.\n' +
    'Includes ONLY lines 19 + 20 — does NOT include line 28/29/30/31 refundables, ' +
    'Schedule 2 Part II other taxes, withholding, estimated payments, or direct ' +
    'Schedule 3 Part II amounts.'],
  ['2025 Guardrails (spec §6)',
    '§6a Line 21 includes ONLY lines 19 + 20 — do not add anything else.\n' +
    '§6b Line 21 ≤ Line 18 expected after correct upstream credit limiting (soft constraint;\n' +
    '    not runtime-validated; if violated → upstream credit-limit bug, not line-21 bug).\n' +
    '§6c Line 21 itself is NOT floored — the floor applies at line 22 via max(0, line18 − line21).\n' +
    '\n' +
    '★ Pre-G1: nonrefundable credits (especially Form 8863 AOTC line 3) were NOT factored into\n' +
    '   Schedule 8812 CLW-A wA_4 → CTC over-stated → line 21 could exceed line 18. G1 FIX\n' +
    '   2026-04-18 in line 20 #1 (applyForm8863ToSchedule3 BEFORE computeSchedule8812) ensures\n' +
    '   spec §6b soft constraint holds in correctly-credited returns.'],
  ['Output target',
    'Primary: form1040.taxAndCredits.totalCredits (BigDecimal; line 21 output; null-when-zero)\n' +
    'PDF field: line21_total_credits_add_lines19_20 (page 2; AcroForm f2_13[0])\n' +
    'Frontend field: form.taxAndCredits?.totalCredits (form-tax-return-1040.component.ts line 326)'],
  ['Backend implementation',
    '**SINGLE WIRING SITE** — `computeLine20ThroughLine24` at TaxReturnComputeService.java:19571-19604; ' +
    'line 21 computation at lines 19587-19590 (3 lines): ' +
    '`BigDecimal line19 = safeAmount(tac.getChildTaxCredit());` (line 19588) → ' +
    '`BigDecimal line21 = roundMoney(line19.add(safeAmount(line20)));` (line 19589) → ' +
    '`tac.setTotalCredits(line21.compareTo(BigDecimal.ZERO) > 0 ? line21 : null);` (line 19590). ' +
    'Call site at prepare() ~line 1680 (after finalizeSchedule3Totals at ~line 1612 + ' +
    'computeSchedule8812 at ~line 1130). ' +
    'Coverage already exists at 20 #6 VERIFIED CORRECT breadcrumb sub-verification 2 ' +
    '(~line 19505-19512).'],
  ['IRS source',
    'IRS 2025 Form 1040 (page 2 line 21 "Add lines 19 and 20") + 2025 Instructions for Form 1040. ' +
    'Local cross-checks: docs/books/i1040gi_2025.txt + J.K. Lasser\'s Your Income Tax 2025. ' +
    'No 2025-specific changes to line 21 arithmetic — pure additive line with NO IRS-published worksheet.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'computeSchedule8812 wires line 19 (childTaxCredit)', 'Per 19 #5-#8 audit. CTC + ODC computed; CLW-A credit limit applied; written to tac.childTaxCredit. ★ MFS guard at call site form2555Spouse null-shadowed (19 #1).'],
  [2, 'All applyXxxToSchedule3 + finalizeSchedule3Totals run', 'Per 20 #5 + 20 #7 audits. 17 Schedule 3 Part I credit fields populated; Schedule 3 line 7 (G6 fix sum 6a..6z) + line 8 computed.'],
  [3, 'computeLine20ThroughLine24 wires line 20', 'Per 20 #6 sub-verification 1. `line20 = (schedule3.nc.totalNonrefundableCredits > 0) ? line8 : null`; tac.setOtherCreditsSchedule3(line20). Null-when-zero convention.'],
  [4, 'computeLine20ThroughLine24 wires line 21 (★ THIS LINE)', '`line19 = safeAmount(tac.getChildTaxCredit())` (null-as-zero) → `line21 = roundMoney(line19.add(safeAmount(line20)))` → `tac.setTotalCredits((line21 > 0) ? line21 : null)`. Per TaxReturnComputeService.java:19587-19590. ★ Null-when-zero (same convention as line 20).'],
  [5, 'computeLine20ThroughLine24 wires line 22 (downstream)', '`line22 = roundMoney(max(0, line18 − line21))`; tac.setTaxAfterCredits(line22). Per line 19593-19595. ★ Floor at 0 here (NOT at line 21).'],
  [6, 'computeLine20ThroughLine24 wires line 24 (downstream)', '`line24 = roundMoney(line22 + line23)`; tac.setTotalTax((line24 > 0) ? line24 : ZERO). Per line 19599-19600. ★★ FINAL TOTAL TAX. ZERO-when-zero convention (different from lines 20 + 21).'],
  [7, 'LOG.infof captures line 20-24 values', 'INFO-level diagnostic log at line 19602-19603 captures all 5 line values for production debugging.'],
  [],
  ['INVARIANTS / VALIDATIONS (spec §8)'],
  ['Invariant', 'Rationale'],
  ['Form1040.line21 >= 0', 'Both inputs are nonrefundable credits (≥ 0); sum ≥ 0; STRUCTURALLY guaranteed.'],
  ['Form1040.line21 = nz(Form1040.line19) + nz(Form1040.line20)', 'Per spec §2 + IRS Form 1040 line 21 label. STRUCTURALLY enforced by line 19587-19590 single-statement addition.'],
  ['Form1040.line21 <= Form1040.line18 (soft constraint; spec §6b)', 'Expected after correct upstream credit limiting. NOT runtime-validated. If violated, indicates upstream credit-limit bug (e.g., CLW-A pre-G1 fix scenario). Line 22 floor at 0 prevents negative tax even if invariant violated.'],
  ['Form1040.line21 stored as null when zero', 'Null-when-zero convention; same as line 20. PDF cell stays blank. Per line 19590: `(line21 > 0) ? line21 : null`.'],
  ['Floor at 0 happens at line 22, NOT at line 21', 'Per spec §6c. `line 22 = max(0, line18 − line21)` enforces the floor; line 21 itself is the raw sum. Note: structurally line 21 already ≥ 0 because both addends ≥ 0; but the no-floor-at-21 spec rule preserves the IRS form\'s intent.'],
  ['If line19 = 0 AND line20 = 0, then line21 = 0 (stored as null)', 'Per spec §8 practical note. Lock-in test `line21_isNullWhenNoCreditsPresent` (TaxReturnComputeServiceTest.java:24187).'],
  ['If either upstream line is present, line21 must equal their exact sum', 'Per spec §8 practical note. Lock-in test `line21_equalsLine19PlusLine20_ctcAndAotc` (TaxReturnComputeServiceTest.java:24139).'],
  ['If line 22 = 0 (credits fully absorb tax), line21 = line18', 'Per spec §8 practical note. Lock-in test `line21_line22FlooredAtZeroWhenCreditsAbsorbAllTax` (TaxReturnComputeServiceTest.java:24215).'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 38 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 21'],
  ['Line 21 takes EXACTLY TWO INPUTS — line 19 (childTaxCredit from Schedule 8812 line 14) + line 20 (otherCreditsSchedule3 from Schedule 3 line 8). ★ SMALLEST inputs table in workflow — only 2 fields. Both are already-computed TaxAndCredits fields populated by upstream methods. Computation complexity is UPSTREAM in line 19 (heavy compute orchestrator) + line 20 (Schedule 3 aggregator).'],
  [],
  ['#', 'Input', 'Form 1040 line', 'Java field path', 'Upstream method', 'XLS input/output form reference'],
  [1, 'childTaxCredit (CTC + ODC)', 'line 19', 'form1040.taxAndCredits.childTaxCredit', 'computeSchedule8812 → Schedule8812.line14', 'XLS/input_forms/form-personal-{ssn}-dependents-list.xlsx (dependent qualifiesChildTaxCredit + qualifiesCreditOtherDependents flags); XLS/output_forms/form-tax-return-schedule8812.xlsx'],
  [2, 'otherCreditsSchedule3', 'line 20', 'form1040.taxAndCredits.otherCreditsSchedule3', 'computeLine20ThroughLine24 reads schedule3.nonrefundableCredits.totalNonrefundableCredits (Schedule 3 line 8)', 'XLS/output_forms/form-tax-return-schedule3.xlsx (line 8 cell, computed)'],
  [],
  ['⚠️ NO DEDICATED USER INPUT FORM FOR LINE 21'],
  ['Line 21 has NO `form-line21-*.xlsx` in C:\\us-tax\\XLS\\input_forms\\. Both inputs are computed by upstream methods. Line 21 is NOT visible as a standalone form in the sidebar — it is shown on the `form-tax-return-1040` Tax Return view + Form 1040 PDF only. No user-supplied data feeds line 21 directly.'],
  [],
  ['⚠️ TRANSITIVE INHERITANCE OF MFS FIXES'],
  ['Both inputs inherit MFS protection TRANSITIVELY from upstream orchestrator audits:'],
  ['Input', 'Upstream MFS guard', 'Status'],
  ['childTaxCredit (line 19)', 'computeSchedule8812 — form2555Spouse parameter null-shadowed at call site per 19 #1 (17th orchestrator added to MFS cascade)', '✅ Inherits transitively'],
  ['otherCreditsSchedule3 (line 20)', 'computeLine20ThroughLine24 + finalizeSchedule3Totals — return-level aggregation; no per-spouse parameters; transitive inheritance from 17 individual apply methods per 20 #1', '✅ Inherits transitively'],
  ['→ NO MFS GUARD NEEDED at line 21 wiring site', '13th defensive-gap-NOT-needed Issue #1 in workflow (third orchestrator-method-based after 18 #1 + 20 #1)', '(See 21 #1)'],
  [],
  ['⚠️ NO MISSING INPUTS for current scope'],
  ['Both inputs are fully implemented + MFS-protected. The two prior gaps G1 + G2 (per knowledge §7) are BOTH FIXED 2026-04-19:'],
  ['Gap', 'Status', 'Resolution'],
  ['G1 — No direct Java unit test for getTotalCredits()', '✅ FIXED 2026-04-19', '3 unit tests added: line21_equalsLine19PlusLine20_ctcAndAotc (line 24139) + line21_isNullWhenNoCreditsPresent (line 24187) + line21_line22FlooredAtZeroWhenCreditsAbsorbAllTax (line 24215)'],
  ['G2 — line21-total-credits.spec.ts missing retries:1', '✅ FIXED 2026-04-19', 'test.describe.configure({ timeout: 180000, retries: 1 }) at line 12 of e2e/tests/line21-total-credits.spec.ts'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 40 }, { wch: 18 }, { wch: 50 }, { wch: 55 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 21'],
  ['Line 21 uses ZERO reference data — NO constants, thresholds, brackets, or phase-outs. Pure single-operator addition. ★ Same pattern as lines 14, 18, 20 — pure additive composite lines have no statutory anchors.'],
  [],
  ['Constant', 'Value', 'Statutory Basis', 'Backend identifier'],
  ['(None — pure additive line)', '—', 'Spec §2 + dependencies/21.md (no constants section)', '—'],
  [],
  ['★ THIS IS A PURE ADDITIVE LINE — same shape as line 14 / 18 / 20'],
  ['Contrast with neighboring lines:'],
  ['Line', '# Constants', 'Complexity'],
  ['line 18 (line 16 + line 17)', '0', 'Pure addition; inherits from lines 16 + 17 audits'],
  ['line 19 (CTC + ODC)', '~8 (CTC $2,200, ODC $500, ACTC $1,700, phase-out $400k/$200k, $50/$1k, ACTC floor $2,500, 15%, Part II-B $5,100)', 'Heavy compute orchestrator (Schedule 8812 Parts I + II-A + II-B + CLW-A)'],
  ['line 20 (Schedule 3 line 8)', '0', 'Pure pass-through; upstream complexity in 17 Schedule 3 Part I credit fields'],
  ['**line 21 (line 19 + line 20)**', '**0**', '**Pure single-operator addition** (no operator beyond `+` and null-as-zero coercion)'],
  ['line 22 (max(0, line 18 − line 21))', '0', 'Pure subtraction with floor (same method as line 21)'],
  ['line 24 (line 22 + line 23) — TOTAL TAX', '0', 'Pure addition (same method)'],
  [],
  ['Upstream credit forms DO use 2025 reference data — out of scope for line 21'],
  ['Per dependencies/21.md "Line 19 upstream dependencies" + "Line 20 upstream dependencies"; each individual credit form has its own statutory constants. Line 21 itself interprets no tax law — it is a pure mathematical accumulator.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 55 }, { wch: 60 }, { wch: 40 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 21 Persistence + Downstream Consumers'],
  ['Line 21 is one of FOUR fields wired by `computeLine20ThroughLine24` (lines 20 + 21 + 22 + 24). This sheet focuses on the line-21 specific output + its immediate downstream consumer (line 22), with line 24 cross-referenced as the ultimate downstream.'],
  [],
  ['Output target', 'Where wired', 'Effect', 'XLS output reference'],
  ['form1040.taxAndCredits.totalCredits', '`computeLine20ThroughLine24` line 19590', '★ CANONICAL line 21 output. = line19 + line20 if > 0 else null. BigDecimal whole-dollar HALF_UP via roundMoney. Null-when-zero convention.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 21 cell)'],
  [],
  ['SAME-METHOD CONSUMERS (★★) — all computed in same `computeLine20ThroughLine24` method'],
  ['form1040.taxAndCredits.taxAfterCredits (line 22)', '`computeLine20ThroughLine24` line 19594-19595', '★★ line 22 = max(0, line 18 − line 21). Floor at 0 enforced STRUCTURALLY. ★ NOT null-when-zero (always set; may be exactly 0 when credits ≥ tax-before-credits).', 'XLS/output_forms/form-tax-return-1040.xlsx (line 22 cell)'],
  ['form1040.taxAndCredits.totalTax (line 24)', '`computeLine20ThroughLine24` line 19599-19600', '★★ line 24 = line 22 + line 23 (Schedule 2 other taxes). ★★ TOTAL TAX FINAL — the return\'s most important output field. ★ ZERO-when-zero convention (NOT null) — PDF cell should never be blank. Line 21 affects line 24 via line 21 → line 22 → line 24 chain.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 24 cell)'],
  [],
  ['DOWNSTREAM CONSUMERS (in other methods)'],
  ['computeLine31ThroughLine38 (reads taxAfterCredits)', 'TaxReturnComputeService.java:~19617', 'Reads tac.getTaxAfterCredits() (line 22 from line 21 + line 18) for withholding chain + refund/owed calculations. Line 21 affects this transitively via line 22.', 'XLS/output_forms/form-tax-return-1040.xlsx (lines 31-38)'],
  ['Frontend PDF export (form-tax-return-1040.component.ts)', 'us-tax-ui line 326', '`values[\'line21_total_credits_add_lines19_20\'] = formatAmount(form.taxAndCredits?.totalCredits);` ★ Maps null → empty string (PDF cell blank when zero).', 'XLS/output_forms/form-tax-return-1040.xlsx (PDF view)'],
  [],
  ['PDF Output'],
  ['PDF Field', 'Field Code', 'Source'],
  ['Line 21 amount (page 2)', 'line21_total_credits_add_lines19_20', 'C:\\us-tax\\us-tax-ui\\public\\irs\\f1040_field_mapping_semantic.csv line 162'],
  ['AcroForm path', 'topmostSubform[0].Page2[0].f2_13[0]', 'IRS 2025 Form 1040 PDF (page 2; rect ~504,564 to 576,576)'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 60 }, { wch: 80 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 21'],
  ['Line 21 emits NO blocking flags directly. Each upstream credit method may emit its own flags. Line 21 silently passes through whatever the two upstream lines already contain.'],
  [],
  ['Flag code', 'Severity', 'Condition', 'Where emitted'],
  ['(None at line 21 site)', 'N/A', 'Line 21 has no validation. Upstream credit forms (Form 2441, Form 8863, Schedule 8812, etc.) each have their own flags emitted at their respective compute methods.', '—'],
  [],
  ['SPEC §8 STRUCTURAL INVARIANTS (not runtime-validated)'],
  ['Invariant', 'How enforced / Status'],
  ['line 21 ≥ 0', 'STRUCTURALLY enforced — both addends are nonrefundable credits (≥ 0); sum ≥ 0.'],
  ['line 21 = nz(line 19) + nz(line 20)', 'STRUCTURALLY enforced by line 19587-19590 single-statement addition with safeAmount null-as-zero coercion.'],
  ['line 21 ≤ line 18 (soft constraint per spec §6b)', '★ NOT runtime-validated — soft constraint. Pre-G1-fix (2026-04-18) scenario could violate this (CLW-A wA_4 read NULL educationCredits → CTC over-stated); G1 fix at applyForm8863ToSchedule3 order ensures invariant holds in correctly-computed returns. Line 22 floor at 0 prevents negative tax even if invariant violated.'],
  ['line 21 stored as null when zero', 'STRUCTURALLY enforced — `(line21 > 0) ? line21 : null` at line 19590.'],
  ['Floor at 0 happens at line 22 (NOT line 21) per spec §6c', 'STRUCTURALLY enforced by max(BigDecimal.ZERO) at line 19594; line 21 itself is the raw sum (always ≥ 0 because addends ≥ 0).'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 14 }, { wch: 100 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 21 is the total nonrefundable credits subtotal (Form 1040 line 21 = line 19 + line 20). 8th audit OUTSIDE 13ab pair; THIRD credits-section audit (after lines 19 + 20). ★ SMALLEST credits-section line — pure single-operator addition. ★ FIRST META-AUDIT in workflow — spec §0 verification note documents prior audit 2026-04-18 with G1 + G2 both fixed 2026-04-19; this audit re-verifies + integrates with current workflow. 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-14 — CROSS-REFERENCE — NO MFS DEFENSIVE GAP NEEDED at line 21 wiring site (13th defensive-gap-NOT-needed Issue #1 in workflow; THIRD orchestrator-method-based audit with transitive inheritance after 18 #1 + 20 #1)',
    '**Per-input MFS-leakage analysis**: line 21 is inline-computed at single site `TaxReturnComputeService.java:19587-19590` inside `computeLine20ThroughLine24(form1040, schedule3)` — neither parameter is a per-spouse input. Inside the 3-line block: (a) `line19 = safeAmount(tac.getChildTaxCredit())` — reads tac.childTaxCredit which is set by computeSchedule8812; **★ Inherits 19 #1 MFS guard transitively** — form2555Spouse null-shadowed at call site (`isMfsReturn ? null : form2555Spouse`); childTaxCredit is MFS-clean by the time line 21 reads it. (b) `safeAmount(line20)` — reads line20 local computed at line 19578-19583 from `schedule3.nonrefundableCredits.totalNonrefundableCredits` (Schedule 3 line 8); **★ Inherits 20 #1 transitive inheritance** — all 17 Schedule 3 Part I credit fields are MFS-clean from their respective apply methods. (c) `roundMoney(line19.add(safeAmount(line20)))` — pure arithmetic; cannot introduce MFS leakage. (d) `tac.setTotalCredits((line21 > 0) ? line21 : null)` — pure write; null-when-zero coercion. **All upstream-set fields are already MFS-clean** by the time computeLine20ThroughLine24 reads them; pure additive composite cannot introduce new MFS leakage. **MFS-guard cascade UNCHANGED at 20 orchestrators** (per 19 #1 NEW MAX): 1c-1i (7) + 7 income-territory orchestrators + buildStandardDeductionIndicators + computeLine13a + computeSchedule1A + computeLine16 + computeLine17 + computeSchedule8812. **★ Notable**: 21 #1 is the THIRD orchestrator-method-based audit in the workflow with transitive inheritance (after 18 #1 + 20 #1) — but where 19 #1 ADDED to cascade (computeSchedule8812 has form2555Spouse parameter), 21 #1 does NOT add to cascade (computeLine20ThroughLine24 has no per-spouse parameter; pure transitive inheritance). The pattern rule established at 18 #1 + 20 #1 (orchestrator without per-spouse parameters → transitive inheritance suffices) is now confirmed across THREE chains: tax-territory (line 18) + credits-territory (lines 20 + 21). **13th defensive-gap-NOT-needed Issue #1 in workflow** (after 12 prior: 9 + 11a/b + 12b/c/d/e + 14 + 15 + 18 + 20). Backend tests: **765/765 unchanged** (no code change).',
    'TaxReturnComputeService.java:19587-19590 (line 21 wiring; 3 lines inside computeLine20ThroughLine24); 19571 (method signature — no per-spouse params); 1680 (call site)',
    'CLOSED — defensive-gap-NOT-needed. **13th in workflow** (third orchestrator-method-based with transitive inheritance after 18 #1 + 20 #1). MFS-guard cascade UNCHANGED at 20 orchestrators. Pure cross-reference closure. 765/765 unchanged.'],

  [2, 'RESOLVED 2026-05-14 — DOCUMENTATION HYGIENE — Knowledge file Legacy A rename (knowledge_line21.md → line-21-total-nonrefundable-credits.md; 14th Legacy A migration; convergence 26→27; ★ second consecutive Legacy A migration with ZERO history.md hits after 20 #2)',
    '**Closure applied**: (1) plain `mv` of `C:\\us-tax\\knowledge\\knowledge_line21.md` → `C:\\us-tax\\knowledge\\line-21-total-nonrefundable-credits.md` (folder not under git). (2) Repo-wide grep for `knowledge_line21` produced 1 file hit / 8 line hits in `generate-21.js` only (classified per established 15 #2 / 16 #2 / 17 #2 / 18 #2 / 19 #2 / 20 #2 precedent): ACTIVE-UPDATE = 3 hits at lines 15 (header file path citation), 364 (Issue #4 META-AUDIT details — current cross-reference to §7), 365 (Issue #4 Where Found — current cross-reference to §7) — all updated to new path with rename annotation `(renamed from knowledge_line21.md via 21 #2 2026-05-14)`. LEAVE-UNTOUCHED = 5 hits at lines 16 (header rename description), 102 (Issue #2 audit angle), 353 (Issue #2 row title — this row), 354 (Issue #2 row details — being rewritten by this closure), 355 (Issue #2 Where Found — both old + new names) — all rename-description rows; both old + new names intentionally appear as part of describing the rename. (3) **★ ZERO HITS IN history.md** — SECOND consecutive Legacy A migration in workflow with no historical-entry references (after 20 #2; line 21 audit not yet logged in history.md; will be logged after Issue #10 closure). (4) `lines/21.md` + `dependencies/21.md` scan: NO citation of knowledge file path → no update needed. (5) ZERO hits in TaxReturnComputeService.java. **14th Legacy A migration in workflow** (after 7a/8/9/10/11a/12a/13a/15/16/17/18/19/20 #2). **Knowledge-file naming convergence advances 26 → 27 lines** — deep in convergence territory; possibly 1-2 migrations from complete naming convergence. Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\knowledge\\line-21-total-nonrefundable-credits.md (renamed); C:\\us-tax\\XLS\\_tools\\generate-21.js 3 ACTIVE-UPDATE hits at lines 15/364/365 + 5 LEAVE-UNTOUCHED rename-description hits at lines 16/102/353/354/355; ZERO hits in history.md (second consecutive migration with no historical references after 20 #2)',
    'CLOSED — file renamed + 3 active citations updated in generate-21.js; 5 hits left untouched per precedent (rename-description rows). Pure documentation closure. 14th Legacy A migration. Convergence 26 → 27 lines. ★ Second consecutive Legacy A migration with zero history.md hits (after 20 #2).'],

  [3, 'RESOLVED 2026-05-14 — SPEC ENHANCEMENT — Verification log section §12 created in lines/21.md (single-row pattern; ★ 11th CONSECUTIVE single-row log in workflow)',
    '**Closure applied**: appended `## 12) Verification log` section to `lines/21.md` after section §11 (Scope Note; line 240). 5-column markdown table; **row 1 in IN-PROGRESS state** capturing #1 (13th defensive-gap-NOT-needed; THIRD orchestrator-method-based with transitive inheritance after 18 #1 + 20 #1) + #2 (Legacy A rename — 14th migration; 26 → 27 convergence; ★ 2nd consecutive Legacy A migration with ZERO history.md hits) + #3 (this section creation). Row 1 will be finalized to **"COMPLETE — 10/10 closed"** at Issue #10 (boundary milestone) with all 10 closures enumerated. **Single-row pattern** = SMALLEST log shape; **★ 11th CONSECUTIVE single-row log in workflow** (matches lines 8, 9, 10, 14, 15, 16, 17, 18, 19, 20). Append-then-finalize pattern (used at 14 #3, 15 #3, 16 #3, 17 #3, 18 #3, 19 #3, 20 #3) lets the row evolve as the walkthrough progresses; final state captured atomically at Issue #10. Pure spec enhancement — no functional change. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\lines\\21.md section §12 appended after §11 (Scope Note; line 240)',
    'CLOSED — §12 Verification log section created with single-row IN-PROGRESS table. Single-line audit shape (smallest log; ★ 11th consecutive single-row log in workflow).'],

  [4, 'RESOLVED 2026-05-14 — ★ META-AUDIT CONSISTENCY CHECK — spec §0 verification note (2026-04-18) already documents prior audit + G1 + G2 fixed 2026-04-19; ★ FIRST META-AUDIT in workflow',
    '**The situation**: lines/21.md §0 carries a "Verification note (2026-04-18)" header explicitly stating: *"This spec was audited against the backend implementation in `TaxReturnComputeService.java` (`computeLine20ThroughLine24()`, ~line 15023), the `TaxAndCredits.java` model, the frontend `form-tax-return-1040.component.ts` display, and the E2E tests in `line21-total-credits.spec.ts`. All formulas, field names, and guardrails are confirmed correct for 2025. No changes to this spec were required."* AND knowledge/line-21-total-nonrefundable-credits.md §7 (renamed from knowledge_line21.md via 21 #2 2026-05-14) documents both G1 + G2 as ★ FIXED 2026-04-19. **This audit re-verifies all those facts** to confirm continued consistency (META-AUDIT). **Consistency findings**: (a) ✅ Method exists at expected location (TaxReturnComputeService.java:19571 — slight drift from prior "~line 15023" which would now be approximate; line numbers shift as code grows — not a doc-drift fix since the spec uses approximate "~line" language). (b) ✅ TaxAndCredits.java field `totalCredits` exists at line 24. (c) ✅ Frontend mapping at form-tax-return-1040.component.ts line 326 (`values[\'line21_total_credits_add_lines19_20\']`). (d) ✅ E2E spec exists at e2e/tests/line21-total-credits.spec.ts with `retries: 1` (G2 fix). (e) ✅ 3 Java unit tests exist at TaxReturnComputeServiceTest.java lines 24139 + 24187 + 24215 (G1 fix). (f) ✅ Formula `line21 = nz(line19) + nz(line20)` matches spec §2 + code line 19587-19590. (g) ✅ Null-when-zero convention matches spec §8 + code line 19590. (h) ✅ Spec §6c no-floor-at-21 matches code (max(0, ...) at line 19594 = floor at 22, not 21). **No doc-drift fix needed** — spec + knowledge + code all consistent. **★ FIRST META-AUDIT in workflow** — new pattern category: re-verification of a previously-audited line with workflow integration breadcrumbs. Establishes template for future meta-audits as workflow accumulates audit cycles. **Why this audit still has value despite prior audit**: (a) integrates with current workflow (20 orchestrators MFS cascade + 8 doc-drift fixes + 17 Path A applications + 8 anti-duplication + 13 Legacy A migrations); (b) adds Verification log section §12 (post-2026-04-18 enhancement); (c) renames knowledge file per Legacy A convention (post-2026-04-18 enhancement); (d) adds VERIFIED CORRECT cross-references via 20 #6 inheritance (post-2026-04-18 enhancement); (e) confirms continued consistency 1 month after prior audit. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\lines\\21.md §0 (Verification note 2026-04-18); C:\\us-tax\\knowledge\\line-21-total-nonrefundable-credits.md §7 (renamed from knowledge_line21.md via 21 #2 2026-05-14; G1 + G2 fixed 2026-04-19); TaxReturnComputeService.java:19571-19604 + 19587-19590; TaxReturnComputeServiceTest.java:24139/24187/24215; e2e/tests/line21-total-credits.spec.ts:12',
    'CLOSED — META-AUDIT consistency check complete. **★ FIRST META-AUDIT in workflow** — establishes pattern for re-verification audits of previously-audited lines with workflow integration breadcrumbs. All 8 consistency checks pass. No doc-drift fix needed. Pure cross-reference closure.'],

  [5, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — line 21 single-site wiring at ~line 19587-19590; ★ 9th ANTI-DUPLICATION application',
    '**Closure intent**: pure cross-reference closure — **NO new breadcrumb** at line 21 wiring site (anti-duplication policy applied; **9th anti-duplication application in workflow** after 12e #8 + 12e #9 + 13a #9 + 13b #9 + 14 #5 + 15 #7 + 18 #7 + 20 #8). **Why no new breadcrumb**: line 21 is already explicitly covered by the **20 #6 VERIFIED CORRECT breadcrumb sub-verification 2** at TaxReturnComputeService.java:19505-19512, which documents: *"★ 2. LINE 21 = line 19 (CTC + ODC) + line 20 (Schedule 3 line 8) per spec §2 + §4. Code at ~line 19452-19454: line19 = safeAmount(tac.getChildTaxCredit()); line21 = roundMoney(line19.add(safeAmount(line20))); tac.setTotalCredits((line21 > 0) ? line21 : null). ★ safeAmount + null-when-zero conventions. ★ Inherits 19 #1 MFS guard transitively — childTaxCredit (line 19) is MFS-clean (form2555Spouse null-shadowed at computeSchedule8812 call site)."* **3-source coverage confirmed**: (1) spec §2 + §6 (formula + guardrails); (2) dependencies/21.md (Formula + Inputs + Outputs + Compute Order); (3) **20 #6 sub-verification 2** (verified correct breadcrumb in code) + 19 #1 + 20 #1 inheritance breadcrumbs. Adding a 4th breadcrumb dedicated to line 21 would be massive duplication. **9th anti-duplication application in workflow**. Pure cross-reference closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:19587-19590 (line 21 wiring; covered by 20 #6 sub-verification 2 at line 19505-19512)',
    'CLOSED — verified correct via 20 #6 sub-verification 2 + spec §2 + dependencies/21.md (3-source coverage). **9th anti-duplication application in workflow**. NO new breadcrumb. Pure cross-reference closure.'],

  [6, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — inheritance chain (line 19 from 19 #1 MFS; line 20 from 20 #1 transitive; line 21 = pure additive composite)',
    '**Closure intent**: pure cross-reference closure — verifies the inheritance chain that makes line 21 MFS-clean by construction. **Chain verification**: **(1) Line 19 inheritance**: tac.childTaxCredit is set by computeSchedule8812 at TaxReturnComputeService.java:~22461 (computeSchedule8812 method); call site at prepare() ~line 1130 has the form2555Spouse null-shadow pattern (per 19 #1 single-input multi-expression leak fix — TWO internal leaks in Schedule 8812 closed by single null-shadow). Line 19 is therefore MFS-clean by the time line 21 reads it via tac.getChildTaxCredit() at line 19588. **(2) Line 20 inheritance**: line20 local at line 19578-19583 reads schedule3.nonrefundableCredits.totalNonrefundableCredits (Schedule 3 line 8). Schedule 3 line 8 is computed by finalizeSchedule3Totals at line 18800 which reads 7 individual credit fields (line1 FTC + line2 childcare + line3 education + line4 saver\'s + line5a clean energy + line5b energy efficiency + line7 subtotal). Each of those 7 fields is populated by its respective applyXxxToSchedule3 method (per 20 #7 chain breadcrumb), and each apply method handles its own MFS state. Per 20 #1: computeLine20ThroughLine24 has no per-spouse parameters; pure transitive inheritance. Line 20 is therefore MFS-clean by the time line 21 reads it. **(3) Line 21 additive composite**: line 21 = roundMoney(safeAmount(line19).add(safeAmount(line20))). Both addends MFS-clean; arithmetic addition cannot introduce MFS leakage; result is MFS-clean. **No new breadcrumb needed** — chain is documented across 19 #1, 20 #1, 20 #6, 20 #7 breadcrumbs already in code; this issue is a verified-correct cross-reference. **Coverage cross-references**: 19 #1 (computeSchedule8812 MFS guard) + 20 #1 (computeLine20ThroughLine24 + finalizeSchedule3Totals transitive inheritance) + 20 #6 sub-verification 2 (line 21 MFS-clean inheritance note) + 20 #7 (17-credit Part I input chain). Pure cross-reference closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:~22461 (computeSchedule8812; line 19 source; covered by 19 #1) + 19571-19604 (computeLine20ThroughLine24; lines 20 + 21 + 22 + 24; covered by 20 #1 + 20 #6) + 18800-18855 (finalizeSchedule3Totals; line 20 source; covered by 20 #1 + 20 #5)',
    'CLOSED — verified correct via inheritance chain. Line 19 MFS-clean (19 #1); line 20 MFS-clean (20 #1 transitive); line 21 = pure additive composite of MFS-clean addends → MFS-clean by construction. Pure cross-reference closure.'],

  [7, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — null-when-zero convention + safeAmount handling + spec §6b informal invariant (line21 ≤ line18 expected post upstream credit-limiting)',
    '**Closure intent**: pure verification closure — confirms three line-21-specific conventions documented by spec §8 + code line 19587-19590. **Convention 1 — Null-when-zero**: `tac.setTotalCredits((line21 > 0) ? line21 : null)` at line 19590. When both addends are null/zero, line 21 is set to null (not 0). PDF cell stays blank. Same convention as line 20; different from line 24 (ZERO-when-zero). **Convention 2 — safeAmount null-as-zero coercion**: `safeAmount(tac.getChildTaxCredit())` + `safeAmount(line20)`. safeAmount returns BigDecimal.ZERO when input is null. Allows pure arithmetic at line 19589 without null checks. **Convention 3 — spec §6b informal invariant**: spec §6b states *"Form1040.line21 <= Form1040.line18 expected after correct upstream credit limiting. If the engine ever produces line21 > line18, treat that as an upstream-credit bug or ordering problem, not a valid tax result."* This is a SOFT CONSTRAINT — NOT runtime-validated; not asserted; not flagged. The line 22 floor at 0 (max(BigDecimal.ZERO) at line 19594) prevents the invariant violation from producing negative tax. **Pre-G1-fix scenario** (2026-04-18) could violate this: CLW-A wA_4 read NULL educationCredits → CTC over-stated; G1 fix at applyForm8863ToSchedule3 order ensures invariant holds. **Lock-in tests confirm convention 1 + IRS arithmetic**: (a) line21_isNullWhenNoCreditsPresent (TaxReturnComputeServiceTest.java:24187) — confirms null-when-zero; (b) line21_equalsLine19PlusLine20_ctcAndAotc (line 24139) — confirms exact-sum convention; (c) line21_line22FlooredAtZeroWhenCreditsAbsorbAllTax (line 24215) — confirms line 22 floor at 0 when line 21 = line 18 (edge case where soft invariant holds with equality). **No new breadcrumb at line 19590** — Convention 1 + 2 already self-documenting in the 3-line code block + spec §8 + knowledge §3; spec §6b soft constraint is intentionally not coded (per spec language "expected", not "required"). **Coverage cross-references**: spec §6b + §6c + §8 + knowledge §3 + lock-in tests at TaxReturnComputeServiceTest.java:24139/24187/24215. Pure verification closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:19587-19590 (3-line code block; conventions self-documenting); spec §6b + §6c + §8 (informal invariants + null-when-zero); TaxReturnComputeServiceTest.java:24139/24187/24215 (3 lock-in tests)',
    'CLOSED — verified correct. 3 conventions confirmed: null-when-zero (line 19590) + safeAmount null-as-zero coercion (line 19588-19589) + spec §6b soft constraint (informal; not runtime-validated; line 22 floor at 0 prevents negative tax). 3 lock-in tests confirm correctness. No new breadcrumb.'],

  [8, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — downstream line 22 wiring at ~line 19593-19595; ★ 10th ANTI-DUPLICATION application (milestone — double-digit territory)',
    '**Closure intent**: pure cross-reference closure — **NO new breadcrumb** at line 22 wiring site (anti-duplication policy applied; **10th anti-duplication application in workflow** after 12e #8 + 12e #9 + 13a #9 + 13b #9 + 14 #5 + 15 #7 + 18 #7 + 20 #8 + 21 #5). **Why no new breadcrumb**: line 22 is already explicitly covered by the **20 #6 VERIFIED CORRECT breadcrumb sub-verification 3** at TaxReturnComputeService.java:19514-19524, which documents: *"★ 3. LINE 22 = max(0, line 18 − line 21) — tax after nonrefundable credits per spec §4 + IRS Form 1040 line 22 instructions. Code at ~line 19457-19459: line18 = safeAmount(tac.getTotalTaxBeforeCredits()); line22 = roundMoney(line18.subtract(line21).max(BigDecimal.ZERO)); tac.setTaxAfterCredits(line22). ★ Floor at 0 (max(ZERO)) — credits cannot reduce tax below zero per IRS instructions. STRUCTURALLY enforced. ★ NOT null-when-zero — line 22 always set (may be exactly 0 when credits >= tax-before-credits). ★ Inherits 18 #5 + 18 #6 MFS protection — totalTaxBeforeCredits set by computeLine18 with transitive MFS protection via 17 #1 + 16 #1."* **Why include line 22 in line 21 audit**: line 21 is the IMMEDIATE INPUT to line 22; spec §5 + §6c document this relationship; verifying the downstream consumer confirms line 21\'s contract is honored. **3-source coverage confirmed for line 22**: (1) spec/21.md §5 (downstream effect) + §6c (floor location); (2) dependencies/21.md (Outputs row 2); (3) 20 #6 sub-verification 3. **Lock-in test**: line21_line22FlooredAtZeroWhenCreditsAbsorbAllTax at TaxReturnComputeServiceTest.java:24215 confirms line 22 floor at 0 when line 21 absorbs all of line 18. **10th anti-duplication application in workflow**. Pure cross-reference closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:19593-19595 (line 22 wiring; covered by 20 #6 sub-verification 3 at line 19514-19524) + spec §5 + §6c + dependencies/21.md Outputs row 2',
    'CLOSED — verified correct via 20 #6 sub-verification 3 + spec §5 + §6c + dependencies/21.md (3-source coverage). **★ 10th anti-duplication application in workflow — milestone (double-digit territory)**. NO new breadcrumb. Lock-in test `line21_line22FlooredAtZeroWhenCreditsAbsorbAllTax` confirms floor at 0.'],

  [9, 'RESOLVED 2026-05-14 — ⚠️ BUNDLED OBSERVATIONS — 2 deferred-scope observations (18th Path A application; ★ 22 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS; ★ 5th CONSECUTIVE AUDIT WITH ZERO NEW GAPS)',
    '**Closure intent**: pure xlsx-flip observation bundle — **NO code change**; **NO outstanding.md entry** (anti-fragmentation policy). TWO observations bundled — both share same "documented + deferred / cosmetic; not blocking real returns in current scope" rationale. **(a) Missing `diagrams/21.drawio`** — `flowcharts/21.drawio` exists but `diagrams/21.drawio` does NOT. Per repo convention each line should have BOTH a flowchart (routing logic) AND a data-flow diagram (input-to-output traceability). Same pattern as 20 #9 (b) — line 20 also missing diagrams/20.drawio. For line 21, the data-flow is trivial (2 inputs → 1 sum → null-when-zero coercion → line 22 consumer); the 20 #6 sub-verification 2 breadcrumb already provides textual equivalent. **Recommended action**: create `diagrams/21.drawio` (3-node graph: line19 + line20 → line21 → line22). Cosmetic gap; deferred. **(b) Lines 22 + 24 audits upcoming** — both inline in computeLine20ThroughLine24 (lines 22 at ~19593-19595; 24 at ~19599-19600); coverage already provided by 20 #6 sub-verifications 3 + 4 + line-22 sub-verification at 21 #8 + line-24 ZERO-when-zero documented in 20 #6 sub-verification 4. Lines 22 + 24 audits will likely be even smaller than 21 (third + fourth META-AUDITS in workflow); both anti-duplication-heavy. Suggests an EFFICIENT BATCHING OPPORTUNITY — could potentially merge lines 22 + 23 + 24 into a single combined audit (or lines 22 + 24 leaving line 23 separate as it depends on Schedule 2). Decision deferred to line 22 audit start. **★ Anti-fragmentation policy applied** — observations only; no fixes today; no outstanding.md entry. **18th PATH A APPLICATION** (after 17 prior in workflow). **★ Streak extends 21 → 22 consecutive zero-outstanding walkthroughs** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18/19/20/21). **★ ZERO NEW GAPS surfaced** — FIFTH consecutive audit (line 17 was last with new gaps; 18 + 19 + 20 + 21 all zero); line 21 had 2 prior gaps G1 + G2 both ★ FIXED 2026-04-19 per knowledge §7; this audit found only deferred-scope confirmations + 1 cosmetic (missing diagrams). Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'diagrams/21.drawio (missing — cosmetic; same as 20 #9 (b) for line 20); future line 22 + 24 audits (anti-duplication-heavy; batching candidate)',
    'CLOSED — pure observation bundle. **18th Path A application**; ZERO NEW GAPS surfaced (5th consecutive); **★ 22 consecutive zero-outstanding walkthroughs** (extends streak by 1 from 21). 2 observations: missing diagrams/21.drawio + lines 22+24 audits upcoming with batching opportunity. No outstanding.md entry per anti-fragmentation policy.'],

  [10, 'RESOLVED 2026-05-14 — BOUNDARY MILESTONE — Line 21 walkthrough complete at 10/10; THIRD CREDITS-SECTION AUDIT; ★ SMALLEST CREDITS-SECTION LINE (pure single-operator addition); ★ FIRST META-AUDIT in workflow; ★ 22 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS; ★ 5th CONSECUTIVE AUDIT WITH ZERO NEW GAPS; ★ 11th CONSECUTIVE SINGLE-ROW LOG; ★ 10 ANTI-DUPLICATION APPLICATIONS (double-digit milestone)',
    'Pure xlsx-flip + Verification log finalization — **CLOSES the 21 walkthrough at 10/10**. TWO file touches: (a) this row flipped to RESOLVED; (b) lines/21.md §12 Verification log row finalized IN-PROGRESS → **COMPLETE — 10/10 closed**. **Eight themes**: (1) **Structural positioning** — 8th audit OUTSIDE 13ab pair; THIRD credits-section audit (after lines 19 + 20); ★ SMALLEST credits-section line — pure single-operator addition (line 21 = nz(line19) + nz(line20)); no decision tree; no reference data; no orchestrator; no validation logic. (2) **★ MFS-guard cascade UNCHANGED at 20 orchestrators** — 13th defensive-gap-NOT-needed Issue #1 in workflow (computeLine20ThroughLine24 inline-computed; no per-spouse parameters; pure transitive inheritance from line 19 + line 20). (3) **★ FIRST META-AUDIT in workflow** (Issue #4) — spec §0 verification note (2026-04-18) already documents prior audit; G1 + G2 both ★ FIXED 2026-04-19; this audit re-verifies all 8 consistency checks pass + adds workflow integration breadcrumbs (Verification log §12 + Legacy A rename + 20 #6 inheritance). Establishes META-AUDIT pattern category for future re-verifications. (4) **Knowledge convergence advances 26 → 27 lines** (Issue #2: 14th Legacy A migration). (5) **Anti-duplication pattern matures** — TWO applications this audit (Issue #5 line 21 wiring + Issue #8 line 22 downstream); **★ 10 ANTI-DUPLICATION applications total**. (6) **Anti-fragmentation continues — 18th Path A application** (Issue #9: 2-observation bundle — missing diagrams/21.drawio + lines 22+24 audits upcoming with batching opportunity). (7) **★ ZERO NEW gaps surfaced** — fifth consecutive audit (17 + 18 + 19 + 20 + 21) with no new gaps; line 21 had 2 prior gaps G1 + G2 both fixed 2026-04-19 per knowledge §7. (8) **Cumulative state through line 21**: **47 lines audited** (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + 11b + 12a + 12b + 12c + 12d + 12e + 13a + 13b + 14 + 15 + 16 + 17 + 18 + 19 + 20 + **21**); **467 audit issues closed total** (457 + 10); backend **765/765 pass** (UNCHANGED — pure documentation closure; no new tests this audit; 3 unit tests already added 2026-04-19 per G1 fix); MFS cascade = **20 orchestrators** (unchanged — line 21 inline-computed; defensive-gap-NOT-needed); knowledge convergence = **27 lines (+1)**; dependencies files = 43 (unchanged); **8 documentation drift fixes** across workflow (unchanged — no drift this audit); 18 Path A applications (+1 from 21 #9); **★ 10 anti-duplication applications** (+2 from 21 #5 + 21 #8); 2 SEEDED → VERIFIED CORRECT upgrades (unchanged); 2 terminal seeds at orchestrators (unchanged); 0 NEW gaps surfaced (5th consecutive); **★ FIRST META-AUDIT** (21 #4). **★ 22 CONSECUTIVE WALKTHROUGHS WITH ZERO NEW OUTSTANDING.MD ENTRIES** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18/19/20/**21**). **Verification logs**: 2ab (4) + 3abc (3) + 4abc (3) + 5abc (3) + 6abcd (4) + 7ab (2) + 8 (1) + 9 (1) + 10 (1) + 11ab (2) + 12abcde (5 — LARGEST) + 13ab (2) + 14 (1) + 15 (1) + 16 (1) + 17 (1) + 18 (1) + 19 (1) + 20 (1) + **21 (1 — single-line shape; ★ 11th CONSECUTIVE single-row log)**. **Looking ahead — line 22 (Tax after credits = max(0, line 18 − line 21))**: 9th audit OUTSIDE 13ab pair; FOURTH credits-section audit; SECOND META-AUDIT in workflow (line 22 was also previously verified 2026-04-18 per likely spec §0 header). Line 22 is already computed in `computeLine20ThroughLine24` (combined method); inline-computed at single site (~line 19593-19595); covered by 20 #6 sub-verification 3 already. ★ Notable: lines 20 + 21 + 22 + 24 all in same method — audit-wise lines 22 (and 24) will likely close as similarly small META-AUDITS; consider BATCHING opportunity (line 22 + 24 combined audit, leaving line 23 separate as Schedule 2 dep). Decision deferred to line 22 start.',
    'XLS/computations/21.xlsx audit-trail (this row); lines/21.md §12 Verification log row FINALIZED to COMPLETE — 10/10 closed; knowledge file renamed via 21 #2 (Legacy A); workflow integration breadcrumbs via 21 #4 (META-AUDIT)',
    'CLOSED — 10/10. **47 lines audited; 467 issues; 765/765 backend (UNCHANGED — no new tests this audit); 20 orchestrators (UNCHANGED); 27-line knowledge convergence; ★ 22 consecutive zero-outstanding walkthroughs; ★ 5th consecutive ZERO NEW GAPS; 8 documentation drift fixes (UNCHANGED — no drift this audit); 18 Path A applications; ★ 10 anti-duplication applications (double-digit milestone); ★ 11th consecutive single-row log; ★ FIRST META-AUDIT in workflow**. THIRD credits-section audit; SMALLEST credits-section line (pure single-operator addition). Next: line 22 (tax after credits; likely 14th defensive-gap-NOT-needed; SECOND META-AUDIT; possible batching with line 24).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 120 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 21 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.taxAndCredits.totalCredits', 'Form 1040 page 2, line 21 (PDF key line21_total_credits_add_lines19_20; AcroForm f2_13[0])', 'XLS/output_forms/form-tax-return-1040.xlsx', '★ CANONICAL line 21 output. = nz(line19) + nz(line20) if > 0; else null. BigDecimal whole-dollar HALF_UP via roundMoney. Null-when-zero convention.'],
  [],
  ['SAME-METHOD DOWNSTREAM (★★) — all computed in `computeLine20ThroughLine24`'],
  ['form1040.taxAndCredits.taxAfterCredits', 'Form 1040 page 2, line 22 (PDF key line22_tax_less_credits; AcroForm f2_14[0])', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ line 22 = max(0, line 18 − line 21). Floor at 0. ★ Direct downstream of line 21. ★ NOT null-when-zero (always set; may be exactly 0).'],
  ['form1040.taxAndCredits.totalTax', 'Form 1040 page 2, line 24 (PDF key line24_total_tax)', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ TOTAL TAX FINAL = line 22 + line 23 (Schedule 2 line 21 otherTaxes). The return\'s most important output field. ★ ZERO-when-zero convention (different from line 21).'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Reads tac.getTaxAfterCredits()', 'computeLine31ThroughLine38 at ~line 19617', 'TaxReturnComputeService.java', 'Withholding chain + refund/owed calculations read taxAfterCredits (line 22 from line 21 + line 18). Line 21 affects this transitively.'],
  ['Reads tac.getTotalCredits() for PDF export', 'form-tax-return-1040.component.ts line 326', 'us-tax-ui', '`values[\'line21_total_credits_add_lines19_20\'] = formatAmount(form.taxAndCredits?.totalCredits);` Null → empty string (PDF cell blank).'],
  [],
  ['CONDITIONAL ATTACHMENTS'],
  ['(None directly triggered by line 21)', '—', '—', 'Line 21 itself triggers no attachments. Schedule 8812 (line 19 input) + Schedule 3 (line 20 input) attached based on their own upstream conditions.'],
  [],
  ['NOT IN OUTPUT (deliberate exclusions per spec §6a)'],
  ['Refundable credits (lines 28, 29, 30, 31)', '—', '—', 'Spec §6a explicitly excludes refundable credits from line 21. Those land on lines 25-33 (payments territory).'],
  ['Schedule 2 Part II other taxes', '—', '—', 'Other taxes land on line 23, not line 21.'],
  ['Withholding + estimated payments', '—', '—', 'Land on lines 25-26 (payments territory).'],
  ['Direct Schedule 3 Part II amounts', '—', '—', 'Part II refundable items land on line 31 via Schedule 3 line 15, not line 21.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 60 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
