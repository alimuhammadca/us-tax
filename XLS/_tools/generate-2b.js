// ============================================================================
//  Generates: C:\us-tax\XLS\computations\2b.xlsx
//  Source-of-truth references:
//    - lines/2ab.md (covers BOTH 2a and 2b; §7.1 rewritten 2026-05-11 during 2a audit)
//    - dependencies/2ab.md
//    - knowledge/line-2ab-interest-income.md (renamed 2026-05-11 during 2a #4)
//    - TaxReturnComputeService.computeInterestIncome() lines ~4291-4470 (orchestrator)
//    - TaxReturnComputeService.computeInterestForPerson() lines ~4473-4584 (per-person aggregator)
//    - TaxReturnComputeService.buildScheduleB() (Schedule B emitter)
//    - ReferenceData.java — no line-2b-specific constants
//    - IRS 2025 Form 1040 instructions (i1040gi_2025.pdf): line 2b "Taxable interest"
//    - IRS 2025 Schedule B instructions (i1040sb)
//    - IRS 2025 Publication 550 (Investment Income and Expenses)
//    - PDF field: topmostSubform[0].Page1[0].f1_59[0] (line2b_taxable_interest)
//
//  Tax year: 2025
//
//  NOTE: Many findings in this audit are CROSS-REFERENCES to the line 2a (2a.xlsx) audit
//  completed 2026-05-11. Both lines share the same compute path (`computeInterestForPerson`);
//  the MFS guard, knowledge file rename, spec refresh, and 0-vs-null compliance all already
//  closed during the 2a audit. The 2b audit verifies they cascade correctly AND identifies
//  2b-specific concerns (premium double-count risk, multi-stage zero-floor, Schedule B Part I).
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '2b.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 2b — TAXABLE INTEREST'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 2b'],
  ['Concept', 'Total taxable interest reported on the return. Includes 1099-INT box 1 + box 3 (Treasury) + 1099-OID box 1 + classified portion of 1099-OID box 2 + manual taxable interest. Reduced by premium adjustments (box 11, box 12, box 6) at per-entry level, then by user-entered adjustments (accrued, nominee, premium-not-on-statements), then by Schedule B line 3 savings bond exclusion. **ENTERS line 9 (total income), AGI, and taxable income** (unlike line 2a which is excluded).'],
  ['Per-Person Formula', 'taxableInterestBeforeExclusion = Σ 1099-INT (box1 + box3 - box11 - box12)  // per-entry, subtractNonNegative floors at zero\n  + Σ 1099-OID (box1 - box6)\n  + taxable portion of Σ 1099-OID box 2\n  + manualTaxableInterestNotOnStatements\n  − (accruedInterestPaidAdjustment + nomineeInterestAdjustment\n     + taxableBondPremiumAdjustmentNotInStatements + treasuryBondPremiumAdjustmentNotInStatements\n     + oidAcquisitionPremiumAdjustmentNotInStatements)  // subtractNonNegative at adjustment-level'],
  ['Per-Return Formula', 'line2b = roundMoney( subtractNonNegative( addNonNull(taxpayer.taxableBefore, spouseResult.taxableBefore), savingsBondExclusionAmount ) )'],
  ['Filed', 'Direct entry on Form 1040 line 2b. PDF field: topmostSubform[0].Page1[0].f1_59[0] (semantic name: line2b_taxable_interest). When Schedule B is required, the same value also appears on Schedule B Part I line 4.'],
  ['Backend method', 'TaxReturnComputeService.computeInterestForPerson() — per-person aggregation at lines ~4473-4584.\nReturn-level aggregation + savings bond exclusion in computeInterestIncome() lines ~4378-4470.\nSchedule B emission in buildScheduleB().'],
  ['Output', 'form1040.income.taxableInterest (BigDecimal; null when no contributions; ZERO when concept applies but sum is 0). ALSO scheduleB.line4TaxableInterest (must equal line 2b when Schedule B is required).'],
  ['IRS source', 'IRS 2025 Form 1040 instructions for line 2b; Schedule B instructions; Pub. 550 (taxable interest); 1099-INT/OID/DIV instructions'],
  [],
  ['STEP-BY-STEP COMPUTATION (per person, then aggregated)'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Filter 1099-INT entries by recipient SSN', 'belongsToPerson() at line 8210. Same shared filter used by line 2a. MFS guard added 2026-05-11 (2a.xlsx Issue #1) cascades to 2b — when isMfsReturn=true, spouseSsn is nulled at the orchestrator → spouse-attributed entries are rejected.'],
  [2, 'Per 1099-INT: compute entry taxable amount', 'entryTaxableInterest = subtractNonNegative(addNonNull(box1, box3), addNonNull(box11, box12))\n\n• box1 = taxable interest\n• box3 = U.S. Treasury / savings bonds interest\n• box11 = "Bond premium" (reduces box 1)\n• box12 = "Bond premium on Treasury obligations" (reduces box 3)\n• subtractNonNegative floors at zero (per-entry premium can\'t make taxable interest negative — first of 3 zero-floor stages)'],
  [3, 'Per 1099-OID: compute entry taxable amount (excluding box 2)', 'entryTaxableOidExcludingBox2 = subtractNonNegative(box1, box6)\n\n• box1 = "Original issue discount" (taxable)\n• box6 = "Acquisition premium" (reduces taxable OID)\n• subtractNonNegative floors at zero'],
  [4, 'Per 1099-OID: accumulate box 2 total for classification', 'oidBox2Total = addNonNull(oidBox2Total, box2)\n\n• box2 = "Other periodic interest" — may be TAXABLE or tax-exempt (depending on the bond)\n• User classifies via personal-form fields in Step 7'],
  [5, 'Aggregate per-1099 taxable amounts', 'taxableInterestBeforeExclusion = addNonNull(\n  taxableInterestBeforeExclusion,\n  entryTaxableInterest + entryTaxableOidExcludingBox2\n)\n\nPer-entry already-rounded amounts accumulate. addNonNull treats null operands as zero.'],
  [6, 'Add Schedule B Part I per-payer item', 'addScheduleBItem(scheduleBInterestItems, payerName, entryTaxableInterest)\n\nThe per-1099 amount becomes a Schedule B Part I line-1 row (only emitted when Schedule B is required).'],
  [7, 'Apply 1099-OID box 2 classification', 'taxableBox2 = taxablePortionFrom1099OidBox2Override ?? subtractNonNegative(oidBox2Total, taxExemptStatedInterestFrom1099OidBox2)\ntaxableInterestBeforeExclusion = addNonNull(taxableInterestBeforeExclusion, taxableBox2)\n\nUser personal-form override short-circuits; default is total box 2 minus the tax-exempt portion the user classified (Step 7 in line 2a audit).'],
  [8, 'Add manual taxable interest (not on statements)', 'taxableInterestBeforeExclusion = addNonNull(taxableInterestBeforeExclusion, manualTaxableInterestNotOnStatements)\n\nCovers sub-$10 unreported interest, market discount on tax-exempt bonds (which is TAXABLE per IRC §1276), other 1099-less interest.'],
  [9, 'Apply user-entered taxable adjustments at PERSON level', 'taxableAdjustments = accruedInterestPaidAdjustment + nomineeInterestAdjustment + taxableBondPremiumAdjustmentNotInStatements + treasuryBondPremiumAdjustmentNotInStatements + oidAcquisitionPremiumAdjustmentNotInStatements\n\ntaxableInterestBeforeExclusion = subtractNonNegative(taxableInterestBeforeExclusion, taxableAdjustments)\n\n**second of 3 zero-floor stages**. NOTE: premium adjustments here can be double-counted with the per-entry box 11/12/box 6 subtraction at Steps 2/3 — see Code Validation #6.'],
  [10, 'Aggregate to per-return value (before savings bond exclusion)', 'taxableBeforeExclusion = addNonNull(taxpayer.taxableInterestBeforeSavingsBondExclusion(), spouseResult.taxableInterestBeforeSavingsBondExclusion())\n\nReturn-level sum. Note: MFS guard (2a #1) ensures spouse contribution is null on MFS returns.'],
  [11, 'Apply Schedule B line 3 savings bond exclusion (Form 8815)', 'line2b = subtractNonNegative(taxableBeforeExclusion, scheduleBLine3SavingsBondExclusion)\n\nUser-entered `savingsBondExclusionAmount` (Form 8815 manual entry — auto-compute deferred per outstanding.md:1253). **third of 3 zero-floor stages** — line 2b can never go negative.'],
  [12, 'Round to whole dollars', 'line2b = roundMoney(line2b)\n\nWhole-dollar HALF_UP rounding. Sub-line amounts are already pre-rounded; this is a no-op for non-null aggregates.'],
  [13, 'Persist on form1040.income; emit Schedule B if triggered', 'income.setTaxableInterest(line2b)\n\nWhen scheduleBRequired = true (9 triggers — see Validation Flags sheet), buildScheduleB() also emits scheduleB.line4TaxableInterest = line2b.'],
  [],
  ['MUTUAL EXCLUSION RULES (enforced by code or spec)'],
  ['Rule', 'Implementation', 'Why'],
  ['Line 2b IS in line 9 / AGI / line 15', 'Line 9 formula at TaxReturnComputeService.java:4130-4133 includes line2b as the 2nd operand: `addNonNull(line1z, line2b)`. (Opposite of line 2a which is excluded.)', 'Per IRC §61(a)(4), taxable interest is gross income.'],
  ['Three zero-floor stages — line 2b ≥ 0', 'subtractNonNegative at line 4501 (per-entry box 11/12), at line 4579 (person-level adjustments), at line 4402 (savings bond exclusion).', 'IRS rule: premium / exclusion reduces interest ONCE per entry; line 2b cannot go negative.'],
  ['Premium adjustments applied ONCE per source', '1099-INT box 11/12: subtracted at per-entry Step 2 only. Personal-form premium-adjustment fields: subtracted at person-level Step 9 only.', 'IRS Pub. 550: bond premium reduces interest once. UI gate `payerAlreadyReportedNetInterestOrOid` advises the user but is NOT enforced by backend — Code Validation #6 documents the gap.'],
  ['Schedule B trigger uses post-exclusion value', 'Line 4431: `taxableInterest.compareTo(new BigDecimal("1500")) > 0`. The `taxableInterest` variable here is POST-savings-bond-exclusion.', 'Technical letter-of-the-rule reading: IRS instructions say "gross interest income > $1,500". In practice harmless because any positive savings bond exclusion itself triggers Schedule B via the `hasSavingsBondExclusion` check.'],
  ['1099-INT box 6 (foreign tax paid) NOT in line 2b', '1099-INT box 6 is read separately at TaxReturnComputeService.java:~19321-19330 for Form 1116 (foreign tax credit). NOT a reduction of line 2b.', 'Per IRS rules, foreign tax paid is a CREDIT (Form 1116 / Schedule 3 line 1) or itemized deduction — never a reduction of taxable interest itself.'],
  ['Tax-exempt market discount IS line 2b', 'Per IRC §1276: market discount on a tax-exempt bond accrues as TAXABLE interest. YAML help text updated 2026-05-11 (2a #10) to warn users against entering it in the tax-exempt field.', 'Easy mistake — users assume "tax-exempt bond" → tax-exempt for everything. The market discount is taxable.'],
  ['Manual interest paths summed at the Schedule B item level too', 'addScheduleBItem at line 4559 adds `personLabel + " manual taxable interest"` to scheduleBInterestItems.', 'Schedule B Part I requires per-payer detail. Manual interest gets a generic label since no 1099 payer name is available.'],
  ['Adjustment paths emit Schedule B items as NEGATIVE', 'addScheduleBItem at lines 4581-4585 uses negateIfPresent for accrued/nominee/premium adjustments.', 'Schedule B Part I shows reductions as negative line items so the line-2 total reconciles.'],
  [],
  ['DECISION TREE — what enters line 2b?'],
  ['Source', '1099 box (or personal form)', 'Sign', 'Notes'],
  ['1099-INT', 'box 1 (interest income)', '+', 'Primary taxable interest.'],
  ['1099-INT', 'box 3 (U.S. Treasury interest)', '+', 'Federal-taxable, state-exempt; backend treats as line 2b without distinguishing state treatment.'],
  ['1099-INT', 'box 11 (bond premium)', '−', 'Reduces box 1 per-entry. subtractNonNegative floors at zero.'],
  ['1099-INT', 'box 12 (Treasury bond premium)', '−', 'Reduces box 3 per-entry.'],
  ['1099-INT', 'box 6 (foreign tax paid)', '0 (NOT a reduction)', 'Feeds Form 1116 only. Cannot reduce line 2b.'],
  ['1099-OID', 'box 1 (OID)', '+', 'Per-entry, then aggregated.'],
  ['1099-OID', 'box 6 (acquisition premium)', '−', 'Reduces taxable OID. Floored at zero.'],
  ['1099-OID', 'box 2 (other periodic interest)', '+ taxable portion', 'User classifies via taxablePortionFrom1099OidBox2Override or taxExemptStatedInterestFrom1099OidBox2.'],
  ['Personal form', 'manualTaxableInterestNotOnStatements', '+', 'Catch-all for taxable interest without a 1099. Help text warns about tax-exempt-bond market discount classification.'],
  ['Personal form', 'accruedInterestPaidAdjustment', '−', 'When you bought a bond between interest dates, the price included accrued interest that the seller should report — subtract here.'],
  ['Personal form', 'nomineeInterestAdjustment', '−', 'Interest belonging to another taxpayer. Independently triggers Schedule B (Bug 3 fix 2026-04-13).'],
  ['Personal form', 'taxableBondPremiumAdjustmentNotInStatements', '−', 'Premium adjustment when payer DID NOT pre-net. UI gates via `payerAlreadyReportedNetInterestOrOid`; backend does NOT enforce — Code Validation #6.'],
  ['Personal form', 'treasuryBondPremiumAdjustmentNotInStatements', '−', 'Same as above but for Treasury premium.'],
  ['Personal form', 'oidAcquisitionPremiumAdjustmentNotInStatements', '−', 'Same as above but for OID acquisition premium.'],
  ['Personal form (TAXPAYER ONLY)', 'savingsBondExclusionAmount', '−', 'Schedule B line 3 reduction. Manual entry today (Form 8815 auto-compute deferred per outstanding.md:1253).'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 2b Flows'],
  ['Consumer', 'How', 'Notes'],
  ['Form 1040 line 9 (total income)', 'line9 = addNonNull(addNonNull(line1z, line2b), ...) at line 4130-4133', '★ Most important. Line 2b is the 2nd operand of line 9. Verified during 1z #7 + 2a #7 multi-audit consolidation.'],
  ['Form 1040 line 11b (AGI)', 'Indirect: AGI = line 9 − line 10. Line 2b reaches AGI via line 9.', ''],
  ['Form 1040 line 15 (taxable income)', 'Indirect: line15 = max(0, AGI − total deductions).', ''],
  ['Schedule B Part I line 2 (total interest)', 'scheduleB.line2TotalInterest set in buildScheduleB() — sum of scheduleBInterestItems before savings bond exclusion', 'When Schedule B is required, the per-payer detail must total to this line.'],
  ['Schedule B Part I line 3 (savings bond exclusion)', 'scheduleB.line3ExcludableInterestSeriesEeI = scheduleBLine3SavingsBondExclusion', 'User-entered (Form 8815 auto-compute deferred).'],
  ['Schedule B Part I line 4 (net taxable interest)', 'scheduleB.line4TaxableInterest = line2b', '★ Must equal Form 1040 line 2b exactly. Verified by spec invariant.'],
  ['EIC earned income worksheet', 'Investment-income ceiling check: line 2b contributes to the $11,950 (2025) ceiling that disqualifies EIC. NOT an additive component — a disqualification trigger only.', 'Investment income > ceiling → no EIC. Line 2b is one of the investment-income components.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 22 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 2b'],
  ['Sourced from C:\\us-tax\\XLS\\input_forms\\*.xlsx. Many fields shared with line 2a — cross-reference 2a.xlsx Inputs sheet for shared 1099-INT/OID/DIV details.'],
  [],
  ['#', 'Source xlsx', 'Field path / model key', 'Label / box', 'Required?', 'Role in line 2b compute', 'Cross-reference'],
  [],
  ['STATEMENT INPUTS — 1099-INT'],
  [1, 'form-1099-int.xlsx', 'interestIncomeAmount (box 1)', '1099-INT box 1 "Interest income"', 'YES — primary line 2b feed', 'Step 2: entryTaxableInterest = subtractNonNegative(addNonNull(box1, box3), addNonNull(box11, box12))', 'IRS 1099-INT instructions box 1'],
  [2, 'form-1099-int.xlsx', 'usSavingsBondsTreasuryInterestAmount (box 3)', '1099-INT box 3 "Interest on U.S. Savings Bonds and Treas. obligations"', 'YES when present', 'Step 2: added to box 1 in the per-entry subtractNonNegative chain', 'IRS 1099-INT instructions box 3'],
  [3, 'form-1099-int.xlsx', 'bondPremiumAmount (box 11)', '1099-INT box 11 "Bond premium"', 'CONDITIONAL — when broker pre-netted premium', 'Step 2: subtracted from box 1 per-entry', 'IRS 1099-INT instructions box 11'],
  [4, 'form-1099-int.xlsx', 'bondPremiumTreasuryAmount (box 12)', '1099-INT box 12 "Bond premium on Treasury obligations"', 'CONDITIONAL', 'Step 2: subtracted from box 3 per-entry', 'IRS 1099-INT instructions box 12'],
  [5, 'form-1099-int.xlsx', 'foreignTaxPaidAmount (box 6)', '1099-INT box 6 "Foreign tax paid"', 'NO — separate Form 1116 path', 'NOT used by line 2b. Read separately at line ~19321 for Form 1116 (foreign tax credit).', 'IRS 1099-INT instructions box 6; Form 1116'],
  [],
  ['STATEMENT INPUTS — 1099-OID'],
  [6, 'form-1099-oid.xlsx', 'originalIssueDiscountAmount (box 1)', '1099-OID box 1 "Original issue discount"', 'YES — taxable OID', 'Step 3: entryTaxableOidExcludingBox2 = subtractNonNegative(box1, box6)', 'IRS 1099-OID instructions'],
  [7, 'form-1099-oid.xlsx', 'otherPeriodicInterestAmount (box 2)', '1099-OID box 2 "Other periodic interest"', 'AMBIGUOUS — classified by personal form', 'Steps 4/7: oidBox2Total accumulated; user classifies taxable portion', 'IRS 1099-OID instructions box 2'],
  [8, 'form-1099-oid.xlsx', 'acquisitionPremiumAmount (box 6)', '1099-OID box 6 "Acquisition premium"', 'CONDITIONAL', 'Step 3: subtracted from box 1 per-entry', 'IRS 1099-OID instructions box 6'],
  [],
  ['STATEMENT INPUTS — Common'],
  [9, '(1099-INT/OID/DIV)', 'recipientTIN', 'Recipient TIN', 'YES — for SSN attribution', 'belongsToPerson at line 8210; MFS guard 2026-05-11 nulls spouseSsn on MFS', '2a.xlsx Issue #1'],
  [],
  ['PERSONAL FORM INPUTS — interest-income-taxpayer / -spouse'],
  [10, 'form-interest-income-taxpayer.xlsx', 'screening.hadInterestIncome', 'Did you have any interest income?', 'YES (boolean)', 'Gates statement-upload validation; affects belongsToPerson fallback', 'YAML: 2ab-interest-income-taxpayer.yaml'],
  [11, 'form-interest-income-taxpayer.xlsx', 'supplementalInterestAmounts.manualTaxableInterestNotOnStatements', 'Taxable interest not reported on statements', 'NO', 'Step 8: added to line 2b. Help text updated 2026-05-11 (2a #10 sister field for tax-exempt). Covers sub-$10 interest and tax-exempt-bond market discount (IRC §1276 — TAXABLE).', 'computeInterestForPerson line 4555'],
  [12, 'form-interest-income-taxpayer.xlsx', 'supplementalInterestAmounts.taxablePortionFrom1099OidBox2Override', 'Taxable portion of 1099-OID box 2 (override)', 'NO', 'Step 7: when set, OVERRIDES the computed split.', 'computeInterestForPerson line 4546-4549'],
  [13, 'form-interest-income-taxpayer.xlsx', 'interestAdjustments.accruedInterestPaidAdjustment', 'Accrued interest paid to seller', 'NO', 'Step 9: subtracted; emits Schedule B negative line item. Also triggers Schedule B requirement.', 'IRS Schedule B instructions'],
  [14, 'form-interest-income-taxpayer.xlsx', 'interestAdjustments.nomineeInterestAdjustment', 'Nominee interest belonging to another taxpayer', 'NO', 'Step 9: subtracted. Independently triggers Schedule B (Bug 3 fix 2026-04-13).', 'IRS Pub. 550 / 1099 nominee rules'],
  [15, 'form-interest-income-taxpayer.xlsx', 'interestAdjustments.taxableBondPremiumAdjustmentNotInStatements', 'Taxable bond premium not in statements', 'CONDITIONAL', 'Step 9: subtracted at person-level. **Potential double-count with 1099-INT box 11** if user enters both — Code Validation #6.', 'YAML row 11'],
  [16, 'form-interest-income-taxpayer.xlsx', 'interestAdjustments.treasuryBondPremiumAdjustmentNotInStatements', 'Treasury bond premium not in statements', 'CONDITIONAL', 'Step 9: subtracted. Same double-count risk with box 12.', 'YAML row 12'],
  [17, 'form-interest-income-taxpayer.xlsx', 'interestAdjustments.oidAcquisitionPremiumAdjustmentNotInStatements', 'OID acquisition premium not in statements', 'CONDITIONAL', 'Step 9: subtracted. Same double-count risk with 1099-OID box 6.', 'YAML row 14'],
  [18, 'form-interest-income-taxpayer.xlsx', 'interestAdjustments.payerAlreadyReportedNetInterestOrOid', 'Did broker already reduce reported interest/OID?', 'NO (UI-only gate)', 'Drives UI display of manual premium fields. BACKEND DOES NOT ENFORCE — see Code Validation #6.', 'YAML row 15'],
  [19, 'form-interest-income-taxpayer.xlsx', 'interestAdjustments.savingsBondExclusionAmount', 'Series EE/I savings bond exclusion (Form 8815)', 'NO', 'Step 11: subtracted via subtractNonNegative. **TAXPAYER FORM ONLY** (return-level reduction). Form 8815 auto-compute deferred per outstanding.md:1253.', 'lines/2ab.md §3.3'],
  [20, 'form-interest-income-taxpayer.xlsx', 'interestAdjustments.claimsSavingsBondExclusionForm8815', 'Claim Series EE/I exclusion?', 'NO (boolean trigger)', 'Triggers Schedule B requirement (`hasSavingsBondExclusion` check at line 4424).', 'YAML row 18'],
  [],
  ['IDENTITY INPUTS'],
  [21, 'form-identification-taxpayer.xlsx', 'taxpayerIdentity.ssn', 'Taxpayer SSN', 'YES', 'Drives 1099 recipientTIN attribution', 'Same as 2a Input #15'],
  [22, 'form-identification-spouse.xlsx', 'spouseIdentity.spouseSsn', 'Spouse SSN', 'YES on MFJ', 'Drives spouse 1099 attribution. MFS guard 2026-05-11 nulls this when isMfsReturn=true.', '2a.xlsx Issue #1'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 45 }, { wch: 60 }, { wch: 55 }, { wch: 30 }, { wch: 85 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data / Constants ──────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 2b'],
  ['Line 2b has ONE direct constant: the $1,500 Schedule B threshold. All other constants relevant to interest income (FBAR threshold, AMT preference, Form 8815 MAGI phaseout) belong to downstream consumers.'],
  [],
  ['Constant', 'Value', 'Source', 'Used by line 2b?', 'Notes'],
  [],
  ['Direct — used by Schedule B trigger logic at line 4431'],
  ['SCHEDULE_B_INTEREST_THRESHOLD', '$1,500', 'Hard-coded inline at TaxReturnComputeService.java:4431 (`new BigDecimal("1500")`)', 'YES — Schedule B Part I trigger', 'Schedule B Part I required when line 2b > $1,500. NOTE: the comparison uses POST-savings-bond-exclusion value; IRS letter-of-the-rule says "gross interest income > $1,500" (pre-exclusion). In practice harmless because any savings bond exclusion itself triggers Schedule B via hasSavingsBondExclusion.'],
  ['SCHEDULE_B_DIVIDEND_THRESHOLD', '$1,500', 'In computeDividendIncome() (cross-line)', 'NO (dividend path)', 'Same $1,500 threshold for ordinary dividends > $1,500 triggers Schedule B Part II. Mentioned here because Schedule B is shared.'],
  [],
  ['Indirect — referenced only when consumers pick up line 2b'],
  ['FBAR_AGGREGATE_THRESHOLD', '$10,000', 'IRS BSA E-Filing requirement; user-attestation', 'NO — captured via hasFbarRequirement boolean (Bug 2 fix 2026-04-13)', 'FBAR Part III line 7a-2 trigger. Separate from hasForeignAccount (which is "do you have a foreign account at all").'],
  ['EIC_INVESTMENT_INCOME_CEILING_2025', '$11,950', 'ReferenceData.INVESTMENT_INCOME_CEILING_EIC_2025', 'NO (EIC consumer)', 'Line 2b counts as investment income for the EIC disqualification check. > $11,950 → no EIC.'],
  ['FORM_8815_MAGI_PHASEOUT_SINGLE_2025', '$94,100–$124,100', 'IRS Form 8815 instructions 2025', 'NO (Form 8815 not auto-computed)', 'Tracked in outstanding.md:1253 for the deferred Form 8815 auto-compute enhancement.'],
  ['FORM_8815_MAGI_PHASEOUT_MFJ_2025', '$140,950–$170,950', 'IRS Form 8815 instructions 2025', 'NO', 'Same — deferred.'],
  [],
  ['Statutory references'],
  ['Taxable interest is gross income', 'IRC §61(a)(4)', 'Foundation for line 2b inclusion in line 9 / AGI / taxable income.'],
  ['Bond premium amortization reduces interest', 'IRC §171(a)(1); Pub. 550', 'Applies to bond premium paid on TAXABLE bonds. Reduces line 2b once.'],
  ['Tax-exempt bond market discount is TAXABLE', 'IRC §1276; Pub. 550', 'Common user error — easy to misclassify as tax-exempt. YAML help text updated 2026-05-11 (2a #10).'],
  ['Form 8815 (savings bond exclusion)', 'IRC §135', 'Permits exclusion of Series EE/I interest used for qualified higher-education expenses, subject to MAGI phaseout.'],
  ['Schedule B required even below $1,500 if ...', 'IRS Schedule B instructions', '9 triggers per spec §4: $1,500 threshold, seller-financed mortgage (deferred 2a #9), accrued interest, OID adjustment, bond premium reduction, savings bond exclusion, nominee interest, foreign account, foreign trust.'],
  ['Rounding', 'IRS Form 1040 instructions — Rounding off dollars', 'Whole dollars; HALF_UP at 50¢. Applied at multiple stages in computeInterestForPerson and at line 2b storage.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 30 }, { wch: 55 }, { wch: 35 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 2b Feeds Multiple Forms'],
  ['Line 2b is the primary taxable-interest cell on Form 1040 AND the line 4 cell on Schedule B Part I (when Schedule B is required). Also feeds line 9 / AGI / line 15 / EIC investment-income disqualification.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['Form 1040 line 2b (the cell itself)', 'TaxReturnComputeService.buildIncome() — income.setTaxableInterest(line2b)', 'Persisted on form1040.income only when non-null. Whole-dollar HALF_UP rounding. Frontend renders via PDF field f1_59[0] (line2b_taxable_interest). **EVERY non-empty interest return populates this cell.**'],
  ['Form 1040 line 9 (total income)', 'computeLine9TotalIncome (line 4130-4133)', '★ Line 2b is the 2nd operand of line 9. Cascades to AGI and taxable income.'],
  ['Schedule B Part I line 2 (total interest before exclusion)', 'buildScheduleB() — sums scheduleBInterestItems', 'Per-payer detail emitted when Schedule B is required.'],
  ['Schedule B Part I line 3 (savings bond exclusion)', 'buildScheduleB() — scheduleBLine3SavingsBondExclusion', 'User-entered Form 8815 result (manual today; auto-compute deferred).'],
  ['Schedule B Part I line 4 (net taxable interest)', 'buildScheduleB() — scheduleB.setLine4TaxableInterest(line2b)', '★ Must equal Form 1040 line 2b. Invariant verified by spec §9.'],
  ['Schedule B Part III line 7a/7a-2/8 (foreign-account questions)', 'buildScheduleB() — from interest-income-taxpayer personal form', 'NOT line-2b-value-driven. Attestation booleans independently force Schedule B.'],
  ['Form 6251 line 2g (AMT PAB interest)', 'computeInterestForPerson box 9 aggregation', 'Separately fed from box 9 + box 13 DIV — NOT from line 2b value.'],
  ['Form 1116 (foreign tax credit)', 'computeForm1116() reads 1099-INT box 6 directly at line ~19321', 'NOT line-2b-value-driven. Box 6 amounts pass through line 2b unchanged.'],
  ['EIC investment-income ceiling', 'computeEarnedIncomeCredit() — disqualification check', 'Line 2b counts toward the $11,950 (2025) investment-income ceiling. > $11,950 → no EIC. Line 2b is NOT additive to EIC earned income — it\'s only a disqualification trigger.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 2b Itself Emits ONE Blocking Flag'],
  ['Line 2b is a primary income line — it shares the broader interest-income gating flag with line 2a. No 2b-specific flags exist.'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['INTEREST_STATEMENT_UPLOAD_REQUIRED', 'BLOCKING', 'User signaled `hadInterestIncome=true` (taxpayer OR spouse) but uploaded no 1099-INT, 1099-DIV, or 1099-OID statements OR did not confirm "all received statements are uploaded".', 'validateInterestStatementGating at line 4569-4596 (shared with line 2a)'],
  [],
  ['Implicit gates (no flag emitted, silent normalization)'],
  ['Per-entry premium (box 11/12) exceeds box 1/3', 'Silent floor at zero via subtractNonNegative at line 4501.', 'IRS guidance: premium can\'t make interest negative.'],
  ['Person-level adjustments exceed taxableInterestBeforeExclusion', 'Silent floor at zero via subtractNonNegative at line 4579.', ''],
  ['Savings bond exclusion exceeds aggregated taxableBeforeExclusion', 'Silent floor at zero via subtractNonNegative at line 4402.', 'Form 8815 line 14 cannot exceed total taxable interest.'],
  ['Schedule B trigger fires from 9 different conditions', 'See lines 4424-4440 — taxable interest > $1,500, dividends > $1,500, accrued, nominee, OID, bond premium, savings bond, foreign account, foreign trust.', 'IRS Schedule B instructions. Seller-financed mortgage trigger deferred per 2a #9 / outstanding.md.'],
  [],
  ['Note: line 2b does NOT have a 2b-specific blocking flag — the interest-statement-upload flag at validateInterestStatementGating covers the entire interest workflow (2a + 2b + Schedule B + 3a/3b). A user with line 2b = 0 but `hadInterestIncome = true` and no statements would still get blocked.'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 55 }, { wch: 20 }, { wch: 90 }, { wch: 65 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 2b shares the `computeInterestForPerson` method with line 2a. Most audit findings from 2a.xlsx (closed 2026-05-11) cascade to 2b. The 2b walkthrough verifies the cascade AND identifies 2b-specific concerns. Verified 2026-05-11.'],
  ['LINE 2b AUDIT COMPLETE 2026-05-11 — All 10 issues closed. Outcomes: 5 cross-references to 2a closures via multi-audit-trail consolidation (#1 MFS guard cascade, #2 spec refresh, #3 knowledge file rename, #4 0-vs-null compliance, #5 line-9 inclusion — all extended with "2b.xlsx Code Validation #N" added to existing breadcrumbs); **1 NEW backend bug fix** (#6 premium double-count — backend now enforces the `payerAlreadyReportedNetInterestOrOid` UI gate; 4-field suppression covers both line 2a and 2b; Option A applied; +1 unit test); 2 verified-correct closures with breadcrumbs (#7 multi-stage zero-floor at the line-2b storage site, #8 Schedule B Part I per-payer attribution at the aggregation site); 2 deferred-already-tracked (#9 Form 8815, #10 seller-financed mortgage). Backend regression: 750/750 pass (was 749 — net +1 from #6). Notably the audit added ZERO new outstanding.md entries — all deferrals were already tracked from 2a #8 and 2a #9. Audit-trail-per-walkthrough row appended to lines/2ab.md §12. **Pattern: shared-orchestrator audits become cross-reference-heavy as the shared method has already been protected by an upstream line audit.** The 2b audit\'s ratio (5 cross-references + 2 verified-correct + 2 already-deferred + 1 new fix) reflects that most of the work was done during 2a #1 (which protected 5 outputs in one shot).'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'CROSS-REFERENCE — MFS GUARD ALREADY APPLIED VIA 2a #1 — VERIFIED 2026-05-11', 'Pre-fix concern (verified): computeInterestIncome would have leaked spouse-side interest into the MFS taxpayer\'s line 2b. Post-fix (already applied 2026-05-11 during 2a #1 closure): `boolean isMfsReturn` parameter on the orchestrator method (signature line 4291); on MFS, `interestIncomeSpouse`, `dividendIncomeSpouse`, and `spouseSsn` are all nulled at the orchestrator. computeInterestForPerson("spouse", ...) then sees null spouseSsn → belongsToPerson at line 8210 rejects spouse-attributed entries (recipientTIN match path fails on `hasText(spouseSsn)`; no-TIN fallback also yields false when spouse forms are nulled) → spouse contribution null → addNonNull aggregate at line 4380-4383 stays taxpayer-only for BOTH line 2a (taxExemptInterest) AND line 2b (taxableInterestBeforeExclusion). Lock-in test `mfsExcludesSpouseInterestFromLine2a` (added 2026-05-11) exercises the cascade — single test covers BOTH lines because the shared `computeInterestForPerson` code path produces both aggregates from the same belongsToPerson filter. Closure: **multi-audit-trail consolidation** at the MFS-guard breadcrumb (line 4308-4316) — extended the audit-ID citation from "2a.xlsx Code Validation #1" to "2a.xlsx Code Validation #1 + 2b.xlsx Code Validation #1, both verified 2026-05-11". Also clarified in the breadcrumb that the lock-in test covers both lines via the shared code path. No code-behavior change.', 'TaxReturnComputeService.java:4308-4316 (extended multi-audit breadcrumb); test mfsExcludesSpouseInterestFromLine2a (added 2a closure 2026-05-11)', 'CLOSED via 2a #1 cascade — verified-correct cross-reference. The MFS guard is the only single-fix-multi-output protection in the audit corpus so far. The 5 protected outputs (lines 2a + 2b + 3a + 3b + Form 6251 line 2g + Schedule B Parts I/II) are protected by ONE orchestrator-level guard.'],
  [2, 'CROSS-REFERENCE — SPEC §7.1/§7.2/§12 REFRESH ALREADY DONE VIA 2a #2 — VERIFIED 2026-05-11', 'lines/2ab.md §7.1 was rewritten 2026-05-11 during 2a #2 closure from "Known code bugs" to "Historical bugs — all RESOLVED 2026-04-13". The spec rewrite covers BOTH line 2a and 2b bug history because the file is shared (`2ab.md`). §7.2 documents the MFS guard (cascading to 2b). §12 verification log spans the entire interest block. Closure for 2b: appended a 4th verification-log row to §12 capturing the 2b walkthrough as a separate event (per the audit-trail-per-walkthrough convention from line 1d/1e/1f/1g/1h). Row enumerates the 7 cross-reference closures + 3 new 2b-specific findings. No additional 2b-specific spec work needed — the shared-spec model means the §7.1 rewrite already serves both lines.', 'lines/2ax.md §7.1/§7.2/§12 (§12 now has 4 rows after this closure)', 'CLOSED via 2a #2 spec rewrite — verified-correct cross-reference. Audit-trail-per-walkthrough convention extends the §12 log with each new audit event.'],
  [3, 'CROSS-REFERENCE — KNOWLEDGE FILE RENAMED VIA 2a #4 — VERIFIED 2026-05-11', 'Cross-reference closure verified: `knowledge/line-2ab-interest-income.md` exists at the canonical name (renamed 2026-05-11 from `knowledge-line-2ab-interest-income.md` during 2a #4 closure). The file covers BOTH lines 2a and 2b in a shared document — no additional 2b-specific knowledge work needed. Filesystem sweep 2026-05-11 confirms: no live code references to the old name; only intentional historical-narrative references remain in `history.md` and the xlsx closure rows (2a #4 + this 2b #3). Pure xlsx-flip closure — no file changes needed.', 'knowledge/line-2ab-interest-income.md (canonical name); 2a.xlsx Code Validation #4 (origin closure)', 'CLOSED via 2a #4 — verified-correct cross-reference. Shared-knowledge-file model: one document serves both lines.'],
  [4, 'CROSS-REFERENCE — 0-VS-NULL COMPLIANCE VERIFIED VIA 2a #5 — VERIFIED 2026-05-11', 'Per the canonical rule, computeInterestForPerson initializes `BigDecimal taxableInterestBeforeExclusion = null;` at line 4483 (paired with `taxExemptInterest = null;` at line 4484 verified in 2a #5, and `form6251Line2g = null;` at line 4485). Accumulates via addNonNull. Returns `roundMoney(taxableInterestBeforeExclusion)` in InterestPersonTotals at line 4596. The downstream subtractNonNegative for savings bond exclusion at line 4402 preserves null→null. Same compliance shape as line 2a. Closure: extended the 2a #5 breadcrumb at line ~4588 to (a) explicitly name all 3 BigDecimal fields in the record (taxableInterestBeforeExclusion / taxExemptInterest / form6251Line2g) rather than only naming taxExemptInterest, and (b) cite both 2a #5 + 2b #4 audit IDs via the **multi-audit-trail consolidation pattern**. **First non-wage-block 0-vs-null check** was completed during 2a #5; 2b #4 inherits and explicitly extends the verification.', 'TaxReturnComputeService.computeInterestForPerson lines 4483-4485 (init), 4588-4598 (extended breadcrumb), 4596 (return)', 'CLOSED via 2a #5 cross-reference. Verified-correct, breadcrumb extended for field-level coverage and multi-audit consolidation.'],
  [5, 'CROSS-REFERENCE — LINE 2b IS IN LINE 9 / AGI / TAXABLE INCOME — VERIFIED 2026-05-11', 'Inverse of 2a #7 (which confirmed line 2a is EXCLUDED). Line 9 formula at TaxReturnComputeService.java:4133-4135 reads `addNonNull(addNonNull(line1z, line2b), line3b)...` — line 2b is the 2nd operand, intentionally INCLUDED. Cascade: line 9 → line 11b (AGI = line 9 - line 10) → line 15 (taxable income = max(0, AGI - deductions)). Lock-in: existing test `line9EqualsLine1zPlusOtherIncomeLines` (added 1z #2 closure) covers the line-9 = line 1z + 2b + 3b + 4b + 5b + 6b + 7a + 8 invariant. Closure: extended the line-9 breadcrumb at line 4128 to cite THREE audit IDs (1z #7 + 2a #7 + 2b #5) via the **multi-audit-trail consolidation pattern**. Strengthened the narrative to explicitly note that line 2b INCLUSION (this 2b #5 verification) is the INVERSE confirmation of line 2a EXCLUSION (2a #7). Single test covers the invariant for both cases.', 'TaxReturnComputeService.java:4128-4135 (extended 3-audit breadcrumb); test line9EqualsLine1zPlusOtherIncomeLines', 'CLOSED — verified-correct cross-reference. Line 2b\'s inclusion in line 9 is now explicitly cited at the line-9 formula site by the 3-audit consolidated breadcrumb.'],
  [6, 'POTENTIAL PREMIUM DOUBLE-COUNT — UI GATE NOT ENFORCED BY BACKEND — RESOLVED 2026-05-11 (Option A applied)', 'Pre-fix: per IRS Pub. 550 / lines/2ab.md §3.2, bond premium reduces interest ONCE per source. The personal form had a `payerAlreadyReportedNetInterestOrOid` boolean (YAML row 15) to gate four manual premium-adjustment fields (`taxableBondPremiumAdjustmentNotInStatements`, `treasuryBondPremiumAdjustmentNotInStatements`, `oidAcquisitionPremiumAdjustmentNotInStatements`, `taxExemptBondPremiumAdjustmentNotInStatements`). The UI intent was: when the broker pre-netted (boolean=true), don\'t enter manual adjustments. But the BACKEND DID NOT ENFORCE this — it unconditionally subtracted manual adjustments at the person-level after already subtracting 1099-INT box 11/12/13 and 1099-OID box 6 at the per-entry level. If a user entered BOTH 1099-INT box 11 = $100 AND the manual taxableBondPremiumAdjustmentNotInStatements = $100, the same $100 premium was subtracted TWICE → line 2b $100 too low. Direct-API submissions also bypassed the UI gate.\n\nPost-fix (Option A — backend enforces the gate): (1) added `boolean payerAlreadyNetted` parameter to computeInterestForPerson; (2) read the boolean at the orchestrator from `interest-income-taxpayer.payerAlreadyReportedNetInterestOrOid` (TAXPAYER form only — return-level question per dependencies/2ab.md); (3) both call sites pass the boolean (single switch covers both taxpayer + spouse); (4) inside the method, the 4 manual premium-adjustment reads (3 taxable + 1 tax-exempt — covering BOTH line 2a and 2b downstream) use `payerAlreadyNetted ? null : getAmount(...)`. Accrued/nominee adjustments are NOT premium-related — they remain unconditional. Lock-in test `interestPremiumAdjustmentsSuppressedWhenBrokerPreNetted`: 1099-INT $1,000 + box 11 = $100 + payerAlreadyReportedNetInterestOrOid=true + manual taxableBondPremium=$100 → asserts line 2b = $900 (pre-fix would have been $800 double-counted). Backend regression: 750/750 pass.\n\n**Also protects line 2a** — the taxExemptBondPremiumAdjustment field is gated by the same boolean. Single fix at the orchestrator level cascades to both interest lines. Affects 2a #5 0-vs-null compliance (still verified — null on suppressed path matches the rule for "concept doesn\'t apply" when broker already handled it).', 'TaxReturnComputeService.computeInterestIncome (orchestrator) and computeInterestForPerson (per-person aggregator); test interestPremiumAdjustmentsSuppressedWhenBrokerPreNetted', 'CLOSED via Option A. Backend now enforces the UI gate — manual premium adjustments are suppressed when broker pre-netted, matching the IRS letter-of-the-rule and the spec intent. Strongest possible fix; matches the 1z #5 / 2a #10 immediate-fix-when-verified-safe precedent.'],
  [7, 'VERIFIED CORRECT — MULTI-STAGE ZERO-FLOOR — VERIFIED 2026-05-11', 'Line 2b is floored at zero at THREE separate stages: (1) per-entry box 11/12 subtraction in computeInterestForPerson — premium can\'t make per-entry interest negative; (2) person-level adjustments — accrued/nominee/premium can\'t push the running total below zero; (3) return-level savings bond exclusion (Form 8815) — exclusion can\'t make line 2b negative. Per spec §9 invariant. Contrast with line 1f / line 1z which CAN be negative (IRC §137(a)(3) special-needs adoption — already breadcrumbed during 1z #8 closure with the "negative pass-through" comment). Closure: 6-line breadcrumb added at the line-2b storage site (TaxReturnComputeService.java:4101) documenting the 3-stage floor + spec §9 reference + contrast with line 1f/1z negative-pass-through.', 'TaxReturnComputeService.java:4101 (new breadcrumb at storage site); 3 subtractNonNegative gates in computeInterestForPerson + computeInterestIncome', 'CLOSED — verified correct. Breadcrumb at the line-2b storage site complements the 1z #8 negative-pass-through breadcrumb — future readers see both invariants (line 1f/1z negative-allowed, line 2a/2b floored-at-zero) explained.'],
  [8, 'VERIFIED CORRECT — SCHEDULE B PART I PER-PAYER ATTRIBUTION — VERIFIED 2026-05-11', 'Schedule B Part I requires a per-payer detail row for each interest source. The current code emits 5 categories of items per person via addScheduleBItem: (a) per-1099-INT entry — uses payerNameAddress (line 4539); (b) per-1099-OID entry — uses payerNameAddress (line 4556); (c) 1099-OID box 2 taxable portion — generic personLabel + " 1099-OID Box 2 taxable portion" (line 4575); (d) manual taxable interest — generic personLabel + " manual taxable interest" (line 4581); (e) 5 negated adjustments — accrued/nominee/3 premiums (lines 4617-4621), each with personLabel + adjustment-type and negateIfPresent on the amount. Items aggregated across taxpayer + spouse at line 4464-4465 (taxpayer-then-spouse ordering). Standard ordering is correct per IRS instructions when no seller-financed mortgage entries exist. Seller-financed-first ordering is a known deferred enhancement (2a #9 / outstanding.md). Closure: 11-line breadcrumb added at line 4464 (above the aggregation calls) documenting the 5 categories, the ordering contract, and the deferred seller-financed-first cross-reference.', 'TaxReturnComputeService.java: 5 addScheduleBItem call sites in computeInterestForPerson (lines 4539, 4556, 4575, 4581, 4617-4621); aggregation at lines 4464-4465 (new breadcrumb above)', 'CLOSED — verified correct. Breadcrumb provides future-reader clarity on the emission-and-ordering contract.'],
  [9, 'DEFERRED — Form 8815 SAVINGS BOND EXCLUSION NOT AUTO-COMPUTED — ALREADY TRACKED 2026-05-11', 'Cross-reference to 2a #8 — outstanding.md at line 1295 (was line 1253 before 2a #9 + 2b #6 entries shifted the position) has the canonical entry "Lines 2a/2b: Form 8815 Savings Bond Exclusion Is Manual Entry Only (Deferred)" with full implementation sketch: compute Form 8815 reading qualified education expenses + bond interest from statements; MAGI-based phaseout against 2025 thresholds ($94,100–$124,100 single / $140,950–$170,950 MFJ); populate savingsBondExclusionAmount automatically. The user-entered value is currently the Schedule B line 3 reduction — line 2b accuracy depends on the user computing Form 8815 correctly off-system. Investigation 2026-05-11: outstanding.md entry verified still in place; the same canonical entry covers BOTH line 2a and line 2b (the savings bond exclusion only reduces line 2b, but the deferred entry is filed under "Lines 2a/2b" because it lives within the shared interest-income block). Pure xlsx-flip closure — no new outstanding.md entry needed.', 'outstanding.md line ~1295; computeInterestIncome at line 4401 reads the user-entered amount; cross-reference 2a #8', 'CLOSED — already deferred and tracked. Same shape as 2a #8 pure xlsx-flip closure pattern.'],
  [10, 'DEFERRED — SELLER-FINANCED MORTGAGE SCHEDULE B TRIGGER MISSING — ALREADY TRACKED 2026-05-11', 'Cross-reference to 2a #9 — outstanding.md:9 (top-of-file, added 2026-05-11 during 2a #9 closure) has the canonical entry "Lines 2a/2b: Seller-Financed Mortgage Interest Schedule B Trigger Missing — Deferred 2026-05-11" with full 5-touchpoint implementation sketch (YAML field additions + Angular array UI + backend trigger + Schedule B priority-position rendering + tests; ~30-45 min scope). Affects Schedule B GATING (Part I line 1 priority position) only — does NOT affect line 2b VALUE (the interest amount flows correctly via manual paths). lines/2ab.md §4 line 123 lists this as a Schedule B trigger but the code does not implement it. Pure xlsx-flip closure — no new outstanding.md entry needed.', 'outstanding.md line 9 (top of file); computeInterestIncome scheduleBRequired chain at line ~4467; cross-reference 2a #9', 'CLOSED — already deferred and tracked. Same shape as 2b #9 pure xlsx-flip pattern.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 30 }, { wch: 95 }, { wch: 65 }, { wch: 95 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 2b Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.taxableInterest', 'topmostSubform[0].Page1[0].f1_59[0] (line2b_taxable_interest)', 'form-tax-return-1040.xlsx (line 2b cell)', '★ Primary output. Whole-dollar HALF_UP rounded. Stored only when non-null.'],
  ['scheduleB.line4TaxableInterest', '(Schedule B PDF line 4 cell)', 'form-tax-return-scheduleb.xlsx', 'Must equal Form 1040 line 2b when Schedule B is required. Invariant verified per spec §9.'],
  ['scheduleB.line2TotalInterest', '(Schedule B PDF line 2 cell)', 'form-tax-return-scheduleb.xlsx', 'Sum of scheduleBInterestItems BEFORE savings bond exclusion. line 2 - line 3 = line 4 = line 2b.'],
  ['scheduleB.line3ExcludableInterestSeriesEeI', '(Schedule B PDF line 3 cell)', 'form-tax-return-scheduleb.xlsx', 'User-entered Form 8815 result. Subtracted from line 2 to get line 4.'],
  ['scheduleB.interestItems[]', '(Schedule B PDF Part I line 1 per-payer rows)', 'form-tax-return-scheduleb.xlsx', 'Per-payer detail emitted only when Schedule B is required. Up to 14 payer rows on the IRS form; overflow handling deferred.'],
  [],
  ['DOWNSTREAM CONSUMERS'],
  ['Form 1040 line 9 (total income)', 'topmostSubform[0].Page1[0].(line 9 cell)', 'form-tax-return-1040.xlsx', 'Line 2b is the 2nd operand of the line 9 formula. Cascades to AGI, taxable income.'],
  ['Form 1040 line 11b (AGI)', 'topmostSubform[0].Page1[0].(line 11b cell)', 'form-tax-return-1040.xlsx', 'Indirect: AGI = line 9 - line 10.'],
  ['Form 1040 line 15 (taxable income)', 'topmostSubform[0].Page1[0].(line 15 cell)', 'form-tax-return-1040.xlsx', 'Indirect: line15 = max(0, AGI - deductions).'],
  ['EIC investment-income disqualification', '—', '—', 'Line 2b counts toward $11,950 (2025) ceiling. > $11,950 → no EIC. NOT additive to EIC earned income.'],
  [],
  ['NOT IN OUTPUT (line 2b independence)'],
  ['Form 6251 line 2g (AMT PAB)', '—', 'form-tax-return-6251.xlsx', 'INDEPENDENT — sourced from 1099-INT box 9 + 1099-DIV box 13, NOT from line 2b value.'],
  ['Form 1116 (foreign tax credit)', '—', 'form-tax-return-1116.xlsx', 'INDEPENDENT — sourced from 1099-INT box 6 at line ~19321, NOT from line 2b.'],
  ['IRMAA / Medicare premium MAGI', '—', '—', 'Out of scope.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 50 }, { wch: 65 }, { wch: 50 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
