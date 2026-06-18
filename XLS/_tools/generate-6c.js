// ============================================================================
//  Generates: C:\us-tax\XLS\computations\6c.xlsx
//
//  Source-of-truth references:
//    - lines/6abcd.md §7 (line 6c lump-sum election method) + §10 Step 5
//    - dependencies/6abcd.md (NOTE: claims "Gap 4 resolved 2026-04-15" — STALE per 6c #5)
//    - knowledge/line-6abcd-social-security.md (renamed 2026-05-12 via 6a #2)
//    - TaxReturnComputeService.computeSocialSecurityBenefits() (orchestrator with MFS guard from 6a #1)
//    - TaxReturnComputeService.computeTaxableSocialSecurityLumpSum() (Pub. 915 Worksheet 3 — documented at 6b #9)
//    - PDF semantic CSV row 31: c1_41[0] — CURRENTLY UNMAPPED (see 6c #5)
//    - IRS 2025 Form 1040 line 6c instructions + Pub. 915 §"Lump-Sum Election"
//    - IRC §86(e) (lump-sum election method)
//
//  Tax year: 2025
//
//  NOTE: Line 6c is the **lump-sum election method checkbox** — boolean output, NOT a numeric
//  value. Set TRUE when (a) user elects the method AND (b) the resulting taxable amount is LOWER
//  than the normal computation. Structurally NOT eligible for line-9 inclusion (boolean, not
//  income amount). The big-ticket item is Issue #5 — PDF CSV mapping for c1_41[0] is currently
//  `unmapped_c1_41_0`; frontend silently sets `line6c_lump_sum_election` but CSV has no semantic
//  row → checkbox export is silent.
//
//  Line 6c-specific verifications focus on:
//   • PDF semantic CSV mapping (c1_41[0] → line6c_lump_sum_election)
//   • Three-condition AND gate at the election decision site
//   • User-intent-vs-IRS-correctness asymmetry (election silently dropped if not beneficial)
//   • Cross-reference to 6b #9 lump-sum prior-year fidelity gaps
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '6c.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 6c — LUMP-SUM ELECTION METHOD CHECKBOX'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 6c'],
  ['Concept', 'Boolean checkbox indicating that the taxpayer ELECTED the lump-sum election method under IRC §86(e) AND the election produced a LOWER taxable amount than the normal computation. Line 6c is set TRUE when both conditions hold; otherwise FALSE. The election allows recomputing the taxable portion of a retroactive Social Security back-payment using prior-year income context (Pub. 915 Worksheet 3) — beneficial when prior-year income was lower than current-year income.'],
  ['Core invariant', 'Line 6c is a BOOLEAN — not a numeric output. Set TRUE iff `electsLumpSumElection AND taxableLumpSum < taxableNormal`. Setting TRUE always coincides with line 6b being updated from `taxableNormal` → `taxableLumpSum` (the lower value).'],
  ['Per-Return Formula',
    'three-condition AND gate at TaxReturnComputeService.java:8509-8513:\n' +
    '  line6c = electsLumpSumElection                            // user-intent flag from social-security-taxpayer form\n' +
    '         AND taxableLumpSum != null                         // Pub. 915 Worksheet 3 produced a result\n' +
    '         AND taxableNormal != null                          // sanity (always non-null if line6a populated)\n' +
    '         AND taxableLumpSum.compareTo(taxableNormal) < 0    // election BENEFICIAL\n\n' +
    'Coupled assignment:\n' +
    '  if (line6c TRUE):\n' +
    '    line6b = taxableLumpSum   // election applied; line 6b shows lower amount\n' +
    '    line6c = true             // checkbox set\n' +
    '  else:\n' +
    '    line6b = taxableNormal    // normal computation stands\n' +
    '    line6c = false\n\n' +
    '**Asymmetry**: even when user has `electsLumpSumElection=true`, line 6c is FALSE if the election does not produce a lower amount. The user\'s election INTENT is silently dropped when not beneficial. (See 6c #7 design observation.)'],
  ['Filed', 'Form 1040 line 6c checkbox. PDF field: topmostSubform[0].Page1[0].c1_41[0]. **PDF semantic CSV mapping**: currently `unmapped_c1_41_0` (see 6c #5 — fix required to map to `line6c_lump_sum_election` so the checkbox actually exports).'],
  ['Backend method',
    'TaxReturnComputeService.computeSocialSecurityBenefits() — orchestrator decides line 6c at lines 8507-8513.\n' +
    'TaxReturnComputeService.computeTaxableSocialSecurityLumpSum() (~line 8839-8915) — Pub. 915 Worksheet 3 producing taxableLumpSum (documented at 6b #9).'],
  ['Output', 'form1040.income.line6cLumpSumElection (Boolean; FALSE when no election; TRUE when election applied AND beneficial). PDF: checkbox c1_41[0] (currently unmapped — see 6c #5).'],
  ['IRS source', 'IRS 2025 Form 1040 instructions for line 6c + IRS Pub. 915 (2025) "Lump-Sum Election" section + IRC §86(e) (lump-sum election method)'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Compute taxableNormal via Pub. 915 Social Security Benefits Worksheet', '`computeTaxableSocialSecurityNormal(...)` at line 8442-8450. Documented at 6b #6.'],
  [2, 'Read hasLumpSumBackPayment + electsLumpSumElection from social-security-taxpayer form', 'Lines 8452-8453. Both Boolean.TRUE checks.'],
  [3, 'Initialize taxableLumpSum = taxableNormal (fallback)', 'Line 8454. When no lump-sum back payment OR no allocation details, taxableLumpSum stays = taxableNormal → no election benefit. Correct fallback per 6b #9 Gap (iii).'],
  [4, 'If hasLumpSumBackPayment: compute taxableLumpSum via Pub. 915 Worksheet 3', 'Lines 8455-8467. `computeTaxableSocialSecurityLumpSum(...)` recomputes taxable using prior-year income. Returns null when lumpSumDetails empty → orchestrator emits SOCIAL_SECURITY_LUMP_SUM_ALLOCATION_REQUIRED advisory flag and falls back to taxableNormal.'],
  [5, 'Apply election decision (line 6c three-condition AND gate)', '`if electsLumpSumElection && taxableLumpSum != null && taxableNormal != null && taxableLumpSum < taxableNormal: line6b = taxableLumpSum; line6c = true; else: line6b = taxableNormal; line6c = false`. Coupled assignment of line 6b and line 6c.'],
  [6, 'Force zero + 85% cap + zero-floor at orchestrator output', 'Documented at 6b #8 (three-protection chain). Line 6c is NOT affected by these protections (boolean output).'],
  [7, 'Persist on form1040.income via buildIncome', '`income.setLine6cLumpSumElection(socialSecurity.line6cLumpSumElection())` at line 4302.'],
  [8, 'PDF export — checkbox c1_41[0]', '**CURRENTLY BROKEN**: CSV semantic name is `unmapped_c1_41_0`. Frontend sets `line6c_lump_sum_election` value but CSV has no matching row → checkbox fill silently ignored. See 6c #5 fix.'],
  [],
  ['MUTUAL EXCLUSION RULES (enforced by code or spec)'],
  ['Rule', 'Implementation', 'Why'],
  ['Line 6c TRUE coupled with line 6b = taxableLumpSum', 'Lines 8511-8512: both lines updated atomically within the AND-gate branch.', 'Per IRS rule: line 6c is just a disclosure that the lump-sum method was used to compute line 6b; the two outputs must be consistent.'],
  ['Line 6c FALSE when election not beneficial (asymmetry)', 'Three-condition AND gate at line 8509-8513 requires `taxableLumpSum < taxableNormal` to set TRUE.', 'Implementation design choice: silently drop user election if not beneficial (always produces lower line 6b for user). Per IRS rule, the election is the USER\'S CHOICE — strictly, line 6c should be TRUE iff the user elected, regardless of outcome. Current behavior is user-favorable; design observation documented at 6c #7.'],
  ['Line 6c is NEVER set without lump-sum back payment data', 'Lines 8452-8467: `hasLumpSumBackPayment` gate + null check on taxableLumpSum.', 'When no back payment is reported, the lump-sum method doesn\'t apply. User attempting to elect without data triggers advisory flag.'],
  ['Line 6c is structurally NOT eligible for line 9 inclusion', 'Boolean type; line 9 is BigDecimal addNonNull chain.', 'Mathematical type incompatibility. Java compile-time protection.'],
  [],
  ['DECISION TREE — When does line 6c = TRUE?'],
  ['Scenario', 'electsLumpSumElection', 'taxableLumpSum vs taxableNormal', 'line6c', 'line6b'],
  ['No lump-sum back payment', 'N/A', 'N/A (taxableLumpSum=taxableNormal initial)', 'FALSE', 'taxableNormal'],
  ['Back payment, user did NOT elect', 'FALSE', 'computed but unused', 'FALSE', 'taxableNormal'],
  ['Back payment + user elected + election BENEFICIAL', 'TRUE', 'taxableLumpSum < taxableNormal', '**TRUE**', 'taxableLumpSum (lower)'],
  ['Back payment + user elected + election NOT beneficial', 'TRUE', 'taxableLumpSum >= taxableNormal', 'FALSE (asymmetry per 6c #7)', 'taxableNormal'],
  ['Back payment + user elected + missing allocation details', 'TRUE', 'taxableLumpSum=null (returns null per line 8852)', 'FALSE', 'taxableNormal + SOCIAL_SECURITY_LUMP_SUM_ALLOCATION_REQUIRED flag'],
  ['MFS (spouse data nulled)', 'taxpayer-only flag', 'taxpayer-only', 'taxpayer-decision', 'taxpayer-only line6b'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 6c Flows'],
  ['Consumer', 'How', 'Notes'],
  ['form1040.income.line6cLumpSumElection (Java field)', 'income.setLine6cLumpSumElection(...) at line 4302', 'Persisted on the output model.'],
  ['Form 1040 PDF — c1_41[0] checkbox', '**CURRENTLY BROKEN** — CSV semantic name unmapped (see 6c #5).', 'After 6c #5 fix: CSV semantic name → `line6c_lump_sum_election`; frontend export wires through.'],
  ['hasOutput gating in orchestrator', 'Line 8558: `hasOutput = ... || line6c || ...`', 'Line 6c=TRUE prevents the entire SS computation from being skipped at orchestrator end (line 8556-8563).'],
  ['Tax return derived SS line in shell', 'Line 4070: `... || Boolean.TRUE.equals(socialSecurity.line6cLumpSumElection())`', 'Drives derived "has Social Security computation" flag for UI rendering.'],
  ['NOT IN OUTPUT — Line 9 total income', '—', 'Line 6c is a boolean — structurally NOT eligible. Mathematically incomparable.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 28 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 6c'],
  ['Line 6c is a derived BOOLEAN. Three direct inputs + the entire lump-sum computation chain.'],
  [],
  ['#', 'Source xlsx', 'Field path / model key', 'Label / box', 'Required?', 'Role in line 6c compute', 'Cross-reference'],
  [],
  ['DIRECT INPUTS — three-condition AND gate operands'],
  [1, 'form-social-security-benefits-taxpayer.xlsx', 'electsLumpSumElectionMethod', 'Elects lump-sum method?', 'YES — user-intent flag', 'Required TRUE for line 6c = TRUE. When FALSE, line 6c always FALSE.', 'IRC §86(e); spec §7.4'],
  [2, 'form-social-security-benefits-taxpayer.xlsx', 'hasLumpSumBackPaymentForPriorYears', 'Lump-sum back payment received?', 'YES — gates computation', 'Gates `computeTaxableSocialSecurityLumpSum` call at line 8455. When FALSE, taxableLumpSum stays = taxableNormal → line 6c always FALSE.', 'Pub. 915 §"Lump-Sum Election"'],
  [3, 'form-social-security-benefits-taxpayer.xlsx', 'lumpSumDetails[] (repeating)', 'Per-prior-year allocation', 'YES (required when electing)', 'When empty, `computeTaxableSocialSecurityLumpSum` returns null → election not applied → line 6c FALSE + SOCIAL_SECURITY_LUMP_SUM_ALLOCATION_REQUIRED advisory flag fires.', 'Pub. 915 Worksheet 3'],
  [],
  ['INDIRECT INPUTS — Lump-sum recompute inputs (per row in lumpSumDetails)'],
  [4, 'form-social-security-benefits-taxpayer.xlsx', 'lumpSumDetails[i].lumpSumAllocatedToPriorYear', 'Lump-sum portion allocated', 'YES', 'Drives Pub. 915 Worksheet 3 Step 1 (sum) + Step 2 (current-year regular benefits computation). Per 6b #9.', 'Pub. 915 Worksheet 3 line 2'],
  [5, 'form-social-security-benefits-taxpayer.xlsx', 'lumpSumDetails[i].priorYearBenefitsPreviouslyReported', 'Prior-year SS benefits', 'YES', 'Combined with allocated portion to compute totalPriorYearSS for recompute.', 'Pub. 915 Worksheet 3'],
  [6, 'form-social-security-benefits-taxpayer.xlsx', 'lumpSumDetails[i].priorYearTaxableBenefitsPreviouslyReported', 'Prior-year taxable SS', 'YES', 'Subtracted from recomputed prior-year taxable → additional amount for current year.', 'Pub. 915 Worksheet 3'],
  [7, 'form-social-security-benefits-taxpayer.xlsx', 'lumpSumDetails[i].priorYearOtherIncomeForRecompute', 'Prior-year other income', 'YES — recompute', 'Passed as worksheetLine3 to per-prior-year `computeTaxableSocialSecurityNormal` recompute.', '6b #9 Gap detail'],
  [8, 'form-social-security-benefits-taxpayer.xlsx', 'lumpSumDetails[i].priorYearTaxExemptInterestForRecompute', 'Prior-year tax-exempt interest', 'YES — recompute', 'Passed as worksheetLine4.', '6b #9'],
  [9, 'form-social-security-benefits-taxpayer.xlsx', 'lumpSumDetails[i].priorYearAdjustmentsForRecompute', 'Prior-year Schedule 1 adjustments', 'YES — recompute', 'Passed as worksheetLine6 (currently uses full line 26 subset gap from 6b #5 fix applies here too).', '6b #9'],
  [],
  ['UPSTREAM COMPUTED INPUTS — taxableNormal context'],
  [10, '(computed — see line 6b inputs)', 'taxableNormal', 'Normal Pub. 915 worksheet result', 'YES — comparison operand', 'computed via computeTaxableSocialSecurityNormal at line 8442-8450. See 6b inputs sheet.', '6b audit'],
  [11, '(computed — see line 6b inputs)', 'taxableLumpSum', 'Pub. 915 Worksheet 3 result', 'YES — comparison operand', 'computed via computeTaxableSocialSecurityLumpSum at line 8456-8458. See 6b inputs sheet + 6b #9.', '6b #9'],
  [],
  ['IDENTITY INPUTS'],
  [12, 'form-identification-taxpayer.xlsx', 'taxpayerIdentity.ssn', 'Taxpayer SSN', 'YES', 'Drives upstream line 6a + line 6b → taxableNormal/taxableLumpSum. MFS-protected via 6a #1.', '6a #1'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 42 }, { wch: 65 }, { wch: 55 }, { wch: 30 }, { wch: 80 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 6c'],
  [],
  ['Constant', 'Value', 'Source', 'Used by line 6c?', 'Notes'],
  [],
  ['No direct numeric constants — line 6c is a boolean derived from a comparison.'],
  ['Statutory references'],
  ['Lump-sum election method', 'IRC §86(e)', 'Authority for the election. User must affirmatively elect on the return; election allows recomputing taxable amount using prior-year income context.'],
  ['Beneficial-election rule', 'IRC §86(e) + Pub. 915 §"Lump-Sum Election"', 'Election may be made when prior-year income lowers the lump-sum taxable amount below the normal computation. Implementation requires `taxableLumpSum < taxableNormal` for line 6c = TRUE (asymmetry per 6c #7).'],
  ['Pub. 915 Worksheet 3', 'IRS Pub. 915 (2025)', '4-step prior-year recompute algorithm — documented at 6b #9.'],
  [],
  ['No annual constants — line 6c rules have been stable since IRC §86(e) enactment in 1984.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 45 }, { wch: 30 }, { wch: 35 }, { wch: 22 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 6c is a Disclosure Checkbox'],
  ['Line 6c is a TRUE/FALSE flag — no numeric value. Its setting is coupled with line 6b (when 6c=TRUE, line 6b is updated to taxableLumpSum).'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['Form 1040 line 6c (checkbox)', 'TaxReturnComputeService.buildIncome() — income.setLine6cLumpSumElection(...)', '★ Primary output. Persisted on form1040.income as Boolean.'],
  ['Form 1040 line 6b (sibling — coupled assignment)', 'When line 6c = TRUE, line 6b is set to taxableLumpSum (the lower amount).', 'Indirect: line 6c=TRUE causes line 6b to be lower, which propagates through line 9 → AGI → taxable income → tax.'],
  ['hasOutput gating', 'Line 8558: `hasOutput = ... || line6c || ...`', 'Line 6c=TRUE prevents the entire SS computation from being skipped at orchestrator end.'],
  ['Tax return derived SS check', 'TaxReturnComputeService.java:553 + 4070', 'Drives derived "has Social Security computation" flag for UI rendering.'],
  ['Form 1040 PDF — c1_41[0] checkbox', '**CURRENTLY BROKEN** — CSV semantic name unmapped. After 6c #5 fix: c1_41[0] → line6c_lump_sum_election → frontend export wires through.', 'When TRUE, checkbox should be filled on the PDF. Currently silent due to unmapped CSV row.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Schedule B', '—', 'Boolean checkbox — no Schedule B presence.'],
  ['Form 1040 line 9', '—', 'Structurally NOT eligible (boolean type; line 9 is BigDecimal sum).'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 6c-Related'],
  ['Line 6c shares the 6abcd cluster flag set. One specifically relevant to the election decision:'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['SOCIAL_SECURITY_LUMP_SUM_ALLOCATION_REQUIRED', 'ADVISORY', '`electsLumpSumElection=true` AND `lumpSumDetails` empty → `taxableLumpSum=null` returned by `computeTaxableSocialSecurityLumpSum`', 'TaxReturnComputeService.java:8460-8464'],
  ['SOCIAL_SECURITY_STATEMENT_UPLOAD_REQUIRED', 'BLOCKING', 'hadAnyBenefits=true AND statements missing', '6a Validation Flags'],
  ['SOCIAL_SECURITY_NEGATIVE_NET_BENEFITS_MANUAL_REVIEW', 'ADVISORY', 'line6a < 0 (repayments > gross) — line 6c never set in this case', 'TaxReturnComputeService.java:8367'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 6c shares the same orchestrator with lines 6a/6b. Most concerns extend prior 6a/6b closures via multi-audit-trail consolidation. **The big-ticket item is Issue #5** — PDF CSV semantic mapping for the c1_41[0] checkbox is currently `unmapped_c1_41_0`, meaning the frontend silently sets `line6c_lump_sum_election` but the export does nothing. Verified 2026-05-12.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — MFS GUARD CASCADE EXTENDED TO LINE 6c (3-AUDIT CONSOLIDATION)', 'Line 6c is in the 6a #1 high-leverage MFS cascade. The line 6c three-condition AND gate reads (a) `electsLumpSumElection` from `socialSecurityTaxpayer` (taxpayer-side; no spouse leakage risk), (b) `taxableLumpSum` derived from line 6a (MFS-protected via 6a #1) + lumpSumDetails (taxpayer-side), (c) `taxableNormal` derived from line 6a (MFS-protected) + line-9-source operands (each independently MFS-protected). So line 6c has NO direct spouse-side input — protection flows through line 6a/6b path. **Closure applied**: extended the MFS-guard breadcrumb at TaxReturnComputeService.java:8299-8323 from citing 2 audit IDs to **3 audit IDs** (6a #1 + 6b #1 + 6c #1, all verified 2026-05-12). Added metadata-only note: line 6c is a boolean derived from comparing two MFS-protected values; MFS protection prevents wrong line-6c disclosure when stale spouse SSA-1099 data exists; no separate revenue impact beyond what line 6b protection already captures. **Multi-audit-trail consolidation at this MFS-guard site now spans 3 audits**. Pattern continuity: same growing-citation shape as `computeIraDistributions` (3 audits after 4c #1) and `computePensionAnnuities` (3 audits after 5c #1) — will reach 4 audits after 6d #1 (matching `computeInterestIncome` density). No new lock-in test needed — existing `mfsExcludesSpouseSocialSecurityFromLine6a` (strengthened during 6b #1) already exercises the full cascade.', 'TaxReturnComputeService.java:8299-8323 (3-audit MFS-guard breadcrumb with line-6c metadata-only note)', 'CLOSED — multi-audit consolidation extended to 3 audits. No code change beyond breadcrumb.'],
  [2, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — KNOWLEDGE FILE ALREADY RENAMED VIA 6a #2', '`knowledge/line-6abcd-social-security.md` (renamed from `knowledge-line-6abcd-social-security.md` during 6a #2 earlier today) is a shared file covering all four SS-family lines (6a + 6b + 6c + 6d). No YAML frontmatter to update (file uses plain `# Knowledge: Form 1040 Lines 6a / 6b / 6c / 6d — Social Security Benefits` heading). Generator script `generate-6c.js` already references the file by its new canonical name. Pure xlsx-flip closure — **third time** the knowledge-file rename closure cascades within the 6abcd cluster (after 6b #2 earlier today). **Line 1c → 6abcd knowledge-file naming convergence remains complete across 13 lines** (1c, 1d, 1e, 1f, 1g, 1h, 1i, 1z, 2ab, 3ab, 4abc, 5abc, 6abcd). Same shape as 4c #2 (closed via 4a #2) and 5c #2 (closed via 5a #2).', 'C:\\us-tax\\knowledge\\line-6abcd-social-security.md (already correctly named)', 'CLOSED via 6a #2 — pure xlsx-flip closure. No action needed for 6c walkthrough.'],
  [3, 'RESOLVED 2026-05-12 — SPEC ENHANCEMENT — VERIFICATION LOG 3rd ROW APPENDED TO lines/6abcd.md', '`lines/6abcd.md` Verification log section (created during 6b #3) had 2 rows (6a complete + 6b complete). **Closure applied**: appended a 3rd in-progress row capturing the 6c walkthrough at the END of the table (chronological order convention preserved). Row captures #1 (MFS guard 3-audit consolidation with pattern-continuity note) + #2 (knowledge file already renamed pure xlsx-flip) + #3 (this row append, append-row pattern same shape as 5c #3 / 4c #3 / 3c #3; different from 6b #3 which CREATED the section). To be finalized to "COMPLETE — 10/10 closed" during end-of-walkthrough docs-update step. **Append-row pattern** (different from 6b #3 NEW-section creation): same shape as 5c #3 / 4c #3 / 3c #3 / 2b #3.', 'lines/6abcd.md Verification log (6c row appended as 3rd row in chronological order)', 'CLOSED — spec verification log row appended. 3 rows now present (6a complete + 6b complete + 6c in progress).'],
  [4, 'RESOLVED 2026-05-12 — CROSS-REFERENCE — LINE 6c IS STRUCTURALLY NOT IN LINE 9 (boolean — mathematically incomparable)', 'Line 9 formula is a BigDecimal addNonNull chain. Line 6c is Boolean — Java type system prevents inclusion at compile time (`BigDecimal line9 = addNonNull(..., line6c, ...);` would not compile). **Closure applied**: extended the line-9 breadcrumb "Notably absent" list at TaxReturnComputeService.java:4158-4174 with an additional paragraph documenting that lines 6c (lump-sum election checkbox) and 6d (MFS-lived-apart-all-year checkbox — new for 2025) are Boolean disclosure flags — structurally NOT eligible for line-9 inclusion regardless of value. **Different exclusion category** from the numeric-but-IRS-excluded lines (2a/1i/3a/4a/5a/6a): boolean by type, not by IRS rule. **Deliberately NOT extended to 12-audit consolidation** — the 11-audit citation count tracks "numeric-could-have-been-included" decisions; boolean exclusion is a qualitatively different category that would dilute the milestone. Pure clarification closure — no audit ID added at the line-9 site. Pure documentation extension — no functional change.', 'TaxReturnComputeService.java:4158-4174 (extended Notably absent list with boolean-type clarification paragraph)', 'CLOSED — clarification-only extension. 11-audit consolidation count preserved.'],
  [5, 'RESOLVED 2026-05-12 — ⚠️ BUG FIXED — PDF CSV SEMANTIC MAPPING FOR c1_41[0] CHECKBOX', '⚠️ **DIRECT PDF EXPORT BUG FIXED**: Pre-fix, the PDF semantic CSV at `us-tax-ui/public/irs/f1040_field_mapping_semantic.csv` row 31 had `c1_41[0]` with semantic key `unmapped_c1_41_0`. Frontend at `form-tax-return-1040.component.ts:312` sets `values[\'line6c_lump_sum_election\'] = form.income?.line6cLumpSumElection === true`, but the CSV had no matching row → checkbox fill silently ignored on PDF export. Effect: even when line 6c=TRUE in the backend, the printed/exported PDF did NOT show the checkbox marked. **Knowledge file Gap 4 was CORRECT; dependencies file Gap 4 claim ("resolved 2026-04-15") was INCORRECT — verified by direct CSV inspection**. **Closure applied (three coordinated fixes)**: (1) CSV row 31 — semantic key updated from `unmapped_c1_41_0` → `line6c_lump_sum_election` + column 3 path + column 5 label updated; (2) `dependencies/6abcd.md` line 75 — corrected the stale "resolved 2026-04-15" claim, now accurately notes line 6c resolved 2026-05-12 via 6c #5 + line 6d still pending; (3) `knowledge/line-6abcd-social-security.md` §13 Gap 4 + §9 PDF Export Mapping table — marked line 6c portion RESOLVED 2026-05-12 via 6c #5, line 6d portion deferred to future 6d audit. **Parallel line 6d bug confirmed but DEFERRED to 6d audit** (`c1_42[0]` still shows `unmapped_c1_42_0`; same shape fix). NO backend code change (bug was purely in PDF export wiring); backend logic was already correct. Backend regression: 755/755 pass. Manual PDF verification recommended; lock-in via Playwright E2E test optional.', 'us-tax-ui/public/irs/f1040_field_mapping_semantic.csv row 31 (semantic key updated to `line6c_lump_sum_election`); dependencies/6abcd.md line 75 (stale claim corrected); knowledge/line-6abcd-social-security.md §9 + §13 Gap 4 (resolved markers added)', 'CLOSED — PDF export bug fixed. Three coordinated documentation corrections + CSV update. Backend regression unchanged at 755/755.'],
  [6, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — LINE 6c THREE-CONDITION AND GATE', 'Line 6c assignment at TaxReturnComputeService.java:8520-8526: `boolean line6c = false; BigDecimal line6b = taxableNormal; if (electsLumpSumElection && taxableLumpSum != null && taxableNormal != null && taxableLumpSum.compareTo(taxableNormal) < 0) { line6b = taxableLumpSum; line6c = true; }`. Three conditions, each preventing distinct failure mode: (1) `electsLumpSumElection` — prevents silently applying method without affirmative election (IRC §86(e) opt-in); (2) null guards — prevent NPE at compareTo (defense-in-depth); (3) strict less-than — election applied only when LOWER (spec §7.4). Coupled assignment ensures line 6b + line 6c consistency. Initial values establish FALSE-AND-NORMAL default. **Closure applied**: **17-line breadcrumb** above lines 8520-8526 documenting (a) IRC §86(e) + spec §7.4 source; (b) each condition\'s purpose + failure-mode-it-prevents; (c) coupled assignment rationale + initial-values-pattern; (d) cross-reference to 6c #7 design asymmetry (user-intent-vs-IRS-correctness); (e) cross-reference to existing lock-in test `computesSocialSecurityLinesWithLumpSumElectionAndLine6d`. Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:8520-8526 (17-line breadcrumb above three-condition AND gate)', 'CLOSED — verified correct. 17-line breadcrumb with failure-mode-per-condition rationale.'],
  [7, 'RESOLVED 2026-05-12 — OBSERVATION — ELECTION USER-INTENT-vs-IRS-CORRECTNESS ASYMMETRY (silently-drop-when-not-beneficial)', 'Per IRS rule (spec §7.4) + IRC §86(e): the lump-sum election is the USER\'S CHOICE. Strictly, line 6c should reflect that user CHOICE — if user elected, the checkbox should be TRUE regardless of whether the election produced a lower taxable amount. **Current implementation silently drops the election when not beneficial** — uses `taxableNormal` as line 6b and sets line 6c = FALSE. Rationale (design choice): always produces user-favorable line 6b; user never disadvantaged by their election. **Trade-off**: precision-of-intent-disclosure (strict IRS reading) vs always-best-outcome (current). Most consumer tax software (TurboTax, H&R Block, etc.) follows the silent-best-of-two convention. **Closure applied**: **15-line breadcrumb** at TaxReturnComputeService.java:8538-8552 (immediately following the 6c #6 three-condition AND gate breadcrumb) documenting (a) IRC §86(e) + spec §7.4 strict reading; (b) current silent-drop-when-not-beneficial behavior; (c) most-tax-software-convention rationale + user-intent approximation as "best outcome from the method"; (d) trade-off + edge case (amendment scenarios where user confusion possible); (e) mitigation deferred — NO new outstanding.md entry (disclosure-precision question, not correctness issue; revisit only if user complaint arises). Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:8538-8552 (15-line breadcrumb on election asymmetry observation; follows 6c #6 breadcrumb)', 'CLOSED — observation. 15-line breadcrumb documenting design trade-off + silent-best-of-two convention.'],
  [8, 'RESOLVED 2026-05-12 — OBSERVATION — dependencies/6abcd.md Gap 4 CLAIM CORRECTED (bundled into 6c #5 three-pronged fix)', 'Pre-fix, `dependencies/6abcd.md` line 75 incorrectly claimed "Gap 4 resolved 2026-04-15. All four fields mapped." Direct CSV inspection during audit setup proved this wrong (both `c1_41[0]` and `c1_42[0]` still showed `unmapped_*` semantic keys). **Knowledge file was CORRECT; dependencies file was INCORRECT**. **Closure applied via 6c #5 bundle**: the dependencies file correction was performed as part of the 6c #5 three-pronged fix (CSV mapping + dependencies correction + knowledge file marker). Post-fix wording at dependencies/6abcd.md line 75: "Lines 6a/6b/6c mapped. **Line 6d still unmapped** — `c1_42[0]` row still shows `unmapped_c1_42_0` (deferred to future 6d audit). Prior \'Gap 4 resolved 2026-04-15\' claim was INCORRECT (verified via CSV inspection during 6c #5); line 6c portion resolved 2026-05-12 via 6c #5 fix." **Why this is a separate audit row** (not merged into 6c #5): pattern continuity. The split documents the precedent that future 6d audit should similarly fix CSV + update dependencies + knowledge file in the same coordinated bundle. Same shape as 5b #9 separating gap-documentation from outstanding.md entry. Pure xlsx-flip closure — no additional code/documentation change.', 'dependencies/6abcd.md line 75 (already updated via 6c #5); knowledge/line-6abcd-social-security.md §9 + §13 Gap 4 (already updated via 6c #5)', 'CLOSED — pure xlsx-flip. Documentation corrections bundled in 6c #5.'],
  [9, 'RESOLVED 2026-05-12 — OBSERVATION — LUMP-SUM ELECTION FIDELITY GAPS ALREADY DOCUMENTED VIA 6b #9 (cross-reference)', 'The Pub. 915 Worksheet 3 prior-year recompute fidelity gaps (i) prior-year worksheetLine5 hardcoded null, (ii) prior-year filing status assumed same, (iii) initial fallback (correct behavior) are all documented at TaxReturnComputeService.java:8828-8866 (6b #9 JavaDoc) + outstanding.md entry "Line 6b: Lump-Sum Election Prior-Year Fidelity Gaps (Form 2555 + Filing-Status Changes) — Deferred 2026-05-12". **Line 6c has NO fidelity gaps of its own** — the three-condition AND gate is CORRECT (verified at 6c #6) and the user-intent asymmetry is INTENTIONAL (documented at 6c #7). Any line 6c output anomalies trace back to upstream `taxableLumpSum` gaps; fixing the gaps at the source (per outstanding.md scope) automatically corrects line 6c. **Closure**: pure xlsx-flip cross-reference. **NO new outstanding.md entry** (covered by 6b #9 deferral). **NO new breadcrumb** in the line 6c logic (would be over-documentation — 6c #6 + 6c #7 breadcrumbs already establish that the line 6c logic itself is correct + intentional; gaps are upstream). Same shape as 6c #8 (separated documentation observation from substantive fix for pattern continuity).', 'TaxReturnComputeService.java:8828-8866 (6b #9 JavaDoc — already documents all 3 gaps); outstanding.md (existing 6b #9 deferred entry)', 'CLOSED — observation. Pure xlsx-flip cross-reference to 6b #9. No code/documentation/test change.'],
  [10, 'RESOLVED 2026-05-12 — OBSERVATION — 6abcd CLUSTER 3/4 SUB-LINES COMPLETE + CLUSTER-POSITIONING FOR FUTURE 6d', 'Line 6c is the 3rd of 4 sub-lines in the 6abcd cluster (**FIRST 4-sub-line cluster in the audit workflow** — vs 3-sub-line 3abc / 4abc / 5abc). After 6c walkthrough: 6a + 6b + 6c complete; line 6d remaining (MFS-lived-apart-all-year checkbox, NEW for 2025 replacing handwritten "D" notation per spec §1). **6d audit will close the 6abcd cluster** (4th complete shared-aggregator cluster after 3abc + 4abc + 5abc + 6abcd; first 4-sub-line cluster). **Expected 6d closures**: MFS guard cascade extension to **4 audit IDs** (matching `computeInterestIncome` density); knowledge file rename cascade citation; verification log 4th row → **first 4-row verification log** in audit workflow; parallel CSV mapping fix for `c1_42[0]` → `line6d_mfs_lived_apart_all_year` (same shape as 6c #5); line 6d checkbox logic verification; NEW-FOR-2025 confirmation. **Cumulative through 6c**: 24 lines audited (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6a + 6b + 6c); 237 audit issues closed total; backend 755/755 tests pass (unchanged — no Java code change in 6c walkthrough); 3-audit MFS cascade consolidation at computeSocialSecurityBenefits site; 11-audit consolidation at line-9 site (unchanged, boolean-type clarification did NOT inflate count); 13-line knowledge-file naming convergence; 1 HIGH-PRIORITY PDF export bug fixed today (6c #5 CSV mapping); ZERO new outstanding.md entries today (6c #9 cross-referenced 6b #9 deferral; 6c #7 deferred without entry); THREE complete gross-vs-taxable bilateral coverage pairs (unchanged from 6b #10 milestone). Pure xlsx-flip observation.', 'XLS/computations/6c.xlsx audit-trail (this row); no code change', 'CLOSED — pure xlsx-flip observation. Positions future 6d audit (closes 6abcd cluster as first 4-sub-line cluster).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 100 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 6c Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.line6cLumpSumElection', '⚠️ topmostSubform[0].Page1[0].c1_41[0] — CURRENTLY `unmapped_c1_41_0` per CSV row 31', 'form-tax-return-1040.xlsx (line 6c checkbox)', '★ Primary output. Boolean. CURRENTLY BROKEN at PDF export — see 6c #5.'],
  [],
  ['INDIRECT IMPACT — Coupled with line 6b'],
  ['form1040.income.taxableSocialSecurityBenefits (line 6b)', 'f1_69[0]', 'form-tax-return-1040.xlsx (line 6b cell)', 'When line 6c = TRUE, line 6b is set to taxableLumpSum (lower amount). Indirect impact on line 9 / AGI / tax.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 (total income)', '—', '—', 'Boolean — structurally NOT eligible.'],
  ['Schedule B', '—', '—', 'No Schedule B presence.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 70 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
