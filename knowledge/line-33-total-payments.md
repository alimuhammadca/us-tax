# Knowledge: Form 1040 Line 33 — Total Payments (2025)

> Tax year 2025. Audit date: 2026-04-21.  
> Tests confirmed passing: 2026-04-21.  
> Sources: 2025 Form 1040 (IRS PDF confirmed), 2025 Form 1040 Instructions (`i1040gi_2025.txt`),
> J.K. Lasser 2025 Professional Edition, `TaxReturnComputeService.java`, `Payments.java`,
> `Refund.java`, `AmountOwed.java`, `Form2210.java`, `Form8888.java`,
> `form-tax-return-1040.component.ts`, unit tests, E2E tests.

---

## 1. Line Identity

**Form 1040 line 33** (2025):

```
Add lines 25d, 26, and 32. These are your total payments.
```

Exact formula:

```
line33 = line25d + line26 + line32
```

Line 33 is the **total payments pivot**: compared against line 24 (total tax) to determine
whether the return produces a refund (line 34 path) or an amount owed (line 37 path).

---

## 2. Top-Level Formula and Expansion

```
line33 = line25d + line26 + line32

line25d = line25a (W-2 box 2 withholding)
        + line25b (1099-series / SSA-1099 / RRB-1099 withholding)
        + line25c (W-2G box 4 + Form 8959 line 24)

line26  = quarterly estimated tax installments Q1–Q4
        + prior-year overpayment applied from original return
        + prior-year overpayment applied from amended return (Form 1040-X)

line32  = line27a (EIC)
        + line28  (ACTC)
        + line29  (Refundable AOTC)
        + line30  (Refundable adoption credit)
        + line31  (Schedule 3 line 15)
```

---

## 3. Downstream Lines 34–38

All computed within `computeLine31ThroughLine38()` (same method as line 33).

| Line | Formula | Java field | Condition |
|---|---|---|---|
| 34 | `line33 − line24` | `Refund.overpaid` | Only when `line33 > line24` |
| 35a | `line34 − line36` | `Refund.refundAmount` | Only when overpaid |
| 35b/c/d | Direct deposit routing/account | `Refund.routingNumber/.accountType/.accountNumber` | When `wantsDirectDeposit=true` |
| 36 | User-elected amount applied to 2026 est. tax (irrevocable) | `Refund.amountAppliedToNextYear` | Capped at `line34` |
| 37 | `line24 − line33` | `AmountOwed.amountOwed` | Only when `line24 > line33` |
| 38 | `Form2210.totalPenalty` | `AmountOwed.estimatedTaxPenalty` | When Form 2210 penalty > 0 and not waived |

Lines 34 and 37 are mutually exclusive. Line 38 is added **after** line 37 is set (penalty stacks on top of amount owed).

---

## 4. Backend Implementation

> *Convention (added 2026-07-07, knowledge-file line-number sweep):* code references use stable function/method names rather than source-code line numbers, which drift with refactors. IRS form/schedule line references (line 1c, Schedule 1 line 21, etc.) are stable and retained.

### Core Method

**Method:** `computeLine31ThroughLine38()` in `TaxReturnComputeService.java` (line 33 wiring)

```java
// Line 33: total payments
BigDecimal line33 = roundMoney(safeAmount(totalWithholding)  // line25d
        .add(safeAmount(line26))                              // line26
        .add(safeAmount(line32)));                            // line32
payments.setTotalPayments(line33.compareTo(BigDecimal.ZERO) > 0 ? line33 : null);

// Line 34/35a/36 (overpayment path)
if (line33.compareTo(totalTax) > 0) {
    BigDecimal overpaid = roundMoney(line33.subtract(totalTax));
    refund.setOverpaid(overpaid);
    BigDecimal line36Capped = line36.min(overpaid);
    refund.setAmountAppliedToNextYear(line36Capped > 0 ? line36Capped : null);
    refund.setRefundAmount(overpaid.subtract(line36Capped) > 0 ? ... : null);
    // Direct deposit: populated from 35-direct-deposit form when !hasSplitRefund
}

// Line 37 (amount owed path)
else if (totalTax.compareTo(line33) > 0) {
    amountOwed.setAmountOwed(roundMoney(totalTax.subtract(line33)));
}
```

### Form 2210 (Line 38)

**Method:** `computeForm2210()` in `TaxReturnComputeService.java` (penalty wired into `AmountYouOwe` by `prepare()`).

Called after `computeLine31ThroughLine38()`. When `totalPenalty > 0` and method != WAIVED:

```java
ao.setEstimatedTaxPenalty(form2210.getTotalPenalty());
ao.setAmountOwed(roundMoney(currentOwed.add(form2210.getTotalPenalty())));
```

Form 2210 computation uses **Form 1040 line 22** (`taxAfterCredits`), NOT line 18
(`totalTaxBeforeCredits`). This was a bug fixed 2026-04-19 (G1 in outstanding.md).

**Form 2210 Part I formula:**
```
Line 1 = taxAfterCredits (Form 1040 line 22)
Line 2 = otherTaxes (SE tax, AMT, Form 8959, etc.)
Line 3 = line1 + line2
Line 4 = refundable credits (EIC + ACTC + refundable AOTC + adoption)
Line 5 = max(0, line3 − line4)
Line 6 = line5 × 90%   ← 90% current-year safe harbor
Line 7 = prior-year safe harbor (100% or 110% × priorYearTax)
Line 8 = min(line6, line7)  ← required annual payment
Line 9 = totalWithholding + estimatedTaxPayments
```

**Safe harbor tiers:**
- Prior AGI ≤ $150,000: 100% of prior-year tax
- Prior AGI > $150,000: 110% of prior-year tax

**Penalty trigger:** balance due ≥ $1,000 AND safe harbors not satisfied.

**Computation methods:**
- `NO_PENALTY` — payments sufficient
- `WAIVED` — Box A full waiver (waiveFullPenalty = true)
- `REGULAR_METHOD` — 4 equal installments, withholding split equally per period

**Out of scope:** Schedule AI (Box C), Box D (actual withholding dates), Form 2210-F (farmers/fishermen), partial waiver documentation upload.

### Form 8888 (Split Refund)

**File:** `TaxReturnComputeService.java` — `computeForm8888()`

- Called after lines 33–38 are finalized
- Triggered by `refundAllocationData.wantsRefundAllocation = true`
- Up to 3 accounts; each with amount, routing number (9 digits), account type, account number
- Line 5 (totalAllocated) must equal `Refund.refundAmount` (line 35a)
- `FORM_8888_TOTAL_MISMATCH` non-blocking flag when mismatch
- Savings bond purchase line (previously line 4) discontinued for 2024+ returns

---

## 5. Frontend Implementation

**File:** `form-tax-return-1040.component.ts`

```typescript
protected line33TotalPayments(): number | null {
  const payments = this.form1040()?.payments;
  if (!payments) return null;
  const totalPayments = this.toNumber(payments.totalPayments);
  if (totalPayments !== null) return totalPayments;          // prefer stored backend value
  const line32 = this.line32OtherPayments();
  return this.sumAmounts([this.line25dTotalWithholding(), payments.estimatedTaxPayments, line32]);
}
```

The fallback client-side recompute exists for backward compatibility with older saved returns that may not have `totalPayments` stored.

**PDF fields used:**

| PDF semantic field | CSV field | Form 1040 line |
|---|---|---|
| `line33_total_payments` | `f2_29[0]` | Line 33 |
| `line34_overpaid` | — | Line 34 |
| `line35a_refund_amount` | — | Line 35a |
| `direct_deposit_routing_number` | — | Line 35b |
| `direct_deposit_account_number` | — | Line 35d |
| `direct_deposit_account_type_checking` | — | Line 35c (checkbox) |
| `direct_deposit_account_type_savings` | — | Line 35c (checkbox) |
| `line36_applied_to_2025_estimated_tax` | — | Line 36 |
| `line37_amount_you_owe` | — | Line 37 |
| `line38_estimated_tax_penalty` | — | Line 38 |

All fields are correctly mapped in the frontend as of 2026-04-21.

---

## 6. Output Models

### Payments.java

| Field | Form 1040 line |
|---|---|
| `totalWithholding` | 25d |
| `estimatedTaxPayments` | 26 |
| `earnedIncomeCredit` | 27a |
| `additionalChildTaxCredit` | 28 |
| `americanOpportunityCredit` | 29 |
| `refundableAdoptionCredit` | 30 |
| `otherPaymentsSchedule3` | 31 |
| `totalOtherPaymentsAndRefundableCredits` | 32 |
| **`totalPayments`** | **33** |

### Refund.java

| Field | Form 1040 line |
|---|---|
| `overpaid` | 34 |
| `refundAmount` | 35a |
| `routingNumber` | 35b |
| `accountType` | 35c |
| `accountNumber` | 35d |
| `directDeposit` | 35b flag |
| `amountAppliedToNextYear` | 36 |

### AmountOwed.java

| Field | Form 1040 line |
|---|---|
| `amountOwed` | 37 |
| `estimatedTaxPenalty` | 38 |

---

## 7. Personal Forms

| Form ID | Fields | Accepted by PersonalResource |
|---|---|---|
| `estimated-tax-payments-taxpayer` / `spouse` | installment1–4Amount, priorYearOverpaymentCredited, amendedReturnOverpaymentCredited | ✅ |
| `35-direct-deposit` | wantsDirectDeposit, routingNumber, accountType, accountNumber | ✅ |
| `36-apply-to-next-year` | electsApplyToNextYear, amountToApply | ✅ |
| `refund-allocation-taxpayer` | wantsRefundAllocation, account1–3 fields | ✅ |
| `prior-year-tax-taxpayer` | priorYearAgi, priorYearTaxLiability, waiveFullPenalty, waivePartialPenalty, jointSeparateMismatch, **madeEstimatedPayments** (screening gate), payment1–4Amount | ✅ |

---

## 8. IRS Rules and Edge Cases

| Rule | Details |
|---|---|
| $1 minimum refund | IRS will not automatically issue a refund < $1; taxpayer must request in writing. Backend does not enforce this floor. |
| Line 36 irrevocable | Once elected, the applied amount cannot be reversed. IRS credits it to Q1 2026 installment (April 15, 2026) by default. |
| Form 8888 vs. 35b/c/d | When Form 8888 is used, lines 35b/c/d on Form 1040 are blank. The backend populates `Refund.routingNumber` etc. only when `!hasSplitRefund`. |
| Line 38 stacks on line 37 | `AmountOwed.amountOwed` = line37 + Form 2210 penalty. The penalty is a separate addend, not a replacement. |
| Refund interest | No interest due if return filed by April 15 and refund issued within 45 days. Interest accrues on owed amounts from the due date. |
| 2025 Form 2210 penalty rate | IRS short-term federal rate + 3% (compounded daily). Rate varies quarterly; Q1–Q2 2025 rate based on IRS announcements. Backend uses fixed-rate approximation. |

---

## 9. Compute Order

```
1.  computeLine27aEIC()              → earnedIncomeCredit (line27a)
2.  computeSchedule8812()            → additionalChildTaxCredit (line28)
3.  computeForm8863() + applyForm8863ToSchedule3()  → americanOpportunityCredit (line29)
4.  computeAdoptionBenefits() early  → refundableAdoptionCredit (tentative; line30)
5.  applyAdoptionCredit()            → confirms line30; sets Schedule 3 line 6c
6.  finalizeSchedule3Totals()        → otherPaymentsSchedule3 (line31)
7.  computeLine31ThroughLine38() {
      line25a/b/c/d aggregation
      line26 = computeLine26EstimatedTax()
      line27a = computeLine27aEIC() (final)
      line29 re-set from form8863
      line30 re-set from adoption
      line31 from schedule3.line15
      line32 = 27a+28+29+30+31
      line33 = 25d+26+32             ← LINE 33
      line34/35a/36/37 computed
    }
8.  computeForm2210()                → totalPenalty → AmountOwed.estimatedTaxPenalty (line38)
9.  computeForm8888()                → split refund allocation (after line35a finalized)
```

---

## 10. Unit Tests

All in `TaxReturnComputeServiceTest.java`:

| Test | What it covers |
|---|---|
| `line34_refundWhenOverpaid` | W-2 $100k wages + $50k withholding → `refund.overpaid > 0`; `refundAmount = overpaid`; `amountOwed = null` |
| `line37_amountOwedWhenUnderpaid` | W-2 $100k wages + $1k withholding → `amountOwed > 0`; `refund = null` |
| `line33_line36_reducesRefundAmount` | $50k withholding + $5k line36 election → `amountAppliedToNextYear = 5000`; `refundAmount = overpaid − 5000` |
| `form2210_noPenalty_balanceDueLessThan1000` | $50k wages, $8.5k withholding → balance due < $1,000 → no Form 2210 |
| `form2210_noPenalty_sufficientPayments` | High income, $40k estimated payments matching prior-year safe harbor → NO_PENALTY |
| `form2210_regularMethod_penaltyComputed` | $300k wages, zero withholding → REGULAR_METHOD; `estimatedTaxPenalty > 0`; wired to line 38 |
| `form2210_priorYearSafeHarbor110pct` | Prior AGI $200k > $150k → safe harbor = 110% × $60k = $66,000 |
| `form2210Line1UsesTaxAfterCreditsNotTotalTaxBeforeCredits` | Savings credit reduces line22 below line18 → Form 2210 line1 = line22 |
| `form8888_notEmittedWhenAllocationNotRequested` | No `wantsRefundAllocation` → `form8888 = null` |
| `form8888_twoAccountSplitMatchesRefund` | Two accounts totaling exactly the refund → `totalMatchesRefund = true` |
| `form8888_totalMismatchEmitsNonBlockingFlag` | Two accounts < refund total → `FORM_8888_TOTAL_MISMATCH` non-blocking flag |
| `line36_cap_whenAmountToApplyExceedsOverpaid` | `amountToApply=999999` against ~$36k overpayment → `amountAppliedToNextYear == overpaid` (capped); `refundAmount == null` |
| `form2210_waivePartialPenalty_boxBSetAndPenaltyStillComputed` | `waivePartialPenalty=true` → `boxBPartialWaiver=true`; `computationMethod=REGULAR_METHOD`; penalty still computed |
| `form2210_jointSeparateMismatch_boxESet` | `jointSeparateMismatch=true` → `boxEJointSeparate=true`; `computationMethod=REGULAR_METHOD` |
| `line33_equals_line24_neither_refund_nor_amountOwed` | Two-compute pattern: withholding = taxAfterCredits → `refund=null`, `amountOwed=null`, `form2210=null` |
| `line36_not_applied_when_electsApplyToNextYear_false` | `electsApplyToNextYear=false` with `amountToApply=5000` → `amountAppliedToNextYear=null`; full overpayment refunded |
| `directDeposit_not_populated_when_wantsDirectDeposit_false` | `wantsDirectDeposit=false` with routing/account present → DD fields all null on Refund |
| `line38_penalty_is_additive_to_line37_amountOwed` | $300k wages, zero withholding → `ao.amountOwed = line37 + penalty`; `ao.estimatedTaxPenalty = penalty` |

**Total: 18 unit tests covering line 33 and its downstream (34–38).**

---

## 11. E2E Tests

| File | Test | What it covers |
|---|---|---|
| `line33-refund-owed.spec.ts` | `line34: refund calculated when overpaid` | $100k wages, $50k withholding → `refund.overpaid > 0`; `refundAmount = overpaid` |
| `line33-refund-owed.spec.ts` | `line37: amount owed when underpaid` | $100k wages, $1k withholding → `amountOwed > 0`; `refund = null` |
| `line33-refund-owed.spec.ts` | `line36: apply-to-next-year reduces refund and populates amountAppliedToNextYear` | $5k election → `amountAppliedToNextYear = 5000`; `refundAmount = overpaid − 5000` |
| `line33-refund-owed.spec.ts` | `line35bcd: direct deposit fields populated when elected` | `wantsDirectDeposit=true` → `refund.routingNumber`/`accountType`/`accountNumber` populated |
| `line33-refund-owed.spec.ts` | `line36: apply-to-next-year capped when amount exceeds overpayment` | `amountToApply=999999` against ~$36k overpayment → cap applied; full overpayment applied |
| `line33-refund-owed.spec.ts` | `line35bcd: direct deposit suppressed when Form 8888 split-refund elected` | Both DD and refund-allocation saved → DD fields null; Form 8888 present |
| `line33-refund-owed.spec.ts` | `line33 = line24: neither refund nor amount owed when payments exactly equal tax` | Two-compute pattern → `refund=null`, `amountOwed=null` |
| `form2210-underpayment-penalty.spec.ts` | `form2210: no penalty when withholding covers liability` | Sufficient withholding → no penalty or NO_PENALTY |
| `form2210-underpayment-penalty.spec.ts` | `form2210: regular-method penalty when no payments made` | $300k wages, zero withholding → REGULAR_METHOD; penalty wired to line 38 |
| `form2210-underpayment-penalty.spec.ts` | `form2210: waiver box A suppresses penalty` | `waiveFullPenalty=true` → WAIVED; `estimatedTaxPenalty = null` |
| `form2210-underpayment-penalty.spec.ts` | `form2210: partial waiver box B sets boxBPartialWaiver but does not suppress penalty` | `waivePartialPenalty=true` → `boxBPartialWaiver=true`; REGULAR_METHOD; `totalPenalty > 0` |
| `form2210-underpayment-penalty.spec.ts` | `form2210: box E joint-separate mismatch sets boxEJointSeparate` | `jointSeparateMismatch=true` → `boxEJointSeparate=true`; REGULAR_METHOD |
| `form2210-underpayment-penalty.spec.ts` | `form2210: 110% safe harbor applies when prior-year AGI exceeds $150k` | Prior AGI $200k, prior tax $60k → `priorYearSafeHarbor ≈ 66000` |
| `form8888-refund-allocation.spec.ts` | `form8888: not generated when wantsRefundAllocation is not set` | No allocation data → `form8888 = null` |
| `form8888-refund-allocation.spec.ts` | `form8888: two-account split matching the full refund` | Split evenly across 2 accounts → `totalMatchesRefund = true` |
| `form8888-refund-allocation.spec.ts` | `form8888: total mismatch emits non-blocking FORM_8888_TOTAL_MISMATCH flag` | Partial allocation → flag emitted |
| `form8888-refund-allocation.spec.ts` | `form8888: three-account split matching the full refund` | Refund split in thirds across 3 accounts → account3 fields populated; `totalMatchesRefund = true` |
| `form8888-refund-allocation.spec.ts` | `form8888: direct deposit lines 35b/c/d suppressed when Form 8888 elected` | Both DD and Form 8888 data present → Refund DD fields null; Form 8888 object present |

**Total: 18 E2E tests across 3 spec files.**

---

## 12. Gaps

| ID | Severity | Description | Status |
|---|---|---|---|
| G1 | LOW | No E2E test for line 36 (apply to next year) | **RESOLVED** 2026-04-21 — `line36: apply-to-next-year reduces refund…` added to `line33-refund-owed.spec.ts` |
| G2 | LOW | No E2E test for direct deposit (lines 35b/c/d) | **RESOLVED** 2026-04-21 — `line35bcd: direct deposit fields populated when elected` added |
| G3 | LOW | $1 minimum refund rule not enforced: backend computes any positive overpayment as a refund without the IRS < $1 floor | **OPEN** — low priority |
| G4 | LOW | Form 8888 PDF fill/export not implemented | **DEFERRED** — semantic assets published; no fill code |
| G5 | LOW | Form 8888 / Form 8379 cross-check (Form 8379 not implemented) | **DEFERRED** |
| G6 | LOW | Form 8888 IRA/HSA account types not in dropdown | **DEFERRED** |
| G7 | OOS | Form 2210 Schedule AI (Box C — annualized income method) | **OUT OF SCOPE** |
| G8 | OOS | Form 2210 Box D (actual withholding dates) | **OUT OF SCOPE** |
| G9 | OOS | Form 2210-F (farmers/fishermen 66⅔% safe harbor) | **OUT OF SCOPE** |
| G10 | LOW | No unit test for line 36 cap (amountToApply > overpaid) | **RESOLVED** 2026-04-21 — `line36_cap_whenAmountToApplyExceedsOverpaid` |
| G11 | LOW | No E2E test for line 36 cap | **RESOLVED** 2026-04-21 — `line36: apply-to-next-year capped…` added |
| G12 | LOW | No E2E test for DD suppressed by Form 8888 (line33-refund-owed spec) | **RESOLVED** 2026-04-21 — `line35bcd: direct deposit suppressed when Form 8888…` added |
| G13 | LOW | No unit test for `waivePartialPenalty` (box B) | **RESOLVED** 2026-04-21 — `form2210_waivePartialPenalty_boxBSetAndPenaltyStillComputed` |
| G14 | LOW | No unit test for `jointSeparateMismatch` (box E) | **RESOLVED** 2026-04-21 — `form2210_jointSeparateMismatch_boxESet` |
| G15 | LOW | No E2E test for box B partial waiver | **RESOLVED** 2026-04-21 — `form2210: partial waiver box B…` added |
| G16 | LOW | No E2E test for box E joint-separate mismatch | **RESOLVED** 2026-04-21 — `form2210: box E joint-separate mismatch…` added |
| G17 | LOW | No E2E test for 110% safe harbor (prior AGI > $150k) | **RESOLVED** 2026-04-21 — `form2210: 110% safe harbor applies…` added |
| G18 | LOW | No E2E test for three-account Form 8888 split | **RESOLVED** 2026-04-21 — `form8888: three-account split…` added |
| G19 | LOW | No E2E test for DD suppressed when Form 8888 active (form8888 spec) | **RESOLVED** 2026-04-21 — `form8888: direct deposit lines 35b/c/d suppressed…` added |
| G20 | MEDIUM | No unit test for `line33 = line24` (neither refund nor amountOwed) | **RESOLVED** 2026-04-21 — `line33_equals_line24_neither_refund_nor_amountOwed` (two-compute pattern) |
| G21 | LOW | No unit test: line36 not applied when `electsApplyToNextYear=false` | **RESOLVED** 2026-04-21 — `line36_not_applied_when_electsApplyToNextYear_false` |
| G22 | LOW | No unit test: DD fields absent when `wantsDirectDeposit=false` | **RESOLVED** 2026-04-21 — `directDeposit_not_populated_when_wantsDirectDeposit_false` |
| G23 | MEDIUM | No unit test: line38 penalty is additive to line37 amountOwed | **RESOLVED** 2026-04-21 — `line38_penalty_is_additive_to_line37_amountOwed` |
| G24 | MEDIUM | No E2E test for `line33 = line24` edge case | **RESOLVED** 2026-04-21 — `line33 = line24: neither refund nor amount owed…` added |
| UI-R1 | MEDIUM | `prior-year-tax` form showed all 4 quarterly payment fields unconditionally (R1 violation) | **RESOLVED** 2026-04-21 — `madeEstimatedPayments` screening gate added to YAML + Angular |
