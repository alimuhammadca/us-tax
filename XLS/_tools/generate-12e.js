// ============================================================================
//  Generates: C:\us-tax\XLS\computations\12e.xlsx
//
//  Source-of-truth references:
//    - lines/12abcde.md (Verification log rows 1+2+3+4 via 12a/b/c/d #3)
//    - dependencies/12abcde.md
//    - knowledge/line-12abcde-deductions.md (renamed via 12a #2)
//    - TaxReturnComputeService.computeLine12() at line ~2924 — orchestrator; line 12e
//      derivation at line ~3195 (`chooseLine12e()` multi-path branching)
//    - `computeStandardDeduction()` at line 3274 — 5-path branching (null / hard-zero
//      / dependent worksheet / age-blind chart / base) — ANCHOR for deferred docs
//      from 12a #7 + 12b #7 + 12c #7 + 12d #8
//    - `chooseLine12e()` at line 3400 — 3-path (ITEMIZED / STANDARD / AUTO=max)
//    - `chooseDeductionType()` at line 3412 — "Standard" / "Itemized" label
//    - `buildScheduleA()` at line 3302 — Schedule A line 17 + line 16 combined
//    - `saltLimitForStatusAndMagi()` (used at line 3324) — 2025 SALT cap
//    - PDF semantic CSV row 151: f2_02[0] line12_standard_deduction_or_itemized_deductions
//    - ReferenceData.java — base standard deductions + per-box addons + SALT cap
//      constants ($15,750 / $31,500 / $23,625 / $2,000 / $1,600 / $40,000 / etc.)
//
//  Tax year: 2025
//
//  NOTE: Line 12e is the **FINAL NUMERIC OUTPUT** of the line-12 section — the
//  deduction amount (Standard deduction OR itemized deductions OR disaster-loss-
//  increased-standard). Multi-path branching per spec §8:
//    (a) increased_standard_deduction_for_net_qualified_disaster_loss AND NOT itemize:
//        line12e = ScheduleA.line16_combined_amount (per spec §7)
//        (backend: standardDeduction = standardDeductionBase + scheduleA.netQualifiedDisasterLoss
//         when scheduleA.usedForStandardDeductionIncrease=TRUE; then chooseLine12e
//         returns this augmented standard)
//    (b) itemize_selected: line12e = ScheduleA.line17
//    (c) else: line12e = computed_standard_deduction (base / dependent worksheet /
//        age-blind chart)
//  NOT a blind max(standard, itemized) — taxpayer may elect to itemize even when
//  itemized < standard (per spec §6.4 + §8.2 + §11). Backend AUTO election defaults
//  to max() as a tax-optimization heuristic; ITEMIZED-explicit election overrides
//  to itemize even when lower.
//
//  **Line 12e audit positioning** (CLUSTER-CLOSING AUDIT):
//   • 5th AND FINAL sub-line in the 12abcde deductions cluster
//   • Cluster log progresses 4 → 5 of 5 (FINAL state; LARGEST cluster log in workflow,
//     exceeds 6abcd 4-row prior max)
//   • FOURTH AND FINAL extension of the 12a #4 cluster-level seed (4 of 4 done;
//     cluster reaches FINAL breadcrumb state)
//   • FINAL sibling-mate cross-reference (4 of 4 = LARGEST cascade in workflow)
//   • **ANCHOR SITE** for deferred deep documentation from 12a #7 + 12b #7 + 12c #7
//     + 12d #8 — dependent worksheet (§5.3) + hard-zero gate (§5.2) + age/blind chart
//     (§5.4) + downstream addon paths (§5.3 + §5.4)
//
//  Line 12e audit angles:
//   • Sibling-mate MFS observation (line 12e is inline computation in computeLine12;
//     no orchestrator entry; inherits structurally)
//   • Pair-mate knowledge-file FINAL cross-reference (4 of 4)
//   • Verification log 5th row append — closes the cluster log
//   • FOURTH AND FINAL cluster-level seed extension — closes the cluster-level
//     breadcrumb; the anchor for deferred docs lands here
//   • Verified-correct on chooseLine12e() multi-path branching per spec §8
//   • Verified-correct (DEEP) on computeStandardDeduction() — closes deferred docs
//     from 12a/b/c/d for hard-zero + dependent worksheet + age/blind chart + base
//   • Verified-correct on disaster-loss increased-standard path (spec §7)
//   • Verified-correct on 2025 base standard deduction reference data (spec §5.1)
//   • Verified-correct on 2025 SALT cap implementation (spec §6.3)
//   • Boundary milestone — CLOSES the 12abcde cluster (FINAL state across all
//     dimensions); 37 lines audited cumulatively
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '12e.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 12e — STANDARD DEDUCTION OR ITEMIZED DEDUCTIONS (FINAL NUMERIC OUTPUT)'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 12e (page 2; numeric amount; the cluster\'s FINAL output)'],
  ['Concept', 'Final deduction amount on Form 1040 — chosen from one of THREE paths: (a) increased-standard-deduction-for-net-qualified-disaster-loss (Schedule A line 16 combined, NOT line 17); (b) itemized deductions (Schedule A line 17); (c) computed standard deduction (base / dependent worksheet per spec §5.3 / age-blind chart per spec §5.4). Multi-path branching per spec §8. **5th AND FINAL sub-line in the 12abcde deductions cluster** — CLOSES the cluster across all dimensions (cluster log at 5 rows; 4-cross-reference sibling-mate cascade; 4-of-4 cluster-level seed extensions; deferred-documentation anchor).'],
  ['Core invariant', 'Multi-path per spec §8: (a) disaster-loss-increased-standard → ScheduleA.line16_combined; (b) ITEMIZED election → ScheduleA.line17; (c) AUTO/STANDARD → computed standard deduction. Backend AUTO defaults to `max(standard, itemized)` tax-optimization; ITEMIZED-explicit election lets the user itemize even when itemized < standard (per spec §6.4 + §8.2). Reference data: base $15,750/$31,500/$23,625 + per-box $2,000/$1,600 + 2025 SALT cap $40,000/$20,000 MFS reduced to floor $10,000/$5,000 above MAGI $500,000/$250,000.'],
  ['Per-Return Formula',
    'STEP 1 — STANDARD DEDUCTION at `computeStandardDeduction()` (line 3274; 5 paths):\n' +
    '  if (status == null) return null;                              // defensive\n' +
    '  if (line12b || line12c) return BigDecimal.ZERO;               // hard-zero (§5.2)\n' +
    '  if (line12a) {                                                // dependent (§5.3)\n' +
    '    line2 = earned_income > $900 ? earned_income + $450 : $1,350;\n' +
    '    limitedBase = min(line2, baseForStatus);\n' +
    '    addOn = line12dCount × per_box_addon;  // $2,000 Single/HOH or $1,600 others\n' +
    '    return limitedBase + addOn;\n' +
    '  }\n' +
    '  if (line12dCount > 0) return ageBlindChart(status, count);    // (§5.4)\n' +
    '  return baseStandardDeductionForStatus(status);                // base (§5.1)\n\n' +
    'STEP 2 — DISASTER-LOSS AUGMENTATION at line 3189-3193 (spec §7):\n' +
    '  if (scheduleA.usedForStandardDeductionIncrease == TRUE) {\n' +
    '    standardDeduction = standardDeduction + scheduleA.netQualifiedDisasterLoss;\n' +
    '    // → augmented standard = ScheduleA.line16_combined (spec §7)\n' +
    '  }\n\n' +
    'STEP 3 — ITEMIZED at line 3194:\n' +
    '  itemized = scheduleA.totalItemizedDeductions  // Schedule A line 17\n\n' +
    'STEP 4 — FINAL ELECTION at `chooseLine12e()` (line 3400; 3 paths):\n' +
    '  if (election == "ITEMIZED") return itemized;\n' +
    '  if (election == "STANDARD") return standard;\n' +
    '  return max(standard, itemized);  // AUTO — tax-optimization default\n\n' +
    'STEP 5 — Schedule A line 18 flag (line 3199-3202):\n' +
    '  if (ITEMIZED election AND itemized < standard)\n' +
    '    scheduleA.electsToItemizeAlthoughLessThanStandard = TRUE;\n\n' +
    'STEP 6 — Persistence (line 3208):\n' +
    '  deductions.setDeductionAmount(line12e);  // JSON: form1040.deductions.deductionAmount\n\n' +
    '**PDF mapping**: `f2_02[0]` = `line12_standard_deduction_or_itemized_deductions`\n' +
    '(CSV row 151; canonical per IRS form layout — "Line 12" area at sub-letter 12e).'],
  ['Filed',
    'Form 1040 line 12e (page 2; numeric amount) — PDF field `f2_02[0]` = `line12_standard_deduction_or_itemized_deductions` (CSV row 151; rect (504, 684, 576, 695.999)). Semantic key uses "line12" (no "e" suffix) because it represents the IRS form\'s "Line 12 Standard Deduction or Itemized Deductions" area placement; the sub-letter "12e" is the spec-level field identifier per spec §2.1 rewrite (12a #8). NOT a drift — IRS form layout convention.'],
  ['Backend method', '**Multi-stage within computeLine12()** — `computeStandardDeduction()` at line 3274 (5-path branching) + `buildScheduleA()` at line 3302 + disaster-loss augmentation at line 3189-3193 + `chooseLine12e()` at line 3400 (3-path election branching) + `chooseDeductionType()` at line 3412 for the "Standard"/"Itemized" label. Persistence at line 3208 via `deductions.setDeductionAmount(line12e)`. **No additional MFS guard** — line 12e is inline-computed; inherits transitively from 12a #1 SURGICAL guard.'],
  ['Output', 'form1040.deductions.deductionAmount (BigDecimal). Whole-dollar HALF_UP rounded. Per spec §1.2 (post-12a #8 rewrite): this is the canonical line 12e numeric output. Companion field `deductionType` = "Standard" or "Itemized" label.'],
  ['IRS source', 'IRS 2025 Form 1040 line 12e + lines/12abcde.md spec §1.2 + §2.1 (post-12a #8 rewrite) + §5 (standard deduction) + §6 (Schedule A itemized) + §7 (disaster-loss increased-standard) + §8 (final mapping) + §11 (implementation guardrails). Statutory basis: IRC §63 (standard deduction framework) + IRC §63(f) (additional for age/blind) + IRC §164(b)(6) (SALT cap) + Rev. Proc. 2024-40 (2025 inflation adjustments).'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Compute standard deduction base via `computeStandardDeduction()` (line 3274; 5-path)', 'Paths: null-status defensive → hard-zero (12b/c) → dependent worksheet (12a; spec §5.3) → age/blind chart (12d>0; §5.4) → base (§5.1). Uses ReferenceData per-box addons + base amounts.'],
  [2, 'Build Schedule A via `buildScheduleA()` (line 3302)', 'Includes 2025 SALT cap via `saltLimitForStatusAndMagi()` at line 3324 (per spec §6.3 — $40,000 / $20,000 MFS reduced above MAGI thresholds but not below $10,000 / $5,000). Schedule A line 16 captures disaster-loss; line 17 = total itemized.'],
  [3, 'Augment standard deduction for disaster-loss path (line 3189-3193)', 'If `scheduleA.usedForStandardDeductionIncrease=TRUE` → standard = base_standard + `scheduleA.netQualifiedDisasterLoss` (per spec §7). Yields the "Schedule A line 16 combined amount" recipe from spec §7.'],
  [4, 'Compute itemized from Schedule A (line 3194)', 'itemized = `scheduleA.totalItemizedDeductions` (Schedule A line 17).'],
  [5, 'Choose final line 12e via `chooseLine12e()` (line 3400; 3-path)', 'ITEMIZED election → itemized; STANDARD election → standard; AUTO → `max(standard, itemized)` (tax-optimization default per spec §8.2 — ITEMIZED-explicit override available).'],
  [6, 'Compute deduction type label via `chooseDeductionType()` (line 3412)', 'Returns "Standard" or "Itemized" for UI display. Same election branching.'],
  [7, 'Schedule A line 18 flag (line 3199-3202)', 'If user explicitly elects ITEMIZED but itemized < standard, set `scheduleA.electsToItemizeAlthoughLessThanStandard=TRUE` (per spec §6.4).'],
  [8, 'Persist on form1040.deductions.deductionAmount (line 3208)', 'JSON field: `deductionAmount` (BigDecimal). Also `deductionType` label. PDF: `f2_02[0]` = `line12_standard_deduction_or_itemized_deductions`.'],
  [9, 'Flow downstream to line 14 / line 15 / line 16 / tax computation', 'line 14 = line 12e + line 13a + line 13b; line 15 = max(0, AGI − line 14) — floored at zero (per future line 15 audit). Tax computed off line 15.'],
  [],
  ['MUTUAL EXCLUSION / SPECIAL RULES'],
  ['Rule', 'Implementation', 'Why'],
  ['Multi-path branching at chooseLine12e — NOT a blind max() as the SOLE rule', 'ITEMIZED election → itemized (even if < standard); STANDARD election → standard; AUTO → max() as default. Backend respects user election.', 'Per spec §6.4 + §8.2 + §11: taxpayer may elect to itemize even when itemized < standard. Backend AUTO default is a tax-optimization heuristic; explicit elections override correctly.'],
  ['Disaster-loss increased-standard path (spec §7)', 'Standard deduction is AUGMENTED by `scheduleA.netQualifiedDisasterLoss` when `scheduleA.usedForStandardDeductionIncrease=TRUE` (line 3189-3193). Yields the Schedule A line 16 combined amount per spec §7.', 'Per spec §7: when claiming an increased standard deduction for a net qualified disaster loss AND not itemizing, line 12e = Schedule A line 16 combined (NOT line 17). The backend\'s augmentation pattern functionally matches.'],
  ['Hard-zero overrides everything (spec §5.2)', '`computeStandardDeduction()` line 3283-3285: `if (line12b || line12c) return BigDecimal.ZERO;`. This is checked FIRST (before dependent worksheet, age/blind chart, or base) — trumps line 12a + 12d.', 'Per spec §5.2 + IRC §63(c)(6)(A)/(B): MFS-spouse-itemizes (line 12b) and dual-status alien (line 12c) cannot claim standard deduction. Closure of deferred 12b #7 + 12c #7 documentation.'],
  ['Dependent worksheet trumps age/blind chart (spec §5.3 + §11)', 'When line12a=TRUE, `computeStandardDeduction()` routes to dependent worksheet (line 3286-3295) NOT age/blind chart (line 3296-3298). Age/blind addons flow through worksheet line 4b, not the chart.', 'Per spec §5.3 + §11: "Do not use the age/blind chart when line 12a dependent status applies." Closure of deferred 12a #7 documentation.'],
  ['Schedule A line 18 flag fires only on explicit ITEMIZED election with itemized<standard', 'Set at line 3199-3202: `if (ITEMIZED election AND positive both AND itemized < standard) scheduleA.electsToItemizeAlthoughLessThanStandard=TRUE`.', 'Per spec §6.4: Schedule A line 18 is checked when the taxpayer explicitly elects to itemize even though itemized < standard (consistent with spec §8.2 allowing this).'],
  ['Section 962 election / section 250 deduction NOT on line 12e', 'Per spec §9: §962 election + §250 deduction relate to tax on line 16, NOT a deduction on line 12e.', 'Spec §9 + §11: do NOT report §962/§250 amounts on line 12e. (Out of immediate scope for the 12abcde audit; relevant for line 16+ tax-computation audits.)'],
  ['NO additional MFS guard needed at line 12e site', 'Line 12e is inline-computed in `computeLine12()` body; no separate orchestrator. Inherits MFS protection transitively from 12a #1 SURGICAL guard (all 5 spouse-side fields properly classified).', '**SEVENTH defensive-gap-NOT-needed Issue #1 in the workflow** — completes the 12abcde cluster\'s structural-inheritance pattern (all 5 sub-lines inherit MFS protection without dedicated guards).'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 12e Flows'],
  ['Consumer', 'How', 'Notes'],
  ['Form 1040 line 14 — ★★ PRIMARY DOWNSTREAM', '`line14 = line12e + line13a + line13b` per dependencies/12abcde.md §3.', '★★ Total deductions composite; future line 14 audit will document.'],
  ['Form 1040 line 15 — ★★ INDIRECT', '`line15 = max(0, line11b − line14)` — first audit with zero-floor rule. Per future line 15 audit.', '★★ Taxable income; AGI − total deductions, floored at zero.'],
  ['Form 1040 line 16 (Tax) — INDIRECT', 'Via line 15 → tax table / QDCG worksheet / Tax Computation Worksheet etc.', 'Per future line 16 audit.'],
  ['Schedule A attachment (when itemizing or disaster-loss path)', '`scheduleA.usedForItemizedDeduction = TRUE` set when deductionType == "Itemized".', 'Per dependencies/12abcde.md §3.'],
  ['Form 4684 attachment (disaster-loss path)', 'Via `buildLine12Form4684Attachment(scheduleA)` at line 3210.', 'Conditional attachment when disaster-loss applies.'],
  ['PDF c2_02[0] (line 12e numeric box)', 'Frontend writes `deductions.deductionAmount` to `line12_standard_deduction_or_itemized_deductions`.', 'Canonical mapping per CSV row 151.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 28 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 12e'],
  ['Line 12e is a composite output combining standard-deduction inputs (line 12a/12b/12c/12d + earned income for dependent worksheet) + itemized-deduction inputs (Schedule A line items) + deduction election. Many inputs are sub-line outputs from prior 12abcde audits.'],
  [],
  ['#', 'Source', 'Field', 'Type', 'Role', 'Cross-reference'],
  [1, 'computeLine12 body', 'line12a (boolean)', 'Boolean', 'Routes to dependent worksheet (spec §5.3) when TRUE', '12a #1+5 cross-references; computeStandardDeduction line 3286-3295'],
  [2, 'computeLine12 body', 'line12b (boolean)', 'Boolean', 'Hard-zero trigger (spec §5.2 + IRC §63(c)(6)(A))', '12b #5 + #7 cross-references; computeStandardDeduction line 3283-3285'],
  [3, 'computeLine12 body', 'line12c (boolean)', 'Boolean', 'Hard-zero trigger (spec §5.2 + IRC §63(c)(6)(B))', '12c #5 + #7 cross-references; computeStandardDeduction line 3283-3285'],
  [4, 'computeLine12 body', 'line12dCount (integer 0-4)', 'Integer', 'Per-box addon multiplier (spec §5.3 worksheet line 4b + §5.4 chart)', '12d #5 + #7 + #8 cross-references; computeStandardDeduction line 3293 + 3296-3298'],
  [5, 'filing-status', 'filingStatus', 'String', 'Selects base standard deduction + SALT cap variant + per-box addon variant', 'Per spec §5.1 + §5.4 + §6.3'],
  [6, 'standard-deductions-taxpayer', 'dependentStandardDeductionEarnedIncome', 'BigDecimal', 'Drives dependent worksheet line 2 when line12a=TRUE (spec §5.3)', 'Auto-imported from line 1z total wages if user has not entered (line 3180-3185)'],
  [7, 'standard-deductions-taxpayer', 'deductionElection', 'String', '"AUTO" / "STANDARD" / "ITEMIZED" — controls chooseLine12e branching', 'Default AUTO; ITEMIZED-explicit allows itemize even if < standard (spec §8.2)'],
  [8, 'standard-deductions-taxpayer (Schedule A fields)', 'medicalDentalExpensesPaid + stateLocalTaxChoice + stateLocalIncomeTaxesPaid + stateLocalSalesTaxesPaid + realEstateTaxesPaid + personalPropertyTaxesPaid + homeMortgageInterestPaid + homeMortgagePointsPaid + investmentInterestPaid + netInvestmentIncome + charitableCashContributions + charitableNonCashContributions + personalCasualtyAndTheftLoss + foreignTaxesPaid + otherAllowedItemizedDeductions + netQualifiedDisasterLoss + electDisasterLossStandardDeductionIncrease + electsToItemizeAlthoughLessThanStandard', 'Various', 'Schedule A inputs (line 17 itemized total + line 16 disaster-loss combined)', 'Per dependencies/12abcde.md §2.1; processed in buildScheduleA() line 3302'],
  [9, 'Adjustments (line 11b)', 'agi', 'BigDecimal', 'Medical floor (7.5% × AGI) + SALT MAGI reduction threshold + dependent worksheet earned-income comparison', 'Per spec §6.2 medical floor + §6.3 SALT phaseout'],
  [10, 'computeLine12 body', 'income.totalWages (line 1z)', 'BigDecimal', 'Fallback for dependent worksheet earned income when user not entered (line 3180-3185)', '1z #7 line-9 inclusion citation'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 65 }, { wch: 14 }, { wch: 70 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 12e (LARGEST reference-data set in the 12abcde cluster)'],
  [],
  ['Constant', 'Value (2025)', 'Source / Statutory Basis', 'Notes'],
  [],
  ['2025 Base Standard Deduction (spec §5.1)'],
  ['Single / MFS', '$15,750', 'ReferenceData (per Rev. Proc. 2024-40 + IRC §63(c))', 'Used in `baseStandardDeductionForStatus()`.'],
  ['MFJ / QSS', '$31,500', 'ReferenceData (per Rev. Proc. 2024-40 + IRC §63(c))', 'Joint-filer base.'],
  ['HOH', '$23,625', 'ReferenceData (per Rev. Proc. 2024-40 + IRC §63(c))', 'Head-of-household base.'],
  [],
  ['Per-box Addon for Age/Blind (spec §5.3 worksheet + §5.4 chart)'],
  ['Per-box addon — Single/HOH', '$2,000', 'ReferenceData.STANDARD_DEDUCTION_ADDITIONAL_SINGLE_OR_HOH_PER_BOX (per IRC §63(f) + Rev. Proc. 2024-40)', 'Verified via 12d audit; line 12d count × per-box-addon.'],
  ['Per-box addon — MFJ/MFS/QSS', '$1,600', 'ReferenceData.STANDARD_DEDUCTION_ADDITIONAL_MARRIED_PER_BOX', 'Smaller addon for married filers.'],
  [],
  ['Dependent Standard Deduction Worksheet (spec §5.3)'],
  ['Earned-income threshold', '$900', 'ReferenceData.STANDARD_DEDUCTION_DEPENDENT_EARNED_INCOME_THRESHOLD', 'Below threshold → minimum $1,350; above → earned_income + $450.'],
  ['Earned-income addon', '$450', 'ReferenceData.STANDARD_DEDUCTION_DEPENDENT_EARNED_INCOME_ADDON', 'Added when earned_income > $900.'],
  ['Minimum dependent standard deduction', '$1,350', 'ReferenceData.STANDARD_DEDUCTION_DEPENDENT_MINIMUM', 'Floor when earned_income ≤ $900.'],
  [],
  ['2025 SALT Cap (spec §6.3 — NEW for 2025; replaces flat $10,000/$5,000)'],
  ['SALT cap — Single/MFJ/HOH/QSS', '$40,000', 'ReferenceData.SCHEDULE_A_SALT_LIMIT_* (per IRC §164(b)(6) post-OBBBA + Rev. Proc. 2024-40)', 'Per spec §6.3 + §11 ("Do not use the old flat $10,000/$5,000 SALT cap for 2025").'],
  ['SALT cap — MFS', '$20,000', 'ReferenceData.SCHEDULE_A_SALT_LIMIT_MFS', 'Half the non-MFS cap.'],
  ['SALT phaseout threshold — Single/MFJ/HOH/QSS', '$500,000', 'ReferenceData.SCHEDULE_A_SALT_PHASEOUT_THRESHOLD_DEFAULT', 'Above this MAGI, cap is reduced.'],
  ['SALT phaseout threshold — MFS', '$250,000', 'ReferenceData.SCHEDULE_A_SALT_PHASEOUT_THRESHOLD_MFS', 'Half threshold for MFS.'],
  ['SALT floor — Single/MFJ/HOH/QSS', '$10,000', 'ReferenceData.SCHEDULE_A_SALT_FLOOR_DEFAULT', 'Reduction cannot drop cap below this floor.'],
  ['SALT floor — MFS', '$5,000', 'ReferenceData.SCHEDULE_A_SALT_FLOOR_MFS', 'Half floor for MFS.'],
  [],
  ['Schedule A — Medical Deduction Floor (spec §6.2)'],
  ['Medical floor rate', '7.5% × AGI', 'ReferenceData.SCHEDULE_A_MEDICAL_FLOOR_RATE (per IRC §213(a))', 'Only deduct medical/dental above 7.5% of AGI.'],
  [],
  ['Statutory references'],
  ['IRC §63 (Standard deduction framework)', 'IRC §63', 'YES — primary statute', 'Authorizes the standard deduction.'],
  ['IRC §63(c) (Standard deduction amounts)', 'IRC §63(c)', 'YES — 2025 base amounts', 'Per Rev. Proc. 2024-40 inflation-adjusted amounts.'],
  ['IRC §63(c)(6)(A) (MFS-spouse-itemizes hard-zero)', 'IRC §63(c)(6)(A)', 'YES — line 12b trigger', 'Verified via 12b #7.'],
  ['IRC §63(c)(6)(B) (Dual-status hard-zero)', 'IRC §63(c)(6)(B)', 'YES — line 12c trigger', 'Verified via 12c #7.'],
  ['IRC §63(f) (Additional standard deduction for age/blind)', 'IRC §63(f)', 'YES — line 12d per-box addons', 'Verified via 12d #5 + #8.'],
  ['IRC §164(b)(6) (SALT cap)', 'IRC §164(b)(6)', 'YES — spec §6.3 SALT', 'Per OBBBA + Rev. Proc. 2024-40.'],
  ['IRC §213(a) (Medical floor)', 'IRC §213(a)', 'YES — Schedule A medical', 'Per spec §6.2.'],
  ['IRC §165(h) (Casualty/theft from federally declared disasters)', 'IRC §165(h)', 'YES — Schedule A line 16', 'Per spec §6.2.'],
  ['Rev. Proc. 2024-40 (2025 inflation adjustments)', 'IRS Rev. Proc.', 'YES — all 2025 amounts', 'Centralized in ReferenceData.java.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 60 }, { wch: 30 }, { wch: 60 }, { wch: 80 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 12e Final Numeric + Companion Outputs'],
  ['Line 12e persists the final numeric amount + companion label + Schedule A flags. Most consequential output in the 12abcde cluster.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.deductions.deductionAmount', '`deductions.setDeductionAmount(line12e)` at line 3208', '★ CANONICAL line 12e numeric output. BigDecimal. Whole-dollar HALF_UP.'],
  ['form1040.deductions.deductionType', '`deductions.setDeductionType(deductionType)` at line 3210', 'Companion label: "Standard" or "Itemized" or null. Per `chooseDeductionType()` 3-path branching.'],
  ['form1040.deductions.standardDeductionComputed', '`deductions.setStandardDeductionComputed(standardDeduction)` at line 3209', 'Pre-election standard deduction (after disaster-loss augmentation if any). Used for Schedule A line 18 flag comparison + UI display.'],
  ['form1040.deductions.itemizedDeductionsFromScheduleA', '`deductions.setItemizedDeductionsFromScheduleA(itemized)` at line 3210', 'Pre-election itemized total (Schedule A line 17).'],
  ['scheduleA.electsToItemizeAlthoughLessThanStandard', '`scheduleA.setElectsToItemizeAlthoughLessThanStandard(true)` at line 3199-3202', 'Per spec §6.4: TRUE when ITEMIZED election + itemized < standard. Triggers Schedule A line 18 checkbox.'],
  ['scheduleA.usedForItemizedDeduction', '`scheduleA.setUsedForItemizedDeduction("Itemized".equals(deductionType))` at ~line 3211', 'Drives Schedule A attachment when itemizing.'],
  ['PDF f2_02[0] (line 12e numeric)', 'Frontend writes `deductions.deductionAmount` to `line12_standard_deduction_or_itemized_deductions`', 'Canonical PDF mapping per CSV row 151.'],
  ['Form 1040 line 14 / 15 / 16 (downstream) — ★★', 'Indirect via line 12e contribution to line 14.', '★★ Critical: line 14 = line 12e + line 13a + line 13b; line 15 floored at zero off line 11b - line 14.'],
  ['Form 4684 attachment (disaster-loss)', '`buildLine12Form4684Attachment(scheduleA)`', 'Conditional attachment when disaster-loss applies.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 65 }, { wch: 85 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 12e-Related'],
  ['No line-12e-specific BLOCKING flags. Schedule A line 18 (electsToItemizeAlthoughLessThanStandard) is an advisory checkbox, not a flag.'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['(None at line 12e site)', 'N/A', 'Line 12e is a numeric output with multi-path branching; no validation logic emits flags. Structural rules (hard-zero, dependent worksheet, age/blind chart) enforced via the path-switch code.', 'computeStandardDeduction line 3274; chooseLine12e line 3400.'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 12e is the **FINAL numeric output** of the 12abcde deductions cluster — multi-path branching across standard (5 paths inside `computeStandardDeduction`), itemized, and disaster-loss-increased-standard, then final election (3 paths inside `chooseLine12e`). **CLUSTER-CLOSING AUDIT** — closes the cluster across all dimensions: 5-row Verification log (LARGEST in workflow); 4th-of-4 sibling-mate cross-reference (LARGEST cascade); FOURTH AND FINAL cluster-level seed extension; ANCHOR site for deferred deep documentation from 12a #7 + 12b #7 + 12c #7 + 12d #8. **No defects found** — backend implementation matches spec §5-§8 + reference data centralized in ReferenceData.java. Verified 2026-05-13.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-13 — CROSS-REFERENCE — NO MFS GUARD NEEDED AT LINE 12e SITE (inline-computed in computeLine12; inherits transitively from 12a #1 SURGICAL guard)', 'Line 12e is inline-computed via `chooseLine12e()` call at line ~3195 inside the `computeLine12()` body. No separate orchestrator entry. **No additional MFS guard needed** — inherits MFS protection transitively from 12a #1 SURGICAL guard at `buildStandardDeductionIndicators` (per-field MFS-semantics classification: `someoneCanClaimSpouse` null-shadowed on MFS; `spouseItemizesSeparateReturn` + `spouseBornBeforeThreshold` + `spouseIsBlind` + `spouseMeetsAgeBlindnessMfsRequirements` preserved on MFS). All upstream sub-line outputs (line12a/b/c boolean + line12dCount integer) flow through their own MFS-aware paths verified via 12a/b/c/d audits; Schedule A inputs flow from `deductionsTaxpayer` (no spouse-form data); deductionElection from `deductionsTaxpayer.deductionElection` (taxpayer-side). **SEVENTH defensive-gap-NOT-needed Issue #1 in the workflow** (after 9 #1 + 11a/b #1 + 12b/c/d #1). **CLOSES the 12abcde cluster\'s structural-inheritance pattern** — all 5 sub-lines (12a + 12b + 12c + 12d + 12e) inherit MFS protection without dedicated guards. Sibling-mate cross-reference to 12a/b/c/d #1. Pure xlsx-flip cross-reference. No code change. Coverage will come via 12e #4 (FINAL cluster-level seed extension) + 12e #5 (verified-correct on chooseLine12e).', 'TaxReturnComputeService.java:~3195 (line 12e derivation site within computeLine12 body); 12a #1 SURGICAL guard provides transitive inheritance', 'CLOSED — observation. SEVENTH defensive-gap-NOT-needed Issue #1; CLOSES the 12abcde cluster\'s structural-inheritance pattern.'],
  [2, 'RESOLVED 2026-05-13 — DOCUMENTATION HYGIENE — KNOWLEDGE FILE FINAL SIBLING-MATE CROSS-REFERENCE (closes the LARGEST sibling-mate cascade in the workflow at 4)', '`knowledge/line-12abcde-deductions.md` shared across all 5 sub-lines (renamed via 12a #2). Convergence stays at **19 lines** (unchanged by 12e). Remaining Legacy A files unchanged (3): knowledge_line16/17/26/27abc.md. **4th AND FINAL sibling-mate cross-reference within the 12abcde cluster** (after 12b #2 + 12c #2 + 12d #2). **CLOSES the LARGEST sibling-mate cross-reference cascade in the workflow** at 4 — matches the cluster\'s structural max (5 sub-lines minus the cluster-start migration = 4 sibling-mate cross-references). Cascade comparison: 7ab/11ab pairs = 1 each (smallest); 6abcd cluster = 3 (prior cluster max); **12abcde cluster = 4 (NEW LARGEST)**. Closure: pure xlsx-flip cross-reference; no code change; no additional file rename; no generator header update needed (`generate-12e.js` references the already-canonical name).', 'C:\\us-tax\\knowledge\\line-12abcde-deductions.md (sibling-mate FINAL cross-reference within the 12abcde cluster)', 'CLOSED — FINAL sibling-mate cross-reference. CLOSES the LARGEST sibling-mate cascade in the workflow at 4 (matches cluster\'s structural max).'],
  [3, 'RESOLVED 2026-05-13 — SPEC ENHANCEMENT — VERIFICATION LOG 5th AND FINAL ROW APPENDED (closes the LARGEST cluster log in the workflow at 5 rows)', '`lines/12abcde.md` Verification log had 4 rows (12a #3 created + 12b/c/d #3 appended). **Closure applied**: appended the 5th AND FINAL row to the existing table in IN-PROGRESS state capturing the 12e walkthrough closures (will accumulate Issues #1-#10 outcomes; finalized to "COMPLETE — 10/10 closed" at end of walkthrough). APPEND-row pattern. **CLOSES the 12abcde cluster log at 5 ROWS = LARGEST cluster log in the workflow** (exceeds prior 6abcd 4-row max; 12abcde overtakes as new top cluster). **4th AND FINAL of 4 expected APPEND-row operations** within the 12abcde cluster. Log shape inventory: pairs=1 each / single-line=1 / 3abc-5abc=3 / 2ab=4 / 6abcd=4 / **12abcde=5 (NEW LARGEST)**.', 'lines/12abcde.md (existing Verification log; 5th row appended)', 'CLOSED — 5th row appended. CLOSES the cluster log at LARGEST (5 rows; exceeds prior 6abcd 4-row max).'],
  [4, 'RESOLVED 2026-05-13 — CROSS-REFERENCE — FOURTH AND FINAL EXTENSION OF 12a #4 CLUSTER-LEVEL SEED (CLOSES the seed → extend × 4 pattern; FIRST COMPLETE cluster-scale extend in the workflow)', 'The 12a #4 cluster-level forward-cross-reference breadcrumb at TaxReturnComputeService.java:~2857 was seeded 2026-05-13 with placeholders for 4 future extensions. 12b #4 + 12c #4 + 12d #4 were the FIRST, SECOND, and THIRD extensions. **Closure applied — FOURTH AND FINAL extension**: (1) **header updated** to "10 #4, 2026-05-13; EXTENDED 12b #4 + 12c #4 + 12d #4 + 12e #4, 2026-05-13 — CLUSTER COMPLETE"; (2) **flipped the "line 12e (future audit)" placeholder block** to **DEEP thematic documentation** — `(audited 2026-05-13 via 12e.xlsx)` + multi-path branching per spec §8 (3 paths: disaster-loss-increased-standard / itemized / computed-standard) + `chooseLine12e()` 3-path election logic + ITEMIZED-override rule per spec §6.4 + §8.2 + §11 + disaster-loss augmentation per spec §7 (functionally equivalent to spec §7 recipe) + Schedule A line 18 flag per spec §6.4 + reference data ($15,750 / $31,500 / $23,625 base; $2,000 / $1,600 per-box; $40,000 / $20,000 SALT cap with $500,000 / $250,000 MAGI phaseout reducing not-below $10,000 / $5,000) + PDF mapping + persistence + companion outputs + cross-reference to the **12e #6 ANCHOR breadcrumb** at `computeStandardDeduction()` line 3274 (where the cluster\'s deferred-documentation from 12a #7 + 12b #7 + 12c #7 + 12d #8 lands); (3) **FUTURE EXTENSION POINTS section** — flipped "12e #4 — add..." → "EXTENDED 2026-05-13 — CLUSTER COMPLETE"; progress tally: **"4 of 4 extensions done; 0 remaining"**; added **"CLUSTER COMPLETE — FIRST COMPLETE cluster-scale seed → extend × 4 pattern in the audit workflow"** milestone note (contrasts with 10 #4 pair seed which had 2 extensions; 12a #4 is the first FULL cluster-scale completion). **FOURTH AND FINAL extension of the cluster-level seed in the workflow**.', 'TaxReturnComputeService.java:~2857 (12a #4 cluster-level breadcrumb; FINAL extension applied; line-12e placeholder flipped to DEEP documentation; CLUSTER COMPLETE milestone added)', 'CLOSED — 12a #4 cluster-level seed CLOSED. FOURTH AND FINAL extension; FIRST COMPLETE cluster-scale seed → extend × 4 pattern in the workflow.'],
  [5, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — `chooseLine12e()` MULTI-PATH BRANCHING (per spec §8)', 'At TaxReturnComputeService.java:~3447: 3-path branching: ITEMIZED election → itemized; STANDARD election → standard; AUTO → `max(standard, itemized)` tax-optimization default. **Spec §8 mapping**: (a) disaster-loss-increased-standard handled UPSTREAM at line 3189-3193 (standard augmented by `scheduleA.netQualifiedDisasterLoss`); chooseLine12e returns augmented standard via STANDARD/AUTO branch; (b) itemize_selected → ITEMIZED branch (Schedule A line 17); (c) else → STANDARD/AUTO branch returning standard. **AUTO branch (max) is NOT a spec §8.2 violation** — the explicit ITEMIZED election branch lets the user override AUTO and itemize even when itemized < standard (per spec §6.4 + §8.2 + §11). **Closure applied**: added a **~25-line breadcrumb** above `chooseLine12e()` documenting 3-path election + spec §8 mapping (a/b/c paths) + ITEMIZED-explicit-override per spec §6.4 + §8.2 + §11 + Schedule A line 18 flag firing condition (line 3199-3202) + `chooseDeductionType()` companion behavior + null-handling semantics (`roundMoney(null)` + `maxAmount` null contracts). Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:~3447 (above chooseLine12e; ~25-line breadcrumb)', 'CLOSED — verified correct. ~25-line breadcrumb documents 3-path election + spec §8 mapping + ITEMIZED-override + line 18 flag + companion + null-handling.'],
  [6, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — `computeStandardDeduction()` DEEP DOCUMENTATION ANCHOR (CLOSES deferred docs from 12a #7 + 12b #7 + 12c #7 + 12d #8)', '`computeStandardDeduction()` at TaxReturnComputeService.java:~3321 — the 5-path standard-deduction computation. Path documentation was systematically DEFERRED across the 12abcde walkthrough: 12a #7 deferred dependent worksheet + 12b #7 + 12c #7 deferred hard-zero gate (line12b/line12c halves) + 12d #8 deferred age/blind chart + downstream addon paths. **This audit is the ANCHOR site where ALL DEFERRED DOCS LAND**. **Closure applied**: added a **~55-line ANCHOR breadcrumb** above `computeStandardDeduction()` documenting all 5 paths in order (first-match wins): (1) NULL-STATUS DEFENSIVE — returns null; (2) HARD-ZERO (line12b || line12c) per spec §5.2 + IRC §63(c)(6)(A)/(B) — closes 12b #7 + 12c #7 — with existing test canary references; (3) DEPENDENT WORKSHEET (line12a) per spec §5.3 — closes 12a #7 — with the `$1,350` floor / `earned_income + $450` / filing-status cap / age-blind addon formula + earned-income auto-import note from line 3180-3185 + existing test coverage; (4) AGE/BLIND CHART (line12dCount > 0; line12a=FALSE) per spec §5.4 — closes 12d #8 chart half — with dynamic-chart-derivation note + 2025 chart values per Rev. Proc. 2024-40; (5) BASE STANDARD DEDUCTION per spec §5.1 (Single/MFS $15,750; MFJ/QSS $31,500; HOH $23,625) + IRC §63(c) + Rev. Proc. 2024-40. Plus: disaster-loss augmentation handled UPSTREAM at line 3189-3193 (per spec §7) + NO-MFS-guard rationale (inputs already MFS-aware via 12a #1 SURGICAL guard; taxpayer-side earned income field). **The cluster\'s deferred-documentation anchor lands at line 12e #6** — the most consequential breadcrumb in the 12abcde audit. Backend regression: 760/760 pass (unchanged — pure documentation).', 'TaxReturnComputeService.java:~3321 (above computeStandardDeduction; ~55-line ANCHOR breadcrumb)', 'CLOSED — DEEP DOCUMENTATION ANCHOR. ~55-line breadcrumb documents all 5 paths; CLOSES deferred docs from 12a/b/c #7 + 12d #8.'],
  [7, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — DISASTER-LOSS INCREASED-STANDARD PATH (per spec §7)', 'At TaxReturnComputeService.java:~3236-3240 (now ~3251-3255 post-12e #6 anchor breadcrumb shift): when `scheduleA.usedForStandardDeductionIncrease=TRUE`, standard deduction is AUGMENTED by `scheduleA.netQualifiedDisasterLoss`. Functionally equivalent to spec §7 recipe (which routes line12e directly to Schedule A line 16 combined amount). **Closure applied**: added a **~14-line breadcrumb** above the augmentation block documenting: spec §7 IRS recipe + functional-equivalence rationale (augmented_standard = base_standard + disaster_loss = ScheduleA.line16_combined) + chooseLine12e() returning augmented standard via STANDARD/AUTO election (NOT ITEMIZED — implicit "not itemizing" guard via election routing) + trigger condition (`scheduleA.usedForStandardDeductionIncrease=TRUE`) + Form 4684 attachment cross-reference (built via `buildLine12Form4684Attachment(scheduleA)` at line 3210). Pure documentation closure — no functional change. Backend regression: 760/760 pass.', 'TaxReturnComputeService.java:~3236-3240 (disaster-loss augmentation; ~14-line breadcrumb)', 'CLOSED — verified correct. ~14-line breadcrumb documents spec §7 augmentation + functional equivalence + Form 4684 attachment trigger.'],
  [8, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — 2025 BASE STANDARD DEDUCTION REFERENCE DATA (per spec §5.1; ReferenceData centralized)', 'Base amounts in ReferenceData.java: Single/MFS $15,750; MFJ/QSS $31,500; HOH $23,625. Used via `baseStandardDeductionForStatus()` helper. Per spec §5.1 + IRC §63(c) + Rev. Proc. 2024-40. **Architectural strength**: reference data centralized → single source of truth → no chart-vs-constant drift risk (the age/blind chart values in spec §5.4 are DERIVED from base + per-box-addon — e.g., Single 1 box = $15,750 + $2,000 = $17,750). **Closure**: pure xlsx-flip affirmative verification — reference-data centralized + matches spec + matches CLAUDE.md "Key 2025 Tax Constants" table. **NO new breadcrumb** — coverage exists in 3 sources: (a) `ReferenceData.java` constant declarations; (b) per-helper documentation at `baseStandardDeductionForStatus()`; (c) **12e #6 ANCHOR breadcrumb** at `computeStandardDeduction()` Path 5 ("BASE STANDARD DEDUCTION per spec §5.1..."). Adding another breadcrumb here would be triple-documentation. **1st anti-duplication app in the 12e walkthrough**.', 'ReferenceData.java (centralized base amounts); computeStandardDeduction Path 5; 12e #6 anchor breadcrumb', 'CLOSED — verified correct. Reference data centralized; coverage in 3 sources; no new breadcrumb (1st anti-duplication app in 12e walkthrough).'],
  [9, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — 2025 SALT CAP IMPLEMENTATION (per spec §6.3; OBBBA $40,000/$20,000 with reduction + floor)', 'Spec §6.3 establishes the 2025 SALT cap (NEW for 2025; replaces flat $10,000/$5,000): $40,000 / $20,000 MFS, reduced above MAGI $500,000 / $250,000 MFS but not below floor $10,000 / $5,000. Backend implements via `saltLimitForStatusAndMagi()` helper applied at `buildScheduleA()` line 3324. **Reference data centralized in ReferenceData.java** (9 constants: 5 status-specific limits + 2 phaseout thresholds + 2 floors): SCHEDULE_A_SALT_LIMIT_SINGLE/MFJ/QSS/HOH = $40,000; SCHEDULE_A_SALT_LIMIT_MFS = $20,000; SCHEDULE_A_SALT_PHASEOUT_THRESHOLD_DEFAULT = $500,000; SCHEDULE_A_SALT_PHASEOUT_THRESHOLD_MFS = $250,000; SCHEDULE_A_SALT_FLOOR_DEFAULT = $10,000; SCHEDULE_A_SALT_FLOOR_MFS = $5,000. Per IRC §164(b)(6) post-OBBBA + Rev. Proc. 2024-40. **Closure**: pure xlsx-flip affirmative verification — backend correctly implements the spec §6.3 + §11 rule ("Do not use the old flat $10,000/$5,000 SALT cap for 2025"). **NO new breadcrumb** — coverage adequate via existing `saltLimitForStatusAndMagi()` helper Javadoc + ReferenceData declarations + line 3324 inline application; adding another breadcrumb here would be double-documentation. **2nd anti-duplication app in 12e walkthrough**.', 'TaxReturnComputeService.java:3324 (SALT cap applied at buildScheduleA); ReferenceData.java:64-76 (SALT cap constants); saltLimitForStatusAndMagi() helper', 'CLOSED — verified correct. Backend correctly implements spec §6.3 + §11; coverage adequate; 2nd anti-duplication app in 12e walkthrough.'],
  [10, 'RESOLVED 2026-05-13 — OBSERVATION — LINE 12e CLOSES THE 12abcde DEDUCTIONS CLUSTER (FINAL state across all dimensions)', 'Pure xlsx-flip observation — **MAJOR CLUSTER-CLOSING MILESTONE**: line 12e closes the 12abcde deductions cluster across ALL FIVE dimensions simultaneously: (1) **Cluster Verification log at 5 rows** = LARGEST cluster log in the workflow (exceeds prior 6abcd 4-row max; 12abcde overtakes as new top cluster); (2) **Sibling-mate cross-reference cascade at 4** = LARGEST cascade in the workflow (12b/c/d/e #2); pairs hold 1; 6abcd held prior max at 3; (3) **Cluster-level seed → extend × 4 pattern → 4 of 4 done = FIRST COMPLETE cluster-scale seed-extend pattern in the audit workflow** (10 #4 was a pair seed with 2 extensions; 12a #4 is the first FULL cluster-scale completion); (4) **Defensive-gap-NOT-needed Issue #1 cluster pattern complete** — all 5 sub-lines (12a + 12b + 12c + 12d + 12e) inherit MFS protection structurally without dedicated guards; (5) **Deferred-documentation anchor landed** — 12a #7 + 12b #7 + 12c #7 + 12d #8 documentation deep-anchored at the 12e #6 ANCHOR breadcrumb above `computeStandardDeduction()`. **Cumulative through line 12e**: **37 lines audited** (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + 11b + 12a + 12b + 12c + 12d + **12e**); 367 audit issues closed total (357 + 10); backend 760/760 tests pass (unchanged — no new test; all 12e closures were documentation breadcrumbs); MFS-guard cascade = 15 orchestrators (unchanged — line 12e inherits); knowledge-file naming convergence = 19 lines (unchanged — shared 12abcde file); **5 documentation drift fixes** across workflow (11a #8 + 12a #8 doc-only + 12b/c/d #6 FUNCTIONAL; 3 FUNCTIONAL including FIRST TAX-YEAR drift); **FIRST @Deprecated annotation** in workflow (12c #8); **8 Path A anti-fragmentation applications**. **ZERO new outstanding.md entries** in 12e walkthrough — **12 consecutive walkthroughs with zero new outstanding entries** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e). **Closure**: pure xlsx-flip observation; this row is the audit-trail anchor for the 12abcde-cluster-COMPLETE milestone. **Looking ahead — line 13a (QBI deduction)**: first audit OUTSIDE the 12abcde cluster in this AGI-territory sequence; will use a separate orchestrator (`computeLine13a()`) — likely needs MFS guard analysis (similar to the income-territory orchestrators with HIGH-PRIORITY MFS defensive-gap fixes). After 13a: 13b (Schedule 1-A), 14 (total deductions composite; closes the deductions-territory), 15 (taxable income — first audit with zero-floor rule), 16+ (tax computation territory).', 'XLS/computations/12e.xlsx audit-trail (this row); no code change beyond breadcrumb extensions at 12e #4-#7', 'CLOSED — pure xlsx-flip. CLOSES the 12abcde deductions cluster (FINAL state across 5 dimensions); 37 lines audited cumulatively; line 13a (QBI) sibling audit next — first OUTSIDE 12abcde.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 100 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 12e Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.deductions.deductionAmount', 'topmostSubform[0].Page2[0].f2_02[0] (line12_standard_deduction_or_itemized_deductions)', 'form-tax-return-1040.xlsx (line 12e cell)', '★ CANONICAL line 12e numeric output. BigDecimal; whole-dollar HALF_UP rounded.'],
  ['form1040.deductions.deductionType', '(internal label — UI display only)', 'form-tax-return-1040.xlsx (deduction-type indicator)', 'Companion label: "Standard" / "Itemized".'],
  ['form1040.deductions.standardDeductionComputed', '(internal — pre-election value)', 'form-tax-return-1040.xlsx (debug/audit field)', 'Used for Schedule A line 18 flag comparison.'],
  ['form1040.deductions.itemizedDeductionsFromScheduleA', '(internal — pre-election value)', 'Schedule A line 17 (XLS)', 'Schedule A total of lines 4-16.'],
  ['scheduleA.electsToItemizeAlthoughLessThanStandard', 'Schedule A line 18 checkbox', 'form-tax-return-1040-schedule-a.xlsx', 'Per spec §6.4: TRUE when ITEMIZED election + itemized < standard.'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 14 (total deductions)', '—', 'form-tax-return-1040.xlsx (line 14 cell)', '★★ line14 = line12e + line13a + line13b.'],
  ['Form 1040 line 15 (taxable income)', '—', 'form-tax-return-1040.xlsx (line 15 cell)', '★★ line15 = max(0, line11b − line14) — first audit with zero-floor rule.'],
  ['Form 1040 line 16 (tax)', '—', 'form-tax-return-1040.xlsx (line 16 cell)', 'Indirect via line 15.'],
  [],
  ['CONDITIONAL ATTACHMENTS'],
  ['Schedule A (itemized path)', 'Schedule A pages', 'form-tax-return-1040-schedule-a.xlsx', 'Attached when deductionType == "Itemized" or disaster-loss path applies.'],
  ['Form 4684 (disaster-loss path)', 'Form 4684 page', 'form-tax-return-1040-form-4684.xlsx', 'Attached when net qualified disaster loss claimed.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions per spec §9 + §11)'],
  ['Section 962 election / Section 250 deduction', '—', '—', 'Per spec §9: §962 + §250 relate to tax on line 16, NOT a deduction on line 12e.'],
  ['QBI deduction', '—', '—', 'On line 13a (separate output; future line 13a audit).'],
  ['Schedule 1-A deductions (tips/overtime/senior/car loan)', '—', '—', 'On line 13b (separate output; future line 13b audit).'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 65 }, { wch: 90 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
