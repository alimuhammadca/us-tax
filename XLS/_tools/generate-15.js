// ============================================================================
//  Generates: C:\us-tax\XLS\computations\15.xlsx
//
//  Source-of-truth references:
//    - lines/15.md (2025 IRS-verified developer-ready spec; sections 1-10)
//    - dependencies/15.md (the canonical compute-order: 11a → 11b → 12e → 13b
//      → 13a → 14 → 15 → 16; 3-site documentation; updated 2026-04-17)
//    - knowledge/line-15-taxable-income.md (renamed via 15 #2 2026-05-14 from
//      knowledge_line15.md)
//    - TaxReturnComputeService.java — FIVE wiring sites:
//        Site α: ~line 3544 (computeLine12 first-pass; pairs with Line 14 Site A)
//        Site β: ~line 820 (Schedule 1-A wiring; pairs with Line 14 Site B)
//        Site γ: ~line 980 (prepare() second-pass success; pairs with Line 14 Site C)
//        Site δ: ~line 1035 (prepare() second-pass else; pairs with Line 14 Site D)
//        Site ε: ~line 15645 (Form 8396 Schedule A reduction recompute; UNIQUE to line 15;
//                 not covered in 14 audit — observation retroactive)
//    - 14 #4 VERIFIED CORRECT seed at ~line 875 contains "Future line 15 audit"
//      hook seeded today; this audit upgrades that hook from SEEDED → VERIFIED CORRECT
//
//  Tax year: 2025
//
//  Concept:
//    Line 15 = max(0, line11b − line14)
//    "Subtract line 14 from line 11b. If zero or less, enter -0-. This is your
//    taxable income."
//
//    Expanded form (informational only — return uses line 14 as direct feeder):
//    line15 = max(0, line11b − (line12e + line13a + line13b))
//
//    **FIRST AUDIT WITH FORMAL ZERO-FLOOR VERIFICATION**. Per spec §4, the floor
//    is an EXPLICIT IRS rule applied at line 15 (not at line 14). All 5 wiring
//    sites use `subtractNonNegative(...)` helper which returns 0 when result < 0.
//
//  Line 15 audit positioning (2nd audit OUTSIDE the 13ab pair):
//   • Single-line audit (no sub-lines); 2nd consecutive single-line audit after
//     line 14 returned the workflow to single-line shape on 2026-05-14
//   • Cumulative position: 41st line
//   • SECOND SEEDED → VERIFIED CORRECT upgrade pattern in the workflow (Issue #4)
//     — line-15 future-audit hook seeded inside the 14 #4 upgraded seed at ~line 875
//     reaches its third lifecycle stage today
//   • Inline-computed at 5 wiring sites (no separate orchestrator) → 9th
//     defensive-gap-NOT-needed Issue #1 in workflow
//   • FIRST AUDIT WITH FORMAL ZERO-FLOOR VERIFICATION per spec §4 — line 15 has
//     an explicit IRS-mandated floor at zero, unlike lines 11a/11b which preserve
//     negatives
//
//  Line 15 audit angles (10 issues):
//   1. NO MFS DEFENSIVE GAP — line 15 inline-computed at 5 sites; inherits MFS
//       protection transitively from line11b (via computeAdjustments + upstream
//       cascade) + line14 (verified-correct in 14 audit). 9th defensive-gap-NOT-needed.
//   2. DOCUMENTATION HYGIENE — Knowledge file Legacy A rename
//       (knowledge_line15.md → line-15-taxable-income.md); 8th Legacy A migration;
//       convergence 20 → 21.
//   3. SPEC ENHANCEMENT — Verification log section §11 in lines/15.md (single-row).
//   4. SEED UPGRADE — 14 #4 line-15 future-audit hook → VERIFIED CORRECT (SECOND
//       SEEDED → VERIFIED CORRECT upgrade in workflow).
//   5. VERIFIED CORRECT — Site α (computeLine12 first-pass preliminary; pairs with
//       Line 14 Site A).
//   6. VERIFIED CORRECT — Site β (Schedule 1-A wiring; pairs with Line 14 Site B) +
//       MISLEADING VARIABLE NAME NOTE: `line14Final` variable at line 820 holds the
//       line 15 value, not line 14; refactor candidate.
//   7. VERIFIED CORRECT — Site γ (second-pass success; coverage via 14 #4 upgraded
//       seed; pairs with Line 14 Site C; 1st anti-duplication in 15 walkthrough;
//       6th in workflow).
//   8. VERIFIED CORRECT — Site δ (second-pass else degenerate; pairs with Line 14
//       Site D).
//   9. OBSERVATION — Site ε at Form 8396 Schedule A reduction recompute (~line
//       15645). UNIQUE to line 15 wiring chain (also retroactively a hidden 5th
//       Line 14 site; not covered in 14 audit). Special side-effect recompute path
//       triggered by Form 8396 Mortgage Interest Credit retroactively reducing
//       Schedule A mortgage interest. Anti-fragmentation observation only; 12th
//       Path A application.
//  10. BOUNDARY MILESTONE — 41 lines / 407 issues / backend 762 unchanged (pure
//       documentation closure); SECOND SEEDED → VERIFIED CORRECT upgrade in workflow;
//       9th defensive-gap-NOT-needed; 16 consecutive zero-outstanding walkthroughs.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '15.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 15 — TAXABLE INCOME (FIRST FORMAL ZERO-FLOOR AUDIT)'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 15 (page 2; numeric amount; floored at zero)'],
  ['Concept',
    'Taxable income — AGI minus total deductions, floored at zero. The core branch input ' +
    'for every line 16 tax computation path (Tax Table, TCW, QDCG Worksheet, Schedule D ' +
    'Tax Worksheet, Form 8615, FEITW). FIRST AUDIT IN THE WORKFLOW with formal verification ' +
    'of the IRS-mandated zero-floor rule (line 14 deliberately has no floor; line 15 does).'],
  ['Formula (spec §2)', 'line15 = max(0, line11b − line14)'],
  ['Expanded form (informational only)', 'line15 = max(0, line11b − (line12e + line13a + line13b))'],
  ['Floor rule (spec §4)',
    'EXPLICIT IRS floor: if line11b − line14 ≤ 0, line 15 = 0.\n' +
    'Different from lines 11a/11b which do NOT have a zero-floor.\n' +
    'All 5 line-15 wiring sites use `subtractNonNegative(...)` helper which returns 0 when result < 0.'],
  ['Special zero case (spec §6.3)',
    'Per IRS 2025 Foreign Earned Income Tax Worksheet: if line 15 == 0, do NOT complete that worksheet.\n' +
    'Line 15 is not only a numeric input; it also controls branch selection at line 16.'],
  ['Compute order (spec §8.1)',
    'line11a → line11b → line12e → line13b → line13a → line14 → line15 → line16\n' +
    'CRITICAL: 13b must be available before 13a (QBI taxable-income limitation uses 13b);\n' +
    'therefore line 15 must not be computed until the full 11b/12e/13a/13b/14 chain is stable.'],
  ['Output target',
    'form1040.deductions.line15TaxableIncome (canonical; BigDecimal; whole-dollar HALF_UP)\n' +
    'form1040.deductions.taxableIncome (legacy alias; same value)'],
  ['Backend implementation',
    '**Inline-computed at 5 wiring sites** (NO separate orchestrator); see Side-Effect Outputs sheet ' +
    'for site-by-site detail. 5 sites = 4 progressive (α/β/γ/δ matching line 14 A/B/C/D) + 1 special ' +
    'recompute (ε at Form 8396 Schedule A reduction).'],
  ['IRS source',
    'IRS 2025 Form 1040 page 2 line 15 + 2025 Form 1040 instructions + spec lines/15.md (developer-ready rule map)'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Compute line 11b (AGI) via computeAdjustments()', 'Per 11ab audit (closed 2026-05-12). MFS-guarded transitively via 13 upstream income orchestrators + computeIncomeAdjustments per 10 #1.'],
  [2, 'Compute line 12e via computeLine12()', 'Per 12abcde cluster (closed 2026-05-13 via 12e DEEP DOCUMENTATION ANCHOR).'],
  [3, 'Compute line 13b via computeSchedule1A() — MUST precede line 13a', 'Per 13b audit (closed 2026-05-13). MFS-guarded at call site (13b #1; 17th orchestrator).'],
  [4, 'Compute line 13a via computeLine13a() second-pass', 'Per 13a audit (closed 2026-05-13). MFS-guarded at call site (13a #1; 16th orchestrator).'],
  [5, 'Compute line 14 via 3-operand sum (4 sites)', 'Per 14 audit (closed 2026-05-14). FIRST SEEDED → VERIFIED CORRECT upgrade pattern in workflow.'],
  [6, 'Compute raw taxable income', 'rawTaxableIncome = line11b − line14'],
  [7, '★ Apply IRS-mandated zero-floor (spec §4)', 'line15 = max(0, rawTaxableIncome) via `subtractNonNegative(line11b, line14)` helper.'],
  [8, 'Persist on form1040.deductions.line15TaxableIncome + .taxableIncome (legacy alias)', 'Both fields always set to same value per knowledge §2.'],
  [9, 'Flow downstream to line 16 (tax)', 'Primary input to ALL tax computation methods. line16 gates immediately on null (skip line 16); zero (no tax).'],
  [],
  ['INVARIANTS / VALIDATIONS (spec §7)'],
  ['Invariant', 'Rationale'],
  ['line15 ≥ 0 always (NONNEGATIVE-PUBLIC-OUTPUT)', 'Per spec §7.4: line 15 cannot be negative on the filed form. Enforced by `subtractNonNegative` zero-floor.'],
  ['line15 == 0 when line11b − line14 ≤ 0 (ZERO-FLOOR)', 'Per spec §4 + §7.3: explicit IRS floor. Different from lines 11a/11b which preserve negatives.'],
  ['line15 is null when line11b is null (INCOMPLETE RETURN)', 'Per knowledge §2: `subtractNonNegative(null, X) → null`. Downstream line 16 skipped.'],
  ['line15 must be finalized before line 16 branch selection (BRANCH-INPUT)', 'Per spec §6.2: line 16 method choice (Tax Table / TCW / QDCG / Sched D / FEITW / Form 8615) depends on final line 15.'],
  ['Line 14 component invariant: line14 = line12e + line13a + line13b', 'Per spec §7.2: structurally enforced by the 4-site progressive build-up; not validated at runtime (mismatch impossible by construction per 14 audit).'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 35 }, { wch: 70 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 15'],
  ['Line 15 has ONLY 2 direct inputs (line 11b + line 14) — both are computed outputs from upstream audits. No direct user-facing form inputs.'],
  [],
  ['#', 'Source', 'Field', 'Type', 'Role', 'Upstream audit / where computed'],
  [1, 'computed Adjustments (line 11b)', 'line11bAmountFromLine11aAdjustedGrossIncome (AGI)', 'BigDecimal (nullable)', 'Minuend; if null, line 15 is null; if negative, preserved (no floor at line 11b)', '11ab audit (closed 2026-05-12 via 11a/11b pair completion)'],
  [2, 'computed Deductions (line 14)', 'totalDeductions', 'BigDecimal', 'Subtrahend; 3-operand composite (line12e + line13a + line13b); always ≥ 0', '14 audit (closed 2026-05-14; FIRST SEEDED → VERIFIED CORRECT upgrade in workflow)'],
  [],
  ['Indirect inputs (via line 14)'],
  [3, 'computed Deductions (line 12e)', 'deductionAmount', 'BigDecimal', 'Indirect; flows through line 14', '12abcde cluster (closed 2026-05-13)'],
  [4, 'computed Deductions (line 13a)', 'qualifiedBusinessIncomeDeduction', 'BigDecimal (nullable)', 'Indirect; flows through line 14', '13a audit (closed 2026-05-13)'],
  [5, 'computed Schedule1A (line 13b)', 'line38Total → form1040.deductions.additionalDeductions', 'BigDecimal', 'Indirect; flows through line 14', '13b audit (closed 2026-05-13)'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 35 }, { wch: 60 }, { wch: 25 }, { wch: 75 }, { wch: 65 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Line 15 Has No Direct Constants'],
  ['Line 15 is purely arithmetic (subtraction + floor) — no reference-data constants directly. All constants flow through upstream sub-lines (12abcde + 13a + 13b + 14).'],
  [],
  ['Indirect reference-data flow', 'Through which upstream sub-line', 'Where centralized'],
  ['Standard deduction base ($15,750 / $23,625 / $31,500)', 'line 14 via line 12e', 'ReferenceData.STANDARD_DEDUCTION_* (verified via 12e #8)'],
  ['Age/blind addons + SALT cap + dependent worksheet', 'line 14 via line 12e', 'ReferenceData.* (verified via 12a/12d/12e audits)'],
  ['QBI thresholds + phase-in + 20% rate + W-2/UBIA limits', 'line 14 via line 13a', 'ReferenceData.QBI_* (verified via 13a #6 + #7)'],
  ['Schedule 1-A caps + phaseouts (tips/overtime/car loan/senior)', 'line 14 via line 13b', 'ReferenceData.SCHEDULE_1A_* (verified via 13b #5-#8)'],
  [],
  ['No new constants introduced at line 15'],
  ['The zero-floor rule is a STRUCTURAL rule (max(0, x)), not a constant.', '—', '—'],
  ['Line 15 has no thresholds, no caps, no phaseouts.', '—', '—'],
  [],
  ['Statutory anchors (indirect via upstream sub-lines)'],
  ['IRS 2025 Form 1040 page 2 line 15', 'line 15 itself ("Subtract line 14 from line 11b. If zero or less, enter -0-. This is your taxable income.")', '—'],
  ['IRC §63 (taxable income definition)', 'line 15 = AGI − deductions per IRC framework', '—'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 65 }, { wch: 55 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 15 Wiring Across 5 Sites'],
  ['Line 15 is set FIVE times during compute via progressive build-up (mirroring line 14) plus an additional special-recompute site at Form 8396. Sites α/β/γ/δ pair with line 14 Sites A/B/C/D; Site ε is unique to line 15 (and retroactively also a hidden line 14 site).'],
  [],
  ['Site', 'Location', 'Computation', 'Pairs with', 'State after this site'],
  ['Site α — First-pass (computeLine12)', '~line 3544: `BigDecimal taxableIncome = agi == null ? null : roundMoney(subtractNonNegative(agi, line14));`', 'subtractNonNegative(agi, line14_preliminary)', 'Line 14 Site A (~line 3458)', 'PRELIMINARY — uses Site A preliminary line 14'],
  ['Site β — Schedule 1-A wiring (prepare())', '~line 820-823: `BigDecimal line14Final = roundMoney(subtractNonNegative(agi13b, form1040.getDeductions().getTotalDeductions()));` (★ MISLEADING NAME — this is line 15, not line 14)', 'subtractNonNegative(agi, line14_intermediate)', 'Line 14 Site B (~line 786)', 'INTERIM AUTHORITATIVE — uses Site B intermediate line 14'],
  ['Site γ — Second-pass SUCCESS (prepare())', '~line 980-982: `BigDecimal l15 = roundMoney(subtractNonNegative(agiFinal, newLine14));`', 'subtractNonNegative(agi, line14_authoritative)', 'Line 14 Site C (~line 920)', '★ FINAL AUTHORITATIVE — uses Site C authoritative line 14'],
  ['Site δ — Second-pass ELSE branch (prepare())', '~line 1035-1037: `BigDecimal l15 = roundMoney(subtractNonNegative(agiFinal, newLine14));`', 'subtractNonNegative(agi, line14_degenerate)', 'Line 14 Site D (~line 992)', '★ FINAL when QBI second-pass blocked — uses Site D degenerate line 14'],
  ['Site ε — Form 8396 Schedule A reduction (RECOMPUTE)', '~line 15645-15648: `BigDecimal newTaxableIncome = roundMoney(subtractNonNegative(agi, newLine14));`', 'subtractNonNegative(agi, recomputed_line14)', '(★ UNIQUE — no direct line 14 audit pair; also a hidden 5th line-14 site at ~line 15641)', '★ FINAL RECOMPUTE — after Form 8396 retroactively reduces Schedule A mortgage interest deduction → reduces line 14 → recomputes line 15'],
  [],
  ['Output target', 'Where wired', 'Effect', 'XLS output reference'],
  ['form1040.deductions.line15TaxableIncome', 'All 5 sites: deductions.setLine15TaxableIncome(line15)', '★ CANONICAL line 15 output. BigDecimal; whole-dollar HALF_UP. Final value from Site γ / δ / ε (whichever runs).', 'XLS/output_forms/form-tax-return-1040.xlsx (line 15 cell)'],
  ['form1040.deductions.taxableIncome (legacy alias)', 'All 5 sites: deductions.setTaxableIncome(line15)', 'Same value as canonical line15TaxableIncome. Kept for frontend backward compat per knowledge §2.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 15 cell — alias path)'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 16 (tax) — ★★ PRIMARY', 'computeLine16() gates on line15TaxableIncome', '★★ Tax Table / TCW / QDCG / Schedule D / FEITW / Form 8615 — branch selection AND amount.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 16 cell)'],
  ['Form 6251 (AMT) line 1', 'Taxable income (line 15) is AMTI starting point', '★★ AMTI = line 15 + add-backs (senior deduction add-back per 13b #8).', 'XLS/output_forms/form-tax-return-6251.xlsx'],
  ['Schedule D Tax Worksheet', 'Threshold comparisons', 'Uses line 15 for capital-gain bracket determinations.', '—'],
  ['Form 8880 (Saver\'s Credit)', 'Credit ceiling', 'Uses taxable income (via AGI/line 15).', '—'],
  ['EIC computation', 'Phaseout reference', 'Uses taxable income.', '—'],
  ['Foreign Earned Income Tax Worksheet (spec §6.3)', '★ BRANCH GATE: if line 15 == 0, do NOT complete worksheet', 'Line 15 controls branch selection at line 16; zero gates the FEITW path off.', 'XLS/output_forms/form-tax-return-2555.xlsx'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 45 }, { wch: 85 }, { wch: 60 }, { wch: 35 }, { wch: 65 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 15'],
  ['Line 15 emits NO blocking flags directly. The spec §7 invariants (LINE14_MISMATCH, LINE15_ZERO_FLOOR_REQUIRED, LINE15_CANNOT_BE_NEGATIVE) are STRUCTURALLY enforced by the implementation, not validated at runtime — they would only fire if there was a bug elsewhere.'],
  [],
  ['Flag code', 'Severity', 'Condition', 'Where emitted'],
  ['(None at line 15 site)', 'N/A', 'Line 15 is a pure arithmetic operation with structural enforcement via `subtractNonNegative` helper. Upstream blocking flags from 11ab / 12abcde / 13a / 13b / 14 are passed through; line 15 still computes via null → null + zero-floor.', 'No direct line-15 flag site exists'],
  [],
  ['SPEC §7 STRUCTURAL INVARIANTS (enforced by construction; not runtime-validated)'],
  ['Invariant', 'How enforced'],
  ['line15 ≥ 0', 'Enforced by `subtractNonNegative` returning 0 when result < 0. Public output cannot be negative.'],
  ['line15 == 0 when line11b ≤ line14', 'Same: zero-floor branch of subtractNonNegative.'],
  ['line14 = line12e + line13a + line13b', 'Enforced by line 14\'s 4-site progressive build-up; LINE14_MISMATCH validation from spec §7.2 is impossible by construction (line 14 IS the sum by definition).'],
  ['line15 null when line11b null', 'Enforced by `subtractNonNegative` short-circuit at null left operand.'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 55 }, { wch: 12 }, { wch: 95 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 15 is the taxable income (max(0, line11b − line14)). FIRST AUDIT IN WORKFLOW with formal zero-floor verification. 2nd audit OUTSIDE 13ab pair; 2nd consecutive single-line audit. 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-14 — CROSS-REFERENCE — NO MFS DEFENSIVE GAP at line 15 site (inline-computed at 5 sites; inherits MFS protection transitively)',
    '**Closure applied** — pure audit-trail cross-reference; no code change; no new breadcrumb. Line 15 is INLINE-COMPUTED at 5 wiring sites (Site α: computeLine12 ~line 3544; Site β: Schedule 1-A wiring ~line 820; Site γ: prepare() second-pass success ~line 980; Site δ: prepare() second-pass else ~line 1035; Site ε: Form 8396 Schedule A reduction ~line 15645). **NO separate orchestrator** (e.g., `computeLine15`) exists. **No additional MFS guard needed** — line 15 inherits MFS protection TRANSITIVELY from its 2 direct inputs: (a) **line 11b** via `computeAdjustments` — inherits from 14 income-territory orchestrators (1c + 1d + 1e + 1f + 1g + 1h + 1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities + computeSocialSecurityBenefits + computeCapitalGainLoss + computeOtherIncomes + computeIncomeAdjustments per 10 #1) + line 11a inline; (b) **line 14** verified-correct via 14 #1 — itself inline-computed; inherits MFS protection from line12e (via 12a #1 SURGICAL — 15th orchestrator) + line13a (via 13a #1 — 16th orchestrator) + line13b (via 13b #1 — 17th orchestrator). Both inputs are MFS-correct before they feed line 15; the subtraction + zero-floor cannot introduce new MFS leakage. Site ε at Form 8396 Schedule A reduction is also covered — the retroactive reduction operates on `newTotalItemized` derived from the same MFS-guarded Schedule A inputs. **9th defensive-gap-NOT-needed Issue #1 in the workflow** (after 9 #1 + 11a #1 + 11b #1 + 12b/c/d/e #1 + 14 #1; pattern: inline-computed line with no orchestrator → inherits MFS protection from upstream operands). Sibling-mate cross-reference to the upstream MFS guards. **MFS-guard cascade STAYS at 17 orchestrators** (no change; line 15 has no orchestrator). Coverage at all 5 sites comes via Issues #5–#8 verified-correct breadcrumbs (Site γ via Issue #4 upgraded seed; Sites α/β/δ via inline breadcrumbs; Site ε via Issue #9 observation). Backend tests: **762/762 unchanged**.',
    'TaxReturnComputeService.java:~3544 + ~820 + ~980 + ~1035 + ~15645 (5 line-15 wiring sites; no orchestrator); upstream MFS guards transitively at every upstream audit',
    'CLOSED — cross-reference closure. 9th defensive-gap-NOT-needed Issue #1 in workflow. MFS-guard cascade UNCHANGED at 17 orchestrators (line 15 has no orchestrator). Coverage at all 5 sites comes via Issues #5–#8 verified-correct breadcrumbs (Site γ via Issue #4 upgraded seed; Sites α/β/δ via inline breadcrumbs; Site ε via Issue #9 observation).'],

  [2, 'RESOLVED 2026-05-14 — DOCUMENTATION HYGIENE — Knowledge file Legacy A renamed (knowledge_line15.md → line-15-taxable-income.md)',
    '**Closure applied**: renamed `C:\\us-tax\\knowledge\\knowledge_line15.md` → `C:\\us-tax\\knowledge\\line-15-taxable-income.md` (plain `mv`; folder not under git per established precedent). **Repo-wide scan** (grep `knowledge_line15`) found 3 hits: (a) `generate-15.js` Issue #2 narrative + header source-of-truth comment (this audit\'s artifacts; UPDATED to cite new canonical path); (b) `C:\\us-tax\\history.md` historical entries (LEFT UNTOUCHED per established precedent — historical entries reflect what was true at their date); (c) `C:\\us-tax\\lines\\15.md` line 9 ACTIVE SPEC citation (UPDATED: "See knowledge/knowledge_line15.md..." → "See knowledge/line-15-taxable-income.md (renamed from knowledge_line15.md via 15 #2 on 2026-05-14)..."; spec is a living document so the citation must reflect the current canonical path). **8th Legacy A migration in the workflow** (after 7a #2 + 8 #2 + 9 #2 + 10 #2 + 11a #2 + 12a #2 + 13a #2; line 14 had no knowledge file so no rename was needed). Naming convergence advances **20 → 21 lines** (count unchanged at line 14 audit because line 14 has no knowledge file; today\'s rename closes that pause). Backend tests: 762/762 unchanged (pure doc rename; no functional impact).',
    'C:\\us-tax\\knowledge\\line-15-taxable-income.md (post-rename canonical path)',
    'CLOSED — file renamed via plain `mv`; spec citation at lines/15.md line 9 updated to new canonical path; history.md left as historical record per established precedent. Convergence 20 → 21 lines.'],

  [3, 'RESOLVED 2026-05-14 — SPEC ENHANCEMENT — Created Verification log section §11 in lines/15.md (single-row; IN-PROGRESS until Issue #10)',
    '**Closure applied**: appended `## 11) Verification log` section to `lines/15.md` after section §10 (Bottom line). 5-column markdown table (Audit ID / Date / Closures applied / Backend regression / Outcome); first row captures the 15 walkthrough state in IN-PROGRESS form (#1 cross-reference NO MFS gap — 9th defensive-gap-NOT-needed; #2 Legacy A knowledge rename — 8th migration with convergence 20→21; #3 this section creation; #4-#10 IN-PROGRESS; backend 762/762 unchanged expected). Will be finalized to "COMPLETE — 10/10 closed" after Issue #10 closes (append-then-finalize pattern from 13a/13b/14 walkthroughs). **Single-row pattern** — single-line audit shape (no sub-lines to append rows for); smallest log shape in workflow (mirrors lines 8, 9, 10, 14 single-line audits; contrasts with 13ab 2-row pair-aligned shape and 12abcde 5-row LARGEST cluster log). Backend tests: 762/762 unchanged (pure doc append; no functional impact).',
    'lines/15.md (Verification log section §11 appended; single-row IN-PROGRESS table; finalized COMPLETE by Issue #10)',
    'CLOSED — section §11 appended; row 1 written IN-PROGRESS. Will finalize to COMPLETE — 10/10 closed at Issue #10. Single-row pattern (smallest log shape; mirrors lines 8, 9, 10, 14).'],

  [4, 'RESOLVED 2026-05-14 — ★ SEED UPGRADE — 14 #4 line-15 future-audit hook → VERIFIED CORRECT (SECOND SEEDED → VERIFIED CORRECT upgrade in workflow)',
    '**Closure applied** — FOUR edits to the existing breadcrumb at TaxReturnComputeService.java:~900-995 (~75 → ~100 lines): (1) **header timestamp update** — added `; line-15 hook UPGRADED → VERIFIED CORRECT via 15 audit, 2026-05-14` + added citations for `lines/15.md §2` + `dependencies/15.md` + renamed knowledge file `knowledge/line-15-taxable-income.md`; (2) **★ Flipped the line-15 hook block** from SEEDED → VERIFIED CORRECT with FIVE explicit sites cited (α/β/γ/δ/ε); **★ CORRECTED 14 #4 hook\'s site-count error retroactively** — the 14 #4 hook said "3 sites (~line 795 + ~925 + ~947)" but actual count is 5; hook author missed Site α (computeLine12 first-pass) AND Site ε (Form 8396 special recompute). Today\'s upgrade fixes this. Site β breadcrumb includes the misleading-variable-name note (`line14Final` actually holds line 15 value; refactor candidate per 15 #9). Site ε note flags it as the hidden 5th line-14 site retroactively. (3) Zero-floor formal verification documented (subtractNonNegative helper + max(0, ...) semantics + null short-circuit when line11b is null + IRS Form 1040 line 15 instruction "If zero or less, enter -0-"). (4) **NEW future-line-16 informational hook seeded** — line 16 is a SEPARATE orchestrator (computeLine16); the line-16 audit will NOT upgrade this breadcrumb (different shape); 6 tax computation methods (Tax Table / TCW / QDCG / Schedule D / Form 8615 / FEITW); line 15 == 0 gates FEITW per spec §6.3. **SECOND SEEDED → VERIFIED CORRECT upgrade in workflow** (after 14 #4 was the first) — pattern lifecycle now demonstrated TWICE in 24 hours, establishing the template. The 15 #4 lifecycle is faster than 14 #4 (no EXTENDED phase: 14 #4 had 13b #4 extension; 15 has no analogous sub-line phase). **Self-correcting nature** — when a later audit finds an error in an earlier audit\'s documentation, it gets fixed at the source. Pure documentation closure — no functional change. Backend tests: **762/762 unchanged**.',
    'TaxReturnComputeService.java:~900-995 (14 #4 upgraded seed; line-15 hook UPGRADED → VERIFIED CORRECT via 15 audit + new line-16 informational hook; breadcrumb grew from ~75 → ~100 lines)',
    'CLOSED — 2nd SEEDED → VERIFIED CORRECT in workflow (after 14 #4); 14 #4 hook\'s site-count error (3 → 5) corrected retroactively; new line-16 informational hook seeded.'],

  [5, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — Site α: computeLine12 first-pass preliminary line 15 (pairs with Line 14 Site A; when-FINAL note + null short-circuit note)',
    '**Closure applied**: added ~35-line VERIFIED CORRECT breadcrumb above Site α at TaxReturnComputeService.java:~3585 (`BigDecimal taxableIncome = agi == null ? null : roundMoney(subtractNonNegative(agi, line14));`). Structure: (1) **Site α designation** — line 15 preliminary; pairs with Line 14 Site A (line 14 is itself preliminary 2-operand here; line13b not yet known); (2) **Cross-references to Sites β/γ/δ/ε** for the authoritative writers (Site β ~line 820 incremental + Site γ ~line 980 authoritative + Site δ ~line 1035 degenerate + Site ε ~line 15645 Form 8396 recompute); (3) **★ When-Site-α-is-FINAL note** — when Sites β/γ/δ/ε ALL skip (schedule1A == null + no Form 8396), Site α\'s value IS the final line 15 on the return; simplest happy path (standard ± QBI; no Schedule 1-A; no mortgage credit); (4) **★ Null short-circuit pattern** — explicit `agi == null ? null : ...` ternary (vs. bare `subtractNonNegative(...)` at Sites β/γ/δ/ε); reason: Site α reached even when AGI was not computed; Sites β/γ/δ/ε have outer-block null guards; both patterns produce identical results for null AGI (line15 = null → line16 skipped); (5) **3 rationale themes** for the preliminary write — well-formed Line12Computation record + frontend response shape + mirrors 13a #5 two-pass contract; (6) **Cross-references** to 14 #6 paired Site A breadcrumb directly above + 15 #4 upgraded seed at Site γ + dependencies/15.md + lines/15.md spec §2 + §4. Pure documentation closure — no functional change. Backend tests: **762/762 unchanged**.',
    'TaxReturnComputeService.java:~3585 (Site α — computeLine12 first-pass; ~35-line breadcrumb above the line15 assignment)',
    'CLOSED — verified correct. ~35-line breadcrumb documents preliminary line-15 contract + 5-site cross-references + when-Site-α-is-FINAL note + null short-circuit rationale + 3 rationale themes + cross-refs to 14 #6 paired breadcrumb + 15 #4 upgraded seed.'],

  [6, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — Site β: Schedule 1-A wiring interim line 15 + ★ misleading line14Final variable name (refactor deferred to 15 #9)',
    '**Closure applied**: added ~32-line VERIFIED CORRECT breadcrumb above Site β at TaxReturnComputeService.java:~816-824. Structure: (1) **Site β designation** — line 15 interim recompute; pairs with Line 14 Site B (~line 786; per 14 #7); `line15_interim = max(0, agi − (line12e + line13a_preliminary + line13b))`; line13a still preliminary (will be replaced by second-pass). (2) **★ MISLEADING LOCAL VARIABLE NAME flag** — `BigDecimal line14Final = ...` at line 820 actually holds the LINE 15 VALUE (`agi13b − getTotalDeductions()` = `line 11b − line 14` = line 15). Setters at lines 821 + 823 correctly persist to setTaxableIncome + setLine15TaxableIncome → bug is PURELY COSMETIC (no functional impact; value correct; only name wrong). Clearer name: `line15Interim`. Refactor deferred to 15 #9 per anti-fragmentation policy (3-line local; no test impact; clarity benefit small vs risk). (3) **★ INTERIM AUTHORITATIVE status** — always overwritten by Sites γ/δ in the second-pass block; the gate that fires Site β also fires the second-pass block; one of γ/δ always fires; Site β value is purely intermediate. (4) **Why Site β exists at all — DEFENSIVE CONSISTENCY UPDATE**: line 13b wiring at line 783 must happen between computeSchedule1A and the second-pass; line 14 + line 15 updates keep the Deductions object internally consistent during the brief interim phase; downstream consumers reading getTaxableIncome between Site β and Sites γ/δ get the interim value rather than stale Site α value. (5) **Cross-references** to 14 #7 paired Site B breadcrumb + 15 #4 upgraded seed + 15 #9 observation (variable name + 5-site refactor candidate) + dependencies/15.md "Wiring sites". Pure documentation closure — no functional change. Backend tests: **762/762 unchanged**.',
    'TaxReturnComputeService.java:~816-824 (Site β — Schedule 1-A wiring; ~32-line breadcrumb above the agi13b assignment) + variable-name observation flagged for 15 #9',
    'CLOSED — verified correct. ~32-line breadcrumb documents interim contract + ★ misleading line14Final variable name (cosmetic; deferred to 15 #9) + INTERIM AUTHORITATIVE status + defensive consistency rationale + cross-refs to 14 #7 paired breadcrumb + 15 #4 upgraded seed.'],

  [7, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — Site γ authoritative line 15 (coverage via Issue #4 upgraded seed; 1st anti-duplication in 15 walkthrough; 6th in workflow)',
    '**Closure applied** — pure xlsx-flip anti-duplication closure; no code change; no new breadcrumb. Site γ at TaxReturnComputeService.java:~980-982 (`BigDecimal l15 = roundMoney(subtractNonNegative(agiFinal, newLine14));`) is the AUTHORITATIVE line-15 writer that runs when the second-pass `corrected13a != null` branch fires. **Coverage already at 3 sources**: (1) `lines/15.md` §2 formula + §4 explicit floor rule; (2) `dependencies/15.md` "Three computation points" section + 14 #4 upgraded seed referencing this site; (3) **upgraded 13a/b → 14 → 15 seed breadcrumb at ~line 875** contains the full VERIFIED CORRECT block for line 15 (per Issue #4 above) — 5-site enumeration with Site γ designated authoritative + zero-floor formal verification + `subtractNonNegative` helper documentation + IRS instruction quote + anti-duplication rationale itself. Adding a 4th breadcrumb directly above Site γ would duplicate the seed-upgrade content. **1st anti-duplication application in the 15 walkthrough** (after 5 prior across workflow: 12e #8 + 12e #9 + 13a #9 + 13b #9 + 14 #5; **6th in workflow total**); pattern: "when 3-source coverage exists, defer additional breadcrumbs at the redundant site". The Issue #7 row serves as audit-trail anchor for the "Site γ verified correct" claim; the verification itself lives in the Issue #4 seed upgrade. Mirrors line 14\'s Issue #5 pattern (Site C authoritative coverage via 14 #4 upgraded seed; same anti-duplication closure shape). Backend tests: **762/762 unchanged**.',
    'TaxReturnComputeService.java:~980-982 (Site γ — authoritative second-pass success); coverage via 15 #4 upgraded seed at ~line 875',
    'CLOSED — pure anti-duplication. 1st anti-duplication app in 15 walkthrough (12e #8 + #9 + 13a #9 + 13b #9 + 14 #5 precedents = 6th in workflow). Site γ verified correct; 3-source coverage adequate (lines/15.md §2 + §4 + dependencies/15.md + upgraded seed).'],

  [8, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — Site δ: prepare() second-pass else degenerate line 15 (pairs with Line 14 Site D; 2 failure modes; 2-operand interpretation)',
    '**Closure applied**: added ~28-line VERIFIED CORRECT breadcrumb above Site δ at TaxReturnComputeService.java:~1113. Structure: (1) **Site δ designation** — `line15_degenerate = max(0, line11b − (line12e + line13b))`; pairs with Line 14 Site D directly above (per 14 #8; line 13a CLEARED at line 1106; line 14 recomputed as 2-operand at line 1108). (2) **★ FINAL when QBI second-pass blocked** — mutually exclusive with Site γ (~line 1058) via `if (corrected13a != null) { Site γ } else { Site D + Site δ }`; never both. (3) **★ TWO FAILURE MODES** both route here — Mode 1 (no QBI workflow: MFS-guard null-shadow per 13a #1 OR `hadQualifiedBusinessIncomeInputs=false`; NO flag); Mode 2 (QBI workflow blocked by validation: LINE13A_SELF_EMPLOYMENT_OUT_OF_SCOPE_* / COOPERATIVE_PATRON_* / MISSING_K1_*_199A_DETAILS_* / MANUAL/NEGATIVE/COMPLEX_*_THRESHOLD_*; flag emitted; line 13a cleared). (4) **★ Why 2-operand (no 3rd operand for line 13a)** — line 13a was explicitly cleared at line 1106; adding it back would re-introduce stale data; the 2-operand sum at Site D IS the correct degenerate line 14. (5) **Cross-references** to 14 #8 paired Site D breadcrumb directly above + 15 #4 upgraded seed at ~line 875 (Site γ authoritative; the mutually-exclusive counterpart) + 13a #1 MFS guard (Mode 1 path) + 13a blocking flags inventory (Mode 2 paths) + dependencies/15.md "Wiring sites" + "Three computation points". Pure documentation closure — no functional change. Backend tests: **762/762 unchanged**.',
    'TaxReturnComputeService.java:~1113 (Site δ — second-pass else degenerate path; ~28-line breadcrumb above the l15 assignment)',
    'CLOSED — verified correct. ~28-line breadcrumb documents degenerate path + 2 failure modes (no-QBI-workflow + blocking-flag) + 2-operand interpretation + mutually-exclusive-with-Site-γ + cross-refs to 14 #8 paired breadcrumb + 13a #1 MFS guard + 13a blocking flags + 15 #4 upgraded seed.'],

  [9, 'RESOLVED 2026-05-14 — OBSERVATION — Site ε at Form 8396 Schedule A reduction (5th site UNIQUE to line 15; retroactively a hidden 5th line-14 site) + misleading `line14Final` variable name at Site β (12th Path A — bundled observation)',
    '**Closure applied** — bundled observation; no code change; no new breadcrumb. TWO observations bundled because both share the same anti-fragmentation rationale (refactor candidates; cosmetic/structural rather than functional; 3-source coverage already exists).\n\n' +
    '**★ OBSERVATION 1 — Site ε exists at Form 8396 Schedule A reduction (~line 15640-15649)**: Special recompute path triggered by Form 8396 (Mortgage Interest Credit). Per IRS Form 8396 + IRC §25 + Pub. 535: claiming the mortgage interest credit requires reducing the Schedule A home mortgage interest deduction by the credit amount (prevents double-benefit: getting both deduction AND credit on the same interest). The backend implements this as a side-effect recompute that runs AFTER all other line-15 sites: (a) recomputes Schedule A line 17 with reduced mortgage interest → newTotalItemized; (b) recomputes line 14 = newTotalItemized + line13a + line13b (HIDDEN 5th line-14 site at line 15641 — NOT documented in 14 audit; line 14 audit\'s Issue #9 said "4-site progressive build-up" but should have been "4 main sites + 1 special recompute site"); (c) recomputes line 15 = subtractNonNegative(agi, newLine14) (THIS Site ε). **Retroactive observation about 14 audit**: not enough to reopen the 14 audit (the Form 8396 path is a special side-effect, not part of the main wiring chain); flagging here for future visibility. Site ε is the 5th line-15 site that has no parallel-paired line-14 audit coverage.\n\n' +
    '**★ OBSERVATION 2 — Misleading `line14Final` variable name at Site β** (already flagged in 15 #6 breadcrumb): TaxReturnComputeService.java:~820 names the local variable `line14Final` (suggesting it holds the line 14 value) when it actually holds the LINE 15 VALUE (= line11b − line14, floored at zero via subtractNonNegative). The setters at lines 821 + 823 correctly persist to `taxableIncome` and `line15TaxableIncome`, so the bug is purely cosmetic (no functional impact). A clearer name would be `line15Interim` or `interimLine15` (mirrors `newTaxableIncome` style at Site ε). **Refactor risk vs benefit**: variable is local to a 4-line if-block; renaming touches 3 lines + adjacent comment; no functional change; no test impact. Clarity benefit small but non-zero; refactor risk also small but non-zero; net benefit doesn\'t justify a backend code change today.\n\n' +
    '**Anti-fragmentation policy applied** — observation only, no new outstanding.md entry. **12th Path A application** in the workflow (after 7a #9 + 8 #9 + 10 #9 + 11b #8 + 12a #9 + 12c #9 + 12d #9 + 13a #9 + 13b #9 + 14 #9 + prior audits; pattern: "code is correct but stylistically improvable; refactor deferred — no new outstanding entry"). Bundling rationale: both observations share the same anti-fragmentation rationale; bundling them into a single observation closure avoids creating two xlsx rows for issues with identical disposition. NO code change today (variable name refactor + Form 8396 retrospective documentation both deferred). Coverage in 3 sources for each observation: (1) this audit-trail row; (2) for Observation 2: Site β breadcrumb at line ~816-824 (per 15 #6) flags the variable name; (3) for Observation 1: 15 #4 upgraded seed at ~line 875 enumerates all 5 sites including Site ε. **Anti-fragmentation streak: 15 → 16 consecutive walkthroughs with zero new outstanding.md entries**. Backend tests: **762/762 unchanged**.',
    'TaxReturnComputeService.java:~820 (variable name); ~15640-15649 (Site ε Form 8396 recompute; also a hidden 5th line-14 site not covered in 14 audit)',
    'CLOSED — pure bundled observation. **12th Path A application** (streak: 15 → 16 consecutive zero-outstanding walkthroughs). Two observations bundled (Form 8396 5th site retroactive discovery + Site β variable-name refactor candidate). Future cleanup; no code change today; no new outstanding entry. Backend unchanged.'],

  [10, 'RESOLVED 2026-05-14 — BOUNDARY MILESTONE — Line 15 walkthrough COMPLETE; SECOND SEEDED → VERIFIED CORRECT upgrade in workflow; FIRST FORMAL ZERO-FLOOR AUDIT; 16 consecutive zero-outstanding walkthroughs',
    'Pure xlsx-flip observation — **CLOSES the 15 walkthrough at 10/10**. **Seven themes**: (1) **Structural positioning** — 2nd audit OUTSIDE the 13ab pair; 2nd consecutive single-line audit after line 14 returned the workflow to single-line shape on 2026-05-14. (2) **★ FIRST FORMAL ZERO-FLOOR VERIFICATION AUDIT** in the workflow — per spec §4, line 15 has an EXPLICIT IRS-mandated floor (line 14 deliberately has no floor; line 15 does). All 5 wiring sites verified using `subtractNonNegative(...)` helper which returns 0 when result < 0. Per IRS Form 1040 line 15 instruction: "If zero or less, enter -0-". (3) **★ SECOND SEEDED → VERIFIED CORRECT upgrade pattern in the workflow** (Issue #4) — closes the line-15 future-audit hook seeded only 24 hours earlier inside the 14 #4 upgrade. Pattern now at 2 completions (14 #4 + 15 #4); pattern lifecycle (SEEDED → EXTENDED × N → VERIFIED CORRECT) demonstrated twice in 24 hours, establishing it as a recurring template. The 15 #4 lifecycle is faster than 14 #4 (no EXTENDED phase: 14 #4 had 13b #4 extension; line 15 has no analogous sub-line phase). (4) **★ 9th defensive-gap-NOT-needed Issue #1** (Issue #1) — line 15 inline-computed at 5 wiring sites; inherits MFS protection transitively from line 11b (14 income-territory orchestrators + line 11a inline) + line 14 (per 14 #1 inherits from line12e/13a/13b). MFS cascade UNCHANGED at 17 orchestrators. (5) **Knowledge convergence advances** — 20 → 21 lines (Issue #2: 8th Legacy A migration; line 14 had no knowledge file so count was unchanged then). (6) **★ Self-correcting retroactive corrections to 14 audit**: (a) 14 #4 hook\'s site-count error (said 3; actual 5) corrected today retroactively in the upgraded seed; (b) 14 audit\'s "4-site progressive build-up" claim adjusted to "4 main sites + 1 Form 8396 special recompute site" — Site ε at line 15640-15649 documented as a retroactive observation in Issue #9. (7) **Cumulative through line 15**: 41 lines audited (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + 11b + 12a + 12b + 12c + 12d + 12e + 13a + 13b + 14 + **15**); 407 audit issues closed total (397 + 10); backend **762/762** unchanged (pure documentation closure; no new tests; no functional change at any wiring site); MFS cascade = **17 orchestrators (UNCHANGED)**; knowledge-file naming convergence = **21 lines** (+1 from 15 #2); 12 Path A applications (+1 from 15 #9); 6 anti-duplication applications (+1 from 15 #7); **2 SEEDED → VERIFIED CORRECT upgrades** (+1 from 15 #4 — pattern now established as recurring template). **16 consecutive walkthroughs with zero new outstanding.md entries** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/**15**). **Looking ahead — line 16 (tax computation)**: 3rd audit OUTSIDE the 13ab pair. **FIRST audit at a SEPARATE ORCHESTRATOR (`computeLine16`) since line 13b (computeSchedule1A) on 2026-05-13** — returns the workflow to orchestrator-based audits after 3 inline-computed audits (14, 15, plus 13ab #3 finalization). Will document the 6 tax computation methods (Tax Table / Tax Computation Worksheet / QDCG Worksheet / Schedule D Tax Worksheet / Form 8615 / Foreign Earned Income Tax Worksheet) + the method-selection logic. Will use the line-16 future-audit hook seeded today via Issue #4 (informational only — line 16 won\'t upgrade this breadcrumb; will document the line-16 orchestrator separately). Line 16 has its own orchestrator → **likely HIGH-PRIORITY MFS guard analysis** like the income-territory orchestrators (would extend cascade to 18 orchestrators — new codebase maximum).',
    'XLS/computations/15.xlsx audit-trail (this row); lines/15.md Verification log row FINALIZED to COMPLETE — 10/10 closed; knowledge file renamed via 15 #2; upgraded seed at ~line 875',
    'CLOSED — 15 walkthrough complete (10/10). 41 lines audited cumulatively. SECOND SEEDED → VERIFIED CORRECT upgrade pattern established as recurring template (twice in 24 hours: 14 #4 + 15 #4). Line 16 (tax computation) queued next — first orchestrator-based audit since 13b; likely HIGH-PRIORITY MFS guard analysis.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 115 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 15 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.deductions.line15TaxableIncome', 'Form 1040 page 2, line 15 (numeric box)', 'XLS/output_forms/form-tax-return-1040.xlsx', '★ CANONICAL line 15 output. BigDecimal; whole-dollar HALF_UP. Set at 5 sites (α/β/γ/δ/ε); final value from γ/δ/ε.'],
  ['form1040.deductions.taxableIncome (legacy alias)', 'Form 1040 page 2, line 15 (numeric box — alias path)', 'XLS/output_forms/form-tax-return-1040.xlsx', 'Same value as line15TaxableIncome. Kept for frontend backward compat per knowledge §2.'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 16 (tax)', 'Form 1040 page 2, line 16 (numeric box)', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ Primary downstream. Drives BOTH method selection AND amount.'],
  ['Form 6251 (AMT) line 1 (taxable income before NOL/QBI)', 'Form 6251 line 1', 'XLS/output_forms/form-tax-return-6251.xlsx', '★★ AMTI starting point. Plus AMT-specific add-backs (senior deduction per 13b #8).'],
  [],
  ['LINE 16 BRANCH METHODS (all use line 15)'],
  ['Tax Table', '—', '—', 'Applied when line 15 < $100,000.'],
  ['Tax Computation Worksheet (TCW)', '—', '—', 'Applied when line 15 ≥ $100,000.'],
  ['Qualified Dividends and Capital Gain Tax Worksheet (QDCG)', '—', '—', 'Applied when qualified dividends or capital gains present.'],
  ['Schedule D Tax Worksheet', '—', '—', 'Applied when Schedule D has QD/LTCG entries.'],
  ['Form 8615 (kiddie tax)', 'Form 8615 line 18', 'XLS/output_forms/form-tax-return-8615.xlsx', 'Child\'s line 15 used in parent\'s tax computation.'],
  ['Foreign Earned Income Tax Worksheet (FEITW)', 'Form 2555', 'XLS/output_forms/form-tax-return-2555.xlsx', '★ BRANCH GATE: if line 15 == 0, do NOT complete worksheet (per spec §6.3).'],
  ['Schedule J (income averaging)', '—', '—', '**OUT OF SCOPE** — farmers/fishermen only.'],
  [],
  ['SECONDARY DOWNSTREAM'],
  ['Schedule D Tax Worksheet thresholds', '—', '—', 'Uses line 15 for capital-gain bracket determinations.'],
  ['Form 8880 (Saver\'s Credit)', '—', '—', 'Uses taxable income (via AGI/line 15) for credit ceiling.'],
  ['EIC computation', '—', '—', 'Uses taxable income as phaseout reference.'],
  [],
  ['NOT IN OUTPUT (deliberate exclusions per spec §3.3)'],
  ['Schedule A by itself', '—', '—', 'Flows through line 12e → line 14 → line 15.'],
  ['Form 8995 / 8995-A by itself', '—', '—', 'Flows through line 13a → line 14 → line 15.'],
  ['Schedule 1-A by itself', '—', '—', 'Flows through line 13b → line 14 → line 15.'],
  ['AGI from line 11a without line 11b carryforward', '—', '—', 'line 15 uses line 11b ONLY (not line 11a directly).'],
  ['line 12e alone', '—', '—', 'Must flow through line 14 first.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 60 }, { wch: 50 }, { wch: 55 }, { wch: 95 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
