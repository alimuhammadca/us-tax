// ============================================================================
//  Generates: C:\us-tax\XLS\computations\11a.xlsx
//
//  Source-of-truth references:
//    - lines/11ab.md (2025 IRS-verified rule map for Form 1040 lines 11a + 11b)
//    - dependencies/11ab.md
//    - knowledge/line-11ab-agi.md (renamed 2026-05-13 via 11a #2 from legacy knowledge_line11ab.md)
//    - flowcharts/11ab.drawio
//    - diagrams/11a.drawio + diagrams/11b.drawio
//    - TaxReturnComputeService.buildAdjustments() at line ~4386 — inline compute (NOT a
//      separate orchestrator); 10 #4 forward-cross-reference breadcrumb seeded above it
//    - PDF semantic CSV row 89: f1_75[0] line11a_adjusted_gross_income (page 1)
//    - PDF semantic CSV row 150: f2_01[0] line11b_adjusted_gross_income_repeat (page 2)
//    - IRS 2025 Form 1040 line 11a instructions ("Subtract line 10 from line 9. This is
//      your adjusted gross income.") + line 11b instructions ("Amount from line 11a")
//    - IRC §62 (general AGI framework); per-benefit MAGI add-backs per Pub. 590-A / 970 /
//      974 / 596 (NOT line 11a/11b themselves)
//
//  Tax year: 2025
//
//  NOTE: Line 11a is a **pure subtraction line** (NOT a separate orchestrator):
//    line11a = subtractNonNegativeAllowNegative(line9, line10)
//  with signed-result semantic (negative AGI valid; NOT floored at zero per spec §7.3).
//
//  **Line 11a audit positioning**:
//   • SECOND audit in AGI-territory (after line 10 boundary milestone per 9 #10 + 10 #10)
//   • FIRST tightly-coupled-pair audit since the 7ab pair completion 2026-05-12 (line 7b
//     completed the 7ab pair) — line 11a starts the 11ab pair (line 11b sibling audit
//     follows; analogous to 7a → 7b pair flow)
//   • FIRST cross-reference EXTENSION by a downstream audit — extends the 10 #4 forward-
//     cross-reference breadcrumb at `buildAdjustments` (template established yesterday by
//     10 #4; line 11a audit validates the template)
//   • NO MFS guard needed at line 11a site — line 11a is inline (not orchestrator);
//     inherits MFS protection from upstream feeders line 9 (13 income orchestrators all
//     MFS-protected) + line 10 (computeIncomeAdjustments via 10 #1 — 14th orchestrator)
//
//  Line 11a audit angles:
//   • Inheritance MFS protection observation (STRUCTURALLY similar to 9 #1)
//   • Knowledge file rename (`knowledge_line11ab.md` → canonical `line-11ab-agi.md`;
//     5th Legacy A migration; convergence to 18 lines)
//   • Verification log section CREATED in `lines/11ab.md` (NORMAL-variant pair-aligned
//     first row of eventual 2-row log — same shape as 7ab cluster-start)
//   • 10 #4 breadcrumb EXTENSION with line-11a-specific details
//   • Verified-correct breadcrumbs on subtractNonNegativeAllowNegative + signed-result +
//     line 11b copy-line invariant
//   • NEW lock-in test `line11bAlwaysEqualsLine11aInvariant` (closes knowledge G3)
//   • Documentation drift fix — knowledge G4 + §8 PDF map claims are STALE (CSV actually
//     has `line11a_adjusted_gross_income` + `f1_75[0]`, not `line11_...` + `f1_77[0]`)
//   • MAGI vs AGI guardrail observation (line 11b is NOT universal MAGI per spec §5;
//     downstream per-benefit MAGI compute deferred to Schedule 1-A / Form 8863 / Form 8962)
//   • Boundary milestone — 2nd AGI-territory audit; first pair-audit since 7ab; sets up
//     line 11b sibling audit
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '11a.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 11a — ADJUSTED GROSS INCOME (AGI)'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 11a (page 1, bottom)'],
  ['Concept', 'Adjusted Gross Income — the foundational tax-base figure on Form 1040. Equals total income (line 9) minus above-the-line adjustments (line 10 = Schedule 1 line 26). Used as the starting point (or as a phaseout threshold) for virtually every downstream deduction, credit, and benefit calculation. **SECOND audit in AGI-territory** per 9 #10 boundary milestone + 10 #10 first-AGI-audit (line 10 was first). **FIRST tightly-coupled-pair audit since the 7ab pair completion** — line 11a starts the 11ab pair (line 11b sibling follows; analogous to 7a → 7b flow).'],
  ['Core invariant', '`Form1040.line11a = line9 - line10` via `subtractNonNegativeAllowNegative` (signed; negative AGI preserved — NOT floored at zero per spec §7.3 + §10). `Form1040.line11b = line11a` exactly (IRS copy-line — no separate computation per spec §2.2). Line 15 floored at zero separately; lines 11a/11b NOT floored.'],
  ['Per-Return Formula',
    'INLINE COMPUTATION at TaxReturnComputeService.buildAdjustments() (~line 4393-4398):\n' +
    '  BigDecimal line10 = roundMoney(incomeAdjustments == null ? null\n' +
    '      : incomeAdjustments.line10FromSchedule1Line26());\n' +
    '  BigDecimal line9 = income == null ? null : roundMoney(income.getTotalIncome());\n' +
    '  // Form 1040 line 11a is a pure compute line: AGI = line 9 minus line 10.\n' +
    '  // The 2025 form does not force zero-flooring here, so preserve negative results.\n' +
    '  BigDecimal line11a = line9 == null ? null\n' +
    '      : roundMoney(subtractNonNegativeAllowNegative(line9, line10));\n' +
    '  BigDecimal line11b = line11a;  // IRS copy line\n' +
    '  if (line10 == null && line11a == null) {\n' +
    '    return null;\n' +
    '  }\n' +
    '  Adjustments adjustments = new Adjustments();\n' +
    '  adjustments.setLine11aAdjustedGrossIncome(line11a);\n' +
    '  adjustments.setLine11bAmountFromLine11aAdjustedGrossIncome(line11b);\n' +
    '  adjustments.setAdjustedGrossIncome(line11a);  // legacy alias\n\n' +
    '**Two operands**:\n' +
    '  line9   — Form 1040 line 9 (total income; 8 line-9-operand sum per 13-audit\n' +
    '            consolidation FINAL at TaxReturnComputeService.java:4139-4222)\n' +
    '  line10  — Form 1040 line 10 (adjustments; Schedule 1 line 26 pass-through per 10 #7)\n\n' +
    '**Signed semantic** (per spec §7.3): `subtractNonNegativeAllowNegative` returns\n' +
    'a signed BigDecimal. Negative AGI is VALID — NOL carryback (Form 1045), refundable-\n' +
    'credit scenarios with negative-AGI optimization, etc.'],
  ['Filed',
    'Form 1040 line 11a (page 1, bottom) — PDF field `f1_75[0]` = `line11a_adjusted_gross_income` (canonical per CSV row 89).\n' +
    'Form 1040 line 11b (page 2, top) — PDF field `f2_01[0]` = `line11b_adjusted_gross_income_repeat` (canonical per CSV row 150). Line 11b carry-forward repeats AGI for downstream references.'],
  ['Backend method', '**No dedicated orchestrator** — line 11a is computed inline in `buildAdjustments()` (line ~4386) after line 9 + line 10 are finalized. No MFS guard at the line 11a site itself; **inherits MFS protection** from the 14 upstream orchestrators (13 income orchestrators feeding line 9 + `computeIncomeAdjustments` for line 10 per 10 #1). Same structural pattern as line 9 (inline, no orchestrator, inherits MFS — per 9 #1).'],
  ['Output', 'form1040.adjustments.line11aAdjustedGrossIncome (BigDecimal — signed, gain/zero/negative; whole-dollar HALF_UP rounded). ALSO persisted to `adjustedGrossIncome` legacy alias for backward UI compatibility (knowledge §6 G1 tech-debt — same value as line11a; some downstream callers like Form 6251 / Schedule A still use the legacy field).'],
  ['IRS source', 'IRS 2025 Form 1040 line 11a instructions ("Subtract line 10 from line 9. This is your adjusted gross income") + line 11b instructions ("Amount from line 11a (adjusted gross income)") + spec §1 / §2.1 / §2.2 / §5. IRC §62 (general AGI framework). MAGI add-backs (PR exclusion / Form 2555 / Form 4563 / etc.) are PER-BENEFIT downstream computations, NOT line 11a/11b themselves (per spec §5).'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Compute line 9 (total income) via `buildIncome()` and the 13-audit-consolidation line-9 sum at lines 4139-4222', 'Line 9 = sum of 1z + 2b + 3b + 4b + 5b + 6b + 7a + 8 (8 operands). All feeders MFS-protected per the 14-orchestrator cascade.'],
  [2, 'Compute line 10 (adjustments) via `computeIncomeAdjustments()` per 10 #7 → Schedule 1 line 26', 'Line 10 = Schedule 1 line 26 = sum(lines 11-23) + line 25 (per 10 #5 + 10 #6). MFS-guarded at orchestrator entry per 10 #1.'],
  [3, 'Apply `subtractNonNegativeAllowNegative(line9, line10)` with null-guard on line 9', 'When `line9 == null`: line11a = null (no AGI computed). When `line10 == null`: treated as 0 → line11a = line9. When both non-null: signed subtraction (negative-AGI preserved).'],
  [4, 'Apply `roundMoney` (HALF_UP, whole-dollar, sign-preserving)', 'Both line 9 and line 10 are already rounded at their derivation sites — `roundMoney` here is defensive normalization. `roundMoney(null) → null` (canonical contract).'],
  [5, 'Set line 11b = line 11a (IRS copy line)', 'No separate computation per spec §2.2. Validation rule (spec §7.2): line11b MUST equal line11a exactly. Same BigDecimal reference, no transformation.'],
  [6, 'Gate output via `(line10 == null && line11a == null)` short-circuit', 'When both null → return null Adjustments (no AGI persisted). This permits the Form 1040 cell to render blank rather than $0 when no income/adjustments exist.'],
  [7, 'Persist all 3 fields on the Adjustments output object', '`setLine11aAdjustedGrossIncome(line11a)` (canonical) + `setLine11bAmountFromLine11aAdjustedGrossIncome(line11b)` (carry-forward) + `setAdjustedGrossIncome(line11a)` (LEGACY alias per knowledge §6 G1 tech-debt).'],
  [8, 'Flow to PDF export', 'PDF: `f1_75[0]` = `line11a_adjusted_gross_income` (page 1, canonical per CSV row 89); `f2_01[0]` = `line11b_adjusted_gross_income_repeat` (page 2, canonical per CSV row 150).'],
  [9, 'Flow downstream to deductions / QBI / taxable income / tax / credits', 'Line 11b → line 12e (dependent standard-deduction worksheet) + line 13a (QBI taxable-income limits) + Schedule 1-A line 13b (tips/overtime/senior MAGI base) + line 15 (= max(0, line11b − line14)) + Schedule 8812 CTC phaseout + Form 8863 MAGI + Form 8880 saver\'s + Form 8959 + EIC thresholds. Line 11a → Schedule A medical-expense floor (7.5% × AGI) + Form 6251 AMT (via legacy `adjustedGrossIncome`) + Form 8962 PTC via `computeScheduleAgi()` helper.'],
  [],
  ['MUTUAL EXCLUSION / SPECIAL RULES'],
  ['Rule', 'Implementation', 'Why'],
  ['Line 11a = exact two-operand subtraction `line9 - line10`', 'Single `subtractNonNegativeAllowNegative` call at line 4395; no transformation beyond `roundMoney`.', 'Per IRS 2025 Form 1040 line 11a instructions verbatim.'],
  ['Line 11a NOT floored at zero (signed result preserved)', '`subtractNonNegativeAllowNegative` (NOT `subtractNonNegative`) — explicit method name encodes the rule. Existing lock-in test `allowsNegativeAdjustedGrossIncomeOnForm1040Line11aAndLine11b` confirms.', 'Per spec §7.3 + §10 + §8.3 ("Do NOT apply line 15 zero-floor rule to line 11a or 11b"). NOL carryback (Form 1045) + refundable credit scenarios require negative AGI to be preserved.'],
  ['Line 11b = line 11a exactly (IRS copy-line invariant)', '`BigDecimal line11b = line11a;` at line 4399 — same BigDecimal reference; no transformation.', 'Per spec §2.2 + §7.2 (`if line11b != line11a → error LINE11B_MUST_EQUAL_LINE11A`).'],
  ['Line 11b is NOT a universal MAGI', 'Backend stores line 11a/11b as AGI only. Each downstream benefit computes its own MAGI from line11b plus benefit-specific add-backs (Pub. 590-A / 970 / 974 / 596 / etc.).', 'Per spec §5 ("Do NOT label line 11b as MAGI in code or UI; do NOT build one shared MAGI amount and reuse it everywhere"). Verification per 11a #9 observation.'],
  ['Line 11a site does NOT have its own MFS guard', 'Line 11a = inline compute in `buildAdjustments`; not a separate orchestrator. All upstream feeders (line 9 → 13 income orchestrators; line 10 → `computeIncomeAdjustments` via 10 #1) are MFS-protected.', '**Inherits MFS protection** from the 14-orchestrator cascade. Same structural pattern as line 9 (per 9 #1). Verified per 11a #1 observation.'],
  ['Output gating: return null Adjustments when both line10 AND line11a are null', '`if (line10 == null && line11a == null) return null;` at lines 4400-4402.', 'When the return has no income (line 9 null AND no adjustments) the Adjustments object is suppressed so the Form 1040 cells render blank rather than $0.'],
  ['Legacy `adjustedGrossIncome` field set redundantly', '`adjustments.setAdjustedGrossIncome(line11a)` at line 4406 — always identical to line11a.', 'Knowledge §6 G1 tech-debt — some downstream callers (Form 6251 AMT at line ~8200; Schedule A at line ~2946) still read `getAdjustedGrossIncome()` instead of `getLine11aAdjustedGrossIncome()`. Functionally correct (same value) but creates name-of-field confusion. Could be a future cleanup migration.'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 11a/11b Flows'],
  ['Consumer', 'How', 'Notes'],
  ['Form 1040 line 15 (taxable income) — ★★ PRIMARY DOWNSTREAM', '`line15 = max(0, line11b - line14)` per future line 15 audit.', '★★ CRITICAL: line 11b is the taxable-income base BEFORE deductions. Line 15 IS floored at zero (unlike line 11a/11b).'],
  ['Form 1040 line 13a (QBI deduction)', '`taxableIncomeBeforeQbi = line11b - line12e - line13b`; QBI threshold comparison.', 'Per future line 13a audit. Uses `getLine11bAmountFromLine11aAdjustedGrossIncome()`.'],
  ['Form 1040 line 13b (Schedule 1-A; tips/overtime/senior)', '`Schedule1A_MAGI = line11b + Form2555[45+50] + Form4563[15] + PR exclusion`.', 'Per future line 13b / Schedule 1-A audit.'],
  ['Form 1040 line 12e (standard deduction — dependent worksheet)', 'Dependent earned-income ceiling computed from AGI.', 'Per future line 12e audit.'],
  ['Schedule A (itemized deductions)', '`scheduleA.adjustedGrossIncome = line11a` (via legacy `getAdjustedGrossIncome()` at line ~2946); medical-expense floor = 7.5% × AGI.', '**Uses LEGACY `adjustedGrossIncome` field** per knowledge G1 tech-debt.'],
  ['Schedule 8812 (CTC/ACTC)', '`line11b` — phaseout starts at $400k MFJ / $200k others.', 'Per future Schedule 8812 audit.'],
  ['Form 8863 (AOTC/LLC)', '`MAGI = line11b + Form 2555 exclusion`; phaseout $80k–$90k Single / $160k–$180k MFJ.', 'Per future Form 8863 audit.'],
  ['Form 8962 (Premium Tax Credit)', 'Via `computeScheduleAgi()` helper which reads `getLine11aAdjustedGrossIncome()` (preferred) → fallback to `getLine11b...`.', 'Per future Form 8962 audit.'],
  ['Form 6251 (AMT)', '`getAdjustedGrossIncome()` at line ~8200 — uses LEGACY field (knowledge G1).', 'Future Form 6251 audit will migrate to `getLine11aAdjustedGrossIncome()`.'],
  ['EIC (line 27a) + Form 8880 Saver\'s Credit + Form 8959', '`line11b` — various AGI-based thresholds.', 'Per future EIC / 8880 / 8959 audits.'],
  ['NOT IN OUTPUT — Line 11a/11b not in line 9', '—', 'Line 11a is the OUTPUT of `line9 - line10`, not an input to line 9.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 28 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 11a'],
  ['Line 11a has 2 NUMERIC inputs (line 9 + line 10). No personal-form inputs at the line 11a site — all input flows through upstream feeders.'],
  [],
  ['#', 'Source line', 'Field', 'IRS line', 'Required?', 'Role', 'Cross-reference'],
  [1, 'Form 1040 line 9', 'line9 (total income)', 'Line 9', 'YES (or null → line 11a null)', 'Minuend; 1st operand', 'Line-9 13-audit consolidation FINAL at TaxReturnComputeService.java:4139-4222'],
  [2, 'Form 1040 line 10', 'line10 (adjustments to income from Schedule 1 line 26)', 'Line 10', 'Optional (null → treated as 0; line11a = line9)', 'Subtrahend; 2nd operand', '10 #7 pure pass-through verified; Schedule 1 line 26 per 10 #5 + line 25 per 10 #6'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 26 }, { wch: 55 }, { wch: 12 }, { wch: 40 }, { wch: 25 }, { wch: 80 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 11a'],
  [],
  ['No direct numeric reference-data constants for line 11a — it is a pure subtraction formula. **All thresholds related to AGI live in downstream consumers** (CTC phaseout, AOTC MAGI, EIC, etc.), NOT at the line 11a site itself.'],
  [],
  ['Statutory references'],
  ['§62 (Adjusted Gross Income framework)', 'IRC §62', 'YES — all of line 11a/11b', 'Defines AGI as gross income minus above-the-line adjustments enumerated in §62(a).'],
  ['§63 (Taxable Income framework)', 'IRC §63', 'INDIRECT — line 15 = AGI − deductions', 'Taxable income is downstream of AGI; defines the line 15 base computation.'],
  ['§1402 (NOL carryback rules)', 'IRC §1402 / Form 1045', 'INDIRECT — negative AGI scenarios', 'Negative AGI on line 11a enables NOL carryback via Form 1045; signed-result preservation per spec §7.3.'],
  ['Pub. 590-A (Roth IRA / Trad IRA MAGI add-backs)', 'IRS Pub. 590-A', 'DOWNSTREAM (NOT line 11a)', 'IRA-deduction MAGI = line11b + IRA deduction itself + student-loan-interest deduction. Per-benefit MAGI compute.'],
  ['Pub. 970 (Education credits / student loan interest)', 'IRS Pub. 970', 'DOWNSTREAM (NOT line 11a)', 'AOTC/LLC MAGI = line11b + Form 2555 exclusion. Student loan interest MAGI = line11b + student loan deduction.'],
  ['Pub. 974 (Premium Tax Credit)', 'IRS Pub. 974', 'DOWNSTREAM (NOT line 11a)', 'Form 8962 PTC MAGI add-backs.'],
  ['Pub. 596 (EIC)', 'IRS Pub. 596', 'DOWNSTREAM (NOT line 11a)', 'EIC uses AGI directly (no MAGI add-backs); investment income ceiling + AGI ceiling per filing status.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 25 }, { wch: 45 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 11a + Line 11b'],
  ['Line 11a is computed inline at `buildAdjustments` and persists 3 fields on the Adjustments output object (canonical line11a + carry-forward line11b + legacy `adjustedGrossIncome` alias).'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.adjustments.line11aAdjustedGrossIncome', '`adjustments.setLine11aAdjustedGrossIncome(line11a)` at line ~4404', '★ CANONICAL line 11a output. PDF: f1_75[0] = `line11a_adjusted_gross_income` (canonical per CSV row 89). Signed; whole-dollar HALF_UP.'],
  ['form1040.adjustments.line11bAmountFromLine11aAdjustedGrossIncome', '`adjustments.setLine11bAmountFromLine11aAdjustedGrossIncome(line11b)` at line ~4405', '★ CANONICAL line 11b output. PDF: f2_01[0] = `line11b_adjusted_gross_income_repeat` (canonical per CSV row 150). Same BigDecimal reference as line11a.'],
  ['form1040.adjustments.adjustedGrossIncome', '`adjustments.setAdjustedGrossIncome(line11a)` at line ~4406', '⚠️ LEGACY ALIAS — same value as line11a. Backward compatibility for callers that read `getAdjustedGrossIncome()` (Form 6251 AMT + Schedule A). Knowledge §6 G1 tech-debt.'],
  ['Form 1040 line 15 (taxable income) — ★★ CRITICAL', '`line15 = max(0, line11b - line14)` per future line 15 audit.', '★★ Primary downstream; future line 15 audit.'],
  ['Form 1040 line 13a/13b (QBI + Schedule 1-A)', 'line 13a uses line11b for taxable-income base; Schedule 1-A line 13b uses line11b as MAGI base + add-backs.', 'Per future line 13a/13b audits.'],
  ['Schedule A (medical-expense floor + sales-tax worksheet)', 'Uses `getAdjustedGrossIncome()` legacy field.', 'Per future Schedule A audit.'],
  ['Form 6251 AMT', 'Uses `getAdjustedGrossIncome()` legacy field at line ~8200.', 'Per future Form 6251 audit.'],
  ['Form 8962 PTC', 'Via `computeScheduleAgi()` helper which prefers `getLine11aAdjustedGrossIncome()`.', 'Per future Form 8962 audit.'],
  ['Schedule 8812 CTC + Form 8863 AOTC/LLC + Form 8880 Saver\'s + Form 8959 + EIC', 'All read `getLine11bAmountFromLine11aAdjustedGrossIncome()` for AGI threshold tests.', 'Per future audits.'],
  [],
  ['BLOCKING / ADVISORY FLAGS'],
  ['(None at line 11a site)', 'N/A', 'Line 11a is a pure two-operand subtraction; no validation logic.', 'Spec §7.1 mentions MISSING_LINE9 + MISSING_LINE10 errors but backend currently emits these via upstream orchestrators, not at line 11a site.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Universal MAGI field', '—', 'Per spec §5 + §8.3: line 11b is NOT a universal MAGI; do NOT create one shared MAGI field. Each benefit computes its own MAGI from line11b + benefit-specific add-backs.'],
  ['Form 1040 line 9 (total income)', '—', 'Line 9 is an INPUT to line 11a, not an output.'],
  ['Form 1040 line 15 (taxable income) — DIRECT', '—', 'Line 15 is computed at its own site (future line 15 audit); line 11a does not directly write to line 15.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 11a-Related'],
  ['No line-11a-specific BLOCKING flags. All validation happens at upstream feeders (line 9 + line 10 orchestrators).'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['(None at line 11a site)', 'N/A', 'Line 11a is a pure subtraction; no validation logic.', 'Spec §7.1 names MISSING_LINE9 + MISSING_LINE10 + LINE11B_MUST_EQUAL_LINE11A as conceptual rules but backend currently relies on upstream-orchestrator flags + the structural invariant `BigDecimal line11b = line11a;` (same reference, no copy operation).'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 11a is the **AGI computation line** — a pure two-operand subtraction `line9 - line10` with signed-result semantic (NOT floored at zero per spec §7.3). **SECOND audit in AGI-territory** + **FIRST tightly-coupled-pair audit since 7ab completion**. The 10 #4 forward-cross-reference breadcrumb at `buildAdjustments` seeded yesterday is EXTENDED today with line-11a-specific documentation. Verified 2026-05-12.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-13 — CROSS-REFERENCE — NO MFS GUARD NEEDED AT LINE 11a SITE (inherits from 14 upstream orchestrators)', 'Line 11a is computed inline in `buildAdjustments()` at TaxReturnComputeService.java:~4386 — NOT a separate orchestrator method. No `isMfsReturn` parameter needed at the line 11a site. **MFS protection inherited from 14 upstream orchestrators**: line 9 via 13 income orchestrators (1c-1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities + computeSocialSecurityBenefits + computeCapitalGainLoss + computeOtherIncomes) + line 10 via `computeIncomeAdjustments` (added 2026-05-12 via 10 #1 — codebase max). When MFS is set, each upstream feeder produces taxpayer-only values; line 11a `line9 - line10` is automatically taxpayer-only via the inline subtraction. Spouse data cannot leak in because it was already excluded at the operand level. **STRUCTURALLY SIMILAR to 9 #1** (line 9 inline + inherits from 13 feeders) — line 11a inline + inherits from 14 feeders. **SECOND defensive-gap-NOT-needed Issue #1 in the workflow** (after 9 #1); all 29 other line audits had Issue #1 as either HIGH-PRIORITY defensive gap fix OR cascade citation extension. **Closure**: pure xlsx-flip cross-reference. No code change. The 10 #4 forward-cross-reference breadcrumb above `buildAdjustments` (seeded 2026-05-12) implicitly documents inherited-MFS-protection via per-operand citations; line 11a audit will extend that breadcrumb with line-11a-specific details via Issue #4 (NOT via a separate MFS breadcrumb).', 'TaxReturnComputeService.java:~4386 (`buildAdjustments` body); MFS guards inherited from 14 upstream orchestrators', 'CLOSED — observation. NO code change. SECOND defensive-gap-NOT-needed Issue #1 in the audit workflow.'],
  [2, 'RESOLVED 2026-05-13 — DOCUMENTATION HYGIENE — KNOWLEDGE FILE RENAME (Legacy A underscore prefix → canonical)', '`knowledge/knowledge_line11ab.md` used the Legacy A underscore-prefix form. **Closure applied**: (1) renamed `knowledge/knowledge_line11ab.md` → `knowledge/line-11ab-agi.md` (canonical form); (2) updated generator header-comment reference at `generate-11a.js` line 7; (3) updated forward reference in `lines/11ab.md` line 12 (the "Implementation status" footnote) to point at the renamed canonical file; (4) grep verified inbound references: `generate-11a.js` (updated) + `lines/11ab.md` (updated) + historical `history.md` mentions (not renamed — history entries are immutable chronological records). **FIFTH Legacy A migration** (after 7a #2 + 8 #2 + 9 #2 + 10 #2 — all done 2026-05-12). **Knowledge-file naming convergence extends to 18 lines** (1c-1i + 1z + 2ab + 3ab + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + **11ab**). Remaining Legacy A files (3): knowledge_line16/17/26/27abc.md.', 'C:\\us-tax\\knowledge\\line-11ab-agi.md (renamed); C:\\us-tax\\XLS\\_tools\\generate-11a.js header (updated); C:\\us-tax\\lines\\11ab.md line 12 (updated)', 'CLOSED — file renamed + generator updated + spec forward-reference updated. Convergence at 18 lines.'],
  [3, 'RESOLVED 2026-05-13 — SPEC ENHANCEMENT — VERIFICATION LOG SECTION CREATED IN lines/11ab.md (NORMAL-variant pattern; pair-aligned first row)', '`lines/11ab.md` did NOT have a Verification log section. **Closure applied**: appended a new `## Verification log` section at end of file with 1 row in IN-PROGRESS state capturing the 11a walkthrough (will accumulate Issues #1-#10 outcomes; finalized to "COMPLETE — 10/10 closed" at end of walkthrough). **NEW section creation — NORMAL-variant pattern** (same as 7a #3 cluster-start). **Pair-aligned first row** — line 11b sibling audit will append a 2nd row (final log shape: 2 rows; SMALLEST pair-aligned shape parallel to 7ab). **FIRST pair-aligned Verification log creation since 7ab #3** (2026-05-12) — all intervening audits (8, 9, 10) were single-line (single-row logs). Contrast with 8 #3 / 9 #3 / 10 #3 single-row single-line audit logs (final shape: 1 row); 11a #3 is the first row of an eventual 2-row pair log.', 'lines/11ab.md (new Verification log section with single 11a-audit row; line 11b sibling will append 2nd row)', 'CLOSED — spec verification log section created. First pair-aligned Verification log since 7ab #3.'],
  [4, 'RESOLVED 2026-05-13 — CROSS-REFERENCE — EXTENDED 10 #4 FORWARD-CROSS-REFERENCE BREADCRUMB WITH LINE-11a-SPECIFIC DETAILS', 'The 10 #4 forward-cross-reference breadcrumb at TaxReturnComputeService.java:~4372 (above `buildAdjustments`) was seeded 2026-05-12 as the **FIRST subtractor cross-reference in the workflow** with a placeholder note that future line 11 audit would extend with full AGI documentation. **This audit IS that extension**. **Closure applied**: extended the 10 #4 breadcrumb from 12 lines to **~50 lines** with line-11a-specific details organized in 7 thematic sections: (1) header note updated to "10 #4, 2026-05-12; EXTENDED 11a #4, 2026-05-13"; (2) LINE 11a SIGNED SEMANTIC — formula + minuend/subtrahend identification + `subtractNonNegativeAllowNegative` vs `subtractNonNegative` contrast + lock-in test reference; (3) NULL-GUARD AND OUTPUT GATING — explains `line9 == null` short-circuit + `line10 == null` → treated-as-zero + `(line10 == null && line11a == null) → return null` Adjustments-suppression; (4) LINE 11b IRS COPY-LINE INVARIANT — same-BigDecimal-reference (not value-copy) + new lock-in test cross-reference to 11a #7; (5) LEGACY ALIAS — knowledge §6 G1 tech-debt note + Form 6251 / Schedule A callers; (6) MAGI vs AGI GUARDRAIL — folds in 11a #9 observation + `grep magi` compliance verification + downstream Schedule 1-A / Form 8863 / Form 8962 audits; (7) DOWNSTREAM CONSUMERS enumeration; (8) CROSS-REFERENCE PRECEDENT explicit note — line 11b sibling audit will extend ONCE MORE with page-2 PDF field details (`f2_01[0]` / `line11b_adjusted_gross_income_repeat` per CSV row 150). **FIRST cross-reference EXTENSION by a downstream audit in the workflow** — validates the seed → extend template established by 10 #4 for future analogous patterns (line 14 deductions subtractor for line 15; line 13a/13b QBI + additional deductions; etc.). Pure documentation extension — no functional change.', 'TaxReturnComputeService.java:~4372-4435 (extended 10 #4 breadcrumb — now ~50 lines)', 'CLOSED — 10 #4 breadcrumb extended. First cross-reference EXTENSION by a downstream audit; validates the seed → extend template.'],
  [5, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — `subtractNonNegativeAllowNegative(line9, line10)` (signed-result semantic; folded into 10 #4 extension)', 'At TaxReturnComputeService.java:~4444: `BigDecimal line11a = line9 == null ? null : roundMoney(subtractNonNegativeAllowNegative(line9, line10));`. **Method name encodes the rule** — `subtractNonNegativeAllowNegative` (as opposed to `subtractNonNegative` which floors to zero). Three verification points: (a) null-guard on line 9 (no NPE when no income); (b) line 10 null → treated as 0 → line11a = line9; (c) sign-preserving (negative result valid). **Closure**: pure xlsx-flip affirmative verification — formula is canonical per IRS 2025 line 11a instructions ("Subtract line 10 from line 9. This is your adjusted gross income"). Coverage folded into the **extended 10 #4 breadcrumb** at TaxReturnComputeService.java:~4372-4435 under the "LINE 11a SIGNED SEMANTIC" section per 11a #4: formula + minuend/subtrahend identification + `subtractNonNegativeAllowNegative` vs `subtractNonNegative` contrast + lock-in test reference (`allowsNegativeAdjustedGrossIncomeOnForm1040Line11aAndLine11b`). **NO new breadcrumb at the formula site itself** — would duplicate the 10 #4 extension. Affirmative-verification audit-trail row pattern (same shape as 9 #5 affirmative-verification). Anti-duplication policy applied — content covered ONCE in the cross-reference breadcrumb rather than twice (10 #4 + line 11a site).', 'TaxReturnComputeService.java:~4372-4435 (extended 10 #4 breadcrumb — "LINE 11a SIGNED SEMANTIC" section per 11a #4)', 'CLOSED — verified correct. Coverage folded into 10 #4 extension; no duplicate breadcrumb at formula site.'],
  [6, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — LINE 11a NOT ARTIFICIALLY FLOORED AT ZERO (negative AGI supported per spec §7.3)', 'Per spec §7.3 + §10 + §8.3 ("Do NOT apply line 15 zero-floor rule to line 11a or 11b"). Code uses `subtractNonNegativeAllowNegative` (NOT `subtractNonNegative` which floors). **Three sources of negative AGI**: (a) line 9 is negative (line 1f adoption / line 4b rollover / line 7a capital loss capped at -$3,000 / -$1,500 MFS per IRC §1211(b) / line 8 NOL or §461(l) — per 1z #8 + 9 #6); (b) line 9 small + line 10 large (e.g., line 9 = $5,000 + line 10 = $7,000 → line 11a = -$2,000); (c) both negative (rare). **Downstream consequences**: negative AGI enables NOL carryback via Form 1045 + refundable-credit scenarios + signed-result preservation through line 11b (copy-line invariance). **Existing lock-in test coverage**: `allowsNegativeAdjustedGrossIncomeOnForm1040Line11aAndLine11b` (knowledge §5) already verifies (large line 10 > line 9 → negative line 11a/11b without zero-flooring). **Closure**: pure xlsx-flip affirmative verification — formula correct, test coverage exists. **NO new breadcrumb** at line 11a site — coverage is canonical and verified via THREE sources: (1) existing inline comment at the formula site ("The 2025 form does not force zero-flooring here, so preserve negative results."); (2) extended 10 #4 breadcrumb (per 11a #4) under "LINE 11a SIGNED SEMANTIC" — explicitly cites the rule + lock-in test reference; (3) existing lock-in test exercised by smoke tests. Affirmative-verification audit-trail pattern (same shape as 9 #6 not-floored-at-zero verification + 11a #5). Anti-duplication policy applied.', 'TaxReturnComputeService.java:~4444 (existing inline comment) + ~4372-4435 (extended 10 #4 breadcrumb per 11a #4 + 11a #5); existing test `allowsNegativeAdjustedGrossIncomeOnForm1040Line11aAndLine11b`', 'CLOSED — verified correct. No new breadcrumb (covered by 10 #4 extension + inline comment + existing test).'],
  [7, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — LINE 11b = LINE 11a IRS COPY-LINE INVARIANT (closes knowledge G3 with new lock-in test)', 'At TaxReturnComputeService.java:~4448: `BigDecimal line11b = line11a;` — **same BigDecimal reference**, no transformation. Per IRS 2025 line 11b instructions verbatim ("Amount from line 11a (adjusted gross income)") + spec §2.2 + §7.2 ("if Form1040.line11b != Form1040.line11a → error LINE11B_MUST_EQUAL_LINE11A"). **Knowledge §6 G3 identified gap**: "No unit test explicitly asserting both 11a=11b always (invariant test)." **Closure applied**: NEW lock-in test `line11bAlwaysEqualsLine11aInvariant` with 3 scenarios — (1) **Positive AGI** ($50k wages, $0 adjustments → 11a=11b=$50,000); (2) **Negative AGI** ($5k wages, $7k educator → 11a=11b=-$2,000; validates sign-preserving copy-line invariance); (3) **Null AGI** (no income, no adjustments → Adjustments object null via `(line10 == null && line11a == null) return null` short-circuit). Closes knowledge §6 G3. Backend regression: **758 → 759** (+1 from new lock-in test). **NO new breadcrumb at line 4448** — coverage already in extended 10 #4 breadcrumb (per 11a #4) under "LINE 11b IRS COPY-LINE INVARIANT" section (same-reference vs value-copy implementation note + forward reference to this lock-in test). Anti-duplication policy applied. The test is the artifact.', 'TaxReturnComputeService.java:~4448 (`BigDecimal line11b = line11a;`); new test `line11bAlwaysEqualsLine11aInvariant` at TaxReturnComputeServiceTest.java; extended 10 #4 breadcrumb (per 11a #4) covers documentation', 'CLOSED — verified correct. Closes knowledge G3 with 3-scenario lock-in test; backend 758 → 759. Documentation in extended 10 #4 breadcrumb (anti-duplication).'],
  [8, 'RESOLVED 2026-05-13 — DOCUMENTATION DRIFT FIX — Knowledge file PDF claims STALE (G4 + §3 + §8 PDF map)', 'Knowledge §3 + §6 G4 + §8 all claimed: PDF field is `f1_77[0]` with CSV label `line11_adjusted_gross_income` (NO `a` suffix); §6 G4 framed this as a "naming inconsistency" gap. **All three claims were STALE** — verified by CSV inspection: row 89 actually has `f1_75[0]` (NOT `f1_77[0]`) and semantic key `line11a_adjusted_gross_income` (WITH the `a` suffix). The CSV has been canonical at least as long as has been verified today; G4 was either fixed in an earlier audit without updating the knowledge file, or the original observation was simply incorrect. **Closure applied** (3 updates to `knowledge/line-11ab-agi.md`): (1) §3 frontend section — corrected PDF field/CSV-label claims + replaced the "naming inconsistency" note with a canonical-verification note citing CSV row 89 + 150; (2) §6 G4 — struck through the original gap text + marked **"FALSE POSITIVE — verified canonical 2026-05-13 via 11a #8"** with rationale; (3) §8 PDF field map — corrected `f1_77[0]` → `f1_75[0]` + `line11_adjusted_gross_income` → `line11a_adjusted_gross_income` + added CSV row column (89 / 150) for grep-locatability + added a header note citing the canonical-verification. **Bonus closure in same file**: §6 G3 also struck through and marked **"RESOLVED 2026-05-13 via 11a #7"** (line11bAlwaysEqualsLine11aInvariant lock-in test). Pure documentation closure — no code change.', 'C:\\us-tax\\knowledge\\line-11ab-agi.md §3 (line 81-82 corrected) + §6 G3 (resolved) + §6 G4 (false-positive) + §8 PDF map (corrected with CSV row column); CSV rows 89 + 150 are canonical', 'CLOSED — knowledge file PDF claims corrected at 3 sites (§3 + §6 G4 + §8) + G3 also marked resolved.'],
  [9, 'RESOLVED 2026-05-13 — OBSERVATION — LINE 11b IS NOT A UNIVERSAL MAGI (per spec §5 + §8.3; compliance verified)', 'Per spec §5 + §8.3 + §10: "Do NOT label line 11b as MAGI in code or UI; do NOT build one shared MAGI amount and reuse it everywhere; 11b is still AGI, not MAGI." Each downstream benefit has its own MAGI definition with benefit-specific add-backs (Schedule 1-A: line11b + Form 2555 + Form 4563 + PR exclusion; IRA deduction: line11b + IRA deduction itself + student loan; AOTC/LLC: line11b + Form 2555 exclusion; Form 8962 PTC: AGI via `computeScheduleAgi()`; EIC: AGI directly — no MAGI; etc.). **Verification applied**: grep for `magi` / `MAGI` in `Adjustments.java` returns NO MATCH — backend complies with the spec rule (verified 2026-05-13). **Closure**: pure xlsx-flip observation. Coverage already in the **extended 10 #4 breadcrumb** at TaxReturnComputeService.java:~4372-4435 under the "MAGI vs AGI GUARDRAIL" section (per 11a #4) — explicit spec §5 + §8.3 citation + compliance verification note + forward cross-references seeded for future Schedule 1-A line 13b audit + Form 8863 audit + Form 8962 audit (where per-benefit MAGI compute will happen). **NO new breadcrumb** — folded into 10 #4 extension. Anti-duplication policy applied (same pattern as 11a #5 + 11a #6). Audit-trail-completeness pattern.', 'C:\\us-tax\\us-tax-be\\src\\main\\java\\com\\ustax\\model\\output\\Adjustments.java (grep verified: no magi/MAGI); extended 10 #4 breadcrumb "MAGI vs AGI GUARDRAIL" section per 11a #4', 'CLOSED — observation. Backend complies; coverage in 10 #4 extension; no duplicate breadcrumb.'],
  [10, 'RESOLVED 2026-05-13 — OBSERVATION — LINE 11a IS THE SECOND AGI-TERRITORY AUDIT + FIRST TIGHTLY-COUPLED-PAIR AUDIT SINCE 7ab COMPLETION (line 11b sibling audit follows)', 'Pure xlsx-flip observation — **three major workflow milestones**: (1) **SECOND audit in AGI-territory** — line 10 was the first per 10 #10; line 11a is the second; pattern: each AGI-territory line audited in sequence (11a → 11b → 12a-e → 13a/13b → 14 → 15 → 16+). (2) **FIRST tightly-coupled-pair audit since 7ab pair completion 2026-05-12** — 11a starts the 11ab pair (line 11b sibling audit immediately next; same flow as 7a → 7b). Pair-aligned Verification log per Issue #3 will accumulate 2 rows (final shape parallel to 7ab — smallest pair-aligned log). (3) **FIRST cross-reference EXTENSION by a downstream audit in the workflow** (Issue #4) — extended 10 #4 forward-cross-reference breadcrumb from 12 lines → ~50 lines; validates the seed → extend template for future analogous patterns (line 14 will extend any breadcrumb seeded by 13a/13b; line 15 will extend any breadcrumb seeded by 14; etc.). **Cumulative through line 11a**: 31 lines audited; 307 issues closed total; backend 758 → **759** (+1 from line 11b copy-line invariant lock-in test `line11bAlwaysEqualsLine11aInvariant`); MFS-guard cascade = 14 orchestrators (unchanged — line 11a inherits from 14 upstream feeders); knowledge-file naming convergence = **18 lines** (extended via 11a #2; 5th Legacy A migration; 3 Legacy A files remain at knowledge_line16/17/26/27abc.md). **TWO knowledge gaps closed in `line-11ab-agi.md`**: G3 (no invariant test) via 11a #7; G4 (false-positive PDF naming "gap") via 11a #8. **ZERO new outstanding.md entries** in 11a walkthrough. **Anti-duplication policy applied 3 times** (11a #5 + 11a #6 + 11a #9 — coverage folded into extended 10 #4 breadcrumb rather than duplicated at formula site). **Closure**: pure xlsx-flip; this row is the audit-trail anchor for the milestone. **Looking ahead — line 11b sibling audit immediately next** (will complete the 11ab pair; final 2-row pair-aligned log; will extend 10 #4 breadcrumb ONCE MORE with page-2 PDF field details + page-2 placement notes), then line 12a-12e (deductions cluster — multi-row; potentially largest cluster after 6abcd), line 13a/13b (QBI + additional deductions pair), line 14 (total deductions composite), line 15 (taxable income; first audit with zero-floor rule), line 16+ (tax computation).', 'XLS/computations/11a.xlsx audit-trail (this row); no additional code change beyond Issue #7 lock-in test', 'CLOSED — pure xlsx-flip. 2nd AGI audit; 1st pair-audit since 7ab; first cross-reference extension; line 11b sibling audit next.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 100 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 11a Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.adjustments.line11aAdjustedGrossIncome', 'topmostSubform[0].Page1[0].f1_75[0] (line11a_adjusted_gross_income)', 'form-tax-return-1040.xlsx (line 11a cell)', '★ CANONICAL line 11a output. Whole-dollar HALF_UP rounded; signed.'],
  ['form1040.adjustments.line11bAmountFromLine11aAdjustedGrossIncome', 'topmostSubform[0].Page2[0].f2_01[0] (line11b_adjusted_gross_income_repeat)', 'form-tax-return-1040.xlsx (line 11b cell)', '★ CANONICAL line 11b output. Same BigDecimal reference as line11a (no transformation).'],
  ['form1040.adjustments.adjustedGrossIncome', '—', '—', '⚠️ LEGACY ALIAS. Same value as line11a. Read by Form 6251 AMT + Schedule A. Knowledge G1 tech-debt.'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 15 (taxable income)', '—', 'form-tax-return-1040.xlsx (line 15 cell)', '★★ line15 = max(0, line11b − line14). Future line 15 audit.'],
  ['Form 1040 line 13a (QBI deduction)', '—', '—', 'Uses line11b for taxable-income base + QBI threshold.'],
  ['Form 1040 line 13b (Schedule 1-A — tips/overtime/senior)', '—', '—', 'Schedule 1-A MAGI = line11b + Form 2555 + Form 4563 + PR exclusion.'],
  ['Schedule A (itemized)', '—', '—', 'Medical-expense floor 7.5% × AGI; uses `getAdjustedGrossIncome()` legacy field.'],
  ['Schedule 8812 (CTC/ACTC) + Form 8863 (AOTC/LLC) + Form 8962 (PTC) + Form 8880 + Form 8959 + EIC', '—', '—', 'Various AGI/MAGI threshold consumers per future audits.'],
  ['Form 6251 AMT', '—', '—', 'Reads `getAdjustedGrossIncome()` legacy field.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Universal MAGI field', '—', '—', 'Per spec §5 + §8.3: line 11b is NOT a universal MAGI. Per-benefit MAGI computed downstream.'],
  ['Form 1040 line 9 (total income)', '—', '—', 'Line 9 is an INPUT to line 11a, not an output.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 75 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
