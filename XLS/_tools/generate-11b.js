// ============================================================================
//  Generates: C:\us-tax\XLS\computations\11b.xlsx
//
//  Source-of-truth references:
//    - lines/11ab.md (2025 IRS-verified rule map for Form 1040 lines 11a + 11b;
//      shared spec — Verification log first row added 2026-05-13 via 11a #3;
//      this audit appends the 2nd and FINAL pair-aligned row)
//    - dependencies/11ab.md
//    - knowledge/line-11ab-agi.md (renamed 2026-05-13 via 11a #2 from legacy
//      knowledge_line11ab.md; §3 + §6 G3 + §6 G4 + §8 corrected 2026-05-13 via 11a #8)
//    - TaxReturnComputeService.buildAdjustments() at line ~4386 — inline compute;
//      10 #4 forward-cross-reference breadcrumb at ~4372 EXTENDED 2026-05-13 via
//      11a #4 to ~50 lines; line 11b audit will EXTEND ONCE MORE with page-2 details
//    - PDF semantic CSV row 150: f2_01[0] line11b_adjusted_gross_income_repeat (page 2 top)
//    - IRS 2025 Form 1040 line 11b instructions ("Amount from line 11a (adjusted
//      gross income)") — pure copy-line; no transformation
//    - Lock-in test `line11bAlwaysEqualsLine11aInvariant` added 2026-05-13 via 11a #7
//      (3 scenarios: positive / negative / null AGI)
//
//  Tax year: 2025
//
//  NOTE: Line 11b is a **pure IRS copy line** at TaxReturnComputeService.java:~4448:
//    BigDecimal line11b = line11a;
//  Same BigDecimal REFERENCE (not value-copy). Same-reference implementation means
//  line11b cannot drift from line11a — they ARE the same object. Per spec §2.2 + §7.2.
//
//  **Line 11b audit positioning** (pair-completion sibling of line 11a):
//   • THIRD audit in AGI-territory (after 10 + 11a)
//   • PAIR-COMPLETION audit — completes the 11ab pair (analogous to 7b after 7a)
//   • SECOND cross-reference EXTENSION by a downstream audit (after 11a #4 — the FIRST
//     such extension); validates seed → extend → extend-again pattern; **FIRST
//     double-extension of the SAME breadcrumb in the workflow** (10 #4 → 11a #4 → 11b #4)
//   • Knowledge file rename ALREADY DONE via 11a #2 — pair-mate cross-reference only
//   • Verification log section ALREADY CREATED via 11a #3 — this audit appends 2nd row
//     completing the pair-aligned log at 2 rows (smallest pair-aligned shape; matches 7ab)
//   • NO MFS guard needed — line 11b is same-reference to line 11a, which itself inherits
//     MFS protection from 14 upstream feeders; transitive inheritance
//   • NEW lock-in test ALREADY ADDED via 11a #7 (`line11bAlwaysEqualsLine11aInvariant`)
//     — pair-mate cross-reference only; no additional test
//
//  Line 11b audit angles:
//   • Pair-mate MFS cross-reference (smallest pair-citation cascade — 2 audits within
//     the 11ab pair; matches 7ab smallest-pair-cascade pattern)
//   • Pair-mate knowledge-file cross-reference (no additional migration)
//   • Verification log 2nd row append (completes pair-aligned 2-row log)
//   • Cross-reference DOUBLE-EXTENSION — extend 10 #4 with line-11b-specific page-2
//     details (PDF field `f2_01[0]` / `line11b_adjusted_gross_income_repeat` per CSV
//     row 150 + page-2 placement notes)
//   • Verified-correct on same-reference assignment (anti-duplication via 10 #4)
//   • Verified-correct on PDF mapping canonicalization (post-11a #8 drift fix)
//   • Verified-correct on existing lock-in test coverage (closed via 11a #7)
//   • Verified-correct on downstream consumer wiring (line 11b is preferred accessor
//     for line 12e + 13a + 13b + 15 + Schedule 8812 + Form 8863 + Form 8880 + Form 8959
//     + EIC; line 11a is preferred by Schedule A + Form 6251 + Form 8962)
//   • Pair-mate observation on MAGI vs AGI guardrail (already verified via 11a #9)
//   • Pair-completion + double-extension milestone
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '11b.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 11b — ADJUSTED GROSS INCOME (carry-forward; page 2)'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 11b (page 2, top)'],
  ['Concept', 'Page-2 carry-forward of AGI from line 11a. Pure IRS copy-line — repeats the AGI amount so downstream page-2 computations (line 12e standard deduction, line 13a QBI, line 13b Schedule 1-A MAGI base, line 15 taxable income) have an explicit accessor without crossing page boundaries. **THIRD audit in AGI-territory** (after line 10 + line 11a) and the **PAIR-COMPLETION sibling** of line 11a (analogous to 7b after 7a).'],
  ['Core invariant', '`Form1040.line11b = line11a` exactly (IRS copy-line invariant per spec §2.2 + §7.2). Same BigDecimal REFERENCE — not a value-copy. Cannot drift from line11a (they ARE the same object). NOT floored at zero — sign-preserving (negative AGI from line 11a propagates verbatim). NOT a universal MAGI — downstream per-benefit MAGI computed separately (per spec §5; backend complies per 11a #9 verification).'],
  ['Per-Return Formula',
    'INLINE COMPUTATION at TaxReturnComputeService.buildAdjustments() (~line 4448):\n' +
    '  BigDecimal line11b = line11a;\n' +
    '  ...\n' +
    '  adjustments.setLine11bAmountFromLine11aAdjustedGrossIncome(line11b);\n\n' +
    '**Single assignment statement** — no transformation, no method call, no rounding\n' +
    '(line 11a is already rounded at line 4447 via `roundMoney`). The same-reference\n' +
    'implementation means `line11b == line11a` is always TRUE (reference equality);\n' +
    '`line11b.equals(line11a)` is always TRUE (value equality, trivially); the\n' +
    'BigDecimal cannot drift because there is only one object.\n\n' +
    '**Per IRS 2025 Form 1040 line 11b instructions** (verbatim):\n' +
    '  "Amount from line 11a (adjusted gross income)"\n\n' +
    'No worksheet, no separate computation, no exceptions. Pure carry-forward.'],
  ['Filed', 'Form 1040 line 11b (page 2, top of page) — PDF field `f2_01[0]` = `line11b_adjusted_gross_income_repeat` (canonical per CSV row 150; verified 2026-05-13 via 11a #8 drift fix + 11b #6).'],
  ['Backend method', '**No dedicated orchestrator** — line 11b is computed inline in `buildAdjustments()` (line ~4448) immediately after line 11a. No MFS guard at the line 11b site itself; **transitively inherits MFS protection** from line 11a, which inherits from 14 upstream feeders (13 income orchestrators for line 9 + `computeIncomeAdjustments` for line 10). Same structural pattern as line 11a (per 11a #1) + line 9 (per 9 #1).'],
  ['Output', 'form1040.adjustments.line11bAmountFromLine11aAdjustedGrossIncome (BigDecimal — signed, identical reference to line11a). Whole-dollar HALF_UP rounding inherited from line 11a (line 11b does NOT re-round). Page-2 PDF placement at `f2_01[0]`.'],
  ['IRS source', 'IRS 2025 Form 1040 line 11b instructions ("Amount from line 11a (adjusted gross income)") + lines/11ab.md spec §2.2 + §7.2 (validation rule: line11b MUST equal line11a) + §5 (NOT a universal MAGI).'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Compute line 11a via the inline subtraction at `buildAdjustments` (per 11a #5)', '`line11a = roundMoney(subtractNonNegativeAllowNegative(line9, line10))` with null-guard on line 9. Signed; not floored at zero.'],
  [2, 'Assign `BigDecimal line11b = line11a;` (same-reference)', 'Single Java assignment — no transformation. The reference equality `line11b == line11a` is always TRUE; structurally impossible to drift. Per spec §2.2 + §7.2.'],
  [3, 'Output gating: return null Adjustments when both line10 AND line11a are null', 'Same gate as line 11a — when both null, the entire Adjustments object is suppressed (line 11b inherits null state through same-reference; no separate gate needed).'],
  [4, 'Persist on Adjustments output object', '`adjustments.setLine11bAmountFromLine11aAdjustedGrossIncome(line11b)` at line ~4459. Output JSON field `line11bAmountFromLine11aAdjustedGrossIncome`.'],
  [5, 'Flow to PDF export (page 2)', 'PDF: `f2_01[0]` = `line11b_adjusted_gross_income_repeat` (canonical per CSV row 150). Page-2 placement at top of form, immediately above line 12 (standard/itemized deduction).'],
  [6, 'Flow downstream to deductions / QBI / taxable income / credits', 'line 11b is the PREFERRED accessor for: line 12e (standard deduction dependent worksheet) + line 13a (QBI taxable-income base) + line 13b (Schedule 1-A MAGI base + add-backs) + line 15 (taxable income = max(0, line11b − line14)) + Schedule 8812 CTC phaseout + Form 8863 AOTC/LLC MAGI + Form 8880 saver\'s + Form 8959 + EIC.'],
  [],
  ['MUTUAL EXCLUSION / SPECIAL RULES'],
  ['Rule', 'Implementation', 'Why'],
  ['Line 11b = line 11a (IRS copy-line invariant)', 'Same-reference Java assignment `BigDecimal line11b = line11a;` at line ~4448. No transformation, no rounding (line 11a already rounded), no method call.', 'Per spec §2.2 + §7.2. Reference equality means the two cannot drift — same object. Lock-in test `line11bAlwaysEqualsLine11aInvariant` (added 11a #7) covers 3 scenarios.'],
  ['Line 11b is NOT a separate MAGI field', 'Backend stores line 11b as AGI-only (no `magi` field on Adjustments). Per spec §5 + §8.3 + §10. Backend complies — `grep magi/MAGI` in Adjustments.java empty (verified 11a #9).', 'Each downstream benefit computes its own MAGI from line11b + benefit-specific add-backs (Schedule 1-A / IRA / AOTC/LLC / PTC / CTC / Roth / EIC — each different). NO universal MAGI exists.'],
  ['Line 11b is the PREFERRED accessor for most downstream consumers', 'Per knowledge §2 / dependencies §6.1: line 12e + 13a + 13b + 15 + Schedule 8812 + Form 8863 + Form 8880 + Form 8959 + EIC all read `getLine11bAmountFromLine11aAdjustedGrossIncome()`.', 'Page-2 consumers logically read the page-2 AGI repeat. Functionally identical to line 11a since values are equal, but the accessor choice matches the IRS form\'s page-locality intent.'],
  ['Line 11a is the PREFERRED accessor for a subset of consumers', 'Schedule A (medical-expense floor; uses legacy `adjustedGrossIncome`); Form 6251 AMT (uses legacy `adjustedGrossIncome`); Form 8962 PTC (uses `computeScheduleAgi()` helper which prefers `getLine11aAdjustedGrossIncome()`).', 'These callers either use the LEGACY `adjustedGrossIncome` field (knowledge §6 G1 tech-debt) or have helper methods that prefer line 11a. Result is identical (same value); accessor-choice asymmetry is knowledge §5 G5 (future cleanup).'],
  ['Line 11b NOT floored at zero (signed result preserved)', 'Line 11b inherits sign from line 11a via same-reference. Line 11a uses `subtractNonNegativeAllowNegative` (NOT zero-flooring). Per spec §7.3 + §10 + §8.3.', 'Line 15 IS floored at zero at its own site, but lines 11a/11b are not. Lock-in test `allowsNegativeAdjustedGrossIncomeOnForm1040Line11aAndLine11b` covers.'],
  ['Line 11b site does NOT have its own MFS guard', '`BigDecimal line11b = line11a;` — same-reference assignment. Line 11b inherits MFS protection TRANSITIVELY from line 11a, which inherits from 14 upstream feeders.', 'Transitive inheritance through 2 levels (line 11b → line 11a → 14 upstream orchestrators). No separate guard needed.'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 11b Flows (PREFERRED accessor)'],
  ['Consumer', 'How', 'Notes'],
  ['Form 1040 line 12e (standard deduction)', 'Dependent earned-income ceiling computed from `getLine11bAmountFromLine11aAdjustedGrossIncome()`.', 'Per future line 12e audit.'],
  ['Form 1040 line 13a (QBI deduction) — ★★ PRIMARY', '`taxableIncomeBeforeQbi = line11b - line12e - line13b`; QBI threshold comparison ($394,600 MFJ / $197,300 others).', '★★ Critical: QBI taxable-income base reads line 11b directly. Per future line 13a audit.'],
  ['Form 1040 line 13b (Schedule 1-A) — ★★ PRIMARY MAGI BASE', '`Schedule1A_MAGI = line11b + Form2555[45+50] + Form4563[15] + PR exclusion`. Tips/overtime/senior phaseout starting points.', '★★ Critical: line 13b MAGI is computed FROM line 11b with add-backs. Per future line 13b audit.'],
  ['Form 1040 line 15 (taxable income) — ★★ PRIMARY', '`line15 = max(0, line11b - line14)`. Note: line 15 IS floored at zero (unlike line 11b).', '★★ Critical: line 11b is the gross side of the taxable-income subtraction. Per future line 15 audit.'],
  ['Schedule 8812 (CTC/ACTC)', '`line11b` — phaseout starts at $400k MFJ / $200k others (no MAGI add-backs for CTC).', 'Per future Schedule 8812 audit.'],
  ['Form 8863 (AOTC/LLC)', '`MAGI = line11b + Form 2555 exclusion`. Phaseout $80k–$90k Single / $160k–$180k MFJ.', 'Per future Form 8863 audit.'],
  ['Form 8880 (Saver\'s Credit)', '`line11b` — AGI thresholds for credit rate (0% / 10% / 20% / 50% tiers).', 'Per future Form 8880 audit.'],
  ['Form 8959 (Additional Medicare Tax)', '`line11b` — filing-status-based wage thresholds.', 'Per future Form 8959 audit.'],
  ['EIC (line 27a)', '`line11b` — investment income ceiling + AGI ceiling for EIC eligibility.', 'Per future EIC audit.'],
  ['NOT line 11b — line 11a is preferred', 'Schedule A (medical floor) + Form 6251 AMT + Form 8962 PTC use `line11a` (or legacy `adjustedGrossIncome` field).', 'Knowledge §5 G5 — accessor-choice asymmetry; functionally identical (same value).'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 28 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 11b'],
  ['Line 11b has 1 NUMERIC input (line 11a — same-reference assignment). No personal-form inputs, no other operands.'],
  [],
  ['#', 'Source line', 'Field', 'IRS line', 'Required?', 'Role', 'Cross-reference'],
  [1, 'Form 1040 line 11a', 'line11a (AGI; BigDecimal)', 'Line 11a', 'YES (same-reference; null → line 11b null)', 'Sole operand; same-reference target', '11a #5 verified-correct + 10 #4 extension per 11a #4 + lock-in test `line11bAlwaysEqualsLine11aInvariant` per 11a #7'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 26 }, { wch: 45 }, { wch: 12 }, { wch: 45 }, { wch: 35 }, { wch: 95 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 11b'],
  [],
  ['No direct numeric reference-data constants for line 11b — it is a pure copy-line. **All AGI-related thresholds live in downstream consumers** (CTC phaseout, AOTC MAGI, EIC, etc.), NOT at the line 11b site itself.'],
  [],
  ['Statutory references'],
  ['§62 (Adjusted Gross Income framework)', 'IRC §62', 'YES — line 11b carries §62 AGI to page 2', 'Same AGI as line 11a; defined by §62(a) enumerated adjustments.'],
  ['§63 (Taxable Income framework)', 'IRC §63', 'INDIRECT — line 15 = line 11b − deductions', 'Taxable income is downstream of line 11b; defines the line 15 base.'],
  ['Pub. 590-A / 970 / 974 / 596 (per-benefit MAGI)', 'IRS Pubs.', 'DOWNSTREAM (NOT line 11b)', 'Each benefit computes its own MAGI from line11b + benefit-specific add-backs. Per spec §5 + §8.3.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 25 }, { wch: 45 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 11b (page 2 carry-forward)'],
  ['Line 11b is a pure same-reference assignment from line 11a — no transformation. Persists 1 field on the Adjustments output object + page-2 PDF placement.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.adjustments.line11bAmountFromLine11aAdjustedGrossIncome', '`adjustments.setLine11bAmountFromLine11aAdjustedGrossIncome(line11b)` at line ~4459', '★ CANONICAL line 11b output. PDF: `f2_01[0]` = `line11b_adjusted_gross_income_repeat` (canonical per CSV row 150). Same BigDecimal reference as line 11a (no copy).'],
  ['Form 1040 line 15 (taxable income) — ★★ CRITICAL', '`line15 = max(0, line11b - line14)` per future line 15 audit.', '★★ Primary downstream; line 15 IS floored at zero (line 11b is not). Future line 15 audit.'],
  ['Form 1040 line 13a (QBI) + Form 1040 line 13b (Schedule 1-A MAGI base)', 'Both read `getLine11bAmountFromLine11aAdjustedGrossIncome()` directly.', 'Per future line 13a / 13b audits.'],
  ['Form 1040 line 12e (standard deduction — dependent worksheet)', 'Reads line 11b via accessor.', 'Per future line 12e audit.'],
  ['Schedule 8812 CTC + Form 8863 AOTC/LLC + Form 8880 + Form 8959 + EIC', 'All read line 11b via accessor for AGI threshold tests.', 'Per future audits.'],
  ['NOT line 11b — line 11a path', 'Schedule A (medical floor) + Form 6251 AMT + Form 8962 PTC use line 11a or legacy `adjustedGrossIncome` field.', 'Knowledge §5 G5 — accessor-choice asymmetry. Functionally identical (same value).'],
  [],
  ['BLOCKING / ADVISORY FLAGS'],
  ['(None at line 11b site)', 'N/A', 'Line 11b is a pure same-reference assignment; no validation logic.', 'Spec §7.2 names LINE11B_MUST_EQUAL_LINE11A as a conceptual rule but backend enforces it structurally via same-reference (cannot drift).'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Universal MAGI field', '—', 'Per spec §5 + §8.3: line 11b is NOT a universal MAGI; verified backend complies via 11a #9.'],
  ['Separate value-copy field', '—', 'Backend uses same-reference (`BigDecimal line11b = line11a;`), not a value-copy. By design — structural invariant.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 11b-Related'],
  ['No line-11b-specific BLOCKING flags. The line11b = line11a invariant is enforced structurally via same-reference (impossible to drift).'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['(None at line 11b site)', 'N/A', 'Line 11b is a pure same-reference assignment; no validation logic.', 'Spec §7.2 lists LINE11B_MUST_EQUAL_LINE11A as a conceptual rule but backend structural invariant (same reference) makes this unfailable.'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 11b is the **AGI page-2 carry-forward** — pure same-reference assignment `BigDecimal line11b = line11a;` per IRS 2025 line 11b instructions ("Amount from line 11a"). **PAIR-COMPLETION audit** of the 11ab pair (analogous to 7b after 7a). Most closures are pair-mate cross-references to 11a closures + one cross-reference DOUBLE-EXTENSION (10 #4 extended once more with line-11b-specific page-2 details). Verified 2026-05-13.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-13 — CROSS-REFERENCE — NO MFS GUARD NEEDED AT LINE 11b SITE (transitively inherits via line 11a from 14 upstream orchestrators)', 'Line 11b is computed as `BigDecimal line11b = line11a;` at TaxReturnComputeService.java:~4448 — same-reference assignment, NOT a separate orchestrator. **MFS protection inherited TRANSITIVELY through 2 levels**: line 11b → line 11a (per 11a #1 — inline at `buildAdjustments`) → 14 upstream feeders (13 income orchestrators for line 9 + `computeIncomeAdjustments` for line 10 per 10 #1; codebase max). When MFS is set, the 14 feeders produce taxpayer-only values → line 11a is taxpayer-only → line 11b is taxpayer-only via same-reference. Spouse data cannot leak anywhere in the chain because it was already excluded at the operand level. **STRUCTURALLY SIMILAR to 11a #1 + 9 #1** — all three (line 9 + line 11a + line 11b) are inline-compute sites that inherit MFS protection rather than having their own guard. **THIRD defensive-gap-NOT-needed Issue #1 in the workflow** (after 9 #1 + 11a #1). **2nd-AND-FINAL Issue #1 cross-reference within the 11ab pair** — completes the smallest pair-cascade in the workflow (matches 7ab pattern via 7b #1 after 7a #1). **Closure**: pure xlsx-flip cross-reference. No code change. No breadcrumb at line 11b site — coverage already in extended 10 #4 breadcrumb (per 11a #4) documenting the inheritance chain; Issue #4 (11b #4) will extend the breadcrumb once more with line-11b-specific page-2 details (NOT via a separate MFS breadcrumb).', 'TaxReturnComputeService.java:~4448 (`BigDecimal line11b = line11a;`); MFS guards transitively inherited via line 11a from 14 upstream orchestrators', 'CLOSED — observation. NO code change. THIRD defensive-gap-NOT-needed Issue #1; 2nd-AND-FINAL within 11ab pair.'],
  [2, 'RESOLVED 2026-05-13 — DOCUMENTATION HYGIENE — KNOWLEDGE FILE ALREADY RENAMED VIA 11a #2 (pair-mate cross-reference)', '`knowledge/knowledge_line11ab.md` was renamed → `knowledge/line-11ab-agi.md` via 11a #2 (2026-05-13) as part of the shared 11ab pair migration (5th Legacy A migration in 2 days). **No additional migration needed** for line 11b — same shared knowledge file covers both 11a + 11b (anti-redundancy — shared file migrates once at pair-start, not at every member audit). Convergence at **18 lines** (extended via 11a #2; unchanged by line 11b audit). Remaining Legacy A files unchanged (3): knowledge_line16/17/26/27abc.md. **2nd-AND-FINAL knowledge-file cross-reference within the 11ab pair** — completes the smallest pair-citation cascade in the workflow (matches 7ab pattern via 7b #2 after 7a #2). **Closure**: pure xlsx-flip cross-reference; no code change; no additional file rename; no generator header update needed (`generate-11b.js` references the already-canonical name).', 'C:\\us-tax\\knowledge\\line-11ab-agi.md (already renamed via 11a #2 — pair-mate cross-reference)', 'CLOSED — pair-mate cross-reference. No additional rename; convergence stays at 18 lines.'],
  [3, 'RESOLVED 2026-05-13 — SPEC ENHANCEMENT — VERIFICATION LOG 2nd ROW APPENDED TO lines/11ab.md (completes pair-aligned 2-row log)', '`lines/11ab.md` had a Verification log section created via 11a #3 with a single row finalized to COMPLETE — 10/10 closed for 11a. **Closure applied**: appended a 2nd row to the existing table in IN-PROGRESS state capturing the 11b walkthrough closures (will accumulate Issues #1-#10 outcomes; finalized to "COMPLETE — 10/10 closed" at end of walkthrough). **APPEND-row pattern** (NOT NEW-section creation per 11a #3 — section already existed). **Completes pair-aligned 2-row log** — final shape parallel to 7ab (smallest pair-aligned log shape in the workflow). Log shape comparison across audited clusters/pairs: 2ab=4 rows (historical), 3abc/4abc/5abc=3 rows, 6abcd=4 rows, **7ab=2 rows**, 8/9/10=1 row (single-line), **11ab=2 rows (NEW; matches 7ab smallest-pair-aligned)**.', 'lines/11ab.md (Verification log 2nd row appended; pair-aligned 2-row log complete)', 'CLOSED — 2nd row appended. Pair-aligned 2-row log complete (matches 7ab shape).'],
  [4, 'RESOLVED 2026-05-13 — CROSS-REFERENCE — DOUBLE-EXTENDED 10 #4 BREADCRUMB WITH LINE-11b-SPECIFIC PAGE-2 DETAILS (SECOND extension by a downstream audit; FIRST double-extension of the SAME breadcrumb in the workflow)', 'The 10 #4 forward-cross-reference breadcrumb at TaxReturnComputeService.java:~4372 was seeded 2026-05-12 (as the FIRST subtractor cross-reference in the workflow) + EXTENDED 2026-05-13 via 11a #4 (12 lines → ~50 lines; FIRST cross-reference EXTENSION by a downstream audit). **Closure applied**: extended the breadcrumb ONCE MORE with two new content blocks: (1) **LINE 11b PAGE-2 PDF + ACCESSOR-PREFERENCE ASYMMETRY** section — page-1 vs page-2 PDF mapping summary (`f1_75[0]` page-1 bottom for line 11a vs `f2_01[0]` page-2 TOP for line 11b; rect coordinates included; verified canonical via 11a #8 + 11b #6); accessor-preference asymmetry note (9 page-2 consumers prefer `getLine11bAmountFromLine11aAdjustedGrossIncome()` vs 3 consumers using legacy or line-11a accessor — knowledge §5 G5 Low-priority cleanup); (2) **CROSS-REFERENCE PRECEDENT** section rewritten — replaced placeholder "extended ONCE MORE by future line 11b sibling audit" → enumerated 3-step seed → extend → extend-again history (10 #4 seeded; 11a #4 extended; 11b #4 extended-again) + explicit "11ab PAIR COMPLETE — this breadcrumb is in its FINAL state for the 11ab pair" closing note + template-seed forward-reference for future line 13a/13b/14/15 analogous patterns. Header note updated to "10 #4, 2026-05-12; EXTENDED 11a #4 + 11b #4, 2026-05-13". **SECOND cross-reference EXTENSION by a downstream audit in the workflow** (after 11a #4 — the FIRST such extension). **FIRST double-extension of the SAME breadcrumb** in the workflow — seed → extend → extend-again pattern demonstrated end-to-end across 3 audits (10 #4 → 11a #4 → 11b #4). Pure documentation extension — no functional change.', 'TaxReturnComputeService.java:~4372 (10 #4 breadcrumb double-extended via 11b #4; final state for 11ab pair)', 'CLOSED — 10 #4 breadcrumb double-extended. SECOND cross-reference extension; FIRST double-extension of same breadcrumb; 11ab pair-complete final state.'],
  [5, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — `BigDecimal line11b = line11a;` (same-reference IRS copy-line invariant; folded into 10 #4 extension)', 'At TaxReturnComputeService.java:~4448: `BigDecimal line11b = line11a;` — same BigDecimal REFERENCE, not a value-copy. **Three structural guarantees**: (a) reference equality `line11b == line11a` always TRUE (same object); (b) value equality `line11b.equals(line11a)` trivially TRUE (same object → same value); (c) impossible to drift (BigDecimal is immutable; only one object exists; no separate value to update or get out of sync). This is a STRONGER invariant than a value-copy would be — a value-copy could in principle diverge if a future refactor accidentally re-rounded or transformed the copied value; a same-reference assignment is structurally unfailable as long as the reference is preserved. Per IRS 2025 line 11b instructions ("Amount from line 11a") + spec §2.2 + §7.2. **Closure**: pure xlsx-flip affirmative verification — coverage in the extended 10 #4 breadcrumb at TaxReturnComputeService.java:~4372 under the "LINE 11b IRS COPY-LINE INVARIANT" section per 11a #4 + the 11b #4 extension which reinforces the same-reference (NOT value-copy) note. Existing lock-in test `line11bAlwaysEqualsLine11aInvariant` (added 11a #7) covers 3 scenarios (positive / negative / null AGI). **NO new breadcrumb** at line ~4448 — anti-duplication policy applied (4th anti-duplication application across the 11ab pair; matches 11a #5 + 11a #6 + 11a #9 + this).', 'TaxReturnComputeService.java:~4448 (`BigDecimal line11b = line11a;`); extended 10 #4 breadcrumb per 11a #4 + 11b #4', 'CLOSED — verified correct. Coverage in 10 #4 extension; no new breadcrumb (4th anti-duplication application across 11ab pair).'],
  [6, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — LINE 11b PDF MAPPING CANONICAL (`f2_01[0]` / `line11b_adjusted_gross_income_repeat`; CSV row 150)', 'PDF semantic mapping for line 11b: CSV row 150 has `f2_01[0]` → `line11b_adjusted_gross_income_repeat` with rect `(504, 744.001, 576, 756)` — top of page 2, immediately above line 12. **Three verification points**: (a) PDF field `f2_01[0]` canonical; (b) semantic key `line11b_adjusted_gross_income_repeat` (with `b` suffix; explicit `_repeat` indicating page-2 carry-forward role); (c) page-2 placement at TOP of page 2. **Affirmative-verification audit-trail row** — no naming inconsistency (unlike line 11a where knowledge §3 + §6 G4 + §8 claimed stale `f1_77[0]` / `line11_adjusted_gross_income` until corrected via 11a #8). The line 11b CSV mapping has been canonical at least as long as has been verified; the `_repeat` semantic key clearly distinguishes the page-2 carry-forward role. Knowledge §8 (corrected via 11a #8) now explicitly shows both rows canonical with CSV row numbers (89 + 150). **Closure**: pure xlsx-flip affirmative verification — mapping canonical, no drift, no fix needed. **NO new breadcrumb** at line 11b site — coverage in extended 10 #4 breadcrumb per 11b #4 under "LINE 11b PAGE-2 PDF + ACCESSOR-PREFERENCE ASYMMETRY" section (page-1 vs page-2 PDF mapping summary with rect coordinates). Affirmative-verification audit-trail row pattern (same shape as 7b #7 PDF-mapping verification).', 'us-tax-ui/public/irs/f1040_field_mapping_semantic.csv row 150 (canonical); extended 10 #4 breadcrumb per 11b #4 "LINE 11b PAGE-2 PDF" section', 'CLOSED — verified correct. PDF mapping canonical; no naming-inconsistency drift (unlike 11a #8 page-1).'],
  [7, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — LINE 11b LOCK-IN TEST COVERAGE COMPLETE (closed via 11a #7; pair-mate cross-reference)', 'Lock-in test `line11bAlwaysEqualsLine11aInvariant` was added 2026-05-13 via 11a #7 with 3 scenarios — the test was named with "line11b" in the test name intentionally because it asserts the line-11b-specific invariant (line 11b = line 11a) even though it was added during the 11a walkthrough. **All 3 scenarios assert `adj.getLine11aAdjustedGrossIncome().equals(adj.getLine11bAmountFromLine11aAdjustedGrossIncome())`** + null state for the null scenario: (a) positive AGI ($50k wages, $0 adjustments → 11a=11b=$50,000); (b) negative AGI ($5k wages + $7k educator → 11a=11b=-$2,000; validates sign-preserving copy-line invariance); (c) null AGI (no income, no adjustments → entire Adjustments object null via `(line10 == null && line11a == null) return null` short-circuit; both 11a + 11b null in lockstep). Closes knowledge §6 G3 ("No unit test explicitly asserting both 11a=11b always") — verified knowledge file (corrected via 11a #8) shows G3 as **"Resolved 2026-05-13 via 11a #7"**. **Closure**: pure xlsx-flip cross-reference. Test exists, runs, and passes (verified via smoke test after 11a #7; backend regression 758 → 759). No additional test needed for line 11b sibling audit. **Anti-redundancy pattern** — invariant tests for tightly-coupled pairs added once at the pair-start audit, not duplicated at the sibling.', 'TaxReturnComputeServiceTest.java `line11bAlwaysEqualsLine11aInvariant` (added 11a #7; covers line 11b invariant); knowledge §6 G3 (resolved)', 'CLOSED — pair-mate cross-reference to 11a #7. No additional test; coverage complete.'],
  [8, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — LINE 11b DOWNSTREAM CONSUMER WIRING (line 11b is the PREFERRED accessor for 9 downstream consumers; knowledge §5 G5 asymmetry observation)', 'Per knowledge §2 / dependencies §6.1: line 11b is the PREFERRED accessor for **9 downstream consumers** (Camp A — page-2 logical locality) — line 12e (standard deduction dependent worksheet) + line 13a (QBI taxable-income base + threshold) + line 13b (Schedule 1-A MAGI base for tips/overtime/senior) + line 15 (taxable income = max(0, line 11b − line 14)) + Schedule 8812 (CTC/ACTC phaseout $400k MFJ / $200k others) + Form 8863 (AOTC/LLC MAGI phaseout $80k-$90k Single / $160k-$180k MFJ) + Form 8880 (Saver\'s Credit AGI thresholds) + Form 8959 (Additional Medicare Tax wage thresholds) + EIC (investment income + AGI ceilings). **Camp B (3 consumers) prefer line 11a or legacy `adjustedGrossIncome`**: Schedule A (medical-expense floor 7.5% × AGI) + Form 6251 AMT (line ~8200) + Form 8962 PTC (via `computeScheduleAgi()` helper). **Result is identical** (same value via same-reference per 11b #5); accessor-choice asymmetry is **knowledge §5 G5** ("accessor-choice confusion about which copy to use downstream"). A future migration could retire the legacy field + repoint Schedule A + Form 6251 to `getLine11aAdjustedGrossIncome()`. **Closure**: pure xlsx-flip observation. Coverage in extended 10 #4 breadcrumb under the new "LINE 11b PAGE-2 PDF + ACCESSOR-PREFERENCE ASYMMETRY" section per 11b #4. Knowledge §5 G5 acknowledged as Low-priority future cleanup (NO new outstanding entry per anti-fragmentation policy — knowledge §5 G5 serves as canonical tracking record).', 'Knowledge §2 + §5 G5 + §6 (downstream callers documented); dependencies §6.1; extended 10 #4 breadcrumb per 11b #4 "ACCESSOR-PREFERENCE ASYMMETRY" section', 'CLOSED — observation. Coverage in 10 #4 extension; knowledge §5 G5 accessor asymmetry acknowledged; no new outstanding entry.'],
  [9, 'RESOLVED 2026-05-13 — OBSERVATION — LINE 11b IS NOT A UNIVERSAL MAGI (pair-mate cross-reference to 11a #9; backend compliance verified)', 'Per spec §5 + §8.3 + §10: "Line 11b is NOT \'the taxpayer\'s MAGI\'; do NOT label line 11b as MAGI in code or UI; do NOT build one shared MAGI amount and reuse it everywhere; 11b is still AGI, not MAGI." Each downstream benefit has its own MAGI definition with benefit-specific add-backs (Schedule 1-A: line11b + Form 2555 + Form 4563 + PR exclusion; IRA deduction: line11b + IRA deduction itself + student loan; Student loan interest: line11b + student loan deduction itself; AOTC/LLC: line11b + Form 2555 exclusion; Form 8962 PTC: AGI via `computeScheduleAgi()` helper; Schedule 8812 CTC: no add-backs; Roth IRA phaseout: + various per Pub 590-A; EIC: AGI directly — no MAGI). **Backend compliance verified via 11a #9**: `grep magi/MAGI` in `Adjustments.java` returns NO MATCH. **Why this is a separate Issue #9 for line 11b**: the guardrail is page-2-relevant — most downstream MAGI consumers read line 11b (not line 11a) per the accessor-preference asymmetry from 11b #8; the MAGI-vs-AGI rule fires primarily through the line 11b accessor. Including this as Issue #9 completes audit-trail symmetry with 11a #9. **Closure**: pure xlsx-flip observation — pair-mate cross-reference to 11a #9. Coverage in extended 10 #4 breadcrumb under "MAGI vs AGI GUARDRAIL" section per 11a #4. **NO new breadcrumb** — anti-duplication policy applied (**5th explicit anti-duplication application** across the 11ab pair; after 11a #5 + 11a #6 + 11a #9 + 11b #5 + this). Audit-trail-completeness pattern.', 'Adjustments.java (compliance verified via 11a #9); extended 10 #4 breadcrumb "MAGI vs AGI GUARDRAIL" section per 11a #4', 'CLOSED — pair-mate cross-reference to 11a #9. No new breadcrumb; 5th explicit anti-duplication application across 11ab pair.'],
  [10, 'RESOLVED 2026-05-13 — OBSERVATION — 11ab PAIR COMPLETE + SECOND CROSS-REFERENCE EXTENSION + FIRST DOUBLE-EXTENSION OF THE SAME BREADCRUMB IN THE WORKFLOW', 'Pure xlsx-flip observation — **three major workflow milestones**: (1) **11ab PAIR COMPLETE** — line 11b is the sibling/pair-completion audit of line 11a (analogous to 7b after 7a). Final pair-aligned Verification log = 2 rows (parallel to 7ab smallest-pair-aligned shape). (2) **SECOND cross-reference EXTENSION by a downstream audit** (Issue #4) — extended 10 #4 breadcrumb once more (~50 → ~70 lines) with line-11b-specific page-2 details (after 11a #4 — the FIRST such extension). (3) **FIRST double-extension of the SAME breadcrumb in the workflow** — the seed → extend → extend-again pattern is now demonstrated end-to-end across 3 audits at the same code site (10 #4 seeded 12 lines; 11a #4 extended → ~50 lines; 11b #4 extended-again → ~70 lines). Establishes template for future analogous patterns (line 13a/13b will seed a similar breadcrumb at line 13a site; line 14 will extend; line 15 will extend-again). **Cumulative through line 11b**: 32 lines audited (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + **11b**); 317 audit issues closed total (307 + 10); backend 759/759 tests pass (unchanged — no new code in 11b walkthrough; lock-in test `line11bAlwaysEqualsLine11aInvariant` added by 11a #7 covers 11b); MFS-guard cascade = 14 orchestrators (unchanged — line 11b transitively inherits via line 11a from 14 upstream feeders); knowledge-file naming convergence = 18 lines (unchanged from 11a #2 — shared file). **5 explicit anti-duplication applications across the 11ab pair** (11a #5 + 11a #6 + 11a #9 + 11b #5 + 11b #9 — verified-correct + observations folded into 10 #4 extension rather than separately documented). **ZERO new outstanding.md entries** in 11b walkthrough — **7 consecutive walkthroughs with zero new outstanding entries** (7a / 7b / 8 / 9 / 10 / 11a / 11b). **AGI-territory now has 3 audited lines** (line 10 + line 11a + line 11b). **Looking ahead**: line 12a-12e deductions cluster (5 sub-lines: 12a standard/itemized + 12b non-itemizer charitable + 12c subtotal + 12d QBI scaffolding + 12e final; multi-row; potentially largest cluster after 6abcd 4-row; first multi-row cluster in AGI-territory), then line 13a/13b QBI + additional deductions pair (will seed a new cross-reference breadcrumb following the 10 #4 → 11a #4 → 11b #4 template), line 14 total deductions composite, line 15 taxable income (first audit with zero-floor rule), line 16+ tax computation.', 'XLS/computations/11b.xlsx audit-trail (this row); no code change beyond Issue #4 breadcrumb double-extension', 'CLOSED — pure xlsx-flip. 11ab pair COMPLETE; SECOND cross-reference extension; FIRST double-extension of same breadcrumb; line 12a-12e next.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 100 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 11b Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.adjustments.line11bAmountFromLine11aAdjustedGrossIncome', 'topmostSubform[0].Page2[0].f2_01[0] (line11b_adjusted_gross_income_repeat)', 'form-tax-return-1040.xlsx (line 11b cell, page 2 top)', '★ CANONICAL line 11b output. Same BigDecimal reference as line 11a (no transformation). Page-2 placement at top of form.'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 15 (taxable income)', '—', 'form-tax-return-1040.xlsx (line 15 cell)', '★★ line15 = max(0, line11b − line14). Line 15 IS floored at zero (line 11b is not). Future line 15 audit.'],
  ['Form 1040 line 13a (QBI deduction)', '—', '—', '★★ taxableIncomeBeforeQbi = line11b − line12e − line13b; QBI threshold base. Future line 13a audit.'],
  ['Form 1040 line 13b (Schedule 1-A — tips/overtime/senior)', '—', '—', '★★ Schedule1A_MAGI = line11b + Form 2555 + Form 4563 + PR exclusion. Future line 13b audit.'],
  ['Form 1040 line 12e (standard deduction — dependent worksheet)', '—', '—', 'Dependent earned-income ceiling computed from line 11b. Future line 12e audit.'],
  ['Schedule 8812 (CTC/ACTC) + Form 8863 (AOTC/LLC) + Form 8880 + Form 8959 + EIC', '—', '—', 'Various AGI/MAGI threshold consumers per future audits.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Universal MAGI field', '—', '—', 'Per spec §5 + §8.3: line 11b is NOT a universal MAGI. Per-benefit MAGI computed downstream.'],
  ['Schedule A (medical floor) + Form 6251 AMT + Form 8962 PTC', '—', '—', 'These consumers use line 11a or legacy `adjustedGrossIncome` instead of line 11b. Knowledge §5 G5 accessor-choice asymmetry.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 65 }, { wch: 75 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
