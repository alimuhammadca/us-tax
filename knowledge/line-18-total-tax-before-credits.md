# Knowledge: Form 1040 Line 18 — Total Tax Before Credits (2025)

Audit date: 2026-04-18
Sources: `C:\us-tax\lines\18.md`, `TaxReturnComputeService.java`, `TaxAndCredits.java`,
`form-tax-return-1040.component.ts`, `TaxReturnComputeServiceTest.java`,
`line18-total-tax-before-credits.spec.ts`, `f1040_field_mapping_semantic.csv`,
IRS 2025 Form 1040 / 1040-SR, `C:\us-tax\docs\books\i1040gi_2025.txt`,
J.K. Lasser's Your Income Tax 2025 Professional Edition.

---

## 1. Line Identity

```
Form1040.line18 = Form1040.line16 + Form1040.line17
```

IRS label (2025 Form 1040): **"Add lines 16 and 17."**

This is the **tax-before-credits subtotal**. It is not the final total tax on the return.

---

## 2. What Line 18 Represents

Line 18 is the sum of:
- **Line 16**: tax on taxable income, which may include regular income tax + Form 8814 tax + Form 4972 lump-sum tax + Box 3 write-in taxes (ECR, 962, 1291TAX, Form 8978, 965INC).
- **Line 17**: Schedule 2 line 3 total, which is `Schedule2.line1z + Form6251.line11`. In the current implementation `Schedule2.line1z = 0` (all Schedule 2 Part I line 1 items are out of scope), so `line17 = Form6251.line11` (AMT) in practice.

Line 18 is **not** the total tax. It specifically excludes:
- Schedule 2 Part II other taxes (lines 4–21), added later as line 23.
- Payments and withholding (lines 25a–25d), applied in the payments section.

The flow after line 18:
```
line21 = line19 + line20            (nonrefundable credits sum)
line22 = max(0, line18 − line21)    (tax after nonrefundable credits)
line23 = Schedule2.line21           (other taxes from Schedule 2 Part II)
line24 = line22 + line23            (total tax)
```

---

## 3. Backend Implementation

### Method: `computeLine18(Form1040, String uid)`
Location: `TaxReturnComputeService.java` ~line 8566

```java
private void computeLine18(Form1040 form1040, String uid) {
    TaxAndCredits taxAndCredits = form1040.getTaxAndCredits();
    if (taxAndCredits == null) {
        // No tax computed — zero taxable income path.
        return;
    }
    BigDecimal line16 = taxAndCredits.getTax() != null
            ? taxAndCredits.getTax() : BigDecimal.ZERO;
    BigDecimal line17 = taxAndCredits.getAlternativeMinimumTax() != null
            ? taxAndCredits.getAlternativeMinimumTax() : BigDecimal.ZERO;
    BigDecimal line18 = line16.add(line17);
    taxAndCredits.setTotalTaxBeforeCredits(line18);
}
```

**Key implementation notes:**
- `line17` is read from `taxAndCredits.getAdditionalTaxSchedule2()`, which represents Schedule 2 line 3 (`line1z + Form6251.line11`). This is the semantically correct field for Form 1040 line 17. While `Schedule2.line1z = 0` always in current scope (making it equivalent to `alternativeMinimumTax`), using `additionalTaxSchedule2` future-proofs the computation against any Schedule 2 Part I line 1z implementation. **G1 fixed 2026-04-18.**
- `null` is treated as zero for both inputs (safe fallback).
- The result is always non-negative by construction.

### Call sites in `prepare()`

| Order | Location | Reason |
|---|---|---|
| Primary | After `computeLine17()` (prepare ~line 825) | Normal computation pass |
| Secondary | Inside `correctLine17ForFtc()` (~line 8547) | G-new-1 fix: refresh after FTC correction changes line 17 |

### Related method: `wireLine17ToOutputs()`

Sets both `taxAndCredits.alternativeMinimumTax` and `taxAndCredits.additionalTaxSchedule2` to Form 6251 line 11 (or null if zero). The comment at line 8486 explicitly notes: `"Wire Schedule 2 line 3 total (line1z + line2 = 0 + amt)"`.

---

## 4. Output Model

**`TaxAndCredits.java`** — field: `totalTaxBeforeCredits: BigDecimal`
- Getter: `getTotalTaxBeforeCredits()`
- Setter: `setTotalTaxBeforeCredits(BigDecimal)`

This field is the primary output of `computeLine18()` and is the single read point for all downstream Credit Limit Worksheets.

---

## 5. Frontend Implementation

### Interface (`form-tax-return-1040.component.ts`)
```typescript
interface TaxAndCredits {
    totalTaxBeforeCredits?: number | string | null;
    // ...
}
```

### PDF field mapping
```typescript
values['line18_total_tax_add_lines16_17'] =
    this.formatAmount(form.taxAndCredits?.totalTaxBeforeCredits);
```

PDF field key: `line18_total_tax_add_lines16_17` — confirmed in `f1040_field_mapping_semantic.csv` (page 2, Text field at rect `(504, 612, 576, 623.999)`).

---

## 6. Compute Order

```
1. computeLine16()   →  TaxAndCredits.tax (line 16)
2. computeLine17()   →  TaxAndCredits.alternativeMinimumTax (line 17)
3. computeLine18()   →  TaxAndCredits.totalTaxBeforeCredits (line 18)
         ↓
4. computeForm1116() → FTC computed
5. applyForeignTaxCreditToSchedule3() → Schedule3.line1 = FTC
6. correctLine17ForFtc() [if FTC > 0]:
       - corrects Form6251.line10 (subtracts FTC)
       - recalculates Form6251.line11
       - calls wireLine17ToOutputs() to update TaxAndCredits.alternativeMinimumTax
       - calls computeLine18() again → refreshes totalTaxBeforeCredits  ← G-new-1 fix
         ↓
7. Downstream CLWs read totalTaxBeforeCredits:
   - finalizeForm2441PartII()     → child/dependent care CLW
   - computeForm8880()            → saver's credit CLW
   - computeSchedule8812()        → CTC / ODC / ACTC
   - computeForm8863()            → education credits CLW
   - computeForm1116CLW()         → FTC CLW
   - computeForm8839()            → adoption credit CLW (partial — CLW wiring deferred)
```

---

## 7. Downstream Consumers of `totalTaxBeforeCredits`

| Consumer | How it reads line 18 | Purpose |
|---|---|---|
| `finalizeForm2441PartII()` | `getTaxAndCredits().getTotalTaxBeforeCredits()` | Form 2441 Credit Limit Worksheet |
| `computeForm8880()` | `getTaxAndCredits().getTotalTaxBeforeCredits()` | Saver's Credit CLW line 10 |
| `computeSchedule8812()` | Reads `TaxAndCredits.totalTaxBeforeCredits` | CTC/ODC Credit Limit Worksheet line 10 |
| `computeForm8863()` | `getTaxAndCredits().getTotalTaxBeforeCredits()` | Education Credits CLW |
| `computeForm1116()` CLW | `getTaxAndCredits().getTotalTaxBeforeCredits()` | FTC CLW line 10 |
| Line 22 computation | Via `getTotalTaxBeforeCredits()` | `line22 = max(0, line18 − line21)` |
| Form 8839 CLW | `getTaxAndCredits().getTotalTaxBeforeCredits()` | Adoption credit CLW (partially implemented) |

---

## 8. Test Inventory

### Unit tests (`TaxReturnComputeServiceTest.java`)

| Test name | Scenario | Expected |
|---|---|---|
| `line18TotalTaxNoIncome` | No income seeded | `totalTaxBeforeCredits` null or 0 |
| `line18TotalTaxLine16OnlyNoAmt` | Single, $50k wages (below AMT exemption) | `line18 == line16`; `line17` is null |
| `line18TotalTaxLine16PlusLine17` | Single, $200k wages + $100k PAB interest | `line18 == line16 + line17`; `line18 > line16` |
| `line18UsesAdditionalTaxSchedule2ForLine17AddendNotAlternativeMinimumTax` | Same AMT scenario | `alternativeMinimumTax == additionalTaxSchedule2`; `totalTaxBeforeCredits == tax + additionalTaxSchedule2` (G1 fix) |

Total: 4 unit tests.

Additional related coverage:
- `line17GNew1TotalTaxBeforeCreditsRefreshedAfterFtcCorrection` — verifies `totalTaxBeforeCredits` is refreshed after FTC correction (G-new-1 fix; in line 17 test section).

### E2E tests (`line18-total-tax-before-credits.spec.ts`)

| Test name | Scenario | Expected |
|---|---|---|
| `Line 18 — no taxable income: totalTaxBeforeCredits is zero or null` | No W-2, single filer | `line18 === null \|\| line18 === 0` |
| `Line 18 — W-2 wages only, no AMT: totalTaxBeforeCredits equals line 16` | Single, $50k wages | `line18 === line16`; `line17` null or 0 |
| `Line 18 — with AMT: totalTaxBeforeCredits equals line 16 + line 17` | Single, $200k wages + $100k PAB | `line18 === line16 + line17`; `line18 > line16` |

Total: 3 E2E tests.

---

## 9. IRS 2025 Verification

- **Form 1040 line 18 label**: "Add lines 16 and 17."
- **Interpretation**: Tax-before-credits subtotal. Starting point for the nonrefundable credits section.
- **No 2025-specific changes** to line 18 arithmetic. It has been `line16 + line17` since 2018 TCJA restructuring.
- **Line 17 composition (2025)**: `Schedule2.line3 = Schedule2.line1z + Schedule2.line2`. `line2 = Form6251.line11` (AMT). `line1z` covers Schedule 2 line 1a–1y additions (clean-energy recapture, PTC excess, etc.) — these are currently 0 / out of scope.

Cross-checked against:
- `C:\us-tax\docs\books\i1040gi_2025.txt` — multi-column format; line 18 instruction confirmed as simple addition line
- J.K. Lasser's Your Income Tax 2025 — confirms line 18 is the tax-before-credits subtotal
- `C:\us-tax\lines\18.md` — spec is accurate and IRS-aligned

---

## 10. Identified Gaps

| # | Description | Severity | Status |
|---|---|---|---|
| G1 | `computeLine18()` read `alternativeMinimumTax` (Form6251.line11 only) instead of `additionalTaxSchedule2` (Schedule 2 line 3 = `line1z + Form6251.line11`). Equivalent while `Schedule2.line1z = 0`, but semantically incorrect and fragile against future Schedule 2 Part I line 1z implementations. | LOW | **Fixed 2026-04-18** — now reads `additionalTaxSchedule2`; test `line18UsesAdditionalTaxSchedule2ForLine17AddendNotAlternativeMinimumTax` added |
| G2 | No dedicated flowchart in `C:\us-tax\flowcharts\`. | LOW | **Fixed 2026-04-18** — `flowcharts/18.drawio` created |
| G3 | No dependency document in `C:\us-tax\dependencies\`. | LOW | **Fixed 2026-04-18** — `dependencies/18.md` created |

---

## 11. Out of Scope

- Schedule 2 line 1z items (all out of scope; see `outstanding.md` for list)
- Any direct line 18 user input (line 18 is always computed; no personal form)
- Line 18 is not visible as a standalone form in the sidebar — it is shown on the `form-tax-return-1040` Tax Return view
