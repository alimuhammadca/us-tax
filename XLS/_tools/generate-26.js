// ============================================================================
//  Generates: C:\us-tax\XLS\computations\26.xlsx
//
//  Source-of-truth references:
//    - lines/26.md (228-line spec; Form 1040 line 26 = "2025 estimated tax
//      payments and amount applied from 2024 return"; §2 core formula; §3 what
//      counts; §4 what doesn't; §5 quarterly due dates; §6 MFJ/MFS handling;
//      §7 prior-year overpayments; §8 implementation guidance; §9 downstream;
//      §10 validation; §11 summary. ⚠️ NO §11 Verification log — will be CREATED
//      by this audit as a NEW single-row §11.)
//    - dependencies/26.md (97-line; "Audited 2026-04-19" header). ⚠️ DOC DRIFT
//      — references G1 as a gap on 3 lines (lines 21 "Never read by backend —
//      G1 gap on MFJ returns", 62 "spouseForm, ← never read inside method (G1)",
//      91 "MFJ spouse form data silently dropped | G1: MEDIUM gap") — STALE.
//      Verified 2026-05-15 that G1 was FIXED 2026-04-19 (knowledge §12) and
//      code at line 20029-20072 reads spouse form on non-MFS returns.
//      → META-AUDIT will SURFACE drift; first drift-surfacing META-AUDIT since
//      24 #4 (5 consecutive clean META-AUDITs broken at 26 #4).
//    - knowledge/line-26-estimated-tax-payments.md (renamed at 26 #2
//      2026-05-15 from knowledge_line26.md; ★ 19th Legacy A migration; 233 lines;
//      "All gaps G1–G5 fixed 2026-04-19"; convergence advanced 31 → 32 lines.)
//    - flowcharts/26.drawio (exists); diagrams/26.drawio MISSING (★ 10th
//      consecutive credits/payments-section audit with this gap).
//    - TaxReturnComputeService.java:
//        line 19877-19882 — line 26 wiring (6 lines):
//          String filingStatusStr = normalizeFilingStatus(getString(filingStatusData, "filingStatus"));
//          boolean isMfs = "Married filing separately".equalsIgnoreCase(filingStatusStr);
//          boolean isMfj = "Married filing jointly".equalsIgnoreCase(filingStatusStr);
//          BigDecimal line26 = computeLine26EstimatedTax(estimatedTaxPaymentsTaxpayer, estimatedTaxPaymentsSpouse, isMfs);
//          payments.setEstimatedTaxPayments(line26);
//        line 20029-20072 — computeLine26EstimatedTax helper (44 lines)
//          ★ Helper signature: (taxpayerForm, spouseForm, isMfs)
//          ★ Reads BOTH forms on non-MFS; skips spouse form on MFS
//          ★ In-helper `if (!isMfs && spouseMade)` guard at line 20061
//          ★ Aggregates 6 fields × up to 2 forms = up to 12 sources
//    - line26-estimated-tax-payments.spec.ts (9 E2E tests per knowledge §11)
//    - TaxReturnComputeServiceTest.java: 8 unit tests per knowledge §10
//
//  Tax year: 2025
//
//  Concept:
//    Form1040.line26 = nz(estimatedTaxPaymentsMadeFor2025)
//                    + nz(appliedOverpaymentFrom2024OriginalReturn)
//                    + nz(appliedOverpaymentFrom2024AmendedReturn)
//
//    6 fields per form × up to 2 forms (taxpayer + spouse on MFJ) =
//    up to 12 sources aggregated.
//
//    ★ NEW 4th MFS-PROTECTION MECHANISM: "in-helper isMfs-flag-gated spouse-
//      form skip". Distinct from the 3 established mechanisms:
//        1. In-method null-shadow at call site (line 19 #1)
//        2. Transitive inheritance from MFS-clean fields (6 audits: 18, 20, 21,
//           22, 23, 24)
//        3. Upstream-data-segregated-at-storage (NEW MFS PATTERN; 4 audits:
//           25a, 25b, 25c, 25d)
//        4. ★ NEW: In-helper isMfs-flag-gated spouse-form skip (line 26 — THIS
//           AUDIT introduces). Per-spouse forms are passed unconditionally; the
//           helper itself decides whether to read spouse form via `if (!isMfs
//           && spouseMade)` guard at line 20061.
//
//  Line 26 audit positioning (16th audit OUTSIDE 13ab pair; 55th line):
//   • FIFTH payments-section audit (★ FIRST audit AFTER 25abcd cluster complete)
//   • ★ Back to single-spec audits — line 26 has its own spec/deps/knowledge
//   • ★ NO 25a #5 reuse — line 26 not part of 25abcd cluster
//   • ★ NEW single-row §11 created in lines/26.md (not row-append-to-existing)
//   • ★ 19th Legacy A migration — knowledge_line26.md rename; convergence 31→32
//   • ★ 9th META-AUDIT — sub-type (b); ★ DOMINANCE to 89% (8 of 9); ★ SURFACES
//     DRIFT (first drift-surfacing META-AUDIT since 24 #4)
//   • ★ NEW 4th MFS-PROTECTION MECHANISM debut
//   • G6/G7/G8 DEFERRED OOS already documented (no new gaps)
//
//  Line 26 audit angles (10 issues):
//   1. ★ NEW 4th MFS-PROTECTION MECHANISM — in-helper isMfs-flag-gated spouse-
//       form skip; ★ 11th orchestrator-method-based; defensive guard CORRECT
//       (no leakage). ★ MFS cascade UNCHANGED at 20 orchestrators.
//   2. ★ 19th LEGACY A MIGRATION — knowledge_line26.md → line-26-estimated-
//       tax-payments.md; convergence 31 → 32; ★ FIRST Legacy A since 25a #2.
//   3. ★ SPEC ENHANCEMENT — Create NEW §11 single-row Verification log in
//       lines/26.md; ★ 19th CONSECUTIVE single-row contribution; ★ FIRST
//       single-spec §11 audit since 24 (combined-spec at 25abcd).
//   4. ★ 9th META-AUDIT IN WORKFLOW — sub-type (b); ★ DOMINANCE to 89% (8 of 9);
//       ★ SURFACES DRIFT in dependencies/26.md (3 references to G1 as gap;
//       knowledge §12 + code confirm G1 fixed 2026-04-19); ★ FIRST drift-
//       surfacing META-AUDIT since 24 #4 (5 consecutive clean broken at 26 #4);
//       clean trend declines from 71% to 63% within sub-type b.
//   5. VERIFIED CORRECT — line 26 wiring at line 19877-19882 + helper at line
//       20029-20072; ★ 18th anti-duplication application; ★ NO 25a #5 reuse
//       (line 26 not part of 25abcd cluster); 3-source coverage: spec + deps +
//       knowledge. ★ Likely NEW breadcrumb at helper site.
//   6. VERIFIED CORRECT — ★ DUAL-FORM 6-source inheritance chain — 6 fields ×
//       up to 2 forms; ★ in-helper isMfs-flag conditional aggregation; ★ 5th
//       distinct complexity dimension in workflow (DUAL-FORM MFS-gated branching,
//       distinct from depth/cumulative-depth/breadth/conditional).
//   7. VERIFIED CORRECT — 5 conventions (★ Convention 5: SCREENING GATE
//       `madeEstimatedTaxPayments` boolean; UNIQUE to line 26 among 25a-26
//       sub-lines); Conventions 1-4 same as 25a (null-when-zero + no SSN
//       filtering at payment level + MFJ aggregation + MFS protection via NEW
//       4th MECHANISM). ★ TIED with 25b for MOST conventions at 5.
//   8. VERIFIED CORRECT — 0 routing distinctions (no statement form routes to
//       line 26); ★ 1 ALLOCATION RULE — joint estimated payments after
//       divorce/MFS may need post-payment allocation per Pub. 505 (annotation
//       field `divorceFormerSpouseSSN` stored but not summed; spec §6c).
//   9. ⚠️ BUNDLED OBSERVATIONS — 4 observations: G6 (payment dates for Form
//       2210 Schedule AI; DEFERRED OOS); G7 (farmers/fishermen 66⅔% rule; OOS);
//       G8 (community property MFS 50/50 split; OOS); missing diagrams/26.drawio
//       (★ 10th consecutive); ★ 26th Path A. ★ 30 consecutive zero-outstanding.
//       ★ 13th CONSECUTIVE ZERO NEW GAPS.
//  10. BOUNDARY MILESTONE — FIFTH payments-section audit; ★ FIRST audit AFTER
//       25abcd cluster; ★ NEW 4th MFS-PROTECTION MECHANISM debut; ★ Legacy A
//       migration resumed (19th); ★ 9th META-AUDIT (sub-type b at 89%; SURFACES
//       DRIFT); ★ knowledge convergence 32.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '26.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 26 — 2025 ESTIMATED TAX PAYMENTS AND AMOUNT APPLIED FROM 2024 RETURN'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 26 (page 2; "2025 estimated tax payments and amount applied from 2024 return")'],
  ['Concept',
    'Line 26 aggregates all creditable 2025 estimated federal income tax payments PLUS prior-year ' +
    'overpayment amounts elected to be applied to 2025 estimated tax. Six fields per form × up to 2 ' +
    'forms (taxpayer + spouse on MFJ) = up to 12 sources. ★ NEW 4th MFS-PROTECTION MECHANISM — ' +
    '"in-helper isMfs-flag-gated spouse-form skip" — per-spouse forms are passed unconditionally, ' +
    'helper itself decides whether to read spouse form via `if (!isMfs && spouseMade)` guard.'],
  ['Top-level formula (spec §2 + §11)',
    'Form1040.line26 = nz(estimatedTaxPaymentsMadeFor2025)\n' +
    '                + nz(appliedOverpaymentFrom2024OriginalReturn)\n' +
    '                + nz(appliedOverpaymentFrom2024AmendedReturn)\n' +
    '\n' +
    'For MFJ: aggregate both spouses\' forms.\n' +
    'For MFS: only taxpayer\'s own form.\n' +
    'Null when all components zero or absent.'],
  ['Surrounding page-2 chain',
    'line 25d = nz(25a) + nz(25b) + nz(25c)             (totalWithholding — audited at 25d)\n' +
    '★ line 26 = sum(quarterly installments + prior-year overpayments)  (★ THIS LINE — estimatedTaxPayments)\n' +
    'line 27a = EIC                                       (earnedIncomeCredit)\n' +
    'line 28  = ACTC from Schedule 8812                   (additionalChildTaxCredit)\n' +
    'line 29  = refundable AOTC from Form 8863            (americanOpportunityCredit)\n' +
    'line 31  = Schedule 3 line 15                        (otherPaymentsSchedule3)\n' +
    'line 32  = line 27a + line 28 + line 29 + line 30 + line 31   (totalOtherPaymentsAndRefundableCredits)\n' +
    'line 33  = line 25d + line 26 + line 32              (totalPayments)\n' +
    '\n' +
    '★ Line 26 feeds line 33 directly (NOT through line 32).'],
  ['What counts on line 26 (spec §3)',
    '✅ Estimated federal income tax payments made for tax year 2025 (Form 1040-ES, EFTPS, IRS Direct Pay, card)\n' +
    '✅ 2024 overpayment elected on original return to apply to 2025 estimated tax\n' +
    '✅ 2024 overpayment elected on Form 1040-X to apply to 2025 estimated tax\n' +
    '✅ All creditable 2025 estimated payments regardless of when paid (Q1-Q4 + any irregular)'],
  ['What does NOT count on line 26 (spec §4)',
    '❌ Federal withholding from W-2/1099/SSA-1099/RRB-1099/W-2G — goes on lines 25a-25c\n' +
    '❌ Payment with Form 4868 — goes through Schedule 3 line 10 → Form 1040 line 31\n' +
    '❌ Refundable credits (EIC, ACTC, refundable AOTC) — separate payment lines\n' +
    '❌ State estimated tax payments\n' +
    '❌ Amounts intended/scheduled but not actually paid\n' +
    '❌ Payment with the filed 2025 return in 2026 to satisfy balance due\n' +
    '❌ Any amount applied to 2026 estimated tax'],
  ['2025 quarterly due dates (spec §5)',
    'Q1 (Jan 1–Mar 31, 2025): April 15, 2025\n' +
    'Q2 (Apr 1–May 31, 2025): ★ June 16, 2025 (June 15 is Sunday)\n' +
    'Q3 (Jun 1–Aug 31, 2025): September 15, 2025\n' +
    'Q4 (Sep 1–Dec 31, 2025): January 15, 2026\n' +
    '\n' +
    '★ January exception: If 2025 return filed and full balance paid by February 2, 2026 (Jan 31 Sat, Feb 1 Sun, Feb 2 Mon), Q4 not required.\n' +
    '★ Due dates affect Form 2210 penalty analysis but DO NOT change line 26 arithmetic (line 26 = total of all creditable payments regardless of timing).'],
  ['Output target',
    'Primary: form1040.payments.estimatedTaxPayments (BigDecimal; line 26 output; null-when-zero)\n' +
    'PDF field: line26_estimated_tax_payments (page 2)\n' +
    'Frontend field: form.payments?.estimatedTaxPayments'],
  ['Backend implementation',
    '**HELPER METHOD** — `computeLine26EstimatedTax(taxpayerForm, spouseForm, isMfs)` at ' +
    'TaxReturnComputeService.java:20029-20072 (44 lines): ' +
    '(a) Screening gate: at least one form must have `madeEstimatedTaxPayments=true`; null otherwise; ' +
    '(b) Aggregate 6 fields from taxpayer form if gate true; ' +
    '(c) ★ NEW 4th MFS-PROTECTION MECHANISM: `if (!isMfs && spouseMade)` — aggregate 6 fields from ' +
    'spouse form ONLY on non-MFS returns; ' +
    '(d) Return null-when-zero via final compareTo guard. ' +
    '**WIRING SITE** — `computeLine31ThroughLine38` at line 19877-19882: filing-status normalization + ' +
    '`isMfs` flag derivation + helper call + `payments.setEstimatedTaxPayments(line26)`.'],
  ['IRS source',
    'IRS 2025 Form 1040 (page 2 line 26 "2025 estimated tax payments and amount applied from 2024 return") + ' +
    '2025 Instructions for Form 1040 + 2025 Form 1040-ES (estimated tax voucher) + Pub. 505 (allocation rules for ' +
    'divorced/separated spouses). ★ 2025 — June 16 Q2 due date (June 15 Sunday); February 2, 2026 January-payment ' +
    'exception (calendar-adjusted).'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'prepare() loads estimated-tax-payments-taxpayer + estimated-tax-payments-spouse from Firestore', '★ Per-spouse forms are passed unconditionally to helper (★ DIFFERENT from 25a-25d which use storage-level scoping).'],
  [2, 'computeLine31ThroughLine38 derives isMfs flag from filing status at line 19878-19879', '`isMfs = "Married filing separately".equalsIgnoreCase(filingStatusStr)`.'],
  [3, 'computeLine26EstimatedTax helper called at line 19881 with both forms + isMfs', 'Helper signature: (taxpayerForm, spouseForm, isMfs).'],
  [4, 'Helper screening gate at line 20035-20041', 'Reads `madeEstimatedTaxPayments` from each form; if neither true, returns null immediately.'],
  [5, 'Helper aggregates 6 fields from taxpayer form if gate true (line 20050-20057)', '6 fields: installment1Amount + installment2Amount + installment3Amount + installment4Amount + priorYearOverpaymentCredited + amendedReturnOverpaymentCredited. Skips null/zero values.'],
  [6, '★ NEW 4th MFS-PROTECTION MECHANISM — `if (!isMfs && spouseMade)` at line 20061', '★ ON MFS: skips spouse aggregation; spouse files own return. ★ ON MFJ/Single/HOH/QSS: aggregates spouse form too. Same 6 fields.'],
  [7, 'Helper returns roundMoney(total) at line 20070-20071; null-when-zero', 'Convention 1 — null when total ≤ 0.'],
  [8, 'payments.setEstimatedTaxPayments(line26) at line 19882', 'Stores result.'],
  [9, 'Downstream: line 33 total payments', '`line33 = line25d + line26 + line32`. Line 26 is the SECOND addend in line 33.'],
  [10, 'Downstream: Form 2210 totalPayments', 'Form 2210 Part I uses totalPayments (includes line 26) for required-annual-payment comparison.'],
  [],
  ['INVARIANTS / VALIDATIONS (spec §10)'],
  ['Invariant', 'Rationale'],
  ['Line 26 ≥ 0', 'All entered amounts must be nonnegative; negative entries should be rejected/flagged.'],
  ['Line 26 = sum of 6 fields × up to 2 forms (taxpayer + spouse on non-MFS)', 'STRUCTURALLY enforced at line 20043-20068.'],
  ['Line 26 = null when gate false + form absent + all amounts zero', 'STRUCTURALLY enforced via screening gate + final compareTo guard.'],
  ['MFJ aggregates both spouses\' payment forms', '★ NEW 4th MFS-PROTECTION MECHANISM: helper reads spouse form on non-MFS via `if (!isMfs && spouseMade)`. Unit test `line26MfjBothFormsAggregated` + E2E.'],
  ['MFS reports only taxpayer form', '★ STRUCTURALLY enforced — helper skips spouse aggregation block on MFS. Unit test `line26MfsSpouseFormIgnored` + E2E.'],
  ['Taxpayer form may be null (never saved); spouse form still read on MFJ', '★ G4 FIXED 2026-04-19. Unit test `line26MfjSpouseFormReadWhenTaxpayerFormAbsent` + E2E.'],
  ['divorceFormerSpouseSSN is annotation-only (NOT summed)', 'Stored on taxpayer form; never iterated as a payment field. E2E test `divorceFormerSpouseSSN is saved and does not affect line 26 sum`.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 38 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 26'],
  ['Line 26 takes 6 PAYMENT FIELDS × up to 2 FORMS = up to 12 sources, PLUS 1 SCREENING GATE per form + 1 ANNOTATION-ONLY field on taxpayer form. ★ DUAL-FORM structure with explicit MFS-protection mechanism inside the helper (★ NEW 4th MECHANISM in workflow).'],
  [],
  ['PAYMENT FIELDS — 6 per form (taxpayer + spouse if non-MFS)'],
  ['#', 'Field name (YAML)', 'Type', 'Source form', 'IRS authority'],
  [1, 'installment1Amount', 'decimal', 'estimated-tax-payments-taxpayer + estimated-tax-payments-spouse', 'Q1 due April 15, 2025'],
  [2, 'installment2Amount', 'decimal', '(same — per form)', 'Q2 due ★ June 16, 2025 (June 15 Sun)'],
  [3, 'installment3Amount', 'decimal', '(same — per form)', 'Q3 due September 15, 2025'],
  [4, 'installment4Amount', 'decimal', '(same — per form)', 'Q4 due January 15, 2026 (★ February 2, 2026 exception if return filed by then)'],
  [5, 'priorYearOverpaymentCredited', 'decimal', '(same — per form)', '2024 original-return overpayment elected to 2025'],
  [6, 'amendedReturnOverpaymentCredited', 'decimal', '(same — per form)', '2024 Form 1040-X overpayment elected to 2025'],
  [],
  ['SCREENING GATE — Convention 5 (★ UNIQUE among 25-line family)'],
  ['#', 'Field', 'Type', 'Effect'],
  [7, 'madeEstimatedTaxPayments', 'boolean', '★ Screening gate per form — if neither form has gate=true, helper returns null immediately (line 20041). Hides installment fields in UI when false. ★ Convention 5 UNIQUE to line 26 among payments-section sub-lines.'],
  [],
  ['ANNOTATION-ONLY FIELD'],
  ['#', 'Field', 'Type', 'Effect'],
  [8, 'divorceFormerSpouseSSN', 'string', '★ Annotation-only — STORED on taxpayer form but NOT iterated by helper. Used for IRS Form 1040 line 26 former-spouse SSN entry space (spec §6c). Pub. 505 allocation rule applies but auto-allocation is OOS (G8).'],
  [],
  ['FILING STATUS DERIVED INPUT'],
  ['#', 'Source', 'Field', 'How used'],
  [9, 'filing-status form', 'filingStatus', '★ Drives `isMfs` flag at line 19879; ★ flag passed to helper at line 19881 to gate spouse-form aggregation.'],
  [],
  ['★ NEW 4th MFS-PROTECTION MECHANISM (★ debut at line 26)'],
  ['Mechanism', 'Detail'],
  ['★ In-helper isMfs-flag-gated spouse-form skip', 'Per-spouse forms passed unconditionally to helper at line 19881. Helper itself decides whether to read spouse form via `if (!isMfs && spouseMade)` guard at line 20061. ★ STRUCTURALLY DIFFERENT from line 19 #1 (in-method null-shadow at call site) which shadows spouse params to null BEFORE passing to helper. Line 26 passes both forms and lets helper decide internally.'],
  ['vs. 3 established mechanisms', 'Mechanism 1: in-method null-shadow at call site (line 19 #1); Mechanism 2: transitive inheritance (6 audits — 18+20+21+22+23+24); Mechanism 3: upstream-data-segregated-at-storage (4 audits — 25a+25b+25c+25d). ★ Mechanism 4 (NEW): in-helper isMfs-flag-gated spouse-form skip (★ line 26 — first instance).'],
  ['Pattern distribution after 11 audits', '6 transitive inheritance (credits-section) + 4 upstream-data-segregated-at-storage (25abcd payments cluster) + 1 in-helper isMfs-gated (★ NEW; line 26).'],
  [],
  ['⚠️ EXPLICITLY NOT LINE 26 (routed elsewhere — spec §4)'],
  ['Source', 'Routed to', 'Why not 26'],
  ['Federal withholding from W-2', 'Line 25a', 'Withholding, not estimated payment'],
  ['Federal withholding from 1099-series + SSA-1099 + RRB-1099', 'Line 25b', 'Withholding'],
  ['Federal withholding from W-2G + Form 8959', 'Line 25c', 'Withholding'],
  ['Payment with Form 4868', 'Schedule 3 line 10 → Form 1040 line 31', 'Extension payment, not estimated tax'],
  ['EIC + ACTC + refundable AOTC', 'Lines 27a / 28 / 29', 'Refundable credits, not estimated payments'],
  ['State estimated tax payments', '(nowhere on federal 1040)', 'Federal-only line'],
  ['Amount paid with 2025 return in 2026', '(line 37 reduction, not line 26)', 'Balance-due payment, not estimated'],
  ['Amount applied to 2026 estimated tax', '(line 36; OOS for line 26)', 'Forward-looking carryforward'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 45 }, { wch: 18 }, { wch: 50 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 26'],
  ['Line 26 uses ZERO numeric reference data — pure aggregation. ★ However it has 2025-specific CALENDAR constants (quarterly due dates) that change year-to-year via weekend/holiday calculations. These dates affect Form 2210 penalty analysis but do NOT change line 26 arithmetic.'],
  [],
  ['Constant', '2025 Value', 'Statutory Basis', 'Notes'],
  ['Q1 due date', 'April 15, 2025 (Tue)', 'IRC §6654; spec §5', 'No adjustment needed for 2025'],
  ['Q2 due date', '★ June 16, 2025 (Mon)', 'IRC §6654 weekend rule', '★ 2025-specific: June 15 is Sunday → next business day'],
  ['Q3 due date', 'September 15, 2025 (Mon)', 'IRC §6654; spec §5', 'No adjustment needed for 2025'],
  ['Q4 due date', 'January 15, 2026 (Thu)', 'IRC §6654; spec §5', 'No adjustment needed for 2026'],
  ['January exception cutoff', '★ February 2, 2026 (Mon)', 'IRC §6654 + weekend rule', '★ 2026-specific: Jan 31 Sat, Feb 1 Sun, Feb 2 Mon. If 2025 return + balance paid by this date, Q4 installment not required.'],
  [],
  ['★ KEY INSIGHT: dates affect Form 2210 penalty, NOT line 26 arithmetic'],
  ['Line 26 itself is the SUM of all creditable payments regardless of timing.', '', '', ''],
  ['Form 2210 Schedule AI (annualized income method) uses payment dates — that data is captured per G6 DEFERRED OOS.', '', '', ''],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 35 }, { wch: 30 }, { wch: 40 }, { wch: 65 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 26 Persistence + Downstream Consumers'],
  ['Line 26 sets one field on Payments output model. Feeds line 33 (total payments) and Form 2210 (penalty analysis).'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.payments.estimatedTaxPayments', '`computeLine31ThroughLine38` line 19882', '★ CANONICAL line 26 output. = sum of 6 fields × up to 2 forms. Null-when-zero via helper compareTo guard.'],
  [],
  ['SAME-METHOD DOWNSTREAM — line 33 in computeLine31ThroughLine38'],
  ['form1040.payments.totalPayments (line 33)', '~line 19960', '★ line 33 = line 25d + line 26 + line 32. Line 26 is the SECOND addend.'],
  ['Lines 37/38 (refund/owed)', '~line 19990+', 'Line 26 feeds line 33; line 33 vs. line 24 determines refund (line 37) or amount owed (line 38).'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Form 2210 Part I — required annual payment', 'computeForm2210() (called after computeLine31ThroughLine38)', '★ Form 2210 uses totalPayments (which includes line 26) for required-annual-payment penalty calculation.'],
  ['Frontend PDF export', 'form-tax-return-1040.component.ts', '`values[\'line26_estimated_tax_payments\'] = formatAmount(payments?.estimatedTaxPayments)`'],
  ['Frontend line 33 recompute', 'form-tax-return-1040.component.ts:454', '`sumAmounts([line25dTotalWithholding(), payments.estimatedTaxPayments, line32OtherPayments()])`.'],
  [],
  ['PDF Output'],
  ['PDF Field', 'Field Code'],
  ['Line 26 amount (page 2)', 'line26_estimated_tax_payments'],
  ['Former-spouse SSN annotation (line 26 entry space)', '(spec §6c — IRS provides dedicated space for divorced filers)'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 50 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 26'],
  ['Line 26 emits NO blocking flags directly. Helper has a screening gate (Convention 5) and null-when-zero final guard. Frontend validates non-negative amounts.'],
  [],
  ['Flag code', 'Severity', 'Condition'],
  ['(None at line 26 site)', 'N/A', 'No validation flags at line 26.'],
  [],
  ['SPEC §10 STRUCTURAL INVARIANTS'],
  ['Invariant', 'How enforced'],
  ['Entered payment amounts ≥ 0', 'Frontend validation; backend `parseAmount` rejects malformed; negative net not aggregated.'],
  ['Line 26 ≥ 0', 'STRUCTURALLY enforced — sources ≥ 0; sum ≥ 0.'],
  ['Line 26 null when gate false', '★ Convention 5 SCREENING GATE: helper returns null at line 20041 if neither form has `madeEstimatedTaxPayments=true`.'],
  ['Line 26 null when all amounts zero', 'STRUCTURALLY enforced via final `total != null && total > 0 ? roundMoney(total) : null` guard at line 20070-20071.'],
  ['MFS aggregates ONLY taxpayer form', '★ NEW 4th MFS-PROTECTION MECHANISM — in-helper guard `if (!isMfs && spouseMade)` at line 20061 skips spouse aggregation. Unit test `line26MfsSpouseFormIgnored`.'],
  ['MFJ aggregates BOTH forms', '★ Same NEW 4th MFS-PROTECTION MECHANISM. Unit tests `line26MfjBothFormsAggregated` + `line26MfjOnlySpouseFormHasPayments` + `line26MfjSpouseFormReadWhenTaxpayerFormAbsent`.'],
  ['divorceFormerSpouseSSN annotation never summed', 'STRUCTURALLY enforced — field is not in the `fields` list at line 20043-20046. E2E test `divorceFormerSpouseSSN is saved and does not affect line 26 sum`.'],
  ['Negative amounts rejected/flagged', 'Helper `if (v != null && v.compareTo(BigDecimal.ZERO) > 0)` at line 20053 + 20064 — negative or zero amounts skipped.'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 14 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 26 is the estimated-tax-payments aggregation (★ DUAL-FORM 6-source structure with NEW 4th MFS-protection mechanism). 16th audit OUTSIDE 13ab pair; FIFTH payments-section audit (★ FIRST audit AFTER 25abcd cluster complete); ★ NEW 4th MFS-PROTECTION MECHANISM debut; ★ 19th Legacy A migration resumed; ★ 9th META-AUDIT pushing sub-type (b) DOMINANCE to ~89% AND surfacing drift in dependencies/26.md. 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-15 — ★ NEW 4th MFS-PROTECTION MECHANISM debut — "in-helper isMfs-flag-gated spouse-form skip" (★ 11th orchestrator-method-based audit; ★ FIRST audit to introduce a 4th distinct MFS-protection mechanism; defensive guard structurally correct; MFS cascade UNCHANGED at 20 orchestrators)',
    '**Per-input MFS-leakage analysis**: line 26 helper at TaxReturnComputeService.java:20029-20072 receives both per-spouse forms unconditionally (taxpayerForm + spouseForm + isMfs flag); helper itself decides whether to read spouse form via `if (!isMfs && spouseMade)` guard at line 20061. ★ STRUCTURALLY DIFFERENT from 3 established mechanisms: (M1) line 19 #1 "in-method null-shadow at call site" shadows spouse param to null BEFORE passing to helper; (M2) "transitive inheritance from MFS-clean fields" — no explicit isMfs check anywhere; (M3) "upstream-data-segregated-at-storage" — Firestore queries are user-scoped, no in-method check needed. ★ Line 26\'s mechanism (M4) passes both forms unconditionally and lets HELPER decide internally based on flag. **★ 4th distinct MFS-protection mechanism in workflow**. **★ 11th orchestrator-method-based audit**. Helper guard verified correct: MFS skips spouse aggregation (unit test `line26MfsSpouseFormIgnored`); MFJ aggregates both (unit test `line26MfjBothFormsAggregated`); MFJ + null taxpayer form still aggregates spouse (G4 fix; unit test `line26MfjSpouseFormReadWhenTaxpayerFormAbsent`). MFS cascade UNCHANGED at 20. Backend tests: **765/765 unchanged**.',
    'TaxReturnComputeService.java:20029-20072 (computeLine26EstimatedTax helper; in-helper MFS guard at line 20061)',
    'CLOSED — ★ NEW 4th MFS-PROTECTION MECHANISM debut. ★ Helper guard verified correct (3 lock-in unit tests). Pattern distribution after 11 audits: 6 transitive inheritance (M2) + 4 upstream-data-segregated-at-storage (M3) + 1 in-helper isMfs-flag-gated spouse-form skip (★ M4 NEW; line 26 first instance). ★ 11th orchestrator-method-based audit. MFS-guard cascade UNCHANGED at 20 orchestrators. ★ Pattern may recur for line 27a (EIC — has per-spouse forms via taxpayer/spouse EIC) — to be confirmed at next audit. Pure cross-reference closure. 765/765 unchanged.'],

  [2, 'RESOLVED 2026-05-15 — ★ 19th LEGACY A MIGRATION — Renamed C:\\us-tax\\knowledge\\knowledge_line26.md → line-26-estimated-tax-payments.md (convergence 31 → 32; ★ FIRST Legacy A since 25a #2; 5-audit dry spell ended)',
    '**The situation**: Knowledge file at `C:\\us-tax\\knowledge\\knowledge_line26.md` follows the **Legacy A naming convention** (underscore-prefixed with `knowledge_lineN`). Workflow has been converging on the descriptive naming `line-N-topic.md` (e.g., line-22-tax-after-credits.md, line-23-other-taxes.md, line-24-total-tax.md, line-25abcd-federal-withholding.md). ★ 18 lines have migrated to date (last was 25a #2 → combined-spec `line-25abcd-federal-withholding.md`). **This audit produces the 19th Legacy A migration** — `knowledge_line26.md` → `line-26-estimated-tax-payments.md`. Convergence count advances **31 → 32 lines**. ★ FIRST Legacy A migration since 25a #2 (2026-05-15) — 5 audits with no Legacy A (25b/25c/25d were all combined-spec "already-migrated" closures inheriting from 25a #2). ★ Legacy A streak resumes. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\knowledge\\knowledge_line26.md (rename to line-26-estimated-tax-payments.md)',
    'CLOSED — knowledge_line26.md RENAMED to line-26-estimated-tax-payments.md. **★ 19th LEGACY A MIGRATION in workflow** (previously 18). Convergence advanced **31 → 32 lines**. ★ FIRST Legacy A migration since 25a #2 (5-audit dry spell ended). ★ Naming convention firmly established: 19 of 38 lines have descriptive `line-N-*.md` knowledge files. Generator updated to reference new filename. No cross-reference impact (only internal references updated).'],

  [3, 'RESOLVED 2026-05-15 — ★ SPEC ENHANCEMENT — Created NEW §12 Verification log section in lines/26.md (★ NEW single-row §12 — not row-append; ★ 19th CONSECUTIVE single-row contribution; ★ FIRST single-spec §11/§12 audit since line 24 — combined-spec at 25abcd intervened)',
    '**Goal**: create a NEW `## 12) Verification log` section in `lines/26.md` for the line 26 audit. ★ This is NOT a row-append to existing §11 (like 25b/25c/25d did within 25abcd combined spec) — it is the CREATION of a fresh single-row §11/12 (line 26 has its own spec; combined-spec property does not apply). ★ Pre-state: lines/26.md has no §12. ★ Post-state: §12 has 1 row in IN-PROGRESS state for 26 capturing #1 (★ NEW 4th MFS-PROTECTION MECHANISM) + #2 (★ 19th Legacy A migration) + #3 (this §12 creation). Finalized to COMPLETE at Issue #10. **★ 19th CONSECUTIVE single-row contribution in workflow**. **★ FIRST single-spec §11/12 audit since 24** (25a/25b/25c/25d were combined-spec row-appends; line 26 returns to single-spec convention). Pure spec enhancement.',
    'C:\\us-tax\\lines\\26.md (create new §12 Verification log section)',
    'CLOSED — NEW §12 Verification log section CREATED in lines/26.md with single-row IN-PROGRESS state; #1+#2+#3 closures enumerated; will be finalized to COMPLETE at Issue #10. **★ 19th CONSECUTIVE single-row contribution in workflow**. **★ FIRST single-spec §11/12 audit since line 24** (combined-spec intervened at 25abcd). ★ Naming variation noted: combined-spec used `## 11)` but single-spec convention from earlier audits (22/23/24) also used `## 11)`; this audit uses `## 12)` because lines/26.md already has §11 = Summary Rule. Number choice is per-spec; semantic role is identical.'],

  [4, 'RESOLVED 2026-05-15 — ★ 9th META-AUDIT IN WORKFLOW — sub-type (b) signature (dependencies + knowledge §0 banners); ★ DOMINANCE to ~89% (8 of 9); ★ SURFACES DRIFT — first drift-surfacing META-AUDIT since 24 #4; clean trend in sub-type (b) declines from 71% to 63%; ★ 11th DOC-DRIFT FIX (6-audit zero-drift streak broken)',
    '**The situation**: Standard sub-type (b) META-AUDIT — dependencies/26.md "Audited 2026-04-19" header + knowledge §0 banner check. **★ 9th META-AUDIT in workflow**. **★ ESTABLISHES sub-type (b) at 89% DOMINANCE — 8 of 9 META-AUDITS** (lines 22+23+24+25a+25b+25c+25d+26); line 21 alone uses sub-type (a). ★ **SURFACES DRIFT** — dependencies/26.md has 3 references to G1 as a gap that contradict knowledge §12 (G1 FIXED 2026-04-19) and code (line 20029-20072 reads spouse form correctly on non-MFS): (i) line 21 "Never read by backend — G1 gap on MFJ returns"; (ii) line 62 "spouseForm, ← never read inside method (G1)"; (iii) line 91 "MFJ spouse form data silently dropped | G1: MEDIUM gap". ★ **FIRST drift-surfacing META-AUDIT since 24 #4** (5 consecutive clean META-AUDITs at 25a + 25b + 25c + 25d broken at 26 #4). ★ Clean trend in sub-type (b) declines from 71% (5 clean / 7) to 63% (5 clean / 8). **★ 7 consistency checks** — 4 pass + 3 fail: (a) ✅ method exists; (b) ✅ helper signature matches; (c) ✅ Payments.estimatedTaxPayments field; (d) ✅ frontend mapping; (e) ❌ dependencies/26.md lines 21+62+91 reference G1 as gap; (f) ✅ knowledge §12 confirms G1 fixed; (g) ✅ code reads spouse form on non-MFS. **★ DRIFT FIX REQUIRED**: update dependencies/26.md to mark G1 as FIXED 2026-04-19 (3 line edits). Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\dependencies\\26.md lines 21 + 62 + 91 (3 stale G1 references); knowledge/knowledge_line26.md §12 (G1 FIXED 2026-04-19); TaxReturnComputeService.java:20061 (in-helper MFS guard verifying G1 fix)',
    'CLOSED — META-AUDIT consistency check complete with DRIFT FIX. **★ 9th META-AUDIT in workflow**. **★ DOMINANCE to 89% — 8 of 9 META-AUDITS use sub-type (b)** (lines 22+23+24+25a+25b+25c+25d+26); only line 21 uses sub-type (a). **★ SURFACES DRIFT — 11th doc-drift fix in workflow** (previously 10): dependencies/26.md updated at 3 locations to mark G1 as FIXED 2026-04-19. **★ FIRST drift-surfacing META-AUDIT since 24 #4** (5-consecutive-clean streak at 25a/25b/25c/25d broken). ★ Clean trend in sub-type (b) declines from 71% to 63% (5 clean / 8). ★ Pattern observation: combined-spec META-AUDITs (25abcd) had simpler verification (one shared §0 source) and stayed clean; single-spec META-AUDITs are more prone to drift because spec/deps/knowledge are 3 distinct files that can independently fall out of sync. 7/7 final consistency checks pass after drift fix.'],

  [5, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — line 26 wiring at line 19877-19882 + helper at line 20029-20072; ★ 18th anti-duplication application; ★ NO 25a #5 reuse (line 26 not part of 25abcd cluster); 3-source coverage via spec + dependencies + knowledge; pre-existing helper doc comment re-validated as method-level breadcrumb (no new breadcrumb planted)',
    '**Closure intent**: pure cross-reference closure + ★ NEW breadcrumb at helper site. Line 26 is **NOT covered by 25a #5 NEW breadcrumb** — 25a #5 documents only line 25a/25b/25c/25d (the 25abcd cluster); line 26 is a separate sub-line with its own helper method. ★ This audit plants a NEW method-level breadcrumb at the helper site (line 20020-20028 doc comment block ALREADY exists — verify it documents the helper signature + MFS protection mechanism + null-when-zero). 3-source coverage: spec §2+§3+§8 + dependencies §Inputs + knowledge §3. **18th anti-duplication application** (counted via 3-source coverage rule).',
    'TaxReturnComputeService.java:19877-19882 (wiring) + 20029-20072 (helper); spec lines/26.md + dependencies/26.md + knowledge (post-rename)',
    'CLOSED — verified correct via 3-source coverage (spec §2+§3+§8 + dependencies §Inputs + knowledge §3). **★ 18th anti-duplication application**. **★ NO 25a #5 reuse** — line 26 is NOT part of 25abcd cluster. ★ Helper has pre-existing doc comment at lines 20020-20028 covering signature + MFS protection (in-helper guard) + null-when-zero; this audit verifies it remains accurate and serves as the method-level breadcrumb (no new breadcrumb planted; existing one re-validated). ★ Looking forward: line 27a (EIC) and line 28 (ACTC) may reuse the line 26 helper-site breadcrumb if they share the in-helper MFS pattern.'],

  [6, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — ★ DUAL-FORM 6-source inheritance chain (★ 5th distinct complexity dimension in workflow — DUAL-FORM MFS-gated branching, distinct from depth/cumulative-depth/breadth/conditional)',
    '**Closure intent**: pure cross-reference closure — verifies the dual-form 6-source inheritance chain that makes line 26 correct AND MFS-clean. **★ 5th distinct complexity dimension in workflow** (★ DUAL-FORM MFS-GATED BRANCHING — distinct from depth at line 23, cumulative depth at line 24, breadth at line 25b, conditional branching at line 25c, pure-sum simplest at line 25d). **Chain stages**: **(1)** Two per-spouse Firestore forms loaded in prepare() — `estimatedTaxPaymentsTaxpayer` + `estimatedTaxPaymentsSpouse`. **(2)** Filing status normalized; `isMfs` derived at line 19878-19879. **(3)** Helper called with both forms + flag at line 19881. **(4)** Helper screening gate at line 20035-20041: short-circuit null if neither form has `madeEstimatedTaxPayments=true`. **(5)** Taxpayer aggregation block: iterate 6 fields if taxpayer gate true. **(6)** ★ NEW 4th MFS-PROTECTION MECHANISM gate at line 20061: `if (!isMfs && spouseMade)` — only enter spouse aggregation block on non-MFS. **(7)** Spouse aggregation block: iterate same 6 fields if MFS-gate passed AND spouse gate true. **(8)** Final null-when-zero guard via `total > 0 ? roundMoney(total) : null`. **(9)** Setter writes to Payments.estimatedTaxPayments. **★ MFS-protection mechanism is STRUCTURALLY DIFFERENT** from all 3 prior mechanisms — see Issue #1. **★ KEY PROPERTY**: dual-form branching is the structural distinction; both forms can contribute, but isMfs flag gates spouse contribution.',
    'TaxReturnComputeService.java:20029-20072 (helper); chain documented in dependencies/26.md compute order + knowledge §6',
    'CLOSED — verified correct via DUAL-FORM 6-source inheritance chain. **★ 5th distinct complexity dimension in workflow** — DUAL-FORM MFS-GATED BRANCHING (vs. depth/cumulative/breadth/conditional/pure-sum). 9-stage chain: 2 forms → filing status → helper call → screening gate → taxpayer aggregation → ★ NEW 4th MFS-PROTECTION MECHANISM gate → spouse aggregation (non-MFS only) → null-when-zero guard → setter. ★ KEY PROPERTY: MFS protection is the structural distinction — both forms can contribute on non-MFS; spouse contribution gated by isMfs flag on MFS. MFS-clean by design.'],

  [7, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — 5 CONVENTIONS (★ Convention 5: SCREENING GATE `madeEstimatedTaxPayments` boolean — UNIQUE among 25-line family; ★ tied with line 25b for MOST conventions of any audit)',
    '**Closure intent**: pure verification closure — confirms five line-26-specific conventions, four shared with 25a + 1 UNIQUE. **Convention 1 — Null-when-zero**: helper compareTo guard at line 20070-20071 returns null when total ≤ 0. **Convention 2 — No SSN filtering at payment level**: 6 fields iterated regardless of SSN; payment-level (not wage-level) aggregation. **Convention 3 — MFJ aggregation**: BOTH spouses\' forms read and combined on non-MFS via NEW 4th MFS-PROTECTION MECHANISM. **Convention 4 — MFS protection via NEW 4th MECHANISM**: in-helper `if (!isMfs && spouseMade)` guard at line 20061 skips spouse aggregation on MFS. **★ Convention 5 — SCREENING GATE `madeEstimatedTaxPayments` boolean**: PER FORM screening gate; helper short-circuits null if neither form has gate true (line 20041); UI hides installment fields when gate false. **★ UNIQUE among 25-line family** — 25a/25b/25c/25d had no per-form screening gate (all aggregation was unconditional from statement form presence). **★ Convention 5 is INTAKE-LEVEL gate** (distinct from line 25b\'s Convention 5 SSA-1099 SPECIAL FIELD NAME which was field-name handling). **★ TIED with line 25b for MOST conventions of any audit at 5**. Lock-in tests: `line26GateReturnNullWhenNotMade` + `line26MfjBothFormsAggregated` + `line26MfsSpouseFormIgnored` + `line26MfjSpouseFormReadWhenTaxpayerFormAbsent`. Pure verification closure.',
    'TaxReturnComputeService.java:20029-20072 (helper); spec §10 (validation rules); knowledge §10 (test inventory)',
    'CLOSED — verified correct. **5 CONVENTIONS** (★ tied with line 25b for MOST in workflow): **Convention 1** null-when-zero (helper compareTo guard at line 20070-20071) + **Convention 2** no SSN filtering at payment level + **Convention 3** MFJ aggregation (both spouses\' forms on non-MFS) + **Convention 4** MFS protection via NEW 4th MECHANISM (in-helper isMfs-flag-gated spouse-form skip at line 20061) + **★ Convention 5 SCREENING GATE `madeEstimatedTaxPayments` boolean** (★ UNIQUE among 25-line family; INTAKE-LEVEL gate distinct from 25b\'s field-name handling). ★ TIED with line 25b for MOST conventions. ★ Audit-trail vocabulary distinction preserved: Convention 5 here is intake-flag handling; Convention 5 at 25b was field-name handling. Both are distinct from STRUCTURAL features (like MFS mechanism). Lock-in tests: 4 unit tests (gate + MFJ + MFS + null-taxpayer-form) + E2E coverage.'],

  [8, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — 0 routing distinctions (no statement form routes to line 26 directly); ★ 1 ALLOCATION RULE — divorced/MFS joint payments allocation (Pub. 505; annotation field `divorceFormerSpouseSSN` stored but not summed; auto-allocation OOS per G8)',
    '**Closure intent**: pure verification closure — confirms zero routing distinctions specific to line 26 + verifies the divorced-filer allocation handling. **Routing**: ★ ZERO — line 26 has its own dedicated input forms (estimated-tax-payments-taxpayer + estimated-tax-payments-spouse); no statement form routes here. Routing complexity comparison: 25a 0 + 25b 4 MOST + 25c 2 + 25d 0 + **26 0** (★ STRUCTURALLY trivial routing). **★ 1 ALLOCATION RULE per spec §6c**: If taxpayer made joint estimated tax payments with a FORMER spouse during 2025, IRS Form 1040 provides dedicated entry space for former-spouse SSN on line 26 row. Pub. 505 governs allocation between former spouses (typically proportion to each spouse\'s individual tax liability if no agreement). ★ Implementation: `divorceFormerSpouseSSN` field on TAXPAYER form only (per knowledge §2; spouse form does not have this field); STORED but NOT iterated by helper (NOT in the `fields` list at line 20043-20046). E2E test verifies SSN round-trip + line 26 = $1000 only (no double-counting). **★ Auto-allocation is OOS per G8 (community property MFS 50/50)**. Pure verification closure.',
    'TaxReturnComputeService.java:20029-20072 (helper — divorceFormerSpouseSSN NOT in fields list); spec §6c; knowledge §2 + §10 (annotation-only verification)',
    'CLOSED — verified correct. **Routing**: ★ 0 routing distinctions specific to line 26 (no statement form routes here). Routing complexity comparison across 25a-26: 25a 0 + 25b 4 (MOST) + 25c 2 + 25d 0 + **26 0** (★ TRIVIAL). **★ 1 ALLOCATION RULE per spec §6c**: divorced filer with joint 2025 estimated payments enters former-spouse SSN on line 26 via `divorceFormerSpouseSSN` taxpayer-form field; field STORED but NOT iterated by helper (annotation-only); Pub. 505 allocation rule applies but ★ AUTO-ALLOCATION is OOS per G8 (community property MFS 50/50). E2E lock-in: SSN persists + line 26 = $1000 only (no double-counting). ★ Manual allocation may be needed by user but tool does not enforce.'],

  [9, 'RESOLVED 2026-05-15 — ⚠️ BUNDLED OBSERVATIONS — 4 observations (★ 26th Path A application; ★ 30 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS — extends first 20-streak by 10; ★ 13th CONSECUTIVE AUDIT WITH ZERO NEW GAPS — double-digit milestone deepens further; ★ 10th consecutive missing-diagrams gap)',
    '**Closure intent**: pure xlsx-flip observation bundle — **NO code change**; **NO outstanding.md entry**. FOUR observations bundled. **(a) G6 DEFERRED OOS — Payment dates for Form 2210 Schedule AI**: 6 payment fields capture only AMOUNT, not DATE. Form 2210 Schedule AI (annualized income installment method) requires per-payment dates for accurate penalty calculation. Documented in knowledge §12 as G6 DEFERRED OOS. **(b) G7 DEFERRED OOS — Farmers/fishermen 66⅔% one-installment rule**: IRS allows farmers/fishermen to make a single Jan 15 installment if 66⅔% of gross income is from farming/fishing. Form 2210-F path; OOS per knowledge §12. **(c) G8 DEFERRED OOS — Community property MFS 50/50 allocation**: Pub. 505 allocation rule for jointly-made estimated payments in community property states; OOS per knowledge §12 + Issue #8. **(d) Missing `diagrams/26.drawio` cosmetic** — ★ 10th consecutive credits/payments-section audit with this gap (20-24 + 25a + 25b + 25c + 25d + 26). One-shot cleanup overdue across 10 lines. **★ Anti-fragmentation policy applied** — all 3 G-deferrals already in outstanding.md from 2026-04-19. **★ 26th PATH A APPLICATION**. **★ 30 consecutive zero-outstanding walkthroughs** (extends first 20-streak by 10). **★ 13th CONSECUTIVE ZERO NEW GAPS** (double-digit milestone deepens further).',
    'G6 payment dates (DEFERRED OOS); G7 farmers/fishermen (DEFERRED OOS); G8 community property MFS (DEFERRED OOS); diagrams/26.drawio (missing)',
    'CLOSED — pure observation bundle. **★ 26th Path A application**. **★ 30 consecutive zero-outstanding walkthroughs** (extends first 20-streak by 10). **★ 13th CONSECUTIVE ZERO NEW GAPS** (double-digit milestone deepens further — codebase stability signal continues strengthening). 4 observations: (a) G6 DEFERRED OOS payment dates for Form 2210 Schedule AI (documented; ★ enhancement candidate when Form 2210 Schedule AI is implemented); (b) G7 DEFERRED OOS farmers/fishermen 66⅔% rule + Form 2210-F (outside scope); (c) G8 DEFERRED OOS community property MFS 50/50 (Pub. 505 allocation; outside scope); (d) Missing `diagrams/26.drawio` cosmetic — ★ 10th consecutive credits/payments-section audit with this gap (now overdue across 10 lines: 20-24 + 25a + 25b + 25c + 25d + 26).'],

  [10, 'RESOLVED 2026-05-15 — BOUNDARY MILESTONE — Line 26 walkthrough complete at 10/10; ★ FIFTH payments-section audit; ★ FIRST audit AFTER 25abcd cluster complete; ★ NEW 4th MFS-PROTECTION MECHANISM debut; ★ Legacy A migration resumed (19th); ★ 9th META-AUDIT (sub-type b at 89%; SURFACES DRIFT — clean trend declines to 63%); ★ knowledge convergence 31 → 32; ★ 5 CONVENTIONS tied with 25b for MOST; ★ 5th distinct complexity dimension in workflow (DUAL-FORM MFS-gated branching); ★ 30 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS; ★ 13th CONSECUTIVE AUDIT WITH ZERO NEW GAPS; ★ 19th CONSECUTIVE single-row contribution',
    'Pure xlsx-flip + Verification log row 1 finalization — **CLOSES the 26 walkthrough at 10/10**. TWO file touches: (a) this row flipped to RESOLVED; (b) lines/26.md §12 Verification log row 1 finalized IN-PROGRESS → **COMPLETE — 10/10 closed**. **Eight themes**: (1) ★ Structural positioning — 16th audit OUTSIDE 13ab pair; ★ FIFTH payments-section audit (★ FIRST audit AFTER 25abcd cluster complete); 55th line. (2) **★ NEW 4th MFS-PROTECTION MECHANISM debut** — in-helper isMfs-flag-gated spouse-form skip (★ STRUCTURALLY DISTINCT from M1/M2/M3); pattern distribution: 6 M2 + 4 M3 + 1 M4 (★ NEW); MFS cascade UNCHANGED at 20 orchestrators. (3) **★ 9th META-AUDIT** — sub-type (b) at 89% DOMINANCE (8 of 9); ★ SURFACES DRIFT in dependencies/26.md (3 stale G1 references; 11th doc-drift fix in workflow); ★ FIRST drift-surfacing META-AUDIT since 24 #4 (5-clean streak broken); clean trend declines from 71% to 63%. (4) **★ Legacy A migration resumed** (Issue #2: ★ 19th Legacy A; 5-audit dry spell ended; convergence 31 → 32). (5) **★ NEW single-spec §12 Verification log** (Issue #3: ★ FIRST single-spec §11/12 audit since 24; ★ 19th CONSECUTIVE single-row contribution). (6) **★ 5 CONVENTIONS** (Issue #7: ★ tied with line 25b for MOST; ★ Convention 5 SCREENING GATE UNIQUE — intake-level gate; vocabulary distinction preserved). (7) **★ 5th distinct complexity dimension** (Issue #6: ★ DUAL-FORM MFS-gated branching). (8) **★ ZERO NEW gaps surfaced — 13th consecutive audit** (lines 18-24 + 25a + 25b + 25c + 25d + 26 all zero). **Cumulative through line 26**: **55 lines audited** (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + 11b + 12a + 12b + 12c + 12d + 12e + 13a + 13b + 14 + 15 + 16 + 17 + 18 + 19 + 20 + 21 + 22 + 23 + 24 + 25a + 25b + 25c + 25d + **26**); **547 audit issues closed total** (537 + 10); backend **765/765 pass** (UNCHANGED — 7th audit with zero new tests); MFS cascade = **20 orchestrators** (unchanged); knowledge convergence = **32 lines** (★ +1 from 26 #2; ★ first Legacy A migration since 25a #2); 26 Path A applications (+1 from 26 #9); **★ 18 anti-duplication applications** (+1 from 26 #5); 0 NEW gaps surfaced (13th consecutive); **★ 9 META-AUDITS** (+1 from 26 #4; ★ sub-type (b) at 89% DOMINANCE; ★ SURFACES DRIFT; clean trend declines to 63%); **★ 11 documentation drift fixes** (+1 from 26 #4; ★ 6-audit zero-drift streak broken at 26 #4); **★ 4 distinct MFS-protection mechanisms** (+1 from 26 #1 NEW); **★ 5 distinct complexity dimensions in workflow** (+1 from 26 #6 NEW). **★ 30 CONSECUTIVE WALKTHROUGHS WITH ZERO NEW OUTSTANDING.MD ENTRIES** (extends first 20-streak by 10). **Verification logs**: ... + 25abcd (4 rows COMPLETE) + 26 (★ NEW §12 with 1 row COMPLETE; ★ 19th CONSECUTIVE single-row). **Looking ahead — line 27a (Earned Income Credit — EIC)**: 17th audit OUTSIDE 13ab pair; SIXTH payments-section audit; ★ may reuse the NEW 4th MFS-PROTECTION MECHANISM (line 27a takes per-spouse EIC forms); ★ likely 12th orchestrator-method-based; ★ likely 10th META-AUDIT pushing sub-type (b) DOMINANCE to ~90% (9 of 10); fresh spec/dependencies (lines/27abc.md likely exists).',
    'XLS/computations/26.xlsx audit-trail (this row); lines/26.md §12 Verification log row 1 FINALIZED to COMPLETE — 10/10 closed; ★ NEW 4th MFS-PROTECTION MECHANISM debut; ★ Legacy A 19th; ★ DRIFT fixed at dependencies/26.md',
    'CLOSED — 10/10. **55 lines; 547 issues; 765/765 backend (UNCHANGED — 7th audit with zero new tests); 20 orchestrators (UNCHANGED); 32-line knowledge convergence (★ +1 from 26 #2; ★ 19th Legacy A migration); 11 doc-drift fixes (+1; ★ 6-audit zero-drift streak broken at 26 #4); 26 Path A applications; ★ 18 anti-duplication applications; ★ 30 consecutive zero-outstanding walkthroughs (extends first 20-streak by 10); ★ 13th CONSECUTIVE ZERO NEW GAPS (double-digit milestone DEEPENS FURTHER); ★ 19th CONSECUTIVE single-row contribution; ★ 9 META-AUDITS (★ sub-type (b) at 89% DOMINANCE; ★ SURFACES DRIFT; clean trend declines to 63% within sub-type b); ★ 4 distinct MFS-protection mechanisms (★ NEW M4 introduced); ★ 5 distinct complexity dimensions in workflow (★ NEW DUAL-FORM MFS-gated branching); ★ NEW single-spec §12 Verification log; ★ 5 CONVENTIONS tied with 25b for MOST; ★ G6/G7/G8 DEFERRED OOS already documented**. ★ FIFTH payments-section audit. ★ FIRST audit AFTER 25abcd cluster complete. Next: line 27a (EIC; ★ may reuse NEW M4 if per-spouse EIC; ★ 10th META-AUDIT pushing DOMINANCE to ~90%).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 120 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 26 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Notes'],
  ['form1040.payments.estimatedTaxPayments', 'Form 1040 page 2, line 26 (PDF key line26_estimated_tax_payments)', '★ CANONICAL line 26 output. = sum(6 fields × up to 2 forms). Null-when-zero via helper compareTo guard.'],
  [],
  ['SAME-METHOD DOWNSTREAM — line 33 in computeLine31ThroughLine38'],
  ['form1040.payments.totalPayments (line 33)', '~line 19960', '★ line 33 = line 25d + line 26 + line 32. Line 26 is the SECOND addend in total payments.'],
  ['Lines 37/38 (refund/owed)', '~line 19990+', 'Line 26 feeds line 33; line 33 vs. line 24 determines refund or amount owed.'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Form 2210 — required annual payment', 'computeForm2210() (called after computeLine31ThroughLine38)', '★ Form 2210 uses totalPayments (which includes line 26) for required-annual-payment penalty calculation.'],
  ['Frontend PDF export', 'form-tax-return-1040.component.ts', '`values[\'line26_estimated_tax_payments\'] = formatAmount(payments?.estimatedTaxPayments)`'],
  ['Frontend line 33 recompute', 'form-tax-return-1040.component.ts:454', '`sumAmounts([line25dTotalWithholding(), payments.estimatedTaxPayments, line32OtherPayments()])`'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
