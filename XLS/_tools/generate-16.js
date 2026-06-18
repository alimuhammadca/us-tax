// ============================================================================
//  Generates: C:\us-tax\XLS\computations\16.xlsx
//
//  Source-of-truth references:
//    - lines/16.md (2025-tax-year IRS-verified developer-ready spec; sections 1-15;
//      439 lines; defines 6+1 tax computation methods + box 1/2/3 add-ons)
//    - dependencies/16.md (compute order; method-selection rules; PDF fields;
//      142 lines)
//    - knowledge/line-16-tax.md (renamed via 16 #2 2026-05-14 from
//      knowledge_line16.md; 9th Legacy A migration; ~308 lines covering decision
//      tree, helpers, output model, test inventory)
//    - TaxReturnComputeService.java:1709-1844 — `computeLine16` orchestrator:
//        Branch 1: ZERO (line15 ≤ 0)
//        Branch 2: FOREIGN_EARNED_INCOME (Form 2555 filer + line15 > 0)
//        Branch 3: FORM_8615 (kiddie tax — hasKiddieTaxUnearnedIncome=TRUE)
//        Branch 4: SCHEDULE_D_TAX_WORKSHEET (28% gain or §1250 gain)
//        Branch 5: QDCG (qualified dividends or capital gains present)
//        Branch 6: TAX_TABLE (line15 < $100k)
//        Branch 7: TAX_COMPUTATION_WORKSHEET (line15 ≥ $100k)
//        + 3 add-on tax paths: Box 1 (Form 8814) + Box 2 (Form 4972) + Box 3 (ECR)
//    - 4 helper methods at TaxReturnComputeService.java:
//        computeTaxBracket(line ~1923) — Tax Table + TCW; 5 bracket tables
//        computeQDCGWorksheet(line ~1580) — Qualified Dividends/Cap Gain
//        computeScheduleDTaxWorksheet(line ~1688) — 28% rate + §1250 gain
//        computeForeignEarnedIncomeTaxWorksheet(line ~1780) — Form 2555
//    - 2 predicate methods:
//        isScheduleDTaxWorksheetRequired (~line 1851)
//        isQDCGWorksheetRequired (~line 1876)
//    - Call site at prepare() ~line 1172 — where MFS guard goes (call-site
//      null-shadow for form2555Spouse + form4972Spouse on MFS)
//
//  Tax year: 2025
//
//  Concept:
//    Line 16 = tax_on_taxable_income + Form8814_box1 + Form4972_box2 + box3_writein
//    Where tax_on_taxable_income is computed via a 7-branch decision tree
//    with Form 2555 taking PRIORITY over all other methods (per spec §3 + §8).
//
//    7-branch decision tree (in order):
//      1. ZERO              — line15 ≤ 0 → tax = $0
//      2. FOREIGN_EARNED_INCOME — Form 2555 filed → FEITW.line6
//      3. FORM_8615         — kiddie tax → Form8615.line18
//      4. SCHEDULE_D_TAX_WORKSHEET — 28% gain or §1250 gain
//      5. QDCG              — qualified dividends or cap gains
//      6. TAX_TABLE         — line15 < $100k
//      7. TAX_COMPUTATION_WORKSHEET — line15 ≥ $100k
//
//    Box 1/2/3 add-ons (always added regardless of which tax method applies):
//      Box 1 — Form 8814 child tax (Σ over form8814List.line15ExtraTax)
//      Box 2 — Form 4972 lump-sum tax (taxpayer + spouse line30Total)
//      Box 3 — ECR (education credit recapture; from 16-tax-taxpayer form)
//
//    Critical zero rule (spec §2.3): line 16 can be POSITIVE even when line 15
//    is zero if any box 1/2/3 taxes apply.
//
//  Line 16 audit positioning (3rd audit OUTSIDE 13ab pair):
//   • Single-line audit at a SEPARATE ORCHESTRATOR — first such audit since
//     line 13b (computeSchedule1A) on 2026-05-13
//   • Cumulative position: 42nd line
//   • Returns workflow to orchestrator-based audits after 3 consecutive
//     inline-computed audits (14, 15, plus 13ab #3 finalization)
//   • Likely HIGH-PRIORITY MFS DEFENSIVE GAP (two leakage paths bundled)
//
//  Line 16 audit angles (10 issues):
//   1. ⚠️ HIGH-PRIORITY MFS DEFENSIVE GAP — computeLine16 call site at
//       prepare() ~line 1172 needs MFS guards for form2555Spouse + form4972Spouse
//       (TWO leakage paths bundled into one fix; FEITW branch wrongly fires
//       + Form 4972 spouse line30 leaks). Adds 18th orchestrator to MFS-guard
//       cascade — NEW CODEBASE MAXIMUM.
//   2. DOCUMENTATION HYGIENE — Knowledge file Legacy A rename
//       (knowledge_line16.md → line-16-tax.md); 9th Legacy A migration;
//       convergence 21 → 22.
//   3. SPEC ENHANCEMENT — Verification log section §16 in lines/16.md
//       (single-row).
//   4. CROSS-REFERENCE SEED — Forward seed above computeLine16 orchestrator
//       documenting 7-branch decision tree + 4 helper methods + 3 add-on
//       paths + future-line-17/18 hooks (no upgrade of 13a/b/14/15 seed per
//       15 #4 informational hook; different shape).
//   5. VERIFIED CORRECT — Branch 1 (ZERO) + Branch 2 (FOREIGN_EARNED_INCOME /
//       FEITW); FEITW formula + Form 2555 priority + zero-line15 special rule.
//   6. VERIFIED CORRECT — Branch 3 (FORM_8615 / kiddie tax);
//       childFinalTaxLine18 manual entry + fallback to bracket on null.
//   7. VERIFIED CORRECT — Branch 4 (SCHEDULE_D_TAX_WORKSHEET) + Branch 5
//       (QDCG Worksheet); predicate logic + 2025 thresholds.
//   8. VERIFIED CORRECT — Branch 6/7 (TAX_TABLE / TCW); 5 bracket tables
//       per filing status + $100k boundary + Box 1/2/3 add-on logic.
//   9. OBSERVATION — Schedule J path documented in spec §7 but treated as
//       out-of-scope by implementation (farming/fishing income out-of-scope
//       per CLAUDE.md). 13th Path A application.
//  10. BOUNDARY MILESTONE — first orchestrator audit since 13b; 18 orchestrators
//       (NEW CODEBASE MAX); 42 lines / 417 issues / backend 762 → 763 (+1 MFS
//       lock-in); 17 consecutive zero-outstanding walkthroughs.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '16.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 16 — TAX (FIRST ORCHESTRATOR AUDIT SINCE 13b; 6+1 TAX COMPUTATION METHODS)'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 16 (page 2; numeric amount + 3 checkboxes)'],
  ['Concept',
    'Tax on taxable income (line 15) plus add-on taxes from Form 8814 + Form 4972 + Box 3 ' +
    'write-ins. The tax-on-taxable-income portion uses a 7-branch decision tree with Form 2555 ' +
    'taking PRIORITY over all other methods. CRITICAL ZERO RULE: line 16 can be positive even ' +
    'when line 15 is zero if any box 1/2/3 taxes apply (spec §2.3).'],
  ['Formula (spec §2.1)',
    'line16 = tax_on_taxable_income + Form8814_box1_if_any + Form4972_box2_if_any + box3_writein_total_if_any'],
  ['7-branch decision tree (spec §3.1)',
    '1. ZERO                       — line15 ≤ 0 → tax = $0\n' +
    '2. FOREIGN_EARNED_INCOME      — Form 2555 filed + line15 > 0 → FEITW.line6\n' +
    '3. FORM_8615 (kiddie tax)     — hasKiddieTaxUnearnedIncome=TRUE → Form8615.line18\n' +
    '4. SCHEDULE_D_TAX_WORKSHEET   — Sched D line 18 or 19 > 0 + lines 15/16 positive\n' +
    '5. QDCG_WORKSHEET             — qualified dividends OR capital gains present\n' +
    '6. TAX_TABLE                  — line15 < $100,000\n' +
    '7. TAX_COMPUTATION_WORKSHEET  — line15 ≥ $100,000\n' +
    'Form 2555 (branch 2) has PRIORITY over branches 3-7 per spec §3.1 + §8.'],
  ['Box 1/2/3 add-on paths (spec §10)',
    'Box 1 — Form 8814 child interest/dividend tax (Σ over form8814List.line15ExtraTax)\n' +
    'Box 2 — Form 4972 lump-sum distribution tax (taxpayer + spouse line30Total)\n' +
    'Box 3 — ECR (education credit recapture) from 16-tax-taxpayer form.\n' +
    '⚠️ NOTE: spec §10.3 also lists §962, Form 8621 1291TAX, Form 8978, §965INC; backend\n' +
    'currently implements only ECR (per knowledge §3 "Step 4 — Box 3").'],
  ['Special methods supported',
    'Form 2555 / FEITW (priority); Form 8615 (kiddie tax); Schedule D Tax Worksheet;\n' +
    'QDCG Worksheet; Tax Table; Tax Computation Worksheet'],
  ['Special method NOT supported',
    'Schedule J (income averaging for farmers/fishermen) — per CLAUDE.md, Schedule C/F\n' +
    'and farming/fishing income are out of scope. Spec §7 documents this but implementation\n' +
    'omits the branch entirely. See 16 #9 observation.'],
  ['Output target',
    'form1040.taxAndCredits.tax (canonical; BigDecimal; whole-dollar HALF_UP)\n' +
    'Plus: regularTax, computationMethod, box1Form8814Tax + box1Checked,\n' +
    '      box2Form4972Tax + box2Checked, ecrBox3Tax + box3Checked + box3Code'],
  ['Backend implementation',
    '**SEPARATE ORCHESTRATOR** — `computeLine16` at TaxReturnComputeService.java:~1709-1844 ' +
    '(call site at prepare() ~line 1172). 4 helper methods (`computeTaxBracket` + ' +
    '`computeQDCGWorksheet` + `computeScheduleDTaxWorksheet` + `computeForeignEarnedIncomeTaxWorksheet`) ' +
    'plus 2 predicates (`isScheduleDTaxWorksheetRequired` + `isQDCGWorksheetRequired`). ' +
    'First orchestrator-based audit since 13b on 2026-05-13.'],
  ['IRS source',
    'IRS 2025 Form 1040 + 2025 Form 1040 instructions (i1040gi) + 2025 Schedule D instructions ' +
    '(i1040sd) + 2025 Form 8615 instructions + 2025 Tax Table / Tax Computation Worksheet ' +
    '(Pub. 1040) + spec lines/16.md.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Read line 15 (taxable income) from Deductions', 'Per 15 audit (closed 2026-05-14). Null → line 16 skipped (gate at line 1725).'],
  [2, 'Read filing status (normalized)', 'For bracket lookup + QDCG thresholds.'],
  [3, 'Determine tax-on-taxable-income via 7-branch decision tree', 'In order: ZERO → FOREIGN_EARNED_INCOME → FORM_8615 → SCHEDULE_D_TAX_WORKSHEET → QDCG → TAX_TABLE → TAX_COMPUTATION_WORKSHEET. Form 2555 takes priority over branches 3-7.'],
  [4, 'Compute Form 8814 box 1 add-on tax', 'Σ over form8814List.line15ExtraTax; sets box1Checked if > 0.'],
  [5, 'Compute Form 4972 box 2 add-on tax', 'taxpayer.line30Total + spouse.line30Total; sets box2Checked if > 0. ⚠️ MFS LEAK — see Issue #1.'],
  [6, 'Compute box 3 ECR add-on tax', 'From 16-tax-taxpayer form: hasEcrRecapture + ecrAmount; sets box3Checked + box3Code="ECR".'],
  [7, 'Sum line 16 = regularTax + box1 + box2 + box3', 'roundMoney HALF_UP. Critical: even if regularTax = 0 (line15 ≤ 0), line 16 may still be positive.'],
  [8, 'Persist on TaxAndCredits', 'tax + regularTax + computationMethod + box1/2/3 fields.'],
  [9, 'Flow downstream to line 17 (AMT) + line 18 (line16+line17) + Form 1116 limitation', 'Line 16 is one of the most critical downstream inputs in the entire return.'],
  [],
  ['INVARIANTS / VALIDATIONS (spec §12)'],
  ['Invariant', 'Rationale'],
  ['line16 ≥ 0', 'Each component non-negative; sum non-negative.'],
  ['line15 missing → line 16 skipped', 'Gate at line 1725 (`if (line15 == null) return`).'],
  ['Form 2555 priority overrides Tax Table / TCW / QDCG / SchedD / Form 8615', 'Per spec §12.2. Decision tree branch order enforces this.'],
  ['Form 8978 negative → Schedule 3 line 6l (not line 16)', 'Per spec §10.3 + §12.4. NOT currently implemented in computeLine16 (Box 3 only handles ECR).'],
  ['line16 may be > 0 when line15 ≤ 0', 'Per spec §2.3 + §12.5 nuance: box 1/2/3 taxes apply regardless of line 15.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 35 }, { wch: 70 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 16'],
  ['Line 16 takes 1 primary + 5 conditional form inputs + 6 add-on inputs. Method selection is driven by line 15 + Form 2555 + kiddie tax + Schedule D state + qualified dividends/cap gains.'],
  [],
  ['#', 'Source', 'Field', 'Type', 'Role', 'XLS input form reference'],
  [1, 'computed Deductions (line 15)', 'line15TaxableIncome', 'BigDecimal (nullable)', 'PRIMARY driver; controls method selection + bracket lookup. null → line 16 skipped.', '(internal — line 15 audit)'],
  [2, 'filing-status form', 'filingStatus', 'String', 'Required for bracket tables + QDCG thresholds.', 'XLS/input_forms/form-filing-status.xlsx'],
  [3, 'computed Income (line 3a)', 'qualifiedDividends', 'BigDecimal', 'Triggers QDCG branch when > 0.', '(internal — line 3a audit)'],
  [4, 'computed Income (line 7a)', 'capitalGainLoss', 'BigDecimal', 'QDCG fallback (no Schedule D required).', '(internal — line 7a audit)'],
  [5, 'computed Income (line 7b flag)', 'line7bScheduleDNotRequired', 'Boolean', 'QDCG branch routing.', '(internal — line 7ab audit)'],
  [6, 'computed Schedule D', 'line15NetLongTermCapitalGainOrLoss, line16NetCapitalGainOrLoss, line18TwentyEightPercentRateGain, line19UnrecapturedSection1250Gain', 'BigDecimal × 4', 'Schedule D Tax Worksheet trigger + QDCG predicate.', 'XLS/output_forms/form-tax-return-1040-schedule-d.xlsx'],
  [7, 'computed Form 2555 (taxpayer)', 'foreignEarnedIncomeExclusion (line 45), housingExclusionAmount (line 50)', 'BigDecimal × 2', '⚠️ MFS LEAK — Form 2555 spouse leaks into FEITW branch on MFS; see Issue #1.', 'XLS/input_forms/form-foreign-earned-income-taxpayer.xlsx'],
  [8, 'computed Form 2555 (spouse)', 'same fields', 'BigDecimal × 2', '⚠️ Same MFS leak — null-shadowed at call site post-fix.', 'XLS/input_forms/form-foreign-earned-income-spouse.xlsx'],
  [9, 'kiddie-income-taxpayer form', 'hasKiddieTaxUnearnedIncome, childFinalTaxLine18', 'Boolean + BigDecimal', 'Form 8615 branch. Manual entry of Form 8615 line 18 (no full Form 8615 implementation).', 'XLS/input_forms/form-kiddie-income-taxpayer.xlsx'],
  [10, '16-tax-taxpayer form', 'hasEcrRecapture, ecrAmount', 'Boolean + BigDecimal', 'Box 3 ECR (education credit recapture). Only Box 3 code currently implemented.', 'XLS/input_forms/form-tax-return-16-tax.xlsx'],
  [11, 'computed Form 8814 list (per child)', 'line15ExtraTax', 'BigDecimal', 'Box 1 add-on tax; summed across all children.', '(internal — Form 8814 per-child audits)'],
  [12, 'computed Form 4972 (taxpayer)', 'line30Total', 'BigDecimal', 'Box 2 add-on tax (lump-sum distribution).', '(internal — Form 4972 audit)'],
  [13, 'computed Form 4972 (spouse)', 'line30Total', 'BigDecimal', '⚠️ MFS LEAK — Form 4972 spouse line30Total leaks unconditionally on MFS; see Issue #1.', '(internal — Form 4972 audit)'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 35 }, { wch: 60 }, { wch: 22 }, { wch: 75 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 16'],
  ['Line 16 uses 2 major reference-data sets: (1) Tax Computation Worksheet brackets (5 per filing status × ~5 brackets each); (2) QDCG Worksheet thresholds (0%, 15%, 20%).'],
  [],
  ['Constant', 'Value (2025)', 'Statutory Basis', 'Backend identifier'],
  [],
  ['Tax bracket boundary (Tax Table ↔ TCW)'],
  ['Boundary', '$100,000', 'IRS 2025 Pub. 1040; spec §3.2 + §9.1 + §9.2', 'Inline literal at TaxReturnComputeService.java:1779'],
  [],
  ['2025 Tax Computation Worksheet brackets (per filing status; per spec §9.2)'],
  ['Single — 22% bracket', '$100k–$103,350: tax = line15 × 0.22 − $5,086', 'Rev. Proc. 2024-40', '`computeTaxBracket` ~line 1923'],
  ['Single — 24% bracket', '$103,350–$197,300: tax = line15 × 0.24 − $7,153', 'Rev. Proc. 2024-40', 'same'],
  ['Single — 32% bracket', '$197,300–$250,525: tax = line15 × 0.32 − $22,937', 'Rev. Proc. 2024-40', 'same'],
  ['Single — 35% bracket', '$250,525–$626,350: tax = line15 × 0.35 − $30,452.75', 'Rev. Proc. 2024-40', 'same'],
  ['Single — 37% bracket', '> $626,350: tax = line15 × 0.37 − $42,979.75', 'Rev. Proc. 2024-40', 'same'],
  ['MFJ/QSS — bracket span', '5 brackets ($100k → > $751,600)', 'Rev. Proc. 2024-40', '`computeTaxBracket`'],
  ['MFS — bracket span', '5 brackets ($100k → > $375,800)', 'Rev. Proc. 2024-40', '`computeTaxBracket`'],
  ['HOH — bracket span', '5 brackets ($100k → > $626,350)', 'Rev. Proc. 2024-40', '`computeTaxBracket`'],
  [],
  ['2025 QDCG Worksheet thresholds (per spec §6)'],
  ['0% threshold — Single', '$48,350', 'Rev. Proc. 2024-40; IRC §1(h)', '`computeQDCGWorksheet`'],
  ['0% threshold — MFJ/QSS', '$96,700', 'Rev. Proc. 2024-40; IRC §1(h)', 'same'],
  ['0% threshold — MFS', '$48,350', 'Rev. Proc. 2024-40; IRC §1(h)', 'same'],
  ['0% threshold — HOH', '$64,750', 'Rev. Proc. 2024-40; IRC §1(h)', 'same'],
  ['20% threshold — Single', '$533,400', 'Rev. Proc. 2024-40; IRC §1(h)', 'same'],
  ['20% threshold — MFJ/QSS', '$600,050', 'Rev. Proc. 2024-40; IRC §1(h)', 'same'],
  ['20% threshold — MFS', '$300,025', 'Rev. Proc. 2024-40; IRC §1(h)', 'same'],
  ['20% threshold — HOH', '$566,700', 'Rev. Proc. 2024-40; IRC §1(h)', 'same'],
  [],
  ['Kiddie tax threshold (Form 8615 branch trigger)'],
  ['Unearned income threshold', '$2,700', 'Rev. Proc. 2024-40; IRC §1(g)', 'User-attested via `hasKiddieTaxUnearnedIncome` flag'],
  [],
  ['Statutory anchors'],
  ['IRC §1 (regular tax rates)', '— (statute)', 'YES — primary statute for ordinary brackets', '—'],
  ['IRC §1(h) (capital gains rates)', '— (statute)', 'YES — QDCG + Schedule D Tax Worksheet', '—'],
  ['IRC §1(g) (kiddie tax)', '— (statute)', 'YES — Form 8615', '—'],
  ['IRC §911 (foreign earned income exclusion)', '— (statute)', 'YES — Form 2555 / FEITW priority', '—'],
  ['IRC §402(d) (lump-sum distributions)', '— (statute)', 'YES — Form 4972', '—'],
  ['Rev. Proc. 2024-40', 'IRS Rev. Proc.', 'YES — all 2025 thresholds + bracket amounts', '—'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 55 }, { wch: 55 }, { wch: 55 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 16 Persistence to TaxAndCredits'],
  ['Line 16 persists to a dedicated TaxAndCredits sub-object on form1040 (separate from Deductions which holds lines 12-15). 10 output fields total.'],
  [],
  ['Output target', 'Where wired', 'Effect', 'XLS output reference'],
  ['form1040.taxAndCredits.tax', '`taxAndCredits.setTax(line16Total)` at line 1834', '★ CANONICAL line 16 output. Whole-dollar HALF_UP. Sum of regularTax + box1 + box2 + box3.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 16 cell)'],
  ['form1040.taxAndCredits.regularTax', '`taxAndCredits.setRegularTax(regularTax)` at line 1835', 'Tax-on-taxable-income only (no add-ons). Used by Form 6251 line 8 + diagnostics.', 'XLS/output_forms/form-tax-return-6251.xlsx'],
  ['form1040.taxAndCredits.computationMethod', '`setComputationMethod(...)` at line 1836', 'Enum: ZERO / FOREIGN_EARNED_INCOME / FORM_8615 / SCHEDULE_D_TAX_WORKSHEET / QDCG / TAX_TABLE / TAX_COMPUTATION_WORKSHEET. Used by logging + E2E assertions.', '—'],
  ['form1040.taxAndCredits.box1Form8814Tax', 'line 1837', 'Form 8814 child tax amount (or null if 0).', 'XLS/output_forms/form-tax-return-1040.xlsx (line 16 box 1)'],
  ['form1040.taxAndCredits.box1Checked', 'line 1840', 'true when Form 8814 tax > 0 (PDF checkbox c2_9).', 'PDF c2_9 line16_check_form8814'],
  ['form1040.taxAndCredits.box2Form4972Tax', 'line 1838', 'Form 4972 lump-sum tax (or null if 0).', 'XLS/output_forms/form-tax-return-1040.xlsx (line 16 box 2)'],
  ['form1040.taxAndCredits.box2Checked', 'line 1841', 'true when Form 4972 tax > 0 (PDF checkbox c2_10).', 'PDF c2_10 line16_check_form4972'],
  ['form1040.taxAndCredits.ecrBox3Tax', 'line 1839', 'ECR amount (or null if 0).', 'XLS/output_forms/form-tax-return-1040.xlsx (line 16 box 3)'],
  ['form1040.taxAndCredits.box3Checked', 'line 1842', 'true when ECR > 0 (PDF checkbox c2_11).', 'PDF c2_11 line16_check_other_form'],
  ['form1040.taxAndCredits.box3Code', 'line 1843', 'String "ECR" when box3 fires (other codes 962/1291TAX/Form 8978/965INC NOT implemented).', 'PDF f2_07 line16_other_form_number'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 17 (AMT)', '—', '★★ AMT compared to regularTax (line 16); line 17 = max(0, AMT - regularTax).', 'XLS/output_forms/form-tax-return-6251.xlsx'],
  ['Form 1040 line 18 (line16 + line17)', '—', '★★ Composite tax before credits. Subsequent line audits will document.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 18)'],
  ['Form 1116 (Foreign Tax Credit) limitation', '—', '★★ Uses line 16 regular tax in the FTC limit calculation.', 'XLS/output_forms/form-tax-return-1116.xlsx'],
  ['Form 8962 (Premium Tax Credit) compute', '—', 'Indirect — Form 8962 runs after line 16; uses tax-related amounts.', 'XLS/output_forms/form-tax-return-8962.xlsx'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 50 }, { wch: 65 }, { wch: 70 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 16'],
  ['Line 16 emits NO blocking flags directly — it gates on null line 15 and silently skips. Upstream blocking flags (from lines 11ab / 12abcde / 13a / 13b / 14 / 15) determine which path is taken.'],
  [],
  ['Flag code', 'Severity', 'Condition', 'Where emitted'],
  ['(None at line 16 site)', 'N/A', 'Line 16 silently skips when line 15 is null. Upstream blocking flags propagate; line 16 doesn\'t add its own.', 'computeLine16 gate at line 1725'],
  [],
  ['SPEC §12 STRUCTURAL INVARIANTS (not runtime-validated)'],
  ['Invariant', 'How enforced'],
  ['Form 2555 priority (FORM2555_REQUIRES_FEITW per spec §12.2)', 'Decision tree branch order at lines 1742-1745. Branch 2 fires before branches 3-7. FEITW path is structurally enforced.'],
  ['Schedule D Tax Worksheet priority (SCHEDULE_D_WORKSHEET_REQUIRED per spec §12.3)', 'Decision tree branch order at lines 1760-1765. Branch 4 fires before branch 5 (QDCG).'],
  ['line15 ≤ 0 + no box1/2/3 → line16 = 0 (LINE16_SHOULD_BE_ZERO per spec §12.5)', 'Branch 1 sets regularTax = 0; add-ons may still produce positive line 16 per spec §2.3.'],
  ['Form 8978 negative → Schedule 3 line 6l (FORM8978_NEGATIVE_GOES_TO_SCHEDULE3 per spec §12.4)', 'NOT enforced by computeLine16 (only ECR implemented in Box 3 currently). Future Box 3 expansion would need to enforce.'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 12 }, { wch: 100 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 16 is the tax computation orchestrator (6+1 methods + 3 add-on paths). 3rd audit OUTSIDE 13ab pair; FIRST orchestrator-based audit since 13b. 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-14 — ⚠️ HIGH-PRIORITY MFS DEFENSIVE GAP FIXED at computeLine16 call site (TWO bundled leakage paths: form2555Spouse + form4972Spouse)',
    '**Closure applied (Option A — call-site null-shadow; matches 13b #1 + 13a #1 SURGICAL precedent)**: TaxReturnComputeService.java has TWO leakage paths in `computeLine16`, both bundled into one fix at the call site. (1) **~40-line MFS breadcrumb** above the call site at prepare() ~line 1171 documenting: (a) Form 2555 spouse → FEITW branch leak (line 1742 `form2555Taxpayer != null || form2555Spouse != null` triggers FEITW unconditionally; stale spouse FEIE stacks into bracket); (b) Form 4972 spouse → Box 2 add-on leak (lines 1800-1804 add `form4972Spouse.getLine30Total()` unconditionally); per-field MFS-leakage classification for all 4 spouse-side inputs (taxpayer-side OK; 2 spouse-side leak; plus 3 taxpayer-only inputs); concrete failure-mode example ($30k+ error for stacking case); 18-orchestrator cascade context. (2) **Call-site null-shadow** at ~line 1213 + ~line 1216: `isMfsReturn ? null : form4972Spouse` AND `isMfsReturn ? null : form2555Spouse`. NEW lock-in test `mfsExcludesSpouseForm2555AndForm4972FromLine16` at TaxReturnComputeServiceTest.java:~16791 — MFS taxpayer + $200k US wages + STALE spouse Form 2555 ($60k FEIE) + STALE spouse Form 4972 ($6k 1099-R → line 30 = $330). **Test confirms**: post-fix `computationMethod` = "TAX_COMPUTATION_WORKSHEET" (NOT FOREIGN_EARNED_INCOME — FEITW branch correctly bypassed); post-fix `box2Form4972Tax` = null (Form 4972 spouse $330 NOT leaked); spouse forms computed but blocked at call site (sanity check that leak vector exists pre-guard). Log confirms: `method=TAX_COMPUTATION_WORKSHEET line15=184250 regularTax=37067 ... box2Form4972=0 line16=37067`. **Single-guard MFS cascade now applied to 18 orchestrators — NEW CODEBASE MAXIMUM** (was 17 after 13b #1; first orchestrator added since 13b on 2026-05-13). Cascade roster (18): 1c + 1d + 1e + 1f + 1g + 1h + 1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities + computeSocialSecurityBenefits + computeCapitalGainLoss + computeOtherIncomes + computeIncomeAdjustments + buildStandardDeductionIndicators + computeLine13a + computeSchedule1A + **computeLine16 (NEW)**. **Bundled-fix precedent**: same shape as 13b #1 (which bundled additionalDeductionsSpouse + form2555Spouse). Backend: 762 → **763** (+1 lock-in test). Direction OPPOSITE 13b #1 (under-deduction): 16 #1 fixes OVER-stated tax (taxpayer self-harm by paying more than owed pre-fix).',
    'TaxReturnComputeService.java:~1171 (~40-line MFS breadcrumb); ~1213 + ~1216 (call-site null-shadows); TaxReturnComputeServiceTest.java:~16791 (mfsExcludesSpouseForm2555AndForm4972FromLine16 lock-in test)',
    'CLOSED — MFS guard applied at call site (both form2555Spouse + form4972Spouse); lock-in test added. Backend 763/763 pass (+1). 18th orchestrator in MFS cascade — NEW CODEBASE MAXIMUM.'],

  [2, 'RESOLVED 2026-05-14 — DOCUMENTATION HYGIENE — Knowledge file Legacy A renamed (knowledge_line16.md → line-16-tax.md)',
    '**Closure applied**: renamed `C:\\us-tax\\knowledge\\knowledge_line16.md` → `C:\\us-tax\\knowledge\\line-16-tax.md` (plain `mv`; folder not under git per established precedent). **Repo-wide scan** (grep `knowledge_line16`) found 17 hits: (a) `generate-16.js` source-of-truth comment + Issue #2 narrative (both UPDATED to cite new canonical path); (b) `lines/16.md` line 1 ACTIVE SPEC citation (UPDATED: "See knowledge/knowledge_line16.md..." → "See knowledge/line-16-tax.md (renamed from knowledge_line16.md via 16 #2 on 2026-05-14)..."; same pattern as 15 #2); (c) `history.md` + `outstanding.md` historical entries (LEFT UNTOUCHED per established precedent); (d) **12 prior-audit generators** `generate-7a/b/8/9/10/11a/b/12a/b/c/d/e.js` reference line 16 in their "Looking ahead" / cumulative-state content (LEFT UNTOUCHED — historical artifacts frozen at their audit dates). **9th Legacy A migration in the workflow** (after 7a #2 + 8 #2 + 9 #2 + 10 #2 + 11a #2 + 12a #2 + 13a #2 + 15 #2; lines 13b, 14 had no separate knowledge file). **Naming convergence advances 21 → 22 lines**. The knowledge file is comprehensive (~308 lines covering decision tree, computation methods, backend wiring, test inventory, output model, PDF fields, and identified gaps). Backend tests: 763/763 unchanged (pure doc rename; no functional impact).',
    'C:\\us-tax\\knowledge\\line-16-tax.md (post-rename canonical path)',
    'CLOSED — file renamed via plain `mv`; lines/16.md line 1 spec citation updated to new canonical path with rename history note; prior-audit generators (generate-7a/b/8/9/10/11a/b/12a-e.js) + history.md + outstanding.md left UNTOUCHED as historical artifacts. Convergence 21 → 22 lines.'],

  [3, 'RESOLVED 2026-05-14 — SPEC ENHANCEMENT — Created Verification log section §16 in lines/16.md (single-row; IN-PROGRESS until Issue #10)',
    '**Closure applied**: appended `## 16) Verification log` section to `lines/16.md` after section §15 (Bottom line). 5-column markdown table (Audit ID / Date / Closures applied / Backend regression / Outcome); first row captures the 16 walkthrough state in IN-PROGRESS form (#1 ⚠️ HIGH-PRIORITY MFS guard — 18th orchestrator NEW CODEBASE MAX; #2 Legacy A rename — 9th migration with convergence 21→22; #3 this section creation; #4-#10 IN-PROGRESS; backend 762 → 763 +1 from MFS lock-in). Will be finalized to "COMPLETE — 10/10 closed" after Issue #10 closes (append-then-finalize pattern from 13a/13b/14/15 walkthroughs). **Single-row pattern** — single-line audit shape (no sub-lines); smallest log shape in workflow (mirrors lines 8, 9, 10, 14, 15 single-line audits; contrasts with 13ab 2-row pair-aligned shape and 12abcde 5-row LARGEST cluster log). Backend tests: 763/763 unchanged (pure doc append; no functional impact).',
    'lines/16.md (Verification log section §16 appended; single-row IN-PROGRESS table; finalized COMPLETE by Issue #10)',
    'CLOSED — section §16 appended; row 1 written IN-PROGRESS. Will finalize to COMPLETE — 10/10 closed at Issue #10. Single-row pattern (smallest log shape; mirrors lines 8, 9, 10, 14, 15).'],

  [4, 'RESOLVED 2026-05-14 — CROSS-REFERENCE SEED — Forward seed planted above computeLine16 orchestrator (NEW seed at NEW location; different shape than 14 #4 / 15 #4 chained inline seed)',
    '**Closure applied**: added ~70-line AUDIT-TRAIL ANCHOR seed breadcrumb at TaxReturnComputeService.java:~1725 (between the section banner and the existing JavaDoc, so both navigation landmarks remain intact). **Different shape than 14 #4 / 15 #4 chained seed** — those lived at the line-14 sum site (inline-computed chain); line 16 is at a separate orchestrator (`computeLine16` at line ~1751) so the seed lives ABOVE the orchestrator entry. Structure (8 themes): (1) Method designation + 16 #4 audit-trail anchor + "first orchestrator audit since 13b" note; (2) Formula (line16 = tax_on_taxable_income + Form8814 box1 + Form4972 box2 + box3 writein); (3) **★ 7-branch decision tree** with priority order (ZERO → FOREIGN_EARNED_INCOME → FORM_8615 → SCHEDULE_D_TAX_WORKSHEET → QDCG → TAX_TABLE → TCW); (4) **★ 4 helper methods** with line refs (computeTaxBracket ~1923 + computeQDCGWorksheet ~1580 + computeScheduleDTaxWorksheet ~1688 + computeForeignEarnedIncomeTaxWorksheet ~1780); (5) **★ 2 predicates** with line refs (isScheduleDTaxWorksheetRequired ~1851 + isQDCGWorksheetRequired ~1876); (6) **★ 3 add-on tax paths** (Box 1 Form 8814; Box 2 Form 4972 with MFS-guard cross-ref to 16 #1; Box 3 ECR only — others NOT implemented per spec §10.3); (7) **★ Critical zero rule** (spec §2.3 — line 16 > 0 when line 15 = 0 if box add-ons fire) + **MFS guard cross-reference** (16 #1; 18th orchestrator NEW CODEBASE MAX) + **Schedule J out-of-scope note** (16 #9); (8) **Upstream chain reference** (line 11b → 12e → 13a → 13b → 14 → 15 → THIS) + cross-ref to 13a/b → 14 → 15 chained seed at ~line 875. **FUTURE EXTENSION POINTS** — INFORMATIONAL ONLY hooks for future line-17/18/Form-1116 audits + Box 3 expansion (§962, 1291TAX, Form 8978, 965INC). **NOT upgrade targets** — each future orchestrator-based audit will plant its own seed at its own orchestrator. This seed is a **terminal seed** (no future upgrades expected) but a **referenced seed** (future audits cite it as a navigable hub between inline-computed chain (11-15) and orchestrator-based chain (16+)). Pure documentation closure — no functional change. Backend tests: **763/763 unchanged**.',
    'TaxReturnComputeService.java:~1725 (above computeLine16 orchestrator; ~70-line forward seed breadcrumb planted between section banner and existing JavaDoc)',
    'CLOSED — terminal seed planted (NOT upgraded by future audits; each future orchestrator-based audit plants its own seed). Will be REFERENCED by line-17/18/Form-1116 audits as a navigable hub.'],

  [5, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — Branch 1 (ZERO) + Branch 2 (FOREIGN_EARNED_INCOME / FEITW) priority + multi-purpose zero check + FEITW stacking formula',
    '**Closure applied**: added ~42-line VERIFIED CORRECT breadcrumb above Branches 1-2 at TaxReturnComputeService.java:~1864. Structure: (1) **Branch 1 ZERO** designation as a MULTI-PURPOSE check handling 3 IRS rules with one comparison: (a) spec §2.3 ordinary tax = 0 when line15 ≤ 0; (b) spec §6.3 + §8 "if line 15 is zero, do NOT complete FEITW" — handled structurally by Branch 1 firing first → Branch 2 unreachable when line15 ≤ 0; (c) spec §3.1 decision-tree position. Note: Box 1/2/3 add-ons still run even when regularTax = 0 (critical zero rule). (2) **Branch 2 FEITW IRS-MANDATED PRIORITY** per IRC §911 + spec §8 + §12.2 — "MUST" rule; supersedes Branches 3-7; without priority, Form 2555 + qualified dividends would wrongly route to Branch 5 (QDCG) missing the stacking math. (3) **★ FEITW stacking formula** documented in full (line1-line6) with worksheet line mappings + helper cross-reference to `computeForeignEarnedIncomeTaxWorksheet` at ~line 1822; spec §8 note that QDCG/SchedD/Form 8615 can feed into line 4; concrete tax-rate-arbitrage rationale (e.g., $100k taxable + $50k FEIE taxed at $150k marginal rate). (4) **★ MFS guard cross-reference** to 16 #1 — `form2555Spouse` null-shadowed at call site (~line 1213); on MFS with stale spouse Form 2555, Branch 2 correctly does NOT fire. (5) **Coverage cross-references** to spec §3.1 + §6.3 + §8 + §12.2 + dependencies/16.md "Method Selection Rules" + 16 #4 audit-trail anchor above the orchestrator (~line 1725). Pure documentation closure — no functional change. Backend tests: **763/763 unchanged**.',
    'TaxReturnComputeService.java:~1864 (Branches 1-2; ~42-line breadcrumb above the if-chain); helper at ~line 1822',
    'CLOSED — verified correct. ~42-line breadcrumb documents Branch 1 multi-purpose ZERO check + Branch 2 FEITW IRS-MANDATED priority + FEITW stacking formula + MFS guard cross-ref to 16 #1.'],

  [6, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — Branch 3 (FORM_8615 kiddie tax) + manual-entry pattern + defensive bracket fallback + Form 2555 interaction',
    '**Closure applied**: added ~36-line VERIFIED CORRECT breadcrumb above Branch 3 at TaxReturnComputeService.java:~1916. Structure: (1) **Branch 3 designation** — FORM_8615 kiddie tax; user-attested via `hasKiddieTaxUnearnedIncome` flag on kiddie-income-taxpayer personal form; per spec §4 + IRC §1(g). (2) **5-condition eligibility** documented (>$2,700 unearned income + return required + under 18 OR 18 with earned-income test OR 19-23 student + parent alive year-end + not MFJ). (3) **★ MANUAL-ENTRY PATTERN rationale** — Form 8615 OUT-OF-SCOPE for auto-computation (multi-step net-investment-income + parent\'s bracket comparison); user fills externally and enters `childFinalTaxLine18` result; consistent with other out-of-scope tax forms (Schedule J per 16 #9; Schedule C/F blocked entirely). (4) **★ DEFENSIVE BRACKET FALLBACK** — if `hasKiddieTaxUnearnedIncome=TRUE` BUT `childFinalTaxLine18 = null`, fall back to `computeTaxBracket` + WARN log; method label flips to TAX_TABLE / TCW based on $100k boundary; defense-in-depth pattern from 13a #1 ("soft-handle missing data"). (5) **★ Form 2555 INTERACTION** (spec §4 last paragraph) — Branch 2 priority overrides Branch 3 structurally via decision tree order; KNOWN LIMITATION: current FEITW line 4 uses TCW/QDCG not Form 8615; rare combination (child with foreign earned income exclusion) — not flagged as bug. (6) **Coverage cross-references** — spec §4 + §3.1 + dependencies/16.md + 16 #4 audit-trail anchor at ~line 1725. Pure documentation closure — no functional change. Backend tests: **763/763 unchanged**.',
    'TaxReturnComputeService.java:~1916 (Branch 3 — FORM_8615 kiddie tax; ~36-line breadcrumb above the else-if branch)',
    'CLOSED — verified correct. ~36-line breadcrumb documents 5-condition eligibility + manual-entry pattern (Form 8615 out-of-scope; user enters childFinalTaxLine18 externally) + defensive bracket fallback rationale + Form 2555 interaction (Branch 2 priority overrides; rare-scenario limitation noted).'],

  [7, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — Branch 4 (SCHEDULE_D_TAX_WORKSHEET) + Branch 5 (QDCG Worksheet) + predicate logic + mutual-exclusivity via decision-tree order',
    '**Closure applied**: added ~46-line VERIFIED CORRECT breadcrumb above Branches 4-5 at TaxReturnComputeService.java:~1965. Structure: (1) **Branch 4 (Schedule D Tax Worksheet) designation** — required when Schedule D has 28%-rate gain OR §1250 unrecaptured gain AND lines 15 + 16 positive; per `isScheduleDTaxWorksheetRequired` predicate at ~line 1971; handles TWO income types QDCG cannot — 28% rate gain (collectibles + §1202 stock with 50% exclusion) + unrecaptured §1250 gain (depreciation recapture at 25% max rate). (2) **Branch 5 (QDCG Worksheet) designation** — required when qualified dividends OR capital gains present BUT NOT WHEN BRANCH 4 APPLIES; per `isQDCGWorksheetRequired` predicate at ~line 1996; 3 OR-conditions documented: (a) qualifiedDividends > 0; (b) line7bScheduleDNotRequired AND capitalGainLoss > 0; (c) Schedule D lines 15 + 16 both positive (simpler case than Branch 4); handles 0% / 15% / 20% preferential rates ONLY (no 28% / §1250 handling). (3) **★ Mutual exclusivity enforced STRUCTURALLY by decision-tree branch order** — Branch 4 fires before Branch 5; when `isScheduleDTaxWorksheetRequired = true`, Branch 5 is UNREACHABLE; per spec §6 IRS rule "Do not use the QDCG Worksheet if you must use the Schedule D Tax Worksheet"; no explicit check inside Branch 5 — if-else order does the work. (4) **★ 2025 QDCG thresholds** (per spec §6 + Rev. Proc. 2024-40; encoded in `computeQDCGWorksheet` at ~line 1622): per-filing-status 0% + 20% thresholds documented with full table (Single $48,350/$533,400; MFJ $96,700/$600,050; MFS $48,350/$300,025; HOH $64,750/$566,700) + tax-rate semantics (below 0% → 0%; between → 15%; above 20% → 20%; ordinary income at bracket rates regardless). (5) **Coverage cross-references** to spec §5 + §6 + dependencies/16.md "Method Selection Rules" + 16 #4 audit-trail anchor (~line 1725) + helpers (`computeScheduleDTaxWorksheet` ~line 1729; `computeQDCGWorksheet` ~line 1622). Pure documentation closure — no functional change. Backend tests: **763/763 unchanged**.',
    'TaxReturnComputeService.java:~1965 (Branches 4-5; ~46-line breadcrumb above the else-if chain); ~1971 (predicate 1); ~1996 (predicate 2); ~1622 (QDCG helper); ~1729 (SchedD TW helper)',
    'CLOSED — verified correct. ~46-line breadcrumb documents Branch 4 + Branch 5 predicates + mutual exclusivity via decision-tree order + 2025 QDCG thresholds with full per-status table + 28% rate gain / §1250 unrecaptured gain handling rationale (only Branch 4) + cross-references to spec §5-§6 + helpers.'],

  [8, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — Branch 6/7 (TAX_TABLE / TCW fallback) + Box 1 (Form 8814) + Box 2 (Form 4972) + Box 3 (ECR) add-on logic + critical zero rule + persistence model',
    '**Closure applied**: added TWO breadcrumbs — ~26-line VERIFIED CORRECT block above the Branches 6/7 else-fallback at TaxReturnComputeService.java:~2023 + ~42-line VERIFIED CORRECT block above the Box 1/2/3 add-on Step blocks at ~line 2032. **Branches 6/7 block** structure: (1) LAST-RESORT designation per spec §3.1; most common path. (2) **★ $100k boundary LABEL-ONLY** — `computeTaxBracket` returns identical value for both paths from the bracket function; boundary only affects `computationMethod` enum label exposed for PDF disclosure + E2E test assertions; no math divergence. (3) **★ 2025 TCW BRACKETS** full per-filing-status table documented (Single/MFJ/QSS/MFS/HOH) — sourced from CLAUDE.md + spec §3 + Rev. Proc. 2024-40. **Box 1/2/3 block** structure: (1) Three independent add-on tax paths stacked on regularTax; each can fire even when regularTax=0. (2) **★ Critical zero rule** (spec §2.3) — line 16 > 0 possible when line 15 ≤ 0 if any Box 1/2/3 add-on fires; concrete MFS example. (3) **Box 1 Form 8814** mechanics — per-child summation across `form8814List` (per Form 8814 multiplicity rule from CLAUDE.md). (4) **Box 2 Form 4972** mechanics + **★ MFS guard cross-ref to 16 #1** — `form4972Spouse` null-shadowed at call site (~line 1213); one of TWO leaks fixed in bundled 16 #1 (other: `form2555Spouse` at Branch 2); Form 4972 multiplicity rule cited. (5) **Box 3 ECR** mechanics + **⚠️ PARTIAL IMPLEMENTATION** — spec §10.3 lists 5 Box 3 codes; only ECR wired; other 4 (`962`/`1291TAX`/`Form 8978`/`965INC`) NOT IMPLEMENTED → future expansion candidate (cross-ref to 16 #4 audit-trail anchor "FUTURE EXTENSION POINTS"). (6) **★ Persistence model** — `tax` (canonical) vs. `regularTax` (line 17 AMT comparison base: line 17 = max(0, AMT − regularTax)) + box1/2/3 fields. (7) **Coverage cross-references** to spec §2.3 + §3.1 + §6 + §10.3 + dependencies/16.md + 16 #4 audit-trail anchor (~line 1725) + 16 #1 MFS guard (~line 1213). Pure documentation closure — no functional change. Backend tests: **763/763 unchanged**.',
    'TaxReturnComputeService.java:~2023 (Branches 6/7 fallback; ~26-line breadcrumb) + ~2032 (Box 1/2/3 add-ons; ~42-line breadcrumb); helper at ~line 2128 (computeTaxBracket)',
    'CLOSED — verified correct. TWO breadcrumbs (~26-line + ~42-line) document $100k label-only boundary + full 2025 TCW bracket table + critical zero rule + Box 1/2/3 mechanics with Form 8814/Form 4972 multiplicity rules + ★ MFS guard cross-ref to 16 #1 at Box 2 + ⚠️ spec §10.3 partial Box 3 coverage (only ECR; 4 codes NOT IMPLEMENTED) + persistence model with line 17 AMT comparison cross-ref.'],

  [9, 'RESOLVED 2026-05-14 — OBSERVATION — Schedule J path documented in spec §7 but implementation omits it (farming/fishing out-of-scope; 13th Path A application)',
    '**Closure applied**: pure xlsx-flip observation — **NO code change**; **NO outstanding.md entry** (anti-fragmentation policy). Spec §7 documents Schedule J (income averaging for farmers/fishermen) as an OFFICIAL 2025 line-16 branch ("if the taxpayer had income from farming or fishing, tax may be lower if figured using Schedule J"); spec also notes the project-scope caveat: "this application generally treats farming/fishing income as out of scope, but Schedule J is still an official 2025 line-16 branch and should not be omitted from the developer documentation." **Implementation reality** at TaxReturnComputeService.java:~1823-2027 (decision tree post-Issue #4/#5/#6/#7/#8 breadcrumb expansions): decision tree has 7 branches (ZERO / FEITW / Form 8615 / Schedule D TW / QDCG / Tax Table / TCW); **no Schedule J branch exists**. **Upstream blocking** — Schedule C/F (and farming/fishing income generally) are blocked at income lines via blocking flags (`LINE13A_SELF_EMPLOYMENT_OUT_OF_SCOPE_*` for QBI; similar exclusions at Schedule 1 line 6 farm income); per CLAUDE.md "Out of Scope": **Self-employment (Schedule C / SE / F)** explicitly excluded. So Schedule J branch could NEVER legitimately fire — taxpayers with farming/fishing income blocked upstream BEFORE reaching `computeLine16`. **The discrepancy is documented + intentional** — spec is exhaustive (correct); implementation is project-scope-limited (correct); upstream blocking enforces consistency (correct). **★ Anti-fragmentation policy applied** — observation only; no breadcrumb added (nothing to anchor — there is no Schedule J branch); no outstanding.md entry (spec already flags as "out-of-scope but kept for reference"). **★ 13th PATH A APPLICATION** in the workflow (streak: 16 → 17 consecutive zero-outstanding walkthroughs). Future cleanup candidate (NOT actionable today; cosmetic spec rewrite): spec §7 could be reframed as "OUT OF SCOPE (documented for reference)" rather than "official 2025 line-16 branch" — but that\'s a documentation polish item, not an audit issue.',
    'TaxReturnComputeService.java:~1823-2027 (decision tree post-#4-#8 breadcrumbs; no Schedule J branch); lines/16.md §7 (documents Schedule J as official branch with out-of-scope caveat); CLAUDE.md "Out of Scope" section',
    'CLOSED — pure observation. **13th Path A application** in workflow (streak extends 16 → 17 consecutive zero-outstanding walkthroughs). Schedule J path documented in spec but not implemented (farming/fishing out-of-scope policy enforced upstream via blocking flags at income lines).'],

  [10, 'RESOLVED 2026-05-14 — BOUNDARY MILESTONE — Line 16 (Tax) walkthrough complete at 10/10; FIRST ORCHESTRATOR-BASED AUDIT SINCE 13b; 18 ORCHESTRATORS (NEW CODEBASE MAXIMUM); 17 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS',
    '**Closure applied**: pure xlsx-flip + Verification log finalization — **CLOSES the 16 walkthrough at 10/10**. TWO file touches: (a) this row flipped to RESOLVED; (b) lines/16.md §16 Verification log row finalized IN-PROGRESS → **COMPLETE — 10/10 closed** (single-row shape; matches lines 8/9/10/14/15). **Seven themes**: (1) **Structural positioning** — 3rd audit OUTSIDE 13ab pair (after lines 14 and 15); **FIRST orchestrator-based audit since 13b** (`computeSchedule1A` on 2026-05-13) — returns workflow to orchestrator-based audits after 3 consecutive inline-computed audits (14, 15, plus 13ab #3 finalization). Confirms the audit shape flexes between orchestrator and inline patterns. (2) **★ 18 ORCHESTRATORS in MFS-guard cascade — NEW CODEBASE MAXIMUM** (was 17 after 13b #1; +1 from 16 #1 fix at `computeLine16` call-site). Cascade roster (18): 1c + 1d + 1e + 1f + 1g + 1h + 1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities + computeSocialSecurityBenefits + computeCapitalGainLoss + computeOtherIncomes + computeIncomeAdjustments + buildStandardDeductionIndicators + computeLine13a + computeSchedule1A + **computeLine16 (NEW)**. (3) **★ MFS leakage bundled fix** (Issue #1) — TWO leakage paths in one call-site null-shadow fix: `form2555Spouse` (would wrongly fire Branch 2 FEITW) + `form4972Spouse` (would inflate Box 2 lump-sum tax). New lock-in test `mfsExcludesSpouseForm2555AndForm4972FromLine16` extends backend regression **762 → 763**. (4) **Knowledge convergence advances 21 → 22 lines** — Issue #2 9th Legacy A migration (`knowledge_line16.md` → `line-16-tax.md`). (5) **★ Forward seed planted at orchestrator — DIFFERENT SHAPE than inline-line seeds** — Issue #4 ~70-line AUDIT-TRAIL ANCHOR at ~line 1725 (above `computeLine16`); **TERMINAL seed** (no future upgrades expected — each future orchestrator-based audit plants its own seed) but **REFERENCED seed** (future audits cite it as navigable hub between inline-computed chain (11-15) and orchestrator-based chain (16+)). Different lifecycle than 14 #4 / 15 #4 chained inline seeds. Informational hooks seeded for future line-17/18/Form-1116 audits + Box 3 expansion (`962`/`1291TAX`/Form 8978/`965INC`). (6) **Anti-fragmentation continues** — Issue #9 Schedule J observation (13th Path A application; documented + intentional discrepancy closes as observation; no breadcrumb anchor needed; no outstanding.md entry). (7) **Cumulative state through line 16**: **42 lines audited** (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + 11b + 12a + 12b + 12c + 12d + 12e + 13a + 13b + 14 + 15 + **16**); **417 audit issues closed total** (407 + 10); backend **763/763 pass** (+1 from 16 #1 MFS lock-in test); **MFS cascade = 18 orchestrators (NEW CODEBASE MAX, +1)**; **knowledge convergence = 22 lines (+1)**; dependencies files = 43 (unchanged); 13 Path A applications (+1 from 16 #9); 6 anti-duplication applications (unchanged); 2 SEEDED → VERIFIED CORRECT upgrades (unchanged; 16 #4 is terminal). **17 CONSECUTIVE WALKTHROUGHS WITH ZERO NEW OUTSTANDING.MD ENTRIES** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/**16**). **Verification logs**: 2ab (4) + 3abc (3) + 4abc (3) + 5abc (3) + 6abcd (4) + 7ab (2) + 8 (1) + 9 (1) + 10 (1) + 11ab (2) + 12abcde (5 — LARGEST) + 13ab (2) + 14 (1) + 15 (1) + **16 (1 — single-line shape)**. **Looking ahead — line 17 (AMT via Form 6251)**: 4th audit OUTSIDE 13ab pair; second orchestrator-based audit in this chain; AMT computed via Form 6251 (separate from line 16) compared to `regularTax`: **line 17 = max(0, AMT − regularTax)** — note `regularTax` not line16Total (16 #8 persistence-model breadcrumb just locked this in). Likely needs MFS guard analysis at `computeLine17` → would extend cascade to **19 orchestrators**. Heavy compute with multiple AMT add-back rules (per 13b #8 senior deduction add-back precedent). Will use 16 #4 audit-trail anchor as navigable hub. **NO code change today**; **NO backend re-run** (tests already at 763/763 from 16 #1 lock-in).',
    'XLS/computations/16.xlsx audit-trail (this row); lines/16.md §16 Verification log row FINALIZED to COMPLETE — 10/10 closed; knowledge file renamed via 16 #2; terminal seed planted via 16 #4 at TaxReturnComputeService.java:~1725',
    'CLOSED — 10/10. **42 lines audited; 417 issues; 763/763 backend; 18 orchestrators (NEW CODEBASE MAX); 22-line knowledge convergence; 17 consecutive zero-outstanding walkthroughs**. FIRST orchestrator-based audit since 13b. Next: line 17 AMT (orchestrator-based; potential 19th cascade entry).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 40 }, { wch: 120 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 16 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.taxAndCredits.tax', 'Form 1040 page 2, line 16 (numeric box; PDF f2_08)', 'XLS/output_forms/form-tax-return-1040.xlsx', '★ CANONICAL line 16 output. Sum of regularTax + box1 + box2 + box3.'],
  ['form1040.taxAndCredits.box1Checked', 'PDF c2_9 (Form 8814 checkbox)', 'XLS/output_forms/form-tax-return-1040.xlsx', 'Set TRUE when Form 8814 child tax > 0.'],
  ['form1040.taxAndCredits.box2Checked', 'PDF c2_10 (Form 4972 checkbox)', 'XLS/output_forms/form-tax-return-1040.xlsx', 'Set TRUE when Form 4972 lump-sum tax > 0.'],
  ['form1040.taxAndCredits.box3Checked + box3Code', 'PDF c2_11 + f2_07 (other-form checkbox + code)', 'XLS/output_forms/form-tax-return-1040.xlsx', 'Set TRUE + "ECR" when education credit recapture > 0. Other codes (962/1291TAX/Form 8978/965INC) NOT IMPLEMENTED.'],
  ['form1040.taxAndCredits.regularTax', '(internal; not on PDF)', 'XLS/output_forms/form-tax-return-1040.xlsx', 'Tax-on-taxable-income only (no add-ons). Used by Form 6251 line 8 + line 17 AMT comparison.'],
  ['form1040.taxAndCredits.computationMethod', '(internal; not on PDF)', '—', 'Enum for logging + E2E test assertions. Values: ZERO / FOREIGN_EARNED_INCOME / FORM_8615 / SCHEDULE_D_TAX_WORKSHEET / QDCG / TAX_TABLE / TAX_COMPUTATION_WORKSHEET.'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 17 (AMT)', 'Form 1040 page 2, line 17 + Form 6251', 'XLS/output_forms/form-tax-return-6251.xlsx', '★★ Line 17 = max(0, tentative_AMT − regularTax). regularTax (not line 16 total) is the comparison base.'],
  ['Form 1040 line 18 (line16 + line17)', 'Form 1040 page 2, line 18', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ Composite tax before credits. Subsequent line audits will document.'],
  ['Form 1116 (Foreign Tax Credit) limitation', '—', 'XLS/output_forms/form-tax-return-1116.xlsx', '★★ Uses line 16 regular tax in the FTC limit calculation.'],
  ['Form 8962 (Premium Tax Credit)', '—', 'XLS/output_forms/form-tax-return-8962.xlsx', 'Indirect — runs after line 16; uses tax-related amounts.'],
  [],
  ['CONDITIONAL ATTACHMENTS'],
  ['Form 8814', 'Form 8814 pages', 'XLS/output_forms/form-tax-return-8814.xlsx', 'Attached when Form 8814 list non-empty AND box1Checked=TRUE.'],
  ['Form 4972', 'Form 4972 pages', 'XLS/output_forms/form-tax-return-4972.xlsx', 'Attached when taxpayer or spouse Form 4972 computed AND box2Checked=TRUE.'],
  ['Form 2555', 'Form 2555 pages', 'XLS/output_forms/form-tax-return-2555.xlsx', 'Attached when Form 2555 computed (FEITW branch fires at line 16).'],
  ['Form 8615 (kiddie tax)', 'Form 8615 pages', '(not currently generated)', 'NOT IMPLEMENTED — childFinalTaxLine18 is manually entered; Form 8615 itself not auto-generated.'],
  ['Schedule D + Schedule D Tax Worksheet', '—', 'XLS/output_forms/form-tax-return-1040-schedule-d.xlsx', 'Schedule D attached when required; Schedule D Tax Worksheet is computed internally (not a separate form).'],
  ['ECR statement', '(written statement)', '—', 'Per spec §10.3: box 3 ECR requires attached statement. NOT IMPLEMENTED as a formal statement attachment.'],
  [],
  ['NOT IN OUTPUT (deliberate exclusions per spec §3 + §7 + §10)'],
  ['Schedule J (income averaging)', '—', '—', 'OUT OF SCOPE — farming/fishing income per CLAUDE.md. See 16 #9 observation.'],
  ['Box 3 codes other than ECR (962, 1291TAX, Form 8978, 965INC)', '—', '—', 'NOT IMPLEMENTED — Box 3 currently only handles ECR. Future expansion candidate.'],
  ['Schedule J branch in computeLine16 decision tree', '—', '—', 'No code branch for Schedule J — would fire only with farming/fishing income (blocked upstream).'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 55 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
