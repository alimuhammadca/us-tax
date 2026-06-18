// ============================================================================
//  Generates: C:\us-tax\XLS\computations\2a.xlsx
//  Source-of-truth references:
//    - lines/2ab.md (covers BOTH 2a and 2b; spec is shared)
//    - dependencies/2ab.md
//    - knowledge/line-2ab-interest-income.md
//    - TaxReturnComputeService.computeInterestIncome() lines ~4291-4364
//    - TaxReturnComputeService.computeInterestForPerson() lines ~4456-4566 (the per-person aggregator)
//    - ReferenceData.java — no line-2a-specific constants
//    - IRS 2025 Form 1040 instructions (i1040gi_2025.pdf): line 2a "Tax-exempt interest"
//    - IRS 2025 Schedule B instructions (i1040sb)
//    - IRS 2025 Publication 550 (Investment Income and Expenses)
//    - IRS 2025 instructions for Forms 1099-INT and 1099-OID
//    - PDF field: topmostSubform[0].Page1[0].f1_58[0] (line2a_tax_exempt_interest)
//
//  Tax year: 2025
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '2a.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 2a — TAX-EXEMPT INTEREST'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 2a'],
  ['Concept', 'Total tax-exempt interest from municipal bonds, certain U.S. obligations, exempt-interest dividends, and tax-exempt OID. INFORMATIONAL ONLY — does NOT enter line 9 (total income) or AGI. Used by the IRS for AMT, IRMAA (Medicare premium), state-return cross-checks, and certain credit eligibility calculations.'],
  ['Per-Person Formula', 'Per-person line 2a contribution = Σ(1099-INT box 8 − 1099-INT box 13)\n  + Σ(1099-OID box 11)\n  + Σ(1099-DIV box 12)\n  + taxExemptStatedInterestFrom1099OidBox2 (personal form, classifies portion of 1099-OID box 2)\n  + manualTaxExemptInterestNotOnStatements (personal form)\n  − taxExemptBondPremiumAdjustmentNotInStatements (personal form, if not already netted by payer)'],
  ['Per-Return Formula', 'line2a = roundMoney( addNonNull(taxpayer.taxExemptInterest(), spouseResult.taxExemptInterest()) )'],
  ['Filed', 'Direct entry on Form 1040 line 2a. PDF field: topmostSubform[0].Page1[0].f1_58[0] (semantic name: line2a_tax_exempt_interest).'],
  ['Backend method', 'TaxReturnComputeService.computeInterestForPerson() — per-person aggregation at lines ~4456-4566.\nReturn-level aggregation in computeInterestIncome() lines ~4291-4364.'],
  ['Output', 'form1040.income.taxExemptInterest (BigDecimal; null when no contributions on either side)'],
  ['IRS source', 'IRS 2025 Form 1040 instructions for line 2a; Pub. 550 ("Tax-exempt interest"); 1099-INT instructions box 8/9/13; 1099-OID instructions box 11; 1099-DIV instructions box 12/13'],
  [],
  ['STEP-BY-STEP COMPUTATION (per person)'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Filter 1099-INT entries by recipient (per-person SSN matching)', 'belongsToPerson(entry, spousePerson, taxpayerSsn, spouseSsn, taxpayerHadInterest, spouseHadInterest) at line 8210. Uses recipientTIN if present; falls back to the "did you have interest" workflow flag for entries with missing TIN. NOTE: no isMfsReturn parameter — see Code Validation #1.'],
  [2, 'Per 1099-INT: compute entry tax-exempt amount', 'entryTaxExemptInterest = subtractNonNegative(box8, box13)\n\n• box8 = "Tax-exempt interest" (the canonical total)\n• box13 = "Bond premium on tax-exempt bond" (separately reported premium; reduces box 8 once)\n• box9 is INTENTIONALLY NOT ADDED (it is the AMT-PAB subset already INCLUDED in box 8). Bug 1 from lines/2ab.md was fixed 2026-04-13.\n• subtractNonNegative floors at zero (premium can\'t make tax-exempt interest negative)'],
  [3, 'Per 1099-INT: aggregate AMT preference item separately', 'form6251Line2g = addNonNull(form6251Line2g, box9)\n\nBox 9 ("specified private activity bond interest") feeds Form 6251 line 2g (AMT preference). NOT added to line 2a (it\'s already in box 8). Issue #2 from lines/2ab.md verified resolved 2026-04-13.'],
  [4, 'Per 1099-OID: aggregate tax-exempt OID', 'taxExemptInterest = addNonNull(taxExemptInterest, box11)\n\n• box11 = "Tax-exempt OID"\n• Other OID boxes (box 1 = taxable OID; box 6 = acquisition premium; box 8 = Treasury OID) feed line 2b, not 2a.'],
  [5, 'Per 1099-OID: accumulate box 2 total for classification step', 'oidBox2Total = addNonNull(oidBox2Total, box2)\n\nBox 2 ("Other periodic interest") may be taxable OR tax-exempt stated interest on a tax-exempt OID bond. The user must classify the tax-exempt portion via the personal form (Step 7).'],
  [6, 'Per 1099-DIV: aggregate exempt-interest dividends', 'taxExemptInterest = addNonNull(taxExemptInterest, box12)\n\n• box12 = "Exempt-interest dividends" (from a regulated investment company — typically a tax-exempt mutual fund)\n• box13 is the AMT-PAB subset already INCLUDED in box 12. Box 13 feeds Form 6251 line 2g separately (Gap 4 fix, 2026-04-13).'],
  [7, 'Apply 1099-OID box 2 classification override', 'taxableBox2 = override ?? subtractNonNegative(oidBox2Total, taxExemptStatedInterestFrom1099OidBox2)\ntaxExemptInterest = addNonNull(taxExemptInterest, taxExemptStatedInterestFrom1099OidBox2)\n\nUser enters `taxExemptStatedInterestFrom1099OidBox2` on the personal form to classify how much of the 1099-OID box 2 total is tax-exempt stated interest (for tax-exempt OID bonds). Override field `taxablePortionFrom1099OidBox2Override` short-circuits the computed split.'],
  [8, 'Apply manual tax-exempt interest (not on statements)', 'taxExemptInterest = addNonNull(taxExemptInterest, manualTaxExemptInterestNotOnStatements)\n\nCovers tax-exempt interest the taxpayer received but for which no 1099 was issued (e.g., direct holdings, certain municipal obligations). User-entered on the personal form.'],
  [9, 'Apply tax-exempt bond premium adjustment (not already netted)', 'taxExemptInterest = subtractNonNegative(taxExemptInterest, taxExemptBondPremiumAdjustmentNotInStatements)\n\nWhen the user paid acquisition premium for a tax-exempt bond AND the payer DID NOT already net it on the 1099-INT, the user enters the premium here to reduce line 2a ONCE. Floors at zero.'],
  [10, 'Aggregate to per-return amount', 'line2a = roundMoney( addNonNull(taxpayer.taxExemptInterest(), spouseResult.taxExemptInterest()) )\n\nTaxpayer + spouse per-person totals are added. Whole-dollar HALF_UP rounding at the return-level aggregator (per-person totals are ALSO rounded at line 4562 — dual rounding is benign because each operand is already integral).'],
  [11, 'Persist on form1040.income', 'income.setTaxExemptInterest(line2a)\n\nLine 2a is informational only. NOT added to income.totalIncome (line 9), NOT added to AGI (line 11b), NOT added to taxable income (line 15). The PDF cell renders the value but the line does not affect federal tax computation.'],
  [],
  ['MUTUAL EXCLUSION RULES (enforced by code or spec)'],
  ['Rule', 'Implementation', 'Why'],
  ['box 9 NOT added on top of box 8', 'Line 4485: `subtractNonNegative(box8, box13)` — box 9 is intentionally absent. Bug fix dated 2026-04-13 per knowledge file.', 'Per IRS 1099-INT instructions: box 9 ("specified private activity bond interest") is a SUBSET of box 8 ("tax-exempt interest"). Box 9 amounts are ALREADY included in box 8; adding them again would double-count. Box 9 is captured separately for Form 6251 line 2g (AMT).'],
  ['box 13 (DIV) NOT added on top of box 12', '1099-DIV iteration at line 4516 uses box 12 only. Box 13 feeds Form 6251 line 2g via DividendComputation.form6251Line2gDividends (Gap 4 fix 2026-04-13).', 'Per IRS 1099-DIV instructions: box 13 ("specified private activity bond dividends") is a SUBSET of box 12 ("exempt-interest dividends"). Same double-count pattern as INT box 8/9.'],
  ['Premium adjustments applied ONCE', 'Personal form has `payerAlreadyReportedNetInterestOrOid` boolean to indicate the user already received a net amount. The premium-adjustment fields (`taxExemptBondPremiumAdjustmentNotInStatements`, etc.) should be entered only when the payer DID NOT pre-net.', 'IRS Pub. 550 / 1099-INT instructions: premium reduces interest once. If the broker already reported net, user must not subtract again.'],
  ['Line 2a NOT in line 9 / AGI / taxable income', 'computeLine9TotalIncome aggregates line 1z + 2b + 3b + 4b + 5b + 6b + 7a + 8 — line 2a is intentionally absent.', 'Tax-exempt interest is excluded from gross income under IRC §103. It appears on Form 1040 line 2a for informational purposes only.'],
  ['Per-person SSN filter', 'belongsToPerson at line 8210: recipientTIN must match the person\'s SSN. Falls back to "had interest income" workflow flag when TIN is missing.', 'Multi-recipient households (joint accounts) require attribution. SSN match is the primary signal; the workflow flag is the no-TIN fallback.'],
  ['Tax-exempt OID box 2 boundary', 'User classifies tax-exempt portion via `taxExemptStatedInterestFrom1099OidBox2` (personal form). Default: 100% of box 2 is treated as taxable unless explicitly classified.', 'Per IRS 1099-OID instructions: box 2 represents "other periodic interest" which may be taxable interest OR tax-exempt stated interest on a tax-exempt OID bond. The 1099-OID does not distinguish; only the user knows the bond\'s tax status.'],
  ['Tax-exempt market discount is TAXABLE', 'NOT IMPLEMENTED — out of scope per lines/2ab.md §5.2.', 'Market discount on a tax-exempt bond is taxable interest (line 2b), NOT tax-exempt interest (line 2a). User must report manually under current implementation.'],
  ['Retirement account interest is NOT line 2a', 'No code path reads IRA/401(k)/etc. interest for line 2a.', 'Tax-deferred account interest accumulates inside the account without separate tax-exempt classification. Distributions are taxed under lines 4a/4b / 5a/5b separately.'],
  [],
  ['DECISION TREE — what enters line 2a?'],
  ['Source', '1099 box (or personal form)', 'Sign', 'Notes'],
  ['1099-INT', 'box 8 (tax-exempt interest)', '+', 'Per-entry, then aggregated.'],
  ['1099-INT', 'box 13 (tax-exempt bond premium)', '−', 'Per-entry reduction (subtractNonNegative floors at zero).'],
  ['1099-INT', 'box 9 (PAB interest)', '0 (NOT added)', 'AMT subset already in box 8 → feeds Form 6251 line 2g only.'],
  ['1099-OID', 'box 11 (tax-exempt OID)', '+', 'Per-entry.'],
  ['1099-OID', 'box 2 (other periodic interest)', '+ / 0 (depends on classification)', 'User classifies tax-exempt portion via `taxExemptStatedInterestFrom1099OidBox2`. Default treats box 2 as fully taxable.'],
  ['1099-DIV', 'box 12 (exempt-interest dividends)', '+', 'From regulated investment companies (typically tax-exempt mutual funds).'],
  ['1099-DIV', 'box 13 (PAB dividends)', '0 (NOT added)', 'AMT subset already in box 12 → feeds Form 6251 line 2g only.'],
  ['Personal form', 'manualTaxExemptInterestNotOnStatements', '+', 'Catch-all for tax-exempt interest with no 1099.'],
  ['Personal form', 'taxExemptBondPremiumAdjustmentNotInStatements', '−', 'Premium reduction when payer did not pre-net.'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 2a Flows'],
  ['Consumer', 'How', 'Notes'],
  ['(NOT line 9)', 'Line 2a is explicitly absent from `addNonNull(...(line1z, line2b), line3b)..., line8)` at line 4147.', '★ Most important: line 2a does NOT increase total income or AGI. Verified by Code Validation #5.'],
  ['(NOT AGI / line 11b)', 'Same exclusion path — AGI = line 9 − line 10, and line 9 excludes 2a.', 'Confirmed by spec §10.'],
  ['Form 6251 line 2g (AMT private activity bond interest)', 'AGGREGATED SEPARATELY via box9 (1099-INT) and box13 (1099-DIV) — NOT from line 2a value.', 'AMT path uses the AMT-subset BOX values, not the line 2a total. Line 2a is the broader tax-exempt total; Form 6251 line 2g is the narrower PAB-only subset.'],
  ['IRMAA / Medicare premium MAGI', 'Out of scope.', 'IRMAA MAGI = AGI + line 2a + certain other items. Not implemented in this system.'],
  ['State returns', 'Out of scope.', 'Many states tax line 2a (state-specific muni exemption only applies to in-state bonds). Manual state-return work; not handled here.'],
  ['Schedule B', 'Line 2a is NOT shown on Schedule B Part I. Schedule B Part I only covers taxable interest (line 2b).', 'Tax-exempt interest is reported only on Form 1040 line 2a; no separate breakout schedule is required.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 22 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 2a'],
  ['Sourced from C:\\us-tax\\XLS\\input_forms\\*.xlsx.'],
  [],
  ['#', 'Source xlsx', 'Field path / model key', 'Label / box', 'Required?', 'Role in line 2a compute', 'Cross-reference'],
  [],
  ['STATEMENT INPUTS — 1099-INT'],
  [1, 'form-1099-int.xlsx', 'taxExemptInterestAmount (box 8)', '1099-INT box 8 "Tax-exempt interest"', 'YES — primary line 2a feed', 'Step 2: entry-level. entryTaxExemptInterest = subtractNonNegative(box8, box13).', 'IRS 1099-INT instructions box 8 ("Enter interest paid to a recipient on bonds, debentures, notes, or similar instruments that is exempt from federal income tax")'],
  [2, 'form-1099-int.xlsx', 'specifiedPrivateActivityBondInterestAmount (box 9)', '1099-INT box 9 "Specified private activity bond interest"', 'YES for Form 6251 line 2g; NOT for line 2a', 'Step 3: per-entry summed into form6251Line2g (AMT). EXCLUDED from line 2a (it is already in box 8).', 'IRS 1099-INT instructions box 9 ("Enter interest of $10 or more from specified private activity bonds. This interest is also included in box 8."); 2026-04-13 bug-fix per knowledge file'],
  [3, 'form-1099-int.xlsx', 'bondPremiumTaxExemptAmount (box 13)', '1099-INT box 13 "Bond premium on tax-exempt bond"', 'CONDITIONAL — when premium was paid and not pre-netted', 'Step 2: subtracted from box 8 per entry via subtractNonNegative (floors at zero).', 'IRS 1099-INT instructions box 13'],
  [],
  ['STATEMENT INPUTS — 1099-OID'],
  [4, 'form-1099-oid.xlsx', 'taxExemptOidAmount (box 11)', '1099-OID box 11 "Tax-exempt OID"', 'YES — line 2a feed for tax-exempt OID bonds', 'Step 4: aggregated unmodified.', 'IRS 1099-OID instructions box 11'],
  [5, 'form-1099-oid.xlsx', 'otherPeriodicInterestAmount (box 2)', '1099-OID box 2 "Other periodic interest"', 'AMBIGUOUS — classified by personal form', 'Step 5/7: accumulated into oidBox2Total; user separately classifies the tax-exempt portion.', 'IRS 1099-OID instructions box 2'],
  [],
  ['STATEMENT INPUTS — 1099-DIV'],
  [6, 'form-1099-div.xlsx', 'exemptInterestDividendsAmount (box 12)', '1099-DIV box 12 "Exempt-interest dividends"', 'YES — line 2a feed for tax-exempt mutual funds', 'Step 6: per-entry aggregated unmodified.', 'IRS 1099-DIV instructions box 12 ("Enter exempt-interest dividends from a mutual fund or other RIC. See box 1a for ordinary taxable dividends.")'],
  [7, 'form-1099-div.xlsx', 'specifiedPrivateActivityBondDividendsAmount (box 13)', '1099-DIV box 13 "Specified private activity bond interest dividends"', 'YES for Form 6251 line 2g; NOT for line 2a', 'AMT only — aggregated via DividendComputation.form6251Line2gDividends. EXCLUDED from line 2a (it is already in box 12).', 'IRS 1099-DIV instructions box 13; 2026-04-13 fix (Gap 4)'],
  [],
  ['STATEMENT INPUTS — Common to All 1099s'],
  [8, '(all 1099 forms)', 'recipientTIN', 'Recipient TIN on the 1099', 'YES — for SSN attribution', 'Step 1: belongsToPerson uses recipientTIN to attribute to taxpayer vs spouse. Missing TIN falls back to the workflow flag.', 'TaxReturnComputeService.belongsToPerson at line 8210'],
  [],
  ['PERSONAL FORM INPUTS — interest-income-taxpayer / -spouse'],
  [9, 'form-interest-income-taxpayer.xlsx', 'screening.hadInterestIncome', 'Did you have any interest income?', 'YES (boolean gate)', 'Drives the statement-upload gate (validateInterestStatementGating) AND the belongsToPerson missing-TIN fallback.', 'YAML: 2ab-interest-income-taxpayer.yaml'],
  [10, 'form-interest-income-taxpayer.xlsx', 'supplementalInterestAmounts.manualTaxExemptInterestNotOnStatements', 'Tax-exempt interest not reported on statements', 'NO', 'Step 8: added to taxExemptInterest. Catch-all for tax-exempt interest without a 1099.', 'computeInterestForPerson line 4530'],
  [11, 'form-interest-income-taxpayer.xlsx', 'supplementalInterestAmounts.taxExemptStatedInterestFrom1099OidBox2', 'Portion of 1099-OID box 2 that is tax-exempt stated interest', 'NO (defaults to 0)', 'Step 7: classifies portion of oidBox2Total as tax-exempt. Adds that amount to taxExemptInterest.', 'computeInterestForPerson line 4519'],
  [12, 'form-interest-income-taxpayer.xlsx', 'supplementalInterestAmounts.taxablePortionFrom1099OidBox2Override', 'Taxable portion of 1099-OID box 2 (override)', 'NO', 'Step 7: when provided, OVERRIDES the computed taxable portion (subtractNonNegative(oidBox2Total, taxExemptStatedInterestFrom1099OidBox2)). Allows precise control when the user has more knowledge than the default split.', 'computeInterestForPerson line 4520-4523'],
  [13, 'form-interest-income-taxpayer.xlsx', 'interestAdjustments.taxExemptBondPremiumAdjustmentNotInStatements', 'Tax-exempt bond premium adjustment (not in statements)', 'CONDITIONAL — when premium not pre-netted by payer', 'Step 9: subtracted from taxExemptInterest (subtractNonNegative floors at zero). Mirror of box 13 from 1099-INT but for premium the user computed themselves.', 'computeInterestForPerson line 4540, 4550'],
  [14, 'form-interest-income-taxpayer.xlsx', 'interestAdjustments.payerAlreadyReportedNetInterestOrOid', 'Did the broker already reduce reported interest/OID for premium?', 'NO (boolean)', 'Informational UI gate — drives WHEN to show the manual premium-adjustment fields. Backend does not branch on it (relies on the adjustment fields being empty when pre-netted).', 'YAML row 15'],
  [],
  ['IDENTITY INPUTS — Per-Person SSN'],
  [15, 'form-identification-taxpayer.xlsx', 'taxpayerIdentity.ssn', 'Taxpayer SSN', 'YES — drives 1099-INT/OID/DIV attribution', 'Step 1: matched against recipientTIN for each 1099 entry.', 'computeInterestIncome line 4333; resolved via overlay (1i #3 pattern)'],
  [16, 'form-identification-spouse.xlsx', 'spouseIdentity.spouseSsn', 'Spouse SSN', 'YES on MFJ', 'Step 1: matched against recipientTIN for spouse-attributed entries. NOTE: line 2a has no MFS guard today — see Code Validation #1.', 'computeInterestIncome line 4334'],
  [],
  ['FILING STATUS (not currently used by line 2a, but should be — Code Validation #1)'],
  [17, 'form-filing-status.xlsx', 'filingStatus', 'Filing status', 'YES (currently UNUSED by computeInterestIncome)', 'Should drive an isMfsReturn guard mirroring the line 1c/1d/1e/1f/1g/1h/1i pattern. On MFS, spouse-side interest must be excluded.', 'Code Validation #1'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 45 }, { wch: 55 }, { wch: 60 }, { wch: 30 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data / Constants ──────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 2a (None Direct)'],
  ['Line 2a has ZERO ReferenceData.java entries. It is a pure passthrough aggregation of 1099-INT box 8, 1099-OID box 11, and 1099-DIV box 12 with per-entry adjustments. No caps, rates, or COLA-indexed thresholds apply at the line-2a level. The Schedule B $1,500 threshold and other downstream thresholds are NOT line-2a constants.'],
  [],
  ['Constant', 'Value', 'Source', 'Used by line 2a?', 'Notes'],
  [],
  ['Indirect — referenced only by downstream consumers (Schedule B, Form 6251)'],
  ['SCHEDULE_B_INTEREST_THRESHOLD', '$1,500', 'Hard-coded inline in buildScheduleB (per knowledge file)', 'NO (Schedule B trigger only; does not affect line 2a value)', 'Schedule B Part I required when line 2b > $1,500. Tax-exempt interest (line 2a) is NOT shown on Schedule B at all. (Schedule B Part III has foreign-account questions related to interest activity but not line 2a value.)'],
  ['FBAR_AGGREGATE_THRESHOLD', '$10,000', 'IRS BSA E-Filing requirement', 'NO (user-attestation only)', '2025 FBAR threshold is aggregate-account-value > $10,000 at any point in the year. Captured via `hasFbarRequirement` boolean on the personal form (Gap 2 fix 2026-04-13). Triggers Schedule B Part III line 7a-2 (FBAR required flag).'],
  [],
  ['Statutory references (IRS rules, not configurable constants)'],
  ['IRS rule', 'Citation', 'Notes'],
  ['Tax-exempt interest excluded from gross income', 'IRC §103 (Interest on State and Local Bonds)', 'State and local government obligation interest is excluded from gross income at the federal level. Foundation for line 2a / line 9 split.'],
  ['Tax-exempt OID', 'IRC §1272(a)(2)(B); Treas. Reg. §1.1275-1', 'Original issue discount on a tax-exempt bond is generally tax-exempt over the life of the obligation. Reported on 1099-OID box 11.'],
  ['Exempt-interest dividends from RICs', 'IRC §852(b)(5)', 'Regulated investment companies (RICs) may designate exempt-interest dividends paid from their tax-exempt bond portfolios. Recipient treats these as tax-exempt interest at the federal level. Reported on 1099-DIV box 12.'],
  ['Specified private activity bond interest as AMT preference', 'IRC §57(a)(5); Form 6251 line 2g', 'PAB interest is tax-exempt for regular tax (still on line 2a) but is an AMT preference item subject to alternative minimum tax. Reported on 1099-INT box 9 (subset of box 8) and 1099-DIV box 13 (subset of box 12).'],
  ['Bond premium reduces tax-exempt interest', 'IRC §171(a)(2); Rev. Rul. 87-103', 'Amortizable premium on a tax-exempt bond reduces the tax-exempt interest on a yearly basis. The 1099-INT box 13 carries the broker-amortized amount; user-managed premium goes on the personal form\'s taxExemptBondPremiumAdjustment field.'],
  ['Market discount on tax-exempt bond is TAXABLE', 'IRC §1276; Pub. 550', 'When a taxpayer acquires a tax-exempt bond at a discount, the accrued market discount is taxable interest (line 2b), NOT tax-exempt interest. Spec §5.2 notes this; current implementation requires manual handling.'],
  ['Schedule B requirement', 'IRS 2025 Form 1040 instructions for Schedule B', 'Schedule B is required when line 2b > $1,500 OR ordinary dividends > $1,500 OR any of 7 other triggers (accrued interest, OID adjustment, bond premium, savings bond exclusion, foreign account, foreign trust, nominee). Line 2a value alone does NOT trigger Schedule B — but the foreign-account question on the personal form does.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 55 }, { wch: 30 }, { wch: 55 }, { wch: 38 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 2a Has NO Directly-Attached Form/Schedule'],
  ['Line 2a is a single information-only Form 1040 cell. No separate IRS form is filed solely for line 2a, and no Schedule B Part I rows are generated for tax-exempt interest. The SAME 1099-INT and 1099-DIV entries that feed line 2a ALSO feed Form 6251 line 2g (AMT preference) and Schedule B Part III (foreign-account/trust questions); those consumers are listed below.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['Form 1040 line 2a (the cell itself)', 'TaxReturnComputeService.buildIncome() at line 4188-4193: `if (line2a != null) { income.setTaxExemptInterest(line2a); }`', 'Persisted on form1040.income only when non-null. Whole-dollar HALF_UP rounding. Frontend renders via PDF field f1_58[0] (line2a_tax_exempt_interest). NOT added to line 9 / AGI.'],
  ['Form 6251 line 2g (AMT private activity bond interest)', 'computeInterestForPerson line 4489: `form6251Line2g = addNonNull(form6251Line2g, box9);` + Gap 4 fix 2026-04-13 adds box 13 DIV: `form6251Line2g = addNonNull(form6251Line2g, dividends.form6251Line2gDividends());` at computeInterestIncome.', 'Box 9 (1099-INT) and box 13 (1099-DIV) — the AMT-PAB subsets of boxes 8 and 12 respectively — are aggregated separately and fed into computeLine17 (AMT). The amounts are ALREADY included in line 2a but are tracked separately for the Form 6251 line 2g cell.'],
  ['Schedule B Part III questions (foreign-account / foreign-trust)', 'Driven by personal form fields `hasForeignAccountForScheduleBPartIII`, `hasFbarRequirement`, `hasForeignTrustDistributionOrTransfer` from interest-income-taxpayer. NOT a line-2a value flow.', 'Schedule B Part III lines 7a/7a-2/8 are attestation questions independent of the line 2a amount. They may force Schedule B generation even when interest/dividend totals are below $1,500.'],
  [],
  ['NO PDF write-in for line 2a'],
  ['Unlike line 1h (which has the optional write-in for the income type), line 2a is a single dollar amount with no statement text. The IRS form has no write-in area for line 2a.'],
  [],
  ['NO blocking flag emitted directly by line 2a'],
  ['validateInterestStatementGating at line 4569 can emit `INTEREST_STATEMENT_UPLOAD_REQUIRED` blocking flag, but that gates the BROADER interest workflow (lines 2a, 2b, 3a, 3b, AMT), not line 2a specifically. Line 2a itself contributes nothing to flag emission.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 55 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 2a Itself Emits NONE'],
  ['Line 2a is a pure aggregation. Any blocking-state behavior comes from the broader interest-income gating logic.'],
  [],
  ['Flag scenario', 'Backend behavior', 'Code reference'],
  ['User says "had interest income" but uploaded no 1099 statements', 'Emits blocking flag INTEREST_STATEMENT_UPLOAD_REQUIRED. Affects ALL of lines 2a, 2b, 3a, 3b — not line 2a specifically.', 'validateInterestStatementGating at line 4569-4596'],
  ['1099-INT box 13 (premium) exceeds box 8 (interest)', 'subtractNonNegative floors at zero. No flag — silent normalization.', 'Line 4485'],
  ['1099-DIV box 13 (PAB dividends) without box 12 (exempt-interest dividends)', 'Box 13 adds to Form 6251 line 2g; line 2a gets nothing from this entry. No flag.', 'Line 4516 (only reads box 12)'],
  ['User checks "had interest income" but actual line 2a / 2b totals are zero', 'No flag. The user may have signaled engagement but had only zero amounts.', '—'],
  ['Negative manual tax-exempt entry', 'parseAmount typically rejects negative inputs at the UI layer. If a negative slips through, it would reduce line 2a. No back-end floor on the aggregator.', '—'],
  [],
  ['Note: line 2a EMITS NO FLAGS. The broader interest-income workflow does, but those affect the entire interest path, not line 2a specifically.'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 60 }, { wch: 90 }, { wch: 70 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Reviewed against: TaxReturnComputeService.computeInterestIncome() lines 4291-4364, computeInterestForPerson() lines 4456-4566 (per-person aggregator), belongsToPerson() at line 8210, validateInterestStatementGating at line 4569, line 4188-4193 (income.setTaxExemptInterest), line 4147 (line 9 formula explicitly excludes 2a), Schedule B builder at ~line 7265, Form 6251 wire at ~line 7282. lines/2ab.md spec rewritten 2026-05-11 (Issue #2); knowledge/line-2ab-interest-income.md (post-rename 2026-05-11, Issue #4). Verified 2026-05-11.'],
  ['LINE 2a AUDIT COMPLETE 2026-05-11 — All 10 issues closed. Outcomes: 1 defensive bug fix with HIGH-LEVERAGE 5-output cascade (#1 — MFS guard at computeInterestIncome protects lines 2a + 2b + 3a + 3b + Form 6251 line 2g + Schedule B Parts I/II via one orchestrator-level guard; **single-guard MFS cascade now applied to 8 orchestrators**); 1 spec refresh closing 3 stale-spec issues (#2 + #3 — lines/2ab.md §7.1 rewritten from "Known code bugs" to "Historical bugs — all RESOLVED 2026-04-13" with §7.2 MFS-guard narrative + §12 verification log); 1 knowledge file rename extending line 1c–2ab naming convergence (#4); 3 verified-correct closures with breadcrumbs (#5 canonical-null-zero compliance verified; #6 box-9 double-count fix verified at code site; #7 line-9 exclusion verified with multi-audit-trail consolidation); 2 deferred closures (#8 Form 8815 already-tracked at outstanding.md:1253; #9 NEW outstanding.md entry for seller-financed mortgage Schedule B trigger); 1 immediate-fix Option-A closure (#10 — YAML help text updated in both taxpayer + spouse forms with market-discount caveat). Backend regression: 749/749 pass (was 748 — net +1 unit test for #1). One new deferred-enhancement entry added to outstanding.md (seller-financed mortgage). Lines/2ab.md spec refreshed including new §7.1, §7.2, §12 verification log.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'DEFENSIVE GAP — MFS GUARD NOT IN ORCHESTRATOR — RESOLVED 2026-05-11', 'Pre-fix: computeInterestIncome read `interestIncomeSpouse` and `dividendIncomeSpouse` unconditionally and processed spouse-side entries via computeInterestForPerson(spouse, ...) and computeDividendIncome — aggregating spouse-attributed tax-exempt interest, taxable interest, qualified/ordinary dividends, AND AMT PAB amounts into the return-level totals regardless of filing status. On MFS with stale `interest-income-spouse` / `dividend-income-spouse` data (e.g., from a prior MFJ year), spouse-attributed 1099-INT/OID/DIV entries leaked into the MFS taxpayer\'s line 2a (and 2b, 3a, 3b, Form 6251 line 2g, Schedule B Parts I/II). Post-fix: (1) added `boolean isMfsReturn` parameter to computeInterestIncome (line 4291 signature); (2) call site at line 389 updated to pass isMfsReturn (cluster with other compute orchestrators that already accept it); (3) inside the method, THREE spouse-side reads gated explicitly on isMfsReturn — `interestIncomeSpouse = isMfsReturn ? null : interestIncomeSpouseRaw`, `dividendIncomeSpouse = isMfsReturn ? null : dividendIncomeSpouseRaw`, `spouseSsn = isMfsReturn ? null : normalizeSsn(...)`. With spouseSsn null, belongsToPerson rejects spouse-attributed recipientTIN entries. With the spouse forms nulled, the workflow-flag fallback path also yields false. Combined effect: spouse contributions cascade to null through addNonNull aggregators at line 4359 and onward. **Schedule B Part III foreign-account / FBAR / foreign-trust questions** are sourced exclusively from `interest-income-taxpayer` (return-level) and are UNAFFECTED — the MFS guard only suppresses spouse-side value flows. Lock-in test `mfsExcludesSpouseInterestFromLine2a` — MFS return + taxpayer 1099-INT box 8 = $300 + STALE spouse 1099-INT box 8 = $500 + STALE `interest-income-spouse.hadInterestIncome=true` → asserts line 2a = $300 (NOT $800 aggregated). **High-leverage fix: one MFS guard cascades to 5 outputs (lines 2a, 2b, 3a, 3b, Form 6251 line 2g, Schedule B Parts I & II).** Single-guard MFS cascade now applied to 8 line orchestrators (1c, 1d, 1e, 1f, 1g, 1h, 1i, and computeInterestIncome which serves 2a+2b+3a+3b). Backend regression: 749/749 pass.', 'TaxReturnComputeService.computeInterestIncome lines 4291-4364 (signature + body); call site in prepare() at line 389; belongsToPerson at line 8210 unchanged (works correctly with null spouseSsn); test mfsExcludesSpouseInterestFromLine2a', 'CLOSED. Three-point spouse-form-null + spouseSsn-null gate pattern (mirrors line 1i Issue #1 three-point gate). The high-leverage cascade — one guard at the orchestrator, five outputs protected — makes this fix particularly valuable.'],
  [2, 'STALE SPEC — lines/2ab.md LISTS RESOLVED BUGS AS "KNOWN CODE BUGS" — RESOLVED 2026-05-11', 'Pre-fix: lines/2ab.md §7.1 listed THREE bugs as "Known code bugs" that the knowledge file (`knowledge-line-2ab-interest-income.md`) confirmed were ALL fixed on 2026-04-13: Bug 1 (box 9 double-count at line 4485), Bug 2 (scheduleBFbarRequired distinct from scheduleBForeignAccount, fixed via hasFbarRequirement field), Bug 3 (nominee interest Schedule B trigger). I verified Bug 1 directly during the 2a walkthrough: line 4485 reads `subtractNonNegative(box8, box13)` (box 9 absent — correct). Post-fix: rewrote §7.1 from "Known code bugs" to "Historical bugs — all RESOLVED 2026-04-13" with per-bug fix narrative (pre-fix code, issue, post-fix code with line numbers). Added §7.2 "MFS guard added 2026-05-11" documenting the Issue #1 closure. Added §12 "Verification log" footer with three entries (2026-04-13 knowledge-file audit, 2026-05-11 bug-fix re-verification, 2026-05-11 MFS guard) — matches the line 1d/1e/1f/1g/1h verification-log convention.', 'lines/2ab.md §7.1 (rewritten), §7.2 (new), §12 (new verification log)', 'CLOSED. Spec now aligned with current code state. Future readers see the historical bugs as historical with fix dates + current correct line numbers — preventing reproduction attempts of resolved bugs.'],
  [3, 'STALE SPEC — lines/2ab.md §4 vs §7.1 CROSS-REFERENCE CONTRADICTION — RESOLVED 2026-05-11 (byproduct of Issue #2)', 'Pre-fix: §4 listed 9 Schedule B triggers including nominee interest, while §7.1 Bug 3 stated "nominee interest does not independently trigger Schedule B" — internal contradiction. Post-fix: §7.1 rewrite (Issue #2 closure) marked Bug 3 as RESOLVED 2026-04-13 with the actual fix code (`|| hasNomineeInterest` added to the scheduleBRequired chain). The contradiction disappeared automatically — §4 and §7.1 now both reflect the post-fix state where nominee interest IS a Schedule B trigger.', 'lines/2ab.md §4 (unchanged) + §7.1 (rewritten as part of Issue #2)', 'CLOSED. No standalone work — resolved as a byproduct of Issue #2\'s spec rewrite.'],
  [4, 'KNOWLEDGE FILE NAMING DEVIATION — RESOLVED 2026-05-11', 'Pre-fix: `knowledge/knowledge-line-2ab-interest-income.md` used the legacy `knowledge-line-2ab-` prefix while line 1c-1z had converged on `line-{N}-{topic}.md` (hyphen form, no `knowledge-` prefix). Post-fix: file renamed to `knowledge/line-2ab-interest-income.md` via plain `mv` (`knowledge/` lives outside the `us-tax-be/` git repo). Five references updated: (1) generator header comment (line 6); (2) YAML frontmatter `name:` field inside the file itself (line 2, from `knowledge-line-2ab-interest-income` → `line-2ab-interest-income`); (3+4) two references in `lines/2ab.md` §7.1 (added during Issue #2 closure earlier today using the OLD filename — now updated). **Line 1c-2ab naming convergence is now CONSISTENT** across all interest/wage-block knowledge files. Older legacy `knowledge_line<n>.md` files (lines 8, 9, 10–33, 3ab, 4abc, plus 12abcde at the same level) remain for a future cross-line sweep. Same shape as line 1g #5, 1h #5, 1i #6, 1z #3.', 'knowledge/ folder; XLS/_tools/generate-2a.js (header comment); knowledge/line-2ab-interest-income.md (YAML frontmatter); lines/2ab.md §7.1 (two references)', 'CLOSED. Naming consistency extended from line 1c-1z to line 1c-2ab.'],
  [5, 'CANONICAL 0-VS-NULL COMPLIANCE — VERIFIED CORRECT 2026-05-11', 'Audit observation re-verified post Issue #1 closure (line numbers shifted slightly after the MFS-guard insertion). Current state: `computeInterestForPerson` at line 4484 initializes `BigDecimal taxExemptInterest = null;`, accumulates via addNonNull (null+null = null), and returns `roundMoney(taxExemptInterest)` at line 4579. Same null-propagation shape for `taxableInterestBeforeExclusion`, `form6251Line2g`, and `oidBox2Total`. When no 1099 entries match the person AND no manual inputs exist: each field stays null → returned null → addNonNull aggregate at the orchestrator stays null → `income.taxExemptInterest` unset → PDF cell renders blank. When entries match but sum to zero: addNonNull(null, 0) = 0 → returned BigDecimal.ZERO (concept applies, value is 0). **COMPLIANT** with the canonical rule (knowledge/canonical-null-zero-semantic.md). Audit-revisited-as-verified-and-documented closure: 7-line breadcrumb comment added above the `return new InterestPersonTotals(...)` site (line 4577) citing the canonical rule + audit ID + null-vs-ZERO behavior. No code-behavior change.', 'TaxReturnComputeService.computeInterestForPerson lines 4484-4583 (initialization at 4484; return at 4577)', 'CLOSED — verified correct, no fix needed. Breadcrumb at line ~4577 locks in the canonical-rule compliance.'],
  [6, 'VERIFIED CORRECT — BUG 1 (1099-INT BOX 9 DOUBLE-COUNT) — VERIFIED CORRECT 2026-05-11', 'Historical Bug 1 from lines/2ab.md §7.1 documented pre-fix code: `subtractNonNegative(addNonNull(box8, box9), box13)`. Knowledge file confirmed RESOLVED 2026-04-13. Re-verified directly during the 2a walkthrough: line 4502 reads `subtractNonNegative(box8, box13)` (box 9 intentionally absent from line 2a — IRS-correct, since box 9 is the AMT-PAB subset already included in box 8). Box 9 IS correctly captured at line 4506 for Form 6251 line 2g (AMT preference) via `form6251Line2g = addNonNull(form6251Line2g, box9)`. Lock-in coverage: existing E2E `line2ab-interest-income.spec.ts` (general PAB scenario) and `line17-amt.spec.ts` (high-PAB → Form 6251 generated even when AMT = 0). Audit-revisited-as-verified-and-documented closure: 6-line breadcrumb comment added at line 4501 (above the `entryTaxExemptInterest` assignment) documenting the historical bug + 2026-04-13 fix date + IRS rationale (box 9 ⊂ box 8) + cross-reference to line 4506 (Form 6251 line 2g) and lines/2ab.md §7.1 (Issue #2 spec rewrite). No code-behavior change.', 'TaxReturnComputeService.java:4501-4506 (breadcrumb + verified-correct code); lines/2ab.md §7.1 Historical Bug 1; E2E tests', 'CLOSED — verified correct, no fix needed. Breadcrumb at the code site complements the spec narrative (Issue #2 closure) — future readers see both the code intent AND the historical context.'],
  [7, 'VERIFIED CORRECT — LINE 2a EXCLUDED FROM LINE 9 / AGI — VERIFIED CORRECT 2026-05-11', 'Audit observation re-verified. Line 9 formula at TaxReturnComputeService.java:4130-4133 reads `line9 = roundMoney(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(line1z, line2b), line3b), line4b), line5b), line6b), line7a), line8))` — line 2a is intentionally absent (and line 1i likewise). Matches IRC §103 (tax-exempt interest excluded from gross income) and the IRS 2025 Form 1040 line 9 label "Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8". AGI (line 11b) = line 9 − line 10, so AGI is also free of line 2a. Same exclusion holds for line 15 (taxable income). Schedule 8812 line 18a (ACTC earned-income base) also excludes line 2a — uses totalWages + nontaxableCombatPayElection only. Audit-revisited-as-verified-and-documented closure: EXTENDED the existing line-9 breadcrumb at line 4128-4129 (added during 1z #7 closure) to cite both 1z #7 AND 2a #7 verification dates. Added a clarifying sentence enumerating the TWO notable absences (lines 2a + 1i) and citing their statutory bases. Multi-audit-trail consolidation — same code site verified by multiple audits, breadcrumb merges them. Lock-in test `line9EqualsLine1zPlusOtherIncomeLines` (added during 1z #2 closure) protects the invariant.', 'TaxReturnComputeService.java:4128-4133 (extended breadcrumb + line 9 formula); test line9EqualsLine1zPlusOtherIncomeLines (added during 1z #2 closure)', 'CLOSED — verified correct, no fix needed. Multi-audit breadcrumb extends the 1z #7 verification with the 2a #7 confirmation.'],
  [8, 'OBSERVATION — FORM 8815 SAVINGS BOND EXCLUSION NOT AUTO-COMPUTED — DEFERRED — ALREADY TRACKED 2026-05-11', 'Pre-fix observation: the system accepts `savingsBondExclusionAmount` from the taxpayer personal form as a user-entered value used for Schedule B line 3, but does not COMPUTE Form 8815 from statement data. Taxpayer must compute and enter manually. Affects line 2b (Schedule B savings bond exclusion reduces line 2b), NOT line 2a directly — but documented under line-2 context. Investigation 2026-05-11: ALREADY TRACKED in outstanding.md at line 1253 — "Lines 2a/2b: Form 8815 Savings Bond Exclusion Is Manual Entry Only (Deferred)" with full implementation sketch (read qualified education expenses + bond interest from statements, compute MAGI-based phaseout against 2025 thresholds $94,100–$124,100 single / $140,950–$170,950 MFJ, populate savingsBondExclusionAmount automatically). Secondary mention at outstanding.md:1011 (line 6a/6b Social Security worksheet line 5 — Form 8815 deferred carve-out). No new outstanding.md entry needed — canonical tracking already in place.', 'Out of scope for line 2a (affects line 2b / Schedule B line 3). Already tracked in outstanding.md:1253.', 'CLOSED — already deferred and tracked. No new outstanding.md entry needed. Pure xlsx-flip closure (matches the line 1h #10 / 1i #8 verifying-an-already-tracked-item pattern).'],
  [9, 'OBSERVATION — SELLER-FINANCED MORTGAGE INTEREST SCHEDULE B TRIGGER MISSING — DEFERRED 2026-05-11 (outstanding.md entry ADDED)', 'Pre-fix: per IRS Schedule B Part I instructions, taxpayer receiving interest from a seller-financed mortgage where the buyer used the property as a personal residence MUST file Schedule B regardless of amount, AND the buyer must be listed first on Schedule B line 1 with name, address, and SSN. Current code: no personal-form field captures this; `scheduleBRequired` chain at computeInterestIncome includes 9 triggers but NOT seller-financed mortgage. Silent spec/code gap — lines/2ab.md §4 line 123 LISTS this trigger but the code does NOT implement it. Affects Schedule B GATING only (does not affect line 2a value or line 2b amount; the amount flows correctly via manual-entry paths). Investigation 2026-05-11: NOT previously tracked in outstanding.md (separate from the Form 8396 mortgage-interest-credit entry at line 1786). Added a new outstanding.md entry "Lines 2a/2b: Seller-Financed Mortgage Interest Schedule B Trigger Missing — Deferred 2026-05-11" with full implementation sketch (~30-45 min scope): new YAML fields (hasSellerFinancedMortgageInterest + sellerFinancedMortgageEntries[] array with buyer name/address/SSN/amount/personal-residence-gate boolean); backend trigger addition + per-entry sum into line 2b + ScheduleBInterestItem priority-position rendering; frontend array UI + Schedule B line-1 first-position rendering; 3+ tests; spec + knowledge updates. Per audit recommendation: OUT OF SCOPE for line 2a — defer.', 'lines/2ab.md §4 line 123 (mentions trigger but code does not implement); computeInterestIncome scheduleBRequired chain (9 triggers, missing this one); outstanding.md (new entry at top)', 'CLOSED via deferred-enhancement entry. Per-line audit-folded protection: outstanding.md now tracks the gap. No code change today. Affected users (real-estate sellers carrying seller paper for personal-residence buyers) are uncommon.'],
  [10, 'OBSERVATION — TAX-EXEMPT MARKET DISCOUNT NOT FLAGGED — RESOLVED 2026-05-11 (Option A applied)', 'Pre-fix: per lines/2ab.md §5.2 and IRC §1276, market discount on a tax-exempt bond accrues as TAXABLE interest (line 2b), not tax-exempt (line 2a). YAML help text for `manualTaxExemptInterestNotOnStatements` did NOT warn users about this carve-out. A user with tax-exempt-bond market discount entering it into the wrong field would incorrectly inflate line 2a. Post-fix (Option A applied — audit recommended defer but the one-line fix took ~30 seconds and reaches every user via the standard YAML-driven help-text rendering): updated `help:` text in BOTH `yamls/2ab-interest-income-taxpayer.yaml` line 61 AND `yamls/2ab-interest-income-spouse.yaml` line 50 from "Enter tax-exempt interest not shown on uploaded statements. This flows to Form 1040 line 2a." to "Enter tax-exempt interest not shown on uploaded statements (e.g., direct holdings of municipal bonds). This flows to Form 1040 line 2a. Do NOT include market discount on a tax-exempt bond — that is taxable interest (line 2b), not tax-exempt interest." Symmetric clarification across taxpayer + spouse forms. No code change, no test change. Deviates from audit "defer" recommendation but matches the line 1z #5 immediate-fix pattern when a verified-safe trivial fix takes seconds. Backend regression: 749/749 pass.', 'yamls/2ab-interest-income-taxpayer.yaml line 61; yamls/2ab-interest-income-spouse.yaml line 50', 'CLOSED via Option A (immediate fix). UX clarification reaches every user who reads the form. The audit\'s "defer" recommendation was about priority, not feasibility — the one-line fix outperforms the procedural overhead of a deferred-enhancement entry.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 28 }, { wch: 95 }, { wch: 60 }, { wch: 95 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 2a Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.taxExemptInterest', 'topmostSubform[0].Page1[0].f1_58[0] (line2a_tax_exempt_interest)', 'form-tax-return-1040.xlsx (line 2a cell)', '★ Primary output. Whole-dollar HALF_UP rounding. Stored only when non-null. Informational only — does NOT enter line 9 / AGI / taxable income.'],
  ['(no separate statement attachment)', '(no PDF write-in)', '—', 'Line 2a is a single dollar amount with no write-in.'],
  [],
  ['DOWNSTREAM CONSUMERS (sourced from same 1099 entries, NOT from line 2a value)'],
  ['Form 6251 line 2g (AMT PAB interest)', 'topmostSubform[0].Page1[0].(form6251 line2g cell)', 'form-tax-return-6251.xlsx', 'Sourced from 1099-INT box 9 + 1099-DIV box 13 (the AMT-PAB subsets of boxes 8 and 12). Aggregated independently in computeInterestForPerson line 4489 (box 9) and DividendComputation.form6251Line2gDividends (box 13, Gap 4 fix). NOT computed from line 2a value.'],
  ['Schedule B Part III line 7a / 7a-2 / 8 (foreign-account, FBAR, foreign-trust attestations)', '(Schedule B Part III question cells)', 'form-tax-return-scheduleb.xlsx', 'Sourced from interest-income-taxpayer personal-form booleans (`hasForeignAccountForScheduleBPartIII`, `hasFbarRequirement`, `hasForeignTrustDistributionOrTransfer`). NOT line-2a-value-driven. May force Schedule B generation even when line 2b is below $1,500.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 (total income)', 'topmostSubform[0].Page1[0].(line 9 cell)', 'form-tax-return-1040.xlsx', 'EXCLUDED. line 9 = line 1z + 2b + 3b + 4b + 5b + 6b + 7a + 8 — line 2a is intentionally absent. Verified at TaxReturnComputeService.java:4147-4150 with breadcrumb (1z #7 closure 2026-05-10).'],
  ['Form 1040 line 11b (AGI)', 'topmostSubform[0].Page1[0].(line 11b cell)', 'form-tax-return-1040.xlsx', 'EXCLUDED. AGI = line 9 − line 10. Line 2a is never in line 9, so never in AGI.'],
  ['Form 1040 line 15 (taxable income)', 'topmostSubform[0].Page1[0].(line 15 cell)', 'form-tax-return-1040.xlsx', 'EXCLUDED. Taxable income = max(0, AGI − deductions). Line 2a is excluded from AGI.'],
  ['Schedule B Part I (interest detail)', '(Schedule B Part I rows)', 'form-tax-return-scheduleb.xlsx', 'EXCLUDED. Schedule B Part I covers taxable interest (line 2b) only. Tax-exempt interest does not get a payer-level breakout.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 50 }, { wch: 65 }, { wch: 50 }, { wch: 95 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
