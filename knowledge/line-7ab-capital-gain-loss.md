# Knowledge — Lines 7a/7b Capital Gain or (Loss)

Tax year: **2025**  
Last updated: **2026-04-16**

---

## 1. What is implemented

### 1.1 Overall computation entry point

| Location | Method | Backend file |
|---|---|---|
| `TaxReturnComputeService.java` | `computeCapitalGainLoss()` | ~line 5388 |
| `TaxReturnComputeService.java` | `computeCapitalForPerson()` | ~line 5912 |
| `TaxReturnComputeService.java` | `validateCapitalStatementGating()` | ~line 6401 |
| `TaxReturnComputeService.java` | `buildCapitalTransactionsFrom1099B()` | ~line 6006 |
| `TaxReturnComputeService.java` | `buildCapitalTransactionsFrom1099Da()` | ~line 6043 |
| `TaxReturnComputeService.java` | `buildManualTransactions()` | ~line 6080 |
| `TaxReturnComputeService.java` | `buildDirectAggregationRow()` | ~line 6109 |
| `TaxReturnComputeService.java` | `buildForm8949AggregateRow()` | ~line ~6130 |
| `TaxReturnComputeService.java` | `buildForm8949Pages()` | ~line 6155 |

### 1.2 Internal records

```java
private record CapitalGainLossComputation(
    BigDecimal line7aCapitalGainOrLoss,
    Boolean line7bScheduleDNotRequired,
    Boolean line7bIncludesChildCapitalGainLoss,
    BigDecimal line7bChildAmountFromForm8814Line10,
    Boolean scheduleDRequired,
    Boolean form8949Required,
    ScheduleD scheduleD,
    Form8949 form8949)

private record CapitalPersonTotals(
    BigDecimal capitalGainDistributions,  // box 2a total (stmt + manual)
    BigDecimal box2bTotal,               // unrecaptured §1250
    BigDecimal box2cTotal,               // §1202 gain
    BigDecimal box2dTotal,               // collectibles (28%)
    BigDecimal manualOtherGainAdjustments,
    BigDecimal manualOtherLossAdjustments,
    BigDecimal nomineeCapitalGainDistributions,
    // Schedule D feeder amounts (lines 4/5/11/12)
    BigDecimal shortTermOtherFormsGainLossLine4,
    BigDecimal shortTermScheduleK1GainLossLine5,
    BigDecimal longTermOtherFormsGainLossLine11,
    BigDecimal longTermScheduleK1GainLossLine12,
    // Rate-gain worksheet amounts (lines 18/19)
    BigDecimal twentyEightPercentRateGainWorksheetAmountLine18,
    BigDecimal unrecapturedSection1250GainWorksheetAmountLine19,
    // Carryovers
    BigDecimal priorYearCapitalLossCarryoverShortTerm,  // → Schedule D line 6
    BigDecimal priorYearCapitalLossCarryoverLongTerm,   // → Schedule D line 14
    BigDecimal priorYearScheduleDLine21AllowableLoss,    // fallback carryover
    // Direct Schedule D aggregation overrides (lines 1a / 8a)
    BigDecimal manualShortTermDirectAggregationProceedsLine1a,
    BigDecimal manualShortTermDirectAggregationBasisLine1a,
    BigDecimal manualShortTermDirectAggregationAdjustmentsLine1a,
    BigDecimal manualLongTermDirectAggregationProceedsLine8a,
    BigDecimal manualLongTermDirectAggregationBasisLine8a,
    BigDecimal manualLongTermDirectAggregationAdjustmentsLine8a,
    // Manual Form 8949 transactions list
    List<Map<String, Object>> manualForm8949Transactions,
    // Boolean gates
    boolean hadCapitalAssetSalesOrExchanges,
    boolean hasCapitalLossesForTaxYear,
    boolean hasCapitalLossCarryoverFromPriorYear,
    boolean hasForm2439UndistributedCapitalGains,
    boolean hasOtherScheduleDSourceForms,
    boolean hasAny1099DivSpecialBoxes)
```

### 1.3 Exception 1 (no Schedule D) logic

Exception 1 applies when ALL of:
```
!hasQofDeferral
&& !hasSalesOrExchanges
&& !hasCapitalLosses
&& !hasCarryover
&& !hasForm2439
&& !hasOtherSources
&& !hasSpecial1099DivBoxes
&& !hasNonZeroAmount(legacyNetOtherAdjustments)
```

When Exception 1:
```
line7aBase = capitalGainDistributions − nomineeAdjustments
line7b.scheduleDNotRequired = true
```
No Schedule D produced, no Form 8949 produced.

### 1.4 Schedule D path

When Exception 1 does not apply:
- **Schedule D lines 1a/8a** (direct aggregation, no Form 8949):
  - Box A / G transactions (short-term, basis reported to IRS, no QOF, no wash-sale adjustment) → line 1a
  - Box D / J transactions (long-term, basis reported to IRS, no QOF, no wash-sale adjustment) → line 8a
- **Schedule D lines 1b/2/3** (short-term Form 8949 aggregates by box):
  - Box A/G → line 1b
  - Box B/H → line 2 (short-term, basis NOT reported to IRS)
  - Box C/I → line 3 (short-term, noncovered/other)
- **Schedule D lines 8b/9/10** (long-term Form 8949 aggregates by box):
  - Box D/J → line 8b
  - Box E/K → line 9 (long-term, basis NOT reported)
  - Box F/L → line 10 (long-term, noncovered/other)
- **Schedule D line 4** — short-term gain/loss from other feeder forms (user-entered)
- **Schedule D line 5** — short-term Schedule K-1 gain/loss (user-entered)
- **Schedule D line 6** — short-term capital loss carryover (from prior year)
- **Schedule D line 7** — net short-term = sum(1a..6)
- **Schedule D lines 11/12** — long-term feeder forms and K-1 (user-entered)
- **Schedule D line 13** — capital gain distributions (from 1099-DIV box 2a, minus nominee, when Schedule D is required)
- **Schedule D line 14** — long-term capital loss carryover
- **Schedule D line 15** — net long-term = sum(8a..14)
- **Schedule D line 16** — total = line 7 + line 15
- **Schedule D line 17** — Yes if lines 15 and 16 are both gains
- **Schedule D line 18** — 28% rate gain = box2c + box2d + user worksheet amount
- **Schedule D line 19** — unrecaptured §1250 gain = box2b + user worksheet amount
- **Schedule D line 20** — QDCG worksheet Yes/No (Yes when line 18=0 and line 19=0)
- **Schedule D line 21** — allowed capital loss = min(|line16|, lossLimit)
- **Schedule D line 22** — qualified dividends Yes/No

**Loss mapping to Form 1040 line 7a:**
```
if line16 >= 0:   line7aBase = line16
if line16 < 0:    line7aBase = −min(|line16|, lossLimit)
lossLimit = $3,000 (all filers except MFS) | $1,500 (MFS)
```

**Form 8949** is produced when:
```
scheduleDRequired AND (!form8949Pages.isEmpty() OR hasQofDeferral)
```
Form 8949 pages are 11 transactions per page, grouped by box letter.

### 1.5 Form 8949 box coding

| Box | Term | Basis reported to IRS | Direct to Schedule D? |
|---|---|---|---|
| A | Short | Yes | Yes → line 1a |
| B | Short | No | No → line 1b via Form 8949 |
| C | Short | N/A (noncovered/other) | No → line 3 via Form 8949 |
| D | Long | Yes | Yes → line 8a |
| E | Long | No | No → line 8b via Form 8949 |
| F | Long | N/A (noncovered/other) | No → line 10 via Form 8949 |
| G | Short (1099-DA) | Yes | Yes → line 1a |
| H | Short (1099-DA) | No | No → line 1b via Form 8949 |
| I | Short (1099-DA) | N/A | No → line 3 via Form 8949 |
| J | Long (1099-DA) | Yes | Yes → line 8a |
| K | Long (1099-DA) | No | No → line 8b via Form 8949 |
| L | Long (1099-DA) | N/A | No → line 10 via Form 8949 |

### 1.6 Box derivation logic

**1099-B:** `derive1099BBox()`
- Reads `applicableCheckboxOnForm8949` (explicit user override first)
- Else: `shortTerm=true AND basisReportedToIRS=true` → A; `shortTerm AND !basis` → B
- `longTerm=true AND basisReportedToIRS=true` → D; `longTerm AND !basis` → E
- Wash-sale adjustment (`washSaleLossDisallowedAmount`) → code "W" appended, forces Form 8949

**1099-DA:** `derive1099DaBox()`
- `copyA_box6_short_term` + `copyA_box2_basis_reported_to_irs` → G or H
- `copyA_box6_long_term` + `copyA_box2_basis_reported_to_irs` → J or K
- QOF flag (`copyA_box3b_qof`) → forces Form 8949 even if basis-reported

### 1.7 Line 7b checkboxes

| Checkbox | Condition |
|---|---|
| `line7bScheduleDNotRequired` | exception1 == true |
| `line7bIncludesChildCapitalGainLoss` | `includesChildCapitalGainLossFromForm8814` == true |
| `line7bChildAmountFromForm8814Line10` | form8814Line10Total (passed in from Form 8814 compute) |

### 1.8 Form 8814 interaction

`computeCapitalGainLoss()` receives pre-computed `includesChildCapitalGainLossFromForm8814` (boolean) and `form8814Line10Total` (BigDecimal) from `prepare()`. It does NOT call Form 8814 compute itself.

When child capital gain applies:
- If Exception 1: `line7a = line7aBase + childAmount`
- If Schedule D required: `childAmount` is included in Schedule D line 13 (`line13Amount` = capGainDistributions − nominee, and child is a separate `childAmount` added after line7aBase)

**Note:** In the current backend, when Schedule D is required and there is a child capital gain, the child amount is added to `line7a` as `line7aBase + childAmount`. It is NOT separately showing on Schedule D line 13 in that case — the line 13 only shows the taxpayer/spouse's own distributions from 1099-DIV. This is a behavioral gap vs. spec: the spec says child amount goes on Schedule D line 13 when Schedule D is required.

### 1.9 Carryover fallback

When both `priorYearCapitalLossCarryoverShortTerm` and `priorYearCapitalLossCarryoverLongTerm` are zero but `priorYearScheduleDLine21AllowableLoss` (the prior year's "allowed" loss from Schedule D line 21) is non-zero, the backend uses that as the short-term carryover. This is a simplified approximation — the IRS requires separate short-term and long-term carryover tracking (Schedule D lines 6 and 14 respectively).

### 1.10 QOF detection

`hasQofDeferral` is set when ANY of:
- `capitalTaxpayer.hasQofDeferralOrTermination == true` (personal form)
- Any 1099-B or 1099-DA transaction has `proceedsFromQOF` or `copyA_box3b_qof == true`
- `hasStatementQofIndicator()` finds QOF indicator in personal form

When QOF detected: Exception 1 is blocked; `scheduleD.qualifiedOpportunityFundDisposedYes = true`.

---

## 2. Output model

| JSON field | Java class/field | Meaning |
|---|---|---|
| `form1040.income.capitalGainLoss` | `Income.capitalGainLoss` | Line 7a amount |
| `form1040.income.line7bScheduleDNotRequired` | `Income.line7bScheduleDNotRequired` | Line 7b checkbox 1 |
| `form1040.income.line7bIncludesChildCapitalGainLoss` | `Income.line7bIncludesChildCapitalGainLoss` | Line 7b checkbox 2 |
| `form1040.income.line7bChildAmountFromForm8814Line10` | `Income.line7bChildAmountFromForm8814Line10` | Line 7b entry space (Form 8814 line 10) |
| `scheduleD` | `TaxReturnComputation.scheduleD` | Full Schedule D output |
| `form8949` | `TaxReturnComputation.form8949` | Full Form 8949 (pages by box) |

---

## 3. Input personal forms

| Form ID | Firestore path | Person | Key fields |
|---|---|---|---|
| `capital-gain-loss-taxpayer` | `users/{uid}/capital-gain-loss-taxpayer` | Taxpayer | See §3.1 below |
| `capital-gain-loss-spouse` | `users/{uid}/capital-gain-loss-spouse` | Spouse | Same fields (MFJ only) |

### 3.1 Key personal form fields

**Screening / gating:**
- `hadCapitalGainOrLoss` (boolean) — master gate
- `hasUploadedAtLeastOneCapitalStatement` (boolean)
- `confirmAllReceivedCapitalStatementsUploaded` (boolean)
- `received1099DivWithCapitalGainDistributions` / `uploaded1099DivWithCapitalGainDistributions`
- `received1099BOr1099Da` / `uploaded1099BOr1099Da`
- `receivedForm2439` / `uploadedForm2439`
- `receivedOtherScheduleDSourceStatements` / `uploadedOtherScheduleDSourceStatements`

**Situation flags:**
- `hadCapitalAssetSalesOrExchanges` — forces Schedule D
- `hasQofDeferralOrTermination` — blocks Exception 1, sets QOF checkbox
- `hasCapitalLossesForTaxYear` — forces Schedule D
- `hasCapitalLossCarryoverFromPriorYear` — forces Schedule D
- `hasForm2439UndistributedCapitalGains` — forces Schedule D
- `hasOtherScheduleDSourceForms` — forces Schedule D (covers 6252, 4797, 4684, 6781, 8824)
- `hasAny1099DivBoxes2b2c2dAmounts` — forces Schedule D

**Manual amounts:**
- `manualCapitalGainDistributionsNotOnStatements` — added to box2a total
- `nomineeCapitalGainDistributionsToSubtract` — subtracted from distributions
- `manualOtherCapitalGainAdjustments` → Schedule D line 11
- `manualOtherCapitalLossAdjustments` → Schedule D line 11 (negate)
- `shortTermOtherFormsGainLossLine4` → Schedule D line 4
- `shortTermScheduleK1GainLossLine5` → Schedule D line 5
- `longTermOtherFormsGainLossLine11` → Schedule D line 11
- `longTermScheduleK1GainLossLine12` → Schedule D line 12
- `twentyEightPercentRateGainWorksheetAmountLine18` → Schedule D line 18
- `unrecapturedSection1250GainWorksheetAmountLine19` → Schedule D line 19

**Carryovers:**
- `priorYearCapitalLossCarryoverShortTerm` → Schedule D line 6
- `priorYearCapitalLossCarryoverLongTerm` → Schedule D line 14
- `priorYearScheduleDLine21AllowableLoss` — fallback when per-term carryovers absent
- `importedPriorYearCapitalLossCarryoverShortTerm` (imported/read-only)
- `importedPriorYearCapitalLossCarryoverLongTerm` (imported/read-only)
- `importedPriorYearCapitalLossCarryoverTotal` (imported/read-only, fallback for short)

**Direct Schedule D aggregation (bypass Form 8949):**
- `manualShortTermDirectAggregationProceedsLine1a`
- `manualShortTermDirectAggregationBasisLine1a`
- `manualShortTermDirectAggregationAdjustmentsLine1a`
- `manualLongTermDirectAggregationProceedsLine8a`
- `manualLongTermDirectAggregationBasisLine8a`
- `manualLongTermDirectAggregationAdjustmentsLine8a`

**Manual Form 8949 transaction list** (`manualForm8949Transactions[]`):
- `transactionDescription`, `transactionTerm` (short/long), `form8949Box` (A–L)
- `dateAcquired`, `dateSoldOrDisposed`, `proceeds`, `costOrOtherBasis`
- `adjustmentCode`, `adjustmentAmount`, `transactionNotes`

---

## 4. Input statements

| Statement | Collection | TIN field | Key fields consumed |
|---|---|---|---|
| 1099-DIV | `users/{uid}/1099-div` | `recipientTIN` | `totalCapitalGainDistributionsAmount` (box 2a), `unrecapturedSection1250GainAmount` (box 2b), `section1202GainAmount` (box 2c), `collectibles28PercentGainAmount` (box 2d) |
| 1099-B | `users/{uid}/1099-b` | `recipientTIN` | `applicableCheckboxOnForm8949`, `shortTerm`, `longTerm`, `basisReportedToIRS`, `proceedsAmount`, `costOrOtherBasisAmount`, `washSaleLossDisallowedAmount`, `proceedsFromQOF`, `descriptionOfProperty`, `dateAcquired`, `dateSoldOrDisposed`, `accountNumber` |
| 1099-DA | `users/{uid}/1099-da` | `copyA_recipient_tin` | `copyA_box6_short_term`, `copyA_box6_long_term`, `copyA_box2_basis_reported_to_irs`, `copyA_box1f_proceeds`, `copyA_box1g_cost_or_other_basis`, `copyA_box1i_wash_sale_loss_disallowed`, `copyA_box3b_qof`, `copyA_box1d_date_acquired`, `copyA_box1e_date_sold_or_disposed`, `copyA_box1a_code_for_digital_asset`, `copyA_box1b_name_of_digital_asset`, `copyA_box1c_number_of_units` |
| Form 2439 | `users/{uid}/form-2439` | — | `hasForm2439UndistributedCapitalGains` flag gates Schedule D; entry data read but no standalone output form |
| Form 6252 | `users/{uid}/form-6252` | — | Entries read; `hasOtherScheduleDSourcesFromStatements` → gates Schedule D; no standalone 6252 output |
| Form 4797 | `users/{uid}/form-4797` | — | Same — read for gating, no output form |
| Form 4684 | `users/{uid}/form-4684` | — | Same |
| Form 6781 | `users/{uid}/form-6781` | — | Same |
| Form 8824 | `users/{uid}/form-8824` | — | Same |
| Schedule K-1 (1041) | `users/{uid}/schedule-k1-form-1041` | — | Gating only currently; user-entered amounts via `shortTermOtherFormsGainLossLine4` etc. |
| Schedule K-1 (1065) | `users/{uid}/schedule-k1-form-1065` | — | Same |
| Schedule K-1 (1120-S) | `users/{uid}/schedule-k1-form-1120-s` | — | Same |
| child-interest-dividends | `users/{uid}/child-interest-dividends` | per-child | `line3CapGainDistributions` → Form 8814 line 10 → fed into `form8814Line10Total` |

---

## 5. Downstream consumers

| Consumer | Input from 7a/7b |
|---|---|
| Form 1040 line 9 (total income) | `capitalGainLoss` (line 7a) |
| Line 16 tax computation | `scheduleD` (Schedule D tax worksheet vs. QDCG worksheet routing) |
| Social Security benefits worksheet (line 6b) | `line7a` as worksheet line 3 component |
| Form 6251 (AMT) | `scheduleD` lines 18/19 used in AMT preference computation |
| PDF export — Form 1040 | `line7a_capital_gain_or_loss`, `line7b_schedule_d_not_required`, `line7b_includes_child_capital_gain_loss`, `line7b_child_amount_from_form8814_line10` |
| PDF export — Schedule D | All Schedule D line fields |
| PDF export — Form 8949 | All Form 8949 page/transaction fields |

---

## 6. Blocking flags emitted

| Flag code | Condition |
|---|---|
| `CAPITAL_STATEMENT_UPLOAD_REQUIRED` | `hadAnyCapital=true` AND `!hasUploadedAtLeastOneCapitalStatement` |
| `CAPITAL_STATEMENT_UPLOAD_REQUIRED` | `hadAnyCapital=true` AND `!confirmAllReceivedCapitalStatementsUploaded` |
| `MISSING_UPLOADED_1099_DIV_CAPITAL` | `received1099DivWithCapitalGainDistributions=true` AND `!uploaded1099DivWithCapitalGainDistributions` AND no 1099-DIV entries exist |
| (implicit) | `received1099BOr1099Da=true` AND `!uploaded1099BOr1099Da` AND no 1099-B/DA entries exist |

---

## 7. Unit tests (TaxReturnComputeServiceTest.java)

| Test method (approx.) | Covers |
|---|---|
| `computesCapitalGainLossException1WithoutScheduleD` | Exception 1: box 2a + manual distributions + nominee subtraction; no Schedule D |
| `computesCapitalGainLossWithScheduleDAndForm8949WhenSalesExist` | 1099-B with box B (noncovered) sale + 1099-DIV box 2a → Schedule D + Form 8949 |
| `directScheduleDAggregationBoxAProducesLine1aWithoutForm8949` | Box A sale (basis reported, no wash) → line 1a direct, no Form 8949 |
| `allowsManualCapitalDetailWithoutUploadedStatements` | Box C manual transaction → Schedule D + Form 8949 |
| `includesChildCapitalGainCreatesForm8814AndUpdatesLine7b` | Form 8814 line 10 → line 7b child checkbox + child amount on line 7a |
| `capitalStatementUploadGatingEmitsBlockingFlags` | Blocking flag when `hadCapitalGainOrLoss=true` but no statements |
| `form8814NoEntriesProducesEmptyList` | No child entries → empty form8814List |
| `form8814Line4AtOrBelowThresholdSkipsProportionalComputation` | Child income ≤ $2,700 → line 4 = gross; no capital gain split |
| `form8814Line4AboveThresholdComputesProportionalLines` | Child income > $2,700 → proportional allocation to lines 10/12 |
| `form8814Line10FeedsCapitalGainLine7a` | Form 8814 line 10 (capital gain dist.) → line 7a |
| `form8814GrossIncomeAtLimitEmitsBlockingFlag` | Child gross ≥ $13,500 → FORM8814_CHILD_GROSS_INCOME_TOO_HIGH |
| `form8814MultipleChildrenAggregatesLine12AndLine15` | Two children → two Form 8814 instances, aggregated line 12 |

---

## 8. E2E tests (line7ab-capital-gain-loss.spec.ts)

| Test | What it verifies |
|---|---|
| `Taxpayer capital gain/loss form blocks save when no statements are uploaded` | UI upload gate: save blocked when no entries exist |
| `Line 7a/7b flow computes and adds Schedule D/Form 8949/Form 8814 when required` | 1099-DIV + 1099-B + child entry → line7a=530, Schedule D, Form 8949, Form 8814 sidebar items visible |
| `Low-capital-gain path keeps Schedule D/Form 8949/Form 8814 out of return` | Exception 1: only 1099-DIV box 2a → line7a=300, scheduleDNotRequired=true, no Schedule D/8949/8814 |

**Note:** E2E tests use `selectOptionWithRetry` (correct — the capital gain form uses `p-select` dropdowns, NOT radio buttons).

---

## 9. Frontend forms

| Form ID | Angular component | Person |
|---|---|---|
| `capital-gain-loss-taxpayer` | `form-capital-gain-loss-taxpayer.component.ts` | Taxpayer |
| `capital-gain-loss-spouse` | `form-capital-gain-loss-spouse.component.ts` | Spouse |
| `capital-statement` | `form-capital-statement.component.ts` | Statement entry form (1099-B / 1099-DA / etc.) |
| — | `capital-statement-configs.ts` | Statement form field configs per form type |

**Page object:** `e2e/tests/pages/personal-forms/capital-gain-loss.page.ts` — `CapitalGainLossPage` extends `BasePersonalFormPage`.

**UI notes:**
- Screening field `hadCapitalGainOrLoss` uses `p-select` dropdown (not radio button — consistent with original form design)
- Statement count pills shown for each form type in upload-check section
- Manual Form 8949 transaction section allows adding per-transaction detail with box selection
- Direct Schedule D aggregation and other manual input fields displayed in structured sections

---

## 10. Identified gaps (see also outstanding.md)

| Gap | Severity | Status |
|---|---|---|
| Form 2439 (undistributed LT gains) — entries read, gate Schedule D, but no Form 2439 output artifact | Medium | Deferred (in outstanding.md) |
| Form 6252 (installment sales) — same as 2439 | Medium | Deferred (in outstanding.md) |
| Form 6781 (§1256 contracts) — same | Medium | Deferred (in outstanding.md) |
| Form 8824 (like-kind exchanges) — same | Medium | Deferred (in outstanding.md) |
| Schedule K-1 capital attachments — gating works, no per-K-1 output artifact | Medium | Deferred (in outstanding.md) |
| Form 8997 (Annual Report of QOF Investments) — not produced | Medium | Not yet in outstanding.md |
| Capital loss carryover worksheet (per-type Pub. 550 tracking) — simplified fallback only | Low | Not yet in outstanding.md |
| Form 8814 child amount on Schedule D line 13 when Schedule D required — child amount added directly to line7a instead of going via Schedule D line 13 | Low | Not yet in outstanding.md |
| E2E coverage for capital statement forms (1099-DA, 4684, 4797, 6252, 6781, 8824, K-1) — removed spec | High | In outstanding.md |
| Nonbusiness bad debt (Schedule D short-term loss) — not modeled | Low | Not in outstanding.md |
| Nominee capital gain distributions — user-entered subtraction only; no 1099-DIV/1096 nominee statement artifact | Low | Not in outstanding.md |
| Personal-use loss with 1099-S — no 1099-S form type | Low | Not in outstanding.md |

---

## 11. Compute order dependency

`computeCapitalGainLoss()` runs in `prepare()` **before:**
- `computeSocialSecurityBenefits()` (needs `line7a` for worksheet line 3)
- `buildIncome()` / `computeTotalIncome()` (line 9 needs `line7a`)
- `computeLine16()` (needs `scheduleD` for tax worksheet routing)

`computeCapitalGainLoss()` receives from `prepare()`:
- `form1099DivEntries`, `form1099BEntries`, `form1099DaEntries` (loaded statements)
- `form2439Entries`, `form6252Entries`, `form4797Entries`, `form4684Entries`, `form6781Entries`, `form8824Entries`
- `formK11041Entries`, `formK11065Entries`, `formK11120SEntries`
- `capitalGainLossTaxpayer`, `capitalGainLossSpouse` (personal forms)
- `you`, `spouse` (identification forms — for SSN TIN matching)
- `includesChildCapitalGainLossFromForm8814`, `form8814Line10Total` — pre-computed from `computeChildInterestDividends()`
- `filingStatus` — for MFS loss limit ($1,500 vs $3,000)
