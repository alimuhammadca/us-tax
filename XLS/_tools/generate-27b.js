// ============================================================================
//  Generates: C:\us-tax\XLS\computations\27b.xlsx
//
//  Source-of-truth references:
//    - lines/27abc.md §4 "Line 27b — Clergy Filing Schedule SE (Checkbox)" —
//      states `Form1040.line27b = false // always, until SE support is added`.
//      ★ Spec already updated at 27a #4 (Implementation notes drift fix).
//      §22 Verification log row 1 COMPLETE (line 27a audit); this audit appends
//      row 2 for line 27b.
//    - dependencies/27abc.md (148 lines; Audited 2026-04-19; ★ 3 G1-references
//      fixed at 26 #4 cycle for line 26... wait that was line 26. For line 27,
//      no drift in dependencies/27abc.md — this is the 27 combined-spec deps.)
//    - knowledge/line-27abc-earned-income-credit.md §1 row 27b "Always false in
//      current scope; SE out of scope"; §13 G9 OOS Deferred — Line 27b clergy
//      SE checkbox. (★ Renamed at 27a #2 — Legacy A migration already done.)
//    - flowcharts/27abc.drawio (exists); diagrams/27.drawio MISSING.
//    - TaxReturnComputeService.java:
//        line 19885 — INLINE COMMENT "27b (clergy SE checkbox) = always false in
//          current scope (SE out of scope)". ★ Only reference to line 27b in
//          entire codebase; zero code; zero field; zero PDF fill.
//    - form-tax-return-1040.component.ts — ZERO matches for line27b /
//      27b_clergy_se_checkbox. ★ Confirmed no PDF fill exists.
//
//  Tax year: 2025
//
//  Concept:
//    Form1040.line27b = false   // ALWAYS — until Schedule SE / self-employment
//                                  is implemented (G9 DEFERRED OOS).
//
//    ★ DEGENERATE-DERIVED-CONSTANT — line 27b has:
//        NO computation
//        NO helper method
//        NO output field on Payments.java
//        NO PDF-fill mapping
//        NO unit test (nothing to test)
//        NO E2E test (nothing to verify in UI)
//
//    The IRS semantics: line 27b is a CHECKBOX for clergy/religious-worker
//    earned-income double-counting adjustment when filing Schedule SE. Since
//    Schedule SE is OOS, the checkbox is never checked. Documented as G9
//    DEFERRED OOS in knowledge §13.
//
//  Line 27b audit positioning (18th audit OUTSIDE 13ab pair; 57th line):
//   • SEVENTH payments-section audit
//   • ★ 27abc CLUSTER CONTINUES — row 2 appended to existing §22 in lines/27abc.md
//     (★ 4th combined-spec ROW APPEND in workflow after 25b/25c/25d; ★ FIRST
//     combined-spec ROW APPEND for 27abc family)
//   • ★ 4th "already-migrated" Legacy A closure (combined-spec inheritance from
//     27a #2 — file already renamed; convergence UNCHANGED at 33)
//   • ★ 11th META-AUDIT — sub-type (b); ★ DOMINANCE to ~91% (10 of 11);
//     ★ likely CLEAN (degenerate verification — nothing to drift); ★ breaks
//     2-consecutive-drift streak (returns to clean)
//   • ★ DEGENERATE-DERIVED-CONSTANT — STRUCTURALLY SIMPLEST audit in workflow;
//     ★ 7th distinct complexity dimension (NEW: degenerate constant)
//   • ★ NO MFS MECHANISM NEEDED (no code at all; degenerate)
//   • ★ ZERO CONVENTIONS — NEW LOW in workflow
//   • ★ ZERO routing + ZERO reference data — STRUCTURALLY trivial
//   • G9 DEFERRED OOS already documented from 2026-04-19
//
//  Line 27b audit angles (10 issues):
//   1. ★ NO MFS MECHANISM NEEDED — degenerate (no code; line 27b is a derived
//       constant `false`); ★ MFS-guard cascade UNCHANGED at 20 orchestrators.
//   2. ★ 4th "already-migrated" Legacy A closure — combined-spec inheritance
//       from 27a #2 (knowledge file already renamed); convergence UNCHANGED
//       at 33; ★ FIRST already-migrated closure outside 25abcd family.
//   3. ★ SPEC ENHANCEMENT — Append ROW 2 to lines/27abc.md §22 (★ 4th combined-
//       spec ROW APPEND in workflow; ★ FIRST combined-spec ROW APPEND for
//       27abc family; ★ 21st CONSECUTIVE single-row contribution).
//   4. ★ 11th META-AUDIT IN WORKFLOW — sub-type (b); ★ DOMINANCE to ~91%
//       (10 of 11); ★ likely CLEAN (degenerate verification — nothing to
//       drift); ★ returns to clean after 2-consecutive-drift streak.
//   5. VERIFIED CORRECT — line 27b derived state (always `false`); ★ 20th anti-
//       duplication application; ★ NO new breadcrumb (inline comment at
//       TaxReturnComputeService.java:19885 serves as breadcrumb).
//   6. VERIFIED CORRECT — ★ DEGENERATE-DERIVED-CONSTANT chain (★ 7th distinct
//       complexity dimension in workflow — STRUCTURALLY SIMPLEST; no code, no
//       input, no field, no PDF fill).
//   7. VERIFIED CORRECT — ★ ZERO CONVENTIONS (★ NEW LOW in workflow; vs.
//       previous low of 4); line 27b has no field, no helper, no computation.
//   8. VERIFIED CORRECT — 0 routing + ★ 0 reference data; ★ STRUCTURALLY
//       trivial (tied with 25d for least reference data).
//   9. ⚠️ BUNDLED OBSERVATIONS — G9 DEFERRED OOS (clergy SE checkbox); ★ 28th
//       Path A. ★ 32 consecutive zero-outstanding. ★ 15th CONSECUTIVE ZERO
//       NEW GAPS.
//  10. BOUNDARY MILESTONE — SEVENTH payments-section audit; ★ 27abc cluster
//       CONTINUES (row 2 of §22; ★ NOT complete until 27c); ★ DEGENERATE
//       checkbox audit; ★ 11th META-AUDIT; ★ 7th complexity dimension.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '27b.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 27b — CLERGY FILING SCHEDULE SE (CHECKBOX) — 2025'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 27b (page 2; clergy SE checkbox next to line 27a)'],
  ['Concept',
    '★ DEGENERATE CASE — line 27b is a CHECKBOX (not a dollar amount) that signals to the EIC ' +
    'computation that clergy/religious-worker double-counting rules apply when the taxpayer files ' +
    'Schedule SE AND that Schedule SE income overlaps with Form 1040 line 1z. ★ Since Schedule SE / ' +
    'self-employment is OUT OF SCOPE (G9 DEFERRED OOS), the checkbox is ALWAYS unchecked.'],
  ['Top-level formula (spec §4 + knowledge §1 row 27b)',
    'Form1040.line27b = false   // ALWAYS, until SE support is added (G9 DEFERRED OOS)\n' +
    '\n' +
    '★ No computation. No input. No output field. No PDF-fill mapping. No tests.\n' +
    '★ The only reference in the entire codebase is the INLINE COMMENT at\n' +
    'TaxReturnComputeService.java:19885 documenting the design decision:\n' +
    '  // 27b (clergy SE checkbox) = always false in current scope (SE out of scope).'],
  ['Surrounding page-2 chain',
    'line 27a = EIC amount (★ AUDITED 27a #1-#10; line-27a entry)\n' +
    '★ line 27b = clergy SE checkbox (★ THIS LINE — always FALSE)\n' +
    'line 27c = EIC opt-out / disqualified checkbox (derived `line27a == null` at PDF-fill)\n' +
    '\n' +
    '★ Line 27b does NOT contribute to line 32 / line 33 / line 27a computation in current scope.\n' +
    '★ Future: when Schedule SE is implemented, line 27b would be set true when:\n' +
    '  1. Taxpayer is minister/religious worker who has not taken vow of poverty, AND\n' +
    '  2. Filing Schedule SE, AND\n' +
    '  3. Schedule SE includes amount also on Form 1040 line 1z.'],
  ['What line 27b would do in the future (out of scope for 2025)',
    '★ When SE support is added (G9 closed):\n' +
    '  1. Detect clergy/religious-worker filer with Schedule SE income that overlaps line 1z.\n' +
    '  2. Set line 27b = true.\n' +
    '  3. Adjust line 27a (EIC) earned-income worksheet computation to avoid double-counting.\n' +
    '★ Currently: none of this is needed because Schedule SE is OOS.'],
  ['Output target',
    '★ NO output field — line 27b is NOT stored on Payments.java or any output model.\n' +
    'PDF field: line27b_clergy_se_checkbox — ★ NOT FILLED by frontend (no mapping exists).\n' +
    'Frontend: no field reference for line 27b in form-tax-return-1040.component.ts.'],
  ['Backend implementation',
    '★ NO IMPLEMENTATION — line 27b has no code. The only reference is the inline comment at ' +
    'TaxReturnComputeService.java:19885 documenting the design decision. ★ G9 DEFERRED OOS in ' +
    'knowledge §13.'],
  ['IRS source',
    'IRS 2025 Form 1040 (page 2 line 27b clergy checkbox) + 2025 Instructions for Form 1040 ' +
    '(line 27b instructions) + Schedule SE (Schedule SE not implemented). ★ Line 27b is documented ' +
    'in spec lines/27abc.md §4 + knowledge §1 row 27b.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Read line 27b from data source', '★ NO data source — line 27b is not stored.'],
  [2, 'Derive line 27b value', '★ ALWAYS FALSE (constant) — until SE support is added (G9 OOS).'],
  [3, 'Write line 27b to output', '★ NO output write — line 27b has no output field on Payments.java.'],
  [4, 'Render line 27b on PDF', '★ NOT RENDERED — frontend does not fill the line27b_clergy_se_checkbox AcroForm field. PDF shows checkbox unchecked by default.'],
  [],
  ['★ DEGENERATE PROPERTIES SUMMARY'],
  ['Property', 'State'],
  ['Code lines for line 27b', '0 (only an inline comment at line 19885)'],
  ['Helper methods for line 27b', '0'],
  ['Output fields for line 27b', '0'],
  ['PDF-fill mappings for line 27b', '0'],
  ['Unit tests for line 27b', '0'],
  ['E2E tests for line 27b', '0'],
  ['Frontend references for line 27b', '0'],
  ['★ STRUCTURALLY SIMPLEST audit in workflow', '★ TRUE'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 38 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 27b'],
  ['★ ZERO INPUTS — line 27b is a DEGENERATE-DERIVED-CONSTANT (always `false`). No statement form, no personal form, no upstream Form 1040 field, no IRS reference data feeds line 27b.'],
  [],
  ['Source category', 'Status', 'Notes'],
  ['Personal forms', '★ NONE', 'Line 27b has no taxpayer/spouse intake form.'],
  ['Statement forms (W-2, 1099-*, etc.)', '★ NONE', 'No statement form contributes to line 27b.'],
  ['Computed Form 1040 upstream fields', '★ NONE', 'Line 27b does not depend on any upstream field.'],
  ['Filing status', '★ NONE', 'Line 27b does not depend on filing status (always false regardless).'],
  ['IRS reference data', '★ NONE', 'Line 27b has no numeric reference data.'],
  ['Constant', '★ `false` (literal)', '★ Only "input" is the constant `false`; not even read from a source.'],
  [],
  ['★ NO MFS MECHANISM NEEDED'],
  ['Mechanism', 'Status', 'Why'],
  ['M1 in-method null-shadow', 'N/A', 'No code to apply M1 to.'],
  ['M2 transitive inheritance', 'N/A', 'No upstream fields to inherit from.'],
  ['M3 upstream-data-segregated-at-storage', 'N/A', 'No storage queries.'],
  ['M4 in-helper isMfs-flag-gated', 'N/A', 'No helper method.'],
  ['★ Defensive-gap-NOT-needed', '★ TRUE', '★ Line 27b is degenerate — no code = no MFS leakage surface area.'],
  [],
  ['★ FUTURE INPUTS (when G9 closed — Schedule SE implemented)'],
  ['Future input', 'Future effect'],
  ['Clergy/religious-worker indicator on taxpayer profile', 'Would trigger line 27b candidacy.'],
  ['Schedule SE presence + income amount', 'Required for line 27b = true.'],
  ['Form 1040 line 1z (overlap detection)', 'Required: Schedule SE income ALSO on line 1z.'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 50 }, { wch: 22 }, { wch: 70 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 27b'],
  ['★ ZERO reference data — line 27b is a derived constant `false`. No tax-year-specific thresholds, rates, or table parameters apply.'],
  [],
  ['Constant', 'Value', 'Statutory Basis'],
  ['(None — degenerate derived constant)', '`false` (literal)', 'IRS 2025 Form 1040 instructions §line 27b; G9 deferred OOS'],
  [],
  ['★ Reference-data comparison across recent audits'],
  ['Audit', '# numeric constants'],
  ['line 25a', '0'],
  ['line 25b', '0'],
  ['line 25c', '0'],
  ['line 25d', '0'],
  ['line 26', '4 (calendar dates only)'],
  ['line 27a', '★ 72 (HEAVIEST)'],
  ['**line 27b**', '**★ 0 (tied with 25a/b/c/d for FEWEST)**'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 25 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 27b Persistence + Downstream Consumers'],
  ['★ NO outputs — line 27b is a derived constant `false`. NOT stored on Payments.java. NOT filled on PDF. NOT consumed by any downstream computation.'],
  [],
  ['Output target', 'Status'],
  ['form1040.payments.[any field]', '★ NONE — line 27b has no output field'],
  ['PDF field line27b_clergy_se_checkbox', '★ NOT FILLED — frontend does not write this field'],
  ['Frontend display', '★ NONE — no UI element renders line 27b'],
  [],
  ['DOWNSTREAM CONSUMERS'],
  ['Consumer', 'Status'],
  ['Line 27a (EIC) computation', '★ Does not read line 27b (clergy SE adjustment OOS per G9)'],
  ['Schedule 8812 Part II-B', '★ Does not read line 27b'],
  ['Form 2210 penalty calculation', '★ Does not read line 27b'],
  ['★ FUTURE consumer (when G9 closed)', 'Line 27a earned-income worksheet would read line 27b to apply clergy double-counting adjustment'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 75 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 27b'],
  ['★ ZERO validation flags — line 27b is a derived constant `false`; no computation, no failure modes.'],
  [],
  ['Flag code', 'Severity', 'Condition'],
  ['(None)', 'N/A', 'Line 27b has no validation.'],
  [],
  ['STRUCTURAL INVARIANTS'],
  ['Invariant', 'How enforced'],
  ['Line 27b is always `false`', '★ STRUCTURALLY enforced via absence of code that would set it true; G9 DEFERRED OOS.'],
  ['Line 27b PDF checkbox is unchecked', '★ STRUCTURALLY enforced — frontend has no PDF-fill mapping for this field.'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 14 }, { wch: 80 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 27b is a DEGENERATE-DERIVED-CONSTANT (always `false`; G9 DEFERRED OOS). 18th audit OUTSIDE 13ab pair; SEVENTH payments-section audit; ★ 27abc cluster CONTINUES (row 2 of §22; NOT complete until 27c). ★ STRUCTURALLY SIMPLEST audit in workflow. 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-15 — ★ NO MFS MECHANISM NEEDED — line 27b is DEGENERATE (no code; no inputs; no helper); ★ defensive-gap-NOT-needed in degenerate form; MFS cascade UNCHANGED at 20 orchestrators',
    '**The situation**: Line 27b has ZERO code (only an inline comment at TaxReturnComputeService.java:19885 documenting the design decision). No helper method, no field, no PDF fill. ★ Because there is no code, there is no MFS leakage surface area — no defensive guard is needed. ★ Distinct from prior "defensive-gap-NOT-needed" closures (which had code but didn\'t need extra guards); line 27b is "no-code-at-all." ★ MFS-guard cascade UNCHANGED at 20 orchestrators. ★ Pattern distribution UNCHANGED: 6 M2 + 4 M3 + 2 M4. Backend tests: **765/765 unchanged**.',
    'TaxReturnComputeService.java:19885 (inline comment only); zero code',
    'CLOSED — ★ NO MFS MECHANISM NEEDED (degenerate). Line 27b has no code → no MFS leakage surface area → no defensive guard needed. ★ Distinct from prior "defensive-gap-NOT-needed" closures (those had code but no leakage risk); line 27b is "no-code-at-all." MFS cascade UNCHANGED at 20 orchestrators; pattern distribution UNCHANGED. Pure cross-reference closure. 765/765 unchanged.'],

  [2, 'RESOLVED 2026-05-15 — ★ 4th "ALREADY-MIGRATED" Legacy A closure — combined-spec inheritance from 27a #2; convergence UNCHANGED at 33; ★ FIRST already-migrated closure OUTSIDE 25abcd family',
    '**The situation**: Knowledge file for the 27abc cluster was renamed at 27a #2 (2026-05-15): `knowledge_line27abc.md` → `line-27abc-earned-income-credit.md`. Because 27a/27b/27c share a single combined-spec knowledge file, that one rename covers all 3 sub-lines including line 27b. ★ **4th "already-migrated" Legacy A closure in workflow** (after 25b #2 + 25c #2 + 25d #2 — the 25abcd family). ★ **FIRST already-migrated closure OUTSIDE the 25abcd family** — pattern confirmed to extend to other combined-spec families. 3 verification checks pass: (1) renamed file exists at descriptive name; (2) zero hits for old `knowledge_line27b` reference; (3) generator uses post-rename name. **Convergence count UNCHANGED at 33** (no increment). **Legacy A migration count UNCHANGED at 20**. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\knowledge\\line-27abc-earned-income-credit.md (renamed at 27a #2; covers 27b via §1 row 27b + §13 G9)',
    'CLOSED — ★ ALREADY MIGRATED at 27a #2 (combined-spec property; ★ 4th "already-migrated" closure). 3 verification checks pass. **★ 4th "already-migrated" closure in workflow** (after 25b/25c/25d). **★ FIRST already-migrated closure OUTSIDE 25abcd family** — pattern extends to 27abc. ★ Combined-spec property fully validated across 2 separate families (25abcd: 4 audits; 27abc: now 2 audits — 27a debut + 27b inheritance). **Convergence count UNCHANGED at 33**. **Legacy A migration count UNCHANGED at 20**. Pure verification closure.'],

  [3, 'RESOLVED 2026-05-15 — ★ SPEC ENHANCEMENT — Appended ROW 2 to lines/27abc.md §22 Verification log (★ 4th combined-spec ROW APPEND in workflow; ★ FIRST combined-spec ROW APPEND for 27abc family; ★ 21st CONSECUTIVE single-row contribution)',
    '**Goal**: append a NEW ROW (row 2) to the existing `## 22) Verification log` section in `lines/27abc.md` for the line 27b audit. ★ **4th combined-spec ROW APPEND in workflow** (after 25b #3 + 25c #3 + 25d #3 — the 25abcd family). ★ **FIRST combined-spec ROW APPEND for 27abc family** — pre-state: §22 has 1 row (27a COMPLETE); post-state: §22 has 2 rows (27a COMPLETE + 27b IN-PROGRESS). Row 2 finalized to COMPLETE at Issue #10. **★ 21st CONSECUTIVE single-row contribution in workflow**. Pure spec enhancement.',
    'C:\\us-tax\\lines\\27abc.md §22 Verification log (append row 2 to existing 6-column structure)',
    'CLOSED — ROW 2 appended to existing §22 (6-column structure from 27a #3). Row 2 in IN-PROGRESS state with #1+#2+#3 closures enumerated; will be finalized to COMPLETE at Issue #10. **★ 4th combined-spec ROW APPEND in workflow** (after 25b/25c/25d). **★ FIRST combined-spec ROW APPEND for 27abc family** — pattern extends. **★ 21st CONSECUTIVE single-row contribution in workflow**. ★ Pattern fully validated: combined-spec families produce N-row Verification logs (25abcd: 4 rows; 27abc: 2 rows so far, +1 expected at 27c audit).'],

  [4, 'RESOLVED 2026-05-15 — ★ 11th META-AUDIT IN WORKFLOW — sub-type (b) signature; ★ DOMINANCE to ~91% (10 of 11); ★ CLEAN — degenerate verification (no code to drift); ★ returns to clean after 2-consecutive-drift streak (26 #4 + 27a #4 both drift-surfaced); clean trend in sub-type (b) advances from 56% to 60%',
    '**The situation**: Combined-spec META-AUDIT reuse — same dependencies/27abc.md + knowledge/line-27abc-earned-income-credit.md §0 banners serve 27b #4 (and previously served 27a #4 META-AUDIT). 2nd combined-spec META-AUDIT for 27abc family. **★ 11th META-AUDIT in workflow**. **★ ESTABLISHES sub-type (b) at ~91% DOMINANCE — 10 of 11 META-AUDITS** (22+23+24+25a+25b+25c+25d+26+27a+27b); line 21 alone uses sub-type (a). ★ **CLEAN** — degenerate verification with NOTHING TO DRIFT (no code to check; no spec text describing implementation that could mismatch). **★ Returns to clean after 2-consecutive-drift streak** (26 #4 + 27a #4 both surfaced drift). ★ Clean trend in sub-type (b) advances from 56% to 60% (6 clean / 10). **★ 7 consistency checks** all pass: (a) ✅ no helper method exists (correctly absent); (b) ✅ no Payments field (correctly absent); (c) ✅ no frontend mapping (correctly absent); (d) ✅ no e2e test (correctly absent); (e) ✅ spec §4 + knowledge §1 row 27b + knowledge §13 G9 all agree "always false; SE OOS"; (f) ✅ inline comment at line 19885 matches spec/knowledge; (g) ✅ no doc-drift surfaced. **★ NO drift fix needed**. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\dependencies\\27abc.md (Audited 2026-04-19); knowledge file §0 (renamed at 27a #2); spec lines/27abc.md §4',
    'CLOSED — META-AUDIT consistency check complete. **★ 11th META-AUDIT in workflow**. **★ DOMINANCE to ~91% — 10 of 11 META-AUDITS use sub-type (b)** (lines 22+23+24+25a+25b+25c+25d+26+27a+27b); only line 21 uses sub-type (a). ★ **CLEAN** — degenerate verification with nothing to drift. **★ Returns to clean after 2-consecutive-drift streak** (26 #4 + 27a #4 both surfaced drift; 27b #4 breaks the drift streak). ★ Clean trend in sub-type (b) advances from 56% to 60% (6 clean / 10). ★ 2nd combined-spec META-AUDIT reuse for 27abc — same dependencies+knowledge §0 source served 27a #4 + 27b #4. 7/7 consistency checks pass; no doc-drift.'],

  [5, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — line 27b derived state (always `false`; G9 DEFERRED OOS); ★ 20th anti-duplication application; ★ NO new breadcrumb (inline comment at TaxReturnComputeService.java:19885 serves as breadcrumb — smallest possible breadcrumb at 1 line)',
    '**Closure intent**: pure cross-reference closure. Line 27b has no helper method or wiring code — only an INLINE COMMENT at TaxReturnComputeService.java:19885 documenting `// 27b (clergy SE checkbox) = always false in current scope (SE out of scope)`. ★ This inline comment IS the method-level breadcrumb for line 27b (★ smallest possible breadcrumb: 1 line). 3-source coverage: spec §4 + knowledge §1 row 27b + knowledge §13 G9 OOS. **★ 20th anti-duplication application**. ★ NO new breadcrumb planted; existing inline comment re-validated.',
    'TaxReturnComputeService.java:19885 (single inline comment); spec lines/27abc.md §4; knowledge §1 + §13',
    'CLOSED — verified correct via 3-source coverage (spec §4 + knowledge §1 + knowledge §13). **★ 20th anti-duplication application**. ★ NO new breadcrumb planted; existing inline comment at TaxReturnComputeService.java:19885 (1 line) serves as the smallest possible method-level breadcrumb. ★ Line 27b is structurally degenerate — the "implementation" is the absence of implementation, documented by the comment. Pure cross-reference closure.'],

  [6, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — ★ DEGENERATE-DERIVED-CONSTANT chain (★ 7th distinct complexity dimension in workflow — STRUCTURALLY SIMPLEST; no code, no input, no field, no PDF fill)',
    '**Closure intent**: pure cross-reference closure — verifies the degenerate-derived-constant chain. **★ 7th distinct complexity dimension in workflow** — DEGENERATE-DERIVED-CONSTANT (distinct from depth/cumulative/breadth/conditional/pure-sum/dual-form/multi-stage-gated). **Chain stages**: **(1)** No source — line 27b is not read from anywhere. **(2)** No computation — value is the literal `false`. **(3)** No transformation. **(4)** No setter — line 27b has no field on Payments.java. **(5)** No PDF write — frontend has no mapping. **★ STRUCTURALLY SIMPLEST chain in workflow** — even simpler than 25d\'s pure-sum (which had a 3-addend computation); line 27b has NO computation at all. **★ KEY PROPERTY**: degeneracy is the structural distinction; the "chain" is a single constant `false` with no flow.',
    'TaxReturnComputeService.java:19885 (inline comment only); no other code references',
    'CLOSED — verified correct via DEGENERATE-DERIVED-CONSTANT chain. **★ 7th distinct complexity dimension in workflow** — DEGENERATE-DERIVED-CONSTANT (vs. depth/cumulative/breadth/conditional/pure-sum/dual-form/multi-stage-gated). **★ STRUCTURALLY SIMPLEST chain in workflow** — even simpler than 25d\'s pure-sum (which had 3-addend computation); line 27b has NO computation, NO input, NO output field, NO PDF fill. ★ KEY PROPERTY: degeneracy is the structural distinction. ★ Complexity progression: 22 (simple subtraction) → 23 (depth) → 24 (cumulative) → 25b (breadth) → 25c (conditional) → 25d (pure-sum) → 26 (dual-form) → 27a (multi-stage gated; MOST complex) → **27b (degenerate; SIMPLEST)**. ★ Workflow now spans the full spectrum from SIMPLEST (27b) to MOST COMPLEX (27a).'],

  [7, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — ★ ZERO CONVENTIONS (★ NEW LOW in workflow; vs. previous low of 4); line 27b has no field, no helper, no computation; ★ workflow spans full conventions range 0-6 within 2 consecutive audits (27a/27b)',
    '**Closure intent**: pure verification closure — confirms line 27b has zero conventions because it has no field/helper/computation to apply conventions to. **★ Convention 1 (null-when-zero) — N/A**: no field to be null. **★ Convention 2 (no SSN filtering) — N/A**: no attribution logic. **★ Convention 3 (MFJ aggregation) — N/A**: no aggregation. **★ Convention 4 (MFS protection) — N/A**: no helper to protect. **★ Conventions 5+ — N/A**: no audit-specific patterns to verify. **★ ZERO CONVENTIONS in line 27b audit** — ★ NEW LOW in workflow (previous low was 4 at lines 22/24/25a/25c/25d). ★ Workflow now spans the full spectrum: lowest 0 (27b) to highest 6 (27a). Pure verification closure.',
    'TaxReturnComputeService.java:19885 (no code; only inline comment)',
    'CLOSED — verified correct. **★ ZERO CONVENTIONS** — line 27b has no field, no helper, no computation; no conventions apply. **★ NEW LOW in workflow** (previous low of 4 at lines 22/24/25a/25c/25d). ★ Workflow conventions range: 27b (0) → 22/24/25a/25c/25d (4) → 23/25b/26 (5) → 27a (6 NEW HIGH). ★ Convention 4 (MFS protection) does not apply because line 27b has no per-spouse code; M4 mechanism (used 5 times at 27a) is irrelevant for 27b. Pure verification closure.'],

  [8, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — ★ 0 routing distinctions + ★ 0 reference data; ★ STRUCTURALLY trivial (tied with 25a-d for least reference data); ★ workflow reference-data range now spans 0-72 within 2 consecutive audits (27a/27b); ★ 3rd "full spectrum" milestone of 27b audit',
    '**Closure intent**: pure verification closure — confirms line 27b is structurally trivial in routing and reference data. **Routing**: ★ ZERO — line 27b is not on any routing path (no statement form routes here; no IRS rule directs anything to this checkbox in current scope). **Reference data**: ★ ZERO — line 27b is a derived constant `false`; no tax-year-specific values apply. ★ TIED with 25d for least reference data (both at 0). **★ Reference-data comparison across recent audits**: 25a-25d (0) + 26 (4 calendar dates) + 27a (★ 72 HEAVIEST) + **27b (0)**. ★ Workflow reference-data range now spans 0 to 72.',
    'spec lines/27abc.md §4 (always false); knowledge §1 row 27b (always false); knowledge §13 G9 (OOS)',
    'CLOSED — verified correct. **Routing**: ★ ZERO routing distinctions — line 27b has no routing role. **Reference data**: ★ ZERO constants — line 27b is a derived `false` with no tax-year-specific values. ★ TIED with 25d for least reference data. ★ Workflow reference-data range now spans 0 to 72 (27b at floor; 27a at ceiling).'],

  [9, 'RESOLVED 2026-05-16 — ⚠️ BUNDLED OBSERVATIONS — 2 observations (★ 28th Path A application; ★ 32 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS — extends first 20-streak by 12; ★ 15th CONSECUTIVE AUDIT WITH ZERO NEW GAPS; ★ 12th consecutive missing-diagrams gap)',
    '**Closure intent**: pure xlsx-flip observation bundle — **NO code change**; **NO outstanding.md entry**. TWO observations bundled. **(a) G9 DEFERRED OOS — Line 27b clergy SE checkbox**: always `false` until Schedule SE / self-employment is implemented. The MOST line-27b-specific gap (knowledge §13). ★ Will be closed when Schedule SE support is added (likely far future). **(b) Missing `diagrams/27.drawio` cosmetic** — ★ 12th consecutive credits/payments-section audit with this gap (lines 20-24 + 25a + 25b + 25c + 25d + 26 + 27a + 27b). **★ Anti-fragmentation policy applied** — G9 already in outstanding.md from 2026-04-19. **★ 28th PATH A APPLICATION**. **★ 32 consecutive zero-outstanding walkthroughs** (extends first 20-streak by 12). **★ 15th CONSECUTIVE ZERO NEW GAPS**.',
    'G9 DEFERRED OOS clergy SE checkbox; diagrams/27.drawio (missing)',
    'CLOSED — pure observation bundle. **★ 28th Path A application**. **★ 32 consecutive zero-outstanding walkthroughs** (extends first 20-streak by 12). **★ 15th CONSECUTIVE ZERO NEW GAPS** (codebase stability signal continues strengthening). 2 observations: (a) G9 DEFERRED OOS clergy SE checkbox (knowledge §13; ★ THE line-27b-specific gap; will close when Schedule SE is implemented); (b) Missing `diagrams/27.drawio` cosmetic — ★ 12th consecutive credits/payments-section audit with this gap.'],

  [10, 'RESOLVED 2026-05-16 — BOUNDARY MILESTONE — Line 27b walkthrough complete at 10/10; ★ SEVENTH payments-section audit; ★ 27abc cluster CONTINUES (row 2 of §22; ★ NOT complete until 27c audit); ★ DEGENERATE checkbox audit (★ STRUCTURALLY SIMPLEST in workflow); ★ 11th META-AUDIT (★ DOMINANCE to 91%; ★ CLEAN — returns to clean after 2-consecutive-drift streak); ★ 7th distinct complexity dimension (DEGENERATE-DERIVED-CONSTANT); ★ ZERO CONVENTIONS NEW LOW; ★ 32 CONSECUTIVE ZERO-OUTSTANDING; ★ 15th CONSECUTIVE ZERO NEW GAPS; ★ 21st CONSECUTIVE single-row contribution',
    'Pure xlsx-flip + Verification log row 2 finalization — **CLOSES the 27b walkthrough at 10/10**. TWO file touches: (a) this row flipped to RESOLVED; (b) lines/27abc.md §22 Verification log row 2 finalized IN-PROGRESS → **COMPLETE — 10/10 closed**. **Eight themes**: (1) ★ Structural positioning — 18th audit OUTSIDE 13ab pair; ★ SEVENTH payments-section audit; 57th line; ★ STRUCTURALLY SIMPLEST audit in workflow (degenerate-derived-constant); ★ 27abc cluster row 2 of 3 (not complete until 27c). (2) **★ NO MFS MECHANISM NEEDED** (degenerate; no code = no leakage surface area); MFS cascade UNCHANGED at 20 orchestrators. (3) **★ 11th META-AUDIT — DOMINANCE to 91%** (10 of 11); ★ CLEAN; ★ returns to clean after 2-consecutive-drift streak (26 #4 + 27a #4); clean trend in sub-type (b) advances from 56% to 60%. (4) **★ 4th "already-migrated" Legacy A closure** (Issue #2: ★ FIRST already-migrated closure OUTSIDE 25abcd family). (5) **★ 4th combined-spec ROW APPEND** (Issue #3: ★ FIRST combined-spec ROW APPEND for 27abc family; ★ 21st CONSECUTIVE single-row contribution). (6) **★ ZERO CONVENTIONS** (Issue #7: ★ NEW LOW in workflow; vs. previous low of 4). (7) **★ 7th distinct complexity dimension** (Issue #6: DEGENERATE-DERIVED-CONSTANT; ★ STRUCTURALLY SIMPLEST). (8) **★ ZERO NEW gaps surfaced — 15th consecutive audit**. **Cumulative through line 27b**: **57 lines audited**; **567 audit issues closed total** (557 + 10); backend **765/765 pass** (UNCHANGED — 9th audit with zero new tests); MFS cascade = **20 orchestrators** (unchanged); knowledge convergence = **33 lines** (UNCHANGED — ★ 4th "already-migrated" closure); 28 Path A applications; **★ 20 anti-duplication applications** (+1); 0 NEW gaps surfaced (15th consecutive); **★ 11 META-AUDITS** (+1; ★ sub-type (b) at 91% DOMINANCE; ★ CLEAN; clean trend 60%); **★ 12 documentation drift fixes** (UNCHANGED — 27b #4 was CLEAN); **★ 4 distinct MFS-protection mechanisms** (UNCHANGED — 27b had no mechanism); **★ 7 distinct complexity dimensions in workflow** (+1 from 27b #6 ★ NEW DEGENERATE-DERIVED-CONSTANT). **★ 32 CONSECUTIVE WALKTHROUGHS WITH ZERO NEW OUTSTANDING.MD ENTRIES** (extends first 20-streak by 12). **Verification logs**: ... + 27abc (★ 2 rows: 27a COMPLETE + 27b COMPLETE; ★ FIRST combined-spec ROW APPEND for 27abc; ★ 21st CONSECUTIVE single-row). **Looking ahead — line 27c (EIC opt-out / disqualified checkbox)**: 19th audit OUTSIDE 13ab pair; EIGHTH payments-section audit; ★ ANOTHER DEGENERATE checkbox audit (similar to 27b but with one structural twist — 27c is auto-derived from `line27a == null` state, not a pure constant); ★ likely 12th META-AUDIT pushing sub-type (b) DOMINANCE to ~92% (11 of 12); ★ likely 5th "already-migrated" closure; ★ 5th combined-spec ROW APPEND (completes 27abc §22 family at 3 rows); will close the 27abc cluster.',
    'XLS/computations/27b.xlsx audit-trail (this row); lines/27abc.md §22 Verification log row 2 FINALIZED to COMPLETE — 10/10 closed; ★ DEGENERATE checkbox audit',
    'CLOSED — 10/10. **57 lines; 567 issues; 765/765 backend (UNCHANGED — 9th audit with zero new tests); 20 orchestrators (UNCHANGED); 33-line knowledge convergence (UNCHANGED; ★ 4th "already-migrated" closure); 12 doc-drift fixes (UNCHANGED — 27b #4 was CLEAN); 28 Path A applications; ★ 20 anti-duplication applications; ★ 32 consecutive zero-outstanding walkthroughs (extends first 20-streak by 12); ★ 15th CONSECUTIVE ZERO NEW GAPS; ★ 21st CONSECUTIVE single-row contribution; ★ 11 META-AUDITS (★ sub-type (b) at 91% DOMINANCE; ★ CLEAN; clean trend 60%; ★ returns to clean after 2-consecutive-drift streak); ★ 4 distinct MFS-protection mechanisms (UNCHANGED — degenerate); ★ 7 distinct complexity dimensions in workflow (★ NEW DEGENERATE-DERIVED-CONSTANT at 27b; ★ STRUCTURALLY SIMPLEST); ★ ZERO CONVENTIONS at 27b NEW LOW; ★ 27abc cluster CONTINUES (row 2 of §22; row 3 expected at 27c audit)**. ★ SEVENTH payments-section audit. Next: line 27c (★ ANOTHER DEGENERATE checkbox; ★ 5th combined-spec ROW APPEND completing 27abc §22 family at 3 rows; ★ 12th META-AUDIT).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 120 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 27b Flows in the Return'],
  [],
  ['★ NO OUTPUT FLOW — line 27b is a derived constant `false`; not stored, not filled on PDF, not consumed by any downstream computation.', '', ''],
  [],
  ['Output Field Path', 'Output PDF Field', 'Notes'],
  ['(None)', 'line27b_clergy_se_checkbox (★ NOT FILLED)', 'Frontend has no mapping for line 27b; PDF checkbox renders unchecked by default.'],
  [],
  ['DOWNSTREAM IN CURRENT SCOPE'],
  ['Consumer', 'Reads line 27b?'],
  ['Line 27a (EIC) computation', '★ NO — clergy SE adjustment OOS per G9'],
  ['Line 32 (refundable credits subtotal)', '★ NO — line 27b is a checkbox, not a dollar amount'],
  ['Line 33 (total payments)', '★ NO'],
  ['Schedule 8812', '★ NO'],
  [],
  ['★ FUTURE DOWNSTREAM (when G9 closed — Schedule SE implemented)'],
  ['Future consumer', 'Future effect'],
  ['Line 27a earned-income worksheet', 'Would read line 27b to apply clergy double-counting adjustment.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
