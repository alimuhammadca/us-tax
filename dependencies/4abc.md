# Dependencies — Lines 4a/4b/4c IRA Distributions

This document covers every input and output for the lines 4a/4b/4c computation pass, including Form 8606 generation.

Tax year: **2025**

---

## Input personal forms

| Form ID | Firestore path | Person | Fields consumed |
|---|---|---|---|
| `ira-income-taxpayer` | `users/{uid}/ira-income-taxpayer` | Taxpayer | `hadIraDistributions`, `hasUploadedAtLeastOneIra1099RStatement`, `confirmAllReceived1099RUploaded`, `received1099R`, `uploaded1099R`, `hasNondeductibleTraditionalBasis`, `hasTraditionalToRothConversion`, `hasRothIraDistributions`, `hadIraRollover`, `hadQcd`, `hadHfd`, `hadReturnOfContributionOrRecharacterization`, `hasAnyTaxableAmountNotDeterminedIra1099R`, `totalIraRolloverAmount`, `totalQcdAmount`, `inheritedIraQcdAmount`, `deductibleIraContributionsAfterAge70Half`, `totalHfdAmount`, `returnOfContributionAmount`, `inheritedTraditionalIraDistributionAmount`, `hasOtherLine4cWriteInCode`, `line4cOtherWriteInText`, `line4cOtherWriteInAmount`, `rolloverIntoQualifiedPlanOrCompletedInFollowingYear`, `hasOneTimeQcdToSplitInterestEntity`, `basisPrevFromPriorYear8606Line14`, `nondeductibleContributionsCurrentYear`, `nondeductibleContributionsMadeAfterYearEndForTaxYear`, `valueAllTraditionalSepSimpleIrasAtYearEnd`, `totalTraditionalIraConvertedToRothFor8606Line8`, `qualifiedDisasterRepaymentsTraditionalFor8606Line15b`, `totalNonqualifiedRothDistributionsFor8606Line19`, `qualifiedFirstTimeHomebuyerExpensesFor8606Line20`, `rothContributionBasisFor8606Line22`, `rothConversionBasisFor8606Line24`, `qualifiedDisasterRepaymentsRothFor8606Line25b`, `moreThanOneLine4ExceptionAppliesOnReturn`, `onlyException2AndOneOtherAppliesOnReturn`, `exceptionBreakoutStatementPrepared` |
| `ira-income-spouse` | `users/{uid}/ira-income-spouse` | Spouse (MFJ only) | Same fields as taxpayer EXCEPT: no statement upload check fields, no return-level gating fields (`moreThanOneLine4ExceptionAppliesOnReturn`, `onlyException2AndOneOtherAppliesOnReturn`, `exceptionBreakoutStatementPrepared`). Includes `returnOfContributionAmount` and `inheritedTraditionalIraDistributionAmount`. |
| `identification-taxpayer` | `users/{uid}/identification-taxpayer` | Taxpayer | `ssn` — used by `belongsToPersonIra()` for 1099-R TIN matching |
| `identification-spouse` | `users/{uid}/identification-spouse` | Spouse | `ssn` — used by `belongsToPersonIra()` for 1099-R TIN matching |

---

## Input statement forms

| Statement type | Firestore collection | Filter condition | Fields consumed |
|---|---|---|---|
| 1099-R | `users/{uid}/1099-r` | `iraSepSimple == true` | `recipientTIN` (TIN matching via `belongsToPersonIra()`), `grossDistributionAmount` (box 1 → line 4a gross; non-Roth entries also accumulate `grossTraditionalIra` for Form 8606 line 7), `taxableAmountAmount` (box 2a → line 4b basis), `taxableAmountNotDetermined` (box 2b), `federalIncomeTaxWithheldAmount` (box 4 → line 25b withholding, NOT line 4), `distributionCodeBox7` (box 7 — codes J/Q/T mark entry as Roth; excluded from `grossTraditionalIra` accumulation) |

**Note:** 1099-R entries with `iraSepSimple == false` (mirror filter) are filtered OUT here and routed to `computePensionAnnuityIncome()` for lines 5a/5b/5c instead.

---

## Output JSON fields

| JSON path | Java class / field | Meaning |
|---|---|---|
| `form1040.income.iraDistributions` | `Income.iraDistributions` | Line 4a — `null` when `fullyTaxableOverall == true` (blank-when-fully-taxable rule); whole-dollar HALF_UP rounded |
| `form1040.income.taxableIraDistributions` | `Income.taxableIraDistributions` | Line 4b — always present when IRA activity (zero allowed) |
| `form1040.income.line4cBox1Rollover` | `Income.line4cBox1Rollover` | Line 4c box 1 — rollover (`Boolean.TRUE` or null) |
| `form1040.income.line4cBox2Qcd` | `Income.line4cBox2Qcd` | Line 4c box 2 — QCD (`Boolean.TRUE` or null) |
| `form1040.income.line4cBox3Other` | `Income.line4cBox3Other` | Line 4c box 3 — other (HFD, etc.; `Boolean.TRUE` or null) |
| `form1040.income.line4cBox3Text` | `Income.line4cBox3Text` | Write-in text for box 3 (e.g. `"HFD"`, `"HFD; XYZ"` — auto-prepended; LinkedHashSet deduplicated) |
| `form1040.income.line4cExceptionBreakoutStatementRequired` | `Income.line4cExceptionBreakoutStatementRequired` | True when multi-exception statement required but not yet prepared |
| `form8606Taxpayer` | `TaxReturnComputation.form8606Taxpayer` | Form 8606 for taxpayer (per-person, never joint) — null when `hasException2 == false` |
| `form8606Spouse` | `TaxReturnComputation.form8606Spouse` | Form 8606 for spouse — null when not MFJ or `hasException2 == false` for spouse |

---

## Excluded items (by design)

| Item | Reason |
|---|---|
| Line 4a | NOT in line 9 / AGI / taxable income (gross — informational/disclosure only) |
| Non-IRA 1099-R (`iraSepSimple != true`) | Mirror filter — routes to lines 5a/5b/5c |
| Roth code Q entries (fully qualified) | Excluded from `hasException2` when `allRothEntriesFullyQualified` — no Form 8606 Part III generated |
| 1099-R box 4 federal withholding | Routes to line 25b withholding (NOT line 4) via separate `computeWithholding()` pass |
| Self-employment IRA contribution paths | Out of scope (per CLAUDE.md) |
| QCD $108,000 annual cap / SIE $54,000 cap | Deferred enforcement (per `outstanding.md`); IRS document-matching is safety net |

---

## Downstream consumers

| Consumer | Line / Form | Input from 4a/4b/4c | Notes |
|---|---|---|---|
| Line 9 total income | `form1040.income.totalIncome` | `taxableIraDistributions` (line 4b) | 4th operand of `addNonNull` chain; line 4a gross NOT added |
| Line 25b withholding | `form1040.payments.withholding1099` | Box 4 federal withholding from IRA 1099-R | Shared with other 1099 withholding via `computeWithholding()` |
| Form 8606 (taxpayer) | `TaxReturnComputation.form8606Taxpayer` | Filed with return when `taxpayer.hasException2 == true` | Per-person, never joint |
| Form 8606 (spouse) | `TaxReturnComputation.form8606Spouse` | Filed with return when `spouse.hasException2 == true` | Per-person, never joint |
| Tax Return UI — Form 8606 sidebar | `form-tax-return-8606-taxpayer/spouse` | `form8606Taxpayer` / `form8606Spouse` | Conditional sidebar entry when non-null |
| PDF export — Form 1040 | `f1040_field_mapping_semantic.csv` | `iraDistributions`, `taxableIraDistributions`, line 4c checkboxes, box 3 text | |
| PDF export — Form 8606 | `f8606_semantic_labels.pdf` + `f8606_field_map_semantic.csv` | All Form 8606 Part I/II/III lines | |
| `IraComputation.line4cBreakoutStatementText` | Descriptive attachment text | When `statementRequired` | |
| `IraComputation.line4aRolloverAttachmentText` | Explanatory text | When `rolloverIntoQualifiedPlanOrCompletedInFollowingYear` | |
| `IraComputation.line4cQcdSieAttachmentText` | SIE election text | When `hasOneTimeQcdToSplitInterestEntity` | |

---

## Blocking flags emitted

| Flag | Severity | Condition |
|---|---|---|
| `IRA_STATEMENT_UPLOAD_REQUIRED` | BLOCKING | `hadIraDistributions == true` AND upload confirmation not satisfied |
| `MISSING_UPLOADED_1099_R` | BLOCKING | `received1099R == true` AND `uploaded1099R != true` |
| `LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED` | BLOCKING | More than one exception category applies AND `exceptionBreakoutStatementPrepared != true` AND waiver does not apply |
| `IRA_ROLLOVER_ATTACHMENT_REVIEW` | NON-BLOCKING | `rolloverIntoQualifiedPlanOrCompletedInFollowingYear == true` for taxpayer or spouse |
| `IRA_QCD_SIE_ATTACHMENT_REVIEW` | NON-BLOCKING | `hasOneTimeQcdToSplitInterestEntity == true` for taxpayer or spouse |
| `IRA_DISTRIBUTION_TAXABLE_NOT_DETERMINED` | NON-BLOCKING (verification) | Any 1099-R IRA entry has box 2b checked |

**Waiver for `LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED`:** Exactly 2 exception categories present where one is Exception 2 (Form 8606) and the other is exactly one of box 1/2/3.

Implicit zero-floor gates (silent normalization):

- `taxableAfterExceptions` floors at zero via `subtractNonNegative`
- `form8606Line7` floors at zero
- Form 8606 Part I line 15c is itself `max(0, ...)`

---

## Form 8606 override pattern (compute order)

`buildForm8606(person, iraForm, grossTraditionalIra)` generates Form 8606 when `hasException2 == true`. The override is exclusive:

```
form8606Taxable = addNonNull(addNonNull(Part1Line15c, Part2Line18), Part3Line25c)
if (form8606Taxable != null) taxableAmount = form8606Taxable
else                          taxableAmount = taxableAfterExceptions
```

When Form 8606 produces a non-null taxable amount, it **replaces** (does not add to) `taxableAfterExceptions`. This prevents double-counting because Form 8606 Part I already handles basis recovery and traditional IRA exceptions internally.

Form 8606 Part I line 7 is auto-computed (since 2026-04-15) from `grossTraditionalIra` (sum of box 1 from non-Roth-coded 1099-R entries — excludes codes J/Q/T) minus: rollover + full QCD + HFD + Roth conversion + return-of-contribution + inherited traditional IRA. Users are never asked to perform this arithmetic manually.

---

## Line 4c exception aggregation

```
exceptionCategoryCount = (line4cBox1 ? 1 : 0)
                       + (line4cBox2 ? 1 : 0)
                       + (line4cBox3 ? 1 : 0)
                       + (hasException2 ? 1 : 0)
nonException2Count     = (line4cBox1 ? 1 : 0) + (line4cBox2 ? 1 : 0) + (line4cBox3 ? 1 : 0)

// Path A: user assertion
if (moreThanOneLine4ExceptionAppliesOnReturn == true):
    statementRequired = !onlyException2AndOneOtherAppliesOnReturn

// Path B: auto-detection
else:
    waiverCase        = (exceptionCategoryCount == 2 AND hasException2 AND nonException2Count == 1)
    statementRequired = (exceptionCategoryCount > 1) AND !waiverCase
```

Line 4c box 1/2/3 flags are OR-aggregated across spouses. `joinOtherWriteInTokens` uses LinkedHashSet with semicolon-split to deduplicate (prevents `"HFD; HFD"` when both spouses had HFDs).

---

## Compute order

1. `prepare(...)` runs upstream personal-form / statement reads, including filing status and 1099-R entries.
2. `computeIraDistributions(...)` is called with `isMfsReturn` (call site `TaxReturnComputeService.java:486`).
3. `computeIraForPerson` runs for taxpayer and (on MFJ) spouse: per-person 1099-R filtering + exception detection + Form 8606 generation + `taxableAfterExceptions` chain.
4. Return-level aggregation: gross + taxable; line 4c box / write-in / statement logic.
5. `buildIncome` writes line 4a (when non-null), line 4b, and line 4c setters onto `form1040.income`.

---

## Key invariants

- `line 4b ≥ 0` (zero-floor at `taxableAfterExceptions` + Form 8606 Part I line 15c is `max(0, ...)`)
- `line 4b ≤ line 4a` when line 4a non-null
- `line 4a` is null (blank) iff `fullyTaxableOverall == true` (4-condition gate: gross positive AND `!hasAnyException` AND taxable positive AND `gross == taxable`)
- `line 4a` is NOT in line 9 (gross — informational only)
- `line 4b` IS in line 9 (4th operand of `addNonNull` chain)
- Form 8606 is per-person; never joint (MFJ may produce no, taxpayer-only, spouse-only, or both)
- Roth code Q alone never triggers Form 8606 Part III
- Post-70½ deductible contribution reduction applies only to OWN IRA QCDs (not inherited)
- Line 4c box flags are OR-aggregated across spouses
- Line 4c box 3 write-in text auto-prepends `HFD` when `hasHfd`
- IRA / SEP / SIMPLE only — mutual exclusion with line 5 via `iraSepSimple` filter

---

## MFS guard (orchestrator-level)

`computeIraDistributions` takes a `boolean isMfsReturn` parameter. On MFS, `iraIncomeSpouse = null` and `spouseSsn = null`, so spouse-attributed 1099-R entries fail `belongsToPersonIra()` and spouse-side `computeIraForPerson` returns null. Single-guard cascade extension to 9 orchestrators (now 10+). Lock-in test: `mfsExcludesSpouseIraFromLine4a`.

---

## Key backend locations

| Item | Location |
|---|---|
| `computeIraDistributions()` orchestrator | `TaxReturnComputeService.java:8745` |
| `computeIraForPerson()` per-person aggregator | line 9249 |
| `fullyTaxableOverall` derivation | line 9192 |
| `line4a` blank-when-fully-taxable | line 9208 |
| `line4cBox1 / 2 / 3` OR aggregation | lines 8820–8822 |
| `joinOtherWriteInTokens` deduplication | line 8824 |
| `LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED` emission | line 8879 |
| `IRA_ROLLOVER_ATTACHMENT_REVIEW` emission | line 8930 |
| `IRA_QCD_SIE_ATTACHMENT_REVIEW` emission | line 8949 |
| `buildForm8606(person, iraForm, grossTraditionalIra)` | `TaxReturnComputeService.java` ~line 4842 |
| `validateIraStatementGating()` | `TaxReturnComputeService.java` ~line 4795 |
| `belongsToPersonIra()` | `TaxReturnComputeService.java` (private helper) |
| `joinLine4cOtherText()` | `TaxReturnComputeService.java` (private helper — semicolon-dedup via LinkedHashSet) |
| `buildIncome` line 4c setters (TRUE-or-null) | lines 7544 / 7547 / 7550 / 7553 |
| `IraPersonComputation` (record) | `TaxReturnComputeService.java` ~line 16505 |
| `IraComputation` (record) | `TaxReturnComputeService.java` ~line 16516 |
| `Income.java` | `src/main/java/com/ustax/model/output/Income.java` |
| `Form8606.java` | `src/main/java/com/ustax/model/output/Form8606.java` |
| `TaxReturnComputation.java` | `src/main/java/com/ustax/microservices/TaxReturnComputation.java` (positions 7–8) |
