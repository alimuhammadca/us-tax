# Knowledge — Line 9 Total Income (Form 1040)

Tax year: **2025**
Last updated: **2026-04-16**

---

## 1. What line 9 is

**Form 1040 line 9** is **Total income** — the sum of all taxable income lines above it on Form 1040.

```
Form1040.line9 = line1z + line2b + line3b + line4b + line5b + line6b + line7a + line8
```

It is a pure arithmetic aggregation. There is no worksheet, no schedule, and no alternate computation path for line 9 itself. The complexity lives entirely in its upstream feeder lines.

The IRS printed instruction (2025 Form 1040): **"Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income."**

---

## 2. The 8 feeder lines (taxable-only)

| Line 9 feeder | Form 1040 label | Taxable or Gross? | Source |
|---|---|---|---|
| `line1z` | Total wages, salaries, tips | Taxable (sum of 1a–1h) | W-2 aggregation + wage adjustments |
| `line2b` | Taxable interest | **Taxable** (not 2a tax-exempt) | Schedule B / 1099-INT / 1099-OID |
| `line3b` | Ordinary dividends | **Taxable** (not 3a qualified) | Schedule B / 1099-DIV |
| `line4b` | Taxable IRA distributions | **Taxable** (not 4a gross) | Form 8606 / 1099-R |
| `line5b` | Taxable pensions and annuities | **Taxable** (not 5a gross) | 1099-R / Form 4972 / PSO rules |
| `line6b` | Taxable Social Security benefits | **Taxable** (not 6a total) | SSA/RRB-1099 SS worksheet |
| `line7a` | Capital gain or (loss) | Net gain/loss (can be negative) | Schedule D / Form 8949 |
| `line8` | Other income from Schedule 1 | Schedule 1 line 10 (can be negative) | Schedule 1 Part I |

**Companion lines excluded from line 9** — these are informational only and must NOT flow into line 9:
- `line2a` — tax-exempt interest (nontaxable)
- `line3a` — qualified dividends (subset of 3b, not additive)
- `line4a` — gross IRA distributions
- `line5a` — gross pension/annuity amounts
- `line6a` — total Social Security benefits received
- `line1i` — nontaxable combat pay election (used only for credit worksheets)

---

## 3. Signed behavior

Line 9 is **not guaranteed positive**:
- `line7a` can be negative when capital losses exceed capital gains (Schedule D limitation, max deduction $3,000 for individuals after carryover).
- `line8` can be negative when NOL deductions, Form 2555 exclusion, or Medicaid waiver offsets dominate Schedule 1 line 10.

**The engine must NOT floor line 9 at zero.** Negative total income is valid and carries forward into the AGI computation.

---

## 4. Null handling

`addNonNull(left, right)` returns the other operand when one side is null. This means each feeder line that is absent (null) contributes 0 to line 9. If all 8 feeders are null (blank return), `line9` will be null (not set on the `Income` object).

---

## 5. What line 9 is NOT

| Concept | Distinction |
|---|---|
| **AGI (line 11a)** | AGI = line 9 − line 10 (adjustments from Schedule 1 Part II). Never substitute line 9 for AGI. |
| **Taxable income (line 15)** | Taxable income = AGI − deductions − QBI. Line 9 is several steps earlier. |
| **Provisional income (SS worksheet)** | The SS worksheet adds half of SS benefits and other items to a different base, not just line 9. |
| **Gross income (IRC §61)** | Line 9 uses taxable feeder lines; it excludes nontaxable items like tax-exempt interest. Certain IRS filing-requirement tests use a different gross income concept. |

---

## 6. Compute order

`buildIncome()` must be called **after** all 8 feeder computations are final:
- `computeLine1aWages()` and all sub-line (1b–1h) computations
- `computeInterestIncome()` → `line2b`
- `computeDividendIncome()` → `line3b`
- `computeIraIncome()` → `line4b`
- `computePensionAnnuityIncome()` → `line5b`
- `computeSocialSecurityBenefits()` → `line6b`
- `computeCapitalGainLoss()` (including Schedule D and Form 8949) → `line7a`
- `computeOtherIncomes()` (Schedule 1 Part I totals) → `line8`

`buildIncome()` must be called **before**:
- `buildAdjustments()` — needs `income.getTotalIncome()` for AGI computation (lines 11a/11b)
- `computeTotalIncome()` / any downstream computation reading line 9

---

## 7. Backend implementation

**Method:** `buildIncome()` in `TaxReturnComputeService.java` (~line 3660)

**Line 9 specific code** (~line 3842):
```java
// Form 1040 line 9 = line 1z + 2b + 3b + 4b + 5b + 6b + 7a + 8.
BigDecimal line9 = roundMoney(addNonNull(
    addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(line1z, line2b), line3b), line4b), line5b), line6b), line7a),
    line8
));
```

Then at ~line 3960:
```java
if (line9 != null) {
    income.setTotalIncome(line9);
}
```

**`addNonNull` behavior**: treats null as 0 — each missing feeder contributes 0 to the sum.
**`roundMoney` behavior**: rounds to 0 decimal places (whole-dollar, HALF_UP). `ROUNDING_MODE = ReturnRoundingMode.WHOLE_DOLLAR` is a static final constant at line 109. Result may be negative.

**Downstream** (`buildAdjustments()`, ~line 3966):
```java
BigDecimal line9 = income == null ? null : roundMoney(income.getTotalIncome());
BigDecimal line11a = line9 == null ? null : roundMoney(subtractNonNegativeAllowNegative(line9, line10));
```

`subtractNonNegativeAllowNegative` preserves negative AGI — no zero floor.

**Output model:** `Income.java` → `private BigDecimal totalIncome` (field 53)

---

## 8. Frontend implementation

**Tax return display:** `form-tax-return-1040.component.ts` (~line 290):
```typescript
values['line9_total_income'] = this.formatAmount(form.income?.totalIncome);
```

**Interface** (`form-tax-return-1040.component.ts`):
```typescript
income?: {
  ...
  totalIncome?: number | string | null;
}
```

**PDF export:** `f1040_field_mapping_semantic.csv` row 87:
```
1,topmostSubform[0].Page1[0].f1_73[0],...,line9_total_income,Line9 Total Income,Text,"(504, 54, 576, 65.999)"
```

---

## 9. Unit test coverage

**File:** `TaxReturnComputeServiceTest.java`

| Test | Location | Coverage |
|---|---|---|
| `computesForm1040Line9TotalIncomeFromTaxableFeederLines()` | ~line 6472 | Wages (line 1z = $1,000) + Schedule 1 other income (line 8 = $150) → line 9 = $1,150 |
| Income adjustment test (implicit) | ~line 7001 | W-2 only → line 9 = $1,000 |
| Another implicit assertion | ~line 7043 | Simple case → line 9 = $100 |

**Test coverage gaps (see outstanding.md):**
- No negative line 9 test (capital loss + NOL)
- No all-8-feeders-together test
- No test for companion-line exclusion guardrail
- No null-feeders test

---

## 10. E2E test coverage

**File:** `e2e/tests/line9-total-income.spec.ts` — 1 test

| Test | Coverage |
|---|---|
| "Line 9 totals taxable feeder lines on Form 1040" | W-2 ($1,000) + line 1 taxable refund ($150) → totalIncome = 1,150; also arithmetic-verifies line 9 = sum of all income.* fields |

**E2E gaps (see outstanding.md):**
- No E2E test for negative line 9
- Only 2 of 8 feeders exercised

---

## 11. Known deferred items / non-issues

Line 9 has no structural deferred items — the computation is complete. Gaps are limited to test coverage breadth.

The following are **not line 9 concerns**:
- How feeder lines are computed (those are lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, 8)
- AGI computation (line 10/11)
- Standard/itemized deductions (lines 12–14)
