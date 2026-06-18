// ============================================================================
//  Generates: C:\us-tax\XLS\computations\1z.xlsx
//  Source-of-truth references:
//    - lines/1z.md (authoritative spec)
//    - dependencies/1z.md
//    - knowledge/line-1z-total-wages.md
//    - flowcharts/1z.drawio
//    - TaxReturnComputeService.buildIncome() — line 1z computation at lines 4136-4142
//    - Form 1040 PDF field: topmostSubform[0].Page1[0].f1_57[0] (line1z_total_wages)
//    - IRS 2025 Form 1040 instructions (i1040gi_2025.pdf): "Add lines 1a through 1h"
//
//  Tax year: 2025
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '1z.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 1z — TOTAL WAGES (Subtotal of Lines 1a-1h)'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 1z'],
  ['Concept', 'Pure arithmetic subtotal of the eight earned-income wage lines (1a-1h). Bridges per-source income computations into the Form 1040 total-income flow via line 9. Line 1i (nontaxable combat pay election) is EXPLICITLY EXCLUDED because it is a credit-worksheet marker, not taxable wages.'],
  ['Formula', 'line1z = roundMoney( addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(line1a, line1b), line1c), line1d), line1e), line1f), line1g), line1h) )'],
  ['Filed', 'Direct entry on Form 1040 line 1z. No separate form. Visible to the IRS on the printed return.'],
  ['Backend method', 'TaxReturnComputeService.buildIncome() — inline computation at lines 4136-4142 (not a separate named method since line 1z is just an aggregation of pre-computed sub-line values).'],
  ['Output', 'form1040.income.totalWages (BigDecimal; null when all sub-lines 1a-1h are null and no hasEmploymentFlag override)'],
  ['IRS source', 'IRS 2025 Form 1040 instructions: line 1z labeled "Add lines 1a through 1h". Listed as a subtotal of the earned-income block.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Compute each sub-line via its dedicated helper', 'Each sub-line is pre-computed before buildIncome() runs:\n  computeWages → line1a + line1b (W-2 box 1 + household)\n  computeTipIncome → line1c (unreported tips via Form 4137)\n  computeMedicaidWaiver → line1d (Notice 2014-7)\n  computeDependentCare → line1e (Form 2441 line 26)\n  computeAdoptionBenefits → line1f (Form 8839 line 31 — may be NEGATIVE for special-needs cases)\n  computeUncollectedSocialSecurity → line1g (Form 8919 line 6)\n  computeOtherEarnedIncome → line1h\n  computeCombatPay → combatPayElection (line 1i — STORED SEPARATELY, NOT in line 1z)'],
  [2, 'Round each sub-line to whole dollars', 'Each helper returns a rounded BigDecimal via roundMoney() inside its own logic. By the time line 1z sees them, they are already whole-dollar HALF_UP rounded.'],
  [3, 'Aggregate via left-fold addNonNull chain', 'totalWagesRaw = addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(line1a, line1b), line1c), line1d), line1e), line1f), line1g), line1h)\n\naddNonNull semantics: null + null = null; null + X = X; X + Y = X+Y. So when ALL sub-lines are null, line1z is null. When ANY sub-line is non-null, line1z = arithmetic sum (treating null operands as zero).'],
  [4, 'Apply roundMoney to the aggregate', 'line1z = roundMoney(totalWagesRaw). Since sub-lines are already whole-dollar rounded, this is a no-op for non-null aggregates and a null-passthrough otherwise.'],
  [5, 'Persist on Income object', 'if (line1z != null) { income.setTotalWages(line1z); }\n\nOnly stored when non-null. Framework omits null fields from JSON output. (NOTE: see Code Validation #1 for the frontend fallback that handles the hasEmploymentFlag-true-but-line1a-null edge case where wages=0 but totalWages=null.)'],
  [],
  ['MUTUAL EXCLUSION RULES (enforced by code)'],
  ['Rule', 'Implementation', 'Why'],
  ['Line 1i EXCLUDED from line 1z', 'Eight-operand addNonNull chain at line 4140-4141 lists exactly line1a through line1h. line1i (combatPayElection) is set on income separately at line 4182-4184.', 'IRS rule: line 1z is "Add lines 1a through 1h" — explicit subtotal range. Line 1i is a credit-worksheet earned-income marker that increases EIC/ACTC earned income WITHOUT increasing wages, AGI, or taxable income. Adding it to line 1z would erroneously double-count combat pay (which is already excluded from W-2 box 1).'],
  ['Negative sub-line amounts PASS THROUGH', 'addNonNull performs algebraic addition; no max(0, ...) floor.', 'Per IRC §137(a) / Form 8839 Part III, line 1f (employer adoption benefits) may be NEGATIVE for special-needs final adoptions where the lifetime exclusion exceeds the current-year reported benefits. The negative amount correctly reduces total wages.'],
  ['Sub-line pre-rounding (no double-rounding)', 'Each computeXxx helper applies roundMoney() before returning. Line 1z sums already-rounded values.', 'Prevents the classic "sum of rounded sub-lines differs from rounded sum" bug. Whole-dollar HALF_UP rounding at every stage.'],
  ['No MFS guard at line 1z', 'Line 1z is a pure subtotal — each sub-line handles MFS separately (1c-1i each have isMfsReturn parameters now; 1a/1b use SSN-filter inside computeWages).', 'Aggregation has no spouse-attribution logic of its own. If any sub-line has an MFS leak, line 1z reflects the leak — but the fix belongs at that sub-line, not at 1z.'],
  ['Line 1z null when all sub-lines null', 'addNonNull(null, null) = null; full chain propagates null when no sub-line has a value.', 'Avoids printing "$0" on line 1z for returns that have no wage activity at all (interest-only filer, retirement-income-only filer, etc.). The PDF cell stays blank in the IRS-preferred convention. (Special case: hasEmploymentFlag-true-but-no-wages — see Code Validation #1.)'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 1z Flows'],
  ['Consumer', 'How', 'Where wired'],
  ['Form 1040 line 9 (total income)', 'line9 = line1z + line2b + line3b + line4b + line5b + line6b + line7a + line8 (all addNonNull, then roundMoney)', 'TaxReturnComputeService.java:4144-4147'],
  ['Schedule 8812 line 18a (CTC/ACTC earned income base)', 'line18a = income.getTotalWages() + income.getNontaxableCombatPayElection() (combat pay added separately so the IRS can read line 18b disclosure of the combat-pay component)', 'TaxReturnComputeService.computeSchedule8812() lines 19087-19096'],
  ['Form 1040 line 11b (AGI)', 'Indirect: AGI = line9 - line10 (adjustments). Line 1z reaches AGI via line 9.', 'TaxReturnComputeService.java line ~4350+ (buildForm1040 AGI section)'],
  ['Form 1040 line 15 (taxable income)', 'Indirect: line15 = max(0, AGI - total deductions). Line 1z reaches line 15 via AGI.', 'TaxReturnComputeService.java (buildForm1040)'],
  ['PDF output cell', 'topmostSubform[0].Page1[0].f1_57[0] (semantic name: line1z_total_wages)', 'us-tax-ui form-tax-return-1040.component.ts buildFieldValues line 290 — uses fallback `totalWages ?? wages` (see Code Validation #1)'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 22 }, { wch: 75 }, { wch: 95 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Sub-Line Computed Values (Line 1z is a Pure Subtotal)'],
  ['Line 1z has NO direct input fields of its own. Its inputs are the eight COMPUTED sub-line values produced by earlier compute helpers. The deep field-level inputs belong to the per-sub-line audits (1a, 1b, 1c, 1d, 1e, 1f, 1g, 1h).'],
  [],
  ['#', 'Sub-line', 'Backend variable', 'Source compute method', 'Output model field', 'Notes'],
  [1, '1a — W-2 wages + household employee wages (box 1 portion)', 'line1a', 'computeLine1aWages (called from buildIncome ~line 3989)', 'income.wages', 'W-2 box 1 sum (SSN-filtered) + Form 4852 substitute wages + inmate-wage exclusion + Medicaid waiver overlap subtraction.'],
  [2, '1b — Household employee wages not reported on W-2', 'line1b', 'computeLine1bHouseholdWages (or merged into computeWages)', 'income.householdEmployeeWages', 'Manual entry from employment-income-{taxpayer,spouse} form (householdEmployeeWagesAmount field). No statement type.'],
  [3, '1c — Tip income not reported on line 1a', 'line1c', 'computeTipIncome', 'income.tipIncome', 'Unreported tips, Form 4137 line 6 if generated. See 1c.xlsx for full computation.'],
  [4, '1d — Medicaid waiver payments not on W-2 box 1', 'line1d', 'computeMedicaidWaiverPayments', 'income.medicaidWaiverPayments', 'Notice 2014-7 treatment. See 1d.xlsx.'],
  [5, '1e — Taxable dependent care benefits (Form 2441 line 26)', 'line1e', 'computeDependentCareBenefits', 'income.dependentCareBenefits', 'W-2 box 10 + qualified expenses + earned income limit. See 1e.xlsx.'],
  [6, '1f — Employer-provided adoption benefits (Form 8839 line 31)', 'line1f', 'computeAdoptionBenefits', 'income.adoptionBenefits', '**MAY BE NEGATIVE** for special-needs final adoptions where IRC §137(a)(3) lifetime exclusion exceeds current-year benefits. See 1f.xlsx.'],
  [7, '1g — Wages from Form 8919 line 6 (uncollected SS/Medicare)', 'line1g', 'computeUncollectedSSTax', 'income.uncollectedSocialSecurityMedicareWages', 'Misclassified-employee wages. See 1g.xlsx.'],
  [8, '1h — Other earned income', 'line1h', 'computeOtherEarnedIncome', 'income.otherEarnedIncome', 'Strike benefits + excess elective deferrals + disability pension wages + corrective distributions. See 1h.xlsx.'],
  [],
  ['EXCLUDED — Line 1i (Combat Pay Election)'],
  [9, '1i — Nontaxable combat pay election', 'combatPayElection', 'computeCombatPay', 'income.nontaxableCombatPayElection (STORED SEPARATELY)', 'NOT in the line 1z sum. Set on income via setNontaxableCombatPayElection at line 4182-4184. See 1i.xlsx. Verified 2026-05-10 — 1i.xlsx Code Validation #9, breadcrumb at TaxReturnComputeService.java:4137-4139.'],
  [],
  ['SUPPORTING — hasEmploymentFlag (drives the "show $0 even if no W-2" UX)'],
  [10, 'hasEmploymentFlag (derived)', 'Boolean.TRUE.equals(employment-income-taxpayer.hasEmploymentIncome) OR Boolean.TRUE.equals(employment-income-spouse.hasEmploymentIncome)', 'Inline at buildIncome line 3989-3990', 'NOT an Income field', 'When true AND line1a is null, the backend force-sets income.wages = BigDecimal.ZERO (line 4154-4156). But line1z (which already aggregated line1a=null) stays null. This creates the frontend-fallback dependency — see Code Validation #1.'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 25 }, { wch: 45 }, { wch: 45 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data / Constants ──────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 1z (None — Pure Aggregation)'],
  ['Line 1z has ZERO reference-data constants. It is a pure arithmetic subtotal. All constants relevant to line 1z arrive pre-applied via the sub-line computations (e.g., line 1e earned-income limit, line 1f $17,280 special-needs adoption max, line 1g $176,100 SS wage base). Line 1z itself uses no caps, limits, rates, or thresholds.'],
  [],
  ['Constant', 'Value', 'Source', 'Used by line 1z?', 'Notes'],
  [],
  ['Indirect — referenced only when consumers pick up line 1z'],
  ['ACTC_EARNED_INCOME_FLOOR', '$2,500', 'Hard-coded inline at TaxReturnComputeService.java:19098', 'NO (Schedule 8812 Part II-A consumer)', '2025 ACTC: line19 = max(0, line18a - $2,500), where line18a = totalWages + combatPay. Used downstream of line 1z, not by line 1z.'],
  ['ACTC_RATE', '15%', 'Hard-coded inline at TaxReturnComputeService.java:19103', 'NO', 'Used downstream of line 1z.'],
  ['EIC_INVESTMENT_INCOME_CEILING_2025', '$11,950', 'ReferenceData.INVESTMENT_INCOME_CEILING_EIC_2025', 'NO (EIC consumer)', '2025 EIC investment-income disqualification ceiling. Does not affect line 1z.'],
  [],
  ['Internal computation constants (sub-line-level — apply BEFORE line 1z)'],
  ['(Sub-line constants are documented in each per-sub-line xlsx, e.g.:)'],
  ['Standard deduction', 'See 12a-e.xlsx', 'ReferenceData.STANDARD_DEDUCTION_*', 'NO', 'Applied downstream at line 12/14/15.'],
  ['Officer combat-pay cap', 'Issuer-applied', 'IRC §112(c); Pub. 3', 'NO', 'Applied at W-2-issuer level for line 1i (excluded from 1z anyway).'],
  ['§402(g) limit', '$23,500', 'ReferenceData.ELECTIVE_DEFERRAL_402G_LIMIT', 'NO', 'Used by line 1h (excess elective deferrals).'],
  ['§17,280 adoption max', 'See 1f.xlsx Reference Data', 'ReferenceData.ADOPTION_CREDIT_MAXIMUM_2025', 'NO', 'Applied inside computeAdoptionBenefits before line 1f reaches line 1z.'],
  [],
  ['Rounding rule'],
  ['ROUNDING_MODE', 'WHOLE_DOLLAR (HALF_UP)', 'TaxReturnComputeService.java:111', 'YES — at line 4142', 'roundMoney(totalWagesRaw) applies HALF_UP whole-dollar rounding. Each sub-line is also pre-rounded, so this is typically a no-op (the aggregate is already integral).'],
  [],
  ['Statutory references (IRS rules, not configurable constants)'],
  ['IRS rule', 'Citation', 'Notes'],
  ['Line 1z subtotal range', 'IRS 2025 Form 1040 instructions', 'Line 1z label is literally "Add lines 1a through 1h". Range is fixed; the only design choice is whether line 1i is in or out (out, per IRS line 1i label "Nontaxable combat pay election" — a separate optional election line).'],
  ['Negative line 1f permitted', 'IRC §137(a)(3); Form 8839 instructions', 'Employer adoption benefits may be negative for special-needs final adoptions where the lifetime exclusion ($17,280 in 2025) exceeds current-year reported benefits. The negative amount carries through line 1z, reducing total wages.'],
  ['Combat pay exclusion from line 1z', 'IRS 2025 Form 1040 instructions for line 1i', '"Don\'t include the amount on line 1i in your total income (line 9) or wages (line 1z)." Explicit IRS guidance.'],
  ['Whole-dollar rounding', 'IRS Form 1040 instructions, "Rounding off dollars"', 'Whole dollars; HALF_UP at 50¢. The IRS permits filers to round each line or to round only the totals — current implementation rounds at every sub-line plus at line 1z (consistent dual-rounding, no risk of aggregation discrepancy since each sub-line is already integral).'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 30 }, { wch: 60 }, { wch: 35 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 1z Has NO Attached Form/Schedule'],
  ['Line 1z is a single subtotal cell on Form 1040. No separate form is filed; no PDF appended page; no statement attachment. The output value is consumed by line 9, Schedule 8812 line 18a, and AGI/taxable income indirectly.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['Form 1040 line 1z (the cell itself)', 'TaxReturnComputeService.buildIncome() — income.setTotalWages(line1z) at line 4185-4187', 'Persisted on form1040.income only when non-null. Whole-dollar HALF_UP rounding. Frontend renders via PDF field topmostSubform[0].Page1[0].f1_57[0] (line1z_total_wages).'],
  ['Form 1040 line 9 (total income) — INDIRECT', 'line9 = addNonNull(addNonNull(...(line1z, line2b)...), line8) at line 4144-4147', 'Line 1z is the FIRST operand of the line 9 sum. Any null/0/positive/negative value flows directly into line 9, then into AGI (line 11b), then into taxable income (line 15).'],
  ['Schedule 8812 line 18a — INDIRECT (via getTotalWages)', 'computeSchedule8812() lines 19087-19096: line18a = totalWages + nontaxableCombatPayElection (the combat-pay add-on is line 18b disclosure)', 'Drives the 15% ACTC earned-income floor calculation. **Line 1i RE-ENTERS at Schedule 8812 line 18a as combat-pay-added-back** — but only for the CTC/ACTC computation, not for AGI.'],
  ['EIC earned income (line 27a)', 'computeLine27aEIC() — reads totalWages via the same income object', 'Line 1z is the dominant component of EIC earned income for non-self-employed filers. Combat pay is added via the unified line-1i source (post 1i Issue #2 closure).'],
  [],
  ['No PDF write-in or appended page for line 1z'],
  ['Unlike line 1h (which appends a "Refer to attached sheet" page for write-in descriptions), line 1z is a single dollar amount with no statement text. The IRS form does not have a write-in area for line 1z.'],
  [],
  ['No advisory or blocking flag emitted by line 1z'],
  ['Line 1z itself emits zero TaxReturnFlag entries. Sub-line blocking flags (MISSING_W2_EMPLOYMENT_INCOME_TAXPAYER, FORM8919_IRS_DATE_REQUIRED_*, ADOPTION_BENEFITS_*, LINE1H_DISABILITY_*, etc.) propagate FROM the sub-line computations — line 1z does not introduce new flags. If a blocking flag fires at a sub-line, the entire return is blocked regardless of the line 1z value.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 55 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 1z Emits NONE'],
  ['Line 1z is a pure aggregation; it never blocks the return. Any blocking-state behavior comes from the sub-line computations.'],
  [],
  ['Flag scenario considered', 'Why no flag at line 1z', 'Where blocking actually happens'],
  ['Negative line 1z (e.g., from negative line 1f)', 'Negative wages are PERMITTED per spec §6 and IRC §137(a)(3) special-needs adoption treatment. Test computesLine1zSumExcludesCombatPayElection asserts line 1z = -$5,280.', 'No flag. The negative value flows to line 9 / AGI / line 15 (which has its own max(0, ...) floor at the taxable-income level).'],
  ['Line 1z exceeds plausible wage range', 'No invariant. High-earner filers with large legitimate W-2s + Form 8919 wages + corrective distributions can produce line 1z > $1M without anomaly.', 'No flag.'],
  ['All sub-lines null → line 1z null', 'EXPECTED behavior per spec §6. Avoids printing "$0" on returns with no wage activity (interest-only filers, retirement-only filers).', 'No flag. Display is blank; PDF cell remains empty.'],
  ['hasEmploymentFlag=true but no W-2', 'Sub-line responsibility: computeLine1aWages handles the no-W-2 case and may emit MISSING_W2_EMPLOYMENT_INCOME_TAXPAYER. Line 1z accepts whatever line 1a produces.', 'MISSING_W2_EMPLOYMENT_INCOME_TAXPAYER fires from the sub-line, not from line 1z. NOTE: this scenario triggers the income.wages=BigDecimal.ZERO override at line 4154-4156 — see Code Validation #1 for the frontend-fallback consequence.'],
  ['Line 1f negative AND special-needs gate fails', 'Sub-line responsibility: computeAdoptionBenefits emits ADOPTION_BENEFITS_OFF_W2_NOT_SPECIAL_NEEDS_CHILD_N or similar per-child blocking flags.', 'Per-child flags from line 1f, not line 1z.'],
  [],
  ['Line 1z is unique among the 1a-1h-1i set in emitting NOTHING. Every other line has at least one blocking or advisory flag. This is intentional — line 1z is a passive sum.'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 60 }, { wch: 95 }, { wch: 80 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Reviewed against: TaxReturnComputeService.buildIncome() lines 4136-4147 (line 1z + line 9 formula), 4152-4187 (Income field setting + hasEmploymentFlag override), 3989-3990 (hasEmploymentFlag derivation), 4148-4149 (debug logging). Frontend mapping: us-tax-ui form-tax-return-1040.component.ts buildFieldValues line 290. Existing test computesLine1zSumExcludesCombatPayElection at TaxReturnComputeServiceTest line 6291. Verified 2026-05-10.'],
  ['LINE 1z AUDIT COMPLETE 2026-05-10 — All 10 issues closed. Outcomes: 1 defensive cleanup + dead-code removal (#1 backend hasEmploymentFlag mirror invariant + frontend fallback removed); 1 coverage-gap closure with +4 unit tests (#2 — minimal isolation, line 1i exclusion, line 9 invariant, Schedule 8812 line 18 split); 1 knowledge-file rename completing line 1c-1z naming convergence (#3); 1 deferred-enhancement closure for addNonNullVarargs refactor across 31 sites (#4); 1 orphaned-YAML deletion consolidating a long-standing outstanding.md item (#5); 5 verified-correct closures with breadcrumbs (#6 line 1z formula matches IRS spec, #7 line 9 invariant, #8 negative pass-through, #9 null propagation at helper level, #10 no MFS guard needed at aggregator level). Backend regression: 746/746 pass (was 741 — net +5 unit tests). One investigation finding documented: line 1e (and likely 1f/1g/1h) all share a stylistic 0-vs-null choice for absent-form paths that makes "all sub-lines null → line 1z null" unreachable in practice. Frontend fallback `totalWages ?? wages` removed (was dead code). Two outstanding.md entries added (addNonNullVarargs cross-site refactor) and one closed (1b-household-employee-wages.yaml orphan). One inline comment chain at line 1z formula now covers Issues #6/#8 + 1i #9; consolidated breadcrumb at the storage guard covers Issues #1/#9; line 9 comment extended for Issue #7.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'INVARIANT INCONSISTENCY — FRONTEND FALLBACK LOAD-BEARING ON BACKEND ZERO-OVERRIDE — RESOLVED 2026-05-10 (defensive cleanup + dead-code removal)', 'Pre-fix: frontend rendered the PDF cell via `values["line1z_total_wages"] = formatAmount(form.income?.totalWages ?? form.income?.wages)`. The audit framed the fallback as load-bearing because when hasEmploymentFlag=true AND line 1a is null, the backend force-sets income.wages = BigDecimal.ZERO (line 4154-4156) but leaves income.totalWages = null (line 4185 `if (line1z != null)` skipped). INVESTIGATION revealed the gap is DORMANT in practice: computeDependentCareBenefits returns BigDecimal.ZERO (not null) when the childcare-expenses form is absent — a line-1e stylistic 0-vs-null choice mirrored by line 1h #4(g). So line 1z is always non-null whenever ANY sub-line is computed, and the "totalWages=null while wages=0" mismatch cannot manifest in current code state. Both the frontend fallback AND the would-be-needed backend defensive override were effectively dead code masking a theoretical-only gap. Post-fix: (1) Backend at line ~4193 — added `else if (hasEmploymentFlag) { income.setTotalWages(BigDecimal.ZERO); }` mirroring the wages override. Currently dormant but ACTIVATES if line 1e is ever refactored to return null on absent form (future-proofs the invariant). (2) Frontend at form-tax-return-1040.component.ts:290 — removed the `?? form.income?.wages` fallback; now just `formatAmount(form.income?.totalWages)`. Pure dead-code cleanup; render behavior unchanged. (3) Eight-line breadcrumb comment added at backend line 4185-4193 documenting the invariant + audit ID + lock-in test name. (4) Lock-in test `line1zStoresZeroWhenHasEmploymentFlagAndNoWageInputs` — hasEmploymentFlag=true with no W-2 inputs → asserts income.totalWages = BigDecimal.ZERO. Locks observable behavior regardless of whether the "0" comes from line 1e contamination or from the new defensive override. (Negative-case test was attempted but proved impossible — line 1e contamination always produces a non-null line 1z; that test was dropped.) Backend regression: 742/742 pass. Frontend build clean.', 'TaxReturnComputeService.java:4185-4193 (backend defensive override + breadcrumb); us-tax-ui form-tax-return-1040.component.ts:290 (fallback removed); test line1zStoresZeroWhenHasEmploymentFlagAndNoWageInputs', 'CLOSED via defensive cleanup + dead-code removal. The invariant is now explicit at the backend; the frontend no longer relies on an implicit fallback. Side observation: line 1e (and likely lines 1f, 1g, 1h) all have stylistic 0-vs-null choices on absent-form paths — broader cleanup deferred to a future cross-sub-line audit.'],
  [2, 'TEST COVERAGE GAPS — RESOLVED 2026-05-10', 'Pre-fix: 6 audit-identified sub-gaps (a-f) in unit-test coverage for line 1z. Investigation during fix: sub-gap (a) "line 1z null when all 8 sub-lines null" turned out to be IMPOSSIBLE to test — line 1e (dependentCareBenefits) returns BigDecimal.ZERO (not null) on absent childcare-expenses form (stylistic 0-vs-null choice mirroring line 1h #4(g)), so line 1z is always non-null when any sub-line compute runs. Sub-gap (e) closed by Issue #1 lock-in test `line1zStoresZeroWhenHasEmploymentFlagAndNoWageInputs`. Post-fix: added 4 unit tests for the remaining b/c/d/f sub-gaps. (b) `line1zEqualsLine1aWhenOnlyW2Wages` — Single filer with single W-2 $5,000 box 1 → asserts wages=$5,000, totalWages=$5,000, all other sub-lines null (except line 1e which is 0 by design). (c) `line1zMinimalLine1iExclusion` — W-2 $4,000 + code Q $2,000 + electCombatPay=true (no adoption-benefits noise) → asserts totalWages=$4,000 (NOT $6,000), nontaxableCombatPayElection=$2,000 stored on its own field. (d) `line9EqualsLine1zPlusOtherIncomeLines` — W-2 $50k + 1099-INT $1k + 1099-DIV $500 ordinary → asserts totalIncome=$51,500 = line1z + line2b + line3b. (f) `schedule8812Line18aSeparatesTotalWagesAndCombatPayDisclosure` — W-2 $30k + code Q $5k + electCombatPay=true + 1 CTC dependent → asserts line18a=$35,000 (sum) AND line18b=$5,000 (disclosure split). Total line-1z dedicated unit-test count grew 1 → 6 (or 11 indirect — line 9 invariant + Schedule 8812 line 18 + Issue #1 lock-in + existing E2E suite). Backend regression: 746/746 pass.', 'TaxReturnComputeServiceTest — 4 new tests added after line1zStoresZeroWhenHasEmploymentFlagAndNoWageInputs', 'CLOSED — coverage sub-gaps (b)-(f) all closed; (a) documented as impossible per line 1e contamination. Combined with Issue #1 lock-in, line 1z has comprehensive unit-test coverage for the audit-relevant scenarios.'],
  [3, 'KNOWLEDGE FILE NAMING DEVIATION — RESOLVED 2026-05-10', 'Pre-fix: `knowledge/knowledge-line-1z-total-wages.md` used the legacy `knowledge-line-1z-` prefix while line 1c–1i had converged on `line-{N}-{topic}.md` (hyphen form, no `knowledge-` prefix). Post-fix: file renamed to `knowledge/line-1z-total-wages.md` via plain `mv` (`knowledge/` lives outside the `us-tax-be/` git repo). Two references updated: (1) generator header comment (line 6); (2) YAML frontmatter `name:` field inside the file itself (line 2) updated from `knowledge-line-1z-total-wages` to `line-1z-total-wages`. The file content body had no other self-references. Same shape as line 1g #5, 1h #5, 1i #6 — with the additional YAML-frontmatter cleanup specific to this file. **Line 1c–1z naming convergence is now COMPLETE** — every wage-line knowledge file uses the canonical `line-{N}-{topic}.md` form. Older legacy `knowledge_line<n>.md` files (lines 8, 9, 10–33, 3ab, 4abc) remain for a future cross-line sweep.', 'knowledge/ folder; XLS/_tools/generate-1z.js (header comment line 6); knowledge/line-1z-total-wages.md (YAML frontmatter line 2)', 'CLOSED. Naming convention now consistent across line 1c-1z. Other older lines (8, 9, 10-33, 3ab, 4abc) remain — future sweep out of scope.'],
  [4, 'OBSERVATION — addNonNull CHAIN READABILITY — DEFERRED PER AUDIT 2026-05-10', 'Pre-fix: 8-operand addNonNull chain at line 4140-4141 (line 1z) is `addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(line1a, line1b), line1c), line1d), line1e), line1f), line1g), line1h)` — a left-fold that is mathematically correct but difficult to scan. The same shape appears at line 4144-4145 for line 9 and at 29 other sites across TaxReturnComputeService.java (verified via grep — 31 total nested-addNonNull sites). Scattered across wages, withholdings, EIC, ACTC/Schedule 8812, Schedule 3, Form 2441, Form 8839, Schedule 1, etc. A varargs helper `addNonNullVarargs(BigDecimal... values)` would replace each chain with a flat parameter list. Functional cosmetics only — no behavior change, no test failure, no production bug. Closure (per audit "Defer" recommendation): added deferred-enhancement section to outstanding.md ("TaxReturnComputeService — addNonNullVarargs Helper + Cross-Site Migration (~31 nested addNonNull chains) — Deferred 2026-05-10") with full re-implementation scope (~1-2 hours: helper + 7-stage section-by-section migration with regression gates + 5 unit tests for the helper). Rationale for not doing partial migration: migrating only line 1z + line 9 would create inconsistency (two patterns coexisting in the same method body); better to do the full sweep as a single coherent refactor. Pre-launch app makes timing flexible — defer until the full sweep is scheduled. No code change today; no test, no breadcrumb. Backend stays at 746/746.', 'TaxReturnComputeService.java:4140-4141 (line 1z chain), :4144-4145 (line 9 chain), 29 other nested-addNonNull sites; outstanding.md ("TaxReturnComputeService — addNonNullVarargs Helper + Cross-Site Migration")', 'CLOSED via deferred-enhancement entry. Pure readability — no functional or correctness impact. Best done as a single coherent cross-site refactor.'],
  [5, 'ORPHANED YAML — 1b-household-employee-wages.yaml — RESOLVED 2026-05-10 (orphaned file deleted; outstanding.md item closed)', 'Pre-fix: `C:/us-tax/yamls/1b-household-employee-wages.yaml` was an orphaned artifact — not registered in PersonalResource.java, not referenced in backend or frontend code, not wired to any compute path. Line 1b household-wages flowed through `employment-income-{taxpayer,spouse}` forms (computed by `sumHouseholdEmployeeWages` at TaxReturnComputeService.java:11422-11432 via the `householdEmployeeAmount` helper at line 11434). The standalone YAML had been dead since at least 2026-04-12 (per the outstanding.md entry timestamp). Audit framed this as "OUT OF SCOPE FOR LINE 1z. Defer to a future line-1b audit." Investigation revealed the deferred work had already been documented in outstanding.md ("Line 1b: Dead YAML — 1b-household-employee-wages.yaml") with explicit deletion pre-authorization ("Delete the file once confirmed it has no external dependencies"). Post-fix: verified absence of external dependencies via grep (matches ONLY in documentation files: outstanding.md, knowledge/line-1z-total-wages.md, history.md, and this Issue #5 row); confirmed no `loadYaml`/yaml-scanning code in us-tax-be/src; deleted the orphaned file via plain `rm` (`us-tax/` is not a git repo); marked the outstanding.md entry as `~~Resolved 2026-05-10~~` with strikethrough heading per the established closure pattern (cf. neighboring "Form 8919 Collision Guard" example). Consolidated the audit closure with the long-standing outstanding.md item. No code change, no test change. Backend stays at 746/746.', 'C:/us-tax/yamls/1b-household-employee-wages.yaml (deleted); outstanding.md (entry marked resolved)', 'CLOSED — orphaned file removed; outstanding.md item closed in same operation. The audit\'s "defer" recommendation was conservative; the outstanding.md entry already pre-authorized deletion conditional on dependency verification, which was completed during this audit walkthrough.'],
  [6, 'VERIFIED CORRECT — LINE 1z FORMULA MATCHES IRS SPEC — VERIFIED CORRECT 2026-05-10', 'Audit observation re-verified at TaxReturnComputeService.java:4140-4141: 8-operand addNonNull chain lists exactly line1a through line1h in order, line 1i intentionally excluded. Matches IRS 2025 Form 1040 line 1z label "Add lines 1a through 1h" exactly. Same formula stated in lines/1z.md §4 and dependencies/1z.md "Computation Logic Summary". The breadcrumb at line 4136-4142 was added during the 1i #9 closure earlier today (verification date 2026-05-10); extended during this 1z #6 closure to additionally cite the 1z audit and enumerate ALL THREE lock-in tests: (1) `computesLine1zSumExcludesCombatPayElection` (composite scenario asserting line 1z = -$5,280 with adoption + combat pay), (2) `line1zMinimalLine1iExclusion` (added Issue #2 — minimal isolation, asserts $4,000 line 1z + $2,000 line 1i separate), (3) `line1zEqualsLine1aWhenOnlyW2Wages` (added Issue #2 — baseline asserting line 1z = line 1a when no other sub-lines contribute). Multi-test breadcrumb pattern matches line 1i #10 closure. No code-behavior change.', 'TaxReturnComputeService.java:4136-4145 (extended breadcrumb); 3 lock-in tests in TaxReturnComputeServiceTest', 'CLOSED — verified correct, no fix needed. Triple lock-in protection (composite + minimal + baseline) against accidental re-coupling of line 1i into line 1z.'],
  [7, 'VERIFIED CORRECT — LINE 9 INVARIANT — VERIFIED CORRECT 2026-05-10', 'Audit observation re-verified at TaxReturnComputeService.java:4147-4150: `line9 = roundMoney(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(line1z, line2b), line3b), line4b), line5b), line6b), line7a), line8))` — exactly 8 operands (line 1z + 2b + 3b + 4b + 5b + 6b + 7a + 8). Matches IRS 2025 Form 1040 line 9 label "Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8" exactly. Matches lines/1z.md §4 ("Form1040.Line9 = Line1z + Line2b + Line3b + Line4b + Line5b + Line6b + Line7a + Line8"). Existing test (renamed to `line9EqualsLine1zPlusOtherIncomeLines` during 1z #2 closure) — W-2 $50,000 + 1099-INT $1,000 + 1099-DIV $500 ordinary → asserts income.totalIncome = $51,500. Audit-revisited-as-verified-and-documented closure: extended the inline comment at line 4146 with audit ID + verification date + lock-in test name. No code-behavior change.', 'TaxReturnComputeService.java:4146-4147 (extended breadcrumb); test line9EqualsLine1zPlusOtherIncomeLines (added during 1z #2 closure)', 'CLOSED — verified correct, no fix needed. Lock-in test (added during Issue #2) protects the invariant against future changes to line 9 operand list.'],
  [8, 'VERIFIED CORRECT — NEGATIVE SUB-LINE PASS-THROUGH — VERIFIED CORRECT 2026-05-10', 'Audit observation re-verified: addNonNull at TaxReturnComputeService.java:11425 performs algebraic addition (`left.add(right)`) with NO max(0, ...) floor. The line 1z addNonNull chain at line ~4143-4144 therefore passes negative sub-lines through algebraically. Notably line 1f (employer adoption benefits) may be NEGATIVE for special-needs final adoptions where IRC §137(a)(3) lifetime exclusion exceeds current-year reported benefits — see lines/1f.md §4.2 and lines/1z.md §6. The negative carries through to line 9 / AGI / line 11b; floor at max(0, ...) is applied only at line 15 (taxable income). Existing test `computesLine1zSumExcludesCombatPayElection` asserts line 1z = -$5,280 for a $10,000 wages + -$15,280 adoption-benefits scenario (assertion at TaxReturnComputeServiceTest:6344). Audit-revisited-as-verified-and-documented closure: added a dedicated 6-line breadcrumb comment immediately after the `roundMoney(totalWagesRaw)` line, documenting the algebraic-addition / no-floor semantic + audit ID + lock-in test name. Modular comment separation: line-1i-exclusion breadcrumb (Issues #6, 1i #9) stays focused on its concern; this new breadcrumb stays focused on negative pass-through. No code-behavior change.', 'TaxReturnComputeService.java:4145-4150 (new breadcrumb after roundMoney); existing test computesLine1zSumExcludesCombatPayElection at TaxReturnComputeServiceTest:6291 (asserts line 1z = -$5,280)', 'CLOSED — verified correct, no fix needed. Lock-in test protects against accidental introduction of a max(0, ...) floor at the line 1z aggregation level.'],
  [9, 'VERIFIED CORRECT — NULL PROPAGATION — VERIFIED CORRECT 2026-05-10 (helper-level; end-to-end path currently unreachable)', 'Audit observation partially re-verified: HELPER-LEVEL semantic is correct — when all 8 sub-lines (1a-1h) are null, the left-fold addNonNull chain returns null (addNonNull(null, null) = null at every step), roundMoney(null) = null, and the `if (line1z != null)` guard at line ~4203 correctly leaves income.totalWages unset → framework omits null fields → PDF cell blank. Matches lines/1z.md §6. PRACTICAL LIMITATION (per Issue #1 investigation): the end-to-end "all sub-lines null → line 1z null" path is currently UNREACHABLE in observable scenarios because line 1e (dependentCareBenefits) returns BigDecimal.ZERO — not null — when the childcare-expenses form is absent (a stylistic 0-vs-null choice mirroring line 1h #4(g)). So line 1z is always non-null whenever ANY sub-line compute runs. The defensive `else if (hasEmploymentFlag)` branch (added during Issue #1) is dormant for the same reason. Both the null-propagation path AND the hasEmploymentFlag override become active only if line 1e is ever refactored to return null on absent form. Closure: extended the consolidated breadcrumb at line ~4195-4207 to document both Issue #1 (hasEmploymentFlag mirror) AND Issue #9 (null propagation semantic) with the practical-limitation note. Also fixed a stale reference in the existing breadcrumb to the dropped `line1zStaysNullWhenNoEmploymentFlagAndNoWageInputs` test. No code-behavior change.', 'TaxReturnComputeService.java:4195-4211 (consolidated Issue #1 + #9 breadcrumb)', 'CLOSED — verified correct at the helper level, no fix needed. End-to-end coverage gap (sub-gap a from Issue #2) documented as a known limitation. Future broader cleanup of the line 1e/1f/1g/1h stylistic 0-vs-null choices would activate this path; tracked implicitly via the helper-level breadcrumb.'],
  [10, 'VERIFIED CORRECT — NO MFS GUARD NEEDED AT LINE 1z LEVEL — VERIFIED CORRECT 2026-05-10', 'Audit observation re-verified: line 1z aggregation at TaxReturnComputeService.java:4143-4145 reads no spouse / filing-status / SSN-attributed data. It simply sums 8 pre-computed sub-line values via the addNonNull chain. The single-guard MFS cascade pattern lives one level down at each sub-line: lines 1c, 1d, 1e, 1f, 1g, 1h, 1i ALL accept `isMfsReturn` parameters as of the 1c-1i audit closures (7-line cascade per line 1i Issue #1 closure 2026-05-10); lines 1a/1b use SSN-filter inside `computeLine1aWages`/`sumHouseholdEmployeeWages`. Adding an MFS guard at line 1z would be redundant (sub-lines already gate spouse contributions) AND potentially harmful (could mask sub-line bugs by double-suppressing legitimate values). Architecturally the aggregator is the WRONG layer for MFS logic — its job is summing, not filtering. **Pure xlsx-flip closure** (no breadcrumb — the absent MFS guard is correctly absent, and the xlsx audit trail is sufficient documentation; same shape as line 1h #10 Form 4852 closure). No code change, no test change.', 'TaxReturnComputeService.java:4143-4145 (aggregation; no spouse/filing-status references); single-guard MFS cascade documented at sub-line level in lines/1c.md through lines/1i.md', 'CLOSED — verified correct by design. The architectural separation (sub-lines own MFS gating; line 1z owns aggregation) is the canonical pattern across the 9-line wage-row block (1a-1i + 1z).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 28 }, { wch: 95 }, { wch: 60 }, { wch: 95 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 1z Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.totalWages', 'topmostSubform[0].Page1[0].f1_57[0] (line1z_total_wages)', 'form-tax-return-1040.xlsx (line 1z cell)', '★ Primary output — printed on Form 1040 line 1z. Whole-dollar HALF_UP rounded. Stored only when non-null EXCEPT for hasEmploymentFlag-true-with-no-W-2 (Code Validation #1).'],
  ['(no separate statement attachment)', '(no PDF write-in)', '—', 'Line 1z has no statement-text component. The IRS form has no write-in area for line 1z.'],
  [],
  ['DOWNSTREAM CONSUMERS'],
  ['Form 1040 line 9 (total income)', 'topmostSubform[0].Page1[0].f1_64[0] (line9_total_income)', 'form-tax-return-1040.xlsx', 'line9 = line1z + line2b + line3b + line4b + line5b + line6b + line7a + line8. Wired at TaxReturnComputeService.java:4144-4147.'],
  ['Form 1040 line 11b (AGI)', 'topmostSubform[0].Page1[0].(line11b_adjusted_gross_income)', 'form-tax-return-1040.xlsx', 'AGI = line9 - line10. Line 1z reaches AGI via line 9.'],
  ['Form 1040 line 15 (taxable income)', 'topmostSubform[0].Page1[0].(line15_taxable_income)', 'form-tax-return-1040.xlsx', 'line15 = max(0, AGI - total deductions). Line 1z reaches line 15 via AGI. (NOTE: line 15 applies the floor; line 1z itself can be negative.)'],
  ['Schedule 8812 line 18a', 'topmostSubform[0].Page1[0].(line18a)', 'form-tax-return-schedule8812.xlsx', 'line18a = totalWages + nontaxableCombatPayElection (combat pay added separately for line 18b disclosure). Wired at TaxReturnComputeService.computeSchedule8812() line 19087-19096.'],
  ['Schedule 8812 line 19 (ACTC floor)', '—', '—', 'line19 = max(0, line18a - $2,500). Line 1z indirectly drives the ACTC 15% floor.'],
  ['EIC earned income (line 27a worksheet)', '—', '—', 'EIC earned income includes line 1z component. Wired at TaxReturnComputeService.computeLine27aEIC() — post 1i Issue #2 closure, EIC reads form1040.income.nontaxableCombatPayElection directly (single source of truth) alongside totalWages.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 1i (nontaxable combat pay election)', 'topmostSubform[0].Page1[0].f1_56[0] (line1i_nontaxable_combat_pay)', 'form-tax-return-1040.xlsx', 'EXCLUDED FROM line 1z by design. Set on income.nontaxableCombatPayElection separately. Verified at TaxReturnComputeService.java:4137-4139 (breadcrumb extended during 1i Issue #9 closure 2026-05-10).'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 70 }, { wch: 50 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

// Write
XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
