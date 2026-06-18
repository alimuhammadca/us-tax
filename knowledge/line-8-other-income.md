# Knowledge — Line 8 Other Income (Schedule 1 Part I)

Tax year: **2025**
Last updated: **2026-04-16**

---

## 1. What line 8 is

**Form 1040 line 8** is the amount from **Schedule 1 (Form 1040), line 10**.

```
Form1040.line8 = Schedule1.line10
Schedule1.line10 = line1 + line2a + line3 + line4 + line5 + line6 + line7 + line9
Schedule1.line9  = sum(line8a through line8z)
```

Line 8 can be positive, zero, or negative (e.g., when NOL deduction or Form 2555 exclusion dominates).

---

## 2. 2025 IRS rules for each Schedule 1 Part I sub-line

### 2.1 Lines 1 through 7

| Line | Description | Notes |
|---|---|---|
| 1 | Taxable refunds, credits, or offsets of state and local income taxes | Only taxable under tax-benefit rule (deducted in prior year). 1099-G box 2 is the source; manual entry or imported via `imported1099GLine1TaxableRefunds`. |
| 2a | Alimony received | Only for pre-2019 divorce/separation agreements (post-2018 alimony is not income to recipient). |
| 2b | Date of original divorce or separation agreement | Informational. Required if line 2a is nonzero. |
| 3 | Business income or (loss) — Schedule C | Out of scope for this product. Blocked with flag `OTHER_INCOME_SCHEDULE_C_OUT_OF_SCOPE`. |
| 4 | Other gains or (losses) — Form 4797 or Form 4684 | User-entered manual amount. Required-attachment flags for Form 4797 and Form 4684 produced when nonzero. |
| 5 | Rental real estate, royalties, partnerships, S corps, trusts — Schedule E | User-entered manual amount. Required-attachment flag for Schedule E produced when nonzero. |
| 6 | Farm income or (loss) — Schedule F | Out of scope. Blocked with flag `OTHER_INCOME_SCHEDULE_F_OUT_OF_SCOPE`. |
| 7 | Unemployment compensation | Imported from 1099-G (`imported1099GLine7UnemploymentCompensation`) plus user-entered. 2025 overpayment repayment netted; repayment checkbox and amount tracked. |

### 2.2 Lines 8a through 8z

| Line | Description | Sign | Notes |
|---|---|---|---|
| 8a | Net operating loss (NOL) deduction | **Negative** | User enters positive; engine negates. |
| 8b | Gambling winnings (nonbusiness) | Positive | Losses not netted here; losses deductible on Schedule A up to winnings. |
| 8c | Cancellation of debt | Positive | Imported from 1099-C (`imported1099CLine8cCancellationOfDebt`) plus user-entered. |
| 8d | Foreign earned income exclusion and housing exclusion from Form 2555 | **Negative** | Includes both line 45 and line 50 of Form 2555. User enters positive; engine negates. Also populated from `importedForm2555Line8dForeignExclusion` (write-back from Form 2555 compute). Required-attachment flag for Form 2555 produced when nonzero. |
| 8e | Income from Form 8853 (MSA / LTC) | Positive | Imported from `importedForm8853Line8e` (write-back). Required-attachment flag for Form 8853 produced when nonzero. |
| 8f | Income from Form 8889 (HSA) | Positive | Imported from `importedForm8889Line8f` (write-back). Required-attachment flag for Form 8889 produced when nonzero. |
| 8g | Alaska Permanent Fund dividends | Positive | Distinct line; do not collapse into 8z. |
| 8h | Jury duty pay | Positive | Related offset for pay turned over to employer goes on Schedule 1 line 24a, not netted here. |
| 8i | Prizes and awards | Positive | |
| 8j | Activity not engaged in for profit income (hobby income) | Positive | |
| 8k | Stock options (not reported elsewhere) | Positive | |
| 8l | Rental of personal property for profit (not business) | Positive | Related deductible expenses go on Schedule 1 line 24b, not netted here. |
| 8m | Olympic and Paralympic medals and USOC prize money | Positive | May be excluded if AGI (including this amount) ≤ $1,000,000 ($500,000 MFS) — exclusion taken on line 24c, not by reducing 8m. |
| 8n | Section 951(a) inclusion | Positive | From Forms 5471, Schedule I. NOT reported here if taxpayer made a section 962 election (line 16 direct instead). |
| 8o | Section 951A(a) inclusion | Positive | From Form 8992, Part II, line 5. Same section 962 exception as 8n. |
| 8p | Section 461(l) excess business loss adjustment | Positive | |
| 8q | Taxable ABLE account distributions | Positive | |
| 8r | Scholarship and fellowship grants not on Form W-2 | Positive | Degree candidates: only nonqualified expenses (room, board, travel) taxable here. |
| 8s | Nontaxable Medicaid waiver payments included on line 1a or 1d | **Negative** | Computed from Medicaid waiver payments personal form. Sourced from `MedicaidComputation.schedule1Line8s()`. |
| 8t | Pension/annuity from nonqualified deferred comp or nongovernmental 457 plan | Positive | W-2 box 11 amounts merged from `sumW2Box11Nqdc(w2Entries)` plus Other incomes form input. This line flows even when no Other incomes personal form is filled. |
| 8u | Wages earned while incarcerated | Positive | From employment income forms (`inmateWagesAmount`) plus Other incomes form input. Also flows without Other incomes personal form. |
| 8v | Digital assets received as ordinary income not reported elsewhere | Positive | Only for ordinary income not on line 1a / not on Schedule D. Forks, staking, mining income only if not a business. |
| 8z | Other taxable income (catch-all) | Positive | Type and amount stored as list of `Schedule1OtherIncomeItem`. Only taxable items. |

### 2.3 Top-of-Schedule-1 1099-K entry space

The 2025 Schedule 1 has a separate entry space above Part I for 1099-K amounts reported in error or for personal items sold at a loss. This field:
- is **not** one of lines 1 through 10;
- does **not** affect line 9 or line 10 arithmetic;
- is a disclosure/matching field only.

**Not yet implemented in this product.**

---

## 3. Implementation status

### 3.1 Implemented

| Sub-line | Status |
|---|---|
| Line 1 (taxable state refunds) | Implemented — user entry + 1099-G import |
| Line 2a/2b (alimony received) | Implemented — user entry |
| Line 3 (Schedule C) | Out-of-scope blocker only (blocking flag emitted) |
| Line 4 (other gains) | Implemented — user entry; required-attachment flags for Form 4797 and Form 4684 |
| Line 5 (Schedule E) | Implemented — user entry; required-attachment flag for Schedule E |
| Line 6 (Schedule F) | Out-of-scope blocker only (blocking flag emitted) |
| Line 7 (unemployment) | Implemented — user entry + 1099-G import + 2025 repayment netting |
| Line 8a (NOL) | Implemented — user entry; negated by engine |
| Line 8b (gambling) | Implemented — user entry |
| Line 8c (cancellation of debt) | Implemented — user entry + 1099-C import |
| Line 8d (Form 2555 exclusion) | Implemented — user entry + Form 2555 write-back import; negated by engine |
| Line 8e (Form 8853) | Implemented — user entry + Form 8853 write-back |
| Line 8f (Form 8889) | Implemented — user entry + Form 8889 write-back |
| Line 8g (Alaska dividends) | Implemented — user entry |
| Line 8h (jury duty pay) | Implemented — user entry |
| Line 8i (prizes and awards) | Implemented — user entry |
| Line 8j (hobby income) | Implemented — user entry |
| Line 8k (stock options) | Implemented — user entry |
| Line 8l (rental personal property) | Implemented — user entry |
| Line 8m (Olympic medals) | Implemented — user entry (gross amount; no 24c exclusion logic yet) |
| Line 8n (section 951(a)) | Implemented — user entry |
| Line 8o (section 951A(a)) | Implemented — user entry |
| Line 8p (section 461(l)) | Implemented — user entry |
| Line 8q (ABLE distributions) | Implemented — user entry |
| Line 8r (scholarships) | Implemented — user entry |
| Line 8s (Medicaid waiver offset) | Implemented — computed from `MedicaidComputation.schedule1Line8s()` |
| Line 8t (NQDC / nongovernmental 457) | Implemented — W-2 box 11 merge + user entry |
| Line 8u (inmate wages) | Implemented — employment income form merge + user entry |
| Line 8v (digital assets) | Implemented — user entry |
| Line 8z (catch-all) | Implemented — repeatable list of description + amount items |
| Form 8814 line 12 → Schedule 1 | Implemented — `applyForm8814Line12ToSchedule1()` adds child's other income |
| Schedule 1 line 9 total | Implemented — sum of 8a through 8z |
| Schedule 1 line 10 total | Implemented — lines 1–7 + line 9 |
| Form 1040 line 8 | Implemented — `line10` from `OtherIncomeComputation` |
| Required-attachment flags | Implemented — Form 2555, Form 8853, Form 8889, Schedule E, Form 4797, Form 4684 |

### 3.2 Not implemented / deferred

| Item | Status |
|---|---|
| Top-of-form 1099-K entry space | Not modeled. Field not in YAML; no UI, no output field. |
| Line 8m Olympic exclusion on line 24c | Gross amount accepted; exclusion ($1M/$500k MFS threshold → line 24c) not computed. |
| Line 8n/8o section 962 election gate | 962 election detected for line 16 (Form 1040) but not used to suppress 8n/8o reporting. |
| Line 3 / Schedule C actual compute | Blocked; no compute. |
| Line 6 / Schedule F actual compute | Blocked; no compute. |
| Form 8853 standalone compute output | Required-attachment only; no Form 8853 output model. |
| Form 8889 standalone compute output | Required-attachment only; no Form 8889 output model. |
| Form 4797 standalone compute output | Required-attachment only; no Form 4797 full output model. |
| 1099-G auto-import fields | Fields defined in YAML as `imported*` but auto-population from 1099-G statements is user-fill only — the backend reads from the `other-incomes-taxpayer` personal form, not by parsing 1099-G statement entries directly into lines 1/7. Statements are used only for gating validation. |
| Line 1 tax-benefit-rule worksheet | Full worksheet per Pub. 525 not computed; user enters already-computed taxable portion. |
| Unemployment repayment > $3,000 | Pub. 525 repayment rules not implemented; only same-year netting is done. |

---

## 4. Backend architecture

### 4.1 Compute entry point

| Method | File | Approx. line |
|---|---|---|
| `computeOtherIncomes()` | `TaxReturnComputeService.java` | 6861 |
| `validateOtherIncomeStatementGating()` | `TaxReturnComputeService.java` | 7351 |
| `buildSchedule1OtherIncomeItems()` | `TaxReturnComputeService.java` | 7394 |
| `applySchedule1AdditionalIncome()` | `TaxReturnComputeService.java` | 8661 |
| `buildLine8AttachmentForms()` | `TaxReturnComputeService.java` | 8685 |
| `applyForm8814Line12ToSchedule1()` | `TaxReturnComputeService.java` | 6080 |

### 4.2 `computeOtherIncomes()` signature

```java
private OtherIncomeComputation computeOtherIncomes(
    Map<String, Object> otherIncomeTaxpayer,
    Map<String, Object> otherIncomeSpouse,
    MedicaidComputation medicaid,
    List<Map<String, Object>> form1099GEntries,
    List<Map<String, Object>> form1099CEntries,
    List<Map<String, Object>> w2Entries,
    BigDecimal employmentFormInmateWagesTaxpayer,
    BigDecimal employmentFormInmateWagesSpouse,
    List<TaxReturnFlag> flags,
    String uid)
```

Called from `prepare()` at line ~419.

### 4.3 Internal record

```java
private record OtherIncomeComputation(
    Schedule1AdditionalIncome additionalIncome,
    List<Schedule1OtherIncomeItem> otherIncomeItems,
    BigDecimal line8FromSchedule1,    // = Schedule1 line10
    BigDecimal line8tNqdc,            // threaded to buildIncome for display
    BigDecimal line8uInmate)          // threaded to buildIncome for display
```

Defined at `TaxReturnComputeService.java` line 17336.

### 4.4 Output model class

`Schedule1AdditionalIncome.java` — `src/main/java/com/ustax/model/output/Schedule1AdditionalIncome.java`

Key fields:

| Java field | Meaning |
|---|---|
| `taxableRefundsStateLocal` | Schedule 1 line 1 |
| `alimonyReceived` | Schedule 1 line 2a |
| `alimonyReceivedAgreementDate` | Schedule 1 line 2b (string date) |
| `businessIncomeLoss` | Schedule 1 line 3 (out-of-scope placeholder) |
| `otherGainsLosses` | Schedule 1 line 4 |
| `rentalRealEstateRoyalties` | Schedule 1 line 5 |
| `farmIncomeLoss` | Schedule 1 line 6 (out-of-scope placeholder) |
| `unemploymentCompensation` | Schedule 1 line 7 (net of repayment) |
| `otherIncomeNetOperatingLoss` | Schedule 1 line 8a (stored negative) |
| `otherIncomeGambling` | Schedule 1 line 8b |
| `otherIncomeCancellationOfDebt` | Schedule 1 line 8c |
| `otherIncomeForeignEarnedIncomeExclusion` | Schedule 1 line 8d (stored negative) |
| `otherIncomeForm8853` | Schedule 1 line 8e |
| `otherIncomeForm8889` | Schedule 1 line 8f |
| `otherIncomeAlaskaPermanentFundDividends` | Schedule 1 line 8g |
| `otherIncomeJuryDutyPay` | Schedule 1 line 8h |
| `otherIncomePrizesAwards` | Schedule 1 line 8i |
| `otherIncomeNotForProfitActivity` | Schedule 1 line 8j |
| `otherIncomeStockOptions` | Schedule 1 line 8k |
| `otherIncomeRentalPersonalProperty` | Schedule 1 line 8l |
| `otherIncomeOlympicParalympicAwards` | Schedule 1 line 8m |
| `otherIncomeSection951a` | Schedule 1 line 8n |
| `otherIncomeSection951A` | Schedule 1 line 8o |
| `otherIncomeSection461l` | Schedule 1 line 8p |
| `otherIncomeAbleAccountDistributions` | Schedule 1 line 8q |
| `otherIncomeScholarshipGrants` | Schedule 1 line 8r |
| `otherIncomeMedicaidWaiverPayments` | Schedule 1 line 8s (stored negative) |
| `otherIncomeNonqualifiedDeferredComp` | Schedule 1 line 8t |
| `otherIncomeWagesWhileIncarcerated` | Schedule 1 line 8u |
| `otherIncomeDigitalAssets` | Schedule 1 line 8v |
| `otherIncomeOther` | Schedule 1 line 8z (sum of items) |
| `otherIncomeForm8814` | Form 8814 line 12 child other income (set by `applyForm8814Line12ToSchedule1`) |
| `totalOtherIncome` | Schedule 1 line 9 |
| `totalAdditionalIncome` | Schedule 1 line 10 = Form 1040 line 8 |

### 4.5 Wire-up in `prepare()`

Order in `prepare()`:
1. `computeOtherIncomes()` called at ~line 419 — produces `OtherIncomeComputation otherIncome`.
2. `buildIncome()` at ~line 551 uses `otherIncome.line8FromSchedule1()` for Form 1040 line 8.
3. `applySchedule1AdditionalIncome()` at ~line 582 copies the `additionalIncome` into `schedule1`.
4. `applyForm8814Line12ToSchedule1()` at ~line 583 adds Form 8814 line 12 amounts to `schedule1`.
5. `buildLine8AttachmentForms()` at ~line 644 produces required-attachment stubs.

### 4.6 Statement gating flags

| Flag code | Condition |
|---|---|
| `OTHER_INCOME_STATEMENT_CONFIRMATION_REQUIRED` | `hadAdditionalIncomeForSchedule1=true` AND `confirmAllReceivedOtherIncomeStatementsUploaded != true` |
| `OTHER_INCOME_MISSING_UPLOADED_1099_G` | `received1099G=true` AND (`uploaded1099G != true` OR no 1099-G entries) |
| `OTHER_INCOME_MISSING_UPLOADED_1099_C` | `received1099C=true` AND (`uploaded1099C != true` OR no 1099-C entries) |
| `OTHER_INCOME_SCHEDULE_C_OUT_OF_SCOPE` | `hasScheduleCBusinessIncomeOutOfScope=true` on either form |
| `OTHER_INCOME_SCHEDULE_F_OUT_OF_SCOPE` | `hasScheduleFFarmIncomeOutOfScope=true` on either form |

### 4.7 Compute order dependencies

`computeOtherIncomes()` must run **after**:
- Medicaid waiver payments computation (supplies `MedicaidComputation.schedule1Line8s()`)
- Employment income forms loaded (supplies `inmateWagesAmount` for line 8u)
- W-2 entries loaded (supplies W-2 box 11 NQDC for line 8t via `sumW2Box11Nqdc()`)

`computeOtherIncomes()` must run **before**:
- `buildIncome()` — needs `otherIncome.line8FromSchedule1()` for Form 1040 line 8
- `computeTotalIncome()` — line 9 = sum including line 8
- `computeAGI()` — needs line 9 and line 8 complete

---

## 5. Frontend architecture

### 5.1 Form IDs and components

| Form ID | Angular component | Person | YAML file |
|---|---|---|---|
| `other-incomes-taxpayer` | `form-other-incomes-taxpayer.component.ts` | Taxpayer | `C:\us-tax\yamls\8-other-incomes-taxpayer.yaml` |
| `other-incomes-spouse` | `form-other-incomes-spouse.component.ts` | Spouse | `C:\us-tax\yamls\8-other-incomes-spouse.yaml` |

Tax Return display: `form-tax-return-schedule1.component.ts` (shared with Schedule 1 Part II / adjustments view).

**Sidebar section:** Income → "Other incomes" (taxpayer and spouse tabs).

### 5.2 YAML structure (taxpayer form)

Sections:
1. `screening` — `hadAdditionalIncomeForSchedule1` (boolean gate)
2. `statementUploadCheck` — `received1099G`, `uploaded1099G`, `received1099C`, `uploaded1099C`, `receivedForm2555/8853/8889`, `confirmAllReceivedOtherIncomeStatementsUploaded`
3. `outOfScopeScreening` — `hasScheduleCBusinessIncomeOutOfScope`, `hasScheduleFFarmIncomeOutOfScope`
4. `schedule1Lines1to7` — line 1, 2a/2b, 4, 5, 7 (line 3/6 blocked by section 3)
5. `schedule1OtherIncome8` — all 8a through 8v fields
6. `otherIncomeItems8z` — repeatable list of `{description, amount}` items (multiplicity: multiple)
7. `importedStatementFields` (backend-only, readOnly) — 6 imported fields
8. `computedOutputs` (backend-only, readOnly) — computed line 9 / line 10 / line 8

The spouse form mirrors sections 1, 3–6 but omits `statementUploadCheck` (statement gating lives on taxpayer form only).

### 5.3 Less-common items toggle

The taxpayer Angular component shows lines 8a through 8l by default and hides lines 8m through 8q behind a "Show less common items" toggle (confirmed by E2E test).

---

## 6. Unit test coverage

All tests in `TaxReturnComputeServiceTest.java`.

| Test method | Covers |
|---|---|
| `computesSchedule1AndLine8FromOtherIncomesForms` | Full round-trip: taxpayer + spouse forms merged; lines 1/2a/4/5/7, 8a/8b/8d/8e/8f/8r/8s/8v/8z computed correctly; attachment stubs (Form 4797, 4684, Schedule E, Form 8853, Form 8889) produced |
| `computesForm1040Lines11aAnd11bFromLines9And10` | Line 8 feeds line 9, which feeds line 11a AGI |
| `computesForm1040Line9TotalIncomeFromTaxableFeederLines` | Line 8 = 150 from taxableRefunds + W-2 wages → line 9 = 1,150 |
| `flagsOutOfScopeScheduleCBusinessIncomeInOtherIncomes` | `OTHER_INCOME_SCHEDULE_C_OUT_OF_SCOPE` blocking flag emitted |
| `flagsIncomeAdjustmentsStatementAndOutOfScopeGaps` (adjacent) | Statement gating flags for line 10 adjustments (not line 8, but same pattern) |
| (Form 8814 line 12 via `computesSchedule1AndLine8FromOtherIncomesForms`) | `otherIncomeMedicaidWaiverPayments` = -100 from Medicaid waiver form |

**Total line-8-specific unit tests: approximately 3–4 dedicated tests** (plus coverage through other multi-line tests).

---

## 7. E2E test coverage

### 7.1 `line8-other-incomes.spec.ts`

| Test | What it verifies |
|---|---|
| `Save is blocked when received1099G is Yes but uploaded1099G is No` | UI validation: save blocked by statement gate mismatch |
| `Line 8 flow computes Schedule 1 line 10 from taxpayer inputs` | Full compute: lines 1/2a/5/7, 8a/8b/8v, 8z → `otherIncomeSchedule1=365` |
| `No additional-income path leaves line 8 unset` | `hadAdditionalIncomeForSchedule1=No` → `otherIncomeSchedule1=null` |
| `Out-of-scope blocker message appears when Schedule C is answered Yes` | UI blocker element appears |
| `Unemployment repayment amount field only appears when repaid answer is Yes` | UI conditional show/hide |
| `Less common items toggle shows and hides line 8m through 8q fields` | Toggle behavior for lines 8m–8q |

**6 E2E tests** in `line8-other-incomes.spec.ts`.

### 7.2 `line8-statement-forms.spec.ts`

| Test | What it verifies |
|---|---|
| `Line 8 output attachments are generated from line 8d, 8e, and 8f amounts` | Required-attachment stubs for Form 2555, Form 8853, Form 8889 produced when amounts nonzero |

**1 E2E test** in `line8-statement-forms.spec.ts`.

**Total: 7 E2E tests for line 8.**

---

## 8. Known gaps

| Gap | Severity | Status |
|---|---|---|
| Top-of-Schedule-1 1099-K entry space not modeled | Medium | Not in outstanding.md |
| Line 8m Olympic exclusion (line 24c) not computed — gross reported but exclusion not applied | Medium | Not in outstanding.md |
| Line 8n/8o section 962 election not used to suppress 8n/8o reporting on Schedule 1 | Medium | Not in outstanding.md |
| 1099-G statement entries not auto-parsed into line 1 / line 7 — imported fields in YAML exist but are user-populated, not statement-driven | Medium | Not in outstanding.md |
| Line 1 tax-benefit rule worksheet not computed — user enters taxable portion directly | Low | Not in outstanding.md |
| Unemployment repayment > $3,000 Pub. 525 repayment rules not implemented | Low | Not in outstanding.md |
| Form 8853 standalone compute output not produced (required-attachment only) | Low | Partially in outstanding.md (semantic PDF) |
| Form 8889 standalone compute output not produced (required-attachment only) | Low | Partially in outstanding.md |
| Form 4797 full output model not produced (required-attachment only) | Medium | Deferred in outstanding.md |
| Schedule C and Schedule F output-form wiring deferred | Low | In outstanding.md |
| Line 8z type-and-amount detail preserved in output but no PDF fill for individual 8z rows | Low | Not in outstanding.md |
| E2E coverage for spouse-specific 8a–8v fields | Low | Not covered |
| E2E coverage for imported statement auto-population paths | Medium | Not covered |
