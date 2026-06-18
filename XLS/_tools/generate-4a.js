// ============================================================================
//  Generates: C:\us-tax\XLS\computations\4a.xlsx
//
//  Source-of-truth references:
//    - lines/4abc.md §6 Computation Rules + §3 Core 2025 IRS Rule
//    - dependencies/4abc.md
//    - knowledge/line-4abc-ira-distributions.md (renamed 2026-05-11 via 4a #2 — was knowledge_line4abc_ira.md)
//    - TaxReturnComputeService.computeIraDistributions() lines ~5087-5326 (orchestrator)
//    - TaxReturnComputeService.computeIraForPerson() lines ~5328-5500 (per-person aggregator)
//    - TaxReturnComputeService.buildForm8606() (Form 8606 generation when Exception 2 applies)
//    - PDF semantic CSV: f1040_field_mapping_semantic.csv rows 76-77
//    - IRS 2025 Form 1040 instructions for line 4a
//    - IRS 2025 Form 8606 instructions
//    - IRS Publication 590-B (IRA distributions)
//    - IRS Publication 526 (QCD cap + SIE rules)
//
//  Tax year: 2025
//
//  Critical findings flagged for this audit:
//   1. **MFS GUARD MISSING** at computeIraDistributions (line 5087) — defensive gap
//      where spouse IRA distributions could leak into MFS returns. Same shape as 2a #1.
//      This is the HIGH-PRIORITY issue — fix extends single-guard MFS cascade from 8
//      orchestrators to 9 (1c-1i + computeInterestIncome + computeIraDistributions).
//      The cascade would protect line 4a + line 4b + line 4c boxes 1/2/3 + Form 8606
//      (taxpayer + spouse) — at least 7 outputs through one guard.
//
//   2. Line 4a behavior is **intentionally blank when fully taxable** (per IRS rule):
//      `line4a = fullyTaxableOverall ? null : roundMoney(grossIra)`. This is the
//      simplified-reporting path matching IRS Form 1040 line 4a instructions.
//
//   3. Line 4a is NOT in line 9 (only line 4b is — same subset/value pattern as 3a vs 3b).
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '4a.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 4a — IRA DISTRIBUTIONS (GROSS AMOUNT)'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 4a'],
  ['Concept', 'GROSS amount of IRA distributions for the return (taxpayer + spouse aggregated). Per IRS 2025 Form 1040 instructions: enter the GROSS distribution on line 4a ONLY when one of 4 exceptions applies (rollover, Form 8606 case, QCD, HFD). When the distribution is fully taxable with NO exception, **LEAVE LINE 4a BLANK** — only line 4b carries the taxable amount.'],
  ['Core invariant', 'Line 4a is null (blank) when fully-taxable simple case; otherwise = gross distribution total (≥ line 4b). Line 4a represents the GROSS amount; line 4b carries the taxable amount → only line 4b enters line 9.'],
  ['Per-Person Formula', 'grossIra_person = Σ 1099-R box 1 (only entries with iraSepSimple=true AND belongsToPersonIra)\ngrossTraditionalIra_person = Σ box 1 for non-Roth entries only (excludes codes J/Q/T) — used for Form 8606 Part I line 7'],
  ['Per-Return Formula', 'grossIra = addNonNull(taxpayer.grossIraDistributions, spouse.grossIraDistributions)\ntaxableIra = addNonNull(taxpayer.taxableIraDistributions, spouse.taxableIraDistributions)\nhasAnyException = taxpayer.hasAnyException OR spouse.hasAnyException\nfullyTaxableOverall = hasPositiveAmount(grossIra) AND !hasAnyException AND hasPositiveAmount(taxableIra) AND grossIra == taxableIra\n\n**line4a = fullyTaxableOverall ? null : roundMoney(grossIra)**'],
  ['Filed', 'Form 1040 line 4a. PDF field: topmostSubform[0].Page1[0].f1_62[0] (semantic: line4a_ira_distributions). Sibling line 4b at f1_63[0] (line4b_ira_taxable_amount). Line 4c checkboxes + write-in space exist as separate PDF fields.'],
  ['Backend method', 'TaxReturnComputeService.computeIraDistributions() lines ~5087-5326 (orchestrator).\nTaxReturnComputeService.computeIraForPerson() lines ~5328-5500 (per-person aggregator with Form 8606 generation).\n**⚠️ MISSING MFS GUARD**: orchestrator does NOT receive `isMfsReturn` parameter (Code Validation #1).'],
  ['Output', 'form1040.income.iraDistributions (BigDecimal; null when fully-taxable simple case OR no IRA activity). When non-null, the grossIra value is rendered on Form 1040 line 4a.'],
  ['IRS source', 'IRS 2025 Form 1040 instructions for line 4a; IRS 2025 Form 8606 instructions; IRS Pub. 590-B (IRA distributions); IRS Pub. 526 (QCD)'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Validate IRA statement gating', 'validateIraStatementGating at line 5099 — emits blocking flags if hadIraDistributions=true but no 1099-R uploaded.'],
  [2, 'Filter 1099-R entries by IRA flag + recipient SSN', 'For each 1099-R: `if (!iraSepSimple) continue;` at line 5344. Then `belongsToPersonIra(...)` at line 5347 — SSN-attribution. Non-IRA pension/annuity entries excluded.'],
  [3, 'Per-person: accumulate grossIra (box 1) and grossTraditionalIra (excludes Roth codes J/Q/T)', '`grossIra = addNonNull(grossIra, entryGross)` at line 5351. `grossTraditionalIra` adds only when codes don\'t include J/Q/T — used for Form 8606 Part I line 7.'],
  [4, 'Per-person: detect exceptions', '`hasRollover`, `hasQcd`, `hasHfd`, `hasOtherLine4cWriteIn`, `hasException2` (Form 8606 case) all checked at lines 5371-5385. Roth codes J/T → hasException2 (Form 8606 Part III required); code Q alone → NOT exception 2.'],
  [5, 'Per-person: compute taxable after exceptions', '`taxableAfterExceptions = subtractNonNegative(taxableBox2a, rollover + effectiveQcd + hfd)` at line 5401-5404. `effectiveQcd = (ownQcd - post70halfDeduction) + inheritedIraQcd` — post-70½ reduction applies only to OWN IRA QCDs, not inherited.'],
  [6, 'Per-person: generate Form 8606 if Exception 2', 'When `hasException2` true, `buildForm8606(person, iraForm, grossTraditionalIra)` generates Form 8606 with Part I + Part II + Part III as needed. Per-person, never joint.'],
  [7, 'Per-person: compute taxableAmount', 'When Form 8606 produces a non-null taxable amount (Part I line 15c + Part II line 18 + Part III line 25c), use that. Otherwise use taxableAfterExceptions.'],
  [8, 'Return-level: aggregate gross + taxable', '`grossIra = addNonNull(taxpayer.grossIraDistributions, spouse.grossIraDistributions)` at line 5279.\n`taxableIra = addNonNull(taxpayer.taxableIraDistributions, spouse.taxableIraDistributions)` at line 5280.\n**⚠️ NO MFS guard**: spouse contributions are aggregated even on MFS.'],
  [9, 'Return-level: detect fully-taxable simple case', '`fullyTaxableOverall = hasPositiveAmount(grossIra) AND !hasAnyException AND hasPositiveAmount(taxableIra) AND grossIra == taxableIra` at line 5282-5285.'],
  [10, 'Return-level: compute line 4a (blank-when-fully-taxable)', '**`line4a = fullyTaxableOverall ? null : roundMoney(grossIra)`** at line 5287. Per IRS rule: line 4a is blank when no exception applies AND full distribution is taxable.'],
  [11, 'Return-level: aggregate line 4c boxes 1/2/3 + write-in text', '`line4cBox1 = taxpayer.hasRollover() OR spouse.hasRollover()` etc. at lines 5123-5127.'],
  [12, 'Return-level: emit attachment flags', 'LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED (blocking when >1 exception with no statement); IRA_ROLLOVER_ATTACHMENT_REVIEW (non-blocking); IRA_QCD_SIE_ATTACHMENT_REVIEW (non-blocking).'],
  [13, 'Persist on form1040.income; output Form 8606(s)', '`income.setIraDistributions(line4a)` (only if non-null per blank-when-fully-taxable rule). Form 8606 (taxpayer / spouse) output separately. Line 4c box flags + write-in text persist on TaxReturnComputation.'],
  [],
  ['MUTUAL EXCLUSION RULES (enforced by code or spec)'],
  ['Rule', 'Implementation', 'Why'],
  ['Line 4a BLANK when fully-taxable simple case', 'Line 5287: `fullyTaxableOverall ? null : roundMoney(grossIra)`.', 'IRS Form 1040 line 4a instructions: "if fully taxable, do not file line 4a; enter the total distribution on line 4b". Simplification for the common case.'],
  ['Line 4a is NOT in line 9 (only line 4b is)', 'Line 9 formula at line 4141-4145 uses line4b, not line4a.', 'Line 4a is the GROSS amount; line 4b is the TAXABLE amount. Only taxable income enters line 9. Same subset-vs-value pattern as line 3a vs line 3b.'],
  ['Non-IRA 1099-R entries excluded', 'Line 5344: `if (!Boolean.TRUE.equals(getBoolean(entry, "iraSepSimple"))) continue;`. Pension/annuity 1099-Rs flow to lines 5a/5b/5c instead.', 'IRS rule: lines 4a/4b/4c are for IRA, SEP, SIMPLE distributions only.'],
  ['Roth code Q alone does NOT trigger Form 8606', 'Lines 5340-5341 + 5367-5369: `rothCodeJOrTCount` tracked separately. `allRothEntriesFullyQualified` is true when every Roth-coded 1099-R has code Q (no J or T).', 'Code Q = fully qualified Roth distribution (5-year rule met, qualifying event). Per IRS, no Form 8606 Part III needed for code Q. Fixed 2026-04-14.'],
  ['Post-70½ deductible contribution reduction applies ONLY to OWN IRA QCDs', 'Lines 5391-5399: `ownIraQcdAmount = qcdAmount - inheritedIraQcdAmount`; `effectiveOwnQcd = ownIraQcdAmount - post70halfDeduction`; `effectiveQcdAmount = effectiveOwnQcd + inheritedIraQcdAmount`.', 'Per IRS Pub. 590-B: post-70½ reduction applies to taxpayer\'s OWN IRA QCDs, not inherited IRA QCDs.'],
  ['Form 8606 is PER PERSON, never joint (even on MFJ)', 'Per-person form8606 fields on IraComputation; separate buildForm8606 calls for taxpayer and spouse.', 'Per IRS Form 8606 instructions: Form 8606 is filed by an individual taxpayer for their own IRA basis tracking.'],
  ['QCD cap $108,000 per person for 2025 (one-time SIE up to $54,000)', '(currently NOT enforced in code — see Code Validation #9 for verification)', 'IRS 2025 inflation-adjusted cap per Pub. 526. SIE = split-interest entity one-time election.'],
  [],
  ['DECISION TREE — when does each value appear on line 4a?'],
  ['Scenario', 'Line 4a result', 'Line 4b result', 'Line 4c result'],
  ['No 1099-R IRA entries; hadIraDistributions=false', 'null (blank)', 'null (blank)', 'all boxes unchecked, no text'],
  ['1099-R box 1 = $10,000, box 2a = $10,000, no exception, no Form 8606', '**null (BLANK — fully taxable simple case)**', '$10,000', 'unchecked'],
  ['1099-R box 1 = $10,000, all rolled over (Exception 1)', '$10,000 (gross on line 4a)', '$0', 'box 1 checked (rollover)'],
  ['1099-R box 1 = $10,000, $5,000 rolled over, $5,000 taxable', '$10,000', '$5,000', 'box 1 checked'],
  ['1099-R box 1 = $10,000, all QCD (Exception 3)', '$10,000', '$0', 'box 2 checked (QCD)'],
  ['1099-R box 1 = $10,000, QCD $7,000 with post-70½ deduction $1,000', '$10,000', '$4,000 (effective QCD = $6,000)', 'box 2 checked'],
  ['1099-R box 1 = $10,000, HFD $5,000', '$10,000', '$5,000', 'box 3 checked, text "HFD"'],
  ['Traditional IRA with nondeductible basis (Form 8606 Part I — Exception 2)', '$10,000', '(Form 8606 Part I line 15c)', 'no box; Form 8606 attached'],
  ['Roth conversion (Form 8606 Part II — Exception 2)', '$10,000 (from traditional)', '(Form 8606 Part II line 18)', 'no box; Form 8606 attached'],
  ['Roth distribution with code J or T (Form 8606 Part III — Exception 2)', '$10,000', '(Form 8606 Part III line 25c)', 'no box; Form 8606 attached'],
  ['Roth distribution with code Q only (fully qualified)', '**null (fully taxable simple case — actually fully NON-taxable, treated as no exception)**', '$0 or null', 'no box'],
  ['MFS return; only spouse has IRA distributions', '**⚠️ Currently leaks spouse amount into taxpayer\'s MFS return** (see Code Validation #1)', '**⚠️ Same leak**', '**⚠️ Same leak**'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 4a Flows'],
  ['Consumer', 'How', 'Notes'],
  ['(NOT line 9 directly)', 'Line 9 formula uses line 4b, NOT line 4a. Line 4a is informational.', 'Same pattern as line 3a vs 3b (gross-vs-taxable distinction).'],
  ['Form 1040 line 4a (the cell itself)', 'TaxReturnComputeService.buildIncome() — income.setIraDistributions(line4a)', 'Persisted only when non-null. Whole-dollar HALF_UP rounded. Frontend renders via PDF field f1_62[0]. Blank when fully-taxable simple case.'],
  ['Form 8606 (taxpayer / spouse) — separate output forms', 'Per-person form8606 attached to return when Exception 2 applies', 'Generated only when hasException2 true. Per-person, never joint.'],
  ['LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED flag', 'Lines 5151-5159 — blocking when >1 exception applies without breakout statement (waiver for Exception 2 + 1 other)', 'Per IRS multi-exception statement rule. Blocks compute completion until user supplies breakout statement.'],
  ['IRA_ROLLOVER_ATTACHMENT_REVIEW flag', 'Lines 5163-5169 — non-blocking when rollover into qualified plan or completed in 2026', 'Per IRS guidance: explanatory statement required.'],
  ['IRA_QCD_SIE_ATTACHMENT_REVIEW flag', 'Lines 5171-5179 — non-blocking when one-time QCD to split-interest entity', 'Per IRS Pub. 526 SIE election.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 24 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 4a'],
  ['Sourced from C:\\us-tax\\XLS\\input_forms\\*.xlsx. Line 4a inputs come from 1099-R statements + per-person ira-income personal forms.'],
  [],
  ['#', 'Source xlsx', 'Field path / model key', 'Label / box', 'Required?', 'Role in line 4a compute', 'Cross-reference'],
  [],
  ['STATEMENT INPUTS — 1099-R'],
  [1, 'form-1099-r.xlsx', 'iraSepSimple', 'IRA/SEP/SIMPLE box (checkbox)', 'YES — primary filter', 'Step 2: `if (!iraSepSimple) continue;` at line 5344. Non-IRA pension/annuity 1099-Rs excluded (flow to lines 5a/5b/5c).', 'IRS 1099-R instructions'],
  [2, 'form-1099-r.xlsx', 'grossDistributionAmount (box 1)', '1099-R box 1 "Gross distribution"', 'YES — primary line 4a feed', 'Step 3: `grossIra += entry.box1`', 'IRS 1099-R box 1'],
  [3, 'form-1099-r.xlsx', 'taxableAmountAmount (box 2a)', '1099-R box 2a "Taxable amount"', 'YES — for line 4b', 'Step 3: `taxableBox2a += entry.box2a` — feeds line 4b, not 4a directly', 'IRS 1099-R box 2a'],
  [4, 'form-1099-r.xlsx', 'taxableAmountNotDetermined (box 2b)', '1099-R box 2b "Taxable amount not determined" (checkbox)', 'NO — verification', 'Increments taxableNotDeterminedCount (line 5353-5355) — used in hasTaxableNotDetermined flag', 'IRS 1099-R box 2b'],
  [5, 'form-1099-r.xlsx', 'distributionCodes (box 7)', '1099-R box 7 "Distribution code(s)"', 'YES — for Roth/Form 8606 routing', 'Codes J/Q/T identify Roth distributions. Code J/T → Form 8606 Part III. Code Q → fully qualified Roth (no Form 8606).', 'IRS 1099-R box 7 codes'],
  [6, 'form-1099-r.xlsx', 'recipientTIN', '1099-R recipient TIN', 'YES — for SSN attribution', 'belongsToPersonIra at line 5347. **⚠️ MFS guard missing**: spouse-attributed entries leak to taxpayer on MFS.', 'Code Validation #1'],
  [7, 'form-1099-r.xlsx', 'federalIncomeTaxWithheldAmount (box 4)', '1099-R box 4 "Federal income tax withheld"', 'NO — feeds line 25b', 'NOT a line 4a input. Routes to line 25b withholding.', 'Line 25b path'],
  [],
  ['PERSONAL FORM INPUTS — ira-income-taxpayer / -spouse'],
  [8, 'form-ira-income-taxpayer.xlsx', 'screening.hadIraDistributions', 'Did you have IRA distributions?', 'YES (boolean gate)', 'Drives validateIraStatementGating (line 5099) AND personHadIra flag.', 'YAML: 4abc-ira-income-taxpayer.yaml'],
  [9, 'form-ira-income-taxpayer.xlsx', 'rollover.hadIraRollover', 'Did you roll over any IRA distribution?', 'NO — Exception 1 gate', 'Line 5371: triggers `hasRollover` → line 4c box 1.', 'IRS Exception 1'],
  [10, 'form-ira-income-taxpayer.xlsx', 'rollover.totalIraRolloverAmount', 'Total rollover amount', 'NO', 'Subtracted from taxable in Step 5. Affects line 4b. Used in breakout statement + rollover attachment text.', 'IRS Exception 1'],
  [11, 'form-ira-income-taxpayer.xlsx', 'rollover.rolloverIntoQualifiedPlanOrCompletedInFollowingYear', 'Rollover into qualified plan or 2026 completion', 'NO', 'Triggers IRA_ROLLOVER_ATTACHMENT_REVIEW (non-blocking)', 'IRS rollover-attachment rule'],
  [12, 'form-ira-income-taxpayer.xlsx', 'qcd.hadQcd', 'Did you make a QCD?', 'NO — Exception 3 gate', 'Line 5373: triggers `hasQcd` → line 4c box 2.', 'IRS Exception 3'],
  [13, 'form-ira-income-taxpayer.xlsx', 'qcd.totalQcdAmount', 'Total QCD amount', 'NO', 'Reduced by post-70½ deductible contributions. Affects line 4b.', 'IRS Pub. 526'],
  [14, 'form-ira-income-taxpayer.xlsx', 'qcd.inheritedIraQcdAmount', 'Inherited IRA QCD amount', 'NO', 'Subset of totalQcdAmount. NOT reduced by post-70½ deduction (per Pub. 590-B).', 'IRS Pub. 590-B'],
  [15, 'form-ira-income-taxpayer.xlsx', 'qcd.deductibleIraContributionsAfterAge70Half', 'Deductible IRA contribs after age 70½', 'NO', 'Reduces effective ownIraQcd dollar-for-dollar. Fixed 2026-04-15.', 'IRS Pub. 590-B'],
  [16, 'form-ira-income-taxpayer.xlsx', 'qcd.hasOneTimeQcdToSplitInterestEntity', 'One-time QCD to SIE', 'NO', 'Triggers IRA_QCD_SIE_ATTACHMENT_REVIEW (non-blocking). SIE cap $54,000 for 2025.', 'IRS Pub. 526'],
  [17, 'form-ira-income-taxpayer.xlsx', 'hfd.hadHfd', 'Did you make a one-time HFD to HSA?', 'NO — Exception 4 gate', 'Line 5375: triggers `hasHfd` → line 4c box 3 + "HFD" write-in.', 'IRS Exception 4'],
  [18, 'form-ira-income-taxpayer.xlsx', 'hfd.totalHfdAmount', 'Total HFD amount', 'NO', 'Subtracted from taxable. Affects line 4b.', 'IRS HFD rules'],
  [19, 'form-ira-income-taxpayer.xlsx', 'form8606.hasNondeductibleTraditionalBasis', 'Have nondeductible basis?', 'NO — Exception 2 gate', 'Line 5381: triggers `hasException2` → Form 8606 Part I.', 'IRS Form 8606 instructions'],
  [20, 'form-ira-income-taxpayer.xlsx', 'form8606.hasTraditionalToRothConversion', 'Roth conversion in 2025?', 'NO — Exception 2 gate', 'Triggers `hasException2` → Form 8606 Part II.', 'IRS Form 8606 instructions'],
  [21, 'form-ira-income-taxpayer.xlsx', 'form8606.hasRothIraDistributions', 'Roth IRA distributions (non-fully-qualified)?', 'NO — Exception 2 gate (conditional)', 'Triggers `hasException2` only when NOT all Roth entries have code Q (allRothEntriesFullyQualified=false).', 'IRS Form 8606 Part III'],
  [22, 'form-ira-income-taxpayer.xlsx', 'form8606.priorYearTraditionalIraBasis', 'Prior-year Form 8606 line 14 basis', 'NO', 'Feeds Form 8606 Part I line 2.', 'Form 8606 Part I'],
  [23, 'form-ira-income-taxpayer.xlsx', 'form8606.returnOfContributionAmount', 'Return of contribution amount', 'NO — Exception 2 gate', 'Triggers `hasException2`. Excluded from Form 8606 line 7.', 'Form 8606 Part I line 7 exclusions'],
  [24, 'form-ira-income-taxpayer.xlsx', 'form8606.inheritedTraditionalIraDistributionAmount', 'Inherited traditional IRA distribution', 'NO', 'Excluded from Form 8606 line 7 (basis-tracking is decedent-side).', 'Form 8606 Part I line 7 exclusions'],
  [25, 'form-ira-income-taxpayer.xlsx', 'line4c.line4cOtherWriteInText', 'Line 4c box 3 other write-in text', 'NO', 'Aggregates with HFD into box 3 write-in text. Joined via joinLine4cOtherText.', 'IRS line 4c instructions'],
  [26, 'form-ira-income-taxpayer.xlsx', 'line4c.moreThanOneLine4ExceptionAppliesOnReturn', 'Multi-exception flag', 'NO', 'Drives breakout-statement-required logic at line 5145.', 'IRS multi-exception statement rule'],
  [27, 'form-ira-income-taxpayer.xlsx', 'line4c.exceptionBreakoutStatementPrepared', 'User confirmed breakout statement prepared', 'NO (unless required)', 'Gates LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED blocking flag.', 'IRS multi-exception statement rule'],
  [],
  ['IDENTITY INPUTS'],
  [28, 'form-identification-taxpayer.xlsx', 'taxpayerIdentity.ssn', 'Taxpayer SSN', 'YES — drives 1099-R IRA attribution', 'belongsToPersonIra at line 5347', 'Standard SSN attribution'],
  [29, 'form-identification-spouse.xlsx', 'spouseIdentity.spouseSsn', 'Spouse SSN', 'YES on MFJ', '**⚠️ Should be nulled on MFS via MFS guard — currently leaks. See Code Validation #1.**', 'Code Validation #1'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 42 }, { wch: 65 }, { wch: 55 }, { wch: 30 }, { wch: 80 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 4a (and dependent line 4b)'],
  ['Line 4a itself has no direct numeric thresholds, but downstream line 4b computation depends on 2025-adjusted IRA constants.'],
  [],
  ['Constant', 'Value', 'Source', 'Used by line 4a?', 'Notes'],
  [],
  ['Direct — QCD limits (affect line 4c gating + line 4b computation, NOT line 4a value directly)'],
  ['QCD_ANNUAL_CAP_2025', '$108,000', 'IRS 2025 Pub. 526 (inflation-adjusted from $105,000 in 2024)', 'INDIRECT (affects line 4b)', 'Per-person annual QCD exclusion cap. Code Validation #9 verifies enforcement.'],
  ['QCD_SIE_CAP_2025', '$54,000', 'IRS 2025 Pub. 526 (split-interest entity one-time election)', 'INDIRECT', 'One-time SIE election cap, included in the $108,000 annual cap.'],
  ['QCD_MIN_AGE', '70½', 'IRC §408(d)(8); IRS Pub. 590-B', 'INDIRECT', 'Taxpayer must be at least 70½ on date of distribution.'],
  [],
  ['Direct — Rollover rules (affect line 4b)'],
  ['ROLLOVER_60_DAY_WINDOW', '60 days', 'IRC §408(d)(3); IRS Pub. 590-B', 'INDIRECT (affects line 4b)', 'Rollover must be completed within 60 days. Beyond → not a rollover.'],
  [],
  ['Indirect — Form 8606 thresholds'],
  ['(Form 8606 Part I has no numeric thresholds in 2025)', '—', '—', '—', 'Form 8606 line 7 = grossTraditionalIra − exclusions. No threshold.'],
  [],
  ['Statutory references'],
  ['IRA distribution treatment', 'IRC §408; IRS Pub. 590-B', 'Authoritative source for IRA distribution rules.'],
  ['Form 8606 (nondeductible IRA basis tracking)', 'IRS Form 8606 instructions', 'Per-person basis tracking; required for nondeductible traditional IRA, Roth conversions, non-qualified Roth distributions.'],
  ['Qualified Charitable Distribution (QCD)', 'IRC §408(d)(8); IRS Pub. 526', '$108,000 per-person annual cap for 2025; $54,000 SIE cap.'],
  ['HSA Funding Distribution (HFD)', 'IRC §408(d)(9); IRS Pub. 969', 'One-time direct transfer from IRA to HSA.'],
  ['Post-70½ deductible contribution reduction', 'IRS Pub. 590-B', 'Reduces QCD exclusion dollar-for-dollar; applies to OWN IRA QCDs only, not inherited.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 40 }, { wch: 22 }, { wch: 50 }, { wch: 30 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 4a Drives 1099-R IRA Categorization But Not Tax Computation'],
  ['Line 4a is the GROSS amount. Line 4b carries the TAXABLE amount → enters line 9. Line 4c is the disclosure mechanism for exceptions.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['Form 1040 line 4a (the cell itself)', 'TaxReturnComputeService.buildIncome() — income.setIraDistributions(line4a)', '★ Primary output. Stored only when non-null. Whole-dollar HALF_UP rounded.'],
  ['Form 1040 line 4b (taxable IRA amount)', 'income.setTaxableIraDistributions(line4b)', '★ Carries the TAXABLE portion. Enters line 9 (total income).'],
  ['Form 1040 line 4c box 1 (rollover checkbox)', 'IraComputation.line4cBox1', 'Checked when any rollover exception applies.'],
  ['Form 1040 line 4c box 2 (QCD checkbox)', 'IraComputation.line4cBox2', 'Checked when any QCD exception applies.'],
  ['Form 1040 line 4c box 3 (other / HFD)', 'IraComputation.line4cBox3 + line4cBox3Text', 'Checked when HFD or other write-in applies.'],
  ['Form 8606 (taxpayer)', 'IraComputation.form8606Taxpayer (separate output form)', 'Generated when taxpayer hasException2 true. Part I + Part II + Part III as needed.'],
  ['Form 8606 (spouse)', 'IraComputation.form8606Spouse', 'Generated when spouse hasException2 true.'],
  ['LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED flag', 'Lines 5151-5159 — BLOCKING', 'Required when >1 exception applies and user has not confirmed breakout statement prepared. Waiver for Exception 2 + 1 other.'],
  ['IRA_ROLLOVER_ATTACHMENT_REVIEW flag', 'Lines 5163-5169 — non-blocking', 'Triggered by rolloverIntoQualifiedPlanOrCompletedInFollowingYear.'],
  ['IRA_QCD_SIE_ATTACHMENT_REVIEW flag', 'Lines 5171-5179 — non-blocking', 'Triggered by hasOneTimeQcdToSplitInterestEntity.'],
  ['line4aRolloverAttachmentText', 'IraComputation.line4aRolloverAttachmentText', 'Generated explanatory statement text for rollover.'],
  ['line4cQcdSieAttachmentText', 'IraComputation.line4cQcdSieAttachmentText', 'Generated explanatory statement text for SIE QCD.'],
  ['line4cBreakoutStatementText', 'IraComputation.line4cBreakoutStatementText', 'Generated multi-exception breakout statement text.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 (total income)', 'Line 9 uses line 4b (taxable), NOT line 4a (gross)', '★ Critical: line 4a does NOT enter total income. Only the taxable portion (line 4b) flows through.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 4a Family Emits 3 Direct Flags + Several Upstream Statement-Gating Flags'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED', 'BLOCKING', '>1 exception applies AND user has not set exceptionBreakoutStatementPrepared=true. Waiver: Exception 2 + exactly 1 other.', 'computeIraDistributions lines 5151-5159'],
  ['IRA_ROLLOVER_ATTACHMENT_REVIEW', 'NON-BLOCKING', 'rolloverIntoQualifiedPlanOrCompletedInFollowingYear is TRUE for taxpayer or spouse.', 'computeIraDistributions lines 5163-5169'],
  ['IRA_QCD_SIE_ATTACHMENT_REVIEW', 'NON-BLOCKING', 'hasOneTimeQcdToSplitInterestEntity is TRUE for taxpayer or spouse.', 'computeIraDistributions lines 5171-5179'],
  ['IRA_STATEMENT_UPLOAD_REQUIRED', 'BLOCKING', 'hadIraDistributions=true but no 1099-R uploaded for this person.', 'validateIraStatementGating'],
  ['IRA_DISTRIBUTION_TAXABLE_NOT_DETERMINED', 'NON-BLOCKING (verification)', 'Any 1099-R IRA entry has box 2b checked (taxable amount not determined).', 'computeIraForPerson taxableNotDeterminedCount'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 50 }, { wch: 28 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 4a is the gross-IRA-distributions line. The first major audit OUTSIDE the wage block (1a-1z) and the interest+dividend block (2a-3c). Discovered during initial scan: **`computeIraDistributions` is missing the MFS guard** — same defensive gap that 2a #1 fixed for the interest+dividend block. The fix extends the single-guard MFS cascade from 8 orchestrators to 9. Verified 2026-05-11.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-11 — HIGH-PRIORITY DEFENSIVE GAP — MFS GUARD ADDED AT computeIraDistributions', 'Three-step fix applied: (a) added `boolean isMfsReturn` parameter to `computeIraDistributions` signature (TaxReturnComputeService.java:5087-5094); (b) at the top of the method body, nulled spouse-side reads on MFS — `Map<String, Object> iraIncomeSpouse = isMfsReturn ? null : iraIncomeSpouseRaw;` and `String spouseSsn = isMfsReturn ? null : normalizeSsn(getString(spouse, "ssn"));`; (c) updated call site at line 404 to pass `isMfsReturn` (already in scope). Added 14-line MFS-guard breadcrumb above the method body documenting the cascade path. Lock-in test `mfsExcludesSpouseIraFromLine4a` added: MFS return with taxpayer $5k fully-taxable IRA + STALE spouse $8k IRA → asserts line 4b = $5,000 (taxpayer-only), NOT $13,000 (aggregated). **HIGH-LEVERAGE FIX**: one guard protects 7+ outputs (line 4a, 4b, 4c boxes 1/2/3, 4c write-in text, Form 8606 taxpayer, Form 8606 spouse). **Single-guard MFS cascade now applied to 9 orchestrators** (1c-1i + computeInterestIncome + **computeIraDistributions**). Backend regression: 751 → 752 (net +1 from lock-in test).', 'TaxReturnComputeService.java:5087-5113 (signature + 14-line breadcrumb + MFS suppression); line 404 (call site); test mfsExcludesSpouseIraFromLine4a', 'CLOSED — defensive gap fixed. Single-guard MFS cascade extended to 9 orchestrators.'],
  [2, 'RESOLVED 2026-05-11 — KNOWLEDGE FILE NAMING DEVIATION', '`knowledge/knowledge_line4abc_ira.md` used the legacy `knowledge_lineNN_topic` underscore-prefix form. Renamed to `knowledge/line-4abc-ira-distributions.md` via plain `mv`. Updated the YAML frontmatter `name:` field from `Lines 4a/4b/4c IRA Distributions — Implementation Knowledge` (descriptive label) to `line-4abc-ira-distributions` (matches filename per 2ab/3ab convention). Updated the header-comment reference in `generate-4a.js`. Grep verified no other inbound references. **Line 1c → 4abc knowledge-file naming convergence now complete across 11 lines** (1c, 1d, 1e, 1f, 1g, 1h, 1i, 1z, 2ab, 3ab, 4abc).', 'C:\\us-tax\\knowledge\\line-4abc-ira-distributions.md (renamed); C:\\us-tax\\XLS\\_tools\\generate-4a.js (header comment)', 'CLOSED — pure documentation hygiene. Same fix shape as 1g #5 / 1h #5 / 1i #6 / 1z #3 / 2a #4 / 3a #2.'],
  [3, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — LINE 4a BLANK-WHEN-FULLY-TAXABLE SIMPLE CASE', 'Per IRS 2025 Form 1040 instructions + lines/4abc.md §3 Core 2025 IRS Rule: "If the IRA distribution is fully taxable, enter the total distribution on line 4b and leave line 4a blank." Implementation at TaxReturnComputeService.java:5303 correctly uses a strict 4-condition test for fully-taxable-overall: (1) hasPositiveAmount(grossIra); (2) !hasAnyException; (3) hasPositiveAmount(taxableIra); (4) grossIra == taxableIra. If ALL hold → line4a = null (blank PDF rendering — null BigDecimal omitted from JSON). If ANY fails → line4a = roundMoney(grossIra) (carries gross amount per exception disclosure rule). Closure: 11-line breadcrumb above the line 4a assignment (lines 5303-5315) documenting the IRS rule + 4-condition test + blank-not-zero PDF rendering semantic + contrast with line 4b (always carries the taxable amount, never blank when IRA activity is present).', 'TaxReturnComputeService.java:5295-5315 (11-line breadcrumb above line 4a assignment)', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [4, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — LINE 4a NOT IN LINE 9 (6-AUDIT CONSOLIDATION + GROSS-VS-TAXABLE PATTERN)', 'Line 9 formula at TaxReturnComputeService.java:4150-4153: line 4b is the 4th operand (INTENTIONALLY INCLUDED — taxable IRA per IRC §61); line 4a (gross IRA) is absent. Closure: extended the line-9 breadcrumb at lines 4135-4151 from **5 audit IDs** to **6 audit IDs** (added 4a #4). Introduced "**gross-vs-taxable pattern**" terminology — distinguishes from the existing "inverse-confirmation" pattern (income pairs 2a/2b + 3a/3b). The breadcrumb now documents TWO patterns at this site: (1) inverse-confirmation for income pairs (tax-exempt/subset side EXCLUDED, full-income side INCLUDED); (2) gross-vs-taxable for distribution lines (4a/4b, future 5a/5b + 6a/6b — gross side EXCLUDED as disclosure-only, taxable side INCLUDED per IRC §61). Lock-in test `line9EqualsLine1zPlusOtherIncomeLines` re-run passed.', 'TaxReturnComputeService.java:4135-4151 (extended 6-audit breadcrumb + new gross-vs-taxable pattern terminology); test line9EqualsLine1zPlusOtherIncomeLines (re-run pass)', 'CLOSED — verified-correct cross-reference. 6-audit consolidation + gross-vs-taxable pattern introduced.'],
  [5, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — 0-VS-NULL COMPLIANCE FOR computeIraForPerson', 'Verified 5 compliance points: (1) local accumulators init to null at lines 5367-5369 (grossIra, grossTraditionalIra, taxableBox2a); (2) addNonNull preserves null when no entries match (lines 5382, 5392, 5430); (3) subtractNonNegative(null, x) returns null per helper at line ~17500 (lines 5425, 5428, 5432-5435); (4) roundMoney(null) returns null at line 11763-11765 (verified gate); (5) IraPersonComputation record accepts null BigDecimals. Null-preservation chain end-to-end: from accumulator init → addNonNull → subtractNonNegative → roundMoney → record fields. Critical for downstream — line 4a blank-when-fully-taxable test (Issue #3) AND buildIncome.setIraDistributions gate (line 4229) both depend on null-vs-positive distinction. Closure: 12-line breadcrumb above the IraPersonComputation return site documenting all 5 compliance points + critical downstream consumers + cross-reference to 2a #5 + 3a #4 + 3b #4 (same compliance shape). No code change.', 'TaxReturnComputeService.java:5466 (return); 12-line breadcrumb above the IraPersonComputation constructor', 'CLOSED — verified correct. Breadcrumb mirrors 3a #4 / 3b #4 pattern.'],
  [6, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — NON-IRA 1099-R ENTRIES EXCLUDED VIA iraSepSimple FILTER', 'Per IRS routing rule: 1099-R box "IRA/SEP/SIMPLE" checkbox routes entry to lines 4a/4b/4c when true; to lines 5a/5b/5c when false. Same `form1099REntries` list shared between `computeIraDistributions` and `computePensionAnnuities`, with mutually exclusive filters → no double-counting. Implementation at TaxReturnComputeService.java:5375: first guard in the loop, skips non-IRA entries before SSN attribution check. Closure: 8-line breadcrumb above the filter documenting the IRA-vs-pension routing rule + mutually-exclusive complement in computePensionAnnuities + cross-reference to lines/4abc.md §1. No code change.', 'TaxReturnComputeService.java:5374-5383 (8-line breadcrumb above IRA-only filter)', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [7, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — ROTH CODE Q HANDLING (FULLY-QUALIFIED, NO FORM 8606)', 'Per IRS Form 8606 instructions: code Q = fully qualified Roth distribution (5-year rule met AND qualifying event) → fully tax-free, no Form 8606 Part III needed. Codes J/T require Form 8606 Part III for basis recovery. Two-counter design at TaxReturnComputeService.java:5395-5418: `rothCodeCount` tracks any Roth code (J/Q/T); `rothCodeJOrTCount` tracks J/T only. `allRothEntriesFullyQualified` (line ~5418) true when rothCodeCount > 0 AND rothCodeJOrTCount == 0 → Roth side does NOT contribute to hasException2 → no Form 8606. This is the fix from lines/4abc.md §11 Known Limitation #1, applied 2026-04-14 (pre-fix bug unnecessarily generated Form 8606 for code Q). Closure: 13-line breadcrumb above the Roth-code tracking block documenting the two-counter design + IRS rule + qualifying events list + historical fix reference. No code change.', 'TaxReturnComputeService.java:5395-5418 (13-line breadcrumb above Roth-code tracking)', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [8, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — POST-70½ DEDUCTIBLE CONTRIBUTION REDUCTION (OWN VS INHERITED)', 'Per IRC §408(d)(8)(B) + IRS Pub. 590-B: post-70½ deductible IRA contributions reduce QCD exclusion dollar-for-dollar (double-dip prevention). Critical CARVE-OUT: reduction applies ONLY to taxpayer\'s OWN IRA QCDs, NOT inherited IRA QCDs (different basis tracking). Implementation at TaxReturnComputeService.java:5455-5468 correctly implements 5-step flow: (1) totalQcd includes own+inherited; (2) inheritedQcd is user-entered subset; (3) ownQcd = total − inherited; (4) effectiveOwnQcd = own − post70halfDeduction (reduction here only); (5) effectiveQcd = effectiveOwnQcd + inheritedQcd (inherited rejoins unscathed). Closure: replaced the inline 2-line comment with a 17-line breadcrumb documenting the IRC source + double-dip rationale + critical inherited carve-out + 5-step computation flow + cross-reference to 2026-04-15 fix (Known Limitation #2 + own-vs-inherited split added on top). No code change.', 'TaxReturnComputeService.java:5443-5468 (17-line breadcrumb above QCD post-70½ reduction)', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [9, 'DEFERRED 2026-05-11 — QCD $108,000 ANNUAL CAP + SIE $54,000 CAP NOT ENFORCED', 'Per IRC §408(d)(8)(F) + IRS 2025 Pub. 526: QCD annual exclusion capped at $108,000 per person; one-time SIE election capped at $54,000 (in the $108k annual cap). Grep verified: `TaxReturnComputeService.java` contains 0 hits for "108000" or "54000" — neither cap enforced. User entering $150k QCD would see full amount subtracted → line 4b under-reported by $42k → IRS validation catches at filing. Closure: deferred to outstanding.md "Line 4abc: QCD $108,000 Annual Cap + SIE $54,000 Cap Enforcement — Deferred 2026-05-11" with ~30-45 min implementation sketch (2 ReferenceData constants + per-person cap check at computeIraForPerson + 2 lock-in tests + spec/knowledge-file updates). Open design question documented: flag-only vs silent cap. No breadcrumb at the QCD computation site — a "we don\'t enforce the cap" comment would be noise. Same closure shape as 3a #10 (non-treaty foreign corp manual-classification gap).', 'outstanding.md (new entry); no code change today', 'CLOSED with deferral — entry added. Affected population narrow (high-QCD retirees); IRS validation is the safety net.'],
  [10, 'RESOLVED 2026-05-11 — OBSERVATION — LINE 4a IS THE FIRST IRA-FAMILY LINE AUDIT (POSITIONS FUTURE 4b/4c)', 'Lines 4a/4b/4c form an interconnected cluster (like 3a/3b/3c). Line 4a established 9 patterns for the IRA family: MFS guard (#1 — extends cascade to 9 orchestrators), knowledge-file rename (#2 — convergence at 11 lines), blank-when-fully-taxable (#3), line-9 6-audit consolidation + new "gross-vs-taxable" pattern (#4), 0-vs-null compliance (#5), iraSepSimple filter (#6), Roth code Q handling (#7), QCD post-70½ own-vs-inherited (#8), QCD cap deferral (#9). Future line 4b audit will likely cross-reference all of these via multi-audit-trail consolidation pattern — extending line-9 breadcrumb to 7 audits, MFS guard to cover line 4b explicitly, 0-vs-null to enumerate all IraPersonComputation BigDecimal fields. Future line 4c audit will be metadata-heavy (Boolean checkboxes — same pattern as line 3c with TRUE-or-null semantic). Closure: pure xlsx-flip observation — no code change. The xlsx audit-trail itself is the position marker for future 4b/4c walkthroughs. Same closure shape as 3c #10 (line 7b forward-reference), 3a #8 / 3c #1 (pure xlsx-flip).', 'XLS/computations/4a.xlsx audit-trail (this row); no code change', 'CLOSED — pure xlsx-flip observation. Positions future 4b and 4c audits.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 35 }, { wch: 95 }, { wch: 65 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 4a Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.iraDistributions', 'topmostSubform[0].Page1[0].f1_62[0] (line4a_ira_distributions)', 'form-tax-return-1040.xlsx (line 4a cell)', '★ Primary output. Stored only when non-null. Blank when fully-taxable simple case.'],
  ['form1040.income.taxableIraDistributions', 'topmostSubform[0].Page1[0].f1_63[0] (line4b_ira_taxable_amount)', 'form-tax-return-1040.xlsx (line 4b cell)', '★ Sibling output. Carries taxable portion → enters line 9.'],
  [],
  ['SECONDARY OUTPUTS (Line 4c family)'],
  ['form1040.income.line4cBox1 (rollover checkbox)', 'topmostSubform[0].Page1[0].c1_35[0]', 'form-tax-return-1040.xlsx', 'Checked when any rollover exception.'],
  ['form1040.income.line4cBox2 (QCD checkbox)', 'topmostSubform[0].Page1[0].c1_36[0]', 'form-tax-return-1040.xlsx', 'Checked when any QCD exception.'],
  ['form1040.income.line4cBox3 (other / HFD checkbox)', 'topmostSubform[0].Page1[0].c1_37[0]', 'form-tax-return-1040.xlsx', 'Checked when HFD or other write-in.'],
  ['form1040.income.line4cBox3Text', 'topmostSubform[0].Page1[0].line4c_other_write_in_text', 'form-tax-return-1040.xlsx', 'Write-in space (e.g., "HFD").'],
  [],
  ['ATTACHED FORMS'],
  ['Form 8606 (taxpayer)', '—', 'form-tax-return-8606-taxpayer.xlsx', 'Generated when taxpayer hasException2 true.'],
  ['Form 8606 (spouse)', '—', 'form-tax-return-8606-spouse.xlsx', 'Generated when spouse hasException2 true.'],
  [],
  ['DOWNSTREAM CONSUMERS'],
  ['Form 1040 line 9 (total income) — via line 4b', '—', 'form-tax-return-1040.xlsx', '★ Line 4b (NOT line 4a) is the 4th operand in the line-9 formula.'],
  ['Form 1040 line 11a/11b (AGI), line 15 (taxable income)', '—', 'form-tax-return-1040.xlsx', 'Indirect via line 9 contribution.'],
  ['Form 1040 line 25b withholding (from 1099-R box 4)', '—', 'form-tax-return-1040.xlsx', 'Box 4 federal withholding routes to line 25b separately (NOT a line 4a path).'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 directly from line 4a', '—', '—', 'Line 4a (gross) is excluded; only line 4b (taxable) enters line 9.'],
  ['Schedule B', '—', '—', 'IRA distributions don\'t flow to Schedule B (which is for interest + dividends only).'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 70 }, { wch: 55 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
