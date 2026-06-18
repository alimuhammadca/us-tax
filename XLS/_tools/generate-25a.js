// ============================================================================
//  Generates: C:\us-tax\XLS\computations\25a.xlsx
//
//  Source-of-truth references:
//    - lines/25abcd.md (2025-tax-year spec; 286 lines; defines line 25a-25d
//      federal income tax withheld; 4 sub-lines with distinct routing rules.
//      ★ NO §0 verification note — META-AUDIT trail lives in dependencies §0
//      + knowledge §0 banners (sub-type (b) signature).
//      ★ COMBINED SPEC — covers 25a + 25b + 25c + 25d together; this audit
//      focuses on line 25a specifically.)
//    - dependencies/25abcd.md (141 lines; "Audited 2026-04-19. All gaps fixed
//      2026-04-19." header; line 25a Inputs table (1 source: W-2 box 2);
//      line 25b Inputs table (12 sources); line 25c Inputs table (2 sources +
//      4 deferred OOS); Outputs table (4 fields all null-when-zero); Downstream
//      Consumers (computeLine31ThroughLine38 line 33); PDF Field Mapping;
//      Compute Order; Scope Boundaries.)
//    - knowledge/line-25abcd-federal-withholding.md (renamed from
//      knowledge_line25abcd.md via 25a #2 2026-05-15; 273 lines;
//      18th Legacy A migration; convergence 30 → 31 lines.
//      Full audit covering line identity + core formula + IRS 2025 routing +
//      backend implementation + Form 8959 wiring + Payments output model +
//      frontend display + PDF mapping + unit tests + e2e tests + downstream
//      consumers + SSA-1099 special field name + MFS/MFJ rules + identified
//      gaps G1/G2/G3 BOTH ★ FIXED 2026-04-19 + G4 deferred OOS + spec accuracy.)
//    - flowcharts/25abcd.drawio (existing); diagrams/25a.drawio MISSING.
//    - TaxReturnComputeService.java:
//        line 15133 — computeLine31ThroughLine38 method signature (35+ params;
//                     no per-spouse pairs; statement lists are user-segregated
//                     upstream at Firestore query level)
//        line 15173-15174 — line 25a wiring:
//          `BigDecimal withholdingW2 = sumFederalWithholdingFromEntries(w2Entries);`
//          `payments.setWithholdingW2(withholdingW2);`
//        line 15176-15187 — line 25b wiring (12-source aggregation + SSA-1099)
//        line 15189-15199 — line 25c wiring (W-2G + Form 8959 line 24)
//        line 15201-15205 — line 25d wiring (sum 25a+25b+25c null-when-zero)
//        line 15914 — sumFederalWithholdingFromEntries helper
//        line 15934 — sumSsa1099Withholding helper (SSA-1099 non-standard field)
//        line 15951 — sumFederalWithholdingFromMultipleLists variadic wrapper
//        line 591 — buildForm8959 (Part V line 24 → line 25c)
//    - line25abcd-withholding.spec.ts (208 lines; 6 scenarios + 3 G-fix tests
//      added 2026-04-19 — Test 7 1099-DA G1, Test 8 Form 8959 G2, Test 9
//      1099-NEC G3)
//    - TaxReturnComputeServiceTest.java:
//        line25bWithholdingFrom1099RAndMisc (1099-R + 1099-MISC)
//        line25bSsa1099UsesVoluntaryFederalField (SSA-1099 non-standard)
//        line25cWithholdingFromW2G (W-2G box 4)
//        line25dAggregatesAllThreeSubLines (W-2 + 1099-R + W-2G total)
//        wiresLine20ThroughLine24FromSchedule3AndWithholding (W-2 → Payments)
//        line25bWithholdingFrom1099Da (G1 fix lock-in 2026-04-19)
//    - IRS 2025 Form 1040 (line 25a "Federal income tax withheld from Form(s) W-2")
//    - IRS 2025 Instructions for Form 1040 (line 25a: "Add the amounts shown
//      as federal income tax withheld on all Form(s) W-2. The withholding
//      amount is shown in box 2.")
//    - docs/books/i1040gi_2025.txt + J.K. Lasser's Your Income Tax 2025
//
//  Tax year: 2025
//
//  Concept:
//    Form1040.line25a = sum(all W-2 box 2 amounts on the return)
//
//    Pure single-source aggregation: reads `federalIncomeTaxWithheldAmount`
//    from each W-2 entry in `w2Entries` and sums all non-null/non-zero values.
//    For MFJ returns, the w2Entries list aggregates BOTH spouses\' W-2 entries
//    (no SSN filtering — withholding is return-level, not per-person).
//
//    Implementation convention:
//      Form1040.line25a = sumFederalWithholdingFromEntries(w2Entries)
//      → null-when-zero (helper returns null if no entries have withholding)
//
//    Surrounding page-2 chain:
//      line 24 = totalTax (★★ TOTAL TAX FINAL)
//      ★ line 25a = W-2 box 2 federal income tax withheld   (★ THIS LINE)
//      line 25b = 1099-series + SSA-1099 + RRB-1099 withholding
//      line 25c = W-2G + Form 8959 Part V line 24 withholding
//      line 25d = line 25a + line 25b + line 25c            (totalWithholding)
//      line 33 = line 25d + line 26 + line 32               (total payments)
//      line 37/38 = refund or amount owed
//
//    Compare with line 24:
//      Line 24 = end of "taxes due" section (TOTAL TAX)
//      ★ Line 25a = start of "payments" section
//      ★ Major transition — credits/taxes section ends at 24; payments begins at 25
//
//  Line 25a audit positioning (12th audit OUTSIDE 13ab pair):
//   • ★ FIRST PAYMENTS-SECTION AUDIT (after lines 19+20+21+22+23+24 credits-section)
//   • Cumulative position: 51st line audited
//   • ★ FIFTH META-AUDIT in workflow — dependencies/25abcd.md §0 "Audited
//     2026-04-19. All gaps fixed 2026-04-19." + knowledge §0 same date
//     document prior audit (sub-type (b) signature; ★ ESTABLISHES sub-type
//     (b) at 80% DOMINANCE — 4 of 5 META-AUDITS)
//   • ★ FIRST audit OUTSIDE same-method-as-credits-section territory — line
//     25a lives in `computeLine31ThroughLine38` (NOT in
//     `computeLine20ThroughLine24`)
//   • ★ Likely 17th defensive-gap-NOT-needed Issue #1 — computeLine31Through
//     Line38 takes ~35 statement-list parameters; none are per-spouse pairs;
//     ★ NEW MFS PATTERN — "upstream-data-segregated-at-storage" (statement
//     lists are user-segregated at Firestore query level, NOT in-method
//     null-shadow); ★ 7th orchestrator-method-based audit with transitive
//     inheritance
//   • ★ FIRST METHOD-LEVEL BREADCRUMB FOR PAYMENTS-SECTION — line 25a #5
//     will plant ~75-line breadcrumb covering line 25a + 25b + 25c + 25d
//     (anticipates future 25b/25c/25d audits as anti-duplication candidates;
//     mirrors 20 #6 + 23 #5 NEW breadcrumb patterns)
//   • Spec is COMBINED — lines/25abcd.md covers 25a + 25b + 25c + 25d
//     together (similar to 11a/11b combined spec); audit focuses on 25a but
//     section references whole 25abcd group
//
//  Line 25a audit angles (10 issues):
//   1. CROSS-REFERENCE — NO MFS DEFENSIVE GAP NEEDED at line 25a wiring site
//       inside computeLine31ThroughLine38 (~line 15173-15174; reads w2Entries
//       which is user-segregated at Firestore query level upstream; MFS
//       protection via storage-level data segregation, NOT in-method null-
//       shadow). 17th defensive-gap-NOT-needed Issue #1; ★ 7th orchestrator-
//       method-based audit with transitive inheritance; ★ NEW MFS PATTERN
//       — "upstream-data-segregated-at-storage" (first audit with this
//       pattern); MFS cascade UNCHANGED at 20 orchestrators.
//   2. DOCUMENTATION HYGIENE — Knowledge file Legacy A rename
//       (knowledge_line25abcd.md → line-25abcd-federal-withholding.md); 18th
//       Legacy A migration; convergence 30 → 31 lines.
//   3. SPEC ENHANCEMENT — Verification log section §11 in lines/25abcd.md
//       (single-row pattern; ★ 15th CONSECUTIVE single-row log in workflow).
//   4. ★ FIFTH META-AUDIT IN WORKFLOW — dependencies/25abcd.md §0 + knowledge
//       §0 document prior audit 2026-04-19 (sub-type (b) signature). ★
//       ESTABLISHES sub-type (b) at 80% DOMINANCE — 4 of 5 META-AUDITS use
//       dependencies+knowledge §0 signature; line 21 alone used sub-type (a)
//       spec §0. 7 consistency checks expected to pass.
//   5. ★ VERIFIED CORRECT — computeLine31ThroughLine38 (line 25a + 25b + 25c
//       + 25d aggregation) — ★ FIRST PAYMENTS-SECTION METHOD-LEVEL BREADCRUMB;
//       ~75-line NEW breadcrumb covering all 4 sub-lines; anticipates future
//       25b/25c/25d audits as anti-duplication candidates; mirrors 20 #6 +
//       23 #5 NEW breadcrumb patterns.
//   6. VERIFIED CORRECT — line 25a single-site wiring at ~line 15173-15174;
//       covered by 25a #5 NEW breadcrumb; 14th anti-duplication application.
//   7. VERIFIED CORRECT — single-source inheritance chain (W-2 box 2
//       federalIncomeTaxWithheldAmount → sumFederalWithholdingFromEntries →
//       withholdingW2 → line 25a; ★ SIMPLEST chain in any payments-section
//       audit — single source).
//   8. VERIFIED CORRECT — null-when-zero convention + 25a-specific rules
//       (sum across ALL W-2 entries; no SSN filtering; MFJ aggregates both
//       spouses; helper returns null when no withholding).
//   9. ⚠️ BUNDLED OBSERVATIONS — observations for 25a + cross-25abcd context:
//       (a) G4 deferred OOS (K-1/1042-S/8805/8288-A → line 25c — NOT
//       25a-specific but bundled here per spec coverage); (b) missing
//       diagrams/25a.drawio cosmetic; (c) future 25b/25c/25d audits will
//       anti-duplicate via 25a #5 NEW breadcrumb. 22nd Path A application;
//       ★ 26 consecutive zero-outstanding walkthroughs.
//  10. BOUNDARY MILESTONE — ★ FIRST PAYMENTS-SECTION AUDIT; 51 lines / 507
//       issues; ★ FIFTH META-AUDIT (sub-type (b) at 80% DOMINANCE); ★ NEW
//       MFS PATTERN "upstream-data-segregated-at-storage"; ★ FIRST payments-
//       section method-level breadcrumb; ★ 9th CONSECUTIVE audit with ZERO
//       NEW GAPS; ★ 15th CONSECUTIVE single-row log; ★ 14 anti-duplication.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '25a.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 25a — FEDERAL INCOME TAX WITHHELD FROM FORM(S) W-2 (Box 2) — 2025'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 25a (page 2; "Federal income tax withheld from Form(s) W-2")'],
  ['Concept',
    'Line 25a aggregates federal income tax withheld from box 2 of all W-2 forms on the return. ' +
    '★ SIMPLEST line in the entire 25a-25d family — single-source pure summation; no decision tree, ' +
    'no reference data, no special routing rules beyond "sum W-2 box 2". For MFJ returns, w2Entries ' +
    'aggregates BOTH spouses\' W-2 entries (no SSN filtering — withholding is return-level). ' +
    '★ FIRST PAYMENTS-SECTION audit in workflow — major transition from credits/taxes section (lines 19-24).'],
  ['Top-level formula (spec §3a + dependencies §1)',
    'Form1040.line25a = sum(all W-2 box 2 federal income tax withheld amounts on the return)\n' +
    '\n' +
    'Implementation:\n' +
    '  Form1040.line25a = sumFederalWithholdingFromEntries(w2Entries)\n' +
    '  → reads `federalIncomeTaxWithheldAmount` from each W-2 entry\n' +
    '  → skips null/zero entries\n' +
    '  → returns null if no entries have withholding (null-when-zero convention)'],
  ['Surrounding page-2 chain (★ MAJOR TRANSITION from credits-section to payments-section)',
    '... [credits-section ends at line 24] ...\n' +
    'line 24 = ★★ TOTAL TAX FINAL                       (totalTax)\n' +
    '★★ ───────────────────────────────────────────────────────\n' +
    '★ PAYMENTS SECTION BEGINS\n' +
    '★ line 25a = sum(W-2 box 2)                        (★ THIS LINE — withholdingW2)\n' +
    'line 25b = sum(1099-series box 4) + SSA-1099 + RRB-1099 + RRB-1099-R + 1099-DA  (withholding1099)\n' +
    'line 25c = sum(W-2G box 4) + Form 8959 Part V line 24  (withholdingOther)\n' +
    'line 25d = line 25a + line 25b + line 25c          (totalWithholding)\n' +
    'line 26 = estimated tax payments + prior-year refund applied\n' +
    'line 27a = Earned Income Credit (refundable)\n' +
    'line 28 = Additional Child Tax Credit (refundable)\n' +
    'line 29 = American Opportunity Credit refundable portion\n' +
    'line 31 = Schedule 3 line 15 (other payments + refundable credits)\n' +
    'line 32 = total other payments + refundable credits\n' +
    'line 33 = line 25d + line 26 + line 32             (total payments)\n' +
    'line 34 = refund (if line 33 > line 24) OR amount owed (line 37/38)'],
  ['Line 25a/25b/25c/25d routing (spec §3a-§3d)',
    'Line 25a — W-2 box 2 ONLY:\n' +
    '  W-2 box 2 (federalIncomeTaxWithheldAmount) from all W-2 entries\n' +
    '\n' +
    'Line 25b — 1099-series + SSA + RRB box-4-equivalent:\n' +
    '  1099-R box 4 + 1099-INT box 4 + 1099-DIV box 4 + 1099-B box 4 + 1099-OID box 4\n' +
    '  + 1099-G box 4 + 1099-NEC box 4 + 1099-K box 4 + 1099-MISC box 4 + 1099-DA box 2a\n' +
    '  + SSA-1099 box 6 (★ non-standard field: voluntaryFederalIncomeTaxWithheldAmount)\n' +
    '  + RRB-1099 box 10 + RRB-1099-R box 9\n' +
    '\n' +
    'Line 25c — W-2G + Form 8959 + OOS others:\n' +
    '  W-2G box 4 + Form 8959 Part V line 24 (Medicare excess + RRTA tip withholding)\n' +
    '  + Schedule K-1 / 1042-S / 8805 / 8288-A (★ G4 DEFERRED OOS)\n' +
    '\n' +
    '★ Critical 2025 rule (spec §4): SSA-1099 + RRB-1099 → line 25b (NOT 25c); W-2G → line 25c (NOT 25b).'],
  ['What line 25a is NOT (spec §3 + §6)',
    'NOT a tax line — payments territory; reduces line 33 not line 24.\n' +
    'NOT a refundable credit — that\'s lines 27a-31.\n' +
    'NOT estimated tax — that\'s line 26.\n' +
    'NOT 1099-series withholding — that\'s line 25b.\n' +
    'NOT W-2G or Form 8959 withholding — those are line 25c.\n' +
    'NOT subject to MFS allocation — withholding is return-level; w2Entries aggregates both spouses for MFJ.'],
  ['2025 Guardrails (spec §3a + §4a-§4d + §6)',
    '§3a Line 25a = SUM of all W-2 box 2 amounts (no SSN filtering; aggregate by return).\n' +
    '§4a SSA-1099 + RRB-1099 → line 25b (★ critical 2025 routing; not 25a/25c).\n' +
    '§4b W-2G → line 25c (★ critical 2025 routing).\n' +
    '§6 MFJ aggregates both spouses\' W-2 withholding on same return.\n' +
    '§6 MFS reports only own W-2 withholding (storage-level segregation via Firestore user scoping).\n' +
    '§6 Estimated payments (line 26) follow different allocation rules — NOT line 25.\n' +
    '§7 Line 25a >= 0 (each W-2 box 2 ≥ 0 structurally).\n' +
    '§7 Line 25a stored as null when no withholding (helper returns null).'],
  ['Output target',
    'Primary: form1040.payments.withholdingW2 (BigDecimal; line 25a output; null-when-zero)\n' +
    'PDF field: line25a_federal_income_tax_withheld_w2 (page 2; AcroForm f2_17[0])\n' +
    'Frontend field: form.payments?.withholdingW2 (form-tax-return-1040.component.ts)'],
  ['Backend implementation',
    '**SINGLE WIRING SITE** — `computeLine31ThroughLine38` at TaxReturnComputeService.java:15133-15335; ' +
    'line 25a computation at lines 15173-15174 (2 lines): ' +
    '`BigDecimal withholdingW2 = sumFederalWithholdingFromEntries(w2Entries);` (line 15173) → ' +
    '`payments.setWithholdingW2(withholdingW2);` (line 15174). ' +
    'Helper `sumFederalWithholdingFromEntries` at line 15914 reads `federalIncomeTaxWithheldAmount` ' +
    'from each entry and sums non-null/non-zero values. Returns null if no entries qualify.'],
  ['IRS source',
    'IRS 2025 Form 1040 (page 2 line 25a "Federal income tax withheld from Form(s) W-2") + ' +
    '2025 Instructions for Form 1040 ("Add the amounts shown as federal income tax withheld on all ' +
    'Form(s) W-2. The withholding amount is shown in box 2."). ' +
    'Local cross-checks: docs/books/i1040gi_2025.txt + J.K. Lasser\'s Your Income Tax 2025. ' +
    'No 2025-specific changes to line 25a — W-2 box 2 routing unchanged from prior years.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'prepare() loads w2Entries from Firestore', '`w2Entries = listEntriesWithData(uid, "w-2")` — per-user scoping ensures MFS data segregation at storage level (★ NEW MFS PATTERN — upstream-data-segregated-at-storage).'],
  [2, 'computeLine31ThroughLine38 reads w2Entries as parameter', 'Method takes ~35 statement-list parameters including w2Entries; no per-spouse parameter pairs.'],
  [3, 'sumFederalWithholdingFromEntries(w2Entries) at line 15173', 'Helper at TaxReturnComputeService.java:15914 iterates each W-2 entry; reads `federalIncomeTaxWithheldAmount` (W-2 box 2); skips null/zero; sums non-null values; returns null if no qualifying entries.'],
  [4, 'payments.setWithholdingW2(withholdingW2) at line 15174', 'Stores result on Payments output model. ★ Null-when-zero convention — sumFederalWithholdingFromEntries returns null when no entries have withholding.'],
  [5, 'Downstream: line 25d aggregation', 'Line 15201-15205 computes `totalWithholding = nz(withholdingW2) + nz(withholding1099) + nz(withholdingOther)`. Line 25a is the first addend.'],
  [6, 'Downstream: line 33 total payments', 'Line 15275-15278 computes `line33 = line25d + line26 + line32`. Line 25a affects this transitively via line 25d.'],
  [7, 'Downstream: refund vs. amount owed', '`if (line33 > totalTax) → refund`; `if (totalTax > line33) → amount owed`. Line 25a is the primary contributor to line 33 for most W-2 filers.'],
  [8, 'Frontend PDF export at form-tax-return-1040.component.ts line 396', '`values[\'line25a_federal_income_tax_withheld_w2\'] = formatAmount(payments?.withholdingW2)`. Null → blank cell.'],
  [],
  ['INVARIANTS / VALIDATIONS (spec §7)'],
  ['Invariant', 'Rationale'],
  ['Line 25a ≥ 0', 'Each W-2 box 2 ≥ 0 structurally (federal withholding is a positive deduction from wages). Sum ≥ 0.'],
  ['Line 25a = sum(all W-2 box 2 amounts)', 'Per spec §3a + IRS Form 1040 line 25a instruction. STRUCTURALLY enforced at line 15173.'],
  ['Line 25a stored as null when zero', 'Per knowledge §3. Helper sumFederalWithholdingFromEntries returns null when no entries have withholding; setter stores as-is.'],
  ['MFJ aggregates both spouses\' W-2 withholding', 'Per spec §6 + knowledge §13. STRUCTURALLY enforced — w2Entries list aggregates both spouses\' W-2 entries (no SSN filtering for withholding).'],
  ['MFS reports only own W-2 withholding', 'Per spec §6 + knowledge §13. ★ STRUCTURALLY enforced via Firestore user-scoping — MFS taxpayer and MFS spouse have separate uids; spouse\'s W-2 entries are not in taxpayer\'s w2Entries list.'],
  ['No SSN filtering on withholding', 'Per knowledge §13 + e2e Test 6. ★ Distinct from wage attribution (which DOES use SSN filtering) — withholding is return-level not per-person.'],
  ['Lock-in test: line25dAggregatesAllThreeSubLines', 'W-2 $10k + 1099-R $2k + W-2G $500 → totalWithholding = 12500. Indirectly asserts line 25a = $10k from W-2.'],
  ['Lock-in test: wiresLine20ThroughLine24FromSchedule3AndWithholding', 'W-2 withholding $8000 flows to Payments. Direct assertion on line 25a wiring.'],
  ['Lock-in e2e scenario 1: W-2 box 2 → line 25a', '`withholdingW2 == 10000`, `totalWithholding == 10000`. Direct e2e assertion on line 25a single-source path.'],
  ['Lock-in e2e scenario 6: MFJ both spouses\' W-2 withholding', 'Taxpayer $7k + spouse $5k → withholdingW2 = $12k. ★ MFS/MFJ aggregation lock-in.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 38 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 25a'],
  ['Line 25a takes EXACTLY ONE INPUT TYPE — `federalIncomeTaxWithheldAmount` from W-2 entries (box 2). ★ SIMPLEST inputs-table in any payments-section line — single-source aggregation. All other 25b/25c/25d inputs are explicitly NOT line 25a (per spec §3a-§3d routing rules).'],
  [],
  ['#', 'Input', 'Statement type', 'Field read', 'Java variable', 'XLS input form reference'],
  [1, 'W-2 box 2 — Federal income tax withheld', '`w-2`', 'federalIncomeTaxWithheldAmount', 'w2Entries (List<Map<String, Object>>)', 'XLS/input_forms/form-w-2.xlsx (box 2 field)'],
  [],
  ['⚠️ NO DEDICATED USER INPUT FORM FOR LINE 25a OUTPUT'],
  ['Line 25a has NO `form-line25a-*.xlsx` in C:\\us-tax\\XLS\\input_forms\\. The W-2 entries that feed line 25a are stored as statement entries via the W-2 intake form (`form-w-2.xlsx`). Line 25a itself is rendered on the `form-tax-return-1040` Tax Return view + Form 1040 PDF only.'],
  [],
  ['⚠️ EXPLICITLY NOT LINE 25a (routed elsewhere per IRS 2025 rules)'],
  ['Source', 'Routed to', 'Why not 25a'],
  ['1099-series box 4 (1099-R/INT/DIV/B/OID/G/NEC/K/MISC)', 'Line 25b', 'Spec §3b — 1099 series → line 25b per IRS "box 4 of Form 1099" rule.'],
  ['1099-DA box 2a (new 2025)', 'Line 25b', 'Spec §3b — included in line 25b per G1 fix 2026-04-19.'],
  ['SSA-1099 box 6', 'Line 25b', 'Spec §4a — IRS 2025 places SSA-1099 withholding on line 25b (★ critical routing rule).'],
  ['RRB-1099 box 10', 'Line 25b', 'Spec §4a — IRS 2025 places RRB-1099 withholding on line 25b.'],
  ['RRB-1099-R box 9', 'Line 25b', 'Spec §3b — railroad retirement-R routed to 25b.'],
  ['W-2G box 4 (gambling)', 'Line 25c', 'Spec §3c + §4b — W-2G is "other forms" → line 25c.'],
  ['Form 8959 Part V line 24 (Additional Medicare Tax withheld)', 'Line 25c', 'Spec §3c — Medicare excess + RRTA tip withholding → line 25c.'],
  ['Schedule K-1 withholding', 'Line 25c (OOS)', 'Spec §3c + §4b — would route to 25c but ★ G4 DEFERRED (not implemented).'],
  ['1042-S withholding', 'Line 25c (OOS)', 'Spec §3c + §4b — would route to 25c but ★ G4 DEFERRED.'],
  ['8805 withholding (§1446)', 'Line 25c (OOS)', 'Spec §3c + §4b — would route to 25c but ★ G4 DEFERRED.'],
  ['8288-A withholding (FIRPTA)', 'Line 25c (OOS)', 'Spec §3c + §4b — would route to 25c but ★ G4 DEFERRED.'],
  ['Estimated tax payments', 'Line 26', 'Spec §6 — estimated payments follow different allocation rules; NOT line 25.'],
  ['Earned Income Credit', 'Line 27a', 'Refundable credits enter at lines 27a-31; NOT line 25.'],
  [],
  ['⚠️ TRANSITIVE INHERITANCE OF MFS PROTECTION — ★ NEW PATTERN: upstream-data-segregated-at-storage'],
  ['Line 25a inherits MFS protection via a STRUCTURALLY DISTINCT mechanism from the credits-section orchestrators:'],
  ['Mechanism', 'Detail'],
  ['★ Storage-level user scoping', 'W-2 entries are stored in Firestore under per-user document scope. MFS taxpayer and MFS spouse have separate uids. The `w2Entries` list loaded in `prepare()` only contains entries for the current user.'],
  ['No in-method null-shadow needed', 'computeLine31ThroughLine38 takes w2Entries as a List<Map> parameter — there is no per-spouse pair to null-shadow. The MFS segregation happens BEFORE the method is called.'],
  ['MFJ aggregation', 'For MFJ returns, w2Entries aggregates W-2 entries from both spouses (joint Firestore document or both spouse uids). Line 25a sums all of them; no SSN filtering.'],
  ['→ NO MFS GUARD NEEDED at line 25a wiring site', '17th defensive-gap-NOT-needed Issue #1 in workflow; ★ 7th orchestrator-method-based audit with transitive inheritance; ★ NEW MFS PATTERN — "upstream-data-segregated-at-storage" (first audit with this pattern)', '(See 25a #1)'],
  [],
  ['⚠️ ALL 4 PRIOR GAPS DOCUMENTED AT 2026-04-19 (per knowledge §14)'],
  ['Gap', 'Status', 'Resolution'],
  ['G1 — 1099-DA box 2a not included in line 25b', '✅ FIXED 2026-04-19', 'form1099DaEntries added to computeLine31ThroughLine38 + sumFederalWithholdingFromMultipleLists. Unit test + E2E Test 7.'],
  ['G2 — Form 8959 Part V line 24 → line 25c needed E2E coverage', '✅ FIXED 2026-04-19', 'E2E Test 8: $250k wages/$4,075 Medicare → Form 8959 Part V line 24 ($450) → withholdingOther.'],
  ['G3 — 1099-NEC box 4 backup withholding → line 25b needed E2E coverage', '✅ FIXED 2026-04-19', 'E2E Test 9: 1099-NEC box 4 $650 → withholding1099.'],
  ['G4 — K-1/1042-S/8805/8288-A → line 25c not implemented', '⚠️ DEFERRED (OOS)', 'Documented as out of scope. Not 25a-specific.'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 40 }, { wch: 18 }, { wch: 45 }, { wch: 45 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 25a'],
  ['Line 25a uses ZERO reference data — NO constants, thresholds, brackets, or phase-outs. Pure single-source aggregation. ★ Same pattern as lines 14, 18, 20-24 — pure additive/aggregation lines have no statutory anchors.'],
  [],
  ['Constant', 'Value', 'Statutory Basis', 'Backend identifier'],
  ['(None — pure aggregation line)', '—', 'Spec §3a + dependencies/25abcd.md (no constants section)', '—'],
  [],
  ['★ THIS IS A PURE AGGREGATION LINE'],
  ['Contrast with neighboring lines:'],
  ['Line', '# Constants', 'Complexity'],
  ['line 24 (★★ TOTAL TAX FINAL)', '0', 'Pure single-operator addition (line 22 + line 23)'],
  ['**line 25a (W-2 box 2 sum)**', '**0**', '**Pure single-source aggregation — SIMPLEST in payments-section**'],
  ['line 25b (12-source 1099 + SSA + RRB aggregation)', '0', 'Pure 12-source aggregation (heavier than 25a)'],
  ['line 25c (W-2G + Form 8959 + 4 OOS sources)', '0', 'Pure 2-source aggregation + Form 8959 wiring (medium)'],
  ['line 25d (line 25a + 25b + 25c)', '0', 'Pure sum'],
  ['line 33 (line 25d + line 26 + line 32)', '0', 'Pure sum (total payments)'],
  [],
  ['Upstream W-2 box 2 amounts come from user input — out of scope for line 25a'],
  ['W-2 box 2 amounts are entered by the taxpayer via the W-2 intake form (`form-w-2.xlsx`) and stored as statement entries in Firestore. Line 25a itself interprets no tax law — it is a pure mathematical accumulator.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 55 }, { wch: 60 }, { wch: 40 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 25a Persistence + Downstream Consumers'],
  ['Line 25a sets one field on Payments output model. Three downstream consumers read it (directly or transitively): line 25d aggregation + Frontend PDF export + Frontend re-computation for line 25d display.'],
  [],
  ['Output target', 'Where wired', 'Effect', 'XLS output reference'],
  ['form1040.payments.withholdingW2', '`computeLine31ThroughLine38` line 15174', '★ CANONICAL line 25a output. = sumFederalWithholdingFromEntries(w2Entries). BigDecimal whole-dollar HALF_UP. ★ Null-when-zero convention (helper returns null when no W-2 entries have withholding).', 'XLS/output_forms/form-tax-return-1040.xlsx (line 25a cell)'],
  [],
  ['SAME-METHOD DOWNSTREAM — line 25d in `computeLine31ThroughLine38`'],
  ['form1040.payments.totalWithholding (line 25d)', '`computeLine31ThroughLine38` line 15201-15205', '★ line 25d = nz(withholdingW2) + nz(withholding1099) + nz(withholdingOther). Line 25a is the first addend.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 25d cell)'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['computeLine31ThroughLine38 — line 33 total payments', '`computeLine31ThroughLine38` line 15275-15278', '`line33 = line25d + line26 + line32`. Line 25a affects this transitively via line 25d.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 33 cell)'],
  ['Frontend PDF export (form-tax-return-1040.component.ts)', 'us-tax-ui ~line 396', '`values[\'line25a_federal_income_tax_withheld_w2\'] = formatAmount(payments?.withholdingW2)`. Null → blank cell.', 'XLS/output_forms/form-tax-return-1040.xlsx (PDF view)'],
  ['Frontend line25dTotalWithholding() client-side sum', 'us-tax-ui form-tax-return-1040.component.ts', 'Re-computes 25d client-side from withholdingW2/1099/Other for PDF fill. Results equivalent to backend.', 'XLS/output_forms/form-tax-return-1040.xlsx'],
  [],
  ['PDF Output'],
  ['PDF Field', 'Field Code', 'Source'],
  ['Line 25a amount (page 2)', 'line25a_federal_income_tax_withheld_w2', 'C:\\us-tax\\us-tax-ui\\public\\irs\\f1040_field_mapping_semantic.csv'],
  ['AcroForm path', 'topmostSubform[0].Page2[0].f2_17[0]', 'IRS 2025 Form 1040 PDF (page 2)'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 60 }, { wch: 80 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 25a'],
  ['Line 25a emits NO blocking flags directly. The W-2 intake form has its own validation flags. Line 25a silently aggregates whatever W-2 entries contain.'],
  [],
  ['Flag code', 'Severity', 'Condition', 'Where emitted'],
  ['(None at line 25a site)', 'N/A', 'Line 25a has no validation.', '—'],
  [],
  ['SPEC §7 STRUCTURAL INVARIANTS (not runtime-validated)'],
  ['Invariant', 'How enforced / Status'],
  ['line 25a ≥ 0', 'STRUCTURALLY enforced — W-2 box 2 ≥ 0; sum ≥ 0.'],
  ['line 25a = sum(W-2 box 2 amounts)', 'STRUCTURALLY enforced by sumFederalWithholdingFromEntries at line 15173.'],
  ['line 25a stored as null when zero', 'STRUCTURALLY enforced — helper returns null when no entries qualify; setter stores as-is.'],
  ['MFJ aggregates both spouses\' W-2 withholding', 'STRUCTURALLY enforced — w2Entries aggregates both spouses\' W-2 entries.'],
  ['MFS reports only own W-2 withholding', '★ STRUCTURALLY enforced via Firestore user-scoping — spouse W-2 entries are NOT in taxpayer\'s w2Entries list.'],
  ['No SSN filtering on withholding (distinct from wages)', 'STRUCTURALLY enforced — w2Entries iteration reads all entries regardless of employeeSSN.'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 14 }, { wch: 100 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 25a is the W-2 box 2 withholding aggregation (Form 1040 line 25a = sum(W-2 box 2)). 12th audit OUTSIDE 13ab pair; ★ FIRST PAYMENTS-SECTION AUDIT (after lines 19+20+21+22+23+24 credits-section series complete). ★ FIRST audit OUTSIDE same-method-as-credits-section territory — line 25a lives in `computeLine31ThroughLine38` (NOT computeLine20ThroughLine24). ★ FIFTH META-AUDIT in workflow. ★ NEW MFS PATTERN "upstream-data-segregated-at-storage". 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-15 — CROSS-REFERENCE — NO MFS DEFENSIVE GAP NEEDED at line 25a wiring site (17th defensive-gap-NOT-needed Issue #1 in workflow; ★ 7th orchestrator-method-based audit with transitive inheritance; ★ NEW MFS PATTERN "upstream-data-segregated-at-storage" — FIRST audit with this pattern; will recur in future payments-section audits)',
    '**Per-input MFS-leakage analysis**: line 25a is inline-computed at single site `TaxReturnComputeService.java:15173-15174` inside `computeLine31ThroughLine38(...)`. The enclosing method takes ~35 statement-list parameters (w2Entries, form1099REntries, formRrb1099REntries, form1099IntEntries, form1099DivEntries, form1099BEntries, form1099OidEntries, form1099GEntries, form1099NecEntries, form1099KEntries, form1099MiscEntries, formSsa1099Entries, formRrb1099Entries, form1099DaEntries, formW2gEntries, estimatedTaxPaymentsTaxpayer, estimatedTaxPaymentsSpouse, plus other forms) — **none are per-spouse pairs requiring null-shadow** in the MFS-cascade sense. **★ NEW MFS PATTERN — "upstream-data-segregated-at-storage"**: w2Entries (and all other statement lists) are loaded in `prepare()` via Firestore queries scoped to the user uid. MFS taxpayer and MFS spouse have separate uids → MFS spouse\'s W-2 entries are NEVER in taxpayer\'s w2Entries list. MFS protection is enforced at the **storage / query layer**, NOT at the in-method null-shadow level. **Distinct from prior 6 orchestrator-method-based audits** (18 #1 + 20 #1 + 21 #1 + 22 #1 + 23 #1 + 24 #1) which all had transitive inheritance from MFS-clean fields set by upstream methods within the same compute pass. **★ FIRST audit with "upstream-data-segregated-at-storage" pattern**. **17th defensive-gap-NOT-needed Issue #1 in workflow** (after 16 prior: 9 + 11a/b + 12b/c/d/e + 14 + 15 + 18 + 20 + 21 + 22 + 23 + 24). **★ 7th orchestrator-method-based audit with transitive inheritance** (after 6 prior). **MFS-guard cascade UNCHANGED at 20 orchestrators** — computeLine31ThroughLine38 not added to cascade because the cascade is for methods that need null-shadow on per-spouse parameters; line 25a\'s MFS protection works via a structurally distinct mechanism. ★ This is an important workflow distinction — future payments-section audits will all use this same pattern (multi-source statement aggregation segregated at storage). Backend tests: **765/765 unchanged** (no code change).',
    'TaxReturnComputeService.java:15173-15174 (line 25a wiring; 2 lines inside computeLine31ThroughLine38); 15133 (method signature — no per-spouse params); 245 + 260 + ~591 + others (prepare() statement list loading — Firestore user-scoped)',
    'CLOSED — defensive-gap-NOT-needed. **17th in workflow** (★ 7th orchestrator-method-based; ★ NEW MFS PATTERN "upstream-data-segregated-at-storage"). MFS-guard cascade UNCHANGED at 20 orchestrators — pattern doesn\'t require cascade membership; protection is at Firestore storage layer not in-method. ★ NEW pattern documented as third distinct MFS-protection mechanism in workflow (after "in-method null-shadow at call site" used by 19 #1 + "transitive inheritance from MFS-clean fields" used by 6 prior orchestrator-method-based audits). ★ Pattern will recur in future payments-section audits (25b/25c/25d + line 26 estimated tax + line 27a EIC + line 31 Schedule 3 + line 33 total payments). Pure cross-reference closure. 765/765 unchanged.'],

  [2, 'RESOLVED 2026-05-15 — DOCUMENTATION HYGIENE — Knowledge file Legacy A rename (knowledge_line25abcd.md → line-25abcd-federal-withholding.md; 18th Legacy A migration; convergence 30→31; ★ FIRST payments-section Legacy A migration; ★ combined spec — single rename covers 25a/25b/25c/25d sub-lines)',
    '**Closure applied**: (1) plain `mv` of `C:\\us-tax\\knowledge\\knowledge_line25abcd.md` → `C:\\us-tax\\knowledge\\line-25abcd-federal-withholding.md` (folder not under git). (2) Repo-wide grep for `knowledge_line25abcd` produced 8 hits across 3 files: ACTIVE-UPDATE = 1 hit at generate-25a.js line 17 (header file path citation) — updated to new path with rename annotation `(renamed from knowledge_line25abcd.md via 25a #2 2026-05-15)`. LEAVE-UNTOUCHED = 7 hits: (a) generate-25a.js lines 18 (header rename description), 118 (Issue #2 audit angle), 410 (Issue #2 row title — this row), 411 (Issue #2 row details — being rewritten), 412 (Issue #2 Where Found) — 5 rename-description rows; (b) history.md line 3894 — historical entry from 2026-04-19 line-25abcd dedicated audit section ("- Created: `knowledge/knowledge_line25abcd.md`...") — historical record per established precedent (same shape as line 24 #2); (c) us-tax-be/context.md line 3 — historical 2026-04-19 audit context entry — historical record. (3) **★ Pattern recurrence confirmed**: line 25a #2 has 2 history-related hits (history.md + us-tax-be/context.md) — same shape as line 24 #2 which broke the zero-history-hits streak at 4. **Both audits had dedicated `## YYYY-MM-DD — Line NN audit` sections that explicitly mentioned the file path** — the zero-hits pattern was real for lines 20-23 but ended at line 24 and continues post-streak for line 25a. **18th Legacy A migration in workflow** (after 17 prior). **Knowledge-file naming convergence advances 30 → 31 lines** — **★ FIRST payments-section migration** in workflow; establishes precedent for future 25b/25c/25d audits (★ same knowledge file already renamed — sub-line audits won\'t need their own rename). Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\knowledge\\line-25abcd-federal-withholding.md (renamed); C:\\us-tax\\XLS\\_tools\\generate-25a.js 1 ACTIVE-UPDATE hit at line 17 + 5 LEAVE-UNTOUCHED rename-description hits at lines 18/118/410/411/412; ★ 2 LEAVE-UNTOUCHED hits OUTSIDE generate-25a.js — history.md line 3894 (historical 2026-04-19 audit entry) + us-tax-be/context.md line 3 (historical 2026-04-19 audit context)',
    'CLOSED — file renamed + 1 active citation updated in generate-25a.js; 7 hits left untouched per precedent (5 rename-description rows + 2 historical records). Pure documentation closure. 18th Legacy A migration. Convergence 30 → 31 lines. ★ FIRST payments-section Legacy A migration — establishes precedent; combined spec means 25b/25c/25d sub-line audits won\'t need separate renames. ★ Pattern recurrence confirmed — zero-history-hits streak remains broken (entry-writing-style dependent, not line-position-dependent).'],

  [3, 'RESOLVED 2026-05-15 — SPEC ENHANCEMENT — Verification log section §11 created in lines/25abcd.md (single-row pattern; ★ 15th CONSECUTIVE single-row log in workflow; ★ FIRST combined-spec Verification log — 6-column structure with Sub-line column for 25a/25b/25c/25d audit tracking)',
    '**Closure applied**: appended `## 11) Verification log` section to `lines/25abcd.md` after section §10 (Scope Note; line 286). **★ STRUCTURAL NOTE**: combined-spec log uses **6 columns** (#, Date, Auditor, **Sub-line**, Result, Closures) instead of the standard 5-column structure — adds Sub-line column to distinguish 25a/25b/25c/25d audits within the same log. Future 25b/25c/25d audits will append additional rows to this same log (★ different from credits-section which had separate specs and separate logs). **Row 1 in IN-PROGRESS state** capturing #1 (17th defensive-gap-NOT-needed; ★ 7th orchestrator-method-based; ★ NEW MFS PATTERN "upstream-data-segregated-at-storage") + #2 (18th Legacy A migration; 30→31 convergence; ★ FIRST payments-section migration) + #3 (this section creation). Row 1 will be finalized to **"COMPLETE — 10/10 closed"** at Issue #10. **★ 15th CONSECUTIVE single-row log in workflow** (matches lines 8/9/10/14-24). **★ NEW PATTERN — combined-spec Verification log with Sub-line column** establishes precedent for future combined-spec audits (lines 25b/25c/25d will reuse this log; possibly other combined specs like 2ab if re-audited). Pure spec enhancement — no functional change. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\lines\\25abcd.md section §11 appended after §10 (Scope Note; line 286)',
    'CLOSED — §11 Verification log section created with single-row IN-PROGRESS table (6 columns including Sub-line). Single-line audit shape (smallest log; ★ 15th consecutive single-row log in workflow). ★ FIRST combined-spec Verification log — establishes precedent for future 25b/25c/25d row appends.'],

  [4, 'RESOLVED 2026-05-15 — ★ FIFTH META-AUDIT IN WORKFLOW — dependencies/25abcd.md §0 "Audited 2026-04-19. All gaps fixed 2026-04-19." + knowledge §0 same date document prior audit (sub-type (b) signature — same as lines 22 + 23 + 24); ★ ESTABLISHES sub-type (b) at 80% DOMINANCE — 4 of 5 META-AUDITS use it; ★ 3rd CLEAN sub-type (b) META-AUDIT (along with line 23 — confirms META-AUDITs can be clean, not only drift-surfacing)',
    '**The situation**: lines/25abcd.md does NOT carry a §0 "Verification note" header (same as lines 22+23+24 — sub-type (b) signature). The META-AUDIT trail for line 25a (within combined 25abcd) lives in: (a) dependencies/25abcd.md line 3 *"> Audited 2026-04-19. All gaps fixed 2026-04-19."*; (b) knowledge/line-25abcd-federal-withholding.md (renamed via 25a #2) §0 same date with detailed gap-fix summary. **★ FIFTH META-AUDIT in workflow** with sub-type (b) signature (same as lines 22+23+24). **★ ESTABLISHES sub-type (b) at 80% DOMINANCE** — 4 of 5 META-AUDITS now use dependencies+knowledge §0 signature; only line 21 used sub-type (a) spec §0. Sub-type (b) is the **dominant pattern** for credits-section AND payments-section META-AUDITS — 80% workflow-wide. **★ 7 consistency checks performed 2026-05-15** (same count as lines 22+23+24 META-AUDITS): (a) ✅ Method computeLine31ThroughLine38 exists at TaxReturnComputeService.java:15133; line 25a at 15173-15174. (b) ✅ Payments.withholdingW2 Java field exists. (c) ✅ Frontend mapping at form-tax-return-1040.component.ts ~line 396 (`values[\'line25a_federal_income_tax_withheld_w2\']`). (d) ✅ E2E spec line25abcd-withholding.spec.ts exists with 9 scenarios (6 original + 3 G-fix scenarios at 7+8+9 added 2026-04-19). (e) ✅ Lock-in tests exist at TaxReturnComputeServiceTest.java (line25bWithholdingFrom1099RAndMisc + line25bSsa1099UsesVoluntaryFederalField + line25cWithholdingFromW2G + line25dAggregatesAllThreeSubLines + wiresLine20ThroughLine24FromSchedule3AndWithholding + line25bWithholdingFrom1099Da). (f) ✅ Formula `line25a = sumFederalWithholdingFromEntries(w2Entries)` matches spec §3a + code line 15173. (g) ✅ Null-when-zero convention matches code (helper returns null when no entries qualify). **★ NO doc-drift fix needed** — knowledge §14 says G1+G2+G3 FIXED 2026-04-19 + G4 deferred OOS; dependencies §0 banner says "All gaps fixed 2026-04-19" (which is accurate for the 3 implemented gaps; G4 OOS is documented separately). Spec + knowledge + code all consistent. **★ FIFTH META-AUDIT** confirms pattern maturity: line 21 #4 = 8/8 sub-type (a) clean; line 22 #5 = 7/7 sub-type (b) + drift; line 23 #4 = 7/7 sub-type (b) clean; line 24 #4 = 7/7 sub-type (b) + drift; line 25a #4 = 7/7 sub-type (b) **clean**. Distribution: 1 sub-type (a) + 4 sub-type (b) = 80% sub-type (b) DOMINANT. Within sub-type (b): 2 clean (23 + 25a) + 2 drift-surfacing (22 + 24) — even split. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\lines\\25abcd.md (NO §0 banner — sub-type (b) signature); C:\\us-tax\\dependencies\\25abcd.md line 3 (Audited 2026-04-19); C:\\us-tax\\knowledge\\line-25abcd-federal-withholding.md (renamed via 25a #2) §0 banner; TaxReturnComputeService.java:15133-15205 + 15914 (sumFederalWithholdingFromEntries); TaxReturnComputeServiceTest.java multiple tests; e2e/tests/line25abcd-withholding.spec.ts (9 scenarios)',
    'CLOSED — FIFTH META-AUDIT consistency check complete. **★ ESTABLISHES sub-type (b) at 80% DOMINANCE — 4 of 5 META-AUDITS use it (lines 22 + 23 + 24 + 25a)**. 7/7 consistency checks pass; no doc-drift needed. ★ Pattern matures: sub-type (b) is the dominant META-AUDIT signature across both credits-section AND payments-section. ★ Within sub-type (b): 2 clean (lines 23 + 25a) + 2 drift-surfacing (lines 22 + 24) — even 50/50 split; future maintainers can expect ~50% chance of drift surfacing during sub-type (b) META-AUDITs. ★ 5-META-AUDIT sample size now strongly confirms 80/20 distribution as stable expectation.'],

  [5, 'RESOLVED 2026-05-15 — ★ VERIFIED CORRECT — computeLine31ThroughLine38 method (line 25a + 25b + 25c + 25d aggregation) — ★ FIRST PAYMENTS-SECTION METHOD-LEVEL BREADCRUMB; ~95-line NEW breadcrumb planted at TaxReturnComputeService.java:~19688 covering all 4 sub-lines + ★ NEW MFS PATTERN anchor + 3 G-fix lock-in anchors + 4 sub-line field map + helper methods + compute order + null-when-zero convention',
    '**Closure intent**: plant ~75-line VERIFIED CORRECT breadcrumb above `computeLine31ThroughLine38` method at TaxReturnComputeService.java:~15133 (between section banner and method declaration). Structure: **★ MAIN VERIFICATION**: line 25a (W-2 box 2 sum) + line 25b (12-source 1099 + SSA + RRB aggregation) + line 25c (W-2G + Form 8959 Part V line 24) + line 25d (sum 25a+25b+25c null-when-zero) per spec §3a-§3d + dependencies/25abcd.md §1. **★ NEW MFS PATTERN ANCHOR**: "upstream-data-segregated-at-storage" — all statement lists are user-scoped via Firestore queries; no in-method null-shadow needed; first method-level breadcrumb to document this pattern. **★ Sub-line field map**: 25a = `Payments.withholdingW2` (1 source: W-2 box 2) + 25b = `Payments.withholding1099` (12 sources: 1099-R + 1099-INT + 1099-DIV + 1099-B + 1099-OID + 1099-G + 1099-NEC + 1099-K + 1099-MISC + 1099-DA + RRB-1099 + RRB-1099-R + SSA-1099 special) + 25c = `Payments.withholdingOther` (W-2G + Form 8959 line 24 + 4 OOS K-1/1042-S/8805/8288-A) + 25d = `Payments.totalWithholding` (sum). **★ 3 G-FIX LOCK-IN ANCHORS** (all from 2026-04-19): (1) G1 1099-DA box 2a added to sumFederalWithholdingFromMultipleLists at line 15187; (2) G2 Form 8959 Part V line 24 E2E coverage added (Test 8); (3) G3 1099-NEC box 4 backup withholding E2E coverage added (Test 9). **★ Helper methods**: sumFederalWithholdingFromEntries (line 15914) + sumSsa1099Withholding (line 15934; special field name) + sumFederalWithholdingFromMultipleLists (line 15951; variadic). **★ Compute order**: line 25a → line 25b → line 25c → line 25d → line 26 → line 27a-31 (refundable) → line 32 → line 33 (total payments). **★ Null-when-zero convention**: all 4 sub-lines stored as null when sum is zero (helper returns null when no entries qualify). **★ FIRST PAYMENTS-SECTION METHOD-LEVEL BREADCRUMB in workflow** — mirrors 20 #6 (covered cluster 20+21+22+24) + 23 #5 (finalizeSchedule2OtherTaxes) patterns; anticipates future 25b/25c/25d audits as anti-duplication candidates (just like 20 #6 anchored 21/22/24 anti-duplications). **Coverage cross-references**: spec §3a-§3d + §4a-§4d + §6 + §7 + §8 + dependencies/25abcd.md §1-§4 + line-25abcd-federal-withholding.md §3-§4 (post 25a #2 rename) + 25a #1 MFS cross-ref + 25a #4 META-AUDIT + 25a #6 anti-duplication for line 25a wiring + 25a #7 inheritance chain + 25a #8 conventions. Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:~15133 (above computeLine31ThroughLine38 method declaration; ~75-line breadcrumb)',
    'CLOSED — verified correct. ~95-line NEW breadcrumb planted at TaxReturnComputeService.java:~19688 (between section banner `// Lines 25d-33, 37-38` and method JavaDoc) documenting computeLine31ThroughLine38 (lines 25a + 25b + 25c + 25d aggregation) + ★ NEW MFS PATTERN "upstream-data-segregated-at-storage" anchor + ★ 3 G-fix lock-in anchors (G1 1099-DA + G2 Form 8959 + G3 1099-NEC) + 4 sub-line field map (15 source statement types + 4 OOS) + helper methods (sumFederalWithholdingFromEntries + sumSsa1099Withholding + sumFederalWithholdingFromMultipleLists) + compute order (prepare loading → buildForm8959 → this method → line 33 + 37/38) + null-when-zero convention. **★ FIRST PAYMENTS-SECTION METHOD-LEVEL BREADCRUMB in workflow** — third anchor method to receive a method-level breadcrumb (after 20 #6 + 23 #5). ★ Anticipates future 25b/25c/25d audits as anti-duplication candidates (mirrors 20 #6 anchoring 21/22/24 anti-duplications). Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.'],

  [6, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — line 25a single-site wiring at ~line 15173-15174; ★ 14th ANTI-DUPLICATION application; ★ FIRST same-audit anti-duplication in workflow (anchor at 25a #5; anti-duplicate at 25a #6)',
    '**Closure intent**: pure cross-reference closure — **NO new breadcrumb** at line 25a wiring site (anti-duplication policy applied; **14th anti-duplication application in workflow** after 13 prior). **Why no new breadcrumb**: line 25a is now explicitly covered by the **25a #5 NEW VERIFIED CORRECT breadcrumb** at TaxReturnComputeService.java:~15133 (planted this audit cycle), which documents: line 25a = sumFederalWithholdingFromEntries(w2Entries); single-source aggregation; null-when-zero convention; ★ NEW MFS PATTERN "upstream-data-segregated-at-storage" anchor. **3-source coverage confirmed**: (1) spec §3a (formula) + §4 (routing rules); (2) dependencies/25abcd.md line 25a Inputs table; (3) **25a #5 NEW breadcrumb** (verified correct breadcrumb in code; planted this audit). **★ Notable**: 25a #6 is the FIRST anti-duplication that relies on a breadcrumb planted IN THE SAME AUDIT (25a #5) — distinct from credits-section anti-duplications which all relied on 20 #6 planted in a PRIOR audit. ★ Confirms the "plant comprehensive breadcrumb at first audit, anti-duplicate in subsequent" pattern works WITHIN a single audit too (anchor #5; anti-duplicate #6/#8 etc.). **14th anti-duplication application in workflow**. Pure cross-reference closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:15173-15174 (line 25a wiring; covered by 25a #5 NEW breadcrumb at ~line 15133)',
    'CLOSED — verified correct via 25a #5 NEW breadcrumb + spec §3a + dependencies/25abcd.md (3-source coverage). **14th anti-duplication application in workflow**. NO new breadcrumb at wiring site. **★ FIRST same-audit anti-duplication in workflow** — anchor breadcrumb at 25a #5 + anti-duplication at 25a #6 within same audit cycle (prior 4 anti-duplications via 20 #6 were all cross-audit, planted in line 20 audit and reused in lines 21/22/23/24 audits). ★ Confirms "plant comprehensive breadcrumb at first audit, anti-duplicate in subsequent" pattern works WITHIN a single audit too — policy robust across both temporal scales (cross-audit AND same-audit). Pure cross-reference closure.'],

  [7, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — single-source inheritance chain (W-2 box 2 → sumFederalWithholdingFromEntries → withholdingW2 → line 25a); ★ SIMPLEST chain in any payments-section audit (2 stages); ★ SIMPLEST chain in workflow alongside line 24 (2 local stages)',
    '**Closure intent**: pure cross-reference closure — verifies the single-source inheritance chain that makes line 25a both correct AND MFS-clean by construction. **Chain verification**: **(1) W-2 box 2 source**: each W-2 entry has a `federalIncomeTaxWithheldAmount` field (mapped to W-2 box 2 per IRS form). User enters via W-2 intake form (`form-w-2.xlsx`); stored in Firestore under user uid. **(2) sumFederalWithholdingFromEntries helper**: at TaxReturnComputeService.java:15914. Iterates w2Entries; reads `federalIncomeTaxWithheldAmount` from each; skips null/zero; sums non-null values; returns null if no qualifying entries. **(3) withholdingW2 storage**: `payments.setWithholdingW2(withholdingW2)` at line 15174. ★ Null-when-zero (no in-setter coercion needed — helper already returns null when zero). **(4) line 25a output**: line 25a = `payments.withholdingW2` (PDF semantic key `line25a_federal_income_tax_withheld_w2`). **★ KEY PROPERTY**: each stage handles its own state correctly; pure summation between stages cannot introduce MFS leakage. **★ SIMPLEST CHAIN in any payments-section audit** — single source (W-2 box 2) vs. 12 sources for line 25b, 2-3 sources for line 25c. Contrast with credits-section: line 23 had 4-stage chain (LONGEST); line 24 had 9 cumulative links (DEEPEST); line 25a has **single 2-stage chain** (helper → setter). **No new breadcrumb needed** — chain fully documented via 25a #5 NEW breadcrumb at method level. **Coverage cross-references**: spec §3a + §5 + §8 + dependencies/25abcd.md §1 (Line 25a Inputs table) + line-25abcd-federal-withholding.md §3a + §4 (post 25a #2 rename) + 25a #5 method-level breadcrumb. Pure cross-reference closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:15173-15174 (line 25a wiring) + 15914 (sumFederalWithholdingFromEntries helper); chain documented via 25a #5 NEW breadcrumb',
    'CLOSED — verified correct via single-source inheritance chain. Stage 1 (W-2 box 2 source — Firestore user-scoped per 25a #1 NEW MFS PATTERN) → Stage 2 (sumFederalWithholdingFromEntries helper at line 15914 + payments.setWithholdingW2 at line 15174 — null-when-zero coercion via helper return value). **★ SIMPLEST chain in any payments-section audit (2 stages); ★ tied with line 24 #7 for SIMPLEST local chain in workflow** (line 24 had 2 local addends; line 25a has 2 stages — but line 25a has only 1 source vs. line 24\'s 2 addends, so arguably the absolute simplest). MFS-clean by construction via upstream-data-segregated-at-storage (per 25a #1). No new breadcrumb — covered by 25a #5 NEW method-level breadcrumb + spec §3a + dependencies/25abcd.md (3-source coverage).'],

  [8, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — 4 conventions verified (null-when-zero + no SSN filtering + MFJ aggregation + MFS storage segregation via ★ NEW MFS PATTERN)',
    '**Closure intent**: pure verification closure — confirms four line-25a-specific conventions documented by spec §6 + §7 + knowledge §13 + code line 15173-15174 + helper line 15914. **Convention 1 — Null-when-zero (same as line 20+21+23)**: `sumFederalWithholdingFromEntries` returns null when no entries have withholding; setter stores as-is. ★ Distinct from line 22 ALWAYS-SET and line 24 ZERO-when-zero. **Convention 2 — No SSN filtering**: line 25a iterates ALL W-2 entries regardless of `employeeSSN` (taxpayer vs spouse). Knowledge §13 confirms: "MFJ: Aggregate withholding from both spouses\' statements on one return. No SSN filtering on withholding (unlike wage attribution)." This is structurally important — withholding is return-level, not per-person (distinct from wage line 1a which DOES filter by SSN for per-person attribution). **Convention 3 — MFJ aggregation**: for MFJ returns, w2Entries contains W-2 entries from both spouses; line 25a sums all. Lock-in e2e Test 6: taxpayer $7k + spouse $5k → withholdingW2 = $12k. **Convention 4 — MFS storage segregation** (★ NEW MFS PATTERN — established at 25a #1): for MFS returns, w2Entries only contains the filer\'s own W-2 entries because Firestore queries are user-scoped; spouse\'s W-2 entries are in a separate Firestore document. MFS protection is at the storage layer, NOT in-method. **Lock-in tests confirm**: (a) e2e Test 1 (W-2 box 2 → withholdingW2 = $10k; basic single-source); (b) e2e Test 5 (combined 25a+25b+25c → 25d = $10.1k; line 25a as addend); (c) e2e Test 6 (MFJ both spouses → $12k; MFJ aggregation lock-in); (d) unit test line25dAggregatesAllThreeSubLines (W-2 $10k component); (e) unit test wiresLine20ThroughLine24FromSchedule3AndWithholding (W-2 $8k → Payments). **No new breadcrumb at line 15173-15174** — Conventions 1-4 self-documenting in 2-line code block + spec §6/§7 + knowledge §13 + 25a #5 NEW method-level breadcrumb. **3-source coverage exists for all 4 conventions** (spec + knowledge + 25a #5 breadcrumb + lock-in tests). Pure verification closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:15173-15174 (line 25a wiring; 2-line code block; conventions self-documenting); spec §6/§7 + knowledge §13 (MFJ/MFS rules); 5 lock-in tests (3 e2e + 2 unit)',
    'CLOSED — verified correct. 4 conventions confirmed: **Convention 1 — null-when-zero** (helper at line 15914 returns null when no entries qualify; setter is pure write; same as lines 20+21+23; distinct from line 22 ALWAYS-SET and line 24 ZERO-when-zero). **Convention 2 — no SSN filtering on withholding** (★ structurally distinct from wage attribution which DOES use SSN; per knowledge §13). **Convention 3 — MFJ aggregation** (both spouses\' W-2 entries summed; lock-in e2e Test 6: $7k + $5k → $12k). **Convention 4 — MFS storage segregation** (★ NEW MFS PATTERN per 25a #1 — Firestore user-scoping prevents spouse data from entering taxpayer\'s w2Entries; structurally distinct from in-method null-shadow + transitive inheritance patterns). 5 lock-in tests (2 unit + 3 e2e scenarios incl. Test 6 MFJ aggregation). No new breadcrumb (3-source coverage via 25a #5 NEW breadcrumb + knowledge §13 + helper code self-documenting). Pure verification closure.'],

  [9, 'RESOLVED 2026-05-15 — ⚠️ BUNDLED OBSERVATIONS — 3 observations (22nd Path A application; ★ 26 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS — extends first 20-streak by 6; ★ 9th CONSECUTIVE AUDIT WITH ZERO NEW GAPS; ★ 6th consecutive credits/payments-section audit with missing-diagrams gap)',
    '**Closure intent**: pure xlsx-flip observation bundle — **NO code change**; **NO outstanding.md entry** (anti-fragmentation policy; 1 prior gap G4 already documented in outstanding.md from 2026-04-19 cycle; not 25a-specific anyway). THREE observations bundled — all share same "documented + deferred / cosmetic / forward-looking" rationale. **(a) ⚠️ G4 DEFERRED OOS — K-1/1042-S/8805/8288-A withholding → line 25c NOT implemented**: NOT 25a-specific (affects line 25c only) but bundled here per spec §3c + §4b coverage and knowledge §14 G4 entry. Already documented in outstanding.md from 2026-04-19 cycle. **(b) Missing `diagrams/25a.drawio` data-flow diagram**: `flowcharts/25abcd.drawio` exists (combined flowchart); `diagrams/25a.drawio` (separate data-flow) does NOT. ★ NEW pattern emerging in payments-section: combined 25abcd flowchart exists but per-line data-flow diagrams missing. Same cosmetic gap pattern as credits-section (5 audits at lines 20/21/22/23/24 all had this). One-shot cleanup candidate (now overdue for 6 lines: 20-24 + 25a). **(c) ★ FORWARD-LOOKING: future 25b/25c/25d audits will anti-duplicate via 25a #5 NEW breadcrumb**: just like 21 #5 + 22 #6 + 23 #6 + 24 #6 all anti-duplicated via 20 #6 breadcrumb (load-bearing CONFIRMED at 24 #6), 25a #5 NEW breadcrumb will anchor 25b/25c/25d audits. ★ Pattern continuity — payments-section establishes same "plant comprehensive breadcrumb at first audit, anti-duplicate in subsequent" pattern as credits-section. **★ Anti-fragmentation policy applied** — observations only; no fixes today; no outstanding.md entry. **22nd PATH A APPLICATION**. **★ Streak extends 25 → 26 consecutive zero-outstanding walkthroughs** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18/19/20/21/22/23/24/25a). **★ 9th consecutive ZERO NEW GAPS** — line 25a had 3 prior gaps G1+G2+G3 BOTH ★ FIXED 2026-04-19 + G4 deferred OOS; no new gaps surfaced. Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'G4 OOS (K-1/1042-S/8805/8288-A → line 25c — not 25a-specific; documented in outstanding.md from 2026-04-19); diagrams/25a.drawio (missing — cosmetic; same pattern as 20-24 credits-section); future 25b/25c/25d audits (anti-duplication candidates via 25a #5 NEW breadcrumb — pattern continuity from credits-section)',
    'CLOSED — pure observation bundle. **22nd Path A application**; ZERO NEW GAPS surfaced (9th consecutive — lines 18-24 + 25a all zero after 17 anomaly); **★ 26 consecutive zero-outstanding walkthroughs** (extends first 20-streak by 6). 3 observations: (a) G4 DEFERRED OOS (K-1/1042-S/8805/8288-A → line 25c; ★ NOT 25a-specific; bundled per spec §3c+§4b coverage; already in outstanding.md from 2026-04-19); (b) Missing `diagrams/25a.drawio` cosmetic (★ 6th consecutive credits/payments-section audit with this gap — one-shot cleanup overdue for lines 20-24 + 25a); (c) ★ Forward-looking: future 25b/25c/25d audits will anti-duplicate via 25a #5 NEW breadcrumb (cross-audit pattern; mirrors 20 #6 + 21/22/23/24 cluster pattern). No outstanding.md entry per anti-fragmentation policy.'],

  [10, 'RESOLVED 2026-05-15 — BOUNDARY MILESTONE — Line 25a walkthrough complete at 10/10; ★ FIRST PAYMENTS-SECTION AUDIT; multiple FIRSTs (NEW MFS PATTERN + payments-section method-level breadcrumb + same-audit anti-duplication + combined-spec Verification log + payments-section Legacy A migration + simplest chain in workflow); ★ FIFTH META-AUDIT (sub-type (b) at 80% DOMINANCE); ★ 26 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS; ★ 9th CONSECUTIVE AUDIT WITH ZERO NEW GAPS; ★ 15th CONSECUTIVE SINGLE-ROW LOG; ★ 14 anti-duplication applications',
    'Pure xlsx-flip + Verification log finalization — **CLOSES the 25a walkthrough at 10/10**. TWO file touches: (a) this row flipped to RESOLVED; (b) lines/25abcd.md §11 Verification log row finalized IN-PROGRESS → **COMPLETE — 10/10 closed**. **Eight themes**: (1) **★ Structural positioning** — 12th audit OUTSIDE 13ab pair; ★ FIRST PAYMENTS-SECTION AUDIT (after credits-section series complete at line 24); 51st line audited; ★ MAJOR TRANSITION from credits/taxes section to payments section; ★ Simplest line in 25a-25d family (single-source W-2 box 2 aggregation). (2) **★ MFS-guard cascade UNCHANGED at 20 orchestrators** — 17th defensive-gap-NOT-needed Issue #1; ★ 7th orchestrator-method-based audit; ★ NEW MFS PATTERN "upstream-data-segregated-at-storage" (FIRST audit with this pattern; will recur in future payments-section audits). (3) **★ FIFTH META-AUDIT in workflow** (Issue #4) with sub-type (b) signature; ★ ESTABLISHES sub-type (b) at 80% DOMINANCE — 4 of 5 META-AUDITS use it. (4) **★ FIRST PAYMENTS-SECTION METHOD-LEVEL BREADCRUMB** (Issue #5) — ~75-line VERIFIED CORRECT breadcrumb at computeLine31ThroughLine38; ★ 3 G-fix lock-in anchors (G1 1099-DA + G2 Form 8959 + G3 1099-NEC); ★ 4 sub-line field map covering 25a + 25b + 25c + 25d; ★ NEW MFS PATTERN anchor. (5) **Knowledge convergence advances 30 → 31 lines** (Issue #2: 18th Legacy A migration; ★ first payments-section migration). (6) **★ 14 ANTI-DUPLICATION applications** — Issue #6 was 14th; ★ FIRST same-audit anti-duplication (anchor at #5; anti-duplicate at #6); confirms "plant comprehensive breadcrumb at first audit" pattern works within single audit too. (7) **Anti-fragmentation continues — 22nd Path A application** (Issue #9: 3-observation bundle including G4 OOS + cosmetic + forward-looking note). (8) **★ ZERO NEW gaps surfaced** — 9th consecutive audit (line 17 anomaly; 18-24 + 25a all zero); line 25a had 3 prior gaps G1+G2+G3 BOTH ★ FIXED 2026-04-19 + G4 deferred OOS. **Cumulative state through line 25a**: **51 lines audited** (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + 11b + 12a + 12b + 12c + 12d + 12e + 13a + 13b + 14 + 15 + 16 + 17 + 18 + 19 + 20 + 21 + 22 + 23 + 24 + **25a**); **507 audit issues closed total** (497 + 10); backend **765/765 pass** (UNCHANGED — pure documentation closure; no new tests this audit); MFS cascade = **20 orchestrators** (unchanged — line 25a NOT added; pattern is "upstream-data-segregated-at-storage" not in-method null-shadow); knowledge convergence = **31 lines (+1)**; dependencies files = 43 (unchanged); **10 documentation drift fixes** (UNCHANGED — no drift this audit; ★ 3rd audit with zero drift work after 21 #4 + 23 #4 were first two); 22 Path A applications (+1 from 25a #9); **★ 14 anti-duplication applications** (+1 from 25a #6); 2 SEEDED → VERIFIED CORRECT upgrades (unchanged); 2 terminal seeds (unchanged); 0 NEW gaps surfaced (9th consecutive); **★ 5 META-AUDITS** (+1 from 25a #4; ★ sub-type (b) at 80% DOMINANCE). **★ 26 CONSECUTIVE WALKTHROUGHS WITH ZERO NEW OUTSTANDING.MD ENTRIES** (extends first 20-streak by 6). **Verification logs**: ... + 23 (1) + 24 (1) + **25abcd (1 — single-line shape; ★ 15th CONSECUTIVE single-row log)**. **Looking ahead — line 25b (1099-series + SSA-1099 + RRB-1099 + RRB-1099-R + 1099-DA federal withholding)**: 13th audit OUTSIDE 13ab pair; SECOND payments-section audit; ★ likely 18th defensive-gap-NOT-needed Issue #1 (same NEW MFS PATTERN as 25a); ★ likely 6th META-AUDIT (sub-type (b) — would make 5 of 6 = 83% dominance); ★ ANTI-DUPLICATION via 25a #5 NEW breadcrumb (mirrors 21 #5 anti-duplicating via 20 #6); 12-source aggregation (heavier than 25a). Expected audit shape similar to 25a but with G1+G2+G3 cross-references for 1099-DA + Form 8959 + 1099-NEC fixes.',
    'XLS/computations/25a.xlsx audit-trail (this row); lines/25abcd.md §11 Verification log row FINALIZED to COMPLETE — 10/10 closed; knowledge file renamed via 25a #2 (Legacy A); ★ NEW BREADCRUMB at computeLine31ThroughLine38 via 25a #5 (★ FIRST payments-section method-level breadcrumb)',
    'CLOSED — 10/10. **51 lines audited; 507 issues; 765/765 backend (UNCHANGED — no new tests this audit); 20 orchestrators (UNCHANGED — ★ NEW MFS PATTERN not on cascade); 31-line knowledge convergence; ★ 26 consecutive zero-outstanding walkthroughs (extends first 20-streak by 6); ★ 9th consecutive ZERO NEW GAPS; 10 documentation drift fixes (UNCHANGED — 3rd audit with zero drift); 22 Path A applications; ★ 14 anti-duplication applications (★ FIRST same-audit anti-duplication: 25a #5 anchor + 25a #6 anti-duplicate); ★ 15th consecutive single-row log; ★ 5 META-AUDITS (★ sub-type (b) at 80% DOMINANCE — 4 of 5); ★ FIRST PAYMENTS-SECTION method-level breadcrumb; ★ NEW MFS PATTERN "upstream-data-segregated-at-storage" (third distinct MFS-protection mechanism in workflow); ★ FIRST combined-spec Verification log (6 columns with Sub-line); ★ FIRST payments-section Legacy A migration; ★ SIMPLEST chain in workflow (2 stages)**. ★ FIRST PAYMENTS-SECTION AUDIT — major transition from credits-section (lines 19-24 complete). Next: line 25b (1099-series + SSA + RRB + 1099-DA; 12 sources; ★ anti-duplication via 25a #5 NEW breadcrumb — FIRST cross-audit anti-duplication within payments-section; expected 6th META-AUDIT pushing sub-type (b) to ~83%) OR line 26 (estimated tax; different structure).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 120 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 25a Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.payments.withholdingW2', 'Form 1040 page 2, line 25a (PDF key line25a_federal_income_tax_withheld_w2; AcroForm f2_17[0])', 'XLS/output_forms/form-tax-return-1040.xlsx', '★ CANONICAL line 25a output. = sumFederalWithholdingFromEntries(w2Entries). BigDecimal whole-dollar HALF_UP. ★ Null-when-zero (same as line 20+21+23).'],
  [],
  ['SAME-METHOD DOWNSTREAM — line 25d in `computeLine31ThroughLine38`'],
  ['form1040.payments.totalWithholding (line 25d)', '`computeLine31ThroughLine38` line 15201-15205', 'XLS/output_forms/form-tax-return-1040.xlsx', '★ line 25d = nz(25a) + nz(25b) + nz(25c). Line 25a is the first addend; primary contributor for most W-2 filers.'],
  [],
  ['CROSS-METHOD DOWNSTREAM (via line 25d)'],
  ['line 33 = line 25d + line 26 + line 32 (total payments)', '`computeLine31ThroughLine38` line 15275-15278', 'XLS/output_forms/form-tax-return-1040.xlsx', 'Line 25a affects line 33 transitively via line 25d.'],
  ['Refund (line 37) or amount owed (line 38)', '`computeLine31ThroughLine38`', 'XLS/output_forms/form-tax-return-1040.xlsx', 'if line 33 > line 24 → refund; if line 24 > line 33 → amount owed. Line 25a is a primary contributor.'],
  ['Frontend PDF export', 'form-tax-return-1040.component.ts ~line 396', 'us-tax-ui', '`values[\'line25a_federal_income_tax_withheld_w2\'] = formatAmount(payments?.withholdingW2)`. Null → blank cell.'],
  ['Frontend line25dTotalWithholding() client-side sum', 'us-tax-ui', 'us-tax-ui', 'Re-computes 25d client-side from withholdingW2/1099/Other. Equivalent to backend.'],
  [],
  ['CONDITIONAL ATTACHMENTS'],
  ['Form W-2', 'Form W-2 (one per employer)', 'us-tax-ui PDF', 'Per spec §4d + IRS paper-return rules — W-2 forms attached when filing on paper.'],
  [],
  ['NOT IN OUTPUT (deliberate exclusions per spec §3a + §6)'],
  ['1099-series withholding', '—', '—', 'Spec §3b — routes to line 25b.'],
  ['SSA-1099 + RRB-1099 + RRB-1099-R + 1099-DA withholding', '—', '—', 'Spec §3b + §4a — all route to line 25b.'],
  ['W-2G + Form 8959 + K-1/1042-S/8805/8288-A withholding', '—', '—', 'Spec §3c + §4b — all route to line 25c.'],
  ['Estimated tax payments', '—', '—', 'Spec §6 — route to line 26.'],
  ['Refundable credits (EIC, ACTC, AOTC, etc.)', '—', '—', 'Lines 27a-31; NOT line 25.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 60 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
