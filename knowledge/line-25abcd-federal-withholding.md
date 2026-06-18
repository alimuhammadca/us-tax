# Knowledge: Form 1040 Lines 25a–25d — Federal Income Tax Withheld (2025)

> Audited 2026-04-19. All gaps fixed 2026-04-19. Lines 25a–25d aggregate all federal income tax withheld during the year from three categorized buckets: W-2 (25a), 1099-series/SSA-1099/RRB-1099/1099-DA (25b), and W-2G/Form 8959 (25c); 25d is their sum. Implementation complete as of 2026-04-19. Only remaining OOS item: K-1/1042-S/8805/8288-A (G4).

---

## 1. Line Identity

| Sub-line | 2025 Form 1040 label | Java field | Frontend TS field |
|---|---|---|---|
| 25a | Federal income tax withheld from Form(s) W-2 | `Payments.withholdingW2` | `form.payments?.withholdingW2` |
| 25b | Federal income tax withheld from Form(s) 1099 | `Payments.withholding1099` | `form.payments?.withholding1099` |
| 25c | Federal income tax withheld from other forms | `Payments.withholdingOther` | `form.payments?.withholdingOther` |
| 25d | Add lines 25a through 25c | `Payments.totalWithholding` | `line25dTotalWithholding()` (computed client-side from sub-lines) |

- Java model: `C:\us-tax\us-tax-be\src\main\java\com\ustax\model\output\Payments.java`
- Frontend component: `form-tax-return-1040.component.ts`

---

## 2. Core Formula

```
line25a = sum(all W-2 box 2 amounts)
line25b = sum(all 1099-series box 4 amounts) + SSA-1099 box 6 + RRB-1099 box 10 + RRB-1099-R box 9
line25c = sum(W-2G box 4) + Form8959.line24
line25d = nz(line25a) + nz(line25b) + nz(line25c)
```

`totalWithholding` (25d) is set to null if zero. The three sub-lines are also null when absent.

---

## 3. IRS 2025 Routing — What Goes Where

### 3a. Line 25a — W-2

- W-2 box 2 (`federalIncomeTaxWithheldAmount`) from all W-2 entries

### 3b. Line 25b — 1099 series, SSA-1099, RRB-1099, RRB-1099-R

Per IRS 2025 instructions: "box 4 of Form 1099", "box 6 of Form SSA-1099", "box 10 of Form RRB-1099."

Implemented sources:

| Statement | Field read | Box |
|---|---|---|
| 1099-R | `federalIncomeTaxWithheldAmount` | box 4 |
| 1099-INT | `federalIncomeTaxWithheldAmount` | box 4 |
| 1099-DIV | `federalIncomeTaxWithheldAmount` | box 4 |
| 1099-B | `federalIncomeTaxWithheldAmount` | box 4 |
| 1099-OID | `federalIncomeTaxWithheldAmount` | box 4 |
| 1099-G | `federalIncomeTaxWithheldAmount` | box 4 |
| 1099-NEC | `federalIncomeTaxWithheldAmount` | box 4 (backup withholding) |
| 1099-K | `federalIncomeTaxWithheldAmount` | box 4 (backup withholding) |
| 1099-MISC | `federalIncomeTaxWithheldAmount` | box 4 |
| SSA-1099 | `voluntaryFederalIncomeTaxWithheldAmount` | box 6 — **non-standard field name** |
| RRB-1099 | `federalIncomeTaxWithheldAmount` | box 10 |
| RRB-1099-R | `federalIncomeTaxWithheldAmount` | box 9 |

**1099-DA included (G1 fixed 2026-04-19):** `form1099DaEntries` added as parameter to `computeLine31ThroughLine38()` and appended to `sumFederalWithholdingFromMultipleLists()`. Unit test `line25bWithholdingFrom1099Da` and E2E Test 7 added.

### 3c. Line 25c — Other Forms

| Source | Field read | Notes |
|---|---|---|
| W-2G | `federalIncomeTaxWithheldAmount` | box 4, gambling winnings |
| Form 8959 Part V line 24 | `Form8959.line24TotalAmtWithheld` | Medicare + RRTA withholding; line 22 (W-2 box 4) + line 23 (Form 4137 Part II) |

**Deferred (out of scope):** Schedule K-1 withholding, Form 1042-S, Form 8805, Form 8288-A.

### 3d. Line 25d

`25d = 25a + 25b + 25c`. Set to null when all three sub-lines are null/zero.

---

## 4. Backend Implementation

**File:** `TaxReturnComputeService.java`
**Method:** `computeLine31ThroughLine38()` — lines 15133–15335
**Sub-line block:** lines 15173–15205

### Helper methods

| Helper | Location | Purpose |
|---|---|---|
| `sumFederalWithholdingFromEntries(entries)` | line 15914 | Reads `federalIncomeTaxWithheldAmount` from each entry; skips null/zero |
| `sumSsa1099Withholding(entries)` | line 15934 | Reads `voluntaryFederalIncomeTaxWithheldAmount` — SSA-1099 only |
| `sumFederalWithholdingFromMultipleLists(lists...)` | line 15951 | Variadic wrapper — delegates to `sumFederalWithholdingFromEntries()` |

### Line 25a (lines 15173–15174)

```java
BigDecimal withholdingW2 = sumFederalWithholdingFromEntries(w2Entries);
payments.setWithholdingW2(withholdingW2);
```

### Line 25b (lines 15176–15187)

```java
BigDecimal withholding1099 = sumFederalWithholdingFromMultipleLists(
    form1099REntries, formRrb1099REntries,
    form1099IntEntries, form1099DivEntries,
    form1099BEntries, form1099OidEntries,
    form1099GEntries, form1099NecEntries, form1099KEntries,
    form1099MiscEntries, formRrb1099Entries, form1099DaEntries);  // G1 fixed 2026-04-19
withholding1099 = addNonNull(withholding1099, sumSsa1099Withholding(formSsa1099Entries));
payments.setWithholding1099(withholding1099);
```

### Line 25c (lines 15189–15199)

```java
BigDecimal withholdingOther = sumFederalWithholdingFromEntries(formW2gEntries);
if (form8959 != null && form8959.getLine24TotalAmtWithheld() != null) {
    withholdingOther = roundMoney(safeAmount(withholdingOther)
        .add(form8959.getLine24TotalAmtWithheld()));
}
payments.setWithholdingOther(withholdingOther);
```

### Line 25d (lines 15201–15205)

```java
BigDecimal totalWithholding = roundMoney(safeAmount(withholdingW2)
    .add(safeAmount(withholding1099))
    .add(safeAmount(withholdingOther)));
payments.setTotalWithholding(totalWithholding.compareTo(BigDecimal.ZERO) > 0 ? totalWithholding : null);
```

---

## 5. Form 8959 Part V → Line 25c Wiring

`buildForm8959()` is called from `prepare()` at line 591. Part V (lines 22–24):

```java
line19 = sumW2MedicareTaxWithheld(w2Entries)       // W-2 box 6 — total Medicare tax withheld
line21 = 1.45% × Medicare wages (Part I line 1)    // regular Medicare portion
line22 = max(0, line19 − line21)                   // excess withheld beyond regular 1.45%
                                                   //   null when box 6 ≤ 1.45% × wages
line23 = sumRrtaAmtWithheldFromTipForm(tipForms)   // RRTA tip withholding (Form 4137 Part II)
line24 = addNonNull(line22, line23)
form.setLine24TotalAmtWithheld(line24)
```

Then in `computeLine31ThroughLine38()` at line 15194–15197, `form8959.getLine24TotalAmtWithheld()` is added to `withholdingOther`.

---

## 6. Output Model

**File:** `Payments.java`

| Field | Type | Getter/Setter |
|---|---|---|
| `withholdingW2` | `BigDecimal` | `getWithholdingW2()` / `setWithholdingW2()` |
| `withholding1099` | `BigDecimal` | `getWithholding1099()` / `setWithholding1099()` |
| `withholdingOther` | `BigDecimal` | `getWithholdingOther()` / `setWithholdingOther()` |
| `totalWithholding` | `BigDecimal` | `getTotalWithholding()` / `setTotalWithholding()` |

---

## 7. Frontend Display

**File:** `form-tax-return-1040.component.ts`

PDF field mapping:
```typescript
values['line25a_federal_income_tax_withheld_w2']          = formatAmount(payments?.withholdingW2)
values['line25b_federal_income_tax_withheld_1099']        = formatAmount(payments?.withholding1099)
values['line25c_federal_income_tax_withheld_other_forms'] = formatAmount(payments?.withholdingOther)
values['line25d_total_withholding']                       = formatAmount(line25dTotalWithholding())
```

Client-side total computation:
```typescript
protected line25dTotalWithholding(): number | null {
  return this.sumAmounts([payments.withholdingW2, payments.withholding1099, payments.withholdingOther]);
}
```

Note: Line 25d is re-computed client-side rather than using the backend `totalWithholding` directly. Results are equivalent because the frontend reads the same three sub-line values.

---

## 8. PDF Field Mapping

**CSV:** `C:\us-tax\us-tax-ui\public\irs\f1040_field_mapping_semantic.csv`

| Page | AcroForm field | Semantic key |
|---|---|---|
| 2 | `f2_17[0]` | `line25a_federal_income_tax_withheld_w2` |
| 2 | `f2_18[0]` | `line25b_federal_income_tax_withheld_1099` |
| 2 | `f2_19[0]` | `line25c_federal_income_tax_withheld_other_forms` |
| 2 | `f2_20[0]` | `line25d_total_withholding` |

---

## 9. Unit Tests

**File:** `TaxReturnComputeServiceTest.java`

| Test name | What it asserts |
|---|---|
| `line25bWithholdingFrom1099RAndMisc` | 1099-R $3k + 1099-MISC $750 → `withholding1099 = 3750`, `totalWithholding = 3750` |
| `line25bSsa1099UsesVoluntaryFederalField` | SSA-1099 `voluntaryFederalIncomeTaxWithheldAmount` $1200 → `withholding1099 = 1200` |
| `line25cWithholdingFromW2G` | W-2G $2400 → `withholdingOther = 2400` |
| `line25dAggregatesAllThreeSubLines` | W-2 $10k + 1099-R $2k + W-2G $500 → `totalWithholding = 12500` |
| `wiresLine20ThroughLine24FromSchedule3AndWithholding` | W-2 withholding $8000 flows to Payments; refund/owed computed |
| *(MFJ test via `computeLine31ThroughLine38` context)* | Both spouses' W-2 withholding combined |

---

## 10. E2E Tests

**File:** `C:\us-tax\us-tax-be\e2e\tests\line25abcd-withholding.spec.ts` (208 lines)

| # | Scenario | Key assertion |
|---|---|---|
| 1 | W-2 box 2 → line 25a | `withholdingW2 == 10000`, `totalWithholding == 10000` |
| 2 | 1099-R box 4 → line 25b | `withholding1099 == 2500`, `totalWithholding == 2500` |
| 3 | SSA-1099 `voluntaryFederalIncomeTaxWithheldAmount` → line 25b | `withholding1099 == 1200` |
| 4 | W-2G box 4 → line 25c | `withholdingOther == 2880`, `totalWithholding == 2880` |
| 5 | All three sub-lines combined → 25d | 25a $8k + 25b $1.5k + 25c $0.6k → `totalWithholding == 10100` |
| 6 | MFJ: both spouses' W-2 withholding aggregated | taxpayer $7k + spouse $5k → `withholdingW2 == 12000` |

---

## 11. Downstream Consumers

| Consumer | How used |
|---|---|
| `computeLine31ThroughLine38()` — line 33 | `line33 = line25d + line26 + line32` (total payments) |
| `form-tax-return-1040.component.ts` | PDF fill; line 33 client-side sum |
| `f1040_field_mapping_semantic.csv` | Semantic PDF field placement |

---

## 12. Special Field Name: SSA-1099

SSA-1099 box 6 (voluntary federal income tax withheld) is stored by the frontend as `voluntaryFederalIncomeTaxWithheldAmount`, not the standard `federalIncomeTaxWithheldAmount`. This requires the dedicated `sumSsa1099Withholding()` helper. All other statement types (including RRB-1099 box 10 and RRB-1099-R box 9) use the standard `federalIncomeTaxWithheldAmount`.

---

## 13. MFS / MFJ Filing Status Rules

- **MFJ**: Aggregate withholding from both spouses' statements on one return. No SSN filtering on withholding (unlike wage attribution). W-2 MFJ test (scenario 6) confirms this.
- **MFS**: Report only withholding from that filer's own income sources; spouse's withholding excluded.
- **Community property states**: Special allocation rules may apply; not implemented.

---

## 14. Identified Gaps

| ID | Severity | Status | Description |
|---|---|---|---|
| G1 | MEDIUM | **Fixed 2026-04-19** | `form1099DaEntries` added to `computeLine31ThroughLine38()` and `sumFederalWithholdingFromMultipleLists()`. Unit test + E2E Test 7 added. |
| G2 | LOW | **Fixed 2026-04-19** | E2E Test 8 added: Single/$250k wages/$4,075 Medicare withheld → Form 8959 Part V line 24 ($450) → `withholdingOther`. |
| G3 | LOW | **Fixed 2026-04-19** | E2E Test 9 added: 1099-NEC box 4 $650 backup withholding → `withholding1099`. (1099-K same code path; covered.) |
| G4 | LOW | Deferred (OOS) | K-1, 1042-S, 8805, 8288-A withholding → line 25c not implemented. Documented as out of scope. |

---

## 15. Spec Accuracy (`lines/25abcd.md`)

The spec was accurate as of the original write. Two additions were made on 2026-04-19:
1. **1099-DA** added to section 3b list and Forms checklist (new 2025 form with box 2a withholding)
2. **RRB-1099-R box 9** clarified as separate from RRB-1099 box 10 in section 3b

No formula corrections were needed.
