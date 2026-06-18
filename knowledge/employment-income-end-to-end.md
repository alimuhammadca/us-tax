# Employment Income End-to-End

## Scope

This note traces the active split employment forms for taxpayer and spouse from Angular UI through personal-form persistence, backend computation, tax-return persistence, tax-return UI loading, and current automated coverage.

Primary files traced:
- `C:\us-tax\us-tax-ui\src\app\forms\form-employment-taxpayer.component.ts`
- `C:\us-tax\us-tax-ui\src\app\forms\form-employment-spouse.component.ts`
- `C:\us-tax\us-tax-ui\src\app\service\personal-data.service.ts`
- `C:\us-tax\us-tax-ui\src\app\service\tax-return.service.ts`
- `C:\us-tax\us-tax-ui\src\app\forms\form-tax-return-1040.component.ts`
- `C:\us-tax\us-tax-ui\src\app\shell\shell.component.ts`
- `C:\us-tax\us-tax-be\src\main\java\com\ustax\microservices\PersonalResource.java`
- `C:\us-tax\us-tax-be\src\main\java\com\ustax\microservices\PersonalDataService.java`
- `C:\us-tax\us-tax-be\src\main\java\com\ustax\microservices\StatementDataService.java`
- `C:\us-tax\us-tax-be\src\main\java\com\ustax\microservices\TaxReturnComputeService.java`
- `C:\us-tax\us-tax-be\src\main\java\com\ustax\microservices\TaxReturnResource.java`
- `C:\us-tax\us-tax-be\src\main\java\com\ustax\microservices\TaxReturnDataService.java`

## Active Frontend Components

Active shell routing uses the split components, not the older combined employment form:
- `form-employment-taxpayer` renders when `selectedFormId() === 'employment-taxpayer'`
- `form-employment-spouse` renders when `selectedFormId() === 'employment-spouse'`
- the older `form-employment.component.ts` still exists in the repo, but the current shell does not mount it

That means the live UI path is:
- taxpayer: `employment-taxpayer`
- spouse: `employment-spouse`

## Frontend Interview Flow

### Taxpayer component

The taxpayer form stores this model:
- `hasEmploymentIncome`
- `submittedW2`
- `householdWork`
- `householdEmployeeUnderControlTest`
- `householdReceivedW2`
- `householdEmployers[]` with `employerName` and `wages`

Progressive reveal is implemented directly in the template and validated in `isValid()`:
1. Ask whether the taxpayer had wages.
2. If `Yes`, ask whether W-2 forms were uploaded/submitted.
3. If `Yes`, show the household-work branch.
4. If household work is `Yes`, ask the control-test question.
5. If control test is `Yes`, ask whether a W-2 was received for that household work.
6. If household-work W-2 is `No`, require at least one household employer wage row.

Normalization on save clears hidden branches:
- if `hasEmploymentIncome !== true`, all downstream fields are nulled/emptied
- if `householdWork !== true`, control-test / received-W2 / employer rows are cleared
- if `householdEmployeeUnderControlTest !== true`, received-W2 / employer rows are cleared
- if `householdReceivedW2 !== false`, employer rows are cleared

Additional UI-only behavior:
- the header badge shows current W-2 statement count from `StatementEntryStateService`
- `showW2RequiredWarning` warns when wages are indicated, household work is `No`, and either `submittedW2 !== true` or no W-2 statements are present
- the form loads tax-year reference data for the household employee threshold hint

### Spouse component

The spouse form stores the same model and uses the same branch logic, with two spouse-specific behaviors:
- it loads `filing-status` and enables the spouse form only when the status is MFJ
- the save button and inputs are disabled when `isJointReturn === false`

This is a frontend gating rule. The backend still reads `employment-income-spouse` if data exists.

## Frontend Persistence Path

All employment answers save through `PersonalDataService`:
- `saveForm(formId, payload)` sends `PUT /api/personal/{formId}`
- `getForm(formId)` sends `GET /api/personal/{formId}`

For employment specifically:
- taxpayer saves to `employment-income-taxpayer`
- spouse saves to `employment-income-spouse`

Every successful `saveForm(...)` also calls `TaxReturnService.markInputsChanged()`. This is important:
- saving employment data does **not** update the saved tax return immediately
- it only marks the current tax-return preview as stale until the user recomputes

## Backend Personal-Form Persistence

### API layer

`PersonalResource` allowlists both active employment form ids:
- `employment-income-taxpayer`
- `employment-income-spouse`

The save path is:
1. `PUT /api/personal/{formId}`
2. `PersonalResource.saveForm(...)`
3. `PersonalDataService.savePersonalForm(uid, formId, payload)`

The load path is:
1. `GET /api/personal/{formId}`
2. `PersonalResource.getForm(...)`
3. `PersonalDataService.getPersonalForm(uid, formId)`

### Firestore storage pattern

`PersonalDataService.savePersonalForm(...)` writes employment data in two places:
1. bundled document:
   - `users/{uid}/personal/_bundle`
   - under `data.{formId}`
2. legacy single-form document:
   - `users/{uid}/personal/{formId}`
   - under `data`

Read behavior is:
- prefer the `_bundle` document if present
- otherwise fall back to legacy form documents
- if legacy documents exist and `_bundle` does not, the service backfills `_bundle`

So employment answers are currently persisted in both the bundle and legacy shape.

## Statement Dependency for Line 1a

Employment forms do not contain the line 1a amount themselves.

Line 1a depends on W-2 statements stored separately by `StatementDataService`:
- statement entries live in `users/{uid}/{formId}/{entryId}` style subcollections, e.g. `users/{uid}/w-2/{entryId}`
- each statement entry stores its payload under `data`
- `TaxReturnComputeService.prepare(...)` pulls W-2 entries through `statementDataService.listEntriesWithData(uid, "w-2")`

Important consequence:
- employment forms declare that wages should exist and drive validation / branching
- W-2 statements provide the actual Box 1 wages used for line 1a

## Backend Compute Flow

`TaxReturnComputeService.prepare(...)` reads:
- `employment-income-taxpayer`
- `employment-income-spouse`
- W-2 statement entries
- taxpayer/spouse identification data for SSN matching

### W-2 validation gate

Before final compute, the service validates a required-W-2 rule per person:
- if `hasEmploymentIncome == true`
- and `householdWork == false`
- then a W-2 must exist for that person’s SSN

The check uses:
- taxpayer/spouse SSN from personal identification/header data
- W-2 `employeeSSN`

If missing, it emits blocking flags:
- `MISSING_W2_EMPLOYMENT_INCOME_TAXPAYER`
- `MISSING_W2_EMPLOYMENT_INCOME_SPOUSE`

This validation is based on actual saved W-2 entries and SSN matching.

### What the employment forms feed into Form 1040

#### Line 1a

Employment forms influence line 1a indirectly.

Backend behavior:
- read `hasEmploymentIncome` from taxpayer and spouse employment forms
- compute `hasEmploymentFlag = taxpayer.hasEmploymentIncome OR spouse.hasEmploymentIncome`
- sum W-2 Box 1 values via `sumW2Wages(w2Entries)` using `wagesTipsOtherCompAmount`
- round the total
- store it in `form1040.income.wages`
- if wages sum is null but employment was indicated, store `0`

Important detail:
- line 1a is not filtered by `submittedW2`
- line 1a is not read from the employment forms directly
- line 1a is driven by W-2 statement entries

#### Line 1b

Employment forms directly feed line 1b when household wages were not reported on a W-2.

Backend path:
- require `householdWork == true`
- require `householdEmployeeUnderControlTest == true`
- require `householdReceivedW2 == false`
- sum `householdEmployers[].wages`
- store result in `form1040.income.householdEmployeeWages`

#### Downstream totals

Employment-derived amounts then flow into:
- `form1040.income.totalWages` (line 1z)
- `form1040.income.totalIncome` (line 9) after combining with later taxable income lines

## Tax Return Persistence

### Compute endpoint

The tax return is persisted only when the compute endpoint succeeds:
1. UI calls `POST /api/tax-return/compute`
2. `TaxReturnResource.compute(...)` calls `TaxReturnComputeService.prepare(uid)`
3. if blocking flags exist and `overrideFlags=false`, compute is rejected with HTTP 409 and flags
4. otherwise `TaxReturnDataService.saveComputation(uid, computation)` persists the computed return

### Firestore location

`TaxReturnDataService` stores the computed return at:
- `users/{uid}/tax-returns/current`

Persisted fields include at least:
- `form1040`
- schedules and attachment outputs
- `flags`
- `updatedAt`
- `computedAt`
- `createdAt` when first created

That means the tax-return UI is not showing a purely in-memory object. The current computation is also written to the database.

### Read-back path

The tax-return read API is:
- `GET /api/tax-return`
- `TaxReturnResource.getLatest()`
- `TaxReturnDataService.getLatestComputation(uid)`

`TaxReturnDataService.getLatestComputation(uid)` reconstructs a `TaxReturnComputation` from the stored Firestore document.

## Tax Return UI Flow

### Shared tax-return state

`TaxReturnService` manages the computed return in the frontend.

Relevant behavior:
- `computeReturn(...)` posts to `/api/tax-return/compute`, stores the returned computation locally, stores flags, and clears `inputsChanged`
- `loadReturn()` performs `GET /api/tax-return` and stores the persisted computation locally
- `markInputsChanged()` is called whenever personal data is saved, which marks the tax-return view as stale until recomputed

### Where tax-return UI reads the persisted computation

On app startup, the shell calls `taxReturnService.loadReturn()`.

Then each tax-return preview component also calls `loadReturn()` in `ngOnInit()`, including:
- `form-tax-return-1040`
- schedule and attachment preview components

So the visible tax-return UI is rehydrated from the saved `users/{uid}/tax-returns/current` document, not only from the last in-page compute result.

### 1040 preview mapping

`form-tax-return-1040.component.ts` reads `this.taxReturnService.computation()?.form1040`.

Employment-related 1040 semantic mappings include:
- `line1a_wages_w2_box1 <- form.income.wages`
- `line1b_household_employee_wages <- form.income.householdEmployeeWages`
- `line1c_tip_income <- form.income.tipIncome`
- `line1g_wages_form8919_line6 <- form.income.uncollectedSocialSecurityMedicareWages`
- `line1i_nontaxable_combat_pay <- form.income.nontaxableCombatPayElection`
- `line1z_total_wages <- form.income.totalWages`

## Test Coverage

## Frontend unit coverage

Current frontend unit coverage for the split employment forms is light.

What exists:
- `all-components.spec.ts` includes both active split employment components in the compile/render smoke suite
- `personal-data.service.spec.ts` covers generic service persistence helpers, but not employment-specific behavior

What does **not** currently exist:
- no dedicated `form-employment-taxpayer.component.spec.ts`
- no dedicated `form-employment-spouse.component.spec.ts`
- no dedicated `tax-return.service.spec.ts` covering persisted return reload behavior

## Backend unit coverage

Explicit employment-related backend coverage exists in `TaxReturnComputeServiceTest`:
- missing W-2 flag when employment is indicated and no W-2 exists
- no missing-W-2 flag when a matching W-2 exists
- line 1b household employer wage aggregation from `householdEmployers[]`

General persistence/resource coverage exists, but is not employment-specific enough:
- `PersonalResourceTest` proves the personal form API validates/allowlists form ids generally, but has no focused employment-form test
- `TaxReturnDataServiceTest` only proves null-save no-op and missing-doc load behavior
- `Line10IncomeAdjustmentsApiTest` proves that `TaxReturnResource.compute(true)` calls `TaxReturnDataService.saveComputation(...)`

## E2E coverage

Direct employment-related browser coverage includes:
- `w2-required-employment.spec.ts`
  - UI warning appears
  - flags endpoint returns `MISSING_W2_EMPLOYMENT_INCOME_TAXPAYER`
  - compute is blocked
- `line1b-household.spec.ts`
  - household wages without W-2 flow to `form1040.income.householdEmployeeWages`
  - 1040 preview shows line 1b
- `line1i-combat-pay.spec.ts`
  - combat-pay downstream flow using W-2 code Q and spouse SSN routing
- `line1z-total-wages.spec.ts`
  - proves line 1z includes wages and other earned income but excludes line 1i combat pay election
- `line9-total-income.spec.ts`
  - proves total wages flow into line 9 downstream total income

There is also a page object:
- `e2e/tests/pages/personal-forms/employment-income.page.ts`

Indirect E2E coverage also exists because many downstream line tests seed `employment-income-taxpayer` via API before computing related returns.

## Key Findings

1. The live app uses split employment components (`employment-income-taxpayer` and `employment-income-spouse`), not the older combined employment component.
2. Employment forms are persisted twice on the backend today: `_bundle` plus legacy per-form documents.
3. Employment forms do **not** directly supply line 1a dollars. W-2 statements do.
4. Employment forms **do** directly supply line 1b household wages when no W-2 was received for household work.
5. `submittedW2` is primarily a UI workflow field. The backend does not read it when computing wages or missing-W-2 flags.
6. The tax-return UI loads persisted computed output from the database through `GET /api/tax-return`.
7. Saving employment answers marks tax-return data stale in the frontend, but does not update the saved tax return until compute is run.

## Current Gaps / Risks

1. There are no focused Angular unit specs for the split taxpayer/spouse employment components.
2. There is no dedicated backend persistence test proving employment-form saves write correctly to both the personal `_bundle` and legacy personal-form documents.
3. There is no focused automated test that refreshes the app and proves the already-computed employment-derived 1040 values reload from the persisted `tax-returns/current` document.
4. Some older seeded tests still use legacy-style employment payload keys in places; the active compute path mainly reads `hasEmploymentIncome` and `householdWork`, so those legacy seeds should be reviewed whenever employment logic changes.
5. The older combined `form-employment.component.ts` still exists and compiles, which can cause confusion during future refactors because it is not the live route.

## Practical Takeaway

When working on line 1a or any wage-related line, treat the system as two connected input streams:
- employment personal forms = interview answers, validation signals, household wage details
- W-2 statements = actual box-level wage amounts for line 1a and several downstream wage-related lines

The computed return is only authoritative after `/api/tax-return/compute`, because that is the point where the backend both builds `form1040` and persists it to `users/{uid}/tax-returns/current`.
