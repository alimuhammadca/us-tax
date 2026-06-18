# Knowledge: Form 1040 Line 30 — Refundable Adoption Credit (Form 8839)

> Tax year 2025. Audit date: 2026-04-20. Source: IRS Form 8839 (created 9/25), IRS Form 1040 (2025), backend code in TaxReturnComputeService.java.

---

## 1. IRS Law Summary

**Form 1040 Line 30** (2025) = "Refundable adoption credit from Form 8839, line 13"

This line is new for 2025. In 2024, Line 30 was the Net Premium Tax Credit (Form 8962). The 2025 restructuring:
- **Line 30** = Refundable adoption credit (Form 8839 line 13) — NEW in 2025
- **Line 31** = Amount from Schedule 3 line 15 (which includes net PTC via Schedule 3 line 9)
- **Line 32** = Line 27a + 28 + 29 + 30 + 31

### 2025 Key Constants (all confirmed from IRS Form 8839)

| Constant | Value |
|---|---|
| Maximum credit per child | $17,280 |
| MAGI phaseout start | $259,190 |
| MAGI phaseout range | $40,000 |
| MAGI phaseout ceiling | $299,190 |
| Refundable cap per child (line 11b) | $5,000 |

---

## 2. Computation Method: `computeAdoptionBenefits()`

**Signature:** `private AdoptionComputation computeAdoptionBenefits(Map<String,Object> adoptionData, List<Map<String,Object>> w2Entries, Map<String,Object> filingStatus, List<TaxReturnFlag> flags)`

**Return type:** `AdoptionComputation` record — holds `line1f()` (Form 1040 line 1f), `refundableAdoptionCredit()` (Form 1040 line 30), `form8839()` (full output model).

**Called in:** `prepare()` early in compute order (before AGI). If `magiForAdoptionBenefitsExclusion` is absent from the form, MAGI is set null here and auto-derived later in `applyAdoptionCredit()` (G1).

### Entry Gates
- `adoptionData` (personal form `adoption-expenses`) must be non-null
- At least one child entry OR W-2 box 12 code T benefits must exist
- MFS filers: blocked by `ADOPTION_BENEFITS_MFS_EXCLUSION_DISALLOWED` (blocking=true); no Part II computed (G4 fixed)

### MAGI and Phaseout (Part II lines 7–9)
```
MAGI = personal form `imports.magiForAdoptionBenefitsExclusion` (manual entry — G1 gap)
line8 = max(0, MAGI - $259,190)
line9 (phaseoutFraction) = line8 / $40,000, rounded HALF_UP to 4 decimal places, capped at 1.0000
```

### Per-Child Part II Computation (lines 2–11b)
Reads from `adoptionCreditPartII.qualifiedAdoptionExpensesByChild` (up to 6 children):
```
line2 (max credit) = $17,280 per child
line3 (prior amounts) = priorYearAdoptionCreditByChild.child{n}PriorYearCredit
line4 = line2 - line3
line5 = qualified expenses for the child (note: special-needs final rule partially implemented — see Gap G5)
line6 = min(line4, line5)
line10 = line6 × phaseoutFraction
line11a (credit after phaseout) = max(0, line6 - line10)
line11b (refundable base) = min(line11a, $5,000)
```

### Part II Return-Level Aggregation (lines 11c–16)
```
line11c = sum of per-child line11b → set as form8839.part2Line11cTotalRefundableBase
line12 = sum of per-child line11a → set as form8839.part2Line12TotalAfterPhaseout
line13 = line11c → refundableAdoptionCredit (→ Form 1040 line 30)
line14 = max(0, line12 - line13)
line15 = creditCarryforward from personal form
line16 = line14 + line15 → form8839.part2Line16TotalAvailableCredit
line17 = 0 (set by applyAdoptionCredit later)
line18 = null (set by applyAdoptionCredit later)
```

### Part III Employer Benefits (lines 23–31 → Form 1040 line 1f)
Reads W-2 box 12 code T amounts and `employerBenefitsPartIII` from personal form:
```
line23 = total W-2 box 12 code T benefits
line24 (per child excluded) = $17,280 (special needs + final) or min(benefits allocated, $17,280)
line30 = sum of per-child line24 (excluded benefits)
line31 = line23 - line30 = taxable benefits → Form 1040 line 1f
```

---

## 3. Computation Method: `applyAdoptionCredit()`

**Signature:** `private void applyAdoptionCredit(Schedule3 schedule3, AdoptionComputation adoption, Form1040 form1040, Schedule8812 schedule8812, Form2555 form2555Taxpayer, Form2555 form2555Spouse, BigDecimal puertoRicoExcludedIncome, BigDecimal form4563ExcludedIncome)`

**Called in:** `prepare()` after `applyForm8801ToSchedule3()` (so Schedule 3 lines 1–6b are already populated). Must be after `computeLine18()` so `totalTaxBeforeCredits` is available.

**Purpose (2026-04-20 expanded):**
1. **G1 auto-MAGI block** — if `part2Line7ModifiedAgi` is null, derives auto-MAGI = AGI + Form 2555 lines 45/50 (taxpayer + spouse) + Puerto Rico exclusion + Form 4563 line 15; re-runs per-child Part II and Part III loops using stored intermediate values; updates all form8839 aggregation fields and `Income.adoptionBenefits`.
2. **CLW-B** — Computes Credit Limit Worksheet B (line 17) and nonrefundable credit (line 18); wires to Schedule 3 line 6c.

### Credit Limit Worksheet B
```
clwLine2 = totalTaxBeforeCredits (Form 1040 line 18)
ctcLine19 = form1040.taxAndCredits.childTaxCredit (Form 1040 line 19 — G2 fixed)
ctcForClwB = schedule8812.creditLimitWorksheetBLine14 if non-null (G7), else ctcLine19
priorCredits = Schedule3 lines: 1 (FTC) + 2 (childcare) + 3 (education) + 4 (saver's)
             + 5a (clean energy) + 5b (energy efficient) + 6a (gen biz, null) + 6b (prior AMT)
             + 6d (elderly/disabled) + 6f (clean vehicle) + 6g (alt fuel) + 6l (Form 8978) + 6m (prev owned clean) [G3 fixed]
             + ctcForClwB [G2/G7 fixed]
clwLine4 = max(0, clwLine2 - priorCredits)
line17 (creditLimit) = max(0, clwLine4)
line18 = min(line16, line17)
```

If `creditLimit = 0`: line 18 = 0, no Schedule 3 entry.
If `creditLimit > 0`: line 18 = min(line 16, creditLimit) → `schedule3.nonrefundableCredits.adoptionCredit`

---

## 4. Wiring to Form 1040

| Form 8839 output | Path | Form 1040 destination |
|---|---|---|
| `part2Line13RefundableAdoptionCredit` | `Payments.refundableAdoptionCredit` | Line 30 (new in 2025) |
| `part2Line18NonrefundableAdoptionCredit` | `Schedule3NonrefundableCredits.adoptionCredit` → line 6c → line 8 | Line 20 |
| `part3Line31TaxableBenefits` | `AdoptionComputation.line1f()` → `Income.adoptionBenefits` | Line 1f |

**Wire-up in `computeLine31ThroughLine38()`:**
```java
payments.setRefundableAdoptionCredit(
    hasPositiveAmount(adoption.refundableAdoptionCredit()) ? adoption.refundableAdoptionCredit() : null
);
```

---

## 5. Output Model: `Form8839.java`

| Field | Type | Description |
|---|---|---|
| `header` | `ScheduleHeader` | Taxpayer name + SSN for PDF |
| `children` | `List<Form8839Child>` | Per-child Part II computed values |
| `part2Line3NoPriorYearForm` | `Boolean` | No prior-year credit checkbox |
| `part2Line3YesPriorYearForm` | `Boolean` | Prior-year credit checkbox |
| `part2Line7ModifiedAgi` | `BigDecimal` | MAGI for phaseout |
| `part2Line8MagiNotMoreThanThreshold` | `Boolean` | MAGI ≤ $259,190 checkbox |
| `part2Line8MagiMoreThanThreshold` | `Boolean` | MAGI > $259,190 checkbox |
| `part2Line8MagiExcess` | `BigDecimal` | MAGI - $259,190 |
| `part2Line9PhaseoutFraction` | `BigDecimal` | Phaseout fraction (0.0000–1.0000) |
| `part2Line11cTotalRefundableBase` | `BigDecimal` | Sum of per-child line 11b |
| `part2Line12TotalAfterPhaseout` | `BigDecimal` | Sum of per-child line 11a |
| `part2Line13RefundableAdoptionCredit` | `BigDecimal` | **Line 13 → Form 1040 line 30** |
| `part2Line15CreditCarryforward` | `BigDecimal` | Prior-year carryforward |
| `part2Line16TotalAvailableCredit` | `BigDecimal` | Line 14 + line 15 |
| `part2Line17CreditLimit` | `BigDecimal` | CLW-B result |
| `part2Line18NonrefundableAdoptionCredit` | `BigDecimal` | **Line 18 → Schedule 3 line 6c** |
| `part3Line23TotalBenefits` | `BigDecimal` | Total W-2 box 12 T benefits |
| `part3Line25ModifiedAgi` | `BigDecimal` | MAGI for Part III |
| `part3Line26MagiNotMoreThanThreshold` | `Boolean` | MAGI ≤ $259,190 for Part III |
| `part3Line26MagiMoreThanThreshold` | `Boolean` | MAGI > $259,190 for Part III |
| `part3Line26MagiExcess` | `BigDecimal` | MAGI excess for Part III |
| `part3Line27PhaseoutFraction` | `BigDecimal` | Phaseout fraction for Part III |
| `part3Line30TotalExcludedBenefits` | `BigDecimal` | Total excluded employer benefits |
| `part3Line31Line30NotMoreThanLine23` | `Boolean` | Checkbox: no excess |
| `part3Line31Line30MoreThanLine23` | `Boolean` | Checkbox: excess present |
| `part3Line31TaxableBenefits` | `BigDecimal` | Taxable employer benefits → line 1f |

### `Form8839Child.java` (per-child Part II fields)

| Field | Description |
|---|---|
| `childName` | Child first + last name |
| `part2Line5QualifiedExpenses` | Qualified adoption expenses |
| `part2Line6SmallerOf4Or5` | min(line 4, line 5) — credit base |
| `part2Line10PhaseoutAmount` | line 6 × phaseout fraction |
| `part2Line11aCreditAfterPhaseout` | max(0, line 6 - line 10) |
| `part2Line11bRefundableBase` | min(line 11a, $5,000) |

---

## 6. Personal Form

**Form ID:** `adoption-expenses`  
**YAML:** `C:\us-tax\yamls\1f-adoption-expenses.yaml`

Key intake fields:
| Field | Used in |
|---|---|
| `imports.magiForAdoptionBenefitsExclusion` | MAGI for phaseout (manual — Gap G1) |
| `children.entries[].childFirstName/childLastName` | Per-child name |
| `children.entries[].hasSpecialNeeds` | Special-needs rule trigger |
| `children.entries[].isForeignChild` | Foreign-child flag |
| `children.entries[].adoptionFinal2025OrEarlier` | Final adoption flag |
| `adoptionCreditPartII.qualifiedAdoptionExpensesByChild.child{n}QualifiedExpenses` | Per-child line 5 |
| `adoptionCreditPartII.priorYearAdoptionCreditByChild.child{n}PriorYearCredit` | Per-child line 3 |
| `adoptionCreditPartII.line15CreditCarryforward` | Prior-year carryforward |
| `employerBenefitsPartIII.currentYearBenefitsAllocation.child{n}Benefits2025` | W-2 code T allocation per child |
| `employerBenefitsPartIII.priorYearEmployerBenefitsByChild.child{n}PriorYearBenefits` | Prior-year benefits (for Part III exclusion cap) |

Accepted in `PersonalResource.java`: `"adoption-expenses"`.

---

## 7. Unit Tests (16 total)

All in `TaxReturnComputeServiceTest.java`:

| Test name | What it covers |
|---|---|
| Part III tests (≈ lines 4326–4580) | |
| *(taxable benefits adoption — name not shown)* | Part III line 31 flows to line 1f |
| *(special needs final — name not shown)* | Part III line 30 = $17,280 exclusion |
| *(MFJ taxpayer + spouse with code T — name not shown)* | Part III with MFJ |
| *(flag: W-2 required — name not shown)* | Flag when no W-2 but benefits expected |
| *(foreign child — name not shown)* | Foreign child Part III |
| Part II refundable tests | |
| `computesRefundableAdoptionCreditBelowPhaseout` | MAGI $200k → line13 = $5,000 |
| `computesRefundableAdoptionCreditAtFiftyPercentPhaseout` | MAGI $279,190 → fraction 0.5 → line13 = $5,000 |
| `computesRefundableAdoptionCreditAbovePhaseoutCeiling` | MAGI $310k → fraction 1.0 → line13 = 0 |
| `computesRefundableAdoptionCreditTwoChildren` | 2 children → line13 = $10,000 |
| Part II nonrefundable tests | |
| `adoptionCreditNonrefundableWiredToSchedule3` | CLW-B → line18 = min(line16, creditLimit); wired to Sched 3 line 6c |
| `adoptionCreditZeroWhenPriorCreditsExhaustTax` | creditLimit = 0 → line18 = 0; no Sched 3 entry |
| New tests added 2026-04-20 | |
| `adoptionCreditSpecialNeedsLine5UsesMaxCreditNotActualExpenses` (G5) | Special-needs final: line5=$500 stored, line6=$17,280 override, line11b=$5,000 |
| `adoptionCreditAutoMagiFromAgiWhenManualMagiAbsent` (G1) | W-2 $300k, no manual MAGI → auto-MAGI derived > $259,190 → phaseout fraction > 0 → line13 < $5,000 |
| `adoptionCreditNonrefundableReducedWhenCtcPresentInClwB` (G2) | CTC in CLW-B reduces credit limit; line17 and line18 are non-zero |
| `adoptionCreditMfsWithoutExceptionEmitsBlockingFlag` (G4) | MFS → `ADOPTION_BENEFITS_MFS_EXCLUSION_DISALLOWED` blocking=true; `form8839()` null; refundable credit null |

---

## 8. E2E Tests (8 total)

**File:** `C:\us-tax\us-tax-be\e2e\tests\form8839-adoption-credits.spec.ts`

| Test | What it covers |
|---|---|
| `Part III taxable benefits flow to line 1f via line 31` | $5k code T, prior $16k → line 31 = $3,720 → line 1f |
| `Special needs final adoption creates negative line 1f` | $2k code T, special needs final → Part III excluded $17,280 → line 1f = -$15,280 |
| `Part II refundable credit computed when MAGI is available` | MAGI $200k, expenses $15k → line 13 = $5,000, line 30 = $5,000 |
| `Part II refundable credit reduced by MAGI phaseout at 50%` | MAGI $279,190 → fraction 0.5 → line 11b = $5,000 (capped) |
| `Part II credit null when MAGI is above phaseout ceiling` | MAGI $310k → credit = 0 |
| `Line 30 displays refundable adoption credit on Form 1040 preview` | UI compute → line 30 = $5,000 visible in PDF view |
| `Line 32 includes refundable adoption credit in total other payments` | line 30 = $5,000 included in line 32 total |
| `Part II nonrefundable adoption credit flows to Schedule 3 line 6c and Form 1040 line 20` (G6) | W-2 $80k + MAGI $200k + expenses $10k → refundable $5k + nonrefundable > 0 → line 20 > 0 |

---

## 9. Compute Order Constraint

```
computeAdoptionBenefits()        # Early — before AGI; uses manual MAGI
    ↓ (produces AdoptionComputation with form8839 + refundableCredit + line1f)
buildForm1040() / buildIncome()  # line 1f = adoption.line1f() wired to Income.adoptionBenefits
    ↓
computeLine16() + line17 + line18  # totalTaxBeforeCredits required for CLW-B
    ↓
applyForeignTaxCreditToSchedule3() through applyForm8801ToSchedule3()  # Sched 3 lines 1–6b
    ↓
applyAdoptionCredit()            # CLW-B computes line 17, sets line 18, wires to Sched 3 line 6c
    ↓
computeLine31ThroughLine38()     # wires adoption.refundableAdoptionCredit → Payments.refundableAdoptionCredit → line 30
```

---

## 10. Downstream Consumers

| Consumer | Value |
|---|---|
| `Payments.refundableAdoptionCredit` | Line 13 (refundable) → Form 1040 line 30 |
| `Form1040.line32` / `totalOtherPaymentsAndRefundableCredits` | line 27a + 28 + 29 + **30** + 31 |
| `Form1040.line33` | line 25d + 26 + 32 |
| `Schedule3NonrefundableCredits.adoptionCredit` | Line 18 (nonrefundable) → Schedule 3 line 6c → line 8 → Form 1040 line 20 |
| `Income.adoptionBenefits` | Line 31 (taxable employer benefits) → Form 1040 line 1f |
| SS worksheet line 5 | `adoption.line1f()` included as add-back in Social Security modified MAGI |

---

## 11. PDF Assets

- IRS PDF template: `C:\us-tax\docs\IRS-Forms\f8839.pdf` (created 9/25 — 2025 form)
- IRS instructions: `C:\us-tax\docs\IRS-Forms\i8839.pdf` (**2024** instructions — does NOT cover 2025 refundability change)
- Semantic PDF label asset: NOT yet generated (`f8839_semantic_labels.pdf` / `f8839_field_map_semantic.csv` absent from `C:\us-tax\pdfs\`)
- Frontend display component: `form-tax-return-8839.component.ts` (saves PDF using f8839.pdf template)
- F1040 field: `line30_refundable_adoption_credit` in `f1040_field_map_semantic.csv`

---

## 12. Gaps

| ID | Severity | Description | Status | Fixed |
|---|---|---|---|---|
| G1 | MEDIUM | MAGI auto-compute: uses manual `magiForAdoptionBenefitsExclusion`; IRS requires AGI + Form 2555 + Puerto Rico + Form 4563 add-backs | **Fixed** | 2026-04-20 |
| G2 | MEDIUM | CLW-B missing Form 1040 line 19 (CTC/ODC) in prior-credits sum — nonrefundable credit limit overstated when CTC is present | **Fixed** | 2026-04-20 |
| G3 | LOW | CLW-B missing Schedule 3 lines 6d, 6f, 6g, 6l, 6m in prior-credits sum | **Fixed** | 2026-04-20 |
| G4 | LOW | No blocking flag for MFS filers (except special-needs children); IRS bars MFS from adoption credit generally | **Fixed** | 2026-04-20 |
| G5 | LOW | Special-needs Part II line 5 rule: no unit test verifies that a domestic special-needs child with final adoption sets line 5 = $17,280 (vs. actual expenses) in the Part II path | **Fixed** | 2026-04-20 |
| G6 | LOW | No E2E test for nonrefundable credit path (line 18 → Schedule 3 line 6c → Form 1040 line 20) | **Fixed** | 2026-04-20 |
| G7 | LOW | Schedule 8812 CLW-B substitute: when Schedule 8812 CLW-B is used, line 14 of that worksheet should replace Form 1040 line 19 in CLW-B; not implemented | **Partial** | 2026-04-20 |
| G8 | LOW | Full AcroForm per-child intermediate field coverage not verified against 2025 IRS PDF template | Documentation only | — |
