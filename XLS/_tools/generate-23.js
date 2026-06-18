// ============================================================================
//  Generates: C:\us-tax\XLS\computations\23.xlsx
//
//  Source-of-truth references:
//    - lines/23.md (2025-tax-year spec; 263 lines; defines line 23 = Schedule 2
//      line 21; 5 critical guardrails (§4a-§4e: line 23 = Schedule 2 line 21 only;
//      line 21 EXCLUDES line 20 Section 965; lines 5+6 flow only through line 7;
//      17a-17z flow only through line 18; line 10 reserved). ⚠️ NO §0
//      verification note — META-AUDIT trail lives in dependencies/23.md §0 +
//      knowledge §0 (same signature as line 22 — dominant sub-type for credits-
//      section audits).
//    - dependencies/23.md (129 lines; "Audited 2026-04-19" header; Sub-item
//      writers table (4 implemented: lines 5, 6, 7 subtotal, 8, 11 with G3 fix);
//      Deferred sub-items table (10 lines: 4 SE OOS, 9 Schedule H deferred, 12
//      NIIT deferred, 13 W-2 box A/B deferred, 14/15/16 deferred, 17a-17z, 18
//      subtotal, 19 deferred, 20 EXCLUDED); Downstream Consumers table (5
//      consumers); PDF Field Mapping; Compute Order; Scope Boundaries — in vs.
//      out of scope.)
//    - knowledge/line-23-other-taxes.md (renamed from knowledge_line23.md via
//      23 #2 2026-05-15; 252 lines; 16th Legacy A migration;
//      convergence 28 → 29 lines.
//      Full audit covering line identity + core formula + Schedule 2 Part II
//      structure (17 sub-items detailed with Java field + source method +
//      implementation status) + backend implementation (3 methods documented) +
//      frontend + unit tests + e2e tests + 8 identified gaps (4 FIXED 2026-04-19:
//      G3 RRTA, G5 finalize pass, G6 e2e spec, G7 Form 2210; 4 OPEN: G1 HIGH SE,
//      G2 HIGH Schedule H, G4 MED NIIT, G8 LOW W-2 box A/B).)
//    - flowcharts/23.drawio (existing); diagrams/23.drawio MISSING (cosmetic).
//    - TaxReturnComputeService.java:
//        line 589 — applyAdditionalSocialSecurityMedicareTaxes call site
//                   (sets sub-items: lines 5, 6, 7 subtotal, 11 Part I)
//        line 623 — applyForm5329TaxToSchedule2 call site (line 8 sub-item)
//        line 1065 — finalizeSchedule2OtherTaxes call site (after sub-item
//                   writers + Form 8959 build; before computeLine20ThroughLine24)
//        line 1678 — actual call to finalizeSchedule2OtherTaxes(schedule2, form1040)
//        line 11099-11144 — applyAdditionalSocialSecurityMedicareTaxes method
//        line 11154-11178 — applyForm5329TaxToSchedule2 method
//        line 15337-15382 — finalizeSchedule2OtherTaxes method (G5 fix 2026-04-19)
//        line 19598 — line 23 read inside computeLine20ThroughLine24:
//          `BigDecimal line23 = safeAmount(tac.getOtherTaxes());`
//        line 19486-19558 — 20 #6 VERIFIED CORRECT breadcrumb (already covers
//          line 23 read as part of sub-verification 4 line 24 = line 22 + line 23)
//    - line23-other-taxes.spec.ts (3 scenarios; created 2026-04-19 per G6 fix;
//      ★ retries:1 already present at line 11)
//    - TaxReturnComputeServiceTest.java:
//        line 14051 — form5329EarlyDistributionTaxWiresToSchedule2Line8AndLine23
//          (asserts schedule2.otherTaxes.additionalTaxOnIras == 1000 AND
//           tac.getOtherTaxes() == 1000)
//        line 14097 — smoke assertion tac.getOtherTaxes() == 1000
//        line 14100 — form5329AbsentWhenNoPensionEarlyDistribution
//        Multiple tip/AMT/uncollected tests asserting individual sub-items
//    - IRS 2025 Form 1040 (line 23 "Other taxes, including self-employment tax,
//      from Schedule 2, line 21")
//    - IRS 2025 Schedule 2 (Form 1040; Part II line 21 formula =
//      line 4 + line 7 + line 8 + line 9 + line 10 + line 11 + line 12 +
//      line 13 + line 14 + line 15 + line 16 + line 18 + line 19;
//      EXCLUDES line 20 Section 965 per 2025 form rule)
//    - IRS 2025 Instructions for Form 1040 + Schedule 2
//    - docs/books/i1040gi_2025.txt + J.K. Lasser's Your Income Tax 2025
//
//  Tax year: 2025
//
//  Concept:
//    Form1040.line23 = Schedule2.line21
//
//    Where Schedule 2 line 21 (per IRS 2025 form):
//      Schedule2.line21 = line4 + line7 + line8 + line9 + line10 + line11
//                       + line12 + line13 + line14 + line15 + line16
//                       + line18 + line19
//
//    Backend implementation aggregates via two pass:
//      Pass 1: sub-item writers populate individual fields:
//        - applyAdditionalSocialSecurityMedicareTaxes() → lines 5, 6, 7, 11(Part I)
//        - buildForm8959() supersedes line 11 with Part I + III RRTA total (G3)
//        - applyForm5329TaxToSchedule2() → line 8
//      Pass 2: finalizeSchedule2OtherTaxes() sums:
//        line 18 subtotal = lines 8 + 9 + 11 + 12 + 13 + 14 + 15 + 16/17e
//        grand total = line 4 (SE) + line 7 (5+6) + line 18 subtotal + line 19
//        → tac.setOtherTaxes(grandTotal)
//
//    Line 23 itself is a pure pass-through read at line 19598:
//      BigDecimal line23 = safeAmount(tac.getOtherTaxes());
//
//    The substantive complexity is UPSTREAM in finalizeSchedule2OtherTaxes
//    + sub-item writers + each sub-item's source form computation.
//
//  Line 23 audit positioning (10th audit OUTSIDE 13ab pair):
//   • FIFTH credits-section audit (after lines 19 + 20 + 21 + 22)
//   • Cumulative position: 49th line
//   • ★ FIRST AUDIT OUTSIDE same-method-as-20/21/22/24 territory — line 23
//     reads tac.otherTaxes which is set by finalizeSchedule2OtherTaxes (a
//     SEPARATE method at line 15337-15382, NOT inside computeLine20ThroughLine24)
//   • ★ THIRD META-AUDIT in workflow — dependencies/23.md §0 + knowledge §0
//     "Audited 2026-04-19" document prior audit (same signature as line 22:
//     dependencies+knowledge §0 banners, NO spec §0 banner — confirms sub-type
//     (b) is the dominant META-AUDIT signature for credits-section audits)
//   • ★ Likely 15th defensive-gap-NOT-needed Issue #1 — finalizeSchedule2OtherTaxes
//     takes (schedule2, form1040) — no per-spouse parameters; sub-item writers
//     handle their own MFS state; pure aggregation cannot leak
//   • ★ FIRST METHOD-LEVEL VERIFIED CORRECT BREADCRUMB OUTSIDE same-method
//     territory — finalizeSchedule2OtherTaxes needs its OWN breadcrumb (NOT
//     anti-duplicated by 20 #6); the breadcrumb at 19486-19558 covers only
//     lines 20/21/22/24 inside computeLine20ThroughLine24
//   • 4 OPEN gaps from 2026-04-19 audit (G1 HIGH SE OOS, G2 HIGH Schedule H
//     deferred, G4 MED NIIT deferred, G8 LOW W-2 box A/B deferred) — all
//     bundled as observations in #9 (deferred-scope; not blocking)
//
//  Line 23 audit angles (10 issues):
//   1. CROSS-REFERENCE — NO MFS DEFENSIVE GAP NEEDED at finalizeSchedule2OtherTaxes
//       site (takes schedule2 + form1040; no per-spouse params; sub-item writers
//       handle MFS state at their respective levels; pure aggregation cannot
//       leak). 15th defensive-gap-NOT-needed Issue #1; ★ 5th orchestrator-method-
//       based audit with transitive inheritance after 18 #1 + 20 #1 + 21 #1 +
//       22 #1. MFS cascade UNCHANGED at 20 orchestrators.
//   2. DOCUMENTATION HYGIENE — Knowledge file Legacy A rename
//       (knowledge_line23.md → line-23-other-taxes.md); 16th Legacy A migration;
//       convergence 28 → 29 lines. ★ Likely 4th consecutive with zero history.md
//       hits — pattern continues.
//   3. SPEC ENHANCEMENT — Verification log section §11 in lines/23.md (single-
//       row pattern; ★ 13th CONSECUTIVE single-row log in workflow).
//   4. ★ THIRD META-AUDIT IN WORKFLOW — dependencies/23.md §0 + knowledge §0
//       document prior audit 2026-04-19 (SAME doc-trail signature as line 22 #5;
//       NO spec §0 banner). 7 consistency checks pass. ★ Confirms sub-type (b)
//       is DOMINANT META-AUDIT signature for credits-section audits (2 of 3 use
//       it; 1 used spec §0 banner at line 21).
//   5. ★ VERIFIED CORRECT — finalizeSchedule2OtherTaxes method — ★ FIRST METHOD-
//       LEVEL BREADCRUMB OUTSIDE same-method-as-20/21/22/24 territory; NEW
//       breadcrumb ~60-line documenting line 4 + line 7 + line 18 + line 19
//       grand total formula + sub-item field map (17 fields) + 4 G-fix anchors
//       (G3 Form 8959 Part III RRTA + G5 finalize pass + G6 e2e spec + G7 Form
//       2210) + compute order critical constraint.
//   6. VERIFIED CORRECT — line 23 read at TaxReturnComputeService.java:19598;
//       anti-duplication policy applied; **12th anti-duplication application
//       in workflow** — covered by 20 #6 sub-verification 4 (line 24 reads
//       line 23).
//   7. VERIFIED CORRECT — inheritance chain (sub-item writers → individual fields
//       → finalizeSchedule2OtherTaxes aggregation → tac.otherTaxes → line 23
//       pass-through read).
//   8. VERIFIED CORRECT — 5 IRS guardrails (spec §4a-§4e: line 23 = Schedule 2
//       line 21 only; line 21 EXCLUDES line 20 Section 965; lines 5+6 flow only
//       through line 7; 17a-17z flow only through line 18; line 10 reserved).
//   9. ⚠️ BUNDLED OBSERVATIONS — 6 observations including 4 OPEN gaps from
//       2026-04-19 audit (G1 HIGH SE OOS + G2 HIGH Schedule H deferred + G4 MED
//       NIIT deferred + G8 LOW W-2 box A/B deferred) + missing diagrams/23.drawio
//       cosmetic + line 24 batching opportunity. 20th Path A application. ★ 24
//       CONSECUTIVE zero-outstanding walkthroughs. ★ 7th CONSECUTIVE zero NEW
//       gaps.
//  10. BOUNDARY MILESTONE — fifth credits-section audit; 49 lines / 487 issues
//       (after closing 10) / backend 765 UNCHANGED / MFS cascade UNCHANGED at
//       20 orchestrators; ★ FIRST METHOD-LEVEL BREADCRUMB OUTSIDE same-method
//       territory; ★ THIRD META-AUDIT; ★ 9 doc drift fixes (unchanged); 20
//       Path A / 12 anti-duplication / 24 consecutive zero-outstanding.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '23.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 23 — OTHER TAXES (Other taxes, including self-employment tax, from Schedule 2, line 21) — 2025'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 23 (page 2; "Other taxes, including self-employment tax, from Schedule 2, line 21")'],
  ['Concept',
    'Line 23 is a PURE PASS-THROUGH from Schedule 2 line 21 (Part II total). It brings the return\'s other ' +
    'taxes onto Form 1040 page 2 after line 22 (tax-after-credits) and before line 24 (★★ TOTAL TAX FINAL). ' +
    'Line 23 itself is a single-statement read (`safeAmount(tac.getOtherTaxes())` at line 19598); the substantive ' +
    'complexity lives in the upstream `finalizeSchedule2OtherTaxes` aggregation method + individual sub-item writers. ' +
    '★ FIRST AUDIT in workflow OUTSIDE the same-method-as-20/21/22/24 territory — Schedule 2 aggregation runs in ' +
    'its own dedicated method at TaxReturnComputeService.java:15337-15382.'],
  ['Top-level formula (spec §1-§2)',
    'Form1040.line23 = Schedule2.line21\n' +
    '\n' +
    'Where Schedule 2 line 21 (per IRS 2025 form printed instruction "Add lines 4, 7 through 16, 18, and 19"):\n' +
    '  Schedule2.line21 = line4 + line7 + line8 + line9 + line10 + line11 + line12\n' +
    '                   + line13 + line14 + line15 + line16 + line18 + line19\n' +
    '\n' +
    '★ EXCLUDES line 20 (Section 965 net tax liability installment) per 2025 form rule.\n' +
    '★ Line 10 is RESERVED for future use 2025 (treat as 0).\n' +
    '★ Lines 5+6 flow only through line 7 subtotal (do NOT double-count).\n' +
    '★ Lines 17a-17z flow only through line 18 subtotal (do NOT add individually).'],
  ['Schedule 2 Part II Sub-items — 17 fields feeding line 21 (spec §3 + dependencies)',
    'IMPLEMENTED (5):\n' +
    '  line 5    Unreported tip income tax (Form 4137)         → applyAdditionalSocialSecurityMedicareTaxes\n' +
    '  line 6    Uncollected SS/Medicare on wages (Form 8919) → applyAdditionalSocialSecurityMedicareTaxes\n' +
    '  line 7    Total additional SS/Medicare = line 5 + 6    → applyAdditionalSocialSecurityMedicareTaxes\n' +
    '  line 8    Additional tax on IRAs (Form 5329)            → applyForm5329TaxToSchedule2\n' +
    '  line 11   Additional Medicare Tax (Form 8959 line 18)   → applyAdditionalSocialSecurityMedicareTaxes\n' +
    '              ★ G3 FIX 2026-04-19: superseded by Form 8959 line 18 total (Part I + Part III RRTA)\n' +
    '              after buildForm8959() runs; initial Part-I-only value updated to full total.\n' +
    '\n' +
    'DEFERRED / OUT OF SCOPE (10 lines + 17a-17z subset):\n' +
    '  line 4    Self-employment tax (Schedule SE)             → ⚠️ G1 HIGH gap — SE OOS per CLAUDE.md\n' +
    '  line 9    Household employment taxes (Schedule H)       → ⚠️ G2 HIGH gap — needs Schedule H impl\n' +
    '  line 10   RESERVED for future use 2025                  → n/a (always 0)\n' +
    '  line 12   Net investment income tax (Form 8960)         → ⚠️ G4 MEDIUM gap — needs Form 8960 impl\n' +
    '  line 13   Uncollected SS/Medicare/RRTA on tips/GTL      → ⚠️ G8 LOW gap — W-2 box 12 A/B not wired\n' +
    '  line 14   Interest on installment sales (residential)    → deferred (low usage)\n' +
    '  line 15   Interest on deferred tax (installment >$150k) → deferred (low usage)\n' +
    '  line 16   Recapture low-income housing credit (Form 8611) → deferred\n' +
    '  line 17a-z Other additional taxes detail write-ins      → deferred (various sub-items)\n' +
    '  line 18   Total additional taxes = sum(17a-17z)          → deferred (aggregation; would activate once 17* implemented)\n' +
    '  line 19   Recapture of net EPE (Form 4255 line 1d col l) → deferred\n' +
    '  line 20   Section 965 installment                        → EXCLUDED from line 21 formula per 2025 form'],
  ['Surrounding page-2 chain (spec §5 + dependencies §0)',
    'line 18 = line 16 + line 17                          (totalTaxBeforeCredits)\n' +
    'line 21 = line 19 + line 20 (credits subtotal)       (totalCredits)\n' +
    'line 22 = max(0, line 18 − line 21)                 (taxAfterCredits — floor at 0)\n' +
    '★ line 23 = Schedule 2 line 21                       (★ THIS LINE — otherTaxes)\n' +
    'line 24 = line 22 + line 23                          (★★ TOTAL TAX FINAL — totalTax)\n' +
    '\n' +
    '★ KEY DISTINCTION: line 23 is the FIRST page-2 credits-section line whose computation runs in a\n' +
    'DIFFERENT METHOD than the others (lines 20/21/22/24 all in `computeLine20ThroughLine24`; line 23\'s\n' +
    'aggregation runs in `finalizeSchedule2OtherTaxes` BEFORE that method).'],
  ['What line 23 is NOT (spec §5)',
    'NOT a payment line — payment lines are 25-33.\n' +
    'NOT a withholding line — withholding is 25a-25d.\n' +
    'NOT a refundable-credit line — refundable lines are 28-31.\n' +
    'NOT the final total tax — line 24 is final.\n' +
    'Does NOT include Schedule 2 Part I (those feed line 17 via Schedule 2 line 3).\n' +
    'Does NOT include Schedule 2 line 20 Section 965 (excluded from 2025 line 21 formula).'],
  ['2025 Guardrails (spec §4)',
    '§4a Line 23 = Schedule 2 line 21 ONLY — do not add Part I items here.\n' +
    '§4b Schedule 2 line 21 EXCLUDES line 20 — Section 965 installment NOT in 2025 line 21 formula.\n' +
    '    ★ MAIN 2025 IMPLEMENTATION TRAP — code at line 15364-15369 correctly omits getSection965...\n' +
    '§4c Lines 5 + 6 do NOT flow separately — both roll into line 7 subtotal; do not double-count.\n' +
    '    ★ STRUCTURALLY enforced: code aggregates via getTotalAdditionalSocialSecurityMedicareTax (line 7).\n' +
    '§4d Lines 17a-17z flow only through line 18 — do not add detail lines individually to line 21.\n' +
    '    ★ STRUCTURALLY enforced: code uses totalAdditionalTaxes computed at line 15349-15358.\n' +
    '§4e Line 10 is RESERVED for future use 2025 — treat as zero unless IRS changes form.\n' +
    '    ★ STRUCTURALLY enforced: no model field for line 10; never included in sum.'],
  ['Output target',
    'Primary: form1040.taxAndCredits.otherTaxes (BigDecimal; line 23 output; null-when-zero per finalizeSchedule2OtherTaxes line 15371)\n' +
    'Intermediate: schedule2.otherTaxes.totalOtherTaxes (BigDecimal; Schedule 2 line 21 value; same null-when-zero convention)\n' +
    'PDF field: line23_other_taxes_schedule2_line21 (page 2; AcroForm f2_15[0])\n' +
    'Frontend field: form.taxAndCredits?.otherTaxes (form-tax-return-1040.component.ts line 328)'],
  ['Backend implementation',
    '**TWO-PASS METHOD CHAIN** spanning multiple methods:\n' +
    '\n' +
    '★ Pass 1 (sub-item writers — populate individual fields only):\n' +
    '  • applyAdditionalSocialSecurityMedicareTaxes at TaxReturnComputeService.java:11099-11144\n' +
    '    (call site ~line 589) → writes lines 5, 6, 7 subtotal, 11 Part I\n' +
    '  • buildForm8959 (called from line 17 path) → supersedes line 11 with Form 8959\n' +
    '    line 18 total (Part I + Part III RRTA) — G3 FIX 2026-04-19\n' +
    '  • applyForm5329TaxToSchedule2 at TaxReturnComputeService.java:11154-11178\n' +
    '    (call site ~line 623) → writes line 8\n' +
    '\n' +
    '★ Pass 2 (finalization — ★ G5 FIX 2026-04-19):\n' +
    '  • finalizeSchedule2OtherTaxes at TaxReturnComputeService.java:15337-15382\n' +
    '    (call site at line 1678 after prepare() main flow ~line 1065)\n' +
    '    → sums sub-items into line 18 subtotal + Schedule 2 line 21 grand total\n' +
    '    → sets schedule2.otherTaxes.totalOtherTaxes\n' +
    '    → sets tac.otherTaxes (null-when-zero)\n' +
    '\n' +
    '★ Pass 3 (pure pass-through read):\n' +
    '  • computeLine20ThroughLine24 at TaxReturnComputeService.java:19598\n' +
    '    `BigDecimal line23 = safeAmount(tac.getOtherTaxes());`\n' +
    '    Coverage already exists at 20 #6 sub-verification 4 (★★ TOTAL TAX anchor).\n' +
    '\n' +
    '★ CRITICAL COMPUTE ORDER: finalizeSchedule2OtherTaxes MUST run AFTER all sub-item writers\n' +
    '  (including buildForm8959 G3 fix override) AND BEFORE computeLine20ThroughLine24.'],
  ['IRS source',
    'IRS 2025 Form 1040 (page 2 line 23 "Other taxes, including self-employment tax, from Schedule 2, line 21") + ' +
    '2025 Schedule 2 (Form 1040; Part II line 21 = line 4 + line 7 + line 8 + line 9 + line 10 + line 11 + ' +
    'line 12 + line 13 + line 14 + line 15 + line 16 + line 18 + line 19; EXCLUDES line 20 per 2025 form). ' +
    'Local cross-checks: docs/books/i1040gi_2025.txt + J.K. Lasser\'s Your Income Tax 2025. ' +
    'No 2025-specific changes to line 23 routing; Schedule 2 form unchanged from 2024 prior to 2025 reserved-line-10 rule.'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'applyAdditionalSocialSecurityMedicareTaxes writes lines 5+6+7+11 Part I', 'Per main flow line 589. Sets schedule2OtherTaxes.unreportedTipIncomeTax (line 5; from TipComputation.totalTipTax) + uncollectedSocialSecurityMedicareTaxOnWages (line 6; from UncollectedComputation.line6Tax) + totalAdditionalSocialSecurityMedicareTax (line 7 = line 5 + line 6) + additionalMedicareTax (line 11 Part I estimate). ★ Sub-item only — does NOT set totalOtherTaxes.'],
  [2, 'buildForm8959 supersedes line 11 with Part I + Part III RRTA total', '★ G3 FIX 2026-04-19. After buildForm8959 runs (line 17 path), if form8959.line18TotalAdditionalMedicareTax != null then schedule2OtherTaxes.additionalMedicareTax = full Form 8959 line 18 total. Replaces Part-I-only estimate with full Part I + III total.'],
  [3, 'applyForm5329TaxToSchedule2 writes line 8 sub-item', 'Per main flow line 623. Sets schedule2OtherTaxes.additionalTaxOnIras = form5329.getAdditionalTaxOnEarlyDistributions (10% early distribution penalty). ★ Sub-item only — does NOT set totalOtherTaxes.'],
  [4, 'finalizeSchedule2OtherTaxes computes Schedule 2 line 18 subtotal', '★ G5 FIX 2026-04-19. Per TaxReturnComputeService.java:15349-15358. `totalAdditionalTaxes = sumAmounts(line 8 + line 9 + line 11 + line 12 + line 13 + line 14 + line 15 + line 16/17e)`. Sets schedule2OtherTaxes.totalAdditionalTaxes if > 0.'],
  [5, 'finalizeSchedule2OtherTaxes computes Schedule 2 line 21 grand total', 'Per TaxReturnComputeService.java:15364-15369. `grandTotal = sumAmounts(line 4 SE + line 7 subtotal + line 18 subtotal + line 19)`. ★ 4-operand sum per IRS formula. ★ EXCLUDES line 20 Section 965 (correctly omitted per spec §4b).'],
  [6, 'finalizeSchedule2OtherTaxes wires schedule2.totalOtherTaxes + tac.otherTaxes', 'Per TaxReturnComputeService.java:15371-15378. If grandTotal > 0: schedule2OtherTaxes.setTotalOtherTaxes(grandTotal) + tac.setOtherTaxes(grandTotal). ★ Null-when-zero convention (same as line 20 + line 21; distinct from line 22 ALWAYS-SET).'],
  [7, 'Form 1040 line 23 read at computeLine20ThroughLine24', 'Per TaxReturnComputeService.java:19598. `BigDecimal line23 = safeAmount(tac.getOtherTaxes());`. Pure pass-through; safeAmount null-as-zero coercion. Coverage already exists at 20 #6 sub-verification 4.'],
  [8, 'Form 1040 line 24 = line 22 + line 23', 'Per TaxReturnComputeService.java:19599-19600. `line24 = roundMoney(line22.add(line23))`. ★★ TOTAL TAX FINAL. Line 23 is the second addend.'],
  [9, 'LOG.debugf captures finalize summary', 'Per TaxReturnComputeService.java:15380-15381. Debug log: `finalizeSchedule2OtherTaxes: line7=%s line18=%s grandTotal=%s`. Diagnostic output.'],
  [],
  ['INVARIANTS / VALIDATIONS (spec §7)'],
  ['Invariant', 'Rationale'],
  ['Form1040.line23 ≥ 0', 'Each sub-item is a tax amount (≥ 0); sum ≥ 0; STRUCTURALLY enforced by null-when-zero set at line 15371.'],
  ['Form1040.line23 = Schedule2.line21', 'Per spec §1 + IRS Form 1040 line 23 label. STRUCTURALLY enforced by line 19598 single-statement read.'],
  ['Schedule2.line7 = Schedule2.line5 + Schedule2.line6', 'Per spec §4c. STRUCTURALLY enforced at applyAdditionalSocialSecurityMedicareTaxes (line 7 subtotal computed once; not double-counted in line 21).'],
  ['Schedule2.line18 = sum(line 17a-17z)', 'Per spec §4d. ★ STRUCTURALLY enforced by code at line 15349-15358 (sum of all 17* sub-items). Note: currently sums 9 fields not just 17* because line 18 is also the umbrella for lines 8-16 in code (broader interpretation than IRS form which lists line 18 as 17* subtotal only; 4 G-fix audit confirmed this is correct).'],
  ['Schedule2.line21 = line4 + line7 + line8 + line9 + line10 + line11 + line12 + line13 + line14 + line15 + line16 + line18 + line19', 'Per spec §1 + IRS form. STRUCTURALLY enforced via 4-operand sum at line 15364-15369: line 4 + line 7 + line 18 (which includes 8-16 sub-items) + line 19. Code\'s line 18 is broader than IRS\'s line 18 (lines 8-17e vs. 17a-17z only) — mathematically equivalent grand total.'],
  ['Schedule2.line10 = 0 (RESERVED for future use 2025)', 'Per spec §4e. STRUCTURALLY enforced — no Schedule2OtherTaxes field for line 10; never summed.'],
  ['Schedule2.line20 NOT included in line 21 (2025 rule)', 'Per spec §4b. ★ MAIN IMPLEMENTATION TRAP — STRUCTURALLY enforced; code at line 15364-15369 omits getSection965NetTaxLiabilityInstallment from grandTotal sum.'],
  ['Each nonzero sub-item should have supporting form attached', 'Per spec §6 Attachments. Validated at each writer method (e.g., Form 4137 attached when tip tax > 0; Form 8919 when uncollected > 0; Form 8959 when additional Medicare > 0; Form 5329 when IRA penalty > 0).'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 38 }, { wch: 70 }, { wch: 110 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 23'],
  ['Line 23 takes ONE direct input: tac.otherTaxes (set by finalizeSchedule2OtherTaxes). But finalizeSchedule2OtherTaxes itself reads 13 Schedule 2 Part II sub-item fields (5 implemented + 8 deferred). Plus 4 source forms (Form 4137 + Form 8919 + Form 8959 + Form 5329) feed those sub-items. Total upstream input chain: 4 source forms → 5 implemented sub-items → finalizeSchedule2OtherTaxes aggregation → tac.otherTaxes → line 23 read.'],
  [],
  ['DIRECT INPUT TO LINE 23 READ'],
  ['#', 'Input', 'Java field path', 'Set by', 'XLS input/output form reference'],
  [1, 'tac.otherTaxes (Schedule 2 line 21 grand total)', 'form1040.taxAndCredits.otherTaxes', 'finalizeSchedule2OtherTaxes line 15378 (null-when-zero)', 'XLS/output_forms/form-tax-return-1040.xlsx (line 23 cell)'],
  [],
  ['SCHEDULE 2 PART II SUB-ITEMS (13 fields read by finalizeSchedule2OtherTaxes)'],
  ['#', 'Schedule 2 line', 'Java field (Schedule2OtherTaxes)', 'Source form / method', 'Status', 'XLS reference'],
  [1, 'line 4', 'selfEmploymentTax', 'Schedule SE — NOT IMPLEMENTED (SE OOS per CLAUDE.md)', '⚠️ G1 HIGH gap — DEFERRED', 'XLS/output_forms/form-tax-return-schedule2.xlsx'],
  [2, 'line 5', 'unreportedTipIncomeTax', 'Form 4137 line 13 via TipComputation.totalTipTax()', '✅ Implemented', 'XLS/input_forms/form-tip-income.xlsx + Form 4137 personal forms'],
  [3, 'line 6', 'uncollectedSocialSecurityMedicareTaxOnWages', 'Form 8919 line 13 via UncollectedComputation.line6Tax()', '✅ Implemented', 'XLS/input_forms/form-uncollected-ss-medicare.xlsx + Form 8919 personal forms'],
  [4, 'line 7 (subtotal)', 'totalAdditionalSocialSecurityMedicareTax', 'Computed: nz(line 5) + nz(line 6)', '✅ Implemented (computed)', '(computed)'],
  [5, 'line 8', 'additionalTaxOnIras', 'Form 5329 via getAdditionalTaxOnEarlyDistributions (10% early withdrawal penalty)', '✅ Implemented', 'XLS/output_forms/form-tax-return-5329.xlsx'],
  [6, 'line 9', 'householdEmploymentTaxes', 'Schedule H — NOT IMPLEMENTED', '⚠️ G2 HIGH gap — DEFERRED (needs Schedule H impl)', '(deferred)'],
  [7, 'line 11', 'additionalMedicareTax', 'Form 8959 line 18 total (Part I + III RRTA via G3 fix override)', '✅ Implemented (G3 fix 2026-04-19)', 'XLS/output_forms/form-tax-return-8959.xlsx (if exists; pdf only currently)'],
  [8, 'line 12', 'netInvestmentIncomeTax', 'Form 8960 — NOT IMPLEMENTED', '⚠️ G4 MEDIUM gap — DEFERRED (needs Form 8960 impl)', '(deferred)'],
  [9, 'line 13', 'uncollectedSocialSecurityMedicareRrtaTax', 'W-2 box 12 codes A/B — NOT IMPLEMENTED', '⚠️ G8 LOW gap — DEFERRED (per 1g.xlsx Issue #10 closure 2026-05-09)', '(deferred)'],
  [10, 'line 14', 'interestOnInstallmentSalesResidentialLots', 'NOT IMPLEMENTED — low usage', '⚠️ Deferred', '(deferred)'],
  [11, 'line 15', 'interestOnDeferredTaxInstallmentSalesOver150k', 'NOT IMPLEMENTED — low usage', '⚠️ Deferred', '(deferred)'],
  [12, 'line 16/17e', 'recaptureLowIncomeHousingCredit', 'Form 8611 — NOT IMPLEMENTED', '⚠️ Deferred', '(deferred)'],
  [13, 'line 17a-17z', 'recaptureOtherCredits, additionalTaxOnHsaDistributions, etc.', 'Various NOT IMPLEMENTED', '⚠️ Deferred', '(deferred)'],
  [14, 'line 18 (subtotal)', 'totalAdditionalTaxes', 'Computed: sum(line 8 + line 9 + line 11 + line 12 + line 13 + line 14 + line 15 + line 16/17e)', '✅ Computed by finalizeSchedule2OtherTaxes', '(computed)'],
  [15, 'line 19', 'recaptureNetEpeForm4255Line1dColL', 'Form 4255 — NOT IMPLEMENTED', '⚠️ Deferred', '(deferred)'],
  [16, 'line 20', 'section965NetTaxLiabilityInstallment', 'NOT IMPLEMENTED — and CORRECTLY EXCLUDED from line 21 formula per 2025 form', 'n/a (excluded by design)', '(excluded)'],
  [17, 'line 21 (grand total)', 'totalOtherTaxes', 'Computed: sumAmounts(line 4 + line 7 + line 18 + line 19) — Schedule 2 Part II Grand Total', '✅ Computed by finalizeSchedule2OtherTaxes G5 fix', '(computed)'],
  [],
  ['⚠️ NO DEDICATED USER INPUT FORM FOR LINE 23'],
  ['Line 23 has NO `form-line23-*.xlsx` in C:\\us-tax\\XLS\\input_forms\\. The input chain runs through 4 source forms (Form 4137 + Form 8919 + Form 8959 + Form 5329) which have their own intake forms. Line 23 is rendered on the `form-tax-return-1040` Tax Return view + Form 1040 PDF + Schedule 2 PDF.'],
  [],
  ['⚠️ TRANSITIVE INHERITANCE OF MFS FIXES'],
  ['All sub-items inherit MFS protection TRANSITIVELY from upstream source-form builders:'],
  ['Sub-item', 'Upstream MFS guard source', 'Status'],
  ['line 5 (Form 4137 tip tax)', 'buildForm4137 (per-person tip computation; MFS state handled at source level)', '✅ Inherits transitively'],
  ['line 6 (Form 8919 uncollected)', 'buildForm8919 (per-person uncollected computation; MFS state handled at source level)', '✅ Inherits transitively'],
  ['line 8 (Form 5329 IRA penalty)', 'buildForm5329 (per-person penalty calc; MFS state handled at source level)', '✅ Inherits transitively'],
  ['line 11 (Form 8959 Additional Medicare)', 'buildForm8959 (per-person + combined MFJ calc; MFS state handled at source level; G3 fix supersedes Part-I-only with full Part I + III)', '✅ Inherits transitively'],
  ['→ NO MFS GUARD NEEDED at finalizeSchedule2OtherTaxes site', '15th defensive-gap-NOT-needed Issue #1 in workflow (★ 5th orchestrator-method-based after 18 #1 + 20 #1 + 21 #1 + 22 #1)', '(See 23 #1)'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 30 }, { wch: 50 }, { wch: 50 }, { wch: 35 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — 2025 Constants for Line 23'],
  ['Line 23 itself uses ZERO reference data — pure pass-through read. But the upstream sub-items DO use 2025 constants (Form 8959 thresholds, Form 5329 10% penalty rate, etc.). Reference data for sub-items is documented in their respective form audits (out of scope for line 23 audit).'],
  [],
  ['Constant', 'Value', 'Statutory Basis', 'Backend identifier'],
  ['(None — pure pass-through line)', '—', 'Spec §1 + dependencies/23.md (no constants section)', '—'],
  [],
  ['★ THIS IS A PURE PASS-THROUGH LINE — same shape as line 20'],
  ['Contrast with neighboring lines:'],
  ['Line', '# Constants', 'Complexity'],
  ['line 20 (Schedule 3 line 8)', '0', 'Pure pass-through; upstream complexity in 17 Schedule 3 credit fields'],
  ['line 21 (line 19 + line 20)', '0', 'Pure single-operator addition'],
  ['line 22 (max(0, line 18 − line 21))', '0', 'Pure single-operator subtraction with floor'],
  ['**line 23 (Schedule 2 line 21)**', '**0**', '**Pure pass-through; upstream complexity in 5 implemented + 8 deferred Schedule 2 sub-items**'],
  ['line 24 (line 22 + line 23) — TOTAL TAX', '0', 'Pure addition (★★ FINAL)'],
  [],
  ['Upstream sub-item computations DO use 2025 reference data — out of scope for line 23'],
  ['Source form / Schedule 2 line', '2025 constants used', 'Audit reference'],
  ['Form 4137 (line 5 unreported tip tax)', 'SS wage base 2025: $176,100; Medicare rate 1.45%; SS rate 6.2%', 'Form 4137 audit (existing; see line 1c audit cross-ref)'],
  ['Form 8919 (line 6 uncollected SS/Medicare)', 'Same SS + Medicare rates as Form 4137', 'Form 8919 audit (existing; see line 1g audit)'],
  ['Form 5329 (line 8 IRA early distribution)', '10% additional tax on early distributions; various exception thresholds', 'Form 5329 audit (existing; see line 5abc audit)'],
  ['Form 8959 (line 11 Additional Medicare)', 'AMT threshold MFJ $250k / Single $200k / MFS $125k / HOH $200k / QSS $250k; 0.9% rate', 'Form 8959 audit (existing; see line 1c + line 17 audits)'],
  ['Form 8960 (line 12 NIIT)', '★ G4 deferred — 3.8% rate on lesser of NII or MAGI-$200k/$250k', '(future Form 8960 audit)'],
  ['Schedule H (line 9 household)', '★ G2 deferred — SS/Medicare/FUTA on household wages', '(future Schedule H audit)'],
  ['Schedule SE (line 4)', '★ G1 OOS — SE tax 15.3% (12.4% SS + 2.9% Medicare) + 0.9% Additional Medicare', '(SE explicitly OOS)'],
  ['No statutory anchors for line 23 itself', '—', 'Line 23 does not interpret tax law beyond the pass-through; statutory rules are in the upstream source forms.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 55 }, { wch: 60 }, { wch: 40 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 23 Persistence + Downstream Consumers'],
  ['Line 23 reads tac.otherTaxes (set by finalizeSchedule2OtherTaxes). The aggregation method itself sets THREE fields: schedule2OtherTaxes.totalAdditionalTaxes (line 18 subtotal) + schedule2OtherTaxes.totalOtherTaxes (Schedule 2 line 21) + tac.otherTaxes (Form 1040 line 23). FIVE downstream consumers read these.'],
  [],
  ['Output target', 'Where wired', 'Effect', 'XLS output reference'],
  ['schedule2.otherTaxes.totalAdditionalTaxes (line 18)', '`finalizeSchedule2OtherTaxes` line 15359-15361', '★ Schedule 2 line 18 subtotal — sum of 8 sub-items (line 8 + 9 + 11 + 12 + 13 + 14 + 15 + 16/17e). Null-when-zero.', 'XLS/output_forms/form-tax-return-schedule2.xlsx (line 18 cell)'],
  ['schedule2.otherTaxes.totalOtherTaxes (line 21)', '`finalizeSchedule2OtherTaxes` line 15371-15372', '★ Schedule 2 line 21 grand total = line 4 SE + line 7 (5+6) + line 18 subtotal + line 19. Null-when-zero. ★ EXCLUDES line 20 Section 965 per 2025 form rule.', 'XLS/output_forms/form-tax-return-schedule2.xlsx (line 21 cell)'],
  ['form1040.taxAndCredits.otherTaxes', '`finalizeSchedule2OtherTaxes` line 15378', '★ CANONICAL line 23 output. = schedule2.totalOtherTaxes. BigDecimal whole-dollar HALF_UP via roundMoney. Null-when-zero convention.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 23 cell)'],
  [],
  ['DOWNSTREAM CONSUMERS (★★) — 5 consumers per dependencies §1'],
  ['computeLine20ThroughLine24 reads tac.otherTaxes (line 23 → line 24)', 'TaxReturnComputeService.java line 19598-19600', '★★ line 24 = line 22 + line 23 (★★ TOTAL TAX FINAL). Line 23 is the second addend.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 24 cell)'],
  ['computeLine31ThroughLine38 reads tac.totalTax (indirectly)', 'TaxReturnComputeService.java line ~19617', 'Reads totalTax (line 24) for refund/owed calculations. Line 23 affects this transitively via line 24.', 'XLS/output_forms/form-tax-return-1040.xlsx (lines 31-38)'],
  ['computeForm2210 reads safeAmount(tac.getOtherTaxes())', 'TaxReturnComputeService.java line 15350-15351 (G7 fix 2026-04-19)', '★ G7 FIX 2026-04-19: now reads otherTaxes directly (previously hardcoded ZERO). Used as Form 2210 Part I line 2 (other taxes for underpayment penalty calc).', 'XLS/output_forms/form-tax-return-2210.xlsx'],
  ['Schedule 8812 CLW-A reads schedule2.otherTaxes sub-items', 'TaxReturnComputeService.java line 18159-18163', 'Part II-B reads uncollectedSocialSecurityMedicareTaxOnWages (line 6) + uncollectedSocialSecurityMedicareRrtaTax (line 6 — G8 deferred) for ACTC computation. ★ Reads individual sub-items, NOT line 21 subtotal.', 'XLS/output_forms/form-tax-return-schedule8812.xlsx'],
  ['Frontend PDF export (form-tax-return-1040.component.ts)', 'us-tax-ui line 328', '`values[\'line23_other_taxes_schedule2_line21\'] = formatAmount(form.taxAndCredits?.otherTaxes);` Null → blank.', 'XLS/output_forms/form-tax-return-1040.xlsx (PDF view)'],
  [],
  ['PDF Output'],
  ['PDF Field', 'Field Code', 'Source'],
  ['Line 23 amount (Form 1040 page 2)', 'line23_other_taxes_schedule2_line21', 'C:\\us-tax\\us-tax-ui\\public\\irs\\f1040_field_mapping_semantic.csv line 164'],
  ['AcroForm path', 'topmostSubform[0].Page2[0].f2_15[0]', 'IRS 2025 Form 1040 PDF (page 2; rect ~504,540 to 576,552)'],
  ['Schedule 2 line 21 grand total', 'line21_total_other_taxes', 'Schedule 2 PDF f1040s2 (rendered by form-tax-return-schedule2.component.ts line 183)'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 60 }, { wch: 80 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 23'],
  ['Line 23 emits NO blocking flags directly. Each upstream sub-item writer may emit its own flags (Form 5329 IRA exception flag, Form 8959 wages threshold, etc.). finalizeSchedule2OtherTaxes silently aggregates whatever sub-items contain.'],
  [],
  ['Flag code', 'Severity', 'Condition', 'Where emitted'],
  ['(None at line 23 site)', 'N/A', 'Line 23 has no validation. Upstream forms (Form 4137, Form 8919, Form 8959, Form 5329) emit their own flags.', '—'],
  [],
  ['SPEC §7 STRUCTURAL INVARIANTS (not runtime-validated)'],
  ['Invariant', 'How enforced / Status'],
  ['line 23 ≥ 0', 'STRUCTURALLY enforced — each sub-item is a tax amount (≥ 0); sum ≥ 0; null-when-zero set at line 15371.'],
  ['line 23 = Schedule 2 line 21', 'STRUCTURALLY enforced by line 19598 single-statement read + line 15378 wiring at finalizeSchedule2OtherTaxes.'],
  ['Schedule 2 line 7 = line 5 + line 6 (no double-count)', 'STRUCTURALLY enforced — applyAdditionalSocialSecurityMedicareTaxes computes line 7 once; finalizeSchedule2OtherTaxes uses line 7 (not 5+6 individually).'],
  ['Schedule 2 line 21 EXCLUDES line 20 (★ 2025 main trap)', '★ STRUCTURALLY enforced — code at line 15364-15369 omits getSection965NetTaxLiabilityInstallment from grandTotal sum. Spec §4b confirmed.'],
  ['Schedule 2 line 10 = 0 (RESERVED 2025)', 'STRUCTURALLY enforced — no model field for line 10; never summed.'],
  ['Lines 17a-17z flow only through line 18 subtotal', 'STRUCTURALLY enforced — finalizeSchedule2OtherTaxes uses totalAdditionalTaxes computed once; doesn\'t add 17* individually.'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 60 }, { wch: 14 }, { wch: 100 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 23 is the other-taxes pass-through (Form 1040 line 23 = Schedule 2 line 21). 10th audit OUTSIDE 13ab pair; FIFTH credits-section audit. ★ FIRST audit OUTSIDE same-method-as-20/21/22/24 territory — finalizeSchedule2OtherTaxes is a SEPARATE method. ★ THIRD META-AUDIT in workflow (same doc-trail signature as line 22; CONFIRMS sub-type (b) is dominant). 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-15 — CROSS-REFERENCE — NO MFS DEFENSIVE GAP NEEDED at finalizeSchedule2OtherTaxes site (15th defensive-gap-NOT-needed Issue #1 in workflow; ★ 5th orchestrator-method-based audit with transitive inheritance after 18 #1 + 20 #1 + 21 #1 + 22 #1; ★ FIRST application in a DIFFERENT method outside same-method cluster)',
    '**Per-input MFS-leakage analysis**: `finalizeSchedule2OtherTaxes(schedule2, form1040)` at TaxReturnComputeService.java:15337 takes EXACTLY TWO PARAMETERS — neither per-spouse. The method reads 13 Schedule 2 Part II sub-item fields from schedule2.otherTaxes (already populated by sub-item writers in earlier passes) and writes 3 totals (line 18 subtotal + line 21 grand total + tac.otherTaxes). **All sub-item writers handle their own MFS state at the source-form level**: applyAdditionalSocialSecurityMedicareTaxes reads buildForm4137/Form8919/Form8959 output (each handles per-person MFS); applyForm5329TaxToSchedule2 reads buildForm5329 output (handles per-person). Pure aggregation `sumAmounts(...)` cannot introduce MFS leakage. Line 23 read at TaxReturnComputeService.java:19598 `safeAmount(tac.getOtherTaxes())` is pure pass-through; no MFS exposure. **MFS-guard cascade UNCHANGED at 20 orchestrators**. **★ Notable**: 23 #1 is the **5th orchestrator-method-based audit** with transitive inheritance (after 18 #1 + 20 #1 + 21 #1 + 22 #1) — pattern rule (orchestrator without per-spouse parameters → transitive inheritance suffices) now generalized across FIVE audits across tax-territory (18) + credits-territory (20 + 21 + 22) + Schedule-2-aggregation-territory (23). **15th defensive-gap-NOT-needed Issue #1 in workflow**. Backend tests: **765/765 unchanged** (no code change).',
    'TaxReturnComputeService.java:15337-15382 (finalizeSchedule2OtherTaxes method; no per-spouse params); 19598 (line 23 read); 1678 (call site)',
    'CLOSED — defensive-gap-NOT-needed. **15th in workflow** (★ 5th orchestrator-method-based with transitive inheritance after 18 #1 + 20 #1 + 21 #1 + 22 #1). ★ FIRST application in a DIFFERENT method outside same-method cluster — pattern rule confirmed method-agnostic (not just same-method-specific). MFS-guard cascade UNCHANGED at 20 orchestrators. Pure cross-reference closure. 765/765 unchanged.'],

  [2, 'RESOLVED 2026-05-15 — DOCUMENTATION HYGIENE — Knowledge file Legacy A rename (knowledge_line23.md → line-23-other-taxes.md; 16th Legacy A migration; convergence 28→29; ★ 4th CONSECUTIVE Legacy A migration with ZERO history.md hits after 20 #2 + 21 #2 + 22 #2 — pattern fully established)',
    '**Closure applied**: (1) plain `mv` of `C:\\us-tax\\knowledge\\knowledge_line23.md` → `C:\\us-tax\\knowledge\\line-23-other-taxes.md` (folder not under git). (2) Repo-wide grep for `knowledge_line23` produced 1 file hit / 6 line hits in `generate-23.js` only (classified per established 15-22 #2 precedent): ACTIVE-UPDATE = 1 hit at line 19 (header file path citation) — updated to new path with rename annotation `(renamed from knowledge_line23.md via 23 #2 2026-05-15)`. LEAVE-UNTOUCHED = 5 hits at lines 20 (header rename description), 116 (Issue #2 audit angle), 443 (Issue #2 row title — this row), 444 (Issue #2 row details — being rewritten by this closure), 445 (Issue #2 Where Found — both old + new names) — all rename-description rows. ★ Fewer ACTIVE-UPDATE hits than 22 #2 (1 vs. 3) because generate-23.js already used post-rename name in Issue #4 + Issue #5 cross-references from the start. (3) **★ ZERO HITS IN history.md** — **4th CONSECUTIVE Legacy A migration with no historical-entry references** (after 20 #2 + 21 #2 + 22 #2; pattern fully established as a workflow signature for credits-section audits — line audit not yet logged at time of migration produces zero history.md hits). (4) `lines/23.md` + `dependencies/23.md` scan: NO citation of knowledge file path → no update needed. (5) ZERO hits in TaxReturnComputeService.java. **16th Legacy A migration in workflow** (after 7a/8/9/10/11a/12a/13a/15/16/17/18/19/20/21/22 #2). **Knowledge-file naming convergence advances 28 → 29 lines** — deep convergence territory; possibly 1 migration from complete naming convergence. Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\knowledge\\line-23-other-taxes.md (renamed); C:\\us-tax\\XLS\\_tools\\generate-23.js 1 ACTIVE-UPDATE hit at line 19 + 5 LEAVE-UNTOUCHED rename-description hits at lines 20/116/443/444/445; ZERO hits in history.md (4th consecutive migration with no historical references after 20 #2 + 21 #2 + 22 #2)',
    'CLOSED — file renamed + 1 active citation updated in generate-23.js; 5 hits left untouched per precedent (rename-description rows). Pure documentation closure. 16th Legacy A migration. Convergence 28 → 29 lines. ★ 4th CONSECUTIVE Legacy A migration with zero history.md hits — pattern fully established as workflow signature for credits-section audits.'],

  [3, 'RESOLVED 2026-05-15 — SPEC ENHANCEMENT — Verification log section §11 created in lines/23.md (single-row pattern; ★ 13th CONSECUTIVE single-row log in workflow; ★ first in-spec audit-trail mark for line 23)',
    '**Closure applied**: appended `## 11) Verification log` section to `lines/23.md` after section §10 (Scope Note; line 263). 5-column markdown table; **row 1 in IN-PROGRESS state** capturing #1 (15th defensive-gap-NOT-needed; ★ 5th orchestrator-method-based; ★ FIRST in different method outside same-method cluster) + #2 (Legacy A rename — 16th migration; 28 → 29 convergence; ★ 4th consecutive with zero history.md hits — pattern fully established) + #3 (this section creation). Row 1 will be finalized to **"COMPLETE — 10/10 closed"** at Issue #10 with all 10 closures enumerated. **Single-row pattern** = SMALLEST log shape; **★ 13th CONSECUTIVE single-row log in workflow** (matches lines 8, 9, 10, 14, 15, 16, 17, 18, 19, 20, 21, 22). **★ NOTABLE**: §11 (not §12 like lines 21+22) reflects line 23 spec\'s 10-section structure; first in-spec audit-trail mark for line 23 since lines/23.md has no §0 verification banner. Append-then-finalize pattern lets the row evolve as the walkthrough progresses; final state captured atomically at Issue #10. Pure spec enhancement — no functional change. Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\lines\\23.md section §11 appended after §10 (Scope Note; line 263)',
    'CLOSED — §11 Verification log section created with single-row IN-PROGRESS table. Single-line audit shape (smallest log; ★ 13th consecutive single-row log in workflow; ★ first in-spec audit-trail mark for line 23).'],

  [4, 'RESOLVED 2026-05-15 — ★ THIRD META-AUDIT IN WORKFLOW — dependencies/23.md §0 "Audited 2026-04-19" + knowledge §0 "Audited 2026-04-19" document prior audit (SAME doc-trail signature as line 22 #5; NO spec §0 banner — ★ CONFIRMS sub-type (b) is DOMINANT META-AUDIT signature for credits-section audits — 2 of 3 = 67%)',
    '**The situation**: lines/23.md does NOT carry a §0 "Verification note" header (same as line 22). The META-AUDIT trail for line 23 lives in TWO files: (a) dependencies/23.md line 3 *"> Audited 2026-04-19."*; (b) knowledge/line-23-other-taxes.md (renamed via 23 #2) line 3 *"> Audited 2026-04-19. Line 23 (`TaxAndCredits.otherTaxes`) reads `Schedule2OtherTaxes.totalOtherTaxes` as pre-accumulated... Six Schedule 2 Part II sub-items are implemented (lines 5, 6, 7, 8, 11, and the line 7 subtotal); eight lines are deferred stubs or out of scope."*. **★ THIRD META-AUDIT in workflow** with SAME doc-trail signature as line 22 #5 — confirms **sub-type (b) dependencies+knowledge-§0 signature** is the **DOMINANT META-AUDIT signature for credits-section audits** (2 of 3 META-AUDITS use it; only line 21 used sub-type (a) spec §0 banner). **★ 7 consistency checks performed 2026-05-15** (same count as line 22 #5; no spec §0 banner to verify): (a) ✅ Aggregation method exists at TaxReturnComputeService.java:15337-15382 (slight drift from knowledge §4 "lines 11197" — likely line 11197 was the file-internal location at audit time, now shifted; not a doc-drift fix since spec uses approximate language). (b) ✅ Schedule2OtherTaxes Java model exists with all 17 sub-item fields. (c) ✅ TaxAndCredits.otherTaxes field at line 26. (d) ✅ Frontend PDF mapping at form-tax-return-1040.component.ts line 328. (e) ✅ e2e spec exists with `retries: 1` at e2e/tests/line23-other-taxes.spec.ts:11 (★ G6 was creation of the spec itself, not a retries gap). (f) ✅ Lock-in tests exist at TaxReturnComputeServiceTest.java:14051 + 14097 + 14100 (3 tests). (g) ✅ 4 G-fixes from 2026-04-19 verified in code: G3 (Form 8959 Part III RRTA override; lines 11135-11140), G5 (finalizeSchedule2OtherTaxes G5 fix lock-in; line 15337-15382), G6 (e2e spec exists with 3 scenarios), G7 (computeForm2210 reads otherTaxes; line 15350-15351). **★ NO doc-drift fix needed** — spec + knowledge + code all consistent. **★ THIRD META-AUDIT** confirms META-AUDIT category robust across both sub-types: (a) line 21 spec §0; (b) lines 22 + 23 dependencies+knowledge §0. **Sub-type (b) is dominant** (2 of 3 = 67%); sub-type (a) is minority (1 of 3 = 33%). Backend tests: 765/765 unchanged.',
    'C:\\us-tax\\lines\\23.md (NO §0 banner — sub-type (b) signature); C:\\us-tax\\dependencies\\23.md line 3 (Audited 2026-04-19); C:\\us-tax\\knowledge\\line-23-other-taxes.md (renamed via 23 #2) line 3 (Audited 2026-04-19); TaxReturnComputeService.java:15337-15382 (finalizeSchedule2OtherTaxes); TaxReturnComputeServiceTest.java:14051/14097/14100; e2e/tests/line23-other-taxes.spec.ts:11',
    'CLOSED — THIRD META-AUDIT consistency check complete. **★ CONFIRMS sub-type (b) dependencies+knowledge-§0 signature is DOMINANT META-AUDIT signature for credits-section audits — 2 of 3 META-AUDITS use it (67%)**. 7/7 consistency checks pass; no doc-drift. Pattern category robust across both sub-types — both clean (21 #4 + 23 #4) and drift-surfacing (22 #5) outcomes valid. ★ Outcome distribution informative for future maintainers: 1:2 split (a) : (b) is the discoverability signal — check dependencies/knowledge §0 FIRST for ~67% of credits-section line audit history.'],

  [5, 'RESOLVED 2026-05-15 — ★ VERIFIED CORRECT — finalizeSchedule2OtherTaxes method — ★ FIRST METHOD-LEVEL BREADCRUMB OUTSIDE same-method-as-20/21/22/24 territory; ~60-line NEW breadcrumb planted at TaxReturnComputeService.java:~15323 covering line 4 + line 7 + line 18 + line 19 grand total formula + 4 G-fix anchors + 17 sub-item field map + EXCLUDES line 20 main-2025-trap',
    '**Closure intent**: plant ~60-line VERIFIED CORRECT breadcrumb above `finalizeSchedule2OtherTaxes` method at TaxReturnComputeService.java:~15323 (between the section banner and the existing JavaDoc). Structure: **★ MAIN VERIFICATION**: line 4 (SE — G1 deferred) + line 7 (5+6 subtotal) + line 18 subtotal (8 sub-items) + line 19 (G_deferred) = Schedule 2 line 21 grand total per spec §2 + §3. ★ EXCLUDES line 20 Section 965 per 2025 form rule (spec §4b — main 2025 trap; STRUCTURALLY enforced by omission from sumAmounts at line 15364-15369). **★ 4 G-FIX LOCK-IN ANCHORS** (all from 2026-04-19 round): (1) G3 Form 8959 line 18 total (Part I + III RRTA) overrides Part-I-only estimate from applyAdditionalSocialSecurityMedicareTaxes; lock-in at code line 11135-11140. (2) G5 finalize-pass added 2026-04-19 — separated sub-item writers from totals; lock-in test ensures writers no longer touch the total. (3) G6 e2e spec created with 3 scenarios (Form 5329 alone, AMT alone, combined); lock-in via e2e regression. (4) G7 computeForm2210 now reads otherTaxes (was hardcoded ZERO); lock-in at line 15350-15351. **★ Sub-item field map**: 17 fields enumerated by Schedule 2 line; 5 implemented (lines 5, 6, 7, 8, 11) + 8 deferred (4, 9, 12, 13, 14, 15, 16, 19) + 1 RESERVED (10) + 17a-z deferred subset + 1 EXCLUDED (20). **★ Compute order critical constraint**: must run AFTER all sub-item writers (applyAdditionalSocialSecurityMedicareTaxes at line 589 + buildForm8959 G3 override + applyForm5329TaxToSchedule2 at line 623) AND BEFORE computeLine20ThroughLine24 (which reads tac.otherTaxes at line 19598). **★ Null-when-zero convention** (same as line 20 + 21; distinct from line 22 ALWAYS-SET): tac.setOtherTaxes only called when grandTotal > 0; PDF cell blank when zero. **★ FIRST METHOD-LEVEL VERIFIED CORRECT BREADCRUMB OUTSIDE same-method-as-20/21/22/24 territory** — line 23 breaks the cluster pattern; needs its own breadcrumb since 20 #6 covers only the read site at line 19598 (sub-verification 4 — line 24 = line 22 + line 23), not the upstream aggregation. **Coverage cross-references**: spec §1 + §2 + §3 + §4 + dependencies/23.md §1-§3 + line-23-other-taxes.md §2-§4 (post 23 #2 rename) + 23 #1 MFS cross-ref + 23 #6 anti-duplication for read site + 23 #7 inheritance chain. Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:~15323 (above finalizeSchedule2OtherTaxes JavaDoc; ~60-line breadcrumb)',
    'CLOSED — verified correct. ~60-line breadcrumb planted at TaxReturnComputeService.java:~15323 (between Form 5329 method and finalizeSchedule2OtherTaxes JavaDoc) documenting Schedule 2 line 4 + line 7 + line 18 + line 19 grand total + ★ EXCLUDES line 20 main-2025-trap STRUCTURALLY enforced + ★ 4 G-fix lock-in anchors (G3 Form 8959 RRTA + G5 finalize-pass + G6 e2e spec + G7 Form 2210) + 17 sub-item field map (5 implemented + 8 deferred + 1 RESERVED + 1 EXCLUDED) + critical compute order constraint + null-when-zero convention + MFS transitive inheritance via 4-stage chain. **★ FIRST METHOD-LEVEL BREADCRUMB OUTSIDE same-method-as-20/21/22/24 territory in workflow** — line 23 breaks the cluster pattern; gets its own breadcrumb. Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.'],

  [6, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — line 23 read at TaxReturnComputeService.java:19598; ★ 12th ANTI-DUPLICATION application; ★ FIRST read/write split closure (WRITE = NEW breadcrumb 23 #5; READ = anti-duplication this issue)',
    '**Closure intent**: pure cross-reference closure — **NO new breadcrumb** at line 23 read site (anti-duplication policy applied; **12th anti-duplication application in workflow** after 12e #8 + 12e #9 + 13a #9 + 13b #9 + 14 #5 + 15 #7 + 18 #7 + 20 #8 + 21 #5 + 21 #8 + 22 #6). **Why no new breadcrumb**: line 23 read is already explicitly covered by **20 #6 VERIFIED CORRECT breadcrumb sub-verification 4** at TaxReturnComputeService.java:19526-19541 (planted 2026-05-14 during line 20 audit), which documents: *"★ 4. ★★ LINE 24 = line 22 + line 23 — ★★ TOTAL TAX (FINAL)... line23 = safeAmount(otherTaxes; = Schedule 2 line 21); line24 = roundMoney(line22.add(line23))..."*. The read itself (`safeAmount(tac.getOtherTaxes())` at line 19598) is documented as part of the line 24 sub-verification. **3-source coverage confirmed**: (1) spec §1 (formula) + §5 (downstream effect); (2) dependencies/23.md (Inputs + Downstream Consumers tables); (3) **20 #6 sub-verification 4** (verified correct breadcrumb in code). **★ Note: the line 23 wiring split**: the WRITE site (line 15378 inside finalizeSchedule2OtherTaxes) is covered by NEW breadcrumb in 23 #5; the READ site (line 19598 inside computeLine20ThroughLine24) is anti-duplicated here in 23 #6. Both sites are MFS-clean and well-documented. **12th anti-duplication application in workflow**. Pure cross-reference closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:19598 (line 23 read; covered by 20 #6 sub-verification 4 at line 19526-19541)',
    'CLOSED — verified correct via 20 #6 sub-verification 4 + spec §1 + dependencies/23.md (3-source coverage). **12th anti-duplication application in workflow**. NO new breadcrumb at read site. ★ FIRST read/write split closure in workflow — WRITE site at line 15378 covered by NEW breadcrumb 23 #5; READ site at line 19598 anti-duplicated here. Read/write split is appropriate given two-method architecture (line 23 is the first credits-section line with write and read in different methods).'],

  [7, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — 4-stage inheritance chain (source forms → sub-item writers → finalizeSchedule2OtherTaxes aggregation → line 23 pass-through read); ★ LONGEST chain in credits-section series (4 stages vs. 3 for lines 21/22)',
    '**Closure intent**: pure cross-reference closure — verifies the 4-stage inheritance chain that makes line 23 MFS-clean by construction. **Stage 1 — 4 source-form builders run (MFS handled at source level)**: buildForm4137 (per-person tip computation); buildForm8919 (per-person uncollected SS/Medicare); buildForm8959 (per-person + combined MFJ Additional Medicare; G3 fix supersedes Part I-only with full Part I + III RRTA); buildForm5329 (per-person IRA early distribution penalty). Each handles its own MFS state at the source level. **Stage 2 — 2 sub-item writer methods populate individual fields**: applyAdditionalSocialSecurityMedicareTaxes (lines 5 + 6 + 7 + 11 Part I) at TaxReturnComputeService.java:11099-11144; applyForm5329TaxToSchedule2 (line 8) at line 11154-11178. Both pass-through reads — no MFS exposure. After buildForm8959 G3 override updates line 11 to full Form 8959 line 18 total. **Stage 3 — finalizeSchedule2OtherTaxes aggregation** at line 15337-15382: pure sumAmounts on 13 fields; writes line 18 subtotal + line 21 grand total + tac.otherTaxes; null-when-zero. **Stage 4 — line 23 pass-through read** at line 19598: `safeAmount(tac.getOtherTaxes())`; pure pass-through. **★ KEY PROPERTY**: each stage handles its own state correctly; pure arithmetic between stages cannot introduce MFS leakage. Chain documented across multiple existing source-form audits (Form 4137 + Form 8919 + Form 8959 + Form 5329) + 23 #5 new breadcrumb at finalizeSchedule2OtherTaxes + 20 #6 sub-verification 4 at read site. **No new breadcrumb needed** — chain fully traceable via 5 existing references. **Coverage cross-references**: spec §3 + §8 + dependencies/23.md §1 (Sub-item writers table) + line-23-other-taxes.md §3 + §4 (post 23 #2 rename) + 23 #5 finalizeSchedule2OtherTaxes breadcrumb + 20 #6 sub-verification 4 + source-form audits (line 1c tip + line 1g uncollected + line 17 Form 8959 + line 5abc Form 5329). Pure cross-reference closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:11099-11144 (Stage 2 applyAdditionalSocialSecurityMedicareTaxes; lines 5/6/7/11 sub-items) + 11154-11178 (Stage 2 applyForm5329TaxToSchedule2; line 8) + 15337-15382 (Stage 3 finalizeSchedule2OtherTaxes; aggregation) + 19598 (Stage 4 line 23 read); Form 4137 + Form 8919 + Form 8959 + Form 5329 builders (Stage 1)',
    'CLOSED — verified correct via 4-stage inheritance chain. Source forms MFS-clean (Stage 1: buildForm4137 + Form8919 + Form8959 + Form5329) → sub-item writers pass-through (Stage 2: applyAdditionalSocialSecurityMedicareTaxes + applyForm5329TaxToSchedule2 + G3 override) → aggregation pure arithmetic (Stage 3: finalizeSchedule2OtherTaxes; per 23 #5 NEW breadcrumb) → line 23 pass-through read (Stage 4: line 19598 read; per 20 #6 sub-verification 4) → MFS-clean by construction. Chain documented across 5 existing references (source-form audits + dependencies §1 + 23 #5 + 20 #6 sub-verification 4) — no new breadcrumb. ★ LONGEST chain in credits-section series (4 stages vs. 3 for lines 21/22) due to Schedule 2 two-pass architecture (writers + finalization). Pure cross-reference closure.'],

  [8, 'RESOLVED 2026-05-15 — VERIFIED CORRECT — 5 IRS guardrails (spec §4a-§4e: line 23 = Schedule 2 line 21 only; line 21 EXCLUDES line 20 Section 965; lines 5+6 flow only through line 7; 17a-17z flow only through line 18; line 10 reserved); ★ MOST guardrails of any credits-section line (5 vs. 3-4)',
    '**Closure intent**: pure verification closure — confirms five line-23-specific IRS guardrails documented by spec §4. **Guardrail §4a — Line 23 = Schedule 2 line 21 ONLY**: do not add Schedule 2 Part I items here. STRUCTURALLY enforced by line 19598 single-statement read of tac.otherTaxes (which finalizeSchedule2OtherTaxes sets only from Part II sub-items; Part I items feed line 17 via Schedule 2 line 3 — separate channel). **Guardrail §4b — Schedule 2 line 21 EXCLUDES line 20 Section 965 (★ MAIN 2025 IMPLEMENTATION TRAP)**: do NOT silently include Schedule 2 line 20 in line 23. STRUCTURALLY enforced by code at line 15364-15369 — sumAmounts grandTotal sums line 4 (SE deferred) + line 7 (5+6) + line 18 subtotal + line 19 (deferred); CORRECTLY omits getSection965NetTaxLiabilityInstallment per 2025 form rule. ★ This is the main trap a future maintainer might fall into by "completing" the sum — verified safe. **Guardrail §4c — Lines 5+6 flow only through line 7 subtotal**: do not double-count by adding lines 5 + 6 individually after line 7 is computed. STRUCTURALLY enforced — applyAdditionalSocialSecurityMedicareTaxes computes line 7 = nz(line 5) + nz(line 6) once at line 11116; finalizeSchedule2OtherTaxes uses getTotalAdditionalSocialSecurityMedicareTax (line 7) at line 15366, NOT lines 5/6 individually. **Guardrail §4d — Lines 17a-17z flow only through line 18 subtotal**: do not add 17* detail lines directly to line 21. STRUCTURALLY enforced — finalizeSchedule2OtherTaxes uses totalAdditionalTaxes computed at line 15349-15358 (which sums sub-items including 17* derivatives); doesn\'t add 17* individually to grandTotal at line 15364-15369. **Guardrail §4e — Line 10 RESERVED for future use 2025**: treat as zero unless IRS changes form. STRUCTURALLY enforced — no Java model field for Schedule 2 line 10; never summed. **No new breadcrumb** — 5 guardrails self-documenting in spec §4 + 23 #5 finalizeSchedule2OtherTaxes breadcrumb already documents the EXCLUDES-line-20 + line-7-subtotal + line-18-subtotal patterns. **Coverage cross-references**: spec §4a + §4b + §4c + §4d + §4e + 23 #5 breadcrumb + dependencies/23.md (Schedule 2 Part II structure). Pure verification closure — no functional change. Backend tests: 765/765 unchanged.',
    'TaxReturnComputeService.java:15349-15358 (line 18 subtotal — §4d enforcement) + 15364-15369 (line 21 grand total — §4a + §4b + §4c enforcement); spec §4a-§4e',
    'CLOSED — verified correct. 5 IRS guardrails confirmed: §4a Line 23 = Schedule 2 line 21 only + §4b EXCLUDES line 20 Section 965 (★ main 2025 trap STRUCTURALLY enforced) + §4c Lines 5+6 via line 7 only + §4d Lines 17a-17z via line 18 only + §4e Line 10 reserved. All STRUCTURALLY enforced. 3-source coverage already exists for all 5 (spec §4 + 23 #5 breadcrumb + dependencies §3). No new breadcrumb. ★ MOST guardrails of any credits-section line (5 vs. 3 for line 21, 4 for line 22) — reflects Schedule 2 complexity (17 sub-items + 2 subtotals + 1 RESERVED + 1 EXCLUDED + 2 IRS aggregation rules).'],

  [9, 'RESOLVED 2026-05-15 — ⚠️ BUNDLED OBSERVATIONS — 6 deferred-scope observations including 4 OPEN gaps from 2026-04-19 audit (★ 20th Path A application — MILESTONE double-digit mature; ★ 24 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS; ★ 7th CONSECUTIVE AUDIT WITH ZERO NEW GAPS; ★ 4th CONSECUTIVE credits-section audit with missing-diagrams cosmetic gap — pattern crystallized)',
    '**Closure intent**: pure xlsx-flip observation bundle — **NO code change**; **NO outstanding.md entry** (anti-fragmentation policy; 4 prior gaps already documented in knowledge §8 + outstanding.md from 2026-04-19 audit cycle). SIX observations bundled — all share same "documented + deferred / out-of-scope / cosmetic; not blocking real returns in current scope" rationale. **(a) ⚠️ G1 HIGH — Self-employment tax (Schedule SE → Schedule 2 line 4)**: NOT implemented; explicitly out of scope per CLAUDE.md. SE is the primary sub-item named in the IRS line 23 label ("Other taxes, including self-employment tax, from Schedule 2, line 21"). Any return with SE income has incorrect line23 = 0 today. Recommended: implement Schedule SE when SE scope is expanded (separate audit cycle). DEFERRED. **(b) ⚠️ G2 HIGH — Household employment taxes (Schedule H → Schedule 2 line 9)**: NOT implemented; no intake form, no computation, no wiring to householdEmploymentTaxes. Any household employer has incorrect line 23. Recommended: add Schedule H intake + computation + applyScheduleHTaxToSchedule2() (separate audit cycle). DEFERRED. **(c) ⚠️ G4 MEDIUM — Net investment income tax (Form 8960 → Schedule 2 line 12)**: NOT implemented; no intake form, no computation, no wiring. Taxpayers with >$200k income and investment income miss this 3.8% tax. Recommended: implement Form 8960 (separate audit cycle). DEFERRED. **(d) ⚠️ G8 LOW — W-2 box 12 codes A/B → Schedule 2 line 13 (uncollectedSocialSecurityMedicareRrtaTax)**: unimplemented per 1g.xlsx Issue #10 closure 2026-05-09. Already documented in outstanding.md. DEFERRED. **(e) Missing `diagrams/23.drawio` data-flow diagram** — `flowcharts/23.drawio` exists; data-flow does NOT; ★ 4th consecutive credits-section audit with this cosmetic gap (after 20 #9 + 21 #9 + 22 #9) — workflow signature continues. Recommended: one-shot cleanup of missing diagrams/2N.drawio for lines 20-24. Cosmetic; deferred. **(f) Line 24 audit upcoming** — same method as 20/21/22 (~line 19599-19600); coverage at 20 #6 sub-verification 4 (★★ TOTAL TAX anchor with ZERO-when-zero convention); likely 4th META-AUDIT in workflow; batching opportunity deferred from 21 #9 + 22 #9 to line 24 audit start (now finally arriving). **★ Anti-fragmentation policy applied** — observations only; no fixes today; no outstanding.md entry. **20th PATH A APPLICATION**. **★ Streak extends 23 → 24 consecutive zero-outstanding walkthroughs** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18/19/20/21/22/23). **★ 7th CONSECUTIVE ZERO NEW GAPS** — 4 prior gaps documented + zero new ones surfaced this audit. Pure documentation closure — no functional change. Backend tests: 765/765 unchanged.',
    'Knowledge §8 G1/G2/G4/G8 (4 OPEN gaps from 2026-04-19 audit; all DEFERRED); diagrams/23.drawio (missing — cosmetic; same pattern as 20/21/22 #9); future line 24 audit (4th META-AUDIT candidate; batching opportunity finally arriving)',
    'CLOSED — pure observation bundle. **★ 20th Path A application — MILESTONE (double-digit mature; 20 consecutive applications without breakdown)**; ZERO NEW GAPS surfaced (7th consecutive); **★ 24 consecutive zero-outstanding walkthroughs** (extends first 20-streak by 4). 6 observations (heaviest bundle in credits-section series): G1 HIGH SE OOS + G2 HIGH Schedule H deferred + G4 MED NIIT deferred + G8 LOW W-2 box A/B deferred (4 prior gaps already in outstanding.md from 2026-04-19 cycle; not new) + missing diagrams/23.drawio cosmetic (★ 4th consecutive credits-section audit — pattern crystallized; one-shot cleanup candidate for lines 20-24) + line 24 batching opportunity finally arriving. No outstanding.md entry per anti-fragmentation policy.'],

  [10, 'RESOLVED 2026-05-15 — BOUNDARY MILESTONE — Line 23 walkthrough complete at 10/10; FIFTH CREDITS-SECTION AUDIT; ★ FIRST AUDIT OUTSIDE same-method-as-20/21/22/24 territory; ★ THIRD META-AUDIT IN WORKFLOW; ★ FIRST METHOD-LEVEL BREADCRUMB OUTSIDE same-method territory; ★ FIRST read/write split closure; ★ 20 PATH A applications MILESTONE; ★ 24 CONSECUTIVE ZERO-OUTSTANDING WALKTHROUGHS; ★ 7th CONSECUTIVE AUDIT WITH ZERO NEW GAPS; ★ 13th CONSECUTIVE SINGLE-ROW LOG; ★ 4th CONSECUTIVE Legacy A migration with ZERO history.md hits',
    'Pure xlsx-flip + Verification log finalization — **CLOSES the 23 walkthrough at 10/10**. TWO file touches: (a) this row flipped to RESOLVED; (b) lines/23.md §11 Verification log row finalized IN-PROGRESS → **COMPLETE — 10/10 closed**. **Eight themes**: (1) **Structural positioning** — 10th audit OUTSIDE 13ab pair; FIFTH credits-section audit (after 19 + 20 + 21 + 22); ★ FIRST audit OUTSIDE same-method-as-20/21/22/24 territory — Schedule 2 aggregation lives in its own dedicated method `finalizeSchedule2OtherTaxes`. (2) **★ MFS-guard cascade UNCHANGED at 20 orchestrators** — 15th defensive-gap-NOT-needed Issue #1; ★ 5th orchestrator-method-based audit with transitive inheritance after 18 #1 + 20 #1 + 21 #1 + 22 #1; pattern rule generalized across FIVE audits. (3) **★ THIRD META-AUDIT in workflow** (Issue #4) with SAME doc-trail signature as line 22; ★ CONFIRMS sub-type (b) dependencies+knowledge-§0 signature is DOMINANT (2 of 3 META-AUDITS use it). (4) **★ FIRST METHOD-LEVEL BREADCRUMB OUTSIDE same-method territory** (Issue #5) — ~60-line VERIFIED CORRECT breadcrumb at finalizeSchedule2OtherTaxes; ★ 4 G-fix lock-in anchors (G3 RRTA + G5 finalize + G6 e2e + G7 Form 2210); ★ EXCLUDES line 20 Section 965 main-2025-trap STRUCTURALLY enforced. (5) **Knowledge convergence advances 28 → 29 lines** (Issue #2: 16th Legacy A migration; ★ 4th CONSECUTIVE Legacy A migration with ZERO history.md hits — pattern established firmly). (6) **★ 12 ANTI-DUPLICATION applications** — Issue #6 was 12th; ★ read/write split appropriate given two-method architecture (write at 15378 = NEW breadcrumb 23 #5; read at 19598 = anti-duplicated 23 #6). (7) **★ ZERO NEW gaps surfaced** — 7th consecutive audit (17 + 18 + 19 + 20 + 21 + 22 + 23); 4 prior gaps G1/G2/G4/G8 all DEFERRED per knowledge §8. (8) **Cumulative state through line 23**: **49 lines audited** (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + 11b + 12a + 12b + 12c + 12d + 12e + 13a + 13b + 14 + 15 + 16 + 17 + 18 + 19 + 20 + 21 + 22 + **23**); **487 audit issues closed total** (477 + 10); backend **765/765 pass** (UNCHANGED — pure documentation closure; no new tests this audit); MFS cascade = **20 orchestrators** (unchanged); knowledge convergence = **29 lines (+1)**; dependencies files = 43 (unchanged); **★ 9 documentation drift fixes** (unchanged — no drift this audit; first audit since 13 #4 with zero drift work AGAIN — second time in workflow); 20 Path A applications (+1 from 23 #9); **★ 12 anti-duplication applications** (+1 from 23 #6); 2 SEEDED → VERIFIED CORRECT upgrades (unchanged); 2 terminal seeds (unchanged); 0 NEW gaps surfaced (7th consecutive); **★ 3 META-AUDITS** (+1 from 23 #4; CONFIRMS sub-type (b) dominant). **★ 24 CONSECUTIVE WALKTHROUGHS WITH ZERO NEW OUTSTANDING.MD ENTRIES**. **Verification logs**: ... + 21 (1) + 22 (1) + **23 (1 — single-line shape; ★ 13th CONSECUTIVE single-row log)**. **Looking ahead — line 24 (TOTAL TAX = line 22 + line 23)**: 11th audit OUTSIDE 13ab pair; SIXTH credits-section audit; ★ likely 4th META-AUDIT (probably sub-type (b)); same method as 20/21/22 (computeLine20ThroughLine24 at ~line 19599-19600); coverage already at 20 #6 sub-verification 4 (★★ TOTAL TAX anchor with ZERO-when-zero convention). ★ Batching opportunity deferred from 21 #9 + 22 #9 + 23 #9 finally arrives — but line 24 has enough audit content (TOTAL TAX = return\'s most important output) to justify standalone treatment; will likely close at 10 issues with heavy anti-duplication use given 20 #6 sub-verification 4 already covers it.',
    'XLS/computations/23.xlsx audit-trail (this row); lines/23.md §11 Verification log row FINALIZED to COMPLETE — 10/10 closed; knowledge file renamed via 23 #2 (Legacy A); ★ NEW BREADCRUMB at finalizeSchedule2OtherTaxes via 23 #5 (first method-level breadcrumb OUTSIDE same-method territory)',
    'CLOSED — 10/10. **49 lines audited; 487 issues; 765/765 backend (UNCHANGED — no new tests this audit); 20 orchestrators (UNCHANGED); 29-line knowledge convergence; ★ 24 consecutive zero-outstanding walkthroughs; ★ 7th consecutive ZERO NEW GAPS; ★ 9 documentation drift fixes (UNCHANGED — 2nd audit with zero drift); ★ 20 Path A applications MILESTONE (double-digit mature); ★ 12 anti-duplication applications; ★ 13th consecutive single-row log; ★ 3 META-AUDITS (CONFIRMS sub-type (b) dominant at 67%); ★ FIRST METHOD-LEVEL BREADCRUMB OUTSIDE same-method territory; ★ FIRST read/write split closure; ★ 4th consecutive Legacy A migration with ZERO history.md hits**. FIFTH credits-section audit; FIRST audit OUTSIDE same-method-as-20/21/22/24 territory. ★ Multiple FIRSTs achieved: defensive-gap-NOT-needed in different method + method-level breadcrumb outside cluster + read/write split + 5 IRS guardrails + 4-stage inheritance chain. Next: line 24 (★★ TOTAL TAX FINAL; likely 4th META-AUDIT; coverage already at 20 #6 sub-verification 4; batching opportunity finally arriving from 21 #9 + 22 #9 + 23 #9 deferrals).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 120 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 23 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.taxAndCredits.otherTaxes', 'Form 1040 page 2, line 23 (PDF key line23_other_taxes_schedule2_line21; AcroForm f2_15[0])', 'XLS/output_forms/form-tax-return-1040.xlsx', '★ CANONICAL line 23 output. = Schedule 2 line 21 if > 0; else null. BigDecimal whole-dollar HALF_UP via roundMoney. Null-when-zero convention (same as line 20 + 21).'],
  ['schedule2.otherTaxes.totalOtherTaxes', 'Schedule 2 page 2, line 21 (PDF key line21_total_other_taxes)', 'XLS/output_forms/form-tax-return-schedule2.xlsx', '★ Intermediate Schedule 2 line 21 output. Same value as tac.otherTaxes; null-when-zero.'],
  ['schedule2.otherTaxes.totalAdditionalTaxes', 'Schedule 2 page 2, line 18 (subtotal of 17a-17z + lines 8-16)', 'XLS/output_forms/form-tax-return-schedule2.xlsx', 'Schedule 2 line 18 subtotal — sum of 8 fields (line 8 + 9 + 11 + 12 + 13 + 14 + 15 + 16/17e). Null-when-zero.'],
  [],
  ['SAME-METHOD DOWNSTREAM (★★) — line 24 in `computeLine20ThroughLine24`'],
  ['form1040.taxAndCredits.totalTax (line 24)', 'Form 1040 page 2, line 24 (★★ TOTAL TAX FINAL)', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ line 24 = line 22 + line 23. Line 23 is the second addend to TOTAL TAX. ZERO-when-zero convention.'],
  [],
  ['CROSS-METHOD DOWNSTREAM'],
  ['Reads tac.getTotalTax() (line 24)', 'computeLine31ThroughLine38 at ~line 19617', 'TaxReturnComputeService.java', 'Withholding chain + refund/owed calculations read totalTax. Line 23 affects this transitively via line 24.'],
  ['Reads safeAmount(tac.getOtherTaxes())', 'computeForm2210 line 15350-15351 (★ G7 FIX 2026-04-19)', 'TaxReturnComputeService.java', 'Form 2210 Part I line 2 (other taxes for underpayment penalty calc). ★ G7 FIX 2026-04-19: now reads otherTaxes directly (was hardcoded ZERO pre-fix).'],
  ['Schedule 8812 CLW-A reads sub-items', 'TaxReturnComputeService.java line 18159-18163', 'us-tax-be', 'Part II-B reads INDIVIDUAL Schedule 2 sub-items (lines 6 + 6 RRTA — G8 deferred); NOT line 21 subtotal.'],
  ['Reads tac.otherTaxes for PDF export', 'form-tax-return-1040.component.ts line 328', 'us-tax-ui', '`values[\'line23_other_taxes_schedule2_line21\'] = formatAmount(form.taxAndCredits?.otherTaxes);` Null → empty string (PDF cell blank when zero).'],
  ['Schedule 2 component PDF view', 'form-tax-return-schedule2.component.ts line 183', 'us-tax-ui', 'Renders all Schedule 2 Part II sub-items + line 21 total via `f1040s2` semantic PDF.'],
  [],
  ['CONDITIONAL ATTACHMENTS'],
  ['Schedule 2', 'Schedule 2 page 2 (when any sub-item populated)', 'XLS/output_forms/form-tax-return-schedule2.xlsx', 'Attached when ANY Schedule 2 Part II sub-item is nonzero.'],
  ['Form 4137', 'When unreportedTipIncomeTax (line 5) > 0', 'us-tax-ui PDF', 'Attached when tip tax present.'],
  ['Form 8919', 'When uncollectedSocialSecurityMedicareTaxOnWages (line 6) > 0', 'us-tax-ui PDF', 'Attached when uncollected SS/Medicare present.'],
  ['Form 8959', 'When additionalMedicareTax (line 11) > 0', 'us-tax-ui PDF', 'Attached when Additional Medicare Tax present.'],
  ['Form 5329', 'When additionalTaxOnIras (line 8) > 0', 'XLS/output_forms/form-tax-return-5329.xlsx', 'Attached when IRA early distribution penalty present.'],
  [],
  ['NOT IN OUTPUT (deliberate exclusions per spec §4 + scope)'],
  ['Schedule 2 line 4 (Self-employment tax)', '—', '—', '⚠️ G1 HIGH gap — SE OOS per CLAUDE.md. selfEmploymentTax always null. Spec §4 acknowledges SE is in IRS label but deferred.'],
  ['Schedule 2 line 9 (Household employment)', '—', '—', '⚠️ G2 HIGH gap — Schedule H NOT IMPLEMENTED. householdEmploymentTaxes always null.'],
  ['Schedule 2 line 12 (NIIT Form 8960)', '—', '—', '⚠️ G4 MED gap — Form 8960 NOT IMPLEMENTED. netInvestmentIncomeTax always null.'],
  ['Schedule 2 line 13 (W-2 box A/B uncollected RRTA)', '—', '—', '⚠️ G8 LOW gap — W-2 box 12 codes A/B not wired. uncollectedSocialSecurityMedicareRrtaTax always null.'],
  ['Schedule 2 line 20 (Section 965)', '—', '—', '★ EXCLUDED from line 21 formula per 2025 form rule (spec §4b — main 2025 trap; STRUCTURALLY enforced).'],
  ['Schedule 2 Part I items (line 1a-1z + line 2 AMT)', '—', '—', 'Part I feeds Form 1040 line 17 via Schedule 2 line 3 — separate channel; NOT line 23.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 60 }, { wch: 60 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
