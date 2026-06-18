// ============================================================================
//  Generates: C:\us-tax\XLS\computations\7a.xlsx
//
//  Source-of-truth references:
//    - lines/7ab.md (2025 IRS-verified rule map; Phase 1 + Phase 2 done 2026-04-16)
//    - dependencies/7ab.md
//    - knowledge/line-7ab-capital-gain-loss.md (renamed 2026-05-12 via 7a #2 from legacy knowledge_7ab.md)
//    - TaxReturnComputeService.computeCapitalGainLoss() (orchestrator at ~line 6351)
//    - TaxReturnComputeService.computeCapitalForPerson() (per-person aggregator)
//    - TaxReturnComputeService.computeCapitalLossCarryover() (Phase 2 next-year worksheet)
//    - PDF semantic CSV rows 84/85/33/34: f1_70 line7_capital_gain_or_loss; f1_71 line7_schedule_d_note_text;
//      c1_43 line7_schedule_d_not_required; c1_44 line7_includes_child_capital_gain_or_loss
//    - IRS 2025 Form 1040 line 7a/7b instructions + Schedule D instructions + Form 8949 instructions
//    - IRC §1211(b) ($3,000/$1,500 MFS loss cap); IRC §1212 (carryover); IRC §165(c); §166 (nonbusiness bad debt)
//
//  Tax year: 2025
//
//  NOTE: Line 7a is the **capital gain or (loss) amount** flowing to Form 1040 from either:
//   (a) Exception 1 direct-entry path — 1099-DIV box 2a only, no losses, no QOF (per spec §4)
//   (b) Schedule D path — gain or loss-cap-limited amount from Schedule D line 16 (per spec §7)
//   (c) Form 8814 line 10 child capital gain — added directly to line 7a on Exception 1 path; routed through Schedule D line 13 on Schedule D path (Phase 1 fix)
//
//  Line 7a is the **7th operand in line 9** (Form 1040 total income). Composite output with NO
//  gross sibling — no bilateral coverage milestone applies (per 6b #10).
//
//  Implementation maturity: Phase 1 + Phase 2 done 2026-04-16. Key audit angles for THIS walkthrough:
//   • Defensive MFS guard (NOT YET ADDED — parallel to 6a #1 / 5a #1 / 4a #1)
//   • Knowledge file rename (legacy `knowledge_7ab.md` underscore prefix → canonical `line-7ab-capital-gain-loss.md`)
//   • Verification log section (NEW for lines/7ab.md)
//   • Line-9 inclusion citation extension (12-audit consolidation)
//   • Verified-correct breadcrumbs on Exception 1 + $3k/$1.5k loss cap + child-cap-gain routing
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '7a.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 7a — CAPITAL GAIN OR (LOSS)'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 7a'],
  ['Concept', 'Capital gain or (loss) amount for the return. Composite output flowing from either: (a) Exception 1 direct-entry (1099-DIV box 2a capital gain distributions when no losses + no QOF + no 2b/2c/2d) per spec §4; (b) Schedule D path with gain or loss-cap-limited amount per spec §7; (c) Form 8814 child capital gain amount routed per the chosen path (Phase 1 fix 2026-04-16). Line 7a is the **7th operand in line 9** (total income) — composite output with NO gross sibling (no bilateral coverage milestone per 6b #10).'],
  ['Core invariant', 'Line 7a = capital gain or loss-cap-limited amount. Capital losses limited to $3,000 ($1,500 MFS) per IRC §1211(b). Excess loss carries forward per IRC §1212. Line 7a IS in line 9 (the 7th operand, per the line-9 11-audit consolidation; pending extension to 12 audits per 7a #4).'],
  ['Per-Return Formula',
    'EXCEPTION 1 DIRECT-ENTRY PATH (no Schedule D required):\n' +
    '  exception1 = NOT hasQofDeferral\n' +
    '             AND noCapitalLosses\n' +
    '             AND onlyCapitalGainsAreBox2aDistributions\n' +
    '             AND no1099DivBox2bCBoxCBoxD\n\n' +
    '  if exception1:\n' +
    '    line7aBase = taxpayer_box2a_amount_less_nominee\n' +
    '    line7a     = line7aBase + (includesChildCapitalGainLoss ? form8814Line10Total : 0)   // child added directly on Exception 1 path\n' +
    '    line7b.scheduleDNotRequired = TRUE\n' +
    '    line7b.includesChildCapitalGainLoss = (form8814Line10Total > 0)\n\n' +
    'SCHEDULE D PATH (Exception 1 NOT applicable):\n' +
    '  Compute Schedule D lines 1a-22 from:\n' +
    '    • 1099-B + 1099-DA transactions (direct aggregation OR Form 8949)\n' +
    '    • 1099-DIV box 2a (capital gain distributions) + 2b/2c/2d (unrecaptured 1250 / 1202 / collectibles)\n' +
    '    • Form 2439/6252/4797 Part I/4684/6781/8824 amounts (user-supplemental lines)\n' +
    '    • K-1 capital items (1041/1065/1120-S; user-supplemental lines)\n' +
    '    • Prior-year capital loss carryovers (lines 6 + 14)\n' +
    '    • Form 8814 line 10 child capital gain (routed to Schedule D line 13 per Phase 1 fix)\n' +
    '    • Nonbusiness bad debt → Box C Form 8949 transaction (Phase 2)\n\n' +
    '  Apply loss cap (IRC §1211(b)):\n' +
    '    lossLimit = isMfsReturn ? $1,500 : $3,000     // hard-coded at line 6604\n' +
    '    if line16Amount < 0:\n' +
    '      scheduleDLine21 = min(lossLimit, |line16Amount|)\n' +
    '      line7aBase = -scheduleDLine21\n' +
    '    else:\n' +
    '      line7aBase = line16Amount    // gain (or zero)\n\n' +
    '  Child amount already in line 13/15/16 → line7a = line7aBase (no additional add).\n\n' +
    'FINAL:\n' +
    '  line7a = roundMoney((exception1 && includesChildCapitalGainLoss) ? line7aBase + childAmount : line7aBase)'],
  ['Filed',
    'Form 1040 line 7a (amount, f1_70[0] = `line7_capital_gain_or_loss`).\n' +
    'Form 1040 line 7b — two checkboxes + entry space:\n' +
    '  • c1_43[0] = `line7_schedule_d_not_required` (Exception 1)\n' +
    '  • c1_44[0] = `line7_includes_child_capital_gain_or_loss` (Form 8814 child amount)\n' +
    '  • f1_71[0] = `line7_schedule_d_note_text` (Form 8814 line 10 entry space)\n' +
    'Schedule D, Form 8949, Form 8814, Form 8997 (if QOF), Form 2439/6252/4797/4684/6781/8824 attachments (when entries present).'],
  ['Backend method',
    'TaxReturnComputeService.computeCapitalGainLoss() — orchestrator at ~line 6351. **MFS guard NOT YET ADDED** (defensive gap per 7a #1 — same shape as 6a #1 / 5a #1 / 4a #1).\n' +
    'TaxReturnComputeService.computeCapitalForPerson() — per-person aggregator.\n' +
    'TaxReturnComputeService.computeCapitalLossCarryover() — Phase 2 next-year carryover worksheet.'],
  ['Output', 'form1040.income.capitalGainLoss (BigDecimal — gain, zero, or capped loss). When non-null, enters the line 9 addNonNull chain as the 7th operand.'],
  ['IRS source',
    'IRS 2025 Form 1040 instructions for line 7a/7b + 2025 Schedule D instructions + 2025 Form 8949 instructions + Form 8814 instructions; IRC §1211(b) (loss cap), §1212 (carryover), §165(c) (personal-use loss disallowed), §166 (nonbusiness bad debt).'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Gather inputs: capital-gain-loss-taxpayer + capital-gain-loss-spouse forms', '⚠️ Currently aggregates spouse data on MFS (defensive gap). Per 7a #1: MFS guard should null capitalSpouse and spouseSsn on MFS.'],
  [2, 'Gather statement entries: 1099-DIV, 1099-B, 1099-DA, 2439, 6252, 4797, 4684, 6781, 8824, K-1 (1041/1065/1120-S), 1099-S', 'Statement gating: validateCapitalStatementGating emits blocking flags if forms missing when hadAnyCapital=true.'],
  [3, 'Test Exception 1 (4 conditions per spec §4.1)', '`exception1 = !hasQofDeferral && noCapitalLosses && onlyBox2aDistributions && no1099DivBox2bCBoxCBoxD`. **VERIFIED CORRECT (7a #5).**'],
  [4, 'If Exception 1: line7aBase = taxpayer box2a − nominee adjustment', '`nominee` per `nomineeCapitalGainDistributionsToSubtract`. Advisory flag `CAPITAL_NOMINEE_DISTRIBUTIONS_REPORTED` per Phase 1 fix.'],
  [5, 'Otherwise: compute Schedule D lines 1a-22 via Form 8949 + direct aggregation + supplemental forms', 'Form 8949 box mapping A-L per spec §5.3; direct aggregation rule per §5.3 (boxes A/D 1099-B + G/J 1099-DA without adjustments).'],
  [6, 'Compute capital loss limit (IRC §1211(b))', '`lossLimit = isMfsReturn ? $1,500 : $3,000` at line 6604. **VERIFIED CORRECT (7a #6).**'],
  [7, 'Compute Schedule D line 21 (allowable loss) + line7aBase', '`scheduleDLine21 = min(lossLimit, |line16|)` when loss; `line7aBase = line16` when gain or zero.'],
  [8, 'Apply Form 8814 line 10 child capital gain routing', 'Exception 1 path: child amount added DIRECTLY to line 7a (line 6635). Schedule D path: child amount routed through Schedule D line 13 (Phase 1 fix per spec §9). **VERIFIED CORRECT (7a #7).**'],
  [9, 'Compute capital loss carryover (Phase 2 worksheet)', '`computeCapitalLossCarryover` produces next-year short/long-term split per IRS rule (allowable deduction applied to short-term first).'],
  [10, 'Persist on form1040.income + flow to line 9 (7th operand)', '`income.setCapitalGainLoss(line7a)` (only when non-null). Line 7a is INCLUDED in line 9 addNonNull chain.'],
  [11, 'Generate conditional attachment forms', 'Schedule D, Form 8949, Form 8997 (QOF deferral per Phase 2), Form 2439/6252/4797/4684/6781/8824, K-1 capital attachments. Per `buildCapitalAttachmentForms`.'],
  [],
  ['MUTUAL EXCLUSION RULES (enforced by code or spec)'],
  ['Rule', 'Implementation', 'Why'],
  ['Loss capped at $3,000 (single/MFJ/HOH/QSS) or $1,500 (MFS) per IRC §1211(b)', 'Line 6604: `lossLimit = isMfsReturn ? $1,500 : $3,000`; line 6626: `scheduleDLine21 = minNonNull(lossLimit, |line16|)`.', 'Statutory loss limitation; excess carries forward to next year (computeCapitalLossCarryover per Phase 2).'],
  ['Exception 1 (no Schedule D) requires all 4 conditions', 'Code at computeCapitalForPerson + orchestrator — `exception1` flag set when all 4 hold.', 'Per spec §4.1: !hasQofDeferral AND noCapitalLosses AND onlyBox2aDistributions AND no1099DivBox2bCBoxCBoxD.'],
  ['Schedule D required even without 1099-B sales (multiple triggers)', 'Per spec §6: Form 2439 / 6252 / 4797 Part I / 4684 / 6781 / 8824 / K-1 / carryovers / 2b/2c/2d / QOF.', 'Spec §6: not just "did taxpayer sell stock?" — many other triggers.'],
  ['Form 8814 child capital gain routing — exception1 vs Schedule D path', 'Line 6635: `line7a = (exception1 && includesChildCapitalGainLoss) ? line7aBase + childAmount : line7aBase`. Schedule D path adds childAmount to line 13 earlier (Phase 1 fix).', 'Per spec §9.2: child amount goes on Schedule D line 13 when Schedule D required; direct to line 7a when Exception 1.'],
  ['Line 7a IS in line 9 (7th operand)', 'Line 9 formula at lines 4178-4181 — line 7a is the 7th operand. Pending citation extension to 12-audit consolidation per 7a #4.', 'IRC §61(a)(3): capital gains are gross income; losses (capped) reduce gross income.'],
  ['QOF activity blocks Exception 1', 'Per spec §10: QOF deferral/exclusion/disposition forces Form 8949 + Form 8997 reporting.', 'Cannot use simple line-7 direct-entry path with QOF.'],
  [],
  ['DECISION TREE — When does each path apply?'],
  ['Scenario', 'Path', 'Line 7a result', 'Attachments produced'],
  ['No capital activity', 'Neither', 'null (or 0 if hadAnyCapital but all zero)', 'None'],
  ['1099-DIV box 2a only, no losses, no 2b/2c/2d, no QOF', 'Exception 1 direct-entry', 'box2a amount − nominee (+ child amount if applicable)', 'None — 7b "Schedule D not required" checked'],
  ['1099-B sales (basis reported, no adjustments)', 'Schedule D direct aggregation (line 1a / 8a)', 'Schedule D line 16 (gain or capped loss)', 'Schedule D only (no Form 8949)'],
  ['1099-B with wash-sale adjustment', 'Schedule D + Form 8949', 'Schedule D line 16', 'Schedule D + Form 8949 (code W)'],
  ['1099-DIV box 2b/2c/2d nonzero', 'Schedule D (Exception 1 blocked)', 'Schedule D line 16', 'Schedule D (line 18/19)'],
  ['QOF deferral/exclusion', 'Schedule D + Form 8949 + Form 8997 (Phase 2)', 'Schedule D line 16', 'Schedule D + Form 8949 + Form 8997'],
  ['Form 8814 child capital gain, Exception 1 qualified', 'Exception 1 + direct child add', 'parent + child amount', 'None — 7b "includes child" checked + amount in entry space'],
  ['Form 8814 child capital gain, Schedule D required', 'Schedule D + child routed to line 13', 'Schedule D line 16 (includes child via line 13)', 'Schedule D + 7b "includes child" checked'],
  ['Capital loss > $3,000 (or $1,500 MFS)', 'Schedule D + loss cap', 'capped to $3k / $1.5k MFS; excess carries forward', 'Schedule D + computeCapitalLossCarryover worksheet'],
  ['Nonbusiness bad debt (§166)', 'Schedule D + Form 8949 Box C short-term', 'Schedule D line 16 (short-term loss treated as capital)', 'Schedule D + Form 8949 (Box C; Phase 2 fix)'],
  ['Stale spouse data on MFS', '⚠️ Currently aggregates (defensive gap)', 'Inflated line 7a / wrong loss cap application', 'Wrong attachments may generate'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 7a Flows'],
  ['Consumer', 'How', 'Notes'],
  ['Form 1040 line 9 (total income) — ★ PRIMARY DOWNSTREAM', 'Line 9 formula at lines 4178-4181 — line 7a is the 7th operand. Per the 11-audit line-9 consolidation (preserved through 6abcd); pending citation extension to 12 audits per 7a #4.', '★ Critical: IRC §61(a)(3) capital gain inclusion / IRC §1211(b) loss deduction.'],
  ['Form 1040 line 11a/11b (AGI), line 15 (taxable income)', 'Indirect via line 9 contribution.', 'Carries gain/loss through income waterfall.'],
  ['Form 1040 line 6b worksheet (SS taxable benefits)', 'Per 6b #6 Pub. 915 worksheet line 3 — `line1z + line2b + line3b + line4b + line5b + line7a + line8`.', 'Line 7a feeds the SS taxation worksheet (provisional income input).'],
  ['Schedule D + Form 8949', 'When Schedule D required (Exception 1 doesn\'t apply).', 'Conditional attachment outputs.'],
  ['Form 8997 (QOF disposition)', 'When `hasQofDeferral=true` (Phase 2 fix).', 'Conditional attachment.'],
  ['Form 8814 line 10 (child cap gain routing)', 'Exception 1 path: direct add. Schedule D path: through line 13 (Phase 1 fix).', 'Bi-directional dependency with Form 8814 audit.'],
  ['QDCG Worksheet at line 16 (when qualified dividends + cap gains present)', 'Drives preferential-rate tax computation.', 'Per line 16 audit (future).'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 28 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 7a'],
  ['Line 7a inputs span 14+ statement types + 2 personal forms + return-level filing status. The implementation is mature (Phase 1 + Phase 2 done 2026-04-16).'],
  [],
  ['#', 'Source xlsx', 'Field path / model key', 'Label / box', 'Required?', 'Role in line 7a compute', 'Cross-reference'],
  [],
  ['STATEMENT INPUTS — 1099-DIV (capital gain distributions + 2b/2c/2d)'],
  [1, 'form-1099-div.xlsx', 'capitalGainTotalAmount (box 2a)', '1099-DIV box 2a', 'YES — Exception 1 primary input', 'Direct line 7a feed on Exception 1; Schedule D line 13 input otherwise.', 'spec §2.1, §4.2'],
  [2, 'form-1099-div.xlsx', 'unrecapturedSection1250GainAmount (box 2b)', '1099-DIV box 2b', 'NO — Exception 1 blocker', 'When nonzero, blocks Exception 1; routes to Schedule D line 19 (Unrecaptured §1250).', 'spec §11.1'],
  [3, 'form-1099-div.xlsx', 'section1202GainAmount (box 2c)', '1099-DIV box 2c', 'NO — Exception 1 blocker', 'When nonzero, blocks Exception 1; routes to Schedule D (§1202 exclusion).', 'spec §11.1'],
  [4, 'form-1099-div.xlsx', 'collectiblesGainAmount (box 2d)', '1099-DIV box 2d 28%-rate', 'NO — Exception 1 blocker', 'When nonzero, blocks Exception 1; routes to Schedule D line 18 (28% Rate Worksheet — deferred per outstanding.md).', 'spec §11.1'],
  [],
  ['STATEMENT INPUTS — 1099-B (legacy broker)'],
  [5, 'form-1099-b.xlsx', '(11 fields per transaction)', '1099-B Boxes 1a-5', 'YES when sales exist', 'Schedule D line 1a/8a (direct) OR Form 8949 boxes A-F. Wash sale → code W forces Form 8949.', 'spec §5.3'],
  [],
  ['STATEMENT INPUTS — 1099-DA (digital asset broker; NEW for 2025)'],
  [6, 'form-1099-da.xlsx', '(per-transaction digital asset fields)', '1099-DA boxes', 'YES when digital sales exist', 'Schedule D line 1a/8a (direct) OR Form 8949 boxes G-L. Wash sale forces Form 8949.', 'spec §5.3'],
  [],
  ['STATEMENT INPUTS — Supplemental forms (user-derived; auto-derivation deferred)'],
  [7, 'form-2439.xlsx', 'undistributedLongTermCapitalGains', 'Form 2439 undistributed LT gains', 'NO — Schedule D trigger', 'Triggers Schedule D requirement; user enters supplemental line 4 amount.', 'spec §6'],
  [8, 'form-6252.xlsx', '(installment sale fields)', 'Form 6252 installment sale', 'NO — Schedule D trigger', 'Triggers Schedule D; user enters supplemental line 4/11.', 'spec §6'],
  [9, 'form-4797.xlsx', 'Part I ordinary cap gain', 'Form 4797 Part I', 'NO — Schedule D trigger', 'Triggers Schedule D; user enters supplemental line 4/11.', 'spec §6'],
  [10, 'form-4684.xlsx', 'casualty/theft cap gain', 'Form 4684', 'NO — Schedule D trigger', 'Triggers Schedule D; user enters supplemental line 4/11.', 'spec §6'],
  [11, 'form-6781.xlsx', 'section 1256 contracts', 'Form 6781', 'NO — Schedule D trigger', 'Triggers Schedule D; user enters supplemental line 4/11.', 'spec §6'],
  [12, 'form-8824.xlsx', 'like-kind exchange', 'Form 8824', 'NO — Schedule D trigger', 'Triggers Schedule D; user enters supplemental line 4/11.', 'spec §6'],
  [],
  ['STATEMENT INPUTS — Schedule K-1 (1041/1065/1120-S)'],
  [13, 'form-schedule-k-1-1041.xlsx', 'capital gain items', 'K-1 (1041) cap items', 'NO — Schedule D trigger', 'Triggers Schedule D; user enters supplemental.', 'spec §6'],
  [14, 'form-schedule-k-1-1065.xlsx', 'capital gain items', 'K-1 (1065) cap items', 'NO — Schedule D trigger', 'Triggers Schedule D; user enters supplemental.', 'spec §6'],
  [15, 'form-schedule-k-1-1120-s.xlsx', 'capital gain items', 'K-1 (1120-S) cap items', 'NO — Schedule D trigger', 'Triggers Schedule D; user enters supplemental.', 'spec §6'],
  [],
  ['STATEMENT INPUTS — 1099-S (real estate)'],
  [16, 'form-1099-s.xlsx', 'grossProceedsAmount', '1099-S gross proceeds', 'NO — advisory flag (Phase 2)', 'Triggers `FORM_1099S_REAL_ESTATE_REPORTED` advisory (Phase 2). Full §121 exclusion + Form 8949 auto-entry DEFERRED.', 'Phase 2 / outstanding.md'],
  [],
  ['PERSONAL FORM INPUTS — capital-gain-loss-taxpayer + capital-gain-loss-spouse'],
  [17, 'form-capital-gain-loss-taxpayer.xlsx', 'hadCapitalGainOrLoss', 'Had capital activity?', 'YES — gate', 'Gates entire computation; hadAnyCapital = taxpayer OR spouse.'],
  [18, 'form-capital-gain-loss-taxpayer.xlsx', 'hasQofDeferral', 'QOF deferral?', 'NO — Exception 1 blocker', 'Blocks Exception 1; triggers Form 8997 (Phase 2).'],
  [19, 'form-capital-gain-loss-taxpayer.xlsx', 'nomineeCapitalGainDistributionsToSubtract', 'Nominee adjustment', 'NO — Exception 1 reducer', 'Subtracted from box2a on Exception 1 path; triggers `CAPITAL_NOMINEE_DISTRIBUTIONS_REPORTED` advisory (Phase 1).'],
  [20, 'form-capital-gain-loss-taxpayer.xlsx', 'priorYearScheduleDLine7AllowableLoss / Line15AllowableLoss', 'Prior-year carryovers', 'NO', 'Schedule D lines 6 (short) + 14 (long) carryover inputs.'],
  [21, 'form-capital-gain-loss-taxpayer.xlsx', 'nonbusinessBadDebtFaceAmount / nonbusinessBadDebtDescription', 'Nonbusiness bad debt (§166)', 'NO', 'Phase 2: creates Box C Form 8949 transaction (proceeds=0, basis=face).'],
  [22, 'form-capital-gain-loss-taxpayer.xlsx', 'Schedule D supplemental lines (4/5/11/12)', 'User-supplemental Schedule D amounts', 'NO', 'User manually enters Form 2439/6252/6781/8824/K-1 amounts (auto-derivation DEFERRED per spec "Remaining deferred").'],
  [23, 'form-capital-gain-loss-spouse.xlsx', '(same fields as taxpayer)', 'Spouse capital activity', '⚠️ Read on MFS', 'Currently aggregated on MFS (defensive gap per 7a #1).'],
  [],
  ['RETURN-LEVEL INPUTS'],
  [24, 'form-filing-status.xlsx', 'filingStatus', 'Filing status', 'YES — loss cap', 'Drives `lossLimit = isMfs ? $1,500 : $3,000` per IRC §1211(b).'],
  [25, 'form-identification-taxpayer.xlsx', 'taxpayerIdentity.ssn', 'Taxpayer SSN', 'YES', 'Drives statement attribution.'],
  [],
  ['UPSTREAM COMPUTED INPUTS'],
  [26, '(computed — line 3a)', 'qualifiedDividends', 'Qualified dividends', 'YES — passed to capital', 'Used by Exception 1 test + QDCG Worksheet at line 16.'],
  [27, '(computed — Form 8814)', 'form8814Line10Total + includesChildCapitalGainLossFromForm8814', 'Form 8814 child cap gain', 'NO', 'Routed per spec §9: direct add on Exception 1; Schedule D line 13 otherwise.'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 42 }, { wch: 65 }, { wch: 55 }, { wch: 30 }, { wch: 80 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 7a'],
  [],
  ['Constant', 'Value', 'Source', 'Used by line 7a?', 'Notes'],
  [],
  ['Direct — Capital loss cap (IRC §1211(b))'],
  ['CAPITAL_LOSS_CAP_NON_MFS', '$3,000', 'IRC §1211(b)(1)', 'YES — Step 6', 'Hard-coded inline at line 6604 (`new BigDecimal("3000")`). Stable since 1976.'],
  ['CAPITAL_LOSS_CAP_MFS', '$1,500', 'IRC §1211(b)(2)', 'YES — Step 6 (MFS)', 'Hard-coded inline at line 6604. Half the non-MFS cap. NOT inflation-indexed.'],
  [],
  ['Form 8949 box mapping (IRS Schedule D / Form 8949 instructions)'],
  ['Box A (1099-B, ST, basis reported)', 'Schedule D line 1a (direct) OR 1b (via 8949)', '2025 Schedule D + Form 8949 instructions', 'YES — Step 5', 'Direct aggregation allowed when no adjustments.'],
  ['Box D (1099-B, LT, basis reported)', 'Schedule D line 8a (direct) OR 8b (via 8949)', '2025 Schedule D + Form 8949 instructions', 'YES — Step 5', 'Direct aggregation allowed when no adjustments.'],
  ['Box G/J (1099-DA, ST/LT, basis reported)', 'Schedule D line 1a/8a (direct) OR 1b/8b (via 8949)', '2025 Schedule D + Form 8949 instructions', 'YES — Step 5', 'NEW for 2025 (digital asset reporting via 1099-DA).'],
  ['Boxes B/C/E/F (1099-B) + H/I/K/L (1099-DA)', 'Form 8949 required', '2025 Schedule D + Form 8949 instructions', 'YES — Step 5', 'No direct aggregation; per-lot Form 8949 reporting.'],
  [],
  ['Statutory references'],
  ['Capital gain inclusion in gross income', 'IRC §61(a)(3)', 'Line 7a IS the 7th operand in line 9 (total income).'],
  ['Capital loss deduction + cap', 'IRC §1211(b)', 'Loss capped at $3,000 ($1,500 MFS).'],
  ['Capital loss carryover (excess)', 'IRC §1212(b)', 'Disallowed loss carries forward indefinitely; computeCapitalLossCarryover Phase 2.'],
  ['Personal-use property loss disallowance', 'IRC §165(c)', 'Personal-use losses NOT deductible (1099-S advisory flag).'],
  ['Nonbusiness bad debt', 'IRC §166(d)', 'Short-term capital loss; Phase 2 Box C Form 8949.'],
  ['Section 121 principal residence exclusion', 'IRC §121', 'Up to $250k/$500k MFJ exclusion on home sale. Full computation DEFERRED.'],
  ['Section 1250 unrecaptured gain', 'IRC §1250', '25% rate via Unrecaptured §1250 Gain Worksheet. Worksheet DEFERRED (user-entered value only).'],
  ['Section 1202 exclusion + 28% rate', 'IRC §1202', '28% Rate Gain Worksheet. Worksheet DEFERRED.'],
  ['Section 1400Z-2 Qualified Opportunity Fund', 'IRC §1400Z-2', 'QOF deferral/exclusion; Form 8997 reporting (Phase 2).'],
  [],
  ['Note — All loss cap thresholds are HARD-CODED INLINE'],
  ['Observation', '$3,000 / $1,500 caps are inline literals (line 6604) — NOT in ReferenceData.', 'Stable IRC §1211(b) thresholds since 1976. Not inflation-indexed. Moving to ReferenceData is low-priority.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 50 }, { wch: 50 }, { wch: 22 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 7a + Conditional Attachments'],
  ['Line 7a is the bottom-line capital gain/loss amount; the 7th operand in line 9. Many conditional attachment forms ride along.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['Form 1040 line 7a (amount)', 'TaxReturnComputeService.buildIncome() — income.setCapitalGainLoss(line7a)', '★ Primary output. PDF: f1_70[0] = `line7_capital_gain_or_loss`.'],
  ['Form 1040 line 7b — "Schedule D not required" checkbox', 'Per Exception 1 result.', 'PDF: c1_43[0] = `line7_schedule_d_not_required`.'],
  ['Form 1040 line 7b — "Includes child capital gain" checkbox', 'Per Form 8814 line 10 routing.', 'PDF: c1_44[0] = `line7_includes_child_capital_gain_or_loss`.'],
  ['Form 1040 line 7b — Form 8814 line 10 entry space', 'When child checkbox set.', 'PDF: f1_71[0] = `line7_schedule_d_note_text`.'],
  ['Form 1040 line 9 (total income) — ★★ CRITICAL', 'Line 9 formula at lines 4178-4181 — line 7a is the 7th operand.', '★★ IRC §61(a)(3) inclusion. Carries to AGI → taxable income → tax.'],
  ['Schedule D (when required)', 'Generated when !exception1 + hadAnyCapital.', 'Full Schedule D with lines 1a-22; line 16 maps to line 7a.'],
  ['Form 8949 (when required)', 'When non-direct-aggregable transactions exist or QOF.', 'Per-page (11 transactions/page); grouped by box A-L.'],
  ['Form 8997 (Annual Report of QOF)', 'When hasQofDeferral=true (Phase 2 fix).', 'Conditional attachment.'],
  ['Form 2439/6252/4797/4684/6781/8824 capital attachments', 'When entries present (Phase 1 fix — buildCapitalAttachmentForms).', 'RequiredAttachmentForm produced; user manually enters amounts in Schedule D supplemental lines.'],
  ['K-1 capital attachments (1041/1065/1120-S)', 'When K-1 entries present (Phase 1 fix).', 'RequiredAttachmentForm produced.'],
  ['Capital loss carryover worksheet (next year)', 'Phase 2: computeCapitalLossCarryover stores `nextYearShortTermCapitalLossCarryover` + `nextYearLongTermCapitalLossCarryover`.', 'IRC §1212(b) carryover; user receives data for next year\'s return.'],
  ['Form 1040 line 6b SS worksheet input', 'Per 6b #6 Pub. 915 worksheet line 3: includes line 7a.', 'Provisional income input for SS taxability.'],
  ['QDCG Worksheet at line 16', 'When qualified dividends + cap gains present.', 'Preferential rate computation (future audit).'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Schedule B', '—', 'Not applicable (capital gains, not interest/dividends).'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 7a-Related'],
  ['Multiple flags emitted during capital gain/loss computation. Phase 1 + Phase 2 added new advisory flags.'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['CAPITAL_STATEMENT_UPLOAD_REQUIRED', 'BLOCKING', 'hadAnyCapital=true AND statements missing', 'validateCapitalStatementGating'],
  ['CAPITAL_NOMINEE_DISTRIBUTIONS_REPORTED', 'ADVISORY', 'nomineeAdjustments > 0 (Phase 1 fix)', 'computeCapitalGainLoss'],
  ['FORM_1099S_REAL_ESTATE_REPORTED', 'ADVISORY', '1099-S entries present (Phase 2 fix)', 'computeCapitalGainLoss line 6392-6400'],
  ['(MFS-related flag pending)', 'PENDING', 'After 7a #1: optional advisory when MFS + capitalGainLossSpouse has data', 'Future enhancement'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 7a is the FIRST audit after the 6abcd cluster completion (single-line audit; no cluster pattern). **The big-ticket item is Issue #1** — defensive MFS guard NOT YET ADDED at `computeCapitalGainLoss` (parallel to 6a #1 / 5a #1 / 4a #1). Implementation is mature: Phase 1 + Phase 2 done 2026-04-16. Verified 2026-05-12.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-12 — ⚠️ HIGH-PRIORITY DEFENSIVE GAP — MFS GUARD ADDED AT `computeCapitalGainLoss`', '⚠️ **DEFENSIVE GAP FIXED**: Pre-fix, `computeCapitalGainLoss` did NOT take an `isMfsReturn` parameter — orchestrator aggregated spouse capital gain data even on MFS returns. Spouse-data leakage paths (4): (a) `hadAnyCapital` flag from spouse activity alone → wrong Schedule D / Form 8949 generation; (b) spouseSsn matched spouse-attributed 1099-DIV/1099-B/1099-DA/2439/etc. → aggregated into taxpayer line 7a; (c) spouse `hasQofDeferral=true` could block Exception 1 for taxpayer; (d) spouse supplemental Schedule D + nominee + nonbusiness bad debt leaked. IRC §1211(b) MFS loss cap of $1,500 compounds over-taxation. **Closure applied (three-step fix, same shape as 6a #1)**: (1) Added `boolean isMfsReturn` parameter to `computeCapitalGainLoss` signature; (2) at method top, **null out** `capitalSpouseRaw` → `capitalSpouse=null` AND `spouseRaw` → `spouse=null` on MFS via shadowing pattern; (3) updated call site at line 425 to pass `isMfsReturn`. Added 23-line MFS-guard breadcrumb at TaxReturnComputeService.java:6374-6396 enumerating the 4 leakage paths + IRC §1211(b) MFS-cap-compounding rationale + 12-orchestrator cascade extension milestone. **NEW lock-in test** `mfsExcludesSpouseCapitalGainLossFromLine7a` — MFS taxpayer 1099-DIV $500 box 2a + STALE spouse 1099-DIV $2,000 → asserts line 7a=$500 (taxpayer-only), NOT $2,500. **Single-guard MFS cascade now applied to 12 orchestrators** (1c-1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities + computeSocialSecurityBenefits + **computeCapitalGainLoss**). Backend regression: 755 → 756 (+1 from lock-in test); all existing capital tests still pass.', 'TaxReturnComputeService.java:6351-6396 (signature update + 23-line MFS-guard breadcrumb + null-shadowing); line 425 (call site updated); test `mfsExcludesSpouseCapitalGainLossFromLine7a`', 'CLOSED — defensive gap fixed. Single-guard MFS cascade extended to 12 orchestrators.'],
  [2, 'RESOLVED 2026-05-12 — DOCUMENTATION HYGIENE — KNOWLEDGE FILE RENAME (legacy underscore prefix → canonical)', '`knowledge/knowledge_7ab.md` used the **legacy Form A** underscore-prefix form (different from prior `knowledge-line-` hyphen-prefix **legacy Form B** that was phased out during the 6abcd / 5abc / 4abc cluster audits). **Closure applied**: (1) renamed `knowledge/knowledge_7ab.md` → `knowledge/line-7ab-capital-gain-loss.md` (canonical form); (2) updated generator header-comment reference at `generate-7a.js` line 9 (was `knowledge/knowledge_7ab.md`, now `knowledge/line-7ab-capital-gain-loss.md`); (3) grep verified inbound references: 2 hits — `generate-7a.js` (updated) and `history.md` line 3514 (historical reference, preserved per audit-trail-preserves-history convention). **Knowledge-file naming convergence extends to 14 lines** (1c-1i + 1z + 2ab + 3ab + 4abc + 5abc + 6abcd + **7ab**). Remaining legacy Form A files: `knowledge_line16.md`, `knowledge_line17.md`, `knowledge_line26.md`, `knowledge_line27abc.md` — will rename during future line 16/17/26/27 audits. Same fix shape as 6a #2 / 5a #2 / 4a #2 / 3a #2 / 2a #4.', 'C:\\us-tax\\knowledge\\line-7ab-capital-gain-loss.md (renamed); C:\\us-tax\\XLS\\_tools\\generate-7a.js header (updated)', 'CLOSED — file renamed + generator updated. Convergence at 14 lines.'],
  [3, 'RESOLVED 2026-05-12 — SPEC ENHANCEMENT — VERIFICATION LOG SECTION CREATED IN lines/7ab.md', '`lines/7ab.md` did NOT have a Verification log section. **Closure applied**: appended a new `## Verification log` section at the end of the file (after §14 Practical developer cheat sheet) with 1 row in IN-PROGRESS state capturing the 7a walkthrough (#1 MFS guard added + cascade extension + lock-in test; #2 knowledge file renamed + convergence at 14 lines; #3 this section creation). To be finalized to "COMPLETE — 10/10 closed" during end-of-walkthrough docs-update step. **NEW section creation — NORMAL-VARIANT pattern** (cluster-start audit creates the section in its #3 row): same shape as 2ab / 3abc / 4abc / 5abc cluster-start audits; **different from 6b #3 deferred-creation variant** where 6a (cluster-start) didn\'t create the section and 6b had to do it instead. Future 7b audit will append a 2nd row → 7ab verification log will have 2 rows total (smaller than 6abcd\'s 4-row log since 7ab has only 2 sub-lines).', 'lines/7ab.md (new Verification log section with 7a in-progress row)', 'CLOSED — spec verification log section created. NORMAL-variant pattern.'],
  [4, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — LINE 7a IS IN LINE 9 (12-AUDIT CONSOLIDATION)', 'Line 9 formula: line 7a is the 7th operand (INTENTIONALLY INCLUDED per IRC §61(a)(3)). The 11-audit consolidation reached at 6b #4 included all prior numeric income lines AS verified INCLUDED or EXCLUDED — but line 7a inclusion did NOT yet have its own audit ID citation. **Closure applied**: extended the line-9 breadcrumb at `TaxReturnComputeService.java:4138-4163` from **11 audit IDs** to **12 audit IDs** (added "+ 7a.xlsx Code Validation #4" to the verification block). Added line 7a operand sentence parallel to lines 2b/3b/4b/5b/6b: "Line 7a is the 7th operand — verified INCLUDED (7a #4, IRC §61(a)(3) capital gains as gross income; capital losses capped at $3,000 / $1,500 MFS per IRC §1211(b), with excess carryover per §1212(b))." Updated the bilateral-milestone note to clarify that **single-sided inclusion citations continue** (7a #4 is the first single-sided citation post-bilateral milestone) and that future line 8 audit will add the 13th and FINAL line-9-operand audit citation. Updated the boolean-clarification paragraph below (the 6c #4 / 6d #4 "Notably absent" extension) to reflect the new 12-audit count. Pure documentation extension — no formula change; existing lock-in test `line9EqualsLine1zPlusOtherIncomeLines` already covers the formula. **Pattern**: line 7a is a COMPOSITE OUTPUT without a gross sibling (per 6b #10) — no bilateral pair; single-sided citation only.', 'TaxReturnComputeService.java:4138-4163 (12-audit breadcrumb extension with line 7a inclusion citation) + line 4181-4185 (boolean-clarification count update); test line9EqualsLine1zPlusOtherIncomeLines', 'CLOSED — 12-audit consolidation reached. Single-sided inclusion citation pattern (no bilateral pair).'],
  [5, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — EXCEPTION 1 DIRECT-ENTRY PATH (8-condition AND gate — MORE CONSERVATIVE than spec\'s nominal 4-condition rule)', 'Per IRS 2025 Form 1040 line 7 instructions + spec §4.1 + §6 + §10 + §11.1: Exception 1 nominally requires 4 conditions, but implementation uses **8 explicit conditions** — more conservative because spec §4.1(b)+(c) implicitly require ALL Schedule D triggers from spec §6 to be absent. Code at TaxReturnComputeService.java:6629-6636 produces `exception1` flag when all 8 negations hold. **Closure applied**: **22-line breadcrumb** at lines 6610-6628 above the AND gate documenting (a) IRS source + spec §4.1/§6/§10/§11.1 citations; (b) **8-condition mapping table** with each code condition → spec rule mapping (1 QOF blocker, 2 sales/exchanges, 3 capital losses, 4 carryover, 5 Form 2439, 6 other sources 6252/4797/4684/6781/8824/K-1, 7 special 1099-DIV boxes 2b/2c/2d, 8 legacy-field defensive guard); (c) MORE-CONSERVATIVE-than-spec rationale (explicit Schedule D trigger checks make code more readable + defensive); (d) safe-by-default semantics (incomplete data → individual flags default FALSE → exception1=TRUE only when ALL 8 negations hold); (e) cross-references to 7a #6 (loss cap when exception1=FALSE) + 7a #7 (child-cap-gain direct-add when exception1=TRUE); (f) existing lock-in test `computesCapitalGainLossException1WithoutScheduleD` reference. Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:6610-6636 (22-line breadcrumb above 8-condition AND gate)', 'CLOSED — verified correct. 22-line breadcrumb with 8-condition mapping table.'],
  [6, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — $3,000 / $1,500 MFS LOSS CAP (IRC §1211(b))', 'Loss cap logic at TaxReturnComputeService.java:6653: `BigDecimal lossLimit = "Married filing separately".equalsIgnoreCase(status) ? new BigDecimal("1500") : new BigDecimal("3000");`. Then at line 6675: `scheduleDLine21 = minNonNull(lossLimit, line16Amount.abs());` + line 6676 sign restoration. **Closure applied**: **17-line breadcrumb** at lines 6653-6671 above the lossLimit derivation documenting (a) IRC §1211(b)(1)/(2) source — $3,000 non-MFS / $1,500 MFS (anti-loophole: MFS cap is half of non-MFS to prevent doubling via separate filing); (b) **three protections at the loss-cap site** — filing-status-derived cap + magnitude clamp + sign restoration; (c) excess loss → carryover per IRC §1212(b) (Phase 2 fix: computeCapitalLossCarryover + nextYearShortTermCapitalLossCarryover/nextYearLongTermCapitalLossCarryover); (d) hard-coded inline thresholds rationale — stable since 1976 Tax Reform Act, NOT inflation-indexed; same pattern as IRC §86 SS thresholds (6b #8) + IRC §402(l) PSO cap (5b #8); (e) **defense-in-depth**: filing-status string check reads the same normalized status as the 7a #1 MFS guard `isMfsReturn` boolean — redundant by design. Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:6653-6671 (17-line breadcrumb above loss-cap logic with three-protection chain)', 'CLOSED — verified correct. 17-line breadcrumb documenting IRC §1211(b) cap + IRC §1212(b) carryover + hard-coded threshold rationale.'],
  [7, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — FORM 8814 LINE 10 CHILD CAPITAL GAIN ROUTING (Phase 1 fix)', 'Dual-path routing per IRS Form 8814 line 10 instructions + spec §9.2: (a) Exception 1 path — line 7a = line7aBase + childAmount (direct add at line 6702); (b) Schedule D path — childAmount routed through Schedule D line 13 → line 15 → line 16 → line7aBase at lines 6681-6697 (Phase 1 fix per outstanding.md "form8814ChildCapGainFlowsThroughScheduleDLine13WhenScheduleDRequired"). **Closure applied**: replaced the 2-line comment with a **18-line breadcrumb** at TaxReturnComputeService.java:6700-6717 above the direct-add ternary documenting: (a) IRS Form 8814 line 10 instructions + spec §9.2 source; (b) **dual-path explicit** — PATH 1 Exception 1 direct add (line7aBase + childAmount); PATH 2 Schedule D indirect routing (already added to line 13 at lines 6681-6697; ternary returns line7aBase unchanged to avoid double-add); (c) Phase 1 fix rationale + outstanding.md line 2281 cross-reference (pre-fix bug always added directly → under-stated Schedule D line 13 + long-term totals; post-fix routes through Schedule D when Schedule D required); (d) line 7b coupling — c1_44[0] checkbox is path-independent disclosure; f1_71[0] entry space carries child amount; (e) lock-in test reference + concrete example (parent $100 + child $60 → Schedule D line 13 $160; line 16 = $460 = line 7a). Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:6700-6717 (18-line breadcrumb above dual-path direct-add ternary)', 'CLOSED — verified correct. 18-line breadcrumb documenting Phase 1 dual-path fix.'],
  [8, 'RESOLVED 2026-05-12 — OBSERVATION — PHASE 1 + PHASE 2 ENHANCEMENTS ALL COMPLETE (historical context)', 'Pure xlsx-flip historical observation. **Phase 1 (2026-04-16, Gaps 1/2/5/8)**: (1) Capital attachment forms — `buildCapitalAttachmentForms()` produces `RequiredAttachmentForm` for Form 2439/6252/6781/8824/K-1 (1041/1065/1120-S) when entries exist; (2) Form 8814 child cap gain Schedule D line 13 routing (per 7a #7); (5) Nominee advisory flag `CAPITAL_NOMINEE_DISTRIBUTIONS_REPORTED` emitted when nominee amount present; (8) misc Phase 1 refinements. **Phase 2 (2026-04-16, Gaps 3/4/6/7)**: (3) Form 8997 (Annual Report of QOF Investments) — `RequiredAttachmentForm form8997` produced when `capital.hasQofDeferral()=true`; (4) Capital loss carryover worksheet — `computeCapitalLossCarryover()` computes next-year short/long-term carryovers per IRS rule (allowable deduction applied to short-term losses first); stored in `ScheduleD.nextYearShortTermCapitalLossCarryover` + `nextYearLongTermCapitalLossCarryover`; (6) 1099-S advisory flag `FORM_1099S_REAL_ESTATE_REPORTED` (full §121 exclusion + Form 8949 auto-entry DEFERRED — see 7a #9); (7) Nonbusiness bad debt (§166) — `nonbusinessBadDebtFaceAmount`/`nonbusinessBadDebtDescription` fields → `addNonbusinessBadDebtTransaction()` creates Box C Form 8949 entry (proceeds=$0, basis=face). All eight gaps documented in outstanding.md (struck-through entries lines 2280-2287). **Audit-trail-completeness purpose**: discrete observation row records the substantial pre-existing work for future auditor reference + implementation-maturity signal + anti-regression protection. Same shape as 6d #8 historical observation. Line 7a is the most mature line audited so far (two prior fix phases + today\'s walkthrough closures).', 'outstanding.md lines 2280-2287 (resolved Phase 1/2 entries); lines/7ab.md "Implementation status (2026-04-16)" section', 'CLOSED — pure xlsx-flip historical observation. Records 8-gap Phase 1+2 completions for audit-trail completeness.'],
  [9, 'RESOLVED 2026-05-12 — OBSERVATION — REMAINING DEFERRED ITEMS IN lines/7ab.md §17 "Remaining deferred"', 'Per spec `lines/7ab.md` §17 "Remaining deferred" section (lines 39-43), four deferred items remain for line 7a: **(a)** Form 2439/6252/6781/8824/K-1 supplemental Schedule D line 4/5/11/12 amounts NOT auto-derived from statement data — user manually enters; affects narrow user groups; Low-medium priority. **(b)** 1099-S full computation (§121 principal residence exclusion + investment/rental gain auto-entry on Schedule D + personal-use loss reporting on Form 8949) — currently advisory flag only; affects home sellers/real estate sales; Medium priority. **(c)** 28% Rate Gain Worksheet (Schedule D line 18) + Unrecaptured §1250 Gain Worksheet (line 19) — user-entered values only, no auto-derivation; affects §1202/§1250 gain users; Medium priority. **(d)** E2E coverage for capital statement forms (1099-DA, 4684, 4797, 6252, 6781, 8824, K-1) temporarily removed; testing infrastructure; Low priority. **Closure applied**: pure xlsx-flip cross-reference. **NO new outstanding.md entries today** — anti-fragmentation rationale: (1) avoid duplicate documentation when spec §17 already serves as authoritative deferred-work list; (2) outstanding.md has ~30+ active entries already; further splits would dilute signal; (3) prior audit precedent — 6c #7 declined new entry for a documented design choice. Contrast with 5b #9 / 6b #9 / 6d #7 which created NEW entries for previously-undocumented gaps. Future cleanup audit could consolidate spec-documented items into outstanding.md if needed.', 'lines/7ab.md §17 "Remaining deferred" section (lines 39-43); outstanding.md (no new entries)', 'CLOSED — pure xlsx-flip cross-reference. No new outstanding entries today; items cross-referenced to spec §17.'],
  [10, 'RESOLVED 2026-05-12 — OBSERVATION — LINE 7a IS FIRST AUDIT AFTER 6abcd CLUSTER (single-line audit; composite output without gross sibling)', 'Pure xlsx-flip observation. **Line 7a is the FIRST audit after the 6abcd cluster completion** (closed earlier today via 6d #10). **Structural transition**: shifts from multi-sub-line cluster pattern (3abc/4abc/5abc/6abcd) to single-line + tightly-coupled-pair audits. Line 7a is single-line with composite output — 7b is metadata-only disclosure checkboxes/text describing line 7a\'s path (no separate computation). **Composite output without gross sibling** (per 6b #10 milestone — line 7a doesn\'t qualify for bilateral coverage pattern; single-sided inclusion citation at line-9 per 7a #4). **Cumulative through 7a**: 26 lines audited (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7a); 257 audit issues closed total; backend 756/756 tests pass (was 755; +1 from MFS lock-in `mfsExcludesSpouseCapitalGainLossFromLine7a`); **MFS guard cascade at 12 orchestrators** (extended today; matches `computeInterestIncome` density at codebase maximum, now exceeded by 1 — first time post-6abcd that the MFS cascade grew); **12-audit consolidation at line-9 site** (extended today via 7a #4 single-sided inclusion citation); 14-line knowledge-file naming convergence (extended today via 7a #2). **Looking ahead**: future audits begin line 7b (disclosure-only sibling — could be co-audited or separate) or line 8 (composite other income from Schedule 1). Future line 8 audit will extend line-9 consolidation to **13 audits — the FINAL line-9-operand audit citation** (since line 8 is the last numeric operand). No more cluster milestones, bilateral milestones, or 4-row verification logs anticipated; remaining Form 1040 income lines (7b, 8) are individual audits. Audit workflow shifts to single-line + pair audits going forward.', 'XLS/computations/7a.xlsx audit-trail (this row); no code change', 'CLOSED — pure xlsx-flip observation. First audit after 6abcd cluster; structural transition to single-line + pair audits.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 100 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 7a Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.capitalGainLoss', 'topmostSubform[0].Page1[0].f1_70[0] (line7_capital_gain_or_loss)', 'form-tax-return-1040.xlsx (line 7a cell)', '★ Primary output. Whole-dollar HALF_UP rounded.'],
  ['form1040.income.scheduleDNotRequiredLine7b', 'c1_43[0] (line7_schedule_d_not_required)', 'form-tax-return-1040.xlsx (line 7b checkbox)', 'Exception 1 path → TRUE.'],
  ['form1040.income.includesChildCapitalGainLossLine7b', 'c1_44[0] (line7_includes_child_capital_gain_or_loss)', 'form-tax-return-1040.xlsx (line 7b checkbox)', 'Form 8814 line 10 routing → TRUE.'],
  ['form1040.income.form8814Line10EntryLine7b', 'f1_71[0] (line7_schedule_d_note_text)', 'form-tax-return-1040.xlsx (line 7b entry space)', 'Form 8814 line 10 amount carried on return.'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['Form 1040 line 9 (total income)', '—', 'form-tax-return-1040.xlsx (line 9 cell)', '★★ INCLUDED as 7th operand. Carries to line 11a/11b AGI, line 15 taxable income, line 16 tax.'],
  ['Schedule D (when required)', 'multi-page', 'form-tax-return-1040-schedule-d.xlsx', 'Generated when !exception1 + hadAnyCapital.'],
  ['Form 8949 (when required)', 'multi-page', 'form-tax-return-8949.xlsx', 'Per-page (11 transactions/page); grouped by box A-L.'],
  ['Form 8997 (QOF)', 'when hasQofDeferral', 'form-tax-return-8997.xlsx', 'Phase 2 fix.'],
  ['Form 2439/6252/4797/4684/6781/8824 + K-1 capital attachments', 'when entries exist', 'individual form XLSX files', 'Phase 1 fix.'],
  [],
  ['INDIRECT IMPACT'],
  ['Form 1040 line 6b SS worksheet', '—', '—', 'Pub. 915 worksheet line 3 includes line 7a per 6b #6.'],
  ['QDCG Worksheet (line 16)', '—', '—', 'Preferential rate computation when qualified dividends + cap gains present.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Schedule B', '—', '—', 'Not applicable.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 70 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
