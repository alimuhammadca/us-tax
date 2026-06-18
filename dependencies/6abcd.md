# Dependencies — Lines 6a / 6b / 6c / 6d Social Security Benefits

This document covers every input and output for the lines 6a/6b/6c/6d computation pass.

Tax year: **2025**

---

## Line identity (2025 Form 1040)

- **Line 6a** — Total net Social Security benefits (gross-side disclosure).
- **Line 6b** — Taxable amount (worksheet result, capped at 85% of line 6a).
- **Line 6c** — Checkbox: lump-sum election method applied (IRC §86(e)).
- **Line 6d** — Checkbox: married filing separately AND lived apart from spouse for all of 2025 (NEW for 2025 — replaces the handwritten "D" notation; underlying IRC §86(c)(1)(C) stable since 1983).

All four sub-lines share a single orchestrator (`computeSocialSecurityBenefits`) and a single per-person aggregator (`computeSocialSecurityForPerson`). Line 6a is gross-side disclosure; line 6b is the value-bearing operand that enters line 9; lines 6c/6d are Boolean disclosure only.

---

## Input personal forms

| Form ID | Firestore path | Person | Fields consumed |
|---|---|---|---|
| `social-security-benefits-taxpayer` | `users/{uid}/social-security-benefits-taxpayer` | Taxpayer (Family Head) | `hadSocialSecurityBenefits`, `hasUploadedAtLeastOneSsaOrRrbStatement`, `receivedSsa1099`, `uploadedSsa1099`, `receivedRrb1099`, `uploadedRrb1099`, `confirmAllReceivedSsaRrbStatementsUploaded`, `hasSupplementalSecurityIncome`, `supplementalSecurityIncomeAmount`, `livedWithSpouseAnyTimeDuringTaxYear`, `livedApartFromSpouseEntireTaxYear`, `hasLumpSumBackPaymentForPriorYears`, `electsLumpSumElectionMethod`, `hasLumpSumAllocationByYear`, `lumpSumDetails` (list: `lumpSumAllocatedToPriorYear`, `priorYearBenefitsPreviouslyReported`, `priorYearTaxableBenefitsPreviouslyReported`, `priorYearOtherIncomeForRecompute`, `priorYearTaxExemptInterestForRecompute`, `priorYearAdjustmentsForRecompute`, `owner`, `priorTaxYear`), `manualOtherIncomeLine8` (overrides Schedule-1-derived line 8 — see line 8 dependencies), `manualCapitalGainLossLine7a`, `importedReturnWorksheetLine3IncomeTotal`, `importedReturnWorksheetLine4TaxExemptInterest`, `importedReturnWorksheetLine6AdjustmentsTotal` |
| `social-security-benefits-spouse` | `users/{uid}/social-security-benefits-spouse` | Spouse (MFJ only) | `hadSocialSecurityBenefits`, `hasSupplementalSecurityIncome`, `supplementalSecurityIncomeAmount` |
| `filing-status` | `users/{uid}/filing-status` | Return-level | `filingStatus` — used by `normalizeFilingStatus()` to determine MFJ vs MFS branch |
| `identification-taxpayer` | `users/{uid}/identification-taxpayer` | Taxpayer | `ssn` — used by `belongsToPersonSsa1099()` / `belongsToPersonRrb1099()` for TIN matching |
| `identification-spouse` | `users/{uid}/identification-spouse` | Spouse | `ssn` — used for TIN matching (null-shadowed on MFS) |
| `possession-residence-exclusion-taxpayer` | `users/{uid}/possession-residence-exclusion-taxpayer` | Taxpayer | Unified intake for US possession bona-fide-resident exclusions (American Samoa / Puerto Rico / Guam / USVI / CNMI per Pub. 570). Eight Part III income items (`wagesFromPossessionSources`, `taxableInterestExcluded`, `ordinaryDividendsExcluded`, `rentsRoyaltiesExcluded`, `farmGrossIncomeExcluded`, `businessGrossIncomeExcluded`, `capitalGainsLossNetExcluded`, `otherIncomeAmount`), `totalExcludedIncomeOverride`, plus Form 4563 Parts I/II fields. Feeds worksheet line 5 add-back via `computePossessionExclusionForSsWorksheet`. V47 Liquibase migration. Closes 6b.md Gap 1 (wired 2026-06-05). |
| `possession-residence-exclusion-spouse` | `users/{uid}/possession-residence-exclusion-spouse` | Spouse (MFJ only) | Same field shape as taxpayer-side, with `spouse`-prefixed API keys. |
| `foreign-earned-income-taxpayer` | `users/{uid}/foreign-earned-income-taxpayer` | Taxpayer | Read by `computeForm2555ExclusionForSsWorksheet` to compute worksheet line 5 Form 2555 add-back (lines 45 + 50). |
| `foreign-earned-income-spouse` | `users/{uid}/foreign-earned-income-spouse` | Spouse (MFJ only) | Same; spouse Form 2555 add-back to worksheet line 5. |
| `adoption-expenses-taxpayer` | `users/{uid}/adoption-expenses-taxpayer` | Taxpayer | `adoption.line1f()` feeds worksheet line 5 (§137 adoption benefits exclusion). |

---

## Input statement forms

| Statement type | Firestore collection | Filter / TIN field | Fields consumed |
|---|---|---|---|
| SSA-1099 | `users/{uid}/ssa-1099` | `beneficiarySSN` (TIN matching; fallback attribution if absent) | `netBenefitsAmount` (box 5 net benefits → line 6a per-person) |
| RRB-1099 | `users/{uid}/rrb-1099` | `recipientIdNumber` (TIN matching) | `netSSEBAmount` (SSEB-only tier 1 equivalent → line 6a per-person) |

**Excluded from line 6 statement scope:**
- RRB-1099-R (non-SSEB tier 1 + tier 2 + VDB + Supplemental railroad) — processed by lines 5a/5b/5c pension/annuity workflow (the green form, distinct from blue RRB-1099).
- W-2G, 1099-R, and all other statement types.

---

## Computed inputs from other line passes

The following values from other passes are fed into `computeSocialSecurityBenefits()` as worksheet inputs. These are NOT re-read from Firestore; they are computed earlier in `prepare()` and passed directly.

| Source | Pass | Worksheet role |
|---|---|---|
| `line1z` (wages aggregate) | Lines 1a–1z | Worksheet line 3 component |
| `line2b` (taxable interest) | Lines 2a/2b | Worksheet line 3 component |
| `line3b` (ordinary dividends) | Lines 3a/3b | Worksheet line 3 component |
| `line4b` (taxable IRA distributions) | Lines 4a/4b/4c | Worksheet line 3 component |
| `line5b` (taxable pension/annuities) | Lines 5a/5b/5c | Worksheet line 3 component |
| `line7a` (capital gain/loss) | Lines 7a/7b | Worksheet line 3 component |
| `line8` (other income) | Line 8 | Worksheet line 3 component |
| `line2a` (tax-exempt interest) | Lines 2a/2b | Worksheet line 4 |
| Form 2555 taxpayer lines 45+50 | `computeForm2555ExclusionForSsWorksheet` | Worksheet line 5 (foreign earned income + housing exclusion added back) |
| Form 2555 spouse lines 45+50 | `computeForm2555ExclusionForSsWorksheet` | Worksheet line 5 (same, spouse's exclusion) |
| `adoption.line1f()` | Form 8839 / line 1f | Worksheet line 5 (§137 adoption benefits exclusion) |
| `computePossessionExclusionForSsWorksheet(taxpayer, spouse)` | Possession-residence-exclusion forms | Worksheet line 5 (Samoa / Puerto Rico / Guam / USVI / CNMI per Pub. 570) — WIRED 2026-06-05 |
| `incomeAdjustments.line10FromSchedule1Pub915Subset()` | Line 10 (Schedule 1 Part II — subset only) | Worksheet line 7 — Schedule 1 lines 11–20 + 23 + 25 (NOT full line 26; Pub. 915 subset) — wired at `TaxReturnComputeService.java` ~7713 and ~14178 |

**Critical invariant — worksheet line 3 self-exclusion**: Line 6b reads **7 of the 8 line-9 operands** (line 1z + 2b + 3b + 4b + 5b + 7a + 8). Line 6b itself is **excluded** from worksheet line 3 to avoid circular dependency — the worksheet computes the taxable portion of SS benefits; if it included its own output, the system would not converge.

**Worksheet line 7 fix (2026-04 → 2026-05)**: Historically wired against Schedule 1 line 26 (full adjustments total). The Pub. 915-correct **subset** (lines 11–20 + 23 + 25 — excludes line 21 IRA + line 22 student loan + line 24 reservist/jury/etc.) is now wired via `line10FromSchedule1Pub915Subset`. The bug under-stated taxable benefits (under-by-$1,600 in the lock-in test scenario: Single $20k SS + $25k wages + $2,500 student loan → line 6b = $5,350 post-fix vs $3,750 pre-fix).

**Open gap (deferred)**: Form 8815 savings bond exclusion is NOT a line-5 add-back; it is a worksheet-line-3 carveout (use Schedule B line 2 instead of Form 1040 line 2b). Tracked as `6b.md` Gap 6.

---

## Output JSON fields

| JSON path | Java class / field | Meaning |
|---|---|---|
| `form1040.income.socialSecurityBenefits` | `Income.socialSecurityBenefits` | Line 6a — total net benefits (sum of box 5 from SSA-1099 + RRB-1099 SSEB, net of SSI) |
| `form1040.income.taxableSocialSecurityBenefits` | `Income.taxableSocialSecurityBenefits` | Line 6b — taxable amount (worksheet result, ≤ 85% of 6a). Zero (not null) when SS activity exists but no benefits taxable. |
| `form1040.income.line6cLumpSumElection` | `Income.line6cLumpSumElection` | Line 6c checkbox — true when lump-sum election applied AND beneficial |
| `form1040.income.line6dMfsLivedApartAllYear` | `Income.line6dMfsLivedApartAllYear` | Line 6d checkbox — true when MFS + lived apart all year |

**Contract notes:**
- Line 6a does **NOT** have a blank-when-fully-taxable rule (UNLIKE lines 4a/5a). Per IRS line 6a instructions: even if none of the benefits are taxable, still enter the total on line 6a.
- Line 6b uses **0/null contract**: zero when SS activity exists but no benefits taxable; null when no SS activity at all.
- Line 6a uses **0/null contract**: nullable when no SSA-1099 / RRB-1099 activity; box-5 total when SS activity exists.

---

## Downstream consumers

| Consumer | Line / Form | Input from 6a/6b/6c/6d | Notes |
|---|---|---|---|
| Form 1040 line 9 total income | `computeTotalIncome()` | `taxableSocialSecurityBenefits` (line 6b) | Line 6a gross is **NOT** added to line 9. Lines 6c/6d are Boolean disclosure only and never enter arithmetic. |
| Line 11a/11b AGI | `computeAGI()` | line 9 inheritance | Line 6b indirect |
| Line 15 taxable income | `computeTaxableIncome()` | line 11b inheritance | Line 6b indirect |
| Form 6251 AMTI | `buildForm6251()` | line 6b feeds via AGI | No SS-specific AMT preference |
| Schedule 8812 line 18a earned-income test | `computeForm8812()` | NOT line 6b | Uses line 1z (SS benefits are unearned) |
| PDF export — Form 1040 | `f1040_field_mapping_semantic.csv` | `line6a_social_security_benefits` (`f1_68[0]`), `line6b_social_security_taxable_amount` (`f1_69[0]`), `line6c_lump_sum_election` (`c1_41[0]`), `line6d_mfs_lived_apart_all_year` (`c1_42[0]`) | All four fields mapped. 6c/6d CSV mappings fixed 2026-05-12 (was `unmapped_c1_41_0` / `unmapped_c1_42_0`). |

**Form 4972 post-hoc adjustment**: When Form 4972 is elected on a lump-sum distribution, the Form 4972 logic adjusts lines 5a/5b post-hoc (NOT 6a/6b). However, the Form 4972 Part II cap-gain double-tax issue (tracked in memory) does NOT affect line 6 because RRB-1099-R green-form NSSEB amounts go to lines 5a/5b, not line 6.

---

## Blocking flags emitted

| Flag | Severity | Condition |
|---|---|---|
| `SOCIAL_SECURITY_STATEMENT_UPLOAD_REQUIRED` | BLOCKING | `hadSocialSecurityBenefits == true` AND (`!hasUploadedAtLeastOneSsaOrRrbStatement` OR `!confirmAllReceivedSsaRrbStatementsUploaded` OR no SSA-1099 or RRB-1099 entries exist) |
| `MISSING_UPLOADED_SSA_1099` | BLOCKING | `receivedSsa1099 == true` AND (`!uploadedSsa1099` OR SSA-1099 entry list is empty) |
| `MISSING_UPLOADED_RRB_1099` | BLOCKING | `receivedRrb1099 == true` AND (`!uploadedRrb1099` OR RRB-1099 entry list is empty) |

**Non-blocking (advisory) flags:**

| Flag | Condition |
|---|---|
| `SOCIAL_SECURITY_LUMP_SUM_ALLOCATION_REQUIRED` | `electsLumpSumElectionMethod == true` AND `lumpSumDetails` is empty — lump-sum computation falls back to normal taxable |
| `SOCIAL_SECURITY_NEGATIVE_NET_BENEFITS_MANUAL_REVIEW` | Net benefits (line 6a) is negative (repayments exceed gross benefits) — SS lines omitted from output; manual review required |
| `SOCIAL_SECURITY_IRA_COORDINATION_MANUAL_REVIEW` | IRA deduction non-zero AND taxable SS benefits non-zero — Pub. 590-A iterative coordination not computed; advisory only |

---

## Internal computation records (private)

| Record | Location | Key fields |
|---|---|---|
| `SocialSecurityPersonTotals` | `TaxReturnComputeService.java` (private record) | `grossBenefits` (per-person box-5 sum, net of SSI) |
| `SocialSecurityComputation` | `TaxReturnComputeService.java` (private record) | `line6aGrossBenefits`, `line6bTaxableBenefits`, `line6c`, `line6d`, `taxableNormal`, `taxableLumpSum` |

---

## Key backend locations (TaxReturnComputeService.java, 2026-06-14)

| Item | Line |
|---|---|
| Orchestrator entry — `computeSocialSecurityBenefits` | 14560 |
| Call site (from main pipeline) | 577 |
| Per-person aggregator — `computeSocialSecurityForPerson` | 15152 |
| MFS-cascade citation breadcrumb | 14601 |
| Possession-exclusion w5 helper — `computePossessionExclusionForSsWorksheet` | 14868–14869 |
| Worksheet line 7 Pub. 915 subset accessor | ~7713, ~14178 |
| `computeTaxableSocialSecurityNormal` call site | 14925 |
| `computeTaxableSocialSecurityLumpSum` call site | 14953 |
| Line 6d two-condition AND gate | ~14741 (`mfsLivedWithSpouseAnyTime` branch trigger) |
| `validateSocialSecurityStatementGating()` | ~7348 |
| `belongsToPersonSsa1099()` | ~7482 |
| `belongsToPersonRrb1099()` | ~7501 |
| `Income.java` (output model) | `src/main/java/com/ustax/model/output/Income.java` |

---

## Compute order dependency

`computeSocialSecurityBenefits()` must run **after**:
- Lines 1z, 2a, 2b, 3b, 4b, 5b, 7a, 8 — all used in worksheet line 3 and 4
- `computeIncomeAdjustments()` for the Pub. 915 subset (worksheet line 7)
- `computeForm2555ExclusionForSsWorksheet` — Form 2555 add-back for worksheet line 5
- `computePossessionExclusionForSsWorksheet` — possession exclusion for worksheet line 5
- `adoption.line1f()` — Form 8839 §137 exclusion for worksheet line 5

`computeSocialSecurityBenefits()` must run **before**:
- `computeTotalIncome()` — line 9 needs line 6b

---

## Key invariants

1. **Line 6a NEVER blanks** when SS activity exists — UNLIKE lines 4a/5a (which blank when fully taxable). Per IRS rule.
2. **Line 6b uses 0/null contract** — zero (not null) when SS activity exists but no benefits taxable; null only when no SS activity at all. Belt-and-suspenders zero-floor + 85% cap.
3. **Worksheet line 3 self-exclusion** — line 6b reads 7 of 8 line-9 operands EXCEPT line 6b itself (circular-dependency prevention).
4. **Worksheet line 7 Pub. 915 subset** — excludes Schedule 1 lines 21 + 22 (IRA + student loan); uses `line10FromSchedule1Pub915Subset`, NOT the full line 26.
5. **Line 6c silent-best-of-two** — checkbox is FALSE even when user elects, if lump-sum election does NOT produce a lower amount (`taxableLumpSum < taxableNormal`).
6. **Line 6d is NEW for 2025** — replaces handwritten "D" notation; underlying IRC §86(c)(1)(C) stable since 1983.
7. **MFS single-guard** — orchestrator-level `socialSecuritySpouse = null` and `spouseSsn = null` on MFS suppresses spouse-side SSA-1099/RRB-1099 attribution.
8. **SSI exclusion three-protection chain** — Boolean gate (`hasSupplementalSecurityIncome`) + `subtractNonNegative` zero-floor + null-preserve semantics.
9. **RRB scope limit** — only the SSEB / tier-1-equivalent (blue RRB-1099) belongs on line 6; NSSEB / tier 2 / VDB / Supplemental (green RRB-1099-R) go to lines 5a/5b/5c.
10. **MFS-lived-with-spouse restrictive branch** (IRC §86(c)(1)(D)): no $25,000 base amount; full 85% path. Logical inverse of line 6d.
