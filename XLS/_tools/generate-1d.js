// Generate C:\us-tax\XLS\computations\1d.xlsx — full computation map for Form 1040 Line 1d.
const XLSX = require('xlsx');

const OUT = String.raw`C:\us-tax\XLS\computations\1d.xlsx`;

const wb = XLSX.utils.book_new();

// ─── Sheet 1: Main Computation ────────────────────────────────────────────
const main = [
  ['Form 1040 Line 1d — Medicaid Waiver Payments Not Reported on Form(s) W-2, Box 1'],
  [],
  ['UI label on Form 1040', 'Medicaid waiver payments not reported on Form(s) W-2, box 1'],
  ['Semantic field name', 'line1d_medicaid_waiver_payments'],
  ['Output field path (computed)', 'form1040.income.medicaidWaiverPayments'],
  ['Output PDF field (f1040)', 'topmostSubform[0].Page1[0].f1_50[0]'],
  ['Tax year', '2025'],
  ['Authoritative sources', '2025 Instructions for Form 1040 line 1d; IRS Notice 2014-7; IRC §131 (foster care payments); 2024+ W-2 reporting requirement (box 12 code II)'],
  [],
  ['PLAIN-ENGLISH FORMULA'],
  ['Line 1d = (per-person) sum of taxable Medicaid waiver payments NOT in W-2 box 1,'],
  ['         PLUS — only when the user makes the all-or-none earned-income election —'],
  ['         the sum of nontaxable (Notice 2014-7 qualified) payments NOT in W-2 box 1.'],
  ['         Aggregated across taxpayer + spouse on MFJ.'],
  [],
  ['         The earned-income election is the user choosing to count nontaxable Medicaid waiver'],
  ['         payments toward EIC / ACTC. When elected, the gross amount goes on line 1d AND'],
  ['         simultaneously a NEGATIVE entry of equal size goes on Schedule 1 line 8s — net zero'],
  ['         tax effect, but counts as earned income for credit purposes.'],
  [],
  ['STEP-BY-STEP COMPUTATION (per person — taxpayer and, on MFJ, spouse)'],
  ['Step', 'Operation', 'Formula', 'Notes'],
  [1, 'Outer gate: Medicaid waiver received?', 'if receivedMedicaidWaiverPayments != true → return (null, null)', 'Person contributes nothing to line 1d or line 8s'],
  [2, 'Schedule C path check', 'if hasTradeOrBusinessProvidingHomeCare = true AND any amount > 0 → emit MEDICAID_WAIVER_SCHEDULE_C_{LABEL} (blocking) and return (null, null)', 'Sole proprietor home-care business uses Schedule C with Notice 2014-7 expense offset; line 1d path BLOCKED'],
  [3, 'Per-entry: read the row', 'qualifiedAmount = qualifiedNotice2014_7Amount\\ntaxableAmount = taxablePaymentsNotInW2Box1\\ncodeIIAmount = w2Box12CodeIIAmount (informational)\\nincludedInW2 = qualifiedAmountIncludedInW2Box1\\nsourceType ∈ {W-2, 1099-MISC, 1099-NEC, Other}', 'Each entry represents one payer × one Medicaid waiver program'],
  [4, 'Per-entry: code II reconciliation', 'if codeIIAmount > 0 AND qualifiedAmount = null → emit MEDICAID_WAIVER_CODE_II_MISSING_QUALIFIED_{LABEL} (blocking)', 'Box 12 code II identifies a nontaxable amount; Notice 2014-7 qualified amount must also be entered'],
  [5, 'Per-entry: W-2 box 1 lookup (only when sourceType = W-2)', 'find matching W-2 by SSN + payerTIN/payerName.\\nif W-2 box 1 > 0 AND includedInW2 = null → emit MEDICAID_WAIVER_W2_BOX1_UNSPECIFIED_{LABEL} (blocking); flag entry as missingIncludedAmount; exclude qualifiedNotInW2 contribution from accumulation\\nif W-2 box 1 ≤ 0 AND includedInW2 = null → auto-set includedInW2 = 0', 'Double-count guard: when MW payments overlap line 1a (via W-2 box 1), the user must declare HOW MUCH overlapped'],
  [6, 'Per-entry: overage check', 'if includedInW2 > qualifiedAmount → emit MEDICAID_WAIVER_W2_OVERAGE_{LABEL} (blocking)', 'Data-entry sanity check'],
  [7, 'Per-entry: split qualified into included vs not-included', 'qualifiedNotIncluded = max(0, qualifiedAmount − includedInW2)\\nqualifiedTotal += qualifiedAmount\\nqualifiedIncludedInW2 += includedInW2\\nqualifiedNotInW2 += qualifiedNotIncluded\\ntaxableNonW2 += taxableAmount', 'Per-person aggregation across all entries'],
  [8, 'Compute line 1d for this person', 'line1d_person = taxableNonW2\\nif election = true: line1d_person = addNonNull(line1d_person, qualifiedNotInW2)', 'Nontaxable amounts only flow to line 1d when the user elects to count them as earned income'],
  [9, 'Compute line 8s offset for this person', 'if election != true: line8s_person = null\\nelse: offset = qualifiedIncludedInW2 + qualifiedNotInW2\\n      if offset > qualifiedTotal → emit MEDICAID_WAIVER_LINE8S_EXCEEDS_QUALIFIED_{LABEL} (blocking)\\n      line8s_person = -offset (negative)\\n      if offset = null → emit MEDICAID_WAIVER_LINE8S_MISSING_{LABEL} (blocking)', 'line 8s backs out the nontaxable amount included on EITHER line 1a (via W-2 box 1) OR line 1d — net zero tax, but still counts as earned income for EIC/ACTC'],
  [10, 'Aggregate across spouses', 'Form1040.line1d = taxpayer.line1d + spouse.line1d (addNonNull)\\nSchedule1.line8s = taxpayer.line8s + spouse.line8s (addNonNull; both already negative)', 'See Code Validation #1 — MFS guard NOT currently enforced in computeMedicaidWaiverPayments'],
  [11, 'Round + persist', 'line1d_rounded = roundMoney(...)\\nincome.setMedicaidWaiverPayments(line1d) only when non-null\\nschedule1.additionalIncome.setOtherIncomeMedicaidWaiverPayments(roundMoney(line8s)) only when non-null', 'Whole-dollar rounding (HALF_UP). Both fields omitted from output when null.'],
  [],
  ['DECISION TREE — when does an entry contribute to line 1d?'],
  ['Branch', 'Election', 'Source', 'qualifiedAmount', 'taxableAmount', 'Contribution to line 1d', 'Contribution to line 8s'],
  ['Taxable + non-W-2 source (always)', 'either', 'W-2 / 1099 / Other', 'any', '> 0', 'taxableAmount', '0'],
  ['Nontaxable + election ON + non-W-2 source', 'true', 'W-2 / 1099 / Other', '> 0', 'any', 'qualifiedAmount (when not in W-2 box 1)', '−qualifiedAmount'],
  ['Nontaxable + election OFF + non-W-2 source', 'false', 'any', '> 0', '0', '0', '0'],
  ['Nontaxable + election ON + W-2 box 1 overlap', 'true', 'W-2', '> 0', 'any', 'max(0, qualifiedAmount − includedInW2)', '−(includedInW2 + qualifiedNotInW2)'],
  ['Sole prop home-care business', 'either', 'any', 'any', 'any', '0 (Schedule C path BLOCKED)', '0 (flag emitted)'],
  ['receivedMedicaidWaiverPayments = false / null', 'either', 'n/a', 'n/a', 'n/a', '0', '0'],
];
const ws1 = XLSX.utils.aoa_to_sheet(main);
ws1['!cols'] = [{ wch: 6 }, { wch: 50 }, { wch: 90 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Main Computation');

// ─── Sheet 2: Inputs ──────────────────────────────────────────────────────
const inputs = [
  ['INPUT FIELDS — Line 1d Computation'],
  [],
  ['#', 'Source Form (XLS)', 'Field Name', 'IRS Label / UI Question', 'Required?', 'How Used in Line 1d', 'Reference'],
  // Form-level gates
  [1, 'form-medicaid-waiver-taxpayer.xlsx (Incomes → Medicaid waiver — Taxpayer)', 'receivedMedicaidWaiverPayments', 'Did you receive Medicaid waiver payments during the tax year?', 'YES — primary gate', 'Step 1 outer gate. If not exactly true → return (null, null) for that person', 'form-medicaid-waiver-taxpayer.xlsx row 1'],
  [2, 'form-medicaid-waiver-taxpayer.xlsx', 'includeQualifiedPaymentsInEarnedIncomeForEIC_ACTC', 'Do you want these payments to count toward the Earned Income Credit or Child Tax Credit?', 'YES — election', 'Step 8 / Step 9 gate. ALL-OR-NONE per spouse. When true: nontaxable amounts flow to line 1d AND line 8s offset is generated. When false/null: only taxable amounts flow to line 1d; no line 8s.', 'form-medicaid-waiver-taxpayer.xlsx row 3'],
  [3, 'form-medicaid-waiver-taxpayer.xlsx', 'hasTradeOrBusinessProvidingHomeCare', 'Do you run a home-care business (sole proprietor) that receives these payments?', 'YES — Schedule C gate', 'Step 2: when true AND amounts present → MEDICAID_WAIVER_SCHEDULE_C_{LABEL} blocking flag fires; line 1d path entirely blocked. Schedule C path required (out of scope).', 'form-medicaid-waiver-taxpayer.xlsx row 5'],
  [4, 'form-medicaid-waiver-taxpayer.xlsx', 'programName', 'Medicaid waiver program name (optional)', 'OPTIONAL', 'Display only — not used by compute. Helps user trace which program (e.g., HCBS §1915(c) waiver).', 'form-medicaid-waiver-taxpayer.xlsx row 7'],
  [5, 'form-medicaid-waiver-taxpayer.xlsx', 'livesWithCareRecipient', 'Did you live with the care recipient?', 'INFORMATIONAL', 'Display + UI guidance only. Not used in line 1d compute. Per Notice 2014-7, qualified status requires the provider and care recipient to share a home — but the user supplies the qualified amount directly via qualifiedNotice2014_7Amount, so this answer is purely advisory.', 'form-medicaid-waiver-taxpayer.xlsx row 8'],
  // Per-entry inputs
  [6, 'form-medicaid-waiver-taxpayer.xlsx (per-payer entry)', 'payerName', 'Payer name', 'YES — display + W-2 matching', 'Step 5 W-2 lookup falls back to payer-name match when payerTIN missing', 'form-medicaid-waiver-taxpayer.xlsx row 10'],
  [7, 'form-medicaid-waiver-taxpayer.xlsx (per entry)', 'payerTIN', 'Payer EIN (optional)', 'OPTIONAL — but enables W-2 cross-reference', 'Step 5: used to find matching W-2 entry for box 1 reconciliation. Subject to TinValidator (EIN format, lenient on incomplete values).', 'form-medicaid-waiver-taxpayer.xlsx row 11'],
  [8, 'form-medicaid-waiver-taxpayer.xlsx (per entry)', 'sourceType', 'Source type *', 'YES — branch selector', 'Step 5: only "W-2" triggers the W-2 box 1 lookup branch. "1099-MISC" / "1099-NEC" / "Other" → no lookup; includedInW2 used as provided.', 'form-medicaid-waiver-taxpayer.xlsx (sourceTypeOptions in component)'],
  [9, 'form-medicaid-waiver-taxpayer.xlsx (per entry)', 'qualifiedNotice2014_7Amount', 'Qualified Medicaid waiver payments', 'CONDITIONAL — required when nontaxable amount exists', 'Steps 7-9: nontaxable Notice 2014-7 amount for this entry. Drives both line 1d (when election) and line 8s offset.', 'form-medicaid-waiver-taxpayer.xlsx row 12'],
  [10, 'form-medicaid-waiver-taxpayer.xlsx (per entry)', 'w2Box12CodeIIAmount', 'W-2 box 12 code II (if applicable)', 'INFORMATIONAL — reconciliation only', 'Step 4: validation only. If present without qualifiedAmount → MEDICAID_WAIVER_CODE_II_MISSING_QUALIFIED_{LABEL} blocking flag. Does NOT directly contribute to line 1d.', 'form-medicaid-waiver-taxpayer.xlsx row 13'],
  [11, 'form-medicaid-waiver-taxpayer.xlsx (per entry)', 'qualifiedAmountIncludedInW2Box1', 'Qualified amount included in W-2 box 1', 'CONDITIONAL — required when sourceType=W-2 AND W-2 box 1 > 0', 'Steps 5-9: portion of qualifiedAmount that already flows to line 1a via W-2 box 1. Determines: (a) qualifiedNotInW2 = qualifiedAmount − includedInW2 (drives line 1d), (b) line 8s offset = includedInW2 + qualifiedNotInW2 (the FULL qualified amount is backed out, regardless of which line it landed on).', 'form-medicaid-waiver-taxpayer.xlsx row 14'],
  [12, 'form-medicaid-waiver-taxpayer.xlsx (per entry)', 'taxablePaymentsNotInW2Box1', 'Taxable payments not in W-2 box 1', 'OPTIONAL', 'Step 7: contributes directly to line 1d unconditionally (election does not gate taxable amounts). Permanent — no line 8s offset.', 'form-medicaid-waiver-taxpayer.xlsx row 15'],
  [13, 'form-medicaid-waiver-spouse.xlsx', '(All same fields as taxpayer)', 'Mirror of taxpayer fields', 'CONDITIONAL — MFJ only', 'Per-spouse computation runs independently. See Code Validation #1 — MFS guard not enforced in code yet.', 'form-medicaid-waiver-spouse.xlsx'],
  // Cross-form inputs
  [14, 'form-w-2.xlsx (Statements → W-2)', 'wagesTipsOtherCompAmount (box 1)', 'W-2 box 1 — Wages, tips, other comp', 'CONDITIONAL — only when sourceType=W-2', 'Step 5: read by findMatchingW2Entry to determine whether this entry overlaps line 1a. >0 means user must declare includedInW2.', 'form-w-2.xlsx (Box 1)'],
  [15, 'form-w-2.xlsx', 'employeeSSN, employerEIN, employerName', 'Employee SSN / Employer EIN / Employer name', 'CONDITIONAL — for matching', 'Step 5: findMatchingW2Entry filters by employee SSN, then matches by EIN or name to find the right W-2.', 'form-w-2.xlsx (Box a / Box b / Box c)'],
  [16, 'form-identification-taxpayer.xlsx / spouse', 'ssn', 'Taxpayer / spouse SSN', 'YES — for W-2 SSN matching', 'Step 5: drives findMatchingW2Entry SSN filter', 'form-identification-*.xlsx'],
  [17, 'form-filing-status.xlsx', 'filingStatus', 'Filing status', 'GATE (deferred)', 'On MFS, only the taxpayer form should be read per dependencies/1d.md. **NOT enforced in code yet** — see Code Validation #1.', 'form-filing-status.xlsx'],
  [],
  ['NOTE — 2024+ W-2 reporting standard (W-2 box 12 code II)'],
  ['Starting with 2024 payments, payers MUST report nontaxable Medicaid waiver amounts on W-2 box 12 code II (with box 1 = 0). The `w2Box12CodeIIAmount` field captures this for reconciliation. Code II is informational only — the line 1d compute still requires the user to enter `qualifiedNotice2014_7Amount` separately. (Could be auto-populated; currently a defensive duplicate.)'],
];
const ws2 = XLSX.utils.aoa_to_sheet(inputs);
ws2['!cols'] = [{ wch: 4 }, { wch: 60 }, { wch: 50 }, { wch: 70 }, { wch: 30 }, { wch: 90 }, { wch: 40 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Inputs');

// ─── Sheet 3: Reference Data / Constants ──────────────────────────────────
const constants = [
  ['REFERENCE DATA / CONSTANTS — Line 1d (Tax Year 2025)'],
  [],
  ['Constant', 'Value', 'Source', 'Used By', 'Notes for Other Tax Years'],
  ['(NONE — line 1d uses no tax-year-specific computation constants)', '—', '—', '—', 'Line 1d is a pure aggregation: Σ taxable + (election ? Σ nontaxable not in W-2 box 1 : 0). No thresholds, no brackets.'],
  [],
  ['Statutory references (IRS rules, not constants):'],
  ['IRS rule', 'Citation', 'Notes'],
  ['Notice 2014-7 difficulty-of-care exclusion', 'IRS Notice 2014-7; IRC §131', 'Defines which Medicaid waiver payments are excludable. Provider must share a home with the care recipient under the plan of care; the recipient must be a qualified individual under a state HCBS waiver program (typically §1915(c)).'],
  ['Per-individual cap', 'IRC §131(c)', '>10 individuals under 19 OR >5 individuals 19+ → excess loses excluded status. **NOT IMPLEMENTED** in compute — see dependencies/1d.md "Deferred / Not Yet Wired" and outstanding.md. Practical occurrence in MW context is rare (HCBS waivers structurally involve one recipient per household).'],
  ['Earned income for EIC/ACTC', 'Notice 2014-7 + IRC §32(c)(2)', 'When the user makes the election, qualified amounts count as earned income for EIC and ACTC even though they are nontaxable. Mechanic: gross amount on line 1d (or line 1a via W-2), back-out on Schedule 1 line 8s.'],
  ['2024+ W-2 reporting', 'IRS announcement re W-2 box 12 code II', 'Payer-side reporting requirement. Does not change the tax computation. The compute reads `w2Box12CodeIIAmount` only for reconciliation/flag triggers.'],
  [],
  ['Note: line 1d itself uses NO ReferenceData constants. The 2024+ W-2 box-12-code-II reporting is the only tax-year-specific change relevant here, and that is informational (UI / reconciliation), not computational.'],
];
const ws3 = XLSX.utils.aoa_to_sheet(constants);
ws3['!cols'] = [{ wch: 50 }, { wch: 22 }, { wch: 60 }, { wch: 60 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Reference Data');

// ─── Sheet 4: Side-Effect Outputs ─────────────────────────────────────────
const sideEffects = [
  ['SIDE-EFFECT OUTPUTS — Schedule 1 Line 8s (and the line 1a interaction)'],
  [],
  ['Output Field Path', 'Output Form (XLS)', 'Formula', 'Notes'],
  ['schedule1.additionalIncome.otherIncomeMedicaidWaiverPayments', 'form-tax-return-schedule1.xlsx (line 8s)', 'Per person (only when election=true): line8s_person = −(qualifiedIncludedInW2 + qualifiedNotInW2)\\nAggregated: line8s = taxpayer.line8s + spouse.line8s (both already negative)', 'Negative number — entered in the preprinted parentheses on Schedule 1. Backs out the FULL nontaxable amount that was included on EITHER line 1a (via W-2 box 1 overlap) OR line 1d.'],
  [],
  ['THE LINE 1A / LINE 1D / LINE 8S TRIANGLE'],
  ['Component', 'Source', 'Routes to'],
  ['Taxable MW payments not in W-2 box 1', 'taxablePaymentsNotInW2Box1 (per entry)', 'Line 1d only. PERMANENT (no offset on line 8s).'],
  ['Nontaxable MW payments NOT in W-2 box 1, election ON', 'qualifiedNotIncluded (computed)', 'Line 1d (positive) + Schedule 1 line 8s (negative same amount). Net zero on income, but counts as earned income for credits.'],
  ['Nontaxable MW payments IN W-2 box 1, election ON', 'includedInW2 (per entry)', 'Already in line 1a (via W-2). Schedule 1 line 8s backs it out (negative). Net zero on income.'],
  ['Nontaxable MW payments IN W-2 box 1, election OFF', 'includedInW2 (per entry)', 'Stays in line 1a (W-2 sum). NO line 8s offset. Permanent inclusion in income.'],
  ['Nontaxable MW payments NOT in W-2 box 1, election OFF', 'qualifiedNotIncluded (computed)', 'NOT included on line 1d. NO line 8s. The user simply does not report these (they are excluded from income with no earned-income consequence).'],
  [],
  ['CROSS-LINE INVARIANTS'],
  ['Invariant', 'Description'],
  ['When election=true: line 8s = −(qualified portion that was included anywhere)', 'sum of (qualifiedIncludedInW2 + qualifiedNotInW2) per spouse, negated'],
  ['When election=true: line 1d gross + W-2 box 1 share = qualifiedTotal + taxableNonW2', 'Total inclusion (gross income) before the line 8s offset'],
  ['When election=false: line 1d = taxableNonW2 only', 'Nontaxable amounts disappear from the return — IRS instructs the user not to attach W-2s for them in this case'],
  ['Election is ALL-OR-NONE per spouse', 'IRS rule: cannot include only part of eligible payments. Each spouse on MFJ may make a different choice.'],
  ['Schedule C path BLOCKS line 1d', 'When hasTradeOrBusinessProvidingHomeCare = true AND any amount > 0, MEDICAID_WAIVER_SCHEDULE_C_{LABEL} fires (blocking) and line 1d returns null. User must use Schedule C path (out of scope).'],
];
const ws4 = XLSX.utils.aoa_to_sheet(sideEffects);
ws4['!cols'] = [{ wch: 60 }, { wch: 50 }, { wch: 100 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Side-Effect Outputs');

// ─── Sheet 5: Validation / Blocking Flags ─────────────────────────────────
const flags = [
  ['VALIDATION RULES — Blocking Flags Emitted by Line 1d Pass'],
  [],
  ['Flag Code', 'Trigger Condition', 'Effect', 'Suppressed When'],
  ['MEDICAID_WAIVER_SCHEDULE_C_{TAXPAYER,SPOUSE}', 'hasTradeOrBusinessProvidingHomeCare = true AND any qualifiedAmount > 0 OR taxableAmount > 0', 'Blocking. Line 1d path entirely blocked; returns (null, null) for that person. User must use Schedule C with Notice 2014-7 expense offset (out of scope).', 'Set hasTradeOrBusinessProvidingHomeCare = false (no separate home-care business)'],
  ['MEDICAID_WAIVER_W2_BOX1_UNSPECIFIED_{TAXPAYER,SPOUSE}', 'sourceType = W-2 AND matched W-2 has box 1 > 0 AND qualifiedAmountIncludedInW2Box1 = null', 'Blocking. Compute marks entry as missingIncludedAmount and excludes its qualifiedNotInW2 contribution. Return cannot be filed.', 'Provide qualifiedAmountIncludedInW2Box1 explicitly (the portion of the qualified amount already in W-2 box 1)'],
  ['MEDICAID_WAIVER_CODE_II_MISSING_QUALIFIED_{TAXPAYER,SPOUSE}', 'w2Box12CodeIIAmount > 0 AND qualifiedNotice2014_7Amount = null', 'Blocking. Code II is the new W-2 reporting standard for nontaxable amounts; the qualified amount must also be entered for compute.', 'Enter qualifiedNotice2014_7Amount (typically equal to w2Box12CodeIIAmount)'],
  ['MEDICAID_WAIVER_W2_OVERAGE_{TAXPAYER,SPOUSE}', 'qualifiedAmountIncludedInW2Box1 > qualifiedNotice2014_7Amount', 'Blocking. Data-entry error — the amount declared as in W-2 box 1 cannot exceed the total qualified amount.', 'Correct one of the two amounts'],
  ['MEDICAID_WAIVER_ELECTION_NO_QUALIFIED_{TAXPAYER,SPOUSE}', 'election = true AND qualifiedTotal ≤ 0', 'Blocking. User selected the earned-income election but provided no qualified amounts to include.', 'Either enter qualified amounts OR set election = false'],
  ['MEDICAID_WAIVER_LINE8S_EXCEEDS_QUALIFIED_{TAXPAYER,SPOUSE}', 'computed offset (qualifiedIncludedInW2 + qualifiedNotInW2) > qualifiedTotal', 'Blocking. Internal consistency error — the line 8s offset exceeds the total qualified payments.', '(Should not be reachable from valid data; investigate input contradictions)'],
  ['MEDICAID_WAIVER_LINE8S_MISSING_{TAXPAYER,SPOUSE}', 'election = true AND offset computes to null', 'Blocking. Election is active but no offset amount could be derived.', '(Should not be reachable from valid data; investigate input contradictions)'],
  [],
  ['NON-FLAG defensive behaviors (silent skip)'],
  ['Scenario', 'Behavior', 'Why not flagged'],
  ['data == null (form not saved)', 'Returns (null, null); no contribution', 'Normal — taxpayer simply has no Medicaid waiver income'],
  ['receivedMedicaidWaiverPayments != true', 'Returns (null, null)', 'Outer gate'],
  ['medicaidWaiverPayments[] empty', 'Returns (null, null)', 'No payers entered — nothing to compute'],
  ['Both amounts (qualifiedAmount + taxableAmount) absent on an entry', 'Entry contributes nothing; no flag', 'Empty row — gracefully ignored'],
  ['No matching W-2 found for an entry with sourceType=W-2', 'includedInW2 used as provided (may be null → treated as 0)', 'May be a legitimate case (W-2 was never imported); no flag'],
];
const ws5 = XLSX.utils.aoa_to_sheet(flags);
ws5['!cols'] = [{ wch: 52 }, { wch: 90 }, { wch: 60 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, ws5, 'Validation Flags');

// ─── Sheet 6: Code Validation ─────────────────────────────────────────────
const codeIssues = [
  ['CODE VALIDATION — Discrepancies, Bugs, and Missing Pieces'],
  ['Reviewed against: TaxReturnComputeService.computeMedicaidWaiverPayments() and computeMedicaidForPerson() (function-name reference; verified 2026-05-06).'],
  [],
  ['#', 'Severity', 'Issue', 'Where Found', 'Recommended Fix'],
  [1, 'DEFENSIVE GAP', 'computeMedicaidWaiverPayments unconditionally calls computeMedicaidForPerson for both taxpayer AND spouse, then aggregates. There is NO MFS guard. dependencies/1d.md says spouse form is "only read on non-MFS returns" but the code does not enforce that — same gap pattern we fixed in line 1c Issue #1 (and originally line 1b).', 'computeMedicaidWaiverPayments vs dependencies/1d.md "Always-required inputs" row 39', 'Mirror the line 1c MFS guard pattern: pass `boolean isMfs` (derived in prepare() from filingStatus), skip computeMedicaidForPerson(spouse) when isMfs=true. Spouse contribution null → both line 1d aggregate AND line 8s aggregate exclude spouse automatically. Add unit test.'],
  [2, 'DEFENSIVE GAP', 'computeMedicaidForPerson does not check `hasUnreportedTips`-style outer gate before the per-entry loop. If the user answered "Did you receive Medicaid waiver payments? = No" but stale `medicaidWaiverPayments[]` data persists (or the UI saves with hasReceived=null), no compute happens because of the `Boolean.TRUE.equals(received)` early return — but the gate is HARD (rejects null). Differs from line 1c (soft) because there is NO W-2 auto-fill for Medicaid waiver. Hard is correct here.', 'computeMedicaidForPerson — receivedMedicaidWaiverPayments early return', 'No fix needed. Hard gate is correct since there is no auto-fill path that depends on null. The contract is fine; just document it as such in lines/1d.md (no analog of line 1c soft-gate decision).'],
  [3, 'DOC vs CODE — DEPENDENCIES INCONSISTENCY', 'dependencies/1d.md "Absence / Missing-data Behaviour" row says "Spouse form absent on MFJ | Spouse contributes null; taxpayer result stands alone" — implying graceful handling, but on MFS the same code path runs and aggregates spouse into the taxpayer return (Issue #1). The doc claim is misleading.', 'dependencies/1d.md "Absence / Missing-data Behaviour" + "Filing status not saved" rows', 'Update dependencies/1d.md after Issue #1 fix to reflect the MFS guard. Currently the "Filing status not saved | MFS check defaults to false" row is technically accurate but understates the bug — spouse data is included in the line 1d aggregate when present, regardless of filing status, because the code never checks isMfs.'],
  [4, 'TEST COVERAGE GAP', 'No unit tests exist for: (a) MFS guard once Issue #1 is fixed; (b) Schedule C path blocking flag; (c) code II reconciliation flag; (d) W-2 box 1 unspecified flag; (e) overage flag; (f) MFJ both spouses elect; (g) MFJ taxpayer elects but spouse does not; (h) election ON with qualifiedTotal=0 (the no-qualified flag); (i) the per-entry W-2 lookup hit/miss branches.', 'TaxReturnComputeServiceTest', 'Add 6+ unit tests covering each of these branches. Particularly important: scenario (g) since the all-or-none election is per-spouse — locks in the spec.'],
  [5, 'POTENTIAL UI ENFORCEMENT GAP', 'When sourceType=W-2 and W-2 box 1 > 0, the user MUST provide qualifiedAmountIncludedInW2Box1 (otherwise blocking flag fires). UI form has the field but no per-entry "*" or [required] when sourceType=W-2 — same pattern we fixed for line 1c Issue #6 (employer EIN required when row contributes to Form 4137).', 'form-medicaid-waiver-taxpayer.component.ts vs computeMedicaidForPerson lines 10204-10220', 'Add per-entry helper `entryNeedsIncludedInW2(entry)` returning true when sourceType=W-2 AND a W-2 with box 1 > 0 exists for this payer. Add conditional "*" + [required] + inline error to the qualifiedAmountIncludedInW2Box1 input. Mirrors Issue #6 from line 1c.'],
  [6, 'NOT IMPLEMENTED — IRC §131(c) per-individual cap', 'Section 131(c) caps the exclusion at 10 individuals under 19 or 5 individuals 19+. Above that, excess amounts are taxable. Compute does not apply this cap.', 'lines/1d.md §4.2 + dependencies/1d.md "Deferred / Not Yet Wired" row 168', 'Already documented as "Deferred — Safe to defer" in dependencies/1d.md. Verified: HCBS waiver programs structurally involve ONE care recipient per household; multi-recipient cases are rare. Leave as-is for now; revisit if a multi-recipient scenario surfaces.'],
  [7, 'POTENTIAL DOUBLE COUNT — SCHEDULE 1 LINE 8S', 'Per the formula: line 8s = −(qualifiedIncludedInW2 + qualifiedNotInW2). When the user has BOTH a W-2 with qualified amounts AND non-W-2 qualified amounts, the offset is the sum of both. If the user mis-enters by reporting the SAME amount as both `qualifiedAmountIncludedInW2Box1` AND `qualifiedNotice2014_7Amount` separately, the offset could exceed total income with no detection. The MEDICAID_WAIVER_W2_OVERAGE_ flag catches the per-entry case (includedInW2 > qualifiedAmount), but cannot catch cross-entry duplicates.', 'computeMedicaidForPerson per-entry loop + aggregation', 'Low priority. The per-entry overage flag is the primary defense. Cross-entry duplication is rare in practice (separate payers don\'t typically have overlapping payments). Could add a "qualifiedTotal vs Σ entries" sanity check post-loop, but that would always trip in edge cases. Leave as-is.'],
  [8, 'KNOWLEDGE FILE MISSING', 'No knowledge/line-1d-medicaid-waiver*.md exists. Other lines (1a, 1b, 1c) have detailed knowledge files; line 1d has lines/1d.md spec + dependencies/1d.md but no knowledge index.', 'C:\\us-tax\\knowledge\\ folder', 'Create knowledge/line-1d-medicaid-waiver-payments.md mirroring the structure of knowledge/line-1c-tip-income.md: §1 What is Line 1d, §2 Personal Form IDs, §3 YAML Fields, §4 Backend Compute Logic (with function-name convention from 1c.xlsx Issue #9), §5 Downstream integrations, §6 Frontend Forms, §7 Unit Test Coverage, §8 E2E Test Coverage, §9 Known Implementation Gaps, §10 Key Constants. Apply 1c.xlsx Issue #9 lessons (function names, not source-code line numbers).'],
  [9, 'POTENTIAL UX ISSUE — INFORMATIONAL FIELDS NOT WIRED', 'Form has informational fields `livesWithCareRecipient` and `programName` that are NOT used by compute. They serve only as user-side guidance (Notice 2014-7 qualification). UI does not strongly link these answers to the qualifiedNotice2014_7Amount field — a user could answer "No" to livesWithCareRecipient but still enter a qualified amount.', 'form-medicaid-waiver-taxpayer.component.ts (livesWithCareRecipient input) + Pub guidance', 'Add a UI guidance callout: when livesWithCareRecipient === false AND user has entered qualifiedNotice2014_7Amount > 0, show a yellow warning: "Per Notice 2014-7, payments are excludable only when the care recipient lives in your home under the plan of care. Verify your qualified amount is correct, or treat these payments as taxable instead." Low priority — informational, not blocking.'],
];
const ws6 = XLSX.utils.aoa_to_sheet(codeIssues);
ws6['!cols'] = [{ wch: 4 }, { wch: 22 }, { wch: 80 }, { wch: 60 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws6, 'Code Validation');

// ─── Sheet 7: Output Flow ─────────────────────────────────────────────────
const output = [
  ['OUTPUT — Where Line 1d (and Schedule 1 Line 8s) Flow in the Return'],
  [],
  ['Output Field Path', 'Output PDF Field', 'Output Form (XLS)', 'Notes'],
  ['form1040.income.medicaidWaiverPayments', 'topmostSubform[0].Page1[0].f1_50[0] (line1d_medicaid_waiver_payments)', 'form-tax-return-1040.xlsx (line 1d cell)', 'Primary output — printed on Form 1040 line 1d. Stored only when non-null. Whole-dollar rounded.'],
  ['form1040.income.line1z', '(line 1z cell on f1040)', 'form-tax-return-1040.xlsx', 'Line 1d is one of 8 components: line1z = 1a + 1b + 1c + 1d + 1e + 1f + 1g + 1h (addNonNull)'],
  ['form1040.income.totalIncome', '(line 9 cell on f1040)', 'form-tax-return-1040.xlsx', 'Line 1d → 1z → 9. Critical: Schedule 1 line 8 (which includes line 8s) is also added at this stage — net-zero effect for nontaxable elected amounts.'],
  ['schedule1.additionalIncome.otherIncomeMedicaidWaiverPayments', '(Schedule 1 line 8s cell, in parentheses for negative)', 'form-tax-return-schedule1.xlsx', 'Negative number. Backs out the nontaxable elected amounts from total income. Set only when election=true.'],
  [],
  ['DOWNSTREAM USE (read by other computations)'],
  ['Consumer', 'How it uses line 1d', 'Notes'],
  ['Pub 915 Social Security Worksheet 1 line 3', 'Includes line 1d via "Form 1040 line 1z" reference', 'Same as line 1c. Schedule 1 line 8 (which includes line 8s) is also in the worksheet, so net-zero is preserved.'],
  ['Form 2441 (dependent care) earned income', 'When election=true: nontaxable Medicaid waiver amounts count toward earned income limit (per Notice 2014-7 + IRC §21)', 'Verify in Form 2441 audit. Note: line 1d "earned income" treatment for §21 may not exactly match the EIC §32 treatment — the IRS-2014-7 election is specifically scoped to EIC and ACTC.'],
  ['EIC earned income (line 27a)', 'When election=true: included via line 1d. The IRC §32 earned-income definition allows this election per Notice 2014-7.', 'Confirmed via Issue #8 of line 1a audit (IRC §32(c)(2)(B)(iv) excludes inmate wages but Medicaid waiver under Notice 2014-7 may be ELECTIVELY included).'],
  ['Schedule 8812 / ACTC earned income', 'When election=true: included via line 1d for the $2,500 floor', 'Same Notice 2014-7 election scope'],
  ['Schedule 1-A line 38 (enhanced senior + tips deduction)', 'No direct interaction', 'Schedule 1-A scope is tips + overtime + car loan interest + senior — not Medicaid waiver'],
  [],
  ['NEGATIVE / NULL CONTRACT'],
  ['line 1d value', 'Meaning'],
  ['null (field absent)', 'No Medicaid waiver income to report — taxpayer + spouse contributed nothing (typical case for non-care providers)'],
  ['BigDecimal.ZERO', 'Edge case — election OFF AND only nontaxable amounts present (no taxable). Theoretically possible but rare.'],
  ['Positive BigDecimal', 'Standard case — at least one entry with taxable Medicaid waiver payments OR the user elected and has nontaxable qualified amounts not in W-2 box 1'],
];
const ws7 = XLSX.utils.aoa_to_sheet(output);
ws7['!cols'] = [{ wch: 60 }, { wch: 70 }, { wch: 50 }, { wch: 80 }];
XLSX.utils.book_append_sheet(wb, ws7, 'Output Flow');

XLSX.writeFile(wb, OUT);
console.log('Wrote: ' + OUT);
