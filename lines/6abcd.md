Below is a **2025-tax-year, IRS-verified, developer-ready** rule map for **Form 1040 lines 6a / 6b / 6c / 6d (Social Security benefits)**.

Reviewed against:
- **2025 Instructions for Form 1040/1040-SR** (`i1040gi`)
- **Publication 915 (2025), Social Security and Equivalent Railroad Retirement Benefits**
- **IRC §86** (taxation of Social Security benefits — bases stable since 1983 enactment / second tier since 1993)
- Local cross-checks in `C:\us-tax\docs\books\i1040gi_2025.txt` and `J.K. Lasser's Your Income Tax 2025`
- **Publication 590-A (2025), Appendix B** (IRA deduction with Social Security) and the **2025 Form 8815 instructions** (line 9)
- Implementation re-verified against the code on 2026-11-26 (1E-43). Code is cited by method name, not line number.

This version corrects a material issue from earlier drafts:
- the 2025 worksheet does **not** jump directly from one-half benefits plus other income and tax-exempt interest to Schedule 1 reductions; it has a separate **line-5 exclusions/additions** block that must be included before subtracting Schedule 1 lines 11–20, 23, and 25; and
- the prior subtraction used Schedule 1 line 26 (full adjustments total). The Pub. 915-correct subset (lines 11–20 + 23 + 25) is now wired via `line10FromSchedule1Pub915Subset`.

---

# 1) Line identities (2025 Form 1040)

- **Line 6a:** Social Security benefits — total **net benefits**.
- **Line 6b:** Taxable amount of benefits.
- **Line 6c:** Checkbox — elected **lump-sum election method**.
- **Line 6d:** Checkbox — **married filing separately** and lived apart from spouse for **all of 2025**.

For 2025, the form no longer uses the old handwritten "D" notation next to benefits. That concept is now represented by the **line 6d checkbox** (a structural change, not a substantive change — IRC §86(c)(1)(C) has applied since 1983).

All four sub-lines share a single orchestrator (`computeSocialSecurityBenefits`) and a single per-person aggregator (`computeSocialSecurityForPerson`). 6a is gross-side disclosure; 6b is the value-bearing operand that enters line 9; 6c and 6d are checkboxes.

---

# 2) What belongs on lines 6a and 6b

## 2.1 Included statements / inputs

Line 6 covers:
- **Social Security benefits** reported on **Form SSA-1099**; and
- the **Social Security Equivalent Benefit (SSEB)** portion of tier 1 railroad retirement benefits reported on **Form RRB-1099** (the blue form).

For line 6a, use the **net benefits** from **box 5** of all:
- Forms **SSA-1099**, and
- Forms **RRB-1099** (SSEB portion only).

On a joint return, include the spouse's box-5 amounts too. (On MFS, the orchestrator-level guard nulls the spouse side.)

## 2.2 RRB scope limit (blue vs. green forms)

Only the **SSEB / equivalent tier 1** railroad retirement amount belongs in this line family.

Do **not** include here:
- the **non-SSEB** portion of tier 1 railroad retirement benefits;
- **tier 2** railroad retirement benefits; or
- **VDB / Supplemental annuity** railroad amounts.

Those belong on **lines 5a/5b/5c** (see `5abc.md` §8), via the **RRB-1099-R** (green form). The two RRB forms are distinct:
- **RRB-1099** (blue) — SSEB → line 6a;
- **RRB-1099-R** (green) — NSSEB + Tier 2 + VDB + Supplemental → lines 5a/5b/5c.

## 2.3 SSI exclusion

**Supplemental Security Income (SSI)** is **not taxable** and is never part of lines 6a or 6b. SSI is not reported on Form
SSA-1099 (Pub. 17; 2025 Form 1040 instructions, line 6), so box 5 never contains it and **nothing is subtracted** for it:
- the screen no longer asks for an SSI amount (removed 2026-11-05; the `SOCIAL_SECURITY_SSI_AMOUNT_REQUIRED_*` flags went with it);
- the old subtraction of a typed SSI amount from box 5 was removed (D-6a-1, 2026-10-26): it understated line 6a
  (e.g. 18,000 box 5 − 700 SSI = 17,300). The `hasSupplementalSecurityIncome` / `supplementalSecurityIncomeAmount` columns are still
  mapped but feed no computation.

## 2.4 Disability benefits included here

Social Security disability benefits are still **Social Security benefits** for this line family. They are not re-routed out of line 6 merely because they are disability-based. (This contrasts with **pension** disability before minimum retirement age, which re-routes to line 1h — see `5abc.md` §2.2.)

**Exception:** SSDI received for injuries from a terrorist attack or military action is not taxable and is left out of lines 6a and
6b (2025 Form 1040 instructions, lines 6a and 6b; D-6a-6). Because Form SSA-1099 still reports it, the advisory
`SOCIAL_SECURITY_TERRORIST_ATTACK_SSDI_EXCLUDED` warns that the IRS may send a notice.

## 2.5 Tax treaties (P16, V576, 2026-11-26)

Pub. 915 (2025) has two treaty rules that reach a Form 1040 (`SocialSecurityTreaty`):

- **Rule 1 — Canadian or German benefits of a U.S. resident.** "Under income tax treaties with Canada and Germany, social security
  benefits paid by those countries to U.S. residents are treated for U.S. income tax purposes as if they were paid under the social
  security legislation of the United States. If you receive social security benefits from Canada or Germany, include them on
  line 1 of Worksheet 1." Inputs (per person, bare keys): `receivedCanadaGermanySocialSecurity`,
  `canadaGermanySocialSecurityCountry` (CANADA / GERMANY), `canadaGermanySocialSecurityAmount` (U.S. dollars, after repayments).
  Added to the person's line 6a total, so it reaches lines 6a / 6b, the lump-sum election and the Pub. 590-A coordination. Not added
  for someone who lived abroad all year (not a U.S. resident). With only these benefits (no SSA-1099) the statement-upload blocker
  is waived.
- **Rule 2 — U.S. citizens residing abroad.** "U.S. citizens who are residents of the following countries are exempt from U.S. tax
  on their benefits": Canada, Egypt, Germany, Ireland, Israel, Italy ("You must also be a citizen of Italy"), Romania, United
  Kingdom. Inputs: `usCitizenLivingInTreatyCountry`, `treatyResidenceCountry` (the eight + OTHER), `alsoItalianCitizen`,
  `livedInTreatyCountryAllYear`, `treatyExemptBenefitsAmount` (part-year: box 5 received while living there, capped at the
  person's benefits). The exempt U.S. benefits (box 5 + SSEB, after the D-6a-6 SSDI) are left out of lines 6a and 6b; all of them
  when the person lived there all year. Japan, India and Switzerland are listed only for nonresident aliens (Form 1040-NR — out of
  scope). A green card holder is a resident alien and does not qualify.
- **No Form 8833.** Its instructions waive the disclosure of a treaty position that "reduces or modifies the taxation of income
  derived by an individual from ... social security, and other public pensions".

---

# 3) Primary outputs

## Form 1040 outputs

- `line6a = total net benefits from box 5 of all SSA-1099 and RRB-1099 (SSEB) forms`
- `line6b = taxable benefits amount`
- `line6c_checked = true/false`
- `line6d_checked = true/false`

## Internal supporting outputs

Keep for records:
- the **Social Security Benefits Worksheet** result, and
- if applicable, the **Pub. 915 Worksheet 3** lump-sum election worksheets.

These are recordkeeping worksheets, not separately filed IRS forms.

## PDF field mapping (canonical)

- `f1_68[0]` → `line6a_social_security_benefits`
- `f1_69[0]` → `line6b_social_security_taxable_amount`
- `c1_41[0]` → `line6c_lump_sum_election`
- `c1_42[0]` → `line6d_mfs_lived_apart_all_year`

---

# 4) Line 6a computation

## 4.1 Core formula

```text
person.grossBenefits = sum(SSA1099.box5_for_person) + sum(RRB1099.box5_sseb_for_person)    // no SSI subtraction (§2.3)
                      - terrorAttackSsdi                                                 // §2.4, D-6a-6
                      - treatyExemptUsBenefits + canadaGermanyBenefits                   // §2.5, P16

line6a = roundMoney(addNonNull(taxpayer.grossBenefits, spouse.grossBenefits))
```

This amount is the taxpayer's **net benefits**, not gross benefits — box 5 already reflects the statement's net-benefit computation (box 5 = box 3 gross − box 4 repayments).

## 4.2 Benefits can still be zero-taxable — but line 6a stays populated

UNLIKE lines 4a and 5a, line 6a does **NOT** have a blank-when-fully-taxable rule. Per IRS line 6a instructions:

> "Even if none of your benefits are taxable, you still need to enter the total amount on line 6a."

So:
- still report the box-5 total on **line 6a**; and
- enter **0** on **line 6b** when no benefits are taxable.

## 4.3 Lump-sum back payments still go into line 6a

If 2025 box 5 includes a lump-sum / retroactive payment for an earlier year, the **full box-5 amount** still goes on line 6a. The lump-sum election (line 6c) only affects **line 6b**, not line 6a.

## 4.4 SSN attribution and MFS guard

Per-person filtering uses `belongsToPersonSsa1099` and `belongsToPersonRrb1099` (SSN attribution). On MFS returns, the single orchestrator-level guard nulls `socialSecuritySpouse` and `spouseSsn` so spouse-attributed statements drop out of the taxpayer's line 6a (and line 6b).

---

# 5) How to choose the right worksheet

## 5.1 Default rule

Normally, use the **Social Security Benefits Worksheet** in the **2025 Instructions for Form 1040 / 1040-SR**.

## 5.2 Pub. 915 exception cases

Do **not** rely only on the printed 1040 worksheet when one of these applies:

1. The taxpayer contributed to a **traditional IRA**, and the taxpayer or spouse is covered by a retirement plan at work.
   - In that case, the **Pub. 590-A Appendix B** worksheets figure both the IRA deduction and the taxable benefits. The engine
     **computes** them (§9.3) - it no longer just flags the case.

2. Situation 1 does not apply, but the taxpayer claims any of these:
   - exclusion of interest from qualified U.S. savings bonds (**Form 8815**),
   - adoption benefits (**Form 8839**),
   - foreign earned income or housing (**Form 2555**),
   - certain income of bona fide residents of **American Samoa** or **Puerto Rico** (Form 4563 / Pub. 570). (Not Guam / USVI / CNMI: their residents file with the territory - §6.2.)
   - In that case, use **Worksheet 1 in Pub. 915**. Forms 8839 / 2555 / 4563 / Puerto Rico populate worksheet line 5 (§6.2).
     **Form 8815 is not a line-5 item**: Pub. 915 says to use Schedule B line 2 (the interest *before* the exclusion) in place of
     Form 1040 line 2b on worksheet line 3 - the engine adds `form8815ExclusionAppliedThisPass()` back to line 2b there.

3. The taxpayer received a **lump-sum payment for an earlier year**.
   - Also complete the applicable **Pub. 915 lump-sum worksheets** (Worksheet 3 — see §7).

---

# 6) Taxable benefits computation for line 6b

## 6.1 Conceptual rule

Taxable benefits are determined by a modified-income calculation often described as **provisional income**:

```text
one-half of benefits
+ other income
+ tax-exempt interest
+ certain exclusions/additions
- certain Schedule 1 adjustments (SUBSET, not full line 26)
```

The result is then compared to the filing-status thresholds (IRC §86(c)).

## 6.2 2025 worksheet structure (Pub. 915 / 1040 instructions)

```text
w1  = line6a                                                                   // net benefits
w2  = 0.50 × w1                                                                // half-benefits
w3  = line1z + line2b + line3b + line4b + line5b + line7a + line8              // other income (line 6 self-excluded)
        • Form 8815 filer: line 2b + the Form 8815 exclusion (= Schedule B line 2)  — WIRED
w4  = line2a                                                                   // tax-exempt interest
w5  = exclusions/additions:
        • EXCLUDED employer adoption benefits (Form 8839 line 30)              — WIRED (not line 1f: that is the
                                                                                   taxable part, already in w3; fixed 2026-08-01)
        • foreign earned income / housing exclusion (Form 2555 lines 45 + 50)  — WIRED per-spouse; the line 50 housing
                                                                                   DEDUCTION (Schedule 1 line 24j, inside w7) is
                                                                                   added back too (D-6b-3, 2026-10-26)
        • bona-fide-resident Samoa exclusion (Form 4563 line 15)               — WIRED 2026-06-05
        • bona-fide-resident Puerto Rico exclusion (Pub. 570)                  — WIRED 2026-06-05
        • Guam / USVI / CNMI: NOT added - their residents file with the territory (§932 / §935 mirror code, Pub. 570),
          so a Form 1040 excludes nothing; `TerritoryExclusion.excludesOnUsReturn` passes only American Samoa and
          Puerto Rico (screen review 2026-11-07)
        • MFS: only the filer's own Form 2555 / possession exclusions (spouse side nulled, 2026-08-04)
w6  = w2 + w3 + w4 + w5                                                        // modified AGI
w7  = Schedule 1 lines 11 through 20, and 23 and 25                            // SUBSET, NOT full line 26
w8  = max(0, w6 − w7)                                                          // adjusted modified AGI
```

**Line numbers:** `w1`–`w8` are **Pub. 915 Worksheet 1** numbering. The **2025 Form 1040 Social Security Benefits Worksheet** has no
exclusions line, so from line 5 it runs one lower: its line 5 = w2 + w3 + w4, its line 6 = the Schedule 1 subset (w7), its line 7 =
the difference (w8), its line 8 = the base amount.

Worksheet line 5 is captured via the unified per-spouse `possession-residence-exclusion-{taxpayer,spouse}` personal form (V47 Liquibase migration; `PossessionResidenceExclusionMapper`). The line-5 contribution is computed by `computePossessionExclusionForSsWorksheet` (sum of the eight Part III income items per spouse, or `totalExcludedIncomeOverride` when provided). For American Samoa users the data also populates the Form 4563 PDF output. This closes `XLS/Computations/6b.md` Gap 1.

Worksheet line 7 was historically wired against Schedule 1 line 26 (full adjustments). The Pub. 915-correct subset is now wired via `line10FromSchedule1Pub915Subset`. The bug had under-stated taxable benefits — under-by-$1,600 in the lock-in test scenario (Single $20k SS + $25k wages + $2,500 student loan → line 6b = $5,350 post-fix vs $3,750 pre-fix).

## 6.3 Thresholds (IRC §86(c))

Base amount (worksheet line 9 / IRC §86(c)(1) / §86(c)(2)):
- **$32,000** if **married filing jointly**;
- **$25,000** if:
  - single,
  - head of household,
  - qualifying surviving spouse, or
  - married filing separately **and lived apart from spouse for all of 2025** (= **line 6d checked**).

Adjusted-base second-tier amount (worksheet line 11 / IRC §86(c)(1)(B) / §86(c)(2)(B)):
- **$44,000** for married filing jointly;
- **$34,000** for the $25,000-base group.

Intermediate plateau amount (worksheet line 13):
- `plateau = 0.50 × (second − base)`
- = **$6,000** for MFJ (= 0.50 × ($44,000 − $32,000));
- = **$4,500** for the $25,000-base group (= 0.50 × ($34,000 − $25,000)).

All four amounts are **hard-coded inline** in `computeTaxableSocialSecurityNormal` — stable since the 1983 / 1993 IRC §86 enactments; NOT inflation-indexed.

## 6.4 Married filing separately and lived with spouse at any time — restrictive branch

If the taxpayer is **married filing separately** and **lived with spouse at any time during 2025**:
- skip lines 9–16 of the worksheet (the base-amount tier);
- apply the **85% path** for the full provisional income.

```text
if isMfs AND livedWithSpouseAnyTime:
    return min(0.85 × w1, 0.85 × w8)         // 85% cap AND 85% of full provisional income
```

In this case, the taxpayer does **not** get the $25,000 base amount. This is IRC §86(c)(1)(D) anti-loophole (1983 enactment). It is the **logical inverse** of line 6d on MFS returns; the two answers `livedApartFromSpouseEntireTaxYear` and `livedWithSpouseAnyTimeDuringTaxYear` are read independently, and an
inconsistent pair (both Yes / both No on an MFS return) raises the **blocking, non-overrideable**
`SOCIAL_SECURITY_LINE6D_MFS_RESIDENCE_INCONSISTENT` flag.

## 6.5 Tier computation (50% / 85%)

```text
overBase   = max(0, w8 − base)
if overBase == 0: return 0                                          // concept-applies-but-zero

taxableUpTo50 = min(0.50 × w1, 0.50 × overBase)
overSecond    = max(0, w8 − second)

if overSecond > 0:
    plateau = min(0.50 × (second − base), 0.50 × w1)
    taxable = plateau + 0.85 × overSecond
else:
    taxable = taxableUpTo50

return min(0.85 × w1, taxable)                                      // statutory 85% cap (IRC §86(a)(2))
```

## 6.6 Final 85% cap + zero-floor

```text
if line6a != null AND line6b == null:
    line6b = 0                                       // IRS rule: when benefits exist, line 6b shows 0 not blank
line6b = min(0.85 × line6a, max(0, line6b))          // belt-and-suspenders 85% cap
```

Taxable benefits can never exceed **85% of line 6a**.

---

# 7) Line 6c — lump-sum election method

## 7.1 When line 6c is relevant

Check **line 6c** only if the taxpayer elects to use the **lump-sum election method** under IRC §86(e). This applies when:
- 2025 benefits include a **lump-sum / retroactive payment** for one or more earlier years; and
- using the Pub. 915 Worksheet 3 method lowers taxable benefits.

## 7.2 What the election does

Normally, the taxable part of the full 2025 box-5 amount is computed using **2025 income**. The election allows the taxpayer to:
- recompute the earlier-year portion using the **earlier year's income** (prior-year AGI, prior-year tax-exempt interest, prior-year Schedule 1 adjustments), and
- include only the resulting taxable amount in 2025.

This can reduce line 6b.

## 7.3 Inputs required (per earlier year)

Per prior-year row in `lumpSumDetails[]`:
- `lumpSumAllocatedToPriorYear` — portion of the 2025 lump sum allocable to that earlier year;
- `priorYearBenefitsPreviouslyReported` — prior-year SS benefits;
- `priorYearTaxableBenefitsPreviouslyReported` — prior-year taxable SS;
- `priorYearOtherIncomeForRecompute` — prior-year worksheet line 3;
- `priorYearTaxExemptInterestForRecompute` — prior-year worksheet line 4;
- `priorYearAdjustmentsForRecompute` — prior-year worksheet line 7 subset;
- `priorYearFilingStatus`, `priorYearMfsLivedWithSpouseAnyTime`, `priorYearWorksheetLine5ExclusionsForRecompute` — the V48
  prior-year overrides (the earlier year's base amount and line-5 exclusions).

If `electsLumpSumElection = true` but `lumpSumDetails` is empty, `computeTaxableSocialSecurityLumpSum` returns null → election not
applied → the **blocking, non-overrideable** `SOCIAL_SECURITY_LUMP_SUM_ALLOCATION_REQUIRED` flag fires. A row missing the
previously-reported taxable amount raises `SOCIAL_SECURITY_LUMP_SUM_PRIOR_YEAR_REPORTED_REQUIRED`, and a row missing any of the three V48
overrides raises `SOCIAL_SECURITY_LUMP_SUM_PRIOR_YEAR_DEFAULTS_APPLIED` (both blocking, non-overrideable; only while electing).

## 7.4 Three-condition AND gate (silent-best-of-two)

```text
line6c = electsLumpSumElection
       AND taxableLumpSum != null
       AND taxableNormal  != null
       AND taxableLumpSum.compareTo(taxableNormal) < 0     // election BENEFICIAL

if line6c:
    line6b = taxableLumpSum            // election applied → lower amount
else:
    line6b = taxableNormal             // normal computation stands
```

**Asymmetry**: even when the user has `electsLumpSumElection = true`, line 6c is FALSE if the election does not produce a lower
amount; the advisory `SOCIAL_SECURITY_LUMP_SUM_ELECTION_NOT_BENEFICIAL` says so. The reverse case - a lump sum whose election would
lower line 6b but isn't chosen - raises the advisory `SOCIAL_SECURITY_LUMP_SUM_ELECTION_WOULD_LOWER`
(`SocialSecurityAdvisories.lumpSumElectionWouldLower`); the election is the taxpayer's choice, so it is never applied unasked.

## 7.5 Important exclusion

Do **not** confuse a taxable retroactive benefit payment with the one-time **SSA / RRB lump-sum death benefit**. The lump-sum death benefit is **not** taxed as line-6 benefit income.

## 7.6 Former fidelity gaps (closed)

The three gaps once listed here are closed (6c.md Gaps 2–3, 2026-06-06, V48): the prior-year worksheet line 5 comes from
`priorYearWorksheetLine5ExclusionsForRecompute`, and the prior-year filing status / MFS cohabitation from `priorYearFilingStatus` /
`priorYearMfsLivedWithSpouseAnyTime` (the current year's are used only as a default, and a missing override blocks while electing -
§7.3). When the election can't be figured, `taxableNormal` stands.

---

# 8) Line 6d — married filing separately and lived apart

Check **line 6d** if:

```text
filingStatus == "Married filing separately"
AND livedApartFromSpouseEntireTaxYear == true
```

Implementation:

```text
isMfs                       = "Married filing separately".equalsIgnoreCase(normalizedFilingStatus)
livedApartFromSpouseEntireTaxYear = Boolean.TRUE.equals(getBoolean(socialSecurityTaxpayer, ...))
line6d                      = isMfs AND livedApartFromSpouseEntireTaxYear
```

Effects:
- the checkbox is marked on the return;
- the taxpayer is placed in the **$25,000 base-amount** branch rather than the MFS-lived-with-spouse restrictive branch.

If the taxpayer is MFS and **did** live with spouse at any time during 2025:
- leave line 6d unchecked; and
- use the more restrictive worksheet branch (§6.4).

**2025 form change**: line 6d as a checkbox is **NEW for 2025**; it replaces the handwritten "D" notation that was previously written next to line 6a/6b amounts (per spec §1). The underlying IRC §86(c)(1)(C) rule has been stable since 1983.

**Consistency (enforced):** an MFS return whose two residence answers are both Yes or both No is blocked by
`SOCIAL_SECURITY_LINE6D_MFS_RESIDENCE_INCONSISTENT` (non-overrideable) - formerly a deferred soft-validation gap.

---

# 9) Special cases the engine should not ignore

## 9.1 Repayments more than gross benefits

If 2025 repayments (box 4) exceed 2025 gross benefits (box 3), none of the benefits are taxable (Pub. 915, Repayments More Than
Gross Benefits). The engine clamps **line 6a to $0** (line 6b = $0) and carries the excess repayment outside line 6:
- **over $3,000:** an itemized deduction on Schedule A line 16 (`buildScheduleA` adds it when no §1341 credit was entered on the Other
  payments screen) **or** the IRC §1341 credit - one remedy, not both. Over $3,000 with the standard deduction and no §1341 credit is
  blocked: `SOCIAL_SECURITY_EXCESS_REPAYMENT_REQUIRES_MANUAL_HANDLING` (non-overrideable);
- **$3,000 or less:** no deduction is allowed for 2025 (a miscellaneous itemized deduction, suspended) - the advisory
  `SOCIAL_SECURITY_EXCESS_REPAYMENT_NO_IN_RETURN_REMEDY` explains it.
(The `SOCIAL_SECURITY_NEGATIVE_NET_BENEFITS_MANUAL_REVIEW` flag earlier drafts named does not exist.)

## 9.2 Benefits paid on behalf of a child or incompetent person

Taxability belongs to the person with the legal right to receive the benefits. Do not automatically assign benefits to whoever physically received the payment.

## 9.3 IRA-deduction coordination (Pub. 590-A)

When the taxpayer or spouse made a traditional IRA contribution AND is covered by a retirement plan at work, the IRA deduction and
taxable benefits depend on each other. The engine **computes** the Pub. 590-A (2025) Appendix B worksheets (`runPub590aCoordination`):
- **Worksheet 1** figures taxable benefits from a modified AGI that leaves out the IRA deduction; **Worksheet 2** figures the IRA
  deduction (the active-participant phaseout) from it; **Worksheet 3** gives the final taxable benefits with that deduction.
- It iterates until the IRA deduction settles (at most `IRA_COORDINATION_MAX_ITERATIONS` = 10 passes, within $1).
- A Form 8815 exclusion is counted **once**: Worksheet 1 line 1 is AGI figured without it, so no second add-back (pinned by
  `Pub590aForm8815WithSocialSecurityTest`, 1D-40).
- Advisories: `SOCIAL_SECURITY_IRA_COORDINATION_DEDUCTION_REDUCED_BY_PHASEOUT` (the claimed deduction was reduced) or
  `SOCIAL_SECURITY_IRA_COORDINATION_VERIFIED_NO_PHASEOUT` (verified, unchanged). The former
  `SOCIAL_SECURITY_IRA_COORDINATION_MANUAL_REVIEW` flag no longer exists.

---

# 10) Deterministic compute pipeline

## Step 0 — Collect facts and statements

- all SSA-1099 box-5 amounts;
- all RRB-1099 box-5 SSEB amounts;
- filing status;
- MFS cohabitation facts for 2025;
- tax-exempt interest;
- Pub. 915-subset Schedule 1 adjustments;
- any §6.2 exclusions requiring add-back (Form 2555 / 8839 / 4563 / Pub. 570 / Pub. 590-A);
- any lump-sum / retroactive payment allocation by earlier year.

## Step 1 — MFS guard

`computeSocialSecurityBenefits` receives `boolean isMfsReturn`. At the top:

```text
socialSecuritySpouse = isMfsReturn ? null : socialSecuritySpouseRaw
spouseSsn            = isMfsReturn ? null : normalizeSsn(getString(spouse, "ssn"))
```

This single guard protects line 6a / 6b / 6d. Part of the 12-orchestrator MFS-cascade.

## Step 2 — Validate gating

`validateSocialSecurityStatementGating` emits **BLOCKING** flags:
- `SOCIAL_SECURITY_STATEMENT_UPLOAD_REQUIRED` (hadSocialSecurityBenefits = true; no statements; waived when the only benefits are
  Canadian / German, §2.5);
- `MISSING_UPLOADED_SSA_1099` / `MISSING_UPLOADED_RRB_1099` (statement-specific).

## Step 3 — Compute line 6a

```text
line6a = sum(all SSA-1099 box 5) + sum(all qualifying RRB-1099 SSEB)      // floor 0; excess repayment → §9.1
```

Exclude (none of these are in box 5 of the statements used):
- SSI (never on Form SSA-1099);
- non-SSEB railroad amounts;
- Tier 2 / VDB / Supplemental railroad amounts.

## Step 4 — Choose worksheet path

```text
if IRA-deduction coordination case:
    Pub. 590-A Appendix B worksheets, computed and iterated (§9.3)
elif Form 8815 / 8839 / 2555 / 4563 / Pub. 570 case:
    Pub. 915 Worksheet 1 (8815 at w3 via Schedule B line 2; the others at w5)
else:
    use standard 2025 Form 1040 worksheet
```

## Step 5 — Compute taxable benefits normally

`computeTaxableSocialSecurityNormal` produces `taxableNormal` per §6.

## Step 6 — Compute lump-sum election if applicable

If `hasLumpSumBackPayment` and sufficient prior-year data: `computeTaxableSocialSecurityLumpSum` returns `taxableLumpSum`.

## Step 7 — Set line 6b and line 6c

Three-condition AND gate per §7.4.

## Step 8 — Set line 6d

Two-condition AND gate per §8.

---

# 11) Filing-package implications

Filed on the return:
- **Form 1040** lines **6a / 6b / 6c / 6d**

Not separate return forms:
- **SSA-1099** and **RRB-1099** are information statements / inputs only.

Keep for records:
- taxable-benefits worksheet (Pub. 915 Worksheet 1);
- lump-sum election worksheets (Pub. 915 Worksheet 3), if used.

---

# 12) Validation flags

| Flag | Severity | Trigger |
|---|---|---|
| `SOCIAL_SECURITY_STATEMENT_UPLOAD_REQUIRED` | BLOCKING | `hadSocialSecurityBenefits = true` AND no SSA-1099 / RRB-1099 uploaded |
| `MISSING_UPLOADED_SSA_1099` | BLOCKING | `receivedSsa1099 = true` AND not uploaded |
| `MISSING_UPLOADED_RRB_1099` | BLOCKING | `receivedRrb1099 = true` AND not uploaded |
| `SOCIAL_SECURITY_STATEMENTS_WITHOUT_BENEFITS_ANSWER_{TAXPAYER,SPOUSE}` | ADVISORY | a non-zero SSA-1099 / RRB-1099 for the person, but the benefits screen doesn't say Yes |
| `SOCIAL_SECURITY_LINE6D_MFS_RESIDENCE_INCONSISTENT` | BLOCKING (non-overrideable) | MFS, and the lived-apart / lived-with answers are both Yes or both No |
| `SOCIAL_SECURITY_LUMP_SUM_ALLOCATION_REQUIRED` | BLOCKING (non-overrideable) | `electsLumpSumElection = true` AND `lumpSumDetails` empty |
| `SOCIAL_SECURITY_LUMP_SUM_PRIOR_YEAR_REPORTED_REQUIRED` | BLOCKING (non-overrideable) | electing; a row lacks the previously-reported taxable benefits |
| `SOCIAL_SECURITY_LUMP_SUM_PRIOR_YEAR_DEFAULTS_APPLIED` | BLOCKING (non-overrideable) | electing; a row lacks a V48 prior-year override (§7.3) |
| `SOCIAL_SECURITY_LUMP_SUM_ELECTION_NOT_BENEFICIAL` | ADVISORY | elected, but the election doesn't lower line 6b (line 6c left unchecked) |
| `SOCIAL_SECURITY_LUMP_SUM_ELECTION_WOULD_LOWER` | ADVISORY | not elected, but the election would lower line 6b |
| `SOCIAL_SECURITY_EXCESS_REPAYMENT_REQUIRES_MANUAL_HANDLING` | BLOCKING (non-overrideable) | repayments exceed gross by over $3,000, standard deduction, no §1341 credit |
| `SOCIAL_SECURITY_EXCESS_REPAYMENT_NO_IN_RETURN_REMEDY` | ADVISORY | repayments exceed gross by $3,000 or less (no 2025 deduction) |
| `SOCIAL_SECURITY_IRA_COORDINATION_DEDUCTION_REDUCED_BY_PHASEOUT` | ADVISORY | Pub. 590-A coordination reduced the claimed IRA deduction |
| `SOCIAL_SECURITY_IRA_COORDINATION_VERIFIED_NO_PHASEOUT` | ADVISORY | Pub. 590-A coordination verified the claimed IRA deduction |
| `SOCIAL_SECURITY_WORKSHEET_MANUAL_INCOME_NOT_USED` | ADVISORY | a typed worksheet override isn't used (`HeldTriage3Fixes`) |
| `SOCIAL_SECURITY_TERRORIST_ATTACK_SSDI_EXCLUDED` | ADVISORY | SSDI excluded as a terrorist-attack / military-action disability payment (`Wave2FieldsW1`) |
| `SOCIAL_SECURITY_CANADA_GERMANY_BENEFITS_INCLUDED_{TAXPAYER,SPOUSE}` | ADVISORY | Canadian / German benefits added to line 6a (§2.5, `SocialSecurityTreaty`) |
| `SOCIAL_SECURITY_CANADA_GERMANY_AMOUNT_MISSING_{..}` | BLOCKING | Yes to Canadian / German benefits, amount blank |
| `SOCIAL_SECURITY_CANADA_GERMANY_NOT_US_RESIDENT_{..}` | ADVISORY | abroad all year: the Canadian / German benefits are not added |
| `SOCIAL_SECURITY_TREATY_EXEMPT_{..}` | ADVISORY | a treaty-country U.S. citizen's benefits left out of lines 6a / 6b |
| `SOCIAL_SECURITY_TREATY_ITALY_NOT_ITALIAN_CITIZEN_{..}` | ADVISORY | Italy without Italian citizenship: no exemption |
| `SOCIAL_SECURITY_TREATY_RESIDENCE_INCOMPLETE_{..}` | BLOCKING | Yes to living abroad, country or all-year answer blank |
| `SOCIAL_SECURITY_TREATY_EXEMPT_AMOUNT_MISSING_{..}` | BLOCKING | part-year in a treaty country, amount received there blank |

---

# 13) Downstream consumers

- **Form 1040 line 9** uses **line 6b** (not line 6a) as the 6th income operand.
- **Form 1040 line 11a/11b** (AGI) and **line 15** (taxable income) inherit via line 9.
- **Form 6251** AMTI — line 6b feeds via AGI, no SS-specific AMT preference.
- **Schedule 8812 line 18a** earned-income test — uses **line 1z**, not line 6b (SS benefits are unearned).
- **Lines 6c / 6d** — Boolean disclosure only; never enter line 9 arithmetic.

---

# 14) Implementation guardrails

- Do **not** include **SSI** in line 6.
- Do **not** include non-SSEB railroad amounts in line 6 — those route to lines 5a/5b/5c via RRB-1099-R (green form).
- Do **not** omit the worksheet's **line-5 exclusions/additions** block.
- Do **not** subtract full Schedule 1 line 26 at worksheet line 7 — use the Pub. 915 subset (lines 11–20 + 23 + 25) via `line10FromSchedule1Pub915Subset`.
- Do **not** treat MFS-apart and MFS-lived-with-spouse as the same branch.
- Do **not** check line 6c unless the election is BOTH made AND beneficial (silent-best-of-two).
- Do **not** confuse a retroactive benefit payment with the one-time SSA / RRB death benefit.
- Do **not** ignore repayment / negative-benefit special cases.
- Do **not** blank line 6a when fully-taxable — line 6a always reports box-5 total when SS activity exists (UNLIKE 4a / 5a).
- Do **not** read spouse-side SS data on MFS; the single orchestrator-level guard suppresses it.

---

# 15) Practical developer cheat sheet

- **line 6a** = total **box 5** net benefits from SSA-1099 + RRB-1099 (SSEB only), floor 0 (excess repayment → §9.1). SSI is never in box 5. Always populated when SS activity exists.
- **line 6b** = worksheet result, capped at **85%** of line 6a. Zero (not null) when no benefits are taxable but SS activity exists.
- **line 6c** = check only when the **lump-sum election** is BOTH made AND beneficial.
- **line 6d** = check only for **MFS + lived apart all year**. NEW checkbox for 2025 (replaces handwritten "D").
- **MFS + lived with spouse any time** = no $25,000 base; restrictive 85% branch (IRC §86(c)(1)(D)).
- **SSI** = never included.
- **RRB Tier 2 / NSSEB / VDB / Supplemental** = not line 6; route to lines 5a/5b/5c.
- **Provisional income** = ½(line 6a) + line 1z + 2a + 2b (+ the Form 8815 exclusion) + 3b + 4b + 5b + 7a + 8 + 8839 line 30 / 2555 lines 45 + 50 / 4563 / Pub-570 add-backs − Schedule 1 lines 11–20 + 23 + 25.
- **IRA + workplace plan** = Pub. 590-A Appendix B, computed (§9.3).

---

# 16) 2025 key constants (reference)

| Constant | Value | Source |
|---|---|---|
| Base amount MFJ | $32,000 | IRC §86(c)(2) |
| Base amount Single/HOH/QSS/MFS-apart | $25,000 | IRC §86(c)(1) |
| Base amount MFS-lived-with-spouse | $0 | IRC §86(c)(1)(D) |
| Second-tier MFJ | $44,000 | IRC §86(c)(2)(B) |
| Second-tier other | $34,000 | IRC §86(c)(1)(B) |
| Plateau MFJ (derived) | $6,000 | 0.50 × ($44k − $32k) |
| Plateau other (derived) | $4,500 | 0.50 × ($34k − $25k) |
| Half-benefits rate | 0.50 | IRC §86(a)(1) |
| Statutory cap | 0.85 | IRC §86(a)(2) |

All hard-coded inline; not inflation-indexed since 1983 / 1993.

---

# 17) Forms checklist

**Filed with the return** (when applicable):
- Form 1040 — lines 6a / 6b / 6c / 6d

**Computed and retained**:
- Pub. 915 Worksheet 1 (standard taxable-benefits worksheet);
- Pub. 915 Worksheet 3 (lump-sum election, if applicable).

**Information returns** (inputs only):
- Form SSA-1099 (Social Security)
- Form RRB-1099 (blue — SSEB tier 1 only; the green RRB-1099-R goes to lines 5a/5b/5c)

---

# 18) Current code citations (by method - line numbers drift)

| Concern | Where |
|---|---|
| Orchestrator | `TaxReturnComputeService.computeSocialSecurityBenefits` (MFS guard at its top) |
| Per-person aggregator (line 6a) | `computeSocialSecurityForPerson` |
| Worksheet line 3 (incl. the Form 8815 add-back) / line 5 exclusions | in `computeSocialSecurityBenefits`; `computeForm2555ExclusionForSsWorksheet`, `computePossessionExclusionForSsWorksheet` |
| Worksheet line 7 subset | `line10FromSchedule1Pub915Subset` |
| Taxable benefits | `computeTaxableSocialSecurityNormal`, `computeTaxableSocialSecurityLumpSum` |
| Pub. 590-A coordination | `runPub590aCoordination` |
| Line 6d consistency blocker | the `SOCIAL_SECURITY_LINE6D_MFS_RESIDENCE_INCONSISTENT` emitter in `TaxReturnComputeService` |
| Advisories | `SocialSecurityAdvisories` |
| Treaty rules (§2.5) | `SocialSecurityTreaty.adjustPersonBenefits` / `.flags` (called from `computeSocialSecurityForPerson`); `.anyForeignBenefits` in `validateSocialSecurityStatementGating` |

---|---|
| Orchestrator entry — `computeSocialSecurityBenefits` | 14560 |
| Call site (from main pipeline) | 577 |
| Per-person aggregator — `computeSocialSecurityForPerson` | 15152 |
| MFS-cascade citation breadcrumb | 14601 |
| Possession-exclusion w5 helper — `computePossessionExclusionForSsWorksheet` | 14868–14869 |
| Worksheet line 7 Pub. 915 subset accessor | ~7713, ~14178 |
| `computeTaxableSocialSecurityNormal` call site | 14925 |
| `computeTaxableSocialSecurityLumpSum` call site | 14953 |
| Line 6d two-condition AND gate | ~14741 (`mfsLivedWithSpouseAnyTime` branch trigger) |

---

## Verification log

| Date | Walkthrough | Scope | Outcome |
|---|---|---|---|
| 2026-05-12 | 6a.xlsx Code Validation walkthrough | Line 6a verification (10 issues) | COMPLETE — 10/10 closed. MFS guard added to `computeSocialSecurityBenefits` (cascade extended to 11 orchestrators); knowledge file renamed; net-benefits formula verified (SSA-1099 box 5 + RRB-1099 SSEB only); SSI exclusion verified (IRC §86(d)(1)(D) three-protection chain); RRB SSEB-only routing documented vs RRB-1099-R green form; IRS-rule difference noted — line 6a has NO blank-when-fully-taxable rule. Backend regression: 753 → 754 tests (+1 lock-in). |
| 2026-05-12 | 6b.xlsx Code Validation walkthrough | Line 6b verification (10 issues) | COMPLETE — 10/10 closed. **High-priority Pub. 915 fix**: worksheet line 7 now uses Pub. 915 subset (lines 11–20 + 23 + 25) instead of full Schedule 1 line 26 (`line10FromSchedule1Pub915Subset` accessor); lock-in test asserts $5,350 post-fix vs $3,750 pre-fix; Pub. 915 worksheet structure (w1/w2/w5/w7 chain) documented; MFS-lived-with-spouse restrictive branch documented (IRC §86(c)(1)(D) anti-loophole); three-protection chain (force-zero + 85% belt-and-suspenders + zero-floor); 30-line JavaDoc on `computeTaxableSocialSecurityLumpSum` with three fidelity gaps. Backend regression: 754 → 755 tests (+1 lock-in). |
| 2026-05-12 | 6c.xlsx Code Validation walkthrough | Line 6c verification (10 issues) | COMPLETE — 10/10 closed. **PDF export bug fixed**: CSV mapping `c1_41[0]` from `unmapped_c1_41_0` → `line6c_lump_sum_election`; three-condition AND gate documented; silent-best-of-two convention (user-intent-vs-IRS-correctness asymmetry) documented; line 6c structurally NOT in line 9 (boolean type). Backend regression: 755/755 pass. |
| 2026-05-12 | 6d.xlsx Code Validation walkthrough | Line 6d verification (10 issues) | COMPLETE — 10/10 closed. **Parallel PDF export bug fixed**: CSV mapping `c1_42[0]` from `unmapped_c1_42_0` → `line6d_mfs_lived_apart_all_year`; two-condition AND gate documented (IRC §86(c)(1)(C) + NEW-FOR-2025 cosmetic redesign); soft validation gap on `livedApartAllYear` vs `livedWithSpouseAnyTime` mutual exclusion deferred to `outstanding.md`. 6abcd cluster complete (4th shared-aggregator cluster after 3abc + 4abc + 5abc). Backend regression: 755/755 pass. |
| 2026-06-14 | Specification re-author | Lines 6a + 6b + 6c + 6d | Re-authored against current code state (orchestrator at line 14560; `computeSocialSecurityForPerson` at line 15152; possession-exclusion helper at line 14868); preserved IRS prose and statutory citations (IRC §86, Pub. 915, Pub. 939, Pub. 570, Pub. 590-A); documented `line10FromSchedule1Pub915Subset` Pub. 915 subset fix; documented 2025-NEW line 6d checkbox (replaces handwritten "D"); documented blank-when-fully-taxable asymmetry vs 4a/5a (line 6a does NOT blank); documented possession-residence-exclusion V47 migration. |
| 2026-11-26 | 1E-43 spec refresh | Lines 6a–6d | Re-verified against the code and the 2025 Form 1040 instructions, Pub. 915, Pub. 590-A Appendix B and the Form 8815 instructions. Corrected: Pub. 590-A coordination is computed (not an advisory; the MANUAL_REVIEW flag no longer exists); adoption add-back is Form 8839 line 30, not line 1f; Form 8815 enters at worksheet line 3 (Schedule B line 2); SSI is not subtracted (not on SSA-1099); the 2555 housing-deduction add-back; excess repayments (line 6a floor 0 → Schedule A line 16 / §1341; the NEGATIVE_NET_BENEFITS flag never existed); the line 6d inconsistency and the lump-sum prior-year gaps are now enforced / closed (V48); flag table rebuilt from the code; code citations by method name; Pub. 915 vs Form 1040 worksheet line numbering. No code change. |
| 2026-11-26 | 1E-43a correction | Line 6b worksheet line 5 | The 1E-43 refresh wrongly said Guam / USVI / CNMI exclusions are added at line 5; the code has excluded them since 2026-11-07 (`TerritoryExclusion.excludesOnUsReturn`: American Samoa and Puerto Rico only). Spec corrected; no code change. |
