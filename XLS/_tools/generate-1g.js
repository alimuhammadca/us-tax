// Generate C:\us-tax\XLS\computations\1g.xlsx — full computation map for Form 1040 Line 1g.
const XLSX = require('xlsx');

const OUT = String.raw`C:\us-tax\XLS\computations\1g.xlsx`;

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['Form 1040 Line 1g — Wages from Form 8919 (Uncollected Social Security and Medicare Tax on Wages)'],
  [],
  ['UI label on Form 1040', 'Wages from Form 8919, line 6'],
  ['Semantic field name', 'line1g_wages_form8919_line6'],
  ['Output field path (computed)', 'form1040.income.uncollectedSocialSecurityMedicareWages'],
  ['Output PDF field (f1040)', 'topmostSubform[0].Page1[0].f1_53[0]'],
  ['Tax year', '2025'],
  ['Authoritative sources', '2025 Form 8919 (Uncollected Social Security and Medicare Tax on Wages); 2025 Form 1040 instructions; IRC §3121 (FICA wages); IRC §3101 (employee share of SS/Medicare); IRC §1402 (independent-contractor SE tax distinction); Rev. Proc. 85-18 (Form SS-8 worker classification); SSA wage base announcement for 2025'],
  [],
  ['PLAIN-ENGLISH FORMULA'],
  ['Line 1g = sum of Form 8919 line 6 across taxpayer + spouse Forms 8919.'],
  ['Form 8919 line 6 = sum of "wages with no SS/Medicare withholding and not on a W-2" across all firm rows for that spouse.'],
  ['Each firm row represents a payment from a firm where: (a) worker performed services; (b) worker believes pay should have been employee wages; (c) firm did not withhold employee share of SS/Medicare; (d) one of IRS reason codes A, C, G, H applies.'],
  [],
  ['Line 1g is the wage portion. The corresponding tax (Form 8919 line 13) flows separately to Schedule 2 line 6 (uncollected SS/Medicare tax on wages).'],
  ['Form 8919 line 6 also feeds the Additional Medicare Tax computation (Form 8959 line 3) when the user is over the applicable AMT threshold.'],
  [],
  ['STEP-BY-STEP COMPUTATION (per spouse)'],
  ['Step', 'Operation', 'Formula', 'Notes'],
  [1, 'Outer gate', 'if !hasAnyForm8919Inputs(firmEntries) → return Form8919Result(null, null, null)', 'hasAnyForm8919RowInput checks firmName, firmFederalIdNumber, reasonCode, irsDeterminationDate, received1099MiscOrNec, wagesNoFicaNotW2 — any non-empty triggers compute'],
  [2, 'Per-firm validation', 'For each firm row: validate reasonCode ∈ {A, C, G, H}; if A or C, irsDeterminationDate required; if G, advisory; if H without 1099, soft warning', 'Blocking flags: FORM8919_REASON_CODE_INVALID_*, FORM8919_IRS_DATE_REQUIRED_*. Non-blocking: FORM8919_SS8_REQUIRED_* (code G), FORM8919_CODE_H_1099_* (code H without 1099)'],
  [3, 'Per-firm aggregation to line 6', 'line6 += parseAmount(firm.wagesNoFicaNotW2) (addNonNull, skips null/empty rows)', 'Column (f) on Form 8919; the wage amount the worker believes should have been W-2 wages'],
  [4, 'Line 7: Social Security wage base', 'line7 = ReferenceData.SOCIAL_SECURITY_WAGE_BASE = $176,100', '2025 SSA-published wage base; updates annually'],
  [5, 'Line 8: SS-taxed wages already reported', 'line8 = sumW2SocialSecurityWagesAndTipsForSsn(w2Entries, ssn)\\n      + sumW2RrtaCompensationForSsn(w2Entries, ssn)\\n      + form4137.line10UnreportedTipsSubjectSocialSecurity', 'Sum of W-2 box 3 + W-2 box 7 + RRTA tier-1 compensation + unreported tip income reported on Form 4137 line 10. SSN-filtered to the relevant spouse. Form 4137 dependency: computeTips() must run BEFORE computeUncollectedSSTax().'],
  [6, 'Line 9: remaining SS wage base', 'line9 = max(0, line7 − line8)', 'Floored at zero — when prior SS wages already exceed $176,100, no SS portion of Form 8919 wages applies'],
  [7, 'Line 10: wages subject to SS tax (uncollected)', 'line10 = min(line6, line9)', 'Caps the per-spouse Form 8919 wages at the remaining SS wage base'],
  [8, 'Line 11: uncollected SS tax', 'line11 = line10 × 0.062', '6.2% employee share of SS tax (IRC §3101(a))'],
  [9, 'Line 12: uncollected Medicare tax', 'line12 = line6 × 0.0145', '1.45% employee share of Medicare tax (IRC §3101(b)(1)). NO wage base cap — Medicare applies to all line 6 wages regardless of SS wage base position.'],
  [10, 'Line 13: total uncollected tax', 'line13 = line11 + line12', 'Per-spouse total; aggregates to Schedule 2 line 6'],
  [11, 'Round + persist Form 8919', 'form8919.setLine6/7/8/9/10/11/12/13 = roundMoney(...)', 'Whole-dollar rounding (HALF_UP) on each output line'],
  [],
  ['STEP-BY-STEP AGGREGATION (return-level)'],
  ['Step', 'Operation', 'Formula', 'Notes'],
  ['R1', 'Aggregate line 1g across spouses', 'form1040.income.uncollectedSocialSecurityMedicareWages = addNonNull(taxpayer.line6, spouse.line6)', '★ This is line 1g. addNonNull preserves null when both spouses contribute null.'],
  ['R2', 'Aggregate line 13 to Schedule 2 line 6', 'schedule2.otherTaxes.uncollectedSocialSecurityMedicareTaxOnWages = addNonNull(taxpayer.line13, spouse.line13)', 'Schedule 2 line 6; flows to Form 1040 line 23 (other taxes from Schedule 2)'],
  ['R3', 'Form 8959 (Additional Medicare Tax) line 3 contribution', 'When AMT triggered (Medicare wages > threshold): line3 = mfj ? addNonNull(taxpayer.line6, spouse.line6) : taxpayer.line6', 'Per IRC §3101(b)(2) (0.9% additional Medicare tax). 2025 thresholds: $250k MFJ / $200k Single/HOH/QSS / $125k MFS.'],
  [],
  ['DECISION TREE — when does Form 8919 generate?'],
  ['Spouse has firmEntries[]', 'hasAnyForm8919RowInput', 'reasonCode validity', 'IRS date for A/C', 'Result'],
  ['No firms entered', 'false', 'n/a', 'n/a', 'form8919* = null; no contribution to line 1g; no Schedule 2 line 6'],
  ['Firms entered, all rows empty', 'false', 'n/a', 'n/a', 'form8919* = null; same as no firms'],
  ['Firms entered, valid reason codes', 'true', 'OK', 'OK (or N/A for G/H)', 'form8919* generated; line 6 = Σ wagesNoFicaNotW2; line 13 wired to Schedule 2 line 6'],
  ['Firms with invalid reasonCode', 'true', 'INVALID', 'n/a', 'BLOCKING flag FORM8919_REASON_CODE_INVALID_*; computation still proceeds but return blocked'],
  ['Firms with code A or C, no irsDeterminationDate', 'true', 'OK', 'MISSING', 'BLOCKING flag FORM8919_IRS_DATE_REQUIRED_*; same'],
  ['Firms with code G', 'true', 'OK', 'N/A', 'Non-blocking advisory FORM8919_SS8_REQUIRED_* (file SS-8 separately, out of scope)'],
  ['Firms with code H, received1099 = false', 'true', 'OK', 'N/A', 'Non-blocking soft warning FORM8919_CODE_H_1099_*'],
];
const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 6 }, { wch: 50 }, { wch: 95 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUT FIELDS — Line 1g Computation'],
  [],
  ['#', 'Source Form (XLS)', 'Field Name', 'IRS Label / UI Question', 'Required?', 'How Used in Line 1g', 'Reference'],
  // Taxpayer-side personal form
  [1, 'form-uncollected-ss-medicare-taxpayer.xlsx (Income → Uncollected SS/Medicare — Taxpayer)', 'firms[].firmName', 'Firm name (col. a)', 'YES (required)', 'Display only — no compute impact. Used for Form 8919 line 1 (firms) display.', 'form-uncollected-ss-medicare-taxpayer.xlsx row 1'],
  [2, 'form-uncollected-ss-medicare-taxpayer.xlsx', 'firms[].firmFederalIdNumber', 'Firm federal ID number (col. b)', 'OPTIONAL', 'Display only — "unknown" acceptable per IRS instructions when worker doesn\'t have the firm\'s EIN.', 'form-uncollected-ss-medicare-taxpayer.xlsx row 2'],
  [3, 'form-uncollected-ss-medicare-taxpayer.xlsx', 'firms[].reasonCode', 'Reason code (col. c) — A, C, G, or H', 'YES (required)', 'Step 2: validated via isValidReasonCode (must be A, C, G, H). Drives blocking flags + advisory flags. **NOTE: this field is missing from the input xlsx** (Code Validation #2) — present in YAML and component, but not exported to XLS.', 'YAML: 1g-uncollected-ss-medicare-tax.yaml line 53; component: form-uncollected-ss-medicare-taxpayer.component.ts'],
  [4, 'form-uncollected-ss-medicare-taxpayer.xlsx', 'firms[].irsDeterminationDate', 'IRS determination/correspondence date (col. d)', 'CONDITIONAL — required when reasonCode = A or C', 'Step 2: drives FORM8919_IRS_DATE_REQUIRED_TAXPAYER blocking flag when missing for codes A/C.', 'form-uncollected-ss-medicare-taxpayer.xlsx row 3'],
  [5, 'form-uncollected-ss-medicare-taxpayer.xlsx', 'firms[].received1099MiscOrNec', 'Did you receive Form 1099-MISC or 1099-NEC from this firm? (col. e)', 'CONDITIONAL — soft check for code H', 'Step 2: when reasonCode = H AND received1099 != true → emits non-blocking FORM8919_CODE_H_1099_TAXPAYER warning (code H typically pairs with 1099 receipt).', 'form-uncollected-ss-medicare-taxpayer.xlsx row 4'],
  [6, 'form-uncollected-ss-medicare-taxpayer.xlsx', 'firms[].wagesNoFicaNotW2', 'Wages with no SS/Medicare withholding (col. f)', 'YES — primary input', 'Step 3: aggregated to line 6. **★ Drives line 1g.** Per-firm sum across all firms for this spouse.', 'form-uncollected-ss-medicare-taxpayer.xlsx row 6'],
  // Spouse-side personal form (mirror)
  [7, 'form-uncollected-ss-medicare-spouse.xlsx', '(All same fields as taxpayer)', 'Mirror of taxpayer fields', 'CONDITIONAL — MFJ only (per spec); MFS spouse also files own Form 8919 separately on their own return (out of scope here)', 'Per-spouse computation runs independently. Aggregated via addNonNull on line 6 + line 13. **No MFS guard at orchestrator** — see Code Validation #1.', 'form-uncollected-ss-medicare-spouse.xlsx (mirror)'],
  // Cross-form W-2 inputs (line 8 dependency)
  [8, 'form-w-2.xlsx (Statements → W-2)', 'wagesSocialSecurityWagesAmount (box 3)', 'W-2 box 3 — Social Security wages', 'YES — feeds line 8 SSN-filtered', 'Step 5: sumW2SocialSecurityWagesAndTipsForSsn aggregates box 3 across all W-2s with employeeSSN matching the relevant spouse.', 'form-w-2.xlsx (Box 3 row)'],
  [9, 'form-w-2.xlsx', 'socialSecurityTipsAmount (box 7)', 'W-2 box 7 — Social Security tips', 'YES — feeds line 8', 'Step 5: same helper sums box 7 (tip-only portion already reported on W-2). SSN-filtered.', 'form-w-2.xlsx (Box 7 row)'],
  [10, 'form-w-2.xlsx', 'box14Entries (RRTA tier-1 compensation)', 'W-2 box 14 — RRTA tier-1 compensation (for railroad employees)', 'CONDITIONAL — railroad workers only', 'Step 5: sumW2RrtaCompensationForSsn parses box 14 RRTA-coded entries. Adds to line 8 alongside boxes 3+7.', 'form-w-2.xlsx (Box 14 RRTA row)'],
  [11, 'form-w-2.xlsx', 'employeeSSN', 'Employee SSN (Box a)', 'YES — for SSN attribution', 'Step 5: drives sumW2*ForSsn filtering. Without correct SSN attribution, line 8 contributions are misallocated between spouses.', 'form-w-2.xlsx (Box a row)'],
  // Cross-compute Form 4137 dependency
  [12, '(internal — TipComputation result)', 'form4137Taxpayer.line10UnreportedTipsSubjectSocialSecurity', 'Form 4137 line 10 — unreported tips subject to Social Security tax', 'YES (when Form 4137 generated)', 'Step 5: cross-form dependency. computeTips() must run BEFORE computeUncollectedSSTax(); the line 10 result is passed in via TipComputation.', 'TaxReturnComputeService.computeUncollectedSSTax line 10243-10245'],
  // Identification (SSN attribution)
  [13, 'form-identification-taxpayer.xlsx / spouse', 'ssn', 'Taxpayer / spouse SSN', 'YES — drives W-2 SSN filtering', 'Step 5: drives sumW2SocialSecurityWagesAndTipsForSsn / sumW2RrtaCompensationForSsn. Without SSN, line 8 = 0.', 'form-identification-*.xlsx'],
  [14, 'form-filing-status.xlsx', 'filingStatus', 'Filing status', 'GATE (deferred)', 'On MFS, only the taxpayer form should be read. **NOT enforced at orchestrator** — see Code Validation #1. Currently relies on user not having stale spouse-form data when filing MFS.', 'form-filing-status.xlsx'],
  [],
  ['NOTE — `form-uncollected-ss-medicare-taxpayer.xlsx` is missing the `reasonCode` field'],
  ['The input form xlsx (auto-generated) shows only 6 fields and lacks `reasonCode` (column c on Form 8919). The YAML at `c:/us-tax/yamls/1g-uncollected-ss-medicare-tax.yaml:53` has it, the component renders it, and the backend reads it (`getString(entry, "reasonCode")` line 10280). The xlsx is out of sync. See Code Validation #2.'],
];
const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 60 }, { wch: 60 }, { wch: 70 }, { wch: 30 }, { wch: 90 }, { wch: 40 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data / Constants ──────────────────────────────────
const constants = [
  ['REFERENCE DATA / CONSTANTS — Line 1g (Tax Year 2025)'],
  [],
  ['Constant', 'Value', 'Source', 'Used By', 'Notes for Other Tax Years'],
  ['SOCIAL_SECURITY_WAGE_BASE', '$176,100', 'SSA annual COLA announcement; ReferenceData.java:11', 'Step 4 (Form 8919 line 7)', 'Indexed annually. 2024: $168,600. 2026 announced ~$184,500 (verify before TY 2026).'],
  ['Social Security tax rate (employee)', '6.2%', 'IRC §3101(a); hard-coded inline (line 10351: `new BigDecimal("0.062")`)', 'Step 8 (Form 8919 line 11)', 'Statutory; unchanged for decades.'],
  ['Medicare tax rate (employee, base)', '1.45%', 'IRC §3101(b)(1); hard-coded inline (line 10352: `new BigDecimal("0.0145")`)', 'Step 9 (Form 8919 line 12)', 'Statutory; unchanged. NO wage base cap on Medicare.'],
  ['ADDITIONAL_MEDICARE_RATE', '0.9%', 'IRC §3101(b)(2) (added by ACA); ReferenceData.java:12', 'Form 8959 (line 1g flows to Form 8959 line 3)', 'Statutory; fixed at 0.9%.'],
  ['ADDITIONAL_MEDICARE_THRESHOLD_SINGLE', '$200,000', 'IRC §3101(b)(2)(A); ReferenceData.java:15', 'Form 8959 (when AMT applies)', 'Statutory threshold — NOT indexed for inflation. Same value 2013–present.'],
  ['ADDITIONAL_MEDICARE_THRESHOLD_MFJ', '$250,000', 'IRC §3101(b)(2)(A); ReferenceData.java:16', 'Form 8959 (when AMT applies)', 'Statutory; unchanged.'],
  ['ADDITIONAL_MEDICARE_THRESHOLD_MFS', '$125,000', 'IRC §3101(b)(2)(A); ReferenceData.java:17', 'Form 8959 (when AMT applies)', 'Statutory; unchanged. (Half of MFJ threshold.)'],
  ['ADDITIONAL_MEDICARE_THRESHOLD_HOH', '$200,000', 'IRC §3101(b)(2)(A); ReferenceData.java:18', 'Form 8959 (when AMT applies)', 'Statutory; unchanged.'],
  ['ADDITIONAL_MEDICARE_THRESHOLD_QSS', '$200,000', 'IRC §3101(b)(2)(A); ReferenceData.java:19', 'Form 8959 (when AMT applies)', 'Statutory; unchanged.'],
  [],
  ['Reason codes (A, C, G, H)', 'See list below', 'IRS Form 8919 instructions', 'Step 2 (per-firm validation)', 'Stable IRS-defined letter codes.'],
  [],
  ['Statutory references (IRS rules, not configurable constants):'],
  ['IRS rule', 'Citation', 'Notes'],
  ['Form 8919 worker classification', 'IRC §1402, §3121; Rev. Proc. 85-18; Form SS-8 instructions', 'Determines whether a worker is an employee vs independent contractor for FICA purposes.'],
  ['Reason code A — IRS determination letter', 'Form 8919 instructions', 'IRS issued formal determination letter that worker is an employee. IRS date REQUIRED.'],
  ['Reason code C — IRS correspondence', 'Form 8919 instructions', 'IRS issued other correspondence (not a formal determination letter) saying worker is an employee. IRS date REQUIRED.'],
  ['Reason code G — Form SS-8 pending', 'Form 8919 instructions', 'Worker filed Form SS-8 with IRS but has not yet received a reply. **Form SS-8 must be filed separately** (not attached to the return — out of scope for this app).'],
  ['Reason code H — W-2 + 1099 from same firm', 'Form 8919 instructions', 'Worker received both a W-2 AND a 1099-MISC/NEC from the same firm for the same services, and the 1099 amount should have been W-2 wages. **Form SS-8 should NOT be filed** for this case.'],
  ['Form 8919 NOT for true independent-contractor income', 'IRC §1402 / Schedule C / Schedule SE', 'True self-employment income goes through Schedule C → Schedule SE for self-employment tax. Form 8919 is for misclassified employees only.'],
  ['Form 8919 NOT for unreported tip income', 'IRC §6053(a) / Form 4137', 'Unreported tips go through Form 4137 (line 1c). The two paths share line 8 of Form 8919 (Form 4137 line 10 contributes to Form 8919 line 8).'],
  ['Form 8919 NOT for W-2 box 12 codes M/N', 'IRC §6051 / Schedule 2 line 5', 'Group-term life insurance uncollected SS/Medicare on amounts > $50k coverage of FORMER employees. These flow to Schedule 2 line 5, not Schedule 2 line 6.'],
  ['Multi-page rule', 'Form 8919 PDF layout', 'A single Form 8919 PDF holds 5 firm rows. >5 firms → attach additional Forms 8919 (lines 1-5 only on overflow pages); lines 6-13 computed once on the main form. UI multi-page handled via buildMultiPagePdf in form-tax-return-8919-*.component.ts.'],
];
const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 22 }, { wch: 60 }, { wch: 60 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Schedule 2 Line 6 + Form 8959 Line 3 + Form 8919 (full)'],
  [],
  ['Output Field Path', 'Output Form (XLS)', 'Formula', 'Notes'],
  ['form8919Taxpayer (full Form 8919, taxpayer)', 'form-tax-return-8919-taxpayer.xlsx', 'Created when taxpayer hasAnyForm8919Inputs is true. All lines 1-13 populated.', 'Form 8919 attached to return when generated. PDF: f8919 with multi-page support (≤5 firms per page; lines 6-13 on first page only).'],
  ['form8919Spouse (full Form 8919, spouse)', 'form-tax-return-8919-spouse.xlsx', 'Same as taxpayer; created independently when spouse hasAnyForm8919Inputs is true.', 'On MFJ: both can be present. On non-MFJ: spouse should be null but no MFS guard at orchestrator (Code Validation #1).'],
  ['form1040.income.uncollectedSocialSecurityMedicareWages', 'form-tax-return-1040.xlsx (line 1g)', 'addNonNull(taxpayer.line6, spouse.line6)', '★ This is line 1g.'],
  ['schedule2.otherTaxes.uncollectedSocialSecurityMedicareTaxOnWages', 'form-tax-return-schedule2.xlsx (line 6)', 'addNonNull(taxpayer.line13, spouse.line13)', 'Schedule 2 line 6. Flows to Schedule 2 total → Form 1040 line 23 (other taxes from Schedule 2).'],
  ['schedule2.otherTaxes.totalAdditionalSocialSecurityMedicareTax', 'form-tax-return-schedule2.xlsx (line 7 subtotal)', 'addNonNull(tipTax (line 5), uncollectedTax (line 6))', 'Schedule 2 line 7 = lines 5 + 6. Subtotal of "additional SS/Medicare tax" group.'],
  ['form8959.line3MedicareWagesFromUncollectedSSMedicareWages (effective)', 'form-tax-return-8959.xlsx (line 3)', 'mfj ? addNonNull(taxpayer.line6, spouse.line6) : taxpayer.line6', 'Form 8959 line 3 — Medicare wages component subject to Additional Medicare Tax. Triggered only when total Medicare wages > applicable threshold ($200k Single/$250k MFJ/$125k MFS/$200k HOH/$200k QSS).'],
  [],
  ['CROSS-LINE INTERACTIONS'],
  ['Component', 'Affects', 'Notes'],
  ['Line 1g → line 1z', 'Form 1040 line 1z (total wages)', 'Standard income inclusion. line 1z = 1a + 1b + 1c + 1d + 1e + 1f + 1g + 1h.'],
  ['Line 1g → line 9 → AGI', 'Form 1040 line 9 (total income) → line 11 (AGI)', 'Indirect via line 1z aggregation.'],
  ['Form 8919 line 13 → Schedule 2 line 6', 'Schedule 2 line 6 (uncollected SS/Medicare tax on wages)', 'Per-spouse line 13 aggregated; flows to Schedule 2 line 6 → line 7 subtotal → Schedule 2 total → Form 1040 line 23.'],
  ['Form 8919 line 6 → Form 8959 line 3', 'Form 8959 (Additional Medicare Tax) line 3', 'Medicare wages from Form 8919 contribute to Medicare wages subject to the 0.9% additional tax. computeAdditionalMedicareTax aggregates W-2 Medicare wages + Form 4137 tips Medicare + Form 8919 line 6.'],
  ['Form 4137 line 10 → Form 8919 line 8', 'Form 8919 line 8 (input)', 'computeTips() must run BEFORE computeUncollectedSSTax(); the Form 4137 line 10 amount feeds Form 8919 line 8 via TipComputation pass-through. Execution order enforced in prepare().'],
  ['Line 1b household-employee collision guard', 'Form 1040 line 1b (household employee wages)', '`householdEmployeeAmount()` skips employer rows where `reportedOnForm8919=true` to prevent double-counting the same wages on both line 1b and line 1g. See dependencies/1g.md "Cross-Line Consistency" + lines/1g.md §10.3.'],
  [],
  ['THE LINE 1G / SCHEDULE 2 LINE 6 / FORM 8959 LINE 3 TRIANGLE'],
  ['Component', 'Source', 'Routes to'],
  ['Form 8919 line 6 wages', 'sum(wagesNoFicaNotW2 across firms)', 'Line 1g (income) + Form 8959 line 3 (AMT trigger when Medicare wages > threshold)'],
  ['Form 8919 line 13 tax', 'line11 (SS) + line12 (Medicare)', 'Schedule 2 line 6 (other taxes) — separate flow from line 1g (which is wages, not tax)'],
  ['Conceptual integrity', 'Wages on line 1g → income tax via Form 1040; tax on Schedule 2 line 6 → SS/Medicare worker share', 'Worker pays BOTH the income tax (via line 1g flowing to AGI) AND the employee FICA share (via Schedule 2 line 6) that the firm should have withheld but didn\'t.'],
];
const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 50 }, { wch: 100 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation / Blocking Flags ─────────────────────────────────
const flags = [
  ['VALIDATION RULES — Flags Emitted by Line 1g / Form 8919 Pass'],
  [],
  ['Flag Code', 'Trigger Condition', 'Effect', 'Suppressed When', 'Blocking?'],
  ['FORM8919_REASON_CODE_INVALID_TAXPAYER', 'Per firm: reasonCode is null/empty OR not in {A, C, G, H} after normalize (trim+upper)', 'BLOCKING. Code must be one of the four IRS-defined values; invalid codes block the return.', 'Set reasonCode to A, C, G, or H', 'YES'],
  ['FORM8919_REASON_CODE_INVALID_SPOUSE', 'Per firm (spouse): same as taxpayer', 'BLOCKING. Same.', 'Same.', 'YES'],
  ['FORM8919_IRS_DATE_REQUIRED_TAXPAYER', 'Per firm: reasonCode = A or C AND irsDeterminationDate is empty', 'BLOCKING. Codes A and C require the IRS letter/correspondence date in column (d).', 'Provide irsDeterminationDate OR change reasonCode to G or H (those don\'t require a date)', 'YES'],
  ['FORM8919_IRS_DATE_REQUIRED_SPOUSE', 'Per firm (spouse): same', 'BLOCKING. Same.', 'Same.', 'YES'],
  ['FORM8919_SS8_REQUIRED_TAXPAYER', 'Per firm: reasonCode = G', 'NON-BLOCKING advisory. Code G requires Form SS-8 to be filed SEPARATELY (not attached to the return). Form SS-8 generation is out of scope for this app.', 'Change reasonCode to A, C, or H if applicable; or proceed with Code G and file Form SS-8 separately', 'NO'],
  ['FORM8919_SS8_REQUIRED_SPOUSE', 'Per firm (spouse): same', 'NON-BLOCKING. Same.', 'Same.', 'NO'],
  ['FORM8919_CODE_H_1099_TAXPAYER', 'Per firm: reasonCode = H AND received1099MiscOrNec != true', 'NON-BLOCKING soft warning. Code H typically pairs with receiving both a W-2 AND a 1099 from the same firm; a "no" answer suggests the user picked the wrong code.', 'Either change reasonCode (to A/C/G if applicable) OR mark received1099MiscOrNec = true', 'NO'],
  ['FORM8919_CODE_H_1099_SPOUSE', 'Per firm (spouse): same', 'NON-BLOCKING. Same.', 'Same.', 'NO'],
  [],
  ['NON-FLAG defensive behaviors (silent skip)'],
  ['Scenario', 'Behavior', 'Why not flagged'],
  ['data == null (form not saved)', 'computeForm8919ForPerson returns Form8919Result(null, null, null); no contribution', 'Normal — taxpayer simply has no Form 8919 wages'],
  ['firmEntries empty', 'Same — early return', 'No firms entered'],
  ['Firms entered but all rows have no inputs', 'Same — hasAnyForm8919RowInput false for all', 'User opened the form but never filled any row'],
  ['wagesNoFicaNotW2 = null for a firm', 'Firm contributes 0 to line 6; row included in form output for display', 'Empty wage row — gracefully ignored in line 6 sum'],
  ['W-2 box 3/7 absent for spouse SSN', 'sumW2*ForSsn returns null; line 8 contribution = 0', 'No SS-taxed wages reported for that spouse'],
  ['form4137 = null (no Form 4137 generated)', 'form4137.line10 contribution to line 8 = null (treated as 0)', 'Spouse has no unreported tip income'],
  ['Filing status not saved (status = null)', 'Falls through to non-MFJ; line 3 = taxpayer line 6 only on Form 8959', 'Filing status defaults block the MFJ aggregation — favorable to taxpayer'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 52 }, { wch: 90 }, { wch: 60 }, { wch: 60 }, { wch: 12 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Reviewed against: TaxReturnComputeService.computeUncollectedSSTax() + computeForm8919ForPerson() + computeAdditionalMedicareTax() (function-name reference; verified 2026-05-08).'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'DEFENSIVE GAP — MFS GUARD NOT IN ORCHESTRATOR', '`computeUncollectedSSTax` always processes both `taxpayerData` and `spouseData` regardless of filing status. On MFS, only the taxpayer\'s Form 8919 belongs on this return — the spouse files separately. If the user has stale `uncollected-ss-medicare-spouse` form data from a prior MFJ year, the spouse contribution leaks into the MFS taxpayer\'s line 1g and Schedule 2 line 6. **Same pattern as line 1c #1, line 1d #1, line 1e #2, line 1f #2.** Mitigated in practice by `hasAnyForm8919Inputs` early-return when spouse form is empty, but not enforced when stale data exists.', 'computeUncollectedSSTax — no `boolean isMfsReturn` parameter', 'Mirror the line 1c / 1d / 1e / 1f pattern: pass `isMfsReturn` from `prepare()` (already computed); when true, pass `null` or `Map.of()` as `spouseData` so `computeForm8919ForPerson` returns the empty result. Single guard cascades through to line 1g, Schedule 2 line 6, and Form 8959 line 3 automatically. Add unit test `mfsExcludesSpouseForm8919FromLine1g`.'],
  [2, 'DOC GAP — INPUT XLSX OUT OF SYNC WITH YAML', '`form-uncollected-ss-medicare-taxpayer.xlsx` (and presumably the spouse counterpart) is missing the `reasonCode` field. The YAML at `c:/us-tax/yamls/1g-uncollected-ss-medicare-tax.yaml:53` has it; the component renders it; the backend reads it at `getString(entry, "reasonCode")`. The auto-generated input xlsx has only 6 fields (firmName, firmFederalIdNumber, irsDeterminationDate, received1099MiscOrNec radio, wagesNoFicaNotW2). reasonCode (column c on Form 8919) is absent from the xlsx export.', 'XLS/input_forms/form-uncollected-ss-medicare-taxpayer.xlsx', 'Re-run the input-form xlsx generator (`generate-form-xlsx.js`?) against the YAML to refresh. Verify `reasonCode` shows up. Likely a stale xlsx — the YAML has been updated but the export wasn\'t regenerated.'],
  [3, 'COLLISION GUARD INCOMPLETE — line 1g vs line 1c (Form 4137 tips)', 'lines/1g.md §10.3 says "do not allow the same wages to be counted again in another line-of-return path such as line 1a / line 1b / Form 4137 tip income". The line 1b household-employee guard exists (`householdEmployeeAmount` skips `reportedOnForm8919=true` employers per dependencies/1g.md "Cross-Line Consistency"). But there is **no analogous guard for line 1c** (Form 4137 unreported tips). If a user lists the same wage payment as both an unreported tip on Form 4137 AND an uncollected-FICA payment on Form 8919, both flow to wages — double-counted on line 1z.', 'computeForm4137ForPerson + computeForm8919ForPerson cross-check', 'Add a per-firm/per-tip-row collision check OR add a non-blocking advisory `FORM8919_LINE1C_COLLISION_TAXPAYER` when both Form 4137 and Form 8919 are generated for the same SSN. Practical risk is low (different field names, different intake forms), but the audit calls it out explicitly in §10.3.'],
  [4, 'TEST COVERAGE GAPS', 'Existing unit tests cover: single-firm code A; six-firm aggregation; AMT trigger via Form 8919 line 6; missing IRS date for code A. Missing: (a) MFS guard once Issue #1 is fixed; (b) RRTA contribution to line 8; (c) Form 4137 line 10 cross-form integration to line 8; (d) Soft warning for code H without 1099; (e) Code G non-blocking advisory; (f) SS wage base cap test (line 9 = 0 when prior wages ≥ $176,100); (g) MFJ both-spouses aggregate test.', 'TaxReturnComputeServiceTest', 'Add 5-7 new unit tests. The E2E suite covers some scenarios (line1g spec has 7 tests including 6-firm and SS-base cap), but unit-level coverage is thin.'],
  [5, 'KNOWLEDGE FILE NAMING CONVENTION DEVIATION', '`knowledge/knowledge-line-1g-form-8919.md` uses the prefix `knowledge-line-1g-` instead of the established `line-1g-` pattern (cf. `line-1c-tip-income.md`, `line-1d-medicaid-waiver-payments.md`, `line-1e-dependent-care-benefits.md`, `line-1f-employer-adoption-benefits.md`). Inconsistent file naming makes glob-based discovery harder.', 'C:\\us-tax\\knowledge\\ folder', 'Rename to `knowledge/line-1g-form-8919.md` (matching the established pattern). Update any internal cross-references (none found in current MEMORY.md or outstanding.md). Optional: add a verification log footer documenting the rename + audit closure for line 1g.'],
  [6, 'KNOWLEDGE FILE OUTDATED — verification log + closed-items table', 'Existing knowledge file dated 2026-04-11. References gaps that may be partially closed since (e.g., "received1099MiscOrNec uses p-select" — UI Rule 7). Should be refreshed during this audit to add the audit-closure verification log entry + reflect any closed gaps.', 'knowledge/knowledge-line-1g-form-8919.md (or post-rename name)', 'Add a "Verification log" section (mirroring line 1d/1e/1f pattern). Audit each gap entry — confirm if still open or closed. Note any patterns reinforced by this audit (e.g., MFS guard rollout).'],
  [7, 'LINE 8 CONTRACT — null-safety on form4137', 'Code: `form4137 == null ? null : form4137.getLine10UnreportedTipsSubjectSocialSecurity()`. If form4137 is null, contribution is null. addNonNull(null, ...) preserves the other operand. Safe. **Verified false positive — null-safety is correct.** Documented for future audit refresh.', 'computeForm8919ForPerson line 10339', 'No fix needed. Already correct.'],
  [8, 'FORM 8919 LINE 7 NOT SET WHEN form8919 = null', 'When `firmEntries` is empty (no Form 8919 generated), the constant `$176,100` is never set on the output Form 8919 because the form itself is null. This is correct behavior (no form, no constant). But spec §11 mentions line 7 is part of the displayed form. Confirmed: line 7 only displays when Form 8919 is generated.', 'Form8919.setLine7MaxWagesSubjectToSsTax (only called when firms exist)', 'No fix needed. Correct.'],
  [9, 'NO E2E TEST FOR MFS-GUARD AFTER ISSUE #1 FIX', 'Once Issue #1 is fixed, an E2E test covering "MFS taxpayer with stale spouse Form 8919 data does not include spouse contribution" would lock the new behavior. Currently the E2E suite has `MFJ: both spouses aggregate into line 1g` but no MFS test.', 'e2e/tests/line1g-uncollected-ss-medicare.spec.ts', 'After Issue #1 lands, add E2E test with: file MFS, save spouse Form 8919 with $5k wages, save taxpayer Form 8919 with $7k → assert line 1g = $7k (not $12k).'],
  [10, 'OBSERVATION — GROUP-TERM LIFE INSURANCE (W-2 BOX 12 CODES M/N) NOT HANDLED', 'lines/1g.md §4 explicitly excludes W-2 box 12 codes M and N (uncollected SS/Medicare on group-term life insurance > $50k coverage of FORMER employees). These flow to Schedule 2 line 5 (different line). No code path currently routes M/N — verify whether this is implemented elsewhere (or also deferred).', 'TaxReturnComputeService — no Schedule 2 line 5 wire-up that I can find for codes M/N', 'Out of scope for line 1g audit. If not implemented, document as a deferred enhancement (Schedule 2 line 5 from W-2 box 12 codes M/N). Practical user impact: rare (former employees with > $50k group-term life). Verify with grep before logging as an actual issue.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 22 }, { wch: 80 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 1g (and Form 8919) Flow in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.uncollectedSocialSecurityMedicareWages', 'topmostSubform[0].Page1[0].f1_53[0] (line1g_wages_form8919_line6)', 'form-tax-return-1040.xlsx (line 1g cell)', 'Primary output — printed on Form 1040 line 1g. Stored only when non-null. Whole-dollar rounded.'],
  ['form1040.income.line1z', '(line 1z cell on f1040)', 'form-tax-return-1040.xlsx', 'Line 1g is one of 8 components: line 1z = 1a + 1b + 1c + 1d + 1e + 1f + 1g + 1h (addNonNull).'],
  ['form1040.income.totalIncome', '(line 9 cell on f1040)', 'form-tax-return-1040.xlsx', 'Line 1g → 1z → 9 → AGI (line 11).'],
  ['form8919Taxpayer (full Form 8919)', 'topmostSubform[0].Page*[0].* on f8919', 'form-tax-return-8919-taxpayer.xlsx', 'Taxpayer Form 8919 attached to return when generated. PDF: f8919 with multi-page support.'],
  ['form8919Spouse (full Form 8919, MFJ only)', 'topmostSubform[0].Page*[0].* on f8919 (separate file for spouse)', 'form-tax-return-8919-spouse.xlsx', 'Spouse Form 8919 — generated independently when spouse has firm rows. Should be null on non-MFJ but currently not enforced (see Code Validation #1).'],
  ['schedule2.otherTaxes.uncollectedSocialSecurityMedicareTaxOnWages', 'topmostSubform[0].Page1[0] (Schedule 2 line 6)', 'form-tax-return-schedule2.xlsx (line 6)', 'Schedule 2 line 6 (uncollected SS/Medicare tax on wages). Aggregated across spouses.'],
  ['schedule2.otherTaxes.totalAdditionalSocialSecurityMedicareTax', 'topmostSubform[0].Page1[0] (Schedule 2 line 7)', 'form-tax-return-schedule2.xlsx (line 7 subtotal)', 'Schedule 2 line 7 = lines 5 + 6. Subtotal of "additional SS/Medicare tax" group.'],
  ['form8959.line3 (effective)', '(Form 8959 Part I line 3 cell)', 'form-tax-return-8959.xlsx', 'Form 8919 line 6 → Form 8959 Part I line 3 (Medicare wages from Form 8919). Triggers 0.9% additional Medicare tax when total Medicare wages > threshold.'],
  [],
  ['DOWNSTREAM USE (read by other computations)'],
  ['Consumer', 'How it uses line 1g', 'Notes'],
  ['Form 1040 line 1z (total wages)', 'Direct addNonNull aggregation', 'Line 1g bumps total wages.'],
  ['Form 1040 line 9 → AGI (line 11)', 'Indirect via line 1z', 'Standard income aggregation.'],
  ['Pub 915 SS Worksheet 1 line 3', 'Includes line 1g via line 1z reference', 'Same as other line 1 sub-lines.'],
  ['Schedule 2 line 6', 'Form 8919 line 13 (separate flow from line 1g)', 'The TAX portion (employee FICA share that should have been withheld). Distinct from line 1g (the WAGES portion).'],
  ['Form 8959 line 3 → 0.9% Additional Medicare Tax', 'Form 8919 line 6 contributes to Medicare wages base', 'Triggered when Medicare wages > threshold ($200k Single, $250k MFJ, $125k MFS, $200k HOH/QSS).'],
  ['EIC earned income (line 27a)', 'Includes line 1g as wages', 'IRC §32 earned income includes wages; Form 8919 wages qualify per IRC §3121.'],
  ['Schedule 8812 ACTC earned income', 'Includes line 1g as wages', 'Same wages-side aggregation.'],
  ['Form 2441 (dependent care) earned income', 'Includes line 1g as wages', 'IRC §21 earned income includes wages.'],
  ['Schedule 1-A line 38 (enhanced senior + tips deduction)', 'No direct interaction', 'Schedule 1-A scope is tips + overtime + car loan + senior — not Form 8919 wages.'],
  [],
  ['NEGATIVE / NULL CONTRACT'],
  ['line 1g value', 'Meaning'],
  ['null (field absent)', 'No Form 8919 generated for either spouse — neither taxpayer nor spouse has firm rows.'],
  ['BigDecimal.ZERO', 'Edge case — Form 8919 generated but all wages = 0 (firms entered for display purposes only). Possible but rare.'],
  ['Positive BigDecimal', 'Standard case — at least one firm with positive wagesNoFicaNotW2.'],
  ['(Negative impossible)', 'Wages cannot be negative — line 6 is a sum of user-entered amounts (each >= 0 by parseAmount/UI validation).'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 60 }, { wch: 70 }, { wch: 50 }, { wch: 80 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUT);
console.log('Wrote: ' + OUT);
