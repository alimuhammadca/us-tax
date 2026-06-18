// Generate C:\us-tax\XLS\computations\1c.xlsx — full computation map for Form 1040 Line 1c.
const XLSX = require('xlsx');

const OUT = String.raw`C:\us-tax\XLS\computations\1c.xlsx`;

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['Form 1040 Line 1c — Tip Income Not Reported on Line 1a'],
  [],
  ['UI label on Form 1040', 'Tip income not reported on line 1a (see instructions)'],
  ['Semantic field name', 'line1c_tip_income'],
  ['Output field path (computed)', 'form1040.income.tipIncome'],
  ['Output PDF field (f1040)', 'topmostSubform[0].Page1[0].f1_49[0]'],
  ['Tax year', '2025'],
  ['Authoritative sources', '2025 Instructions for Form 1040 line 1c; IRS Pub 531 (Reporting Tip Income); 2025 Form 4137; W-2 box-1 / box-8 instructions'],
  [],
  ['PLAIN-ENGLISH FORMULA'],
  ['Line 1c = Σ (per-employer unreported-for-income tips) + Σ (per-employer noncash tips FMV),'],
  ['         summed across taxpayer + spouse on MFJ (separate Form 4137 per spouse).'],
  ['         "Unreported-for-income" applies the ALLOCATED-TIPS / ADEQUATE-RECORDS rule per employer.'],
  [],
  ['         IMPORTANT distinctions:'],
  ['          • Line 1c is INCOME. Form 4137 (→ Schedule 2 line 5) is the related SS+Medicare TAX. Different lines, different rules.'],
  ['          • Tips already in W-2 box 1 belong to LINE 1a, NOT line 1c.'],
  ['          • Sub-$20/month tips DO belong on line 1c (they are taxable income), but they are EXCLUDED from Form 4137 line 6 (the Medicare-tax base).'],
  ['          • Noncash tips ARE on line 1c, but Form 4137 only computes tax on cash/charge tips — no Medicare/SS owed on noncash via this path.'],
  [],
  ['STEP-BY-STEP COMPUTATION (per person — taxpayer and, on MFJ, spouse)'],
  ['Step', 'Operation', 'Formula', 'Notes'],
  [1, 'Load employer entries', 'employers = tipsByEmployer[] from personal form', 'If empty, AUTO-FILL from W-2 entries with allocatedTipsW2Box8 > 0 and matching employee SSN'],
  [2, 'Per-employer: compute "unreported cash/charge"', 'unreportedCashCharge = max(0, totalTipsReceived − totalTipsReportedToEmployer)', 'Floor at zero — negative subtraction clamped'],
  [3, 'Per-employer: apply allocated-tips override', 'See decision tree below', 'IRS Pub 531 + Pub 4137: allocated tips MUST be reported unless adequate records show LESS unreported actually occurred'],
  [4, 'Per-employer: accumulate sums', 'totalUnreportedTipsForIncome += unreportedForIncome\\ntotalNonCashTips += nonCashTipsFmv\\ntotalUnderTwentyTips += line5Under20PerMonthTips\\ntotalMedicareOnlyTips += medicareOnlyGovernmentTips\\ntotalRrtaComp += rRTACompensationW2Box14\\ntotalAllocatedTips += allocatedTipsW2Box8', 'Per-employer values accumulate to per-person sums; per-person sums are the inputs to Form 4137'],
  [5, 'Compute line 1c income for this person', 'line1cPerson = totalUnreportedTipsForIncome + totalNonCashTips', 'addNonNull semantics — null + null = null'],
  [6, 'Build Form 4137 (only when triggered)', 'See Form 4137 sub-computation below', 'Form 4137 created when totalUnreportedForIncome > 0 AND (line6 > 0 OR allocatedTips > 0)'],
  [7, 'Aggregate across spouses', 'line1c = taxpayer.line1c + spouse.line1c', 'addNonNull — see Code Validation #1 re: missing MFS guard'],
  [8, 'Round to whole dollars', 'line1c = roundMoney(line1c)', 'WHOLE_DOLLAR mode (half-up)'],
  [9, 'Persist on Form 1040', 'income.setTipIncome(line1c) only when line1c != null', 'Field omitted from output when no tip income exists'],
  [],
  ['DECISION TREE — "unreportedForIncome" per employer (Step 3)'],
  ['Branch', 'Condition', 'Result'],
  ['No allocated tips', 'allocatedTips == null OR == 0', 'unreportedForIncome = unreportedCashCharge'],
  ['Adequate-records reduction', 'allocatedTips > 0 AND hasAdequateRecords == true AND substantiated < allocatedTips', 'unreportedForIncome = substantiated (use the LOWER substantiated number)'],
  ['Allocated tips override', 'allocatedTips > 0 AND (no adequate records OR substantiated >= allocated OR substantiated == null)', 'unreportedForIncome = max(unreportedCashCharge, allocatedTips) — take the HIGHER of the two'],
  [],
  ['DECISION TREE — Form 4137 line-by-line (subset; full list in Side-Effect Outputs sheet)'],
  ['Form 4137 line', 'Formula', 'Source field'],
  ['Line 4 (total unreported tips)', 'sum of unreportedForIncome per employer', 'Same as line 1c minus noncash; basis for SS+Medicare tax'],
  ['Line 5 (under-$20/month)', 'sum of line5Under20PerMonthTips per employer', 'Reduces Medicare-tax base (line 6) but NOT line 1c'],
  ['Line 6 (subject to Medicare)', 'max(0, Line 4 − Line 5)', 'Medicare-tax base; ALSO feeds Form 8959 Additional Medicare Tax base'],
  ['Line 7 (SS wage base)', '$176,100 (2025 constant)', 'ReferenceData.SOCIAL_SECURITY_WAGE_BASE'],
  ['Line 8 (already-paid SS wages+tips+RRTA)', 'sum(W-2 box 3 + W-2 box 7 SSN-filtered) + sum(rRTAComp); fallback: form input fields', 'Reduces remaining SS-tax base'],
  ['Line 10 (subject to SS)', 'min(Line 6 − medicareOnlyTips, Line 7 − Line 8)', 'Government employees with Medicare-only tips skip SS portion'],
  ['Line 11 (SS tax)', 'Line 10 × 6.2%', 'Null if MISSING_SS_W2_DATA flag fires'],
  ['Line 12 (Medicare tax)', 'Line 6 × 1.45%', 'Always computed (no SS-data dependency)'],
  ['Line 13 (total tip tax)', 'Line 11 + Line 12', '→ Schedule 2 line 5 (otherTaxes.unreportedTipIncomeTax)'],
];
const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 6 }, { wch: 50 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUT FIELDS — Line 1c Computation'],
  [],
  ['#', 'Source Form (XLS)', 'Field Name', 'IRS Label / UI Question', 'Required?', 'How Used in Line 1c / Form 4137', 'Reference'],
  // Per-employer inputs (within tipsByEmployer[])
  [1, 'form-tip-income-taxpayer.xlsx (Incomes → Tips — Taxpayer)', 'employerName', 'Employer name (col. a)', 'YES — display + Form 4137 employer table', 'Display only; auto-filled from W-2 when present', 'form-tip-income-taxpayer.xlsx row 3'],
  [2, 'form-tip-income-taxpayer.xlsx', 'employerEIN', 'Employer EIN (col. b)', 'CONDITIONAL — required when Form 4137 applies', 'Form 4137 employer table; UI uses requiresEmployerEin(i) to derive the requirement per row', 'form-tip-income-taxpayer.xlsx row 4'],
  [3, 'form-tip-income-taxpayer.xlsx', 'totalTipsReceived', 'Total cash & charge tips received (col. c)', 'YES — primary input', 'Step 2: unreportedCashCharge = max(0, received − reported); also Form 4137 line 2', 'form-tip-income-taxpayer.xlsx row 5'],
  [4, 'form-tip-income-taxpayer.xlsx', 'totalTipsReportedToEmployer', 'Tips reported to employer (col. d)', 'YES — primary input', 'Step 2: unreported = received − reported; also Form 4137 line 3', 'form-tip-income-taxpayer.xlsx row 6'],
  [5, 'form-tip-income-taxpayer.xlsx', 'allocatedTipsW2Box8', 'Allocated tips from W-2 box 8', 'CONDITIONAL — drives override logic', 'Step 3: allocated-tips override raises unreportedForIncome to allocated when >= unreported (or to substantiated if adequate records show less)', 'form-tip-income-taxpayer.xlsx row 7; auto-filled from W-2'],
  [6, 'form-tip-income-taxpayer.xlsx', 'hasAdequateRecordsUnreportedLessThanAllocated', 'Do you have adequate records showing your actual unreported tips are less than the allocated amount?', 'CONDITIONAL — gate', 'Step 3: when true AND substantiated < allocated → use substantiated', 'form-tip-income-taxpayer.xlsx row 8'],
  [7, 'form-tip-income-taxpayer.xlsx', 'substantiatedUnreportedTipsIfLessThanAllocated', 'Substantiated unreported tips (if lower than allocated)', 'CONDITIONAL — only used when adequate records claimed', 'Step 3: replaces allocated number when valid', 'form-tip-income-taxpayer.xlsx row 10'],
  [8, 'form-tip-income-taxpayer.xlsx', 'line5Under20PerMonthTips', 'Tips not reported because under $20 in any month', 'OPTIONAL', 'Reduces Form 4137 line 6 (Medicare base) but does NOT reduce line 1c', 'form-tip-income-taxpayer.xlsx row 11'],
  [9, 'form-tip-income-taxpayer.xlsx', 'medicareOnlyGovernmentTips', 'Medicare-only government tips (1.45%)', 'OPTIONAL', 'Excluded from Form 4137 line 10 (SS base) — government employees do not pay SS on tips', 'form-tip-income-taxpayer.xlsx row 13'],
  [10, 'form-tip-income-taxpayer.xlsx', 'nonCashTipsFmv', 'Non-cash tips — fair market value', 'OPTIONAL', 'Step 5: line1cPerson = unreportedForIncome + nonCashTipsFmv. Income only — does NOT enter Form 4137 lines 2–12 (no FICA tax on noncash).', 'form-tip-income-taxpayer.xlsx row 15'],
  [11, 'form-tip-income-taxpayer.xlsx', 'rRTACompensationW2Box14', 'RRTA compensation (W-2 box 14)', 'CONDITIONAL — railroad employees', 'Adds to Form 4137 line 8 (SS wage base used). RRTA tax itself is NOT computed via Form 4137 (handled by employer per IRS).', 'form-tip-income-taxpayer.xlsx row 17'],
  [12, 'form-tip-income-taxpayer.xlsx', 'socialSecurityWagesW2Box3', 'Social Security wages (W-2 box 3)', 'CONDITIONAL — fallback', 'Used as Form 4137 line 8 input ONLY when no matching W-2 statement exists in the system', 'form-tip-income-taxpayer.xlsx row 19'],
  [13, 'form-tip-income-taxpayer.xlsx', 'socialSecurityTipsW2Box7', 'Social Security tips (W-2 box 7)', 'CONDITIONAL — fallback', 'Same as above — Form 4137 line 8 fallback only', 'form-tip-income-taxpayer.xlsx row 20'],
  [14, 'form-tip-income-spouse.xlsx (Incomes → Tips — Spouse)', 'tipsByEmployer[]', 'Same fields as taxpayer', 'CONDITIONAL — MFJ only', 'Mirror of taxpayer; on MFJ, separate Form 4137 created. Spouse form disabled in UI when not MFJ.', 'form-tip-income-spouse.xlsx (mirrors taxpayer)'],
  // Sources outside the tip-income forms
  [15, 'form-w-2.xlsx (Statements → W-2)', 'allocatedTipsW2Box8 (Box 8)', 'W-2 Box 8 — Allocated tips', 'CONDITIONAL — auto-fill source', 'When tipsByEmployer[] is empty, buildTipEntriesFromW2() creates synthetic entries from W-2s with matching SSN and box 8 > 0', 'form-w-2.xlsx (Box 8)'],
  [16, 'form-w-2.xlsx', 'socialSecurityWagesAmount (Box 3)', 'W-2 Box 3 — Social Security wages', 'PRIMARY — Form 4137 line 8', 'sumW2SocialSecurityWagesAndTipsForSsn aggregates box 3 + box 7 for matching employee SSN', 'form-w-2.xlsx (Box 3)'],
  [17, 'form-w-2.xlsx', 'socialSecurityTipsAmount (Box 7)', 'W-2 Box 7 — Social Security tips', 'PRIMARY — Form 4137 line 8', 'Same as above — combines with box 3', 'form-w-2.xlsx (Box 7)'],
  [18, 'form-w-2.xlsx', 'employeeSSN (Box a)', 'W-2 Box a — Employee SSN', 'YES — for SSN-matching', 'Used to filter W-2 entries for taxpayer vs spouse SS-wage aggregation', 'form-w-2.xlsx (Box a)'],
  [19, 'form-filing-status.xlsx', 'filingStatus', 'Filing status', 'GATE — used by UI to disable spouse form on non-MFJ', 'Backend computeTips does NOT currently apply an MFS guard — see Code Validation #1', 'form-filing-status.xlsx'],
  [20, 'form-identification-taxpayer.xlsx / spouse', 'ssn', 'Taxpayer / spouse SSN', 'YES — for SSN-matching', 'Drives W-2 SSN filtering for SS wage base aggregation', 'form-identification-*.xlsx'],
];
const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 60 }, { wch: 50 }, { wch: 70 }, { wch: 30 }, { wch: 70 }, { wch: 40 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data / Constants ──────────────────────────────────
const constants = [
  ['REFERENCE DATA / CONSTANTS — Line 1c + Form 4137 (Tax Year 2025)'],
  [],
  ['Constant', 'Value', 'Source', 'Used By', 'Notes for Other Tax Years'],
  ['SOCIAL_SECURITY_WAGE_BASE', '$176,100 (2025)', 'ReferenceData.SOCIAL_SECURITY_WAGE_BASE; SSA / IRS', 'Form 4137 line 7 (max SS wages)', 'Adjusted annually by SSA. 2024 = $168,600. 2026 = TBD. Update ReferenceData.java each year.'],
  ['Social Security tax rate', '6.2%', '0.062 hard-coded literal at TaxReturnComputeService.java line 11233', 'Form 4137 line 11 (SS tax = line 10 × 6.2%)', 'Stable since 1990; unlikely to change. Hard-coded is acceptable.'],
  ['Regular Medicare tax rate', '1.45%', '0.0145 hard-coded literal at TaxReturnComputeService.java line 11243', 'Form 4137 line 12 (Medicare tax = line 6 × 1.45%)', 'Stable since 1986; unlikely to change.'],
  ['Additional Medicare tax rate (0.9%)', '0.9%', 'Form 8959; not used by line 1c directly', 'Form 8959 / Schedule 2 line 11', 'Statutory 0.9% under IRC §3101(b)(2). Stable.'],
  ['Additional Medicare threshold — MFJ', '$250,000', 'IRC §3101(b)(2); ReferenceData', 'Form 8959 — receives Form 4137 line 6 contribution', 'Statutory; not indexed for inflation.'],
  ['Additional Medicare threshold — Single/HOH/QSS', '$200,000', 'IRC §3101(b)(2)', 'Form 8959', 'Statutory.'],
  ['Additional Medicare threshold — MFS', '$125,000', 'IRC §3101(b)(2)', 'Form 8959', 'Statutory.'],
  ['$20/month employer reporting threshold', '$20 (informational only)', 'IRC §6053(a); Pub 531; Form 4137 line 5 instructions', 'UI guidance only. line5Under20PerMonthTips field captures user-tracked amounts; no auto-calculation.', 'Stable since 1965.'],
  [],
  ['Note: line 1c uses NO tax-year-specific computation constants directly. The SS wage base only feeds Form 4137 (the related TAX form), not line 1c income.'],
  [],
  ['DOWNSTREAM constants (not applied by line 1c, but read by lines that consume line 1c)'],
  ['Constant', 'Value', 'Used By'],
  ['SCHEDULE_1A_TIPS_CAP', '$25,000 (2025)', 'Schedule 1-A line 38 enhanced senior + tips deduction (line 13b path). Tips income from line 1c contributes to the cap calculation.'],
  ['SCHEDULE_1A_TIPS_PHASEOUT_SINGLE', '$150,000 (MAGI floor)', 'Schedule 1-A tips phaseout (Single/HOH/QSS/MFS)'],
  ['SCHEDULE_1A_TIPS_PHASEOUT_MFJ', '$300,000 (MAGI floor)', 'Schedule 1-A tips phaseout (MFJ)'],
];
const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 42 }, { wch: 22 }, { wch: 60 }, { wch: 60 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs (Form 4137, Schedule 2 line 5, Form 8959) ─
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Forms / Schedules Produced or Modified by Line 1c Computation'],
  [],
  ['Output Field Path', 'Output Form (XLS)', 'Formula', 'Notes'],
  ['form4137Taxpayer (full Form 4137 attached when triggered)', 'form-tax-return-4137-taxpayer.xlsx', 'See Form 4137 line-by-line below', 'Created only when line4UnreportedTips > 0 AND (line6 > 0 OR totalAllocatedTips > 0). All-noncash or all-under-$20 produce NO Form 4137.'],
  ['form4137Spouse (separate form per IRS rules)', 'form-tax-return-4137-spouse.xlsx', 'Same logic, spouse-side', 'MFJ only. No MFS guard in backend currently — see Code Validation #1.'],
  ['schedule2.otherTaxes.unreportedTipIncomeTax', 'form-tax-return-schedule2.xlsx (line 5)', 'taxpayer.form4137.line13 + spouse.form4137.line13', 'Set to null if neither Form 4137 exists. Aggregated via TipComputation.totalTipTax in computeTips().'],
  ['form8959 (Additional Medicare Tax base augmentation)', 'form-tax-return-8959.xlsx (Part I)', 'totalMedicareWages += form4137Taxpayer.line6 + form4137Spouse.line6', 'Form 4137 line 6 (unreported tips subject to Medicare) feeds the 0.9% Additional Medicare Tax base alongside W-2 box 5 wages and Form 8919 line 6.'],
  [],
  ['FORM 4137 LINE-BY-LINE (per person)'],
  ['Form 4137 Line', 'IRS Field Label', 'Backend Computation', 'Output Field on Form4137'],
  ['Line 2', 'Total cash & charge tips received', 'sum(totalTipsReceived) per employer', 'setLine2TotalCashChargeTips'],
  ['Line 3', 'Total cash & charge tips reported to employer', 'sum(totalTipsReportedToEmployer)', 'setLine3ReportedTips'],
  ['Line 4', 'Total unreported tips for income (line 1c minus noncash)', 'sum(unreportedForIncome) — per allocated-tips override logic', 'setLine4UnreportedTips'],
  ['Line 5', 'Tips < $20/month (excluded from Medicare-tax base)', 'sum(line5Under20PerMonthTips)', 'setLine5UnderTwentyTips'],
  ['Line 6', 'Tips subject to Medicare tax', 'max(0, Line 4 − Line 5)', 'setLine6UnreportedTipsSubjectMedicare — also feeds Form 8959'],
  ['Line 7', 'Maximum SS wages', '$176,100 (constant)', 'setLine7MaxSocialSecurityWages'],
  ['Line 8', 'SS wages + SS tips + RRTA already paid', 'sum(W-2 box 3 + W-2 box 7) + sum(rRTAComp); fallback to form input', 'setLine8SocialSecurityWagesTipsRrta'],
  ['Line 9', 'Remaining SS wage base', 'max(0, Line 7 − Line 8)', 'setLine9RemainingSocialSecurityWageBase'],
  ['Line 10', 'Tips subject to SS tax', 'min(Line 6 − medicareOnlyGovernmentTips, Line 9)', 'setLine10UnreportedTipsSubjectSocialSecurity'],
  ['Line 11', 'SS tax', 'Line 10 × 6.2% (null when MISSING_SS_W2_DATA)', 'setLine11SocialSecurityTax'],
  ['Line 12', 'Medicare tax', 'Line 6 × 1.45% (always computed)', 'setLine12MedicareTax'],
  ['Line 13', 'Total tax on unreported tip income', 'Line 11 + Line 12', 'setLine13TotalTax — flows to Schedule 2 line 5'],
  [],
  ['CROSS-LINE INVARIANT'],
  ['line 1c = Σ unreportedForIncome (per employer) + Σ noncashTipsFmv'],
  ['line 1c minus Σ noncashTipsFmv == Form 4137 line 4 (when Form 4137 created)'],
  ['(Form 4137 line 4 is the cash/charge portion of line 1c — noncash never enters the Form 4137 tax computation)'],
];
const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 50 }, { wch: 90 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation / Blocking Flags ─────────────────────────────────
const flags = [
  ['VALIDATION RULES — Blocking Flags Emitted by Line 1c Pass'],
  [],
  ['Flag Code', 'Trigger Condition', 'Effect', 'Suppressed When', 'Emitter'],
  ['MISSING_SS_W2_DATA_TAXPAYER', 'taxpayer Form 4137 line 6 > 0 (has tips subject to Medicare) AND no W-2 SS wages/tips found for taxpayer SSN AND form input fallback (socialSecurityWagesW2Box3 + socialSecurityTipsW2Box7) is also null', 'Blocking — return cannot be filed. Form 4137 line 11 (SS tax) set to null; line 12 (Medicare tax) still computed.', 'Add the taxpayer\'s W-2 (with boxes 3 + 7) OR fill in the form-level fallback fields', 'computeTipsForPerson() at TaxReturnComputeService.java line 11235'],
  ['MISSING_SS_W2_DATA_SPOUSE', 'Same condition for spouse', 'Same — blocking', 'Same — provide spouse W-2 or fallback fields', 'Same emitter, label="spouse"'],
  [],
  ['VALIDATION RULES — Per-employer / per-input behaviors (informational; NOT blocking)'],
  ['Behavior', 'Condition', 'Effect'],
  ['Negative unreported clamped to zero', 'totalTipsReceived < totalTipsReportedToEmployer', 'unreportedCashCharge = max(0, received − reported). Defends against bad data; does not flag.'],
  ['Allocated-tips override forces minimum', 'allocatedTips > 0 AND no adequate records', 'unreportedForIncome floors at allocatedTips even if user entered lower received/reported. Per IRS Pub 531: allocated tips MUST be reported.'],
  ['Adequate-records reduction', 'hasAdequateRecords=true AND substantiated < allocatedTips', 'unreportedForIncome = substantiated. Edge case (Code Validation #4): hasAdequateRecords=true but substantiated=null silently falls back to allocated — could be a data-entry error worth flagging.'],
  ['Auto-fill from W-2', 'tipsByEmployer[] is empty AND W-2 entries exist with allocatedTipsW2Box8 > 0 + matching SSN', 'buildTipEntriesFromW2() creates synthetic entries — user does not need to manually duplicate W-2 data.'],
  ['Form 4137 NOT created when only noncash', 'totalUnreportedTipsForIncome > 0 from noncash only AND line6 = 0 AND allocatedTips = 0', 'Line 1c shows the noncash income, but no Form 4137 (no FICA tax on noncash).'],
  ['Form 4137 NOT created when all under-$20', 'line4 > 0 AND line5 == line4 (so line 6 = 0) AND allocatedTips = 0', 'Line 1c shows the income, but no Form 4137 — no Medicare-tax base remaining.'],
  [],
  ['NON-FLAG defensive behaviors (silent skip)'],
  ['Scenario', 'Behavior', 'Why not flagged'],
  ['totalTipsReceived = null', 'unreported = 0; entry contributes nothing to line 1c (unless allocated tips > 0)', 'parseAmount tolerates null. UI form-level validation requires at least one input per employer row.'],
  ['Empty tipsByEmployer[] AND no W-2 allocated tips', 'Person contributes $0 to line 1c; no Form 4137', 'Normal — taxpayer simply has no tip income'],
  ['employerEIN missing on a row that triggers Form 4137', 'Form 4137 still created; employer table row has empty EIN', 'UI form requires EIN via requiresEmployerEin(i) but backend does not enforce — could be a future hardening (similar to line 1b Issue #2 pattern)'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 38 }, { wch: 80 }, { wch: 60 }, { wch: 60 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation — discrepancies, gaps, surprises ────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Reviewed against: TaxReturnComputeService.computeTips() (line 11111), computeTipsForPerson() (line 11127), buildIncome() line 1c wiring (line 4106, 4145), Schedule 2 line 5 wiring (line 11293), Form 8959 line 6 contribution (line 11432).'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'POTENTIAL DEFENSIVE GAP', 'computeTips() unconditionally calls computeTipsForPerson() for both taxpayer AND spouse, then aggregates: line1c = taxpayer.line1c + spouse.line1c. There is NO MFS guard. UI disables the spouse form when not MFJ, but stale spouse data on an MFS return would still aggregate.', 'TaxReturnComputeService.java line 11119-11121 vs lines/1c.md (no MFS rule documented)', 'Mirror the line 1b pattern: pass isMfs into computeTips, skip computeTipsForPerson(spouse) call when isMfs=true. Add unit test: MFS filer with stale spouse tip-income data → spouse contribution excluded from line 1c. Same MFS guard should be applied to Schedule 2 line 5 aggregation (form4137Spouse should not produce on MFS).'],
  [2, 'DEFENSIVE GAP', 'computeTipsForPerson() does NOT check hasUnreportedTips at the top. If the user answered "No" to the gate question (hasUnreportedTips=false) but has stale tipsByEmployer[] data (or W-2 allocated tips that auto-fill triggers), line 1c would still compute.', 'TaxReturnComputeService.java line 11127-11140 vs form-tip-income-taxpayer.component.ts hasUnreportedTips field', 'Add at the top of computeTipsForPerson: if (Boolean.FALSE.equals(getBoolean(tipsData, "hasUnreportedTips"))) return new TipResult(null, null, null);. UI normalizeForSave should also clear tipsByEmployer when hasUnreportedTips=false. Mirrors the line 1b Issue #2 hardening from 2026-05-05.'],
  [3, 'KNOWLEDGE FILE UNDER-COUNTED TESTS', 'knowledge/line-1c-tip-income.md says "Two unit tests" exist (computesTipIncomeAndForm4137 + computesAdditionalMedicareTaxForTipIncome). Coverage is light vs. the 12 spec scenarios. E2E covers 7 of 12 scenarios.', 'knowledge/line-1c-tip-income.md §7 + §8', 'Add backend unit tests for: (a) MFS guard once Issue #1 is fixed; (b) hasUnreportedTips=false defensive gate once #2 is fixed; (c) noncash-only path → no Form 4137; (d) all-under-$20 → no Form 4137; (e) MFJ separate Form 4137 per spouse; (f) RRTA contribution to line 8.'],
  [4, 'DATA INTEGRITY EDGE CASE', 'computeTipsForPerson handling when hasAdequateRecords=true but substantiatedUnreportedTipsIfLessThanAllocated is null. Code at line 11171-11173: `if (Boolean.TRUE.equals(hasAdequateRecords) && substantiated != null && substantiated.compareTo(allocatedTips) < 0)`. When substantiated is null, falls through to `else` branch (allocated tips override). User may have intended to claim adequate records but forgot to fill in the substantiated amount.', 'TaxReturnComputeService.java line 11167-11178', 'Option A: emit a non-blocking informational flag when hasAdequateRecords=true AND substantiated=null AND allocatedTips>0 ("You claimed adequate records but did not provide a substantiated amount; allocated tips have been used instead"). Option B: UI-side validation requires substantiated when hasAdequateRecords=true. Option B preferred — prevent at point of entry.'],
  [5, 'SS DATA SOURCING SUBTLETY', 'firstNonNull(ssWagesTipsFromW2, ssWagesTipsFromInput) at line 11219: when W-2 returns 0 (not null), the form input fallback is NOT used. A user who has a W-2 with $0 in boxes 3+7 but filled in non-zero socialSecurityWagesW2Box3/Box7 in the tip-income form would have their manual entry ignored.', 'TaxReturnComputeService.java line 11217-11219 (firstNonNull semantics)', 'Verify the actual semantics of sumW2SocialSecurityWagesAndTipsForSsn — does it return null or 0 when no matching W-2 exists vs. when matching W-2 has $0 boxes? If the latter, form input fallback is unreachable. Either: (a) document this as intended (W-2 is canonical; form fallback is legacy/disaster-recovery only) and clarify in UI help text, or (b) change to addNonNull (sum both sources) — but this would risk double-counting when a W-2 exists alongside form input.'],
  [6, 'MISSING UI ENFORCEMENT', 'requiresEmployerEin(i) on the frontend returns true when this employer would trigger Form 4137 (per row), but backend does NOT enforce that EIN is provided when Form 4137 is created. A row with positive unreported tips but missing EIN produces a Form 4137 with a blank EIN cell.', 'form-tip-income-taxpayer.component.ts requiresEmployerEin(i) vs TaxReturnComputeService.java line 11189-11194 (no EIN validation)', 'Backend hardening: when building the Form 4137 employer table, emit a non-blocking flag (or blocking — IRS requires EIN) for any row with unreported tips > 0 and missing/empty employerEIN. Mirrors the SSN/ITIN/EIN validator pattern added 2026-05-05 (TinValidator).'],
  [7, 'TEST COVERAGE GAP — E2E spec scenarios 9, 11, 12', 'E2E test file line1c-tip-income.spec.ts has 7 tests covering 7 of 12 spec scenarios. Untested: scenario 9 (MFJ separate Form 4137 per spouse), scenario 11 (W-2 box 12 codes A/B → Schedule 2 line 13), scenario 12 (RRTA cases do not use Form 4137).', 'e2e/tests/line1c-tip-income.spec.ts vs lines/1c.md §9', 'Add 3 new E2E tests. Scenarios 9 and 12 are most valuable (MFJ correctness + RRTA exclusion). Scenario 11 is line 1c-adjacent — really belongs in an uncollected-ss-medicare-spec, not a line 1c spec.'],
  [8, 'NOT IMPLEMENTED — adequate-records audit trail', 'When hasAdequateRecords=true, the user is making an IRS-defensible claim that should be substantiated. The application does not capture WHAT records the user has (notes field, document upload) or surface a guidance about required records (timesheets, daily tip logs, customer receipts).', 'Frontend tip-income form — no records-description field', 'Low priority (not a compute correctness issue). Possible enhancement: add an optional "Description of records" text field with help-text linking to Pub 531 record-keeping guidance. The IRS expects daily tip logs (Form 4070A or equivalent).'],
  [9, 'KNOWLEDGE FILE OUTDATED LINE NUMBERS', 'knowledge/line-1c-tip-income.md references line numbers in TaxReturnComputeService.java that have shifted since 2026-04-10 (file authored). The actual entry point computeTips is at line 11111 (knowledge says "called once per compute pass" without line number, but other documents do reference numbers).', 'knowledge/line-1c-tip-income.md vs current TaxReturnComputeService.java line numbers', 'Strip explicit line numbers from knowledge files where possible; rely on function-name references (which survive refactors). When a line number is needed, mark it with the verification date.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 24 }, { wch: 80 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 1c Value Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.tipIncome', 'topmostSubform[0].Page1[0].f1_49[0] (line1c_tip_income)', 'form-tax-return-1040.xlsx (line 1c cell)', 'Primary output. Stored only when non-null (omitted when no tip income). Whole-dollar rounded.'],
  ['form1040.income.line1z', '(line 1z cell on f1040)', 'form-tax-return-1040.xlsx', 'Line 1c is one of 8 components: line1z = 1a + 1b + 1c + 1d + 1e + 1f + 1g + 1h (addNonNull)'],
  ['form1040.income.totalIncome', '(line 9 cell on f1040)', 'form-tax-return-1040.xlsx', 'Line 1c reaches line 9 via line 1z'],
  ['form1040.adjustedGrossIncome', '(line 11 cell on f1040)', 'form-tax-return-1040.xlsx', 'AGI = line 9 − line 10'],
  ['schedule2.otherTaxes.unreportedTipIncomeTax', '(line 5 cell on f1040s2)', 'form-tax-return-schedule2.xlsx', 'Form 4137 line 13 (taxpayer + spouse) — SEPARATE from line 1c. Tax on the same tip income.'],
  ['form4137 attachment (per person)', '(full Form 4137)', 'form-tax-return-4137-{taxpayer,spouse}.xlsx', 'PDF export uses f4137_semantic_labels.pdf with f4137_field_map_semantic.csv'],
  ['form8959.partI (Additional Medicare Tax base)', '(Form 8959 Part I cells)', 'form-tax-return-8959.xlsx', 'form4137.line6 contributes to totalMedicareWages (alongside W-2 box 5 and Form 8919 line 6) for the 0.9% Additional Medicare Tax threshold check'],
  [],
  ['DOWNSTREAM USE (read by other computations)'],
  ['Consumer', 'How it uses line 1c', 'Notes'],
  ['Pub 915 Social Security Worksheet 1 line 3', 'Includes line 1c via "Form 1040 line 1z" reference', 'computeSocialSecurityBenefits sums through line 1z (which includes line 1c). Same MFS guard concern applies as for line 1b.'],
  ['Form 2441 (dependent care) earned income', 'Includes line 1c via the totalWages aggregate after carve-outs', 'computeDependentCareBenefits — earned income excludes inmate wages but does include unreported tip income (it IS earned income per §21)'],
  ['EIC earned income (line 27a)', 'Tip income IS earned income for EIC purposes', 'computeLine27aEIC adds unreported-tips-subject-medicare via Form 4137 line 6 contribution to combat-pay election logic. Verify in EIC audit.'],
  ['Schedule 8812 / ACTC earned income', 'Tip income contributes to line 1z → drives the $2,500 floor for ACTC', 'Standard wage aggregation path'],
  ['Schedule 1-A line 38 (enhanced senior + tips deduction)', 'Tips income from line 1c contributes to the Schedule 1-A tips sub-deduction (capped at $25,000 in 2025)', 'See line 13b spec for full Schedule 1-A logic'],
  [],
  ['NEGATIVE / NULL CONTRACT'],
  ['line 1c value', 'Meaning'],
  ['null (field absent)', 'No tip income reported — taxpayer + spouse contributed nothing (typical case for non-tipped workers)'],
  ['BigDecimal.ZERO', 'Edge case — extremely rare. Could happen if all employer entries had received=reported and noncash=0, and allocated tips reduced via adequate records to 0.'],
  ['Positive BigDecimal', 'Standard case — at least one employer with unreported cash/charge OR allocated OR noncash tips'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 50 }, { wch: 60 }, { wch: 50 }, { wch: 80 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUT);
console.log('Wrote: ' + OUT);
