# Form 1040 (2025) — Lines 27a / 27b / 27c — Earned Income Credit (EIC)

> Source of truth: 2025 Form 1040 + 2025 Instructions for Form 1040 + Schedule EIC (Form 1040) + Publication 596 (EIC for 2025) + IRS Rev. Proc. 2024-40 (2025 inflation-adjusted EIC parameters) + IRC §32 (statutory authority).

---

## 1. Line Identity

| Line | Form 1040 label | Type | Notes |
|---|---|---|---|
| **27a** | Earned income credit (EIC) | Dollar amount | Refundable credit; 1st addend of line 32 → line 33 |
| **27b** | Clergy filing Schedule SE | **Checkbox** | Always **unchecked** in current scope (SE is out of scope) |
| **27c** | If you do not want to claim the EIC, check here | **Checkbox** | Auto-derived from EIC state (G12 — not yet wired in frontend) |

**Important 2025 structural note**: Lines 27b and 27c are **checkboxes only** — they carry no dollar amounts. They are different from earlier tax years where similar lines sometimes carried amounts.

- Line 27a flows to **line 32** (refundable credits subtotal), and line 32 flows into **line 33** (total payments).
- Line 27b applies only when the taxpayer is a minister / clergy / church-employee filing Schedule SE — always **unchecked** in current app scope (SE is out of scope).
- Line 27c is checked when EIC is not being claimed (user opt-out or disqualification); if checked, line 27a = 0.

### Practical rule

```text
line27b = false   # always — Schedule SE is out of current scope

if taxpayer_disqualified_for_EIC or taxpayer_declines_EIC:
    line27c = true
    line27a = 0  (stored as null in Payments.earnedIncomeCredit)
else:
    line27c = false
    line27a = EIC computed from 2025 IRS worksheet and table
```

---

## 2. Formula (Line 27a)

```text
// Step 1: Screening / hard disqualifiers (see §8 for details)
if eicTaxpayer is null OR claimsEIC != true: return null
if hasForm2555 == true:                       return null
if isNonresidentAlien == true:                return null
if taxpayer SSN is ITIN (leading-9):          return null     // Gap L closure 2026-06-11
if MFJ and spouse SSN is ITIN (leading-9):    return null     // Gap L — BOTH spouses required (stricter than CTC)
if eicPreviouslyDenied:
    if Form 8862 absent OR claimsEIC=false:   emit FORM_8862_EIC_REQUIRED (blocking); return null
    if eicEligible != true:                   return null      // silent
if MFS:
    if NOT qualifiesForMfsSeparatedSpouseEicException: return null
    filingStatusStr = "Single"                 // IRC §32(d)(2) MFS exception remap

// Step 2: Earned income base
earnedIncome = sumW2WagesBySsn(w2Entries, isMfj ? null : taxpayerSsn)
inmateExclusion = isMfj ? addNonNull(taxpayerInmateWages, spouseInmateWages) : taxpayerInmateWages
earnedIncome   -= inmateExclusion                              // IRC §32(c)(2)(B)(iv)
earnedIncome   += otherEarnedIncome (taxpayer form)
earnedIncome   += form1040.income.nontaxableCombatPayElection  // ★ single source of truth — line 1i
if isMfj and eicSpouse != null:
    earnedIncome += spouseOtherEarnedIncome

if earnedIncome <= 0: return null

// Step 3: Investment income gate
investmentIncome = taxExemptInterest (2a) + taxableInterest (2b)
                 + ordinaryDividends (3b) + max(0, capitalGainLoss (7a))
if investmentIncome > INVESTMENT_INCOME_CEILING_EIC_2025 (= $11,950): return null

// Step 4: Qualifying children count (using younger-than threshold per Pub 596 Rule 8)
filerAgeForYoungerThanCheck = isMfj ? max(taxpayerAge, spouseAge) : taxpayerAge
numChildren = countEicQualifyingChildren(eicTaxpayer, filerAgeForYoungerThanCheck)

// Step 5: MFS exception requires at least one qualifying child
if isMfs and numChildren == 0: return null

// Step 6: Childless-EIC preconditions (IRC §32(c)(1)(A)(ii))
if numChildren == 0:
    if mainHomeInUsMoreThanHalfYear == false: return null       // Gap I — §32(c)(1)(A)(ii)(I)
    if taxpayerCanBeClaimedAsDependent == true: return null     // Gap H — §32(c)(1)(A)(ii)(III)
    if isMfj and spouseCanBeClaimedAsDependent == true: return null
    if taxpayerAge == null or taxpayerAge < 25 or taxpayerAge > 64: return null  // §32(c)(1)(A)(ii)(II)

// Step 7: Dual EIC table lookup; take the lesser
creditFromEarned = eicTableLookup(earnedIncome, filingStatusStr, numChildren)
creditFromAGI    = eicTableLookup(agi,          filingStatusStr, numChildren)
credit           = min(creditFromEarned, creditFromAGI)
if credit <= 0: return null
return roundMoney(credit)
```

### EIC table lookup function (`eicTableLookup`)

```text
function eicTableLookup(income, filingStatus, numChildren) → BigDecimal:
    if income == null or income <= 0: return 0
    isMfj = (filingStatus == "Married filing jointly")
    clampedChildren = min(numChildren, 3)
    params = EIC_PARAMS[clampedChildren][isMfj]
    // params: { phaseInRate, phaseInEnd, maxCredit, phaseoutStart, phaseoutRate, phaseoutEnd }

    if income <= params.phaseInEnd:
        credit = income × params.phaseInRate
    else if income <= params.phaseoutStart:
        credit = params.maxCredit
    else if income < params.phaseoutEnd:
        credit = params.maxCredit − (income − params.phaseoutStart) × params.phaseoutRate
    else:
        return 0

    // IRS EIC table truncates to nearest dollar.
    return max(0, credit).setScale(0, FLOOR)
```

---

## 3. 2025 EIC Parameters

Source: IRS Rev. Proc. 2024-40 (official 2025 inflation adjustments) and the 2025 Form 1040 instructions.

### 3a. Investment Income Ceiling

| Tax Year | Ceiling |
|---|---|
| **2025** | **$11,950** |
| 2024 (reference) | $11,600 |

If investment income > $11,950, the taxpayer is **ineligible for any EIC**. Backend identifier: `INVESTMENT_INCOME_CEILING_EIC_2025`.

### 3b. Maximum Credits (2025)

| Qualifying Children | Max Credit |
|---|---|
| **0** | **$649** |
| **1** | **$4,328** |
| **2** | **$7,152** |
| **3+** | **$8,046** |

### 3c. Phaseout Starts (2025)

| Qualifying Children | Single / HOH / QSS | MFJ |
|---|---|---|
| **0** | **$10,620** | **$17,730** |
| **1+** | **$23,350** | **$30,470** |

### 3d. Full 2025 Parameter Table

| # Children | Phase-in Rate | Phase-in End (max credit reached) | Phaseout Starts — Single/HOH/QSS | Phaseout Starts — MFJ | Phaseout Rate | Phaseout Ends — Single/HOH/QSS | Phaseout Ends — MFJ |
|---|---|---|---|---|---|---|---|
| **0** | 7.65% | $8,490 | $10,620 | $17,730 | 7.65% | **$19,104** | $26,214 |
| **1** | 34% | $12,730 | $23,350 | $30,470 | 15.98% | $50,434 | $57,554 |
| **2** | 40% | $17,880 | $23,350 | $30,470 | 21.06% | $57,310 | $64,430 |
| **3+** | 45% | $17,880 | $23,350 | $30,470 | 21.06% | $61,555 | $68,675 |

> The IRS EIC table is tabulated in $50 increments. The closed-form formula above matches the published table within $1 and uses FLOOR rounding to nearest dollar to match the IRS table convention.

> **0-children phaseout end**: $19,104 for Single/HOH/QSS. Derived from ($649 / 0.0765) + $10,620 = $18,484 algebraically, but IRS Rev. Proc. 2024-40 publishes $19,104 as the authoritative value — the implementation uses $19,104.

### 3e. Childless EIC — Age Requirement (2025)

Taxpayer must be **age 25–64** (inclusive) at the end of tax year 2025:

- Born on or **after** January 1, 1961 (not yet 65)
- Born on or **before** December 31, 2000 (at least 25)

Exception: if the taxpayer is a **qualifying child of another person**, they cannot claim childless EIC regardless of age.

### 3f. MFJ vs. Single/HOH/QSS

The phaseout start threshold is higher for MFJ in every category. All other filing statuses use the Single/HOH/QSS column.

---

## 4. Line 27b — Clergy Filing Schedule SE (Checkbox)

### What it is

Line 27b is a **checkbox** — not a dollar amount. Check it when **all three** of the following are true (the first is satisfied by EITHER category):

1. The taxpayer is either:
   - **Category A — Member of clergy:** a minister, a member of a religious order who has not taken a vow of poverty, or a Christian Science practitioner, **OR**
   - **Category B — Church employee income:** a lay employee of a church or qualified church-controlled organization that has elected exemption from Social Security and Medicare taxes under IRC §3121(w).
2. Filing Schedule SE, **and**
3. The amount on Schedule SE line 4c includes an amount also reported on Form 1040 line 1z.

The on-form short label is just "Clergy filing Schedule SE." The full 2025 instructions add the church-employee path (Category B); both categories produce the same line-1z-vs-Schedule-SE-line-4c overlap, which is what the checkbox signals. **Updated 2026-06-11** — earlier versions of this section only listed Category A.

### Why it exists

The checkbox tells the EIC computation that special clergy / church-employee earned-income rules apply so that income is not double-counted in the EIC earned-income worksheet.

### In current app scope

Schedule SE / self-employment is **out of scope**. Line 27b is always **unchecked**:

```text
Form1040.line27b = false   // always, until Schedule SE support is added
```

Implementation: there is no field, no helper, and no PDF-fill mapping. The only reference in the codebase is the inline comment at `TaxReturnComputeService.java:27223`:

```java
// 27b (clergy SE checkbox) = always false in current scope (SE out of scope).
```

The AcroForm field is `line27b_clergy_schedule_se` (semantic name). **Field rename history**: from 2025 form release until 2026-06-11, the project's PDF semantic field map mislabeled this checkbox as `line27a_from_schedule_eic` — that name was a misreading of the printed form's left-side "attach Sch. EIC." instruction text and is no longer used anywhere in the codebase. See `XLS/Computations/27b.md §13` and `XLS/Computations/36.xlsx` for the rename closure trail.

---

## 5. Line 27c — EIC Opt-Out or Disqualification Checkbox

### What it is

Line 27c is a **checkbox** — not a dollar amount. Check it when:

- The taxpayer **does not want to claim the EIC** (voluntary opt-out), **or**
- The eligibility flow determines the taxpayer **cannot** claim the EIC (the 2025 instructions explicitly say in several disqualifying situations: "You can't take the credit. Check the box on line 27c.").

### Effect

```text
if line27c == checked:
    line27a = 0
```

### When to check it

Auto-check line 27c when:

- `claimsEIC == false` (user screening gate), OR
- Any hard disqualifier is met during eligibility screening (Form 2555, investment income exceeded, invalid SSN, nonresident alien, MFS without exception, childless and out-of-age-band, etc.)

Equivalently — and this is the wiring intent — check it when `payments.earnedIncomeCredit == null`.

### Current implementation — G12 OPEN

The backend stores no field for line 27c; the wiring is documented intent only. Inline comment at `TaxReturnComputeService.java:27224`:

```java
// 27c (EIC opt-out checkbox) = auto-determined by eligibility (no separate stored field).
```

★ **G12 OPEN** — the frontend does NOT yet write the AcroForm checkbox `line27c_eic_opt_out_checkbox`. The intended one-liner at PDF-fill time is:

```ts
values["line27c_eic_opt_out_checkbox"] =
    (payments?.earnedIncomeCredit == null) || (eicTaxpayer?.claimsEIC === false);
```

See `outstanding.md` G12 (2026-05-16) for the tracking entry.

---

## 6. Nontaxable Combat Pay Election (EIC Worksheet — Not a Separate Form 1040 Line)

In 2025, the nontaxable combat pay election is handled **within the EIC worksheet** via Form 1040 line 1i, not as a separate named Form 1040 line.

### What it is

W-2 box 12 code Q reports **nontaxable combat pay** (excludable under IRC §112 for service in a combat zone). By default this amount is **not** counted as earned income. The taxpayer may **elect** to include it in earned income for EIC purposes.

### Implementation — single source of truth

★ **Line 1i is the single source of truth** for the nontaxable combat pay election. `computeLine27aEIC` reads `form1040.getIncome().getNontaxableCombatPayElection()` (the aggregated taxpayer + spouse election from line 1i) and adds it to earned income before the dual table lookup. The same value is read by the Schedule 8812 ACTC consumer.

This means the previously separate `electNontaxableCombatPay` (taxpayer form) and `spouseElectNontaxableCombatPay` (spouse form) fields on `earned-income-credit-*` personal forms are **no longer read by the EIC helper** — they are deprecated. YAML+UI cleanup is tracked in `outstanding.md`. The 1i.xlsx Code Validation #2 closure (2026-05-10) drove this consolidation.

### When to elect

Including combat pay may increase or decrease the EIC depending on the taxpayer's income position:

- If earned income is in the **phase-in range** → including combat pay increases earned income → increases credit
- If earned income is already in the **phaseout range** → including combat pay further phases out the credit → reduces it

The taxpayer should compute both ways and choose the higher result. The election is captured at the line 1i intake.

### MFJ

Each spouse independently decides whether to elect. Both may elect, one may elect, or neither may elect. The line 1i aggregation handles the per-spouse summation (also protected by an MFS guard in `computeCombatPay`).

---

## 7. Prior Year Earned Income Election — EXPIRED FOR 2025

The prior year earned income election (introduced by ARPA 2021 for COVID relief — allowing taxpayers to use 2019 or 2020 earned income if higher) **has expired**. It is **not available** on 2025 returns.

- Do not collect `priorYear2024EarnedIncome` from users.
- Do not implement a prior-year earned income substitution path.
- The EIC computation always uses current-year (2025) earned income.

---

## 8. Eligibility Rules

### 8a. Basic Tests (All Filers)

All of the following must be true to claim any EIC:

| Test | Rule |
|---|---|
| Valid SSN (filer) | Taxpayer must have a valid SSN issued by the return due date. ITIN (leading-9) does not qualify. **[Gap L closure 2026-06-11]** |
| Valid SSN (spouse on MFJ) | On Married filing jointly, the spouse must ALSO have a valid SSN — either spouse with an ITIN disqualifies the entire credit. **Stricter than the Child Tax Credit's "neither" gate.** **[Gap L closure 2026-06-11]** |
| Earned income | Must have at least $1 of earned income. |
| Investment income | Investment income ≤ $11,950. |
| Filing status | Single, HOH, QSS, or MFJ. **MFS generally disqualifies.** See §8c. |
| Not a qualifying child of another | Taxpayer cannot be claimed as someone else's qualifying child. |
| No Form 2555 | Cannot claim foreign earned income exclusion (Form 2555) and EIC in the same year. |

### 8b. Additional Tests — Childless EIC

If the taxpayer has no qualifying children for EIC, the eligible-individual definition under IRC §32(c)(1)(A)(ii) adds three preconditions on top of the universal §8a tests:

- **IRC §32(c)(1)(A)(ii)(I) — US principal abode > half year.** Main home in the United States (the 50 states and the District of Columbia, not U.S. territories) for more than half the year. U.S. military stationed outside the U.S. on extended active duty are treated as living here all year. Implemented via the `mainHomeInUsMoreThanHalfYear` intake field on `earned-income-credit-taxpayer`. Polarity: `false` disqualifies; `null` (unanswered) fails open. **[Gap I closure 2026-06-11]**
- **IRC §32(c)(1)(A)(ii)(II) — age 25–64 at year-end** (see §3e).
- **IRC §32(c)(1)(A)(ii)(III) — not claimable as another's §151 dependent.** Implemented via `taxpayerCanBeClaimedAsDependent` and, on Married filing jointly, `spouseCanBeClaimedAsDependent`. Polarity: `true` on either disqualifies; `null` (unanswered) fails open. **[Gap H closure 2026-06-11]**
- (Distinct from §32(c)(1)(A)(ii)(III)): the filer cannot be a **full-time student** (enrolled full-time for 5+ months) — *unless* the student is at least age 25. This is a different rule from the dependent disqualifier and is captured indirectly via the dependent disqualifier for most full-time students (who are typically claimable by their parents).

### 8c. MFS Exception — IRC §32(d)(2)

A married taxpayer filing separately **may** claim EIC if they meet the **separated-spouse exception** captured by `qualifiesForMfsSeparatedSpouseEicException`:

1. Did not live with their spouse at any time during the **last 6 months** of the tax year (or are legally separated under state law), AND
2. Maintained a household that was the qualifying child's main home for more than half the year, AND
3. The eligible child lived with the filer for more than half the year.

When the exception applies, the implementation:

- allows EIC to proceed,
- remaps `filingStatusStr = "Single"` so the table lookup uses Single phaseout thresholds (IRC §32(d)(2)),
- still requires at least one qualifying child (MFS exception is not available childless).

(Many such filers actually qualify to file as Head of Household and should consider doing so instead.)

---

## 9. Qualifying Child Tests

A child is a qualifying child for EIC purposes if ALL five tests are met. Implementation: `countEicQualifyingChildren` at `TaxReturnComputeService.java:28135`.

### 9a. Relationship Test (IRC §32(c)(3)(B))

Child must be the taxpayer's:

- Son, daughter, stepchild, foster child (placed by authorized agency or court order), or descendant thereof
- Brother, sister, half-brother/sister, stepbrother/stepsister, or descendant thereof
- Legally adopted child = biological child for this purpose

Implementation: relationship matched against `EIC_QUALIFYING_RELATIONSHIPS` set (case-insensitive), with `"foster child"` matched via `startsWith` to accept variants like `"foster child placed by court order"`. **[G3 closure 2026-04-19]**

### 9b. Age Test (IRC §152(c)(3))

At year-end 2025 the child must be:

- **Under age 19 AND younger than the taxpayer** (or younger than the spouse on Married filing jointly), OR
- **Under age 24 AND a full-time student AND younger than the taxpayer** (or younger than the spouse on Married filing jointly), OR
- **Any age if permanently and totally disabled** — no age ceiling AND no younger-than-taxpayer requirement per IRC §152(c)(3)(B).

> EIC age test: under 19 (not 17 as in CTC). A full-time student under 24 qualifies. Disabled = no age limit. The "younger than the taxpayer" precondition (IRC §152(c)(3)(A)) applies to the under-19 and student-under-24 paths but NOT to the disabled path. **On Married filing jointly, the child must be younger than EITHER spouse — implementation passes `max(taxpayerAge, spouseAge)` as the threshold per Publication 596 Rule 8.** **[Gap G closure 2026-06-11]**

### 9c. Residency Test

Child must have **lived with the taxpayer** in the U.S. for **more than half the year** (>6 months captured as `monthsLivedWithTaxpayer > 6`). Temporary absences (illness, school, vacation, military) are ignored.

### 9d. Joint Return Test (IRC §32(c)(3)(D))

Child cannot file a joint return with a spouse, **unless** the joint return was filed solely to claim a refund of withheld taxes or estimated tax paid (no tax liability on either return). Implementation: `childFiledJointReturn == true` disqualifies the child. **[G2 closure 2026-04-19]**

### 9e. Valid SSN for Child — IRC §32(m)

Child must have a valid SSN (not ITIN, not ATIN) issued by the return due date. If the child's SSN is missing or invalid the EIC for that child is disallowed.

★ **Gap J closure (2026-06-11)** — implementation rejects children with a leading-9 identifier (ITIN), mirroring the Schedule 8812 ITIN pattern at `TaxReturnComputeService.java:30469`. A child with a leading-9 SSN is not counted even if every other §152(c) test is satisfied.

### 9f. Tiebreaker Rules (Child Qualifies for Multiple People)

Applied in order:

1. **Only one is the parent** → the parent wins.
2. **Both parents file separate returns** → parent with whom child lived *longer* wins; if equal time, parent with **higher AGI** wins.
3. **No parent claims the child** → person with **highest AGI** among all eligible claimants wins, but only if their AGI exceeds any parent's AGI.
4. **Only non-parent can claim** → person with **highest AGI** wins.

When a child is treated as the qualifying child of the noncustodial parent under the divorced/separated parent rules:

- only the noncustodial parent may claim the **dependency exemption, CTC, ACTC, ODC**,
- the **custodial parent retains EIC** for that child. The noncustodial parent cannot claim EIC for the child even with Form 8332.

Tiebreaker arbitration is out of scope; the user declares which children they are claiming and the backend validates the count only.

---

## 10. Earned Income — Inclusions and Exclusions

### 10a. What Counts as Earned Income

| Source | Notes |
|---|---|
| W-2 wages, salary, tips, commissions | Box 1 of all W-2s attributed to the taxpayer (or all W-2s on MFJ) |
| Net self-employment earnings | Schedule C/F net profit × (1 − 0.5 × SE rate) — **out of scope** until SE is implemented |
| Statutory employee income | W-2 box 13 "statutory employee" checked; Schedule C used |
| Union strike benefits | Taxable portion |
| Jury duty pay | Taxable jury fees |
| Long-term disability before minimum retirement age | Taxable disability pay from an employer plan |
| Nontaxable combat pay (by election) | Aggregated upstream at Form 1040 line 1i (single source of truth) |

### 10b. What Does NOT Count

- Pensions, annuities (including taxable IRA distributions)
- Social Security benefits (any portion)
- Unemployment compensation
- Interest, dividends, capital gains
- Net rental / royalty income
- Passive K-1 income (partnerships, S-corps, trusts)
- 401(k) / 403(b) / 457 salary deferrals
- Excluded dependent care benefits (Form 2441)
- Nontaxable military allowances (except combat pay when elected)
- Workers' compensation
- Disability pay received **after** reaching minimum retirement age
- **Inmate wages (IRC §32(c)(2)(B)(iv))** — explicitly subtracted from the W-2 wage base via `taxpayerInmateWages` (and `spouseInmateWages` on MFJ)

---

## 11. Schedule EIC

**Required when**: taxpayer has one or more qualifying children for EIC purposes.

### Fields per child (up to 3 children shown on the IRS form; a 4th can be attached)

| Field | Description |
|---|---|
| `childFirstName` / `childLastName` | |
| `childSSN` | Must be valid (not ITIN — leading-9 fails Gap J) |
| `childYearOfBirth` | E.g., "2018" |
| `isPermanentlyDisabled` | Boolean (bypasses age test if true) |
| `relationship` | Son / Daughter / Stepchild / Foster child / Brother / Sister / Grandchild / Nephew / Niece / etc. |
| `monthsLivedWithTaxpayer` | Must be > 6 (7–12); enter 12 if all year |
| `isFullTimeStudent` | Boolean (extends qualifying age to under-24 with younger-than check; G7 closure 2026-04-19) |
| `childFiledJointReturn` | Boolean (G2: true disqualifies) |
| `isAlsoDependent` | Boolean (informational) |

Schedule EIC is an attachment — it does not produce a dollar value. The qualifying child count from Schedule EIC determines which EIC table row (0 / 1 / 2 / 3+) applies. (★ G10 — full Schedule EIC PDF generation is deferred OOS; the count is used inline.)

---

## 12. Input Mapping

### Statement sources

| Source | Field | Use |
|---|---|---|
| W-2 (attributed by `employeeSSN`) | `wagesTipsOtherCompAmount` (box 1) | Earned income (SSN-filtered for non-MFJ; all on MFJ) |
| 1099-INT, 1099-DIV, Schedule B | Taxable/exempt interest, dividends | Investment income gate via Form 1040 lines 2a/2b/3b |
| Form 1040 line 7a | Net capital gain (positive only) | Investment income gate |

### Personal form sources

| Form | Field | Use |
|---|---|---|
| `earned-income-credit-taxpayer` | `claimsEIC` | Screening gate — Convention 5 |
| `earned-income-credit-taxpayer` | `hasForm2555` | Hard disqualifier |
| `earned-income-credit-taxpayer` | `isNonresidentAlien` | Hard disqualifier |
| `earned-income-credit-taxpayer` | `eicPreviouslyDenied` | Form 8862 gate; emits `FORM_8862_EIC_REQUIRED` |
| `earned-income-credit-taxpayer` | `qualifiesForMfsSeparatedSpouseEicException` | IRC §32(d)(2) MFS exception (G8 closure 2026-04-19) |
| `earned-income-credit-taxpayer` | `mainHomeInUsMoreThanHalfYear` | Gap I — childless §32(c)(1)(A)(ii)(I) |
| `earned-income-credit-taxpayer` | `taxpayerCanBeClaimedAsDependent` | Gap H — childless §32(c)(1)(A)(ii)(III) |
| `earned-income-credit-taxpayer` | `spouseCanBeClaimedAsDependent` | Gap H — MFJ childless §32(c)(1)(A)(ii)(III) |
| `earned-income-credit-taxpayer` | `otherEarnedIncome` | Jury duty, union strike, long-term disability before retirement age |
| `earned-income-credit-taxpayer` | `eicQualifyingChildren[*]` | Schedule EIC per-child entries |
| `earned-income-credit-spouse` | `spouseOtherEarnedIncome` | MFJ-only — added when `isMfj && eicSpouse != null` |
| `you` | `ssn`, `dateOfBirth` | Taxpayer SSN (ITIN gate; W-2 SSN filter), age for §32(c)(1)(A)(ii)(II) age band and younger-than check |
| `spouse` | `ssn`, `dateOfBirth` | MFJ ITIN gate + max(taxpayerAge, spouseAge) computation (Gap G) |

### Upstream computed Form 1040 fields

| Field | Use |
|---|---|
| `form1040.income.taxExemptInterest` (line 2a) | Investment income ceiling test |
| `form1040.income.taxableInterest` (line 2b) | Investment income ceiling test |
| `form1040.income.ordinaryDividends` (line 3b) | Investment income ceiling test |
| `form1040.income.capitalGainLoss` (line 7a) | Investment income ceiling test (positive only) |
| `form1040.income.nontaxableCombatPayElection` (line 1i) | ★ Single source of truth for combat pay election |
| `form1040.adjustments.line11bAmountFromLine11aAdjustedGrossIncome` (AGI) | Dual EIC table lookup (lesser of earned-income vs AGI) |
| `taxpayerInmateWages` / `spouseInmateWages` | IRC §32(c)(2)(B)(iv) exclusion (M4) |

### Form 8862 (when `eicPreviouslyDenied`)

| Field | Use |
|---|---|
| `form8862.claimsEIC` | Part II gate: must be true |
| `form8862.eicEligible` | Part II result: must be true |

---

## 13. Personal Form Design

### Form: `earned-income-credit-taxpayer`

**Screening section:**

| Field | Type | Description |
|---|---|---|
| `claimsEIC` | boolean | Screening gate — does the taxpayer want to claim the EIC? |
| `hasForm2555` | boolean | Filed Form 2555 (disqualifies) |
| `isNonresidentAlien` | boolean | Nonresident alien not electing joint return treatment (disqualifies) |
| `eicPreviouslyDenied` | boolean | IRS previously denied EIC — Form 8862 required |
| `qualifiesForMfsSeparatedSpouseEicException` | boolean | IRC §32(d)(2) MFS exception (G8 closure 2026-04-19) |

**Childless EIC preconditions (relevant when `numChildren == 0`):**

| Field | Type | Description |
|---|---|---|
| `mainHomeInUsMoreThanHalfYear` | boolean | §32(c)(1)(A)(ii)(I) — false disqualifies (Gap I) |
| `taxpayerCanBeClaimedAsDependent` | boolean | §32(c)(1)(A)(ii)(III) — true disqualifies (Gap H) |
| `spouseCanBeClaimedAsDependent` | boolean | MFJ only — Gap H |

**Other earned income (show if `claimsEIC == true`):**

| Field | Type | Description |
|---|---|---|
| `otherEarnedIncome` | decimal | Jury duty, union strike, long-term disability before retirement age |

**Qualifying children (show if `claimsEIC == true`; `multiplicity: multiple`):**

| Field | Type | Description |
|---|---|---|
| `childFirstName`, `childLastName` | string | |
| `childSSN` | string | Valid SSN required (not ITIN — leading-9 rejected) |
| `childYearOfBirth` | integer | e.g. 2018 |
| `isPermanentlyDisabled` | boolean | Bypass age test entirely |
| `isFullTimeStudent` | boolean | Extends qualifying age to under-24 |
| `relationship` | enum | Son / Daughter / Stepchild / Foster child / Brother / Sister / Grandchild / Nephew / Niece / half-* / step-* |
| `monthsLivedWithTaxpayer` | integer | 1–12; must be > 6 |
| `childFiledJointReturn` | boolean | G2 — true disqualifies |
| `isAlsoDependent` | boolean | Informational |

**MFJ note:** the taxpayer form covers qualifying children for both spouses (the child only needs to qualify relative to one spouse). The spouse form records spouse-specific income only.

### Form: `earned-income-credit-spouse` (MFJ supplemental only)

| Field | Type | Description |
|---|---|---|
| `spouseOtherEarnedIncome` | decimal | Spouse's other earned income (jury duty, etc.) |

> **Deprecated** — `electNontaxableCombatPay` (taxpayer) and `spouseElectNontaxableCombatPay` (spouse) are no longer read by the EIC helper. Combat pay election is captured upstream at Form 1040 line 1i. YAML+UI cleanup is tracked in `outstanding.md`.

---

## 14. Compute Logic (Helper Signature and Wiring)

### Helper signature — `computeLine27aEIC`

Location: `TaxReturnComputeService.java:27835-28004` (12-parameter signature):

```java
private BigDecimal computeLine27aEIC(
        Map<String, Object> eicTaxpayer,
        Map<String, Object> eicSpouse,
        Map<String, Object> you,
        Map<String, Object> spouse,
        List<Map<String, Object>> w2Entries,
        BigDecimal taxpayerInmateWages,
        BigDecimal spouseInmateWages,
        Form1040 form1040,
        String filingStatusStr,
        boolean isMfj,
        Form8862 form8862,
        List<TaxReturnFlag> flags)
```

### Sub-helpers

| Method | Location | Purpose |
|---|---|---|
| `eicTableLookup` | `TaxReturnComputeService.java:28010-28065` | 2025 IRS Rev. Proc. 2024-40 parameters; FLOOR rounding to nearest dollar |
| `sumW2WagesBySsn` | `TaxReturnComputeService.java:28071-28086` | W-2 box 1 wage aggregation with optional SSN filter (null = MFJ combined) |
| `computeInvestmentIncomeForEic` | `TaxReturnComputeService.java:28093-28105` | Investment income for the $11,950 ceiling test |
| `countEicQualifyingChildren` | `TaxReturnComputeService.java:28135-…` | 5-test qualifying child count with younger-than threshold |

### Wiring sites

| Site | Location | Effect |
|---|---|---|
| EIC pre-set for Schedule 8812 Part II-B line 24 | `TaxReturnComputeService.java:1766` | `earlyPayments.setEarnedIncomeCredit(preEic)` — preflags discarded; real flags emitted later |
| Final wiring (line 27a) | `computeLine31ThroughLine38` at `line 27225-27228` | `payments.setEarnedIncomeCredit(line27a)` |
| Line 32 / 33 aggregation | `line 27262-27290` (line 32) / `line 27293-27298` (line 33) | Line 27a contributes as the 1st addend of line 32 |

### Line 27a → Line 32 → Line 33 flow

```java
// Line 32 = line 27a + line 28 + line 29 + line 30 + line 31
BigDecimal line32 = roundMoney(
    safeAmount(payments.getEarnedIncomeCredit())            // 27a
  + safeAmount(payments.getAdditionalChildTaxCredit())      // 28
  + safeAmount(payments.getAmericanOpportunityCredit())     // 29
  + safeAmount(payments.getRefundableAdoptionCredit())      // 30 (NEW for 2025)
  + safeAmount(payments.getOtherPaymentsSchedule3()));      // 31

// Line 33 = line 25d + line 26 + line 32
BigDecimal line33 = roundMoney(
    safeAmount(totalWithholding)           // 25d
  + safeAmount(line26)                     // 26 estimated
  + safeAmount(line32));                   // 32
```

---

## 15. Investment Income Computation (for EIC Gate)

Investment income for the EIC ceiling test is computed in `computeInvestmentIncomeForEic`:

| Component | Form 1040 source | Inclusion |
|---|---|---|
| Tax-exempt interest | line 2a | always |
| Taxable interest | line 2b | always |
| Ordinary dividends | line 3b | always |
| Net capital gain | line 7a | only when positive (losses treated as $0) |

★ **G1 deferred OOS** — Schedule E passive / rental / royalty income is **not** included; Schedule E is out of scope.

Losses in any category are treated as $0, not netted against gains in others.

---

## 16. Output Model

```java
// Payments.java
private BigDecimal earnedIncomeCredit;               // line 27a
```

> **Do NOT add** `nontaxableCombatPayElection` or `priorYearEarnedIncomeElection` as separate `Payments` fields. In 2025, 27b is a checkbox (always false in current scope), the prior year election has expired, and the nontaxable combat pay election is the single source of truth at Form 1040 line 1i.

Lines 27b and 27c are **not stored** on `Payments` or any output model:

- `27b` is derived as the constant `false` at PDF-fill time;
- `27c` is intended to be derived as `payments.earnedIncomeCredit == null` at PDF-fill time (G12 OPEN).

Schedule EIC qualifying children are counted inline and the count is used for the table lookup only; no `ScheduleEIC` model is currently produced (G10 deferred OOS).

---

## 17. Compute Order and Dependencies

1. **Filing status** must be resolved (MFJ vs. MFS vs. Single/HOH/QSS).
2. **Taxpayer age** (from `you.dateOfBirth`); spouse age on MFJ for younger-than threshold.
3. **Earned income** aggregated from W-2 entries (SSN-filtered for non-MFJ; all on MFJ); inmate wages subtracted.
4. **Combat pay election** applied via Form 1040 line 1i (already aggregated upstream).
5. **Investment income** computed from Form 1040 lines 2a, 2b, 3b, 7a (positive only).
6. **Investment income gate** checked — if exceeded, EIC = null.
7. **Qualifying children counted** via `countEicQualifyingChildren` with `filerAgeForYoungerThanCheck`.
8. **Childless preconditions** (Gap H / Gap I / age band) applied when `numChildren == 0`.
9. **Dual EIC table lookup** — credit from earned income; credit from AGI; take the lesser.
10. **Final guard + roundMoney** — return null when credit ≤ 0.
11. **Setter** — `payments.setEarnedIncomeCredit(line27a)`.
12. **Line 32** sums line 27a + 28 + 29 + 30 + 31.
13. **Line 33** = line 25d + line 26 + line 32.

**Called from:** `computeLine31ThroughLine38()` in `TaxReturnComputeService` — after lines 25a–26, before line 33 is finalized. Also pre-set in `earlyPayments` at `line 1766` for the Schedule 8812 Part II-B line 24 consumer.

---

## 18. Validations / Flags

| Condition | Action |
|---|---|
| `claimsEIC == false` or form absent | Return null — no EIC; check line 27c |
| `hasForm2555 == true` | Return null — Form 2555 disqualifies EIC |
| `isNonresidentAlien == true` | Return null |
| Taxpayer SSN is ITIN (leading-9) | Return null (Gap L) |
| MFJ + spouse SSN is ITIN (leading-9) | Return null (Gap L) |
| `eicPreviouslyDenied == true` + no valid Form 8862 | Emit `FORM_8862_EIC_REQUIRED` blocking flag; return null |
| MFS and no separated-spouse exception | Return null |
| MFS with exception + numChildren == 0 | Return null |
| Investment income > $11,950 | Return null — ineligible |
| Childless and `mainHomeInUsMoreThanHalfYear == false` | Return null (Gap I) |
| Childless and `taxpayerCanBeClaimedAsDependent == true` (or spouse on MFJ) | Return null (Gap H) |
| Childless and (`age < 25` or `age > 64`) | Return null |
| `earnedIncome` ≤ 0 | Return null |
| credit ≤ 0 after dual-table min | Return null |

Structural invariants:

- `line 27a ≥ 0` — IRS rules, refundable credit
- `line 27a = null` when any disqualifier hits
- EIC table truncates to nearest dollar (FLOOR rounding)

---

## 19. Special Cases

### 19a. Form 8862 (EIC Recertification)

If the IRS denied the taxpayer's EIC claim in any prior year after 1996 (due to error, reckless disregard, or fraud), the taxpayer must file **Form 8862** with the current return to reclaim EIC.

- **Implementation**: intake field `eicPreviouslyDenied` (boolean). If true, requires a valid `Form8862` with `claimsEIC = true` AND `eicEligible = true`; otherwise emit `FORM_8862_EIC_REQUIRED` (blocking) and set EIC to null.
- Full Form 8862 Part II processing is in scope only as a gate.

### 19b. Combat Pay Only Income

If a taxpayer's only earned income is nontaxable combat pay, they **may** elect to include it as earned income via Form 1040 line 1i and potentially qualify for EIC. Without the election they would have $0 earned income and be ineligible.

### 19c. Foster Children

A foster child placed by an authorized placement agency or court order qualifies under the relationship test. The implementation accepts `relationship` strings that **start with** `"foster child"` (case-insensitive) to allow variants. Unrelated children informally living in the home do **not** qualify.

### 19d. Disability Pay

Taxable disability pay from an employer plan received **before** the taxpayer reaches minimum retirement age = earned income. After reaching minimum retirement age = pension (not earned income). Permanent disability of a *child* (any age) satisfies the age test for that child via `isPermanentlyDisabled = true`.

### 19e. Delayed Refund (PATH Act)

EIC claims (and ACTC claims) on returns filed before February 15 are subject to a mandatory refund delay — refunds not issued before mid-February. No compute impact.

---

## 20. Out of Scope

| Item | Reason |
|---|---|
| Self-employment net earnings (Schedule C/F/SE) | SE computation not yet implemented (G11) |
| Line 27b clergy checkbox (checking it) | Schedule SE is out of scope (G9) |
| Schedule EIC PDF attachment | Qualifying child count is used inline; printable Schedule EIC PDF not generated (G10) |
| Schedule E passive/rental/royalty in investment income test | Schedule E is out of scope (G1) |
| Full Form 8862 Part II processing | Only the gate is in scope |
| Prior year earned income election | Expired for 2025 (ARPA 2021 provision) |
| Tiebreaker arbitration UI | User declares which children they claim; backend validates count only |
| Fiscal-year filers | Calendar year only |
| Puerto Rico / U.S. Territory EIC | Special rules apply; excluded |
| Community property state allocation (MFS) | Out of scope |
| Noncustodial parent partial EIC | Edge case; out of scope |

---

## 21. Implementation Status

| Item | Status |
|---|---|
| `Payments.earnedIncomeCredit` field | Implemented — `Payments.java` |
| `computeLine27aEIC()` helper | Implemented — `TaxReturnComputeService.java:27835-28004` |
| `eicTableLookup()` | Implemented — `TaxReturnComputeService.java:28010-28065` |
| `sumW2WagesBySsn()` | Implemented — `TaxReturnComputeService.java:28071-28086` |
| `computeInvestmentIncomeForEic()` | Implemented — `TaxReturnComputeService.java:28093-28105` |
| `countEicQualifyingChildren()` | Implemented — `TaxReturnComputeService.java:28135-…` |
| Personal form `earned-income-credit-taxpayer` | Implemented |
| Personal form `earned-income-credit-spouse` | Implemented |
| YAML intake specs | Implemented |
| Angular intake component | Implemented |
| Line 32 aggregation (27a + 28 + 29 + 30 + 31) | Implemented |
| Line 33 (25d + 26 + 32) | Implemented |
| Combat pay election via line 1i (single source of truth) | Implemented (1i.xlsx Code Validation #2 closure 2026-05-10) |
| Form 8862 Part II gate | Implemented |
| MFS §32(d)(2) exception remap (G8) | Implemented 2026-04-19 |
| Younger-than threshold = `max(taxpayerAge, spouseAge)` on MFJ (Gap G) | Implemented 2026-06-11 |
| Childless precondition `mainHomeInUsMoreThanHalfYear` (Gap I) | Implemented 2026-06-11 |
| Childless precondition `taxpayerCanBeClaimedAsDependent` / spouse (Gap H) | Implemented 2026-06-11 |
| Filer-level ITIN (leading-9) gate, MFJ both required (Gap L) | Implemented 2026-06-11 |
| Child-level ITIN (leading-9) gate (Gap J) | Implemented 2026-06-11 |
| Line 27b PDF field rename `line27a_from_schedule_eic` → `line27b_clergy_schedule_se` | Applied 2026-06-11 |
| Line 27c PDF auto-fill (G12) | OPEN — frontend not yet wired |
| Schedule E investment income (G1) | Deferred OOS |
| Self-employment EIC inputs (G11) | Deferred OOS |
| Schedule EIC PDF generation (G10) | Deferred OOS |

---

## 22. Verification log

| # | Date | Auditor | Sub-line | Result | Closures |
|---|---|---|---|---|---|
| 1 | 2026-05-15 | Claude Code | 27a | COMPLETE — 10/10 closed | See `XLS/Computations/27a.xlsx` Code Validation rows #1–#10. Highlights: ★ M4 used 5× within single helper (most-extensive M4 application); ★ MULTI-STAGE GATED CREDIT COMPUTATION (8 gate stages + dual-table lookup with min()); ★ 6 CONVENTIONS (NEW HIGH at the time) including Convention 6 MFS EXCEPTION FILING-STATUS REMAP via IRC §32(d)(2); ★ heaviest 2025 reference-data set (72 distinct EIC-table constants). |
| 2 | 2026-05-16 | Claude Code | 27b | COMPLETE — 10/10 closed | DEGENERATE checkbox audit — no code, no input, no output field, no PDF fill; only the inline comment at `TaxReturnComputeService.java:27223`. ★ STRUCTURALLY SIMPLEST audit; ★ G9 DEFERRED OOS clergy SE checkbox confirmed (always false). |
| 3 | 2026-05-16 | Claude Code | 27c | COMPLETE — 10/10 closed | STATE-DERIVED-CONSTANT audit — intended value depends on `payments.earnedIncomeCredit == null` state but ★ G12 NEW GAP — frontend does not yet write the AcroForm checkbox. Recommended fix: `values["line27c_eic_opt_out_checkbox"] = (payments?.earnedIncomeCredit == null) || (eicTaxpayer?.claimsEIC === false)`. G12 entry added to `outstanding.md`. |
| 4 | 2026-06-11 | Claude Code | 27a | Gap closure batch | Gap G (younger-than uses `max(taxpayerAge, spouseAge)` on MFJ — Pub 596 Rule 8) + Gap H (childless §32(c)(1)(A)(ii)(III) `taxpayerCanBeClaimedAsDependent` + MFJ spouse variant) + Gap I (childless §32(c)(1)(A)(ii)(I) `mainHomeInUsMoreThanHalfYear`) + Gap J (child SSN ITIN leading-9 rejection) + Gap L (filer SSN ITIN leading-9 rejection; both spouses required on MFJ — stricter than CTC). All implemented in `computeLine27aEIC` + `countEicQualifyingChildren`. |
| 5 | 2026-06-11 | Claude Code | 27b | PDF field rename | Semantic AcroForm name corrected from `line27a_from_schedule_eic` → `line27b_clergy_schedule_se` across the semantic CSV field maps and downstream consumers. Frontend writes the constant `false`. |
