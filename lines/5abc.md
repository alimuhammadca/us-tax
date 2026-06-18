Below is a **2025-tax-year, IRS-verified, developer-ready** rule map for **Form 1040 lines 5a, 5b, and 5c (Pensions and annuities)**.

Reviewed against:
- **2025 Instructions for Form 1040/1040-SR** (`i1040gi_2025`)
- **Publication 575 (2025), Pension and Annuity Income**
- **Publication 939 (12/2025), General Rule for Pensions and Annuities**
- **Notice 2014-7** (Medicaid waiver / disability re-routing context, line 1h boundary)
- Local cross-checks in `C:\us-tax\docs\books\i1040gi_2025.txt` and `J.K. Lasser's Your Income Tax 2025`
- Implementation verified against `TaxReturnComputeService.java` (2026-06-14)

Two points kept tight from prior drafts:
- the **retired public safety officer (PSO)** exclusion is **not limited to direct insurer payment only** under current law (SECURE 2.0 expanded the rule); and
- **Simplified Method vs. General Rule** depends on the annuity starting date and qualified-plan status more precisely than the old "after July 1, 1986" shorthand.

---

# 1) Line identities (2025 Form 1040)

- **Line 5a:** Pensions and annuities - gross amount, when required.
- **Line 5b:** Pensions and annuities - taxable amount.
- **Line 5c:** checkbox / write-in area.
  - **Box 1:** rollover
  - **Box 2:** PSO election
  - **Box 3:** other IRS-required word or code next to line 5b (write-in text)

The three sub-lines share a single orchestrator (`computePensionAnnuities`) and a single per-person aggregator (`computePensionForPerson`). They are emitted together; line 5a and line 5b move in lockstep, line 5c is metadata-only disclosure.

---

# 2) What belongs on lines 5a, 5b, and 5c

## 2.1 Included inputs

This line family covers **non-IRA pension and annuity distributions**, including amounts commonly reported on:
- **Form 1099-R** for employer-plan distributions that are **not** IRA / SEP / SIMPLE distributions (`iraSepSimple = false`);
- **Form RRB-1099-R** for railroad retirement annuities and pensions (NSSEB tier 1 + tier 2 + VDB + Supplemental);
- military retirement pay that is taxable as pension income; and
- distributions from qualified employer plans such as pension plans, profit-sharing plans, 401(k), 403(a), 403(b), and governmental 457(b) plans when reported as pension/annuity income.

For ordinary Form 1099-R pension reporting:
- `gross_amount = box 1`
- `taxable_amount = box 2a`, unless a lower taxable amount must be computed under the rollover, PSO, Simplified Method, or General Rule rules below.

## 2.2 Explicit exclusions / re-routes

### IRA / SEP / SIMPLE distributions -> lines 4a / 4b / 4c

If the distribution has `iraSepSimple = true`, it belongs in the **IRA** workflow at lines 4a/4b/4c, not in line 5. This is a **mirror filter** vs. the IRA path: line 4 processes `iraSepSimple == true`; line 5 processes `iraSepSimple == false`. The two paths are mutually exclusive and use the shared `belongsToPersonIra` SSN-attribution helper.

### Disability pension before minimum retirement age -> line 1h

Taxable disability pension payments are reported as **wages on line 1h** until the taxpayer reaches the employer plan's **minimum retirement age**. After minimum retirement age, the payments are reported as pension income on lines 5a and 5b.

The re-routing is driven by a single source of truth on the *other-earned-income* form: a `Set<String> entryIdsRoutedToLine1h` is constructed in `computePensionAnnuities` (`TaxReturnComputeService.java:9745`) and threaded into both `computePensionForPerson` (line 10005) and into the 1099-R taxable-IRA accumulator (line 10774). Any 1099-R `pensionEntryId` in the set is **skipped** at every accumulation site so the same distribution never double-counts in 1h + 5a/5b.

### Corrective distributions and similar special distributions

Do **not** treat all Form 1099-R amounts as line-5 pension income automatically. Certain corrective distributions and other special distributions are routed by their own instructions and may belong on **line 1h**, the IRA line family, or another special path.

### Early-distribution penalty is not part of line 5b

The additional tax on early distributions is handled separately, generally through **Form 5329** and then **Schedule 2 line 8**, not by changing what belongs on line 5b. Form 5329 is **one per return** (taxpayer + spouse aggregated when MFJ) — distinct from **Form 8606** which is **one per person per tax year**.

---

# 3) Core output rules for lines 5a and 5b

## 3.1 Fully taxable pensions and annuities — line 5a is blank

If **all** pension and annuity payments being reported on this line family are **fully taxable**, report:
- `line5a = null` (blank PDF cell)
- `line5b = total pension and annuity payments`

The implementation uses a strict 4-condition test at `TaxReturnComputeService.java` inside `computePensionAnnuities`:

```text
fullyTaxableOverall =
    hasPositiveAmount(grossPensions)
    AND !hasAnyException
    AND hasPositiveAmount(taxablePensions)
    AND grossPensions == taxablePensions

line5a = fullyTaxableOverall ? null : roundMoney(grossPensions)
line5b = roundMoney(taxablePensions)        // always present when activity exists
```

Where `hasAnyException = hasRollover OR hasPsoElection OR hasOtherLine5cWriteIn OR needsSimplifiedMethod OR needsGeneralRule`. The blank-when-fully-taxable rule mirrors line 4a. Line 6a follows the **opposite** rule (never blank — see `6abcd.md`).

Examples of why a payment is **not** fully taxable:
- after-tax employee contributions are being recovered tax-free (basis recovery);
- a tax-free rollover reduced the taxable amount;
- a PSO exclusion reduces the taxable amount; or
- the taxable amount must be computed under the Simplified Method or General Rule.

## 3.2 Partially taxable pensions and annuities — line 5a populated

If **any** line-5 pension / annuity item is **not fully taxable**, report:
- `line5a = total gross pension and annuity payments`
- `line5b = total taxable amount`

Compute the taxable amount **per distribution / per annuity stream** and then sum the taxable pieces for line 5b. Do not collapse multiple pensions into a single basis computation.

## 3.3 Box 2a is the default starting point, not the final authority

If Form 1099-R shows a taxable amount in **box 2a**, that is the starting point. But a lower taxable amount may be correct when:
- the taxpayer made a **tax-free rollover** (box 1 → 5c box 1);
- the taxpayer elects the **PSO exclusion** (5c box 2);
- the annuity must be recomputed under the **Simplified Method**; or
- the annuity must be recomputed under the **General Rule**.

When box 2a is empty / unknown, the per-person fallback is `taxableBase1099R = (taxable1099R == null) ? gross1099R : taxable1099R`.

---

# 4) Taxable-amount decision tree

For each non-IRA pension / annuity record:

```text
if disability pension before minimum retirement age:
    route out of line 5 to line 1h workflow
    add pensionEntryId to entryIdsRoutedToLine1h
    skip in all 5a/5b accumulators

elif iraSepSimple:
    route to IRA workflow (lines 4a/4b/4c)

elif tax-free rollover applies:
    compute taxable amount under rollover rule (Step 5 below)

elif PSO exclusion applies:
    reduce taxable amount by allowed PSO exclusion

elif reliable box 2a and no lower special-method amount applies:
    taxable = box 2a

else:
    taxable = amount computed under Simplified Method or General Rule
```

At the return level:

```text
if every included line-5 amount is fully taxable AND no exception flagged:
    line5a = null
    line5b = sum(gross amounts)
else:
    line5a = sum(gross amounts)
    line5b = sum(per-record taxable amounts)
```

---

# 5) Tax-free rollover rule (line 5c box 1)

Use the rollover rule when the taxpayer rolled over a distribution from one qualified employer plan to another eligible plan or to an IRA and the rollover is tax-free.

For a qualifying tax-free rollover reported on line 5:
- enter the **distribution from box 1** on line 5a;
- subtract any **employee contributions that were taxable when made** (usually box 5) from box 1;
- subtract the **rollover amount**;
- enter the remainder on line 5b; and
- check **line 5c, box 1**.

### Per-record computation (Pub. 575)

Inputs:
- `gross = 1099-R box 1` (Gap-4 fix: base is **box 1**, NOT box 2a; this avoids double-deducting the box-5 basis when box 2a is already pre-netted by the payer)
- `box5Offset = 1099-R box 5` (employee contributions / Roth premiums recovered tax-free)
- `rolloverAmount = user-confirmed amount rolled over`

Computation:

```text
rolloverBase     = gross1099R || 0
reducedBase      = subtractNonNegative(rolloverBase, rolloverAmount + box5Offset)
taxableAfterRollover = addNonNull(reducedBase, taxableRrb)   // RRB not rollover-eligible; re-added
```

If the remaining taxable amount is zero and there is no other line-5 taxable pension amount, line 5b shows **0** (zero, not null) rather than be left empty.

### Important limitation

Do **not** use the tax-free rollover formula for rollovers that are generally taxable, such as a rollover to a **Roth IRA** or **designated Roth account**. Those remain taxable except to the extent a return of after-tax contributions is involved.

### Form 4972 interaction

If part of a qualifying lump-sum distribution is rolled over, the rolled-over portion loses access to special lump-sum treatment. The line-5 workflow keeps rollover handling and any **Form 4972** path aligned; see §9 below for the post-hoc lines 5a/5b adjustment.

---

# 6) Retired Public Safety Officer exclusion (line 5c box 2)

An **eligible retired public safety officer (PSO)** can exclude from income up to **$3,000** of qualified insurance premiums paid from an eligible retirement plan distribution. This applies to certain accident, health, and qualified long-term care insurance premiums.

## 6.1 Current-law rule (SECURE 2.0)

Under current law, the exclusion is **not limited to direct payment from the plan to the insurer**. The distribution may be paid:
- directly from the plan to the insurer, **or**
- to the retired officer, who then pays the premiums.

That is the rule to implement for tax year 2025.

## 6.2 Double-gate election

The implementation uses an explicit `hasPsoElection = isEligibleRetiredPublicSafetyOfficer AND electsPsoPremiumExclusion` gate. Mere eligibility is not enough — affirmative election is required on the return.

## 6.3 Amount excluded

```text
psoExclusion       = min(totalQualifyingPsoPremiumsPaid, 3000)
taxableAfterPso    = subtractNonNegative(taxableAfterRollover, psoExclusion)
```

The 1099-R taxable amount usually **does not already reflect** this exclusion. So if PSO applies, the engine must reduce the otherwise-taxable line-5 amount itself. The $3,000 cap is hard-coded inline (`new BigDecimal("3000")`) — stable since IRC §402(l) enactment.

## 6.4 Reporting outputs

When the PSO exclusion applies on line 5:
- `line5a` still reflects the gross amount when line 5a is otherwise required (the exception now flips `fullyTaxableOverall = false`);
- `line5b` reflects the reduced taxable amount;
- `line5c.box2Pso = true`.

## 6.5 Overlap with line 1h disability-pension PSO

If the taxpayer is still below minimum retirement age and reporting taxable disability pension on **line 1h**, the PSO notation belongs with the **line 1h** reporting path instead of line 5. The line-1h `entryIdsRoutedToLine1h` re-routing (see §2.2) prevents the same distribution from carrying its PSO exclusion on both lines.

---

# 7) Simplified Method vs. General Rule

## 7.1 Simplified Method (Pub. 575)

If pension / annuity payments come from a **qualified plan** and the taxpayer is **not required to use the General Rule**, the taxpayer must use the **Simplified Method** to determine the tax-free part of each payment.

Qualified plans here include:
- qualified employee plans,
- qualified employee annuities,
- tax-sheltered annuities (403(b)), and
- eligible governmental plan annuities covered by the IRS pension rules.

The Simplified Method is the normal rule for modern qualified-plan annuities. It uses:
- annuity starting date,
- age(s) at the annuity starting date,
- total investment in the contract / after-tax cost,
- monthly payment amount, and
- prior-year tax-free recovery.

High-level per-record computation:

```text
factor               = determineSimplifiedMethodFactor(age, jointAge)     // age-based table
monthlyExclusion     = investmentInContract / factor
priorYearRecovery    = priorYearTaxFreeRecoveryAmount || 0
remainingBasis       = max(0, investmentInContract - priorYearRecovery)
currentYearTaxFree   = min(monthlyExclusion * numberOfPaymentsThisYear, remainingBasis)
currentYearTaxable   = max(0, grossReceivedThisYear - currentYearTaxFree)
```

**2025 Single-life factor brackets** (`determineSimplifiedMethodFactor` helper):

| Age at annuity starting date | Factor |
|---|---|
| 55 or less | 360 |
| 56–60 | 310 |
| 61–65 | 260 |
| 66–70 | 210 |
| 71 or more | 160 |

A separate joint-life table applies when `jointAnnuitantAgeAtStartingDate` is present.

After the taxpayer has fully recovered the investment in the contract, later payments are fully taxable.

## 7.2 When the General Rule applies (Pub. 939)

The **General Rule** is still required in certain cases. Most importantly, it applies when:
- the annuity is paid under a **nonqualified plan**, or
- for certain qualified-plan annuities with older annuity starting dates where the Simplified Method is not mandatory.

Precise rule to preserve:
- If the annuity starting date was **before November 19, 1996**, the General Rule may apply.
- If the annuity starting date was **between July 1, 1986, and November 18, 1996**, the taxpayer could elect either the General Rule or the Simplified Method, and that choice is **irrevocable** for later payments.
- If payments are from a qualified plan and the taxpayer is **not required** to use the General Rule, use the Simplified Method.

The old shorthand "after July 1, 1986 -> Simplified Method" is too loose. The implementation must preserve the **November 19, 1996** cutoff and the irrevocable-election rule for the 1986-1996 window.

## 7.3 General Rule computation concept

The General Rule uses the taxpayer's **investment in the contract** and **expected return** to determine the tax-free part of each payment:

```text
exclusionRatio = investmentInContract / expectedReturn
taxFreePart    = exclusionRatio * paymentReceived
taxablePart    = paymentReceived - taxFreePart
```

Pub. 939 is the controlling source for this computation.

## 7.4 Per-annuity basis-recovery limitation (deferred)

Currently the Simplified Method / General Rule overrides apply at the per-person level rather than per-annuity. When a taxpayer has multiple annuities each requiring its own basis recovery, the implementation collapses them into a single basis computation. This is a known limitation tracked in `outstanding.md`; impact is rare in practice.

---

# 8) RRB-1099-R handling (railroad NSSEB / Tier 2 / VDB / Supplemental)

Amounts reported on **Form RRB-1099-R** (the **green** form) belong in the line-5 pension / annuity family. This is distinct from **Form RRB-1099** (the **blue** form, SSEB) which feeds line 6a.

Per-person RRB-1099-R accumulator (`computePensionForPerson`):

| Box | Label | Taxability | Routing |
|---|---|---|---|
| Box 3 | Employee contributions / cost | Not taxable (basis) | If > 0, signals Box 4 NSSEB needs Simplified/General Rule basis recovery |
| Box 4 | NSSEB (Tier 1 non-SSEB) + Tier 2 | Fully taxable when box 3 = 0; partially taxable when box 3 > 0 | Direct line 5b contribution |
| Box 5 | VDB (Vested Dual Benefit) | **Always fully taxable** | Direct line 5b contribution |
| Box 6 | Supplemental annuity | **Always fully taxable** | Direct line 5b contribution |
| Box 7 | Total gross paid | Fallback when detail boxes absent | Treated as fully taxable when relied on |

Key implementation notes:
- RRB-1099-R is filtered by `belongsToPersonRrb1099R` (SSN attribution; MFS-protected via the orchestrator-level guard);
- RRB amounts are **not rollover-eligible** — they are re-added to `taxableAfterRollover` after the rollover subtraction;
- if federal income tax was withheld, the RRB copy must be preserved for the paper-return / package logic.

Do not assume railroad annuity forms are already net of every special rule.

---

# 9) Lump-sum distributions and Form 4972 — post-hoc lines 5a/5b adjustment

A lump-sum distribution reported on line 5 can trigger **Form 4972** rather than ordinary line-5 taxation for all or part of the taxable amount.

## 9.1 Form 4972 multiplicity and eligibility

- **One Form 4972 per participant** born before January 2, 1936;
- Not available for IRAs or 403(b) plans;
- MFJ may have two separate Form 4972s (one per spouse).

## 9.2 Post-hoc adjustment to lines 5a/5b

After the ordinary line 5a/5b computation, the `adjustPensionLinesForForm4972` method (`TaxReturnComputeService.java:28405-28453`) walks both `form4972Taxpayer` and `form4972Spouse`. For each eligible Form 4972:

```text
if Part III elected (10-year averaging on full ordinary income):
    subtractGross   += box1GrossDistribution
    subtractTaxable += box2aTaxableAmount     // remove entire distribution from 5a/5b

elif Part II elected only (capital-gain treatment):
    subtractGross   += box3CapitalGain
    subtractTaxable += box3CapitalGain        // remove ONLY the capital-gain portion

income.line5b = max(0, current5b - subtractTaxable)
income.line5a = max(0, current5a - subtractGross)
if (line5a == 0 || line5a == line5b):
    income.line5a = null                       // re-apply blank-when-fully-taxable rule
```

The Part II adjustment now correctly removes box 3 from **both** lines 5b (taxable) and 5a (gross), preventing the previously-tracked double-tax of the capital-gain portion (line 5b ordinary + Form 4972 20%). Verify before adding new behavior here.

Form 4972's own tax computation feeds into the **Form 1040 line 16** stack (`Form4972.tax`), not into line 5.

---

# 10) Line 5c rules

For tax year 2025, line 5c is a checkbox / write-in line associated with the line-5 pension reporting. The three boxes are **independent** — each gates on a distinct exception.

## 10.1 Box 1 (Rollover)

Check if the taxpayer had a **rollover**, including a direct rollover, that is reportable through the line-5 pension workflow.

```text
line5cBox1 = taxpayer.hasRollover() OR spouse.hasRollover()
```

## 10.2 Box 2 (PSO election)

Check if the taxpayer is claiming the **retired public safety officer premium exclusion** (see §6).

```text
line5cBox2 = taxpayer.hasPsoElection() OR spouse.hasPsoElection()
```

## 10.3 Box 3 (Other write-in)

Check if another IRS instruction requires a **word or code** next to line 5b, and populate the related text. Box 3 is **derived from text presence**:

```text
line5cText  = joinLine4cOtherText(taxpayer.line5cBox3Text(), spouse.line5cBox3Text())
line5cBox3  = hasText(line5cText)
```

Design difference vs. line 4c: line 4c box 3 fires on an explicit `hasBox3Other` flag (needed because 4c has HFD auto-prepend requiring a text-independent trigger); line 5c uses text-derived box 3 (no auto-prepend equivalent — PSO is disclosed via box 2 checkbox, not via write-in text). Both designs are IRS-correct for their respective lines.

The `joinLine4cOtherText` helper (LinkedHashSet dedup; split-on-semicolon for the spouse arg) is shared with the 4c path.

## 10.4 No multi-exception breakout-statement

Unlike line 4c (which has `LINE4_EXCEPTION_BREAKOUT_STATEMENT_REQUIRED`), line 5c has **no** equivalent breakout-statement-required logic — there is no IRS rule mandating a separate exception-breakout statement for pension exceptions.

### Suggested output model

```json
{
  "line5a": null,
  "line5b": 0,
  "line5c": {
    "box1Rollover": false,
    "box2Pso": false,
    "box3Other": false,
    "additionalStatementText": ""
  }
}
```

PDF field mapping (canonical):
- `c1_38[0]` → `line5c_box1_rollover`
- `c1_39[0]` → `line5c_box2_pso`
- `c1_40[0]` → `line5c_box3_other`
- `f1_67[0]` → `line5c_additional_statement_text`

---

# 11) Attachments, withholding, and Form 5329

## 11.1 Federal withholding

If federal income tax was withheld from a **Form 1099-R** pension distribution:
- include the withholding on **Form 1040 line 25b**; and
- preserve the attachment requirement for the withholding document in paper-return / package logic.

## 11.2 Railroad retirement withholding

If federal income tax was withheld from **Form RRB-1099-R**, preserve the corresponding attachment requirement for the railroad retirement form copy as well.

## 11.3 Form 5329 — early-distribution additional tax (per return, not per person)

Form 5329 is generated **one per return** (taxpayer + spouse aggregated when MFJ). This is distinct from **Form 8606** which is **one per person per tax year**.

Generation gate:

```text
requiresForm5329 = hasEarlyDistributionAdditionalTaxForForm5329
                  OR (distributionCode in { "1", "S" } AND no exceptionCodeOrReason)

if requiresForm5329 AND exceptionCodeOrReason missing:
    emit BLOCKING flag FORM5329_EXCEPTION_CODE_REQUIRED
```

Form 5329 tax routes to **Schedule 2 line 8**, not to line 5b.

## 11.4 Form 4972

If special lump-sum treatment applies (§9), include **Form 4972** in the return package logic; tax flows to **line 16**, the post-hoc adjustment to lines 5a/5b runs in `adjustPensionLinesForForm4972`.

---

# 12) Deterministic compute pipeline

## Step 0 — Collect inputs

Documents / data:
- Form 1099-R entries (with `iraSepSimple == false`)
- Form RRB-1099-R entries (NSSEB / VDB / Supplemental / cost / total)
- per-person pension-income personal form (rollover / PSO / Simplified Method / General Rule / Form 5329 facts)
- other-earned-income form `entryIdsRoutedToLine1h` (disability re-routing)
- Form 4972 election facts when needed

## Step 1 — MFS guard

`computePensionAnnuities` receives `boolean isMfsReturn`. At the top of the method:

```text
pensionIncomeSpouse = isMfsReturn ? null : pensionIncomeSpouseRaw
spouseSsn           = isMfsReturn ? null : normalizeSsn(getString(spouse, "ssn"))
```

This single guard protects 7+ outputs: line 5a, line 5b, line 5c boxes 1/2/3, line 5c write-in text, Form 5329, attachment flags. Part of the 12-orchestrator MFS-cascade.

## Step 2 — Validate gating

`validatePensionStatementGating` emits **BLOCKING** `PENSION_STATEMENT_UPLOAD_REQUIRED` when `hadPensionOrAnnuityIncome = true` but no 1099-R / RRB-1099-R uploaded.

## Step 3 — Classify each distribution

```text
if iraSepSimple:
    route to lines 4a / 4b / 4c (mirror filter)
elif pensionEntryId in entryIdsRoutedToLine1h:
    route to line 1h (disability pension before minimum retirement age)
else:
    keep in line-5 pension / annuity set
```

## Step 4 — Compute each record's taxable amount

Priority order (per-record):

```text
taxableBase = (taxable1099R == null) ? gross1099R : taxable1099R

if needsSimplifiedMethod:
    taxableBase = computePensionTaxableViaSimplifiedMethod(...) ?: taxableBase
if needsGeneralRule:
    taxableBase = computePensionTaxableViaGeneralRule(...) ?: taxableBase

taxableAfterRollover = hasRollover
    ? subtractNonNegative(gross1099R, rolloverAmount + box5Offset) + taxableRrb
    : taxableBase

taxableAfterPso = hasPsoElection
    ? subtractNonNegative(taxableAfterRollover, min(psoPremiums, 3000))
    : taxableAfterRollover

person.taxablePensionsAnnuities = taxableAfterPso
```

## Step 5 — Decide whether line 5a is blank

```text
grossPensions   = addNonNull(taxpayer.gross, spouse.gross)
taxablePensions = addNonNull(taxpayer.taxable, spouse.taxable)
hasAnyException = taxpayer.hasAnyException OR spouse.hasAnyException

fullyTaxableOverall =
    hasPositiveAmount(grossPensions)
    AND !hasAnyException
    AND hasPositiveAmount(taxablePensions)
    AND grossPensions == taxablePensions

line5a = fullyTaxableOverall ? null : roundMoney(grossPensions)
line5b = roundMoney(taxablePensions)
```

## Step 6 — Finalize line 5c

```text
line5cBox1 = OR-aggregate hasRollover across spouses
line5cBox2 = OR-aggregate hasPsoElection across spouses
line5cText = joinLine4cOtherText(taxpayer text, spouse text)
line5cBox3 = hasText(line5cText)
```

## Step 7 — Post-hoc Form 4972 adjustment

Run `adjustPensionLinesForForm4972` to remove the Form-4972-taxed portion from lines 5a/5b (§9).

---

# 13) Validation flags

| Flag | Severity | Trigger |
|---|---|---|
| `PENSION_STATEMENT_UPLOAD_REQUIRED` | BLOCKING | `hadPensionOrAnnuityIncome = true` AND no 1099-R / RRB-1099-R uploaded |
| `FORM5329_EXCEPTION_CODE_REQUIRED` | BLOCKING | `requiresForm5329 = true` AND no `exceptionCodeOrReason` provided |
| `PENSION_TAXABLE_NOT_DETERMINED` | NON-BLOCKING | Any 1099-R has box 2b checked (taxable amount not determined) |

---

# 14) Downstream consumers

- **Form 1040 line 9** uses **line 5b** (not line 5a) as one of the eight income operands (gross-vs-taxable pattern).
- **Form 1040 line 11a/11b** (AGI) and **line 15** (taxable income) inherit via line 9.
- **Schedule 2 line 8** receives any Form 5329 early-distribution additional tax.
- **Form 1040 line 16** receives any Form 4972 tax (separate from line 5b).
- **Form 6251** AMTI — line 5b feeds into AMTI via the AGI add-back path (no pension-specific AMT preference).
- **Pub. 915 SS Worksheet** uses **line 5b** as one of the "other income" operands at worksheet line 3 (Pub. 915 line 3 in `6abcd.md`).
- **Schedule 8812 line 18a** earned-income test uses **line 1z**, not line 5b — pension income is unearned for CTC purposes.

---

# 15) Implementation guardrails

- Do **not** send IRA distributions (`iraSepSimple = true`) through line 5.
- Do **not** leave line 5a populated when the entire line-5 pension total is fully taxable.
- Do **not** assume box 2a is always final; check rollover, PSO, and basis-recovery rules first.
- Do **not** keep the old direct-payment-only PSO rule; that is outdated for 2025.
- Do **not** oversimplify Simplified Method vs. General Rule to a single July 1, 1986 cutoff — preserve the November 19, 1996 cutoff and the 1986-1996 irrevocable election.
- Do **not** mix Form 4972 tax treatment into ordinary line-5 taxable-income math; run the post-hoc adjustment.
- Do **not** treat the Form 5329 penalty as part of line 5b.
- Do **not** double-count a line-1h-rerouted disability distribution; honor `entryIdsRoutedToLine1h` everywhere.
- Do **not** read spouse-side pension data on MFS; the single orchestrator-level guard suppresses it.

---

# 16) Practical developer cheat sheet

- **Fully taxable overall** -> `5a = null`, `5b = total payments`.
- **Any partial-tax item** -> `5a = total gross`, `5b = total taxable`.
- **Tax-free rollover** -> reduce taxable by (rollover + box-5 basis) from **gross** (not box 2a) and check `5c box 1`.
- **PSO election (double-gate: eligible AND elects)** -> reduce taxable by up to **$3,000** and check `5c box 2`.
- **Qualified-plan annuity with basis (post-Nov-18-1996)** -> **Simplified Method**.
- **Pre-Nov-19-1996 / nonqualified annuity** -> usually **General Rule**.
- **Disability pension before minimum retirement age** -> not line 5; route to **line 1h** via `entryIdsRoutedToLine1h`.
- **IRA distribution** -> not line 5; route to **lines 4a/4b/4c**.
- **Form 4972 Part III** -> remove full distribution from 5a/5b; Form 4972 carries the tax to line 16.
- **Form 4972 Part II** -> remove only box-3 capital-gain portion from 5a/5b.
- **Form 5329** -> per-return form, routes to Schedule 2 line 8.
- **Form 8606** -> per-person per year, not generated from line 5.

---

# 17) Forms checklist

**Filed with the return** (when applicable):
- Form 1040 — lines 5a / 5b / 5c
- Form 5329 — per return; routes to Schedule 2 line 8
- Form 4972 — per qualifying participant; routes to Form 1040 line 16

**Computed and retained** (worksheets, not filed):
- Simplified Method Worksheet (Pub. 575)
- General Rule computations (Pub. 939)

**Information returns** (inputs only):
- Form 1099-R (with `iraSepSimple = false`)
- Form RRB-1099-R

---

# 18) Current code citations (TaxReturnComputeService.java, 2026-06-14)

| Concern | Method | Line |
|---|---|---|
| Orchestrator entry | `computePensionAnnuities` | 9642 |
| Call site (from main pipeline) | `computeReturn` | 496 |
| Disability re-routing set | `entryIdsRoutedToLine1h` (HashSet) | 9745 |
| Per-person aggregator | `computePensionForPerson` | 9997 |
| 1h-routed-id check (per-record skip) | inside `computePensionForPerson` | 10045 |
| 1h-routed-id check (IRA path) | shared filter | 10774, 10783 |
| Post-hoc Form 4972 adjustment | `adjustPensionLinesForForm4972` | 28405 |
| Form 4972 adjustment call site | `computeReturn` | 1542 |
| Single-guard MFS cascade citation | breadcrumb | 5019, 10960 |

---

## Verification log

| Date | Auditor | Scope | Outcome |
|---|---|---|---|
| 2026-05-12 | 5a.xlsx Code Validation walkthrough | Line 5a verification (10 issues) | COMPLETE — 10/10 closed. MFS guard added to `computePensionAnnuities` (cascade extended to 10 orchestrators); knowledge file renamed; blank-when-fully-taxable rule verified; per-person 0-vs-null compliance verified; iraSepSimple mirror-filter verified; RRB-1099-R component split documented; Form 5329 per-return cardinality contrasted with Form 8606 per-person. Backend regression: 752 → 753 tests (+1 lock-in). |
| 2026-05-12 | 5b.xlsx Code Validation walkthrough | Line 5b verification (10 issues) | COMPLETE — 10/10 closed. MFS guard cascade extended; line-9 breadcrumb extended to 9 audit IDs; 5a/5b bilateral coverage milestone closed; 4-stage taxable chain (Simplified → General → rollover → PSO) trace documented; Pub. 575 Gap-4 rollover-from-gross fix (`rolloverBase = gross1099R`); per-annuity basis-recovery limitation logged as deferred. Backend regression: 753/753 pass. |
| 2026-05-12 | 5c.xlsx Code Validation walkthrough | Line 5c verification (10 issues) | COMPLETE — 10/10 closed. MFS guard cascade extended to 3 audits; 3-independent-box aggregation verified (rollover / PSO / text-derived other); no breakout-statement requirement (vs 4c); `joinLine4cOtherText` shared helper reuse documented. Pension cluster complete (3rd shared-aggregator cluster after 3abc + 4abc). Backend regression: 753/753 pass. |
| 2026-06-14 | Specification re-author | Lines 5a + 5b + 5c | Re-authored against current code state (orchestrator at line 9642, `adjustPensionLinesForForm4972` at line 28405); preserved IRS prose and statutory citations (IRC §72, §402, §402(l), Pub. 575, Pub. 939, Notice 2014-7); documented `entryIdsRoutedToLine1h` single-source-of-truth re-routing; clarified Form 5329 per-return vs Form 8606 per-person cardinality; noted Form 4972 Part II adjustment now removes capital-gain portion from both lines 5a and 5b (closes prior known double-tax observation). |
