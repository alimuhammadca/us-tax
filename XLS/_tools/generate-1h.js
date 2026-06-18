// Generate C:\us-tax\XLS\Computations\1h.xlsx — full computation map for Form 1040 Line 1h.
const XLSX = require('xlsx');

const OUT = String.raw`C:\us-tax\XLS\Computations\1h.xlsx`;

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['Form 1040 Line 1h — Other Earned Income (catch-all wages slot)'],
  [],
  ['UI label on Form 1040', 'Other earned income (see instructions)'],
  ['Semantic field name', 'line1h_other_earned_income'],
  ['Output field path (computed)', 'form1040.income.otherEarnedIncome'],
  ['Statement-text companion field', 'form1040.income.otherEarnedIncomeStatements (List<String>) — drives the inline write-in next to line 1h on the PDF'],
  ['Output PDF field (f1040 — amount)', 'topmostSubform[0].Page1[0].f1_55[0]   (semantic key: line1h_other_earned_income)'],
  ['Output PDF field (f1040 — write-in)', 'topmostSubform[0].Page1[0].f1_54[0]   (semantic key: line1h_statement_text)'],
  ['Tax year', '2025'],
  ['Authoritative sources',
    '2025 Form 1040 instructions for line 1h; ' +
    'IRC §402(g) (elective deferral limits), §401(k)/(403)(b)/457(b); ' +
    'SECURE 2.0 Act § 109 (super catch-up for ages 60–63); ' +
    'IRS Pub. 525 (Taxable and Nontaxable Income — strike benefits, corrective distributions); ' +
    'Form 1099-R distribution code definitions (Code 3 = disability; Code 8 = current-year corrective; Code P = prior-year corrective); ' +
    'Form 1099-MISC instructions (box 3 strike benefits); ' +
    'IRS Notice 2024-80 (2025 retirement plan limits); ' +
    'IRS Rev. Proc. 2024-40.'],
  [],
  ['PLAIN-ENGLISH FORMULA'],
  ['Line 1h = sum of four mutually-non-overlapping categories of earned income that belong in the wages section but do not fit lines 1a–1g:'],
  ['  Cat 1: Strike/lockout benefits (manual entry on the Other-earned-income personal form + auto-imported from 1099-MISC where box3IsStrikeBenefits=true)'],
  ['  Cat 2: Excess elective deferrals — W-2 box 12 amounts above the §402(g)/SIMPLE/457(b) annual limits (with regular and SECURE 2.0 enhanced catch-ups)'],
  ['  Cat 3: Disability pension wages — 1099-R distribution code 3 entries received BEFORE the plan minimum retirement age (taxable amount preferred, gross fallback)'],
  ['  Cat 4: Corrective distributions — 1099-R distribution code 8 (CURRENT-YEAR ONLY; code P prior-year is excluded). IRA/SEP/SIMPLE excluded. Suppressed when same 1099-R also has code 3 (disability path takes priority).'],
  [],
  ['line1hRaw = addNonNull(addNonNull(addNonNull(disabilityTotal, excessDeferrals), correctiveTotal), strikeTotal)'],
  ['line1h    = roundMoney(line1hRaw)   // whole-dollar HALF_UP rounding'],
  [],
  ['STEP-BY-STEP COMPUTATION'],
  ['Step', 'Operation', 'Formula', 'Notes'],
  [1, 'Outer load + identity', 'data = otherEarnedIncomeData ?? Map.of(); strike = data.strikeBenefits; disability = data.disabilityPensions; corrective = data.correctiveDistributions; taxpayerSsn = normalize(you.ssn); spouseSsn = normalize(spouse.ssn); taxpayerAge = computeAgeAtYearEnd(you.dateOfBirth); spouseAge = computeAgeAtYearEnd(spouse.dateOfBirth); rEntries = listEntriesWithData("1099-r"); miscEntries = listEntriesWithData("1099-misc")', 'No screening/gating boolean — line 1h compute always runs. Entries with no contributing data emit nothing. The personal form is single-document (NOT split per-spouse) — owner is recorded per disability/corrective array entry. Disability and corrective entry arrays are indexed by source1099RId.'],
  [2, 'Cat 1 — Strike/lockout benefits', 'strikeTotal = addNonNull(importedStrike, manualStrike)\n  manualStrike = parseAmount(strike.manualStrikeBenefitsAmount)\n  importedStrike = Σ over miscEntries where box3IsStrikeBenefits == true of parseAmount(otherIncomeAmount)', 'sumStrikeBenefitsFrom1099Misc walks 1099-MISC entries where the user flagged box 3 as strike benefits. addNonNull keeps null when both sources are null.'],
  [3, 'Cat 2 — Per-person deferral totals (W-2 box 12)', 'taxpayerTotals = computeDeferralTotalsForSsn(w2Entries, taxpayerSsn)\nspouseTotals  = computeDeferralTotalsForSsn(w2Entries, spouseSsn)\n  // each returns DeferralTotals(total402g, totalSimple, total457b) using sumW2Box12ByCodes filtered by employeeSSN', 'DEFERRAL_402G_CODES = {D,E,F} (pre-tax 401(k)/SARSEP/403(b)). DEFERRAL_SIMPLE_CODES = {S}. DEFERRAL_457B_CODES = {G}. Roth codes AA (Roth 401(k)) and BB (Roth 403(b)) are EXCLUDED — already in box 1 wages, not a deferral pool. Codes H (501(c)(18)(D)), Y (457(f)) are also out of scope here.'],
  [4, 'Cat 2 — Per-person excess deferrals (catch-up logic)', 'For each person:\n  catchupEligible = (age >= 50)\n  enhancedCatchup = (60 <= age <= 63)   // SECURE 2.0 §603\n  if catchupEligible: limit402g  += enhancedCatchup ? $11,250 : $7,500\n                       limitSimple += enhancedCatchup ? $5,250 : $3,500\n                       limit457b   += enhancedCatchup ? $11,250 : $7,500\n  excess = computeExcessAmount(total, limit) per pool — i.e. max(0, total − limit)\n  perPersonExcess = addNonNull(addNonNull(excess402g, excessSimple), excess457b)', '★ Catch-up applied ONLY when ssn is non-null and age is non-null. computeDeferralTotalsForSsn returns (null,null,null) when ssn is empty → that person contributes nothing. Each plan-type pool is excess-tested INDEPENDENTLY (the 402(g) limit does not pool with SIMPLE or 457(b)).'],
  [5, 'Cat 2 — Aggregate', 'excessDeferrals = addNonNull(taxpayerExcess, spouseExcess)', 'Sum the per-person excesses. Spouse contribution = null when no spouse SSN.'],
  [6, 'Cat 3 + Cat 4 — Walk 1099-R entries', 'For each rEntry in rEntries:\n  codes = parseDistributionCodes(rEntry.distributionCodes)   // splits comma/space, uppercase\n  if codes.isEmpty(): continue\n  recipientSsn = normalize(rEntry.recipientTIN)\n  owner = resolveOwnerFromRecipientSsn(recipientSsn, taxpayerSsn, spouseSsn)\n  selection = (disability/corrective).entries[entryId]   // user-entered per-1099-R override', 'Owner is auto-resolved from recipientTIN when it matches taxpayer or spouse SSN. When it matches neither, the user must select an owner via the personal form — otherwise blocking flag fires. resolveOwnerFromRecipientSsn returns "taxpayer", "spouse", or null.'],
  [7, 'Cat 3 — Disability pension (code 3)', 'if codes.contains("3"):\n  if owner == null:\n    owner = normalize(selection.owner)\n    if !hasText(owner): missingDisabilityOwner = true\n  belowMinAge = selection.isBelowPlanMinimumRetirementAge   // user must answer\n  if belowMinAge == null: missingDisabilityAge = true\n  if belowMinAge == true:\n    amount = parseAmount(rEntry.taxableAmountAmount) ?? parseAmount(rEntry.grossDistributionAmount)\n    disabilityTotal = addNonNull(disabilityTotal, amount)\n  else (belowMinAge == false): amount stays null → routed to lines 5a/5b instead', '★ Critical gate: BEFORE plan minimum retirement age → wages on line 1h. AT or AFTER → pension on lines 5a/5b. Box 2a (taxableAmountAmount) takes precedence over box 1 (grossDistributionAmount). belowMinAge=null is BLOCKING (LINE1H_DISABILITY_MIN_RETIREMENT_AGE_REQUIRED) — user must explicitly answer.'],
  [8, 'Cat 4 — Corrective distributions (code 8 only, current year)', 'hasCurrentCorrective = codes.contains("8")\nhasPriorCorrective    = codes.contains("P")\niraSepSimple = (rEntry.iraSepSimple == true)\nif (hasCurrentCorrective || hasPriorCorrective) AND !iraSepSimple AND !codes.contains("3"):\n  // codes("3") suppression prevents double-count when same 1099-R has both code 3 and code 8\n  if hasCurrentCorrective:\n    if owner == null:\n      owner = normalize(selection.owner)\n      if !hasText(owner): missingCorrectiveOwner = true\n    correctiveTotal = addNonNull(correctiveTotal, parseAmount(rEntry.taxableAmountAmount))\n  // code P is iterated/checked but its amount is NOT included on line 1h (prior-year correction)', '★ Code 8 = current-year corrective; code P = prior-year (excluded — would have been on prior-year line 1h). IRA/SEP/SIMPLE corrective distributions go through their own line 4a/4b workflow, not line 1h. The "!codes.contains(\\"3\\")" guard ensures combined-code-3+8 1099-Rs route ONLY through Cat 3 (disability) and not also Cat 4.'],
  [9, 'Emit blocking flags (per category)', 'if missingDisabilityOwner: emit LINE1H_DISABILITY_OWNER_REQUIRED (blocking=true)\nif missingDisabilityAge:    emit LINE1H_DISABILITY_MIN_RETIREMENT_AGE_REQUIRED (blocking=true)\nif missingCorrectiveOwner:  emit LINE1H_CORRECTIVE_OWNER_REQUIRED (blocking=true)', 'All three are BLOCKING — the return cannot be filed until the user answers the personal-form question for each unmatched 1099-R. See Sheet 5 for full flag matrix.'],
  [10, 'Aggregate line 1h', 'line1hRaw = addNonNull(addNonNull(addNonNull(disabilityTotal, excessDeferrals), correctiveTotal), strikeTotal)\nline1h    = roundMoney(line1hRaw)', 'addNonNull treats null as zero only when the other operand is non-null; when both are null the result is null. Whole-dollar HALF_UP rounding via roundMoney.'],
  [11, 'Build statement-text list', 'statements = []\nif (disabilityTotal != null && != 0): statements += "Disability pension wages"\nif (excessDeferrals != null && != 0): statements += "Excess elective deferrals"\nif (correctiveTotal != null && != 0): statements += "Corrective distributions (current year)"\nif (strikeTotal     != null && != 0): statements += "Strike/lockout benefits"\nreturn OtherEarnedIncomeComputation(line1h, statements)', '★ Drives form1040.income.otherEarnedIncomeStatements. Frontend joins these with "; " and either inline-writes them next to line 1h on the PDF (if they fit at 6pt within rect width − 3pt padding) or writes "Refer to attached sheet" + appends a separate statement page (UI Rule 44).'],
  [12, 'Persist on Income object', 'income.setOtherEarnedIncome(line1h)\nincome.setOtherEarnedIncomeStatements(statements)', 'Set even when null — the framework simply omits null fields from JSON output.'],
  [],
  ['MUTUAL EXCLUSION RULES (enforced by code)'],
  ['Rule', 'Implementation', 'Why'],
  ['Disability + corrective on same 1099-R', '`!codes.contains("3")` guard in Cat 4 block', 'Prevents double-counting when one 1099-R box 7 contains both 3 and 8'],
  ['Roth deferrals (codes AA/BB/EE) excluded from Cat 2', 'DEFERRAL_402G_CODES intentionally lists D, E, F only; Roth AA/BB/EE never enter the §402(g) excess pool', 'Per IRS 2025 line 1h instructions / Pub. 525: Roth elective deferrals are AFTER-TAX and already in W-2 box 1 — adding any Roth excess to line 1h would double-count. Line 1h adjustment is exclusively for the pre-tax portion of any §402(g) excess.'],
  ['IRA/SEP/SIMPLE corrective distributions excluded from Cat 4', '`!iraSepSimple` guard', 'IRA-type accounts use lines 4a/4b workflow + Form 8606; not line 1h'],
  ['Prior-year corrective (code P) excluded from Cat 4', 'Code P is iterated but its amount is NOT added to correctiveTotal', 'Code P represents a 2024 distribution corrected in 2025; belongs on the 2024 return, not 2025'],
  ['Post-min-retirement-age disability', 'belowMinAge=false → amount stays null', 'Pension treatment (lines 5a/5b) takes over; line 1h gets nothing'],
  ['Scholarship/fellowship grants', 'Not in Cat 1–4', 'IRS routes to Schedule 1 line 8r, not line 1h'],
  ['IRA distributions', 'iraSepSimple==true filter', 'Lines 4a/4b path'],
  [],
  ['DECISION TREE — what enters line 1h?'],
  ['Source', 'Condition', 'Effect on line 1h'],
  ['Manual strike entry', 'manualStrikeBenefitsAmount > 0', 'Adds to strikeTotal → line 1h'],
  ['1099-MISC with box 3 strike flag', 'box3IsStrikeBenefits == true AND otherIncomeAmount > 0', 'Adds to strikeTotal'],
  ['W-2 box 12 code D/E/F', '402(g) pool > $23,500 (or $31,000 / $34,750 with catch-up)', 'Excess routes to excessDeferrals'],
  ['W-2 box 12 code S', 'SIMPLE pool > $16,500 (or $20,000 / $21,750 with catch-up)', 'Excess routes to excessDeferrals'],
  ['W-2 box 12 code G', '457(b) pool > $23,500 (or $31,000 / $34,750 with catch-up)', 'Excess routes to excessDeferrals'],
  ['W-2 box 12 codes AA/BB (Roth)', 'Any amount', 'Excluded — never on line 1h'],
  ['1099-R code 3 (disability)', 'belowMinAge=true', 'Adds box 2a (or box 1 fallback) to disabilityTotal'],
  ['1099-R code 3 (disability)', 'belowMinAge=false', 'Routes to lines 5a/5b — nothing on 1h'],
  ['1099-R code 3 (disability)', 'belowMinAge=null', 'BLOCKING flag; nothing added until user answers'],
  ['1099-R code 8', 'iraSepSimple=false AND no code 3 on same entry', 'Adds box 2a to correctiveTotal'],
  ['1099-R code 8', 'iraSepSimple=true', 'Excluded — IRA path'],
  ['1099-R code 3 + code 8 (combined)', 'Disability path wins; corrective skipped', 'No double-count'],
  ['1099-R code P', 'Any', 'Excluded — prior-year amount'],
];
const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 6 }, { wch: 50 }, { wch: 105 }, { wch: 70 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUT FIELDS — Line 1h Computation'],
  [],
  ['#', 'Source Form (XLS)', 'Field Name', 'IRS Label / UI Question', 'Required?', 'How Used in Line 1h', 'Reference'],

  // ──── Personal form: other-earned-income ────
  [1, 'form-other-earned-income.xlsx (Income → Other earned income)', 'strikeBenefits.manualStrikeBenefitsAmount', 'Manual strike/lockout benefits not on a 1099-MISC', 'OPTIONAL', 'Step 2: added to importedStrike (1099-MISC sum) → strikeTotal → line 1h.', 'form-other-earned-income.xlsx row 10 (post-2026-05-10 regen); lines/1h.md §3 / §6'],
  [2, 'form-other-earned-income.xlsx', 'disabilityPensions.entries[].source1099RId', '(internal — links a disability override to a specific 1099-R entry)', 'YES per disability entry', 'Step 6: indexes the user-selected override map keyed by 1099-R entryId.', 'form-other-earned-income.xlsx row 16; YAML 1h-other-earned-income.yaml'],
  [3, 'form-other-earned-income.xlsx', 'disabilityPensions.entries[].owner', 'Whose 1099-R is this — taxpayer or spouse?', 'CONDITIONAL — required when recipientTIN does not match either SSN', 'Step 7: when auto-attribution fails, drives manual owner pick. Empty value → LINE1H_DISABILITY_OWNER_REQUIRED blocking flag.', 'form-other-earned-income.xlsx row 19; lines/1h.md §6 step 4'],
  [4, 'form-other-earned-income.xlsx', 'disabilityPensions.entries[].isBelowPlanMinimumRetirementAge', 'Were you below the plan\'s minimum retirement age when these payments were received?', 'YES per disability entry', 'Step 7: gates whether the amount is included. true → line 1h; false → lines 5a/5b; null → LINE1H_DISABILITY_MIN_RETIREMENT_AGE_REQUIRED blocking flag.', 'form-other-earned-income.xlsx row 23; lines/1h.md §6 step 4'],
  [5, 'form-other-earned-income.xlsx', 'correctiveDistributions.entries[].source1099RId', '(internal — links a corrective override to a specific 1099-R entry)', 'YES per corrective entry', 'Step 8: indexes the user-selected override map for code-8 1099-Rs. Same xlsx-export gap as #2.', 'YAML: 1h-other-earned-income.yaml; line-1h-other-earned-income.md §4'],
  [6, 'form-other-earned-income.xlsx', 'correctiveDistributions.entries[].owner', 'Whose 1099-R is this — taxpayer or spouse?', 'CONDITIONAL — required when recipientTIN does not match either SSN', 'Step 8: same as #3 but for corrective entries. Empty → LINE1H_CORRECTIVE_OWNER_REQUIRED blocking.', 'lines/1h.md §6 step 4'],

  // ──── W-2 (Cat 2 source) ────
  [7, 'form-w-2.xlsx (Statements → W-2)', 'box12Entries[].code', 'W-2 box 12 — letter code', 'YES per W-2 box 12 row used in Cat 2', 'Steps 3-4: filtered by DEFERRAL_402G_CODES = {D,E,F}, DEFERRAL_SIMPLE_CODES = {S}, DEFERRAL_457B_CODES = {G}. Roth AA/BB/EE intentionally skipped (already in box 1; see Code Validation #3).', 'form-w-2.xlsx (box 12 code rows); IRS W-2 instructions box 12 reference'],
  [8, 'form-w-2.xlsx', 'box12Entries[].box12Amount', 'W-2 box 12 — dollar amount', 'YES per W-2 box 12 row used in Cat 2', 'Steps 3-4: summed per pool by sumW2Box12ByCodes (SSN-filtered).', 'form-w-2.xlsx (box 12 amount rows)'],
  [9, 'form-w-2.xlsx', 'employeeSSN', 'W-2 box (a) — Employee SSN', 'YES — for SSN attribution', 'Step 3: drives sumW2Box12ByCodes filtering. Without correct employeeSSN, deferrals are misallocated between spouses.', 'form-w-2.xlsx (Box a row)'],

  // ──── 1099-R (Cat 3 + Cat 4 source) ────
  [10, 'form-1099-r.xlsx (Statements → 1099-R)', 'distributionCodes', '1099-R box 7 — distribution code(s) (e.g. "3", "8", "3,8", "P")', 'YES — drives Cat 3 / Cat 4 routing', 'Step 6: parsed into Set<String>; codes.contains("3") drives disability path; codes.contains("8") drives corrective; codes.contains("P") is iterated but excluded from amount (prior-year). Combined "3,8" routes to Cat 3 only.', 'form-1099-r.xlsx (Box 7 row); 1099-R Distribution Code reference'],
  [11, 'form-1099-r.xlsx', 'taxableAmountAmount', '1099-R box 2a — taxable amount', 'PREFERRED — primary amount input for both Cat 3 and Cat 4', 'Step 7: disability amount = taxableAmount ?? gross. Step 8: corrective amount = taxableAmount only (no fallback). Box 2b (taxableAmountNotDetermined) is not consumed by line 1h.', 'form-1099-r.xlsx (Box 2a row)'],
  [12, 'form-1099-r.xlsx', 'grossDistributionAmount', '1099-R box 1 — gross distribution', 'FALLBACK — used in Cat 3 only when box 2a is null', 'Step 7: disability fallback when box 2a is absent. Cat 4 (corrective) does NOT fall back to box 1 — corrective amounts must come from box 2a.', 'form-1099-r.xlsx (Box 1 row)'],
  [13, 'form-1099-r.xlsx', 'iraSepSimple', '1099-R box 7 — IRA/SEP/SIMPLE checkbox', 'YES for Cat 4 gating', 'Step 8: when true, the entry is excluded from Cat 4 (IRA/SEP/SIMPLE corrective distributions go through lines 4a/4b workflow).', 'form-1099-r.xlsx (IRA/SEP/SIMPLE row)'],
  [14, 'form-1099-r.xlsx', 'recipientTIN', '1099-R box (recipient) — TIN', 'YES — for SSN attribution', 'Step 6: feeds resolveOwnerFromRecipientSsn. Match → owner auto-resolves; mismatch → user must select via the personal form.', 'form-1099-r.xlsx (recipient TIN row)'],
  [15, 'form-1099-r.xlsx', 'entryId', '(internal — Firestore document ID for the 1099-R)', 'YES — for selection-map lookup', 'Step 6: cross-references disabilityPensions.entries[i].source1099RId / correctiveDistributions.entries[i].source1099RId.', 'StatementDataService entry layer'],

  // ──── 1099-MISC (Cat 1 source) ────
  [16, 'form-1099-misc.xlsx (Statements → 1099-MISC)', 'box3IsStrikeBenefits', 'Mark this 1099-MISC box 3 amount as strike/lockout benefits', 'YES for inclusion in Cat 1', 'Step 2: only entries flagged true contribute to importedStrike. UI helper checkbox; not a standard 1099-MISC field.', 'form-1099-misc.xlsx; sumStrikeBenefitsFrom1099Misc'],
  [17, 'form-1099-misc.xlsx', 'otherIncomeAmount', '1099-MISC box 3 — other income', 'YES when box3IsStrikeBenefits=true', 'Step 2: amount summed when the strike-flag is true. parseAmount handles formatting.', 'form-1099-misc.xlsx (Box 3 row)'],

  // ──── Identification ────
  [18, 'form-identification-taxpayer.xlsx', 'ssn', 'Taxpayer SSN (Box (a) on Form 1040)', 'YES — drives W-2 box 12 attribution + 1099-R recipientTIN match', 'Steps 3-6: drives sumW2Box12ByCodes filter for taxpayer 402(g)/SIMPLE/457(b) pools, and resolveOwnerFromRecipientSsn for 1099-R auto-attribution. Without taxpayer SSN, no Cat 2 contribution from taxpayer side.', 'form-identification-taxpayer.xlsx (ssn row)'],
  [19, 'form-identification-taxpayer.xlsx', 'dateOfBirth', 'Taxpayer date of birth', 'YES — drives age-at-year-end for catch-up logic', 'Step 4: computeAgeAtYearEnd(dateOfBirth) determines catchupEligible (≥50) and enhancedCatchupEligible (60–63). Without DOB, no catch-up applies → tighter limits → higher computed excess.', 'form-identification-taxpayer.xlsx (dateOfBirth row)'],
  [20, 'form-identification-spouse.xlsx', 'ssn', 'Spouse SSN (used on MFJ returns)', 'YES on MFJ — drives W-2 box 12 attribution + 1099-R recipientTIN match for spouse', 'Same as #18 but for spouse. On MFS the spouse SSN is nulled in computeOtherEarnedIncome (Code Validation #1 fix, applied 2026-05-10) so spouse-attributed deferrals/1099-Rs do not leak into the MFS taxpayer\'s line 1h.', 'form-identification-spouse.xlsx (ssn row)'],
  [21, 'form-identification-spouse.xlsx', 'dateOfBirth', 'Spouse date of birth', 'YES on MFJ — drives age-at-year-end for spouse catch-up', 'Step 4: same as #19 but for spouse.', 'form-identification-spouse.xlsx (dateOfBirth row)'],

  [],
  ['NOTE — `form-other-earned-income.xlsx` is COMPLETE as of 2026-05-10 (Issue #2 resolved)'],
  ['Pre-fix: the auto-generated xlsx exposed only 4 scalar rows (manualStrikeBenefitsAmount, owner, isBelowPlanMinimumRetirementAge x2). The dynamic-array sections disabilityPensions.entries[] and correctiveDistributions.entries[] were collapsed to top-level scalars and the read-only imported display fields (source1099RId, payerName, recipientTIN, box1GrossDistribution, box2aTaxableAmount, box7DistributionCode, disabilityPensionWageAmount, correctiveDistributionIncludedAmount) were missing entirely.'],
  ['Post-fix: generate-form-xlsx.js was rewritten YAML-first (118 input xlsx files regenerated 2026-05-10). When a matching YAML exists, sections are walked directly with multiplicity:multiple emitting per-entry rows tagged "<sectionName> (per entry)". Schema expanded from 5 to 9 columns (added Section, Field Path, Required, Read-Only, Help/Options). The line 1h xlsx now has 33 fields across 6 sections: imports, strikeBenefits, excessElectiveDeferrals, disabilityPensions (per entry), correctiveDistributions (per entry), line1hSummary.'],
  [],
  ['MISSING FIELDS / GAPS IDENTIFIED'],
  ['Field', 'Why it matters', 'Disposition'],
  ['retirementPlanType (per disability entry)', 'When 1099-R box 2a/box 1 is the gross/taxable amount, the user has no way to specify the plan type (401(k) vs 403(b) vs governmental 457 etc.) — only the disability flag matters for line 1h, but downstream EIC / SE consequences could differ.', 'Acceptable — line 1h is wages-only, so plan type does not affect 1h amount. Downstream impact is via lines 5a/5b only.'],
  ['Per-employer plan-type linkage for excess deferrals', 'A worker with two employers each within their own §402(g) limit but TOGETHER over $23,500 has an excess that the IRS expects on line 1h. The current code aggregates ALL W-2 box 12 amounts for the SSN — correct behavior for a single 402(g) limit per worker.', 'No gap — the §402(g) limit is per individual, not per employer. Code is correct.'],
  ['§401(a)(30) excess at single-employer level (rare)', 'Some employers cap their internal contributions independently of §402(g) — but the limit IS per individual. No correction needed.', 'No gap.'],
  ['Roth elective deferral excess detection', 'If a worker exceeds §402(g) including Roth (codes AA/BB), the excess is still taxable. Current code excludes AA/BB entirely from Cat 2 — undercounts excess in this rare case.', 'KNOWN — flagged in lines/1h.md §10 as a deferred edge case. Occurs when total of pre-tax + Roth elective deferrals > §402(g) limit AND the Roth portion is the marginal excess.'],
  ['Contributory amount in 1099-R box 5 (employee contribution recovery)', 'Disability pension wages on line 1h should typically be the FULL amount including box 5 recovery — but if box 2a is already net of basis, recovery of basis ends up excluded. Code uses box 2a as-is.', 'Acceptable — issuer is responsible for setting box 2a correctly.'],
  ['1099-MISC box 3 sub-classification beyond strike', 'box 3 covers many "other income" categories; only strike benefits route to line 1h. The UI checkbox is a manual flag.', 'Acceptable — IRS does not provide a sub-code for strike. User selects manually.'],
];
const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 60 }, { wch: 60 }, { wch: 70 }, { wch: 30 }, { wch: 90 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data / Constants ──────────────────────────────────
const constants = [
  ['REFERENCE DATA / CONSTANTS — Line 1h (Tax Year 2025)'],
  [],
  ['Constant', 'Value', 'Source', 'Used By', 'Notes for Other Tax Years'],

  // ──── §402(g) elective deferral pool ────
  ['ELECTIVE_DEFERRAL_402G_LIMIT', '$23,500', 'IRC §402(g)(1); ReferenceData.java:26; IRS Notice 2024-80', 'Step 4 — limit for codes D, E, F (pre-tax 401(k)/SARSEP/403(b))', '2024: $23,000. 2026 announced ~$24,500 (verify before TY 2026).'],
  ['ELECTIVE_DEFERRAL_402G_CATCHUP', '$7,500', 'IRC §414(v); ReferenceData.java:27; IRS Notice 2024-80', 'Step 4 — added to limit when ageAtYearEnd ≥ 50 AND not in 60–63 enhanced range', '2024: $7,500. Constant updated annually with COLA.'],
  ['ELECTIVE_DEFERRAL_402G_ENHANCED_CATCHUP', '$11,250', 'SECURE 2.0 Act §603; ReferenceData.java:29; IRS Notice 2024-80', 'Step 4 — overrides regular catch-up for ages 60–63 (greater of $10k or 150% of regular catch-up; for 2025, 150% × $7,500 = $11,250)', 'New for 2025. SECURE 2.0 §603 applies starting 2025; verify rules each year.'],

  // ──── SIMPLE IRA pool ────
  ['ELECTIVE_DEFERRAL_SIMPLE_LIMIT', '$16,500', 'IRC §408(p)(2)(E); ReferenceData.java:30; IRS Notice 2024-80', 'Step 4 — limit for code S (SIMPLE plans)', '2024: $16,000. SECURE 2.0 also created a 110% mini-bump for small employers ≤ 25 employees — NOT modeled here.'],
  ['ELECTIVE_DEFERRAL_SIMPLE_CATCHUP', '$3,500', 'IRC §414(v); ReferenceData.java:31; IRS Notice 2024-80', 'Step 4 — added to SIMPLE limit when age ≥ 50, not in 60–63', '2024: $3,500.'],
  ['ELECTIVE_DEFERRAL_SIMPLE_ENHANCED_CATCHUP', '$5,250', 'SECURE 2.0 Act §603; ReferenceData.java:32; IRS Notice 2024-80', 'Step 4 — overrides SIMPLE catch-up for ages 60–63 (greater of $5k or 150% × regular = 150% × $3,500 = $5,250)', 'New for 2025.'],

  // ──── §457(b) pool ────
  ['ELECTIVE_DEFERRAL_457B_LIMIT', '$23,500', 'IRC §457(e)(15); ReferenceData.java:33; IRS Notice 2024-80', 'Step 4 — limit for code G (governmental and tax-exempt §457(b))', '2024: $23,000. Same nominal value as §402(g); they are SEPARATE pools (a worker in BOTH a 401(k) and a 457(b) effectively gets two $23,500 limits).'],
  ['ELECTIVE_DEFERRAL_457B_CATCHUP', '$7,500', 'IRC §414(v); ReferenceData.java:34; IRS Notice 2024-80', 'Step 4 — added when age ≥ 50, not in 60–63', '2024: $7,500.'],
  ['ELECTIVE_DEFERRAL_457B_ENHANCED_CATCHUP', '$11,250', 'SECURE 2.0 Act §603; ReferenceData.java:35; IRS Notice 2024-80', 'Step 4 — overrides for ages 60–63', 'New for 2025.'],

  [],
  ['W-2 box 12 code maps (HARD-CODED in TaxReturnComputeService.java:114-116; not in ReferenceData)'],
  ['DEFERRAL_402G_CODES', 'Set.of("D", "E", "F")', 'TaxReturnComputeService.java:113', 'Step 3 — selects pre-tax §402(g) elective deferrals (Roth AA/BB INTENTIONALLY excluded — already in W-2 box 1)', 'D = §401(k) traditional; E = §403(b) traditional; F = §408(k)(6) salary-reduction SEP. Per IRS 2025 Form 1040 instructions for line 1h: line 1h adjustment puts back into wages what was excluded from box 1; Roth amounts are after-tax and already in box 1, so excluding them prevents double-counting.'],
  ['DEFERRAL_SIMPLE_CODES', 'Set.of("S")', 'TaxReturnComputeService.java:114', 'Step 3 — SIMPLE plan deferrals (pre-tax only)', 'S = §408(p) SIMPLE. Separate limit ($16,500 in 2025).'],
  ['DEFERRAL_457B_CODES', 'Set.of("G")', 'TaxReturnComputeService.java:115', 'Step 3 — pre-tax §457(b) deferrals (Roth gov-457(b) code EE INTENTIONALLY excluded — same reason as AA/BB)', 'G = §457(b) deferred compensation. (Note: code G can also indicate direct rollovers in 1099-R box 7 — different form, context-dependent.)'],
  ['Excluded Roth deferral codes', 'AA, BB (and EE for Roth §457(b))', '(intentionally not in any DEFERRAL_*_CODES set)', 'NOT used by line 1h — already in W-2 box 1', 'AA = Roth §401(k); BB = Roth §403(b); EE = Roth §457(b). Adding these to line 1h would double-count. See lines/1h.md §11 Discrepancy 3 and 1h.xlsx Code Validation #3 (verified-correct false positive 2026-05-10).'],
  [],
  ['Catch-up age thresholds'],
  ['Catch-up eligible age', 'age ≥ 50 at year-end', 'IRC §414(v); TaxReturnComputeService.java:11030', 'Step 4', 'Stable rule, unchanged.'],
  ['Enhanced (super) catch-up age range', '60 ≤ age ≤ 63 at year-end', 'SECURE 2.0 §603; TaxReturnComputeService.java:11032', 'Step 4', 'New for TY 2025+. SECURE 2.0 enacted 12/29/2022 (Pub. L. 117-328); §603 effective for plan years beginning after 12/31/2024.'],
  [],
  ['1099-R distribution code definitions (Box 7) — IRS-defined, stable'],
  ['Code 3', 'Disability', 'IRS 1099-R instructions', 'Step 7', 'Used for the disability-wages test. Recipient receiving payments due to disability under a plan.'],
  ['Code 8', 'Excess contributions plus earnings/excess deferrals (and/or earnings) taxable in this year', 'IRS 1099-R instructions', 'Step 8', 'Current-year corrective distribution.'],
  ['Code P', 'Excess contributions plus earnings/excess deferrals taxable in PRIOR year', 'IRS 1099-R instructions', 'Step 8 (excluded from amount)', 'Prior-year amount; amend prior-year return if applicable.'],
  ['Code G', 'Direct rollover and rollover contribution', 'IRS 1099-R instructions', '(NOT used by line 1h)', 'Direct rollovers are not income. Note: G can collide visually with W-2 box 12 G (§457(b)) — different forms, same letter.'],
  ['Code 1, 2, 7', 'Various distribution codes', 'IRS 1099-R instructions', '(NOT used by line 1h directly)', 'Code 1 = early dist. (Form 5329 in some cases); 2 = exception to early dist. tax; 7 = normal distribution. None route to line 1h.'],
  [],
  ['Statutory references (IRS rules, not configurable constants)'],
  ['IRS rule', 'Citation', 'Notes'],
  ['Strike benefits taxable as wages', 'IRC §61; Pub. 525', 'Strike pay from a union is taxable wages. If the worker received it as a "gift" rather than wage substitution, may be excluded — but the typical treatment is wages on line 1h.'],
  ['Excess elective deferrals are wages', 'IRC §402(g)(1)(A); Pub. 525 (Excess deferrals)', 'Amounts deferred above the §402(g) limit must be included in gross income for the deferral year — that is what line 1h captures. Failure to take corrective distribution by April 15 of the following year leads to double taxation when ultimately distributed.'],
  ['Disability pension wage characterization', 'IRC §105(c); Reg §1.105-1', 'Periodic disability pension payments received before the plan\'s minimum retirement age are TAXABLE WAGES for income tax purposes (line 1h). At/after the minimum retirement age they convert to PENSION income (line 5a/5b).'],
  ['Corrective distributions taxable in current year', 'Reg §1.402(g)-1(e)(8); Pub. 525', '"Excess deferrals" returned with allocable income BEFORE April 15 of the year following the deferral year are reported as taxable wages on the current-year return — that is the code-8 path. After April 15, the excess is taxable in the deferral year (code P) plus when finally distributed.'],
  ['IRA/SEP/SIMPLE corrective distribution exclusion', 'Form 1040 instructions for line 1h (2025)', 'IRA-side corrective distributions (excess IRA contributions returned with earnings) are reported on lines 4a/4b, NOT line 1h. The iraSepSimple checkbox on the 1099-R drives this routing.'],
  ['Plan minimum retirement age determination', 'Plan document; Reg §1.105-1; Pub. 525', 'Each plan defines its own minimum retirement age (often 55, 60, 62, or 65). User answers the question on the personal form — the application does not derive this.'],
  ['1099-MISC box 3 strike benefits identifier', 'Form 1099-MISC instructions', 'IRS does not provide a checkbox for "strike benefits"; the issuer just enters the amount in box 3. The recipient must self-identify and report on line 1h.'],
];
const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 30 }, { wch: 60 }, { wch: 70 }, { wch: 70 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Line 1h has NO directly-attached form/schedule (unlike line 1c → Form 4137 or line 1g → Form 8919)'],
  [],
  ['Output Field Path', 'Output Form (XLS)', 'Formula', 'Notes'],
  ['form1040.income.otherEarnedIncome', 'form-tax-return-1040.xlsx (line 1h amount cell)', '★ This is line 1h. = roundMoney(line1hRaw)', 'Primary output. Stored only when non-null. Whole-dollar HALF_UP rounding.'],
  ['form1040.income.otherEarnedIncomeStatements', 'form-tax-return-1040.xlsx (line 1h write-in / attached statement)', 'List<String> built in Step 11 of Main Computation', 'Drives the inline write-in next to line 1h on the PDF (semantic field line1h_statement_text). When the joined string fits at 6pt within rect width − 3pt padding → inline; otherwise → "Refer to attached sheet" inline + appended statement page (UI Rule 44).'],
  ['form1040.income.line1z (totalWages)', 'form-tax-return-1040.xlsx (line 1z cell)', 'addNonNull(...line1g, line1h)  // among 1a–1h', 'Line 1h is one of 8 components: line 1z = 1a + 1b + 1c + 1d + 1e + 1f + 1g + 1h.'],
  [],
  ['CROSS-LINE INTERACTIONS'],
  ['Component', 'Affects', 'Notes'],
  ['Line 1h → line 1z', 'Form 1040 line 1z (total wages)', 'Standard inclusion via addNonNull aggregation.'],
  ['Line 1h → line 9 → AGI (line 11a)', 'Form 1040 line 9 (total income) → line 11a (AGI)', 'Indirect via line 1z aggregation.'],
  ['Disability code 3 + belowMinAge=false', 'Form 1040 lines 5a / 5b (pension/annuity)', '★ Mutually exclusive with line 1h: when belowMinAge=false, the same 1099-R routes to lines 5a/5b instead of 1h. computePensionAnnuities path.'],
  ['Corrective distributions code P', 'Prior-year amended return (out of scope here)', '★ Code P amounts are EXCLUDED from current-year line 1h. Belong on the prior-year return — user must amend if they were missed.'],
  ['IRA corrective distributions', 'Form 1040 lines 4a / 4b', '★ iraSepSimple=true filter removes them from line 1h; they flow through the IRA workflow instead.'],
  ['Excess deferrals → Future taxation', 'Form 1099-R in subsequent year (information-only)', 'Excess deferrals NOT corrected by April 15 of the next year are taxed AGAIN when ultimately distributed — informational only; not modeled here.'],
  ['Line 1h (wages) → EIC earned income', 'Form 1040 line 27a (Earned Income Credit)', 'Line 1h flows into line 1z, which is part of EIC earned income (IRC §32). Disability wages and corrective distributions count; excess deferrals technically count too (they are wages by IRS definition).'],
  ['Line 1h → Schedule 8812 ACTC base', 'Schedule 8812 line 18a (earned income for ACTC)', 'Same wages-side aggregation.'],
  ['Line 1h → Form 2441 earned income', 'Form 2441 lines 4–5 (earned income for child/dep care)', 'Same wages-side aggregation; IRC §21.'],
  ['Line 1h does NOT trigger any FICA/SE tax', 'Schedule 2 (no link); Schedule SE (no link)', 'Unlike line 1c (Form 4137 → Schedule 2 line 5) or line 1g (Form 8919 → Schedule 2 line 6), line 1h amounts do NOT generate uncollected FICA. Disability pensions, excess deferrals, corrective distributions, and strike benefits already had FICA settled (or are exempt).'],
  ['Line 1h does NOT generate withholding routing', 'Schedule 3 / line 25 (withholding) — separate flow', '1099-R withholding goes to line 25b regardless of whether the gross amount lands on line 1h or 5b. 1099-MISC withholding (uncommon for strike benefits) similarly routes via line 25b.'],
  [],
  ['STATEMENT-TEXT BUILD (Step 11)'],
  ['Category contributing', 'Statement string', 'Inclusion rule'],
  ['Cat 3 (disability)', 'Disability pension wages', 'Included when disabilityTotal != null AND != 0'],
  ['Cat 2 (excess deferrals)', 'Excess elective deferrals', 'Included when excessDeferrals != null AND != 0'],
  ['Cat 4 (corrective)', 'Corrective distributions (current year)', 'Included when correctiveTotal != null AND != 0'],
  ['Cat 1 (strike)', 'Strike/lockout benefits', 'Included when strikeTotal != null AND != 0'],
  ['(no contribution)', '(empty list)', 'When line1h is null, statements list is empty too.'],
];
const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 50 }, { wch: 90 }, { wch: 80 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation / Blocking Flags ─────────────────────────────────
const flags = [
  ['VALIDATION RULES — Flags Emitted by Line 1h Pass'],
  [],
  ['Flag Code', 'Trigger Condition', 'Effect', 'Suppressed When', 'Blocking?'],
  ['LINE1H_DISABILITY_OWNER_REQUIRED', 'Per disability 1099-R (codes contains "3"): recipientTIN does not match either taxpayer or spouse SSN AND the user has not selected an owner via disabilityPensions.entries[].owner', 'BLOCKING. Return cannot be filed until the user assigns the 1099-R to a person.', 'Either the recipientTIN matches a taxpayer/spouse SSN, OR the user fills in the owner field on the personal form.', 'YES'],
  ['LINE1H_DISABILITY_MIN_RETIREMENT_AGE_REQUIRED', 'Per disability 1099-R (codes contains "3"): user has not answered isBelowPlanMinimumRetirementAge (the field is null in the personal form)', 'BLOCKING. Return cannot be filed; the answer determines whether the amount lands on line 1h (true) or lines 5a/5b (false).', 'User answers the question on the personal form (Yes or No).', 'YES'],
  ['LINE1H_CORRECTIVE_OWNER_REQUIRED', 'Per corrective 1099-R (codes contains "8" current year, NOT "3"): recipientTIN does not match either SSN AND no owner saved', 'BLOCKING. Return cannot be filed.', 'Either the recipientTIN matches, OR the user fills the owner field.', 'YES'],
  [],
  ['NON-FLAG defensive behaviors (silent skip — no flag emitted)'],
  ['Scenario', 'Behavior', 'Why not flagged'],
  ['otherEarnedIncomeData == null (form not saved at all)', 'data = Map.of() → all sub-paths null → no contributions; no flag', 'User simply has no Other-earned-income personal-form entries. Cat 2 (W-2 deferrals) still computes; Cat 1/3/4 default to null.'],
  ['rEntries empty', 'Disability/corrective loops do not run; no flag', 'No 1099-R statements on the return.'],
  ['miscEntries empty', 'importedStrike = null; falls back to manualStrike only; no flag', 'No 1099-MISC statements with strike flag.'],
  ['1099-R has empty distributionCodes', 'Loop continue; no flag', 'Malformed 1099-R; user must fix the statement, but compute does not block.'],
  ['1099-R has code 3 + manual selection.owner = "taxpayer" or "spouse"', 'Owner resolved; missingDisabilityOwner stays false', 'Normal user-driven attribution.'],
  ['1099-R has codes "3,8"', 'Cat 3 (disability) processes amount; Cat 4 skipped (codes.contains("3") guard)', 'Mutual-exclusion enforcement; no double-count.'],
  ['1099-R has code 3 with belowMinAge = false', 'No amount added to disabilityTotal; no flag (the question was answered)', 'Correctly routes to lines 5a/5b instead.'],
  ['1099-R has code P only (no 8)', 'Cat 4 enters the if-block but hasCurrentCorrective=false → no amount added; no flag', 'Code P amounts are not added to current-year line 1h.'],
  ['1099-R has iraSepSimple=true (any code)', 'Cat 4 outer guard fails; no amount added; no flag', 'IRA path takes over (lines 4a/4b).'],
  ['W-2 with box 12 code AA/BB (Roth)', 'sumW2Box12ByCodes ignores them (not in DEFERRAL_*_CODES); no flag', 'Roth deferrals not part of §402(g) excess test.'],
  ['Person has no SSN (e.g. spouse SSN absent)', 'computeDeferralTotalsForSsn returns (null,null,null); excess = null', 'No SSN → no W-2 attribution → no excess deferral computed.'],
  ['Person has no DOB', 'taxpayerAge / spouseAge = null; catchupEligible=false → tighter limits', 'Without DOB the system applies the strict §402(g)/SIMPLE/457(b) limits without any catch-up. May overstate excess for a 50+ filer who didn\'t supply DOB; mitigated by taxpayer/spouse identification form requiring DOB.'],
  ['Total deferrals ≤ limit (no excess)', 'computeExcessAmount returns BigDecimal.ZERO', 'No excess; line 1h gets nothing from Cat 2 for that person.'],
  ['1099-R box 2a missing AND box 1 missing on a code-3 entry', 'amount = null → disabilityTotal unchanged (addNonNull no-op); no flag', 'Amount-less disability entry contributes nothing — silent.'],
  ['1099-R box 2a missing on a code-8 entry', 'correctiveTotal contribution = null (no fallback to box 1 for Cat 4)', 'Code 8 strictly uses box 2a — silent zero.'],
  [],
  ['MISSING-W-2 or MISSING-STATEMENT GATING'],
  ['Note', 'Behavior', 'Reference'],
  ['Line 1h does NOT have an "I expect this income but no statements" gate (unlike line 1a employment-income gate, line 1c tip-income gate, line 5a pension gate, etc.).', 'No upload-confirmation flag for line 1h. The user is expected to upload the relevant W-2/1099-R/1099-MISC statements via the standard statement workflow; line 1h reads from whatever is on file.', 'lines/1h.md §6 implicit. There is no `hasOtherEarnedIncome` boolean gate on the personal form — compute always runs.'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 50 }, { wch: 90 }, { wch: 70 }, { wch: 60 }, { wch: 12 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Reviewed against: TaxReturnComputeService.computeOtherEarnedIncome() lines 10031-10179, computeDeferralTotalsForSsn lines 11013-11021, computeExcessDeferralsForPerson lines 11023-11048, sumStrikeBenefitsFrom1099Misc lines 11058-11075, ReferenceData.java lines 26-35 (verified 2026-05-10).'],
  ['LINE 1H AUDIT COMPLETE 2026-05-10 — All 10 issues closed. Outcomes: 1 defensive bug fix (#1 MFS guard cascade); 1 generator rewrite (#2 YAML-first xlsx generation, 118 forms regenerated); 3 verified-correct closures with breadcrumbs (#3 Roth false-positive verified, #7 code 3+8 disability-wins, #8 age boundaries, #10 Form 4852 indirect routing); 1 coverage-gap closure with +10 unit tests (#4); 1 knowledge-file rename (#5 line-1h-other-earned-income.md); 2 deferred-advisory closures with breadcrumbs + outstanding.md entries (#6 code-P-only 1099-R, #9 corrective box-2a missing); 1 layered closure with breadcrumbs + lock-in test (#9 includes new Cat-4 no-fallback test). Backend regression: 730/730 pass (was 719 — net +11 unit tests). Two deferred-advisory entries added to outstanding.md. Knowledge file renamed; one inline comment chain extended at TaxReturnComputeService.computeOtherEarnedIncome covering Issues #6/#7/#9; one comment extended at computeExcessDeferralsForPerson covering Issue #8.'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'DEFENSIVE GAP — MFS GUARD NOT IN ORCHESTRATOR — RESOLVED 2026-05-10', 'Pre-fix: computeOtherEarnedIncome read spouseSsn unconditionally and processed spouse-side excess deferrals + spouse-attributed 1099-R entries regardless of filing status. On MFS, spouse contributions could leak into the taxpayer\'s line 1h via two paths: (a) Cat 2 W-2 box 12 deferrals via spouse SSN attribution; (b) Cat 3/4 1099-R entries auto-resolved to owner="spouse" by recipientTIN. Same pattern as lines 1c #1, 1d #1, 1e #2, 1f #2, 1g #1. Post-fix: (1) added `boolean isMfsReturn` parameter to computeOtherEarnedIncome; (2) on MFS, null out spouseSsn and spouseAge — closes Cat 2 leak via existing computeDeferralTotalsForSsn null-check early-return; (3) added explicit `continue` filter at top of 1099-R loop on MFS when recipientTIN equals spouseSsnRaw — closes Cat 3/Cat 4 leaks (the selection-based `isBelowPlanMinimumRetirementAge` fallback would otherwise bypass owner attribution). Unit test `line1hMfsGuard_spouseW2DeferralsAndDisability1099RNotAggregatedOnMfs` added (verifies $1,000 taxpayer excess only, not $12,500). Full backend regression: 719/719 pass.', 'TaxReturnComputeService.computeOtherEarnedIncome (signature + body); call site in prepare() at line 373; TaxReturnComputeServiceTest', 'CLOSED. Single-guard cascade pattern matches the established convention.'],
  [2, 'DOC GAP — INPUT XLSX MISSING DYNAMIC ARRAY FIELDS — RESOLVED 2026-05-10', 'Pre-fix: `form-other-earned-income.xlsx` exposed only 4 scalar rows. The disability/corrective per-entry fields (source1099RId, owner, isBelowPlanMinimumRetirementAge) were collapsed to top-level scalars and read-only imported display fields (payerName, recipientTIN, box1GrossDistribution, box2aTaxableAmount, box7DistributionCode, disabilityPensionWageAmount, correctiveDistributionIncludedAmount) were missing entirely. Three root causes: (a) generator only walked [(ngModel)] bindings — *ngFor blocks were structurally invisible; (b) read-only displayed values ({{ record.payerName }} etc.) were not extracted; (c) xlsx schema had no column for "this field repeats per array entry". Post-fix: generate-form-xlsx.js was rewritten YAML-first. When a matching YAML exists in C:/us-tax/yamls/ (indexed by top-level `name` field), sections are walked directly with multiplicity:multiple emitting per-entry rows tagged "<sectionName> (per entry)". Schema expanded from 5 to 9 columns (added Section, Field Path, Required, Read-Only, Help/Options). All 118 input xlsx files regenerated 2026-05-10; 29 switched from template-scan to YAML-driven, 75 still use template-scan (their YAMLs use a nested-root layout deferred to a future audit). Line 1h xlsx now has 33 fields across 6 sections.', 'XLS/_tools/generate-form-xlsx.js (rewritten); XLS/input_forms/form-other-earned-income.xlsx (regenerated)', 'CLOSED. Side benefit: 28 other forms with matching flat-style YAMLs also produce more complete xlsx output. Line 1g remains template-scan because its YAML uses a nested-root layout (no top-level `name:` field) — its xlsx is correct via the existing template-scan path (with the p-select/p-datepicker regex extension from the line 1g audit).'],
  [3, 'AUDIT FALSE POSITIVE — ROTH DEFERRAL EXCESS NOT ON LINE 1H — VERIFIED CORRECT 2026-05-10', 'Original audit observation asserted that Roth excess deferrals (codes AA/BB/EE) should be added to line 1h via a combined §402(g) pool. RE-VERIFIED against IRS 2025 Form 1040 Instructions for line 1h, Pub. 525 (\"Excess deferrals\"), and lines/1h.md §7 + §11 (Discrepancy 3): the IRS rule is that ONLY the pre-tax portion of any §402(g) excess is the line 1h adjustment — the line 1h adjustment puts back into wages what was excluded from W-2 box 1. Roth deferrals are AFTER-TAX and are already in W-2 box 1, so adding ANY Roth excess to line 1h would DOUBLE-COUNT it. The original code (DEFERRAL_402G_CODES = {D,E,F} only, no Roth in pool) is IRS-correct. The audit author was mistaken about the substance of §402(g) treatment ("deferred, not deducted" mischaracterizes Roth: Roth IS deducted from take-home but IS taxed in box 1). Brief unsuccessful fix attempt was reverted same day after re-reading lines/1h.md §11 (\"do not include Roth excess elective deferrals on line 1h\"). Edge case noted but DEFERRED to a future spec-design pass: when plan administrator allocates excess to Roth side and a corrective distribution is later issued with code 8, the Cat 4 path captures it correctly — so there is no actual missing income on line 1h.', 'computeDeferralTotalsForSsn — DEFERRAL_402G_CODES = {D,E,F} only; lock-in test computesLine1hRothDeferrals_AA_BB_notCountedAsExcess', 'CLOSED — ORIGINAL CODE WAS CORRECT. No code change needed. Audit observation reframed as false positive. Lines/1h.md §11 Discrepancy 3 remains the authoritative rule.'],
  [4, 'TEST COVERAGE — KNOWN GAPS — RESOLVED 2026-05-10', 'Pre-fix: 7 audit-identified gaps in unit-test coverage for line 1h boundary and edge-case behavior. All gaps confirmed real after re-tracing the existing 7-test suite (computesLine1hDisability/ExcessElectiveDeferrals/age60to63/RothDeferrals/Corrective/Strike/Mfs). Post-fix: added 10 lock-in unit tests in TaxReturnComputeServiceTest after the line1hMfsGuard test — (a) age 49 boundary `_age49_noCatchup` ($24,500 D → $1,000 excess) + age 50 boundary `_age50_regularCatchup_noExcess` ($30,000 D → null); (b) age 63 inclusive boundary `_age63_lastEnhancedCatchup_noExcess` ($34,000 D → null) + age 64 revert-to-regular `_age64_revertsToRegularCatchup` ($32,000 D → $1,000 excess); (c) §457(b) `_codeG` ($25,000 G → $1,500) + SIMPLE `_codeS` ($18,000 S → $1,500); (d) MFJ aggregation `_MfjBothSpousesExcessInDifferentPools` (D $25k + G $25.5k → $3,500); (e) negative strike `_box3FlagFalse_notIncluded` ($500 with flag false → null); (f) Cat 3 fallback `_box2aEmpty_fallsBackToBox1` ($1,500 gross used when taxable absent); (g) `_storesZeroAndEmptyStatements` (locks in current 0-not-null storage with empty statements list when all inputs are zero — see secondary observation). Side observation noted during (g): when zero-amount inputs are present at every Cat path, line 1h stores BigDecimal.ZERO rather than null. This is a stylistic 0-vs-null choice (acceptable: addNonNull treats present zero as a real value; statements list still correctly empty via hasNonZeroAmount). Behavior locked in by the test; further normalization to null is a non-blocking style cleanup deferred to a future audit. Full backend regression: 729/729 pass (was 719 — net +10).', 'TaxReturnComputeServiceTest — 10 new tests added after line1hMfsGuard', 'CLOSED — coverage gaps (a)-(g) all closed. The E2E suite `line1h-other-earned-income.spec.ts` continues to cover strike, code-3 disability, age 60-63 enhanced catch-up, Roth AA exclusion, code-8 corrective, IRA exclusion, code-3+8 priority, MFJ spouse disability, post-min-age routing, and missing-owner blocking flag — comprehensive at the E2E level. Per-row boundary precision now also locked in at the unit-test level.'],
  [5, 'KNOWLEDGE FILE NAMING DEVIATION — RESOLVED 2026-05-10', 'Pre-fix: `knowledge/knowledge_line1h_other_earned_income.md` used the legacy `knowledge_line1h_` prefix (underscore form), while the line 1c–1g audit cycle established `line-<n>-<topic>.md` (hyphen form, no `knowledge_` prefix). Inconsistent naming made the line 1h knowledge file harder to discover among its 1c–1g siblings. Post-fix: file renamed to `knowledge/line-1h-other-earned-income.md`. The single Sheet 2 row reference in this generator (Inputs row 5) was updated to the new name; the file itself had no self-references. (The companion fix for line 1g — `knowledge_line1g_form_8919.md` → `line-1g-form-8919.md` — was already completed during the line 1g audit cycle on 2026-05-09.)', 'knowledge/ folder; XLS/_tools/generate-1h.js (Inputs Sheet 2 row 5)', 'CLOSED. Hyphen-no-prefix convention now consistent across line 1c–1h knowledge files. Other older lines (8, 9, 10–33, 3ab, 4abc) retain their legacy naming pending a sweep — out of scope for this audit.'],
  [6, 'CODE 8 + CODE P COMBINED — DEFERRED PER AUDIT + BREADCRUMB ADDED 2026-05-10', 'Pre-fix: 1099-R with ONLY code P (no code 8) enters the Cat 4 outer guard via `(hasCurrentCorrective || hasPriorCorrective)` but is silently skipped — no owner attribution, no amount added, no advisory flag. Behavior is MATHEMATICALLY CORRECT (code P represents excess deferrals taxable in a PRIOR year, not the current line 1h), but a confused user might wonder why their uploaded 1099-R produced nothing on line 1h. Post-fix: layered closure matching the line 1g #7+#8 breadcrumb pattern. (1) Six-line breadcrumb comment added at computeOtherEarnedIncome line 10132 explaining the intentional `||`, citing the audit ID, and warning future readers not to "fix" this by adding code-P amounts to line 1h (which would be a REAL bug). (2) Deferred enhancement section added to outstanding.md (top of file): "Line 1h — Code-P-Only 1099-R Advisory Flag (Deferred 2026-05-10)" with full re-implementation scope (~15-20 minutes if revisited). (3) Audit recommendation respected — no advisory flag emitted today. Affected user base is extremely small (excess prior-year deferral PLUS post-April-15 corrective PLUS uploading the 1099-R into the current year) and they typically need a prior-year amendment anyway.', 'computeOtherEarnedIncome line 10132 (breadcrumb); outstanding.md (deferred enhancement entry)', 'CLOSED via deferred-enhancement entry. Behavior is correct as-is; advisory flag re-implementation tracked in outstanding.md.'],
  [7, 'CODE 3 + CODE 8 COMBINATION — DISABILITY WINS — VERIFIED CORRECT 2026-05-10', 'Audit observation re-verified: when a 1099-R has codes "3,8", Cat 3 (disability) at line 10108 processes via `if (codes.contains("3"))`, and Cat 4 outer guard at line 10138 includes `&& !codes.contains("3")` — so the corrective path is skipped exclusively. The amount goes through the disability path once. Behavior matches lines/1h.md §7/§8 and the existing comment block at lines 10132-10133. Lock-in test: `prioritizesDisabilityWhenCodesInclude3And8` (TaxReturnComputeServiceTest near line 9001) asserts taxable=$1,200 on a 1099-R coded "3 8" → line 1h = $1,200 with statement "Disability pension wages" only (no corrective statement). Audit-revisited-as-verified-and-documented closure: breadcrumb comment extended at line 10132 to cite this audit ID + verification date, preventing a future reviewer from re-flagging. No code change, no test change, no double-count.', 'computeOtherEarnedIncome line 10108 (Cat 3 first) + line 10138 (Cat 4 `!codes.contains("3")` guard); test prioritizesDisabilityWhenCodesInclude3And8', 'CLOSED — verified correct, no fix needed. Breadcrumb comment locks in the audit trail.'],
  [8, 'AGE BOUNDARY — REGULAR vs ENHANCED CATCH-UP — VERIFIED CORRECT 2026-05-10', 'Audit observation re-verified at computeExcessDeferralsForPerson line 11053 (`catchupEligible = ageAtYearEnd != null && ageAtYearEnd >= 50`) and line 11055 (`enhancedCatchupEligible = ageAtYearEnd != null && ageAtYearEnd >= 60 && ageAtYearEnd <= 63`). Both boundaries correct INCLUSIVE per SECURE 2.0 §603. Five lock-in unit tests now in place (four added in Issue #4 closure earlier today plus the pre-existing age-62 mid-range test): _age49_noCatchup → no catch-up applied; _age50_regularCatchup_noExcess → regular catch-up; _age60to63_usesEnhancedCatchup (age 62) → enhanced; _age63_lastEnhancedCatchup_noExcess → enhanced (inclusive upper); _age64_revertsToRegularCatchup → reverts to regular. Audit-revisited-as-verified-and-documented closure: breadcrumb comment extended at line 11054 to cite this audit ID + verification date and enumerate the four boundary lock-in tests.', 'computeExcessDeferralsForPerson lines 11053-11055; tests _age49/_age50/_age60to63/_age63/_age64', 'CLOSED — verified correct, no fix needed. Boundary tests provide comprehensive lock-in.'],
  [9, 'TAXABLE AMOUNT FALLBACK — Cat 3 vs Cat 4 ASYMMETRY — DEFERRED PER AUDIT + BREADCRUMBS + LOCK-IN TEST 2026-05-10', 'Pre-fix: Cat 3 (disability) falls back to box 1 (gross) when box 2a (taxableAmountAmount) is null; Cat 4 (corrective) does NOT fall back. The asymmetry is intentional — per IRS 1099-R instructions, issuers MUST populate box 2a for code-8 corrective distributions because the corrective amount must be split from any non-taxable basis. But the asymmetric design was undocumented and a future reader could "fix" Cat 4 by mirroring Cat 3, introducing a real bug (routing basis to line 1h). Post-fix: layered closure matching the line 1g #7+#8 + line 1h #6 patterns. (1) Three-line breadcrumb comment added at Cat 3 (line ~10122) explaining the deliberate box-1 fallback for fully-taxable disability wages. (2) Eight-line breadcrumb comment added at Cat 4 (line ~10149) citing IRS 1099-R instructions, warning future readers NOT to mirror Cat 3, and pointing at the deferred advisory. (3) New lock-in unit test `computesLine1hCorrectiveDistribution_box2aEmpty_excludedNoFallback` — code-8 1099-R with null taxableAmount + gross=$1,500 → line 1h null (proves no fallback). (4) Deferred enhancement section added to outstanding.md (top): "Line 1h — Corrective Distribution Box 2a Missing Advisory (Deferred 2026-05-10)" with full re-implementation scope (~15-20 minutes if revisited). Audit recommendation respected — no advisory flag emitted today. Backend regression: 730/730 pass (was 729 — net +1).', 'computeOtherEarnedIncome lines ~10122 (Cat 3 breadcrumb) and ~10149 (Cat 4 breadcrumb); test computesLine1hCorrectiveDistribution_box2aEmpty_excludedNoFallback; outstanding.md (deferred enhancement entry)', 'CLOSED via deferred-enhancement entry. Asymmetry now documented at both call sites + lock-in test prevents accidental "fixes". Advisory flag re-implementation tracked in outstanding.md.'],
  [10, 'VERIFICATION — FORM 4852 SUBSTITUTE WAGES NOT WIRED TO LINE 1H — VERIFIED CORRECT 2026-05-10', 'Audit observation re-verified two ways. (1) Code side: grep of TaxReturnComputeService.java for "4852" returned matches only in the W-2 substitute path (computeForm4852 method, validation calls, output assembly) — Form 4852 has ZERO references inside computeOtherEarnedIncome or its helpers. (2) Spec side: grep of lines/1h.md for "4852" returned no matches — the spec does not actually mention Form 4852 (the original audit framing implied otherwise but was incorrect). Both parts collapse to: nothing to fix because nothing inappropriate exists. Form 4852 functions as a W-2 SUBSTITUTE — when a user files it, its amounts populate the same box 1 / box 12 fields the missing W-2 would have, and those flow to whichever Form 1040 line they belong to (line 1a wages, or line 1h via box 12 deferral codes D/E/F/G/S, etc.) through the standard W-2 ingest paths. No line-1h-specific Form 4852 wiring is appropriate. Closure: pure documentation flip — no code change, no test change, no outstanding.md entry. The audit row itself serves as the audit trail.', 'TaxReturnComputeService.java (Form 4852 absent from computeOtherEarnedIncome); lines/1h.md (no Form 4852 references)', 'CLOSED — verified correct, no fix needed. Form 4852 amounts reach line 1h only indirectly via the standard W-2 box-12 ingest path, which is the IRS-prescribed treatment.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 28 }, { wch: 95 }, { wch: 60 }, { wch: 95 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 1h Flows in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.otherEarnedIncome', 'topmostSubform[0].Page1[0].f1_55[0] (line1h_other_earned_income)', 'form-tax-return-1040.xlsx (line 1h cell)', '★ Primary output — printed on Form 1040 line 1h. Stored only when non-null. Whole-dollar HALF_UP rounding.'],
  ['form1040.income.otherEarnedIncomeStatements', 'topmostSubform[0].Page1[0].f1_54[0] (line1h_statement_text) + optional appended page', 'form-tax-return-1040.xlsx (write-in cell)', 'Joined with "; " on the frontend. Fit-checked at 6pt vs available rect width − 3pt padding. If fits → inline; else "Refer to attached sheet" + appendLine1hStatementPage. UI Rule 44 (write-in description overflow).'],
  ['form1040.income.line1z (totalWages)', '(line 1z cell on f1040)', 'form-tax-return-1040.xlsx', 'Line 1h is one of 8 components: line 1z = 1a + 1b + 1c + 1d + 1e + 1f + 1g + 1h.'],
  ['form1040.income.totalIncome (line 9)', '(line 9 cell on f1040)', 'form-tax-return-1040.xlsx', 'Line 1h → 1z → 9 → AGI (line 11a).'],
  [],
  ['DOWNSTREAM USE (read by other computations)'],
  ['Consumer', 'How it uses line 1h', 'Notes'],
  ['Form 1040 line 1z (total wages)', 'Direct addNonNull aggregation', 'Line 1h bumps total wages.'],
  ['Form 1040 line 9 → AGI (line 11a)', 'Indirect via line 1z', 'Standard income aggregation.'],
  ['Pub. 915 Social Security Worksheet 1 line 3', 'Includes line 1h via line 1z reference', 'Same as other line 1 sub-lines. Disability pension wages count toward provisional income for SS taxability.'],
  ['EIC earned income (line 27a)', 'Includes line 1h as wages (via line 1z)', 'IRC §32 earned income includes wages. Disability + corrective + excess deferrals + strike = wages by IRS definition.'],
  ['Schedule 8812 ACTC earned income (line 18a)', 'Includes line 1h as wages', 'Same wages-side aggregation.'],
  ['Form 2441 (dependent care) earned income', 'Includes line 1h as wages (via earnedIncomeForLine26)', 'IRC §21 earned income.'],
  ['Schedule 1-A line 38 (additional deductions)', 'No direct interaction', 'Schedule 1-A scope is tips + overtime + car loan + senior — not line 1h categories.'],
  ['Form 8959 (Additional Medicare Tax)', 'No direct interaction', 'Line 1h categories are NOT Medicare wages (already settled or exempt). Unlike line 1c/1g, line 1h does not feed Form 8959 line 3.'],
  ['Form 6251 (AMT)', 'Indirect via AGI', 'Standard.'],
  ['Schedule 2', 'No direct interaction', 'Line 1h does NOT generate uncollected FICA tax. Disability pensions had FICA settled at the original wage payment; corrective distributions are excess deferrals returned (not new wages); excess deferrals were already W-2 box 1 (FICA paid); strike benefits are wages from the union (not the employer — different FICA calculus).'],
  [],
  ['NEGATIVE / NULL CONTRACT'],
  ['line 1h value', 'Meaning'],
  ['null (field absent)', 'No category contributes. All four sub-totals (disability, excess, corrective, strike) are null. Most common case.'],
  ['BigDecimal.ZERO', 'Edge case — at least one category was triggered (entry exists) but its amount resolved to zero (e.g. taxable amount = 0 on a code-3 1099-R; or excess deferrals = exactly the limit). Possible.'],
  ['Positive BigDecimal', 'Standard case — at least one category contributes a positive amount.'],
  ['Negative BigDecimal', 'IMPOSSIBLE under current logic: parseAmount may return negative on a malformed input, but max(0, ...) is implicit via the additive combine pattern. excessDeferrals is forced ≥ 0 by computeExcessAmount; disability/corrective amounts come from box 2a/box 1 (issuer-set, not negative); strike amounts come from user-entered or 1099-MISC box 3 amounts (not negative by UI validation).'],
  [],
  ['STATEMENT-TEXT EXAMPLES (otherEarnedIncomeStatements)'],
  ['Scenario', 'Statements list', 'PDF rendering'],
  ['Only excess deferrals', '["Excess elective deferrals"]', 'Inline write-in: "Excess elective deferrals" (~28 chars at 6pt — fits)'],
  ['Disability + strike', '["Disability pension wages", "Strike/lockout benefits"]', 'Joined: "Disability pension wages; Strike/lockout benefits" — likely fits inline at 6pt'],
  ['All four categories', '["Disability pension wages", "Excess elective deferrals", "Corrective distributions (current year)", "Strike/lockout benefits"]', 'Joined string ~115 chars at 6pt — likely OVERFLOWS the rect → "Refer to attached sheet" inline + appended page with all four labels.'],
  ['No categories (line 1h null)', '[]', 'No write-in; line 1h amount cell is blank.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 60 }, { wch: 70 }, { wch: 50 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUT);
console.log('Wrote: ' + OUT);
