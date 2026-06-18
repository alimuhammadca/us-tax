# Knowledge: Form 1040 Line 19 — Child Tax Credit / Credit for Other Dependents (2025)

Audit date: 2026-04-18
Sources: `C:\us-tax\lines\19.md`, `TaxReturnComputeService.java`, `Schedule8812.java`,
`Dependent.java`, `form-tax-return-schedule8812.component.ts`,
`form-ctc-actc-screening.component.ts`, `form-tax-return-1040.component.ts`,
`TaxReturnComputeServiceTest.java`, `line19-child-tax-credit.spec.ts`,
`line28-actc-schedule8812.spec.ts`, `f1040_field_mapping_semantic.csv`,
IRS 2025 Form 1040 / 1040-SR, IRS 2025 Schedule 8812, `C:\us-tax\docs\books\i1040gi_2025.txt`,
`C:\us-tax\lines\19.md`.

---

## 1. Line Identity

```
Form1040.line19 = Schedule8812.line14     (nonrefundable CTC + ODC)
Form1040.line28 = Schedule8812.line27     (refundable ACTC)
```

Both come from a single `computeSchedule8812()` call. Line 19 is a nonrefundable credit (capped at available tax); line 28 is refundable.

---

## 2. 2025 Constants

| Constant | Value |
|---|---|
| CTC per qualifying child | $2,200 |
| ODC per qualifying dependent | $500 |
| ACTC max per qualifying child | $1,700 |
| Phase-out threshold — MFJ | $400,000 |
| Phase-out threshold — all others | $200,000 |
| Phase-out rate | $50 per $1,000 (or part of $1,000) over threshold |
| ACTC earned-income floor | $2,500 |
| ACTC rate | 15% |
| Part II-B threshold (line16b) | $5,100 (= 3 × $1,700) |

---

## 3. Backend Implementation

### Method: `computeSchedule8812()`
Location: `TaxReturnComputeService.java` ~line 17802

**Signature:**
```java
private Schedule8812 computeSchedule8812(
    Form1040 form1040,
    Map<String, Object> filingStatus,
    List<DependentRecord> dependents,
    Schedule3 schedule3,
    Schedule2 schedule2,
    List<Map<String, Object>> w2Entries,
    Form2555 form2555Taxpayer,
    Form2555 form2555Spouse,
    Map<String, Object> ctcScreening,
    Form8862 form8862,
    List<TaxReturnFlag> flags)
```

**Call site in `prepare()`** — ~line 853, after `computeForm8880()` and before `computeLine31ThroughLine38()`.

**Wire-up (in `prepare()`):**
```java
taxAndCredits.setChildTaxCredit(schedule8812.getLine14CtcOdcCredit());   // line 19
payments.setAdditionalChildTaxCredit(schedule8812.getLine27ActcCredit()); // line 28
```

### Part I: Modified AGI
```java
agi = form1040.adjustments.line11bAmountFromLine11aAdjustedGrossIncome
line2b = form2555Taxpayer.foreignEarnedIncomeExclusion + form2555Taxpayer.housingExclusionAmount
       + form2555Spouse.foreignEarnedIncomeExclusion  + form2555Spouse.housingExclusionAmount
magi = agi + line2b
result.setLine3Magi(magi)
```

### Part I: Dependent counting
```java
for each DependentRecord d:
    if d.qualifiesForCTC():   numCtcChildren++
    else if d.qualifiesForODC(): numOdcDependents++
```

### Part I: Tentative credit, phase-out, CLW-A, line 14
```java
line5 = numCtcChildren * 2200
line7 = numOdcDependents * 500
line8 = line5 + line7

// Phase-out
threshold = isMfj ? 400000 : 200000
excess = max(0, magi - threshold)
line10 = ceil(excess / 1000) * 1000    // NOTE: stores rounded excess, not raw excess
line11 = line10 * 0.05
line12 = max(0, line8 - line11)

// Credit Limit Worksheet A
wA1 = totalTaxBeforeCredits
wA3 = foreignTaxCredit + childDependentCareCredit + educationCredits
    + retirementSavingsContributionsCredit + elderlyDisabledCredit
worksheetA = max(0, wA1 - wA3)
result.setLine13CreditLimitWorksheetA(worksheetA)

// Line 14
line14 = min(line12, worksheetA)
result.setLine14CtcOdcCredit(line14)
```

### electsNoActc gate (no IRS basis — see Gap G4)
```java
if (ctcScreening.electsNoActc == true):
    result.electsNoActc = true
    line27 = 0
    return
```

### Part II-A: ACTC preconditions
- Return `line27 = 0` if `numCtcChildren == 0`
- Return `line27 = 0` if `form2555Taxpayer != null || form2555Spouse != null`
- Return `line27 = 0` if `line16a == 0` (where `line16a = max(0, line12 - line14)`)

### Part II-A: Lines 16–20
```java
line16a = max(0, line12 - line14)
line16b = numCtcChildren * 1700
line17  = min(line16a, line16b)

// Earned income for ACTC (line 18a)
line18a = income.totalWages (line 1z)
        + income.nontaxableCombatPayElection (line 1i, when elected)
result.setLine18aEarnedIncome(line18a)

if line18a > 2500:
    line19 = line18a - 2500
    line20 = line19 * 0.15
else:
    line19 = 0
    line20 = 0
```

### Part II-A routing and Part II-B
```java
if line16b < 5100:
    line27 = min(line17, line20)    // fewer than 3 qualifying children
else if line20 >= line17:
    line27 = line17                 // 3+ children but earned-income path covers it
else:
    // Part II-B: SS withholding path
    line21 = sum of W-2 box 4 (socialSecurityTaxWithheldAmount) across all w2Entries
    line22 = schedule2.uncollectedSocialSecurityMedicareTaxOnWages (line 5)
           + schedule2.uncollectedSocialSecurityMedicareRrtaTax (line 6)
           + schedule2.additionalMedicareTax (line 13)
    line23 = line21 + line22
    line24 = payments.earnedIncomeCredit (EIC, line 27a)
           + payments.americanOpportunityCredit (refundable AOTC, line 29)
    // Fixed 2026-04-18 (G1): EIC and refundable AOTC pre-set before computeSchedule8812() runs.
    line25 = line23 + line24
    line26 = max(line20, line25)
    line27 = min(line17, line26)
```

---

## 4. Output Model

**`Schedule8812.java`** fields:
- `line3Magi`, `line4NumQualifyingChildren`, `line5CtcPotential`
- `line6NumOtherDependents`, `line7OdcPotential`, `line8TotalPotential`
- `line10PhaseOutExcess` (rounded up to next $1,000 — see Gap G5)
- `line11PhaseOutReduction`, `line12CreditAfterPhaseOut`
- `line13CreditLimitWorksheetA`, `line14CtcOdcCredit`
- `line16aExcessCreditOverTax`, `line16bActcCeiling`, `line17ActcPotential`
- `line18aEarnedIncome`, `line19EarnedIncomeOverFloor`, `line20EarnedIncomeActc`
- `line21WithheldPayrollTaxes`, `line22OtherTaxes`, `line23TaxesTotal`
- `line24RefundableCredits`, `line25ExcessPayroll`, `line26AlternativeActcBase`
- `electsNoActc` (no IRS basis — see Gap G4)
- `line27ActcCredit`

**`TaxAndCredits.java`** — `childTaxCredit: BigDecimal` (Form 1040 line 19)

**`Payments.java`** — `additionalChildTaxCredit: BigDecimal` (Form 1040 line 28)

**`Dependent.java`** — `childTaxCreditEligible: Boolean`, `otherDependentCreditEligible: Boolean`
(set in `buildDependents()` from `DependentRecord.qualifiesForCTC()` / `.qualifiesForODC()`)

---

## 5. Frontend Implementation

### Tax Return display (`form-tax-return-schedule8812.component.ts`)
- Uses `PdfReadonlyPreviewComponent` with `formId="f1040s8"`, `pageCount=2`
- Interface: `Schedule8812View` — mirrors all Schedule 8812 output fields
- PDF field mapping: Part I lines 3-14 → `f1_3[0]`…`f1_14[0]`; Part II-A lines 16a-19 → `f1_15[0]`…`f1_19[0]`; page 2 lines 20/21/27 → `f2_1[0]`…`f2_3[0]`

### Opt-out form (`form-ctc-actc-screening.component.ts`)
- Saves `{ electsNoActc: boolean }` to `ctc-actc-screening-taxpayer` form
- Has checkbox "I elect NOT to claim the Additional Child Tax Credit"
- No IRS basis for 2025 (see Gap G4)

### Form 1040 PDF fields (in `form-tax-return-1040.component.ts`)
```typescript
values['line19_child_tax_credit_or_other_dependents_credit'] =
    formatAmount(form.taxAndCredits?.childTaxCredit);
values['line28_additional_child_tax_credit'] =
    formatAmount(form.payments?.additionalChildTaxCredit);
values['unmapped_c2_14_0'] =
    computation?.schedule8812?.electsNoActc === true;
values[`dependent${index}_child_tax_credit`] =
    dependent.childTaxCreditEligible === true;
values[`dependent${index}_credit_for_other_dependents`] =
    dependent.otherDependentCreditEligible === true;
```

---

## 6. Compute Order

```
1. computeLine18()    → TaxAndCredits.totalTaxBeforeCredits  (line 18)
         ↓
2. computeForm2441()  → Schedule3.childDependentCareCredit   (wA_3 for CLW-A)
         ↓
3. computeForm1116()  → Schedule3.foreignTaxCredit           (wA_2 for CLW-A)
         ↓
4. applyForeignTaxCreditToSchedule3()
         ↓
5. computeForm8863()  → Schedule3.educationCredits           (wA_4 for CLW-A)
         ↓
6. computeForm8880()  → Schedule3.retirementSavingsContributionsCredit (wA_5 for CLW-A)
         ↓
7. computeSchedule8812()  → Schedule8812.line14, line27
         ├── TaxAndCredits.childTaxCredit       (line 19)
         └── Payments.additionalChildTaxCredit   (line 28)
         ↓
8. computeLine31ThroughLine38()  → EIC (line 27a), refundable AOTC (line 29) [idempotent re-set]
    // G1 fixed 2026-04-18: EIC + AOTC pre-set at step 7 via idempotent pattern before Schedule 8812.
```

---

## 7. Downstream Consumers of Lines 19 and 28

| Consumer | Field | Effect |
|---|---|---|
| Line 21 | `TaxAndCredits.totalCredits` | `line21 = line19 + line20 (otherCreditsSchedule3)` |
| Line 22 | `computeLine20ThroughLine24()` | `line22 = max(0, line18 - line21)` |
| Line 33 | `computeLine31ThroughLine38()` | `line33 = line25d + line26 + line32` (line 28 in line 32 subtotal) |
| Form 8812 Part II-B line 24 | `paymentsFor8812.earnedIncomeCredit` | EIC + refundable AOTC — **fixed 2026-04-18** (G1) |

---

## 8. Test Inventory

### Unit tests (`TaxReturnComputeServiceTest.java`)

| Test | Scenario |
|---|---|
| `schedule8812_basicCtc_twoChildren_sufficientTax` | 2 CTC children, $80k wages → line14 = $4,400, line19 wired |
| `schedule8812_odcOnly_noCtcChildren` | 1 ODC dependent → line8 = $500, ACTC = 0 |
| `schedule8812_mixedCtcAndOdc` | 1 CTC + 1 ODC → line8 = $2,700, ACTC ceiling ≤ $1,700 |
| `schedule8812_fullPhaseOut_mfjHighMagi` | MFJ $500k → line14 = 0, line27 = 0 |
| `schedule8812_partialPhaseOut_single` | Single $210k → line11 = $500, line12 = $3,900 |
| `schedule8812_worksheetACapsCredit` | Low wages → line14 capped at CLW-A; ACTC still available |
| `schedule8812_actcEarnedIncomeBelowFloor` | $2,000 wages → line20 = 0, ACTC = 0 |
| `schedule8812_actcEarnedIncomeAboveFloor` | $20k wages → line20 = $2,625; line28 wired |
| `schedule8812_actcEarnedIncomeIncludesCombatPay` | W-2 $1,800 + code Q $1,000 → line18a = $2,800 |
| `schedule8812_actcEarnedIncomeWagesAloneAtFloor_combatPayUnblocks` | Wages at $2,500; combat pay unblocks ACTC |
| `schedule8812_form2555_blocksActc` | Form 2555 filer → ACTC = 0; CTC may still apply |
| `schedule8812_partIIB_noSsWithholding_usesEarnedIncomeMethod` | 3 children, no SS withheld → Part II-B populated; line27 = line20 |
| `schedule8812_noDependents_allZero` | No dependents → line14 = 0, line27 = 0 |
| `schedule8812_worksheetA_subtractsForeignTaxCredit` | FTC reduces CLW-A → line14 capped lower |
| `schedule8812_worksheetA_subtractsForm8880SavingsCredit` | Form 8880 reduces CLW-A → line14 ≤ CLW-A |
| `schedule8812_electsNoActc_zeroesLine27` | electsNoActc=true → line27 = 0, flag set |
| `schedule8812_electsNoActc_false_doesNotBlockActc` | electsNoActc=false → ACTC computed normally |
| `schedule8812_partIIB_ssWithholdingExceedsEarnedIncomeMethod` | 3 children, $310 SS withheld — Part II-B lines populated |

Total: **≥ 18 unit tests**

### E2E tests (`line19-child-tax-credit.spec.ts` — 5 tests)

| Test | Scenario |
|---|---|
| CTC — basic eligibility | Single, 1 CTC child, $60k → `childTaxCredit > 0 && ≤ 2200` |
| ODC — credit for other dependents | Single, 1 ODC, $60k → `childTaxCredit > 0 && ≤ 500` |
| No dependents | No dependents → `childTaxCredit = 0` |
| ACTC — above floor | Single, 1 CTC child, $20k → `line18a=20000`, `line20=2625`, ACTC > 0 |
| Phase-out — MFJ high MAGI | MFJ $450k → line14 = 0, line27 = 0 |

### E2E tests (`line28-actc-schedule8812.spec.ts` — 4 tests)

| Test | Scenario |
|---|---|
| electsNoActc opt-out | electsNoActc=true → line27 = 0, line28 = 0 |
| electsNoActc=false | electsNoActc=false → ACTC positive, line28 > 0 |
| CLW-A subtracts Form 8880 | Saver's credit → CLW-A < line18, line14 ≤ CLW-A |
| Part II-B — SS withholding | 3 children, $6,200 SS withheld → line21=6200, line27 > line20 |

---

## 9. IRS 2025 Verification

**CTC amount**: $2,200/child for 2025 (increased from $2,000). ✓  
**ODC amount**: $500/qualifying dependent. ✓  
**ACTC max**: $1,700/qualifying child for 2025 (increased from $1,600). ✓  
**Phase-out**: $400k MFJ / $200k others; QSS does NOT use the joint threshold. ✓  
**ACTC floor**: $2,500 earned income. ✓  
**ACTC rate**: 15%. ✓  
**Schedule 8812 line 15**: Reserved for future use in 2025. Not an opt-out checkbox.  
**2025 SSN rule**: New — joint return only one spouse needs valid SSN; single filers need valid SSN. Delegated to intake dependent flags.  
**Form 2555**: Blocks ACTC (not CTC/ODC). ✓  

Cross-checked against:
- `C:\us-tax\docs\books\i1040gi_2025.txt` — Schedule 8812 ACTC increase confirmed
- `C:\us-tax\lines\19.md` — spec accurate for 2025

---

## 10. Identified Gaps

| # | Description | Severity | Status |
|---|---|---|---|
| G1 | **Part II-B line 24 ordering bug**: `computeSchedule8812()` ran before `computeLine31ThroughLine38()`, so EIC and refundable AOTC were 0 when line 24 was computed. | HIGH | **Fixed 2026-04-18** — `computeForm8863()` moved before `computeSchedule8812()`; EIC + refundable AOTC pre-set via idempotent pattern. 2 new unit tests. 507/507 passing. |
| G2 | **Schedule 8812 sidebar always visible**: `tax-return-schedule8812` was in `taxReturnBaseItems` (always shown) rather than conditionally shown. | LOW | **Fixed** — `shell.component.ts` conditionally pushes `tax-return-schedule8812` only when `line14 > 0 \|\| line27 > 0`. Confirmed 2026-04-18. |
| G3 | **PDF export items (stale in outstanding.md)**: All three items (line28 amount, opt-out checkbox, per-dependent CTC/ODC checkboxes) are implemented in `form-tax-return-1040.component.ts`. | — | **Closed** — already implemented; outstanding.md entry was stale. |
| G4 | **`electsNoActc` has no IRS basis for 2025**: The 2025 Schedule 8812 has no opt-out provision for ACTC. Backend and frontend both expose `electsNoActc` as a user-facing opt-out. | LOW | **Closed as accepted design decision** (2026-04-18) — conservative opt-out retained; user forfeits entitlement, no compliance risk. documented in outstanding.md. |
| G5 | **`line10PhaseOutExcess` stores rounded excess**: Backend stored `ceil(excess/1000)*1000` instead of raw excess. Only PDF display of line 10 was affected; computations were correct. | LOW | **Fixed 2026-04-18** — Backend now stores raw excess in `line10PhaseOutExcess`. Unit test `schedule8812_line10_storesRawExcess_g5Fix` verifies. |
| G6 | **CLW-A missing Schedule 3 credits for unimplemented forms**: Lines 5b (Form 8396 mortgage interest), 6f (Form 5695 Part I clean energy), and 6m not subtracted in CLW-A. CLW-A is correct for current in-scope forms. | LOW | **Open — deferred by design**. Must be updated when Form 8396, Form 5695 Part I, and other forms are implemented. |

---

## 11. Out of Scope

- **Puerto Rico exclusion (line 2a)**: `form1040.puertoRicoExcludedIncomeForSchedule8812` — out of scope
- **Form 4563 line 2c**: Out of scope
- **Earned income worksheet edge cases**: Self-employment, treaty-excluded income
- **Nontaxable combat pay tracking (line 18b as separate field)**: Tracked inside line18a as elected; line18b field not separately stored
- **Full 2025 SSN rule enforcement**: Delegated to dependent intake flags
- **Worksheet B**: Required when Form 8396/8839/5695 Part I/8859 credits claimed; CLW-B override available via manual field, but auto-computation deferred (see Form 8859 section in outstanding.md)
- **Part II-B line 22 Schedule 1 line 15 (SE tax)**: SE out of scope
