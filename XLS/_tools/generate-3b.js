// ============================================================================
//  Generates: C:\us-tax\XLS\computations\3b.xlsx
//  Source-of-truth references:
//    - lines/3ab.md (shared spec covering BOTH 3a and 3b; §14 verification log added 3a #3)
//    - dependencies/3ab.md
//    - knowledge/line-3ab-dividend-income.md (renamed 2026-05-11 via 3a #2)
//    - TaxReturnComputeService.computeDividendIncome() lines ~4751-4894 (orchestrator)
//    - TaxReturnComputeService.computeDividendForPerson() lines ~4904-4970 (per-person aggregator)
//    - TaxReturnComputeService.buildForm8814() lines ~6355-6425 (Form 8814 line 9/10/12 split)
//    - IRS 2025 Form 1040 instructions: line 3b "Ordinary dividends"
//    - IRS 2025 Schedule B Part II instructions
//    - IRS 2025 Form 8814 instructions (child interest/dividends election)
//    - IRS 2025 Publication 550 (Investment Income and Expenses)
//    - PDF field: topmostSubform[0].Page1[0].f1_61[0] (line3b_ordinary_dividends)
//
//  Tax year: 2025
//
//  NOTE: Like 3a, line 3b shares the `computeDividendIncome` orchestrator AND the
//  `computeDividendForPerson` per-person aggregator. Most concerns are CROSS-REFERENCES to
//  earlier closures (especially 2a #1 MFS guard cascade and 3a #4-#7 breadcrumbs). The
//  3b-specific verifications focus on the line-3b-only invariants:
//   • Schedule B Part II $1,500 threshold + nominee trigger
//   • Nominee ordinary dividends subtraction (line 3b reduction)
//   • Section 199A box 5 > box 1a verification flag (per-person, non-blocking)
//   • Form 8814 child dividend 3-way split (line 9 → 3a/3b, line 10 → 7a, line 12 → Sched 1 8z)
//   • Legacy mode (useLegacyDividendComputation) backwards-compat path
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '3b.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 3b — ORDINARY DIVIDENDS'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 3b'],
  ['Concept', 'Total ordinary dividends received during the tax year. Sourced primarily from 1099-DIV box 1a, augmented by manual entries for amounts not on statements, reduced by nominee ordinary dividends that belong to another taxpayer, and supplemented by Form 8814 child qualified dividends (qualified amounts go to BOTH parent\'s 3a AND 3b — child non-qualified ordinary portion goes to Schedule 1 line 8z, not to 3b). Line 3b is INCLUDED in line 9 (total income).'],
  ['Core invariant', 'Line 3b ≥ 0 (zero-floor via subtractNonNegative). Line 3a ≤ Line 3b (qualified is a subset). Schedule B Part II line 6 = Line 3b (not 3a).'],
  ['Per-Person Formula', 'ordinary = Σ 1099-DIV box 1a + manualOrdinaryDividendsNotOnStatements\nperson.ordinaryDividends = subtractNonNegative(ordinary, nomineeOrdinaryDividends)\n// zero-floored: cannot go negative if nominee > ordinary'],
  ['Per-Return Formula', 'line3b = roundMoney( addNonNull(taxpayer.ordinaryDividends, spouse.ordinaryDividends) + form8814QualifiedDividendsTotal )\n// Form 8814 line 9 child QUALIFIED amounts are added to line 3b symmetrically with line 3a (preserves line 3a ≤ line 3b invariant).\n// Form 8814 line 12 NON-qualified ordinary + interest portions go to Schedule 1 line 8z, NOT line 3b.'],
  ['Filed', 'Direct entry on Form 1040 line 3b. PDF field: topmostSubform[0].Page1[0].f1_61[0] (semantic name: line3b_ordinary_dividends). Triggers line 3c checkbox `line3cChildDividendsInLine3b` when Form 8814 child amounts contribute. Schedule B Part II generated when line 3b > $1,500 OR nominee dividends present.'],
  ['Backend method', 'TaxReturnComputeService.computeDividendForPerson() lines ~4904-4970 (per-person aggregator with nominee subtraction).\nReturn-level aggregation + Form 8814 inclusion + Schedule B trigger in computeDividendIncome() lines ~4751-4894.\nCALLED FROM computeInterestIncome() — shares the MFS guard from 2a #1.'],
  ['Output', 'form1040.income.ordinaryDividends (BigDecimal; null when no contributions; ZERO when concept applies but sum is 0). Side-effects: scheduleB.line6TotalOrdinaryDividends = line 3b; scheduleB.dividendItems[] populated per-payer when Schedule B Part II required.'],
  ['IRS source', 'IRS 2025 Form 1040 instructions for line 3b; Schedule B Part II instructions; Pub. 550; 1099-DIV instructions box 1a; Form 8814 instructions (lines 6, 9, 12)'],
  [],
  ['STEP-BY-STEP COMPUTATION (per person, then aggregated)'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Per-person early-return if not having dividends (and not in legacy mode)', '`if (!useLegacyDividendComputation && !personHadDividend) return new DividendPersonTotals(null, ...);`\n\nGate at line 4906-4909. Legacy mode (useLegacyDividendComputation=true) bypasses to provide backwards-compat attribution of all 1099-DIV to taxpayer (see Code Validation #10).'],
  [2, 'Filter 1099-DIV entries by recipient SSN', 'belongsToPerson() at line 8210 (shared with interest-income path). MFS guard cascade from 2a #1 nulls spouseSsn on MFS, so spouse-attributed entries are rejected.'],
  [3, 'Per 1099-DIV: accumulate box 1a (ordinary) and add Schedule B Part II item', '`ordinaryFromStatements = addNonNull(ordinaryFromStatements, entry.box1a)` at line 4919.\nPer-entry payer name accumulated into scheduleBDividendItems at line 4923 (for Schedule B Part II detail).\nAddNonNull preserves null when no entries match.'],
  [4, 'Add manual ordinary amount (non-legacy mode only)', '`ordinary = addNonNull(ordinary, getAmount(dividendForm, "manualOrdinaryDividendsNotOnStatements"))`\n\nUser-entered on the dividend-income-{taxpayer,spouse} personal form. Catch-all for ordinary dividends without a 1099-DIV.'],
  [5, 'Read nominee ordinary dividends (non-legacy mode only)', '`nomineeOrdinary = getAmount(dividendForm, "nomineeOrdinaryDividends")` at line 4938.\nFlags `nomineeDividendsPresent = true` if either nominee-ordinary or nominee-qualified > 0 (or if the boolean `hasNomineeDividends` is true) — triggers Schedule B Part II.'],
  [6, 'Compute per-person line 3b with zero-floor', '`line3b_person = subtractNonNegative(ordinary, nomineeOrdinary)` at line 4952.\nZero-floor: when nominee > ordinary, result clamps to ZERO (rare but possible if user enters nominee amount exceeding the original 1099-DIV box 1a). Same helper as line 2a/2b zero-floor.\nNull-preservation: if `ordinary == null` (no contributions), returns null.'],
  [7, 'Return DividendPersonTotals with ordinaryDividends field', 'Constructor at line 4965 includes line3b_person in the per-person record. Same record holds line3a_person, pabDividends, scheduleBDividendItems, section199aTotal.'],
  [8, 'Aggregate to per-return value', '`line3b = addNonNull(taxpayer.ordinaryDividends(), spouse.ordinaryDividends())` at line 4783.\nMFS guard from 2a #1: dividendIncomeSpouse is nulled on MFS → spouse contribution null → aggregation stays taxpayer-only.'],
  [9, 'Add Form 8814 child qualified dividends (symmetric with 3a)', '`if (form8814QualifiedDividendsTotal > 0): line3b = addNonNull(line3b, form8814QualifiedDividendsTotal)` at line 4805.\nForm 8814 line 9 (child qualified dividends) is added to BOTH parent\'s line 3a AND line 3b. Symmetric addition preserves line 3a ≤ line 3b invariant.\n\n**Note**: Form 8814 line 12 (child NON-qualified ordinary + interest portion) goes to Schedule 1 line 8z via applyForm8814Line12ToSchedule1() at line 6427 — NOT to line 3b. This is IRS-correct per Form 8814 instructions.'],
  [10, 'Schedule B Part II trigger evaluation', '`scheduleBRequiredFromDividends = (line3b > $1,500) OR hasNomineeDividends` at lines 4831-4832.\nIf true, buildScheduleB() generates Schedule B with Part II per-payer detail items.\nschedule.line6TotalOrdinaryDividends = line3b (NOT line3a).'],
  [11, 'Section 199A box 5 verification flag (per-person, non-blocking)', 'If `taxpayer.section199aDividendsTotal() > taxpayer.ordinaryDividends()`: emit `SECTION199A_DIVIDENDS_EXCEED_ORDINARY_DIVIDENDS_TAXPAYER` (lines 4863-4870).\nSame check for spouse. Box 5 ⊆ box 1a per IRS rules; flag indicates issuer error or user mismatch.'],
  [12, 'Persist on form1040.income; trigger line 9 inclusion', '`income.setOrdinaryDividends(line3b)` [if non-null].\nLine 9 formula at TaxReturnComputeService.java:4141-4144 INCLUDES line 3b as the 3rd operand: `addNonNull(addNonNull(addNonNull(line1z, line2b), line3b), line4b)...` — line 3b contributes to total income / AGI / taxable income. (Verified at the 4-audit-citation breadcrumb from 3a #5.)'],
  [],
  ['MUTUAL EXCLUSION RULES (enforced by code or spec)'],
  ['Rule', 'Implementation', 'Why'],
  ['Line 3b is INCLUDED in line 9 (total income)', 'Line 9 formula at line 4141-4144 — line 3b is the 3rd operand. Multi-audit breadcrumb cites 1z #7 + 2a #7 + 2b #5 + 3a #5 (and now 3b #5).', 'IRC: ordinary dividends are gross income. Line 3a (qualified subset) is NOT separately added (already counted via line 3b).'],
  ['Line 3a ≤ Line 3b invariant — two-level cap', 'Per-person cap at computeDividendForPerson line 4922-4924 (silent). Return-level cap at computeDividendIncome line 4821-4828 (with flag). Authoritative breadcrumb from 3a #6.', 'IRS rule IRC §1(h)(11): qualified dividends are a strict subset of ordinary dividends. Adding both to line 9 would double-count.'],
  ['Schedule B Part II $1,500 trigger', '`scheduleBRequiredFromDividends = hasPositiveAmount(line3b) && line3b > $1,500` at line 4831.', 'IRS Schedule B Part II instructions: threshold $1,500.'],
  ['Schedule B Part II nominee trigger', '`scheduleBRequiredFromDividends ||= hasNomineeDividends` at line 4832.', 'IRS Schedule B Part II instructions: nominee dividends ALWAYS require Schedule B regardless of amount.'],
  ['Schedule B Part II line 6 = line 3b (NOT line 3a)', 'scheduleB.line6TotalOrdinaryDividends = line3b. Line 3a never appears on Schedule B.', 'IRS Schedule B Part II is for ORDINARY dividends only.'],
  ['Nominee ordinary dividends subtracted from line 3b (and added as negative Schedule B Part II item)', '`subtractNonNegative(ordinary, nomineeOrdinary)` at line 4952. Nominee appears on Schedule B Part II as a negative reduction.', 'IRS rule: nominee dividends belong to another taxpayer — must be subtracted with Schedule B disclosure.'],
  ['Form 8814 line 9 (child qualified) → BOTH 3a AND 3b', 'Lines 4802-4806: symmetric addition. Preserves line 3a ≤ line 3b invariant. Authoritative breadcrumb from 3a #7.', 'IRS Form 8814 instructions: child qualified portion contributes to BOTH the parent\'s qualified subset (3a) AND the ordinary total (3b).'],
  ['Form 8814 line 12 (child non-qualified ordinary + interest) → Schedule 1 line 8z (NOT 3b)', 'applyForm8814Line12ToSchedule1() at line 6427 routes line 12 to Schedule 1.', 'IRS Form 8814 instructions: the unallocated "other income" portion of child\'s net unearned income (interest + non-qualified ordinary dividends) is reported as a lump on Schedule 1 line 8z.'],
  ['Box 5 Section 199A dividends NOT added to line 3b', 'Box 5 is a SUBSET of box 1a (already in line 3b). Box 5 accumulated separately to `section199aTotal` at line 4921 — used only for verification flag and downstream QBI compute.', 'IRS QBI rules: box 5 amounts are already counted in box 1a. Adding box 5 separately would double-count for line 3b.'],
  ['Box 13 PAB dividends NOT added to line 3b', 'Box 13 is the AMT-PAB subset of box 12 (exempt-interest dividends → line 2a). Box 13 accumulated separately to `pabDividends` for Form 6251 line 2g (cross-reference to 2a #6 + 3a #8).', 'IRS Form 6251 line 2g treats AMT-preference PAB amounts separately. Box 13 is NOT a subset of box 1a/1b — lives on the line 2a/exempt-interest-dividend side.'],
  ['Box 2a capital gain distributions NOT added to line 3b', 'Box 2a routes to line 7a (capital gain) via Schedule D path.', 'IRS rule: capital gain distributions are capital gains, not dividends.'],
  ['Box 3 nondividend distributions NOT added to line 3b', 'Box 3 reduces stock basis. NOT income.', 'IRS rule: return of capital is not income until basis is recovered.'],
  [],
  ['DECISION TREE — what enters line 3b?'],
  ['Source', '1099 box (or personal form)', 'Sign', 'Notes'],
  ['1099-DIV', 'box 1a (total ordinary)', '+', 'Per-entry accumulation. Primary line 3b feed.'],
  ['1099-DIV', 'box 1b (qualified dividends)', '0 (NOT in line 3b directly)', 'Subset of box 1a — already counted via box 1a path. Tracked separately for line 3a.'],
  ['1099-DIV', 'box 5 (Section 199A)', '0 (verification only)', 'Subset of box 1a. Flag if box 5 > box 1a per person (issuer error).'],
  ['1099-DIV', 'box 12 (exempt-interest dividends)', '0', 'Routes to line 2a, NOT 3b.'],
  ['1099-DIV', 'box 13 (PAB dividends)', '0 (for line 3b)', 'Routes to Form 6251 line 2g (AMT path). Subset of box 12, NOT box 1a.'],
  ['1099-DIV', 'box 2a (capital gain distributions)', '0', 'Routes to line 7a capital gain path.'],
  ['1099-DIV', 'box 3 (nondividend / return of capital)', '0', 'Reduces stock basis. NOT income.'],
  ['Personal form', 'manualOrdinaryDividendsNotOnStatements', '+', 'Catch-all for ordinary dividends without a 1099-DIV.'],
  ['Personal form', 'nomineeOrdinaryDividends', '−', 'Belongs to another taxpayer (Schedule B Part II reduction).'],
  ['Form 8814 (child)', 'line 9 (child qualified dividends)', '+', 'Symmetric with line 3a — preserves the line 3a ≤ line 3b invariant. Sets line 3c checkbox `line3cChildDividendsInLine3b`.'],
  ['Form 8814 (child)', 'line 12 (child non-qualified ordinary + interest)', '0 (for line 3b)', '★ Routes to SCHEDULE 1 LINE 8z, NOT to line 3b. IRS Form 8814 instructions explicitly separate this from line 3b.'],
  ['Form 8814 (child)', 'line 1a (child taxable interest)', '0 (for line 3b)', 'Bundled with line 12 → Schedule 1 line 8z (non-allocated portion of child unearned income).'],
  ['Form 8814 (child)', 'line 1b (child tax-exempt interest)', '0', 'Bundled into Form 8814 line 4 then excluded after $2,700 base.'],
  ['Form 8814 (child)', 'line 10 (child cap gain distributions)', '0 (for line 3b)', 'Routes to parent\'s line 7a.'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 3b Flows'],
  ['Consumer', 'How', 'Notes'],
  ['Form 1040 line 9 (total income) — ★ PRIMARY DOWNSTREAM', 'Line 9 formula at line 4141-4144: `addNonNull(addNonNull(addNonNull(line1z, line2b), line3b), line4b)...` — line 3b is the 3rd operand.', '★ Critical: line 3b INCLUDES in total income. (Inverse of line 3a EXCLUSION.) Multi-audit breadcrumb cites 5 audit IDs after this 3b #5 closure.'],
  ['Form 1040 line 11a/11b (AGI), line 15 (taxable income)', 'Line 3b reaches AGI / taxable income via line 9.', 'Indirect; carries the full ordinary dividend amount.'],
  ['Schedule B Part II line 6 (Total ordinary dividends)', 'scheduleB.line6TotalOrdinaryDividends = line3b. Generated when line 3b > $1,500 OR nominee dividends present.', 'Per-payer detail items also populated from scheduleBDividendItems.'],
  ['Form 1040 line 3c checkbox `line3cChildDividendsInLine3b`', 'DividendComputation.line3cChildDividendsInLine3b set TRUE when form8814QualifiedDividendsTotal > 0 (line 4892).', 'Discloses to IRS that line 3b includes Form 8814 child amounts.'],
  ['Section 199A QBI deduction (line 13a)', 'Box 5 Section 199A dividends (subset of line 3b) feed line 13a Form 8995/8995-A computation.', 'Indirect; line 3b doesn\'t feed line 13a directly — box 5 is the QBI input.'],
  ['Form 8960 NIIT', '(out of scope)', 'Ordinary dividends contribute to NIIT investment income when MAGI exceeds threshold. Form 8960 NOT IMPLEMENTED.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 22 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 3b'],
  ['Sourced from C:\\us-tax\\XLS\\input_forms\\*.xlsx.'],
  [],
  ['#', 'Source xlsx', 'Field path / model key', 'Label / box', 'Required?', 'Role in line 3b compute', 'Cross-reference'],
  [],
  ['STATEMENT INPUTS — 1099-DIV'],
  [1, 'form-1099-div.xlsx', 'totalOrdinaryDividendsAmount (box 1a)', '1099-DIV box 1a "Total ordinary dividends"', 'YES — primary line 3b feed', 'Step 3: ordinaryFromStatements += entry.box1a', 'IRS 1099-DIV instructions box 1a'],
  [2, 'form-1099-div.xlsx', 'qualifiedDividendsAmount (box 1b)', '1099-DIV box 1b "Qualified dividends"', 'NO — for line 3a only', 'NOT a line 3b input directly. Subset of box 1a already counted.', 'See 3a.xlsx Inputs sheet'],
  [3, 'form-1099-div.xlsx', 'section199ADividendsAmount (box 5)', '1099-DIV box 5 "Section 199A dividends"', 'NO — verification flag only', 'Box 5 ⊆ box 1a. Step 11: per-person flag fires if box 5 > box 1a.', 'IRS QBI; lines 4863-4880'],
  [4, 'form-1099-div.xlsx', 'specifiedPrivateActivityBondDividendsAmount (box 13)', '1099-DIV box 13', 'NO — Form 6251 line 2g only', 'NOT a line 3b input (lives on box 12 / line 2a side).', '2a #6 + 3a #8'],
  [5, 'form-1099-div.xlsx', 'payerNameAddress', '1099-DIV payer name and address', 'YES — for Schedule B Part II detail', 'Step 3: per-payer item added to scheduleBDividendItems at line 4923.', 'IRS Schedule B Part II instructions'],
  [6, 'form-1099-div.xlsx', 'recipientTIN', 'Recipient TIN on the 1099-DIV', 'YES — for SSN attribution', 'belongsToPerson at line 8210. MFS guard nulls spouseSsn on MFS.', '2a Code Validation #1'],
  [],
  ['PERSONAL FORM INPUTS — dividend-income-taxpayer / -spouse'],
  [7, 'form-dividend-income-taxpayer.xlsx', 'screening.hadDividendIncome', 'Did you have dividend income?', 'YES (boolean gate)', 'Drives the statement-upload gating AND the per-person early-return at line 4906-4909.', 'YAML: 3ab-dividend-income-taxpayer.yaml'],
  [8, 'form-dividend-income-taxpayer.xlsx', 'supplementalDividendAmounts.manualOrdinaryDividendsNotOnStatements', 'Ordinary dividends not on statements', 'NO', 'Step 4: added to ordinary (line 3b). Catch-all.', 'computeDividendForPerson line 4935'],
  [9, 'form-dividend-income-taxpayer.xlsx', 'nomineeDividends.nomineeOrdinaryDividends', 'Ordinary dividends received as nominee', 'NO', 'Step 5: subtracted via subtractNonNegative at line 4952. Also flagged via nomineeDividendsPresent (Schedule B trigger).', 'computeDividendForPerson line 4938'],
  [10, 'form-dividend-income-taxpayer.xlsx', 'nomineeDividends.hasNomineeDividends', 'Boolean: nominee dividends present', 'NO', 'OR-trigger for Schedule B Part II (lines 4940-4942). Even without amounts, if user sets boolean=true the Schedule B is required.', 'computeDividendForPerson line 4940'],
  [],
  ['UPSTREAM — Form 8814 (child interest/dividends election)'],
  [11, 'form-child-interest-dividends.xlsx', 'childInterestDividendsEntries[].line2bQualifiedDividends', 'Child qualified dividends to include on parent return', 'NO (Form 8814 election)', '★ form8814QualifiedDividendsTotal = Σ Form 8814 line 9 across all children. Passed to computeDividendIncome at line 4760. Added to BOTH line 3a AND line 3b at line 4802-4806. Triggers line 3c checkbox.', 'IRS Form 8814 instructions; lines/3ab.md §5; 3a #7'],
  [12, 'form-child-interest-dividends.xlsx', 'childInterestDividendsEntries[].line2aOrdinaryDividends', 'Child total ordinary dividends (1099-DIV box 1a)', 'NO', '★ NOT directly added to line 3b. Used in Form 8814 line 4/6 computation. The NON-qualified portion ends up in Form 8814 line 12 → Schedule 1 line 8z (NOT line 3b). IRS-correct per Form 8814 instructions.', 'buildForm8814 lines 6355-6425'],
  [13, 'form-child-interest-dividends.xlsx', 'childInterestDividendsEntries[].line3CapGainDistributions', 'Child capital gain distributions', 'NO', 'NOT a line 3b input. Routes to parent\'s line 7a via Form 8814 line 10.', 'buildForm8814; line 7a path'],
  [],
  ['IDENTITY INPUTS'],
  [14, 'form-identification-taxpayer.xlsx', 'taxpayerIdentity.ssn', 'Taxpayer SSN', 'YES — drives 1099-DIV attribution', 'belongsToPerson at line 8210', 'Same as 2a/2b/3a'],
  [15, 'form-identification-spouse.xlsx', 'spouseIdentity.spouseSsn', 'Spouse SSN', 'YES on MFJ', 'Nulled on MFS via 2a #1 guard', '2a Code Validation #1; 3a #1'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 48 }, { wch: 65 }, { wch: 55 }, { wch: 30 }, { wch: 80 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data / Constants ──────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 3b'],
  ['Line 3b has TWO direct constants: the Schedule B Part II $1,500 threshold and the Form 8814 $2,700 base amount (indirect via Form 8814 line 6 routing).'],
  [],
  ['Constant', 'Value', 'Source', 'Used by line 3b?', 'Notes'],
  [],
  ['Direct — Schedule B Part II trigger'],
  ['SCHEDULE_B_DIVIDEND_THRESHOLD', '$1,500', 'Hard-coded inline at line 4831 (`new BigDecimal("1500")`)', 'YES (Schedule B trigger)', '`scheduleBRequiredFromDividends = line3b > $1,500 OR nomineeDividends`. Per IRS Schedule B Part II instructions.'],
  [],
  ['Indirect — Form 8814 child dividend $2,700 base amount'],
  ['FORM8814_BASE_AMOUNT', '$2,700', 'ReferenceData.FORM8814_BASE_AMOUNT', 'INDIRECT (Form 8814 line 9 path)', 'Form 8814 line 4 must EXCEED $2,700 for the line 9 (qualified) / line 10 (cap gain) / line 12 (other) split to occur. Below $2,700, no line 9 amount is generated → no contribution to parent\'s line 3b.'],
  ['FORM8814_UNTAXED_AMOUNT', '$1,350', 'ReferenceData.FORM8814_UNTAXED_AMOUNT', 'INDIRECT', 'First $1,350 of child unearned income is untaxed. Next $1,350 is taxed at 10% (Form 8814 line 14/15). Above $2,700 splits proportionally to qualified/cap gain/other (lines 9/10/12).'],
  ['FORM8814_GROSS_INCOME_LIMIT', '$13,500', 'ReferenceData.FORM8814_GROSS_INCOME_LIMIT', 'INDIRECT', 'Child gross income < $13,500 is required to use Form 8814. Above this threshold, child must file own return — no line 3b contribution from this child.'],
  [],
  ['Downstream — QDCG worksheet thresholds (apply at line 16, NOT line 3b)'],
  ['QDCG_0_PCT_SINGLE_2025', '$48,350', 'IRS QDCG worksheet 2025', 'NO (line 16)', 'Line 3b doesn\'t affect QDCG worksheet directly — line 3a does.'],
  ['QDCG_0_PCT_MFJ_2025', '$96,700', 'IRS QDCG worksheet 2025', 'NO (line 16)', 'MFJ / QSS threshold.'],
  [],
  ['Statutory references'],
  ['Ordinary dividend definition', 'IRC §61(a)(7); Pub. 550 "Ordinary dividends"', 'Distributions paid out of earnings and profits of a corporation. Includes both qualified and non-qualified dividends.'],
  ['Schedule B Part II $1,500 threshold', 'IRS 2025 Schedule B instructions', 'Schedule B Part II required when total ordinary dividends > $1,500 OR nominee dividends present.'],
  ['Nominee dividends', 'IRS Pub. 550 "Nominee distributions"; IRS Schedule B Part II instructions', 'When you receive a 1099-DIV for amounts that belong to another person, you must report the full amount on Schedule B then subtract the nominee portion below the subtotal (showing as a negative item).'],
  ['Form 8814 child dividend election', 'IRC §1(g); IRS Form 8814 instructions', 'Parent election to include child interest/dividends on parent return. Per IRS instructions:\n  • Line 9 (qualified portion) → parent line 3a AND line 3b.\n  • Line 10 (cap gain portion) → parent line 7a.\n  • Line 12 (other = interest + non-qualified ordinary portion) → Schedule 1 line 8z.'],
  ['Section 199A dividends (box 5)', 'IRC §199A; Form 8995/8995-A', 'Subset of box 1a; feeds QBI deduction line 13a. Box 5 > box 1a indicates issuer error (non-blocking flag).'],
  ['NIIT (out of scope)', 'IRC §1411; Form 8960', 'Ordinary dividends subject to 3.8% NIIT when MAGI exceeds threshold. Form 8960 not implemented.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 30 }, { wch: 65 }, { wch: 35 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 3b Triggers Multiple Downstream Effects'],
  ['Line 3b INCLUDES in line 9 (total income — primary effect). Plus triggers Schedule B Part II, line 3c checkbox, Section 199A flag, MISSING_DIVIDEND_STATEMENTS flag.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['Form 1040 line 3b (the cell itself)', 'TaxReturnComputeService.buildIncome() — income.setOrdinaryDividends(line3b)', '★ Persisted on form1040.income only when non-null. Whole-dollar HALF_UP rounding. Frontend renders via PDF field f1_61[0]. **INCLUDED in line 9.**'],
  ['Form 1040 line 3c checkbox `line3cChildDividendsInLine3b`', 'DividendComputation.line3cChildDividendsInLine3b set TRUE when form8814QualifiedDividendsTotal > 0 (line 4892).', 'Discloses to IRS that line 3b includes Form 8814 child amounts.'],
  ['Form 1040 line 9 (total income)', 'Line 9 formula at line 4141-4144 — line 3b is the 3rd operand.', '★ INCLUDED. Primary downstream effect. Carries to AGI, taxable income.'],
  ['Schedule B Part II (line 6 + per-payer items)', 'buildScheduleB() reads `scheduleBRequiredFromDividends` (line 4831-4832) and `scheduleBDividendItems` list. Sets scheduleB.line6TotalOrdinaryDividends = line3b.', 'Generated when line3b > $1,500 OR nominee dividends present. Line 3a does NOT appear on Schedule B.'],
  ['SECTION199A_DIVIDENDS_EXCEED_ORDINARY_DIVIDENDS_TAXPAYER/SPOUSE flag', 'Lines 4863-4880 — non-blocking. Fires per-person when box 5 > box 1a.', 'Verification flag for issuer error or user-entry mismatch.'],
  ['MISSING_DIVIDEND_STATEMENTS_TAXPAYER/SPOUSE flag', 'Lines 4847-4860 — non-blocking. Fires when hadDividendIncome=true but no 1099-DIV entries match recipientTIN to SSN.', 'Gap 4 closure from 2026-04-13. Warns user before they file (e.g., wrong SSN on uploaded 1099-DIV).'],
  ['Form 1040 line 11a/11b (AGI), line 15 (taxable income)', 'Indirect via line 9.', 'Carries the full ordinary dividend amount through the income waterfall.'],
  ['Form 8995/8995-A line 13a QBI deduction (via box 5)', '1099-DIV box 5 Section 199A dividends feed the QBI computation separately.', 'Box 5 is a subset of box 1a. Line 13a uses box 5 directly, not line 3b.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 8960 NIIT', '(out of scope)', 'Not implemented per CLAUDE.md.'],
];
const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 75 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 3b Participates in 5 Non-Blocking + 3 Blocking Flags'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['QUALIFIED_DIVIDENDS_LIMITED_TO_ORDINARY_DIVIDENDS', 'NON-BLOCKING', 'After all caps and Form 8814 inclusion, line 3a > line 3b → cap line 3a to line 3b. Inverse perspective: line 3b sets the ceiling for line 3a.', 'computeDividendIncome line 4821-4828'],
  ['SECTION199A_DIVIDENDS_EXCEED_ORDINARY_DIVIDENDS_TAXPAYER', 'NON-BLOCKING (verification)', 'Box 5 Section 199A dividends > Box 1a ordinary dividends for taxpayer (per-person check).', 'computeDividendIncome line 4863-4870'],
  ['SECTION199A_DIVIDENDS_EXCEED_ORDINARY_DIVIDENDS_SPOUSE', 'NON-BLOCKING (verification)', 'Same as above but for spouse.', 'computeDividendIncome line 4871-4880'],
  ['MISSING_DIVIDEND_STATEMENTS_TAXPAYER', 'NON-BLOCKING (warning)', 'Taxpayer indicated dividend income but NO 1099-DIV entries are attributed to taxpayer SSN (Gap 4 closure 2026-04-13).', 'computeDividendIncome line 4847-4853'],
  ['MISSING_DIVIDEND_STATEMENTS_SPOUSE', 'NON-BLOCKING (warning)', 'Same as above but for spouse.', 'computeDividendIncome line 4854-4860'],
  ['FORM8814_CHILD_GROSS_INCOME_TOO_HIGH', 'BLOCKING', 'Child gross income ≥ $13,500 → must file own return; Form 8814 unavailable.', 'buildForm8814 lines 6367-6373'],
  ['DIVIDEND_STATEMENT_UPLOAD_REQUIRED', 'BLOCKING', 'hadDividendIncome=true but hasUploadedAtLeastOne1099DivStatement≠true.', 'validateDividendStatementGating'],
  ['DIVIDEND_1099_DIV_UPLOAD_CONFIRMATION_REQUIRED', 'BLOCKING', 'confirmAllReceived1099DivUploaded≠true.', 'validateDividendStatementGating'],
  ['MISSING_UPLOADED_1099_DIV_DIVIDEND_WORKFLOW', 'BLOCKING', 'received1099Div=true but uploaded1099Div≠true.', 'validateDividendStatementGating'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 55 }, { wch: 28 }, { wch: 80 }, { wch: 65 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 3b shares the `computeDividendIncome` orchestrator AND the `computeDividendForPerson` per-person aggregator with line 3a. Many findings are CROSS-REFERENCES to earlier closures. 3b-specific verifications focus on: Schedule B Part II $1,500 + nominee trigger, nominee ordinary subtraction, Section 199A flag, Form 8814 3-way split, legacy mode. Verified 2026-05-11.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-11 — CROSS-REFERENCE — MFS GUARD ALREADY APPLIED VIA 2a #1 CASCADE (4th audit at site)', 'Line 3b is the 4th output protected by the 2a #1 cascade. Identical path to 3a #1: on MFS → `dividendIncomeSpouse=null` → `spouseHadDividend=false` → `DividendPersonTotals` early-return at line 4906-4909 → addNonNull aggregation at line 4782-4783 stays taxpayer-only. **Line 3b is the direct revenue-bearing line of the dividend pair** (line 3b IS in line 9; line 3a is a subset excluded from line 9), so MFS protection here is more impactful for the bottom-line tax computation than on line 3a. Closure: extended the MFS-guard breadcrumb at TaxReturnComputeService.java:4320-4335 from "2a #1 + 2b #1 + 3a #1" to also cite "3b.xlsx Code Validation #1, all verified 2026-05-11" — multi-audit-trail consolidation now FOUR audit IDs at this site. Added the line-3b/3a aggregation clause and the bottom-line-impact sentence. Lock-in test `mfsExcludesSpouseInterestFromLine2a` re-run passed.', 'TaxReturnComputeService.java:4320-4335 (extended 4-audit breadcrumb); test mfsExcludesSpouseInterestFromLine2a (re-run pass)', 'CLOSED via 2a #1 cascade — pure cross-reference verification.'],
  [2, 'RESOLVED 2026-05-11 — CROSS-REFERENCE — KNOWLEDGE FILE ALREADY RENAMED VIA 3a #2', '`knowledge/line-3ab-dividend-income.md` (renamed from `knowledge_line3ab_dividends.md` during 3a #2 earlier today) is a shared file covering BOTH lines 3a and 3b. YAML frontmatter `name:` already updated. Header-comment reference in this `generate-3b.js` already uses the new name (written after the rename). No other inbound references (grep verified during 3a #2). Pure xlsx-flip closure — same shape as 2b #3 (which closed via 2a #4), 2b #9/#10, 3a #8. Line 1c → 3ab naming convergence remains complete across 10 lines (1c, 1d, 1e, 1f, 1g, 1h, 1i, 1z, 2ab, 3ab).', 'C:\\us-tax\\knowledge\\line-3ab-dividend-income.md (already correctly named)', 'CLOSED via 3a #2 — pure xlsx-flip closure. No action needed for 3b walkthrough.'],
  [3, 'RESOLVED 2026-05-11 — SPEC §14 VERIFICATION LOG EXTENDED WITH 3b ROW', 'lines/3ab.md §14 verification log was added during 3a #3 closure earlier today with one inaugural in-progress row. Closure: (a) finalized the 3a row from "In progress" to "COMPLETE — 10/10 closed" with the full closure summary (4 cross-references + 3 verified-correct + 1 doc hygiene + 1 spec enhancement + 1 deferral); (b) appended a 2nd in-progress row capturing the 3b walkthrough as a separate event from 3a. Audit-trail-per-walkthrough convention preserved (matches 2b #2 which appended a 4th row to lines/2ab.md §12).', 'lines/3ab.md §14 (3a row finalized; 3b row added as 2nd row)', 'CLOSED — spec verification log updated. Two rows now present (3a complete + 3b in progress).'],
  [4, 'RESOLVED 2026-05-11 — CROSS-REFERENCE — 0-VS-NULL COMPLIANCE EXTENDS TO LINE 3b PATH', 'Verified the line-3b path through computeDividendForPerson is fully null-preserving end-to-end: ordinaryFromStatements (line 4912) → addNonNull (line 4919) → manual addNonNull (line 4935) → subtractNonNegative(ordinary, nomineeOrdinary) at line 4969. The early-return path at line 4906-4909 returns explicit nulls for all 4 BigDecimals. Closure: expanded the existing 3a #4 breadcrumb at TaxReturnComputeService.java:4974-4988 to (a) enumerate ALL 4 BigDecimal fields explicitly (qualifiedDividends, ordinaryDividends, disallowedQualifiedTotal, pabDividends, section199aTotal); (b) trace the line-3b path step-by-step; (c) cite both audit IDs (3a #4 + 3b #4, multi-audit-trail consolidation). Same shape as 2b #4 (which extended the 2a #5 breadcrumb to cover all 3 InterestPersonTotals fields).', 'TaxReturnComputeService.java:4974-4988 (extended breadcrumb with line-3b path trace + 4-field enumeration + multi-audit citation)', 'CLOSED — verified-correct cross-reference. Breadcrumb expanded; no code change.'],
  [5, 'RESOLVED 2026-05-11 — CROSS-REFERENCE — LINE 3b IS IN LINE 9 (INVERSE OF 3a #5; 5-AUDIT CONSOLIDATION)', 'Line 9 formula at TaxReturnComputeService.java:4145-4148: `addNonNull(addNonNull(addNonNull(line1z, line2b), line3b), line4b)...` — line 3b is the 3rd operand, INTENTIONALLY INCLUDED per IRC §61(a)(7) (ordinary dividends as gross income). Inverse confirmation of 3a #5 (line 3a EXCLUDED as subset of line 3b — double-count prevention). Closure: extended the line-9 breadcrumb at TaxReturnComputeService.java:4134-4145 from citing 4 audit IDs to **5 audit IDs** (1z #7 + 2a #7 + 2b #5 + 3a #5 + 3b #5). Added an "**Inverse-confirmation pattern now applied symmetrically across both income pairs**" sentence — interest side (2a EXCLUDED / 2b INCLUDED) and dividend side (3a EXCLUDED / 3b INCLUDED). Lock-in test `line9EqualsLine1zPlusOtherIncomeLines` re-run passed.', 'TaxReturnComputeService.java:4134-4145 (extended 5-audit breadcrumb); test line9EqualsLine1zPlusOtherIncomeLines (re-run pass)', 'CLOSED — verified-correct cross-reference. 5-audit consolidation at the line-9 formula site.'],
  [6, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — SCHEDULE B PART II $1,500 THRESHOLD + NOMINEE TRIGGER', 'Schedule B Part II trigger correctly implements the two-pronged IRS rule: `(line3b > $1,500) OR hasNomineeDividends` at TaxReturnComputeService.java:4843-4845. The nominee branch reads each spouse\'s nomineeDividendsPresent() flag — itself derived per-person at lines 4940-4942 from `(nomineeOrdinary > 0) OR (nomineeQualified > 0) OR (hasNomineeDividends boolean=true)`. Closure: 12-line breadcrumb above the trigger (lines 4830-4842) documenting (a) two-pronged trigger + IRS 2025 Schedule B instructions; (b) nominee always required regardless of amount (Part II is where nominee subtraction is disclosed); (c) $1,500 threshold-not-in-ReferenceData rationale (stable IRS rule, not annually-indexed, consistent with interest-side $1,500 threshold at line ~4485); (d) per-person nominee flag derivation. Both lock-in tests `computesDividendIncomeAndRequiresScheduleBForNomineeAndThreshold` and `computesDividendIncomeWithoutScheduleBWhenBelowThresholdAndNoNominee` re-run passed.', 'TaxReturnComputeService.java:4830-4842 (12-line breadcrumb); tests positive + negative Schedule B trigger (both re-run pass)', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [7, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — NOMINEE ORDINARY DIVIDENDS SUBTRACTION (3 PROTECTIONS IN ONE LINE)', 'Nominee ordinary dividends subtracted from per-person line 3b at computeDividendForPerson line 4986 (`BigDecimal line3b = subtractNonNegative(ordinary, nomineeOrdinary)`). **Three protections in one line**: (1) PER-PERSON subtraction before aggregation (correct spouse attribution); (2) ZERO-FLOOR via subtractNonNegative — clamps to ZERO if nomineeOrdinary > ordinary (same helper as line 2a/2b zero-floor, 2b #7); (3) NULL preservation — subtractNonNegative(null, x) returns null per helper at line ~17441-17443 (3a #4). Downstream: nominee dividends appear as a NEGATIVE reduction item on Schedule B Part II detail per Pub. 550 nominee distribution rules (full amount above subtotal, nominee subtracted below). Schedule B line 6 = NET line 3b. Closure: 15-line breadcrumb above the subtraction site enumerating all 3 protections + IRS source + Schedule B negative-item reporting downstream. Lock-in test `computesDividendIncomeAndRequiresScheduleBForNomineeAndThreshold` re-run passed.', 'TaxReturnComputeService.java:4986 (nominee subtraction site); 15-line breadcrumb at lines 4969-4985', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [8, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — FORM 8814 CHILD DIVIDEND 3-WAY SPLIT', 'Form 8814 child net unearned income (above $2,700 base) is allocated to THREE Form 1040 destinations per IRS instructions: (a) **line 9** (qualified portion) → parent\'s line 3a AND line 3b (this code site); (b) **line 10** (cap-gain portion) → parent\'s line 7a; (c) **line 12** (UNALLOCATED interest + non-qualified ordinary remainder) → Schedule 1 line 8z via applyForm8814Line12ToSchedule1() at line ~6427 → line 8 → line 9. CRITICAL line-3b invariant: child\'s NON-QUALIFIED ordinary portion is NOT directly added to parent\'s line 3b — it routes via line 12 → Schedule 1 line 8z to avoid double-counting. Closure: extended the existing 15-line 3a #7 breadcrumb to a 25-line breadcrumb documenting the FULL 3-way split (was previously only documenting line 9 → 3a+3b). Cited 3a #7 + 3b #8 (multi-audit consolidation). All 20 form8814* tests pass.', 'TaxReturnComputeService.java:4792-4819 (25-line breadcrumb extended); 20 form8814* tests pass', 'CLOSED — verified correct. Single authoritative breadcrumb documenting all three destinations.'],
  [9, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — SECTION 199A BOX 5 > BOX 1a VERIFICATION FLAG', 'Per IRS rules: box 5 Section 199A dividends are a SUBSET of box 1a ordinary dividends (Section 199A is the QBI-eligible subset feeding line 13a via Form 8995/8995-A). If box 5 > box 1a per person, indicates issuer error or user-entry mismatch. Verified 3 correct design choices: (a) PER-PERSON check (each spouse vs their own ordinary — prevents false positives when QBI/non-QBI split differs between spouses); (b) NULL-SAFE comparisons (canonical 0-vs-null compliance); (c) NON-BLOCKING severity (doesn\'t silent-cap box 5 to box 1a which would corrupt user data; user can override after investigating with issuer). Closure: 11-line breadcrumb above the flag emission (lines 4894-4905) documenting the subset relationship + 3 design choices + IRS source + lock-in test reference. Lock-in test `section199aDividendsExceedingOrdinaryDividendsEmitsNonBlockingFlag` re-run passed.', 'TaxReturnComputeService.java:4894-4905 (11-line breadcrumb above Gap 8 flag emission); test section199aDividendsExceedingOrdinaryDividendsEmitsNonBlockingFlag (re-run pass)', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [10, 'RESOLVED 2026-05-11 — OBSERVATION — LEGACY MODE BACKWARDS-COMPAT PATH DOCUMENTED', '`useLegacyDividendComputation` is a backwards-compat boolean for users / test fixtures that pre-date the dividend-income personal form. Closure: 11-line breadcrumb above the legacy-mode gate (line 4948) documenting (a) what triggers it (no dividend-income personal form saved); (b) what it bypasses (early-return gate, manual amounts, nominee subtraction, 5-field disallowed-qualified categories, Gap 4 MISSING_DIVIDEND_STATEMENTS warning); (c) migration path (saving the personal form switches to modern mode); (d) why we keep it (backwards-compat for legacy DB snapshots / test fixtures). Lock-in test `legacyDividendComputationWithNoPersonalFormsProducesLine3b` re-run passed. No code change. No outstanding.md entry — pre-launch removal of legacy mode is a separate cleanup conversation, not a deferred enhancement.', 'TaxReturnComputeService.java:4948 (legacy-mode gate); 11-line breadcrumb at lines 4948-4958; test legacyDividendComputationWithNoPersonalFormsProducesLine3b (re-run pass)', 'CLOSED — verified-correct backwards-compat design. Breadcrumb-only closure.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 30 }, { wch: 95 }, { wch: 65 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 3b Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.ordinaryDividends', 'topmostSubform[0].Page1[0].f1_61[0] (line3b_ordinary_dividends)', 'form-tax-return-1040.xlsx (line 3b cell)', '★ Primary output. Stored only when non-null. Whole-dollar HALF_UP rounded.'],
  ['form1040.income.line3cChildDividendsInLine3b', 'topmostSubform[0].Page1[0].c1_34[0] (line3c_child_dividends_included_in_line3b)', 'form-tax-return-1040.xlsx (line 3c checkbox)', 'TRUE when Form 8814 child qualified dividends contribute to line 3b.'],
  [],
  ['PRIMARY DOWNSTREAM (★)'],
  ['Form 1040 line 9 (total income)', '—', 'form-tax-return-1040.xlsx (line 9 cell)', '★ INCLUDED as 3rd operand. Carries to line 11a/11b AGI, line 15 taxable income.'],
  ['Schedule B Part II line 6 (Total ordinary dividends)', '—', 'form-tax-return-scheduleb.xlsx', 'Generated when line 3b > $1,500 OR nominee dividends present. Per-payer detail items from scheduleBDividendItems.'],
  [],
  ['INDIRECT / VERIFICATION DOWNSTREAM'],
  ['SECTION199A_DIVIDENDS_EXCEED_ORDINARY_DIVIDENDS_{TAXPAYER,SPOUSE}', '—', '(non-blocking flag)', 'Per-person verification flag when box 5 > box 1a.'],
  ['MISSING_DIVIDEND_STATEMENTS_{TAXPAYER,SPOUSE}', '—', '(non-blocking flag)', 'Per-person warning when hadDividendIncome=true but no 1099-DIV matches SSN.'],
  ['Form 1040 line 11a/11b (AGI), line 15 (taxable income)', '—', 'form-tax-return-1040.xlsx', 'Indirect via line 9 contribution.'],
  ['Line 13a QBI deduction (via box 5)', '—', 'form-tax-return-8995/8995a.xlsx', 'Box 5 Section 199A dividends feed line 13a separately (subset of line 3b).'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Schedule B Part II line 6 does NOT use line 3a', '—', 'form-tax-return-scheduleb.xlsx', 'Schedule B Part II is for ORDINARY dividends only.'],
  ['Form 8960 NIIT', '—', '(out of scope)', 'Not implemented.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 65 }, { wch: 50 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
