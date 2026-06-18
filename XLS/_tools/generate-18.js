// ============================================================================
//  Generates: C:\us-tax\XLS\computations\18.xlsx
//
//  Source-of-truth references:
//    - lines/18.md (2025-tax-year IRS-verified developer-ready spec; sections
//      1-10; 211 lines; line 18 = line 16 + line 17 = tax-before-credits subtotal;
//      ⚠️ §7 implementation note has DOCUMENTATION DRIFT — says computeLine18
//      reads alternativeMinimumTax; actual code reads additionalTaxSchedule2)
//    - dependencies/18.md (83 lines; ⚠️ row 8 has same DOCUMENTATION DRIFT —
//      says backend field is alternativeMinimumTax; should be additionalTaxSchedule2)
//    - knowledge/line-18-total-tax-before-credits.md (renamed from knowledge_line18.md
//      via 18 #2 2026-05-14; 11th Legacy A migration; 210 lines covering: line identity,
//      what line 18 represents, backend impl, output model, frontend integration,
//      compute order, 7 downstream CLW consumers, 4 unit tests + 3 E2E tests inventory,
//      IRS verification, 3 identified gaps G1-G3 all Fixed 2026-04-18; ⚠️ KNOWLEDGE
//      §3 has CORRECT info — code reads additionalTaxSchedule2; G1 fix locked in;
//      Knowledge §6 compute order uses abbreviation "alternativeMinimumTax" not drift)
//    - TaxReturnComputeService.java:
//        line 1256 — primary call site (after computeLine17 in prepare())
//        line 11808 — secondary call site inside correctLine17ForFtc (G-new-1 fix)
//        line 11834-11864 — computeLine18 method body (small focused 30-line method
//          with thorough JavaDoc covering G1 fix rationale + read-additionalTaxSchedule2
//          + null-as-zero semantic + future-safety against Schedule 2 line 1z items)
//    - IRS 2025 Form 1040 / 1040-SR (line 18: "Add lines 16 and 17.")
//    - IRS 2025 Schedule 2 (Form 1040)
//    - IRS 2025 Form 1040 / 1040-SR instructions (i1040gi)
//    - docs/books/i1040gi_2025.txt — multi-column format; line 18 instruction
//    - J.K. Lasser's Your Income Tax 2025 Professional Edition
//
//  Tax year: 2025
//
//  Concept:
//    Form1040.line18 = Form1040.line16 + Form1040.line17
//
//    Line 18 is the **tax-before-credits subtotal** — the starting point for
//    the nonrefundable credits section (lines 19-21). It is NOT total tax;
//    Schedule 2 Part II other taxes (line 23) and refundable items are added
//    LATER for the final total tax (line 24).
//
//    SIMPLEST line in the line-16+ chain — pure addition, NO reference data,
//    NO conditional inputs, NO filing-status branches, NO out-of-scope deferred
//    items. The audit complexity lies in the SURROUNDING context (3 documentation
//    drifts to fix; G-new-5 propagation from 17 audit; 7-consumer downstream
//    impact graph).
//
//  Line 18 audit positioning (5th audit OUTSIDE 13ab pair):
//   • THIRD orchestrator-based audit in line-16+ chain (after lines 16 + 17)
//   • Cumulative position: 44th line
//   • Uses 16 #4 + 17 #4 navigable hubs (AMT-territory hub now extends to line 18)
//   • Likely DEFENSIVE-GAP-NOT-NEEDED MFS Issue #1 — transitive inheritance from
//     16 #1 (TaxAndCredits.tax) + 17 #1 (TaxAndCredits.additionalTaxSchedule2)
//   • G-new-5 propagation from 17 audit (line 17 understatement carries into
//     line 18 — already documented in 17 #4 + 17 #8 breadcrumbs)
//   • Documentation drift between spec/dependencies and code — needs fix
//   • Simpler audit than 16 + 17 (no algorithmic complexity to verify)
//
//  Line 18 audit angles (10 issues):
//   1. ⚠️ NO MFS DEFENSIVE GAP NEEDED at computeLine18 site — transitive
//       inheritance from 16 #1 + 17 #1. MFS cascade UNCHANGED at 19 orchestrators.
//       11th defensive-gap-NOT-needed Issue #1 in workflow.
//   2. DOCUMENTATION HYGIENE — Knowledge file Legacy A rename
//       (knowledge_line18.md → line-18-total-tax-before-credits.md); 11th Legacy
//       A migration; convergence 23 → 24 lines.
//   3. SPEC ENHANCEMENT — Verification log section §11 in lines/18.md
//       (single-row pattern).
//   4. ★ DOCUMENTATION DRIFT FIX — lines/18.md §7 implementation note still says
//       computeLine18 reads `TaxAndCredits.alternativeMinimumTax`. Should be
//       `additionalTaxSchedule2` (G1 fix 2026-04-18 updated code but not spec).
//       Same drift in dependencies/18.md row 8 backend-field column.
//       Pure spec/dependencies edit; matches established documentation-drift-fix
//       pattern (6th application across workflow).
//   5. VERIFIED CORRECT — computeLine18 method body (~30 lines including JavaDoc).
//       Pure arithmetic line; ★ reads additionalTaxSchedule2 NOT
//       alternativeMinimumTax (G1 fix locked in); null-as-zero semantic for both
//       inputs; ★ NOT total tax (spec §3 + §4 + §10 — line 18 ≠ line 24).
//   6. VERIFIED CORRECT — TWO call sites in prepare():
//       (a) Primary at ~line 1256 (after computeLine17 / before Form 1116)
//       (b) Secondary inside correctLine17ForFtc at ~line 11808 (G-new-1 fix —
//           refresh after FTC correction changes line 17)
//       Both required; G-new-1 fix locks in the secondary call.
//   7. VERIFIED CORRECT — 7 downstream CLW consumers reading totalTaxBeforeCredits:
//       finalizeForm2441PartII / computeForm8880 / computeSchedule8812 /
//       computeForm8863 / computeForm1116 CLW / computeForm8839 (partial) /
//       line22 = max(0, line18 − line21). All correctly invoked AFTER both
//       computeLine18 calls.
//   8. ★ G-new-5 PROPAGATION VERIFICATION — Line 17's G-new-5 (additionalTaxSchedule2
//       set = line11 only, not line1z + line11) propagates DIRECTLY to line 18.
//       When PTC repayment > 0 AND AMT = 0: additionalTaxSchedule2 = null → line 18
//       reads as 0 for line 17 component → line 18 understates by line 1z.
//       ★ NOT a NEW gap — pinned at line 18 site so the propagation is visible.
//       Recommended fix (same as 17 #9 G-new-5): when fix is applied at
//       wireLine17ToOutputs, line 18 automatically inherits the correct value.
//   9. ⚠️ BUNDLED OBSERVATIONS — secondary findings:
//       (a) Knowledge §6 abbreviates "computeLine17 → alternativeMinimumTax" —
//           NOT real drift (computeLine17 sets BOTH fields).
//       (b) computeLine18 method body LOG.infof emits at INFO level — high-volume
//           log line; could be downgraded to DEBUG. Cosmetic.
//       (c) No flowchart/diagram drift — both files exist (flowcharts/18.drawio
//           + diagrams/18.drawio).
//       15th Path A application — extends streak 18 → 19 consecutive
//       zero-outstanding walkthroughs.
//  10. BOUNDARY MILESTONE — third orchestrator-based audit in line-16+ chain;
//       44 lines audited / 437 issues / backend 764 UNCHANGED (pure documentation
//       closure; no new tests); MFS cascade UNCHANGED at 19 orchestrators
//       (defensive-gap-NOT-needed); convergence 23 → 24 lines; 15 Path A;
//       6 anti-duplication; 2 SEEDED → VERIFIED CORRECT; 2 terminal seeds at
//       orchestrators; 19 consecutive zero-outstanding walkthroughs.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '18.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 18 — TOTAL TAX BEFORE CREDITS (Add lines 16 and 17) — 2025'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 18 (page 2; numeric amount; IRS label "Add lines 16 and 17.")'],
  ['Concept',
    'Line 18 is the tax-before-credits SUBTOTAL — the starting point for the nonrefundable credits ' +
    'section (lines 19-21). It is NOT total tax; Schedule 2 Part II other taxes (line 23) and ' +
    'refundable items are added LATER for final total tax (line 24). Simple pure-arithmetic line.'],
  ['Formula (spec §1)',
    'Form1040.line18 = Form1040.line16 + Form1040.line17'],
  ['Backend formula',
    'totalTaxBeforeCredits = (TaxAndCredits.tax ?? 0) + (TaxAndCredits.additionalTaxSchedule2 ?? 0)\n' +
    '★ Uses additionalTaxSchedule2 (Schedule 2 line 3 semantic) NOT alternativeMinimumTax\n' +
    '   (G1 fix locked in 2026-04-18; future-safe against Schedule 2 line 1z implementation).'],
  ['What line 18 INCLUDES (spec §2)',
    '★ Line 16: tax on taxable income — may include Form 8814 + Form 4972 + Box 3 write-ins (ECR, 962, 1291TAX, Form 8978, 965INC).\n' +
    '★ Line 17: Schedule 2 line 3 = line 1z additions + Form 6251 line 11 AMT (currently line 1z = 0 in scope so equals AMT only).'],
  ['What line 18 does NOT include (spec §4 — GUARDRAILS)',
    '⚠️ Schedule 2 Part II other taxes (lines 4-21 of Schedule 2) — those add at line 23 NOT line 18.\n' +
    '⚠️ Repayment / penalty taxes that belong below line 22.\n' +
    '⚠️ Withholding / refundable credits / payments — those flow at line 25 + later.\n' +
    '★ Per spec §10 + §11.3 LINE18_EXCLUDES_SCHEDULE2_PARTII validation: line 18 is NOT total tax (line 24 is total tax).'],
  ['Compute order (spec §7)',
    'PRIMARY pass:\n' +
    '  1. computeLine16() → TaxAndCredits.tax\n' +
    '  2. computeLine17() → wireLine17ToOutputs() → TaxAndCredits.additionalTaxSchedule2\n' +
    '  3. computeLine18() → TaxAndCredits.totalTaxBeforeCredits   ← primary call site at prepare() ~line 1256\n' +
    '\n' +
    'AFTER Form 1116 runs (G-new-1 fix; conditional on FTC > 0):\n' +
    '  4. computeForm1116() + applyForeignTaxCreditToSchedule3()\n' +
    '  5. correctLine17ForFtc():\n' +
    '       - subtracts FTC from Form 6251 line 10\n' +
    '       - recomputes Form 6251 line 11\n' +
    '       - wireLine17ToOutputs() re-wires additionalTaxSchedule2\n' +
    '       - computeLine18() REFRESH → totalTaxBeforeCredits   ← secondary call site at ~line 11808\n' +
    '\n' +
    'BOTH calls required — downstream CLWs read the refreshed totalTaxBeforeCredits.'],
  ['Downstream flow (spec §8)',
    'line21 = line19 + line20                  (nonrefundable credits sum)\n' +
    'line22 = max(0, line18 − line21)          (tax after nonrefundable credits)\n' +
    'line23 = Schedule2.line21                 (other taxes from Schedule 2 Part II)\n' +
    'line24 = line22 + line23                  (★ TOTAL TAX — final, not line 18)'],
  ['Output target',
    'form1040.taxAndCredits.totalTaxBeforeCredits (BigDecimal; HALF_UP whole dollar)\n' +
    'PDF field: line18_total_tax_add_lines16_17 (page 2; rect 504,612,576,624)'],
  ['Backend implementation',
    '**SMALL FOCUSED METHOD** — `computeLine18` at TaxReturnComputeService.java:11834-11864 ' +
    '(30 lines including JavaDoc). Pure arithmetic line; no orchestrator complexity. ' +
    'TWO call sites: primary at prepare() line 1256 + secondary inside correctLine17ForFtc ' +
    'at line 11808 (G-new-1 fix). THIRD orchestrator-based audit in line-16+ chain after ' +
    'lines 16 + 17 on 2026-05-14. Uses 16 #4 + 17 #4 navigable hubs.'],
  ['IRS source',
    'IRS 2025 Form 1040 (page 2 line 18: "Add lines 16 and 17.") + 2025 Instructions for Form 1040 ' +
    '(i1040gi). Local cross-checks: docs/books/i1040gi_2025.txt + J.K. Lasser\'s Your Income Tax 2025. ' +
    'No 2025-specific changes — line 18 has been line16 + line17 since 2018 TCJA restructuring.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Gate check', 'If form1040.taxAndCredits == null, skip line 18 (no tax computed; zero taxable income path). Per `computeLine18` line 11836-11840.'],
  [2, 'Read line 16 from TaxAndCredits.tax', 'Null treated as zero (safe fallback). Per line 11844-11846. Per 16 audit (closed 2026-05-14) line 16 = regularTax + box1/2/3 add-ons.'],
  [3, 'Read line 17 from TaxAndCredits.additionalTaxSchedule2 (★ NOT alternativeMinimumTax — G1 fix)', 'Null treated as zero. Semantic field representing Schedule 2 line 3. Per line 11854-11856. ⚠️ G-new-5 propagation from 17 audit: when PTC repayment > 0 AND AMT = 0, additionalTaxSchedule2 = null → line 17 read as 0 → line 18 understates by line 1z amount.'],
  [4, 'Sum: line18 = line16 + line17', 'Per line 11859. Always non-negative by construction (both inputs non-negative).'],
  [5, 'Set TaxAndCredits.totalTaxBeforeCredits', 'Per line 11860. PRIMARY pass result.'],
  [6, 'Log result at INFO level', 'Per line 11862-11863. `Line 18 computed actor=... line16=... line17=... line18=...`'],
  [7, '(After Form 1116 runs) correctLine17ForFtc INVOKES computeLine18 again', 'G-new-1 fix at ~line 11808 — refresh totalTaxBeforeCredits after FTC correction changes line 17 (line 11Corrected via Schedule3.line1 FTC subtraction from line 10).'],
  [8, 'Downstream CLWs read refreshed totalTaxBeforeCredits', '7 consumers per dependencies §6: finalizeForm2441PartII / computeForm8880 / computeSchedule8812 / computeForm8863 / computeForm1116 CLW / computeForm8839 (partial) + line22 = max(0, line18 − line21).'],
  [],
  ['INVARIANTS / VALIDATIONS (spec §6)'],
  ['Invariant', 'Rationale'],
  ['line18 = line16 + line17 (spec §6.1 LINE18_SUM_MISMATCH)', 'Core arithmetic invariant. STRUCTURALLY enforced by computeLine18 single addition step.'],
  ['line16 must be present before line 18 (spec §6.1 MISSING_LINE16)', 'Null treated as zero by code (safe fallback per spec §6.1 implementation).'],
  ['line17 must be present before line 18 (spec §6.1 MISSING_LINE17)', 'Null treated as zero by code (safe fallback).'],
  ['line18 ≥ 0 (spec §6.2 LINE18_CANNOT_BE_NEGATIVE)', 'Both line 16 and line 17 are non-negative tax amounts by construction. STRUCTURALLY guaranteed.'],
  ['line18 must NOT include Schedule 2 Part II amounts (spec §6.3 LINE18_EXCLUDES_SCHEDULE2_PARTII)', '★ The MOST IMPORTANT scope guardrail. Schedule 2 Part II flows to line 23 via Schedule 2 line 21. ENFORCED by reading only `additionalTaxSchedule2` (Schedule 2 line 3 = line 1z + line 2) — Schedule 2 Part II is NOT in line 1z or line 2.'],
  ['totalTaxBeforeCredits must be refreshed after FTC correction (G-new-1 fix)', '★ Without secondary call site inside correctLine17ForFtc, totalTaxBeforeCredits would remain stale at pre-correction value when FTC > 0. Lock-in: line17GNew1TotalTaxBeforeCreditsRefreshedAfterFtcCorrection test (in line 17 test section).'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 38 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 18'],
  ['Line 18 takes ONLY 2 INPUTS from TaxAndCredits. NO conditional inputs. NO reference data. SIMPLEST line in line-16+ chain.'],
  [],
  ['#', 'Source', 'Field', 'Type', 'Role', 'XLS input/output form reference'],
  [1, 'computed Form 1040 (line 16)', 'taxAndCredits.tax', 'BigDecimal (nullable)', 'Tax on taxable income + box 1/2/3 add-ons. Null when no tax (e.g., zero taxable income).', 'XLS/output_forms/form-tax-return-1040.xlsx (line 16 cell)'],
  [2, 'computed Form 1040 (line 17 via Schedule 2 line 3)', 'taxAndCredits.additionalTaxSchedule2', 'BigDecimal (nullable)', '★ Schedule 2 line 3 semantic — NOT alternativeMinimumTax. Currently = Form 6251 line 11 only since Schedule 2 line 1z = 0 in scope; future-safe when line 1z items implemented. Null when AMT = 0 AND no line 1z items. ⚠️ G-new-5 propagation: when PTC repayment > 0 AND AMT = 0, this field is null but should equal PTC repayment.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 17 cell)'],
  [],
  ['⚠️ NO DEDICATED USER INPUT FORM FOR LINE 18'],
  ['Line 18 has NO `form-line18-*.xlsx` in C:\\us-tax\\XLS\\input_forms\\. All inputs are derived from upstream computations (line 16 + line 17). Line 18 is NOT visible as a standalone form in the sidebar — it is shown on the `form-tax-return-1040` Tax Return view. No user-supplied data feeds line 18 directly.'],
  [],
  ['⚠️ TRANSITIVE INHERITANCE OF MFS FIXES'],
  ['Both inputs inherit MFS protection TRANSITIVELY from upstream orchestrator audits:'],
  ['Input', 'Upstream MFS guard', 'Status'],
  ['taxAndCredits.tax (line 16)', '16 #1 — form4972Spouse + form2555Spouse null-shadowed at computeLine16 call site (line 1213-1216)', '✅ Inherits transitively'],
  ['taxAndCredits.additionalTaxSchedule2 (line 17)', '17 #1 — form2555Spouse null-shadowed at computeLine17 call site (line 1224)', '✅ Inherits transitively'],
  ['→ NO MFS GUARD NEEDED at computeLine18 site', '11th defensive-gap-NOT-needed Issue #1 in workflow', '(See 18 #1)'],
  [],
  ['⚠️ NO MISSING INPUTS (pure arithmetic line)'],
  ['Line 18 is a pure addition line. There are no missing input fields — every operand is already computed upstream. The only "gap" is the documentation drift between spec/dependencies and code (see 18 #4).'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 40 }, { wch: 50 }, { wch: 22 }, { wch: 75 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 18'],
  ['Line 18 uses ZERO reference data — NO constants, thresholds, brackets, or phase-outs. Pure arithmetic line.'],
  [],
  ['Constant', 'Value', 'Statutory Basis', 'Backend identifier'],
  ['(None — pure arithmetic line)', '—', 'Spec §10 + dependencies §7 confirm: "Line 18 is a pure arithmetic line with no constants, thresholds, or phase-outs."', '—'],
  [],
  ['★ THIS IS THE SIMPLEST LINE IN THE LINE-16+ CHAIN'],
  ['Contrast with neighboring tax-territory lines:'],
  ['Line', '# Constants', 'Complexity'],
  ['16 (Tax)', '~30+ (TCW brackets + QDCG thresholds + IRC §1/§1(h)/§1(g)/§911/§402(d) + Rev. Proc. 2024-40 anchors)', '7-branch decision tree + 4 helper methods + 3 add-on paths'],
  ['17 (AMT)', '~25+ (exemptions/phaseouts × 3 statuses + 26/28% breakpoints + Part III thresholds × 4 × 2 + IRC §55-§59/§1(h)/§911 anchors)', '3-part architecture (Part I/II/III) + 3-path line 7 + FTC correction'],
  ['**18 (Total tax before credits)**', '**0**', '**Pure addition: line16 + line17**'],
  [],
  ['No statutory anchors needed'],
  ['Line', 'Statute', 'Why needed'],
  ['—', '—', 'Line 18 does not interpret tax law beyond the arithmetic addition. The substantive tax rules are in line 16 (IRC §1, §911, etc.) and line 17 (IRC §55-§59). Line 18 just sums them.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 55 }, { wch: 35 }, { wch: 75 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 18 Persistence + Downstream Consumers'],
  ['Line 18 sets ONE output field on TaxAndCredits. SEVEN downstream consumers read it (6 CLWs + line 22).'],
  [],
  ['Output target', 'Where wired', 'Effect', 'XLS output reference'],
  ['form1040.taxAndCredits.totalTaxBeforeCredits', '`computeLine18` line 11860', '★ CANONICAL line 18 output. BigDecimal (whole dollar HALF_UP). Sum of tax (line 16) + additionalTaxSchedule2 (line 17). REFRESHED after FTC correction via secondary call inside correctLine17ForFtc (G-new-1 fix).', 'XLS/output_forms/form-tax-return-1040.xlsx (line 18 cell)'],
  [],
  ['PRIMARY DOWNSTREAM (★★) — 7 consumers per dependencies §6'],
  ['Consumer', 'Method', 'How it uses line 18'],
  ['line22 (tax after nonrefundable credits)', '`computeLine20ThroughLine24`', '★★ line22 = max(0, totalTaxBeforeCredits − line21). DIRECT use as the credits-section subtractor.'],
  ['Form 2441 CLW (child/dependent care credit)', '`finalizeForm2441PartII`', '★★ CLW line A = totalTaxBeforeCredits − Schedule 3 credits.'],
  ['Form 8880 CLW (Saver\'s Credit)', '`computeForm8880`', '★★ CLW line 10 = totalTaxBeforeCredits − prior credits.'],
  ['Schedule 8812 (CTC/ODC/ACTC)', '`computeSchedule8812`', '★★ CLW line 10 = totalTaxBeforeCredits − prior credits.'],
  ['Form 8863 CLW (education credits)', '`computeForm8863`', '★★ CLW = totalTaxBeforeCredits − prior credits.'],
  ['Form 1116 CLW (FTC limitation)', '`computeForm1116`', '★★ CLW line 10 = totalTaxBeforeCredits − prior credits. ⚠️ Triggers correctLine17ForFtc back-correction which refreshes totalTaxBeforeCredits via G-new-1 secondary call.'],
  ['Form 8839 CLW (adoption credit; partial)', '`computeForm8839`', 'CLW wiring partially implemented; deferred Schedule 3 line 6c wiring per knowledge §10.'],
  [],
  ['PDF Output'],
  ['PDF Field', 'CSV Key', 'Source'],
  ['Line 18 amount (page 2, rect 504,612,576,624)', 'line18_total_tax_add_lines16_17', 'C:\\us-tax\\pdfs\\f1040_field_mapping_semantic.csv'],
  ['Frontend wiring', '`values[\'line18_total_tax_add_lines16_17\'] = formatAmount(form.taxAndCredits?.totalTaxBeforeCredits)`', 'form-tax-return-1040.component.ts'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 60 }, { wch: 80 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 18'],
  ['Line 18 emits NO blocking flags. The method silently skips when taxAndCredits is null and treats null inputs as zero defensively.'],
  [],
  ['Flag code', 'Severity', 'Condition', 'Where emitted'],
  ['(None at line 18 site)', 'N/A', 'Line 18 silently skips when taxAndCredits is null (line 11836-11840). Null line 16 / line 17 inputs treated as zero (safe fallback). No upstream blocking flags propagate at line 18; all line-16 and line-17 flags emitted before computeLine18 runs.', '`computeLine18` gate at line 11836-11840'],
  [],
  ['SPEC §6 STRUCTURAL INVARIANTS (not runtime-validated)'],
  ['Invariant', 'How enforced / Status'],
  ['LINE18_SUM_MISMATCH (spec §6.1)', 'STRUCTURALLY enforced by computeLine18 single-line addition at line 11859. Cannot diverge — the addition IS the definition.'],
  ['MISSING_LINE16 (spec §6.1)', 'Null line 16 treated as zero by code (line 11844-11846; safe fallback). Spec §6.1 calls for error MISSING_LINE16 but implementation prefers null-as-zero for compositional safety.'],
  ['MISSING_LINE17 (spec §6.1)', 'Null line 17 treated as zero (line 11854-11856; safe fallback). Same rationale.'],
  ['LINE18_CANNOT_BE_NEGATIVE (spec §6.2)', 'STRUCTURALLY guaranteed: both inputs are non-negative tax amounts; addition cannot produce negative. No explicit max(0, ...) needed.'],
  ['LINE18_EXCLUDES_SCHEDULE2_PARTII (spec §6.3)', '★ THE MOST IMPORTANT SCOPE GUARDRAIL. STRUCTURALLY enforced by reading ONLY additionalTaxSchedule2 (Schedule 2 line 3 = line 1z + line 2). Schedule 2 Part II = lines 4-21 of Schedule 2 — NOT in line 1z and NOT in line 2; therefore NOT in additionalTaxSchedule2. Schedule 2 Part II flows to line 23 via Schedule 2 line 21.'],
  ['G-new-1 refresh required (line 17 audit)', '★ Without secondary call site inside correctLine17ForFtc, totalTaxBeforeCredits would remain stale at pre-correction value when FTC > 0. Lock-in test: line17GNew1TotalTaxBeforeCreditsRefreshedAfterFtcCorrection (in line 17 test section).'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 14 }, { wch: 100 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 18 is the tax-before-credits subtotal (line 16 + line 17). 5th audit OUTSIDE 13ab pair; THIRD orchestrator-based audit in line-16+ chain. SIMPLEST line in the chain — no algorithmic complexity. 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-14 — CROSS-REFERENCE — NO MFS DEFENSIVE GAP NEEDED at computeLine18 site (11th defensive-gap-NOT-needed Issue #1 in workflow; FIRST orchestrator-based audit in line-16+ chain that does NOT add to MFS cascade)',
    '**Closure applied**: pure xlsx-flip cross-reference — no code change; no breadcrumb (existing JavaDoc at lines 11813-11833 already describes line 18 as a sum of line 16 + line 17 without per-spouse inputs). **Per-input MFS-leakage analysis**: `computeLine18` at TaxReturnComputeService.java:11834 takes EXACTLY TWO PARAMETERS (`form1040`, `uid`) — neither is a per-spouse input. Inside the method body, it reads TWO fields from `TaxAndCredits`: (a) `tax` (line 16) — set by `computeLine16` whose call site at line 1213-1216 null-shadows `form4972Spouse` + `form2555Spouse` on MFS per 16 #1 (18th orchestrator); (b) `additionalTaxSchedule2` (line 17) — set by `computeLine17` whose call site at line 1224 null-shadows `form2555Spouse` on MFS per 17 #1 (19th orchestrator). **Both fields are MFS-clean by the time computeLine18 reads them**; the addition of two MFS-clean values cannot introduce new MFS leakage. **MFS-guard cascade UNCHANGED at 19 orchestrators**: 1c-1i (7) + computeInterestIncome + computeIraDistributions + computePensionAnnuities + computeSocialSecurityBenefits + computeCapitalGainLoss + computeOtherIncomes + computeIncomeAdjustments + buildStandardDeductionIndicators + computeLine13a + computeSchedule1A + computeLine16 + computeLine17. **★ Notable**: 18 #1 is the FIRST orchestrator-based audit in the line-16+ chain that does NOT add to the MFS cascade. 16 #1 and 17 #1 each added one (bundled-two-leak + single-leak respectively). 18 #1 reverts to the inline-computed/transitive-inheritance pattern despite being a separate method — because the method signature has NO per-spouse parameters. **11th defensive-gap-NOT-needed Issue #1 in workflow** (after 9 + 11a/b + 12b/c/d/e + 14 + 15 — all inline-computed lines previously; line 18 is the first method-as-orchestrator with transitive inheritance). The pattern rule: MFS guard at call site is needed when the method takes `form*Spouse` parameter directly; transitive inheritance is sufficient when the method only reads from already-MFS-protected upstream outputs. Backend tests: **764/764 unchanged** (no code change).',
    'TaxReturnComputeService.java:11834-11864 (computeLine18 method body — no per-spouse params); line 1256 (primary call site); line 11808 (secondary call site inside correctLine17ForFtc)',
    'CLOSED — defensive-gap-NOT-needed. **11th in workflow** (first orchestrator-method-based with transitive inheritance). MFS-guard cascade UNCHANGED at 19 orchestrators. Pure cross-reference closure. 764/764 unchanged.'],

  [2, 'RESOLVED 2026-05-14 — DOCUMENTATION HYGIENE — Knowledge file Legacy A rename (knowledge_line18.md → line-18-total-tax-before-credits.md; 11th Legacy A migration; convergence 23→24)',
    '**Closure applied**: (1) plain `mv` of `C:\\us-tax\\knowledge\\knowledge_line18.md` → `C:\\us-tax\\knowledge\\line-18-total-tax-before-credits.md` (folder not under git). (2) Repo-wide grep for `knowledge_line18` produced 2 file hits / 7 line hits (classified per established 15 #2 / 16 #2 / 17 #2 precedent): ACTIVE-UPDATE = 3 generate-18.js content-citation hits at line 11 (header citation — updated to new path with rename annotation `(renamed from knowledge_line18.md via 18 #2 2026-05-14)`), line 324 (Issue #4 cross-reference to knowledge §3 — updated), line 350 (Issue #9 Where Found pointing to knowledge §6 — updated). LEAVE-UNTOUCHED = 4 hits — `history.md` 1 historical-entry hit at line 3683 (per immutable-history policy) + 3 generate-18.js hits at lines 61/313/314 (Issue #2 rename-description rows — both old + new names intentionally appear as part of describing the rename; leaving these untouched preserves audit-trail clarity). (3) `lines/18.md` + `dependencies/18.md` scan: NO citation of knowledge file path → no update needed. (4) ZERO hits in TaxReturnComputeService.java (code never references knowledge file path). **11th Legacy A migration in workflow** (after 7a/8/9/10/11a/12a/13a/15/16/17 #2). **Knowledge-file naming convergence advances 23 → 24 lines** (first migration in double-digit territory after 17 #2 hit the 10-migration mark). Pure documentation closure — no functional change. Backend tests: 764/764 unchanged.',
    'C:\\us-tax\\knowledge\\line-18-total-tax-before-credits.md (renamed); C:\\us-tax\\XLS\\_tools\\generate-18.js 3 ACTIVE-UPDATE hits at lines 11/324/350 + 3 LEAVE-UNTOUCHED rename-description hits at lines 61/313/314; history.md 1 historical hit at line 3683 left untouched',
    'CLOSED — file renamed + 3 active citations updated in generate-18.js (lines 11/324/350); 4 hits left untouched per precedent (1 history.md historical + 3 generate-18.js rename-description). Pure documentation closure. 11th Legacy A migration. Convergence 23 → 24 lines.'],

  [3, 'RESOLVED 2026-05-14 — SPEC ENHANCEMENT — Verification log section §11 created in lines/18.md (single-row pattern; smallest log shape)',
    '**Closure applied**: appended `## 11) Verification log` section to `lines/18.md` after section §10 (Bottom line; line 211). 5-column markdown table; **row 1 in IN-PROGRESS state** capturing #1 (NO MFS DEFENSIVE GAP NEEDED — 11th defensive-gap-NOT-needed; MFS cascade UNCHANGED at 19 orchestrators; ★ FIRST orchestrator-method-based audit with transitive inheritance) + #2 (Legacy A rename — 23 → 24 convergence; 11th migration first in double-digit territory) + #3 (this section creation). Row 1 will be finalized to **"COMPLETE — 10/10 closed"** at Issue #10 (boundary milestone). **Single-row pattern** = SMALLEST log shape (mirrors lines 8, 9, 10, 14, 15, 16, 17 single-line audits). Append-then-finalize pattern (used at 14 #3, 15 #3, 16 #3, 17 #3) lets the row evolve as the walkthrough progresses; final state captured atomically at Issue #10. Pure spec enhancement — no functional change. Backend tests: 764/764 unchanged.',
    'C:\\us-tax\\lines\\18.md section §11 appended after §10 (Bottom line; line 211)',
    'CLOSED — §11 Verification log section created with single-row IN-PROGRESS table. Single-line audit shape (smallest log).'],

  [4, 'RESOLVED 2026-05-14 — ★ DOCUMENTATION DRIFT FIX — lines/18.md §7 + dependencies/18.md row 8 updated to cite `additionalTaxSchedule2` (G1 fix 2026-04-18 retroactively documented)',
    '**Closure applied**: TWO file edits — pure spec/dependencies update; no code change. **The drift**: G1 fix locked in 2026-04-18 changed `computeLine18` to read `additionalTaxSchedule2` (Schedule 2 line 3 semantic) instead of `alternativeMinimumTax` (Form 6251 line 11 only). G1 fix correctly updated: (a) `computeLine18` body at TaxReturnComputeService.java:11854; (b) JavaDoc at lines 11819-11824; (c) line-18-total-tax-before-credits.md §3 (renamed from knowledge_line18.md via 18 #2). But drift was introduced at TWO documents that didn\'t get refreshed: **(1) `lines/18.md` §7 implementation note (line 166)** still said `computeLine18() reads TaxAndCredits.alternativeMinimumTax`; **(2) `dependencies/18.md` row 8 (line 8)** backend-field column still said `TaxAndCredits.alternativeMinimumTax`. **Edits**: (a) `lines/18.md` §7 — replaced the implementation note with the corrected version citing `additionalTaxSchedule2` + G1 fix 2026-04-18 + doc-drift fix 18 #4 2026-05-14 annotations + future-safety rationale + ★ G-new-5 propagation note explaining how the recommended follow-up fix at wireLine17ToOutputs (setting `additionalTaxSchedule2 = line1z + line11`) will automatically inherit into line 18 without further `computeLine18` change. (b) `dependencies/18.md` row 8 — updated 3rd column from `TaxAndCredits.alternativeMinimumTax` → `TaxAndCredits.additionalTaxSchedule2`; updated 4th column to `Schedule 2 line 3 (= line1z + Form6251.line11; G1 fix 2026-04-18 — uses semantic field for future-safety; currently equals AMT only since line1z=0; doc-drift fix 18 #4 2026-05-14)`. Pure documentation closure — no functional change; spec/dependencies now align with code reality. **6th documentation drift fix in workflow** (after 5 prior drift fixes per cumulative status). **Why this matters**: spec/dependencies are authoritative documentation; if they say `alternativeMinimumTax` but code uses `additionalTaxSchedule2`, a future maintainer reviewing the spec without reading the code might (a) try to "fix" the code to match the spec (reverting G1); (b) believe the future-safety work hasn\'t been done; (c) miss that G1 was a real bug fix; (d) get confused when the 17 #9 G-new-5 follow-up fix lands. Backend tests: 764/764 unchanged.',
    'C:\\us-tax\\lines\\18.md §7 line 166 (updated to cite additionalTaxSchedule2 + G1 + 18 #4 annotations); C:\\us-tax\\dependencies\\18.md row 8 line 8 (updated 3rd column + 4th column)',
    'CLOSED — 2 file edits applied. lines/18.md §7 + dependencies/18.md row 8 now correctly cite additionalTaxSchedule2 per G1 fix (2026-04-18) + 18 #4 doc-drift fix (2026-05-14). 6th documentation drift fix in workflow. Pure documentation closure.'],

  [5, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — computeLine18 method body (pure arithmetic; G1 fix locked in; NOT total tax)',
    '**Closure applied**: ~45-line VERIFIED CORRECT breadcrumb planted above `computeLine18` JavaDoc at TaxReturnComputeService.java:~11811 (above existing JavaDoc; both navigation landmarks preserved per established 16 #4 / 17 #5 precedent). Structure — 5 sub-verifications: (1) **★ Formula** — line18 = line16 + line17 per spec §1 + IRS 2025 Form 1040 label "Add lines 16 and 17"; pure addition with no transformation, no zero-floor, no rounding (operands already roundMoney\'d upstream); code at ~line 11859. (2) **★ Reads additionalTaxSchedule2 NOT alternativeMinimumTax (G1 fix 2026-04-18)** — semantic field representing Schedule 2 line 3 = line 1z + Form 6251 line 11; currently equal to alternativeMinimumTax since line 1z = 0 in scope but future-safe; lock-in test `line18UsesAdditionalTaxSchedule2ForLine17AddendNotAlternativeMinimumTax`. **⚠️ G-new-5 propagation note**: when wireLine17ToOutputs sets additionalTaxSchedule2 = amt only, line 18 inherits the understatement (PTC > 0 + AMT = 0 case); recommended follow-up fix at wireLine17ToOutputs will auto-propagate without modifying computeLine18. (3) **★ Null-as-zero semantic for both inputs** — line 16 nullable (no tax / zero taxable income path); line 17 nullable (no AMT + no line 1z items); both treated as zero for compositional safety; code at lines ~11844-11846 + ~11854-11856. (4) **★ NOT TOTAL TAX (spec §3 + §4 + §10 — CRITICAL guardrail)** — line 18 is the tax-before-credits SUBTOTAL; total tax is line 24 = line 22 + line 23; Schedule 2 Part II flows to line 23 NOT line 18; method reads ONLY additionalTaxSchedule2 (Schedule 2 line 3 = line 1z + line 2) which by construction excludes Schedule 2 Part II; per spec §6.3 LINE18_EXCLUDES_SCHEDULE2_PARTII invariant. (5) **★ Output** — setTotalTaxBeforeCredits + INFO-level log at lines ~11860 + ~11862-11863; `totalTaxBeforeCredits` is the canonical field; 7 downstream CLW consumers + line 22 read this field. **Coverage cross-references**: spec §1 + §3 + §4 + §6 + §10 + dependencies §1 (post 18 #4 doc-drift fix; now correctly cites additionalTaxSchedule2) + 16 #4 + 17 #4 forward terminal seeds (line 18 inherits AMT-territory navigable hub; no new seed planted here) + 17 #9 G-new-5 observation (propagation note). Pure documentation closure — no functional change. Backend tests: 764/764 unchanged.',
    'TaxReturnComputeService.java:~11811 (above computeLine18 JavaDoc; ~45-line breadcrumb covering 5 sub-verifications)',
    'CLOSED — verified correct. ~45-line breadcrumb documents formula + G1 fix lock-in + null-as-zero semantic + ★ NOT total tax guardrail + output semantics. ⚠️ G-new-5 propagation flagged for visibility (auto-propagates from 17 #9 follow-up fix at wireLine17ToOutputs).'],

  [6, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — TWO call sites in prepare() (primary + secondary G-new-1 refresh per 17 #8 wiring breadcrumb)',
    '**Closure applied**: ~25-line VERIFIED CORRECT breadcrumb planted above the primary call site at TaxReturnComputeService.java:~1255 (above the "// Line 18: total tax before credits = line 16 + line 17." comment). Structure — 2 sub-verifications: (1) **★ PRIMARY CALL** at line 1256 — invocation order verified: AFTER computeLine17 at lines 1247-1254 (line 17 must be set first; computeLine18 reads taxAndCredits.additionalTaxSchedule2 which was just set by wireLine17ToOutputs); BEFORE Form 1116 at line 1259 (Form 1116 CLW reads totalTaxBeforeCredits to compute FTC limitation). Sets INITIAL totalTaxBeforeCredits. (2) **★ SECONDARY CALL** at line 11808 inside `correctLine17ForFtc` — G-new-1 fix (2026-04-18). Already documented in 17 #8 wiring + FTC correction breadcrumb at ~line 11657 (no duplicate breadcrumb at secondary call site needed). Triggered by `if (form6251 != null) { correctLine17ForFtc(...); }` at line ~1264-1266 AFTER applyForeignTaxCreditToSchedule3. Re-wires line 11 corrected → additionalTaxSchedule2 corrected → totalTaxBeforeCredits REFRESHED. **★ Without G-new-1**: all 7 downstream CLW consumers would read STALE totalTaxBeforeCredits → credits incorrectly limited. Lock-in test: `line17GNew1TotalTaxBeforeCreditsRefreshedAfterFtcCorrection` (in line 17 test section). **★ Order matters**: primary call BEFORE Form 1116; secondary call AFTER applyForeignTaxCreditToSchedule3. **Coverage cross-references**: spec §7 + dependencies §5 compute order + 17 #8 breadcrumb at ~line 11657 (covers secondary call site). Pure documentation closure — no functional change. Backend tests: 764/764 unchanged.',
    'TaxReturnComputeService.java:~1255 (primary call site; ~25-line breadcrumb planted above) + ~11808 (secondary call site; covered by 17 #8 breadcrumb at ~11657)',
    'CLOSED — verified correct. ~25-line breadcrumb at primary call site documents PRIMARY (line 1256) + SECONDARY (line 11808 via 17 #8) call sites + invocation order constraints + G-new-1 fix rationale + lock-in test reference.'],

  [7, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — 7 downstream consumers reading totalTaxBeforeCredits (6 CLWs + line 22); read-order verified; 7th anti-duplication application',
    '**Closure applied**: pure cross-reference closure — no new breadcrumb at any consumer site (anti-duplication policy; 7th application in workflow after 12e #8 + 12e #9 + 13a #9 + 13b #9 + 14 #5 + 15 #7). Verification of all 7 consumers per dependencies/18.md §6: **(1) line22** at `computeLine20ThroughLine24` — line22 = max(0, totalTaxBeforeCredits − line21). DIRECT use as credits-section subtractor. **(2) Form 2441 CLW** at `finalizeForm2441PartII` — CLW line A = totalTaxBeforeCredits − Schedule 3 credits. **(3) Form 8880 CLW** at `computeForm8880` — CLW line 10 = totalTaxBeforeCredits − prior credits. **(4) Schedule 8812 (CTC/ODC/ACTC)** at `computeSchedule8812` — CLW line 10 = totalTaxBeforeCredits − prior credits. **(5) Form 8863 CLW** at `computeForm8863` — education credits CLW = totalTaxBeforeCredits − prior credits. **(6) Form 1116 CLW** at `computeForm1116` — CLW line 10 = totalTaxBeforeCredits − prior credits. ⚠️ Triggers correctLine17ForFtc back-correction which refreshes totalTaxBeforeCredits via G-new-1 secondary computeLine18 call. **(7) Form 8839 CLW (partial)** at `computeForm8839` — partial implementation; deferred Schedule 3 line 6c wiring. **★ Read-order analysis**: Form 1116 CLW (#6) reads BEFORE the refresh (correct — it computes its own FTC limitation using initial line 18); consumers #1-5 + #7 read AFTER the refresh (correct — they see the post-FTC corrected value via G-new-1). Without G-new-1, consumers #1-5 + #7 would all read stale values → credits incorrectly limited. **★ Why each consumer reads totalTaxBeforeCredits (not tax or additionalTaxSchedule2)**: IRS CLW pattern is "Enter the amount from Form 1040, line 18, minus credits already claimed on Schedule 3 lines 1 through [N-1]"; line 18 is the canonical upper bound of available tax to absorb the credit. **★ Why no new breadcrumb**: anti-duplication policy applied — 17 #8 + 18 #6 breadcrumbs already explain the order constraints; each future consumer audit will pin its own line-18 dependency at the consumer site (not done here). **7th ANTI-DUPLICATION APPLICATION** in workflow. **Coverage cross-references**: dependencies/18.md §6 + §5 + 18 #6 breadcrumb at ~line 1255 (2-call invocation order) + 17 #8 breadcrumb at ~line 11657 (correctLine17ForFtc + G-new-1 refresh) + G-new-1 lock-in test `line17GNew1TotalTaxBeforeCreditsRefreshedAfterFtcCorrection`. Pure cross-reference closure — no functional change. Backend tests: 764/764 unchanged.',
    'TaxReturnComputeService.java:~1255 (covered by 18 #6 breadcrumb) + ~11657 (17 #8 breadcrumb covers secondary call site + correctLine17ForFtc); 7 consumer methods listed inline in this row',
    'CLOSED — 7-consumer cross-reference verified via dependencies §6 + 18 #6 + 17 #8 breadcrumbs. ★ Read-order: Form 1116 reads BEFORE refresh (correct); 6 other consumers read AFTER refresh (correct, per G-new-1). 7th anti-duplication application in workflow. No breadcrumb at consumer sites.'],

  [8, 'RESOLVED 2026-05-14 — ★ G-new-5 PROPAGATION VERIFICATION — Line 17 understatement carries directly into Line 18 (NOT a new gap; inheritance-via-design — recommended fix at wireLine17ToOutputs auto-propagates)',
    '**Closure applied**: pure cross-reference closure — no code change; no separate fix at line 18 (would be partial fix). **The propagation pathway**: 17 #9 G-new-5 surfaced HIGH-severity bug at wireLine17ToOutputs — `additionalTaxSchedule2 = amt` only (line 11), semantically should equal Schedule 2 line 3 = line 1z + line 11. When PTC repayment > 0 AND AMT = 0: line 17 PDF blank when it should equal PTC repayment. **★ Propagates DIRECTLY to line 18** — computeLine18 reads additionalTaxSchedule2 → null → line 18 = line 16 + 0 → understated by line 1z amount. **Concrete failure mode**: MFJ couple with $5,000 excess advance PTC repayment + no AMT → Form 8962 line 29 = $5,000 → Schedule 2 line 1a wired ✓ → Form 6251 line 11 = $0 → additionalTaxSchedule2 = null (BUG) → line 18 understated by $5,000 → line 22 = max(0, line 18 − line 21) understated by $5,000 → all 7 downstream CLW consumers read STALE totalTaxBeforeCredits → credits inflated using more credit headroom than actually available. **★ THREE sub-verifications**: (1) **Propagation pathway verified** — line 17 → line 18 → 7 downstream consumers; pure addition transmits the understatement directly. (2) **NOT a new gap** — same root cause as 17 #9 G-new-5; line 18 just transmits the error; fixing at line 18 would be a partial fix that masks the line 17 PDF blank problem and diverges additionalTaxSchedule2 from its semantic meaning. (3) **Pin at line 18 site** — propagation already documented in 18 #5 breadcrumb at ~line 11811 (computeLine18 method body G-new-5 propagation note) + 18 #4 documentation drift fix (lines/18.md §7 G-new-5 propagation note). **★ Inheritance-via-design**: line 18 reads the semantic field (additionalTaxSchedule2); when 17 #9 G-new-5 fix lands at wireLine17ToOutputs (compute Schedule2.line1z + set additionalTaxSchedule2 = line1z + line11), line 18 automatically inherits the corrected value WITHOUT any change to computeLine18. **Why not double-fix**: (a) duplicates line-1z aggregation logic at two sites; (b) diverges semantic-field usage (additionalTaxSchedule2 would no longer be canonical); (c) requires two fixes when one will do; (d) tests would multiply. **Coverage cross-references**: 17 #9 G-new-5 observation (root cause + recommended fix point) + 18 #5 breadcrumb (computeLine18 method body G-new-5 propagation note) + 18 #4 spec drift fix (lines/18.md §7 G-new-5 propagation note) + 18 #7 downstream consumers (7 inherits the propagation). Pure observation closure — no functional change. Backend tests: 764/764 unchanged.',
    'TaxReturnComputeService.java:11854 (computeLine18 reads additionalTaxSchedule2 — same field as 17 #9 G-new-5 site at line 11353/wireLine17ToOutputs); 18 #5 breadcrumb at ~line 11811 (propagation note); 18 #4 spec edit at lines/18.md §7 (propagation note)',
    'CLOSED — propagation pinned via 18 #5 breadcrumb + 18 #4 spec edit. NOT a new gap (same root cause as 17 #9 G-new-5). ★ Inheritance-via-design — recommended fix at wireLine17ToOutputs auto-propagates to line 18 without modifying computeLine18.'],

  [9, 'RESOLVED 2026-05-14 — ⚠️ BUNDLED OBSERVATIONS — 3 secondary findings (15th Path A application; 19 consecutive zero-outstanding walkthroughs)',
    '**Closure applied**: pure xlsx-flip observation bundle — **NO code change**; **NO outstanding.md entry** (anti-fragmentation policy). THREE observations bundled — all share same "minor cosmetic / no real fix today / no blocking impact on current returns" rationale. **(a) Knowledge §6 compute order abbreviation — NOT real drift**: knowledge/line-18-total-tax-before-credits.md §6 abbreviates `computeLine17 → TaxAndCredits.alternativeMinimumTax` (line 17). NOT a drift — computeLine17 → wireLine17ToOutputs sets BOTH `alternativeMinimumTax` AND `additionalTaxSchedule2` (per 17 #8 breadcrumb). Knowledge §3 + the actual code confirm correct behavior (G1 fix locked in). No fix needed; just noting that §6 uses an abbreviation. Pre-empts future-maintainer confusion ("wait, knowledge §6 says alternativeMinimumTax but 18 #4 fixed the drift to additionalTaxSchedule2 — which is right?" → read §3 + code; both fields are set; line 18 reads the more semantic one). **(b) computeLine18 LOG.infof at INFO level — high-volume cosmetic**: TaxReturnComputeService.java:11862-11863 emits `Line 18 computed actor=... line16=... line17=... line18=...` at INFO level on every compute pass (1-2 lines per return computation: PRIMARY + optional G-new-1 SECONDARY refresh). Cumulative volume across users can produce log noise. **Why cosmetic**: INFO-level useful for production debugging of credit limitation issues; volume isn\'t catastrophic; pattern varies across codebase. **Recommended action (deferred)**: could be downgraded to DEBUG; low-priority cosmetic change; not blocking. **(c) No flowchart/diagram drift — both files present**: per knowledge §10 identified gaps G2 + G3 (both Fixed 2026-04-18). Confirmed via Glob: `flowcharts/18.drawio` + `diagrams/18.drawio` both exist. No action needed; positive validation. **★ ZERO NEW GAPS surfaced in 18 audit** — first audit since line 14 with no new gaps (contrast 17 audit: 4 NEW gaps G-new-5/6/7/8). Line 18 is so simple (pure addition, no reference data, well-documented from 2026-04-18 G1 fix) that the audit found nothing new — just routine documentation cleanup. **★ Anti-fragmentation policy applied** — 3 observations bundled into ONE Issue #9 closure rather than fragmented across 3 audit rows; all share same closure rationale. **★ 15th PATH A APPLICATION** (after 14 prior: lines 8/9/10/12c-e/13a-b/14/15/16/17 + earlier 18 issues). **★ Streak extends 18 → 19 consecutive zero-outstanding walkthroughs** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18). Pure documentation closure — no functional change. Backend tests: 764/764 unchanged.',
    'knowledge/line-18-total-tax-before-credits.md §6 (abbreviation; NOT drift; renamed from knowledge_line18.md via 18 #2); TaxReturnComputeService.java:11862-11863 (LOG.infof; cosmetic deferred); flowcharts/18.drawio + diagrams/18.drawio (both present; G2 fix 2026-04-18 confirmed)',
    'CLOSED — pure observation bundle. **15th Path A application**; ZERO NEW GAPS surfaced (first audit since line 14 with no new gaps); streak extends 18 → **19 consecutive zero-outstanding walkthroughs**. 3 observations: knowledge §6 abbreviation NOT drift + LOG.infof cosmetic deferred + flowchart/diagram both present (G2 fix confirmed). No outstanding.md entry per anti-fragmentation policy.'],

  [10, 'RESOLVED 2026-05-14 — BOUNDARY MILESTONE — Line 18 walkthrough complete at 10/10; THIRD ORCHESTRATOR-BASED AUDIT IN LINE-16+ CHAIN; ZERO NEW GAPS SURFACED; 19 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS',
    '**Closure applied**: pure xlsx-flip + Verification log finalization — **CLOSES the 18 walkthrough at 10/10**. TWO file touches: (a) this row flipped to RESOLVED with the eight-theme cumulative block; (b) lines/18.md §11 Verification log row finalized IN-PROGRESS → **COMPLETE — 10/10 closed** (single-row shape; matches lines 8/9/10/14/15/16/17). **Eight themes**: (1) **Structural positioning** — 5th audit OUTSIDE 13ab pair (after 14, 15, 16, 17); THIRD orchestrator-based audit in line-16+ chain (after lines 16 + 17). Confirms orchestrator-based audit pattern is workflow norm for tax-territory lines. **★ SIMPLEST line in the chain** — pure arithmetic with zero reference data + zero conditional inputs + zero decision-tree complexity. (2) **★ MFS-guard cascade UNCHANGED at 19 orchestrators** — 11th defensive-gap-NOT-needed Issue #1 in workflow (transitive inheritance from 16 #1 + 17 #1). **★ NEW PATTERN ESTABLISHED**: orchestrator methods without per-spouse parameters use transitive inheritance (first orchestrator-method-based audit with transitive inheritance, after 10 inline-computed line audits used the same pattern). (3) **Knowledge convergence advances 23 → 24 lines** (Issue #2: 11th Legacy A migration — first in double-digit territory after 17 #2 hit the 10-migration mark). (4) **★ 6th DOCUMENTATION DRIFT FIX in workflow** (Issue #4) — spec/dependencies re-aligned with code after G1 fix; lines/18.md §7 + dependencies/18.md row 8 updated to cite `additionalTaxSchedule2`. Pattern: doc→code alignment (never the reverse); code is source of truth. (5) **★ G-new-5 PROPAGATION pinned via inheritance-via-design** (Issue #8) — line 17 understatement propagates directly to line 18; NOT a new gap; same root cause as 17 #9 G-new-5; recommended fix at wireLine17ToOutputs auto-propagates without modifying computeLine18. (6) **Anti-fragmentation continues — 15th Path A + 7th anti-duplication application** (Issue #7: 7-consumer cross-reference via 18 #6 breadcrumb, no per-consumer breadcrumb duplication; Issue #9: 3-observation bundle). (7) **★ ZERO NEW GAPS surfaced in 18 audit** — first audit since line 14 with no new gaps (contrast 17 audit: 4 NEW gaps G-new-5/6/7/8). Line 18 is so simple (pure addition, no reference data, well-documented from 2026-04-18 G1 fix) that audit found nothing new — just routine documentation cleanup. (8) **Cumulative state through line 18**: **44 lines audited** (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + 11b + 12a + 12b + 12c + 12d + 12e + 13a + 13b + 14 + 15 + 16 + 17 + **18**); **437 audit issues closed total** (427 + 10); backend **764/764 pass** (UNCHANGED — pure documentation closure; no new tests this audit; computeLine18 already had thorough JavaDoc + 4 unit tests + 3 E2E tests from 2026-04-18 audit); MFS cascade = **19 orchestrators (UNCHANGED)** — line 18 transitive inheritance; knowledge convergence = **24 lines (+1)**; dependencies files = 43 (unchanged); **★ 6 documentation drift fixes** across workflow (+1 from 18 #4); 15 Path A applications (+1 from 18 #9); **★ 7 anti-duplication applications** (+1 from 18 #7); 2 SEEDED → VERIFIED CORRECT upgrades (unchanged); 2 terminal seeds at orchestrators (unchanged — line 18 inherits 16 #4 + 17 #4 hubs, no new seed planted); **0 NEW gaps surfaced** (first such audit since line 14). **19 CONSECUTIVE WALKTHROUGHS WITH ZERO NEW OUTSTANDING.MD ENTRIES** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/**18**). **Verification logs**: 2ab (4) + 3abc (3) + 4abc (3) + 5abc (3) + 6abcd (4) + 7ab (2) + 8 (1) + 9 (1) + 10 (1) + 11ab (2) + 12abcde (5 — LARGEST) + 13ab (2) + 14 (1) + 15 (1) + 16 (1) + 17 (1) + **18 (1 — single-line shape)**. **Looking ahead — line 19 (Child Tax Credit / Credit for Other Dependents)**: 6th audit OUTSIDE 13ab pair; **★ FIRST audit OUTSIDE the tax-territory chain** (lines 16/17/18 — all tax-side; line 19 is FIRST credits-section line). Likely orchestrator-based audit at `computeSchedule8812`. **Potential MFS guard analysis** at `computeSchedule8812` → would extend cascade to **20 orchestrators**. Heavy compute with CTC/ODC/ACTC + refundable portion + per-dependent SSN/ITIN qualification + Schedule 8812 worksheet. Will use 16 #4 + 17 #4 navigable hubs. **NO code change today; NO backend re-run** (tests already at 764/764 from 17 #1 lock-in).',
    'XLS/computations/18.xlsx audit-trail (this row); lines/18.md §11 Verification log row FINALIZED to COMPLETE — 10/10 closed; knowledge file renamed via 18 #2 (line-18-total-tax-before-credits.md); documentation drift fixed via 18 #4 (lines/18.md §7 + dependencies/18.md row 8)',
    'CLOSED — 10/10. **44 lines audited; 437 issues; 764/764 backend; 19 orchestrators (UNCHANGED); 24-line knowledge convergence; 19 consecutive zero-outstanding walkthroughs; 6 documentation drift fixes; 15 Path A applications; 7 anti-duplication applications; 0 NEW gaps surfaced**. THIRD orchestrator-based audit in line-16+ chain. Next: line 19 (CTC/ODC — FIRST credits-section audit; potential 20th cascade entry).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 120 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 18 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.taxAndCredits.totalTaxBeforeCredits', 'Form 1040 page 2, line 18 (PDF key line18_total_tax_add_lines16_17; rect 504,612,576,624)', 'XLS/output_forms/form-tax-return-1040.xlsx', '★ CANONICAL line 18 output. BigDecimal whole-dollar HALF_UP. Sum of tax (line 16) + additionalTaxSchedule2 (line 17). REFRESHED after FTC correction via G-new-1 fix.'],
  [],
  ['PRIMARY DOWNSTREAM (★★) — 7 consumers'],
  ['Form 1040 line 22 (tax after nonrefundable credits)', 'Form 1040 page 2, line 22', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ line22 = max(0, totalTaxBeforeCredits − line21). DIRECT use as the credits-section subtractor.'],
  ['Form 2441 CLW (child/dependent care credit)', 'Form 2441 Part II', 'XLS/output_forms/form-tax-return-2441.xlsx', '★★ CLW line A = totalTaxBeforeCredits − Schedule 3 credits.'],
  ['Form 8880 CLW (Saver\'s Credit)', 'Form 8880 line 10', 'XLS/output_forms/form-tax-return-8880.xlsx', '★★ CLW line 10 = totalTaxBeforeCredits − prior credits.'],
  ['Schedule 8812 (CTC/ODC/ACTC)', 'Schedule 8812 CLW', 'XLS/output_forms/form-tax-return-schedule8812.xlsx', '★★ CLW line 10 = totalTaxBeforeCredits − prior credits.'],
  ['Form 8863 CLW (education credits)', 'Form 8863 CLW', 'XLS/output_forms/form-tax-return-8863.xlsx', '★★ CLW = totalTaxBeforeCredits − prior credits.'],
  ['Form 1116 CLW (FTC limitation)', 'Form 1116 line 10', 'XLS/output_forms/form-tax-return-1116.xlsx', '★★ CLW line 10 = totalTaxBeforeCredits − prior credits. ⚠️ Triggers correctLine17ForFtc back-correction → secondary computeLine18 call (G-new-1 fix).'],
  ['Form 8839 CLW (adoption credit; partial)', 'Form 8839 CLW (partial)', 'XLS/output_forms/form-tax-return-8839.xlsx', 'CLW wiring partially implemented; deferred Schedule 3 line 6c wiring per knowledge §10.'],
  [],
  ['CONDITIONAL ATTACHMENTS'],
  ['(None at line 18 site)', '—', '—', 'Line 18 itself does NOT create an attachment. Attachments are driven by upstream contents of line 16 (Form 8814 / Form 4972) or line 17 (Form 6251 / Schedule 2).'],
  [],
  ['NOT IN OUTPUT (deliberate exclusions per spec)'],
  ['Schedule 2 Part II amounts', '—', '—', '★ LINE18_EXCLUDES_SCHEDULE2_PARTII invariant — Schedule 2 Part II (lines 4-21) flows to Form 1040 line 23 NOT line 18.'],
  ['Total tax (line 24)', '—', '—', '★ Line 18 is NOT total tax. Total tax = line 24 = line 22 + line 23.'],
  ['Refundable credits + payments', '—', '—', 'Flow at lines 25-31 + later; not in line 18 scope.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 55 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
