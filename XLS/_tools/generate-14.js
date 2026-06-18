// ============================================================================
//  Generates: C:\us-tax\XLS\computations\14.xlsx
//
//  Source-of-truth references:
//    - lines/14.md (2025-tax-year, implementation-ready rule map for line 14)
//    - dependencies/14.md (MISSING — to be CREATED via 14 #2 documentation hygiene)
//    - TaxReturnComputeService.java — FOUR wiring sites:
//        Site A: ~line 3428 (computeLine12 first-pass; preliminary 2-operand sum)
//        Site B: ~line 786-789 (Schedule 1-A wiring; incremental + line13b)
//        Site C: ~line 920-921 (prepare() second-pass success; authoritative 3-operand)
//        Site D: ~line 942-943 (prepare() second-pass else/blocked; 2-operand degenerate)
//    - 13a #4 + 13b #4 forward seed breadcrumb at ~line 875 (above Site C);
//      this audit upgrades the seed from SEEDED → VERIFIED CORRECT per the
//      "Future line 14 audit" hook in the seed
//
//  Tax year: 2025
//
//  Concept:
//    Line 14 = line12e + (line13a ?? 0) + (line13b ?? 0)   — 3-operand composite
//    NO floor at line 14 (zero-floor is line 15's job: line15 = max(0, AGI − line14)).
//    Each operand is independently non-negative, so line14 ≥ 0 always (validation §5).
//
//    Per IRS 2025 Form 1040 page 2 line 14 ("Add lines 12e, 13a, and 13b") +
//    spec lines/14.md §1.
//
//  Line 14 audit positioning (1st audit OUTSIDE the 13ab pair):
//   • Single-line composite audit (no sub-lines; no cluster/pair shape)
//   • Cumulative position: 40th line; 1st audit OUTSIDE 13ab pair
//   • **FIRST audit using the "upgrade SEEDED → VERIFIED CORRECT" pattern**
//     in the workflow — upgrades the 13a #4 + 13b #4 forward seed at ~line 875
//     from SEEDED (placeholder for line 14 audit) → VERIFIED CORRECT.
//   • Inline-computed (no separate orchestrator) → 8th defensive-gap-NOT-needed
//     Issue #1 in the workflow (after 9 #1 + 11a #1 + 11b #1 + 12b/c/d/e #1).
//
//  Line 14 audit angles (10 issues):
//   1. NO MFS DEFENSIVE GAP — line 14 inline-computed; inherits MFS protection
//       transitively from line12e (12abcde cluster) + line13a (13a #1) + line13b
//       (13b #1). 8th defensive-gap-NOT-needed Issue #1 in workflow.
//   2. DOCUMENTATION HYGIENE — CREATE missing dependencies/14.md file.
//   3. SPEC ENHANCEMENT — create Verification log section in lines/14.md (single-row).
//   4. SEED UPGRADE — 13a #4 + 13b #4 PAIR COMPLETE seed → VERIFIED CORRECT
//       (closes the "Future line 14 audit" hook).
//   5. VERIFIED CORRECT — Site C: prepare() second-pass success authoritative
//       3-operand sum (the canonical site).
//   6. VERIFIED CORRECT — Site A: computeLine12 first-pass preliminary 2-operand
//       sum (line13b not yet available; preliminary by design).
//   7. VERIFIED CORRECT — Site B: Schedule 1-A wiring incremental + line13b
//       (the intermediate state between first-pass and second-pass).
//   8. VERIFIED CORRECT — Site D: prepare() second-pass else degenerate 2-operand
//       sum (line13a cleared to null on blocked QBI).
//   9. OBSERVATION — 4-site progressive build-up vs single-end-of-prepare()
//       computation. Functionally correct; anti-fragmentation observation (11th
//       Path A application).
//  10. BOUNDARY MILESTONE — 1st audit OUTSIDE 13ab pair; 40 lines / 397 issues /
//       backend 762 (unchanged — pure documentation closure); 15 consecutive
//       zero-outstanding walkthroughs.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '14.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 14 — TOTAL DEDUCTIONS (3-OPERAND COMPOSITE)'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 14 (page 2; numeric amount)'],
  ['Concept',
    'Total deductions composite — sum of line 12e (standard or itemized) + line 13a (QBI) + line 13b (Schedule 1-A). ' +
    'Structurally NEW for 2025 vs 2024 (was "Add lines 12 and 13a"; now "Add lines 12e, 13a, and 13b" per Schedule 1-A introduction). ' +
    'First audit OUTSIDE the 13ab pair; first SEEDED → VERIFIED CORRECT upgrade in workflow.'],
  ['Formula (spec §1)', 'line14 = line12e + (line13a ?? 0) + (line13b ?? 0)'],
  ['Null handling (spec §1)',
    'line12e: ALWAYS positive (standard deduction floor ≥ $15,750 / $23,625 / $31,500 ensures positive).\n' +
    'line13a: may be null when blocking flag prevents QBI computation (e.g., self-employment QBI out of scope). ' +
    'Treat null as 0 in the sum.\n' +
    'line13b: 0 (not null) when no Schedule 1-A deduction applies.'],
  ['No floor on line 14', 'Per spec §1: line14 has NO floor at zero. The zero-floor rule is applied on line 15 (taxable income).'],
  ['Compute order (spec §3)',
    'Step D: computeLine12()        → produces line12e\n' +
    'Step E: computeSchedule1A()    → produces line13b   ← MUST precede line 13a\n' +
    'Step F: computeLine13a()       → produces line13a   ← uses line13b\n' +
    'Step G: line14 = line12e + (line13a ?? 0) + (line13b ?? 0)\n' +
    'Step H: line15 = max(0, line11b − line14)'],
  ['Output target', 'form1040.deductions.totalDeductions (BigDecimal; whole-dollar HALF_UP rounded)'],
  ['Backend implementation', '**Inline-computed at 4 wiring sites** (NO separate orchestrator); see Side-Effect Outputs sheet for site-by-site detail'],
  ['IRS source', 'IRS 2025 Form 1040 page 2 line 14 + 2025 Form 1040 instructions + spec lines/14.md (developer-ready rule map)'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes / Source'],
  [1, 'Compute line 12e via computeLine12()', 'Standard deduction OR itemized deductions (from Schedule A line 17). Per 12abcde cluster audits — closed 2026-05-13 via 12e DEEP DOCUMENTATION ANCHOR.'],
  [2, 'Compute line 13b via computeSchedule1A() — MUST precede line 13a', 'Schedule 1-A line 38 = Part II tips + Part III overtime + Part IV car loan + Part V senior. Per 13b audit (closed 2026-05-13). MFS-guarded at call site (13b #1; 17th orchestrator in cascade).'],
  [3, 'Compute line 13a via computeLine13a() second-pass', 'Form 8995 line 15 (below threshold) OR Form 8995-A line 39 (above threshold). taxIncBeforeQbi = AGI − line12e − line13b (requires line13b finalized first). Per 13a audit (closed 2026-05-13). MFS-guarded at call site (13a #1; 16th orchestrator in cascade).'],
  [4, 'Sum the 3 operands (with null → 0 substitution)', 'line14 = line12e + (line13a ?? 0) + (line13b ?? 0). Pure additive; no floor.'],
  [5, 'Persist on form1040.deductions.totalDeductions', '`deductions.setTotalDeductions(line14)`. BigDecimal; whole-dollar HALF_UP.'],
  [6, 'Flow downstream to line 15 (taxable income)', 'line15 = max(0, line11b − line14). ZERO-FLOOR rule applied at line 15, not at line 14.'],
  [],
  ['INVARIANTS / VALIDATIONS (spec §5)'],
  ['Invariant', 'Rationale'],
  ['line14 ≥ 0 always', 'Each component is independently non-negative; sum of non-negatives is non-negative.'],
  ['line12e > 0 always', 'Standard deduction floor ($15,750 / $23,625 / $31,500) ensures positive value even with zero income. Exception: line 12b (MFS spouse itemizes) OR line 12c (dual-status alien) forces standard deduction to $0 per spec §5.2 + IRC §63(c)(6).'],
  ['line13a ≥ 0 always', 'Negative QBI becomes a carryforward, NOT a negative deduction (per 13a #8 dual-semantic; IRC §199A(c)(2)).'],
  ['line13b ≥ 0 always', 'Schedule 1-A Parts II/III/IV/V are individually floored at zero (all use `max(0, capped − phaseout)`).'],
  ['If line13a is null (blocked by flag), line14 still computed using 0 for that component', 'Return remains partially valid; downstream tax computation can proceed.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 35 }, { wch: 70 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 14'],
  ['Line 14 has ONLY 3 operand inputs — all are computed outputs from upstream sub-line audits. No direct user-facing form inputs.'],
  [],
  ['#', 'Source', 'Field', 'Type', 'Role', 'Upstream audit / where computed'],
  [1, 'computed Deductions (line 12e)', 'deductionAmount', 'BigDecimal', 'Standard OR itemized deduction amount; operand 1 of line 14 sum', '12abcde cluster (closed 2026-05-13 via 12e #6 DEEP DOCUMENTATION ANCHOR at computeStandardDeduction ~line 3274; election via chooseLine12e ~line 3447)'],
  [2, 'computed Deductions (line 13a)', 'qualifiedBusinessIncomeDeduction', 'BigDecimal (nullable)', 'QBI deduction; operand 2 of line 14 sum. May be null when blocking flag prevents QBI (treated as 0 in sum).', '13a audit (closed 2026-05-13 via computeLine13a two-pass invocation; second-pass call at prepare() ~line 769; MFS-guarded per 13a #1)'],
  [3, 'computed Schedule1A (line 13b)', 'line38Total → form1040.deductions.additionalDeductions', 'BigDecimal', 'Schedule 1-A additional deductions; operand 3 of line 14 sum. Always ≥ 0 (Schedule 1-A parts individually floored).', '13b audit (closed 2026-05-13 via computeSchedule1A at ~line 20350; MFS-guarded per 13b #1)'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 60 }, { wch: 22 }, { wch: 75 }, { wch: 75 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Line 14 Has No Direct Constants'],
  ['Line 14 is purely additive — it uses no reference-data constants directly. All constants flow through the upstream sub-line audits (12abcde + 13a + 13b).'],
  [],
  ['Indirect reference-data flow', 'Through which upstream sub-line', 'Where centralized'],
  ['Standard deduction base ($15,750 / $23,625 / $31,500)', 'line 12e via computeStandardDeduction', 'ReferenceData.STANDARD_DEDUCTION_* (verified via 12e #8)'],
  ['Standard deduction age/blind addons ($1,600 MFJ/MFS/QSS, $2,000 Single/HOH)', 'line 12e via dependent worksheet + age-blind chart', 'ReferenceData.STANDARD_DEDUCTION_AGE_BLIND_* (verified via 12d audit)'],
  ['SALT cap ($40,000 / $20,000 MFS; OBBBA reduction)', 'line 12e via Schedule A line 5e', 'ReferenceData.SCHEDULE_A_SALT_* (verified via 12e #9)'],
  ['QBI thresholds ($394,600 MFJ / $197,300 other)', 'line 13a via shouldUseForm8995A', 'ReferenceData.QBI_THRESHOLD_* (verified via 13a #6)'],
  ['QBI phase-in range ($100k MFJ / $50k other)', 'line 13a via compute8995AQbiDeductionComponent', 'ReferenceData.QBI_PHASEIN_RANGE_* (verified via 13a #7)'],
  ['QBI deduction rate (20%)', 'line 13a via Form 8995 + 8995-A', 'ReferenceData.QBI_DEDUCTION_RATE (verified via 13a #6)'],
  ['Schedule 1-A tips/overtime caps ($25k / $12.5k / $25k MFJ)', 'line 13b via Part II + Part III', 'ReferenceData.SCHEDULE_1A_TIPS_CAP + SCHEDULE_1A_OVERTIME_CAP_* (verified via 13b #5 + #6)'],
  ['Schedule 1-A car loan cap ($10,000)', 'line 13b via Part IV', 'ReferenceData.SCHEDULE_1A_CAR_LOAN_CAP (verified via 13b #7)'],
  ['Schedule 1-A senior base ($6,000/person)', 'line 13b via Part V', 'ReferenceData.SCHEDULE_1A_SENIOR_BASE_PER_PERSON (verified via 13b #8)'],
  ['Schedule 1-A phaseout thresholds + rates', 'line 13b via Parts II-V phaseout helpers', 'ReferenceData.SCHEDULE_1A_*_PHASEOUT_* (verified via 13b #5-#8)'],
  [],
  ['Statutory anchors (indirect via upstream sub-lines)'],
  ['IRC §63 (standard deduction)', 'line 12e', '—'],
  ['IRC §199A (QBI deduction)', 'line 13a', '—'],
  ['OBBBA 2025 §A.II–V (Schedule 1-A)', 'line 13b', '—'],
  ['IRS 2025 Form 1040 page 2 line 14', 'line 14 itself ("Add lines 12e, 13a, and 13b")', '—'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 60 }, { wch: 50 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 14 Wiring Across 4 Sites'],
  ['Line 14 is set FOUR TIMES during compute via a progressive build-up: preliminary (first-pass) → incremental (Schedule 1-A wiring) → authoritative (second-pass success OR else degenerate). Each site overwrites the previous via setTotalDeductions.'],
  [],
  ['Site', 'Location', 'Computation', 'State after this site'],
  ['Site A — First-pass (computeLine12)', '~line 3428: `BigDecimal line14 = roundMoney(addNonNull(line12e, line13));`', 'line12e + line13a_preliminary  (line13b not yet known)', 'PRELIMINARY — 2-operand sum; placeholder pending Schedule 1-A computation'],
  ['Site B — Schedule 1-A wiring (prepare())', '~line 786-789: `setTotalDeductions(addNonNull(currentTotal, line13b))`', 'currentTotal (= Site A) + line13b', 'INTERIM AUTHORITATIVE — 3-operand sum with preliminary line13a'],
  ['Site C — Second-pass SUCCESS (prepare())', '~line 920-921: `BigDecimal newLine14 = roundMoney(addNonNull(addNonNull(line12eForSecondPass, newLine13a), schedule1A.getLine38Total()))`', 'line12e + line13a_corrected + line13b  (full 3-operand)', '★ FINAL AUTHORITATIVE — 3-operand sum with second-pass corrected line13a'],
  ['Site D — Second-pass ELSE branch (prepare())', '~line 942-943: `BigDecimal newLine14 = roundMoney(addNonNull(line12eForSecondPass, schedule1A.getLine38Total()))`', 'line12e + line13b  (line13a cleared to null)', '★ FINAL when second-pass blocked — 2-operand degenerate; line13a was nulled at line 940'],
  [],
  ['Output target', 'Where wired', 'Effect', 'XLS output reference'],
  ['form1040.deductions.totalDeductions', 'All 4 sites: deductions.setTotalDeductions(line14)', '★ CANONICAL line 14 output. BigDecimal; whole-dollar HALF_UP. Final value comes from Site C or Site D (whichever runs).', 'XLS/output_forms/form-tax-return-1040.xlsx (line 14 cell)'],
  ['form1040.deductions.taxableIncome (line 15 alias)', 'Sites B + C + D: deductions.setTaxableIncome(line15)', 'line15 = max(0, AGI − line14). Set alongside totalDeductions to keep in sync. Final value matches Site C or D.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 15 cell — alias path)'],
  ['form1040.deductions.line15TaxableIncome', 'Sites B + C + D: deductions.setLine15TaxableIncome(line15)', 'Canonical line 15 field (vs. taxableIncome alias). Same value as taxableIncome.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 15 cell — canonical path)'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 15 (taxable income)', '—', '★★ line15 = max(0, line11b − line14). ZERO-FLOOR rule applied here, not at line 14. First audit with formal zero-floor verification.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 15 cell)'],
  ['Form 1040 line 16 (tax)', '—', 'Indirect via line 15 → Tax Table / QDCG Worksheet / Tax Computation Worksheet / Form 8615 etc.', 'XLS/output_forms/form-tax-return-1040.xlsx (line 16 cell)'],
  ['Form 6251 AMTI starting point', '—', 'Taxable income (line 15) is the starting point for AMTI; line 14 indirectly affects AMT.', 'XLS/output_forms/form-tax-return-6251.xlsx'],
  ['Schedule D Tax Worksheet', '—', 'Uses line 15 for threshold comparisons.', '—'],
  ['Form 8880 Saver\'s Credit', '—', 'Uses taxable income (via AGI/line 15) for credit ceiling.', '—'],
  ['EIC computation', '—', 'Uses taxable income as phaseout reference.', '—'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 45 }, { wch: 65 }, { wch: 80 }, { wch: 80 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flagsSheet = [
  ['VALIDATION FLAGS — Line 14'],
  ['Line 14 emits NO blocking flags directly — it is purely additive. Blocking flags emitted by upstream sub-line computations (12abcde + 13a + 13b) determine which components are null vs computed, but line 14 itself never fails to compute (null components substitute as 0).'],
  [],
  ['Flag code', 'Severity', 'Condition', 'Where emitted'],
  ['(None at line 14 site)', 'N/A', 'Line 14 is a pure additive composite; no validation logic emits flags. Upstream blocking flags from 12abcde / 13a / 13b are passed through; line 14 still computes with null → 0 substitution.', 'No direct line-14 flag site exists'],
  [],
  ['DESIGN RATIONALE'],
  ['Note', 'Detail'],
  ['Defense via upstream flags', 'Line 13a may emit LINE13A_SELF_EMPLOYMENT_OUT_OF_SCOPE_*, LINE13A_COOPERATIVE_PATRON_UNSUPPORTED, etc. → line13a becomes null. Line 14 then sums line12e + 0 + line13b. The return remains partially valid; downstream tax computation can proceed.'],
  ['No "missing line 12e" failure mode', 'line12e is always computed (standard deduction floor ensures positive value). The only zero-value path is the hard-zero gate (line 12b OR line 12c) per spec §5.2.'],
  ['No "missing line 13b" failure mode', 'computeSchedule1A returns null when no Schedule 1-A inputs are present; downstream wiring treats null as 0 (Site B falls through; Site C/D sums use line38Total directly which is null → 0).'],
];

const ws5 = XLSX.utils.aoa_to_sheet(flagsSheet);
ws5['!cols'] = [{ wch: 50 }, { wch: 12 }, { wch: 100 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 14 is the 3-operand total deductions composite (line12e + line13a + line13b). 1st audit OUTSIDE the 13ab pair; first SEEDED → VERIFIED CORRECT upgrade in workflow. 10/10 issues below.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],

  [1, 'RESOLVED 2026-05-14 — CROSS-REFERENCE — NO MFS DEFENSIVE GAP at line 14 site (inline-computed; inherits MFS protection transitively from upstream sub-lines)',
    '**Closure applied** — pure audit-trail cross-reference; no code change; no new breadcrumb. Line 14 is INLINE-COMPUTED at 4 wiring sites (Site A: computeLine12 ~line 3428; Site B: Schedule 1-A wiring ~line 786-789; Site C: prepare() second-pass success ~line 920-921; Site D: prepare() second-pass else ~line 942-943). **NO separate orchestrator** (e.g., `computeLine14`) exists. **No additional MFS guard needed** — line 14 inherits MFS protection TRANSITIVELY from its 3 operands: (a) line12e via the 12abcde cluster (12a #1 SURGICAL guard at buildStandardDeductionIndicators + 12b/c/d/e structural inheritance); (b) line13a via 13a #1 MFS guard at computeLine13a call site (16th orchestrator); (c) line13b via 13b #1 MFS guard at computeSchedule1A call site (17th orchestrator). All 3 operands are MFS-correct before they sum into line 14; the sum itself cannot introduce new MFS leakage. **8th defensive-gap-NOT-needed Issue #1 in the workflow** (after 9 #1 + 11a #1 + 11b #1 + 12b/c/d/e #1; pattern: inline-computed line with no orchestrator → inherits MFS protection from upstream operands). Sibling-mate cross-reference to the upstream MFS guards at 12a #1 + 13a #1 + 13b #1. **MFS-guard cascade STAYS at 17 orchestrators** (no change; line 14 has no orchestrator). Coverage at the 4 wiring sites will come via Issues #5–#8 verified-correct breadcrumbs (Site C via the upgraded seed at Issue #4; Sites A/B/D via inline breadcrumbs); adding a redundant "no MFS guard needed here" comment at each site would be noise on top of verified-correct content. Backend tests: **762/762 unchanged**.',
    'TaxReturnComputeService.java:~3428 + ~786 + ~920 + ~942 (4 line-14 wiring sites; no orchestrator); upstream MFS guards at 12a #1 + 13a #1 + 13b #1',
    'CLOSED — cross-reference closure. 8th defensive-gap-NOT-needed Issue #1 in workflow. MFS-guard cascade UNCHANGED at 17 orchestrators (line 14 has no orchestrator). Coverage will come via Issues #5–#8 verified-correct breadcrumbs at the 4 wiring sites.'],

  [2, 'RESOLVED 2026-05-14 — DOCUMENTATION HYGIENE — CREATED missing dependencies/14.md file',
    '**Closure applied** — CREATED `C:\\us-tax\\dependencies\\14.md` (~150 lines) following the line-15 template pattern (the most structurally similar existing file). **Repo-wide check pre-closure**: lines/14.md ✓ exists; dependencies/14.md ✗ MISSING (the only gap in the 42-file dependencies/ directory; all other lines 1a-1z + 2ab + 3ab + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11ab + 12abcde + 13ab + 15-33 had files); knowledge_line14.md ✗ MISSING (acceptable for simple composite; line 14 doesn\'t warrant separate knowledge depth). **New file structure** (11 sections): (1) Header with tax year + last-updated; (2) Inputs — 3 operands with MFS-guard cross-references; (3) Computation — null-handling + no-floor rule; (4) Wiring sites — 4-site progressive build-up table (Sites A/B/C/D); (5) Outputs — totalDeductions field path; (6) PDF Fields — line 14 PDF cell; (7) Downstream Consumers — line 15 primary + line 16 / Form 6251 indirect; (8) Blocking Flags — none direct; (9) Compute Order — full chain from line 9 → line 15 with line-14 intermediate states; (10) Personal Forms / Statement Types — none direct; (11) Special Cases — 6 edge cases (null line13a, null line13b, hard-zero line12e, second-pass else, null AGI, line11b < line14). Plus Verified-Correct Sites table (cross-references to Issues #5-#8 breadcrumbs) and Audit History row. **Documentation gap CLOSED** — line 14 now has full parity with other audited lines. Pure documentation creation — no code change. Backend tests: **762/762 unchanged**.',
    'C:\\us-tax\\dependencies\\14.md (created with ~150 lines following line-15 template pattern)',
    'CLOSED — file created. Documentation gap closed; line 14 now has full parity with other audited lines (lines 1a-1z + 2ab + ... + 13ab + **14** + 15-33 all have dependencies files).'],

  [3, 'RESOLVED 2026-05-14 — SPEC ENHANCEMENT — Created Verification log section in lines/14.md (single-row; IN-PROGRESS until Issue #10)',
    '**Closure applied**: appended `## 8) Verification log` section to `lines/14.md` after section 7 (Forms checklist). Section includes a 5-column markdown table (Audit ID / Date / Closures applied / Backend regression / Outcome) with the first row capturing the 14 walkthrough state in IN-PROGRESS form (#1 cross-reference NO MFS gap + 8th defensive-gap-NOT-needed; #2 documentation hygiene CREATE dependencies/14.md closing the only gap in dependencies/; #3 this section creation; #4–#10 IN-PROGRESS; backend 762/762 unchanged). Will be finalized to "COMPLETE — 10/10 closed" after Issue #10 closes (append-then-finalize pattern from 13a #3 → 13a #10 / 13b #3 → 13b #10). **Single-row pattern** — single-line audit shape (no sub-lines to append rows for); smallest log shape in workflow (mirrors lines 8, 9, 10 single-line audits; contrasts with 13ab 2-row pair-aligned shape and 12abcde 5-row LARGEST cluster log). Backend tests: 762/762 unchanged (pure doc append; no functional impact).',
    'lines/14.md (Verification log section §8 appended; single-row IN-PROGRESS table; finalized COMPLETE by Issue #10)',
    'CLOSED — section §8 appended; row 1 written IN-PROGRESS. Will finalize to COMPLETE — 10/10 closed at Issue #10. Single-row pattern (smallest log shape; mirrors lines 8, 9, 10).'],

  [4, 'RESOLVED 2026-05-14 — SEED UPGRADE — 13a/b #4 PAIR COMPLETE seed → VERIFIED CORRECT (FIRST SEEDED → VERIFIED CORRECT upgrade pattern in workflow)',
    '**Closure applied** — FOUR edits to the existing breadcrumb at TaxReturnComputeService.java:~875 (~50 → ~75 lines): (1) **header timestamp update** — added `; UPGRADED → VERIFIED CORRECT via 14 audit, 2026-05-14` + added `dependencies/14.md (created via 14 #2)` and `lines/14.md §1` to spec citations; (2) **NEW ★ VERIFIED CORRECT block** (~25 lines) inserted AFTER the existing PAIR COMPLETE section — documents three lifecycle stages (SEEDED 2026-05-13 + EXTENDED 2026-05-13 + VERIFIED CORRECT 2026-05-14) + formula with full mathematical rationale (addNonNull + roundMoney + line14 ≥ 0 invariant) + ZERO-FLOOR-IS-DOWNSTREAM note (line15 = max(0, line11b − line14) implemented at ~line 925 + ~line 947) + Site C authoritative-writer designation with cross-references to 14 #5-#8 (Sites A/B/D) + 14 #9 (4-site progressive build-up observation) + 3-source coverage rationale (spec + dependencies/14.md + this breadcrumb; no 4th-source duplication); (3) **FUTURE EXTENSION POINTS flip** — "Future line 14 audit — upgrade..." → "Future line 14 audit — UPGRADED 2026-05-14 — VERIFIED CORRECT (14 #4)"; preserved PAIR COMPLETE milestone; (4) **NEW seed for line 15 audit** — added "Future line 15 audit — upgrade the downstream zero-floor reference at line-15 wiring sites (~line 795 + ~925 + ~947) to a VERIFIED CORRECT block" hook; establishes the next seed-lifecycle. **FIRST SEEDED → VERIFIED CORRECT upgrade pattern in the audit workflow** — closes the 3-stage seed lifecycle for the 13a/b #4 seed; establishes the template for future seed upgrades (10 #4 + 12a #4 still in PAIR/CLUSTER COMPLETE state; their respective upgrade audits at line 14 → already done; future audits will likely follow). Pure documentation closure — no functional change. Backend tests: **762/762 unchanged**.',
    'TaxReturnComputeService.java:~875 (13a #4 + 13b #4 PAIR COMPLETE seed; UPGRADED → VERIFIED CORRECT via 14 audit; breadcrumb grew from ~50 → ~75 lines)',
    'CLOSED — FIRST seed-lifecycle completion in workflow (SEEDED → EXTEND × N → VERIFIED CORRECT). 13a/b #4 hook closed; line-15 future-audit hook seeded.'],

  [5, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — Site C authoritative 3-operand sum (coverage via Issue #4 upgraded seed; 1st anti-duplication app in 14 walkthrough)',
    '**Closure applied** — pure xlsx-flip anti-duplication closure; no code change; no new breadcrumb. Site C at TaxReturnComputeService.java:~920-921 (`BigDecimal newLine14 = roundMoney(addNonNull(addNonNull(line12eForSecondPass, newLine13a), schedule1A.getLine38Total()))`) is the AUTHORITATIVE 3-operand sum that runs when computeLine13a second-pass succeeds. **Coverage already at 3 sources**: (1) `lines/14.md` §1 formula + null-handling + no-floor rule; (2) `dependencies/14.md` "Wiring sites" table designates Site C as ★ FINAL AUTHORITATIVE (created via 14 #2); (3) **upgraded 13a/b #4 seed breadcrumb at ~line 875** (applied at 14 #4) contains the full VERIFIED CORRECT block — formula with addNonNull-null-tolerance + roundMoney HALF_UP + line14 ≥ 0 invariant + zero-floor-downstream + Site C authoritative-writer designation + cross-references to 14 #5-#8 + anti-duplication rationale itself. Adding a 4th breadcrumb directly above Site C would duplicate the seed-upgrade content. **1st anti-duplication application in the 14 walkthrough** (after 5 prior anti-duplication closures in workflow: 12e #8 + 12e #9 + 13a #9 + 13b #9; pattern: "when 3-source coverage exists, defer additional breadcrumbs"). The Issue #5 row serves as audit-trail anchor for the "Site C verified correct" claim; the verification itself lives in the Issue #4 seed upgrade. Backend tests: **762/762 unchanged**.',
    'TaxReturnComputeService.java:~920-921 (Site C — authoritative second-pass success); coverage via upgraded seed at ~line 875 (Issue #4)',
    'CLOSED — pure anti-duplication. 1st anti-duplication app in 14 walkthrough (12e #8 + #9 + 13a #9 + 13b #9 precedents). Site C verified correct; 3-source coverage adequate (spec + dependencies + upgraded seed).'],

  [6, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — Site A: computeLine12 first-pass preliminary 2-operand sum (when-FINAL note + 3 rationale themes)',
    '**Closure applied**: added ~22-line VERIFIED CORRECT breadcrumb above Site A at TaxReturnComputeService.java:~3458 (`BigDecimal line14 = roundMoney(addNonNull(line12e, line13));`). Structure: (1) **Site A designation** — preliminary 2-operand sum; line13b NOT YET KNOWN (Schedule 1-A runs later); (2) **Cross-references to Sites B/C/D** — Site B at ~line 786 adds line13b; Site C at ~line 920 is authoritative 3-operand (see 14 #4 upgraded seed); Site D at ~line 942 is degenerate 2-operand on second-pass blocked/null; (3) **★ When-Site-A-is-FINAL note** — when `schedule1A == null` (no Schedule 1-A inputs), Sites B/C/D all skip (gated at ~line 766) → Site A\'s value IS the final value; simplest happy path (standard ± QBI; no tips/overtime/car loan/senior); (4) **3 rationale themes** for the preliminary write — (a) well-formed Line12Computation record (downstream code reads totalDeductions before Sites B/C/D run); (b) frontend response shape (Deductions object always valid); (c) mirrors 13a #5 two-pass contract (preliminary line13a pairs naturally with preliminary line14); (5) **Cross-references** to 13a #5 two-pass breadcrumb at ~line 763-766 + 14 #4 upgraded seed at Site C ~line 875 + dependencies/14.md "Wiring sites" table. Pure documentation closure — no functional change. Backend tests: **762/762 unchanged**.',
    'TaxReturnComputeService.java:~3458 (Site A — computeLine12 first-pass preliminary; ~22-line breadcrumb above the line14 assignment)',
    'CLOSED — verified correct. ~22-line breadcrumb documents preliminary 2-operand contract + when-Site-A-is-FINAL note + 3 rationale themes + cross-references to Sites B/C/D + 13a #5 + 14 #4.'],

  [7, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — Site B: Schedule 1-A wiring incremental-update + line13b (interim authoritative; two-branch null safety)',
    '**Closure applied**: added ~22-line VERIFIED CORRECT breadcrumb above Site B at TaxReturnComputeService.java:~786-789. Structure: (1) **Site B designation** — Schedule 1-A wiring; INCREMENTAL UPDATE pattern (read currentTotal → add line13b → write back); (2) **Two-branch null safety** — if-branch (currentTotal != null: line14 = currentTotal + line13b = line12e + line13a_preliminary + line13b); else-branch (currentTotal == null: line14 = line13b alone; degenerate); (3) **Why incremental-update HERE vs. recompute-from-scratch at Sites C/D** — currentTotal guaranteed to be Site A preliminary value (computeLine12 just ran); avoids re-reading line12e + line13a. Sites C/D need recompute-from-scratch because second-pass produces FRESH line13a (Site C) or CLEARS it (Site D); read-modify-write wouldn\'t work cleanly. Two-style coexistence is functionally correct but stylistically inconsistent — cross-reference to 14 #9 OBSERVATION on 4-site progressive build-up; (4) **★ INTERIM AUTHORITATIVE status** — when the second-pass block fires, Sites C (~line 920) or D (~line 942) WILL OVERWRITE this value; Site B\'s result is final ONLY when the second-pass block is skipped entirely (rare/practically does-not-happen on this code path); (5) **Cross-references** to Site A ~line 3458 (14 #6) + Site C ~line 920 + 14 #4 upgraded seed at ~line 875 + Site D ~line 942 (14 #8) + dependencies/14.md "Wiring sites" table. Pure documentation closure — no functional change. Backend tests: **762/762 unchanged**.',
    'TaxReturnComputeService.java:~786-789 (Site B — Schedule 1-A wiring; ~22-line breadcrumb above the if-branch)',
    'CLOSED — verified correct. ~22-line breadcrumb documents incremental-update pattern + two-branch null safety + interim-authoritative status + cross-references to Sites A/C/D + 14 #4 upgraded seed + 14 #9 observation on 4-site progressive build-up.'],

  [8, 'RESOLVED 2026-05-14 — VERIFIED CORRECT — Site D: prepare() second-pass else degenerate 2-operand sum (2 failure modes + line13a-clear consistency)',
    '**Closure applied**: added ~30-line VERIFIED CORRECT breadcrumb above Site D at TaxReturnComputeService.java:~992 (else branch of `if (corrected13a != null)` second-pass check). Structure: (1) **Site D designation** — second-pass else; degenerate 2-operand `line14 = line12e + line13b`; line13a explicitly cleared; (2) **★ TWO FAILURE MODES** both route here — **Mode 1** (no QBI workflow): MFS taxpayer with 13a #1 MFS guard null-shadow OR `hadQualifiedBusinessIncomeInputs=false`; computeLine13a short-circuits at entry-point gate (~line 3614); NO blocking flag emitted; **Mode 2** (QBI workflow blocked by validation flag): LINE13A_SELF_EMPLOYMENT_OUT_OF_SCOPE_* / LINE13A_COOPERATIVE_PATRON_UNSUPPORTED / LINE13A_MISSING_K1_*_199A_DETAILS_* / LINE13A_MANUAL/NEGATIVE/COMPLEX_*_THRESHOLD_UNSUPPORTED; flag emitted AND null returned; (3) **★ LINE 13a CLEAR rationale** — defense-in-depth + consistency: without the clear, deductions.qualifiedBusinessIncomeDeduction would retain the Site A preliminary value while line 14 was recomputed without it → inconsistent state; edge case prevented when line13b > 0 shifts taxIncBeforeQbi across a threshold (rare; flag conditions are mostly line13b-independent per 13a #5 flag-dedup rationale); (4) **form8995 + form8995A nulled** below — no QBI form attached; consistent with line13a = null; (5) **Cross-references** to 13a #1 MFS guard (Mode 1 path; ~line 3298 first-pass + ~line 802 second-pass) + 13a blocking-flag inventory (Mode 2; validateQbiStatementGating ~line 3879) + Sites A/B/C + 14 #4 upgraded seed at ~line 875 + dependencies/14.md "Wiring sites" + "Special Cases" tables. Pure documentation closure — no functional change. Backend tests: **762/762 unchanged**.',
    'TaxReturnComputeService.java:~992 (Site D — second-pass else degenerate; ~30-line breadcrumb above the if-form1040-deductions-not-null block)',
    'CLOSED — verified correct. ~30-line breadcrumb documents 2 failure modes (no QBI workflow + blocking-flag) + line13a-clear consistency rationale + form 8995/A null + cross-references to 13a #1 MFS guard + 13a blocking flags + Sites A/B/C + 14 #4 upgraded seed.'],

  [9, 'RESOLVED 2026-05-14 — OBSERVATION — 4-site progressive build-up vs single-site refactor candidate; functionally correct as-is',
    '**Closure applied** — pure observation; no code change; no new breadcrumb. **The observation**: line 14 is set FOUR TIMES during compute (Sites A → B → C/D) via a progressive build-up pattern. An ALTERNATIVE design would be a SINGLE end-of-prepare() computation: after all upstream sub-lines finalize, compute line14 once and write it once (single source of truth). **Historical reason for the 4-site pattern**: incremental evolution from 2024 → 2025. (a) 2024 design: line 14 = "Add lines 12 and 13a" (2-operand); computed once at Site A inside computeLine12; THAT was the only site. (b) 2025 design: line 14 = "Add lines 12e, 13a, and 13b" (3-operand); Site B was ADDED to wire in line 13b after Schedule 1-A; Site C was ADDED for the QBI second-pass (per 13a #5; needed because QBI taxable-income limitation uses line13b); Site D was ADDED for the QBI-blocked degenerate case; Site A was NOT REMOVED because it still populates the Line12Computation record for downstream code that reads totalDeductions before Sites B/C/D run + it remains the FINAL value when schedule1A == null (simplest taxpayer scenarios). **Functional correctness verified**: final value at Site C (or D) is the authoritative result; intermediate states from Sites A + B are overwritten when applicable. All 4 sites covered by the 762/762 test suite (single-line + 12abcde + 13a + 13b + 14 tests exercise each path). **Refactor risk vs benefit**: a single-site refactor would touch 4 sites + Line12Computation record + downstream consumers + ~5-10 tests; risk of subtle breakage outweighs the clarity benefit. **Documentation now exists** at each site via Issues #5-#8 breadcrumbs (Site C via 14 #4 upgraded seed; Sites A/B/D via inline breadcrumbs); future reader has the context. **Anti-fragmentation policy applied** — **11th Path A application** in the workflow (after 7a #9 + 8 #9 + 10 #9 + 11b #8 + 12a #9 + 12c #9 + 12d #9 + 13a #9 + 13b #9 + prior pair audits; pattern: "user-attested data / IRS-accepted approximation / spec-documented design / verified-correct-with-refactor-deferred — no new outstanding entry"). **Anti-fragmentation streak: 14 → 15 consecutive walkthroughs with zero new outstanding.md entries** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/**14**). Pure xlsx-flip audit-trail acknowledgment. Backend tests: **762/762 unchanged**.',
    'TaxReturnComputeService.java:~3458 + ~786 + ~920 + ~992 (4 sites; functionally correct refactor candidate); covered by Issues #5–#8 site breadcrumbs',
    'CLOSED — pure observation. **11th Path A application** (streak: 14 → 15 consecutive zero-outstanding walkthroughs). Future refactor candidate; no code change today; no new outstanding entry. Backend unchanged.'],

  [10, 'RESOLVED 2026-05-14 — BOUNDARY MILESTONE — Line 14 walkthrough COMPLETE; FIRST SEEDED → VERIFIED CORRECT upgrade in workflow; 15 consecutive zero-outstanding walkthroughs',
    'Pure xlsx-flip observation — **CLOSES the 14 walkthrough at 10/10**. **Six themes**: (1) **Structural positioning** — 1st audit OUTSIDE the 13ab pair; single-line composite audit (no sub-lines); first single-line audit since line 10 on 2026-05-12 (after 7 consecutive cluster/pair audits: 12a/b/c/d/e + 13a + 13b spanning 2026-05-13). Returns workflow to the "single-line phase" (15/16/17 likely also single-line). (2) **★ FIRST SEEDED → VERIFIED CORRECT upgrade pattern in the workflow** (Issue #4) — establishes the 3-stage seed lifecycle: SEEDED → EXTENDED × N → VERIFIED CORRECT (at the auditing-line\'s own walkthrough). Three seeds completed seed-extend phase pre-14 (10 #4 PAIR × 2 + 12a #4 CLUSTER × 4 + 13a #4 PAIR × 1); today 13a/b #4 becomes FIRST seed to reach VERIFIED CORRECT state. 10 #4 + 12a #4 retrospectively could be similarly upgraded but their parent-line audits are already done; they remain in "PAIR/CLUSTER COMPLETE" state. New line-15 future-audit hook seeded today inside the upgraded breadcrumb. (3) **★ 8th defensive-gap-NOT-needed Issue #1** (Issue #1) — line 14 inline-computed at 4 wiring sites (Sites A/B/C/D); inherits MFS protection transitively from line12e (12abcde cluster + 12a #1 SURGICAL) + line13a (13a #1) + line13b (13b #1). MFS-guard cascade UNCHANGED at 17 orchestrators. (4) **★ Documentation gap closed** (Issue #2) — CREATED `dependencies/14.md` (~150 lines following line-15 template); line 14 was the ONLY gap in the 42-file dependencies/ directory (now 43 files; line 14 has full parity with all other audited lines). (5) **★ Anti-duplication pattern matured** (Issue #5) — 1st anti-duplication application in 14 walkthrough; Site C verified correct via Issue #4 upgraded seed (no 4th-source breadcrumb needed); pattern now at 5 applications total across workflow (12e #8 + 12e #9 + 13a #9 + 13b #9 + **14 #5**). (6) **Cumulative through line 14**: 40 lines audited (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + 11b + 12a + 12b + 12c + 12d + 12e + 13a + 13b + **14**); 397 audit issues closed total (387 + 10); backend **762/762** unchanged (pure documentation closure; no new tests; line 14 has no functional change at any wiring site); MFS cascade = **17 orchestrators (UNCHANGED)**; knowledge-file naming convergence = 20 lines (unchanged — no knowledge file for line 14, appropriate for simple composite); 11 Path A applications (+1 from 14 #9 refactor-deferred); 5 anti-duplication applications; FIRST SEEDED → VERIFIED CORRECT upgrade pattern. **15 consecutive walkthroughs with zero new outstanding.md entries** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/**14**). **Looking ahead — line 15 (taxable income; first audit with formal zero-floor verification)**: 2nd audit OUTSIDE 13ab pair. `line15 = max(0, line11b − line14)` — applies the ZERO-FLOOR rule at the line-15 site (line 14 deliberately has no floor per spec §1). Line 15 is also inline-computed (no separate orchestrator); will be 9th defensive-gap-NOT-needed Issue #1. Will use the line-15 future-audit upgrade hook seeded today via Issue #4 upgraded seed (~line 875). Multiple line-15 wiring sites (~795 + ~925 + ~947) → likely a parallel 3-site progressive-build-up audit similar to today.',
    'XLS/computations/14.xlsx audit-trail (this row); lines/14.md Verification log row FINALIZED to COMPLETE — 10/10 closed; dependencies/14.md created; upgraded seed at ~line 875',
    'CLOSED — 14 walkthrough complete (10/10). 40 lines audited cumulatively. FIRST SEEDED → VERIFIED CORRECT upgrade pattern in workflow. Line 15 (taxable income; zero-floor verification) queued next.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 115 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 14 Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.deductions.totalDeductions', 'Form 1040 page 2, line 14 (numeric box)', 'XLS/output_forms/form-tax-return-1040.xlsx', '★ CANONICAL line 14 output. BigDecimal; whole-dollar HALF_UP rounded. Set at 4 sites (A/B/C/D) progressively; final value comes from Site C or D.'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 15 (taxable income)', 'Form 1040 page 2, line 15 (numeric box)', 'XLS/output_forms/form-tax-return-1040.xlsx', '★★ line15 = max(0, line11b − line14). ZERO-FLOOR rule applied here, not at line 14. Wired alongside line 14 at Sites B/C/D.'],
  ['Form 1040 line 16 (tax)', 'Form 1040 page 2, line 16 (numeric box)', 'XLS/output_forms/form-tax-return-1040.xlsx', 'Indirect via line 15 → Tax Table / QDCG / TCW / Form 8615 / Foreign Earned Income Tax Worksheet.'],
  [],
  ['SECONDARY DOWNSTREAM'],
  ['Form 6251 (AMT)', 'Form 6251 line 1 (taxable income before NOL/QBI)', 'XLS/output_forms/form-tax-return-6251.xlsx', 'Taxable income (line 15) is the AMTI starting point.'],
  ['Schedule D Tax Worksheet', '—', '—', 'Uses line 15 for threshold comparisons.'],
  ['Form 8880 (Saver\'s Credit)', '—', '—', 'Uses AGI (line 11b) and taxable income (line 15) for credit ceiling.'],
  ['EIC computation', '—', '—', 'Uses taxable income as phaseout reference.'],
  [],
  ['NOT IN OUTPUT (deliberate exclusions per spec)'],
  ['Floor at zero', '—', '—', 'Per spec §1: line 14 has NO floor. The zero-floor rule is applied on line 15 only (line15 = max(0, AGI − line14)).'],
  ['Schedule A line 17 itemized (raw)', '—', '—', 'Flows through line 12e if itemizing; not directly into line 14.'],
  ['Form 8995 line 15 / Form 8995-A line 39 (raw QBI)', '—', '—', 'Flows through line 13a; not directly into line 14.'],
  ['Schedule 1-A line 38 (raw)', '—', '—', 'Flows through line 13b; not directly into line 14.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 60 }, { wch: 55 }, { wch: 55 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
