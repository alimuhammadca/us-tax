# Dependencies — Lines 3a/3b Dividend Income

This document covers every input and output for the lines 3a/3b computation pass. Line 3c disclosure checkbox handling is documented here only insofar as it is a downstream consequence of Form 8814 routing into lines 3a/3b — line 3c itself is a Boolean disclosure metadata with no dollar arithmetic.

Tax year: **2025**

---

## Input personal forms

| Form ID | Firestore path | Person | Fields consumed |
|---|---|---|---|
| `dividend-income-taxpayer` | `users/{uid}/dividend-income-taxpayer` | Taxpayer / Family Head | `hadDividendIncome`, `hasUploadedAtLeastOne1099DivStatement` *(auto-derived from statement count; UI sets, backend reads for gating)*, `received1099Div` *(auto-derived)*, `uploaded1099Div` *(auto-derived)*, `confirmAllReceived1099DivUploaded`, `manualOrdinaryDividendsNotOnStatements`, `manualQualifiedDividendsNotOnStatements`, `hasNomineeDividends`, `nomineeOrdinaryDividends`, `nomineeQualifiedDividends`, `nonQualifiedFromHoldingPeriodCommon61of121`, `nonQualifiedFromHoldingPeriodPreferred91of181`, `nonQualifiedFromRelatedPaymentObligationShortSale`, `nonQualifiedPaymentsInLieu`, `nonQualifiedSurrogateForeignCorporationDividends`, `hasQualifiedDividendDisallowances` *(UI-only gate; saved to Firestore but not read by backend)*, `willIssueNominee1099DivToActualOwner` *(compliance checklist; no compute effect)*, `willFileNominee1096And1099DivWithIrs` *(compliance checklist; no compute effect)* |
| `dividend-income-spouse` | `users/{uid}/dividend-income-spouse` | Spouse (MFJ only) | `hadDividendIncome`, `manualOrdinaryDividendsNotOnStatements`, `manualQualifiedDividendsNotOnStatements`, `hasNomineeDividends`, `nomineeOrdinaryDividends`, `nomineeQualifiedDividends`, `nonQualifiedFromHoldingPeriodCommon61of121`, `nonQualifiedFromHoldingPeriodPreferred91of181`, `nonQualifiedFromRelatedPaymentObligationShortSale`, `nonQualifiedPaymentsInLieu`, `nonQualifiedSurrogateForeignCorporationDividends`, `hasQualifiedDividendDisallowances` *(UI-only gate)* |
| `identification-taxpayer` | `users/{uid}/identification-taxpayer` | Taxpayer | `ssn` — used for 1099-DIV entry attribution via `belongsToPerson()` |
| `identification-spouse` | `users/{uid}/identification-spouse` | Spouse | `ssn` — used for 1099-DIV entry attribution via `belongsToPerson()` |
| `identification-dependent` | `users/{uid}/dependents/{depId}` | Each dependent | `dependentSSN` — matched against `recipientTIN` on child 1099-INT/DIV statements to drive Form 8814 statement-driven path |

---

## Input statement forms

| Statement type | Firestore collection | Fields consumed | Destination |
|---|---|---|---|
| 1099-DIV | `users/{uid}/1099-div` | `recipientTIN` | Entry attribution (taxpayer vs spouse via `belongsToPerson()`; dependent via SSN match in `computeChildInterestDividends()`) |
| 1099-DIV | `users/{uid}/1099-div` | `payerNameAddress` | Schedule B Part II payer name |
| 1099-DIV | `users/{uid}/1099-div` | `totalOrdinaryDividendsAmount` (box 1a) | Line 3b (parent); Form 8814 line 2a input (child) |
| 1099-DIV | `users/{uid}/1099-div` | `qualifiedDividendsAmount` (box 1b) | Candidate line 3a (parent); Form 8814 line 2b input (child) |
| 1099-DIV | `users/{uid}/1099-div` | `totalCapitalGainDistributionsAmount` (box 2a) | Form 8814 line 3 input when `recipientTIN` matches a dependent SSN |
| 1099-DIV | `users/{uid}/1099-div` | `specifiedPrivateActivityBondDividendsAmount` (box 13) | Form 6251 line 2g (AMT preference) |
| 1099-DIV | `users/{uid}/1099-div` | `exemptInterestDividendsAmount` (box 12) | Line 2a (NOT lines 3a/3b — handled by interest computation) |
| 1099-INT | `users/{uid}/1099-int` | `recipientTIN`, `interestIncomeAmount` (box 1), `usSavingsBondsTreasuryInterestAmount` (box 3), `bondPremiumAmount` (box 11), `bondPremiumTreasuryAmount` (box 12), `taxExemptInterestAmount` (box 8), `bondPremiumTaxExemptAmount` (box 13) | Form 8814 line 1a/1b inputs when `recipientTIN` matches a dependent SSN |
| `child-interest-dividends` | `users/{uid}/child-interest-dividends` | `childSsn`, `line1aTaxableInterest`, `line1bTaxExemptInterest`, `line2aOrdinaryDividends`, `line2bQualifiedDividends`, `line3CapGainDistributions` | Manual Form 8814 inputs; override statement-derived values when non-null for the same dependent SSN |

**1099-DIV fields cross-validated by dividend computation:**

| Field | Box | Purpose |
|---|---|---|
| `section199ADividendsAmount` | box 5 | Accumulated into `DividendPersonTotals.section199aDividendsTotal`; emits `SECTION199A_DIVIDENDS_EXCEED_ORDINARY_DIVIDENDS_{TAXPAYER,SPOUSE}` non-blocking flag when box 5 > box 1a. NOT included in line 3a/3b arithmetic. |

**1099-DIV fields read elsewhere (NOT by dividend computation):**

| Field | Box | Routed to |
|---|---|---|
| `totalCapitalGainDistributionsAmount` | box 2a | Line 7a capital gain computation |
| `section199ADividendsAmount` | box 5 | Form 8995 QBI deduction (primary consumer); subset of box 1a |
| `foreignTaxPaidAmount` | box 7 | Form 1116 foreign tax credit |
| `nondividendDistributionsAmount` | box 3 | Basis adjustment; not an income line |

---

## Output JSON fields

| JSON path | Java class / field | Meaning |
|---|---|---|
| `form1040.income.ordinaryDividends` | `Income.ordinaryDividends` | Form 1040 line 3b (includes Form 8814 line 9 child qualified dividends when applicable) |
| `form1040.income.qualifiedDividends` | `Income.qualifiedDividends` | Form 1040 line 3a (includes Form 8814 line 9 child qualified dividends when applicable) |
| `form1040.income.line3cChildDividendsInLine3a` | `Income.line3cChildDividendsInLine3a` | Form 1040 line 3c checkbox 1 — `Boolean.TRUE` when Form 8814 line 9 > 0; `null` otherwise (never `Boolean.FALSE`) |
| `form1040.income.line3cChildDividendsInLine3b` | `Income.line3cChildDividendsInLine3b` | Form 1040 line 3c checkbox 2 — same trigger as checkbox 1 (symmetric) |
| `form8814List` | `List<Form8814>` | One Form 8814 per child; each entry feeds `form8814QualifiedDividendsTotal` into lines 3a/3b and line 3c |
| `scheduleB` | `ScheduleB` (null when not required) | Schedule B — shared with lines 2a/2b |
| `scheduleB.line6TotalOrdinaryDividends` | `ScheduleB.line6TotalOrdinaryDividends` | Schedule B Part II line 6 = line 3b |
| `scheduleB.dividendItems` | `List<ScheduleBInterestItem>` | Per-payer dividend detail rows for Schedule B Part II (up to 14 payers per IRS instructions) |
| `form6251.line2gPrivateActivityBondInterest` | `Form6251.line2gPrivateActivityBondInterest` | Combined PAB interest (1099-INT box 9 + 1099-DIV box 13) |

---

## Excluded items (by design)

| Item | Reason |
|---|---|
| 1099-DIV box 2a (capital gain distributions) | Routes to line 7a (Schedule D path), NOT line 3b |
| 1099-DIV box 3 (nondividend distributions) | Stock basis reduction, NOT income |
| 1099-DIV box 12 (exempt-interest dividends) | Routes to line 2a, NOT line 3b |
| 1099-DIV box 13 (PAB dividends) | Subset of box 12; feeds Form 6251 line 2g (AMT); NOT added to line 3b |
| 1099-DIV box 5 (Section 199A dividends) | Subset of box 1a (already counted); feeds Form 8995 / 8995-A for line 13a separately |
| Form 8814 line 12 residual (non-qualified child ordinary) | Routes to Schedule 1 line 8z, NOT line 3b |
| Form 8814 line 2a in isolation | Only line 9 (qualified-dividend proportion) flows to parent's lines 3a / 3b — NOT the full child ordinary amount |
| Line 3a | NOT independently added to line 9 (subset of line 3b) |
| Line 3c | Boolean disclosure metadata; no arithmetic propagation |

---

## Downstream consumers

| Consumer | Line / Form | Input from 3a/3b | Notes |
|---|---|---|---|
| Line 9 total income | `form1040.income.totalIncome` | `ordinaryDividends` (line 3b) | 3rd operand of `addNonNull` income chain; line 3a is a subset, not independently added |
| Line 16 tax computation method | `TaxReturnComputeService.computeLine16()` | `line3aQualifiedDividends != null` | Triggers QDCG worksheet or Schedule D Tax Worksheet selection |
| Schedule B Part II | `ScheduleB.line6TotalOrdinaryDividends`, `dividendItems` | Conditionally generated when `scheduleBRequired == true` |
| Form 6251 line 2g | `Form6251.line2gPrivateActivityBondInterest` | `form6251Line2gDividends` from 1099-DIV box 13; added to PAB interest from 1099-INT box 9 in `computeInterestIncome()` |
| Form 8814 line 9 (child qual divs) | `form8814List[*].line9QualifiedDividends` | Summed across all Form 8814 instances; added to parent's lines 3a AND 3b symmetrically in `computeDividendIncome()`; sets line 3c checkboxes |
| Form 8995 / 8995-A | QBI deduction (line 13a) | 1099-DIV box 5 Section 199A dividends | Subset of box 1a |
| PDF export — line 3c checkboxes | `f1040_field_mapping_semantic.csv` fields `c1_33`/`c1_34` | Populated by `form-tax-return-1040.component.ts` |

---

## Blocking flags emitted

| Flag | Severity | Condition |
|---|---|---|
| `DIVIDEND_STATEMENT_UPLOAD_REQUIRED` | BLOCKING | `hadDividendIncome == true` AND `hasUploadedAtLeastOne1099DivStatement != true` |
| `DIVIDEND_1099_DIV_UPLOAD_CONFIRMATION_REQUIRED` | BLOCKING | `hadDividendIncome == true` AND `confirmAllReceived1099DivUploaded != true` |
| `MISSING_UPLOADED_1099_DIV_DIVIDEND_WORKFLOW` | BLOCKING | `received1099Div == true` AND `uploaded1099Div != true` |
| `FORM8814_CHILD_GROSS_INCOME_TOO_HIGH` | BLOCKING | Child's Form 8814 line 4 ≥ $13,500 — child must file own return |
| `QUALIFIED_DIVIDENDS_LIMITED_TO_ORDINARY_DIVIDENDS` | NON-BLOCKING | Line 3a (aggregated) > line 3b; capped to line 3b |
| `MISSING_DIVIDEND_STATEMENTS_TAXPAYER` | NON-BLOCKING | `!useLegacyMode` AND taxpayer `hadDividendIncome == true` AND no TIN-matched 1099-DIV entries found |
| `MISSING_DIVIDEND_STATEMENTS_SPOUSE` | NON-BLOCKING | `!useLegacyMode` AND spouse `hadDividendIncome == true` AND no TIN-matched 1099-DIV entries found |
| `SECTION199A_DIVIDENDS_EXCEED_ORDINARY_DIVIDENDS_TAXPAYER` | NON-BLOCKING | Taxpayer 1099-DIV box 5 total > box 1a total |
| `SECTION199A_DIVIDENDS_EXCEED_ORDINARY_DIVIDENDS_SPOUSE` | NON-BLOCKING | Spouse 1099-DIV box 5 total > box 1a total |

---

## Schedule B trigger chain (orchestrator OR)

Schedule B Part II is required from the dividend side when:

- `line 3b > $1,500`, OR
- `hasNomineeDividends == true` (independent trigger, no threshold)

The orchestrator OR-s with the interest-side triggers to determine `scheduleBRequired`. Schedule B Part II line 6 carries `line3b` (NOT line 3a).

---

## Compute order

1. `prepare(...)` builds Form 8814 records and aggregates `form8814QualifiedDividendsTotal` (line 459).
2. `computeInterestIncome(...)` runs and invokes `computeDividendIncome(...)` with the shared `isMfsReturn` guard.
3. `computeDividendForPerson` runs for taxpayer and (on MFJ) spouse: per-person ordinary + qualified + nominee + per-person silent cap.
4. `computeDividendIncome` aggregates to return level: adds `form8814QualifiedDividendsTotal` to BOTH lines 3a / 3b symmetrically (lines 8458–8459); applies return-level cap with non-blocking flag; sets line 3c booleans (`TRUE`-or-null at lines 8587–8588).
5. `buildIncome` writes `ordinaryDividends`, `qualifiedDividends`, and line 3c boolean checkboxes onto `form1040.income` (TRUE-or-null gates at lines 7523 / 7526).

---

## Key invariants

- `0 ≤ line 3a ≤ line 3b` (enforced at two levels: per-person silent cap + per-return cap with `QUALIFIED_DIVIDENDS_LIMITED_TO_ORDINARY_DIVIDENDS` flag)
- `line 3b` equals taxpayer's net ordinary dividends after nominee subtraction (plus child qualified dividends when applicable)
- `line 3a` equals taxpayer's net qualified dividends after all 6 disallowed-category reductions (plus child qualified dividends when applicable)
- Schedule B Part II required iff `line 3b > $1,500` OR nominee dividends present
- `1099-DIV box 2a / 3 / 12 / 13 / 5` must NOT be misrouted into lines 3a / 3b
- Both line 3c checkboxes are `Boolean.TRUE` or `null` — never `Boolean.FALSE`
- Line 3c does not participate in `line 9` arithmetic (Boolean type)
- Form 8814 line 12 must not include the child's qualified-dividend portion (already in line 9)
- Only Form 8814 line 9 (qualified portion) flows to parent's 3a/3b — child's full ordinary line 2a does NOT independently flow to parent line 3b
- MFS guard suppresses spouse-side reads (single guard with interest path)

---

## MFS guard (orchestrator-level)

Inherited from `computeInterestIncome`: when `isMfsReturn == true`, `dividendIncomeSpouse = null` and `spouseSsn = null`. Spouse-attributed 1099-DIV entries fail `belongsToPerson()`. Single guard protects lines 3a, 3b, line 3c, Form 6251 line 2g (box 13), and Schedule B Part II dividend detail items.

---

## Key backend locations

| Item | Location |
|---|---|
| `computeDividendIncome()` orchestrator | `TaxReturnComputeService.java:8394` |
| `computeDividendForPerson()` per-person aggregator | line 8592 |
| `validateDividendStatementGating()` | `TaxReturnComputeService.java` ~line 4244 |
| `hasChildQualifiedDividends` derivation | line 8456 |
| Form 8814 line 9 → parent 3a/3b | lines 8458–8459 |
| `DividendComputation` constructor (line 3c booleans) | lines 8587–8588 |
| `buildIncome` line 3c propagation (TRUE-or-null) | lines 7523 / 7526 |
| `form8814QualifiedDividendsTotal` aggregation | line 459 |
| `computeChildInterestDividends()` | `TaxReturnComputeService.java` ~line 5517 |
| `buildForm8814()` | `TaxReturnComputeService.java` ~line 5617 |
| `buildScheduleB()` | `TaxReturnComputeService.java` ~line 7265 |
| `DividendComputation` (record) | `TaxReturnComputeService.java` ~line 16487 |
| `DividendPersonTotals` (record) | `TaxReturnComputeService.java` ~line 16496 |
| `Income.java` | `src/main/java/com/ustax/model/output/Income.java` |
| `Form8814.java` | `src/main/java/com/ustax/model/output/Form8814.java` |
| `ScheduleB.java` | `src/main/java/com/ustax/model/output/ScheduleB.java` |
| `ScheduleBInterestItem.java` | `src/main/java/com/ustax/model/output/ScheduleBInterestItem.java` |
