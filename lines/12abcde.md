Below is a **2025-tax-year, IRS-verified, developer-ready** rule map for **Form 1040 lines 12a through 12e**.

Reviewed against:
- **2025 Form 1040 / 1040-SR**
- **2025 Form 1040 / 1040-SR instructions** (`i1040gi`)
- **2025 Schedule A (Form 1040)** and its instructions
- **2025 Form 4684** instructions for net qualified disaster loss handling
- **One Big Beautiful Bill Act (OBBBA)** 2025 SALT-cap amendments
- Current implementation in `TaxReturnComputeService.java`:
  - `buildStandardDeductionIndicators(...)` at line 4987 (input read + SURGICAL MFS guard);
  - `computeLine12(...)` at line 5295 (composite-checkbox derivation, age/blind gating, election + Schedule A wiring);
  - `computeStandardDeduction(...)` at line 5799 (5-path standard-deduction branching);
  - `chooseLine12e(...)` at line 6091, `chooseDeductionType(...)` at line 6103 (final election);
  - `countAgeBlindnessBoxes(...)` static helper at line 29314.

Key 2025 changes versus prior years:
- **OBBBA SALT cap** is **$40,000 / $20,000 MFS**, reduced under a Schedule A line-5e worksheet above MAGI thresholds, **with a floor** of $10,000 / $5,000 MFS;
- **line 12e** is the standard deduction OR Schedule A amount — **QBI moved to 13a** and **Schedule 1-A deductions moved to 13b**;
- when claiming the **increased standard deduction for a net qualified disaster loss** without itemizing, the amount flows from **Schedule A line 16** directly to Form 1040 line 12e — **not** through line 17;
- the **dependent worksheet** uses 2025 thresholds ($900 / $450 / $1,350) and the age / blind chart uses 2025 amounts;
- **age threshold** updated to **born before January 2, 1961** (2025-correct; prior `_born_before_1960` semantic keys were stale).

---

# 1) Line identities (2025 Form 1040)

## 1.1 Checkboxes on line 12

Form 1040 page 2 shows these line-12 controls:
- **12a** Someone can claim:
  - **You** as a dependent (PDF `c2_1[0]`)
  - **Your spouse** as a dependent (PDF `c2_2[0]`, MFJ-only)
- **12b** Spouse itemizes on a separate return (PDF `c2_3[0]`, MFS-only)
- **12c** You were a dual-status alien (PDF `c2_4[0]`)
- **12d** Age / blindness boxes (PDF `c2_5[0]` through `c2_8[0]`):
  - You were born before January 2, 1961
  - You are blind
  - Spouse was born before January 2, 1961
  - Spouse is blind

## 1.2 Amount line

- **12e** Standard deduction or itemized deductions (from Schedule A)

Important 2025 structural point:
- **line 12e** is only the standard deduction or itemized deduction amount;
- **qualified business income deduction** is on **line 13a**;
- **Schedule 1-A deductions** (tips, overtime, car loan interest, enhanced senior) are on **line 13b**.

Do **not** put QBI or Schedule 1-A amounts on line 12e.

---

# 2) Outputs

## 2.1 Primary output fields

Canonical backend output fields:

- `Form1040.line12aChecked` — **single composite Boolean**. True when "Someone can claim You as a dependent" OR (MFJ only) "Someone can claim Your spouse as a dependent." The backend collapses the two PDF checkboxes into one source of truth; PDF rendering maps the composite back to both checkboxes at frontend export.
- `Form1040.line12bChecked` — Boolean. MFS spouse itemizes on a separate return (MFS-only filter inline).
- `Form1040.line12cChecked` — Boolean. Dual-status alien (taxpayer-side; no filing-status filter).
- `Form1040.line12dBoxesCheckedCount` — integer 0-4. Count of age / blindness boxes checked, with HOH / QSS exclusion of spouse boxes and MFS narrow-allow gating.
- `Form1040.deductions.deductionAmount` — final numeric line 12e amount.
- `Form1040.deductions.deductionType` — "Standard" or "Itemized" label.

## 2.2 PDF semantic-key mapping (2025-correct)

- `c2_1[0]` → `taxpayer_can_be_claimed_as_dependent`
- `c2_2[0]` → `spouse_can_be_claimed_as_dependent`
- `c2_3[0]` → `line12b_spouse_itemizes_separate_return`
- `c2_4[0]` → `line12c_dual_status_alien`
- `c2_5[0]` → `taxpayer_born_before_1961`
- `c2_6[0]` → `spouse_born_before_1961`
- `c2_7[0]` → `taxpayer_blind`
- `c2_8[0]` → `spouse_blind`
- `f2_02[0]` → `line12_standard_deduction_or_itemized_deductions` (line 12e amount)

## 2.3 Conditional attachments

- **Schedule A** if itemizing.
- **Schedule A** also if claiming an increased standard deduction for a net qualified disaster loss.
- **Form 4684** if a net qualified disaster loss or deductible personal casualty loss is involved.

---

# 3) Inputs required

## 3.1 Core filing facts

- `filing_status` in `{Single, MFJ, MFS, HOH, QSS}`
- whether someone can claim the taxpayer as a dependent
- whether someone can claim the spouse as a dependent on an MFJ return
- whether the taxpayer is a dual-status alien
- whether an MFS spouse itemizes
- whether an MFS spouse meets the spouse-no-income / not-filing / not-dependent rule for line-12d spouse boxes
- age and blindness facts for taxpayer and spouse

## 3.2 Dependent-standard-deduction inputs

If line 12a applies, the dependent worksheet needs an IRS-defined earned-income figure. The 2025 worksheet uses an earned-income measure that generally equals:

```text
earned_income_for_dependent_std_ded =
    Form1040.line1z
  + Schedule1.line3
  + Schedule1.line6
  + Schedule1.line8r
  + Schedule1.line8t
  + Schedule1.line8u
  - Schedule1.line15
```

Taxable scholarship or fellowship grant amounts also flow through the worksheet.

## 3.3 Itemized-deduction inputs

When itemizing or claiming an increased standard deduction for net qualified disaster loss, Schedule A inputs are needed:
- medical and dental expenses;
- state and local income taxes or sales taxes;
- real estate taxes;
- personal property taxes;
- foreign income taxes or GST if applicable on Schedule A line 6;
- qualified home mortgage interest and points;
- investment interest;
- charitable contributions;
- personal casualty and theft losses from federally declared disasters;
- line-16 other itemized deductions if specifically allowed;
- net qualified disaster loss data from **Form 4684**.

---

# 4) Checkbox rules (12a through 12d)

## 4.1 Line 12a: dependent checkbox(es) — composite Boolean with MFJ spouse OR-operand

Check the appropriate box on line 12a if:
- the taxpayer can be claimed as a dependent on someone else's return; or
- on an MFJ return, the spouse can be claimed as a dependent on someone else's return.

The backend collapses the two PDF checkboxes to a single composite Boolean:

```text
line12aChecked = someoneCanClaimYou
               OR (filing_status == MFJ AND someoneCanClaimSpouse)
```

The MFJ filter is inline at `computeLine12()` so stale spouse data on Single / MFS / HOH / QSS cannot leak in.

**MFJ nuance:** on a joint return, the taxpayer can still be claimed on someone else's return if the joint return is filed only to claim a refund of withheld tax or estimated tax paid.

## 4.2 Line 12b: spouse itemizes on separate return — MFS-only

```text
line12bChecked = (filing_status == MFS) AND spouseItemizesSeparateReturn
```

Effect:

```text
if line12bChecked:
    standard_deduction = 0      # IRC §63(c)(6)(A)
```

This is a **hard-zero**. Age / blindness boxes (12d) do not override it.

## 4.3 Line 12c: dual-status alien — hard-zero (IRC §63(c)(6)(B))

```text
line12cChecked = youWereDualStatusAlien
```

No filing-status filter — the field is taxpayer-side and applies regardless of filing status.

Effect:

```text
if line12cChecked:
    standard_deduction = 0      # IRC §63(c)(6)(B)
```

Do **not** check 12c if the taxpayer and spouse validly elect to be taxed on combined worldwide income as U.S. residents for the full year.

## 4.4 Line 12d: age / blindness count

Per spec, the count is integer 0-4 representing checked boxes for "born before January 2, 1961" and "blind" for the taxpayer (always counted) plus the spouse (counted only when filing-status rules allow).

Filing-status rules for spouse boxes:
- **HOH / QSS** — spouse boxes are **never** counted (HOH has no spouse; QSS is a widow / widower status).
- **MFS** — spouse boxes are counted **only if** `spouseMeetsAgeBlindnessMfsRequirements` is true (no income, not filing, not claimable as a dependent).
- **MFJ** — spouse boxes are counted normally.
- **Single** — no spouse boxes.

Backend implementation:

```text
mfsSpouseBoxesAllowed = (filing_status != MFS) OR spouseMeetsAgeBlindnessMfsRequirements
line12dCount = countAgeBlindnessBoxes(
    status,
    youBornBeforeThreshold,
    youAreBlind,
    mfsSpouseBoxesAllowed ? spouseBornBeforeThreshold : null,
    mfsSpouseBoxesAllowed ? spouseIsBlind             : null
)
```

`countAgeBlindnessBoxes` then internally excludes spouse boxes for HOH and QSS.

A person is treated as reaching age 65 on the **day before** the 65th birthday.

## 4.5 Surgical MFS guard at the indicators reader

`buildStandardDeductionIndicators` (the input reader) uses a **surgical** MFS variant: only fields with **MFJ-only semantics** are null-shadowed on MFS. Fields with **MFS-legitimate** semantics remain readable. The per-field classification:

| Field | MFS semantics | Behavior on MFS |
|---|---|---|
| `someoneCanClaimSpouse` | MFJ-only | null-shadowed |
| `spouseItemizesSeparateReturn` | MFS-legitimate | remains readable |
| `spouseBornBeforeThreshold` | MFS-legitimate | remains readable |
| `spouseIsBlind` | MFS-legitimate | remains readable |
| `spouseMeetsAgeBlindnessMfsRequirements` | MFS-legitimate (gates the others) | remains readable |

Lock-in test: `mfsExcludesSpouseDependentFlagFromLine12a`.

---

# 5) Standard deduction computation (2025)

The standard-deduction logic is in `computeStandardDeduction(...)` at `TaxReturnComputeService.java:5799`. There are **five paths**, applied in order:

## 5.1 Defensive: null status

```text
if status is null: return null
```

## 5.2 Hard-zero (12b or 12c)

```text
if line12b OR line12c: return 0
```

Per IRC §63(c)(6)(A) (MFS spouse itemizes) and §63(c)(6)(B) (dual-status alien). Age / blindness addons do **not** override.

## 5.3 Dependent worksheet (12a)

If line 12a is checked, use the **Standard Deduction Worksheet for Dependents**:

```text
if earned_income > 900:
    worksheet_line2 = earned_income + 450
else:
    worksheet_line2 = 1350

worksheet_line3 =
    15750 if filing_status in {Single, MFS}
    31500 if filing_status == MFJ
    23625 if filing_status == HOH

worksheet_line4a = min(worksheet_line2, worksheet_line3)

per_box_addon =
    2000 if filing_status in {Single, HOH}
    1600 otherwise

worksheet_line4b = line12dCount * per_box_addon

standard_deduction = worksheet_line4a + worksheet_line4b
```

Use this worksheet only when someone can claim the taxpayer (or spouse on MFJ) as a dependent. Do **not** use the age / blind chart instead.

## 5.4 Age / blind chart (line 12d > 0)

If line 12a does not apply and at least one box on line 12d is checked, use the 2025 chart with base + per-box addon. The chart values are derived from the base standard deduction plus `line12dCount * per_box_addon`:

- **Single** (base $15,750; addon $2,000)
  - 1 box: $17,750
  - 2 boxes: $19,750
- **MFJ** (base $31,500; addon $1,600)
  - 1 box: $33,100
  - 2 boxes: $34,700
  - 3 boxes: $36,300
  - 4 boxes: $37,900
- **QSS** (base $31,500; addon $1,600)
  - 1 box: $33,100
  - 2 boxes: $34,700
- **MFS** (base $15,750; addon $1,600)
  - 1 box: $17,350
  - 2 boxes: $18,950
  - 3 boxes: $20,550
  - 4 boxes: $22,150
- **HOH** (base $23,625; addon $2,000)
  - 1 box: $25,625
  - 2 boxes: $27,625

## 5.5 Base amount

If none of the above applies, use the base standard deduction:

- **Single / MFS**: `$15,750`
- **MFJ / QSS**: `$31,500`
- **HOH**: `$23,625`

These constants live in `ReferenceData` (centralized; not hardcoded inside `computeStandardDeduction`).

## 5.6 Disaster-loss augmentation (Schedule A line 16 path)

After the base standard deduction is chosen, an augmentation step at `computeLine12()` checks `scheduleA.usedForStandardDeductionIncrease`. When TRUE:

```text
augmented_standard = standard_deduction + scheduleA.netQualifiedDisasterLoss
```

The augmented amount is what `chooseLine12e` returns under the STANDARD or AUTO election.

---

# 6) Itemized deduction path (Schedule A, 2025)

## 6.1 Standard itemized path

If the taxpayer elects to itemize, then:

```text
itemized_deductions = ScheduleA.line17
Form1040.line12e = ScheduleA.line17
```

Schedule A line 17 is the total of lines 4 through 16.

## 6.2 Main 2025 Schedule A categories

- **Medical and dental**: deductible only above **7.5% of AGI** — uses **raw AGI** (line 11a), NOT a MAGI / modified AGI.
- **Taxes you paid**.
- **Interest you paid**.
- **Gifts to charity**.
- **Casualty and theft losses** from federally declared disasters.
- **Other itemized deductions** allowed on line 16.

## 6.3 2025 SALT rule (OBBBA)

This is a major 2025 change.

Base cap:
- **$40,000**, or
- **$20,000** if **MFS**.

If MAGI is more than:
- **$500,000**, or
- **$250,000** if **MFS**,

the cap is reduced under the Schedule A line-5e worksheet at the rate prescribed by OBBBA, but **not below** the floor:
- **$10,000**, or
- **$5,000** if **MFS**.

So the prior flat `$10,000 / $5,000` rule from TCJA is no longer correct for 2025.

The nine SALT-related constants ($40,000 / $20,000 / $500,000 / $250,000 / $10,000 / $5,000 plus the OBBBA phasedown coefficients) are centralized in `ReferenceData`.

## 6.4 Other important Schedule A points

- On line 5a, the taxpayer may deduct **state and local income taxes or general sales taxes, but not both**.
- If electing general sales tax, the line-5a box must be checked.
- Personal casualty losses are generally deductible only if attributable to a federally declared disaster.
- Line 16 is limited to the specific items listed in the Schedule A instructions — it is **not** a free-form miscellaneous bucket.
- If the taxpayer elects to itemize even though itemized deductions are less than the standard deduction, the taxpayer checks **Schedule A line 18**. The backend sets `scheduleA.electsToItemizeAlthoughLessThanStandard = TRUE` in this case.

---

# 7) Net qualified disaster loss and increased standard deduction

This is a separate path from normal itemizing.

If the taxpayer has a net qualified disaster loss on **Form 4684, line 15** and is **not itemizing**:
- enter the Form 4684 line-15 amount on the dotted line next to **Schedule A line 16** as `Net Qualified Disaster Loss`;
- enter the taxpayer's standard deduction amount on the dotted line next to **Schedule A line 16** as `Standard Deduction Claimed With Qualified Disaster Loss`;
- combine those two amounts on **Schedule A line 16**;
- enter that combined amount on **Form 1040 line 12e**;
- do **not** enter an amount on any other line of Schedule A.

Backend implementation: a single augmentation step adds `scheduleA.netQualifiedDisasterLoss` to the computed standard deduction so the STANDARD / AUTO election path returns the augmented amount, which is functionally identical to the "Schedule A line 16 combined" amount described in the IRS recipe.

```text
if increased_standard_deduction_for_net_qualified_disaster_loss and not itemize_selected:
    Form1040.line12e = standard_deduction + scheduleA.netQualifiedDisasterLoss
                     ≡ ScheduleA.line16_combined
```

If the taxpayer is itemizing, the net qualified disaster loss is included on Schedule A line 16 with other allowed line-16 deductions and the final amount still flows through Schedule A line 17.

---

# 8) Final mapping to line 12e

## 8.1 Election logic

`chooseLine12e(deductionElection, standardDeduction, itemized)`:

```text
if deductionElection == ITEMIZED: return itemized        # Schedule A line 17
if deductionElection == STANDARD: return standardDeduction
return max(standardDeduction, itemized)                  # AUTO — tax-optimization default
```

Companion: `chooseDeductionType(...)` returns the label "Standard" or "Itemized".

## 8.2 What the rule is **not**

The IRS does **not** require `max(standard, itemized)`. The taxpayer can elect to itemize even when itemized deductions are smaller — in which case the Schedule A line 18 flag is set. The backend's AUTO mode picks the larger value as a tax-optimization convenience; explicit ITEMIZED / STANDARD elections override.

## 8.3 Persistence

```text
deductions.setDeductionAmount(line12e)
deductions.setDeductionType("Standard" | "Itemized")
deductions.setLine12aChecked(line12a)
deductions.setLine12bChecked(line12b)
deductions.setLine12cChecked(line12c)
deductions.setLine12dBoxesCheckedCount(line12dCount)
```

---

# 9) Special edge rule: section 962 election / section 250 deduction

If the taxpayer made a **section 962 election** and is taking a **section 250 deduction** with respect to section 951A inclusions:
- do **not** report that deduction on line 12e;
- instead, report the related tax on line 16 and include the required explanatory statement.

---

# 10) Validation rules

## 10.1 Checkbox validations

- If line 12b is checked, filing status should be **MFS**.
- If line 12c is checked, the dual-status-alien facts should support it.
- If spouse boxes are checked on line 12d for **HOH** or **QSS**, reject (or zero-out spouse boxes).
- If spouse boxes are checked on line 12d for **MFS**, enforce the no-income / not-filing / not-dependent rule via `spouseMeetsAgeBlindnessMfsRequirements`.

## 10.2 Standard deduction validations

- If line 12a is checked, use the dependent worksheet — not the age / blind chart.
- If line 12b or line 12c is checked, standard deduction must be **0**.
- If no exception applies, use the amount printed next to line 12e for the filing status.

## 10.3 Schedule A validations

- If itemizing normally, line 12e should equal Schedule A line 17.
- If taking the increased standard deduction for net qualified disaster loss and not itemizing, line 12e should equal the combined Schedule A line 16 amount, and other Schedule A lines should be blank.
- Apply the 2025 OBBBA SALT line-5e rule, including the reduction worksheet when MAGI exceeds the threshold.
- The Schedule A medical floor uses **raw AGI** (`line11a` via the legacy `adjustedGrossIncome` accessor) — not a benefit-specific MAGI.

---

# 11) Implementation guardrails

- Do **not** use the old flat **$10,000 / $5,000** SALT cap for 2025; use OBBBA $40,000 / $20,000 with the MAGI phasedown to the $10,000 / $5,000 floor.
- Do **not** compute line 12e as a blind `max(standard, itemized)` — respect explicit ITEMIZED / STANDARD election overrides and set the Schedule A line 18 flag when ITEMIZED < STANDARD.
- Do **not** route an increased standard deduction for net qualified disaster loss through Schedule A line 17 when not itemizing — the augmentation must flow through the standard side.
- Do **not** put QBI or Schedule 1-A deductions on line 12e (those belong on line 13a / 13b).
- Do **not** use the age / blind chart when line 12a dependent status applies.
- Do **not** check spouse boxes on line 12d for HOH or QSS.
- Do **not** wholesale-null-shadow the spouse-side deductions map on MFS — use the per-field SURGICAL classification (12b / 12d fields are MFS-legitimate).
- Do **not** read base $15,750 / $31,500 / $23,625 or per-box $2,000 / $1,600 constants from hardcoded literals — they live in `ReferenceData`.

---

# 12) Practical developer cheat sheet

- **12a**: dependent checkbox(es), composite Boolean with MFJ spouse OR-operand.
- **12b**: MFS spouse itemizes -> standard deduction is **0**.
- **12c**: dual-status alien -> standard deduction is **0**.
- **12d**: age / blindness boxes count (0-4); HOH / QSS exclude spouse; MFS narrow-allow via `spouseMeetsAgeBlindnessMfsRequirements`.
- **12e** path selection:
  - normal standard-deduction path -> computed standard deduction;
  - itemizing path -> Schedule A line 17;
  - increased standard deduction for net qualified disaster loss -> standard + `scheduleA.netQualifiedDisasterLoss` (functionally equal to combined Schedule A line 16).
- 2025 base standard deduction:
  - **Single / MFS**: $15,750
  - **MFJ / QSS**: $31,500
  - **HOH**: $23,625
- 2025 per-box age / blind addon:
  - **Single / HOH**: $2,000
  - other statuses: $1,600
- 2025 OBBBA SALT cap:
  - $40,000 ($20,000 MFS), reduced above MAGI $500,000 ($250,000 MFS) to a floor of $10,000 ($5,000 MFS).
- Schedule A medical floor uses **raw AGI** (line 11a), not a MAGI.
- Election: ITEMIZED / STANDARD / AUTO; AUTO defaults to `max(standard, itemized)`; ITEMIZED < STANDARD sets the Schedule A line 18 flag.
