// ============================================================================
//  Generates: C:\us-tax\XLS\computations\12b.xlsx
//
//  Source-of-truth references:
//    - lines/12abcde.md (2025 IRS-verified rule map; §2.1 rewritten 2026-05-13 via
//      12a #8 to reflect canonical single-composite output; Verification log section
//      created via 12a #3, first row finalized for 12a)
//    - dependencies/12abcde.md
//    - knowledge/line-12abcde-deductions.md (renamed 2026-05-13 via 12a #2)
//    - TaxReturnComputeService.computeLine12() at line ~2924 — orchestrator; line 12b
//      derivation at lines 2975-2976 with MFS-only inline filter
//    - TaxReturnComputeService.buildStandardDeductionIndicators() at line 2775 — SURGICAL
//      MFS guard via 12a #1 (only `someoneCanClaimSpouse` null-shadowed; `spouseItemizes-
//      SeparateReturn` remains readable on MFS by design — it's an MFS-ONLY field)
//    - PDF semantic CSV row 133: c2_3[0] spouse_itemizes_or_dual_status_alien
//      (⚠️ STALE COMBINED NAMING — drift fix in 12b #6)
//    - Frontend form-tax-return-1040.component.ts:268 — currently writes the COMBINED
//      flag `spouseItemizesOrDualStatus` to c2_3; functional bug per 12b #6 (renders
//      wrong checkbox when only 12c is true)
//
//  Tax year: 2025
//
//  NOTE: Line 12b is the **MFS spouse-itemizes-on-separate-return checkbox** on
//  Form 1040 page 2 line-12 section. Fires ONLY on MFS per spec §4.2 (filing-status-
//  gated). When TRUE → standard_deduction = 0 (hard-zero per spec §5.2; remains TRUE
//  even if age/blind boxes are checked).
//
//  **Line 12b audit positioning** (sibling audit within the 12abcde cluster):
//   • SECOND sub-line in the 12abcde deductions cluster (after 12a)
//   • Sibling-mate audit pattern (analogous to 7b after 7a / 11b after 11a)
//   • Will EXTEND the 12a #4 cluster-level forward-cross-reference seed (FIRST seed
//     extension since 12a #4; validates the cluster-scale seed → extend × 4 template)
//   • NO MFS guard needed at orchestrator entry — `spouseItemizesSeparateReturn` is
//     intentionally MFS-ONLY (per the 12a #1 SURGICAL guard's per-field MFS-semantics
//     classification: `spouseItemizesSeparateReturn` is MFS-legitimate → remains
//     readable on MFS by design)
//   • ⚠️ HIGH-PRIORITY FUNCTIONAL DOCUMENTATION DRIFT FIX at `c2_3[0]` semantic key
//     (combined 12b/12c naming → split to canonical line12b name) + frontend mapping
//     fix (change to use `deductions.line12bChecked` not the combined flag)
//
//  Line 12b audit angles:
//   • Sibling-mate MFS observation (line 12b is MFS-only by design; no guard needed)
//   • Pair-mate knowledge-file cross-reference (shared file; anti-redundancy)
//   • Verification log 2nd row append (cluster log progress: 1 → 2 of eventual 5)
//   • Extend 12a #4 cluster-level seed with line-12b-specific page-2 details (FIRST
//     extension since the cluster-level seed; validates the cluster-scale template)
//   • Verified-correct on MFS-only filter at line 2975-2976
//   • ⚠️ FUNCTIONAL DRIFT FIX — `c2_3[0]` semantic key + frontend mapping (CSV rename
//     + frontend repoint to `deductions.line12bChecked`); same shape as 6c #5 / 6d #5
//     PDF semantic mapping bugs
//   • Verified-correct on hard-zero effect (existing test
//     `computesLine12bForcesStandardDeductionToZeroForMfsSpouseItemizes` covers)
//   • Observation on `spouseItemizesOrDualStatus` combined flag (potentially-stale
//     after 12b #6 fix; note for 12c sibling audit)
//   • Observation on `c2_4[0]` `_alt` suffix drift (out-of-scope for 12b; flagged for
//     12c #6)
//   • Cluster-progress milestone (2nd sub-line of 5; FIRST seed-extension of the
//     12a #4 cluster-level seed)
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '12b.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 12b — MFS SPOUSE-ITEMIZES-ON-SEPARATE-RETURN CHECKBOX'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 12b (page 2, second row of line-12 section; left checkbox)'],
  ['Concept', 'MFS spouse-itemizes checkbox. Fires ONLY when (a) filing status is Married Filing Separately AND (b) the spouse itemizes deductions on the spouse\'s own separate return. When TRUE → standard_deduction = 0 (hard-zero per spec §4.2 + §5.2 — applies even if age/blind boxes are checked). **SECOND sub-line in the 12abcde deductions cluster** (after 12a).'],
  ['Core invariant', '`line12bChecked = (filing_status == MFS) AND (spouseItemizesSeparateReturn == TRUE)` per spec §4.2. Filing-status-gated — fires ONLY on MFS; on any other status (Single / MFJ / HOH / QSS) the checkbox structurally cannot fire. Backend stores as `Boolean line12bChecked` on the Deductions output object. Downstream effect: `standardDeduction = 0` (hard-zero per spec §5.2).'],
  ['Per-Return Formula',
    'INPUT INDICATOR at TaxReturnComputeService.buildStandardDeductionIndicators() (~line 2775):\n' +
    '  Boolean spouseItemizesSeparateReturn = getBoolean(deductionsStandardSpouse, "spouseItemizesSeparateReturn");\n' +
    '  // NOTE: `spouseItemizesSeparateReturn` is MFS-LEGITIMATE per the 12a #1 SURGICAL\n' +
    '  // MFS guard\'s per-field MFS-semantics classification — REMAINS readable on MFS\n' +
    '  // (unlike `someoneCanClaimSpouse` which is null-shadowed on MFS via 12a #1).\n\n' +
    'DERIVATION at TaxReturnComputeService.computeLine12() (~line 2975-2976):\n' +
    '  // Line 12b applies only when filing separately; stale spouse-form data must not\n' +
    '  // affect other statuses.\n' +
    '  boolean line12b = "Married filing separately".equalsIgnoreCase(status)\n' +
    '      && indicators != null && Boolean.TRUE.equals(indicators.getSpouseItemizesSeparateReturn());\n\n' +
    'PERSISTENCE at TaxReturnComputeService.computeLine12() (~line 3024):\n' +
    '  deductions.setLine12bChecked(line12b);\n\n' +
    'HARD-ZERO EFFECT at computeStandardDeduction() (~line 3076):\n' +
    '  if (line12b || line12c) {\n' +
    '    return BigDecimal.ZERO;  // standard_deduction = 0 per spec §5.2\n' +
    '  }\n\n' +
    '**PDF mapping** (⚠️ DRIFT FIX VIA 12b #6):\n' +
    '  PRE-FIX: c2_3[0] → `spouse_itemizes_or_dual_status_alien` (combined naming;\n' +
    '           frontend writes COMBINED flag `spouseItemizesOrDualStatus` → wrong\n' +
    '           checkbox lights up when only 12c is true)\n' +
    '  POST-FIX: c2_3[0] → `line12b_spouse_itemizes_separate_return` (12b-specific);\n' +
    '           frontend writes `deductions.line12bChecked` (not the combined flag)'],
  ['Filed',
    'Form 1040 line 12b checkbox (page 2) — PDF field `c2_3[0]` (rect (115.2, 722, 123.2, 730); LEFT position at y=722).\n' +
    'PRE-FIX semantic key: `spouse_itemizes_or_dual_status_alien` (STALE COMBINED NAMING).\n' +
    'POST-FIX semantic key (via 12b #6): `line12b_spouse_itemizes_separate_return` (12b-specific; aligns with backend `line12bChecked` field name).'],
  ['Backend method', '**Same orchestrator as 12a** — `computeLine12()` derives all 5 sub-lines + Schedule A. Line 12b derivation at lines 2975-2976 has the MFS-only inline filter (filing-status-gated). **No additional MFS guard needed** at the line 12b site — the inline filter constrains to MFS by design; the 12a #1 SURGICAL MFS guard correctly leaves `spouseItemizesSeparateReturn` readable on MFS (per the per-field MFS-semantics classification: this field is MFS-LEGITIMATE, not MFJ-only).'],
  ['Output', 'form1040.deductions.line12bChecked (Boolean). When TRUE → standard deduction is forced to 0 (hard-zero per spec §5.2). Per spec §1.1: this is one of four boolean/integer outputs in the line-12 section (12a + 12b + 12c + 12d), feeding the final numeric line 12e.'],
  ['IRS source', 'IRS 2025 Form 1040 line 12b + lines/12abcde.md spec §1.1 + §2.1 + §4.2 + §5.2. The IRS rule: "If your filing status is married filing separately and your spouse itemizes deductions, check the box on line 12b. If you check this box, your standard deduction is 0." Narrow MFS-only path.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Read `spouseItemizesSeparateReturn` from `standard-deductions-spouse` personal form', 'Boolean. Null if user has not answered. Read via `getBoolean()` in `buildStandardDeductionIndicators()`.'],
  [2, 'Wrap in `StandardDeductionIndicators` record', 'Per 12a #1 SURGICAL MFS guard: this field is MFS-LEGITIMATE → remains readable on MFS (NOT null-shadowed).'],
  [3, 'Apply MFS-only inline filter at computeLine12() line 2975-2976', '`line12b = (status == MFS) AND (spouseItemizesSeparateReturn == TRUE)`. **Filing-status filter inline** — fires ONLY on MFS; on any other status, the AND short-circuits to false. Per spec §4.2.'],
  [4, 'Persist Boolean to Deductions output object', '`deductions.setLine12bChecked(line12b)` at line 3024. JSON field: `line12bChecked` (camelCase).'],
  [5, 'PDF rendering at frontend (POST 12b #6 fix)', 'Frontend writes `deductions.line12bChecked` directly to PDF field `c2_3[0]` semantic key `line12b_spouse_itemizes_separate_return`. Page-2 placement at LEFT position of y=722 row (left of 12c checkbox at c2_4).'],
  [6, 'Downstream hard-zero effect at computeStandardDeduction()', '`if (line12b || line12c) return BigDecimal.ZERO;` — standard deduction forced to 0 per spec §5.2. Age/blind addons (line 12d) DO NOT override the hard-zero. Dependent worksheet (line 12a) is also bypassed when line 12b is TRUE.'],
  [],
  ['MUTUAL EXCLUSION / SPECIAL RULES'],
  ['Rule', 'Implementation', 'Why'],
  ['Line 12b fires only on MFS', 'Inline filter at line 2975: `"Married filing separately".equalsIgnoreCase(status)`. Stale spouse-form data on Single/MFJ/HOH/QSS structurally cannot trigger the checkbox.', 'Per spec §4.2: line 12b applies only when filing separately. The IRS rule depends on the SPOUSE filing a separate return with itemized deductions — a structurally MFS-only scenario.'],
  ['Hard-zero effect on standard deduction', '`if (line12b || line12c) return BigDecimal.ZERO;` at computeStandardDeduction(). Independent of line 12a (dependent worksheet) and line 12d (age/blind chart) — line 12b/12c trump everything.', 'Per spec §5.2: "This remains true even if age / blindness boxes are checked." IRS rule: MFS taxpayer whose spouse itemizes cannot take the standard deduction.'],
  ['12a #1 SURGICAL MFS guard leaves `spouseItemizesSeparateReturn` readable on MFS', 'Per the 12a #1 per-field MFS-semantics classification: `spouseItemizesSeparateReturn` is MFS-LEGITIMATE → REMAINS readable on MFS (not null-shadowed). Only `someoneCanClaimSpouse` is null-shadowed by the SURGICAL guard.', 'Pre-fix: the failed wholesale null-shadow blocked line 12b legitimate input on MFS (`computesLine12bForcesStandardDeductionToZeroForMfsSpouseItemizes` test failed). The surgical pivot via 12a #1 was specifically designed to preserve line 12b functionality.'],
  ['⚠️ PDF FUNCTIONAL DRIFT (FIXED VIA 12b #6)', 'Pre-fix: frontend at form-tax-return-1040.component.ts:268 wrote `spouseItemizesOrDualStatus` (combined flag) to `c2_3[0]` semantic key `spouse_itemizes_or_dual_status_alien`. Wrong checkbox lit up when only 12c was true; both 12b + 12c rendered as one combined checkbox at c2_3. Post-fix: CSV rename + frontend repoint to `deductions.line12bChecked`.', 'Same shape as 6c #5 / 6d #5 PDF semantic mapping bugs — frontend → CSV → PDF wiring drift. **Documentation drift fix #3 in the workflow** (after 11a #8 + 12a #8); FIRST FUNCTIONAL drift fix (prior 2 were documentation-only).'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 12b Triggers'],
  ['Consumer', 'How', 'Notes'],
  ['computeStandardDeduction() — ★★ PRIMARY DOWNSTREAM', '`if (line12b || line12c) return BigDecimal.ZERO;` hard-zero gate.', '★★ CRITICAL: line 12b forces standard_deduction = 0; the dependent worksheet (§5.3) and age/blind chart (§5.4) are bypassed.'],
  ['Form 1040 line 12e (final deduction amount)', 'Indirect via the hard-zero from computeStandardDeduction().', 'Line 12e is the numeric output; when line 12b is TRUE, the standard-deduction path yields 0 → line 12e is 0 unless taxpayer itemizes via Schedule A.'],
  ['Form 1040 line 14 / line 15 / line 16', 'Indirect via line 12e.', 'Per future line 14/15/16 audits.'],
  ['PDF c2_3[0] checkbox (post 12b #6 fix)', 'Frontend writes `deductions.line12bChecked` to canonical semantic key `line12b_spouse_itemizes_separate_return`.', 'Page-2 PDF rendering at LEFT position of y=722 row.'],
  ['NOT IN OUTPUT — line 12b does NOT affect line 13a/13b', '—', 'Lines 13a (QBI) and 13b (Schedule 1-A) are independent of line 12b; only line 12e is affected (via the hard-zero).'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 28 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 12b'],
  ['Line 12b has 1 boolean input + filing-status gating. No statement entries; pure user-attested checkbox.'],
  [],
  ['#', 'Source form', 'Field', 'Type', 'Required?', 'Role', 'Cross-reference'],
  [1, 'standard-deductions-spouse', 'spouseItemizesSeparateReturn', 'Boolean', 'Optional (null → treated as FALSE)', 'Primary trigger — fires ONLY on MFS per spec §4.2', 'MFS-LEGITIMATE per 12a #1 SURGICAL guard (remains readable on MFS); PDF c2_3[0] post 12b #6 fix'],
  [2, 'filing-status', 'filingStatus', 'String', 'YES', 'Gates the line 12b trigger — must be "Married filing separately" for the checkbox to fire', 'Read via `status` parameter to `computeLine12()`; per spec §4.2'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 32 }, { wch: 32 }, { wch: 12 }, { wch: 38 }, { wch: 55 }, { wch: 75 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 12b'],
  [],
  ['No direct numeric constants for line 12b itself (it is a Boolean checkbox; metadata only). **Reference data applies to the downstream standard-deduction zero-out path** (when line 12b is TRUE, standard_deduction = 0 unconditionally per spec §5.2).'],
  [],
  ['Filing-status enumeration (gates the line 12b trigger)'],
  ['Married filing separately', '—', '**The ONLY status where line 12b fires**', 'Per spec §4.2'],
  ['Single / MFJ / HOH / QSS', '—', 'Line 12b structurally cannot fire (inline filter short-circuits to false)', 'Per spec §4.2 + line 2975 inline filter'],
  [],
  ['Statutory references'],
  ['IRC §63(c)(6)(A)', 'IRC §63(c)(6)(A)', 'YES — MFS standard deduction = 0 when spouse itemizes', 'Underlying statute for the hard-zero rule. Per spec §5.2.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 45 }, { wch: 30 }, { wch: 60 }, { wch: 65 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 12b Boolean'],
  ['Line 12b persists a single Boolean on the Deductions output object + (post 12b #6) renders correctly at PDF c2_3[0].'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.deductions.line12bChecked', '`deductions.setLine12bChecked(line12b)` at TaxReturnComputeService.java:~3024', '★ CANONICAL line 12b output. Boolean. TRUE only when MFS AND spouseItemizesSeparateReturn.'],
  ['PDF c2_3[0] checkbox (POST 12b #6)', 'Frontend form-tax-return-1040.component.ts:268 reads `deductions.line12bChecked` (post-fix) and writes to canonical semantic key `line12b_spouse_itemizes_separate_return`', 'Page-2 PDF rendering at LEFT position of y=722 row.'],
  ['computeStandardDeduction() hard-zero — ★★ CRITICAL', '`if (line12b || line12c) return BigDecimal.ZERO;` at computeStandardDeduction() ~line 3076', '★★ Forces standard_deduction = 0 unconditionally per spec §5.2; trumps dependent worksheet + age/blind chart.'],
  ['Indirect — Form 1040 line 12e (final deduction amount)', 'Via the hard-zero.', 'When line 12b TRUE, line 12e is 0 unless taxpayer itemizes via Schedule A.'],
  ['Indirect — line 14 / line 15 / line 16 / downstream', 'Via line 12e.', 'Per future line 14/15/16 audits.'],
  [],
  ['BLOCKING / ADVISORY FLAGS'],
  ['(None at line 12b site)', 'N/A', 'Line 12b is a boolean output; no validation logic emits flags. Spec §10.1 lists conceptual validation rule ("If line 12b is checked, filing status should be MFS") — already enforced structurally via the inline filter at line 2975.', 'N/A'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Line 12b does NOT directly affect line 13a/13b/14', '—', 'Lines 13a/13b are independent; only line 12e is affected (via the hard-zero).'],
  ['`spouseItemizesOrDualStatus` combined flag at StandardDeductionIndicators', '—', 'Combined 12b-OR-12c flag is partial-stale after 12b #6 fix — frontend repointed to use separate `line12bChecked` field; the combined flag may still be used by the 12c rendering (out-of-scope for 12b audit; 12c #6 follow-up).'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 85 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 12b-Related'],
  ['No line-12b-specific BLOCKING flags. Spec §10.1 ("If line 12b is checked, filing status should be MFS") is structurally enforced via the inline filter — the boolean cannot be TRUE without MFS status.'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['(None at line 12b site)', 'N/A', 'Line 12b is a Boolean output; structural invariant via inline filter at line 2975.', 'Spec §10.1 enforcement is implicit via the AND short-circuit logic.'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 12b is the **MFS spouse-itemizes-on-separate-return checkbox** — fires only on MFS per spec §4.2; when TRUE → standard_deduction = 0 (hard-zero per spec §5.2). **Sibling audit within the 12abcde deductions cluster** (2nd of 5 sub-lines; cluster log will reach 2 rows). **The big-ticket item is Issue #6** — ⚠️ FUNCTIONAL PDF semantic-key drift at `c2_3[0]` (currently `spouse_itemizes_or_dual_status_alien` combined naming; frontend writes the wrong source field → wrong checkbox lights up). Verified 2026-05-13.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-13 — CROSS-REFERENCE — NO ADDITIONAL MFS GUARD NEEDED AT LINE 12b SITE (orchestrator-level 12a #1 SURGICAL guard correctly leaves `spouseItemizesSeparateReturn` readable on MFS)', 'Line 12b is computed at TaxReturnComputeService.java:~2975-2976 — inline derivation with MFS-only filter (`"Married filing separately".equalsIgnoreCase(status) && Boolean.TRUE.equals(indicators.getSpouseItemizesSeparateReturn())`). **No additional MFS guard needed at this site** — the inline filter constrains the trigger to MFS by design (and would short-circuit to false on any other status anyway). The orchestrator-level 12a #1 SURGICAL MFS guard at `buildStandardDeductionIndicators` correctly leaves `spouseItemizesSeparateReturn` readable on MFS per the per-field MFS-semantics classification (this field is MFS-LEGITIMATE, the opposite of `someoneCanClaimSpouse` which is MFJ-only and null-shadowed). The initial wholesale null-shadow attempt during 12a #1 broke `computesLine12bForcesStandardDeductionToZeroForMfsSpouseItemizes` exactly because it would have blocked legitimate MFS line 12b input — the SURGICAL pivot was specifically designed to preserve line 12b functionality. **FOURTH defensive-gap-NOT-needed Issue #1 in the workflow** (after 9 #1 + 11a #1 + 11b #1) — all four are inline-compute sites that inherit upstream MFS protection without needing additional guards. Sibling-mate cross-reference to 12a #1 (which acknowledges line 12b\'s MFS-legitimacy directly in the surgical-guard breadcrumb). **Closure**: pure xlsx-flip cross-reference. No code change. No breadcrumb at the line 12b site — coverage will come via 12b #4 (extension of 12a #4 cluster-level seed with line-12b-specific page-2 details) + 12b #5 (verified-correct on the inline MFS-only filter).', 'TaxReturnComputeService.java:~2975-2976 (line 12b inline derivation with MFS-only filter); 12a #1 SURGICAL guard at line ~2775 (per-field classification preserves `spouseItemizesSeparateReturn` on MFS)', 'CLOSED — observation. No code change. FOURTH defensive-gap-NOT-needed Issue #1; sibling-mate to 12a #1.'],
  [2, 'RESOLVED 2026-05-13 — DOCUMENTATION HYGIENE — KNOWLEDGE FILE ALREADY RENAMED VIA 12a #2 (sibling-mate cross-reference within the 12abcde cluster)', '`knowledge/knowledge_line12abcde.md` was renamed → `knowledge/line-12abcde-deductions.md` via 12a #2 (2026-05-13) as part of the shared 12abcde cluster migration (6th Legacy A migration in 3 days). **Shared knowledge file covers all 5 sub-lines** (12a + 12b + 12c + 12d + 12e) — anti-redundancy pattern; convergence stays at **19 lines** (unchanged by line 12b audit). Remaining Legacy A files unchanged (3): knowledge_line16/17/26/27abc.md. **First of 4 expected sibling-mate cross-references within the 12abcde cluster** — future 12c/12d/12e #2 will each follow this same pattern (matches 7ab pattern via 7b #2; matches 11ab pattern via 11b #2; but the 12abcde cluster will have 4 such sibling-mate cross-references — the LARGEST cluster of these in the workflow). **Closure**: pure xlsx-flip cross-reference; no code change; no additional file rename; no generator header update needed (`generate-12b.js` references the already-canonical name).', 'C:\\us-tax\\knowledge\\line-12abcde-deductions.md (already renamed via 12a #2 — sibling-mate cross-reference)', 'CLOSED — sibling-mate cross-reference. No additional rename; convergence stays at 19 lines.'],
  [3, 'RESOLVED 2026-05-13 — SPEC ENHANCEMENT — VERIFICATION LOG 2nd ROW APPENDED TO lines/12abcde.md (cluster log progress: 1 → 2 of eventual 5)', '`lines/12abcde.md` had a Verification log section created via 12a #3 with 1 row finalized to COMPLETE — 10/10 closed for 12a. **Closure applied**: appended a 2nd row to the existing table in IN-PROGRESS state capturing the 12b walkthrough closures (will accumulate Issues #1-#10 outcomes; finalized to "COMPLETE — 10/10 closed" at end of walkthrough). **APPEND-row pattern** (NOT NEW-section creation — section created via 12a #3). **Cluster log progress: 2 rows of eventual 5** — future 12c/12d/12e siblings will each append a row (same APPEND-row pattern as 11b #3). **First of 4 expected APPEND-row operations within the 12abcde cluster** — final shape: 5 rows (LARGEST cluster log in the workflow).', 'lines/12abcde.md (existing Verification log section per 12a #3; 2nd row appended)', 'CLOSED — 2nd row appended. Cluster log progress: 2 of 5; first of 4 expected APPEND-row operations.'],
  [4, 'RESOLVED 2026-05-13 — CROSS-REFERENCE — EXTENDED 12a #4 CLUSTER-LEVEL SEED WITH LINE-12b-SPECIFIC PAGE-2 DETAILS (FIRST extension of a cluster-level seed in the workflow)', 'The 12a #4 cluster-level forward-cross-reference breadcrumb at TaxReturnComputeService.java:~2856 was seeded 2026-05-13 as the FIRST cluster-scale seed in the workflow with placeholder notes for 4 future extensions (12b/12c/12d/12e #4 — seed → extend × 4 pattern). **Closure applied**: extended the 12a #4 breadcrumb with three updates: (1) **header updated** to "12a #4, 2026-05-13; EXTENDED 12b #4, 2026-05-13"; (2) **flipped the "line 12b (future audit)" placeholder block** in the CLUSTER STRUCTURE section to full line-12b documentation — derivation site (line ~2975-2976) + MFS-only filter formula + hard-zero gate at computeStandardDeduction() per spec §5.2 + IRC §63(c)(6)(A) statutory citation + **12b #6 FUNCTIONAL drift fix cross-reference** (CSV row 133 semantic-key rename + frontend mapping repoint) + **12a #1 SURGICAL MFS-guard cross-reference** (per-field classification preserved `spouseItemizesSeparateReturn` on MFS; failed wholesale attempt history) + existing test coverage at TaxReturnComputeServiceTest.java line 11628; (3) **FUTURE EXTENSION POINTS section updated** — flipped "12b #4 — add..." → "12b #4 — EXTENDED 2026-05-13" with extension scope summary; added forward note to 12c #4 about the combined-flag retirement decision per 12b #8 observation; added progress tally ("1 of 4 extensions done; 3 remaining"). **FIRST extension of the 12a #4 cluster-level seed** — validates the cluster-scale seed → extend × 4 template (contrast with 11a #4 being the first extension of 10 #4 PAIR seed; 12b #4 is the first CLUSTER-scale extension in the workflow). Pure documentation extension — no functional change.', 'TaxReturnComputeService.java:~2856 (12a #4 cluster-level breadcrumb; first extension applied; line-12b placeholder flipped to full documentation)', 'CLOSED — 12a #4 breadcrumb extended with line-12b-specific page-2 details. FIRST extension of a cluster-level seed in the workflow.'],
  [5, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — LINE 12b MFS-ONLY FILTER AT LINE ~3001-3002 (per spec §4.2)', 'At TaxReturnComputeService.java:~3001-3002: `boolean line12b = "Married filing separately".equalsIgnoreCase(status) && indicators != null && Boolean.TRUE.equals(indicators.getSpouseItemizesSeparateReturn());`. Matches IRS 2025 Form 1040 line 12b layout + spec §4.2 ("Check line 12b only if filing status is Married filing separately AND the spouse itemizes deductions on the spouse\'s return"). Underlying statute: IRC §63(c)(6)(A). **Three structural properties**: (a) inline filing-status filter — fires ONLY on MFS; on Single/MFJ/HOH/QSS, the AND short-circuits to false (stale spouse-form data structurally cannot trigger the checkbox); (b) null-safe `Boolean.TRUE.equals(...)` — treats null as false; (c) compound AND — both conditions required (filing-status MFS + spouse-itemizes-attestation TRUE; no false-positive scenarios). **Closure applied**: added a **~22-line breadcrumb** above the line 12b derivation documenting the AND-logic with MFS filter + null-safe semantics + **dual-protection cross-reference to 12a #1 SURGICAL MFS guard** (per-field classification preserves `spouseItemizesSeparateReturn` on MFS — opposite polarity from `someoneCanClaimSpouse`) + spec §4.2 + IRC §63(c)(6)(A) statutory citation + downstream hard-zero effect at computeStandardDeduction() per spec §5.2 + existing lock-in test cross-reference (`computesLine12bForcesStandardDeductionToZeroForMfsSpouseItemizes`). Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:~3001-3002 (above the line 12b derivation; ~22-line breadcrumb)', 'CLOSED — verified correct. ~22-line breadcrumb documents MFS-only filter + null-safe + dual-protection with 12a #1 + IRC §63(c)(6)(A).'],
  [6, 'RESOLVED 2026-05-13 — ⚠️ FUNCTIONAL PDF SEMANTIC-KEY DRIFT FIX — `c2_3[0]` combined naming (`spouse_itemizes_or_dual_status_alien` → `line12b_spouse_itemizes_separate_return`); frontend mapping repointed', '⚠️ **FUNCTIONAL BUG**: CSV row 133 had `c2_3[0]` semantic key `spouse_itemizes_or_dual_status_alien` — STALE COMBINED naming merging 12b + 12c into one semantic key. Frontend at `form-tax-return-1040.component.ts:268` wrote the COMBINED flag `form.standardDeductionIndicators?.spouseItemizesOrDualStatus` to this PDF field. Pre-fix failure scenarios: (a) line 12c TRUE alone → wrong checkbox lit up (12b box via combined flag); (b) line 12b TRUE alone → right box but wrong source attribution; (c) both TRUE → only 12b checkbox lit up; 12c was structurally invisible. **Same shape as 6c #5 / 6d #5 PDF semantic mapping bugs**. **Closure applied (four-step fix)**: (1) renamed CSV row 133 semantic key from `spouse_itemizes_or_dual_status_alien` → `line12b_spouse_itemizes_separate_return` in `us-tax-ui/public/irs/f1040_field_mapping_semantic.csv` (frontend-served); (2) same rename in `pdfs/f1040_field_mapping_semantic.csv` (source-of-truth CSV); (3) updated frontend `form-tax-return-1040.component.ts:268` to write `form.deductions?.line12bChecked === true` (separate canonical field) against the new `line12b_*` key + added an inline comment documenting the pre-fix → fix transition; (4) updated `us-tax-be/scripts/generate-semantic-1040-2025.js` line 150 to use the canonical mapping (prevents regression on next regeneration). Grep verified: only the new inline comment in form-tax-return-1040.component.ts references the old key (audit trail in code); audit-trail files (history.md / outstanding.md / generate-12a.js / TaxReturnComputeService.java breadcrumbs) retain the historical reference (intentionally; immutable chronological records). Backend spot-test passes; no backend behavior change. **Documentation drift fix #3 in the workflow** (after 11a #8 + 12a #8) — **FIRST FUNCTIONAL drift fix** in the workflow (prior 2 were documentation-only spec corrections); same shape as 6c #5 / 6d #5 PDF semantic mapping bugs. **NOTE**: `c2_4[0]` `_alt` suffix drift is out-of-scope for 12b; flagged for 12c #6 follow-up.', '4 files updated: us-tax-ui/public/irs/f1040_field_mapping_semantic.csv row 133 (rename); pdfs/f1040_field_mapping_semantic.csv row 133 (rename); us-tax-ui/src/app/forms/form-tax-return-1040.component.ts:268 (frontend mapping repoint); us-tax-be/scripts/generate-semantic-1040-2025.js line 150 (generator canonical key)', 'CLOSED — functional fix. CSV (×2) + frontend + generator updated. Documentation drift fix #3 (FIRST FUNCTIONAL drift fix); same shape as 6c #5 / 6d #5.'],
  [7, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — LINE 12b → STANDARD_DEDUCTION = 0 (hard-zero per spec §5.2; existing test covers)', 'When `line12b == TRUE`, `computeStandardDeduction()` at ~line 3076 returns `BigDecimal.ZERO` per the `if (line12b || line12c)` hard-zero gate. Per spec §5.2: "This remains true even if age / blindness boxes are checked." Underlying statute: IRC §63(c)(6)(A). The hard-zero TRUMPS the dependent worksheet (line 12a), the age/blind chart (line 12d), and the base standard deduction. **Existing test coverage**: TaxReturnComputeServiceTest.java has `computesLine12bForcesStandardDeductionToZeroForMfsSpouseItemizes` at line 11628 — MFS taxpayer with `spouseItemizesSeparateReturn=TRUE` → asserts standard_deduction = 0. This test was the **canary** during the 12a #1 initial wholesale null-shadow attempt — its failure forced the SURGICAL pivot in the MFS guard. **Closure**: pure xlsx-flip affirmative verification — formula + test coverage adequate. **NO new breadcrumb** at the `computeStandardDeduction()` site — the hard-zero gate will be documented in depth during the future **line 12e audit** (which is the numeric output sub-line; line 12b is just one trigger, line 12e is the result of all the path branching). Anti-fragmentation + anti-duplication policy applied — deep gate documentation cleanly attaches to its natural site (12e) via the 12a #4 cluster-level seed → 12e #4 extension pattern. **1st anti-duplication app in the 12b walkthrough** (same pattern as 12a #7 deferring depth-of-documentation to 12e).', 'TaxReturnComputeService.java:~3076 (computeStandardDeduction hard-zero gate); existing test `computesLine12bForcesStandardDeductionToZeroForMfsSpouseItemizes` at line 11628; deep documentation deferred to future 12e #4 extension', 'CLOSED — verified correct. Existing test coverage adequate; deep documentation deferred to future line 12e audit (12e #4 extension).'],
  [8, 'RESOLVED 2026-05-13 — OBSERVATION — `spouseItemizesOrDualStatus` COMBINED FLAG IS PARTIAL-STALE AFTER 12b #6 FIX (12c sibling-audit follow-up)', 'The `StandardDeductionIndicators.spouseItemizesOrDualStatus` field at TaxReturnComputeService.java:2781-2787 computes a COMBINED Boolean (TRUE when either `spouseItemizesSeparateReturn` OR `youWereDualStatusAlien` is TRUE). **Pre-12b #6**: frontend at form-tax-return-1040.component.ts:268 used this combined flag as the SOLE consumer to render `c2_3[0]`. **Post-12b #6**: frontend repointed to use `deductions.line12bChecked` directly — **the combined flag is now UNUSED by line 12b\'s PDF rendering**. **Three possible futures**: (a) RETIRE ENTIRELY — if 12c #6 also repoints frontend to use `deductions.line12cChecked` for `c2_4` (paralleling 12b #6), combined flag becomes orphaned dead code → can be deleted; (b) KEEP FOR 12c-ONLY — if 12c #6 finds reason to keep using the combined flag for `c2_4`, retain with reduced semantic scope; (c) DEPRECATE TO SOFT ADVISORY — retain but flag for cleanup. **Important sub-observation**: `c2_4[0]` is currently NOT written by the frontend at all (only `c2_3[0]` was written, with the combined flag). If the IRS form has a separate 12c checkbox at `c2_4[0]`, the frontend is UNDER-RENDERING line 12c — a separate functional bug for 12c #6 to address. **Closure**: pure xlsx-flip observation — flagged for 12c sibling audit (12c #6 / 12c #8); no code change in 12b walkthrough (out-of-scope; preserve combined flag pending 12c #6 decision). Anti-fragmentation policy applied — NO new outstanding.md entry (the 12a #4 cluster-level seed breadcrumb + this audit row serve as canonical tracking). **2nd anti-duplication app in the 12b walkthrough**.', 'TaxReturnComputeService.java:2781-2787 (`spouseItemizesOrDualStatus` combined flag computation); flagged for 12c sibling audit (12c #6 + 12c #8)', 'CLOSED — observation. Flagged for 12c sibling audit; no code change in 12b walkthrough; anti-fragmentation policy applied.'],
  [9, 'RESOLVED 2026-05-13 — OBSERVATION — `c2_4[0]` `_alt` SUFFIX SEMANTIC-KEY DRIFT IS OUT-OF-SCOPE FOR 12b AUDIT (12c #6 follow-up)', 'CSV row 134 has `c2_4[0]` semantic key `standard_deduction_dual_status_alien_alt` — the `_alt` suffix strongly suggests stale/alternate naming (same shape as the 12a #4 cluster-level seed forward note flagging this drift for 12c #6). **Out-of-scope for 12b audit** — `c2_4[0]` is at RIGHT position rect (304.4, 722, 312.4, 730) → line 12c PDF checkbox (per coordinate analysis: same y=722 row as c2_3 at LEFT, but RIGHT-positioned). The line 12b audit fixes only `c2_3[0]` (LEFT position; line 12b checkbox via 12b #6). **Sub-observation flagged for 12c #6**: the frontend currently does NOT write to `c2_4[0]` at all — pre-12b #6 the combined flag wrote to `c2_3` only; post-12b #6 the separate `line12bChecked` field still writes to `c2_3` only. **Line 12c is currently STRUCTURALLY INVISIBLE on the PDF** (never rendered). Anticipated 12c #6 fix shape: (1) CSV row 134 rename to `line12c_dual_status_alien`; (2) frontend add new mapping `values[\'line12c_dual_status_alien\'] = form.deductions?.line12cChecked === true`; (3) generator script update; (4) combined-flag retirement decision per 12b #8. **Closure**: pure xlsx-flip observation — flagged for 12c #6 sibling audit. NO new code change in 12b walkthrough; scope discipline observation. **3rd anti-duplication app in the 12b walkthrough** (after 12b #7 + 12b #8).', 'C:\\us-tax\\us-tax-ui\\public\\irs\\f1040_field_mapping_semantic.csv row 134 (out-of-scope for 12b; flagged for 12c #6)', 'CLOSED — observation. Scope discipline; flagged for 12c sibling audit; 3rd anti-duplication app in 12b walkthrough.'],
  [10, 'RESOLVED 2026-05-13 — OBSERVATION — LINE 12b IS THE SECOND SUB-LINE IN THE 12abcde CLUSTER + FIRST EXTENSION OF THE 12a #4 CLUSTER-LEVEL SEED + DOCUMENTATION DRIFT FIX #3 (FIRST FUNCTIONAL)', 'Pure xlsx-flip observation — **three workflow milestones**: (1) **SECOND sub-line in the 12abcde deductions cluster** (after 12a) — cluster log progresses from 1 row → 2 rows of eventual 5; 3 more siblings queued (12c/12d/12e). (2) **FIRST extension of the 12a #4 cluster-level seed** — 12b #4 validates the cluster-scale seed → extend × 4 template (contrast with 11a #4 being the first extension of 10 #4 PAIR seed; 12b #4 is the first CLUSTER-scale extension). (3) **Documentation drift fix #3 in the workflow** (12b #6) — FIRST FUNCTIONAL drift fix (prior 2 via 11a #8 + 12a #8 were documentation-only spec corrections); same shape as 6c #5 / 6d #5 PDF semantic mapping bugs. **Cumulative through line 12b**: 34 lines audited (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + 11b + 12a + **12b**); 337 audit issues closed total; backend 760/760 tests pass (unchanged — no new test; existing `computesLine12bForcesStandardDeductionToZeroForMfsSpouseItemizes` covers; 12b #6 was a frontend/CSV fix); MFS-guard cascade = 15 orchestrators (unchanged — line 12b inherits via the 12a #1 SURGICAL guard\'s per-field classification preserving `spouseItemizesSeparateReturn` on MFS); knowledge-file naming convergence = **19 lines** (unchanged from 12a #2 — shared file). **3 anti-duplication apps in 12b walkthrough** (12b #7 + 12b #8 + 12b #9). **ZERO new outstanding.md entries** in 12b walkthrough — **9 consecutive walkthroughs with zero new outstanding entries** (7a/7b/8/9/10/11a/11b/12a/12b). **Closure**: pure xlsx-flip observation; this row is the audit-trail anchor. **Looking ahead — 3 cluster siblings remaining**: line 12c (dual-status alien; will fix `c2_4[0]` `_alt` suffix drift via 12c #6 + render line 12c on the PDF currently invisible per 12b #9 + decide on combined-flag retirement per 12b #8), line 12d (age/blindness count; first audit with numeric box-count + age/blind chart constants), line 12e (final deduction amount; multi-path branching; closes the 12a #4 cluster-level seed → extend × 4 pattern to cluster-final state).', 'XLS/computations/12b.xlsx audit-trail (this row); no additional code change beyond Issue #4 breadcrumb extension + Issue #5 verified-correct breadcrumb + Issue #6 functional drift fix', 'CLOSED — pure xlsx-flip. 2nd sub-line in 12abcde cluster; FIRST cluster-level seed extension; documentation drift fix #3 (FIRST FUNCTIONAL); line 12c sibling audit next.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 100 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 12b Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.deductions.line12bChecked', 'topmostSubform[0].Page2[0].c2_3[0] (POST 12b #6: line12b_spouse_itemizes_separate_return; PRE-FIX: spouse_itemizes_or_dual_status_alien)', 'form-tax-return-1040.xlsx (line 12b checkbox; page 2 left at y=722)', '★ CANONICAL line 12b output. Boolean. TRUE only when MFS AND spouseItemizesSeparateReturn. 12b #6 fixes the PDF semantic-key drift + frontend mapping.'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['computeStandardDeduction() hard-zero gate', '—', '—', '★★ Critical: `if (line12b || line12c) return BigDecimal.ZERO;` — standard deduction forced to 0 per spec §5.2.'],
  ['Form 1040 line 12e (deduction amount)', '—', 'form-tax-return-1040.xlsx (line 12e cell)', 'Indirect via the hard-zero. When line 12b TRUE, line 12e is 0 unless taxpayer itemizes via Schedule A.'],
  ['Form 1040 line 14 / 15 / 16 / downstream', '—', '—', 'Indirect via line 12e → line 14 → line 15 → line 16 tax computation.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Line 12b does NOT affect line 13a (QBI) or line 13b (Schedule 1-A)', '—', '—', 'Lines 13a/13b are independent of line 12b.'],
  ['Combined `spouseItemizesOrDualStatus` flag (post 12b #6)', '—', '—', 'After 12b #6: combined flag no longer used by line 12b PDF rendering (frontend repointed to `deductions.line12bChecked`). May still be used by line 12c — out-of-scope for 12b; 12c #8 follow-up.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 65 }, { wch: 90 }, { wch: 60 }, { wch: 95 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
