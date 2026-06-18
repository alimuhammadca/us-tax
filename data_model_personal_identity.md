# Personal Identity Forms — Field Inventory

Source-of-truth: Angular components in `C:\us-tax\us-tax-ui\src\app\forms\`. All forms use template-driven Angular forms (`ngModel`, NgForm), not reactive `FormGroup`. The TypeScript `interface <FormModel>` or the service-level `*Payload` interface is the canonical field shape. All forms persist via `PersonalDataService.saveForm(formId, payload)` → `PUT /api/personal/{formId}`. Firestore path is `users/{uid}/personal/{formId}`.

Notation:
- "Required" = true when the template has `required` attribute and/or save is gated on the field.
- "Validators" lists the Angular template attributes (`required`, `pattern=...`, `maxlength=...`) actually applied.
- `[key: string]: unknown` index signatures on service payloads allow legacy / forward-compat extra fields to be retained on save.

---

## you

Source: `form-you.component.ts`. Interface `Taxpayer`.

| Field | TS type | Required | Validators | Notes |
|---|---|---|---|---|
| firstName | string | yes | required | "First name and middle initial" — combined field |
| lastName | string | yes | required | |
| ssn | string | yes | required, pattern `([0-9]{3}-[0-9]{2}-[0-9]{4})\|([0-9]{9})` | 9 digits or dashed |
| dateOfBirth | string \| Date | yes | required | Normalized to `YYYY-MM-DD` string on save (`normalizeDate`); `isDobValid()` regex `^\d{4}-\d{2}-\d{2}$` |
| streetAddress | string | yes | required | Home address number and street |
| aptNumber | string? | no | — | Optional apartment |
| city | string | yes | required | |
| state | string | yes | required | Enum: US state/territory code from `states` list (54 entries: AL, AK, AZ, AR, CA, …, WY, AS, GU, MP, UM) |
| zipCode | string? | no | pattern `[0-9]{5}(-[0-9]{4})?` | ZIP or ZIP+4 |
| foreignCountry | string? | no | — | Enum: country name from `countries` list (~190 entries) |
| foreignProvince | string? | no | — | |
| postalCode | string? | no | — | Foreign postal code |

Cross-field rules: Cardinality is single (one record per uid). Component is the "Welcome / Your-info" combined screen. Coexists with `address-taxpayer` and `identification-taxpayer` (newer split forms); model fields here overlap with both.

Storage path: `users/{uid}/personal/you`

---

## identification-taxpayer

Source: `form-identification-taxpayer.component.ts`. Interface `TaxpayerIdentificationPayload` (in `personal-data.service.ts`).

| Field | TS type | Required | Validators | Notes |
|---|---|---|---|---|
| firstName | string? | yes | required | |
| middleInitial | string? | no | maxlength=1 | Single character |
| lastName | string? | yes | required | |
| ssn | string? | yes | required, pattern `([0-9]{3}-[0-9]{2}-[0-9]{4})\|([0-9]{9})` | SSN or ITIN; masked via password-type toggle |
| dateOfBirth | string? | yes | required | Free-text, placeholder `YYYY-MM-DD`; masked toggle |
| occupation | string? | yes | required | Free text |
| identityProtectionPin | string? | no | pattern `[0-9]{6}` | 6-digit IRS-issued IP PIN; masked toggle |
| [key: string]: unknown | — | — | — | Service payload allows arbitrary extra keys (forward compat) |

Cross-field rules: Cardinality single (one per uid). `fullPayload` preserves unknown server-side keys across save (merge: `{...fullPayload, ...model}`). Sensitive fields (`ssn`, `dateOfBirth`, `identityProtectionPin`) toggle between `password` and `text` input type via `showSensitive` map.

Storage path: `users/{uid}/personal/identification-taxpayer`

---

## identification-spouse

Source: `form-identification-spouse.component.ts`. Interface `SpouseIdentificationPayload` (in `personal-data.service.ts`).

| Field | TS type | Required | Validators | Notes |
|---|---|---|---|---|
| spouseFirstNamefirstName | string? | yes | required | Note: field name is literally `spouseFirstNamefirstName` (a known naming artifact preserved in code) |
| spouseMiddleInitial | string? | no | maxlength=1 | |
| spouseLastName | string? | yes | required | |
| spouseSsn | string? | yes | required, pattern `([0-9]{3}-[0-9]{2}-[0-9]{4})\|([0-9]{9})` | SSN or ITIN; masked toggle |
| spouseDateOfBirth | string? | yes | required | Free-text, `YYYY-MM-DD`; masked toggle (uses `type=date` when shown) |
| spouseOccupation | string? | yes | required | |
| spouseIdentityProtectionPin | string? | no | pattern `[0-9]{6}` | Masked toggle |
| [key: string]: unknown | — | — | — | Forward-compat extra keys retained on save |

Cross-field rules: Cardinality single. Same `fullPayload` merge pattern as taxpayer. Legacy data may live under a different formId; service `normalizeLegacySpouseIdentificationPayload` migrates.

Storage path: `users/{uid}/personal/identification-spouse`

---

## address-taxpayer

Source: `form-address-taxpayer.component.ts`. Interface `AddressFormModel` (component) ⟷ `TaxpayerAddressPayload` (service).

| Field | TS type | Required | Validators | Notes |
|---|---|---|---|---|
| isForeignAddress | boolean \| null | yes | (custom: must not be null at submit) | Radio: false=US / true=Foreign. Drives conditional sections via `*ngIf` |
| isMainHomeInUSA | boolean \| null | yes | (custom: must not be null at submit) | Radio Yes/No — "Did you live in the United States more than half of the tax year?" |
| streetAddress | string | conditional | (gated via `hasRequiredAddressFields`) | Required once `isForeignAddress` is chosen |
| apartmentNumber | string | no | — | |
| city | string | conditional | (gated) | Required for both US and foreign branches |
| state | string | conditional (US only) | (gated) | Enum: US state codes from `stateOptions` (51 entries: AL..WY + DC) — note: this list is plain strings, not `{label,value}` objects |
| zipCode | string | conditional (US only) | (gated) | No pattern enforced in this form |
| foreignCountry | string | conditional (foreign only) | (gated) | Plain text input here (not a select) |
| foreignProvinceStateCounty | string | conditional (foreign only) | (gated) | |
| foreignPostalCode | string | conditional (foreign only) | (gated) | |
| emailAddress | string | no | `type=email` (HTML) | |
| phoneNumber | string | no | — | Free text |
| [key: string]: unknown | — | — | — | Service payload allows extra keys |

Cross-field rules: When `isForeignAddress === false` the US branch (state, zipCode) is required; when `true` the foreign branch (foreignCountry, foreignProvinceStateCounty, foreignPostalCode) is required. Validation logic in `hasVisibleAddressFields()` and `hasRequiredAddressFields()`. Cardinality single.

Storage path: `users/{uid}/personal/address-taxpayer`

---

## spouse

Source: `form-spouse.component.ts`. Interface `SpouseModel`.

| Field | TS type | Required | Validators | Notes |
|---|---|---|---|---|
| firstName | string? | no | — | Optional unless any other spouse field has data |
| lastName | string? | no | — | |
| ssn | string? | no | (custom: `isSSNValid` regex `^(\d{3}-\d{2}-\d{4}\|\d{9})$` when non-empty) | Optional; validated only if entered |
| dateOfBirth | string \| Date? | conditional | required when any other spouse field has data (`isSpouseRequired`); `isDobValid` regex `^\d{4}-\d{2}-\d{2}$` | Normalized to `YYYY-MM-DD` on save |

Cross-field rules: Entire form is optional unless populated. `isSpouseRequired()` returns true if any of firstName/lastName/ssn/dateOfBirth has text. When required, DOB becomes mandatory. Cardinality single. This is the legacy/short form; coexists with the newer `identification-spouse`.

Storage path: `users/{uid}/personal/spouse`

---

## filing-status

Source: `form-filing-status.component.ts`. Interface `FilingStatusModel`.

| Field | TS type | Required | Validators | Notes |
|---|---|---|---|---|
| filingStatus | string? | yes | required (gated via `isValid()`) | Enum: `Single` \| `Married filing jointly MFJ` \| `Married filing separately MFS` \| `Head of household HOH` \| `Qualifying surviving spouse QSS` |
| spouseNameIfMFS | string? | no | — | Free text; applies when filingStatus = MFS |
| qualifyingChildNameIfHOHorQSS | string? | no | — | Free text; applies when filingStatus = HOH or QSS, and child is NOT a dependent |
| treatingNonresidentSpouseAsUSResident | boolean? | no | — | Checkbox election |
| nonresidentSpouseName | string? | no | (conditional render only) | Field only shown when `treatingNonresidentSpouseAsUSResident === true` |

Cross-field rules: Only `filingStatus` is hard-required for save. Cardinality single. Other fields are advisory and apply by filing-status context. No backend validation visible in component; consumed by downstream compute (`TaxReturnComputeService`).

Storage path: `users/{uid}/personal/filing-status`

---

## digital-assets (legacy / generic)

Source: `form-digital-assets.component.ts`. Interface `DigitalAssetsModel`. This is a reusable component whose `formId` is supplied via `@Input` — currently the SHELL wires it for **digital-assets-spouse** (and historically the unscoped legacy id `digital-assets`).

| Field | TS type | Required | Validators | Notes |
|---|---|---|---|---|
| hadDigitalAssetActivity | boolean \| null | yes | (custom: must not be null at submit) | Radio Yes/No |

Component @Input properties (configuration, not persisted):
- `formId: string` — default `'digital-assets-taxpayer'`; set to `'digital-assets-spouse'` for spouse tab
- `legacyFormId: string \| null` — default `'digital-assets'`; consulted on load if the new key is missing
- `person: 'taxpayer' \| 'spouse'` — switches question copy ("did you" vs "did your spouse")

Cross-field rules: Single boolean. Cardinality single per scope (taxpayer / spouse). Field name `hadDigitalAssetActivity` is the LEGACY storage key.

Storage path: `users/{uid}/personal/digital-assets` (legacy id; reads-only via this component) **and** `users/{uid}/personal/digital-assets-spouse` (active spouse id wired in shell).

---

## digital-assets-taxpayer

Source: `form-digital-assets-taxpayer.component.ts`. Interface `DigitalAssetsModel` (component-local). Legacy migration interface `LegacyDigitalAssetsModel`.

| Field | TS type | Required | Validators | Notes |
|---|---|---|---|---|
| digitalAssetsYes | boolean \| null | yes | (custom: save disabled while null) | Radio Yes/No — "At any time during 2025, did you receive, sell, exchange, or otherwise dispose of any digital asset (such as cryptocurrency or an NFT)?" |

Legacy fallbacks (read-only, never written): on load, if `digitalAssetsYes` is absent the component reads `hadDigitalAssetActivity` from this formId, then from legacy `digital-assets` formId. Saves always write `digitalAssetsYes`.

Cross-field rules: Single boolean, cardinality single.

Storage path: `users/{uid}/personal/digital-assets-taxpayer`

---

## digital-assets-spouse

No dedicated component file exists. The shell (`shell.component.ts:298`) renders the generic `<form-digital-assets>` component with:
- `formId="digital-assets-spouse"`
- `legacyFormId="digital-assets"`
- `person="spouse"`

Therefore the persisted field shape matches the generic `form-digital-assets` component (NOT the `-taxpayer` split file). Note this is an asymmetry: taxpayer side uses field name `digitalAssetsYes`; spouse side uses field name `hadDigitalAssetActivity`.

| Field | TS type | Required | Validators | Notes |
|---|---|---|---|---|
| hadDigitalAssetActivity | boolean \| null | yes | (custom: must not be null at submit) | Radio Yes/No — "At any time during the year, did your spouse receive, sell, exchange, or otherwise dispose of a digital asset…?" |

Cross-field rules: Single boolean, cardinality single. Field name differs from taxpayer-side counterpart — schema design should reconcile.

Storage path: `users/{uid}/personal/digital-assets-spouse`

---

## Schema-design notes (cross-form)

1. All eight forms are template-driven (no `FormGroup`/`FormArray` declarations). No nested groups or arrays — every form is a flat record.
2. Cardinality is **single** for every form (one row per uid per formId). No multi-row personal-identity tables.
3. Most service payloads include `[key: string]: unknown` — schema should either (a) pin to the explicit columns and discard unknowns, or (b) keep a JSONB overflow column for forward compat.
4. Overlap / duplication to resolve in SQL:
   - `you` overlaps `identification-taxpayer` (name, SSN, DOB) AND `address-taxpayer` (full address).
   - `spouse` (legacy) overlaps `identification-spouse` (name, SSN, DOB).
   - `digital-assets` (legacy generic) overlaps both `digital-assets-taxpayer` and `digital-assets-spouse`.
   - Digital-asset field name differs between taxpayer (`digitalAssetsYes`) and spouse (`hadDigitalAssetActivity`).
5. PII columns requiring encryption-at-rest / masking: `ssn`, `spouseSsn`, `dateOfBirth`, `spouseDateOfBirth`, `identityProtectionPin`, `spouseIdentityProtectionPin`.
6. Filing-status enum is a closed set of 5 string values — candidate for a CHECK constraint or lookup table.
7. US state codes appear in two forms with different shapes (`you` uses 54-entry object list including territories; `address-taxpayer` uses 51-entry string list with DC). Reconcile to a single lookup.
8. All date fields are stored as strings (normalized `YYYY-MM-DD`), not Date objects. SQL `DATE` column is appropriate; legacy data may contain Date instances or empty strings.
