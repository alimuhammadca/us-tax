---
name: line-3ab-dividend-income
description: Complete implementation and status of Form 1040 Lines 3a/3b dividend income
type: project
---

# Lines 3a/3b — Qualified and Ordinary Dividends

Tax year: **2025**

---

## What lines 3a and 3b are

| Line | IRS label | AGI impact |
|---|---|---|
| 3b | Ordinary dividends | Flows into line 9 total income |
| 3a | Qualified dividends | Informational subset of line 3b; affects tax computation method |

Key invariant: `0 <= line 3a <= line 3b`. Line 3a is always a subset of line 3b; it is never independently additive to AGI.

---

## Formula

### Line 3b (ordinary dividends)

```
For each 1099-DIV attributed to this person:
  ordinaryFromStatements += totalOrdinaryDividendsAmount  (box 1a)

line3b = ordinaryFromStatements
       + manualOrdinaryDividendsNotOnStatements  (personal form)
       - nomineeOrdinaryDividends                 (personal form)
line3b = max(0, line3b)
```

### Line 3a (qualified dividends)

```
For each 1099-DIV attributed to this person:
  candidateQualified += qualifiedDividendsAmount  (box 1b)

disallowed = nomineeQualifiedDividends
           + nonQualifiedFromHoldingPeriodCommon61of121
           + nonQualifiedFromHoldingPeriodPreferred91of181
           + nonQualifiedFromRelatedPaymentObligationShortSale
           + nonQualifiedPaymentsInLieu
           + nonQualifiedSurrogateForeignCorporationDividends

line3a = candidateQualified
       + manualQualifiedDividendsNotOnStatements  (personal form)
       - disallowed
line3a = max(0, line3a)
line3a = min(line3a, line3b)  -- IRS invariant cap
```

### Form 6251 line 2g (AMT private activity bond dividends)

```
For each 1099-DIV attributed to this person:
  pabDividends += specifiedPrivateActivityBondDividendsAmount  (box 13)
```

Box 13 is the AMT subset of box 12 (exempt-interest dividends). It is accumulated in `DividendPersonTotals.pabDividends` → `DividendComputation.form6251Line2gDividends` and added to `form6251Line2g` alongside 1099-INT box 9 in `computeInterestIncome()`.

---

## Input forms

### Personal form: `dividend-income-taxpayer`

Firestore path: `users/{uid}/dividend-income-taxpayer`

| Field | Type | Effect |
|---|---|---|
| `hadDividendIncome` | boolean | Gates entire dividend workflow |
| `hasUploadedAtLeastOne1099DivStatement` | boolean | Upload gate — blocks save if false |
| `received1099Div` | boolean | Whether taxpayer received 1099-DIV |
| `uploaded1099Div` | boolean | Whether received 1099-DIV was uploaded |
| `confirmAllReceived1099DivUploaded` | boolean | Confirmation gate |
| `manualOrdinaryDividendsNotOnStatements` | amount | Added to line 3b |
| `manualQualifiedDividendsNotOnStatements` | amount | Added to candidate qualified |
| `hasNomineeDividends` | boolean | Gates nominee section |
| `nomineeOrdinaryDividends` | amount | Reduces line 3b |
| `nomineeQualifiedDividends` | amount | Counts toward disallowed qualified |
| `nonQualifiedFromHoldingPeriodCommon61of121` | amount | Reduces line 3a (61-of-121 rule) |
| `nonQualifiedFromHoldingPeriodPreferred91of181` | amount | Reduces line 3a (91-of-181 rule) |
| `nonQualifiedFromRelatedPaymentObligationShortSale` | amount | Reduces line 3a |
| `nonQualifiedPaymentsInLieu` | amount | Reduces line 3a |
| `nonQualifiedSurrogateForeignCorporationDividends` | amount | Reduces line 3a |
| `willIssueNominee1099DivToActualOwner` | boolean | Compliance checklist only; no compute effect |
| `willFileNominee1096And1099DivWithIrs` | boolean | Compliance checklist only; no compute effect |

**Note:** The taxpayer form owns all return-level statement upload gating. The spouse form has no upload gating fields.

### Personal form: `dividend-income-spouse`

Firestore path: `users/{uid}/dividend-income-spouse`

Contains the same computation fields as taxpayer (minus the upload gating fields):
- `hadDividendIncome`, `manualOrdinaryDividendsNotOnStatements`, `manualQualifiedDividendsNotOnStatements`
- `hasNomineeDividends`, `nomineeOrdinaryDividends`, `nomineeQualifiedDividends`
- All five `nonQualified*` disallowance fields

Only applicable to MFJ returns. The Angular spouse component is disabled when `isJointReturn == false`.

---

## Statement sources

| Statement | Collection | Fields consumed | Destination |
|---|---|---|---|
| 1099-DIV | `users/{uid}/1099-div` | `recipientTIN`, `payerNameAddress` | Entry attribution and payer name |
| 1099-DIV | `users/{uid}/1099-div` | `totalOrdinaryDividendsAmount` (box 1a) | Line 3b |
| 1099-DIV | `users/{uid}/1099-div` | `qualifiedDividendsAmount` (box 1b) | Candidate line 3a |
| 1099-DIV | `users/{uid}/1099-div` | `specifiedPrivateActivityBondDividendsAmount` (box 13) | Form 6251 line 2g |
| 1099-DIV | `users/{uid}/1099-div` | `exemptInterestDividendsAmount` (box 12) | Line 2a (NOT lines 3a/3b) |

**Not read by dividend computation** (handled elsewhere):

| Box | Field | Routed to |
|---|---|---|
| box 2a | `totalCapitalGainDistributionsAmount` | Line 7a via capital gain computation |
| box 3 | `nondividendDistributionsAmount` | Not an income line; basis adjustment |
| box 5 | `section199ADividendsAmount` | Form 8995 / QBI deduction |
| box 6 | `investmentExpensesAmount` | Schedule A itemized deductions |
| box 7 | `foreignTaxPaidAmount` | Form 1116 / foreign tax credit |
| box 12 | `exemptInterestDividendsAmount` | Line 2a |

---

## Output JSON fields

| JSON path | Java class / field | Meaning |
|---|---|---|
| `form1040.income.ordinaryDividends` | `Income.ordinaryDividends` | Form 1040 line 3b |
| `form1040.income.qualifiedDividends` | `Income.qualifiedDividends` | Form 1040 line 3a |
| `scheduleB.line6TotalOrdinaryDividends` | `ScheduleB.line6TotalOrdinaryDividends` | Schedule B Part II line 6 = line 3b |
| `scheduleB.dividendItems` | `List<ScheduleBInterestItem>` | Per-payer dividend detail rows for Schedule B Part II |
| `form6251.line2gPrivateActivityBondInterest` | `Form6251.line2gPrivateActivityBondInterest` | Includes PAB dividends from 1099-DIV box 13 |

`scheduleB` is `null` when Schedule B is not required. `form6251` is `null` when no AMT triggers exist.

---

## Blocking flags emitted

| Flag | Condition | Blocking |
|---|---|---|
| `DIVIDEND_STATEMENT_UPLOAD_REQUIRED` | `hadDividendIncome == true` and `hasUploadedAtLeastOne1099DivStatement != true` | Yes |
| `DIVIDEND_1099_DIV_UPLOAD_CONFIRMATION_REQUIRED` | `hadDividendIncome == true` and `confirmAllReceived1099DivUploaded != true` | Yes |
| `MISSING_UPLOADED_1099_DIV_DIVIDEND_WORKFLOW` | `received1099Div == true` and `uploaded1099Div != true` | Yes |
| `QUALIFIED_DIVIDENDS_LIMITED_TO_ORDINARY_DIVIDENDS` | Line 3a computed > line 3b; capped to line 3b | No (informational) |

---

## Schedule B trigger conditions (from dividends)

| Trigger | Check |
|---|---|
| Ordinary dividends > $1,500 | `line3b.compareTo(new BigDecimal("1500")) > 0` |
| Nominee dividends present | `taxpayer.nomineeDividendsPresent() || spouse.nomineeDividendsPresent()` |

Schedule B is a shared object between lines 2a/2b (Part I — interest) and lines 3a/3b (Part II — dividends). It is generated in `buildScheduleB()` when `scheduleBRequired == true` from either interest or dividend triggers.

---

## Backend implementation

**Primary orchestration:** `computeInterestIncome()` in `TaxReturnComputeService.java` (~line 3922)  
**Dividend pass:** `computeDividendIncome()` (~line 4282) — calls `computeDividendForPerson()` for taxpayer then spouse  
**Per-person aggregation:** `computeDividendForPerson()` (~line 4345) — reads 1099-DIV entries, applies personal form adjustments  
**Schedule B builder:** `buildScheduleB()` — populates `dividendItems` list and `line6TotalOrdinaryDividends`

**Internal record types:**

| Record | Key fields |
|---|---|
| `DividendComputation` | `line3aQualifiedDividends`, `line3bOrdinaryDividends`, `scheduleBRequiredFromDividends`, `form6251Line2gDividends`, `scheduleBDividendItems` |
| `DividendPersonTotals` | `qualifiedDividends`, `ordinaryDividends`, `nomineeDividendsPresent`, `disallowedQualifiedDividends`, `pabDividends`, `scheduleBDividendItems` |

**Entry attribution:** `belongsToPerson()` matches `recipientTIN` (digits-only) against taxpayer and spouse SSNs loaded from `identification-taxpayer` / `identification-spouse` personal forms. When no personal forms exist, legacy mode attributes all entries to taxpayer.

**Legacy mode:** `useLegacyDividendComputation = true` when neither dividend personal form has any data. In legacy mode, `computeDividendForPerson()` skips the `personHadDividend` gate and skips all personal-form manual/nominee/disallowance reads, processing only raw 1099-DIV statement totals.

---

## Frontend mapping

**Intake components:**
- `form-dividend-income-taxpayer.component.ts` — taxpayer dividend form (Income sidebar section)
- `form-dividend-income-spouse.component.ts` — spouse dividend form (Income sidebar section, MFJ only)

**Form 1040 tax return preview** (`form-tax-return-1040.component.ts`):

| `buildFieldValues()` key | Source JSON path | IRS field |
|---|---|---|
| `line3a_qualified_dividends` | `form.income.qualifiedDividends` | Form 1040 line 3a |
| `line3b_ordinary_dividends` | `form.income.ordinaryDividends` | Form 1040 line 3b |

**Schedule B display:** `form-tax-return-scheduleb.component.ts` — conditionally shown in Tax Return sidebar when `scheduleB != null`.

---

## YAML intake structure

Both YAML files follow the standard section pattern: `screening` → `statementUploadCheck` → named input sections → `importedStatementFields` (readOnly) → `computedOutputs` (readOnly + computed).

- `C:\us-tax\yamls\3ab-dividend-income-taxpayer.yaml` — includes return-level statement upload gating questions
- `C:\us-tax\yamls\3ab-dividend-income-spouse.yaml` — spouse-specific amounts and adjustments only

---

## Unit test coverage

File: `TaxReturnComputeServiceTest.java`

| Test | What it verifies |
|---|---|
| `dividendBox13FlowsToForm6251Line2g` | 1099-DIV box 13 + 1099-INT box 9 both contribute to Form 6251 line 2g |
| `scheduleBDividendItemsArePopulated` | Per-payer dividend rows in `scheduleB.dividendItems`; Schedule B generated when line 3b > $1,500 |
| Full MFJ dividend test (~line 1595) | Taxpayer + spouse 1099-DIV attribution; manual amounts; nominee subtraction; disallowance categories; Schedule B line 6 |
| `flagsWhenDividendStatementsMissingForEnabledWorkflow` | Three blocking flags when upload gates not satisfied |
| `computesDividendIncomeWithoutScheduleBWhenBelowThresholdAndNoNominee` | Low-dividend path; no Schedule B |

---

## E2E test coverage

| Spec file | Scenarios |
|---|---|
| `line3ab-dividend-income.spec.ts` | (1) Block save when no 1099-DIV uploaded; (2) Full flow: line 3a/3b compute + Schedule B + per-payer items; (3) Low-dividend path: no Schedule B, no Form 6251 |

---

## Downstream consumers

| Consumer | Input from lines 3a/3b | Notes |
|---|---|---|
| Line 9 (total income) | `form1040.income.ordinaryDividends` (line 3b) | Line 3a is a subset; not separately added |
| Line 16 tax computation method | `line3a != null` → QDCG worksheet or Schedule D Tax Worksheet | Triggers special tax method selection |
| Schedule B Part II | `line6TotalOrdinaryDividends`, `dividendItems` | Generated only when `scheduleBRequired == true` |
| Form 6251 line 2g | `form6251Line2gDividends` from 1099-DIV box 13 | Added to PAB interest from 1099-INT box 9 |
| QDCG 0% threshold | 2025: Single $48,350 / MFJ $96,700 | Used in QDCG worksheet |
| QDCG 20% threshold | 2025: Single $533,400 / MFJ $600,050 | Used in QDCG worksheet |

---

## Known gaps

### Gap 1 — Seller-financed mortgage interest Schedule B trigger not implemented (unchanged from 2ab)

Although this is an interest gap, it is noted here because Schedule B is shared. No dividend-specific counterpart exists.

### Gap 2 — No NIIT / Form 8960 integration

Qualified dividends are subject to the 3.8% NIIT when MAGI exceeds $200k/$250k MFJ. Form 8960 is not implemented; this is explicitly out of scope.

### Gap 3 — No 1098-DIV/substitute statement import

The system reads 1099-DIV fields entered manually via the statement form UI. There is no PDF/CSV import workflow for 1099-DIV (unlike W-2). Future enhancement: auto-import from scanned or downloaded PDF statements.

### Gap 4 — No PFIC excess distribution detection on 1099-DIV

Dividends from Passive Foreign Investment Companies (PFICs) — which should go through Form 8621 rather than lines 3a/3b — are not detected automatically. A user must enter the correct amounts. This is partially mitigated by the Form 8621 intake form but no cross-validation exists.

### Gap 5 — Section 199A dividends (box 5) visible in statement form but not cross-validated

`section199ADividendsAmount` (box 5) is collected in the 1099-DIV statement form and consumed by the QBI deduction workflow (Form 8995), but there is no validation that `box5 <= box1a`. An invalid entry would produce a QBI deduction without matching ordinary dividend income.

### Gap 6 — Spouse form missing upload gating (by design, but creates a minor UX gap)

The spouse form has no statement upload check. A spouse can have `hadDividendIncome == true` with no 1099-DIV entries and the system will compute zero dividend income for the spouse with no blocking flag. This is correct behavior (spouse dividends may be entirely on manual entries) but could cause silent misses if statements are accidentally omitted for the spouse.

---

## Out of scope

- Net Investment Income Tax / Form 8960 (NIIT on dividends)
- PFIC excess distributions (Form 8621 handles, but no automatic 1099-DIV ↔ Form 8621 cross-check)
- Constructive dividends (e.g., shareholder loans treated as dividends)
- Section 1368 S-corporation distributions (entered manually; no K-1 cross-check for dividends)
- State-level treatment of dividends (federally qualified dividends often taxed as ordinary income at state level)
