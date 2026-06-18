// Generate C:\us-tax\XLS\computations\1f.xlsx — full computation map for Form 1040 Line 1f.
const XLSX = require('xlsx');

const OUT = String.raw`C:\us-tax\XLS\computations\1f.xlsx`;

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['Form 1040 Line 1f — Taxable Adoption Benefits (Form 8839 Part III Line 31)'],
  [],
  ['UI label on Form 1040', 'Taxable adoption benefits'],
  ['Semantic field name', 'line1f_employer_provided_adoption_benefits'],
  ['Output field path (computed)', 'form1040.income.adoptionBenefits'],
  ['Output PDF field (f1040)', 'topmostSubform[0].Page1[0].f1_52[0]'],
  ['Tax year', '2025'],
  ['Authoritative sources', '2025 Form 8839 (Cat. No. 22843L, dated 9/2/25); 2025 Instructions for Form 8839; IRC §137 (employer-provided adoption assistance exclusion); IRC §23 (adoption credit interaction); IRC §23(d) (eligible child); IRC §1372 (over-2% S corp owner)'],
  [],
  ['PLAIN-ENGLISH FORMULA'],
  ['Line 1f = Form 8839 Part III line 31 (taxable employer-provided adoption benefits).'],
  ['It is the residual of W-2 box 12 code T amounts (per child) that fails one of:'],
  ['  • per-child $17,280 exclusion limit (less prior-year usage), OR'],
  ['  • MAGI phaseout starting at $259,190 (full phase-out at $299,190), OR'],
  ['  • foreign-child finality rules (employer benefits before finality become taxable; finality-year benefits are excludable retroactively).'],
  [],
  ['Special branch: when the SPECIAL-NEEDS RULE applies (special-needs child + adoption final in 2025), L24 = full L21 (the remaining exclusion) regardless of L22 — even if no W-2 box 12 code T exists, the exclusion is allowed up to the per-child max.'],
  [],
  ['CRITICAL: Line 1f MAY BE NEGATIVE.'],
  ['When prior-year benefits become retroactively excludable in the foreign-child finality year, L30 (total excluded) > L23 (current-year benefits) → L31 negative → line 1f negative. addNonNull aggregation in line 1z must absorb signed amounts; downstream totals (line 9) likewise.'],
  [],
  ['STEP-BY-STEP COMPUTATION (Form 8839 Part III)'],
  ['Step', 'Operation', 'Formula', 'Notes'],
  [1, 'Aggregate W-2 box 12 code T', 'w2TotalBenefits = Σ W-2 box 12 code T amounts (across ALL W-2s in the database)', '★ Currently NOT SSN-filtered — see Code Validation #2 (same pattern as line 1e Issue #2). On MFS, spouse W-2 leaks.'],
  [2, 'Outer gates + form-required flags', 'hasBenefits = w2TotalBenefits > 0\\nhasAdoptionInputs = hasAnyAdoptionInputs(...)\\nIf hasBenefits AND !hasAdoptionInputs → ADOPTION_BENEFITS_FORM_REQUIRED (blocking)\\nIf !hasBenefits AND hasPartIIIInputs → ADOPTION_BENEFITS_W2_REQUIRED (blocking)\\nIf neither → return (null, null, null)', 'See Code Validation #11 — ADOPTION_BENEFITS_W2_REQUIRED blocks the special-needs off-W-2 path even though IRS rules allow it.'],
  [3, 'MFS gate', 'isMfs = filingStatus == "Married filing separately"\\nmfsLivedApartOrLegal = filingStatus.mfsOrHohLivedApartOrLegallySeparated == true\\nIf isMfs AND !mfsLivedApartOrLegal → ADOPTION_BENEFITS_MFS_EXCLUSION_DISALLOWED (blocking) + line 1f = w2TotalBenefits (full taxable, no exclusion).', 'IRC §137(f). Note the early-return bypasses Part III computation entirely.'],
  [4, 'Too-many-children advisory', 'If childEntryCount > 6 → ADOPTION_BENEFITS_TOO_MANY_CHILDREN (non-blocking)', 'Per IRS, attach a separate Form 8839 for each additional child. Compute runs on first 6.'],
  [5, 'Per-child eligibility checks', 'For each child:\\n  if foreignChild AND !adoptionFinal → ADOPTION_BENEFITS_FOREIGN_CHILD_NOT_FINAL (blocking); skip child\\n  if specialNeeds AND finalization-not-answered → ADOPTION_BENEFITS_FINALIZATION_REQUIRED (blocking)', 'Prior-year benefits for foreign adoptions go into wages; only finality-year exclusion path is implemented.'],
  [6, 'Per-child Part III line 19', 'L19[i] = $17,280 (ADOPTION_MAX_EXCLUSION_PER_CHILD)', 'Hard-coded per child. Shared-adoption $17,280-split with non-spouse not implemented (Code Validation #6).'],
  [7, 'Per-child Part III line 20', 'L20[i] = priorYearEmployerBenefitsByChild["child{i+1}PriorYearBenefits"] ?? 0', 'Prior-year employer benefits used against this child\'s lifetime exclusion'],
  [8, 'Per-child Part III line 21', 'L21[i] = max(0, L19[i] − L20[i])', 'Remaining exclusion available for this child'],
  [9, 'Per-child Part III line 22', 'L22[i] = currentYearBenefitsAllocation["child{i+1}Benefits2025"] ?? 0', 'Current-year benefits allocated to this child by user. Sum must match w2TotalBenefits — see Step 14.'],
  [10, 'Per-child Part III line 24 (the special-needs branch)', 'if specialNeeds AND adoptionFinal → L24[i] = L21[i] (full remaining exclusion)\\nelse → L24[i] = min(L21[i], L22[i])', 'IRC §137 special-needs rule: when the child is special-needs AND the adoption became final in the year, the full remaining exclusion is allowed even without an actual L22[i] amount on W-2 box 12 code T.'],
  [11, 'Return-level Part III line 23', 'L23 = w2TotalBenefits (when allowPartIII)', 'Total current-year benefits (matches W-2 box 12 code T total)'],
  [12, 'MAGI lookup + phaseout fraction', 'magi = adoption-expenses.imports.magiForAdoptionBenefitsExclusion\\nif magi == null → phaseoutFraction = null → use ZERO (full exclusion)\\nif magi ≤ $259,190 → phaseoutFraction = 0\\nif magi > $259,190 → phaseoutFraction = min(1.0, (magi − 259,190) / 40,000)', 'See Code Validation #9 — MAGI source unclear; deferred upstream computation.'],
  [13, 'Per-child Part III lines 28-29', 'L28[i] = L24[i] × phaseoutFraction\\nL29[i] = L24[i] − L28[i]', 'Per-child phaseout reduction + excluded amount'],
  [14, 'Allocation match check', 'If sum(L22[i]) ≠ w2TotalBenefits → ADOPTION_BENEFITS_ALLOCATION_MISMATCH (blocking)', 'User must allocate exactly the W-2 total across children. (Note: hidden conflict with special-needs off-W-2 path.)'],
  [15, 'Return-level Part III line 30 + line 31', 'L30 = Σ L29[i]\\nL31 = L23 − L30  (signed; may be negative)', 'L31 < 0 only in the foreign-child finality-year path where prior-year excludable amount exceeds current-year benefits.'],
  [16, 'Round + persist line 1f', 'line1f = roundMoney(L31)  (signed)\\nincome.setAdoptionBenefits(line1f)\\nWhen no benefits + no inputs: line1f = null', 'Whole-dollar rounding (HALF_UP). Negative amounts preserved; line 1z addNonNull handles signs.'],
  [],
  ['DECISION TREE — when does an entry contribute to line 1f?'],
  ['Branch', 'Filing status', 'W-2 box 12 code T', 'Special-needs path', 'Result'],
  ['No box 12 code T + no adoption form data', 'any', '0', 'no', 'line 1f = null (Form 8839 not generated)'],
  ['Box 12 code T present + form not completed', 'any', '> 0', 'no', 'BLOCKED — ADOPTION_BENEFITS_FORM_REQUIRED'],
  ['Adoption form completed but no W-2 + no special-needs final', 'any', '0', 'no', 'BLOCKED — ADOPTION_BENEFITS_W2_REQUIRED (Code Validation #11 — should allow special-needs off-W-2)'],
  ['Standard MFJ within all limits', 'MFJ', '≤ $17,280 × children', 'no', 'L24 = min(L21, L22), L29 = L24 (no phaseout), L30 = L23 → L31 = 0 → line 1f = 0 (or null)'],
  ['Benefits exceed per-child cap (any one child)', 'any non-MFS', '> $17,280', 'no', 'L24[i] capped at L21[i]; excess flows to L31 → line 1f positive'],
  ['MAGI in phaseout range', 'any non-MFS', 'any', 'no', 'phaseoutFraction > 0 → L28 > 0 → L29 < L24 → L31 = positive (smaller than full exclusion)'],
  ['MAGI > $299,190 (full phase-out)', 'any non-MFS', 'any', 'no', 'phaseoutFraction = 1.0 → L29 = 0 → line 1f = L23 (entire amount taxable)'],
  ['MFS without lived-apart/legal-separation exception', 'MFS', 'any', 'n/a', 'BLOCKED — ADOPTION_BENEFITS_MFS_EXCLUSION_DISALLOWED + line 1f = w2TotalBenefits'],
  ['MFS WITH separation exception (lived apart 6 months OR legally separated)', 'MFS', 'any', 'allowed', 'Normal computation proceeds (treated as unmarried)'],
  ['Special-needs child, adoption final, no W-2 code T', 'non-MFS', '0', 'L24=L21 (full exclusion)', 'L29 > 0 → L31 NEGATIVE → line 1f negative (excluded amount > current-year benefits)'],
  ['Foreign-child finality year + prior-year benefits ≥ current', 'non-MFS', 'any', 'no', 'L30 > L23 → L31 NEGATIVE → line 1f negative (prior-year exclusion catches up)'],
  ['Foreign child not yet final', 'non-MFS', 'any', 'no', 'BLOCKED — ADOPTION_BENEFITS_FOREIGN_CHILD_NOT_FINAL (per child)'],
  ['Allocation sum ≠ W-2 total', 'any', '> 0', 'either', 'BLOCKED — ADOPTION_BENEFITS_ALLOCATION_MISMATCH'],
];
const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 6 }, { wch: 50 }, { wch: 95 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUT FIELDS — Line 1f Computation'],
  [],
  ['#', 'Source Form (XLS)', 'Field Name', 'IRS Label / UI Question', 'Required?', 'How Used in Line 1f', 'Reference'],
  // Form-level
  [1, 'form-adoption-expenses.xlsx (Personal → Adoption Expenses)', 'claimsAdoptionExpensesOrBenefits', 'Did you adopt a child, receive employer adoption assistance, or pay qualified adoption expenses in 2025?', 'YES — outer gate (UI display)', 'UI form-rendering trigger; backend gate is hasAnyAdoptionInputs (positive-amount based).', 'form-adoption-expenses.xlsx row 1'],
  [2, 'form-adoption-expenses.xlsx', 'doesW2CodeTAmountLookCorrect', 'Does this total look correct?', 'OPTIONAL — informational confirmation', 'Display-only acknowledgment that the W-2 box 12 code T total reflects all employer adoption benefits.', 'form-adoption-expenses.xlsx row 3'],
  // Per-child
  [3, 'form-adoption-expenses.xlsx (per-child entry)', 'childFirstName / childLastName', 'Child first/last name', 'YES — display', 'Form 8839 Part I display + per-child allocation key.', 'form-adoption-expenses.xlsx rows 5-6'],
  [4, 'form-adoption-expenses.xlsx (per-child entry)', 'childYearOfBirth', 'Year of birth', 'OPTIONAL', 'Display + cross-check eligibility (under 18 unless disabled).', 'form-adoption-expenses.xlsx row 7'],
  [5, 'form-adoption-expenses.xlsx (per-child entry)', 'identifyingNumber', 'SSN / ATIN / ITIN', 'YES (per IRS)', 'Required for Form 8839 Part I.', 'form-adoption-expenses.xlsx row 8'],
  [6, 'form-adoption-expenses.xlsx (per-child entry)', 'bornBefore2008AndDisabled', 'Born before 2008 and disabled?', 'CONDITIONAL', 'IRS Part I line 1c checkbox. No direct Part III impact.', 'form-adoption-expenses.xlsx row 9'],
  [7, 'form-adoption-expenses.xlsx (per-child entry)', 'hasSpecialNeeds', 'Child with special needs?', 'CONDITIONAL — drives special-needs branch', 'Step 10: when true AND adoptionFinal=true → L24[i] = L21[i] (full remaining exclusion regardless of L22).', 'form-adoption-expenses.xlsx row 11'],
  [8, 'form-adoption-expenses.xlsx (per-child entry)', 'isForeignChild', 'Foreign child?', 'CONDITIONAL — finality gate', 'Step 5: when true AND !adoptionFinal → ADOPTION_BENEFITS_FOREIGN_CHILD_NOT_FINAL blocking flag; child skipped.', 'form-adoption-expenses.xlsx row 13'],
  [9, 'form-adoption-expenses.xlsx (per-child entry)', 'adoptionFinal2025OrEarlier', 'Was the adoption legally finalized in 2025 or earlier?', 'YES (per child)', 'Drives both special-needs branch (Step 10) and foreign-child finality gate (Step 5).', 'form-adoption-expenses.xlsx row 15'],
  [10, 'form-adoption-expenses.xlsx (per-child entry)', 'claimsAdoptionCredit', 'Are you claiming the adoption credit for this child?', 'OPTIONAL', 'Display only — does not affect line 1f. Drives Part II credit path (deferred for nonrefundable).', 'form-adoption-expenses.xlsx row 17'],
  // Per-child amount inputs
  [11, 'form-adoption-expenses.xlsx (Part II key map)', 'priorYearAdoptionCreditByChild["child{N}PriorYearCredit"]', 'Prior-year adoption credit', 'OPTIONAL', 'Drives Part II line 3 (prior-year credit reducer for L4). Does NOT affect Part III / line 1f.', 'form-adoption-expenses.xlsx row 19'],
  [12, 'form-adoption-expenses.xlsx (Part II key map)', 'qualifiedAdoptionExpensesByChild["child{N}QualifiedExpenses"]', 'Qualified adoption expenses', 'OPTIONAL', 'Drives Part II line 5 (credit base). Does NOT affect Part III / line 1f.', 'form-adoption-expenses.xlsx row 20'],
  [13, 'form-adoption-expenses.xlsx (Part III key map)', 'priorYearEmployerBenefitsByChild["child{N}PriorYearBenefits"]', 'Prior-year employer adoption benefits (per child)', 'CONDITIONAL', 'Step 7: directly populates L20[i] for the per-child remaining-exclusion calculation. Critical for foreign-child finality-year retroactive exclusion path.', 'form-adoption-expenses.xlsx row 21'],
  [14, 'form-adoption-expenses.xlsx (Part III key map)', 'currentYearBenefitsAllocation["child{N}Benefits2025"]', 'Employer benefits allocated to this child for 2025', 'YES — when W-2 box 12 code T > 0', 'Step 9: directly populates L22[i]. Sum across children must equal w2TotalBenefits or ADOPTION_BENEFITS_ALLOCATION_MISMATCH fires.', 'form-adoption-expenses.xlsx row 22'],
  [15, 'form-adoption-expenses.xlsx', 'moreThanThreeChildren', 'More than six eligible children?', 'OPTIONAL', 'Display only — does not gate compute. (Backend handles up to 6; >6 fires non-blocking ADOPTION_BENEFITS_TOO_MANY_CHILDREN.)', 'form-adoption-expenses.xlsx row 23'],
  [16, 'form-adoption-expenses.xlsx (Part II)', 'line15CreditCarryforward', 'Credit carried forward from prior years', 'OPTIONAL', 'Part II only — does not affect Part III / line 1f. Stored on Form8839 output.', 'form-adoption-expenses.xlsx row 25'],
  // Cross-form
  [17, 'form-w-2.xlsx (Statements → W-2)', 'box12Entries[].code = "T", box12Amount', 'W-2 box 12 code T — Adoption benefits', 'YES — primary input', 'Step 1: aggregated by sumW2AdoptionBenefits across all W-2s. **NOT SSN-filtered** — Code Validation #2 (same pattern as line 1e Issue #2 SSN-leak).', 'form-w-2.xlsx (Box 12 code T row)'],
  [18, 'form-filing-status.xlsx', 'filingStatus + mfsOrHohLivedApartOrLegallySeparated', 'Filing status + lived-apart/separation indicator', 'YES — MFS gate', 'Step 3: drives the IRC §137(f) joint-return requirement. MFS without exception → BLOCKED + line 1f = w2TotalBenefits.', 'form-filing-status.xlsx'],
  // Computed input
  [19, 'adoption-expenses.imports (computed/imported)', 'magiForAdoptionBenefitsExclusion', 'Modified AGI for adoption-benefits phaseout (Form 8839 line 25)', 'YES (when above threshold)', 'Step 12: drives the $259,190–$299,190 phaseout. **Source unclear in current code** — Code Validation #9.', 'dependencies/1f.md "Per-section inputs from imports"'],
];
const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 60 }, { wch: 60 }, { wch: 70 }, { wch: 30 }, { wch: 90 }, { wch: 40 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data / Constants ──────────────────────────────────
const constants = [
  ['REFERENCE DATA / CONSTANTS — Line 1f (Tax Year 2025)'],
  [],
  ['Constant', 'Value', 'Source', 'Used By', 'Notes for Other Tax Years'],
  ['ADOPTION_MAX_EXCLUSION_PER_CHILD', '$17,280', 'IRC §137(b)(1) (CPI-indexed); ReferenceData.java:37', 'Step 6 (per-child L19); Step P2 Part II line 2', 'Indexed annually for inflation. 2024: $16,810. 2026 TBD.'],
  ['ADOPTION_PHASEOUT_START', '$259,190', 'IRC §137(b)(2)(A) (CPI-indexed); ReferenceData.java:38', 'Step 12 (MAGI threshold)', '2024: $252,150.'],
  ['ADOPTION_PHASEOUT_RANGE', '$40,000', 'IRC §137(b)(2)(B) (NOT indexed); ReferenceData.java:39', 'Step 12 (phaseout denominator)', 'Statutory $40,000 — does NOT index. Phaseout end = ADOPTION_PHASEOUT_START + ADOPTION_PHASEOUT_RANGE = $299,190 for 2025.'],
  ['ADOPTION_LINE11B_REFUNDABLE_CAP', '$5,000', 'OBBBA 2025 statutory provision (Form 8839 Part II line 11b); ReferenceData.java:41', 'Part II line 11b refundable cap (does NOT affect line 1f directly)', 'New for 2025 under OBBBA. Refundable portion of adoption credit capped at $5,000/return.'],
  ['Phaseout end (computed)', '$299,190', 'ADOPTION_PHASEOUT_START + ADOPTION_PHASEOUT_RANGE', 'MAGI ≥ $299,190 → phaseoutFraction = 1.0 → full benefits taxable', '2024: $292,150.'],
  ['Phaseout precision', '4 decimal places (HALF_UP)', 'computeAdoptionPhaseoutFraction', 'Step 12 (phaseoutFraction division)', 'IRS Form 8839 instructions specify "at least three decimal places"; we use 4 (acceptable per IRS rounding).'],
  ['Eligible child age threshold', 'Under 18 OR physically/mentally incapable of self-care', 'IRC §23(d) (eligible child)', 'Form 8839 Part I bornBefore2008 checkbox', 'IRC §23(d)(2). Not a configurable constant per se.'],
  ['Maximum inline children', '6', 'Form 8839 layout (3 per main page + 3 overflow)', 'Step 4 + Step 5 loop limit', 'IRS instructions allow more via attached Forms 8839.'],
  [],
  ['Statutory references (IRS rules, not configurable constants):'],
  ['IRS rule', 'Citation', 'Notes'],
  ['Employer-provided adoption assistance exclusion', 'IRC §137 (general); IRC §137(a)(3) (special-needs rule); IRC §137(b)(2) (phaseout); IRC §137(f) (MFS joint-return)', 'Foundational authority for the entire Part III computation.'],
  ['Adoption credit (Part II — out of scope for line 1f)', 'IRC §23 (general); IRC §23(b)(2)(A) (MAGI phaseout)', 'Cannot claim both credit and exclusion for the SAME expenses.'],
  ['Eligible child', 'IRC §23(d)', 'Under 18 or incapable of self-care. Drives Part I rows.'],
  ['Special-needs definition', 'IRC §23(d)(3); 2025 Instructions for Form 8839', 'State must determine the child requires adoption assistance. Drives the L24 = L21 special-needs branch.'],
  ['Over-2% S corporation owner exclusion disallowance', 'IRC §1372', '**NOT IMPLEMENTED** — Code Validation #7. Disqualified shareholder cannot exclude.'],
  ['Foreign-child finality rule', 'IRS Pub 968 / 2025 Instructions for Form 8839', 'Pre-finality benefits are taxable (line 1f); finality-year retroactive exclusion arrives via Step 7 L20 + Step 15 negative L31.'],
  ['MFS joint-return restriction', 'IRC §137(f)(1); Form 8839 instructions', 'Exception: lived apart from spouse last 6 months OR legally separated under decree of divorce/separate maintenance.'],
  ['Same expenses cannot be excluded AND credited', 'IRC §137(d)(1) coordination rule', '**NOT ENFORCED** — when Part II credit is implemented, must subtract excluded amounts from credit base.'],
  [],
  ['Note: Line 1f is heavily reference-data-driven (4 ReferenceData constants). All current 2025 values match IRS-published 2025 amounts (see lines/1f.md §3 source citation).'],
];
const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 70 }, { wch: 60 }, { wch: 60 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Form 8839 (full) + Form 1040 line 30 refundable credit'],
  [],
  ['Output Field Path', 'Output Form (XLS)', 'Formula', 'Notes'],
  ['form8839 (full Part I + Part II + Part III object)', 'form-tax-return-8839.xlsx', 'Created when (hasBenefits OR hasAdoptionInputs). All Part III lines 19-31 populated; Part II 2-13 populated when MAGI available.', 'Form 8839 attached to return when generated. PDF: f8839 (3 children main page + overflow page for children 4-6).'],
  ['form8839.part3Line31TaxableBenefits', 'form-tax-return-8839.xlsx (line 31 cell)', 'See Step 15', '★ This is line 1f. Stored as form1040.income.adoptionBenefits.'],
  ['form1040.income.adoptionBenefits', 'form-tax-return-1040.xlsx (line 1f cell)', 'roundMoney(L31); preserves sign (may be negative)', 'See Negative Line 1f below.'],
  ['form8839.part2Line13RefundableAdoptionCredit', 'form-tax-return-8839.xlsx (line 13 cell)', 'min(line 11a, $5,000) summed across children', 'New OBBBA 2025 refundable portion. Wired separately to Form 1040 line 30 (refundable credit).'],
  [],
  ['CROSS-LINE INTERACTIONS'],
  ['Component', 'Affects', 'Notes'],
  ['Line 1f (taxable adoption benefits)', 'line 1z + line 9 (total income) + AGI', 'Standard income inclusion. **Signed** — may decrease totalWages on the foreign-child finality-year path.'],
  ['Line 1f → Pub 915 SS Worksheet', 'Worksheet 1 line 3 (via line 1z reference)', 'Indirect; same as other line 1 sub-lines.'],
  ['Form 8839 Part II refundable credit (line 13)', 'Form 1040 line 30 (refundable credit)', 'New OBBBA 2025 path. The refundable portion is independent of line 1f but shares Form 8839 Part II computation.'],
  ['Form 8839 Part II nonrefundable credit (line 18)', 'Schedule 3 line 6c (deferred)', 'Requires Credit Limit Worksheet; not yet implemented.'],
  ['§137 exclusion vs §23 credit coordination', 'Same-expense disallowance', '**NOT enforced**. When Part II credit is implemented, must verify expenses claimed for exclusion are excluded from credit base.'],
  [],
  ['NEGATIVE LINE 1F — UNIQUE TO THIS LINE'],
  ['Path that produces a negative line 1f', 'Mechanism'],
  ['Foreign-child finality year', 'Prior-year benefits (L20 > 0) reduce L21 → L24 unaffected when special-needs OR L22 covers; L29 may reflect EXCLUDED amount > L23. Then L31 = L23 − L30 < 0.'],
  ['Special-needs child + adoption final + no W-2 box 12 code T', 'L24[i] = L21[i] (full $17,280). L22[i] = 0. L23 = 0. L29[i] = $17,280. L30 = $17,280. L31 = 0 − $17,280 = −$17,280. Net effect: subtracts $17,280 from total wages.'],
  ['Wage-aggregation contract', 'addNonNull preserves signed BigDecimal addition. line 1z = ... + line 1f + ... handles negative line 1f correctly. Downstream (line 9, AGI) absorb the signed amount.'],
  [],
  ['THE BOX 12 CODE T / LINE 1F TRIANGLE'],
  ['Component', 'Source', 'Routes to'],
  ['Box 12 code T amount EXCLUDED via Part III (typical case)', 'W-2 box 12 code T', 'L23 = L30 → L31 = 0 → line 1f = 0 (or null)'],
  ['Box 12 code T amount EXCEEDING per-child cap or phaseout', 'W-2 box 12 code T', 'L31 > 0 → line 1f positive (taxable wages)'],
  ['Special-needs off-W-2 employer benefit', 'NOT supported in current code', 'Currently BLOCKED by ADOPTION_BENEFITS_W2_REQUIRED — Code Validation #11.'],
  ['Foreign-child finality-year retroactive exclusion', 'priorYearEmployerBenefitsByChild + adoptionFinal=true', 'L31 negative → line 1f reduces wages'],
];
const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 50 }, { wch: 100 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation / Blocking Flags ─────────────────────────────────
const flags = [
  ['VALIDATION RULES — Flags Emitted by Line 1f Pass'],
  [],
  ['Flag Code', 'Trigger Condition', 'Effect', 'Suppressed When', 'Blocking?'],
  ['ADOPTION_BENEFITS_FORM_REQUIRED', 'W-2 box 12 code T > 0 AND no adoption-expenses form data (hasAnyAdoptionInputs=false)', 'BLOCKING. User must complete adoption-expenses form so Part III can be computed.', 'Complete the adoption-expenses form OR remove W-2 box 12 code T amounts', 'YES'],
  ['ADOPTION_BENEFITS_W2_REQUIRED', 'No W-2 box 12 code T AND Part III inputs (priorYearEmployerBenefitsByChild OR currentYearBenefitsAllocation) present', 'BLOCKING. Inconsistent state — Part III inputs without source benefits.', 'Either remove the Part III inputs OR add the W-2 box 12 code T amount', 'YES — but see Code Validation #11 (over-blocks special-needs off-W-2 path)'],
  ['ADOPTION_BENEFITS_MFS_EXCLUSION_DISALLOWED', 'isMfs AND !mfsOrHohLivedApartOrLegallySeparated', 'BLOCKING. IRC §137(f) joint-return requirement; line 1f = w2TotalBenefits (full taxable).', 'Set mfsOrHohLivedApartOrLegallySeparated=true (if applicable) OR file jointly OR remove benefits', 'YES — but dependencies/1f.md says "Non-blocking" (DOC vs CODE inconsistency — Code Validation #3)'],
  ['ADOPTION_BENEFITS_TOO_MANY_CHILDREN', 'childEntries > 6', 'NON-BLOCKING. Compute runs on first 6 children. Filer must attach a separate Form 8839 for each additional child.', 'Reduce to ≤6 inline children', 'NO'],
  ['ADOPTION_BENEFITS_CHILD_REQUIRED', '(hasBenefits OR hasAdoptionInputs) AND childEntryCount = 0', 'BLOCKING. Cannot allocate benefits without at least one child row.', 'Add a child row OR remove benefit/expense data', 'YES'],
  ['ADOPTION_BENEFITS_FOREIGN_CHILD_NOT_FINAL', 'Per child: isForeignChild=true AND adoptionFinal=false', 'BLOCKING. Foreign adoption benefits cannot be excluded until finality year. Per child.', 'Mark adoptionFinal=true (if applicable in 2025) OR remove benefits for that child', 'YES'],
  ['ADOPTION_BENEFITS_FINALIZATION_REQUIRED', 'Per child: hasSpecialNeeds=true AND adoptionFinal2025OrEarlier is null (unanswered)', 'BLOCKING. Special-needs branch requires the finalization answer (true OR false).', 'Answer the finalization question for that child', 'YES'],
  ['ADOPTION_BENEFITS_ALLOCATION_MISMATCH', 'sum(L22[i]) ≠ w2TotalBenefits', 'BLOCKING. User-provided per-child allocation does not match the W-2 total.', 'Re-allocate so sum equals w2TotalBenefits exactly', 'YES'],
  [],
  ['NON-FLAG defensive behaviors (silent skip)'],
  ['Scenario', 'Behavior', 'Why not flagged'],
  ['data == null (form not saved)', 'Returns (null, null, null); no contribution', 'Normal — taxpayer simply has no adoption activity'],
  ['No W-2 box 12 code T AND no adoption inputs', 'Returns (null, null, null)', 'Outer gate'],
  ['MAGI not available', 'phaseoutFraction = ZERO; full exclusion applied', 'Conservative default — see Code Validation #12 (may over-claim if MAGI was supposed to be > threshold)'],
  ['Per-child claimsAdoptionCredit field', 'Display only; no compute impact on line 1f', 'Part II credit is separate computation path'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 52 }, { wch: 90 }, { wch: 60 }, { wch: 60 }, { wch: 12 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Reviewed against: TaxReturnComputeService.computeAdoptionBenefits() + buildAdoptionChildren() + computeAdoptionPhaseoutFraction() + sumW2AdoptionBenefits() (function-name reference; verified 2026-05-07).'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'TEST COVERAGE GAP — but not a bug', 'No unit tests exist for the negative-line-1f foreign-child finality-year path. Only `computesNegativeAdoptionBenefitsForSpecialNeeds` covers the special-needs negative path. The IRS spec explicitly allows L31 < 0 for foreign-child cases (lines/1f.md §8); foreign-child path has only the BLOCKING negative case test (`flagsAdoptionBenefitsForeignChildNotFinal`), not the SUCCESSFUL finality-year retroactive-exclusion case.', 'TaxReturnComputeServiceTest.java vs lines/1f.md §4.5 + §8', 'Add unit test `computesNegativeLine1fForForeignChildFinalityYear` — foreign child marked final 2025, $5,000 prior-year benefits in L20, $0 W-2 box 12 code T → L21 = $12,280, L24 = min($12,280, $0) = $0… wait, this requires special-needs branch to produce negative. Foreign-child path WITHOUT special-needs may not actually reach negative under current min(L21, L22) logic. Revisit spec §8 — foreign-child negative may require special-needs OR a different code branch we have not yet implemented.'],
  [2, 'BUG — REAL CORRECTNESS GAP', '`sumW2AdoptionBenefits(w2Entries)` aggregates ALL W-2 box 12 code T amounts across the database without SSN filtering. On MFS, the spouse files separately — their W-2 box 12 code T belongs on THEIR return, not the taxpayer\'s. Same pattern as line 1e Issue #2 (which we just closed 2026-05-07). Affects: `w2TotalBenefits` → L23 → L31 → line 1f. Also affects `ADOPTION_BENEFITS_MFS_EXCLUSION_DISALLOWED` early-return where `line1fMfs = w2TotalBenefits` directly leaks spouse box T.', 'computeAdoptionBenefits + sumW2AdoptionBenefits vs line 1e Issue #2 closure pattern', 'Mirror line 1e fix: create `sumW2AdoptionBenefitsForSsns(w2Entries, ssns...)` helper; pass `boolean isMfsReturn` from prepare() into computeAdoptionBenefits; SSN-filter to taxpayer-only on MFS, taxpayer + spouse on MFJ. Falls back to legacy unfiltered sum when neither SSN populated. Add unit test `mfsExcludesSpouseW2BoxTFromLine1f`.'],
  [3, 'DOC vs CODE — INCONSISTENCY', '`dependencies/1f.md` table row says `ADOPTION_BENEFITS_MFS_EXCLUSION_DISALLOWED` is "Non-blocking. Full W-2 code T amount treated as taxable." But the code emits it as `blocking=true` (line ~9685). One or the other is wrong.', 'TaxReturnComputeService.java line ~9685 vs dependencies/1f.md "Validation Inputs" table', 'Two options. (A) Match doc — change to non-blocking advisory + keep `line1fMfs = w2TotalBenefits` math. Allows MFS filers to see the impact without blocking the return. Matches IRS treatment (no exclusion → benefits taxable as wages — that\'s a valid filing). (B) Match code — update doc to "Blocking". Recommended: (A) — line 1f = full benefits is a valid return; user shouldn\'t be blocked. Mirrors line 1e Issue #1 pattern (we made the credit gate silent-skip, not blocking). Update test `adoptionBenefitsMfsWithoutExceptionIsFullyTaxable` if it asserts blocking.'],
  [4, 'KNOWLEDGE FILE MISSING', 'No `knowledge/line-1f-*.md` exists. Lines 1a/1b/1c/1d/1e all have detailed knowledge files; line 1f has lines/1f.md spec + dependencies/1f.md but no knowledge index.', 'C:\\us-tax\\knowledge\\ folder', 'Create knowledge/line-1f-employer-adoption-benefits.md mirroring knowledge/line-1e-dependent-care-benefits.md structure: §1 What is Line 1f, §2 Personal Form ID (single — adoption-expenses), §3 Form Sections + YAML Fields, §4 Backend Compute Logic (function-name convention), §5 Two-Pass / Single-Pass Architecture (line 1f is single-pass; Part II refundable runs in same pass when MAGI available), §6 Form 1040 Line 30 Refundable Credit Wire-Up, §7 Frontend Forms, §8 Unit + E2E Test Coverage, §9 Known Implementation Gaps, §10 Key Constants, with verification log footer. ~250-300 lines.'],
  [5, 'TEST COVERAGE GAP — MAGI PHASEOUT BOUNDARY', 'Existing tests cover MAGI < threshold and MAGI > ceiling, but not the boundary cases: MAGI == $259,190 (start, phaseoutFraction=0); MAGI == $299,190 (end, phaseoutFraction=1.0); MAGI = $279,190 (50% phaseout). The 50% test exists for the Part II refundable credit (`computesRefundableAdoptionCreditAtFiftyPercentPhaseout`), but not for Part III line 1f exclusion. Different code paths (Part II computes per-child, Part III also per-child, but tested separately).', 'TaxReturnComputeServiceTest.java vs Step 12 phaseout boundary cases', 'Add 3 unit tests: `line1fAtPhaseoutStartFullyExcluded` (MAGI = $259,190 → no phaseout); `line1fAtFiftyPercentPhaseout` (MAGI = $279,190 → 50% phaseout); `line1fAtCeilingFullyTaxable` (MAGI = $299,190 → 100% phaseout, line 1f = w2TotalBenefits).'],
  [6, 'NOT IMPLEMENTED — SHARED-ADOPTION L19 SPLIT', 'Per IRS instructions: when same eligible child is being adopted by the taxpayer AND another person who is NOT the spouse on a joint return, the $17,280 maximum must be divided in any way both parties agree. Currently every child gets the full $17,280 L19 — over-claim possible.', 'Step 6 + lines/1f.md §9.3 + dependencies/1f.md "Deferred / Not Yet Wired"', 'Already documented as deferred. Add a per-child UI input `sharedAdoptionL19Allocation` (default $17,280) + backend reads + uses min($17,280, allocation). Effort: small; rare scenario. Defer if low priority.'],
  [7, 'NOT IMPLEMENTED — IRC §1372 OVER-2% S CORP OWNER', 'IRC §1372 disallows the §137 exclusion for >2% S corporation shareholder-employees (treated as partners for fringe-benefit purposes). Currently no UI gate or backend check; high-percentage S corp owners would over-claim.', 'lines/1f.md §4.3 + dependencies/1f.md "Deferred / Not Yet Wired"', 'Already documented as deferred. Add per-W-2 boolean `isOver2PercentSCorpShareholder` to W-2 form OR per-return boolean on adoption-expenses form. When true → emit `ADOPTION_BENEFITS_S_CORP_OWNER_DISALLOWED` (blocking) + line 1f = w2TotalBenefits. Effort: ~30 minutes if revisited.'],
  [8, 'NOT ENFORCED — §137(d) SAME-EXPENSE COORDINATION', 'IRC §137(d) prohibits claiming both the §137 exclusion AND the §23 credit for the SAME expenses. Currently Part II credit and Part III exclusion are computed independently; nothing prevents the user from listing the same expense for both.', 'computeAdoptionBenefits Part II + Part III + lines/1f.md §4.4', 'When Part II nonrefundable credit is implemented (Schedule 3 line 6c), add a coordination check: if `qualifiedAdoptionExpensesByChild[N]` overlaps with `currentYearBenefitsAllocation[N]`, emit `ADOPTION_BENEFITS_DOUBLE_DIP` (blocking). Practical implementation: assume employer benefits are USED FIRST; subtract from credit base. See Form 8839 Part II line 5 instructions.'],
  [9, 'AMBIGUOUS MAGI SOURCE', '`magi = parseAmount(getMap(data, "imports").get("magiForAdoptionBenefitsExclusion"))` reads MAGI from `adoption-expenses.imports.magiForAdoptionBenefitsExclusion`. But `imports` is normally populated by backend pre-compute or upload extraction — for adoption MAGI specifically, no compute path appears to populate it. So phaseout effectively never fires for users above threshold (Code Validation #12).', 'computeAdoptionBenefits MAGI lookup vs dependencies/1f.md "Per-section inputs from imports"', 'Compute MAGI inline from form1040 outputs once available (similar to line 1e Phase 2 pattern): `magi = AGI + foreign-earned-income-exclusion + foreign-housing-exclusion + Puerto-Rico-income`. OR add a deferred-MAGI two-pass pattern matching line 1e (`finalizeForm8839PartII` after AGI). Currently HIGH risk of over-claim for above-threshold filers.'],
  [10, 'ALLOCATION MISMATCH — UX SHARP EDGE', '`ADOPTION_BENEFITS_ALLOCATION_MISMATCH` is BLOCKING. Test `adoptionBenefitsFourChildrenAllExcluded` shows the allocation must match exactly. But user UI does not currently auto-allocate; they must manually distribute amounts across children. Common UX trap when typing.', 'Step 14 + form-adoption-expenses.component.ts (UI)', 'Two options: (A) UI auto-distributes `currentYearBenefitsAllocation` evenly across children when not edited; user can override. (B) Backend allows ±$1 rounding tolerance. Recommended: (A) for usability, with backend strict-match retained.'],
  [11, 'OVER-BLOCKING — ADOPTION_BENEFITS_W2_REQUIRED', 'Currently fires when Part III inputs present without W-2 box 12 code T. But IRS allows the special-needs exception for off-W-2 employer benefits when (a) child is special-needs, (b) adoption finalized in 2025, (c) employer has a written qualified adoption assistance program — see lines/1f.md §4.2. Current code blocks this legitimate path.', 'Step 2 + lines/1f.md §4.2', 'Modify the gate to skip when there is at least one special-needs child with finalized adoption in 2025: `if (!hasBenefits && hasPartIIIInputs && !hasSpecialNeedsFinalChild) → flag fires`. Add new test `specialNeedsOffW2BenefitsAllowedWithoutCodeT`.'],
  [12, 'MAGI = NULL → SILENT FULL EXCLUSION', 'When `magi == null` (Code Validation #9), `phaseoutFractionForCalc = ZERO` → L28 = 0 → L29 = L24 → full exclusion applied. Above-threshold filers silently over-claim. No advisory.', 'Step 12 default-to-ZERO behavior', 'After fixing Code Validation #9 (compute MAGI inline), this becomes moot. As an interim defense: emit non-blocking advisory `ADOPTION_BENEFITS_MAGI_NOT_AVAILABLE` when MAGI is null AND benefits > 0, warning the user that phaseout is not applied.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 22 }, { wch: 80 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 1f (and Form 8839) Flow in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.adoptionBenefits', 'topmostSubform[0].Page1[0].f1_52[0] (line1f_employer_provided_adoption_benefits)', 'form-tax-return-1040.xlsx (line 1f cell)', 'Primary output — printed on Form 1040 line 1f. Stored only when non-null. Whole-dollar rounded. **MAY BE NEGATIVE** in foreign-child finality + special-needs paths.'],
  ['form1040.income.line1z', '(line 1z cell on f1040)', 'form-tax-return-1040.xlsx', 'Line 1f is one of 8 components: line1z = 1a + 1b + 1c + 1d + 1e + 1f + 1g + 1h (addNonNull, signed).'],
  ['form1040.income.totalIncome', '(line 9 cell on f1040)', 'form-tax-return-1040.xlsx', 'Line 1f → 1z → 9. Negative line 1f reduces totalWages and AGI — important for foreign-child finality cases.'],
  ['form8839 (full Part I + Part II + Part III)', 'topmostSubform[0].* on f8839', 'form-tax-return-8839.xlsx', 'Form 8839 attached when generated. PDF: `f8839` (3 children main page + overflow page for children 4-6 via `pdf-lib copyPages()`).'],
  ['form8839.part3Line31TaxableBenefits', '(Form 8839 line 31 cell)', 'form-tax-return-8839.xlsx', 'Set by Step 15. Mirrors line 1f. Sign preserved.'],
  ['form8839.part2Line13RefundableAdoptionCredit', '(Form 8839 line 13 cell)', 'form-tax-return-8839.xlsx', 'New OBBBA 2025 path. Set when MAGI available. Wired separately to Form 1040 line 30.'],
  [],
  ['DOWNSTREAM USE (read by other computations)'],
  ['Consumer', 'How it uses line 1f', 'Notes'],
  ['Form 1040 line 1z (total wages)', 'Direct addNonNull aggregation; signed', 'Line 1f bumps total wages (positive) or reduces them (negative).'],
  ['Form 1040 line 9 → AGI (line 11)', 'Indirect via 1z', 'Both positive and negative line 1f flow through correctly.'],
  ['Pub 915 SS Worksheet 1 line 3', 'Includes line 1f via line 1z reference', 'Same as other line 1 sub-lines.'],
  ['Form 1040 line 30 (refundable adoption credit)', 'Form 8839 Part II line 13 (separate from line 1f exclusion)', 'New OBBBA 2025; refundable portion of adoption credit. Independent of line 1f computation but shares Form 8839 Part II.'],
  ['Schedule 3 line 6c (nonrefundable adoption credit) — DEFERRED', 'Form 8839 Part II line 18 (Credit Limit Worksheet)', 'Not yet implemented; lines 14-18 deferred.'],
  ['EIC earned income (line 27a)', 'Includes line 1f as wages (signed)', 'IRC §32 earned income includes wages; signed line 1f flows correctly.'],
  ['Schedule 8812 ACTC earned income', 'Includes line 1f as wages (signed)', 'Same wages-side aggregation.'],
  [],
  ['NEGATIVE / NULL / ZERO CONTRACT'],
  ['line 1f value', 'Meaning'],
  ['null (field absent)', 'No W-2 box 12 code T AND no adoption-expenses inputs (or form not saved). Field omitted from Form 1040 entirely.'],
  ['BigDecimal.ZERO', 'Adoption-expenses form has data but Form 8839 Part III did not generate (e.g., hasAdoptionInputs but no benefits). Or L31 = 0 (full exclusion exactly matches benefits).'],
  ['Positive BigDecimal', 'Standard case — benefits exceed per-child cap, MAGI phaseout, or earned-income limit; OR MFS-no-exception (full benefits taxable).'],
  ['Negative BigDecimal', 'Foreign-child finality-year retroactive exclusion OR special-needs exclusion exceeding actual benefits. Reduces total wages.'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 60 }, { wch: 70 }, { wch: 50 }, { wch: 80 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUT);
console.log('Wrote: ' + OUT);
