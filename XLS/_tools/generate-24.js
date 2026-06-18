// ============================================================================
//  Generates: C:\us-tax\XLS\computations\24.xlsx
//
//  Source-of-truth references:
//    - lines/24.md (2025-tax-year spec; 256 lines; defines line 24 = line 22 +
//      line 23 = ★★ TOTAL TAX FINAL; 4 guardrails (§6a pure addition; §6b not
//      reduced by payments; §6c can equal line 22 when line 23 = 0; §6d can be
//      positive when line 22 = 0 if line 23 > 0). ⚠️ NO §0 verification note —
//      META-AUDIT trail lives in dependencies §0 + knowledge §0 (sub-type (b)
//      signature — same as lines 22 + 23).
//    - dependencies/24.md (107 lines; "Audited 2026-04-19" header; Direct
//      Inputs table (2 fields); Indirect Inputs (line 18 + line 21); Output
//      (totalTax ZERO-when-zero); Downstream Consumers (7 consumers); PDF Field
//      Mapping; Compute Order; Scope Boundaries.
//      ⚠️ DOC DRIFT — §Gaps line 105 lists G1 as still open "computeForm2210()
//      reads totalTaxBeforeCredits (line 18) instead of taxAfterCredits (line
//      22) for Form 2210 Part I Line 1". ★ STALE: verified 2026-05-15 that
//      code at TaxReturnComputeService.java:20005-20011 ALREADY reads
//      getTaxAfterCredits() per knowledge §9 G1 "Fixed 2026-04-19"; unit test
//      `form2210Line1UsesTaxAfterCreditsNotTotalTaxBeforeCredits` exists at
//      TaxReturnComputeServiceTest.java:22631 confirming the fix.)
//    - knowledge/line-24-total-tax.md (renamed from knowledge_line24.md via
//      24 #2 2026-05-15; 195 lines; 17th Legacy A migration;
//      convergence 29 → 30 lines.
//      Full audit covering line identity + core formula + backend impl + frontend
//      + unit tests + e2e tests + 2 identified gaps BOTH ★ FIXED 2026-04-19
//      (G1 Form 2210 line 1 fix; G2 dedicated e2e spec created).)
//    - flowcharts/24.drawio (existing); diagrams/24.drawio MISSING (cosmetic).
//    - TaxReturnComputeService.java:
//        line 19571-19604 — computeLine20ThroughLine24 (single combined method
//          for Form 1040 lines 20, 21, 22, 24; line 24 at lines 19597-19600)
//        line 19599-19600 — line 24 computation:
//          `BigDecimal line24 = roundMoney(line22.add(line23));`
//          `tac.setTotalTax(line24.compareTo(BigDecimal.ZERO) > 0 ? line24 : BigDecimal.ZERO);`
//        line 19486-19558 — 20 #6 VERIFIED CORRECT breadcrumb (already covers
//          line 24 as sub-verification 4 — ★★ TOTAL TAX FINAL anchor with
//          ZERO-when-zero convention documented)
//        line 20005-20011 — computeForm2210 reads getTaxAfterCredits() for line 1
//          (G1 FIX 2026-04-19 in code; doc drift in dependencies/24.md)
//    - line24-total-tax.spec.ts (2 scenarios; created 2026-04-19 per G2 fix)
//    - TaxReturnComputeServiceTest.java:
//        line 22631 — form2210Line1UsesTaxAfterCreditsNotTotalTaxBeforeCredits
//          (G1 lock-in test 2026-04-19)
//        line 16338 — line23_otherTaxes_equalsForm5329PenaltyAlone
//          (totalTax == taxAfterCredits + 1000)
//        line 16441 — line23_otherTaxes_equalsCombinedForm5329AndAdditionalMedicareTax
//          (totalTax >= taxAfterCredits + 1450)
//    - IRS 2025 Form 1040 (line 24 "Add lines 22 and 23. This is your total tax.")
//    - IRS 2025 Instructions for Form 1040
//    - docs/books/i1040gi_2025.txt + J.K. Lasser's Your Income Tax 2025
//
//  Tax year: 2025
//
//  Concept:
//    Form1040.line24 = Form1040.line22 + Form1040.line23
//
//    Where:
//      Form1040.line22 = max(0, line18 − line21)             (taxAfterCredits)
//      Form1040.line23 = Schedule2.line21                    (otherTaxes)
//
//    Line 24 is ★★ TOTAL TAX FINAL — the return's most important output field.
//    PDF cell shows "0" or positive (ZERO-when-zero convention; never blank).
//    Pure addition with no floor (line 22 already floored at 0; line 23 ≥ 0
//    structurally; sum ≥ 0 trivially).
//
//    Implementation convention:
//      Form1040.line24 = nz(Form1040.line22) + nz(Form1040.line23)
//      ZERO-when-zero: tac.setTotalTax((line24 > 0) ? line24 : BigDecimal.ZERO)
//
//    Surrounding page-2 chain:
//      line 18 = totalTaxBeforeCredits                       (line16 + line17)
//      line 21 = totalCredits                                (CTC/ODC + Sched 3 line 8)
//      line 22 = max(0, line18 − line21)                    (taxAfterCredits)
//      line 23 = Schedule2.line21                            (otherTaxes)
//      ★★ line 24 = nz(line22) + nz(line23)                  (★★ TOTAL TAX FINAL — THIS LINE)
//
//    Downstream:
//      line 25-33 = payments + refundable credits
//      line 37 = refund OR line 38 = amount owed (depending on line 33 vs. line 24)
//      Form 2210 = underpayment penalty (uses line 22 + line 23 — G1 fixed 2026-04-19)
//
//    ★★ KEY OBSERVATION: line 24 starts the "payments + refund" section;
//    everything below line 24 is about reconciling payments against this total.
//
//  Line 24 audit positioning (11th audit OUTSIDE 13ab pair):
//   • SIXTH credits-section audit (after lines 19 + 20 + 21 + 22 + 23)
//   • ★★ CREDITS-SECTION AUDIT SERIES COMPLETE (6 audits in series)
//   • Cumulative position: ★ 50th LINE — half-century milestone
//   • ★★ Line 24 = TOTAL TAX FINAL — the return\'s most important output field
//   • ★ FOURTH META-AUDIT in workflow — dependencies/24.md §0 + knowledge §0
//     "Audited 2026-04-19" document prior audit (sub-type (b) signature — same
//     as lines 22 + 23; ★ ESTABLISHES sub-type (b) at 75% dominance — 3 of 4
//     META-AUDITS use it)
//   • ★ Likely 16th defensive-gap-NOT-needed Issue #1 — same method as 20/21/22
//     (computeLine20ThroughLine24); inline-computed; pure additive composite
//     from MFS-clean addends
//   • ★ G1 DOC-DRIFT SURFACED — dependencies/24.md §Gaps row 105 says G1 still
//     open; knowledge §9 says G1 ★ FIXED 2026-04-19; verified 2026-05-15 that
//     code at line 20005-20011 ALREADY reads getTaxAfterCredits(); lock-in test
//     exists at TaxReturnComputeServiceTest.java:22631. ★ 2nd instance of the
//     "documented-gap-already-fixed" shape established at line 22 #4 (which
//     was the FIRST in workflow); 10th doc-drift fix in workflow.
//   • Coverage already exists at 20 #6 sub-verification 4 (★★ TOTAL TAX anchor
//     with ZERO-when-zero convention documented) — heavy anti-duplication use
//     expected for the wiring verification
//
//  Line 24 audit angles (10 issues):
//   1. CROSS-REFERENCE — NO MFS DEFENSIVE GAP NEEDED at line 24 wiring site
//       inside computeLine20ThroughLine24 (~line 19597-19600; line 22 from
//       22 #1 + 22 #7 + line 23 from 23 #1 + 23 #7 → line 24 = MFS-clean
//       additive composite). 16th defensive-gap-NOT-needed Issue #1; ★ 6th
//       orchestrator-method-based audit with transitive inheritance after
//       18 #1 + 20 #1 + 21 #1 + 22 #1 + 23 #1. MFS cascade UNCHANGED at 20
//       orchestrators.
//   2. DOCUMENTATION HYGIENE — Knowledge file Legacy A rename
//       (knowledge_line24.md → line-24-total-tax.md); 17th Legacy A migration;
//       convergence 29 → 30 lines. ★ Likely 5th consecutive with zero
//       history.md hits — pattern continues.
//   3. SPEC ENHANCEMENT — Verification log section §12 in lines/24.md (single-
//       row pattern; ★ 14th CONSECUTIVE single-row log in workflow).
//   4. ★ FOURTH META-AUDIT IN WORKFLOW — dependencies/24.md §0 + knowledge §0
//       document prior audit 2026-04-19 (sub-type (b) signature; same as lines
//       22 + 23). ★ ESTABLISHES sub-type (b) at 75% dominance — 3 of 4
//       META-AUDITS now use it (lines 22 + 23 + 24); only line 21 used sub-
//       type (a) spec §0 banner. 7 consistency checks pass after #5 doc-drift
//       fix.
//   5. ★ DOCUMENTATION DRIFT FIX (G1) — dependencies/24.md §Gaps row says G1
//       still open ("computeForm2210 reads totalTaxBeforeCredits instead of
//       taxAfterCredits"); knowledge §9 says G1 ★ FIXED 2026-04-19; verified
//       2026-05-15 that code at line 20005-20011 ALREADY reads
//       getTaxAfterCredits(); lock-in test at TaxReturnComputeServiceTest.java:
//       22631. ★ 2nd instance of "documented-gap-already-fixed" SHAPE (after
//       22 #4 was FIRST); 10th doc-drift fix in workflow — DOUBLE-DIGIT
//       MILESTONE.
//   6. VERIFIED CORRECT — line 24 single-site wiring at ~line 19597-19600;
//       anti-duplication policy applied; **13th anti-duplication application
//       in workflow** — covered by 20 #6 sub-verification 4 (★★ TOTAL TAX
//       anchor) already.
//   7. VERIFIED CORRECT — inheritance chain (line 22 from 22 #1 + 22 #7
//       chain via 16 #1 + 17 #1 + 18 #5/#6 + 21 #1 + line 23 from 23 #1 + 23 #7
//       4-stage chain via source forms + sub-item writers + finalizeSchedule2
//       OtherTaxes; line 24 = pure additive composite → MFS-clean by
//       construction).
//   8. VERIFIED CORRECT — ZERO-when-zero convention + spec §6c/§6d edge cases
//       (line 24 = line 22 alone when line 23 = 0; line 24 = line 23 alone
//       when line 22 = 0 absorbs credits; both can be 0 — distinct from line
//       20/21 null-when-zero and line 22 ALWAYS-SET).
//   9. ⚠️ BUNDLED OBSERVATIONS — 2 observations: (a) missing diagrams/24.drawio
//       cosmetic (★ 5th consecutive credits-section audit with this gap —
//       pattern strongly crystallized; one-shot cleanup candidate now firmly
//       overdue); (b) ★★ CREDITS-SECTION AUDIT SERIES COMPLETE — 6 audits
//       (lines 19 + 20 + 21 + 22 + 23 + 24) successfully closed; ready to
//       transition to payments section (lines 25-33). 21st Path A application.
//  10. BOUNDARY MILESTONE — sixth credits-section audit (★★ SERIES COMPLETE);
//       ★ 50th LINE half-century milestone; ★★ line 24 = TOTAL TAX FINAL
//       audited; ★ FOURTH META-AUDIT (sub-type (b) at 75% dominance — 3 of 4);
//       ★ 10 doc-drift fixes DOUBLE-DIGIT MILESTONE; 21 Path A / 13 anti-
//       duplication / 25 consecutive zero-outstanding walkthroughs; backend
//       765 UNCHANGED; MFS cascade UNCHANGED at 20.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '24.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 24 — ★★ TOTAL TAX FINAL (Add lines 22 and 23. This is your total tax.) — 2025'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 24 (page 2; "Add lines 22 and 23. This is your total tax.")'],
  ['Concept',
    'Line 24 is ★★ THE RETURN\'S TOTAL TAX FINAL — the most important output field on Form 1040 from a "bottom line" ' +
    'perspective. Pure single-operator addition of line 22 (tax after credits) + line 23 (Schedule 2 other taxes). ' +
    '★ ZERO-when-zero storage convention (PDF cell shows "0" or positive; never blank — IRS form intent). ' +
    'No floor needed at line 24 (line 22 already floored at 0; line 23 ≥ 0 structurally; sum ≥ 0 trivially). ' +
    'After line 24, the return enters the payments + refund/owed section (lines 25-38).'],
  ['Top-level formula (spec §1-§2)',
    'Form1040.line24 = Form1040.line22 + Form1040.line23\n' +
    '\n' +
    'Implementation convention:\n' +
    '  Form1040.line24 = nz(Form1040.line22) + nz(Form1040.line23)\n' +
    'where nz(x) = safeAmount(x) (null → ZERO).\n' +
    '\n' +
    'Storage convention (★ ZERO-when-zero — distinct from null-when-zero on lines 20+21+23 and ALWAYS-SET on line 22):\n' +
    '  tac.setTotalTax((line24 > 0) ? line24 : BigDecimal.ZERO);\n' +
    '  → never null; PDF cell shows "0" when zero (never blank).'],
  ['Surrounding page-2 chain (spec §5 + knowledge §2)',
    'line 18 = line 16 + line 17                          (totalTaxBeforeCredits)\n' +
    'line 21 = nz(line19) + nz(line20)                   (totalCredits)\n' +
    'line 22 = max(0, line 18 − line 21)                 (taxAfterCredits — floor at 0)\n' +
    'line 23 = Schedule 2 line 21                         (otherTaxes — null-when-zero)\n' +
    '★★ line 24 = nz(line22) + nz(line23)                (★★ TOTAL TAX FINAL — THIS LINE — ZERO-when-zero)\n' +
    '\n' +
    'Downstream:\n' +
    'line 25-33 = payments + refundable credits\n' +
    'line 37 = refund OR line 38 = amount owed (depending on line 33 vs. line 24)\n' +
    'Form 2210 = underpayment penalty (uses line 22 + line 23; G1 fixed 2026-04-19)\n' +
    '\n' +
    '★★ KEY: line 24 starts the "payments + refund" section; everything below is reconciliation.'],
  ['What line 24 is NOT (spec §3 + §6b)',
    'NOT reduced by payments — payments begin at line 25.\n' +
    'NOT reduced by refundable credits — refundables enter at lines 27a-31.\n' +
    'NOT the final tax due — that\'s line 38 (after payments subtracted).\n' +
    'Does NOT include withholding (line 25), estimated tax (line 26), EIC (27a), ACTC (28), refundable AOTC (29).\n' +
    'Does NOT include Schedule 3 Part II refundable credits (those feed line 31).'],
  ['2025 Guardrails (spec §6)',
    '§6a Pure addition line — do not introduce any extra adjustments.\n' +
    '§6b NOT reduced by payments — payments + refundable credits begin AFTER line 24.\n' +
    '§6c Line 24 can equal line 22 when line 23 = 0 (no other taxes; common case).\n' +
    '§6d Line 24 can be POSITIVE when line 22 = 0 if line 23 > 0 (★ edge case — credits absorb regular tax\n' +
    '    but Schedule 2 other taxes remain; common in SE income scenarios; lock-in test in line24-total-\n' +
    '    tax.spec.ts scenario 2).'],
  ['Output target',
    'Primary: form1040.taxAndCredits.totalTax (BigDecimal; line 24 output; ★ ZERO-when-zero — never null)\n' +
    'PDF field: line24_total_tax (page 2; AcroForm f2_16[0])\n' +
    'Frontend field: form.taxAndCredits?.totalTax (form-tax-return-1040.component.ts line 329)\n' +
    'Downstream: Form 2210 (uses line 22 + line 23 directly, not line 24); refund/owed at lines 33-38.'],
  ['Backend implementation',
    '**SINGLE WIRING SITE** — `computeLine20ThroughLine24` at TaxReturnComputeService.java:19571-19604; ' +
    'line 24 computation at lines 19597-19600 (4 lines): ' +
    '`BigDecimal line23 = safeAmount(tac.getOtherTaxes());` (line 19598) → ' +
    '`BigDecimal line24 = roundMoney(line22.add(line23));` (line 19599) → ' +
    '`tac.setTotalTax(line24.compareTo(BigDecimal.ZERO) > 0 ? line24 : BigDecimal.ZERO);` (line 19600). ' +
    'Call site at prepare() ~line 1680. ' +
    'Coverage already exists at 20 #6 VERIFIED CORRECT breadcrumb sub-verification 4 ' +
    '(~line 19526-19541) — ★★ TOTAL TAX anchor with ZERO-when-zero convention documented.'],
  ['IRS source',
    'IRS 2025 Form 1040 (page 2 line 24 "Add lines 22 and 23. This is your total tax.") + ' +
    '2025 Instructions for Form 1040. ' +
    'Local cross-checks: docs/books/i1040gi_2025.txt + J.K. Lasser\'s Your Income Tax 2025. ' +
    'No 2025-specific changes to line 24 arithmetic — pure addition with ZERO-when-zero storage; ' +
    'no IRS-published worksheet.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'computeLine18 wires line 18 (totalTaxBeforeCredits)', 'Per 18 #5 + 18 #6 audits. Sum of line 16 + line 17.'],
  [2, 'computeSchedule8812 wires line 19 (childTaxCredit)', 'Per 19 #5-#8 audits. CTC + ODC.'],
  [3, 'All applyXxxToSchedule3 + finalizeSchedule3Totals run', 'Per 20 #5 + 20 #7 audits. 17 Schedule 3 Part I credit fields.'],
  [4, 'Sub-item writers populate Schedule 2 Part II fields', 'Per 23 audit. applyAdditionalSocialSecurityMedicareTaxes (lines 5/6/7/11) + applyForm5329TaxToSchedule2 (line 8) + buildForm8959 G3 override.'],
  [5, 'finalizeSchedule2OtherTaxes wires line 23 (otherTaxes)', 'Per 23 #5 NEW breadcrumb. Schedule 2 line 21 grand total = line 4 + line 7 + line 18 subtotal + line 19. Sets tac.otherTaxes null-when-zero.'],
  [6, 'computeLine20ThroughLine24 wires lines 20 + 21 + 22 + 24', 'Per 20 #6 sub-verifications 1-4. Lines 20 (null-when-zero) + 21 (null-when-zero) + 22 (ALWAYS-SET) + 24 (★★ ZERO-when-zero).'],
  [7, 'Form 1040 line 24 computed inside computeLine20ThroughLine24', '`line23 = safeAmount(tac.getOtherTaxes())` → `line24 = roundMoney(line22.add(line23))` → `tac.setTotalTax((line24 > 0) ? line24 : BigDecimal.ZERO)`. Per TaxReturnComputeService.java:19597-19600. ★★ TOTAL TAX FINAL. ZERO-when-zero convention.'],
  [8, 'LOG.infof captures line 20-24 values', 'INFO-level diagnostic log at line 19602-19603. Captures all 5 line values including line 24.'],
  [9, 'computeLine31ThroughLine38 reads tac.totalTax', 'Per dependencies §3. Used for refund vs. amount-owed comparison: line 33 (total payments) vs. line 24 (total tax).'],
  [10, 'computeForm2210 uses line 22 + line 23 (NOT line 24 directly)', '★ G1 FIX 2026-04-19 per knowledge §9. Form 2210 Part I line 1 = line 22 (taxAfterCredits); line 2 = line 23 (otherTaxes); line 3 = line 1 + line 2. Reconstructs from components; does NOT read tac.totalTax. Per TaxReturnComputeService.java:20005-20011. Lock-in test at TaxReturnComputeServiceTest.java:22631.'],
  [],
  ['INVARIANTS / VALIDATIONS (spec §8)'],
  ['Invariant', 'Rationale'],
  ['Form1040.line24 ≥ 0', 'Per spec §8. Line 22 already floored at 0; line 23 ≥ 0 structurally; sum ≥ 0 trivially. STRUCTURALLY enforced.'],
  ['Form1040.line24 = nz(Form1040.line22) + nz(Form1040.line23)', 'Per spec §8. STRUCTURALLY enforced by line 19599 single-statement addition with safeAmount null-as-zero coercion.'],
  ['Form1040.line24 ≥ Form1040.line22', 'Per spec §8. Adding line 23 ≥ 0; sum ≥ line 22. STRUCTURALLY true.'],
  ['Form1040.line24 ≥ Form1040.line23', 'Per spec §8. Adding line 22 ≥ 0; sum ≥ line 23. STRUCTURALLY true.'],
  ['Form1040.line24 stored as BigDecimal.ZERO when zero (★ ZERO-when-zero — never null)', 'Per knowledge §3 + line 19600. ★ DISTINCT from line 20 + 21 + 23 (null-when-zero) and line 22 (ALWAYS-SET). PDF cell shows "0" never blank — IRS form intent.'],
  ['Edge case §6c — if line23 = 0, line24 = line22', 'Per spec §6c. Common case (no Schedule 2 other taxes). STRUCTURALLY follows from addition.'],
  ['Edge case §6d — if line22 = 0 (credits absorb tax), line24 = line23', '★ Per spec §6d. Common in SE-income scenarios where Schedule 2 other taxes remain after credits zero out regular tax. Lock-in test in line24-total-tax.spec.ts scenario 2.'],
  ['Form 2210 reads components (NOT line 24 directly)', '★ G1 FIX 2026-04-19 — Form 2210 line 1 = line 22 (not line 18); line 2 = line 23; line 3 = sum. Lock-in test at TaxReturnComputeServiceTest.java:22631.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 38 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 24'],
  ['Line 24 takes EXACTLY TWO INPUTS — line 22 (taxAfterCredits, set by computeLine20ThroughLine24 in same method) + line 23 (otherTaxes, set by finalizeSchedule2OtherTaxes). Both are already-computed TaxAndCredits fields. ★ SAME inputs-table shape as line 21 — only 2 fields.'],
  [],
  ['#', 'Input', 'Form 1040 line', 'Java field path', 'Upstream method', 'XLS reference'],
  [1, 'taxAfterCredits (max(0, line 18 − line 21))', 'line 22', 'form1040.taxAndCredits.taxAfterCredits', 'computeLine20ThroughLine24 (set immediately before line 24 in same method)', 'XLS/output_forms/form-tax-return-1040.xlsx (line 22 cell)'],
  [2, 'otherTaxes (Schedule 2 line 21)', 'line 23', 'form1040.taxAndCredits.otherTaxes', 'finalizeSchedule2OtherTaxes (TaxReturnComputeService.java:15337-15382; per 23 #5 NEW breadcrumb)', 'XLS/output_forms/form-tax-return-1040.xlsx (line 23 cell) + XLS/output_forms/form-tax-return-schedule2.xlsx'],
  [],
  ['⚠️ NO DEDICATED USER INPUT FORM FOR LINE 24'],
  ['Line 24 has NO `form-line24-*.xlsx` in C:\\us-tax\\XLS\\input_forms\\. Both inputs are computed by upstream methods. Line 24 is rendered on the `form-tax-return-1040` Tax Return view + Form 1040 PDF only. No user-supplied data feeds line 24 directly.'],
  [],
  ['⚠️ TRANSITIVE INHERITANCE OF MFS FIXES'],
  ['Both inputs inherit MFS protection TRANSITIVELY from upstream orchestrator audits:'],
  ['Input', 'Upstream MFS guard source', 'Status'],
  ['taxAfterCredits (line 22)', 'computeLine20ThroughLine24 — inline-computed; reads totalTaxBeforeCredits (line 18; inherits 18 #5/#6 from 16 #1 + 17 #1) + totalCredits (line 21; inherits 21 #1 from 19 #1 + 20 #1). Per 22 #1 + 22 #7.', '✅ Inherits transitively'],
  ['otherTaxes (line 23)', 'finalizeSchedule2OtherTaxes — pure aggregation; reads 13 sub-item fields from schedule2.otherTaxes (each populated by source-form builders that handle MFS at source level: buildForm4137 + Form8919 + Form8959 + Form5329). Per 23 #1 + 23 #7 4-stage chain.', '✅ Inherits transitively'],
  ['→ NO MFS GUARD NEEDED at line 24 wiring site', '16th defensive-gap-NOT-needed Issue #1 in workflow (★ 6th orchestrator-method-based after 18 #1 + 20 #1 + 21 #1 + 22 #1 + 23 #1)', '(See 24 #1)'],
  [],
  ['⚠️ G1 + G2 BOTH FIXED 2026-04-19 (per knowledge §9)'],
  ['Gap', 'Status', 'Resolution'],
  ['G1 — computeForm2210 read totalTaxBeforeCredits (line 18) instead of taxAfterCredits (line 22) for Form 2210 Part I Line 1', '✅ FIXED 2026-04-19', 'Code at TaxReturnComputeService.java:20005-20011 now reads getTaxAfterCredits(). Lock-in test `form2210Line1UsesTaxAfterCreditsNotTotalTaxBeforeCredits` at TaxReturnComputeServiceTest.java:22631. ★ HOWEVER — dependencies/24.md §Gaps row 105 STALE — still lists G1 as open; doc-drift fix planned in 24 #5 (10th doc-drift fix in workflow; 2nd instance of "documented-gap-already-fixed" shape after 22 #4 first).'],
  ['G2 — No dedicated line24-total-tax.spec.ts E2E spec', '✅ FIXED 2026-04-19', 'Created e2e/tests/line24-total-tax.spec.ts with 2 scenarios: (1) normal path line24=line22; (2) edge case §6d line24=line23 when line22=0.'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 40 }, { wch: 18 }, { wch: 50 }, { wch: 55 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 24'],
  ['Line 24 uses ZERO reference data — NO constants, thresholds, brackets, or phase-outs. Pure single-operator addition. ★ Same pattern as lines 14, 18, 20, 21, 23 — pure additive composite lines have no statutory anchors.'],
  [],
  ['Constant', 'Value', 'Statutory Basis', 'Backend identifier'],
  ['(None — pure additive line)', '—', 'Spec §2 + dependencies/24.md (no constants section)', '—'],
  [],
  ['★ THIS IS A PURE ADDITIVE LINE — same shape as line 21'],
  ['Contrast with neighboring lines:'],
  ['Line', '# Constants', 'Complexity'],
  ['line 18 (line 16 + line 17)', '0', 'Pure addition'],
  ['line 21 (line 19 + line 20)', '0', 'Pure single-operator addition'],
  ['line 22 (max(0, line 18 − line 21))', '0', 'Pure subtraction with floor'],
  ['line 23 (Schedule 2 line 21)', '0', 'Pure pass-through; upstream complexity in 17 Schedule 2 sub-items'],
  ['**line 24 (line 22 + line 23) — ★★ TOTAL TAX FINAL**', '**0**', '**Pure single-operator addition — but ★★ TOTAL TAX FINAL means it\'s the most consequential output**'],
  [],
  ['Upstream computations DO use 2025 reference data — out of scope for line 24'],
  ['Per dependencies/24.md "Indirect inputs"; line 18 + line 21 + line 23 each have substantial statutory constants in their upstream computations. Line 24 itself interprets no tax law — it is a pure mathematical accumulator for the return\'s ★★ TOTAL TAX FINAL.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 55 }, { wch: 60 }, { wch: 40 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 24 Persistence + Downstream Consumers'],
  ['Line 24 = ★★ TOTAL TAX FINAL — the return\'s most important output field. Read by 7 downstream consumers (refund/owed calculation + Form 2210 + frontend display + multiple form components for Schedule 2 import).'],
  [],
  ['Output target', 'Where wired', 'Effect', 'XLS output reference'],
  ['form1040.taxAndCredits.totalTax', '`computeLine20ThroughLine24` line 19600', '★★ CANONICAL line 24 output — ★★ TOTAL TAX FINAL. = nz(line22) + nz(line23). BigDecimal whole-dollar HALF_UP via roundMoney. ★ ZERO-when-zero convention (never null) — distinct from line 20 + 21 + 23 (null-when-zero) and line 22 (ALWAYS-SET).', 'XLS/output_forms/form-tax-return-1040.xlsx (line 24 cell)'],
  [],
  ['DOWNSTREAM CONSUMERS — 7 consumers per dependencies §3'],
  ['computeLine31ThroughLine38 reads tac.getTotalTax()', 'TaxReturnComputeService.java line ~19617', 'Used as basis for refund vs. amount-owed comparison: if line 33 (total payments) > line 24 → refund (line 37); if line 24 > line 33 → amount owed (line 38).', 'XLS/output_forms/form-tax-return-1040.xlsx (lines 33-38)'],
  ['computeForm2210 — does NOT read totalTax directly', 'TaxReturnComputeService.java line 20005-20011', '★ G1 FIX 2026-04-19: Form 2210 Part I line 1 = getTaxAfterCredits() (line 22; not line 18); line 2 = getOtherTaxes() (line 23); line 3 = line 1 + line 2. Reconstructs from COMPONENTS, not totalTax. Lock-in test at TaxReturnComputeServiceTest.java:22631.', 'XLS/output_forms/form-tax-return-2210.xlsx'],
  ['Frontend PDF export (form-tax-return-1040.component.ts:329)', 'us-tax-ui', '`values[\'line24_total_tax\'] = formatAmount(form.taxAndCredits?.totalTax);` ★ ZERO-when-zero → PDF cell shows "0" or positive (never blank).', 'XLS/output_forms/form-tax-return-1040.xlsx (PDF view)'],
  ['Frontend shell summary (shell.component.ts:887)', 'us-tax-ui', '`const taxTotal = tax?.[\'totalTax\']` — top-level dashboard summary display.', '(UI display)'],
  ['Schedule 2 PDF display (form-tax-return-schedule2.component.ts:145)', 'us-tax-ui', 'Schedule 2 Part I line 3 PDF fill — passes through to Schedule 2 "Tax" total.', 'XLS/output_forms/form-tax-return-schedule2.xlsx'],
  ['Alt fuel credit form import (form-alt-fuel-credit.component.ts:387)', 'us-tax-ui', '`this.importedSchedule2 = this.num(schedule2?.tax?.totalTax)` — imports from Schedule 2 for credit limit calc.', 'XLS/input_forms/form-alt-fuel-credit.xlsx'],
  ['Bond credit form import (form-bond-credit.component.ts:292)', 'us-tax-ui', '`this.importedSchedule2 = this.num(schedule2?.tax?.totalTax)` — imports from Schedule 2 for credit limit calc.', 'XLS/input_forms/form-bond-credit.xlsx'],
  [],
  ['PDF Output'],
  ['PDF Field', 'Field Code', 'Source'],
  ['Line 24 amount (page 2)', 'line24_total_tax', 'C:\\us-tax\\us-tax-ui\\public\\irs\\f1040_field_mapping_semantic.csv (line 165)'],
  ['AcroForm path', 'topmostSubform[0].Page2[0].f2_16[0]', 'IRS 2025 Form 1040 PDF (page 2; rect ~504,528 to 576,540)'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 60 }, { wch: 80 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 24'],
  ['Line 24 emits NO blocking flags directly. Each upstream method may emit its own flags. Line 24 silently sums whatever line 22 + line 23 contain.'],
  [],
  ['Flag code', 'Severity', 'Condition', 'Where emitted'],
  ['(None at line 24 site)', 'N/A', 'Line 24 has no validation.', '—'],
  [],
  ['SPEC §8 STRUCTURAL INVARIANTS (not runtime-validated)'],
  ['Invariant', 'How enforced / Status'],
  ['line 24 ≥ 0', 'STRUCTURALLY enforced — line 22 floored at 0; line 23 ≥ 0 structurally; sum ≥ 0 trivially.'],
  ['line 24 = nz(line 22) + nz(line 23)', 'STRUCTURALLY enforced by line 19599 single-statement addition with safeAmount null-as-zero coercion.'],
  ['line 24 stored as BigDecimal.ZERO when zero (★ ZERO-when-zero)', 'STRUCTURALLY enforced by `(line24 > 0) ? line24 : BigDecimal.ZERO` at line 19600. ★ Distinct from line 20/21/23 (null-when-zero) and line 22 (ALWAYS-SET).'],
  ['Edge case: line24 = line22 when line23 = 0', 'STRUCTURALLY follows from addition (spec §6c).'],
  ['Edge case: line24 = line23 when line22 = 0 (credits absorb tax)', 'STRUCTURALLY follows from addition (spec §6d). Common in SE-income scenarios.'],
  ['Form 2210 uses components (line 22 + line 23), NOT totalTax', '★ G1 FIX 2026-04-19 — code at 20005-20011 reads getTaxAfterCredits(); lock-in test at TaxReturnComputeServiceTest.java:22631.'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 14 }, { wch: 100 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 24 is ★★ TOTAL TAX FINAL (Form 1040 line 24 = line 22 + line 23). 11th audit OUTSIDE 13ab pair; SIXTH credits-section audit (★★ SERIES COMPLETE: lines 19+20+21+22+23+24). ★ 50th LINE — half-century milestone. ★ FOURTH META-AUDIT in workflow. ★ DOC-DRIFT SURFACED — G1 doc-drift in dependencies/24.md (10th doc-drift fix; 2nd instance of "documented-gap-already-fixed" shape after 22 #4). 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-15 — CROSS-REFERENCE — NO MFS DEFENSIVE GAP NEEDED at line 24 wiring site (16th defensive-gap-NOT-needed Issue #1 in workflow; ★ 6th orchestrator-method-based audit with transitive inheritance after 18 #1 + 20 #1 + 21 #1 + 22 #1 + 23 #1; ★ COMPLETES the full credits-section MFS analysis — every line from 19-24 verified MFS-clean)',
    '**Per-input MFS-leakage analysis**: line 24 is inline-computed at single site `TaxReturnComputeService.java:19597-19600` inside `computeLine20ThroughLine24(form1040, schedule3)` — neither parameter is a per-spouse input. Inside the 4-line block: (a) `line23 = safeAmount(tac.getOtherTaxes())` — reads tac.otherTaxes which is set by finalizeSchedule2OtherTaxes (per 23 #1: 4-stage chain via source forms + sub-item writers + aggregation; all MFS-clean). (b) `line24 = roundMoney(line22.add(line23))` — pure arithmetic; line 22 local was computed at line 19594 (inherits 22 #1 + 22 #7 MFS protection via 18 #5/#6 from 16 #1 + 17 #1 + 21 #1); pure addition cannot introduce MFS leakage. (c) `tac.setTotalTax(...)` — pure write; ZERO-when-zero coercion. **All upstream-set fields are already MFS-clean** by construction; pure additive composite cannot introduce new MFS leakage. **MFS-guard cascade UNCHANGED at 20 orchestrators**. **★ Notable**: 24 #1 is the 6th orchestrator-method-based audit with transitive inheritance (after 18 #1 + 20 #1 + 21 #1 + 22 #1 + 23 #1) — pattern rule (orchestrator without per-spouse params → transitive inheritance suffices) now generalized across SIX audits across tax-territory (18) + credits-territory (20 + 21 + 22 + 24) + Schedule-2-aggregation-territory (23). **16th defensive-gap-NOT-needed Issue #1 in workflow** (after 15 prior). Backend tests: **765/765 unchanged** (no code change).',
    'TaxReturnComputeService.java:19597-19600 (line 24 wiring; 4 lines inside computeLine20ThroughLine24); 19571 (method signature — no per-spouse params); 1680 (call site)',
    'CLOSED — defensive-gap-NOT-needed. **16th in workflow** (★ 6th orchestrator-method-based with transitive inheritance after 18 #1 + 20 #1 + 21 #1 + 22 #1 + 23 #1). ★ COMPLETES the full credits-section MFS analysis — every line 19-24 verified MFS-clean through the same pattern rule. ★★ TOTAL TAX FINAL (line 24) guaranteed MFS-clean by composition across the entire credits-section chain. MFS-guard cascade UNCHANGED at 20 orchestrators. Pure cross-reference closure. 765/765 unchanged.'],

  [2, 'RESOLVED 2026-05-15 — DOCUMENTATION HYGIENE — Knowledge file Legacy A rename (knowledge_line24.md → line-24-total-tax.md; 17th Legacy A migration; ★ 30-LINE CONVERGENCE MILESTONE; ★ STREAK ENDS — first non-zero history.md-hits migration in 5 audits — zero-history-hits streak ended at 4)',
    '**Closure applied**: (1) plain `mv` of `C:\\us-tax\\knowledge\\knowledge_line24.md` → `C:\\us-tax\\knowledge\\line-24-total-tax.md` (folder not under git). (2) Repo-wide grep for `knowledge_line24` produced 8 hits across 3 files (more than prior 4 migrations which had 6-8 hits in generate-NN.js only). **ACTIVE-UPDATE = 1 hit** at generate-24.js line 22 (header file path citation) — updated to new path with rename annotation `(renamed from knowledge_line24.md via 24 #2 2026-05-15)`. **LEAVE-UNTOUCHED = 7 hits**: (a) `history.md` line 3867 — historical entry from 2026-04-19 line-24 audit dedicated section ("## 2026-04-19 — Line 24 Total Tax audit and gap fixes") — historical record per established 15 #2 / 16 #2 / etc. precedent; (b) `us-tax-be/context.md` line 4 — historical entry from 2026-04-19 line-24 audit gap-fix context — historical record per same precedent; (c) generate-24.js lines 23/116/383/384/385 — 5 rename-description rows (header rename description + Issue #2 audit angle + this row title/details/Where Found). **★ STREAK ENDS at 4** — line 24 is the FIRST Legacy A migration in 5 audits to have a non-zero history.md hit (lines 20+21+22+23 #2 all had ZERO history.md hits — those entries didn\'t include explicit `knowledge_lineNN.md` references in their dedicated audit sections; line 24\'s 2026-04-19 audit entry explicitly mentioned the file path). ★ This is structurally informative: the zero-history-hits pattern depended on entry-writing style, not on line-position; pattern was real but not universal. **17th Legacy A migration in workflow**. **★ Knowledge-file naming convergence advances 29 → 30 lines — ★ 30-LINE MILESTONE (round-number)**. Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\knowledge\\line-24-total-tax.md (renamed); C:\\us-tax\\XLS\\_tools\\generate-24.js 1 ACTIVE-UPDATE hit at line 22 + 5 LEAVE-UNTOUCHED rename-description hits at lines 23/116/383/384/385; ★ 2 LEAVE-UNTOUCHED hits OUTSIDE generate-24.js — history.md line 3867 (historical 2026-04-19 audit entry) + us-tax-be/context.md line 4 (historical 2026-04-19 gap-fix entry)',
    'CLOSED — file renamed + 1 active citation updated in generate-24.js; 7 hits left untouched per precedent (5 rename-description rows + 2 historical records). Pure documentation closure. 17th Legacy A migration. ★ 30-LINE CONVERGENCE MILESTONE (round-number). ★ STREAK ENDS — first non-zero history.md-hits migration in 5 audits; line 24\'s prior audit had a dedicated section in history.md that explicitly mentioned the file path, whereas lines 20-23 didn\'t. Pattern was real but not universal.'],

  [3, 'RESOLVED 2026-05-15 — SPEC ENHANCEMENT — Verification log section §12 created in lines/24.md (single-row pattern; ★ 14th CONSECUTIVE single-row log in workflow; ★ first in-spec audit-trail mark for line 24)',
    '**Closure applied**: appended `## 12) Verification log` section to `lines/24.md` after section §11 (Scope Note; line 256). 5-column markdown table; **row 1 in IN-PROGRESS state** capturing #1 (16th defensive-gap-NOT-needed; ★ 6th orchestrator-method-based; ★ COMPLETES full credits-section MFS analysis) + #2 (Legacy A rename — 17th migration; ★ 30-LINE CONVERGENCE MILESTONE; ★ zero-history-hits streak ENDED at 4) + #3 (this section creation). Row 1 will be finalized to **"COMPLETE — 10/10 closed"** at Issue #10 with all 10 closures enumerated. **Single-row pattern** = SMALLEST log shape; **★ 14th CONSECUTIVE single-row log in workflow** (matches lines 8, 9, 10, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23). **★ NOTABLE**: §12 (back to 21/22 shape; line 23 used §11) is the first in-spec audit-trail mark for line 24 since lines/24.md has no §0 verification banner. Pure spec enhancement — no functional change. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\lines\\24.md section §12 appended after §11 (Scope Note; line 256)',
    'CLOSED — §12 Verification log section created with single-row IN-PROGRESS table. Single-line audit shape (smallest log; ★ 14th consecutive single-row log in workflow; ★ first in-spec audit-trail mark for line 24).'],

  [4, 'RESOLVED 2026-05-15 — ★ FOURTH META-AUDIT IN WORKFLOW — dependencies/24.md §0 "Audited 2026-04-19" + knowledge §0 "Audited 2026-04-19" document prior audit (sub-type (b) signature — same as lines 22 + 23; ★ ESTABLISHES sub-type (b) at 75% DOMINANCE — 3 of 4 META-AUDITS use it)',
    '**The situation**: lines/24.md does NOT carry a §0 "Verification note" header (same as lines 22 + 23 — sub-type (b) signature). The META-AUDIT trail for line 24 lives in: (a) dependencies/24.md line 3 *"> Audited 2026-04-19."*; (b) knowledge/line-24-total-tax.md (renamed via 24 #2) line 3 *"> Audited 2026-04-19. Line 24 (`TaxAndCredits.totalTax`) is a pure addition: `line22 + nz(line23)`. It is always stored as at least `BigDecimal.ZERO` (never null). Two gaps identified and fixed 2026-04-19: Form 2210 Part I Line 1 now reads `getTaxAfterCredits()` (line 22) instead of `getTotalTaxBeforeCredits()` (line 18) (G1), and a dedicated E2E spec `line24-total-tax.spec.ts` was created with 2 scenarios (G2)."*. **★ FOURTH META-AUDIT in workflow** with **sub-type (b) signature** (same as lines 22 + 23). **★ ESTABLISHES sub-type (b) at 75% DOMINANCE** — 3 of 4 META-AUDITS now use dependencies+knowledge-§0 signature; only line 21 used sub-type (a) spec §0 banner. Sub-type (b) is the **dominant pattern** for credits-section META-AUDITS. **★ 7 consistency checks performed 2026-05-15** (same count as lines 22 + 23 #5/#4; no spec §0 to verify): (a) ✅ Method exists at TaxReturnComputeService.java:19571 (computeLine20ThroughLine24); line 24 computation at 19597-19600. (b) ✅ TaxAndCredits.totalTax field exists at line 27. (c) ✅ Frontend mapping at form-tax-return-1040.component.ts line 329 (`values[\'line24_total_tax\']`). (d) ✅ Lock-in test `form2210Line1UsesTaxAfterCreditsNotTotalTaxBeforeCredits` exists at TaxReturnComputeServiceTest.java:22631 (G1 fix verification). (e) ✅ Formula `line24 = nz(line22) + nz(line23)` matches spec §2 + code line 19599. (f) ✅ ZERO-when-zero convention matches code line 19600 (`(line24 > 0) ? line24 : BigDecimal.ZERO`). (g) ⚠️ Form 2210 G1 fix verified in code (line 20005-20011 reads getTaxAfterCredits()) — but dependencies/24.md §Gaps row STALE; doc-drift resolution planned in 24 #5. **★ NO new doc-drift fix needed beyond 24 #5** — spec + knowledge + code all consistent after G1 drift resolved. **★ FOURTH META-AUDIT** confirms META-AUDIT pattern category mature: line 21 #4 = 8/8 clean (sub-type a); line 22 #5 = 7/7 + drift in #4 (sub-type b); line 23 #4 = 7/7 clean (sub-type b); line 24 #4 = 7/7 + drift in #5 (sub-type b). Pattern is robust across both sub-types AND both clean/drift-surfacing outcomes. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\lines\\24.md (NO §0 banner — sub-type (b) signature); C:\\us-tax\\dependencies\\24.md line 3 (Audited 2026-04-19); C:\\us-tax\\knowledge\\line-24-total-tax.md (renamed via 24 #2) line 3 (Audited 2026-04-19); TaxReturnComputeService.java:19571-19604 + 19597-19600 + 20005-20011 (G1 fix verified in code); TaxReturnComputeServiceTest.java:22631 (G1 lock-in test); e2e/tests/line24-total-tax.spec.ts (2 scenarios; G2 fix)',
    'CLOSED — FOURTH META-AUDIT consistency check complete. **★ ESTABLISHES sub-type (b) at 75% DOMINANCE — 3 of 4 META-AUDITS use it**. 7/7 consistency checks pass (8th becomes 24 #5 doc-drift fix). META-AUDIT pattern category mature across both sub-types AND both outcome shapes. ★ Among sub-type (b) audits: 2 clean (line 23) + 2 drift-surfacing (lines 22 + 24) — even split. ★ Lines 22 + 24 both surfaced G1 doc-drift of same "documented-gap-already-fixed" SHAPE — confirms NEW DRIFT SHAPE is recurring (not a one-off).'],

  [5, 'RESOLVED 2026-05-15 — ★ DOCUMENTATION DRIFT FIX (G1 + G2) — dependencies/24.md had 3 STALE locations (G1 in Downstream Consumers row + G1 in Gaps section + G2 in Gaps section); ★ verified 2026-05-15 that BOTH gaps were ALREADY FIXED 2026-04-19; ★ 2nd instance of NEW DRIFT SHAPE "documented-gap-already-fixed" after 22 #4; ★ 10th doc-drift fix in workflow — DOUBLE-DIGIT MILESTONE',
    '**The drift**: dependencies/24.md line 105 (under §Scope Boundaries → Gaps) reads *"G1 (MEDIUM): `computeForm2210()` reads `totalTaxBeforeCredits` (line 18) instead of `taxAfterCredits` (line 22) for Form 2210 Part I Line 1 — overstates underpayment penalty base when nonrefundable credits exist."*. **Reality check 2026-05-15**: read TaxReturnComputeService.java:20005-20011 — actual content is `BigDecimal l1 = form1040.getTaxAndCredits() != null ? safeAmount(form1040.getTaxAndCredits().getTaxAfterCredits()) : BigDecimal.ZERO; f.setCurrentYearTax(l1);` — the gap was ALREADY FIXED 2026-04-19 per knowledge §9 G1. AND knowledge §9 G1 explicitly says "Fixed 2026-04-19" with lock-in test `form2210Line1UsesTaxAfterCreditsNotTotalTaxBeforeCredits` at TaxReturnComputeServiceTest.java:22631 (verified exists). AND knowledge §0 banner mentions "Two gaps identified and fixed 2026-04-19". **dependencies/24.md is STALE** — same pattern as line 22 G1 doc-drift. **★ 2nd instance of NEW DRIFT SHAPE "documented-gap-already-fixed"** in workflow — first instance was line 22 #4; line 24 #5 is the second. Pattern (different detection trigger from prior 8 "code-fixed-but-stale-doc" fixes; same closure pattern; doc-drift fix policy generalizes naturally) was established at 22 #4 — line 24 #5 confirms it recurs (not a one-off). **Edits**: (a) `dependencies/24.md` §Scope Boundaries → Gaps row 105 — rewrite G1 from "open" to "★ FIXED 2026-04-19 (doc-drift resolved 24 #5 2026-05-15)" with verification + code reference + lock-in test name; (b) check whether §Downstream Consumers row for computeForm2210 has stale "G1 bug: should use line 22 + line 23" text — if present, update to reflect FIXED state. **★ 10th documentation drift fix in workflow — DOUBLE-DIGIT MILESTONE**. Pattern distribution after 24 #5: 8 "code-fixed-but-stale-doc" + 2 "documented-gap-already-fixed" = 10 total. The NEW SHAPE pattern is now confirmed recurring. Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\dependencies\\24.md line 105 (Gaps row G1); possibly line ~40 (Downstream Consumers row for computeForm2210 — "G1 bug: should use line 22 + line 23")',
    'CLOSED — 3 file edits applied to dependencies/24.md (Downstream Consumers row line 40 G1 + Gaps section G1 line 105 + Gaps section G2 line 106 — ★ G2 also surfaced as stale during the edit, expanded scope from 2 to 3 locations). All 3 locations updated to reflect ★ FIXED state with verification + audit reference + lock-in test names. ★ 2nd instance of NEW DRIFT SHAPE "documented-gap-already-fixed" in workflow (after 22 #4 was FIRST; recurrence confirms pattern is real). ★ 10th documentation drift fix in workflow — DOUBLE-DIGIT MILESTONE. Pure documentation closure.'],

  [6, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — line 24 single-site wiring at ~line 19597-19600; ★ 13th ANTI-DUPLICATION application; ★ 4th use of 20 #6 breadcrumb (load-bearing for entire credits-section cluster)',
    '**Closure intent**: pure cross-reference closure — **NO new breadcrumb** at line 24 wiring site (anti-duplication policy applied; **13th anti-duplication application in workflow**). **Why no new breadcrumb**: line 24 is already explicitly covered by the **20 #6 VERIFIED CORRECT breadcrumb sub-verification 4** at TaxReturnComputeService.java:19526-19541 (planted 2026-05-14 during line 20 audit), which documents: *"★ 4. ★★ LINE 24 = line 22 + line 23 — ★★ TOTAL TAX (FINAL)... line23 = safeAmount(otherTaxes; = Schedule 2 line 21); line24 = roundMoney(line22.add(line23)); tac.setTotalTax((line24 > 0) ? line24 : BigDecimal.ZERO). ★★ THIS IS THE RETURN\'S FINAL TOTAL TAX FIELD — most important output on Form 1040 from a \'bottom line\' perspective. ★ line 23 = otherTaxes = Schedule 2 line 21 (other taxes from Schedule 2 Part II); set by finalizeSchedule2OtherTaxes before this method per prepare() compute order at ~line 1616. ★ Special null-handling: line 24 uses ZERO-when-zero (NOT null) — per IRS Form 1040 line 24 instructions, line 24 should always be populated (positive or zero); PDF cell should never be blank. DIFFERENT from lines 20 + 21 which use null-when-zero."*. **3-source coverage confirmed**: (1) spec §1 (formula) + §6 (guardrails); (2) dependencies/24.md (Direct Inputs + Output + Compute Order tables); (3) **20 #6 sub-verification 4** (verified correct breadcrumb in code; ★★ TOTAL TAX anchor). **★ Notable**: line 24 anti-duplication is the 4th time this audit cycle has reached the 20 #6 breadcrumb for cluster coverage (after 21 #5, 22 #6, 23 #6 read site) — confirming the 20 #6 breadcrumb was load-bearing and well-designed for the entire cluster. **13th anti-duplication application in workflow**. Pure cross-reference closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:19597-19600 (line 24 wiring; covered by 20 #6 sub-verification 4 at line 19526-19541)',
    'CLOSED — verified correct via 20 #6 sub-verification 4 + spec §1/§2/§6 + dependencies/24.md (3-source coverage). **13th anti-duplication application in workflow**. NO new breadcrumb at line 19599-19600 (★★ TOTAL TAX FINAL wiring). ★ 4th use of 20 #6 breadcrumb for cluster coverage (after 21 #5 sub-verification 2 + 22 #6 sub-verification 3 + 23 #6 sub-verification 3) — ★ CONFIRMS 20 #6 was LOAD-BEARING for the entire credits-section cluster. Four sub-verifications, six anti-duplication closures across four audits — proof that 20 #6 was well-designed and reusable. Pure cross-reference closure.'],

  [7, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — ★ FULL CREDITS-SECTION CHAIN CONVERGES on ★★ TOTAL TAX FINAL at line 24; ★ DEEPEST inheritance in any credits-section audit (9 cumulative links via 12+ existing breadcrumbs)',
    '**Closure intent**: pure cross-reference closure — verifies that line 24 is MFS-clean by construction via composition of two MFS-clean addends. **Chain verification**: **(1) Line 22 MFS-clean** (per 22 #1 + 22 #7): line 22 inherits MFS protection via 18 #5/#6 from 16 #1 + 17 #1 + 21 #1 (3-link chain) + floor-protected by max(BigDecimal.ZERO) at line 19594. **(2) Line 23 MFS-clean** (per 23 #1 + 23 #7): line 23 inherits MFS protection via 4-stage chain (source forms buildForm4137 + Form8919 + Form8959 + Form5329 → sub-item writers applyAdditionalSocialSecurityMedicareTaxes + applyForm5329TaxToSchedule2 → finalizeSchedule2OtherTaxes aggregation → tac.otherTaxes; ★ LONGEST chain in credits-section series). **(3) Line 24 = pure additive composite**: `roundMoney(safeAmount(line22).add(safeAmount(line23)))`. Pure addition preserves MFS-cleanness (per 21 #6 reasoning); ZERO-when-zero coercion is per-input behavior. → Line 24 is MFS-clean by construction. **★ TOTAL chain across all credits-section lines**: Line 16 + Line 17 → Line 18 (3 links per 18 #5/#6) → combined with Line 19 + Line 20 → Line 21 (5 links per 21 #1) → combined with Line 18 → Line 22 (3 links per 22 #7) → combined with Schedule 2 4-stage chain → Line 23 (4 stages per 23 #7) → combined → ★★ Line 24 = TOTAL TAX FINAL (sum of two MFS-clean addends; the entire chain converges on this output). **No new breadcrumb needed** — chain documented across multiple existing breadcrumbs (16 #1 + 17 #1 + 18 #5/#6 + 19 #1 + 20 #1 + 21 #1 + 22 #1 + 22 #7 + 23 #1 + 23 #5 + 23 #7 + 20 #6 sub-verification 4). Pure cross-reference closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:19597-19600 (line 24 wiring) — chain documented across 12+ existing breadcrumbs spanning lines 16-23',
    'CLOSED — verified correct via FULL converged inheritance chain. ★ DEEPEST inheritance in any credits-section audit — 9 cumulative links via 12+ existing breadcrumbs (16 #1 + 17 #1 + 18 #5/#6 + 19 #1 + 20 #1 + 20 #5 + 20 #6 + 20 #7 + 21 #1 + 22 #1 + 22 #7 + 23 #1 + 23 #5 + 23 #7). Line 22 MFS-clean (22 #1/#7 via 18 #5/#6 from 16 #1 + 17 #1 + 21 #1) + Line 23 MFS-clean (23 #1/#7 via 4-stage chain) → Line 24 = pure additive composite → MFS-clean by construction. **★ FULL CREDITS-SECTION CHAIN CONVERGES on ★★ TOTAL TAX FINAL at line 24** — every preceding audit contributes; ★★ TOTAL TAX FINAL guaranteed MFS-clean by composition. ★ Line 24 is a load-bearing testbed — regression here would indicate upstream bug in any of the 8 contributing lines. No new breadcrumb needed.'],

  [8, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — ZERO-when-zero convention + spec §6c/§6d edge cases (line 24 = line 22 alone when line 23 = 0; line 24 = line 23 alone when line 22 = 0 absorbs credits; ★ ZERO-when-zero UNIQUE to line 24 — third distinct convention in page-2 chain)',
    '**Closure intent**: pure verification closure — confirms three line-24-specific conventions documented by spec §6 + §8 + code line 19599-19600. **Convention 1 — ZERO-when-zero (★ distinct from line 20 + 21 + 23 null-when-zero AND line 22 ALWAYS-SET)**: `tac.setTotalTax(line24.compareTo(BigDecimal.ZERO) > 0 ? line24 : BigDecimal.ZERO)` at line 19600. When line 24 is zero, stored as `BigDecimal.ZERO` (NOT null). ★ THREE distinct conventions across the page-2 chain (per 20 #6 sub-verifications 1-4): lines 20+21+23 null-when-zero (PDF blank) / line 22 ALWAYS-SET (PDF shows "0") / line 24 ZERO-when-zero (PDF shows "0"; ★★ TOTAL TAX FINAL never blank — IRS intent). **Convention 2 — Spec §6c edge case**: if line 23 = 0, line 24 = line 22 (common case — no Schedule 2 other taxes). STRUCTURALLY follows from addition. **Convention 3 — Spec §6d edge case**: if line 22 = 0 (credits fully absorb regular tax) and line 23 > 0, then line 24 = line 23 (★ COMMON in SE-income scenarios; verified by line24-total-tax.spec.ts scenario 2). STRUCTURALLY follows from addition. **Lock-in tests confirm conventions**: (a) line23_otherTaxes_equalsForm5329PenaltyAlone (TaxReturnComputeServiceTest.java:16338) — totalTax = taxAfterCredits + 1000 (Convention 2 + 3); (b) line23_otherTaxes_equalsCombinedForm5329AndAdditionalMedicareTax (line 16441) — totalTax ≥ taxAfterCredits + 1450 (Convention 2 + 3); (c) line24-total-tax.spec.ts scenario 1 — line24 = line22 (Convention 2); (d) line24-total-tax.spec.ts scenario 2 — line22 = 0 + line24 = line23 = 500 (★ Convention 3 / edge case §6d). **No new breadcrumb at line 19600** — Convention 1 self-documenting in 4-line code block + spec §8 + knowledge §3 + 20 #6 sub-verification 4 (★ TOTAL TAX anchor); Conventions 2 + 3 follow from addition + tests. **Coverage cross-references**: spec §6c + §6d + §8 + knowledge §3 + lock-in tests at 16338/16441 + e2e scenarios 1+2. Pure verification closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:19597-19600 (4-line code block; conventions self-documenting); spec §6c + §6d + §8 (edge cases + ZERO-when-zero); TaxReturnComputeServiceTest.java:16338/16441 (2 lock-in tests); e2e/tests/line24-total-tax.spec.ts (2 scenarios)',
    'CLOSED — verified correct. 3 conventions confirmed: **★ ZERO-when-zero** (line 19600; ★ UNIQUE convention — distinct from lines 20+21+23 null-when-zero AND line 22 ALWAYS-SET; chosen for ★★ TOTAL TAX FINAL semantics — IRS intent that the most important output should never be blank) + spec §6c (line24 = line22 when line23 = 0 — majority case for W-2-only filers) + spec §6d (line24 = line23 when line22 = 0 absorbs credits — ★ common SE-income edge case; G2 fix 2026-04-19 closure). 4 lock-in tests confirm correctness (2 unit tests + 2 e2e scenarios). 3-source coverage exists for all 3 conventions (spec + 20 #6 sub-verification 4 + lock-in tests). No new breadcrumb.'],

  [9, 'RESOLVED 2026-05-15 — ⚠️ BUNDLED OBSERVATIONS — 2 observations (21st Path A application; ★ 25 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS — extends first 20-streak by 5; ★ 8th CONSECUTIVE AUDIT WITH ZERO NEW GAPS; ★★ CREDITS-SECTION AUDIT SERIES COMPLETE — 6 audits successfully closed lines 19-24)',
    '**Closure intent**: pure xlsx-flip observation bundle — **NO code change**; **NO outstanding.md entry** (anti-fragmentation policy). TWO observations bundled — both share same "documented + deferred / cosmetic; not blocking real returns" rationale (lighter bundle than line 23 because line 24 had only 2 prior gaps both FIXED 2026-04-19, no carryovers). **(a) Missing `diagrams/24.drawio` data-flow diagram** — `flowcharts/24.drawio` exists; data-flow does NOT; ★ **5th consecutive credits-section audit with this cosmetic gap** (after 20 #9 + 21 #9 + 22 #9 + 23 #9) — pattern strongly crystallized; one-shot cleanup candidate for lines 20-24 is now firmly overdue (5 consecutive deferrals); could be a single-pass task: create all 5 missing data-flow diagrams in one sitting. Cosmetic gap; deferred again. **(b) ★★ CREDITS-SECTION AUDIT SERIES COMPLETE** — 6 consecutive audits successfully closed (lines 19 + 20 + 21 + 22 + 23 + 24); ready to transition to **payments section (lines 25-33)**. Next likely audits: line 25 (federal income tax withheld; multi-source — W-2 box 2 + 1099-R + 1099-NEC + W-2G + estimated payments etc.); line 26 (estimated tax + prior-year refund applied); line 27a (EIC refundable); line 28 (ACTC refundable); line 29 (refundable AOTC); line 30 (reserved/deprecated); line 31 (Schedule 3 line 15 refundable subtotal); line 32 (total other payments + refundable credits); line 33 (total payments). The payments section is structurally DIFFERENT — multiple methods + multi-source aggregation + new compute order constraints. Expect heavier audits than the credits-section. **★ Anti-fragmentation policy applied** — observations only; no fixes today; no outstanding.md entry. **21st PATH A APPLICATION**. **★ Streak extends 24 → 25 consecutive zero-outstanding walkthroughs** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18/19/20/21/22/23/24). **★ 8th CONSECUTIVE ZERO NEW GAPS** — line 24 had 2 prior gaps G1 + G2 BOTH ★ FIXED 2026-04-19; G1 doc-drift resolved this audit; no new gaps surfaced. Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'diagrams/24.drawio (missing — cosmetic; ★ 5th consecutive credits-section audit with this gap — overdue); credits-section audit series complete (lines 19-24 all audited; ready for payments section)',
    'CLOSED — pure observation bundle. **21st Path A application**; ZERO NEW GAPS surfaced (8th consecutive — lines 18-24 all zero after 17 anomaly); **★ 25 consecutive zero-outstanding walkthroughs** (extends first 20-streak by 5). 2 observations: (a) missing diagrams/24.drawio cosmetic (★ 5th consecutive credits-section audit with this gap — strongly crystallized; one-shot cleanup overdue for lines 20-24); (b) **★★ CREDITS-SECTION AUDIT SERIES COMPLETE** — 6 audits successfully closed (lines 19+20+21+22+23+24); ready to transition to payments section (lines 25-33) which is structurally DIFFERENT (multiple methods + multi-source aggregation + new compute order; expect heavier audits than credits-section). No outstanding.md entry per anti-fragmentation policy.'],

  [10, 'RESOLVED 2026-05-15 — BOUNDARY MILESTONE — Line 24 walkthrough complete at 10/10; ★ 50th LINE half-century milestone; ★★ TOTAL TAX FINAL AUDITED; ★ FOURTH META-AUDIT (sub-type (b) at 75% DOMINANCE); ★ 10 DOC-DRIFT FIXES DOUBLE-DIGIT MILESTONE; ★ ★★ CREDITS-SECTION AUDIT SERIES COMPLETE (6 audits); ★ 25 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS; ★ 14th CONSECUTIVE single-row log; ★ 30-LINE knowledge convergence; ★ 13 anti-duplication applications',
    'Pure xlsx-flip + Verification log finalization — **CLOSES the 24 walkthrough at 10/10**. TWO file touches: (a) this row flipped to RESOLVED; (b) lines/24.md §12 Verification log row finalized IN-PROGRESS → **COMPLETE — 10/10 closed**. **Eight themes**: (1) **★★ Structural positioning** — 11th audit OUTSIDE 13ab pair; SIXTH credits-section audit; ★★ CREDITS-SECTION AUDIT SERIES COMPLETE (lines 19+20+21+22+23+24 all audited); ★ 50th LINE — half-century milestone; ★★ line 24 = TOTAL TAX FINAL audited — the return\'s most important output field. (2) **★ MFS-guard cascade UNCHANGED at 20 orchestrators** — 16th defensive-gap-NOT-needed Issue #1; ★ 6th orchestrator-method-based audit with transitive inheritance after 18 #1 + 20 #1 + 21 #1 + 22 #1 + 23 #1; pattern rule generalized across SIX audits. (3) **★ FOURTH META-AUDIT in workflow** (Issue #4) with sub-type (b) signature; ★ ESTABLISHES sub-type (b) at 75% DOMINANCE — 3 of 4 META-AUDITS use dependencies+knowledge-§0 (lines 22 + 23 + 24); only line 21 used sub-type (a) spec §0 banner. (4) **★ 10th DOCUMENTATION DRIFT FIX — DOUBLE-DIGIT MILESTONE** (Issue #5) with NEW DRIFT SHAPE confirmed recurring — 2nd instance of "documented-gap-already-fixed" after 22 #4 (was FIRST); pattern recurrence proves the SHAPE was not a one-off. (5) **Knowledge convergence advances 29 → 30 lines** (Issue #2: 17th Legacy A migration; ★ 30-LINE MILESTONE; likely 5th consecutive with zero history.md hits). (6) **★ 13 ANTI-DUPLICATION applications** — Issue #6 was 13th; ★ 4th audit using 20 #6 breadcrumb for cluster coverage (after 21 #5 + 22 #6 + 23 #6 read site) — confirms 20 #6 was load-bearing for the entire cluster. (7) **★ 21 PATH A applications** (Issue #9: 2-observation bundle — light because line 24 had no carryovers; 4 prior gaps G1+G2 BOTH already FIXED) + ★ 5th consecutive missing-diagrams gap (one-shot cleanup overdue). (8) **★ ZERO NEW gaps surfaced** — 8th consecutive audit (17 + 18 + 19 + 20 + 21 + 22 + 23 + 24); line 24 had 2 prior gaps G1 + G2 BOTH FIXED 2026-04-19. **Cumulative state through line 24**: **★ 50 lines audited** (★ HALF-CENTURY MILESTONE) — **★ 497 audit issues closed total** (487 + 10); backend **765/765 pass** (UNCHANGED — pure documentation closure; no new tests this audit); MFS cascade = **20 orchestrators** (unchanged); knowledge convergence = **30 lines (+1; ★ 30-LINE MILESTONE)**; dependencies files = 43 (unchanged); **★ 10 documentation drift fixes — DOUBLE-DIGIT MILESTONE** (+1 from 24 #5; ★ 2nd instance of NEW DRIFT SHAPE confirmed recurring); 21 Path A applications (+1 from 24 #9); **★ 13 anti-duplication applications** (+1 from 24 #6); 2 SEEDED → VERIFIED CORRECT upgrades (unchanged); 2 terminal seeds (unchanged); 0 NEW gaps surfaced (8th consecutive); **★ 4 META-AUDITS** (+1 from 24 #4; ★ ESTABLISHES sub-type (b) at 75% dominance). **★ 25 CONSECUTIVE WALKTHROUGHS WITH ZERO NEW OUTSTANDING.MD ENTRIES** (extends first 20-streak by 5). **Verification logs**: ... + 22 (1) + 23 (1) + **24 (1 — single-line shape; ★ 14th CONSECUTIVE single-row log)**. **Looking ahead — payments section (lines 25-33)**: structurally DIFFERENT from credits-section — multiple methods + multi-source aggregation + W-2 box 2 / 1099-R / 1099-NEC / W-2G withholding aggregation (line 25); estimated tax (line 26); refundable credits including EIC/ACTC/refundable AOTC (lines 27a-29); Schedule 3 line 15 refundable subtotal (line 31); total payments (line 33). Expect HEAVIER audits than credits-section.',
    'XLS/computations/24.xlsx audit-trail (this row); lines/24.md §12 Verification log row FINALIZED to COMPLETE — 10/10 closed; knowledge file renamed via 24 #2 (Legacy A); ★ 10th doc-drift fix via 24 #5 (DOUBLE-DIGIT MILESTONE; 2nd NEW DRIFT SHAPE instance)',
    'CLOSED — 10/10. **★ 50 LINES AUDITED — HALF-CENTURY MILESTONE; ★ 497 ISSUES CLOSED; 765/765 backend (UNCHANGED — no new tests this audit); 20 orchestrators (UNCHANGED); ★ 30-LINE knowledge convergence MILESTONE; ★ 25 consecutive zero-outstanding walkthroughs (extends first 20-streak by 5); ★ 8th consecutive ZERO NEW GAPS; ★ 10 DOC-DRIFT FIXES DOUBLE-DIGIT MILESTONE; 21 Path A applications; ★ 13 anti-duplication applications; ★ 14th consecutive single-row log; ★ 4 META-AUDITS (★ sub-type (b) at 75% DOMINANCE — 3 of 4); ★★ CREDITS-SECTION AUDIT SERIES COMPLETE (6 audits closed lines 19-24)**. ★★ TOTAL TAX FINAL audited (return\'s most important output); ready to transition to payments section (lines 25-33; structurally DIFFERENT — multiple methods + multi-source aggregation + new compute order; expect heavier audits than credits-section).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 120 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 24 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.taxAndCredits.totalTax', 'Form 1040 page 2, line 24 (PDF key line24_total_tax; AcroForm f2_16[0])', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ CANONICAL line 24 output — ★★ TOTAL TAX FINAL. = nz(line22) + nz(line23). BigDecimal whole-dollar HALF_UP via roundMoney. ★ ZERO-when-zero convention (never null) — distinct from line 20 + 21 + 23 (null-when-zero) and line 22 (ALWAYS-SET).'],
  [],
  ['DOWNSTREAM CONSUMERS (7 consumers)'],
  ['computeLine31ThroughLine38 — refund/owed calc', 'TaxReturnComputeService.java line ~19617', 'us-tax-be', 'Reads tac.getTotalTax() for line 33 (total payments) vs. line 24 (total tax) comparison → refund (line 37) or amount owed (line 38).'],
  ['computeForm2210 — underpayment penalty', 'TaxReturnComputeService.java line 20005-20011', 'us-tax-be', '★ G1 FIX 2026-04-19: Form 2210 Part I line 1 = getTaxAfterCredits() (line 22; NOT line 18 anymore); line 2 = getOtherTaxes() (line 23); line 3 = line 1 + line 2. Reconstructs from components — does NOT read totalTax directly. Lock-in test at TaxReturnComputeServiceTest.java:22631.'],
  ['Frontend PDF export (form-tax-return-1040.component.ts:329)', 'us-tax-ui line 329', '`values[\'line24_total_tax\'] = formatAmount(form.taxAndCredits?.totalTax);`', 'PDF cell shows "0" or positive (★ ZERO-when-zero; never blank).'],
  ['Frontend shell summary (shell.component.ts:887)', 'us-tax-ui line 887', '`const taxTotal = tax?.[\'totalTax\']` — top-level dashboard.', '(UI display)'],
  ['Schedule 2 PDF display (form-tax-return-schedule2.component.ts:145)', 'us-tax-ui line 145', 'Schedule 2 Part I line 3 PDF fill — passes through to Schedule 2 "Tax" total.', 'XLS/output_forms/form-tax-return-schedule2.xlsx'],
  ['Alt fuel credit form import (form-alt-fuel-credit.component.ts:387)', 'us-tax-ui line 387', '`this.importedSchedule2 = this.num(schedule2?.tax?.totalTax)` — credit limit calc.', 'XLS/input_forms/form-alt-fuel-credit.xlsx'],
  ['Bond credit form import (form-bond-credit.component.ts:292)', 'us-tax-ui line 292', '`this.importedSchedule2 = this.num(schedule2?.tax?.totalTax)` — credit limit calc.', 'XLS/input_forms/form-bond-credit.xlsx'],
  [],
  ['CONDITIONAL ATTACHMENTS'],
  ['(None directly triggered by line 24)', '—', '—', 'Line 24 itself triggers no attachments. Schedule 2 (line 23 input) attached based on its own upstream conditions.'],
  [],
  ['NOT IN OUTPUT (deliberate exclusions per spec §6b)'],
  ['Withholding (line 25)', '—', '—', 'Spec §6b — payments begin AFTER line 24.'],
  ['Estimated tax (line 26)', '—', '—', 'Spec §6b — payments territory.'],
  ['Refundable credits (lines 27a-31)', '—', '—', 'Spec §6b — EIC + ACTC + refundable AOTC + Schedule 3 Part II all enter after line 24.'],
  ['Total payments (line 33)', '—', '—', 'Spec §6b — line 33 is the OTHER addend in the refund/owed comparison; not part of line 24.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 60 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
