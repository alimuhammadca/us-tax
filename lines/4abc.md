# Form 1040 Lines 4a, 4b, and 4c — IRA Distributions (Tax Year 2025)

## 1. Line identity

- Form: `1040 / 1040-SR`
- Lines:
  - `4a` = `IRA distributions` (gross amount, when required to be reported)
  - `4b` = `Taxable amount of IRA distributions`
  - `4c` = exception disclosure: **three independent checkboxes + a write-in space**
    - box 1 = rollover (Exception 1, IRC §408(d)(3))
    - box 2 = QCD (Exception 3, IRC §408(d)(8))
    - box 3 = other write-in, including `HFD` (Exception 4, IRC §408(d)(9)) and any other line 4c write-in code
- PDF fields:
  - `4a` → `topmostSubform[0].Page1[0].f1_62[0]` (semantic: `line4a_ira_distributions`)
  - `4b` → `topmostSubform[0].Page1[0].f1_63[0]` (semantic: `line4b_ira_taxable_amount`)
  - `4c` box 1 → `c1_35[0]` (semantic: `line4c_box1_rollover`)
  - `4c` box 2 → `c1_36[0]` (semantic: `line4c_box2_qcd`)
  - `4c` box 3 → `c1_37[0]` (semantic: `line4c_box3_other`)
  - `4c` write-in text → `f1_64[0]` (semantic: `line4c_box3_text`)

These lines cover **IRA distributions only**. Included IRA types: traditional, Roth, SEP, SIMPLE. Non-IRA retirement distributions belong on lines 5a / 5b / 5c.

This is a 2025 line spec.

---

## 2. Core 2025 IRS Rule

Use Form(s) 1099-R reporting IRA / SEP / SIMPLE distributions.

General rule:

- If the IRA distribution is **fully taxable**, enter the total distribution on **line 4b** and **leave line 4a blank**.
- If an IRS exception applies, enter the **gross distribution on line 4a**, compute the taxable amount for **line 4b**, and complete **line 4c** as required.

If any federal income tax was withheld, attach the Form(s) 1099-R to the return (1099-R box 4 → line 25b, independent of the line 4 path).

---

## 3. 2025 Exceptions That Change 4a / 4b / 4c Reporting

### 3.1 Exception 1 — Rollover

If part or all of the IRA distribution was rolled over:

- enter the **total distribution** on `line 4a`
- check `line 4c box 1`
- if the entire distribution was rolled over, enter `0` on `line 4b`
- if only part was rolled over, enter the portion **not** rolled over on `line 4b` (unless Exception 2 also applies to that portion)

If the rollover was into a qualified plan or was completed in 2026, include an explanatory statement. This sets the non-blocking `IRA_ROLLOVER_ATTACHMENT_REVIEW` flag.

Notes:

- A rollover generally must be completed within 60 days after receipt.
- A direct trustee-to-trustee transfer is not the same as a taxable distribution followed by a rollover.
- The once-per-year rollover rule is relevant to IRA-to-IRA personal rollovers, but not to trustee-to-trustee transfers or Roth conversions.

### 3.2 Exception 2 — Form 8606

Enter the total distribution on `line 4a` and use Form 8606 to compute `line 4b` if any of these apply:

1. A distribution from a traditional IRA with nondeductible contributions for 2025 or an earlier year.
2. A Roth IRA distribution that is not fully excludable under the IRS shortcut rules (`hasRothIraDistributions` AND NOT `allRothEntriesFullyQualified`).
3. A traditional-to-Roth IRA conversion in 2025.
4. A 2024 or 2025 IRA contribution returned, with earnings or less any loss, by the due date of the return (`returnOfContributionAmount`).
5. Excess contributions from an earlier year returned in 2025.
6. Recharacterization between Roth and traditional IRA treatment.

Form 8606 is also used in certain inherited-IRA basis situations and divorce-basis-adjustment situations.

Exception 2 does NOT set a line 4c checkbox — Form 8606 itself is the disclosure.

### 3.3 Exception 3 — Qualified Charitable Distribution (QCD)

If all or part of the IRA distribution is a QCD:

- enter the **total distribution** on `line 4a`
- if the entire distribution is a QCD, enter `0` on `line 4b`
- if only part is a QCD, enter the non-QCD part on `line 4b` (unless Exception 2 also applies)
- check `line 4c box 2`

2025 QCD rules:

- Must be paid directly by the IRA trustee to an eligible charity.
- Taxpayer must be at least age 70½ when the distribution is made.
- Cannot come from an ongoing SEP or SIMPLE IRA.
- Annual exclusion cap: **$108,000** per person for 2025.
- One-time split-interest-entity election cap: **$54,000**, included in the $108,000 annual cap.
- If the taxpayer makes the one-time QCD to a split-interest entity, an attachment / statement may be required — this sets the non-blocking `IRA_QCD_SIE_ATTACHMENT_REVIEW` flag.

QCD basis interaction: if the IRA has basis, the QCD is treated as coming first from otherwise taxable amounts.

### 3.4 Exception 4 — HSA Funding Distribution (HFD)

If all or part of the IRA distribution is a one-time HSA funding distribution:

- enter the **total distribution** on `line 4a`
- if the entire distribution is excludable HFD, enter `0` on `line 4b`
- if only part is HFD, enter the portion that is not HFD on `line 4b` (unless Exception 2 also applies)
- check `line 4c box 3` and enter `HFD` in the write-in space (auto-prepended by the backend)

HFD notes:

- Generally a once-in-a-lifetime direct transfer from IRA to HSA.
- Cannot come from an ongoing SEP or SIMPLE IRA.
- If the IRA has basis, the HFD is treated as paid first from otherwise taxable income.

---

## 4. Multiple Exceptions and Breakout Statement Rule

If more than one exception applies:

- check each applicable box on `line 4c`
- include a breakout statement showing the amount for each exception category

Example breakout text:

```
Line 4b Exception Breakdown: Rollover $1,000; HFD $500
```

**2025 waiver**: a breakout statement is NOT required if the only combination is **Exception 2 plus exactly one other exception** (the waiver is gated on the user-asserted `onlyException2AndOneOtherAppliesOnReturn`).

If the breakout statement is required and the user has not confirmed it is prepared, the system emits blocking flag `LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED`.

---

## 5. Inputs Required for Correct 2025 Treatment

### 5.1 Always required from statements

All IRA-related 1099-R forms for taxpayer and spouse. Fields commonly needed:

- `iraSepSimple` (IRA/SEP/SIMPLE checkbox) — **gate**: non-IRA entries flow to lines 5a / 5b / 5c
- box 1 gross distribution (`grossDistributionAmount`)
- box 2a taxable amount (`taxableAmountAmount`)
- box 2b taxable amount not determined (`taxableAmountNotDetermined`)
- box 4 federal withholding (`federalIncomeTaxWithheldAmount`) — feeds line 25b, NOT line 4
- box 7 distribution code(s) (`distributionCodes`)
- `recipientTIN` for per-person SSN attribution

### 5.2 Required user inputs not reliably available from 1099-R

From `ira-income-taxpayer` / `ira-income-spouse` personal forms:

- prior-year traditional IRA basis (Form 8606 line 14, `priorYearTraditionalIraBasis`)
- current-year nondeductible traditional IRA contributions
- after-year-end contributions designated for 2025, if applicable
- year-end value of all traditional / SEP / SIMPLE IRAs (Form 8606 Part I)
- rollover amount (`totalIraRolloverAmount`) and rollover-into-qualified-plan-or-2026 flag
- QCD amount (`totalQcdAmount`); inherited IRA QCD amount (`inheritedIraQcdAmount`); deductible IRA contributions after age 70½ (`deductibleIraContributionsAfterAge70Half`); one-time SIE QCD flag (`hasOneTimeQcdToSplitInterestEntity`)
- HFD amount (`totalHfdAmount`)
- amount converted to Roth (`totalTraditionalIraConvertedToRothFor8606Line8`)
- return-of-contribution amount (`returnOfContributionAmount`) — excluded from Form 8606 line 7
- inherited traditional IRA distribution amount (`inheritedTraditionalIraDistributionAmount`) — excluded from Form 8606 line 7
- Roth contribution basis, Roth conversion / rollover basis (Form 8606 Part III inputs)
- line 4c write-in code (`hasOtherLine4cWriteInCode`), text (`line4cOtherWriteInText`), amount (`line4cOtherWriteInAmount`)
- multi-exception assertions: `moreThanOneLine4ExceptionAppliesOnReturn`, `onlyException2AndOneOtherAppliesOnReturn`, `exceptionBreakoutStatementPrepared`

---

## 6. Computation Rules

### 6.1 Fully-taxable simple case (line 4a blank)

```
fullyTaxableOverall = hasPositiveAmount(grossIra)
                      AND !hasAnyException        // no rollover, QCD, HFD, Exception 2, other write-in
                      AND hasPositiveAmount(taxableIra)
                      AND grossIra.equals(taxableIra)
line4a = fullyTaxableOverall ? null : roundMoney(grossIra)
```

Per IRS rule: when ALL conditions hold, line 4a is rendered as blank in the PDF (null on `Income.iraDistributions`).

### 6.2 Per-person taxable computation

```
taxableBox2a = Σ 1099-R box 2a (IRA-only filtered, person-attributed)

// QCD effective amount (post-70½ deduction applies only to OWN IRA, not inherited)
ownIraQcdAmount     = max(0, totalQcdAmount − inheritedIraQcdAmount)
effectiveOwnQcd     = max(0, ownIraQcdAmount − deductibleIraContributionsAfterAge70Half)
effectiveQcdAmount  = effectiveOwnQcd + inheritedIraQcdAmount

taxableAfterExceptions = subtractNonNegative(
    taxableBox2a,
    addNonNull(addNonNull(rolloverAmount, effectiveQcdAmount), hfdAmount)
)
```

### 6.3 Form 8606 override path

When `hasException2 == true` (any of the 5 triggers fires):

```
buildForm8606(person, iraForm, grossTraditionalIra) → Form8606
form8606Taxable = addNonNull(addNonNull(Part1Line15c, Part2Line18), Part3Line25c)
if (form8606Taxable != null) taxableAmount = form8606Taxable
else                          taxableAmount = taxableAfterExceptions
```

The override is exclusive: when Form 8606 produces a non-null taxable amount, it replaces (does not add to) `taxableAfterExceptions`. This prevents double-counting because Form 8606 Part I already handles basis recovery and traditional IRA exceptions internally.

### 6.4 Roth code Q handling

Per-entry tracking distinguishes Roth code Q (fully qualified — 5-year rule met AND qualifying event) from codes J / T (non-qualified Roth):

- `rothCodeJOrTCount` increments for any Roth entry with code J or T.
- `allRothEntriesFullyQualified` is TRUE when every Roth entry has code Q (i.e., no J/T entries).
- When `allRothEntriesFullyQualified == true`, `hasRothIraDistributions` does NOT contribute to `hasException2` → no Form 8606 Part III generated.

### 6.5 Grossing up traditional IRA for Form 8606 line 7

`grossTraditionalIra` accumulates box 1 from non-Roth-coded 1099-R entries (excludes codes J / Q / T). Form 8606 Part I line 7 is computed as:

```
form8606Line7 = grossTraditionalIra
              − rolloverAmount
              − totalQcdAmount           // full QCD, not effectiveQcd (per IRS instructions)
              − totalHfdAmount
              − totalTraditionalIraConvertedToRothFor8606Line8
              − returnOfContributionAmount
              − inheritedTraditionalIraDistributionAmount
```

(Zero-floor; never negative.) Users are never asked to perform this arithmetic manually.

### 6.6 Per-return aggregation

```
grossIra   = addNonNull(taxpayer.grossIraDistributions, spouse.grossIraDistributions)
taxableIra = addNonNull(taxpayer.taxableIraDistributions, spouse.taxableIraDistributions)
line4b     = roundMoney(taxableIra)        // always present when IRA activity (zero allowed)
line4a     = fullyTaxableOverall ? null : roundMoney(grossIra)   // blank-when-fully-taxable
```

### 6.7 MFJ handling

On an MFJ return:

- taxpayer and spouse remain separate IRA owners
- lines 4a / 4b / 4c are combined at the return level
- Form 8606 remains per-person, never joint
- a return may produce no Form 8606, taxpayer-only, spouse-only, or both

### 6.8 MFS guard

`computeIraDistributions` takes a `boolean isMfsReturn` parameter. On MFS, `iraIncomeSpouse=null` and `spouseSsn=null`, so spouse-attributed 1099-R entries fail `belongsToPersonIra` and spouse-side `computeIraForPerson` returns null. This single-guard cascade is the extension of the MFS pattern to 9 orchestrators.

Lock-in test: `mfsExcludesSpouseIraFromLine4a`.

---

## 7. Line 4c computation

### 7.1 Per-person exception flags

Inside `computeIraForPerson`:

- `hasRollover` = `hadIraRollover == true` OR `hasPositiveAmount(totalIraRolloverAmount)`
- `hasQcd` = `hadQcd == true` OR `hasPositiveAmount(totalQcdAmount)`
- `hasHfd` = `hadHfd == true` OR `hasPositiveAmount(totalHfdAmount)`
- `hasOtherLine4cWriteIn` = `hasOtherLine4cWriteInCode == true`
- `hasBox3Other` = `hasHfd OR hasOtherLine4cWriteIn`
- `hasException2` = `hasNondeductibleTraditionalBasis OR hasTraditionalToRothConversion OR (hasRothIraDistributions AND NOT allRothEntriesFullyQualified) OR hasPositiveAmount(returnOfContributionAmount) OR hasPositiveAmount(inheritedTraditionalIraDistributionAmount)`

Per-person write-in text builder:

```
line4cBox3Text_person =
    (hasHfd ? "HFD" : null)
    + (hasOtherLine4cWriteIn ? otherWriteInText : null)
  joined with ";"
```

### 7.2 Return-level box aggregation (OR across spouses)

```
line4cBox1     = taxpayer.hasRollover()  || spouse.hasRollover()
line4cBox2     = taxpayer.hasQcd()       || spouse.hasQcd()
line4cBox3     = taxpayer.hasBox3Other() || spouse.hasBox3Other()
line4cBox3Text = joinOtherWriteInTokens(taxpayer.line4cBox3Text(), spouse.line4cBox3Text())
hasException2  = taxpayer.hasException2() || spouse.hasException2()   // NOT a line 4c box
```

`joinOtherWriteInTokens` uses a `LinkedHashSet` with split-on-semicolon to deduplicate (prevents `"HFD; HFD"` when both spouses had HFDs).

### 7.3 Breakout-statement-required logic (two paths)

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

if (statementRequired AND !exceptionBreakoutStatementPrepared):
    emit BLOCKING flag LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED
```

The user-asserted path overrides the auto-detection path by design (lets the user confirm what the IRS form requires even when auto-detection misses an edge case).

### 7.4 Breakout statement text generation

When `statementRequired` is true, the system builds descriptive text:

```
Line 4b Exception Breakdown: Rollover $X; QCD $Y; HFD $Z; Form 8606 (Exception 2); <other>
```

stored on `IraComputation.line4cBreakoutStatementText`.

---

## 8. Decision summary — what fires on line 4c?

| Scenario | Box 1 | Box 2 | Box 3 | Write-in | Statement required? |
|---|---|---|---|---|---|
| No IRA activity | — | — | — | — | no |
| Fully-taxable simple case | — | — | — | — | no |
| Rollover only | ✓ | — | — | — | no |
| QCD only | — | ✓ | — | — | no |
| HFD only | — | — | ✓ | `HFD` | no |
| Form 8606 only (Exception 2) | — | — | — | — | no (Form 8606 is the disclosure) |
| Rollover + QCD | ✓ | ✓ | — | — | **yes** |
| Exception 2 + Rollover (waiver) | ✓ | — | — | — | no (waiver) |
| Exception 2 + Rollover + QCD | ✓ | ✓ | — | — | **yes** (count > 2) |
| MFS, only spouse had rollover | — | — | — | — | no (MFS guard suppresses spouse) |

---

## 9. Validation flags

| Flag | Severity | Condition |
|---|---|---|
| `IRA_STATEMENT_UPLOAD_REQUIRED` | BLOCKING | `hadIraDistributions == true` but no 1099-R uploaded for the person |
| `LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED` | BLOCKING | Multi-exception case applies AND `exceptionBreakoutStatementPrepared != true` (2025 waiver: Exception 2 + exactly 1 other) |
| `IRA_ROLLOVER_ATTACHMENT_REVIEW` | NON-BLOCKING | `rolloverIntoQualifiedPlanOrCompletedInFollowingYear == true` for taxpayer or spouse |
| `IRA_QCD_SIE_ATTACHMENT_REVIEW` | NON-BLOCKING | `hasOneTimeQcdToSplitInterestEntity == true` for taxpayer or spouse |
| `IRA_DISTRIBUTION_TAXABLE_NOT_DETERMINED` | NON-BLOCKING (verification) | Any 1099-R IRA entry has box 2b checked |

Implicit gates (silent normalization):

- `taxableAfterExceptions` floors at zero via `subtractNonNegative`
- `form8606Line7` floors at zero
- Form 8606 Part I line 15c is itself `max(0, ...)`

---

## 10. Output forms

| Output | When | Notes |
|---|---|---|
| `form1040.income.iraDistributions` | non-null when line 4a non-blank | Whole-dollar HALF_UP rounded |
| `form1040.income.taxableIraDistributions` | non-null when IRA activity | 4th operand in line 9 |
| `form1040.income.line4cBox1Rollover / 4cBox2Qcd / 4cBox3Other` | Boolean (TRUE-or-null pattern at the setters) | Lines 7544 / 7547 / 7550 |
| `form1040.income.line4cBox3Text` | String (joined "HFD" + other write-in) | Line 7553 |
| `Form 8606` (taxpayer) | `taxpayer.hasException2() == true` | Part I + Part II + Part III as needed |
| `Form 8606` (spouse) | `spouse.hasException2() == true` | Per-person, never joint |
| `IraComputation.line4cBreakoutStatementText` | When `statementRequired` | Descriptive attachment text |
| `IraComputation.line4aRolloverAttachmentText` | When `rolloverIntoQualifiedPlanOrCompletedInFollowingYear` | Explanatory text |
| `IraComputation.line4cQcdSieAttachmentText` | When `hasOneTimeQcdToSplitInterestEntity` | SIE election explanatory text |

---

## 11. Validation Rules

### 11.1 Record-level

- Non-IRA 1099-R records (`iraSepSimple != true`) must not flow to lines 4a / 4b / 4c.
- When box 2b is checked, the trustee did not determine the taxable amount — verify via supplemental facts.
- A QCD amount, rollover amount, HFD amount, or Roth conversion amount cannot exceed the gross distribution total for the affected IRA(s).

### 11.2 Return-level

- If line 4a is blank, all included IRA distributions must be fully taxable and no exception may apply.
- If any line 4c checkbox is checked, line 4a should equal the gross IRA distribution total for the affected return.
- If more than one exception applies, enforce the 2025 breakout statement rule and its narrow waiver.

---

## 12. Current Application Behavior

### 12.1 Frontend inputs

Taxpayer and spouse complete separate supplemental forms (`ira-income-taxpayer` / `ira-income-spouse`):

- rollover facts (amount, rollover type)
- QCD facts (amount, inherited portion, post-70½ deductible contribution reduction, SIE flag)
- HFD facts (amount)
- return-of-contribution / recharacterization amount
- inherited traditional IRA distribution amount
- Form 8606 Part I / II / III inputs (basis, conversion, year-end values)
- attachment / statement confirmations
- other line 4c write-in facts

Form 8606 Part I line 7 is fully auto-computed (since 2026-04-15). The backend accumulates `grossTraditionalIra` from non-Roth-coded 1099-R entries (box 1, excluding codes J / Q / T) and subtracts: rollover + full QCD + HFD + Roth conversion + return-of-contribution + inherited traditional IRA amount. Users are never asked to perform this arithmetic manually.

### 12.2 Backend computation

- Computes taxpayer and spouse IRA results separately via `computeIraForPerson` (TaxReturnComputeService.java:9249).
- Aggregates them into Form 1040 lines 4a / 4b / 4c via `computeIraDistributions` (line 8745).
- Generates taxpayer / spouse Form 8606 outputs when required.
- Raises review flags as described in §9.

### 12.3 Tax return UI outputs

The tax return section persists and renders:

- Form 1040 line 4a
- Form 1040 line 4b
- Form 1040 line 4c box 1 / 2 / 3 + box 3 text
- Form 8606 (taxpayer)
- Form 8606 (spouse)

### 12.4 Code anchors

| Path | Reference |
|---|---|
| `computeIraDistributions` orchestrator | `TaxReturnComputeService.java:8745` |
| `computeIraForPerson` per-person aggregator | line 9249 |
| `fullyTaxableOverall` derivation | line 9192 |
| `line4a` blank-when-fully-taxable | line 9208 |
| `line4cBox1 / 2 / 3` OR aggregation | lines 8820–8822 |
| `joinOtherWriteInTokens` deduplication | line 8824 |
| `LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED` emission | line 8879 |
| `IRA_ROLLOVER_ATTACHMENT_REVIEW` emission | line 8930 |
| `IRA_QCD_SIE_ATTACHMENT_REVIEW` emission | line 8949 |
| `buildIncome` line 4c setters (TRUE-or-null) | lines 7544 / 7547 / 7550 / 7553 |

---

## 13. Out of scope (per CLAUDE.md)

- NIIT (Form 8960)
- Self-employment IRA contribution paths
- QCD $108,000 annual cap and SIE $54,000 cap enforcement (deferred — see `outstanding.md`; IRS document-matching is the safety net)

---

## 14. Invariants

- `line 4b ≥ 0` (zero-floor at `taxableAfterExceptions` + Form 8606 Part I line 15c is itself `max(0, …)`)
- `line 4b ≤ line 4a` when line 4a non-null
- `line 4a` is null (blank) iff `fullyTaxableOverall == true`
- `line 4a` is NOT in line 9 (gross — informational only)
- `line 4b` IS in line 9 (4th operand of the `addNonNull` chain)
- Form 8606 is per-person; never joint
- Roth code Q alone never triggers Form 8606 Part III
- Post-70½ deductible contribution reduction applies only to OWN IRA QCDs (not inherited)
- Line 4c box flags are OR-aggregated across spouses
- Line 4c box 3 write-in text auto-prepends `HFD` when `hasHfd`

---

## 15. Compute order and dependencies

1. `prepare(...)` runs upstream personal-form / statement reads, including filing status and 1099-R entries.
2. `computeIraDistributions(...)` is called with `isMfsReturn` (call site `TaxReturnComputeService.java:486`).
3. `computeIraForPerson` runs for taxpayer and (on MFJ) spouse: per-person 1099-R filtering + exception detection + Form 8606 generation + `taxableAfterExceptions` chain.
4. Return-level aggregation: gross + taxable; line 4c box / write-in / statement logic.
5. `buildIncome` writes `line 4a` (when non-null), `line 4b`, and the line 4c setters onto `form1040.income`.

Upstream dependencies: `ira-income-{taxpayer,spouse}` personal forms; 1099-R statements; `identification-{taxpayer,spouse}` (SSN); filing status; reference data ($108k QCD cap — deferred enforcement).

Downstream consumers:

- `line 4b` → `line 9` total income (4th operand) → AGI → taxable income → line 16 tax
- `line 4a` → no arithmetic propagation (informational / disclosure)
- Form 8606 (taxpayer / spouse) — filed with return when `hasException2`
- `line 25b` withholding — sourced from 1099-R box 4 independently of the line 4 path
- Line 4c boxes / write-in / breakout text → PDF rendering only

---

## 16. Implementation Notes for This Product

This product treats line 4c as a structured output:

- box 1 = rollover
- box 2 = QCD
- box 3 = other write-in (auto-prepends `HFD`)
- box 3 text can include other IRS-required write-in text via deduplicated joiner

The product also supports:

- separate taxpayer / spouse Form 8606 generation
- aggregation of both spouses into Form 1040 line 4 totals
- e2e coverage for: exception-heavy IRA cases, Form 8606 generation, simple fully-taxable cases where line 4a stays blank

---

## 17. Known Limitations / Resolved Gaps

Resolved (all 2026-04):

1. ~~Form 8606 generated for distribution code Q (fully qualified Roth)~~ — Resolved 2026-04-14. `rothCodeJOrTCount` tracked separately; when all Roth-coded entries have code Q, `hasRothIraDistributions` no longer contributes to `hasException2`.
2. ~~QCD exclusion not reduced by post-70½ deductible contributions~~ — Resolved 2026-04-15. `deductibleIraContributionsAfterAge70Half` field added to both IRA income forms; `effectiveOwnQcd = max(0, ownIraQcdAmount − post70halfDeduction)`; inherited QCD carve-out preserved.
3. ~~`belongsToPersonIra()` TIN-fallback path untested~~ — Resolved 2026-04-14.
4. ~~MFJ single-spouse Form 8606 paths untested~~ — Resolved 2026-04-14.
5. ~~Disaster repayment path untested~~ — Resolved 2026-04-14.
6. ~~Form 8606 Part I line 7 required manual arithmetic~~ — Resolved 2026-04-15. Auto-computed from `grossTraditionalIra` minus exclusions; two new user fields (`returnOfContributionAmount`, `inheritedTraditionalIraDistributionAmount`).
7. ~~MFS guard at `computeIraDistributions`~~ — Resolved 2026-05-11. Single-guard cascade extended to 9 orchestrators.

Deferred (per `outstanding.md`):

- QCD $108,000 annual cap and SIE $54,000 cap enforcement (narrow population; IRS validation is safety net).

---

## 18. Sources

Primary IRS sources used:

- Instructions for Form 1040 (2025): https://www.irs.gov/instructions/i1040gi
- Instructions for Form 8606 (2025): https://www.irs.gov/instructions/i8606
- Publication 590-B (2025): https://www.irs.gov/publications/p590b
- Publication 526 (2025), QCD cap and SIE amount: https://www.irs.gov/publications/p526
- IRS IRA distribution FAQs: https://www.irs.gov/retirement-plans/retirement-plans-faqs-regarding-iras-distributions-withdrawals

Local references used:

- `C:\us-tax\docs\books\i1040gi_2025.txt`
- `C:\us-tax\docs\books\J.K. Lasser Institute - J.K. Lasser's Your Income Tax 2025, Professional Edition (2025) - libgen.li.txt`

---

## 19. Verification log

| Date | Auditor | Scope | Outcome |
|---|---|---|---|
| 2026-05-11 | 4a.xlsx Code Validation walkthrough | Line 4a verification (10 issues) | All closed. MFS guard added to `computeIraDistributions` (9 orchestrators in cascade); line 4a blank-when-fully-taxable verified; iraSepSimple filter verified; Roth code Q two-counter design verified; QCD post-70½ own-vs-inherited carve-out verified. QCD $108k / SIE $54k cap enforcement deferred to `outstanding.md`. |
| 2026-05-11 | 4b.xlsx Code Validation walkthrough | Line 4b verification (10 issues) | All closed. `taxableAfterExceptions` three-protection chain (zero-floor + null-preservation + Form 8606 override) verified; Form 8606 override gate simplified (redundant condition removed). Bilateral 4a/4b gross-vs-taxable coverage established. |
| 2026-05-11 | 4c.xlsx Code Validation walkthrough | Line 4c verification (10 issues) | All closed. Three independent box aggregation verified; `joinOtherWriteInTokens` deduplication verified (avoids "HFD; HFD"); two-path breakout-statement logic verified (user-asserted overrides auto-detected); line 4c structurally isolated from arithmetic (Boolean / String types). |
