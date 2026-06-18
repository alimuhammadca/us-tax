# Dependencies — Lines 2a/2b Interest Income

This document covers every input and output for the lines 2a/2b computation pass.

Tax year: **2025**

---

## Input personal forms

| Form ID | Firestore path | Person | Fields consumed |
|---|---|---|---|
| `interest-income-taxpayer` | `users/{uid}/interest-income-taxpayer` | Taxpayer / Family Head | `hadInterestIncome`, `manualTaxableInterestNotOnStatements`, `manualTaxExemptInterestNotOnStatements`, `taxExemptStatedInterestFrom1099OidBox2`, `taxablePortionFrom1099OidBox2Override`, `hasInterestAdjustments`, `accruedInterestPaidAdjustment`, `nomineeInterestAdjustment`, `taxableBondPremiumAdjustmentNotInStatements`, `treasuryBondPremiumAdjustmentNotInStatements`, `taxExemptBondPremiumAdjustmentNotInStatements`, `oidAcquisitionPremiumAdjustmentNotInStatements`, `claimsSavingsBondExclusionForm8815`, `savingsBondExclusionAmount`, `payerAlreadyReportedNetInterestOrOid`, `reducingInterestBelow1099ByBondPremium`, `reducingOidBelow1099ByAcquisitionPremium`, `hasForeignFinancialSituation`, `hasForeignAccountForScheduleBPartIII`, `hasFbarRequirement`, `hasForeignTrustDistributionOrTransfer` |
| `interest-income-spouse` | `users/{uid}/interest-income-spouse` | Spouse (MFJ only) | `hadInterestIncome`, `manualTaxableInterestNotOnStatements`, `manualTaxExemptInterestNotOnStatements`, `taxExemptStatedInterestFrom1099OidBox2`, `taxablePortionFrom1099OidBox2Override`, `accruedInterestPaidAdjustment`, `nomineeInterestAdjustment`, `taxableBondPremiumAdjustmentNotInStatements`, `treasuryBondPremiumAdjustmentNotInStatements`, `taxExemptBondPremiumAdjustmentNotInStatements`, `oidAcquisitionPremiumAdjustmentNotInStatements` |
| `seller-financed-loan` (taxpayer/spouse rows) | `pf_seller_financed_loan` (V39 entity) | Per-buyer rows | `buyerName`, `buyerAddress`, `buyerSsnOrEin`, `interestAmount` — independent Schedule B Part I trigger, no $1,500 threshold |
| `identification-taxpayer` | `users/{uid}/identification-taxpayer` | Taxpayer | `ssn` — used for 1099 entry attribution via `belongsToPerson()` |
| `identification-spouse` | `users/{uid}/identification-spouse` | Spouse | `ssn` — used for 1099 entry attribution via `belongsToPerson()` |
| `identification-dependent` | `users/{uid}/dependents/{depId}` | Each dependent | `dependentSSN` — matched against `recipientTIN` on child 1099-INT statements for Form 8814 statement-driven path |

---

## Input statement forms

| Statement type | Firestore collection | Fields consumed | Destination |
|---|---|---|---|
| 1099-INT | `users/{uid}/1099-int` | `recipientTIN`, `interestIncomeAmount` (box 1), `usSavingsBondsTreasuryInterestAmount` (box 3), `bondPremiumAmount` (box 11), `bondPremiumTreasuryAmount` (box 12), `taxExemptInterestAmount` (box 8), `specifiedPrivateActivityBondInterestAmount` (box 9), `bondPremiumTaxExemptAmount` (box 13) | line 2b (boxes 1, 3, 11, 12), line 2a (box 8 net of box 13), Form 6251 line 2g (box 9 — AMT preference; NOT added to line 2a) |
| 1099-OID | `users/{uid}/1099-oid` | `recipientTIN`, `originalIssueDiscountAmount` (box 1), `otherPeriodicInterestAmount` (box 2), `acquisitionPremiumAmount` (box 6), `taxExemptOidAmount` (box 11) | line 2b (box 1 net of box 6, plus user-classified taxable portion of box 2), line 2a (box 11, plus user-classified tax-exempt portion of box 2) |
| 1099-DIV | `users/{uid}/1099-div` | `recipientTIN`, `exemptInterestDividendsAmount` (box 12), `specifiedPrivateActivityBondDividendsAmount` (box 13) | box 12 → line 2a; box 13 → Form 6251 line 2g (subset of box 12; NOT added to line 2a) |

**1099-INT fields read elsewhere (NOT by interest computation):**

| Field | Box | Routed to |
|---|---|---|
| `foreignTaxPaidAmount` | box 6 | Form 1116 / Schedule 3 line 1 (foreign tax credit) — does NOT reduce line 2b |

---

## Output JSON fields

| JSON path | Java class / field | Meaning |
|---|---|---|
| `form1040.income.taxExemptInterest` | `Income.taxExemptInterest` | Form 1040 line 2a (informational only — not in AGI) |
| `form1040.income.taxableInterest` | `Income.taxableInterest` | Form 1040 line 2b (flows into line 9) |
| `scheduleB` | `ScheduleB` (null when not required) | Schedule B — Interest and Ordinary Dividends |
| `scheduleB.interestItems` | `List<ScheduleBInterestItem>` | Per-payer interest detail rows for Schedule B Part I (seller-financed first, then 1099-INT/OID/manual/adjustment items; taxpayer rows before spouse rows) |
| `scheduleB.line2TotalInterest` | `ScheduleB.line2TotalInterest` | Total interest before exclusion |
| `scheduleB.line3ExcludableInterestSeriesEeI` | `ScheduleB.line3ExcludableInterestSeriesEeI` | Savings bond exclusion (Form 8815) |
| `scheduleB.line4TaxableInterest` | `ScheduleB.line4TaxableInterest` | Equals `form1040.income.taxableInterest` |
| `scheduleB.line6TotalOrdinaryDividends` | `ScheduleB.line6TotalOrdinaryDividends` | Equals `form1040.income.ordinaryDividends` (line 3b) |
| `scheduleB.line7aForeignAccountOrSignatureAuthority` | `ScheduleB.line7aForeignAccountOrSignatureAuthority` | Schedule B Part III Q7a |
| `scheduleB.line7aFbarRequired` | `ScheduleB.line7aFbarRequired` | FBAR required flag (aggregate value > $10,000); sourced from dedicated `hasFbarRequirement` field, NOT same boolean as line 7a |
| `scheduleB.line8ForeignTrustOrDistribution` | `ScheduleB.line8ForeignTrustOrDistribution` | Schedule B Part III Q8 |
| `scheduleB.dividendItems` | `List<ScheduleBInterestItem>` | Per-payer dividend detail rows for Schedule B Part II (shared with lines 3a/3b) |
| `form6251.line2gPrivateActivityBondInterest` | `Form6251.line2gPrivateActivityBondInterest` | AMT preference item — sum of 1099-INT box 9 + 1099-DIV box 13 across all persons |

---

## Excluded items (by design)

| Item | Reason |
|---|---|
| Line 2a | NOT added to line 9 / AGI / taxable income (informational only) |
| 1099-INT box 9 (PAB interest) | Already included in box 8; must not be double-counted into line 2a — feeds Form 6251 line 2g only |
| 1099-DIV box 13 (PAB dividends) | Already included in box 12; must not be double-counted into line 2a — feeds Form 6251 line 2g only |
| 1099-INT box 6 (foreign tax paid) | Does NOT reduce line 2b — flows to Form 1116 / Schedule 3 line 1 only |
| IRA / tax-deferred account interest | Tax-deferred, not tax-exempt — handled via lines 4 / 5 |

---

## Downstream consumers

| Consumer | Line / Form | Input from 2a/2b | Notes |
|---|---|---|---|
| Line 9 total income | `form1040.income.totalIncome` | `taxableInterest` (line 2b) | Line 2a excluded from AGI; line 2b is 2nd operand of `addNonNull` chain |
| Form 6251 line 2g | `Form6251.line2gPrivateActivityBondInterest` | `form6251Line2gPrivateActivityBondInterest` | Fed via `pabInterest` parameter to `computeLine17()` from box 9 + box 13 |
| Schedule B Part I | `ScheduleB` | All interest-related fields | Conditionally generated when `scheduleBRequired == true` |
| Schedule B Part II | `ScheduleB.line6TotalOrdinaryDividends` | Dividends from same computation | Shares Schedule B with dividends |
| Schedule B Part III | `ScheduleB.line7a/7aFbarRequired/line8` | Foreign account / FBAR / foreign trust answers | Sourced from taxpayer form only (return-level) |
| Form 1116 | `Form1116` | 1099-INT box 6 foreign tax paid | Read separately in `computeForm1116()` — not from interest computation result |
| EIC investment-income ceiling | EIC eligibility check | line 2b counts toward $11,950 (2025) ceiling | |
| Form 8814 statement-driven path | Child interest computation | 1099-INT box 1/3/11/12/8/13 with dependent SSN match | Routes to Form 8814 line 1a/1b |

---

## Blocking flags emitted

| Flag | Severity | Condition | Effect |
|---|---|---|---|
| `INTEREST_STATEMENT_UPLOAD_REQUIRED` | BLOCKING | `hadInterestIncome == true` for taxpayer or spouse but no 1099-INT / 1099-DIV / 1099-OID uploaded, OR upload-confirmation not set | Compute proceeds but return cannot be filed |
| `OID_BOX2_TAX_EXEMPT_EXCEEDS_TOTAL_{TAXPAYER,SPOUSE}` | BLOCKING (§17 non-overrideable) | User-classified tax-exempt portion of 1099-OID box 2 exceeds aggregate box 2 total | Would silently under-report taxable interest |
| `OID_BOX2_OVERRIDE_EXCEEDS_TOTAL_{TAXPAYER,SPOUSE}` | BLOCKING (overrideable) | User-supplied taxable override on 1099-OID box 2 exceeds aggregate box 2 total | Over-states line 2b — self-harm only |
| `SELLER_FINANCED_LOAN_MISSING_REQUIRED_FIELDS_{TAXPAYER,SPOUSE}` | BLOCKING (§17 non-overrideable) | Any seller-financed mortgage row missing buyer name / address / SSN-or-EIN / positive interest amount | |

Implicit zero-floor gates (silent normalization):

- per-entry premium > underlying interest → `subtractNonNegative` floors at zero
- person-level adjustments > aggregated taxable interest → zero-floor at the adjustment step
- savings bond exclusion > aggregated taxable-before-exclusion → zero-floor at line 2b

---

## Schedule B trigger chain (orchestrator OR)

Schedule B is required when ANY of these are true (per IRS 2025 Schedule B instructions):

- taxable interest > $1,500 OR ordinary dividends > $1,500
- seller-financed mortgage interest exists (`hasSellerFinancedLoans`) — independent trigger, no threshold
- accrued interest paid to the seller of a bond exists
- OID reduced below 1099-OID box 1 due to acquisition premium
- interest reduced below 1099-INT box 1 due to amortizable bond premium
- savings bond exclusion (Form 8815) claimed
- nominee interest exists (`hasNomineeInterest`) — independent trigger, no threshold
- foreign financial account / signature authority (`hasForeignAccountForScheduleBPartIII`)
- foreign trust distribution / transfer (`hasForeignTrustDistributionOrTransfer`)

---

## Compute order

1. `prepare(...)` constructs upstream Form 8814 / child-interest-dividends artifacts and reads filing status.
2. `computeInterestIncome(...)` is called with `isMfsReturn` (call site `TaxReturnComputeService.java:470`); invokes `computeInterestForPerson` for taxpayer and (on MFJ) spouse.
3. `computeDividendIncome(...)` is called from inside `computeInterestIncome` after both per-person interest results are computed.
4. The orchestrator builds `scheduleBInterestItems` / `scheduleBDividendItems` lists and emits Schedule B when `scheduleBRequired` is true.
5. `buildIncome(...)` sets `form1040.income.taxExemptInterest` and `taxableInterest` and aggregates line 9.

---

## Key invariants

- `line 2a` includes tax-exempt interest only
- `line 2b ≥ 0` (zero-floor at three stages: per-entry box 11/12, per-person adjustment step, per-return savings bond)
- `1099-INT box 9` and `1099-DIV box 13` must NOT be double-counted into line 2a (already in box 8 / box 12)
- net premium / acquisition premium reductions happen at most once per source
- `ScheduleB.PartI.line4TaxableInterest` must equal `Form1040.Line2b` when Schedule B is required
- `line 2a` is NOT in line 9 / AGI / taxable income (informational only)
- `line 2b` IS in line 9 (2nd operand of the `addNonNull` income chain)
- AMT subset amounts feed `Form 6251 line 2g` separately
- Schedule B Part III foreign-account / FBAR / foreign-trust questions are sourced from `interest-income-taxpayer` only (return-level)
- MFS guard suppresses spouse-side reads (interest + dividends + spouseSsn → null)

---

## MFS guard (orchestrator-level)

`computeInterestIncome` takes a `boolean isMfsReturn` parameter (signature at `TaxReturnComputeService.java:7738`). On MFS the three spouse-side reads are gated:

- `interestIncomeSpouse = isMfsReturn ? null : interestIncomeSpouseRaw`
- `dividendIncomeSpouse = isMfsReturn ? null : dividendIncomeSpouseRaw`
- `spouseSsn = isMfsReturn ? null : normalizeSsn(getString(spouse, "ssn"))`

Single guard protects lines 2a, 2b, 3a, 3b, Form 6251 line 2g, plus Schedule B Parts I & II detail items. Lock-in test: `mfsExcludesSpouseInterestFromLine2a`.

---

## Key backend locations

| Item | Location |
|---|---|
| `computeInterestIncome()` orchestrator | `TaxReturnComputeService.java:7738` |
| `computeInterestForPerson()` per-person aggregator | `TaxReturnComputeService.java:7996` |
| 1099-INT box 8 / box 13 subtraction (post-fix) | line 8045 |
| OID box 2 §17 validators | line 8123 / 8141 |
| Seller-financed required-fields §17 flag | line 8274 |
| Schedule B require chain (`hasSellerFinancedLoans`) | line 7942 |
| `buildScheduleB()` | `TaxReturnComputeService.java` ~line 7265 |
| `buildForm6251()` | `TaxReturnComputeService.java` ~line 7282 (stub; PAB interest fed to `computeLine17()` instead) |
| `ScheduleB.java` | `src/main/java/com/ustax/model/output/ScheduleB.java` |
| `ScheduleBInterestItem.java` | `src/main/java/com/ustax/model/output/ScheduleBInterestItem.java` |
| `Form6251.java` | `src/main/java/com/ustax/model/output/Form6251.java` |
| `PfSellerFinancedLoan` entity | `src/main/java/com/ustax/model/entity/` (V39 migration) |
| `InterestComputation` (record) | `TaxReturnComputeService.java` ~line 16286 |
| `InterestPersonTotals` (record) | `TaxReturnComputeService.java` ~line 16300 |
