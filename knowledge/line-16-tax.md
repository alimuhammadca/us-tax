---
name: knowledge_line16
description: Comprehensive implementation knowledge for Form 1040 line 16 (Tax) — decision tree, computation methods, backend wiring, test inventory, PDF fields, and identified gaps
type: project
---

# Knowledge: Form 1040 Line 16 — Tax (2025)

## 1. Formula

```
Form1040.line16 =
    tax_on_taxable_income      (regular_tax via decision tree)
  + Form8814_tax_if_any        (box 1)
  + Form4972_tax_if_any        (box 2)
  + box3_writeins_if_any       (box 3: ECR only; 962/1291TAX/Form8978/965INC deferred)
```

Floored at zero implicitly (all components are non-negative).

## 2. Decision Tree (regular_tax)

First matching condition wins:

```
1. line15 ≤ 0              → regularTax = 0        (method = ZERO)
2. Form2555 filed           → FEITW                 (method = FOREIGN_EARNED_INCOME)
3. Form8615 applies (kiddie)→ childFinalTaxLine18    (method = FORM_8615)
4. ScheduleDTaxWksht req'd  → ScheduleDTaxWorksheet (method = SCHEDULE_D_TAX_WORKSHEET)
5. QDCG req'd               → QDCGWorksheet         (method = QDCG)
6. line15 < $100,000        → bracket formula        (method = TAX_TABLE)
7. line15 ≥ $100,000        → bracket formula        (method = TAX_COMPUTATION_WORKSHEET)
```

The Tax Table and Tax Computation Worksheet use the same bracket formulas (`computeTaxBracket()`) — the method label differs based on the $100k threshold.

## 3. Backend Implementation

### Primary method

`computeLine16()` in `TaxReturnComputeService.java` (~line 1300)

Called from `prepare()` at ~line 811:
```java
computeLine16(form1040, filingStatus, scheduleD, form8814List, form4972Taxpayer, form4972Spouse,
    form2555Taxpayer, form2555Spouse, kiddieIncomeTaxpayer, line16TaxTaxpayer, uid);
```

Must run **after** line 15 is finalized, and **before** line 17 (Form 6251 AMT) since line 18 depends on both.

### Step-by-step logic

**Step 1 — Regular tax via decision tree**

Gate: if `line15 == null`, method returns immediately (no compute).

Branch 1 (ZERO): `line15.compareTo(ZERO) <= 0` → `regularTax = ZERO`

Branch 2 (FOREIGN_EARNED_INCOME): `form2555Taxpayer != null || form2555Spouse != null`
→ calls `computeForeignEarnedIncomeTaxWorksheet(line15, form2555Taxpayer, form2555Spouse, statusStr)`

Branch 3 (FORM_8615): `kiddieIncomeTaxpayer.hasKiddieTaxUnearnedIncome == true`
→ reads `kiddieIncomeTaxpayer.childFinalTaxLine18`; falls back to bracket if null (with WARN log)

Branch 4 (SCHEDULE_D_TAX_WORKSHEET): `isScheduleDTaxWorksheetRequired(scheduleD)`
→ calls `computeScheduleDTaxWorksheet(line15, statusStr, scheduleD, qualDiv, line7a)`

Branch 5 (QDCG): `isQDCGWorksheetRequired(form1040, scheduleD)`
→ calls `computeQDCGWorksheet(line15, statusStr, qualDiv, scheduleD, line7a, line7bScheduleDNotRequired)`

Branch 6/7 (TAX_TABLE / TAX_COMPUTATION_WORKSHEET):
→ calls `computeTaxBracket(line15, statusStr)`; method label set by whether line15 < 100000

**Step 2 — Box 1 (Form 8814)**
Sums `form8814.getLine15ExtraTax()` across all child forms in `form8814List`.

**Step 3 — Box 2 (Form 4972)**
Sums `form4972Taxpayer.getLine30Total()` + `form4972Spouse.getLine30Total()`.

**Step 4 — Box 3 (ECR only)**
Reads `line16TaxTaxpayer.hasEcrRecapture` (boolean) + `line16TaxTaxpayer.ecrAmount`.
Only applied when both are set and amount > 0.
Sets `box3Code = "ECR"`.

**Step 5 — Total**
`line16Total = regularTax + form8814AddonTax + form4972AddonTax + ecrAddonTax`

**Persist on TaxAndCredits:**
- `tax` = line16Total
- `regularTax` = regularTax
- `computationMethod` = string label
- `box1Form8814Tax`, `box1Checked`
- `box2Form4972Tax`, `box2Checked`
- `ecrBox3Tax`, `box3Checked`, `box3Code`

### isScheduleDTaxWorksheetRequired() (~line 1442)
Required when:
- Schedule D line 18 (28% rate gain) > 0 OR line 19 (§1250 gain) > 0
- AND Schedule D line 15 > 0 AND line 16 > 0

### isQDCGWorksheetRequired() (~line 1467)
Required when (not using Schedule D worksheet) AND any of:
- qualified dividends > 0
- capital gain distributions on line 7a without Schedule D
- Schedule D filed with both lines 15 and 16 positive

### computeTaxBracket() (~line 1514)
Full bracket table covering all ranges from $0 (supports both Tax Table and TCW paths).
2025 bracket cutoffs:
- Single: 10%@0–11925, 12%@11925–48475, 22%@48475–103350, 24%@103350–197300, 32%@197300–250525, 35%@250525–626350, 37%@626350+
- MFJ/QSS: 10%@0–23850, 12%@23850–96950, 22%@96950–206700, 24%@206700–394600, 32%@394600–501050, 35%@501050–751600, 37%@751600+
- MFS: same as Single through 250525, then 35%@250525–375800, 37%@375800+
- HOH: 10%@0–17000, 12%@17000–64850, 22%@64850–103350, 24%@103350–197300, 32%@197300–250500, 35%@250500–626350, 37%@626350+

### computeQDCGWorksheet() (~line 1580)
2025 QDCG thresholds:
- 0% ceiling: Single $48,350 / MFJ+QSS $96,700 / MFS $48,350 / HOH $64,750
- 20% floor: Single $533,400 / MFJ+QSS $600,050 / MFS $300,025 / HOH $566,700

Algorithm:
1. Determine `netLtcg` (min of SchedD lines 15 and 16 if both positive, or line7a if no SchedD)
2. `preferentialIncome = qualDiv + netLtcg` (capped at taxableIncome)
3. `ordinaryIncome = taxableIncome - preferentialIncome`
4. Calculate portion at 0%, 15%, 20% based on where income falls relative to thresholds
5. `total = computeTaxBracket(ordinaryIncome) + 0.15×fifteenPortion + 0.20×twentyPortion`

### computeScheduleDTaxWorksheet() (~line 1688)
Handles 28%-rate gains (collectibles, §1202) and unrecaptured §1250 gains (cap 25%).
Simplified relative to IRS worksheet — treats special gains as subsets of netLtcg.

### computeForeignEarnedIncomeTaxWorksheet() (~line 1780)
Lines A–F (using internal variable names C, D, E, F):
```
lineC = line15 (taxable income) + totalExclusion (Form2555 lines 45+50 both taxpayer and spouse)
lineD = computeScheduleDTaxWorksheet(lineC, ...)   ← if SchedD line 18/19 > 0
      | computeQDCGWorksheet(lineC, ...)            ← if qualDiv > 0 or LTCG present
      | computeTaxBracket(lineC, filingStatus)      ← otherwise (ordinary income only)
lineE = computeTaxBracket(totalExclusion, filingStatus)   ← always ordinary bracket
lineF = max(0, lineD - lineE)
```
Fallback: if totalExclusion = 0, returns `computeTaxBracket(taxableIncome)`.

Accepts `Form1040` and `ScheduleD` parameters (added 2026-04-18 — G2 fix).
**Gap G3**: Ignores line 2b (excluded-income disallowed deductions) — assumes line2b = 0. Deferred.

## 4. Output Model — TaxAndCredits.java

| Field | Type | Description |
|---|---|---|
| `tax` | BigDecimal | Line 16 total (= regularTax + box1 + box2 + box3) |
| `regularTax` | BigDecimal | Tax on taxable income only |
| `computationMethod` | String | ZERO / FOREIGN_EARNED_INCOME / FORM_8615 / SCHEDULE_D_TAX_WORKSHEET / QDCG / TAX_TABLE / TAX_COMPUTATION_WORKSHEET |
| `box1Form8814Tax` | BigDecimal | Form 8814 add-on (null if zero) |
| `box1Checked` | Boolean | Box 1 checkbox state |
| `box2Form4972Tax` | BigDecimal | Form 4972 add-on (null if zero) |
| `box2Checked` | Boolean | Box 2 checkbox state |
| `ecrBox3Tax` | BigDecimal | ECR add-on (null if zero) |
| `box3Checked` | Boolean | Box 3 checkbox state |
| `box3Code` | String | "ECR" when box 3 has ECR |
| `alternativeMinimumTax` | BigDecimal | Line 17 (Schedule 2 line 3 = Form 6251 line 11 + Form 8962 line 29) |
| `additionalTaxSchedule2` | BigDecimal | Schedule 2 additional taxes |
| `totalTaxBeforeCredits` | BigDecimal | Line 18 = line 16 + line 17 |
| `childTaxCredit` | BigDecimal | Line 19 |
| `otherCreditsSchedule3` | BigDecimal | Line 20 (Schedule 3 line 8) |
| `totalCredits` | BigDecimal | Line 21 |
| `taxAfterCredits` | BigDecimal | Line 22 |
| `otherTaxes` | BigDecimal | Line 23 |
| `totalTax` | BigDecimal | Line 24 |

## 5. Personal Form

**Form ID**: `16-tax-taxpayer`

**Fields**:
- `hasEcrRecapture` (boolean) — ECR screening gate
- `ecrAmount` (decimal) — ECR dollar amount

Saved to Firestore at `users/{uid}/16-tax-taxpayer`.

**Frontend component**: `form-line16-tax.component.ts`
- Renders only the ECR section
- Out-of-scope notice panel for 962, 1291TAX, Form 8978, 965INC

**Shell wiring**: Deductions sidebar → "Line 16 tax items" (`data-form-id="16-tax-taxpayer"`)

## 6. Frontend Interface

`form-tax-return-1040.component.ts` `taxAndCredits` interface (complete as of 2026-04-18):
- `tax`, `regularTax`, `computationMethod`
- `box1Form8814Tax`, `box1Checked`
- `box2Form4972Tax`, `box2Checked`
- `ecrBox3Tax`, `box3Checked`, `box3Code`
- `additionalTaxSchedule2`, `totalTaxBeforeCredits`, `childTaxCredit`, `otherCreditsSchedule3`, `totalCredits`, `taxAfterCredits`, `otherTaxes`, `totalTax`

G4 fixed 2026-04-18 — all 9 breakdown fields added to the interface.

## 7. PDF Field Map

From `f1040_field_mapping_semantic.csv` (page 2):

| CSV key | PDF field | Notes |
|---|---|---|
| `line16_check_form8814` | `c2_9` | CheckBox — box 1 |
| `line16_check_form4972` | `c2_10` | CheckBox — box 2 |
| `line16_check_other_form` | `c2_11` | CheckBox — box 3 |
| `line16_other_form_number` | `f2_07` | Text — box 3 code ("ECR", etc.) |
| `line16_tax` | `f2_08` | Text — total tax amount |

**Current PDF mapping** (`form-tax-return-1040.component.ts`) — complete as of 2026-04-18:
- `values['line16_check_form8814'] = form.taxAndCredits?.box1Checked === true` ✓
- `values['line16_check_form4972'] = form.taxAndCredits?.box2Checked === true` ✓
- `values['line16_check_other_form'] = form.taxAndCredits?.box3Checked === true` ✓
- `values['line16_other_form_number'] = form.taxAndCredits?.box3Code ?? ''` ✓
- `values['line16_tax'] = formatAmount(form.taxAndCredits?.tax)` ✓

G5 fixed 2026-04-18 — all 5 PDF fields now filled.

## 8. Test Inventory

### Unit Tests (TaxReturnComputeServiceTest.java)

Line 16 direct tests (added 2026-04-18):
- `line16FeitwUsesQdcgWorksheetWhenQualifiedDividendsPresent` — Single, $100k wages + $15k qualDiv + $60k Form 2555 exclusion → FEITW+QDCG = $22,803 (vs $24,153 without fix)
- `line16FeitwOrdinaryOnlyStillUsesOrdinayBracket` — Single, $100k wages + $60k exclusion, no divs → bracket FEITW = $19,353

Line 16 tested indirectly in line 18 tests:
- `line18TotalTaxLine16OnlyNoAmt` — wages, single, line18 = line16 + 0 AMT
- `line18TotalTaxLine16PlusLine17` — wages + PAB interest → AMT > 0, line18 = line16 + line17

### E2E Tests (line16-tax.spec.ts) — 9 tests as of 2026-04-18

1. `no taxable income: tax is null or zero` — baseline
2. `Single filer W-2 $50,000: line16 uses Tax Table bracket` — TAX_TABLE path
3. `ECR add-on: line16 = regularTax + ecrAmount` — box 3 ECR path
4. `hasEcrRecapture false: no ECR add-on` — no ECR
5. `qualified dividends: computationMethod is QDCG` — QDCG path
6. `16-tax-taxpayer form saves and loads correctly` — form round-trip
7. `Single filer W-2 $150,000: uses TAX_COMPUTATION_WORKSHEET` — TCW path *(added 2026-04-18)*
8. `Form 2555 filer: computationMethod is FOREIGN_EARNED_INCOME` — FEITW path *(added 2026-04-18)*
9. `Form 4972 Part II add-on: box2Checked and line16 > regularTax` — Box 2 *(added 2026-04-18)*

**Still no tests for:**
- SCHEDULE_D_TAX_WORKSHEET path (seeding 28%-rate/§1250 gain is complex — no statement type)
- Box 1 (Form 8814 add-on) — covered indirectly in form8814 spec
- FORM_8615 path as explicit line 16 test

## 9. Compute Order

```
line15 finalized
    → computeLine16()    (regular_tax + box1 + box2 + box3)
    → computeLine17()    (Form 6251 AMT via computeAmt())
    → line18 = line16 + line17
    → credits (lines 19–22)
    → other taxes (line 23)
    → total tax (line 24)
```

Form 1116 (foreign tax credit) must run **after** line 16 and line 17 to use the correct regular tax for the limitation computation.

## 10. Downstream Consumers

| Consumer | How it uses line 16 |
|---|---|
| Form 1040 line 18 | `totalTaxBeforeCredits = tax + alternativeMinimumTax` |
| Form 1116 | Uses `tax` (line 16) as the basis for the limitation computation |
| Form 6251 AMT | Reads `tax` to determine if AMT applies |
| Form 8962 Credit Limit Worksheet | Uses `totalTaxBeforeCredits` (line 18) for credit ceiling |
| Form 8880 Credit Limit Worksheet | Same |
| Form 8863 Credit Limit Worksheet | Same |

## 11. Gaps

### G1 — lines/16.md spec error: MFS QDCG 20% threshold
**Severity:** LOW
**Description:** Spec showed $300,000 for MFS QDCG 20% threshold. Correct 2025 IRS value is $300,025 (half of MFJ $600,050 per Rev. Proc. 2024-40 §3.09). Backend already uses $300,025. Spec was corrected 2026-04-18.
**Status:** Fixed in spec (lines/16.md). Backend unchanged (was already correct).

### G2 — FEITW does not use QDCG/Schedule D for lineD
**Severity:** MEDIUM
**Description:** `computeForeignEarnedIncomeTaxWorksheet()` always computed lineD using `computeTaxBracket()` (ordinary rates only). Per IRS instructions, if the filer also has qualified dividends or capital gains, lineD must use the QDCG worksheet or Schedule D Tax Worksheet. Overstated tax for Form 2555 filers with qualified dividends/LTCG.
**Status:** **Fixed 2026-04-18.** Method now accepts `Form1040` and `ScheduleD`; lineD routes through `isScheduleDTaxWorksheetRequired`/`isQDCGWorksheetRequired` same as main decision tree. 2 unit tests added.

### G3 — FEITW ignores line 2b (excluded-income disallowed deductions)
**Severity:** LOW
**Description:** FEITW line 2b reduces the exclusion (line 2c = max(0, line 2a − line 2b)). Current implementation omits line 2b and uses the full exclusion. For most filers, line 2b = 0, so impact is minimal.
**Status:** **Deferred.** Housing deduction (main source of line 2b) is out of scope.

### G4 — Frontend taxAndCredits interface missing line 16 breakdown fields
**Severity:** LOW
**Description:** `form-tax-return-1040.component.ts` taxAndCredits TypeScript interface was missing `regularTax`, `computationMethod`, `box1Form8814Tax`, `box2Form4972Tax`, `ecrBox3Tax`, `box1Checked`, `box2Checked`, `box3Checked`, `box3Code`.
**Status:** **Fixed 2026-04-18.** All 9 fields added to the interface.

### G5 — PDF export does not fill line 16 checkboxes
**Severity:** LOW
**Description:** `form-tax-return-1040.component.ts` filled `line16_tax` only; not `line16_check_form8814`, `line16_check_form4972`, `line16_check_other_form`, or `line16_other_form_number`.
**Status:** **Fixed 2026-04-18.** All 4 remaining PDF fields now mapped.

### G6 — E2E coverage gaps for line 16 computation paths
**Severity:** MEDIUM
**Description:** Missing E2E tests for several paths.
**Status:** **Partially fixed 2026-04-18.** Added TCW, FOREIGN_EARNED_INCOME, Box 2 tests (9 total). Still missing: SCHEDULE_D_TAX_WORKSHEET path (no statement type covers 28%-rate/§1250 gain), Box 1 Form 8814 (covered indirectly in form8814 spec).

### Already documented in outstanding.md
- [Line 16 / Box 3 / 962] Section 962 election tax — out of scope
- [Line 16 / Box 3 / 1291TAX] Form 8621 line 16e — out of scope
- [Line 16 / Box 3 / Form 8978] Form 8978 line 14 — out of scope
- [Line 16 / Box 3 / 965INC] Section 965(i) — out of scope
