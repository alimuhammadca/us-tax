// ============================================================================
//  Generates: C:\us-tax\XLS\computations\25c.xlsx
//
//  Source-of-truth references:
//    - lines/25abcd.md (combined spec; §11 Verification log §11 created at 25a #3
//      with ★ 6-column adaptation; row 1 = 25a COMPLETE; row 2 = 25b COMPLETE;
//      this audit appends row 3 for line 25c)
//    - dependencies/25abcd.md (Audited 2026-04-19; Line 25c Inputs table: 2
//      sources W-2G + Form 8959 Part V line 24; G2 Form 8959 E2E FIXED
//      2026-04-19; G4 K-1/1042-S/8805/8288-A DEFERRED OOS)
//    - knowledge/line-25abcd-federal-withholding.md (renamed at 25a #2; G2 FIXED
//      2026-04-19; G4 deferred OOS)
//    - flowcharts/25abcd.drawio; diagrams/25c.drawio MISSING
//    - TaxReturnComputeService.java:
//        line 19684-19796 — 25a #5 NEW VERIFIED CORRECT breadcrumb (covers
//          25a + 25b + 25c + 25d; planted 2026-05-15)
//        line 19861-19868 — line 25c wiring (8 lines):
//          BigDecimal withholdingOther = sumFederalWithholdingFromEntries(formW2gEntries);
//          if (form8959 != null && form8959.getLine24TotalAmtWithheld() != null) {
//              withholdingOther = roundMoney(safeAmount(withholdingOther)
//                      .add(form8959.getLine24TotalAmtWithheld()));
//              LOG.debugf("Form 8959 Part V line 24 = %s added to line 25c",
//                  form8959.getLine24TotalAmtWithheld());
//          }
//          payments.setWithholdingOther(withholdingOther);
//        line ~15914 — sumFederalWithholdingFromEntries (used for W-2G)
//        Form 8959 Part V line 24 built in buildForm8959 (line ~591)
//    - line25abcd-withholding.spec.ts (★ Test 4 W-2G; ★ Test 8 Form 8959 E2E
//      G2 fix 2026-04-19)
//    - TaxReturnComputeServiceTest.java: line25cWithholdingFromW2G
//
//  Tax year: 2025
//
//  Concept:
//    Form1040.line25c = sum(W-2G box 4) + Form 8959 Part V line 24 (conditional)
//
//    2 sources (medium complexity between 25a single-source and 25b 13-source):
//      Source 1: W-2G box 4 (gambling withholding) — via sumFederalWithholdingFromEntries
//      Source 2 (conditional): Form 8959 Part V line 24 — only added when
//        form8959 != null AND line 24 is non-null
//
//    ★ DEFERRED OOS (G4): K-1 / Form 1042-S / Form 8805 / Form 8288-A
//        withholding — IRS routes these to line 25c but not implemented
//
//  Line 25c audit positioning (14th audit OUTSIDE 13ab pair):
//   • THIRD payments-section audit (after 25a + 25b)
//   • 53rd line audited
//   • ★ 2nd cross-audit anti-duplication via 25a #5 NEW breadcrumb (3rd reuse
//     of 25a #5 overall: 25a #6 same-audit + 25b #5 cross-audit + 25c #5 cross-
//     audit)
//   • ★ SEVENTH META-AUDIT — sub-type (b); ★ ESTABLISHES sub-type (b) at 86%
//     DOMINANCE (6 of 7)
//   • ★ 2nd "already-migrated" closure (after 25b #2)
//   • ★ 2nd combined-spec ROW APPEND (after 25b #3) — row 3 to §11
//   • G2 FIXED 2026-04-19 (Form 8959 E2E coverage); G4 DEFERRED OOS — 25c-
//     SPECIFIC gaps (not bundled cross-references like in 25b #9)
//   • MEDIUM complexity — 2 sources between 25a (1) and 25b (13); ★ CONDITIONAL
//     wiring for Form 8959 is structurally distinct
//
//  Line 25c audit angles (10 issues):
//   1. NO MFS DEFENSIVE GAP NEEDED — 19th defensive-gap-NOT-needed; ★ 9th
//       orchestrator-method-based; ★ SAME NEW MFS PATTERN (3rd instance —
//       pattern recurring further confirmed across 3 payments-section audits).
//   2. DOCUMENTATION HYGIENE — ★ 2nd "already-migrated" closure (after 25b #2);
//       Legacy A migration count UNCHANGED at 18; convergence UNCHANGED at 31.
//   3. SPEC ENHANCEMENT — Append ROW 3 to lines/25abcd.md §11 (★ 2nd combined-
//       spec ROW APPEND; 17th CONSECUTIVE single-row contribution).
//   4. ★ SEVENTH META-AUDIT IN WORKFLOW — sub-type (b) signature; ★ ESTABLISHES
//       DOMINANCE at 86% (6 of 7); 5th CLEAN sub-type (b) META-AUDIT.
//   5. VERIFIED CORRECT — line 25c wiring at ~line 19861-19868; ★ 16th anti-
//       duplication; ★ 2nd cross-audit anti-duplication within payments-
//       section via 25a #5 NEW breadcrumb (3rd reuse overall).
//   6. VERIFIED CORRECT — ★ CONDITIONAL inheritance chain (★ unique to 25c —
//       W-2G aggregation always + Form 8959 conditional wiring); 2-stage chain
//       with conditional branch; ★ STRUCTURALLY distinct from 25a (single-
//       source always) and 25b (13-source always).
//   7. VERIFIED CORRECT — 4 conventions same as 25a (null-when-zero + no SSN
//       filtering + MFJ aggregation + MFS storage segregation); no 5th
//       convention (no SSA-1099 special; Form 8959 condition is structural
//       not a "convention").
//   8. ★ VERIFIED CORRECT — 25c-specific routing + ★ G2 FIX LOCK-IN (Form
//       8959 Part V line 24 E2E coverage; FIXED 2026-04-19); 25c-specific
//       routing distinctions (W-2G → 25c not 25b; Form 8959 → 25c not 25b).
//   9. ⚠️ BUNDLED OBSERVATIONS — 4 observations: (a) ★ G4 DEFERRED OOS (★
//       25c-SPECIFIC; not cross-referenced from sibling); (b) missing
//       diagrams/25c.drawio (★ 8th consecutive); (c) forward-looking 25d
//       audit will continue cross-audit anti-duplication; (d) load-bearing
//       trajectory for 25a #5 advances. 24th Path A. ★ 28 consecutive zero-
//       outstanding. ★ 11th consecutive ZERO NEW GAPS.
//  10. BOUNDARY MILESTONE — THIRD PAYMENTS-SECTION AUDIT; ★ 7th META-AUDIT;
//       ★ G2 fix lock-in; ★ G4 DEFERRED OOS 25c-specific bundled; ★ CONDITIONAL
//       chain structurally distinct.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '25c.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 25c — FEDERAL INCOME TAX WITHHELD FROM OTHER FORMS (W-2G + Form 8959) — 2025'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 25c (page 2; "Federal income tax withheld from other forms")'],
  ['Concept',
    'Line 25c aggregates federal income tax withheld from "other forms" — primarily W-2G (gambling) ' +
    'and Form 8959 Part V line 24 (Additional Medicare Tax withheld). ★ MEDIUM complexity in 25a-25d ' +
    'family — 2 sources between line 25a (1 source) and line 25b (13 sources). ★ STRUCTURALLY UNIQUE: ' +
    'Form 8959 wiring is CONDITIONAL (only added when form8959 != null AND line 24 is non-null); ' +
    'distinct from 25a/25b unconditional aggregation. ★ G4 DEFERRED OOS — K-1 / 1042-S / 8805 / 8288-A ' +
    'would also route to 25c per IRS rules but not implemented.'],
  ['Top-level formula (spec §3c + dependencies §1)',
    'Form1040.line25c = sum(W-2G box 4 amounts) + (Form 8959 Part V line 24 if non-null)\n' +
    '                 [+ K-1 / 1042-S / 8805 / 8288-A — G4 DEFERRED OOS]\n' +
    '\n' +
    'Implementation (line 19861-19868):\n' +
    '  BigDecimal withholdingOther = sumFederalWithholdingFromEntries(formW2gEntries);\n' +
    '  if (form8959 != null && form8959.getLine24TotalAmtWithheld() != null) {\n' +
    '      withholdingOther = roundMoney(safeAmount(withholdingOther)\n' +
    '              .add(form8959.getLine24TotalAmtWithheld()));\n' +
    '      LOG.debugf("Form 8959 Part V line 24 = %s added to line 25c",\n' +
    '          form8959.getLine24TotalAmtWithheld());\n' +
    '  }\n' +
    '  payments.setWithholdingOther(withholdingOther);'],
  ['Surrounding page-2 chain',
    'line 25a = sum(W-2 box 2)                         (withholdingW2 — audited at 25a)\n' +
    'line 25b = sum(12 1099 sources + SSA-1099 special) (withholding1099 — audited at 25b)\n' +
    '★ line 25c = sum(W-2G box 4) + Form 8959 Part V line 24  (★ THIS LINE — withholdingOther)\n' +
    'line 25d = line 25a + line 25b + line 25c          (totalWithholding)\n' +
    'line 33 = line 25d + line 26 + line 32             (total payments)\n' +
    '\n' +
    '★ All 4 sub-lines wired in same method `computeLine31ThroughLine38`\n' +
    '★ Method-level breadcrumb at 25a #5 anchors all 4 sub-line audits'],
  ['★ 25c-specific routing rules (spec §3c + §4b + dependencies)',
    'W-2G box 4 → line 25c (★ NOT line 25b — gambling-specific routing)\n' +
    'Form 8959 Part V line 24 → line 25c (Additional Medicare Tax withheld + RRTA tip withholding)\n' +
    '\n' +
    '★ DEFERRED OOS (G4 — not implemented):\n' +
    '  Schedule K-1 withholding → line 25c (pass-through entities)\n' +
    '  Form 1042-S → line 25c (foreign person withholding)\n' +
    '  Form 8805 → line 25c (§1446 withholding)\n' +
    '  Form 8288-A → line 25c (FIRPTA withholding)\n' +
    '\n' +
    '★ Excluded from line 25c (routed elsewhere):\n' +
    '  W-2 box 2 → line 25a\n' +
    '  1099-series + SSA-1099 + RRB-1099 + 1099-DA → line 25b\n' +
    '  Estimated tax payments → line 26'],
  ['Output target',
    'Primary: form1040.payments.withholdingOther (BigDecimal; line 25c output; null-when-zero)\n' +
    'PDF field: line25c_federal_income_tax_withheld_other_forms (page 2; AcroForm f2_19[0])\n' +
    'Frontend field: form.payments?.withholdingOther'],
  ['Backend implementation',
    '**SINGLE WIRING SITE** — `computeLine31ThroughLine38` at TaxReturnComputeService.java:19699; ' +
    'line 25c computation at lines 19861-19868 (8 lines): ' +
    'Source 1: `sumFederalWithholdingFromEntries(formW2gEntries)` (always-executed W-2G aggregation); ' +
    'Source 2: conditional `if (form8959 != null && form8959.getLine24TotalAmtWithheld() != null)` ' +
    'guard before adding Form 8959 line 24; ' +
    '`payments.setWithholdingOther(withholdingOther)`. ' +
    '★ Covered by 25a #5 NEW VERIFIED CORRECT breadcrumb at ~line 19688-19783 — sub-line field map + ' +
    'G2 Form 8959 lock-in anchor (lock-in test line25cWithholdingFromW2G + e2e Test 4 + Test 8).'],
  ['IRS source',
    'IRS 2025 Form 1040 (page 2 line 25c "Federal income tax withheld from other forms") + ' +
    '2025 Instructions for Form 1040. Local cross-checks: docs/books/i1040gi_2025.txt + J.K. Lasser\'s ' +
    'Your Income Tax 2025. ★ 2025 — no changes to line 25c routing; Form 8959 Part V remains the ' +
    'Medicare withholding source. ★ G2 fix 2026-04-19 added E2E coverage; ★ G4 deferred OOS unchanged.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'prepare() loads formW2gEntries from Firestore', '★ User-scoped (NEW MFS PATTERN per 25a #1).'],
  [2, 'buildForm8959 (line ~591) computes Form 8959 Part V line 24', 'Form 8959 line 24 = excess Medicare withholding (box 6 > 1.45% × wages) + RRTA tip withholding. Set to null when zero.'],
  [3, 'computeLine31ThroughLine38 reads formW2gEntries + form8959', 'No per-spouse parameters; storage-level user-scoping handles MFS.'],
  [4, 'sumFederalWithholdingFromEntries(formW2gEntries) at line 19861', 'W-2G box 4 aggregation; standard `federalIncomeTaxWithheldAmount` field; null-when-no-entries.'],
  [5, '★ CONDITIONAL: if form8959 != null AND line 24 non-null at line 19863-19867', '★ UNIQUE to 25c — conditional source aggregation; distinct from 25a/25b unconditional aggregation. Adds Form 8959 line 24 to running total via safeAmount + roundMoney.'],
  [6, 'payments.setWithholdingOther(withholdingOther) at line 19868', 'Stores result; null-when-zero (helper returns null when W-2G empty AND form8959 is null).'],
  [7, 'Downstream: line 25d aggregation', '`totalWithholding = nz(25a) + nz(25b) + nz(25c)`. Line 25c is the third addend.'],
  [8, 'Downstream: line 33 total payments', '`line33 = line25d + line26 + line32`. Line 25c affects this transitively.'],
  [],
  ['INVARIANTS / VALIDATIONS (spec §7)'],
  ['Invariant', 'Rationale'],
  ['Line 25c ≥ 0', 'Each source ≥ 0; conditional add cannot produce negative; sum ≥ 0.'],
  ['Line 25c = W-2G withholding + (Form 8959 line 24 if applicable)', 'STRUCTURALLY enforced at line 19861-19868.'],
  ['Line 25c stored as null when zero', 'Helper returns null when W-2G empty; conditional guard prevents Form 8959 add when null; setter stores as-is.'],
  ['MFJ aggregates both spouses\' W-2G withholding', 'STRUCTURALLY enforced — formW2gEntries aggregates both spouses\' W-2G entries.'],
  ['MFS reports only own W-2G withholding', '★ STRUCTURALLY enforced via Firestore user-scoping (NEW MFS PATTERN).'],
  ['Form 8959 line 24 added only when non-null (★ conditional)', '★ STRUCTURALLY enforced at line 19863 guard; prevents NPE; LOG.debugf on add.'],
  ['G4 deferred OOS (K-1/1042-S/8805/8288-A) → null contribution', 'Not implemented; treated as null (no field exists); no contribution to withholdingOther.'],
  ['Lock-in: line25cWithholdingFromW2G', 'W-2G $2400 → withholdingOther = $2400.'],
  ['Lock-in: E2E Test 8 (★ G2 fix 2026-04-19)', '$250k wages → Form 8959 Part V line 24 = $450 → withholdingOther.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 38 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 25c'],
  ['Line 25c takes 2 IMPLEMENTED SOURCES (W-2G + Form 8959 Part V line 24) + 4 DEFERRED OOS sources (K-1/1042-S/8805/8288-A). MEDIUM complexity — between 25a (1 source) and 25b (13 sources). ★ STRUCTURALLY UNIQUE — Form 8959 source is CONDITIONAL (added only when non-null) vs. 25a/25b unconditional aggregation.'],
  [],
  ['IMPLEMENTED SOURCES (2)'],
  ['#', 'Source', 'Statement/form', 'Field read', 'Java variable / computation', 'Conditional?'],
  [1, 'W-2G box 4 (gambling withholding)', '`w-2g`', 'federalIncomeTaxWithheldAmount', 'formW2gEntries (List<Map>)', 'No — always aggregated'],
  [2, 'Form 8959 Part V line 24 (★ Additional Medicare Tax + RRTA tip withholding)', 'Form 8959 (built form)', 'Form8959.line24TotalAmtWithheld', 'form8959 (built in prepare() line ~591)', '★ YES — only added if form8959 != null AND line 24 non-null'],
  [],
  ['DEFERRED OOS SOURCES (★ G4 — 4 sources not implemented)'],
  ['#', 'Source', 'Status', 'Why deferred'],
  [3, 'Schedule K-1 withholding', 'NOT IMPLEMENTED', 'Pass-through entity withholding; IRS routes to line 25c; deferred OOS per G4'],
  [4, 'Form 1042-S withholding', 'NOT IMPLEMENTED', 'Foreign person withholding; IRS routes to line 25c; deferred OOS per G4'],
  [5, 'Form 8805 withholding', 'NOT IMPLEMENTED', '§1446 withholding (foreign partner share); IRS routes to line 25c; deferred OOS per G4'],
  [6, 'Form 8288-A withholding', 'NOT IMPLEMENTED', 'FIRPTA withholding (real estate); IRS routes to line 25c; deferred OOS per G4'],
  [],
  ['⚠️ NO DEDICATED USER INPUT FORM FOR LINE 25c OUTPUT'],
  ['Line 25c has NO `form-line25c-*.xlsx` in input_forms. W-2G entries via W-2G intake; Form 8959 built from W-2 + tip-form data. Line 25c itself rendered on `form-tax-return-1040` Tax Return view + Form 1040 PDF only.'],
  [],
  ['⚠️ MFS PROTECTION via NEW MFS PATTERN (per 25a #1 — 3rd recurrence)'],
  ['Mechanism', 'Detail'],
  ['★ Storage-level user scoping', 'formW2gEntries loaded via Firestore queries scoped to user uid. form8959 built in prepare() from user-scoped W-2 + tip data. MFS taxpayer/spouse have separate Firestore documents.'],
  ['No in-method null-shadow needed', 'computeLine31ThroughLine38 takes lists/objects as parameters — no per-spouse pair; MFS segregation happens BEFORE method is called.'],
  ['MFJ aggregation', 'For MFJ, formW2gEntries contains both spouses\' W-2G entries; form8959 includes both spouses\' wages.'],
  ['→ NO MFS GUARD NEEDED at line 25c wiring site', '19th defensive-gap-NOT-needed; ★ 9th orchestrator-method-based audit; ★ 3rd instance of NEW MFS PATTERN — pattern recurrence further confirmed', '(See 25c #1)'],
  [],
  ['⚠️ EXPLICITLY NOT LINE 25c (routed elsewhere)'],
  ['Source', 'Routed to', 'Why not 25c'],
  ['W-2 box 2', 'Line 25a', 'Spec §3a — W-2 has its own sub-line'],
  ['1099-series box 4', 'Line 25b', 'Spec §3b — 1099-family routed to 25b'],
  ['SSA-1099 + RRB-1099 + RRB-1099-R + 1099-DA', 'Line 25b', 'Spec §4a — IRS 2025 routes these to 25b (NOT 25c despite "other government forms" appearance)'],
  ['Estimated tax payments', 'Line 26', 'Estimated payments are separate'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 55 }, { wch: 25 }, { wch: 35 }, { wch: 45 }, { wch: 35 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 25c'],
  ['Line 25c uses ZERO reference data directly — pure aggregation with conditional. Form 8959 Part V (upstream) DOES use 2025 reference data (1.45% Medicare rate; AMT thresholds) but those are out of scope for line 25c audit.'],
  [],
  ['Constant', 'Value', 'Statutory Basis', 'Backend identifier'],
  ['(None — pure aggregation line)', '—', 'Spec §3c + dependencies/25abcd.md', '—'],
  [],
  ['★ Source count comparison across 25a-25d sub-lines'],
  ['Sub-line', '# Implemented sources', '# Deferred OOS', 'Total complexity'],
  ['line 25a (W-2 box 2)', '1', '0', 'SIMPLEST — single unconditional source'],
  ['line 25b (1099-family + SSA + RRB + 1099-DA)', '13', '0', '★ HEAVIEST — 13 unconditional sources'],
  ['**line 25c (★ THIS LINE)**', '**2**', '**4 (G4 K-1/1042-S/8805/8288-A)**', '**★ MEDIUM — 2 implemented (1 conditional) + 4 deferred OOS**'],
  ['line 25d (sum 25a + 25b + 25c)', '0 (pure sum)', '0', 'Trivial'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 30 }, { wch: 50 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 25c Persistence + Downstream Consumers'],
  ['Line 25c sets one field on Payments output model. Same downstream pattern as 25a/25b — feeds 25d → line 33 total payments.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.payments.withholdingOther', '`computeLine31ThroughLine38` line 19868', '★ CANONICAL line 25c output. = sumFederalWithholdingFromEntries(formW2gEntries) + (conditional Form 8959 line 24). Null-when-zero.'],
  [],
  ['SAME-METHOD DOWNSTREAM — line 25d in computeLine31ThroughLine38'],
  ['form1040.payments.totalWithholding (line 25d)', '~line 19878-19882', '★ line 25d = nz(25a) + nz(25b) + nz(25c). Line 25c is the third addend.'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Line 33 = line 25d + line 26 + line 32', '~line 19960', 'Line 25c affects line 33 transitively via line 25d.'],
  ['Frontend PDF export', 'form-tax-return-1040.component.ts', '`values[\'line25c_federal_income_tax_withheld_other_forms\'] = formatAmount(payments?.withholdingOther)`'],
  [],
  ['PDF Output'],
  ['PDF Field', 'Field Code'],
  ['Line 25c amount (page 2)', 'line25c_federal_income_tax_withheld_other_forms'],
  ['AcroForm path', 'topmostSubform[0].Page2[0].f2_19[0]'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 50 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 25c'],
  ['Line 25c emits NO blocking flags directly. W-2G intake has its own validation. Form 8959 building has its own validation. Line 25c silently aggregates whatever both sources contain.'],
  [],
  ['Flag code', 'Severity', 'Condition'],
  ['(None at line 25c site)', 'N/A', 'No validation at line 25c.'],
  [],
  ['SPEC §7 STRUCTURAL INVARIANTS'],
  ['Invariant', 'How enforced'],
  ['line 25c ≥ 0', 'STRUCTURALLY enforced — sources ≥ 0; conditional add cannot produce negative.'],
  ['line 25c = W-2G + (Form 8959 line 24 if applicable)', 'STRUCTURALLY enforced at line 19861-19868.'],
  ['line 25c stored as null when zero', 'STRUCTURALLY enforced — helper returns null when W-2G empty; conditional guard prevents Form 8959 add when null.'],
  ['★ Form 8959 wiring is CONDITIONAL (unique to 25c)', 'STRUCTURALLY enforced at line 19863 — `if (form8959 != null && form8959.getLine24TotalAmtWithheld() != null)` guard prevents NPE; LOG.debugf on successful add.'],
  ['★ G4 OOS sources (K-1/1042-S/8805/8288-A) contribute null', 'STRUCTURALLY enforced — fields not implemented; no contribution to withholdingOther.'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 14 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 25c is the "other forms" federal income tax withheld aggregation (★ MEDIUM complexity — 2 implemented sources W-2G + Form 8959, conditional wiring for Form 8959). 14th audit OUTSIDE 13ab pair; THIRD payments-section audit (after 25a + 25b); ★ 2nd cross-audit anti-duplication within payments-section via 25a #5 NEW breadcrumb; ★ 7th META-AUDIT pushing sub-type (b) DOMINANCE to ~86%. 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-15 — CROSS-REFERENCE — NO MFS DEFENSIVE GAP NEEDED at line 25c wiring site (19th defensive-gap-NOT-needed; ★ 9th orchestrator-method-based; ★ 3rd instance of NEW MFS PATTERN — RECURRENCE FURTHER CONFIRMED across 3 different complexity profiles)',
    '**Per-input MFS-leakage analysis**: line 25c wiring at TaxReturnComputeService.java:19861-19868 reads (a) `formW2gEntries` (Firestore user-scoped) + (b) `form8959` object (built in prepare() from user-scoped W-2 + tip data). Neither is a per-spouse pair. **★ SAME NEW MFS PATTERN as 25a #1 + 25b #1 — "upstream-data-segregated-at-storage"** — 3rd instance confirms pattern is structurally definitive for payments-section. **19th defensive-gap-NOT-needed Issue #1 in workflow**. **★ 9th orchestrator-method-based audit with transitive inheritance** (after 8 prior: 18 #1 + 20 #1 + 21 #1 + 22 #1 + 23 #1 + 24 #1 + 25a #1 + 25b #1). **MFS-guard cascade UNCHANGED at 20 orchestrators**. ★ Pattern distribution after 9 audits: 6 transitive inheritance (sub-pattern A; credits-section) + 3 upstream-data-segregated-at-storage (sub-pattern B; payments-section). ★ Pattern will recur for 25d/26/27a/28/29/31/32/33 future audits. Backend tests: **765/765 unchanged**.',
    'TaxReturnComputeService.java:19861-19868 (line 25c wiring; 8 lines)',
    'CLOSED — defensive-gap-NOT-needed. **19th in workflow** (★ 9th orchestrator-method-based; ★ 3rd instance of NEW MFS PATTERN — RECURRENCE FURTHER CONFIRMED across 3 different complexity profiles: 1 source/25a + 13 sources/25b + 2 sources with conditional/25c). ★ Pattern proven: source-count agnostic + aggregation-style agnostic (unconditional/variadic/conditional) + structurally definitive for payments-section. ★ Pattern distribution after 9 audits: 6 transitive inheritance (sub-pattern A; credits-section complete) + 3 upstream-data-segregated-at-storage (sub-pattern B; payments-section ongoing — will recur for 25d/26/27a/28/29/31/32/33). MFS-guard cascade UNCHANGED at 20 orchestrators. Pure cross-reference closure. 765/765 unchanged.'],

  [2, 'RESOLVED 2026-05-15 — DOCUMENTATION HYGIENE — ★ 2nd "already-migrated" closure in workflow (combined-spec; inherits from 25a #2; pattern recurrence confirms category robust)',
    '**The situation**: Knowledge file renamed at 25a #2 2026-05-15 (combined-spec property — single rename covers 25a-25d). Line 25c inherits via same shared knowledge file `line-25abcd-federal-withholding.md`. **★ 2nd "already-migrated" closure in workflow** (after 25b #2 was FIRST) — pattern recurring; precedent now firmly established for combined-spec sub-line audits. 3 verification checks pass: (1) renamed file exists; (2) zero hits for separate per-sub-line knowledge file; (3) generator uses post-rename name. **Convergence count UNCHANGED at 31** (no increment). **Legacy A migration count UNCHANGED at 18**. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\knowledge\\line-25abcd-federal-withholding.md (renamed at 25a #2; covers 25c)',
    'CLOSED — ★ ALREADY MIGRATED at 25a #2 (combined-spec property). 3 verification checks pass: (1) renamed file exists at descriptive path; (2) zero hits for separate per-sub-line `knowledge_line25c` references; (3) generator uses post-rename name. **★ 2nd "already-migrated" closure in workflow** (after 25b #2 FIRST) — pattern recurrence confirms category is robust; future 25d #2 expected to follow same pattern. ★ Combined-spec property fully validated across 3 audits (25a + 25b + 25c). **Convergence count UNCHANGED at 31** (no increment). **Legacy A migration count UNCHANGED at 18**. Pure verification closure — no action needed.'],

  [3, 'RESOLVED 2026-05-15 — SPEC ENHANCEMENT — Append ROW 3 to lines/25abcd.md §11 Verification log (★ 2nd combined-spec ROW APPEND in workflow; 17th CONSECUTIVE single-row contribution; pattern recurrence confirms combined-spec audit accumulation)',
    '**Goal**: append a NEW ROW (row 3) to the existing `## 11) Verification log` section in `lines/25abcd.md` for the line 25c audit. **★ 2nd combined-spec ROW APPEND in workflow** (after 25b #3 FIRST). Pre-state: §11 has 2 rows (25a COMPLETE + 25b COMPLETE). Post-state: row 3 in IN-PROGRESS state for 25c capturing #1 (19th defensive-gap-NOT-needed; ★ 3rd NEW MFS PATTERN) + #2 (★ 2nd "already-migrated" closure) + #3 (this row append). Finalized to COMPLETE at Issue #10. **★ 17th CONSECUTIVE single-row contribution in workflow**. Pure spec enhancement.',
    'C:\\us-tax\\lines\\25abcd.md §11 Verification log (append row 3 to existing 6-column structure)',
    'CLOSED — ROW 3 appended to existing §11 (6-column structure from 25a #3). Row 3 in IN-PROGRESS state with #1+#2+#3 closures enumerated; will be finalized to COMPLETE at Issue #10. **★ 2nd combined-spec ROW APPEND in workflow** (after 25b #3 FIRST) — pattern recurrence confirms combined-spec audit accumulation works as designed; future 25d #3 expected to be 3rd ROW APPEND. **★ 17th CONSECUTIVE single-row contribution in workflow** (per-audit single-row contribution counted; §11 table total now 3 rows). ★ Pattern established: combined-spec families produce N-row Verification logs (one per sub-line audit).'],

  [4, 'RESOLVED 2026-05-15 — ★ SEVENTH META-AUDIT IN WORKFLOW — sub-type (b) signature (same as 22+23+24+25a+25b); ★ ESTABLISHES DOMINANCE at 86% (6 of 7); 5th CLEAN sub-type (b) META-AUDIT; ★ clean trend strengthens to 67% within sub-type b',
    '**The situation**: Combined-spec META-AUDIT reuse — same dependencies/25abcd.md + knowledge/line-25abcd-federal-withholding.md §0 banners serve 25c #4 (and previously served 25a #4 + 25b #4). 3rd combined-spec META-AUDIT in workflow. **★ SEVENTH META-AUDIT in workflow**. **★ ESTABLISHES sub-type (b) at 86% DOMINANCE — 6 of 7 META-AUDITS** (lines 22+23+24+25a+25b+25c); line 21 alone uses sub-type (a). ★ 5th CLEAN sub-type (b) META-AUDIT (★ clean trend further strengthens to 67% within sub-type b: 4 clean lines 23+25a+25b+25c + 2 drift-surfacing lines 22+24). **★ 7 consistency checks pass** (same as prior META-AUDITS): (a) ✅ method computeLine31ThroughLine38 at line 19699; line 25c at 19861-19868; (b) ✅ Payments.withholdingOther field exists; (c) ✅ frontend mapping; (d) ✅ e2e spec with Tests 4 (W-2G) + 8 (Form 8959 G2); (e) ✅ lock-in tests; (f) ✅ formula matches spec §3c + code; (g) ✅ null-when-zero + conditional Form 8959 wiring matches. **★ NO doc-drift fix needed** — G2 FIXED 2026-04-19 + G4 deferred OOS; spec + knowledge + code consistent.',
    'C:\\us-tax\\lines\\25abcd.md (NO §0 banner); C:\\us-tax\\dependencies\\25abcd.md line 3 (Audited 2026-04-19); knowledge file §0',
    'CLOSED — SEVENTH META-AUDIT consistency check complete. **★ ESTABLISHES sub-type (b) at 86% DOMINANCE — 6 of 7 META-AUDITS use it** (lines 22+23+24+25a+25b+25c); only line 21 uses sub-type (a). **★ 5th CLEAN sub-type (b) META-AUDIT** (along with lines 23 + 25a + 25b). **★ Clean trend strengthens to 67%** within sub-type (b): 4 clean (lines 23 + 25a + 25b + 25c) + 2 drift-surfacing (lines 22 + 24) — clean outcomes firmly dominant. ★ Progression: line 22 (67%) → 23 (67%) → 24 (75%) → 25a (80%) → 25b (83%) → 25c (86%); asymptotic toward (n-1)/n. ★ 3rd combined-spec META-AUDIT reuse — same dependencies+knowledge §0 source served 25a #4 + 25b #4 + 25c #4. 7/7 consistency checks pass; no doc-drift.'],

  [5, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — line 25c wiring at ~line 19861-19868; ★ 16th anti-duplication application; ★ 2nd CROSS-AUDIT anti-duplication within payments-section via 25a #5 NEW breadcrumb (advances trajectory toward LOAD-BEARING CONFIRMATION at 25d)',
    '**Closure intent**: pure cross-reference closure — **NO new breadcrumb**. Line 25c covered by **25a #5 NEW breadcrumb** at TaxReturnComputeService.java:~19688-19783 (planted 2026-05-15 during line 25a audit), which explicitly documents line 25c: *"line 25c = sumFederalWithholdingFromEntries(formW2gEntries) + (form8959.line24TotalAmtWithheld if not null) (2 sources + 4 OOS K-1/1042-S/8805/8288-A) — at line 15189-15199"* (now at ~line 19861-19868). **★ 2nd CROSS-AUDIT anti-duplication within payments-section** (after 25b #5 was FIRST). ★ 3rd reuse of 25a #5 NEW breadcrumb overall (25a #6 same-audit + 25b #5 cross-audit + 25c #5 cross-audit). ★ 25a #5 trajectory: 1 more cross-audit reuse (at 25d) will CONFIRM load-bearing status (mirrors 20 #6 → 24 #6). 3-source coverage: spec §3c + dependencies + 25a #5. **16th anti-duplication application**. Pure cross-reference closure. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:19861-19868 (line 25c wiring; covered by 25a #5 NEW breadcrumb at ~line 19688)',
    'CLOSED — verified correct via 25a #5 NEW breadcrumb + spec §3c + dependencies/25abcd.md (3-source coverage). **16th anti-duplication application**. **★ 2nd CROSS-AUDIT anti-duplication within payments-section** (after 25b #5 FIRST; pattern recurring). ★ 3rd reuse of 25a #5 NEW breadcrumb overall: 25a #6 same-audit + 25b #5 cross-audit + 25c #5 cross-audit. ★ 25a #5 trajectory advances — 1 more reuse at 25d audit will trigger ★ LOAD-BEARING CONFIRMATION milestone (mirrors 20 #6 → 24 #6 in credits-section). Pure cross-reference closure.'],

  [6, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — ★ CONDITIONAL inheritance chain (★ STRUCTURALLY UNIQUE among 25a-25d — W-2G unconditional + Form 8959 conditional); ★ 4th distinct complexity dimension in workflow (conditional branching)',
    '**Closure intent**: pure cross-reference closure — verifies the conditional inheritance chain that makes line 25c correct AND MFS-clean. **★ STRUCTURALLY UNIQUE among 25a-25d**: line 25c is the ONLY sub-line with a conditional source aggregation. 25a (1 source unconditional); 25b (13 sources unconditional); 25c (1 unconditional + 1 conditional); 25d (pure sum unconditional). **Chain stages**: **(1)** W-2G source via Firestore user-scoped formW2gEntries; entries have `federalIncomeTaxWithheldAmount`. **(2)** Form 8959 source via buildForm8959 (built in prepare() from user-scoped W-2 + tip data); has `line24TotalAmtWithheld`. **(3)** sumFederalWithholdingFromEntries(formW2gEntries) — always-executed W-2G aggregation. **(4)** ★ CONDITIONAL: `if (form8959 != null && form8959.getLine24TotalAmtWithheld() != null)` guard at line 19863 — only adds Form 8959 line 24 when both non-null; ★ STRUCTURALLY distinct from 25a/25b unconditional aggregation. **(5)** addNonNull-equivalent via safeAmount + roundMoney inside conditional block. **(6)** payments.setWithholdingOther — pure write; null-when-zero. **★ KEY PROPERTY**: conditional branch is the structural distinction; pure aggregation cannot introduce MFS leakage at either branch path. **★ G4 DEFERRED OOS chain**: K-1/1042-S/8805/8288-A would add 4 more conditional sources but not implemented; chain doesn\'t extend to them. **No new breadcrumb** — chain documented via 25a #5 NEW breadcrumb (which explicitly notes the conditional Form 8959 wiring + 4 OOS sources). Pure cross-reference closure.',
    'TaxReturnComputeService.java:19861-19868 (★ conditional Form 8959 wiring at line 19863-19867); chain documented via 25a #5 NEW breadcrumb',
    'CLOSED — verified correct via CONDITIONAL inheritance chain. **★ STRUCTURALLY UNIQUE among 25a-25d** (only sub-line with conditional source aggregation): 25a unconditional single-source; 25b unconditional 13-source; **25c MIXED (1 unconditional W-2G + 1 conditional Form 8959)**; 25d unconditional sum. ★ Chain: Stage 1 W-2G unconditional → Stage 2 ★ CONDITIONAL Form 8959 (double-null guard on form8959 object + line24TotalAmtWithheld field; handles all 4 nullity combinations correctly) → Stage 3 setter (null-when-zero). **★ 4th distinct complexity dimension in workflow** (★ CONDITIONAL BRANCHING — distinct from depth at line 23, cumulative depth at line 24, breadth at line 25b). ★ KEY PROPERTY: conditional gates aggregation, NOT MFS protection — protection comes from how Form 8959 is built (user-scoped W-2/tip data in prepare()). MFS-clean by construction. No new breadcrumb — covered by 25a #5.'],

  [7, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — 4 conventions same as 25a (★ NO 5th convention — conditional Form 8959 is STRUCTURAL not field-name handling; preserves audit-trail vocabulary distinction)',
    '**Closure intent**: pure verification closure — confirms four line-25c-specific conventions same as 25a (★ unlike 25b which had ★ Convention 5 SSA-1099 SPECIAL FIELD NAME unique to 25b). **Convention 1 — Null-when-zero**: sumFederalWithholdingFromEntries returns null when no W-2G entries; conditional guard prevents Form 8959 add when null; setter stores as-is. **Convention 2 — No SSN filtering**: W-2G entries iterated regardless of SSN; return-level withholding. **Convention 3 — MFJ aggregation**: both spouses\' W-2G entries summed; form8959 includes both spouses\' Medicare wages. **Convention 4 — MFS storage segregation**: Firestore user-scoping (NEW MFS PATTERN; 3rd instance). ★ NO Convention 5 (unlike 25b\'s SSA-1099 special field) — Form 8959 conditional wiring is STRUCTURAL (handled by `if` guard) not a "convention" in the same sense as field-name handling. Lock-in tests: line25cWithholdingFromW2G + e2e Test 4 (W-2G basic) + e2e Test 8 (★ G2 Form 8959 fix lock-in 2026-04-19). No new breadcrumb. Pure verification closure.',
    'TaxReturnComputeService.java:19861-19868 (line 25c wiring); spec + knowledge §13 (MFS/MFJ rules); lock-in tests',
    'CLOSED — verified correct. 4 conventions same as 25a: **Convention 1 — null-when-zero** (same as 20+21+23+25a+25b) + **Convention 2 — no SSN filtering** (return-level) + **Convention 3 — MFJ aggregation** + **Convention 4 — MFS storage segregation** (NEW MFS PATTERN). **★ NO 5th convention** — UNLIKE line 25b which had Convention 5 SSA-1099 SPECIAL FIELD NAME (★ unique to 25b\'s field-name handling), line 25c\'s conditional Form 8959 wiring is **STRUCTURAL** (handled by `if` guard at line 19863), not a "convention" in the field-name-handling sense. ★ Audit-trail vocabulary distinction preserved: conventions = field-name/storage patterns (Issue #7); structural features = control flow/conditional branching (verified in Issue #6 inheritance chain). Lock-in tests: line25cWithholdingFromW2G + e2e Test 4 (W-2G) + e2e Test 8 (★ G2 Form 8959 fix; conditional aggregation verified end-to-end). 3-source coverage. No new breadcrumb.'],

  [8, 'RESOLVED 2026-05-15 — ★ VERIFIED CORRECT — 2 routing distinctions specific to line 25c + ★ G2 FIX LOCK-IN (Form 8959 Part V line 24 E2E coverage FIXED 2026-04-19); ★ MEDIUM routing complexity vs. 25b MOST and 25a/25d NONE',
    '**Closure intent**: pure verification closure — confirms 25c-specific routing distinctions + ★ G2 fix lock-in. **Routing 1 — W-2G → line 25c (★ NOT line 25b)**: IRS 2025 routes W-2G to line 25c per spec §4b. Common implementation might assume gambling form is "1099-like" → 25b; **WRONG**: gambling is "other forms" → 25c. STRUCTURALLY enforced — formW2gEntries in line 25c argument list at line 19861, NOT in line 25b at line 19850. **Routing 2 — Form 8959 Part V line 24 → line 25c (★ NOT Form 1040 main)**: Form 8959 line 24 is the "Additional Medicare Tax withheld" subtotal (Part V); routed to line 25c per spec §3c. NOT to be confused with Form 8959 line 18 (total Additional Medicare Tax owed) which goes to Schedule 2 line 11 → line 23. STRUCTURALLY enforced — conditional `if (form8959 != null && form8959.getLine24TotalAmtWithheld() != null)` guard at line 19863 reads `line24TotalAmtWithheld` field. **★ G2 FIX LOCK-IN (2026-04-19)**: E2E Test 8 added — $250k wages → Form 8959 Part V line 24 = $450 → withholdingOther. Pre-G2 (before 2026-04-19), Form 8959 → line 25c was untested E2E (only unit tests existed). G2 fix added end-to-end coverage. Lock-in test prevents regression. **★ MEDIUM routing complexity** (vs. 25a 0 rules, 25b 4 rules, 25d 0 rules) — line 25c has 2 routing distinctions (W-2G vs. 1099; Form 8959 line 24 vs. line 18). No new breadcrumb — covered by 25a #5 + spec §3c/§4b + G2 lock-in test.',
    'TaxReturnComputeService.java:19861-19868 (W-2G + Form 8959 conditional wiring); e2e/tests/line25abcd-withholding.spec.ts Test 8 (G2 fix 2026-04-19); spec §3c + §4b',
    'CLOSED — verified correct. **Routing 1 — §3c+§4b W-2G → 25c (★ NOT line 25b)**: gambling withholding (box 4) routed to 25c not 25b; STRUCTURALLY enforced — formW2gEntries in 25c argument list at line 19861, NOT in 25b variadic at line 19850. **Routing 2 — §3c Form 8959 Part V line 24 → 25c (★ NOT line 23)**: ★ CRITICAL distinction — Form 8959 has TWO Form 1040 outputs: line 18 (total Additional Medicare Tax owed) → Schedule 2 line 11 → Form 1040 line 23; line 24 (withholding subtotal) → Form 1040 line 25c. Common confusion conflates them; STRUCTURALLY enforced — conditional guard reads `line24TotalAmtWithheld` field at line 19863-19867 (NOT `line18TotalAdditionalMedicareTax` which feeds line 23). **★ G2 FIX LOCK-IN (2026-04-19)**: E2E Test 8 added ($250k wages → Form 8959 Part V line 24 = $450 → withholdingOther); pre-G2 had no end-to-end coverage; lock-in test held for 1 month. **★ MEDIUM routing complexity** — 2 rules (vs. line 25a 0, line 25b 4 MOST, line 25d 0). Both STRUCTURALLY enforced. No new breadcrumb — covered by 25a #5 NEW breadcrumb (G2 lock-in anchor + sub-line field map) + spec §3c+§4b + dependencies (3-source coverage).'],

  [9, 'RESOLVED 2026-05-15 — ⚠️ BUNDLED OBSERVATIONS — 4 observations (★ 24th Path A application; ★ 28 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS — extends first 20-streak by 8; ★ 11th CONSECUTIVE AUDIT WITH ZERO NEW GAPS — double-digit milestone deepens; ★ 8th consecutive credits/payments-section audit with missing-diagrams gap)',
    '**Closure intent**: pure xlsx-flip observation bundle — **NO code change**; **NO outstanding.md entry**. FOUR observations bundled. **(a) ★ G4 DEFERRED OOS — K-1/1042-S/8805/8288-A → line 25c**: ★ 25c-SPECIFIC gap (unlike previous audits where G4 was cross-referenced). 4 sources not implemented per IRS routing: Schedule K-1 (pass-through), Form 1042-S (foreign person), Form 8805 (§1446), Form 8288-A (FIRPTA). Already in outstanding.md from 2026-04-19 cycle. Affects high-net-worth filers + foreign-person scenarios + real estate transactions. **(b) Missing `diagrams/25c.drawio` cosmetic** — ★ 8th consecutive credits/payments-section audit with this gap (after 20-24 + 25a + 25b). One-shot cleanup overdue across 8 lines. **(c) ★ Forward-looking: 25d audit will be 4th reuse of 25a #5 → ★ LOAD-BEARING CONFIRMATION** (mirrors 20 #6 → 24 #6 trajectory). **(d) 25a #5 NEW breadcrumb trajectory advances** — after 25c #5, 25a #5 has been used 3 times total (25a #6 same-audit + 25b #5 + 25c #5 cross-audit); 1 more (at 25d) confirms load-bearing. **★ Anti-fragmentation policy applied**. **★ 24th PATH A APPLICATION**. **★ 28 consecutive zero-outstanding walkthroughs** (extends first 20-streak by 8). **★ 11th CONSECUTIVE ZERO NEW GAPS** (double-digit milestone deepens).',
    'G4 OOS K-1/1042-S/8805/8288-A (★ 25c-SPECIFIC); diagrams/25c.drawio (missing); future 25d audit; 25a #5 trajectory',
    'CLOSED — pure observation bundle. **★ 24th Path A application**. **★ 28 consecutive zero-outstanding walkthroughs** (extends first 20-streak by 8). **★ 11th CONSECUTIVE ZERO NEW GAPS** (double-digit milestone deepens — codebase stability signal strengthens). 4 observations: (a) G4 DEFERRED OOS K-1/1042-S/8805/8288-A → line 25c (★ 25c-SPECIFIC in this audit; affects high-net-worth + foreign-person + real estate scenarios; documented in outstanding.md from 2026-04-19); (b) Missing `diagrams/25c.drawio` cosmetic — ★ 8th consecutive credits/payments-section audit with this gap (now overdue across 8 lines: 20-24 + 25a + 25b + 25c); (c) ★ Forward-looking: 25d audit will be 4th reuse of 25a #5 → ★ LOAD-BEARING CONFIRMATION milestone (mirrors 20 #6 → 24 #6 in credits-section); (d) 25a #5 NEW breadcrumb trajectory advances — 3 total uses after 25c #5; 1 more reuse confirms load-bearing.'],

  [10, 'RESOLVED 2026-05-15 — BOUNDARY MILESTONE — Line 25c walkthrough complete at 10/10; ★ THIRD PAYMENTS-SECTION AUDIT; multiple pattern RECURRENCES + ★ FIRSTs (CONDITIONAL chain STRUCTURALLY UNIQUE + 4th complexity dimension + G2 fix lock-in verified + G4 OOS finds natural home); ★ 7th META-AUDIT (sub-type b at 86% DOMINANCE); ★ 28 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS; ★ 11th CONSECUTIVE AUDIT WITH ZERO NEW GAPS (double-digit milestone deepens); ★ 17th CONSECUTIVE single-row contribution',
    'Pure xlsx-flip + Verification log row 3 finalization — **CLOSES the 25c walkthrough at 10/10**. TWO file touches: (a) this row flipped to RESOLVED; (b) lines/25abcd.md §11 Verification log row 3 finalized IN-PROGRESS → **COMPLETE — 10/10 closed**. **Eight themes**: (1) ★ Structural positioning — 14th audit OUTSIDE 13ab pair; ★ THIRD payments-section audit; 53rd line; ★ MEDIUM complexity (2 sources between 25a single and 25b 13); ★ CONDITIONAL Form 8959 wiring STRUCTURALLY UNIQUE among 25a-25d. (2) **★ MFS-guard cascade UNCHANGED at 20 orchestrators** — 19th defensive-gap-NOT-needed; ★ 9th orchestrator-method-based; ★ 3rd instance of NEW MFS PATTERN — pattern further confirmed recurring. (3) **★ 7th META-AUDIT** — sub-type (b) at 86% DOMINANCE (6 of 7); 5th CLEAN sub-type (b) META-AUDIT (clean trend strengthens to 67% within sub-type b). (4) **★ 2nd CROSS-AUDIT anti-duplication within payments-section** (Issue #5) — 3rd reuse of 25a #5 NEW breadcrumb; 1 more (at 25d) confirms load-bearing. (5) **Knowledge convergence UNCHANGED at 31** (Issue #2: ★ 2nd "already-migrated" closure). (6) **★ 16 ANTI-DUPLICATION applications**. (7) **★ G2 FIX LOCK-IN verified** (Issue #8: Form 8959 Part V line 24 E2E coverage FIXED 2026-04-19; lock-in test prevents regression). (8) **★ ZERO NEW gaps surfaced — 11th consecutive audit** (double-digit milestone deepens; lines 18-24 + 25a + 25b + 25c all zero). **Cumulative through line 25c**: **53 lines audited** (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + 11b + 12a + 12b + 12c + 12d + 12e + 13a + 13b + 14 + 15 + 16 + 17 + 18 + 19 + 20 + 21 + 22 + 23 + 24 + 25a + 25b + **25c**); **527 audit issues closed total** (517 + 10); backend **765/765 pass** (UNCHANGED); MFS cascade = **20 orchestrators** (unchanged); knowledge convergence = **31 lines** (UNCHANGED — combined spec; ★ 2nd already-migrated closure); 24 Path A applications (+1 from 25c #9); **★ 16 anti-duplication applications** (+1 from 25c #5; ★ 2nd cross-audit in payments-section); 0 NEW gaps surfaced (11th consecutive); **★ 7 META-AUDITS** (+1 from 25c #4; ★ sub-type (b) at 86% DOMINANCE). **★ 28 CONSECUTIVE WALKTHROUGHS WITH ZERO NEW OUTSTANDING.MD ENTRIES** (extends first 20-streak by 8). **Verification logs**: ... + 25abcd (★ now 3 rows — 25a + 25b + 25c all COMPLETE; ★ 17th CONSECUTIVE single-row contribution). **Looking ahead — line 25d (Total withholding = 25a + 25b + 25c)**: 15th audit OUTSIDE 13ab pair; FOURTH payments-section audit; ★ FINAL 25abcd sub-line audit (★ 25abcd cluster COMPLETE at 25d); same method (computeLine31ThroughLine38 ~line 19878-19882); ★ 4th cross-audit anti-duplication via 25a #5 → ★ LOAD-BEARING CONFIRMATION (mirrors 20 #6 → 24 #6); trivial sum 25a + 25b + 25c (★ SIMPLEST of any sub-line; even simpler than 25a single-source); ★ likely 8th META-AUDIT pushing sub-type (b) DOMINANCE to ~88%; same NEW MFS PATTERN.',
    'XLS/computations/25c.xlsx audit-trail (this row); lines/25abcd.md §11 Verification log row 3 FINALIZED to COMPLETE — 10/10 closed; ★ G2 fix lock-in verified; ★ G4 DEFERRED OOS 25c-specific',
    'CLOSED — 10/10. **53 lines; 527 issues; 765/765 backend (UNCHANGED — 5th audit with zero new tests); 20 orchestrators (UNCHANGED); 31-line knowledge convergence (UNCHANGED — combined spec; ★ 2nd already-migrated closure); 10 doc-drift fixes (UNCHANGED — 5th audit with zero drift); 24 Path A applications; ★ 16 anti-duplication applications (★ 2nd cross-audit in payments-section); ★ 28 consecutive zero-outstanding walkthroughs (extends first 20-streak by 8); ★ 11th CONSECUTIVE ZERO NEW GAPS (double-digit milestone DEEPENS); ★ 17th CONSECUTIVE single-row contribution; ★ 7 META-AUDITS (★ sub-type (b) at 86% DOMINANCE; clean trend 67% within sub-type b); ★ 3 distinct MFS-protection mechanisms (UNCHANGED — NEW MFS PATTERN 3rd instance); ★ 4 distinct complexity dimensions in workflow (+ NEW conditional branching at 25c); ★ G2 fix lock-in verified; ★ CONDITIONAL chain STRUCTURALLY UNIQUE among 25a-25d; ★ G4 OOS 25c-specific home**. ★ THIRD payments-section audit. Pattern recurrences confirm payments-section infrastructure ROBUST. Next: line 25d (★ FINAL 25abcd sub-line; ★ 25abcd cluster COMPLETE at 25d; ★ 4th cross-audit anti-duplication via 25a #5 → ★ LOAD-BEARING CONFIRMATION milestone; trivial sum; ★ 8th META-AUDIT pushing DOMINANCE to ~88%; ★ 3rd combined-spec ROW APPEND completing §11 family).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 120 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 25c Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Notes'],
  ['form1040.payments.withholdingOther', 'Form 1040 page 2, line 25c (PDF key line25c_federal_income_tax_withheld_other_forms; AcroForm f2_19[0])', '★ CANONICAL line 25c output. = sumFederalWithholdingFromEntries(formW2gEntries) + (conditional Form 8959 line 24). Null-when-zero.'],
  [],
  ['SAME-METHOD DOWNSTREAM — line 25d in computeLine31ThroughLine38'],
  ['form1040.payments.totalWithholding (line 25d)', '~line 19878-19882', '★ line 25d = nz(25a) + nz(25b) + nz(25c). Line 25c is the third addend.'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['line 33 = line 25d + line 26 + line 32', '~line 19960', 'Line 25c affects line 33 transitively via line 25d.'],
  ['Frontend PDF export', 'form-tax-return-1040.component.ts', '`values[\'line25c_federal_income_tax_withheld_other_forms\'] = formatAmount(payments?.withholdingOther)`'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
