// ============================================================================
//  Generates: C:\us-tax\XLS\computations\8.xlsx
//
//  Source-of-truth references:
//    - lines/8.md (2025 IRS-verified rule map for Form 1040 line 8 + Schedule 1 line 10)
//    - dependencies/8.md
//    - knowledge/line-8-other-income.md (renamed 2026-05-12 via 8 #2 from legacy knowledge_line8.md)
//    - TaxReturnComputeService.computeOtherIncomes() — orchestrator (~line 7775)
//    - PDF semantic CSV row 86: f1_72[0] line8_additional_income_schedule1_line10
//    - IRS 2025 Form 1040 line 8 instructions + 2025 Schedule 1 (Form 1040) Part I + Pub. 525
//    - IRC §61 (general gross income); §86(d)(1)(D) (SSI exclusion — N/A line 8); §137 (adoption);
//      §911 (foreign earned income exclusion); §951 / §951A (CFC inclusions); §461(l) (excess
//      business loss); §165(d) (gambling losses limit); §86 (taxable refunds, etc.)
//
//  Tax year: 2025
//
//  NOTE: Form 1040 line 8 is a **direct pass-through from Schedule 1 line 10**. Schedule 1 line 10
//  is the sum of Part I lines: `line1 + line2a + line3 + line4 + line5 + line6 + line7 + line9`
//  (where `line9 = sum(line8a-line8v + line8z)` — 23 sublines covering NOL, gambling, COD,
//  Form 2555 §911, Form 8853 MSA, Form 8889 HSA, Alaska PFD, jury duty, prizes, etc.).
//
//  **Line 8 is the 8th and LAST operand in Form 1040 line 9** — this audit will produce the
//  13th and FINAL line-9 operand audit citation per 7a #10 + 7b #10 + 6b #10 chain.
//
//  Line 8 audit angles:
//   • Defensive MFS guard (NOT YET ADDED — extends cascade to 13 orchestrators)
//   • Knowledge file rename (`knowledge_line8.md` → canonical form)
//   • Verification log section (NEW for `lines/8.md`)
//   • Line-9 13-audit consolidation extension (FINAL line-9 operand citation)
//   • Verified-correct breadcrumbs on Schedule 1 line 10 / line 9 sub-sum / Form 1040 pass-through
//   • Out-of-scope Schedule C / F flags
//   • Top-of-Schedule-1 1099-K entry-space (separate from line 10 arithmetic)
//   • Cluster-transition observation (last line-9 operand; workflow shifts to AGI)
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '8.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 8 — OTHER INCOME (from Schedule 1, line 10)'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 8'],
  ['Concept', 'Direct pass-through from Schedule 1 (Form 1040) line 10 — the Part I total. Schedule 1 Part I aggregates miscellaneous income sources: taxable refunds, alimony received, business/farm/rental income, unemployment, other-income sublines 8a-8v + 8z (23 categories covering NOL, gambling, COD, foreign earned exclusion, MSA/HSA, Alaska PFD, jury duty, prizes, scholarships, Medicaid waiver, NQDC, inmate wages, §951/§951A CFC inclusions, §461(l) excess business loss, etc.). **Line 8 is the 8th and LAST operand in Form 1040 line 9** (total income).'],
  ['Core invariant', '`Form1040.line8 = Schedule1.line10` (pure pass-through). Schedule 1 line 10 can be positive, zero, or negative (signed items like NOL + 8p §461(l) excess business loss reduce line 10). Line 8 IS the 8th operand in line 9 — final line-9 operand audit citation per 8 #4.'],
  ['Per-Return Formula',
    'FORM 1040 LINE 8 (direct pass-through at TaxReturnComputeService.java:4121 + 4343):\n' +
    '  line8 = roundMoney(otherIncome == null ? null : otherIncome.line8FromSchedule1())\n' +
    '  income.setOtherIncomeSchedule1(line8)\n\n' +
    'SCHEDULE 1 LINE 10 (at TaxReturnComputeService.java:7925):\n' +
    '  Schedule1.line10 = addNonNull(\n' +
    '    addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(line1, line2a), line3), line4), line5), line6), line7),\n' +
    '    line9\n' +
    '  )\n\n' +
    'SCHEDULE 1 LINE 9 — sum of sublines 8a-8v + 8z (at TaxReturnComputeService.java:7921-7924):\n' +
    '  Schedule1.line9 = sumAmounts(\n' +
    '    line8a (NOL),     line8b (gambling),  line8c (COD),       line8d (Form 2555 §911),\n' +
    '    line8e (Form 8853 MSA), line8f (Form 8889 HSA), line8g (Alaska PFD),\n' +
    '    line8h (jury duty), line8i (prizes), line8j (not-for-profit activity),\n' +
    '    line8k (stock options), line8l (rental personal property), line8m (Olympic awards),\n' +
    '    line8n (§951(a) CFC inclusion), line8o (§951A GILTI), line8p (§461(l) excess business loss),\n' +
    '    line8q (ABLE distributions), line8r (scholarship grants), line8s (Medicaid waiver),\n' +
    '    line8t (nonqualified deferred comp), line8u (inmate wages),\n' +
    '    line8v (Pension Withdrawals from non-RMD due to disaster), line8z (other write-in)\n' +
    '  )\n\n' +
    '**Schedule 1 Part I operands**:\n' +
    '  line1  — Taxable refunds, credits, or offsets of state/local income taxes\n' +
    '  line2a — Alimony received (line 2b = informational date field, NOT in arithmetic)\n' +
    '  line3  — Business income/loss (Schedule C) — out-of-scope per `hasScheduleCBusinessIncomeOutOfScope` flag\n' +
    '  line4  — Other gains/losses (Form 4797 or 4684 checkbox)\n' +
    '  line5  — Rental real estate, royalties, partnerships, S corps, trusts (Schedule E)\n' +
    '  line6  — Farm income/loss (Schedule F) — out-of-scope per `hasScheduleFFarmIncomeOutOfScope` flag\n' +
    '  line7  — Unemployment compensation (with repayment checkbox + amount)\n' +
    '  line9  — Total other income (8a-8v + 8z sum)'],
  ['Filed',
    'Form 1040 line 8 (amount) — PDF field f1_72[0] = `line8_additional_income_schedule1_line10` (canonical mapping per CSV row 86).\n' +
    'Schedule 1 (Form 1040) Part I — full Schedule 1 form generated when `hasAnySchedule1Input=true`.'],
  ['Backend method', 'TaxReturnComputeService.computeOtherIncomes() at ~line 7775 — orchestrator. **MFS guard NOT YET ADDED** (defensive gap per 8 #1 — same shape as 7a #1 / 6a #1).'],
  ['Output', 'form1040.income.otherIncomeSchedule1 (BigDecimal — Schedule 1 line 10 total). When non-null, enters the line 9 addNonNull chain as the 8th and LAST operand.'],
  ['IRS source', 'IRS 2025 Form 1040 line 8 instructions + 2025 Schedule 1 (Form 1040) Part I instructions + IRS Pub. 525 (Taxable and Nontaxable Income); IRC §61 (general gross income) + various per-subline statutes (§911 foreign earned, §951/§951A CFC, §461(l) excess business loss, §137 adoption, §86 taxable refunds, §165(d) gambling losses).'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Gather Schedule 1 Part I inputs from personal forms (taxpayer + spouse) + statements', '`other-income-taxpayer` + `other-income-spouse` personal forms; 1099-G (unemployment), 1099-C (COD), W-2 (inmate wages via box 14). Out-of-scope flags for Schedule C / F gated.'],
  [2, 'Apply MFS guard (NOT YET — per 8 #1)', '⚠️ Currently aggregates spouse data on MFS. Per 8 #1: MFS guard should null `otherIncomeSpouse` on MFS.'],
  [3, 'Validate statement gating', '`validateOtherIncomeStatementGating` emits blocking flags if forms missing when `hadAnyAdditionalIncome=true`.'],
  [4, 'Compute Schedule 1 Part I lines 1-7 (taxpayer + spouse aggregation per line)', 'Lines 1 (taxable refunds), 2a (alimony), 3 (Sched C — blocked), 4 (other gains/losses), 5 (Sched E rental), 6 (Sched F — blocked), 7 (unemployment from 1099-G).'],
  [5, 'Compute Schedule 1 Part I lines 8a-8v + 8z (23 sublines)', 'Per-subline amount aggregation (taxpayer + spouse). Several lines derived from statements (8b gambling W-2G, 8c COD 1099-C, 8u inmate wages W-2 box 14); others manual.'],
  [6, 'Compute Schedule 1 line 9 (sum of 8a-8v + 8z)', '`sumAmounts(line8a, ..., line8z)` at TaxReturnComputeService.java:7921-7924. 23 operands.'],
  [7, 'Compute Schedule 1 line 10 (sum of lines 1-7 + line 9)', '`addNonNull` chain at TaxReturnComputeService.java:7925. 8 operands (lines 1, 2a, 3, 4, 5, 6, 7 + line 9).'],
  [8, 'Gate output via `hasAnySchedule1Input` boolean', 'When all 23 sublines + 7 line-1-7 amounts are zero/null → return null (no Schedule 1 generated).'],
  [9, 'Persist on form1040.income via buildIncome', '`income.setOtherIncomeSchedule1(line8)` at line 4343 when line8 is non-null. PDF: f1_72[0] = `line8_additional_income_schedule1_line10`.'],
  [10, 'Generate Schedule 1 attachment form', 'Full Schedule 1 with Part I populated. (Part II adjustments — line 10 = adjustments total — is a SEPARATE computation: `computeIncomeAdjustments` at line 7996. Some Part I items have linked Part II adjustments — e.g., 8h/24a jury duty, 8l/24b rental, 8m/24c Olympic.)'],
  [11, 'Flow to line 9 (8th and LAST operand)', '`line9 = ... + line8` per 8 #4 13-audit consolidation. **Final line-9 operand citation.**'],
  [],
  ['MUTUAL EXCLUSION / SPECIAL RULES'],
  ['Rule', 'Implementation', 'Why'],
  ['Schedule C business income (line 3) is OUT OF SCOPE', '`hasScheduleCBusinessIncomeOutOfScope` flag at TaxReturnComputeService.java:7796 → emits `OTHER_INCOME_SCHEDULE_C_OUT_OF_SCOPE` BLOCKING flag', 'Per CLAUDE.md: "Self-employment (Schedule C / SE / F)" is out-of-scope for this product. Block at gating.'],
  ['Schedule F farm income (line 6) is OUT OF SCOPE', '`hasScheduleFFarmIncomeOutOfScope` flag at line 7798 → emits `OTHER_INCOME_SCHEDULE_F_OUT_OF_SCOPE` BLOCKING flag', 'Per CLAUDE.md: Schedule F out-of-scope. Block at gating.'],
  ['Top-of-Schedule-1 1099-K entry-space is SEPARATE from line 10 arithmetic', 'Spec §2 explicit: "this entry space is **not one of Schedule 1 lines 1 through 10**; it is **not included in the line 10 arithmetic**".', 'Per IRS 2025 Schedule 1 redesign: 1099-K amounts reported in error or from personal items sold at a loss go in this disclosure field, not into Schedule 1 line 10. Verify implementation per 8 #9.'],
  ['Line 2b is INFORMATIONAL ONLY (date field, not in arithmetic)', 'Per spec §1: "line 2b is informational only because it captures the date of the divorce or separation agreement". Code sets `additionalIncome.setAlimonyReceivedAgreementDate(line2bAgreementDate)` (text field) without including in line 10 sum.', 'Per IRS Schedule 1: line 2b is a date checkbox/text field for the divorce/separation agreement date, not a numeric amount.'],
  ['Line 8d is full Form 2555 EXCLUSION (foreign earned income + housing)', 'Per spec §3.2: "**line 8d** is the **foreign earned income exclusion and housing exclusion** from Form 2555" — not just foreign earned income.', 'Spec correction from prior draft. Both §911 exclusions (earned income + housing) report on line 8d.'],
  ['Schedule 1 line 9 is INTERMEDIATE — only line 10 flows to Form 1040 line 8', '`Schedule1.line10 = lines 1-7 + line9`. Line 9 (sum of 8a-8v + 8z) is INSIDE line 10, not separately output to Form 1040.', 'Per IRS form structure: line 9 is the "other income" total within Schedule 1; line 10 is the full Part I total that maps to Form 1040 line 8.'],
  ['Line 8 IS in line 9 (8th and LAST operand)', '`Form1040.line9 = ... + line8`. Per 8 #4: **13th and FINAL line-9 operand audit citation**.', 'IRC §61: all gross income flows through line 8 → line 9. No more line-9 operand audits after this one.'],
  [],
  ['DECISION TREE — When does line 8 carry what value?'],
  ['Scenario', 'Schedule 1 produced?', 'Form 1040 line 8'],
  ['No additional income / adjustments', 'No (hasAnySchedule1Input=false)', 'null (or 0)'],
  ['Only unemployment (line 7 from 1099-G)', 'Yes', 'Line 7 amount'],
  ['Only gambling winnings (line 8b)', 'Yes', 'Line 8b amount (via line 9 → line 10)'],
  ['Mixed Part I income (refunds + alimony + rental + 8a + 8d)', 'Yes', 'sum(line1, line2a, line5, line8a, line8d) via line 10'],
  ['NOL (line 8a) producing negative line 10', 'Yes', 'NEGATIVE — line 8 carries the loss'],
  ['§461(l) excess business loss (line 8p, negative)', 'Yes', 'Negative contribution to line 10'],
  ['Schedule C present (out-of-scope)', '⚠️ BLOCKED by `OTHER_INCOME_SCHEDULE_C_OUT_OF_SCOPE` flag', '⚠️ Not produced; user must remove Schedule C input or seek out-of-scope alternative'],
  ['Schedule F present (out-of-scope)', '⚠️ BLOCKED by `OTHER_INCOME_SCHEDULE_F_OUT_OF_SCOPE` flag', '⚠️ Same'],
  ['Stale spouse data on MFS', '⚠️ Currently aggregates (defensive gap per 8 #1)', '⚠️ Inflated line 8 / wrong Schedule 1 generated'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 8 Flows'],
  ['Consumer', 'How', 'Notes'],
  ['Form 1040 line 9 (total income) — ★ PRIMARY DOWNSTREAM', 'Line 9 formula at lines 4186-4189 — line 8 is the 8th and LAST operand. Per 8 #4: **13-audit consolidation FINAL state**.', '★★ CRITICAL: IRC §61 gross income inclusion. Last numeric line-9 operand audit.'],
  ['Form 1040 line 11a/11b (AGI), line 15 (taxable income)', 'Indirect via line 9 contribution.', 'Carries all Part I miscellaneous income through income waterfall.'],
  ['Form 1040 line 6b SS worksheet input', 'Per 6b #6 Pub. 915 worksheet line 3 — `line1z + line2b + line3b + line4b + line5b + line7a + line8`.', 'Line 8 feeds SS taxability worksheet.'],
  ['Schedule 1 (Form 1040) Part I attachment', 'Generated when hadAnyAdditionalIncome=true.', 'Full Part I form with lines 1-9 detail.'],
  ['Schedule 1 line 10 → line 8 (DIRECT pass-through)', 'Single-line in buildIncome.', 'Pure carryover; no transformation.'],
  ['NOT IN OUTPUT — Schedule 1 line 9', '—', 'Internal sum only (8a-8v + 8z); not separately reported on Form 1040.'],
  ['NOT IN OUTPUT — Top-of-Schedule-1 1099-K entry-space', '—', 'Separate disclosure field, NOT in line 10 arithmetic per spec §2.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 28 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 8'],
  ['Line 8 = Schedule 1 line 10. Schedule 1 Part I aggregates 7 lines (1, 2a, 3, 4, 5, 6, 7) plus line 9 (sum of 23 sublines 8a-8v + 8z).'],
  [],
  ['#', 'Source xlsx', 'Field path / model key', 'Schedule 1 line', 'Required?', 'Role in line 8 compute', 'Cross-reference'],
  [],
  ['SCHEDULE 1 PART I LINES 1-7 (taxpayer + spouse aggregation per line)'],
  [1, 'form-other-income-taxpayer.xlsx / form-other-income-spouse.xlsx', 'stateLocalTaxRefundsLine1', 'line 1', 'NO', 'Taxable refunds/credits/offsets of state/local income taxes. Per IRC §86 (taxable refunds rule).', 'IRS Pub. 525'],
  [2, 'form-other-income-taxpayer.xlsx / form-other-income-spouse.xlsx', 'alimonyReceivedLine2a + alimonyReceivedAgreementDateLine2b', 'line 2a (amount), 2b (date)', 'NO (line 2b INFO-only)', 'Line 2a amount: alimony received. Line 2b date: divorce/separation agreement date (informational only, NOT in arithmetic).', 'IRC §71 (pre-TCJA) / §61 (post-TCJA)'],
  [3, 'form-other-income-taxpayer.xlsx', 'hasScheduleCBusinessIncomeOutOfScope', 'line 3', '⚠️ OUT-OF-SCOPE BLOCKER', '`OTHER_INCOME_SCHEDULE_C_OUT_OF_SCOPE` BLOCKING flag. Schedule C self-employment not supported.', 'CLAUDE.md out-of-scope rule'],
  [4, 'form-other-income-taxpayer.xlsx / form-other-income-spouse.xlsx', 'otherGainsLossesLine4', 'line 4', 'NO', 'Other gains/losses from Form 4797 or 4684. User-entered (statements not auto-derived).', 'IRC §1231 / §165'],
  [5, 'form-other-income-taxpayer.xlsx / form-other-income-spouse.xlsx', 'rentalRealEstateRoyaltiesLine5', 'line 5', 'NO', 'Rental real estate, royalties, partnerships, S corps, trusts (Schedule E). User-entered.', 'IRC §469'],
  [6, 'form-other-income-taxpayer.xlsx', 'hasScheduleFFarmIncomeOutOfScope', 'line 6', '⚠️ OUT-OF-SCOPE BLOCKER', '`OTHER_INCOME_SCHEDULE_F_OUT_OF_SCOPE` BLOCKING flag. Schedule F farm income not supported.', 'CLAUDE.md out-of-scope rule'],
  [7, 'form-other-income-taxpayer.xlsx / form-other-income-spouse.xlsx + form-1099-g.xlsx', 'unemploymentCompensationLine7 + 1099-G entries', 'line 7', 'NO', 'Unemployment compensation. Statement-derived (1099-G box 1) + manual fallback. Repayment checkbox supported.', '1099-G + IRS 2025 line 7 instructions'],
  [],
  ['SCHEDULE 1 PART I LINE 8a-8v + 8z (23 sublines — 8 #6 audit)'],
  [8, 'form-other-income-taxpayer.xlsx / form-other-income-spouse.xlsx', 'netOperatingLossLine8a', '8a (NOL)', 'NO', 'Net operating loss deduction. Negative amount.', 'IRC §172'],
  [9, 'form-other-income-taxpayer.xlsx + form-w-2g.xlsx', 'gamblingLine8b + W-2G entries', '8b (gambling)', 'NO', 'Gambling winnings. Statement-derived (W-2G).', 'IRC §165(d) (losses); §61(a)'],
  [10, 'form-other-income-taxpayer.xlsx + form-1099-c.xlsx', 'cancellationOfDebtLine8c + 1099-C entries', '8c (COD)', 'NO', 'Cancellation of debt. Statement-derived (1099-C box 2).', 'IRC §61(a)(11) + Form 982 exclusions (out-of-scope)'],
  [11, 'form-other-income-taxpayer.xlsx + form-2555.xlsx', 'foreignEarnedIncomeExclusionLine8d + Form 2555 lines 45+50', '8d (Form 2555 §911)', 'NO', 'Foreign earned income exclusion + housing exclusion (Form 2555 lines 45 + 50). Per spec §3.2 correction: BOTH exclusions, not just earned income.', 'IRC §911'],
  [12, 'form-other-income-taxpayer.xlsx', 'form8853Line8e', '8e (Form 8853 MSA)', 'NO', 'Archer MSA distributions. User-entered.', 'IRC §220'],
  [13, 'form-other-income-taxpayer.xlsx', 'form8889Line8f', '8f (Form 8889 HSA)', 'NO', 'HSA distributions reported as income. User-entered.', 'IRC §223'],
  [14, 'form-other-income-taxpayer.xlsx', 'alaskaPermanentFundDividendsLine8g', '8g (Alaska PFD)', 'NO', 'Alaska Permanent Fund Dividend amount.', 'Alaska state rule'],
  [15, 'form-other-income-taxpayer.xlsx', 'juryDutyPayLine8h', '8h (jury duty)', 'NO', 'Jury duty pay received. Note: linked Part II adjustment 24a (jury duty paid to employer).', 'IRC §61'],
  [16, 'form-other-income-taxpayer.xlsx', 'prizesAwardsLine8i', '8i (prizes)', 'NO', 'Prize and award income.', 'IRC §74'],
  [17, 'form-other-income-taxpayer.xlsx', 'notForProfitActivityLine8j', '8j (not-for-profit)', 'NO', 'Income from not-for-profit (hobby) activity.', 'IRC §183'],
  [18, 'form-other-income-taxpayer.xlsx', 'stockOptionsLine8k', '8k (stock options)', 'NO', 'Stock options (non-statutory exercise gain).', 'IRC §83'],
  [19, 'form-other-income-taxpayer.xlsx', 'rentalPersonalPropertyLine8l', '8l (rental personal property)', 'NO', 'Rental of personal property (not for profit). Linked Part II adjustment 24b.', 'IRC §62(a)(4)'],
  [20, 'form-other-income-taxpayer.xlsx', 'olympicParalympicAwardsLine8m', '8m (Olympic awards)', 'NO', 'Olympic/Paralympic medals + cash awards. Linked Part II adjustment 24c (excludable under threshold).', 'IRC §74(d)'],
  [21, 'form-other-income-taxpayer.xlsx', 'section951aLine8n', '8n (§951(a) CFC)', 'NO', 'Subpart F / §951(a) controlled foreign corporation inclusion.', 'IRC §951(a)'],
  [22, 'form-other-income-taxpayer.xlsx', 'section951ALine8o', '8o (§951A GILTI)', 'NO', 'Global Intangible Low-Taxed Income (GILTI).', 'IRC §951A'],
  [23, 'form-other-income-taxpayer.xlsx', 'section461lLine8p', '8p (§461(l) excess business loss)', 'NO', 'Excess business loss limitation disallowance amount.', 'IRC §461(l)'],
  [24, 'form-other-income-taxpayer.xlsx', 'ableAccountDistributionsLine8q', '8q (ABLE)', 'NO', 'ABLE account distributions (taxable portion).', 'IRC §529A'],
  [25, 'form-other-income-taxpayer.xlsx', 'scholarshipGrantsLine8r', '8r (scholarships)', 'NO', 'Taxable scholarship/fellowship grants (qualified portion excluded).', 'IRC §117'],
  [26, 'form-other-income-taxpayer.xlsx', 'medicaidWaiverPaymentsLine8s', '8s (Medicaid waiver)', 'NO', 'Medicaid Waiver payments NOT reported on W-2.', 'Notice 2014-7 + spec §3.2'],
  [27, 'form-other-income-taxpayer.xlsx', 'nonqualifiedDeferredCompLine8t', '8t (NQDC)', 'NO', 'Non-qualified deferred compensation (§457A).', 'IRC §457A + §409A'],
  [28, 'form-other-income-taxpayer.xlsx + form-w-2.xlsx box 14 inmate wages', 'inmateWagesLine8u + employmentFormInmateWages params', '8u (inmate wages)', 'NO', 'Inmate wages (W-2 box 14 with code in some statutes).', 'IRC §61'],
  [29, 'form-other-income-taxpayer.xlsx', 'pensionDisasterDistributionLine8v', '8v (pension disaster)', 'NO', 'Pension withdrawals not subject to RMD due to disaster (income inclusion).', 'IRS disaster relief'],
  [30, 'form-other-income-taxpayer.xlsx', 'otherWriteInLine8z (with description text)', '8z (other write-in)', 'NO', 'Catch-all other income with required description.', 'IRC §61'],
  [],
  ['UPSTREAM COMPUTED INPUTS'],
  [31, '(computed — Medicaid)', 'medicaid (MedicaidComputation parameter)', 'feeds 8s computation', 'YES — passed', 'Medicaid Waiver auto-derivation from per-person Medicaid form.', '1d audit cross-ref'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 60 }, { wch: 30 }, { wch: 28 }, { wch: 80 }, { wch: 40 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 8'],
  [],
  ['Constant', 'Value', 'Source', 'Used by line 8?', 'Notes'],
  [],
  ['No direct numeric reference-data constants for line 8 itself. Multiple statutes govern individual sublines:'],
  ['Statutory references — Schedule 1 Part I lines'],
  ['§86 (taxable refunds)', 'IRC §86', 'YES — line 1', 'Tax-benefit rule for state/local refunds: taxable only if prior-year itemized deduction.'],
  ['§71 (alimony, pre-TCJA) / §61 (post-TCJA)', 'IRC §71 (repealed for 2019+) / §61 general', 'YES — line 2a', 'Alimony received: taxable for divorce decrees before 2019; non-taxable for 2019+ unless modified.'],
  ['Schedule C (self-employment) OUT-OF-SCOPE', 'CLAUDE.md', 'BLOCKING gate — line 3', 'Per product scope: SE income not supported.'],
  ['§1231 / §165 (other gains/losses)', 'IRC §1231 / §165', 'YES — line 4', 'Form 4797 / 4684 ordinary gains/losses.'],
  ['§469 (passive activity)', 'IRC §469', 'YES — line 5', 'Rental/passive income aggregation.'],
  ['Schedule F (farm income) OUT-OF-SCOPE', 'CLAUDE.md', 'BLOCKING gate — line 6', 'Per product scope: farm income not supported.'],
  ['Unemployment per 2025 line 7 instructions', 'IRS 2025 line 7 instructions', 'YES — line 7', '1099-G box 1. Repayment of prior-year amount supported.'],
  [],
  ['Statutory references — line 9 sublines (8a-8v + 8z)'],
  ['§172 (NOL)', 'IRC §172', 'YES — 8a', 'Net operating loss carryover.'],
  ['§165(d) (gambling losses limit)', 'IRC §165(d)', 'YES — 8b (winnings inclusion); affects Schedule A loss deduction', 'Gambling winnings fully taxable.'],
  ['§61(a)(11) (COD)', 'IRC §61(a)(11)', 'YES — 8c', 'Cancellation of debt income (Form 982 exclusions out-of-scope).'],
  ['§911 (foreign earned income + housing exclusion)', 'IRC §911', 'YES — 8d', 'Form 2555 lines 45 + 50 (BOTH exclusions per spec §3.2).'],
  ['§220 (Archer MSA)', 'IRC §220', 'YES — 8e', 'Form 8853 MSA taxable distribution.'],
  ['§223 (HSA)', 'IRC §223', 'YES — 8f', 'Form 8889 HSA taxable distribution.'],
  ['§74 (prizes/awards) + §74(d) (Olympic)', 'IRC §74 / §74(d)', 'YES — 8i + 8m', 'Prizes/awards taxable; Olympic awards excluded under AGI threshold.'],
  ['§183 (hobby loss / not-for-profit)', 'IRC §183', 'YES — 8j', 'Not-for-profit activity income.'],
  ['§83 (stock options)', 'IRC §83', 'YES — 8k', 'NQSO bargain element.'],
  ['§62(a)(4) (rental personal property)', 'IRC §62(a)(4)', 'YES — 8l', 'Linked Part II adjustment 24b.'],
  ['§951(a) + §951A (CFC + GILTI)', 'IRC §951(a) / §951A', 'YES — 8n + 8o', 'International tax inclusions.'],
  ['§461(l) (excess business loss)', 'IRC §461(l)', 'YES — 8p', 'Excess business loss limitation.'],
  ['§529A (ABLE)', 'IRC §529A', 'YES — 8q', 'ABLE account taxable distribution.'],
  ['§117 (scholarship)', 'IRC §117', 'YES — 8r', 'Taxable portion of scholarships/fellowships.'],
  ['Notice 2014-7 (Medicaid Waiver)', 'IRS Notice 2014-7', 'YES — 8s', 'Medicaid Waiver Payments NOT on W-2.'],
  ['§457A + §409A (NQDC)', 'IRC §457A / §409A', 'YES — 8t', 'Nonqualified deferred comp.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 40 }, { wch: 50 }, { wch: 28 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 8 + Schedule 1 Part I'],
  ['Line 8 is a direct pass-through from Schedule 1 line 10. Schedule 1 Part I is generated as a full attachment form when input is present.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['Form 1040 line 8 (amount)', 'TaxReturnComputeService.buildIncome() — income.setOtherIncomeSchedule1(line8) at line 4343', '★ Primary output. PDF: f1_72[0] = `line8_additional_income_schedule1_line10` (canonical).'],
  ['Form 1040 line 9 (total income) — ★★ CRITICAL', 'Line 9 formula at lines 4186-4189 — line 8 is the 8th and LAST operand.', '★★ INCLUDED per IRC §61. Carries to AGI → taxable income → tax. **Final line-9 operand audit per 8 #4.**'],
  ['Schedule 1 Part I attachment form', 'Generated when hadAnyAdditionalIncome=true.', 'Full Schedule 1 with lines 1, 2a, 2b date, 3, 4, 5, 6, 7 + 23 sublines (8a-8v + 8z) + line 9 total + line 10 total.'],
  ['Form 1040 line 6b SS worksheet input', 'Per 6b #6 Pub. 915 worksheet line 3.', 'Provisional income input for SS taxability.'],
  ['Indirect — line 11a/11b AGI, line 15 taxable income', 'Via line 9 contribution.', 'Carries through income waterfall.'],
  [],
  ['BLOCKING / ADVISORY FLAGS'],
  ['OTHER_INCOME_SCHEDULE_C_OUT_OF_SCOPE', 'BLOCKING', 'hasScheduleCBusinessIncomeOutOfScope=TRUE on taxpayer or spouse', 'Per CLAUDE.md product scope rule.'],
  ['OTHER_INCOME_SCHEDULE_F_OUT_OF_SCOPE', 'BLOCKING', 'hasScheduleFFarmIncomeOutOfScope=TRUE on taxpayer or spouse', 'Per CLAUDE.md product scope rule.'],
  ['Statement-gating flags', 'BLOCKING', 'Various per validateOtherIncomeStatementGating (1099-G, 1099-C, W-2 box 14 inmate)', 'When statements expected but not uploaded.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Schedule 1 line 9 (sub-sum)', '—', 'Internal sum only; not separately on Form 1040.'],
  ['Top-of-Schedule-1 1099-K entry-space', '—', 'Separate disclosure field, NOT in line 10 arithmetic per spec §2.'],
  ['Schedule 1 Part II (adjustments)', '—', 'Separate computation (computeIncomeAdjustments). Some Part I items have linked Part II adjustments (8h/24a, 8l/24b, 8m/24c).'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 8 / Other Income'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['OTHER_INCOME_SCHEDULE_C_OUT_OF_SCOPE', 'BLOCKING', 'hasScheduleCBusinessIncomeOutOfScope=TRUE on taxpayer or spouse', 'TaxReturnComputeService.java:7796-7803'],
  ['OTHER_INCOME_SCHEDULE_F_OUT_OF_SCOPE', 'BLOCKING', 'hasScheduleFFarmIncomeOutOfScope=TRUE on taxpayer or spouse', 'TaxReturnComputeService.java:7798-7808'],
  ['Statement upload gating (various)', 'BLOCKING', '1099-G / 1099-C / W-2 expected but not uploaded', 'validateOtherIncomeStatementGating'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 8 is the **LAST line-9 operand audit** — produces the 13th and FINAL line-9 operand audit citation per 7a #10 + 7b #10 + 6b #10 chain. Single-line audit; composite output (Schedule 1 line 10 = 8 operands; line 9 = 23 sublines). **The big-ticket item is Issue #1** — defensive MFS guard NOT YET ADDED at `computeOtherIncomes`. Verified 2026-05-12.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-12 — ⚠️ HIGH-PRIORITY DEFENSIVE GAP — MFS GUARD ADDED AT `computeOtherIncomes`', '⚠️ **DEFENSIVE GAP FIXED**: Pre-fix, `computeOtherIncomes` did NOT take an `isMfsReturn` parameter — orchestrator aggregated spouse Schedule 1 Part I income (lines 1-7 + 8a-8v + 8z) even on MFS returns. Spouse-data leakage paths: (a) `hadAnyAdditionalIncome` gate, (b) Schedule 1 lines 1/2a/4/5/7, (c) 23 line-8 sublines, (d) `employmentFormInmateWagesSpouse` parameter for 8u, (e) out-of-scope Schedule C/F flags. **Closure applied (three-step fix)**: (1) Added `boolean isMfsReturn` parameter to `computeOtherIncomes` signature; (2) renamed `otherIncomeSpouse` → `otherIncomeSpouseRaw` + `employmentFormInmateWagesSpouse` → `employmentFormInmateWagesSpouseRaw`; null-shadowed both on MFS (`otherIncomeSpouse = isMfsReturn ? null : otherIncomeSpouseRaw`); (3) updated call site at line 452 to pass `isMfsReturn`. Added **20-line MFS-guard breadcrumb** at TaxReturnComputeService.java:7785-7804 enumerating leakage paths + IRS line 8 bottom-line-tax-impact + 13-orchestrator cascade milestone. **NEW lock-in test** `mfsExcludesSpouseOtherIncomeFromLine8` — MFS taxpayer `otherIncomeGambling8b=$500` + STALE spouse `otherIncomeGambling8b=$2,000` → asserts `income.getOtherIncomeSchedule1()=$500` (taxpayer-only; pre-fix would produce $2,500). **Single-guard MFS cascade now applied to 13 orchestrators** (codebase maximum; 1c-1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities + computeSocialSecurityBenefits + computeCapitalGainLoss + **computeOtherIncomes**). Backend regression: 756 → 757 (+1 from lock-in test); all existing other-income tests still pass.', 'TaxReturnComputeService.java:7775-7804 (signature + 20-line MFS-guard breadcrumb + null-shadowing); line 452 (call site updated); test `mfsExcludesSpouseOtherIncomeFromLine8`', 'CLOSED — defensive gap fixed. Single-guard MFS cascade extended to 13 orchestrators (new codebase maximum).'],
  [2, 'RESOLVED 2026-05-12 — DOCUMENTATION HYGIENE — KNOWLEDGE FILE RENAME (Legacy A underscore prefix → canonical)', '`knowledge/knowledge_line8.md` used the Legacy A underscore-prefix form (different from prior Legacy B hyphen-prefix migrated during 6abcd/5abc/4abc audits). **Closure applied**: (1) renamed `knowledge/knowledge_line8.md` → `knowledge/line-8-other-income.md` (canonical form); (2) updated generator header-comment reference at `generate-8.js` line 9; (3) grep verified inbound references: only `generate-8.js` (updated). **Knowledge-file naming convergence extends to 15 lines** (1c-1i + 1z + 2ab + 3ab + 4abc + 5abc + 6abcd + 7ab + **8**). **Second Legacy A migration in the workflow** (after 7a #2 migrated `knowledge_7ab.md` earlier today). Remaining Legacy A files (3 after today): `knowledge_line16.md`, `knowledge_line17.md`, `knowledge_line26.md`, `knowledge_line27abc.md` — will rename during future audits (lines 16, 17, 26, 27abc).', 'C:\\us-tax\\knowledge\\line-8-other-income.md (renamed); C:\\us-tax\\XLS\\_tools\\generate-8.js header (updated)', 'CLOSED — file renamed + generator updated. Convergence at 15 lines.'],
  [3, 'RESOLVED 2026-05-12 — SPEC ENHANCEMENT — VERIFICATION LOG SECTION CREATED IN lines/8.md (SMALLEST LOG SHAPE — SINGLE ROW; FIRST SINGLE-LINE AUDIT TO CREATE A VERIFICATION LOG)', '`lines/8.md` did NOT have a Verification log section. **Closure applied**: appended a new `## Verification log` section at the end of the file with 1 row in IN-PROGRESS state capturing the 8 walkthrough (#1 MFS guard added → 13 orchestrators + #2 knowledge file renamed → 15 lines + #3 this section creation). To be finalized to "COMPLETE — 10/10 closed" during end-of-walkthrough docs-update step. **NEW section creation — NORMAL-variant pattern**; same shape as 7a #3 cluster-start. **SMALLEST LOG SHAPE in the audit workflow** — single-row log; no sibling lines exist for line 8. **FIRST single-line audit to create a Verification log** (prior single-line audits at 1a-1i + 1z recorded only history.md entries). Establishes precedent: future single-line audits at lines 16/17/26/27abc can follow the same per-line-audit Verification log pattern when warranted by composite-output complexity.', 'lines/8.md (new Verification log section with single 8-audit row)', 'CLOSED — spec verification log section created. SMALLEST log shape (1 row); first single-line audit Verification log precedent established.'],
  [4, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — LINE 8 IS IN LINE 9 (13-AUDIT CONSOLIDATION — FINAL line-9 operand audit citation)', 'Line 9 formula: line 8 is the 8th and LAST operand (INTENTIONALLY INCLUDED per IRC §61). **This is the FINAL line-9 operand audit citation** per 7a #10 + 7b #10 + 6b #10 chain. **Closure applied**: extended the line-9 breadcrumb at `TaxReturnComputeService.java:4139-4176` from **12 audit IDs to 13 audit IDs** (added "+ 8.xlsx Code Validation #4" to the verification block). Added line 8 operand sentence parallel to lines 4b/5b/6b/7a documenting Schedule 1 line 10 → Form 1040 line 8 with full sub-component enumeration (taxable refunds, alimony, unemployment, gambling, foreign earned exclusion, MSA/HSA, prizes, scholarships, NQDC, CFC, §461(l), etc.). Updated milestone note to **FINAL state**: "Future audits CANNOT extend the line-9 consolidation count — exhausted at 13 audits today via 8 #4 final closure. Audit workflow shifts to AGI / deductions / taxable income / tax computation territory (lines 11a/11b onwards)." Updated the boolean-clarification paragraph below to reflect new 13-audit FINAL count. Pure documentation extension — no formula change. Existing lock-in test `line9EqualsLine1zPlusOtherIncomeLines` confirms.', 'TaxReturnComputeService.java:4139-4176 (13-audit FINAL breadcrumb extension with line 8 inclusion citation) + line 4182-4188 (boolean-clarification count update); test line9EqualsLine1zPlusOtherIncomeLines', 'CLOSED — 13-audit consolidation FINAL. Last line-9 operand audit citation. Workflow shifts to AGI territory.'],
  [5, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — SCHEDULE 1 LINE 10 = lines 1 + 2a + 3 + 4 + 5 + 6 + 7 + line 9 (8-operand sum)', 'At TaxReturnComputeService.java:7956: `BigDecimal line10 = addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(line1, line2a), line3), line4), line5), line6), line7), line9);`. Matches 2025 IRS Schedule 1 form: line 10 is sum of Part I lines 1-7 + line 9. Line 2b excluded (informational date field; set via `additionalIncome.setAlimonyReceivedAgreementDate` separately). **Closure applied**: **17-line breadcrumb** at TaxReturnComputeService.java:7956-7973 above the line 10 derivation documenting: (a) IRS 2025 Schedule 1 Part I form structure source + spec §1; (b) **8-operand explicit enumeration** with per-line description and IRS line mapping; (c) line 2b exclusion rationale (informational text field; NOT in arithmetic); (d) Schedule C / F out-of-scope gating cross-reference to 8 #8; (e) `addNonNull` null-preserve semantic (null when ALL 8 null → no Schedule 1 produced); (f) cross-reference to 8 #6 (line 9 sub-sum, 23 sublines); (g) top-of-Schedule-1 1099-K entry-space exclusion (per 8 #9). Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:7956-7973 (17-line breadcrumb above Schedule 1 line 10 derivation)', 'CLOSED — verified correct. 17-line breadcrumb with 8-operand mapping table.'],
  [6, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — SCHEDULE 1 LINE 9 = sum of sublines 8a-8v + 8z (23-operand sum)', 'At TaxReturnComputeService.java:7952-7955: `BigDecimal line9 = sumAmounts(line8a, ..., line8z);` — 23 operands matching 2025 IRS Schedule 1 Part I sublines (lettering 8a-8v + 8z; sublines 8w/8x/8y do NOT exist). **Closure applied**: **21-line breadcrumb** at TaxReturnComputeService.java:7952-7972 above the line 9 derivation documenting: (a) IRS 2025 Schedule 1 Part I source + spec §3.2; (b) **23-operand explicit enumeration** with per-subline IRC source (8a NOL §172 / 8b gambling §61 / 8c COD §61(a)(11) / 8d Form 2555 §911 / 8e MSA §220 / 8f HSA §223 / 8g Alaska PFD / 8h jury duty (Part II 24a) / 8i prizes §74 / 8j hobby §183 / 8k stock options §83 / 8l rental personal property §62(a)(4) (Part II 24b) / 8m Olympic §74(d) (Part II 24c) / 8n §951(a) CFC / 8o §951A GILTI / 8p §461(l) / 8q ABLE §529A / 8r scholarships §117 / 8s Medicaid Waiver Notice 2014-7 / 8t NQDC §457A/§409A / 8u inmate wages / 8v pension-disaster-or-digital-asset / 8z catch-all write-in); (c) **spec §14 note on 8v ambiguity** — 2025 IRS redesignated 8v for digital-asset ordinary income; code field name `pensionDisasterDistributionLine8v` is historical; (d) **linked Part II adjustments** (8h/24a + 8l/24b + 8m/24c) computed at `computeIncomeAdjustments`, NOT here; (e) `sumAmounts` null-as-zero semantic (vs `addNonNull` null-preserve); (f) cross-reference to 8 #5 (line 10 sum). Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:7952-7972 (21-line breadcrumb above Schedule 1 line 9 derivation)', 'CLOSED — verified correct. 21-line breadcrumb with 23-operand enumeration + linked-adjustments note + 8v ambiguity flag.'],
  [7, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — FORM 1040 LINE 8 = SCHEDULE 1 LINE 10 (direct pass-through)', 'At TaxReturnComputeService.java:4122: `BigDecimal line8 = roundMoney(otherIncome == null ? null : otherIncome.line8FromSchedule1());`. Pure pass-through; no transformation beyond `roundMoney`. Then at line 4365: `income.setOtherIncomeSchedule1(line8)` (conditional on non-null). **Closure applied**: **11-line breadcrumb** at TaxReturnComputeService.java:4122-4132 above the pass-through documenting: (a) IRS 2025 line 8 instructions ("amount from Schedule 1, line 10") + spec §1 source; (b) pure pass-through (no transformation beyond `roundMoney`); (c) `otherIncome.line8FromSchedule1()` accessor returns Schedule 1 line 10 sum (per 8 #5 — 8-operand sum + 8 #6 — 23-subline sub-sum); (d) `roundMoney(null) → null` canonical contract (null when no Schedule 1 input); (e) downstream: line 8 is 8th and LAST operand in line 9 (per 8 #4 — 13-audit consolidation FINAL); (f) conditional persistence at line 4365; (g) PDF mapping `f1_72[0]` → `line8_additional_income_schedule1_line10` (canonical per CSV row 86). Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:4122-4132 (11-line breadcrumb above Form 1040 line 8 pass-through)', 'CLOSED — verified correct. 11-line breadcrumb with full pass-through documentation.'],
  [8, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — SCHEDULE C / F OUT-OF-SCOPE FLAGS (BLOCKING)', '`OTHER_INCOME_SCHEDULE_C_OUT_OF_SCOPE` + `OTHER_INCOME_SCHEDULE_F_OUT_OF_SCOPE` BLOCKING flags emitted at TaxReturnComputeService.java:7842-7868 when respective flags set on taxpayer or spouse form. Per `CLAUDE.md` "Out of Scope" section: Schedule C self-employment + Schedule F farm income are explicitly out-of-scope. **Closure applied**: **12-line breadcrumb** at TaxReturnComputeService.java:7838-7849 above the two boolean derivations documenting: (a) `CLAUDE.md` product-scope rationale citation; (b) two BLOCKING flags + don\'t-short-circuit pattern (computation continues; flag prevents submission); (c) **taxpayer-OR-spouse-trigger logic** with cross-reference to 8 #1 MFS guard (otherIncomeSpouse nulled on MFS → spouse-side check returns FALSE → taxpayer-only gating on MFS); (d) BLOCKING severity rationale (`true` 3rd arg to TaxReturnFlag); (e) `LOG.errorf` observability with hashed actor ID. Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:7838-7849 (12-line breadcrumb above Schedule C / F out-of-scope gating)', 'CLOSED — verified correct. 12-line breadcrumb with CLAUDE.md rationale + taxpayer-OR-spouse trigger.'],
  [9, 'RESOLVED 2026-05-12 — OBSERVATION — TOP-OF-SCHEDULE-1 1099-K ENTRY-SPACE NOT IMPLEMENTED (verified gap; anti-fragmentation policy applied)', 'Per spec §2: 2025 Schedule 1 has a top-of-form entry space for 1099-K amounts reported in error or from personal items sold at a loss. **NOT part of line 10 arithmetic** — separate disclosure field. **Verified via grep**: NO implementation exists — no `topOfFormPersonalItems` / `reportedInError` / `line0AmountReportedInError` / `schedule1Top` fields on `Schedule1AdditionalIncome` model; 1099-K entries (loaded at TaxReturnComputeService.java:277) are routed to OTHER compute methods (e.g., 1c non-W2 wages per CLAUDE.md) but NOT to a Schedule 1 top-of-form disclosure. **Three considerations**: (1) **NO tax-calculation impact** — spec §2 explicit that field is not in line 10 arithmetic; line 8 / line 9 / line 10 / AGI / tax are correct without it; (2) **Narrow user population** — affects only 1099-K filers with erroneous amounts OR personal items sold at a loss; most 1099-K filers report normal income; (3) **Workaround exists** — user can manually disclose via attached statement or write-in on the return. **Closure**: pure xlsx-flip observation — verified gap is acknowledged. **NO new outstanding.md entry today** — anti-fragmentation policy applied per 7a #9 precedent (spec §2 reference serves as canonical tracking record; if user complaint about 1099-K disclosure arises, spec §2 + this audit row provide a clear pointer to the missing implementation). Path A (anti-fragmentation) consistent with 7a #9 precedent. Pure documentation closure — no code change.', 'TaxReturnComputeService.java (grep verified: no top-of-form 1099-K field exists); lines/8.md §2 (canonical tracking)', 'CLOSED — observation. Verified gap; anti-fragmentation policy applied; no new outstanding entry.'],
  [10, 'RESOLVED 2026-05-12 — OBSERVATION — LINE 8 IS THE LAST LINE-9 OPERAND AUDIT + AUDIT WORKFLOW SHIFTS TO AGI TERRITORY', 'Pure xlsx-flip observation — **two major completion milestones reached today**: (1) **Line-9 operand citation list is EXHAUSTED at 13 audits FINAL** (per 8 #4 — last numeric operand in line 9 sum); (2) **Audit workflow pattern transitions COMPLETE** (single-line, income-pair, distribution-cluster, 4-sub-line-cluster, tightly-coupled-pair all exhausted per 7b #10; today\'s line 8 completes the income-territory). **Cumulative through line 8**: 28 lines audited (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8); 277 audit issues closed total; backend 757/757 tests pass (+1 from 8 #1 MFS lock-in); **MFS-guard cascade = 13 orchestrators** (extended today via 8 #1; codebase maximum); **line-9 consolidation = 13 audits FINAL** (extended today via 8 #4; exhausted); three line-9 exclusion categories formalized; **four complete shared-aggregator clusters** + **7ab pair complete** + **line 8 single-line composite complete**; three complete gross-vs-taxable bilateral coverage pairs; **knowledge-file naming convergence = 15 lines** (extended today via 8 #2; 4 Legacy A files remain at knowledge_line16/17/26/27abc.md); verification logs across all completed clusters/pairs/single-line; ZERO new outstanding.md entries in 8 walkthrough (anti-fragmentation policy continued from 7a #9). **Looking ahead — what\'s next**: future audits begin **line 9** (total income formula itself — already extensively documented at line-9 breadcrumb; minimal audit), then **line 10** (adjustments to income; similar single-line composite shape as line 8 — Schedule 1 Part II line 26 total). After line 10: **AGI territory** (11a/11b coupled pair; line 9 − line 10), **deductions** (12a-12e cluster + 13a/13b pair + line 14 composite), **taxable income** (15), **tax computation** (16+). The income-territory audits (lines 1-8) are now COMPLETE. Line-9 13-audit consolidation cannot be extended; future audits establish NEW patterns at NEW code sites (AGI computation, deduction logic, tax-computation worksheets).', 'XLS/computations/8.xlsx audit-trail (this row); no code change', 'CLOSED — pure xlsx-flip. FINAL line-9 operand audit; income-territory complete; transition to AGI territory.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 100 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 8 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.otherIncomeSchedule1', 'topmostSubform[0].Page1[0].f1_72[0] (line8_additional_income_schedule1_line10)', 'form-tax-return-1040.xlsx (line 8 cell)', '★ Primary output. Whole-dollar HALF_UP rounded.'],
  ['Schedule 1 Part I (full attachment)', 'Multi-page Schedule 1', 'form-tax-return-1040-schedule-1.xlsx', '★ Conditional attachment. Generated when hasAnySchedule1Input=true.'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 9 (total income)', '—', 'form-tax-return-1040.xlsx (line 9 cell)', '★★ INCLUDED as 8th AND LAST operand. Per 8 #4: FINAL line-9 operand audit citation.'],
  ['Form 1040 line 11a/11b (AGI), line 15 (taxable income)', '—', 'form-tax-return-1040.xlsx (downstream cells)', 'Carries through income waterfall via line 9.'],
  ['Form 1040 line 6b SS worksheet input', '—', '—', 'Pub. 915 worksheet line 3 includes line 8 per 6b #6.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Schedule 1 line 9 (intermediate sum)', '—', '—', 'Internal sum only; not separately reported on Form 1040.'],
  ['Top-of-Schedule-1 1099-K entry-space', '—', '—', 'Separate disclosure field per spec §2.'],
  ['Schedule 1 Part II adjustments', '—', '—', 'Separate computation (line 10 of Schedule 1 Part II = line 26).'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 70 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
