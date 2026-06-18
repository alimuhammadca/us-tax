// ============================================================================
//  Generates: C:\us-tax\XLS\computations\20.xlsx
//
//  Source-of-truth references:
//    - lines/20.md (2025-tax-year spec; sections 1-9; 333 lines; defines line 20 =
//      Schedule 3 line 8 = nonrefundable credits subtotal; full 17-credit Schedule
//      3 Part I structure documented + 11-line Schedule 3 Part II structure for
//      line 31 cross-ref.
//      ⚠️ §6 "Known Implementation Bug — Line 7" subsection (lines 225-241) is
//      STALE — describes G6 as open bug; G6 was FIXED 2026-04-18 per
//      dependencies/20.md G6 row + knowledge §3 + actual code.
//      ⚠️ §6 row 267 "Implementation Status as of 2026-04-18" table still says
//      "Bug — shows only 6z, not sum(6a–6z)" for line 7; also STALE.)
//    - dependencies/20.md (144 lines; 27-row Direct Inputs Part I table + 11-row
//      Direct Inputs Part II table + Outputs + CLW-A consumers (Schedule 8812) +
//      PDF field map (~30 fields) + Compute Order + 7 documented gaps G1-G7
//      with current status. G1/G3/G5/G6 fixed 2026-04-18; G2 BLOCKED; G4 OOS;
//      G7 partial.)
//    - knowledge/line-20-amount-from-schedule3-line8.md (renamed from
//      knowledge_line20.md via 20 #2 2026-05-14; 13th Legacy A migration; 317 lines;
//      full audit covering line identity + core formula + Schedule 3 structure
//      with all credits + key backend methods + frontend + Java model classes +
//      compute order + unit test inventory (≥15 tests) + E2E test inventory +
//      identified gaps.
//      ⚠️ §5 line 185 has STALE annotation "(⚠ shows 6z only, not sum)" for
//      f1_24[0]; contradicts §2 line 23 + §3 row 66 + §4 line 95 which all
//      correctly describe G6 as fixed.)
//    - TaxReturnComputeService.java:
//        line 1618 — call site for computeLine20ThroughLine24
//        line 18800-18855 — finalizeSchedule3Totals (★ G6 FIX at lines 18807-18821:
//          line7 = sum 13 credits 6a-6z; line8 = 1+2+3+4+5a+5b+7 correctly)
//        line 19354-19387 — computeLine20ThroughLine24 (Form 1040 lines 20+21+22+24)
//    - IRS 2025 Form 1040 (line 20 "Amount from Schedule 3, line 8")
//    - IRS 2025 Schedule 3 (Form 1040) — Part I lines 1-8 + Part II lines 9-15
//    - IRS 2025 Instructions for Form 1040 / Schedule 3
//    - docs/books/i1040gi_2025.txt + J.K. Lasser's Your Income Tax 2025
//
//  Tax year: 2025
//
//  Concept:
//    Form1040.line20 = Schedule3.line8 (nonrefundable credits subtotal)
//
//    Schedule 3 Part I (nonrefundable credits → line 20):
//      line 7 = sum(6a through 6z)                  (subtotal of "other" credits)
//      line 8 = line1 + line2 + line3 + line4 + line5a + line5b + line7
//
//    Line 20 is a PURE PASS-THROUGH from Schedule 3 line 8. No transformation;
//    no reference data; no decision tree. The computation complexity lies UPSTREAM
//    in the 17 Schedule 3 Part I credit fields (each one driven by a separate
//    `applyXxxToSchedule3()` method).
//
//    Paired with downstream lines:
//      line 21 = line 19 + line 20                  (total nonrefundable credits)
//      line 22 = max(0, line 18 − line 21)          (tax after credits)
//      line 24 = line 22 + line 23                  (TOTAL TAX — final)
//
//    Line 31 (refundable payments) is a SEPARATE pass-through from Schedule 3
//    line 15; computed by `computeLine31ThroughLine38` (out of scope for line 20
//    audit; line 31 will get its own audit).
//
//  Line 20 audit positioning (7th audit OUTSIDE 13ab pair):
//   • SECOND credits-section audit (after line 19)
//   • Cumulative position: 46th line
//   • ★ SIMPLEST CREDITS-SECTION line — pure pass-through; no orchestrator
//     complexity (contrast with line 19 which was heavy-compute orchestrator)
//   • Uses 16 #4 + 17 #4 navigable hubs + 19 #5/6/7/8 breadcrumbs (upstream)
//   • Likely DEFENSIVE-GAP-NOT-NEEDED Issue #1 — inline-computed at single
//     site; computeLine20ThroughLine24 takes NO per-spouse parameters
//   • ⚠️ DOCUMENTATION DRIFT — spec §6 + knowledge §5 still describe G6 as open
//     bug; FIXED 2026-04-18 per dependencies + code
//
//  Line 20 audit angles (10 issues):
//   1. CROSS-REFERENCE — NO MFS DEFENSIVE GAP NEEDED at computeLine20ThroughLine24
//       site (inline-computed; no per-spouse parameters; transitive inheritance
//       from upstream Schedule 3 fields). 12th defensive-gap-NOT-needed Issue #1.
//       MFS cascade UNCHANGED at 20 orchestrators.
//   2. DOCUMENTATION HYGIENE — Knowledge file Legacy A rename
//       (knowledge_line20.md → line-20-amount-from-schedule3-line8.md); 13th
//       Legacy A migration; convergence 25 → 26 lines.
//   3. SPEC ENHANCEMENT — Verification log section §10 in lines/20.md
//       (single-row pattern; smallest log shape).
//   4. ★ DOCUMENTATION DRIFT FIX — lines/20.md §6 "Known Implementation Bug"
//       (lines 225-241) + §6 row 267 implementation status table + line-20-amount-from-schedule3-line8.md
//       (renamed from knowledge_line20.md via 20 #2) §5 line 185 PDF table annotation
//       all STALE; G6 was FIXED 2026-04-18 per dependencies + code. 8th documentation
//       drift fix in workflow.
//   5. VERIFIED CORRECT — finalizeSchedule3Totals (Schedule 3 lines 7 + 8 +
//       Part II lines 14 + 15 computations).
//   6. VERIFIED CORRECT — computeLine20ThroughLine24 (Form 1040 lines 20, 21,
//       22, 24 computations + wiring to TaxAndCredits).
//   7. VERIFIED CORRECT — 17-credit Schedule 3 Part I input chain (all
//       applyXxxToSchedule3() methods + compute order).
//   8. VERIFIED CORRECT — downstream consumers (line 21 + line 22 + line 24 +
//       CLW-A consumers via Schedule 8812).
//   9. ⚠️ BUNDLED OBSERVATIONS — 3 observations: (a) G2 Form 8978 negative line
//       14 → line 6l BLOCKED on Form 8978 impl; (b) missing diagrams/20.drawio
//       (flowcharts/20.drawio exists; data-flow diagram absent); (c) G7 partial
//       E2E coverage. 17th Path A application.
//  10. BOUNDARY MILESTONE — second credits-section audit; 46 lines / 457 issues /
//       backend 765 UNCHANGED / MFS cascade UNCHANGED at 20 orchestrators; 8 doc
//       drift fixes / 17 Path A / 7 anti-duplication; 21 consecutive zero-
//       outstanding walkthroughs.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '20.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 20 — AMOUNT FROM SCHEDULE 3, LINE 8 (Nonrefundable credits subtotal) — 2025'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 20 (page 2; "Amount from Schedule 3, line 8")'],
  ['Concept',
    'Line 20 is a PURE PASS-THROUGH from Schedule 3 line 8 — the nonrefundable-credit subtotal that ' +
    'combines with line 19 (CTC + ODC) before the return subtracts credits from tax. ★ SIMPLEST credits-' +
    'section line — pure addition pass-through; computation complexity is UPSTREAM in the 17 Schedule 3 ' +
    'Part I credit fields (each driven by a separate `applyXxxToSchedule3()` method).'],
  ['Top-level formula (spec §2)',
    'Form1040.line20 = Schedule3.line8\n' +
    'Schedule3.line8 = line1 + line2 + line3 + line4 + line5a + line5b + line7\n' +
    'Schedule3.line7 = sum(line6a + line6b + line6c + line6d + line6f + line6g + line6h + line6i +\n' +
    '                       line6j + line6k + line6l + line6m + line6z)\n' +
    '(line 6e reserved/blank; line 7 omits 6e per IRS form layout)'],
  ['Schedule 3 Part I credits — 17 fields feeding line 20 (spec §3a + dependencies §1)',
    'PRIMARY 6 (lines 1-5b):\n' +
    '  line 1   FTC                                  → Form 1116 → applyForeignTaxCreditToSchedule3\n' +
    '  line 2   Child/dependent care credit          → Form 2441 → finalizeForm2441PartII\n' +
    '  line 3   Education credits                    → Form 8863 → applyForm8863ToSchedule3\n' +
    '  line 4   Saver\'s credit                       → Form 8880 → applyForm8880ToSchedule3\n' +
    '  line 5a  Residential clean energy credit      → Form 5695 → applyForm5695ToSchedule3\n' +
    '  line 5b  Energy efficient home improvement    → Form 5695 → applyForm5695ToSchedule3\n' +
    '\n' +
    'SUBTOTAL "OTHER" 11 (lines 6a-6m + 6z, EXCLUDING 6e reserved):\n' +
    '  line 6a  General business credit              → Form 3800 (OUT OF SCOPE per CLAUDE.md)\n' +
    '  line 6b  Prior-year minimum tax credit        → Form 8801 → applyForm8801ToSchedule3\n' +
    '  line 6c  Adoption credit (★ G1 fix 2026-04-18)→ Form 8839 → applyAdoptionCredit (with CLW-B)\n' +
    '  line 6d  Elderly/disabled credit              → Schedule R → applyScheduleRToSchedule3\n' +
    '  line 6e  RESERVED                              → always blank/zero\n' +
    '  line 6f  Clean vehicle credit                 → Form 8936 → applyForm8936ScheduleAToSchedule3\n' +
    '  line 6g  Mortgage interest credit             → Form 8396 → applyForm8396ToSchedule3\n' +
    '  line 6h  DC first-time homebuyer credit       → Form 8859 → applyForm8859ToSchedule3\n' +
    '  line 6i  Qualified EV credit                  → Form 8834 → applyForm8834ToSchedule3\n' +
    '  line 6j  Alt fuel refueling property credit   → Form 8911 → applyForm8911ToSchedule3\n' +
    '  line 6k  Credit to holders of tax credit bonds→ Form 8912 → applyForm8912ToSchedule3\n' +
    '  line 6l  Amount from Form 8978 line 14 (neg)  → ⚠️ BLOCKED on Form 8978 impl (G2)\n' +
    '  line 6m  Previously owned clean vehicle       → Form 8936 → applyForm8936ScheduleAToSchedule3\n' +
    '  line 6z  Other nonrefundable credits (write-in)→ other-payments personal form\n' +
    '\n' +
    '★ Line 6e RESERVED — always blank per IRS 2025 form; sumAmounts(...) at line 18807-18821\n' +
    '   correctly OMITS 6e (12 fields summed instead of 13).'],
  ['Schedule 3 Part II (cross-reference for line 31 — NOT in line 20)',
    '★ Line 31 = Schedule 3 line 15 is a SEPARATE pass-through (refundable payments;\n' +
    'computed by `computeLine31ThroughLine38`; out of scope for line 20 audit). For context:\n' +
    '  line 9   Net premium tax credit              → Form 8962\n' +
    '  line 10  Amount paid with extension          → Form 4868\n' +
    '  line 11  Excess SS / RRTA tax withheld       → W-2 box 4\n' +
    '  line 12  Fuel tax credit (★ G3 fix 2026-04-18) → manual entry via 31-other-payments\n' +
    '  line 13a Form 2439 credit                    → Form 2439 statement\n' +
    '  line 13b §1341 credit                        → other-payments personal form\n' +
    '  line 13c Net elective payment (Form 3800)    → OUT OF SCOPE\n' +
    '  line 13d Deferred 965 tax (★ G5 fix 2026-04-18)→ manual entry via 31-other-payments\n' +
    '  line 13z Other refundable credits (write-in) → other-payments personal form\n' +
    '  line 14  = sum(13a..13z)\n' +
    '  line 15  = 9 + 10 + 11 + 12 + 14            → Form 1040 line 31'],
  ['Downstream flow (spec §2 + §4)',
    'line 21 = line 19 + line 20                    (total nonrefundable credits)\n' +
    'line 22 = max(0, line 18 − line 21)            (tax after nonrefundable credits)\n' +
    'line 23 = Schedule 2 line 21                    (other taxes from Schedule 2 Part II)\n' +
    'line 24 = line 22 + line 23                    (★ TOTAL TAX — final)'],
  ['Output target',
    'Primary: form1040.taxAndCredits.otherCreditsSchedule3 (BigDecimal; line 20 output)\n' +
    'Secondary (computed in same method):\n' +
    '  form1040.taxAndCredits.totalCredits        (line 21 = line19 + line20; null when ≤ 0)\n' +
    '  form1040.taxAndCredits.taxAfterCredits     (line 22 = max(0, line18 − line21))\n' +
    '  form1040.taxAndCredits.totalTax            (line 24 = line22 + line23)\n' +
    'PDF field: line20_amount_from_schedule3_line8 (page 2)'],
  ['Backend implementation',
    '**TWO METHODS** — `finalizeSchedule3Totals` at TaxReturnComputeService.java:18800-18855 ' +
    '(computes Schedule 3 lines 7+8 + Part II lines 14+15) + `computeLine20ThroughLine24` at ' +
    '~line 19354-19387 (wires Form 1040 lines 20, 21, 22, 24 from Schedule 3 totals). ' +
    'Call site at prepare() ~line 1618 (after finalizeSchedule3Totals at ~line 1612). ' +
    'Compute order critical: Schedule 3 totals must finalize BEFORE Form 1040 lines 20-24 wire.'],
  ['IRS source',
    'IRS 2025 Form 1040 (page 2 line 20 "Amount from Schedule 3, line 8") + 2025 Schedule 3 ' +
    '(Form 1040; Part I lines 1-8 nonrefundable credits) + 2025 Instructions for Form 1040 / ' +
    'Schedule 3. Local cross-checks: docs/books/i1040gi_2025.txt + J.K. Lasser\'s Your Income Tax 2025. ' +
    'No 2025-specific changes to line 20 arithmetic; lines 5b + 6c-6m structure unchanged from 2024.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'All applyXxxToSchedule3() methods run', 'Per prepare() lines ~827-1048 — 17 separate methods populate the Schedule 3 Part I credit fields (FTC, childcare, education, saver\'s, energy, EV, mortgage, etc.).'],
  [2, 'finalizeSchedule3Totals(schedule3) compute Schedule 3 line 7', 'sumAmounts of 13 fields: 6a generalBusinessCredit + 6b priorYearMinimumTaxCredit + 6c adoptionCredit + 6d elderlyDisabledCredit + 6f cleanVehicleCredit + 6g mortgageInterestCredit + 6h dcFirstTimeHomebuyerCredit + 6i qualifiedElectricVehicleCredit + 6j alternativeFuelVehicleRefuelingPropertyCredit + 6k creditToHoldersOfTaxCreditBonds + 6l amountFromForm8978Line14 + 6m creditPreviouslyOwnedCleanVehicles + 6z otherNonrefundableCredits. ★ G6 FIX 2026-04-18 — was line 6z only.'],
  [3, 'finalizeSchedule3Totals compute Schedule 3 line 8', 'sumAmounts: line 1 FTC + line 2 childcare + line 3 education + line 4 saver\'s + line 5a clean energy + line 5b energy efficiency + line 7 (subtotal from step 2). 7-operand sum. Per IRS Schedule 3 form formula.'],
  [4, 'Form 1040 line 20 read from Schedule 3 line 8', 'line20 = schedule3.nonrefundableCredits.totalNonrefundableCredits if > 0 else null. Per `computeLine20ThroughLine24` line 19362-19366. ★ Null-when-zero convention (vs. line 19 unconditional wire).'],
  [5, 'Form 1040 line 20 wired to TaxAndCredits', 'tac.setOtherCreditsSchedule3(line20). Per `computeLine20ThroughLine24` line 19368.'],
  [6, 'Form 1040 line 21 = line 19 + line 20', 'line19 = safeAmount(tac.getChildTaxCredit()); line21 = roundMoney(line19 + safeAmount(line20)); set if > 0 else null. Per line 19371-19373.'],
  [7, 'Form 1040 line 22 = max(0, line 18 − line 21)', 'line18 = safeAmount(tac.getTotalTaxBeforeCredits()); line22 = roundMoney(max(0, line18 − line21)). Per line 19376-19378. ★ Floor at 0 (negative tax not permitted).'],
  [8, 'Form 1040 line 24 = line 22 + line 23 (★ TOTAL TAX)', 'line23 = safeAmount(tac.getOtherTaxes()) (= Schedule 2 line 21); line24 = roundMoney(line22 + line23); set if > 0 else 0. Per line 19381-19383. ★ THIS IS THE FINAL TOTAL TAX.'],
  [9, 'Log line 20 / 21 / 22 / 23 / 24', 'LOG.infof at line 19385-19386. Diagnostic output.'],
  [10, 'Downstream: CLW-A reads schedule3 credit fields', 'Schedule 8812 CLW-A subtracts line 1 FTC + line 2 childcare + line 3 education + line 4 saver\'s + line 6d elderly/disabled + line 6l Form 8978 (G2 BLOCKED). Per 19 #5 Part I breadcrumb.'],
  [],
  ['INVARIANTS / VALIDATIONS (spec §7)'],
  ['Invariant', 'Rationale'],
  ['line 7 = sum(line 6a through line 6z)', 'Per spec §7 + IRS Schedule 3 form. **★ G6 FIX 2026-04-18 lock-in** — pre-fix this was line 6z only; fixed at finalizeSchedule3Totals lines 18807-18821. Lock-in test: `schedule3Line7TotalOtherNonrefundableCreditsIsSum6aThroughZ`.'],
  ['line 8 = line 1 + line 2 + line 3 + line 4 + line 5a + line 5b + line 7', 'Per spec §7 + IRS Schedule 3 form. ★ STRUCTURALLY enforced by sumAmounts at lines 18824-18832. ★ IRS formula: lines 6a-6m + 6z are NOT listed individually in line 8 (they appear via line 7 subtotal).'],
  ['Form1040.line20 = Schedule3.line8', 'Per spec §1 + IRS Form 1040 line 20 label. STRUCTURALLY enforced by line 19362-19366.'],
  ['line 6e remains zero (reserved)', 'Per spec §7. IRS marks line 6e "Reserved for future use" in 2025; sumAmounts at line 18807-18821 correctly OMITS 6e (12 fields summed, not 13).'],
  ['line 6z + line 13z require write-in description', 'Per spec §7. Each write-in line has both amount field AND description text field (PDF f1_23 + f2_22 for 6z; f1_32 + f1_34 for 13z).'],
  ['line 20 ≥ 0', 'Each input credit ≥ 0; sum ≥ 0; STRUCTURALLY guaranteed.'],
  ['Each nonzero Schedule 3 line should have supporting form attached', 'Per spec §7. Validated at each `applyXxxToSchedule3()` method (e.g., Form 1116 attached when FTC > 0).'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 38 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 20'],
  ['Line 20 takes 17 inputs (16 implemented + 1 blocked) — each from a separate Schedule 3 Part I credit field. ★ SIMPLEST credits-section input table — all inputs are already-populated TaxAndCredits.Schedule3.nonrefundableCredits fields. Computation complexity is UPSTREAM in the 17 applyXxxToSchedule3() methods.'],
  [],
  ['#', 'Source form', 'Schedule 3 line', 'Java field (Schedule3.nonrefundableCredits)', 'Apply method', 'XLS input/output form reference'],
  [1, 'Form 1116 (FTC)', 'line 1', 'foreignTaxCredit', 'applyForeignTaxCreditToSchedule3', 'XLS/input_forms/form-foreign-tax-credit-taxpayer.xlsx + spouse'],
  [2, 'Form 2441 (childcare)', 'line 2', 'childDependentCareCredit', 'finalizeForm2441PartII', 'XLS/input_forms/form-childcare-expenses.xlsx'],
  [3, 'Form 8863 (education)', 'line 3', 'educationCredits', 'applyForm8863ToSchedule3', 'XLS/input_forms/form-education-credits.xlsx'],
  [4, 'Form 8880 (saver\'s)', 'line 4', 'retirementSavingsContributionsCredit', 'applyForm8880ToSchedule3', 'XLS/input_forms/form-savings-credit-spouse.xlsx + taxpayer'],
  [5, 'Form 5695 (clean energy)', 'line 5a', 'residentialCleanEnergyCredit', 'applyForm5695ToSchedule3', 'XLS/input_forms/form-energy-credit.xlsx'],
  [6, 'Form 5695 (energy efficiency)', 'line 5b', 'energyEfficientHomeImprovementCredit', 'applyForm5695ToSchedule3', 'same'],
  [7, 'Form 3800 (general business)', 'line 6a', 'generalBusinessCredit', '(out of scope per CLAUDE.md)', '(deferred — SE-related)'],
  [8, 'Form 8801 (prior-year AMT)', 'line 6b', 'priorYearMinimumTaxCredit', 'applyForm8801ToSchedule3', 'XLS/input_forms/form-prior-min-tax-credit.xlsx'],
  [9, 'Form 8839 (adoption)', 'line 6c', 'adoptionCredit', 'applyAdoptionCredit (with CLW-B; G1 fix 2026-04-18)', 'XLS/input_forms/form-adoption-expenses.xlsx'],
  [10, 'Schedule R (elderly/disabled)', 'line 6d', 'elderlyDisabledCredit', 'applyScheduleRToSchedule3', 'XLS/input_forms/form-elderly-disabled-credit.xlsx'],
  [11, 'Form 8936 Schedule A (clean vehicle)', 'line 6f', 'cleanVehicleCredit', 'applyForm8936ScheduleAToSchedule3', 'XLS/input_forms/form-clean-car-credit.xlsx'],
  [12, 'Form 8396 (mortgage interest)', 'line 6g', 'mortgageInterestCredit', 'applyForm8396ToSchedule3', 'XLS/input_forms/form-mortgage-interest-credit.xlsx'],
  [13, 'Form 8859 (DC homebuyer)', 'line 6h', 'dcFirstTimeHomebuyerCredit', 'applyForm8859ToSchedule3', 'XLS/input_forms/form-carryforward-homebuyer-credit.xlsx'],
  [14, 'Form 8834 (qualified EV)', 'line 6i', 'qualifiedElectricVehicleCredit', 'applyForm8834ToSchedule3', 'XLS/input_forms/form-electric-vehicle-credit.xlsx'],
  [15, 'Form 8911 (alt fuel refueling)', 'line 6j', 'alternativeFuelVehicleRefuelingPropertyCredit', 'applyForm8911ToSchedule3', 'XLS/input_forms/form-alt-fuel-credit.xlsx'],
  [16, 'Form 8912 (tax credit bonds)', 'line 6k', 'creditToHoldersOfTaxCreditBonds', 'applyForm8912ToSchedule3', 'XLS/input_forms/form-bond-credit.xlsx'],
  [17, 'Form 8978 (BBA partnership)', 'line 6l', 'amountFromForm8978Line14', '⚠️ NOT IMPLEMENTED — G2 BLOCKED on Form 8978', '(deferred)'],
  [18, 'Form 8936 Schedule A (previously owned EV)', 'line 6m', 'creditPreviouslyOwnedCleanVehicles', 'applyForm8936ScheduleAToSchedule3', 'XLS/input_forms/form-clean-car-credit.xlsx'],
  [19, 'other-payments personal form (write-in)', 'line 6z', 'otherNonrefundableCredits', 'applyOtherPaymentsFormToSchedule3', 'XLS/input_forms/form-other-payments.xlsx'],
  [20, 'computed Schedule 3 (line 7 subtotal)', 'line 7', 'totalOtherNonrefundableCredits', 'finalizeSchedule3Totals (★ G6 fix sums all 13 fields)', '(computed)'],
  [21, 'Form 1040 (line 18 totalTaxBeforeCredits)', '—', '—', 'computeLine20ThroughLine24 reads via tac.getTotalTaxBeforeCredits()', 'per 18 #5 + 18 #6 breadcrumbs'],
  [22, 'Form 1040 (line 19 CTC + ODC)', '—', '—', 'computeLine20ThroughLine24 reads via tac.getChildTaxCredit()', 'per 19 #5-#8 breadcrumbs'],
  [23, 'Schedule 2 (line 23 other taxes)', '—', '—', 'computeLine20ThroughLine24 reads via tac.getOtherTaxes()', 'finalizeSchedule2OtherTaxes per Schedule 2 audit (future)'],
  [],
  ['⚠️ NO DEDICATED USER INPUT FORM FOR LINE 20'],
  ['Line 20 has NO `form-line20-*.xlsx` in C:\\us-tax\\XLS\\input_forms\\. All inputs are derived from upstream Schedule 3 Part I credit fields. Line 20 is NOT visible as a standalone form in the sidebar — it is shown on the `form-tax-return-1040` Tax Return view + Schedule 3 PDF. No user-supplied data feeds line 20 directly.'],
  [],
  ['⚠️ TRANSITIVE INHERITANCE OF MFS FIXES'],
  ['All inputs inherit MFS protection TRANSITIVELY from upstream orchestrator audits:'],
  ['Input', 'Upstream MFS guard', 'Status'],
  ['nc.foreignTaxCredit (Schedule 3 line 1)', 'computeForm1116 (Form 1116 itself is per-spouse, but Schedule 3 line 1 is return-level sum)', '✅ Inherits transitively'],
  ['nc.childDependentCareCredit (line 2)', 'finalizeForm2441PartII (Form 2441 is return-level)', '✅ Inherits transitively'],
  ['nc.educationCredits (line 3)', 'applyForm8863ToSchedule3 (Form 8863 is return-level)', '✅ Inherits transitively'],
  ['nc.adoptionCredit (line 6c)', 'applyAdoptionCredit (Form 8839 per-spouse but G1 fix handles)', '✅ Inherits transitively'],
  ['... (14 other credits)', 'Each apply method handles its own MFS state', '✅ Inherits transitively'],
  ['→ NO MFS GUARD NEEDED at computeLine20ThroughLine24 site', '12th defensive-gap-NOT-needed Issue #1 in workflow', '(See 20 #1)'],
  [],
  ['⚠️ NO MISSING INPUTS for current scope'],
  ['All implemented Schedule 3 Part I credit fields feed line 20 correctly. Only deferred fields are: (a) line 6a Form 3800 General Business Credit (OUT OF SCOPE per CLAUDE.md); (b) line 6l Form 8978 negative line 14 (G2 BLOCKED — requires Form 8978 implementation). Both documented for visibility.'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 42 }, { wch: 18 }, { wch: 50 }, { wch: 55 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 20'],
  ['Line 20 uses ZERO reference data — NO constants, thresholds, brackets, or phase-outs. Pure arithmetic pass-through. ★ Same pattern as line 18 (line 18 = line 16 + line 17; line 20 = Schedule 3 line 8).'],
  [],
  ['Constant', 'Value', 'Statutory Basis', 'Backend identifier'],
  ['(None — pure arithmetic pass-through line)', '—', 'Spec §2 + dependencies/20.md (no constants section)', '—'],
  [],
  ['★ THIS IS A PURE PASS-THROUGH LINE — same shape as line 18'],
  ['Contrast with neighboring lines:'],
  ['Line', '# Constants', 'Complexity'],
  ['line 19 (CTC + ODC)', '~8 (CTC $2,200, ODC $500, ACTC $1,700, phase-out thresholds $400k/$200k, phase-out rate $50/$1k, ACTC floor $2,500, ACTC rate 15%, Part II-B threshold $5,100)', 'Heavy compute orchestrator (Part I + II-A + II-B)'],
  ['**line 20 (Schedule 3 line 8)**', '**0**', '**Pure pass-through: Schedule3.line8 → Form1040.line20**'],
  ['line 21 (CTC + line 20)', '0', 'Pure addition (in same method as line 20)'],
  ['line 22 (max(0, line 18 - line 21))', '0', 'Pure subtraction with floor (in same method)'],
  ['line 24 (line 22 + line 23) — TOTAL TAX', '0', 'Pure addition (in same method)'],
  [],
  ['Upstream credit computations DO use 2025 reference data'],
  ['Form / Schedule 3 line', 'Constants used', 'Audit reference'],
  ['Form 1116 (line 1 FTC)', 'Per-country limitation formula', 'Form 1116 audit (future)'],
  ['Form 2441 (line 2 childcare)', '$3,000/$6,000 expense caps; income-based credit %', 'Form 2441 audit (future)'],
  ['Form 8863 (line 3 education)', 'AOTC $2,500/student + LLC $2,000; MAGI phaseouts $80k/$160k MFJ', 'Form 8863 audit (future)'],
  ['Form 8880 (line 4 saver\'s)', '50%/20%/10% credit rates; AGI thresholds', 'Form 8880 audit (future)'],
  ['Form 5695 (lines 5a/5b)', 'Residential clean energy 30% / energy efficiency caps by type', 'Form 5695 audit (future)'],
  ['Form 8801 (line 6b prior AMT)', 'Prior-year AMT carryforward', 'Form 8801 audit (future)'],
  ['Form 8839 (line 6c adoption)', '2025 max $17,280/child (per 19 audit cross-ref)', 'Form 8839 audit (future)'],
  ['Schedule R (line 6d)', 'Filing-status-based base + AGI/disability income phaseouts', 'Schedule R audit (future)'],
  ['Form 8936 (lines 6f/6m clean vehicle)', '$7,500 new / $4,000 used credit caps', 'Form 8936 audit (future)'],
  ['(other lines 6g-6k)', '(various; each form has own reference data)', '(each form audit)'],
  ['No statutory anchors for line 20 itself', '—', 'Line 20 does not interpret tax law beyond the pass-through; statutory rules are in the upstream credit forms.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 55 }, { wch: 60 }, { wch: 40 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 20 Persistence + Downstream Consumers'],
  ['computeLine20ThroughLine24 sets FOUR fields on TaxAndCredits (lines 20 + 21 + 22 + 24). finalizeSchedule3Totals sets TWO totals on Schedule3.nonrefundableCredits (lines 7 + 8) + TWO totals on Schedule3.otherPaymentsCredits (lines 14 + 15; cross-referenced for line 31).'],
  [],
  ['Output target', 'Where wired', 'Effect', 'XLS output reference'],
  ['Schedule3.nonrefundableCredits.totalOtherNonrefundableCredits', '`finalizeSchedule3Totals` lines 18807-18822', '★ Schedule 3 line 7 = sum of 13 credits (6a-6m + 6z; 6e omitted as reserved). ★ G6 FIX 2026-04-18 — was line 6z only pre-fix.', 'XLS/output_forms/form-tax-return-schedule3.xlsx (line 7)'],
  ['Schedule3.nonrefundableCredits.totalNonrefundableCredits', '`finalizeSchedule3Totals` lines 18824-18832', '★ Schedule 3 line 8 = line1 + line2 + line3 + line4 + line5a + line5b + line7. 7-operand sum.', 'XLS/output_forms/form-tax-return-schedule3.xlsx (line 8)'],
  ['form1040.taxAndCredits.otherCreditsSchedule3', '`computeLine20ThroughLine24` line 19368', '★ CANONICAL line 20 output. = Schedule 3 line 8 if > 0 else null (null-when-zero convention).', 'XLS/output_forms/form-tax-return-1040.xlsx (line 20 cell)'],
  ['form1040.taxAndCredits.totalCredits', '`computeLine20ThroughLine24` line 19373', '★ Form 1040 line 21 = line 19 + line 20 = CTC + ODC + nonrefundable subtotal. Null when ≤ 0.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 21)'],
  ['form1040.taxAndCredits.taxAfterCredits', '`computeLine20ThroughLine24` line 19378', '★ Form 1040 line 22 = max(0, line 18 − line 21). Floor at 0.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 22)'],
  ['form1040.taxAndCredits.totalTax', '`computeLine20ThroughLine24` line 19383', '★★ Form 1040 line 24 — TOTAL TAX = line 22 + line 23 (Schedule 2 other taxes). FINAL TOTAL TAX FIELD.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 24)'],
  [],
  ['Schedule 3 Part II totals (cross-reference for line 31; out of scope for line 20 audit)'],
  ['Schedule3.otherPaymentsCredits.totalOtherPaymentsRefundableCredits', '`finalizeSchedule3Totals` lines 18837-18844', 'Schedule 3 line 14 = sum(13a..13z). 5-operand sum (form2439 + section1341Credit + netElectivePaymentElectionAmount + deferredNet965TaxLiability + otherRefundableCredits).', 'XLS/output_forms/form-tax-return-schedule3.xlsx (line 14)'],
  ['Schedule3.otherPaymentsCredits.totalOtherPaymentsAndRefundableCredits', '`finalizeSchedule3Totals` lines 18846-18853', 'Schedule 3 line 15 = line 9 + line 10 + line 11 + line 12 + line 14. → Form 1040 line 31 (separate audit).', 'XLS/output_forms/form-tax-return-schedule3.xlsx (line 15)'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 21 (total credits)', 'within `computeLine20ThroughLine24` (same method)', '★★ line 21 = line 19 + line 20. line 20 is the nonrefundable subtotal addend.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 21)'],
  ['Form 1040 line 22 (tax after credits)', 'within `computeLine20ThroughLine24` (same method)', '★★ line 22 = max(0, line 18 − line 21). Direct downstream of line 20 via line 21.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 22)'],
  ['Form 1040 line 24 (★★ TOTAL TAX — FINAL)', 'within `computeLine20ThroughLine24` (same method)', '★★ line 24 = line 22 + line 23. The return\'s final TOTAL TAX field.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 24)'],
  ['Schedule 8812 CLW-A (line 13 in Schedule 8812)', 'via 19 #5 + 19 #7 breadcrumbs', '★★ CLW-A subtracts schedule 3 credits from line 18 to compute the nonrefundable cap for CTC/ODC. Reads individual credit fields (foreignTaxCredit, childDependentCareCredit, educationCredits, retirementSavingsContributionsCredit, elderlyDisabledCredit, amountFromForm8978Line14). G6 fix at line 7 does not affect CLW-A (which reads individual fields, not line 7).', 'XLS/output_forms/form-tax-return-schedule8812.xlsx'],
  [],
  ['PDF Output'],
  ['PDF Field', 'Field Code', 'Source'],
  ['Line 20 amount (page 2)', 'line20_amount_from_schedule3_line8', 'C:\\us-tax\\pdfs\\f1040_field_mapping_semantic.csv'],
  ['Schedule 3 line 7 (PDF f1_24[0])', 'totalOtherNonrefundableCredits', '★ G6 FIX 2026-04-18 — now shows correct sum(6a..6z), not just 6z'],
  ['Schedule 3 line 8 (PDF f1_08[0])', 'totalNonrefundableCredits', 'IRS Schedule 3 line 8 formula'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 60 }, { wch: 80 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 20'],
  ['Line 20 (and the line 20-24 chain) emit NO blocking flags directly. Each upstream `applyXxxToSchedule3()` method may emit its own flags. Line 20 silently passes through whatever Schedule 3 line 8 already contains.'],
  [],
  ['Flag code', 'Severity', 'Condition', 'Where emitted'],
  ['(None at line 20 site)', 'N/A', 'Line 20 has no validation. Each upstream credit form has its own flags emitted at its respective compute method.', '—'],
  [],
  ['SPEC §7 STRUCTURAL INVARIANTS (not runtime-validated)'],
  ['Invariant', 'How enforced / Status'],
  ['line 7 = sum(line 6a through line 6z)', '★ G6 FIX 2026-04-18 — STRUCTURALLY enforced by sumAmounts at lines 18807-18821 (13 fields, 6e omitted as reserved). Lock-in test `schedule3Line7TotalOtherNonrefundableCreditsIsSum6aThroughZ`.'],
  ['line 8 = line 1 + 2 + 3 + 4 + 5a + 5b + 7', 'STRUCTURALLY enforced by sumAmounts at lines 18824-18832. IRS formula — lines 6a-6m + 6z appear via line 7 subtotal, NOT individually in line 8.'],
  ['Form1040.line20 = Schedule3.line8', 'STRUCTURALLY enforced by line 19362-19366 single-line read.'],
  ['line 6e remains zero (reserved)', 'STRUCTURALLY enforced — `finalizeSchedule3Totals` does NOT include 6e in the sum (omitted from sumAmounts at lines 18807-18821).'],
  ['line 20 ≥ 0', 'STRUCTURALLY enforced — null-when-zero convention; only set when totalNonrefundableCredits > 0.'],
  ['line 22 ≥ 0', 'STRUCTURALLY enforced by max(0, line18 − line21) at line 19377.'],
  ['line 24 ≥ 0', 'STRUCTURALLY enforced by null-when-zero set at line 19383 (compareTo(0) > 0 ? line24 : ZERO).'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 14 }, { wch: 100 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 20 is the nonrefundable-credit pass-through (Form 1040 line 20 = Schedule 3 line 8). 7th audit OUTSIDE 13ab pair; SECOND credits-section audit (after line 19). ★ SIMPLEST credits-section line — pure pass-through. 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-14 — CROSS-REFERENCE — NO MFS DEFENSIVE GAP NEEDED at computeLine20ThroughLine24 site (12th defensive-gap-NOT-needed Issue #1 in workflow; SECOND orchestrator-method-based audit with transitive inheritance after 18 #1)',
    '**Closure applied**: pure xlsx-flip cross-reference — no code change; no breadcrumb (existing inline comments at lines 19360 + 19370 + 19376 + 19381 sufficient; 20 #5/#6 breadcrumbs planned will add the VERIFIED CORRECT anchoring). **Per-input MFS-leakage analysis**: `computeLine20ThroughLine24` at TaxReturnComputeService.java:19354 takes EXACTLY TWO PARAMETERS (`form1040`, `schedule3`) — neither is a per-spouse input. Inside the method body, it reads FOUR fields: (a) `schedule3.nonrefundableCredits.totalNonrefundableCredits` (= Schedule 3 line 8; aggregates 17 individual credit fields, each MFS-clean from their respective apply methods); (b) `taxAndCredits.childTaxCredit` (line 19; inherits 19 #1 fix transitively — form2555Spouse null-shadowed at computeSchedule8812 call site); (c) `taxAndCredits.totalTaxBeforeCredits` (line 18; inherits 18 #5 + 18 #6 fixes transitively); (d) `taxAndCredits.otherTaxes` (Schedule 2 line 23; return-level aggregate). **All upstream-set fields are already MFS-clean** by the time computeLine20ThroughLine24 reads them; the arithmetic of three pass-through additions and one max-with-floor cannot introduce new MFS leakage. **MFS-guard cascade UNCHANGED at 20 orchestrators** (per 19 #1 NEW MAX): 1c-1i (7) + 7 income-territory orchestrators + buildStandardDeductionIndicators + computeLine13a + computeSchedule1A + computeLine16 + computeLine17 + computeSchedule8812. **★ Notable**: 20 #1 is the SECOND orchestrator-method-based audit in the credits-territory chain (after 19 #1) — but where 19 #1 ADDED to cascade (computeSchedule8812 has form2555Spouse parameter with TWO internal leaks), 20 #1 does NOT add to cascade (computeLine20ThroughLine24 has no per-spouse parameter; pure transitive inheritance). The pattern rule established at 18 #1 (orchestrator without per-spouse parameters → transitive inheritance suffices) is now confirmed across both tax-territory (line 18) and credits-territory (line 20) chains. **12th defensive-gap-NOT-needed Issue #1 in workflow** (after 11 prior: 9 + 11a/b + 12b/c/d/e + 14 + 15 + 18 — line 18 is the only prior orchestrator-method-based case; lines 9-15 are inline-computed). Backend tests: **765/765 unchanged** (no code change).',
    'TaxReturnComputeService.java:19354-19387 (computeLine20ThroughLine24 method body — no per-spouse params); 18800-18855 (finalizeSchedule3Totals — return-level aggregation); 1618 (call site)',
    'CLOSED — defensive-gap-NOT-needed. **12th in workflow** (second orchestrator-method-based with transitive inheritance after 18 #1). MFS-guard cascade UNCHANGED at 20 orchestrators. Pure cross-reference closure. 765/765 unchanged.'],

  [2, 'RESOLVED 2026-05-14 — DOCUMENTATION HYGIENE — Knowledge file Legacy A rename (knowledge_line20.md → line-20-amount-from-schedule3-line8.md; 13th Legacy A migration; convergence 25→26)',
    '**Closure applied**: (1) plain `mv` of `C:\\us-tax\\knowledge\\knowledge_line20.md` → `C:\\us-tax\\knowledge\\line-20-amount-from-schedule3-line8.md` (folder not under git). (2) Repo-wide grep for `knowledge_line20` produced 1 file hit / 10 line hits in `generate-20.js` only (classified per established 15 #2 / 16 #2 / 17 #2 / 18 #2 / 19 #2 precedent): ACTIVE-UPDATE = 7 hits in generate-20.js at lines 19 (header citation), 81 (Issue #4 audit angle in header comments), 386 (Issue #4 title), 387 (Issue #4 details), 388 (Issue #4 Where Found), 417 (Issue #10 Boundary Milestone details) — all updated to new path with rename annotation `(renamed from knowledge_line20.md via 20 #2 2026-05-14)`. LEAVE-UNTOUCHED = 3 hits in generate-20.js at lines 76 (Issue #2 audit angle in header comments), 376 (Issue #2 row title), 377 (Issue #2 row details — being rewritten by this closure) — Issue #2 rename-description rows; both old + new names intentionally appear as part of describing the rename. (3) **★ ZERO HITS IN history.md** — first Legacy A migration in workflow with no historical-entry references (line 20 audit not yet logged in history.md; will be logged after Issue #10 closure). (4) `lines/20.md` + `dependencies/20.md` scan: NO citation of knowledge file path → no update needed. (5) ZERO hits in TaxReturnComputeService.java. **13th Legacy A migration in workflow** (after 7a/8/9/10/11a/12a/13a/15/16/17/18/19 #2). **Knowledge-file naming convergence advances 25 → 26 lines** — steady cadence in double-digit territory; ~1-2 migrations from complete naming convergence (likely remaining: lines 26 + 27abc). Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\knowledge\\line-20-amount-from-schedule3-line8.md (renamed); C:\\us-tax\\XLS\\_tools\\generate-20.js 7 ACTIVE-UPDATE hits at lines 19/81/386/387/388/417 + 3 LEAVE-UNTOUCHED rename-description hits at lines 76/376/377; ZERO hits in history.md (first migration with no historical references)',
    'CLOSED — file renamed + 7 active citations updated in generate-20.js; 3 hits left untouched per precedent (rename-description rows). Pure documentation closure. 13th Legacy A migration. Convergence 25 → 26 lines. ★ First Legacy A migration with zero history.md hits (audit not yet logged).'],

  [3, 'RESOLVED 2026-05-14 — SPEC ENHANCEMENT — Verification log section §10 created in lines/20.md (single-row pattern; ★ 10th CONSECUTIVE single-row log in workflow)',
    '**Closure applied**: appended `## 10) Verification log` section to `lines/20.md` after section §9 (Scope Notes; line 333). 5-column markdown table; **row 1 in IN-PROGRESS state** capturing #1 (12th defensive-gap-NOT-needed; SECOND orchestrator-method-based with transitive inheritance after 18 #1) + #2 (Legacy A rename — 13th migration; 25 → 26 convergence; ★ FIRST migration with zero history.md hits) + #3 (this section creation). Row 1 will be finalized to **"COMPLETE — 10/10 closed"** at Issue #10 (boundary milestone) with all 10 closures enumerated. **Single-row pattern** = SMALLEST log shape; **★ 10th CONSECUTIVE single-row log in workflow** (matches lines 8, 9, 10, 14, 15, 16, 17, 18, 19, 20). Append-then-finalize pattern (used at 14 #3, 15 #3, 16 #3, 17 #3, 18 #3, 19 #3) lets the row evolve as the walkthrough progresses; final state captured atomically at Issue #10. Pure spec enhancement — no functional change. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\lines\\20.md section §10 appended after §9 (Scope Notes; line 333)',
    'CLOSED — §10 Verification log section created with single-row IN-PROGRESS table. Single-line audit shape (smallest log; ★ 10th consecutive single-row log in workflow).'],

  [4, 'RESOLVED 2026-05-14 — ★ DOCUMENTATION DRIFT FIX — lines/20.md §6 "Known Implementation Bug" + §6 status table + knowledge §5 PDF table — TRIPLE-location drift with 2 internal contradictions; G6 was FIXED 2026-04-18; ★ MOST EXTENSIVE drift fix in workflow',
    '**Closure applied**: THREE file edits — pure documentation; no code change. **The drift**: G6 fix locked in 2026-04-18 at TaxReturnComputeService.java:18807-18821 (sumAmounts of 13 fields). G6 fix correctly updated: code body + code comment line 18806 + dependencies/20.md G6 row + dependencies/20.md PDF table row 99 + knowledge §2 line 23 + §3 row 66 + §4 line 95 + knowledge §10 G6 row + lock-in test `schedule3Line7TotalOtherNonrefundableCreditsIsSum6aThroughZ`. But drift was introduced at THREE locations that didn\'t get refreshed: **(1) `lines/20.md` §6 lines 225-241** entire "Known Implementation Bug — Line 7 `totalOtherNonrefundableCredits`" subsection still described G6 as open bug. **(2) `lines/20.md` §6 row 267** "Implementation Status (as of 2026-04-18)" table still said `**Bug** — shows only 6z, not sum(6a–6z)` for line 7 (★ INTERNAL CONTRADICTION — table header said "as of 2026-04-18" but row content reflected pre-2026-04-18 state). **(3) `knowledge/line-20-amount-from-schedule3-line8.md` §5 line 185** PDF mapping table said `**7** (⚠ shows 6z only, not sum)` (★ INTERNAL CONTRADICTION — same file §2/§3/§4/§10 all correctly said G6 fixed; only §5 line 185 stale). **★ TWO INTERNAL CONTRADICTIONS** within the documentation. **Edits**: (a) `lines/20.md` §6 lines 225-241 — rewrote subsection from "Known Implementation Bug" to "Line 7 ... G6 RESOLVED 2026-04-18 (doc-drift fix 20 #4 2026-05-14)" with code reference + lock-in test citation + IRS formula clarification; (b) `lines/20.md` §6 row 267 — updated status from `**Bug** — shows only 6z, not sum(6a–6z)` to `**Fixed 2026-04-18 (G6)** — sum(6a..6z) per IRS formula; lock-in test ... ; doc-drift fix 20 #4 2026-05-14`; (c) `knowledge/line-20-amount-from-schedule3-line8.md` §5 line 185 — updated annotation from `(⚠ shows 6z only, not sum)` to `(sum 6a..6z per IRS formula; G6 fix locked in 2026-04-18; doc-drift fix 20 #4 2026-05-14)`. Pure documentation closure — no functional change; spec/knowledge now align with code reality + both internal contradictions resolved. **★ MOST EXTENSIVE drift fix in workflow** — 3 locations + 2 internal contradictions (prior max: 18 #4 = 2 locations / 0 contradictions; 19 #4 = 1 location / 1 contradiction). **8th documentation drift fix in workflow** (after 7 prior — 19 #4 was the 7th). **Why this matters**: a future maintainer reading lines/20.md §6 first would see "Known Implementation Bug — Line 7" prominently and might try to "fix" the code (reverting G6); the knowledge file contradicts itself; multiple locations create false signal amplification; lock-in test would break if code reverted but maintainer might not understand why. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\lines\\20.md §6 lines 225-241 (Known Implementation Bug subsection — rewritten to RESOLVED); §6 row 267 (status table — updated to Fixed 2026-04-18 G6); C:\\us-tax\\knowledge\\line-20-amount-from-schedule3-line8.md §5 line 185 (PDF mapping annotation — updated post-G6-fix)',
    'CLOSED — 3 file edits applied. lines/20.md §6 (subsection + status table row 267) + knowledge §5 line 185 now correctly cite G6 fix 2026-04-18. **★ MOST EXTENSIVE drift fix in workflow** — 3 locations + 2 internal contradictions. **8th documentation drift fix in workflow**. Pure documentation closure.'],

  [5, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — finalizeSchedule3Totals (Schedule 3 lines 7 + 8 + Part II lines 14 + 15) — 4 sub-verifications + ★ G6 fix lock-in anchor',
    '**Closure applied**: ~75-line VERIFIED CORRECT breadcrumb planted above `finalizeSchedule3Totals` method at TaxReturnComputeService.java:~18800 (between Issue #4 doc-drift fix references and method declaration). Structure — 4 sub-verifications + compute-order section: (1) **★ Schedule 3 line 7 = sum of 13 fields 6a-6z (6e RESERVED omitted)** per spec §7. ★ G6 FIX 2026-04-18 — CRITICAL fix; pre-G6 line 7 = 6z only (PDF display bug); post-G6 = sumAmounts(13 fields). Lock-in test `schedule3Line7TotalOtherNonrefundableCreditsIsSum6aThroughZ` confirms NO DOUBLE-COUNT in line 8. ★ Line 6e RESERVED — correctly omitted (never instantiated). ★ 20 #4 doc-drift fix (2026-05-14) just resolved 3 STALE references; spec/knowledge now align with code. (2) **★ Schedule 3 line 8 = line 1 + 2 + 3 + 4 + 5a + 5b + 7 (★ FORM 1040 LINE 20 SOURCE)** per spec §7. 7-operand sumAmounts at lines 18824-18832. ★ IRS formula guardrail (code comment at line 18823 "do not also list 6a–6m individually") — without this, maintainer might "fix" line 8 to ALSO sum 6a-6m → DOUBLE-COUNT (line 7 already sums those). Wiring to Form 1040 line 20 via computeLine20ThroughLine24 ~line 19362. (3) **Schedule 3 line 14 = sum of 5 fields 13a-13z (Part II subtotal; cross-ref for line 31)** per spec §2 + §7. 5-operand sumAmounts: form2439 (13a) + section1341Credit (13b) + netElectivePaymentElectionAmount (13c OOS) + deferredNet965TaxLiability (13d G5 fix) + otherRefundableCredits (13z). Cross-reference for line 31 audit (future). (4) **Schedule 3 line 15 = line 9 + 10 + 11 + 12 + 14 (★ FORM 1040 LINE 31 SOURCE)** per spec §2 + §7. 5-operand sumAmounts at lines 18846-18853: netPremiumTaxCredit (9) + amountPaidWithExtension (10) + excessSocialSecurityRrtaTaxWithheld (11) + creditForFederalTaxOnFuels (12 G3 fix) + line14 (subtotal). Wiring to Form 1040 line 31 via computeLine31ThroughLine38. **★ Compute order section**: must run AFTER all 17 applyXxxToSchedule3() methods + computeSchedule8812 + BEFORE computeLine20ThroughLine24 + computeLine31ThroughLine38. **Coverage cross-references**: spec §2 + §7 + dependencies §1 + §2 + §6 + §7 + line-20-amount-from-schedule3-line8.md §2 (post 20 #2 rename; post 20 #4 doc-drift fix at §5 line 185) + 20 #1 MFS cross-ref + 20 #4 doc-drift fix anchor + lock-in test reference. Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:~18800 (above finalizeSchedule3Totals method declaration; ~75-line breadcrumb covering 4 sub-verifications + compute order)',
    'CLOSED — verified correct. ~75-line breadcrumb documents Schedule 3 lines 7 + 8 + 14 + 15 + ★ G6 fix lock-in anchor (preempts revert trap; cites lock-in test) + ★ Line 6e RESERVED clarification + ★ IRS formula double-count guardrail + ★ 20 #4 doc-drift fix reference + compute-order constraints. **★ Load-bearing method** — single source of truth for ALL Schedule 3 subtotals.'],

  [6, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — computeLine20ThroughLine24 (Form 1040 lines 20, 21, 22, 24) — 4 sub-verifications + ★★ TOTAL TAX anchor + 3 distinct null-handling conventions documented',
    '**Closure applied**: ~60-line VERIFIED CORRECT breadcrumb planted above `computeLine20ThroughLine24` JavaDoc at TaxReturnComputeService.java:~19420 (between section banner `// Lines 20-24: Credit/Tax aggregation` and JavaDoc; both navigation landmarks preserved per established 16 #4 / 17 #5 / 18 #5 / 19 #5 / 20 #5 precedent). Structure — 4 sub-verifications + compute-order + logging sections: (1) **★ Line 20 = Schedule 3 line 8** (pure pass-through; null-when-zero) — code at ~line 19443-19449: `line20 = (line8 > 0) ? line8 : null`; tac.setOtherCreditsSchedule3(line20). ★ Inherits G6 fix transitively (line 8 includes line 7 subtotal G6-fixed 2026-04-18 per 20 #5 + 20 #4). (2) **★ Line 21 = line 19 + line 20** (★ Inherits 19 #1 MFS guard transitively — childTaxCredit is MFS-clean) — code at ~line 19452-19454: line19 = safeAmount(childTaxCredit); line21 = roundMoney(line19.add(safeAmount(line20))); set (line21 > 0) ? line21 : null. safeAmount + null-when-zero conventions. (3) **★ Line 22 = max(0, line 18 − line 21)** — tax after nonrefundable credits — code at ~line 19457-19459: ★ Floor at 0 (max(ZERO)) enforced STRUCTURALLY per IRS instructions; credits cannot reduce tax below zero. ★ NOT null-when-zero — always set (may be exactly 0 when credits >= tax-before-credits). ★ Inherits 18 #5 + 18 #6 MFS protection — totalTaxBeforeCredits set by computeLine18 with transitive MFS protection via 17 #1 + 16 #1. (4) **★★ Line 24 = line 22 + line 23 — ★★ TOTAL TAX (FINAL)** — code at ~line 19462-19464: line23 = safeAmount(otherTaxes; = Schedule 2 line 21); line24 = roundMoney(line22 + line23); tac.setTotalTax((line24 > 0) ? line24 : ZERO). **★★ THIS IS THE RETURN\'S FINAL TOTAL TAX FIELD** — most important output on Form 1040; PDF cell should never be blank. ★ Special ZERO-when-zero (NOT null) — different from lines 20 + 21 which use null-when-zero (3 distinct null-handling conventions across method: null-when-zero / always-set / ZERO-when-zero). **★ Compute order section**: must run AFTER computeLine18 + computeSchedule8812 + finalizeSchedule2OtherTaxes + finalizeSchedule3Totals; BEFORE computeLine31ThroughLine38. **★ Logging section**: INFO-level log captures all 5 line values for production debugging. **Coverage cross-references**: spec §1 + §2 + §4 + dependencies/20.md §3 + §6 + line-20-amount-from-schedule3-line8.md §4 (post 20 #2 rename) + 20 #1 MFS cross-ref (12th defensive-gap-NOT-needed) + 20 #5 finalizeSchedule3Totals breadcrumb (must run BEFORE) + 18 #5 + 18 #6 + 19 #1 (inheritance chain). Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:~19420 (between section banner and JavaDoc; ~60-line breadcrumb covering 4 sub-verifications + compute order + logging + ★★ TOTAL TAX anchor)',
    'CLOSED — verified correct. ~60-line breadcrumb documents Form 1040 lines 20 + 21 + 22 + ★★ 24 TOTAL TAX FINAL + ★ 3 distinct null-handling conventions + ★ floor at 0 at line 22 + ★ inheritance chain (G6 transitive + 19 #1 MFS + 18 #5 + 18 #6) + compute order + INFO logging. **★ Load-bearing method** — produces the return\'s FINAL TOTAL TAX field.'],

  [7, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — 17-credit Schedule 3 Part I + Part II input chain (compute order across 18 applyXxxToSchedule3 methods)',
    '**Closure applied**: ~70-line VERIFIED CORRECT breadcrumb planted above the prepare() Schedule 3 wiring chain at TaxReturnComputeService.java:~1282 (above the `// Form 1116 (Foreign Tax Credit)` comment that precedes `applyForeignTaxCreditToSchedule3` at line 1286). Structure — single sub-verification covering 18 apply method calls + 3 critical order constraints + multi-line method note: **★ 17-METHOD INPUT CHAIN** documented in compute order: #1 applyForeignTaxCreditToSchedule3 (line 1 FTC) + #2 finalizeForm2441PartII (line 2 childcare) + #3 applyForm8880ToSchedule3 (line 4 saver\'s) + #4 applyPremiumTaxCreditToSchedule3 (line 9 PTC) + ★ #5 applyForm8863ToSchedule3 (line 3 education; G1 fix 2026-04-18 — must run BEFORE computeSchedule8812 for CLW-A wA_4 read; lock-in test `schedule8812_worksheetA_subtractsEducationCredits_clwaFix`) + #6 applyForm5695ToSchedule3 (lines 5a + 5b energy; 2 credits/form) + #7 applyForm8801ToSchedule3 (line 6b prior AMT) + ★ #8 applyAdoptionCredit (line 6c adoption; G1 fix 2026-04-18 — CLW-B implemented; moved AFTER #7) + #9 applyScheduleRToSchedule3 (line 6d elderly/disabled) + #10 applyForm8936ScheduleAToSchedule3 (lines 6f + 6m clean vehicle; 2 credits/form) + #11 applyForm8396ToSchedule3 (line 6g mortgage interest) + #12 applyForm8859ToSchedule3 (line 6h DC homebuyer) + #13 applyForm8834ToSchedule3 (line 6i qualified EV) + #14 applyForm8911ToSchedule3 (line 6j alt fuel refueling) + #15 applyForm8912ToSchedule3 (line 6k tax credit bonds) + #16 applyForm4868ToSchedule3 (line 10 extension) + #17 computeExcessSocialSecurityTax (line 11 excess SS) + #18 applyForm2439CreditToSchedule3 (line 13a) + ★ #19 applyOtherPaymentsFormToSchedule3 (★ MULTI-LINE METHOD — 5 fields: lines 6z + 12 + 13b + 13d + 13z; G3 + G5 fixes 2026-04-18). **★ 3 CRITICAL ORDER CONSTRAINTS**: (a) #5 applyForm8863ToSchedule3 BEFORE computeSchedule8812 (G1 fix; CLW-A wA_4 read); (b) #8 applyAdoptionCredit AFTER #7 applyForm8801ToSchedule3 (G1 fix; CLW-B sees prior credits); (c) ALL #1-#19 BEFORE finalizeSchedule3Totals (line 7/8/14/15 subtotals require populated individual fields). **★ Chain map**: 18 method calls cover all 17 Schedule 3 credit/payment lines (line 6e RESERVED; line 6a OOS Form 3800; line 13c OOS Form 3800; line 6l G2 BLOCKED on Form 8978 impl). **★ Where downstream methods run**: ~line 1612 finalizeSchedule3Totals (per 20 #5 breadcrumb) + ~line 1618 computeLine20ThroughLine24 (per 20 #6 breadcrumb). **Coverage cross-references**: dependencies/20.md §1 (Part I inputs) + §2 (Part II inputs) + §6 (compute order) + §7 (G1/G3/G5 fix rows) + line-20-amount-from-schedule3-line8.md §4 (apply method call order) + 19 #1 G1 fix (Form 8863 before Schedule 8812) + 20 #5 + 20 #6 (downstream methods). Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:~1282 (above prepare() Schedule 3 wiring chain start; ~70-line breadcrumb covering 18 apply method calls + 3 critical order constraints + multi-line method note)',
    'CLOSED — verified correct. ~70-line breadcrumb documents 18-method input chain in compute order + ★ 3 critical-order constraints (Form 8863 before Schedule 8812 G1 fix + adoption credit after #7 G1 fix + all apply methods before finalizeSchedule3Totals) + ★ G3 + G5 manual-entry fixes 2026-04-18 + chain map (17 lines + 4 OOS/blocked).'],

  [8, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — 4 downstream consumers reading otherCreditsSchedule3 + Schedule 3 credit fields; read-order verified; 8th anti-duplication application',
    '**Closure applied**: pure cross-reference closure — no new breadcrumb at any consumer site (anti-duplication policy; **8th application in workflow** after 12e #8 + 12e #9 + 13a #9 + 13b #9 + 14 #5 + 15 #7 + 18 #7). Verification of all 4 downstream consumers per dependencies/20.md §3 + §4: **(1) Line 21 (total nonrefundable credits)** at computeLine20ThroughLine24 line 19452-19454 — `line 21 = safeAmount(childTaxCredit) + safeAmount(otherCreditsSchedule3)`; null-when-zero. ★ Covered by 20 #6 sub-verification 2. **(2) Line 22 (tax after credits)** at computeLine20ThroughLine24 line 19457-19459 — `line 22 = max(0, line 18 − line 21)`; floor at 0 enforced. ★ Covered by 20 #6 sub-verification 3. **(3) ★★ Line 24 (★★ TOTAL TAX FINAL)** at computeLine20ThroughLine24 line 19462-19464 — `line 24 = line 22 + line 23` (where line 23 = Schedule 2 line 21); ZERO-when-zero. ★ Return\'s most important output; covered by 20 #6 sub-verification 4. **(4) ★ Schedule 8812 CLW-A** at computeSchedule8812 — reads INDIVIDUAL Schedule 3 credit fields (NOT line 7 subtotal): wA_2 = nc.foreignTaxCredit + wA_3 = nc.childDependentCareCredit + wA_4 = nc.educationCredits (★ G1 fix 2026-04-18: Form 8863 must run BEFORE Schedule 8812 per 19 #1 + 20 #7) + wA_5 = nc.retirementSavingsContributionsCredit + wA_6 = nc.elderlyDisabledCredit + wA_7 = nc.amountFromForm8978Line14 (G2 BLOCKED). ★ G6 fix (line 7 subtotal) does NOT affect CLW-A (which reads individual fields, not the subtotal). Covered by 19 #5 + 19 #6 breadcrumbs. **★ Read-order verified**: Schedule 8812 CLW-A reads BEFORE finalizeSchedule3Totals (correct — reads individual fields; no aggregation needed); Lines 21/22/24 read AFTER finalizeSchedule3Totals (correct — read line 8 subtotal); compute order verified at prepare() ~line 1130 (computeSchedule8812) + ~line 1612 (finalizeSchedule3Totals) + ~line 1618 (computeLine20ThroughLine24). **★ Why no new breadcrumb**: anti-duplication policy applied — 3-source coverage already exists for each consumer (spec §2 + dependencies §3/§4 + parent-line breadcrumb at 20 #5/20 #6/19 #5/19 #6); adding 4th breadcrumb at consumer sites would be massive duplication of same fact. **8th ANTI-DUPLICATION APPLICATION** in workflow. **Coverage cross-references**: spec §2 + dependencies/20.md §3 (Outputs) + §4 (CLW-A consumers) + 20 #5 finalizeSchedule3Totals (line 8 source) + 20 #6 computeLine20ThroughLine24 (consumers #1-#3) + 20 #7 17-credit input chain (compute order) + 19 #5 + 19 #6 Schedule 8812 CLW-A breadcrumbs. Pure cross-reference closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:~19420 (covered by 20 #6 breadcrumb at computeLine20ThroughLine24) + ~22461 (covered by 19 #5 Schedule 8812 CLW-A breadcrumb); 4 consumer methods listed inline in this row',
    'CLOSED — 4-consumer cross-reference verified via dependencies §3/§4 + 20 #5/#6/#7 + 19 #5/#6 breadcrumbs. ★ Read-order: Schedule 8812 CLW-A reads BEFORE finalizeSchedule3Totals (correct — individual fields); lines 21/22/24 read AFTER (correct — line 8 subtotal). 8th anti-duplication application in workflow. No breadcrumb at consumer sites.'],

  [9, 'RESOLVED 2026-05-14 — ⚠️ BUNDLED OBSERVATIONS — 3 deferred-scope observations (17th Path A application; ★ 21 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS; ★ 4th consecutive audit with ZERO NEW GAPS)',
    '**Closure applied**: pure xlsx-flip observation bundle — **NO code change**; **NO outstanding.md entry** (anti-fragmentation policy). THREE observations bundled — all share same "documented + deferred / blocked / cosmetic; not blocking real returns in current scope" rationale. **(a) G2 Form 8978 negative line 14 → Schedule 3 line 6l BLOCKED** — `Schedule3NonrefundableCredits.amountFromForm8978Line14` field exists in model + sum logic at line 18818 includes it in line 7 computation + Schedule 8812 CLW-A consumer (wA_7) reads it; but field never populated — no `applyForm8978ToSchedule3()` method exists. Requires Form 8978 BBA partnership adjustment implementation (Form 8978 line 14 can be NEGATIVE per IRC §6226; negative amounts → Schedule 3 line 6l nonrefundable credit; positive amounts → Form 1040 line 16 box 3 per 16 #8 audit). Code at line 18818 correctly includes the field in the sum — Form 8978 implementation will automatically populate it; sumAmounts treats null as zero so no impact currently. **Recommended action**: implement Form 8978 (separate audit cycle). G2 OPEN — BLOCKED per dependencies/20.md gaps table + outstanding.md. **(b) Missing `diagrams/20.drawio`** — `flowcharts/20.drawio` exists but `diagrams/20.drawio` does NOT. Per repo convention each line should have BOTH a flowchart (routing logic) AND a data-flow diagram (input-to-output traceability). Flowchart already documents routing; missing data-flow diagram would provide visual complement of the 17-credit aggregation pipeline (17 source forms → 17 Schedule 3 credit fields → finalizeSchedule3Totals → Schedule 3 lines 7/8/14/15 → Form 1040 line 20 → lines 21/22/24). The 20 #5 + 20 #6 + 20 #7 breadcrumbs already provide the textual equivalent of the data-flow trace. **Recommended action**: create `diagrams/20.drawio`. Cosmetic gap; deferred. **(c) G7 partial E2E coverage** — only 5 E2E scenarios in `line20-nonrefundable-credits.spec.ts`: AOTC → line 3; excess SS (2 employers) → line 11; W-2 + 1099-INT withholding; fuel tax credit manual entry → line 12 (G3); §965(i) deferred → line 13d (G5). NO multi-credit Schedule 3 integration test exercising all 17 credit fields populated simultaneously. Individual credit specs exist (e.g., line8396-mortgage-interest-credit.spec.ts) but no aggregate test confirming line 7 + line 8 + line 20 work correctly under combined scenarios. G6 fix at line 7 has its own unit test (`schedule3Line7TotalOtherNonrefundableCreditsIsSum6aThroughZ`). **Recommended action**: add `line20-multi-credit-integration.spec.ts` with ~4-5 credits populated simultaneously. G7 PARTIAL per dependencies/20.md gaps table + outstanding.md. **★ Anti-fragmentation policy applied** — observations only; no fixes today; no outstanding.md entry. **17th PATH A APPLICATION** (after 16 prior in workflow). **★ Streak extends 20 → 21 consecutive zero-outstanding walkthroughs** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18/19/20). **★ ZERO NEW GAPS surfaced** — FOURTH consecutive audit (17 was the anomaly with 4 NEW gaps; 18 + 19 + 20 all zero); line 20 had 7 prior gaps G1-G7 from 2026-04-18 audit (4 fixed + 1 BLOCKED + 1 OOS + 1 partial); audit found only deferred-scope confirmations. Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:18818 (amountFromForm8978Line14 reference at line 7 sum site — G2 BLOCKED); diagrams/20.drawio (missing — cosmetic); line20-nonrefundable-credits.spec.ts (5 scenarios; no multi-credit integration test — G7 PARTIAL)',
    'CLOSED — pure observation bundle. **17th Path A application**; ZERO NEW GAPS surfaced (4th consecutive); **★ 21 consecutive zero-outstanding walkthroughs** (extends streak by 1 from 20). 3 observations: G2 Form 8978 BLOCKED + missing diagrams/20.drawio cosmetic + G7 partial E2E coverage. No outstanding.md entry per anti-fragmentation policy.'],

  [10, 'RESOLVED 2026-05-14 — BOUNDARY MILESTONE — Line 20 walkthrough complete at 10/10; SECOND CREDITS-SECTION AUDIT; ★ SIMPLEST CREDITS-SECTION LINE (pure pass-through); ★ MOST EXTENSIVE DRIFT FIX IN WORKFLOW; ★ 21 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS; ★ 4th CONSECUTIVE AUDIT WITH ZERO NEW GAPS',
    'Pure xlsx-flip + Verification log finalization — **CLOSES the 20 walkthrough at 10/10**. TWO file touches: (a) this row flipped to RESOLVED; (b) lines/20.md §10 Verification log row finalized IN-PROGRESS → **COMPLETE — 10/10 closed**. **Eight themes**: (1) **Structural positioning** — 7th audit OUTSIDE 13ab pair; SECOND credits-section audit (after line 19); ★ SIMPLEST credits-section line — pure pass-through (Form1040.line20 = Schedule3.line8); no orchestrator complexity. (2) **★ MFS-guard cascade UNCHANGED at 20 orchestrators** — 12th defensive-gap-NOT-needed Issue #1 in workflow (computeLine20ThroughLine24 inline-computed; no per-spouse parameters; transitive inheritance from Schedule 3 fields). (3) **Knowledge convergence advances 25 → 26 lines** (Issue #2: 13th Legacy A migration). (4) **★ 8th DOCUMENTATION DRIFT FIX** (Issue #4) — lines/20.md §6 "Known Implementation Bug" + §6 status table + line-20-amount-from-schedule3-line8.md §5 PDF annotation (renamed from knowledge_line20.md via 20 #2) all STALE; G6 was FIXED 2026-04-18 per dependencies + code; spec/knowledge updated to match. **★ Most extensive drift fix in workflow** — TRIPLE-location drift (1 lines/ + 1 lines/ table + 1 knowledge/) with INTERNAL CONTRADICTION within knowledge file (§2/§3/§4 say fixed; §5 line 185 says still buggy). (5) **★ G6 fix LOCK-IN VERIFICATION** (Issues #5 + #8) — confirms line 7 = sum(6a..6z) via lock-in test schedule3Line7TotalOtherNonrefundableCreditsIsSum6aThroughZ; CLW-A inheritance verified (reads individual fields, not line 7). (6) **Anti-fragmentation continues — 17th Path A application** (Issue #9: 3-observation bundle: G2 Form 8978 blocked + missing diagrams/20.drawio + G7 partial E2E coverage). (7) **★ 0 NEW gaps surfaced** — fourth consecutive audit (18 + 19 + 20) with no new gaps; line 20 had 7 prior gaps G1-G7 from 2026-04-18 audit (4 fixed + 1 BLOCKED + 1 OOS + 1 partial). (8) **Cumulative state through line 20**: **46 lines audited** (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + 11b + 12a + 12b + 12c + 12d + 12e + 13a + 13b + 14 + 15 + 16 + 17 + 18 + 19 + **20**); **457 audit issues closed total** (447 + 10); backend **765/765 pass** (UNCHANGED — pure documentation closure; no new tests this audit); MFS cascade = **20 orchestrators** (unchanged — line 20 inline-computed; defensive-gap-NOT-needed); knowledge convergence = **26 lines (+1)**; dependencies files = 43 (unchanged); **★ 8 documentation drift fixes** across workflow (+1 from 20 #4); 17 Path A applications (+1 from 20 #9); 7 anti-duplication applications (unchanged); 2 SEEDED → VERIFIED CORRECT upgrades (unchanged); 2 terminal seeds at orchestrators (unchanged); 0 NEW gaps surfaced (4th consecutive). **★ 21 CONSECUTIVE WALKTHROUGHS WITH ZERO NEW OUTSTANDING.MD ENTRIES** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18/19/**20**). **Verification logs**: 2ab (4) + 3abc (3) + 4abc (3) + 5abc (3) + 6abcd (4) + 7ab (2) + 8 (1) + 9 (1) + 10 (1) + 11ab (2) + 12abcde (5 — LARGEST) + 13ab (2) + 14 (1) + 15 (1) + 16 (1) + 17 (1) + 18 (1) + 19 (1) + **20 (1 — single-line shape)**. **Looking ahead — line 21 (Total credits = line 19 + line 20)**: 8th audit OUTSIDE 13ab pair; THIRD credits-section audit. Line 21 is already computed in `computeLine20ThroughLine24` (combined method); inline-computed at single site. Likely defensive-gap-NOT-needed Issue #1. Pure addition pass-through (similar to line 18 = line 16 + line 17). **★ Notable: lines 20 + 21 + 22 + 24 all in the same method** — audit-wise, this might mean lines 21 + 22 close as smaller audits (already covered by 20 #6 breadcrumb).',
    'XLS/computations/20.xlsx audit-trail (this row); lines/20.md §10 Verification log row FINALIZED to COMPLETE — 10/10 closed; knowledge file renamed via 20 #2; documentation drift fixed via 20 #4 (3 locations)',
    'CLOSED — 10/10. **46 lines audited; 457 issues; 765/765 backend (UNCHANGED — no new tests this audit); 20 orchestrators (UNCHANGED); 26-line knowledge convergence; ★ 21 consecutive zero-outstanding walkthroughs; ★ 4th consecutive ZERO NEW GAPS; 8 documentation drift fixes (★ MOST EXTENSIVE — 3 locations + 2 internal contradictions); 17 Path A applications; ★ 8 anti-duplication applications; ★ 10th consecutive single-row log**. SECOND credits-section audit; SIMPLEST credits-section line (pure pass-through). Next: line 21 (total credits; likely 13th defensive-gap-NOT-needed; possible merge with line 22 since both in computeLine20ThroughLine24).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 120 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 20 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.taxAndCredits.otherCreditsSchedule3', 'Form 1040 page 2, line 20 (PDF key line20_amount_from_schedule3_line8)', 'XLS/output_forms/form-tax-return-1040.xlsx', '★ CANONICAL line 20 output. = Schedule 3 line 8 if > 0; else null. BigDecimal whole-dollar HALF_UP.'],
  ['form1040.taxAndCredits.totalCredits', 'Form 1040 page 2, line 21', 'XLS/output_forms/form-tax-return-1040.xlsx', '= line 19 (CTC + ODC) + line 20 (Schedule 3 line 8). Set in same method as line 20.'],
  ['form1040.taxAndCredits.taxAfterCredits', 'Form 1040 page 2, line 22', 'XLS/output_forms/form-tax-return-1040.xlsx', '= max(0, line 18 − line 21). Floor at 0.'],
  ['form1040.taxAndCredits.totalTax', 'Form 1040 page 2, line 24', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ TOTAL TAX FINAL = line 22 + line 23 (Schedule 2 line 21).'],
  [],
  ['Schedule 3 PDF Fields (Part I subset)'],
  ['schedule3.nonrefundableCredits.totalOtherNonrefundableCredits', 'Schedule 3 line 7 (PDF f1_24[0])', 'XLS/output_forms/form-tax-return-schedule3.xlsx', '★ G6 FIX 2026-04-18 — now shows correct sum(6a..6z). Was buggy pre-fix.'],
  ['schedule3.nonrefundableCredits.totalNonrefundableCredits', 'Schedule 3 line 8 (PDF f1_08[0])', 'XLS/output_forms/form-tax-return-schedule3.xlsx', '= line 1 + 2 + 3 + 4 + 5a + 5b + 7. IRS formula.'],
  ['(17 individual credit fields)', 'PDF f1_03 through f1_23', 'XLS/output_forms/form-tax-return-schedule3.xlsx', 'Each populated by its respective applyXxxToSchedule3 method.'],
  [],
  ['PRIMARY DOWNSTREAM (★★) — all computed in same method as line 20'],
  ['Form 1040 line 21 (total nonrefundable credits)', 'Form 1040 page 2, line 21', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ line21 = line19 + line20.'],
  ['Form 1040 line 22 (tax after credits)', 'Form 1040 page 2, line 22', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ line22 = max(0, line18 − line21). Indirect dependency on line 20 via line 21.'],
  ['Form 1040 line 24 (★★ TOTAL TAX — FINAL)', 'Form 1040 page 2, line 24', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ line24 = line22 + line23. The return\'s FINAL TOTAL TAX field. Line 20 affects line 24 via line 21 → line 22.'],
  ['Schedule 8812 CLW-A (line 13)', '—', 'XLS/output_forms/form-tax-return-schedule8812.xlsx', '★★ CLW-A reads INDIVIDUAL Schedule 3 credit fields (NOT line 7 subtotal); G6 fix at line 7 does not affect CLW-A.'],
  [],
  ['CONDITIONAL ATTACHMENTS'],
  ['Schedule 3', 'Schedule 3 pages 1 + 2', 'XLS/output_forms/form-tax-return-schedule3.xlsx', 'Attached when ANY Schedule 3 line is nonzero (sidebar conditional push).'],
  ['Each upstream credit form', 'Per form', '(various)', 'Form 1116 / Form 2441 / Form 8863 / etc. attached when their respective Schedule 3 lines are nonzero.'],
  [],
  ['NOT IN OUTPUT (deliberate exclusions per spec + scope)'],
  ['Schedule 3 line 6a (Form 3800 General Business Credit)', '—', '—', 'OUT OF SCOPE per CLAUDE.md (SE-related). generalBusinessCredit always null.'],
  ['Schedule 3 line 6l (Form 8978 negative)', '—', '—', '⚠️ G2 BLOCKED — requires Form 8978 BBA partnership adjustment implementation. amountFromForm8978Line14 always null.'],
  ['Schedule 3 line 13c (Form 3800 elective payment)', '—', '—', 'OUT OF SCOPE (Form 3800); no PDF field mapped. netElectivePaymentElectionAmount always null.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 55 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
