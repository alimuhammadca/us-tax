// ============================================================================
//  Generates: C:\us-tax\XLS\computations\5b.xlsx
//
//  Source-of-truth references:
//    - lines/5abc.md §3 (line 5a/5b core rules) + §7 (Simplified Method / General Rule)
//    - dependencies/5abc.md
//    - knowledge/line-5abc-pension-annuity.md (renamed 2026-05-12 via 5a #2)
//    - TaxReturnComputeService.computePensionAnnuities() (orchestrator with MFS guard from 5a #1)
//    - TaxReturnComputeService.computePensionForPerson() (per-person aggregator)
//    - TaxReturnComputeService.computePensionTaxableViaSimplifiedMethod() (Pub. 575)
//    - TaxReturnComputeService.computePensionTaxableViaGeneralRule() (Pub. 939)
//    - PDF semantic CSV row 80 (f1_66[0] line5b_pensions_annuities_taxable_amount)
//    - IRS 2025 Form 1040 line 5a/5b instructions
//    - IRS Pub. 575 (Pension and Annuity Income; Simplified Method)
//    - IRS Pub. 939 (General Rule for Pensions and Annuities)
//    - IRC §61 (gross income) + §72 (annuities) + §402(l) (PSO exclusion)
//
//  Tax year: 2025
//
//  NOTE: Line 5b is the TAXABLE-amount line of the pension/annuity family — the value-bearing
//  counterpart to line 5a (gross/disclosure). Per the gross-vs-taxable pattern (4a #4 → 5a #4):
//  line 5b IS the operand in line 9 (line 5a is excluded as disclosure-only).
//
//  Like 4b vs 4a and 3b vs 3a, this audit is shared-aggregator cross-reference-heavy. Most
//  concerns extend prior 5a closures via multi-audit-trail consolidation. Adding 5b #5 to the
//  line-9 breadcrumb completes the **5a/5b bilateral coverage milestone** (analogous to 4a/4b
//  from 4b #5/#10).
//
//  Line 5b-specific verifications focus on:
//   • Per-person taxable computation chain (Simplified Method / General Rule / rollover / PSO)
//   • Pub. 575 Gap 4 fix (rollover base = gross1099R, not box 2a)
//   • PSO exclusion cap ($3,000 per IRC §402(l))
//   • Simplified Method vs General Rule choice (Pub. 575 vs Pub. 939)
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '5b.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 5b — PENSIONS AND ANNUITIES TAXABLE AMOUNT'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 5b'],
  ['Concept', 'TAXABLE amount of pension/annuity distributions for the return (taxpayer + spouse aggregated). Per IRS 2025 Form 1040 instructions: line 5b is the pension/annuity portion that enters gross income under IRC §61 + §72. **Line 5b IS the operand in line 9** (the value-bearing counterpart to line 5a, which is disclosure-only). Per the gross-vs-taxable pattern (4a #4 → 5a #4): gross side excluded from line 9, taxable side included.'],
  ['Core invariant', 'Line 5b ≥ 0 (zero-floor via subtractNonNegative in rollover/PSO paths). Line 5b ≤ Line 5a (taxable cannot exceed gross). When fully-taxable simple case: Line 5b = full gross AND line 5a = blank (per IRS rule from 5a #3).'],
  ['Per-Person Formula', 'taxableBase1099R = taxable1099R == null ? gross1099R : taxable1099R   // fallback when box 2a absent\ntaxableBase = addNonNull(taxableBase1099R, taxableRrb)\n\n// Simplified Method override (IRS Pub. 575) — when basis recovery applies\nif (needsSimplifiedMethod): taxableBase = computePensionTaxableViaSimplifiedMethod(...) || taxableBase\n// General Rule override (IRS Pub. 939) — pre-Nov 1996 annuities or nonqualified plans\nif (needsGeneralRule): taxableBase = computePensionTaxableViaGeneralRule(...) || taxableBase\n\n// Rollover reduction (Pub. 575 Gap 4 fix)\nif (hasRollover):\n  rolloverBase = gross1099R || 0   // Gap 4: from gross, NOT box 2a (avoids double-deducting box 5)\n  reducedBase = subtractNonNegative(rolloverBase, rolloverAmount + box5Offset)\n  taxableAfterRollover = addNonNull(reducedBase, taxableRrb)   // RRB not eligible for qualified-plan rollovers; re-added\nelse:\n  taxableAfterRollover = taxableBase\n\n// PSO exclusion (IRC §402(l) — $3,000 cap)\nif (hasPsoElection):\n  psoExclusion = min(psoPremiums, $3,000)\n  taxableAfterPso = subtractNonNegative(taxableAfterRollover, psoExclusion)\nelse:\n  taxableAfterPso = taxableAfterRollover\n\nperson.taxablePensionsAnnuities = taxableAfterPso'],
  ['Per-Return Formula', 'taxablePensions = addNonNull(taxpayer.taxablePensionsAnnuities, spouse.taxablePensionsAnnuities)\n**line5b = roundMoney(taxablePensions)**\n\n(unlike line 5a, line 5b does NOT have a blank-when-fully-taxable rule — it always carries the taxable amount when there is pension activity.)'],
  ['Filed', 'Form 1040 line 5b. PDF field: topmostSubform[0].Page1[0].f1_66[0] (semantic: line5b_pensions_annuities_taxable_amount). Sibling line 5a at f1_65[0].'],
  ['Backend method', 'TaxReturnComputeService.computePensionAnnuities() — orchestrator (MFS guard from 5a #1 protects line 5b).\nTaxReturnComputeService.computePensionForPerson() — per-person aggregator with the 4-stage taxable chain.\nSubsidiary methods: computePensionTaxableViaSimplifiedMethod (Pub. 575), computePensionTaxableViaGeneralRule (Pub. 939).'],
  ['Output', 'form1040.income.taxablePensionsAnnuities (BigDecimal; null when no pension activity; ZERO when pension activity but fully excluded via rollover/PSO/basis). When non-null, enters the line 9 addNonNull chain as the 5th operand.'],
  ['IRS source', 'IRS 2025 Form 1040 instructions for line 5b; IRS Pub. 575 (Pension and Annuity Income; Simplified Method); IRS Pub. 939 (General Rule); IRC §61 (gross income) + §72 (annuities) + §402(l) (PSO exclusion)'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Filter 1099-R entries — NON-IRA only (5a #6 MIRROR filter)', 'Same path as line 5a. iraSepSimple filter (5a #6) MUTUAL EXCLUSION vs IRA path. MFS-protected via 5a #1.'],
  [2, 'Per-person: accumulate taxableBox2a (1099-R box 2a) + employeeContributionsBox5 (box 5)', 'Lines 5876-5877. Box 5 = employee/Roth contributions recovered tax-free (basis).'],
  [3, 'Per-person: accumulate taxableRrb via RRB component split (5a #7)', '5 RRB box semantics (NSSEB / VDB / Supplemental / cost / total) + 3 decision branches.'],
  [4, 'Per-person: compute taxableBase with fallback', '`taxableBase1099R = taxable1099R == null ? gross1099R : taxable1099R` at line 6002 (fallback to gross when box 2a absent). `taxableBase = addNonNull(taxableBase1099R, taxableRrb)`.'],
  [5, 'Per-person: Simplified Method override (Pub. 575)', '`if (needsSimplifiedMethod): taxableBase = computeSimplified || taxableBase` at line 6011-6014. Computes basis recovery via the IRS age-based factor table (360/310/260/210/160). Null-fallback preserves taxableBase when computation fails (e.g., missing inputs).'],
  [6, 'Per-person: General Rule override (Pub. 939)', '`if (needsGeneralRule): taxableBase = computeGeneralRule || taxableBase` at line 6015-6018. For pre-Nov 18, 1996 annuity starting dates + nonqualified plans. Null-fallback same as Simplified.'],
  [7, 'Per-person: Rollover reduction (Pub. 575 Gap 4 fix)', '`if (hasRollover): rolloverBase = gross1099R || 0; reducedBase = subtractNonNegative(rolloverBase, rolloverAmount + box5Offset); taxableAfterRollover = addNonNull(reducedBase, taxableRrb)` at lines 6030-6037.\n**Pub. 575 Gap 4 fix**: rollover base = gross1099R (Box 1), NOT box 2a. Starting from box 2a risks double-deducting box 5 when the payer already netted it. RRB distributions not eligible for qualified-plan rollovers → re-added as taxableRrb.'],
  [8, 'Per-person: PSO exclusion (IRC §402(l) — $3,000 cap)', '`if (hasPsoElection): psoExclusion = min(psoPremiums, $3,000); taxableAfterPso = subtractNonNegative(taxableAfterRollover, psoExclusion)` at lines 6039-6046. PSO eligibility requires retired Public Safety Officer election (eligibility + election both true).'],
  [9, 'Per-person: return PensionPersonComputation', 'taxablePensionsAnnuities = roundMoney(taxableAfterPso). Null-preserving via 5a #5 chain.'],
  [10, 'Return-level: aggregate taxablePensions across spouses', '`taxablePensions = addNonNull(taxpayer.taxablePensionsAnnuities(), spouse.taxablePensionsAnnuities())`. MFS guard from 5a #1 ensures spouse contribution is null on MFS → aggregation stays taxpayer-only.'],
  [11, 'Return-level: line 5b = roundMoney(taxablePensions)', '**`line5b = roundMoney(taxablePensions)`**. Unlike line 5a, no blank-when-fully-taxable rule — line 5b always carries when pension activity is present.'],
  [12, 'Persist on form1040.income; flow to line 9', '`income.setTaxablePensionsAnnuities(line5b)` (only when non-null). Line 5b is the 5th operand in the line 9 addNonNull chain — IRC §61 + §72.'],
  [],
  ['MUTUAL EXCLUSION RULES (enforced by code or spec)'],
  ['Rule', 'Implementation', 'Why'],
  ['Line 5b ≥ 0 (zero-floor)', 'subtractNonNegative at lines 6031 (rollover) + 6045 (PSO) floors at zero. Simplified Method internal floor via remainingBasis logic.', 'Negative taxable pension would imply a refund-of-prior-tax mechanism that doesn\'t exist in IRC §72.'],
  ['Line 5b IS in line 9 (5th operand)', 'Line 9 formula at lines 4159-4162 includes line 5b. Multi-audit breadcrumb cites 5a #4 (5a exclusion) + 5b #5 (5b inclusion).', 'IRC §61 + §72: taxable pension/annuity distributions are gross income. Inverse confirmation of 5a #4 (gross excluded as disclosure-only).'],
  ['Simplified Method override (Pub. 575)', 'Lines 6011-6014. Null-fallback: when computation can\'t complete (missing inputs), taxableBase stays.', 'IRS Pub. 575 Simplified Method Worksheet: for qualified-plan annuity starting dates after Nov 18, 1996. Age-based factor table.'],
  ['General Rule override (Pub. 939)', 'Lines 6015-6018. Same null-fallback as Simplified.', 'IRS Pub. 939: for pre-Nov 18, 1996 annuity starting dates + nonqualified plans.'],
  ['Pub. 575 Gap 4 fix — rollover base = gross1099R, not box 2a', 'Lines 6028-6037 — explicit comment + `rolloverBase = gross1099R != null ? gross1099R : BigDecimal.ZERO`.', 'Starting from box 2a risks double-deducting box 5 when the payer already netted it. Per IRS Pub. 575: use gross distribution as the rollover base.'],
  ['RRB not eligible for qualified-plan rollovers (re-added after rollover)', 'Line 6033: `taxableAfterRollover = addNonNull(reducedBase, taxableRrb)`.', 'IRS rules: Railroad Retirement Board distributions cannot be rolled over to qualified plans. So the rollover reduction applies only to the 1099-R portion; RRB taxable is added back unchanged.'],
  ['PSO exclusion capped at $3,000', 'Line 6043: `minNonNull(psoPremiums, new BigDecimal("3000"))`.', 'IRC §402(l) sets the annual cap. IRS Pub. 575 confirms.'],
  ['PSO eligibility requires BOTH isEligible AND elects', 'Line 6041: `hasPsoElection = isEligiblePso && electsPso`.', 'IRS rules: only retired public safety officers (police, fire, EMS, etc.) are eligible. Eligible filers must also affirmatively elect on the return.'],
  [],
  ['DECISION TREE — when does each value appear on line 5b?'],
  ['Scenario', 'Line 5a result', 'Line 5b result'],
  ['No pension activity', 'null', 'null'],
  ['1099-R box 1 = $20,000, box 2a = $20,000, fully taxable simple case', 'null (blank per 5a #3)', '$20,000 (taxableBase; no exceptions)'],
  ['1099-R partially taxable via Simplified Method (basis recovery)', '$20,000', '<$20,000 (computed by Simplified Method)'],
  ['1099-R partially taxable via General Rule', '$20,000', '<$20,000 (computed by General Rule)'],
  ['1099-R rollover (Exception 1)', '$20,000', '$0 (or partial) — rollover from gross1099R per Gap 4 fix'],
  ['1099-R + PSO exclusion (Exception 2)', '$20,000', 'taxableAfterRollover − min(psoPremiums, $3,000)'],
  ['1099-R + Simplified Method + rollover', '$20,000', 'Simplified-Method-computed taxable, then rollover-reduced'],
  ['RRB-1099-R only (no rollover possible)', '$X (gross from RRB)', 'RRB taxable per 5a #7 component split'],
  ['1099-R + RRB-1099-R + rollover', 'gross1099R + grossRrb', 'reducedBase (from gross1099R minus rollover) + taxableRrb (RRB not rolled over)'],
  ['MFS; spouse has pension only', 'null (protected via 5a #1 MFS guard)', 'null (protected via 5a #1 MFS guard)'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 5b Flows'],
  ['Consumer', 'How', 'Notes'],
  ['Form 1040 line 9 (total income) — ★ PRIMARY DOWNSTREAM', 'Line 9 formula at lines 4159-4162 — line 5b is the 5th operand. Multi-audit breadcrumb cites 8 audit IDs after 5a #4 (will reach 9 after 5b #5).', '★ Critical: IRC §61 + §72 gross income inclusion.'],
  ['Form 1040 line 11a/11b (AGI), line 15 (taxable income)', 'Indirect via line 9 contribution.', 'Carries the full taxable pension amount through the income waterfall.'],
  ['Form 1040 line 5a — sibling output', 'income.setPensionsAndAnnuities(line5a) at buildIncome', 'Line 5b is NOT identical to line 5a (gross). Line 5a may be blank when fully-taxable; line 5b is always present when pension activity exists.'],
  ['Form 5329 (early distribution additional tax)', 'When hasEarlyDistributionAdditionalTaxForForm5329=true, generated per-return (5a #9 cardinality).', 'Schedule 2 line 8 destination. NOT a line 5b consumer directly — Form 5329 reads earlyDistributionBase from per-person computation, not line 5b.'],
  ['NOT in Schedule B', '—', 'Pension/annuity distributions don\'t flow to Schedule B (which is for interest + dividends only).'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 28 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 5b'],
  ['Line 5b inputs overlap heavily with line 5a (same filtering + accumulation) plus the Simplified Method / General Rule / rollover / PSO chain.'],
  [],
  ['#', 'Source xlsx', 'Field path / model key', 'Label / box', 'Required?', 'Role in line 5b compute', 'Cross-reference'],
  [],
  ['STATEMENT INPUTS — 1099-R (NON-IRA only)'],
  [1, 'form-1099-r.xlsx', 'iraSepSimple', 'IRA/SEP/SIMPLE box', 'YES — MIRROR filter', 'SKIP when TRUE (routes to lines 4a/4b/4c).', '5a #6'],
  [2, 'form-1099-r.xlsx', 'grossDistributionAmount (box 1)', '1099-R box 1', 'YES — gross + rollover base', 'Per-person gross1099R accumulator. Used as rollover reduction base per Pub. 575 Gap 4 fix.', 'Issue #7'],
  [3, 'form-1099-r.xlsx', 'taxableAmountAmount (box 2a)', '1099-R box 2a', 'YES — primary line 5b feed', 'Per-person taxable1099R accumulator. Default starting point unless Simplified/General Rule applies.', 'IRS 1099-R box 2a'],
  [4, 'form-1099-r.xlsx', 'taxableAmountNotDetermined (box 2b)', '1099-R box 2b', 'NO — verification', 'Triggers hasTaxableNotDetermined → flags Simplified/General Rule consideration.', 'IRS Pub. 575'],
  [5, 'form-1099-r.xlsx', 'employeeOrRothContributionsOrPremiumsAmount (box 5)', '1099-R box 5', 'NO — basis recovery', 'Per-person employeeContributionsBox5 accumulator. Used in rollover reduction (box5Offset) per Pub. 575 Gap 4 fix.', 'IRS Pub. 575'],
  [6, 'form-1099-r.xlsx', 'distributionCodes (box 7)', '1099-R box 7', 'YES — for Form 5329 routing', 'Codes 1 (early) / S (early SIMPLE) → earlyDistributionBase. NOT a line 5b input but affects Form 5329.', '5a #9'],
  [7, 'form-1099-r.xlsx', 'recipientTIN', '1099-R recipient TIN', 'YES — SSN attribution', 'belongsToPersonIra (generic SSN helper per 5a #8). **MFS-protected via 5a #1**.', '5a #1, #6, #8'],
  [],
  ['STATEMENT INPUTS — RRB-1099-R'],
  [8, 'form-rrb-1099-r.xlsx', '(5 boxes: 3, 4, 5, 6, 7)', 'RRB components per 5a #7', 'YES — RRB taxable feed', 'Per-person taxableRrb accumulator. Always-taxable VDB + Supplemental; conditional Box 4 NSSEB; Box 7 fallback.', '5a #7'],
  [],
  ['PERSONAL FORM INPUTS — Simplified Method (Pub. 575)'],
  [9, 'form-pension-income-taxpayer.xlsx', 'simplifiedMethod.needsSimplifiedMethodComputation', 'Use Simplified Method?', 'NO — flag', 'Triggers computeSimplified override at line 6011.', 'IRS Pub. 575'],
  [10, 'form-pension-income-taxpayer.xlsx', 'simplifiedMethod.investmentInContractCostSimplifiedMethod', 'Cost basis in contract', 'YES if Simplified', 'Numerator of basis-recovery fraction.', 'IRS Pub. 575 Simplified Method Worksheet'],
  [11, 'form-pension-income-taxpayer.xlsx', 'simplifiedMethod.annuitantAgeAtStartingDate', 'Age at annuity start', 'YES if Simplified', 'Determines factor (360/310/260/210/160).', 'IRS Pub. 575 age table'],
  [12, 'form-pension-income-taxpayer.xlsx', 'simplifiedMethod.jointAnnuitantAgeAtStartingDate', 'Joint annuitant age', 'NO', 'Used for joint-life factor when applicable.', 'IRS Pub. 575'],
  [13, 'form-pension-income-taxpayer.xlsx', 'simplifiedMethod.numberOfAnnuityPaymentsReceivedInTaxYear', 'Number of payments', 'YES if Simplified', 'Multiplier for monthly exclusion → annual exclusion.', 'IRS Pub. 575'],
  [14, 'form-pension-income-taxpayer.xlsx', 'simplifiedMethod.priorYearTaxFreeRecoveryAmount', 'Prior-year tax-free recovery', 'NO', 'Reduces remainingBasis for current-year computation.', 'IRS Pub. 575'],
  [],
  ['PERSONAL FORM INPUTS — General Rule (Pub. 939)'],
  [15, 'form-pension-income-taxpayer.xlsx', 'generalRule.needsGeneralRuleComputation', 'Use General Rule?', 'NO — flag', 'Triggers computeGeneralRule override at line 6015.', 'IRS Pub. 939'],
  [16, 'form-pension-income-taxpayer.xlsx', 'generalRule.* (multiple fields)', 'General Rule inputs', 'NO', 'Per Pub. 939 computation.', 'IRS Pub. 939'],
  [],
  ['PERSONAL FORM INPUTS — Rollover (Exception 1)'],
  [17, 'form-pension-income-taxpayer.xlsx', 'rollover.hadPensionRollover', 'Pension rollover?', 'NO — flag', 'Triggers hasRollover → line 5c box 1 + rollover reduction in line 5b chain.', 'IRS Exception 1'],
  [18, 'form-pension-income-taxpayer.xlsx', 'rollover.totalPensionRolloverAmount', 'Total rollover amount', 'NO', 'Subtracted from rolloverBase (gross1099R per Gap 4 fix).', 'IRS Pub. 575'],
  [19, 'form-pension-income-taxpayer.xlsx', 'rollover.taxableEmployeeContributionsAlreadyTaxedBox5Total', 'Box 5 offset', 'NO', 'box5Offset used in rollover reduction. Falls back to employeeContributionsBox5 when null.', 'IRS Pub. 575 Gap 4 fix'],
  [],
  ['PERSONAL FORM INPUTS — PSO Exclusion (IRC §402(l))'],
  [20, 'form-pension-income-taxpayer.xlsx', 'pso.isEligibleRetiredPublicSafetyOfficer', 'Eligible retired PSO?', 'NO — eligibility flag', 'PSO requires BOTH eligibility AND election. Eligibility per IRC §402(l).', 'IRC §402(l)'],
  [21, 'form-pension-income-taxpayer.xlsx', 'pso.electsPsoPremiumExclusion', 'Elects PSO exclusion?', 'NO — election flag', 'Affirmative election required on return.', 'IRC §402(l)'],
  [22, 'form-pension-income-taxpayer.xlsx', 'pso.totalQualifyingPsoPremiumsPaid', 'Total PSO premiums paid', 'NO (if elected)', 'Capped at $3,000 via minNonNull. Subtracted from taxableAfterRollover.', 'IRC §402(l) cap'],
  [],
  ['IDENTITY INPUTS'],
  [23, 'form-identification-taxpayer.xlsx', 'taxpayerIdentity.ssn', 'Taxpayer SSN', 'YES', 'Drives 1099-R + RRB attribution.', 'Standard SSN attribution'],
  [24, 'form-identification-spouse.xlsx', 'spouseIdentity.spouseSsn', 'Spouse SSN', 'YES on MFJ', 'Nulled on MFS via 5a #1 guard.', '5a #1'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 42 }, { wch: 65 }, { wch: 55 }, { wch: 30 }, { wch: 80 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 5b'],
  [],
  ['Constant', 'Value', 'Source', 'Used by line 5b?', 'Notes'],
  [],
  ['Direct — PSO exclusion cap'],
  ['PSO_ANNUAL_EXCLUSION_CAP', '$3,000', 'IRC §402(l); IRS Pub. 575', 'YES — Step 8', 'Hard-coded inline at line 6043 (`new BigDecimal("3000")`). Per-person cap on PSO premium exclusion. Stable IRS rule (not annually-indexed since enactment).'],
  [],
  ['Direct — Simplified Method age-based factor table (Pub. 575)'],
  ['SIMPLIFIED_METHOD_FACTOR_SINGLE_LIFE', '360 / 310 / 260 / 210 / 160 (by age bracket)', 'IRS 2025 Pub. 575 Simplified Method Worksheet', 'YES — Step 5', 'Single-life factors. Implemented in determineSimplifiedMethodFactor helper. Age brackets: ≤55 → 360; 56-60 → 310; 61-65 → 260; 66-70 → 210; ≥71 → 160.'],
  ['SIMPLIFIED_METHOD_FACTOR_JOINT', '(joint-life table)', 'IRS 2025 Pub. 575', 'YES — Step 5', 'Joint-life factors when jointAnnuitantAge is present.'],
  [],
  ['Indirect — Form 5329 (early-distribution additional tax)'],
  ['EARLY_DISTRIBUTION_ADDITIONAL_TAX_RATE', '10%', 'IRC §72(t)', 'NO (5a #9 — Schedule 2)', 'Hard-coded inline at line 6038 (`new BigDecimal("0.10")`). Routes to Form 5329 → Schedule 2 line 8.'],
  [],
  ['Statutory references'],
  ['Gross income includes taxable pension/annuity', 'IRC §61 + §72', 'Line 5b enters line 9 (total income) per IRC §61 + §72.'],
  ['Simplified Method', 'IRS Pub. 575 Simplified Method Worksheet', 'For qualified-plan annuity starting dates after Nov 18, 1996.'],
  ['General Rule', 'IRC §72(d); IRS Pub. 939', 'For pre-Nov 18, 1996 annuity starting dates + nonqualified plans.'],
  ['Rollover treatment', 'IRC §402(c)/(e); IRS Pub. 575', 'Rolled-over portion is NOT taxable. Subtracted from gross1099R (Gap 4 fix).'],
  ['PSO exclusion', 'IRC §402(l)', 'Retired Public Safety Officer health/LTC insurance premium exclusion. $3,000 cap.'],
  ['RRB-1099-R not rollover-eligible', 'IRS RRB-1099-R instructions', 'RRB distributions cannot be rolled over to qualified plans.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 40 }, { wch: 55 }, { wch: 22 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 5b IS the Income Operand'],
  ['Line 5b is the value-bearing line that enters line 9 → AGI → taxable income → tax owed.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['Form 1040 line 5b (the cell itself)', 'TaxReturnComputeService.buildIncome() — income.setTaxablePensionsAnnuities(line5b)', '★ Primary output. Stored when non-null. Whole-dollar HALF_UP rounded.'],
  ['Form 1040 line 9 (total income)', 'Line 9 formula at lines 4159-4162 — line 5b is the 5th operand.', '★★ CRITICAL: IRC §61 + §72 inclusion. Carries to AGI → taxable income → tax.'],
  ['Form 1040 line 11a/11b (AGI), line 15 (taxable income)', 'Indirect via line 9.', 'Full taxable pension amount propagates.'],
  ['Form 1040 line 5a (sibling)', 'income.setPensionsAndAnnuities(line5a)', 'Line 5a may be blank (fully-taxable simple case) while line 5b carries the value.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Schedule B', '—', 'Pension/annuity distributions don\'t flow to Schedule B.'],
  ['Form 8960 NIIT', '—', 'Out of scope per CLAUDE.md.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 5b Participates in Shared 5abc Flags'],
  ['No line-5b-specific flags. Same flag set as line 5a (covered by 5a Validation Flags sheet).'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['PENSION_STATEMENT_UPLOAD_REQUIRED', 'BLOCKING', 'hadPensionOrAnnuityIncome=true but no 1099-R/RRB uploaded', '5a Validation Flags'],
  ['FORM5329_EXCEPTION_CODE_REQUIRED', 'BLOCKING', 'requiresForm5329=true but no exceptionCodeOrReason provided', '5a Validation Flags'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 50 }, { wch: 28 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 5b shares the same orchestrator + per-person aggregator with line 5a. Like 2b vs 2a / 3b vs 3a / 4b vs 4a, this audit is shared-aggregator cross-reference-heavy. Most concerns extend prior 5a closures via multi-audit-trail consolidation. Verified 2026-05-12.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — MFS GUARD CASCADE ALREADY APPLIES (5a #1 + 5b #1, 2-AUDIT CONSOLIDATION)', 'Line 5b is one of the 7+ outputs in the 5a #1 high-leverage MFS cascade. **Line 5b is the BOTTOM-LINE REVENUE-BEARING line** of the pension pair (line 5b IS in line 9 per 5b #5; line 5a is excluded per 5a #4 gross-vs-taxable pattern), so MFS protection here has more bottom-line tax impact than on line 5a. Closure: extended the MFS-guard breadcrumb at TaxReturnComputeService.java:5751-5769 from citing "5a #1" to "5a #1 + 5b #1, both verified 2026-05-12" — multi-audit-trail consolidation now **2 audit IDs** at this site. Added a clarifying sentence noting the bottom-line tax impact. Lock-in test `mfsExcludesSpousePensionFromLine5a` (added during 5a #1) explicitly asserts line 5b = $6,000 (taxpayer-only) — re-run passed.', 'TaxReturnComputeService.java:5751-5769 (extended 2-audit MFS-guard breadcrumb); test mfsExcludesSpousePensionFromLine5a (re-run pass)', 'CLOSED via 5a #1 cascade — multi-audit consolidation extended.'],
  [2, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — KNOWLEDGE FILE ALREADY RENAMED VIA 5a #2', '`knowledge/line-5abc-pension-annuity.md` (renamed from `knowledge-line-5abc-pension-annuity.md` during 5a #2 yesterday) is a shared file covering all three pension/annuity-family lines (5a + 5b + future 5c). No YAML frontmatter to update (file uses plain `# Knowledge — ...` heading). Header-comment reference in `generate-5b.js` already uses the new name (written after the rename). Two historical inbound markdown references preserved per audit-trail-preserves-history convention. Pure xlsx-flip closure — same shape as 2b #3 (closed via 2a #4), 3b #2 + 3c #2 (closed via 3a #2), 4b #2 + 4c #2 (closed via 4a #2).', 'C:\\us-tax\\knowledge\\line-5abc-pension-annuity.md (already correctly named)', 'CLOSED via 5a #2 — pure xlsx-flip closure. No action needed for 5b walkthrough.'],
  [3, 'RESOLVED 2026-05-12 — SPEC VERIFICATION LOG EXTENDED WITH 5b ROW (2nd row)', 'lines/5abc.md Verification log had 1 row (5a walkthrough). Closure: appended a 2nd in-progress row capturing the 5b walkthrough as a separate event. Audit-trail-per-walkthrough convention preserved (same shape as 2b #2 / 3b #3 / 4b #3). The 5b row will be finalized to "COMPLETE — 10/10 closed" during end-of-walkthrough docs-update step.', 'lines/5abc.md Verification log (5b row added as 2nd row)', 'CLOSED — spec verification log updated. 2 rows now present (5a complete + 5b in progress).'],
  [4, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — 0-VS-NULL COMPLIANCE EXTENDS TO LINE 5b PATH (4-STAGE CHAIN)', 'Verified the line-5b path is null-preserving end-to-end through the 4-stage transformation chain: STAGE 1 Simplified Method override (line 6013, null-fallback); STAGE 2 General Rule override (line 6017, null-fallback); STAGE 3 rollover branch (lines 6030-6037, null pass-through when !hasRollover; ZERO when hasRollover+gross1099R=null is canonical concept-applies-but-zero); STAGE 4 PSO branch (lines 6044-6046, null pass-through when !hasPsoElection; subtractNonNegative preserves null otherwise). Closure: expanded the TAXABLE path section of the existing 5a #5 breadcrumb (lines 6080-6094) from a brief 6-line summary to a **14-line 4-stage trace** documenting each stage explicitly. Multi-audit citation updated from "5a #5" to "5a #5 + 5b #4, both verified 2026-05-12". Same shape as 2b #4 / 3b #4 / 4b #4 (extended existing per-person 0-vs-null breadcrumbs).', 'TaxReturnComputeService.java:6080-6094 (expanded TAXABLE path 4-stage trace + multi-audit citation)', 'CLOSED — verified-correct cross-reference. Breadcrumb expanded; no code change.'],
  [5, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — LINE 5b IS IN LINE 9 (9-AUDIT CONSOLIDATION + 5a/5b BILATERAL COVERAGE MILESTONE)', 'Line 9 formula at TaxReturnComputeService.java:4163-4166: line 5b is the 5th operand (INTENTIONALLY INCLUDED per IRC §61 + §72). Inverse confirmation of 5a #4 (line 5a EXCLUDED as gross/disclosure-only). Closure: extended the line-9 breadcrumb at lines 4135-4156 from **8 audit IDs** to **9 audit IDs** (added 5b #5). **5a/5b bilateral coverage milestone**: 2nd of three gross-vs-taxable distribution pairs to achieve bilateral coverage (4a/4b first via 4b #5; 5a/5b second via 5b #5 TODAY; future 6a/6b third). Updated the line-5b operand description (fulfilled the "5b inverse confirmation pending" note from 5a #4). Updated the gross-vs-taxable pattern progress note from "5a verified today, 5b inverse pending" to "5a/5b complete bilateral". Lock-in test `line9EqualsLine1zPlusOtherIncomeLines` re-run passed.', 'TaxReturnComputeService.java:4135-4156 (extended 9-audit breadcrumb + bilateral-coverage milestone update); test line9EqualsLine1zPlusOtherIncomeLines (re-run pass)', 'CLOSED — verified-correct cross-reference. 9-audit consolidation + 5a/5b bilateral milestone complete.'],
  [6, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — PER-PERSON TAXABLE COMPUTATION CHAIN (4-STAGE)', '4-stage sequential transformation per IRS Pub. 575 + IRC §72 + IRC §402(l): STAGE 0 init (taxableBase = (taxable1099R || gross1099R fallback) + taxableRrb); STAGE 1 Simplified Method override (Pub. 575, null-fallback); STAGE 2 General Rule override (Pub. 939, null-fallback); STAGE 3 Rollover reduction (Pub. 575 Gap 4 fix per 5b #7); STAGE 4 PSO exclusion (IRC §402(l) cap per 5b #8). Each stage null-preserving via fallback or subtractNonNegative. Computational order matches IRS Pub. 575 worksheet order: basis-recovery methods FIRST, THEN rollover, THEN PSO. Closure: **22-line breadcrumb** at TaxReturnComputeService.java:6006-6027 documenting all 5 stages (0-4) with IRS source per stage + null-preservation strategy + computational-order rationale + cross-references to 5b #4 (null-preservation trace), 5b #7 (Gap 4 fix), 5b #8 (PSO cap), 5b #9 (Simplified-vs-General mutual exclusion). Contrast with 4b #6 three-protection chain (4 stages vs 1 — reflects pension-side complexity).', 'TaxReturnComputeService.java:6006-6027 (22-line breadcrumb above 4-stage taxable computation chain)', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [7, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — Pub. 575 Gap 4 fix (rollover base = gross1099R, NOT box 2a)', 'Historical fix documented in expanded breadcrumb. Pre-fix bug: starting from box 2a double-deducted box 5 when the payer pre-netted employee basis. Concrete example documented (box 1=$50k, box 2a=$40k pre-netted, rollover=$30k, box5Offset=$10k): pre-fix produced $0 (box 5 deducted twice), post-fix produces correct $10k (box 5 deducted once via explicit box5Offset). RRB re-added because not rollover-eligible per IRS rules (without re-adding, filer with pension + RRB + rollover would lose taxableRrb). box5Offset fallback explained (explicit user field → employeeContributionsBox5 auto-accumulated). Closure: replaced the 3-line inline comment at lines 6057-6059 with a **14-line breadcrumb** at lines 6057-6070 documenting (a) Pub. 575 source; (b) box 5 double-deduction failure mode with concrete example; (c) RRB re-add rationale; (d) box5Offset fallback to employeeContributionsBox5.', 'TaxReturnComputeService.java:6057-6070 (14-line breadcrumb expanding Gap 4 fix documentation)', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [8, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — PSO EXCLUSION ($3,000 cap from IRC §402(l))', 'Verified 3 protections: (1) DOUBLE-GATE for eligibility (`isEligiblePso AND electsPso`) — both eligibility per occupational category AND affirmative election required; (2) $3,000 cap via `minNonNull(psoPremiums, new BigDecimal("3000"))` — stable IRS rule (not annually-indexed); (3) zero-floor via subtractNonNegative — clamps to ZERO when exclusion exceeds taxableAfterRollover. SECURE 2.0 (post-2024) update noted: premiums may now be paid DIRECTLY by retiree (previously required deduction from pension). Closure: 12-line breadcrumb at TaxReturnComputeService.java:6080-6091 documenting: (a) IRC §402(l) source + IRS Pub. 575; (b) double-gate design; (c) $3,000 cap rationale + similar Schedule B $1,500 hard-coded pattern; (d) SECURE 2.0 directly-paid update; (e) qualifying premiums scope (health + LTC for PSO/spouse/dependents); (f) zero-floor protection.', 'TaxReturnComputeService.java:6080-6091 (12-line breadcrumb above PSO exclusion logic)', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [9, 'RESOLVED 2026-05-12 — OBSERVATION — SIMPLIFIED METHOD vs GENERAL RULE mutual-exclusion gap + per-annuity basis-recovery limitation', 'Two-part closure: (a) Soft validation gap — both `needsSimplifiedMethod` AND `needsGeneralRule` can be true simultaneously; General Rule (computed second) wins if both flagged. UI should expose ONE annuity-method selector but doesn\'t enforce mutual exclusion at backend. Pub. 575 (post-Nov 1996 qualified plans) vs Pub. 939 (pre-Nov 1996 + nonqualified) — exactly one applies per annuity. (b) Broader per-annuity gap — current code computes basis recovery at per-person AGGREGATE level (single Simplified Method / General Rule call across all the person\'s pensions). Spec §3.2 requires per-annuity-stream computation. Real-world incidence rare (most retirees have one annuity). Closure: 14-line breadcrumb at TaxReturnComputeService.java:6039-6053 documenting both gaps + mutual-exclusion intent + General-Rule-wins precedence + per-person aggregate limitation cross-reference to outstanding.md. **New outstanding.md entry** "Line 5b: Per-Annuity Basis Recovery (Simplified Method / General Rule)" — ~3-5 hour scope refactor (annuityStreams[] repeating section, per-stream method selector, frontend UI, backwards-compat); Low priority (niche user group).', 'TaxReturnComputeService.java:6039-6053 (14-line breadcrumb above Simplified/General Rule overrides); outstanding.md (new entry — per-annuity basis recovery)', 'CLOSED — observation + deferral. Breadcrumb + outstanding.md entry.'],
  [10, 'RESOLVED 2026-05-12 — OBSERVATION — 5a/5b BILATERAL COVERAGE COMPLETE (2nd gross-vs-taxable pair)', 'The 5a/5b pair is the **second of three gross-vs-taxable distribution-line pairs** on Form 1040 to achieve bilateral coverage at the line-9 breadcrumb (gross-side exclusion via 5a #4; taxable-side inclusion via 5b #5 today). Pattern progress: 4a/4b first (4b #5/#10 from 2026-05-11), 5a/5b second (5b #5/#10 today), future 6a/6b third (Social Security with its own IRC §86 taxable-portion computation per Pub. 915). The line-9 breadcrumb already documents the milestone after the 5b #5 update. Future 6a/6b audits will inherit the verification template: MFS guard extending cascade to 11 orchestrators, gross-vs-taxable pattern, bilateral coverage shape. Pure xlsx-flip observation. Same shape as 4b #10 (first gross-vs-taxable bilateral milestone). Cumulative through 5b: 20 lines audited, 9-audit consolidation at line-9 site, 10 MFS-protected orchestrators, 12-line knowledge-file convergence, 2 gross-vs-taxable pairs with bilateral coverage.', 'XLS/computations/5b.xlsx audit-trail (this row); no code change', 'CLOSED — pure xlsx-flip observation. Positions future 6a/6b audits.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 32 }, { wch: 95 }, { wch: 65 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 5b Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.taxablePensionsAnnuities', 'topmostSubform[0].Page1[0].f1_66[0] (line5b_pensions_annuities_taxable_amount)', 'form-tax-return-1040.xlsx (line 5b cell)', '★ Primary output. Whole-dollar HALF_UP rounded.'],
  ['form1040.income.pensionsAndAnnuities (sibling)', 'topmostSubform[0].Page1[0].f1_65[0] (line5a_pensions_annuities)', 'form-tax-return-1040.xlsx (line 5a cell)', 'Line 5a — gross/disclosure (may be blank).'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 9 (total income)', '—', 'form-tax-return-1040.xlsx (line 9 cell)', '★★ INCLUDED as 5th operand. Carries to line 11a/11b AGI, line 15 taxable income, line 16 tax.'],
  ['Form 5329 (per-return)', '—', 'form-tax-return-5329.xlsx', 'Generated separately when hasEarlyDistributionAdditionalTaxForForm5329=true. NOT a line 5b consumer directly.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Schedule B', '—', '—', 'Pension/annuity distributions don\'t flow to Schedule B.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 70 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
