# Knowledge: Form 1040 Line 29 — American Opportunity Credit (AOTC Refundable)

> Tax year 2025. Audit date: 2026-04-20. Last updated: 2026-04-20 (G17–G24 fixes applied).

---

## 1. Line Identity

**Form 1040 line 29** = `Form8863.line8RefundableAotc` = the refundable portion of the American Opportunity Credit.

```
Form1040.line29 = Form8863.line8
Form1040.line32 = line27a + line28 + line29 + line30 + line31
Form1040.line33 = line25d + line26 + line32
```

Line 29 is **only** the 40% refundable slice of the AOTC. The remaining 60% nonrefundable slice
goes to `Schedule3.line3` → `Form1040.line20` via a completely separate path.

---

## 2. Backend Implementation

**Method**: `computeForm8863()` in `TaxReturnComputeService.java`

**Signature** (updated 2026-04-20 to include `you` parameter):
```java
private Form8863 computeForm8863(
    Map<String, Object> educationCreditsTaxpayer,
    Map<String, Object> educationCreditsSpouse,
    Form1040 form1040,
    Schedule3 schedule3,
    Map<String, Object> filingStatus,
    Form8862 form8862,
    List<TaxReturnFlag> flags,
    String uid,
    Map<String, Object> you)
```

**Wiring method**: `applyForm8863ToSchedule3()` — sets `Schedule3NonrefundableCredits.educationCredits`

**Position in `prepare()`**: Called after `computeForm8862()` and before `computeSchedule8812()` (critical for CLW-A ordering fix applied 2026-04-18).

**Pre-set**: After `computeForm8863()` runs, `earlyPayments.setAmericanOpportunityCredit(form8863.getLine8RefundableAotc())` pre-populates the AOTC before Schedule 8812 runs (so Part II-B line 24 includes AOTC).

---

## 3. Compute Steps

### Step 1 — Entry gate
```java
if (!Boolean.TRUE.equals(getBoolean(educationCreditsTaxpayer, "claimsEducationCreditsOnReturn"))) return null;
```

### Step 2 — Form 8862 AOTC gate
If `aotcPreviouslyDenied = true` on the taxpayer form:
- If no `form8862` or `!form8862.isClaimsAOTC()`: emit `FORM_8862_AOTC_REQUIRED` flag; `aotcStudentEligible = []` (all AOTC blocked, LLC continues)
- Otherwise: use `form8862.getAotcStudentEligible()` for per-student eligibility

### Step 3 — MFS gate
```java
boolean isMfs = "Married filing separately".equalsIgnoreCase(status);
if (isMfs) {
    flags.add(EDUCATION_CREDITS_MFS_INELIGIBLE); return null;
}
```

### Step 4 — MAGI computation
```java
magi = AGI
     + magiAddBackPuertoRicoExcludedIncome
     + magiAddBackForm2555ExcludedIncome
     + magiAddBackForm2555HousingExclusion
     + magiAddBackForm4563ExcludedIncome
```
All add-backs read from `educationCreditsTaxpayer` personal form (manual entry). The `hasMagiAddBacks` boolean is a UI gate only; the backend sums whichever add-back fields are non-null.

### Step 5 — Phaseout fraction
```
2025 thresholds:
  isMfj (MFJ only) → phaseoutUpper = $180,000 / phaseoutRange = $20,000
  others (Single, HOH, QSS, MFS) → phaseoutUpper = $90,000 / phaseoutRange = $10,000

phaseoutFraction = min(1.000, max(0, (upper - MAGI) / range))
Rounded to 3 decimal places using RoundingMode.DOWN (truncate).
```

If MAGI >= upper: `phaseoutFraction = 0` → set `magiExceedsPhaseoutCeiling = true` → return early (no credits, header still populated for PDF).

Note: QSS correctly uses the $90k/$10k range (fixed 2026-04-20, Gap G1). Previously QSS was incorrectly included in `isMfj`.

### Step 6 — Header population
```java
if (you != null) {
    String fullName = (firstName + " " + lastName).trim();
    result.setHeader(new Form8863Header(fullName, ssn));
}
```
Header is set before the early-return phaseout check so PDF always has name/SSN even when MAGI exceeds ceiling.

### Step 7 — Collect all students
- `taxpayerStudents`: from `educationCreditsTaxpayer.taxpayerEducationCreditStudents`
- `spouseStudents`: from `educationCreditsSpouse.spouseEducationCreditStudents` (only when MFJ and `spouseHasAdditionalEducationCreditStudents = true`)
- `allStudents = taxpayerStudents + spouseStudents`

### Step 8 — Per-student loop (merged build + compute)
Student views and per-student computed values are built in a single loop pass. The view is always added (so PDF retains the student name even if later disqualified). Computed values are set only if the student qualifies.

For each student:
1. Build `Form8863Student` view (static data: name, SSN, creditType, expenses, institution name/address)
2. If `creditTypeRequested = "aotc"`:
   - Check Form 8862 gate (per-student eligibility index)
   - Check AOTC disqualifiers: `aotcClaimedFourPriorYearsLine23`, `!studentWasAtLeastHalfTimeLine24`, `studentCompletedFirstFourYearsBefore2025Line25`, `studentHadFelonyDrugConvictionLine26`
   - If not disqualified, compute per-student AOTC:
     ```
     line27 = min(adjustedQualifiedEducationExpenses, $4,000)
     line28 = max(0, line27 - $2,000)
     line29 = line28 × 25%
     line30 = line29 + $2,000      // $2,000 minimum; max $2,500 per student
     sv.setPerStudentLine30(line30)
     totalAotcBeforePhaseout += line30
     ```
3. If `creditTypeRequested = "llc"`:
   - `sv.setPerStudentLlcExpenses(expenses)`
   - `totalLlcExpenses += expenses`

**AOTC minimum**: Per IRS formula ("Add $2,000 to line 29"), any qualifying AOTC student with any non-zero expenses gets at least $2,000 before phaseout. The line28 floor of 0 means expenses < $2,000 contribute the fixed $2,000 minimum, not a pro-rated amount.

### Step 9 — Part I: Phased-out AOTC
```
line1 = totalAotcBeforePhaseout
line7 = round(line1 × phaseoutFraction)   // phased AOTC total
```

### Step 10 — Under-24 restriction
```java
boolean restrictRefundable = getBoolean(educationCreditsTaxpayer, "refundableAotcRestrictionApplies");
if (restrictRefundable) {
    line8 = 0;        // Form 1040 line 29 = 0
    line9 = line7;    // full AOTC shifts to nonrefundable
} else {
    line8 = round(line7 × 0.40);   // 40% refundable
    line9 = line7 - line8;          // remainder (≈60%) nonrefundable
}
```

### Step 11 — Part II: LLC + nonrefundable AOTC
```
line10 = totalLlcExpenses
line11 = min(line10, $10,000)          // return-level LLC cap
line12 = round(line11 × 20%)           // tentative LLC credit
llcPhased = round(line12 × phaseoutFraction)
line18 = round(line9 + llcPhased)      // total nonrefundable before CLW
```

### Step 12 — Credit Limit Worksheet (CLW)
```
totalTaxBeforeCredits = form1040.taxAndCredits.totalTaxBeforeCredits
priorCredits = Schedule3:
    + foreignTaxCredit          (line 1)
    + childDependentCareCredit  (line 2)
    + elderlyDisabledCredit     (line 6d)
    + amountFromForm8978Line14  (line 6l)

creditLimit = max(0, totalTaxBeforeCredits - priorCredits)
line19 = min(line18, creditLimit)
```

Note: The CLW does NOT subtract Saver's Credit (line 4), Clean Energy credits (lines 5/5b), or
clean vehicle credits (lines 6f/6m). Only lines 1, 2, 6d, and 6l are used — exactly per
the 2025 Form 8863 Credit Limit Worksheet instructions. ✓

### Step 13 — Store outputs
```java
if (line8 > 0): result.setLine8RefundableAotc(line8)
if (line19 > 0): result.setLine19NonrefundableEducationCredits(line19)
```
Both fields are null when zero (not stored as 0).

---

## 4. Output Model (`Form8863.java`)

### `Form8863.java` fields

| Field | Type | Description | Destination |
|---|---|---|---|
| `header` | `Form8863Header` | Taxpayer name + SSN | PDF fields f1_1–f1_4, f2_1–f2_4 |
| `students` | `List<Form8863Student>` | Per-student data + computed amounts | PDF Part III |
| `studentCount` | `Integer` | Total students (taxpayer + spouse) | PDF / UI |
| `magiForPhaseout` | `BigDecimal` | MAGI used for phaseout | PDF / UI |
| `magiExceedsPhaseoutCeiling` | `Boolean` | True when MAGI >= upper threshold | UI gate |
| `line1TotalAotcBeforePhaseout` | `BigDecimal` | Sum of per-student line30 (pre-phaseout) | PDF f1_5[0] |
| `line7AllowableAotc` | `BigDecimal` | Phased-out AOTC total (line1 × fraction) | PDF f1_10–f1_11 |
| `line8RefundableAotc` | `BigDecimal` | 40% refundable AOTC | **Form 1040 line 29** / PDF f1_12 |
| `line19NonrefundableEducationCredits` | `BigDecimal` | Total nonrefundable ed credits after CLW | **Schedule 3 line 3** / PDF f1_25 |

### `Form8863Header.java` fields

| Field | Type | Description |
|---|---|---|
| `name` | `String` | Full name ("First Last") from `you` form |
| `ssn` | `String` | Taxpayer SSN from `you` form |

### `Form8863Student.java` fields

| Field | Type | Description | PDF use |
|---|---|---|---|
| `studentName` | `String` | Full student name ("First Last") | f2-5[0] (student A) |
| `studentSsn` | `String` | Student TIN (from `studentTinLine21`) | f2_6–f2_8 (student A SSN) |
| `creditType` | `String` | `"aotc"` or `"llc"` | determines Part III branch |
| `adjustedQualifiedEducationExpenses` | `BigDecimal` | Expenses after tax-free assistance reduction | f1_7–f1_9 (expense columns) |
| `institution1Name` | `String` | First institution name | f2_9[0] (student A) / f2_20[0] (student B) |
| `institution1Address` | `String` | First institution address | f2_10[0] (student A) / f2_21[0] (student B) |
| `perStudentLine30` | `BigDecimal` | AOTC per-student credit before phaseout (null if disqualified) | f2_31[0] (student A) / f2_35[0] (student B) |
| `perStudentLlcExpenses` | `BigDecimal` | LLC per-student expenses (null for AOTC students) | f2_31[0] / f2_35[0] |

---

## 5. Personal Forms

### `education-credits-taxpayer` (form ID: `education-credits-taxpayer`)
**Return-level fields** (YAML: `8863-education-credits-taxpayer.yaml`):
| Field | Purpose |
|---|---|
| `claimsEducationCreditsOnReturn` | Entry gate — must be `true` |
| `confirmAllEducationSupportUploaded` | Confirmation gate |
| `aotcPreviouslyDenied` | Triggers Form 8862 AOTC gate (renamed from `requiresForm8862ForAotc` in G17) |
| `hasMagiAddBacks` | UI gate: shows/hides MAGI add-back amount fields (G18 addition) |
| `refundableAotcRestrictionApplies` | Under-24 restriction boolean |
| `magiAddBackPuertoRicoExcludedIncome` | MAGI add-back (manual) |
| `magiAddBackForm2555ExcludedIncome` | MAGI add-back (manual) |
| `magiAddBackForm2555HousingExclusion` | MAGI add-back (manual) |
| `magiAddBackForm4563ExcludedIncome` | MAGI add-back (manual) |

**Per-student fields** (in `taxpayerEducationCreditStudents[]`):
| Field | Purpose |
|---|---|
| `creditTypeRequested` | `"aotc"` or `"llc"` |
| `adjustedQualifiedEducationExpenses` | Expenses after tax-free assistance reduction |
| `aotcClaimedFourPriorYearsLine23` | AOTC 4-year limit check |
| `studentWasAtLeastHalfTimeLine24` | Half-time enrollment check |
| `studentCompletedFirstFourYearsBefore2025Line25` | First 4 years check |
| `studentHadFelonyDrugConvictionLine26` | Felony drug conviction check |
| `institution1NameLine22` | Institution name (fed to `Form8863Student.institution1Name`) |
| `institution1AddressLine22` | Institution address (fed to `Form8863Student.institution1Address`) |
| `institution1EinLine22` | Institution EIN (collected but not yet in output model) |
| `studentFirstNameLine20` / `studentLastNameLine20` | Student name (fed to `Form8863Student.studentName`) |
| `studentTinLine21` | Student TIN (fed to `Form8863Student.studentSsn`) |

### `education-credits-spouse` (form ID: `education-credits-spouse`)
- Contains `spouseHasAdditionalEducationCreditStudents` boolean gate
- Contains `spouseEducationCreditStudents[]` array (same per-student fields)
- Used only when MFJ; students merged with taxpayer students before computation

---

## 6. Flags Emitted

| Flag code | Condition | Blocking? |
|---|---|---|
| `EDUCATION_CREDITS_MFS_INELIGIBLE` | Filing status = MFS | No |
| `FORM_8862_AOTC_REQUIRED` | `aotcPreviouslyDenied=true` + no Form 8862 Part IV | No |

---

## 7. Wire-Up Flow

```
computeForm8863() → form8863.line8RefundableAotc
    ↓
applyForm8863ToSchedule3() → schedule3.nonrefundableCredits.educationCredits = line19
    ↓
earlyPayments.setAmericanOpportunityCredit(line8)  [pre-set for Schedule 8812]
    ↓
computeSchedule8812() uses earlyPayments.americanOpportunityCredit in Part II-B line 24
    ↓
computeLine31ThroughLine38() overwrites payments.americanOpportunityCredit = form8863.line8RefundableAotc
    ↓
form1040.payments.americanOpportunityCredit → Form 1040 line 29 (PDF + computation)
schedule3.nonrefundableCredits.educationCredits → Schedule 3 line 3 → Form 1040 line 20
```

---

## 8. Frontend Intake (`form-education-credits.component.ts`)

- File: `us-tax-ui/src/app/forms/form-education-credits.component.ts`
- Template: Angular standalone component, PrimeNG
- Controls: return-level section + dynamic student list (Add student / Remove student)
- Person-split: taxpayer form owns screening/MAGI; spouse form owns additional students
- All boolean fields use radio buttons (`div.radio-group` with scoped `id` attributes)
- Static radio groups: `id="claimsEducationCreditsOnReturn"`, `id="aotcPreviouslyDenied"`, `id="hasMagiAddBacks"`, `id="refundableAotcRestrictionApplies"`, etc.
- Dynamic per-student radio groups: `[id]="'institution1Received1098T_' + i"`, etc.

---

## 9. Frontend Display (`form-tax-return-8863.component.ts`)

- File: `us-tax-ui/src/app/forms/form-tax-return-8863.component.ts`
- Shows IRS PDF readonly preview via `app-pdf-readonly-preview`
- `buildFieldValues()` fills f8863 PDF fields (updated 2026-04-20)

**Page 1 fills:**
| PDF field | Value |
|---|---|
| `f1_1[0]`–`f1_4[0]` | header name + SSN parts (taxpayer) |
| `f1_5[0]` | `line1TotalAotcBeforePhaseout` |
| `f1_6[0]` | `magiForPhaseout` |
| `f1_7[0]`–`f1_9[0]` | student A/B/C adjusted expenses |
| `f1_12[0]` | `line8RefundableAotc` |
| `f1_13[0]` | `line7AllowableAotc − line8RefundableAotc` (nonrefundable AOTC) |
| `f1_25[0]` | `line19NonrefundableEducationCredits` |

**Page 2 fills (Part III per-student):**
| PDF field | Value |
|---|---|
| `f2_1[0]`–`f2_4[0]` | header name + SSN parts (page 2 header) |
| `f2-5[0]` | student A name (line 20) |
| `f2_6[0]`–`f2_8[0]` | student A SSN parts (from `studentSsn`) |
| `f2_9[0]` | student A institution 1 name (line 22a) |
| `f2_10[0]` | student A institution 1 address (line 22a) |
| `f2_20[0]` | student B institution 1 name (line 22b) |
| `f2_21[0]` | student B institution 1 address (line 22b) |
| `f2_31[0]` | student A per-student line 30 (AOTC) or line 31 (LLC expenses) |
| `f2_35[0]` | student B per-student line 30 (AOTC) or line 31 (LLC expenses) |

---

## 10. Unit Tests (18 total in `TaxReturnComputeServiceTest.java`)

| Test method | What it verifies |
|---|---|
| `computesForm8863AotcCreditsAndWiresToSchedule3AndLine29` | Single AOTC student → line8=$1,000, line19=$1,500 |
| `computesForm8863LlcCreditAndPhaseout` | LLC student + phaseout → line8=null, line19=$500 |
| `form8863ReturnsNullWhenMagiExceedsPhaseoutCeiling` | MAGI $95k (Single) → both null |
| `computeForm8863_mfs_returnsNull` | MFS → null + flag |
| `computeForm8863_mfsDoesNotAffectMfj` | MFJ regression guard after MFS block |
| `computeForm8863_under24Restriction_zeroesLine8` | under-24=true → line8=null, line19>0 |
| `computeForm8863_under24Restriction_false_allows40Percent` | under-24=false → line8=$1,000 |
| `computeForm8863_under24Restriction_notSet_defaults40Percent` | restriction not set → defaults to 40% |
| `computeForm8863_multipleAotcStudents_summedCorrectly` | 2 students → line8=$2,000 |
| `computeForm8863_phaseout_partialReduction` | MAGI $85k → fraction 0.5 → line8=$500 |
| `computeForm8863_mixedAotcAndLlc_bothCreditsComputed` | AOTC + LLC student → line8=$1,000 + LLC nonref |
| `computeForm8863_disqualifiedStudentSkipped` | aotcClaimedFourPriorYears=true → skipped |
| `computeForm8863_spouseStudentsMergedMfj` | MFJ: taxpayer AOTC + spouse LLC → studentCount=2 |
| `computeForm8863_form8862Gate_blocksAotcPreservesLlc` | aotcPreviouslyDenied + no Form 8862 → AOTC null, LLC credited |
| `computeForm8863_qss_fullyPhasedOutAbove90k` | QSS MAGI $120k > $90k ceiling → fully phased out (G1 fix) |
| `computeForm8863_line1AndLine7FieldsPopulated` | No phaseout → line1=line7=$2,500; line8=$1,000 (G2 fix) |
| `computeForm8863_line1AndLine7ReflectPhaseout` | MAGI $85k → line1=$2,500; line7=$1,250; line8=$500 (G2 fix) |
| `computeForm8863_aotcExpensesBelow2000_minimumCreditApplies` | $1k expenses → line30=$2,000 min; line8=$800 (G21) |
| `computeForm8863_aotcExpensesBetween2000And4000_partialCredit` | $3k expenses → line30=$2,250; line8=$900 (G21) |
| `schedule8812_worksheetA_subtractsEducationCredits_clwaFix` | Form 8863 runs before Sched 8812 → CLW-A reduced |
| `schedule8812_partIIB_line24_includesAotc_aotcFix` | AOTC pre-set before Sched 8812 → Part II-B line 24 includes AOTC |

---

## 11. E2E Tests (14 in `line8863-education-credits.spec.ts`)

| # | Test | Scenario |
|---|---|---|
| 1 | UI workflow | education-credits-taxpayer saves return-level data + student entry (radio groups scoped) |
| 2 | UI workflow | education-credits-spouse saves additional students separately |
| 3 | Compute | Single AOTC $4k → line 29 = $1,000; line19 = $1,500; header.name, header.ssn, students verified (G23) |
| 4 | Compute | LLC only → line 29 = null; line19 = $1,000 exact (G24 exact value) |
| 5 | Compute | MAGI > $90k → both null, `magiExceedsPhaseoutCeiling = true` |
| 6 | Compute | MFS → form8863 null, `EDUCATION_CREDITS_MFS_INELIGIBLE` flag |
| 7 | Compute | under-24 restriction → line 29 = null, line19 > 0 |
| 8 | Compute | MFJ spouse student merge: taxpayer AOTC + spouse LLC → studentCount=2 (G5) |
| 9 | Compute | Form 8862 gate: aotcPreviouslyDenied + no Form8862 → AOTC blocked, LLC credited (G6) |
| 10 | Compute | Two AOTC students → line1=$5,000; line8=$2,000 aggregate (G14) |
| 11 | Compute | LLC $85k MAGI → phaseout 50% → line19=$1,000 (G15) |
| 12 | Compute | AOTC 4-year limit disqualifier → form8863 present but no credit (G16) |
| 13 | Compute | MAGI exactly $80k → full AOTC credit (phaseoutFraction=1.0) (G22) |
| 14 | Compute | MAGI exactly $90k → AOTC fully phased out (phaseoutFraction=0) (G22) |

---

## 12. Key 2025 Constants

| Constant | Value |
|---|---|
| AOTC max per student | $2,500 |
| AOTC minimum per student (any qualifying expense) | $2,000 |
| AOTC formula | 100% × first $2,000 + 25% × next $2,000 = line29 + $2,000 |
| AOTC refundable share | 40% |
| AOTC nonrefundable share | 60% |
| LLC max per return | $2,000 |
| LLC formula | 20% × min(expenses, $10,000) |
| Phaseout — MFJ upper | $180,000 |
| Phaseout — MFJ range | $20,000 (begins $160,000) |
| Phaseout — Single/HOH/QSS upper | $90,000 |
| Phaseout — Single/HOH/QSS range | $10,000 (begins $80,000) |
| Phaseout fraction rounding | ROUND_DOWN (truncate) to 3 decimals |
| CLW — prior credits used | Schedule 3 lines 1, 2, 6d, 6l only |

---

## 13. Gaps

All G1–G9 and G14–G24 gaps are now resolved.

| ID | Severity | Description | Status |
|---|---|---|---|
| G1 | MEDIUM | QSS phaseout threshold bug — `isMfj` included QSS ($160k ceiling); should be $90k | **FIXED 2026-04-20** |
| G2 | MEDIUM | Sparse output model — `Form8863.java` missing line1/line7 | **FIXED 2026-04-20** |
| G3 | LOW | PDF export partial — wrong fills (MAGI repeated for Part II lines) | **FIXED 2026-04-20** |
| G4 | LOW | Under-24 restriction self-reported (single boolean, no sub-condition validation) | Open — deferred |
| G5 | LOW | No E2E test for MFJ spouse-student merge | **FIXED 2026-04-20** |
| G6 | LOW | No E2E test for Form 8862 AOTC gate | **FIXED 2026-04-20** |
| G7 | HIGH | Form8863 model missing `students` field | **FIXED 2026-04-20** |
| G8 | LOW | `taxFreeEducationAssistanceReductionAmount` unused — false positive; help text says enter post-reduction amount | **Not a bug** |
| G9 | MEDIUM | Form8863 model missing `header` (name/SSN) | **FIXED 2026-04-20** |
| G14 | LOW | No E2E test for 2 AOTC students summed | **FIXED 2026-04-20** |
| G15 | LOW | No E2E test for LLC partial phaseout | **FIXED 2026-04-20** |
| G16 | LOW | No E2E test for AOTC disqualifier | **FIXED 2026-04-20** |
| G17 | HIGH | YAML field name `requiresForm8862ForAotc` vs backend `aotcPreviouslyDenied` | **FIXED 2026-04-20** |
| G18 | MEDIUM | `hasMagiAddBacks` boolean not in YAML spec | **FIXED 2026-04-20** |
| G19 | MEDIUM | Per-student computed lines 27–31 not in model or PDF | **FIXED 2026-04-20** |
| G20 | MEDIUM | Student B PDF fields `f2_20/f2_21` filled with student name instead of institution data | **FIXED 2026-04-20** |
| G21 | MEDIUM | No unit tests for AOTC formula boundary cases (expenses < $2k, $2k–$4k) | **FIXED 2026-04-20** |
| G22 | LOW | No E2E tests for MAGI boundary values ($80k full, $90k phased out) | **FIXED 2026-04-20** |
| G23 | LOW | No E2E assertions for `form8863.header.name`, `header.ssn`, `students` array | **FIXED 2026-04-20** |
| G24 | LOW | LLC E2E test used `.toBeGreaterThan(0)` instead of exact $1,000 | **FIXED 2026-04-20** |
| — | LOW | Form 8863 / 1098-T statement import | Deferred |
| — | LOW | Form 8863 / MAGI auto-read from Form 2555 output | Deferred |
| — | LOW | Form 8863 / dependent student cross-check | Deferred |
| — | LOW | Form 8863 / prior-year AOTC recapture | Deferred |
| — | LOW | Form 8863 / second institution display in output | Deferred |
| — | LOW | Form 8863 / institution EIN digit fields (f2_11–f2_19, f2_22–f2_30) in PDF | Deferred |
