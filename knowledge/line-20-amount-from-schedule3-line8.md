# Knowledge: Form 1040 Line 20 / Line 31 — Schedule 3 (2025)

_Audited 2026-04-18. Gaps G1/G3/G5/G6 fixed 2026-04-18. G2 blocked. G7 partial._

---

## 1. Line Identity

| Form 1040 line | Description | Source |
|---|---|---|
| **Line 20** | Amount from Schedule 3, line 8 | `TaxAndCredits.otherCreditsSchedule3` |
| **Line 21** | CTC + line 20 | `TaxAndCredits.totalCredits` |
| **Line 22** | max(0, line 18 − line 21) | `TaxAndCredits.taxAfterCredits` |
| **Line 24** | line 22 + line 23 | `TaxAndCredits.totalTax` |
| **Line 31** | Amount from Schedule 3, line 15 | `Payments.otherPaymentsSchedule3` |

---

## 2. Core Formula

```
// Schedule 3 Part I — Nonrefundable credits
Schedule3.line7  = sum(line6a..line6z)      ← Fixed 2026-04-18 (was line6z only — G6)
Schedule3.line8  = 1 + 2 + 3 + 4 + 5a + 5b + 7
Form1040.line20  = Schedule3.line8

// Form 1040 credit chain
line21 = line19 + line20
line22 = max(0, line18 - line21)
line24 = line22 + line23

// Schedule 3 Part II — Other payments and refundable credits
Schedule3.line14 = sum(13a + 13b + 13c + 13d + 13z)
Schedule3.line15 = 9 + 10 + 11 + 12 + 14
Form1040.line31  = Schedule3.line15
```

---

## 3. Schedule 3 Structure — All Lines

### Part I — Nonrefundable Credits (→ line 20)

| S3 line | Description | Java field | Backend status |
|---|---|---|---|
| 1 | Foreign tax credit | `foreignTaxCredit` | Implemented — `applyForeignTaxCreditToSchedule3()` |
| 2 | Child and dependent care credit | `childDependentCareCredit` | Implemented — `finalizeForm2441PartII()` |
| 3 | Education credits | `educationCredits` | Implemented — `applyForm8863ToSchedule3()` |
| 4 | Retirement savings contributions credit | `retirementSavingsContributionsCredit` | Implemented — `applyForm8880ToSchedule3()` |
| 5a | Residential clean energy credit | `residentialCleanEnergyCredit` | Implemented — `applyForm5695ToSchedule3()` |
| 5b | Energy efficient home improvement credit | `energyEfficientHomeImprovementCredit` | Implemented — `applyForm5695ToSchedule3()` |
| 6a | General business credit | `generalBusinessCredit` | Out of scope (Form 3800 / SE) |
| 6b | Credit for prior year minimum tax | `priorYearMinimumTaxCredit` | Implemented — `applyForm8801ToSchedule3()` |
| 6c | Adoption credit | `adoptionCredit` | **Implemented** — `applyAdoptionCredit()` with CLW-B; fixed 2026-04-18 (G1) |
| 6d | Credit for elderly or disabled | `elderlyDisabledCredit` | Implemented — `applyScheduleRToSchedule3()` |
| 6e | Reserved | — | Always blank |
| 6f | Clean vehicle credit | `cleanVehicleCredit` | Implemented — `applyForm8936ScheduleAToSchedule3()` |
| 6g | Mortgage interest credit | `mortgageInterestCredit` | Implemented — `applyForm8396ToSchedule3()` |
| 6h | DC first-time homebuyer credit | `dcFirstTimeHomebuyerCredit` | Implemented — `applyForm8859ToSchedule3()` |
| 6i | Qualified electric vehicle credit | `qualifiedElectricVehicleCredit` | Implemented — `applyForm8834ToSchedule3()` |
| 6j | Alternative fuel vehicle refueling property credit | `alternativeFuelVehicleRefuelingPropertyCredit` | Implemented — `applyForm8911ToSchedule3()` |
| 6k | Credit to holders of tax credit bonds | `creditToHoldersOfTaxCreditBonds` | Implemented — `applyForm8912ToSchedule3()` |
| 6l | Amount from Form 8978, line 14 (negative only) | `amountFromForm8978Line14` | **Not implemented** — **BLOCKED** on Form 8978 implementation (G2) |
| 6m | Credit for previously owned clean vehicles | `creditPreviouslyOwnedCleanVehicles` | Implemented — `applyForm8936ScheduleAToSchedule3()` |
| 6z | Other nonrefundable credits (write-in) | `otherNonrefundableCredits` | Implemented — via other-payments personal form |
| **7** | **Total other nonrefundable credits** | `totalOtherNonrefundableCredits` | **Fixed** — now sum(6a..6z); fixed 2026-04-18 (G6) |
| **8** | **Total nonrefundable credits** | `totalNonrefundableCredits` | **Correct** — IRS formula: 1+2+3+4+5a+5b+7 |

### Part II — Other Payments and Refundable Credits (→ line 31)

| S3 line | Description | Java field | Backend status |
|---|---|---|---|
| 9 | Net premium tax credit | `netPremiumTaxCredit` | Implemented — `applyPremiumTaxCreditToSchedule3()` |
| 10 | Amount paid with extension | `amountPaidWithExtension` | Implemented — `applyForm4868ToSchedule3()` |
| 11 | Excess social security / RRTA tax withheld | `excessSocialSecurityRrtaTaxWithheld` | Implemented — `computeExcessSocialSecurityTax()` |
| 12 | Credit for federal tax on fuels | `creditForFederalTaxOnFuels` | **Implemented** — manual entry via `31-other-payments` personal form; fixed 2026-04-18 (G3) |
| 13a | Form 2439 — undistributed capital gains | `form2439` | Implemented — `applyForm2439CreditToSchedule3()` |
| 13b | Section 1341 credit | `section1341Credit` | Implemented — `applyOtherPaymentsFormToSchedule3()` |
| 13c | Net elective payment election amount | `netElectivePaymentElectionAmount` | Out of scope (Form 3800); no PDF field mapped |
| 13d | Deferred net 965 tax liability | `deferredNet965TaxLiability` | **Implemented** — manual entry via `31-other-payments` personal form; fixed 2026-04-18 (G5) |
| 13z | Other refundable credits (write-in) | `otherRefundableCredits` | Implemented — `applyOtherPaymentsFormToSchedule3()` |
| **14** | **Total other payments / refundable credits** | `totalOtherPaymentsRefundableCredits` | Implemented |
| **15** | **Total Part II** | `totalOtherPaymentsAndRefundableCredits` | Implemented |

---

## 4. Key Backend Methods

### `finalizeSchedule3Totals()` (TaxReturnComputeService.java line 14445)

Computes the two Schedule 3 totals:

```java
// Part I — fixed 2026-04-18 (G6)
totalOtherNonrefundableCredits = sum(6a..6z)  // = sum of all nc fields (generalBusinessCredit..otherNonrefundableCredits)
totalNonrefundableCredits = sum(
    foreignTaxCredit,                          // line 1
    childDependentCareCredit,                  // line 2
    educationCredits,                          // line 3
    retirementSavingsContributionsCredit,      // line 4
    residentialCleanEnergyCredit,              // line 5a
    energyEfficientHomeImprovementCredit,      // line 5b
    totalOtherNonrefundableCredits             // line 7 = sum(6a..6z)
)  // IRS formula: 1+2+3+4+5a+5b+7

// Part II
line14 = sum(form2439, section1341Credit, netElectivePaymentElectionAmount,
             deferredNet965TaxLiability, otherRefundableCredits)
line15 = netPremiumTaxCredit + amountPaidWithExtension +
         excessSocialSecurityRrtaTaxWithheld + creditForFederalTaxOnFuels + line14
```

**Must run after** all `applyXxxToSchedule3()` methods and before `computeLine20ThroughLine24()`.

### `computeLine20ThroughLine24()` (line 14955)

```java
line20 = schedule3.nonrefundableCredits.totalNonrefundableCredits  // null if ≤ 0
tac.setOtherCreditsSchedule3(line20)
line21 = childTaxCredit + safeAmount(line20)
line22 = max(0, line18 - line21)
line24 = line22 + otherTaxes(line23)
```

**Must run after** `finalizeSchedule3Totals()` and `computeSchedule8812()`.

### All `applyXxxToSchedule3()` methods — call order in `prepare()`

```
applyForeignTaxCreditToSchedule3()         ~line  827
finalizeForm2441PartII()                    ~line  838  (sets childDependentCareCredit)
applyForm8880ToSchedule3()                 ~line  845
applyPremiumTaxCreditToSchedule3()         ~line  847
applyForm8863ToSchedule3()                 ~line  860
applyForm5695ToSchedule3()                 ~line  914
applyForm8801ToSchedule3()                 ~line  926
applyAdoptionCredit(schedule3, adoption, form1040)  ~line  927  ← CLW-B; moved here 2026-04-18 (G1)
applyScheduleRToSchedule3()                ~line  938
applyForm8936ScheduleAToSchedule3()        ~line  951
applyForm8396ToSchedule3()                 ~line  962
applyForm8859ToSchedule3()                 ~line  973
applyForm8834ToSchedule3()                 ~line  984
applyForm8911ToSchedule3()                 ~line  999
applyForm8912ToSchedule3()                 ~line 1011
applyForm4868ToSchedule3()                 ~line 1021
computeExcessSocialSecurityTax()           ~line 1044
applyForm2439CreditToSchedule3()           ~line 1046
applyOtherPaymentsFormToSchedule3()        ~line 1048
finalizeSchedule3Totals()                  ~line 1049
computeLine20ThroughLine24()               ~line 1051
computeLine31ThroughLine38()               ~line 1053  (wires line15 → line31)
```

---

## 5. Frontend

### Angular component — `form-tax-return-schedule3.component.ts`

Renders `Schedule-3-2025.pdf` filled with all Schedule 3 fields:

| PDF field | Java model field | Schedule 3 line |
|---|---|---|
| `f1_01[0]` | header name | — |
| `f1_02[0]` | header SSN | — |
| `f1_03[0]` | foreignTaxCredit | 1 |
| `f1_04[0]` | childDependentCareCredit | 2 |
| `f1_05[0]` | educationCredits | 3 |
| `f1_06[0]` | retirementSavingsContributionsCredit | 4 |
| `f1_07[0]` | residentialCleanEnergyCredit | 5a |
| `f1_09[0]` | energyEfficientHomeImprovementCredit | 5b |
| `f1_10[0]` | generalBusinessCredit | 6a |
| `f1_11[0]` | priorYearMinimumTaxCredit | 6b |
| `f1_12[0]` | adoptionCredit | 6c |
| `f1_13[0]` | elderlyDisabledCredit | 6d |
| `f1_14[0]` | cleanVehicleCredit | 6f |
| `f1_15[0]` | mortgageInterestCredit | 6g |
| `f1_16[0]` | dcFirstTimeHomebuyerCredit | 6h |
| `f1_17[0]` | qualifiedElectricVehicleCredit | 6i |
| `f1_18[0]` | alternativeFuelVehicleRefuelingPropertyCredit | 6j |
| `f1_19[0]` | creditToHoldersOfTaxCreditBonds | 6k |
| `f1_20[0]` | amountFromForm8978Line14 | 6l |
| `f1_21[0]` | creditPreviouslyOwnedCleanVehicles | 6m |
| `f2_22[0]` / `f1_23[0]` | otherNrItems[0].description / .amount | 6z |
| `f1_24[0]` | totalOtherNonrefundableCredits | **7** (sum 6a..6z per IRS formula; G6 fix locked in 2026-04-18; doc-drift fix 20 #4 2026-05-14) |
| `f1_08[0]` | totalNonrefundableCredits | **8** (correct) |
| `f1_25[0]` | netPremiumTaxCredit | 9 |
| `f1_26[0]` | amountPaidWithExtension | 10 |
| `f1_27[0]` | excessSocialSecurityRrtaTaxWithheld | 11 |
| `f1_28[0]` | creditForFederalTaxOnFuels | 12 |
| `f1_30[0]` | form2439 | 13a |
| `f1_31[0]` | section1341Credit | 13b |
| `f1_29[0]` | deferredNet965TaxLiability | 13d |
| `f1_34[0]` / `f1_32[0]` | otherRefItems[0].description / .amount | 13z |
| `f1_36[0]` | totalOtherPaymentsRefundableCredits | 14 |
| `f1_37[0]` | totalOtherPaymentsAndRefundableCredits | 15 |

**Note:** Line 13c (`netElectivePaymentElectionAmount`) has no PDF field mapping.

### Form 1040 component — `form-tax-return-1040.component.ts`

```typescript
// Line 20
values['line20_amount_from_schedule3_line8'] = formatAmount(form.taxAndCredits?.otherCreditsSchedule3);

// Line 31
values['line31_amount_from_schedule3_line15'] = formatAmount(form.payments?.otherPaymentsSchedule3);
```

### Shell sidebar — `shell.component.ts` line 906

Schedule 3 sidebar entry is conditional:
```typescript
if (this.hasSchedule3Data(computation?.schedule3)) {
  items.splice(insertIdx++, 0, { id: 'tax-return-schedule3', label: 'Schedule 3', ... });
}
```

---

## 6. Java Model Classes

| Class | Location | Fields |
|---|---|---|
| `Schedule3` | `model/output/Schedule3.java` | `nonrefundableCredits`, `otherPaymentsCredits`, `otherNonrefundableCreditItems`, `otherRefundableCreditItems` |
| `Schedule3NonrefundableCredits` | same package | 18 credit fields + `totalOtherNonrefundableCredits` (line 7) + `totalNonrefundableCredits` (line 8) |
| `Schedule3OtherPaymentsCredits` | same package | 9 payment fields + `totalOtherPaymentsRefundableCredits` (line 14) + `totalOtherPaymentsAndRefundableCredits` (line 15) |
| `TaxAndCredits` | same package | `otherCreditsSchedule3` (line 20), `totalCredits` (line 21), `taxAfterCredits` (line 22), `totalTax` (line 24) |

---

## 7. Compute Order

```
computeLine18()
    ↓
finalizeForm2441PartII()   → schedule3.nonrefundableCredits.childDependentCareCredit
    ↓
applyForeignTaxCreditToSchedule3()
applyForm8880ToSchedule3()
applyPremiumTaxCreditToSchedule3()
applyForm8863ToSchedule3()          ← must run before computeSchedule8812() (G1 pattern)
applyForm5695ToSchedule3()
applyForm8801ToSchedule3()
applyScheduleRToSchedule3()
applyForm8936ScheduleAToSchedule3()
applyForm8396ToSchedule3()
applyForm8859ToSchedule3()
applyForm8834ToSchedule3()
applyForm8911ToSchedule3()
applyForm8912ToSchedule3()
applyForm4868ToSchedule3()
computeExcessSocialSecurityTax()
applyForm2439CreditToSchedule3()
applyOtherPaymentsFormToSchedule3()
    ↓
computeSchedule8812()    → uses schedule3 credits for CLW-A (wA_4 = educationCredits)
    ↓
finalizeSchedule3Totals()   → totalNonrefundableCredits (line8), totalOtherPaymentsAndRefundableCredits (line15)
    ↓
computeLine20ThroughLine24()  → Form1040.taxAndCredits.otherCreditsSchedule3 (line20)
    ↓
computeLine31ThroughLine38()  → Form1040.payments.otherPaymentsSchedule3 (line31)
```

---

## 8. Unit Tests (`TaxReturnComputeServiceTest.java`)

| Test | What it verifies |
|---|---|
| `schedule8812_worksheetA_subtractsEducationCredits_clwaFix` | AOTC → schedule3.educationCredits → CLW-A subtraction (G1 fix) |
| `form8880WiredToSchedule3Line4` | Form 8880 → `retirementSavingsContributionsCredit` |
| `form5695ComputesPrimaryFormAndSchedule3Credits` | Form 5695 → `residentialCleanEnergyCredit` + `energyEfficientHomeImprovementCredit`; `totalNonrefundableCredits` = $7,400 |
| `form8801ComputesJointReturnCreditAndWiresSchedule3Line6b` | Form 8801 → `priorYearMinimumTaxCredit` = $900 |
| `form8801ComputesSingleFilerCreditAndWiresSchedule3Line6b` | MFS filer → `priorYearMinimumTaxCredit` = $600 |
| `form8962Line26PtcWiredToSchedule3Line9` | Form 8962 → `netPremiumTaxCredit` |
| `form8834ComputesCleanVehicleCreditAndWiresToSchedule3` | Form 8834 → `qualifiedElectricVehicleCredit` |
| `form4868AppliesExtensionPaymentToSchedule3Line10` | Form 4868 → `amountPaidWithExtension` |
| `excessSocialSecurityTaxComputedFromMultipleW2s` | 2 W-2s → `excessSocialSecurityRrtaTaxWithheld` |
| `line17G3Line10IsReducedByForeignTaxCredit` | Form 1116 → `foreignTaxCredit` set on Schedule 3 |
| `schedule3Line7TotalOtherNonrefundableCreditsIsSum6aThroughZ` | `totalOtherNonrefundableCredits` = sum(6a..6z), not just 6z; no double-count in line 8 (G6 fix) |
| `adoptionCreditNonrefundableWiredToSchedule3` | CLW-B: adoption expenses → form8839 line 17/18 → schedule3.nc.adoptionCredit (G1 fix) |
| `adoptionCreditZeroWhenPriorCreditsExhaustTax` | CLW-B creditLimit = 0 when prior credits cover all tax → adoptionCredit = 0 (G1 fix) |
| `fuelTaxCreditFlowsToSchedule3Line12` | `hasFuelTaxCredit=true, creditForFederalTaxOnFuels=500` → schedule3.op.creditForFederalTaxOnFuels = 500 (G3 fix) |
| `deferred965TaxFlowsToSchedule3Line13d` | `hasDeferred965Tax=true, deferredNet965TaxLiability=2500` → schedule3.op.deferredNet965TaxLiability = 2500 (G5 fix) |

**No unit tests** for: Form 8978 negative (6l, blocked).

---

## 9. E2E Tests (`line20-nonrefundable-credits.spec.ts`)

| Scenario | Tests |
|---|---|
| AOTC → Schedule 3 line 3 → line 20; refundable → line 29 | `schedule3.nonrefundableCredits.educationCredits = 1500`, `otherCreditsSchedule3 ≥ 1500` |
| Excess SS (2 employers) → Schedule 3 line 11 → line 31 | `excessSocialSecurityRrtaTaxWithheld = 242`, `otherPaymentsSchedule3 ≥ 242` |
| W-2 + 1099-INT withholding → lines 25a/b/d, 33 | Withholding total; refund/amount owed gate |
| Fuel tax credit manual entry → Schedule 3 line 12 → line 31 | `creditForFederalTaxOnFuels = 750` (G3 fix) |
| §965(i) deferred tax manual entry → Schedule 3 line 13d | `deferredNet965TaxLiability = 3000` (G5 fix) |

**No E2E tests** for: FTC→line 1, child care→line 2, saver's→line 4, energy→lines 5a/5b, mortgage interest→6g, adoption→6c, Form 8978→6l (blocked). These paths are covered by their own dedicated specs; no multi-credit Schedule 3 integration test exists (G7 partial).

---

## 10. Identified Gaps

| # | Description | Severity | Status |
|---|---|---|---|
| G1 | Adoption credit (line 6c) — `applyAdoptionCredit()` stub; CLW-B not implemented | MEDIUM | **Fixed 2026-04-18** — CLW-B implemented; call site moved after line 6b |
| G2 | Form 8978 negative line 14 → Schedule 3 line 6l — `amountFromForm8978Line14` never set | LOW | **BLOCKED** — requires Form 8978 implementation; documented in outstanding.md |
| G3 | Form 4136 fuel tax credit → Schedule 3 line 12 — `creditForFederalTaxOnFuels` never set | LOW | **Fixed 2026-04-18** — manual entry via `31-other-payments` |
| G4 | Line 13c net elective payment (`netElectivePaymentElectionAmount`) never set; no PDF field | LOW | Out of scope (Form 3800); no fix needed |
| G5 | Line 13d deferred 965 tax (`deferredNet965TaxLiability`) never set | LOW | **Fixed 2026-04-18** — manual entry via `31-other-payments` |
| G6 | `totalOtherNonrefundableCredits` (line 7 PDF) = line 6z only, not sum(6a..6z) | MEDIUM | **Fixed 2026-04-18** — `finalizeSchedule3Totals()` now sums 6a..6z |
| G7 | Narrow E2E coverage — 5 scenarios; no multi-credit Schedule 3 integration test | LOW | **Partial** — individual credit specs exist; see outstanding.md |
