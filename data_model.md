# US Tax — Persistence Inventory (Discovery)

Generated 2026-05-25 from inspection of `C:\us-tax\us-tax-be\src\main\java\com\ustax\`.

> This is the **Step 1 (Discovery) output** for the Phase 2b schema design. It
> catalogs every place the backend reads or writes Firestore, every REST
> mutation endpoint, and every model class touched. Step 2 (Entity design) and
> beyond will refine this into a normalized SQL schema, with details for
> input-side forms in `data_model_inputs.md` and output-side forms in
> `data_model_outputs.md`.

## 1. Domain Map

The system persists seven primary data domains:

| Domain | Cardinality | Source | Storage path |
|---|---|---|---|
| Profile | one per user | user input | `profiles/{uid}` (global collection, NOT under `users/`) |
| Personal forms | ~50 form types per user | user input | `users/{uid}/personal/{formId}` + a `_bundle` aggregator |
| Dependents | many per user | user input | `users/{uid}/dependents/{auto-id}` |
| Statement entries | many per user per form-type | user input | `users/{uid}/{formId}/{auto-id}` where formId = `w-2`, `1099-int`, etc. |
| Tax return computation | one per user | computed output | `users/{uid}/tax-return/latest` (single document, 50+ nested forms) |
| User messages | many per user | server-pushed | `users/{uid}/messages/{messageId}` (read-only to user; created by support) |
| Support requests | global, many per user | user input | `supportRequests/{auto-id}` (global; uid denormalized) |

## 2. Persistence operations

| File | Lines | Collection Path | Document Pattern | DTO / shape |
|---|---|---|---|---|
| **PersonalDataService.java** | | | | |
| | 53 | `users/{uid}/personal` | `_bundle` (singleton) | `Map<String,Object>` (legacy aggregate) |
| | 109–117 | `users/{uid}/personal` | `{formId}` (per-form doc) | `Map<String,Object>` |
| | 133–140 | `users/{uid}/dependents` | `{auto-id}` | `DependentRecord` |
| | 142–156 | `users/{uid}/dependents` | `{auto-id}` (create) | `DependentInput` |
| | 158–174 | `users/{uid}/dependents` | `{depId}` (update) | `DependentInput` |
| | 187–192 | `users/{uid}/dependents` | `{depId}` (delete) | — |
| | 195–235 | `users/{uid}/dependents` | batch upsert | `DependentInput[]` |
| **StatementDataService.java** | | | | |
| | 31–42 | `users/{uid}/{formId}` | `{auto-id}` create | `Map<String,Object>` |
| | 44–56 | `users/{uid}/{formId}` | `{entryId}` update | `Map<String,Object>` |
| | 58–69 | `users/{uid}/{formId}` | `{entryId}` read | `Map<String,Object>` |
| | 110–113 | `users/{uid}/{formId}` | `{entryId}` delete | — |
| **TaxReturnDataService.java** | | | | |
| | 71–148 | `users/{uid}/tax-return` | `latest` (singleton) | `TaxReturnComputation` |
| | 150–156 | `users/{uid}/tax-return` | `latest` (read) | `TaxReturnComputation` |
| **ProfileService.java** | | | | |
| | 16–24 | `profiles` | `{uid}` (read) | `Profile` |
| | 26–31 | `profiles` | `{uid}` (upsert) | `Profile` |
| | 34–42 | `profiles` | query by phone | `Profile` |
| **UserMessageService.java** | | | | |
| | 33–46 | `users/{uid}/messages` | list | `UserMessage` |
| | 53–60 | `users/{uid}/messages` | `{messageId}` (delete) | — |
| **SupportService.java** | | | | |
| | 25–45 | `supportRequests` | `{auto-id}` (create) | `SupportRequest` |
| **UserDataService.java** | | | | |
| | (cascade) | all of the above | bulk delete | — |

## 3. REST mutation endpoints

| Resource | Method | Path | Request DTO | Write target |
|---|---|---|---|---|
| PersonalResource | PUT | `/api/personal/{formId}` | `Map<String,Object>` | `users/{uid}/personal/{formId}` |
| PersonalResource | POST | `/api/personal/dependents` | `DependentInput` | `users/{uid}/dependents/{auto-id}` |
| PersonalResource | PUT | `/api/personal/dependents/{dependentId}` | `DependentInput` | `users/{uid}/dependents/{dependentId}` |
| PersonalResource | DELETE | `/api/personal/dependents/{dependentId}` | — | dependent doc |
| PersonalResource | PUT | `/api/personal/dependents` | `DependentInput[]` | bulk upsert + delete |
| StatementResource | POST | `/api/statement/{formId}/entries` | `Map<String,Object>` | `users/{uid}/{formId}/{auto-id}` |
| StatementResource | PUT | `/api/statement/{formId}/entries/{entryId}` | `Map<String,Object>` | `users/{uid}/{formId}/{entryId}` |
| StatementResource | DELETE | `/api/statement/{formId}/entries/{entryId}` | — | entry doc |
| StatementResource | DELETE | `/api/statement/{formId}` | — | all entries of one form |
| TaxReturnResource | POST | `/api/tax-return/compute` | — | `users/{uid}/tax-return/latest` |
| ProfileResource | PUT | `/api/profile/me` | `Profile` | `profiles/{uid}` |
| UserMessageResource | DELETE | `/api/messages/{id}` | — | one message doc |
| UserDataResource | DELETE | `/api/user-data/reset` | — | cascade delete across all user collections |
| SupportResource | POST | `/api/support` | `CreateSupportRequest` | `supportRequests/{auto-id}` |
| DocumentExtractionResource | POST | `/api/statements/{formId}/extract` | multipart file | (temp; Azure DI processes) |

## 4. Model classes by domain

### 4.1 User-level typed models

**Profile** — persisted at `profiles/{uid}`

| Field | Java type | Constraints |
|---|---|---|
| uid | String | max 128 |
| firstName | String | @NotBlank, max 100 |
| lastName | String | @NotBlank, max 100 |
| email | String | @NotBlank, @Email, max 255 |
| phone | String | max 25 |
| addressLine1 | String | max 200 |
| addressLine2 | String | max 200 |
| city | String | max 100 |
| state | String | max 100 |
| postalCode | String | max 20 |

**DependentRecord** — persisted at `users/{uid}/dependents/{depId}`

| Field | Java type | Notes |
|---|---|---|
| id | String | Firestore auto-id |
| dependentFirstName | String | |
| dependentMiddleInitial | String | |
| dependentLastName | String | |
| dependentSSN | String | **plaintext, see risks** |
| dependentDateOfBirth | String | ISO date string |
| relationship | String | |
| qualifiesForCTC | Boolean | |
| qualifiesForODC | Boolean | |
| isFullTimeStudent | Boolean | |
| isPermanentlyAndTotallyDisabled | Boolean | |
| childLivedWithTaxpayer | Boolean | |
| monthsLivedWithTaxpayer | Integer | 0..12 |
| childLivedWithTaxpayerInUSA | Boolean | |
| childLivedWithOtherParent | Boolean | |
| isQualifyingChildOfAnotherTaxpayer | Boolean | |

**UserMessage** — persisted at `users/{uid}/messages/{messageId}`

| Field | Java type | Notes |
|---|---|---|
| id | String | max 128 |
| subject | String | max 200 |
| body | String | max 10_000 |
| createdAt | Long | epoch ms |

**SupportRequest** — persisted at `supportRequests/{auto-id}`

| Field | Java type | Notes |
|---|---|---|
| id | String | max 128, auto-id |
| uid | String | denormalized FK to user |
| subject | String | @NotBlank, max 200 |
| message | String | @NotBlank, max 5000 |
| userName | String | snapshot, max 200 |
| userPhone | String | snapshot, max 25 |
| userEmail | String | snapshot, max 255 |
| status | String | enum: `open`/`in_progress`/`resolved`, max 32 |
| createdAt | Long | epoch ms |

### 4.2 Personal form IDs (untyped `Map<String,Object>` at the backend)

Personal forms are stored as untyped maps in Firestore; the actual field
structure is defined by the Angular form components. The form IDs registered
in `PersonalResource.java` lines 35–100+:

`you`, `identification-taxpayer`, `identification-spouse`, `address-taxpayer`,
`spouse`, `filing-status`, `digital-assets`, `digital-assets-taxpayer`,
`digital-assets-spouse`, `standard-deductions-taxpayer`,
`standard-deductions-spouse`, `investment-interest-expense-deduction`,
`education-credits-taxpayer`, `education-credits-spouse`,
`energy-credit-taxpayer`, `energy-credit-spouse`,
`clean-car-credit-taxpayer`, `clean-car-credit-spouse`,
`alt-fuel-credit-taxpayer`, `alt-fuel-credit-spouse`,
`bond-credit-taxpayer`, `bond-credit-spouse`,
`electric-vehicle-credit-taxpayer`, `electric-vehicle-credit-spouse`,
`mortgage-interest-credit-taxpayer`, `mortgage-interest-credit-spouse`,
`carryforward-homebuyer-credit-taxpayer`,
`carryforward-homebuyer-credit-spouse`,
`prior-min-tax-credit-taxpayer`, `prior-min-tax-credit-spouse`,
`elderly-disabled-credit-taxpayer`, `elderly-disabled-credit-spouse`,
`extension-of-time-taxpayer`, `extension-of-time-spouse`,
`form4852-taxpayer`, `form4852-spouse`, `31-other-payments`,
`estimated-tax-payments-taxpayer`, `estimated-tax-payments-spouse`,
`qbi-deduction-taxpayer`, `qbi-deduction-spouse`,
`employment-income-taxpayer`, `employment-income-spouse`,
`employment-income`, `tip-income-taxpayer`, `tip-income-spouse`,
`medicaid-waiver-payments-taxpayer`, `medicaid-waiver-payments-spouse`,
`uncollected-ss-medicare-taxpayer`, `uncollected-ss-medicare-spouse`,
`combat-pay-taxpayer`, `combat-pay-spouse`,
`interest-income-taxpayer`, `interest-income-spouse`,
`dividend-income-taxpayer`, `dividend-income-spouse`,
`capital-gain-loss-taxpayer`, `capital-gain-loss-spouse`,
`capital-gain-loss-dependent`, `other-incomes-taxpayer`,
`other-incomes-spouse`, `kiddie-income-taxpayer`,
`kiddie-income-dependent`, `income-adjustments-taxpayer`,
`income-adjustments-spouse`.

**The Angular form components are the source of truth for field shape**; see
`data_model_inputs.md` (Step 2a output).

### 4.3 Statement form IDs (untyped Map at backend)

Registered in `StatementFormCatalog.java`. Each entry is `users/{uid}/{formId}/{auto-id}`.

- Employment & Compensation: `w-2`, `w-2g`, `1099-nec`, `1099-misc`, `1099-k`
- Health, Education & Family: `1095-a`, `1095-b`, `1095-c`, `1098-t`, `1098-e`, `1099-q`, `1099-qa`, `1099-ltc`, `1099-sa`
- Investment & Capital: `1099-int`, `1099-div`, `1099-oid`, `1099-b`, `1099-da`, `1099-cap`, `2439`, `3921`, `6781`, `child-interest-dividends` (Form 8814)
- Retirement & Benefits: `8606`, `1099-r`, `5498`, `rrb-1099`, `rrb-1099-r`, `ssa-1099`
- Property, Debt & Other: `1099-a`, `1099-c`, `1099-g`, `1099-s`, `4684`, `4797`, `6252`, `8824`
- Pass-Through & Estate: `schedule-k1-1041`, `schedule-k1-1065`, `schedule-k1-1120s`, `1099-ptr`

### 4.4 Computed output models (typed Java)

Persisted at `users/{uid}/tax-return/latest`. Top-level container:
**`TaxReturnComputation`**.

Core return:
- `Form1040` (Filer, FilingStatus, PresidentialElection, DigitalAssets, StandardDeductionIndicators, Address, Spouse, List<Dependent>, Income, Adjustments, Deductions, TaxAndCredits, Payments, Refund, AmountOwed, ThirdPartyDesignee, Signature)

Schedules:
- `ScheduleA`, `ScheduleB`, `ScheduleD`, `Schedule1`, `Schedule2`, `Schedule3`, `Schedule1A`, `Schedule8812`

Special forms (one per return or per filer):
- `Form6251` (AMT)
- `Form8606` (Nondeductible IRAs) — Taxpayer and Spouse variants
- `Form2441`, `Form8839`, `Form8919` (T+S), `Form4137` (T+S),
  `Form4972` (T+S), `Form5329`, `Form8949`, `Form8995`, `Form8995A`,
  `Form2555` (T+S), `Form8962`, `Form4952Output`, `List<Form1116>`,
  `Form8911`, `Form8936ScheduleA`, `Form5695` (lists), `Form8880`,
  `Form8801`, `Form8396`, `Form8834`, `Form8859`, `Form8863`, `Form8862`,
  `Form8959`, `Form8888`, `Form2210`, `Form4868`, `ScheduleR`

Attachment indicators (`RequiredAttachmentForm`):
- `form4797`, `form4684`, `scheduleE`, `form2106`, `form3903`,
  `form2439Capital`, `form6252Capital`, `form6781Capital`, `form8824Capital`,
  `scheduleK1Capital`, `form8997`, `form8853`, `form8889`

List-based forms inside `TaxReturnComputation`:
- `List<Form4852>` (T+S, substitutes for W-2/1099-R)
- `List<Form8814>` (child's interest & dividends)

Cross-cutting in `TaxReturnComputation`:
- `flags: List<TaxReturnFlag>` (blocking + non-blocking warnings)
- `createdAt`, `updatedAt`, `computedAt` (Firestore server timestamps)

See `data_model_outputs.md` (Step 2b output) for the full field-by-field
catalog of these classes.

## 5. Cross-cutting fields

| Field | Type | Domains | Notes |
|---|---|---|---|
| createdAt | Firestore server timestamp | Personal, Dependents, Statements, TaxReturn, Messages, Support | Set on first write |
| updatedAt | Firestore server timestamp | Personal, Dependents, Statements, TaxReturn, Support | Updated every write |
| computedAt | Firestore server timestamp | TaxReturn only | Set after compute |
| uid | String | Dependents, Messages, Support | FK to Profile (denormalized in global / sub-collections) |
| id | String | Dependents, Messages, Support | Document id (usually auto-id) |
| status | String | Support only | enum `open`/`in_progress`/`resolved` |

**Personal-form bundle pattern**: `users/{uid}/personal/_bundle` stores all
personal forms aggregated in a `data` Map for fast initial-load reads. Legacy
per-form docs `users/{uid}/personal/{formId}` are kept in parallel.

## 6. Open questions / risks (carry into Step 2)

1. **No schema enforcement on Personal forms or Statement entries.** The
   actual shape lives only in Angular components + business logic.
   Implication for migration: we cannot trust any single source — the
   Angular models give the typed view, but real Firestore data may contain
   legacy fields not in the current TS interface. Sanity-check by sampling
   real documents before finalizing each table.
2. **Tax return computation is a single Firestore document.** With 50+
   nested forms it can approach Firestore's 1 MB document limit on
   complex returns. SQL has no such limit; normalizing this into rows
   per form is part of Step 2.
3. **SSNs and other PII stored plaintext.** Encryption-at-rest / column-level
   protection should be designed in for the migrated schema, not added on
   later. Not blocking the schema work, but flag for sec review.
4. **Personal-form `_bundle` vs. per-form docs.** Decide whether the migrated
   schema models forms as columns of one big "personal data" table per user,
   or one table per form (the latter is cleaner and what we'll likely do).
5. **`Map<String,Object>` legacy persistence.** Statement entries' actual
   field set could vary across vintages. Sanity-check pass on real Firestore
   docs is required before declaring the schema "complete."
6. **Profile collection is global** (`profiles/{uid}`), not under
   `users/{uid}/profile`. Likely intentional for query-by-phone-number;
   schema-side just becomes a `users` table.
7. **`UserMessage`** has no create endpoint — only support tooling writes.
   Migration of existing messages is a separate concern from schema design.

## Step 2 cross-references

- `data_model_inputs.md` — Angular form field inventories (per-form tables).
- `data_model_outputs.md` — Java output model field inventories (per-class tables).
- These two files feed Step 3 (entity design) where we synthesize the SQL
  schema, indexes, FKs, and constraints.
