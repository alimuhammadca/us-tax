// ============================================================================
//  Generates: C:\us-tax\XLS\computations\36.xlsx
//
//  ★ THIRD SHARED-DOC AUDIT in workflow (2nd recurrence of SHARED-DOC pattern
//  after 34 + 35). Line 36 documented in line 33 shared files.
//
//  Source-of-truth references:
//    - lines/33.md §4 "Line 36 — Amount Applied to 2026 Estimated Tax"
//      (★ NO dedicated lines/36.md).
//    - dependencies/33.md (titled "Total Payments (and Lines 34–38)").
//    - knowledge/line-33-total-payments.md §3 + §4 + §8.
//    - knowledge/knowledge_refund_and_amount_owed.md (UI-audit; covers
//      apply-to-next-year form mechanics).
//    - flowcharts/33.drawio + refund-and-amount-owed-ui.drawio.
//    - input_forms/form-apply-next-year.xlsx (★ source of line 36 input).
//    - TaxReturnComputeService.java:
//        ★ NOTE: line 36 has TWO-STAGE wiring (one pattern in workflow):
//        Stage 1 — line 19942-19953 (raw read from personal form; 12 lines):
//          BigDecimal line36 = BigDecimal.ZERO;
//          if (applyNextYearData != null) {                     // gate 1a
//              Boolean elects = getBoolean(applyNextYearData, "electsApplyToNextYear");
//              if (Boolean.TRUE.equals(elects)) {                // gate 1b
//                  BigDecimal raw = getAmount(applyNextYearData, "amountToApply");
//                  if (raw != null && raw.compareTo(BigDecimal.ZERO) > 0) {   // gate 1c
//                      line36 = roundMoney(raw);
//                  }
//              }
//          }
//        Stage 2 — line 19970-19973 (cap + setter; inside overpayment branch):
//          BigDecimal line36Capped = line36.min(overpaid);       // cap at line 34
//          if (line36Capped.compareTo(BigDecimal.ZERO) > 0) {     // gate 2a
//              refund.setAmountAppliedToNextYear(line36Capped);
//          }
//
//  Tax year: 2025
//
//  ★ CORRECTION to prior line 35 closure note: line 36 is NOT pre-set "before"
//  line 33 — line 36 stage 1 is at line 19942-19953 (AFTER line 33 at 19937-
//  19940, but BEFORE the overpayment branch at 19959+). The split-stage shape
//  is: Stage 1 raw read between line 33 and refund branch; Stage 2 cap + setter
//  inside refund branch.
//
//  Line 36 audit positioning (28th audit OUTSIDE 13ab pair; 67th line):
//   • SEVENTEENTH payments-section audit
//   • ★ THIRD SHARED-DOC AUDIT (2nd recurrence of SHARED-DOC pattern after 34
//     + 35); convergence UNCHANGED at 39 lines
//   • ★ M2 RECURRENCE — 6th recurrence in payments-section (after 31+32+33+
//     34+35); 12 M2 instances now; pattern distribution after 23 audits: 12 M2
//     + 4 M3 + 5 M4 + 2 degenerate; ★ M2 DOMINANT (6 consecutive)
//   • ★ NEW complexity dimension: TWO-STAGE CAPPED NUMERIC PASSTHROUGH (14th
//     distinct; TWO stages — raw-read with multi-gate + capped setter with
//     gate — sharing local state across non-adjacent code regions)
//   • ★ Convention 1 if-gate-around-setter 2nd recurrence (line 31 → 35b/c/d
//     → 36; now 3 instances)
//   • ★ 21st META-AUDIT — sub-type (b); DOMINANCE to ~95% (20 of 21); likely
//     CLEAN; ★ 3rd consecutive clean after 34 #4 + 35 #4
//   • ★ 3rd MULTI-ROW Verification log contribution — row 4 to lines/33.md
//     §10 (after rows 2 + 3 from 34 + 35 audits)
//   • ★ Path A continues — 36th application; streak at 8
//   • ★ FLOOR tier expanded to 13 audits
//
//  Line 36 audit angles (10 issues):
//   1. ★ MFS analysis + ★ M2 RECURRENCE 6th in payments-section; 12 M2
//       instances; ★ M2 DOMINANT (6 consecutive: 31→32→33→34→35→36).
//   2. ★ THIRD SHARED-DOC AUDIT (2nd recurrence after 34 + 35); ★ NO Legacy A
//       migration possible/needed; convergence UNCHANGED at 39 lines.
//   3. ★ 3rd MULTI-ROW Verification log contribution (row 4 to lines/33.md
//       §10); ★ MULTI-ROW pattern continues for shared-doc audits.
//   4. ★ 21st META-AUDIT — sub-type (b); DOMINANCE to ~95% (20 of 21); ★
//       expected CLEAN; ★ 3rd consecutive clean after 34 #4 + 35 #4; ★
//       includes CORRECTION of prior line 35 closure note about line 36
//       compute-order ("pre-set BEFORE line 33" was wrong — it's AFTER line
//       33 but BEFORE the refund branch).
//   5. ★ 30th anti-duplication — 25a #5 breadcrumb reuse 8th cross-audit reuse
//       — 5th reuse OUTSIDE 25abcd cluster.
//   6. ★ NEW complexity dimension: TWO-STAGE CAPPED NUMERIC PASSTHROUGH (14th
//       distinct); ★ 1st cross-region two-stage pattern (state shared between
//       non-adjacent code regions via local variable).
//   7. ★ 4 CONVENTIONS baseline (tied with 31/32/33/34/35); ★ Convention 1
//       if-gate-around-setter 2nd recurrence (now 3 instances — most-recurring
//       Convention 1 mechanism would be ternary-at-setter at 4 instances).
//   8. ★ 0 routing + 0 reference data; FLOOR tier expanded to 13 audits.
//   9. ⚠️ BUNDLED OBSERVATIONS — ★ Path A application; ★ 36th; ★ streak at 8;
//       ★ 8-audit zero-new-gaps streak.
//  10. BOUNDARY MILESTONE.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '36.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 36 — AMOUNT OF LINE 34 APPLIED TO 2026 ESTIMATED TAX — 2025'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 36 (page 2; "Amount of line 34 you want applied to your 2026 estimated tax")'],
  ['Concept',
    'Line 36 is the user-elected portion of the overpayment (line 34) to credit toward the 2026 ' +
    'first-quarter estimated tax payment (due April 15, 2026). ★ IRREVOCABLE election — once made, ' +
    'cannot be reversed. ★ TWO-STAGE wiring:\n' +
    '  • Stage 1 (raw read): user-elected `amountToApply` from `apply-to-next-year` personal form,\n' +
    '    gated by `electsApplyToNextYear` boolean. Always runs after line 33; never reaches Refund\n' +
    '    output unless overpaid.\n' +
    '  • Stage 2 (cap + setter): inside the overpayment branch, capped at line 34 (overpaid). The\n' +
    '    capped value is stored on `Refund.amountAppliedToNextYear` when > 0.\n' +
    '\n' +
    '★ NEW complexity dimension: TWO-STAGE CAPPED NUMERIC PASSTHROUGH (14th distinct dimension) —\n' +
    'state shared between non-adjacent code regions via the local `line36` variable.'],
  ['Top-level formula (lines/33.md §4 — "Line 36")',
    'Stage 1 (raw): line36 = roundMoney(applyNextYearData.amountToApply)\n' +
    '               WHEN applyNextYearData.electsApplyToNextYear == true AND amountToApply > 0;\n' +
    '               ELSE 0.\n' +
    '\n' +
    'Stage 2 (capped + setter; inside overpayment branch only):\n' +
    '  line36Capped = min(line36, overpaid)            // cap at line 34\n' +
    '  refund.amountAppliedToNextYear = line36Capped   // only when > 0 (if-gate around setter)\n' +
    '\n' +
    '★ Cannot exceed line 34 (overpayment). If user enters $999,999 but overpayment is $5,000,\n' +
    'the cap reduces it to $5,000. If no overpayment, line 36 is silently dropped (Stage 2 never runs).'],
  ['Surrounding page-2 chain',
    'line 33 = total payments (set at line 19937-19940 — before Stage 1)\n' +
    'line 36 Stage 1 raw read (set at line 19942-19953 — between line 33 and refund branch)\n' +
    'line 24 = total tax (loaded at line 19956-19957)\n' +
    'line 34 = overpayment = line 33 − line 24 (set at line 19961; inside refund branch)\n' +
    'line 36 Stage 2 cap + setter (set at line 19970-19973; immediately after line 34)\n' +
    'line 35a = line 34 − line 36 (set at line 19976-19977; uses line36Capped)\n' +
    '\n' +
    '★ Line 36 Stage 1 is computed AFTER line 33 but BEFORE the refund branch.\n' +
    '★ Stage 2 cap + setter run inside the refund branch only when line 33 > line 24.\n' +
    '★ When no overpayment (amount owed or balanced return), Stage 1 still runs but Stage 2 never\n' +
    '   does — `Refund.amountAppliedToNextYear` is never set; user election is silently dropped.'],
  ['Output target',
    'Primary: form1040.refund.amountAppliedToNextYear (BigDecimal; line 36 output; if-gate around setter)\n' +
    'PDF field: line36_applied_to_2025_estimated_tax (page 2; ★ NOTE field name says "2025" but it\'s\n' +
    'the 2026 estimated tax — naming convention reflects PDF generation as of TY2024; field maps to\n' +
    'IRS line 36 for TY2025)\n' +
    'Frontend field: form.refund?.amountAppliedToNextYear'],
  ['Backend implementation',
    '★ NO DEDICATED HELPER METHOD — line 36 wired inline in computeLine31ThroughLine38 in TWO stages:\n' +
    '  • Stage 1 at line 19942-19953 (12 lines) — raw read with 3 gates (applyNextYearData != null,\n' +
    '    electsApplyToNextYear == true, raw > 0)\n' +
    '  • Stage 2 at line 19970-19973 (4 lines) — cap + if-gate setter\n' +
    '★ Local variable `line36` carries state between stages.\n' +
    '★ Covered by 25a #5 NEW VERIFIED CORRECT breadcrumb at line ~19688-19790.'],
  ['IRS source',
    'IRS 2025 Form 1040 (page 2 line 36 "Amount of line 34 you want applied to your 2026 estimated\n' +
    'tax") + 2025 Instructions for Form 1040. ★ 2025 — line 36 routing unchanged from 2024 (still\n' +
    'an irrevocable election to apply portion of overpayment to next-year first-quarter estimated\n' +
    'tax payment).'],
  ['★ SHARED-DOC AUDIT NOTE',
    '★ THIRD SHARED-DOC AUDIT in workflow (2nd recurrence of SHARED-DOC pattern after 34 + 35).\n' +
    'Line 36 has NO dedicated:\n' +
    '  • lines/36.md spec (documented in lines/33.md §4 "Line 36")\n' +
    '  • dependencies/36.md (covered by dependencies/33.md)\n' +
    '  • knowledge_line36.md or line-36-applied-next-year.md (in line-33-total-payments.md §3+§4)\n' +
    '  • flowcharts/36.drawio (covered by flowcharts/33.drawio + refund-and-amount-owed-ui.drawio)\n' +
    '  • diagrams/36.drawio (payments-section diagrams begin at 32)\n' +
    '★ `knowledge_refund_and_amount_owed.md` covers the apply-to-next-year form UI mechanics (UI-audit).'],
  ['★ COMPUTE-ORDER CORRECTION',
    '★ The prior line 35 audit closure note stated line 36 is "pre-set BEFORE line 33" — this is\n' +
    'INCORRECT. The actual compute order is:\n' +
    '  1. Line 33 set at line 19937-19940\n' +
    '  2. Line 36 Stage 1 raw read at line 19942-19953 (★ AFTER line 33, NOT before)\n' +
    '  3. totalTax loaded at 19956-19957\n' +
    '  4. Overpayment branch at 19959+ (line 34, line 36 Stage 2 cap, line 35a, 35b/c/d)\n' +
    'Line 36 IS pre-set BEFORE the refund branch (so the cap step at Stage 2 can reference the raw\n' +
    'value), but it is NOT before line 33 itself. This audit corrects the prior note.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Stage 1 init at line 19944', '`BigDecimal line36 = BigDecimal.ZERO` — default zero before gates.'],
  [2, 'Stage 1 outer gate at line 19945', '`if (applyNextYearData != null)` — gate 1a; personal form present.'],
  [3, 'Stage 1 elects gate at line 19946-19947', '`if (Boolean.TRUE.equals(elects))` — gate 1b; user has elected to apply.'],
  [4, 'Stage 1 raw read at line 19948', '`BigDecimal raw = getAmount(applyNextYearData, "amountToApply")` — read user-entered amount.'],
  [5, 'Stage 1 positive gate at line 19949-19950', '`if (raw != null && raw > 0)` — gate 1c; only positive amounts; rounded via roundMoney.'],
  [6, 'totalTax loaded at line 19956-19957', '`safeAmount(form1040.getTaxAndCredits().getTotalTax())` — required for refund branch.'],
  [7, 'Refund-branch gate at line 19959', '`if (line33.compareTo(totalTax) > 0)` — Stage 2 runs only when overpaid.'],
  [8, 'Stage 2 cap at line 19970', '`BigDecimal line36Capped = line36.min(overpaid)` — cap at line 34 (overpayment).'],
  [9, 'Stage 2 if-gate around setter at line 19971-19972', '`if (line36Capped > 0) refund.setAmountAppliedToNextYear(line36Capped)` — Convention 1 mechanism (if-gate-around-setter; 2nd recurrence of line 31 pattern).'],
  [10, 'Stage 2 downstream: line 35a uses line36Capped at line 19976', '`line35a = roundMoney(overpaid.subtract(line36Capped))` — refund amount after line 36 election.'],
  [],
  ['INVARIANTS / VALIDATIONS'],
  ['Invariant', 'Rationale'],
  ['Line 36 ≥ 0 always', 'STRUCTURALLY enforced — Stage 1 default zero; gates filter negative inputs.'],
  ['Line 36 ≤ line 34 (capped at overpayment)', '★ STRUCTURALLY enforced via `.min(overpaid)` at line 19970.'],
  ['Line 36 null when zero (in Refund output)', '★ STRUCTURALLY enforced via if-gate-around-setter at line 19971-19972 (★ 2nd recurrence of line 31 mechanism).'],
  ['Line 36 never set when no overpayment', '★ STRUCTURALLY enforced — Stage 2 lives inside overpayment branch only.'],
  ['User election is IRREVOCABLE', 'IRS rule — once filed, applied amount cannot be reversed; IRS credits to Q1 2026 (April 15, 2026) by default.'],
  ['MFS protection inherited via M2 transitive', '★ M2 — line 36 has no per-spouse code; relies on per-return personal form scoping.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 38 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 36'],
  ['Line 36 takes 1 numeric input from the `apply-to-next-year` personal form, with 3 gates in Stage 1. Stage 2 reads upstream `overpaid` (line 34). All MFS protection inherited transitively (M2 RECURRENCE — 6th in payments-section; 12 M2 instances now).'],
  [],
  ['STAGE 1 INPUTS (1 numeric + 1 boolean gate + null-safety gates)'],
  ['#', 'Source', 'Origin', 'Java field read', 'Conditional?'],
  ['s1-1', 'applyNextYearData (entire form)', '`apply-to-next-year` personal form (taxpayer)', 'Method parameter (loaded earlier in computeTaxReturn)', 'null check'],
  ['s1-2', 'electsApplyToNextYear', 'apply-to-next-year form: electsApplyToNextYear boolean', '`getBoolean(applyNextYearData, "electsApplyToNextYear")`', 'TRUE check'],
  ['s1-3', 'amountToApply', 'apply-to-next-year form: amountToApply numeric', '`getAmount(applyNextYearData, "amountToApply")`', 'null + > 0 check'],
  [],
  ['STAGE 2 INPUTS (1 upstream + overpayment gate)'],
  ['#', 'Source', 'Origin', 'Java field read', 'Conditional?'],
  ['s2-1', 'overpaid (line 34)', 'Local variable set inside refund branch at line 19961', 'Local `overpaid`', 'Gated by overpayment branch'],
  ['s2-2', 'line36 (from Stage 1)', 'Local variable set in Stage 1', 'Local `line36`', 'Carried across non-adjacent regions'],
  [],
  ['⚠️ USER INPUT FORMS REFERENCED'],
  ['Form file', 'Fields used', 'Purpose'],
  ['form-apply-next-year.xlsx', 'electsApplyToNextYear (boolean) + amountToApply (numeric)', 'Source for line 36 election; per-return scoping (each MFS spouse files separately).'],
  [],
  ['⚠️ MFS PROTECTION via M2 transitive inheritance (★ 6th M2-based Convention 4 in payments-section after 31+32+33+34+35; 12 M2 instances now)'],
  ['Mechanism', 'Detail'],
  ['★ Personal-form scoping for Stage 1', '`apply-to-next-year` form is per-return; each MFS spouse has their own.'],
  ['★ Transitive inheritance from line 34 for Stage 2', 'overpaid is MFS-clean via line 34\'s M2.'],
  ['No in-helper MFS check needed', 'No per-spouse code at line 36 wiring sites.'],
  ['→ NO MFS GUARD NEEDED', '★ M2 RECURRENCE (6th in payments-section after 31+32+33+34+35); 12 M2 instances; pattern distribution after 23 audits: 12 M2 + 4 M3 + 5 M4 + 2 degenerate'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 10 }, { wch: 50 }, { wch: 60 }, { wch: 60 }, { wch: 28 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 36'],
  ['★ ZERO reference data at line 36 wiring site. ★ FLOOR tier expanded to 13 audits.'],
  [],
  ['Constant', '2025 Value', 'Statutory Basis'],
  ['(None — pure user-elected pass-through with cap)', '—', '—'],
  [],
  ['★ Reference-data comparison across recent audits'],
  ['Audit', '# numeric constants', 'Tier'],
  ['25a-d / 27b/c / 31 / 32 / 33 / 34 / 35', '0 (tied — 11 audits)', 'FLOOR'],
  ['26 / 30', '4 / ~6', 'LOW-MID'],
  ['28 / 29', '~15 / ~14', 'MID'],
  ['27a', '★ 72 (HEAVIEST)', 'CEILING'],
  ['**36**', '**★ 0 (FLOOR tier; ★ FLOOR tier expanded to 13 audits)**', 'FLOOR'],
  [],
  ['NOTE: Relevant downstream dates (NOT used at line 36 wiring; IRS rule context)'],
  ['Q1 2026 estimated tax due date', 'April 15, 2026', 'IRS rule — line 36 credits to Q1 2026 by default unless statement directs otherwise.'],
  ['Election irrevocability rule', '—', 'IRS rule — once filed, line 36 cannot be reversed (UI-enforced education; not backend-checked).'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 45 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 36 Persistence + Downstream Consumers'],
  ['Line 36 sets ONE field on Refund output model. ★ Stage 2 cap directly affects line 35a (refund amount = line 34 − line 36 capped).'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.refund.amountAppliedToNextYear', 'computeLine31ThroughLine38 at line 19972', '★ CANONICAL line 36 output. = min(line36 raw, overpaid). Only set when overpayment branch active AND capped value > 0 (if-gate-around-setter).'],
  [],
  ['SAME-METHOD DOWNSTREAM'],
  ['Line 35a = line 34 − line 36 capped', '~line 19976-19977', '★ Refund amount directly reduced by line 36 (audited at line 35 #6 already).'],
  ['Line 35b/c/d (direct deposit)', '~line 19979-19999', '★ Indirectly affected — if line 36 == line 34, refund amount is zero, but DD fields can still be populated (per Refund struct).'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Frontend PDF export (Form 1040 page 2)', 'form-tax-return-1040.component.ts', '`values["line36_applied_to_2025_estimated_tax"] = formatAmount(refund?.amountAppliedToNextYear)`'],
  ['Form 8888 line 5 validation (indirect)', '`computeForm8888()` after refund finalized', '★ Line 36 reduces line 35a, which Form 8888 validates against totalAllocated.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 55 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 36'],
  ['Line 36 emits NO blocking flags. UI may enforce ceiling (≤ overpaid) at the form level, but backend silently caps via .min().'],
  [],
  ['Flag code', 'Severity', 'Condition'],
  ['(None at line 36 site)', 'N/A', 'No validation at line 36 wiring.'],
  [],
  ['STRUCTURAL INVARIANTS'],
  ['Invariant', 'How enforced'],
  ['Line 36 ≥ 0', 'STRUCTURALLY enforced — Stage 1 default ZERO; positive-only gate at line 19949.'],
  ['Line 36 ≤ line 34 (overpaid)', '★ STRUCTURALLY enforced via .min(overpaid) at line 19970.'],
  ['Line 36 null on Refund when zero', '★ STRUCTURALLY enforced via if-gate-around-setter at line 19971-19972 (★ 2nd recurrence of line 31 mechanism; 3 instances total: 31 + 35b/c/d + 36).'],
  ['Line 36 never set on amount-owed return', 'STRUCTURALLY enforced — Stage 2 lives inside overpayment branch.'],
  ['Stage 1 + Stage 2 state shared via local var', '★ NEW pattern: TWO-STAGE CAPPED NUMERIC PASSTHROUGH (14th distinct complexity dimension).'],
  ['MFS protection inherited via M2 transitive', '★ 6th M2-based Convention 4 in payments-section after 31+32+33+34+35.'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 14 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 36 is the IRREVOCABLE user-elected amount to apply to 2026 estimated tax — TWO-STAGE CAPPED NUMERIC PASSTHROUGH (★ NEW 14th complexity dimension). 28th audit OUTSIDE 13ab pair; SEVENTEENTH payments-section audit. ★ THIRD SHARED-DOC AUDIT. ★ EXPECTED CLEAN META-AUDIT (3rd consecutive). 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-17 — ★ NO MFS MECHANISM NEEDED + ★ M2 RECURRENCE (6th recurrence in payments-section after 31+32+33+34+35); ★ 12 M2 instances now; ★ M2 firmly DOMINANT pass-through pattern in payments-section (6 consecutive M2 audits: 31→32→33→34→35→36); pattern distribution after 23 audits: 12 M2 + 4 M3 + 5 M4 + 2 degenerate',
    '**Per-input MFS-leakage analysis**: line 36 wiring spans two stages. Stage 1 (19942-19953) reads from `apply-to-next-year` personal form (per-return scoping; each MFS spouse files separately with their own form). Stage 2 (19970-19973) reads upstream `overpaid` (MFS-clean via line 34\'s M2 inheritance) and the Stage 1 local `line36`. No per-spouse data accessed; no MFS check needed. ★ **6th RECURRENCE of M2 in payments-section** (after 31+32+33+34+35). ★ **12 M2 instances now**. ★ M2 firmly DOMINANT (6 consecutive). ★ **21st orchestrator-method-based audit**. Pattern distribution after 23 audits: **12 M2** (+1 NEW) + 4 M3 + 5 M4 + 2 degenerate. MFS cascade UNCHANGED at 20.',
    'TaxReturnComputeService.java:19942-19953 (Stage 1) + 19970-19973 (Stage 2)',
    'CLOSED — ★ NO MFS MECHANISM NEEDED; ★ M2 RECURRENCE (6th in payments-section). Pattern distribution after 23 audits: **12 M2** + 4 M3 + 5 M4 + 2 degenerate. ★ M2 firmly DOMINANT (6 consecutive M2 audits: 31→32→33→34→35→36). MFS cascade UNCHANGED at 20. Pure cross-reference closure. 765/765 unchanged.'],

  [2, 'RESOLVED 2026-05-17 — ★ THIRD SHARED-DOC AUDIT (2nd recurrence of SHARED-DOC pattern after 34 + 35); ★ NO Legacy A migration possible/needed; ★ Convergence UNCHANGED at 39 lines',
    '**The situation**: Line 36 has NO dedicated documentation files — same as lines 34 + 35. Inventory: NO `lines/36.md` (covered by `lines/33.md §4`); NO `dependencies/36.md`; NO `knowledge_line36.md`; NO `flowcharts/36.drawio`; NO `diagrams/36.drawio`. ★ `knowledge_refund_and_amount_owed.md` covers the apply-to-next-year form UI mechanics. ★ **3rd SHARED-DOC AUDIT** (2nd recurrence of pattern). ★ Documentation sharing is STRUCTURALLY CORRECT. ★ NO Legacy A migration. ★ Convergence UNCHANGED at 39 lines.',
    'lines/33.md §4 "Line 36"; no separate lines/36.md',
    'CLOSED — ★ THIRD SHARED-DOC AUDIT in workflow (2nd recurrence of SHARED-DOC pattern after 34 + 35; pattern now firmly established). ★ NO Legacy A migration possible. ★ Convergence UNCHANGED at 39 lines. ★ SHARED-DOC AUDIT category continues to recur (expected at 37/38).'],

  [3, 'RESOLVED 2026-05-17 — ★ 3rd MULTI-ROW Verification log contribution — appended row 4 to existing lines/33.md §10 (rows 1-3 from 33+34+35 audits); ★ MULTI-ROW pattern continues for shared-doc audits',
    '**Goal**: append row 4 to existing `lines/33.md §10` Verification log. ★ **3rd MULTI-ROW contribution in workflow** (after 34 #3 and 35 #3). Row 4 in IN-PROGRESS state with #1-#3 closures; finalized to COMPLETE at Issue #10.',
    'C:\\us-tax\\lines\\33.md §10 (append row 4)',
    'CLOSED — row 4 APPENDED to existing §10 Verification log in lines/33.md with IN-PROGRESS state. Will be finalized at Issue #10. **★ 3rd MULTI-ROW contribution** — MULTI-ROW pattern continues firmly established. ★ Expected to continue at lines 37/38.'],

  [4, 'RESOLVED 2026-05-17 — ★ 21st META-AUDIT IN WORKFLOW — sub-type (b); ★ DOMINANCE to ~95% (20 of 21); ★ CLEAN — 6/6 consistency checks pass; ★ 3rd consecutive clean META-AUDIT after 34 #4 + 35 #4; ★ Includes COMPUTE-ORDER CORRECTION of prior line 35 closure note ("pre-set BEFORE line 33" → actually pre-set AFTER line 33 but BEFORE refund branch); ★ clean trend in sub-type (b) recovers from ~63% to ~65% (13 clean / 20)',
    '**The situation**: META-AUDIT cross-checks `lines/33.md §4 "Line 36"` + dependencies/33.md + knowledge/line-33-total-payments.md §3+§4 against actual line 36 code at TaxReturnComputeService.java:19942-19953 (Stage 1) + 19970-19973 (Stage 2). **★ 21st META-AUDIT in workflow**. **★ DOMINANCE to ~95% — 20 of 21**. **★ EXPECTED CLEAN** — 6/6 consistency checks: (a) ✅ Stage 1 reads personal form correctly; (b) ✅ Stage 2 caps via .min(overpaid); (c) ✅ `Refund.amountAppliedToNextYear` field documented; (d) ✅ PDF mapping `line36_applied_to_2025_estimated_tax` matches; (e) ✅ if-gate-around-setter pattern matches; (f) ✅ IRREVOCABLE election documented in spec/knowledge. ★ **CORRECTION**: prior line 35 closure note stated "line 36 is pre-set BEFORE line 33" — this is INCORRECT. Actual order: line 33 at 19937-19940 → line 36 Stage 1 at 19942-19953 (AFTER line 33) → refund branch at 19959+ (Stage 2 inside). Stage 1 is pre-set before the REFUND BRANCH, not before line 33. ★ **3rd consecutive clean META-AUDIT after 34 #4 + 35 #4**. ★ Clean trend in sub-type (b) recovers from ~63% to ~65% (13 clean / 20).',
    'lines/33.md §4; dependencies/33.md; knowledge/line-33-total-payments.md §3+§4; code at 19942-19953 + 19970-19973',
    'CLOSED — META-AUDIT consistency check complete. **★ 21st META-AUDIT in workflow**. **★ DOMINANCE to ~95% — 20 of 21 META-AUDITS use sub-type (b)**. **★ CLEAN** — 6/6 consistency checks pass. ★ **3rd consecutive clean META-AUDIT after 34 #4 + 35 #4**. ★ Includes COMPUTE-ORDER CORRECTION of prior line 35 closure note (line 36 is pre-set AFTER line 33 but BEFORE the refund branch — not before line 33 itself). ★ Clean trend in sub-type (b) recovers from ~63% to ~65% (13 clean / 20).'],

  [5, 'RESOLVED 2026-05-17 — VERIFIED CORRECT — line 36 wiring at line 19942-19953 + 19970-19973; ★ 30th anti-duplication application; ★ 25a #5 breadcrumb reuse 8th cross-audit reuse; ★ 5th reuse OUTSIDE 25abcd cluster (after 32 #5 + 33 #5 + 34 #5 + 35 #5); ★ load-bearing extends to TWO-STAGE CAPPED NUMERIC PASSTHROUGH territory',
    '**Closure intent**: pure cross-reference closure. Line 36 wiring lives inside `computeLine31ThroughLine38`. ★ The **25a #5 NEW VERIFIED CORRECT breadcrumb** at ~19688-19790 covers the entire method, with its compute-order section explicitly listing "Line 36". ★ **8th reuse total**. ★ **5th reuse OUTSIDE 25abcd cluster** — load-bearing extends to TWO-STAGE CAPPED NUMERIC PASSTHROUGH territory (14th complexity dimension). 3-source coverage: spec + dependencies + knowledge + 25a #5 breadcrumb. **★ 30th anti-duplication application**.',
    'TaxReturnComputeService.java:19942-19953 + 19970-19973 + ~19688 (25a #5 breadcrumb)',
    'CLOSED — verified correct via 25a #5 breadcrumb reuse + 3-source coverage. **★ 30th anti-duplication application**. ★ **25a #5 breadcrumb reuse 8th cross-audit reuse** (after 25b/25c/25d/32/33/34/35 #5). ★ **5th reuse OUTSIDE 25abcd cluster** — extends to TWO-STAGE CAPPED NUMERIC PASSTHROUGH territory. ★ Pattern decisively confirmed: method-level breadcrumbs durably load-bearing across all 14 complexity dimensions AND across non-adjacent code regions (line 36 spans Stage 1 + Stage 2).'],

  [6, 'RESOLVED 2026-05-17 — VERIFIED CORRECT — ★ NEW complexity dimension: TWO-STAGE CAPPED NUMERIC PASSTHROUGH (14th distinct); ★ 1st cross-region two-stage pattern in workflow (state shared between non-adjacent code regions via local variable)',
    '**Closure intent**: pure complexity-dimension classification. Line 36 wiring has a structurally distinct shape: (a) Stage 1 raw read with 3 gates (form null check + elects gate + raw > 0); (b) local `line36` variable carries state ~25 code lines forward; (c) Stage 2 cap via .min() inside overpayment branch; (d) if-gate-around-setter. ★ Distinct from line 30\'s SPLIT-STAGE GATED CREDIT (which had TWO helper methods sharing state via Java object + THREE co-outputs) — line 36 is single-method with TWO non-adjacent code regions sharing state via local variable + single output. ★ **NEW complexity dimension: TWO-STAGE CAPPED NUMERIC PASSTHROUGH** — 14th distinct dimension. ★ **Dimension count INCREASES from 13 to 14**.',
    'TaxReturnComputeService.java:19942-19953 (Stage 1) + 19970-19973 (Stage 2)',
    'CLOSED — verified correct via NEW complexity dimension. **★ NEW complexity dimension: TWO-STAGE CAPPED NUMERIC PASSTHROUGH** — 14th distinct (Stage 1 raw read + Stage 2 cap + if-gate setter; state shared across non-adjacent code regions via local variable; single output). ★ Dimension count INCREASES from 13 to 14. ★ 1st cross-region two-stage pattern in workflow. ★ Distinct from line 30\'s SPLIT-STAGE GATED CREDIT pattern (two methods + Java object + three co-outputs); line 36 is single-method + local variable + single output.'],

  [7, 'RESOLVED 2026-05-17 — VERIFIED CORRECT — ★ 4 CONVENTIONS (baseline minimum; tied with 31/32/33/34/35); ★ Convention 1 if-gate-around-setter 2nd recurrence (now 3 instances: line 31 + 35b/c/d + 36); ★ ternary-at-setter remains most-recurring Convention 1 mechanism at 4 instances',
    '**Closure intent**: pure verification closure. **Convention 1** Null-when-zero via **IF-GATE-AROUND-SETTER** at line 19971-19972: `if (line36Capped > 0) refund.setAmountAppliedToNextYear(line36Capped)`. ★ **2nd recurrence of line 31 mechanism** (after 35b/c/d was 1st recurrence; now 3 instances total: 31 + 35b/c/d + 36). **Convention 2** No SSN filtering. **Convention 3** MFJ aggregation transitively inherited. **Convention 4** MFS protection via ★ M2 transitive inheritance — ★ 6th M2-based Convention 4 in payments-section. ★ **4 CONVENTIONS** — baseline minimum (tied with 31/32/33/34/35). ★ Convention 1 mechanism standings: ternary-at-setter remains most-recurring at 4 instances (25d/32/33/35a); if-gate-around-setter rises to 3 instances (31/35b-c-d/36); GATED-NOT-SET at 1 (line 34); helper-returned-null still dominant elsewhere.',
    'TaxReturnComputeService.java:19971-19972 (if-gate-around-setter)',
    'CLOSED — verified correct. **★ 4 CONVENTIONS** (baseline minimum; tied with 31/32/33/34/35). ★ **Convention 1 if-gate-around-setter 2nd recurrence** (line 31 → 35b/c/d → 36; now 3 instances total). ★ Ternary-at-setter remains most-recurring Convention 1 mechanism at 4 instances (tied with PURE-SUM dimension overall). ★ Convention 1 mechanism standings firmly established with clear ranking — helper-returned-null dominant / ternary-at-setter 4 / if-gate-around-setter 3 / GATED-NOT-SET 1. ★ Convention 4 uses M2 transitive inheritance — 6th M2-based Convention 4 in payments-section.'],

  [8, 'RESOLVED 2026-05-17 — VERIFIED CORRECT — 0 routing distinctions + 0 reference data at line 36 wiring; ★ FLOOR tier expanded to 13 audits',
    '**Closure intent**: pure verification closure. **Routing**: ★ ZERO — gates are structural (form null check + elects gate + positivity + overpayment branch + capped > 0), not tax-rule routing. **Reference data**: ★ ZERO — no tax-year-specific constants at line 36 wiring. (Q1 2026 due date and irrevocability rule are IRS rules but NOT used in backend code.) ★ **FLOOR tier expanded to 13 audits**.',
    'spec lines/33.md §4 + dependencies/33.md + knowledge §3+§4',
    'CLOSED — verified correct. **Routing**: ★ ZERO distinctions (★ NOTE: all 5 gates are structural conditions, not tax-rule routing). **Reference data**: ★ ZERO constants at line 36 wiring site. (Q1 2026 due date + irrevocability are IRS rules with no backend representation.) ★ **FLOOR tier expanded to 13 audits** (★ floor cluster now contains 25a + 25b + 25c + 25d + 27b + 27c + 31 + 32 + 33 + 34 + 35 + 36). ★ Pattern firmly confirmed: all 14 complexity dimensions can cluster at FLOOR tier. ★ Workflow reference-data range firmly established 0-72 with 4 tiers.'],

  [9, 'RESOLVED 2026-05-17 — ⚠️ BUNDLED OBSERVATIONS — ★ Path A application (★ continues zero-outstanding-walkthroughs streak at 8 after 29 RESUMED + 30 + 31 + 32 + 33 + 34 + 35 continued); ★ 36th Path A application; ★ 8-audit zero-new-gaps streak; ★ WORKFLOW RECOVERY narrative continues dominant',
    '**Closure intent**: pure xlsx-flip observation bundle. Observations: (a) NO missing-diagrams/flowcharts gap for line 36 — shared-doc design covers via flowcharts/33.drawio + refund-and-amount-owed-ui.drawio. (b) THIRD SHARED-DOC AUDIT decision recorded in #2; not duplicated here. (c) Compute-order correction recorded in #4 META-AUDIT. **★ 36th PATH A APPLICATION**. **★ Continues zero-outstanding-walkthroughs streak at 8**. ★ **8-audit zero-new-gaps streak**. ★ Workflow recovery narrative continues dominant — 8 of 8 Path A vs. 4 of 5 drift surge.',
    'shared-doc design; no missing-diagrams gap',
    'CLOSED — pure observation bundle. (a) NO diagrams/36.drawio — structural-by-design (shared coverage). (b) NO flowcharts/36.drawio — same rationale. (c) THIRD SHARED-DOC AUDIT handled under #2. (d) NEW dimension handled under #6. (e) Compute-order correction handled under #4 META-AUDIT. (f) PDF field name "2025" is cosmetic naming legacy; correct semantic mapping. **★ 36th Path A application**. **★ Continues zero-outstanding-walkthroughs streak at 8**. ★ **8-audit zero-new-gaps streak**. ★ Workflow recovery narrative continues dominant — 8 of 8 Path A vs. 4 of 5 drift surge.'],

  [10, 'RESOLVED 2026-05-17 — BOUNDARY MILESTONE — Line 36 walkthrough complete at 10/10; ★ SEVENTEENTH payments-section audit; ★ THIRD SHARED-DOC AUDIT (2nd recurrence); ★ NEW complexity dimension TWO-STAGE CAPPED NUMERIC PASSTHROUGH (14th distinct); ★ M2 RECURRENCE 12 M2 instances; ★ Path A continues at 8; ★ 3rd MULTI-ROW Verification log contribution; ★ 21st META-AUDIT CLEAN (3rd consecutive); ★ includes compute-order correction',
    'Pure xlsx-flip + Verification log row 4 finalization — **CLOSES the 36 walkthrough at 10/10**. **Eight themes**: (1) ★ Structural positioning — 28th audit OUTSIDE 13ab pair; ★ SEVENTEENTH payments-section audit; 67th line; ★ THIRD SHARED-DOC AUDIT (2nd recurrence). (2) ★ M2 RECURRENCE — 6th in payments-section; **12 M2 instances**; pattern distribution after 23 audits: 12 M2 + 4 M3 + 5 M4 + 2 degenerate. (3) ★ 21st META-AUDIT — sub-type (b) at 95% DOMINANCE (20 of 21); ★ CLEAN; ★ 3rd consecutive clean after 34 #4 + 35 #4; clean trend recovers from ~63% to ~65%; ★ includes compute-order correction. (4) ★ 3rd SHARED-DOC AUDIT (Issue #2); ★ NO Legacy A; convergence UNCHANGED at 39. (5) ★ 3rd MULTI-ROW Verification log contribution (Issue #3: row 4 to lines/33.md §10). (6) ★ 4 CONVENTIONS baseline (Issue #7: tied with 31/32/33/34/35); ★ Convention 1 if-gate-around-setter 2nd recurrence (3 instances total: 31 + 35b/c/d + 36); ★ ternary-at-setter remains most-recurring at 4 instances. (7) ★ NEW complexity dimension TWO-STAGE CAPPED NUMERIC PASSTHROUGH (Issue #6: 14th distinct; cross-region state via local variable). (8) ★ 36th Path A application (Issue #9: streak at 8; 8-audit zero-new-gaps streak). **★ ALSO**: 25a #5 breadcrumb reuse 8th cross-audit reuse — 5th reuse OUTSIDE 25abcd cluster (Issue #5). **Cumulative through line 36**: **67 lines audited**; **667 audit issues closed total** (657 + 10); backend **765/765 pass** (UNCHANGED — 19th audit with zero new tests); MFS cascade = 20 orchestrators (unchanged); knowledge convergence = 39 lines (UNCHANGED); **★ 36 Path A applications** (+1; streak at 8); **★ 30 anti-duplication applications** (+1); **★ 0 new gaps surfaced at 36** (★ 8-audit zero-new-gaps streak); **★ 21 META-AUDITS** (+1; sub-type (b) at 95% DOMINANCE; CLEAN; clean trend recovers to ~65%); **★ 15 doc-drift fixes** (UNCHANGED); **★ 4 distinct MFS-protection mechanisms** (UNCHANGED — ★ M2 RECURRENCE; 12 M2 instances); **★ 14 distinct complexity dimensions** (+1 from 36 #6 — ★ NEW TWO-STAGE CAPPED NUMERIC PASSTHROUGH); **★ 4 CONVENTIONS baseline**. **Verification logs**: ... + 33 (row 1) + 34 (row 2) + 35 (row 3) + 36 (★ row 4). **Looking ahead — line 37 (Amount owed = line 24 − line 33, when line 24 > line 33)**: 29th audit OUTSIDE 13ab pair; EIGHTEENTH payments-section audit; ★ another CONDITIONAL-SUBTRACTION (mutually-exclusive branch with line 34); ★ 2nd recurrence of CONDITIONAL-SUBTRACTION dimension; ★ likely GATED-NOT-SET Convention 1 (mirrors line 34); ★ likely 22nd META-AUDIT.',
    'XLS/computations/36.xlsx audit-trail (this row); lines/33.md §10 row 4 FINALIZED to COMPLETE — 10/10 closed; ★ NO outstanding.md entry (Path A applied)',
    'CLOSED — 10/10. **67 lines; 667 issues; 765/765 backend (UNCHANGED — 19th audit with zero new tests); 20 orchestrators (UNCHANGED); 39-line knowledge convergence (UNCHANGED); 15 doc-drift fixes (UNCHANGED — 36 #4 CLEAN); ★ 36 Path A applications (+1; streak at 8); ★ 30 anti-duplication applications (+1); ★ 0 new gaps surfaced at 36 (★ 8-audit zero-new-gaps streak); ★ 3rd MULTI-ROW Verification log contribution; ★ 21 META-AUDITS (★ sub-type (b) at 95% DOMINANCE — 20 of 21; ★ CLEAN; ★ 3rd consecutive clean after 34 #4 + 35 #4; clean trend recovers to ~65%; ★ includes compute-order correction); ★ 4 distinct MFS-protection mechanisms (★ M2 RECURRENCE — 12 M2 instances; 6th in payments-section after 31+32+33+34+35); ★ 14 distinct complexity dimensions (+1 from 36 #6 — ★ NEW TWO-STAGE CAPPED NUMERIC PASSTHROUGH); ★ 4 CONVENTIONS baseline (tied with 31/32/33/34/35); ★ Convention 1 if-gate-around-setter 2nd recurrence (3 instances total); ★ Convention 1 mechanism standings firmly established with clear ranking; ★ 25a #5 breadcrumb reuse 8th cross-audit reuse (5th reuse OUTSIDE 25abcd cluster); ★ THIRD SHARED-DOC AUDIT in workflow**. ★ SEVENTEENTH payments-section audit. Next: line 37 (amount owed = line 24 − line 33; ★ another CONDITIONAL-SUBTRACTION — 2nd recurrence; ★ mutually-exclusive branch with line 34; ★ likely GATED-NOT-SET Convention 1 mirroring line 34).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 120 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 36 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Notes'],
  ['form1040.refund.amountAppliedToNextYear', 'Form 1040 page 2, line 36 (PDF key line36_applied_to_2025_estimated_tax)', '★ CANONICAL line 36 output. = min(line36 raw, overpaid); only set when > 0 and overpayment branch active.'],
  [],
  ['SAME-METHOD DOWNSTREAM (refund branch)'],
  ['Line 35a = line 34 − line 36 capped', '~line 19976-19977', '★ Refund amount directly reduced by line 36; capped value flows in via local var.'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Frontend PDF export (Form 1040 page 2)', 'form-tax-return-1040.component.ts', '`values["line36_applied_to_2025_estimated_tax"] = formatAmount(refund?.amountAppliedToNextYear)` (NOTE field name says "2025" but this is the 2026 estimated tax field).'],
  ['Form 8888 line 5 validation (indirect)', 'computeForm8888()', '★ Line 36 reduces line 35a which Form 8888 validates against totalAllocated.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 60 }, { wch: 70 }, { wch: 80 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
