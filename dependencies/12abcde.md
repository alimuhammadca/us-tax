# Dependency Map — Lines 12a-12e: Standard / Itemized Deductions

Tax year: **2025**

---

## 1. Computation identity

| Item | Value |
|---|---|
| Form 1040 labels | Line 12a (dependent checkboxes; composite Boolean), 12b (MFS spouse itemizes), 12c (dual-status alien), 12d (age/blindness count 0-4), 12e (deduction amount) |
| Formula | `line12e = standard_deduction OR scheduleA.line17 OR (standard_deduction + scheduleA.netQualifiedDisasterLoss)` |
| Backend orchestrator | `computeLine12(...)` at `TaxReturnComputeService.java:5295` |
| Input reader | `buildStandardDeductionIndicators(...)` at `TaxReturnComputeService.java:4987` (SURGICAL MFS guard — per-field) |
| Standard deduction | `computeStandardDeduction(...)` at `TaxReturnComputeService.java:5799` (5-path branching) |
| Final election | `chooseLine12e(...)` at `TaxReturnComputeService.java:6091`; `chooseDeductionType(...)` at line 6103 |
| Age/blind helper | `countAgeBlindnessBoxes(...)` static at `TaxReturnComputeService.java:29314` (HOH/QSS exclude spouse) |
| Return type | `Line12Computation` record |
| Output models | `Deductions.java`, `ScheduleA.java`, `StandardDeductionIndicators.java` |

---

## 2. Upstream inputs

### 2.1 Personal forms

| Form ID | Person | Key fields read |
|---|---|---|
| `standard-deductions-taxpayer` | Taxpayer | `deductionElection` (`STANDARD`/`ITEMIZED`/`AUTO`), `someoneCanClaimYou`, `youWereDualStatusAlien`, `youBornBeforeThreshold`, `youAreBlind`, `dependentStandardDeductionEarnedIncome`, `medicalDentalExpensesPaid`, `stateLocalTaxChoice` (`Income`/`Sales`), `stateLocalIncomeTaxesPaid`, `stateLocalSalesTaxesPaid`, `realEstateTaxesPaid`, `personalPropertyTaxesPaid`, `homeMortgageInterestPaid`, `homeMortgagePointsPaid`, `investmentInterestPaid`, `netInvestmentIncome`, `charitableCashContributions`, `charitableNonCashContributions`, `personalCasualtyAndTheftLoss`, `foreignTaxesPaid`, `otherAllowedItemizedDeductions`, `electsToItemizeAlthoughLessThanStandard`, `netQualifiedDisasterLoss`, `electDisasterLossStandardDeductionIncrease` |
| `standard-deductions-spouse` | Spouse | `someoneCanClaimSpouse` (MFJ-only), `spouseItemizesSeparateReturn` (MFS-legitimate), `spouseBornBeforeThreshold` (MFS-legitimate), `spouseIsBlind` (MFS-legitimate), `spouseMeetsAgeBlindnessMfsRequirements` (MFS-legitimate gate) |

### 2.2 Upstream computed values

| Source | Field | How used |
|---|---|---|
| `buildAdjustments()` result | `adjustments.line11a` (raw AGI) | Medical deduction floor (7.5% × **raw AGI**, NOT MAGI); SALT MAGI phasedown threshold |
| `computeLine13a()` (called inside `computeLine12()`) | `line13a` | Line 14 = line 12e + line 13a + line 13b |
| `computeSchedule1A()` (runs after `computeLine12()`) | `line13b` | Final line 15 = max(0, AGI − line12e − line13a − line13b) |

### 2.3 Statement entries (none)

No statement entries are directly read by `computeLine12()`. Schedule A inputs come entirely from personal form fields.

### 2.4 Filing status dependency

`filing_status` from the `filing-status` personal form, passed through `buildStandardDeductionIndicators()`.

### 2.5 SURGICAL MFS guard at the indicators reader

`buildStandardDeductionIndicators` uses a **surgical** MFS variant: only fields with **MFJ-only semantics** are null-shadowed on MFS. Fields with **MFS-legitimate** semantics remain readable.

| Field | MFS semantics | Behavior on MFS |
|---|---|---|
| `someoneCanClaimSpouse` | MFJ-only | null-shadowed |
| `spouseItemizesSeparateReturn` | MFS-legitimate | remains readable |
| `spouseBornBeforeThreshold` | MFS-legitimate | remains readable |
| `spouseIsBlind` | MFS-legitimate | remains readable |
| `spouseMeetsAgeBlindnessMfsRequirements` | MFS-legitimate (gates the others) | remains readable |

Lock-in test: `mfsExcludesSpouseDependentFlagFromLine12a`.

---

## 3. Checkbox composition rules

### 3.1 Line 12a — composite Boolean with MFJ spouse OR-operand

```text
line12aChecked = someoneCanClaimYou
               OR (filing_status == MFJ AND someoneCanClaimSpouse)
```

The MFJ filter is inline at `computeLine12()` so stale spouse data on Single / MFS / HOH / QSS cannot leak in.

### 3.2 Line 12b — MFS-only

```text
line12bChecked = (filing_status == MFS) AND spouseItemizesSeparateReturn
```

**Effect — hard-zero per IRC §63(c)(6)(A):** `standard_deduction = 0`. Age/blindness addons do NOT override.

### 3.3 Line 12c — taxpayer-side, no filing-status filter

```text
line12cChecked = youWereDualStatusAlien
```

**Effect — hard-zero per IRC §63(c)(6)(B):** `standard_deduction = 0`. Age/blindness addons do NOT override.

### 3.4 Line 12d — integer count 0-4

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

Filing-status rules for spouse boxes (enforced inside `countAgeBlindnessBoxes`):
- **HOH / QSS** — spouse boxes are **never** counted.
- **MFS** — spouse boxes counted only if `spouseMeetsAgeBlindnessMfsRequirements=true` (no income, not filing, not claimable).
- **MFJ** — spouse boxes counted normally.
- **Single** — no spouse boxes.

Age threshold: **born before January 2, 1961** (treated as reaching 65 the day before the 65th birthday).

---

## 4. Standard deduction computation (5 paths)

`computeStandardDeduction(...)` at `TaxReturnComputeService.java:5799` applies in order:

1. **Defensive null** — `status == null` → return null.
2. **Hard-zero** — `line12b OR line12c` → return 0 (IRC §63(c)(6)).
3. **Dependent worksheet** (when `line12aChecked`):
   ```text
   if earned_income > 900: worksheet_line2 = earned_income + 450
   else:                   worksheet_line2 = 1350
   worksheet_line3 = base_for_filing_status (15750/31500/23625)
   worksheet_line4a = min(worksheet_line2, worksheet_line3)
   per_box_addon = 2000 if filing_status in {Single, HOH} else 1600
   worksheet_line4b = line12dCount * per_box_addon
   standard_deduction = worksheet_line4a + worksheet_line4b
   ```
4. **Age/blind chart** (when `line12dCount > 0` and 12a does not apply) — base + `line12dCount × per_box_addon`.
5. **Base amount**:
   - Single/MFS: **$15,750**
   - MFJ/QSS: **$31,500**
   - HOH: **$23,625**

All constants live in `ReferenceData` (centralized; not hardcoded inside `computeStandardDeduction`).

### 4.1 Disaster-loss augmentation (Schedule A line 16 path)

After the base standard deduction is chosen, `computeLine12()` checks `scheduleA.usedForStandardDeductionIncrease`. When TRUE:

```text
augmented_standard = standard_deduction + scheduleA.netQualifiedDisasterLoss
```

The augmented amount is what `chooseLine12e` returns under the STANDARD or AUTO election. This flows from Schedule A line 16 directly to Form 1040 line 12e — NOT through Schedule A line 17. Functionally equal to the IRS "Schedule A line 16 combined" recipe.

---

## 5. Itemized path (Schedule A 2025 — OBBBA SALT)

### 5.1 Standard itemized path

```text
itemized_deductions = ScheduleA.line17 = sum(lines 4..16)
```

### 5.2 Medical floor

Uses **raw AGI** (`line11a` via legacy `adjustedGrossIncome` accessor), NOT a MAGI:

```text
deductibleMedical = max(0, medicalDentalExpensesPaid − 0.075 × AGI)
```

### 5.3 SALT cap (2025 OBBBA)

Major 2025 change replacing prior TCJA flat $10k/$5k:

- Base cap: **$40,000** ($20,000 MFS).
- If MAGI > **$500,000** ($250,000 MFS): cap reduced under Schedule A line-5e worksheet per OBBBA phasedown.
- **Floor**: **$10,000** ($5,000 MFS).

The nine SALT constants ($40,000 / $20,000 / $500,000 / $250,000 / $10,000 / $5,000 plus OBBBA phasedown coefficients) are centralized in `ReferenceData`.

### 5.4 Other Schedule A rules

- Line 5a: deduct state/local **income OR sales tax, not both**.
- Casualty losses: federally declared disaster only.
- Line 16: specific allowed items only — NOT a free-form bucket.
- `electsToItemizeAlthoughLessThanStandard=true` sets Schedule A line 18.

---

## 6. Final mapping to line 12e

```text
chooseLine12e(deductionElection, standardDeduction, itemized):
  if ITEMIZED: return itemized                     # Schedule A line 17
  if STANDARD: return standardDeduction            # possibly + disaster augmentation
  if AUTO:     return max(standardDeduction, itemized)
```

The IRS does NOT require `max(standard, itemized)`. AUTO mode picks the larger value as a tax-optimization convenience; explicit ITEMIZED / STANDARD elections override.

---

## 7. Downstream consumers

| Consumer | What it uses | How |
|---|---|---|
| `computeLine16()` — Line 16 Tax | `deductions.line15TaxableIncome` (line 15) | Input to all tax computation methods (Tax Table, TCW, QDCG Worksheet, etc.) |
| `computeScheduleD()` | `deductions.line15TaxableIncome` | QDCG worksheet threshold comparisons |
| `computeLine13a()` | `line12e` | QBI threshold is `2 × taxable_income` (Form 8995-A above-threshold test) |
| `computeForm8863()` | `line15TaxableIncome` (via AGI) | Education credit MAGI phaseout |
| `computeForm8880()` | `line15TaxableIncome` (via AGI) | Saver's credit AGI ceiling |
| `computeEicEarned()` | `line15TaxableIncome` (via AGI) | EIC phaseout reference |
| PDF export / frontend display | `deductions.deductionAmount` | Form 1040 line 12e display |
| AMT (Form 6251) | `scheduleA.deductibleTaxes` | Line 2a SALT add-back when itemizing |

---

## 8. Output fields produced

### `Deductions` object (Form 1040 lines 12-15)
```
line12aChecked                     → line 12a (composite Boolean — taxpayer OR MFJ spouse can be claimed)
line12bChecked                     → line 12b (MFS spouse itemizes)
line12cChecked                     → line 12c (dual-status alien)
line12dBoxesCheckedCount           → line 12d (integer 0-4)
deductionElection                  → "STANDARD" | "ITEMIZED" | "AUTO"
standardDeductionComputed          → computed standard deduction (before chooseLine12e)
itemizedDeductionsFromScheduleA    → Schedule A total (line 17 or line 16 combined)
deductionType                      → "Standard" or "Itemized"
deductionAmount                    → Form 1040 line 12e (final amount)
qualifiedBusinessIncomeDeduction   → Form 1040 line 13a
totalDeductions                    → Form 1040 line 14 = line12e + line13a + line13b
taxableIncome                      → interim (before line 13b)
line15TaxableIncome                → Form 1040 line 15 (updated after Schedule 1-A; max(0, ...))
```

### `ScheduleA` object
```
stateLocalTaxChoice                → "Income" or "Sales"
medicalDentalExpensesPaid          → Schedule A line 1
adjustedGrossIncome                → raw AGI (for 7.5% floor)
medicalExpenseFloor                → 7.5% × raw AGI
deductibleMedicalExpenses          → Schedule A line 4
stateLocalIncomeTaxesPaid          → Schedule A line 5a (income option)
stateLocalSalesTaxesPaid           → Schedule A line 5a (sales option)
realEstateTaxesPaid                → Schedule A line 5b
personalPropertyTaxesPaid          → Schedule A line 5c
taxesBeforeLimit                   → sum of all SALT components before cap
deductibleTaxes                    → Schedule A line 5e (after OBBBA SALT cap)
foreignTaxesPaid                   → Schedule A line 6 (foreign deduction alternative to Form 1116)
deductibleForeignTaxes             → Schedule A line 6 after any limitation
homeMortgageInterestPaid           → Schedule A line 8a
homeMortgagePointsPaid             → Schedule A line 8b
investmentInterestPaid             → Schedule A line 9 (before NII cap)
netInvestmentIncome                → NII cap for Schedule A line 9
deductibleInvestmentInterest       → Schedule A line 9 (after NII cap)
totalInterestPaid                  → Schedule A line 10
charitableCashContributions        → Schedule A line 11
charitableNonCashContributions     → Schedule A line 12
totalCharitableContributions       → Schedule A line 14
personalCasualtyAndTheftLoss       → Schedule A line 15 (federally declared disaster only)
netQualifiedDisasterLoss           → Schedule A line 16 (disaster loss component)
otherAllowedItemizedDeductions     → Schedule A line 16 (other allowed items only)
electsToItemizeAlthoughLessThanStandard → Schedule A line 18 flag (true when election=ITEMIZED but < standard)
totalItemizedDeductions            → Schedule A line 17
usedForItemizedDeduction           → true if on itemized path
usedForStandardDeductionIncrease   → true if disaster loss augments standard deduction
```

### PDF semantic-key mapping (2025-correct)
- `c2_1[0]` → `taxpayer_can_be_claimed_as_dependent`
- `c2_2[0]` → `spouse_can_be_claimed_as_dependent`
- `c2_3[0]` → `line12b_spouse_itemizes_separate_return`
- `c2_4[0]` → `line12c_dual_status_alien`
- `c2_5[0]` → `taxpayer_born_before_1961`
- `c2_6[0]` → `spouse_born_before_1961`
- `c2_7[0]` → `taxpayer_blind`
- `c2_8[0]` → `spouse_blind`
- `f2_02[0]` → `line12_standard_deduction_or_itemized_deductions` (line 12e amount)

---

## 9. Flags emitted

| Flag code | Blocking | Condition |
|---|---|---|
| *(none from line 12 itself)* | — | No blocking flags currently emitted from `computeLine12()` |

> **Form 4684 required attachment** (not a flag, but a `RequiredAttachmentForm`) is produced when:
> `scheduleA.netQualifiedDisasterLoss > 0` AND (`usedForItemizedDeduction` OR `usedForStandardDeductionIncrease`)

---

## 10. Conditional attachments

| Form | When generated |
|---|---|
| Schedule A | When `deductionType="Itemized"` OR when disaster-loss standard deduction increase is elected |
| Form 4684 (required attachment marker) | When Schedule A has a positive `netQualifiedDisasterLoss` used in the computation |
| Form 8995 / Form 8995-A | When `computeLine13a()` produces a QBI deduction (inside `computeLine12()` result) |

---

## 11. Known implementation gaps

| Gap | Severity | Notes |
|---|---|---|
| SALT MAGI reduction worksheet (OBBBA phasedown above $500k/$250k MFS to floor $10k/$5k) | **HIGH** | Base cap $40k/$20k MFS implemented; the per-OBBBA phasedown worksheet at line 5e is not yet enforced |
| HOH spouse boxes not blocked at backend (UI prevents via no spouse tab for HOH) | MEDIUM | `countAgeBlindnessBoxes()` internally excludes HOH/QSS spouse boxes but no explicit blocking validation |
| MFS spouse age/blindness restriction not validated | LOW | No check: spouse no income, not filing, not dependent (relies on UI gate) |
| Foreign taxes (Schedule A line 6) deductibility rules not enforced | LOW | User enters amount; no Form 1116 conflict check at backend |
| Schedule A line 16 `otherAllowedItemizedDeductions` eligible-type validation absent | LOW | Attorney fees, impairment expenses not categorized |
| Form 4684 not computed from data — `netQualifiedDisasterLoss` / `personalCasualtyAndTheftLoss` are user-entered | MEDIUM | No Form 4684 computation; tracked in outstanding.md |
| Form 4952 investment interest limitation (proper NII computation) deferred | MEDIUM | Tracked in outstanding.md |
| Form 8396 mortgage interest reduction not fed back to Schedule A | MEDIUM | Tracked in outstanding.md |

---

## 12. Special edge rule

If the taxpayer made a **section 962 election** and is taking a **section 250 deduction** with respect to §951A inclusions:
- do NOT report that deduction on line 12e;
- report the related tax on line 16 and include the required explanatory statement.

---

## 13. Data-flow summary

```
[standard-deductions-taxpayer personal form]
  deductionElection ──────────────────────────────────── "STANDARD" | "ITEMIZED" | "AUTO"
  someoneCanClaimYou ───────────────────────────────────► line12a (composite, OR-operand)
  youWereDualStatusAlien ──────────────────────────────► line12c → standard_deduction = $0 (§63(c)(6)(B))
  youBornBeforeThreshold, youAreBlind ─────────────────► line12dCount taxpayer side

[standard-deductions-spouse personal form]
  someoneCanClaimSpouse (MFJ-only) ────────────────────► line12a (OR-operand on MFJ only)
  spouseItemizesSeparateReturn (MFS-legit) ────────────► line12b → standard_deduction = $0 (§63(c)(6)(A))
  spouseBornBeforeThreshold, spouseIsBlind (MFS-legit) ► line12dCount spouse side (MFJ always; MFS gated by spouseMeetsAgeBlindnessMfsRequirements)

computeStandardDeduction() — 5 paths:
  1. if status==null → null
  2. if line12b OR line12c → 0
  3. if line12a → dependent worksheet
       dependentStandardDeductionEarnedIncome ── if > $900: + $450; else $1,350
       cap at base_sd, add line12dCount × per_box_addon
  4. if line12dCount > 0 → base + line12dCount × per_box_addon
  5. else → base for filing_status

buildScheduleA():
  medicalDentalExpensesPaid ── max(0, medical − 7.5% × RAW AGI) ──────────► deductibleMedical
  stateLocalIncomeTaxesPaid OR stateLocalSalesTaxesPaid
    + realEstateTaxesPaid + personalPropertyTaxesPaid
    ── OBBBA cap $40k/$20k MFS; phasedown above $500k/$250k MFS to floor $10k/$5k ─► deductibleTaxes
  foreignTaxesPaid ────────────────────────────────────────────────────────► Schedule A line 6
  homeMortgageInterestPaid + homeMortgagePointsPaid ──────────────────────► totalInterest (part)
  min(investmentInterestPaid, netInvestmentIncome) ────────────────────────► deductibleInvestmentInterest
  charitableCashContributions + charitableNonCashContributions ────────────► totalCharity
  personalCasualtyAndTheftLoss ────────────────────────────────────────────► Schedule A line 15
  netQualifiedDisasterLoss ────────────────────────────────────────────────► Schedule A line 16 / disaster pool
  otherAllowedItemizedDeductions ──────────────────────────────────────────► Schedule A line 16 (other)
  sum all → totalItemizedDeductions

if electDisasterLossStandardDeductionIncrease AND STANDARD election:
  augmented_standard = standard_deduction + netQualifiedDisasterLoss
  (functionally ≡ ScheduleA.line16_combined; flows directly to Form 1040 line 12e, NOT through line 17)

chooseLine12e():
  "ITEMIZED" → itemized
  "STANDARD" → standard (possibly + disaster augmentation)
  "AUTO"     → max(standard, itemized)
  │
  ├─► Form 1040 line 12e
  ├─► computeLine13a() → line 13a (QBI)
  ├─► line 14 = line12e + line13a + line13b
  └─► line 15 = max(0, AGI − line14) [line13b finalized by Schedule 1-A in second pass]
```
