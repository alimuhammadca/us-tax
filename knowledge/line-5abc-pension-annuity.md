# Knowledge — Lines 5a/5b/5c Pension and Annuity Income

Tax year: **2025**  
Last updated: 2026-04-16

---

## 1. What these lines cover

| Line | Field | Meaning |
|---|---|---|
| 5a | `pensionsAnnuities` | Gross pension/annuity distributions — populated only when NOT all fully taxable |
| 5b | `taxablePensionsAnnuities` | Taxable pension/annuity amount — always populated when there are distributions |
| 5c | Three checkboxes + write-in text | Box 1 = Rollover; Box 2 = PSO exclusion; Box 3 = Other IRS write-in |

---

## 2. Statement types consumed

| Statement | Firestore collection | Classification gate | Key fields |
|---|---|---|---|
| Form 1099-R | `users/{uid}/1099-r` | `iraSepSimple == false` (non-IRA only) | `grossDistributionAmount` (box 1), `taxableAmountAmount` (box 2a), `taxableAmountNotDetermined` (box 2b), `employeeOrRothContributionsOrPremiumsAmount` (box 5), `distributionCodes` (box 7), `recipientTIN` |
| Form RRB-1099-R | `users/{uid}/rrb-1099-r` | All entries | `totalGrossPaidAmount` |

**Attribution:** `belongsToPersonIra()` matches `recipientTIN` to taxpayer/spouse SSN (digits-only comparison).

**IRA routing:** 1099-R entries with `iraSepSimple == true` are filtered out and processed by `computeIraDistributions()` (lines 4a/4b/4c), NOT this computation.

---

## 3. Personal forms consumed

| Form ID | Firestore path | Person | Purpose |
|---|---|---|---|
| `pension-annuity-income-taxpayer` | `users/{uid}/pension-annuity-income-taxpayer` | Taxpayer / Family Head | All return-level gating, rollover, PSO, Simplified Method, General Rule, Form 4972 election, Form 5329 flag, line 5c box 3 text |
| `pension-annuity-income-spouse` | `users/{uid}/pension-annuity-income-spouse` | Spouse | Spouse-specific screening, rollover, PSO, Simplified Method, General Rule inputs; NO upload gating (owned by taxpayer form) |

### Key fields from `pension-annuity-income-taxpayer`

| Field | Type | Usage |
|---|---|---|
| `hadPensionOrAnnuityIncome` | boolean | Gate — false stops computation |
| `hasUploadedAtLeastOnePensionStatement` | boolean | Upload gate |
| `confirmAllReceivedPensionStatementsUploaded` | boolean | Upload gate |
| `received1099RNonIra` / `uploaded1099RNonIra` | boolean | Individual upload tracking |
| `hadPensionRollover` | boolean | Enables rollover reduction |
| `totalPensionRolloverAmount` | amount | Rollover amount (line 5 only; Roth rollovers not eligible) |
| `taxableEmployeeContributionsAlreadyTaxedBox5Total` | amount | Box 5 offset for rollover; overrides statement-derived box 5 when provided |
| `isEligibleRetiredPublicSafetyOfficer` | boolean | PSO gate |
| `electsPsoPremiumExclusion` | boolean | PSO election trigger |
| `totalPsoPremiumsPaidDirectlyToInsurer` | amount | **Note: label is misleading — 2025 law allows premiums paid either directly from plan or by retiree** |
| `needsSimplifiedMethodComputation` | boolean | Triggers Simplified Method override |
| `needsGeneralRuleComputation` | boolean | Triggers General Rule override |
| `annuityStartingDate` | date | Simplified Method — starting date |
| `annuitantAgeAtStartingDate` | integer | Simplified Method — primary annuitant age |
| `jointAnnuitantAgeAtStartingDate` | integer | Simplified Method — joint annuitant age (combined for table lookup) |
| `investmentInContractCostSimplifiedMethod` | amount | Simplified Method — after-tax cost basis |
| `numberOfAnnuityPaymentsReceivedInTaxYear` | integer | Simplified Method — payment count (clamped 1–12) |
| `priorYearTaxFreeRecoveryAmount` | amount | Simplified Method — cumulative prior recovery (not yet used in compute) |
| `investmentInContractCostGeneralRule` | amount | General Rule — cost basis |
| `expectedReturnGeneralRule` | amount | General Rule — expected return for exclusion ratio |
| `paymentsReceivedInTaxYearGeneralRule` | amount | General Rule — payments received |
| `exclusionRatioOverrideGeneralRule` | decimal | General Rule — override ratio when pre-computed externally |
| `hasOtherLine5cWriteInCode` | boolean | Box 3 trigger |
| `line5cOtherWriteInText` | text | Box 3 write-in text (e.g. "CODEX") |
| `line5cOtherWriteInAmount` | amount | Box 3 associated amount |
| `hasEarlyDistributionAdditionalTaxForForm5329` | boolean | Form 5329 gate |
| `form5329ExceptionCodeOrReason` | text | Form 5329 exception code |

---

## 4. Core compute method locations

| Method | File | Line (approx.) | Purpose |
|---|---|---|---|
| `computePensionAnnuities()` | `TaxReturnComputeService.java` | ~4970 | Return-level aggregation; calls per-person, assembles lines 5a/5b/5c, Form 5329 |
| `computePensionForPerson()` | `TaxReturnComputeService.java` | ~5088 | Per-person computation: loops 1099-R + RRB, applies rollover/PSO/methods |
| `computePensionTaxableViaSimplifiedMethod()` | `TaxReturnComputeService.java` | ~5198 | IRS Simplified Method exclusion: cost ÷ factor × payments |
| `computePensionTaxableViaGeneralRule()` | `TaxReturnComputeService.java` | ~5213 | IRS General Rule: cost ÷ expected return × payments |
| `determineSimplifiedMethodFactor()` | `TaxReturnComputeService.java` | ~5230 | Factor table lookup by annuitant age (single or combined joint) |
| `validatePensionStatementGating()` | `TaxReturnComputeService.java` | ~5253 | Emits blocking flags for missing/incomplete pension upload confirmation |
| `adjustPensionLinesForForm4972()` | `TaxReturnComputeService.java` | ~15087 | Post-compute: subtracts Form 4972 lump-sum amounts from lines 5a/5b |

---

## 5. Taxable-amount decision tree (per person)

```
for each 1099-R entry where iraSepSimple == false:
    if recipientTIN does not match person SSN → skip
    accumulate: grossDistributionAmount → gross1099R
                taxableAmountAmount → taxable1099R
                employeeOrRothContributionsOrPremiumsAmount → employeeContributionsBox5
    if distributionCode == "1" or "S" → earlyDistributionBase += taxableAmountAmount

for each RRB-1099-R entry:
    if recipientTIN does not match person → skip
    accumulate: totalGrossPaidAmount → grossRrb
    (NOTE: grossRrb is treated as fully taxable — no taxable-amount field read)

grossTotal = gross1099R + grossRrb
taxableBase = (taxable1099R ?? gross1099R) + grossRrb   ← box5 offset NOT pre-subtracted here

if needsSimplifiedMethodComputation:
    taxableBase = computePensionTaxableViaSimplifiedMethod(pensionForm, grossTotal)

if needsGeneralRuleComputation:
    taxableBase = computePensionTaxableViaGeneralRule(pensionForm, grossTotal)

box5Offset = user-entered taxableEmployeeContributionsAlreadyTaxedBox5Total
             ?? statement-derived employeeContributionsBox5

if hasRollover:
    taxableBase = max(0, taxableBase - rolloverAmount - box5Offset)

if hasPsoElection:
    psoExclusion = min(psoPremiums, 3000)
    taxableBase = max(0, taxableBase - psoExclusion)

earlyDistributionAdditionalTax = earlyDistributionBase × 0.10 (if any early distribution codes)
```

**Return-level aggregation:**
```
if every line-5 amount is fully taxable AND no exceptions:
    line5a = null
    line5b = sum(taxableTotal)
else:
    line5a = sum(grossTotal)
    line5b = sum(taxableTotal)
```

---

## 6. Simplified Method factor table (IRS Pub. 575, 2025)

| Combined age at starting date | Factor |
|---|---|
| 55 and under | 360 |
| 56–60 | 310 |
| 61–65 | 260 |
| 66–70 | 210 |
| 71 and over | 160 |

For **single-annuitant** plans: use annuitant age alone.  
For **joint-and-survivor** plans: use combined ages of both annuitants.

```java
// From determineSimplifiedMethodFactor()
int ageBasis = joint ? annuitantAge + jointAnnuitantAge : annuitantAge;
if (ageBasis <= 110) return 360;   // combined ≤110 → single person ≤55
if (ageBasis <= 120) return 310;
if (ageBasis <= 130) return 260;
if (ageBasis <= 140) return 210;
return 160;                         // >140 → oldest bracket
```

**Monthly exclusion:** `cost ÷ factor`  
**Annual nontaxable:** `monthly_exclusion × number_of_payments_this_year`  
**Annual taxable:** `gross - annual_nontaxable`

---

## 7. General Rule (Pub. 939)

```
exclusion_ratio = investment_in_contract / expected_return
tax_free = exclusion_ratio × payments_received
taxable = payments_received - tax_free
```

Applies when: nonqualified plan OR annuity start date before July 1, 1986 (certain cases) OR start date between July 1, 1986 and November 18, 1996 (election window — irrevocable).

---

## 8. PSO exclusion (2025 rule)

- Amount: `min(qualified_premiums_paid, 3000)`
- Who qualifies: eligible retired public safety officer (law enforcement, firefighter, chaplain, rescue squad, ambulance crew)
- What premiums qualify: accident, health, long-term care insurance
- **2025 law**: premiums may be paid directly from plan to insurer OR by the retiree from the distribution — both paths qualify
- The 1099-R box 2a does NOT already reflect this exclusion; the app must reduce line 5b itself
- Field name `totalPsoPremiumsPaidDirectlyToInsurer` is misleading — it covers both payment methods

---

## 9. Rollover rule (line 5c box 1)

Only for tax-free qualified-plan rollovers (NOT Roth IRA conversions):
```
taxable = max(0, taxable_base - rollover_amount - box5_offset)
```

**Important:** The code starts from box 2a (if present) as `taxable_base`, then subtracts both `rolloverAmount` and `box5Offset`. If box 2a already reflects the box 5 reduction, subtracting box5Offset a second time would understate taxable income. The IRS formula (per Pub. 575) starts from box 1 (gross). This is a known discrepancy — see Outstanding Issues.

---

## 10. Form 4972 conditional generation and line adjustment

### Conditional generation (per-person)

Form 4972 is computed by `computeForm4972Taxpayer()` / `computeForm4972Spouse()` before `computePensionAnnuities()` runs. It returns **`null`** unless all three gates pass:

| Gate | Source | Failure behavior |
|---|---|---|
| `electsForm4972 == true` | `lump-sum-distribution-taxpayer` personal form | Returns null immediately — no flag |
| Part I eligibility (q1–q5 all pass) | Same form | Returns null + emits `FORM4972_TAXPAYER_INELIGIBLE` (non-blocking) |
| Positive taxable amount | Linked `selectedStatementId` 1099-R, or manual `sourceTaxableAmount` | Returns null + emits `FORM4972_TAXPAYER_NO_STATEMENT` (non-blocking) |

**Part I question mapping:**
```
q1: partI_q1_entireBalance == true        (received the full account balance)
q2: partI_q2_noRollover == false          (no rollover to qualified plan / IRA)
q3: partI_q3_bornBefore1936OrBeneficiary == true  OR
    partI_q4_fiveYearsParticipation == true
q5: partI_q5_noPriorElection == false     (no prior lump-sum election for same participant)
eligible = q1 AND q2 AND (q3 OR q4) AND q5
```

**Source amounts:** Prefer linked 1099-R statement fields; fall back to manually saved `sourceTaxableAmount` / `sourceGrossDistributionAmount` / `sourceCapitalGainAmount` / `sourceNuaAmount`.

### Line 5a/5b adjustment (post-compute)

After `computePensionAnnuities()` runs, `adjustPensionLinesForForm4972()` reduces lines 5a/5b:
- If Form 4972 Part III elected: subtracts full lump-sum gross and taxable from 5a/5b
- If Form 4972 Part II only (capital gain): subtracts only the box 3 (capital gain) amount
- After reduction: if gross == taxable (fully taxable), sets 5a = null per IRS rules
- After reduction: if 5a == 0, sets 5a = null

### Output location

`TaxReturnComputation.form4972Taxpayer` / `.form4972Spouse` — both null unless the respective election is made and all gates pass.

---

## 11. Form 5329 conditional generation

**Primary gate:** `hasEarlyDistributionAdditionalTaxForForm5329 == true` in the `pension-annuity-income-taxpayer` personal form (`TaxReturnComputeService.java:5037`). Without this flag, Form 5329 is never generated regardless of distribution codes present.

**When the gate is open:**
- `additionalTaxOnEarlyDistributions` = sum of `earlyDistributionBase` from taxpayer + spouse 1099-R entries × 10%
- `earlyDistributionBase` is accumulated per-entry when `distributionCodes` contains `"1"` (early, no known exception) or `"S"` (SIMPLE IRA early distribution)
- Exception code/reason is read from `form5329ExceptionCodeOrReason`; if absent, a non-blocking `FORM5329_EXCEPTION_REASON_MISSING` flag is raised but Form 5329 is still generated

**Wiring chain:**
```
Form5329.additionalTaxOnEarlyDistributions
  → Schedule2OtherTaxes.additionalTaxOnIras     (Schedule 2 line 8)
  → Form1040.taxAndCredits.otherTaxes            (Form 1040 line 23)
```

Implemented in `applyForm5329TaxToSchedule2()` (`TaxReturnComputeService.java:10365`). Does NOT affect line 5b — it flows through Schedule 2, not through the pension income computation.

**Output location:** `TaxReturnComputation.form5329` — null when the flag is absent or `additionalTaxOnEarlyDistributions` is zero.

---

## 12. RRB-1099-R handling

- Code reads only `totalGrossPaidAmount`; no dedicated taxable-amount field is read
- The YAML imports `importedRrb1099RBox3EmployeeContributionCost` but this is not used in compute
- **Current behavior:** 100% of RRB gross is treated as taxable
- **Known gap:** Railroad Tier I and Tier II amounts may have different tax treatment; this is not computed

---

## 13. PDF field mapping (Form 1040 semantic CSV)

| CSV field name | Type | Coordinates (x1,y1,x2,y2) | Backend field |
|---|---|---|---|
| `line5a_pensions_annuities` | Text | (252, 150, 323.25, 162) | `income.pensionsAnnuities` |
| `line5b_pensions_annuities_taxable_amount` | Text | (504, 150, 576, 162) | `income.taxablePensionsAnnuities` |
| `line5c_additional_statement_text` | Text | (439.2, 138, 475.2, 150) | `income.line5cBox3Text` |
| `unmapped_c1_38_0` | CheckBox | (283.8, 139.5, 291.8, 147.5) | **UNMAPPED** — should be `line5c_box1_rollover` (`income.line5cBox1Rollover`) |
| `unmapped_c1_39_0` | CheckBox | (363, 139.5, 371, 147.5) | **UNMAPPED** — should be `line5c_box2_pso` (`income.line5cBox2Pso`) |
| `unmapped_c1_40_0` | CheckBox | (427.8, 139.5, 435.8, 147.5) | **UNMAPPED** — should be `line5c_box3_other` (`income.line5cBox3Other`) |

**Frontend fill (form-tax-return-1040.component.ts):** Lines 5a/5b amounts are filled correctly. The three line 5c checkboxes and the box 3 text are NOT filled in the PDF export — this is a gap.

---

## 14. Output JSON fields

| JSON path | Java class / field | Meaning |
|---|---|---|
| `form1040.income.pensionsAnnuities` | `Income.pensionsAnnuities` | Line 5a — null when fully taxable |
| `form1040.income.taxablePensionsAnnuities` | `Income.taxablePensionsAnnuities` | Line 5b |
| `form1040.income.line5cBox1Rollover` | `Income.line5cBox1Rollover` | Line 5c box 1 rollover flag |
| `form1040.income.line5cBox2Pso` | `Income.line5cBox2Pso` | Line 5c box 2 PSO flag |
| `form1040.income.line5cBox3Other` | `Income.line5cBox3Other` | Line 5c box 3 other flag |
| `form1040.income.line5cBox3Text` | `Income.line5cBox3Text` | Line 5c box 3 write-in text |
| `form4972Taxpayer` | `TaxReturnComputation.form4972Taxpayer` | Form 4972 (taxpayer lump-sum; built by computeForm4972()) |
| `form4972Spouse` | `TaxReturnComputation.form4972Spouse` | Form 4972 (spouse) |
| `form5329` | `TaxReturnComputation.form5329` | Form 5329 early distribution tax |

---

## 15. Blocking flags emitted

| Flag | Code | Condition |
|---|---|---|
| PENSION_STATEMENT_UPLOAD_REQUIRED | Blocking | `hadPensionOrAnnuityIncome == true` AND upload not confirmed |
| MISSING_UPLOADED_NON_IRA_1099_R | Blocking | `received1099RNonIra == true` AND `uploaded1099RNonIra != true` |
| MISSING_UPLOADED_RRB_1099_R | Blocking | `receivedRrb1099R == true` AND `uploadedRrb1099R != true` |

---

## 16. Downstream consumers

| Consumer | How it uses lines 5a/5b |
|---|---|
| Line 9 total income | `taxablePensionsAnnuities` (line 5b) added to total income |
| Line 25b withholding | `federalIncomeTaxWithheldAmount` from 1099-R entries (separate withholding pass) |
| Schedule 2 line 8 | Form 5329 early distribution tax flows here |
| Form 4972 tax | Computed from lump-sum distribution; flows to line 16 box 2 |

---

## 17. Test coverage

### Unit tests (`TaxReturnComputeServiceTest.java`)

| Test name | Line (approx.) | What it covers |
|---|---|---|
| `computesPensionDistributionsWithLine5cAndOutputForms` | ~1841 | 1099-R, rollover, PSO ($500→$3,000 cap), box 3 text, Form 5329 code 1 |
| `computesFullyTaxablePensionWithLine5bOnly` | ~1901 | Fully taxable code-7; line 5a null, line 5b set, no Form 4972/5329 |
| `flagsWhenPensionStatementUploadGatingFails` | ~1942 | Missing upload confirmation; two blocking flags emitted |
| `computesPensionSimplifiedMethodBasic` | ~1979 | cost $18k, age 65 → factor 360, 12 payments → exclusion $600 → taxable $11,400 |
| `computesPensionSimplifiedMethodWithPriorYearRecovery` | ~2020 | cost $7,200, prior recovery $5,400 → remaining basis $1,800 → exclusion $60 → taxable $11,940 |
| `computesPensionSimplifiedMethodFullyRecoveredBasisIsFullyTaxable` | ~2063 | cost $6,000 fully recovered → remainingBasis=0 → fully taxable path |
| `computesPensionGeneralRule` | ~2106 | exclusion ratio 5000/25000=0.20; tax-free=400; taxable=1600 |
| `computesPensionRrb1099RNoCostFullyTaxable` | ~2146 | RRB box 4/5/6 totals; no employee cost → all fully taxable → line 5b=1700 |
| `computesPensionMfjTwoPersonAggregation` | ~2181 | MFJ taxpayer $5k + spouse $3k → combined line 5b=8000; line 5a null |
| `computesPensionPsoExclusionCappedAt3000` | ~2231 | Premiums $3,500 → capped at $3,000; taxable=7000; line5cBox2Pso=true |
| `computesPensionEarlyDistributionCodeSTriggersForm5329` | ~2274 | Code "S" → earlyDistBase=4000 → penalty=400; exception code stored |
| `form4972PartIIneligibleEmitsFlag` | ~8342 | All q1–q5 fails → null Form 4972 + FORM4972_TAXPAYER_INELIGIBLE flag |
| `form4972PartIIOnlyComputesLine7` | ~8375 | Part II capital gain only → line7=200, line29=null, line30=200 |
| `form4972PartIIIOnlyComputesLine29` | ~8402 | Part III 10-year option → line29 computed, line7=null |
| `form4972BothPartsLine30IsLine7PlusLine29` | ~8431 | Both parts → line30=line7+line29 |
| `form4972SpouseComputedSeparately` | ~8461 | Spouse election via `spouseElectsForm4972`; form4972Taxpayer=null |
| `form4972PartIiiExcludesLumpSumFromLine5b` | ~8858 | Form 4972 Part III subtracts lump-sum from lines 5a/5b |
| `form5329EarlyDistributionTaxWiresToSchedule2Line8AndLine23` | ~11707 | Code-1 $10k → penalty $1,000 → Sched2 line8 → Form1040 line23 |
| `form5329AbsentWhenNoPensionEarlyDistribution` | ~11757 | No early distribution flag → form5329 null |

### E2E tests (`line5abc-pension-withdrawals.spec.ts`)

| Test | What it covers |
|---|---|
| Backend raises blocking flag when pension income claimed but no 1099-R statements exist | API: saves form claiming pension income, seeds no statements; asserts `computeReturnApi` throws (409) |
| Full 5a/5b/5c + Form 4972 + Form 5329 | API: rollover + PSO + box 3 write-in + code 1 early dist + Form 4972 Part III; asserts all output fields |
| Fully taxable — no Form 4972 / Form 5329 | API: distribution code 7; line 5a null; `form4972Taxpayer` and `form5329` both null |
| RRB-1099-R with no employee cost | API: box 4+5+6 = $1,700; fully taxable; line 5a null |
| PSO exclusion caps at $3,000 | API: premiums $3,500 → capped at $3,000; line 5c box 2 set |
| Simplified Method reduces taxable pension | API: cost $18k, age 65 → factor 360 → taxable $11,400 |
| MFJ two-person pension aggregation | API: taxpayer $5k + spouse $3k → combined line 5b = $8k |
| Distribution code S → Form 5329 | API: code "S" SIMPLE IRA early dist → penalty $400; exception code verified |
| Form 5329 wires to Schedule 2 / line 23 | API: code "1" dist → penalty $500 → Schedule2.additionalTaxOnIras + Form1040.otherTaxes |
| `hasEarlyDistributionAdditionalTaxForForm5329 = false` suppresses Form 5329 | API: code "1" present but flag false → form5329 null, line 23 null |

---

## 18. Known gaps / outstanding issues

Items 1–5 and 7–8 below were resolved 2026-04-15. See `C:/us-tax/outstanding.md` for the full tracking list.

| # | Item | Status |
|---|---|---|
| 1 | Line 5c PDF checkboxes (`c1_38/39/40`) unmapped | ~~Resolved 2026-04-15~~ — CSV renamed; frontend fills all three checkboxes |
| 2 | PSO field label misleads (`totalPsoPremiumsPaidDirectlyToInsurer`) | ~~Resolved 2026-04-15~~ — label updated; both payment paths documented |
| 3 | RRB-1099-R taxable amount not read (used gross only) | ~~Resolved 2026-04-15~~ — box 3/4/5/6 read; basis recovery computed |
| 4 | Rollover taxable base started from box 2a instead of box 1 | ~~Resolved 2026-04-15~~ — now starts from box 1 (gross) per IRS Pub. 575 |
| 5 | Simplified Method prior-year recovery not applied | ~~Resolved 2026-04-15~~ — `remainingBasis = max(0, cost − priorRecovery)` applied |
| 6 | **Spouse upload gate** — spouse form has no statement upload confirmation; upload gating relies entirely on taxpayer form | Open — deferred |
| 7 | No unit tests for Simplified Method / General Rule / RRB / MFJ / PSO / code-S | ~~Resolved~~ — 8 new unit tests added (see section 17) |
| 8 | No E2E tests for RRB / Simplified Method / General Rule / MFJ / PSO / code-S / Form 5329 wiring | ~~Resolved~~ — 10 E2E tests all passing (see section 17) |
| 9 | **Box 2b (taxable not determined)** — no unit test for the `hasAnyTaxableAmountNotDeterminedPension1099R` path; fallback to box 1 gross is untested | Open — deferred |
| 10 | **Form 4972 — NUA worksheet** — box 6 net unrealized appreciation stored but unused in computation | Open — deferred |
| 11 | **Form 4972 — multiple participants** — only one election per spouse; beneficiary-of-multiple-participants case not modeled | Open — deferred |
| 12 | **Form 4972 — QDRO alternate payee** — eligibility not gated or modeled | Open — deferred |
| 13 | **"Attach 1099-R when withholding exists"** — no flag or output artifact; not represented in return package view | Open — minor |
