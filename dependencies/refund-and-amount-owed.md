# Dependencies: Unified Refund and Amount Owed Form (UI Audit)

> Tax year 2025. Re-authored 2026-06-14 to match current program logic.
> Form ID: `refund-and-amount-owed-taxpayer` (primary; 4 legacy fallbacks).
> Covers Form 1040 lines 34, 35a, 35b, 35c, 35d, 36, 37, 38 holistically.
> Authoritative sources: `lines/34.md`, `lines/35.md`, `lines/36.md`, `lines/37.md`, `lines/38.md`.

The unified personal form consolidates 4 legacy forms previously stored separately:

- `35-direct-deposit`
- `refund-allocation-taxpayer`
- `36-apply-to-next-year`
- `prior-year-tax-taxpayer`

All field names are **identical** between the unified form and the 4 legacy forms — the backend reads the unified form first, then falls back to the legacy IDs (no transformation).

---

## 1. Form Inputs (UI Fields → Backend Targets)

### 1a. Direct Deposit Fields (Form 1040 lines 35b / 35c / 35d)

| UI field | Type | Backend target | Notes |
|---|---|---|---|
| `wantsDirectDeposit` | boolean | gate (Layer 2) for 35b/c/d | If false (or form absent) → paper check; 35b/c/d blank |
| `routingNumber` | string (9-digit ABA) | `Refund.routingNumber` | Trimmed; UI enforces Mod-10 checksum |
| `accountType` | enum (`Checking` / `Savings`) | `Refund.accountType` | Two PDF checkboxes |
| `accountNumber` | string (≤ 17 chars, `[0-9A-Z-]`) | `Refund.accountNumber` | Truncated to 17 chars at backend; advisory if longer |

### 1b. Split Refund Fields — Form 8888 (overrides direct deposit)

| UI field | Type | Backend target | Notes |
|---|---|---|---|
| `wantsRefundAllocation` | boolean | gate (Layer 1) — `hasSplitRefund` | When TRUE, suppresses 35b/c/d on Form 1040 |
| `account1Amount` | currency (whole $) | `Form8888.account1.amount` | |
| `account1Routing` | string | `Form8888.account1.routingNumber` | |
| `account1Type` | enum | `Form8888.account1.accountType` | |
| `account1Number` | string | `Form8888.account1.accountNumber` | |
| `account2Amount`–`account2Number` | same shape | `Form8888.account2.*` | |
| `account3Amount`–`account3Number` | same shape (optional) | `Form8888.account3.*` | |

Form 8888 trumps direct deposit: when `wantsRefundAllocation == TRUE`, lines 35b/c/d on Form 1040 are blank regardless of `wantsDirectDeposit`.

### 1c. Apply to Next Year (Form 1040 line 36)

| UI field | Type | Backend target | Notes |
|---|---|---|---|
| `electsApplyToNextYear` | boolean | Stage 1 gate at line 27317-27326 | If false → line 36 stays ZERO/null |
| `amountToApply` | currency | `Refund.amountAppliedToNextYear` (capped at overpaid) | **Silent cap** — no advisory flag when user enters more than `overpaid` (UX gap; structurally correct per IRS rule) |

### 1d. Prior Year / Form 2210 Inputs

| UI field | Type | Backend target | Notes |
|---|---|---|---|
| `priorYearAgi` | currency | Form 2210 safe-harbor threshold check at line 27607-27619 | 110% safe harbor when AGI > $150k ($75k MFS) |
| `priorYearTaxLiability` | currency | Form 2210 line 7 base | If null → l7 null, l8 = l6 alone |
| `madeEstimatedPayments` | boolean | UI-only screening gate | Shows/hides the 4 payment fields (R-UI fix) |
| `payment1Amount` | currency | Form 2210 Part III Q1 estimated payment | Days underpaid = 365 |
| `payment2Amount` | currency | Form 2210 Part III Q2 | Days underpaid = 303 |
| `payment3Amount` | currency | Form 2210 Part III Q3 | Days underpaid = 212 |
| `payment4Amount` | currency | Form 2210 Part III Q4 | Days underpaid = 90 |
| `waiveFullPenalty` | boolean | Form 2210 Box A | TRUE short-circuits Part III; sets `computationMethod = "WAIVED"`, `totalPenalty = ZERO` |
| `waivePartialPenalty` | boolean | Form 2210 Box B | **Stored only** — does NOT skip Part III |
| `jointSeparateMismatch` | boolean | Form 2210 Box E | **Stored only** — does NOT affect penalty computation |

Box C (Schedule AI annualized income) and Box D (actual withholding dates) are forced FALSE at lines 27654-27655 — both **OUT OF SCOPE** (G7 / G8).

---

## 2. Computed Inputs the Form Reads

The form displays banners and enforces ceilings based on the latest computed tax return:

| Computed field | Source | Used for |
|---|---|---|
| `form1040.refund.overpaid` (line 34) | `computeLine31ThroughLine38` line 27340 | Refund banner; gates DD + split + apply sections |
| `form1040.refund.refundAmount` (line 35a) | line 27350 | Refund banner subtitle |
| `form1040.amountOwed.amountOwed` (STACKED line 37 + line 38) | Stage 1 line 27448 + Stage 2 line 2087 | Amount-owed banner; gates prior-year section |
| `form1040.amountOwed.estimatedTaxPenalty` (line 38) | Stage 2 line 2084 | Penalty line in owed banner |
| `form8888.totalAllocated` | `computeForm8888()` | Form 8888 mismatch validation |
| `overpaidCeiling` (derived) | `overpaid > 0 ? overpaid : null` | Max constraint on `amountToApply` |
| `getLineThirtySevenPure()` (pure line 37) | `AmountOwed.java:145-149` | Line 37 PDF box (IRS-canonical, un-stacked) |

---

## 3. Validation Flags

All three line-35d flags are **non-blocking advisories** — the compute proceeds and the printed return is generated; the user sees the advisories on the Tax Return view.

| Flag code | Severity | Trigger | Source |
|---|---|---|---|
| `LINE_35D_ACCOUNT_NUMBER_TOO_LONG` | Advisory | `accountNumber.length > 17` (truncated to first 17 chars) | 35d Gap D (IRS Doc 1346) |
| `LINE_35D_ACCOUNT_NUMBER_INVALID_CHARACTERS` | Advisory | `accountNumber` (uppercased) does NOT match `^[0-9A-Z\-]+$` | 35d Gap E |
| `LINE_35BCD_INCOMPLETE_TRIPLE` | Advisory | DD elected but ≥ 1 of routing/type/number missing | 35d Gap F |
| `FORM_8888_TOTAL_MISMATCH` | Non-blocking | Form 8888 line 5 ≠ line 35a | Form 8888 validation |

Form 2210 itself emits **no flags** — the `$1,000` no-penalty trigger (`F2210_NO_PENALTY_BALANCE_THRESHOLD`) silently short-circuits the helper to return null.

---

## 4. STACKING CONVENTION — Pure vs. Stored Amount Owed

The project keeps pure line 37 + line 38 stacked into the same `AmountOwed.amountOwed` field so the in-app "Amount you owe" summary shows the total remittance amount. The printed Form 1040 still satisfies the IRS rule by emitting the **pure** line-37 value at the line-37 PDF box and the penalty separately at the line-38 PDF box.

```text
Pure line 37 (printed PDF, IRS-canonical):
    pure_line37 = roundMoney(totalTax − line33)   when totalTax > line33

Stored AmountOwed.amountOwed (in-app summary):
    stored = pure_line37 + Form2210.totalPenalty  when Form 2210 fires (not WAIVED)
    stored = pure_line37                           otherwise

Pure value recovery:
    AmountOwed.getLineThirtySevenPure() = amountOwed − estimatedTaxPenalty
```

Documented in `AmountOwed.java:35-149` Javadoc. Recovery getter at `AmountOwed.java:145-149`:

```java
public BigDecimal getLineThirtySevenPure() {
    if (amountOwed == null) return null;
    if (estimatedTaxPenalty == null) return amountOwed;
    return amountOwed.subtract(estimatedTaxPenalty);
}
```

| Consumer | Uses | Why |
|---|---|---|
| Form 1040 line-37 PDF box | `getLineThirtySevenPure()` | IRS strict-equality rule: `line 37 == line 24 − line 33` |
| In-app "Amount you owe" summary | `getAmountOwed()` (stacked) | Total remittance amount to the user |
| Form 1040 line-38 PDF box | `getEstimatedTaxPenalty()` | Penalty alone (independent of stacking) |

---

## 5. Form 2210 Wiring Sites

### Stage 1 — pure line 37 (lines 27440-27449)

```java
} else if (totalTax.compareTo(line33) > 0) {
    BigDecimal owed = roundMoney(totalTax.subtract(line33));
    AmountOwed amountOwed = form1040.getAmountOwed();
    if (amountOwed == null) {
        amountOwed = new AmountOwed();
        form1040.setAmountOwed(amountOwed);
    }
    amountOwed.setAmountOwed(owed);
}
```

### Stage 2 — Form 2210 penalty stack (lines 2073-2088)

```java
Form2210 form2210 = computeForm2210(form1040, priorYearTaxData, filingStatus);
if (form2210 != null && form2210.getTotalPenalty() != null
        && form2210.getTotalPenalty().compareTo(BigDecimal.ZERO) > 0
        && !"WAIVED".equals(form2210.getComputationMethod())) {        // Box A filter
    AmountOwed ao = form1040.getAmountOwed();
    if (ao == null) {
        ao = new AmountOwed();
        form1040.setAmountOwed(ao);
    }
    ao.setEstimatedTaxPenalty(form2210.getTotalPenalty());
    BigDecimal currentOwed = safeAmount(ao.getAmountOwed());
    ao.setAmountOwed(roundMoney(currentOwed.add(form2210.getTotalPenalty())));
}
```

The 4-condition gate excludes: (1) null Form 2210 (low-balance or NO_PENALTY), (2) null `totalPenalty`, (3) zero `totalPenalty`, (4) WAIVED method (Box A).

### computeForm2210 helper (lines 27543-27731)

| Stage | Lines | Purpose |
|---|---|---|
| Low-balance gate | 27548-27553 | `balanceDue < $1,000` → return null |
| Part I — required annual payment | 27559-27624 | l1=line22 taxAfterCredits / l2=otherTaxes / l3 / l4=refundable credits / l5 / l6=90% / l7=priorYrTax×(110% or 100%) / l8=min(l6,l7) |
| MFS half-threshold (Convention 5) | 27607-27619 | `isMfs ? $75,000 : $150,000` for the 110% tier |
| Part I line 9 — total payments | 27626-27640 | `totalWithholding + sum(payment1..4)` (NOT line 33) |
| Sufficient-payment short-circuit | 27642-27646 | If `l9 >= l8` → `computationMethod=NO_PENALTY`, totalPenalty stays null |
| Part II — waivers | 27648-27662 | Box A → WAIVED + totalPenalty=ZERO; Box B/E stored only; Box C/D forced FALSE |
| Part III — regular-method 4-installment loop | 27664-27726 | Per-period under = max(0, l8/4 − (estPmt + wh/4 + carry)); penalty = under × 0.07/365 × days[i]; days = (365,303,212,90) |

---

## 6. UI Structure (Post-Audit)

| Template section | Condition | Fields | UI fixes applied |
|---|---|---|---|
| Refund summary banner | `overpaid != null` | Read-only display | R33: stripped IRS line refs from labels |
| Amount owed banner (STACKED) | `amountOwed != null` | Read-only display | R33: stripped IRS line refs from labels |
| Direct deposit | `overpaid != null && !wantsRefundAllocation` | 4 fields (1 gate + 3 conditional) | R34, R22, R33 |
| Split refund (Form 8888) | `overpaid != null && !wantsDirectDeposit` | 13 fields (1 gate + 12 conditional) | R34, R22, R10, R6, R8, R43, R18 |
| Apply to next year | `overpaid != null` | 2 fields (1 gate + 1 conditional) | R34, R8, R43 |
| Prior year / Form 2210 | `amountOwed != null` | 9+ fields with screening gate | R8, R43, R2, TurboTax-aligned |

Direct deposit and split refund are **mutually exclusive** at the template level.

---

## 7. Legacy Form Fallback Chain

Backend at `TaxReturnComputeService.java` lines ~193-199 implements merge-with-fallback:

```text
1. Read unified form: refund-and-amount-owed-taxpayer
2. For each field group, if the unified form has the field → use it
3. Otherwise, fall back to the legacy form:
   - Direct deposit fields → 35-direct-deposit
   - Refund allocation fields → refund-allocation-taxpayer
   - Apply to next year fields → 36-apply-to-next-year
   - Prior year / Form 2210 fields → prior-year-tax-taxpayer
```

All 5 form IDs are registered in `PersonalResource.java` `PERSONAL_FORMS` set.

YAML + component:

| YAML file | Component | Backend form IDs |
|---|---|---|
| `C:\us-tax\yamls\refund-and-amount-owed-taxpayer.yaml` | `form-refund-and-amount-owed.component.ts` | `refund-and-amount-owed-taxpayer` (primary) + 4 legacy IDs (fallback) |

---

## 8. PDF Field Map (page 2 — lines 34-38)

| CSV semantic name | Source |
|---|---|
| `line34_overpaid` | `refund.overpaid` |
| `line35a_refund_amount` | `refund.refundAmount` |
| `direct_deposit_routing_number` | `refund.routingNumber` |
| `direct_deposit_account_type_checking` | `refund.accountType == "Checking"` |
| `direct_deposit_account_type_savings` | `refund.accountType == "Savings"` |
| `direct_deposit_account_number` | `refund.accountNumber` |
| `line36_2025_estimated_tax` (★ cosmetic carryover — semantically 2026) | `refund.amountAppliedToNextYear` |
| `line37_amount_you_owe` | `AmountOwed.getLineThirtySevenPure()` (un-stacked) |
| `line38_estimated_tax_penalty` | `AmountOwed.estimatedTaxPenalty` (penalty alone) |
| Full Form 2210 (199 fields) | rendered by `form-tax-return-2210.component.ts` |
| Full Form 8888 | semantic assets published; fill code deferred (G4) |

---

## 9. Null Behavior Summary

| Sub-line | Null condition | Convention 1 mechanism |
|---|---|---|
| 34 (overpaid) | `line33 ≤ totalTax` | GATED-NOT-SET (entire if-block skipped; Refund not lazy-init'd) |
| 35a (refund amount) | `overpaid − line36Capped ≤ 0` | ternary-at-setter |
| 35b (routing) | DD not elected OR Form 8888 active OR blank | if-gate-around-setter |
| 35c (account type) | same | if-gate-around-setter |
| 35d (account number) | same | if-gate-around-setter |
| 36 (apply to next year) | `line36Capped ≤ 0` | if-gate-around-setter |
| 37 pure (amount owed) | `totalTax ≤ line33` | GATED-NOT-SET (Stage 1 else-if skipped; AmountOwed not lazy-init'd) |
| 38 (Form 2210 penalty) | balance < $1,000 OR `l9 ≥ l8` OR Box A waiver | HELPER-RETURNED-NULL + Stage 2 4-condition if-gate |

---

## 10. MFS Behavior

All 5 sub-lines (34, 35a-d, 36, 37) and Form 2210 inherit MFS protection transitively (M2) from upstream values. The `isMfs` check inside `computeForm2210` at line 27609 is **tax-rule routing** (Convention 5 — IRS MFS half-threshold), NOT MFS-leakage protection.

Per-return personal forms (direct deposit, refund allocation, apply to next year, prior-year tax) are inherently per-return — each MFS spouse files separately with their own form.

---

## 11. Test Coverage

### E2E — Compute tests (`refund-and-amount-owed.spec.ts`)

| Test | Coverage |
|---|---|
| Unified form ID accepted by backend | HTTP 200 on PUT |
| Direct deposit fields reflected in compute | Lines 35b/c/d |
| Apply-to-next-year reduces refundAmount | Line 36 |
| Apply-to-next-year capped at overpaid | Line 36 ceiling (silent cap) |
| Split refund two accounts | Form 8888 |
| Split refund suppresses DD | Form 8888 trumps Form 1040 35b/c/d |
| Underpayment penalty from prior-year data | Form 2210 regular-method |
| 110% safe harbor (prior AGI > $150k) | Form 2210 110% tier |
| MFS 110% safe harbor (prior AGI > $75k) | Form 2210 MFS half-threshold |
| `waiveFullPenalty` → Box A → WAIVED | Form 2210 Box A short-circuit |
| `waivePartialPenalty` → Box B stored | Form 2210 Box B (recorded only) |
| `jointSeparateMismatch` → Box E stored | Form 2210 Box E (recorded only) |
| Three-account Form 8888 split | Form 8888 multi-account |
| Fallback: legacy `prior-year-tax` | Backward compat |
| Fallback: legacy `35-direct-deposit` | Backward compat |

### E2E — UI verification (`refund-and-amount-owed-ui.spec.ts`)

| Test | Coverage |
|---|---|
| Section titles strip IRS line numbers | R33/R34 regression |
| Section preamble for direct deposit | R22 regression |
| Help icons on Form 8888 sub-fields | R10/R6 regression |
| Display banners strip IRS line numbers | R33 regression |

---

## 12. Key 2025 Constants (Form 2210)

| Constant | 2025 Value | Source |
|---|---|---|
| `F2210_PENALTY_ANNUAL_RATE` | 7% | IRS short-term federal rate + 3% (fixed-rate approximation) |
| `F2210_PENALTY_DAILY_RATE` | ≈ 0.07 / 365 | derived |
| `F2210_NO_PENALTY_BALANCE_THRESHOLD` | $1,000 | IRS — penalty applies only when balance ≥ $1,000 |
| `F2210_SAFE_HARBOR_HIGH_AGI_THRESHOLD_OTHERS` | $150,000 | 110% above this |
| `F2210_SAFE_HARBOR_HIGH_AGI_THRESHOLD_MFS` | $75,000 | MFS half-threshold |
| `F2210_SAFE_HARBOR_HIGH_RATE` | 110% (1.10) | Above-threshold safe-harbor multiplier |
| current-year safe harbor | 90% (0.90) | Required annual payment baseline |
| `F2210_DEFAULT_DAYS_UNDERPAID` | (365, 303, 212, 90) | Q1/Q2/Q3/Q4 → Apr 15 next year |
| installment divisor | 4 | l8 / 4 per period |

All constants defined in `ReferenceData.java` with `F2210_` prefix.

---

## 13. Gap Status

| ID | Priority | Description | Status |
|---|---|---|---|
| G3 | LOW | `$1` minimum refund rule not enforced | **OPEN** — carried from `dependencies/33.md` |
| G4 | LOW | Form 8888 PDF fill/export not implemented | **DEFERRED** — semantic assets published, fill code absent |
| G5 | LOW | Form 8888 / Form 8379 cross-check | **DEFERRED** — Form 8379 not implemented |
| G6 | LOW | Form 8888 IRA/HSA account types | **DEFERRED** — only Checking/Savings offered |
| G7 | OOS | Form 2210 Schedule AI (Box C — annualized income) | **OUT OF SCOPE** |
| G8 | OOS | Form 2210 Box D (actual withholding dates) | **OUT OF SCOPE** |
| G9 | OOS | Form 2210-F (farmers/fishermen 66⅔%) | **OUT OF SCOPE** |
| UI-R38 | LOW | `ChangeDetectionStrategy.OnPush` not adopted | **DEFERRED** project-wide |
| UI-R33-BANNER | LOW | Display banner labels referenced line numbers | **FIXED** — stripped from template |
| LINE_36_CAPPED | LOW | No advisory when `amountToApply > overpaid` (silent cap) | **DEFERRED** — UX visibility left to UI |
| LINE_35D_TOO_LONG | LOW | 17-char `accountNumber` overrun | **IMPLEMENTED** — advisory flag emitted |
| LINE_35D_INVALID_CHARS | LOW | `[0-9A-Z-]` class violation | **IMPLEMENTED** — advisory flag emitted |
| LINE_35BCD_INCOMPLETE_TRIPLE | LOW | DD elected but ≥ 1 of routing/type/number blank | **IMPLEMENTED** — advisory flag emitted |
