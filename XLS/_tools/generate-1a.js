// Generate C:\us-tax\XLS\computations\1a.xlsx — full computation map for Form 1040 Line 1a.
const XLSX = require('xlsx');
const path = require('path');

const OUT = String.raw`C:\us-tax\XLS\computations\1a.xlsx`;

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['Form 1040 Line 1a — Wages from Form(s) W-2, Box 1'],
  [],
  ['UI label on Form 1040', 'Total amount from Form(s) W-2, box 1'],
  ['Semantic field name', 'line1a_wages_w2_box1'],
  ['Output field path (computed)', 'form1040.income.wages'],
  ['Tax year', '2025'],
  ['Authoritative source', '2025 Instructions for Form 1040 / 1040-SR — line 1a; W-2 box-1 definition: General Instructions for Forms W-2 and W-3 (2025)'],
  [],
  ['PLAIN-ENGLISH FORMULA'],
  ['Line 1a = sum of Box 1 from every eligible W-2 (taxpayer + spouse on MFJ),'],
  ['         minus Box 11 nonqualified-plan amounts (re-routed to Schedule 1 line 8t),'],
  ['         minus inmate wages (re-routed to Schedule 1 line 8u),'],
  ['         excluding any W-2 with the Statutory-employee box checked (out of scope; flag emitted),'],
  ['         plus Form 4852 line 7a substitute wages when needsForm4852 = true and substituteFormType = w2.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Formula', 'Notes'],
  [1, 'For each W-2 entry, check Statutory-employee flag', 'if statutoryEmployee == true → exclude entry, emit STATUTORY_EMPLOYEE_W2_OUT_OF_SCOPE', 'Statutory employees report on Schedule C (out of scope)'],
  [2, 'Read Box 1 from each non-statutory W-2', 'box1 = w2.wagesTipsOtherCompAmount', 'If absent, treat as $0 (skip)'],
  [3, 'Subtract Box 11 NQDC if non-zero', 'box1_adjusted = box1 − w2.nonqualifiedPlansAmount', 'Box 11 amount is already INCLUDED in Box 1 per IRS W-2 instructions; subtraction prevents double counting'],
  [4, 'Sum across all non-statutory W-2s', 'wages_sum = Σ box1_adjusted', 'No SSN filtering — both taxpayer and spouse W-2s aggregate (the code does NOT match by SSN)'],
  [5, 'Subtract inmate wages from employment forms', 'wages_after_inmate = wages_sum − (employmentTaxpayer.inmateWagesAmount + employmentSpouse.inmateWagesAmount)', 'Inmate wages flow to Schedule 1 line 8u; subtraction is unconditional whenever amount > 0'],
  [6, 'Add Form 4852 substitute wages (taxpayer)', 'if form4852Taxpayer.needsForm4852 = true AND substituteFormType = "w2" → add line7aWagesTipsOtherCompensation', 'Substitute W-2 used when actual W-2 not received'],
  [7, 'Add Form 4852 substitute wages (spouse) — MFJ only', 'on non-MFS returns, also add form4852Spouse.line7aWagesTipsOtherCompensation', 'MFS guard: spouse Form 4852 NOT included on Married Filing Separately'],
  [8, 'Final value', 'form1040.income.wages = wages_after_inmate + form4852_total', 'Stored as BigDecimal (cents precision); whole-dollar rounding applied at PDF render'],
  [],
  ['IRS CARVE-OUTS APPLIED'],
  ['Carve-out', 'Trigger', 'Re-routed to', 'Implementation'],
  ['Box 11 NQDC / nongovernmental 457', 'w2.nonqualifiedPlansAmount > 0', 'Schedule 1 line 8t (otherIncomeNonqualifiedDeferredComp)', 'Subtracted in computeLine1aWages(); separately summed by sumW2Box11Nqdc() for line 8t'],
  ['Inmate wages', 'employmentForm.inmateWagesAmount > 0', 'Schedule 1 line 8u (otherIncomeWagesWhileIncarcerated)', 'Subtracted in computeLine1aWages() (passed via employmentFormInmateWages parameter)'],
  ['Statutory employee W-2', 'w2.statutoryEmployee = true', 'Schedule C (OUT OF SCOPE — blocking flag)', 'Entire W-2 excluded; STATUTORY_EMPLOYEE_W2_OUT_OF_SCOPE flag emitted per W-2'],
  ['W-2 Box 8 allocated tips', '— (never included in Box 1)', 'Line 1c (tip income)', 'No special handling; allocatedTipsAmount is read by computeTipIncome(), NOT by computeLine1aWages()'],
];
const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 6 }, { wch: 50 }, { wch: 70 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs (with cross-references to input form xlsx files) ─────
const inputs = [
  ['INPUT FIELDS — Line 1a Computation'],
  [],
  ['#', 'Source Form (XLS)', 'Field Name', 'IRS Label / Form Box', 'Required?', 'How Used in Line 1a', 'Reference'],
  [1, 'form-w-2.xlsx (Statements → W-2)', 'wagesTipsOtherCompAmount', 'W-2 Box 1 — Wages, tips, other compensation', 'YES — primary input', 'Summed across all non-statutory W-2 entries (after Box 11 subtraction)', 'form-w-2.xlsx row 9'],
  [2, 'form-w-2.xlsx (Statements → W-2)', 'nonqualifiedPlansAmount', 'W-2 Box 11 — Nonqualified plans', 'CONDITIONAL — when > 0', 'Subtracted from same W-2’s Box 1; re-routed to Schedule 1 line 8t', 'form-w-2.xlsx row 27'],
  [3, 'form-w-2.xlsx (Statements → W-2)', 'statutoryEmployee', 'W-2 Box 13 — Statutory employee checkbox', 'CONDITIONAL — checkbox', 'When true, ENTIRE W-2 excluded from line 1a (Schedule C — out of scope)', 'form-w-2.xlsx row 32 / 82'],
  [4, 'form-w-2.xlsx (Statements → W-2)', 'employeeSSN', 'W-2 Box a — Employee’s SSN', 'NOT used to filter line 1a', 'Used by missing-W-2 validation only (hasW2ForSsn). computeLine1aWages does NOT match by SSN.', 'form-w-2.xlsx row 1'],
  [5, 'form-employment-taxpayer.xlsx (Personal → Employment income — Taxpayer)', 'inmateWagesAmount', 'Amount of wages earned while incarcerated', 'CONDITIONAL — when hasInmateWages = true', 'Subtracted from total W-2 wages; re-routed to Schedule 1 line 8u', 'form-employment-taxpayer.xlsx (search "inmate")'],
  [6, 'form-employment-spouse.xlsx (Personal → Employment income — Spouse)', 'inmateWagesAmount', 'Amount of wages earned while incarcerated (spouse)', 'CONDITIONAL — when spouse hasInmateWages = true', 'Subtracted from total W-2 wages; re-routed to Schedule 1 line 8u', 'form-employment-spouse.xlsx (search "inmate")'],
  [7, 'form-employment-taxpayer.xlsx', 'hasEmploymentIncome', 'Did you receive any wages?', 'GATE — used for missing-W-2 validation', 'When true AND no W-2 with matching SSN AND no Form 4852 → emits MISSING_W2_EMPLOYMENT_INCOME_TAXPAYER (does not affect amount)', 'form-employment-taxpayer.xlsx row 1'],
  [8, 'form-employment-taxpayer.xlsx', 'householdWork', 'Did you receive pay for household work?', 'GATE — suppresses missing-W-2 flag', 'When explicitly = false, missing-W-2 gate may fire. When = true, household-employee path (line 1b) handles wages and gate is suppressed.', 'form-employment-taxpayer.xlsx row 3'],
  [9, 'form-employment-spouse.xlsx', 'hasEmploymentIncome', 'Did you receive any wages? (spouse)', 'GATE', 'Same as #7 for spouse on MFJ returns', 'form-employment-spouse.xlsx row 1'],
  [10, 'form-employment-spouse.xlsx', 'householdWork', 'Did you receive pay for household work? (spouse)', 'GATE', 'Same as #8 for spouse', 'form-employment-spouse.xlsx row 3'],
  [11, 'form-form4852.xlsx (Applications → Substitute W-2 / 1099-R — Taxpayer)', 'needsForm4852', 'Need to use Form 4852?', 'CONDITIONAL — gate', 'Required = true to add Form 4852 wages', 'form-form4852.xlsx row 1'],
  [12, 'form-form4852.xlsx', 'substituteFormType', 'Form W-2 or Form 1099-R substitute?', 'CONDITIONAL', 'Must = "w2" for line 7a wages to flow to line 1a', 'form-form4852.xlsx row 3'],
  [13, 'form-form4852.xlsx', 'line7aWagesTipsOtherCompensation', 'Line 7a — Wages, tips, and other compensation', 'CONDITIONAL', 'Added to line 1a when Form 4852 conditions met', 'form-form4852.xlsx row 7'],
  [14, 'form-form4852-spouse.xlsx (Applications → Substitute W-2 / 1099-R — Spouse)', 'needsForm4852 / substituteFormType / line7a...', 'Same as taxpayer Form 4852', 'CONDITIONAL — MFJ only', 'Added to line 1a EXCEPT on MFS returns (MFS spouse Form 4852 excluded by guard)', 'form-form4852-spouse.xlsx'],
  [15, 'form-filing-status.xlsx (Personal → Filing status)', 'filingStatus', 'Filing status (S/MFJ/MFS/HOH/QSS)', 'GATE — used for MFS guard', 'When MFS: spouse Form 4852 wages NOT added to taxpayer’s line 1a', 'form-filing-status.xlsx'],
];
const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 40 }, { wch: 32 }, { wch: 50 }, { wch: 24 }, { wch: 60 }, { wch: 32 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data / Constants ──────────────────────────────────
const constants = [
  ['REFERENCE DATA / CONSTANTS — Line 1a (Tax Year 2025)'],
  [],
  ['Constant', 'Value', 'Source', 'Used By', 'Notes for Other Tax Years'],
  ['(NONE — line 1a uses no tax-year-specific constants)', '—', '—', '—', 'Line 1a is a pure aggregation: Σ W-2 Box 1 with carve-out subtractions. No thresholds, brackets, or limits apply.'],
  [],
  ['Related (NOT applied to line 1a but mentioned in code area):'],
  ['HOUSE_HOLD_EMPLOYEE_THRESHOLD', '$2,800 (2025)', 'ReferenceData.HOUSE_HOLD_EMPLOYEE_THRESHOLD', 'Line 1b (household employee wages) — NOT line 1a', 'Adjusts annually. 2024 = $2,700. 2026 = TBD.'],
  ['Combat-pay election thresholds', 'see line 1i', 'ReferenceData', 'Line 1i (combat pay), EITC computations', 'Annual updates'],
];
const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 38 }, { wch: 18 }, { wch: 45 }, { wch: 50 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-effect outputs (Schedule 1 lines 8t / 8u) ──────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Re-routed Wages from Line 1a Computation'],
  [],
  ['Output Field', 'Formula', 'Output XLS Reference', 'Notes'],
  ['schedule1.additionalIncome.otherIncomeNonqualifiedDeferredComp', 'Σ w2.nonqualifiedPlansAmount (non-statutory) + otherIncomesTaxpayer.otherIncomeNonqualifiedDeferredComp8t + otherIncomesSpouse.otherIncomeNonqualifiedDeferredComp8t', 'form-tax-return-schedule1.xlsx (Schedule 1 line 8t)', 'Field set to null if total is zero'],
  ['schedule1.additionalIncome.otherIncomeWagesWhileIncarcerated', 'employmentTaxpayer.inmateWagesAmount + employmentSpouse.inmateWagesAmount + otherIncomesTaxpayer.otherIncomeWagesWhileIncarcerated8u + otherIncomesSpouse.otherIncomeWagesWhileIncarcerated8u', 'form-tax-return-schedule1.xlsx (Schedule 1 line 8u)', 'Field set to null if total is zero. MFJ only for spouse contribution.'],
  [],
  ['CROSS-LINE INVARIANT'],
  ['line1a + line8t_w2_portion + line8u_w2_portion == Σ w2.box1 (non-statutory)'],
  ['(No double counting between line 1a and the re-routed Schedule 1 lines)'],
];
const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 100 }, { wch: 50 }, { wch: 40 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Blocking Flags / Validation ─────────────────────────────────
const flags = [
  ['VALIDATION RULES — Blocking Flags Emitted by Line 1a Pass'],
  [],
  ['Flag Code', 'Trigger Condition', 'Effect', 'Suppressed When'],
  ['MISSING_W2_EMPLOYMENT_INCOME_TAXPAYER', 'employment-income-taxpayer.hasEmploymentIncome = true AND householdWork ≠ true (must be explicitly false) AND no W-2 entry has employeeSSN matching taxpayer SSN', 'Blocking — return cannot be filed', 'form4852-taxpayer with needsForm4852 = true AND substituteFormType = w2 AND line7aWagesTipsOtherCompensation present'],
  ['MISSING_W2_EMPLOYMENT_INCOME_SPOUSE', 'Same condition for spouse on returns with a spouse form present', 'Blocking', 'form4852-spouse satisfying the same conditions'],
  ['STATUTORY_EMPLOYEE_W2_OUT_OF_SCOPE', 'Any W-2 entry has statutoryEmployee = true', 'Blocking — Schedule C is out of scope. Compute continues for remaining W-2s, but flag prevents filing.', 'Never (no current support for statutory employee path)'],
  [],
  ['VALIDATION RULES — Per-W-2 Range Checks (informational; not enforced as blocking)'],
  ['Rule', 'Condition'],
  ['inmateWagesAmount cannot exceed total Box 1', '0 ≤ Σ employmentForm.inmateWagesAmount ≤ Σ w2.wagesTipsOtherCompAmount (otherwise subtractNonNegative clamps to 0)'],
  ['nonqualifiedPlansAmount cannot exceed Box 1', '0 ≤ w2.nonqualifiedPlansAmount ≤ w2.wagesTipsOtherCompAmount per W-2 (subtractNonNegative clamps)'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 42 }, { wch: 75 }, { wch: 50 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation — discrepancies & gaps ──────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Reviewed against: TaxReturnComputeService.computeLine1aWages() (line 10262), buildIncome() line 1a wiring (line 3960), extractForm4852Line1aWages() (line 13599)'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'DOC INCONSISTENCY', 'dependencies/1a.md states "Employee SSN must match 111-11-1111 (taxpayer) or 222-22-2222 (spouse) for amount to be included" — implying SSN-based filtering.', 'dependencies/1a.md vs computeLine1aWages() and lines/1a.md §13/§15', 'computeLine1aWages() does NOT filter by SSN (loops over all entries). lines/1a.md §15 confirms this. Update dependencies/1a.md to remove the SSN-filter claim.'],
  [2, 'DOC OUTDATED', 'dependencies/1a.md "Deferred / Not Yet Wired" section says Form 4852 line 7a is NOT wired into line 1a.', 'dependencies/1a.md lines 132-136 vs TaxReturnComputeService.java line 3988-3990', 'Code DOES wire Form 4852 (since 2026-04-09 per lines/1a.md §16). Remove the deferred claim from dependencies/1a.md.'],
  [3, 'POTENTIAL UI BUG', 'W-2 statement form-w-2.xlsx has fields includesInmateWages (rows 37/54) and inmateWagesAmount (rows 39/55), but computeLine1aWages() does NOT read inmateWagesAmount from W-2 entries — only from employment-income forms.', 'form-w-2.component.ts vs computeLine1aWages()', 'Either (a) remove the unused W-2 inmate fields from form-w-2 to avoid confusion, or (b) wire the W-2 inmate fields as an additional source for line 8u. Currently any value entered there is silently dropped.'],
  [4, 'EDGE CASE NOT TESTED', 'When householdWork = null (UI question never answered), MISSING_W2_EMPLOYMENT_INCOME flag does NOT fire even if hasEmploymentIncome = true and no W-2.', 'lines/1a.md §14 documents this as intentional ("explicit false"); but no unit test confirms the null-vs-false branching.', 'Add unit test: given hasEmploymentIncome=true, householdWork=null, no W-2 → expect NO blocking flag. Then householdWork=false → expect MISSING_W2 flag.'],
  [5, 'NOT IMPLEMENTED', 'W-2C (Form W-2C — Corrected Wage and Tax Statement) has no statement type in StatementFormCatalog.', 'lines/1a.md §13 note + outstanding.md', 'User must overwrite the W-2 entry manually if a corrected W-2 arrives. No amended-return (Form 1040-X) flow either. Document this limitation in user-facing copy.'],
  [6, 'NOT IMPLEMENTED', 'Form 4852 → line 1a E2E test missing.', 'lines/1a.md §16 outstanding', '6 unit tests exist but no Playwright spec exercises the full UI → compute → line 1a result flow with Form 4852 substitute wages.'],
  [7, 'POTENTIAL DOUBLE COUNT', 'If a user enters both an employment-form inmateWagesAmount AND records the same amount on other-incomes-taxpayer.otherIncomeWagesWhileIncarcerated8u, line 8u will double-count.', 'computeOtherIncomes() sums both sources unconditionally for line 8u', 'Add validation: if both sources are non-zero, prefer one or warn the user. Currently no overlap detection.'],
  [8, 'CODE DESIGN — DOCUMENTED', 'Two separate W-2 sum methods exist: computeLine1aWages() (with carve-outs) vs sumW2Wages() (raw sum, no carve-outs).', 'lines/1a.md §15', 'Intentional. sumW2Wages is used by SS worksheet, Form 2441, FICA — they need raw box 1. Confirmed correct usage.'],
  [9, 'MINOR — COSMETIC', 'computeLine1aWages() returns null (not 0) when no W-2 entries exist.', 'TaxReturnComputeService.java line 10266-10268', 'Caller (buildIncome) handles null via subsequent addNonNull / Form 4852 supplement, so behavior is correct. Worth a comment/test confirming null vs 0 semantics.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 18 }, { wch: 60 }, { wch: 50 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output mapping (where line 1a value goes) ────────────────────
const output = [
  ['OUTPUT — Where Line 1a Value Flows in the Return'],
  [],
  ['Output Field Path', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.wages', 'form-tax-return-1040.xlsx (line 1a area)', 'Primary output — printed on Form 1040 line 1a'],
  ['form1040.income.line1z', 'form-tax-return-1040.xlsx (line 1z)', 'Line 1a contributes to total wages (line 1z = 1a + 1b + 1c + 1d + 1e + 1f + 1g + 1h)'],
  ['form1040.income.totalIncome', 'form-tax-return-1040.xlsx (line 9)', 'Line 1a → 1z → 9 (total income via 1z + 2b + 3b + 4b + 5b + 6b + 7a + 8)'],
  ['form1040.adjustedGrossIncome', 'form-tax-return-1040.xlsx (line 11)', 'Line 9 − line 10 (income adjustments)'],
  [],
  ['DOWNSTREAM USE (read by other computations)'],
  ['Consumer', 'How it uses line 1a', 'Notes'],
  ['Schedule 8812 / Additional Child Tax Credit (ACTC)', 'Earned-income basis includes line 1a', 'Line 1a + line 1c + Schedule 1 SE line 15 (currently SE out of scope)'],
  ['Form 8880 Saver’s Credit', 'AGI threshold — derived from line 11 which derives from line 1a', '2025 limits: $76,500 MFJ / $57,375 HOH / $38,250 others'],
  ['EITC (out of scope)', 'Earned income basis', 'Not currently implemented'],
  ['Form 2441 Child & Dependent Care', 'Earned income limit (smaller of taxpayer or spouse earned income, where W-2 box 1 is the W-2 component)', 'Uses sumW2Wages() (raw, not line 1a) — see Code Validation #8'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 50 }, { wch: 50 }, { wch: 75 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUT);
console.log('Wrote: ' + OUT);
