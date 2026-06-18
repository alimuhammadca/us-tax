# Form 1040 Lines 2a and 2b — Tax-exempt and taxable interest

## 1. Line identity

- Form: `1040 / 1040-SR`
- Lines:
  - `2a` = `Tax-exempt interest`
  - `2b` = `Taxable interest`
- Concept: these lines report federal interest income after proper classification and required reductions
- PDF fields:
  - `2a` → `topmostSubform[0].Page1[0].f1_58[0]` (semantic: `line2a_tax_exempt_interest`)
  - `2b` → `topmostSubform[0].Page1[0].f1_59[0]` (semantic: `line2b_taxable_interest`)

This is a 2025 line spec.

---

## 2. Line 2a — Tax-exempt interest

### 2.1 What belongs on line 2a

For tax year 2025, line 2a includes total tax-exempt interest, including tax-exempt OID.

Primary sources:

- `1099-INT box 8` = tax-exempt interest
- `1099-INT box 13` = tax-exempt bond premium (negative — reduces box 8)
- `1099-OID box 11` = tax-exempt OID
- `1099-OID box 2` = tax-exempt stated interest only when classified by the user as the tax-exempt portion of a tax-exempt OID bond
- `1099-DIV box 12` = exempt-interest dividends from regulated investment companies
- manual tax-exempt interest not shown on statements (`manualTaxExemptInterestNotOnStatements`)
- tax-exempt bond premium adjustment not in statements (`taxExemptBondPremiumAdjustmentNotInStatements`) — negative

### 2.2 AMT subset handling

Two information-return boxes identify the tax-exempt interest amount that may also be relevant for AMT:

- `1099-INT box 9` = specified private activity bond interest
- `1099-DIV box 13` = exempt-interest dividends from private activity bonds subject to AMT

Critical 2025 rule:

- `1099-INT box 9` is already included in `1099-INT box 8` — must not be added again to line 2a
- `1099-DIV box 13` is already included in `1099-DIV box 12` — must not be added again to line 2a
- both amounts feed `Form 6251 line 2g` separately

### 2.3 Net reporting / premium handling for line 2a

If a taxpayer acquired a tax-exempt bond at a premium, only the **net** tax-exempt interest is reported.

Controlling rule:

- if the payer already reported a net amount, do not reduce again
- if premium / acquisition premium is reported separately and not already netted, reduce once

The `payerAlreadyReportedNetInterestOrOid` UI gate signals the broker pre-netted; the backend honors the personal-form premium-adjustment fields only when the gate is consistent with their presence.

### 2.4 Line 2a per-person formula

```
entryTaxExemptInterest_INT = subtractNonNegative(box8, box13)   // per 1099-INT entry
taxExemptInterest         += entryTaxExemptInterest_INT
taxExemptInterest         += box11_OID                          // tax-exempt OID
taxExemptInterest         += taxExemptStatedInterestFrom1099OidBox2  // user-classified portion of OID box 2
taxExemptInterest         += box12_DIV                          // exempt-interest dividends
taxExemptInterest         += manualTaxExemptInterestNotOnStatements
taxExemptInterest         -= taxExemptBondPremiumAdjustmentNotInStatements   // subtractNonNegative (zero floor)
```

### 2.5 Line 2a per-return formula

```
Form1040.Line2a = roundMoney( addNonNull(taxpayer.taxExemptInterest(), spouseResult.taxExemptInterest()) )
```

On MFS the spouse contribution is suppressed via the orchestrator MFS guard (see §7.2).

### 2.6 Line 2a per-return path additions

Form 8814 line 1b (child tax-exempt interest) flows to the parent's line 2a via the same `taxExemptInterest` accumulator on the elected child's parent-return record.

---

## 3. Line 2b — Taxable interest

### 3.1 What belongs on line 2b

For tax year 2025, line 2b includes total taxable interest.

Main sources:

- `1099-INT box 1` = taxable interest
- `1099-INT box 3` = interest on U.S. savings bonds and Treasury obligations
- `1099-INT box 11` = taxable bond premium (negative — reduces box 1)
- `1099-INT box 12` = Treasury bond premium (negative — reduces box 3)
- `1099-OID box 1` = taxable original issue discount
- `1099-OID box 6` = acquisition premium (negative — reduces OID box 1)
- `1099-OID box 2` = taxable portion (user-classified or override)
- manual taxable interest not on statements (`manualTaxableInterestNotOnStatements`)
- accrued interest paid to seller (`accruedInterestPaidAdjustment`) — negative
- nominee interest belonging to another taxpayer (`nomineeInterestAdjustment`) — negative
- taxable bond premium / Treasury premium / OID acquisition premium adjustments not in statements — negative
- savings bond exclusion (Form 8815, `savingsBondExclusionAmount`) — negative at the per-return aggregation step
- seller-financed mortgage loans (`pf_seller_financed_loan` rows) — positive per row, with Schedule B Part I detail

### 3.2 Net reporting / premium handling for line 2b

Taxable interest is reduced by qualifying premium adjustments, but never twice.

Relevant boxes and adjustments:

- `1099-INT box 11` = taxable bond premium against box 1 interest (per-entry)
- `1099-INT box 12` = Treasury bond premium against box 3 interest (per-entry)
- `1099-OID box 6` = acquisition premium against taxable OID (per-entry)
- personal-form premium-adjustment fields apply when premium is NOT already netted by the payer

`1099-INT box 6` (foreign tax paid) does **not** reduce line 2b; it flows to Form 1116 / Schedule 3 line 1 only.

### 3.3 Schedule B subtraction items affecting line 2b

The following may reduce the taxable interest reported from statements and each becomes a Schedule B Part I detail line (negative for adjustments):

- accrued interest paid to the seller when buying a bond between interest dates
- nominee interest belonging to another taxpayer (independently triggers Schedule B regardless of amount)
- amortizable taxable bond / Treasury / OID-acquisition premium adjustments
- exclusion of eligible Series EE / I savings bond interest under `Form 8815`

### 3.4 Line 2b per-person formula

```
entryTaxableInterest_INT = subtractNonNegative(addNonNull(box1, box3), addNonNull(box11, box12))   // per 1099-INT
entryTaxableOid_excl_box2 = subtractNonNegative(box1_OID, box6_OID)                                 // per 1099-OID
taxableBox2_OID = override ?? subtractNonNegative(oidBox2Total, taxExemptStatedInterestFrom1099OidBox2)

taxableInterestBeforeExclusion  = Σ entryTaxableInterest_INT
                                + Σ entryTaxableOid_excl_box2
                                + taxableBox2_OID
                                + manualTaxableInterestNotOnStatements
                                + Σ sellerFinancedLoan.interestAmount
                                − (accruedInterestPaidAdjustment
                                   + nomineeInterestAdjustment
                                   + taxableBondPremiumAdjustmentNotInStatements
                                   + treasuryBondPremiumAdjustmentNotInStatements
                                   + oidAcquisitionPremiumAdjustmentNotInStatements)
   (subtractNonNegative at the person-level adjustment step — zero-floor)
```

### 3.5 Line 2b per-return formula

```
taxableBeforeExclusion = addNonNull(taxpayer.taxableInterestBeforeSavingsBondExclusion(),
                                    spouseResult.taxableInterestBeforeSavingsBondExclusion())
Form1040.Line2b = roundMoney( subtractNonNegative(taxableBeforeExclusion, savingsBondExclusionAmount) )
```

`savingsBondExclusionAmount` is read from the taxpayer personal form only (return-level reduction; Form 8815 auto-compute deferred — see `outstanding.md`).

---

## 4. Schedule B requirements for 2025

Schedule B is required when any of these are true (per IRS 2025 Schedule B instructions):

- taxable interest or ordinary dividends exceed `$1,500`
- seller-financed mortgage interest exists (independent trigger; no amount threshold)
- accrued interest paid to the seller of a bond exists
- OID is reported at less than the amount shown on `1099-OID`
- interest is reduced below the amount shown on `1099-INT` because of amortizable bond premium
- exclusion of interest from Series EE or I U.S. savings bonds issued after 1989 is claimed
- interest or dividends are received as a nominee (independent trigger; no amount threshold)
- taxpayer has a financial interest in, or signature authority over, a foreign financial account
- taxpayer received a distribution from, or was a grantor of, or transferor to, a foreign trust

The `$1,500` threshold is one of several Schedule B triggers — the orchestrator's `scheduleBRequired` chain OR-s all of them.

### 4.1 Schedule B Part I per-payer ordering

When Schedule B Part I is generated, items are aggregated in this order:

1. taxpayer seller-financed mortgage rows
2. spouse seller-financed mortgage rows
3. taxpayer 1099-INT / 1099-OID / manual / adjustment items (in code order)
4. spouse 1099-INT / 1099-OID / manual / adjustment items

Adjustment rows (accrued interest paid, nominee, premium, savings bond) appear as negative line items so the Part I line 2 total reconciles to the gross interest amount; line 3 then subtracts the savings bond exclusion to reach line 4 = Form 1040 line 2b.

---

## 5. Classification boundaries

### 5.1 1099-OID box 2 boundary

`1099-OID box 2` (other periodic interest) is the main classification edge case.

Correct rule:

- when the user classifies an amount as tax-exempt stated interest for a tax-exempt OID bond → contributes to `line 2a`
- the residual (or user-supplied taxable override) → contributes to `line 2b`

Two §17 non-overrideable blocking flags guard against user-entered tax-exempt or taxable-override portions that exceed the aggregate 1099-OID box 2 total:

- `OID_BOX2_TAX_EXEMPT_EXCEEDS_TOTAL_{TAXPAYER,SPOUSE}` (non-overrideable — would silently under-report taxable interest)
- `OID_BOX2_OVERRIDE_EXCEEDS_TOTAL_{TAXPAYER,SPOUSE}` (overrideable — over-states line 2b, self-harm only)

### 5.2 Tax-exempt market discount boundary

Market discount on a tax-exempt bond is **taxable interest** (line 2b), not tax-exempt interest. YAML help text on `manualTaxableInterestNotOnStatements` calls this out explicitly.

### 5.3 Retirement account boundary

Do not report interest from IRAs and similar tax-favored accounts on line 2a as tax-exempt interest. Those accounts are tax-deferred; distributions are handled via lines 4 / 5.

---

## 6. AMT side effects

For 2025, these amounts feed `Form 6251 line 2g`:

- `1099-INT box 9` (specified private activity bond interest)
- `1099-DIV box 13` (specified private activity bond dividends)

Both are aggregated into `form6251Line2g` inside `computeInterestForPerson` (box 9 path) and `form6251Line2gDividends` inside `computeDividendForPerson` (box 13 path). Neither is added to line 2a — the AMT path runs in parallel using the AMT-subset box values.

---

## 7. Current implementation behavior

### 7.1 Resolved historical bugs

All three historical bugs documented in earlier audits are resolved:

| Bug | Pre-fix | Post-fix |
|---|---|---|
| 1099-INT box 9 double-count into line 2a | `subtractNonNegative(addNonNull(box8, box9), box13)` | `subtractNonNegative(box8, box13)` at `TaxReturnComputeService.java:8045`; box 9 contributes only to `form6251Line2g` |
| `scheduleBFbarRequired` equaled `scheduleBForeignAccount` | Same boolean passed for both | Dedicated `hasFbarRequirement` field on `interest-income-taxpayer`; `InterestComputation` constructor takes both separately |
| Nominee interest did not independently trigger Schedule B | Schedule B chain omitted `nomineeInterestAdjustment` | `hasNomineeInterest` boolean on `InterestPersonTotals`; OR-included in `scheduleBRequired` chain |

### 7.2 MFS guard (orchestrator-level)

`computeInterestIncome` takes a `boolean isMfsReturn` parameter (signature at `TaxReturnComputeService.java:7738`; call site at line 470). On MFS the three spouse-side reads are gated:

- `interestIncomeSpouse = isMfsReturn ? null : interestIncomeSpouseRaw`
- `dividendIncomeSpouse = isMfsReturn ? null : dividendIncomeSpouseRaw`
- `spouseSsn = isMfsReturn ? null : normalizeSsn(getString(spouse, "ssn"))`

The single guard protects lines 2a, 2b, 3a, 3b, and Form 6251 line 2g, plus Schedule B Parts I & II detail items. Schedule B Part III foreign-account / FBAR / foreign-trust questions are sourced from `interest-income-taxpayer` (return-level) and are unaffected.

Lock-in test: `mfsExcludesSpouseInterestFromLine2a`.

### 7.3 Seller-financed mortgage interest (Gap 8 closure)

Per-buyer seller-financed mortgage rows (`pf_seller_financed_loan`) are aggregated into `taxableInterestBeforeExclusion` and emit one `ScheduleBInterestItem` per validated row. The chain `hasSellerFinancedLoans` independently triggers Schedule B without the $1,500 threshold. Two §17 codes guard required fields:

- `SELLER_FINANCED_LOAN_MISSING_REQUIRED_FIELDS_{TAXPAYER,SPOUSE}` (non-overrideable)

Schedule B Part I aggregation order (per IRS instructions): seller-financed first (taxpayer, then spouse), then other interest items (taxpayer, then spouse).

### 7.4 Code anchors

| Path | Reference |
|---|---|
| `computeInterestIncome` orchestrator | `TaxReturnComputeService.java:7738` |
| `computeInterestForPerson` per-person aggregator | `TaxReturnComputeService.java:7996` |
| 1099-INT box 8 / box 13 subtraction (post-fix) | line 8045 |
| Seller-financed required-fields §17 flag | line 8274 |
| Schedule B require chain | line 7942 (`hasSellerFinancedLoans`) |
| Line 9 income aggregation includes line 2b | per the buildIncome `addNonNull(line1z, line2b)` chain |

Personal-form / UI references:

- `C:\us-tax\us-tax-be\src\main\java\com\ustax\microservices\TaxReturnComputeService.java`
- `C:\us-tax\us-tax-ui\src\app\forms\form-interest-income-taxpayer.component.ts`
- `C:\us-tax\us-tax-ui\src\app\forms\form-interest-income-spouse.component.ts`
- `C:\us-tax\us-tax-ui\src\app\forms\form-tax-return-1040.component.ts`

---

## 8. Validation flags

| Flag | Severity | Condition |
|---|---|---|
| `INTEREST_STATEMENT_UPLOAD_REQUIRED` | BLOCKING | `hadInterestIncome=true` for taxpayer or spouse but no 1099-INT / 1099-DIV / 1099-OID uploaded, or upload-confirmation not set |
| `OID_BOX2_TAX_EXEMPT_EXCEEDS_TOTAL_{TAXPAYER,SPOUSE}` | BLOCKING (§17 non-overrideable) | User-classified tax-exempt portion of 1099-OID box 2 exceeds aggregate box 2 total |
| `OID_BOX2_OVERRIDE_EXCEEDS_TOTAL_{TAXPAYER,SPOUSE}` | BLOCKING (overrideable) | User-supplied taxable override on 1099-OID box 2 exceeds aggregate box 2 total |
| `SELLER_FINANCED_LOAN_MISSING_REQUIRED_FIELDS_{TAXPAYER,SPOUSE}` | BLOCKING (§17 non-overrideable) | Any seller-financed mortgage row missing buyer name / address / SSN-or-EIN / positive interest amount |

Implicit zero-floor gates (silent normalization):

- per-entry premium > underlying interest → `subtractNonNegative` floors at zero
- person-level adjustments > aggregated taxable interest → zero-floor at the adjustment step
- savings bond exclusion > aggregated taxable-before-exclusion → zero-floor at line 2b

---

## 9. Invariants

- `line 2a` includes tax-exempt interest only
- `line 2b ≥ 0` (zero-floor at three stages: per-entry box 11/12, per-person adjustment step, per-return savings bond)
- `1099-INT box 9` and `1099-DIV box 13` must not be double-counted into line 2a
- net premium / acquisition premium reductions happen at most once per source
- `ScheduleB.PartI.line4TaxableInterest` must equal `Form1040.Line2b` when Schedule B is required
- `line 2a` is NOT in line 9 / AGI / taxable income (informational only)
- `line 2b` IS in line 9 (2nd operand of the `addNonNull` income chain)
- AMT subset amounts feed `Form 6251 line 2g` separately

---

## 10. Compute order and dependencies

1. `prepare(...)` constructs upstream Form 8814 / child-interest-dividends artifacts and reads filing status.
2. `computeInterestIncome(...)` is called with `isMfsReturn`; it invokes `computeInterestForPerson` for taxpayer and (on MFJ) spouse.
3. `computeDividendIncome(...)` is called from inside `computeInterestIncome` after both per-person interest results are computed.
4. The orchestrator builds `scheduleBInterestItems` / `scheduleBDividendItems` lists and emits Schedule B when `scheduleBRequired` is true.
5. `buildIncome(...)` sets `form1040.income.taxExemptInterest` and `taxableInterest` and aggregates line 9.

Upstream dependencies: `interest-income-taxpayer` / `interest-income-spouse` personal forms; 1099-INT / 1099-OID / 1099-DIV statement entries; `identification-taxpayer` / `identification-spouse` (SSN); filing status; `seller-financed-loan` rows; Form 8814 child-interest results.

Downstream consumers:

- `line 2b` → `line 9` total income → AGI → taxable income → line 16 tax
- `line 2a` → no arithmetic propagation (informational)
- `form6251Line2g` (1099-INT box 9 + 1099-DIV box 13) → Form 6251 line 2g (AMT)
- `scheduleB.line4TaxableInterest` = `line 2b` when Schedule B is required
- EIC investment-income ceiling check (line 2b counts toward the $11,950 (2025) ceiling)

---

## 11. Out of scope

- NIIT (Form 8960)
- State tax-exempt distinctions for muni interest
- Auto-compute of Form 8815 savings bond exclusion (manual entry today — see `outstanding.md`)
- Contingent payment debt instrument and tax-exempt market discount auto-classification

---

## 12. Primary sources

- IRS 2025 Form 1040 instructions: `https://www.irs.gov/instructions/i1040gi`
- IRS 2025 Schedule B instructions: `https://www.irs.gov/instructions/i1040sb`
- IRS 2025 Publication 550: `https://www.irs.gov/publications/p550`
- IRS instructions for Forms 1099-INT and 1099-OID: `https://www.irs.gov/instructions/i1099int`
- local reference: `C:\us-tax\docs\books\i1040gi_2025.txt`
- local reference: `C:\us-tax\docs\books\J.K. Lasser Institute - J.K. Lasser's Your Income Tax 2025, Professional Edition (2025) - libgen.li.txt`

---

## 13. Verification log

| Date | Auditor | Scope | Outcome |
|---|---|---|---|
| 2026-04-13 | Knowledge-file audit | Box 9 double-count, FBAR-distinct flag, nominee Schedule B trigger, 1099-DIV box 13 → Form 6251, Schedule B dividend items, Form 8815 hint text | All resolved. |
| 2026-05-11 | 2a.xlsx Code Validation walkthrough | Bug-fix re-verification + MFS guard | MFS guard added (`computeInterestIncome`); single-guard cascade now protects lines 2a/2b/3a/3b plus Form 6251 line 2g. |
| 2026-05-11 | 2b.xlsx Code Validation walkthrough | Line 2b verification (10 issues) | All closed; multi-stage zero-floor + Schedule B Part I per-payer attribution verified. |
| 2026-06-02 | Gap 3 closure — 1099-OID box 2 classification validator | User-classified tax-exempt or override portion could exceed aggregate box 2 total | Resolved. `OID_BOX2_TAX_EXEMPT_EXCEEDS_TOTAL_{TAXPAYER,SPOUSE}` (§17 non-overrideable) + `OID_BOX2_OVERRIDE_EXCEEDS_TOTAL_{TAXPAYER,SPOUSE}` (overrideable) added at `TaxReturnComputeService.java:8123` / `8141`. |
| 2026-06-02 | Gap 8 closure (Tier 2) — Seller-financed mortgage full implementation | Schedule B trigger missing; UI had no intake; ordering rule unimplemented | Resolved. V39 migration + `PfSellerFinancedLoan` entity; mapper round-trip; `computeInterestForPerson` validates and emits Schedule B Part I rows; `hasSellerFinancedLoans` OR-included in `scheduleBRequired` chain; Part I ordering: seller-financed first; UI repeater section added; `SELLER_FINANCED_LOAN_MISSING_REQUIRED_FIELDS_{TAXPAYER,SPOUSE}` §17 flag at line 8274. |
