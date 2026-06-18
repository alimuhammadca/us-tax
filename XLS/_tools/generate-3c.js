// ============================================================================
//  Generates: C:\us-tax\XLS\computations\3c.xlsx
//
//  Source-of-truth references:
//    - lines/3abc.md §5 (comprehensive line 3c spec — NEW for 2025)
//    - lines/3ab.md (narrower May-11 sibling spec covering 3a + 3b only — see Code Validation #2 spec-duplication reconciliation)
//    - knowledge/line-3ab-dividend-income.md (renamed 2026-05-11 via 3a #2)
//    - TaxReturnComputeService.computeDividendIncome() lines ~4925-4935 (DividendComputation construction with line 3c flags)
//    - TaxReturnComputeService.buildIncome() lines ~4223-4228 (Form 1040 line 3c setters)
//    - PDF semantic CSV: f1040_field_mapping_semantic.csv rows 23-24
//    - IRS 2025 Form 1040 line 3c (NEW for 2025 — "Check if your child's dividends are included in 1 [ ] Line 3a 2 [ ] Line 3b")
//    - IRS 2025 Form 8814 instructions (line 9 / line 10 / line 12 routing)
//
//  Tax year: 2025
//
//  NOTE: Line 3c is NOT a numeric line — it is **TWO INDEPENDENT CHECKBOXES** that DISCLOSE
//  to the IRS that the parent's lines 3a and/or 3b include Form 8814 child dividend amounts.
//  Because Form 8814 line 9 (the only child dividend amount that flows to parent's lines 3a
//  AND 3b) is added to BOTH lines symmetrically, both checkboxes always fire together in
//  practice. Line 3c does NOT affect line 9 arithmetic, AGI, taxable income, or tax owed —
//  it is metadata only.
//
//  Cross-reference foundation: 3a #7 and 3b #8 closures already documented the Form 8814
//  3-way split (line 9 → 3a/3b, line 10 → 7b, line 12 → Sched 1 8z). This line 3c audit
//  focuses on the disclosure-checkbox correctness.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '3c.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 3c — CHILD DIVIDEND DISCLOSURE CHECKBOXES (NEW FOR 2025)'],
  ['Tax Year', '2025 (line 3c is new for tax year 2025 per IRS Form 1040 revision)'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 3c'],
  ['Concept', '**TWO INDEPENDENT CHECKBOXES** (not a numeric value): a disclosure to the IRS that the parent has elected to include a child\'s interest/dividends on their own return via Form 8814, AND those child amounts ended up in the parent\'s lines 3a and/or 3b. Line 3c is METADATA — it does NOT affect line 9 total income, AGI, taxable income, or tax owed.'],
  ['Core invariant', 'Line 3c is a metadata disclosure. The arithmetic invariant `0 ≤ line3a ≤ line3b` (from spec §2) is unaffected by line 3c.'],
  ['Trigger condition (BOTH checkboxes)', '`hasChildQualifiedDividends = hasPositiveAmount(form8814QualifiedDividendsTotal)` at TaxReturnComputeService.java:4809.\n\n`form8814QualifiedDividendsTotal` = Σ (Form 8814 line 9) across all elected children, aggregated at line ~385-388.\n\nWhen line 9 > 0, the qualified portion of child net unearned income is added to BOTH parent\'s line 3a AND line 3b — so BOTH checkboxes fire together.'],
  ['Filed', '**PDF rendering**: Two CheckBox fields on Form 1040 page 1:\n  • `c1_33[0]` (semantic: `line3c_child_dividends_included_in_line3a`) at coordinates (283.8, 187.5, 291.8, 195.5)\n  • `c1_34[0]` (semantic: `line3c_child_dividends_included_in_line3b`) at coordinates (363, 187.5, 371, 195.5)\n\nIRS form text: "Check if your child\'s dividends are included in  1 [ ] Line 3a   2 [ ] Line 3b"'],
  ['Backend representation', '`Income.line3cChildDividendsInLine3a` and `Income.line3cChildDividendsInLine3b` — both `Boolean` (nullable). Semantic: `null` = "do not render the checkbox" (default); `TRUE` = "render as checked"; **`FALSE` is never set** (would be rendered as unchecked, but the form only renders TRUE).'],
  ['Backend method', 'TaxReturnComputeService.computeDividendIncome() lines ~4925-4935 — DividendComputation constructor populates both line 3c fields from a single `hasChildQualifiedDividends` boolean.\nTaxReturnComputeService.buildIncome() lines 4223-4228 — gates the Income setter on `Boolean.TRUE.equals(...)`.'],
  ['Output', '`form1040.income.line3cChildDividendsInLine3a` (Boolean; TRUE or null only).\n`form1040.income.line3cChildDividendsInLine3b` (Boolean; TRUE or null only).'],
  ['IRS source', 'IRS 2025 Form 1040 line 3c (new line for 2025); IRS 2025 Form 8814 instructions (line 9 routing to parent\'s 3a/3b)'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Aggregate Form 8814 line 9 across all elected children', '`form8814QualifiedDividendsTotal = form8814List.stream().map(Form8814::getLine9QualifiedDividends).filter(v -> v != null).reduce(BigDecimal.ZERO, BigDecimal::add)` at line ~385-388.\n\nForm 8814 line 9 = (line 6 × line 2b / line 4) — the qualified-dividend ratio applied to the child\'s net unearned income above the $2,700 base.\n\nLine 9 is null when Form 8814 line 4 ≤ $2,700 (the simplified-reporting path skips lines 9/10).'],
  [2, 'Compute boolean `hasChildQualifiedDividends`', '`boolean hasChildQualifiedDividends = hasPositiveAmount(form8814QualifiedDividendsTotal);` at line 4809.\n\nTRUE when at least one child contributed a positive line 9 amount. FALSE when all children\'s line 9 are null/zero (no qualified portion of net unearned income).'],
  [3, 'Add line 9 to BOTH parent line 3a AND line 3b (symmetric)', '`if (hasChildQualifiedDividends) { line3a = addNonNull(line3a, form8814QualifiedDividendsTotal); line3b = addNonNull(line3b, form8814QualifiedDividendsTotal); }` at lines 4810-4813.\n\nSymmetric addition because line 9 is the qualified portion (subset of ordinary) — both 3a (qualified subset) AND 3b (ordinary total) increase by the same amount. Preserves the line 3a ≤ line 3b invariant.'],
  [4, 'Set both line 3c checkbox flags on DividendComputation', '`return new DividendComputation(roundMoney(line3a), roundMoney(line3b), scheduleBRequiredFromDividends, roundMoney(form6251Line2gDividends), scheduleBDividendItems, hasChildQualifiedDividends ? Boolean.TRUE : null, hasChildQualifiedDividends ? Boolean.TRUE : null);` at lines 4927-4935.\n\n**Both fields use the SAME `hasChildQualifiedDividends` condition** because line 9 feeds both 3a and 3b together. Setting one without the other would mis-disclose to IRS.'],
  [5, 'Propagate to Income on Form 1040', '`if (interest != null && Boolean.TRUE.equals(interest.line3cChildDividendsInLine3a())) { income.setLine3cChildDividendsInLine3a(true); }` at lines 4223-4225.\nSame for 3b at lines 4226-4228.\n\nThe setter gate (`Boolean.TRUE.equals(...)`) preserves the null-vs-TRUE semantic — null on the DividendComputation results in the Income field staying null (no checkbox rendered).'],
  [6, 'Render to PDF via semantic CSV mapping', 'PDF semantic field `topmostSubform[0].Page1[0].line3c_child_dividends_included_in_line3a` (= raw `c1_33[0]`) reads `income.line3cChildDividendsInLine3a` from the JSON tax return.\n\nWhen Income field is `null`, the PDF renderer skips the checkbox (renders unchecked). When TRUE, renders as checked.\n\nSame for line 3b checkbox `c1_34[0]`.'],
  [],
  ['MUTUAL EXCLUSION RULES (enforced by code or spec)'],
  ['Rule', 'Implementation', 'Why'],
  ['Both checkboxes fire together (always — given current architecture)', 'Lines 4933-4934 — both set from same `hasChildQualifiedDividends` boolean.', 'Because Form 8814 line 9 (the only child dividend that flows to parent\'s lines 3a/3b) is added to BOTH lines symmetrically (3a #7 + 3b #8). Setting only one would mis-disclose.'],
  ['Neither checkbox fires when Form 8814 line 4 ≤ $2,700', 'buildForm8814 line 6401 — `if (line4.compareTo(ReferenceData.FORM8814_BASE_AMOUNT) > 0)` gates the line 9/10/12 computation. Below threshold, line 9 stays null. → hasChildQualifiedDividends = false → both checkboxes null.', 'IRS Form 8814 simplified-reporting path: when child\'s gross income is at or below $2,700, the entire amount goes to Schedule 1 line 8z without breaking out qualified/cap-gain portions. Lines 3a, 3b, and 3c are unaffected.'],
  ['Neither checkbox fires when child has only ordinary (non-qualified) dividends', 'When child has line 2a > 0 but line 2b = 0: line 9 ratio = 0 → line 9 = 0 → form8814QualifiedDividendsTotal = 0 → hasChildQualifiedDividends = false.', 'Per IRS Form 8814 instructions + spec §5.3: only the QUALIFIED portion (line 9) flows to parent\'s 3a/3b. The full ordinary (line 2a) routes to Schedule 1 line 8z via line 12 — does not reach line 3b directly.'],
  ['Neither checkbox fires when no Form 8814 is filed', 'form8814List empty → form8814QualifiedDividendsTotal = 0 → hasChildQualifiedDividends = false.', 'Line 3c is a Form 8814 election disclosure. No election → no disclosure.'],
  ['Line 3c is NEVER set to Boolean.FALSE — only TRUE or null', 'Lines 4933-4934: `hasChildQualifiedDividends ? Boolean.TRUE : null`. Setter at lines 4223-4228 gates on `Boolean.TRUE.equals(...)`.', 'Avoids ambiguity: `null` = "do not render the checkbox" (default state); `TRUE` = "render as checked". A `false` value could be ambiguous (render as unchecked? Or skip?).'],
  ['Line 3c does NOT affect line 9 arithmetic', 'Line 3c is a Boolean field; never appears in the line 9 addNonNull chain at line 4141-4144.', 'Disclosure-only metadata. The amount already flows to line 9 via line 3b (which IS in line 9). Line 3c just tells the IRS the source.'],
  ['Line 3c checkboxes are INDEPENDENT in principle, LINKED in practice', 'Per spec §5.1: two independent checkboxes. Per spec §5.3 + current code: both fire on `hasChildQualifiedDividends`.', 'The two checkboxes COULD theoretically fire on different conditions (e.g., line 3a checkbox on line 9 > 0; line 3b checkbox on line 2a > 0). But given IRS Form 8814 architecture (only line 9 flows to parent 3a/3b, line 2a remainder goes to Schedule 1), they always fire together.'],
  [],
  ['DECISION TREE — when does each line 3c checkbox fire?'],
  ['Condition', 'Form 8814 line 9 result', 'Line 3c box 1 (line 3a)', 'Line 3c box 2 (line 3b)'],
  ['No Form 8814 filed', '(not computed)', 'null (unchecked)', 'null (unchecked)'],
  ['Form 8814 filed but child line 4 ≤ $2,700', 'line 9 null (simplified path)', 'null', 'null'],
  ['Form 8814 filed; child has only interest (no dividends)', 'line 9 = 0 (line 2b ratio = 0)', 'null', 'null'],
  ['Form 8814 filed; child has only NON-qualified ordinary dividends', 'line 9 = 0 (line 2b = 0)', 'null (full amount goes to Sched 1 8z via line 12)', 'null'],
  ['Form 8814 filed; child has qualified dividends > 0', 'line 9 > 0', '**TRUE (checked)**', '**TRUE (checked)**'],
  ['Form 8814 filed; child has BOTH qualified AND non-qualified ordinary dividends', 'line 9 = (qualified portion) > 0', '**TRUE (checked)**', '**TRUE (checked)**'],
  ['Multiple Form 8814 children, at least one with qualified dividends', 'sum of line 9 across children > 0', '**TRUE (checked)**', '**TRUE (checked)**'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 3c Flows'],
  ['Consumer', 'How', 'Notes'],
  ['Form 1040 PDF rendering', 'PDF renderer reads `income.line3cChildDividendsInLine3a` and `income.line3cChildDividendsInLine3b` from the JSON tax return; sets checkboxes `c1_33[0]` and `c1_34[0]` to checked when TRUE.', '★ Only downstream consumer. Line 3c is purely a disclosure to the IRS.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 (total income)', 'Line 3c is a Boolean; never enters arithmetic.', 'Disclosure-only.'],
  ['AGI / taxable income / tax owed', 'Line 3c value (TRUE/null) has no arithmetic effect anywhere.', 'Pure metadata.'],
  ['Schedule B', 'Schedule B Part II reports line 3b values; the line-3c-disclosure flag is not part of Schedule B.', 'Line 3c is on Form 1040 only.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 30 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Determines Line 3c'],
  ['Line 3c depends entirely on Form 8814 child election + child qualified-dividend computation. No direct user-facing input fields for line 3c itself — it is a fully derived disclosure.'],
  [],
  ['#', 'Source xlsx', 'Field path / model key', 'Label / box', 'Required?', 'Role in line 3c determination', 'Cross-reference'],
  [],
  ['UPSTREAM — Form 8814 election + child dividend statements'],
  [1, 'form-child-interest-dividends.xlsx', 'childInterestDividendsEntries[].childSsn', 'Child SSN (matches a dependent)', 'YES — for child identification', 'Drives whether buildForm8814 produces a Form 8814 record for the child. Per spec §5.2: parent must elect Form 8814 for line 3c to apply.', 'lines/3abc.md §5.2'],
  [2, 'form-child-interest-dividends.xlsx', 'childInterestDividendsEntries[].line2aOrdinaryDividends', 'Child total ordinary dividends (1099-DIV box 1a)', 'NO (election-dependent)', 'Used in Form 8814 line 4 (total gross income) and line 9 ratio denominator. Does NOT directly trigger line 3c — only line 2b/line 4 ratio × line 6 = line 9 > 0 triggers.', 'buildForm8814 lines 6359, 6408'],
  [3, 'form-child-interest-dividends.xlsx', 'childInterestDividendsEntries[].line2bQualifiedDividends', 'Child qualified dividends (1099-DIV box 1b)', 'NO (election-dependent)', '★ PRIMARY UPSTREAM INPUT. Used in Form 8814 line 9 ratio (line 2b / line 4). When line 2b > 0 and line 4 > $2,700, line 9 > 0 → line 3c fires.', 'buildForm8814 lines 6408-6413'],
  [4, 'form-child-interest-dividends.xlsx', 'childInterestDividendsEntries[].line1aTaxableInterest', 'Child taxable interest (1099-INT box 1)', 'NO (election-dependent)', 'Used in Form 8814 line 4. Does NOT trigger line 3c directly (only contributes to line 4 denominator).', 'buildForm8814 line 6359'],
  [5, 'form-child-interest-dividends.xlsx', 'childInterestDividendsEntries[].line3CapGainDistributions', 'Child capital gain distributions (1099-DIV box 2a)', 'NO (election-dependent)', 'Used in Form 8814 line 4 and line 10 ratio. Does NOT trigger line 3c (cap gains route to line 7b checkbox, not 3c).', 'buildForm8814 lines 6359, 6410-6413; spec §5.4'],
  [],
  ['DERIVED — Form 8814 outputs (computed upstream)'],
  [6, '(internal)', 'Form8814.line9QualifiedDividends', 'Form 8814 line 9: qualified-dividend portion of child net unearned income', 'YES — for line 3c trigger', '★ DIRECT TRIGGER. Aggregated across all children to `form8814QualifiedDividendsTotal` at TaxReturnComputeService.java:385-388. Sum > 0 → `hasChildQualifiedDividends = true` → both checkboxes fire.', 'buildForm8814 line 6419'],
  [7, '(internal)', 'Form8814.line4Total', 'Form 8814 line 4: child total gross income (1a + 2a + 3)', 'NO — gating only', 'When line 4 ≤ $2,700, lines 9 and 10 are blank → line 3c does NOT fire. Per IRS Form 8814 simplified-reporting path.', 'buildForm8814 line 6401'],
  [8, '(internal)', 'Form8814.line6AboveBase', 'Form 8814 line 6: line 4 − $2,700', 'NO — derivation', 'Intermediate. line 6 > 0 is the precondition for line 9 computation.', 'buildForm8814 line 6402'],
  [],
  ['REFERENCE DATA — Form 8814 thresholds'],
  [9, '(reference data)', 'FORM8814_BASE_AMOUNT', '$2,700 (gating threshold for line 6/9/10 computation)', '—', 'When child gross income (line 4) ≤ $2,700, no line 9 → no line 3c.', 'ReferenceData.java + lines/3abc.md §5.3'],
  [10, '(reference data)', 'FORM8814_GROSS_INCOME_LIMIT', '$13,500 (max child gross income for Form 8814 election)', '—', 'Above $13,500, child must file own return → no Form 8814 → no line 3c.', 'buildForm8814 line 6364; ReferenceData.java'],
  [],
  ['NO DIRECT USER INPUT FOR LINE 3c'],
  ['—', '—', '—', '—', 'NO', 'Line 3c is fully DERIVED from Form 8814 election + child dividend statements. The user does NOT manually check the line 3c boxes — they elect Form 8814 by filling in child-interest-dividends entries, and the system derives whether line 9 > 0.', 'Spec §5 + buildForm8814 + computeDividendIncome'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 45 }, { wch: 65 }, { wch: 55 }, { wch: 22 }, { wch: 90 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 3c'],
  ['Line 3c itself has no direct constants. Trigger condition depends on Form 8814 thresholds.'],
  [],
  ['Constant', 'Value', 'Source', 'Used by line 3c?', 'Notes'],
  [],
  ['Form 8814 thresholds (indirect — gate line 3c via line 9 computation)'],
  ['FORM8814_BASE_AMOUNT', '$2,700', 'ReferenceData.FORM8814_BASE_AMOUNT', 'YES (indirect gate)', 'Form 8814 line 4 must EXCEED $2,700 for line 9 (qualified portion) to be computed. Below threshold, line 9 = null → line 3c does NOT fire.'],
  ['FORM8814_UNTAXED_AMOUNT', '$1,350', 'ReferenceData.FORM8814_UNTAXED_AMOUNT', 'NO (extra-tax path)', 'First $1,350 of child unearned income is untaxed. Next $1,350 (i.e., $1,350-$2,700) taxed at 10% via Form 8814 line 15. NOT a line 3c gate.'],
  ['FORM8814_GROSS_INCOME_LIMIT', '$13,500', 'ReferenceData.FORM8814_GROSS_INCOME_LIMIT', 'YES (indirect gate)', 'Child gross income must be < $13,500 to use Form 8814. Above, child files own return → no Form 8814 → no line 3c.'],
  ['FORM8814_EXTRA_TAX_MAX', '$135', 'ReferenceData.FORM8814_EXTRA_TAX_MAX', 'NO', 'Cap on Form 8814 extra tax (line 15). Not a line 3c input.'],
  [],
  ['Statutory references'],
  ['Form 8814 child dividend election', 'IRC §1(g); IRS Form 8814 instructions', 'Parent election to include child interest/dividends on parent return. Line 3c discloses the election outcome.'],
  ['Line 3c added for 2025', 'IRS 2025 Form 1040 revision', 'New checkbox pair on Form 1040 line 3c. Analogous to line 7b "Includes child\'s capital gain or loss" checkbox per spec §5.4.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 40 }, { wch: 18 }, { wch: 50 }, { wch: 22 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 3c Has NO Computational Side-Effects'],
  ['Line 3c is purely disclosure metadata. It does NOT trigger downstream computations, schedules, or worksheets.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['Form 1040 PDF — line 3c box 1 checkbox', 'Income.line3cChildDividendsInLine3a → PDF field c1_33[0] / line3c_child_dividends_included_in_line3a', 'Rendered as checked when TRUE; absent when null.'],
  ['Form 1040 PDF — line 3c box 2 checkbox', 'Income.line3cChildDividendsInLine3b → PDF field c1_34[0] / line3c_child_dividends_included_in_line3b', 'Rendered as checked when TRUE; absent when null.'],
  [],
  ['NOT IN OUTPUT (explicit non-effects)'],
  ['Line 9 (total income)', 'Line 3c is Boolean; never in addNonNull chain.', 'Disclosure-only.'],
  ['Line 11a/11b (AGI), line 15 (taxable income), line 16 (tax)', 'No arithmetic propagation.', 'Pure metadata.'],
  ['Schedule B Part II', 'Line 3c is on Form 1040 only; not on Schedule B.', '—'],
  ['QDCG Worksheet (line 16)', 'QDCG reads line 3a value, not the line 3c checkbox.', '—'],
  ['Form 8960 NIIT', 'Out of scope per CLAUDE.md.', '—'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 55 }, { wch: 90 }, { wch: 80 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 3c Does NOT Emit Flags Directly'],
  ['Line 3c is a downstream disclosure, not a primary input. Upstream Form 8814 / dividend-income workflow flags (e.g., FORM8814_CHILD_GROSS_INCOME_TOO_HIGH at $13,500 limit) gate line 3c.'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['FORM8814_CHILD_GROSS_INCOME_TOO_HIGH', 'BLOCKING', 'Child gross income ≥ $13,500 → Form 8814 unavailable → no line 3c.', 'buildForm8814 lines 6367-6373'],
  ['(no direct line 3c flag)', '—', 'Line 3c never triggers a TaxReturnFlag — it is a passive disclosure.', '—'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 50 }, { wch: 18 }, { wch: 70 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Line 3c Disclosure Checkboxes'],
  ['Line 3c is the third audit in the line 3 cluster. The Form 8814 routing was already verified during 3a #7 + 3b #8. This audit focuses on the disclosure-checkbox correctness + a discovered spec-file duplication that emerged from the 3a/3b walkthroughs.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-11 — CROSS-REFERENCE — MFS GUARD CASCADE INDIRECTLY PROTECTS LINE 3c (UPSTREAM ARCHITECTURE)', '`hasChildQualifiedDividends` is derived from `form8814QualifiedDividendsTotal`, aggregated at TaxReturnComputeService.java:385-388 from `form8814List` — built by computeChildInterestDividends UPSTREAM of computeInterestIncome and the MFS guard. Form 8814 is parent-level (not spouse-attributed) — elected children belong to the return as a whole, not to a specific spouse. The MFS guard at line ~4327-4328 nulls `dividendIncomeSpouse` but does NOT touch Form 8814 processing. Per IRS Form 8814 instructions, the election survives MFS filing — each MFS return is its own filing entity, so the electing parent\'s line 3c correctly fires when their Form 8814 produces line 9 > 0. Closure: pure xlsx-flip verification — no code change, no breadcrumb (the correct MFS behavior is structural, not a deliberate guard). Same closure shape as 3a #8 (pure cross-reference to upstream protection mechanism). Note: line 3c is NOT in the MFS guard\'s 5-output cascade because line 3c is metadata (Boolean), not a value.', 'TaxReturnComputeService.java:385-388 (form8814QualifiedDividendsTotal aggregation upstream of MFS guard)', 'CLOSED — pure verification cross-reference. No code change.'],
  [2, 'RESOLVED 2026-05-11 — SPEC FILE DUPLICATION CONSOLIDATED', 'Two spec files existed: `lines/3ab.md` (May-11, narrower 3a+3b only, created during 3a #3 closure by mistake) and `lines/3abc.md` (April-14, comprehensive covering 3a+3b+3c). Both shared §2 core invariant and Form 8814 routing content. Closure: (a) appended §15 "Verification log" to `lines/3abc.md` with the 3a + 3b walkthrough rows migrated from `lines/3ab.md §14` PLUS a new 3c in-progress row; (b) updated 2 code breadcrumbs in TaxReturnComputeService.java from `lines/3ab.md` to `lines/3abc.md` (line 4792: `lines/3abc.md §5.3`; line 4827: `lines/3abc.md §2`); (c) deleted `lines/3ab.md`. Single source of truth restored. Grep verified no remaining code references to the deleted file (other 5 hits are historical-record audit trails in history.md, outstanding.md, generate-3a.js, generate-3b.js, generate-3c.js — all correctly preserved as snapshots of the time). Compile clean.', 'lines/3abc.md §15 (new verification log section); TaxReturnComputeService.java:4792 + 4827 (breadcrumb references updated); lines/3ab.md (deleted)', 'CLOSED — spec duplication eliminated. Self-correcting closure (cleaned up issue I introduced in 3a #3).'],
  [3, 'RESOLVED 2026-05-11 — SPEC INTERNAL INCONSISTENCY FIXED — §5.1 REWRITTEN TO MATCH §5.3', '§5.1 incorrectly implied the line 3b checkbox fires on `line2aOrdinaryDividends > 0` (child has any ordinary dividends), contradicting §5.3 which correctly explains both fire on `line 9 > 0`. The current code (`hasChildQualifiedDividends` at TaxReturnComputeService.java:4809) matches §5.3 — verified by lock-in test `form8814OrdinaryDividendsOnlyAboveThresholdDoesNotSetLine3cCheckboxes`. Closure: rewrote the §5.1 "Check when" column so both checkboxes show the **same condition** (`line9QualifiedDividends > 0`). Added a clarifying paragraph noting the two checkboxes are conceptually independent but practically linked because Form 8814 architecture makes line 9 the only child dividend flowing to parent\'s 3a AND 3b (non-qualified ordinary routes to Schedule 1 line 8z via line 12). Added explicit verification reference to the lock-in test that exercises the line-2a-only edge case.', 'lines/3abc.md §5.1 (rewritten "Check when" column + new clarifying paragraph + lock-in test reference)', 'CLOSED — spec internal consistency restored. §5.1 now aligns with §5.3 and current code.'],
  [4, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — BOTH LINE 3c CHECKBOXES SHARE `hasChildQualifiedDividends` TRIGGER', 'Both line 3c fields derive from the same boolean at TaxReturnComputeService.java:4946-4947 — intentional symmetric-trigger design (not a DRY violation). Per Form 8814 architecture + lines/3abc.md §5.3: line 9 is the only child dividend amount flowing to parent\'s 3a AND 3b (non-qualified ordinary remainder routes to Schedule 1 line 8z via line 12). Closure: 13-line breadcrumb above the DividendComputation constructor (lines 4927-4940) documenting: (a) the symmetric-trigger design rationale; (b) cross-reference to 3a #7 + 3b #8 25-line 3-way split breadcrumb at lines 4792-4819; (c) the TRUE-or-null PDF rendering semantic (covered by #5); (d) lock-in test citations. All 20 form8814* tests pass. Prevents future contributors from misreading the symmetric trigger as a DRY violation or independence bug (the same misreading caused the §5.1 inconsistency in #3).', 'TaxReturnComputeService.java:4927-4940 (13-line breadcrumb above DividendComputation constructor)', 'CLOSED — verified correct. Breadcrumb explains the symmetric-trigger design.'],
  [5, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — CHECKBOX SEMANTIC: Boolean.TRUE OR null (NEVER false)', 'Lines 4946-4947 use the `... ? Boolean.TRUE : null` pattern — never sets `Boolean.FALSE`. End-to-end chain verified: (1) computeDividendIncome sets TRUE or null; (2) buildIncome setter at lines 4223-4228 gates on `Boolean.TRUE.equals(...)` so null source → Income field stays null; (3) Income.java field is `Boolean` (boxed, null-permitting); (4) JSON serialization omits null fields; (5) PDF renderer only renders checkbox when field is `true`. Semantic: `null` = "disclosure does not apply" (default); `TRUE` = "disclosure applies; render checked". The `Boolean.FALSE` value is semantically redundant with null and correctly avoided — keeps JSON wire protocol clean (line 3c keys only appear for users with Form 8814 disclosure). Same pattern as `line7_includes_child_capital_gain_or_loss` (line 7b sibling checkbox per spec §5.4). Closure: covered by the 13-line breadcrumb added during Issue #4 at TaxReturnComputeService.java:4927-4940 which explicitly mentions "The TRUE-or-null pattern (never Boolean.FALSE) preserves PDF rendering semantics". Pure xlsx-flip — no separate breadcrumb needed.', 'TaxReturnComputeService.java:4946-4947 (TRUE-or-null pattern); covered by Issue #4 breadcrumb at lines 4927-4940', 'CLOSED — verified correct. Pure xlsx-flip closure (covered by Issue #4 breadcrumb).'],
  [6, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — buildIncome SETTER USES TWO-LAYER NULL-SAFE GATE', 'TaxReturnComputeService.java:4233-4238 uses two-layer null-safe gate: `if (interest != null && Boolean.TRUE.equals(...))`. Layer 1 (`interest != null`) defends against the InterestComputation record being null; Layer 2 (`Boolean.TRUE.equals(...)`) is null-safe boolean equality — avoids the NPE that `if (interest.line3c...())` would cause when unboxing null. Preserves the null-vs-TRUE semantic from the producer site (3c #4/#5 breadcrumb at lines 4927-4940). Closure: 10-line breadcrumb above both line 3c setters documenting (a) the two null-safety layers + rationale; (b) end-to-end semantic chain (null source → field stays null → JSON omits key → PDF skips checkbox); (c) cross-reference to producer-site breadcrumb; (d) lock-in coverage from all 20 form8814* tests. Tests re-run passed.', 'TaxReturnComputeService.java:4223-4232 (10-line breadcrumb above buildIncome line 3c setters); all 20 form8814* tests pass', 'CLOSED — verified correct. Breadcrumb documents the two null-safety layers.'],
  [7, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — LINE 3c DOES NOT PARTICIPATE IN LINE 9 ARITHMETIC', 'Line 3c is Boolean — structurally incompatible with addNonNull (BigDecimal) chain. Java type system prevents arithmetic propagation at compile time. Grep verification: ZERO hits for `addNonNull(line3cChild...)`, `roundMoney(line3cChild...)`, `subtractNonNegative(line3cChild...)` patterns. The only references in the codebase are: Income.java getters (lines 370, 378 — model accessors only), buildIncome setters (lines 4233+, verified during #6), DividendComputation producer (lines 4946-4947, verified during #4). Line 3c is fully isolated metadata. The child amount already flows to line 9 via line 3b (which IS in line 9 per 3b #5). Spec §2 invariant: "Line 3c is metadata; it does not change the arithmetic of lines 3a or 3b." Closure: pure xlsx-flip verification — no code change, no breadcrumb (structural type-level protection + spec §2 invariant are already sufficient; adding "line 3c is not here" at the line 9 formula site would be noise).', 'TaxReturnComputeService.java:4141-4144 (line 9 formula — line 3c structurally absent); grep verified 0 arithmetic hits', 'CLOSED — pure xlsx-flip verification. Structural protection + spec §2 invariant.'],
  [8, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — FORM 8814 LINE 4 ≤ $2,700 PATH CORRECTLY SKIPS LINE 3c', 'Three independent layers of verification: (1) **gate at buildForm8814 line 6401** — `if (line4.compareTo(ReferenceData.FORM8814_BASE_AMOUNT) > 0)` skips the line 9 setter when line 4 ≤ $2,700; (2) **null-filter at aggregator** (TaxReturnComputeService.java:385-388) — `.filter(v -> v != null)` excludes null line 9 values from the sum; (3) **existing inline gate comment** ("Part I proportional computation — only when line4 > $2,700") documents the intent. Result: when child line 4 ≤ $2,700, line 9 stays null → form8814QualifiedDividendsTotal = 0 → hasChildQualifiedDividends = false → both line 3c checkboxes stay null. IRS-correct per Form 8814 simplified-reporting path. Multi-child mixed-threshold scenarios are correctly handled by the null-filter (above-threshold child\'s line 9 included, below-threshold child filtered out). Lock-in: `form8814NoQualifiedDividendsDoesNotSetLine3cCheckboxes`. Closure: pure xlsx-flip — three structural layers + existing gate comment are already sufficient.', 'buildForm8814 line 6401 (gate); TaxReturnComputeService.java:385-388 (null-filter); test form8814NoQualifiedDividendsDoesNotSetLine3cCheckboxes', 'CLOSED — pure xlsx-flip verification. No code change.'],
  [9, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — 5 EXISTING form8814 TESTS COVER ALL LINE 3c SCENARIOS', '**Comprehensive coverage matrix** from prior audits (3a #7, 3b #8): (a) `form8814Line9QualifiedDividendsFlowToParentLine3aAnd3b` line 15385 — POSITIVE: both fire when line 9 > 0; (b) `form8814NoQualifiedDividendsDoesNotSetLine3cCheckboxes` line 15422 — NEGATIVE: neither fires when line 9 = 0 (also covers Issue #8 line 4 ≤ $2,700 path); (c) `form8814OrdinaryDividendsOnlyAboveThresholdDoesNotSetLine3cCheckboxes` line 15444 — CRITICAL EDGE: neither fires when line 2a > 0 but line 2b = 0 (proves §5.3 line-9-only trigger; the case that exposed the §5.1 inconsistency fixed in #3); (d) `form8814QualifiedDividendsAggregateAcrossMultipleChildren` line 15477 — AGGREGATION: multi-child sum; (e) `form8814ChildQualifiedDividendsAddedToParentExistingDividends` line 15508 — COMPOSITION: child + parent both have dividends. Every Issue #1-#8 behavioral assertion is covered. All 20 form8814* tests pass (re-run during 3c #4 + #6). Closure: pure xlsx-flip — adding a 6th test would just duplicate one of these scenarios.', 'TaxReturnComputeServiceTest.java lines 15385, 15422, 15444, 15477, 15508 (5 form8814 tests)', 'CLOSED — pure xlsx-flip verification. Test coverage already comprehensive.'],
  [10, 'RESOLVED 2026-05-11 — OBSERVATION — LINE 3c IS NEW FOR 2025; ANALOGOUS TO LINE 7b SIBLING CHECKBOX', 'Per lines/3abc.md §1: line 3c is a new addition to the 2025 Form 1040 revision (previous years had no Form 1040 child-dividend disclosure checkbox). Per §5.4: analogous to the sibling line 7b checkbox `line7_includes_child_capital_gain_or_loss` (Form 8814 line 10 cap-gain portion). The 2025 form change pattern: wherever Form 8814 child amounts flow into a Form 1040 line, the IRS now requires a disclosure checkbox. Future line 7b audit should follow the same TRUE-or-null pattern (3c #5) and two-layer null-safe gate (3c #6). Closure: extended the existing 3c #4 breadcrumb at TaxReturnComputeService.java:4937-4955 with a 6-line addition (new-for-2025 status + line 7b sibling reference + future-audit guidance). Backend regression: 751/751 pass.', 'TaxReturnComputeService.java:4937-4955 (extended 3c #4 breadcrumb with 6-line addition)', 'CLOSED — observation. Breadcrumb extension notes new-for-2025 status + line 7b sibling pattern.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 32 }, { wch: 95 }, { wch: 65 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 3c Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.line3cChildDividendsInLine3a', 'topmostSubform[0].Page1[0].line3c_child_dividends_included_in_line3a (c1_33[0])', 'form-tax-return-1040.xlsx (line 3c box 1 checkbox)', '★ Disclosure checkbox 1: child dividends included in line 3a.'],
  ['form1040.income.line3cChildDividendsInLine3b', 'topmostSubform[0].Page1[0].line3c_child_dividends_included_in_line3b (c1_34[0])', 'form-tax-return-1040.xlsx (line 3c box 2 checkbox)', '★ Disclosure checkbox 2: child dividends included in line 3b.'],
  [],
  ['NO DOWNSTREAM ARITHMETIC'],
  ['Form 1040 line 9 (total income)', '—', '—', 'Line 3c is Boolean; never in arithmetic. Child dividend amount already in line 9 via line 3b.'],
  ['Form 1040 line 11a/11b (AGI), line 15 (taxable income), line 16 (tax)', '—', '—', 'No propagation. Pure metadata.'],
  ['Schedule B Part II', '—', '—', 'Line 3c is on Form 1040; not Schedule B.'],
  ['QDCG Worksheet (line 16 path)', '—', '—', 'Reads line 3a value, not line 3c checkbox.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 80 }, { wch: 55 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
