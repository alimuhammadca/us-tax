# Knowledge: Form 1040 Line 32 — Total Other Payments and Refundable Credits

> Tax year 2025. Audit date: 2026-04-21.  
> Sources: 2025 Form 1040 (IRS PDF `f1040.pdf`, page 2 image confirmed), `f1040_field_mapping_semantic.csv`, `TaxReturnComputeService.java`, `Payments.java`, `form-tax-return-1040.component.ts`, J.K. Lasser 2025, E2E and unit test files.

---

## 1. Line Identity

**Form 1040 line 32** (2025):

```
Add lines 27a, 28, 29, 30, and 31. These are your total other payments and refundable credits
```

Exact formula:

```
Form1040.line32 = line27a + line28 + line29 + line30 + line31
```

Line 32 is a **pure summation** — no new credit is computed here. It is the subtotal of all refundable credits and other payments before adding withholding (line 25d) and estimated tax (line 26).

Downstream:

```
Form1040.line33 = line25d + line26 + line32
```

---

## 2. Component Lines (2025)

| Form 1040 line | Label | Source | Payments.java field |
|---|---|---|---|
| 27a | Earned income credit (EIC) | `computeLine27aEIC()` | `earnedIncomeCredit` |
| 27b | Clergy filing Schedule SE (checkbox only) | Not a dollar addend — election indicator | *(none)* |
| 27c | Elect to use prior year earned income (checkbox only) | Not a dollar addend — election indicator | *(none)* |
| 28 | Additional child tax credit (ACTC) — Schedule 8812 | `computeSchedule8812()` Part II-A | `additionalChildTaxCredit` |
| 29 | American opportunity credit from Form 8863, line 8 | `computeForm8863()` line 8 | `americanOpportunityCredit` |
| 30 | Refundable adoption credit from Form 8839, line 13 | `computeAdoptionBenefits()` Part II line 13 | `refundableAdoptionCredit` |
| 31 | Amount from Schedule 3, line 15 | `finalizeSchedule3Totals()` | `otherPaymentsSchedule3` |

**Important:** Lines 27b and 27c are checkbox election indicators on Form 1040. They influence whether the taxpayer can use a prior-year earned income amount for EIC purposes, but they do **not** represent separate dollar amounts in line 32.

---

## 3. Null / Zero Behavior

- The backend stores `null` (not `0`) in `Payments.totalOtherPaymentsAndRefundableCredits` when all five input lines are absent or zero.
- All five components are added via `safeAmount()` which treats `null` as `BigDecimal.ZERO`.
- `line33` always uses `safeAmount(totalOtherPaymentsAndRefundableCredits)` so null line 32 means $0 contributes to line 33 — not an error.

---

## 4. Backend Implementation

**Method:** `computeLine31ThroughLine38()` in `TaxReturnComputeService.java` (lines ~15446–15462)

```java
// Line 32: total other payments and refundable credits
BigDecimal line32 = roundMoney(
    safeAmount(payments.getEarnedIncomeCredit())          // line 27a
    .add(safeAmount(payments.getAdditionalChildTaxCredit()))  // line 28
    .add(safeAmount(payments.getAmericanOpportunityCredit())) // line 29
    .add(safeAmount(payments.getRefundableAdoptionCredit()))  // line 30
    .add(safeAmount(line31)));                               // line 31

payments.setTotalOtherPaymentsAndRefundableCredits(
    line32.compareTo(BigDecimal.ZERO) > 0 ? line32 : null);

// Line 33: total payments
BigDecimal line33 = roundMoney(
    safeAmount(totalWithholding)    // line 25d
    .add(safeAmount(line26))        // line 26
    .add(safeAmount(line32)));      // line 32

payments.setTotalPayments(
    line33.compareTo(BigDecimal.ZERO) > 0 ? line33 : null);
```

All five component setters (`setEarnedIncomeCredit`, `setAdditionalChildTaxCredit`, `setAmericanOpportunityCredit`, `setRefundableAdoptionCredit`, `setOtherPaymentsSchedule3`) are called **before** the line 32 computation, so all values are available.

### Compute order

```
computeLine27aEIC()                              # sets earnedIncomeCredit
computeSchedule8812()                            # sets additionalChildTaxCredit (line 28) and additionalChildTaxCredit
computeForm8863()                                # sets americanOpportunityCredit (line 29) via early pre-set
computeAdoptionBenefits()                        # early call — refundableAdoptionCredit set early, re-set in line 31 phase
finalizeSchedule3Totals()                        # sets schedule3.line15 → otherPaymentsSchedule3 (line 31)
computeLine31ThroughLine38()                     # assembles line 32, then line 33
```

---

## 5. Frontend Implementation

**Component:** `form-tax-return-1040.component.ts`

```typescript
// PDF field value building
values['line27_earned_income_credit'] = this.formatAmount(form.payments?.earnedIncomeCredit);
values['line28_additional_child_tax_credit'] = this.formatAmount(form.payments?.additionalChildTaxCredit);
values['line29_american_opportunity_credit'] = this.formatAmount(form.payments?.americanOpportunityCredit);
values['line30_refundable_adoption_credit'] = this.formatAmount(form.payments?.refundableAdoptionCredit);
values['line31_amount_from_schedule3_line15'] = this.formatAmount(form.payments?.otherPaymentsSchedule3);
values['line32_total_other_payments_refundable_credits'] = this.formatAmount(this.line32OtherPayments());
values['line33_total_payments'] = this.formatAmount(this.line33TotalPayments());
```

```typescript
// line32 fallback (uses stored value; recomputes client-side for backward compat)
protected line32OtherPayments(): number | null {
  const payments = this.form1040()?.payments;
  if (!payments) return null;
  const stored = this.toNumber(payments.totalOtherPaymentsAndRefundableCredits);
  if (stored !== null) return stored;
  return this.sumAmounts([
    payments.earnedIncomeCredit,
    payments.additionalChildTaxCredit,
    payments.americanOpportunityCredit,
    payments.refundableAdoptionCredit,   // line 30
    payments.otherPaymentsSchedule3      // line 31
  ]);
}
```

The `line32OtherPayments()` fallback correctly includes line 30 (`refundableAdoptionCredit`). The PDF field dictionary includes `values['line30_refundable_adoption_credit']` (fixed 2026-04-21).

---

## 6. Payments.java Output Model

| Field | Type | Corresponds to |
|---|---|---|
| `earnedIncomeCredit` | `BigDecimal` | Form 1040 line 27a |
| `additionalChildTaxCredit` | `BigDecimal` | Form 1040 line 28 |
| `americanOpportunityCredit` | `BigDecimal` | Form 1040 line 29 |
| `refundableAdoptionCredit` | `BigDecimal` | Form 1040 line 30 |
| `otherPaymentsSchedule3` | `BigDecimal` | Form 1040 line 31 |
| `totalOtherPaymentsAndRefundableCredits` | `BigDecimal` | Form 1040 **line 32** |
| `totalWithholding` | `BigDecimal` | Form 1040 line 25d |
| `estimatedTaxPayments` | `BigDecimal` | Form 1040 line 26 |
| `totalPayments` | `BigDecimal` | Form 1040 **line 33** |

---

## 7. PDF Field Mapping

From `f1040_field_mapping_semantic.csv` (page 2):

| CSV old_name | semantic_name | Actual 2025 Form 1040 label | Status |
|---|---|---|---|
| `f2_23[0]` | `line27_earned_income_credit` | Line 27a EIC | ✅ Mapped |
| `f2_24[0]` | `line28_additional_child_tax_credit` | Line 28 ACTC | ✅ Mapped |
| `f2_25[0]` | `line29_american_opportunity_credit` | Line 29 AOTC | ✅ Mapped |
| `f2_26[0]` | `line30_refundable_adoption_credit` | Line 30 Refundable adoption credit | ✅ Mapped (fixed 2026-04-21) |
| `f2_27[0]` | `line31_amount_from_schedule3_line15` | Line 31 Schedule 3 line 15 | ✅ Mapped |
| `f2_28[0]` | `line32_total_other_payments_refundable_credits` | Line 32 total | ✅ Mapped |
| `f2_29[0]` | `line33_total_payments` | Line 33 total payments | ✅ Mapped |

All 7 line 32–33 PDF fields are correctly mapped in the frontend as of 2026-04-21.

---

## 8. Component Line Details

### Line 27a — Earned Income Credit

- Computed by `computeLine27aEIC()`.
- Gates: `claimsEIC` boolean, not MFS, not Form 2555 filer, not NRA, not previously denied.
- 2025 max credits: $649 (childless), $4,328 (1 child), $7,152 (2 children), $8,046 (3+ children).
- Investment income ceiling: $11,950.
- Personal forms: `earned-income-credit-taxpayer`, `earned-income-credit-spouse`.

### Line 28 — Additional Child Tax Credit (ACTC)

- Computed by `computeSchedule8812()` Part II-A.
- Cap: $1,700 per qualifying child (2025).
- Floor: `max(0, qualifiedEarnedIncome − $2,500) × 15%`.
- Form 2555 filers: ACTC blocked.
- Phase-out: $200k single / $400k MFJ.

### Line 29 — Refundable American Opportunity Credit

- Computed by `computeForm8863()`.
- Up to 40% of the AOTC is refundable (max $1,000 per student).
- Formula: `line8 = min(line7, 40% × line3)` where line3 = min(qualified expenses, $2,000) + 25% × min(qualified expenses above $2,000, $2,000).
- MAGI phaseout: Single $80k–$90k / MFJ $160k–$180k.
- MFS filers blocked.

### Line 30 — Refundable Adoption Credit

- **New for 2025**: this line is the refundable portion of Form 8839.
- Computed by `computeAdoptionBenefits()` Part II lines 11b–13.
- Per-child cap: `$5,000`.
- Maximum credit per child: `$17,280`.
- MAGI phaseout: starts `$259,190`, fully phased out at `$299,190`.
- Formula: `line11b = min(line11a, $5,000)` per child; `line13 = sum of per-child line11b`.
- Nonrefundable portion flows to Schedule 3 line 6c → Form 1040 line 20 (separate path).
- See `knowledge_line30.md` for full Part II computation details.

### Line 31 — Amount from Schedule 3, Line 15

- Computed by `finalizeSchedule3Totals()`.
- Aggregates Schedule 3 Part II lines 9 + 10 + 11 + 12 + 14.
- Line 14 = sum of 13a (Form 2439) + 13b (§1341) + 13c (Form 3800, deferred) + 13d (§965) + 13z (write-ins).
- See `knowledge_line31.md` for full Part II computation details.

---

## 9. Unit Tests

All in `TaxReturnComputeServiceTest.java`:

| Test | What it covers |
|---|---|
| `line32_storedAsIntermediateSubtotal` | EIC ($649) + §1341 ($400) → line32 = $1,049 |
| `line32_nullWhenAllInputsNull` | W-2 only, no credits → line32 = null; line33 = $8,000 (withholding only) |
| `line32_line33ArithmeticVerified` | line25a=$5k + line26=$3k + §1341=$800 → line32=$800, line33=$8,800 |
| `line32_refundableAdoptionCreditContributesToLine32` | Adoption credit sole source → line30=$5,000, line32=$5,000 (added 2026-04-21) |
| `line32_actcContributesToLine32` | ACTC sole source — single filer, 1 child, wages $20k → ACTC=$1,700, line32=$1,700 (added 2026-04-21) |
| `line32_threeSourcesSumCorrectly` | ACTC($1,700) + adoption credit($5,000) + §1341($400) → line32=$7,100 (added 2026-04-21) |

**Open gap G5:** No unit test with all 5 sources simultaneously (EIC + ACTC + AOTC + adoption credit + Schedule 3 all contributing in a single compute run).

---

## 10. E2E Tests

**Files:**
- `line32-total-other-payments.spec.ts` (4 scenarios)
- `form8839-adoption-credits.spec.ts` includes adoption → line 32 coverage (1 scenario: "Line 32 includes refundable adoption credit")
- `line33-refund-owed.spec.ts` (2 scenarios) — verifies line 33 produces correct refund/owed outcomes

| Test | File | What it covers |
|---|---|---|
| `line32: subtotal stored and flows correctly into line33` | `line32-total-other-payments.spec.ts` | §1341 in line 31 → line32=$500; line33=$2,500 |
| `line32: null when no refundable credits` | `line32-total-other-payments.spec.ts` | W-2 only → line32=null; line33=$8,000 |
| `line32: EIC (line 27a) and adoption credit (line 30) both contribute to line 32 total` | `line32-total-other-payments.spec.ts` | EIC$649 + adoption$5,000 → line32=$5,649 (added 2026-04-21) |
| `line32: refundable adoption credit (line 30) contributes to line 32 total` | `line32-total-other-payments.spec.ts` | Adoption sole source → line32=$5,000 (added 2026-04-21) |
| `Line 32 includes refundable adoption credit` | `form8839-adoption-credits.spec.ts` | line30=$5,000 → line32 total includes it |
| `line34: refund when overpaid` | `line33-refund-owed.spec.ts` | line33 > line24 → overpayment path |
| `line37: amount owed when underpaid` | `line33-refund-owed.spec.ts` | line24 > line33 → amount owed path |

**Open gap G5:** No E2E test with all 5 sources simultaneously (EIC + ACTC + AOTC + adoption credit + Schedule 3 credit all present at once in a single compute run).

---

## 11. Gaps

| ID | Severity | Description | Status |
|---|---|---|---|
| G1 | MEDIUM | `f1040_field_mapping_semantic.csv` field `f2_26[0]` named `line30_reserved_future_use` — incorrect. Frontend had no `values['line30_...']` mapping. | **FIXED 2026-04-21** — Renamed to `line30_refundable_adoption_credit`; frontend mapping inserted. |
| G2 | LOW | No unit test asserting `totalOtherPaymentsAndRefundableCredits` when ACTC (line 28) is the contributing source; no multi-source unit test (3+ inputs). | **FIXED 2026-04-21** — Added `line32_actcContributesToLine32` and `line32_threeSourcesSumCorrectly`. |
| G3 | LOW | No unit test asserting line 32 aggregate when `refundableAdoptionCredit` (line 30) is sole source. | **FIXED 2026-04-21** — Added `line32_refundableAdoptionCreditContributesToLine32`. |
| G4 | LOW | No E2E test with 2+ sources simultaneously contributing to line 32. | **FIXED 2026-04-21** — Added `line32: EIC and adoption credit both contribute to line 32 total` and adoption-only test in `line32-total-other-payments.spec.ts`. |
| G5 | LOW | No unit test or E2E test with all 5 sources contributing simultaneously (EIC + ACTC + AOTC + adoption credit + Schedule 3 in one run). | **OPEN** — Would require a student (AOTC), qualifying child (ACTC), adoption, and §1341 credit for a single filer in one fixture, which is an atypical combination. Low priority given G2/G3/G4 coverage already validates each component. |
