---
name: line-2ab-interest-income
description: Complete implementation and status of Form 1040 Lines 2a/2b interest income
type: project
---

# Lines 2a/2b — Tax-Exempt and Taxable Interest Income

Tax year: **2025**

---

## What lines 2a and 2b are

| Line | IRS label | AGI impact |
|---|---|---|
| 2a | Tax-exempt interest | Informational only — does NOT flow into AGI (line 9) |
| 2b | Taxable interest | Flows into line 9 total income |

Line 2b feeds `form1040.income.totalIncome` (line 9) through `buildIncome()` in `TaxReturnComputeService`.
Line 2a is recorded on the return for informational purposes (e.g. for AMT, IRMAA, and state returns) but does not increase federal AGI.

---

## Formula

### Line 2a (tax-exempt interest)

```
line2a = sum over all 1099-INT: (box8 - box13)
       + sum over all 1099-OID: box11
       + sum over all 1099-DIV: box12
       + taxExemptStatedInterestFrom1099OidBox2  (from personal form — box2 classification)
       + manualTaxExemptInterestNotOnStatements  (from personal form)
       - taxExemptBondPremiumAdjustmentNotInStatements (if payer did not already net it)
```

**Note:** 1099-INT box 9 is already included in box 8 — do NOT add it on top of box 8 (see bugs section).

### Line 2b (taxable interest)

```
line2b = sum over all 1099-INT: (box1 + box3 - box11 - box12)
       + sum over all 1099-OID: (box1 - box6)
       + taxablePortionFrom1099OidBox2Override OR (oidBox2Total - taxExemptStatedInterestFrom1099OidBox2)
       + manualTaxableInterestNotOnStatements   (from personal form)
       - accruedInterestPaidAdjustment           (from personal form)
       - nomineeInterestAdjustment               (from personal form)
       - taxableBondPremiumAdjustmentNotInStatements (from personal form, if not already netted)
       - treasuryBondPremiumAdjustmentNotInStatements (from personal form, if not already netted)
       - oidAcquisitionPremiumAdjustmentNotInStatements (from personal form, if not already netted)
       - savingsBondExclusionAmount              (from taxpayer personal form — Schedule B line 3)
```

### Form 6251 line 2g (AMT private activity bond interest)

```
form6251Line2g = sum over all 1099-INT: box9
```

This is aggregated separately from line 2a and fed into `computeLine17()` (AMT computation) as `pabInterest`.

---

## Sub-inputs

### Statement sources

| Statement | Field key | Destination | Notes |
|---|---|---|---|
| 1099-INT box 1 | `interestIncomeAmount` | line 2b | Ordinary taxable interest |
| 1099-INT box 3 | `usSavingsBondsTreasuryInterestAmount` | line 2b | Treasury/savings bond interest |
| 1099-INT box 8 | `taxExemptInterestAmount` | line 2a | Total tax-exempt interest (includes box 9) |
| 1099-INT box 9 | `specifiedPrivateActivityBondInterestAmount` | Form 6251 line 2g only | Already in box 8; subset for AMT |
| 1099-INT box 11 | `bondPremiumAmount` | Reduces line 2b (box1) | Taxable bond premium |
| 1099-INT box 12 | `bondPremiumTreasuryAmount` | Reduces line 2b (box3) | Treasury bond premium |
| 1099-INT box 13 | `bondPremiumTaxExemptAmount` | Reduces line 2a | Tax-exempt bond premium |
| 1099-OID box 1 | `originalIssueDiscountAmount` | line 2b | OID less acquisition premium |
| 1099-OID box 2 | `otherPeriodicInterestAmount` | line 2b or 2a | Classification by personal form field |
| 1099-OID box 6 | `acquisitionPremiumAmount` | Reduces line 2b | OID acquisition premium |
| 1099-OID box 11 | `taxExemptOidAmount` | line 2a | Tax-exempt OID |
| 1099-DIV box 12 | `exemptInterestDividendsAmount` | line 2a | Exempt-interest dividends |
| 1099-DIV box 13 | `specifiedPrivateActivityBondDividendsAmount` | Form 6251 line 2g | AMT private activity bond subset of box 12; implemented 2026-04-13 |

**Note:** 1099-DIV box 13 is the AMT subset of box 12 (same relationship as box 9 to box 8 on the 1099-INT). It feeds Form 6251 line 2g in addition to 1099-INT box 9 (implemented 2026-04-13).

### Personal form inputs (taxpayer)

Form ID: `interest-income-taxpayer`  
Firestore path: `users/{uid}/interest-income-taxpayer`

| Field | Type | Effect |
|---|---|---|
| `hadInterestIncome` | boolean | Gates entire interest workflow |
| `manualTaxableInterestNotOnStatements` | amount | Added to line 2b |
| `manualTaxExemptInterestNotOnStatements` | amount | Added to line 2a |
| `taxExemptStatedInterestFrom1099OidBox2` | amount | Reclassifies portion of 1099-OID box 2 to line 2a |
| `taxablePortionFrom1099OidBox2Override` | amount | Overrides computed taxable portion of box 2 |
| `accruedInterestPaidAdjustment` | amount | Reduces line 2b; adds Schedule B adjustment line |
| `nomineeInterestAdjustment` | amount | Reduces line 2b; adds Schedule B adjustment line |
| `taxableBondPremiumAdjustmentNotInStatements` | amount | Reduces line 2b (not-yet-netted premium) |
| `treasuryBondPremiumAdjustmentNotInStatements` | amount | Reduces line 2b (Treasury premium) |
| `taxExemptBondPremiumAdjustmentNotInStatements` | amount | Reduces line 2a (tax-exempt premium) |
| `oidAcquisitionPremiumAdjustmentNotInStatements` | amount | Reduces line 2b (OID acquisition premium) |
| `claimsSavingsBondExclusionForm8815` | boolean | Triggers Schedule B requirement |
| `savingsBondExclusionAmount` | amount | Schedule B line 3 savings bond exclusion; reduces line 2b |
| `reducingInterestBelow1099ByBondPremium` | boolean | Triggers Schedule B requirement |
| `reducingOidBelow1099ByAcquisitionPremium` | boolean | Triggers Schedule B requirement |
| `hasForeignAccountForScheduleBPartIII` | boolean | Triggers Schedule B; sets Part III flag |
| `hasForeignTrustDistributionOrTransfer` | boolean | Triggers Schedule B; sets Part III flag |

### Personal form inputs (spouse)

Form ID: `interest-income-spouse`  
Firestore path: `users/{uid}/interest-income-spouse`

Contains the same supplemental and adjustment fields as the taxpayer form (without the return-level Schedule B gating questions). Return-level gating (foreign account, foreign trust, savings bond exclusion, bond-premium flags) belongs exclusively on the taxpayer form.

---

## Backend implementation

**Primary method:** `computeInterestIncome()` in `TaxReturnComputeService.java`  
**Helper method:** `computeInterestForPerson()` — per-person aggregation over 1099-INT, 1099-OID, and 1099-DIV entries  
**Schedule B builder:** `buildScheduleB()` — constructs `ScheduleB` when `scheduleBRequired == true`  
**Form 6251 integration:** `computeLine17()` receives `pabInterest` from the interest computation result and populates `Form6251.line2gPrivateActivityBondInterest`

**Internal record types:**

| Record | Fields |
|---|---|
| `InterestComputation` | `line2aTaxExemptInterest`, `taxableInterestBeforeSavingsBondExclusion`, `scheduleBLine3SavingsBondExclusion`, `line2bTaxableInterest`, `line3aQualifiedDividends`, `line3bOrdinaryDividends`, `form6251Line2gPrivateActivityBondInterest`, `scheduleBRequired`, `scheduleBForeignAccount`, `scheduleBFbarRequired`, `scheduleBForeignTrust`, `scheduleBInterestItems`, `scheduleBDividendItems` |
| `InterestPersonTotals` | `taxableInterestBeforeSavingsBondExclusion`, `taxExemptInterest`, `form6251Line2gPrivateActivityBondInterest`, `hasNomineeInterest`, `scheduleBInterestItems` |

**Entry-level attribution:** Each 1099-INT, 1099-OID, and 1099-DIV entry is attributed to taxpayer or spouse via `belongsToPerson()`, which matches the entry's `recipientTIN` against the taxpayer and spouse SSNs from the `identification-taxpayer` / `identification-spouse` personal forms.

**Line 2b wire-up:**  
`buildIncome()` → `income.setTaxableInterest(line2b)` → included in `line9` sum by `computeLine9TotalIncome()`

---

## Frontend mapping

**Form 1040 tax return preview** (`form-tax-return-1040.component.ts`):

| `buildFieldValues()` key | Source JSON path | IRS field |
|---|---|---|
| `line2a_tax_exempt_interest` | `form.income.taxExemptInterest` | Form 1040 line 2a |
| `line2b_taxable_interest` | `form.income.taxableInterest` | Form 1040 line 2b |

**Intake components:**
- `form-interest-income-taxpayer.component.ts` — taxpayer interest income form
- `form-interest-income-spouse.component.ts` — spouse interest income form

**Tax return display components:**
- `form-tax-return-scheduleb.component.ts` — Schedule B display (conditionally shown when `scheduleB != null`)
- `form-tax-return-6251.component.ts` — Form 6251 display (conditionally shown when `form6251 != null`)

---

## YAML intake structure

Both YAML files follow the standard section pattern: `screening` → `statementUploadCheck` → named input sections → `importedStatementFields` (readOnly) → `computedOutputs` (readOnly + computed).

- `C:\us-tax\yamls\2ab-interest-income-taxpayer.yaml` — includes return-level Schedule B gating questions
- `C:\us-tax\yamls\2ab-interest-income-spouse.yaml` — spouse-specific supplemental amounts and adjustments only

---

## Schedule B trigger conditions (2025)

Schedule B is required when any of the following apply:

| Trigger | Backend check |
|---|---|
| Taxable interest > $1,500 | `taxableInterest.compareTo(new BigDecimal("1500")) > 0` |
| Ordinary dividends > $1,500 | `dividends.scheduleBRequiredFromDividends()` |
| Accrued interest paid adjustment present | `hasAccruedInterestAdjustment` |
| OID reported below 1099 amount | `hasOidAdjustment` |
| Bond premium reduces interest below 1099 | `hasBondPremiumAdjustment` |
| Savings bond exclusion claimed | `hasSavingsBondExclusion` |
| Foreign financial account / signature authority | `hasForeignAccount` |
| Foreign trust distribution or transfer | `hasForeignTrust` |
| Nominee interest adjustment present | `hasNomineeInterest` (resolved 2026-04-13) |

---

## Output model fields

| JSON path | Type | Meaning |
|---|---|---|
| `form1040.income.taxExemptInterest` | BigDecimal | Form 1040 line 2a |
| `form1040.income.taxableInterest` | BigDecimal | Form 1040 line 2b |
| `scheduleB` | ScheduleB or null | Present when Schedule B is required |
| `scheduleB.line2TotalInterest` | BigDecimal | Schedule B Part I line 2 (before exclusion) |
| `scheduleB.line3ExcludableInterestSeriesEeI` | BigDecimal | Savings bond exclusion (Form 8815) |
| `scheduleB.line4TaxableInterest` | BigDecimal | Schedule B Part I line 4 = line 2b |
| `scheduleB.line6TotalOrdinaryDividends` | BigDecimal | Schedule B Part II line 6 = line 3b |
| `scheduleB.line7aForeignAccountOrSignatureAuthority` | Boolean | Schedule B Part III question |
| `scheduleB.line7aFbarRequired` | Boolean | FBAR filing required (see bugs section) |
| `scheduleB.line8ForeignTrustOrDistribution` | Boolean | Schedule B Part III question |
| `form6251.line2gPrivateActivityBondInterest` | BigDecimal | AMT preference item from 1099-INT box 9 |

---

## Unit test coverage

File: `TaxReturnComputeServiceTest.java`

| Test scenario | Coverage |
|---|---|
| Full MFJ return with all statement types + manual entries + adjustments + savings bond exclusion + foreign account | Asserts line 2a, line 2b, Schedule B lines 2/3/4, Schedule B foreign account flag, Form 6251 line 2g |
| Blocking flag when interest workflow enabled without uploaded statements | `MISSING_INTEREST_STATEMENTS_TAXPAYER` |
| Spouse-only gating fields on taxpayer form (should not trigger Schedule B) | Asserts `scheduleB == null` |
| Low-interest return (< $1,500, no triggers) | Asserts no Schedule B, no Form 6251 |
| Interest > $1,500 triggers Schedule B | Asserts Schedule B generated with correct totals |
| Foreign account → Schedule B | Asserts `line7aForeignAccountOrSignatureAuthority == true` |
| Premium adjustment floors at zero | Asserts `taxableInterest >= 0`, `taxExemptInterest >= 0` |
| SSN-filtered attribution (taxpayer vs spouse) | Verifies income attributed by `recipientTIN` match |

---

## E2E test coverage

| Spec file | Scenarios |
|---|---|
| `line2ab-interest-income.spec.ts` | (1) Block save when no statements uploaded; (2) Full MFJ flow with Schedule B + Form 6251 — asserts line 2a, line 2b, Schedule B lines, Form 6251 line 2g, sidebar links |
| `line2ab-interest-income-low.spec.ts` | Low-interest path (1099-DIV only, no taxable interest) — asserts no Schedule B, no Form 6251, correct line 2a |
| `line17-amt.spec.ts` | High PAB interest → Form 6251 generated even when AMT = 0; AMT positive with PAB interest |

---

## Downstream consumers

| Consumer | Input from lines 2a/2b | Notes |
|---|---|---|
| Line 9 (total income) | `form1040.income.taxableInterest` (line 2b) | Line 2a excluded from line 9 |
| Form 6251 line 2g | `form6251Line2gPrivateActivityBondInterest` | AMT private activity bond preference item |
| Schedule B Part I | `scheduleBInterestItems`, `line2TotalInterest`, `line3`, `line4` | Generated only when `scheduleBRequired == true` |
| Form 1116 (foreign tax credit) | 1099-INT box 6 foreign tax paid | Read separately in `computeForm1116()` — not from interest computation |
| IRMAA (Medicare premium) | line 2a added to MAGI for IRMAA purposes | Not implemented in this system (out of scope) |
| State returns | line 2a (often taxable at state level) | Out of scope |

---

## Known gaps

### Gap 1 — Box 9 double-counted into line 2a (RESOLVED 2026-04-13)

**Fix:** Changed `addNonNull(box8, box9)` to just `box8` in `computeInterestForPerson()`. Box 9 is a subset of box 8 and must not be added again. Updated E2E assertion from 157→127 and unit test from 284→244.

### Gap 2 — FBAR required flag always equals foreign account flag (RESOLVED 2026-04-13)

**Fix:** Added `hasFbarRequirement` boolean field read from personal form. Added field to YAML (`2ab-interest-income-taxpayer.yaml`), Angular component interface and template, and backend `computeInterestIncome()`. The `InterestComputation` constructor now passes `hasFbarRequirement` as `scheduleBFbarRequired` separately from `hasForeignAccount`.

### Gap 3 — Nominee interest does not independently trigger Schedule B (RESOLVED 2026-04-13)

**Fix:** Added `boolean hasNomineeInterest` field to `InterestPersonTotals` record. Set from `hasPositiveAmount(nomineeInterestAdjustment)` in `computeInterestForPerson()`. Added `|| hasNomineeInterest` to the `scheduleBRequired` chain in `computeInterestIncome()`.

### Gap 4 — 1099-DIV box 13 not fed to Form 6251 line 2g (RESOLVED 2026-04-13)

**Fix:** Added `pabDividends` field to `DividendPersonTotals` and `form6251Line2gDividends` to `DividendComputation`. Read `specifiedPrivateActivityBondDividendsAmount` in `computeDividendForPerson()`. Accumulated and returned through `DividendComputation`. Added `form6251Line2g = addNonNull(form6251Line2g, dividends.form6251Line2gDividends())` in `computeInterestIncome()`.

### Gap 5 — Schedule B dividend items list not populated (RESOLVED 2026-04-13)

**Fix:** Added `dividendItems` field to `ScheduleB.java`. Added `List<ScheduleBInterestItem> scheduleBDividendItems` to `DividendPersonTotals`, `DividendComputation`, and `InterestComputation`. Populated per-payer dividend items in `computeDividendForPerson()` loop. Wired into `buildScheduleB()`. Frontend `ScheduleBView` interface and `buildFieldValues()` updated to render up to 14 dividend payer rows.

### Gap 6 — Form 8815 hint text added (RESOLVED 2026-04-13)

**Fix:** Added informational paragraph near the savings bond exclusion fields in `form-interest-income-taxpayer.component.ts` directing users to compute Form 8815 using IRS Pub 550 and enter only the final exclusion amount.

### Gap 7 — Form 8815 savings bond exclusion not computed; manual entry only (unchanged)

The system accepts a `savingsBondExclusionAmount` from the taxpayer personal form (used as Schedule B line 3) but does not compute the Form 8815 exclusion amount from statement data. The taxpayer must compute and enter the exclusion amount manually.

### Gap 8 — Seller-financed mortgage interest Schedule B trigger not implemented (unchanged)

IRS rules require Schedule B when a taxpayer received seller-financed mortgage interest. No field in the personal form captures this, and no corresponding Schedule B trigger exists.

---

## Out of scope

- 1099-INT accrued interest paid at purchase to seller (must be entered manually in adjustment field)
- Contingent payment debt instrument interest
- Market discount on tax-exempt bonds (correctly identified as taxable; no dedicated workflow)
- Frozen deposit interest
- Form 8815 computation (savings bond exclusion amount is manual entry only)
- State-level treatment of tax-exempt interest
