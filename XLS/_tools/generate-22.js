// ============================================================================
//  Generates: C:\us-tax\XLS\computations\22.xlsx
//
//  Source-of-truth references:
//    - lines/22.md (2025-tax-year spec; 249 lines; defines line 22 = max(0,
//      line18 − line21); spec §6a explicit zero-floor mandatory ("If zero or
//      less, enter -0-"); §6b floor belongs on line 22 NOT line 21; §6c excludes
//      line 23 other taxes; §6d excludes refundable credits + payments;
//      §6e margin note for line 12a/b/c/d boxes does NOT change line 22
//      arithmetic. ⚠️ NO §0 verification note — META-AUDIT trail lives in
//      dependencies/22.md §0 + knowledge §0 instead.)
//    - dependencies/22.md (108 lines; "Audited 2026-04-19" header; 2-row Direct
//      Inputs table (line 18 + line 21) + Downstream Consumers (line 24 +
//      Form 2210) + PDF Field Mapping + Compute Order + Guardrails section +
//      Unit Test Coverage + E2E Test Coverage with G1 note.
//      ⚠️ DOC DRIFT — line 108 "Note: line22-tax-after-credits.spec.ts uses
//      timeout: 180000 but is missing retries: 1 (gap G1)." — STALE.
//      Verified 2026-05-15: line 12 of spec ALREADY HAS `retries: 1`.)
//    - knowledge/line-22-tax-after-credits.md (renamed from knowledge_line22.md
//      via 22 #2 2026-05-15; 213 lines; 15th Legacy A
//      migration; convergence 27 → 28 lines.
//      Full audit covering line identity + core formula + backend implementation
//      + frontend + unit test inventory + e2e test inventory + identified gaps
//      G1 (LOW — STALE; already fixed) + G2 (INFORMATIONAL — no named line22 test).
//      ⚠️ DOC DRIFT — §7 G1 says "Current state: Line 12 of the spec reads:
//      `test.describe.configure({ timeout: 180000 });`" — STALE; actual line 12
//      reads `test.describe.configure({ timeout: 180000, retries: 1 });`.)
//    - flowcharts/22.drawio (existing); diagrams/22.drawio MISSING (cosmetic).
//    - TaxReturnComputeService.java:
//        line 1680 — call site for computeLine20ThroughLine24
//        line 19571-19604 — computeLine20ThroughLine24 (single combined method
//          for Form 1040 lines 20, 21, 22, 24)
//        line 19592-19595 — line 22 computation: `line18 = safeAmount(...)`;
//          `line22 = roundMoney(line18.subtract(line21).max(BigDecimal.ZERO))`;
//          tac.setTaxAfterCredits(line22). ALWAYS-SET (not null-when-zero).
//        line 19486-19558 — 20 #6 VERIFIED CORRECT breadcrumb (already covers
//          line 22 as sub-verification 3 — floor + always-set + 18 #5/18 #6
//          inheritance)
//    - line22-tax-after-credits.spec.ts (155 lines; 3 scenarios; ★ retries:1
//      ALREADY PRESENT at line 12 — G1 was actually fixed at some point but
//      doc references in dependencies + knowledge are STALE)
//    - TaxReturnComputeServiceTest.java:
//        line 24139 — line21_equalsLine19PlusLine20_ctcAndAotc (asserts line 22
//          arithmetic indirectly)
//        line 24187 — line21_isNullWhenNoCreditsPresent (line 22 = line 18
//          when no credits)
//        line 24215 — line21_line22FlooredAtZeroWhenCreditsAbsorbAllTax
//          (★ PRIMARY DIRECT ASSERTION on `taxAfterCredits == 0` floor)
//    - IRS 2025 Form 1040 (line 22 "Subtract line 21 from line 18. If zero or
//      less, enter -0-")
//    - IRS 2025 Instructions for Form 1040
//    - docs/books/i1040gi_2025.txt + J.K. Lasser's Your Income Tax 2025
//
//  Tax year: 2025
//
//  Concept:
//    Form1040.line22 = max(0, Form1040.line18 − Form1040.line21)
//
//    Where:
//      Form1040.line18 = line16 + line17                (totalTaxBeforeCredits)
//      Form1040.line21 = line19 + line20                (totalCredits)
//
//    Line 22 is the **tax after page-2 nonrefundable credits and before
//    Schedule 2 other taxes**. The IRS form explicitly says "If zero or less,
//    enter -0-" — the zero floor is mandatory and structurally enforced via
//    `.max(BigDecimal.ZERO)` at TaxReturnComputeService.java:19594.
//
//    Implementation convention:
//      Form1040.line22 = max(0, nz(Form1040.line18) − nz(Form1040.line21))
//      where nz(x) = safeAmount(x) (null → ZERO).
//
//    Surrounding page-2 chain:
//      line 16 = regular_tax + box1 + box2 + box3          (tax)
//      line 17 = alternativeMinimumTax                      (AMT)
//      line 18 = line 16 + line 17                          (totalTaxBeforeCredits)
//      line 19 = Schedule8812.line14                        (childTaxCredit)
//      line 20 = Schedule3.line8                            (otherCreditsSchedule3)
//      line 21 = nz(line19) + nz(line20)                   (totalCredits)
//      ★ line 22 = max(0, nz(line18) − nz(line21))         (★ THIS LINE — taxAfterCredits)
//      line 23 = Schedule2.line21                           (otherTaxes)
//      line 24 = line 22 + line 23                          (★★ TOTAL TAX FINAL — totalTax)
//
//    ★ KEY DISTINCTION FROM LINE 21:
//      Line 22 is ALWAYS-SET (not null-when-zero) — `tac.setTaxAfterCredits(line22)`
//      always called regardless of value; PDF cell shows "0" not blank.
//      Line 21 + Line 20 are null-when-zero — PDF cell blank when zero.
//      Line 24 is ZERO-when-zero — always shows 0 not null.
//      3 distinct conventions across same method (per 20 #6 sub-verification 4).
//
//  Line 22 audit positioning (9th audit OUTSIDE 13ab pair):
//   • FOURTH credits-section audit (after lines 19 + 20 + 21)
//   • Cumulative position: 48th line
//   • ★ SECOND META-AUDIT in workflow (after 21 #4) — but with DIFFERENT
//     doc-trail signature: line 21 META-AUDIT cited spec §0 verification note;
//     line 22 META-AUDIT cites dependencies/22.md §0 "Audited 2026-04-19" +
//     knowledge §0 "Audited 2026-04-19" (NO spec §0 banner for line 22)
//   • Coverage already exists at 20 #6 sub-verification 3 + 21 #8 (line 22
//     downstream from line 21 audit)
//   • ★ DOC DRIFT SURFACED — G1 (retries:1 missing) STALE in dependencies §107
//     + knowledge §7; verified 2026-05-15 that file ALREADY HAS retries:1 at
//     line 12 (presumably fixed during line 21 G2 fix 2026-04-19 round but
//     line 22 docs weren't updated — cross-spec spillover from sister-line fix)
//   • Likely DEFENSIVE-GAP-NOT-NEEDED Issue #1 — inline-computed at single
//     site; reads `tac.getTotalTaxBeforeCredits()` (line 18) + local line21
//     (computed line above); both upstream-set fields MFS-clean
//
//  Line 22 audit angles (10 issues):
//   1. CROSS-REFERENCE — NO MFS DEFENSIVE GAP NEEDED at line 22 wiring site
//       inside computeLine20ThroughLine24 (~line 19593-19595; line 18 inherits
//       18 #5/18 #6 MFS transitively via totalTaxBeforeCredits; line 21
//       inherits 21 #1 MFS-clean inheritance). 14th defensive-gap-NOT-needed
//       Issue #1; FOURTH orchestrator-method-based audit with transitive
//       inheritance after 18 #1 + 20 #1 + 21 #1. MFS cascade UNCHANGED at 20
//       orchestrators.
//   2. DOCUMENTATION HYGIENE — Knowledge file Legacy A rename
//       (knowledge_line22.md → line-22-tax-after-credits.md); 15th Legacy A
//       migration; convergence 27 → 28 lines.
//   3. SPEC ENHANCEMENT — Verification log section §12 in lines/22.md (single-
//       row pattern; ★ 12th CONSECUTIVE single-row log in workflow).
//   4. ★ DOCUMENTATION DRIFT FIX (G1) — dependencies/22.md G1 row + knowledge
//       §7 G1 say `retries:1` missing from line22-tax-after-credits.spec.ts;
//       verified 2026-05-15 that line 12 ALREADY HAS retries:1; doc drift.
//       9th documentation drift fix in workflow. ★ Different doc-drift shape
//       — first instance of "documented gap is already fixed but docs weren't
//       updated" (vs. prior drifts which were code-fixed-but-stale-doc).
//   5. ★ SECOND META-AUDIT IN WORKFLOW — dependencies/22.md §0 "Audited
//       2026-04-19" + knowledge §0 same date document prior audit (but NO spec
//       §0 banner — different signature than line 21). 7 consistency checks
//       pass after G1 doc drift resolved in #4. ★ Establishes that META-AUDIT
//       category has TWO sub-types: (a) spec-§0-banner signature (line 21);
//       (b) dependencies+knowledge-§0 signature (line 22).
//   6. VERIFIED CORRECT — line 22 single-site wiring at ~line 19593-19595;
//       anti-duplication policy applied; **11th anti-duplication application
//       in workflow** — covered by 20 #6 sub-verification 3 + 21 #8.
//   7. VERIFIED CORRECT — inheritance chain (line 18 from 18 #5/18 #6 MFS
//       protection via totalTaxBeforeCredits + line 21 from 21 #1 transitive +
//       floor at 0 via max(BigDecimal.ZERO) → line 22 floor-protected against
//       any soft §6b violation from line 21).
//   8. VERIFIED CORRECT — 4 conventions (zero-floor mandatory + ALWAYS-SET vs.
//       null-when-zero + spec §6e margin note no-op + safeAmount handling).
//   9. ⚠️ BUNDLED OBSERVATIONS — 3 observations: (a) missing diagrams/22.drawio
//       (cosmetic; same pattern as 20 #9 (b) + 21 #9 (a)); (b) G2
//       INFORMATIONAL — no named line22 unit test (covered by line21_* tests;
//       discoverability concern only); (c) line 24 audit upcoming as 3rd
//       META-AUDIT in workflow (likely dependencies+knowledge §0 signature;
//       coverage already at 20 #6 sub-verification 4 ★★ TOTAL TAX). 19th
//       Path A application.
//  10. BOUNDARY MILESTONE — fourth credits-section audit; 48 lines / 477 issues
//       (after closing 10) / backend 765 UNCHANGED / MFS cascade UNCHANGED at
//       20 orchestrators; ★ 9 doc drift fixes (+1 from G1 drift) / 19 Path A /
//       11 anti-duplication / 23 consecutive zero-outstanding walkthroughs;
//       ★ 2 META-AUDITS total (FIRST + SECOND with different doc-trail sigs).
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '22.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 22 — TAX AFTER NONREFUNDABLE CREDITS (Subtract line 21 from line 18; If zero or less, enter -0-) — 2025'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 22 (page 2; "Subtract line 21 from line 18. If zero or less, enter -0-")'],
  ['Concept',
    'Line 22 is the TAX REMAINING AFTER nonrefundable credits offset tax-before-credits. ' +
    'Pure subtraction with mandatory zero-floor per IRS instructions ("If zero or less, enter -0-"). ' +
    '★ NEAR-SIMPLEST credits-section line — pure single-operator subtraction with floor; no decision tree, ' +
    'no reference data, no orchestrator, no validation logic beyond the floor. Computation complexity is ' +
    'UPSTREAM in line 18 (line 16 + line 17) + line 21 (line 19 + line 20).'],
  ['Top-level formula (spec §2)',
    'Form1040.line22 = max(0, Form1040.line18 − Form1040.line21)\n' +
    'where:\n' +
    '  Form1040.line18 = line 16 + line 17               (totalTaxBeforeCredits)\n' +
    '  Form1040.line21 = nz(line19) + nz(line20)         (totalCredits)\n' +
    '\n' +
    'Implementation convention:\n' +
    '  Form1040.line22 = max(0, nz(Form1040.line18) − nz(Form1040.line21))\n' +
    'where nz(x) = safeAmount(x) treats null as zero.'],
  ['Surrounding page-2 chain (spec §5 + knowledge §2)',
    'line 16 = regular_tax + box1 + box2 + box3          (tax)\n' +
    'line 17 = alternativeMinimumTax                      (AMT)\n' +
    'line 18 = line 16 + line 17                          (totalTaxBeforeCredits)\n' +
    'line 19 = Schedule8812.line14                        (childTaxCredit)\n' +
    'line 20 = Schedule3.line8                            (otherCreditsSchedule3)\n' +
    'line 21 = nz(line19) + nz(line20)                   (totalCredits — null-when-zero)\n' +
    '★ line 22 = max(0, nz(line18) − nz(line21))         (★ THIS LINE — taxAfterCredits — ALWAYS-SET)\n' +
    'line 23 = Schedule2.line21                           (otherTaxes)\n' +
    'line 24 = line 22 + line 23                          (★★ TOTAL TAX FINAL — totalTax — ZERO-when-zero)\n' +
    '\n' +
    '★ Lines 20, 21, 22, 24 ALL computed in single method `computeLine20ThroughLine24`.\n' +
    '★ THREE distinct null-handling conventions across the method:\n' +
    '  • Line 20 + 21 → null-when-zero (PDF cell blank)\n' +
    '  • Line 22 → ALWAYS-SET (PDF cell shows "0", never blank)\n' +
    '  • Line 24 → ZERO-when-zero (always populated; PDF cell shows "0" or positive)'],
  ['What line 22 is NOT (spec §3 + §6c-§6d)',
    'NOT a final total tax — line 24 is final.\n' +
    'NOT a payment line — payment lines are 25-33.\n' +
    'NOT a refundable-credit line — refundable lines are 28-31.\n' +
    'NOT a line that can go negative — IRS form explicitly says "If zero or less, enter -0-".\n' +
    'Does NOT include line 23 other taxes (those add at line 24).\n' +
    'Does NOT subtract or include refundable credits/withholding/estimated payments.\n' +
    'Margin note near line 22 for lines 12a/b/c/d boxes does NOT change line 22 arithmetic (spec §6e).'],
  ['2025 Guardrails (spec §6)',
    '§6a Zero floor is MANDATORY on line 22 — IRS form explicitly says "If zero or less, enter -0-".\n' +
    '    STRUCTURALLY enforced via `.max(BigDecimal.ZERO)` at TaxReturnComputeService.java:19594.\n' +
    '§6b Floor belongs on line 22, NOT line 21 — line 21 is the raw sum; floor at the subtraction.\n' +
    '§6c Excludes line 23 other taxes — those add at line 24 via line22 + line23.\n' +
    '§6d Excludes refundable credits + withholding + estimated payments — those enter at lines 25-33.\n' +
    '§6e Margin note near line 22 for taxpayers who checked line 12a/b/c/d boxes does NOT change line 22\n' +
    '    arithmetic — line 22 remains `max(0, line18 − line21)` regardless of those boxes.'],
  ['Output target',
    'Primary: form1040.taxAndCredits.taxAfterCredits (BigDecimal; line 22 output; ★ ALWAYS-SET — never null)\n' +
    'PDF field: line22_tax_less_credits (page 2; AcroForm f2_14[0])\n' +
    'Frontend field: form.taxAndCredits?.taxAfterCredits (form-tax-return-1040.component.ts line 327)'],
  ['Backend implementation',
    '**SINGLE WIRING SITE** — `computeLine20ThroughLine24` at TaxReturnComputeService.java:19571-19604; ' +
    'line 22 computation at lines 19592-19595 (3 lines): ' +
    '`BigDecimal line18 = safeAmount(tac.getTotalTaxBeforeCredits());` (line 19593) → ' +
    '`BigDecimal line22 = roundMoney(line18.subtract(line21).max(BigDecimal.ZERO));` (line 19594) → ' +
    '`tac.setTaxAfterCredits(line22);` (line 19595; UNCONDITIONAL — always set). ' +
    'Call site at prepare() ~line 1680 (after finalizeSchedule3Totals at ~line 1612 + ' +
    'computeSchedule8812 at ~line 1130 + computeLine18 earlier). ' +
    'Coverage already exists at 20 #6 VERIFIED CORRECT breadcrumb sub-verification 3 ' +
    '(~line 19514-19524).'],
  ['IRS source',
    'IRS 2025 Form 1040 (page 2 line 22 "Subtract line 21 from line 18. If zero or less, enter -0-") + ' +
    '2025 Instructions for Form 1040. ' +
    'Local cross-checks: docs/books/i1040gi_2025.txt + J.K. Lasser\'s Your Income Tax 2025. ' +
    'No 2025-specific changes to line 22 arithmetic — pure subtraction with floor; no IRS-published worksheet.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'computeLine18 wires line 18 (totalTaxBeforeCredits)', 'Per 18 #5 + 18 #6 audits. Sum of line 16 (tax) + line 17 (AMT); written to tac.totalTaxBeforeCredits. ★ MFS protection via transitive inheritance from 17 #1 + 16 #1.'],
  [2, 'computeSchedule8812 wires line 19 (childTaxCredit)', 'Per 19 #5-#8 audits. ★ MFS guard at call site form2555Spouse null-shadowed (19 #1).'],
  [3, 'All applyXxxToSchedule3 + finalizeSchedule3Totals run', 'Per 20 #5 + 20 #7 audits. 17 Schedule 3 Part I credit fields populated; Schedule 3 line 8 computed.'],
  [4, 'computeLine20ThroughLine24 wires line 20', 'Per 20 #6 sub-verification 1. `line20 = (totalNonrefundableCredits > 0) ? line8 : null`; null-when-zero.'],
  [5, 'computeLine20ThroughLine24 wires line 21', 'Per 20 #6 sub-verification 2 + 21 audit. `line21 = safeAmount(line19) + safeAmount(line20)` if > 0 else null. Null-when-zero.'],
  [6, 'computeLine20ThroughLine24 wires line 22 (★ THIS LINE)', '`line18 = safeAmount(tac.getTotalTaxBeforeCredits())` (null-as-zero) → `line22 = roundMoney(line18.subtract(line21).max(BigDecimal.ZERO))` → `tac.setTaxAfterCredits(line22)` (UNCONDITIONAL). Per TaxReturnComputeService.java:19592-19595. ★ ALWAYS-SET — never null. ★ Floor at 0 STRUCTURALLY enforced.'],
  [7, 'computeLine20ThroughLine24 wires line 24 (downstream)', '`line24 = roundMoney(line22 + line23)`; tac.setTotalTax((line24 > 0) ? line24 : ZERO). Per line 19599-19600. ★★ FINAL TOTAL TAX. ZERO-when-zero.'],
  [8, 'LOG.infof captures line 20-24 values', 'INFO-level diagnostic log at line 19602-19603 captures all 5 line values for production debugging.'],
  [],
  ['INVARIANTS / VALIDATIONS (spec §8)'],
  ['Invariant', 'Rationale'],
  ['Form1040.line22 >= 0', 'IRS form explicitly says "If zero or less, enter -0-". STRUCTURALLY enforced by `.max(BigDecimal.ZERO)` at line 19594.'],
  ['Form1040.line22 = max(0, nz(Form1040.line18) − nz(Form1040.line21))', 'Per spec §2 + IRS Form 1040 line 22 label. STRUCTURALLY enforced by line 19592-19595.'],
  ['Form1040.line22 <= Form1040.line18', 'Floor at 0 + line 21 ≥ 0 → subtraction can only reduce line 18, never increase. Always true.'],
  ['Form1040.line22 always SET (never null)', '★ Distinct from line 20 + 21 (both null-when-zero) + line 24 (ZERO-when-zero). PDF cell shows "0" not blank. Per line 19595 `tac.setTaxAfterCredits(line22)` UNCONDITIONAL.'],
  ['Floor at 0 happens at line 22 (NOT line 21) per spec §6b', 'Per spec §6b. STRUCTURALLY enforced; line 21 is raw sum; line 22 is floored difference.'],
  ['Margin note for line 12a/b/c/d boxes does NOT alter line 22 (spec §6e)', 'Per spec §6e. Code at line 19594 contains no special-case branching for line 12 box flags — the margin note is presentational only.'],
  ['Practical: if line21 = 0, then line22 = line18', 'Per spec §8. Verified by `line21_isNullWhenNoCreditsPresent` test (TaxReturnComputeServiceTest.java:24187).'],
  ['Practical: if line21 ≥ line18, then line22 = 0', 'Per spec §8. Verified by `line21_line22FlooredAtZeroWhenCreditsAbsorbAllTax` test (TaxReturnComputeServiceTest.java:24215). ★ PRIMARY direct floor assertion.'],
  ['Practical: if line18 > line21, then line22 = line18 − line21', 'Per spec §8. Verified by `line21_equalsLine19PlusLine20_ctcAndAotc` test (TaxReturnComputeServiceTest.java:24139).'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 38 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 22'],
  ['Line 22 takes EXACTLY TWO INPUTS — line 18 (totalTaxBeforeCredits from line 16 + line 17) + line 21 (totalCredits from line 19 + line 20). ★ SAME inputs-table shape as line 21 — only 2 fields. Both are already-computed TaxAndCredits fields populated by upstream methods. Computation complexity is UPSTREAM in line 18 (heavy compute via lines 16/17) + line 21 (additive composite of CTC + Schedule 3 line 8).'],
  [],
  ['#', 'Input', 'Form 1040 line', 'Java field path', 'Upstream method', 'XLS input/output form reference'],
  [1, 'totalTaxBeforeCredits (tax + AMT)', 'line 18', 'form1040.taxAndCredits.totalTaxBeforeCredits', 'computeLine18 (sums line 16 + line 17)', 'XLS/output_forms/form-tax-return-1040.xlsx (lines 16 + 17 + 18 cells)'],
  [2, 'totalCredits (CTC + ODC + Schedule 3 line 8)', 'line 21', 'form1040.taxAndCredits.totalCredits', 'computeLine20ThroughLine24 (set immediately before line 22 computation in same method)', 'XLS/output_forms/form-tax-return-1040.xlsx (line 21 cell)'],
  [],
  ['⚠️ NO DEDICATED USER INPUT FORM FOR LINE 22'],
  ['Line 22 has NO `form-line22-*.xlsx` in C:\\us-tax\\XLS\\input_forms\\. Both inputs are computed by upstream methods. Line 22 is NOT visible as a standalone form in the sidebar — it is shown on the `form-tax-return-1040` Tax Return view + Form 1040 PDF only. No user-supplied data feeds line 22 directly.'],
  [],
  ['⚠️ TRANSITIVE INHERITANCE OF MFS FIXES'],
  ['Both inputs inherit MFS protection TRANSITIVELY from upstream orchestrator audits:'],
  ['Input', 'Upstream MFS guard', 'Status'],
  ['totalTaxBeforeCredits (line 18)', 'computeLine18 sums line 16 + line 17 — both inherit 16 #1 + 17 #1 MFS guards (form2555Spouse + form4972Spouse null-shadowed at respective call sites) per 18 #5 + 18 #6 audits', '✅ Inherits transitively'],
  ['totalCredits (line 21)', 'computeLine20ThroughLine24 — inline-computed at single site; reads childTaxCredit (19 #1 transitive) + line20 (20 #1 transitive); pure additive composite per 21 #1 + 21 #6', '✅ Inherits transitively'],
  ['→ NO MFS GUARD NEEDED at line 22 wiring site', '14th defensive-gap-NOT-needed Issue #1 in workflow (FOURTH orchestrator-method-based after 18 #1 + 20 #1 + 21 #1)', '(See 22 #1)'],
  [],
  ['⚠️ NO MISSING INPUTS for current scope'],
  ['Both inputs are fully implemented + MFS-protected. The two prior gaps G1 + G2 per knowledge §7:'],
  ['Gap', 'Status', 'Resolution'],
  ['G1 — line22-tax-after-credits.spec.ts missing retries:1', '✅ ALREADY FIXED (date unknown; possibly 2026-04-19 round)', '★ Verified 2026-05-15: line 12 of spec reads `test.describe.configure({ timeout: 180000, retries: 1 })`; dependencies + knowledge §7 are STALE; ★ doc-drift fix planned in 22 #4 (9th doc-drift fix in workflow)'],
  ['G2 — No Java unit test named specifically for line 22', '⚠️ INFORMATIONAL — DEFERRED', 'Primary direct floor assertion lives in `line21_line22FlooredAtZeroWhenCreditsAbsorbAllTax` test (TaxReturnComputeServiceTest.java:24215); naming concern only; existing coverage adequate'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 40 }, { wch: 18 }, { wch: 50 }, { wch: 55 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 22'],
  ['Line 22 uses ZERO reference data — NO constants, thresholds, brackets, or phase-outs. Pure single-operator subtraction with floor. ★ Same pattern as lines 14, 18, 20, 21 — pure arithmetic composite lines have no statutory anchors.'],
  [],
  ['Constant', 'Value', 'Statutory Basis', 'Backend identifier'],
  ['(None — pure arithmetic line)', '—', 'Spec §2 + dependencies/22.md (no constants section)', '—'],
  [],
  ['★ THIS IS A PURE ARITHMETIC LINE — same shape as line 14 / 18 / 20 / 21'],
  ['Contrast with neighboring lines:'],
  ['Line', '# Constants', 'Complexity'],
  ['line 18 (line 16 + line 17)', '0', 'Pure addition; inherits from lines 16 + 17 audits'],
  ['line 19 (CTC + ODC)', '~8 (CTC $2,200, ODC $500, ACTC $1,700, phase-out $400k/$200k, $50/$1k, ACTC floor $2,500, 15%, Part II-B $5,100)', 'Heavy compute orchestrator (Schedule 8812)'],
  ['line 20 (Schedule 3 line 8)', '0', 'Pure pass-through; upstream complexity in 17 credit fields'],
  ['line 21 (line 19 + line 20)', '0', 'Pure single-operator addition'],
  ['**line 22 (max(0, line 18 − line 21))**', '**0**', '**Pure single-operator subtraction with floor**'],
  ['line 24 (line 22 + line 23) — TOTAL TAX', '0', 'Pure addition (same method)'],
  [],
  ['Upstream tax/credit computations DO use 2025 reference data — out of scope for line 22'],
  ['Per dependencies/22.md "Inputs to line 21 (indirect inputs to line 22)"; each individual upstream computation (line 16 brackets, line 17 AMT, line 19 CTC, line 20 Schedule 3 credits) has its own statutory constants. Line 22 itself interprets no tax law — it is a pure mathematical operator with floor.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 55 }, { wch: 60 }, { wch: 40 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 22 Persistence + Downstream Consumers'],
  ['Line 22 is one of FOUR fields wired by `computeLine20ThroughLine24` (lines 20 + 21 + 22 + 24). This sheet focuses on the line-22 specific output + its immediate downstream consumer (line 24 ★★ TOTAL TAX) + cross-method consumers.'],
  [],
  ['Output target', 'Where wired', 'Effect', 'XLS output reference'],
  ['form1040.taxAndCredits.taxAfterCredits', '`computeLine20ThroughLine24` line 19595', '★ CANONICAL line 22 output. = max(0, line18 − line21). BigDecimal whole-dollar HALF_UP via roundMoney. ★ ALWAYS-SET (never null) — distinct from line 20 + 21 (null-when-zero) and line 24 (ZERO-when-zero). PDF cell shows "0" not blank when zero.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 22 cell)'],
  [],
  ['SAME-METHOD CONSUMERS (★★) — computed in same `computeLine20ThroughLine24` method'],
  ['form1040.taxAndCredits.totalTax (line 24)', '`computeLine20ThroughLine24` line 19599-19600', '★★ line 24 = line 22 + line 23 (Schedule 2 other taxes). ★★ TOTAL TAX FINAL — the return\'s most important output field. Line 22 is the dominant contributor to line 24 (line 23 is often zero). ZERO-when-zero convention.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 24 cell)'],
  [],
  ['CROSS-METHOD CONSUMERS'],
  ['computeLine31ThroughLine38 reads totalTax (line 24)', 'TaxReturnComputeService.java:~19617', 'Reads tac.getTotalTax() (line 24, which derives from line 22) for withholding chain + refund/owed calculations. Line 22 affects this transitively.', 'XLS/output_forms/form-tax-return-1040.xlsx (lines 31-38)'],
  ['computeForm2210 reads totalTaxBeforeCredits + totalTax', 'TaxReturnComputeService.java', 'Underpayment penalty calculation uses line 18 + line 24. Line 22 affects line 24 transitively. Note: rules.md mentions "line 22" but the actual field read is `totalTaxBeforeCredits` per dependencies/22.md Downstream Consumers table.', 'XLS/output_forms/form-tax-return-2210.xlsx'],
  ['Frontend PDF export (form-tax-return-1040.component.ts)', 'us-tax-ui line 327', '`values[\'line22_tax_less_credits\'] = formatAmount(form.taxAndCredits?.taxAfterCredits);` ★ When zero, formatAmount(0) renders "0" (not blank) — matches IRS instruction "enter -0-".', 'XLS/output_forms/form-tax-return-1040.xlsx (PDF view)'],
  [],
  ['PDF Output'],
  ['PDF Field', 'Field Code', 'Source'],
  ['Line 22 amount (page 2)', 'line22_tax_less_credits', 'C:\\us-tax\\us-tax-ui\\public\\irs\\f1040_field_mapping_semantic.csv line 163'],
  ['AcroForm path', 'topmostSubform[0].Page2[0].f2_14[0]', 'IRS 2025 Form 1040 PDF (page 2; rect ~504,552 to 576,564)'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 60 }, { wch: 80 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 22'],
  ['Line 22 emits NO blocking flags directly. Each upstream method may emit its own flags. Line 22 silently subtracts whatever the two upstream lines contain and floors the result at zero.'],
  [],
  ['Flag code', 'Severity', 'Condition', 'Where emitted'],
  ['(None at line 22 site)', 'N/A', 'Line 22 has no validation. Upstream methods (computeLine18 for line 18; computeSchedule8812 + applyXxxToSchedule3 + computeLine20ThroughLine24 for line 21) each have their own flags.', '—'],
  [],
  ['SPEC §8 STRUCTURAL INVARIANTS (not runtime-validated)'],
  ['Invariant', 'How enforced / Status'],
  ['line 22 ≥ 0 (IRS mandatory zero-floor)', 'STRUCTURALLY enforced by `.max(BigDecimal.ZERO)` at TaxReturnComputeService.java:19594.'],
  ['line 22 = max(0, nz(line 18) − nz(line 21))', 'STRUCTURALLY enforced by line 19592-19595; safeAmount null-as-zero coercion on both operands.'],
  ['line 22 ≤ line 18 (credits cannot push line 22 negative)', 'Implicitly guaranteed by zero floor + line 21 ≥ 0; STRUCTURALLY true.'],
  ['line 22 always SET (never null) — distinct from line 20 + 21', 'STRUCTURALLY enforced by `tac.setTaxAfterCredits(line22)` UNCONDITIONAL at line 19595; contrast with `(line21 > 0) ? line21 : null` at line 19590.'],
  ['Floor at line 22 (NOT line 21) per spec §6b', 'STRUCTURALLY enforced — floor at line 19594 max(ZERO); line 21 raw sum at line 19589 has no max.'],
  ['Margin note for line 12a/b/c/d boxes does NOT alter line 22 (spec §6e)', 'STRUCTURALLY enforced — code at line 19594 contains no special-case branching for line 12 box flags.'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 14 }, { wch: 100 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 22 is the tax after nonrefundable credits (Form 1040 line 22 = max(0, line 18 − line 21)). 9th audit OUTSIDE 13ab pair; FOURTH credits-section audit (after lines 19 + 20 + 21). ★ SECOND META-AUDIT in workflow (different doc-trail signature than 21 — dependencies+knowledge §0 banner, NOT spec §0). ★ DOC-DRIFT SURFACED — G1 retries:1 documented as missing but already fixed (different drift shape than prior 8). 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-15 — CROSS-REFERENCE — NO MFS DEFENSIVE GAP NEEDED at line 22 wiring site (14th defensive-gap-NOT-needed Issue #1 in workflow; FOURTH orchestrator-method-based audit with transitive inheritance after 18 #1 + 20 #1 + 21 #1)',
    '**Per-input MFS-leakage analysis**: line 22 is inline-computed at single site `TaxReturnComputeService.java:19592-19595` inside `computeLine20ThroughLine24(form1040, schedule3)` — neither parameter is a per-spouse input. Inside the 3-line block: (a) `line18 = safeAmount(tac.getTotalTaxBeforeCredits())` — reads tac.totalTaxBeforeCredits set by computeLine18 (which sums line 16 + line 17, each inheriting 16 #1 + 17 #1 MFS guards per 18 #5 + 18 #6 audits); MFS-clean by transitive inheritance. (b) `line22 = roundMoney(line18.subtract(line21).max(BigDecimal.ZERO))` — pure arithmetic with floor; cannot introduce MFS leakage; `line21` local was computed 2 lines above with safeAmount on both addends per 21 #1 + 21 #6. (c) `tac.setTaxAfterCredits(line22)` — pure write; UNCONDITIONAL (no null-when-zero coercion; distinct from line 20 + 21). **All upstream-set fields are already MFS-clean** by the time computeLine20ThroughLine24 reads them; pure subtraction with floor cannot introduce new MFS leakage. **MFS-guard cascade UNCHANGED at 20 orchestrators**. **★ Notable**: 22 #1 is the FOURTH orchestrator-method-based audit in the workflow with transitive inheritance (after 18 #1 + 20 #1 + 21 #1) — none of these audits added to cascade; all four confirm the pattern rule established at 18 #1 (orchestrator without per-spouse parameters → transitive inheritance suffices). The pattern rule is now confirmed across FOUR audits across tax-territory (18) + credits-territory (20 + 21 + 22). **14th defensive-gap-NOT-needed Issue #1 in workflow** (after 13 prior: 9 + 11a/b + 12b/c/d/e + 14 + 15 + 18 + 20 + 21). Backend tests: **765/765 unchanged** (no code change).',
    'TaxReturnComputeService.java:19592-19595 (line 22 wiring; 3 lines inside computeLine20ThroughLine24); 19571 (method signature — no per-spouse params); 1680 (call site)',
    'CLOSED — defensive-gap-NOT-needed. **14th in workflow** (fourth orchestrator-method-based with transitive inheritance after 18 #1 + 20 #1 + 21 #1). MFS-guard cascade UNCHANGED at 20 orchestrators. Pure cross-reference closure. 765/765 unchanged.'],

  [2, 'RESOLVED 2026-05-15 — DOCUMENTATION HYGIENE — Knowledge file Legacy A rename (knowledge_line22.md → line-22-tax-after-credits.md; 15th Legacy A migration; convergence 27→28; ★ 3rd CONSECUTIVE Legacy A migration with ZERO history.md hits after 20 #2 + 21 #2)',
    '**Closure applied**: (1) plain `mv` of `C:\\us-tax\\knowledge\\knowledge_line22.md` → `C:\\us-tax\\knowledge\\line-22-tax-after-credits.md` (folder not under git). (2) Repo-wide grep for `knowledge_line22` produced 1 file hit / 8 line hits in `generate-22.js` only (classified per established 15 #2 / 16 #2 / 17 #2 / 18 #2 / 19 #2 / 20 #2 / 21 #2 precedent): ACTIVE-UPDATE = 3 hits at lines 19 (header file path citation), 391 (Issue #4 doc-drift details — current cross-reference to §7 G1), 396 (Issue #5 META-AUDIT details — current cross-reference to §0 banner) — all updated to new path with rename annotation `(renamed from knowledge_line22.md via 22 #2 2026-05-15)`. LEAVE-UNTOUCHED = 5 hits at lines 20 (header rename description), 116 (Issue #2 audit angle), 380 (Issue #2 row title — this row), 381 (Issue #2 row details — being rewritten by this closure), 382 (Issue #2 Where Found — both old + new names) — all rename-description rows. (3) **★ ZERO HITS IN history.md** — 3rd CONSECUTIVE Legacy A migration with no historical-entry references (after 20 #2 + 21 #2; this is now an established workflow pattern: line audits not yet logged at time of migration produce zero history.md hits — predictable outcome for credits-section audits). (4) `lines/22.md` + `dependencies/22.md` scan: NO citation of knowledge file path → no update needed. (5) ZERO hits in TaxReturnComputeService.java. **15th Legacy A migration in workflow** (after 7a/8/9/10/11a/12a/13a/15/16/17/18/19/20/21 #2). **Knowledge-file naming convergence advances 27 → 28 lines** — deep convergence territory. Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\knowledge\\line-22-tax-after-credits.md (renamed); C:\\us-tax\\XLS\\_tools\\generate-22.js 3 ACTIVE-UPDATE hits at lines 19/391/396 + 5 LEAVE-UNTOUCHED rename-description hits at lines 20/116/380/381/382; ZERO hits in history.md (3rd consecutive migration with no historical references after 20 #2 + 21 #2)',
    'CLOSED — file renamed + 3 active citations updated in generate-22.js; 5 hits left untouched per precedent (rename-description rows). Pure documentation closure. 15th Legacy A migration. Convergence 27 → 28 lines. ★ 3rd consecutive Legacy A migration with zero history.md hits — established workflow pattern.'],

  [3, 'RESOLVED 2026-05-15 — SPEC ENHANCEMENT — Verification log section §12 created in lines/22.md (single-row pattern; ★ 12th CONSECUTIVE single-row log in workflow; ★ first in-spec audit-trail mark for line 22)',
    '**Closure applied**: appended `## 12) Verification log` section to `lines/22.md` after section §11 (Scope Note; line 249). 5-column markdown table; **row 1 in IN-PROGRESS state** capturing #1 (14th defensive-gap-NOT-needed; ★ 4th orchestrator-method-based with transitive inheritance after 18 #1 + 20 #1 + 21 #1) + #2 (Legacy A rename — 15th migration; 27 → 28 convergence; ★ 3rd consecutive with zero history.md hits) + #3 (this section creation). Row 1 will be finalized to **"COMPLETE — 10/10 closed"** at Issue #10 (boundary milestone) with all 10 closures enumerated. **Single-row pattern** = SMALLEST log shape; **★ 12th CONSECUTIVE single-row log in workflow** (matches lines 8, 9, 10, 14, 15, 16, 17, 18, 19, 20, 21). **★ NOTABLE**: §12 is the FIRST in-spec audit-trail mark for line 22 since lines/22.md has no §0 verification banner (unlike line 21 which had one). This makes line 22\'s audit history discoverable from inside the spec for the first time. Append-then-finalize pattern (used at 14 #3, 15 #3, 16 #3, 17 #3, 18 #3, 19 #3, 20 #3, 21 #3) lets the row evolve as the walkthrough progresses; final state captured atomically at Issue #10. Pure spec enhancement — no functional change. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\lines\\22.md section §12 appended after §11 (Scope Note; line 249)',
    'CLOSED — §12 Verification log section created with single-row IN-PROGRESS table. Single-line audit shape (smallest log; ★ 12th consecutive single-row log in workflow; ★ first in-spec audit-trail mark for line 22).'],

  [4, 'RESOLVED 2026-05-15 — ★ DOCUMENTATION DRIFT FIX (G1) — TRIPLE-location drift across dependencies §E2E note + knowledge §0 banner + knowledge §7 G1 section; ★ verified 2026-05-15 that e2e spec line 12 ALREADY HAS retries:1; 9th doc-drift fix in workflow; ★ FIRST INSTANCE of NEW DRIFT SHAPE "documented-gap-already-fixed"',
    '**Closure applied**: THREE file edits — pure documentation; no code change. **The drift**: G1 ("missing `retries: 1`") was identified 2026-04-19 audit; fix was applied at some prior date (presumably during line 21 G2 round; cross-spec spillover fix); BUT documentation never refreshed. **Reality check 2026-05-15**: e2e/tests/line22-tax-after-credits.spec.ts line 12 already reads `test.describe.configure({ timeout: 180000, retries: 1 });`. **3 STALE locations found** (one more than initial plan): (a) `dependencies/22.md` line 108 — "Note" under E2E Test Coverage said retries:1 missing; (b) `knowledge/line-22-tax-after-credits.md` §0 banner line 3 — said "One structural gap identified: line22-tax-after-credits.spec.ts is missing the retries: 1 E2E directive"; (c) `knowledge/line-22-tax-after-credits.md` §7 G1 lines 174-189 — full G1 section with "Current state: Line 12 of the spec reads test.describe.configure({ timeout: 180000 });" code excerpt. **Edits applied**: (a) `dependencies/22.md` Note rewritten to reflect FIXED state with audit reference; (b) knowledge §0 banner rewritten to add "Re-verified 2026-05-15 (META-AUDIT 22 #5)" + G1 FIXED note; (c) knowledge §7 G1 section header struck-through with ~~~~ + "★ FIXED — doc-drift resolved 2026-05-15 (22 #4)"; Current state rewritten to show actual `retries: 1` PRESENT; Resolution paragraph added explaining the cross-spec spillover fix theory + NEW DRIFT SHAPE explanation. **★ NEW DRIFT SHAPE** — prior 8 doc-drift fixes were all "code-fixed-but-stale-doc" (e.g., 20 #4 G6 fix locked in code but doc said still buggy). 22 #4 is the FIRST instance of "documented-gap-was-actually-already-fixed" — different drift shape; doc-drift fix policy generalizes naturally; the detection trigger differs (prior: doc next to clearly-fixed code; this: re-verifying a documented gap and finding it gone) but closure pattern is the same. **★ TRIPLE-location drift** (matches 20 #4 = 3 locations, but with different shape; 20 #4 had 2 internal contradictions, 22 #4 has 0 contradictions across the 3 locations since they all agreed on the stale "still buggy" framing). Pure documentation closure — no functional change. **9th documentation drift fix in workflow** (after 8 prior — 20 #4 was MOST EXTENSIVE in location-count; 22 #4 is FIRST with this DRIFT SHAPE). Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\dependencies\\22.md line 108 (E2E Test Coverage Note); C:\\us-tax\\knowledge\\line-22-tax-after-credits.md (renamed via 22 #2) §0 banner line 3 + §7 G1 section lines 174-189',
    'CLOSED — 3 file edits applied across 3 locations (dependencies §E2E Note + knowledge §0 banner + knowledge §7 G1 section). ★ NEW DRIFT SHAPE — first "documented-gap-already-fixed" instance in workflow. **9th documentation drift fix in workflow**. ★ TRIPLE-location drift (matches 20 #4 location-count but DIFFERENT shape). Pure documentation closure.'],

  [5, 'RESOLVED 2026-05-15 — ★ SECOND META-AUDIT IN WORKFLOW — dependencies/22.md §0 "Audited 2026-04-19" + knowledge §0 "Audited 2026-04-19" document prior audit (NO spec §0 banner — DIFFERENT doc-trail signature than line 21); 7 consistency checks pass (after G1 doc drift resolved in 22 #4)',
    '**The situation**: lines/22.md does NOT carry a §0 "Verification note" header (different from line 21 which had one at spec §0). The META-AUDIT trail for line 22 lives in TWO different files: (a) dependencies/22.md line 3 *"> Audited 2026-04-19."*; (b) knowledge/line-22-tax-after-credits.md line 3 (renamed from knowledge_line22.md via 22 #2 2026-05-15) *"> Audited 2026-04-19. Line 22 is fully implemented, correctly floored at zero, and wired into lines 23–24. The spec at `C:\\us-tax\\lines\\22.md` is accurate. One structural gap identified: `line22-tax-after-credits.spec.ts` is missing the `retries: 1` E2E directive."* — this last sentence is STALE per 22 #4 doc-drift fix. **★ FIRST OBSERVATION**: META-AUDIT category has TWO sub-types based on doc-trail signature: (a) **spec-§0-banner signature** — line 21 #4 (verification note in lines/21.md §0; the most discoverable form since spec is the primary reference); (b) **dependencies+knowledge-§0 signature** — line 22 #5 (verification trail in dependencies + knowledge files; spec itself has no banner; less discoverable). Both are valid META-AUDIT categories; the doc-trail-signature distinction will recur — likely lines 23 + 24 audits depending on each spec\'s §0 banner presence. **★ 7 consistency checks performed 2026-05-15** (1 fewer than line 21 #4 due to no §0 banner to verify): (a) ✅ Method exists at TaxReturnComputeService.java:19571 (slight drift from prior "15023–15056" reference but uses approximate "lines" language — not a doc-drift fix). (b) ✅ TaxAndCredits.taxAfterCredits field exists at line 25. (c) ✅ Frontend mapping at form-tax-return-1040.component.ts line 327 (`values[\'line22_tax_less_credits\']`). (d) ⚠️ e2e spec G1 doc-drift — RESOLVED in 22 #4 (file already had retries:1 fix; docs updated). (e) ✅ Lock-in tests exist at TaxReturnComputeServiceTest.java:24139/24187/24215 (3 tests verify line 22 indirectly + 1 direct floor assertion at 24215). (f) ✅ Formula `line22 = max(0, nz(line18) − nz(line21))` matches spec §2 + code line 19592-19595. (g) ✅ ALWAYS-SET convention (never null) matches code line 19595 unconditional `tac.setTaxAfterCredits(line22)`. **★ NO new doc-drift fix needed beyond 22 #4** — spec + knowledge + code all consistent after G1 resolved. **★ SECOND META-AUDIT in workflow** — confirms META-AUDIT pattern category establishes; first one (21 #4) had 8 checks pass with no doc-drift; this one (22 #5) had 7 checks + 1 doc-drift resolved (in 22 #4). Pattern is robust: META-AUDIT may surface doc drift even when prior audit reported clean. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\lines\\22.md (NO §0 banner — different signature); C:\\us-tax\\dependencies\\22.md line 3 (Audited 2026-04-19); C:\\us-tax\\knowledge\\line-22-tax-after-credits.md line 3 (Audited 2026-04-19; G1 stale note resolved in 22 #4); TaxReturnComputeService.java:19571-19604 + 19592-19595; TaxReturnComputeServiceTest.java:24139/24187/24215; e2e/tests/line22-tax-after-credits.spec.ts:12',
    'CLOSED — SECOND META-AUDIT consistency check complete. **★ SECOND META-AUDIT in workflow with DIFFERENT doc-trail signature** (dependencies+knowledge §0 vs. line 21\'s spec §0 banner). 7/7 consistency checks pass (8th check became 22 #4 doc-drift fix). META-AUDIT pattern category robust across both sub-types. ★ Establishes that META-AUDIT can surface latent doc drift even when prior audit reported clean — feature, not defect.'],

  [6, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — line 22 single-site wiring at ~line 19593-19595; ★ 11th ANTI-DUPLICATION application; ★ 4-SOURCE coverage (exceeds standard 3-source rule)',
    '**Closure intent**: pure cross-reference closure — **NO new breadcrumb** at line 22 wiring site (anti-duplication policy applied; **11th anti-duplication application in workflow** after 12e #8 + 12e #9 + 13a #9 + 13b #9 + 14 #5 + 15 #7 + 18 #7 + 20 #8 + 21 #5 + 21 #8). **Why no new breadcrumb**: line 22 is already explicitly covered by the **20 #6 VERIFIED CORRECT breadcrumb sub-verification 3** at TaxReturnComputeService.java:19514-19524 (planted 2026-05-14 during line 20 audit) AND **21 #8** anti-duplication application (which already verified this exact wiring during line 21 audit). The 20 #6 sub-verification 3 documents: floor at 0 STRUCTURALLY enforced via max(BigDecimal.ZERO); always-set (not null-when-zero) — distinct from line 20 + 21; inherits 18 #5 + 18 #6 MFS protection via totalTaxBeforeCredits. **4-source coverage confirmed** (one MORE than the standard 3-source coverage rule): (1) spec §2 + §6 (formula + guardrails); (2) dependencies/22.md (Compute Order + Guardrails sections); (3) 20 #6 sub-verification 3 (verified correct breadcrumb in code); (4) 21 #8 (anti-duplication closure during line 21 audit). Adding a 5th breadcrumb would be extreme duplication. **11th anti-duplication application in workflow**. Pure cross-reference closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:19592-19595 (line 22 wiring; covered by 20 #6 sub-verification 3 + 21 #8); spec §2 + §6 + dependencies/22.md (3-source coverage; 4th via 21 #8)',
    'CLOSED — verified correct via 20 #6 sub-verification 3 + 21 #8 + spec §2 + dependencies/22.md (★ 4-source coverage; exceeds standard 3-source rule). **11th anti-duplication application in workflow**. NO new breadcrumb. Pure cross-reference closure. ★ Notable: same wiring anti-duplicated twice — once as downstream of line 21 audit (21 #8), once as target-line of line 22 audit (22 #6) — two independent audits both agreed coverage sufficient.'],

  [7, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — inheritance chain (line 18 from 18 #5/18 #6 MFS protection; line 21 from 21 #1 transitive; line 22 floor-protected against any soft §6b violation)',
    '**Closure intent**: pure cross-reference closure — verifies the inheritance chain that makes line 22 both MFS-clean AND mathematically robust by construction. **Chain verification**: **(1) Line 18 inheritance**: tac.totalTaxBeforeCredits is set by computeLine18 which sums line 16 (regular tax) + line 17 (AMT). Line 16 inherits 16 #1 MFS guard (form2555Spouse + form4972Spouse null-shadow at computeLine16 call site). Line 17 inherits 17 #1 MFS guard (form2555Spouse null-shadow at computeForm6251 call site). Per 18 #5 + 18 #6 audits: line 18 is MFS-clean by transitive inheritance from lines 16 + 17. **(2) Line 21 inheritance**: local `line21` was computed at line 19589 (just before line 22 computation) via `roundMoney(safeAmount(line19).add(safeAmount(line20)))`. Per 21 #1 + 21 #6: line 21 MFS-clean by additive composition of MFS-clean addends. **(3) Line 22 floor protection**: `line22 = roundMoney(line18.subtract(line21).max(BigDecimal.ZERO))`. ★ NOTABLE PROPERTY: even if upstream produces a soft §6b violation on line 21 (line21 > line18 — which the G1 fix at applyForm8863ToSchedule3 order prevents in correctly-credited returns), the floor at 0 prevents negative tax. The floor is THE structural defense against upstream miscalculation. **No new breadcrumb needed** — chain documented across 5 existing breadcrumbs (16 #1 + 17 #1 + 18 #5 + 18 #6 + 21 #1 + 20 #6 sub-verification 3). **Coverage cross-references**: 16 #1 (computeLine16 MFS); 17 #1 (computeForm6251 MFS); 18 #5 + 18 #6 (line 16 + 17 → line 18 inheritance); 21 #1 (line 19 + 20 → line 21 inheritance); 20 #6 sub-verification 3 (line 22 floor + always-set + MFS inheritance). Pure cross-reference closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:19592-19595 (line 22 wiring; floor at line 19594; coverage via 20 #6 sub-verification 3 + 21 #8) — full chain: 16 #1 + 17 #1 + 18 #5/18 #6 + 21 #1 + 20 #6 sub-verification 3 (5 existing breadcrumbs)',
    'CLOSED — verified correct via inheritance chain. Line 18 MFS-clean (18 #5/18 #6 from 16 #1 + 17 #1); line 21 MFS-clean (21 #1); line 22 = floored subtraction → MFS-clean by construction; ★ floor at 0 is structural defense-in-depth against any soft §6b violation upstream. Chain documented across 5 existing breadcrumbs (16 #1 + 17 #1 + 18 #5/18 #6 + 21 #1 + 20 #6 sub-verification 3). Pure cross-reference closure.'],

  [8, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — 4 conventions (zero-floor mandatory + ALWAYS-SET vs. null-when-zero + spec §6e margin note no-op + safeAmount handling)',
    '**Closure intent**: pure verification closure — confirms four line-22-specific conventions documented by spec §6 + §8 + code line 19592-19595. **Convention 1 — Zero-floor MANDATORY**: `roundMoney(line18.subtract(line21).max(BigDecimal.ZERO))` at line 19594. IRS form explicitly says "If zero or less, enter -0-" (spec §6a); structurally enforced; line 22 can never be negative. Lock-in test `line21_line22FlooredAtZeroWhenCreditsAbsorbAllTax` (TaxReturnComputeServiceTest.java:24215) confirms floor: `taxAfterCredits == 0` when CTC equals tax. ★ THE structural defense against upstream miscalculation. **Convention 2 — ALWAYS-SET (not null-when-zero)**: `tac.setTaxAfterCredits(line22)` UNCONDITIONAL at line 19595. ★ DISTINCT from line 20 + 21 which are null-when-zero; ALSO distinct from line 24 which is ZERO-when-zero. THREE distinct null-handling conventions in same method (per 20 #6 sub-verification 3 + 4). PDF cell shows "0" not blank when zero — matches IRS instruction "enter -0-". **Convention 3 — Spec §6e margin note NO-OP**: spec §6e states *"The 2025 form shows a margin note beside line 22 for taxpayers who checked a box on line 12a, 12b, 12c, or 12d. That note does **not** change the line-22 formula itself."* Code at line 19594 contains NO special-case branching for line 12 box flags — the margin note is presentational only; line 22 arithmetic is uniform regardless of line 12 box state. Confirmed in 22 META-AUDIT consistency check (h). **Convention 4 — safeAmount null-as-zero coercion**: `safeAmount(tac.getTotalTaxBeforeCredits())` at line 19593 + `safeAmount(line20)` was applied earlier at line 19589 when computing local line21. Both operands of the subtraction are null-safe. **No new breadcrumb** — 4 conventions self-documenting in 3-line code block + spec §6 + §8 + 20 #6 sub-verification 3 already provides 3-source coverage. **Coverage cross-references**: spec §6a + §6b + §6e + §8 + 20 #6 sub-verification 3 + lock-in test at TaxReturnComputeServiceTest.java:24215. Pure verification closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:19592-19595 (3-line code block; 4 conventions self-documenting); spec §6a (zero-floor) + §6b (floor at 22 not 21) + §6e (margin note no-op) + §8 (always-set, ≤ line18, ≥ 0); TaxReturnComputeServiceTest.java:24215 (★ primary direct floor assertion)',
    'CLOSED — verified correct. 4 conventions confirmed: zero-floor MANDATORY (line 19594; lock-in test confirms; ★ also THE structural defense per 22 #7) + ALWAYS-SET (line 19595 unconditional; distinct from line 20/21/24 — three distinct null-handling conventions in same method) + spec §6e margin note NO-OP (no special-case branching for line 12a/b/c/d boxes) + safeAmount null-as-zero coercion (both operands wrapped — line 18 at 19593, line 21 at 19589 upstream). 3-source coverage already exists for all 4 conventions. No new breadcrumb. ★ Line 22 has +1 convention vs. line 21 (4 vs. 3) due to floor responsibility.'],

  [9, 'RESOLVED 2026-05-15 — ⚠️ BUNDLED OBSERVATIONS — 3 deferred-scope observations (19th Path A application; ★ 23 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS; ★ 6th CONSECUTIVE AUDIT WITH ZERO NEW GAPS; ★ 3rd consecutive credits-section audit with missing-diagrams cosmetic gap)',
    '**Closure intent**: pure xlsx-flip observation bundle — **NO code change**; **NO outstanding.md entry** (anti-fragmentation policy). THREE observations bundled — all share same "documented + deferred / informational / cosmetic; not blocking real returns in current scope" rationale. **(a) Missing `diagrams/22.drawio` data-flow diagram** — `flowcharts/22.drawio` exists; data-flow does NOT; same pattern as 20 #9 (b) + 21 #9 (a) — recurring cosmetic gap pattern across credits-section audits. Line 22\'s data flow is trivial (2 inputs → 1 subtraction → floor at 0 → line 24 + line 31 consumers); 20 #6 sub-verification 3 breadcrumb provides textual equivalent. Cosmetic gap; deferred. **(b) G2 INFORMATIONAL — no Java unit test named specifically for line 22** — primary direct floor assertion lives in `line21_line22FlooredAtZeroWhenCreditsAbsorbAllTax` test (TaxReturnComputeServiceTest.java:24215; added 2026-04-19 per line 21 G1 fix; happens to be the de facto line 22 floor test despite naming). Per knowledge §7 G2: "Existing coverage is adequate; naming is a discoverability concern only." Recommended action: optionally rename or add `line22_*` named tests. INFORMATIONAL gap; deferred. **(c) Line 24 audit upcoming as 3rd META-AUDIT** — line 24 (TOTAL TAX = line 22 + line 23) is similarly inline in computeLine20ThroughLine24 at ~line 19599-19600; coverage already at 20 #6 sub-verification 4 (★★ TOTAL TAX anchor with ZERO-when-zero convention documented); likely 3rd META-AUDIT with dependencies+knowledge §0 signature (or possibly spec §0 banner; TBD at line 24 audit start). Per 21 #9 observation (b): batching opportunity with line 22 was considered; user explicitly requested line 22 as its own audit, so batching deferred again to line 24 start. **★ Anti-fragmentation policy applied** — observations only; no fixes today; no outstanding.md entry. **19th PATH A APPLICATION** (after 18 prior in workflow). **★ Streak extends 22 → 23 consecutive zero-outstanding walkthroughs** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18/19/20/21/22). **★ ZERO NEW GAPS surfaced** — 6th consecutive audit (line 17 was last with new gaps; 18 + 19 + 20 + 21 + 22 all zero); line 22 had 2 prior gaps G1 + G2; G1 was ★ ALREADY FIXED (drift resolved in 22 #4); G2 INFORMATIONAL deferred. Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'diagrams/22.drawio (missing — cosmetic; same as 20 #9 (b) + 21 #9 (a) — recurring pattern); knowledge §7 G2 (INFORMATIONAL — no named line22 test; deferred); future line 24 audit (3rd META-AUDIT candidate; batching opportunity)',
    'CLOSED — pure observation bundle. **19th Path A application**; ZERO NEW GAPS surfaced (6th consecutive); **★ 23 consecutive zero-outstanding walkthroughs** (extends first 20-streak by 3). 3 observations: missing diagrams/22.drawio cosmetic (★ 3rd consecutive credits-section audit with this gap — emerging workflow signature; potential one-shot cleanup candidate for lines 20-24) + G2 INFORMATIONAL no-named-line22-test deferred + line 24 audit upcoming as 3rd META-AUDIT (batching opportunity deferred from 21 #9). No outstanding.md entry per anti-fragmentation policy.'],

  [10, 'RESOLVED 2026-05-15 — BOUNDARY MILESTONE — Line 22 walkthrough complete at 10/10; FOURTH CREDITS-SECTION AUDIT; ★ SECOND META-AUDIT IN WORKFLOW (DIFFERENT doc-trail signature); ★ 9 DOC-DRIFT FIXES (new DRIFT SHAPE); ★ 23 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS; ★ 6th CONSECUTIVE AUDIT WITH ZERO NEW GAPS; ★ 12th CONSECUTIVE SINGLE-ROW LOG; ★ 11 ANTI-DUPLICATION APPLICATIONS; ★ 3rd CONSECUTIVE Legacy A migration with ZERO history.md hits',
    'Pure xlsx-flip + Verification log finalization — **CLOSES the 22 walkthrough at 10/10**. TWO file touches: (a) this row flipped to RESOLVED; (b) lines/22.md §12 Verification log row finalized IN-PROGRESS → **COMPLETE — 10/10 closed**. **Eight themes**: (1) **Structural positioning** — 9th audit OUTSIDE 13ab pair; FOURTH credits-section audit (after lines 19 + 20 + 21); ★ NEAR-SIMPLEST credits-section line — pure single-operator subtraction with floor (line 22 = max(0, line 18 − line 21)); no decision tree; no reference data; no orchestrator. (2) **★ MFS-guard cascade UNCHANGED at 20 orchestrators** — 14th defensive-gap-NOT-needed Issue #1 in workflow (computeLine20ThroughLine24 inline-computed; no per-spouse parameters; pure transitive inheritance from line 18 + line 21). (3) **★ SECOND META-AUDIT in workflow** (Issue #5) with DIFFERENT doc-trail signature than first — line 22 META-AUDIT signature = dependencies+knowledge §0 banners (NO spec §0 banner); line 21 META-AUDIT signature = spec §0 banner. ★ Establishes META-AUDIT category has TWO sub-types; pattern robust across both. (4) **★ 9th DOCUMENTATION DRIFT FIX** (Issue #4) with ★ NEW DRIFT SHAPE — first instance of "documented-gap-was-actually-already-fixed" (vs. prior 8 which were "code-fixed-but-stale-doc"); G1 retries:1 was already fixed but docs weren\'t updated. (5) **Knowledge convergence advances 27 → 28 lines** (Issue #2: 15th Legacy A migration; ★ likely 3rd consecutive with zero history.md hits). (6) **★ 11 ANTI-DUPLICATION applications** — Issue #6 was 11th application; ★ also 4-SOURCE coverage achieved (spec + dependencies + 20 #6 sub-verification 3 + 21 #8) — exceeds standard 3-source rule. (7) **Anti-fragmentation continues — 19th Path A application** (Issue #9: 3-observation bundle including line 24 batching deferral). (8) **★ ZERO NEW gaps surfaced** — 6th consecutive audit (17 + 18 + 19 + 20 + 21 + 22) with no new gaps; line 22 had 2 prior gaps G1 + G2; G1 was ★ ALREADY FIXED (drift resolved in 22 #4); G2 INFORMATIONAL deferred. **Cumulative state through line 22**: **48 lines audited** (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + 11b + 12a + 12b + 12c + 12d + 12e + 13a + 13b + 14 + 15 + 16 + 17 + 18 + 19 + 20 + 21 + **22**); **477 audit issues closed total** (467 + 10); backend **765/765 pass** (UNCHANGED — pure documentation closure; no new tests this audit; 3 G1-fix tests from 2026-04-19 verify line 22 indirectly); MFS cascade = **20 orchestrators** (unchanged — line 22 inline-computed; defensive-gap-NOT-needed); knowledge convergence = **28 lines (+1)**; dependencies files = 43 (unchanged); **★ 9 documentation drift fixes** across workflow (+1 from 22 #4; ★ NEW DRIFT SHAPE — first "documented-gap-already-fixed" instance); 19 Path A applications (+1 from 22 #9); **★ 11 anti-duplication applications** (+1 from 22 #6); 2 SEEDED → VERIFIED CORRECT upgrades (unchanged); 2 terminal seeds at orchestrators (unchanged); 0 NEW gaps surfaced (6th consecutive); **★ 2 META-AUDITS** (+1 from 22 #5 — DIFFERENT doc-trail signature). **★ 23 CONSECUTIVE WALKTHROUGHS WITH ZERO NEW OUTSTANDING.MD ENTRIES** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18/19/20/21/**22**). **Verification logs**: 2ab (4) + 3abc (3) + 4abc (3) + 5abc (3) + 6abcd (4) + 7ab (2) + 8 (1) + 9 (1) + 10 (1) + 11ab (2) + 12abcde (5 — LARGEST) + 13ab (2) + 14 (1) + 15 (1) + 16 (1) + 17 (1) + 18 (1) + 19 (1) + 20 (1) + 21 (1) + **22 (1 — single-line shape; ★ 12th CONSECUTIVE single-row log)**. **Looking ahead — line 23 (Other taxes from Schedule 2)**: 10th audit OUTSIDE 13ab pair; FIFTH credits-section audit; ★ FIRST audit OUTSIDE same-method-as-20-21-22-24 territory (line 23 lives in finalizeSchedule2OtherTaxes, NOT in computeLine20ThroughLine24); line 23 likely heavier audit shape than 21/22 due to Schedule 2 aggregation complexity. Alternative: **line 24 audit** (TOTAL TAX) — likely 3rd META-AUDIT; per 21 #9 observation (b) batching opportunity with line 22 was deferred; user can choose line 23 OR line 24 next.',
    'XLS/computations/22.xlsx audit-trail (this row); lines/22.md §12 Verification log row FINALIZED to COMPLETE — 10/10 closed; knowledge file renamed via 22 #2 (Legacy A); doc drift fixed via 22 #4 (G1; 9th doc-drift; NEW DRIFT SHAPE); META-AUDIT consistency confirmed via 22 #5 (2nd META-AUDIT; different doc-trail signature)',
    'CLOSED — 10/10. **48 lines audited; 477 issues; 765/765 backend (UNCHANGED — no new tests this audit); 20 orchestrators (UNCHANGED); 28-line knowledge convergence; ★ 23 consecutive zero-outstanding walkthroughs; ★ 6th consecutive ZERO NEW GAPS; ★ 9 documentation drift fixes (+1 from 22 #4; ★ NEW DRIFT SHAPE); 19 Path A applications; ★ 11 anti-duplication applications; ★ 12th consecutive single-row log; ★ 2 META-AUDITS (FIRST + SECOND with different doc-trail sigs); ★ 3rd CONSECUTIVE Legacy A migration with ZERO history.md hits**. FOURTH credits-section audit; NEAR-SIMPLEST credits-section line (pure subtraction with floor). Next: line 23 (Schedule 2 other taxes; first audit OUTSIDE same-method territory) OR line 24 (TOTAL TAX; likely 3rd META-AUDIT; batching opportunity deferred from 21 #9 + 22 #9).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 120 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 22 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.taxAndCredits.taxAfterCredits', 'Form 1040 page 2, line 22 (PDF key line22_tax_less_credits; AcroForm f2_14[0])', 'XLS/output_forms/form-tax-return-1040.xlsx', '★ CANONICAL line 22 output. = max(0, nz(line18) − nz(line21)). BigDecimal whole-dollar HALF_UP via roundMoney. ★ ALWAYS-SET (never null) — distinct from line 20 + 21 (null-when-zero) and line 24 (ZERO-when-zero). PDF cell shows "0" not blank when zero.'],
  [],
  ['SAME-METHOD DOWNSTREAM (★★) — computed in `computeLine20ThroughLine24`'],
  ['form1040.taxAndCredits.totalTax', 'Form 1040 page 2, line 24 (PDF key line24_total_tax)', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ TOTAL TAX FINAL = line 22 + line 23 (Schedule 2 line 21 otherTaxes). The return\'s most important output field. Line 22 is the dominant contributor (line 23 often zero). ZERO-when-zero convention.'],
  [],
  ['CROSS-METHOD CONSUMERS'],
  ['Reads tac.getTotalTax() (line 24)', 'computeLine31ThroughLine38 at ~line 19617', 'TaxReturnComputeService.java', 'Withholding chain + refund/owed calculations read totalTax. Line 22 affects this transitively via line 24.'],
  ['Reads tac.getTotalTaxBeforeCredits() + tac.getTotalTax()', 'computeForm2210', 'TaxReturnComputeService.java', 'Underpayment penalty calculation. Line 22 affects line 24 transitively. Note: dependencies/22.md flags "rules.md mentions line 22 but actual field read is totalTaxBeforeCredits."'],
  ['Reads tac.getTaxAfterCredits() for PDF export', 'form-tax-return-1040.component.ts line 327', 'us-tax-ui', '`values[\'line22_tax_less_credits\'] = formatAmount(form.taxAndCredits?.taxAfterCredits);` ★ When zero, formatAmount(0) renders "0" — matches IRS instruction "enter -0-".'],
  [],
  ['CONDITIONAL ATTACHMENTS'],
  ['(None directly triggered by line 22)', '—', '—', 'Line 22 itself triggers no attachments. Schedule 8812 (line 19 input) + Schedule 3 (line 20 input) + Schedule 2 (line 23 consumer of line 22 at line 24) attached based on their own upstream conditions.'],
  [],
  ['NOT IN OUTPUT (deliberate exclusions per spec §6c-§6d)'],
  ['Refundable credits (lines 27a, 28, 29, 30, 31)', '—', '—', 'Spec §6d explicitly excludes refundable credits from line 22. Those land on lines 25-33 (payments territory).'],
  ['Line 23 other taxes', '—', '—', 'Spec §6c — other taxes add at line 24 (line 22 + line 23 = line 24), not at line 22.'],
  ['Withholding + estimated payments', '—', '—', 'Spec §6d — land on lines 25-26 (payments territory).'],
  ['Line 12a/12b/12c/12d margin-note special handling', '—', '—', 'Spec §6e — margin note is presentational only; does not alter line 22 arithmetic.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 60 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
