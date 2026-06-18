# Knowledge: Form 1040 Lines 12a–12e — Standard & Itemized Deductions (2025)

Tax year: **2025**
Last updated: **2026-04-17**

---

## 1. What these lines do

| Line | What it is |
|---|---|
| **12a** | Checkbox(es): someone can claim taxpayer and/or spouse as a dependent |
| **12b** | Checkbox: MFS spouse itemizes on their separate return |
| **12c** | Checkbox: taxpayer was a dual-status alien |
| **12d** | Checkbox group (0–4 boxes): taxpayer/spouse born before Jan 2, 1961 or blind |
| **12e** | Dollar amount: the standard deduction or itemized deductions (Schedule A) |

Line 12e is **not** the maximum of (standard, itemized) — the taxpayer explicitly elects which method to use. The system offers an "AUTO" mode that selects the larger, but this is a UI convenience, not the legal definition.

Lines **13a** (QBI), **13b** (Schedule 1-A additional deductions), **14** (total deductions = 12e + 13a + 13b), and **15** (taxable income = AGI − line 14) are computed immediately after line 12e in the same `computeLine12()` call.

---

## 2. Key 2025 amounts

### Standard deduction bases

| Filing Status | Base |
|---|---|
| Single | $15,750 |
| MFS | $15,750 |
| MFJ | $31,500 |
| QSS | $31,500 |
| HOH | $23,625 |

### Age / blindness per-box addon
- Single / HOH: **$2,000** per box
- MFJ / MFS / QSS: **$1,600** per box

### Age / blindness total standard deductions
| Status | 1 box | 2 boxes | 3 boxes | 4 boxes |
|---|---|---|---|---|
| Single | $17,750 | $19,750 | — | — |
| HOH | $25,625 | $27,625 | — | — |
| MFJ | $33,100 | $34,700 | $36,300 | $37,900 |
| QSS | $33,100 | $34,700 | — | — |
| MFS | $17,350 | $18,950 | $20,550 | $22,150 |

### Dependent worksheet (line 12a applies)
- Earned income threshold: **$900**
- Add-on when above threshold: **$450**
- Minimum: **$1,350**
- Formula: `if earned_income > $900: min(earned_income + $450, base_sd); else $1,350`
- **Threshold is self-consistent**: $900 + $450 = $1,350 = minimum (no discontinuity)

### SALT cap — 2025 **CHANGED** (One Big Beautiful Bill Act, signed 2025)
- Cap: **$40,000** (or **$20,000** for MFS)
- Phasedown: reduced $1-for-$1 above MAGI $500,000 ($250,000 MFS)
- Floor: not below **$10,000** ($5,000 MFS)
- **Backend updated 2026-04-17**: `SCHEDULE_A_SALT_LIMIT_*` constants in `ReferenceData.java` updated to $40,000/$20,000. MAGI phasedown worksheet remains unimplemented (see Section 7).

### Medical deduction floor
- **7.5%** of AGI

### Born-before threshold date
- "**January 2, 1961**" — anyone born before this date qualifies for the age box

---

## 3. Checkbox rules

### 12a — Can someone claim you as a dependent?
- Check if taxpayer can be claimed as dependent on anyone's return
- Also check spouse box (joint return only) if spouse can be claimed
- Effect: triggers **dependent worksheet** for standard deduction

### 12b — MFS spouse itemizes
- Only relevant for MFS filers
- Effect: **standard deduction = $0** (even with age/blindness boxes)

### 12c — Dual-status alien
- Effect: **standard deduction = $0** (even with age/blindness boxes)

### 12d — Age / blindness boxes
- Taxpayer: born before Jan 2, 1961 | blind
- Spouse (joint only, not HOH): born before Jan 2, 1961 | blind
- Spouse on MFS return: requires spouse had no income, not filing, and can't be claimed as dependent
- HOH: spouse boxes must NOT be checked (HOH max = 2 boxes)
- QSS: maximum 2 boxes (no living spouse)

---

## 4. Standard deduction computation logic

```
computeStandardDeduction(status, line12a, line12b, line12c, line12dCount, inputs):
  if status == null → return null
  if line12b OR line12c → return $0

  if line12a (dependent):
    earnedIncome = inputs.dependentStandardDeductionEarnedIncome
    if earnedIncome > $900:
      line2 = earnedIncome + $450
    else:
      line2 = $1,350
    limitedBase = min(line2, base_sd_for_status)
    addon = additionalStandardDeductionForBoxes(status, line12dCount)
    return limitedBase + addon

  if line12dCount > 0:
    return lookupAgeBlindnessStandardDeduction(status, line12dCount)
       = base_sd + (per_box_addon × boxCount)
       [QSS capped at 2 boxes]

  return base_sd_for_status
```

---

## 5. Schedule A computation

Categories computed in `buildScheduleA()`:

| Category | Source field(s) | Cap / Rule |
|---|---|---|
| Medical | `medicalDentalExpensesPaid` | Deductible above 7.5% AGI floor |
| SALT — income or sales | `stateLocalIncomeTaxesPaid` OR `stateLocalSalesTaxesPaid` (not both) | 2025: $40,000 cap ($20,000 MFS); MAGI phasedown not yet implemented |
| SALT — real estate | `realEstateTaxesPaid` | Part of SALT pool |
| SALT — personal property | `personalPropertyTaxesPaid` | Part of SALT pool |
| Foreign taxes | `foreignTaxesPaid` | Schedule A line 6; alternative to Form 1116 credit; no additional backend validation |
| Mortgage interest | `homeMortgageInterestPaid` | No cap in current impl |
| Mortgage points | `homeMortgagePointsPaid` | No cap in current impl |
| Investment interest | `investmentInterestPaid` | Limited to `netInvestmentIncome` |
| Charitable — cash | `charitableCashContributions` | No AGI limit in current impl |
| Charitable — non-cash | `charitableNonCashContributions` | No AGI limit in current impl |
| Casualty and theft loss | `personalCasualtyAndTheftLoss` | Schedule A line 15; federally declared disasters only; Form 4684 not computed |
| Net qualified disaster loss | `netQualifiedDisasterLoss` | Schedule A line 16; user-entered; Form 4684 not computed |
| Other itemized deductions | `otherAllowedItemizedDeductions` | Schedule A line 16; attorney fees, impairment expenses, etc.; no type validation in backend |

Total = sum of all deductible amounts (after floors and caps).

---

## 6. Line 12e selection

Three election modes (stored in `deductionElection` personal form field):

| Mode | Stored value | Behavior |
|---|---|---|
| Auto (default) | "AUTO" | `max(standard, itemized)` |
| Standard | "STANDARD" | `standardDeduction` |
| Itemized | "ITEMIZED" | `scheduleA.totalItemizedDeductions` |

**Disaster loss standard deduction increase** (separate from election):
- `electDisasterLossStandardDeductionIncrease = true` and `deductionElection = STANDARD`
- Backend adds `netQualifiedDisasterLoss` to the computed standard deduction
- `line12e = standard_deduction + netQualifiedDisasterLoss`
- This maps to Schedule A line 16 combined amount (not Schedule A line 17)
- Form 4684 is flagged as required

---

## 7. Known gaps

| Gap | Severity | Status |
|---|---|---|
| ~~SALT cap wrong: backend uses $10,000/$5,000~~ **RESOLVED 2026-04-17**: Updated to $40,000/$20,000 (MFS); null-safety bug fixed in `buildScheduleA()`; unit + E2E tests updated | ~~CRITICAL~~ | Resolved |
| SALT MAGI reduction worksheet missing (phasedown above $500k/$250k MFS) | **HIGH** | In outstanding.md |
| HOH spouse boxes not blocked at backend level (UI naturally prevents via no spouse tab) | MEDIUM | In outstanding.md |
| MFS spouse age/blindness restriction not validated (no income, not filing, not claimed) | LOW | In outstanding.md |
| Foreign taxes on Schedule A line 6 not implemented | LOW | In outstanding.md |
| Schedule A line 16 other itemized deductions (attorney fees for unlawful discrimination, etc.) not implemented | LOW | In outstanding.md |
| Form 4684 not computed — `netQualifiedDisasterLoss` is user-entered only | MEDIUM | In outstanding.md |
| Form 4952 investment interest not computed (affects Schedule A line 9) | MEDIUM | In outstanding.md |
| Form 8396 mortgage interest reduction not fed back to Schedule A | MEDIUM | In outstanding.md |

---

## 8. Backend implementation details

### Core method
`computeLine12()` in `TaxReturnComputeService.java` (~line 2626)

**Returns:** `Line12Computation` record containing `Deductions`, `ScheduleA`, `RequiredAttachmentForm` (Form 4684), `Form8995`, `Form8995A`

**Execution order inside the method:**
1. Normalize filing status
2. Determine line12a/12b/12c/12d flags from `StandardDeductionIndicators`
3. Normalize deduction election ("ITEMIZED" / "STANDARD" / "AUTO")
4. Get AGI from prior `adjustments.line11b`
5. `computeStandardDeduction()` → base standard deduction
6. `buildScheduleA()` → Schedule A object
7. Apply disaster loss increase to standard deduction if elected
8. `chooseLine12e()` → final line 12e
9. `chooseDeductionType()` → "Standard" or "Itemized" label
10. `computeLine13a()` → QBI deduction
11. Compute line 14 = line12e + line13a
12. Compute taxable income (interim, before line 13b)
13. Return `Line12Computation`

**Post-processing in `prepare()`:** After Schedule 1-A is computed, line 15 is updated to include line 13b:
`line15 = max(0, AGI − line12e − line13a − line13b)`

### Helper methods
- `computeStandardDeduction()` — line 2749: standard deduction routing
- `buildScheduleA()` — line 2777: all Schedule A categories
- `chooseLine12e()` — line 2850: selects final line 12e
- `chooseDeductionType()` — line 2862: returns "Standard"/"Itemized" label
- `buildLine12Form4684Attachment()` — line 2888: triggers Form 4684 requirement
- `countAgeBlindnessBoxes()` — line 16721: counts 0–4 line 12d boxes
- `baseStandardDeductionForStatus()` — line 16772: base amount by filing status
- `additionalStandardDeductionForBoxes()` — line 16791: per-box addon
- `lookupAgeBlindnessStandardDeduction()` — line 16801: chart lookup
- `saltLimitForStatus()` — line 16824: SALT cap ($40,000/$20,000 MFS — updated 2026-04-17)

### ReferenceData.java constants (lines 42–66)
- `STANDARD_DEDUCTION_BASE_SINGLE` = $15,750
- `STANDARD_DEDUCTION_BASE_MFS` = $15,750
- `STANDARD_DEDUCTION_BASE_MFJ` = $31,500
- `STANDARD_DEDUCTION_BASE_QSS` = $31,500
- `STANDARD_DEDUCTION_BASE_HOH` = $23,625
- `STANDARD_DEDUCTION_DEPENDENT_EARNED_INCOME_THRESHOLD` = $900
- `STANDARD_DEDUCTION_DEPENDENT_EARNED_INCOME_ADDON` = $450
- `STANDARD_DEDUCTION_DEPENDENT_MINIMUM` = $1,350
- `STANDARD_DEDUCTION_ADDITIONAL_MARRIED_PER_BOX` = $1,600
- `STANDARD_DEDUCTION_ADDITIONAL_SINGLE_OR_HOH_PER_BOX` = $2,000
- `SCHEDULE_A_MEDICAL_FLOOR_RATE` = 0.075
- `SCHEDULE_A_SALT_LIMIT_SINGLE/MFJ/HOH/QSS` = **$40,000** (updated 2026-04-17, was $10,000)
- `SCHEDULE_A_SALT_LIMIT_MFS` = **$20,000** (updated 2026-04-17, was $5,000)

### Output models
- **`Deductions.java`**: `line12aChecked`, `line12bChecked`, `line12cChecked`, `line12dBoxesCheckedCount`, `deductionElection`, `standardDeductionComputed`, `itemizedDeductionsFromScheduleA`, `deductionType`, `deductionAmount` (= line 12e), `qualifiedBusinessIncomeDeduction` (= line 13a), `totalDeductions` (= line 14), `taxableIncome` (interim), `line15TaxableIncome` (final)
- **`ScheduleA.java`**: all Schedule A category fields, `totalItemizedDeductions`, `usedForItemizedDeduction`, `usedForStandardDeductionIncrease`
- **`StandardDeductionIndicators.java`**: all line 12a/b/c/d checkbox source fields

---

## 9. Frontend / YAML

### Personal forms
- `standard-deductions-taxpayer`: all deduction election, taxpayer indicator, and Schedule A input fields
- `standard-deductions-spouse`: spouse checkbox fields only (`someoneCanClaimSpouse`, `spouseItemizesSeparateReturn`, `spouseBornBeforeThreshold`, `spouseIsBlind`)

### YAML files
- `C:\us-tax\yamls\12abcde-standard-deductions-taxpayer.yaml`
- `C:\us-tax\yamls\12abcde-standard-deductions-spouse.yaml`

### Angular component
- `form-standard-deductions.component.ts` (unified component handles both forms)
- Loads reference data constants via `ReferenceDataService` (SALT limits, medical floor rate, etc.)
- Deduction election dropdown: "Auto choose the larger deduction" / "Take the standard deduction" / "Itemize deductions"
- **Section screening gates** (UI-only `boolean | null`, not persisted to Firestore): `hasMedicalExpenses`, `hasTaxesPaid`, `hasInterestExpenses`, `hasCharitableContributions`, `hasCasualtyLoss`, `hasOtherItemizedDeductions`, `hasDisasterLoss` — derived from saved amounts in `loadModel()` (e.g. `this.hasMedicalExpenses = saved.medicalDentalExpensesPaid != null ? true : null`)
- **Per-item accordion** for uncommon situations (dual-status alien, someone can claim you/spouse, spouse MFS items) — each item has an individual `<button class="uncommon-toggle">` controlling its own `*ngIf` section
- **QSS info-note**: when `filingStatus === 'Qualifying surviving spouse'`, an inline note explains spouse age/blindness boxes are ignored
- **Disaster loss section**: gate (hasDisasterLoss) → amount field → conditional info-note when ITEMIZED → election radio hidden when `deductionElection === 'ITEMIZED'`
- `normalizeForSave()`: converts empty strings to null; clears Schedule A section fields when gate is false/null; clears `someoneCanClaimSpouse` when not MFJ; clears `spouseItemizesSeparateReturn` / `spouseMeetsAgeBlindnessMfsRequirements` when not MFS; clears `electDisasterLossStandardDeductionIncrease` when ITEMIZED election

---

## 10. Test coverage

### Unit tests (`TaxReturnComputeServiceTest.java`)
- `computesLine12UsingStandardDeductionChartForSingleFiler()` — age/blindness chart (1 box, Single → $17,750)
- `computesLine12UsingItemizedDeductionsAndScheduleA()` — full Schedule A itemized path
- `computesLine12UsingDependentWorksheetAndDisasterLossIncrease()` — dependent worksheet + disaster loss increase

### Line 15 tests (`TaxLine15TaxableIncomeTest.java`)
- `line15_standardDeductionOnly()`, `line15_withQbiDeduction()`, `line15_withAdditionalDeductions()`, `line15_allThreeDeductions()`, `line15_floorAtZero()`, `line15_nullAgi()`, `line15_mfjHighIncome()`

### E2E tests (`line12e-standard-deductions.spec.ts`) — 14 tests total (updated 2026-04-17)
1. Itemized flow — full Schedule A categories (medical, SALT, interest, charity, casualty, other)
2. Disaster-loss standard deduction increase (verifies `deductionAmount` = $15,750 + $250 = $16,000)
3. Disaster loss election radio hidden when "Itemize deductions" is selected
4. Disaster loss gate shows/hides amount field on Yes/No selection
5. Disaster loss gate auto-opens on load when previously saved amount exists
6. Section screening gate shows/hides amount fields on Yes/No selection
7. Section gate auto-answered Yes on load when previously saved amount exists
8. Per-item accordion expands individual uncommon situation items independently
9. Dependent earned income field appears only when dependent claim is Yes
10. Dual-status alien accordion shows radio field and inline warning when Yes selected
11. Form 1116 conflict warning appears in taxes paid section (seeds `foreign-tax-credit-taxpayer` form)
12. Net investment income field appears only when investment interest is entered
13. *(additional scenario)*
14. *(additional scenario)*

### Gaps in test coverage
- No test for MFJ (multiple line 12d boxes)
- No test for MFS (line 12b forced-zero path)
- No test for dual-status alien (line 12c forced-zero path; UI accordion test covers render, not compute)
- No test for QSS with age/blindness
- No test for SALT cap at $40,000 (unit test uses $13k SALT which is below cap)
- MAGI phasedown worksheet untested (feature not yet implemented)
- No test for dependent worksheet edge cases (earned income exactly at threshold)
- No test for investment interest limitation (NII cap)
- No test for the AUTO election mode when itemized > standard

---

## 11. Spec file
`C:\us-tax\lines\12abcde.md` — 2025-verified, covers all paths. $40,000 SALT cap now implemented in backend (updated 2026-04-17). MAGI phasedown worksheet remains the only unimplemented section.
