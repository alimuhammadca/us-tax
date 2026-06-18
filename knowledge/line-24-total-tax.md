# Knowledge: Form 1040 Line 24 — Total Tax (2025)

> Audited 2026-04-19. Line 24 (`TaxAndCredits.totalTax`) is a pure addition: `line22 + nz(line23)`. It is always stored as at least `BigDecimal.ZERO` (never null). The computation is concentrated in one 34-line method; no separate accumulation pass is needed. Two gaps identified and fixed 2026-04-19: Form 2210 Part I Line 1 now reads `getTaxAfterCredits()` (line 22) instead of `getTotalTaxBeforeCredits()` (line 18) (G1), and a dedicated E2E spec `line24-total-tax.spec.ts` was created with 2 scenarios (G2).

---

## 1. Line Identity

**Form 1040 (2025) line 24** is labeled:

```
Add lines 22 and 23. This is your total tax.
```

| Concept | Value |
|---|---|
| IRS label | "Add lines 22 and 23. This is your total tax." |
| Java model field | `TaxAndCredits.totalTax` |
| Getter | `getTotalTax()` |
| Setter | `setTotalTax(BigDecimal)` |
| Java model class | `C:\us-tax\us-tax-be\src\main\java\com\ustax\model\output\TaxAndCredits.java` (line 27) |
| Frontend TS field | `form.taxAndCredits?.totalTax` |
| PDF semantic key | `line24_total_tax` |
| PDF AcroForm field | `topmostSubform[0].Page2[0].f2_16[0]` |
| Page / rect in CSV | Page 2, `(504, 528.001, 576, 540)` |
| CSV source | `C:\us-tax\us-tax-ui\public\irs\f1040_field_mapping_semantic.csv` |

---

## 2. Core Formula

```
line24 = nz(line22) + nz(line23)
       = nz(taxAfterCredits) + nz(otherTaxes)
```

IRS form instruction (2025): "Add lines 22 and 23."

Surrounding page-2 chain:

```
line18 = totalTaxBeforeCredits                        (line16 + line17)
line21 = totalCredits                                 (CTC/ODC + Schedule 3 line 8)
line22 = max(0, line18 − line21)                      (taxAfterCredits)
line23 = Schedule2.line21 = otherTaxes                (Schedule 2 Part II total)
line24 = nz(line22) + nz(line23)                      (totalTax)
```

Key guardrails per IRS:
- Line 24 ≥ 0 (guaranteed because line 22 is already floored at 0 and line 23 sub-items are non-negative)
- Line 24 = line 22 when line 23 = 0
- Line 24 = line 23 when line 22 = 0 (credits absorb all regular tax; other taxes remain)
- No credits, payments, or withholding reduce line 24 — those begin at line 25

---

## 3. Backend Implementation

### Method: `computeLine20ThroughLine24()` — Lines 15087–15120

**File:** `C:\us-tax\us-tax-be\src\main\java\com\ustax\microservices\TaxReturnComputeService.java`

```java
private void computeLine20ThroughLine24(Form1040 form1040, Schedule3 schedule3) {
    TaxAndCredits tac = form1040.getTaxAndCredits();
    if (tac == null) { return; }

    // Line 20 = Schedule 3 line 8
    BigDecimal line20 = /* ... Schedule3.nonrefundableCredits.totalNonrefundableCredits ... */;
    tac.setOtherCreditsSchedule3(line20);

    // Line 21 = line19 (CTC+ODC) + line20
    BigDecimal line19 = safeAmount(tac.getChildTaxCredit());
    BigDecimal line21 = roundMoney(line19.add(safeAmount(line20)));
    tac.setTotalCredits(line21.compareTo(BigDecimal.ZERO) > 0 ? line21 : null);

    // Line 22 = max(0, line18 − line21)
    BigDecimal line18 = safeAmount(tac.getTotalTaxBeforeCredits());
    BigDecimal line22 = roundMoney(line18.subtract(line21).max(BigDecimal.ZERO));
    tac.setTaxAfterCredits(line22);

    // Line 24 = line22 + line23 (other taxes from Schedule 2)
    BigDecimal line23 = safeAmount(tac.getOtherTaxes());    // finalized by finalizeSchedule2OtherTaxes()
    BigDecimal line24 = roundMoney(line22.add(line23));
    tac.setTotalTax(line24.compareTo(BigDecimal.ZERO) > 0 ? line24 : BigDecimal.ZERO);

    LOG.infof("Lines 20-24 — line20=%s line21=%s line22=%s line23=%s line24=%s",
              line20, line21, line22, line23, line24);
}
```

**Storage rule:** `totalTax` is always stored as at least `BigDecimal.ZERO` — never null. This differs from `taxAfterCredits` (line 22) and `totalCredits` (line 21) which can be stored as null when zero. Rationale: line 24 is the total tax liability and is always shown on the form.

**Call site:** `prepare()` line 1067, immediately after `finalizeSchedule2OtherTaxes()` (line 1065) and before `computeLine31ThroughLine38()` (line 1069).

### Helper utilities used

| Utility | Behavior |
|---|---|
| `safeAmount(x)` | Returns `BigDecimal.ZERO` when `x` is null |
| `roundMoney(x)` | Rounds to nearest dollar (HALF_UP) when `ROUNDING_MODE == WHOLE_DOLLAR` |

---

## 4. Frontend: PDF Fill

**File:** `C:\us-tax\us-tax-ui\src\app\forms\form-tax-return-1040.component.ts`

```typescript
// Line 329
values['line24_total_tax'] = this.formatAmount(form.taxAndCredits?.totalTax);
```

### Other frontend consumers of `totalTax`

| File | Line | Usage |
|---|---|---|
| `form-tax-return-1040.component.ts` | 147 | TypeScript interface field: `totalTax?: number \| string \| null` |
| `form-tax-return-1040.component.ts` | 329 | PDF fill: `line24_total_tax` |
| `shell.component.ts` | 887 | Summary display: `const taxTotal = tax?.['totalTax']` |
| `form-tax-return-schedule2.component.ts` | 22, 145 | Schedule 2 PDF fill for Part I line 3 total tax |
| `form-alt-fuel-credit.component.ts` | 387 | Import from Schedule 2: `this.importedSchedule2 = this.num(schedule2?.tax?.totalTax)` |
| `form-bond-credit.component.ts` | 292 | Import from Schedule 2: `this.importedSchedule2 = this.num(schedule2?.tax?.totalTax)` |

---

## 5. Compute Order

```
finalizeSchedule2OtherTaxes(schedule2, form1040)     ← line 1065 — populates tac.otherTaxes (line 23)
computeLine20ThroughLine24(form1040, schedule3)       ← line 1067 — computes lines 20–24
  → reads tac.getTotalTaxBeforeCredits()  as line18
  → reads tac.getOtherTaxes()             as line23  (finalized by prior step)
  → sets  tac.taxAfterCredits             = line22
  → sets  tac.totalTax                    = line24
computeLine31ThroughLine38(...)                       ← line 1069 — uses tac.getTotalTax() for refund/owed
computeForm2210(form1040, priorYearData, ...)         ← later — uses tac for underpayment penalty
```

---

## 6. Unit Tests

**File:** `C:\us-tax\us-tax-be\src\test\java\com\ustax\microservices\TaxReturnComputeServiceTest.java`

| Test name | Line | What it asserts for line 24 |
|---|---|---|
| `line23_otherTaxes_equalsForm5329PenaltyAlone` | 16338 | `totalTax == taxAfterCredits + 1000` (Form 5329 penalty adds to line 24) |
| `line23_otherTaxes_equalsCombinedForm5329AndAdditionalMedicareTax` | 16441 | `totalTax >= taxAfterCredits + 1450` (combined AMT + Form 5329 in line 24) |

**Added 2026-04-19:** `form2210Line1UsesTaxAfterCreditsNotTotalTaxBeforeCredits` — $38k wages + Form 8880 savings credit ($200 at 10% rate). Asserts `taxAfterCredits < totalTaxBeforeCredits`, `f2210.currentYearTax == taxAfterCredits`, and `f2210.combinedTax == taxAfterCredits + otherTaxes`. Directly tests the G1 fix: verifies Form 2210 line 1 uses line 22, not line 18.

---

## 7. E2E Tests

**Dedicated spec added 2026-04-19:** `C:\us-tax\us-tax-be\e2e\tests\line24-total-tax.spec.ts`

| Spec | Test name | Line 24 assertion |
|---|---|---|
| `line24-total-tax.spec.ts` | "Line 24 — equals line 22 when no other taxes are present (line 23 is zero)" | `expect(totalTax).toBe(taxAfterCredits)` — normal path |
| `line24-total-tax.spec.ts` | "Line 24 — equals line 23 when credits zero out line 22 (other taxes remain)" | `expect(taxAfterCredits).toBe(0); expect(otherTaxes).toBe(500); expect(totalTax).toBe(500)` — edge case G2 |
| `line23-other-taxes.spec.ts` | "Scenario 1 — Form 5329 penalty alone" | `expect(totalTax).toBeCloseTo(taxAfterCredits + 1000, 0)` |
| `line23-other-taxes.spec.ts` | "Scenario 3 — Combined Form 5329 + AMT" | `expect(totalTax).toBeGreaterThanOrEqual(taxAfterCredits + 1450)` |
| `line20-nonrefundable-credits.spec.ts` | Multiple scenarios | `expect(payload?.form1040?.taxAndCredits?.totalTax).toBeGreaterThanOrEqual(0)` |

---

## 8. Downstream Consumers

| Consumer | How used | Detail |
|---|---|---|
| `computeLine31ThroughLine38()` | Reads `tac.getTotalTax()` to compute refund vs. amount owed | `if (line33 > totalTax)` → refund; `if (totalTax > line33)` → amount owed |
| `computeForm2210()` | Part I reconstructs current-year tax from components | Does NOT read `totalTax` directly — reads `taxAfterCredits` (line 22, **fixed 2026-04-19**) and `otherTaxes` (line 23) separately for lines 1 and 2. |
| Frontend `shell.component.ts` | Summary display | `const taxTotal = tax?.['totalTax']` |
| Frontend `form-tax-return-schedule2.component.ts` | Schedule 2 Part I line 3 PDF fill | Passes through to the Schedule 2 "Tax" total |

---

## 9. Identified Gaps

| ID | Severity | Status | Description | Fix applied |
|---|---|---|---|---|
| G1 | MEDIUM | **Fixed 2026-04-19** | `computeForm2210()` Part I Line 1 was reading `getTotalTaxBeforeCredits()` (line 18) instead of `getTaxAfterCredits()` (line 22). For taxpayers with nonrefundable credits, the underpayment penalty base was overstated by the amount of line 21. | Changed `getTotalTaxBeforeCredits()` → `getTaxAfterCredits()` at `TaxReturnComputeService.java` line ~15409. Added unit test `form2210Line1UsesTaxAfterCreditsNotTotalTaxBeforeCredits`. 398 tests pass. |
| G2 | LOW | **Fixed 2026-04-19** | No dedicated `line24-total-tax.spec.ts` E2E spec. The edge case "line22=0, line23>0 → line24=line23" was untested. | Created `e2e/tests/line24-total-tax.spec.ts` with 2 scenarios covering normal path (line24=line22) and edge case (line24=line23). |

---

## 10. Spec Accuracy (lines/24.md)

The spec at `C:\us-tax\lines\24.md` is **accurate for 2025**. Formula, guardrails, examples, and the surrounding page-2 chain are all correct. The implementation note matches the backend pattern.

Minor observation: the spec notes Form 2210 as a downstream consumer only implicitly (via line 38). The G1 gap in `computeForm2210()` is an implementation bug, not a spec error.

No corrections were made to the spec file.
