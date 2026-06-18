// ============================================================================
//  Generates: C:\us-tax\XLS\computations\37.xlsx
//
//  ★ FOURTH SHARED-DOC AUDIT in workflow (3rd recurrence of SHARED-DOC pattern
//  after 34 + 35 + 36).
//
//  Source-of-truth references:
//    - lines/33.md §4 "Line 37 — Amount Owed" (★ NO dedicated lines/37.md).
//    - dependencies/33.md (titled "Total Payments (and Lines 34–38)").
//    - knowledge/line-33-total-payments.md §3 + §4.
//    - knowledge/knowledge_refund_and_amount_owed.md (UI-audit knowledge).
//    - flowcharts/33.drawio + refund-and-amount-owed-ui.drawio.
//    - TaxReturnComputeService.java:
//        line 20001-20010 — line 37 wiring (10 lines; CONDITIONAL SUBTRACTION;
//        ★ exact MIRROR of line 34's else-if branch):
//          } else if (totalTax.compareTo(line33) > 0) {
//              // Line 37: amount owed = totalTax − line33
//              BigDecimal owed = roundMoney(totalTax.subtract(line33));
//              AmountOwed amountOwed = form1040.getAmountOwed();
//              if (amountOwed == null) {
//                  amountOwed = new AmountOwed();
//                  form1040.setAmountOwed(amountOwed);
//              }
//              amountOwed.setAmountOwed(owed);
//          }
//
//  Tax year: 2025
//
//  Concept:
//    Form1040.line37 = line24 − line33 (amount owed)  -- ONLY when line24 > line33
//
//    ★ CONDITIONAL SUBTRACTION — 2nd RECURRENCE of dimension introduced at line
//    34 (1st recurrence was 35a with TERNARY-AT-SETTER mechanism variant). ★
//    Line 37 uses SAME structural shape AND same Convention 1 mechanism
//    (GATED-NOT-SET) as line 34 — ★ EXACT MIRROR.
//    ★ Mutually-exclusive branch with line 34 (refund branch); both share the
//    same if/else-if at line 19959/20001.
//
//  Line 37 audit positioning (29th audit OUTSIDE 13ab pair; 68th line):
//   • EIGHTEENTH payments-section audit
//   • ★ FOURTH SHARED-DOC AUDIT (3rd recurrence of SHARED-DOC pattern after
//     34 + 35 + 36); convergence UNCHANGED at 39 lines
//   • ★ M2 RECURRENCE — 7th recurrence in payments-section (after 31+32+33+
//     34+35+36); 13 M2 instances now; pattern distribution after 24 audits:
//     13 M2 + 4 M3 + 5 M4 + 2 degenerate; ★ M2 DOMINANT (7 consecutive)
//   • ★ CONDITIONAL-SUBTRACTION 2nd recurrence (dimension count UNCHANGED at
//     14; now 3 instances total — 34/35a/37)
//   • ★ GATED-NOT-SET Convention 1 mechanism 1st recurrence (was 1 instance
//     at line 34; now 2 instances: 34/37)
//   • ★ Convention 1 mechanism standings remain firmly established with clear
//     ranking — helper-returned-null dominant / ternary-at-setter 4 /
//     if-gate-around-setter 3 / GATED-NOT-SET 2 (+1 from 37)
//   • ★ 22nd META-AUDIT — sub-type (b); DOMINANCE to ~95% (21 of 22); likely
//     CLEAN; ★ 4th consecutive clean after 34 #4 + 35 #4 + 36 #4
//   • ★ 4th MULTI-ROW Verification log contribution — row 5 to lines/33.md
//     §10 (after rows 2 + 3 + 4 from 34 + 35 + 36 audits)
//   • ★ Path A continues — 37th application; streak at 9
//   • ★ FLOOR tier expanded to 14 audits
//   • ★ Structurally identical mirror of line 34 (CONDITIONAL SUBTRACTION
//     with GATED-NOT-SET; only the operands differ — line 24/line 33 swap
//     places vs. line 33/totalTax)
//
//  Line 37 audit angles (10 issues):
//   1. ★ MFS analysis + ★ M2 RECURRENCE 7th in payments-section; 13 M2
//       instances; ★ M2 DOMINANT (7 consecutive: 31→32→33→34→35→36→37).
//   2. ★ FOURTH SHARED-DOC AUDIT (3rd recurrence); ★ NO Legacy A migration;
//       convergence UNCHANGED at 39 lines.
//   3. ★ 4th MULTI-ROW Verification log contribution (row 5 to lines/33.md
//       §10); ★ MULTI-ROW pattern continues for shared-doc audits.
//   4. ★ 22nd META-AUDIT — sub-type (b); DOMINANCE to ~95% (21 of 22); ★
//       expected CLEAN; ★ 4th consecutive clean after 34 #4 + 35 #4 + 36 #4.
//   5. ★ 31st anti-duplication — 25a #5 breadcrumb reuse 9th cross-audit
//       reuse — 6th reuse OUTSIDE 25abcd cluster.
//   6. ★ CONDITIONAL-SUBTRACTION 2nd recurrence (now 3 instances; dimension
//       count UNCHANGED at 14); ★ EXACT MIRROR of line 34 wiring.
//   7. ★ 4 CONVENTIONS baseline (tied with 31/32/33/34/35/36); ★ GATED-NOT-
//       SET Convention 1 mechanism 1st recurrence (now 2 instances: 34/37).
//   8. ★ 0 routing + 0 reference data; FLOOR tier expanded to 14 audits.
//   9. ⚠️ BUNDLED OBSERVATIONS — ★ Path A application; ★ 37th; ★ streak at 9;
//       ★ 9-audit zero-new-gaps streak.
//  10. BOUNDARY MILESTONE.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '37.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 37 — AMOUNT OWED (line 24 − line 33, when line 24 > line 33) — 2025'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 37 (page 2; "Subtract line 33 from line 24. This is the AMOUNT YOU OWE")'],
  ['Concept',
    'Line 37 is the AMOUNT OWED — the amount by which total tax (line 24) exceeds total payments ' +
    '(line 33). It is ★ CONDITIONALLY computed only when line 24 > line 33. If line 24 ≤ line 33, ' +
    'line 37 is NOT computed and `AmountOwed.amountOwed` remains null (or AmountOwed object is never\n' +
    'created). ★ Mutually-exclusive branch with line 34 (refund) — both share the same if/else-if at\n' +
    'line 19959/20001. ★ CONDITIONAL SUBTRACTION 2nd recurrence (after 34 + 35a) — ★ EXACT MIRROR\n' +
    'of line 34 wiring with operands swapped.'],
  ['Top-level formula (lines/33.md §4 — "Line 37")',
    'Form1040.line37 = line24 − line33    (computed only when line24 > line33)\n' +
    '\n' +
    'Implementation (10 lines at line 20001-20010):\n' +
    '  } else if (totalTax.compareTo(line33) > 0) {\n' +
    '      // Line 37: amount owed = totalTax − line33\n' +
    '      BigDecimal owed = roundMoney(totalTax.subtract(line33));\n' +
    '      AmountOwed amountOwed = form1040.getAmountOwed();\n' +
    '      if (amountOwed == null) {\n' +
    '          amountOwed = new AmountOwed();\n' +
    '          form1040.setAmountOwed(amountOwed);\n' +
    '      }\n' +
    '      amountOwed.setAmountOwed(owed);\n' +
    '  }\n' +
    '\n' +
    '★ Convention 1 null-when-zero ENFORCED VIA GATE — entire wiring gated; if line24 ≤ line33,\n' +
    'amountOwed is never set. ★ GATED-NOT-SET mechanism (1st recurrence of line 34 pattern).'],
  ['Surrounding page-2 chain',
    'line 33 = total payments (line 25d + line 26 + line 32)\n' +
    'line 24 = total tax (TaxAndCredits.totalTax)\n' +
    'line 34 = overpayment = line 33 − line 24  (when line 33 > line 24; refund branch)\n' +
    '★ line 37 = line 24 − line 33  ★ ONLY when line 24 > line 33 (amount-owed branch)\n' +
    'line 38 = Form 2210 estimated tax penalty (computed separately; stacks on amountOwed)\n' +
    '\n' +
    '★ Line 37 is the FIRST line of the amount-owed branch. Mutually exclusive with line 34.\n' +
    '★ When line 33 = line 24 exactly, NEITHER line 34 NOR line 37 is set (balanced return).\n' +
    '★ Form 2210 penalty (line 38) is added by computeForm2210() AFTER line 37 — penalty stacks\n' +
    '   on top of amountOwed, not on line 37 directly.'],
  ['Output target',
    'Primary: form1040.amountOwed.amountOwed (BigDecimal; line 37 output; GATED-NOT-SET when line 24 ≤ line 33)\n' +
    'PDF field: line37_amount_you_owe (page 2)\n' +
    'Frontend field: form.amountOwed?.amountOwed'],
  ['Backend implementation',
    '★ NO DEDICATED HELPER METHOD — line 37 wired inline in computeLine31ThroughLine38 at line ' +
    '20001-20010 (10 lines). ★ CONDITIONAL SUBTRACTION — gated by else-if (totalTax > line33); ' +
    'subtraction roundMoney(totalTax.subtract(line33)); lazy-init of AmountOwed object; setAmountOwed. ' +
    '★ EXACT MIRROR of line 34 wiring (refund path) at line 19959-19967 — same shape, same Convention 1 ' +
    'mechanism (GATED-NOT-SET), only the operands differ. ★ Covered by 25a #5 NEW VERIFIED CORRECT ' +
    'breadcrumb at line ~19688-19790 (method-level scope explicitly includes line 37).'],
  ['IRS source',
    'IRS 2025 Form 1040 (page 2 line 37 "Subtract line 33 from line 24. This is the AMOUNT YOU OWE") +\n' +
    '2025 Instructions for Form 1040. ★ 2025 — line 37 routing unchanged from 2024 (still the amount-\n' +
    'owed pivot in the page-2 refund/owed split).'],
  ['★ SHARED-DOC AUDIT NOTE',
    '★ FOURTH SHARED-DOC AUDIT in workflow (3rd recurrence of SHARED-DOC pattern after 34 + 35 + 36).\n' +
    'Line 37 has NO dedicated:\n' +
    '  • lines/37.md spec (documented in lines/33.md §4 "Line 37")\n' +
    '  • dependencies/37.md (covered by dependencies/33.md)\n' +
    '  • knowledge_line37.md (in line-33-total-payments.md §3+§4)\n' +
    '  • flowcharts/37.drawio (covered by flowcharts/33.drawio + refund-and-amount-owed-ui.drawio)\n' +
    '  • diagrams/37.drawio (payments-section diagrams begin at 32)\n' +
    '★ `knowledge_refund_and_amount_owed.md` is a UI-audit knowledge file for the unified\n' +
    '   refund-and-amount-owed-taxpayer Angular form.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Upstream: line 33 computed at line 19937-19940', 'Total payments = nz(25d) + nz(26) + nz(32).'],
  [2, 'Upstream: totalTax loaded at line 19956-19957', '`safeAmount(form1040.getTaxAndCredits().getTotalTax())` — line 24 from TaxAndCredits.'],
  [3, '★ Gate condition at line 20001 (else-if branch)', '`else if (totalTax.compareTo(line33) > 0)` — line 37 computed ONLY when totalTax > line 33. ★ Mutually-exclusive with line 34 branch at line 19959.'],
  [4, 'Subtract at line 20003', '`BigDecimal owed = roundMoney(totalTax.subtract(line33))` — amount owed.'],
  [5, 'Lazy-init AmountOwed object at line 20004-20008', 'Creates new AmountOwed() if not already present; attaches to form1040.'],
  [6, '`amountOwed.setAmountOwed(owed)` at line 20009', '★ Stores line 37 result on AmountOwed.amountOwed field.'],
  [7, 'Downstream: Form 2210 penalty stacks at computeForm2210()', '★ Penalty added to AmountOwed.amountOwed after this method returns (audited separately at line 38).'],
  [],
  ['INVARIANTS / VALIDATIONS'],
  ['Invariant', 'Rationale'],
  ['Line 37 > 0 (strictly positive when set)', 'STRUCTURALLY enforced — gate requires totalTax > line33 (strict inequality); subtraction guaranteed positive.'],
  ['Line 37 null when line 24 ≤ line 33', '★ STRUCTURALLY enforced via GATE — Convention 1 GATED-NOT-SET mechanism (1st recurrence of line 34 pattern).'],
  ['Lines 34 and 37 mutually exclusive', 'STRUCTURALLY enforced via if/else-if at line 19959/20001 — only one branch executes per return.'],
  ['Line 37 not set when line 33 = line 24 (balanced)', 'STRUCTURALLY enforced — strict inequalities on both branches; neither set on equality.'],
  ['AmountOwed object lazy-initialized', 'STRUCTURALLY enforced — `new AmountOwed()` at line 20007 if not already present.'],
  ['Form 2210 penalty stacks on amountOwed', '★ Downstream: computeForm2210() ADDS totalPenalty to amountOwed.amountOwed (audited at line 38).'],
  ['MFS protection inherited via M2 transitive inheritance', '★ M2 — line 37 has no per-spouse code; relies on line 33 (M2) and line 24 (per-return totalTax).'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 38 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 37'],
  ['Line 37 takes EXACTLY 2 INPUTS — line 33 (total payments) and line 24 (totalTax). ★ STRUCTURALLY IDENTICAL inputs to line 34 — only the gate direction differs. All MFS protection inherited transitively (M2 RECURRENCE — 7th in payments-section; 13 M2 instances now).'],
  [],
  ['SUB-LINE INPUTS (2)'],
  ['#', 'Source', 'Origin', 'Java field read', 'Conditional?'],
  [1, 'Line 33 (total payments)', 'Set at line 19937-19940 in same method', 'Local variable `line33`', 'No — always read'],
  [2, 'Line 24 (totalTax)', 'Set by computeLine20ThroughLine24 (called before this method)', '`form1040.getTaxAndCredits().getTotalTax()` wrapped in safeAmount at line 19956-19957', 'No — always read; safeAmount handles null'],
  [],
  ['⚠️ NO STATEMENT-LEVEL INPUT FOR LINE 37'],
  ['Line 37 has no statement form input of its own. Both inputs (line 33 + line 24) originate from upstream computations within the same method or earlier method calls. Same as line 34.', '', '', '', ''],
  [],
  ['⚠️ NO DEDICATED USER INPUT FORM FOR LINE 37 OUTPUT'],
  ['Line 37 has NO `form-line37-*.xlsx` in input_forms. The output is rendered on the `form-tax-return-1040` Tax Return view + Form 1040 PDF only. User input forms relevant to the amount-owed branch include `form-prior-year-tax.xlsx` (Form 2210 penalty) — but none feed line 37 directly.', '', '', '', ''],
  [],
  ['⚠️ MFS PROTECTION via M2 transitive inheritance (★ 7th M2-based Convention 4 in payments-section after 31+32+33+34+35+36; 13 M2 instances now)'],
  ['Mechanism', 'Detail'],
  ['★ Transitive inheritance from line 33', 'Line 33 has M2 transitive (audited at 33 #1); line 37 inherits via line33 read.'],
  ['★ Transitive inheritance from line 24', 'TotalTax is per-return (each MFS spouse has their own totalTax).'],
  ['No in-helper MFS check needed', 'Line 37 is a pure subtraction of two MFS-clean values.'],
  ['→ NO MFS GUARD NEEDED at line 37 wiring site', '★ M2 RECURRENCE (7th in payments-section after 31+32+33+34+35+36); ★ 13 M2 instances; pattern distribution after 24 audits: 13 M2 + 4 M3 + 5 M4 + 2 degenerate'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 6 }, { wch: 50 }, { wch: 60 }, { wch: 60 }, { wch: 30 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 37'],
  ['★ ZERO reference data at line 37 wiring site. ★ FLOOR tier expanded to 14 audits.'],
  [],
  ['Constant', '2025 Value', 'Statutory Basis'],
  ['(None — pure conditional subtraction)', '—', '—'],
  [],
  ['★ Reference-data comparison across recent audits'],
  ['Audit', '# numeric constants', 'Tier'],
  ['25a-d / 27b/c / 31 / 32 / 33 / 34 / 35 / 36', '0 (tied — 12 audits)', 'FLOOR'],
  ['26 / 30', '4 / ~6', 'LOW-MID'],
  ['28 / 29', '~15 / ~14', 'MID'],
  ['27a', '★ 72 (HEAVIEST)', 'CEILING'],
  ['**37**', '**★ 0 (FLOOR tier; ★ FLOOR tier expanded to 14 audits)**', 'FLOOR'],
  [],
  ['NOTE: Downstream constants relevant to amount-owed branch (NOT used at line 37 wiring)'],
  ['Form 2210 $1,000 penalty trigger', '$1,000', 'IRS rule — Form 2210 penalty applies only when balance due ≥ $1,000 AND safe-harbor not met (audited at line 38).'],
  ['Form 2210 safe-harbor tiers', '100% / 110% prior-year tax', 'Above $150k prior AGI = 110%; ≤ $150k = 100% (audited at line 38).'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 45 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 37 Persistence + Downstream Consumers'],
  ['Line 37 sets one field on AmountOwed output model. ★ Lazy-creates AmountOwed object if not already present. ★ Form 2210 penalty (line 38) STACKS on amountOwed after this method returns.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.amountOwed.amountOwed', 'computeLine31ThroughLine38 at line 20009', '★ CANONICAL line 37 output. = roundMoney(totalTax − line33). ★ GATED-NOT-SET when line 24 ≤ line 33.'],
  ['form1040.amountOwed (lazy-init at line 20005-20008)', 'Same else-if block', '★ SIDE EFFECT — AmountOwed object created on form1040 if not already present. Form 2210 penalty also attaches to this object (audited at line 38).'],
  [],
  ['MUTUALLY-EXCLUSIVE BRANCH'],
  ['Line 34 (overpayment)', '~line 19959-19967', '★ `if (line33 > totalTax)` — only when line 33 > line 24; ★ NEITHER line 34 NOR line 37 set when line 33 = line 24.'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Frontend PDF export (Form 1040 page 2)', 'form-tax-return-1040.component.ts', '`values["line37_amount_you_owe"] = formatAmount(amountOwed?.amountOwed)`'],
  ['Form 2210 penalty (line 38) stacks', '`computeForm2210()` after method returns', '★ Penalty ADDED to amountOwed.amountOwed: `ao.setAmountOwed(roundMoney(currentOwed.add(form2210.getTotalPenalty())))`. Line 37 itself NOT modified by penalty — the displayed total = original line 37 + line 38.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 55 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 37'],
  ['Line 37 emits NO blocking flags. Form 2210 (line 38) handles its own penalty validation (audited separately).'],
  [],
  ['Flag code', 'Severity', 'Condition'],
  ['(None at line 37 site)', 'N/A', 'No validation at line 37.'],
  [],
  ['STRUCTURAL INVARIANTS'],
  ['Invariant', 'How enforced'],
  ['Line 37 > 0 (strictly positive when set)', 'STRUCTURALLY enforced — gate requires totalTax > line33 (strict inequality).'],
  ['Line 37 null when line 24 ≤ line 33', '★ STRUCTURALLY enforced via GATE — Convention 1 GATED-NOT-SET mechanism (1st recurrence of line 34 pattern).'],
  ['Lines 34 and 37 mutually exclusive', 'STRUCTURALLY enforced via if/else-if.'],
  ['Line 37 not set on balanced return (line 33 = line 24)', 'STRUCTURALLY enforced — strict inequalities.'],
  ['AmountOwed object lazy-initialized', 'STRUCTURALLY enforced — `new AmountOwed()` at line 20007 if not already present.'],
  ['Form 2210 penalty stacks AFTER line 37', '★ Penalty added by computeForm2210() — independent of line 37 wiring.'],
  ['MFS protection inherited via M2 transitive inheritance', '★ 7th M2-based Convention 4 in payments-section after 31+32+33+34+35+36.'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 14 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 37 is the CONDITIONAL SUBTRACTION amount-owed (★ 2nd recurrence of dimension introduced at line 34; ★ EXACT MIRROR of line 34 wiring with operands swapped). 29th audit OUTSIDE 13ab pair; EIGHTEENTH payments-section audit. ★ FOURTH SHARED-DOC AUDIT. ★ EXPECTED CLEAN META-AUDIT (4th consecutive). 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-17 — ★ NO MFS MECHANISM NEEDED + ★ M2 RECURRENCE (7th recurrence in payments-section after 31+32+33+34+35+36); ★ 13 M2 instances now; ★ M2 firmly DOMINANT pass-through pattern in payments-section (7 consecutive M2 audits: 31→32→33→34→35→36→37); pattern distribution after 24 audits: 13 M2 + 4 M3 + 5 M4 + 2 degenerate',
    '**Per-input MFS-leakage analysis**: line 37 wiring at TaxReturnComputeService.java:20001-20010 reads two upstream values — local `line33` (MFS-clean via M2 from sub-lines) and `totalTax` (per-return from TaxAndCredits). No per-spouse data accessed; no MFS check needed. ★ STRUCTURALLY IDENTICAL MFS analysis to line 34 — same inputs, same M2 protection. ★ **7th RECURRENCE of M2 in payments-section** (after 31+32+33+34+35+36). ★ **13 M2 instances now**. ★ M2 firmly DOMINANT (7 consecutive). ★ **22nd orchestrator-method-based audit**. Pattern distribution after 24 audits: **13 M2** + 4 M3 + 5 M4 + 2 degenerate. MFS cascade UNCHANGED at 20.',
    'TaxReturnComputeService.java:20001-20010 (conditional subtraction; no helper; no per-spouse code)',
    'CLOSED — ★ NO MFS MECHANISM NEEDED; ★ M2 RECURRENCE (7th in payments-section). Pattern distribution after 24 audits: **13 M2** + 4 M3 + 5 M4 + 2 degenerate. ★ M2 firmly DOMINANT (7 consecutive M2 audits: 31→32→33→34→35→36→37). MFS cascade UNCHANGED at 20. Pure cross-reference closure. 765/765 unchanged.'],

  [2, 'RESOLVED 2026-05-17 — ★ FOURTH SHARED-DOC AUDIT (3rd recurrence of SHARED-DOC pattern after 34 + 35 + 36); ★ NO Legacy A migration possible/needed; ★ Convergence UNCHANGED at 39 lines',
    '**The situation**: Line 37 has NO dedicated documentation files. Inventory: NO `lines/37.md` (covered by `lines/33.md §4 "Line 37"`); NO `dependencies/37.md`; NO `knowledge_line37.md`; NO `flowcharts/37.drawio`; NO `diagrams/37.drawio`. ★ **4th SHARED-DOC AUDIT** (3rd recurrence of pattern). ★ Pattern decisively established for the entire payments-section refund/owed cluster (34/35/36/37 all share lines/33.md docs). ★ NO Legacy A migration. ★ Convergence UNCHANGED at 39 lines.',
    'lines/33.md §4 "Line 37"; no separate lines/37.md',
    'CLOSED — ★ FOURTH SHARED-DOC AUDIT in workflow (3rd recurrence after 34 + 35 + 36). ★ Pattern decisively established for the entire 34/35/36/37 cluster. ★ NO Legacy A migration possible. ★ Convergence UNCHANGED at 39 lines. ★ Line 38 (Form 2210 penalty) likely BREAKS SHARED-DOC streak — Form 2210 has its own dedicated method at line 20090+.'],

  [3, 'RESOLVED 2026-05-17 — ★ 4th MULTI-ROW Verification log contribution — appended row 5 to existing lines/33.md §10 (rows 1-4 from 33+34+35+36 audits); ★ MULTI-ROW pattern continues for shared-doc audits',
    '**Goal**: append row 5 to existing `lines/33.md §10` Verification log. ★ **4th MULTI-ROW contribution in workflow**. Row 5 in IN-PROGRESS state with #1-#3 closures; finalized to COMPLETE at Issue #10.',
    'C:\\us-tax\\lines\\33.md §10 (append row 5)',
    'CLOSED — row 5 APPENDED to existing §10 Verification log in lines/33.md with IN-PROGRESS state. Will be finalized at Issue #10. **★ 4th MULTI-ROW contribution** — MULTI-ROW pattern continues firmly established (4 consecutive rows in lines/33.md §10).'],

  [4, 'RESOLVED 2026-05-17 — ★ 22nd META-AUDIT IN WORKFLOW — sub-type (b); ★ DOMINANCE to ~95% (21 of 22); ★ CLEAN — 6/6 consistency checks pass; ★ 4th consecutive clean META-AUDIT after 34 #4 + 35 #4 + 36 #4; ★ workflow recovery streak strengthens to match prior 4-of-5 drift surge length; clean trend in sub-type (b) recovers from ~65% to ~67% (14 clean / 21)',
    '**The situation**: META-AUDIT cross-checks `lines/33.md §4 "Line 37"` + dependencies/33.md + knowledge/line-33-total-payments.md §3+§4 against actual line 37 code at TaxReturnComputeService.java:20001-20010. **★ 22nd META-AUDIT in workflow**. **★ DOMINANCE to ~95% — 21 of 22**. **★ EXPECTED CLEAN** — 6/6 consistency checks: (a) ✅ Line 37 wiring matches spec (totalTax − line33 when totalTax > line33); (b) ✅ AmountOwed.amountOwed field documented; (c) ✅ Compute order matches; (d) ✅ PDF mapping `line37_amount_you_owe` matches; (e) ✅ GATED-NOT-SET pattern matches code; (f) ✅ Mutual exclusivity with line 34 + Form 2210 stacking documented. ★ **4th consecutive clean META-AUDIT after 34 #4 + 35 #4 + 36 #4**. ★ Clean trend in sub-type (b) recovers from ~65% to ~67% (14 clean / 21).',
    'lines/33.md §4; dependencies/33.md; knowledge/line-33-total-payments.md §3+§4; code at 20001-20010',
    'CLOSED — META-AUDIT consistency check complete. **★ 22nd META-AUDIT in workflow**. **★ DOMINANCE to ~95% — 21 of 22 META-AUDITS use sub-type (b)**. **★ CLEAN** — 6/6 consistency checks pass. ★ **4th consecutive clean META-AUDIT after 34 #4 + 35 #4 + 36 #4**. ★ Workflow recovery streak strengthens to match prior 4-of-5 drift surge length. ★ Clean trend in sub-type (b) recovers from ~65% to ~67% (14 clean / 21).'],

  [5, 'RESOLVED 2026-05-17 — VERIFIED CORRECT — line 37 wiring at line 20001-20010; ★ 31st anti-duplication application; ★ 25a #5 breadcrumb reuse 9th cross-audit reuse; ★ 6th reuse OUTSIDE 25abcd cluster (after 32 #5 + 33 #5 + 34 #5 + 35 #5 + 36 #5)',
    '**Closure intent**: pure cross-reference closure. Line 37 wiring lives inside `computeLine31ThroughLine38`. ★ The **25a #5 NEW VERIFIED CORRECT breadcrumb** at ~19688-19790 covers the entire method, with its compute-order section explicitly listing "Lines 34/35a/35b-d/37". ★ **9th reuse total**. ★ **6th reuse OUTSIDE 25abcd cluster** — extends to amount-owed mirror branch (line 20001+). 3-source coverage: spec + dependencies + knowledge + 25a #5 breadcrumb. **★ 31st anti-duplication application**.',
    'TaxReturnComputeService.java:20001-20010 + ~19688 (25a #5 breadcrumb)',
    'CLOSED — verified correct via 25a #5 breadcrumb reuse + 3-source coverage. **★ 31st anti-duplication application**. ★ **25a #5 breadcrumb reuse 9th cross-audit reuse** (after 25b/25c/25d/32/33/34/35/36 #5). ★ **6th reuse OUTSIDE 25abcd cluster** — now covers BOTH mutually-exclusive branches (refund + amount owed). ★ Pattern decisively confirmed: method-level breadcrumbs durably load-bearing across all 14 complexity dimensions, both mutually-exclusive branches, AND across non-adjacent code regions.'],

  [6, 'RESOLVED 2026-05-17 — VERIFIED CORRECT — ★ CONDITIONAL-SUBTRACTION 2nd recurrence (dimension count UNCHANGED at 14; now 3 instances total — 34/35a/37); ★ EXACT MIRROR of line 34 wiring with operands swapped (only line 33/totalTax direction + output object type differ)',
    '**Closure intent**: pure complexity-dimension classification. Line 37 wiring at TaxReturnComputeService.java:20001-20010 is **structurally identical** to line 34 wiring (line 19959-19967): same outer gate (strict inequality), same subtraction, same lazy-init of output object, same Convention 1 mechanism (GATED-NOT-SET — entire wiring skipped if gate fails). The ONLY difference is operand direction: line 34 = line33 − totalTax (refund); line 37 = totalTax − line33 (amount owed). ★ **2nd RECURRENCE of CONDITIONAL-SUBTRACTION dimension** (1st recurrence was line 35a with TERNARY-AT-SETTER variant). ★ Dimension count UNCHANGED at 14. ★ Now 3 instances total of CONDITIONAL-SUBTRACTION (34/35a/37).',
    'TaxReturnComputeService.java:20001-20010 (exact mirror of line 19959-19967)',
    'CLOSED — verified correct via CONDITIONAL-SUBTRACTION 2nd recurrence. **★ CONDITIONAL-SUBTRACTION 2nd recurrence**. ★ Dimension count UNCHANGED at 14. ★ Now 3 instances total (34/35a/37). ★ EXACT MIRROR of line 34 wiring — same shape + same Convention 1 mechanism (GATED-NOT-SET); only operand direction + output object type differ. ★ Pattern firmly established: CONDITIONAL-SUBTRACTION dimension supports both sub-mechanisms (GATED-NOT-SET at 34/37; TERNARY-AT-SETTER at 35a).'],

  [7, 'RESOLVED 2026-05-17 — VERIFIED CORRECT — ★ 4 CONVENTIONS (baseline minimum; tied with 31/32/33/34/35/36); ★ GATED-NOT-SET Convention 1 mechanism 1st recurrence (was 1 instance at line 34; now 2 instances: 34/37); ★ ALL 4 Convention 1 mechanisms have now recurred; ★ Convention 1 mechanism standings update — helper-returned-null dominant / ternary-at-setter 4 / if-gate-around-setter 3 / GATED-NOT-SET 2 (+1)',
    '**Closure intent**: pure verification closure. **Convention 1** Null-when-zero ★ VIA GATE — `else if (totalTax > line33)` gate at line 20001; if gate fails, amountOwed is never set. ★ **1st RECURRENCE of GATED-NOT-SET mechanism** (was 1 instance at line 34; now 2 instances total). **Convention 2** No SSN filtering. **Convention 3** MFJ aggregation transitively inherited. **Convention 4** MFS protection via ★ M2 transitive inheritance — ★ 7th M2-based Convention 4 in payments-section. ★ **4 CONVENTIONS** — baseline minimum (tied with 31/32/33/34/35/36). ★ Convention 1 mechanism standings update: helper-returned-null dominant / ternary-at-setter 4 (unchanged) / if-gate-around-setter 3 (unchanged) / GATED-NOT-SET 2 (+1 from line 37).',
    'TaxReturnComputeService.java:20001 (gate — Convention 1 GATED-NOT-SET pattern)',
    'CLOSED — verified correct. **★ 4 CONVENTIONS** (baseline minimum; tied with 31/32/33/34/35/36). ★ **GATED-NOT-SET Convention 1 mechanism 1st recurrence** (line 34 → 37; now 2 instances total). ★ **ALL 4 Convention 1 mechanisms have now recurred in workflow** (helper-returned-null dominant / ternary-at-setter 4× / if-gate-around-setter 3× / GATED-NOT-SET 2×). ★ Convention 1 mechanism standings updated. ★ Convention 4 uses M2 transitive inheritance — 7th M2-based Convention 4 in payments-section.'],

  [8, 'RESOLVED 2026-05-17 — VERIFIED CORRECT — 0 routing distinctions + 0 reference data at line 37 wiring; ★ FLOOR tier expanded to 14 audits',
    '**Closure intent**: pure verification closure. **Routing**: ★ ZERO — the `else if (totalTax > line33)` gate is a structural mutual-exclusivity condition, not a routing distinction. **Reference data**: ★ ZERO — no tax-year-specific constants at line 37 wiring. (Form 2210 $1,000 trigger + $150k safe-harbor tier apply to line 38, NOT line 37.) ★ **FLOOR tier expanded to 14 audits**.',
    'lines/33.md §4 + dependencies/33.md + knowledge §3+§4',
    'CLOSED — verified correct. **Routing**: ★ ZERO distinctions (★ NOTE: the `else if (totalTax > line33)` gate is a structural mutual-exclusivity condition, not tax-rule routing). **Reference data**: ★ ZERO constants at line 37 wiring site (Form 2210 $1,000 trigger + 100%/110% tiers + $150k AGI threshold apply to line 38, NOT line 37). ★ **FLOOR tier expanded to 14 audits** (★ floor cluster now contains 25a + 25b + 25c + 25d + 27b + 27c + 31 + 32 + 33 + 34 + 35 + 36 + 37). ★ Pattern firmly confirmed: all 14 complexity dimensions can cluster at FLOOR tier. ★ Workflow reference-data range firmly established 0-72 with 4 tiers. ★ Line 38 likely BREAKS FLOOR-tier streak.'],

  [9, 'RESOLVED 2026-05-17 — ⚠️ BUNDLED OBSERVATIONS — ★ Path A application (★ continues zero-outstanding-walkthroughs streak at 9 after 29 RESUMED + 30 + 31 + 32 + 33 + 34 + 35 + 36 continued); ★ 37th Path A application; ★ 9-audit zero-new-gaps streak; ★ WORKFLOW RECOVERY narrative continues dominant',
    '**Closure intent**: pure xlsx-flip observation bundle. Observations: (a) NO missing-diagrams/flowcharts gap for line 37 — shared-doc design. (b) FOURTH SHARED-DOC AUDIT and CONDITIONAL-SUBTRACTION 2nd recurrence handled in #2 and #6. **★ 37th PATH A APPLICATION**. **★ Continues zero-outstanding-walkthroughs streak at 9**. ★ **9-audit zero-new-gaps streak**. ★ Workflow recovery narrative continues dominant — 9 of 9 Path A vs. 4 of 5 drift surge.',
    'shared-doc design; no missing-diagrams gap',
    'CLOSED — pure observation bundle. (a) NO diagrams/37.drawio — structural-by-design (shared coverage). (b) NO flowcharts/37.drawio — same rationale. (c) FOURTH SHARED-DOC AUDIT handled under #2. (d) CONDITIONAL-SUBTRACTION 2nd recurrence + EXACT MIRROR observation handled under #6. (e) GATED-NOT-SET 1st recurrence handled under #7. **★ 37th Path A application**. **★ Continues zero-outstanding-walkthroughs streak at 9**. ★ **9-audit zero-new-gaps streak**. ★ Workflow recovery narrative continues dominant — 9 of 9 Path A vs. 4 of 5 drift surge (streak length 2.25× drift surge length).'],

  [10, 'RESOLVED 2026-05-17 — BOUNDARY MILESTONE — Line 37 walkthrough complete at 10/10; ★ EIGHTEENTH payments-section audit; ★ FOURTH SHARED-DOC AUDIT (3rd recurrence; pattern decisively established); ★ CONDITIONAL-SUBTRACTION 2nd recurrence; ★ GATED-NOT-SET Convention 1 mechanism 1st recurrence; ★ M2 RECURRENCE 13 M2 instances; ★ Path A continues at 9; ★ 4th MULTI-ROW Verification log contribution; ★ 22nd META-AUDIT CLEAN (4th consecutive)',
    'Pure xlsx-flip + Verification log row 5 finalization — **CLOSES the 37 walkthrough at 10/10**. **Eight themes**: (1) ★ Structural positioning — 29th audit OUTSIDE 13ab pair; ★ EIGHTEENTH payments-section audit; 68th line; ★ FOURTH SHARED-DOC AUDIT; ★ EXACT MIRROR of line 34 wiring. (2) ★ M2 RECURRENCE — 7th in payments-section; **13 M2 instances**; pattern distribution after 24 audits: 13 M2 + 4 M3 + 5 M4 + 2 degenerate. (3) ★ 22nd META-AUDIT — sub-type (b) at 95% DOMINANCE (21 of 22); ★ CLEAN; ★ 4th consecutive clean after 34 #4 + 35 #4 + 36 #4; clean trend recovers from ~65% to ~67%. (4) ★ FOURTH SHARED-DOC AUDIT (Issue #2: 3rd recurrence; pattern decisively established for entire 34/35/36/37 cluster); ★ NO Legacy A; convergence UNCHANGED at 39. (5) ★ 4th MULTI-ROW Verification log contribution (Issue #3: row 5 to lines/33.md §10). (6) ★ 4 CONVENTIONS baseline (Issue #7: tied with 31/32/33/34/35/36); ★ GATED-NOT-SET Convention 1 mechanism 1st recurrence (now 2 instances: 34/37); ★ Convention 1 mechanism standings updated. (7) ★ CONDITIONAL-SUBTRACTION 2nd recurrence (Issue #6: dimension count UNCHANGED at 14; now 3 instances total — 34/35a/37; EXACT MIRROR of line 34). (8) ★ 37th Path A application (Issue #9: streak at 9; 9-audit zero-new-gaps streak). **★ ALSO**: 25a #5 breadcrumb reuse 9th cross-audit reuse — 6th reuse OUTSIDE 25abcd cluster (Issue #5). **Cumulative through line 37**: **68 lines audited**; **677 audit issues closed total** (667 + 10); backend **765/765 pass** (UNCHANGED — 20th audit with zero new tests); MFS cascade = 20 orchestrators (unchanged); knowledge convergence = 39 lines (UNCHANGED); **★ 37 Path A applications** (+1; streak at 9); **★ 31 anti-duplication applications** (+1); **★ 0 new gaps surfaced at 37** (★ 9-audit zero-new-gaps streak); **★ 22 META-AUDITS** (+1; sub-type (b) at 95% DOMINANCE — 21 of 22; CLEAN; 4th consecutive clean; clean trend recovers to ~67%); **★ 15 doc-drift fixes** (UNCHANGED); **★ 4 distinct MFS-protection mechanisms** (UNCHANGED — ★ M2 RECURRENCE; 13 M2 instances); **★ 14 distinct complexity dimensions** (UNCHANGED — 37 was 2nd recurrence of CONDITIONAL-SUBTRACTION); **★ 4 CONVENTIONS baseline**. **Verification logs**: ... + 33 (row 1) + 34 (row 2) + 35 (row 3) + 36 (row 4) + 37 (★ row 5). **Looking ahead — line 38 (Form 2210 estimated tax penalty)**: 30th audit OUTSIDE 13ab pair; NINETEENTH payments-section audit; ★ Form 2210 has its own dedicated method (computeForm2210 at line 20090+) — likely BREAKS SHARED-DOC streak (form has its own knowledge base); ★ MAGI of Form 2210 includes 2025 quarterly due dates, safe-harbor tiers ($1,000 trigger, 100%/110% prior-year tax thresholds, $150k AGI tier); ★ likely re-introduces reference data; ★ likely 23rd META-AUDIT; ★ likely DIFFERENT complexity dimension (penalty calculation with multiple tiers).',
    'XLS/computations/37.xlsx audit-trail (this row); lines/33.md §10 row 5 FINALIZED to COMPLETE — 10/10 closed; ★ NO outstanding.md entry (Path A applied)',
    'CLOSED — 10/10. **68 lines; 677 issues; 765/765 backend (UNCHANGED — 20th audit with zero new tests); 20 orchestrators (UNCHANGED); 39-line knowledge convergence (UNCHANGED); 15 doc-drift fixes (UNCHANGED — 37 #4 CLEAN); ★ 37 Path A applications (+1; streak at 9); ★ 31 anti-duplication applications (+1); ★ 0 new gaps surfaced at 37 (★ 9-audit zero-new-gaps streak); ★ 4th MULTI-ROW Verification log contribution; ★ 22 META-AUDITS (★ sub-type (b) at 95% DOMINANCE — 21 of 22; ★ CLEAN; ★ 4th consecutive clean after 34 #4 + 35 #4 + 36 #4; clean trend recovers to ~67%); ★ 4 distinct MFS-protection mechanisms (★ M2 RECURRENCE — 13 M2 instances; 7th in payments-section); ★ 14 distinct complexity dimensions (UNCHANGED — 37 was 2nd recurrence of CONDITIONAL-SUBTRACTION); ★ 4 CONVENTIONS baseline (tied with 31/32/33/34/35/36); ★ GATED-NOT-SET Convention 1 mechanism 1st recurrence (2 instances total: 34/37); ★ ALL 4 Convention 1 mechanisms have now recurred — helper-returned-null dominant / ternary-at-setter 4× / if-gate-around-setter 3× / GATED-NOT-SET 2×; ★ 25a #5 breadcrumb reuse 9th cross-audit reuse (6th reuse OUTSIDE 25abcd cluster); ★ FOURTH SHARED-DOC AUDIT in workflow (pattern decisively established for 34/35/36/37 cluster)**. ★ EIGHTEENTH payments-section audit. Next: line 38 (Form 2210 penalty; ★ likely BREAKS SHARED-DOC streak — Form 2210 has its own knowledge base; ★ likely re-introduces reference data after 14-audit FLOOR-tier streak; ★ likely 23rd META-AUDIT).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 120 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 37 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Notes'],
  ['form1040.amountOwed.amountOwed', 'Form 1040 page 2, line 37 (PDF key line37_amount_you_owe)', '★ CANONICAL line 37 output. = roundMoney(totalTax − line33) when totalTax > line33; otherwise NULL (GATED-NOT-SET).'],
  [],
  ['MUTUALLY-EXCLUSIVE BRANCH'],
  ['Line 34 (overpayment)', '~line 19959-19967', '★ `if (line33 > totalTax)` — refund branch; ★ NEITHER set when line 33 = line 24.'],
  [],
  ['DOWNSTREAM — Form 2210 penalty STACKS on amountOwed'],
  ['Line 38 (estimated tax penalty)', '`computeForm2210()` after method returns', '★ Penalty ADDED to amountOwed.amountOwed: `ao.setAmountOwed(roundMoney(currentOwed.add(form2210.getTotalPenalty())))`. Line 37 itself NOT modified by penalty; displayed amountOwed reflects line 37 + line 38 sum.'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Frontend PDF export (Form 1040 page 2)', 'form-tax-return-1040.component.ts', '`values["line37_amount_you_owe"] = formatAmount(amountOwed?.amountOwed)` ★ NOTE: includes Form 2210 penalty stack.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 60 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
