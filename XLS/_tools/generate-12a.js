// ============================================================================
//  Generates: C:\us-tax\XLS\computations\12a.xlsx
//
//  Source-of-truth references:
//    - lines/12abcde.md (2025 IRS-verified rule map for Form 1040 lines 12a-12e —
//      shared spec covering the full deductions cluster)
//    - dependencies/12abcde.md
//    - knowledge/line-12abcde-deductions.md (renamed 2026-05-13 via 12a #2 from legacy
//      knowledge_line12abcde.md)
//    - flowcharts/12abcde.drawio
//    - diagrams/12a.drawio + diagrams/12b.drawio + 12c + 12d + 12e (per-sub-line)
//    - TaxReturnComputeService.computeLine12() at line ~2820 — orchestrator (multi-
//      stage: standard deduction worksheet + Schedule A + line 12e election)
//    - TaxReturnComputeService.buildStandardDeductionIndicators() at line 2775 —
//      reads the line-12 checkbox inputs (12a/12b/12c/12d sources); NO MFS guard
//      currently (defensive gap for 12a #1)
//    - PDF semantic CSV row 131: c2_1[0] taxpayer_can_be_claimed_as_dependent
//    - PDF semantic CSV row 132: c2_2[0] spouse_can_be_claimed_as_dependent
//    - IRS 2025 Form 1040 line 12a + Form 1040 instructions Standard Deduction
//      Worksheet for Dependents + age/blind chart
//
//  Tax year: 2025
//
//  NOTE: Line 12a is the **dependent-status checkbox** on Form 1040 page 2 —
//  metadata that controls which standard-deduction worksheet path is used:
//    if line12a: use Dependent Standard Deduction Worksheet (§5.3)
//                $1,350 floor / earned_income + $450 / filing-status cap / age-blind addon
//    else:       use base standard deduction OR age/blind chart (§5.4)
//
//  Two PDF checkboxes (c2_1[0] taxpayer + c2_2[0] spouse) are COLLAPSED to a
//  single composite boolean `line12aChecked` in the backend per the spec §4.1
//  OR logic ("Someone can claim You OR (MFJ AND someone can claim Your Spouse)").
//
//  **Line 12a audit positioning** (cluster-start audit; 5-sub-line cluster):
//   • FIRST sub-line in the **12abcde deductions cluster** (5 sub-lines:
//     12a/12b/12c/12d/12e); **first multi-row cluster in AGI-territory** and
//     potentially LARGEST cluster after 6abcd's 4 sub-lines
//   • THIRD audit in AGI-territory (after line 10 + 11a + 11b pair)
//   • Cluster-start audit pattern (analogous to 6a / 7a / 11a) — seeds the
//     forward-cross-reference breadcrumb at computeLine12() that future 12b/12c/
//     12d/12e audits will extend; seeds the Verification log section in
//     lines/12abcde.md that future siblings will append rows to
//   • HIGH-PRIORITY MFS defensive gap fix at buildStandardDeductionIndicators
//     (currently reads deductionsStandardSpouse unconditionally; existing inline
//     filter at line 2847 protects line 12a output for MFJ-only OR, but indicators
//     object still carries spouse data; null-shadow eliminates the leakage path
//     for defense-in-depth)
//
//  Line 12a audit angles:
//   • HIGH-PRIORITY MFS defensive gap fix at buildStandardDeductionIndicators
//     (cascade extends 14 → 15 orchestrators; new codebase max)
//   • Knowledge file rename (knowledge_line12abcde.md → canonical
//     line-12abcde-deductions.md; 6th Legacy A migration; convergence to 19 lines)
//   • Verification log section CREATED in lines/12abcde.md (NORMAL-variant
//     pattern; cluster-aligned first row; final shape: 5 rows after 12b/c/d/e
//     siblings)
//   • SEED forward-cross-reference breadcrumb at computeLine12 — first FORWARD
//     CROSS-REFERENCE SEED FOR A CLUSTER in the audit workflow (10 #4 was for a
//     pair); future 12b/c/d/e audits will extend incrementally
//   • Verified-correct on MFJ-only-spouse-OR filter at line 2847 (per spec §4.1)
//   • Verified-correct on composite single-boolean output collapsing two PDF
//     checkboxes
//   • Verified-correct on dependent worksheet trigger (existing tests cover)
//   • Documentation drift fix — spec §2.1 lists 2 output fields but backend has 1
//     composite (similar to 11a #8 PDF-claim drift)
//   • Observation on MFJ "joint return filed only to claim refund" nuance
//   • Boundary milestone — first multi-row cluster in AGI-territory; 5-row
//     cluster verification log; 33 lines audited cumulatively
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '12a.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 12a — DEPENDENT CHECKBOX(ES) (Someone can claim You / Your spouse as a dependent)'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 12a (page 2; two checkboxes — TAXPAYER + SPOUSE)'],
  ['Concept', 'Dependent-status checkbox at the top of the Form 1040 page-2 line-12 section. Two PDF checkboxes — "Someone can claim You as a dependent" + "Someone can claim Your spouse as a dependent" (MFJ only). Per spec §4.1, the checkbox is checked when EITHER condition holds; backend collapses both to a single composite boolean `line12aChecked`. **When line 12a is TRUE, the standard deduction MUST be computed via the Dependent Standard Deduction Worksheet** (§5.3), NOT via the base amount or age/blind chart. **FIRST sub-line in the 5-line deductions cluster** (12a/12b/12c/12d/12e) — **first multi-row cluster in AGI-territory**.'],
  ['Core invariant', '`line12aChecked = someoneCanClaimYou OR (filing_status == MFJ AND someoneCanClaimSpouse)` per spec §4.1. Spouse-side flag is OR\'d in ONLY on MFJ — for all other statuses (Single / MFS / HOH / QSS), the spouse value is structurally ignored. When line 12a is TRUE, downstream standard-deduction computation diverges from the base path to use the dependent worksheet. **MFS NOTE**: the existing inline filter at TaxReturnComputeService.java:2847 protects line 12a output (spouse value only OR\'d on MFJ); the 12a #1 defensive gap fix adds defense-in-depth at the orchestrator-entry level to eliminate the indicators-object-carrying-spouse-data path.'],
  ['Per-Return Formula',
    'INPUT INDICATORS at TaxReturnComputeService.buildStandardDeductionIndicators() (~line 2775):\n' +
    '  Boolean someoneCanClaimYou = getBoolean(deductionsStandardTaxpayer, "someoneCanClaimYou");\n' +
    '  Boolean someoneCanClaimSpouse = getBoolean(deductionsStandardSpouse, "someoneCanClaimSpouse");\n' +
    '  // ... wraps in StandardDeductionIndicators record\n\n' +
    'DERIVATION at TaxReturnComputeService.computeLine12() (~line 2846-2847):\n' +
    '  boolean line12a = indicators != null && (\n' +
    '    Boolean.TRUE.equals(indicators.getSomeoneCanClaimYou())\n' +
    '    || ("Married filing jointly".equalsIgnoreCase(status)\n' +
    '        && Boolean.TRUE.equals(indicators.getSomeoneCanClaimSpouse()))\n' +
    '  );\n\n' +
    'PERSISTENCE at TaxReturnComputeService.computeLine12() (~line 2923):\n' +
    '  deductions.setLine12aChecked(line12a);\n\n' +
    '**Single composite boolean** `line12aChecked` — collapses two PDF checkboxes:\n' +
    '  • PDF c2_1[0] (CSV row 131) → taxpayer_can_be_claimed_as_dependent\n' +
    '  • PDF c2_2[0] (CSV row 132) → spouse_can_be_claimed_as_dependent\n\n' +
    '**Downstream switch in computeStandardDeduction() (~line 2968-2980)**:\n' +
    '  if (line12a) {\n' +
    '    // Use Dependent Standard Deduction Worksheet (§5.3)\n' +
    '    // $1,350 floor / earned_income + $450 cap / filing-status base cap\n' +
    '    // + line 12d age-blind addon per checkbox count\n' +
    '  } else {\n' +
    '    // Use base standard deduction OR age/blind chart (§5.4)\n' +
    '  }'],
  ['Filed',
    'Form 1040 line 12a checkboxes (page 2) — TWO separate PDF checkboxes:\n' +
    '  PDF c2_1[0] = `taxpayer_can_be_claimed_as_dependent` (CSV row 131; rect (203.6, 734.002, 211.6, 742.002))\n' +
    '  PDF c2_2[0] = `spouse_can_be_claimed_as_dependent`  (CSV row 132; rect (304.4, 734.002, 312.4, 742.002))\n' +
    'Both render based on the single composite `line12aChecked` boolean per spec §4.1 OR logic.'],
  ['Backend method', '**Multi-stage**: (1) `buildStandardDeductionIndicators()` at line 2775 reads the source booleans from taxpayer + spouse forms; (2) `computeLine12()` at line ~2820 derives the composite `line12a` boolean with the MFJ-only-spouse-OR filter at line 2847; (3) `computeStandardDeduction()` at line ~2968 switches on `line12a` to choose the dependent-worksheet path vs. base/age-blind-chart path. The **defensive gap is at stage (1)** — `buildStandardDeductionIndicators` reads `deductionsStandardSpouse` unconditionally; 12a #1 adds the MFS null-shadow at this entry point.'],
  ['Output', 'form1040.deductions.line12aChecked (Boolean — single composite). When TRUE, triggers the Dependent Standard Deduction Worksheet (§5.3) in `computeStandardDeduction()`. Functionally controls the standard deduction amount on line 12e indirectly (line 12a is checkbox metadata; line 12e is the numeric output).'],
  ['IRS source', 'IRS 2025 Form 1040 line 12a + 2025 Form 1040 instructions Standard Deduction Worksheet for Dependents + lines/12abcde.md spec §1.1 + §2.1 + §4.1 + §5.3. The IRS rule: "Someone can claim You as a dependent" / "Someone can claim Your spouse as a dependent" — the latter applies ONLY on MFJ per spec §4.1 (with the MFJ "joint return filed only to claim a refund" nuance per the same section).'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Read `someoneCanClaimYou` from `standard-deductions-taxpayer` personal form', 'Boolean. Null if user has not answered the question. Read via `getBoolean()`.'],
  [2, 'Read `someoneCanClaimSpouse` from `standard-deductions-spouse` personal form', 'Boolean. Null if user has not answered or no spouse form exists. **MFS defensive gap (12a #1)**: this read is currently unconditional — should null-shadow spouse form on MFS.'],
  [3, 'Wrap both Booleans in `StandardDeductionIndicators` record', 'Multi-flag record carrying all line-12 input booleans (12a sources + 12b spouse-itemizes + 12c dual-status + 12d age/blind boxes).'],
  [4, 'Apply MFJ-only-spouse-OR filter at computeLine12() line 2847', '`line12a = someoneCanClaimYou OR (MFJ AND someoneCanClaimSpouse)`. **Filing-status filter inline** — protects line 12a output even if indicators carry spouse data on non-MFJ statuses.'],
  [5, 'Persist composite boolean to Deductions output object', '`deductions.setLine12aChecked(line12a)` at line 2923. JSON field: `line12aChecked` (camelCase).'],
  [6, 'PDF rendering — TWO checkboxes from ONE boolean', 'PDF export reads the composite + renders both `c2_1[0]` and `c2_2[0]` accordingly. Per spec §1.1 + §4.1: both boxes share the same trigger condition (composite TRUE → both checked); IRS form layout has separate visual checkboxes but the underlying decision is unified.'],
  [7, 'Downstream switch in computeStandardDeduction()', 'If `line12a == TRUE` → use Dependent Standard Deduction Worksheet (§5.3); else use base or age/blind chart (§5.4 — covered by future 12d audit).'],
  [],
  ['MUTUAL EXCLUSION / SPECIAL RULES'],
  ['Rule', 'Implementation', 'Why'],
  ['Spouse-side check only fires on MFJ', 'Inline filter at line 2847: `"Married filing jointly".equalsIgnoreCase(status) && Boolean.TRUE.equals(indicators.getSomeoneCanClaimSpouse())`.', 'Per spec §4.1: line 12a spouse-dependent check is only relevant when filing a joint return. On MFS / Single / HOH / QSS, the spouse field is structurally ignored.'],
  ['Dependent worksheet trumps age/blind chart', 'When `line12a == TRUE`, `computeStandardDeduction()` calls the dependent worksheet path; age/blind boxes (line 12d) contribute via the worksheet\'s line 4b addon, NOT the standalone chart.', 'Per spec §5.3 + §11 ("Do NOT use the age/blind chart when line 12a dependent status applies").'],
  ['Backend collapses TWO PDF checkboxes to ONE composite boolean', '`deductions.line12aChecked` (Boolean, single field) controls PDF rendering of BOTH `c2_1[0]` + `c2_2[0]`.', 'Per spec §4.1 the OR logic is unified — the IRS line 12a "fires" on EITHER condition; backend models this as one boolean. Spec §2.1 lists two separate output fields (`line12a_you_checked` + `line12a_spouse_checked`) which is a documentation drift (per 12a #8 — same shape as 11a #8 PDF-claim drift).'],
  ['MFJ "joint return filed only to claim refund" nuance', 'Per spec §4.1: "on a joint return, you can be claimed on someone else\'s return if the joint return is filed only to claim a refund of withheld tax or estimated tax paid." This is a manual filing decision captured by the user via `someoneCanClaimYou` / `someoneCanClaimSpouse` inputs.', 'Backend does NOT auto-detect this scenario — relies on user-attested booleans. Spec §4.1 documents the nuance for user guidance.'],
  ['MFS NOTE — indicators carry spouse data structurally even though line 12a derivation ignores it (12a #1 closes the gap)', 'Pre-fix: `buildStandardDeductionIndicators` reads `deductionsStandardSpouse` unconditionally → `indicators.someoneCanClaimSpouse` may carry spouse value on MFS. Post-fix (12a #1): null-shadow at orchestrator entry — `indicators.someoneCanClaimSpouse` is null on MFS.', '**Defense-in-depth** — the existing inline filter at line 2847 already protects line 12a output (MFJ-only OR), but null-shadowing the source eliminates the leakage path for any future code that might read `indicators.getSomeoneCanClaimSpouse()` without the MFS filter.'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 12a Triggers'],
  ['Consumer', 'How', 'Notes'],
  ['computeStandardDeduction() — ★★ PRIMARY DOWNSTREAM', '`if (line12a) { /* Dependent Worksheet */ } else { /* base or age-blind chart */ }` at ~line 2979.', '★★ CRITICAL: line 12a controls the standard-deduction COMPUTATION PATH. Dependent worksheet uses earned income + $450 + $1,350 floor + filing-status base cap + age-blind addon.'],
  ['Form 1040 line 12e (final deduction amount)', 'Indirect via the standard-deduction path choice.', 'Line 12e is the numeric output; line 12a controls which formula computes it.'],
  ['Form 1040 line 14 (total deductions = line 12e + line 13a + line 13b)', 'Indirect via line 12e.', 'Per future line 14 audit.'],
  ['Form 1040 line 15 (taxable income = max(0, AGI − line 14))', 'Indirect via line 14.', 'Per future line 15 audit.'],
  ['PDF export — TWO page-2 checkboxes', '`c2_1[0]` taxpayer + `c2_2[0]` spouse both render based on the composite `line12aChecked` boolean.', 'Frontend PDF code must map the single boolean → BOTH checkboxes appropriately (per the OR logic).'],
  ['NOT IN OUTPUT — line 12a does NOT appear in line 13a/13b', '—', 'Line 13a (QBI) + line 13b (Schedule 1-A) are separate deduction computations; line 12a only affects line 12e via the dependent worksheet.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 28 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 12a'],
  ['Line 12a has 2 boolean inputs (taxpayer + spouse). No statement entries; no derived amounts; pure user-attested checkboxes.'],
  [],
  ['#', 'Source form', 'Field', 'Type', 'Required?', 'Role', 'Cross-reference'],
  [1, 'standard-deductions-taxpayer', 'someoneCanClaimYou', 'Boolean', 'Optional (null → treated as FALSE)', 'Primary trigger — fires on ALL filing statuses', 'Spec §4.1; PDF c2_1[0] = `taxpayer_can_be_claimed_as_dependent` (CSV row 131)'],
  [2, 'standard-deductions-spouse', 'someoneCanClaimSpouse', 'Boolean', 'Optional (null → treated as FALSE)', 'Secondary trigger — fires ONLY on MFJ per spec §4.1', 'PDF c2_2[0] = `spouse_can_be_claimed_as_dependent` (CSV row 132); **MFS defensive gap closed via 12a #1**'],
  [3, 'filing-status', 'filingStatus', 'String', 'YES', 'Gates spouse-side OR (only MFJ activates)', 'Read via `status` parameter to `computeLine12()`; per spec §4.1'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 32 }, { wch: 30 }, { wch: 12 }, { wch: 38 }, { wch: 50 }, { wch: 75 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 12a'],
  [],
  ['No direct numeric constants for line 12a itself (it is a checkbox; metadata only). **Reference data applies to the downstream standard-deduction worksheets that line 12a triggers** — captured fully at line 12d (age/blind chart) + line 12e (final amount) audits.'],
  [],
  ['Filing-status enumeration (gates spouse-side OR)'],
  ['Single', '—', 'Spouse-side OR DOES NOT fire', 'Per spec §4.1'],
  ['Married filing jointly', '—', '**Spouse-side OR DOES fire**', 'Per spec §4.1 — the only status where spouse-dependent flag matters'],
  ['Married filing separately', '—', 'Spouse-side OR DOES NOT fire; MFS defensive gap closed via 12a #1', 'Per spec §4.1 + 12a #1 null-shadow'],
  ['Head of household', '—', 'Spouse-side OR DOES NOT fire (HOH is single-filer)', 'Per spec §4.1'],
  ['Qualifying surviving spouse', '—', 'Spouse-side OR DOES NOT fire (deceased spouse)', 'Per spec §4.1'],
  [],
  ['Downstream constants (NOT line 12a itself — at line 12d / 12e audits)'],
  ['Dependent worksheet earned-income floor', '$1,350', 'When `line12a == TRUE` AND earned_income ≤ $900', 'Per spec §5.3 — line 12d / 12e audits will document'],
  ['Dependent worksheet earned-income addon', '+$450', 'When `line12a == TRUE` AND earned_income > $900', 'Per spec §5.3'],
  ['Dependent worksheet — earned-income comparison threshold', '$900', 'Below threshold uses $1,350 floor; above uses earned_income + $450', 'Per spec §5.3'],
  ['Dependent worksheet — filing-status cap', '$15,750 / $31,500 / $23,625', 'Cap on worksheet line 4a per filing status (Single / MFS / MFJ / QSS / HOH)', 'Per spec §5.3 — see line 12d / 12e audits'],
  ['Dependent worksheet — age/blind addon per box', '$2,000 (Single / HOH) or $1,600 (others)', 'Multiplied by line 12d box count', 'Per spec §5.3'],
  [],
  ['Statutory references'],
  ['IRC §63(c)(5)', 'IRC §63(c)(5)', 'YES — dependent-of-another standard deduction limit', 'Defines the dependent worksheet limits.'],
  ['IRC §151(d)(2)', 'IRC §151(d)(2)', 'YES — disallows dependency claim if individual can be claimed', 'Underlying dependency-eligibility rule.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 30 }, { wch: 65 }, { wch: 70 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 12a Composite Boolean'],
  ['Line 12a persists a single composite boolean on the Deductions output object + indirectly controls the standard-deduction computation path.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.deductions.line12aChecked', '`deductions.setLine12aChecked(line12a)` at TaxReturnComputeService.java:~2923', '★ CANONICAL line 12a output. Single composite boolean (true when EITHER taxpayer OR (MFJ AND spouse) is a dependent).'],
  ['PDF c2_1[0] taxpayer checkbox (CSV row 131)', 'Frontend PDF export reads `line12aChecked` + renders this checkbox', 'Page 2 line 12a "You" box at rect (203.6, 734.002, 211.6, 742.002).'],
  ['PDF c2_2[0] spouse checkbox (CSV row 132)', 'Frontend PDF export reads `line12aChecked` + renders this checkbox', 'Page 2 line 12a "Your spouse" box at rect (304.4, 734.002, 312.4, 742.002).'],
  ['computeStandardDeduction() path switch — ★★ CRITICAL', 'Branch at `computeStandardDeduction()` ~line 2979: `if (line12a) { /* Dependent Worksheet */ } else { /* base or age-blind chart */ }`', '★★ Controls the entire standard-deduction COMPUTATION PATH (dependent worksheet vs. base/age-blind chart).'],
  ['Indirect — Form 1040 line 12e (final deduction amount)', 'Via the standard-deduction path choice.', 'Line 12e is the numeric output; line 12a controls which formula computes it.'],
  ['Indirect — line 14 / line 15 / line 16 / downstream', 'Via line 12e.', 'Per future line 12e / 14 / 15 / 16 audits.'],
  [],
  ['BLOCKING / ADVISORY FLAGS'],
  ['(None at line 12a site)', 'N/A', 'Line 12a is a boolean output; no validation logic emits flags. Validation rules (spec §10.1) are conceptual; backend trusts user-attested booleans.', 'N/A'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Line 12a does NOT directly affect line 13a/13b/14', '—', 'Line 12a only changes the standard-deduction COMPUTATION PATH. Line 13a (QBI) and line 13b (Schedule 1-A) are independent of line 12a.'],
  ['Line 12a does NOT auto-detect "joint return filed only to claim refund" nuance', '—', 'Per spec §4.1: this is a manual filing decision; backend trusts user input via `someoneCanClaimYou` / `someoneCanClaimSpouse`.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 12a-Related'],
  ['No line-12a-specific BLOCKING flags. Spec §10.1 lists conceptual validation rules but backend trusts user-attested booleans.'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['(None at line 12a site)', 'N/A', 'Line 12a is a boolean output; no validation logic.', 'Spec §10.1 lists conceptual validation rules (e.g., "if line 12b checked, filing status should be MFS") but backend does not currently enforce.'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 12a is the **dependent-status checkbox** at the top of the Form 1040 page-2 line-12 section. **Cluster-start audit** of the 5-line deductions cluster (12a/12b/12c/12d/12e) — **first multi-row cluster in AGI-territory**; potentially LARGEST cluster after 6abcd 4-row. **The big-ticket item is Issue #1** — HIGH-PRIORITY MFS defensive gap at `buildStandardDeductionIndicators` (cascade extends 14 → 15 orchestrators; new codebase max). Verified 2026-05-13.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-13 — ⚠️ HIGH-PRIORITY DEFENSIVE GAP — MFS GUARD ADDED AT `buildStandardDeductionIndicators` (SURGICAL VARIANT — first non-wholesale MFS guard in the workflow)', '⚠️ **DEFENSIVE GAP FIXED**: Pre-fix, `buildStandardDeductionIndicators` at TaxReturnComputeService.java:2775 did NOT take an `isMfsReturn` parameter — orchestrator read `deductionsStandardSpouse` form unconditionally. Closure required a **SURGICAL variant** of the MFS guard (first such variant in the workflow) because the standard-deductions spouse form has MIXED MFS semantics across its 5 fields: (1) `someoneCanClaimSpouse` — MFJ-ONLY (per spec §4.1) → null-shadow on MFS HERE; (2) `spouseItemizesSeparateReturn` — MFS-ONLY (per spec §4.2) → MUST remain readable on MFS; (3) `spouseBornBeforeThreshold` — MFS narrowly allowed per spec §4.4 → MUST remain readable on MFS; (4) `spouseIsBlind` — same as #3; (5) `spouseMeetsAgeBlindnessMfsRequirements` — MFS-ONLY gating flag → MUST remain readable on MFS. **Initial wholesale null-shadow attempt failed** (broke `computesLine12bForcesStandardDeductionToZeroForMfsSpouseItemizes` + `computesLine12dMfsSpouseBoxesCountedWhenSpouseQualifies` — 2 tests; reverted to surgical shape). **Closure applied (three-step fix; surgical variant)**: (1) Added `boolean isMfsReturn` parameter to signature; (2) renamed `Boolean someoneCanClaimSpouse` → `someoneCanClaimSpouseRaw`; null-shadowed `someoneCanClaimSpouse = isMfsReturn ? null : someoneCanClaimSpouseRaw` (SURGICAL — only this one field; other 4 spouse fields read normally); (3) updated call site at line 575 to pass `isMfsReturn`. Added **~30-line MFS-guard breadcrumb** at TaxReturnComputeService.java enumerating 5 spouse-side fields with per-field MFS-semantics classification + initial-wholesale-attempt-failed history + 15-orchestrator cascade milestone (surgical variant). **NEW lock-in test** `mfsExcludesSpouseDependentFlagFromLine12a` — MFS taxpayer with `someoneCanClaimYou=false` + STALE spouse `someoneCanClaimSpouse=true` → asserts `deductions.getLine12aChecked() != TRUE` (taxpayer-only). **Single-guard MFS cascade now applied to 15 orchestrators** (codebase maximum; the surgical variant at buildStandardDeductionIndicators is the 15th); first non-wholesale variant in the cascade. Backend regression: 759 → 760 (+1 from lock-in).', 'TaxReturnComputeService.java:2774-2812 (signature + surgical null-shadow + ~30-line breadcrumb); line 575 (call site updated); test `mfsExcludesSpouseDependentFlagFromLine12a`', 'CLOSED — defensive gap fixed (SURGICAL variant — first non-wholesale MFS guard in workflow). MFS cascade extends to 15 orchestrators; backend 759 → 760.'],
  [2, 'RESOLVED 2026-05-13 — DOCUMENTATION HYGIENE — KNOWLEDGE FILE RENAME (Legacy A underscore prefix → canonical)', '`knowledge/knowledge_line12abcde.md` used the Legacy A underscore-prefix form. **Closure applied**: (1) renamed `knowledge/knowledge_line12abcde.md` → `knowledge/line-12abcde-deductions.md` (canonical form); (2) updated generator header-comment reference at `generate-12a.js` line 9; (3) grep verified inbound references: `generate-12a.js` (updated) + historical `history.md` mentions (not renamed — history entries are immutable chronological records). No forward-reference in `lines/12abcde.md` (unlike `lines/11ab.md` which had an inbound reference repointed via 11a #2). **SIXTH Legacy A migration** (after 7a #2 + 8 #2 + 9 #2 + 10 #2 + 11a #2). **Knowledge-file naming convergence extends to 19 lines** (1c-1i + 1z + 2ab + 3ab + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11ab + **12abcde**). Remaining Legacy A files after today (3): knowledge_line16/17/26/27abc.md.', 'C:\\us-tax\\knowledge\\line-12abcde-deductions.md (renamed); C:\\us-tax\\XLS\\_tools\\generate-12a.js header (updated)', 'CLOSED — file renamed + generator updated. Convergence at 19 lines.'],
  [3, 'RESOLVED 2026-05-13 — SPEC ENHANCEMENT — VERIFICATION LOG SECTION CREATED IN lines/12abcde.md (NORMAL-variant pattern; cluster-aligned first row of eventual 5-row log)', '`lines/12abcde.md` did NOT have a Verification log section. **Closure applied**: appended a new `## Verification log` section at end of file with 1 row in IN-PROGRESS state capturing the 12a walkthrough (will accumulate Issues #1-#10 outcomes; finalized to "COMPLETE — 10/10 closed" at end of walkthrough). **NEW section creation — NORMAL-variant pattern** (same as 6a #3 + 7a #3 + 11a #3 cluster-start audits). **Cluster-aligned first row** — future 12b/12c/12d/12e sibling audits will each append a row (final log shape: **5 rows**). **LARGEST cluster log shape in the workflow** — exceeds the prior maximum (6abcd 4-row); matches the 5-sub-line cluster structure. Log shape inventory: 2ab=4 / 3abc-5abc=3 / 6abcd=4 / 7ab=2 / 11ab=2 / 8-10=1 / **12abcde=5 (NEW max when complete)**.', 'lines/12abcde.md (new Verification log section with single 12a-audit row; future 12b/c/d/e siblings will append; final shape: 5 rows)', 'CLOSED — spec verification log section created. LARGEST cluster log shape in the workflow when complete (5 rows).'],
  [4, 'RESOLVED 2026-05-13 — CROSS-REFERENCE — SEEDED FORWARD-CROSS-REFERENCE BREADCRUMB AT computeLine12() (FIRST forward-cross-reference SEED FOR A CLUSTER in the audit workflow)', 'The `computeLine12()` orchestrator at TaxReturnComputeService.java:~2854 will be referenced by 4 future sibling audits (12b/12c/12d/12e). **Closure applied**: added a **~70-line cluster-level forward-cross-reference breadcrumb** above the orchestrator method documenting: (1) **CLUSTER STRUCTURE** — enumerated all 5 sub-lines with per-sub-line role + PDF mapping + path-switch semantics (12a dependent checkbox + 12b MFS spouse-itemizes + 12c dual-status alien + 12d age/blind count + 12e final deduction amount with multi-path branching); (2) **CLUSTER-LEVEL PATH BRANCHING** — 6-step cascade (line12b/12c hard-zero → dependent worksheet → age-blind chart → base → Schedule A itemized → disaster-loss combined amount); (3) **MFS GUARD CASCADE** cross-reference to 12a #1 SURGICAL variant; (4) **FUTURE EXTENSION POINTS** — each sibling audit (12b #4 / 12c #4 / 12d #4 / 12e #4) will extend the breadcrumb with its own thematic section (cluster-scale seed → extend × 4 pattern; the cluster will reach FINAL state when 12e #4 closes). Includes forward note flagging two potential PDF semantic-key drifts for 12b #4 + 12c #4 to verify (`c2_3[0]` combined "spouse_itemizes_or_dual_status_alien" naming + `c2_4[0]` "_alt" suffix). **FIRST forward-cross-reference SEED FOR A CLUSTER in the audit workflow** — contrast with 10 #4 which seeded for a PAIR (2 extensions across 11ab); 12a #4 sets up a CLUSTER-SCALE version with 4 extensions. Pure documentation seed — no functional change.', 'TaxReturnComputeService.java:~2854 (above `computeLine12()` orchestrator — ~70-line cluster-level seed breadcrumb)', 'CLOSED — cluster-level seed breadcrumb added. FIRST cluster seed in workflow (10 #4 was a pair seed); seed → extend × 4 pattern established.'],
  [5, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — LINE 12a MFJ-ONLY-SPOUSE-OR FILTER AT LINE ~2954 (per spec §4.1)', 'At TaxReturnComputeService.java:~2954-2955: `boolean line12a = indicators != null && (Boolean.TRUE.equals(indicators.getSomeoneCanClaimYou()) || ("Married filing jointly".equalsIgnoreCase(status) && Boolean.TRUE.equals(indicators.getSomeoneCanClaimSpouse())));`. Matches IRS 2025 Form 1040 line 12a layout + spec §4.1 ("Someone can claim You as a dependent" + (MFJ only) "Your spouse as a dependent"). **Three structural properties**: (a) inline filing-status filter — spouse-side OR only fires on MFJ; (b) null-safe `Boolean.TRUE.equals(...)` — treats null as false; (c) compound OR with short-circuit — if taxpayer flag true, spouse flag is not evaluated. **Closure applied**: added a **~18-line breadcrumb** above the line 12a derivation documenting the OR-logic with MFJ filter + null-safe semantics + dual-protection cross-reference to 12a #1 SURGICAL MFS guard (defense-in-depth: orchestrator null-shadow + inline filter) + cross-reference to spec §4.1 + downstream switch to Dependent Standard Deduction Worksheet per spec §5.3. Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:~2954-2955 (above the line 12a derivation; ~18-line breadcrumb)', 'CLOSED — verified correct. 18-line breadcrumb documents MFJ filter + null-safe + dual-protection with 12a #1.'],
  [6, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — COMPOSITE OUTPUT COLLAPSES TWO PDF CHECKBOXES TO ONE BOOLEAN (`line12aChecked`)', 'Backend stores `Boolean line12aChecked` (single composite field) on the `Deductions` output object. PDF export renders BOTH `c2_1[0]` (CSV row 131 — `taxpayer_can_be_claimed_as_dependent`) + `c2_2[0]` (CSV row 132 — `spouse_can_be_claimed_as_dependent`) based on the single boolean per the spec §4.1 OR logic. **Three verification points**: (a) single Java field reduces UI/backend complexity (one source of truth); (b) PDF mapping to two checkboxes is a frontend concern — PDF export code reads the composite + renders the appropriate checkbox(es); (c) functionally aligns with spec §4.1 OR-trigger ("Someone can claim You OR (MFJ AND Your spouse)"). **Closure**: pure xlsx-flip affirmative verification — design is canonical. Coverage in the cluster-level 12a #4 seed breadcrumb above `computeLine12()` (under "line 12a — DEPENDENT CHECKBOX" thematic section which explicitly notes "Composite boolean (`line12aChecked`) collapsing two PDF checkboxes (`c2_1[0]` taxpayer + `c2_2[0]` spouse)"). **Spec §2.1 drift** (separate Issue #8): spec lists `line12a_you_checked` + `line12a_spouse_checked` as two distinct fields; addressed via 12a #8 (update spec §2.1 to reflect canonical single-composite implementation). **NO new breadcrumb** at the persistence site (`deductions.setLine12aChecked(line12a)` ~line 3023) — anti-duplication policy applied (1st anti-duplication app in the 12a walkthrough). Affirmative-verification audit-trail row pattern (same shape as 11a #5 + 11b #5).', 'TaxReturnComputeService.java:~3023 (`deductions.setLine12aChecked(line12a)`); Deductions.java:7 (single Boolean field); PDF CSV rows 131 + 132; cluster-level 12a #4 seed breadcrumb covers documentation', 'CLOSED — verified correct. No new breadcrumb at persistence site (coverage in 12a #4 seed); 1st anti-duplication app in 12a walkthrough.'],
  [7, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — LINE 12a TRIGGERS DEPENDENT STANDARD DEDUCTION WORKSHEET (existing tests cover; spec §5.3)', 'When `line12a == TRUE`, `computeStandardDeduction()` at ~line 3076 branches to the Dependent Standard Deduction Worksheet path per spec §5.3 — formula: `worksheet_line2 = earned_income > $900 ? earned_income + $450 : $1,350`; `worksheet_line3 = base standard deduction for filing status (Single/MFS $15,750 | MFJ $31,500 | HOH $23,625)`; `worksheet_line4a = min(line2, line3)`; `per_box_addon = $2,000 (Single/HOH) or $1,600 (others)`; `worksheet_line4b = line12d_boxes_checked_count × per_box_addon`; `standard_deduction = worksheet_line4a + worksheet_line4b`. **Existing test coverage** at TaxReturnComputeServiceTest.java: line 11515 + 11788 + 23267-23283 (dependent-filer scenarios with `someoneCanClaimYou=true` + various earned-income amounts + age/blind addon assertions; all match the spec §5.3 formula). **Closure**: pure xlsx-flip affirmative verification — existing test coverage adequate. **NO new breadcrumb** at the `computeStandardDeduction()` site — path-switch logic + worksheet implementation details will be documented in depth during the future **line 12e audit** (which is the numeric output sub-line; line 12a is the trigger, line 12e is the result). Anti-fragmentation + anti-duplication policy applied — deep worksheet breadcrumb cleanly attaches to its natural site (12e) via the 12a #4 seed → 12e #4 extension pattern. **2nd anti-duplication app in 12a walkthrough**.', 'TaxReturnComputeService.java:~3076 (computeStandardDeduction `if (line12a) {}` branch); existing tests at TaxReturnComputeServiceTest.java:11515 + 11788 + 23267-23283; deep documentation deferred to future line 12e audit', 'CLOSED — verified correct. Existing test coverage adequate; deep documentation deferred to future line 12e audit (12e #4 extension).'],
  [8, 'RESOLVED 2026-05-13 — DOCUMENTATION DRIFT FIX — Spec §2.1 lists TWO output fields but backend has ONE composite (asymmetry; same shape as 11a #8)', 'Spec §2.1 (pre-fix) listed **two separate output fields**: `Form1040.line12a_you_checked` + `Form1040.line12a_spouse_checked`. Backend has **one composite field**: `line12aChecked` (Deductions.java:7). Both implementations are functionally correct — the OR-collapsed boolean structurally captures the spec §4.1 rule — but spec §2.1 needed updating to reflect the canonical implementation. **Closure applied**: rewrote `lines/12abcde.md` §2.1 to: (a) list canonical backend output fields (`Form1040.line12aChecked` single composite + `line12bChecked` + `line12cChecked` + `line12dBoxesCheckedCount` + `line12e`); (b) added per-field clarifying notes (12a composite OR logic + PDF mapping + cross-reference to 12a #6); (c) added a closing note acknowledging the prior-stale-two-field-model + correction-via-12a-#8 attribution. **Same shape as 11a #8** (knowledge file PDF claims stale; corrected to match canonical backend). **Documentation drift fix #2 in the workflow** — first was 11a #8 fixing knowledge §3 + §6 G4 + §8. Pure documentation closure — no code change.', 'C:\\us-tax\\lines\\12abcde.md §2.1 (rewritten — now lists canonical single-composite outputs with cross-references)', 'CLOSED — spec §2.1 updated to reflect canonical single-composite implementation. Same shape as 11a #8 drift fix; documentation drift fix #2 in the workflow.'],
  [9, 'RESOLVED 2026-05-13 — OBSERVATION — MFJ "joint return filed only to claim refund" nuance (per spec §4.1; user-attested input)', 'Per spec §4.1: "on a joint return, you can be claimed on someone else\'s return if the joint return is filed only to claim a refund of withheld tax or estimated tax paid." Narrow IRS rule that depends on the PURPOSE of the joint filing — a complex multi-factor test (no balance due + no other tax owed + no schedule attachments other than withholding/estimated tax). **Backend handling**: (a) **NO auto-detection** — backend does not inspect return contents to determine purpose; (b) **user-attested input** — user captures the nuance manually via `someoneCanClaimYou` / `someoneCanClaimSpouse` boolean inputs; (c) **UI form text** should reference the nuance for user-facing guidance (frontend concern; out-of-scope for backend audit). **Three considerations**: (1) **Low-impact** — affects narrow population (couples filing MFJ solely for withholding refund where one could be claimed); (2) **User-driven** — backend correctly accepts user-attested booleans; (3) **No backend deficiency** — spec §4.1 documents the nuance. **Closure**: pure xlsx-flip observation — no code change. **Anti-fragmentation policy applied** — NO new outstanding entry (spec §4.1 + this audit row serve as canonical tracking). Same Path A shape as 7a #9 / 8 #9 / 10 #9 / 11b #8 — **6th Path A application** across the workflow.', 'lines/12abcde.md §4.1 (canonical tracking); UI form text (out-of-scope advisory)', 'CLOSED — observation. Anti-fragmentation policy applied; no new outstanding entry; 6th Path A application.'],
  [10, 'RESOLVED 2026-05-13 — OBSERVATION — LINE 12a IS THE FIRST SUB-LINE IN THE 5-LINE DEDUCTIONS CLUSTER (largest cluster in the workflow; first multi-row cluster in AGI-territory)', 'Pure xlsx-flip observation — **three major workflow milestones**: (1) **FIRST sub-line in the 5-line deductions cluster** (12a/12b/12c/12d/12e) — cluster-start pattern (analogous to 6a / 7a / 11a); 4 sibling audits queued. (2) **FIRST multi-row cluster in AGI-territory** — all 3 prior AGI-territory audits (10 + 11a + 11b) were single-line or pair; deductions cluster opens the multi-row era. (3) **LARGEST cluster in the audit workflow** — 5 sub-lines exceeds 6abcd 4-row prior max; final Verification log will be **5 rows** (largest cluster log). **HIGH-PRIORITY MFS defensive gap fix** (12a #1) extends the single-guard MFS cascade from 14 → **15 orchestrators** (new codebase max) — with the **SURGICAL variant** (FIRST non-wholesale MFS guard in the cascade; mixed-MFS-semantics fields necessitated the surgical approach after the wholesale attempt broke 2 tests). **FIRST forward-cross-reference SEED FOR A CLUSTER** in the audit workflow (12a #4) — contrast with 10 #4 (pair seed; 2 extensions); 12a #4 sets up 4 future extensions (12b/12c/12d/12e #4 — seed → extend × 4 pattern). **Cumulative through line 12a**: 33 lines audited; 327 issues closed total; backend 759 → **760** (+1 from 12a #1 SURGICAL MFS lock-in `mfsExcludesSpouseDependentFlagFromLine12a`); MFS-guard cascade = 15 orchestrators (new codebase max; surgical variant); knowledge-file naming convergence = **19 lines** (extended via 12a #2; **6th Legacy A migration** in 3 days; 3 Legacy A files remain). **ZERO new outstanding.md entries** in 12a walkthrough — **8 consecutive walkthroughs with zero new outstanding entries** (7a/7b/8/9/10/11a/11b/12a). **2 anti-duplication apps + 1 anti-fragmentation app** in 12a walkthrough (12a #6 + 12a #7 anti-duplication; 12a #9 anti-fragmentation Path A). **Documentation drift fix #2 in the workflow** (12a #8 — same shape as 11a #8). **Closure**: pure xlsx-flip observation; this row is the audit-trail anchor. **Looking ahead — 4 cluster siblings queued**: line 12b (MFS spouse-itemizes; potential CSV `c2_3[0]` drift fix), line 12c (dual-status alien; potential CSV `c2_4[0]` `_alt` suffix drift), line 12d (age/blindness count; first audit with numeric box-count + age/blind chart constants), line 12e (final deduction amount; multi-path branching; will close the 12a #4 seed → extend × 4 pattern).', 'XLS/computations/12a.xlsx audit-trail (this row); no code change beyond Issue #1 MFS guard fix + Issue #4 forward-cross-reference seed + Issue #5 verified-correct breadcrumb', 'CLOSED — pure xlsx-flip. Cluster-start; first multi-row AGI cluster; LARGEST cluster; MFS cascade = 15 (new max; SURGICAL variant); line 12b sibling audit next.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 100 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 12a Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.deductions.line12aChecked', 'topmostSubform[0].Page2[0].c2_1[0] (taxpayer_can_be_claimed_as_dependent) + topmostSubform[0].Page2[0].c2_2[0] (spouse_can_be_claimed_as_dependent)', 'form-tax-return-1040.xlsx (line 12a checkboxes; page 2)', '★ CANONICAL line 12a output. Single composite Boolean; renders BOTH PDF checkboxes per spec §4.1 OR logic.'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['computeStandardDeduction() path switch', '—', '—', '★★ Critical: branches to Dependent Standard Deduction Worksheet (§5.3) when TRUE; else base or age/blind chart (§5.4).'],
  ['Form 1040 line 12e (deduction amount)', '—', 'form-tax-return-1040.xlsx (line 12e cell)', 'Indirect via standard-deduction path choice. Per future line 12e audit.'],
  ['Form 1040 line 14 / line 15 / line 16', '—', '—', 'Indirect via line 12e → line 14 = line12e + line13a + line13b → line15 = max(0, AGI − line14) → line 16 tax computation.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Line 12a does NOT affect line 13a (QBI) or line 13b (Schedule 1-A)', '—', '—', 'Lines 13a/13b are independent of line 12a; only line 12e is path-switched by line 12a.'],
  ['Line 12a does NOT auto-detect MFJ "joint return for refund only" nuance', '—', '—', 'Per spec §4.1: manual filing decision; backend trusts user-attested booleans.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 65 }, { wch: 75 }, { wch: 60 }, { wch: 95 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
