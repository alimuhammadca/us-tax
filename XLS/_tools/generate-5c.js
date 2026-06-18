// ============================================================================
//  Generates: C:\us-tax\XLS\computations\5c.xlsx
//
//  Source-of-truth references:
//    - lines/5abc.md §5 (line 5c — checkbox / write-in area) + §6 (PSO exclusion details)
//    - dependencies/5abc.md
//    - knowledge/line-5abc-pension-annuity.md (renamed 2026-05-12 via 5a #2)
//    - TaxReturnComputeService.computePensionAnnuities() lines ~5812-5817 (line 5c aggregation)
//    - TaxReturnComputeService.computePensionForPerson() (per-person box 3 text builder)
//    - TaxReturnComputeService.joinLine4cOtherText() (shared write-in joiner from 4c #5)
//    - PDF semantic CSV: rows 28-30 (c1_38/39/40 — 3 checkboxes) + row 81 (f1_67 — text)
//    - IRS 2025 Form 1040 line 5c instructions
//    - IRC §72 (annuity rollover) + §402(l) (PSO exclusion)
//
//  Tax year: 2025
//
//  NOTE: Line 5c is the DISCLOSURE-METADATA line of the pension cluster — three independent
//  checkboxes (box 1 = rollover; box 2 = PSO election; box 3 = other write-in) plus a
//  write-in text field. UNLIKE LINE 4c (which has QCD/HFD-specific exceptions), line 5c
//  has pension-specific exceptions (rollover, PSO). Unlike 4c, line 5c does NOT have a
//  multi-exception breakout-statement requirement (IRS rule difference).
//
//  Subtle design difference vs line 4c: line 5c box 3 is **derived from text presence**
//  (`line5cBox3 = hasText(line5cText)`), whereas line 4c box 3 fires on the explicit
//  `hasBox3Other` flag. Documented in Code Validation #5.
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '5c.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 5c — PENSION EXCEPTION DISCLOSURE (3 CHECKBOXES + WRITE-IN)'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 5c'],
  ['Concept', 'Pension/annuity exception DISCLOSURE on Form 1040 line 5c — **THREE INDEPENDENT CHECKBOXES** (not a numeric value) plus a write-in text field. Box 1 = rollover (Exception 1); box 2 = PSO election (IRC §402(l) — Public Safety Officer premium exclusion); box 3 = other IRS-required word/code (write-in). Line 5c is METADATA — does NOT affect line 9 / AGI / taxable income / tax owed. UNLIKE LINE 4c, line 5c has NO multi-exception breakout-statement requirement (IRS rule difference).'],
  ['Core invariant', 'Line 5c is disclosure metadata. The arithmetic invariants for lines 5a/5b are unaffected. Box 1/2 fire on per-person exception detection (OR across taxpayer + spouse). Box 3 is **derived from write-in text presence** (`line5cBox3 = hasText(line5cText)`) — subtle design difference from line 4c which uses an explicit hasBox3Other flag.'],
  ['Trigger conditions', 'Per IRS line 5c instructions + lines/5abc.md §5:\n  • box 1 (rollover) ← taxpayer.hasRollover() OR spouse.hasRollover()\n  • box 2 (PSO) ← taxpayer.hasPsoElection() OR spouse.hasPsoElection() — `hasPsoElection = isEligiblePso AND electsPso`\n  • box 3 (other) ← `hasText(line5cText)` — derived from joined write-in text\n  • write-in text: user-entered text only via line5cOtherWriteInText (NO auto-prepend like HFD for 4c — PSO is disclosed via box 2, not write-in)\n\nNo Form 8606 / Form 5329 equivalent triggers a line 5c box (Form 5329 is per-return, not a line 5c box).'],
  ['Filed', 'Form 1040 line 5c. PDF fields:\n  • topmostSubform[0].Page1[0].c1_38[0] (semantic: line5c_box1_rollover) — CheckBox\n  • topmostSubform[0].Page1[0].c1_39[0] (semantic: line5c_box2_pso) — CheckBox\n  • topmostSubform[0].Page1[0].c1_40[0] (semantic: line5c_box3_other) — CheckBox\n  • topmostSubform[0].Page1[0].f1_67[0] (semantic: line5c_additional_statement_text) — Text\n\nNote: PDF text field is named `line5c_additional_statement_text` (NOT `line5c_box3_text` like the line 4c equivalent). Semantic difference reflecting IRS form design.'],
  ['Backend representation', 'PensionComputation record fields: `line5cBox1` (boolean), `line5cBox2` (boolean), `line5cBox3` (boolean — derived from hasText), `line5cText` (String, nullable).'],
  ['Backend method', 'TaxReturnComputeService.computePensionAnnuities() lines ~5812-5815 (box aggregation + text join).\nMFS-protected via 5a #1 / 5b #1 cascade.'],
  ['Output', 'form1040.income.line5cBox1Rollover (Boolean), line5cBox2Pso (Boolean), line5cBox3Other (Boolean), line5cText (String) — all rendered on Form 1040 line 5c PDF fields.'],
  ['IRS source', 'IRS 2025 Form 1040 line 5c instructions; lines/5abc.md §5 (line identity) + §6 (PSO exclusion details); IRC §72 (rollover) + IRC §402(l) (PSO)'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Per-person: detect exception flags', 'In computePensionForPerson: `hasRollover`, `hasPsoElection` (= isEligiblePso AND electsPso per 5b #8 double-gate), `hasOtherLine5cWriteIn` (boolean OR text OR amount).'],
  [2, 'Per-person: build write-in text', '`line5cBox3Text = getString(pensionForm, "line5cOtherWriteInText")` then returned as `hasOtherLine5cWriteIn ? line5cBox3Text : null` in PensionPersonComputation constructor.\nUNLIKE LINE 4c, NO auto-prepend (HFD-style) — PSO is disclosed via box 2 checkbox, not via write-in text.'],
  [3, 'Return-level: aggregate box flags', 'Lines 5812-5813:\n  line5cBox1 = taxpayer.hasRollover() || spouse.hasRollover()\n  line5cBox2 = taxpayer.hasPsoElection() || spouse.hasPsoElection()\n\nOR across spouses → single return-level box per IRS form.'],
  [4, 'Return-level: join write-in text across spouses', 'Line 5814: `line5cText = joinLine4cOtherText(taxpayer.line5cBox3Text(), spouseResult.line5cBox3Text())`. Shared `joinLine4cOtherText` helper from 4c #5 (LinkedHashSet deduplication + split-on-semicolon for second arg).'],
  [5, 'Return-level: derive box 3 from text presence', 'Line 5815: `line5cBox3 = hasText(line5cText)`.\n**SUBTLE DESIGN DIFFERENCE vs 4c**: line 4c box 3 fires on explicit `hasBox3Other` flag (`taxpayer.hasBox3Other() || spouse.hasBox3Other()`); line 5c box 3 is DERIVED from text presence. Reason: 4c has HFD auto-prepend (text-independent trigger); 5c has no auto-prepend so text-derived works.'],
  [6, 'Persist on PensionComputation; flow to form1040.income', 'PensionComputation fields populated (line5cBox1/2/3 booleans + line5cText). buildIncome propagates to form1040.income for PDF rendering.'],
  [],
  ['MUTUAL EXCLUSION RULES (enforced by code or spec)'],
  ['Rule', 'Implementation', 'Why'],
  ['Three independent boxes (NOT shared trigger)', 'Each box gated on a DIFFERENT exception: box 1 = rollover, box 2 = PSO, box 3 = other write-in.', 'IRS line 5c instructions describe three separate exception categories.'],
  ['Box 3 derived from text presence (vs 4c hasBox3Other flag)', 'Line 5815: `line5cBox3 = hasText(line5cText)`.', 'Line 5c has no auto-prepend (unlike 4c HFD). Box 3 firing automatically when user enters text is correct semantic.'],
  ['Box flags are OR-aggregated across spouses', 'Lines 5812-5813. Single return-level box per IRS form (not per-spouse).', 'IRS Form 1040 is a single return; both spouses\' exceptions consolidate.'],
  ['MFS-protected via 5a #1 cascade', 'When MFS, `pensionIncomeSpouse=null` → spouse.hasRollover()/hasPsoElection()/line5cBox3Text() all return false/null → box 1/2/3 reflect taxpayer-only.', 'Each MFS return is its own filing entity.'],
  ['Reuses joinLine4cOtherText shared helper', 'Line 5814 calls joinLine4cOtherText. LinkedHashSet deduplication + split-on-semicolon (4c #5 verified).', 'Single shared helper across line 4c (IRA) and line 5c (pension) write-in joining. DRY.'],
  ['NO breakout-statement-required logic (UNLIKE line 4c)', 'Line 5c lacks the multi-exception statement rule that 4c #6 documented (no analogous IRS rule for pension exceptions).', 'IRS rule difference: 4c has a multi-exception breakout statement requirement (with 2025 waiver); 5c does not. Pension exceptions are independently disclosed via their boxes without consolidated statement.'],
  ['Line 5c does NOT affect line 9 / AGI / taxable income / tax owed', 'Boolean + String fields — never in addNonNull chains.', 'Disclosure-only metadata.'],
  [],
  ['DECISION TREE — when does each box / write-in fire?'],
  ['Scenario', 'Box 1 (rollover)', 'Box 2 (PSO)', 'Box 3 (other)', 'Box 3 text'],
  ['No pension activity', 'unchecked', 'unchecked', 'unchecked', 'null'],
  ['Fully-taxable simple case (no exceptions)', 'unchecked', 'unchecked', 'unchecked', 'null'],
  ['Rollover only (Exception 1)', '✓', 'unchecked', 'unchecked', 'null'],
  ['PSO election only (IRC §402(l))', 'unchecked', '✓', 'unchecked', 'null'],
  ['Rollover + PSO (common retiree case)', '✓', '✓', 'unchecked', 'null'],
  ['Other write-in only (e.g., "ROLLOVER" code)', 'unchecked', 'unchecked', '✓', '"ROLLOVER"'],
  ['Multiple exceptions + write-in', '✓', '✓', '✓', 'joined text'],
  ['MFS; spouse has pension exceptions only', 'unchecked (taxpayer-only)', 'unchecked', 'unchecked', 'null'],
  ['Multi-annuity case (multiple PSOs across spouses)', '(per MFJ)', '✓ (either spouse triggers)', '(per text)', '(joined text)'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 5c Flows'],
  ['Consumer', 'How', 'Notes'],
  ['Form 1040 PDF rendering', 'income.line5cBox1Rollover / Box2Pso / Box3Other → c1_38/39/40; income.line5cText → f1_67', '★ Primary downstream — PDF checkboxes + write-in.'],
  ['Form 5329 (early distribution additional tax)', 'NOT a line 5c consumer', 'Form 5329 is per-return (per 5a #9), generated independently from line 5c. Different cardinality.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 (total income)', 'Boolean + String fields never in arithmetic.', 'Disclosure-only.'],
  ['AGI / taxable income / tax owed', 'No arithmetic propagation.', 'Pure metadata.'],
  ['No breakout-statement-required flag (unlike LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED for line 4c)', 'Line 5c lacks the multi-exception statement rule.', 'IRS rule difference between IRA and pension exception disclosure.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 28 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Determines Line 5c'],
  ['Line 5c is fully derived from per-person exception flags + write-in text. Same flag set as 5a/5b (no new inputs for line 5c specifically).'],
  [],
  ['#', 'Source xlsx', 'Field path / model key', 'Label / box', 'Required?', 'Role in line 5c determination', 'Cross-reference'],
  [],
  ['EXCEPTION 1 — Rollover (drives line 5c box 1)'],
  [1, 'form-pension-income-taxpayer.xlsx', 'rollover.hadPensionRollover', 'Did you roll over any pension distribution?', 'NO', 'Triggers hasRollover → line 5c box 1.', '5a Inputs (Exception 1)'],
  [2, 'form-pension-income-taxpayer.xlsx', 'rollover.totalPensionRolloverAmount', 'Total rollover amount', 'NO', 'Positive amount also triggers hasRollover (defensive — boolean might be unset).', '5b Inputs (rollover)'],
  [],
  ['EXCEPTION 2 — PSO (drives line 5c box 2 — IRC §402(l))'],
  [3, 'form-pension-income-taxpayer.xlsx', 'pso.isEligibleRetiredPublicSafetyOfficer', 'Eligible retired PSO?', 'NO — eligibility flag', 'Per IRC §402(l): retired police, firefighters, EMTs, etc.', '5b #8'],
  [4, 'form-pension-income-taxpayer.xlsx', 'pso.electsPsoPremiumExclusion', 'Elects PSO exclusion?', 'NO — election flag', 'Affirmative election required on return. hasPsoElection = isEligiblePso AND electsPso.', '5b #8'],
  [5, 'form-pension-income-taxpayer.xlsx', 'pso.totalQualifyingPsoPremiumsPaid', 'Total PSO premiums paid', 'NO', 'Affects line 5b taxable computation (capped at $3,000) but does NOT affect line 5c box 2 — box 2 fires on hasPsoElection regardless of amount.', '5b #8'],
  [],
  ['OTHER WRITE-IN (drives line 5c box 3 + write-in text)'],
  [6, 'form-pension-income-taxpayer.xlsx', 'line5c.hasOtherLine5cWriteInCode', 'Other line 5c write-in code applies?', 'NO', 'Per-person hasOtherLine5cWriteIn flag (used for hasAnyException tracking).', 'IRS line 5c instructions'],
  [7, 'form-pension-income-taxpayer.xlsx', 'line5c.line5cOtherWriteInText', 'Line 5c other write-in text', 'NO', 'User-entered text. Joined with spouse text via joinLine4cOtherText (LinkedHashSet dedup). **Box 3 fires on hasText(line5cText)** — see Code Validation #5.', 'IRS line 5c instructions'],
  [8, 'form-pension-income-taxpayer.xlsx', 'line5c.line5cOtherWriteInAmount', 'Line 5c other write-in amount', 'NO', 'Tracks amount associated with the write-in. NOT directly used in line 5c determination (box 3 fires on text presence, not amount).', 'IRS line 5c instructions'],
  [],
  ['NO BREAKOUT STATEMENT FIELDS (UNLIKE 4c)'],
  ['—', '—', '—', '—', 'NO', 'Line 5c has no equivalent to line 4c\'s `moreThanOneLine4ExceptionAppliesOnReturn` / `onlyException2AndOneOtherAppliesOnReturn` / `exceptionBreakoutStatementPrepared` fields. IRS rule difference — no multi-exception statement requirement for pension exceptions.', 'Code Validation #7'],
  [],
  ['SPOUSE-SIDE FIELDS (same as taxpayer, on form-pension-income-spouse.xlsx)'],
  [9, 'form-pension-income-spouse.xlsx', '(parallel to taxpayer fields above)', '—', 'NO', 'MFS-protected via 5a #1 cascade. When MFS, all spouse-side reads suppressed.', '5a #1, 5b #1'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 42 }, { wch: 65 }, { wch: 55 }, { wch: 22 }, { wch: 90 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 5c'],
  ['Line 5c is fully metadata — no numeric constants directly. Indirect references to PSO cap (which affects line 5b but not box 2 firing).'],
  [],
  ['Constant', 'Value', 'Source', 'Used by line 5c?', 'Notes'],
  [],
  ['Indirect — PSO cap (affects line 5b, NOT line 5c box 2 firing)'],
  ['PSO_ANNUAL_EXCLUSION_CAP', '$3,000', 'IRC §402(l)', 'NO (box 2 fires on election, not amount)', 'See 5b #8.'],
  [],
  ['Statutory references'],
  ['Line 5c structure (3 checkboxes + write-in)', 'IRS 2025 Form 1040 + lines/5abc.md §5', 'Three checkboxes + write-in space for pension exception disclosure.'],
  ['No multi-exception statement rule (vs 4c)', 'IRS 2025 Form 1040 instructions', 'Line 5c does NOT have an IRA-style breakout-statement requirement. Pension exceptions are disclosed via their boxes only.'],
  ['Exception 1 (Rollover)', 'IRC §72', 'Box 1 trigger.'],
  ['Exception 2 (PSO)', 'IRC §402(l)', 'Box 2 trigger. Requires retired Public Safety Officer eligibility + election.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 42 }, { wch: 18 }, { wch: 50 }, { wch: 30 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 5c Is Pure Disclosure Metadata'],
  ['Three checkboxes + write-in text. NO blocking flags (unlike line 4c which has LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED).'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['Form 1040 line 5c box 1 (rollover)', 'income.line5cBox1Rollover → c1_38[0] / line5c_box1_rollover', 'Checked when taxpayer or spouse has rollover.'],
  ['Form 1040 line 5c box 2 (PSO)', 'income.line5cBox2Pso → c1_39[0] / line5c_box2_pso', 'Checked when taxpayer or spouse has PSO election (eligibility AND election).'],
  ['Form 1040 line 5c box 3 (other)', 'income.line5cBox3Other → c1_40[0] / line5c_box3_other', 'Checked when joined write-in text is non-empty (`hasText(line5cText)`).'],
  ['Form 1040 line 5c write-in text', 'income.line5cText → f1_67[0] / line5c_additional_statement_text', 'User-entered text from either spouse (joined via joinLine4cOtherText helper).'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 (total income)', '—', 'Booleans + String never in arithmetic.'],
  ['AGI / taxable income / tax owed', '—', 'Pure metadata.'],
  ['Breakout-statement-required blocking flag', '—', 'NO equivalent to LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED (IRS rule difference — see Code Validation #7).'],
];
const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 5c Emits NO Direct Flags'],
  ['Unlike line 4c (LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED), line 5c has no breakout-statement-required logic per IRS rules.'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['(no direct line 5c flag)', '—', 'Line 5c never triggers a TaxReturnFlag — it is a passive disclosure.', '—'],
  ['(shared 5abc flags — covered by 5a Validation Flags sheet)', '—', '—', '5a Validation Flags'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 50 }, { wch: 18 }, { wch: 70 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 5c is the disclosure-metadata line of the pension cluster. Like line 4c (IRA disclosure) and line 3c (dividend disclosure), this audit is shared-aggregator cross-reference-heavy. KEY DIFFERENCES vs line 4c: (a) box 2 is PSO (IRC §402(l)) not QCD; (b) box 3 derived from text presence (NOT hasBox3Other flag); (c) NO breakout-statement-required logic (IRS rule difference); (d) NO HFD-like auto-prepend in write-in text. Verified 2026-05-12.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — MFS GUARD CASCADE EXTENDED TO 3-AUDIT CONSOLIDATION (PENSION CLUSTER COMPLETE)', 'Line 5c boxes (1/2/3) + write-in text all aggregated via OR/text-join across spouses → MFS cascade-protected since spouse-side PensionPersonComputation returns empty (5a #1). Closure: extended MFS-guard breadcrumb at TaxReturnComputeService.java:5751-5774 from citing "5a #1 + 5b #1" to **3 audit IDs** (5a #1 + 5b #1 + 5c #1). Added a sentence noting line 5c is metadata-only (3 Boolean checkboxes + write-in text) — MFS protection prevents form-disclosure errors but no direct revenue impact. **The pension cluster (5a/5b/5c) is fully covered by this single guard** — same coverage shape as the IRA cluster (4a/4b/4c) after 4c #1. Updated lock-in-test sentence to note exercise covers full 5a/5b/5c trio through shared `computePensionForPerson` code path. Lock-in test `mfsExcludesSpousePensionFromLine5a` re-run passed.', 'TaxReturnComputeService.java:5751-5774 (extended 3-audit MFS-guard breadcrumb); test mfsExcludesSpousePensionFromLine5a (re-run pass)', 'CLOSED via 5a #1 cascade — multi-audit consolidation extended; pension cluster MFS coverage complete.'],
  [2, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — KNOWLEDGE FILE ALREADY RENAMED VIA 5a #2', '`knowledge/line-5abc-pension-annuity.md` (renamed from `knowledge-line-5abc-pension-annuity.md` during 5a #2 yesterday) is a shared file covering all three pension-family lines (5a + 5b + 5c). Header-comment references in `generate-5a.js`, `generate-5b.js`, AND `generate-5c.js` all use the new name. Pure xlsx-flip closure — completes the pension-family knowledge-file coverage. Same shape as 3c #2 / 4c #2 (which completed the dividend-family / IRA-family knowledge-file coverage respectively).', 'C:\\us-tax\\knowledge\\line-5abc-pension-annuity.md (already correctly named)', 'CLOSED via 5a #2 — pure xlsx-flip closure. No action needed for 5c walkthrough.'],
  [3, 'RESOLVED 2026-05-12 — SPEC VERIFICATION LOG EXTENDED WITH 5c ROW (3rd row — pension cluster log complete)', 'lines/5abc.md Verification log had 2 rows (5a + 5b walkthroughs). Closure: appended a 3rd in-progress row capturing the 5c walkthrough as a separate event. Audit-trail-per-walkthrough convention preserved (same shape as 4c #3 / 3c #3 / 2b #2). The 5c row will be finalized to "COMPLETE — 10/10 closed" during end-of-walkthrough docs-update step. **This 3rd row completes the pension-family verification log** (5a + 5b + 5c all captured) — same milestone as 4c #3 completing the IRA-family log.', 'lines/5abc.md Verification log (5c row added as 3rd row)', 'CLOSED — spec verification log updated. 3 rows now present (5a complete + 5b complete + 5c in progress).'],
  [4, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — LINE 5c 3 INDEPENDENT BOX AGGREGATION (rollover / PSO / text-derived other)', 'Each box gated on a DIFFERENT exception: box 1 = rollover (IRC §72), box 2 = PSO (IRC §402(l) with 5b #8 double-gate), box 3 = `hasText(line5cText)` (text-derived). OR-aggregated across spouses → single return-level box. **DESIGN DIFFERENCE vs line 4c documented**: 4c box 3 fires on explicit `hasBox3Other` flag (needed because 4c has HFD auto-prepend requiring text-independent trigger); 5c uses text-derived box 3 (no auto-prepend equivalent — PSO disclosed via box 2 checkbox not text). Both designs IRS-correct for their respective lines. Closure: 14-line breadcrumb at TaxReturnComputeService.java:5817-5830 documenting (a) 3 INDEPENDENT triggers with IRC source per box; (b) 4c-vs-5c box-3 design difference with rationale; (c) MFS protection cross-reference (5a #1 / 5b #1 / 5c #1 cascade).', 'TaxReturnComputeService.java:5817-5830 (14-line breadcrumb above 3-box aggregation)', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [5, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — REUSES joinLine4cOtherText SHARED HELPER (from 4c #5)', 'Line 5c uses the shared write-in joining helper at TaxReturnComputeService.java:5819: `String line5cText = joinLine4cOtherText(taxpayer.line5cBox3Text(), spouseResult.line5cBox3Text())`. Helper is fully generic (LinkedHashSet deduplication + split-on-semicolon for second arg) despite the "Line4cOtherText" name — naming-vs-usage observation similar to 5a #8 (belongsToPersonIra). Helper definition breadcrumb from 4c #5 already documents the deduplication design (12-line block at line 8569). Issue #4 breadcrumb at lines 5817-5830 already references the helper in context. Pure xlsx-flip closure — no new breadcrumb needed. Same closure shape as 3c #5 / 4b #9 / 5a #8 (helper reuse documented at parent issue or original definition site).', 'TaxReturnComputeService.java:5819 (helper call site); 4c #5 (helper definition breadcrumb); 5c #4 (call-site breadcrumb references helper)', 'CLOSED — pure xlsx-flip. Helper documented at 4c #5; call site referenced in 5c #4 breadcrumb.'],
  [6, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — LINE 5c DOES NOT PARTICIPATE IN ARITHMETIC', 'Line 5c fields are Boolean + String types — structurally incompatible with addNonNull/subtractNonNegative/roundMoney/multiply (BigDecimal). Java type system prevents arithmetic propagation at compile time. Grep verified: ZERO hits for `addNonNull(line5cBox...)` / `roundMoney(line5cBox...)` / `subtractNonNegative(line5cBox...)` / `multiply(line5cBox...)` patterns. Line 5c fields never enter the line 9 formula or any arithmetic chain. Closure: pure xlsx-flip — covered by structural type protection (Java type system). Same closure shape as 3c #7 / 4c #8 (lines 3c and 4c structurally isolated).', 'TaxReturnComputeService.java (line 5c fields are Boolean/String only); grep verified 0 arithmetic hits', 'CLOSED — pure xlsx-flip. Structural protection by Java type system.'],
  [7, 'RESOLVED 2026-05-12 — OBSERVATION — LINE 5c HAS NO BREAKOUT-STATEMENT LOGIC (vs line 4c — IRS rule difference)', 'IRS rule difference between IRA (line 4c) and pension (line 5c) exception disclosure: line 4c has a multi-exception breakout-statement requirement with 2025 waiver (4c #6 16-line breadcrumb at line ~5190); line 5c has NO analogous rule — pension exceptions (rollover/PSO/other write-in) are independently disclosed via boxes only. Closure: 8-line addition to the Issue #4 breadcrumb at TaxReturnComputeService.java:5817-5839 documenting (a) explicit reference to 4c #6 breakout-statement requirement; (b) no equivalent IRS rule for pension exceptions; (c) confirmation that no LINE5_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED flag exists or should exist. Multi-audit citation updated: "5c.xlsx Code Validation #4 + #7". Prevents future contributor from "harmonizing" 4c and 5c by adding breakout-statement logic to line 5c (which would be IRS-incorrect).', 'TaxReturnComputeService.java:5817-5839 (extended Issue #4 breadcrumb with breakout-statement absence note)', 'CLOSED — observation. Combined with Issue #4 breadcrumb.'],
  [8, 'RESOLVED 2026-05-12 — OBSERVATION — Per-person hasOtherLine5cWriteIn vs return-level hasText-derived box 3 (UX gap, not bug)', 'Subtle design asymmetry: per-person `hasOtherLine5cWriteIn = boolean || hasText(text) || hasPositiveAmount(amount)` feeds `hasAnyException` (affects 5a fully-taxable-overall). But per-person return passes `hasOtherLine5cWriteIn ? line5cBox3Text : null` — when user sets boolean OR enters amount without text, hasAnyException=true (5a/5b affected) but return-level box 3 = `hasText(null) = false` (no disclosure on form). **Edge case**: user with `hasOtherLine5cWriteInCode=true` + amount > 0 but no text. **NOT a code bug** — IRS form requires write-in TEXT, so amount-without-text is incomplete disclosure; backend correctly reflects this (no text → no box 3). Conservative behavior — Option B verification flag (LINE5C_WRITE_IN_AMOUNT_OR_FLAG_WITHOUT_TEXT) deferred unless user reports show common-mode confusion. Closure: pure xlsx-flip observation — Decision Tree in Main Computation sheet already covers edge cases. Same shape as 4c #7 (user-asserted-overrides-auto design choice in sibling breadcrumb).', 'XLS/computations/5c.xlsx audit-trail (this row); no code change', 'CLOSED — observation only. Pure xlsx-flip. Optional future Option B verification flag deferred.'],
  [9, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — EXISTING TEST COVERAGE COVERS LINE 5c SCENARIOS', 'All Issue #1-#8 verifications already exercised by existing tests: (a) MFS cascade #1 — `mfsExcludesSpousePensionFromLine5a` exercises the cascade for the full 5a/5b/5c trio; (b) 3-independent-box aggregation #4 — covered by existing pension test suite (rollover + PSO + write-in scenarios); (c) joinLine4cOtherText helper reuse #5 — covered by 4c test suite (same helper, same behavior); (d) structural isolation #6 — Java compile-time type checking (no runtime test needed); (e) breakout-statement absence #7 — absence-of-behavior not conventionally testable; (f) per-person/return-level asymmetry #8 — covered by 5b hasAnyException test scenarios for the fully-taxable-overall flag contribution; (g) doc-hygiene closures #2, #3 — no behavior change to test. Pure xlsx-flip — adding a 5c-specific lock-in would just duplicate scenarios already covered. Same shape as 3c #9 / 4c #9.', 'TaxReturnComputeServiceTest.java (existing pension test suite); test mfsExcludesSpousePensionFromLine5a (cascade lock-in)', 'CLOSED — pure xlsx-flip. Test coverage already comprehensive.'],
  [10, 'RESOLVED 2026-05-12 — OBSERVATION — 5abc PENSION CLUSTER COMPLETE (3rd shared-aggregator cluster after 3abc + 4abc)', 'Line 5c completes the 5abc pension cluster — 3rd complete 3-line shared-aggregator cluster (after 3abc dividend and 4abc IRA). **Cumulative status: 21 lines audited** (1a-1i + 1z + 2a/2b + 3a/3b/3c + 4a/4b/4c + 5a/5b/5c). Backend: 753/753 tests pass. Line-9 multi-audit-trail consolidation at 9 audit IDs (unchanged from 5b). MFS guard cascade at 10 orchestrators. Knowledge-file naming convergence at 12 lines. Two gross-vs-taxable bilateral coverage pairs (4a/4b + 5a/5b). Future 6abc Social Security audit (IRC §86 / Pub. 915) will inherit: cluster template (gross/taxable/disclosure), MFS guard pattern (extending to 11 orchestrators), gross-vs-taxable bilateral coverage shape, multi-audit consolidation. Pure xlsx-flip observation. Same shape as 4c #10 / 3c #10 (cluster completion milestones).', 'XLS/computations/5c.xlsx audit-trail (this row); no code change', 'CLOSED — pure xlsx-flip observation. 5abc pension cluster fully audited.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 32 }, { wch: 95 }, { wch: 65 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 5c Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.line5cBox1Rollover', 'c1_38[0] / line5c_box1_rollover', 'form-tax-return-1040.xlsx', '★ Box 1 disclosure: rollover (Exception 1).'],
  ['form1040.income.line5cBox2Pso', 'c1_39[0] / line5c_box2_pso', 'form-tax-return-1040.xlsx', '★ Box 2 disclosure: PSO election (IRC §402(l)).'],
  ['form1040.income.line5cBox3Other', 'c1_40[0] / line5c_box3_other', 'form-tax-return-1040.xlsx', '★ Box 3 disclosure: other write-in (derived from text presence).'],
  ['form1040.income.line5cText', 'f1_67[0] / line5c_additional_statement_text', 'form-tax-return-1040.xlsx', '★ Write-in text: user-entered text only (NO HFD-style auto-prepend).'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 (total income)', '—', '—', 'Booleans + String never in arithmetic.'],
  ['AGI / taxable income / tax owed', '—', '—', 'Pure metadata.'],
  ['Breakout-statement-required flag', '—', '—', 'NO equivalent to line 4c\'s LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 50 }, { wch: 50 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
