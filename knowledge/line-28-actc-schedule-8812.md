# Knowledge: Form 1040 Line 28 — Additional Child Tax Credit (ACTC) / Schedule 8812

> Audit date: 2026-04-20. Tax year 2025.

---

## 1. Line Identity

```
Form1040.line28 = Schedule8812.line27  (refundable ACTC)
Form1040.line19 = Schedule8812.line14  (nonrefundable CTC + ODC)
```

Line 28 is the **refundable** portion of the child-related credits. Line 19 is the nonrefundable portion.

---

## 2. Backend Implementation

### Entry point

```
TaxReturnComputeService.java
  computeSchedule8812()  lines 18024–18319
```

**Signature:**
```java
private Schedule8812 computeSchedule8812(
    Form1040 form1040,
    Map<String, Object> filingStatus,
    List<DependentRecord> dependents,
    Schedule3 schedule3,
    Schedule2 schedule2,
    List<Map<String, Object>> w2Entries,
    Form2555 form2555Taxpayer,
    Form2555 form2555Spouse,
    Map<String, Object> ctcScreening,
    Form8862 form8862,
    Map<String, Object> you,     // G7: ITIN check
    Map<String, Object> spouse,  // G7: MFJ ITIN check
    List<TaxReturnFlag> flags)
```

**Compute order in `prepare()`:**
```
computeForm8862()           ← must run first (Form 8862 gate)
computeForm8863()           ← must run before 8812 (CLW-A wA_4, Part II-B AOTC pre-set)
computeSchedule8812()       ← runs here; EIC pre-set must exist on form1040.payments
computeLine31ThroughLine38() ← idempotent overwrite of EIC/AOTC
```

### Output model

`Schedule8812.java` in `model/output/`

Key fields:
- `line3Magi` — MAGI for phase-out
- `line4NumQualifyingChildren` — CTC child count
- `line5CtcPotential` — **$2,200** × children (★ OBBBA Act 2025 + Rev. Proc. 2024-40 §3.08; ★ G10 REOPENED 2026-05-16 — the 2026-04-20 "fix to $2,000" predated the OBBBA Act of July 2025 which raised CTC to $2,200 for tax year 2025; code uses $2,200 since 19 #6 audit at 2026-05-14)
- `line6NumOtherDependents` — ODC dependent count
- `line7OdcPotential` — $500 × ODC dependents
- `line8TotalPotential` — line5 + line7
- `line9ThresholdAmount` — phase-out threshold ($400,000 MFJ / $200,000 others); stored 2026-04-20 → PDF field `f1_9[0]`
- `line10PhaseOutExcess` — raw MAGI excess over threshold (PDF display)
- `line11PhaseOutReduction` — $50 × ceil(excess / $1,000)
- `line12CreditAfterPhaseOut` — line8 − line11
- `line13CreditLimitWorksheetA` — CLW-A result
- `line14CtcOdcCredit` — nonrefundable CTC+ODC → Form1040.line19
- `electsNoActc` — opt-out flag
- `line16aExcessCreditOverTax` — line12 − line14
- `line16bActcCeiling` — $1,700 × numCtcChildren
- `line17ActcPotential` — min(line16a, line16b)
- `line18aEarnedIncome` — wages + combat pay
- `line18bCombatPay` — combat pay component of line18a (G8 fix)
- `line19EarnedIncomeOverFloor` — max(0, line18a − $2,500)
- `line20EarnedIncomeActc` — 15% × line19
- `line21WithheldPayrollTaxes` — Part II-B: SS withheld (W-2 box 4)
- `line22OtherTaxes` — Part II-B: Schedule 2 lines 5+6+13
- `line23TaxesTotal` — line21 + line22
- `line24RefundableCredits` — EIC + refundable AOTC
- `line25ExcessPayroll` — line23 + line24
- `line26AlternativeActcBase` — max(line20, line25)
- `line27ActcCredit` — final ACTC → Form1040.line28

---

## 3. Compute Flow — Detailed

### Step 1 — Form 8862 gate (lines 18037–18051)

If `ctcScreening.ctcPreviouslyDenied = true`:
- If no `form8862` or `form8862.claimsCTC = false` → emit `FORM_8862_CTC_REQUIRED` flag, return zeroes
- If `form8862.ctcEligible = false` → return zeroes (Part III gate failed)
- Otherwise → continue

### Step 2 — MAGI (lines 18055–18081)

```
MAGI = AGI + Form2555Taxpayer(foreignEarnedIncomeExclusion + housingExclusionAmount)
           + Form2555Spouse(foreignEarnedIncomeExclusion + housingExclusionAmount)
```

### Step 3 — Count dependents (lines 18083–18096)

```
numCtcChildren  = count of dependents where qualifiesForCTC() = true
numOdcDependents = count where qualifiesForODC() = true (mutually exclusive)
```

### Step 4 — Tentative credit (lines 18098–18104)

```
line5 = $2,000 × numCtcChildren   (IRS 2025; fixed 2026-04-20)
line7 = $500   × numOdcDependents
line8 = line5 + line7
```

### Step 5 — Phase-out (lines 18106–18127)

```
threshold           = $400,000 (MFJ) | $200,000 (others)
line9ThresholdAmount = threshold                  [stored → PDF field f1_9[0]; added 2026-04-20]
excess              = MAGI − threshold
line10              = max(0, excess)              [raw, stored for PDF]
line11              = $50 × ceil(excess / $1,000) [rounded-up reduction]
```

If `line8 ≤ line11` → credit eliminated, return zeroes.

```
line12 = line8 − line11
```

### Step 6 — Credit Limit Worksheet A (lines 18141–18171) — G6 FIXED ✓

```
wA1 = form1040.taxAndCredits.totalTaxBeforeCredits (line 18)
wA3 = foreignTaxCredit                        (Sched3 line 1)
    + childDependentCareCredit                 (Sched3 line 2)
    + educationCredits                         (Sched3 line 3)
    + retirementSavingsContributionsCredit     (Sched3 line 4)
    + energyEfficientHomeImprovementCredit     (Sched3 line 5b) ✓
    + elderlyDisabledCredit                    (Sched3 line 6d)
    + cleanVehicleCredit                       (Sched3 line 6f) ✓
    + creditPreviouslyOwnedCleanVehicles       (Sched3 line 6m) ✓

worksheetA = max(0, wA1 − wA3)
line13 = worksheetA
```

All 8 CLW-A credits now correctly read. G6 fixed 2026-04-20.

### Step 7 — Line 14: nonrefundable CTC+ODC (line 18167–18168)

```
line14 = min(line12, worksheetA)  →  Form1040.line19
```

### Step 8 — `electsNoActc` opt-out (lines 18177–18188)

If `ctcScreening.electsNoActc = true` → set `electsNoActc=true`, `line27=0`, return.

UI: `form-tax-return-schedule8812.component.ts` shows an amber opt-out banner when `electsNoActc === true` (added 2026-04-20).

### Step 9 — ACTC eligibility gates (lines 18181–18218)

Gate 1: No Form 2555 or no CTC children:
```
if numCtcChildren == 0 || Form2555 filed → line27 = 0, return
```

Gate 2: ITIN check (G9 FIXED ✓ 2026-04-20):
```java
taxpayerHasItin = taxpayerSSN starts with "9"
spouseHasItin   = spouseSSN starts with "9"  (resolved from identification-spouse.spouseSsn)
// MFJ: block only when BOTH have ITINs; allow when at least one has a valid SSN
bothHaveItin = isMfj ? (taxpayerHasItin && spouseHasItin) : taxpayerHasItin
if bothHaveItin → emit SCHEDULE_8812_ITIN_ACTC_BLOCKED, line27=0
```
Two unit tests + two E2E tests (Scenarios 5 and 6) verify this logic.

Gate 3: Line16a = 0:
```
line16a = max(0, line12 − line14)
if line16a == 0 → line27 = 0, return
```

### Step 10 — Part II-A: earned income method (lines 18220–18256)

```
line16b = $1,700 × numCtcChildren  (ACTC ceiling)
line17  = min(line16a, line16b)    (potential ACTC)
line18a = totalWages + nontaxableCombatPayElection
line19  = max(0, line18a − $2,500)
line20  = 15% × line19
```

### Step 11 — Routing: Part II-A or Part II-B (lines 18258–18330)

```
// G11 FIXED (2026-04-20): Puerto Rico bona fide residents always use Part II-B,
// bypassing the 3-child gate.
isPuertoRicoResident = ctcScreening.isBonafidePuertoRicoResident

if !isPuertoRicoResident && line16b < $5,100:   ← fewer than 3 qualifying children
    line27 = min(line17, line20)
elif !isPuertoRicoResident && line20 >= line17:
    line27 = line17              ← earned income method reaches ceiling; Part II-B cannot improve
else:                            ← 3+ children OR Puerto Rico resident OR earned income below ceiling
    [Part II-B]
    line21 = sum(W-2 box 4)      ← SS withheld (W-2 socialSecurityTaxWithheldAmount)
    line22 = Sched2(line5 + line6 + line13)  [SE path → 0 for W-2 filers]
    line23 = line21 + line22
    line24 = EIC + refundable AOTC
    line25 = line23 + line24
    line26 = max(line20, line25)
    line27 = min(line17, line26)
```

**Part II-B value example** (Scenario 4 — wages=$4,000, SS withheld=$6,200, 3 CTC children, Single):
- line20 = ($4,000 − $2,500) × 15% = **$225**
- line21 = **$6,200**, line22 = **$0**, line23 = **$6,200**
- line24 = **$0** (EIC/AOTC not claimed), line25 = **$6,200**
- line26 = max($225, $6,200) = **$6,200**
- line17 = $1,700 × 3 = **$5,100**; line27 = min($5,100, $6,200) = **$5,100**

### Step 12 — Output wiring (post `computeSchedule8812`)

```
form1040.payments.additionalChildTaxCredit = schedule8812.line27ActcCredit
form1040.taxAndCredits.childTaxCredit      = schedule8812.line14CtcOdcCredit
```

---

## 4. Personal Forms

| Form ID | Provides |
|---------|---------|
| `ctc-actc-screening-taxpayer` | `electsNoActc`, `ctcPreviouslyDenied` |
| `form8862` | `claimsCTC`, `ctcEligible` |

---

## 5. 2025 Constants

| Constant | Backend value | IRS 2025 source |
|----------|--------------|-----------------|
| CTC per child | `$2,000` | `$2,000` ✓ (fixed 2026-04-20) |
| ODC per dependent | `$500` | `$500` ✓ |
| ACTC max per child | `$1,700` | `$1,700` ✓ |
| Phase-out threshold MFJ | `$400,000` | `$400,000` ✓ |
| Phase-out threshold others | `$200,000` | `$200,000` ✓ |
| Phase-out increment | `$50 / $1,000` | `$50 / $1,000` ✓ |
| ACTC earned income floor | `$2,500` | `$2,500` ✓ |
| ACTC rate | `15%` | `15%` ✓ |
| Part II-B routing threshold | `$5,100` (= 3 × $1,700) | derived ✓ |

---

## 6. Flags Emitted

| Flag | Trigger | Blocking |
|------|---------|---------|
| `FORM_8862_CTC_REQUIRED` | `ctcPreviouslyDenied=true` and Form 8862 not properly filed | false |
| `SCHEDULE_8812_ITIN_ACTC_BLOCKED` | filer or MFJ spouse has ITIN | false |

---

## 7. PDF Export

Line 28 fields in `f1040_field_map_semantic.csv`:
- `line28_additional_child_tax_credit` → filled from `form.payments?.additionalChildTaxCredit`
- `unmapped_c2_14_0` → opt-out checkbox, set from `computation?.schedule8812?.electsNoActc === true`
- `dependent0_child_tax_credit` through `dependent2_child_tax_credit` → per-dependent CTC box
- `dependent0_credit_for_other_dependents` through `dependent2_credit_for_other_dependents` → per-dependent ODC box

Schedule 8812 PDF: `f1040s8_semantic_labels.pdf` + `f1040s8_field_map_semantic.csv`

---

## 8. Unit Tests (25 total in TaxReturnComputeServiceTest.java)

| Test name | What it verifies |
|-----------|-----------------|
| `schedule8812_basicCtc_twoChildren_sufficientTax` | 2 CTC children, sufficient tax → CTC and ACTC computed |
| `schedule8812_odcOnly_noCtcChildren` | ODC-only → ACTC = 0 (ODC cannot generate ACTC) |
| `schedule8812_mixedCtcAndOdc` | Mixed CTC + ODC → ACTC ceiling uses only CTC count |
| `schedule8812_fullPhaseOut_mfjHighMagi` | MFJ high MAGI → full phase-out, ACTC = 0 |
| `schedule8812_partialPhaseOut_single` | Single filer, partial phase-out |
| `schedule8812_worksheetACapsCredit` | CLW-A cap limits CTC to remaining tax |
| `schedule8812_actcEarnedIncomeBelowFloor` | Earned income ≤ $2,500 → ACTC = 0 |
| `schedule8812_actcEarnedIncomeAboveFloor` | Earned income > $2,500 → ACTC positive |
| `schedule8812_actcEarnedIncomeIncludesCombatPay` | Combat pay (code Q) added to line 18a |
| `schedule8812_actcEarnedIncomeWagesAloneAtFloor_combatPayUnblocks` | Wages at $2,500 exactly; combat pay unlocks ACTC |
| `schedule8812_form2555_blocksActc` | Form 2555 filer → ACTC = 0, CTC unaffected |
| `schedule8812_partIIB_noSsWithholding_usesEarnedIncomeMethod` | 3+ children, no SS withheld → falls back to earned income |
| `schedule8812_noDependents_allZero` | No dependents → all zeroes |
| `schedule8812_worksheetA_subtractsForeignTaxCredit` | CLW-A wA_2: foreign tax credit subtracted |
| `schedule8812_worksheetA_subtractsForm8880SavingsCredit` | CLW-A wA_5: retirement savings credit subtracted |
| `schedule8812_electsNoActc_zeroesLine27` | Opt-out flag → line27 = 0 |
| `schedule8812_electsNoActc_false_doesNotBlockActc` | Opt-out false → ACTC computed normally |
| `schedule8812_partIIB_ssWithholdingExceedsEarnedIncomeMethod` | Part II-B: SS withholding path chosen |
| `schedule8812_partIIB_highSsWithholding_improvesOverEarnedIncomeMethod` | Part II-B: yields more ACTC than earned income method |
| `schedule8812_partIIB_line24_includesEic_g1Fix` | EIC pre-set before Schedule 8812 (G1 fix) |
| `schedule8812_worksheetA_subtractsEducationCredits_clwaFix` | CLW-A wA_4: education credits subtracted (compute-order fix) |
| `schedule8812_partIIB_line24_includesAotc_aotcFix` | Part II-B line24 includes refundable AOTC |
| `schedule8812_line10_storesRawExcess_g5Fix` | line10 stores raw excess (not rounded) for PDF |
| `schedule8812_itinFiler_blocksActc_allowsCtc_g7Fix` | ITIN filer: ACTC blocked, CTC still allowed |
| `schedule8812_line18b_combatPayTracked_g8Fix` | line18b tracks combat pay component separately |

---

## 9. E2E Tests (7 in `line28-actc-schedule8812.spec.ts`)

| Scenario | Test |
|----------|------|
| 1 | `electsNoActc=true` → line28 = 0 |
| 2 | `electsNoActc=false` → ACTC computed normally |
| 3 | Form 8880 savings credit subtracted in CLW-A → CTC reduced |
| 4 | 3+ CTC children, high W-2 box 4 → Part II-B path; precise values: line20=$225, line21=$6200, line22=$0, line23=$6200, line24=$0, line25=$6200, line26=$6200, line27=$5100 |
| 5 (G9) | MFJ taxpayer valid SSN + spouse ITIN → ACTC allowed, no flag |
| 6 (G9) | MFJ both ITINs → ACTC blocked, `SCHEDULE_8812_ITIN_ACTC_BLOCKED` flag emitted |
| 7 (G11) | Puerto Rico resident 1 child → Part II-B bypasses 3-child gate; line21=$400, line27=$400 |

---

## 10. Gaps — All Fixed as of 2026-04-20

### ~~G6 — CLW-A missing three implemented credits~~ **FIXED 2026-04-20**

`wA3` in `computeSchedule8812()` now includes `energyEfficientHomeImprovementCredit` (Sched3 line 5b), `cleanVehicleCredit` (line 6f), and `creditPreviouslyOwnedCleanVehicles` (line 6m). Full E2E coverage deferred until Form 5695 Part II / Form 8936 compute produce non-null values.

### ~~G9 — MFJ ITIN over-blocking ACTC~~ **FIXED 2026-04-20**

`computeSchedule8812()` now uses `bothSpousesHaveItin = taxpayerHasItin && spouseHasItin`. ACTC blocked only when BOTH MFJ spouses have ITINs. 2 unit tests + 2 E2E tests (Scenarios 5 and 6 in `line28-actc-schedule8812.spec.ts`).

### ~~G10 — CTC per-child constant $2,200 vs $2,000~~ **FIXED 2026-04-20**

Backend constant corrected to `$2,000` per qualifying child (IRS 2025). 7 unit test assertions updated.

### ~~G11 — Puerto Rico bona fide residents not implemented~~ **FIXED 2026-04-20**

`computeSchedule8812()` reads `isBonafidePuertoRicoResident` from `ctc-actc-screening-taxpayer`. PR residents bypass the `line16b < $5,100` gate and always go to Part II-B. UI updated: `form-ctc-actc-screening.component.ts` exposes the question behind the "Less common situations" toggle. 1 unit test + 1 E2E test (Scenario 7).

### G3 (deferred) — Part II-B line 22 missing Schedule 2 line 4 (SE tax)

Part II-B line 22 should include Schedule 2 line 4 (SE tax on net earnings). Since SE is out of scope, this remains correctly deferred.

---

## 11. Frontend

- `form-ctc-actc-screening.component.ts` — full rewrite 2026-04-20: `ctcPreviouslyDenied` (gates Form 8862 CTC), `electsNoActc` opt-out (reframed as plain English), `isBonafidePuertoRicoResident` (behind "Less common situations" toggle). HelpModal, info-circle icons, callout panel when CTC denied.
- `form-tax-return-schedule8812.component.ts` — Schedule 8812 tax return display:
  - `Schedule8812View` TypeScript interface includes all fields through `line27`, plus `line9ThresholdAmount` (added 2026-04-20) and `electsNoActc`
  - `buildFieldValues()` fills `f1_9[0]` with `line9ThresholdAmount` (added 2026-04-20)
  - Opt-out amber banner shown when `electsNoActc === true` (added 2026-04-20)
  - Comment on line 5 CTC amount corrected to `$2,000` (was `$2,200`)
  - Comment on line 21 corrected to "Social Security and Medicare taxes withheld (W-2 box 4 + box 6, Form 4137, Form 8919)" (was wrong "SE tax path" label)
- Conditional sidebar entry: pushed only when `line14CtcOdcCredit > 0 || line27ActcCredit > 0` (`shell.component.ts`)
