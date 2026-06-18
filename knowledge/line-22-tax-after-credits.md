# Knowledge: Form 1040 Line 22 — Tax After Credits (2025)

> Audited 2026-04-19. Re-verified 2026-05-15 (META-AUDIT 22 #5; SECOND META-AUDIT in workflow). Line 22 is fully implemented, correctly floored at zero, and wired into lines 23–24. The spec at `C:\us-tax\lines\22.md` is accurate. G1 (originally identified 2026-04-19 as "missing `retries: 1`") ★ FIXED at some prior date — verified 2026-05-15 that `line22-tax-after-credits.spec.ts` line 12 already contains `retries: 1`; doc drift resolved via 22 #4 2026-05-15.

---

## 1. Line Identity

**Form 1040 (2025) line 22** is labeled:

```
Subtract line 21 from line 18. If zero or less, enter -0-
```

| Concept | Value |
|---|---|
| IRS label | "Subtract line 21 from line 18. If zero or less, enter -0-" |
| Java model field | `TaxAndCredits.taxAfterCredits` |
| Getter | `getTaxAfterCredits()` |
| Setter | `setTaxAfterCredits(BigDecimal)` |
| Java model class | `C:\us-tax\us-tax-be\src\main\java\com\ustax\model\output\TaxAndCredits.java` (line 25) |
| Frontend TS field | `form.taxAndCredits?.taxAfterCredits` |
| PDF semantic key | `line22_tax_less_credits` |
| PDF AcroForm field | `topmostSubform[0].Page2[0].f2_14[0]` |
| Page / rect in CSV | Page 2, `(504, 552.002, 576, 564.001)` |
| CSV source | `C:\us-tax\us-tax-ui\public\irs\f1040_field_mapping_semantic.csv` (line 163) |

---

## 2. Core Formula

```
line22 = max(0, nz(line18) − nz(line21))
```

Surrounding page-2 chain:

```
line16 = regular_tax + box1 + box2 + box3          (tax)
line17 = alternativeMinimumTax                      (AMT)
line18 = line16 + line17                            (totalTaxBeforeCredits)
line19 = Schedule8812.line14                        (childTaxCredit)
line20 = Schedule3.line8                            (otherCreditsSchedule3)
line21 = nz(line19) + nz(line20)                   (totalCredits)
line22 = max(0, nz(line18) − nz(line21))           (taxAfterCredits)   ← THIS LINE
line23 = Schedule2.line21                           (otherTaxes)
line24 = line22 + line23                            (totalTax)
```

**Zero-floor rule:** The IRS form explicitly says "If zero or less, enter -0-". Line 22 must never be negative. If credits fully absorb all tax, line 22 is zero.

---

## 3. Backend Implementation

**Method:** `computeLine20ThroughLine24(Form1040 form1040, Schedule3 schedule3)`

**File:** `C:\us-tax\us-tax-be\src\main\java\com\ustax\microservices\TaxReturnComputeService.java`

**Lines:** 15023–15056 (line 22 specifically at lines 15044–15047)

**Call site:** Line 1052 of `TaxReturnComputeService.java`

**Java snippet (line 22 segment only):**

```java
// Line 22 = max(0, line18 - line21).
BigDecimal line18 = safeAmount(tac.getTotalTaxBeforeCredits());
BigDecimal line22 = roundMoney(line18.subtract(line21).max(BigDecimal.ZERO));
tac.setTaxAfterCredits(line22);
```

Where `line21` was computed immediately above:

```java
// Line 21 = line19 (CTC+ODC) + line20.
BigDecimal line19 = safeAmount(tac.getChildTaxCredit());
BigDecimal line21 = roundMoney(line19.add(safeAmount(line20)));
tac.setTotalCredits(line21.compareTo(BigDecimal.ZERO) > 0 ? line21 : null);
```

**Key behaviors:**
- `safeAmount(null)` returns `BigDecimal.ZERO` — null-safe subtraction.
- `.max(BigDecimal.ZERO)` is the zero floor on line 22 (not applied to line 21).
- `roundMoney()` applies standard `HALF_UP` rounding.
- `taxAfterCredits` is always set (never stored as null), even when zero.
- `totalCredits` (line 21) IS stored as null when zero; `taxAfterCredits` (line 22) is NOT.

**Other references to `taxAfterCredits` in `TaxReturnComputeService.java`:**
- Line 15047: `tac.setTaxAfterCredits(line22)` — the only write.
- No other method reads or writes `taxAfterCredits` directly; `totalTax` is read by downstream consumers instead.

**Compute order dependencies:**

| Step | Must run before `computeLine20ThroughLine24` | Why |
|---|---|---|
| `computeSchedule8812()` | Sets `tac.childTaxCredit` (line 19 input) | |
| `finalizeSchedule3Totals()` | Sets `schedule3.nonrefundableCredits.totalNonrefundableCredits` (line 8 → line 20 input) | |
| All `applyXxxToSchedule3()` calls | Must populate Schedule 3 line fields before finalization | |
| `computeLine20ThroughLine24()` | ← This method | Computes lines 20, 21, **22**, 24 |
| `computeLine31ThroughLine38()` | Reads `totalTax` (line 24) and `taxAfterCredits` indirectly | Must run after |
| `computeForm2210()` | Uses `totalTaxBeforeCredits` (line 18) and `totalTax` (line 24) | Must run after |

---

## 4. Frontend

**Component:** `C:\us-tax\us-tax-ui\src\app\forms\form-tax-return-1040.component.ts`

**TypeScript interface field (line 145):**

```typescript
taxAfterCredits?: number | string | null;   // line 22
```

**PDF fill (line 327):**

```typescript
values['line22_tax_less_credits'] = this.formatAmount(form.taxAndCredits?.taxAfterCredits);
```

**PDF field details:**

| Field | Value |
|---|---|
| Semantic key | `line22_tax_less_credits` |
| AcroForm path | `topmostSubform[0].Page2[0].f2_14[0]` |
| Display label | `Line22 Tax Less Credits` |
| Field type | Text |
| Page | 2 |
| Rectangle | `(504, 552.002, 576, 564.001)` |
| CSV file | `C:\us-tax\us-tax-ui\public\irs\f1040_field_mapping_semantic.csv` (line 163) |

When `taxAfterCredits` is `0`, `formatAmount(0)` renders `"0"` in the PDF field (not blank), which is correct — IRS form says "enter -0-" (we display `0` without the minus sign, acceptable).

---

## 5. Unit Tests

**File:** `C:\us-tax\us-tax-be\src\test\java\com\ustax\microservices\TaxReturnComputeServiceTest.java`

| Test name / location | What it asserts |
|---|---|
| Line 12820 (smoke-style integration test) | `assertNotNull(getTaxAfterCredits())` — line 22 is non-null after full compute with W-2 income |
| `line21_equalsLine19PlusLine20_ctcAndAotc` (line ~16290) | `getTaxAfterCredits()` is non-null; CTC + AOTC produce `totalCredits`; arithmetic is correct |
| `line21_isNullWhenNoCreditsPresent` (line ~16305) | Line 22 is computed (not null) when `totalCredits == null` (zero credits, so `line22 = line18`) |
| `line21_line22FlooredAtZeroWhenCreditsAbsorbAllTax` (lines 16314–16331) | `getTaxAfterCredits() == 0` when CTC equals tax — floor explicitly asserted; also asserts `totalCredits == totalTaxBeforeCredits` |

**Note:** No test is named specifically for line 22; the floor-at-zero test in the `line21_*` suite (added 2026-04-19 per G1 fix for line 21 audit) is the primary direct assertion on `taxAfterCredits == 0`.

---

## 6. E2E Tests

**Dedicated line-22 spec:** `C:\us-tax\us-tax-be\e2e\tests\line22-tax-after-credits.spec.ts`

| # | Test name | What it verifies |
|---|---|---|
| 1 | "Line 22 — equals line 18 when no credits are present" | Single filer, $40k wages; `line21 = 0`; asserts `line22 == line18` |
| 2 | "Line 22 — equals line 18 minus line 21 when credits partially offset tax" | Single filer, $60k wages, 1 CTC child; asserts `line22 == line18 - line21 > 0` |
| 3 | "Line 22 — is zero when credits fully absorb tax (floor at zero)" | Single filer, $18k wages, 1 CTC child; asserts `line22 == 0` |

**Adjacent specs asserting on `taxAfterCredits`:**

| Spec file | Assertion |
|---|---|
| `line21-total-credits.spec.ts` (test 3) | `line22 = max(0, line18 - line21)` asserted alongside line 21 sum |
| `line20-nonrefundable-credits.spec.ts` | `taxAfterCredits >= 0` (non-negative guardrail) |

---

## 7. Identified Gaps

### ~~G1 — `line22-tax-after-credits.spec.ts` missing `retries: 1` directive (LOW)~~ **★ FIXED — doc-drift resolved 2026-05-15 (22 #4)**

**File:** `C:\us-tax\us-tax-be\e2e\tests\line22-tax-after-credits.spec.ts`

**Current state (verified 2026-05-15):** Line 12 of the spec reads:
```typescript
test.describe.configure({ timeout: 180000, retries: 1 });
```
The `retries: 1` directive is PRESENT. G1 was originally identified 2026-04-19 as missing this directive, but the fix was applied at some prior date — presumably during the 2026-04-19 round when line 21 G2 (same issue) was fixed; cross-spec spillover fix without corresponding doc refresh.

**Resolution:** Doc-drift fix 22 #4 2026-05-15 — this section + §0 banner + dependencies/22.md "E2E Test Coverage" note all updated to reflect actual FIXED state. ★ NEW DRIFT SHAPE in workflow: first instance of "documented-gap-already-fixed" (vs. prior 8 doc-drift fixes which were "code-fixed-but-stale-doc"); doc-drift fix policy generalizes naturally. **9th documentation drift fix in workflow**.

**Severity:** LOW (closed).

---

### G2 — No Java unit test named specifically for line 22 (INFORMATIONAL)

**Current state:** The primary Java assertion on `taxAfterCredits == 0` lives in the `line21_line22FlooredAtZeroWhenCreditsAbsorbAllTax` test. There is no dedicated `line22_*` test class or method name. This is acceptable because line 22 is pure arithmetic (one subtraction + floor), but a named test would improve discoverability.

**Fix needed (optional):** Add a test named `line22_taxAfterCredits_equalsLine18MinusLine21()` and `line22_taxAfterCredits_isZeroWhenCreditsExceedTax()` in `TaxReturnComputeServiceTest.java`.

**Severity:** INFORMATIONAL — existing coverage is adequate; naming is a discoverability concern only.

---

## 8. Spec Accuracy

The line spec at `C:\us-tax\lines\22.md` is **accurate and complete** for 2025. No corrections were needed. Key verified facts:

- Formula `line22 = max(0, nz(line18) - nz(line21))` exactly matches the backend (`line18.subtract(line21).max(BigDecimal.ZERO)` after `safeAmount()` null guards).
- The zero-floor belongs on line 22, not line 21 — confirmed in code.
- Line 22 excludes refundable credits and payments — confirmed; those enter in lines 25–33.
- Line 22 excludes line 23 other taxes — confirmed; line 24 adds them afterward.
- The margin note for lines 12a/12b/12c/12d does not alter line 22 arithmetic — confirmed; no special-case code in `computeLine20ThroughLine24()`.
- Compute order (18 → 19 → 20 → 21 → 22 → 23 → 24) is correctly described and matches the implementation.
