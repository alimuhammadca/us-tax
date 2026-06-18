# Knowledge: Form 1040 Line 17 — Alternative Minimum Tax (2025)

Audit date: 2026-04-18
Sources: `C:\us-tax\lines\17.md`, `TaxReturnComputeService.java`, `form-tax-return-1040.component.ts`, `form-tax-return-6251.component.ts`, `line17-amt.spec.ts`, IRS Form 6251 (2025), IRS Instructions for Form 6251 (i6251 2025).

---

## 1. Line Identity

```
Form1040.line17 = Schedule2.line3
Schedule2.line3 = Schedule2.line1z + Schedule2.line2
Schedule2.line2 = Form6251.line11
```

- Line 17 is **not** AMT only. It is the full Schedule 2 Part I total.
- `Schedule2.line1z` = sum of lines 1a–1y (clean-energy recapture, PTC repayment, etc.).
- In the current implementation `Schedule2.line1z = 0` (all line 1 items out of scope).
- Therefore `Form1040.line17 = Form6251.line11` in practice, but the official path must go through `Schedule2.line3`.

---

## 2. Form 6251 Structure (2025)

The 2025 form changed because of the **enhanced senior deduction** (Schedule 1-A line 37), which must be added back for AMT.

### Part I — AMTI Computation

```
line1a = Form1040.line14 - Schedule1A.line37
line1b = Form1040.line11b - line1a
line2a = ScheduleA.line7                   (if itemizing)
        OR Form1040.line12e                (if standard deduction)
line2b = negative refund of state/local/foreign taxes in income
line2g = pabInterest (private activity bond interest)
line4  = line1b + line2a + line2b + line2g + ... (lines 2a–2t + line3)
```

Note: `line1a` is an intermediate — it does NOT flow directly into line 4. Line 4 starts from `line1b`.

### Part II — Tentative Minimum Tax

```
line5 = exemption (see section 5)
line6 = max(0, line4 - line5)
line7 = tax on line6 (three paths — see section 4)
line8 = AMT FTC (defaults to 0; deferred)
line9 = line7 - line8
line10 = line16tax + ptcRepayment - form4972LumpSumTax
         (FTC correction applied via correctLine17ForFtc() after Form 1116 runs)
line11 = max(0, line9 - line10)
```

### Part III — AMT Qualified Dividends / Capital Gains

Part III applies 0%/15%/20% preferential rates for qualified dividends and long-term capital gains when computing AMT. **Fully implemented** — `computeAmtPartIII()` delegates to `populateAmtPartIIIFields()`, which follows the exact IRS 2025 Form 6251 Part III worksheet (lines 12–40). When the PART_III path is taken, all 29 output fields on `Form6251` are populated, including the §1250 exclusion (line 14) which is subtracted from the preferential pool before applying 0%/15%/20% rates.

---

## 3. When Form 6251 Is Required (2025 Filing Test)

Attach Form 6251 if any of the following is true:
1. `line7 > line10`
2. Taxpayer claims any general business credit AND (`Form3800.line6 > 0` OR `Form3800.line25 > 0`)
3. Taxpayer claims Form 8834, Form 8911 (personal-use part), or Form 8801
4. `sum(lines2c..3) < 0` AND `line7 would be > line10` if those negative amounts were ignored

---

## 4. Line 7 Computation Paths

Three paths — use first that applies:

```
if Form2555 applies:
    line7 = ForeignEarnedIncomeTaxWorksheetFor6251.result
elif qualifiedDividends/LTCG present (Part III):
    line7 = Part III result (AMT QDCG rates)    → computeAmtPartIII() → populateAmtPartIIIFields()
else:
    line7 = direct 26%/28% computation on line6
```

### Direct 26%/28% — Non-MFS:
```
if line6 <= 239,100: line7 = line6 × 0.26
else:                line7 = line6 × 0.28 − 4,782
```

### Direct 26%/28% — MFS:
```
if line6 <= 119,550: line7 = line6 × 0.26
else:                line7 = line6 × 0.28 − 2,391
```

---

## 5. AMT Exemption and Phaseout (2025)

| Filing status | Exemption | Phaseout starts | Fully phased out |
|---|---:|---:|---:|
| Single / HOH | 88,100 | 626,350 | 978,750 |
| MFJ / QSS | 137,000 | 1,252,700 | 1,800,700 |
| MFS | 68,500 | 626,350 | 900,350 |

### Phaseout computation:
```
excess = max(0, line4 - phaseoutThreshold)
reduction = excess × 0.25
line5 = max(0, exemption - reduction)
```

### MFS add-back (deferred):
For MFS filers with `line4 > 900,350`, the 25% add-back is capped at $68,500. This rare path is documented as deferred.

---

## 6. Part III Thresholds for 2025 (AMT QDCG)

### Line 19 thresholds (0% rate ceiling):
| Filing status | Amount |
|---|---:|
| Single / MFS | 48,350 |
| MFJ / QSS | 96,700 |
| HOH | 64,750 |

### Line 25 thresholds (20% rate floor):
| Filing status | Amount |
|---|---:|
| Single | 533,400 |
| MFS | 300,025 |
| MFJ / QSS | 600,050 |
| HOH | 566,700 |

MFS = half of MFJ $600,050 (Rev. Proc. 2024-40 §3.09).

---

## 7. Backend Implementation

### Class / method locations

| Method | Location | Purpose |
|---|---|---|
| `computeLine17()` | `TaxReturnComputeService.java` | Full AMT computation (Form 6251) |
| `wireLine17ToOutputs()` | `TaxReturnComputeService.java` | Wire results to `TaxAndCredits`, Schedule 2, Form 1040 |
| `computeAmtPartIII()` | `TaxReturnComputeService.java` | Line 7 PART_III path — delegates to `populateAmtPartIIIFields()` |
| `populateAmtPartIIIFields()` | `TaxReturnComputeService.java` | IRS Form 6251 Part III lines 12–40; sets all 29 fields on `Form6251` |
| `correctLine17ForFtc()` | `TaxReturnComputeService.java` | Post-FTC correction: recomputes line10, line11, re-wires outputs, refreshes line18 |
| `computeExemption()` | Inside `computeLine17()` | Line 5 — phaseout-adjusted exemption |
| `computeTaxBracket()` | Shared | Line 7 (direct 26/28% path) |

### `computeLine17()` summary

```java
// Line 1a
BigDecimal line1a = line14.subtract(schedule1aLine37 ?? ZERO);

// Line 1b
BigDecimal line1b = line11b.subtract(line1a);

// Line 2a — standard deduction (non-itemizer) or ScheduleA.line7 (itemizer)
BigDecimal line2a = itemizing ? scheduleALine7 : line12e;

// Line 2b
BigDecimal line2b = stateRefundInIncome.negate();

// Line 2g
BigDecimal line2g = pabInterest;

// Line 4 (AMTI)
BigDecimal line4 = line1b.add(line2a).add(line2b).add(line2g);

// Line 5 (exemption)
BigDecimal line5 = computeExemption(line4, filingStatus);

// Line 6
BigDecimal line6 = line4.subtract(line5).max(ZERO);

// Line 7 — three paths
String line7Path;
BigDecimal line7;
if (form2555Applies) {
    line7 = foreignEarnedIncomeTaxWorksheetFor6251();
    line7Path = "FEITW";
} else if (qualDivsOrLtcgPresent) {
    line7 = computeAmtPartIII(line6, filingStatus, form1040, scheduleD);
    line7Path = "PART_III";
    populateAmtPartIIIFields(form6251, line6, filingStatus, form1040, scheduleD);
} else {
    line7 = computeTaxBracket(line6, filingStatus);
    line7Path = "DIRECT";
}

// Line 8 (AMT FTC) = 0; line9 = line7

// Line 10 (initial — FTC correction applied later via correctLine17ForFtc())
BigDecimal line10 = line16.add(ptcRepayment).subtract(form4972LumpSumTax);

// Line 11
BigDecimal line11 = line9.subtract(line10).max(ZERO);
```

### `wireLine17ToOutputs()` summary

```java
taxAndCredits.setAlternativeMinimumTax(line11);
taxAndCredits.setAdditionalTaxSchedule2(line11);   // ← wired (G2 fix)
schedule2.setLine2(line11);
schedule2.setLine3(schedule2Line1z.add(line11));
form1040.setLine17(schedule2.getLine3());
```

### `correctLine17ForFtc()` summary

Called after `applyForeignTaxCreditToSchedule3()` when a FTC is present:

```java
BigDecimal ftc = schedule3.getNonrefundableCredits().getForeignTaxCredit();
BigDecimal line10Corrected = line10Initial.subtract(ftc);          // G3 fix
BigDecimal line11Corrected = line9.subtract(line10Corrected).max(ZERO);
wireLine17ToOutputs(form1040, schedule2, line11Corrected, uid);    // re-wire
computeLine18(form1040, uid);                                       // G-new-1 fix: refresh totalTaxBeforeCredits
```

---

## 8. Frontend Implementation

### Angular component
`form-tax-return-6251.component.ts` — Tax Return section sidebar entry for Form 6251 detail view.

### PDF field mapping in `form-tax-return-1040.component.ts`
```typescript
// Line 17 PDF field:
values['line17_amount_from_schedule2_line3'] =
    this.formatAmount(form.taxAndCredits?.additionalTaxSchedule2);
// additionalTaxSchedule2 is set by wireLine17ToOutputs() → PDF field populated correctly
```

The `taxAndCredits` interface in `form-tax-return-1040.component.ts` includes `alternativeMinimumTax` and `additionalTaxSchedule2` as separate fields.

---

## 9. Output Model

**`TaxAndCredits.java`** fields populated by line 17:
- `alternativeMinimumTax` — `Form6251.line11` result (set by `wireLine17ToOutputs()`)
- `additionalTaxSchedule2` — `Schedule2.line3`; set by `wireLine17ToOutputs()` (G2 fix)
- `totalTaxBeforeCredits` — `line16 + line17` (line 18); refreshed by `computeLine18()` after FTC correction (G-new-1 fix)

**`Form6251.java`** output model — populated with individual line values for the Form 6251 Tax Return view and PDF export. On the PART_III path, all 29 lines (12–40) are set by `populateAmtPartIIIFields()` (G-new-2 fix).

---

## 10. Test Inventory

### Unit tests (`TaxReturnComputeServiceTest.java`)

| Test name | Scenario | Expected |
|---|---|---|
| `line17AmtIsNullForLowIncome` | Single, $80k wages | `alternativeMinimumTax = null` |
| `line17AmtIsPositiveWhenPabInterestPresent` | Single, $200k wages + $100k PAB | AMT > 0 |
| `line17AmtExemptionPhaseout` | High AMTI above phaseout threshold | Reduced exemption |
| `line17AmtMfsFilingStatus` | MFS, moderate income | 119,550 breakpoint used |
| `line17AmtZeroWhenLine9LteqLine10` | Scenario where line9 ≤ line10 | `alternativeMinimumTax = 0` |
| `line17G1StandardDeductionAddedBackForNonItemizer` | Single, $100k wages + $50k PAB, standard deduction | `line2a = 15,750`; AMTI = 150,000; AMT > 0 |
| `line17G2AdditionalTaxSchedule2IsWired` | Same as G1 scenario | `additionalTaxSchedule2 == alternativeMinimumTax` |
| `line17G3FtcReducesLine10` | Single, $100k wages + $50k PAB + $100 FTC | `line10 = line16 − 100`; `line11 = max(0, line9 − line10)` |
| `line17GNew1TotalTaxBeforeCreditsRefreshedAfterFtcCorrection` | Same as G3 scenario | `totalTaxBeforeCredits = line16 + correctedLine11` |
| `line17GNew2PartIIIFieldsPopulatedWhenQualifiedDividendsPresent` | Single, $300k wages + $50k qual divs | `line7ComputationPath = "PART_III"`; all Part III fields non-null; `line40 == line7` |
| `line17GNew4Section1250GainExcludedFromPreferentialPool` | Single, $300k wages + $50k qual divs + $30k cap gain + $20k §1250 | `line14 = 20,000`; `line15 = max(0, line13 − line14)`; `line40 == line7` |

Total: 11 AMT-specific unit tests.

### E2E tests (`line17-amt.spec.ts`)

| Test name | Scenario | Expected |
|---|---|---|
| `no AMT for low income` | Single, $80k wages | `alternativeMinimumTax` null/absent |
| `AMT positive with PAB interest` | Single, $200k wages + $100k PAB interest | `alternativeMinimumTax > 0` |

Total: 2 E2E tests.

### E2E tests (`line17-amt-gaps.spec.ts`)

| Test name | Scenario | Expected |
|---|---|---|
| `Line 17 G1 — non-itemizer standard deduction added back to AMTI` | Single, $100k wages + $50k PAB, standard deduction | `line2a = 15750`; AMTI = 150000; `additionalTaxSchedule2 == alternativeMinimumTax` |
| `Line 17 G3 + G-new-1 — FTC reduces line 10; totalTaxBeforeCredits reflects corrected AMT` | Same + $100 FTC | `line10 = line16 − 100`; `line18 = line16 + line11` |
| `Line 17 G-new-2 — Part III fields populated when qualified dividends present` | Single, $300k wages + $50k qual divs | PART_III path; Part III fields non-null; `line19ZeroRateThreshold = 48350`; `line40 == line7` |
| `Line 17 G-new-4 — §1250 gain excluded from preferential pool; line40 == line7` | Single, $300k wages + $50k qual divs + $30k cap gain + $20k §1250 | `line14 = 20000`; `line15 = max(0, line13 − line14)`; `line40 == line7` |

Total: 4 E2E tests in gaps spec.

---

## 11. Compute Order

```
1. Finalize Form1040.line16  (TaxAndCredits.tax)
2. Read Form1040.line11b (AGI), line14 (deductions), Schedule1A.line37 (senior deduction)
3. computeLine17():
   a. line1a = line14 − schedule1aLine37
   b. line1b = line11b − line1a
   c. line2a = scheduleALine7 (itemizing) OR line12e (standard deduction)  ← G1 fix
   d. line2b = state refund negate
   e. line2g = PAB interest
   f. line4 = AMTI (combine line1b through line3)
   g. line5 = phaseout-adjusted exemption
   h. line6 = max(0, line4 − line5)
   i. line7 — three paths: FEITW / PART_III (computeAmtPartIII) / DIRECT (26%/28%)
   j. if PART_III: populateAmtPartIIIFields() sets lines 12–40 on Form6251  ← G-new-2 fix
   k. line8 = AMT FTC (= 0; deferred)
   l. line9 = line7 − line8
   m. line10 = line16 + ptcRepayment − form4972LumpSumTax  (initial; FTC corrected below)
   n. line11 = max(0, line9 − line10)
4. wireLine17ToOutputs():
   - alternativeMinimumTax = line11
   - additionalTaxSchedule2 = line11  ← G2 fix
   - Schedule2.line2 = line11; Schedule2.line3 = line1z + line11
   - Form1040.line17 = Schedule2.line3
5. computeLine18()  →  totalTaxBeforeCredits = line16 + line17
6. computeForm1116()  →  FTC amount
7. applyForeignTaxCreditToSchedule3()  →  Schedule3.line1 = FTC
8. correctLine17ForFtc() [if FTC > 0]:
   - line10Corrected = line10 − FTC  ← G3 fix
   - line11Corrected = max(0, line9 − line10Corrected)
   - wireLine17ToOutputs() with corrected line11
   - computeLine18()  ← G-new-1 fix: refresh totalTaxBeforeCredits after FTC correction
9. Downstream Credit Limit Worksheets read updated totalTaxBeforeCredits
```

---

## 12. Downstream Consumers

| Consumer | How |
|---|---|
| `TaxAndCredits.totalTaxBeforeCredits` (line 18) | `line16 + alternativeMinimumTax`; refreshed after FTC correction |
| `Form6251.java` output model | Individual line values (lines 1–11 always; lines 12–40 on PART_III path) for Tax Return view |
| PDF export (line 17 field) | Reads `additionalTaxSchedule2` (now correctly set) |
| Form 8801 (prior-year AMT credit) | Reads prior-year Form 6251 values (manual entry) |

---

## 13. Identified Gaps

| # | Description | Severity | Status |
|---|---|---|---|
| G1 | `Form6251.line2a` always zero for non-itemizers; should be `Form1040.line12e` | HIGH | **Fixed 2026-04-18** |
| G2 | `wireLine17ToOutputs()` never sets `additionalTaxSchedule2`; PDF line 17 always blank | MEDIUM | **Fixed 2026-04-18** |
| G3 | `Form6251.line10` missing `Schedule3.line1` (FTC) subtraction | MEDIUM | **Fixed 2026-04-18** (`correctLine17ForFtc()`) |
| G4 | Part III (AMT QDCG rates) not computed; `line7` always uses flat 26%/28% | MEDIUM | **Closed — not a gap** (`computeAmtPartIII()` is fully implemented and called) |
| G5 | Spec MFS line 25 threshold was `300,000`; corrected to `300,025` | LOW | Fixed (spec only, 2026-04-18) |
| G-new-1 | `totalTaxBeforeCredits` (line 18) stale after FTC correction; `computeLine18()` not called in `correctLine17ForFtc()` | MEDIUM | **Fixed 2026-04-18** — `computeLine18()` added at end of `correctLine17ForFtc()` |
| G-new-2 | Form 6251 Part III fields (lines 12–40) all null; `computeAmtPartIII()` returned a value but set no fields on the Form6251 object | MEDIUM | **Fixed 2026-04-18** — `populateAmtPartIIIFields()` method added; called after PART_III path in `computeLine17()` |
| G-new-3 | No E2E coverage for G1, G2, G3, G-new-1, G-new-2, G-new-4 scenarios | MEDIUM | **Written 2026-04-18** — `line17-amt-gaps.spec.ts` (4 scenarios) |
| G-new-4 | `computeAmtPartIII()` included §1250 gain in the 0%/15%/20% pool; IRS Part III line 14 subtracts §1250 before computing pref pool | MEDIUM | **Fixed 2026-04-18** — `computeAmtPartIII()` now delegates entirely to `populateAmtPartIIIFields()` which follows exact IRS arithmetic |

---

## 14. Out of Scope (explicitly deferred)

- Form 6251 line 2c — AMT investment interest (requires second Form 4952 under AMT rules)
- Form 6251 line 2f — Alternative tax NOL deduction
- Form 6251 line 2i — ISO spread (incentive stock options)
- Form 6251 line 2m — Passive activity AMT adjustment (requires Schedule E)
- Form 6251 line 8 — AMT foreign tax credit (requires separate AMT FTC computation)
- Schedule 2 line 1z — Clean-energy credit recapture (set to 0)
- MFS add-back capped at $68,500 (rare high-income MFS path)
