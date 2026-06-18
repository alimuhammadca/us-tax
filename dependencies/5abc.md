# Dependencies — Lines 5a/5b/5c Pension and Annuity Income

This document covers every input and output for the lines 5a/5b/5c computation pass, including Form 4972 post-hoc adjustment and Form 5329 generation.

Tax year: **2025**

---

## Input personal forms

| Form ID | Firestore path | Person | Fields consumed |
|---|---|---|---|
| `pension-annuity-income-taxpayer` | `users/{uid}/pension-annuity-income-taxpayer` | Taxpayer (Family Head) | `hadPensionOrAnnuityIncome`, `hasUploadedAtLeastOnePensionStatement`, `confirmAllReceivedPensionStatementsUploaded`, `received1099RNonIra`, `uploaded1099RNonIra`, `receivedRrb1099R`, `uploadedRrb1099R`, `hasDisabilityPensionBeforeMinimumRetirementAge`, `disabilityPensionLine1hRoutingConfirmed`, `hadPensionRollover`, `isEligibleRetiredPublicSafetyOfficer`, `electsPsoPremiumExclusion`, `hasAnyTaxableAmountNotDeterminedPension1099R`, `needsSimplifiedMethodComputation`, `needsGeneralRuleComputation`, `totalPensionRolloverAmount`, `taxableEmployeeContributionsAlreadyTaxedBox5Total`, `totalQualifyingPsoPremiumsPaid`, `hasOtherLine5cWriteInCode`, `line5cOtherWriteInText`, `line5cOtherWriteInAmount`, `annuityStartingDate`, `annuitantAgeAtStartingDate`, `jointAnnuitantAgeAtStartingDate`, `investmentInContractCostSimplifiedMethod`, `numberOfAnnuityPaymentsReceivedInTaxYear`, `priorYearTaxFreeRecoveryAmount`, `investmentInContractCostGeneralRule`, `expectedReturnGeneralRule`, `paymentsReceivedInTaxYearGeneralRule`, `exclusionRatioOverrideGeneralRule`, `hasEarlyDistributionAdditionalTaxForForm5329`, `form5329ExceptionCodeOrReason` |
| `pension-annuity-income-spouse` | `users/{uid}/pension-annuity-income-spouse` | Spouse (MFJ only) | Same fields as taxpayer EXCEPT: no statement upload gating fields (`hasUploadedAtLeastOnePensionStatement`, `confirmAllReceivedPensionStatementsUploaded`, `received1099RNonIra`, `uploaded1099RNonIra`, `receivedRrb1099R`, `uploadedRrb1099R`), no Form 4972/5329 gating (stays on taxpayer form), no line 5c box 3 write-in fields (stays on taxpayer form). Includes spouse-specific rollover, PSO, Simplified Method, General Rule inputs. |
| `lump-sum-distribution-taxpayer` | `users/{uid}/lump-sum-distribution-taxpayer` | Taxpayer | `electsForm4972`, `sourceTaxableAmount`, `sourceGrossDistributionAmount`, `box3CapitalGainAmount` (Part II) — used by `computeForm4972()` which feeds `adjustPensionLinesForForm4972()` |
| `lump-sum-distribution-spouse` | `users/{uid}/lump-sum-distribution-spouse` | Spouse (MFJ only) | Same Form 4972 inputs as taxpayer |
| `other-earned-income-taxpayer` | `users/{uid}/other-earned-income-taxpayer` | Taxpayer | Disability pension entry IDs → `entryIdsRoutedToLine1h` set (single source of truth for re-routing 1099-R distributions to line 1h wages) |
| `other-earned-income-spouse` | `users/{uid}/other-earned-income-spouse` | Spouse | Same — feeds `entryIdsRoutedToLine1h` |
| `identification-taxpayer` | `users/{uid}/identification-taxpayer` | Taxpayer | `ssn` — used by `belongsToPersonIra()` for 1099-R TIN matching and `belongsToPersonRrb1099R()` for RRB-1099-R TIN matching |
| `identification-spouse` | `users/{uid}/identification-spouse` | Spouse | `ssn` — same purpose |

---

## Input statement forms

| Statement type | Firestore collection | Filter condition | Fields consumed |
|---|---|---|---|
| 1099-R | `users/{uid}/1099-r` | `iraSepSimple == false` (non-IRA only) AND `pensionEntryId NOT IN entryIdsRoutedToLine1h` | `recipientTIN` (TIN matching), `grossDistributionAmount` (box 1 → gross AND rollover base — Pub. 575 Gap-4 fix), `taxableAmountAmount` (box 2a → taxable base), `taxableAmountNotDetermined` (box 2b), `employeeOrRothContributionsOrPremiumsAmount` (box 5 → basis recovery / rollover offset), `distributionCodes` (box 7 — codes `1`/`S` trigger early distribution tax / Form 5329), `federalIncomeTaxWithheldAmount` (box 4 → line 25b — separate withholding pass) |
| RRB-1099-R | `users/{uid}/rrb-1099-r` | All entries | `recipientTIN` (TIN matching via `belongsToPersonRrb1099R()`), `totalGrossPaidAmount` (box 7 — gross fallback when detail absent), `employeeContributionsCostAmount` (box 3 — employee cost; when >0, box 4 excluded from taxable base), `contributoryAmountPaidAmount` (box 4 NSSEB — fully taxable only when box 3=0), `vestedDualBenefitAmount` (box 5 VDB — always taxable), `supplementalAnnuityAmount` (box 6 SA — always taxable) |

**Note:** 1099-R entries with `iraSepSimple == true` (mirror filter) are filtered out and processed by `computeIraDistributions()` (lines 4a/4b/4c). 1099-R entries in `entryIdsRoutedToLine1h` skip line 5 entirely (disability re-routing to line 1h wages).

---

## Output JSON fields

| JSON path | Java class / field | Meaning |
|---|---|---|
| `form1040.income.pensionsAnnuities` | `Income.pensionsAnnuities` | Line 5a — null when `fullyTaxableOverall == true` (blank-when-fully-taxable rule; mirrors line 4a) |
| `form1040.income.taxablePensionsAnnuities` | `Income.taxablePensionsAnnuities` | Line 5b — always present when activity (zero allowed) |
| `form1040.income.line5cBox1Rollover` | `Income.line5cBox1Rollover` | Line 5c box 1 — rollover checkbox |
| `form1040.income.line5cBox2Pso` | `Income.line5cBox2Pso` | Line 5c box 2 — PSO exclusion checkbox |
| `form1040.income.line5cBox3Other` | `Income.line5cBox3Other` | Line 5c box 3 — derived from text presence (`hasText(line5cText)`) |
| `form1040.income.line5cBox3Text` | `Income.line5cBox3Text` | Line 5c box 3 write-in text (joined via `joinLine4cOtherText`; shared helper with 4c path) |
| `form4972Taxpayer` | `TaxReturnComputation.form4972Taxpayer` | Form 4972 for taxpayer (built by `computeForm4972()`; null when not elected); per participant born before Jan 2, 1936 |
| `form4972Spouse` | `TaxReturnComputation.form4972Spouse` | Form 4972 for spouse (one per qualifying participant; MFJ may have two) |
| `form5329` | `TaxReturnComputation.form5329` | Form 5329 — **one per return** (taxpayer + spouse aggregated when MFJ); distinct from Form 8606 cardinality |

---

## Excluded items (by design)

| Item | Reason |
|---|---|
| Line 5a | NOT in line 9 / AGI / taxable income (gross — informational only) |
| IRA / SEP / SIMPLE 1099-R (`iraSepSimple == true`) | Mirror filter — routes to lines 4a/4b/4c |
| Disability pension before minimum retirement age | Routes to line 1h wages via `entryIdsRoutedToLine1h` single-source-of-truth set |
| 1099-R box 4 federal withholding | Routes to line 25b via separate `computeWithholding()` pass |
| Form 4972 ordinary distribution (Part III elected) | Removed from lines 5a AND 5b via `adjustPensionLinesForForm4972`; tax flows to line 16 |
| Form 4972 capital-gain portion (Part II elected) | box 3 cap-gain removed from both 5a AND 5b (closes prior double-tax observation); 20% tax via Form 4972 → line 16 |
| Form 5329 early-distribution additional tax | Routes to Schedule 2 line 8 (NOT line 5b) |
| RRB-1099 (blue form, SSEB) | Routes to line 6a (SS benefits), NOT line 5 |
| Roth IRA / designated Roth account rollovers | Remain taxable — do NOT use tax-free rollover formula |
| Per-annuity basis recovery (multiple annuities collapsed) | Known limitation — deferred (per `outstanding.md`) |

---

## Downstream consumers

| Consumer | Line / Form | Input from 5a/5b/5c | Notes |
|---|---|---|---|
| Line 9 total income | `form1040.income.totalIncome` | `taxablePensionsAnnuities` (line 5b) | Line 5a NOT added; line 5b is 5th operand of `addNonNull` chain |
| Line 25b withholding | `form1040.payments.withholding1099` | `federalIncomeTaxWithheldAmount` from 1099-R entries | Computed in separate `computeWithholding()` pass |
| Schedule 2 line 8 | `schedule2.otherTaxes.additionalTaxOnIras` | `form5329.additionalTaxOnEarlyDistributions` | Form 5329 penalty flows via Schedule 2, NOT line 5b |
| Line 16 box 2 | `taxAndCredits.form4972Tax` | `form4972.taxOnFiveyearAveraging` | Form 4972 special tax → line 16 add-on (separate from line 5b) |
| Form 1040 line 11a/11b (AGI), line 15 (taxable income) | Inherited via line 9 | | |
| Form 6251 AMTI | AGI add-back path | No pension-specific AMT preference | |
| Pub. 915 SS Worksheet | Line 3 ("other income") | Line 5b | Used in line 6a/6b SS taxability computation |
| Schedule 8812 line 18a earned-income test | Uses line 1z, NOT line 5b | Pension income is unearned for CTC purposes | |
| PDF export — Form 1040 | `f1040_field_mapping_semantic.csv` | `line5a_pensions_annuities`, `line5b_pensions_annuities_taxable_amount`, `line5c_box1_rollover`, `line5c_box2_pso`, `line5c_box3_other`, `line5c_additional_statement_text` | All six fields mapped and filled in frontend (fixed 2026-04-15) |

---

## Blocking flags emitted

| Flag | Severity | Condition |
|---|---|---|
| `PENSION_STATEMENT_UPLOAD_REQUIRED` | BLOCKING | `hadPensionOrAnnuityIncome == true` AND (`hasUploadedAtLeastOnePensionStatement != true` OR `confirmAllReceivedPensionStatementsUploaded != true`) |
| `MISSING_UPLOADED_NON_IRA_1099_R` | BLOCKING | `received1099RNonIra == true` AND `uploaded1099RNonIra != true` |
| `MISSING_UPLOADED_RRB_1099_R` | BLOCKING | `receivedRrb1099R == true` AND `uploadedRrb1099R != true` |
| `FORM5329_EXCEPTION_CODE_REQUIRED` | BLOCKING | `requiresForm5329 == true` AND no `form5329ExceptionCodeOrReason` provided |
| `PENSION_TAXABLE_NOT_DETERMINED` | NON-BLOCKING | Any 1099-R has box 2b checked (taxable amount not determined) |

**Note:** Line 5c has NO equivalent of `LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED` — there is no IRS rule mandating a separate exception-breakout statement for pension exceptions.

---

## Form 4972 post-hoc adjustment (compute order)

After ordinary line 5a/5b computation, `adjustPensionLinesForForm4972` (`TaxReturnComputeService.java:28405-28453`) walks both `form4972Taxpayer` and `form4972Spouse`:

```
if Part III elected (10-year averaging on full ordinary income):
    subtractGross   += box1GrossDistribution
    subtractTaxable += box2aTaxableAmount     // remove entire distribution from 5a/5b

elif Part II elected only (capital-gain treatment):
    subtractGross   += box3CapitalGain
    subtractTaxable += box3CapitalGain        // remove ONLY cap-gain portion from BOTH 5a and 5b

income.line5b = max(0, current5b - subtractTaxable)
income.line5a = max(0, current5a - subtractGross)
if (line5a == 0 || line5a == line5b):
    income.line5a = null                       // re-apply blank-when-fully-taxable
```

Form 4972's own tax computation feeds the line 16 stack (`Form4972.tax`), NOT line 5.

---

## Per-record taxable computation priority order

```
taxableBase = (taxable1099R == null) ? gross1099R : taxable1099R

if needsSimplifiedMethod:
    taxableBase = computePensionTaxableViaSimplifiedMethod(...) ?: taxableBase
if needsGeneralRule:
    taxableBase = computePensionTaxableViaGeneralRule(...) ?: taxableBase

taxableAfterRollover = hasRollover
    ? subtractNonNegative(gross1099R, rolloverAmount + box5Offset) + taxableRrb
    : taxableBase
    // Gap-4 fix: rollover base is gross box 1 (NOT box 2a) — avoids double-deducting box-5 basis

taxableAfterPso = hasPsoElection
    ? subtractNonNegative(taxableAfterRollover, min(psoPremiums, 3000))
    : taxableAfterRollover

person.taxablePensionsAnnuities = taxableAfterPso
```

PSO double-gate: `hasPsoElection = isEligibleRetiredPublicSafetyOfficer AND electsPsoPremiumExclusion`. Mere eligibility is not enough — affirmative election required. $3,000 cap hard-coded (`new BigDecimal("3000")` — stable since IRC §402(l) enactment).

---

## Simplified Method 2025 factor brackets

`determineSimplifiedMethodFactor` (single-life):

| Age at annuity starting date | Factor |
|---|---|
| 55 or less | 360 |
| 56–60 | 310 |
| 61–65 | 260 |
| 66–70 | 210 |
| 71 or more | 160 |

Joint-life table applies when `jointAnnuitantAgeAtStartingDate` is present. November 19, 1996 cutoff preserved; 1986–1996 irrevocable-election window preserved.

---

## Compute order

1. `prepare(...)` loads upstream personal forms, 1099-R entries, RRB-1099-R entries, lump-sum-distribution forms, other-earned-income forms.
2. `computePensionAnnuities(...)` is called with `isMfsReturn` (call site `TaxReturnComputeService.java:496`).
3. `entryIdsRoutedToLine1h` HashSet constructed at orchestrator entry (line 9745) — single source of truth for line 1h re-routing.
4. `validatePensionStatementGating()` emits `PENSION_STATEMENT_UPLOAD_REQUIRED` when applicable.
5. `computePensionForPerson` runs for taxpayer and (on MFJ) spouse: per-record filtering (`iraSepSimple == false` AND not in 1h set) + Simplified/General Rule + rollover + PSO chain.
6. Return-level aggregation: gross + taxable; `fullyTaxableOverall` 4-condition gate; line 5a blank-when-fully-taxable; line 5c OR-aggregation across spouses.
7. `buildIncome` writes line 5a (when non-null), line 5b, line 5c onto `form1040.income`.
8. `computeForm4972()` runs (one per qualifying participant).
9. `adjustPensionLinesForForm4972()` runs (`computeReturn` line 1542) — post-hoc subtraction from lines 5a/5b with re-application of blank-when-fully-taxable.

---

## Key invariants

- `line 5b ≥ 0` (zero-floor at multiple stages via `subtractNonNegative`)
- `line 5a` is null (blank) iff `fullyTaxableOverall == true` (4-condition gate: gross positive AND `!hasAnyException` AND taxable positive AND `gross == taxable`)
- `line 5a` is NOT in line 9 (gross — informational only)
- `line 5b` IS in line 9 (5th operand of `addNonNull` chain)
- Non-IRA only — mutual exclusion with line 4 via `iraSepSimple` filter
- Disability pension before minimum retirement age routes to line 1h — single source of truth via `entryIdsRoutedToLine1h`
- Same 1099-R entry never double-counts (1h + 5a/5b excluded by entry-ID skip at every accumulation site)
- PSO exclusion double-gated: eligible AND elects; $3,000 cap
- Form 4972 Part II removes box 3 cap-gain from BOTH 5a and 5b (closes prior double-tax)
- Form 5329 is one per return (taxpayer + spouse aggregated when MFJ) — distinct from Form 8606 (one per person)
- Form 5329 tax routes to Schedule 2 line 8 (NOT line 5b)
- Form 4972 tax routes to line 16 (NOT line 5b)
- RRB-1099-R amounts NOT rollover-eligible (re-added to `taxableAfterRollover` after rollover subtraction)
- Rollover base is `gross1099R` (box 1), NOT box 2a (Pub. 575 Gap-4 fix — avoids box-5 double-deduction)
- Roth IRA / designated Roth rollovers remain taxable (do not use tax-free rollover formula)
- MFS guard suppresses spouse-side reads at orchestrator level

---

## MFS guard (orchestrator-level)

`computePensionAnnuities` takes `boolean isMfsReturn`. At method top:

```
pensionIncomeSpouse = isMfsReturn ? null : pensionIncomeSpouseRaw
spouseSsn           = isMfsReturn ? null : normalizeSsn(getString(spouse, "ssn"))
```

Single guard protects 7+ outputs: line 5a, line 5b, line 5c boxes 1/2/3, line 5c write-in text, Form 5329, attachment flags. Part of the 12-orchestrator MFS-cascade.

---

## Key backend locations

| Item | Location |
|---|---|
| `computePensionAnnuities()` orchestrator | `TaxReturnComputeService.java:9642` |
| Call site (from main pipeline) | `computeReturn:496` |
| `entryIdsRoutedToLine1h` HashSet construction | line 9745 |
| `computePensionForPerson()` per-person aggregator | line 9997 |
| 1h-routed-id check (per-record skip) | inside `computePensionForPerson` ~line 10045 |
| 1h-routed-id check (IRA path mirror filter) | shared filter ~line 10774, 10783 |
| `computePensionTaxableViaSimplifiedMethod()` | `TaxReturnComputeService.java` ~line 5198 |
| `computePensionTaxableViaGeneralRule()` | `TaxReturnComputeService.java` ~line 5213 |
| `determineSimplifiedMethodFactor()` | `TaxReturnComputeService.java` ~line 5230 |
| `validatePensionStatementGating()` | `TaxReturnComputeService.java` ~line 5253 |
| `adjustPensionLinesForForm4972()` post-hoc adjustment | `TaxReturnComputeService.java:28405` |
| Form 4972 adjustment call site | `computeReturn:1542` |
| MFS single-guard cascade citation | breadcrumb ~line 5019, 10960 |
| `joinLine4cOtherText()` shared helper (5c reuse) | `TaxReturnComputeService.java` (private helper) |
| `PensionPersonComputation` (record) | `TaxReturnComputeService.java` ~line 5320 |
| `Income.java` | `src/main/java/com/ustax/model/output/Income.java` |
| `Form5329.java` | `src/main/java/com/ustax/model/output/Form5329.java` |
| `Form4972.java` | `src/main/java/com/ustax/model/output/Form4972.java` |
| `TaxReturnComputation.java` | `src/main/java/com/ustax/microservices/TaxReturnComputation.java` |
