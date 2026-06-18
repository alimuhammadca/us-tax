# Knowledge: Form 1040 Lines 11a and 11b — Adjusted Gross Income

**Tax Year:** 2025  
**Last updated:** 2026-04-17  
**Status:** Implementation complete. Test coverage sparse. One tech-debt field in `Adjustments.java`.

---

## 1. What these lines compute

| Line | IRS label | Formula |
|---|---|---|
| **11a** | Adjusted gross income | `line9 − line10` |
| **11b** | Amount from line 11a (adjusted gross income) | `line11a` (exact copy) |

- **Line 11a** appears at the bottom of Form 1040 page 1.
- **Line 11b** appears at the top of page 2 — it repeats AGI for downstream references.
- Neither line is floored to zero. A negative AGI is valid and must be preserved.
- **Line 11b is NOT a universal MAGI.** Each downstream benefit computes its own MAGI from 11b plus benefit-specific add-backs.

---

## 2. Backend implementation

### Compute method

Located in `TaxReturnComputeService.java` around line 4144:

```java
// computeAdjustments() — called from buildForm1040()
BigDecimal line9 = income == null ? null : roundMoney(income.getTotalIncome());
BigDecimal line11a = line9 == null ? null
    : roundMoney(subtractNonNegativeAllowNegative(line9, line10));
BigDecimal line11b = line11a;            // IRS copy line — always identical
if (line10 == null && line11a == null) {
    return null;
}
Adjustments adjustments = new Adjustments();
adjustments.setAdjustmentsSchedule1(line10);
adjustments.setLine11aAdjustedGrossIncome(line11a);
adjustments.setLine11bAmountFromLine11aAdjustedGrossIncome(line11b);
// Legacy field — set to same value as line11a for backward UI compat:
adjustments.setAdjustedGrossIncome(line11a);
return adjustments;
```

Key behaviours:
- `subtractNonNegativeAllowNegative` — preserves negative results (unlike `subtractNonNegative` which floors to zero).
- `addNonNull` pattern used upstream on line 9; null feeders = 0 contribution.
- If `line10` is null AND `line9` is null → returns null (no Adjustments object created).
- If `line10` is null but `line9` is not → `line11a = line9 − 0 = line9`.

### Output model — `Adjustments.java`

```java
private BigDecimal adjustmentsSchedule1;                       // line 10
private BigDecimal line11aAdjustedGrossIncome;                // line 11a
private BigDecimal line11bAmountFromLine11aAdjustedGrossIncome; // line 11b
private BigDecimal adjustedGrossIncome;                        // LEGACY — equals line11a
```

**Tech debt:** `adjustedGrossIncome` was kept for UI backward compatibility (comment at line 4157). It is always set to the same value as `line11a`. However, some downstream usages (notably `computeForm6251` AMT at line 8200) read `getAdjustedGrossIncome()` instead of `getLine11bAmountFromLine11aAdjustedGrossIncome()`. There is a helper `computeScheduleAgi()` at line 13593 that also prefers `line11a` over `line11b`. Since they are always identical this causes no functional error, but the legacy field should eventually be removed and callers updated to use the explicit 11a/11b accessors.

### How downstream code reads AGI

| Caller | Field used | Line |
|---|---|---|
| Line 15 (taxable income) | `getLine11bAmountFromLine11aAdjustedGrossIncome()` | 708, 759, 781 |
| QBI deduction (line 13a) | `getLine11bAmountFromLine11aAdjustedGrossIncome()` | 3104 |
| Form 6251 AMT | `getAdjustedGrossIncome()` | 8200 |
| Schedule A | `getAdjustedGrossIncome()` (via scheduleA.setAdjustedGrossIncome) | 2946 |
| `computeScheduleAgi()` helper | `getLine11aAdjustedGrossIncome()` → fallback `getLine11b...` | 13596–13597 |
| Form 8962 PTC | `getLine11aAdjustedGrossIncome()` via `computeScheduleAgi()` | 13596 |

---

## 3. Frontend implementation

- Component: `form-tax-return-1040.component.ts`
- JSON path: `form1040.adjustments.line11aAdjustedGrossIncome` and `...line11bAmountFromLine11aAdjustedGrossIncome`
- PDF CSV fields: `line11a_adjusted_gross_income` (page 1, f1_75[0]) and `line11b_adjusted_gross_income_repeat` (page 2, f2_01[0])
- **Note:** PDF mapping is canonical — page-1 CSV uses `line11a_adjusted_gross_income` (with the `a` suffix, matching the JSON field name) at row 89; page-2 CSV uses `line11b_adjusted_gross_income_repeat` at row 150. Verified 2026-05-13 via 11a #8 against `us-tax-ui/public/irs/f1040_field_mapping_semantic.csv`. (Prior versions of this knowledge file claimed `f1_77[0]` + `line11_adjusted_gross_income` without the `a`; both stale and now corrected.)

---

## 4. MAGI vs AGI — implementation rule

**Do NOT create a global MAGI field from line 11b.** Each benefit computes its own MAGI:

| Benefit | MAGI definition |
|---|---|
| Schedule 1-A tips/overtime | line11b + Form2555 lines 45/50 + Form4563 line15 + PR exclusion |
| IRA deduction (line 10, line 20) | line11b + IRA deduction + student loan deduction |
| Student loan interest (line 10, line 21) | line11b + student loan deduction itself |
| Roth IRA phaseout | line11b + various add-backs per Pub 590-A |
| EIC | Uses AGI directly — no MAGI |
| Form 8863 AOTC/LLC | line11b + Form 2555 exclusion amounts |
| Form 8962 PTC | AGI from line 11a via `computeScheduleAgi()` |
| Schedule 8812 CTC | line11b (no add-backs for this credit) |

---

## 5. Tests

### Unit tests (TaxReturnComputeServiceTest.java)

No dedicated test class. Coverage comes from side-assertions in other test cases:
- `allowsNegativeAdjustedGrossIncomeOnForm1040Line11aAndLine11b` — explicitly verifies that large line10 > line9 produces negative line11a/11b (no zero-floor).
- Many other tests assert `line11aAdjustedGrossIncome` / `line11bAmountFromLine11aAdjustedGrossIncome` as a side-check of the AGI value.

### E2E tests (line11ab-adjusted-gross-income.spec.ts)

One scenario: wages=$1,000 + educator expenses=$125 → AGI=$875.

Assertions:
```typescript
expect(income?.totalIncome).toBe(1000);
expect(adjustments?.adjustmentsSchedule1).toBe(125);
expect(adjustments?.line11aAdjustedGrossIncome).toBe(875);
expect(adjustments?.line11bAmountFromLine11aAdjustedGrossIncome).toBe(875);
expect(adjustments?.adjustedGrossIncome).toBe(875);
```

---

## 6. Gaps identified

| # | Gap | Severity | Documented in outstanding.md? |
|---|---|---|---|
| G1 | Legacy `adjustedGrossIncome` field in `Adjustments.java` — same value as 11a but inconsistent naming; some callers (AMT, Schedule A) still use this field | Low | No |
| G2 | E2E spec has only 1 scenario (wages+educator); no MFJ, no zero-adjustments, no negative-AGI E2E test | Low | No |
| G3 | ~~No unit test explicitly asserting both 11a=11b always (invariant test)~~ — **RESOLVED 2026-05-13 via 11a #7**: added lock-in test `line11bAlwaysEqualsLine11aInvariant` with 3 scenarios (positive / negative / null AGI). | Resolved | No |
| G4 | ~~Semantic CSV uses `line11` (no 'a') for page-1 AGI field — naming inconsistency vs JSON field `line11a`~~ — **FALSE POSITIVE — verified canonical 2026-05-13 via 11a #8**: CSV row 89 actually has `line11a_adjusted_gross_income` (WITH the `a` suffix) at PDF field `f1_75[0]`. Original gap description (and the §3 + §8 PDF claims that referenced `line11` / `f1_77[0]`) were stale and have been corrected. | FALSE POSITIVE | No |
| G5 | `computeScheduleAgi()` helper prefers `getLine11aAdjustedGrossIncome()` over `getLine11bAmountFromLine11aAdjustedGrossIncome()` — correct result but creates confusion about which copy to use downstream | Low | No |

---

## 7. Compute order

```
line9 (totalIncome)
  → line10 (adjustmentsSchedule1 from Schedule 1 Part II)
    → line11a = line9 − line10  (AGI)
      → line11b = line11a       (AGI carryforward)
        → line12e (standard/itemized deduction — uses 11b for dependent worksheet)
        → line13a (QBI — uses 11b for taxable income base)
        → line13b (Schedule 1-A — starts MAGI from 11b)
        → line15  = line11b − line14  (floored at zero)
        → line16  (Tax — uses line15 taxable income)
        → Form 6251 AMT (uses adjustedGrossIncome ≡ line11a)
        → Schedule 8812 CTC phaseout (uses line11b)
        → Form 8863 MAGI phaseout (starts from line11b)
        → Form 8962 PTC (uses computeScheduleAgi ≡ line11a)
```

---

## 8. PDF field map

Verified canonical 2026-05-13 via 11a #8 against `us-tax-ui/public/irs/f1040_field_mapping_semantic.csv`.

| PDF field | CSV label | Page | Form 1040 line | CSV row |
|---|---|---|---|---|
| `f1_75[0]` | `line11a_adjusted_gross_income` | 1 | 11a | 89 |
| `f2_01[0]` | `line11b_adjusted_gross_income_repeat` | 2 | 11b | 150 |
