# Knowledge: Form 1040 Line 23 — Other Taxes (2025)

> Audited 2026-04-19. Line 23 (`TaxAndCredits.otherTaxes`) reads `Schedule2OtherTaxes.totalOtherTaxes` as pre-accumulated by `applyAdditionalSocialSecurityMedicareTaxes()` and `applyForm5329TaxToSchedule2()`; it is correctly wired into line 24. Six Schedule 2 Part II sub-items are implemented (lines 5, 6, 7, 8, 11, and the line 7 subtotal); eight lines are deferred stubs or out of scope.

---

## 1. Line Identity

**Form 1040 (2025) line 23** is labeled:

```
Other taxes, including self-employment tax, from Schedule 2, line 21
```

| Concept | Value |
|---|---|
| IRS label | "Other taxes, including self-employment tax, from Schedule 2, line 21" |
| Java model field | `TaxAndCredits.otherTaxes` |
| Getter | `getOtherTaxes()` |
| Setter | `setOtherTaxes(BigDecimal)` |
| Java model class | `C:\us-tax\us-tax-be\src\main\java\com\ustax\model\output\TaxAndCredits.java` (line 26) |
| Frontend TS field | `form.taxAndCredits?.otherTaxes` |
| PDF semantic key | `line23_other_taxes_schedule2_line21` |
| PDF AcroForm field | `topmostSubform[0].Page2[0].f2_15[0]` |
| Page / rect in CSV | Page 2, `(504, 540, 576, 551.999)` |
| CSV source | `C:\us-tax\us-tax-ui\public\irs\f1040_field_mapping_semantic.csv` (line 164) |

Schedule 2 Part II model:

| Concept | Value |
|---|---|
| Java model class | `C:\us-tax\us-tax-be\src\main\java\com\ustax\model\output\Schedule2OtherTaxes.java` |
| Total field | `Schedule2OtherTaxes.totalOtherTaxes` |
| Getter | `getTotalOtherTaxes()` |
| Parent model | `Schedule2.otherTaxes` |

---

## 2. Core Formula

```
line23 = Schedule2.line21 = Schedule2OtherTaxes.totalOtherTaxes
Form1040.line23 = TaxAndCredits.otherTaxes
```

Surrounding page-2 chain:

```
line18 = totalTaxBeforeCredits                       (line16 + line17)
line21 = totalCredits                                (CTC/ODC + Schedule 3 line 8)
line22 = max(0, line18 − line21)                     (taxAfterCredits)
line23 = Schedule2.line21 (other taxes)              (THIS LINE)
line24 = line22 + nz(line23)                         (totalTax)
```

2025 IRS formula for Schedule 2 line 21 (the sum that feeds line 23):

```
Schedule2.line21 = line4 + line7 + line8 + line9 + line10 + line11 + line12
                   + line13 + line14 + line15 + line16 + line18 + line19
```

**Note:** Line 10 is reserved for future use in 2025. Line 20 (`Section 965`) is NOT included in the printed 2025 line 21 formula.

---

## 3. Schedule 2 Part II — Sub-items

| Sched 2 line | IRS label (2025) | Java field (`Schedule2OtherTaxes`) | Source method | Implemented? |
|---|---|---|---|---|
| 4 | Self-employment tax (Schedule SE) | `selfEmploymentTax` | None (SE out of scope) | No — stub null |
| 5 | Unreported tip income tax (Form 4137) | `unreportedTipIncomeTax` | `applyAdditionalSocialSecurityMedicareTaxes()` | Yes |
| 6 | Uncollected SS/Medicare on wages (Form 8919) | `uncollectedSocialSecurityMedicareTaxOnWages` | `applyAdditionalSocialSecurityMedicareTaxes()` | Yes |
| 7 | Total additional SS/Medicare (line 5 + 6) | `totalAdditionalSocialSecurityMedicareTax` | `applyAdditionalSocialSecurityMedicareTaxes()` | Yes |
| 8 | Additional tax on IRAs/qualified plans (Form 5329) | `additionalTaxOnIras` | `applyForm5329TaxToSchedule2()` | Yes |
| 9 | Household employment taxes (Schedule H) | `householdEmploymentTaxes` | None | No — stub null |
| 10 | (Reserved for future use 2025) | — | — | n/a |
| 11 | Additional Medicare Tax (Form 8959 line 18) | `additionalMedicareTax` | `applyAdditionalSocialSecurityMedicareTaxes()` via `computeAdditionalMedicareTax()` | Yes (Part I + III; Part II SE = 0) |
| 12 | Net investment income tax (Form 8960) | `netInvestmentIncomeTax` | None | No — stub null |
| 13 | Uncollected SS/Medicare/RRTA on tips or GTL | `uncollectedSocialSecurityMedicareRrtaTax` | None (W-2 box 12 codes A/B not implemented) | No — stub null |
| 14 | Interest on installment sales (residential lots/timeshares) | `interestOnInstallmentSalesResidentialLots` | None | No — stub null |
| 15 | Interest on deferred tax — installment sales >$150k | `interestOnDeferredTaxInstallmentSalesOver150k` | None | No — stub null |
| 16 | Recapture of low-income housing credit (Form 8611) | `recaptureLowIncomeHousingCredit` | None | No — stub null |
| 17a–17z | Other additional taxes (various detail write-ins) | `recaptureOtherCredits`, `additionalTaxOnHsaDistributions`, etc. | None | No — stub null |
| 18 | Total additional taxes (sum of 17a–17z) | `totalAdditionalTaxes` | None | No — stub null |
| 19 | Recapture of net EPE from Form 4255 line 1d col (l) | `recaptureNetEpeForm4255Line1dColL` | None | No — stub null |
| 20 | Section 965 net tax liability installment | `section965NetTaxLiabilityInstallment` | None | No — stub null (excluded from line 21 formula in 2025) |
| 21 | **Total other taxes** (= Form 1040 line 23) | `totalOtherTaxes` | Accumulated by `applyAdditionalSocialSecurityMedicareTaxes()` + `applyForm5329TaxToSchedule2()` | Partial — only implemented sub-items accumulate |

---

## 4. Backend Implementation

### Methods that write `TaxAndCredits.otherTaxes` (line 23)

**File:** `C:\us-tax\us-tax-be\src\main\java\com\ustax\microservices\TaxReturnComputeService.java`

#### `applyAdditionalSocialSecurityMedicareTaxes()` — lines 11099–11144

Called from the main compute flow at line 589. Sets individual Schedule 2 Part II sub-item fields only — does **not** set `totalOtherTaxes` or `TaxAndCredits.otherTaxes` (those are handled by `finalizeSchedule2OtherTaxes()`):

```
tipTax         = TipComputation.totalTipTax()          → Schedule2OtherTaxes.unreportedTipIncomeTax (line 5)
uncollectedTax = UncollectedComputation.line6Tax()     → Schedule2OtherTaxes.uncollectedSocialSecurityMedicareTaxOnWages (line 6)
line7subtotal  = nz(tipTax) + nz(uncollectedTax)       → Schedule2OtherTaxes.totalAdditionalSocialSecurityMedicareTax (line 7)
amtPartI       = computeAdditionalMedicareTax()        → Schedule2OtherTaxes.additionalMedicareTax (line 11, Part I only — initial estimate)
```

After `buildForm8959()` runs (line 17 path), the full Form 8959 line 18 total (Part I + Part III RRTA) supersedes the Part-I-only estimate:

```
if form8959.line18TotalAdditionalMedicareTax != null:
    Schedule2OtherTaxes.additionalMedicareTax = form8959.line18TotalAdditionalMedicareTax  (line 11, corrected — G3 fix)
```

#### `applyForm5329TaxToSchedule2()` — lines 11154–11178

Called from main compute flow at line 623. Sets the Form 5329 sub-item field only:

```
iraTax = form5329.getAdditionalTaxOnEarlyDistributions()
Schedule2OtherTaxes.additionalTaxOnIras = iraTax   (line 8 — sub-item only)
```

#### `finalizeSchedule2OtherTaxes()` — line 11197 *(added 2026-04-19, G5 fix)*

Called just before `computeLine20ThroughLine24()` (~line 1065 of `prepare()`). Sums all sub-item fields into a single authoritative total:

```
line7  = totalAdditionalSocialSecurityMedicareTax (lines 5+6 subtotal)
line18 = sum(additionalTaxOnIras, householdEmploymentTaxes, additionalMedicareTax,
             netInvestmentIncomeTax, uncollectedSocialSecurityMedicareRrtaTax,
             interestOnInstallmentSalesResidentialLots, ..., totalAdditionalTaxes,
             recaptureNetEpeForm4255Line1dColL)
grandTotal = nz(selfEmploymentTax) + nz(line7) + nz(line18)
Schedule2OtherTaxes.totalOtherTaxes = grandTotal
TaxAndCredits.otherTaxes = grandTotal > 0 ? grandTotal : null
```

#### `computeLine20ThroughLine24()` — lines 15023–15056

Reads `TaxAndCredits.otherTaxes` as finalized by `finalizeSchedule2OtherTaxes()`:

```
line23 = safeAmount(tac.getOtherTaxes())
line24 = roundMoney(line22.add(line23))
tac.setTotalTax(line24 > 0 ? line24 : BigDecimal.ZERO)
```

**Compute order (call sites in main `prepare()`):**

```
589   applyAdditionalSocialSecurityMedicareTaxes()  → writes Schedule2 sub-items: lines 5, 6, 7, 11 (Part I)
      [buildForm8959() supersedes line 11 with Part I + III RRTA total — G3 fix]
623   applyForm5329TaxToSchedule2()                 → writes Schedule2 sub-item: line 8
...   [all other methods that do NOT touch otherTaxes]
1065  finalizeSchedule2OtherTaxes()                 → sums all sub-items → totalOtherTaxes + TaxAndCredits.otherTaxes
1052  computeLine20ThroughLine24()                  → reads tac.otherTaxes → line23; computes line24
```

---

## 5. Frontend

### PDF fill in Form 1040

**File:** `C:\us-tax\us-tax-ui\src\app\forms\form-tax-return-1040.component.ts` (line 328)

```typescript
values['line23_other_taxes_schedule2_line21'] = this.formatAmount(form.taxAndCredits?.otherTaxes);
```

TypeScript interface field: `TaxAndCreditsView.otherTaxes` (line 146 of the same file).

### Schedule 2 display component

**File:** `C:\us-tax\us-tax-ui\src\app\forms\form-tax-return-schedule2.component.ts`

Displays all Schedule 2 Part II sub-items via PDF readonly preview against the `f1040s2` semantic PDF. The `buildFieldValues()` method maps all `Schedule2OtherTaxes` Java fields to Schedule 2 PDF keys, including:

```typescript
values['line21_total_other_taxes'] = this.formatAmount(other?.totalOtherTaxes);
```

The component renders when `schedule2()` is non-null.

### CSV field location (Form 1040 line 23)

| Form | Line | PDF semantic key | AcroForm field | Page | Rectangle |
|---|---|---|---|---|---|
| Form 1040 | 23 | `line23_other_taxes_schedule2_line21` | `f2_15[0]` | 2 | (504, 540, 576, 551.999) |

---

## 6. Unit Tests

**File:** `C:\us-tax\us-tax-be\src\test\java\com\ustax\microservices\TaxReturnComputeServiceTest.java`

| Test name | What it asserts about line 23 / otherTaxes |
|---|---|
| `form5329EarlyDistributionTaxWiresToSchedule2Line8AndLine23` (line 14051) | `schedule2.getOtherTaxes().getAdditionalTaxOnIras() == 1000`; `tac.getOtherTaxes() == 1000` |
| `form5329AbsentWhenNoPensionEarlyDistribution` (line 14100) | `schedule2.getOtherTaxes().getAdditionalTaxOnIras() == null` — line 23 not set by Form 5329 |
| Tip income test at ~line 99 | `schedule2.getOtherTaxes().getUnreportedTipIncomeTax() == 14` |
| Tip+Medicare tax test at ~line 137 | `schedule2.getOtherTaxes().getAdditionalMedicareTax() == 90`; `getTotalOtherTaxes() == 855` |
| Medicare-only tests at ~lines 5142, 6863 | `schedule2.getOtherTaxes().getAdditionalMedicareTax() == 90` |
| Uncollected SS/Medicare at ~line 5111 | `schedule2.getOtherTaxes().getUncollectedSocialSecurityMedicareTaxOnWages() == 765` |
| Line 14097 smoke assertion | `tac.getOtherTaxes() == 1000` when Form 5329 penalty present |

No unit test currently asserts that `line24 = line22 + line23` when `otherTaxes > 0` from tip tax (only the Form 5329 path verifies that chain end-to-end).

---

## 7. E2E Tests

Dedicated spec created 2026-04-19: `line23-other-taxes.spec.ts`.

| Spec | Test name | What it verifies |
|---|---|---|
| `line23-other-taxes.spec.ts` | "Line 23 — Form 5329 early withdrawal penalty alone flows to line 23" | Form 5329 1099-R penalty → `schedule2.otherTaxes.additionalTaxOnIras`; `taxAndCredits.otherTaxes` equals penalty |
| `line23-other-taxes.spec.ts` | "Line 23 — Additional Medicare Tax alone flows to line 23" | $300k income → `schedule2.otherTaxes.additionalMedicareTax` > 0; `taxAndCredits.otherTaxes` equals AMT amount |
| `line23-other-taxes.spec.ts` | "Line 23 — Form 5329 penalty and Additional Medicare Tax both flow to combined line 23" | Both present → `taxAndCredits.otherTaxes` = sum of IRA penalty + AMT |
| `line5abc-pension-withdrawals.spec.ts` | "Form 5329 penalty wires through Schedule 2 line 8 to Form 1040 line 23" (line 313) | `schedule2.otherTaxes.additionalTaxOnIras == 500`; `form1040.taxAndCredits.otherTaxes == 500` |
| `line5abc-pension-withdrawals.spec.ts` | "hasEarlyDistributionAdditionalTaxForForm5329 false suppresses Form 5329 and clears line 23" (line 354) | `schedule2.otherTaxes.additionalTaxOnIras` null; line 23 not populated |
| `form8959-additional-medicare-tax.spec.ts` | Two scenarios (lines 91, 135) | `schedule2.otherTaxes.additionalMedicareTax == 180` (indirectly exercises line 23 accumulation) |
| `line1c-tip-income.spec.ts` | Multiple scenarios (lines 91, 139, etc.) | `schedule2.otherTaxes.unreportedTipIncomeTax` (Form 4137 → Schedule 2 line 5) |
| `line1g-uncollected-ss-medicare.spec.ts` | Line 100 | `schedule2.otherTaxes.uncollectedSocialSecurityMedicareTaxOnWages == 765` |

---

## 8. Identified Gaps

| ID | Severity | Description | Fix needed |
|---|---|---|---|
| G1 | HIGH | Self-employment tax (Schedule SE → Schedule 2 line 4) not implemented. SE is explicitly out of scope per `outstanding.md`, but this is the primary sub-item named in the IRS line 23 label. Any return with SE income has an incorrect `line23 = 0`. | Implement Schedule SE when SE scope is expanded. |
| G2 | HIGH | Household employment taxes (Schedule H → Schedule 2 line 9) not implemented. No intake form, no computation, no wiring to `householdEmploymentTaxes`. Any household employer has an incorrect line 23. | Add Schedule H intake + computation + `applyScheduleHTaxToSchedule2()`. |
| ~~G3~~ | ~~MEDIUM~~ | ~~Form 8959 Part III RRTA tax not wired into `TaxAndCredits.otherTaxes`.~~ | **Fixed 2026-04-19** — `Schedule2OtherTaxes.additionalMedicareTax` updated with Form 8959 line 18 full total (Part I + III) after `buildForm8959()`. |
| G4 | MEDIUM | Net investment income tax (Form 8960 → Schedule 2 line 12) not implemented. No intake form, no computation, no wiring. Taxpayers with >$200k income and investment income miss this 3.8% tax in line 23. | Implement Form 8960 intake + computation + wiring. |
| ~~G5~~ | ~~MEDIUM~~ | ~~`Schedule2OtherTaxes.totalOtherTaxes` accumulated additively — no finalization pass.~~ | **Fixed 2026-04-19** — `finalizeSchedule2OtherTaxes()` sums all sub-item fields; writers no longer touch the total. 3 unit tests added. |
| ~~G6~~ | ~~LOW~~ | ~~No dedicated E2E spec `line23-other-taxes.spec.ts`.~~ | **Fixed 2026-04-19** — Spec created with 3 scenarios (Form 5329 alone, AMT alone, combined). |
| ~~G7~~ | ~~LOW~~ | ~~`computeForm2210()` hardcodes `Form2210.otherTaxes = BigDecimal.ZERO`.~~ | **Fixed 2026-04-19** — Now reads `safeAmount(tac.getOtherTaxes())`. |
| G8 | LOW | W-2 box 12 codes A/B → Schedule 2 line 13 (`uncollectedSocialSecurityMedicareRrtaTax`) unimplemented. | Implement W-2 box 12 code A/B → `uncollectedSocialSecurityMedicareRrtaTax` path. |

---

## 9. Spec Accuracy

The spec at `C:\us-tax\lines\23.md` is **accurate for 2025**. The IRS formula (Add lines 4, 7–16, 18, 19; exclude line 10 and line 20 from the line 21 total), the guardrails (no double-counting of lines 5/6 after line 7; lines 17a–17z roll into line 18 only), and the surrounding Form 1040 chain (line22 → line23 → line24) are all correctly described.

One minor omission: the spec does not call out the `Form2210.otherTaxes` downstream impact (gap G7) or the RRTA gap (G3), but those are implementation gaps not spec errors.

No corrections were made to the spec file.
