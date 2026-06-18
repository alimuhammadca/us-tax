# Knowledge: Form 1040 Line 15 — Taxable Income

**Tax Year:** 2025  
**Last updated:** 2026-04-17  
**Status:** Implementation complete. Minor tech-debt field (frontend reads legacy alias). QBI second-pass E2E gap.

---

## 1. What this line computes

| Line | IRS label | Formula |
|---|---|---|
| **15** | Taxable income | `max(0, line11b − line14)` |

IRS printed instruction: *"Subtract line 14 from line 11b. If zero or less, enter -0-. This is your taxable income."*

- **line 11b** = AGI carryforward from page 1
- **line 14** = `line12e + line13a + line13b` (total deductions)
- **line 15** is explicitly floored at zero — unlike lines 11a/11b which preserve negatives
- Line 15 is the primary input to every line 16 tax computation path

---

## 2. Backend implementation

### Location

`TaxReturnComputeService.java` — no single named method; computed at three points inside `prepare()`.

### Three computation points

Line 15 is set at three separate locations during `prepare()`, always using `subtractNonNegative(agi, line14)`:

| Point | Approx line | Trigger | Notes |
|---|---|---|---|
| **First pass** | ~710 | After line 14 is assembled, before QBI second pass | Interim value; may be overridden |
| **Second pass (QBI)** | ~761 | After `computeLine13a()` second pass with final line 13b | Correct final value when QBI applies |
| **Fallback** | ~783 | When QBI second pass is skipped (no QBI sources) | Final value when no QBI |

All three paths call:
```java
BigDecimal l15 = roundMoney(subtractNonNegative(agiFinal, newLine14));
form1040.getDeductions().setTaxableIncome(l15);
form1040.getDeductions().setLine15TaxableIncome(l15);
```

Both `taxableIncome` (legacy) and `line15TaxableIncome` (explicit) are always set to the same value.

### `subtractNonNegative` helper

```java
private static BigDecimal subtractNonNegative(BigDecimal left, BigDecimal right) {
    if (left == null) {
        return null;
    }
    BigDecimal result = left.subtract(right == null ? BigDecimal.ZERO : right);
    return result.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : result;
}
```

Key behaviours:
- Returns **null** if AGI (`left`) is null — line 15 is null on incomplete returns
- Returns **zero** if result would be negative (zero-floor rule)
- Treats null `right` (line 14) as 0

### Output model — `Deductions.java`

```java
private BigDecimal taxableIncome;          // legacy alias — same value as line15TaxableIncome
private BigDecimal line15TaxableIncome;   // explicit canonical field
```

Both fields are always set to the same value. `line15TaxableIncome` is the canonical field for API consumers and E2E tests.

### Line 16 gate on line 15

`computeLine16()` reads `getLine15TaxableIncome()` and gates immediately:
```java
BigDecimal line15 = form1040.getDeductions().getLine15TaxableIncome();
if (line15 == null) { return; }                 // null → line 16 skipped entirely
if (line15.compareTo(BigDecimal.ZERO) <= 0) {   // zero → zero tax, no worksheet needed
    // set regularTax = 0
}
```

The Foreign Earned Income Tax Worksheet also gates on line 15 being > 0 before proceeding.

---

## 3. Frontend implementation

- Component: `form-tax-return-1040.component.ts`
- PDF mapping (line 304): `values['line15_taxable_income'] = this.formatAmount(form.deductions?.taxableIncome)`
- **Tech debt:** reads `taxableIncome` (legacy field); interface does not declare `line15TaxableIncome`
- PDF CSV field: `line15_taxable_income` → `f2_06[0]` on page 2 (coordinates: 504, 636.001, 576, 648)

---

## 4. Compute order

```
line9 → line10 → line11a → line11b
  → line12e (standard or itemized deduction)
    → line13b (Schedule 1-A — must precede line 13a)
      → line13a (QBI — first pass uses line13b=null)
        → line14 = line12e + line13a_firstpass + line13b
          → line15 [FIRST PASS] = max(0, line11b − line14)
            → line13a [SECOND PASS] with final line13b → corrected line14
              → line15 [FINAL] = max(0, line11b − line14_final)
                → line16 (tax computation — branches on line15 value)
```

**Critical ordering note:** line 13b must be computed before line 13a's second pass, because `taxableIncomeBeforeQbi = AGI − line12e − line13b` feeds the QBI limitation worksheet.

---

## 5. Downstream consumers of line 15

| Consumer | How line 15 is used |
|---|---|
| Line 16 (Tax) | Primary input to all tax computation paths |
| Tax Table | Used when line 15 < $100,000 |
| Tax Computation Worksheet | Used when line 15 ≥ $100,000 |
| QDCG Worksheet | Used when qualified dividends or capital gains present |
| Schedule D Tax Worksheet | Used when Schedule D has QD/LTCG entries |
| Form 8615 (kiddie tax) | Child's line 15 used for parent's tax computation |
| Foreign Earned Income Tax Worksheet | Used when Form 2555 filed; gated on line 15 > 0 |
| Form 6251 AMT | Part I starts from line 15 taxable income |
| Schedule J | Income averaging for farmers/fishermen — **out of scope** |

---

## 6. Tests

### Unit tests — `TaxLine15TaxableIncomeTest.java` (7 tests)

| Test | Inputs | Expected line 15 |
|---|---|---|
| `line15_standardDeductionOnly` | AGI=$50k; 12e=$15k; 13a=0; 13b=0 | $35,000 |
| `line15_withQbiDeduction` | AGI=$100k; 12e=$15k; 13a=$5k | $80,000 |
| `line15_withAdditionalDeductions` | AGI=$80k; 12e=$15k; 13b=$5k | $60,000 |
| `line15_allThreeDeductions` | AGI=$150k; 12e=$16k; 13a=$8k; 13b=$4k | $122,000 |
| `line15_floorAtZero` | AGI=$10k; 12e=$30k | $0 |
| `line15_nullAgi` | AGI=null | null |
| `line15_mfjHighIncome` | AGI=$300k; 12e=$30k; 13a=$20k; 13b=$10k | $240,000 |

### E2E tests — `line15-taxable-income.spec.ts` (5 scenarios)

| Scenario | Setup | Key assertion |
|---|---|---|
| 1 | Single, wages $60k | `line15TaxableIncome = max(0, AGI − 12e)` |
| 2 | Single, wages $50k + SS tips $5k (13b) | `line15TaxableIncome = max(0, AGI − 12e − 13b)` |
| 3 | MFJ, both spouses wages ($80k + $70k) | `AGI = $150,000`; line15 = AGI − MFJ std deduction |
| 4 | Single, wages $1k (far below std deduction) | `line15TaxableIncome = 0` (floor) |
| 5 | Single, wages $70k + overtime $8k (13b) | `line15TaxableIncome = max(0, AGI − 12e − 13b)` |

---

## 7. Gaps identified

| # | Gap | Severity | In outstanding.md? |
|---|---|---|---|
| G1 | Frontend reads `taxableIncome` (legacy) instead of `line15TaxableIncome`; interface missing `line15TaxableIncome` field | Low | No |
| G2 | No E2E scenario exercises the QBI second-pass path (line 13a reducing line 15) — most complex compute path not covered in line15 spec | Low | No |
| G3 | `saveAdditionalDeductionsTaxpayerApi` local helper in E2E spec duplicates `savePersonalFormApi` from api-flow.ts | Very Low | No |

---

## 8. PDF field map

| CSV label | PDF field | Page | IRS line |
|---|---|---|---|
| `line15_taxable_income` | `f2_06[0]` | 2 | Line 15 |

---

## 9. IRS source reference

From `i1040gi_2025.txt` (2025 Form 1040 Instructions):
- Line 15: "Subtract line 14 from line 11b. If zero or less, enter -0-."
- Tax Table uses line 15 for all entries under $100,000
- Tax Computation Worksheet uses line 15 for amounts ≥ $100,000
- "If line 15 is $0 or less, you don't have taxable income" — no tax due
