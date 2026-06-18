// Generate C:\us-tax\XLS\computations\1b.xlsx — full computation map for Form 1040 Line 1b.
const XLSX = require('xlsx');

const OUT = String.raw`C:\us-tax\XLS\computations\1b.xlsx`;

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['Form 1040 Line 1b — Household Employee Wages Not Reported on Form(s) W-2'],
  [],
  ['UI label on Form 1040', 'Household employee wages not reported on Form(s) W-2'],
  ['Semantic field name', 'line1b_household_employee_wages'],
  ['Output field path (computed)', 'form1040.income.householdEmployeeWages'],
  ['Output PDF field (f1040)', 'topmostSubform[0].Page1[0].f1_48[0]'],
  ['Tax year', '2025'],
  ['Authoritative source', '2025 Instructions for Form 1040 / 1040-SR — line 1b. Schedule H Instructions (2025) for the employee-vs-self-employed control test.'],
  [],
  ['PLAIN-ENGLISH FORMULA'],
  ['Line 1b = sum of household-employee wages received by taxpayer (and spouse on MFJ),'],
  ['          where (a) the worker is a household employee (passes the IRS control test, NOT self-employed),'],
  ['                (b) NO Form W-2 was received for those wages, AND'],
  ['                (c) the employer did NOT treat the worker as a contractor (those wages route to Form 8919 → line 1g instead).'],
  ['IMPORTANT: the $2,800 (2025) figure is the EMPLOYER\'s W-2 obligation trigger, NOT a taxpayer eligibility threshold.'],
  ['          Wages below $2,800 still belong on line 1b — it is a reporting location, not a threshold gate.'],
  [],
  ['STEP-BY-STEP COMPUTATION (per person — taxpayer and, on MFJ only, spouse)'],
  ['Step', 'Operation', 'Formula', 'Notes'],
  [1, 'Outer gate: household work answered Yes', 'if employmentForm.householdWork ≠ true → return null (no contribution to line 1b)', 'UI also gates on hasEmploymentIncome=true upstream; backend itself does NOT re-check that flag (see Code Validation #2)'],
  [2, 'Control-test gate: worker is employee (not self-employed)', 'if employmentForm.householdEmployeeUnderControlTest ≠ true → return null', 'When the control test is explicitly false, validateHouseholdEmployeeControlTest() ALSO emits HOUSEHOLD_WORK_SELF_EMPLOYMENT_{TAXPAYER|SPOUSE} blocking flag; wages route to Schedule C (out of scope)'],
  [3, 'W-2 gate: must be explicitly "no W-2"', 'if employmentForm.householdReceivedW2 ≠ false → return null', 'If householdReceivedW2 is null OR true → exclude from line 1b. true → wages belong on line 1a via the W-2 statement entry.'],
  [4, 'Per-employer loop: collision guard', 'for each employer in householdEmployers[]: if employer.employerTreatedAsContractor == true → SKIP that employer', 'Collision guard with line 1g: contractor-treated wages flow through Form 8919 → line 1g. Skipping prevents double-count between line 1b and line 1g.'],
  [5, 'Per-employer loop: accumulate wages', 'total = Σ employer.wages (for non-contractor entries only)', 'employer.wages is BigDecimal; absent/null is treated as $0 (entry skipped from sum but loop continues)'],
  [6, 'Apply MFS guard for spouse', 'if filingStatus == "Married filing separately" → spouse contribution is forced to null', 'Each MFS filer reports only their own household wages on their own return. Spouse form is loaded but result is discarded.'],
  [7, 'Aggregate taxpayer + (non-MFS) spouse', 'householdWagesRaw = addNonNull(taxpayerAmount, spouseAmount)', 'addNonNull treats null as "skip"; either both null → result null'],
  [8, 'Round to whole dollars', 'line1b = roundMoney(householdWagesRaw)', 'WHOLE_DOLLAR mode (half-up). EXACT mode preserves cents.'],
  [9, 'Persist on Form 1040', 'income.setHouseholdEmployeeWages(line1b) only when line1b != null', 'Field is omitted from output (null) when no household wages exist'],
  [],
  ['DECISION TREE — Routing matrix (where do my wages go?)'],
  ['Worker situation', 'Answer pattern', 'Routes to', 'Notes'],
  ['Household employee, received W-2', 'householdWork=Y, controlTest=Y, receivedW2=Y', 'Line 1a (via W-2 statement entry)', 'NOT line 1b. The W-2 itself is the source of truth.'],
  ['Household employee, NO W-2 (employer below threshold or non-compliant)', 'householdWork=Y, controlTest=Y, receivedW2=N, employerTreatedAsContractor=N', 'Line 1b ← THIS COMPUTATION', 'The canonical line 1b case'],
  ['Household worker, employer issued 1099 instead of W-2', 'householdWork=Y, controlTest=Y, receivedW2=N, employerTreatedAsContractor=Y', 'Line 1g (via Form 8919)', 'Per-employer skip in step 4 above'],
  ['Independent domestic-services business (self-employed)', 'householdWork=Y, controlTest=N', 'Schedule C (OUT OF SCOPE — blocking flag)', 'HOUSEHOLD_WORK_SELF_EMPLOYMENT_* fires; return cannot be filed'],
  ['Not household work', 'householdWork=N', 'Wages flow via line 1a (W-2 path)', 'Line 1b returns null'],
  ['User hasn\'t answered', 'householdWork=null OR receivedW2=null OR controlTest=null', 'Line 1b returns null', 'Defensive — UI now requires householdWork (since 2026-05-05); other questions are conditional follow-ups'],
];
const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 6 }, { wch: 50 }, { wch: 70 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs (with cross-references to input form xlsx files) ─────
const inputs = [
  ['INPUT FIELDS — Line 1b Computation'],
  [],
  ['#', 'Source Form (XLS)', 'Field Name', 'IRS Label / UI Question', 'Required?', 'How Used in Line 1b', 'Reference'],
  [1, 'form-employment-taxpayer.xlsx (Personal → Employment income — Taxpayer)', 'hasEmploymentIncome', 'Did you receive any wages (including household employee wages) during the tax year?', 'YES — UI gate (not enforced inside householdEmployeeAmount; see Code Validation #2)', 'Determines whether the household-work questions are surfaced in the UI', 'form-employment-taxpayer.xlsx row 1'],
  [2, 'form-employment-taxpayer.xlsx', 'householdWork', 'Did you receive pay for household work (babysitter, nanny, caregiver/health aide, housekeeper, yard worker, etc.)?', 'YES — primary gate', 'Step 1 gate. If not exactly true → null (no line 1b contribution)', 'form-employment-taxpayer.xlsx row 3'],
  [3, 'form-employment-taxpayer.xlsx', 'householdEmployeeUnderControlTest', 'Did the person paying you control what you did and how you did it?', 'CONDITIONAL — required when householdWork=true', 'Step 2 gate. If not exactly true → null AND emits HOUSEHOLD_WORK_SELF_EMPLOYMENT_TAXPAYER blocking flag (Schedule C path is out of scope)', 'form-employment-taxpayer.xlsx row 5'],
  [4, 'form-employment-taxpayer.xlsx', 'householdReceivedW2', 'Did you receive a Form W-2 for this household work?', 'CONDITIONAL — required when controlTest=true', 'Step 3 gate. Must be explicitly false. If true → wages belong on line 1a. If null → no line 1b contribution.', 'form-employment-taxpayer.xlsx row 7'],
  [5, 'form-employment-taxpayer.xlsx (per-employer entry inside householdEmployers[])', 'employerName', 'Employer name (optional)', 'OPTIONAL', 'Display only — not used in computation. Lets the user keep records.', 'form-employment-taxpayer.xlsx row 9'],
  [6, 'form-employment-taxpayer.xlsx (per-employer entry)', 'wages', 'Wages', 'YES — per employer', 'Step 5: summed (after collision-guard skip in step 4) into the per-person amount', 'form-employment-taxpayer.xlsx row 10'],
  [7, 'form-employment-taxpayer.xlsx (per-employer entry)', 'employerTreatedAsContractor', 'Did this employer pay you as a contractor — for example, by issuing a 1099 instead of a W-2?', 'CONDITIONAL — per employer', 'Step 4 collision guard. If true → skip this employer (wages route to Form 8919 / line 1g). If false/null → include.', 'form-employment-taxpayer.xlsx row 11'],
  [8, 'form-employment-spouse.xlsx (Personal → Employment income — Spouse)', 'hasEmploymentIncome / householdWork / householdEmployeeUnderControlTest / householdReceivedW2 / householdEmployers[]', 'Same questions for spouse', 'CONDITIONAL — MFJ only', 'Same logic as taxpayer. Result excluded on MFS returns (step 6).', 'form-employment-spouse.xlsx (mirrors taxpayer rows)'],
  [9, 'form-filing-status.xlsx (Personal → Filing status)', 'filingStatus', 'Filing status (S/MFJ/MFS/HOH/QSS)', 'GATE — used for MFS guard', 'Step 6: when "Married filing separately" → spouse contribution is forced to null', 'form-filing-status.xlsx (search "filingStatus")'],
  [],
  ['NOTE — UI conditional rendering'],
  ['The household questions (householdWork → controlTest → receivedW2 → employer list) are progressive disclosure: each is shown only when the previous answers permit.'],
  ['  • householdEmployeeUnderControlTest is shown only when householdWork = true'],
  ['  • householdReceivedW2 is shown only when controlTest = true'],
  ['  • householdEmployers[] (the employer/wages list) is shown only when householdReceivedW2 = false'],
  ['As of 2026-05-05 the UI marks householdWork as REQUIRED when hasEmploymentIncome=true (Save button disabled until answered).'],
];
const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 60 }, { wch: 40 }, { wch: 70 }, { wch: 26 }, { wch: 65 }, { wch: 32 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data / Constants ──────────────────────────────────
const constants = [
  ['REFERENCE DATA / CONSTANTS — Line 1b (Tax Year 2025)'],
  [],
  ['Constant', 'Value', 'Source', 'Used By', 'Notes for Other Tax Years'],
  ['HOUSE_HOLD_EMPLOYEE_THRESHOLD', '$2,800 (2025)', 'ReferenceData.HOUSE_HOLD_EMPLOYEE_THRESHOLD; 2025 Form 1040 Instructions line 1b', 'UI hint ONLY — displayed in the householdReceivedW2 question to explain why a W-2 may not exist below this threshold', '2024 = $2,700. Adjusted annually by the IRS. Update ReferenceData.java each tax year.'],
  [],
  ['CRITICAL CLARIFICATION — the threshold is NOT an eligibility gate'],
  ['Misconception', 'Truth'],
  ['"Wages below $2,800 are reported on line 1b"', 'WRONG. Threshold has nothing to do with eligibility.'],
  ['"Wages at or above $2,800 must come from a W-2"', 'PARTIAL. Above $2,800, the EMPLOYER is required to issue a W-2; if they did not, the worker still reports the wages on line 1b and is offered "Missing W-2" guidance.'],
  ['"Line 1b only applies if no W-2 was received"', 'CORRECT. Regardless of amount: household-employee wages with no W-2 belong on line 1b.'],
  [],
  ['Line 1b itself uses NO tax-year-specific computation constants — it is a pure aggregation. The threshold is informational (UI hint only).'],
];
const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 38 }, { wch: 18 }, { wch: 60 }, { wch: 70 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-effect outputs / Cross-line interactions ───────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS / CROSS-LINE INTERACTIONS — Line 1b'],
  [],
  ['Line 1b is a leaf computation — it produces no Schedule 1 carve-outs. But it INTERACTS with adjacent lines via gates and collision guards.'],
  [],
  ['Interaction', 'Direction', 'Mechanism', 'Notes'],
  ['Line 1a missing-W-2 flag suppression', 'line 1b → line 1a', 'When householdWork = true on the employment form, validateEmploymentIncomeW2ForPerson() suppresses MISSING_W2_EMPLOYMENT_INCOME_{TAXPAYER|SPOUSE}', 'Tells the line-1a validator: "This person\'s wages route via line 1b, not via a W-2. Don\'t demand a W-2."'],
  ['Line 1g (Form 8919) collision guard', 'line 1b → line 1g', 'Per-employer employerTreatedAsContractor = true skips that employer in line 1b loop; the same wages flow to Form 8919 line 6 → line 1g', 'Prevents the same wages being counted twice (once on 1b, once on 1g)'],
  ['Schedule C out-of-scope routing', 'line 1b → Schedule C', 'When householdEmployeeUnderControlTest = false, blocking flag HOUSEHOLD_WORK_SELF_EMPLOYMENT_* fires; wages excluded from line 1b', 'Schedule C is out of scope — flag prevents the return from being filed until the user reclassifies'],
  ['Form 1040 line 1z aggregation', 'line 1b → line 1z', 'line1z = line1a + line1b + line1c + line1d + line1e + line1f + line1g + line1h (addNonNull)', 'Line 1b is one of 8 wage components feeding total wages'],
  ['Form 1040 line 9 (total income)', 'line 1b → line 9', 'line9 = line1z + 2b + 3b + 4b + 5b + 6b + 7a + 8 (addNonNull)', 'Line 1b reaches AGI (line 11) via line 9'],
  ['Pub 915 SS Worksheet line 3', 'line 1b → SS taxability', 'Worksheet line 3 references "Form 1040 line 1z" which includes line 1b. computeSocialSecurityBenefits adds household wages via sumHouseholdEmployeeWages().', 'Same MFS guard applies inside the SS worksheet helper'],
];
const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 50 }, { wch: 22 }, { wch: 100 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Cross-Line Interactions');

// ─── Sheet 5: Blocking Flags / Validation ─────────────────────────────────
const flags = [
  ['VALIDATION RULES — Blocking Flags Emitted by Line 1b Pass'],
  [],
  ['Flag Code', 'Trigger Condition', 'Effect', 'Suppressed When', 'Emitter'],
  ['HOUSEHOLD_WORK_SELF_EMPLOYMENT_TAXPAYER', 'employment-income-taxpayer.hasEmploymentIncome = true AND householdWork = true AND householdEmployeeUnderControlTest = false', 'Blocking — return cannot be filed. Worker classifies as self-employed; Schedule C out of scope.', 'Never (out of scope). User must change controlTest answer or remove the household work claim.', 'validateHouseholdEmployeeControlTest() at TaxReturnComputeService.java line 2680'],
  ['HOUSEHOLD_WORK_SELF_EMPLOYMENT_SPOUSE', 'Same condition for spouse on a return that loaded employment-income-spouse', 'Blocking', 'Same', 'Same emitter, label="spouse"'],
  [],
  ['VALIDATION RULES — Per-input Range Checks (informational; not enforced as blocking)'],
  ['Rule', 'Condition', 'Notes'],
  ['Each employer.wages must be ≥ 0', '0 ≤ employer.wages', 'parseAmount returns null for negatives in some paths; UI prevents negative entry via inputNumber control'],
  ['No upper bound on individual employer wages', '— (above $2,800 just means the employer was non-compliant in not issuing a W-2)', 'See "Missing W-2" guidance in line 1b spec §10'],
  [],
  ['NON-FLAG defensive behaviors (silent skip)'],
  ['Scenario', 'Behavior', 'Why not flagged'],
  ['householdWork = null (user hasn\'t answered)', 'Returns null; person contributes $0 to line 1b', 'UI now requires this question to be answered (since 2026-05-05). Backend tolerates null for legacy data.'],
  ['householdEmployeeUnderControlTest = null', 'Returns null; no flag', 'User in mid-flow. UI presents the question only after householdWork=true.'],
  ['householdReceivedW2 = null', 'Returns null; no flag', 'User in mid-flow.'],
  ['householdEmployers[] is empty when receivedW2=false', 'Returns null (no wages to sum)', 'UI shows the empty-state with an "Add employer" button. User has not yet entered any data.'],
  ['employer.wages = null in an entry', 'That entry contributes $0; loop continues', 'parseAmount tolerates null. UI form-level validator marks the row invalid via isEmployerRowValid() in form-employment-taxpayer.component.ts.'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 42 }, { wch: 75 }, { wch: 50 }, { wch: 60 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation — discrepancies & gaps ──────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Reviewed against: TaxReturnComputeService.householdEmployeeAmount() (line 10978), sumHouseholdEmployeeWages() (line 10966), validateHouseholdEmployeeControlTest() (line 2680), buildIncome() line 1b wiring (line 3993, 4105, 4143).'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'KNOWLEDGE FILE OUTDATED', 'knowledge/line-1b-household-wages.md Issue 1 declares the Form 8919 collision guard as "specified but NOT implemented (CRITICAL)".', 'knowledge/line-1b-household-wages.md (lines 112-130) vs TaxReturnComputeService.java line 11000-11006', 'Knowledge file was authored 2026-04-07 before the guard was implemented. The guard NOW EXISTS via per-employer employerTreatedAsContractor flag — when true, that employer is skipped (continue;) so wages route to Form 8919 → line 1g instead. Update the knowledge file to mark Issue 1 RESOLVED.'],
  [2, 'DEFENSIVE GAP', 'householdEmployeeAmount() does NOT check hasEmploymentIncome before computing. A direct API submission with hasEmploymentIncome=false but householdWork=true would still produce a line 1b amount.', 'TaxReturnComputeService.java line 10978-11011', 'In practice the UI clears householdWork to null when hasEmploymentIncome ≠ true (form-employment-taxpayer normalizeForSave). Defensive backend check would prevent malformed API payloads from producing inconsistent line 1b. Add: if !Boolean.TRUE.equals(getBoolean(data, "hasEmploymentIncome")) → return null at the top of householdEmployeeAmount().'],
  [3, 'KNOWLEDGE FILE OUTDATED', 'knowledge/line-1b-household-wages.md Issue 4 claims MFS aggregation is NOT guarded.', 'knowledge/line-1b-household-wages.md (lines 142-145) vs TaxReturnComputeService.java line 10972', 'Code DOES guard now: sumHouseholdEmployeeWages(taxpayer, spouse, isMfs) skips spouse when isMfs=true. Update the knowledge file to mark Issue 4 RESOLVED.'],
  [4, 'TEST COVERAGE GAP', 'Backend has only one dedicated unit test for line 1b (computesLine1bFromHouseholdEmployerList around line 3560). No tests for: (a) controlTest=false → null, (b) receivedW2=true → null, (c) MFJ spouse aggregation, (d) per-employer collision guard via employerTreatedAsContractor=true skip, (e) MFS guard.', 'TaxReturnComputeServiceTest.java', 'Add 5 unit tests covering each branch. The E2E spec line1b-household.spec.ts covers the happy path, control-test failure, threshold message, and W-2-received gate, but has no Form 8919 collision test.'],
  [5, 'KNOWLEDGE FILE OUTDATED', 'knowledge file claims spec/code gap on the missing-W-2 → line 1b handoff.', 'knowledge/line-1b-household-wages.md', 'The handoff IS implemented: validateEmploymentIncomeW2ForPerson() suppresses MISSING_W2_EMPLOYMENT_INCOME_* when householdWork=true. dependencies/1b.md cross-line consistency section documents this correctly. Knowledge file should be refreshed.'],
  [6, 'MISSING TEST', 'No unit test confirms that employerTreatedAsContractor=true on a single employer correctly excludes ONLY that employer\'s wages while still summing other employers in the same list.', 'TaxReturnComputeServiceTest', 'Add: 3 employers (A=$300 contractor, B=$400 normal, C=$500 normal) → expect line 1b = $900 (A excluded).'],
  [7, 'POTENTIAL MISSING UI VALIDATION', 'When householdEmployers[] has rows with null wages, isEmployerRowValid() in the frontend allows save if the entire row is empty (employerName + wages both blank). But a non-empty employerName with null wages can also pass isEmployerRowValid because isEmployerRowEmpty() requires BOTH fields empty.', 'form-employment-taxpayer.component.ts isEmployerRowValid (line 858)', 'Verify: row with employer name "Smith" and wages = null. Current code returns false ONLY when isAmountPresent(wages) is false AND row is non-empty. Confirm the form\'s submit-time validation surfaces an error in this case (looks like it does via the existing employmentForm.submitted check). Tighten if needed.'],
  [8, 'DOCS — RESOLVED', 'lines/1b.md is currently marked "Verified" but the spec\'s outer-gate description does NOT mention that hasEmploymentIncome is enforced ONLY at the UI layer (not at the backend householdEmployeeAmount level).', 'lines/1b.md §6 vs code', 'Spec is technically accurate at line 99-106 ("These are UI-flow gates, not IRS eligibility rules"). Cross-reference Issue #2 here — backend defensive check would harden this contract.'],
  [9, 'NOT IMPLEMENTED', 'Federal-withholding "strong signal" mentioned in lines/1b.md §10 — when household-employee wages had federal income tax withheld, the employer is required to file W-2 even below the threshold, and the user should be more strongly warned to chase the missing W-2.', 'lines/1b.md §10 vs UI behavior', 'No UI question currently asks whether federal tax was withheld from the household wages. Adding a "Was federal tax withheld?" boolean and surfacing a strengthened "Missing W-2" warning when true would close this gap. Low priority — does not affect computation correctness.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 22 }, { wch: 75 }, { wch: 60 }, { wch: 80 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output mapping (where line 1b value goes) ────────────────────
const output = [
  ['OUTPUT — Where Line 1b Value Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.householdEmployeeWages', 'topmostSubform[0].Page1[0].f1_48[0] (line1b_household_employee_wages)', 'form-tax-return-1040.xlsx (line 1b cell)', 'Primary output. Stored only when non-null (omitted when no household wages). Whole-dollar rounded.'],
  ['form1040.income.line1z', '(line 1z cell on f1040)', 'form-tax-return-1040.xlsx', 'Line 1b is one of 8 components: line1z = 1a + 1b + 1c + 1d + 1e + 1f + 1g + 1h (addNonNull)'],
  ['form1040.income.totalIncome', '(line 9 cell on f1040)', 'form-tax-return-1040.xlsx', 'Line 1b reaches line 9 via line 1z'],
  ['form1040.adjustedGrossIncome', '(line 11 cell on f1040)', 'form-tax-return-1040.xlsx', 'AGI = line 9 − line 10'],
  [],
  ['DOWNSTREAM USE (read by other computations)'],
  ['Consumer', 'How it uses line 1b', 'Notes'],
  ['Pub 915 Social Security Worksheet 1 line 3', 'Includes line 1b via "Form 1040 line 1z" reference', 'computeSocialSecurityBenefits computes its own line1z including householdWagesRaw (with same MFS guard)'],
  ['Form 2441 (dependent care) earned income', 'Includes line 1b via the totalWages aggregate after carve-outs', 'computeDependentCareBenefits sums via sumW2WagesAfterCarveOuts (W-2 portion) and per-person inmate-wage subtractions; household wages aggregate via sumHouseholdEmployeeWages with MFS guard'],
  ['EIC earned income (line 27a)', 'Line 1b is wage income → counts toward EIC earned income (when positive)', 'Per-person SSN-filtered helpers do not currently include household wages; this is a documented gap. Validate in EIC audit if needed.'],
  ['Schedule 8812 / ACTC earned income', 'Line 1z drives the $2,500 floor calculation for ACTC', 'Line 1b reaches Schedule 8812 via line 1z → totalWages'],
  [],
  ['NEGATIVE / NULL CONTRACT'],
  ['line 1b value', 'Meaning'],
  ['null (field absent)', 'No household wages reported (any of: householdWork ≠ true, controlTest ≠ true, receivedW2 ≠ false, no employers, all employers contractor-treated, MFS spouse-only)'],
  ['BigDecimal.ZERO', 'Not normally produced by line 1b path. Could happen if all employer wages are zero — vanishingly rare; treat same as null downstream.'],
  ['Positive BigDecimal', 'Standard case — at least one non-contractor employer with positive wages'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 50 }, { wch: 60 }, { wch: 50 }, { wch: 80 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUT);
console.log('Wrote: ' + OUT);
