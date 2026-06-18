// ============================================================================
//  Generates: C:\us-tax\XLS\computations\5a.xlsx
//
//  Source-of-truth references:
//    - lines/5abc.md §2-§3 (pension/annuity scope + line 5a/5b core rules)
//    - dependencies/5abc.md
//    - knowledge/line-5abc-pension-annuity.md (renamed 2026-05-12 via 5a #2 — was knowledge-line-5abc-pension-annuity.md)
//    - TaxReturnComputeService.computePensionAnnuities() lines ~5735-5850 (orchestrator)
//    - TaxReturnComputeService.computePensionForPerson() lines ~5853-5990 (per-person aggregator)
//    - PDF semantic CSV row 79 (f1_65[0] line5a_pensions_annuities)
//    - IRS 2025 Form 1040 line 5a/5b/5c instructions
//    - IRS Pub. 575 (Pension and Annuity Income)
//    - IRS Pub. 939 (General Rule for Pensions and Annuities)
//
//  Tax year: 2025
//
//  Critical findings flagged for this audit:
//   1. **MFS GUARD MISSING** at `computePensionAnnuities` (line 5735) — defensive gap
//      where spouse pension distributions could leak into MFS returns. Same shape as 4a #1.
//      Fix extends single-guard MFS cascade from 9 orchestrators to **10**:
//      (1c-1i + computeInterestIncome + computeIraDistributions + **computePensionAnnuities**).
//
//   2. Line 5a/5b mirrors the 4a/4b gross-vs-taxable pattern established during the IRA cluster:
//      • Line 5a = GROSS pension/annuity (blank when fully-taxable per IRS rule)
//      • Line 5b = TAXABLE pension/annuity (enters line 9 per IRC §61 + §72)
//      • Line 5c = exception disclosure (rollover box 1 / PSO box 2 / other box 3)
//
//   3. New for the 5abc cluster (not seen in 4abc):
//      • RRB-1099-R (Railroad Retirement) handling alongside Form 1099-R
//      • PSO (Public Safety Officer) exclusion (line 5c box 2 — different from IRA's QCD)
//      • Form 5329 (early-distribution additional tax) — analog to Form 8606 in IRA cluster
//      • `iraSepSimple` MIRROR filter — line 5a/5b processes the OPPOSITE side from line 4a/4b
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '5a.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 5a — PENSIONS AND ANNUITIES (GROSS AMOUNT)'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 5a'],
  ['Concept', 'GROSS amount of pension/annuity distributions for the return (taxpayer + spouse aggregated). Per IRS 2025 Form 1040 instructions: enter the GROSS distribution on line 5a ONLY when the pension/annuity is partially taxable (basis recovery, rollover, PSO exclusion, Simplified Method, or General Rule applies). When fully taxable with no basis/exception, **LEAVE LINE 5a BLANK** — only line 5b carries the taxable amount. **Same blank-when-fully-taxable rule as line 4a (gross-vs-taxable pattern from 4a #3).** Covers NON-IRA pension/annuity distributions — 1099-R (with iraSepSimple=FALSE), RRB-1099-R (Railroad Retirement), military retirement, qualified employer plans (401(k), 403(b), 457(b), etc.).'],
  ['Core invariant', 'Line 5a is null (blank) when fully-taxable simple case; otherwise = gross distribution total (≥ line 5b). Same pattern as line 4a. Per IRS Pub. 575 + §72.'],
  ['Per-Person Formula', 'gross1099R = Σ 1099-R box 1 (only entries with iraSepSimple=FALSE AND belongsToPersonIra — note shared SSN-attribution helper)\ngrossRrb = Σ RRB-1099-R box 7 (or sum of detail boxes 4+5+6 when box 7 absent)\nperson.grossPensionsAnnuities = addNonNull(gross1099R, grossRrb)'],
  ['Per-Return Formula', 'grossPensions = addNonNull(taxpayer.grossPensionsAnnuities, spouse.grossPensionsAnnuities)\ntaxablePensions = addNonNull(taxpayer.taxablePensionsAnnuities, spouse.taxablePensionsAnnuities)\nhasAnyException = taxpayer.hasAnyException OR spouse.hasAnyException\nfullyTaxableOverall = hasPositiveAmount(grossPensions) AND !hasAnyException AND hasPositiveAmount(taxablePensions) AND grossPensions == taxablePensions\n\n**line5a = fullyTaxableOverall ? null : roundMoney(grossPensions)**'],
  ['Filed', 'Form 1040 line 5a. PDF field: topmostSubform[0].Page1[0].f1_65[0] (semantic: line5a_pensions_annuities). Sibling line 5b at f1_66[0] (line5b_pensions_annuities_taxable_amount).'],
  ['Backend method', 'TaxReturnComputeService.computePensionAnnuities() lines ~5735-5850 (orchestrator).\nTaxReturnComputeService.computePensionForPerson() lines ~5853-5990 (per-person aggregator with 1099-R + RRB-1099-R handling).\n**⚠️ MISSING MFS GUARD**: orchestrator does NOT receive `isMfsReturn` parameter (Code Validation #1).'],
  ['Output', 'form1040.income.pensionsAndAnnuities (BigDecimal; null when fully-taxable simple case OR no pension activity). When non-null, rendered on Form 1040 line 5a.'],
  ['IRS source', 'IRS 2025 Form 1040 instructions for line 5a; IRS Pub. 575 (Pension and Annuity Income); IRS Pub. 939 (General Rule); IRC §72 (annuities); IRC §402 (qualified plans)'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Validate pension statement gating', 'validatePensionStatementGating at line 5750 — emits blocking flags if hadPensionOrAnnuityIncome=true but no 1099-R/RRB-1099-R uploaded.'],
  [2, 'Filter 1099-R entries — NON-IRA only', '**`if (iraSepSimple)` → SKIP** at line 5869 (MIRROR of IRA filter at 4a #6). Then `belongsToPersonIra(...)` at line 5872 — SSN-attribution (function shares the helper with IRA path; same SSN-routing logic, "Ira" in name reflects original use case).'],
  [3, 'Per-person: accumulate gross1099R (box 1) + taxable1099R (box 2a) + employee basis (box 5)', 'Lines 5875-5877. Box 5 = employee or Roth contributions/premiums recovered tax-free (basis).'],
  [4, 'Per-person: detect taxable-amount-not-determined (box 2b)', 'When checked, box 2a is NOT a final authority — Simplified Method / General Rule may apply. Increments taxableNotDeterminedCount.'],
  [5, 'Per-person: detect early-distribution codes (1 or S)', 'Distribution codes 1 (early, no known exception) or S (early SIMPLE) → accumulate taxable to earlyDistributionBase for Form 5329.'],
  [6, 'Per-person: filter and accumulate RRB-1099-R', 'Loop at line 5894-5923. NEW vs IRA cluster: separate `formRrb1099REntries` parameter. Component logic:\n  • Box 3 (employee cost): if > 0, Box 4 NSSEB is partially taxable via Simplified/General Rule\n  • Box 4 (NSSEB Tier I + II): always-taxable when Box 3 = 0; else basis-recovery applies\n  • Box 5 (VDB Vested Dual Benefit): ALWAYS fully taxable\n  • Box 6 (Supplemental annuity): ALWAYS fully taxable\n  • Box 7 (total): fallback when detail boxes absent'],
  [7, 'Per-person: aggregate gross + taxable from 1099-R + RRB-1099-R', '`grossPensionsAnnuities = addNonNull(gross1099R, grossRrb)`.\n`taxablePensionsAnnuities = addNonNull(taxable1099R, taxableRrb)`.'],
  [8, 'Per-person: detect exceptions', '`hasRollover`, `hasPsoElection` (Public Safety Officer), other-write-in — feeds line 5c boxes.'],
  [9, 'Per-person: return PensionPersonComputation', 'Constructor includes grossPensionsAnnuities, taxablePensionsAnnuities, exception flags, line 5c text, earlyDistributionBase for Form 5329.'],
  [10, 'Return-level: aggregate gross + taxable', '`grossPensions = addNonNull(taxpayer.grossPensionsAnnuities, spouse.grossPensionsAnnuities)` at line 5790.\n`taxablePensions = addNonNull(taxpayer.taxablePensionsAnnuities, spouse.taxablePensionsAnnuities)` at line 5791.\n**⚠️ NO MFS guard**: spouse contributions aggregated even on MFS.'],
  [11, 'Return-level: detect fully-taxable simple case', '`fullyTaxableOverall = hasPositiveAmount(grossPensions) AND !hasAnyException AND hasPositiveAmount(taxablePensions) AND grossPensions == taxablePensions` at line 5793-5796. Same 4-condition test as line 4a (4a #3).'],
  [12, 'Return-level: compute line 5a (blank-when-fully-taxable)', '**`line5a = fullyTaxableOverall ? null : roundMoney(grossPensions)`** at line 5798. Per IRS rule: line 5a is blank when fully taxable.'],
  [13, 'Return-level: aggregate line 5c boxes + Form 5329', 'line5cBox1 (rollover), line5cBox2 (PSO), line5cBox3+text (other). Form 5329 generated when hasEarlyDistributionAdditionalTaxForForm5329.'],
  [14, 'Persist on form1040.income; output Form 5329 if applicable', '`income.setPensionsAndAnnuities(line5a)` (only if non-null). Form 5329 output separately for Schedule 2 line 8.'],
  [],
  ['MUTUAL EXCLUSION RULES (enforced by code or spec)'],
  ['Rule', 'Implementation', 'Why'],
  ['Line 5a BLANK when fully-taxable simple case', 'Line 5798: `fullyTaxableOverall ? null : roundMoney(grossPensions)`. Same shape as line 4a (4a #3).', 'IRS Form 1040 line 5a instructions: "if fully taxable, enter the total distribution on line 5b". Simplified path matching gross-vs-taxable pattern.'],
  ['Line 5a is NOT in line 9 (only line 5b is)', 'Line 9 formula at line 4150-4153 uses line5b, not line5a. Same gross-vs-taxable pattern as 4a/4b.', 'Line 5a is GROSS (informational); line 5b is TAXABLE (income). Per IRC §61 + §72.'],
  ['IRA 1099-R entries EXCLUDED via `iraSepSimple` MIRROR filter', 'Line 5869: `if (iraSepSimple) continue;`. MIRROR of the IRA filter at line 5375 (4a #6) — line 4a processes iraSepSimple=true, line 5a processes iraSepSimple=false. No double-counting.', 'IRS rule: IRA distributions belong on lines 4a/4b/4c; non-IRA pension/annuity belongs on lines 5a/5b/5c. The two methods use mutually-exclusive filters on the same `form1099REntries` list.'],
  ['RRB-1099-R component split (NSSEB / VDB / Supplemental)', 'Lines 5894-5923. Box 5 (VDB) + Box 6 (Supplemental) always fully taxable; Box 4 (NSSEB) depends on Box 3 (employee cost).', 'IRS Pub. 575 + RRB instructions: Railroad Retirement has distinct taxability rules per component.'],
  ['Disability pension before minimum retirement age → line 1h (NOT line 5)', 'spec §2.2 explicit reroute', 'IRS rule: pre-retirement-age disability pension is wages-like, taxable on line 1h until employer plan retirement age.'],
  ['Early-distribution additional tax → Form 5329 → Schedule 2 (NOT line 5b)', 'Form 5329 generated at lines 5801-5825 when hasEarlyDistributionAdditionalTaxForForm5329=true. Routed to Schedule 2 line 8.', 'IRS rule: 10% additional tax on early distributions is separate from regular income tax on the distribution itself.'],
  [],
  ['DECISION TREE — when does each value appear on line 5a?'],
  ['Scenario', 'Line 5a result', 'Line 5b result', 'Line 5c result'],
  ['No 1099-R / RRB-1099-R pension entries', 'null', 'null', 'all unchecked, no text'],
  ['1099-R box 1 = $20,000, box 2a = $20,000, no exception (fully taxable)', 'null (BLANK)', '$20,000', 'unchecked'],
  ['1099-R partially taxable (Simplified Method applies, basis recovery)', '$20,000', '<$20,000 (computed)', 'unchecked'],
  ['1099-R with rollover (Exception 1)', '$20,000', '$0 (or partial)', 'box 1 checked'],
  ['1099-R with PSO exclusion (Exception 2)', '$20,000', '<$20,000 (reduced by PSO)', 'box 2 checked'],
  ['1099-R with code 1 or S (early distribution)', 'depends on basis', 'depends on basis', '(Form 5329 generated, not a line 5c box)'],
  ['RRB-1099-R only (Tier I NSSEB + VDB + Supplemental)', '$X', '$Y (with NSSEB partial if Box 3 > 0)', 'unchecked unless rollover'],
  ['MFS; spouse has pension only', '**⚠️ Currently leaks** (see Code Validation #1)', '**⚠️ Same leak**', '**⚠️ Same leak**'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 5a Flows'],
  ['Consumer', 'How', 'Notes'],
  ['(NOT line 9 directly)', 'Line 9 uses line 5b (taxable), NOT line 5a (gross). Gross-vs-taxable pattern.', 'Same as 4a/4b.'],
  ['Form 1040 line 5a (the cell itself)', 'TaxReturnComputeService.buildIncome() — income.setPensionsAndAnnuities(line5a)', 'Stored only when non-null. Whole-dollar HALF_UP rounding. PDF field f1_65[0]. Blank when fully-taxable simple case.'],
  ['Form 5329 (early distribution additional tax)', 'Generated at lines 5801-5825 when hasEarlyDistributionAdditionalTaxForForm5329=true', 'Per-return form (NOT per-person like Form 8606 in IRA cluster). Flows to Schedule 2 line 8 (additional taxes).'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 28 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 5a'],
  ['Line 5a inputs come from 1099-R statements (NON-IRA only — mirror filter from 4a) + RRB-1099-R (Railroad Retirement) + per-person pension-income personal forms.'],
  [],
  ['#', 'Source xlsx', 'Field path / model key', 'Label / box', 'Required?', 'Role in line 5a compute', 'Cross-reference'],
  [],
  ['STATEMENT INPUTS — 1099-R (NON-IRA only)'],
  [1, 'form-1099-r.xlsx', 'iraSepSimple', 'IRA/SEP/SIMPLE box', 'YES — MIRROR filter', '**Step 2: `if (iraSepSimple) SKIP`** (line 5869). Opposite of line 4a (4a #6 processes iraSepSimple=TRUE; line 5a processes iraSepSimple=FALSE). Mutually exclusive.', '4a #6'],
  [2, 'form-1099-r.xlsx', 'grossDistributionAmount (box 1)', '1099-R box 1', 'YES — primary line 5a feed', 'Step 3: `gross1099R += entry.box1`', 'IRS 1099-R box 1'],
  [3, 'form-1099-r.xlsx', 'taxableAmountAmount (box 2a)', '1099-R box 2a', 'YES — for line 5b', 'Step 3: `taxable1099R += entry.box2a`', 'IRS 1099-R box 2a'],
  [4, 'form-1099-r.xlsx', 'taxableAmountNotDetermined (box 2b)', '1099-R box 2b', 'NO — verification', 'When checked, box 2a is not authoritative. Simplified Method/General Rule may apply.', 'IRS Pub. 575'],
  [5, 'form-1099-r.xlsx', 'employeeOrRothContributionsOrPremiumsAmount (box 5)', '1099-R box 5', 'NO — basis recovery', 'Employee contributions / Roth premiums recovered tax-free. Reduces taxable.', 'IRS Pub. 575'],
  [6, 'form-1099-r.xlsx', 'distributionCodes (box 7)', '1099-R box 7', 'YES — for Form 5329 routing', 'Codes 1 (early), S (early SIMPLE) → earlyDistributionBase for Form 5329. Other codes affect taxability.', 'Form 5329 trigger'],
  [7, 'form-1099-r.xlsx', 'recipientTIN', '1099-R recipient TIN', 'YES — SSN attribution', '`belongsToPersonIra` at line 5872. **⚠️ MFS guard missing**: spouse leaks on MFS.', 'Code Validation #1'],
  [],
  ['STATEMENT INPUTS — RRB-1099-R (Railroad Retirement)'],
  [8, 'form-rrb-1099-r.xlsx', 'recipientIdNumber', 'RRB recipient TIN', 'YES — SSN attribution', '`belongsToPersonRrb1099R` at line 5895. **⚠️ Same MFS gap as 1099-R**.', 'Code Validation #1'],
  [9, 'form-rrb-1099-r.xlsx', 'employeeContributionsCostAmount (box 3)', 'RRB box 3 "Employee contributions"', 'NO', 'When > 0, Box 4 NSSEB is partially taxable (basis recovery via Simplified Method).', 'IRS RRB instructions'],
  [10, 'form-rrb-1099-r.xlsx', 'contributoryAmountPaidAmount (box 4)', 'RRB box 4 "NSSEB Tier I + II"', 'NO', 'Fully taxable when Box 3 = 0; partially taxable when Box 3 > 0.', 'IRS RRB instructions'],
  [11, 'form-rrb-1099-r.xlsx', 'vestedDualBenefitAmount (box 5)', 'RRB box 5 "VDB Vested Dual Benefit"', 'NO', 'ALWAYS fully taxable. Direct line 5b contribution.', 'IRS RRB instructions'],
  [12, 'form-rrb-1099-r.xlsx', 'supplementalAnnuityAmount (box 6)', 'RRB box 6 "Supplemental"', 'NO', 'ALWAYS fully taxable. Direct line 5b contribution.', 'IRS RRB instructions'],
  [13, 'form-rrb-1099-r.xlsx', 'totalGrossPaidAmount (box 7)', 'RRB box 7 "Total Gross"', 'NO — fallback', 'When detail boxes absent, used as total gross fully taxable.', 'IRS RRB instructions'],
  [],
  ['PERSONAL FORM INPUTS — pension-income-taxpayer / -spouse'],
  [14, 'form-pension-income-taxpayer.xlsx', 'screening.hadPensionOrAnnuityIncome', 'Did you have pension/annuity income?', 'YES (boolean gate)', 'Drives validatePensionStatementGating AND `personHadPension` flag.', 'YAML: 5abc-pension-income-taxpayer.yaml'],
  [15, 'form-pension-income-taxpayer.xlsx', 'rollover.* (rollover-related fields)', 'Rollover facts', 'NO — Exception 1 gate', 'Triggers hasRollover → line 5c box 1.', 'IRS Exception 1'],
  [16, 'form-pension-income-taxpayer.xlsx', 'pso.* (Public Safety Officer election fields)', 'PSO election', 'NO — Exception 2 gate', 'Triggers hasPsoElection → line 5c box 2. Reduces taxable amount.', 'IRC §402(l); Pub. 575'],
  [17, 'form-pension-income-taxpayer.xlsx', 'simplifiedMethod.* (Simplified Method inputs)', 'Simplified Method inputs', 'NO', 'Computes basis recovery per Pub. 575.', 'IRS Pub. 575'],
  [18, 'form-pension-income-taxpayer.xlsx', 'generalRule.* (General Rule inputs)', 'General Rule inputs', 'NO', 'Computes basis recovery per Pub. 939.', 'IRS Pub. 939'],
  [19, 'form-pension-income-taxpayer.xlsx', 'form5329.hasEarlyDistributionAdditionalTaxForForm5329', 'Early distribution additional tax flag', 'NO', 'Triggers Form 5329 generation → Schedule 2 line 8.', 'IRC §72(t); Form 5329'],
  [],
  ['IDENTITY INPUTS'],
  [20, 'form-identification-taxpayer.xlsx', 'taxpayerIdentity.ssn', 'Taxpayer SSN', 'YES', 'Drives 1099-R + RRB attribution.', 'Standard SSN attribution'],
  [21, 'form-identification-spouse.xlsx', 'spouseIdentity.spouseSsn', 'Spouse SSN', 'YES on MFJ', '**⚠️ Should be nulled on MFS via MFS guard — currently leaks. See Code Validation #1.**', 'Code Validation #1'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 42 }, { wch: 65 }, { wch: 55 }, { wch: 30 }, { wch: 80 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 5a'],
  ['Line 5a itself has no direct 2025-indexed thresholds. Downstream line 5b computation depends on Simplified Method tables and PSO exclusion cap.'],
  [],
  ['Constant', 'Value', 'Source', 'Used by line 5a?', 'Notes'],
  [],
  ['Direct — Simplified Method (affects line 5b, NOT line 5a value)'],
  ['SIMPLIFIED_METHOD_EXPECTED_RETURN_TABLE', 'IRS table (age-based)', 'IRS 2025 Pub. 575 + Form 1040 instructions Simplified Method Worksheet', 'NO (line 5b)', 'Age-based expected return for basis recovery per distribution.'],
  [],
  ['Direct — PSO (Public Safety Officer) exclusion'],
  ['PSO_ANNUAL_EXCLUSION_2025', '$3,000', 'IRC §402(l); IRS 2025 Pub. 575', 'NO (line 5b)', 'Maximum annual PSO health/long-term-care insurance premium exclusion.'],
  [],
  ['Direct — Early-distribution additional tax (Form 5329 → Schedule 2)'],
  ['EARLY_DISTRIBUTION_ADDITIONAL_TAX_RATE', '10%', 'IRC §72(t)', 'NO (Form 5329)', 'Default rate. Reduced to 25% for SIMPLE within 2 years.'],
  [],
  ['Statutory references'],
  ['Pension and annuity income', 'IRC §72; IRS Pub. 575', 'Authoritative source.'],
  ['General Rule for annuities', 'IRC §72(d); IRS Pub. 939', 'Used for pre-Nov 18, 1996 annuity starting dates + non-qualified plans.'],
  ['Simplified Method', 'IRS Pub. 575 Simplified Method Worksheet', 'For qualified-plan annuity starting dates after Nov 18, 1996.'],
  ['PSO exclusion', 'IRC §402(l)', 'Retired Public Safety Officer health/LTC insurance premium exclusion.'],
  ['Disability pension before minimum retirement age', 'IRS 2025 Form 1040 line 1h instructions', 'Reroutes to line 1h until retirement age.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 42 }, { wch: 22 }, { wch: 55 }, { wch: 22 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 5a Drives Form 5329 Generation But Not Tax Directly'],
  ['Line 5a is GROSS (informational). Line 5b carries the TAXABLE amount → enters line 9. Line 5c discloses exceptions.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['Form 1040 line 5a (the cell itself)', 'income.setPensionsAndAnnuities(line5a)', '★ Primary output. Stored when non-null. Blank when fully-taxable simple case.'],
  ['Form 1040 line 5b (taxable pension)', 'income.setTaxablePensionsAnnuities(line5b)', '★ Sibling. Carries taxable portion → enters line 9.'],
  ['Form 1040 line 5c box 1 (rollover)', 'PensionComputation.line5cBox1', 'OR-aggregated across spouses (per IRS Form 1040 line 5c).'],
  ['Form 1040 line 5c box 2 (PSO)', 'PensionComputation.line5cBox2', 'PSO election disclosure.'],
  ['Form 1040 line 5c box 3 (other/write-in)', 'PensionComputation.line5cBox3 + line5cText', 'Write-in via joinLine4cOtherText shared helper (verified during 4c #5).'],
  ['Form 5329 (early distribution additional tax)', 'PensionComputation.form5329 → Schedule 2 line 8', 'Per-return form. Triggered by hasEarlyDistributionAdditionalTaxForForm5329 + early-distribution codes.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 (total income)', 'Line 9 uses line 5b, NOT line 5a', '★ Critical: line 5a is gross/informational; line 5b carries taxable.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 5a Family Emits Several Flags'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['PENSION_STATEMENT_UPLOAD_REQUIRED', 'BLOCKING', 'hadPensionOrAnnuityIncome=true but no 1099-R/RRB uploaded', 'validatePensionStatementGating'],
  ['FORM5329_EXCEPTION_CODE_REQUIRED', 'BLOCKING', 'requiresForm5329=true but no exceptionCodeOrReason provided', 'computePensionAnnuities lines 5813-5820'],
  ['PENSION_TAXABLE_NOT_DETERMINED', 'NON-BLOCKING (verification)', 'Any 1099-R has box 2b checked', 'taxableNotDeterminedCount tracking'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 50 }, { wch: 28 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 5a is the gross pension/annuity line — the FIRST audit of the 5abc cluster (mirrors 4abc IRA cluster pattern). Like 4a #1, the initial scan revealed a **HIGH-PRIORITY DEFENSIVE GAP** at `computePensionAnnuities` (no MFS guard). Verified 2026-05-12.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-12 — HIGH-PRIORITY DEFENSIVE GAP — MFS GUARD ADDED AT computePensionAnnuities', 'Three-step fix applied: (a) added `boolean isMfsReturn` parameter to `computePensionAnnuities` signature (TaxReturnComputeService.java:5735-5743); (b) at the top of the method body, nulled spouse-side reads on MFS — `pensionIncomeSpouse = isMfsReturn ? null : pensionIncomeSpouseRaw` and `spouseSsn = isMfsReturn ? null : normalizeSsn(getString(spouse, "ssn"))`; (c) updated call site at line 414 to pass `isMfsReturn`. Added 14-line MFS-guard breadcrumb at lines 5744-5757 documenting the cascade path + extension to 10 orchestrators. Lock-in test `mfsExcludesSpousePensionFromLine5a` added: MFS return with taxpayer $6k fully-taxable pension + STALE spouse $9k pension → asserts line 5b = $6,000 (taxpayer-only), NOT $15,000 (aggregated). **HIGH-LEVERAGE FIX**: one guard protects 7+ outputs (line 5a, 5b, 5c boxes 1/2/3, 5c write-in text, Form 5329, attachment flags). **Single-guard MFS cascade now applied to 10 orchestrators** (1c-1i + computeInterestIncome + computeIraDistributions + **computePensionAnnuities**). Backend regression: 752 → 753 (net +1 from lock-in test).', 'TaxReturnComputeService.java:5735-5778 (signature + 14-line breadcrumb + MFS suppression); line 414 (call site); test mfsExcludesSpousePensionFromLine5a', 'CLOSED — defensive gap fixed. Single-guard MFS cascade extended to 10 orchestrators.'],
  [2, 'RESOLVED 2026-05-12 — KNOWLEDGE FILE NAMING DEVIATION', '`knowledge/knowledge-line-5abc-pension-annuity.md` used the legacy `knowledge-line-` hyphen-prefix form (intermediate between the oldest `knowledge_lineNN_` underscore form and the modern `line-{N}-{topic}` convention). Renamed to `knowledge/line-5abc-pension-annuity.md` via plain `mv`. File has no YAML frontmatter (uses plain `# Knowledge — ...` heading), so no frontmatter update needed. Updated the header-comment reference in `generate-5a.js`. Two inbound markdown references (`history.md` line 3416, `us-tax-be/context.md` line 11) are historical changelog entries — preserved as-is per the audit-trail-preserves-history convention. **Line 1c → 5abc knowledge-file naming convergence now complete across 12 lines** (1c, 1d, 1e, 1f, 1g, 1h, 1i, 1z, 2ab, 3ab, 4abc, 5abc).', 'C:\\us-tax\\knowledge\\line-5abc-pension-annuity.md (renamed); C:\\us-tax\\XLS\\_tools\\generate-5a.js (header comment)', 'CLOSED — pure documentation hygiene. Same fix shape as 4a #2 (which itself extended the convention from prior closures).'],
  [3, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — LINE 5a BLANK-WHEN-FULLY-TAXABLE SIMPLE CASE', 'Per IRS 2025 Form 1040 line 5a instructions + lines/5abc.md §3.1: "If fully taxable, enter the total on line 5b and leave line 5a blank." Implementation at TaxReturnComputeService.java:5815 correctly uses a strict 4-condition fullyTaxableOverall test (same shape as line 4a from 4a #3): (1) hasPositiveAmount(grossPensions); (2) !hasAnyException; (3) hasPositiveAmount(taxablePensions); (4) grossPensions == taxablePensions. If ALL hold → line5a = null (blank PDF). If ANY fails → line5a = roundMoney(grossPensions). Closure: replaced the brief 1-line inline comment with a 13-line breadcrumb at lines 5809-5824 documenting the IRS rule + 4-condition test + blank-not-zero PDF rendering semantic + contrast with line 5b always-present + cross-reference to 4a #3 (same pattern). The gross-vs-taxable pattern from 4a #4 explicitly cited (line 5a excluded from line 9; line 5b included).', 'TaxReturnComputeService.java:5809-5824 (13-line breadcrumb above line 5a assignment)', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [4, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — LINE 5a NOT IN LINE 9 (8-AUDIT CONSOLIDATION; gross-vs-taxable pattern continues)', 'Line 9 formula at TaxReturnComputeService.java:4159-4162: line 5b is the 5th operand (INTENTIONALLY INCLUDED per IRC §61 + §72 — taxable pension/annuity); line 5a (gross) is absent. Closure: extended the line-9 breadcrumb at lines 4135-4161 from **7 audit IDs** to **8 audit IDs** (added 5a #4, dated 2026-05-12 to reflect today\'s walkthrough). Added line 5b operand description (verified INCLUDED per 5a #4 with inverse confirmation pending future 5b walkthrough). Updated the "notably absent" list to include line 5a (gross pension/annuity — only line 5b enters income via Pub. 575 + IRC §72 basis recovery). Lock-in test `line9EqualsLine1zPlusOtherIncomeLines` re-run passed.', 'TaxReturnComputeService.java:4135-4161 (extended 8-audit breadcrumb + line 5a/5b descriptions); test line9EqualsLine1zPlusOtherIncomeLines (re-run pass)', 'CLOSED — verified-correct cross-reference. 8-audit consolidation.'],
  [5, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — 0-VS-NULL COMPLIANCE FOR computePensionForPerson', 'Verified all 5 compliance points: (1) local accumulators init to null (lines 5862-5866 for 1099-R; lines 5928-5929 for RRB); (2) addNonNull preserves null when no entries match; (3) subtractNonNegative preserves null (rollover + PSO subtractions); (4) roundMoney(null) → null at constructor (verified gate from 4a #5); (5) Simplified Method / General Rule overrides at lines 5970-5977 are null-preserving (use null-fallback pattern). Verified the rare hasRollover=true + gross1099R=null edge case produces canonically-correct ZERO (concept applies, value zero) rather than null. Closure: 22-line breadcrumb above the PensionPersonComputation return site (lines 6025-6045) with SEPARATE gross-path, taxable-path, and early-distribution-path traces + cross-references to 2a #5 / 3a #4 / 3b #4 / 4a #5 / 4b #4 (compliance pattern continuity). Critical for downstream PDF rendering — null preserves blank line; ZERO displays "$0" wrong for no-activity returns.', 'TaxReturnComputeService.java:6025-6045 (22-line breadcrumb above PensionPersonComputation return); 5862-5866 + 5928-5929 (accumulator inits)', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [6, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — `iraSepSimple` MIRROR FILTER EXCLUDES IRA 1099-Rs FROM LINE 5a/5b', 'Pension/annuity filter at TaxReturnComputeService.java:5915 `if (iraSepSimple) continue;` is the MIRROR of the IRA filter at line ~5375 `if (!iraSepSimple) continue;`. Mutual-exclusion proof: every 1099-R has iraSepSimple ∈ {TRUE, FALSE, null}; each entry goes to EXACTLY ONE compute path. Null-iraSepSimple defaults to pension/annuity (matches IRS convention — IRA boxes must be explicitly flagged). Closure: 11-line breadcrumb at lines 5905-5915 documenting the MIRROR-filter design + mutual-exclusion proof + null-iraSepSimple edge case + cross-reference to 4a #6 (IRA-side filter) + forward-reference to 5a #8 (belongsToPersonIra naming-vs-usage observation).', 'TaxReturnComputeService.java:5905-5915 (11-line breadcrumb on MIRROR-filter design); 4a #6 (IRA-side filter breadcrumb)', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [7, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — RRB-1099-R COMPONENT SPLIT (NSSEB / VDB / Supplemental)', 'RRB-1099-R is a NEW input source for the 5abc cluster (not present in 4abc IRA cluster). Components per IRS RRB-1099-R instructions + Pub. 575: Box 3 (cost basis); Box 4 (NSSEB Tier I+II — contributory); Box 5 (VDB Vested Dual Benefit — always taxable); Box 6 (Supplemental annuity — always taxable); Box 7 (total gross — fallback). Three decision branches at lines 5947-5953: (A) Box 3 > 0 → taxable = box5 + box6 only; (B) Box 3 = 0 + detail → taxable = box4 + box5 + box6; (C) Box 3 = 0 + no detail → fallback to Box 7. Closure: replaced the brief 5-line inline comment with a **20-line breadcrumb** at lines 5933-5952 documenting all 5 box semantics + 3 decision branches with rationale + always-taxable VDB + Supplemental design + Box 7 fallback + IRS source citations.', 'TaxReturnComputeService.java:5933-5952 (20-line breadcrumb above RRB loop)', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [8, 'RESOLVED 2026-05-12 — OBSERVATION — `belongsToPersonIra` REUSED for non-IRA 1099-R SSN attribution (Option A applied)', 'Pension path at TaxReturnComputeService.java:5918 calls `belongsToPersonIra(...)` for non-IRA 1099-R SSN attribution. The function name suggests IRA-specific routing but actually performs generic SSN-attribution — the boolean parameters function as "has-this-income" flags for the TIN-fallback path. Pension path passes `taxpayerHadPension/spouseHadPension` which is semantically correct even though parameter names say "Ira". **Option A applied**: 5-line breadcrumb at lines 5918-5922 explaining the generic SSN-attribution reuse pattern + IRA-vs-pension distinction lives at the iraSepSimple filter above (5a #6) + helper is generic despite the name. Refactor to `belongsToPersonBySsn` (Option B) deferred — would invalidate existing breadcrumbs at multiple sites; pre-launch context favors documentation over refactor when behavior is correct.', 'TaxReturnComputeService.java:5918-5924 (5-line breadcrumb at pension-path call site)', 'CLOSED — Option A applied. Breadcrumb-only; no refactor.'],
  [9, 'RESOLVED 2026-05-12 — OBSERVATION — Form 5329 IS PER-RETURN (vs Form 8606 PER-PERSON in IRA cluster)', 'IRA cluster (4abc) uses Form 8606 PER PERSON (per-individual basis tracking; taxpayer + spouse each file). Pension cluster (5abc) uses Form 5329 PER RETURN (return-level early-distribution additional tax; both spouses roll up to one form). This is IRS-correct — the forms reflect different things (basis vs additional tax). Closure: 11-line breadcrumb at TaxReturnComputeService.java:5837-5847 documenting (a) per-return cardinality + contrast with Form 8606 per-person; (b) aggregation via addNonNull across both spouses; (c) IRC §72(t) source; (d) Schedule 2 line 8 routing; (e) `requiresForm5329` gates per-return form generation, not per-person basis tracking; (f) cross-reference to Form 8606 contrasting pattern from 4a/4b breadcrumbs. Prevents future contributor from mistakenly proposing per-person split for Form 5329.', 'TaxReturnComputeService.java:5837-5847 (11-line breadcrumb above Form 5329 generation)', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [10, 'RESOLVED 2026-05-12 — OBSERVATION — LINE 5a IS THE FIRST PENSION/ANNUITY-FAMILY AUDIT', 'Lines 5a/5b/5c form an interconnected cluster mirroring 3abc + 4abc patterns. Line 5a established 9 patterns for the 5abc cluster: #1 MFS guard (10th orchestrator), #2 knowledge-file rename (**12 lines** in convergence), #3 blank-when-fully-taxable (mirrors 4a #3), #4 line-9 **8-audit consolidation**, #5 0-vs-null compliance (22-line breadcrumb with separate gross/taxable/early-dist traces), #6 iraSepSimple MIRROR filter (mutual exclusion vs 4a #6), #7 RRB-1099-R component split (NEW vs 4abc cluster), #8 belongsToPersonIra generic reuse (Option A applied), #9 Form 5329 per-return cardinality (contrast with Form 8606 per-person). Future 5b audit will likely: extend MFS to 2 audits at 5a #1 site, extend 0-vs-null to cover taxable path explicitly, extend line-9 to **9 audit IDs** completing the 5a/5b bilateral coverage milestone (analogous to 4a/4b). Future 5c audit will be metadata-heavy (3 independent checkboxes — same pattern as line 4c). Pure xlsx-flip observation. Same shape as 4a #10 / 3a #10.', 'XLS/computations/5a.xlsx audit-trail (this row); no code change', 'CLOSED — pure xlsx-flip observation. Positions future 5b and 5c audits.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 35 }, { wch: 95 }, { wch: 65 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 5a Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.pensionsAndAnnuities', 'topmostSubform[0].Page1[0].f1_65[0] (line5a_pensions_annuities)', 'form-tax-return-1040.xlsx (line 5a cell)', '★ Primary output. Stored only when non-null. Blank when fully-taxable simple case.'],
  ['form1040.income.taxablePensionsAnnuities', 'topmostSubform[0].Page1[0].f1_66[0] (line5b_pensions_annuities_taxable_amount)', 'form-tax-return-1040.xlsx (line 5b cell)', '★ Sibling. Carries taxable portion → enters line 9.'],
  [],
  ['SECONDARY OUTPUTS (Line 5c family)'],
  ['form1040.income.line5cBox1Rollover', 'c1_38[0]', 'form-tax-return-1040.xlsx', 'Rollover checkbox.'],
  ['form1040.income.line5cBox2Pso', 'c1_39[0]', 'form-tax-return-1040.xlsx', 'PSO election checkbox.'],
  ['form1040.income.line5cBox3Other', 'c1_40[0]', 'form-tax-return-1040.xlsx', 'Other write-in checkbox.'],
  ['form1040.income.line5cText', '(write-in field)', 'form-tax-return-1040.xlsx', 'Write-in text.'],
  [],
  ['ATTACHED FORMS'],
  ['Form 5329 (per-return)', '—', 'form-tax-return-5329.xlsx', 'Generated when hasEarlyDistributionAdditionalTaxForForm5329=true. Routes to Schedule 2 line 8.'],
  [],
  ['DOWNSTREAM CONSUMERS'],
  ['Form 1040 line 9 (total income) — via line 5b', '—', 'form-tax-return-1040.xlsx', '★ Line 5b (NOT line 5a) is the 5th operand in line 9.'],
  ['Form 1040 line 11a/11b (AGI), line 15 (taxable income)', '—', 'form-tax-return-1040.xlsx', 'Indirect via line 9 contribution.'],
  ['Schedule 2 line 8 (additional taxes)', '—', 'form-tax-return-schedule2.xlsx', 'Form 5329 early-distribution additional tax routed here.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 directly from line 5a', '—', '—', 'Line 5a (gross) is excluded; only line 5b (taxable) enters line 9.'],
  ['Disability pension before retirement age', 'Line 1h', 'form-tax-return-1040.xlsx', 'Spec §2.2 reroute.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 70 }, { wch: 55 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
