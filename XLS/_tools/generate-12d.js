// ============================================================================
//  Generates: C:\us-tax\XLS\computations\12d.xlsx
//
//  Source-of-truth references:
//    - lines/12abcde.md (Verification log rows 1+2+3 via 12a/12b/12c #3)
//    - dependencies/12abcde.md
//    - knowledge/line-12abcde-deductions.md (renamed via 12a #2)
//    - TaxReturnComputeService.computeLine12() at line ~2924 — orchestrator; line 12d
//      count derivation at line ~3090 with MFS-narrowly-allowed gating; static
//      countAgeBlindnessBoxes() helper at line 19592 with HOH/QSS exclusion
//    - TaxReturnComputeService.buildStandardDeductionIndicators() at line 2775 —
//      reads 4 source booleans + 1 MFS-gating flag for line 12d
//    - PDF semantic CSV rows 135-138: c2_5/c2_6/c2_7/c2_8 (taxpayer/spouse age/blind)
//      (⚠️ STALE 2024-TAX-YEAR `*_born_before_1960` semantic keys — drift fix in 12d #6)
//    - Frontend form-tax-return-1040.component.ts:274-277 currently writes the stale
//      `*_born_before_1960` keys
//    - ReferenceData.java line 51-52: STANDARD_DEDUCTION_ADDITIONAL_MARRIED_PER_BOX =
//      $1,600; STANDARD_DEDUCTION_ADDITIONAL_SINGLE_OR_HOH_PER_BOX = $2,000
//
//  Tax year: 2025
//
//  NOTE: Line 12d is the **age/blindness checkbox COUNT (0-4 integer)** on Form 1040
//  page 2 line-12 section. Four PDF checkboxes (taxpayer-age + taxpayer-blind +
//  spouse-age + spouse-blind). Per spec §4.4:
//    - Taxpayer boxes (age/blind): count for all filing statuses
//    - Spouse boxes: count for MFJ + QSS NEVER (QSS=deceased) + HOH NEVER (HOH=single
//      filer) + MFS ONLY IF `spouseMeetsAgeBlindnessMfsRequirements=TRUE`
//    - Age threshold: born before **January 2, 1961** for 2025 tax year (the 65-yr
//      birthday rule per IRC §63(f) — treated as reaching age 65 on the day before
//      the 65th birthday; so for 2025, age 65 is reached by Dec 31, 2025 if born by
//      Jan 1, 1961)
//  When TRUE → addon flows through two paths per line 12a state:
//    - line12a TRUE → dependent worksheet line 4b addon = count × $2,000 (Single/HOH)
//      or × $1,600 (others); per ReferenceData.java + spec §5.3
//    - line12a FALSE → drives the 2025 age/blind chart at spec §5.4 (base standard
//      deduction + count × per-box-addon)
//
//  **Line 12d audit positioning** (cluster-mid-late sibling audit):
//   • 4th sub-line in the 12abcde deductions cluster
//   • Cluster log progress: 3 → 4 of eventual 5 rows
//   • Will be THIRD extension of the 12a #4 cluster-level seed (cluster-level seed
//     progress: 3 of 4 done; only 12e #4 remaining)
//   • **FIRST audit with NUMERIC OUTPUT** in 12abcde cluster (integer 0-4 vs. prior
//     Boolean checkboxes for 12a/12b/12c)
//   • **FIRST audit with REFERENCE-DATA CONSTANTS** in 12abcde cluster (per-box
//     addons $2,000 / $1,600 from ReferenceData.java)
//   • ⚠️ FUNCTIONAL TAX-YEAR DRIFT FIX — CSV `*_born_before_1960` semantic keys
//     stale (2024-tax-year value); fix to `*_born_before_1961` for 2025; **FIRST
//     TAX-YEAR drift fix in the audit workflow** (prior FUNCTIONAL drifts were
//     combined-naming / _alt-suffix; this is the first tax-year-rotation drift)
//
//  Line 12d audit angles:
//   • Sibling-mate MFS cross-reference (per-field MFS-semantics: all 4 spouse-side
//     fields are MFS-LEGITIMATE per 12a #1; MFS-narrowly-allowed inline filter at
//     orchestrator-entry preserves 12a #1's SURGICAL classification)
//   • Sibling-mate knowledge-file cross-reference (3rd of 4 expected in 12abcde)
//   • Verification log 4th row append (cluster log: 4 of 5)
//   • THIRD extension of 12a #4 cluster-level seed (cluster-seed progress: 3 of 4)
//   • Verified-correct on countAgeBlindnessBoxes() static helper with HOH/QSS exclusion
//   • ⚠️ FUNCTIONAL TAX-YEAR DRIFT FIX — `*_born_before_1960` → `*_born_before_1961`
//     at 4 sites (CSV ×2 + frontend ×2 + generator ×2); first TAX-YEAR drift fix
//   • Verified-correct on MFS-narrowly-allowed gating (per spec §4.4; existing
//     test `computesLine12dMfsSpouseBoxesCountedWhenSpouseQualifies` covers)
//   • Verified-correct on downstream addon paths (per spec §5.3 + §5.4; reference-
//     data constants $2,000 / $1,600 in ReferenceData.java)
//   • Observation on spec §4.4 age-65-on-day-before-65th-birthday nuance (user-
//     attested via existing booleans; 8th Path A application)
//   • Boundary milestone — 4th sub-line; THIRD cluster-level seed extension;
//     drift fix #5 (3rd FUNCTIONAL; first TAX-YEAR); first numeric output + ref-
//     data in 12abcde cluster
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'computations', '12d.xlsx');
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['LINE 12d — AGE / BLINDNESS CHECKBOX COUNT (0-4 integer)'],
  ['Tax Year', '2025'],
  ['Form / Line', 'Form 1040 / 1040-SR, line 12d (page 2; FOUR checkboxes: taxpayer-age + taxpayer-blind + spouse-age + spouse-blind)'],
  ['Concept', 'Age and blindness checkbox COUNT (integer 0-4). Per spec §4.4: counts checked boxes for "born before January 2, 1961" + "blind" for taxpayer (always) + spouse (MFJ always; QSS never; HOH never; MFS only if spouse meets the no-income/not-filing/not-dependent qualifying conditions). **4th sub-line in the 12abcde deductions cluster** + **FIRST audit with NUMERIC OUTPUT and REFERENCE-DATA CONSTANTS in 12abcde cluster** (12a/12b/12c are Booleans; line 12d is integer 0-4 with per-box addon constants).'],
  ['Core invariant', '`line12dBoxesCheckedCount = countAgeBlindnessBoxes(status, youAge, youBlind, spouseAge_if_allowed, spouseBlind_if_allowed)` per spec §4.4. Integer 0-4. Taxpayer boxes always count; spouse boxes gated by filing-status rules (HOH/QSS NEVER; MFS ONLY IF qualifying). Downstream: TWO paths per line 12a state — dependent worksheet line 4b addon (per spec §5.3) OR age/blind chart drive (per spec §5.4).'],
  ['Per-Return Formula',
    'INPUT INDICATORS at buildStandardDeductionIndicators() (~line 2789-2828):\n' +
    '  Boolean youBornBeforeThreshold = getBoolean(deductionsStandardTaxpayer, "youBornBeforeThreshold");\n' +
    '  Boolean youAreBlind             = getBoolean(deductionsStandardTaxpayer, "youAreBlind");\n' +
    '  Boolean spouseBornBeforeThreshold = getBoolean(deductionsStandardSpouse, "spouseBornBeforeThreshold");\n' +
    '  Boolean spouseIsBlind             = getBoolean(deductionsStandardSpouse, "spouseIsBlind");\n' +
    '  Boolean spouseMeetsAgeBlindnessMfsRequirements\n' +
    '    = getBoolean(deductionsStandardSpouse, "spouseMeetsAgeBlindnessMfsRequirements");\n' +
    '  // NOTE: All 4 spouse-side fields + the MFS gating flag are MFS-LEGITIMATE per\n' +
    '  // the 12a #1 SURGICAL guard\'s per-field MFS-semantics classification — REMAIN\n' +
    '  // readable on MFS (unlike `someoneCanClaimSpouse` which is null-shadowed).\n\n' +
    'MFS GATING at computeLine12() (~line 3087-3089):\n' +
    '  Boolean spouseMeetsReqs = indicators.getSpouseMeetsAgeBlindnessMfsRequirements();\n' +
    '  boolean mfsSpouseBoxesAllowed = !"Married filing separately".equalsIgnoreCase(status)\n' +
    '    || Boolean.TRUE.equals(spouseMeetsReqs);\n\n' +
    'COUNT DERIVATION at computeLine12() (~line 3090-3096):\n' +
    '  int line12dCount = indicators == null ? 0 : countAgeBlindnessBoxes(\n' +
    '    status,\n' +
    '    indicators.getYouBornBeforeThreshold(),\n' +
    '    indicators.getYouAreBlind(),\n' +
    '    mfsSpouseBoxesAllowed ? indicators.getSpouseBornBeforeThreshold() : null,\n' +
    '    mfsSpouseBoxesAllowed ? indicators.getSpouseIsBlind() : null\n' +
    '  );\n\n' +
    'STATIC HELPER countAgeBlindnessBoxes() at line 19592:\n' +
    '  int total = 0;\n' +
    '  if (taxpayerBornBeforeThreshold == TRUE) total += 1;\n' +
    '  if (taxpayerBlind == TRUE) total += 1;\n' +
    '  // HOH filers have no spouse; QSS spouse is deceased — neither can check spouse boxes\n' +
    '  boolean countSpouse = status == null\n' +
    '    || (!"Head of household".equalsIgnoreCase(status)\n' +
    '        && !"Qualifying surviving spouse".equalsIgnoreCase(status));\n' +
    '  if (countSpouse && spouseBornBeforeThreshold == TRUE) total += 1;\n' +
    '  if (countSpouse && spouseBlind == TRUE) total += 1;\n' +
    '  return total;  // 0..4\n\n' +
    'PERSISTENCE at computeLine12() (~line 3134):\n' +
    '  deductions.setLine12dBoxesCheckedCount(line12dCount);\n\n' +
    '**PDF mapping** (⚠️ TAX-YEAR DRIFT FIX VIA 12d #6):\n' +
    '  PRE-FIX (2024-stale):\n' +
    '    c2_5[0] → `taxpayer_born_before_1960`\n' +
    '    c2_6[0] → `spouse_born_before_1960`\n' +
    '    c2_7[0] → `taxpayer_blind`\n' +
    '    c2_8[0] → `spouse_blind`\n' +
    '  POST-FIX (2025-correct per spec §4.4):\n' +
    '    c2_5[0] → `taxpayer_born_before_1961`\n' +
    '    c2_6[0] → `spouse_born_before_1961`\n' +
    '    c2_7[0] → `taxpayer_blind`     (unchanged — no tax-year threshold)\n' +
    '    c2_8[0] → `spouse_blind`       (unchanged — no tax-year threshold)'],
  ['Filed',
    'Form 1040 line 12d checkboxes (page 2) — FOUR separate PDF checkboxes:\n' +
    '  c2_5[0] (rect (153.2, 710.001, 161.2, 718.001)) — taxpayer age 65+\n' +
    '  c2_6[0] (rect (311.6, 710.001, 319.6, 718.001)) — spouse age 65+\n' +
    '  c2_7[0] (rect (153.2, 698.002, 161.2, 706.002)) — taxpayer blind\n' +
    '  c2_8[0] (rect (311.6, 698.002, 319.6, 706.002)) — spouse blind\n' +
    'Frontend writes 4 separate Boolean mappings; backend persists ONE integer count.'],
  ['Backend method', '**Same orchestrator as 12a/12b/12c** — `computeLine12()` derives all 5 sub-lines. Line 12d uses a static helper `countAgeBlindnessBoxes()` at line 19592 + MFS-narrowly-allowed gating at line 3087-3089. **No additional MFS guard needed** — all 4 spouse-side fields (`spouseBornBeforeThreshold`, `spouseIsBlind`, `spouseMeetsAgeBlindnessMfsRequirements`) are MFS-LEGITIMATE per the 12a #1 SURGICAL guard\'s per-field classification (NOT null-shadowed on MFS).'],
  ['Output', 'form1040.deductions.line12dBoxesCheckedCount (Integer 0-4). Per spec §1.1: this is one of four boolean/integer outputs in the line-12 section. Frontend renders FOUR Boolean PDF checkboxes from FOUR source-form Booleans (NOT from the count); the count is used internally by `computeStandardDeduction()` for the addon arithmetic.'],
  ['IRS source', 'IRS 2025 Form 1040 line 12d + lines/12abcde.md spec §4.4 + §5.3 (dependent worksheet addon) + §5.4 (age/blind chart). Statutory basis: IRC §63(f) (additional standard deduction for age 65+ and blind). 2025 age threshold: born before **January 2, 1961** (the 65-year-birthday-treated-as-day-before-65 rule).'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Notes'],
  [1, 'Read 4 source booleans + 1 MFS gating flag from `standard-deductions-taxpayer/-spouse` personal forms', '`youBornBeforeThreshold` + `youAreBlind` (taxpayer); `spouseBornBeforeThreshold` + `spouseIsBlind` + `spouseMeetsAgeBlindnessMfsRequirements` (spouse). All 4 spouse-side fields MFS-LEGITIMATE per 12a #1 SURGICAL guard.'],
  [2, 'Wrap in `StandardDeductionIndicators` record', 'Per 12a #1 SURGICAL MFS guard: all 4 spouse-side fields remain readable on MFS (only `someoneCanClaimSpouse` is null-shadowed).'],
  [3, 'Apply MFS-narrowly-allowed gating at computeLine12() line 3087-3089', '`mfsSpouseBoxesAllowed = (status != MFS) || (spouseMeetsAgeBlindnessMfsRequirements == TRUE)`. For non-MFS statuses, trivially TRUE; for MFS, requires the spouse-qualifying flag.'],
  [4, 'Call countAgeBlindnessBoxes() static helper at line 19592', 'Pass status + 4 source booleans (spouse booleans passed as null if `mfsSpouseBoxesAllowed=FALSE`). Helper increments count for each TRUE; applies HOH/QSS exclusion for spouse boxes.'],
  [5, 'Persist Integer count to Deductions output object', '`deductions.setLine12dBoxesCheckedCount(line12dCount)` at ~line 3134. JSON field: `line12dBoxesCheckedCount` (camelCase Integer 0-4).'],
  [6, 'PDF rendering at frontend — FOUR Boolean checkboxes (NOT the count)', 'Frontend reads the 4 source Booleans from `standardDeductionIndicators` and writes 4 separate PDF mappings (`c2_5` taxpayer-age + `c2_6` spouse-age + `c2_7` taxpayer-blind + `c2_8` spouse-blind). The integer count is internal-only.'],
  [7, 'Downstream usage — TWO paths per line 12a state', '(A) line12a TRUE → dependent worksheet line 4b addon = count × per_box_addon (per spec §5.3). (B) line12a FALSE → drives age/blind chart at spec §5.4 (base standard deduction + count × per_box_addon dynamically).'],
  [],
  ['MUTUAL EXCLUSION / SPECIAL RULES'],
  ['Rule', 'Implementation', 'Why'],
  ['Per-box addon depends on filing status', '$2,000/box for Single/HOH; $1,600/box for MFJ/MFS/QSS — per `ReferenceData.STANDARD_DEDUCTION_ADDITIONAL_SINGLE_OR_HOH_PER_BOX` + `STANDARD_DEDUCTION_ADDITIONAL_MARRIED_PER_BOX`.', 'Per IRC §63(f) + Rev. Proc. 2024-40 (2025 inflation adjustments). Single/HOH gets the larger addon because their base deduction is lower than MFJ.'],
  ['Age threshold for 2025: born before January 2, 1961', 'Per spec §4.4 + IRC §63(f)(1)(A) ("age 65 on the day before the 65th birthday" rule). For 2025 tax year, someone born on Jan 1, 1961 turns 65 on Jan 1, 2026 → treated as 65 by Dec 31, 2025 (day-before-65 = Dec 31, 2025).', 'Tax-year-rotating threshold (2024 was Jan 2, 1960; 2025 is Jan 2, 1961). **The CSV semantic keys `*_born_before_1960` are STALE (2024 value) — fix via 12d #6** to `*_born_before_1961` (2025).'],
  ['HOH filers cannot check spouse boxes', 'In `countAgeBlindnessBoxes()` at line 19604-19607: `countSpouse = !HOH && !QSS`. Spouse-age + spouse-blind contributions are skipped when status is HOH or QSS.', 'Per spec §4.4: "do NOT check spouse boxes for head of household." HOH is single-filer; no spouse exists on the return.'],
  ['QSS filers cannot check spouse boxes', 'Same exclusion at line 19604-19607.', 'Per IRS: QSS (Qualifying Surviving Spouse) filer\'s spouse is deceased; no spouse-age/spouse-blind status to claim.'],
  ['MFS filers can check spouse boxes ONLY if spouse meets qualifying conditions', 'MFS gating at line 3087-3089: `mfsSpouseBoxesAllowed = (status != MFS) || (spouseMeetsAgeBlindnessMfsRequirements == TRUE)`. Spouse-qualifying flag = spouse had no gross income + is not filing + cannot be claimed as a dependent.', 'Per spec §4.4 + IRS instructions: MFS filer can claim spouse boxes only when the spouse is effectively a "non-filer" on whom the taxpayer could have claimed status. Existing test `computesLine12dMfsSpouseBoxesCountedWhenSpouseQualifies` covers (was a canary for 12a #1 wholesale-attempt failure).'],
  ['No additional MFS guard needed at orchestrator entry', 'All 4 spouse-side fields are MFS-LEGITIMATE per the 12a #1 SURGICAL guard\'s per-field MFS-semantics classification — REMAIN readable on MFS (NOT null-shadowed). Only `someoneCanClaimSpouse` is null-shadowed.', '**SIXTH defensive-gap-NOT-needed Issue #1** in the workflow (after 9 #1 + 11a #1 + 11b #1 + 12b #1 + 12c #1). Sibling-mate to 12a/b/c #1.'],
  ['⚠️ PDF FUNCTIONAL TAX-YEAR DRIFT (FIXED VIA 12d #6)', 'Pre-fix: CSV rows 135 + 136 used `taxpayer_born_before_1960` and `spouse_born_before_1960` (2024 tax-year semantic keys). Post-fix: renamed to `*_born_before_1961` (2025-correct per spec §4.4). 6-step fix: CSV ×2 + frontend ×2 + generator ×2.', '**Documentation drift fix #5 in the workflow**; **3rd FUNCTIONAL drift fix** (12b #6 + 12c #6 prior); **FIRST TAX-YEAR drift fix** in workflow (prior FUNCTIONAL drifts were combined-naming / `_alt`-suffix; this is the first tax-year-rotation drift). PDF rendering was functionally correct (frontend wrote the correct Boolean value), but the semantic key was tax-year-stale and would confuse future readers.'],
  [],
  ['DOWNSTREAM CONSUMERS — Where Line 12d Flows'],
  ['Consumer', 'How', 'Notes'],
  ['computeStandardDeduction() — ★★ PRIMARY DOWNSTREAM (TWO paths)', 'Path A (line12a TRUE): dependent worksheet line 4b addon = `line12dCount × per_box_addon` (per spec §5.3). Path B (line12a FALSE): age/blind chart drive = base standard deduction + `line12dCount × per_box_addon` (per spec §5.4 — dynamically computed).', '★★ CRITICAL: line 12d feeds the addon arithmetic in both standard-deduction paths (dependent worksheet + age/blind chart). When line12b/12c TRUE, hard-zero overrides both paths (per spec §5.2).'],
  ['Form 1040 line 12e (final deduction amount)', 'Indirect via the addon contribution.', 'Line 12e is the numeric output; line 12d count is one of its inputs (along with filing status base + line 12a path choice).'],
  ['Form 1040 line 14 / line 15 / line 16', 'Indirect via line 12e.', 'Per future line 14/15/16 audits.'],
  ['PDF c2_5/c2_6/c2_7/c2_8 checkboxes', 'Frontend writes 4 separate Boolean mappings from `standardDeductionIndicators` source Booleans (NOT from the count).', 'Per spec §1.1 + 12d #6 fix: PDF renders 4 separate checkboxes; backend persists ONE integer count (internal-only).'],
  ['NOT IN OUTPUT — line 12d does NOT affect line 13a/13b', '—', 'Lines 13a (QBI) and 13b (Schedule 1-A) are independent of line 12d.'],
];

const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 28 }, { wch: 75 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUTS — Every Field That Feeds Line 12d'],
  ['Line 12d has 4 Boolean inputs + 1 MFS gating flag. No statement entries; pure user-attested checkboxes.'],
  [],
  ['#', 'Source form', 'Field', 'Type', 'Required?', 'Role', 'Cross-reference'],
  [1, 'standard-deductions-taxpayer', 'youBornBeforeThreshold', 'Boolean', 'Optional (null → counted as FALSE)', 'Taxpayer age 65+ (born before Jan 2, 1961 for 2025)', 'PDF c2_5[0]; rename via 12d #6 to `taxpayer_born_before_1961`'],
  [2, 'standard-deductions-taxpayer', 'youAreBlind', 'Boolean', 'Optional (null → counted as FALSE)', 'Taxpayer blind', 'PDF c2_7[0] = `taxpayer_blind` (unchanged — no tax-year threshold)'],
  [3, 'standard-deductions-spouse', 'spouseBornBeforeThreshold', 'Boolean', 'Optional; gated by MFS rules', 'Spouse age 65+ — counted on MFJ; never on HOH/QSS; MFS only if qualifying', 'PDF c2_6[0]; rename via 12d #6 to `spouse_born_before_1961`; MFS-LEGITIMATE per 12a #1'],
  [4, 'standard-deductions-spouse', 'spouseIsBlind', 'Boolean', 'Optional; gated by MFS rules', 'Spouse blind — same gating as #3', 'PDF c2_8[0] = `spouse_blind` (unchanged); MFS-LEGITIMATE per 12a #1'],
  [5, 'standard-deductions-spouse', 'spouseMeetsAgeBlindnessMfsRequirements', 'Boolean', 'Optional; MFS-only gating flag', 'Permits spouse boxes on MFS (spouse had no income + not filing + not dependent)', 'MFS-LEGITIMATE per 12a #1 SURGICAL guard'],
  [6, 'filing-status', 'filingStatus', 'String', 'YES', 'Gates spouse boxes — HOH/QSS never count spouse; MFS narrowly allowed', 'Read via `status` parameter; per spec §4.4'],
];

const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 32 }, { wch: 38 }, { wch: 12 }, { wch: 38 }, { wch: 60 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data ──────────────────────────────────────────────
const constants = [
  ['REFERENCE DATA — Constants Used by Line 12d (FIRST audit in 12abcde cluster with reference-data constants)'],
  [],
  ['Constant', 'Value (2025)', 'Source', 'Notes'],
  ['Per-box addon — Single/HOH', '$2,000', 'ReferenceData.STANDARD_DEDUCTION_ADDITIONAL_SINGLE_OR_HOH_PER_BOX', 'Per IRC §63(f) + Rev. Proc. 2024-40. Multiplied by line 12d count in dependent-worksheet path (spec §5.3) AND age/blind chart path (spec §5.4).'],
  ['Per-box addon — MFJ/MFS/QSS', '$1,600', 'ReferenceData.STANDARD_DEDUCTION_ADDITIONAL_MARRIED_PER_BOX', 'Per IRC §63(f) + Rev. Proc. 2024-40. Smaller addon for married filers (whose base deduction is already higher).'],
  ['Age threshold (2025)', 'Born before January 2, 1961', 'Per spec §4.4 + IRC §63(f)(1)(A)', '2025-correct threshold (the 65-on-day-before-65 rule). **PRE-12d #6 the CSV used "1960" (2024-stale)** — fixed via 12d #6 rename.'],
  [],
  ['2025 Age/blind chart values (DYNAMICALLY COMPUTED, NOT hardcoded)'],
  ['Filing status', '0 boxes (base)', '1 box', '2 boxes', '3 boxes', '4 boxes'],
  ['Single', '$15,750', '$17,750', '$19,750', '—', '—'],
  ['MFS', '$15,750', '$17,350', '$18,950', '$20,550', '$22,150'],
  ['MFJ', '$31,500', '$33,100', '$34,700', '$36,300', '$37,900'],
  ['QSS', '$31,500', '$33,100', '$34,700', '—', '—'],
  ['HOH', '$23,625', '$25,625', '$27,625', '—', '—'],
  [],
  ['Statutory references'],
  ['IRC §63(f)', 'IRC §63(f)', 'YES — additional standard deduction for age 65+ and blind', 'Authorizes the line 12d per-box addon.'],
  ['IRC §63(f)(1)(A)', 'IRC §63(f)(1)(A)', 'YES — age 65 rule', '"Treated as reaching age 65 on the day before the 65th birthday." Drives the Jan 2, 1961 threshold for 2025.'],
  ['Rev. Proc. 2024-40', 'IRS Rev. Proc.', 'YES — 2025 inflation adjustments', 'Sets the 2025 per-box addons ($2,000 / $1,600) and base standard deductions.'],
];

const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 45 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 12d Integer Count + 4 PDF Checkboxes'],
  ['Line 12d persists ONE integer count on Deductions output; PDF renders FOUR separate Boolean checkboxes (frontend uses source Booleans, not the count).'],
  [],
  ['Output target', 'Where wired', 'Effect'],
  ['form1040.deductions.line12dBoxesCheckedCount', '`deductions.setLine12dBoxesCheckedCount(line12dCount)` at ~line 3134', '★ CANONICAL line 12d output. Integer 0-4. Used internally by `computeStandardDeduction()` for the addon arithmetic.'],
  ['PDF c2_5[0] taxpayer age (POST 12d #6)', 'Frontend writes `standardDeductionIndicators.youBornBeforeThreshold` to canonical `taxpayer_born_before_1961`', 'Page-2 PDF rendering. Pre-fix used stale `*_before_1960` key.'],
  ['PDF c2_6[0] spouse age (POST 12d #6)', 'Frontend writes `standardDeductionIndicators.spouseBornBeforeThreshold` to canonical `spouse_born_before_1961`', 'Page-2 PDF rendering. Pre-fix used stale `*_before_1960` key.'],
  ['PDF c2_7[0] taxpayer blind', 'Frontend writes `standardDeductionIndicators.youAreBlind` to `taxpayer_blind`', 'Unchanged by 12d #6 (no tax-year threshold in the semantic key).'],
  ['PDF c2_8[0] spouse blind', 'Frontend writes `standardDeductionIndicators.spouseIsBlind` to `spouse_blind`', 'Unchanged by 12d #6 (no tax-year threshold).'],
  ['computeStandardDeduction() addon arithmetic — ★★ CRITICAL', 'Path A (line12a TRUE): dependent worksheet line 4b = `line12dCount × per_box_addon`. Path B (line12a FALSE): age/blind chart = base + `line12dCount × per_box_addon`.', '★★ Two paths controlled by line 12a state.'],
  ['Indirect — Form 1040 line 12e (final deduction amount)', 'Via the addon contribution.', 'Line 12e is the numeric output; line 12d count is an input.'],
  [],
  ['BLOCKING / ADVISORY FLAGS'],
  ['(None at line 12d site)', 'N/A', 'Line 12d is an integer count; no validation logic emits flags.', 'Spec §10.2 conceptual validation rules (HOH spouse-box rejection; MFS spouse-box gating) are structurally enforced by the inline filters at line 3087-3089 + line 19604-19607.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Line 12d does NOT affect line 13a/13b/14', '—', 'Lines 13a/13b are independent of line 12d; only line 12e is affected (via the addon).'],
  ['Line 12d does NOT override the line 12b/12c hard-zero', '—', 'Per spec §5.2: when line 12b OR 12c is TRUE, standard deduction = 0 regardless of line 12d boxes. The hard-zero TRUMPS the line 12d addon.'],
];

const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 90 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation Flags ────────────────────────────────────────────
const flags = [
  ['VALIDATION FLAGS — Line 12d-Related'],
  ['No line-12d-specific BLOCKING flags. Spec §10.2 conceptual rules are structurally enforced via inline filters.'],
  [],
  ['Flag', 'Severity', 'Condition', 'Code reference'],
  ['(None at line 12d site)', 'N/A', 'Line 12d is an integer count; structural invariants via inline filters.', 'HOH/QSS spouse-box exclusion at line 19604-19607; MFS-narrowly-allowed gating at line 3087-3089.'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 80 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Line 12d is the **age/blindness checkbox COUNT (0-4 integer)** — 4 PDF checkboxes (taxpayer-age + taxpayer-blind + spouse-age + spouse-blind) with MFS-narrowly-allowed + HOH/QSS-never gating. **4th sub-line in the 12abcde deductions cluster** + **FIRST audit with numeric output and reference-data constants in 12abcde cluster**. **The big-ticket item is Issue #6** — ⚠️ FUNCTIONAL TAX-YEAR DRIFT FIX (CSV `*_born_before_1960` 2024-stale → `*_born_before_1961` 2025-correct); 3rd FUNCTIONAL drift fix in workflow; **FIRST TAX-YEAR drift fix**. Verified 2026-05-13.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'RESOLVED 2026-05-13 — CROSS-REFERENCE — NO MFS GUARD NEEDED AT LINE 12d SITE (all 4 spouse-side fields are MFS-LEGITIMATE per 12a #1 SURGICAL guard)', 'Line 12d count derivation at TaxReturnComputeService.java:~3090 reads 4 spouse-side fields (`spouseBornBeforeThreshold` + `spouseIsBlind` + `spouseMeetsAgeBlindnessMfsRequirements`) through the `mfsSpouseBoxesAllowed` inline filter at line 3087-3089. **No additional MFS guard needed** — all 4 spouse-side fields are MFS-LEGITIMATE per the 12a #1 SURGICAL guard\'s per-field MFS-semantics classification (REMAIN readable on MFS; NOT null-shadowed). **Two-layer enforcement of spec §4.4**: (a) MFS-narrowly-allowed gating at line 3087-3089 — `mfsSpouseBoxesAllowed = (status != MFS) || (spouseMeetsAgeBlindnessMfsRequirements == TRUE)`; (b) HOH/QSS exclusion at `countAgeBlindnessBoxes()` line 19604-19607 — spouse contributions skipped for these statuses. The existing test `computesLine12dMfsSpouseBoxesCountedWhenSpouseQualifies` was a **canary during the 12a #1 wholesale-attempt failure** — proves the surgical classification correctly preserves line 12d functionality. **SIXTH defensive-gap-NOT-needed Issue #1 in the workflow** (after 9 #1 + 11a #1 + 11b #1 + 12b #1 + 12c #1) — all six are inline-compute sites with no need for explicit MFS guards. **Sibling-mate cross-reference to 12a #1 + 12b #1 + 12c #1** — completing the 12abcde cluster\'s pattern of inheriting MFS protection structurally. **Closure**: pure xlsx-flip cross-reference. No code change. Coverage will come via 12d #4 (cluster-level seed extension) + 12d #5/#7 (verified-correct breadcrumbs on the static helper + MFS gating block).', 'TaxReturnComputeService.java:~3090 (line 12d count derivation); 12a #1 SURGICAL guard at line ~2775 (per-field classification preserves all 4 spouse-side fields on MFS); 12d #5 + 12d #7 will add the verified-correct breadcrumbs', 'CLOSED — observation. No code change. SIXTH defensive-gap-NOT-needed Issue #1; sibling-mate to 12a/b/c #1; completes the 12abcde cluster\'s structural-inheritance pattern.'],
  [2, 'RESOLVED 2026-05-13 — DOCUMENTATION HYGIENE — KNOWLEDGE FILE ALREADY RENAMED VIA 12a #2 (sibling-mate cross-reference within the 12abcde cluster)', '`knowledge/knowledge_line12abcde.md` was renamed → `knowledge/line-12abcde-deductions.md` via 12a #2 (2026-05-13). Shared file covers all 5 sub-lines (anti-redundancy pattern). Convergence stays at **19 lines** (unchanged by 12d). Remaining Legacy A files unchanged (3): knowledge_line16/17/26/27abc.md. **3rd of 4 expected sibling-mate cross-references within the 12abcde cluster** (after 12b #2 + 12c #2; 12e #2 will be the 4th and FINAL — closes the cluster\'s sibling-mate cascade). The 12abcde cluster holds the **LARGEST sibling-mate cross-reference cascade in the workflow** (4 sibling-mate cross-references — matching the cluster\'s structural max as the LARGEST cluster). **Closure**: pure xlsx-flip cross-reference; no code change; no additional file rename; no generator header update needed (`generate-12d.js` references the already-canonical name).', 'C:\\us-tax\\knowledge\\line-12abcde-deductions.md (already renamed via 12a #2 — sibling-mate cross-reference)', 'CLOSED — sibling-mate cross-reference. No additional rename; convergence stays at 19 lines; 3rd of 4 expected within 12abcde cluster (12e #2 closes the cascade).'],
  [3, 'RESOLVED 2026-05-13 — SPEC ENHANCEMENT — VERIFICATION LOG 4th ROW APPENDED TO lines/12abcde.md (cluster log progress: 3 → 4 of eventual 5)', '`lines/12abcde.md` had a Verification log section with 3 rows (created via 12a #3 + appended via 12b #3 + 12c #3). **Closure applied**: appended a 4th row to the existing table in IN-PROGRESS state capturing the 12d walkthrough closures (will accumulate Issues #1-#10 outcomes; finalized to "COMPLETE — 10/10 closed" at end of walkthrough). **APPEND-row pattern** (NOT NEW-section creation). **Cluster log progress: 4 rows of eventual 5** — only 12e sibling remaining; 12e #3 will close the cluster log at 5 rows = LARGEST cluster log in the workflow (exceeds 6abcd 4-row prior max). **3rd of 4 expected APPEND-row operations** within the 12abcde cluster (after 12b #3 + 12c #3; 12e #3 will be 4th and final). After this append, **12abcde ties with 6abcd at 4 rows** (will exceed when 12e #3 closes).', 'lines/12abcde.md (existing Verification log section per 12a/b/c #3; 4th row appended)', 'CLOSED — 4th row appended. Cluster log progress: 4 of 5; 3rd of 4 expected APPEND-row operations.'],
  [4, 'RESOLVED 2026-05-13 — CROSS-REFERENCE — EXTENDED 12a #4 CLUSTER-LEVEL SEED WITH LINE-12d-SPECIFIC PAGE-2 DETAILS (THIRD extension of the cluster-level seed)', 'The 12a #4 cluster-level forward-cross-reference breadcrumb at TaxReturnComputeService.java:~2857 was seeded 2026-05-13 with placeholders for 4 future extensions; 12b #4 + 12c #4 were the FIRST and SECOND extensions. **Closure applied**: extended the 12a #4 breadcrumb with three updates: (1) **header updated** to "10 #4, 2026-05-13; EXTENDED 12b #4 + 12c #4 + 12d #4, 2026-05-13"; (2) **flipped the "line 12d (future audit)" placeholder block** to full thematic documentation — integer-output emphasis (FIRST numeric output + reference data in 12abcde cluster) + count derivation site (line ~3090) + `countAgeBlindnessBoxes` static helper at line 19592 + **two-layer enforcement of spec §4.4** (MFS-narrowly-allowed gating at line 3087-3089 + HOH/QSS exclusion at line 19604-19607) + 12a #1 SURGICAL MFS-guard cross-reference (all 4 spouse-side fields MFS-LEGITIMATE) + per-box addon reference data ($2,000 Single/HOH; $1,600 others; from `ReferenceData.java`) + IRC §63(f) statutory citation + **two downstream addon paths** (dependent worksheet line 4b + age/blind chart dynamic) + PDF rendering note (4 separate Boolean mappings; integer count internal-only) + **12d #6 FUNCTIONAL tax-year drift fix cross-reference** (CSV `*_1960` → `*_1961` rename; 6-step fix; FIRST TAX-YEAR drift fix in workflow) + age-65-on-day-before-65th-birthday nuance + **canary-test role in 12a #1 SURGICAL pivot** (existing test `computesLine12dMfsSpouseBoxesCountedWhenSpouseQualifies`); (3) **FUTURE EXTENSION POINTS section updated** — flipped "12d #4 — add..." → "EXTENDED 2026-05-13" with extension scope summary; progress tally updated to "3 of 4 extensions done (12b #4 + 12c #4 + 12d #4); 1 remaining (12e #4)". **THIRD extension of the 12a #4 cluster-level seed** — cluster-level seed progress: 3 of 4 done; only 12e #4 remains; cluster reaches FINAL state when 12e #4 closes.', 'TaxReturnComputeService.java:~2857 (12a #4 cluster-level breadcrumb; third extension applied; line-12d placeholder flipped to full documentation)', 'CLOSED — 12a #4 breadcrumb extended with line-12d-specific page-2 details. THIRD extension of the cluster-level seed; cluster-seed progress: 3 of 4; 12e #4 closes cluster.'],
  [5, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — countAgeBlindnessBoxes() STATIC HELPER (per spec §4.4 with HOH/QSS exclusion + null-safe)', 'At TaxReturnComputeService.java:~19592: static helper `countAgeBlindnessBoxes(status, taxpayerBornBeforeThreshold, taxpayerBlind, spouseBornBeforeThreshold, spouseBlind)` returns integer 0-4. **Three structural properties**: (a) null-safe `Boolean.TRUE.equals(...)` checks — treats null as false (no NPE); (b) HOH/QSS exclusion at line 19604-19607 (`countSpouse = !HOH && !QSS`) — spouse contributions skipped for these statuses per spec §4.4 (HOH = single-filer; QSS = deceased spouse); (c) MFS gating applied UPSTREAM at line 3087-3089 via `mfsSpouseBoxesAllowed` passing null to spouse args when MFS taxpayer\'s spouse does not qualify (verified separately via 12d #7). **Two-layer design** (HOH/QSS inline + MFS upstream) keeps the helper signature simple — HOH/QSS rule is filing-status-only (no spouse-attestation needed); MFS rule depends on the spouse-qualifying flag. **Closure applied**: extended the existing 4-line JavaDoc above the static helper to a **~28-line breadcrumb** documenting: the null-safe contract + HOH/QSS exclusion rationale + 2025 age threshold (born before Jan 2, 1961 per IRC §63(f)(1)(A) "age 65 on day before 65th birthday" rule) + cross-reference to spec §4.4 + cross-reference to the upstream MFS gating at line 3087-3089 (12d #7) + IRC §63(f) statutory citation + return value range (0-4) + preservation of the original 2-line HOH-rationale note for backward compat. Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:~19637-19665 (extended JavaDoc above countAgeBlindnessBoxes static helper; ~28-line breadcrumb)', 'CLOSED — verified correct. ~28-line breadcrumb documents null-safe contract + HOH/QSS exclusion + IRC §63(f) + spec §4.4 + 2025 threshold + upstream-MFS-gating cross-reference.'],
  [6, 'RESOLVED 2026-05-13 — ⚠️ FUNCTIONAL TAX-YEAR DRIFT FIX — CSV `*_born_before_1960` → `*_born_before_1961` (2024-stale → 2025-correct per spec §4.4); FIRST TAX-YEAR drift fix in the audit workflow', '⚠️ **TAX-YEAR-STALE PDF SEMANTIC KEYS**: CSV rows 135 + 136 had `taxpayer_born_before_1960` and `spouse_born_before_1960` — these were the **2024 tax-year threshold** (born before Jan 2, 1960 reaches age 65 by end of 2024). For **2025 tax year**, the correct threshold is **born before Jan 2, 1961** per spec §4.4 + IRC §63(f)(1)(A) "age 65 on day before 65th birthday" rule. PDF rendering was functionally correct (frontend wrote the correct Boolean value), but the semantic key + label were stale and would confuse future readers / form-validation tools / external consumers parsing the CSV. **Closure applied (6-step fix; parallels 12b #6 + 12c #6 patterns)**: (1) renamed CSV row 135 in `us-tax-ui/public/irs/` from `taxpayer_born_before_1960` → `taxpayer_born_before_1961`; (2) renamed CSV row 136 from `spouse_born_before_1960` → `spouse_born_before_1961`; (3) same renames in `pdfs/f1040_field_mapping_semantic.csv` (source-of-truth); (4) updated frontend `form-tax-return-1040.component.ts:281` taxpayer mapping; (5) updated frontend line 283 spouse mapping + added 7-line inline comment documenting the tax-year drift fix; (6) updated generator script `us-tax-be/scripts/generate-semantic-1040-2025.js` lines 152 + 153 (regression prevention). Grep verified no stale references remain in operational paths (`us-tax-ui/src/`). Backend spot-test passes. **Documentation drift fix #5 in the workflow** (after 11a #8 + 12a #8 doc-only + 12b #6 + 12c #6 FUNCTIONAL); **3rd FUNCTIONAL drift fix** (12b/c #6 prior); **FIRST TAX-YEAR drift fix in the audit workflow** — establishes precedent for tax-year-rotating thresholds (prior FUNCTIONAL drifts were combined-naming / `_alt`-suffix; this is the first tax-year-rotation drift). Note: `c2_7` (taxpayer_blind) + `c2_8` (spouse_blind) unchanged — no tax-year threshold in those semantic keys.', '6 files updated: us-tax-ui/public/irs/f1040_field_mapping_semantic.csv rows 135 + 136 (rename); pdfs/f1040_field_mapping_semantic.csv rows 135 + 136 (rename); us-tax-ui/src/app/forms/form-tax-return-1040.component.ts lines 281 + 283 (rename + 7-line inline comment); us-tax-be/scripts/generate-semantic-1040-2025.js lines 152 + 153 (generator canonical keys)', 'CLOSED — functional fix. CSV (×2) + frontend (×2) + generator (×2). Documentation drift fix #5 (3rd FUNCTIONAL; FIRST TAX-YEAR drift fix in the audit workflow).'],
  [7, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — MFS-NARROWLY-ALLOWED GATING + HOH/QSS EXCLUSION (two-layer enforcement of spec §4.4)', 'Two-layer enforcement of the spec §4.4 spouse-box rules at TaxReturnComputeService.java: (a) **LAYER 1 — MFS-narrowly-allowed gating** at line 3137-3139 — `mfsSpouseBoxesAllowed = (status != MFS) || (spouseMeetsAgeBlindnessMfsRequirements == TRUE)`. Spouse args passed as null to countAgeBlindnessBoxes when MFS + spouse-not-qualifying. (b) **LAYER 2 — HOH/QSS exclusion** at countAgeBlindnessBoxes line 19604-19607 — `countSpouse = !HOH && !QSS`. Even if spouse Booleans are TRUE, they are not added to the count for HOH/QSS filers. **Two-layer design rationale**: HOH/QSS rule is filing-status-only (cleanest in the helper itself); MFS rule depends on the spouse-qualifying flag (applied at the call site where the gating flag is available); defense-in-depth — the helper enforces HOH/QSS even if a caller forgets the upstream gate. **Existing test canary**: `computesLine12dMfsSpouseBoxesCountedWhenSpouseQualifies` — MFS taxpayer with `spouseMeetsAgeBlindnessMfsRequirements=TRUE` + spouse age + spouse blind → asserts count = 4. **This test was a canary during the 12a #1 wholesale-attempt failure** (alongside `computesLine12bForcesStandardDeductionToZeroForMfsSpouseItemizes`) — the wholesale null-shadow had blocked the `spouseMeetsAgeBlindnessMfsRequirements` field, breaking the test and forcing the SURGICAL pivot. **Closure applied**: added a **~22-line breadcrumb** above the MFS gating block at line 3137-3139 documenting the two-layer enforcement + spec §4.4 citation + IRC §63(f) statutory citation + two-layer design rationale + 12a #1 SURGICAL MFS-guard cross-reference (`spouseMeetsAgeBlindnessMfsRequirements` is MFS-LEGITIMATE; REMAINS readable on MFS) + **canary-test role in 12a #1 SURGICAL pivot**. Pure documentation closure — no functional change.', 'TaxReturnComputeService.java:~3137-3139 (MFS gating block; ~22-line breadcrumb above); existing test `computesLine12dMfsSpouseBoxesCountedWhenSpouseQualifies`', 'CLOSED — verified correct. ~22-line breadcrumb documents two-layer enforcement + design rationale + canary-test role in 12a #1 SURGICAL pivot.'],
  [8, 'RESOLVED 2026-05-13 — VERIFIED CORRECT — LINE 12d DOWNSTREAM ADDON PATHS (per spec §5.3 + §5.4; reference-data constants $2,000 / $1,600)', 'Line 12d count flows through TWO downstream addon paths in `computeStandardDeduction()`: (A) **Dependent worksheet path** (line 12a TRUE; spec §5.3): worksheet line 4b = `count × per_box_addon` where per-box-addon is `$2,000` (Single/HOH) or `$1,600` (others) per `ReferenceData.STANDARD_DEDUCTION_ADDITIONAL_SINGLE_OR_HOH_PER_BOX` + `STANDARD_DEDUCTION_ADDITIONAL_MARRIED_PER_BOX`. (B) **Age/blind chart path** (line 12a FALSE; spec §5.4): final standard deduction = base + `count × per_box_addon` (DYNAMICALLY COMPUTED; chart amounts in spec §5.4 are derived from base + addon, NOT hardcoded). **Architectural strength**: chart values are derived from a SINGLE source of truth (`ReferenceData.java` per-box-addon constants) — no risk of chart-vs-constant drift across tax-year rotations. Both paths consume the same per-box-addon reference-data constants for behavioral consistency. **Closure**: pure xlsx-flip affirmative verification — formula + reference-data correct per spec §5.3 + §5.4 + IRC §63(f) + Rev. Proc. 2024-40. **NO new breadcrumb** at the `computeStandardDeduction()` site — deep addon-path documentation deferred to future line 12e audit (line 12d count is one of its inputs; line 12e is the numeric output where the deep path-switch documentation naturally attaches). Anti-fragmentation + anti-duplication policy applied (same pattern as 12a/b/c #7). **1st anti-duplication app in the 12d walkthrough**.', 'TaxReturnComputeService.java:`computeStandardDeduction()` (addon arithmetic in both paths); ReferenceData.java:51-52 (per-box addons); deep documentation deferred to future 12e #4 extension', 'CLOSED — verified correct. Reference-data + spec coverage adequate; deep documentation deferred to future line 12e audit.'],
  [9, 'RESOLVED 2026-05-13 — OBSERVATION — SPEC §4.4 AGE-65-ON-DAY-BEFORE-65TH-BIRTHDAY NUANCE (per IRC §63(f)(1)(A); user-attested input)', 'Per spec §4.4: "a person is treated as reaching age 65 on the day before the 65th birthday." Statutory basis: IRC §63(f)(1)(A). For 2025 tax year, the practical effect: someone born on January 1, 1961 turns 65 on January 1, 2026 → treated as 65 by December 31, 2025 (day-before-65 = Dec 31, 2025) → eligible to check the age box. The "born before January 2, 1961" threshold encodes this rule (born on Jan 1, 1961 is INCLUDED; born on Jan 2, 1961 is EXCLUDED). **Backend handling**: (a) NO auto-detection — backend does not compute age from a date-of-birth field; (b) user-attested input — user captures via the `youBornBeforeThreshold` / `spouseBornBeforeThreshold` Booleans (TRUE if born before Jan 2, 1961 for 2025); (c) UI form text should encode the day-before-birthday rule + tax-year-specific date in the question label (frontend concern; out-of-scope). **Three considerations**: (1) Low-confusion-risk (threshold widely understood; UI form text can be unambiguous); (2) User-driven (backend correctly accepts user-attested Boolean); (3) No backend deficiency — spec §4.4 + IRC §63(f)(1)(A) document the nuance + 12d #6 functional fix renames the CSV key to the 2025-correct threshold. **Closure**: pure xlsx-flip observation — no code change. **Anti-fragmentation policy applied** — NO new outstanding entry (spec §4.4 + IRC §63(f)(1)(A) + 12d #6 functional fix serve as canonical tracking). **8th Path A application** in the workflow (after 7a #9 / 8 #9 / 10 #9 / 11b #8 / 12a #9 / 12b walkthrough / 12c #9). Mirrors 12a #9 + 12c #9 — all three 12abcde nuances are user-attested via existing Boolean inputs.', 'lines/12abcde.md §4.4 (canonical tracking); IRC §63(f)(1)(A); UI form text (out-of-scope advisory)', 'CLOSED — observation. Anti-fragmentation policy applied; no new outstanding entry; 8th Path A application.'],
  [10, 'RESOLVED 2026-05-13 — OBSERVATION — LINE 12d IS THE 4th SUB-LINE IN THE 12abcde CLUSTER + THIRD CLUSTER-LEVEL SEED EXTENSION + DOCUMENTATION DRIFT FIX #5 (3rd FUNCTIONAL; FIRST TAX-YEAR DRIFT) + FIRST NUMERIC OUTPUT + REFERENCE-DATA IN 12abcde CLUSTER', 'Pure xlsx-flip observation — **four workflow milestones**: (1) **4th sub-line in the 12abcde deductions cluster** — cluster log progresses 3 → 4 of eventual 5; only 12e sibling remaining; cluster reaches FINAL state when 12e closes. (2) **THIRD extension of the 12a #4 cluster-level seed** — cluster-level seed progress: 3 of 4 done; only 12e #4 remains; cluster reaches FINAL breadcrumb state with the upcoming 12e #4 extension. (3) **Documentation drift fix #5 in the workflow** (12d #6) — **3rd FUNCTIONAL drift fix** (after 12b/c #6); **FIRST TAX-YEAR drift fix in the audit workflow** (prior FUNCTIONAL drifts were combined-naming / `_alt`-suffix; this is the first tax-year-rotation drift — establishes precedent for similar drifts at lines that have tax-year-rotating thresholds in PDF labels). (4) **FIRST audit with NUMERIC OUTPUT and REFERENCE-DATA CONSTANTS in the 12abcde cluster** (12a/12b/12c were Booleans; line 12d is integer 0-4 with per-box addons $2,000 / $1,600 from `ReferenceData.java`); sets the stage for 12e\'s deeper reference-data documentation (2025 SALT cap, base standard deductions, etc.). **Cumulative through line 12d**: 36 lines audited (1a-1i + 1z + 2ab + 3abc + 4abc + 5abc + 6abcd + 7ab + 8 + 9 + 10 + 11a + 11b + 12a + 12b + 12c + **12d**); 357 audit issues closed total; backend 760/760 tests pass (unchanged — no new test; 12d #6 was frontend/CSV fix; 12d #4/#5/#7 were documentation breadcrumbs); MFS-guard cascade = 15 orchestrators (unchanged); knowledge-file naming convergence = 19 lines (unchanged); **5 documentation drift fixes** across workflow (11a #8 + 12a #8 doc-only + 12b/c/d #6 FUNCTIONAL; 3 FUNCTIONAL including FIRST TAX-YEAR drift). **ZERO new outstanding.md entries** in 12d walkthrough — **11 consecutive walkthroughs with zero new outstanding entries** (7a/7b/8/9/10/11a/11b/12a/12b/12c/12d). **Closure**: pure xlsx-flip observation; this row is the audit-trail anchor. **Looking ahead — only 12e remains**: line 12e (final deduction amount; multi-path branching — standard / itemized / disaster-loss-increased-standard) closes the 12a #4 seed → extend × 4 pattern + the 12abcde Verification log at 5 rows (LARGEST cluster log) + the sibling-mate cross-reference cascade at 4 (LARGEST in workflow). 12e is the anchor site for deferred documentation from 12a #7 + 12b #7 + 12c #7 + 12d #8.', 'XLS/computations/12d.xlsx audit-trail (this row); no additional code change beyond Issue #4 breadcrumb extension + Issue #5/#7 verified-correct breadcrumbs + Issue #6 functional drift fix', 'CLOSED — pure xlsx-flip. 4th sub-line in 12abcde cluster; THIRD cluster-level seed extension; documentation drift fix #5 (3rd FUNCTIONAL; FIRST TAX-YEAR); first numeric + reference-data audit in 12abcde cluster; line 12e closes the cluster next.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 100 }, { wch: 65 }, { wch: 85 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 12d Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.deductions.line12dBoxesCheckedCount', '(NOT directly to PDF — integer count is internal-only)', 'form-tax-return-1040.xlsx (used internally for addon arithmetic)', '★ CANONICAL line 12d output. Integer 0-4. Feeds computeStandardDeduction() addon paths.'],
  ['PDF c2_5[0] taxpayer age (POST 12d #6)', 'topmostSubform[0].Page2[0].c2_5[0] (taxpayer_born_before_1961)', 'form-tax-return-1040.xlsx (line 12d "You" age box; page 2)', '★ Frontend writes source Boolean (not the count) to canonical 2025-correct key. PRE-FIX: stale `*_1960` (2024 value).'],
  ['PDF c2_6[0] spouse age (POST 12d #6)', 'topmostSubform[0].Page2[0].c2_6[0] (spouse_born_before_1961)', 'form-tax-return-1040.xlsx (line 12d "Spouse" age box)', '★ Frontend writes source Boolean. PRE-FIX: stale `*_1960`.'],
  ['PDF c2_7[0] taxpayer blind', 'topmostSubform[0].Page2[0].c2_7[0] (taxpayer_blind)', 'form-tax-return-1040.xlsx (line 12d "You" blind box)', 'Unchanged by 12d #6 (no tax-year threshold).'],
  ['PDF c2_8[0] spouse blind', 'topmostSubform[0].Page2[0].c2_8[0] (spouse_blind)', 'form-tax-return-1040.xlsx (line 12d "Spouse" blind box)', 'Unchanged by 12d #6.'],
  [],
  ['PRIMARY DOWNSTREAM (★★)'],
  ['computeStandardDeduction() addon arithmetic — ★★ CRITICAL', '—', '—', '★★ Two paths: (A) dependent worksheet line 4b = count × per_box_addon (line12a TRUE); (B) age/blind chart = base + count × per_box_addon (line12a FALSE).'],
  ['Form 1040 line 12e (deduction amount)', '—', 'form-tax-return-1040.xlsx (line 12e cell)', 'Indirect via the addon contribution. Per future line 12e audit.'],
  ['Form 1040 line 14 / 15 / 16 / downstream', '—', '—', 'Indirect via line 12e.'],
  [],
  ['NOT IN OUTPUT (explicit exclusions)'],
  ['Line 12d does NOT affect line 13a/13b', '—', '—', 'Lines 13a/13b independent.'],
  ['Line 12d does NOT override line 12b/12c hard-zero', '—', '—', 'Per spec §5.2: when line 12b OR 12c TRUE → standard deduction = 0 regardless of line 12d. The hard-zero TRUMPS the addon.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 65 }, { wch: 85 }, { wch: 65 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUTPUT);
console.log('Wrote: ' + OUTPUT);
