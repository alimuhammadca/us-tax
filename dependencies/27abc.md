# Dependencies: Form 1040 Lines 27a / 27b / 27c — Earned Income Credit (EIC)

> Tax year 2025. Last re-authored 2026-06-14 after the 2026-06-11 Gap G / H / I / J / L closures and the line 27b PDF field rename.

---

## 1. Inputs

### 1a. Personal forms — `earned-income-credit-taxpayer`

| Field | Type | Use |
|---|---|---|
| `claimsEIC` | boolean | Screening gate (Convention 5) — must be `true` or helper returns null |
| `hasForm2555` | boolean | Hard disqualifier — true ⇒ return null |
| `isNonresidentAlien` | boolean | Hard disqualifier — true ⇒ return null |
| `eicPreviouslyDenied` | boolean | Triggers Form 8862 gate; emits `FORM_8862_EIC_REQUIRED` if Form 8862 missing/invalid |
| `qualifiesForMfsSeparatedSpouseEicException` | boolean | IRC §32(d)(2) MFS exception (G8 closure 2026-04-19) — allows MFS; remaps `filingStatusStr = "Single"`; still requires ≥1 qualifying child |
| `mainHomeInUsMoreThanHalfYear` | boolean | **Gap I** (closure 2026-06-11) — IRC §32(c)(1)(A)(ii)(I); when `numChildren == 0`, `false` disqualifies; `null` fails open |
| `taxpayerCanBeClaimedAsDependent` | boolean | **Gap H** (closure 2026-06-11) — IRC §32(c)(1)(A)(ii)(III); when `numChildren == 0`, `true` disqualifies; `null` fails open |
| `spouseCanBeClaimedAsDependent` | boolean | **Gap H** MFJ companion — true on MFJ when `numChildren == 0` ⇒ return null |
| `otherEarnedIncome` | decimal | Jury duty, union strike, long-term disability before retirement age |
| `eicQualifyingChildren[*].childFirstName` / `.childLastName` | string | Schedule EIC per-child |
| `eicQualifyingChildren[*].childSSN` | string | **Gap J** (closure 2026-06-11) — leading-9 (ITIN) is rejected; child not counted |
| `eicQualifyingChildren[*].childYearOfBirth` | integer | Age test at year-end |
| `eicQualifyingChildren[*].isPermanentlyDisabled` | boolean | Bypasses age test entirely; bypasses younger-than-filer requirement (IRC §152(c)(3)(B)) |
| `eicQualifyingChildren[*].isFullTimeStudent` | boolean | **G7** (closure 2026-04-19) — extends qualifying age to under-24 (with younger-than check) |
| `eicQualifyingChildren[*].relationship` | string | **G3** (closure 2026-04-19) — validated against `EIC_QUALIFYING_RELATIONSHIPS` set; `"foster child"` matched by `startsWith` |
| `eicQualifyingChildren[*].monthsLivedWithTaxpayer` | integer | Residency test — must be > 6 |
| `eicQualifyingChildren[*].childFiledJointReturn` | boolean | **G2** (closure 2026-04-19) — true ⇒ child not counted (IRC §32(c)(3)(D)) |
| `eicQualifyingChildren[*].isAlsoDependent` | boolean | Informational only |

### 1b. Personal forms — `earned-income-credit-spouse` (MFJ supplemental only)

| Field | Type | Use |
|---|---|---|
| `spouseOtherEarnedIncome` | decimal | Added when `isMfj && eicSpouse != null` |

> **Deprecated** — `electNontaxableCombatPay` (taxpayer) and `spouseElectNontaxableCombatPay` (spouse) on these forms are no longer read by `computeLine27aEIC`. The single source of truth for the combat pay election is **Form 1040 line 1i** (`form1040.income.nontaxableCombatPayElection`) per the 1i.xlsx Code Validation #2 closure (2026-05-10). YAML+UI cleanup tracked in `outstanding.md`.

### 1c. Taxpayer / spouse identification

| Source | Field | Use |
|---|---|---|
| `you` | `ssn` | Taxpayer SSN — used to filter W-2s in non-MFJ via `sumW2WagesBySsn`; **Gap L** (closure 2026-06-11) — leading-9 (ITIN) ⇒ return null |
| `you` | `dateOfBirth` | Childless §32(c)(1)(A)(ii)(II) age band (25–64); contributes to `filerAgeForYoungerThanCheck` |
| `spouse` | `ssn` | MFJ W-2 SSN filter; **Gap L** — leading-9 on **either** spouse disqualifies (stricter than CTC's "neither" gate) |
| `spouse` | `dateOfBirth` | **Gap G** (closure 2026-06-11) — on MFJ, younger-than threshold uses `max(taxpayerAge, spouseAge)` per Pub 596 Rule 8 |

### 1d. Filing status

| Source | Field | Use |
|---|---|---|
| `filing-status` | `filingStatus` | Determines MFJ / MFS / Single-HOH-QSS; MFS without §32(d)(2) exception disqualifies; MFJ enables combined W-2 filter (null SSN passed to `sumW2WagesBySsn`) |

### 1e. Statement sources

| Statement | Field | Use |
|---|---|---|
| W-2 | `wagesTipsOtherCompAmount` (box 1) | Earned income base — SSN-filtered for non-MFJ, all on MFJ |
| W-2 | `employeeSSN` | SSN match for W-2 attribution |
| W-2 (already aggregated upstream into line 1i) | `nontaxableCombatPayBox12Q` | Combat pay election (via line 1i — not read directly here) |

### 1f. Upstream computed Form 1040 fields

| Field path | Source | Use |
|---|---|---|
| `form1040.income.taxExemptInterest` (line 2a) | `computeInterestIncome()` | Investment income ceiling test |
| `form1040.income.taxableInterest` (line 2b) | same | Investment income ceiling test |
| `form1040.income.ordinaryDividends` (line 3b) | `computeDividendIncome()` | Investment income ceiling test |
| `form1040.income.capitalGainLoss` (line 7a) | `computeCapitalGains()` | Investment income ceiling test (positive only; losses → 0) |
| `form1040.income.nontaxableCombatPayElection` (line 1i) | `computeCombatPay()` | ★ Single source of truth for combat pay election |
| `form1040.adjustments.line11bAmountFromLine11aAdjustedGrossIncome` | `computeAgi()` | Dual EIC table lookup — lesser of earned-income lookup vs. AGI lookup |
| `taxpayerInmateWages` / `spouseInmateWages` | line-1 helpers | IRC §32(c)(2)(B)(iv) exclusion subtracted from W-2 wage base |

### 1g. Form 8862 (when `eicPreviouslyDenied`)

| Field | Use |
|---|---|
| `form8862.claimsEIC` | Part II gate — must be `true` |
| `form8862.eicEligible` | Part II result — must be `true`; otherwise silent null return |

---

## 2. Outputs

### `Payments.java` fields

| Field | Type | Set when |
|---|---|---|
| `earnedIncomeCredit` | `BigDecimal` | Non-null when EIC > 0 (post dual-table min, roundMoney); null when any disqualifier hits or final credit ≤ 0 |

### Lines 27b / 27c — not stored on `Payments`

| Sub-line | Storage | Derivation |
|---|---|---|
| **27b** | None (no field, no helper, no setter) | Always `false` — Schedule SE is out of current scope. Inline comment at `TaxReturnComputeService.java:27223`. |
| **27c** | None — derived at PDF-fill time (intended) | Auto-check when `payments.earnedIncomeCredit == null` OR `eicTaxpayer.claimsEIC == false`. ★ **G12 OPEN** — frontend does not yet write the AcroForm checkbox `line27c_eic_opt_out_checkbox`. Inline comment at `TaxReturnComputeService.java:27224`. |

---

## 3. Compute Order

EIC must run **after**:

1. Income lines 1a–1z (totalWages); 1i (nontaxableCombatPayElection); 2a/2b/3b/7a (investment income gate inputs).
2. AGI (line 11b).
3. Form 8862 (`computeForm8862()`).

EIC must run **before**:

4. Schedule 8812 Part II-B line 24 (consumes pre-set `earlyPayments.earnedIncomeCredit`).
5. Line 32 subtotal (1st addend = line 27a).
6. Line 33 total payments (`line25d + line26 + line32`).

### Call sites

| Site | Location | Effect |
|---|---|---|
| Pre-set for Schedule 8812 Part II-B | `TaxReturnComputeService.java:1766` | `earlyPayments.setEarnedIncomeCredit(preEic)` — preflags discarded |
| Final EIC wiring | `computeLine31ThroughLine38` at `line 27225-27228` | `payments.setEarnedIncomeCredit(line27a)` |

---

## 4. Compute Logic (Helper)

`computeLine27aEIC` at `TaxReturnComputeService.java:27835-28004` — 12-parameter signature:

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
| `sumW2WagesBySsn` | `TaxReturnComputeService.java:28071-28086` | W-2 box 1 wage aggregation; `null` SSN filter aggregates both spouses on MFJ |
| `computeInvestmentIncomeForEic` | `TaxReturnComputeService.java:28093-28105` | 2a + 2b + 3b + max(0, 7a) — $11,950 ceiling test |
| `countEicQualifyingChildren` | `TaxReturnComputeService.java:28135-…` | 5-test qualifying-child count with younger-than threshold = `max(taxpayerAge, spouseAge)` on MFJ |

---

## 5. Downstream Consumers

| Consumer | What it reads |
|---|---|
| `computeLine31ThroughLine38()` line 32 | `payments.getEarnedIncomeCredit()` — 1st addend: `line32 = 27a + 28 + 29 + 30 + 31` |
| `computeLine31ThroughLine38()` line 33 | line 32 transitively: `line33 = line25d + line26 + line32` |
| `computeSchedule8812()` Part II-B line 24 | `earlyPayments.getEarnedIncomeCredit()` (pre-set) — added to refundable AOTC |
| Frontend PDF fill — Form 1040 | `payments.earnedIncomeCredit` → `line27a_earned_income_credit` |
| Frontend PDF fill — Form 1040 27b | constant `false` → `line27b_clergy_schedule_se` (renamed from `line27a_from_schedule_eic` 2026-06-11) |
| Frontend PDF fill — Form 1040 27c | intended `payments?.earnedIncomeCredit == null \|\| eicTaxpayer?.claimsEIC === false` → `line27c_eic_opt_out_checkbox` (G12 OPEN — not yet wired) |

---

## 6. 2025 EIC Parameters (Rev. Proc. 2024-40)

| Parameter | Value |
|---|---|
| Investment income ceiling | $11,950 |
| Max credit — 0 children | $649 |
| Max credit — 1 child | $4,328 |
| Max credit — 2 children | $7,152 |
| Max credit — 3+ children | $8,046 |
| Phaseout start — 0 children | $10,620 S/HoH/QSS / $17,730 MFJ |
| Phaseout start — 1+ children | $23,350 S/HoH/QSS / $30,470 MFJ |
| Phaseout end — 0 children | $19,104 S/HoH/QSS (Rev. Proc. authoritative) / $26,214 MFJ |
| Childless age range | 25–64 at year-end |
| Phase-in rounding | FLOOR (truncate to nearest dollar) |

Full closed-form parameter table in `lines/27abc.md §3d`.

---

## 7. Flags Emitted

| Flag ID | Condition | Blocking? |
|---|---|---|
| `FORM_8862_EIC_REQUIRED` | `eicPreviouslyDenied == true` AND (Form 8862 absent OR `claimsEIC=false`) | Yes — overrideFlags can bypass |

Silent null returns (no flag emitted) on: Form 2555, NRA, MFS without §32(d)(2) exception, ITIN gate (Gap L), investment income ceiling exceeded, childless preconditions (Gap H / Gap I / age band), earnedIncome ≤ 0, dual-table credit ≤ 0.

---

## 8. YAML Intake Files

| File | Purpose |
|---|---|
| `C:\us-tax\yamls\27a-earned-income-credit-taxpayer.yaml` | Taxpayer EIC screening + childless preconditions + qualifying children |
| `C:\us-tax\yamls\27a-earned-income-credit-spouse.yaml` | Spouse `spouseOtherEarnedIncome` only (combat pay deprecated) |

---

## 9. Frontend Component

**File:** `C:\us-tax\us-tax-ui\src\app\forms\form-earned-income-credit.component.ts`

`@Input() formId` switches between `'earned-income-credit-taxpayer'` and `'earned-income-credit-spouse'` based on the active person tab.

---

## 10. PDF Field Map

| Semantic name | Value source | Notes |
|---|---|---|
| `line27a_earned_income_credit` | `form.payments?.earnedIncomeCredit` | Dollar amount; null renders blank |
| `line27b_clergy_schedule_se` | constant `false` | Renamed from `line27a_from_schedule_eic` on 2026-06-11; SE is OOS |
| `line27c_eic_opt_out_checkbox` | (intended) `payments?.earnedIncomeCredit == null \|\| eicTaxpayer?.claimsEIC === false` | **G12 OPEN** — frontend not yet wired |

---

## 11. Gaps Summary

| ID | Severity | Description | Status | Date |
|---|---|---|---|---|
| G2 | LOW | `childFiledJointReturn = true` should disqualify the child (IRC §32(c)(3)(D)) | Fixed | 2026-04-19 |
| G3 | LOW | Relationship validated against `EIC_QUALIFYING_RELATIONSHIPS` set; `foster child` matched via `startsWith` | Fixed | 2026-04-19 |
| G7 | LOW | `isFullTimeStudent` extends qualifying age to under-24 with younger-than-filer check | Fixed | 2026-04-19 |
| G8 | MEDIUM | IRC §32(d)(2) MFS separated-spouse exception — `qualifiesForMfsSeparatedSpouseEicException` remaps filing status to Single for table lookup; requires ≥1 qualifying child | Fixed | 2026-04-19 |
| G | MEDIUM | Younger-than threshold should be `max(taxpayerAge, spouseAge)` on MFJ per Pub 596 Rule 8 | Fixed | 2026-06-11 |
| H | MEDIUM | Childless §32(c)(1)(A)(ii)(III) `taxpayerCanBeClaimedAsDependent` (+ MFJ `spouseCanBeClaimedAsDependent`) — true disqualifies; null fails open | Fixed | 2026-06-11 |
| I | MEDIUM | Childless §32(c)(1)(A)(ii)(I) `mainHomeInUsMoreThanHalfYear` — false disqualifies; null fails open | Fixed | 2026-06-11 |
| J | MEDIUM | Child SSN leading-9 (ITIN) ⇒ child not counted (mirrors Schedule 8812 ITIN pattern at line 30469) | Fixed | 2026-06-11 |
| L | HIGH | Filer SSN ITIN gate; on MFJ **either** spouse with leading-9 disqualifies (stricter than CTC's "neither") | Fixed | 2026-06-11 |
| G9 | LOW | Line 27b clergy SE checkbox — always false (SE is OOS) | Deferred OOS | — |
| G10 | LOW | Schedule EIC PDF generation — count used inline; printable Schedule EIC PDF not generated | Deferred OOS | — |
| G11 | LOW | Self-employment net earnings (Schedule C/F/SE) as earned income | Deferred OOS | — |
| G12 | MEDIUM | Frontend auto-check of `line27c_eic_opt_out_checkbox` AcroForm field | **OPEN** | tracked in `outstanding.md` 2026-05-16 |
| G1 | LOW | Schedule E passive/rental/royalty in EIC investment income gate | Deferred OOS | — |
| Combat pay | — | 1i.xlsx Code Validation #2 closure made line 1i the **single source of truth**; `electNontaxableCombatPay` / `spouseElectNontaxableCombatPay` are deprecated and no longer read by the EIC helper | Closed (deprecation) | 2026-05-10 |
| 27b PDF rename | — | Semantic field renamed `line27a_from_schedule_eic` → `line27b_clergy_schedule_se` across CSV maps and downstream consumers | Closed | 2026-06-11 |

---

## 12. Forms Checklist

| Form | Cardinality | Why it matters |
|---|---|---|
| Form 1040 | 1 | Lines 27a/27b/27c live here |
| `earned-income-credit-taxpayer` | 0 or 1 | Source of EIC gate, childless preconditions, qualifying children |
| `earned-income-credit-spouse` | 0 or 1 | MFJ supplemental `spouseOtherEarnedIncome` |
| Schedule EIC | Required when ≥1 qualifying child | Per-child attachment (G10 — PDF gen deferred OOS; count used inline) |
| Form 8862 | 0 or 1 | Recertification gate when `eicPreviouslyDenied = true`; emits `FORM_8862_EIC_REQUIRED` if missing |
| Form 2555 | 0 or 1 | Filed Form 2555 disqualifies EIC entirely |
