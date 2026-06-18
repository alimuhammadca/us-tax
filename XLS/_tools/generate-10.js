// ============================================================================
//  Generates: C:\us-tax\XLS\computations\10.xlsx
//
//  Source-of-truth references:
//    - lines/10.md (2025 IRS-verified rule map for Form 1040 line 10 + Schedule 1 line 26)
//    - dependencies/10.md
//    - knowledge/line-10-adjustments.md (renamed 2026-05-12 via 10 #2 from legacy knowledge_line10.md)
//    - TaxReturnComputeService.computeIncomeAdjustments() — orchestrator at line 8088
//      (NO `isMfsReturn` parameter — defensive gap addressed via 10 #1)
//    - PDF semantic CSV row 88: f1_74[0] line10_adjustments_to_income_schedule1_line26
//    - IRS 2025 Form 1040 line 10 instructions + 2025 Schedule 1 (Form 1040) Part II
//    - IRC §62 (general above-the-line adjustments framework); §62(a)(2)(D) (educator $300);
//      §223 (HSA); §217 (moving — Armed Forces only); §1401 (SE tax half-deduction);
//      §162(l) (SE health insurance); §72(t) (early withdrawal penalty re. ATM 9 §165);
//      §215 (alimony — pre-2019 agreements only); §219 (IRA contributions);
//      §221 (student loan interest, $2,500 cap, $85k/$170k phaseout); §220 (Archer MSA);
//      §911 (Form 2555 housing deduction — line 24j); §67(e) (excess deductions — line 24k)
//
//  Tax year: 2025
//
//  NOTE: Form 1040 line 10 is a **direct pass-through from Schedule 1 line 26**. Schedule 1
//  line 26 = sum(lines 11-23) + line 25; line 25 = sum(lines 24a-24z). Net effect:
//  line 26 = sum(line11 + line12 + line13 + line14 + line15 + line16 + line17 + line18 +
//  line19a + line20 + line21 + line22 + line23 + line24a + line24b + ... + line24z).
//
//  **Line 10 audit is the FIRST audit in AGI-territory** per 9 #10 boundary milestone.
//  Income-territory (lines 1-9) is COMPLETE. Line 10 audit transitions the workflow to
//  AGI / deductions / taxable income / tax computation territory.
//
//  Line 10 audit angles:
//   • Defensive MFS guard NOT YET ADDED at computeIncomeAdjustments — extends cascade
//     from 13 to 14 orchestrators (new codebase maximum)
//   • Knowledge file rename (`knowledge_line10.md` → canonical `line-10-adjustments.md`)
//   • Verification log section (NEW for `lines/10.md`; THIRD single-line audit log)
//   • Cross-reference to FUTURE line 11a/11b AGI computation (line 10 is direct subtractor;
//     line 11a = line 9 − line 10 per spec §6.1)
//   • Verified-correct breadcrumbs on Schedule 1 line 26 sum (13 operands) + line 25 sub-sum
//     (12 sublines 24a-24z) + Form 1040 line 10 pure pass-through
//   • Out-of-scope Schedule 1 lines 15/16/17 SE-tax BLOCKING flags
//   • Line 24z anti-broad-bucket guardrail (per spec §9 + §4.13)
//   • Boundary milestone — FIRST AGI-territory audit; income-territory complete
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '10.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 10 — ADJUSTMENTS TO INCOME (from Schedule 1, line 26)'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 10'],
  ['Concept', 'Direct pass-through from Schedule 1 (Form 1040) line 26 — the Part II total. Schedule 1 Part II aggregates above-the-line adjustments (sometimes called "adjustments to income" or §62 deductions): educator expenses, HSA deduction, Armed Forces moving, SE tax/SE retirement/SE health insurance (all out-of-scope per product policy), early withdrawal penalty, alimony paid (pre-2019 agreements), IRA deduction, student loan interest, Archer MSA, jury duty repaid, line-8l rental expense, Olympic/Paralympic backout, §501(c)(18)(D) pensions, §403(b) chaplain contributions, attorney fees (unlawful discrimination + IRS whistleblower), Form 2555 housing deduction, §67(e) excess deductions from K-1 (1041), plus a narrow 24z write-in. **Line 10 is the SUBTRACTOR in AGI**: `line11a = line9 - line10` per spec §6.1. **FIRST audit in AGI-territory** per 9 #10 boundary milestone.'],
  ['Core invariant', '`Form1040.line10 = Schedule1.line26 = sum(lines 11-23) + Schedule1.line25` where `Schedule1.line25 = sum(lines 24a-24z)`. Net: line 26 aggregates 13 operands (lines 11-23, with line 25 sub-sum aggregating 12 sublines 24a-24k + 24z). Line 22 is reserved (always zero in 2025). Lines 15/16/17 modeled but out-of-scope BLOCKING flags. Line 10 NOT in line 9 (it is a subtractor, not an addend).'],
  ['Per-Return Formula',
    'FORM 1040 LINE 10 (direct pass-through at TaxReturnComputeService.java:4372):\n' +
    '  BigDecimal line10 = roundMoney(incomeAdjustments == null ? null : incomeAdjustments.line10FromSchedule1Line26());\n' +
    '  adjustments.setAdjustmentsSchedule1(line10);\n\n' +
    'SCHEDULE 1 LINE 26 (at TaxReturnComputeService.java:8204):\n' +
    '  BigDecimal line26 = addNonNull(\n' +
    '    sumAmounts(line11, line12, line13, line14, line15, line16, line17, line18, line19a, line20, line21, line22, line23),\n' +
    '    line25\n' +
    '  );\n\n' +
    'SCHEDULE 1 LINE 25 (at TaxReturnComputeService.java:8203):\n' +
    '  BigDecimal line25 = sumAmounts(line24a, line24b, line24c, line24d, line24e,\n' +
    '                                  line24f, line24g, line24h, line24i, line24j, line24k, line24z);\n\n' +
    '**Schedule 1 Part II operands** (lines 11-23):\n' +
    '  line11  — Educator expenses ($300/educator cap; $600 MFJ when both qualify)\n' +
    '  line12  — Reservist / performing artist / fee-basis officials (Form 2106)\n' +
    '  line13  — HSA deduction (Form 8889)\n' +
    '  line14  — Armed Forces moving expenses (Form 3903 — active-duty PCS only)\n' +
    '  line15  — Deductible SE tax half — **OUT-OF-SCOPE BLOCKING flag**\n' +
    '  line16  — SE SEP/SIMPLE/qualified retirement plans — **OUT-OF-SCOPE BLOCKING flag**\n' +
    '  line17  — SE health insurance (worksheet OR Form 7206 exception) — **OUT-OF-SCOPE BLOCKING flag**\n' +
    '  line18  — Penalty on early withdrawal of savings (1099-INT box 13 + 1099-OID box 13)\n' +
    '  line19a — Alimony paid (pre-2019 agreement only; +19b SSN + 19c date)\n' +
    '  line20  — IRA deduction (with §219 phaseout + Form 8606 nondeductible coordination)\n' +
    '  line21  — Student loan interest ($2,500 cap; $85k/$170k phaseout; MFS blocked; dependent blocked)\n' +
    '  line22  — Reserved (2025 = 0)\n' +
    '  line23  — Archer MSA deduction (Form 8853)\n\n' +
    '**Line 25 sublines (24a-24k + 24z)**:\n' +
    '  24a — Jury duty pay (repaid to employer)\n' +
    '  24b — Deductible expenses related to line-8l rental of personal property\n' +
    '  24c — Olympic/Paralympic backout (line-8m income reversal)\n' +
    '  24d — Reforestation amortization/expenses\n' +
    '  24e — Trade Act of 1974 supplemental unemployment repayment\n' +
    '  24f — §501(c)(18)(D) pension contributions\n' +
    '  24g — Certain chaplain §403(b) contributions\n' +
    '  24h — Attorney fees and court costs for qualifying unlawful discrimination claims\n' +
    '  24i — Attorney fees and court costs for IRS whistleblower awards\n' +
    '  24j — Form 2555 housing deduction (distinct from 8d FEIE)\n' +
    '  24k — Excess §67(e) deductions from Schedule K-1 (Form 1041) box 11 code A\n' +
    '  24z — IRS-specific write-in (NOT a broad catch-all per spec §9)'],
  ['Filed',
    'Form 1040 line 10 (amount) — PDF field f1_74[0] = `line10_adjustments_to_income_schedule1_line26` (canonical mapping per CSV row 88).\n' +
    'Schedule 1 (Form 1040) Part II — generated as part of full Schedule 1 attachment when `hasAnySchedule1Input=true` (gated at 8220-8235).'],
  ['Backend method', 'TaxReturnComputeService.computeIncomeAdjustments() at line 8088 — orchestrator. **MFS guard NOT YET ADDED** (defensive gap per 10 #1 — same shape as 8 #1 / 7a #1 / 6a #1). Persistence helper `buildAdjustments` at line 4371 wires line 10 + computes line 11a/11b AGI = line 9 − line 10.'],
  ['Output', 'form1040.adjustments.adjustmentsSchedule1 (BigDecimal — Schedule 1 line 26 total). When non-null, drives `line11a = line9 - line10` AGI computation. Also flows to `subtractNonNegativeAllowNegative` path so AGI can be negative (no zero-floor).'],
  ['IRS source', 'IRS 2025 Form 1040 line 10 instructions ("Adjustments to income from Schedule 1, line 26") + 2025 Schedule 1 (Form 1040) Part II instructions + IRS Pub. 970 (Education adjustments) + Pub. 974 (Premium Tax Credit) for line 17; IRC §62 framework + §62(a)(2)(D) (educator) + §215 (alimony, repealed for post-2018 agreements) + §219 (IRA) + §221 (student loan interest) + §220 (Archer MSA) + §223 (HSA) + §1401 (SE tax) + §162(l) (SE health insurance) + §911 (foreign housing — line 24j) + §67(e) (excess deductions — line 24k).'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Gather Schedule 1 Part II inputs from personal forms (taxpayer + spouse) + statements', '`income-adjustments-taxpayer` + `income-adjustments-spouse` personal forms; 1098-E (student loan interest), 1099-INT/1099-OID box 13 (early withdrawal penalty), K-1 (1041) box 11 code A (§67(e) excess deductions).'],
  [2, 'Apply MFS guard (NOT YET — per 10 #1)', '⚠️ Currently aggregates spouse data on MFS. Per 10 #1: MFS guard should null `incomeAdjustmentsSpouse` on MFS — critical because line 21 student-loan-interest BLOCKING-IF-MFS rule + line 20 MFS-lived-apart-all-year flag are separately tracked.'],
  [3, 'Validate statement gating', '`validateIncomeAdjustmentsStatementGating` (line 8284) emits blocking flags when 1098-E / 1099-INT-OID-with-EWP / K-1-1041-§67(e) received-but-not-uploaded.'],
  [4, 'Emit out-of-scope BLOCKING flags for lines 15/16/17', 'Each SE-tax-related Schedule 1 Part II line emits a separate `INCOME_ADJUSTMENTS_LINE15/16/17_OUT_OF_SCOPE` flag per `hasDeductibleSelfEmploymentTaxLine15OutOfScope` / `hasSelfEmployedRetirementPlanAdjustmentLine16OutOfScope` / `hasSelfEmployedHealthInsuranceAdjustmentLine17OutOfScope`.'],
  [5, 'Compute Schedule 1 Part II lines 11-23 (taxpayer + spouse aggregation per line)', 'Each line: `addNonNull(getAmount(taxpayer, X), getAmount(spouse, X))`. Line 18 also folds in `imported1099IntEarlyWithdrawalPenaltyTotal` + `imported1099OidEarlyWithdrawalPenaltyTotal` + statement-derived totals. Line 21 also folds in `imported1098EBox1StudentLoanInterestTotal` + statement-derived totals. Line 22 is hard-coded null (reserved 2025).'],
  [6, 'Compute Schedule 1 Part II lines 24a-24k + 24z', 'Per-subline taxpayer+spouse aggregation. Line 24k also folds in `importedK1Section67eExcessDeductionsTotal`. Line 24z uses `buildSchedule1OtherAdjustmentItems` (description + amount per item; deduplicated/labeled with owner per `addSchedule1OtherAdjustmentItemsFromForm`).'],
  [7, 'Compute Schedule 1 line 25 (sum of 24a-24z)', '`sumAmounts(line24a, ..., line24z)` at line 8203. 12 operands (24a + 24b + 24c + 24d + 24e + 24f + 24g + 24h + 24i + 24j + 24k + 24z).'],
  [8, 'Compute Schedule 1 line 26 (sum of lines 11-23 + line 25)', '`addNonNull(sumAmounts(line11..line23), line25)` at line 8204. 14 operands (line22 is null=zero contribution).'],
  [9, 'Compute Pub. 915 SS-worksheet subset', '`line10FromSchedule1Pub915Subset = addNonNull(sumAmounts(line11..line20 + line23), line25)` at lines 8216-8218. **EXCLUDES line 21** (student loan interest — circular dependency on MAGI) **AND line 22** (reserved). Consumed by `computeSocialSecurityBenefits` per 6b #5.'],
  [10, 'Gate output via `hasAnySchedule1Input` boolean', 'When all 13 Part II amounts + 12 sublines + 19b/19c text fields are zero/null/blank → return null (no Schedule 1 Part II generated; line 10 NULL → AGI=line 9 only).'],
  [11, 'Persist on form1040.adjustments via buildAdjustments', '`adjustments.setAdjustmentsSchedule1(line10)` at line 4383. PDF: f1_74[0] = `line10_adjustments_to_income_schedule1_line26`.'],
  [12, 'Compute AGI: line 11a = line 9 − line 10 (SIGNED — no zero-floor)', '`line11a = subtractNonNegativeAllowNegative(line9, line10)` at line 4376. **AGI can be negative** (NOL carryback / refundable-credit scenarios). Line 11b = line 11a (IRS copy line). FUTURE line 11 audit will document this AGI computation.'],
  [],
  ['MUTUAL EXCLUSION / SPECIAL RULES'],
  ['Rule', 'Implementation', 'Why'],
  ['Form 1040 line 10 = Schedule 1 line 26 (PURE pass-through)', '`roundMoney(incomeAdjustments.line10FromSchedule1Line26())` at line 4372 — no transformation beyond rounding.', 'Per IRS 2025 line 10 instructions: "Adjustments to income from Schedule 1, line 26."'],
  ['Schedule 1 line 26 = lines 11-23 + line 25 (NOT 11-25)', '`addNonNull(sumAmounts(line11..line23), line25)` at line 8204 — explicit composition.', 'Per 2025 Schedule 1 form structure: line 24 sublines (24a-24z) total separately on line 25; line 26 adds the line-25 sub-sum to lines 11-23.'],
  ['Schedule 1 line 25 = sum of 24a-24k + 24z (12 sublines; NOT 24a-24z continuous)', '`sumAmounts(line24a, line24b, line24c, line24d, line24e, line24f, line24g, line24h, line24i, line24j, line24k, line24z)` at line 8203.', 'Per 2025 form: 24l-24y do NOT exist. 24z is the IRS-specific write-in (NOT a free-form catch-all per spec §9).'],
  ['Self-employment lines 15/16/17 BLOCKING out-of-scope', 'Each line emits `INCOME_ADJUSTMENTS_LINE15/16/17_OUT_OF_SCOPE` BLOCKING flag at lines 8124-8147 when `has...OutOfScope` flag is TRUE on taxpayer or spouse.', 'Per CLAUDE.md: Schedule C / SE / F out-of-scope; lines 15/16/17 depend on SE income. Lines 15/16/17 amounts ARE STILL summed into line 26 if non-zero, but the BLOCKING flag prevents submission.'],
  ['Line 22 is hard-coded null in 2025', '`BigDecimal line22 = null;` at line 8183 with comment "Reserved on Schedule 1 (2025)".', 'Per 2025 Schedule 1 form: line 22 is the "Reserved for future use" line.'],
  ['Line 19a alimony — pre-2019 agreement only', 'Spec §4.7: post-2018 agreements yield NO line-19a deduction (TCJA §11051 repealed §215 for post-2018 agreements).', 'Per IRC §215 repeal effective 2019; current backend allows the user-entered amount but spec rules enforcement at form-fill time.'],
  ['Line 21 student loan interest blocked for MFS + dependents', 'Spec §4.9: $2,500 cap; $85k/$170k phaseout; MFS blocked; dependent blocked.', 'Per IRC §221(e)(2): the deduction is unavailable for MFS filers and for taxpayers claimed as dependents. **CRITICAL for MFS guard** — 10 #1 fix ensures spouse data does not leak on MFS.'],
  ['Line 24z is NOT a free-form catch-all', 'Per spec §9: only populate 24z when a specific current IRS instruction requires a write-in adjustment.', 'Per 2025 IRS instructions: "Use line 24z only if instructed by a current IRS instruction to enter a write-in adjustment." Backend `buildSchedule1OtherAdjustmentItems` accepts user input but spec rules guide acceptance.'],
  ['Pub. 915 subset EXCLUDES line 21 + line 22', '`line10FromSchedule1Pub915Subset` at lines 8216-8218 sums lines 11-20 + 23 + line25 ONLY (no line 21).', 'Per IRS 2025 SS Benefits Worksheet line 7 + Pub. 915: circular-dependency avoidance — student-loan-interest phaseout itself depends on MAGI which depends on taxable SS benefits. Established per 6b #5.'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 10 Flows'],
  ['Consumer', 'How', 'Notes'],
  ['Form 1040 line 11a/11b (AGI) — ★★ PRIMARY DOWNSTREAM', '`line11a = subtractNonNegativeAllowNegative(line9, line10)` at line 4376. Then line 11b = line 11a (IRS copy line) at line 4378.', '★★ CRITICAL: line 10 is the AGI subtractor. AGI = line 9 − line 10. AGI can be negative (signed result preserved). Future line 11 audit will document this fully.'],
  ['Pub. 915 SS taxability worksheet (NOT line 10 directly)', 'Worksheet uses `line10FromSchedule1Pub915Subset` (excludes line 21 + line 22) per 6b #5.', 'NOT direct line-10 consumer; uses a SUBSET of the same Schedule 1 Part II inputs.'],
  ['Form 1040 line 15 (taxable income)', 'Indirect via line 11b → line 14 (deductions) → line 15 = line 11b − line 14.', 'Carries through deduction waterfall.'],
  ['Form 8615 (kiddie tax) MAGI inputs', 'Indirect — kiddie tax MAGI computations include line 10 adjustments per Form 8615 instructions.', 'Future Form 8615 audit.'],
  ['Form 8863 (education credits) MAGI inputs', 'Indirect — MAGI for AOTC/LLC phaseouts incorporates line 10 effects.', 'Future Form 8863 audit.'],
  ['NOT IN OUTPUT — Form 1040 line 9 (line 10 is NOT in line 9)', '—', 'Line 10 is a SUBTRACTOR in AGI, not an addend in total income. Per spec: line 10 does NOT appear in the line 9 sum.'],
  ['NOT IN OUTPUT — Self-employment tax (Schedule SE)', '—', 'Per CLAUDE.md + lines 15/16/17 BLOCKING gating.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 28 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 10'],
  ['Line 10 has 13 NUMERIC inputs (Schedule 1 Part II lines 11-23) + 12 sub-line inputs (24a-24z) + statement-derived totals + 3 out-of-scope BLOCKING gating flags.'],
  [],
  ['#', 'Source form', 'Field', 'Schedule 1 line', 'Required?', 'Role', 'Cross-reference'],
  [1, 'income-adjustments-taxpayer + -spouse', 'educatorExpensesLine11', 'Line 11', 'Optional', 'Educator expenses ($300/educator cap; $600 MFJ when both qualify; 900-hour test)', 'Spec §4.1; IRC §62(a)(2)(D)'],
  [2, 'income-adjustments-taxpayer + -spouse', 'reservistPerformingArtistFeeBasisExpensesLine12', 'Line 12', 'Optional', 'Reservist / performing artist / fee-basis officials (Form 2106)', 'Spec §4.2'],
  [3, 'income-adjustments-taxpayer + -spouse', 'hsaDeductionLine13', 'Line 13', 'Optional', 'HSA deduction (Form 8889 — excludes employer contributions / rollovers / HSA funding distributions)', 'Spec §4.3; IRC §223'],
  [4, 'income-adjustments-taxpayer + -spouse', 'movingExpensesArmedForcesLine14', 'Line 14', 'Optional', 'Armed Forces active-duty PCS moving (Form 3903; storage-only checkbox available)', 'Spec §4.4; IRC §217'],
  [5, 'income-adjustments-taxpayer + -spouse', 'deductibleSelfEmploymentTaxLine15OutOfScopeAmount + hasDeductibleSelfEmploymentTaxLine15OutOfScope', 'Line 15', 'Out-of-scope BLOCKING', '⚠️ BLOCKING gate at line 8124-8131', 'Spec §4.5; IRC §1401; CLAUDE.md product scope'],
  [6, 'income-adjustments-taxpayer + -spouse', 'selfEmployedRetirementPlanAdjustmentLine16OutOfScopeAmount + hasSelfEmployedRetirementPlanAdjustmentLine16OutOfScope', 'Line 16', 'Out-of-scope BLOCKING', '⚠️ BLOCKING gate at line 8132-8139', 'Spec §4.5; CLAUDE.md product scope'],
  [7, 'income-adjustments-taxpayer + -spouse', 'selfEmployedHealthInsuranceAdjustmentLine17OutOfScopeAmount + hasSelfEmployedHealthInsuranceAdjustmentLine17OutOfScope', 'Line 17', 'Out-of-scope BLOCKING', '⚠️ BLOCKING gate at line 8140-8147; Form 7206 exception cases NOT supported', 'Spec §4.5; IRC §162(l)'],
  [8, 'income-adjustments-taxpayer + -spouse + 1099-INT box 13 + 1099-OID box 13', 'penaltyOnEarlyWithdrawalOfSavingsLine18 + imported1099IntEarlyWithdrawalPenaltyTotal + imported1099OidEarlyWithdrawalPenaltyTotal + sumStatementAmount(...)', 'Line 18', 'Optional', 'Manual + 1099-imported + statement-derived; 3-layer sum at line 8159-8168', 'Spec §4.6'],
  [9, 'income-adjustments-taxpayer + -spouse', 'alimonyPaidLine19a + alimonyRecipientSsnLine19b + alimonyAgreementDateLine19c', 'Line 19a/19b/19c', 'Conditional (pre-2019 agreement only)', '19a numeric; 19b SSN text; 19c date text', 'Spec §4.7; IRC §215 repeal'],
  [10, 'income-adjustments-taxpayer + -spouse', 'iraDeductionLine20', 'Line 20', 'Optional', 'IRA deduction (§219 phaseout; Form 8606 coordination for nondeductible contributions)', 'Spec §4.8; IRC §219'],
  [11, 'income-adjustments-taxpayer + -spouse + 1098-E + statement-derived', 'studentLoanInterestDeductionLine21 + imported1098EBox1StudentLoanInterestTotal + sumStatementAmount(form1099EEntries, "studentLoanInterestReceivedAmount")', 'Line 21', 'Conditional ($2,500 cap; $85k/$170k phaseout; MFS BLOCKED; dependent BLOCKED)', '3-layer sum at line 8177-8182; **CRITICAL for MFS** per 10 #1', 'Spec §4.9; IRC §221'],
  [12, '(reserved)', 'BigDecimal line22 = null', 'Line 22', 'Reserved 2025 = 0', 'Hard-coded null at line 8183', 'Spec §4.10'],
  [13, 'income-adjustments-taxpayer + -spouse', 'archerMsaDeductionLine23', 'Line 23', 'Optional', 'Archer MSA deduction (Form 8853)', 'Spec §4.11; IRC §220'],
  [14, 'income-adjustments-taxpayer + -spouse', 'otherAdjustmentJuryDutyPayLine24a', 'Line 24a', 'Optional', 'Jury duty pay repaid to employer', 'Spec §4.12; linked to 8h other-income inclusion'],
  [15, 'income-adjustments-taxpayer + -spouse', 'otherAdjustmentDeductibleExpensesRelatedTo8lLine24b', 'Line 24b', 'Optional', 'Deductible expenses related to line-8l rental of personal property', 'Spec §4.12; linked to 8l rental income'],
  [16, 'income-adjustments-taxpayer + -spouse', 'otherAdjustmentNontaxableOlympicParalympicLine24c', 'Line 24c', 'Optional', 'Olympic/Paralympic medal + USOC prize backout (line-8m income reversal)', 'Spec §4.12; linked to 8m'],
  [17, 'income-adjustments-taxpayer + -spouse', 'otherAdjustmentReforestationAmortizationLine24d', 'Line 24d', 'Optional', 'Reforestation amortization and expenses', 'Spec §4.12'],
  [18, 'income-adjustments-taxpayer + -spouse', 'otherAdjustmentTradeActRepaymentLine24e', 'Line 24e', 'Optional', 'Trade Act of 1974 supplemental unemployment repayment', 'Spec §4.12'],
  [19, 'income-adjustments-taxpayer + -spouse', 'otherAdjustmentContributions501c18dLine24f', 'Line 24f', 'Optional', '§501(c)(18)(D) pension contributions', 'Spec §4.12'],
  [20, 'income-adjustments-taxpayer + -spouse', 'otherAdjustmentChaplain403bContributionsLine24g', 'Line 24g', 'Optional', 'Certain chaplain §403(b) contributions', 'Spec §4.12'],
  [21, 'income-adjustments-taxpayer + -spouse', 'otherAdjustmentAttorneyFeesUnlawfulDiscriminationLine24h', 'Line 24h', 'Optional', 'Attorney fees + court costs for qualifying unlawful discrimination claims (capped at gross income from the action)', 'Spec §4.12'],
  [22, 'income-adjustments-taxpayer + -spouse', 'otherAdjustmentAttorneyFeesIrsAwardLine24i', 'Line 24i', 'Optional', 'Attorney fees + court costs for IRS whistleblower awards (capped at award amount in gross income)', 'Spec §4.12'],
  [23, 'income-adjustments-taxpayer + -spouse', 'otherAdjustmentHousingDeductionForm2555Line24j', 'Line 24j', 'Optional', 'Form 2555 housing DEDUCTION (distinct from 8d FEIE exclusion)', 'Spec §4.12; IRC §911(c)(4)'],
  [24, 'income-adjustments-taxpayer + -spouse + K-1 (1041) box 11 code A statement', 'otherAdjustmentExcessDeductionsSection67eLine24k + importedK1Section67eExcessDeductionsTotal', 'Line 24k', 'Optional', 'Excess §67(e) deductions from K-1 (Form 1041); 2-layer sum at line 8196-8199', 'Spec §4.12; IRC §67(e)'],
  [25, 'income-adjustments-taxpayer + -spouse `otherAdjustmentsItems24z` list', 'buildSchedule1OtherAdjustmentItems → sumSchedule1OtherAdjustmentItems', 'Line 24z', 'Conditional (NOT a free-form catch-all per spec §9)', 'Per-item (description + amount); deduped and labeled with owner prefix', 'Spec §4.13'],
  [26, 'income-adjustments-taxpayer', 'confirmAllReceivedAdjustmentStatementsUploaded + received1098E + uploaded1098E + received1099IntOrOidWithEarlyWithdrawalPenalty + uploaded1099IntAndOidWithPenalty + receivedK1WithSection67eExcessDeductions + uploadedK1WithSection67eExcessDeductions', '(gating only)', 'Conditional', 'Statement upload gating — emits 4 BLOCKING flags if mismatch', 'TaxReturnComputeService.java:8284-8326'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 40 }, { wch: 65 }, { wch: 18 }, { wch: 35 }, { wch: 60 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 10'],
  [],
  ['Constant', 'Value (2025)', 'Used In', 'Notes'],
  ['Educator expenses cap (per educator)', '$300', 'Line 11', 'Spec §4.1; IRC §62(a)(2)(D); $600 combined MFJ when both qualify; 900-hour test for eligible educator status (K-12).'],
  ['Student loan interest cap', '$2,500', 'Line 21', 'Spec §4.9; IRC §221.'],
  ['Student loan interest phaseout — Single/HOH/QSS', '$85,000 begin → $100,000 end', 'Line 21', 'Spec §4.9.'],
  ['Student loan interest phaseout — MFJ', '$170,000 begin → $200,000 end', 'Line 21', 'Spec §4.9.'],
  ['Student loan interest — MFS blocked', '—', 'Line 21', 'Spec §4.9; **CRITICAL for MFS guard** per 10 #1.'],
  ['Student loan interest — dependent blocked', '—', 'Line 21', 'Spec §4.9.'],
  ['Alimony paid eligibility cutoff', 'Pre-2019 agreement', 'Line 19a', 'Spec §4.7; IRC §215 repeal effective 2019 (TCJA §11051).'],
  ['Line 22 reserved', '0 (always)', 'Line 22', 'Spec §4.10; hard-coded null at line 8183.'],
  ['Line 24z guideline', 'Leave blank unless specific IRS instruction', 'Line 24z', 'Spec §4.13 + §9.'],
  [],
  ['Statutory references'],
  ['§62 (above-the-line adjustments framework)', 'IRC §62', 'YES — all of Schedule 1 Part II', 'General §62 above-the-line adjustments framework; lines 10/11a/11b derive from §62.'],
  ['§62(a)(2)(D) (educator $300)', 'IRC §62(a)(2)(D)', 'YES — line 11', 'Educator expenses cap.'],
  ['§215 (alimony — REPEALED for post-2018 agreements)', 'IRC §215 + TCJA §11051', 'YES — line 19a', 'Pre-2019 agreement only.'],
  ['§219 (IRA contributions)', 'IRC §219', 'YES — line 20', 'IRA deduction; Form 8606 coordination for nondeductible portion.'],
  ['§220 (Archer MSA)', 'IRC §220', 'YES — line 23', 'Archer MSA deduction (Form 8853).'],
  ['§221 (student loan interest)', 'IRC §221', 'YES — line 21', '$2,500 cap; phaseout; MFS blocked; dependent blocked.'],
  ['§223 (HSA)', 'IRC §223', 'YES — line 13', 'HSA deduction (Form 8889).'],
  ['§217 (moving expenses — Armed Forces only)', 'IRC §217', 'YES — line 14', 'Active-duty PCS only post-TCJA.'],
  ['§1401 (SE tax) — OUT-OF-SCOPE', 'IRC §1401', 'BLOCKING — line 15', 'Schedule SE half-deduction; out of product scope.'],
  ['§162(l) (SE health insurance) — OUT-OF-SCOPE', 'IRC §162(l)', 'BLOCKING — line 17', 'SE health insurance deduction; out of product scope. Form 7206 exception cases not supported.'],
  ['§911(c)(4) (foreign housing deduction)', 'IRC §911(c)(4)', 'YES — line 24j', 'Form 2555 housing DEDUCTION (distinct from 8d FEIE).'],
  ['§67(e) (excess deductions from estates/trusts)', 'IRC §67(e)', 'YES — line 24k', 'K-1 (Form 1041) box 11 code A.'],
  ['§61 (general gross income)', 'IRC §61', 'INDIRECT', 'Some line-24 sublines are deductions of items included in §61 income (24b vs 8l; 24c vs 8m).'],
  ['Pub. 970 (Education adjustments)', 'IRS Pub. 970', 'YES — lines 11 + 21', 'Educator expenses + student loan interest detail.'],
  ['Pub. 974 (Premium Tax Credit)', 'IRS Pub. 974', 'YES — line 17 (OUT-OF-SCOPE)', 'Coordinates §162(l) SE health insurance with §36B premium tax credit.'],
  ['Form 8606 (nondeductible IRA contributions)', 'IRS Form 8606', 'YES — line 20', 'Coordinates with §219 IRA deduction.'],
  ['Form 7206 (SE health insurance — exception)', 'IRS Form 7206', 'BLOCKING — line 17 (OUT-OF-SCOPE)', 'Required when multiple SE income sources / Form 2555 filer / qualified LTC.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 35 }, { wch: 40 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 10 + Schedule 1 Part II'],
  ['Line 10 is a direct pass-through from Schedule 1 line 26. Schedule 1 Part II is generated as part of the full attachment form when `hasAnySchedule1Input=true`. Line 10 is the AGI subtractor — drives line 11a/11b.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.adjustments.adjustmentsSchedule1', 'TaxReturnComputeService.buildAdjustments() — adjustments.setAdjustmentsSchedule1(line10) at line 4383', '★ Primary output. PDF: f1_74[0] = `line10_adjustments_to_income_schedule1_line26` (canonical).'],
  ['Form 1040 line 11a/11b (AGI) — ★★ CRITICAL', '`line11a = subtractNonNegativeAllowNegative(line9, line10)` at line 4376; `line11b = line11a` at line 4378.', '★★ CRITICAL: line 10 is the AGI subtractor. AGI can be negative (signed result preserved per spec §6.1). Future line 11 audit.'],
  ['Schedule 1 Part II attachment form', 'Generated when hasAnySchedule1Input=true (gated at line 8220-8235).', 'Full Schedule 1 Part II with lines 11-23 + 24a-24k + 24z + line 25 sub-sum + line 26 total.'],
  ['Pub. 915 SS taxability worksheet line 7 (subset)', 'computeSocialSecurityBenefits consumes `line10FromSchedule1Pub915Subset()` at line 8751 (NOT full line 26)', 'Per 6b #5: SS worksheet uses lines 11-20 + 23 + line 25 (EXCLUDES 21 + 22). Circular-dependency avoidance.'],
  ['Indirect — line 15 taxable income', 'Via line 11b → line 14 (deductions) → line 15.', 'Carries through deduction waterfall.'],
  ['Indirect — Form 8615 kiddie tax', 'Future Form 8615 audit will document MAGI computations.', 'Kiddie tax MAGI uses line 10 effects.'],
  ['Indirect — Form 8863 education credit', 'Future Form 8863 audit will document MAGI computations.', 'AOTC/LLC MAGI phaseouts use line 10 effects.'],
  [],
  ['BLOCKING / ADVISORY FLAGS'],
  ['INCOME_ADJUSTMENTS_LINE15_OUT_OF_SCOPE', 'BLOCKING', 'hasDeductibleSelfEmploymentTaxLine15OutOfScope=TRUE on taxpayer or spouse', 'Per CLAUDE.md product scope rule.'],
  ['INCOME_ADJUSTMENTS_LINE16_OUT_OF_SCOPE', 'BLOCKING', 'hasSelfEmployedRetirementPlanAdjustmentLine16OutOfScope=TRUE on taxpayer or spouse', 'Per CLAUDE.md product scope rule.'],
  ['INCOME_ADJUSTMENTS_LINE17_OUT_OF_SCOPE', 'BLOCKING', 'hasSelfEmployedHealthInsuranceAdjustmentLine17OutOfScope=TRUE on taxpayer or spouse', 'Per CLAUDE.md product scope rule.'],
  ['INCOME_ADJUSTMENTS_STATEMENT_CONFIRMATION_REQUIRED', 'BLOCKING', 'hadAnyAdjustments=TRUE AND !confirmAllReceivedAdjustmentStatementsUploaded', 'Statement gating.'],
  ['INCOME_ADJUSTMENTS_MISSING_UPLOADED_1098_E', 'BLOCKING', 'received1098E=TRUE AND !uploaded1098E', 'Statement gating.'],
  ['INCOME_ADJUSTMENTS_MISSING_UPLOADED_1099_INT_OID', 'BLOCKING', 'received1099IntOrOidWithEarlyWithdrawalPenalty=TRUE AND !uploaded1099IntAndOidWithPenalty', 'Statement gating.'],
  ['INCOME_ADJUSTMENTS_MISSING_UPLOADED_K1_1041', 'BLOCKING', 'receivedK1WithSection67eExcessDeductions=TRUE AND !uploadedK1WithSection67eExcessDeductions', 'Statement gating.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 (total income)', '—', 'Line 10 is a SUBTRACTOR in AGI, NOT an addend in line 9.'],
  ['Schedule 1 line 25 (intermediate sub-sum)', '—', 'Internal sub-sum only; not separately reported on Form 1040.'],
  ['Pub. 915 worksheet full line 10', '—', 'Worksheet uses SUBSET (excludes line 21 + 22) per 6b #5.'],
  ['Lines 15/16/17 SE-tax adjustments', '—', 'Out-of-scope per CLAUDE.md; BLOCKING flags prevent submission.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 10 / Income Adjustments'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['INCOME_ADJUSTMENTS_LINE15_OUT_OF_SCOPE', 'BLOCKING', 'hasDeductibleSelfEmploymentTaxLine15OutOfScope=TRUE', 'TaxReturnComputeService.java:8124-8131'],
  ['INCOME_ADJUSTMENTS_LINE16_OUT_OF_SCOPE', 'BLOCKING', 'hasSelfEmployedRetirementPlanAdjustmentLine16OutOfScope=TRUE', 'TaxReturnComputeService.java:8132-8139'],
  ['INCOME_ADJUSTMENTS_LINE17_OUT_OF_SCOPE', 'BLOCKING', 'hasSelfEmployedHealthInsuranceAdjustmentLine17OutOfScope=TRUE', 'TaxReturnComputeService.java:8140-8147'],
  ['INCOME_ADJUSTMENTS_STATEMENT_CONFIRMATION_REQUIRED', 'BLOCKING', 'hadAnyAdjustments=TRUE AND !confirmAllReceivedAdjustmentStatementsUploaded', 'TaxReturnComputeService.java:8291-8298'],
  ['INCOME_ADJUSTMENTS_MISSING_UPLOADED_1098_E', 'BLOCKING', 'received1098E=TRUE AND uploaded/entries missing', 'TaxReturnComputeService.java:8300-8307'],
  ['INCOME_ADJUSTMENTS_MISSING_UPLOADED_1099_INT_OID', 'BLOCKING', 'received1099IntOrOidWithEarlyWithdrawalPenalty=TRUE AND uploaded/entries missing', 'TaxReturnComputeService.java:8310-8317'],
  ['INCOME_ADJUSTMENTS_MISSING_UPLOADED_K1_1041', 'BLOCKING', 'receivedK1WithSection67eExcessDeductions=TRUE AND uploaded/entries missing', 'TaxReturnComputeService.java:8318-8325'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 10 is the **FIRST audit in AGI-territory** per 9 #10 boundary milestone. Income-territory (lines 1-9) is COMPLETE. Single-line audit; composite output (Schedule 1 line 26 = 13 operands; line 25 = 12 sublines). **The big-ticket item is Issue #1** — defensive MFS guard NOT YET ADDED at `computeIncomeAdjustments` (extends MFS cascade from 13 to **14 orchestrators**; new codebase maximum). Verified 2026-05-12.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-12 — ⚠️ HIGH-PRIORITY DEFENSIVE GAP — MFS GUARD ADDED AT `computeIncomeAdjustments`', '⚠️ **DEFENSIVE GAP FIXED**: Pre-fix, `computeIncomeAdjustments` at TaxReturnComputeService.java:8088 did NOT take an `isMfsReturn` parameter — orchestrator aggregated spouse Schedule 1 Part II income-adjustment fields (lines 11-23 + 24a-24k + 24z + 19b/19c text + statement-derived totals) on MFS returns. Spouse-data leakage paths: (a) `hadAnyAdjustments` gate at line 8102-8103 (spouse-side `hadIncomeAdjustmentsForSchedule1` triggers Schedule 1 generation); (b) 11 numeric Part II line aggregates (educator, HSA, moving, EWP, alimony, IRA, student loan, MSA — all `addNonNull(taxpayer, spouse)` at lines 8149-8184); (c) 12 line-24 sublines (24a-24k + 24z list); (d) `firstNonBlank` for 19b SSN + 19c date can leak spouse fields; (e) 3 out-of-scope BLOCKING flags fire on spouse-side flags. **CRITICAL — line 21 student loan interest BLOCKING for MFS**: per spec §4.9 + IRC §221(e)(2), the deduction is unavailable for MFS — but if spouse data leaks, the deduction could fire. **Closure applied (three-step fix)**: (1) Added `boolean isMfsReturn` parameter to `computeIncomeAdjustments` signature; (2) renamed `incomeAdjustmentsSpouse` → `incomeAdjustmentsSpouseRaw` + null-shadowed `incomeAdjustmentsSpouse = isMfsReturn ? null : incomeAdjustmentsSpouseRaw` at function head; (3) updated call site at line 465 to pass `isMfsReturn`. Added **~25-line MFS-guard breadcrumb** at TaxReturnComputeService.java enumerating 5 leakage paths + line 21 §221(e)(2) rationale + 14-orchestrator cascade milestone. **NEW lock-in test** `mfsExcludesSpouseIncomeAdjustmentsFromLine10` — MFS taxpayer `educatorExpensesLine11=$200` + STALE spouse `educatorExpensesLine11=$300` → asserts `adjustments.getAdjustmentsSchedule1()=$200` (taxpayer-only; pre-fix would produce $500). **Single-guard MFS cascade now applied to 14 orchestrators** (codebase maximum; 1c-1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities + computeSocialSecurityBenefits + computeCapitalGainLoss + computeOtherIncomes + **computeIncomeAdjustments**). Backend regression: 757 → 758 (+1 from lock-in test); all existing income-adjustments tests still pass.', 'TaxReturnComputeService.java:8088-8126 (signature + null-shadow + 25-line MFS-guard breadcrumb); line 472 (call site updated); test `mfsExcludesSpouseIncomeAdjustmentsFromLine10`', 'CLOSED — defensive gap fixed. Single-guard MFS cascade extended to 14 orchestrators (new codebase maximum).'],
  [2, 'RESOLVED 2026-05-12 — DOCUMENTATION HYGIENE — KNOWLEDGE FILE RENAME (Legacy A underscore prefix → canonical)', '`knowledge/knowledge_line10.md` used the Legacy A underscore-prefix form. **Closure applied**: (1) renamed `knowledge/knowledge_line10.md` → `knowledge/line-10-adjustments.md` (canonical form); (2) updated generator header-comment reference at `generate-10.js` line 7; (3) grep verified inbound references: `generate-10.js` (updated) + historical `history.md` mentions (not renamed — history entries are immutable chronological records). **Knowledge-file naming convergence extends to 17 lines** (1c-1i + 1z + 2ab + 3ab + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + **10**). **FOURTH Legacy A migration today** (after 7a #2 + 8 #2 + 9 #2 earlier). Today\'s 4 migrations cleared ~57% of the remaining Legacy A backlog in a single day. Remaining Legacy A files after today (3): `knowledge_line16.md`, `knowledge_line17.md`, `knowledge_line26.md`, `knowledge_line27abc.md` — will rename during future audits.', 'C:\\us-tax\\knowledge\\line-10-adjustments.md (renamed); C:\\us-tax\\XLS\\_tools\\generate-10.js header (updated)', 'CLOSED — file renamed + generator updated. Convergence at 17 lines.'],
  [3, 'RESOLVED 2026-05-12 — SPEC ENHANCEMENT — VERIFICATION LOG SECTION CREATED IN lines/10.md (THIRD SINGLE-LINE AUDIT VERIFICATION LOG)', '`lines/10.md` did NOT have a Verification log section. **Closure applied**: appended a new `## Verification log` section at end of file with 1 row in IN-PROGRESS state capturing the 10 walkthrough (#1 MFS guard added → 14 orchestrators + #2 knowledge file renamed → 17 lines + #3 this section creation). To be finalized to "COMPLETE — 10/10 closed" during end-of-walkthrough docs-update step. **NEW section creation — NORMAL-variant pattern**. **Single-row log** — same shape as 8 #3 + 9 #3. **THIRD single-line audit Verification log** in the workflow (after 8 #3 + 9 #3). Confirms single-row Verification logs as a stable pattern for single-line audits going forward (line 14 / 15 / 16 / 17 / 26 / 27abc future audits will likely follow).', 'lines/10.md (new Verification log section with single 10-audit row)', 'CLOSED — spec verification log section created. Third single-line audit Verification log.'],
  [4, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — LINE 10 IS THE AGI SUBTRACTOR (line11a = line9 − line10; future line 11 audit will extend)', 'Line 10 is NOT in line 9 — it is a SUBTRACTOR in AGI per spec §6.1 + IRS 2025 Form 1040 line 11a instructions ("Subtract line 10 from line 9. This is your adjusted gross income"). **Closure applied**: added a **12-line forward-cross-reference breadcrumb** at TaxReturnComputeService.java directly above `buildAdjustments` documenting: (a) line 10 = AGI subtractor (contrast with line 8 = 8th line-9 operand per 8 #4); (b) `subtractNonNegativeAllowNegative` semantic — AGI is signed (NOL carryback / refundable credit scenarios per spec §6.1; line 15 taxable income IS floored at zero later but line 11a is not); (c) `line11b = line11a` IRS copy-line semantic; (d) downstream consumers per spec §5 (line 14 deductions + line 15 taxable income + Form 8615 kiddie tax MAGI + Form 8863 education credit MAGI phaseouts); (e) **FIRST cross-reference seeded for future line 11 audit** — future line 11 audit will extend this breadcrumb with full AGI documentation (sibling/pair-audit pattern). Pure documentation closure — no functional change. **Symmetric pattern**: contrast to 8 #4 (line 8 inclusion citation at line-9 site) — line 10 is the SUBTRACTOR citation at the line-11 site. **First subtractor cross-reference in the workflow** — establishes template for future line 14 (deductions) and line 13a+13b (QBI + additional deductions) subtractor cross-references.', 'TaxReturnComputeService.java (12-line breadcrumb above `buildAdjustments` at line 4372)', 'CLOSED — forward-cross-reference breadcrumb added. First subtractor cross-reference in the workflow.'],
  [5, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — SCHEDULE 1 LINE 26 = sum(lines 11-23) + line 25 (13 + 1 = 14 operands sum)', 'At TaxReturnComputeService.java (~line 8264): `BigDecimal line26 = addNonNull(sumAmounts(line11, line12, line13, line14, line15, line16, line17, line18, line19a, line20, line21, line22, line23), line25);`. Matches 2025 IRS Schedule 1 form: line 26 = sum of Part II lines 11-23 + line 25 (which is the sub-sum of 24a-24z per 10 #6). Line 22 hard-coded null (reserved 2025). **Closure applied**: added a **22-line breadcrumb** above the line 26 derivation documenting: (a) IRS 2025 Schedule 1 Part II form structure source + spec §1 / §3.1; (b) **13-operand explicit enumeration** with per-line IRC source (line 11 §62(a)(2)(D) educator / line 13 §223 HSA / line 14 §217 Armed Forces / line 18 EWP / line 19a §215 alimony pre-2019 / line 20 §219 IRA / line 21 §221 student loan with **MFS BLOCKING per IRC §221(e)(2) cross-reference to 10 #1** / line 23 §220 MSA); (c) line 22 reserved 2025 hard-coded-null rationale; (d) lines 15/16/17 BLOCKING out-of-scope cross-reference to 10 #8; (e) line 25 sub-sum cross-reference to 10 #6; (f) `sumAmounts` null-as-zero vs outer `addNonNull` null-preserve semantic; (g) `hasAnySchedule1Input` gate short-circuit; (h) downstream pass-through cross-reference to 10 #7 + AGI subtractor role per 10 #4. Pure documentation closure — no functional change. Affirmative-verification audit-trail row pattern (same shape as 8 #5).', 'TaxReturnComputeService.java (22-line breadcrumb above Schedule 1 line 26 derivation at line 8242)', 'CLOSED — verified correct. 22-line breadcrumb with 13-operand enumeration + IRC sources + cross-references to 10 #1/4/6/7/8.'],
  [6, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — SCHEDULE 1 LINE 25 = sum of sublines 24a-24k + 24z (12-operand sub-sum)', 'At TaxReturnComputeService.java (~line 8270): `BigDecimal line25 = sumAmounts(line24a, line24b, line24c, line24d, line24e, line24f, line24g, line24h, line24i, line24j, line24k, line24z);`. 12 operands matching 2025 IRS Schedule 1 Part II sublines (24a-24k + 24z; sublines 24l-24y do NOT exist — lettering jumps 24k→24z parallel to the 8v→8z gap on Schedule 1 line 9 per 8 #6). **Closure applied**: added a **25-line breadcrumb** above the line 25 derivation documenting: (a) IRS 2025 Schedule 1 Part II source + spec §2.2; (b) **12-operand explicit enumeration** with per-subline description + linked-income-line / IRC source (24a/8h jury duty / 24b/8l rental personal property / 24c/8m Olympic backout §74(d) / 24d reforestation / 24e Trade Act 1974 / 24f §501(c)(18)(D) / 24g chaplain §403(b) / 24h §62(a)(20) discrimination attorney fees / 24i §62(a)(21) whistleblower attorney fees / 24j Form 2555 housing §911(c)(4) DISTINCT-FROM-8d-FEIE guardrail / 24k §67(e) K-1 (1041) / 24z IRS-specific write-in — NOT free-form per spec §9 / §4.13 — anti-broad-bucket guardrail cross-reference to 10 #9); (c) lettering gap rationale (24l-24y absent; parallel to 8 #6); (d) `buildSchedule1OtherAdjustmentItems` per-item structure (description + amount; owner-labeled "Taxpayer:"/"Spouse:"); (e) `sumAmounts` null-as-zero semantic; (f) downstream cross-reference to 10 #5 (line 26 parent sum). Pure documentation closure — no functional change. Affirmative-verification audit-trail row pattern (same shape as 8 #6 21-line breadcrumb).', 'TaxReturnComputeService.java (25-line breadcrumb above Schedule 1 line 25 derivation at line 8241)', 'CLOSED — verified correct. 25-line breadcrumb with 12-operand enumeration + linked-income-line / IRC source cross-references + lettering-gap rationale.'],
  [7, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — FORM 1040 LINE 10 = SCHEDULE 1 LINE 26 (direct pass-through)', 'At TaxReturnComputeService.java (~line 4402 inside `buildAdjustments`): `BigDecimal line10 = roundMoney(incomeAdjustments == null ? null : incomeAdjustments.line10FromSchedule1Line26());`. Pure pass-through; no transformation beyond `roundMoney`. Then at line ~4416: `adjustments.setAdjustmentsSchedule1(line10)` (conditional on non-null + non-null line 11a). **Closure applied**: added a **15-line breadcrumb** directly above the line 10 derivation documenting: (a) IRS 2025 line 10 instructions ("amount from Schedule 1, line 26") + spec §1 source; (b) pure pass-through (no transformation beyond `roundMoney`); (c) `incomeAdjustments.line10FromSchedule1Line26()` accessor returns Schedule 1 line 26 sum (per 10 #5 — 13+1 operand sum + 10 #6 — 12-subline line-25 sub-sum); (d) `roundMoney(null) → null` canonical contract (null when no Schedule 1 Part II input); (e) **sibling accessor** `line10FromSchedule1Pub915Subset()` for the Pub. 915 SS worksheet (different operand mix per 6b #5 — EXCLUDES line 21 student loan interest for circular-dependency avoidance + line 22 reserved); (f) persistence at `setAdjustmentsSchedule1(line10)`; (g) PDF mapping `f1_74[0]` → `line10_adjustments_to_income_schedule1_line26` (canonical per CSV row 88); (h) downstream: line 10 is AGI SUBTRACTOR `line11a = line9 - line10` per 10 #4 (signed, no zero-floor). Pure documentation closure — no functional change. Affirmative-verification audit-trail row pattern (same shape as 8 #7 11-line pass-through breadcrumb).', 'TaxReturnComputeService.java (15-line breadcrumb above Form 1040 line 10 pass-through at line 4387 inside `buildAdjustments`)', 'CLOSED — verified correct. 15-line breadcrumb with pure pass-through documentation + sibling-accessor note + PDF mapping + downstream cross-reference to 10 #4.'],
  [8, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — SE-TAX LINES 15/16/17 OUT-OF-SCOPE FLAGS (BLOCKING)', '`INCOME_ADJUSTMENTS_LINE15/16/17_OUT_OF_SCOPE` BLOCKING flags emitted at TaxReturnComputeService.java (now ~lines 8195-8217) when respective `has...OutOfScope` flags set on taxpayer or spouse form. Per `CLAUDE.md` "Out of Scope" section: Schedule C self-employment + Schedule SE half-deduction (line 15 §1401) + SE retirement plans (line 16) + SE health insurance (line 17 §162(l)) are explicitly out-of-scope. **Closure applied**: added a **15-line breadcrumb** above the three boolean derivations documenting: (a) `CLAUDE.md` product-scope rationale citation + per-line IRC sources; (b) **taxpayer-OR-spouse-trigger logic** with cross-reference to 10 #1 MFS guard (on MFS, `incomeAdjustmentsSpouse` is null-shadowed → `getBoolean(null, key)` returns null → OR collapses to taxpayer-only gating, no spouse leakage); (c) don\'t-short-circuit pattern (computation continues so the rest of Schedule 1 Part II assembles + displays; submission prevented at flag level); (d) BLOCKING severity rationale (`true` 3rd arg to `TaxReturnFlag`); (e) `LOG.errorf` observability with `LogSanitizer.hashIdentifier(uid)` (no PII leak); (f) **line-17 special note**: Form 7206 exception cases (multiple SE income sources / Form 2555 filer / qualified LTC) per spec §4.5 are also unsupported — same BLOCKING flag covers all line-17 paths. Pure documentation closure — no functional change. Affirmative-verification audit-trail row pattern (same shape as 8 #8 12-line breadcrumb but extended to 3 flags + line-17 Form 7206 exception note).', 'TaxReturnComputeService.java (15-line breadcrumb above the three out-of-scope gating blocks at line 8170)', 'CLOSED — verified correct. 15-line breadcrumb with CLAUDE.md rationale + taxpayer-OR-spouse trigger + 10 #1 MFS cross-reference + line-17 Form 7206 exception note.'],
  [9, 'RESOLVED 2026-05-12 — OBSERVATION — LINE 24Z ANTI-BROAD-BUCKET GUARDRAIL (per spec §9 + §4.13)', 'Per spec §4.13 + §9: line 24z is NOT a free-form catch-all — only populate when a specific current IRS instruction directs a write-in adjustment. Current backend `buildSchedule1OtherAdjustmentItems` accepts user-entered description+amount pairs from `otherAdjustmentsItems24z`. **Verification gap**: backend does NOT enforce the spec §9 rule that 24z should be blank unless a specific IRS instruction directs a write-in — it relies on user discretion via the form UI. **Three considerations**: (1) **Low-priority defensive gap** — most users won\'t populate 24z spuriously; (2) **UI-side enforcement appropriate** — the form intake should guide users (e.g., a "consult IRS instructions" advisory near the 24z field); (3) **Anti-fragmentation policy applied** per 7a #9 / 8 #9 precedent — spec §9 + §4.13 reference serves as canonical tracking record; if user complaint arises, spec + this audit row serve as the pointer. **Closure applied**: **13-line breadcrumb** at TaxReturnComputeService.java (above the `buildSchedule1OtherAdjustmentItems` call at line 8269) documenting: (a) spec §4.13 + §9 + 2025 IRS instructions citation; (b) backend does not enforce — relies on user discretion via UI advisory; (c) `buildSchedule1OtherAdjustmentItems` per-item structure (owner-labeled via `addSchedule1OtherAdjustmentItemsFromForm`; blank/zero filtered); (d) **NO new outstanding.md entry today** — anti-fragmentation policy applied per 7a #9 / 8 #9 precedent (Path A). **Fourth Path A anti-fragmentation application** in the workflow (after 7a #9 / 7b walkthrough / 8 #9). Pure documentation closure — no code change.', 'TaxReturnComputeService.java (13-line breadcrumb above `buildSchedule1OtherAdjustmentItems` call at line 8269)', 'CLOSED — observation. 13-line breadcrumb on 24z anti-broad-bucket guardrail. Fourth Path A anti-fragmentation application; no new outstanding entry.'],
  [10, 'RESOLVED 2026-05-12 — OBSERVATION — LINE 10 IS THE FIRST AGI-TERRITORY AUDIT + AUDIT WORKFLOW SHIFTS FROM INCOME-TERRITORY TO AGI-TERRITORY', 'Pure xlsx-flip observation — **two major boundary milestones reached today**: (1) **FIRST AGI-TERRITORY AUDIT**: line 10 is the FIRST audit at a code site DOWNSTREAM of the line-9 sum site. All 29 prior audits (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9) were income-territory audits (operands or the line-9 sum itself). Line 10 establishes the NEW pattern of AGI-territory audits. (2) **MFS-GUARD CASCADE = 14 ORCHESTRATORS (NEW CODEBASE MAXIMUM)**: extended today via 10 #1 from 13 → 14. **Cumulative through line 10**: 30 lines audited (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + **10**); 297 audit issues closed total; backend 758/758 tests pass (+1 from 10 #1 MFS lock-in); **MFS-guard cascade = 14 orchestrators** (extended today via 10 #1; codebase maximum); **line-9 consolidation = 13 audits FINAL** (unchanged — line 10 is NOT in line 9); three line-9 exclusion categories (unchanged); **four complete shared-aggregator clusters + 7ab pair + line 8/9/10 single-line composites complete**; three complete gross-vs-taxable bilateral coverage pairs (unchanged); **knowledge-file naming convergence = 17 lines** (extended today via 10 #2; 3 Legacy A files remain at knowledge_line16/17/26/27abc.md after 4 migrations today: 7a #2 + 8 #2 + 9 #2 + 10 #2); verification logs across all completed clusters/pairs/single-line audits; ZERO new outstanding.md entries in 10 walkthrough (anti-fragmentation policy continued from 7a #9 / 8 #9 / 9 #5-9 / 10 #9 — fourth Path A application). **Looking ahead — AGI-territory audits queued**: line 11a/11b (tightly-coupled pair; line 11a = line 9 − line 10; line 11b = IRS copy line; ★ line 10 cross-reference seeded today via 10 #4), then line 12a-12e (standard deduction or Schedule A; multi-row cluster), line 13a/13b (QBI + additional deductions; coupled pair), line 14 (total deductions composite), line 15 (taxable income), line 16+ (tax computation territory). **Closure**: pure xlsx-flip observation; this row is the audit-trail anchor for the boundary milestone.', 'XLS/computations/10.xlsx audit-trail (this row); no additional code change beyond 10 #1', 'CLOSED — pure xlsx-flip. FIRST AGI-territory audit; income-territory complete; MFS cascade = 14 orchestrators (new max); line 11a/11b next.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 100 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 10 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.adjustments.adjustmentsSchedule1', 'topmostSubform[0].Page1[0].f1_74[0] (line10_adjustments_to_income_schedule1_line26)', 'form-tax-return-1040.xlsx (line 10 cell)', '★ Primary output. Whole-dollar HALF_UP rounded.'],
  ['Schedule 1 Part II (full attachment)', 'Multi-page Schedule 1', 'form-tax-return-1040-schedule-1.xlsx', '★ Conditional attachment. Generated when hasAnySchedule1Input=true.'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 11a/11b (AGI)', '—', 'form-tax-return-1040.xlsx (line 11a/11b cells)', '★★ CRITICAL: AGI subtractor. line11a = line9 - line10 (signed, no zero-floor). Future line 11 audit; ★ cross-reference seeded today via 10 #4.'],
  ['Form 1040 line 15 (taxable income)', '—', 'form-tax-return-1040.xlsx (line 15 cell)', 'Indirect via line 11b → line 14 (deductions) → line 15.'],
  ['Pub. 915 SS worksheet line 7 (subset)', '—', '—', 'Uses `line10FromSchedule1Pub915Subset` (excludes line 21 + 22) per 6b #5.'],
  ['Form 8615 (kiddie tax) MAGI', '—', '—', 'Future Form 8615 audit.'],
  ['Form 8863 (education credit) MAGI', '—', '—', 'Future Form 8863 audit.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 (total income)', '—', '—', 'Line 10 is a SUBTRACTOR, NOT an addend in line 9.'],
  ['Schedule 1 line 25 (intermediate sub-sum)', '—', '—', 'Internal sub-sum only; not separately reported on Form 1040.'],
  ['Lines 15/16/17 SE-tax adjustments', '—', '—', 'Out-of-scope per CLAUDE.md; BLOCKING flags prevent submission.'],
  ['Form 1040 line 10 NOT same as Schedule 2 line 10 (different concept)', '—', '—', 'Schedule 2 line 10 = "Other taxes" sub-sum; entirely separate from Form 1040 line 10 adjustments.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 70 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
