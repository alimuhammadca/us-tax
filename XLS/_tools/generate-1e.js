// Generate C:\us-tax\XLS\computations\1e.xlsx — full computation map for Form 1040 Line 1e.
const XLSX = require('xlsx');

const OUT = String.raw`C:\us-tax\XLS\computations\1e.xlsx`;

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['Form 1040 Line 1e — Taxable Dependent Care Benefits (Form 2441 Line 26)'],
  [],
  ['UI label on Form 1040', 'Taxable dependent care benefits from Form 2441, line 26'],
  ['Semantic field name', 'line1e_taxable_dependent_care_benefits'],
  ['Output field path (computed)', 'form1040.income.dependentCareBenefits'],
  ['Output PDF field (f1040)', 'topmostSubform[0].Page1[0].f1_51[0]'],
  ['Tax year', '2025'],
  ['Authoritative sources', '2025 Instructions for Form 1040 line 1e; Form 2441 (2025) Parts II + III; IRC §21 (dependent care credit); IRC §129 (employer-provided dependent care assistance); Pub 503 (Child and Dependent Care Expenses)'],
  [],
  ['PLAIN-ENGLISH FORMULA'],
  ['Line 1e = Form 2441 line 26 (taxable portion of employer-provided dependent care benefits).'],
  ['Form 2441 Part III determines how much of the W-2 box 10 benefits MUST be added back to wages because they exceed the statutory cap, the qualified-expense limit, the earned-income limit, or the plan-defined limit. Line 26 is the residual that fails one of those tests.'],
  [],
  ['         Two-pass architecture:'],
  ['         • Phase 1 (computeDependentCareBenefits) — runs in prepare(), BEFORE AGI is known. Sets line 1e via Form 2441 Part III and seeds Part II lines 3-6.'],
  ['         • Phase 2 (finalizeForm2441PartII) — runs AFTER buildForm1040 produces AGI + totalTaxBeforeCredits. Computes Part II lines 7-11 (applicable %, credit, tax-liability limit). Wires line 11 → Schedule 3 line 2.'],
  [],
  ['STEP-BY-STEP COMPUTATION (Form 2441 Part III — Employee-Only Path)'],
  ['Step', 'Operation', 'Formula', 'Notes'],
  [1, 'Outer gate (W-2 box 10 vs form data)', 'totalBenefits = Σ W-2 box 10 (dependentCareBenefitsAmount)\\nhasBenefits = totalBenefits > 0\\nhasChildcareData = any of 5 sub-maps non-empty', 'When hasBenefits AND user has not answered "Did you receive DCB?" = Yes → emit DEPENDENT_CARE_BENEFITS_FORM_REQUIRED (blocking)'],
  [2, 'Form 2441 instantiation', 'if (hasBenefits OR hasChildcareData) → form2441 = new Form2441()', 'Otherwise no Form 2441 generated; line 1e = null'],
  [3, 'Care providers (≤3 entries) + Qualifying persons (≤3 entries) populated from form rows', 'Loop with break at 3 (rest captured by moreThanThree boolean)', 'Display only — drives Part I Care Providers section + Part II/III qualified-expense pool'],
  [4, 'Line 12: total benefits − amounts already in W-2 Box 1', 'line12 = max(0, totalBenefits − alreadyInBox1Amount)', 'alreadyInBox1Amount = portion of box 10 that the employer also reported on box 1 (already wages); avoids double-count'],
  [5, 'Line 13: prior-year grace-period benefits used in current year', 'line13 = user input (line13GracePeriodBenefitsUsed)', 'DCFSA grace-period rules: unused 2024 benefits used in early 2025'],
  [6, 'Line 14: forfeited or carried over to next year', 'line14 = user input (line14ForfeitedOrCarriedForward)', 'Subtracts from total available benefits'],
  [7, 'Line 15: total benefits available', 'line15 = max(0, line12 + line13 − line14)', 'Floored at 0'],
  [8, 'Line 16: qualified care expenses incurred this year', 'line16Input = user input (line16QualifiedExpensesForBenefits)\\nline30 = Σ qualifyingPersons[].qualifiedExpensesForPerson\\nline16 = line16Input ?? line30', 'Falls back to per-person sum when user did not provide an aggregate'],
  [9, 'Line 17: smaller of line 15 or line 16', 'line17 = min(line15, line16)', 'Caps benefits at qualified expenses'],
  [10, 'Lines 18-19: earned income limit', 'line18 = taxpayerEarned (W-2 wages for taxpayer SSN, minus inmate wages, plus additionalEarnedIncomeTaxpayer; max with deemedTaxpayer if student/disabled)\\nline19 = MFJ ? spouseEarned (similar) : line18', 'Pub 503 earned-income carve-outs: inmate wages, NQDC. Deemed income = $250/mo (1 person) or $500/mo (2+) if student/disabled.'],
  [11, 'Line 20: smallest of 17, 18, 19', 'line20 = min(line17, line18, line19)', 'Earned-income limit on excludable benefits'],
  [12, 'Line 21: plan limit vs statutory cap', 'statutoryCap = MFS-no-exception ? $2,500 : $5,000\\nline21 = planMaxExcludable ? min(statutoryCap, planMax) : statutoryCap', 'MFS exception (Box A): treated as unmarried → $5,000 cap. Otherwise MFS = $2,500.'],
  [13, 'Line 22 (employee-only): no sole proprietorship benefits', 'line22 = 0 (hard-coded; sole prop / partnership out of scope)', 'PDF check c2_1[0] = "No" hard-coded'],
  [14, 'Line 23: line 15 − line 22', 'line23 = line15 (since line22 = 0)', 'Total benefits not from sole proprietorship'],
  [15, 'Line 25: excluded benefits — IRC §129(d) bypass', 'if employerPlanFailed129dTest = true → line25 = 0\\nelse → line25 = min(line20, line21)', '§129(d) nondiscrimination failure: highly compensated employee benefits NOT excludable; full amount taxable.'],
  [16, 'Line 26: TAXABLE benefits — flows to Form 1040 line 1e', 'if §129(d) failed → line26 = line15 (full amount taxable)\\nelse → line26 = max(0, line15 − line25)', '★ This is line 1e. Stored as form1040.income.dependentCareBenefits.'],
  [17, 'Lines 24, 27, 28, 29, 31 (Part III completion)', 'line24 = 0 (deductible benefits, sole-prop only — out of scope)\\nline28 = line24 + line25\\nline27 = $6,000 (≥2 qualifying persons) or $3,000 (1)\\nline29 = max(0, line27 − line28)\\nline31 = min(line29, line30)', 'line31 → Part II line 3 (qualified expenses limited)'],
  [18, 'Round + persist line 1e', 'line1e = roundMoney(line26)\\nincome.setDependentCareBenefits(line1e) only when non-null', 'Whole-dollar rounding (HALF_UP). Field omitted from Form 1040 when null.'],
  [],
  ['STEP-BY-STEP COMPUTATION (Form 2441 Part II — Credit, Phase 2 after AGI)'],
  ['Step', 'Operation', 'Formula', 'Notes'],
  ['P2-1', 'Wait for AGI', 'agi = form1040.adjustments.line11bAmountFromLine11aAdjustedGrossIncome\\nif agi == null → return (skip Phase 2)', 'Phase 2 invoked only after buildForm1040 + computeLine12-15 + computeLine16-18 complete'],
  ['P2-2', 'Line 6: smallest of 3, 4, 5', 'line3 = hasBenefits ? line31 : min(line30, line27)\\nline4 = line18, line5 = MFJ ? line19 : line4\\nline6 = min(line3, line4, line5)', 'Already computed in Phase 1 (line6 stored on form2441)'],
  ['P2-3', 'Line 7: AGI', 'line7 = agi', 'Pulled from line 11b after Phase 2 has it'],
  ['P2-4', 'Line 8: applicable percentage', '35% if AGI ≤ $15,000\\nReduce by 1% per $2,000 (rounded up) over $15,000\\nFloor 20%', 'IRC §21(a)(2) sliding scale'],
  ['P2-5', 'Line 9a: tentative credit', 'line9a = line6 × line8', 'Pre-prior-year credit'],
  ['P2-6', 'Line 9b: prior-year qualified expenses paid this year', 'line9b = creditComputation.priorYearQualifiedExpensesPaidThisYear (Worksheet A — partial)', 'Worksheet A line 9b not fully implemented (deferred)'],
  ['P2-7', 'Line 9c: total before tax-liability limit', 'line9c = line9a + line9b', null],
  ['P2-8', 'Line 10: tax-liability limit (Credit Limit Worksheet)', 'line10 = totalTaxBeforeCredits − Σ prior Schedule 3 nonrefundable credits (excluding 5695)', 'Excludes child-dependent-care-credit itself (being computed). Order matters: this credit must be wired AFTER FTC + Form 8880 etc.'],
  ['P2-9', 'Line 11: actual credit', 'line11 = min(line9c, line10)', null],
  ['P2-10', 'Wire to Schedule 3 line 2', 'schedule3.nonrefundableCredits.childDependentCareCredit = line11', 'applyChildDependentCareCredit() called after finalizeForm2441PartII'],
  [],
  ['DECISION TREE — when does an entry contribute to line 1e?'],
  ['Branch', 'Filing status', 'W-2 box 10 totalBenefits', 'Statutory cap', 'Result'],
  ['No box 10 + no childcare form data', 'any', '0', 'n/a', 'line 1e = null (Form 2441 not generated)'],
  ['Box 10 present + form not completed', 'any', '> 0', 'n/a', 'BLOCKED — DEPENDENT_CARE_BENEFITS_FORM_REQUIRED flag fires'],
  ['Standard MFJ within all limits', 'MFJ', '≤ $5,000 + qualified expenses ≥ benefits', '$5,000', 'line26 = 0 → line 1e = null'],
  ['MFJ benefits exceed $5,000 cap', 'MFJ', '> $5,000', '$5,000', 'line25 = $5,000, line26 = totalBenefits − $5,000 → line 1e positive'],
  ['MFS without separation exception', 'MFS', 'any', '$2,500', 'line25 capped at $2,500; excess flows to line 1e'],
  ['MFS with separation exception (Box A)', 'MFS', 'any', '$5,000', '$5,000 cap applied, treated as unmarried for §21'],
  ['§129(d) nondiscrimination failure', 'any', 'any', 'n/a (bypass)', 'line25 = 0, line26 = line15 → entire amount taxable'],
  ['Earned income < benefits (low-earner spouse)', 'MFJ', 'any', '$5,000', 'line20 = min(...) capped by lower of two earned incomes; excess → line 1e'],
  ['Student/disabled with deemed income', 'any', 'any', 'normal', 'Deemed income substitutes for earned income (Pub 503 §250/$500/mo)'],
  ['Plan limit lower than statutory cap', 'any', 'any', 'min(planMax, statutory)', 'line21 = lesser of plan or statutory'],
];
const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 6 }, { wch: 50 }, { wch: 95 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUT FIELDS — Line 1e Computation'],
  [],
  ['#', 'Source Form (XLS)', 'Field Name', 'IRS Label / UI Question', 'Required?', 'How Used in Line 1e', 'Reference'],
  // generalQuestions section
  [1, 'form-childcare-expenses.xlsx (Personal → Childcare expenses) §generalQuestions', 'hasCareExpenses', 'Did you pay for the care of a child under 13, a disabled spouse, or a disabled dependent so that you could work or look for work?', 'YES — Part II eligibility gate', 'Outer gate on credit eligibility. **NOT actually read by computeDependentCareBenefits — see Code Validation #8.**', 'form-childcare-expenses.xlsx row 1'],
  [2, 'form-childcare-expenses.xlsx §generalQuestions', 'didReceiveDependentCareBenefits', 'Did you receive employer-provided dependent care benefits (W-2 Box 10 or a Dependent Care FSA)?', 'YES — primary gate when W-2 box 10 > 0', 'HARD gate. If W-2 box 10 > 0 AND not exactly true → emit DEPENDENT_CARE_BENEFITS_FORM_REQUIRED blocking flag. Mirrors line 1d hard-gate decision (no auto-fill convenience).', 'form-childcare-expenses.xlsx row 3'],
  [3, 'form-childcare-expenses.xlsx §generalQuestions', 'marriedFilingSeparatelyException', 'Do you qualify for the MFS exception (legally separated or lived apart all year and your home was the main home for a qualifying person)?', 'CONDITIONAL — MFS only', 'Step 12: when MFS AND true → statutoryCap = $5,000 (treated as unmarried for §21/§129). Otherwise on MFS → $2,500.', 'form-childcare-expenses.xlsx row 5'],
  [4, 'form-childcare-expenses.xlsx §generalQuestions', 'studentOrDisabledDeemedIncome', 'Were you a full-time student or disabled during part of 2025 with little or no earned income?', 'CONDITIONAL', 'Step 10: when true → deemedTaxpayer = $250/mo (1 person) or $500/mo (2+) × studentOrDisabledMonths. taxpayerEarned = max(actual, deemed).', 'form-childcare-expenses.xlsx row 7'],
  [5, 'form-childcare-expenses.xlsx §generalQuestions', 'studentOrDisabledMonths', 'Months you were a student or disabled (0–12)', 'CONDITIONAL — required when deemed = true', 'Step 10: clamped to [0,12]. Deemed income only counts for those months.', 'form-childcare-expenses.xlsx row 9'],
  [6, 'form-childcare-expenses.xlsx §generalQuestions', 'studentOrDisabledDeemedIncomeSpouse', 'Was your spouse a full-time student or disabled during part of 2025?', 'CONDITIONAL — MFJ only', 'Step 10: spouse-side mirror. spouseEarned = max(actual, deemed).', 'form-childcare-expenses.xlsx row 10'],
  [7, 'form-childcare-expenses.xlsx §generalQuestions', 'studentOrDisabledMonthsSpouse', 'Months spouse was a student or disabled (0–12)', 'CONDITIONAL', 'Step 10: spouse months for deemed income.', 'form-childcare-expenses.xlsx row 12'],
  // careProviders section (display + Part I, no direct line 1e impact)
  [8, 'form-childcare-expenses.xlsx §careProviders', 'providers[].providerName / providerIdentifyingNumber / providerAddress / amountPaidToProvider / providerHouseholdEmployee', 'Per-provider Part I info', 'YES — Part I display; tax-cheating flag if missing', 'Populated into Form2441CareProvider list. Up to 3 (rest captured by moreThanThreeCareProviders boolean).', 'form-childcare-expenses.xlsx rows 13-19'],
  // qualifyingPersons section
  [9, 'form-childcare-expenses.xlsx §qualifyingPersons', 'persons[].qualifyingFirstName / qualifyingLastName / qualifyingSSN / qualifyingOver12AndDisabled', 'Per-qualifying-person Part II info', 'YES — drives expense limit', 'countQualifyingPersons used by Step 12 statutory expense limit ($3k vs $6k) and Step 10 deemed-income tier ($250 vs $500/mo).', 'form-childcare-expenses.xlsx rows 21-28'],
  [10, 'form-childcare-expenses.xlsx §qualifyingPersons', 'persons[].qualifiedExpensesForPerson', 'Qualified care expenses paid for this person', 'YES — drives line 30 fallback', 'Step 8: line30 = Σ qualifiedExpensesForPerson; used as line 16 fallback when line16Input is null. Also line 30 directly drives Part II line 31.', 'form-childcare-expenses.xlsx row 24'],
  // dependentCareBenefits section (Part III specific)
  [11, 'form-childcare-expenses.xlsx §dependentCareBenefits', 'alreadyIncludedInBox1Amount', 'Amount of Box 10 benefits already included in Box 1 wages (already taxed)', 'OPTIONAL', 'Step 4: line12 = max(0, totalBenefits − alreadyInBox1Amount). Avoids double-count when employer mistakenly put DCB in both boxes.', 'form-childcare-expenses.xlsx row 30'],
  [12, 'form-childcare-expenses.xlsx §dependentCareBenefits', 'planMaxExcludable', 'Employer plan maximum excludable amount (if lower than IRS limit)', 'OPTIONAL', 'Step 12: line21 = min(statutoryCap, planMax). Lowers the cap below $5,000/$2,500 when the employer plan is more restrictive.', 'form-childcare-expenses.xlsx row 31'],
  [13, 'form-childcare-expenses.xlsx §dependentCareBenefits', 'line13GracePeriodBenefitsUsed', 'Unused 2024 benefits you used in early 2025 under a grace period', 'OPTIONAL', 'Step 5: directly populates line 13. ADDED to current-year benefits (line 12).', 'form-childcare-expenses.xlsx row 32'],
  [14, 'form-childcare-expenses.xlsx §dependentCareBenefits', 'line14ForfeitedOrCarriedForward', 'Benefits forfeited or rolled over to next plan year', 'OPTIONAL', 'Step 6: directly populates line 14. SUBTRACTED from line 12 + line 13.', 'form-childcare-expenses.xlsx row 33'],
  [15, 'form-childcare-expenses.xlsx §dependentCareBenefits', 'line16QualifiedExpensesForBenefits', 'Total qualified care expenses incurred in 2025', 'CONDITIONAL — preferred over per-person sum', 'Step 8: when provided, supersedes line 30 (per-person sum) for line 16. Used by lines 17, 30, 31.', 'form-childcare-expenses.xlsx row 34'],
  [16, 'form-childcare-expenses.xlsx §dependentCareBenefits', 'additionalEarnedIncomeTaxpayer', 'Your earned income not on your W-2 (e.g., qualifying disability pay)', 'OPTIONAL', 'Step 10: ADDED to taxpayerEarned BEFORE deemed-income max(). Pub 503 lists qualifying disability pay, certain Sched SE earnings (out of scope).', 'form-childcare-expenses.xlsx row 35'],
  [17, 'form-childcare-expenses.xlsx §dependentCareBenefits', 'additionalEarnedIncomeSpouse', 'Spouse\'s earned income not on their W-2', 'CONDITIONAL — MFJ only', 'Step 10: spouse-side analog.', 'form-childcare-expenses.xlsx row 36'],
  [18, 'form-childcare-expenses.xlsx §dependentCareBenefits', 'employerPlanFailed129dTest', 'Did your employer notify you that their dependent care plan failed nondiscrimination testing (IRC §129(d))?', 'OPTIONAL', 'Step 15: when true → §129(d) bypass: line25 = 0, line26 = line15 (full amount taxable on line 1e). Highly compensated employee scenario.', 'form-childcare-expenses.xlsx row 37'],
  // creditComputation section
  [19, 'form-childcare-expenses.xlsx §creditComputation', 'priorYearQualifiedExpensesPaidThisYear', 'Prior-year care expenses you paid in 2025 (optional)', 'OPTIONAL', 'Step P2-6: line9b — added to Phase 2 credit. Worksheet A line 9 NOT fully implemented (deferred).', 'form-childcare-expenses.xlsx row 29'],
  // Cross-form W-2 inputs
  [20, 'form-w-2.xlsx (Statements → W-2)', 'dependentCareBenefitsAmount (box 10)', 'W-2 box 10 — Dependent care benefits', 'YES — primary input', 'Step 1: Σ across all W-2s = totalBenefits. Drives the entire Form 2441 Part III pass.', 'form-w-2.xlsx (Box 10)'],
  [21, 'form-w-2.xlsx', 'wagesTipsOtherCompAmount (box 1)', 'W-2 box 1 — Wages, tips, other comp', 'YES — earned-income basis', 'Step 10: per-SSN sum drives taxpayerEarned/spouseEarned (after carve-outs).', 'form-w-2.xlsx (Box 1)'],
  [22, 'form-w-2.xlsx', 'employeeSSN', 'Employee SSN', 'YES — SSN attribution', 'Step 10: matches W-2 to taxpayer vs spouse via you.ssn / spouse.ssn comparison.', 'form-w-2.xlsx (Box a)'],
  // Filing status
  [23, 'form-filing-status.xlsx', 'filingStatus', 'Filing status', 'YES — MFJ vs MFS vs other', 'Step 10 (MFJ ⇒ line19 uses spouse) + Step 12 (MFS ⇒ $2,500 cap unless exception).', 'form-filing-status.xlsx'],
  // Identification (SSN)
  [24, 'form-identification-taxpayer.xlsx / spouse', 'ssn', 'Taxpayer / spouse SSN', 'YES — SSN attribution', 'Step 10: drives sumW2WagesForSsn() for per-spouse earned income.', 'form-identification-*.xlsx'],
  // Inmate wages (carve-out)
  [25, 'form-prison-inmate-wages-taxpayer.xlsx / spouse', 'wagesPaidToInmateAmount', 'Wages paid while an inmate', 'YES — Pub 503 carve-out', 'Step 10: subtracted from W-2 wages before computing earned income (IRS Pub 503 says inmate wages do NOT count as earned income for §21).', 'form-prison-inmate-wages-*.xlsx'],
];
const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 60 }, { wch: 50 }, { wch: 70 }, { wch: 30 }, { wch: 90 }, { wch: 40 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data / Constants ──────────────────────────────────
const constants = [
  ['REFERENCE DATA / CONSTANTS — Line 1e (Tax Year 2025)'],
  [],
  ['Constant', 'Value', 'Source', 'Used By', 'Notes for Other Tax Years'],
  ['DEPENDENT_CARE_BENEFITS_LIMIT_OTHER', '$5,000', 'IRC §129(a)(2)(A); ReferenceData.java:22', 'Step 12 (line 21 statutory cap for non-MFS or MFS with exception)', 'Indexed for inflation but cap has been $5,000 since 1986; unchanged 2025.'],
  ['DEPENDENT_CARE_BENEFITS_LIMIT_MFS', '$2,500', 'IRC §129(a)(2)(A); ReferenceData.java:21', 'Step 12 (line 21 statutory cap for MFS without exception)', 'Half of OTHER cap; unchanged 2025.'],
  ['DEPENDENT_CARE_EXPENSE_LIMIT_ONE', '$3,000', 'IRC §21(c); ReferenceData.java:23', 'Step 17 (line 27 expense ceiling for 1 qualifying person)', 'Unchanged since 2003 (CTRP); current 2025.'],
  ['DEPENDENT_CARE_EXPENSE_LIMIT_TWO_OR_MORE', '$6,000', 'IRC §21(c); ReferenceData.java:24', 'Step 17 (line 27 expense ceiling for ≥2 qualifying persons)', 'Unchanged since 2003.'],
  ['Deemed income (1 qualifying person)', '$250/month', 'IRC §21(d)(2); Pub 503; hard-coded in computeDependentCareBenefits', 'Step 10 (taxpayerEarned/spouseEarned floor when student/disabled)', 'Unchanged since 1990.'],
  ['Deemed income (≥2 qualifying persons)', '$500/month', 'IRC §21(d)(2); Pub 503; hard-coded in computeDependentCareBenefits', 'Step 10 (deemed amount per month)', 'Unchanged since 1990.'],
  ['Applicable percentage table (Phase 2 line 8)', '35% if AGI ≤ $15,000; reduced 1% per $2,000 (rounded up) over; floor 20%', 'IRC §21(a)(2); dependentCareApplicablePercentage(agi)', 'Step P2-4 (Phase 2 line 8)', 'Unchanged 2025; rate hike to 50% from ARPA 2021 expired.'],
  ['Applicable percentage AGI threshold', '$15,000', 'IRC §21(a)(2); hard-coded in dependentCareApplicablePercentage', 'Step P2-4 (35% bracket ceiling)', 'Unchanged.'],
  ['Applicable percentage AGI step', '$2,000', 'IRC §21(a)(2); hard-coded', 'Step P2-4 (1% reduction per step, rounded up)', 'Unchanged.'],
  ['Applicable percentage floor', '20%', 'IRC §21(a)(2); hard-coded', 'Step P2-4 (final percentage cannot drop below)', 'Unchanged.'],
  ['Months clamp (deemed income)', '0–12', 'Pub 503; clampMonths()', 'Step 10 (studentOrDisabledMonths bound)', 'Calendar year — fixed.'],
  [],
  ['Statutory references (IRS rules, not computational constants):'],
  ['IRS rule', 'Citation', 'Notes'],
  ['Qualifying person', 'IRC §21(b)(1); Pub 503', 'Under-13 child OR incapable spouse/dependent who lived with taxpayer >½ year. Drives countQualifyingPersons() and the $3k vs $6k limit.'],
  ['MFS exception (Box A)', 'IRC §21(e)(2); Form 2441 Part III instructions', 'Treats taxpayer as unmarried for §21/§129. Three tests: (a) lived apart last 6 months, (b) eligible child lived in home >½ year, (c) maintained the home. When all three met → marriedFilingSeparatelyException = true → $5,000 cap + credit available on MFS.'],
  ['§129(d) nondiscrimination test', 'IRC §129(d)(2)–(8); Treas. Reg. §1.125-5(c)', 'Plan must not discriminate in favor of highly compensated employees. If failed → HCE benefits NOT excludable; full amount taxable. Bypass triggered by employerPlanFailed129dTest = true.'],
  ['DCFSA grace period', 'IRS Notice 2020-29 (general DCFSA rules); cafeteria plan §125', '2½-month grace period for unused 2024 benefits used in early 2025. NOT a true carryover; "use it or lose it" otherwise.'],
  ['Earned income carve-outs', 'IRC §21(d); Pub 503', 'Excludes: pensions/annuities, social security, workers\' comp, unemployment, NQDC (W-2 box 11), inmate wages, scholarships, certain disability income.'],
  ['"DCB" write-in label', '2025 Form 1040 instructions, line 1e', 'Per IRS instructions, write "DCB" on the dotted line next to line 1e. **NOT currently rendered by UI — see Code Validation #3.**'],
  [],
  ['Note: Line 1e is heavily reference-data-driven (5 constants + percentage table). All current 2025 values match IRC limits.'],
];
const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 70 }, { wch: 60 }, { wch: 60 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Form 2441 (full) + Schedule 3 Line 2'],
  [],
  ['Output Field Path', 'Output Form (XLS)', 'Formula', 'Notes'],
  ['form2441 (full Part I + Part II + Part III object)', 'form-tax-return-2441.xlsx', 'Created when (hasBenefits OR hasChildcareData). All 31 lines populated by computeDependentCareBenefits + finalizeForm2441PartII.', 'Form 2441 itself becomes a return attachment when line 11 (credit) > 0 OR line 12-26 (benefits) populated.'],
  ['form2441.line26TaxableBenefits', 'form-tax-return-2441.xlsx (line 26 cell)', 'See Step 16', '★ This is the value piped to Form 1040 line 1e.'],
  ['form2441.line11ChildDependentCareCredit', 'form-tax-return-2441.xlsx (line 11 cell)', 'See Step P2-9 (Phase 2)', 'Wired via applyChildDependentCareCredit → schedule 3 line 2.'],
  ['schedule3.nonrefundableCredits.childDependentCareCredit', 'form-tax-return-schedule3.xlsx (line 2)', 'schedule3.nonrefundableCredits.childDependentCareCredit = roundMoney(form2441.line11)', 'Set only when line11 > 0. Schedule 3 line 2 → Form 1040 line 20 path.'],
  [],
  ['CROSS-LINE INTERACTIONS'],
  ['Component', 'Affects', 'Notes'],
  ['Line 1e (taxable DCB)', 'line 1z + line 9 (total income) + AGI', 'Standard income inclusion. Increases AGI which feeds back into the Phase 2 applicable-percentage table.'],
  ['Line 1e → Pub 915 SS Worksheet', 'Worksheet 1 line 3 inputs total income', 'Indirect via line 1z; same as other line 1 sub-lines.'],
  ['Form 2441 line 11 → Schedule 3 line 2', 'Schedule 3 → Form 1040 line 20 → line 22', 'Reduces tax liability. Order matters — Phase 2 must run AFTER FTC + Form 8880 (Credit Limit Worksheet correctness).'],
  ['Form 2441 Part III line 25 (excluded)', 'Wages displayed on W-2 vs Form 1040 line 1a', 'Conceptually: line 1a includes only the EXCLUDED portion (already in W-2 box 1 if employer correctly handled box 10/box 1 split). Line 1e captures the EXCESS that was NOT excluded.'],
  ['DCFSA box 10 with §129(d) failure', 'line 1e = full line 15 (no exclusion)', 'Bypass branch. Highly compensated employee scenario.'],
  [],
  ['THE BOX 10 / LINE 1A / LINE 1E TRIANGLE'],
  ['Component', 'Source', 'Routes to'],
  ['Box 10 amount EXCLUDED from box 1 (employer correctly applied $5k cap)', 'W-2 box 10', 'Stays excluded if line25 ≥ box 10 (typical case). No line 1e impact.'],
  ['Box 10 amount EXCEEDING the excludable cap', 'W-2 box 10', 'Line 1e = excess; INCREASES total wages for §21 credit purposes via Part II line 4.'],
  ['Box 10 amount ALREADY IN box 1 (employer mistake or §129(d) failure)', 'alreadyIncludedInBox1Amount', 'Subtracted from line 12 to avoid double-count. Line 1e then captures only the truly-excluded-then-disallowed portion.'],
];
const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 50 }, { wch: 100 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation / Blocking Flags ─────────────────────────────────
const flags = [
  ['VALIDATION RULES — Blocking Flags Emitted by Line 1e Pass'],
  [],
  ['Flag Code', 'Trigger Condition', 'Effect', 'Suppressed When'],
  ['DEPENDENT_CARE_BENEFITS_FORM_REQUIRED', 'W-2 box 10 totalBenefits > 0 AND didReceiveDependentCareBenefits != true', 'Blocking. User must answer the gating question and provide childcare-expenses form data; otherwise Form 2441 cannot be computed.', 'Set didReceiveDependentCareBenefits = true (and provide form data)'],
  [],
  ['NOTE: Line 1e has a SINGLE blocking flag (vs line 1d\'s seven). Most data-quality issues silently default to safe values:'],
  ['Scenario', 'Behavior', 'Why not flagged'],
  ['data == null (form not saved)', 'Form 2441 not generated; line 1e = null', 'Normal — no DCB to report'],
  ['hasCareExpenses != true but Part II inputs present', 'Credit still computed in Phase 2', 'Outer-gate field NOT read by backend — see Code Validation #8'],
  ['didReceiveDependentCareBenefits = false but childcare data exists', 'Form 2441 still generated for credit-only path', 'Allows Part II credit without Part III benefits'],
  ['Earned income = 0 for both spouses (no deemed)', 'line20 = 0 → line25 = 0 → line26 = line15 (taxable)', 'Pub 503 rule: no earned income → no exclusion. Correct.'],
  ['Qualifying-person count = 0 with positive expenses', 'line27 = $3,000 (default tier)', 'Treats unknown as 1-person tier. UI should ensure at least 1 qualifying person row.'],
  ['planMaxExcludable > statutory cap', 'line21 = statutory cap (min wins)', 'Plan max can\'t exceed IRS cap; correctly capped.'],
  ['line14 (forfeited) > line12 + line13 (available)', 'line15 = max(0, ...) → 0', 'Floored at 0.'],
  ['Filing status not saved', 'Defaults to non-MFS (status comparison falls through)', '$5,000 cap applied — favorable to taxpayer if MFS data lurks.'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 52 }, { wch: 90 }, { wch: 60 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Reviewed against: TaxReturnComputeService.computeDependentCareBenefits() + finalizeForm2441PartII() + applyChildDependentCareCredit() (function-name reference; verified 2026-05-05).'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'BUG — MFS NO-EXCEPTION CREDIT NOT BLOCKED', 'IRC §21(e)(2) generally disallows the dependent care CREDIT for MFS filers unless the separation exception is met (lived apart last 6 months + qualifying child lived in home + maintained home). Code correctly applies the $2,500 EXCLUSION cap on MFS-no-exception (Step 12), but does NOT block the Part II CREDIT. finalizeForm2441PartII / applyChildDependentCareCredit have no MFS check, so Schedule 3 line 2 gets populated on MFS even without the exception. The exclusion is allowed; the credit is not.', 'finalizeForm2441PartII + applyChildDependentCareCredit vs IRC §21(e)(2)', 'In finalizeForm2441PartII or applyChildDependentCareCredit, add: if (filingStatus = MFS AND marriedFilingSeparatelyException != true) → set form2441.line11 = null AND skip the schedule3 wire-up. Alternatively zero line11 in Phase 2 for that case. Add unit test computesPartIICreditNotAllowedOnMfsWithoutException and an E2E test.'],
  [2, 'DEFENSIVE GAP — MFS GUARD NOT IN ORCHESTRATOR', 'computeDependentCareBenefits accepts both `you` and `spouse` and computes spouseEarned unconditionally. While line19 is correctly gated by isMfj (line19 = isMfj ? spouseEarned : line18), the spouse W-2 is still summed for spouseEarned even on MFS. On MFS without exception, this contributes nothing to line 19 (taxpayer-only) but the spouse data is read regardless. Same orchestrator-MFS-guard pattern we addressed in line 1c (#1) and line 1d (#1). Lower severity here because line19 isMfj gate provides correctness, but a single-guard cascade would be cleaner.', 'computeDependentCareBenefits — no boolean isMfs parameter', 'Optional. Add `boolean isMfs` parameter; on MFS, pass spouse=Map.of() to skip spouse W-2 summation. Same pattern as line 1c/1d single-guard cascade. Low priority since the isMfj gate downstream gives the right answer.'],
  [3, 'SPEC NON-COMPLIANCE — "DCB" WRITE-IN LABEL MISSING', '2025 IRS Form 1040 instructions for line 1e: "If you received employer-provided dependent care benefits that you must include on line 1e, enter \'DCB\' on the dotted line next to line 1e." The PDF field map (f1040_field_mapping_semantic.csv) only exposes line1e_taxable_dependent_care_benefits (the amount cell). The UI overlay (form-tax-return-1040.component.ts) writes only the amount. No "DCB" label is rendered to the dotted line area.', 'public/irs/* PDF overlay + form-tax-return-1040.component.ts:269', 'Add a label-only PDF overlay (drawText) at coordinates ~ (430, 290) on Page 1 of f1040 — between the line-1e label and the amount cell. Render literal "DCB" when form.income?.dependentCareBenefits != null AND > 0. May require pdf-lib drawText (text overlay, not field fill).'],
  [4, 'TEST COVERAGE GAPS', 'Existing unit tests cover: basic MFJ box 10, deemed income, MFS-with-exception ($5k cap), §129(d) bypass, Phase 2 credit finalization. MISSING: (a) MFS-without-exception ($2,500 cap), (b) planMaxExcludable < statutory cap, (c) credit blocked on MFS-no-exception (Issue #1), (d) zero earned income → full taxable, (e) hasCareExpenses outer gate behavior (Issue #8), (f) ≥2 qualifying persons → $6k expense limit edge case at the boundary.', 'TaxReturnComputeServiceTest', 'Add 5+ unit tests covering each branch. Particularly lock-in: computesMfsWithoutExceptionCapsExclusionAtTwoFiveHundred, computesPlanMaxLimitsExclusionBelowStatutory, computesPartIICreditNotAllowedOnMfsWithoutException (after Issue #1 fix).'],
  [5, 'KNOWLEDGE FILE MISSING', 'No knowledge/line-1e-*.md exists. Lines 1a/1b/1c/1d all have detailed knowledge files; line 1e has lines/1e.md spec + dependencies/1e.md but no knowledge index.', 'C:\\us-tax\\knowledge\\ folder', 'Create knowledge/line-1e-dependent-care-benefits.md mirroring knowledge/line-1d-medicaid-waiver-payments.md structure: §1 What is Line 1e, §2 Personal Form ID, §3 Form Sections + YAML Fields, §4 Backend Compute Logic (function-name convention), §5 Two-Pass Architecture, §6 Schedule 3 Line 2 Wire-Up, §7 Frontend Forms, §8 Unit + E2E Test Coverage, §9 Known Implementation Gaps, §10 Key Constants, with verification log footer.'],
  [6, 'OVER-BROAD GATE — hasAnyChildcareData', 'hasAnyChildcareData() returns true if ANY of the 5 sub-maps is non-empty — even just a single Boolean answer like `hasCareExpenses=No`. This causes Form 2441 to be instantiated and all 31 lines populated even when the user has zero benefits and zero expenses. Bloats Form 2441 output and PDF render with irrelevant zeroes.', 'hasAnyChildcareData', 'Tighten the predicate: only return true when there is a positive numeric input (Σ benefits > 0, Σ expenses > 0, or a qualifying person row with non-empty SSN). Mirrors hasAnyAdoptionInputs which uses positive-amount checks.'],
  [7, 'EARNED INCOME — NO BLOCKING WHEN SPOUSE HAS ZERO ON MFJ', 'On MFJ: if spouse has zero W-2 + zero deemed (not a student/disabled) + zero additionalEarnedIncomeSpouse → line19 = 0 → line20 = min(line17, line18, 0) = 0 → line25 = 0 → line26 = line15 (full taxable). This is correct per Pub 503 (no earned income for one spouse on MFJ → no exclusion or credit). However, no advisory flag warns the user; they just see line 1e = full benefits with no explanation. Common UX trap: "Why is all my DCFSA suddenly taxable?"', 'computeDependentCareBenefits — line25 path', 'Add a non-blocking advisory flag: DEPENDENT_CARE_SPOUSE_EARNED_INCOME_ZERO ("Your spouse has $0 in earned income for §21 purposes (no W-2 wages, no deemed income, no qualifying disability pay). This makes ALL employer-provided dependent care benefits taxable per IRS Pub 503. If your spouse is a full-time student or disabled, complete §generalQuestions accordingly; otherwise this is the correct treatment.")'],
  [8, 'OUTER GATE — hasCareExpenses NOT READ', 'The form has hasCareExpenses ("Did you pay for the care of a child under 13...") as the FIRST gating question, but the backend never checks it. computeDependentCareBenefits reads only didReceiveDependentCareBenefits. If user answers hasCareExpenses=No (no care paid) but stale qualifyingPersons[] data persists, Form 2441 Part II credit could compute. Conversely, if hasCareExpenses=Yes but no qualifyingPersons entered, line30 = 0 and line3 = 0 → no credit (silently zero).', 'computeDependentCareBenefits vs form schema row 1', 'Two options: (a) Add a SOFT gate in the orchestrator: if (hasCareExpenses == false) → skip the credit-side computation (Part II lines 3-11). Keep Part III running for the W-2 box 10 → line 1e flow (DCB still taxable even without claiming credit). (b) UI-side normalize: when hasCareExpenses=false, clear qualifyingPersons + creditComputation. Recommended: do BOTH (dual-layer defensive gate, mirrors line 1a/1b pattern).'],
  [9, 'WORKSHEET A LINE 9 (PRIOR-YEAR EXPENSES) — PARTIAL', 'Pub 503 Worksheet A computes line 9b for the credit limit when prior-year care expenses are paid in the current year. Backend reads only `priorYearQualifiedExpensesPaidThisYear` as a single number and uses it directly as line 9b. The full Worksheet A involves: (a) cap by prior year\'s unused limit, (b) per-prior-year tracking (could be paid in 2024 from 2023 expenses), (c) MAGI-recomputation in prior year. Currently best-effort for the simple case.', 'computeDependentCareBenefits Step P2-6 + dependencies/1e.md "Deferred / Not Yet Wired"', 'Already documented as deferred. Add a non-blocking advisory flag DEPENDENT_CARE_WORKSHEET_A_PARTIAL when priorYearQualifiedExpensesPaidThisYear > 0, advising the user that the implementation does not perform the full prior-year recomputation. Or leave silent and document in lines/1e.md §10 (current spec already lists Worksheet A as out of scope).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 22 }, { wch: 80 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 1e (and Form 2441 / Schedule 3) Flow in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.dependentCareBenefits', 'topmostSubform[0].Page1[0].f1_51[0] (line1e_taxable_dependent_care_benefits)', 'form-tax-return-1040.xlsx (line 1e cell)', 'Primary output — printed on Form 1040 line 1e. Stored only when non-null. Whole-dollar rounded. **"DCB" write-in label NOT rendered — see Code Validation #3.**'],
  ['form1040.income.line1z', '(line 1z cell on f1040)', 'form-tax-return-1040.xlsx', 'Line 1e is one of 8 components: line1z = 1a + 1b + 1c + 1d + 1e + 1f + 1g + 1h (addNonNull)'],
  ['form1040.income.totalIncome', '(line 9 cell on f1040)', 'form-tax-return-1040.xlsx', 'Line 1e → 1z → 9. Increases AGI which then drives the Phase 2 applicable-percentage table.'],
  ['form2441 (full Part I/II/III)', 'topmostSubform[0].Page*[0].* on f2441', 'form-tax-return-2441.xlsx', 'Form 2441 attached to return when line 11 > 0 OR line 12 > 0. All 31 lines populated from Phase 1; Part II 7-11 from Phase 2.'],
  ['schedule3.nonrefundableCredits.childDependentCareCredit', 'topmostSubform[0].Page1[0] line 2 (Schedule 3)', 'form-tax-return-schedule3.xlsx (line 2)', 'Set by applyChildDependentCareCredit() only when form2441.line11 > 0. Schedule 3 line 2 → Form 1040 line 20 → line 22 (reduces tax).'],
  [],
  ['DOWNSTREAM USE (read by other computations)'],
  ['Consumer', 'How it uses line 1e', 'Notes'],
  ['Form 1040 line 1z (total wages)', 'Direct addNonNull aggregation', 'Line 1e is wages-side; bumps total wages.'],
  ['Form 1040 line 9 → AGI (line 11)', 'Indirect via 1z', 'Increases AGI — feeds back into Phase 2 applicable-percentage table (35% → lower).'],
  ['Pub 915 SS Worksheet 1 line 3', 'Includes line 1e via line 1z reference', 'Same as other line 1 sub-lines.'],
  ['Form 8959 Additional Medicare Tax', 'Out of scope (per CLAUDE.md)', 'When implemented, Medicare wages are based on W-2 box 5, not box 10 → line 1e does not directly affect.'],
  ['EIC earned income (line 27a)', 'Includes line 1e as wages', 'IRC §32 earned income includes wages, which by IRC §3121 wages includes taxable DCB. Confirmed via line 1z aggregation.'],
  ['Schedule 8812 ACTC earned income', 'Includes line 1e as wages', 'Same wages-side aggregation.'],
  ['Schedule 1-A line 38 (enhanced senior + tips deduction)', 'Indirectly via MAGI inputs', 'No direct interaction with line 1e specifically.'],
  ['Form 2441 Part II line 4 (earned income)', 'Same earned-income basis (line18) is reused', 'Internal — Phase 1 sets line18 from same per-spouse W-2 sum.'],
  [],
  ['NEGATIVE / NULL CONTRACT'],
  ['line 1e value', 'Meaning'],
  ['null (field absent)', 'Either no W-2 box 10 amount, or all of it was excluded via Form 2441 Part III (line26 = 0 → roundMoney still 0; null contract enforced via early return when no benefits and no childcare data)'],
  ['BigDecimal.ZERO', 'Edge case — Form 2441 was generated (childcare data present without W-2 box 10) and line 26 worked out to zero. Possible but visually noisy.'],
  ['Positive BigDecimal', 'Standard case — W-2 box 10 exceeded $5,000/$2,500 cap, OR earned-income limit, OR plan max, OR §129(d) bypass triggered.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 60 }, { wch: 70 }, { wch: 50 }, { wch: 80 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUT);
console.log('Wrote: ' + OUT);
