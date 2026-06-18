# Knowledge: Form 1040 Line 26 — Estimated Tax Payments (2025)

> Audited 2026-04-19. All gaps G1–G5 fixed 2026-04-19. Line 26 is a payments-aggregation line. Implementation complete as of 2026-03-27; MFJ spouse-form aggregation and null-taxpayer-form edge case fixed 2026-04-19.

---

## 1. Line Identity

**Form 1040 line 26** label (2025): "2025 estimated tax payments and amount applied from 2024 return"

```
Form1040.line26 = all creditable 2025 estimated federal income tax payments
                + 2024 original-return overpayment applied to 2025
                + 2024 amended-return (Form 1040-X) overpayment applied to 2025
```

Downstream:
```
Form1040.line33 = Form1040.line25d + Form1040.line26 + Form1040.line32
```

---

## 2. Input Personal Forms

| Form ID | YAML path | Scope |
|---|---|---|
| `estimated-tax-payments-taxpayer` | `C:\us-tax\yamls\26-estimated-tax-payments-taxpayer.yaml` | All filing statuses — taxpayer's own payments |
| `estimated-tax-payments-spouse` | `C:\us-tax\yamls\26-estimated-tax-payments-spouse.yaml` | MFJ: read and combined with taxpayer form. MFS: ignored (each spouse files separately). |

### Input fields (taxpayer form)

| Field | Type | Description |
|---|---|---|
| `madeEstimatedTaxPayments` | boolean | Screening gate — must be `true` or method returns null |
| `installment1Amount` | decimal | Q1 payment (due April 15, 2025) |
| `installment2Amount` | decimal | Q2 payment (due June 16, 2025) |
| `installment3Amount` | decimal | Q3 payment (due September 15, 2025) |
| `installment4Amount` | decimal | Q4 payment (due January 15, 2026) |
| `priorYearOverpaymentCredited` | decimal | 2024 original-return overpayment elected to 2025 |
| `amendedReturnOverpaymentCredited` | decimal | 2024 Form 1040-X overpayment elected to 2025 |
| `divorceFormerSpouseSSN` | string | Former spouse SSN annotation (taxpayer form only; not summed into line 26) |

---

## 3. Backend Method

**File:** `TaxReturnComputeService.java` lines 15347–15392 (post-fix)

```java
private BigDecimal computeLine26EstimatedTax(
        Map<String, Object> taxpayerForm,
        Map<String, Object> spouseForm,
        boolean isMfs) {

    Boolean taxpayerMade = taxpayerForm != null
            ? getBoolean(taxpayerForm, "madeEstimatedTaxPayments") : null;
    boolean spouseMade = !isMfs && spouseForm != null
            && Boolean.TRUE.equals(getBoolean(spouseForm, "madeEstimatedTaxPayments"));

    if (!Boolean.TRUE.equals(taxpayerMade) && !spouseMade) return null;

    List<String> fields = List.of("installment1Amount", "installment2Amount",
            "installment3Amount", "installment4Amount",
            "priorYearOverpaymentCredited", "amendedReturnOverpaymentCredited");

    BigDecimal total = null;
    if (Boolean.TRUE.equals(taxpayerMade)) {
        for (String field : fields) {
            BigDecimal v = parseAmount(taxpayerForm.get(field));
            if (v != null && v.compareTo(BigDecimal.ZERO) > 0) total = addNonNull(total, v);
        }
    }
    if (!isMfs && spouseMade) {
        for (String field : fields) {
            BigDecimal v = parseAmount(spouseForm.get(field));
            if (v != null && v.compareTo(BigDecimal.ZERO) > 0) total = addNonNull(total, v);
        }
    }
    return total != null && total.compareTo(BigDecimal.ZERO) > 0 ? roundMoney(total) : null;
}
```

**Key behaviors:**
- Both `taxpayerForm` and `spouseForm` are read for non-MFS returns
- `taxpayerForm` may be null (never saved) — handled safely; spouse form still read if it has payments
- `divorceFormerSpouseSSN` is an annotation field — NOT summed into line 26
- Returns null (not zero) when no positive payments exist

---

## 4. MFJ / MFS Handling

### MFJ (Married Filing Jointly)
- Both `taxpayerForm` and `spouseForm` are read and combined on line 26 (fixed 2026-04-19)
- `taxpayerForm` may be null (never saved) — spouse form still read in that case
- Each spouse can enter their own payments on their respective form; totals are aggregated

### MFS (Married Filing Separately)
- Only `taxpayerForm` is read; `spouseForm` is always skipped when `isMfs=true`
- On a true MFS return, each spouse files their own separate return and enters payments on their own taxpayer form

### Single / HOH / QSS
- Only `taxpayerForm` is read; no spouse concept applies

---

## 5. Output Model

**File:** `Payments.java`

| Field | Type | Null when? |
|---|---|---|
| `estimatedTaxPayments` | `BigDecimal` | Null when gate is false, form absent, or all amounts zero |

Output is null (not zero) when no positive payments are recorded. This follows the project-wide zero-vs-null convention.

---

## 6. Compute Order

```
prepare() {
  estimatedTaxPaymentsTaxpayer = personalDataService.load("estimated-tax-payments-taxpayer")
  estimatedTaxPaymentsSpouse   = personalDataService.load("estimated-tax-payments-spouse")
  filingStatus = personalDataService.load("filing-status")
  ...
}

computeLine31ThroughLine38() {                              // line 15133
  String filingStatusStr = normalizeFilingStatus(...)       // line 15209
  boolean isMfs = "Married filing separately".equals(...)  // line 15210
  BigDecimal line26 = computeLine26EstimatedTax(            // line 15212
      estimatedTaxPaymentsTaxpayer,
      estimatedTaxPaymentsSpouse,
      isMfs)
  payments.setEstimatedTaxPayments(line26)                  // line 15213
  ...
  line33 = safeAmount(totalWithholding)
         + safeAmount(line26)
         + safeAmount(line32)                               // line 15257
}
```

---

## 7. Downstream Consumers

| Consumer | How used |
|---|---|
| `computeLine31ThroughLine38()` — line 33 | `line33 = line25d + line26 + line32` |
| `computeForm2210()` — Form 2210 Part I | Uses `totalWithholding` and `totalPayments` (which includes line 26) to compute required annual payment and underpayment penalty |
| Frontend PDF fill | `form-tax-return-1040.component.ts`: `values['line26_estimated_tax_payments'] = formatAmount(payments.estimatedTaxPayments)` |
| Frontend line 33 recompute | `sumAmounts([line25dTotalWithholding(), payments.estimatedTaxPayments, line32])` |

---

## 8. Frontend Component

**File:** `C:\us-tax\us-tax-ui\src\app\forms\form-estimated-tax-payments.component.ts`

**Key behaviors:**
- `@Input() formId` — set to `'estimated-tax-payments-taxpayer'` or `'estimated-tax-payments-spouse'` depending on person tab
- Screening gate: installment and prior-year fields are hidden unless `madeEstimatedTaxPayments === true`
- `divorceFormerSpouseSSN` field is shown only for taxpayer (not spouse)
- Spouse form header says "Estimated Tax Payments (spouse — MFS only)"
- **No filing-status-based visibility filter**: spouse form is always rendered in the spouse tab regardless of filing status

---

## 9. 2025 Quarterly Due Dates

| Quarter | Period | Due Date |
|---|---|---|
| Q1 | Jan 1 – Mar 31, 2025 | April 15, 2025 |
| Q2 | Apr 1 – May 31, 2025 | **June 16, 2025** (June 15 is Sunday) |
| Q3 | Jun 1 – Aug 31, 2025 | September 15, 2025 |
| Q4 | Sep 1 – Dec 31, 2025 | January 15, 2026 |

**January payment exception:** If the taxpayer files the 2025 return and pays the full balance by **February 2, 2026** (January 31 is Saturday → February 1 is Sunday → February 2 is Monday), the Q4 installment is not required.

These dates affect Form 2210 penalty analysis but do NOT change the line 26 arithmetic — line 26 is the total of all creditable 2025 estimated payments regardless of when they were paid.

---

## 10. Unit Test Inventory

**File:** `TaxReturnComputeServiceTest.java`

| Test Name | What It Verifies |
|---|---|
| `line26EstimatedTaxInstallmentsSum` | Q1–Q4 ($2,500 each) → $10,000 on line 26 |
| `line26PriorYearOverpaymentCreditedIncluded` | $1,000 + $500 prior-year + $250 amended = $1,750 |
| `line26GateReturnNullWhenNotMade` | `madeEstimatedTaxPayments=false` → line 26 null |
| `line26FlowsIntoLine33TotalPayments` | $3,000 on line 26 → line 33 ≥ $3,000 |
| `line26MfjBothFormsAggregated` | MFJ, taxpayer $2,000 + spouse $1,500 → $3,500 |
| `line26MfjOnlySpouseFormHasPayments` | MFJ, taxpayer gate=false, spouse $1,500 → $1,500 |
| `line26MfjSpouseFormReadWhenTaxpayerFormAbsent` | MFJ, taxpayer form null, spouse $1,500 → $1,500 |
| `line26MfsSpouseFormIgnored` | MFS, taxpayer $2,000 + spouse $1,500 → $2,000 only |

---

## 11. E2E Test Inventory

**File:** `e2e/tests/line26-estimated-tax-payments.spec.ts` (5 tests)

| Test Name | What It Verifies |
|---|---|
| `line 26: four installments sum correctly` | Q1–Q4 $2,500 each → `estimatedTaxPayments = 10000` |
| `line 26: prior-year overpayment and amended-return credit included` | Q1 + prior + amended = $1,750 |
| `line 26: screening gate — no payments results in null estimated tax` | Gate false → null |
| `line 26: flows into line 33 total payments` | $3,000 → `totalPayments ≥ 3000` |
| `line 26 UI form: saves inputs and shows Saved confirmation` | UI save via PUT 200; radio button interaction |
| `line 26 MFJ: spouse form payments combined with taxpayer form payments` | MFJ $2,000 + $1,500 → $3,500 |
| `line 26 MFJ: spouse-only payments counted when taxpayer form not saved` | Taxpayer form absent; spouse $1,500 → $1,500 |
| `line 26 MFS: spouse form payments are ignored` | MFS; only taxpayer $2,000 counted |
| `line 26: divorceFormerSpouseSSN is saved and does not affect line 26 sum` | SSN persists; line 26 = $1,000 (annotation only) |

---

## 12. Identified Gaps

| ID | Severity | Status | Description |
|---|---|---|---|
| G1 | MEDIUM | **Fixed 2026-04-19** | MFJ spouse form now read and combined. 3 unit tests + 2 E2E tests. |
| G2 | LOW | **Fixed 2026-04-19** | MFS/MFJ unit tests added (4 new tests). |
| G3 | LOW | **Fixed 2026-04-19** | MFS/MFJ E2E tests added (2 scenarios). |
| G4 | LOW | **Fixed 2026-04-19** | `taxpayerForm == null` early exit removed; spouse-only MFJ payments no longer lost. Unit test + E2E test. |
| G5 | LOW | **Fixed 2026-04-19** | E2E test for `divorceFormerSpouseSSN` round-trip + annotation-only verification. |
| G6 | LOW | Deferred | Payment dates not captured. Needed for Form 2210 Schedule AI — out of scope. |
| G7 | OOS | Deferred | Farmers and fishermen: 66⅔% one-installment rule and Form 2210-F path. |
| G8 | OOS | Deferred | Community property MFS 50/50 allocation of jointly-made payments. |
