// ============================================================================
//  Generates: C:\us-tax\XLS\computations\7b.xlsx
//
//  Source-of-truth references:
//    - lines/7ab.md §8 (line 7b checkbox logic) + §9 (Form 8814 interaction)
//    - dependencies/7ab.md
//    - knowledge/line-7ab-capital-gain-loss.md (renamed via 7a #2)
//    - TaxReturnComputeService.computeCapitalGainLoss() — derives all 3 line 7b values
//      (MFS guard from 7a #1 protects line 7b too)
//    - PDF semantic CSV rows 33/34/85 — c1_43 line7_schedule_d_not_required;
//      c1_44 line7_includes_child_capital_gain_or_loss; f1_71 line7_schedule_d_note_text
//    - IRS 2025 Form 1040 line 7b instructions + Form 8814 instructions
//    - IRC §61(a)(3) (capital gains) — line 7a takes the amount; line 7b is disclosure
//
//  Tax year: 2025
//
//  NOTE: Line 7b is **metadata-only disclosure** for line 7a's path choice. THREE fields:
//   (1) "Schedule D not required" checkbox — TRUE when Exception 1 applies (per 7a #5)
//   (2) "Includes child's capital gain or (loss)" checkbox — TRUE when Form 8814 line 10
//       child amount is included on the return (per 7a #7 dual-path routing)
//   (3) Form 8814 line 10 entry-space — DISCLOSURE-only amount (the child portion already
//       flows through line 7a; this is for IRS visibility; NOT a separate line-9 addition)
//
//  Line 7b has NO separate computation — all three fields are DERIVED OUTPUTS from line 7a's
//  path choice. Tightly coupled with line 7a; sibling audit to 7a (completes the 7ab pair).
//
//  All 3 PDF fields are canonically mapped (no bug parallel to 6c #5 / 6d #5).
//
//  Line 7b-specific verifications:
//   • `line7bScheduleDNotRequired` derivation tied to Exception 1 (7a #5)
//   • `line7bIncludesChildCapitalGainLoss` + entry-space tied to Form 8814 routing (7a #7)
//   • Entry-space (f1_71) is DISCLOSURE-only — NOT a line-9 addition
//   • Cluster-completion: 7ab pair COMPLETE after this audit
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '7b.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 7b — CAPITAL GAIN/LOSS DISCLOSURE (2 checkboxes + entry space)'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 7b'],
  ['Concept', 'Disclosure of line 7a\'s path choice. THREE output fields — two boolean checkboxes plus one entry-space amount: (1) "Schedule D not required" checkbox set TRUE when Exception 1 applies (per 7a #5 8-condition AND gate); (2) "Includes child\'s capital gain or (loss)" checkbox set TRUE when parent reports Form 8814 line 10 child capital gain distribution on the return (per 7a #7 dual-path routing); (3) Entry-space text showing the Form 8814 line 10 amount — **DISCLOSURE-only** (the child amount already flows through line 7a; this is for IRS visibility, NOT a separate line-9 addition).'],
  ['Core invariant', 'Line 7b is **metadata-only disclosure** with NO separate computation. All 3 fields are derived OUTPUTS from line 7a\'s path choice (Exception 1 vs Schedule D vs child-amount inclusion). Tightly coupled with line 7a — sibling to 7a; completes the 7ab pair.'],
  ['Per-Return Formula',
    '**Three derived outputs** (TaxReturnComputeService.java:6811-6821):\n\n' +
    '  line7bScheduleDNotRequired         = exception1 ? TRUE : FALSE\n' +
    '  line7bIncludesChildCapitalGainLoss = includesChildCapitalGainLoss ? TRUE : FALSE\n' +
    '  line7bChildAmountFromForm8814Line10 = roundMoney(childAmount)\n\n' +
    'Where:\n' +
    '  exception1                       — 8-condition AND gate (per 7a #5)\n' +
    '  includesChildCapitalGainLoss     — `includesChildCapitalGainLossFromForm8814` parameter\n' +
    '  childAmount                       — `form8814Line10Total` parameter (the child capital gain distribution)\n\n' +
    '**Three IRC sources**:\n' +
    '  • IRS 2025 Form 1040 line 7b instructions — checkbox + entry-space layout\n' +
    '  • Form 8814 line 10 instructions — child capital gain disclosure\n' +
    '  • IRC §61(a)(3) — line 7a takes the amount; line 7b is disclosure-only\n\n' +
    '**Persistence on `Income`** (TaxReturnComputeService.java:4324-4326):\n' +
    '  income.setLine7bScheduleDNotRequired(capital.line7bScheduleDNotRequired())\n' +
    '  income.setLine7bIncludesChildCapitalGainLoss(capital.line7bIncludesChildCapitalGainLoss())\n' +
    '  income.setLine7bChildAmountFromForm8814Line10(roundMoney(capital.line7bChildAmountFromForm8814Line10()))'],
  ['Filed',
    'Form 1040 line 7b — three PDF fields (all canonically mapped):\n' +
    '  • c1_43[0] = `line7_schedule_d_not_required` (checkbox)\n' +
    '  • c1_44[0] = `line7_includes_child_capital_gain_or_loss` (checkbox)\n' +
    '  • f1_71[0] = `line7_schedule_d_note_text` (entry-space — formatted amount)\n' +
    '**NO PDF mapping bug** (unlike 6c #5 / 6d #5 which had `unmapped_*` semantic keys).'],
  ['Backend method', 'TaxReturnComputeService.computeCapitalGainLoss() — orchestrator (MFS guard from 7a #1 protects line 7b too). All 3 line 7b values are DERIVED outputs in the `CapitalGainLossComputation` record at TaxReturnComputeService.java:6811-6821.'],
  ['Output', 'form1040.income.line7bScheduleDNotRequired (Boolean), form1040.income.line7bIncludesChildCapitalGainLoss (Boolean), form1040.income.line7bChildAmountFromForm8814Line10 (BigDecimal — DISCLOSURE-only; not a line-9 addition).'],
  ['IRS source', 'IRS 2025 Form 1040 line 7b instructions + Form 8814 line 10 instructions + IRC §61(a)(3) gross income.'],
  [],
  ['STEP-BY-STEP DERIVATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Inherit Exception 1 result from line 7a path choice', '`exception1` flag set per 7a #5 8-condition AND gate. NO separate logic for line 7b.'],
  [2, 'Inherit child-cap-gain inclusion flag from Form 8814 routing', '`includesChildCapitalGainLossFromForm8814` parameter (passed to `computeCapitalGainLoss`).'],
  [3, 'Inherit child amount from Form 8814 line 10', '`form8814Line10Total` parameter — actual child capital gain distribution amount.'],
  [4, 'Derive line 7b boolean #1 (Schedule D not required)', '`exception1 ? TRUE : FALSE` at line 6813.'],
  [5, 'Derive line 7b boolean #2 (includes child cap gain)', '`includesChildCapitalGainLoss ? TRUE : FALSE` at line 6814.'],
  [6, 'Derive line 7b entry-space amount', '`roundMoney(childAmount)` at line 6815.'],
  [7, 'Construct CapitalGainLossComputation record', 'All 3 values passed to record constructor at line 6811-6821.'],
  [8, 'Persist on Income via buildIncome', 'TaxReturnComputeService.java:4324-4326 — three setters when capitalGainLoss is non-null.'],
  [9, 'PDF export — three fields filled correctly', 'Frontend `form-tax-return-1040.component.ts:315-317` reads income fields + maps to PDF semantic keys. All 3 mappings canonical (no bug).'],
  [],
  ['MUTUAL EXCLUSION / COUPLING RULES'],
  ['Rule', 'Implementation', 'Why'],
  ['line7bScheduleDNotRequired is TRUE iff Exception 1 applies', 'Line 6813: `exception1 ? TRUE : FALSE`.', 'Per IRS line 7b instructions: "Schedule D not required" checkbox is checked only when the taxpayer qualifies for Exception 1 (no Schedule D filing required).'],
  ['line7bIncludesChildCapitalGainLoss is TRUE iff parent includes child Form 8814 line 10', 'Line 6814: `includesChildCapitalGainLoss ? TRUE : FALSE`.', 'Per IRS line 7b instructions: "Includes child\'s capital gain or (loss)" checkbox is checked when the parent reports the child amount via Form 8814.'],
  ['Both checkboxes CAN coexist (Exception 1 + child amount)', 'Both flags independent.', 'Per spec §8.2: "This checkbox can coexist with the \'Schedule D not required\' checkbox when the child amount is flowing directly to line 7a rather than through Schedule D."'],
  ['Entry-space amount = childAmount (regardless of path)', 'Line 6815: `roundMoney(childAmount)` always set.', 'Per IRS line 7b instructions: enter the Form 8814 line 10 amount in the entry space WHENEVER the child checkbox is checked. Disclosure for IRS visibility.'],
  ['Entry-space is DISCLOSURE-only, NOT a line-9 addition', 'No `addNonNull(..., line7bChildAmountFromForm8814Line10, ...)` at line-9 site.', 'The child amount ALREADY flows through line 7a (either via Exception 1 direct add at 7a #7 PATH 1, or via Schedule D line 13 routing at 7a #7 PATH 2). Adding it again to line 9 would DOUBLE-COUNT.'],
  ['MFS guard inherited via line 7a path', 'Line 7a #1 MFS guard nulls capitalSpouse + spouse on MFS → 7a path computes with taxpayer-only data → 7b derivations follow.', 'Same single-guard cascade pattern as 4c/5c/6c/6d — boolean/disclosure outputs follow the underlying numeric line\'s MFS protection.'],
  [],
  ['DECISION TREE — When are the line 7b fields set?'],
  ['Scenario', 'line7bScheduleDNotRequired', 'line7bIncludesChildCapitalGainLoss', 'line7bChildAmountFromForm8814Line10'],
  ['No capital activity', 'FALSE (or null when CapitalGainLossComputation=null)', 'FALSE', '$0 / null'],
  ['Exception 1 qualified, no child', 'TRUE', 'FALSE', '$0 / null'],
  ['Exception 1 qualified, with child', 'TRUE', 'TRUE', 'childAmount (e.g., $60)'],
  ['Schedule D required, no child', 'FALSE', 'FALSE', '$0 / null'],
  ['Schedule D required, with child', 'FALSE', 'TRUE', 'childAmount (e.g., $60)'],
  ['MFS (spouse data nulled)', 'derived from taxpayer-only path', 'derived from taxpayer-only path', 'derived from taxpayer-only path'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 7b Flows'],
  ['Consumer', 'How', 'Notes'],
  ['Form 1040 PDF — c1_43[0] checkbox', 'Frontend reads `form.income?.line7bScheduleDNotRequired` → fills `line7_schedule_d_not_required` semantic key.', 'CSV row 33 canonically mapped.'],
  ['Form 1040 PDF — c1_44[0] checkbox', 'Frontend reads `form.income?.line7bIncludesChildCapitalGainLoss` → fills `line7_includes_child_capital_gain_or_loss` semantic key.', 'CSV row 34 canonically mapped.'],
  ['Form 1040 PDF — f1_71[0] entry-space', 'Frontend reads `form.income?.line7bChildAmountFromForm8814Line10` → formatAmount() → fills `line7_schedule_d_note_text` semantic key.', 'CSV row 85 canonically mapped.'],
  ['IRS visibility / disclosure', '—', 'Tells IRS reviewer (a) whether Schedule D was bypassed (Exception 1), (b) whether child Form 8814 line 10 is included, (c) the actual child amount.'],
  ['NOT IN OUTPUT — Line 9 total income', '—', 'Line 7b fields are DISCLOSURE only. Child amount already in line 7a (no double-count).'],
  ['NOT IN OUTPUT — Schedule D', '—', 'No Schedule D presence (line 7b is on Form 1040 directly).'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 28 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 7b'],
  ['Line 7b has NO independent inputs — all 3 fields are DERIVED from line 7a\'s computation. The "inputs" listed here are the upstream values that feed line 7a\'s path choice and child-amount routing.'],
  [],
  ['#', 'Source', 'Field path / parameter', 'Drives which line 7b field?', 'Cross-reference'],
  [],
  ['UPSTREAM PATH-CHOICE INPUTS (drive `line7bScheduleDNotRequired`)'],
  [1, '(derived in computeCapitalGainLoss)', 'exception1 (8-condition AND gate)', 'line7bScheduleDNotRequired', '7a #5 (Exception 1 derivation)'],
  [],
  ['UPSTREAM CHILD-AMOUNT INPUTS (drive `line7bIncludesChildCapitalGainLoss` + entry-space)'],
  [2, '(passed as parameter)', 'includesChildCapitalGainLossFromForm8814 (boolean)', 'line7bIncludesChildCapitalGainLoss', '7a #7 (Form 8814 dual-path routing)'],
  [3, '(passed as parameter)', 'form8814Line10Total (BigDecimal)', 'line7bChildAmountFromForm8814Line10', '7a #7 + Form 8814 line 10 source'],
  [],
  ['(No personal-form-specific inputs for line 7b — all derivation happens at computeCapitalGainLoss level after line 7a path computed.)'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 42 }, { wch: 65 }, { wch: 55 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 7b'],
  [],
  ['Constant', 'Value', 'Source', 'Used by line 7b?', 'Notes'],
  [],
  ['No direct numeric constants — line 7b is metadata-only disclosure derived from line 7a\'s path choice.'],
  ['Statutory references'],
  ['Capital gain inclusion', 'IRC §61(a)(3)', 'YES — indirectly via line 7a', 'Line 7a takes the amount; line 7b is disclosure-only.'],
  ['Form 8814 election + line 10 child cap gain', 'IRS Form 8814 instructions', 'YES', 'Drives the child checkbox + entry-space.'],
  ['Schedule D Exception 1', '2025 IRS Schedule D Instructions + Form 1040 line 7 instructions', 'YES', 'Drives the "Schedule D not required" checkbox.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 50 }, { wch: 50 }, { wch: 22 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 7b is Metadata-Only Disclosure'],
  ['Line 7b is THREE coupled outputs (2 checkboxes + 1 entry-space amount). All derived from line 7a path choice; no separate computation.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.income.line7bScheduleDNotRequired', 'TaxReturnComputeService.buildIncome():4324 — `income.setLine7bScheduleDNotRequired(...)`', '★ Output #1. PDF: c1_43[0] = `line7_schedule_d_not_required`. Set TRUE when Exception 1 applies.'],
  ['form1040.income.line7bIncludesChildCapitalGainLoss', 'TaxReturnComputeService.buildIncome():4325 — `income.setLine7bIncludesChildCapitalGainLoss(...)`', '★ Output #2. PDF: c1_44[0] = `line7_includes_child_capital_gain_or_loss`. Set TRUE when Form 8814 line 10 child amount included.'],
  ['form1040.income.line7bChildAmountFromForm8814Line10', 'TaxReturnComputeService.buildIncome():4326 — `income.setLine7bChildAmountFromForm8814Line10(roundMoney(...))`', '★ Output #3. PDF: f1_71[0] = `line7_schedule_d_note_text`. Entry-space carries child amount. DISCLOSURE-only.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 (total income)', '—', 'Booleans + entry-space amount are DISCLOSURE only. Child amount already in line 7a → no double-count.'],
  ['Schedule D', '—', 'Line 7b is on Form 1040 directly.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 7b-Related'],
  ['No line-7b-specific flags. Shared 7ab cluster flags inherited from line 7a.'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['CAPITAL_STATEMENT_UPLOAD_REQUIRED', 'BLOCKING', 'hadAnyCapital=true AND statements missing', '7a Validation Flags (inherited)'],
  ['CAPITAL_NOMINEE_DISTRIBUTIONS_REPORTED', 'ADVISORY', 'nomineeAdjustments > 0 (Phase 1)', '7a Validation Flags'],
  ['FORM_1099S_REAL_ESTATE_REPORTED', 'ADVISORY', '1099-S entries present (Phase 2)', '7a Validation Flags'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 7b is the **SIBLING audit to 7a** (completes the 7ab pair). Line 7b is metadata-only disclosure — all 3 fields derived from line 7a path choice; no separate computation. All 3 PDF mappings canonical (no bug parallel to 6c #5 / 6d #5). The audit is therefore predominantly cross-references + observations. Verified 2026-05-12.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — MFS GUARD CASCADE EXTENDED TO LINE 7b (2-AUDIT CONSOLIDATION) at `computeCapitalGainLoss`', 'Line 7b is in the 7a #1 MFS guard cascade — all 3 line 7b outputs are derived from line 7a path computation, which is MFS-protected at TaxReturnComputeService.java:6382-6404. **Closure applied**: extended the MFS-guard breadcrumb to cite **2 audit IDs** (7a #1 + 7b #1, both verified 2026-05-12). Added metadata-only note: line 7b is boolean-checkbox/entry-space disclosure derived from MFS-protected upstream — no separate spouse-leakage axis. **Single-guard MFS cascade at `computeCapitalGainLoss` now cites 2 audit IDs** — final state for the 7ab pair. No new lock-in test (existing `mfsExcludesSpouseCapitalGainLossFromLine7a` already exercises the cascade; line 7b protection follows implicitly via line 7a path). Pattern continuity: same growing-citation shape as `computeIraDistributions` (3 audits after 4c #1), `computePensionAnnuities` (3 audits after 5c #1), `computeSocialSecurityBenefits` (4 audits after 6d #1).', 'TaxReturnComputeService.java:6382-6404 (2-audit MFS-guard breadcrumb with line-7b metadata-only note)', 'CLOSED — multi-audit consolidation extended to 2 audits. No code change beyond breadcrumb.'],
  [2, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — KNOWLEDGE FILE ALREADY RENAMED VIA 7a #2 (2nd AND FINAL cascade citation within 7ab pair)', '`knowledge/line-7ab-capital-gain-loss.md` (renamed from `knowledge_7ab.md` via 7a #2 earlier today — first migration of Legacy A underscore-prefix form) is a shared file covering both 7a + 7b. Pure xlsx-flip closure — **2nd and FINAL cascade citation within the 7ab pair** (no 7c/7d siblings exist; pair is now complete on knowledge-file citation count). Smallest pair-citation cascade in the audit workflow (1 cluster-start + 1 sibling = 2 total cites). No YAML frontmatter to update (plain `# Knowledge: ...` heading). Header-comment reference in `generate-7b.js` already uses the new canonical name. **Line 1c → 7ab knowledge-file naming convergence remains complete across 14 lines** (1c, 1d, 1e, 1f, 1g, 1h, 1i, 1z, 2ab, 3ab, 4abc, 5abc, 6abcd, 7ab). Remaining Legacy A files (4): knowledge_line16/17/26/27abc.md — will rename during future audits. Same shape as 5c #2 / 6c #2 / 6d #2 (sibling-cite-cluster-start patterns).', 'C:\\us-tax\\knowledge\\line-7ab-capital-gain-loss.md (already correctly named)', 'CLOSED via 7a #2 — pure xlsx-flip closure. 2nd and FINAL cascade citation within 7ab pair.'],
  [3, 'RESOLVED 2026-05-12 — SPEC ENHANCEMENT — VERIFICATION LOG 2nd ROW APPENDED TO lines/7ab.md (completes 7ab log at 2 rows — SMALLEST PAIR-ALIGNED LOG IN WORKFLOW)', '`lines/7ab.md` Verification log section (created during 7a #3 via NORMAL-variant pattern) had 1 row (7a complete). **Closure applied**: appended 2nd row in IN-PROGRESS state at the END of the table (chronological order) capturing the 7b walkthrough (#1 MFS guard 2-audit consolidation + #2 knowledge file already renamed + #3 this 2nd row appended). **Completes the 7ab Verification log at 2 rows** — **SMALLEST PAIR-ALIGNED VERIFICATION LOG IN THE AUDIT WORKFLOW** (pair with only 2 sub-lines; cf. 3abc/4abc/5abc 3-row logs and 6abcd 4-row log). To be finalized to "COMPLETE — 10/10 closed" during end-of-walkthrough docs-update step. **Append-row pattern** (same shape as 5c #3 / 4c #3 / 3c #3 / 6c #3 / 6d #3). Future single-line audits (line 8, line 9, line 10, etc.) won\'t produce verification logs at all — those are per-audit history.md entries instead of structured logs.', 'lines/7ab.md Verification log (7b row appended as 2nd row; completes pair log at 2 rows)', 'CLOSED — spec verification log row appended. SMALLEST pair-aligned log reached at 2 rows.'],
  [4, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — LINE 7b STRUCTURALLY NOT IN LINE 9 (covered by 6c #4 boolean-clarification + 7b entry-space is DISCLOSURE-only — double-count prevention)', 'Two line 7b sub-types: (a) Two BOOLEAN checkboxes (`line7bScheduleDNotRequired` + `line7bIncludesChildCapitalGainLoss`) — covered by 6c #4 boolean-type clarification at the line-9 "Notably absent" list; (b) ONE BigDecimal entry-space (`line7bChildAmountFromForm8814Line10`) — NUMERIC, but DISCLOSURE-only since the child amount ALREADY flows through line 7a (per 7a #7 dual-path routing). **Closure applied**: extended the line-9 "Notably absent" paragraph at TaxReturnComputeService.java:4185-4200 with TWO additions: (1) explicitly noted that line 7b\'s two checkboxes fall in the existing Boolean-type exclusion category (covered by 6c #4 / 6d #4 paragraph); (2) **NEW THIRD exclusion category — DOUBLE-COUNT PREVENTION (numeric-but-already-in-upstream-line)** — documents that `line7bChildAmountFromForm8814Line10` is a NUMERIC field but excluded from line 9 because the value is already in line 7a; adding it again would double-count the child portion. **Three exclusion categories now documented at the line-9 site**: (A) IRS-rule (2a/1i/3a/4a/5a/6a); (B) Boolean-type (6c/6d/7b checkboxes); (C) Double-count-prevention (7b entry-space — NEW today). **12-audit consolidation count PRESERVED** — no new audit ID added (NEW exclusion category is qualitatively different from could-have-been-included-numeric decisions). Pure documentation extension — no formula change.', 'TaxReturnComputeService.java:4185-4200 (extended "Notably absent" paragraph with line-7b boolean cite + NEW double-count-prevention exclusion category)', 'CLOSED — clarification-only extension. NEW third exclusion category documented. 12-audit consolidation count preserved.'],
  [5, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — `line7bScheduleDNotRequired` DERIVATION (Exception 1 → checkbox)', '`line7bScheduleDNotRequired = exception1 ? Boolean.TRUE : Boolean.FALSE` at TaxReturnComputeService.java:6839 (within CapitalGainLossComputation constructor). Per spec §8.1 + IRS 2025 line 7b instructions: check the "Schedule D not required" checkbox iff the taxpayer qualifies for Exception 1. Direct boolean shadow of the Exception 1 flag (per 7a #5 8-condition AND gate); safe-by-default (FALSE when Exception 1 absent → IRS form correctly shows taxpayer is NOT bypassing Schedule D). PDF: c1_43[0] → `line7_schedule_d_not_required` (canonically mapped per 7b #7). Frontend setter at `form-tax-return-1040.component.ts:315`. **Closure applied**: **11-line block breadcrumb** at TaxReturnComputeService.java:6829-6839 above the `return new CapitalGainLossComputation(...)` constructor — header block documenting all 3 line 7b derivations as a unit; this row contributes the 7b #5 portion (line7bScheduleDNotRequired — Exception 1 → checkbox). 7b #6 will extend the block with the remaining two derivations. Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:6829-6839 (header block breadcrumb documenting line 7b derivations — 7b #5 contributes line7bScheduleDNotRequired sub-paragraph)', 'CLOSED — verified correct. Block-breadcrumb header documents Exception 1 → checkbox derivation.'],
  [6, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — `line7bIncludesChildCapitalGainLoss` + ENTRY-SPACE DERIVATION (Form 8814 routing → checkbox + amount)', 'Two derivations covered: (Arg 3) `line7bIncludesChildCapitalGainLoss = includesChildCapitalGainLoss ? Boolean.TRUE : Boolean.FALSE`; (Arg 4) `line7bChildAmountFromForm8814Line10 = roundMoney(childAmount)`. Per spec §8.2 + IRS Form 8814 line 10 instructions: set the "Includes child\'s capital gain or (loss)" checkbox AND enter the Form 8814 line 10 amount in the entry-space when parent reports child amount on the return. **Path-independent disclosure** — checkbox + entry-space are set the SAME way regardless of 7a #7 PATH 1 (Exception 1 direct add) vs PATH 2 (Schedule D line 13 → 15 → 16 routing); the IRS form discloses the FACT of inclusion. **Closure applied**: extended the 7b #5 block breadcrumb at TaxReturnComputeService.java:6829-6856 with **two additional bullet paragraphs** documenting Args 3 + 4: (a) Arg 3 — path-independence rationale + PDF mapping (c1_44 → `line7_includes_child_capital_gain_or_loss`; canonical per 7b #7) + frontend setter at form-tax-return-1040.component.ts:316; (b) Arg 4 — path-independence + **DISCLOSURE-ONLY — NOT a line-9 addition** (cross-reference 7b #9 + 7b #4 third-category clarification: amount already in line 7a; adding to line 9 would DOUBLE-COUNT) + PDF mapping (f1_71 → `line7_schedule_d_note_text`; canonical) + frontend setter at form-tax-return-1040.component.ts:317 with `formatAmount()` formatting. Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:6829-6856 (block breadcrumb extended with Args 3+4 sub-paragraphs)', 'CLOSED — verified correct. Block-breadcrumb extension documents Form 8814 routing → checkbox + entry-space.'],
  [7, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — ALL 3 PDF SEMANTIC MAPPINGS CANONICAL (no parallel to 6c #5 / 6d #5 bug)', 'Direct CSV inspection at `us-tax-ui/public/irs/f1040_field_mapping_semantic.csv` confirms all 3 line 7b PDF rows are canonically mapped: **Row 33** `c1_43[0]` → `line7_schedule_d_not_required` ✓; **Row 34** `c1_44[0]` → `line7_includes_child_capital_gain_or_loss` ✓; **Row 85** `f1_71[0]` → `line7_schedule_d_note_text` ✓. Frontend setters at `form-tax-return-1040.component.ts:315-317` use matching canonical keys → CSV lookups match → PDF export wires through correctly for all three line 7b fields. **NO unmapped semantic keys** (unlike pre-fix 6c #5 / 6d #5 which had `unmapped_c1_41_0` / `unmapped_c1_42_0` from the TY2025 form redesign for the new line 6c/6d checkboxes). Line 7b fields are established (not new-for-2025) and were correctly mapped from the start. **Closure**: pure xlsx-flip affirmative verification — no code change, no breadcrumb needed; audit-trail row records the verification for completeness (same shape as 6d #8 historical observation + 6c #8 documentation correction). Pattern: discrete audit-trail row for affirmative verification of a class of bugs that affected sibling cluster (6abcd) but does not affect this pair (7ab).', 'us-tax-ui/public/irs/f1040_field_mapping_semantic.csv rows 33/34/85; form-tax-return-1040.component.ts:315-317', 'CLOSED — verified correct via CSV inspection. No PDF bug; affirmative-verification audit-trail row.'],
  [8, 'RESOLVED 2026-05-12 — OBSERVATION — LINE 7b IS METADATA-ONLY DISCLOSURE (no separate computation; tight coupling with line 7a)', 'Pure xlsx-flip observation. Line 7b has **NO independent computation** — all 3 fields are derived OUTPUTS from line 7a\'s path choice: `line7bScheduleDNotRequired = exception1 ? TRUE : FALSE` (single ternary); `line7bIncludesChildCapitalGainLoss = includesChildCapitalGainLoss ? TRUE : FALSE` (single ternary); `line7bChildAmountFromForm8814Line10 = roundMoney(childAmount)` (single assignment). Each derivation is one line of code embedded within the CapitalGainLossComputation record constructor at TaxReturnComputeService.java:6856-6864. **Tight coupling with line 7a**: when line 7a path changes (Exception 1 vs Schedule D vs Schedule D + child), line 7b values change deterministically — no separate validation, no conditional branches, no method calls. **Testing implication**: no line-7b-specific tests exist or are needed; existing 4 capital tests (`computesCapitalGainLossException1WithoutScheduleD`, `computesCapitalGainLossWithScheduleDAndForm8949WhenSalesExist`, `form8814ChildCapGainFlowsThroughScheduleDLine13WhenScheduleDRequired`, `mfsExcludesSpouseCapitalGainLossFromLine7a`) exercise line 7b assertions as side effects of testing line 7a path choice. Per 7a #10 cluster-transition observation: 7a/7b is a **tightly-coupled-pair** — not a multi-sub-line cluster like 6abcd. **Closure**: substantive content already in 7b #5 + 7b #6 block breadcrumb at TaxReturnComputeService.java:6829-6856. Audit-trail row records the design observation as a discrete data point (same shape as 6c #8 + 6d #8 + 6d #9 + 7b #7 audit-trail-completeness separations).', 'TaxReturnComputeService.java:6829-6856 (covered by 7b #5 + 7b #6 block breadcrumb)', 'CLOSED — observation. Audit-trail row records design observation; substantive content in 7b #5 + 7b #6.'],
  [9, 'RESOLVED 2026-05-12 — OBSERVATION — `line7bChildAmountFromForm8814Line10` IS DISCLOSURE-ONLY, NOT A LINE-9 ADDITION (double-count prevention)', 'Pure xlsx-flip observation — **critical correctness invariant**. The entry-space amount (`line7bChildAmountFromForm8814Line10` — BigDecimal, NUMERIC) is NOT a separate line-9 addition. The child amount has ALREADY flowed through line 7a via one of two paths (per 7a #7): PATH 1 Exception 1 direct add (line 7a = line7aBase + childAmount); PATH 2 Schedule D line 13 → 15 → 16 → line7aBase (Phase 1 fix). If added to line 9 separately, the child amount would be counted TWICE → over-stated AGI → over-taxation. The entry-space exists for IRS visibility/disclosure (so the reviewer knows the child portion of line 7a), NOT for re-aggregation. **Three documentation touchpoints reinforce this invariant**: (1) **7b #4** extended the line-9 "Notably absent" paragraph with NEW THIRD exclusion category (C) "double-count-prevention (numeric-but-already-in-upstream-line)" — distinct from category (A) IRS-rule exclusions and category (B) boolean-type exclusions; (2) **7b #6** Arg 4 sub-paragraph in the constructor block breadcrumb explicitly states "DISCLOSURE-ONLY — NOT a line-9 addition" with cross-reference to 7b #9 + 7b #4; (3) **7b #9 (this row)** records the invariant as standalone correctness observation. **NEW EXCLUSION CATEGORY (C) PRECEDENT ESTABLISHED** — first numeric line-9 exclusion based on already-counted-upstream in the audit workflow. Future audits encountering similar patterns can cite this precedent. Audit-trail-completeness pattern continuity (same shape as 6c #8 + 6d #8 + 6d #9 + 7b #7 + 7b #8 discrete observation rows).', 'TaxReturnComputeService.java line-9 "Notably absent" paragraph (extended per 7b #4) + constructor block breadcrumb (per 7b #6 Arg 4)', 'CLOSED — substantive correctness invariant observation. Discrete audit-trail row.'],
  [10, 'RESOLVED 2026-05-12 — OBSERVATION — 7ab PAIR COMPLETE — FIRST TIGHTLY-COUPLED-PAIR AUDIT AFTER CLUSTER ERA', 'Pure xlsx-flip observation. **7ab pair COMPLETE** — line 7b closes the pair (after line 7a closed this morning). **FIRST tightly-coupled-pair audit after cluster era** (3abc / 4abc / 5abc multi-sub-line clusters + 6abcd 4-sub-line cluster). Line 7a is single-line composite + line 7b is metadata disclosure for line 7a path; smaller and tighter coupling than cluster-era audits. **Audit workflow pattern transition recap**: wage block (1a-1i, 1z single-line) → income pair era (2ab/3ab) → distribution cluster era (4abc/5abc with bilateral gross-vs-taxable pairs) → 4-sub-line cluster era (6abcd) → **tightly-coupled-pair era (7ab today)** → next single-line era (line 8 + line 9 formula + lines 10+ AGI/deductions/tax-computation). **Cumulative through 7b**: 27 lines audited; 267 audit issues closed; backend 756/756 (unchanged from 7a — no Java code change in 7b walkthrough); 12 MFS-protected orchestrators; 12-audit line-9 consolidation; **three line-9 exclusion categories formalized** (A) IRS-rule, (B) Boolean-type, (C) Double-count-prevention NEW today via 7b #4 + 7b #9; 14-line knowledge convergence; verification logs across clusters (2ab 4-row historical, 3abc/4abc/5abc 3-row, 6abcd 4-row, **7ab 2-row smallest-pair-aligned**); ZERO new outstanding.md entries in 7b walkthrough (anti-fragmentation policy from 7a #9). **Looking ahead — line 8 will be FINAL line-9 operand audit**: line 8 audit will extend line-9 consolidation to **13 audits — the FINAL line-9-operand audit citation** (since line 8 is the last numeric operand in line 9 = 1z + 2b + 3b + 4b + 5b + 6b + 7a + 8). After line 8, workflow shifts to AGI/deductions/taxable-income/tax-computation territory (lines 9+); no more cluster/pair/bilateral/multi-row-log milestones — all structural patterns from lines 1-7 are exhausted.', 'XLS/computations/7b.xlsx audit-trail (this row); no code change', 'CLOSED — pure xlsx-flip observation. **7ab pair COMPLETE.** First tightly-coupled-pair after cluster era; audit workflow pattern transition complete.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 100 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 7b Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.line7bScheduleDNotRequired', 'topmostSubform[0].Page1[0].c1_43[0] (line7_schedule_d_not_required)', 'form-tax-return-1040.xlsx (line 7b checkbox)', '★ Output #1. Boolean. Mapped canonically.'],
  ['form1040.income.line7bIncludesChildCapitalGainLoss', 'topmostSubform[0].Page1[0].c1_44[0] (line7_includes_child_capital_gain_or_loss)', 'form-tax-return-1040.xlsx (line 7b checkbox)', '★ Output #2. Boolean. Mapped canonically.'],
  ['form1040.income.line7bChildAmountFromForm8814Line10', 'topmostSubform[0].Page1[0].f1_71[0] (line7_schedule_d_note_text)', 'form-tax-return-1040.xlsx (line 7b entry-space)', '★ Output #3. BigDecimal — entry-space amount. Mapped canonically. **DISCLOSURE-only — NOT a line-9 addition.**'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9', '—', '—', 'Booleans + entry-space amount are DISCLOSURE only. Child amount already in line 7a (no double-count).'],
  ['Schedule D', '—', '—', 'Line 7b is on Form 1040 directly.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 70 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
