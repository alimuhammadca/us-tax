// ============================================================================
//  Generates: C:\us-tax\XLS\computations\9.xlsx
//
//  Source-of-truth references:
//    - lines/9.md (2025 IRS-verified rule map for Form 1040 line 9 Total income)
//    - dependencies/9.md
//    - knowledge/line-9-total-income.md (renamed 2026-05-12 via 9 #2 from legacy knowledge_line9.md)
//    - TaxReturnComputeService line 9 formula at lines 4139-4222 (13-audit FINAL breadcrumb)
//    - PDF semantic CSV row 87: f1_73[0] line9_total_income
//    - IRS 2025 Form 1040 line 9 instructions ("Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8.
//      This is your total income.")
//
//  Tax year: 2025
//
//  NOTE: Line 9 is a **pure 8-operand sum formula** — no orchestrator, no separate computation
//  beyond `addNonNull` chain + `roundMoney`. The formula site has been EXHAUSTIVELY documented
//  via the 13-audit consolidation breadcrumb (built up 2026-05-10 through 2026-05-12; reached
//  FINAL state today via 8 #4 with line 8 inclusion citation). **No future audits can extend
//  the 13-audit consolidation count** — line-9 site is exhausted.
//
//  **Line 9 audit is SHORT and predominantly cross-referential** — the audit verifies the
//  formula correctness, the inherit-MFS-protection-from-feeder-operands pattern, the
//  not-artificially-floored-at-zero rule (per spec §9), the not-same-as-provisional-income
//  caveat (per spec §10), and records the meta-milestone that line 9 audit is the FIRST audit
//  at the line-9 site that does NOT add a new audit citation.
//
//  This is the FIRST audit in the AGI / deductions / tax-computation territory — boundary
//  between income-territory (lines 1-8) and AGI-territory (lines 10+).
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '9.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 9 — TOTAL INCOME'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 9'],
  ['Concept', 'Total income for the return — pure 8-operand sum of Form 1040 lines 1z + 2b + 3b + 4b + 5b + 6b + 7a + 8. Per IRS 2025 line 9 instructions: "Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income." No separate worksheet or alternate calculation. **Boundary line in audit workflow**: line 9 is the END of income-territory (lines 1-8) and the START of AGI-territory (line 10+). Line 9 audit produces the FIRST audit closure that does NOT add to the line-9 13-audit consolidation citation count (exhausted FINAL via 8 #4).'],
  ['Core invariant', '`Form1040.line9 = line1z + line2b + line3b + line4b + line5b + line6b + line7a + line8` (8 operands; `addNonNull` chain + `roundMoney` HALF_UP). **NOT floored at zero** — per spec §9, negative feeders (e.g., line 1f negative adoption / line 4b rollover loss / line 8 NOL via line 8a) can make line 9 negative. Line 9 NOT same as "provisional income" (Pub. 915 SS worksheet uses different sum) NOR "gross income" filing-requirement test (§6012).'],
  ['Per-Return Formula',
    '**Single-line code** at TaxReturnComputeService.java:4219-4222:\n' +
    '  BigDecimal line9 = roundMoney(addNonNull(\n' +
    '    addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(line1z, line2b), line3b), line4b), line5b), line6b), line7a),\n' +
    '    line8\n' +
    '  ));\n\n' +
    'Then persisted at line 4366: `income.setTotalIncome(line9);`\n\n' +
    '**8 operands** (per IRS 2025 line 9 instructions + spec §3.1):\n' +
    '  • line1z  — Wages, salaries, tips, etc. (per 1z #7)\n' +
    '  • line2b  — Taxable interest (per 2b #5)\n' +
    '  • line3b  — Ordinary dividends (per 3b #5)\n' +
    '  • line4b  — Taxable IRA distributions (per 4b #5)\n' +
    '  • line5b  — Taxable pensions and annuities (per 5b #5)\n' +
    '  • line6b  — Taxable Social Security benefits (per 6b #4)\n' +
    '  • line7a  — Capital gain or (loss) (per 7a #4)\n' +
    '  • line8   — Additional income from Schedule 1 line 10 (per 8 #4 — FINAL)\n\n' +
    '**Documentation density**: The 13-audit consolidation breadcrumb at TaxReturnComputeService.java:4139-4222 documents:\n' +
    '  - 8 INCLUSION citations (one per operand: 1z #7, 2b #5, 3b #5, 4b #5, 5b #5, 6b #4, 7a #4, 8 #4)\n' +
    '  - 5 EXCLUSION citations for numeric-but-IRS-excluded lines (2a #7 + 1i citation + 3a #5 + 4a #4 + 5a #4 + 6a #4)\n' +
    '  - 3 exclusion-category descriptions: (A) IRS-rule + (B) Boolean-type + (C) Double-count-prevention\n' +
    '  - Bilateral milestone notes for gross-vs-taxable pairs (4a/4b + 5a/5b + 6a/6b)\n' +
    '  - 12 + 13 audit-count milestone notes (12 reached at 7a #4; 13 FINAL reached today at 8 #4).'],
  ['Filed', 'Form 1040 line 9. PDF field: `topmostSubform[0].Page1[0].f1_73[0]` = `line9_total_income` (canonical mapping per CSV row 87).'],
  ['Backend method', '**No dedicated orchestrator** — line 9 is computed inline in `prepare()` at line 4219-4222 after all 8 feeder orchestrators have produced their values. No MFS guard needed at the line 9 site itself; **inherits MFS protection** from feeder orchestrators (1c-1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities + computeSocialSecurityBenefits + computeCapitalGainLoss + computeOtherIncomes — 13 orchestrators all MFS-protected per the cascade established through 8 #1).'],
  ['Output', 'form1040.income.totalIncome (BigDecimal — gain, zero, or capped loss). Whole-dollar HALF_UP rounded.'],
  ['IRS source', 'IRS 2025 Form 1040 line 9 instructions ("Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income.") + spec §1-§3.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Compute all 8 operand lines via their respective orchestrators', 'Lines 1z (composite), 2b/3b/4b/5b/6b/7a/8 (per-line orchestrators). All MFS-protected.'],
  [2, 'Apply `addNonNull` chain (7 nested calls for 8 operands)', 'Null-preserving: when ALL 8 are null, sum is null. When ANY is non-null, sum is the algebraic sum (null operands skipped).'],
  [3, 'Apply `roundMoney` to the sum', 'Whole-dollar HALF_UP rounding per canonical contract. `roundMoney(null) → null`.'],
  [4, 'Persist on Income.totalIncome', '`income.setTotalIncome(line9)` at line 4366. Unconditional set (allows null).'],
  [5, 'Flow to line 11a/11b (AGI)', '`Form1040.line11a = line9 - line10 (adjustments)`. Future line 11 audit will document this AGI computation.'],
  [],
  ['MUTUAL EXCLUSION / SPECIAL RULES'],
  ['Rule', 'Implementation', 'Why'],
  ['Line 9 is the sum of EXACTLY 8 operands (no more, no less)', '`addNonNull` chain at line 4219-4222 with literal operands `line1z, line2b, line3b, line4b, line5b, line6b, line7a, line8`. Java type system prevents adding non-numeric (e.g., boolean) operands.', 'Per IRS 2025 line 9 instructions.'],
  ['Line 9 NOT artificially floored at zero', '`addNonNull` performs algebraic addition with NO `max(0, ...)`. `roundMoney` does NOT floor either.', 'Per spec §9: negative feeders (line 1f adoption, line 4b rollover, line 8a NOL, etc.) can make line 9 negative. Filer claims negative AGI/refundable credits when line 9 < line 10 (Form 1045 / NOL carryback scenarios).'],
  ['Line 9 NOT same as "provisional income" for Pub. 915 SS worksheet', 'Pub. 915 worksheet line 3 = line1z+line2b+line3b+line4b+line5b+line7a+line8 (per 6b #6) — **excludes line 6b** to avoid circular dependency.', 'Per spec §10: provisional income is a separate concept from total income; uses overlapping but NOT identical operands.'],
  ['Line 9 NOT same as §6012 gross income for filing-requirement test', 'IRC §6012 gross income is a separate IRS concept including non-taxable items.', 'Per spec §10: filing-requirement thresholds use a different income concept.'],
  ['Line 9 site does NOT have its own MFS guard', 'Line 9 = sum of feeder values; all 8 feeders flow through their own MFS-protected orchestrators.', '**Inherits MFS protection** from feeder orchestrators (13 orchestrators all MFS-protected via the cascade through 8 #1).'],
  ['No future audits can extend the line-9 13-audit consolidation count', '13-audit FINAL milestone closed today (8 #4); citation count exhausted.', 'Per 8 #4 + 8 #10: line-9 site is the densest cross-audit citation site in the codebase, now in FINAL state.'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 9 Flows'],
  ['Consumer', 'How', 'Notes'],
  ['Form 1040 line 11a/11b (AGI) — ★★ PRIMARY DOWNSTREAM', '`line11a = line9 - line10 (adjustments)` per future line 11 audit. Inline computation at TaxReturnComputeService.java (TBD via line 11 audit).', '★★ CRITICAL: line 9 is the gross income side of AGI = gross income − adjustments.'],
  ['Form 1040 line 15 (taxable income)', 'Indirect via line 11b → line 14 (deductions) → line 15 = line 11b − line 14.', 'Carries through income waterfall.'],
  ['Pub. 915 SS taxability worksheet (line 6b)', 'Worksheet line 3 = line1z+line2b+line3b+line4b+line5b+line7a+line8 (per 6b #6) — uses 7 of the 8 line-9 operands but NOT line 6b itself (circular avoidance).', 'Computed BEFORE line 9 (since line 6b feeds line 9). NOT downstream of line 9.'],
  ['Line 28 ACTC / Schedule 8812', 'Earned income from line 1z + Schedule 1 line 3 — overlaps with line 9 operands but uses different aggregation.', 'Future Schedule 8812 audit.'],
  ['NOT IN OUTPUT — Self-employment tax (Schedule SE)', '—', 'Per CLAUDE.md: Schedule C / SE / F out-of-scope (related to lines 3 + 6 + Schedule 2 line 4 — all gated).'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 28 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 9'],
  ['Line 9 has 8 NUMERIC inputs (the 8 feeder lines). No personal-form inputs at the line 9 site itself — all input flows through the feeder line orchestrators.'],
  [],
  ['#', 'Source line', 'Field', 'IRS line', 'Required?', 'Role', 'Cross-reference'],
  [1, 'Form 1040 line 1z', 'line1z (wages composite)', 'Line 1z', 'YES (or null)', '1st operand', '1z #7 line-9 inclusion citation'],
  [2, 'Form 1040 line 2b', 'line2b (taxable interest)', 'Line 2b', 'YES (or null)', '2nd operand', '2b #5 line-9 inclusion citation'],
  [3, 'Form 1040 line 3b', 'line3b (ordinary dividends)', 'Line 3b', 'YES (or null)', '3rd operand', '3b #5 line-9 inclusion citation'],
  [4, 'Form 1040 line 4b', 'line4b (taxable IRA)', 'Line 4b', 'YES (or null)', '4th operand', '4b #5 line-9 inclusion citation'],
  [5, 'Form 1040 line 5b', 'line5b (taxable pension)', 'Line 5b', 'YES (or null)', '5th operand', '5b #5 line-9 inclusion citation'],
  [6, 'Form 1040 line 6b', 'line6b (taxable Social Security)', 'Line 6b', 'YES (or null)', '6th operand', '6b #4 line-9 inclusion citation'],
  [7, 'Form 1040 line 7a', 'line7a (capital gain/loss)', 'Line 7a', 'YES (or null)', '7th operand', '7a #4 line-9 inclusion citation'],
  [8, 'Form 1040 line 8', 'line8 (Schedule 1 line 10)', 'Line 8', 'YES (or null)', '8th and LAST operand', '8 #4 line-9 inclusion citation (FINAL)'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 26 }, { wch: 30 }, { wch: 12 }, { wch: 18 }, { wch: 25 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 9'],
  [],
  ['No direct numeric reference-data constants for line 9 — it is a pure sum formula.'],
  ['Statutory references'],
  ['§61 (general gross income)', 'IRC §61', 'All 8 operands flow from IRC §61 gross income inclusion (interest, dividends, distributions, gains, other income).'],
  ['§6012 (filing-requirement thresholds)', 'IRC §6012', 'NOT used for line 9; separate concept from line 9 total income.'],
  ['Pub. 915 SS worksheet (line 3 = line9 operands MINUS line6b)', 'IRS Pub. 915 + IRC §86', 'Uses 7 of the 8 line-9 operands; NOT downstream of line 9 (computed before).'],
  ['Pub. 525 (Taxable and Nontaxable Income)', 'IRS Pub. 525', 'Covers nontaxable items NOT in line 9 (e.g., tax-exempt interest line 2a, gross IRA line 4a, gross SS line 6a).'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 25 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 9 → AGI → Taxable Income → Tax'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.income.totalIncome', 'TaxReturnComputeService line 4366 — `income.setTotalIncome(line9)`', '★ Primary output. PDF: f1_73[0] = `line9_total_income` (canonical). Whole-dollar HALF_UP rounded.'],
  ['Form 1040 line 11a/11b (AGI) — ★★ CRITICAL', 'Future line 11 audit will document the AGI formula `line11a = line9 - line10 (adjustments)`.', '★★ Carries to taxable income → tax. Gross income side of AGI.'],
  ['Form 1040 line 15 (taxable income)', 'Indirect via line 11b → line 14 → line 15.', 'Income waterfall pass-through.'],
  ['Pub. 915 SS worksheet line 3 (NOT downstream)', 'Computed BEFORE line 9 (line 6b feeds line 9).', 'Uses 7 of 8 line-9 operands but NOT line 6b itself (circular avoidance).'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Schedule B', '—', 'Schedule B is for interest + dividends detail; not a line 9 consumer.'],
  ['§6012 filing-requirement test', '—', 'Per spec §10: NOT the same income concept; uses separate IRS criteria.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 9-Related'],
  ['No line-9-specific flags. All validation happens at the feeder line orchestrators (8 upstream sites).'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['(None at line 9 site)', 'N/A', 'Line 9 is a pure sum formula; no validation logic.', 'N/A'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 9 is a **pure 8-operand sum formula** — no orchestrator, no MFS guard at the site, no separate computation. The formula site has been EXHAUSTIVELY documented via the 13-audit consolidation breadcrumb (built up 2026-05-10 through 2026-05-12; reached FINAL state today via 8 #4). **No future audits can extend the count**. The line 9 audit is the **FIRST audit at the line-9 site that does NOT add a new audit citation** — it verifies audit-trail completeness + the inherit-MFS-protection-from-feeders pattern + the not-floored-at-zero rule + the not-same-as-provisional-income caveat. Verified 2026-05-12.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — NO MFS GUARD AT LINE 9 SITE (inherits from 13 feeder orchestrators)', 'Line 9 is computed inline in `prepare()` at TaxReturnComputeService.java:4219-4222 — NOT a separate orchestrator method. No `isMfsReturn` parameter needed at the line 9 site. **MFS protection inherited from the 13 feeder orchestrators**: lines 1c-1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities + computeSocialSecurityBenefits + computeCapitalGainLoss + computeOtherIncomes — all MFS-protected per the cascade established through 8 #1 (codebase maximum). When MFS is set, each feeder produces taxpayer-only values; line 9 sum is automatically taxpayer-only via the `addNonNull` chain at line 4219-4222. **STRUCTURALLY UNIQUE CLOSURE**: this is the **FIRST audit in the workflow where Issue #1 is a NO-MFS-GUARD-NEEDED cross-reference** — across all 28 prior line audits, Issue #1 was either a HIGH-PRIORITY defensive gap fix (cascade growth) or a cross-reference extending the cascade citation count. Line 9 has no orchestrator at all → no defensive gap to fix and no cascade citation to extend. **Closure**: pure xlsx-flip cross-reference. No breadcrumb at the line 9 site itself (would duplicate the 13-audit consolidation already at lines 4139-4222). The 13-audit consolidation breadcrumb already implicitly documents the inherited-MFS-protection pattern via per-operand citations (each operand cite transitively references that operand\'s own MFS-guard citation). Pure documentation closure — no code change.', 'TaxReturnComputeService.java:4219-4222 (line 9 site); MFS guards inherited from 13 feeder orchestrators', 'CLOSED — observation. NO code change. FIRST defensive-gap-NOT-needed Issue #1 in the audit workflow.'],
  [2, 'RESOLVED 2026-05-12 — DOCUMENTATION HYGIENE — KNOWLEDGE FILE RENAME (Legacy A underscore prefix → canonical)', '`knowledge/knowledge_line9.md` used Legacy A underscore-prefix form. **Closure applied**: (1) renamed `knowledge/knowledge_line9.md` → `knowledge/line-9-total-income.md` (canonical form); (2) updated generator header-comment reference at `generate-9.js` line 9; (3) grep verified inbound references: only `generate-9.js` (updated). **Knowledge-file naming convergence extends to 16 lines** (1c-1i + 1z + 2ab + 3ab + 4abc + 5abc + 6abcd + 7ab + 8 + **9**). **Third Legacy A migration today** (after 7a #2 + 8 #2 earlier). Today\'s 3 migrations represent ~43% of the remaining Legacy A backlog migrated in a single day. Remaining Legacy A files (3 after today): `knowledge_line16.md`, `knowledge_line17.md`, `knowledge_line26.md`, `knowledge_line27abc.md` — will rename during future audits.', 'C:\\us-tax\\knowledge\\line-9-total-income.md (renamed); C:\\us-tax\\XLS\\_tools\\generate-9.js header (updated)', 'CLOSED — file renamed + generator updated. Convergence at 16 lines.'],
  [3, 'RESOLVED 2026-05-12 — SPEC ENHANCEMENT — VERIFICATION LOG SECTION CREATED IN lines/9.md (SECOND single-line audit Verification log)', '`lines/9.md` did NOT have a Verification log section. **Closure applied**: appended a new `## Verification log` section at the end of the file with 1 row in IN-PROGRESS state capturing the 9 walkthrough (#1 NO MFS guard needed + #2 knowledge file renamed + #3 this section creation). To be finalized to "COMPLETE — 10/10 closed" during end-of-walkthrough docs-update step. **NEW section creation — NORMAL-variant pattern**. **Single-row log** — same shape as 8 #3. **SECOND single-line audit Verification log** in the workflow (after 8 #3 earlier today) — confirms single-row Verification logs as a stable pattern for single-line audits going forward (line 10 + line 14 + line 15 + line 16/17/26/27abc will likely follow).', 'lines/9.md (new Verification log section with single 9-audit row)', 'CLOSED — spec verification log section created. Second single-line audit Verification log.'],
  [4, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — LINE 9 SITE IS EXHAUSTED AT 13-AUDIT CONSOLIDATION FINAL (no new citation today; FIRST non-extending audit at line-9 site)', 'The line-9 13-audit consolidation reached FINAL state today via 8 #4 (last numeric operand citation). **Line 9 audit (this walkthrough) is the FIRST audit at the line-9 SITE that does NOT add a new audit ID** — structurally inevitable since line 9 itself is the formula being audited (cannot add itself to a consolidation that tracks operand decisions). **Meta-milestone**: line 9 audit is the SITE-LEVEL closure validating the work of all 13 prior line-9-operand audits (1z #7 + 2a #7 + 2b #5 + 3a #5 + 3b #5 + 4a #4 + 4b #5 + 5a #4 + 5b #5 + 6a #4 + 6b #4 + 7a #4 + 8 #4). **What 9 #4 verifies (without extending count)**: (1) formula correctness — `addNonNull` chain matches IRS 2025 instructions; (2) 8-operand mapping to IRS lines; (3) audit-trail completeness — all 8 inclusions + 5 numeric exclusions have citations; (4) 3 exclusion categories formalized — (A) IRS-rule + (B) Boolean-type + (C) Double-count-prevention; (5) bilateral milestones documented (4a/4b + 5a/5b + 6a/6b); (6) 13-audit FINAL state confirmed. **Closure**: pure xlsx-flip observation — no code change; the 13-audit consolidation breadcrumb at lines 4139-4222 stands UNCHANGED as canonical record. 9 #4 audit-trail row records the FIRST-NON-EXTENDING audit precedent for future re-verification scenarios (e.g., major refactor).', 'TaxReturnComputeService.java:4139-4222 (13-audit FINAL breadcrumb — unchanged); 13 prior line-9-operand audit citations all verified', 'CLOSED — observation. No breadcrumb extension; meta-milestone (first non-extending audit at line-9 site).'],
  [5, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — 8-OPERAND SUM FORMULA (`addNonNull` chain + `roundMoney`)', 'At TaxReturnComputeService.java:4219-4222: `BigDecimal line9 = roundMoney(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(line1z, line2b), line3b), line4b), line5b), line6b), line7a), line8));`. **Matches IRS 2025 line 9 instructions verbatim**: "Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income." Code adds exactly these 8 operands in this order (left-to-right via nested addNonNull calls). **Three verification points**: (1) `addNonNull` null-preserve semantic — when ALL 8 null → sum is null; when SOME null → algebraic sum of non-null; sign-preserving (negative operands subtract); (2) `roundMoney` whole-dollar HALF_UP per canonical contract; same rounding pattern as all 8 feeder operands; (3) lock-in test `line9EqualsLine1zPlusOtherIncomeLines` already exercised across all 13 line-9-operand audits (1z #7 through 8 #4) and re-verified today as part of smoke tests. **Closure**: pure xlsx-flip affirmative verification — formula is canonical per the 13-audit breadcrumb at lines 4139-4222 (built up across all 13 prior audits + reached FINAL state today via 8 #4). **NO new breadcrumb** at the formula site itself (would duplicate the 13-audit consolidation immediately above). Affirmative-verification audit-trail pattern — same shape as 7b #7 (PDF-mapping verification) + 8 #9 (1099-K gap verification). Pure documentation closure.', 'TaxReturnComputeService.java:4219-4222 (formula — canonical per 13-audit breadcrumb at 4139-4222); test `line9EqualsLine1zPlusOtherIncomeLines`', 'CLOSED — verified correct. No new breadcrumb; affirmative-verification audit-trail row.'],
  [6, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — LINE 9 NOT ARTIFICIALLY FLOORED AT ZERO (negative line 9 supported per spec §9)', 'Per spec §9: "line 9 must not be artificially floored at zero" + spec "Practical developer cheat sheet": "Line 7a and line 8 may be negative, so line 9 may also be negative." Code at TaxReturnComputeService.java:4219-4222 uses `addNonNull` (algebraic add, sign-preserving, NO `max(0, ...)` floor) + `roundMoney` (HALF_UP, sign-preserving). **Four sources of negative feeders**: line 1f negative adoption benefits (per 1z #8 audit, IRC §137(a)(3) special-needs adoption); line 4b rollover loss edge cases; line 7a capital loss (capped at $3,000/$1,500 MFS per IRC §1211(b); reported as negative); line 8 from Schedule 1 (NOL deduction line 8a negative OR §461(l) excess business loss line 8p negative). **Downstream consequences of negative line 9**: negative AGI (line 11a/11b = line 9 − line 10) is valid → enables refundable credit scenarios + NOL carryback via Form 1045; line 15 (taxable income) is floored at zero via `max(0, ...)` at line 15 site but line 9 itself is NOT floored. **Existing test coverage**: 1z #8 lock-in test `computesLine1zSumExcludesCombatPayElection` covers negative line 1z (-$5,280 from adoption benefits) → negative line 9; test has run successfully across all 13 line-9-operand audits to date. **Closure**: pure xlsx-flip affirmative verification — formula is correct. **NO new breadcrumb** at line 9 site; the existing 1z #8 breadcrumb at lines 4131-4138 already documents the negative-pass-through rule with explicit "downstream to line 9 / AGI" coverage. Affirmative-verification audit-trail pattern.', 'TaxReturnComputeService.java:4131-4138 (1z #8 negative-pass-through breadcrumb — UNCHANGED); existing 1z #8 lock-in test `computesLine1zSumExcludesCombatPayElection`', 'CLOSED — verified correct. No new breadcrumb (covered by 1z #8); affirmative-verification audit-trail row.'],
  [7, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — `roundMoney` WHOLE-DOLLAR HALF_UP APPLIED TO LINE 9', 'Per canonical `roundMoney` contract at TaxReturnComputeService.java:4219 (`roundMoney(addNonNull(...))`). **Three properties**: (1) null pass-through — `roundMoney(null) → null` (canonical null-preserve); (2) HALF_UP rounding — amounts ending in $0.50 round UP to next whole dollar (e.g., $100.50 → $101); (3) sign-preserving — `roundMoney(-5280.50) → -5281` (away from zero). **Matches IRS Form 1040 instructions** verbatim: "drop amounts under 50 cents and increase amounts from 50 to 99 cents to the next dollar." **Two scenarios where roundMoney at line 9 matters**: (1) null pass-through — when all 8 feeders null → `addNonNull` returns null → `roundMoney(null) → null` → line 9 unset on return; (2) defensive whole-dollar normalization — belt-and-suspenders against future feeder refactors that might bypass `roundMoney`. **For typical non-null inputs**, `roundMoney` at line 9 is effectively a no-op (feeders are already rounded at their own derivation sites; sum of whole-dollars is whole-dollar). **Closure**: pure xlsx-flip affirmative verification — same canonical pattern as every line-output site in the codebase. **NO new breadcrumb** at the formula site (would be over-documentation; the 13-audit consolidation breadcrumb above implicitly documents that all 8 operands + line 9 sum follow the same rounding pattern). Affirmative-verification audit-trail pattern.', 'TaxReturnComputeService.java:4219 (`roundMoney(addNonNull(...))`) — canonical pattern', 'CLOSED — verified correct. Consistent rounding pattern; no new breadcrumb (canonical pattern).'],
  [8, 'RESOLVED 2026-05-12 — OBSERVATION — LINE 9 NOT SAME AS "PROVISIONAL INCOME" FOR PUB. 915 SS WORKSHEET (different operand mix; circular-avoidance pattern)', 'Per spec §10: line 9 total income is a DIFFERENT concept from provisional income used in the SS taxability worksheet. **Operand-mix difference**: (a) Form 1040 line 9 = `1z + 2b + 3b + 4b + 5b + 6b + 7a + 8` (8 operands; INCLUDES line 6b); (b) Pub. 915 worksheet line 3 = `1z + 2b + 3b + 4b + 5b + 7a + 8` (7 operands; **EXCLUDES line 6b**). **Circular-avoidance rationale**: the Pub. 915 worksheet COMPUTES line 6b — if line 6b were in the "other income" sum, the worksheet would have circular dependency (line 6b depends on provisional income depends on worksheet line 3 includes line 6b). IRS designed the worksheet to use everything except line 6b. **Compute-order dependency**: line 6b → line 9 (downstream); line 9 does NOT feed the Pub. 915 worksheet (that\'s upstream of line 9). **Existing documentation**: 6b #6 31-line breadcrumb at `computeTaxableSocialSecurityNormal` documents the variable-name-to-IRS-line mapping including "worksheetLine3 (caller) = IRS worksheet line 3 (Form 1040 1z+2b+3b+4b+5b+7+8)" — note absence of 6b. **Closure**: pure xlsx-flip cross-reference observation — no new breadcrumb at line 9 site (would duplicate 6b #6); audit-trail row records the affirmative cross-reference. Audit-trail-completeness pattern (same shape as 6c #8 / 6d #8 / 6d #9 / 7b #7/8/9 / 8 #9 / 9 #5 / 9 #6 / 9 #7).', 'TaxReturnComputeService.java (6b #6 Pub. 915 worksheet breadcrumb — UNCHANGED); spec §10', 'CLOSED — observation. Cross-reference to 6b #6; no new breadcrumb.'],
  [9, 'RESOLVED 2026-05-12 — OBSERVATION — LINE 9 NOT SAME AS §6012 GROSS INCOME FOR FILING-REQUIREMENT TEST (no implementation impact)', 'Per spec §10: line 9 is total income for the RETURN ARITHMETIC; IRC §6012 gross income is a SEPARATE IRS concept used for FILING-REQUIREMENT THRESHOLDS (gross income above certain amounts requires filing). **Concept distinction**: (a) Form 1040 line 9 = computes AGI/tax for filers who ARE filing; (b) IRC §6012 gross income = determines IF a taxpayer must file; defined broadly to include items potentially excluded from line 9 (e.g., tax-exempt interest line 2a in some threshold tests; full Form 2555 exclusion amount; qualified scholarship portion). **No implementation impact** — this product computes returns for filers who have already decided to file; does NOT determine filing-requirement (that\'s a pre-filing decision the user makes based on §6012) and does NOT compute §6012 gross income or test against §6012 thresholds. **Closure**: pure xlsx-flip observation — important distinction documented in spec §10 for completeness; no implementation gap. Audit-trail row records the conceptual distinction so future readers understand line 9 is not a one-stop-shop for all "income" concepts in the IRC. Same audit-trail-completeness pattern as 9 #5/6/7/8.', 'lines/9.md §10 (spec); no implementation site (this product does not compute filing-requirement test)', 'CLOSED — observation. No implementation impact; spec reference; audit-trail-completeness row.'],
  [10, 'RESOLVED 2026-05-12 — OBSERVATION — LINE 9 AUDIT IS THE BOUNDARY BETWEEN INCOME-TERRITORY AND AGI-TERRITORY; FIRST NON-EXTENDING AUDIT AT LINE-9 SITE; INCOME-TERRITORY FULLY COMPLETE', 'Pure xlsx-flip observation — **two major meta-milestones reached today**: (1) **Audit workflow boundary**: line 9 audit is the LAST audit in income-territory (lines 1-8 plus the line-9 sum site) and the START of AGI-territory (line 10 adjustments → line 11a/11b AGI → line 14 deductions → line 15 taxable income → line 16+ tax computation); (2) **First non-extending audit at line-9 site**: line 9 is the FIRST walkthrough at the line-9 SITE that does NOT add a new audit ID to the 13-audit consolidation (FINAL per 8 #4). Establishes precedent for future re-verification scenarios. **INCOME-TERRITORY FULLY COMPLETE**: all 29 audited lines (1a-1i + 1z + 2a/2b + 3a/3b/3c + 4a/4b/4c + 5a/5b/5c + 6a/6b/6c/6d + 7a/7b + 8 + 9) audited. **Cumulative through line 9**: 29 lines audited; 287 audit issues closed total; backend 757/757 tests pass (unchanged from 8 — no code change in 9 walkthrough); 13-audit line-9 consolidation FINAL (unchanged); 13 MFS-protected orchestrators (unchanged); 16-line knowledge-file naming convergence (extended today via 9 #2); ZERO new outstanding.md entries in 9 walkthrough; ZERO code changes in 9 walkthrough (lightest-touch audit in the workflow to date). **Notable**: 10/10 issues all observations / cross-references / affirmative verifications — reflects line 9\'s structural position as a single-line formula already exhaustively documented via the 13-audit consolidation. **Looking ahead — AGI-territory begins at line 10**: future audits begin **line 10** (Schedule 1 Part II adjustments; similar single-line composite shape to line 8), then **line 11a/11b** (AGI = line 9 − line 10; tightly-coupled pair), **line 12a-12e** (standard deduction or Schedule A; multi-row cluster), **line 13a/13b** (QBI + additional deductions; coupled pair), **line 14** (total deductions composite), **line 15** (taxable income), **line 16+** (tax computation territory).', 'XLS/computations/9.xlsx audit-trail (this row); no code change', 'CLOSED — pure xlsx-flip. Income-territory FULLY COMPLETE; boundary milestone + first non-extending audit precedent.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 100 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 9 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.totalIncome', 'topmostSubform[0].Page1[0].f1_73[0] (line9_total_income)', 'form-tax-return-1040.xlsx (line 9 cell)', '★ Primary output. Whole-dollar HALF_UP rounded.'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 11a/11b (AGI)', '—', 'form-tax-return-1040.xlsx (line 11a/11b cells)', '★★ Critical: line9 - line10 (adjustments) = AGI. Future line 11 audit.'],
  ['Form 1040 line 15 (taxable income)', '—', 'form-tax-return-1040.xlsx (line 15 cell)', 'Indirect via line 11b → line 14 (deductions) → line 15.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Pub. 915 SS worksheet line 3', '—', '—', 'Uses different operand mix (excludes line 6b for circular avoidance per 6b #6). NOT downstream of line 9.'],
  ['§6012 filing-requirement test', '—', '—', 'Different income concept per spec §10.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 70 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
