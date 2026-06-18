# Knowledge: Form 1040 Line 21 — Total Nonrefundable Credits (2025)

> Audited 2026-04-18. Line 21 is fully implemented and correct. This document is the single
> authoritative reference for the line 21 computation, its backend wiring, frontend display,
> test coverage, and identified gaps.

---

## 1. Line Identity

**Form 1040 (2025) line 21** is labeled:

```
Add lines 19 and 20
```

It is a **pure arithmetic accumulator** — it adds two upstream nonrefundable-credit lines and
passes the total forward to line 22.

| Concept | Value |
|---|---|
| IRS label | "Add lines 19 and 20" |
| Java model field | `TaxAndCredits.totalCredits` |
| Getter | `getTotalCredits()` |
| Setter | `setTotalCredits(BigDecimal)` |
| Frontend TS field | `taxAndCredits?.totalCredits` |
| PDF semantic key | `line21_total_credits_add_lines19_20` |
| PDF AcroForm field | `topmostSubform[0].Page2[0].f2_13[0]` |
| Page/rect in CSV | Page 2, (504, 564.001, 576, 576) |

Inputs:

| Line | Meaning | Java model field | Source |
|---|---|---|---|
| Line 19 | Child tax credit / credit for other dependents | `TaxAndCredits.childTaxCredit` | `Schedule8812.line14` |
| Line 20 | Amount from Schedule 3 line 8 | `TaxAndCredits.otherCreditsSchedule3` | `Schedule3.nonrefundableCredits.totalNonrefundableCredits` |

---

## 2. Core Formula

```
Form1040.line21 = nz(Form1040.line19) + nz(Form1040.line20)
```

where `nz(x)` means treat `null` as zero.

Surrounding page-2 chain:

```
line18 = line16 + line17                   (totalTaxBeforeCredits)
line19 = Schedule8812.line14               (childTaxCredit)
line20 = Schedule3.line8                   (otherCreditsSchedule3)
line21 = line19 + line20                   (totalCredits)
line22 = max(0, line18 - line21)           (taxAfterCredits)
line23 = Schedule2.line21 (other taxes)    (otherTaxes)
line24 = line22 + line23                   (totalTax)
```

Guardrails:
- `line21 >= 0` always (both inputs are nonrefundable credits, so both >= 0)
- `line21` is `null` in the model when `line19 = 0` AND `line20 = 0` (zero is stored as `null`)
- `line21` is NOT independently floored; the floor applies only at line 22
- `line21 <= line18` is expected after correct upstream credit limiting; if violated, an upstream bug exists

---

## 3. Backend Implementation

**Method:** `computeLine20ThroughLine24(Form1040 form1040, Schedule3 schedule3)`

**File:** `C:\us-tax\us-tax-be\src\main\java\com\ustax\microservices\TaxReturnComputeService.java`

**Lines:** approximately 15023–15056

**Call site:** line 1052 of `TaxReturnComputeService.java`

```java
private void computeLine20ThroughLine24(Form1040 form1040, Schedule3 schedule3) {
    TaxAndCredits tac = form1040.getTaxAndCredits();
    if (tac == null) return;

    // Line 20 = Schedule 3 line 8.
    BigDecimal line20 = null;
    if (schedule3 != null && schedule3.getNonrefundableCredits() != null) {
        BigDecimal line8 = schedule3.getNonrefundableCredits().getTotalNonrefundableCredits();
        if (line8 != null && line8.compareTo(BigDecimal.ZERO) > 0) {
            line20 = line8;
        }
    }
    tac.setOtherCreditsSchedule3(line20);

    // Line 21 = line19 (CTC+ODC) + line20.
    BigDecimal line19 = safeAmount(tac.getChildTaxCredit());
    BigDecimal line21 = roundMoney(line19.add(safeAmount(line20)));
    tac.setTotalCredits(line21.compareTo(BigDecimal.ZERO) > 0 ? line21 : null);

    // Line 22 = max(0, line18 - line21).
    BigDecimal line18 = safeAmount(tac.getTotalTaxBeforeCredits());
    BigDecimal line22 = roundMoney(line18.subtract(line21).max(BigDecimal.ZERO));
    tac.setTaxAfterCredits(line22);

    // Line 24 = line22 + line23.
    BigDecimal line23 = safeAmount(tac.getOtherTaxes());
    BigDecimal line24 = roundMoney(line22.add(line23));
    tac.setTotalTax(line24.compareTo(BigDecimal.ZERO) > 0 ? line24 : BigDecimal.ZERO);
}
```

**Compute order dependencies:**

| Step | Must run before `computeLine20ThroughLine24` |
|---|---|
| `computeSchedule8812()` | Sets `tac.childTaxCredit` (line 19) |
| `finalizeSchedule3Totals()` | Sets `schedule3.nonrefundableCredits.totalNonrefundableCredits` (line 8) |
| All `applyXxxToSchedule3()` methods | Must populate Schedule 3 line fields before finalization |

**Must run before:**
- `computeLine31ThroughLine38()` — needs `taxAfterCredits` (line 22) and `totalTax` (line 24)

**Model class:** `C:\us-tax\us-tax-be\src\main\java\com\ustax\model\output\TaxAndCredits.java`

Relevant fields:
- `childTaxCredit` — line 19 input (set by `computeSchedule8812`)
- `otherCreditsSchedule3` — line 20 (set here)
- `totalCredits` — line 21 output (set here); stored as `null` when zero
- `taxAfterCredits` — line 22 (set here)
- `totalTaxBeforeCredits` — line 18 input (set by line 18 compute)
- `otherTaxes` — line 23 input (set by Schedule 2 wiring)
- `totalTax` — line 24 (set here)

---

## 4. Frontend

**Component:** `C:\us-tax\us-tax-ui\src\app\forms\form-tax-return-1040.component.ts`

**Interface field (TypeScript):**
```typescript
interface TaxAndCreditsView {
    totalCredits?: number | string | null;   // line 21
    taxAfterCredits?: number | string | null; // line 22
    // ...
}
```

**PDF fill mapping (line 326):**
```typescript
values['line21_total_credits_add_lines19_20'] = this.formatAmount(form.taxAndCredits?.totalCredits);
```

**PDF field name:** `line21_total_credits_add_lines19_20`
**AcroForm path:** `topmostSubform[0].Page2[0].f2_13[0]`
**CSV file:** `C:\us-tax\us-tax-ui\public\irs\f1040_field_mapping_semantic.csv` (line 162)

The field is populated correctly: when `totalCredits` is `null` (zero credits), `formatAmount(null)` returns an empty string which leaves the PDF field blank — matching IRS behavior.

---

## 5. Unit Tests

The Java test file is:
`C:\us-tax\us-tax-be\src\test\java\com\ustax\microservices\TaxReturnComputeServiceTest.java`

**Direct line-21 assertions (Form 1040):**

| Test name / location | What it asserts |
|---|---|
| Line 12820 (inline, smoke-style test) | `getTaxAfterCredits() != null` — verifies line 22 is wired after lines 20–24; indirectly verifies line 21 runs |
| Line 9083 (childTaxCredit present in CTC test) | `getChildTaxCredit()` is a positive value (line 19 = $2,200) |
| Lines 14301/14349/14493 (CTC eligibility tests) | `getChildTaxCredit()` is null vs. non-null in various dependent configurations |
| Line 9422 (CTC phaseout test) | `getChildTaxCredit()` has a specific reduced value |

**Added 2026-04-19 (G1 fix):**

| Test | What it asserts |
|---|---|
| `line21_equalsLine19PlusLine20_ctcAndAotc` | `totalCredits == childTaxCredit + otherCreditsSchedule3` (CTC child + AOTC $1,500 nonref) |
| `line21_isNullWhenNoCreditsPresent` | `totalCredits == null` when no dependents and no Schedule 3 credits |
| `line21_line22FlooredAtZeroWhenCreditsAbsorbAllTax` | `totalCredits == totalTaxBeforeCredits`; `taxAfterCredits == 0` (CTC limited to tax, floor applies) |

---

## 6. E2E Tests

**Dedicated line-21 spec:**
`C:\us-tax\us-tax-be\e2e\tests\line21-total-credits.spec.ts`

| # | Test name | What it verifies |
|---|---|---|
| 1 | "Line 21 — equals line 19 only when no Schedule 3 credits are present" | `line20 = 0`, `line19 > 0`, `line21 = line19` |
| 2 | "Line 21 — equals line 20 only when no CTC is present" | `line19 = 0`, `line20 > 0`, `line21 = line20` |
| 3 | "Line 21 — equals line 19 plus line 20 when both CTC and Schedule 3 credits are present" | `line21 = line19 + line20`; also asserts `line22 = max(0, line18 - line21)` |

**Adjacent specs that also assert on `totalCredits` / `taxAfterCredits`:**

`C:\us-tax\us-tax-be\e2e\tests\line22-tax-after-credits.spec.ts`:
| # | Test name | Relevance |
|---|---|---|
| 1 | "Line 22 — equals line 18 when no credits are present" | `line21 = 0`, `line22 = line18` |
| 2 | "Line 22 — equals line 18 minus line 21 when credits partially offset tax" | `line21 > 0`, `line22 = line18 - line21` |
| 3 | "Line 22 — is zero when credits fully absorb tax (floor at zero)" | `line21 = line18`, `line22 = 0` |

`C:\us-tax\us-tax-be\e2e\tests\line20-nonrefundable-credits.spec.ts`:
- Tests that `totalCredits > 0` and `taxAfterCredits >= 0` when Schedule 3 credits are present.

~~**Missing retries directive:** `line21-total-credits.spec.ts` had `test.describe.configure({ timeout: 180000 })` but no `retries: 1`.~~ **Fixed 2026-04-19** — merged to `{ timeout: 180000, retries: 1 }`. See G2 below.

---

## 7. Identified Gaps

### ~~G1 — No Java unit test directly asserts on `totalCredits` (LOW)~~ **Fixed 2026-04-19**

**Field:** `TaxAndCredits.totalCredits`

**Current state:** The Java test class has 315+ unit tests, but none assert on
`getTotalCredits()` directly. The implicit coverage comes from line 22 being asserted
(line 12821: `assertNotNull(getTaxAfterCredits())`), which is computable only if line 21
ran. The E2E layer has 3 focused tests. The gap is purely at the Java unit-test level.

**When relevant:** Any refactor of `computeLine20ThroughLine24` could silently break
`totalCredits` without a Java unit test failing.

**Fix needed:** Add 2–3 Java unit tests:
1. `computesLine21AsSumOfLine19AndLine20()` — seed a CTC child and a Schedule 3 credit; assert
   `getTotalCredits() == line19 + line20`.
2. `computesLine21AsNullWhenNoCreditPresent()` — no CTC, no Schedule 3; assert
   `getTotalCredits() == null`.
3. `computesLine22AsZeroWhenCreditsExceedTax()` — low income + CTC; assert
   `getTaxAfterCredits() == 0` and `getTotalCredits() == getTotalTaxBeforeCredits()`.

---

### ~~G2 — `line21-total-credits.spec.ts` missing `retries: 1` (LOW)~~ **Fixed 2026-04-19**

**File:** `C:\us-tax\us-tax-be\e2e\tests\line21-total-credits.spec.ts`

**Current state:** The spec uses `test.describe.configure({ timeout: 180000 })` but omits
`retries: 1`. Per the project E2E pattern documented in CLAUDE.md, every spec must include
`test.describe.configure({ retries: 1 })` to handle first-test cold-start `clearUserData`
failures.

**Fix needed:** Add `test.describe.configure({ retries: 1 })` alongside (or merge with) the
existing `timeout` call.

---

### G3 — `line21-total-credits.spec.ts` missing `test.describe.configure({ retries: 1 })` is the only structural gap; functional coverage is adequate (INFORMATIONAL)

The three E2E scenarios cover the three logical branches (line19-only, line20-only, both combined).
The `line22-tax-after-credits.spec.ts` covers the floor-at-zero case. No additional functional
E2E scenarios are needed for this pure arithmetic line.

---

## 8. Spec Accuracy

The line spec at `C:\us-tax\lines\21.md` is accurate and complete for 2025. No corrections were
needed. Key verified facts:

- Formula `line21 = nz(line19) + nz(line20)` matches the backend implementation exactly.
- The null-storage convention (zero stored as null) is correctly documented.
- The downstream `line22 = max(0, line18 - line21)` formula is correct.
- Section 6a guardrail (line 21 includes only lines 19 and 20, nothing else) is enforced in code.
- Section 6b soft constraint `line21 <= line18` is not validated in code (by design — upstream
  credit limiter handles it); the spec correctly calls this an "expected" rather than a "required"
  check.
