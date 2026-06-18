Below is a **2025-tax-year, IRS-verified, developer-ready** rule map for **Form 1040 lines 6a / 6b / 6c / 6d (Social Security benefits)**.

Reviewed against:
- **2025 Instructions for Form 1040/1040-SR** (`i1040gi`)
- **Publication 915 (2025), Social Security and Equivalent Railroad Retirement Benefits**
- **IRC §86** (taxation of Social Security benefits — bases stable since 1983 enactment / second tier since 1993)
- Local cross-checks in `C:\us-tax\docs\books\i1040gi_2025.txt` and `J.K. Lasser's Your Income Tax 2025`
- Implementation verified against `TaxReturnComputeService.java` (2026-06-14)

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

**Supplemental Security Income (SSI)** is **not taxable** under IRC §86(d)(1)(D) and must never be included in lines 6a or 6b. Three protections in code:
1. Boolean gate (`hasSupplementalSecurityIncome`) prevents accidental subtraction when SSI absent;
2. `subtractNonNegative(grossBenefits, supplementalSecurityIncomeAmount)` zero-floors;
3. null-preserve semantics keep the field absent when no SS activity exists.

## 2.4 Disability benefits included here

Social Security disability benefits are still **Social Security benefits** for this line family. They are not re-routed out of line 6 merely because they are disability-based. (This contrasts with **pension** disability before minimum retirement age, which re-routes to line 1h — see `5abc.md` §2.2.)

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
person.grossBenefits = sum(SSA1099.box5_for_person) + sum(RRB1099.box5_sseb_for_person)
if hasSupplementalSecurityIncome:
    person.grossBenefits = subtractNonNegative(person.grossBenefits, supplementalSecurityIncomeAmount)

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
   - In that case, special worksheets in **Pub. 590-A** are needed to coordinate the IRA deduction and taxable benefits. The implementation emits an advisory `SOCIAL_SECURITY_IRA_COORDINATION_MANUAL_REVIEW` flag.

2. Situation 1 does not apply, but the taxpayer claims any of these:
   - exclusion of interest from qualified U.S. savings bonds (**Form 8815**),
   - adoption benefits (**Form 8839**),
   - foreign earned income or housing (**Form 2555**),
   - certain income of bona fide residents of **American Samoa** or **Puerto Rico** (Form 4563 / Pub. 570), or
   - mirror-code exclusions (Guam / USVI / CNMI per Pub. 570).
   - In that case, use **Worksheet 1 in Pub. 915**. These exclusions populate worksheet line 5 (see §6.2).

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
w4  = line2a                                                                   // tax-exempt interest
w5  = exclusions/additions:
        • adoption benefits (line 1f / Form 8839)                              — WIRED
        • foreign earned income / housing exclusion (Form 2555 lines 45 + 50)  — WIRED per-spouse
        • bona-fide-resident Samoa exclusion (Form 4563 line 15)               — WIRED 2026-06-05
        • bona-fide-resident Puerto Rico exclusion (Pub. 570)                  — WIRED 2026-06-05
        • mirror-code Guam / USVI / CNMI exclusions (Pub. 570)                 — WIRED 2026-06-05
w6  = w2 + w3 + w4 + w5                                                        // modified AGI
w7  = Schedule 1 lines 11 through 20, and 23 and 25                            // SUBSET, NOT full line 26
w8  = max(0, w6 − w7)                                                          // adjusted modified AGI
```

Worksheet line 5 is captured via the unified per-spouse `possession-residence-exclusion-{taxpayer,spouse}` personal form (V47 Liquibase migration; `PossessionResidenceExclusionMapper`). The line-5 contribution is computed by `computePossessionExclusionForSsWorksheet` (sum of the eight Part III income items per spouse, or `totalExcludedIncomeOverride` when provided). For American Samoa users the data also populates the Form 4563 PDF output. This closes `XLS/Computations/6b.md` Gap 1.

Worksheet line 7 was historically wired against Schedule 1 line 26 (full adjustments). The Pub. 915-correct subset is now wired via `line10FromSchedule1Pub915Subset` (consumed at `TaxReturnComputeService.java` ~7713 and ~14178). The bug had under-stated taxable benefits — under-by-$1,600 in the lock-in test scenario (Single $20k SS + $25k wages + $2,500 student loan → line 6b = $5,350 post-fix vs $3,750 pre-fix).

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

All four amounts are **hard-coded inline** at `TaxReturnComputeService.java` lines 8689–8690 (current xlsx line citations) — stable since 1983 / 1993 IRC §86 enactment; NOT inflation-indexed.

## 6.4 Married filing separately and lived with spouse at any time — restrictive branch

If the taxpayer is **married filing separately** and **lived with spouse at any time during 2025**:
- skip lines 9–16 of the worksheet (the base-amount tier);
- apply the **85% path** for the full provisional income.

```text
if isMfs AND livedWithSpouseAnyTime:
    return min(0.85 × w1, 0.85 × w8)         // 85% cap AND 85% of full provisional income
```

In this case, the taxpayer does **not** get the $25,000 base amount. This is IRC §86(c)(1)(D) anti-loophole (1983 enactment). It is the **logical inverse** of line 6d on MFS returns; the two flags `livedApartFromSpouseEntireTaxYear` and `livedWithSpouseAnyTimeDuringTaxYear` are read independently and mutual exclusion is **not** enforced by the engine — that's a soft validation gap tracked in `outstanding.md`.

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
- `priorYearAdjustmentsForRecompute` — prior-year worksheet line 7 subset.

If `electsLumpSumElection = true` but `lumpSumDetails` is empty, `computeTaxableSocialSecurityLumpSum` returns null → election not applied → an **advisory** `SOCIAL_SECURITY_LUMP_SUM_ALLOCATION_REQUIRED` flag fires.

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

**Asymmetry**: even when the user has `electsLumpSumElection = true`, line 6c is FALSE if the election does not produce a lower amount. The user's election intent is silently dropped when not beneficial. This is consistent with how most consumer tax software handles the election (strict IRS reading vs. user-intent-honoring).

## 7.5 Important exclusion

Do **not** confuse a taxable retroactive benefit payment with the one-time **SSA / RRB lump-sum death benefit**. The lump-sum death benefit is **not** taxed as line-6 benefit income.

## 7.6 Known fidelity gaps (deferred)

`computeTaxableSocialSecurityLumpSum` has three fidelity gaps tracked in `outstanding.md` (~2-3 hours scope, Low priority):
- prior-year `worksheetLine5` (exclusions add-backs) is hardcoded to null;
- prior-year filing status is assumed same as current year;
- initial fallback returns `taxableNormal` (correct behavior, but worth documenting).

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

**Soft validation gap (deferred)**: The engine does not enforce mutual exclusion between `livedApartFromSpouseEntireTaxYear` and `livedWithSpouseAnyTimeDuringTaxYear`. Two pathological cases possible (both true / both false). UI mutual-exclusion enforcement is the recommended fix (`outstanding.md` ~1-2 hours, Low priority).

---

# 9) Special cases the engine should not ignore

## 9.1 Repayments more than gross benefits

If benefits were repaid in 2025 and total repayments exceed gross benefits for 2025, the ordinary worksheet should not be used as though this were a normal taxable-benefits case. The engine emits an **advisory** `SOCIAL_SECURITY_NEGATIVE_NET_BENEFITS_MANUAL_REVIEW` flag when `line6a < 0`. Repayment deductions / credits are handled outside line 6.

## 9.2 Benefits paid on behalf of a child or incompetent person

Taxability belongs to the person with the legal right to receive the benefits. Do not automatically assign benefits to whoever physically received the payment.

## 9.3 IRA-deduction coordination (Pub. 590-A)

When the taxpayer or spouse made a traditional IRA contribution AND is covered by a retirement plan at work, the taxable SS calculation must be coordinated with the IRA deduction (Pub. 590-A). The engine emits an **advisory** `SOCIAL_SECURITY_IRA_COORDINATION_MANUAL_REVIEW` flag.

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
- `SOCIAL_SECURITY_STATEMENT_UPLOAD_REQUIRED` (hadSocialSecurityBenefits = true; no statements);
- `MISSING_UPLOADED_SSA_1099` / `MISSING_UPLOADED_RRB_1099` (statement-specific).

## Step 3 — Compute line 6a

```text
line6a = sum(all SSA-1099 box 5) + sum(all qualifying RRB-1099 SSEB)
       − SSI if hasSupplementalSecurityIncome
```

Exclude:
- SSI;
- non-SSEB railroad amounts;
- Tier 2 / VDB / Supplemental railroad amounts.

## Step 4 — Choose worksheet path

```text
if IRA-deduction coordination case:
    use Pub. 590-A coordinated method + emit advisory flag
elif Form 8815 / 8839 / 2555 / 4563 / Pub. 570 case:
    use Pub. 915 Worksheet 1 (add-backs at w5)
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
| `SOCIAL_SECURITY_LUMP_SUM_ALLOCATION_REQUIRED` | ADVISORY | `electsLumpSumElection = true` AND `lumpSumDetails` empty |
| `SOCIAL_SECURITY_NEGATIVE_NET_BENEFITS_MANUAL_REVIEW` | ADVISORY | `line6a < 0` (repayments > gross) |
| `SOCIAL_SECURITY_IRA_COORDINATION_MANUAL_REVIEW` | ADVISORY | IRA deduction non-zero AND taxable SS non-zero (Pub. 590-A) |

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

- **line 6a** = total **box 5** net benefits from SSA-1099 + RRB-1099 (SSEB only) − SSI. Always populated when SS activity exists.
- **line 6b** = worksheet result, capped at **85%** of line 6a. Zero (not null) when no benefits are taxable but SS activity exists.
- **line 6c** = check only when the **lump-sum election** is BOTH made AND beneficial.
- **line 6d** = check only for **MFS + lived apart all year**. NEW checkbox for 2025 (replaces handwritten "D").
- **MFS + lived with spouse any time** = no $25,000 base; restrictive 85% branch (IRC §86(c)(1)(D)).
- **SSI** = never included.
- **RRB Tier 2 / NSSEB / VDB / Supplemental** = not line 6; route to lines 5a/5b/5c.
- **Provisional income** = ½(line 6a) + line 1z + 2a + 2b + 3b + 4b + 5b + 7a + 8 + 8839/2555/4563/Pub-570 add-backs − Schedule 1 lines 11–20 + 23 + 25.

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

# 18) Current code citations (TaxReturnComputeService.java, 2026-06-14)

| Concern | Method / line |
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

---

## Verification log

| Date | Walkthrough | Scope | Outcome |
|---|---|---|---|
| 2026-05-12 | 6a.xlsx Code Validation walkthrough | Line 6a verification (10 issues) | COMPLETE — 10/10 closed. MFS guard added to `computeSocialSecurityBenefits` (cascade extended to 11 orchestrators); knowledge file renamed; net-benefits formula verified (SSA-1099 box 5 + RRB-1099 SSEB only); SSI exclusion verified (IRC §86(d)(1)(D) three-protection chain); RRB SSEB-only routing documented vs RRB-1099-R green form; IRS-rule difference noted — line 6a has NO blank-when-fully-taxable rule. Backend regression: 753 → 754 tests (+1 lock-in). |
| 2026-05-12 | 6b.xlsx Code Validation walkthrough | Line 6b verification (10 issues) | COMPLETE — 10/10 closed. **High-priority Pub. 915 fix**: worksheet line 7 now uses Pub. 915 subset (lines 11–20 + 23 + 25) instead of full Schedule 1 line 26 (`line10FromSchedule1Pub915Subset` accessor); lock-in test asserts $5,350 post-fix vs $3,750 pre-fix; Pub. 915 worksheet structure (w1/w2/w5/w7 chain) documented; MFS-lived-with-spouse restrictive branch documented (IRC §86(c)(1)(D) anti-loophole); three-protection chain (force-zero + 85% belt-and-suspenders + zero-floor); 30-line JavaDoc on `computeTaxableSocialSecurityLumpSum` with three fidelity gaps. Backend regression: 754 → 755 tests (+1 lock-in). |
| 2026-05-12 | 6c.xlsx Code Validation walkthrough | Line 6c verification (10 issues) | COMPLETE — 10/10 closed. **PDF export bug fixed**: CSV mapping `c1_41[0]` from `unmapped_c1_41_0` → `line6c_lump_sum_election`; three-condition AND gate documented; silent-best-of-two convention (user-intent-vs-IRS-correctness asymmetry) documented; line 6c structurally NOT in line 9 (boolean type). Backend regression: 755/755 pass. |
| 2026-05-12 | 6d.xlsx Code Validation walkthrough | Line 6d verification (10 issues) | COMPLETE — 10/10 closed. **Parallel PDF export bug fixed**: CSV mapping `c1_42[0]` from `unmapped_c1_42_0` → `line6d_mfs_lived_apart_all_year`; two-condition AND gate documented (IRC §86(c)(1)(C) + NEW-FOR-2025 cosmetic redesign); soft validation gap on `livedApartAllYear` vs `livedWithSpouseAnyTime` mutual exclusion deferred to `outstanding.md`. 6abcd cluster complete (4th shared-aggregator cluster after 3abc + 4abc + 5abc). Backend regression: 755/755 pass. |
| 2026-06-14 | Specification re-author | Lines 6a + 6b + 6c + 6d | Re-authored against current code state (orchestrator at line 14560; `computeSocialSecurityForPerson` at line 15152; possession-exclusion helper at line 14868); preserved IRS prose and statutory citations (IRC §86, Pub. 915, Pub. 939, Pub. 570, Pub. 590-A); documented `line10FromSchedule1Pub915Subset` Pub. 915 subset fix; documented 2025-NEW line 6d checkbox (replaces handwritten "D"); documented blank-when-fully-taxable asymmetry vs 4a/5a (line 6a does NOT blank); documented possession-residence-exclusion V47 migration. |
