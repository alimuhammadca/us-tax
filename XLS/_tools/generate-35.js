// ============================================================================
//  Generates: C:\us-tax\XLS\computations\35.xlsx
//
//  ★ FIRST UNIFIED MULTI-SUBLINE AUDIT in workflow — covers 35a + 35b + 35c +
//  35d in ONE xlsx. Rationale: 35a is the only sub-line with actual
//  computation (subtraction); 35b/c/d are pure string pass-through from the
//  `35-direct-deposit` personal form with no standalone computation; spec
//  groups them as "Lines 35a–35d — Refund". Deviation from sub-letter-per-
//  xlsx convention (25abcd / 27abc / 12abcde) is justified by structural
//  unity — all four lines live inside the same outer if-block and depend on
//  the same overpayment gate.
//
//  Source-of-truth references (★ SECOND SHARED-DOC AUDIT — 1st recurrence
//  of SHARED-DOC pattern after line 34):
//    - lines/33.md §4 "Lines 35a–35d — Refund" (★ NO dedicated lines/35.md;
//      line 33 spec covers 35a-35d).
//    - dependencies/33.md (titled "Total Payments (and Lines 34–38)"; ★ NO
//      dedicated dependencies/35.md).
//    - knowledge/line-33-total-payments.md §3 + §4 (★ NO dedicated
//      knowledge_line35.md or line-35-refund.md exists).
//    - knowledge/knowledge_refund_and_amount_owed.md (★ UI-audit knowledge
//      file for the unified refund-and-amount-owed-taxpayer Angular form;
//      covers 35b/c/d form-fill mechanics).
//    - flowcharts/33.drawio + refund-and-amount-owed-ui.drawio (covers 35a-d).
//    - input_forms/form-direct-deposit.xlsx (★ source of 35b/c/d values).
//    - TaxReturnComputeService.java:
//        line 19975-19977 — line 35a wiring (3 lines; conditional subtraction
//          with ternary-at-setter):
//            BigDecimal line35a = roundMoney(overpaid.subtract(line36Capped));
//            refund.setRefundAmount(line35a.compareTo(BigDecimal.ZERO) > 0 ? line35a : null);
//        line 19979-20000 — lines 35b/c/d wiring (22 lines; MULTI-GATED STRING
//          PASSTHROUGH — 4 nested gates: overpayment + !hasSplitRefund +
//          directDepositData != null + wantsDirectDeposit; plus per-field
//          null/blank gates):
//            boolean hasSplitRefund = refundAllocationData != null
//                    && Boolean.TRUE.equals(getBoolean(refundAllocationData, "wantsRefundAllocation"));
//            if (!hasSplitRefund && directDepositData != null) {
//                Boolean wantsDd = getBoolean(directDepositData, "wantsDirectDeposit");
//                if (Boolean.TRUE.equals(wantsDd)) {
//                    refund.setDirectDeposit(true);
//                    String routing = getString(directDepositData, "routingNumber");
//                    if (routing != null && !routing.isBlank()) { refund.setRoutingNumber(routing); }
//                    // ... same pattern for accountType (35c) + accountNumber (35d)
//                }
//            }
//
//  Tax year: 2025
//
//  Line 35 audit positioning (27th audit OUTSIDE 13ab pair; SIXTEENTH
//  payments-section audit; 66th line — UNIFIED 35a-d audit):
//   • ★ FIRST UNIFIED MULTI-SUBLINE AUDIT in workflow (deviation from sub-
//     letter-per-xlsx convention; justified by structural unity)
//   • ★ SECOND SHARED-DOC AUDIT in workflow (1st recurrence of SHARED-DOC
//     pattern after 34); convergence UNCHANGED at 39 lines
//   • ★ M2 RECURRENCE — 5th recurrence in payments-section (after 31+32+33+
//     34); 11 M2 instances now; pattern distribution after 22 audits: 11 M2
//     + 4 M3 + 5 M4 + 2 degenerate; ★ M2 firmly DOMINANT (5 consecutive)
//   • ★ NEW complexity dimension: MULTI-GATED STRING PASSTHROUGH (13th
//     distinct; for 35b/c/d with 4 nested gates + per-field null/blank gates)
//   • ★ CONDITIONAL-SUBTRACTION 1st recurrence (for 35a with different
//     Convention 1 mechanism — ternary-at-setter instead of GATED-NOT-SET);
//     ★ shows the dimension is sub-mechanism-flexible
//   • ★ Convention 1 ternary-at-setter 3rd recurrence (25d → 32 → 33 → 35a;
//     now 4 instances — tied with PURE-SUM dimension for most-recurring)
//   • ★ Convention 1 if-gate-around-setter 1st recurrence (line 31 → 35b/c/d;
//     now 2 instances); ★ Convention 1 mechanism diversification continues —
//     4 distinct patterns now active across the workflow
//   • ★ 20th META-AUDIT — sub-type (b); DOMINANCE to ~95% (19 of 20); ★
//     likely CLEAN; ★ 2nd consecutive clean after 34 #4
//   • ★ 2nd MULTI-ROW Verification log contribution — row 3 to lines/33.md
//     §10 (after 34 #3 was 1st multi-row)
//   • ★ Path A continues — 35th application; streak at 7
//   • ★ FLOOR tier expanded to 12 audits
//
//  Line 35 audit angles (10 issues):
//   1. ★ MFS analysis + ★ M2 RECURRENCE 5th in payments-section; 11 M2
//       instances; ★ M2 DOMINANT (5 consecutive M2 audits: 31→32→33→34→35).
//   2. ★ SECOND SHARED-DOC AUDIT + ★ FIRST UNIFIED MULTI-SUBLINE AUDIT;
//       deviation rationale; ★ NO Legacy A migration possible/needed;
//       convergence UNCHANGED at 39.
//   3. ★ 2nd MULTI-ROW Verification log contribution (row 3 to lines/33.md
//       §10); ★ MULTI-ROW pattern firmly established for shared-doc audits.
//   4. ★ 20th META-AUDIT — sub-type (b); DOMINANCE to ~95% (19 of 20);
//       expected CLEAN; ★ 2nd consecutive clean after 34 #4.
//   5. ★ 29th anti-duplication — 25a #5 breadcrumb reuse 7th cross-audit
//       reuse; ★ 4th reuse OUTSIDE 25abcd cluster.
//   6. ★ NEW complexity dimension: MULTI-GATED STRING PASSTHROUGH (13th
//       distinct; for 35b/c/d) + ★ CONDITIONAL-SUBTRACTION 1st recurrence
//       (for 35a with different Convention 1 mechanism).
//   7. ★ 4 CONVENTIONS baseline (tied with 31/32/33/34); ★ Convention 1
//       ternary-at-setter 3rd recurrence (35a) + Convention 1 if-gate-around
//       -setter 1st recurrence (35b/c/d); ★ 4 distinct Convention 1
//       mechanisms now active in workflow.
//   8. ★ 0 routing + 0 reference data; FLOOR tier expanded to 12 audits.
//   9. ⚠️ BUNDLED OBSERVATIONS — ★ Path A application; ★ 35th; ★ streak at
//       7; ★ 7-audit zero-new-gaps streak.
//  10. BOUNDARY MILESTONE.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '35.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 35 — REFUND (35a refund amount + 35b/c/d direct deposit) — 2025'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 35 (page 2; "Amount of line 34 you want refunded to you. If Form 8888 is attached, check here")'],
  ['Concept',
    'Line 35 covers FOUR sub-lines:\n' +
    '  • Line 35a — refund amount = line 34 (overpayment) − line 36 (amount applied to 2026 est tax)\n' +
    '  • Line 35b — routing number for direct deposit (string; from personal form)\n' +
    '  • Line 35c — account type (checking/savings checkbox; from personal form)\n' +
    '  • Line 35d — account number for direct deposit (string; from personal form)\n' +
    '\n' +
    '★ 35a is a CONDITIONAL SUBTRACTION (1st recurrence of new dimension introduced at line 34).\n' +
    '★ 35b/c/d are NEW complexity dimension: MULTI-GATED STRING PASSTHROUGH (13th distinct dimension)\n' +
    '   — 4 nested gates: (1) overpayment branch (line 33 > totalTax); (2) !hasSplitRefund (no Form\n' +
    '   8888); (3) directDepositData != null; (4) wantsDirectDeposit == true; plus each field has\n' +
    '   per-field null/blank gate.\n' +
    '★ When Form 8888 is elected (split refund), lines 35b/c/d are SUPPRESSED (the Form 8888\n' +
    '   accounts replace direct-deposit fields on Form 1040).'],
  ['Top-level formula (lines/33.md §4 — "Lines 35a–35d — Refund")',
    'Line 35a: refund.refundAmount = roundMoney(overpaid − line36Capped)\n' +
    '          stored null when zero (ternary-at-setter)\n' +
    'Line 35b: refund.routingNumber = directDepositForm.routingNumber  (gated; passthrough)\n' +
    'Line 35c: refund.accountType = directDepositForm.accountType      (gated; passthrough)\n' +
    'Line 35d: refund.accountNumber = directDepositForm.accountNumber  (gated; passthrough)\n' +
    '\n' +
    '★ Plus refund.directDeposit = true (when wantsDirectDeposit is elected)\n' +
    '\n' +
    'All four sub-lines computed inside the overpayment if-block at line 19967+.\n' +
    'When line 33 ≤ line 24 (amount-owed or balanced), NONE of 35a-d are set.'],
  ['Surrounding page-2 chain',
    'line 33 = total payments\n' +
    'line 24 = total tax (totalTax)\n' +
    'line 34 = overpayment = line 33 − line 24  (when line 33 > line 24; the gate)\n' +
    'line 36 = amount applied to 2026 estimated tax (capped at line 34)\n' +
    '★ line 35a = line 34 − line 36  (★ THIS LINE — refund amount)\n' +
    '★ line 35b = routing number (gated)\n' +
    '★ line 35c = account type checkbox (gated)\n' +
    '★ line 35d = account number (gated)\n' +
    'line 37 = amount owed = line 24 − line 33  (mutually exclusive; not in 35a-d branch)\n' +
    'line 38 = Form 2210 penalty\n' +
    '\n' +
    '★ Lines 35b/c/d are SUPPRESSED when Form 8888 split refund is elected (UI gate).'],
  ['Output target',
    'Line 35a: form1040.refund.refundAmount (BigDecimal; null-when-zero via ternary-at-setter)\n' +
    'Line 35b: form1040.refund.routingNumber (String; gated)\n' +
    'Line 35c: form1040.refund.accountType (String "Checking" or "Savings"; gated)\n' +
    'Line 35d: form1040.refund.accountNumber (String; gated)\n' +
    'Plus: form1040.refund.directDeposit (Boolean; set true when DD elected)\n' +
    'PDF fields: line35a_refund_amount, direct_deposit_routing_number,\n' +
    '            direct_deposit_account_type_checking / _savings,\n' +
    '            direct_deposit_account_number'],
  ['Backend implementation',
    '★ NO DEDICATED HELPER METHOD — line 35a-d wired inline in computeLine31ThroughLine38 at line\n' +
    '   19975-20000 (~25 lines total). ★ All four sub-lines live inside the same overpayment\n' +
    '   if-block as line 34. ★ Covered by 25a #5 NEW VERIFIED CORRECT breadcrumb at\n' +
    '   ~19688-19790 (method-level scope explicitly includes lines 34/35a/35b-d/37).'],
  ['IRS source',
    'IRS 2025 Form 1040 (page 2 line 35 + 35a-d) + 2025 Instructions for Form 1040. ★ 2025 — line\n' +
    '35 routing unchanged from 2024.'],
  ['★ SHARED-DOC AUDIT NOTE',
    '★ SECOND SHARED-DOC AUDIT in workflow (1st recurrence of SHARED-DOC pattern after 34).\n' +
    'Line 35 has NO dedicated:\n' +
    '  • lines/35.md spec (35a-d documented in lines/33.md §4 "Lines 35a–35d — Refund")\n' +
    '  • dependencies/35.md (covered by dependencies/33.md)\n' +
    '  • knowledge_line35.md or line-35-refund.md (computation knowledge in line-33-total-payments.md §3+§4)\n' +
    '  • flowcharts/35.drawio (covered by flowcharts/33.drawio + refund-and-amount-owed-ui.drawio)\n' +
    '  • diagrams/35.drawio (payments-section diagrams begin at 32)\n' +
    '★ NOTE: knowledge_refund_and_amount_owed.md DOES cover 35b/c/d form-fill mechanics — but\n' +
    '   it is a UI-AUDIT knowledge file, not a computation knowledge file.'],
  ['★ FIRST UNIFIED MULTI-SUBLINE AUDIT NOTE',
    '★ DEVIATION from sub-letter-per-xlsx convention (25abcd / 27abc / 12abcde). Rationale:\n' +
    '  • Line 35a is the only sub-line with actual computation (subtraction)\n' +
    '  • 35b/c/d are pure string pass-through from the 35-direct-deposit personal form\n' +
    '  • All four sub-lines live inside the same outer if-block and depend on the same overpayment\n' +
    '    gate — structurally a single unit\n' +
    '  • Spec already groups them as "Lines 35a–35d — Refund" (lines/33.md §4)\n' +
    '★ This unified treatment IS expected to recur at line 38 if 38 has multiple sub-parts;\n' +
    '   otherwise stays as a one-off justified by structural unity.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Upstream: line 34 (overpaid) computed at line 19961', 'Overpayment = roundMoney(line33 − totalTax).'],
  [2, 'Upstream: line 36 capped (line36Capped) computed at line 19970', 'min(line36, overpaid) — cannot exceed overpayment.'],
  [3, '★ 35a: subtract at line 19976', '`BigDecimal line35a = roundMoney(overpaid.subtract(line36Capped))`'],
  [4, '★ 35a: ternary null-flip at setter (line 19977)', '`refund.setRefundAmount(line35a > 0 ? line35a : null)` — ★ RECURS 25d/32/33 ternary-at-setter mechanism.'],
  [5, '★ 35b/c/d outer gate at line 19981-19983', '`if (!hasSplitRefund && directDepositData != null)` — 2nd nested gate (3rd if outer overpayment gate counted).'],
  [6, '★ 35b/c/d inner gate at line 19984-19985', '`if (wantsDirectDeposit == true)` — 4th nested gate.'],
  [7, '35b: routing number string passthrough at line 19987-19990', '`refund.setRoutingNumber(routing)` ONLY when `routing != null && !routing.isBlank()` — per-field gate.'],
  [8, '35c: account type string passthrough at line 19991-19994', '`refund.setAccountType(acctType)` ONLY when `acctType != null && !acctType.isBlank()`.'],
  [9, '35d: account number string passthrough at line 19995-19998', '`refund.setAccountNumber(acctNum)` ONLY when `acctNum != null && !acctNum.isBlank()`.'],
  [10, 'Plus: `refund.setDirectDeposit(true)` at line 19986', 'Boolean flag set unconditionally inside the wantsDirectDeposit gate.'],
  [],
  ['INVARIANTS / VALIDATIONS'],
  ['Invariant', 'Rationale'],
  ['Line 35a ≥ 0 when set', 'STRUCTURALLY enforced — overpaid > 0 by line 34 gate; line36Capped ≤ overpaid; subtraction non-negative.'],
  ['Line 35a stored as null when zero', '★ RECURS 25d ternary-at-setter mechanism (3rd recurrence after 32/33).'],
  ['Lines 35b/c/d suppressed when Form 8888 elected', 'STRUCTURALLY enforced via !hasSplitRefund gate at line 19981-19983.'],
  ['Lines 35b/c/d suppressed when wantsDirectDeposit = false', 'STRUCTURALLY enforced via inner wantsDd gate at line 19984-19985.'],
  ['Lines 35a-d not set when no overpayment', 'STRUCTURALLY enforced via outer overpayment if-block.'],
  ['MFS protection inherited via M2 transitive', '★ M2 — line 35 has no per-spouse code; relies on line 34 (M2) and personal-form scoping for 35b/c/d.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 38 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Lines 35a-d'],
  ['Line 35a takes 2 numeric inputs (overpaid + line36Capped); lines 35b/c/d each take 1 string input from the 35-direct-deposit personal form (plus the wantsDirectDeposit boolean gate). All MFS protection inherited transitively (M2 RECURRENCE — 5th in payments-section; 11 M2 instances now).'],
  [],
  ['LINE 35a INPUTS (2 numeric)'],
  ['#', 'Source', 'Origin', 'Java field read', 'Conditional?'],
  ['35a-1', 'overpaid (line 34)', 'Set at line 19961 in same method', 'Local variable `overpaid` (set 14 lines earlier in same if-block)', 'Gated by overpayment branch'],
  ['35a-2', 'line36Capped (line 36 capped at overpaid)', 'Set at line 19970 in same method', 'Local variable `line36Capped` (set 5 lines earlier in same if-block)', 'Gated by overpayment branch'],
  [],
  ['LINES 35b/c/d INPUTS (3 strings + 1 boolean gate)'],
  ['#', 'Source', 'Origin', 'Java field read', 'Conditional?'],
  ['gate-1', 'hasSplitRefund', 'From refund-allocation-taxpayer personal form (refundAllocationData.wantsRefundAllocation)', '`getBoolean(refundAllocationData, "wantsRefundAllocation")`', 'Set in same method'],
  ['gate-2', 'directDepositData', 'From 35-direct-deposit personal form', 'Method parameter (loaded earlier)', 'Null check'],
  ['gate-3', 'wantsDd', 'From 35-direct-deposit form: wantsDirectDeposit field', '`getBoolean(directDepositData, "wantsDirectDeposit")`', 'TRUE check'],
  ['35b', 'routingNumber', 'From 35-direct-deposit form: routingNumber field', '`getString(directDepositData, "routingNumber")`', 'null + isBlank check'],
  ['35c', 'accountType', 'From 35-direct-deposit form: accountType field ("Checking" or "Savings")', '`getString(directDepositData, "accountType")`', 'null + isBlank check'],
  ['35d', 'accountNumber', 'From 35-direct-deposit form: accountNumber field', '`getString(directDepositData, "accountNumber")`', 'null + isBlank check'],
  [],
  ['⚠️ USER INPUT FORMS REFERENCED'],
  ['Form file', 'Fields used', 'Purpose'],
  ['form-direct-deposit.xlsx', 'wantsDirectDeposit (boolean) + routingNumber (string) + accountType (string) + accountNumber (string)', 'Source for 35b/c/d values; gated by Form 8888 not active'],
  ['form-refund-allocation.xlsx', 'wantsRefundAllocation (boolean)', 'When TRUE, Form 8888 active; suppresses 35b/c/d'],
  ['form-apply-to-next-year.xlsx', '(if exists) electsApplyToNextYear + amountToApply', 'Source for line 36; affects 35a via line36Capped'],
  [],
  ['⚠️ MFS PROTECTION via M2 transitive inheritance (★ 5th M2-based Convention 4 in payments-section after 31+32+33+34; 11 M2 instances now)'],
  ['Mechanism', 'Detail'],
  ['★ Transitive inheritance from line 34', 'Line 34 has M2 transitive (audited at 34 #1); 35a inherits via overpaid + line36Capped reads.'],
  ['★ Personal-form scoping for 35b/c/d', '35-direct-deposit form is per-return (not per-spouse); each MFS spouse files separately with their own direct-deposit form.'],
  ['No in-helper MFS check needed', 'No per-spouse code at line 35 wiring site.'],
  ['→ NO MFS GUARD NEEDED', '★ M2 RECURRENCE (5th in payments-section); 11 M2 instances; pattern distribution after 22 audits: 11 M2 + 4 M3 + 5 M4 + 2 degenerate'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 10 }, { wch: 50 }, { wch: 60 }, { wch: 60 }, { wch: 28 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 35'],
  ['★ ZERO reference data at line 35 wiring site. ★ FLOOR tier expanded to 12 audits.'],
  [],
  ['Constant', '2025 Value', 'Statutory Basis'],
  ['(None — pure conditional subtraction + string passthrough)', '—', '—'],
  [],
  ['★ Reference-data comparison across recent audits'],
  ['Audit', '# numeric constants', 'Tier'],
  ['25a-d / 27b/c / 31 / 32 / 33 / 34', '0 (tied — 10 audits)', 'FLOOR'],
  ['26 / 30', '4 / ~6', 'LOW-MID'],
  ['28 / 29', '~15 / ~14', 'MID'],
  ['27a', '★ 72 (HEAVIEST)', 'CEILING'],
  ['**35 (unified 35a-d)**', '**★ 0 (FLOOR tier; ★ FLOOR tier expanded to 12 audits)**', 'FLOOR'],
  [],
  ['NOTE: Downstream / UI constants (NOT used at line 35 wiring)'],
  ['$1 minimum refund', '$1', 'IRS rule — refunds < $1 not auto-issued (open gap G3 from line 33 audit).'],
  ['Routing number ABA Mod-10 validation', '9 digits with Mod-10 checksum', 'UI-level validation; backend stores raw string (UI-audit knowledge).'],
  ['Account number max length', '17 characters', 'IRS Form 1040 field limit; UI-enforced.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 45 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 35 Persistence + Downstream Consumers'],
  ['Line 35 sets FIVE fields on Refund output model. ★ All fields populated inside the overpayment if-block. ★ 35b/c/d additionally gated by !hasSplitRefund + wantsDirectDeposit.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.refund.refundAmount (35a)', 'computeLine31ThroughLine38 at line 19977', '★ = roundMoney(overpaid − line36Capped); null-when-zero via ternary-at-setter.'],
  ['form1040.refund.directDeposit (35b flag)', 'line 19986', '★ Boolean true when DD elected; only set inside the wantsDirectDeposit gate.'],
  ['form1040.refund.routingNumber (35b)', 'line 19989', '★ String passthrough; gated by !hasSplitRefund + wantsDirectDeposit + per-field null/blank.'],
  ['form1040.refund.accountType (35c)', 'line 19993', '★ String "Checking" or "Savings"; same gating.'],
  ['form1040.refund.accountNumber (35d)', 'line 19997', '★ String passthrough; same gating.'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Frontend PDF export (Form 1040 page 2)', 'form-tax-return-1040.component.ts', '`values["line35a_refund_amount"] = formatAmount(refund?.refundAmount)`; `values["direct_deposit_routing_number"] = refund?.routingNumber`; etc.'],
  ['Form 8888 line 5 validation', '`computeForm8888()` after refund finalized', '★ Validates line 5 == 35a (totalAllocated must equal refundAmount); FORM_8888_TOTAL_MISMATCH non-blocking flag on mismatch.'],
  ['Form 8888 suppresses 35b/c/d', 'Frontend + backend logic', '★ When wantsRefundAllocation = true, lines 35b/c/d on Form 1040 are blank; Form 8888 accounts replace them.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 55 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 35'],
  ['Line 35 emits NO blocking flags directly. Downstream FORM_8888_TOTAL_MISMATCH (non-blocking) validates that Form 8888 line 5 equals line 35a.'],
  [],
  ['Flag code', 'Severity', 'Condition'],
  ['(None at line 35 site)', 'N/A', 'No validation at line 35 wiring.'],
  ['FORM_8888_TOTAL_MISMATCH (downstream)', 'Non-blocking', 'Emitted by computeForm8888() when sum of Form 8888 account amounts ≠ refundAmount (line 35a).'],
  [],
  ['STRUCTURAL INVARIANTS'],
  ['Invariant', 'How enforced'],
  ['35a ≥ 0 when set', 'STRUCTURALLY enforced — overpaid > 0 by line 34 gate; line36Capped ≤ overpaid.'],
  ['35a stored as null when zero', '★ Ternary-at-setter (3rd recurrence of 25d mechanism).'],
  ['35b/c/d only set when wantsDirectDeposit && !hasSplitRefund', 'STRUCTURALLY enforced via nested if-gates.'],
  ['35b/c/d each individually gated by null + isBlank', 'STRUCTURALLY enforced — per-field if-gate around setter.'],
  ['35a-d not set on amount-owed or balanced return', 'STRUCTURALLY enforced via outer overpayment if-block.'],
  ['MFS protection inherited via M2 transitive', '★ 5th M2-based Convention 4 in payments-section after 31+32+33+34.'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 14 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 35 unified audit covering 35a (refund amount; CONDITIONAL SUBTRACTION 1st recurrence) + 35b/c/d (MULTI-GATED STRING PASSTHROUGH; NEW dimension). 27th audit OUTSIDE 13ab pair; SIXTEENTH payments-section audit; 66th line. ★ FIRST UNIFIED MULTI-SUBLINE AUDIT in workflow. ★ SECOND SHARED-DOC AUDIT. ★ EXPECTED CLEAN META-AUDIT. 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-16 — ★ NO MFS MECHANISM NEEDED + ★ M2 RECURRENCE (5th recurrence in payments-section after 31+32+33+34); ★ 11 M2 instances now; ★ M2 firmly DOMINANT pass-through pattern in payments-section (5 consecutive M2 audits: 31→32→33→34→35); pattern distribution after 22 audits: 11 M2 + 4 M3 + 5 M4 + 2 degenerate',
    '**Per-input MFS-leakage analysis**: line 35 wiring at TaxReturnComputeService.java:19975-20000 reads (a) numeric `overpaid` + `line36Capped` (set in same method by line 34/36 wiring — both MFS-clean via line 34\'s M2 inheritance); (b) personal-form data from `35-direct-deposit` (per-return form; each MFS spouse files separately with their own DD form); (c) `refundAllocationData` from `refund-allocation-taxpayer` (same per-return scoping). No per-spouse data accessed; no MFS check needed. ★ **5th RECURRENCE of M2 in payments-section** (after 31+32+33+34). ★ **11 M2 instances now**. ★ M2 firmly DOMINANT (5 consecutive). ★ **20th orchestrator-method-based audit**. Pattern distribution after 22 audits: **11 M2** (+1 NEW) + 4 M3 + 5 M4 + 2 degenerate. MFS cascade UNCHANGED at 20.',
    'TaxReturnComputeService.java:19975-20000 (conditional subtraction + multi-gated string passthrough; no helper; no per-spouse code)',
    'CLOSED — ★ NO MFS MECHANISM NEEDED; ★ M2 RECURRENCE (5th in payments-section). Pattern distribution after 22 audits: **11 M2** + 4 M3 + 5 M4 + 2 degenerate. ★ M2 firmly DOMINANT (5 consecutive M2 audits: 31→32→33→34→35). MFS cascade UNCHANGED at 20. Pure cross-reference closure. 765/765 unchanged.'],

  [2, 'RESOLVED 2026-05-16 — ★ SECOND SHARED-DOC AUDIT in workflow (1st recurrence of SHARED-DOC pattern after 34) + ★ FIRST UNIFIED MULTI-SUBLINE AUDIT in workflow (deviation from sub-letter-per-xlsx convention; justified by structural unity — 35a-d all live in same if-block, 35b/c/d have no standalone computation, spec already groups them as "Lines 35a–35d — Refund"); ★ NO Legacy A migration possible/needed; ★ Convergence UNCHANGED at 39 lines',
    '**The situation**: Line 35 has NO dedicated documentation files (same as line 34 — shared with line 33). ★ Additionally, line 35 audit is the FIRST UNIFIED MULTI-SUBLINE AUDIT in workflow — covers 35a + 35b + 35c + 35d in ONE xlsx instead of four separate sub-letter xlsx files. ★ Deviation rationale: (a) 35a is the only sub-line with actual computation; (b) 35b/c/d are pure string passthrough with no standalone math; (c) all four share the same outer overpayment gate; (d) spec groups them as "Lines 35a–35d — Refund". ★ Counts as ONE audit in workflow metrics. ★ **2nd SHARED-DOC AUDIT** (1st recurrence of pattern from line 34). ★ NO Legacy A migration possible. ★ Convergence UNCHANGED at 39 lines.',
    'lines/33.md §4 "Lines 35a–35d — Refund"; no separate lines/35.md',
    'CLOSED — ★ SECOND SHARED-DOC AUDIT in workflow (1st recurrence after 34). ★ FIRST UNIFIED MULTI-SUBLINE AUDIT in workflow. ★ Deviation from sub-letter-per-xlsx convention is justified by structural unity (35a is only computation; 35b/c/d are pure pass-through; spec already groups them). ★ Counts as ONE audit in workflow metrics. ★ NO Legacy A migration possible. ★ Convergence UNCHANGED at 39.'],

  [3, 'RESOLVED 2026-05-16 — ★ 2nd MULTI-ROW Verification log contribution — appended row 3 to existing lines/33.md §10 (rows 1+2 from 33 + 34 audits); ★ MULTI-ROW pattern firmly established for shared-doc audits',
    '**Goal**: append row 3 to existing `lines/33.md §10` Verification log. ★ **2nd MULTI-ROW contribution in workflow** (after 34 #3 was 1st). ★ Pattern: shared-doc audits naturally extend the parent line\'s Verification log. Row 3 in IN-PROGRESS state with #1-#3 closures; finalized to COMPLETE at Issue #10.',
    'C:\\us-tax\\lines\\33.md §10 (append row 3)',
    'CLOSED — row 3 APPENDED to existing §10 Verification log in lines/33.md with IN-PROGRESS state. Will be finalized at Issue #10. **★ 2nd MULTI-ROW contribution** — MULTI-ROW pattern firmly established for shared-doc audits. ★ Expected to recur at lines 36/37/38.'],

  [4, 'RESOLVED 2026-05-16 — ★ 20th META-AUDIT IN WORKFLOW — sub-type (b); ★ DOMINANCE to ~95% (19 of 20); ★ CLEAN — 6/6 consistency checks pass; ★ 2nd consecutive clean META-AUDIT after 34 #4; ★ workflow recovery continues from 33 #4 broken streak; clean trend in sub-type (b) recovers from ~61% to ~63% (12 clean / 19)',
    '**The situation**: META-AUDIT cross-checks lines/33.md §4 ("Lines 35a–35d — Refund") + dependencies/33.md + knowledge/line-33-total-payments.md §3+§4 against actual line 35 code at 19975-20000. **★ 20th META-AUDIT in workflow**. **★ DOMINANCE to ~95% — 19 of 20** META-AUDITS use sub-type (b). **★ EXPECTED CLEAN** — 6/6 consistency checks: (a) ✅ 35a wiring matches spec subtraction; (b) ✅ 35b/c/d gated by Form 8888 check + wantsDirectDeposit; (c) ✅ Refund field destinations documented; (d) ✅ PDF mapping `line35a_refund_amount` + direct_deposit_* keys; (e) ✅ Ternary-at-setter pattern for 35a; (f) ✅ Form 8888 suppression of 35b/c/d documented. ★ **2nd consecutive clean META-AUDIT after 34 #4**. ★ Clean trend in sub-type (b) recovers from ~61% to ~63% (12 clean / 19).',
    'lines/33.md §4; dependencies/33.md; knowledge/line-33-total-payments.md §3+§4; code at line 19975-20000',
    'CLOSED — META-AUDIT consistency check complete. **★ 20th META-AUDIT in workflow**. **★ DOMINANCE to ~95% — 19 of 20 META-AUDITS use sub-type (b)**. **★ CLEAN** — 6/6 consistency checks pass. ★ **2nd consecutive clean META-AUDIT after 34 #4**. ★ Workflow recovery continues from 33 #4 broken streak. ★ Clean trend in sub-type (b) recovers from ~61% to ~63% (12 clean / 19).'],

  [5, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — line 35 wiring at line 19975-20000; ★ 29th anti-duplication application; ★ 25a #5 breadcrumb reuse 7th cross-audit reuse; ★ 4th reuse OUTSIDE 25abcd cluster (after 32 #5 + 33 #5 + 34 #5); ★ load-bearing extends to MULTI-GATED STRING PASSTHROUGH territory',
    '**Closure intent**: pure cross-reference closure. Line 35 wiring lives inside `computeLine31ThroughLine38`. ★ The **25a #5 NEW VERIFIED CORRECT breadcrumb** at TaxReturnComputeService.java:~19688-19790 covers the entire method, with its compute-order section explicitly listing "Lines 34/35a/35b-d/37". ★ **7th reuse total** (25b/25c/25d/32/33/34/35). ★ **4th reuse OUTSIDE 25abcd cluster** — load-bearing now extends to MULTI-GATED STRING PASSTHROUGH territory (35b/c/d). 3-source coverage: spec + dependencies + knowledge + 25a #5 breadcrumb. **★ 29th anti-duplication application**.',
    'TaxReturnComputeService.java:19975-20000 (line 35 wiring) + ~19688 (25a #5 breadcrumb)',
    'CLOSED — verified correct via 25a #5 breadcrumb reuse + 3-source coverage. **★ 29th anti-duplication application**. ★ **25a #5 breadcrumb reuse 7th cross-audit reuse** (after 25b/25c/25d/32/33/34 #5). ★ **4th reuse OUTSIDE 25abcd cluster** — extends to MULTI-GATED STRING PASSTHROUGH territory (a completely different complexity dimension than the original numeric-aggregation cluster). ★ Pattern decisively confirmed: method-level breadcrumbs durably load-bearing across all complexity dimensions.'],

  [6, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — ★ NEW complexity dimension: MULTI-GATED STRING PASSTHROUGH (13th distinct dimension; for 35b/c/d) + ★ CONDITIONAL-SUBTRACTION 1st recurrence (for 35a with TERNARY-AT-SETTER mechanism variant instead of GATED-NOT-SET); dimension count INCREASES from 12 to 13',
    '**Closure intent**: complexity-dimension classification for unified audit. (a) **35a** is the 1st RECURRENCE of CONDITIONAL-SUBTRACTION dimension (12th, introduced at line 34) — same outer gate + subtraction structure, but with TERNARY-AT-SETTER mechanism instead of line 34\'s GATED-NOT-SET. ★ Shows the dimension is sub-mechanism-flexible. (b) **35b/c/d** are ★ **NEW complexity dimension: MULTI-GATED STRING PASSTHROUGH** — 4 nested gates (overpayment + !hasSplitRefund + directDepositData != null + wantsDirectDeposit) plus per-field null/blank gates; STRING values (not numeric); no computation (pure passthrough from personal form). ★ Dimension count INCREASES from 12 to 13. ★ Workflow now spans pure-arithmetic + conditional-arithmetic + multi-gated-string-passthrough dimensions.',
    'TaxReturnComputeService.java:19975-19977 (35a) + 19979-20000 (35b/c/d)',
    'CLOSED — verified correct via NEW complexity dimension. **★ NEW complexity dimension: MULTI-GATED STRING PASSTHROUGH** — 13th distinct (for 35b/c/d; four nested gates + per-field null/blank gates + STRING values + PASSTHROUGH not computed). **★ CONDITIONAL-SUBTRACTION 1st recurrence** (for 35a with TERNARY-AT-SETTER sub-mechanism variant — shows dimension is sub-mechanism-flexible). ★ Dimension count INCREASES from 12 to 13. ★ Workflow now spans three structural categories: pure-arithmetic + conditional-arithmetic + multi-gated-string-passthrough.'],

  [7, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — ★ 4 CONVENTIONS (baseline minimum; tied with 31/32/33/34); ★ Convention 1 ternary-at-setter 3rd recurrence (35a; now 4 instances: 25d/32/33/35a — tied with PURE-SUM dimension for most-recurring); ★ Convention 1 if-gate-around-setter 1st recurrence (35b/c/d; now 2 instances after line 31); ★ Convention 1 mechanism diversification — 4 distinct patterns now active across workflow',
    '**Closure intent**: verification closure — confirms 4 baseline conventions with TWO Convention 1 mechanism recurrences in one audit. **Convention 1 (Null-when-zero)** — TWO mechanisms in this audit: (a) **TERNARY-AT-SETTER** at line 19977 for 35a (★ 3rd recurrence of 25d/32/33 pattern; now 4 instances); (b) **IF-GATE-AROUND-SETTER** at lines 19988/19992/19996 for 35b/c/d (★ 1st recurrence of line 31 pattern; now 2 instances). **Convention 2** No SSN filtering. **Convention 3** MFJ aggregation transitively inherited. **Convention 4** MFS protection via ★ M2 transitive inheritance — ★ 5th M2-based Convention 4 in payments-section. ★ **4 CONVENTIONS** — baseline minimum (tied with 31/32/33/34). ★ All 4 distinct Convention 1 mechanisms (helper-returned-null / if-gate-around-setter / ternary-at-setter / GATED-NOT-SET) now active in workflow.',
    'TaxReturnComputeService.java:19977 (35a ternary) + 19988/19992/19996 (35b/c/d if-gates)',
    'CLOSED — verified correct. **★ 4 CONVENTIONS** (baseline minimum; tied with 31/32/33/34). ★ **TWO Convention 1 mechanism recurrences in one audit**: (a) ternary-at-setter 3rd recurrence for 35a (25d → 32 → 33 → 35a; now 4 instances — tied with PURE-SUM dimension for most-recurring pattern); (b) if-gate-around-setter 1st recurrence for 35b/c/d (line 31 → 35b/c/d; now 2 instances). ★ **All 4 distinct Convention 1 mechanisms now active across workflow** (helper-returned-null / if-gate-around-setter / ternary-at-setter / GATED-NOT-SET). ★ Convention 4 uses M2 transitive inheritance — 5th M2-based Convention 4 in payments-section.'],

  [8, 'RESOLVED 2026-05-16 — VERIFIED CORRECT — 0 routing distinctions + 0 reference data at line 35 wiring; ★ FLOOR tier expanded to 12 audits',
    '**Closure intent**: pure verification closure. **Routing**: ★ ZERO — nested if-gates are structural (overpayment + DD election + Form 8888 check), not tax-rule routing. **Reference data**: ★ ZERO — no tax-year-specific constants at line 35 wiring. ★ **FLOOR tier expanded to 12 audits** (newly added line 35; now: 25a + 25b + 25c + 25d + 27b + 27c + 31 + 32 + 33 + 34 + **35**).',
    'spec lines/33.md §4 + dependencies/33.md + knowledge §3+§4',
    'CLOSED — verified correct. **Routing**: ★ ZERO distinctions (★ NOTE: the four nested gates are structural conditions, not tax-rule routing). **Reference data**: ★ ZERO constants at line 35 wiring site. ★ **FLOOR tier expanded to 12 audits** (★ floor cluster now contains 25a + 25b + 25c + 25d + 27b + 27c + 31 + 32 + 33 + 34 + 35). ★ Pattern firmly confirmed: pure structural computations (PURE-SUM + CONDITIONAL-SUBTRACTION + MULTI-GATED STRING PASSTHROUGH) consistently cluster at FLOOR tier. ★ Workflow reference-data range firmly established 0-72 with 4 tiers.'],

  [9, 'RESOLVED 2026-05-16 — ⚠️ BUNDLED OBSERVATIONS — ★ Path A application (★ continues zero-outstanding-walkthroughs streak at 7 after 29 RESUMED + 30 + 31 + 32 + 33 + 34 continued); ★ 35th Path A application; ★ 7-audit zero-new-gaps streak; ★ WORKFLOW RECOVERY narrative continues dominant',
    '**Closure intent**: pure xlsx-flip observation bundle. Observations: (a) NO missing-diagrams/flowcharts gap for line 35 — shared-doc design covers via flowcharts/33.drawio + refund-and-amount-owed-ui.drawio. (b) FIRST UNIFIED MULTI-SUBLINE AUDIT structural decision recorded in #2; not duplicated here. **★ 35th PATH A APPLICATION**. **★ Continues zero-outstanding-walkthroughs streak at 7**. ★ **7-audit zero-new-gaps streak**. ★ Workflow recovery narrative continues dominant — 7 of 7 Path A vs. 4 of 5 drift surge.',
    'shared-doc design; no missing-diagrams gap',
    'CLOSED — pure observation bundle. (a) NO diagrams/35.drawio — structural-by-design (covered by shared docs). (b) NO flowcharts/35.drawio — same rationale. (c) UNIFIED-AUDIT decision handled under #2. (d) NEW dimension handled under #6. (e) Convention 1 diversification handled under #7. (f) G3 $1 min refund already tracked. **★ 35th Path A application**. **★ Continues zero-outstanding-walkthroughs streak at 7**. ★ **7-audit zero-new-gaps streak**. ★ Workflow recovery narrative continues dominant (7 of 7 Path A vs. 4 of 5 drift surge).'],

  [10, 'RESOLVED 2026-05-16 — BOUNDARY MILESTONE — Line 35 walkthrough complete at 10/10; ★ SIXTEENTH payments-section audit; ★ FIRST UNIFIED MULTI-SUBLINE AUDIT in workflow; ★ SECOND SHARED-DOC AUDIT; ★ NEW complexity dimension: MULTI-GATED STRING PASSTHROUGH (13th distinct); ★ CONDITIONAL-SUBTRACTION 1st recurrence (sub-mechanism flexibility); ★ M2 RECURRENCE 11 M2 instances; ★ Path A continues at 7; ★ 2nd MULTI-ROW Verification log contribution; ★ 20th META-AUDIT CLEAN (2nd consecutive after 34 #4)',
    'Pure xlsx-flip + Verification log row 3 finalization — **CLOSES the 35 walkthrough at 10/10**. **Eight themes**: (1) ★ Structural positioning — 27th audit OUTSIDE 13ab pair; ★ SIXTEENTH payments-section audit; 66th line; ★ FIRST UNIFIED MULTI-SUBLINE AUDIT; ★ SECOND SHARED-DOC AUDIT. (2) ★ M2 RECURRENCE — 5th in payments-section; **11 M2 instances now**; pattern distribution after 22 audits: 11 M2 + 4 M3 + 5 M4 + 2 degenerate. (3) ★ 20th META-AUDIT — sub-type (b) at 95% DOMINANCE (19 of 20); ★ CLEAN; ★ 2nd consecutive clean after 34 #4; clean trend recovers from ~61% to ~63%. (4) ★ FIRST UNIFIED MULTI-SUBLINE AUDIT (Issue #2: covers 35a+35b+35c+35d in ONE xlsx; structural unity justified by spec grouping "Lines 35a–35d — Refund"); ★ NO Legacy A; ★ convergence UNCHANGED at 39. (5) ★ 2nd MULTI-ROW Verification log contribution (Issue #3: row 3 to existing lines/33.md §10; MULTI-ROW pattern firmly established for shared-doc audits). (6) ★ 4 CONVENTIONS baseline (Issue #7: tied with 31/32/33/34); ★ Convention 1 ternary-at-setter 3rd recurrence (35a; 4 instances total); ★ Convention 1 if-gate-around-setter 1st recurrence (35b/c/d; 2 instances); ★ 4 distinct Convention 1 mechanisms active. (7) ★ NEW complexity dimension MULTI-GATED STRING PASSTHROUGH (Issue #6: 13th distinct; for 35b/c/d with 4 nested gates); ★ CONDITIONAL-SUBTRACTION 1st recurrence (35a with sub-mechanism variant); ★ dimension count 12 → 13. (8) ★ 35th Path A application (Issue #9: ★ streak at 7; ★ 7-audit zero-new-gaps streak). **★ ALSO**: 25a #5 breadcrumb reuse 7th cross-audit reuse — 4th reuse OUTSIDE 25abcd cluster (Issue #5). **Cumulative through line 35**: **66 lines audited**; **657 audit issues closed total** (647 + 10); backend **765/765 pass** (UNCHANGED — 18th audit with zero new tests); MFS cascade = 20 orchestrators (unchanged); knowledge convergence = 39 lines (UNCHANGED); **★ 35 Path A applications** (+1; streak at 7); **★ 29 anti-duplication applications** (+1); **★ 0 new gaps surfaced at 35** (★ 7-audit zero-new-gaps streak); **★ 20 META-AUDITS** (+1; sub-type (b) at 95% DOMINANCE; CLEAN; clean trend recovers to ~63%); **★ 15 doc-drift fixes** (UNCHANGED); **★ 4 distinct MFS-protection mechanisms** (UNCHANGED — ★ M2 RECURRENCE; 11 M2 instances); **★ 13 distinct complexity dimensions** (+1 from 35 #6 — ★ NEW MULTI-GATED STRING PASSTHROUGH); **★ 4 CONVENTIONS baseline**; **★ 4 distinct Convention 1 mechanisms active**. **Verification logs**: ... + 33 (1 row) + 34 (★ FIRST MULTI-ROW row 2) + 35 (★ 2nd MULTI-ROW row 3). **Looking ahead — line 36 (Amount applied to 2026 estimated tax)**: 28th audit OUTSIDE 13ab pair; SEVENTEENTH payments-section audit; ★ another SHARED-DOC audit; ★ likely 3rd MULTI-ROW contribution; ★ line 36 pre-set BEFORE line 33 in wiring (interesting compute-order); ★ likely 21st META-AUDIT.',
    'XLS/computations/35.xlsx audit-trail (this row); lines/33.md §10 row 3 FINALIZED to COMPLETE — 10/10 closed; ★ NO outstanding.md entry (Path A applied)',
    'CLOSED — 10/10. **66 lines; 657 issues; 765/765 backend (UNCHANGED — 18th audit with zero new tests); 20 orchestrators (UNCHANGED); 39-line knowledge convergence (UNCHANGED); 15 doc-drift fixes (UNCHANGED — 35 #4 CLEAN); ★ 35 Path A applications (+1; streak at 7); ★ 29 anti-duplication applications (+1); ★ 0 new gaps surfaced at 35 (★ 7-audit zero-new-gaps streak); ★ 2nd MULTI-ROW Verification log contribution; ★ 20 META-AUDITS (★ sub-type (b) at 95% DOMINANCE — 19 of 20; ★ CLEAN; ★ 2nd consecutive clean after 34 #4; clean trend recovers to ~63%); ★ 4 distinct MFS-protection mechanisms (★ M2 RECURRENCE — 11 M2 instances; 5th in payments-section after 31+32+33+34); ★ 13 distinct complexity dimensions (+1 from 35 #6 — ★ NEW MULTI-GATED STRING PASSTHROUGH); ★ 4 CONVENTIONS baseline (tied with 31/32/33/34); ★ all 4 distinct Convention 1 mechanisms now active across workflow; ★ 25a #5 breadcrumb reuse 7th cross-audit reuse (4th reuse OUTSIDE 25abcd cluster); ★ FIRST UNIFIED MULTI-SUBLINE AUDIT in workflow; ★ SECOND SHARED-DOC AUDIT**. ★ SIXTEENTH payments-section audit. Next: line 36 (amount applied to 2026 est tax; ★ pre-set BEFORE line 33 — interesting compute-order; ★ another SHARED-DOC audit; ★ likely 3rd MULTI-ROW contribution).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 120 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 35 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Notes'],
  ['form1040.refund.refundAmount (35a)', 'Form 1040 page 2, line 35a (PDF key line35a_refund_amount)', '★ = roundMoney(overpaid − line36Capped); null-when-zero via ternary.'],
  ['form1040.refund.directDeposit (35b flag)', 'Implicit (controls 35b/c/d population)', '★ Boolean true when DD elected.'],
  ['form1040.refund.routingNumber (35b)', 'Form 1040 page 2, line 35b (PDF key direct_deposit_routing_number)', '★ String passthrough; multi-gated.'],
  ['form1040.refund.accountType (35c)', 'Form 1040 page 2, line 35c (PDF keys direct_deposit_account_type_checking / _savings)', '★ String "Checking" or "Savings"; mapped to two PDF checkboxes.'],
  ['form1040.refund.accountNumber (35d)', 'Form 1040 page 2, line 35d (PDF key direct_deposit_account_number)', '★ String passthrough; multi-gated.'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Frontend PDF export', 'form-tax-return-1040.component.ts', 'Maps all 5 refund fields to PDF.'],
  ['Form 8888 line 5 validation', 'computeForm8888()', '★ Validates Form 8888 totalAllocated == line 35a; emits FORM_8888_TOTAL_MISMATCH non-blocking flag on mismatch.'],
  ['Form 8888 suppresses 35b/c/d', 'Backend + frontend logic', '★ When Form 8888 active, 35b/c/d on Form 1040 are blank.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 60 }, { wch: 70 }, { wch: 80 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
