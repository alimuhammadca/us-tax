---
name: line-1z-total-wages
description: Complete implementation and status of Form 1040 Line 1z
type: project
---

# Knowledge: Form 1040 Line 1z — Total Wages

**Tax year:** 2025  
**Last updated:** 2026-04-13  
**Status:** Fully implemented and tested

---

## What Line 1z Is

Line 1z is the **wage subtotal** on Form 1040 / 1040-SR. It is a pure arithmetic sum of lines 1a through 1h. It does NOT include line 1i (nontaxable combat pay election), which is a credit-computation line, not a wage subtotal.

**Formula:**
```
line1z = line1a + line1b + line1c + line1d + line1e + line1f + line1g + line1h
```

**IRS label:** "Add lines 1a through 1h"

Line 1z is an intermediate subtotal; it flows into line 9 (total income):
```
line9 = line1z + line2b + line3b + line4b + line5b + line6b + line7a + line8
```

---

## Sub-Lines 1a Through 1h

| Sub-line | IRS label | Source form | Backend field | Personal form ID |
|---|---|---|---|---|
| 1a | Wages, salaries, tips, etc. | W-2 box 1 | `income.wages` | `employment-income-taxpayer` / `employment-income-spouse` |
| 1b | Household employee wages not on W-2 | Household worker flow | `income.householdEmployeeWages` | `employment-income-taxpayer` / `employment-income-spouse` |
| 1c | Tip income not reported on 1a | Form 4137 / tip-income form | `income.tipIncome` | `tip-income-taxpayer` / `tip-income-spouse` |
| 1d | Medicaid waiver payments not in W-2 box 1 | Medicaid waiver form | `income.medicaidWaiverPayments` | `medicaid-waiver-payments-taxpayer` / `medicaid-waiver-payments-spouse` |
| 1e | Taxable dependent care benefits | Form 2441 line 26 | `income.dependentCareBenefits` | `childcare-expenses` |
| 1f | Employer-provided adoption benefits | Form 8839 line 31 | `income.adoptionBenefits` | `adoption-expenses` |
| 1g | Wages from Form 8919 line 6 | Form 8919 (uncollected SS/Medicare) | `income.uncollectedSocialSecurityMedicareWages` | `uncollected-ss-medicare-taxpayer` / `uncollected-ss-medicare-spouse` |
| 1h | Other earned income | Other earned income form | `income.otherEarnedIncome` | `other-earned-income` |

### Line 1i — Excluded

Line 1i (`income.nontaxableCombatPayElection`) is **explicitly excluded** from line 1z. It is set separately from the wages sum and is used only in:
- EIC computation (`computeLine27aEIC()`)
- ACTC earned income base (`computeSchedule8812()` Part II-A)

---

## Backend Implementation

**File:** `C:\us-tax\us-tax-be\src\main\java\com\ustax\microservices\TaxReturnComputeService.java`

**Method containing line 1z computation:** `buildIncome()` (inline, not a separate named method)

### Algorithm

1. Each sub-line is computed by its dedicated helper method (called prior to `buildIncome()`):
   - `computeWages()` → `line1a`, `line1b` (W-2 box 1, household wages)
   - `computeTipIncome()` → `line1c`
   - `computeMedicaidWaiver()` → `line1d`
   - `computeDependentCare()` → `line1e`
   - `computeAdoptionBenefits()` → `line1f`
   - `computeUncollectedSocialSecurity()` → `line1g`
   - `computeOtherEarnedIncome()` → `line1h`
   - `computeCombatPay()` → `combatPayElection` (line 1i — NOT part of 1z)

2. Each sub-line value is rounded to cents via `roundMoney()`.

3. Line 1z is computed as:
   ```java
   BigDecimal totalWagesRaw = addNonNull(addNonNull(addNonNull(addNonNull(
       addNonNull(addNonNull(addNonNull(line1a, line1b), line1c),
       line1d), line1e), line1f), line1g), line1h);
   BigDecimal line1z = roundMoney(totalWagesRaw);
   ```
   `addNonNull(a, b)` treats null as zero only when the other operand is non-null; if both are null the result is null.

4. Combat pay is stored separately (never added to `totalWagesRaw`):
   ```java
   // Line 1i stores the elected combat pay for credit worksheets only (not part of wages totals).
   if (combatPayElection != null) {
       income.setNontaxableCombatPayElection(roundMoney(combatPayElection));
   }
   if (line1z != null) {
       income.setTotalWages(line1z);
   }
   ```

### Output Model Field

**File:** `C:\us-tax\us-tax-be\src\main\java\com\ustax\model\output\Income.java`

| Field | Java type | JSON key | Notes |
|---|---|---|---|
| `totalWages` | `BigDecimal` | `form1040.income.totalWages` | null when all 1a-1h are null |

The `Income` class also stores all sub-line values:
- `wages` (1a), `householdEmployeeWages` (1b), `tipIncome` (1c), `medicaidWaiverPayments` (1d), `dependentCareBenefits` (1e), `adoptionBenefits` (1f), `uncollectedSocialSecurityMedicareWages` (1g), `otherEarnedIncome` (1h)
- `nontaxableCombatPayElection` (1i) — separate, not summed into totalWages

### Null Behavior

If all sub-lines 1a through 1h are null, `addNonNull` propagates null and `line1z` remains null. The backend then does not call `income.setTotalWages()`, leaving the field absent from the JSON output.

**Exception:** When a W-2 employment flag exists but `line1a` is null, `income.setWages(BigDecimal.ZERO)` is set explicitly (see `hasEmploymentFlag` check at line 3801).

---

## Frontend Implementation

**File:** `C:\us-tax\us-tax-ui\src\app\forms\form-tax-return-1040.component.ts`

**Method:** `buildFieldValues()`

**Mapping:**
```typescript
values['line1z_total_wages'] = this.formatAmount(form.income?.totalWages ?? form.income?.wages);
```

The fallback `?? form.income?.wages` handles returns where only W-2 wages exist and no multi-line subtotal was needed (though `totalWages` is always set when any sub-line is present in practice).

**Interface field (`Form1040` TypeScript interface):**
```typescript
totalWages?: number | string | null;
```

**Semantic PDF field name:** `line1z_total_wages`

### Related Sub-line PDF Mappings

```typescript
values['line1a_wages_w2_box1'] = this.formatAmount(form.income?.wages);
values['line1b_household_employee_wages'] = this.formatAmount(form.income?.householdEmployeeWages);
values['line1c_tip_income'] = this.formatAmountNoGrouping(form.income?.tipIncome);
values['line1d_medicaid_waiver_payments'] = this.formatAmount(form.income?.medicaidWaiverPayments);
values['line1e_taxable_dependent_care_benefits'] = this.formatAmount(form.income?.dependentCareBenefits);
values['line1f_employer_provided_adoption_benefits'] = this.formatAmount(form.income?.adoptionBenefits);
values['line1g_wages_form8919_line6'] = this.formatAmount(form.income?.uncollectedSocialSecurityMedicareWages);
values['line1h_other_earned_income'] = this.formatAmount(form.income?.otherEarnedIncome);
values['line1i_nontaxable_combat_pay'] = this.formatAmount(form.income?.nontaxableCombatPayElection);
```

Note: `line1c_tip_income` uses `formatAmountNoGrouping` (no thousands separator) per IRS PDF field format.

---

## YAML Intake Specs

Line 1z has no dedicated YAML of its own — it is a computed subtotal. The intake forms for each sub-line are:

| Sub-line | YAML file(s) |
|---|---|
| 1a (W-2 wages) | No standalone YAML — embedded in `employment-income-taxpayer.yaml` / `employment-income-spouse.yaml` (not in `C:\us-tax\yamls\`; these are backend YAMLs) |
| 1b (household wages) | `C:\us-tax\yamls\1b-household-employee-wages.yaml` (orphaned/dead — see Outstanding Items) |
| 1c (tip income) | `C:\us-tax\yamls\1c-tip-income-taxpayer.yaml` |
| 1d (Medicaid waiver) | `C:\us-tax\yamls\1d-medicaid-waiver-payments-taxpayer.yaml`, `1d-medicaid-waiver-payments-spouse.yaml` |
| 1e (dependent care) | `C:\us-tax\yamls\1e-childcare-expenses.yaml` |
| 1f (adoption benefits) | `C:\us-tax\yamls\1f-adoption-expenses.yaml` |
| 1g (Form 8919 wages) | `C:\us-tax\yamls\1g-uncollected-ss-medicare-tax.yaml` |
| 1h (other earned income) | `C:\us-tax\yamls\1h-other-earned-income.yaml` |
| 1i (combat pay — excluded) | `C:\us-tax\yamls\1i-combat-pay-taxpayer.yaml`, `1i-combat-pay-spouse.yaml` |

---

## Unit Test Coverage

**File:** `C:\us-tax\us-tax-be\src\test\java\com\ustax\microservices\TaxReturnComputeServiceTest.java`

Line 1z is directly tested by:

| Test name | What it verifies |
|---|---|
| `computesLine1zSumExcludesCombatPayElection` | Line 1z = wages (1a) + adoption benefits (1f) + other earned (1h); line 1i combat pay ($1,500) is excluded; `totalWages` correctly omits combat pay election |

Line 1z is indirectly tested (asserted as part of broader scenario assertions) in:

| Test context | Reference | Notes |
|---|---|---|
| Line 9 summation test | Line `4495` comment | "Form 1040 line 9 must equal lines 1z + 2b + ..." |
| Schedule 8812 CTC/ACTC | Line `5710` comment | `line1z = $20,000 → line19 = $17,500 → line20 = $2,625` |
| ACTC combat pay inclusion | Line `5735` comment | `line1z=$1,800`, `line1i=$1,000` → `line18a=$2,800` (combat pay adds to ACTC base) |

---

## E2E Test Coverage

**File:** `C:\us-tax\us-tax-be\e2e\tests\line1z-total-wages.spec.ts`

| Test name | What it verifies |
|---|---|
| Line 1z sums lines 1a-1h and excludes line 1i | W-2 $2,000 (1a) + strike benefits $300 (1h) + code Q $500 combat pay elected (1i) → `totalWages=2300` (not 2800) |
| Line 1z correctly aggregates three independent sub-lines (1a + 1g + 1h) | W-2 $10,000 (1a) + Form 8919 $2,000 (1g) + strike benefits $1,500 (1h) → `totalWages=13500` |
| Negative line 1f from special-needs adoption reduces line 1z | W-2 $50,000 (1a) + box 12 T $2,000; special-needs child final adoption → `adoptionBenefits=-15280` (1f); `totalWages=34720` |

---

## Downstream Consumers

Line 1z (`totalWages`) feeds:

| Consumer | How |
|---|---|
| **Line 9 (total income)** | `line9 = line1z + line2b + line3b + line4b + line5b + line6b + line7a + line8` |
| **Schedule 8812 (CTC/ACTC)** | `computeSchedule8812()` reads `income.getTotalWages()` for the CTC/ODC earned income base (`line18a`). Note: combat pay is then added separately via `income.getNontaxableCombatPayElection()` |
| **AGI (line 11b)** | Indirectly through line 9 → line 11b = line 9 − line 10 |
| **Taxable income (line 15)** | Indirectly through AGI |

---

## Line Spec Reference

`C:\us-tax\lines\1z.md`

## Flowchart Reference

`C:\us-tax\flowcharts\1z.drawio`

## Dependency Reference

`C:\us-tax\dependencies\1z.md`

---

## Known Gaps / Outstanding Items

| # | Gap | Severity | Status |
|---|---|---|---|
| 1 | Only one E2E test for line 1z; scenarios testing multiple sub-lines simultaneously not covered | Low | Resolved 2026-04-13 — added "1a + 1g + 1h aggregation" test |
| 2 | `1b-household-employee-wages.yaml` is orphaned — not registered in `PersonalResource.java` | Low | Open (tracked in `outstanding.md`) |
| 3 | Line 1f (adoption benefits) can be negative for special-needs cases; no E2E test covered negative line 1z | Low | Resolved 2026-04-13 — added "negative 1f reduces 1z" test |
| 4 | No flowchart file existed for line 1z prior to this session | Docs | Resolved 2026-04-13 |
| 5 | No dependency file existed for line 1z prior to this session | Docs | Resolved 2026-04-13 |
