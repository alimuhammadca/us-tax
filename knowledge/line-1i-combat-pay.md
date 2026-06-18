# Knowledge: Form 1040 Line 1i — Nontaxable Combat Pay Election

**Tax year:** 2025  
**Last updated:** 2026-04-13  
**Status:** Fully implemented, all UI gaps resolved

---

## What Line 1i Is

Line 1i is a **credit-only** line. It holds the amount of nontaxable military combat pay that a taxpayer (or spouse) elects to count as "earned income" when computing:

1. The Earned Income Credit (EIC) — line 27a
2. The Additional Child Tax Credit (ACTC) — Schedule 8812 line 6a / Part II-A

The election is optional, all-or-none per person, and does **not** make the combat pay taxable. It does not flow into wages (lines 1a–1h), line 1z, or AGI.

---

## Source

Only one source: **W-2 box 12 code Q** (nontaxable combat pay). No other W-2 codes, allowances, or military pay types belong here.

---

## Election Rules

| Rule | Detail |
|---|---|
| Optional | Must be affirmatively elected; not automatic |
| All-or-none per person | Cannot elect partial amount |
| MFJ independent | Each spouse elects independently (4 combinations allowed) |
| IRS caution | Election may **decrease** EIC if filer is in phaseout range — compute both ways |

### Why the election can decrease EIC

The EIC table uses the **lesser of** earned income or AGI at the phaseout threshold. Combat pay increases earned income (for EIC) but does NOT increase AGI. In the phaseout range, a higher earned income value yields a lower EIC table lookup result, which may bind. Taxpayers in the EIC phase-in range benefit; those in the phaseout range may be harmed.

---

## Formula

```
# Per person
electedCombatPay_person = electCombatPay ? sumW2CodeQ(person) : 0

# Return level
Line1i = electedCombatPay_taxpayer + electedCombatPay_spouse
```

---

## Downstream Credit Interactions

### EIC (line 27a)
```
earnedIncomeForEic = normalEarnedIncome + Line1i
```

### ACTC — Schedule 8812 Part II-A (2025)
```
ACTCBase = taxableEarnedIncome + Line1i
ACTCFloor = max(0, ACTCBase - 2500)
ACTCFromEarnedIncome = ACTCFloor × 15%
cap per qualifying child = $1,700 (2025)
```

### IRA contributions (informational, out of scope for line 1i)
Nontaxable combat pay also counts as **compensation** for IRA contribution purposes (traditional + Roth). This is a statutory exception to the general nontaxable-income exclusion from IRA compensation. Handled in IRA forms, not line 1i.

---

## Implementation — Backend

**File:** `TaxReturnComputeService.java`  
**Method:** `computeCombatPay(taxpayerData, spouseData, you, spouse, w2Entries, uid)`  
**Constant:** `COMBAT_PAY_CODES = Set.of("Q")`

### Algorithm
1. Normalize taxpayer SSN and spouse SSN (digits-only)
2. Filter W-2 entries by each SSN; sum box 12 code Q amounts → `taxpayerTotal`, `spouseTotal`
3. Read `electCombatPay` boolean from `combat-pay-taxpayer` and `combat-pay-spouse` forms
4. If elected and total > null → use total. If elected but no code Q found → use `BigDecimal.ZERO`
5. `line1i = addNonNull(taxpayerElected, spouseElected)` → rounded to cents
6. Result stored in `CombatPayComputation(line1i)` record

**Output model:** `Income.nontaxableCombatPayElection` (BigDecimal, nullable)

**Line 1z:** `addNonNull(1a, 1b, 1c, 1d, 1e, 1f, 1g, 1h)` — line 1i is **explicitly excluded**.

**Personal form registration (`PersonalResource.java`):**
- `combat-pay-taxpayer`
- `combat-pay-spouse`

---

## Implementation — Frontend

### Taxpayer component
**File:** `form-combat-pay-taxpayer.component.ts`

- Loads saved election from `PersonalDataService.getForm('combat-pay-taxpayer')`
- Fetches taxpayer SSN from `you` form
- Iterates all W-2 entries, filters by taxpayer SSN, sums box 12 code Q amounts
- Shows attributed read-only green box with `combatPayTotal` and "From W-2 Box 12 Code Q" source + correction link when combat pay detected
- Hides election block entirely (`*ngIf`) and shows message when no code Q found
- `electCombatPay` rendered as Yes/No radio buttons (`p-radiobutton`, container id `electCombatPay`)
- On submit: persists `{ combatPayTotal, electCombatPay }` via `saveForm('combat-pay-taxpayer')`

### Spouse component
**File:** `form-combat-pay-spouse.component.ts`

- Identical pattern; fetches spouse SSN from `identification-spouse` or legacy `spouse` form
- Filters W-2 entries by spouse SSN only

### Shell integration
**Sidebar section:** Income  
**Form IDs:** `combat-pay-taxpayer` (taxpayer tab), `combat-pay-spouse` (spouse tab)  
**Icon:** `pi pi-shield`

---

## YAML Intake Specs

**Files:**
- `C:\us-tax\yamls\1i-combat-pay-taxpayer.yaml`
- `C:\us-tax\yamls\1i-combat-pay-spouse.yaml`

**Fields per form:**
| Field | Type | readOnly | Notes |
|---|---|---|---|
| `combatPayTotal` | amount | true | Imported from W-2 code Q; display only |
| `electCombatPay` | boolean | false | Yes/No election flag |

Both forms: `multiplicity: single`, `category: credits.earnedIncome`

---

## Test Coverage

### Backend unit tests (`TaxReturnComputeServiceTest`)

| Test name | What it verifies |
|---|---|
| `computesCombatPayElectionForTaxpayer` | taxpayer elects, W-2 code Q $3,000 → `nontaxableCombatPayElection = 3000` |
| `computesCombatPayElectionForSpouse` | spouse elects, W-2 code Q $1,500 SSN-matched → `nontaxableCombatPayElection = 1500` |
| `combatPayElectionWithoutCodeQIsZero` | elected but no code Q W-2 → `nontaxableCombatPayElection = 0` |
| `computesLine1zSumExcludesCombatPayElection` | code Q present + elected, line 1z = wages only (excludes $1,500 combat pay) |

### Frontend component tests (`form-combat-pay-spouse.component.spec.ts`)

| Test name | What it verifies |
|---|---|
| does not attribute taxpayer combat pay to the spouse | SSN mismatch → `combatPayTotal = null`, `hasCombatPay() = false` |
| counts only W-2 code Q rows matching spouse SSN | 2 W-2s → only spouse's $1,200 counted, not taxpayer's $900 |

### E2E tests (`line1i-combat-pay.spec.ts`)

| Test | Scenario |
|---|---|
| Combat pay election for taxpayer flows to Form 1040 line 1i | W-2 code Q $2,500 + elect Yes → `nontaxableCombatPayElection = 2500`, Form 1040 shows "2,500" |
| Combat pay election for spouse flows to Form 1040 line 1i | Spouse W-2 code Q $1,200 + elect Yes → `nontaxableCombatPayElection = 1200` |
| Combat pay election is disabled when no W-2 code Q exists | W-2 without code Q → message shown, dropdown disabled |
| Spouse combat pay election is disabled without spouse code Q | Only taxpayer has code Q → spouse form shows message, disabled |

### E2E page object
**File:** `e2e/tests/pages/personal-forms/combat-pay.page.ts`

- `openTaxpayer()` / `openSpouse()` — select person tab + sidebar form
- Polls for enabled state or "missing" message (handles async W-2 load race condition)
- `saveTaxpayer()` / `saveSpouse()` — waits for PUT 200

---

## Known Gaps / Outstanding Items

| # | Gap | Severity | Status |
|---|---|---|---|
| 1 | `electCombatPay` used `p-select` dropdown instead of radio buttons | Medium | Resolved 2026-04-13 |
| 2 | UI did not show EIC "compute both ways" guidance | Low | Resolved 2026-04-13 — IRS caution added to both components |
| 3 | `computeSchedule8812()` was missing `nontaxableCombatPayElection` in 15% ACTC earned income floor | Low | Resolved 2026-04-13 — fixed + 2 unit tests added |
| 4 | `combatPayTotal` never shown to user (no source attribution) | Medium | Resolved 2026-04-13 — attributed green box added |
| 5 | YAML instructions said "EITC only" instead of "EITC and ACTC" | Low | Resolved 2026-04-13 |
| 6 | IRA contribution based on combat pay — informational note only; no UI/compute required for line 1i | Informational | N/A |

---

## Flowchart Reference

`C:\us-tax\flowcharts\1i.drawio`

## Dependency Reference

`C:\us-tax\dependencies\1i.md`

## Line Spec Reference

`C:\us-tax\lines\1i.md`
