# Knowledge — Line 10 Adjustments to Income (Form 1040)

Tax year: **2025**
Last updated: **2026-04-16**

---

## 1. What line 10 is

**Form 1040 line 10** is **Adjustments to income** — the amount carried from Schedule 1 Part II, line 26.

```
Form1040.line10 = Schedule1.line26
Schedule1.line26 = sum(lines 11–23) + Schedule1.line25
Schedule1.line25 = sum(lines 24a–24z)
```

Line 10 reduces total income (line 9) to produce AGI:

```
Form1040.line11a = line9 − line10          (AGI before QBI/educator offsets)
Form1040.line11b = line11a − any QO/educator offset
```

Line 10 is a pure carryover — Schedule 1 line 26 is computed on the schedule and then copied to Form 1040 line 10. There is no separate computation at the Form 1040 level.

---

## 2. Schedule 1 Part II structure (2025)

### Lines 11–23 (named adjustment lines)

| Line | Label | Key rules |
|---|---|---|
| **11** | Educator expenses | ≤ $300/person; ≤ $600 if MFJ both educators; 900-hour K-12 rule |
| **12** | Certain business expenses (reservists, performing artists, fee-basis officials) | Requires Form 2106 |
| **13** | Health savings account deduction | Requires Form 8889; excludes employer contributions/rollovers |
| **14** | Moving expenses for Armed Forces | Requires Form 3903; PCS only |
| **15** | Deductible part of self-employment tax | Comes from Schedule SE — **out of scope** |
| **16** | Self-employed SEP, SIMPLE, and qualified plans | — **out of scope** |
| **17** | Self-employed health insurance deduction | Worksheet/Form 7206/Pub. 974 — **out of scope** |
| **18** | Penalty on early withdrawal of savings | From 1099-INT/1099-OID penalty boxes |
| **19a** | Alimony paid | Pre-2019 agreements only; requires SSN (19b) and date (19c) |
| **19b** | Recipient's SSN | Required when 19a is nonzero |
| **19c** | Date of original agreement | Month/year; required when 19a is nonzero |
| **20** | IRA deduction | Worksheet in Pub. 590-A; nondeductible → Form 8606 |
| **21** | Student loan interest deduction | Cap $2,500; phaseout $85k–$100k single; $170k–$200k MFJ; unavailable MFS/dependents |
| **22** | Reserved | Always zero/null (2025) |
| **23** | Archer MSA deduction | Requires Form 8853 |

### Lines 24a–24k (write-in adjustments)

| Line | Label |
|---|---|
| **24a** | Jury duty pay given to employer |
| **24b** | Deductible expenses related to line 8l (rental of personal property) |
| **24c** | Nontaxable Olympic/Paralympic medals and USOC prize money (backs out line 8m) |
| **24d** | Reforestation amortization and expenses |
| **24e** | Repayment of supplemental unemployment benefits (Trade Act of 1974) |
| **24f** | Contributions to Section 501(c)(18)(D) pension plans |
| **24g** | Contributions by certain chaplains to Section 403(b) plans |
| **24h** | Attorney fees for qualifying unlawful discrimination claims (≤ gross income from claim) |
| **24i** | Attorney fees/costs connected to IRS whistleblower award (≤ award included in income) |
| **24j** | Housing deduction from Form 2555 (distinct from line 8d foreign earned income) |
| **24k** | Excess deductions of §67(e) expenses from Schedule K-1 (Form 1041), box 11, code A |
| **24z** | Other adjustments (only when a specific IRS instruction directs an entry here) |

### Totals

```
line25 = sum(24a, 24b, 24c, 24d, 24e, 24f, 24g, 24h, 24i, 24j, 24k, 24z)
line26 = sum(lines 11–23) + line25
Form1040.line10 = line26
```

---

## 3. Backend implementation

**Method:** `computeIncomeAdjustments()` in `TaxReturnComputeService.java` (line ~7117)

**Signature:**
```java
private IncomeAdjustmentsComputation computeIncomeAdjustments(
    Map<String, Object> incomeAdjustmentsTaxpayer,
    Map<String, Object> incomeAdjustmentsSpouse,
    List<Map<String, Object>> form1099EEntries,
    List<Map<String, Object>> form1099IntEntries,
    List<Map<String, Object>> form1099OidEntries,
    List<Map<String, Object>> formK11041Entries,
    BigDecimal olympicLine8m,
    List<TaxReturnFlag> flags,
    String uid)
```

**Return type:** `IncomeAdjustmentsComputation` record (`adjustments`, `otherAdjustmentItems`, `line10FromSchedule1Line26`)

**Early return:** returns `null` when `!hasAnySchedule1Input` (no nonzero lines or adjustment items).

**Call site:** `prepare()` at ~line 431; `olympicLine8m` is extracted from `otherIncome.additionalIncome().getOtherIncomeOlympicParalympicAwards()` before the call.

### Key code points

| Code location (approx.) | What it does |
|---|---|
| ~7147–7177 | Out-of-scope gates for lines 15, 16, 17; emits blocking flags |
| ~7179–7214 | Computes lines 11–23 and 24a–24k |
| ~7218–7224 | Line 24c: `firstNonNullAmount(userLine24c, olympicLine8m)` — auto-fills from line 8m |
| ~7232–7235 | Line 24k: manual field + `importedK1Section67eExcessDeductionsTotal` from personal form |
| ~7237–7239 | Calls `buildSchedule1OtherAdjustmentItems()` for 24z list; sums to `line24z` |
| ~7239–7240 | `line25 = sumAmounts(24a…24z)`; `line26 = sumAmounts(11…23) + line25` |
| ~7242–7259 | `hasAnySchedule1Input` guard; returns null if no inputs |
| ~7262–7290 | Populates `Schedule1Adjustments` output model |
| ~7298–7302 | Returns `IncomeAdjustmentsComputation(adjustments, otherAdjustmentItems, roundMoney(line26))` |

### Statement auto-import paths

| Statement | Field read | Line populated |
|---|---|---|
| 1099-INT entries | `earlyWithdrawalPenaltyAmount` | line 18 |
| 1099-OID entries | `earlyWithdrawalPenaltyAmount` | line 18 |
| 1098-E entries | `studentLoanInterestReceivedAmount` | line 21 |
| K-1 (Form 1041) | `importedK1Section67eExcessDeductionsTotal` (personal form imported field, not direct statement parse) | line 24k |

### Line 18 (early withdrawal) layering

```
line18 = manual + imported1099IntPenalty + imported1099OidPenalty + sum(statement entries)
```

Three layers aggregate without precedence; all add together.

### Line 21 (student loan) layering

```
line21 = manual + imported1098EBox1Total + sum(1098-E statement entries)
```

**No $2,500 cap enforced.** **No MAGI phaseout computed.** User-entered values flow through uncapped. (See Gap 2 / Gap 3.)

### Line 24c auto-fill

User-entered `otherAdjustmentNontaxableOlympicParalympicLine24c` takes precedence via `firstNonNullAmount(userLine24c, olympicLine8m)`. If the user enters nothing, the backend auto-fills from line 8m (Olympic income). AGI threshold ($1M/$500k MFS) is not enforced automatically — the user can override via the intake field.

### Out-of-scope flags

| Flag code | Line | Blocking |
|---|---|---|
| `INCOME_ADJUSTMENTS_LINE15_OUT_OF_SCOPE` | 15 (SE tax) | true |
| `INCOME_ADJUSTMENTS_LINE16_OUT_OF_SCOPE` | 16 (SE retirement) | true |
| `INCOME_ADJUSTMENTS_LINE17_OUT_OF_SCOPE` | 17 (SE health insurance) | true |

### Statement gating flag

`INCOME_ADJUSTMENTS_STATEMENT_CONFIRMATION_REQUIRED` — blocking; emitted when `hadIncomeAdjustmentsForSchedule1 = true` but the upload confirmation checkbox is not checked.

---

## 4. Output model

**Class:** `Schedule1Adjustments.java` (`model/output/`)

Key fields:
- `educatorExpenses`
- `certainBusinessExpenses`
- `healthSavingsAccountDeduction`
- `movingExpensesArmedForces`
- `deductibleSelfEmploymentTax` (null — out of scope)
- `selfEmployedSepSimpleQualifiedPlans` (null — out of scope)
- `selfEmployedHealthInsuranceDeduction` (null — out of scope)
- `earlyWithdrawalPenalty`
- `alimonyPaid`, `alimonyPaidRecipientSsn`, `alimonyPaidAgreementDate`
- `iraDeduction`
- `studentLoanInterestDeduction`
- `archerMsaDeduction`
- `otherAdjustmentJuryDutyPay`, `otherAdjustmentRentalPersonalPropertyExpenses`
- `otherAdjustmentOlympicParalympicMedals`
- `otherAdjustmentReforestation`, `otherAdjustmentRepaymentSupplementalUnemployment`
- `otherAdjustmentSection501c18d`, `otherAdjustmentChaplains403b`
- `otherAdjustmentAttorneyFeesUnlawfulDiscrimination`, `otherAdjustmentAttorneyFeesWhistleblower`
- `otherAdjustmentHousingDeduction`, `otherAdjustmentExcessDeductionsSection67e`
- `otherAdjustmentOther` (24z)
- `totalOtherAdjustments` (line25)
- `totalAdjustmentsToIncome` (line26 = Form1040 line 10)

**Downstream read:**
```java
// In buildAdjustments() ~line 3966
BigDecimal line9 = income == null ? null : roundMoney(income.getTotalIncome());
BigDecimal line10 = incomeAdjustments == null ? null : incomeAdjustments.line10FromSchedule1Line26();
BigDecimal line11a = line9 == null ? null : roundMoney(subtractNonNegativeAllowNegative(line9, line10));
```

---

## 5. Personal forms (intake)

| Form ID | Person | Contains |
|---|---|---|
| `income-adjustments-taxpayer` | Taxpayer | All Schedule 1 Part II lines; gating questions; out-of-scope disclosure fields |
| `income-adjustments-spouse` | Spouse | Supplemental spouse-only inputs (lines 11–24) |

**YAML files:**
- `C:\us-tax\yamls\10-income-adjustments-taxpayer.yaml`
- `C:\us-tax\yamls\10-income-adjustments-spouse.yaml`

Gating field: `hadIncomeAdjustmentsForSchedule1` (boolean, taxpayer form only).

---

## 6. Unit test coverage

**File:** `TaxReturnComputeServiceTest.java`

| Test method (approx. line) | Coverage |
|---|---|
| `computesSchedule1PartIiAndForm1040Line10FromIncomeAdjustmentsForms()` (~6729) | Educator $1k + alimony $2k + IRA $3k + jury duty $100 → line26=$6,100; line10=$6,100 |
| `flagsIncomeAdjustmentsStatementAndOutOfScopeGaps()` (~6803) | Statement gate missing → blocking flag; SE line 15 → blocking flag |
| `olympicLine8mAutoFillsLine24c()` (~6889) | line 8m = $50k → line24c auto-populated $50k when no user entry |
| `userEnteredLine24cOverridesOlympicAutoCompute()` (~6917) | line 8m = $50k + user 24c = $30k → line24c = $30k (user wins) |
| `alimonyWithoutDateEmitsNonBlockingFlag()` (~7072) | Alimony entered without agreement date → non-blocking advisory flag |

**Unit test coverage gaps:**
- No test for line 11 educator cap enforcement (no test that $400 entry is capped at $300)
- No test for line 21 $2,500 cap
- No test for line 21 MAGI phaseout
- No test for line 19a post-2018 date validation
- No test for line 18 statement auto-import (1099-INT/OID → earlyWithdrawalPenaltyAmount)
- No test for line 21 statement auto-import (1098-E → studentLoanInterestReceivedAmount)
- No test for line 24k K-1(1041) import
- No test for MFJ spouse educator expenses (up to $600, neither >$300)

---

## 7. E2E test coverage

**File:** `e2e/tests/line10-income-adjustments.spec.ts`

| Test | Coverage |
|---|---|
| Statement block test | Statement upload gate UI — form blocks compute when upload confirmation not checked |
| Line 10 flow test | Lines 11/12/14/24j/24z via UI → compute → assert line 10 total on Form 1040 |
| No-adjustments path | `hadIncomeAdjustmentsForSchedule1 = false` → Schedule 1 Part II absent |

**E2E coverage gaps:**
- No API-based E2E test for line 18 statement auto-import (1099-INT/OID penalty)
- No API-based E2E test for line 21 statement auto-import (1098-E)
- No API-based E2E test for line 24c Olympic auto-fill
- No API-based E2E test for lines 24a/24b/24d–24k

---

## 8. Compute order

```
computeOtherIncomes()              → olympicLine8m (line 8m value)
computeIncomeAdjustments()         → IncomeAdjustmentsComputation (line 10)
computeSocialSecurityBenefits()    → consumes line 10 for SS worksheet line 6
buildAdjustments()                 → line11a = line9 − line10
```

`computeIncomeAdjustments()` must run AFTER `computeOtherIncomes()` (needs `olympicLine8m`) and BEFORE `buildAdjustments()` and `computeSocialSecurityBenefits()`.

---

## 9. Known gaps and deferred items

See `C:\us-tax\outstanding.md` for full details. Summary:

| Gap | Description | Priority |
|---|---|---|
| Line 11 cap not enforced | Backend passes through uncapped educator expenses; $300/$600 cap missing | Medium |
| Line 21 $2,500 cap missing | Student loan interest flows through uncapped | High |
| Line 21 MAGI phaseout missing | No phaseout computed; over-$100k/$200k filers get full deduction | High |
| Line 19a post-2018 guard missing | Alimony allowed for post-2018 agreements — should emit blocking flag | High |
| Line 20 IRA worksheet missing | IRA deduction not capped by Pub. 590-A MAGI worksheet | Medium |
| Statement auto-import tests | Lines 18 and 21 have no unit/E2E coverage for statement parsing paths | Low |
| K-1 (1041) → 24k direct parse | Statement entries in `formK11041Entries` not directly summed; uses personal-form import field only | Low |

---

## 10. Lines/10.md accuracy notes (2025 verification)

The spec file at `C:\us-tax\lines\10.md` is accurate for 2025 with the following confirmations:
- **Educator cap ($300/$600):** Correct per 2025 IRS Form 1040 instructions.
- **Student loan phaseout thresholds:** Single/HOH/QSS: $85k–$100k; MFJ: $170k–$200k (confirmed via IRS Rev. Proc. 2024-40 inflation adjustments applied to 2024 base of $80k–$95k single and $165k–$195k MFJ).
- **Alimony cutoff (post-2018):** Correct — TCJA 2017 eliminated deduction for agreements dated after 12/31/2018.
- **Line 24z warning:** Correct — leave blank unless specific IRS instruction directs a write-in entry.
- **Lines 15–17 out of scope:** Correct for this product (no Schedule SE/C).
