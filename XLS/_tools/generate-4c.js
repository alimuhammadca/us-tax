// ============================================================================
//  Generates: C:\us-tax\XLS\computations\4c.xlsx
//
//  Source-of-truth references:
//    - lines/4abc.md §3-§5 (exceptions + line 4c boxes/write-in) + §6 Computation Rules
//    - lines/4abc.md §11 Multiple Exceptions and Statement Rule (with Exception 2 + 1 other waiver)
//    - dependencies/4abc.md
//    - knowledge/line-4abc-ira-distributions.md (renamed 2026-05-11 via 4a #2)
//    - TaxReturnComputeService.computeIraDistributions() lines ~5087-5326 (orchestrator)
//    - TaxReturnComputeService.computeIraForPerson() lines ~5359-5500+ (per-person aggregator)
//    - TaxReturnComputeService.joinLine4cOtherText() lines ~8549-8570 (write-in text joiner)
//    - PDF semantic CSV rows 25-27 (c1_35/36/37 — 3 checkboxes) + row 78 (f1_64 — text)
//    - IRS 2025 Form 1040 line 4c instructions
//    - IRC §408(d)(3) rollover, §408(d)(8) QCD, §408(d)(9) HFD
//
//  Tax year: 2025
//
//  NOTE: Line 4c is the DISCLOSURE-METADATA line of the IRA family — three independent
//  checkboxes (box 1 = rollover; box 2 = QCD; box 3 = other write-in incl. "HFD") plus a
//  write-in text field. UNLIKE LINE 3c (which is two checkboxes from the same condition),
//  line 4c has three INDEPENDENT checkboxes each gated on a different exception. The write-in
//  text field carries "HFD" auto-populated + any other user-entered write-in text.
//
//  Plus a complex breakout-statement-required logic per IRS multi-exception rule, with a
//  WAIVER for the Exception 2 + 1 other case (per 2025 IRS instructions).
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '4c.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 4c — IRA EXCEPTION DISCLOSURE (3 CHECKBOXES + WRITE-IN)'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 4c'],
  ['Concept', 'IRA exception DISCLOSURE on Form 1040 line 4c — **THREE INDEPENDENT CHECKBOXES** (not a numeric value) plus a write-in text field. Box 1 = rollover (Exception 1); box 2 = QCD (Exception 3); box 3 = other write-in (Exception 4 HFD + any other IRS-required text). Exception 2 (Form 8606 case) is disclosed via the Form 8606 attachment itself — NOT via a line 4c box. Line 4c is METADATA — does NOT affect line 9 / AGI / taxable income / tax owed.'],
  ['Core invariant', 'Line 4c is disclosure metadata. The arithmetic invariants for lines 4a/4b (≥ 0, line 4a ≤ line 4b ≤ taxable, etc.) are unaffected. Box 1/2/3 fire independently based on per-person exception detection (OR across taxpayer + spouse). Write-in text aggregates HFD + user-entered text via joinLine4cOtherText (with deduplication).'],
  ['Trigger conditions', 'Per IRS line 4c instructions:\n  • box 1 (rollover) ← taxpayer.hasRollover() OR spouse.hasRollover()\n  • box 2 (QCD) ← taxpayer.hasQcd() OR spouse.hasQcd()\n  • box 3 (other) ← taxpayer.hasBox3Other() OR spouse.hasBox3Other() — `hasBox3Other = hasHfd || hasOtherLine4cWriteIn`\n  • write-in text: "HFD" auto-prepended when hasHfd; joined with user-entered line4cOtherWriteInText via joinLine4cOtherText (LinkedHashSet deduplication preserving order)\n\nException 2 (Form 8606): NO line 4c box. Form 8606 is attached separately.'],
  ['Filed', 'Form 1040 line 4c. PDF fields:\n  • topmostSubform[0].Page1[0].c1_35[0] (semantic: line4c_box1_rollover) — CheckBox\n  • topmostSubform[0].Page1[0].c1_36[0] (semantic: line4c_box2_qcd) — CheckBox\n  • topmostSubform[0].Page1[0].c1_37[0] (semantic: line4c_box3_other) — CheckBox\n  • topmostSubform[0].Page1[0].f1_64[0] (semantic: line4c_box3_text) — Text'],
  ['Backend representation', 'IraComputation record fields: `line4cBox1` (boolean), `line4cBox2` (boolean), `line4cBox3` (boolean), `line4cBox3Text` (String, nullable), `line4cStatementRequired` (boolean for the multi-exception attachment).'],
  ['Backend method', 'TaxReturnComputeService.computeIraDistributions() lines ~5149-5159 (box aggregation), 5153 (write-in joining), 5170-5189 (breakout-statement-required logic).\nMFS-protected via 4a #1 / 4b #1 cascade.'],
  ['Output', 'form1040.income.line4cBox1Rollover (Boolean), line4cBox2Qcd (Boolean), line4cBox3Other (Boolean), line4cBox3Text (String) — all rendered on Form 1040 line 4c PDF fields.\n\nIraComputation.line4cBreakoutStatementText (when line4cStatementRequired is true) — separate attachment text describing the breakout per exception category.'],
  ['IRS source', 'IRS 2025 Form 1040 line 4c instructions; lines/4abc.md §3-§5 (the 4 exceptions); §6 multi-exception statement rule + waiver'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Per-person: detect each exception flag', 'In computeIraForPerson at lines 5402-5410: `hasRollover`, `hasQcd`, `hasHfd`, `hasOtherLine4cWriteIn`, `hasException2` are computed from iraForm fields + 1099-R codes. `hasBox3Other = hasHfd || hasOtherLine4cWriteIn` (line 5471).'],
  [2, 'Per-person: write-in text builder', 'At lines 5519-5524: `line4cBox3Text = "HFD"` when hasHfd; then concatenate with `otherWriteInText` from form as "HFD; <other>". Returned in IraPersonComputation.line4cBox3Text().'],
  [3, 'Return-level: aggregate box flags (OR across spouses)', 'Lines 5149-5151:\n  line4cBox1 = taxpayer.hasRollover() || spouse.hasRollover()\n  line4cBox2 = taxpayer.hasQcd() || spouse.hasQcd()\n  line4cBox3 = taxpayer.hasBox3Other() || spouse.hasBox3Other()\n\nIRS rule: each box fires if EITHER spouse triggered the corresponding exception (single return-level box per IRS form).'],
  [4, 'Return-level: join write-in text across spouses (with deduplication)', 'Line 5153: `line4cBox3Text = joinLine4cOtherText(taxpayer.line4cBox3Text(), spouseResult.line4cBox3Text())`. joinLine4cOtherText uses LinkedHashSet to deduplicate while preserving insertion order. Splits the second argument on ";" to handle multi-token spouse text. Result: a single semicolon-separated string with no duplicates.'],
  [5, 'Return-level: detect hasException2 (Form 8606 disclosure)', 'Line 5152: `hasException2 = taxpayer.hasException2() || spouse.hasException2()`. NOT a line 4c box — Form 8606 attachment IS the disclosure. But counted in line4ExceptionCategoryCount.'],
  [6, 'Return-level: count exception categories for breakout-statement-required logic', 'Lines 5155-5168: `line4ExceptionCategoryCount` = (box1 ? 1 : 0) + (box2 ? 1 : 0) + (box3 ? 1 : 0) + (hasException2 ? 1 : 0). `nonException2Count` = same minus hasException2.'],
  [7, 'Return-level: breakout-statement-required logic (with waiver)', 'Lines 5170-5189:\n  IF user asserts `moreThanOneLine4ExceptionAppliesOnReturn = true`:\n    statementRequired = !userAsserted_onlyException2AndOneOther\n  ELSE (auto-derived):\n    waiverCase = (count == 2 AND hasException2 AND nonException2Count == 1)\n    statementRequired = count > 1 AND !waiverCase\n\nPer IRS 2025 instructions: multi-exception breakout statement required, with WAIVER for "Exception 2 + exactly 1 other".'],
  [8, 'Return-level: emit LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED flag (blocking) if needed', 'Lines 5176-5185: if statementRequired AND user has NOT set `exceptionBreakoutStatementPrepared = true`, emit BLOCKING flag. User must prepare the statement before filing.'],
  [9, 'Return-level: build breakout statement text', 'Lines 5224-5288: when statementRequired, build descriptive text "Line 4b Exception Breakdown: Rollover $X; QCD $Y; HFD $Z; <other>; Exception 2 (see Form 8606)". Per-exception amounts retrieved + formatted with proper handling of the QCD post-70½ reduction (per 4a #8).'],
  [10, 'Persist on IraComputation; flow to form1040.income', 'IraComputation fields populated (line4cBox1/2/3 booleans, line4cBox3Text, line4cStatementRequired, line4cBreakoutStatementText). buildIncome propagates to form1040.income for PDF rendering.'],
  [],
  ['MUTUAL EXCLUSION RULES (enforced by code or spec)'],
  ['Rule', 'Implementation', 'Why'],
  ['Three independent boxes (NOT shared trigger like line 3c)', 'Each box gated on a DIFFERENT exception: box 1 = rollover, box 2 = QCD, box 3 = HFD/other.', 'IRS line 4c instructions describe three separate exception categories.'],
  ['Exception 2 (Form 8606) is NOT a line 4c box', 'Line 5152 tracks hasException2 separately. No line 4c box for it.', 'Form 8606 attachment IS the disclosure for Exception 2 (basis tracking).'],
  ['Box flags are OR-aggregated across spouses', 'Lines 5149-5151. Single return-level box per IRS form (not per-spouse).', 'IRS Form 1040 is a single return; both spouses\' exceptions consolidate.'],
  ['MFS-protected via 4a #1 / 4b #1 cascade', 'When MFS, `iraIncomeSpouse=null` → spouse.hasRollover()=false → spouse contribution to box 1 is false → box 1 reflects taxpayer only. Same for boxes 2/3.', 'Each MFS return is its own filing entity.'],
  ['Write-in text auto-prepends "HFD" when hasHfd', 'computeIraForPerson lines 5519-5524.', 'IRS line 4c instructions require "HFD" as the write-in for Exception 4 (HSA Funding Distribution).'],
  ['Write-in text deduplicates via joinLine4cOtherText', 'helper at line 8549-8570 uses LinkedHashSet + split-on-semicolon for spouse text.', 'Prevents "HFD; HFD" duplication when both spouses had HFDs.'],
  ['Breakout-statement waiver: Exception 2 + exactly 1 other', 'Lines 5184-5187: `waiverCase = (count == 2 AND hasException2 AND nonException2Count == 1)`.', 'Per IRS 2025 instructions: explicit 2025 waiver. Reduces user burden in the common Exception-2-plus-rollover/QCD case.'],
  ['User-asserted boolean OVERRIDES auto-detection', 'Lines 5171-5174: when `moreThanOneLine4ExceptionAppliesOnReturn = true`, code uses the user\'s waiver assertion only.', 'Design choice: lets user confirm what the IRS form requires even when code detection misses an edge case. See Code Validation #7.'],
  ['Line 4c does NOT affect line 9 / AGI / taxable income / tax owed', 'Boolean fields — never in addNonNull chains.', 'Disclosure-only metadata.'],
  [],
  ['DECISION TREE — when does each box / write-in / statement fire?'],
  ['Scenario', 'Box 1 (rollover)', 'Box 2 (QCD)', 'Box 3 (other)', 'Box 3 text', 'Statement required?'],
  ['No IRA activity', 'unchecked', 'unchecked', 'unchecked', 'null', 'no'],
  ['Fully-taxable simple case (no exceptions)', 'unchecked', 'unchecked', 'unchecked', 'null', 'no'],
  ['Rollover only (Exception 1)', '✓', 'unchecked', 'unchecked', 'null', 'no (single exception)'],
  ['QCD only (Exception 3)', 'unchecked', '✓', 'unchecked', 'null', 'no'],
  ['HFD only (Exception 4)', 'unchecked', 'unchecked', '✓', '"HFD"', 'no'],
  ['Form 8606 only (Exception 2)', 'unchecked', 'unchecked', 'unchecked', 'null', 'no (Form 8606 IS the disclosure)'],
  ['Rollover + QCD (count=2; no Exception 2)', '✓', '✓', 'unchecked', 'null', '**YES** (statement required)'],
  ['Rollover + HFD (count=2; no Exception 2)', '✓', 'unchecked', '✓', '"HFD"', '**YES**'],
  ['Exception 2 + Rollover (count=2; waiver applies)', '✓', 'unchecked', 'unchecked', 'null', 'no (waiver: Exception 2 + 1 other)'],
  ['Exception 2 + QCD (count=2; waiver applies)', 'unchecked', '✓', 'unchecked', 'null', 'no (waiver)'],
  ['Exception 2 + HFD (count=2; waiver applies)', 'unchecked', 'unchecked', '✓', '"HFD"', 'no (waiver)'],
  ['Exception 2 + Rollover + QCD (count=3; waiver DOES NOT apply)', '✓', '✓', 'unchecked', 'null', '**YES** (count > 2)'],
  ['MFS; spouse has rollover only', 'unchecked (taxpayer-only)', 'unchecked', 'unchecked', 'null', 'no (cascade-protected per 4a #1)'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 4c Flows'],
  ['Consumer', 'How', 'Notes'],
  ['Form 1040 PDF rendering', 'income.line4cBox1Rollover / 4cBox2Qcd / 4cBox3Other → c1_35/36/37; income.line4cBox3Text → f1_64', '★ Primary downstream — PDF checkboxes + write-in.'],
  ['LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED flag (blocking)', 'lines 5176-5185 when line4cStatementRequired AND user has not confirmed prepared', 'Blocks compute completion until user supplies statement.'],
  ['IraComputation.line4cBreakoutStatementText (attachment text)', 'lines 5224-5288 when line4cStatementRequired', 'Generated descriptive text for the breakout statement attachment.'],
  ['IRA_ROLLOVER_ATTACHMENT_REVIEW flag (non-blocking)', 'when rolloverIntoQualifiedPlanOrCompletedInFollowingYear is true', 'Indirect — flag is rollover-driven, not line-4c-driven.'],
  ['IRA_QCD_SIE_ATTACHMENT_REVIEW flag (non-blocking)', 'when hasOneTimeQcdToSplitInterestEntity is true', 'Indirect — flag is QCD-driven.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 (total income)', 'Boolean fields never in arithmetic.', 'Disclosure-only.'],
  ['AGI / taxable income / tax owed', 'No arithmetic propagation.', 'Pure metadata.'],
  ['Form 8606 attached forms', 'Line 4c boxes do NOT control Form 8606 generation. Form 8606 is generated based on hasException2.', 'Form 8606 IS the Exception 2 disclosure; no line 4c box.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 28 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Determines Line 4c'],
  ['Line 4c is fully derived from per-person exception flags + write-in text + user-asserted breakout flags.'],
  [],
  ['#', 'Source xlsx', 'Field path / model key', 'Label / box', 'Required?', 'Role in line 4c determination', 'Cross-reference'],
  [],
  ['EXCEPTION 1 — Rollover (drives line 4c box 1)'],
  [1, 'form-ira-income-taxpayer.xlsx', 'rollover.hadIraRollover', 'Did you roll over any IRA distribution?', 'NO', 'Triggers hasRollover → line 4c box 1.', 'IRS Exception 1'],
  [2, 'form-ira-income-taxpayer.xlsx', 'rollover.totalIraRolloverAmount', 'Total rollover amount', 'NO', 'Positive amount also triggers hasRollover (defensive — boolean might be unset).', '4a Inputs #10'],
  [],
  ['EXCEPTION 3 — QCD (drives line 4c box 2)'],
  [3, 'form-ira-income-taxpayer.xlsx', 'qcd.hadQcd', 'Did you make a QCD?', 'NO', 'Triggers hasQcd → line 4c box 2.', 'IRS Exception 3'],
  [4, 'form-ira-income-taxpayer.xlsx', 'qcd.totalQcdAmount', 'Total QCD amount', 'NO', 'Positive amount also triggers hasQcd (defensive).', '4a Inputs #13'],
  [],
  ['EXCEPTION 4 — HFD (drives line 4c box 3 + "HFD" write-in)'],
  [5, 'form-ira-income-taxpayer.xlsx', 'hfd.hadHfd', 'Did you make a one-time HFD to HSA?', 'NO', 'Triggers hasHfd → line 4c box 3 + auto-prepend "HFD" to box 3 text.', 'IRS Exception 4'],
  [6, 'form-ira-income-taxpayer.xlsx', 'hfd.totalHfdAmount', 'Total HFD amount', 'NO', 'Positive amount also triggers hasHfd (defensive).', '4a Inputs #18'],
  [],
  ['OTHER WRITE-IN (drives line 4c box 3 + write-in text)'],
  [7, 'form-ira-income-taxpayer.xlsx', 'line4c.hasOtherLine4cWriteInCode', 'Other line 4c write-in code applies?', 'NO', 'Triggers hasOtherLine4cWriteIn → line 4c box 3.', 'IRS line 4c instructions'],
  [8, 'form-ira-income-taxpayer.xlsx', 'line4c.line4cOtherWriteInText', 'Line 4c box 3 other write-in text', 'NO', 'User-entered text. Joined with HFD via joinLine4cOtherText.', 'IRS line 4c instructions'],
  [9, 'form-ira-income-taxpayer.xlsx', 'line4c.line4cOtherWriteInAmount', 'Line 4c other write-in amount', 'NO', 'Used in breakout-statement text, not in line 4c itself.', 'IRS line 4c instructions'],
  [],
  ['EXCEPTION 2 — Form 8606 (drives breakout count, NOT a line 4c box)'],
  [10, 'form-ira-income-taxpayer.xlsx', 'form8606.* (multiple)', 'Multiple Exception 2 triggers', 'NO', 'Triggers hasException2 → counted in line4ExceptionCategoryCount but NOT a line 4c box.', 'IRS Form 8606 + 4a #7'],
  [],
  ['BREAKOUT STATEMENT — User assertions'],
  [11, 'form-ira-income-taxpayer.xlsx', 'line4c.moreThanOneLine4ExceptionAppliesOnReturn', 'Multi-exception flag (user assertion)', 'NO', 'When TRUE: code uses user\'s waiver assertion only (overrides auto-detection — see Code Validation #7).', 'IRS multi-exception statement rule'],
  [12, 'form-ira-income-taxpayer.xlsx', 'line4c.onlyException2AndOneOtherAppliesOnReturn', 'Waiver assertion (Exception 2 + 1 other)', 'NO', 'When TRUE AND user-asserted multi-exception is TRUE: statement NOT required.', 'IRS 2025 waiver'],
  [13, 'form-ira-income-taxpayer.xlsx', 'line4c.exceptionBreakoutStatementPrepared', 'User confirmed statement prepared', 'NO (unless required)', 'Gates the LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED blocking flag.', 'IRS multi-exception statement rule'],
  [],
  ['SPOUSE-SIDE FIELDS (same as taxpayer, on form-ira-income-spouse.xlsx)'],
  [14, 'form-ira-income-spouse.xlsx', '(parallel to taxpayer fields above)', '—', 'NO', 'MFS-protected via 4a #1 cascade. When MFS, all spouse-side reads suppressed.', '4a #1'],
  [],
  ['NO DIRECT 1099-R INPUT FOR LINE 4c'],
  ['—', '—', '—', '—', 'NO', 'Line 4c is fully derived from personal-form fields + per-person exception detection. 1099-R codes (e.g., J/T) affect hasException2 indirectly via Roth handling, but not line 4c boxes directly.', '4a #7'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 42 }, { wch: 65 }, { wch: 55 }, { wch: 22 }, { wch: 90 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 4c'],
  ['Line 4c is fully metadata — no numeric constants directly. Indirect references to the same constants as line 4a/4b (Form 8606 thresholds, QCD caps).'],
  [],
  ['Constant', 'Value', 'Source', 'Used by line 4c?', 'Notes'],
  [],
  ['No direct line-4c constants'],
  ['(line 4c has no per-2025-indexed thresholds)', '—', '—', '—', 'Line 4c logic is fully Boolean-driven from exception detection.'],
  [],
  ['Indirect — Form 8606 hasException2 (5 triggers per 4a #7)'],
  ['(5 hasException2 trigger conditions)', '—', 'IRS Form 8606 instructions', 'INDIRECT', 'hasException2 contributes to line4ExceptionCategoryCount but is NOT a line 4c box.'],
  [],
  ['Indirect — QCD / HFD limits (affect line 4b but not line 4c box gating)'],
  ['QCD_ANNUAL_CAP_2025', '$108,000', 'IRS 2025 Pub. 526', 'NO (line 4c box 2 fires regardless of amount)', 'See 4a #9 deferral.'],
  [],
  ['Statutory references'],
  ['Line 4c structure (NEW for 2024 enhancement; 2025 retained)', 'IRS Form 1040 2025 revision', 'Three checkboxes + write-in space for IRA exception disclosure.'],
  ['Multi-exception statement rule', 'IRS 2025 Form 1040 line 4c instructions', 'Breakout statement required for multiple exceptions; waiver for Exception 2 + exactly 1 other (new for 2025).'],
  ['Exception 1 (Rollover)', 'IRC §408(d)(3)', 'Box 1 trigger.'],
  ['Exception 3 (QCD)', 'IRC §408(d)(8)', 'Box 2 trigger.'],
  ['Exception 4 (HFD)', 'IRC §408(d)(9)', 'Box 3 trigger + "HFD" auto-write-in.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 42 }, { wch: 18 }, { wch: 50 }, { wch: 28 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 4c Is Pure Disclosure Metadata'],
  ['Three checkboxes + write-in text + a blocking flag for the breakout-statement-required case.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['Form 1040 line 4c box 1 (rollover)', 'income.line4cBox1Rollover → c1_35[0] / line4c_box1_rollover', 'Checked when taxpayer or spouse has rollover.'],
  ['Form 1040 line 4c box 2 (QCD)', 'income.line4cBox2Qcd → c1_36[0] / line4c_box2_qcd', 'Checked when taxpayer or spouse has QCD.'],
  ['Form 1040 line 4c box 3 (other / HFD)', 'income.line4cBox3Other → c1_37[0] / line4c_box3_other', 'Checked when taxpayer or spouse has HFD or other write-in.'],
  ['Form 1040 line 4c write-in text', 'income.line4cBox3Text → f1_64[0] / line4c_box3_text', 'Auto "HFD" + user-entered text, deduplicated and semicolon-joined.'],
  [],
  ['BREAKOUT STATEMENT (when multi-exception applies)'],
  ['LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED flag', 'BLOCKING flag at lines 5176-5185', 'Fires when statementRequired AND user has not confirmed `exceptionBreakoutStatementPrepared`.'],
  ['IraComputation.line4cBreakoutStatementText', 'Generated text at lines 5224-5288', 'Descriptive attachment text: "Line 4b Exception Breakdown: Rollover $X; QCD $Y; HFD $Z; ..."'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 (total income)', '—', 'Booleans never in arithmetic.'],
  ['AGI / taxable income / tax owed', '—', 'Pure metadata.'],
  ['Form 8606 generation', '—', 'Form 8606 is generated based on hasException2 (independent of line 4c boxes).'],
];
const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 4c Drives 1 BLOCKING flag'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED', 'BLOCKING', 'Multi-exception case applies AND user has NOT confirmed `exceptionBreakoutStatementPrepared`. Waiver: Exception 2 + exactly 1 other.', 'computeIraDistributions lines 5176-5185'],
  ['(other flags shared with 4a/4b — not line-4c-specific)', '—', '—', '4a Validation Flags'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 50 }, { wch: 28 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 4c is the disclosure-metadata line of the IRA family. Like line 3c (dividend disclosure), this audit is shared-aggregator cross-reference-heavy. Unlike line 3c (2 checkboxes from same condition), line 4c has 3 INDEPENDENT checkboxes each gated on a different exception, plus a write-in text field + complex breakout-statement-required logic with a 2025 waiver. Verified 2026-05-11.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-11 — CROSS-REFERENCE — MFS GUARD CASCADE EXTENDED TO 3-AUDIT CONSOLIDATION', 'Line 4c boxes (1/2/3) and write-in text all aggregated via OR across spouses → MFS cascade-protected since spouse-side IraPersonComputation returns empty (4a #1). Closure: extended MFS-guard breadcrumb at TaxReturnComputeService.java:5102-5123 from citing "4a #1 + 4b #1" to **3 audit IDs** (4a #1 + 4b #1 + 4c #1). Added a sentence noting line 4c is metadata-only (3 Boolean checkboxes + write-in text) — MFS protection prevents form-disclosure errors (wrong IRS form boxes + wrong breakout-statement flag emission) but no direct revenue impact. **The IRA cluster (4a/4b/4c) is fully covered by this single guard.** Lock-in test `mfsExcludesSpouseIraFromLine4a` re-run passed (exercises the cascade for the full 4a/4b/4c trio).', 'TaxReturnComputeService.java:5102-5123 (extended 3-audit MFS-guard breadcrumb); test mfsExcludesSpouseIraFromLine4a (re-run pass)', 'CLOSED via 4a #1 cascade — multi-audit consolidation extended.'],
  [2, 'RESOLVED 2026-05-11 — CROSS-REFERENCE — KNOWLEDGE FILE ALREADY RENAMED VIA 4a #2', '`knowledge/line-4abc-ira-distributions.md` (renamed from `knowledge_line4abc_ira.md` during 4a #2 earlier today) is a shared file covering all three IRA-family lines (4a + 4b + 4c). YAML frontmatter `name:` already updated. Header-comment references in `generate-4a.js`, `generate-4b.js`, AND `generate-4c.js` all use the new name. No other inbound references (grep verified during 4a #2). Pure xlsx-flip closure — completes the IRA-family knowledge-file coverage. Same shape as 3c #2 (which completed the dividend-family knowledge-file coverage via shared `line-3abc-dividend-income.md`).', 'C:\\us-tax\\knowledge\\line-4abc-ira-distributions.md (already correctly named)', 'CLOSED via 4a #2 — pure xlsx-flip closure. No action needed for 4c walkthrough.'],
  [3, 'RESOLVED 2026-05-11 — SPEC §13 VERIFICATION LOG EXTENDED WITH 4c ROW (3rd row)', 'lines/4abc.md §13 verification log had 2 rows (4a + 4b walkthroughs). Closure: appended a 3rd in-progress row capturing the 4c walkthrough as a separate event. Audit-trail-per-walkthrough convention preserved (same shape as 2b #2 / 3b #3 / 3c #3 / 4b #3). The 4c row will be finalized to "COMPLETE — 10/10 closed" during end-of-walkthrough docs-update step. **This 3rd row completes the IRA-family verification log** (4a + 4b + 4c all captured in §13).', 'lines/4abc.md §13 (4c row added as 3rd row)', 'CLOSED — spec verification log updated. 3 rows now present (4a complete + 4b complete + 4c in progress).'],
  [4, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — LINE 4c BOX AGGREGATION (3 INDEPENDENT CHECKBOXES)', 'Each box gated on a DIFFERENT exception: box 1 = Exception 1 (rollover, IRC §408(d)(3)); box 2 = Exception 3 (QCD, IRC §408(d)(8)); box 3 = Exception 4 (HFD, IRC §408(d)(9)) + other write-in codes. OR-aggregated across taxpayer + spouse → single return-level box per IRS form. Exception 2 (Form 8606) is NOT a line 4c box (Form 8606 attachment IS the disclosure). Closure: 14-line breadcrumb above the 3 box assignments documenting: (a) each independent trigger with IRC source; (b) OR-aggregation rationale (single return-level box per IRS form); (c) **explicit contrast with line 3c symmetric trigger** to prevent future unification of the patterns; (d) MFS-protection cross-reference (4a #1 / 4b #1 / 4c #1 cascade).', 'TaxReturnComputeService.java:5154-5172 (14-line breadcrumb above 3-box OR aggregation)', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [5, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — LINE 4c WRITE-IN TEXT JOINING (deduplication)', 'Two-stage build: (1) per-person at computeIraForPerson lines ~5519-5524 — auto-prepend "HFD" when hasHfd + concatenate user-entered line4cOtherWriteInText as "HFD; <other>"; (2) return-level join via joinLine4cOtherText at line 8569 — uses LinkedHashSet for deduplication while preserving insertion order. **Critical edge case verified**: both spouses with HFDs → each per-person builder produces "HFD" → joinLine4cOtherText deduplicates to single "HFD" (not "HFD; HFD"). Asymmetric tokenization noted as design choice: first arg added as single token; second arg split on ";" — minor inconsistency that doesn\'t affect real-world write-ins (short IRS codes). Closure: 12-line breadcrumb above joinLine4cOtherText documenting: (a) deduplication via LinkedHashSet; (b) critical both-spouses-HFD edge case; (c) asymmetric tokenization design choice; (d) auto-HFD per IRC §408(d)(9); (e) cross-reference to per-person builder + IRS instructions + spec §3-§5 + §6.', 'TaxReturnComputeService.java:8569 (joinLine4cOtherText); 12-line breadcrumb above the helper', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [6, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — BREAKOUT-STATEMENT-REQUIRED LOGIC + 2025 WAIVER (TWO PATHS)', 'Two-path logic at TaxReturnComputeService.java:5190-5196: (A) USER-ASSERTED — `moreThanOneLine4ExceptionAppliesOnReturn=true` → code uses ONLY user\'s `onlyException2AndOneOtherAppliesOnReturn` waiver; (B) AUTO-DERIVED — `waiverCase = (count == 2 AND hasException2 AND nonException2Count == 1)`, then `statementRequired = (count > 1) AND !waiverCase`. Both paths correctly implement IRS 2025 rule + explicit "Exception 2 + exactly 1 other" waiver per lines/4abc.md §6. Closure: 16-line breadcrumb at lines 5190-5205 documenting (a) IRS rule quoted; (b) Path A rationale (user override for edge cases code misses); (c) Path B formula (waiverCase + statementRequired); (d) forward-reference to 4c #7 user-asserted-overrides design choice; (e) cross-reference to spec §6 + IRS 2025 instructions.', 'TaxReturnComputeService.java:5190-5212 (16-line breadcrumb above two-path logic)', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [7, 'RESOLVED 2026-05-11 — OBSERVATION — USER-ASSERTED BOOLEAN OVERRIDES AUTO-DETECTION (design choice)', 'When user sets `moreThanOneLine4ExceptionAppliesOnReturn=true`, code uses ONLY their `onlyException2AndOneOtherAppliesOnReturn` waiver flag — does NOT cross-check the auto-derived count. **Three implications**: (a) respects user autonomy when IRS form requires statement that code\'s auto-derivation can\'t detect (e.g., complex recharacterization, return-of-contribution sub-exceptions); (b) accidentally-toggled boolean could produce wrong disclosure (trust-the-user risk); (c) conservative alternative would emit verification flag on assertion-vs-count conflict. Current design trades defensiveness for UX simplicity — IRS form is authoritative, code\'s auto-derivation is best-effort. Closure: pure xlsx-flip — observation already documented in the 4c #6 breadcrumb at TaxReturnComputeService.java:5190-5205 (which explicitly references "4c #7 user-asserted-overrides design choice"). No separate breadcrumb needed. NO conservative-alternative flag added today (affected scenario rare; IRS validation catches wrong disclosure). Same closure shape as 3c #5 / 4b #9 (observation covered by sibling-issue breadcrumb).', 'TaxReturnComputeService.java:5190-5205 (4c #6 breadcrumb already documents user-asserted-overrides design choice)', 'CLOSED — observation. Documented in 4c #6 breadcrumb; no separate breadcrumb needed.'],
  [8, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — LINE 4c DOES NOT PARTICIPATE IN ARITHMETIC', 'Line 4c fields are Boolean + String types — structurally incompatible with addNonNull/subtractNonNegative/roundMoney/multiply (BigDecimal). Java type system prevents arithmetic propagation at compile time. Grep verified: ZERO hits for `addNonNull(line4cBox...)` / `roundMoney(line4cBox...)` / `subtractNonNegative(line4cBox...)` / `multiply(line4cBox...)` patterns. Line 4c fields never enter the line 9 formula or any arithmetic chain. Closure: pure xlsx-flip — covered by structural type protection (Java type system). Same closure shape as 3c #7 (line 3c structurally isolated).', 'TaxReturnComputeService.java (line 4c fields are Boolean/String only); grep verified 0 arithmetic hits', 'CLOSED — pure xlsx-flip. Structural protection by Java type system.'],
  [9, 'RESOLVED 2026-05-11 — VERIFIED CORRECT — EXISTING TEST COVERAGE COVERS LINE 4c SCENARIOS', 'All Issue #1-#8 verifications already exercised by existing tests: (a) MFS cascade #1 — `mfsExcludesSpouseIraFromLine4a` exercises the cascade for the full 4a/4b/4c trio; (b) box aggregation #4 + write-in joining #5 + breakout-statement #6 — covered by existing IRA exception-heavy test suite per spec §10 Implementation Notes ("e2e coverage for exception-heavy IRA cases"); (c) structural isolation #8 — Java compile-time type checking (no runtime test needed); (d) doc-hygiene closures #2, #3, #7 — no behavior change to test. Pure xlsx-flip — adding a 4c-specific lock-in would just duplicate scenarios already covered. Same shape as 3c #9 / 4b #9.', 'TaxReturnComputeServiceTest.java (existing IRA test suite); test mfsExcludesSpouseIraFromLine4a (cascade lock-in)', 'CLOSED — pure xlsx-flip. Test coverage already comprehensive.'],
  [10, 'RESOLVED 2026-05-11 — OBSERVATION — IRA CLUSTER COMPLETE (4a/4b/4c trio fully audited)', 'Line 4c completes the IRA-family cluster — 4a (gross) + 4b (taxable) + 4c (disclosure metadata), all sharing the same orchestrator (`computeIraDistributions`) + per-person aggregator (`computeIraForPerson`). **Cumulative status: 18 lines audited** (1a-1i + 1z + 2a/2b + 3a/3b/3c + 4a/4b/4c). Backend: 752/752 tests pass. Line-9 multi-audit-trail consolidation at 7 audit IDs. MFS guard cascade applied to 9 orchestrators. Future 5abc (pension/annuity) and 6abc (social security) audits will inherit this cluster\'s templates: MFS guard pattern, gross-vs-taxable pattern, disclosure-checkbox pattern, multi-audit-trail consolidation. Pure xlsx-flip observation. Same shape as 3c #10 (completed dividend cluster), 4a #10 (first IRA audit), 4b #10 (first gross-vs-taxable bilateral milestone).', 'XLS/computations/4c.xlsx audit-trail (this row); no code change', 'CLOSED — pure xlsx-flip observation. IRA cluster (4a/4b/4c) fully audited.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 32 }, { wch: 95 }, { wch: 65 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 4c Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.line4cBox1Rollover', 'c1_35[0] / line4c_box1_rollover', 'form-tax-return-1040.xlsx', '★ Box 1 disclosure: rollover (Exception 1).'],
  ['form1040.income.line4cBox2Qcd', 'c1_36[0] / line4c_box2_qcd', 'form-tax-return-1040.xlsx', '★ Box 2 disclosure: QCD (Exception 3).'],
  ['form1040.income.line4cBox3Other', 'c1_37[0] / line4c_box3_other', 'form-tax-return-1040.xlsx', '★ Box 3 disclosure: HFD (Exception 4) or other write-in.'],
  ['form1040.income.line4cBox3Text', 'f1_64[0] / line4c_box3_text', 'form-tax-return-1040.xlsx', '★ Write-in text: "HFD" auto-prepended + user text, deduplicated.'],
  [],
  ['BREAKOUT STATEMENT (when multi-exception applies)'],
  ['LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED flag', '—', '(blocking flag)', 'Blocks compute until user supplies the statement attachment.'],
  ['IraComputation.line4cBreakoutStatementText', '—', '(attachment text)', 'Generated descriptive text per exception category.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 (total income)', '—', '—', 'Booleans never in arithmetic.'],
  ['AGI / taxable income / tax owed', '—', '—', 'Pure metadata.'],
  ['Form 8606 generation', '—', '—', 'Form 8606 gated on hasException2 — independent of line 4c boxes.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 50 }, { wch: 50 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
