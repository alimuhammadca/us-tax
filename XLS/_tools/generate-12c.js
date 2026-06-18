// ============================================================================
//  Generates: C:\us-tax\XLS\computations\12c.xlsx
//
//  Source-of-truth references:
//    - lines/12abcde.md (Verification log via 12a #3; 12b #3 appended row 2)
//    - dependencies/12abcde.md
//    - knowledge/line-12abcde-deductions.md (renamed via 12a #2)
//    - TaxReturnComputeService.computeLine12() at line ~2924 — orchestrator; line 12c
//      derivation at line ~3024 with no filter (taxpayer-side field)
//    - TaxReturnComputeService.buildStandardDeductionIndicators() at line 2775 — SURGICAL
//      MFS guard via 12a #1; `youWereDualStatusAlien` is a TAXPAYER-side field (not
//      affected by the SURGICAL spouse-side null-shadow)
//    - PDF semantic CSV row 134: c2_4[0] standard_deduction_dual_status_alien_alt
//      (⚠️ STALE `_alt` SUFFIX — drift fix in 12c #6)
//    - Frontend form-tax-return-1040.component.ts — currently does NOT write c2_4[0];
//      line 12c is structurally INVISIBLE on PDF (will be fixed via 12c #6)
//
//  Tax year: 2025
//
//  NOTE: Line 12c is the **dual-status-alien checkbox** on Form 1040 page 2 line-12
//  section. Fires when taxpayer was a dual-status alien during the tax year (per spec
//  §4.3). When TRUE → standard_deduction = 0 (hard-zero per spec §5.2). IRS rule:
//  do NOT check line 12c if the taxpayer and spouse validly elect to be taxed on
//  combined worldwide income as U.S. residents for the full year.
//
//  **Line 12c audit positioning** (sibling audit within the 12abcde cluster):
//   • THIRD sub-line in the 12abcde deductions cluster (after 12a + 12b)
//   • Cluster-mid-progress audit (cluster log progress: 2 → 3 of eventual 5)
//   • Will EXTEND the 12a #4 cluster-level seed (SECOND extension; cluster progress:
//     2 of 4 extensions done)
//   • NO MFS guard needed — `youWereDualStatusAlien` is taxpayer-side (not subject
//     to the 12a #1 SURGICAL spouse-side null-shadow)
//   • ⚠️ TWO FUNCTIONAL FIXES at PDF rendering: (a) CSV row 134 `_alt` suffix drift
//     fix; (b) frontend mapping ADD to render line 12c on PDF (currently invisible)
//   • Combined-flag `spouseItemizesOrDualStatus` retirement decision per 12b #8 —
//     post-12c #6 the combined flag has NO active consumers; will DEPRECATE
//     (option (c) — preserves backward compat; flags for future removal)
//
//  Line 12c audit angles:
//   • Sibling-mate MFS observation (taxpayer-side; no MFS impact)
//   • Sibling-mate knowledge-file cross-reference (shared file; 3rd of 4 in cluster)
//   • Verification log 3rd row append (cluster log progress: 3 of 5)
//   • Extend 12a #4 cluster-level seed with line-12c-specific page-2 details (2nd
//     extension; cluster-level seed progress: 2 of 4 done)
//   • Verified-correct on no-filter derivation at line ~3024
//   • ⚠️ FUNCTIONAL drift fix #4 in workflow (2nd FUNCTIONAL) — CSV rename + frontend
//     mapping ADD + generator script + RENDERS LINE 12c ON PDF for the first time
//   • Verified-correct on hard-zero effect (existing test covers)
//   • Combined-flag retirement decision — DEPRECATE option (c) chosen; first
//     @Deprecated annotation in the audit workflow
//   • Observation on IRS dual-status-alien U.S.-resident-election nuance (spec §4.3;
//     user-attested; anti-fragmentation policy)
//   • Cluster-progress milestone (3rd sub-line; documentation drift fix #4; renders
//     line 12c on PDF for the first time; first @Deprecated annotation)
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '12c.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 12c — DUAL-STATUS ALIEN CHECKBOX'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 12c (page 2, second row of line-12 section; right checkbox at y=722)'],
  ['Concept', 'Dual-status alien checkbox. Fires when the taxpayer was a dual-status alien during the tax year (per spec §4.3 + IRC §7701(b)). When TRUE → standard_deduction = 0 (hard-zero per spec §5.2). IRS rule: do NOT check line 12c if the taxpayer and spouse validly elect to be taxed on combined worldwide income as U.S. residents for the full year. **THIRD sub-line in the 12abcde deductions cluster** (after 12a + 12b).'],
  ['Core invariant', '`line12cChecked = (youWereDualStatusAlien == TRUE)` per spec §4.3. NO filing-status filter (taxpayer-side field; applies to all filing statuses). Backend stores as `Boolean line12cChecked` on the Deductions output object. Downstream effect: `standardDeduction = 0` (hard-zero per spec §5.2).'],
  ['Per-Return Formula',
    'INPUT INDICATOR at TaxReturnComputeService.buildStandardDeductionIndicators() (~line 2779):\n' +
    '  Boolean youWereDualStatusAlien = getBoolean(deductionsStandardTaxpayer, "youWereDualStatusAlien");\n' +
    '  // NOTE: TAXPAYER-side field; NOT subject to the 12a #1 SURGICAL MFS guard\n' +
    '  // (which only null-shadows the spouse-side `someoneCanClaimSpouse` field).\n\n' +
    'DERIVATION at TaxReturnComputeService.computeLine12() (~line 3024):\n' +
    '  boolean line12c = indicators != null && Boolean.TRUE.equals(indicators.getYouWereDualStatusAlien());\n\n' +
    'PERSISTENCE at TaxReturnComputeService.computeLine12() (~line 3046):\n' +
    '  deductions.setLine12cChecked(line12c);\n\n' +
    'HARD-ZERO EFFECT at computeStandardDeduction() (~line 3076):\n' +
    '  if (line12b || line12c) {\n' +
    '    return BigDecimal.ZERO;  // standard_deduction = 0 per spec §5.2\n' +
    '  }\n\n' +
    '**PDF mapping** (⚠️ DRIFT FIX VIA 12c #6):\n' +
    '  PRE-FIX: c2_4[0] → `standard_deduction_dual_status_alien_alt` (stale `_alt`\n' +
    '           suffix; frontend NOT writing → line 12c structurally INVISIBLE on PDF)\n' +
    '  POST-FIX: c2_4[0] → `line12c_dual_status_alien` (canonical 12c-specific name);\n' +
    '           frontend ADDS `values[\'line12c_dual_status_alien\'] = form.deductions?.line12cChecked === true`\n' +
    '           → line 12c renders on PDF for the FIRST TIME'],
  ['Filed',
    'Form 1040 line 12c checkbox (page 2) — PDF field `c2_4[0]` (rect (304.4, 722, 312.4, 730); RIGHT position at y=722, paired with c2_3 [12b LEFT] on the same row).\n' +
    'PRE-FIX semantic key: `standard_deduction_dual_status_alien_alt` (STALE `_alt` SUFFIX; never written by frontend → invisible PDF).\n' +
    'POST-FIX semantic key (via 12c #6): `line12c_dual_status_alien` (12c-specific; aligns with backend `line12cChecked` field name; PARALLELS 12b #6 fix).'],
  ['Backend method', '**Same orchestrator as 12a + 12b** — `computeLine12()` derives all 5 sub-lines + Schedule A. Line 12c derivation at line 3024 — NO filing-status filter (taxpayer-side field). **No MFS guard needed at the line 12c site** — `youWereDualStatusAlien` is a TAXPAYER-side field read in `buildStandardDeductionIndicators` at line 2779; NOT subject to the 12a #1 SURGICAL spouse-side null-shadow.'],
  ['Output', 'form1040.deductions.line12cChecked (Boolean). When TRUE → standard deduction is forced to 0 (hard-zero per spec §5.2). Per spec §1.1: this is one of four boolean/integer outputs in the line-12 section (12a + 12b + 12c + 12d), feeding the final numeric line 12e.'],
  ['IRS source', 'IRS 2025 Form 1040 line 12c + lines/12abcde.md spec §1.1 + §2.1 + §4.3 + §5.2. The IRS rule: "Check line 12c if the taxpayer was a dual-status alien. Do not check line 12c if the taxpayer and spouse validly elect to be taxed on combined worldwide income as U.S. residents for the full year." Statutory basis: IRC §7701(b) (dual-status alien definition) + IRC §63(c)(6)(B) (no standard deduction for dual-status filers).'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Read `youWereDualStatusAlien` from `standard-deductions-taxpayer` personal form', 'Boolean. Null if user has not answered. Read via `getBoolean()` in `buildStandardDeductionIndicators()`. **Taxpayer-side field** — not affected by MFS guard.'],
  [2, 'Wrap in `StandardDeductionIndicators` record', 'No MFS-related transformation needed (taxpayer-side).'],
  [3, 'Derive line12c at computeLine12() line ~3024', '`line12c = indicators != null && Boolean.TRUE.equals(indicators.getYouWereDualStatusAlien());`. **No filing-status filter** — applies regardless of filing status.'],
  [4, 'Persist Boolean to Deductions output object', '`deductions.setLine12cChecked(line12c)` at ~line 3046. JSON field: `line12cChecked` (camelCase).'],
  [5, 'PDF rendering at frontend (POST 12c #6 fix)', 'Frontend writes `deductions.line12cChecked` directly to PDF field `c2_4[0]` semantic key `line12c_dual_status_alien`. Page-2 placement at RIGHT position of y=722 row (right of 12b checkbox at c2_3). **First-time PDF rendering** — pre-fix the field was structurally invisible.'],
  [6, 'Downstream hard-zero effect at computeStandardDeduction()', '`if (line12b || line12c) return BigDecimal.ZERO;` — standard deduction forced to 0 per spec §5.2. Age/blind addons (line 12d) DO NOT override. Dependent worksheet (line 12a) is also bypassed when line 12c is TRUE.'],
  [],
  ['MUTUAL EXCLUSION / SPECIAL RULES'],
  ['Rule', 'Implementation', 'Why'],
  ['Line 12c has NO filing-status filter', 'Inline derivation `boolean line12c = ... && Boolean.TRUE.equals(indicators.getYouWereDualStatusAlien());` — applies to all filing statuses (Single / MFJ / MFS / HOH / QSS).', 'Per spec §4.3: dual-status alien status is a taxpayer-side IRC §7701(b) classification independent of filing status. Different from line 12b which is MFS-only.'],
  ['Hard-zero effect on standard deduction', '`if (line12b || line12c) return BigDecimal.ZERO;` at computeStandardDeduction(). Trumps dependent worksheet (line 12a) and age/blind chart (line 12d).', 'Per spec §5.2 + IRC §63(c)(6)(B): dual-status alien cannot take the standard deduction; must itemize or take zero.'],
  ['Do NOT check 12c if valid U.S.-resident-full-year election', 'Per spec §4.3: "Do not check line 12c if the taxpayer and spouse validly elect to be taxed on combined worldwide income as U.S. residents for the full year." User-attested via the `youWereDualStatusAlien` boolean — backend trusts user input.', 'IRS rule: IRC §6013(g)/(h) elections override dual-status treatment; the user must self-attest whether the election applies.'],
  ['No MFS guard needed at orchestrator entry', '`youWereDualStatusAlien` is read from `deductionsStandardTaxpayer` (taxpayer form); not affected by the 12a #1 SURGICAL spouse-side null-shadow.', 'TAXPAYER-side field; MFS-irrelevant. **FIFTH defensive-gap-NOT-needed Issue #1 in the workflow** (after 9 #1 + 11a #1 + 11b #1 + 12b #1).'],
  ['⚠️ PDF FUNCTIONAL DRIFT (FIXED VIA 12c #6)', 'Pre-fix: CSV row 134 had `_alt` suffix on semantic key; frontend did NOT write `c2_4[0]` at all → **line 12c was structurally INVISIBLE on the PDF**. Post-fix: CSV rename + frontend ADDS the mapping + generator script update + line 12c renders on PDF for the FIRST TIME.', '**Documentation drift fix #4 in the workflow** (after 11a #8 + 12a #8 + 12b #6); **2nd FUNCTIONAL drift fix** (12b #6 was first). Parallels 12b #6 in shape but more severe — pre-fix line 12c was completely invisible (not just wrong checkbox).'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 12c Triggers'],
  ['Consumer', 'How', 'Notes'],
  ['computeStandardDeduction() — ★★ PRIMARY DOWNSTREAM', '`if (line12b || line12c) return BigDecimal.ZERO;` hard-zero gate.', '★★ CRITICAL: line 12c forces standard_deduction = 0; trumps dependent worksheet + age/blind chart.'],
  ['Form 1040 line 12e (final deduction amount)', 'Indirect via the hard-zero.', 'Line 12e is the numeric output; when line 12c TRUE, the standard-deduction path yields 0 → line 12e is 0 unless taxpayer itemizes via Schedule A.'],
  ['Form 1040 line 14 / line 15 / line 16', 'Indirect via line 12e.', 'Per future line 14/15/16 audits.'],
  ['PDF c2_4[0] checkbox (POST 12c #6 fix)', 'Frontend writes `deductions.line12cChecked` to canonical semantic key `line12c_dual_status_alien`.', 'Page-2 PDF rendering at RIGHT position of y=722 row. **First-time PDF rendering** (pre-fix invisible).'],
  ['NOT IN OUTPUT — line 12c does NOT affect line 13a/13b', '—', 'Lines 13a (QBI) and 13b (Schedule 1-A) are independent of line 12c.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 28 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 12c'],
  ['Line 12c has 1 boolean input. No statement entries; pure user-attested checkbox.'],
  [],
  ['#', 'Source form', 'Field', 'Type', 'Required?', 'Role', 'Cross-reference'],
  [1, 'standard-deductions-taxpayer', 'youWereDualStatusAlien', 'Boolean', 'Optional (null → treated as FALSE)', 'Primary trigger — fires on ALL filing statuses; taxpayer-side', 'NOT affected by 12a #1 SURGICAL MFS guard (taxpayer-side field); PDF c2_4[0] post 12c #6 fix'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 32 }, { wch: 32 }, { wch: 12 }, { wch: 38 }, { wch: 60 }, { wch: 75 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 12c'],
  [],
  ['No direct numeric constants for line 12c itself (it is a Boolean checkbox; metadata only). **Reference data applies to the downstream standard-deduction zero-out path** (when line 12c is TRUE, standard_deduction = 0 unconditionally per spec §5.2).'],
  [],
  ['Statutory references'],
  ['IRC §7701(b)', 'IRC §7701(b)', 'YES — dual-status alien definition', 'Defines what constitutes a dual-status alien for tax purposes.'],
  ['IRC §63(c)(6)(B)', 'IRC §63(c)(6)(B)', 'YES — no standard deduction for dual-status filers', 'Underlying statute for the hard-zero rule when line 12c is checked.'],
  ['IRC §6013(g)/(h)', 'IRC §6013(g)/(h)', 'YES — full-year U.S.-resident election overrides dual-status', 'User-attested election rule per spec §4.3 ("Do NOT check 12c if valid election").'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 45 }, { wch: 30 }, { wch: 60 }, { wch: 65 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 12c Boolean'],
  ['Line 12c persists a single Boolean on the Deductions output object + (post 12c #6) renders correctly at PDF c2_4[0].'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.deductions.line12cChecked', '`deductions.setLine12cChecked(line12c)` at TaxReturnComputeService.java:~3046', '★ CANONICAL line 12c output. Boolean. TRUE when youWereDualStatusAlien.'],
  ['PDF c2_4[0] checkbox (POST 12c #6)', 'Frontend form-tax-return-1040.component.ts adds new mapping reading `deductions.line12cChecked` → canonical semantic key `line12c_dual_status_alien`', 'Page-2 PDF rendering at RIGHT position of y=722 row. **First-time PDF rendering** (pre-fix invisible).'],
  ['computeStandardDeduction() hard-zero — ★★ CRITICAL', '`if (line12b || line12c) return BigDecimal.ZERO;` at computeStandardDeduction() ~line 3076', '★★ Forces standard_deduction = 0 unconditionally per spec §5.2; trumps dependent worksheet + age/blind chart.'],
  ['Indirect — Form 1040 line 12e (final deduction amount)', 'Via the hard-zero.', 'When line 12c TRUE, line 12e is 0 unless taxpayer itemizes via Schedule A.'],
  [],
  ['BLOCKING / ADVISORY FLAGS'],
  ['(None at line 12c site)', 'N/A', 'Line 12c is a Boolean output; no validation logic emits flags. Spec §10.1 conceptual rule ("If line 12c is checked, the dual-status-alien facts should support it") is user-attested via the input boolean.', 'N/A'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Line 12c does NOT directly affect line 13a/13b/14', '—', 'Lines 13a/13b are independent; only line 12e is affected (via the hard-zero).'],
  ['`spouseItemizesOrDualStatus` combined flag — DEPRECATED via 12c #8', '—', 'Post 12c #6: combined flag has NO active consumers (frontend repointed via 12b #6 + 12c #6 to separate fields). Deprecated with @Deprecated annotation + JavaDoc note via 12c #8.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 85 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 12c-Related'],
  ['No line-12c-specific BLOCKING flags. Spec §10.1 conceptual rule ("If line 12c is checked, the dual-status-alien facts should support it") is user-attested via the input boolean — backend trusts user input.'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['(None at line 12c site)', 'N/A', 'Line 12c is a Boolean output; no validation logic.', 'N/A'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 12c is the **dual-status alien checkbox** — fires when taxpayer was a dual-status alien per spec §4.3; TRUE → standard_deduction = 0 (hard-zero per spec §5.2 + IRC §63(c)(6)(B)). **Sibling audit within the 12abcde deductions cluster** (3rd of 5 sub-lines; cluster log will reach 3 rows). **The big-ticket items are**: Issue #6 — ⚠️ FUNCTIONAL PDF rendering fix (line 12c was structurally INVISIBLE on PDF pre-fix); Issue #8 — combined-flag retirement decision (DEPRECATE chosen; first @Deprecated annotation in audit workflow). Verified 2026-05-13.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-13 — CROSS-REFERENCE — NO MFS GUARD NEEDED AT LINE 12c SITE (taxpayer-side field; not subject to 12a #1 SURGICAL spouse-side null-shadow)', 'Line 12c is computed at TaxReturnComputeService.java:~3024 — inline derivation `boolean line12c = indicators != null && Boolean.TRUE.equals(indicators.getYouWereDualStatusAlien());`. **No filter needed**: `youWereDualStatusAlien` is read from `deductionsStandardTaxpayer` (the TAXPAYER form, not the spouse form) at buildStandardDeductionIndicators line 2779; the 12a #1 SURGICAL MFS guard null-shadows only the spouse-side `someoneCanClaimSpouse` field. Line 12c is structurally MFS-independent (a dual-status alien classification per IRC §7701(b) applies to an individual taxpayer regardless of filing status). Unlike line 12b (MFS-only filter) or line 12a (MFJ-only-spouse-OR), line 12c is structurally indifferent to filing status. **FIFTH defensive-gap-NOT-needed Issue #1 in the workflow** (after 9 #1 + 11a #1 + 11b #1 + 12b #1) — all five are inline-compute sites with no need for explicit MFS guards. **Sibling-mate cross-reference to 12a #1 + 12b #1** — the 12a #1 SURGICAL guard\'s per-field MFS-semantics classification acknowledges that taxpayer-side fields are unaffected; all three 12abcde inline derivations (12a + 12b + 12c) inherit their MFS protection structurally rather than needing dedicated guards. **Closure**: pure xlsx-flip cross-reference. No code change. No breadcrumb at the line 12c site — coverage will come via 12c #4 (extension of 12a #4 cluster-level seed) + 12c #5 (verified-correct breadcrumb on the no-filter derivation).', 'TaxReturnComputeService.java:~3024 (line 12c inline derivation; no filter; taxpayer-side); 12a #1 SURGICAL guard at line ~2775 (taxpayer fields unaffected)', 'CLOSED — observation. No code change. FIFTH defensive-gap-NOT-needed Issue #1; sibling-mate to 12a #1 + 12b #1.'],
  [2, 'RESOLVED 2026-05-13 — DOCUMENTATION HYGIENE — KNOWLEDGE FILE ALREADY RENAMED VIA 12a #2 (sibling-mate cross-reference within the 12abcde cluster)', '`knowledge/knowledge_line12abcde.md` was renamed → `knowledge/line-12abcde-deductions.md` via 12a #2 (2026-05-13). Shared file covers all 5 sub-lines (anti-redundancy pattern). Convergence stays at **19 lines** (unchanged by line 12c). Remaining Legacy A files unchanged (3): knowledge_line16/17/26/27abc.md. **Second of 4 expected sibling-mate cross-references within the 12abcde cluster** (after 12b #2; future 12d #2 + 12e #2 will be 3rd + 4th). The 12abcde cluster will accumulate the **LARGEST cluster of sibling-mate knowledge-file cross-references in the workflow** (4 total) — matching the cluster\'s structural maximum (largest cluster = most siblings). **Closure**: pure xlsx-flip cross-reference; no code change; no additional file rename; no generator header update needed (`generate-12c.js` references the already-canonical name).', 'C:\\us-tax\\knowledge\\line-12abcde-deductions.md (already renamed via 12a #2 — sibling-mate cross-reference)', 'CLOSED — sibling-mate cross-reference. No additional rename; convergence stays at 19 lines; 2nd of 4 expected within 12abcde cluster.'],
  [3, 'RESOLVED 2026-05-13 — SPEC ENHANCEMENT — VERIFICATION LOG 3rd ROW APPENDED TO lines/12abcde.md (cluster log progress: 2 → 3 of eventual 5)', '`lines/12abcde.md` had a Verification log section with 2 rows (created via 12a #3 + appended via 12b #3). **Closure applied**: appended a 3rd row to the existing table in IN-PROGRESS state capturing the 12c walkthrough closures (will accumulate Issues #1-#10 outcomes; finalized to "COMPLETE — 10/10 closed" at end of walkthrough). **APPEND-row pattern** (NOT NEW-section creation). **Cluster log progress: 3 rows of eventual 5** — future 12d/12e siblings will each append a row. **2nd of 4 expected APPEND-row operations** within the 12abcde cluster (after 12b #3; future 12d #3 + 12e #3 will be 3rd + 4th). When complete, the 12abcde cluster will hold the LARGEST log shape in the workflow (5 rows; exceeds 6abcd 4-row prior max).', 'lines/12abcde.md (existing Verification log section per 12a #3 + 12b #3; 3rd row appended)', 'CLOSED — 3rd row appended. Cluster log progress: 3 of 5; 2nd of 4 expected APPEND-row operations.'],
  [4, 'RESOLVED 2026-05-13 — CROSS-REFERENCE — EXTENDED 12a #4 CLUSTER-LEVEL SEED WITH LINE-12c-SPECIFIC PAGE-2 DETAILS (SECOND extension of the cluster-level seed)', 'The 12a #4 cluster-level forward-cross-reference breadcrumb at TaxReturnComputeService.java:~2856 was seeded 2026-05-13 with placeholders for 4 future extensions; 12b #4 was the FIRST extension. **Closure applied**: extended the 12a #4 breadcrumb with three updates: (1) **header updated** to "10 #4, 2026-05-13; EXTENDED 12b #4 + 12c #4, 2026-05-13"; (2) **flipped the "line 12c (future audit)" placeholder block** in the CLUSTER STRUCTURE section to full line-12c documentation — derivation site (line ~3024; no filter; taxpayer-side) + hard-zero gate per spec §5.2 + IRC §7701(b) + IRC §63(c)(6)(B) statutory citations + 12a #1 SURGICAL MFS-guard note (taxpayer-side field unaffected) + **12c #6 FUNCTIONAL drift fix cross-reference** (CSV `_alt` rename + frontend ADD mapping → renders line 12c on PDF for the FIRST TIME; documentation drift fix #4 in workflow; 2nd FUNCTIONAL drift fix) + **U.S.-resident-election nuance** (per spec §4.3 + IRC §6013(g)/(h)) + **12c #8 combined-flag DEPRECATED cross-reference** (first @Deprecated annotation in audit workflow; deprecate-before-remove pattern) + existing test coverage; (3) **FUTURE EXTENSION POINTS section updated** — flipped "12c #4 — add..." → "EXTENDED 2026-05-13" with extension scope summary; progress tally updated to "2 of 4 extensions done (12b #4 + 12c #4); 2 remaining (12d/12e #4)". **SECOND extension of the 12a #4 cluster-level seed** — cluster-level seed progress: 2 of 4 done. Validates the cluster-scale seed → extend × 4 template at scale (12b #4 was the "validation"; 12c #4 confirms the pattern holds across multiple extensions). Pure documentation extension — no functional change.', 'TaxReturnComputeService.java:~2856 (12a #4 cluster-level breadcrumb; second extension applied; line-12c placeholder flipped to full documentation)', 'CLOSED — 12a #4 breadcrumb extended with line-12c-specific page-2 details. SECOND extension of the cluster-level seed; cluster-level seed progress: 2 of 4.'],
  [5, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — LINE 12c DERIVATION AT LINE ~3056 (per spec §4.3 + IRC §7701(b) + IRC §63(c)(6)(B))', 'At TaxReturnComputeService.java:~3056: `boolean line12c = indicators != null && Boolean.TRUE.equals(indicators.getYouWereDualStatusAlien());`. Matches IRS 2025 Form 1040 line 12c + spec §4.3 ("Check line 12c if the taxpayer was a dual-status alien"). Underlying statutes: IRC §7701(b) (dual-status alien definition — both resident and nonresident in the same tax year) + IRC §63(c)(6)(B) (no standard deduction for dual-status filers). **Three structural properties**: (a) NO filing-status filter — taxpayer-side classification applies to all statuses (Single/MFJ/MFS/HOH/QSS); structurally different from line 12b (MFS-only filter at line 3054) and line 12a (MFJ-only-spouse-OR filter at line ~2998); (b) null-safe `Boolean.TRUE.equals(...)` — treats null as false; (c) compound AND with `indicators != null` defensive null-guard short-circuit. **Closure applied**: added a **~28-line breadcrumb** above the line 12c derivation documenting the no-filter design + null-safe semantics + spec §4.3 + IRC §7701(b) + IRC §63(c)(6)(B) statutory citations + line-by-line contrast with line 12b MFS-only filter at line 3054 and line 12a MFJ-only-spouse-OR filter at line ~2998 + **U.S.-resident-election nuance cross-reference to 12c #9** (IRC §6013(g)/(h) election overrides dual-status; backend trusts user-attested boolean) + downstream hard-zero effect at computeStandardDeduction() per spec §5.2 + existing lock-in test cross-reference (`computesLine12cForcesStandardDeductionToZeroForDualStatusAlien` at line 11634). Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:~3056 (above the line 12c derivation; ~28-line breadcrumb)', 'CLOSED — verified correct. ~28-line breadcrumb documents no-filter design + null-safe + IRC §7701(b) + §63(c)(6)(B) + §4.3 nuance + sibling-line contrast.'],
  [6, 'RESOLVED 2026-05-13 — ⚠️ FUNCTIONAL PDF SEMANTIC-KEY DRIFT FIX + RENDERS LINE 12c ON PDF FOR THE FIRST TIME (`c2_4[0]` `_alt` suffix → canonical `line12c_dual_status_alien`; frontend ADD mapping)', '⚠️ **TWO FUNCTIONAL BUGS** at PDF rendering for line 12c: (a) CSV row 134 had stale `_alt` suffix on semantic key `standard_deduction_dual_status_alien_alt`; (b) **frontend did NOT write to `c2_4[0]` at all** → line 12c was structurally INVISIBLE on the PDF (the checkbox never rendered as checked/unchecked even when `line12cChecked = TRUE`). Pre-fix: even an explicitly TRUE line 12c would not show on the PDF. **More severe than 12b #6** (which was wrong checkbox lighting up; 12c #6 is total invisibility). **Closure applied (four-step fix; parallels 12b #6)**: (1) renamed CSV row 134 in `us-tax-ui/public/irs/f1040_field_mapping_semantic.csv` from `standard_deduction_dual_status_alien_alt` → `line12c_dual_status_alien` (dropped `_alt` suffix; aligned with `line12c_` naming convention); (2) same rename in `pdfs/f1040_field_mapping_semantic.csv` (source-of-truth); (3) ADDED frontend mapping at `form-tax-return-1040.component.ts` (after the 12b mapping; added inline comment documenting the pre-fix invisibility + fix transition): `values[\'line12c_dual_status_alien\'] = form.deductions?.line12cChecked === true`; (4) updated generator script `us-tax-be/scripts/generate-semantic-1040-2025.js` line 151 (regression prevention). Backend spot-test passes; no backend behavior change (frontend/CSV-only fix). **Documentation drift fix #4 in the workflow** (after 11a #8 + 12a #8 + 12b #6) — **2nd FUNCTIONAL drift fix** (12b #6 was first). **Renders line 12c on PDF for the FIRST TIME** — fixes the "line 12c is structurally INVISIBLE on PDF" bug flagged via 12b #9. Same shape as 12b #6 but more severe (pre-fix line 12c was fully invisible, not just wrong checkbox).', '4 files updated: us-tax-ui/public/irs/f1040_field_mapping_semantic.csv row 134 (rename); pdfs/f1040_field_mapping_semantic.csv row 134 (rename); us-tax-ui/src/app/forms/form-tax-return-1040.component.ts (ADD new mapping line with inline comment); us-tax-be/scripts/generate-semantic-1040-2025.js line 151 (generator canonical key)', 'CLOSED — functional fix. CSV (×2) + frontend ADD + generator updated. Documentation drift fix #4 (2nd FUNCTIONAL); renders line 12c on PDF for FIRST TIME.'],
  [7, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — LINE 12c → STANDARD_DEDUCTION = 0 (hard-zero per spec §5.2; existing test covers)', 'When `line12c == TRUE`, `computeStandardDeduction()` at ~line 3076 returns `BigDecimal.ZERO` per the `if (line12b || line12c)` hard-zero gate. Per spec §5.2: "This remains true even if age / blindness boxes are checked." Underlying statute: IRC §63(c)(6)(B) (dual-status alien filers cannot claim standard deduction — parallel to IRC §63(c)(6)(A) for 12b MFS-spouse-itemizes). The hard-zero TRUMPS the dependent worksheet (line 12a), the age/blind chart (line 12d), and the base standard deduction. **Existing test coverage**: TaxReturnComputeServiceTest.java has `computesLine12cForcesStandardDeductionToZeroForDualStatusAlien` at line 11634 — taxpayer with `youWereDualStatusAlien=TRUE` → asserts `standard_deduction = 0` + `line12cChecked = TRUE`. This test parallels the 12b counterpart `computesLine12bForcesStandardDeductionToZeroForMfsSpouseItemizes`; both exercise the same hard-zero gate via different sub-line triggers. **Closure**: pure xlsx-flip affirmative verification — formula + test coverage adequate. **NO new breadcrumb** at the computeStandardDeduction() site — deep gate documentation will be folded into the future **line 12e audit** (the numeric output sub-line; line 12c is one trigger, line 12e is the result). Anti-fragmentation + anti-duplication policy applied — same deferral pattern as 12b #7 + 12a #7 (deep gate documentation cleanly attaches to its natural site 12e via the 12a #4 cluster-level seed → 12e #4 extension pattern). **1st anti-duplication app in the 12c walkthrough** (same pattern as 12b #7 / 12a #7).', 'TaxReturnComputeService.java:~3076 (computeStandardDeduction hard-zero gate); existing test `computesLine12cForcesStandardDeductionToZeroForDualStatusAlien` at line 11634; deep documentation deferred to future 12e #4 extension', 'CLOSED — verified correct. Existing test coverage adequate; deep documentation deferred to future line 12e audit (12e #4 extension).'],
  [8, 'RESOLVED 2026-05-13 — ACTION — DEPRECATED `spouseItemizesOrDualStatus` COMBINED FLAG (decision per 12b #8; FIRST @Deprecated annotation in the audit workflow)', 'Per 12b #8 observation: post 12b #6 + 12c #6 fixes, the `StandardDeductionIndicators.spouseItemizesOrDualStatus` combined flag has NO active consumers. Frontend was repointed off via 12b #6 (now uses `deductions.line12bChecked`) and via 12c #6 (now uses `deductions.line12cChecked`). The combined flag is ORPHANED in the operational path. **Decision (option c — DEPRECATE)**: preserves backward compatibility for any external consumers (yaml schema, e2e tests, frontend ts type definitions, etc.) while flagging for future removal. **Closure applied (three annotations)**: (1) added `@Deprecated` annotation to the `spouseItemizesOrDualStatus` field at `StandardDeductionIndicators.java` line ~10 with a 13-line JavaDoc explaining: pre-12b #6 / 12c #6 combined-flag role + post-fix frontend-repoint to separate `line12bChecked` + `line12cChecked` fields + no remaining active consumers + retained-for-backward-compat-flagged-for-future-removal note + "FIRST @Deprecated annotation in the audit workflow" + deprecate-before-remove pattern establishment; (2) added `@Deprecated` + 4-line JavaDoc to `getSpouseItemizesOrDualStatus()` getter; (3) same to `setSpouseItemizesOrDualStatus()` setter. **FIRST @Deprecated annotation in the audit workflow** — establishes the deprecate-before-remove pattern for orphaned backend fields. Backend regression: 760/760 pass (unchanged — `@Deprecated` is a metadata annotation with no behavior change). Pure documentation + annotation closure.', 'StandardDeductionIndicators.java (added @Deprecated annotation + 13-line JavaDoc on field; @Deprecated + 4-line JavaDoc on getter + setter)', 'CLOSED — @Deprecated annotation applied to field + getter + setter with explanatory JavaDoc. FIRST @Deprecated annotation in the audit workflow; deprecate-before-remove pattern established. Backend 760/760 unchanged.'],
  [9, 'RESOLVED 2026-05-13 — OBSERVATION — IRS DUAL-STATUS-ALIEN U.S.-RESIDENT-ELECTION NUANCE (per spec §4.3; user-attested input)', 'Per spec §4.3: "Do not check line 12c if the taxpayer and spouse validly elect to be taxed on combined worldwide income as U.S. residents for the full year." NARROW IRS rule under **IRC §6013(g)** (nonresident alien spouse election) + **IRC §6013(h)** (dual-status year-end resident election) — converts dual-status filers into full-year U.S. residents (overrides IRC §7701(b) dual-status classification → standard deduction becomes available → line 12c should NOT be checked). **Backend handling**: (a) NO auto-detection — backend does not inspect election paperwork, residency dates, or §6013(g)/(h) declarations; (b) user-attested input — user captures the nuance via the `youWereDualStatusAlien` boolean (TRUE only if NO valid election; FALSE if election applies); (c) UI form text should reference the election nuance for user-facing guidance (frontend concern; out-of-scope). **Three considerations**: (1) Low-impact (narrow population); (2) User-driven (backend correctly accepts user-attested booleans); (3) No backend deficiency. **Closure**: pure xlsx-flip observation — no code change. **Anti-fragmentation policy applied** — NO new outstanding entry (spec §4.3 + the 12c #5 verified-correct breadcrumb cross-reference + this audit row serve as canonical tracking). Same Path A shape as 7a #9 / 8 #9 / 10 #9 / 11b #8 / 12a #9 — **7th Path A application** across the workflow. Mirrors 12a #9 (which documented the MFJ "joint return filed only to claim refund" nuance) — both are user-attested nuances captured via existing boolean inputs.', 'lines/12abcde.md §4.3 (canonical tracking); 12c #5 verified-correct breadcrumb cross-reference; UI form text (out-of-scope advisory)', 'CLOSED — observation. Anti-fragmentation policy applied; no new outstanding entry; 7th Path A application.'],
  [10, 'RESOLVED 2026-05-13 — OBSERVATION — LINE 12c IS THE 3rd SUB-LINE IN THE 12abcde CLUSTER + SECOND CLUSTER-LEVEL SEED EXTENSION + DOCUMENTATION DRIFT FIX #4 (2nd FUNCTIONAL) + FIRST @Deprecated IN AUDIT WORKFLOW', 'Pure xlsx-flip observation — **four workflow milestones**: (1) **3rd sub-line in the 12abcde deductions cluster** — cluster log progresses from 2 → 3 of eventual 5; 2 more siblings queued (12d/12e); cluster-mid-progress pattern (over halfway through). (2) **SECOND extension of the 12a #4 cluster-level seed** — cluster-level seed progress: 2 of 4 extensions done (after 12b #4 was first); future 12d #4 + 12e #4 remaining; validates the cluster-scale seed → extend × 4 template at scale. (3) **Documentation drift fix #4 in the workflow** (12c #6) — **2nd FUNCTIONAL drift fix** (after 12b #6 first); renders line 12c on PDF for the FIRST TIME (pre-fix: structurally invisible — frontend never wrote `c2_4`); more severe than 12b #6 (total invisibility vs. wrong checkbox). (4) **FIRST @Deprecated annotation in the audit workflow** (12c #8) — `spouseItemizesOrDualStatus` combined flag marked with `@Deprecated` + 13-line JavaDoc; establishes the **deprecate-before-remove pattern** for orphaned backend fields. **Cumulative through line 12c**: 35 lines audited (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + 11b + 12a + 12b + **12c**); 347 audit issues closed total; backend 760/760 tests pass (unchanged — no new test; 12c #6 was frontend/CSV fix; 12c #8 @Deprecated has no behavior change); MFS-guard cascade = 15 orchestrators (unchanged — line 12c taxpayer-side); knowledge-file naming convergence = 19 lines (unchanged — shared file). **ZERO new outstanding.md entries** in 12c walkthrough — **10 consecutive walkthroughs with zero new outstanding entries** (7a/7b/8/9/10/11a/11b/12a/12b/12c). **3 anti-duplication apps** in 12c walkthrough (12c #7 hard-zero / 12c #9 election nuance / scope discipline). **Closure**: pure xlsx-flip observation; this row is the audit-trail anchor. **Looking ahead — 2 cluster siblings remaining**: line 12d (age/blindness count + 2025 age/blind chart constants; first audit with numeric box-count; MFS-narrowly-allowed gating), line 12e (final deduction amount; multi-path branching; closes the 12a #4 cluster-level seed → extend × 4 pattern to cluster-final state).', 'XLS/computations/12c.xlsx audit-trail (this row); no additional code change beyond Issue #4 breadcrumb extension + Issue #5 verified-correct breadcrumb + Issue #6 functional drift fix + Issue #8 @Deprecated annotation', 'CLOSED — pure xlsx-flip. 3rd sub-line in 12abcde cluster; SECOND cluster-level seed extension; documentation drift fix #4 (2nd FUNCTIONAL); FIRST @Deprecated annotation in workflow; line 12d sibling audit next.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 100 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 12c Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.deductions.line12cChecked', 'topmostSubform[0].Page2[0].c2_4[0] (POST 12c #6: line12c_dual_status_alien; PRE-FIX: standard_deduction_dual_status_alien_alt — never rendered by frontend)', 'form-tax-return-1040.xlsx (line 12c checkbox; page 2 RIGHT at y=722)', '★ CANONICAL line 12c output. Boolean. 12c #6 fixes the PDF semantic-key drift + adds the frontend mapping (renders line 12c on PDF for the first time).'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['computeStandardDeduction() hard-zero gate', '—', '—', '★★ Critical: `if (line12b || line12c) return BigDecimal.ZERO;` — standard deduction forced to 0 per spec §5.2 + IRC §63(c)(6)(B).'],
  ['Form 1040 line 12e (deduction amount)', '—', 'form-tax-return-1040.xlsx (line 12e cell)', 'Indirect via the hard-zero. When line 12c TRUE, line 12e is 0 unless taxpayer itemizes via Schedule A.'],
  ['Form 1040 line 14 / 15 / 16 / downstream', '—', '—', 'Indirect via line 12e → line 14 → line 15 → line 16 tax computation.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Line 12c does NOT affect line 13a (QBI) or line 13b (Schedule 1-A)', '—', '—', 'Lines 13a/13b are independent of line 12c.'],
  ['`spouseItemizesOrDualStatus` combined flag — DEPRECATED via 12c #8', '—', '—', 'Post 12c #6: combined flag has NO active consumers (frontend repointed via 12b #6 + 12c #6). Deprecated with @Deprecated annotation + JavaDoc note (first @Deprecated in audit workflow).'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 65 }, { wch: 90 }, { wch: 60 }, { wch: 95 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
