// ============================================================================
//  Generates: C:\us-tax\XLS\computations\4b.xlsx
//
//  Source-of-truth references:
//    - lines/4abc.md §3 Core 2025 IRS Rule + §6 Computation Rules
//    - dependencies/4abc.md
//    - knowledge/line-4abc-ira-distributions.md (renamed 2026-05-11 via 4a #2)
//    - TaxReturnComputeService.computeIraDistributions() lines ~5087-5326 (orchestrator with MFS guard from 4a #1)
//    - TaxReturnComputeService.computeIraForPerson() lines ~5359-5500+ (per-person aggregator)
//    - TaxReturnComputeService.buildForm8606() (Form 8606 generation when Exception 2 applies)
//    - PDF semantic CSV: f1040_field_mapping_semantic.csv row 77 (f1_63[0] line4b_ira_taxable_amount)
//    - IRS 2025 Form 1040 instructions for line 4b
//    - IRS 2025 Form 8606 instructions (Part I/II/III)
//    - IRS Publication 590-B (IRA distributions and basis)
//    - IRC §61 (gross income includes IRA distributions to extent taxable)
//
//  Tax year: 2025
//
//  NOTE: Line 4b is the TAXABLE-amount line of the IRA family — the value-bearing counterpart
//  to line 4a (gross/disclosure). Per the "gross-vs-taxable" pattern established during 4a #4,
//  line 4b IS the operand in line 9 (line 4a is excluded as disclosure-only). Like 2b vs 2a
//  and 3b vs 3a, this audit is shared-aggregator cross-reference-heavy — most concerns are
//  cross-references to 4a closures.
//
//  Line 4b-specific verifications focus on:
//   • Per-person `taxableAfterExceptions` subtractNonNegative chain (taxableBox2a − rollover
//     − effectiveQcd − hfd)
//   • Form 8606 override logic when hasException2 (Part I + Part II + Part III addNonNull)
//   • Line 4b zero-floor (subtractNonNegative + roundMoney)
//   • Line 4b INCLUDED in line 9 (inverse of 4a #4)
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '4b.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 4b — IRA DISTRIBUTIONS TAXABLE AMOUNT'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 4b'],
  ['Concept', 'TAXABLE amount of IRA distributions for the return (taxpayer + spouse aggregated). Per IRS 2025 Form 1040 instructions: line 4b is the IRA portion that enters gross income under IRC §61. **Line 4b IS the operand in line 9** (the value-bearing counterpart to line 4a, which is disclosure-only). Per the "gross-vs-taxable" pattern (4a #4): gross side excluded from line 9, taxable side included.'],
  ['Core invariant', 'Line 4b ≥ 0 (zero-floor via subtractNonNegative). Line 4b ≤ Line 4a (taxable cannot exceed gross). When fully-taxable simple case: Line 4b = full gross AND line 4a = blank (per IRS rule from 4a #3).'],
  ['Per-Person Formula', 'taxableBox2a = Σ 1099-R box 2a (IRA-only filtered)\neffectiveQcd = (ownIraQcd − post70halfDeduction) + inheritedIraQcd  // from 4a #8\ntaxableAfterExceptions = subtractNonNegative(taxableBox2a, addNonNull(rollover, effectiveQcd, hfd))\n\n**Form 8606 override path** (when hasException2):\n  form8606Taxable = addNonNull(addNonNull(form8606.Part1Line15c, form8606.Part2Line18), form8606.Part3Line25c)\n  if (form8606Taxable != null): taxableAmount = form8606Taxable  // overrides taxableAfterExceptions\n  else: taxableAmount = taxableAfterExceptions\n\nperson.taxableIraDistributions = taxableAmount'],
  ['Per-Return Formula', 'taxableIra = addNonNull(taxpayer.taxableIraDistributions, spouse.taxableIraDistributions)\n**line4b = roundMoney(taxableIra)**\n\n(unlike line 4a, line 4b does NOT have a blank-when-fully-taxable rule — it always carries the taxable amount when there is IRA activity.)'],
  ['Filed', 'Form 1040 line 4b. PDF field: topmostSubform[0].Page1[0].f1_63[0] (semantic: line4b_ira_taxable_amount). Sibling line 4a at f1_62[0].'],
  ['Backend method', 'TaxReturnComputeService.computeIraDistributions() — orchestrator (MFS guard from 4a #1 protects line 4b).\nTaxReturnComputeService.computeIraForPerson() — per-person aggregator with subtractNonNegative chain + Form 8606 override.'],
  ['Output', 'form1040.income.taxableIraDistributions (BigDecimal; null when no IRA activity; ZERO when IRA activity but fully excluded via rollover/QCD/HFD). When non-null, enters the line 9 addNonNull chain as the 4th operand.'],
  ['IRS source', 'IRS 2025 Form 1040 instructions for line 4b; IRS 2025 Form 8606 instructions Part I/II/III; IRS Pub. 590-B; IRC §61 (gross income)'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Filter 1099-R entries by IRA flag + recipient SSN', 'Same path as line 4a. iraSepSimple gate (4a #6) + belongsToPersonIra (MFS-protected via 4a #1).'],
  [2, 'Per-person: accumulate taxableBox2a (1099-R box 2a)', '`taxableBox2a = addNonNull(taxableBox2a, parseAmount(entry.get("taxableAmountAmount")))` at line 5391.\nThe IRS box 2a captures what the trustee considers taxable BEFORE applying user-side exceptions (rollover/QCD/HFD/Form 8606 basis).'],
  [3, 'Per-person: compute exception amounts', 'rolloverAmount = totalIraRolloverAmount.\neffectiveQcdAmount = (ownIraQcd − post70halfDeduction) + inheritedIraQcd  (4a #8).\nhfdAmount = totalHfdAmount.'],
  [4, 'Per-person: subtractNonNegative chain for taxableAfterExceptions', '`taxableAfterExceptions = subtractNonNegative(taxableBox2a, addNonNull(addNonNull(rolloverAmount, effectiveQcdAmount), hfdAmount))` at lines 5467-5470.\nZero-floor: if sum-of-exceptions > taxableBox2a, result clamps to ZERO. Null-preservation: if taxableBox2a is null, result is null.'],
  [5, 'Per-person: detect hasException2 (Form 8606 triggers)', 'hasNondeductibleTraditionalBasis OR hasTraditionalToRothConversion OR (hasRothIraDistributions AND NOT allRothEntriesFullyQualified) OR hadReturnOfContributionOrRecharacterization OR rothCodeJOrTCount > 0. (Roth code Q alone does NOT trigger — see 4a #7.)'],
  [6, 'Per-person: Form 8606 generation + override', 'When hasException2: buildForm8606(...) generates the form. form8606Taxable = addNonNull(Part1Line15c, Part2Line18, Part3Line25c). If form8606Taxable non-null, OVERRIDES taxableAfterExceptions.\nWhen !hasException2 OR form8606Taxable is null: taxableAmount stays as taxableAfterExceptions.'],
  [7, 'Per-person: return taxableAmount in IraPersonComputation', '`taxableIraDistributions` field on IraPersonComputation = roundMoney(taxableAmount). Null-preserving via roundMoney(null)→null (4a #5).'],
  [8, 'Return-level: aggregate taxableIra across spouses', '`taxableIra = addNonNull(taxpayer.taxableIraDistributions(), spouse.taxableIraDistributions())` at line 5314 (line numbers approximate; shifted by 4a closures). MFS guard from 4a #1 ensures spouse contribution is null on MFS → aggregation stays taxpayer-only.'],
  [9, 'Return-level: line 4b = roundMoney(taxableIra)', '`BigDecimal line4b = roundMoney(taxableIra)`. UNLIKE LINE 4a, no blank-when-fully-taxable rule — line 4b always carries the taxable amount when there is IRA activity.'],
  [10, 'Persist on form1040.income; flow into line 9', '`income.setTaxableIraDistributions(line4b)` (only when non-null). Line 4b is the 4th operand in the line 9 addNonNull chain (4a #4 + 4b #5 multi-audit consolidation).'],
  [],
  ['MUTUAL EXCLUSION RULES (enforced by code or spec)'],
  ['Rule', 'Implementation', 'Why'],
  ['Line 4b ≥ 0 (zero-floor)', 'subtractNonNegative at line 5467-5470 floors at zero. Form 8606 override path: Part I line 15c is itself max(0, ...) per IRS Form 8606 instructions.', 'Negative taxable income from IRA would imply a refund-of-prior-tax mechanism that doesn\'t exist in IRC §61. Zero-floor matches IRS rule.'],
  ['Line 4b IS in line 9 (4th operand)', 'Line 9 formula at line 4150-4153 includes line 4b. Multi-audit breadcrumb at lines 4135-4151 cites 4a #4 (exclusion) + 4b #5 (inclusion).', 'IRC §61: taxable IRA distributions are gross income. Inverse confirmation of 4a #4 (gross excluded as disclosure-only).'],
  ['Form 8606 override only when hasException2 AND form8606Taxable non-null', 'Line 5474-5483: `if (hasException2) { ... if (form8606Taxable != null) taxableAmount = form8606Taxable; }`.', 'Form 8606 is generated only when basis tracking applies (Exception 2). When Form 8606 produces no taxable amount (all parts null), the subtractNonNegative-based taxableAfterExceptions is the answer.'],
  ['No double-counting between exceptions and Form 8606', 'Rollover + effectiveQcd + HFD are subtracted from taxableBox2a in taxableAfterExceptions. When hasException2 also fires, form8606Taxable OVERRIDES (not adds to) taxableAfterExceptions.', 'Prevents double-counting: Form 8606 Part I already handles basis recovery and traditional IRA exceptions internally.'],
  [],
  ['DECISION TREE — when does each value appear on line 4b?'],
  ['Scenario', 'Line 4a result', 'Line 4b result'],
  ['No 1099-R IRA entries; hadIraDistributions=false', 'null (blank)', 'null (blank)'],
  ['1099-R box 1 = $10,000, box 2a = $10,000, no exception, no Form 8606 (fully-taxable simple case)', 'null (blank per 4a #3)', '$10,000 (taxableBox2a; no exceptions to subtract)'],
  ['1099-R box 1 = $10,000, all rolled over (Exception 1)', '$10,000', '$0 (subtractNonNegative(10000, 10000) = 0; zero-floor)'],
  ['1099-R box 1 = $10,000, $5,000 rolled over, $5,000 taxable', '$10,000', '$5,000 (10000 − 5000)'],
  ['1099-R box 1 = $10,000, all QCD with $1,000 post-70½ deduction', '$10,000', '$1,000 (effectiveQcd = $10,000 − $1,000 = $9,000; subtractNonNegative(10000, 9000) = $1,000)'],
  ['1099-R box 1 = $10,000, HFD $3,000', '$10,000', '$7,000 (10000 − 3000)'],
  ['Traditional IRA with nondeductible basis (Form 8606 Part I)', '$10,000', '(Form 8606 Part I line 15c — basis recovery)'],
  ['Roth conversion (Form 8606 Part II)', '$10,000', '(Form 8606 Part II line 18 — full converted amount taxable)'],
  ['Roth distribution with code J or T (Form 8606 Part III)', '$10,000', '(Form 8606 Part III line 25c)'],
  ['Roth with code Q only (fully qualified)', 'null (no exception; treated as simple case)', '$0 or null'],
  ['MFS return; only spouse has IRA', 'null (protected via 4a #1 MFS guard)', 'null (protected via 4a #1 MFS guard)'],
  ['Combined: traditional basis + rollover', '(gross)', '(Form 8606 result overrides — exceptions handled in Part I)'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 4b Flows'],
  ['Consumer', 'How', 'Notes'],
  ['Form 1040 line 9 (total income) — ★ PRIMARY DOWNSTREAM', 'Line 9 formula at line 4150-4153 — line 4b is the 4th operand. Multi-audit breadcrumb cites 6 audit IDs after 4a #4 closure (will reach 7 after 4b #5).', '★ Critical: IRC §61 gross income inclusion.'],
  ['Form 1040 line 11a/11b (AGI), line 15 (taxable income)', 'Indirect via line 9 contribution.', 'Carries the full taxable IRA amount through the income waterfall.'],
  ['Form 1040 line 4a — sibling output', 'income.setIraDistributions(line4a) at buildIncome', 'Line 4b is NOT identical to line 4a (gross). Line 4a may be blank when fully-taxable; line 4b is always present when IRA activity exists.'],
  ['Form 8606 generation (taxpayer / spouse)', 'When hasException2, Form 8606 is generated and its Parts I/II/III taxable amounts feed line 4b via the override path.', 'Form 8606 is attached to the return for IRS basis-tracking documentation.'],
  ['NOT in Schedule B', '—', 'IRA distributions don\'t flow to Schedule B (which is for interest + dividends only).'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 26 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 4b'],
  ['Line 4b inputs overlap heavily with line 4a (same 1099-R IRA filter + same personal forms). Differences: line 4b uses 1099-R box 2a (taxable) primarily, plus exception subtractions, plus Form 8606 override when basis tracking applies.'],
  [],
  ['#', 'Source xlsx', 'Field path / model key', 'Label / box', 'Required?', 'Role in line 4b compute', 'Cross-reference'],
  [],
  ['STATEMENT INPUTS — 1099-R'],
  [1, 'form-1099-r.xlsx', 'iraSepSimple', 'IRA/SEP/SIMPLE box', 'YES — primary filter', 'Step 1: gate (4a #6). Non-IRA → routes to lines 5a/5b/5c.', 'lines/4abc.md §1'],
  [2, 'form-1099-r.xlsx', 'taxableAmountAmount (box 2a)', '1099-R box 2a "Taxable amount"', 'YES — primary line 4b feed', '★ Step 2: `taxableBox2a += entry.box2a`. The trustee-reported taxable amount before user-side exceptions.', 'IRS 1099-R box 2a'],
  [3, 'form-1099-r.xlsx', 'grossDistributionAmount (box 1)', '1099-R box 1 "Gross distribution"', 'NO for line 4b (used by line 4a)', 'Indirect: feeds grossTraditionalIra for Form 8606 Part I line 7 computation.', '4a Inputs #2'],
  [4, 'form-1099-r.xlsx', 'taxableAmountNotDetermined (box 2b)', '1099-R box 2b checkbox', 'NO — verification', 'When true: trustee couldn\'t determine taxable → user must verify. Increments taxableNotDeterminedCount.', 'IRS 1099-R box 2b'],
  [5, 'form-1099-r.xlsx', 'distributionCodes (box 7)', '1099-R box 7 codes', 'YES — for Form 8606 routing', 'Codes J/T → Form 8606 Part III (hasException2). Code Q alone → simple case (no Form 8606).', '4a #7'],
  [6, 'form-1099-r.xlsx', 'recipientTIN', '1099-R recipient TIN', 'YES — for SSN attribution', 'belongsToPersonIra. **MFS-protected via 4a #1** (spouseSsn nulled on MFS).', '4a #1'],
  [],
  ['PERSONAL FORM INPUTS — Exceptions (subtract from taxableBox2a)'],
  [7, 'form-ira-income-taxpayer.xlsx', 'rollover.totalIraRolloverAmount', 'Total rollover amount', 'NO — Exception 1', '★ Step 3: subtracted from taxableBox2a. Affects line 4b directly.', 'IRS Exception 1'],
  [8, 'form-ira-income-taxpayer.xlsx', 'qcd.totalQcdAmount', 'Total QCD amount', 'NO — Exception 3', '★ Step 3 (via effectiveQcd): reduced by post-70½ deduction (own only). Affects line 4b.', '4a #8'],
  [9, 'form-ira-income-taxpayer.xlsx', 'qcd.inheritedIraQcdAmount', 'Inherited IRA QCD', 'NO', 'Subset of totalQcdAmount. NOT reduced by post-70½ (per Pub. 590-B carve-out).', '4a #8'],
  [10, 'form-ira-income-taxpayer.xlsx', 'qcd.deductibleIraContributionsAfterAge70Half', 'Post-70½ deductible contribs', 'NO', 'Reduces effective OWN QCD only (not inherited). Affects line 4b.', '4a #8'],
  [11, 'form-ira-income-taxpayer.xlsx', 'hfd.totalHfdAmount', 'Total HFD amount', 'NO — Exception 4', '★ Step 3: subtracted from taxableBox2a. Affects line 4b.', 'IRS Exception 4'],
  [],
  ['PERSONAL FORM INPUTS — Form 8606 triggers (override path)'],
  [12, 'form-ira-income-taxpayer.xlsx', 'form8606.hasNondeductibleTraditionalBasis', 'Have basis from prior Form 8606?', 'NO — Exception 2 gate', 'Triggers hasException2 → Form 8606 generated → Part I line 15c may OVERRIDE taxableAfterExceptions.', 'IRS Form 8606 Part I'],
  [13, 'form-ira-income-taxpayer.xlsx', 'form8606.hasTraditionalToRothConversion', 'Roth conversion in 2025?', 'NO — Exception 2 gate', 'Triggers hasException2 → Form 8606 Part II line 18 contributes to override.', 'IRS Form 8606 Part II'],
  [14, 'form-ira-income-taxpayer.xlsx', 'form8606.hasRothIraDistributions', 'Roth distributions (non-fully-qualified)?', 'NO — Exception 2 gate', 'Triggers hasException2 only when NOT all Roth code Q (allRothEntriesFullyQualified=false).', '4a #7'],
  [15, 'form-ira-income-taxpayer.xlsx', 'form8606.priorYearTraditionalIraBasis', 'Prior-year Form 8606 line 14', 'NO', 'Feeds Form 8606 Part I line 2 → affects line 15c (line 4b override).', 'IRS Form 8606 Part I'],
  [16, 'form-ira-income-taxpayer.xlsx', 'form8606.nondeductibleContributionsCurrentYear', 'Current-year nondeductible contribs', 'NO', 'Feeds Form 8606 Part I line 1 → affects basis → affects line 15c.', 'IRS Form 8606 Part I'],
  [17, 'form-ira-income-taxpayer.xlsx', 'form8606.valueAllTraditionalSepSimpleIrasAtYearEnd', 'Year-end IRA value', 'NO', 'Feeds Form 8606 Part I line 6 → basis ratio denominator.', 'IRS Form 8606 Part I'],
  [18, 'form-ira-income-taxpayer.xlsx', 'form8606.totalTraditionalIraConvertedToRothFor8606Line8', 'Conversion amount', 'NO', 'Feeds Form 8606 Part I line 8 + Part II.', 'IRS Form 8606 Part II'],
  [],
  ['IDENTITY INPUTS'],
  [19, 'form-identification-taxpayer.xlsx', 'taxpayerIdentity.ssn', 'Taxpayer SSN', 'YES — drives 1099-R attribution', 'belongsToPersonIra. MFS-protected.', '4a #1'],
  [20, 'form-identification-spouse.xlsx', 'spouseIdentity.spouseSsn', 'Spouse SSN', 'YES on MFJ', 'Nulled on MFS via 4a #1 guard.', '4a #1'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 42 }, { wch: 65 }, { wch: 55 }, { wch: 30 }, { wch: 80 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 4b'],
  ['Line 4b shares the same reference data as line 4a (4a Reference Data sheet) — QCD caps, Form 8606 thresholds, etc. The 4b-specific items below highlight the constants that gate the per-person taxableAfterExceptions formula.'],
  [],
  ['Constant', 'Value', 'Source', 'Used by line 4b?', 'Notes'],
  [],
  ['Direct — QCD limits (affect effectiveQcd → line 4b subtraction)'],
  ['QCD_ANNUAL_CAP_2025', '$108,000', 'IRS 2025 Pub. 526 (inflation-adjusted from $105,000 in 2024)', 'NOT ENFORCED (4a #9 deferred)', 'When user-entered totalQcdAmount exceeds $108k, the excess SHOULD reduce line 4b less — but currently subtracted in full. See 4a #9 deferral.'],
  ['QCD_SIE_CAP_2025', '$54,000', 'IRS 2025 Pub. 526', 'NOT ENFORCED', 'SIE election cap within the $108k annual cap.'],
  [],
  ['Indirect — Form 8606 (path-determining)'],
  ['FORM8606_PART_I_LINE_15C_RULE', 'max(0, ...)', 'IRS Form 8606 line 15c instructions', 'INDIRECT', 'Form 8606 Part I line 15c is itself zero-floored — protects line 4b override path from going negative.'],
  ['FORM8814_BASE_AMOUNT', '$2,700', 'ReferenceData.FORM8814_BASE_AMOUNT', 'N/A', 'Form 8814 is for CHILD interest/dividends; not relevant to line 4b (line 4b is parent\'s IRA).'],
  [],
  ['Statutory references'],
  ['Gross income includes taxable IRA distributions', 'IRC §61', 'Line 4b enters line 9 (total income) per IRC §61. Inverse of line 4a (gross/disclosure not in income).'],
  ['Form 8606 nondeductible IRA basis tracking', 'IRC §408A; IRS Form 8606 instructions', 'Per-person basis tracking. Generates line 4b via Part I + Part II + Part III addNonNull.'],
  ['Rollover treatment', 'IRC §408(d)(3); IRS Pub. 590-B', 'Rolled-over portion is NOT taxable. Subtracted from taxableBox2a in line 4b chain.'],
  ['QCD exclusion', 'IRC §408(d)(8); IRS Pub. 526', 'QCD amount is NOT taxable. Subtracted in line 4b chain (with post-70½ carve-out from 4a #8).'],
  ['HFD exclusion', 'IRC §408(d)(9); IRS Pub. 969', 'HFD amount is NOT taxable. Subtracted in line 4b chain.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 42 }, { wch: 20 }, { wch: 50 }, { wch: 28 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 4b IS the Income Operand (Primary Downstream)'],
  ['Unlike line 4a which is disclosure-only, line 4b is the value-bearing line that enters line 9 → AGI → taxable income → tax.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['Form 1040 line 4b (the cell itself)', 'TaxReturnComputeService.buildIncome() — income.setTaxableIraDistributions(line4b)', '★ Primary output. Stored when non-null. Whole-dollar HALF_UP rounded.'],
  ['Form 1040 line 9 (total income)', 'Line 9 formula at line 4150-4153 — line 4b is the 4th operand.', '★★ CRITICAL: IRC §61 inclusion. Carries through to AGI / taxable income / tax owed.'],
  ['Form 1040 line 11a/11b (AGI), line 15 (taxable income)', 'Indirect via line 9.', 'Full taxable IRA amount propagates.'],
  ['Form 1040 line 4a (sibling)', 'income.setIraDistributions(line4a) at buildIncome', 'Line 4a may be blank (fully-taxable simple case) while line 4b carries the value.'],
  ['Form 8606 (taxpayer / spouse) attached forms', 'When hasException2: generated and overrides line 4b via Part I+II+III addNonNull.', 'Per-person, never joint.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Schedule B', '—', 'IRA distributions don\'t flow to Schedule B (interest + dividends only).'],
  ['Form 8960 NIIT', '—', 'Out of scope per CLAUDE.md.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 4b Participates in Shared 4abc Flags'],
  ['No line-4b-specific flags. Same flag set as line 4a (covered by 4a Validation Flags sheet).'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED', 'BLOCKING', 'Multi-exception case without breakout statement', '4a Validation Flags'],
  ['IRA_ROLLOVER_ATTACHMENT_REVIEW', 'NON-BLOCKING', 'Qualified plan rollover or 2026 completion', '4a Validation Flags'],
  ['IRA_QCD_SIE_ATTACHMENT_REVIEW', 'NON-BLOCKING', 'One-time SIE QCD', '4a Validation Flags'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 50 }, { wch: 28 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 4b shares the same orchestrator (`computeIraDistributions`) AND per-person aggregator (`computeIraForPerson`) with line 4a. Like 2b vs 2a and 3b vs 3a, this audit is shared-aggregator cross-reference-heavy. Most concerns extend prior 4a closures via multi-audit-trail consolidation. Verified 2026-05-11.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-11 — CROSS-REFERENCE — MFS GUARD CASCADE ALREADY APPLIES (4a #1 + 4b #1, 2-AUDIT CONSOLIDATION)', 'Line 4b is one of the 7+ outputs in the 4a #1 high-leverage MFS cascade. **Line 4b is the BOTTOM-LINE REVENUE-BEARING line** of the IRA pair (line 4b IS in line 9 per 4b #5; line 4a excluded per 4a #4 gross-vs-taxable pattern), so MFS protection here has more bottom-line tax impact than on line 4a. Closure: extended the MFS-guard breadcrumb at TaxReturnComputeService.java:5100-5118 from citing "4a #1" to "4a #1 + 4b #1, both verified 2026-05-11" — multi-audit-trail consolidation now **2 audit IDs** at this site. Added a clarifying sentence noting the bottom-line tax impact. Lock-in test `mfsExcludesSpouseIraFromLine4a` (added during 4a #1) explicitly asserts line 4b = $5,000 (taxpayer-only) — re-run passed.', 'TaxReturnComputeService.java:5100-5118 (extended 2-audit MFS-guard breadcrumb); test mfsExcludesSpouseIraFromLine4a (re-run pass)', 'CLOSED via 4a #1 cascade — multi-audit consolidation extended.'],
  [2, 'RESOLVED 2026-05-11 — CROSS-REFERENCE — KNOWLEDGE FILE ALREADY RENAMED VIA 4a #2', '`knowledge/line-4abc-ira-distributions.md` (renamed from `knowledge_line4abc_ira.md` during 4a #2 earlier today) is a shared file covering all three IRA-family lines (4a + 4b + future 4c). YAML frontmatter `name:` already updated. Header-comment reference in `generate-4b.js` already uses the new name (written after the rename). No other inbound references (grep verified during 4a #2). Pure xlsx-flip closure — same shape as 2b #3 (closed via 2a #4), 3b #2 (closed via 3a #2), 3c #2 (closed via 3a #2). Line 1c → 4abc naming convergence remains complete across 11 lines.', 'C:\\us-tax\\knowledge\\line-4abc-ira-distributions.md (already correctly named)', 'CLOSED via 4a #2 — pure xlsx-flip closure. No action needed for 4b walkthrough.'],
  [3, 'RESOLVED 2026-05-11 — SPEC §13 VERIFICATION LOG EXTENDED WITH 4b ROW', 'lines/4abc.md §13 verification log was added during 4a closure docs-update step with one inaugural row capturing the 4a walkthrough. Closure: appended a 2nd in-progress row capturing the 4b walkthrough as a separate event from 4a (same date 2026-05-11). Audit-trail-per-walkthrough convention preserved (matches 2b #2 / 3b #3 / 3c #3 which appended rows to lines/2ab.md §12 / lines/3abc.md §15). The 4b row will be finalized to "COMPLETE — 10/10 closed" during end-of-walkthrough docs-update step.', 'lines/4abc.md §13 (4b row added as 2nd row)', 'CLOSED — spec verification log updated. Two rows now present (4a complete + 4b in progress).'],
  [4, 'RESOLVED 2026-05-11 — CROSS-REFERENCE — 0-VS-NULL COMPLIANCE EXTENDS TO LINE 4b PATH', 'Verified line-4b path through computeIraForPerson is null-preserving end-to-end: taxableBox2a init to null (line 5369) → addNonNull (line 5392) → subtractNonNegative (line 5467-5470, preserves null when taxableBox2a is null) → taxableAmount = taxableAfterExceptions (null pass-through, line 5473) → **Form 8606 override gate** (line 5474-5483, fires only when hasException2 AND form8606Taxable != null; when form8606Taxable is null, taxableAmount stays as the null taxableAfterExceptions) → roundMoney(null) → null at constructor. Critical because PDF rendering treats null fields as absent (line shows empty) — ZERO would display "$0" which is wrong for no-IRA-activity returns. Closure: expanded the existing 4a #5 breadcrumb at TaxReturnComputeService.java:5505-5521 from 12 lines to **20 lines**: enumerated SEPARATE gross-path and taxable-path traces (with Form 8606 override step explicit) + downstream PDF rendering semantic + multi-audit citation (4a #5 + 4b #4). Same shape as 2b #4 / 3b #4.', 'TaxReturnComputeService.java:5505-5524 (expanded 20-line breadcrumb with line-4b path trace + multi-audit citation)', 'CLOSED — verified-correct cross-reference. Breadcrumb expanded; no code change.'],
  [5, 'RESOLVED 2026-05-11 — CROSS-REFERENCE — LINE 4b IS IN LINE 9 (INVERSE OF 4a #4; 7-AUDIT CONSOLIDATION)', 'Line 9 formula at TaxReturnComputeService.java:4154-4157: line 4b is the 4th operand (INTENTIONALLY INCLUDED per IRC §61). Inverse confirmation of 4a #4 (line 4a EXCLUDED as gross/disclosure-only). Closure: extended the line-9 breadcrumb at lines 4135-4156 from **6 audit IDs** to **7 audit IDs** (added 4b #5). The 4a/4b pair now has BILATERAL coverage (4a #4 exclusion + 4b #5 inclusion) — establishes the verification template that future 5a/5b + 6a/6b audits will follow. Updated the line-4b operand description to credit 4b #5 (was credited to 4a #4 alone). Lock-in test `line9EqualsLine1zPlusOtherIncomeLines` re-run passed.', 'TaxReturnComputeService.java:4135-4156 (extended 7-audit breadcrumb + bilateral-coverage note); test line9EqualsLine1zPlusOtherIncomeLines (re-run pass)', 'CLOSED — verified-correct cross-reference. 7-audit consolidation + bilateral-coverage milestone for 4a/4b pair.'],
  [6, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — PER-PERSON taxableAfterExceptions THREE-PROTECTION CHAIN', 'At TaxReturnComputeService.java:5485-5488: `taxableAfterExceptions = subtractNonNegative(taxableBox2a, addNonNull(addNonNull(rolloverAmount, effectiveQcdAmount), hfdAmount))`. **Three protections in one expression**: (1) ZERO-FLOOR via subtractNonNegative — exceptions sum > taxableBox2a clamps to ZERO (IRC §61 — negative taxable IRA impossible); (2) NULL-PRESERVATION — taxableBox2a null → null result (PDF blank-not-zero rule); (3) effectiveQcdAmount uses OWN-VS-INHERITED CARVE-OUT from 4a #8. Closure: 13-line breadcrumb at lines 5473-5485 documenting the 3 protections + IRC §61 + IRS Pub. 590-B source + cross-reference to 4a #8 effectiveQcd computation + cross-reference to Form 8606 override path (which may REPLACE this value when hasException2 is true) + 3b #7 pattern reference. Same "three protections in one expression" pattern as 3b #7 nominee subtraction.', 'TaxReturnComputeService.java:5473-5485 (13-line breadcrumb above subtractNonNegative chain)', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [7, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — FORM 8606 OVERRIDE LOGIC (Part I + Part II + Part III addNonNull)', 'When `hasException2` fires, Form 8606 is generated and `form8606Taxable = addNonNull(addNonNull(Part1Line15c, Part2Line18), Part3Line25c)` REPLACES (not adds to) taxableAfterExceptions. Per IRS Form 8606 instructions: Form 8606 internally handles rollover/QCD/HFD treatment — adding both paths would double-count those exceptions. Closure: 17-line breadcrumb at TaxReturnComputeService.java:5491-5507 documenting (a) override-not-addition semantic + double-counting prevention; (b) the 5 hasException2 trigger conditions enumerated (basis from prior year, Roth conversion, non-Q Roth distribution, return of contribution, code J/T); (c) the three Form 8606 parts and what each computes (Part I basis recovery max-0-zero-floored, Part II conversion, Part III Roth ordering); (d) null-preserving addNonNull chain across the 3 parts; (e) cross-reference to 4b #8 (the redundant `hasNonZeroAmount || != null` gate simplification). No code change.', 'TaxReturnComputeService.java:5491-5507 (17-line breadcrumb above Form 8606 override branch)', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [8, 'RESOLVED 2026-05-11 — REDUNDANT CONDITION AT FORM 8606 OVERRIDE GATE — SIMPLIFIED', 'Original: `if (hasNonZeroAmount(form8606Taxable) || form8606Taxable != null)` — functionally equivalent to `if (form8606Taxable != null)` because `hasNonZeroAmount(x)` always implies non-null (the OR prefix is redundant). Applied Option A: simplified the condition to `if (form8606Taxable != null)` + added 5-line breadcrumb explaining the canonical 0-vs-null override semantic: null → concept doesn\'t apply, skip override; non-null (TRUE or ZERO) → Form 8606 computed a taxable amount (possibly $0 — e.g., full basis recovery), override taxableAfterExceptions. Behavior unchanged (functionally equivalent). Backend regression: 752/752 pass (no test changes — confirms equivalence).', 'TaxReturnComputeService.java (Form 8606 override gate simplified + 5-line breadcrumb)', 'CLOSED — Option A applied. Backend regression 752/752 pass.'],
  [9, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — LINE 4b ZERO-FLOOR + NULL-PRESERVATION (THREE LAYERS)', 'Pure xlsx-flip closure. **Three layers** protect line 4b: (L1) per-person zero-floor via `subtractNonNegative` at line 5485-5488 (breadcrumbed in 4b #6); (L2) Form 8606 Part I line 15c is itself max(0, ...) per IRS instructions (Form 8606\'s internal zero-floor protects the override path verified in 4b #7); (L3) `roundMoney(null) → null` at line 11763-11765 — verified gate from 4a #5 (re-verified in 4b #4). Four invariants satisfied: (a) line 4b ≥ 0; (b) line 4b null when no IRA activity; (c) line 4b ZERO when IRA activity but fully excluded (e.g., 100% rollover); (d) line 4b ≤ line 4a. All invariants are already breadcrumbed by prior closures — adding a new breadcrumb here would duplicate. Same closure shape as 3c #5 / 3c #7 / 3c #8 (pure xlsx-flip for already-protected invariants).', 'No new code — protected by 4b #6 + 4b #7 + 4a #5 / 4b #4 breadcrumbs', 'CLOSED — pure xlsx-flip cross-reference to L1+L2+L3 protections.'],
  [10, 'RESOLVED 2026-05-11 — OBSERVATION — 4a/4b BILATERAL COVERAGE COMPLETE (FIRST GROSS-VS-TAXABLE PAIR)', 'Per the "gross-vs-taxable" pattern introduced in 4a #4 and verified bilaterally in 4b #5: line 4a (gross) is EXCLUDED from line 9 as disclosure-only; line 4b (taxable) is INCLUDED in line 9 per IRC §61. The 4a/4b pair is the **first of three gross-vs-taxable distribution-line pairs** on Form 1040 — future 5a/5b (pension/annuity) and 6a/6b (social security) audits will inherit this verification template (cite the pattern without re-deriving the terminology; extend line-9 breadcrumb to 8+ audit IDs; reuse "blank-when-fully-taxable" + "IRC §61 inclusion" breadcrumb shapes). Pure xlsx-flip — the line-9 breadcrumb from Issue #5 already documents the bilateral-coverage milestone, so no new code change. Same shape as 4a #10 (first IRA-family audit positioning future 4b/4c), 3c #10 (line 7b sibling forward-reference), 3a #10 (forward-reference observation).', 'XLS/computations/4b.xlsx audit-trail (this row); no code change', 'CLOSED — pure xlsx-flip observation. Positions future 5a/5b + 6a/6b audits.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 32 }, { wch: 95 }, { wch: 65 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 4b Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.taxableIraDistributions', 'topmostSubform[0].Page1[0].f1_63[0] (line4b_ira_taxable_amount)', 'form-tax-return-1040.xlsx (line 4b cell)', '★ Primary output. Whole-dollar HALF_UP rounded.'],
  ['form1040.income.iraDistributions (sibling)', 'topmostSubform[0].Page1[0].f1_62[0] (line4a_ira_distributions)', 'form-tax-return-1040.xlsx (line 4a cell)', 'Line 4a — gross/disclosure (may be blank).'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 9 (total income)', '—', 'form-tax-return-1040.xlsx (line 9 cell)', '★★ INCLUDED as 4th operand. Carries to line 11a/11b AGI, line 15 taxable income, line 16 tax.'],
  ['Form 8606 (taxpayer / spouse)', '—', 'form-tax-return-8606-{taxpayer,spouse}.xlsx', 'When hasException2: generated and OVERRIDES taxableAfterExceptions.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Schedule B', '—', '—', 'IRA distributions don\'t flow to Schedule B (interest + dividends only).'],
  ['Form 8960 NIIT', '—', '—', 'Out of scope per CLAUDE.md.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 70 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
