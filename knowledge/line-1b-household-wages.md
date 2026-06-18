# Line 1b — Household Employee Wages (no W-2)

Comprehensive analysis verified 2026-04-07 against code, spec, unit tests, E2E tests, and IRS sources.

---

## What it is

Form 1040 Line 1b reports **household employee wages not reported on any Form W-2**. It is a
reporting location, not a threshold gate. The $2,800 (2025) figure is the employer's W-2
*obligation threshold*, not an eligibility condition for the line.

---

## Three-gate formula (spec and code)

`1b = Σ householdEmployers[].wages` where **all three** gates pass:

| Gate | YAML field | Backend check |
|---|---|---|
| Did household work | `householdWork == true` | `getBoolean(data, "householdWork")` |
| Passes control test (employee, not self-employed) | `householdEmployeeUnderControlTest == true` | `getBoolean(data, "householdEmployeeUnderControlTest")` |
| No W-2 received | `householdReceivedW2 == false` | `getBoolean(data, "householdReceivedW2")` |

Code: `TaxReturnComputeService.householdEmployeeAmount()` (around line 10978) called by
`sumHouseholdEmployeeWages()` (around line 10966), which aggregates taxpayer + spouse
respecting the MFS guard.

Outer gate: `hasEmploymentIncome == true` is enforced at TWO layers (since 2026-05-05):
the UI's `normalizeForSave` clears `householdWork` to null when `hasEmploymentIncome != true`,
AND `householdEmployeeAmount()` returns null at the top when `hasEmploymentIncome != true`
(mirroring the `validateHouseholdEmployeeControlTest()` pattern at line 2680). Defense-in-depth
— see Issue 2 below for the full fix history.

---

## Intake form

| Item | Value |
|---|---|
| Form ID | `employment-income-taxpayer` / `employment-income-spouse` |
| API endpoint | `PUT /api/personal/employment-income-{taxpayer|spouse}` |
| Firestore path | `users/{uid}/personal/_bundle` (field `data.employment-income-taxpayer`) + legacy `users/{uid}/personal/employment-income-taxpayer` |
| Key fields | `hasEmploymentIncome`, `householdWork`, `householdEmployeeUnderControlTest`, `householdReceivedW2`, `householdEmployers[]{employerName, wages}` |

---

## Blocking flag

`HOUSEHOLD_WORK_SELF_EMPLOYMENT_TAXPAYER` (and `_SPOUSE`) is emitted when:
- `hasEmploymentIncome == true` AND `householdWork == true` AND
  `householdEmployeeUnderControlTest == false`

Emitted by `validateHouseholdEmployeeControlTest()` at line 2430. Signals that the worker
appears to be self-employed — Schedule C path, not Line 1b.

---

## Computed output persistence

`form1040.income.householdEmployeeWages` (a `BigDecimal` field) is set in `buildIncome()`:
```java
BigDecimal line1b = roundMoney(householdWagesRaw);
```
Persisted to `users/{uid}/tax-returns/current` by `TaxReturnDataService.saveComputation()`.

MFJ aggregation: `sumHouseholdEmployeeWages(taxpayer, spouse, isMfs)` aggregates taxpayer +
spouse on MFJ; on MFS the spouse contribution is skipped (`if (!isMfs) total +=
householdEmployeeAmount(spouse)`). See Issue 4 below for verification details.

---

## Tax return UI display

`form-tax-return-1040.component.ts` reads
`taxReturnService.computation()?.form1040?.income.householdEmployeeWages` and renders it
on the Form 1040 preview as line 1b. The value also feeds `line1z` (total wages) and
`line9` (total income) through the standard wage aggregation path.

The computed return is reloaded from Firestore on `taxReturnService.loadReturn()`, so the
line 1b value persists across page reloads.

---

## Test coverage

### Unit tests (refreshed 2026-05-05)

| Test | Branch covered |
|---|---|
| `computesLine1bFromHouseholdEmployerList` | Happy path — two employers summed |
| `line1bDefensiveGate_householdWagesNullWhenHasEmploymentIncomeFalse` | Defensive `hasEmploymentIncome=false` gate (Issue 2) |
| `line1b_controlTestFailureYieldsNullHouseholdWages` | Control-test failure → null |
| `line1b_w2ReceivedYieldsNullHouseholdWages` | W-2 received → null |
| `line1b_employerTreatedAsContractorExcludedFromLine1b` | Per-employer collision guard (partial-list filtering) |
| `line1b_mfjSpouseWagesAggregatedIntoTaxpayerReturn` | MFJ spouse aggregation (taxpayer + spouse summed) |
| `line1b_mfsSpouseWagesNotAggregatedToTaxpayerReturn` | MFS spouse exclusion (Issue 4) |

7 dedicated unit tests cover all branches. Earlier coverage-gap notes (April 2026) are
fully resolved.

### E2E tests (`line1b-household.spec.ts`)

| Test | What it verifies |
|---|---|
| Happy path ($500 total) | Two employers, no W-2 → `householdEmployeeWages == 500` and line 1b UI shows "500" |
| Control test failure | `householdEmployeeUnderControlTest == No` → computation null, line 1b blank |
| Threshold guidance message | W-2 received path → "$2800" hint visible |
| W-2 present → not on 1b | `householdReceivedW2 == Yes` → line 1b null, blank |

Coverage is good for the primary branches. No E2E test for the Form 8919 collision.

---

## Issues in `1b.md`

### Issue 1 — Form 8919 collision guard — RESOLVED (verified 2026-05-05)

Originally flagged 2026-04-07 as "specified but NOT implemented (CRITICAL)." The guard
has since been implemented, and at a more granular level than the spec required.

**Spec called for** (1b.md §5 rule 4 / §6 canonical computation):
> Per-return: skip line 1b entirely if `reportedOnForm8919 == true`.

**Actual implementation** (`TaxReturnComputeService.householdEmployeeAmount` lines 11000–11006):
Per-employer flag `employerTreatedAsContractor`. When true, **that single employer's
wages** are excluded from line 1b and route through Form 8919 → line 1g; other employers
in the same `householdEmployers[]` list still count normally.

**UI** (`form-employment-taxpayer.component.ts`): asks per-employer "Did this employer
pay you as a contractor — for example, by issuing a 1099 instead of a W-2?" Yes/No.
Yes shows guidance pointing to the Uncollected wages section.

**Why this is better than the original spec**: a household worker with multiple employers
(say a normal nanny job + a side gig where one employer mis-classified them) gets the
correct split — the contractor wages route to line 1g, the legitimate household wages
stay on line 1b. A return-level boolean would have forced an all-or-nothing choice.

**Outstanding test gap** (separately tracked as `1b.xlsx` Code Validation #6): no unit
test confirms partial-list behavior (one contractor employer mixed with non-contractor
employers in the same list).

### Issue 2 — `hasEmploymentIncome` outer gate — RESOLVED (verified 2026-05-05)

Originally flagged 2026-04-07: spec didn't document that `hasEmploymentIncome == true` is
a prerequisite, and the backend `householdEmployeeAmount()` did not enforce it (UI was
the sole gate via `normalizeForSave`).

**Fix applied 2026-05-05:**
- `householdEmployeeAmount()` now returns `null` at the top when
  `hasEmploymentIncome != true` (mirrors the `validateHouseholdEmployeeControlTest()`
  pattern at line 2683). Hard gate: rejects both `null` and `false`.
- `lines/1b.md` §6 updated to document the dual-layer enforcement (UI + backend).
- `dependencies/1b.md` Always-required inputs table now lists `hasEmploymentIncome`
  with the backend gate behavior.
- New unit test `line1bDefensiveGate_householdWagesNullWhenHasEmploymentIncomeFalse`
  verifies that a contradictory state (`hasEmploymentIncome=false` + `householdWork=true`
  + valid employer wages) produces a null line 1b instead of inflating it.

Defense-in-depth: UI prevents the malformed state via `normalizeForSave`; the backend
gate guards against direct-API submissions and legacy data.

### Issue 3 — Blocking flags + missing-W-2 → line 1b handoff documentation — RESOLVED (verified 2026-05-05)

Originally flagged 2026-04-07: `1b.md` did not mention `HOUSEHOLD_WORK_SELF_EMPLOYMENT_*`
flags or document the missing-W-2 → line 1b handoff.

**Now in place:**
- `lines/1b.md` §6 has a "Blocking flags" subsection listing both flags with conditions.
- `dependencies/1b.md` "Cross-line consistency" section documents the handoff: when
  `householdWork=true`, `validateEmploymentIncomeW2ForPerson()` suppresses
  `MISSING_W2_EMPLOYMENT_INCOME_*` (this is the line 1a → line 1b signaling — line 1a
  knows wages route via 1b instead of demanding a W-2).
- `1b.xlsx` Cross-Line Interactions sheet (2026-05-05) maps both directions of the handoff.

### Issue 4 — MFS aggregation guard — RESOLVED (verified 2026-05-05)

Originally flagged 2026-04-07: `sumHouseholdEmployeeWages()` aggregated both spouses
regardless of filing status, which would inflate an MFS taxpayer's line 1b with their
spouse's wages.

**Fix already in place** (verified at `TaxReturnComputeService.java` lines 10966-10976):

```java
private static BigDecimal sumHouseholdEmployeeWages(Map<String, Object> employmentIncomeTaxpayer,
                                                    Map<String, Object> employmentIncomeSpouse,
                                                    boolean isMfs) {
    BigDecimal total = null;
    total = addNonNull(total, householdEmployeeAmount(employmentIncomeTaxpayer));
    // MFS filers each file their own return; do not aggregate spouse household wages.
    if (!isMfs) {
        total = addNonNull(total, householdEmployeeAmount(employmentIncomeSpouse));
    }
    return total;
}
```

The function signature carries the `isMfs` boolean derived from `filing-status.filingStatus
== "Married filing separately"`. On MFS returns the spouse `householdEmployeeAmount()` call
is skipped entirely; only the taxpayer's own household wages reach line 1b.

**Test coverage**: `line1b_mfsSpouseWagesNotAggregatedToTaxpayerReturn` at
`TaxReturnComputeServiceTest.java` line 3681 — taxpayer $300 + spouse $200 with MFS filing
status → asserts line 1b = $300. (The MFS-guard sub-bullet of `1b.xlsx` Code Validation #4
is therefore already covered.)

**Documentation**: `dependencies/1b.md` Cross-line consistency section documents the MFS
guard correctly. `lines/1b.md` §6 Step 6 describes the guard as part of the canonical
computation.

---

## Issues in `diagrams/1b.drawio`

The diagram is a basic 5-node box diagram (Inputs → Computation → Outputs). It accurately
depicts the high-level data flow but:
- Does not show the three-gate decision tree
- Missing the blocking flag node (`HOUSEHOLD_WORK_SELF_EMPLOYMENT_*`)
- Missing the Form 8919 collision guard (which would be a spec-vs-code gap node)
- Predates the decision-tree flowchart style established for line 1a

Consider upgrading to the 1a.drawio decision-tree style.

---

## Outstanding items (should be in outstanding.md)

| Item | Priority |
|---|---|
| Diagram refresh: `diagrams/1b.drawio` should adopt the decision-tree style of `1a.drawio` and add the `HOUSEHOLD_WORK_SELF_EMPLOYMENT_*` blocking-flag node | Low — cosmetic, no compute impact |

All other items previously listed (Form 8919 guard, MFS guard, unit-test gaps, spec
corrections) are RESOLVED — see Issues 1–4 above.
