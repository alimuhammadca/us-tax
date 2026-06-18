// ============================================================================
//  Generates: C:\us-tax\XLS\computations\3a.xlsx
//  Source-of-truth references:
//    - lines/3ab.md (covers BOTH 3a and 3b)
//    - dependencies/3ab.md
//    - knowledge/line-3ab-dividend-income.md (renamed 2026-05-11 via 3a #2 — was knowledge_line3ab_dividends.md)
//    - TaxReturnComputeService.computeDividendIncome() lines ~4743-4858 (orchestrator)
//    - TaxReturnComputeService.computeDividendForPerson() lines ~4860-4922 (per-person aggregator)
//    - ReferenceData.java — no line-3a-specific constants (QDCG rate thresholds belong to line 16)
//    - IRS 2025 Form 1040 instructions (i1040gi_2025.pdf): line 3a "Qualified dividends"
//    - IRS 2025 Schedule B instructions (i1040sb)
//    - IRS 2025 Publication 550 (Investment Income and Expenses) — qualified-dividend rules
//    - PDF field: topmostSubform[0].Page1[0].f1_60[0] (line3a_qualified_dividends)
//
//  Tax year: 2025
//
//  NOTE: Like line 2b, many findings in this audit are CROSS-REFERENCES to upstream closures
//  (especially 2a #1 MFS guard, which protects lines 2a + 2b + 3a + 3b + Form 6251 line 2g +
//  Schedule B Parts I/II via one orchestrator-level guard). The 3a-specific verifications
//  focus on the qualified-dividend invariants: 3a ≤ 3b cap, Form 8814 child inclusion,
//  5 disallowed-qualified-dividend categories, foreign-corporation rule.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '3a.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 3a — QUALIFIED DIVIDENDS'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 3a'],
  ['Concept', 'Qualified-dividend subset of line 3b (ordinary dividends). Sourced from 1099-DIV box 1b reduced by 5 IRS-defined disallowed-qualified-dividend categories. **Line 3a does NOT separately enter line 9** — it is a subset of line 3b which IS in line 9 (double-count prevented). Line 3a affects the TAX COMPUTATION METHOD: when present, regular tax is computed via the QDCG Worksheet or Schedule D Tax Worksheet at line 16, applying the preferential 0%/15%/20% qualified-dividend rates instead of ordinary brackets.'],
  ['Core invariant', '0 ≤ Line 3a ≤ Line 3b (enforced at line ~4784 with non-blocking QUALIFIED_DIVIDENDS_LIMITED_TO_ORDINARY_DIVIDENDS flag when cap fires)'],
  ['Per-Person Formula', 'candidateQualified = Σ 1099-DIV box 1b + manualQualifiedDividendsNotOnStatements\ndisallowedQualifiedTotal =\n  + nomineeQualifiedDividends\n  + nonQualifiedFromHoldingPeriodCommon61of121\n  + nonQualifiedFromHoldingPeriodPreferred91of181\n  + nonQualifiedFromRelatedPaymentObligationShortSale\n  + nonQualifiedPaymentsInLieu\n  + nonQualifiedSurrogateForeignCorporationDividends\n\nperson.qualifiedDividends = subtractNonNegative(candidateQualified, disallowedQualifiedTotal)\nperson.qualifiedDividends = min(person.qualifiedDividends, person.ordinaryDividends)  // per-person cap'],
  ['Per-Return Formula', 'line3a = roundMoney( addNonNull(taxpayer.qualifiedDividends, spouse.qualifiedDividends) )\n+ form8814QualifiedDividendsTotal  // child qualified dividends per Form 8814 line 9\n// Cap: line3a = min(line3a, line3b) — return-level cap, with non-blocking flag if it fires.'],
  ['Filed', 'Direct entry on Form 1040 line 3a. PDF field: topmostSubform[0].Page1[0].f1_60[0] (semantic name: line3a_qualified_dividends). Triggers line 3c checkbox `line3cChildDividendsInLine3a` when Form 8814 child amounts contribute.'],
  ['Backend method', 'TaxReturnComputeService.computeDividendForPerson() at lines ~4860-4922 (per-person aggregator).\nReturn-level aggregation + Form 8814 inclusion + cap in computeDividendIncome() lines ~4743-4858.\nCALLED FROM computeInterestIncome() — shares the MFS guard from 2a #1.'],
  ['Output', 'form1040.income.qualifiedDividends (BigDecimal; null when no qualified contributions; ZERO when concept applies but sum is 0). Cap-flag side-effect: scheduleB.line6TotalOrdinaryDividends = line3b (NOT line3a).'],
  ['IRS source', 'IRS 2025 Form 1040 instructions for line 3a; Schedule B Part II instructions; Pub. 550 ("Qualified dividends"); 1099-DIV instructions box 1b'],
  [],
  ['STEP-BY-STEP COMPUTATION (per person, then aggregated)'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Per-person early-return if not having dividends (and not in legacy mode)', '`if (!useLegacyDividendComputation && !personHadDividend) return new DividendPersonTotals(null, null, false, null, null, new ArrayList<>(), null);`\n\nGate at line 4870-4872. Legacy mode (useLegacyDividendComputation=true) bypasses this gate to provide backwards-compat attribution of all 1099-DIV to taxpayer.'],
  [2, 'Filter 1099-DIV entries by recipient SSN', 'belongsToPerson() at line 8210 (shared with interest-income path). MFS guard cascade from 2a #1 nulls spouseSsn on MFS, so spouse-attributed entries are rejected.'],
  [3, 'Per 1099-DIV: accumulate box 1a (ordinary), box 1b (qualified), box 13 (PAB), box 5 (199A)', 'Per-entry reads at lines 4883-4887:\n  ordinaryFromStatements += box1a (totalOrdinaryDividendsAmount)\n  qualifiedFromStatements += box1b (qualifiedDividendsAmount)\n  pabDividends += box13 (specifiedPrivateActivityBondDividendsAmount) — for AMT path\n  section199aTotal += box5 (section199ADividendsAmount) — for verification flag\n\nAddNonNull pattern preserves null when no entries match. Schedule B item added per-payer at line 4888.'],
  [4, 'Add manual amounts (non-legacy mode only)', 'ordinary += manualOrdinaryDividendsNotOnStatements\ncandidateQualified += manualQualifiedDividendsNotOnStatements\n\nUser-entered on the dividend-income-{taxpayer,spouse} personal form. Catch-all for dividends without a 1099-DIV.'],
  [5, 'Read 5 disallowed-qualified-category amounts (non-legacy mode only)', 'disallowedQualifiedTotal += sum of:\n  • nomineeQualifiedDividends (also subtracted from ordinary at Step 7)\n  • nonQualifiedFromHoldingPeriodCommon61of121 (failed 61/121 days rule)\n  • nonQualifiedFromHoldingPeriodPreferred91of181 (failed 91/181 days rule for preferred stock)\n  • nonQualifiedFromRelatedPaymentObligationShortSale (related-payment obligations)\n  • nonQualifiedPaymentsInLieu (payments-in-lieu of dividends)\n  • nonQualifiedSurrogateForeignCorporationDividends (disallowed surrogate foreign corps)\n\nAll five are user-entered (no automatic broker-history inference). See Code Validation #9.'],
  [6, 'Compute per-person ordinary (line 3b path)', 'line3b_person = subtractNonNegative(ordinary, nomineeOrdinaryDividends)\n\nNote: nominee ordinary appears on BOTH line 3b reduction AND Schedule B Part II negative item.'],
  [7, 'Compute per-person qualified (line 3a path)', 'line3a_person = subtractNonNegative(candidateQualified, disallowedQualifiedTotal)'],
  [8, 'Per-person cap: line3a ≤ line3b', 'if (line3a_person > line3b_person) line3a_person = line3b_person\n\nFirst-level invariant enforcement (line 4918-4920 in computeDividendForPerson).'],
  [9, 'Aggregate to per-return value', 'line3a = addNonNull(taxpayer.qualifiedDividends, spouse.qualifiedDividends)\nline3b = addNonNull(taxpayer.ordinaryDividends, spouse.ordinaryDividends)\n\nMFS guard from 2a #1: dividendIncomeSpouse is nulled on MFS → spouse contribution null.'],
  [10, 'Add Form 8814 child qualified dividends to BOTH 3a and 3b', 'if (form8814QualifiedDividendsTotal > 0):\n  line3a += form8814QualifiedDividendsTotal\n  line3b += form8814QualifiedDividendsTotal\n\nPer IRS Form 8814 instructions: child qualified dividends MUST be added to parent\'s line 3a AND line 3b (not just one). Sets line 3c checkbox `line3cChildDividendsInLine3a`.'],
  [11, 'Return-level cap: line3a ≤ line3b', 'if (line3a > line3b):\n  line3a = line3b\n  emit non-blocking flag QUALIFIED_DIVIDENDS_LIMITED_TO_ORDINARY_DIVIDENDS\n\nSecond-level invariant enforcement (line 4784-4792). Catches edge cases where per-person caps individually pass but aggregation produces line3a > line3b (rare; typically when one spouse has high qualified amounts that don\'t fit the other spouse\'s ordinary).'],
  [12, 'Persist on form1040.income; trigger Schedule B + QDCG downstream', 'income.setQualifiedDividends(line3a) [if non-null]\nincome.setOrdinaryDividends(line3b) [if non-null]\n\nSchedule B Part II generated when line3b > $1,500 OR nominee dividends present (line 4795-4796).\nLine 3a does NOT separately add to line 9 (it is a subset of line 3b which IS in line 9).\nLine 3a triggers QDCG Worksheet or Schedule D Tax Worksheet at computeLine16 for tax computation.'],
  [],
  ['MUTUAL EXCLUSION RULES (enforced by code or spec)'],
  ['Rule', 'Implementation', 'Why'],
  ['Line 3a is a SUBSET of line 3b (not separately added to line 9)', 'Line 9 formula at line 4134 reads `addNonNull(addNonNull(line1z, line2b), line3b)...` — line 3a absent. Line 3a is reported on Form 1040 for informational + tax-rate purposes only.', 'IRS rule: qualified dividends are PART OF ordinary dividends. Adding both would double-count.'],
  ['Line 3a ≤ Line 3b enforced TWICE (per-person + return-level)', 'Per-person cap at line 4918-4920. Return-level cap + flag at line 4784-4792.', 'Defense-in-depth: per-person cap prevents one spouse from exceeding own ordinary; return-level cap catches edge cases after aggregation + Form 8814 inclusion.'],
  ['Form 8814 child qualified dividends added to BOTH 3a AND 3b', 'Line 4779-4782: `if (hasChildQualifiedDividends) { line3a += form8814QualifiedDividendsTotal; line3b += form8814QualifiedDividendsTotal; }`. Sets line 3c checkbox.', 'Per IRS Form 8814 instructions: child qualified dividends elected on parent\'s return increase BOTH ordinary AND qualified-dividend totals.'],
  ['Schedule B trigger from dividends', 'Line 4795-4796: `line3b > $1,500 OR nomineeDividendsPresent`. Triggers buildScheduleB() with Part II per-payer detail.', 'IRS Schedule B Part II instructions: $1,500 threshold OR nominee dividend reporting.'],
  ['PAB dividends (box 13) feed Form 6251 line 2g, NOT line 3a', '`pabDividends += box13` at line 4886; aggregated to `form6251Line2gDividends` at line 4798; added to total form6251Line2g at line 4397.', 'IRS Form 6251 line 2g treats AMT-preference PAB amounts separately. Box 13 is a SUBSET of box 12 (exempt-interest dividends, line 2a) AND a SUBSET of box 1a (ordinary, line 3b). Already covered by 2a #6 / Gap 4 fix 2026-04-13.'],
  ['Section 199A dividends (box 5) — verification only', 'Lines 4828-4845: emit non-blocking flag SECTION199A_DIVIDENDS_EXCEED_ORDINARY_DIVIDENDS_{TAXPAYER,SPOUSE} when box 5 > box 1a per person.', 'Box 5 is the QBI-deduction subset of box 1a ordinary dividends. By IRS rules, box 5 ⊆ box 1a. Flag catches issuer error or user-entered mismatch.'],
  ['Per-person early-return when person.hadDividend=false (non-legacy mode)', 'Line 4870-4872: returns empty DividendPersonTotals.', 'Avoids processing 1099-DIV entries when a person hasn\'t opted into the dividend workflow. MFS guard cascade also nulls dividendIncomeSpouse on MFS → spouseHadDividend=false → spouse early-return.'],
  [],
  ['DECISION TREE — what enters line 3a?'],
  ['Source', '1099 box (or personal form)', 'Sign', 'Notes'],
  ['1099-DIV', 'box 1b (qualified dividends)', '+', 'Per-entry, then aggregated.'],
  ['1099-DIV', 'box 1a (total ordinary)', '0 (NOT in line 3a — line 3b only)', 'Box 1a ⊇ box 1b. Line 3a uses box 1b specifically.'],
  ['1099-DIV', 'box 5 (Section 199A)', '0 (verification only)', 'Box 5 ⊆ box 1a; doesn\'t change line 3a/3b. Flag if 199A > ordinary.'],
  ['1099-DIV', 'box 12 (exempt-interest dividends)', '0', 'Routes to line 2a, NOT 3a/3b.'],
  ['1099-DIV', 'box 13 (PAB dividends)', '0 (for line 3a)', 'Routes to Form 6251 line 2g (AMT path). Subset of box 12, NOT box 1b.'],
  ['1099-DIV', 'box 2a (capital gain distributions)', '0', 'Routes to line 7a capital gain path, NOT 3a/3b.'],
  ['1099-DIV', 'box 3 (nondividend / return of capital)', '0', 'Reduces stock basis. NOT income.'],
  ['Personal form', 'manualQualifiedDividendsNotOnStatements', '+', 'Catch-all for qualified dividends without a 1099.'],
  ['Personal form', 'nomineeQualifiedDividends', '−', 'Belongs to another taxpayer (Schedule B Part II reduction).'],
  ['Personal form', 'nonQualifiedFromHoldingPeriodCommon61of121', '−', 'Failed common-stock 61-day holding period.'],
  ['Personal form', 'nonQualifiedFromHoldingPeriodPreferred91of181', '−', 'Failed preferred-stock 91-day holding period (when dividend period > 366 days).'],
  ['Personal form', 'nonQualifiedFromRelatedPaymentObligationShortSale', '−', 'Related-payment obligations including short sales.'],
  ['Personal form', 'nonQualifiedPaymentsInLieu', '−', 'Payments-in-lieu when known/should-know not qualified.'],
  ['Personal form', 'nonQualifiedSurrogateForeignCorporationDividends', '−', 'Disallowed surrogate foreign corporation dividends.'],
  ['Form 8814 (child)', 'line 9 (child qualified dividends)', '+ (to BOTH 3a AND 3b)', 'Parent\'s election to report child interest/dividends. Sets line 3c checkbox.'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 3a Flows'],
  ['Consumer', 'How', 'Notes'],
  ['(NOT line 9 directly)', 'Line 3a is absent from the line 9 formula at line 4134. Line 3b carries the dividend income (since 3a is a subset).', '★ Critical: avoiding double-count.'],
  ['Line 16 — tax computation method selection', 'When line3a > 0 AND no Schedule D qualified dividends/cap gains → QDCG Worksheet. When Schedule D has qualified amounts → Schedule D Tax Worksheet. Both apply 0%/15%/20% qualified-dividend rates.', '★ Most important downstream impact. Line 3a triggers preferential rates.'],
  ['Form 1040 line 3c checkbox `line3cChildDividendsInLine3a`', 'DividendComputation field set to TRUE when Form 8814 child qualified dividends contribute.', 'Discloses to IRS that line 3a includes child amounts.'],
  ['Schedule B Part II line 6', 'scheduleB.line6TotalOrdinaryDividends = line3b (NOT line3a)', 'Schedule B Part II reports ORDINARY dividends only. Line 3a is informational on Form 1040 itself.'],
  ['Form 8960 (Net Investment Income Tax)', 'Line 3a contributes to NIIT investment income when MAGI exceeds threshold.', 'Form 8960 NOT IMPLEMENTED (out of scope per spec §6.2).'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 22 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 3a'],
  ['Sourced from C:\\us-tax\\XLS\\input_forms\\*.xlsx.'],
  [],
  ['#', 'Source xlsx', 'Field path / model key', 'Label / box', 'Required?', 'Role in line 3a compute', 'Cross-reference'],
  [],
  ['STATEMENT INPUTS — 1099-DIV'],
  [1, 'form-1099-div.xlsx', 'qualifiedDividendsAmount (box 1b)', '1099-DIV box 1b "Qualified dividends"', 'YES — primary line 3a feed', 'Step 3: candidateQualified += entry.box1b', 'IRS 1099-DIV instructions box 1b'],
  [2, 'form-1099-div.xlsx', 'totalOrdinaryDividendsAmount (box 1a)', '1099-DIV box 1a "Total ordinary dividends"', 'YES for line 3b (cap reference)', 'Step 3: ordinaryFromStatements += entry.box1a. Used at line 4918-4920 for per-person cap (line3a ≤ line3b).', 'IRS 1099-DIV instructions box 1a'],
  [3, 'form-1099-div.xlsx', 'specifiedPrivateActivityBondDividendsAmount (box 13)', '1099-DIV box 13 "Specified private activity bond interest dividends"', 'NO — feeds Form 6251 line 2g only', 'NOT a line 3a input. Step 3 accumulates for AMT path; flows to Form 6251 line 2g via DividendComputation.form6251Line2gDividends.', '2a Code Validation #6 (cascade from 2026-04-13 fix)'],
  [4, 'form-1099-div.xlsx', 'section199ADividendsAmount (box 5)', '1099-DIV box 5 "Section 199A dividends"', 'NO — verification flag only', 'Subset of box 1a. Step 3 accumulates for the section199aTotal verification. Flag SECTION199A_DIVIDENDS_EXCEED_ORDINARY_DIVIDENDS fires if box 5 > box 1a per person (lines 4828-4845).', 'IRS QBI deduction; not line-3a math'],
  [5, 'form-1099-div.xlsx', 'recipientTIN', 'Recipient TIN on the 1099-DIV', 'YES — for SSN attribution', 'belongsToPerson at line 8210 (shared with interest path). MFS guard from 2a #1 nulls spouseSsn on MFS.', '2a Code Validation #1'],
  [],
  ['PERSONAL FORM INPUTS — dividend-income-taxpayer / -spouse'],
  [6, 'form-dividend-income-taxpayer.xlsx', 'screening.hadDividendIncome', 'Did you have dividend income?', 'YES (boolean gate)', 'Drives the statement-upload gating AND the per-person early-return at line 4870-4872. When false (non-legacy mode), the person\'s DividendPersonTotals returns empty.', 'YAML: 3ab-dividend-income-taxpayer.yaml'],
  [7, 'form-dividend-income-taxpayer.xlsx', 'supplementalDividendAmounts.manualQualifiedDividendsNotOnStatements', 'Qualified dividends not on statements', 'NO', 'Step 4: added to candidateQualified. Catch-all.', 'computeDividendForPerson line 4900'],
  [8, 'form-dividend-income-taxpayer.xlsx', 'supplementalDividendAmounts.manualOrdinaryDividendsNotOnStatements', 'Ordinary dividends not on statements', 'NO', 'Step 4: added to ordinary (line 3b). Reference field for the per-person cap (line 3a ≤ line 3b).', 'computeDividendForPerson line 4899'],
  [9, 'form-dividend-income-taxpayer.xlsx', 'nomineeDividends.nomineeQualifiedDividends', 'Qualified dividends received as nominee', 'NO', 'Step 5: added to disallowedQualifiedTotal. Removed from line 3a.', 'computeDividendForPerson line 4908'],
  [10, 'form-dividend-income-taxpayer.xlsx', 'nomineeDividends.nomineeOrdinaryDividends', 'Ordinary dividends received as nominee', 'NO', 'Step 6: subtracted from ordinary (line 3b reduction).', 'computeDividendForPerson line 4902'],
  [],
  ['PERSONAL FORM INPUTS — 5 disallowed-qualified-category fields'],
  [11, 'form-dividend-income-taxpayer.xlsx', 'disallowedQualified.nonQualifiedFromHoldingPeriodCommon61of121', 'Failed common-stock 61-of-121 holding period', 'NO', 'Step 5: added to disallowedQualifiedTotal.', 'IRC §1(h)(11)(B); IRS Pub. 550 "Qualified dividends" / holding period'],
  [12, 'form-dividend-income-taxpayer.xlsx', 'disallowedQualified.nonQualifiedFromHoldingPeriodPreferred91of181', 'Failed preferred-stock 91-of-181 holding period (long dividend period > 366 days)', 'NO', 'Step 5: added to disallowedQualifiedTotal.', 'Same IRC + Pub. 550'],
  [13, 'form-dividend-income-taxpayer.xlsx', 'disallowedQualified.nonQualifiedFromRelatedPaymentObligationShortSale', 'Related-payment obligation / short sale', 'NO', 'Step 5: added to disallowedQualifiedTotal.', 'IRC §246(c)(2); IRC §263(g)'],
  [14, 'form-dividend-income-taxpayer.xlsx', 'disallowedQualified.nonQualifiedPaymentsInLieu', 'Payments-in-lieu of dividends', 'NO', 'Step 5: added to disallowedQualifiedTotal.', 'IRC §6045(d); Pub. 550'],
  [15, 'form-dividend-income-taxpayer.xlsx', 'disallowedQualified.nonQualifiedSurrogateForeignCorporationDividends', 'Surrogate foreign corp disallowed dividends', 'NO', 'Step 5: added to disallowedQualifiedTotal.', 'IRC §7874; IRC §1(h)(11)(C)(iii)'],
  [],
  ['UPSTREAM — Form 8814 (child interest/dividends election)'],
  [16, 'form-child-interest-dividends.xlsx', 'childInterestDividendsEntries[].line2bQualifiedDividends', 'Child qualified dividends to include on parent return', 'NO (Form 8814 election)', 'form8814QualifiedDividendsTotal aggregated upstream at the prepare() level; passed to computeDividendIncome at line 4751. Added to BOTH line 3a AND line 3b at line 4779-4782. Triggers line 3c checkbox.', 'IRS Form 8814 instructions; lines/3ab.md §5'],
  [],
  ['IDENTITY INPUTS'],
  [17, 'form-identification-taxpayer.xlsx', 'taxpayerIdentity.ssn', 'Taxpayer SSN', 'YES — drives 1099-DIV attribution', 'belongsToPerson at line 8210', 'Same as 2a/2b'],
  [18, 'form-identification-spouse.xlsx', 'spouseIdentity.spouseSsn', 'Spouse SSN', 'YES on MFJ', 'Nulled on MFS via 2a #1 guard', '2a Code Validation #1'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 48 }, { wch: 65 }, { wch: 55 }, { wch: 30 }, { wch: 80 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data / Constants ──────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 3a'],
  ['Line 3a itself has ZERO direct constants. The QDCG worksheet thresholds ($48,350 / $96,700 / $533,400 / $600,050) belong to LINE 16 (tax computation), not line 3a. The $1,500 Schedule B threshold belongs to the dividend-side trigger logic, not line 3a value.'],
  [],
  ['Constant', 'Value', 'Source', 'Used by line 3a?', 'Notes'],
  [],
  ['Direct — used by dividend-side Schedule B trigger (line 4795)'],
  ['SCHEDULE_B_DIVIDEND_THRESHOLD', '$1,500', 'Hard-coded inline at line 4795 (`new BigDecimal("1500")`)', 'NO (Schedule B trigger; line 3a does not affect threshold)', '`scheduleBRequiredFromDividends = line3b > $1,500 OR nomineeDividends`. Line 3a value doesn\'t enter the trigger logic — only line 3b.'],
  [],
  ['Downstream — QDCG worksheet thresholds (apply at line 16, NOT line 3a)'],
  ['QDCG_0_PCT_SINGLE_2025', '$48,350', 'IRS QDCG worksheet 2025; ReferenceData (Line 16)', 'NO (line 16)', 'Qualified dividends + net cap gains taxable at 0% up to this taxable-income threshold.'],
  ['QDCG_0_PCT_MFJ_2025', '$96,700', 'IRS QDCG worksheet 2025', 'NO (line 16)', 'MFJ / QSS threshold.'],
  ['QDCG_15_PCT_TOP_SINGLE_2025', '$533,400', 'IRS QDCG worksheet 2025', 'NO (line 16)', 'Single: 15% rate applies above 0%-bracket up to this; 20% above.'],
  ['QDCG_15_PCT_TOP_MFJ_2025', '$600,050', 'IRS QDCG worksheet 2025', 'NO (line 16)', 'MFJ / QSS upper boundary for 15% rate.'],
  ['QDCG_0_PCT_HOH_2025', '$64,750', 'IRS QDCG worksheet 2025', 'NO (line 16)', 'HOH 0% threshold.'],
  ['QDCG_0_PCT_MFS_2025', '$48,350', 'IRS QDCG worksheet 2025', 'NO (line 16)', 'MFS = Single thresholds.'],
  [],
  ['Statutory references'],
  ['Qualified dividend definition', 'IRC §1(h)(11); Pub. 550 "Qualified dividends"', 'Defines qualified dividend as dividend from domestic corp or qualified foreign corp meeting holding-period requirements.'],
  ['Holding-period common stock', 'IRC §246(c)(1); Pub. 550', '61 days during the 121-day period beginning 60 days before ex-dividend date.'],
  ['Holding-period preferred stock', 'IRC §246(c)(2); Pub. 550', '91 days during the 181-day period when dividend period > 366 days.'],
  ['Related-payment obligation / short sale', 'IRC §263(g); IRS Pub. 550', 'Reduces qualified-dividend treatment when investor has offsetting position.'],
  ['Payments in lieu of dividends', 'IRC §6045(d); IRS Pub. 550', 'Payments received from broker as substitute for dividend on lent securities.'],
  ['Surrogate foreign corporation', 'IRC §7874; IRC §1(h)(11)(C)(iii)', 'Dividends from inverted-foreign-corp surrogates are NOT qualified.'],
  ['Form 8814 child qualified dividends', 'IRC §1(g); Form 8814 instructions', 'Parent election to include child\'s interest/dividends on parent return. Child qualified dividends increase parent\'s BOTH line 3a and line 3b.'],
  ['NIIT (out of scope)', 'IRC §1411; Form 8960', 'Qualified dividends subject to 3.8% NIIT when MAGI exceeds threshold. Form 8960 not implemented.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 30 }, { wch: 60 }, { wch: 35 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 3a Drives Tax Computation Method Selection'],
  ['Line 3a does NOT add to line 9 (it is a subset of line 3b). But it has CRITICAL downstream impact on the tax computation method at line 16.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['Form 1040 line 3a (the cell itself)', 'TaxReturnComputeService.buildIncome() — income.setQualifiedDividends(line3a)', 'Persisted on form1040.income only when non-null. Whole-dollar HALF_UP rounding. Frontend renders via PDF field f1_60[0]. NOT added to line 9.'],
  ['Form 1040 line 3c checkbox `line3cChildDividendsInLine3a`', 'DividendComputation.line3cChildDividendsInLine3a set TRUE when form8814QualifiedDividendsTotal > 0 (line 4855).', 'Discloses to IRS that line 3a includes Form 8814 child qualified dividends.'],
  ['Line 16 tax computation method — QDCG Worksheet or Schedule D Tax Worksheet', 'computeLine16() reads form1040.income.qualifiedDividends. If line3a > 0 AND Schedule D has no qualified/cap gain → QDCG Worksheet. If Schedule D has qualified amounts → Schedule D Tax Worksheet. Both apply preferential rates 0%/15%/20%.', '★ Most important downstream effect. Line 3a fundamentally changes the regular-tax computation when present.'],
  ['Form 6251 line 2g (AMT PAB) — INDIRECT via 1099-DIV box 13', 'DividendComputation.form6251Line2gDividends — sum of box 13 (PAB dividends) across taxpayer + spouse. Added to interest-side form6251Line2g at line 4397.', 'NOT a line-3a-value flow. Sourced from 1099-DIV box 13 directly. Already verified during 2a #6.'],
  ['Schedule B Part II per-payer detail items', 'DividendComputation.scheduleBDividendItems — accumulated per-1099-DIV entry. Used by buildScheduleB() when scheduleBRequiredFromDividends=true.', 'Generated only when Schedule B is required (line 3b > $1,500 OR nominee dividends).'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 (total income)', 'Line 3a is ABSENT from the line 9 formula at line 4134. Line 3b carries the dividend income (since 3a is a subset).', 'Avoiding double-count. Verified during 1z #7 / 2a #7 / 2b #5 multi-audit consolidation.'],
  ['Schedule B Part II line 6 — uses line 3b, not line 3a', 'scheduleB.line6TotalOrdinaryDividends = line3b', 'Schedule B Part II is for ORDINARY dividends. Line 3a does not appear on Schedule B.'],
];
const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 65 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 3a Emits Two Non-Blocking + Three Blocking (via Dividend Workflow)'],
  ['Line 3a directly emits the QUALIFIED_DIVIDENDS_LIMITED_TO_ORDINARY_DIVIDENDS non-blocking flag when the cap fires. The broader dividend workflow (in which line 3a participates) has three blocking flags + one verification flag.'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['QUALIFIED_DIVIDENDS_LIMITED_TO_ORDINARY_DIVIDENDS', 'NON-BLOCKING', 'After per-person caps + aggregation + Form 8814 inclusion, line 3a > line 3b → cap to line 3b and emit flag.', 'computeDividendIncome line 4784-4792'],
  ['SECTION199A_DIVIDENDS_EXCEED_ORDINARY_DIVIDENDS_TAXPAYER', 'NON-BLOCKING (verification)', 'Box 5 Section 199A dividends > Box 1a ordinary dividends for taxpayer.', 'computeDividendIncome line 4828-4836'],
  ['SECTION199A_DIVIDENDS_EXCEED_ORDINARY_DIVIDENDS_SPOUSE', 'NON-BLOCKING (verification)', 'Same as above but for spouse.', 'computeDividendIncome line 4837-4845'],
  ['MISSING_DIVIDEND_STATEMENTS_TAXPAYER', 'NON-BLOCKING (warning)', 'Taxpayer indicated dividend income but NO 1099-DIV entries are attributed to taxpayer SSN (post-2026-04-13 Gap 4 closure).', 'computeDividendIncome line 4811-4817'],
  ['MISSING_DIVIDEND_STATEMENTS_SPOUSE', 'NON-BLOCKING (warning)', 'Same as above but for spouse.', 'computeDividendIncome line 4818-4824'],
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
  ['Line 3a shares the `computeDividendIncome` orchestrator with line 3b, and the broader interest+dividend computation with lines 2a/2b. Many findings cross-reference 2a/2b/1z closures. 3a-specific verifications focus on: line 3a ≤ line 3b invariant, Form 8814 child inclusion, 5 disallowed-qualified-category fields, foreign-corporation manual classification. Verified 2026-05-11.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-11 — CROSS-REFERENCE — MFS GUARD ALREADY APPLIED VIA 2a #1 CASCADE', 'computeDividendIncome is called from inside computeInterestIncome, which received the `boolean isMfsReturn` parameter on 2026-05-11 (2a #1 closure). On MFS, `dividendIncomeSpouse` is nulled at the orchestrator before being passed downstream → `spouseHadDividend = false` → DividendPersonTotals for spouse early-returns at line 4870-4872 → addNonNull aggregate at line 4774-4775 stays taxpayer-only. **Line 3a is one of the 5 outputs protected by the HIGH-LEVERAGE 5-output cascade from 2a #1** (alongside lines 2a + 2b + 3b + Form 6251 line 2g + Schedule B Parts I/II). No separate 3a lock-in test needed — the cascade is exercised by `mfsExcludesSpouseInterestFromLine2a`. Closure: extended the MFS-guard breadcrumb at TaxReturnComputeService.java:4316-4330 from "2a.xlsx Code Validation #1 + 2b.xlsx Code Validation #1" to also cite "3a.xlsx Code Validation #1, all verified 2026-05-11" (multi-audit-trail consolidation pattern, now 3 audit IDs at this site). Also added an inline sentence describing the line-3a-specific cascade path (dividendIncomeSpouse=null → spouseHadDividend=false → DividendPersonTotals early-return).', 'TaxReturnComputeService.java:4316-4330 (extended multi-audit breadcrumb); test mfsExcludesSpouseInterestFromLine2a (cascade lock-in)', 'CLOSED — verified-correct cross-reference. Same multi-audit pattern as 2b #1.'],
  [2, 'RESOLVED 2026-05-11 — KNOWLEDGE FILE NAMING DEVIATION', '`knowledge/knowledge_line3ab_dividends.md` used the legacy `knowledge_lineNN_topic` underscore-prefix form — older than even the `knowledge-line-NN-topic` form that 1g/1h/1i/2ab were renamed from. Renamed to `knowledge/line-3ab-dividend-income.md` via plain `mv`. Updated the YAML frontmatter `name:` field from `knowledge_line3ab_dividends` to `line-3ab-dividend-income`. Updated the header-comment reference in this generator. Verified no other inbound references via grep. Continues the line 1c–2ab naming convergence into line 3ab.', 'C:\\us-tax\\knowledge\\line-3ab-dividend-income.md (renamed); C:\\us-tax\\XLS\\_tools\\generate-3a.js (header comment updated)', 'CLOSED — pure documentation hygiene. Same fix shape as 1g #5 / 1h #5 / 1i #6 / 1z #3 / 2a #4.'],
  [3, 'RESOLVED 2026-05-11 — SPEC ENHANCEMENT — VERIFICATION LOG ADDED TO lines/3ab.md', 'lines/2ab.md got a §12 "Verification log" table during the 2a #2 closure. The line-3ab spec had no equivalent. The 3a walkthrough is the first audit to touch this spec since the convention was established. Note: §12 and §13 are already taken in 3ab.md (Compute order + Primary sources), so the verification log was added as §14 — the conceptual convention is "end-of-file verification log", not literally §12. Closure: appended §14 with a row capturing the 3a walkthrough (issues #1 MFS cascade + #2 knowledge-file rename + #3 this §14 added; remaining #4-#10 to be amended in subsequent closures or at end-of-walkthrough docs update). Inaugural row for this spec; future audits (e.g., a 3b walkthrough) will append additional rows.', 'lines/3ab.md §14 (newly added; in-progress audit row)', 'CLOSED — documentation hygiene matching the 2ab.md §12 convention. Inaugural verification-log row for the 3ab spec.'],
  [4, 'RESOLVED 2026-05-11 — CROSS-REFERENCE — 0-VS-NULL COMPLIANCE FOR computeDividendForPerson', 'Per the canonical rule (NULL = concept doesn\'t apply, ZERO = concept applies and value is zero), computeDividendForPerson is FULLY COMPLIANT. Verified 5 compliance points: (1) all 7 BigDecimal locals init to null (lines 4878-4881 for statement accumulators; lines 4897-4899 for disallowed/nominee accumulators); (2) addNonNull preserves null when no contributions arrive; (3) subtractNonNegative(null, x) returns null per helper at line 17438-17440; (4) DividendPersonTotals record (Java record) accepts null BigDecimal fields; (5) early-return path at line 4875 returns explicit nulls `(null, null, false, null, null, new ArrayList<>(), null)`. Closure: 8-line breadcrumb added above the final return at line 4925 documenting the canonical-rule compliance and citing 3a #4. Same compliance shape as computeInterestForPerson (already breadcrumbed via 2a #5).', 'TaxReturnComputeService.java:4878-4881 (init), 4925 (return); new 8-line breadcrumb above return', 'CLOSED — verified correct. Breadcrumb at the return site, mirroring 2a #5 pattern.'],
  [5, 'RESOLVED 2026-05-11 — CROSS-REFERENCE — LINE 3b IN LINE 9, LINE 3a NOT (SUBSET DOUBLE-COUNT PREVENTION)', 'Line 9 formula at TaxReturnComputeService.java:4141-4144 reads `addNonNull(addNonNull(addNonNull(line1z, line2b), line3b), line4b)...` — line 3b is the 3rd operand, intentionally INCLUDED. Line 3a is absent. Per IRS rule + lines/3ab.md §2: qualified dividends (line 3a) are a SUBSET of ordinary dividends (line 3b); adding both would double-count. Line 3a contributes to line 9 ONLY via line 3b, then flows to the QDCG Worksheet at line 16 for preferential-rate computation. Closure: extended the line-9 breadcrumb at TaxReturnComputeService.java:4134-4140 from citing "1z #7 + 2a #7 + 2b #5" to also cite "3a.xlsx Code Validation #5" (multi-audit-trail consolidation now FOUR audit IDs at this site). Added a clarifying sentence distinguishing the 3a exclusion (SUBSET of 3b) from the 2a exclusion (tax-exempt under IRC §103) and the 1i exclusion (combat pay election). Lock-in test `line9EqualsLine1zPlusOtherIncomeLines` passes (verified 2026-05-11).', 'TaxReturnComputeService.java:4134-4140 (extended 4-audit breadcrumb); test line9EqualsLine1zPlusOtherIncomeLines (re-run pass)', 'CLOSED — verified-correct cross-reference. Multi-audit consolidation extended.'],
  [6, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — LINE 3a ≤ LINE 3b INVARIANT (TWO-LEVEL CAP)', 'Per IRC §1(h)(11) + lines/3ab.md §2: line 3a is a strict subset of line 3b. Enforced TWICE: (1) per-person cap at computeDividendForPerson line 4922-4924 — silent clamp (no flag); (2) return-level cap at computeDividendIncome line 4792-4800 — same cap plus non-blocking flag QUALIFIED_DIVIDENDS_LIMITED_TO_ORDINARY_DIVIDENDS. The mathematical analysis shows: after both per-person caps enforce tQual ≤ tOrd and sQual ≤ sOrd, aggregation preserves the invariant (tQual + sQual ≤ tOrd + sOrd), so the return-level cap rarely fires in practice — it exists as belt-and-suspenders for legacy-mode paths and future asymmetric inclusion scenarios. Closure: 12-line breadcrumb added above the return-level cap (was a single inline comment) documenting the two-level defense + mathematical analysis + spec §2 invariant. Also added lock-in test `dividendsQualifiedExceedingOrdinaryCappedToLine3bViaPerPersonCap` covering the silent per-person cap (1099-DIV with box 1b=$600 > box 1a=$500 → line3a=line3b=$500, NO flag).', 'TaxReturnComputeService.java:4792-4811 (12-line breadcrumb above cap); test dividendsQualifiedExceedingOrdinaryCappedToLine3bViaPerPersonCap', 'CLOSED — verified correct. Defense-in-depth pattern documented + new lock-in test.'],
  [7, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — FORM 8814 CHILD QUALIFIED DIVIDENDS ADDED TO BOTH 3a AND 3b', 'Per IRS Form 8814 instructions + lines/3ab.md §5: child qualified dividends must be added to BOTH parent\'s line 3a AND line 3b — because qualified dividends ARE ordinary dividends (qualified is a special-rate subset of ordinary). Verified at TaxReturnComputeService.java:4785-4805: symmetric addition preserves the line 3a ≤ line 3b invariant; line 3c disclosure checkbox `line3cChildDividendsInLine3a` set at line ~4855 when this path activates. Closure: expanded the inline comment to a 15-line breadcrumb documenting the IRS rule + 3 failure modes (3a-only → invariant violation; 3b-only → user overpays via under-applied QDCG rates; neither → under-reported income) + the symmetric-addition design + the 5 existing lock-in tests (form8814Line9QualifiedDividendsFlowToParentLine3aAnd3b, form8814NoQualifiedDividendsDoesNotSetLine3cCheckboxes, form8814OrdinaryDividendsOnlyAboveThresholdDoesNotSetLine3cCheckboxes, form8814QualifiedDividendsAggregateAcrossMultipleChildren, form8814ChildQualifiedDividendsAddedToParentExistingDividends). All 20 form8814* tests pass (verified 2026-05-11).', 'TaxReturnComputeService.java:4785-4805 (15-line breadcrumb above the if block); 5 form8814* tests already cover the invariant', 'CLOSED — verified correct. Breadcrumb expansion only; no code change.'],
  [8, 'RESOLVED 2026-05-11 — CROSS-REFERENCE — BOX 13 (PAB DIVIDENDS) FEEDS Form 6251 LINE 2g, NOT LINES 3a/3b', 'Cross-reference to 2a #6 + 2026-04-13 Gap 4 closure. 1099-DIV box 13 (`specifiedPrivateActivityBondDividendsAmount`) is the AMT-PAB subset of box 12 (exempt-interest dividends → line 2a) — and NOT a subset of box 1a/1b. Verified at TaxReturnComputeService.java:4922 — box 13 reads ONLY into `pabDividends` (the dedicated AMT accumulator), NOT into `ordinaryFromStatements` or `qualifiedFromStatements`. Aggregated to `form6251Line2gDividends` at line 4834. Lock-in test `dividendBox13FlowsToForm6251Line2g` (line 1255 in TaxReturnComputeServiceTest.java) asserts box 13 routes to Form 6251 line 2g and does NOT contaminate line 3a/3b. Closure: pure xlsx-flip cross-reference — the routing rule is already authoritatively breadcrumbed during 2a #6 at the line-2a tax-exempt subtraction site (interest box 9 + dividend box 13 share the same Form 6251 line 2g destination). Same closure shape as 2b #9 / 2b #10 (pure xlsx flips for already-tracked items).', 'TaxReturnComputeService.java:4922 (box 13 → pabDividends), 4834 (aggregation to form6251Line2gDividends); test dividendBox13FlowsToForm6251Line2g', 'CLOSED via 2a #6 — pure cross-reference verification, no code change.'],
  [9, 'RESOLVED 2026-05-11 — VERIFIED CORRECT BY DESIGN — 5 DISALLOWED-QUALIFIED-CATEGORIES ARE MANUAL ENTRY ONLY', 'Per IRC §1(h)(11)(B) + IRS Pub. 550 + lines/3ab.md §4.2 + §8: the 5 disallowed-qualified-dividend categories (common-stock holding period 61/121, preferred-stock holding period 91/181, related-payment/short-sale, payments-in-lieu, surrogate foreign corp — plus nominee which is also subtracted from line 3b) are handled through user-input fields with NO automatic brokerage-history inference. Rationale: (1) brokers already pre-classify box 1b on the 1099-DIV before it arrives; (2) the data isn\'t available to auto-detect holding-period failures (would require per-lot trade ledger only the broker has); (3) IRS Pub. 550 instructs taxpayer to make manual adjustments; (4) scenarios are rare for retail filers (active traders, securities-lending participants, surrogate-foreign-corp holders only); (5) the line 3a ≤ line 3b cap (3a #6) is the safety net. Matches IRS intent and standard tax-software practice (TurboTax, H&R Block, Drake all use manual-entry fields). Closure: 13-line breadcrumb at computeDividendForPerson lines 4944-4949 documenting the manual-entry design rationale citing IRC sections + Pub. 550 + 3a #9. No code change; no outstanding.md entry (broker-history inference would require full 1099-B per-lot integration, fundamentally different scope, and would only marginally improve correctness for a niche user group).', 'TaxReturnComputeService.java:4944-4949 (13-line breadcrumb above the 5-field accumulation); lines/3ab.md §4.2 + §8', 'CLOSED — verified-correct manual-entry design. Breadcrumb only; no code change; no deferral.'],
  [10, 'DEFERRED 2026-05-11 — NON-TREATY FOREIGN CORP DIVIDEND MANUAL-CLASSIFICATION FIELD MISSING', 'Per IRC §1(h)(11)(C) + IRS Pub. 550 + lines/3ab.md §4.3: not every 1099-DIV box 1b foreign-corp dividend remains qualified. To be qualified, the corp must be (a) US-possession-incorporated, (b) US tax-treaty eligible, OR (c) US-listed (e.g., NYSE ADRs). The existing 5 manual-classification fields (covering 2 holding-period + related-payment + payments-in-lieu + IRC §7874 surrogate) do NOT semantically cover the broader IRC §1(h)(11)(C) non-treaty case. Affected users: direct holders of non-ADR foreign stock without treaty coverage — rare for retail filers. Closure: deferred to outstanding.md "Line 3a: Non-Treaty Foreign Corporation Dividend Manual-Classification Field Missing" with ~30-45 min implementation sketch (new field `nonQualifiedNonTreatyForeignCorporationDividends` in YAML + UI + computeDividendForPerson 6th disallowance line). Distinct from 3a #9 (which documented the existing-5-fields manual-entry design) — this entry covers the GAP in available fields. Distinct from the IRC §7874 surrogate case already implemented as field #15. No code change today; broker pre-classification + line 3a ≤ line 3b cap (3a #6) provide the safety net.', 'outstanding.md (new entry); computeDividendForPerson — no auto foreign-corp eligibility code today', 'CLOSED with deferral — entry added to outstanding.md. No code change; broker pre-classification + line 3a cap are the safety net.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 30 }, { wch: 95 }, { wch: 65 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 3a Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.qualifiedDividends', 'topmostSubform[0].Page1[0].f1_60[0] (line3a_qualified_dividends)', 'form-tax-return-1040.xlsx (line 3a cell)', '★ Primary output. Stored only when non-null. Whole-dollar HALF_UP rounded.'],
  ['form1040.income.line3cChildDividendsInLine3a', 'topmostSubform[0].Page1[0].c1_33[0] (line3c_child_dividends_included_in_line3a)', 'form-tax-return-1040.xlsx (line 3c checkbox)', 'TRUE when Form 8814 child qualified dividends contribute to line 3a.'],
  [],
  ['DOWNSTREAM CONSUMERS'],
  ['Line 16 — tax computation method', '—', 'form-tax-return-1040.xlsx (line 16 cell)', '★ Most important. line 3a > 0 → QDCG Worksheet OR Schedule D Tax Worksheet. Both apply 0%/15%/20% preferential rates.'],
  ['Form 6251 line 2g (AMT PAB) — INDIRECT', '(via 1099-DIV box 13)', 'form-tax-return-6251.xlsx', 'NOT line-3a-value-driven. Box 13 PAB dividends feed Form 6251 line 2g separately.'],
  ['Schedule B Part II line 6', 'scheduleB.line6TotalOrdinaryDividends', 'form-tax-return-scheduleb.xlsx', 'Uses LINE 3b (ordinary), not line 3a. Line 3a is informational only on Form 1040 itself.'],
  ['Form 8960 NIIT', '(out of scope)', '—', 'Qualified dividends contribute to NIIT investment income. Form 8960 NOT IMPLEMENTED.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 (total income)', '—', 'form-tax-return-1040.xlsx', 'EXCLUDED. Line 3a is a subset of line 3b which IS in line 9 — adding both would double-count. Verified via 1z #7 + 2a #7 + 2b #5 + 3a #5 multi-audit consolidation.'],
  ['Form 1040 line 11b (AGI), line 15 (taxable income)', '—', 'form-tax-return-1040.xlsx', 'Line 3a reaches AGI / taxable income ONLY via line 3b → line 9 → AGI. No separate line-3a contribution.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 65 }, { wch: 50 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
