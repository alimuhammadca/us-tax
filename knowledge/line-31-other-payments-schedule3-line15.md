# Knowledge: Form 1040 Line 31 — Amount From Schedule 3, Line 15

> Tax year 2025. Audit date: 2026-04-21. Last updated: 2026-04-21 (post-fix pass: G1–G4, G6, V1 resolved).

---

## 1. Line Identity

**Form 1040 line 31** = `Schedule 3, line 15`

Schedule 3 line 15 is the grand total of Part II ("Other Payments and Refundable Credits"). It aggregates:

```
Schedule3.line15 = line9 + line10 + line11 + line12 + line14
Schedule3.line14 = line13a + line13b + line13c + line13d + line13z
Form1040.line31  = Schedule3.line15
```

Downstream:
```
Form1040.line32 = line27a + line28 + line29 + line30 + line31
Form1040.line33 = line25d + line26 + line32
```

---

## 2. Schedule 3 Part II Structure (2025)

| Line | Label | Source |
|------|-------|--------|
| 9 | Net premium tax credit | Form 8962 line 26 (when positive) |
| 10 | Amount paid with request for extension to file | Form 4868 / Form 2350 payment |
| 11 | Excess social security and tier 1 RRTA tax withheld | Computed from W-2 box 4 (per-SSN, per-spouse) |
| 12 | Credit for federal tax on fuels | Form 4136 |
| 13a | Credit for undistributed long-term capital gains (Form 2439) | Form 2439 box 2 |
| 13b | Credit for repayment (I.R.C. section 1341) | Personal form `31-other-payments` |
| 13c | Net elective payment election amount (Form 3800 Part III line 6 col. j) | Out of scope |
| 13d | Deferred amount of net 965 tax liability | Personal form `31-other-payments` |
| 13z | Other refundable credits (write-in, may include Form 8689 USVI alloc.) | Personal form `31-other-payments` repeating list |
| 14 | Total other payments or refundable credits (lines 13a–13z) | Computed |
| 15 | Total (lines 9–12 + 14) → Form 1040 line 31 | Computed |

**2025 excess-SS computation constant**: wage base = $176,100 × 6.2% = max employee SS = **$10,918.20**. Computed per-SSN per-spouse independently (joint returns: two separate caps).

---

## 3. Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Line 9 (Form 8962 PTC) | ✅ Done | `applyPremiumTaxCreditToSchedule3()` — separate flow; PTC covered under Form 8962 audit |
| Line 10 (Form 4868 extension) | ✅ Done | `applyForm4868ToSchedule3()` → `amountPaidWithExtension` |
| Line 11 (excess SS/RRTA) | ✅ Done | `computeExcessSocialSecurityTax()` → `excessSocialSecurityRrtaTaxWithheld` |
| Line 12 (Form 4136 fuel credit) | ✅ Done | Manual entry via `31-other-payments` personal form → `creditForFederalTaxOnFuels` |
| Line 13a (Form 2439) | ✅ Done | `applyForm2439CreditToSchedule3()` aggregates statement entries box 2 |
| Line 13b (Section 1341) | ✅ Done | Personal form `section1341Credit` → `applyOtherPaymentsFormToSchedule3()` |
| Line 13c (Form 3800) | ⛔ Out of scope | Model field `netElectivePaymentElectionAmount` exists; compute deferred |
| Line 13d (Section 965(i)) | ✅ Done | Personal form `deferredNet965TaxLiability` → `applyOtherPaymentsFormToSchedule3()` |
| Line 13z (other credits) | ✅ Done | Personal form repeating list `otherRefundableCreditItems` summed |
| Line 14 (sum 13a–13z) | ✅ Done | `finalizeSchedule3Totals()` → `totalOtherPaymentsRefundableCredits` |
| Line 15 (sum 9–12+14) | ✅ Done | `finalizeSchedule3Totals()` → `totalOtherPaymentsAndRefundableCredits` |
| Form 1040 line 31 wire | ✅ Done | `computeLine31ThroughLine38()` copies line15 → `Payments.otherPaymentsSchedule3` |
| Line 32 aggregation | ✅ Done | line27a + line28 + line29 + line30 + line31 |
| Line 33 aggregation | ✅ Done | line25d + line26 + line32 |

---

## 4. Backend Implementation

### 4.1 Model Classes

| Class | File | Key Fields |
|-------|------|------------|
| `Schedule3OtherPaymentsCredits` | `src/main/java/com/ustax/model/output/Schedule3OtherPaymentsCredits.java` | All 11 fields with getters/setters (lines 1–109) |
| `Schedule3` | `src/main/java/com/ustax/model/output/Schedule3.java` | `otherPaymentsCredits` field (lines 33–39) |
| `Payments` | `src/main/java/com/ustax/model/output/Payments.java` | `otherPaymentsSchedule3` = line 31 (lines 95–101); `totalOtherPaymentsAndRefundableCredits` = line 32 (lines 103–109) |

### 4.2 Compute Methods (TaxReturnComputeService.java)

| Method | Lines | Purpose |
|--------|-------|---------|
| `applyForm2439CreditToSchedule3()` | 14631–14650 | Aggregates Form 2439 box 2 from statement entries → line 13a |
| `applyOtherPaymentsFormToSchedule3()` | 14657–14703 | Reads personal form → lines 12, 13b, 13d, 13z |
| `finalizeSchedule3Totals()` | 14705–14760 | Computes line 14 (sum 13a–13z) and line 15 (sum 9–12+14) |
| `computeLine31ThroughLine38()` | 15305–15442 | Wires line 15 → line 31; computes lines 32 and 33 |

### 4.3 Execution Order (in `prepare()`)

```
Lines 1065–1079:
  computeExcessSocialSecurityTax()       → line 11
  applyForm4868ToSchedule3()             → line 10
  applyPremiumTaxCreditToSchedule3()     → line 9
  applyForm2439CreditToSchedule3()       → line 13a
  applyOtherPaymentsFormToSchedule3()    → lines 12, 13b, 13d, 13z
  finalizeSchedule3Totals()              → lines 14, 15
    ...
  computeLine31ThroughLine38()           → wires line31, computes 32/33
```

### 4.4 Null Handling Rule

Line 31 is **null when line 15 ≤ 0** (not $0.00). Same null-guard on lines 32 and 33.

```java
// line 31 set only when line15 > 0
if (line15 != null && line15.compareTo(BigDecimal.ZERO) > 0) {
    payments.setOtherPaymentsSchedule3(line15);
}
```

---

## 5. Personal Form

**Form ID:** `31-other-payments`  
**YAML:** `C:\us-tax\yamls\31-other-payments-taxpayer.yaml` (version 2)  
**Component:** `C:\us-tax\us-tax-ui\src\app\forms\form-other-payments.component.ts` (~539 lines)

**UI conventions (post G1/G2 fixes):**
- All 4 screening boolean fields use native radio groups (`<div class="radio-group" id="fieldKey">`) — no `p-select` dropdowns
- `HelpModalComponent` imported and wired; `helpMap` has 9 entries covering every field
- `openHelp(key)` / `closeHelp()` pattern; `?` button beside each label
- `info-note` panel at top of form explains line 13c (Form 3800) is out of scope and directs users to enter the amount as a line 13z write-in

| Section | Condition | Fields |
|---------|-----------|--------|
| Screening | Always visible | `hasFuelTaxCredit`, `hasSection1341Credit`, `hasOtherRefundableCredits`, `hasDeferred965Tax` |
| Line 12 fuel credit | `hasFuelTaxCredit === true` | `creditForFederalTaxOnFuels` |
| Line 13b Section 1341 | `hasSection1341Credit === true` | `section1341RepaymentAmount`, `section1341Credit` |
| Line 13z other credits | `hasOtherRefundableCredits === true` | Repeating: `description` + `amount` |
| Line 13d deferred 965 | `hasDeferred965Tax === true` | `deferredNet965TaxLiability` |

**Statement input:** Form 2439 statement entries (not personal form) — `taxPaidOnUndistributedGains` from statement catalog entry.

---

## 6. Frontend Integration

| Component | Location | Line 31 reference |
|-----------|----------|-------------------|
| Form 1040 tax return | `form-tax-return-1040.component.ts:340` | `line31_amount_from_schedule3_line15` = `payments.otherPaymentsSchedule3` |
| Schedule 3 display | `form-tax-return-schedule3.component.ts:42–54` | All 11 `Schedule3OtherPaymentsCreditsView` fields mapped |
| PDF field map | `f1040_field_map_semantic.csv` | `line31_amount_from_schedule3_line15` |

---

## 7. Unit Tests

**File:** `src/test/java/com/ustax/microservices/TaxReturnComputeServiceTest.java`  
**Lines:** 15534–15707 (6 tests)

| Test name | Lines | Scenario | Key assertion |
|-----------|-------|----------|---------------|
| `line31_line14AndLine15SplitCorrectly` | 15534–15561 | Extension $500 + §1341 $1,000 | `line14=1000`, `line15=1500`, `line31=1500` |
| `line31_form2439CreditAggregatedFromStatements` | 15564–15582 | Two 2439 entries: $800+$400 | `form2439=1200`, `line31=1200` |
| `line31_section1341CreditWiredToLine13b` | 15585–15604 | Personal form `section1341Credit=2500` | `section1341Credit=2500`, `line31=2500` |
| `line31_otherRefundableCreditsSummedToLine13z` | 15607–15627 | Two items: [$400,$600] | `otherRefundableCredits=1000`, `line31=1000` |
| `line31_nullWhenNoQualifyingInputs` | 15630–15647 | W-2 only, no Schedule 3 Part II | `otherPaymentsSchedule3 = null` |
| `line31_allComponentsAggregateCorrectly` | 15650–15707 | Extension+excess SS+Form2439+§1341 | `line14=500`, `line15=1200`, `line31=1200` |

---

## 8. E2E Tests

**File:** `e2e/tests/line31-other-payments.spec.ts` (~172 lines, 6 tests)

| Test | What it verifies |
|------|-----------------|
| Form 2439 → line 13a | Statement `taxPaidOnUndistributedGains=1200` → `other.form2439=1200`, `payments.otherPaymentsSchedule3=1200` |
| Section 1341 → line 13b | Personal form `section1341Credit=2500` → `other.section1341Credit=2500`, `totalOtherPaymentsRefundableCredits=2500`, `payments.otherPaymentsSchedule3=2500` |
| Section 965(i) → line 13d | Personal form `deferredNet965TaxLiability=1500` → `other.deferredNet965TaxLiability=1500`, line14=1500, line15=1500, line31=1500 |
| Other credits → line 13z | Two items [$400,$600] → `other.otherRefundableCredits=1000`, `payments.otherPaymentsSchedule3=1000` |
| Multi-credit integration | Form 2439 ($1,200→13a) + fuel credit ($300→12) + §1341 ($800→13b) + two 13z items ($600→13z) → line14=2600, line15=2900, line31=2900 |
| UI form save/load smoke | Opens form via sidebar, uses `selectRadioOption` for 4 screening fields, sets §1341 amounts, saves, verifies PUT 200 + GET confirms saved values |

**Also tested via adjacent specs:**
- `line32-total-other-payments.spec.ts` — verifies line 31 aggregates into line 32
- `line4868-extension-of-time.spec.ts` — verifies extension payment → line 10 → line 15 → line 31

---

## 9. IRS Source Verification (2025)

Verified against `C:\us-tax\docs\books\i1040gi_2025.txt`:

- ✅ Line 10 = extension payment: "ment you made related to the extension of time to file on Schedule 3 (Form 1040), line 10" (instruction line 1084–1085)
- ✅ Line 13b = Section 1341 credit for repayments > $3,000 (instruction line 7357)
- ✅ Line 13z = write-in line; Form 8689 (U.S. Virgin Islands allocation) mentioned at instruction lines 95/107 as going to line 13z
- ✅ Schedule 3 Part II referenced at instruction lines 521 and 4493–4494: "Schedule 3, Part II, Other Payments and Refundable Credits"
- ✅ Enhanced PTC rules (no 400%-FPL cliff) still apply for 2025 per Inflation Reduction Act extension

**2025 SS excess-withholding constants** (line 11):
- Wage base: $176,100
- Employee rate: 6.2%
- Max employee SS tax: $10,918.20

---

## 10. Gaps

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| G1 | LOW | `form-other-payments` screening used `p-select` dropdowns for 4 boolean fields — violated ui.md R7 | **Fixed 2026-04-21** — replaced with native radio groups |
| G2 | LOW | `form-other-payments` had no `HelpModal` — zero help text on all fields | **Fixed 2026-04-21** — `HelpModalComponent` + 9-entry `helpMap` |
| G3 | LOW | Form 8689 (USVI allocation) as line 13z source not mentioned in YAML or UI | **Fixed 2026-04-21** — YAML `helpText` + UI instructions updated |
| G4 | LOW | No consolidated multi-credit integration E2E test | **Fixed 2026-04-21** — test: lines 12+13a+13b+13z → line14+15 |
| G5 | LOW | Line 13c (Form 3800 net elective payment) out of scope — no user message | **Partially mitigated 2026-04-21** — `info-note` in UI template; backend `TaxReturnFlag` deferred until Form 3800 is in scope |
| G6 | LOW | No E2E test for line 13d (Section 965(i) deferred tax → line 13d) | **Fixed 2026-04-21** — dedicated E2E test added to spec |
| V1 | LOW | `creditForFederalTaxOnFuels` label contained `(Form 4136 line 14)` — violated ui.md R33 | **Fixed 2026-04-21** — parenthetical removed from label in template and YAML |
