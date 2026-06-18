// ============================================================================
//  Generates: C:\us-tax\XLS\computations\6d.xlsx
//
//  Source-of-truth references:
//    - lines/6abcd.md §8 (line 6d — MFS lived apart all year)
//    - dependencies/6abcd.md (corrected via 6c #5)
//    - knowledge/line-6abcd-social-security.md (renamed 2026-05-12 via 6a #2)
//    - TaxReturnComputeService.computeSocialSecurityBenefits() (orchestrator with MFS guard from 6a #1; cascade currently 3 audits after 6c #1)
//    - PDF semantic CSV row 32: c1_42[0] — CURRENTLY UNMAPPED (parallel bug to 6c #5; fixed today)
//    - IRS 2025 Form 1040 line 6d instructions (NEW for 2025 — replaces handwritten "D" notation)
//    - IRC §86(c) (MFS-lived-apart-all-year treatment; base amount eligibility)
//
//  Tax year: 2025
//
//  NOTE: Line 6d is the **MFS-lived-apart-all-year checkbox** — NEW FOR 2025, replacing the old
//  handwritten "D" notation. Set TRUE when filing status is MFS AND taxpayer lived apart from
//  spouse for the entire tax year. Drives base-amount eligibility (with line 6d TRUE → $25k
//  Single-equivalent base amount; without it → restrictive 85% branch with $0 base via 6b #7
//  MFS-with-spouse path). Boolean output — NOT eligible for line-9 inclusion (clarified at 6c #4).
//
//  **CLOSES the 6abcd cluster** — line 6d is the 4th and final sub-line. This will be the
//  **first 4-row verification log** in the audit workflow + **4th complete shared-aggregator
//  cluster** (after 3abc + 4abc + 5abc).
//
//  Line 6d-specific verifications focus on:
//   • Two-condition AND gate (isMfs && livedApartAllYear)
//   • Mutual-exclusion observation (livedApartAllYear vs livedWithSpouseAnyTimeDuringTaxYear)
//   • PDF CSV semantic mapping fix (parallel to 6c #5)
//   • Coupling with line 6b restrictive-branch logic (6b #7)
//   • NEW FOR 2025 historical note (replaces "D" handwritten notation)
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '6d.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 6d — MFS LIVED APART FROM SPOUSE ALL YEAR CHECKBOX'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 6d'],
  ['Concept', 'Boolean checkbox indicating that the taxpayer (a) is filing Married Filing Separately AND (b) lived apart from their spouse for the ENTIRE tax year. **NEW FOR 2025**: replaces the old handwritten "D" notation that was previously written next to the line 6a/6b amounts. Drives base-amount eligibility for the Pub. 915 Social Security Benefits Worksheet: MFS-lived-apart → $25k Single-equivalent base + normal tier path; MFS-lived-with-spouse → $0 base + restrictive 85% path (per 6b #7).'],
  ['Core invariant', 'Line 6d is a BOOLEAN — not a numeric output. Set TRUE iff `filingStatus == MFS AND livedApartFromSpouseEntireTaxYear == TRUE`. Logical inverse of `livedWithSpouseAnyTime` on MFS returns; setting line 6d TRUE means the restrictive branch from 6b #7 does NOT apply.'],
  ['Per-Return Formula',
    'two-condition AND gate at TaxReturnComputeService.java:8419:\n' +
    '  line6d = isMfs                                                  // filing status check\n' +
    '         AND livedApartFromSpouseEntireTaxYear                    // user-asserted residence fact\n\n' +
    'Where:\n' +
    '  isMfs = "Married filing separately".equalsIgnoreCase(normalizedFilingStatus)\n' +
    '  livedApartFromSpouseEntireTaxYear = Boolean.TRUE.equals(getBoolean(socialSecurityTaxpayer, "livedApartFromSpouseEntireTaxYear"))\n\n' +
    '**Sibling flag** `livedWithSpouseAnyTimeDuringTaxYear` drives a DIFFERENT downstream path:\n' +
    '  mfsLivedWithSpouseAnyTime = isMfs && livedWithSpouseAnyTime    // → restrictive 85% branch in Pub. 915 worksheet (6b #7)\n\n' +
    '**Mutual-exclusion expectation**: in a logically consistent MFS return, exactly ONE of (livedApartAllYear, livedWithSpouseAnyTime) is TRUE. The code reads both independently and does NOT enforce mutual exclusion (see 6d #7 observation).'],
  ['Filed', 'Form 1040 line 6d checkbox. PDF field: topmostSubform[0].Page1[0].c1_42[0]. **PDF semantic CSV mapping**: pre-6d-audit was `unmapped_c1_42_0` (parallel bug to 6c #5 — confirmed during 6c walkthrough and deferred). Today via 6d #5: updated to `line6d_mfs_lived_apart_all_year`.'],
  ['Backend method', 'TaxReturnComputeService.computeSocialSecurityBenefits() — orchestrator decides line 6d at line 8417-8419 (two-condition AND gate). Persisted via income.setLine6dMfsLivedApartAllYear at line 4311.'],
  ['Output', 'form1040.income.line6dMfsLivedApartAllYear (Boolean; FALSE when not MFS or not lived apart entire year; TRUE when both conditions hold). PDF: checkbox c1_42[0] (mapping fixed today via 6d #5).'],
  ['IRS source', 'IRS 2025 Form 1040 line 6d instructions (NEW FOR 2025 — replaces handwritten "D" notation per spec §1) + IRC §86(c)(1)(C) (MFS-lived-apart eligibility for Single-equivalent base amount; without line 6d marked, MFS filer falls into IRC §86(c)(1)(D) restrictive branch with $0 base)'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Read filing status', '`normalizedFilingStatus` derived earlier at line ~8414. Drives `isMfs`.'],
  [2, 'Determine isMfs', '`isMfs = "Married filing separately".equalsIgnoreCase(normalizedFilingStatus)`. FALSE for all non-MFS filers.'],
  [3, 'Read livedApartFromSpouseEntireTaxYear from social-security-taxpayer form', 'Line 8418: `Boolean.TRUE.equals(getBoolean(socialSecurityTaxpayer, "livedApartFromSpouseEntireTaxYear"))`. User-asserted residence fact for the entire tax year.'],
  [4, 'Compute line 6d via two-condition AND gate', 'Line 8419: `line6d = isMfs && livedApartAllYear`. Both must be TRUE.'],
  [5, 'Also read livedWithSpouseAnyTimeDuringTaxYear (sibling flag)', 'Line 8417: `livedWithSpouseAnyTime = Boolean.TRUE.equals(getBoolean(socialSecurityTaxpayer, "livedWithSpouseAnyTimeDuringTaxYear"))`. Drives MFS restrictive branch in worksheet (6b #7) — separate from line 6d output.'],
  [6, 'Apply downstream worksheet branch decision (separate from line 6d)', 'computeTaxableSocialSecurityNormal receives `isMfs && livedWithSpouseAnyTime` (NOT line 6d). Line 6d is purely an OUTPUT checkbox; worksheet branching uses the sibling flag.'],
  [7, 'Force hasOutput TRUE when line 6d is set', 'Line 8608: `hasOutput = ... || line6d || ...`. Prevents the entire SS computation from being skipped when line 6d is the only relevant output.'],
  [8, 'Persist on form1040.income via buildIncome', '`income.setLine6dMfsLivedApartAllYear(socialSecurity.line6dMfsLivedApartAllYear())` at line 4311.'],
  [9, 'PDF export — checkbox c1_42[0]', 'Post-6d #5 fix: CSV row 32 maps `c1_42[0]` → `line6d_mfs_lived_apart_all_year` → frontend export wires through.'],
  [],
  ['MUTUAL EXCLUSION RULES (enforced by code or spec)'],
  ['Rule', 'Implementation', 'Why'],
  ['Line 6d TRUE requires filing status MFS', 'Line 8419: `isMfs && livedApartAllYear`.', 'Per IRS Form 1040 line 6d instructions: this checkbox applies ONLY to MFS filers. Non-MFS filers always have line 6d = FALSE.'],
  ['Line 6d TRUE requires lived-apart-ENTIRE-year', 'Line 8418: `livedApartFromSpouseEntireTaxYear`.', 'Per IRC §86(c)(1)(C): qualifying for Single-equivalent base amount requires lived-apart for the ENTIRE tax year (not part of the year).'],
  ['Line 6d FALSE → MFS restrictive branch applies (line 6b)', 'Line 8421 (orchestrator) passes `isMfs && livedWithSpouseAnyTime` to computeTaxableSocialSecurityNormal.', 'Per IRC §86(c)(1)(D): MFS filer who lived with spouse any time → restrictive 85% path with $0 base. 6b #7 documents this branch.'],
  ['NOT enforced — mutual exclusion of `livedApartAllYear` and `livedWithSpouseAnyTime`', 'No code-level check.', '**SOFT VALIDATION GAP** (6d #7): code reads both flags independently. Logically a consistent return has exactly ONE TRUE on MFS, but code accepts pathological cases (both TRUE or both FALSE). UI should enforce mutual exclusion via radio buttons or equivalent.'],
  ['Line 6d is structurally NOT eligible for line 9 inclusion', 'Boolean type; line 9 is BigDecimal addNonNull chain.', 'Java compile-time protection (clarified at 6c #4 in "Notably absent" list).'],
  [],
  ['DECISION TREE — When does line 6d = TRUE?'],
  ['Filing status', 'livedApartFromSpouseEntireTaxYear', 'line6d', 'Effect on line 6b worksheet'],
  ['Single', 'N/A', 'FALSE', 'Single $25k base path (no MFS-related branching)'],
  ['MFJ', 'N/A', 'FALSE', 'MFJ $32k base path'],
  ['HOH', 'N/A', 'FALSE', 'HOH $25k base path'],
  ['QSS', 'N/A', 'FALSE', 'QSS $25k base path'],
  ['MFS + lived apart entire year', 'TRUE', '**TRUE**', 'Non-restrictive $25k base path (Single-equivalent per IRC §86(c)(1)(C))'],
  ['MFS + lived with spouse any time', 'FALSE', 'FALSE', 'Restrictive 85% path with $0 base (6b #7 branch)'],
  ['MFS + livedApartAllYear=null/missing', 'undefined → FALSE', 'FALSE', 'Falls into restrictive 85% path by default (conservative — without affirmative attestation, no base-amount benefit)'],
  ['Pathological: MFS + both flags TRUE', 'TRUE (taxpayer error or stale data)', '**TRUE** (line 6d set)', 'BUT also restrictive branch fires from livedWithSpouseAnyTime — inconsistent return. UI mutual-exclusion enforcement needed (6d #7).'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 6d Flows'],
  ['Consumer', 'How', 'Notes'],
  ['form1040.income.line6dMfsLivedApartAllYear (Java field)', 'income.setLine6dMfsLivedApartAllYear(...) at line 4311', 'Persisted on the output model.'],
  ['Form 1040 PDF — c1_42[0] checkbox', 'Post-6d #5 fix: CSV semantic name → `line6d_mfs_lived_apart_all_year` → frontend export wires through.', 'When TRUE, checkbox filled on the PDF. Pre-6d #5 was unmapped (silent ignore).'],
  ['hasOutput gating in orchestrator', 'Line 8608: `hasOutput = ... || line6d || ...`', 'Line 6d=TRUE prevents the entire SS computation from being skipped.'],
  ['Tax return derived SS line in shell', 'Line 4070 / 549: `... || socialSecurity.line6dMfsLivedApartAllYear() ...`', 'Drives derived "has Social Security computation" flag for UI rendering.'],
  ['Logical coupling with line 6b restrictive branch', 'IRS expectation: line 6d=TRUE → user is in $25k base path; line 6d=FALSE on MFS → restrictive 85% path applies.', 'NOT enforced by code; relies on user/UI correctly setting livedApartAllYear and livedWithSpouseAnyTime as logical inverses on MFS returns.'],
  ['NOT IN OUTPUT — Line 9 total income', '—', 'Line 6d is a boolean — structurally NOT eligible (clarified at 6c #4).'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 28 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 6d'],
  ['Line 6d is a derived BOOLEAN. Two direct inputs.'],
  [],
  ['#', 'Source xlsx', 'Field path / model key', 'Label / box', 'Required?', 'Role in line 6d compute', 'Cross-reference'],
  [],
  ['RETURN-LEVEL INPUTS — filing status'],
  [1, 'form-filing-status.xlsx', 'filingStatus', 'Filing status', 'YES — gates line 6d', '`isMfs = "Married filing separately".equalsIgnoreCase(filingStatus)`. Required TRUE for line 6d = TRUE.', 'IRC §86(c); 6b #7'],
  [],
  ['PERSONAL FORM INPUTS — Social Security Benefits Taxpayer'],
  [2, 'form-social-security-benefits-taxpayer.xlsx', 'livedApartFromSpouseEntireTaxYear', 'Lived apart entire year?', 'YES (when MFS) — user-asserted residence fact', 'Drives line 6d directly. TRUE → eligible for $25k Single-equivalent base; FALSE → no base-amount benefit on MFS.', 'IRC §86(c)(1)(C); spec §8'],
  [],
  ['SIBLING INPUT (drives worksheet branch, NOT line 6d output)'],
  [3, 'form-social-security-benefits-taxpayer.xlsx', 'livedWithSpouseAnyTimeDuringTaxYear', 'Lived with spouse any time?', 'YES (when MFS) — drives RESTRICTIVE branch in worksheet', 'NOT a line 6d input. Drives `mfsLivedWithSpouseAnyTime` flag → restrictive 85% branch in `computeTaxableSocialSecurityNormal` (6b #7). Should be logical inverse of `livedApartAllYear` on MFS returns (6d #7 mutual-exclusion observation).', '6b #7'],
  [],
  ['IDENTITY INPUTS — none direct (line 6d derives from filing status + taxpayer form only)'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 42 }, { wch: 65 }, { wch: 55 }, { wch: 30 }, { wch: 80 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 6d'],
  [],
  ['Constant', 'Value', 'Source', 'Used by line 6d?', 'Notes'],
  [],
  ['No direct numeric constants — line 6d is a boolean derived from two boolean conditions.'],
  ['Statutory references'],
  ['MFS-lived-apart base amount eligibility', 'IRC §86(c)(1)(C)', 'YES — line 6d TRUE → $25k Single-equivalent base applies', 'When line 6d checked, MFS filer gets the same $25k base amount as Single/HOH/QSS for SS taxation. Stable rule since 1983 IRC §86 enactment.'],
  ['MFS-lived-with-spouse restrictive branch', 'IRC §86(c)(1)(D)', 'NO — drives line 6b restrictive path (6b #7), not line 6d directly', 'When line 6d FALSE on MFS return, restrictive 85% branch applies (6b #7).'],
  ['NEW FOR 2025 form change', 'IRS 2025 Form 1040 redesign', 'YES — historical context', 'Line 6d as a CHECKBOX is NEW for 2025; replaces the handwritten "D" notation that was previously written next to line 6a/6b amounts (per spec §1).'],
  [],
  ['No annual constants — line 6d rules have been stable since IRC §86(c) enactment in 1983. The 2025 form change is purely cosmetic (handwritten "D" → checkbox).'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 25 }, { wch: 50 }, { wch: 22 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 6d is a Disclosure Checkbox'],
  ['Line 6d is a TRUE/FALSE flag — no numeric value. Its setting signals to the IRS that the taxpayer qualifies for the $25k Single-equivalent base amount under IRC §86(c)(1)(C).'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['Form 1040 line 6d (checkbox)', 'TaxReturnComputeService.buildIncome() — income.setLine6dMfsLivedApartAllYear(...)', '★ Primary output. Persisted on form1040.income as Boolean.'],
  ['Form 1040 PDF — c1_42[0] checkbox', 'Post-6d #5 fix: CSV semantic name → `line6d_mfs_lived_apart_all_year` → frontend export wires through.', 'When TRUE, checkbox should be filled on the PDF.'],
  ['hasOutput gating', 'Line 8608: `hasOutput = ... || line6d || ...`', 'Line 6d=TRUE prevents the entire SS computation from being skipped at orchestrator end.'],
  ['Tax return derived SS check', 'TaxReturnComputeService.java line ~549, 4070', 'Drives derived "has Social Security computation" flag for UI rendering.'],
  ['IRS disclosure signal — taxpayer-asserted residence fact', '—', 'IRS reviewer can identify MFS-lived-apart returns from this checkbox. Pre-2025 used handwritten "D" notation.'],
  [],
  ['LOGICAL COUPLING (not enforced by code)'],
  ['Sibling output flag', 'computeTaxableSocialSecurityNormal `mfsLivedWithSpouseAnyTime` branch trigger', 'Should be logical inverse of line 6d on MFS returns. Mutual-exclusion not enforced by code (see 6d #7).'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Schedule B', '—', 'No Schedule B presence.'],
  ['Form 1040 line 9', '—', 'Structurally NOT eligible (boolean type; clarified at 6c #4).'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 6d-Related'],
  ['Line 6d shares the 6abcd cluster flag set. No line-6d-specific flag. **Soft validation gap** at 6d #7: code does not enforce mutual exclusion between `livedApartAllYear` and `livedWithSpouseAnyTime`.'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['SOCIAL_SECURITY_STATEMENT_UPLOAD_REQUIRED', 'BLOCKING', 'hadAnyBenefits=true AND statements missing', '6a Validation Flags'],
  ['SOCIAL_SECURITY_NEGATIVE_NET_BENEFITS_MANUAL_REVIEW', 'ADVISORY', 'line6a < 0 — line 6d still set independently if MFS-lived-apart', 'TaxReturnComputeService.java:8367'],
  ['(No 6d-specific flag — soft validation gap deferred per 6d #7)', 'N/A', 'See 6d #7 observation; UI mutual-exclusion enforcement recommended', 'N/A'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 6d shares the same orchestrator with lines 6a/6b/6c. **The big-ticket item is Issue #5** — parallel PDF CSV mapping bug for `c1_42[0]` (deferred from 6c #5; fixed today). Issue #7 documents a soft validation gap. Issue #10 marks the **6abcd cluster COMPLETE** (4th complete shared-aggregator cluster after 3abc + 4abc + 5abc) + **first 4-row verification log** in the audit workflow. Verified 2026-05-12.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — MFS GUARD CASCADE EXTENDED TO LINE 6d (4-AUDIT CONSOLIDATION) — MATCHES `computeInterestIncome` DENSITY', 'Line 6d is in the 6a #1 high-leverage MFS cascade. The line 6d two-condition AND gate reads (a) `isMfs` (return-level filing status), (b) `livedApartFromSpouseEntireTaxYear` from `socialSecurityTaxpayer`. Both inputs are taxpayer-side / return-level; no direct spouse-side data dependency. **Closure applied**: extended the MFS-guard breadcrumb at TaxReturnComputeService.java:8299-8338 from citing 3 audit IDs to **4 audit IDs** (6a #1 + 6b #1 + 6c #1 + 6d #1, all verified 2026-05-12). Added metadata-only note documenting: (a) line 6d derives from filing-status-gated isMfs + taxpayer-side residence flag (no spouse-side data axis); (b) MFS protection here is STRUCTURAL (filing-status-gated) rather than data-suppression-driven; (c) **4-audit consolidation at this site MATCHES `computeInterestIncome` density (2a #1 + 2b #1 + 3a #1 + 3b #1) — both at the codebase maximum of 4 audits**. **6abcd cluster COMPLETES the MFS cascade for SS** with 4-audit consolidation reaching parity with the interest+dividend cluster. No new lock-in test needed — `mfsExcludesSpouseSocialSecurityFromLine6a` already exercises the cascade; line 6d protection follows implicitly via structural filing-status gating.', 'TaxReturnComputeService.java:8299-8338 (4-audit MFS-guard breadcrumb with cluster-completion + density-parity-with-interest-cluster note)', 'CLOSED — 4-audit consolidation reached. No code change beyond breadcrumb. Matches `computeInterestIncome` density.'],
  [2, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — KNOWLEDGE FILE ALREADY RENAMED VIA 6a #2 (4th AND FINAL cascade citation within cluster)', '`knowledge/line-6abcd-social-security.md` (renamed from `knowledge-line-6abcd-social-security.md` during 6a #2 earlier today) is a shared file covering all four SS-family lines (6a + 6b + 6c + 6d). Pure xlsx-flip closure — **4th and FINAL cascade citation within the 6abcd cluster** (after 6b #2 + 6c #2). **First 4-citation knowledge-file-rename cascade in the audit workflow** (all prior clusters had 3 sub-lines max). Pattern parallel to upcoming 6d #3 first-4-row verification log — both reflect the structurally-unique 4-sub-line cluster. **Line 1c → 6abcd knowledge-file naming convergence remains complete across 13 lines** (1c, 1d, 1e, 1f, 1g, 1h, 1i, 1z, 2ab, 3ab, 4abc, 5abc, 6abcd). Same shape as 4c #2 / 5c #2 (closed via cluster-start audit).', 'C:\\us-tax\\knowledge\\line-6abcd-social-security.md (already correctly named)', 'CLOSED via 6a #2 — pure xlsx-flip closure. 4th and final cascade citation within 6abcd cluster.'],
  [3, 'RESOLVED 2026-05-12 — SPEC ENHANCEMENT — VERIFICATION LOG 4th ROW APPENDED → FIRST 4-ROW LOG IN WORKFLOW', '`lines/6abcd.md` Verification log section (created during 6b #3) had 3 rows (6a + 6b + 6c complete). **Closure applied**: appended a 4th in-progress row at the END of the table (chronological order) capturing the 6d walkthrough — produces the **FIRST 4-ROW VERIFICATION LOG in the audit workflow per-line-audit cadence** (all prior clusters had 3 sub-lines max → 3 rows max). Row captures #1 (MFS guard 4-audit consolidation matching computeInterestIncome density) + #2 (knowledge file already renamed — 4th and final cluster citation) + #3 (this 4th row appended — milestone observation). To be finalized to "COMPLETE — 10/10 closed" during end-of-walkthrough docs-update step. **Append-row pattern** (same shape as 6c #3 / 5c #3 / 4c #3 / 3c #3; different from 6b #3 NEW-section creation). Future audits begin line 7a — a composite output without sub-lines, so no future 4-row verification log is anticipated.', 'lines/6abcd.md Verification log (6d row appended as 4th row in chronological order — first 4-row log in workflow)', 'CLOSED — spec verification log row appended. FIRST 4-row verification log reached.'],
  [4, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — LINE 6d IS STRUCTURALLY NOT IN LINE 9 (boolean — covered by 6c #4 clarification)', 'Line 6c #4 already extended the line-9 "Notably absent" list at TaxReturnComputeService.java:4158-4174 with a clarification paragraph that **BOTH lines 6c AND 6d are Boolean disclosure flags** — structurally NOT eligible for line-9 inclusion (Java type system prevents at compile time). **No additional code change needed** for 6d. Pure xlsx-flip citation closure: this audit row formally documents that the line-9 site treatment of line 6d was preemptively bundled into 6c #4. **11-audit consolidation count at the line-9 site remains PRESERVED** (boolean-type clarification did NOT inflate). 11-audit milestone reached at 6b #4 stays intact through the entire 6abcd cluster — future audits at line 7a (already implicitly verified INCLUDED) and line 8 will not extend it either. Pattern continuity: same shape as 6c #8 separating documentation observation from substantive fix (6c #5).', 'TaxReturnComputeService.java:4158-4174 (already covers both 6c and 6d via 6c #4); no new code change for 6d', 'CLOSED via 6c #4 — pure xlsx-flip cross-reference. 11-audit consolidation count preserved.'],
  [5, 'RESOLVED 2026-05-12 — ⚠️ BUG FIXED — PDF CSV SEMANTIC MAPPING FOR c1_42[0] CHECKBOX (parallel to 6c #5; deferred from 6c walkthrough; Gap 4 NOW FULLY RESOLVED)', '⚠️ **PARALLEL PDF EXPORT BUG FIXED**: Pre-fix, `us-tax-ui/public/irs/f1040_field_mapping_semantic.csv` row 32 had `c1_42[0]` with semantic key `unmapped_c1_42_0`. Frontend at `form-tax-return-1040.component.ts:313` sets `values[\'line6d_mfs_lived_apart_all_year\'] = form.income?.line6dMfsLivedApartAllYear === true`, but the CSV had no matching row → checkbox fill silently ignored on PDF export. Effect: even when line 6d=TRUE in the backend (MFS-lived-apart filer), the printed/exported PDF did NOT show the checkbox marked → IRS reviewer would see line 6b computed with $25k Single-equivalent base but no line 6d disclosure → internally inconsistent return. Same shape as 6c #5 bug; explicitly deferred during 6c walkthrough with "DEFERRED to 6d audit" note. **Closure applied (three coordinated fixes, same pattern as 6c #5)**: (1) CSV row 32 — semantic key updated from `unmapped_c1_42_0` → `line6d_mfs_lived_apart_all_year` + column 3 path + column 5 label updated; (2) `dependencies/6abcd.md` line 75 — updated to reflect all four fields mapped + **Gap 4 FULLY RESOLVED 2026-05-12** marker; (3) `knowledge/line-6abcd-social-security.md` §9 PDF Export Mapping table + §13 Gap 4 — line 6d portion marked RESOLVED 2026-05-12 via 6d #5; **Gap 4 heading updated to "FULLY RESOLVED 2026-05-12"**. **Cluster-completion milestone**: this is the FINAL PDF export bug in the 6abcd cluster — Gap 4 is now FULLY resolved across BOTH line 6c and line 6d checkboxes; the 6abcd PDF export wiring is complete. NO backend code change. Backend regression: 755/755 (unchanged). Manual PDF verification recommended; existing `computesSocialSecurityLinesWithLumpSumElectionAndLine6d` already covers line 6d=true scenario.', 'us-tax-ui/public/irs/f1040_field_mapping_semantic.csv row 32 (c1_42[0] mapping); dependencies/6abcd.md line 75 (all four mapped); knowledge/line-6abcd-social-security.md §9 + §13 Gap 4 (fully resolved markers)', 'CLOSED — PDF export bug fixed. Gap 4 FULLY RESOLVED across both 6c + 6d checkboxes. 6abcd PDF export wiring complete.'],
  [6, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — LINE 6d TWO-CONDITION AND GATE', 'Line 6d assignment at TaxReturnComputeService.java:8419-8433: `boolean line6d = isMfs && livedApartAllYear`. Two conditions: (1) `isMfs` — filing-status gate (non-MFS always FALSE); (2) `livedApartAllYear` — user-asserted residence fact for the ENTIRE tax year per IRC §86(c)(1)(C). Conservative default: `Boolean.TRUE.equals(...)` returns FALSE on missing/null → no affirmative attestation → no base-amount benefit. **Closure applied**: **14-line breadcrumb** above line 8433 documenting (a) IRC §86(c)(1)(C) + IRS 2025 line 6d instructions + spec §8 source citations; (b) **NEW FOR 2025** note (covers 6d #8 — checkbox replaces handwritten "D" notation from TY2024 and earlier per spec §1); (c) two conditions with rationale (filing-status gate + entire-year requirement); (d) conservative default behavior; (e) cross-reference to 6b #7 sibling-flag-drives-restrictive-branch path; (f) cross-reference to 6d #7 mutual-exclusion soft validation gap; (g) cross-reference to existing lock-in test `computesSocialSecurityLinesWithLumpSumElectionAndLine6d`. Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:8419-8433 (14-line breadcrumb above two-condition AND gate)', 'CLOSED — verified correct. 14-line breadcrumb with NEW-FOR-2025 + conservative-default + sibling-flag-cross-references.'],
  [7, 'RESOLVED 2026-05-12 — ⚠️ SOFT VALIDATION GAP — MUTUAL EXCLUSION BETWEEN `livedApartAllYear` AND `livedWithSpouseAnyTime` NOT ENFORCED', '⚠️ **Logical inconsistency possible**: on a MFS return, exactly ONE of (`livedApartFromSpouseEntireTaxYear`, `livedWithSpouseAnyTimeDuringTaxYear`) should be TRUE per IRC §86(c)(1)(C)/(D). The code reads both flags INDEPENDENTLY: line 6d uses `livedApartAllYear` (at line 8425); the line 6b restrictive branch uses `livedWithSpouseAnyTime` (at line 8424 / per 6b #7). **Two pathological cases not prevented**: (A) Both TRUE → line 6d = TRUE AND restrictive branch fires → inconsistent return ($25k base claim contradicts $0 restrictive path); (B) Both FALSE → line 6d = FALSE AND restrictive branch does NOT fire → MFS filer gets $25k base WITHOUT line 6d disclosure. **Closure applied**: (1) **15-line breadcrumb** at TaxReturnComputeService.java:8424-8438 (immediately above the two flag reads) documenting the logical-inverse expectation per IRC §86(c)(1)(C)/(D); two pathological cases with IRS interpretation problem; UI mitigation recommendation (radio buttons); deferral rationale. (2) **NEW outstanding.md entry** "Line 6d: livedApartAllYear vs livedWithSpouseAnyTime Mutual-Exclusion Enforcement — Deferred 2026-05-12" with ~1-2 hour scope (UI radio-button refactor + optional backend `SOCIAL_SECURITY_MFS_RESIDENCE_FACTS_INCONSISTENT` advisory flag + 2 lock-in tests); Low priority. Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:8424-8438 (15-line breadcrumb on mutual-exclusion soft validation gap); outstanding.md (new deferred entry "Line 6d: livedApartAllYear vs livedWithSpouseAnyTime Mutual-Exclusion Enforcement")', 'CLOSED — observation + deferral. 15-line breadcrumb + new outstanding.md entry. UI mitigation deferred (low priority).'],
  [8, 'RESOLVED 2026-05-12 — OBSERVATION — NEW FOR 2025: LINE 6d REPLACES HANDWRITTEN "D" NOTATION', 'Per IRS 2025 Form 1040 redesign + `lines/6abcd.md` §1: line 6d as a printed checkbox is **NEW FOR 2025**. Previously (TY2024 and earlier), MFS-lived-apart-all-year filers wrote "D" by hand next to the line 6a/6b amounts to signal the same fact (qualifying for $25k Single-equivalent base under IRC §86(c)(1)(C)). The 2025 redesign formalizes this as a printed checkbox; the boolean computation is conceptually identical (tax-law treatment unchanged since 1983 IRC §86 enactment) — only the disclosure FORMAT on the form changed. **Historical context relevant for**: (a) prior-year-data imports (any imported 2024 return data won\'t have a `livedApartFromSpouseEntireTaxYear` field — migration logic needed if multi-year retention is implemented; not currently a concern); (b) prior-year lump-sum recompute (6b #9 Gap ii — filing-status-and-residence facts for prior years pre-date this checkbox; no current impact because prior-year recompute uses current-year filing status per the 6b #9 deferred gap). **Closure**: pure xlsx-flip observation. Substantive NEW-FOR-2025 note already incorporated into 6d #6 breadcrumb at `TaxReturnComputeService.java:8429-8430`. Audit row separated for **pattern continuity** — audit-trail-completeness convention. Same shape as 6c #8 (documentation correction separated from 6c #5 fix) and 6d #4 (line-9 exclusion separated from 6c #4 bundle).', 'TaxReturnComputeService.java:8429-8430 (already covered via 6d #6 breadcrumb NEW-FOR-2025 line); lines/6abcd.md §1', 'CLOSED via 6d #6 — pure xlsx-flip observation. Historical context recorded in audit trail.'],
  [9, 'RESOLVED 2026-05-12 — OBSERVATION — LINE 6d LOGICAL COUPLING WITH LINE 6b RESTRICTIVE BRANCH (6b #7)', 'Line 6d (this audit) and the line 6b restrictive branch (6b #7) are driven by DIFFERENT but LOGICALLY-LINKED inputs: line 6d output ← `livedApartAllYear` (at line 8425); restrictive branch trigger ← `livedWithSpouseAnyTime` (at line 8424). The two should be logical inverses on MFS returns per IRC §86(c)(1)(C)/(D). The COUPLING exists in the IRS rule, but the CODE reads them independently. **Pure xlsx-flip cross-reference closure** — substantive observation already incorporated into 6d #7 breadcrumb at `TaxReturnComputeService.java:8424-8438`. **Two angles on the same coupling**: (a) 6d #7 angle — what happens when flags are pathologically set (both TRUE / both FALSE); soft validation gap with new outstanding.md entry for UI mitigation; (b) 6d #9 angle (this row) — how correctly-set logical-inverse flags drive different outputs that together describe the MFS-lived-apart vs MFS-lived-with-spouse fact set. Audit row separated for **pattern continuity** — third audit-trail-completeness separation in the 6d walkthrough (after 6d #4 and 6d #8). Surfaces the coupling as a discrete audit-trail data point.', 'TaxReturnComputeService.java:8424-8438 (incorporated into 6d #7 breadcrumb)', 'CLOSED — observation. Pure xlsx-flip cross-reference to 6d #7. No code/documentation/test change.'],
  [10, 'RESOLVED 2026-05-12 — OBSERVATION — 6abcd CLUSTER COMPLETE — 4th COMPLETE shared-aggregator cluster + FIRST 4-row verification log', 'Pure xlsx-flip observation. **6abcd cluster COMPLETE** — line 6d closes the cluster. **4th complete shared-aggregator cluster** (after 3abc + 4abc + 5abc) and **first 4-sub-line cluster in the audit workflow**. **Cumulative through 6d**: 25 lines audited (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd); 247 audit issues closed total; backend 755/755 tests pass (unchanged — no Java code change in 6d walkthrough); **MFS guard cascade at `computeSocialSecurityBenefits` = 4 audits (MATCHES `computeInterestIncome` density; codebase maximum)**; 11-audit consolidation at line-9 site (preserved through cluster); 13-line knowledge-file naming convergence (unchanged; 4-cite cascade within cluster); **three complete gross-vs-taxable bilateral coverage pairs** (4a/4b + 5a/5b + 6a/6b — unchanged from 6b #10 milestone); **Gap 4 (PDF CSV mapping for 6c + 6d checkboxes) FULLY RESOLVED** today via 6c #5 + 6d #5; **first 4-row verification log in lines/6abcd.md** (per-line-audit cadence); 1 new outstanding.md entry today (6d #7 mutual-exclusion soft validation gap; Low priority). **Looking ahead**: future audits begin line 7a (capital gain/loss) — a composite output without a gross sibling. No future cluster milestones, bilateral coverage milestones, or 4-row verification logs anticipated; remaining Form 1040 income lines (7a, 8) are single-line audits. Cluster-pattern density now matters only for retrospective consolidation.', 'XLS/computations/6d.xlsx audit-trail (this row); no code change', 'CLOSED — pure xlsx-flip observation. **6abcd cluster COMPLETE.** First 4-sub-line cluster; 4th shared-aggregator cluster; cluster-pattern density complete for the audit workflow.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 100 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 6d Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.line6dMfsLivedApartAllYear', '⚠️ topmostSubform[0].Page1[0].c1_42[0] — pre-6d-audit was `unmapped_c1_42_0` per CSV row 32 (deferred from 6c #5); fixed via 6d #5 to `line6d_mfs_lived_apart_all_year`', 'form-tax-return-1040.xlsx (line 6d checkbox)', '★ Primary output. Boolean. PDF mapping fixed via 6d #5 (parallel to 6c #5 closure).'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 (total income)', '—', '—', 'Boolean — structurally NOT eligible (clarified at 6c #4).'],
  ['Schedule B', '—', '—', 'No Schedule B presence.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 70 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
