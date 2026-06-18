# Knowledge: Form 1040 Lines 27a / 27b / 27c — Earned Income Credit (2025)

> Audited 2026-04-19. Implementation complete as of 2026-03-28. Gaps G2–G6 fixed 2026-04-19. G7 (full-time student age 19–23) and G8 (MFS separated-spouse exception) fixed 2026-04-19. G1 deferred (Schedule E OOS). G9–G11 remain OOS.

---

## 1. Line Identity

| Line | Label | Type | Notes |
|---|---|---|---|
| **27a** | Earned income credit (EIC) | Dollar amount | Refundable credit; feeds line 32 → line 33 |
| **27b** | Clergy filing Schedule SE | Checkbox only | Always `false` in current scope; SE out of scope. PDF semantic field name: `line27b_clergy_schedule_se` (renamed 2026-06-11 from misleading `line27a_from_schedule_eic`; see `XLS/Computations/27b.md §13`). Full IRS rule covers BOTH clergy AND church-employee-income (lay employees of churches under Internal Revenue Code §3121(w)); see `XLS/Computations/27b.md §1b`. |
| **27c** | EIC opt-out or disqualified | Checkbox only | **INTENDED** checked when EIC = null (any disqualifier or user choice). ★ G12 NEW GAP 2026-05-16 — auto-check NOT YET IMPLEMENTED; frontend has zero `line27c` references; checkbox renders unchecked regardless of EIC state. |

Downstream:
```
Form1040.line32 = line27a + line28 + line29 + line30 + line31
Form1040.line33 = line25d + line26 + line32
```

---

## 2. Backend Implementation

**File:** `TaxReturnComputeService.java`

| Method | Lines | Purpose |
|---|---|---|
| `computeLine27aEIC()` | 15702–15789 | Main EIC computation — all gates, lookup, result |
| `eicTableLookup()` | 15795–15850 | Phase-in / plateau / phaseout formula; FLOOR rounding |
| `computeInvestmentIncomeForEic()` | 15878–15890 | Investment income ceiling test (2a + 2b + 3b + 7a positive) |
| `countEicQualifyingChildren()` | 15900–15930 | Count qualifying children from personal form array |
| `sumW2WagesBySsn()` | 15856–15871 | W-2 box 1 wages, filtered by SSN or null (MFJ = all) |

**Constant:** `INVESTMENT_INCOME_CEILING_EIC_2025 = new BigDecimal("11950")` at line 122

**Output field:** `Payments.earnedIncomeCredit` (BigDecimal, null when EIC = 0 or disqualified)

**Called from:** `computeLine31ThroughLine38()` — after lines 25a–26; result stored at
`payments.setEarnedIncomeCredit(line27a)`.

---

## 3. Computation Flow

```
eicTaxpayer form (claimsEIC == true)
  ↓
Hard disqualifier checks:
  hasForm2555 = true → return null
  isNonresidentAlien = true → return null
  eicPreviouslyDenied = true → emit FORM_8862_EIC_REQUIRED flag → return null
    (unless Form 8862 Part II filed and eicEligible = true)
  MFS filing status:
    qualifiesForMfsSeparatedSpouseEicException = false → return null
    qualifiesForMfsSeparatedSpouseEicException = true  → filingStatusStr = "Single" (IRC §32(d)(2))
  ↓
Earned income:
  = sumW2WagesBySsn(w2Entries, isMfj ? null : taxpayerSsn)    // W-2 box 1
  + otherEarnedIncome (personal form)
  + combat pay (if electNontaxableCombatPay; W-2 box 12Q filtered by taxpayer SSN)
  [MFJ: also add spouseOtherEarnedIncome + spouse combat pay if spouseElectNontaxableCombatPay]
  If earnedIncome ≤ 0 → return null
  ↓
Investment income gate:
  investmentIncome = taxExemptInterest (2a) + taxableInterest (2b) + ordinaryDividends (3b)
                   + max(0, capitalGainLoss (7a))
  If investmentIncome > $11,950 → return null
  ↓
Qualifying children:
  numChildren = countEicQualifyingChildren(eicTaxpayer)
  [counts children where:
    (a) childSSN present (non-blank)
    (b) relationship is a qualifying IRS relationship (EIC_QUALIFYING_RELATIONSHIPS set)
    (c) childFiledJointReturn ≠ true
    (d) monthsLivedWithTaxpayer > 6
    (e) isPermanentlyDisabled = true
        OR ageAtYearEnd < 19
        OR (ageAtYearEnd 19–23 AND isFullTimeStudent = true)]
  MFS exception + numChildren == 0 → return null (exception requires qualifying child)
  ↓
Childless age test (only if numChildren == 0 and non-MFS):
  age = computeAgeAtYearEnd(you.dateOfBirth)
  if age < 25 OR age > 64 → return null
  ↓
Dual EIC table lookup (FLOOR rounding):
  creditFromEarned = eicTableLookup(earnedIncome, filingStatusStr, numChildren)
  creditFromAGI    = eicTableLookup(agi, filingStatusStr, numChildren)
  credit = min(creditFromEarned, creditFromAGI)
  if credit ≤ 0 → return null
  ↓
return roundMoney(credit)
```

---

## 4. 2025 EIC Parameters (IRS Rev. Proc. 2024-40)

### Investment income ceiling

| Tax year | Ceiling |
|---|---|
| **2025** | **$11,950** |
| 2024 | $11,600 |

### Maximum credits

| Children | Max credit |
|---|---|
| 0 | $649 |
| 1 | $4,328 |
| 2 | $7,152 |
| 3+ | $8,046 |

### Full parameter table

| Children | Phase-in rate | Phase-in ends | Max credit | Phaseout start Single/HOH | Phaseout start MFJ | Phaseout rate | Phaseout end Single/HOH | Phaseout end MFJ |
|---|---|---|---|---|---|---|---|---|
| 0 | 7.65% | $8,490 | $649 | $10,620 | $17,730 | 7.65% | $19,104 | $26,214 |
| 1 | 34% | $12,730 | $4,328 | $23,350 | $30,470 | 15.98% | $50,434 | $57,554 |
| 2 | 40% | $17,880 | $7,152 | $23,350 | $30,470 | 21.06% | $57,310 | $64,430 |
| 3+ | 45% | $17,880 | $8,046 | $23,350 | $30,470 | 21.06% | $61,555 | $68,675 |

> Childless phaseout end $19,104: algebraically derived as ~$18,484 but IRS Rev. Proc. 2024-40 publishes $19,104 as authoritative. Implementation uses the IRS-published value.

---

## 5. Input Personal Forms

| Form ID | Scope |
|---|---|
| `earned-income-credit-taxpayer` | All filing statuses — taxpayer's elections and qualifying children |
| `earned-income-credit-spouse` | MFJ supplemental — spouse-specific combat pay and other earned income |

### Taxpayer form fields

| Field | Type | Description |
|---|---|---|
| `claimsEIC` | boolean | Screening gate — must be `true` or method returns null |
| `hasForm2555` | boolean | Disqualifier: Form 2555 filed |
| `isNonresidentAlien` | boolean | Disqualifier: nonresident alien |
| `eicPreviouslyDenied` | boolean | Triggers `FORM_8862_EIC_REQUIRED` flag |
| `qualifiesForMfsSeparatedSpouseEicException` | boolean | **[G8 fixed 2026-04-19]** MFS separated-spouse exception (IRC §32(d)(2)); when `true`, uses Single phaseout thresholds; requires ≥1 qualifying child |
| `electNontaxableCombatPay` | boolean | Election to include W-2 box 12Q combat pay in earned income |
| `otherEarnedIncome` | decimal | Jury duty, union strike, long-term disability before retirement age |
| `eicQualifyingChildren` | array | Per-child entries (multiplicity: multiple) |

### Per-child entry fields

| Field | Type | Description |
|---|---|---|
| `childFirstName` | string | |
| `childLastName` | string | |
| `childSSN` | string | Required — missing = child not counted |
| `childYearOfBirth` | integer | Used to compute age at year-end 2025 |
| `isPermanentlyDisabled` | boolean | Bypasses age test entirely |
| `isFullTimeStudent` | boolean | **[G7 fixed 2026-04-19]** Extends qualifying age to 23 for full-time students; only effective when age is 19–23 |
| `relationship` | string | Must match `EIC_QUALIFYING_RELATIONSHIPS` set — invalid/blank → child not counted **[G3 fixed 2026-04-19]** |
| `monthsLivedWithTaxpayer` | integer | Must be > 6 to qualify |
| `isAlsoDependent` | boolean | Is this child also claimed as a dependent? |
| `childFiledJointReturn` | boolean | **[G2 fixed 2026-04-19]** `true` → child not counted (IRC §32(c)(3)(D)) |

### Spouse form fields

| Field | Type | Description |
|---|---|---|
| `spouseElectNontaxableCombatPay` | boolean | Spouse's combat pay election |
| `spouseOtherEarnedIncome` | decimal | Spouse's other earned income |

---

## 6. Investment Income Computation

`computeInvestmentIncomeForEic()` reads from the already-computed `Form1040.income` model:

```java
BigDecimal total = safeAmount(income.getTaxExemptInterest())   // line 2a
                 + safeAmount(income.getTaxableInterest())      // line 2b
                 + safeAmount(income.getOrdinaryDividends());   // line 3b
// Capital gains: only gains count; losses = $0
BigDecimal capGain = income.getCapitalGainLoss();              // line 7a
if (capGain != null && capGain.compareTo(BigDecimal.ZERO) > 0) total = total.add(capGain);
return total;
```

**Important scope note:** Net passive income and net rental/royalty income from Schedule E are listed in the IRS EIC rules as investment income components but are NOT included here because Schedule E is out of scope. This is a known deferred item (see section 12, G1).

---

## 7. Qualifying Child Count

`countEicQualifyingChildren()` iterates the `eicQualifyingChildren` array and counts entries where **all** of the following are true:
1. `childSSN` is present (non-blank) **AND not an ITIN** (digits-only does not start with "9") **[Gap J fixed 2026-06-11 — IRC §32(m)]**
2. `relationship` matches `EIC_QUALIFYING_RELATIONSHIPS` set (exact match for named relationships; prefix match for "foster child") **[G3 fixed]**
3. `childFiledJointReturn ≠ true` **[G2 fixed]**
4. `monthsLivedWithTaxpayer` > 6
5. `isPermanentlyDisabled = true` (any age — exempt from BOTH the age limit AND the younger-than-taxpayer requirement per IRC §152(c)(3)(B)), OR (`ageAtYearEnd < 19` AND `ageAtYearEnd < filerAge`), OR (`ageAtYearEnd` 19–23 AND `isFullTimeStudent = true` AND `ageAtYearEnd < filerAge`) **[G7 fixed; Gap G fixed 2026-06-11 — IRC §152(c)(3)(A) + Pub 596 Rule 8]**

Where `filerAge` is the taxpayer's age at year-end on Single/HOH/QSS, or `max(taxpayerAge, spouseAge)` on Married filing jointly per the "younger than YOU OR your spouse" rule.

The `EIC_QUALIFYING_RELATIONSHIPS` set contains (case-insensitive): son, daughter, stepchild, brother, sister, half-brother, half-sister, stepbrother, stepsister, grandchild, nephew, niece. Foster child uses `startsWith("foster child")`.

**Filer-level identification (Gap L fixed 2026-06-11 — IRC §32(c)(1)(E) + §32(m)):** the hard-disqualifier block also rejects EIC entirely when the taxpayer's SSN starts with "9" (ITIN), and on Married filing jointly when EITHER spouse's SSN starts with "9". The EIC rule is stricter than the Child Tax Credit's "neither has SSN" gate: for EIC, BOTH spouses must have SSN; EITHER spouse with ITIN disqualifies.

**Childless EIC eligibility tests (Gap H + Gap I fixed 2026-06-11 — IRC §32(c)(1)(A)(ii)):** when `numChildren == 0`, three new disqualifier checks fire before the existing age 25–64 test:
1. **Gap I** — `mainHomeInUsMoreThanHalfYear` (Boolean.FALSE.equals → disqualifies). Per §32(c)(1)(A)(ii)(I). Null fails open for backward compatibility.
2. **Gap H, taxpayer leg** — `taxpayerCanBeClaimedAsDependent` (Boolean.TRUE.equals → disqualifies). Per §32(c)(1)(A)(ii)(III).
3. **Gap H, MFJ spouse leg** — `spouseCanBeClaimedAsDependent` (Boolean.TRUE.equals → disqualifies). Per §32(c)(1)(A)(ii)(III) extended to MFJ joint eligibility.

These three checks are scoped to the childless path only — they do NOT affect with-child EIC. Backed by columns `main_home_in_us_more_than_half_year`, `taxpayer_can_be_claimed_as_dependent`, `spouse_can_be_claimed_as_dependent` on `pf_earned_income_credit` (V60 migration).

---

## 8. W-2 Wage Attribution

`sumW2WagesBySsn()` reads `wagesTipsOtherCompAmount` (box 1):
- `isMfj = true` → `ssn = null` → includes all household W-2 entries
- `isMfj = false` → filters to entries where `employeeSSN` (normalized, digits-only) matches taxpayer SSN

SSN normalization: `normalizeSsn()` strips all non-digit characters before comparison.

---

## 9. Form 8862 Gate

If `eicPreviouslyDenied = true`:
1. Flag `FORM_8862_EIC_REQUIRED` is emitted to block compute
2. If Form 8862 is present AND `form8862.isClaimsEIC() = true` AND `form8862.getEicEligible() = true` → EIC computation proceeds normally
3. Otherwise → EIC = null

---

## 10. Frontend Component

**File:** `C:\us-tax\us-tax-ui\src\app\forms\form-earned-income-credit.component.ts`

- `@Input() formId` — set to `'earned-income-credit-taxpayer'` or `'earned-income-credit-spouse'`
- Screening gate: elections + qualifying children section hidden unless `claimsEIC = true`
- Qualifying children: repeating rows via `eicQualifyingChildren` array
- `divorceFormerSpouseSSN` is not relevant here (that is on the estimated-tax-payments form)

---

## 11. Unit Test Inventory

**File:** `TaxReturnComputeServiceTest.java`

| Test | What it verifies |
|---|---|
| `line27aPhaseInRange_singleNoChildren` | Single, $5,000 wages → phase-in credit (7.65% × $5,000 = $382) |
| `line27aMaxCreditPlateau_singleNoChildren` | Single, $9,000 wages (plateau) → $649 |
| `line27aZeroAbovePhaseoutEnd_singleNoChildren` | Single, $19,200 > phaseout end $19,104 → null |
| `line27aWithOneQualifyingChild_plateau` | Single, 1 child, $18,000 wages → $4,328 |
| `line27aInvestmentIncomeCeilingDisqualifies` | Investment income $12,000 > $11,950 → null |
| `line27aChildlessAgeTooOld_disqualifies` | Age 66 (born 1959), no children → null |
| `line27aForm2555Disqualifies` | `hasForm2555 = true` → null |
| `line27aMfj_higherPhaseoutStart` | MFJ, $13,000 income — past Single phaseout start but before MFJ start → credit |
| `line27aFlowsIntoLine33` | EIC feeds line 33 total payments |
| `form8862_eicLine3Shortcut_unblocksEIC` | Form 8862 Part II (eicEligible=true) unblocks denied EIC |
| `form8862_eicDenied_withoutForm8862_emitsFlag` | `eicPreviouslyDenied=true`, no Form 8862 → flag emitted |
| `line27aCombatPayElection_addsToEarnedIncome` | W-2 wages $4k + box12Q $5k + 1099-INT $5k + election → AGI=$9k, earned=$9k → $649 |
| `line27aQualifyingChild_jointReturn_notCounted` | `childFiledJointReturn=true` → child excluded → childless EIC at $9k → $649 |
| `line27aQualifyingChild_invalidRelationship_notCounted` | "Family friend" relationship → child excluded → childless at $9k → $649 |
| `line27aFullTimeStudent_age21_countsAsQualifyingChild` | Age 21 + `isFullTimeStudent=true` → qualifies → 1-child plateau $4,328 |
| `line27aFullTimeStudent_age21_notStudent_excluded` | Age 21 + `isFullTimeStudent=false` → excluded → childless at $20k > phaseout-end → null |
| `line27aMfsSeparatedSpouseException_allowsEic` | MFS + exception `true` + 1 child → Single table → $4,328 |
| `line27aMfsNoException_blocksEic` | MFS + exception `false` → null |

---

## 12. E2E Test Inventory

**File:** `e2e/tests/line27a-earned-income-credit.spec.ts` (7 tests)

| Test | What it verifies |
|---|---|
| `line27a: childless single filer in phase-in range receives EIC` | $9,000 wages → $649 |
| `line27a: EIC with one qualifying child at plateau` | $18,000, 1 child → $4,328 |
| `line27a: income above phaseout end disqualifies EIC (null)` | $20,000 > phaseout end → null |
| `line27a: Form 2555 filer is disqualified from EIC` | `hasForm2555=true` → null |
| `line27a: EIC flows into line 33 total payments` | $649 EIC + $500 withholding → totalPayments $1,149 |
| `line27a MFJ: combined household wages with one qualifying child earn EIC` | **[G5]** MFJ, combined wages, 1 child → EIC > 0 |
| `line27a: combat pay election (electNontaxableCombatPay) adds box 12Q to earned income` | **[G6]** W-2 box 12Q added to earned income when election true |

**Coverage gaps (deferred):** MFJ higher phaseout boundary.

---

## 13. Gaps and Deferred Items

| ID | Severity | Status | Description |
|---|---|---|---|
| G1 | LOW | Deferred | `computeInvestmentIncomeForEic()` excludes net passive income and net rental/royalty income from Schedule E — these are listed in IRS EIC rules as investment income components but Schedule E is out of scope. |
| G2 | LOW | **Fixed 2026-04-19** | `childFiledJointReturn` boolean added to per-child entry; `countEicQualifyingChildren()` skips child when true. Unit test added. |
| G3 | LOW | **Fixed 2026-04-19** | `EIC_QUALIFYING_RELATIONSHIPS` Set added; `countEicQualifyingChildren()` validates relationship against list. Unit test added. |
| G4 | LOW | **Fixed 2026-04-19** | Unit test `line27aCombatPayElection_addsToEarnedIncome` added (uses `interestIncomeAmount` field on 1099-INT). |
| G5 | LOW | **Fixed 2026-04-19** | E2E test for MFJ with qualifying children added. |
| G6 | LOW | **Fixed 2026-04-19** | E2E test for combat pay election added (seeds 1099-INT to push AGI into plateau). |
| G7 | LOW | **Fixed 2026-04-19** | Full-time student path: `countEicQualifyingChildren()` now accepts age 19–23 children when `isFullTimeStudent=true`. YAML, Angular, backend, and 2 unit tests updated. |
| G8 | LOW | **Fixed 2026-04-19** | MFS separated-spouse exception (IRC §32(d)(2)): `qualifiesForMfsSeparatedSpouseEicException=true` → uses Single table thresholds; requires ≥1 qualifying child. YAML, Angular (`isMfs` getter loads `filing-status`), backend, and 2 unit tests updated. |
| G9 | OOS | Deferred | Line 27b clergy checkbox — always `false` until Schedule SE is implemented. |
| G10 | OOS | Deferred | Schedule EIC PDF attachment — qualifying child data drives the count but no printable Schedule EIC is generated. |
| G11 | OOS | Deferred | Schedule C/SE earned income — net SE earnings excluded from EIC earned income base (SE out of scope). |
