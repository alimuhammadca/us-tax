// ============================================================================
//  Generates: C:\us-tax\XLS\computations\6a.xlsx
//
//  Source-of-truth references:
//    - lines/6abcd.md §4 (line 6a computation) — NOTE: 4 sub-lines (6a/6b/6c/6d) not 3
//    - dependencies/6abcd.md
//    - knowledge/line-6abcd-social-security.md (renamed 2026-05-12 via 6a #2 — was knowledge-line-6abcd-social-security.md)
//    - TaxReturnComputeService.computeSocialSecurityBenefits() lines ~8249-8470 (orchestrator)
//    - TaxReturnComputeService.computeSocialSecurityForPerson() lines ~8473-8500 (per-person aggregator)
//    - PDF semantic CSV row 82 (f1_68[0] line6a_social_security_benefits)
//    - IRS 2025 Form 1040 line 6a instructions
//    - IRS Pub. 915 (Social Security and Equivalent Railroad Retirement Benefits)
//    - IRC §86 (taxation of Social Security benefits)
//
//  Tax year: 2025
//
//  Critical findings flagged for this audit:
//   1. **MFS GUARD MISSING** at `computeSocialSecurityBenefits` (line 8249) — defensive gap
//      where spouse Social Security benefits could leak into MFS returns. Same shape as 4a #1
//      and 5a #1. Fix extends single-guard MFS cascade from 10 orchestrators to **11**:
//      (1c-1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities +
//      **computeSocialSecurityBenefits**).
//
//   2. Line 6a/6b mirrors the 4a/4b + 5a/5b gross-vs-taxable pattern, but with two important
//      differences:
//      • Line 6a is NET BENEFITS (box 5 is already net of repayments per IRS SSA-1099
//        definition), not gross-before-deductions. "Gross" terminology vs lines 4a/5a is
//        about disclosure-vs-taxable, not about gross-before-deductions.
//      • Line 6a has NO blank-when-fully-taxable rule (unlike lines 4a/5a) — always reports
//        the full benefits amount. IRS uses line 6a as informational disclosure regardless.
//
//   3. Cluster has FOUR sub-lines (6a/6b/6c/6d) not 3:
//      • 6a — net benefits (this audit)
//      • 6b — taxable amount (future)
//      • 6c — lump-sum election checkbox (future)
//      • 6d — MFS lived-apart-all-year checkbox (future — NEW vs 4abc/5abc clusters)
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '6a.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 6a — SOCIAL SECURITY BENEFITS (NET BENEFITS)'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 6a'],
  ['Concept', 'NET Social Security benefits for the return (taxpayer + spouse aggregated). Per IRS 2025 Form 1040 line 6a instructions + IRS Pub. 915: line 6a is the **total NET benefits** from box 5 of all SSA-1099 forms PLUS the SSEB (Social Security Equivalent Benefit) portion of tier 1 RRB-1099 box 5. **"NET" not "gross"** — box 5 already reflects the statement\'s net-benefit computation (net of repayments). UNLIKE LINES 4a/5a, line 6a does NOT have a blank-when-fully-taxable rule — always reports the full benefits amount regardless of taxability (per IRS).'],
  ['Core invariant', 'Line 6a is the disclosure-side of the 6a/6b pair (gross-vs-taxable pattern). Line 6a = sum of SSA-1099 box 5 + RRB-1099 SSEB portion, minus SSI if present per Pub. 915. **NOT in line 9** (only line 6b enters line 9 per IRC §86). Line 6a ≥ Line 6b.'],
  ['Per-Person Formula', 'grossBenefits = Σ SSA-1099 box 5 + Σ RRB-1099 SSEB portion (NOT full RRB box 5 — only the tier 1 SSEB equivalent)\nif hasSupplementalSecurityIncome: grossBenefits = subtractNonNegative(grossBenefits, supplementalSecurityIncomeAmount)\nperson.grossBenefits = roundMoney(grossBenefits)'],
  ['Per-Return Formula', 'line6a = roundMoney(addNonNull(taxpayer.grossBenefits, spouse.grossBenefits))\n\n**No blank-when-fully-taxable rule** — line 6a is reported regardless of line 6b value. Per IRS line 6a instructions: "Even if none of the benefits are taxable, still report the box-5 total on line 6a and enter 0 on line 6b."'],
  ['Filed', 'Form 1040 line 6a. PDF field: topmostSubform[0].Page1[0].f1_68[0] (semantic: line6a_social_security_benefits). Sibling line 6b at f1_69[0]. Line 6c at c1_41[0] (lump-sum election). Line 6d at c1_42[0] (MFS lived-apart-all-year).'],
  ['Backend method', 'TaxReturnComputeService.computeSocialSecurityBenefits() lines ~8249-8470 (orchestrator).\nTaxReturnComputeService.computeSocialSecurityForPerson() lines ~8473-8500 (per-person aggregator).\n**⚠️ MISSING MFS GUARD**: orchestrator does NOT receive `isMfsReturn` parameter (Code Validation #1).'],
  ['Output', 'form1040.income.socialSecurityBenefits (BigDecimal; null when no SS activity; non-null when SSA-1099 / RRB-1099 entries exist). Unlike lines 4a/5a, line 6a does NOT get blanked when fully-taxable. Rendered on Form 1040 line 6a.'],
  ['IRS source', 'IRS 2025 Form 1040 instructions for line 6a; IRS Pub. 915 (Social Security and Equivalent Railroad Retirement Benefits); IRC §86 (taxation of Social Security benefits)'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Validate Social Security statement gating', 'validateSocialSecurityStatementGating at line 8282 — emits blocking flag SOCIAL_SECURITY_STATEMENT_UPLOAD_REQUIRED if hadSocialSecurityBenefits=true but no SSA-1099/RRB-1099 uploaded.'],
  [2, 'Per-person: filter SSA-1099 entries by recipient SSN', 'belongsToPersonSsa1099 helper at line 8483. **⚠️ MFS guard missing** — spouse-attributed SSA-1099 entries would leak on MFS without the cascade.'],
  [3, 'Per-person: accumulate SSA-1099 box 5 (net benefits)', '`grossBenefits = addNonNull(grossBenefits, parseAmount(entry.get("netBenefitsAmount")))` at line 8486. Box 5 = net benefits (already net of any repayments per SSA-1099 form structure).'],
  [4, 'Per-person: filter RRB-1099 entries by recipient SSN', 'belongsToPersonRrb1099 helper at line 8489.'],
  [5, 'Per-person: accumulate RRB-1099 SSEB portion ONLY', '`grossBenefits = addNonNull(grossBenefits, parseAmount(entry.get("netSSEBAmount")))` at line 8492. **CRITICAL**: ONLY the Social Security Equivalent Benefit (SSEB) portion of tier 1 RRB. NSSEB (non-SSEB tier 1) + tier 2 RRB belong to lines 5a/5b/5c per spec §2.2 (pension routing, not Social Security).'],
  [6, 'Per-person: exclude SSI (Supplemental Security Income)', 'If `hasSupplementalSecurityIncome=true`: `grossBenefits = subtractNonNegative(grossBenefits, supplementalSecurityIncomeAmount)` at line 8497. Per IRS Pub. 915: SSI is NEVER taxable and must NOT be on line 6a/6b.'],
  [7, 'Per-person: return SocialSecurityPersonTotals(roundMoney(grossBenefits))', 'Simpler than pension/IRA per-person records (no exception flags or write-in text — line 6a has no exceptions concept). Just one BigDecimal field.'],
  [8, 'Return-level: aggregate grossBenefits across spouses', '`grossBenefits = addNonNull(taxpayer.grossBenefits(), spouse.grossBenefits())` at line ~8310. **⚠️ NO MFS guard**: spouse contributions aggregated even on MFS.'],
  [9, 'Return-level: line 6a = roundMoney(grossBenefits)', '**No blank-when-fully-taxable rule**. Line 6a is reported even when line 6b = 0. Per IRS line 6a instructions §4.2: "Even if none of the benefits are taxable, still report the box-5 total on line 6a."'],
  [10, 'Persist on form1040.income; line 6a does NOT enter line 9', '`income.setSocialSecurityBenefits(line6a)`. Line 6a is the GROSS-side disclosure (NOT in line 9 — same gross-vs-taxable pattern as 4a/5a). Line 6b carries the taxable portion → enters line 9 per IRC §86.'],
  [],
  ['MUTUAL EXCLUSION RULES (enforced by code or spec)'],
  ['Rule', 'Implementation', 'Why'],
  ['Line 6a is NET BENEFITS (box 5 already net of repayments)', 'Lines 8486 + 8492 read `netBenefitsAmount` (SSA-1099 box 5) and `netSSEBAmount` (RRB-1099 box 5 SSEB portion).', 'Per IRS SSA-1099 instructions: box 5 = box 3 - box 4 (net after repayments). Code reads box 5 directly — already net.'],
  ['Line 6a does NOT have blank-when-fully-taxable rule (UNLIKE 4a/5a)', 'No `fullyTaxableOverall ? null : ...` test in computeSocialSecurityBenefits. Line 6a always returns roundMoney(grossBenefits).', 'IRS rule difference: 4a/5a use blank-when-fully-taxable as a simplification; line 6a always shows the full benefits for disclosure. Per spec §4.2: "Even if none of the benefits are taxable, still report the box-5 total on line 6a."'],
  ['RRB scope limit: SSEB portion ONLY (NOT NSSEB or tier 2)', 'Line 8492 reads `netSSEBAmount` (the SSEB-only field), NOT the full RRB-1099 box 5.', 'Per spec §2.2 + IRS Pub. 915: NSSEB and tier 2 RRB → pension lines 5a/5b/5c (handled by 5abc cluster). SSEB only → Social Security lines 6a/6b.'],
  ['SSI (Supplemental Security Income) EXCLUDED', 'Lines 8496-8498: subtract `supplementalSecurityIncomeAmount` when `hasSupplementalSecurityIncome=true`.', 'Per spec §2.3 + IRS Pub. 915: SSI is need-based and NEVER taxable — must NOT appear on line 6a or 6b.'],
  ['Disability benefits INCLUDED in line 6a', 'No special filtering — disability SSA benefits are processed identically to retirement benefits per spec §2.4.', 'Per IRS rule: Social Security disability benefits are still Social Security benefits for line 6 purposes. Not rerouted out.'],
  ['Lump-sum back payments INCLUDED in line 6a', 'No special filtering for lump-sum payments. Full box 5 amount goes to line 6a per spec §4.3.', 'Per IRS rule: lump-sum/retroactive payments for prior years still go on line 6a. The lump-sum election (line 6c) affects line 6b taxability, not line 6a inclusion.'],
  ['Line 6a is NOT in line 9 (only line 6b is)', 'Line 9 formula at lines 4163-4166 uses line 6b, not line 6a.', 'Same gross-vs-taxable pattern as 4a/5a. IRC §86: only taxable portion of SS benefits enters gross income.'],
  [],
  ['DECISION TREE — when does line 6a have a value?'],
  ['Scenario', 'Line 6a result', 'Line 6b result'],
  ['No SSA-1099 / RRB-1099 entries; hadSocialSecurityBenefits=false', 'null', 'null'],
  ['SSA-1099 box 5 = $30,000, low income (none taxable)', '$30,000', '$0 (per IRS: still report 6a; 0 on 6b)'],
  ['SSA-1099 box 5 = $30,000, mid income (50% taxable)', '$30,000', '$15,000'],
  ['SSA-1099 box 5 = $30,000, high income (85% max taxable)', '$30,000', '$25,500'],
  ['SSA-1099 box 5 = $30,000 with $5,000 SSI', '$25,000 ($30k − $5k SSI)', '(per IRC §86 worksheet)'],
  ['RRB-1099 SSEB = $20,000 only (no SSA-1099)', '$20,000', '(per IRC §86 worksheet)'],
  ['RRB-1099 with NSSEB + tier 2 (routed to 5abc, NOT 6abcd)', 'Only SSEB portion to 6a', '(per IRC §86 — SSEB only)'],
  ['Lump-sum back payment of $10,000 in 2025 box 5', 'Full box 5 (incl. lump sum)', '(per IRC §86 + lump-sum election)'],
  ['MFS; spouse has SSA-1099 only', '**⚠️ Currently leaks** (see Code Validation #1)', '**⚠️ Same leak**'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 6a Flows'],
  ['Consumer', 'How', 'Notes'],
  ['(NOT line 9 directly)', 'Line 9 uses line 6b (taxable), NOT line 6a (gross/net-benefits).', 'Same gross-vs-taxable pattern as 4a/4b + 5a/5b.'],
  ['Form 1040 line 6a (the cell itself)', 'TaxReturnComputeService.buildIncome() — income.setSocialSecurityBenefits(line6a)', 'Stored when non-null. Whole-dollar HALF_UP rounding. PDF field f1_68[0]. **NOT blanked** when fully-taxable simple case (different from 4a/5a).'],
  ['IRC §86 Social Security Benefits Worksheet (line 6b computation)', 'Line 6a value (sum of SSA-1099 + RRB-1099 SSEB) is the starting point for the Pub. 915 worksheet.', 'Future 6b audit will document the full worksheet.'],
  ['NOT in Schedule B / Schedule 1 / Schedule 2', '—', 'SS benefits don\'t flow to other schedules.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 28 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 6a'],
  ['Line 6a inputs come from SSA-1099 + RRB-1099 (SSEB portion only) + the social-security personal form (for SSI exclusion).'],
  [],
  ['#', 'Source xlsx', 'Field path / model key', 'Label / box', 'Required?', 'Role in line 6a compute', 'Cross-reference'],
  [],
  ['STATEMENT INPUTS — SSA-1099'],
  [1, 'form-ssa-1099.xlsx', 'netBenefitsAmount (box 5)', 'SSA-1099 box 5 "Net benefits for 2025"', 'YES — primary line 6a feed', 'Step 3: `grossBenefits += entry.box5`. Already net of repayments (box 3 − box 4).', 'IRS SSA-1099 instructions box 5'],
  [2, 'form-ssa-1099.xlsx', 'recipientTIN', 'SSA-1099 recipient TIN', 'YES — for SSN attribution', 'belongsToPersonSsa1099. **⚠️ MFS guard missing**.', 'Code Validation #1'],
  [3, 'form-ssa-1099.xlsx', 'box3GrossBenefits / box4Repayments', 'SSA-1099 box 3 / box 4', 'NO — informational', 'box 5 = box 3 − box 4 per IRS. Code uses box 5 directly; box 3/4 not separately read.', 'IRS SSA-1099 instructions'],
  [],
  ['STATEMENT INPUTS — RRB-1099 (SSEB portion only)'],
  [4, 'form-rrb-1099.xlsx', 'netSSEBAmount (box 5 SSEB portion)', 'RRB-1099 box 5 SSEB only', 'YES — RRB feed (SSEB only)', 'Step 5: `grossBenefits += entry.netSSEBAmount`. **CRITICAL**: ONLY the Social Security Equivalent Benefit portion of tier 1, NOT NSSEB or tier 2. NSSEB + tier 2 → pension lines 5a/5b/5c (handled by 5abc cluster).', 'spec §2.2; IRS Pub. 915'],
  [5, 'form-rrb-1099.xlsx', 'recipientIdNumber', 'RRB-1099 recipient ID', 'YES — for SSN attribution', 'belongsToPersonRrb1099 helper. **⚠️ MFS guard missing**.', 'Code Validation #1'],
  [6, 'form-rrb-1099.xlsx', '(other RRB boxes — NSSEB, tier 2, etc.)', 'RRB-1099 boxes 4/6/7', 'NO for line 6a (routes to 5abc)', 'NSSEB + tier 2 RRB amounts flow to lines 5a/5b/5c (pension family). NOT a line 6a input. See spec §2.2.', 'spec §2.2; 5a #7'],
  [],
  ['PERSONAL FORM INPUTS — social-security-taxpayer / -spouse'],
  [7, 'form-social-security-taxpayer.xlsx', 'screening.hadSocialSecurityBenefits', 'Did you receive SS benefits?', 'YES (boolean gate)', 'Drives validateSocialSecurityStatementGating + person\'s contribution to hadAnyBenefits.', 'YAML: 6abcd-social-security-taxpayer.yaml'],
  [8, 'form-social-security-taxpayer.xlsx', 'ssi.hasSupplementalSecurityIncome', 'Have SSI included in box 5?', 'NO — SSI exclusion gate', 'When true, triggers subtraction of supplementalSecurityIncomeAmount at line 8497. Per IRS Pub. 915: SSI never taxable.', 'spec §2.3'],
  [9, 'form-social-security-taxpayer.xlsx', 'ssi.supplementalSecurityIncomeAmount', 'SSI amount to exclude', 'NO', 'Subtracted from grossBenefits at line 8497.', 'spec §2.3'],
  [10, 'form-social-security-taxpayer.xlsx', 'gating.hasUploadedAtLeastOneSsaOrRrbStatement / confirmAllReceivedSsaRrbStatementsUploaded', 'Statement upload gating flags', 'YES (when hadBenefits=true)', 'Drives validateSocialSecurityStatementGating blocking flag.', 'Statement gating'],
  [],
  ['IDENTITY INPUTS'],
  [11, 'form-identification-taxpayer.xlsx', 'taxpayerIdentity.ssn', 'Taxpayer SSN', 'YES — drives statement attribution', 'belongsToPersonSsa1099 / belongsToPersonRrb1099.', 'Standard SSN attribution'],
  [12, 'form-identification-spouse.xlsx', 'spouseIdentity.spouseSsn', 'Spouse SSN', 'YES on MFJ', '**⚠️ Should be nulled on MFS via MFS guard — currently leaks. See Code Validation #1.**', 'Code Validation #1'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 42 }, { wch: 65 }, { wch: 55 }, { wch: 30 }, { wch: 80 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 6a'],
  ['Line 6a itself has NO 2025-indexed thresholds. The Pub. 915 worksheet thresholds for line 6b ($25k/$32k/$34k/$44k bases) apply to line 6b computation, not line 6a.'],
  [],
  ['Constant', 'Value', 'Source', 'Used by line 6a?', 'Notes'],
  [],
  ['Indirect — Pub. 915 worksheet thresholds (apply to line 6b, NOT line 6a)'],
  ['SS_BASE_AMOUNT_SINGLE_HOH_QSS_MFS_APART', '$25,000', 'IRS 2025 Pub. 915 + IRC §86', 'NO (line 6b)', 'Per spec §6.3 + CLAUDE.md key constants. First-tier threshold for single/HOH/QSS/MFS-lived-apart.'],
  ['SS_BASE_AMOUNT_MFJ', '$32,000', 'IRS 2025 Pub. 915 + IRC §86', 'NO (line 6b)', 'First-tier threshold for MFJ.'],
  ['SS_SECOND_TIER_SINGLE_HOH_QSS_MFS_APART', '$34,000', 'IRS 2025 Pub. 915 + IRC §86', 'NO (line 6b)', 'Second-tier threshold (85% max taxable above this) for single/HOH/QSS/MFS-lived-apart.'],
  ['SS_SECOND_TIER_MFJ', '$44,000', 'IRS 2025 Pub. 915 + IRC §86', 'NO (line 6b)', 'Second-tier threshold for MFJ.'],
  ['SS_MAX_TAXABLE_PERCENTAGE', '85%', 'IRC §86(d)(1)', 'NO (line 6b)', 'Maximum percentage of benefits that can be taxable.'],
  ['SS_MFS_LIVED_WITH_SPOUSE_BASE', '$0', 'IRS Pub. 915 + IRC §86(c)(1)(C)', 'NO (line 6b)', 'When MFS and lived with spouse at any time during the year, base amount drops to $0 → 85% potentially taxable.'],
  [],
  ['Statutory references'],
  ['Social Security taxation', 'IRC §86; IRS Pub. 915', 'Up to 85% of benefits taxable depending on provisional income.'],
  ['SSI exclusion', 'IRC §86(d)(1)(D); IRS Pub. 915', 'SSI never taxable; excluded from line 6a/6b.'],
  ['RRB-1099 routing', 'IRS Pub. 915 + RRB-1099 instructions', 'SSEB → line 6a; NSSEB + tier 2 → lines 5a/5b/5c.'],
  ['Lump-sum election (line 6c)', 'IRC §86(e); IRS Pub. 915', 'Allows allocation of retroactive SS to prior years — affects line 6b, not line 6a.'],
  ['Disability benefits as SS', 'IRC §86(d); IRS Pub. 915', 'SS disability benefits treated as SS benefits for line 6.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 22 }, { wch: 55 }, { wch: 22 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 6a Is Pure Disclosure (Not in Line 9)'],
  ['Line 6a is the gross-side disclosure of Social Security benefits. Line 6b carries the taxable portion → enters line 9 per IRC §86.'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['Form 1040 line 6a (the cell itself)', 'TaxReturnComputeService.buildIncome() — income.setSocialSecurityBenefits(line6a)', '★ Primary output. Stored when non-null. **NOT blanked** when fully-taxable simple case (different from 4a/5a).'],
  ['Form 1040 line 6b (taxable SS amount)', 'income.setTaxableSocialSecurityBenefits(line6b) [future 6b audit]', '★ Sibling. Carries taxable portion (per IRC §86 worksheet) → enters line 9.'],
  ['SOCIAL_SECURITY_STATEMENT_UPLOAD_REQUIRED flag', 'Lines 8514-8519 — BLOCKING', 'Fires when hadSocialSecurityBenefits=true but no SSA-1099/RRB uploaded (or upload-confirmation not set).'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 (total income)', 'Line 9 uses line 6b, NOT line 6a', '★ Critical: line 6a is net-benefits disclosure; line 6b carries taxable portion per IRC §86.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 80 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 6a Emits 1 BLOCKING Flag'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['SOCIAL_SECURITY_STATEMENT_UPLOAD_REQUIRED', 'BLOCKING', 'hadSocialSecurityBenefits=true but no SSA-1099/RRB uploaded (or upload-confirmation not set)', 'validateSocialSecurityStatementGating lines 8514-8519'],
  ['(no other line-6a-specific flags)', '—', '—', '—'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 70 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 6a is the gross-side Social Security benefits line — the FIRST audit of the 6abcd cluster (mirrors 4abc IRA + 5abc pension cluster pattern, but with 4 sub-lines instead of 3). Like 4a #1 and 5a #1, the initial scan revealed a **HIGH-PRIORITY DEFENSIVE GAP** at `computeSocialSecurityBenefits` (no MFS guard). Verified 2026-05-12.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-12 — HIGH-PRIORITY DEFENSIVE GAP — MFS GUARD ADDED AT computeSocialSecurityBenefits', 'Three-step fix applied: (a) added `boolean isMfsReturn` parameter to `computeSocialSecurityBenefits` signature; (b) at the top of the method body, nulled spouse-side reads on MFS — `socialSecuritySpouse = isMfsReturn ? null : socialSecuritySpouseRaw` and `spouseSsn = isMfsReturn ? null : normalizeSsn(getString(spouse, "ssn"))`; (c) updated call site at line 473 to pass `isMfsReturn`. Added 15-line MFS-guard breadcrumb documenting the cascade path + extension to 11 orchestrators + Pub. 915 worksheet implications. Lock-in test `mfsExcludesSpouseSocialSecurityFromLine6a` added: MFS return with taxpayer $20k SSA-1099 + STALE spouse $15k SSA-1099 → asserts line 6a = $20,000 (taxpayer-only), NOT $35,000 (aggregated). **HIGH-LEVERAGE FIX**: one guard protects 3+ outputs (line 6a, 6b via Pub. 915 worksheet, 6d MFS-lived-apart checkbox). **Single-guard MFS cascade now applied to 11 orchestrators** (1c-1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities + **computeSocialSecurityBenefits**). Backend regression: 753 → 754 (net +1 from lock-in test).', 'TaxReturnComputeService.java:8249-8302 (signature + 15-line breadcrumb + MFS suppression); line 473 (call site); test mfsExcludesSpouseSocialSecurityFromLine6a', 'CLOSED — defensive gap fixed. Single-guard MFS cascade extended to 11 orchestrators.'],
  [2, 'RESOLVED 2026-05-12 — KNOWLEDGE FILE NAMING DEVIATION', '`knowledge/knowledge-line-6abcd-social-security.md` used the legacy `knowledge-line-` hyphen-prefix form. Renamed to `knowledge/line-6abcd-social-security.md` via plain `mv`. No YAML frontmatter to update (file uses plain `# Knowledge: ...` heading — same as 5a #2). Updated the header-comment reference in `generate-6a.js`. Only one active inbound reference (the generator); grep confirmed no other code references. **Line 1c → 6abcd knowledge-file naming convergence now complete across 13 lines** (1c, 1d, 1e, 1f, 1g, 1h, 1i, 1z, 2ab, 3ab, 4abc, 5abc, 6abcd).', 'C:\\us-tax\\knowledge\\line-6abcd-social-security.md (renamed); C:\\us-tax\\XLS\\_tools\\generate-6a.js (header comment)', 'CLOSED — pure documentation hygiene. Same fix shape as 5a #2.'],
  [3, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — LINE 6a = SSA-1099 box 5 + RRB-1099 SSEB portion', 'Per IRS Pub. 915 + spec §4.1: `line6a = sum(SSA1099.box5) + sum(RRB1099.box5_sseb)`. Implementation correctly reads `netBenefitsAmount` (SSA-1099 box 5) and `netSSEBAmount` (RRB-1099 SSEB portion). Three protections documented: (1) box 5 already net-of-repayments per IRS SSA-1099 design (box 5 = box 3 − box 4) → code reads directly without re-deriving (prevents double-subtraction); (2) RRB SSEB-only scope (NSSEB + tier 2 → 5abc cluster per 5a #7); (3) lump-sum back payments + disability benefits included (no special filtering). Closure: **15-line breadcrumb** at TaxReturnComputeService.java:8500-8514 above the dual-loop documenting the 3 points + Pub. 915 source + spec §4.1/§4.3/§2.4 citations + cross-reference to 5a #7 RRB component split.', 'TaxReturnComputeService.java:8500-8514 (15-line breadcrumb above SSA-1099 + RRB-1099 accumulation loops)', 'CLOSED — verified correct. Breadcrumb-only closure.'],
  [4, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — LINE 6a IS NOT IN LINE 9 (10-AUDIT CONSOLIDATION)', 'Line 9 formula at TaxReturnComputeService.java:4137-4167 = line 1z + 2b + 3b + 4b + 5b + 6b + 7a + 8 — line 6b is the 6th operand (taxable); line 6a is absent (gross/net-benefits disclosure). Same gross-vs-taxable pattern as line 4a (4a #4) + line 5a (5a #4). **Closure applied**: extended the line-9 breadcrumb citation list from **9 audit IDs to 10 audit IDs** (added "+ 6a.xlsx Code Validation #4" to the 2026-05-12 verification block); updated the gross-vs-taxable pattern progress note: "4a/4b complete bilateral, 5a/5b complete bilateral, 6a verified today (6a #4) — gross side EXCLUDED as disclosure-only, taxable side INCLUDED per IRC §61 / §86" — 6b inverse pending; expanded the "Notably absent" list to include line 6a (gross Social Security net benefits — only the taxable portion via line 6b enters income; per Pub. 915 + IRC §86 provisional-income tiers). Pure documentation extension — no formula change. The existing lock-in test `line9EqualsLine1zPlusOtherIncomeLines` already protects the formula. **Multi-audit-trail consolidation pattern at the line-9 site now spans 10 audits** (1z #7 + 2a #7 + 2b #5 + 3a #5 + 3b #5 + 4a #4 + 4b #5 + 5a #4 + 5b #5 + 6a #4).', 'TaxReturnComputeService.java:4137-4167 (extended 10-audit breadcrumb); test line9EqualsLine1zPlusOtherIncomeLines', 'CLOSED — verified-correct cross-reference. 10-audit consolidation extended.'],
  [5, 'RESOLVED 2026-05-12 — 0-VS-NULL COMPLIANCE for computeSocialSecurityForPerson — VERIFIED CORRECT', 'Canonical 0-vs-null contract verified at `computeSocialSecurityForPerson` return site (TaxReturnComputeService.java:8537). All six points pass: (1) `grossBenefits = null` init at line 8519 (not BigDecimal.ZERO); (2) SSA-1099 accumulation loop uses `addNonNull` — preserves null through empty iteration; (3) RRB-1099 accumulation loop same shape; (4) SSI gate at lines 8534-8536: when !hasSupplementalSecurityIncome, no subtraction (null pass-through); when hasSupplementalSecurityIncome=TRUE AND grossBenefits=null, `subtractNonNegative(null, x)` returns null per its `if (left == null) return null` guard at line 18009-18011 (SSI-only person with zero SS benefits → null, canonical); (5) `roundMoney(null) → null` at constructor call; (6) `SocialSecurityPersonTotals` record at line 19418 accepts nullable BigDecimal. Downstream: orchestrator aggregates taxpayer + spouse via `addNonNull` — both-null → null → orchestrator `hasOutput` test at lines 8466-8473 returns `null` SocialSecurityComputation, preventing phantom "$0 line 6a" output. **Closure applied**: 20-line breadcrumb above the SocialSecurityPersonTotals return site mirroring the canonical shape established at 2a #5 (InterestPersonTotals) / 4a #5 (IraPersonComputation) / 5a #5 (PensionPersonComputation). Pure documentation closure — no code change.', 'TaxReturnComputeService.java:8537 (20-line breadcrumb above SocialSecurityPersonTotals return); subtractNonNegative null-preserve at 18009-18011; record at 19418', 'CLOSED — verified correct. Add 20-line breadcrumb (canonical 0-vs-null pattern).'],
  [6, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — SSI EXCLUSION (Supplemental Security Income never taxable)', 'Per IRC §86(d)(1)(D) + IRS Pub. 915 + spec §2.3: SSI is a need-based federal welfare program for low-income aged/blind/disabled individuals; administered by SSA but funded from the general fund (NOT the Social Security trust). **SSI is NEVER taxable** and must NOT appear on line 6a or 6b. Implementation at TaxReturnComputeService.java:8553-8555: `if (hasSupplementalSecurityIncome) { grossBenefits = subtractNonNegative(grossBenefits, supplementalSecurityIncomeAmount); }`. **Closure applied**: 18-line breadcrumb above the SSI exclusion conditional documenting three protections — (1) Boolean gate prevents accidental subtraction when flag is absent; (2) subtractNonNegative zero-floor protects against negative line 6a if SSI > grossBenefits (rare edge case); (3) Null-preserve guard — subtractNonNegative(null, x) returns null per the helper guard at line 18009-18011 (pure-SSI-only person → null, canonical; cross-reference 6a #5 point (4)). Typical scenario documented: retiree receives BOTH taxable SSA-1099 AND separate SSI; SSA-1099 box 5 typically does NOT include SSI (SSA issues a separate SSI notice, not a 1099), so the subtraction also acts as defensive double-count netting if a user mistakenly lumps SSI into box 5. Pure documentation closure — no code change.', 'TaxReturnComputeService.java:8533-8556 (18-line breadcrumb above SSI exclusion conditional); subtractNonNegative null-preserve at 18009-18011', 'CLOSED — verified correct. 18-line breadcrumb documenting three protections.'],
  [7, 'RESOLVED 2026-05-12 — VERIFIED CORRECT — RRB SCOPE LIMIT (SSEB only; NSSEB + tier 2 route to 5abc cluster)', 'Per IRS Pub. 915 + RRB-1099 instructions + spec §2.2: line 6a includes ONLY the SSEB (Social Security Equivalent Benefit) portion of Tier 1 RRB. The Railroad Retirement Board issues two mutually exclusive statements: (a) **RRB-1099 (blue form)** reports SSEB ONLY → line 6a/6b per IRC §86; (b) **RRB-1099-R (green form)** reports NSSEB + Tier 2 + VDB + Supplemental → lines 5a/5b/5c per IRC §72 (see 5a #7 RRB-1099-R component split for the 5-box decomposition). Implementation at TaxReturnComputeService.java:8546 reads `netSSEBAmount` (pre-decomposed SSEB-specific subfield), NOT a generic "full box 5" field. **Closure applied**: 19-line breadcrumb above the RRB-1099 loop documenting (a) two-form distinction (RRB-1099 vs RRB-1099-R); (b) field-naming protection (pre-decomposed netSSEBAmount prevents double-count); (c) mutual exclusion with line 5a #7 path; (d) concrete edge-case example — SSEB=$10k + NSSEB=$5k + Tier 2=$3k → line 6a gets $10k, line 5a gets $8k, no overlap. Pure documentation closure — no code change.', 'TaxReturnComputeService.java:8526-8551 (19-line breadcrumb above RRB-1099 SSEB-only loop); paired with 5a #7 RRB-1099-R component split', 'CLOSED — verified correct. 19-line breadcrumb (two-form distinction + mutual exclusion).'],
  [8, 'RESOLVED 2026-05-12 — OBSERVATION — LINE 6a HAS NO BLANK-WHEN-FULLY-TAXABLE RULE (UNLIKE 4a/5a)', 'Fundamental IRS pattern difference between lines 4a/5a and line 6a. Lines 4a/5a apply `fullyTaxableOverall ? null : roundMoney(...)` at TaxReturnComputeService.java:5372 + 5868 — blanking the gross-side line when all distributions are fully taxable (per IRS 4a/5a instructions + 4a #3 / 5a #3 breadcrumbs). **Line 6a omits that test by design** — per IRS Form 1040 2025 line 6a instructions + spec §4.2: "Even if none of your benefits are taxable, you still need to enter the total amount on line 6a." Rationale: the Pub. 915 worksheet uses full gross box 5 as input to "provisional income" under IRC §86; IRS requires gross visibility even when tier thresholds keep all benefits non-taxable (e.g., low-income retiree below $25k/$32k base). The "blank line 6a" only happens at the SocialSecurityComputation hasOutput=false boundary (line 8466-8473 — null return when no concept applies); within "concept applies" branch, line 6a is ALWAYS populated regardless of line 6b. **Closure applied**: 22-line breadcrumb above the `line6a = roundMoney(...)` assignment at TaxReturnComputeService.java:8337 documenting (a) IRS quote; (b) explicit contrast with 4a/5a pattern with code citations; (c) Pub. 915 + IRC §86 rationale; (d) hasOutput boundary clarification; (e) prevention against future "harmonization" with 4a/5a. Pure documentation closure — no code change.', 'TaxReturnComputeService.java:8337 (22-line breadcrumb above line 6a assignment); contrasts with lines 5372 (line 4a) + 5868 (line 5a)', 'CLOSED — observation. 22-line breadcrumb documenting IRS rule difference + 4a/5a contrast.'],
  [9, 'RESOLVED 2026-05-12 — OBSERVATION — Lump-sum back payments INCLUDED in line 6a (no special filtering)', 'Per spec §4.3 + IRS Pub. 915 + IRC §86(e): lump-sum back payments (retroactive SS for prior years) are included by SSA in box 5 of the SSA-1099 issued for the year the check was paid. They flow to line 6a as part of the full box 5 amount with **no special filtering** — the loop at TaxReturnComputeService.java:8545 reads `netBenefitsAmount` directly with no `if (isLumpSumYear) skip` or `subtractLumpSumPortion` derivation. The IRC §86(e) lump-sum election (line 6c — future audit) allocates the back-payment to its respective prior tax years for the line 6b TAXABILITY computation only (Pub. 915 Worksheets 3+4). The election DOES NOT change line 6a inclusion — line 6a always shows the full current-year box 5 amount including any lump-sum component. **Pure xlsx-flip closure** — substantive verification already captured by the 6a #3 breadcrumb at lines 8533-8538 point (3) ("Lump-sum back payments and disability benefits INCLUDED — per spec §4.3 + §2.4..."). No additional breadcrumb needed. Future 6c audit will cross-reference back here to confirm line 6a is NOT modified by the election.', 'TaxReturnComputeService.java:8545 (full box 5 read); 6a #3 breadcrumb at lines 8533-8538 point (3); spec §4.3 + IRC §86(e)', 'CLOSED — observation. Pure xlsx-flip — substance covered by 6a #3 breadcrumb.'],
  [10, 'RESOLVED 2026-05-12 — OBSERVATION — LINE 6a IS THE FIRST SOCIAL SECURITY-FAMILY AUDIT (4-line cluster: 6a/6b/6c/6d)', 'Lines 6a/6b/6c/6d form an interconnected cluster — **FOUR sub-lines** (structurally unique vs the 3-sub-line shared-aggregator clusters 3abc / 4abc / 5abc). Line 6d is NEW for 2025 — MFS lived-apart-all-year checkbox (replaces the old handwritten "D" notation; controls $0-vs-$25k base amount in Pub. 915 Worksheet 1 line 7 for MFS filers). Line 6a establishes 9 patterns for future 6b/6c/6d audits to inherit/extend: (#1) MFS guard cascade extension to 11 orchestrators; (#2) knowledge-file rename (13-line naming convergence); (#3) net-benefits formula (box 5 net-of-repayments + RRB SSEB-only + lump-sum/disability inclusion); (#4) line-9 10-audit consolidation; (#5) canonical 0-vs-null compliance; (#6) SSI exclusion per IRC §86(d)(1)(D) — unique to SS cluster; (#7) RRB SSEB-only scope limit paired with 5a #7 RRB-1099-R component split; (#8) no-blank-when-fully-taxable IRS rule difference vs 4a/5a; (#9) lump-sum back payments included per IRC §86(e). Future 6b will extend line-9 breadcrumb to 11 audit IDs (inverse-include bilateral coverage, matching 4b #5 / 5b #5 milestones). Future 6c audit will cover `computeTaxableSocialSecurityLumpSum` at line 8713-8800 (Pub. 915 Worksheets 3+4). Future 6d audit will cover MFS-lived-apart base-amount substitution. Pure xlsx-flip observation — no code change. Backend regression unchanged.', 'XLS/computations/6a.xlsx audit-trail (this row); no code change', 'CLOSED — pure xlsx-flip observation. Positions future 6b/6c/6d audits (first 4-line cluster).'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 35 }, { wch: 95 }, { wch: 65 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 6a Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.socialSecurityBenefits', 'topmostSubform[0].Page1[0].f1_68[0] (line6a_social_security_benefits)', 'form-tax-return-1040.xlsx (line 6a cell)', '★ Primary output. Stored when non-null. **NOT blanked when fully-taxable** (different from 4a/5a).'],
  [],
  ['SIBLING OUTPUTS (future audits)'],
  ['form1040.income.taxableSocialSecurityBenefits', 'topmostSubform[0].Page1[0].f1_69[0] (line6b_social_security_taxable_amount)', 'form-tax-return-1040.xlsx (line 6b cell)', 'Sibling. Carries taxable portion → enters line 9. Future 6b audit.'],
  ['form1040.income.line6cLumpSumElection', 'c1_41[0] / line6c_lump_sum_election', 'form-tax-return-1040.xlsx (line 6c checkbox)', 'Lump-sum election checkbox. Future 6c audit.'],
  ['form1040.income.line6dMfsLivedApartAllYear', 'c1_42[0] / line6d_mfs_lived_apart_all_year', 'form-tax-return-1040.xlsx (line 6d checkbox)', 'NEW for 2025 (replaces old "D" handwritten notation). Future 6d audit.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Form 1040 line 9 (total income)', '—', '—', 'Line 6a (gross/net-benefits) is excluded; only line 6b (taxable per IRC §86) enters line 9.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 55 }, { wch: 70 }, { wch: 55 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
