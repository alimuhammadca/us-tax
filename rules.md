# Tax Rules Log (Form 1040 Lines 1a-1z)

---

## MFS Spouse-Forms Migration — Canonical Rules — Established 2026-06-23; ★ COMPLETE 2026-06-24 (#12–#50 all done)

The Spouse tab produces a standalone Married-Filing-Separately return per leg. The household's personal-forms map is reshaped by `MfsFormScoper.scope(allForms, returnKind)` before `prepare(uid)`: `mfs_head` drops `-spouse` keys; `mfs_spouse` renames `-spouse → -taxpayer` (spouse = filer) and forces filing status to MFS. The full queue + per-form protocol live in `C:\us-tax\mfs-spouse-migration.md`. Rules for adding/maintaining any per-leg form:

1. **Register in N places or it silently breaks.** A new `pf_X` / `se_X` parent table needs: the `V*.sql` `<include>` in `db.changelog-master.xml` (Liquibase does NOT auto-discover); both form IDs in `PersonalResource.PERSONAL_FORMS`; the table in `UserDataBulkDelete.PARENT_TABLES_UID_CASCADE`; and, if it gates a §17 blocker, the code in `NonOverrideableFlags.CODES`. Java unit tests bypass these — only e2e catches a forgotten registration.

2. **Choose the scoper shape by reading the COMPUTE, never an inventory verdict.** Decisive questions: (a) does the spouse form store `spouse<UpperCamel>` keys that are the exact inverse of what the compute reads from the filer slot? → **scoper-only `unPrefixSpouseKeys`** (no gate remap; nested child lists pass through by value). (b) does only the GATE/amount stem differ? → **a `normalizeXSpouse` helper** mapping the gate + each renamed key. (c) is the spouse form a thin joint supplement that LACKS a credit-determining input the compute requires? → **full per-person mirror** (#37/#42-follow-up/#44) or **drop the supplement** (#39) if the credit is reported on the head leg. (d) does the MFJ combine under a statutory LIMIT (QBI §199A threshold, §163(d), §904)? → it is a limit-gated INPUT merge that collapses to a single-person computation on a one-slot leg — verify the per-leg threshold is the MFS value, then scoper-only suffices.

3. **Full mirror needs NO migration when the columns already exist.** The `owner_role` two-row parent table carries the taxpayer's bare scalar columns on EVERY row; the spouse row leaves them null. To mirror: expand the mapper's spouse branch to write/load those bare columns under the spouse-prefixed payload keys, and (for child lists) parent the spouse's children by her own parent-row id. For a one-generic-component UI, add `private k(bareKey) { return person==='spouse' ? 'spouse'+Capitalize(bareKey) : bareKey }` (the exact inverse of `unPrefixSpouseKeys`) and route every key in `normalized()`/`loadModel()` through it; render the same template for both persons, keeping taxpayer-only UX (live estimates, import summaries) gated to `person==='taxpayer'`.

4. **MFS-disallowed credits: hard block vs partial handling.** Flat statutory bar with no exception AND no other required output → promote the advisory flag to blocking + add to `NonOverrideableFlags.CODES` + UI `isMfs` notice + hide (education credits #28, SLID #22; optimizer-safe because it calls `prepare()` directly). A statutory EXCEPTION (PTC #39 abuse/abandonment; EIC #44 §32(d)(2) lived-apart) OR a still-required non-credit output (PTC's APTC repayment) → DO NOT hard-block: disallow only the credit, emit a NON-blocking advisory flag (suppressed when the exception is claimed), and keep the form visible.

5. **Household-level rules need a cross-leg pass.** §63(c)(6)(A) (MFS spouses must use the same standard-vs-itemized method) can't be expressed per-leg under AUTO. Use a guarded recursive cross-leg compute (`TaxReturnComputeService.resolveSection63c6Election`, a `RESOLVING_*` ThreadLocal so inner leg computes use raw AUTO; the KiddieTaxParentReader pattern) that resolves the household-optimal method and stamps the same explicit election onto both legs. ★ Read the itemized total from `Deductions.getItemizedDeductionsFromScheduleA()` (always populated), NOT `TaxReturnComputation.scheduleA()` (null unless itemized is the chosen method).

6. **MFS statement-attribution leaks.** Statement amounts (W-2, 1099-*, 1095-A) are attributed by SSN; on a scoped leg the filer SSN flips to the spouse's. The missing-TIN catch-all (`belongsToPerson`) can leak the OTHER spouse's untagged statement onto a leg — exclude by `filing-status.mfsOtherSpouseSsn` before the catch-all, and ALWAYS seed BOTH spouses' statements WITH TINs in per-leg e2e tests.

7. **Every form ships with:** a `Phase7bComputeScopingTest` scoper case + a per-leg `mfs-spouse-*.spec.ts` e2e (MFS per-leg with exact IRS-pinned dollars + no cross-leak + an MFJ regression) + the existing line/form regression. Never assert `> 0`; pin hand-computed values.

8. **Owner_role-split playbook — converting a SINGLE-ROW household form (PK=uid) to per-filer two-row** (V87 Form 8862, V88 31-other-payments, V89 ctc-actc-screening; the closing pattern of the migration). A "return-level" form that gates or feeds a PER-FILER credit/payment is almost never safe to leave shared — passing it through unchanged either leaks the head's data onto the spouse leg (#48 Form 8862 recertification) or double-counts a household amount across both returns (#49 other-payments). Read the compute: if the fields differ per filer, split. The migration mirrors V82 childcare: add `owner_role VARCHAR(16) NOT NULL DEFAULT 'taxpayer'` + a `CHECK (owner_role IN ('taxpayer','spouse'))` + a surrogate `id BIGINT GENERATED ALWAYS AS IDENTITY`, drop the uid PK, add `PRIMARY KEY (id)` + `UNIQUE(uid, owner_role)`; for each child table drop the parent FK, add `parent_owner_role` + re-key its unique constraint and FK to `(parent_uid, parent_owner_role)`. Entity: surrogate `id` + `ownerRole`; children get `parentOwnerRole`. Mapper: role-agnostic (same bare columns both roles — the spouse form is the SAME component sending the SAME bare keys), find parent by `(uid, ownerRole)` and children by `(parentUid, parentOwnerRole)`, switch the multi-return override from `loadByTaxReturnId` to `loadByPersonId`. Existing data backfills to `'taxpayer'`, so the live taxpayer form is unchanged and NO data migration is needed.

9. **Scoper handling depends on whether the form id is BARE or SUFFIX-keyed.** If the filer slot is a BARE key (`form8862`, `31-other-payments`) and the spouse form is `X-spouse`, the generic `-spouse→-taxpayer` rename mis-targets — add an explicit scoper case: route `X-spouse → X` (the bare key the compute reads) and DROP the head's `X` on the spouse leg (#48/#49). If the form id ALREADY carries the `-taxpayer`/`-spouse` suffix (`ctc-actc-screening-taxpayer`, `estimated-tax-payments-taxpayer`), the generic rename already routes `X-spouse → X-taxpayer` and drops the head's `-taxpayer` — NO scoper case needed; just a Phase7b generic-rename lock-in test (#47/#50). Frontend either way: a person/formId `@Input()` on the one generic component + a `-spouse` host element on the spouse tab (the shell `getApplicationItemsForSelection` filter shows `-spouse` ids on the spouse tab; bare keys are not handled by that filter, so name the spouse form `X-spouse`).

10. **A new Liquibase migration needs a FULL backend restart in dev** — Quarkus dev-mode live-reload rebuilds the Hibernate SessionFactory WITHOUT re-running Liquibase, so a schema change dies with `Schema-validation: missing column` and every e2e fails at `clearUserData` (health 500 "Error restarting Quarkus"). Kill `quarkus:dev` (`taskkill /PID <cmd.exe pid> /T /F`), relaunch `run-dev.ps1`, poll `/q/health` until 200 (a fresh Dev Services Postgres runs all migrations from scratch, ~30s). Pure code/scoper/mapper/frontend changes live-reload fine — only schema migrations need the restart.

---

## SQL Migration Guardrails (Firestore→Azure SQL Cutover) — Established 2026-05-28

Guardrails that emerged from triaging the e2e regressions after the Firestore→SQL cutover. Apply to all SQL-backed mappers, entities, and Liquibase changesets.

1. **Do not FK a filing-status (or any human-label) column to `ref_filing_status`.** `ref_filing_status.code` is the canonical code set `{S, MFJ, MFS, HOH, QSS}` (NVARCHAR(8)). But several intake forms and compute outputs store the human-readable *label* ("Single", "Married filing jointly") or a form-local vocabulary ("married-filing-jointly") — and compute's Form 8801 exemption logic even matches on the label string. Columns that store labels must be plain `NVARCHAR(32)` with no FK. Tables corrected: `pf_filing_status` (V13), `pf_kiddie_income` (V24), `pf_prior_min_tax_credit` + `out_form_8801` (V28). The FK only ever "passed" because the column was left null; once the mapper populated it, every save 500'd on the FK violation — which surfaces in e2e as a save *timeout* (the helper waits for HTTP 200, which never comes).

2. **`dependent_id` FKs are `ON DELETE NO ACTION` and delete-order-sensitive.** SQL Server rejects `ON DELETE CASCADE` on the `dependent_id` FKs because `app_user` already cascades to both `dependent` and the referencing tables (multiple cascade paths). So `pf_kiddie_income`, `pf_capital_gain_loss`, `se_child_interest_dividends`, and `out_form_8814` carry `dependent_id → dependent(id) ON DELETE NO ACTION`. Any code that deletes a `dependent` row MUST delete the referencing rows first: `UserDataBulkDelete` lists `dependent` LAST; `DependentService.deleteDependent` clears the dependent's `pf_kiddie_income` rows first. Only `pf_kiddie_income` actually populates `dependent_id` today (the other three leave it null).

3. **Typed SQL mappers silently drop unmapped fields.** Unlike the schemaless Firestore store, a Hibernate-backed mapper only round-trips the fields it explicitly maps. The recurring cutover bug class: compute reads a key the form sends, but the mapper never persisted/emitted it → the value silently became null. The source of truth for a mapper's field set is the live Angular component + the compute reads, **not** the (possibly-stale) YAML.

4. **`selectPersonTab` must not hard-wait on the "Family Head" label.** The taxpayer person tab is relabeled from "Family Head" to the taxpayer's first name asynchronously (`OwnerNamesService` load after a reload). A helper that locates the tab by `hasText('Family Head')` and clicks it can match at `count()` time and then hang on `click()` after the relabel detaches the match. `e2e/tests/helpers/person-tabs.ts` now bounds the direct click and falls through to the first-person-tab fallback (the first tab is always the taxpayer).

Note: the phone-existence gate rule below is now SQL-backed post-cutover — `ProfileService.existsByPhone` runs `ProfileEntity.count("phone = ?1")`, not the Firestore `whereEqualTo` query originally described.

---

## User Responsibility for Input Accuracy — Established 2026-05-17

The application **is not responsible** for the correctness of taxpayer-provided input. Audits that flag a field as "the user must remember to check it" or "the user might miss this checkbox" should **not** be treated as application defects.

The product design assumes:

- The taxpayer uploads the source statement (Form W-2, Form 1099-INT, Form 1099-R, Form 1099-DIV, Form SSA-1099, Form W-2G, Schedule K-1, and similar IRS information returns) as a PDF, image, or scan.
- An AI extraction step captures the field values from the uploaded statement into the application's data model.
- The application then presents the captured values back to the taxpayer on the corresponding statement-entry form (for example, the `form-w-2` Angular component used for both manual entry and post-extraction verification) and asks the taxpayer to **review, correct, and save**.
- The taxpayer is the final authority on what the values should be. The taxpayer reviews every field — including non-required checkboxes such as Box 13 Statutory employee, Box 13 Retirement plan, Box 13 Third-party sick pay, and any other defaults — and is responsible for correcting any field the AI extractor missed or misread.

Consequences for audit framing:

- A concern of the form *"field X is a checkbox that defaults to false / not required; a user could miss it"* is **not a finding** against the application. It is a routine consequence of the upload-then-verify workflow. The remedy is taxpayer attention during the verify step, not a code change.
- Audits should reserve "MEDIUM / HIGH severity" gradings for cases where the application **silently transforms** correct user input into an incorrect computation (for example, double-counting an amount that was entered once, applying the wrong tax-year constant, or dropping a value during aggregation). Cases where the user simply did not enter or did not check something do **not** qualify as application defects.
- Audit observations about non-required input fields may still be recorded as informational ("the user must verify this field during review"), but they should **not** be promoted to severity-rated concerns and they should **not** generate `outstanding.md` entries unless a separate, application-side defect is also present.

This rule applies to all current and future Form 1040 line audits in `XLS/computations/N.md` and to the corresponding `lines/N.md` specs. It supersedes any earlier audit wording that suggested the application bears responsibility for the user's choice to leave an input field unchecked or blank.

**Cross-references:** `XLS/computations/1a.md` §3.3 (the example case that prompted this rule — the `statutoryEmployee` W-2 checkbox).

---

## Canonical `null` vs `BigDecimal.ZERO` Semantic — Established 2026-05-10

**Authoritative reference:** `knowledge/canonical-null-zero-semantic.md`

**Summary rule:** All `compute*` helper methods in `TaxReturnComputeService.java` returning a `BigDecimal` must distinguish:

- **`null`** = "this concept does not apply / no input was provided" → PDF cell renders **blank**
- **`BigDecimal.ZERO`** = "this concept applies, the input was provided, the computed value is zero" → PDF cell renders **"0"**

Returning `BigDecimal.ZERO` when "I have no value" is an anti-pattern that pollutes `addNonNull` aggregations and downstream `if (x != null)` branching. Returning `BigDecimal.ZERO` is acceptable only when a spec mandates it (cite the spec in the method comment).

**Established during the wage-block audits** (lines 1a–1z, closed 2026-05-05 through 2026-05-10) after the line 1e `computeDependentCareBenefits` outlier was discovered to be blocking line 1z's null-propagation contract (`1z.xlsx` Code Validation #1 / #9). The line 1e fix was applied 2026-05-10; cross-line audit folded into each remaining Form 1040 line audit (see `outstanding.md`).

---

## Authentication — Phone Sign-In/Sign-Up Profile Existence Gate — Documented 2026-04-28

After the migration to Firebase phone-OTP authentication, both sign-in and sign-up must check the `profiles` Firestore collection **before** sending an SMS code. This is enforced via a public, unauthenticated endpoint:

- **Endpoint**: `GET /profiles/exists?phone=+E164` → `{ "exists": true|false }`. Annotated `@PermitAll` to override the class-level `@Authenticated` on `ProfileResource`. Validates E.164 format server-side (must start with `+`, length 8–25). Returns only a boolean to prevent profile enumeration.
- **Lookup**: `ProfileService.existsByPhone(phone)` runs a Firestore `whereEqualTo("phone", ?).limit(1)` query against the `profiles` collection. The match is exact, so frontend and backend must agree on E.164 normalization. Both sign-in and sign-up components use the same `normalizePhone()` helper.
- **Sign-in rule**: If `exists == false`, sign-in is blocked with the message *"No account found for this phone number. Please create an account first."* No reCAPTCHA, no `signInWithPhoneNumber`, no SMS, no Firebase Auth user creation.
- **Sign-up rule**: If `exists == true`, sign-up is blocked with the message *"An account with this phone number already exists. Please sign in instead."* This prevents the prior overwrite-on-merge of an existing profile and stops two distinct sign-up attempts racing onto one phone.
- **Why the check must precede OTP**: Firebase `signInWithPhoneNumber` creates a brand-new auth user on any successful OTP confirmation, with no link to our `profiles` collection. Without this gate, a stranger could "sign in" with any phone they own and end up in the app as a fresh authenticated user with no profile record.
- **Why `profiles` is the source of truth (not Firebase Auth)**: We control the profile lifecycle independently of the auth user. Deleting a profile deactivates the account even if the Firebase Auth uid persists. Backfilling a profile re-activates an existing auth user without re-registration.
- **Trade-off — phone enumeration**: The endpoint allows anyone to check whether a given phone is registered. Accepted because (a) the response is a single boolean with no profile fields, (b) checking before SMS is a hard requirement to prevent stranger sign-ins. If enumeration becomes a concern, reCAPTCHA-gate the lookup, IP rate-limit it, or move the check post-OTP (sign out + delete the orphan auth user when no profile exists).
- **Migration note**: Firebase Auth users created via the previous phone flow without a `profiles/{uid}` document are blocked at sign-in until they re-register or have a profile backfilled.

---

## Project Folder Conventions — Documented 2026-04-07

Two new top-level folders have been added to `C:\us-tax\`:

### `C:\us-tax\dependencies\`

Stores dependency documents for every output value that appears on the tax return (form lines, schedule fields, intermediate values like AGI, and blocking flags). One `.md` file per output group (e.g., `1a.md`, `agi.md`, `schedule-d.md`).

**Purpose:** Before computing any line, check its dependency document to verify all required inputs are present in statements or personal-form data. These documents are the authoritative source for "what do I need before I can compute X?" and are used to produce friendly "missing data" messages when a compute attempt fails.

**Document structure:** Each file lists the output field(s) produced, the always-required inputs, the conditionally-required inputs (with the condition that triggers them), the Firestore source for each input, and what the backend emits (null, 0, or a blocking flag) when the input is absent.

### `C:\us-tax\flowcharts\`

Stores computation flowcharts in draw.io XML format (`.drawio`), one per line or logical group (e.g., `1a.drawio`, `agi.drawio`). These are decision-tree-style flowcharts showing the exact algorithm used to compute each return value, including all branching conditions.

**Purpose:** Human-readable algorithm reference for implementing new lines, reviewing existing compute logic, and onboarding. These complement the line spec docs in `C:\us-tax\lines\` (which are IRS-authoritative) and the architecture diagrams in `C:\us-tax\diagrams\` (which show data flow).

**Naming:** Use the same prefix as the line spec — `1a.drawio`, `2ab.drawio`, `16.drawio`, etc. For intermediate values, use a descriptive name — `agi.drawio`, `standard-deduction.drawio`.

---

This file consolidates the business rules implemented for Form 1040 wages lines 1a-1z and supporting forms.

---

## Line 1a W-2 Carve-Out Rules — Documented 2026-04-07

These rules govern the routing of W-2 box 1 amounts away from Form 1040 line 1a to Schedule 1.

- **W-2 box 11 (nonqualifiedPlansAmount) is already included in box 1** per IRS W-2 instructions. The backend must subtract box 11 from box 1 when computing line 1a and route the box 11 amount to Schedule 1 line 8t. Never count it in both line 1a and line 8t.
- **Inmate wages** (wages earned while incarcerated in a penal institution) are captured via the `inmateWagesAmount` field on the W-2 statement entry. The backend must subtract this amount from box 1 for line 1a and include it in Schedule 1 line 8u.
- **Statutory-employee W-2s** (box 13 `statutoryEmployee == true`) must be excluded entirely from line 1a. Each such W-2 raises a blocking flag `STATUTORY_EMPLOYEE_W2_OUT_OF_SCOPE`. Schedule C is out of scope; the user must resolve this before filing.
- **No double-counting**: The `computeLine1aWages()` method performs carve-outs; the separate `sumW2Wages()` method (used by `computeSocialSecurity()` and `computeForm2441()`) must continue to use the unadjusted box 1 total — do not change those callers.
- **Schedule 1 8t/8u are aggregated**, not replaced: the W-2-sourced amounts are merged with any Other incomes personal-form amounts (for non-W-2 sources of those line types). The `computeOtherIncomes()` method is the single point of aggregation.
- **Carve-out data belongs on the W-2 entity** (TurboTax entity-centric principle), not in the global Other incomes form. The Other incomes form retains its 8t/8u fields only for rare non-W-2 sources of those income types.
- `subtractNonNegative()` must be used for all carve-out subtractions to prevent line 1a from going negative when carve-out amounts exceed box 1.

---

## Statement PDF Overlay Rules — Documented 2026-04-03

These rules apply to the image-overlay PDF view implemented on W-2 and to be applied to all subsequent statements.

### Architecture
- The PDF view displays the rasterized IRS form image as a background and overlays absolutely-positioned `<input>` and `<textarea>` elements at exact field coordinates.
- All coordinates are derived from the statement's `*_field_map_semantic.csv` in `us-tax-ui/public/irs/` using the formula:
  ```
  left   = llx / 612 * 100 %
  top    = (792 − ury) / 792 * 100 %
  width  = (urx − llx) / 612 * 100 %
  height = (ury − lly) / 792 * 100 %
  ```
- **Always recompute coordinates directly from the CSV.** Do not rely on pre-computed values in plan documents — they routinely contain errors. W-2 (box 13, 14, state rows) and 1099-MISC (boxes 1-12, state rows, clip ratio) all had wrong values in plan documents.
- Use a two-div structure to clip whitespace without breaking coordinate percentages:
  - Outer `pdf-clip-container`: `overflow:hidden` + `aspect-ratio` to hide blank page area below the form.
  - Inner `pdf-overlay-container`: `position:relative`, sized by the image. All field percentages are relative to this container's full height.
- **Verify actual PNG dimensions before writing any coordinates or the clip ratio.** Images are NOT all the same size. W-2 is 1275×1650 px; 1099-MISC is 816×1056 px. The clip `aspect-ratio` must use the real image width: `actual_image_width / desired_visible_px_height`. Using the wrong width (e.g., 1275 for a 816-wide image) makes the entire overlay display incorrectly.
- The coordinate formula is scale-invariant: because `left% = llx/612` and the image is a uniform scale of the 612pt PDF page, the percentages are correct regardless of the image's actual pixel dimensions.

### Field mapping
- **Direct fields** (identity/text boxes): bind `[(ngModel)]` directly to `pdfRaw['key']`, then copy in/out of the model string field.
- **Combined fields** (monetary): the PDF field holds `amount [notes]` as a single string. Use `formatAmountAndNotes` when switching to PDF view and `parseAmountAndNotes` when switching back. Notes is null/absent in the vast majority of real-world statements — never require it.
- **Box 14 / multi-entry combined fields**: each line is `LABEL AMOUNT [notes]`. Parse with a dedicated inline parser — do NOT use `parseAmountAndNotes` for these lines because that function treats everything-except-the-number as notes (which incorrectly includes the label). Instead: text before the number = label, number = amount, text after = notes.
- **Checkboxes**: bind `[(ngModel)]` directly to the model boolean. No `pdfRaw` entry needed.

### syncFormToPdf / syncPdfToForm
- `syncFormToPdf()` is called when the user switches TO PDF view (in the `pdfView` setter).
- `syncPdfToForm()` is called inside `onSubmit()` when `_pdfView` is true, before the `StatementFormDirective` saves.
- Both methods must be kept in sync with any future model field additions.
- **The `pdfView` setter must set `_pdfView = val` FIRST, then call `syncFormToPdf()`.** If the sync throws before `_pdfView` is updated, the `*ngIf="pdfView"` condition is never satisfied and the PDF view silently fails to appear. Setting `_pdfView` first ensures the view toggles even if the sync partially fails.
- **`formatAmountAndNotes(undefined, ...)` throws.** The function checks `amount !== null`, but `undefined !== null` is `true`, causing `.toFixed()` to crash on `undefined`. When reading from a sparse object fallback (e.g., `stateLocalInfo[1] ?? {}`), the missing fields are `undefined`, not `null`. Always supply a fully-typed empty row with explicit `null` amount fields: `{ stateTaxWithheldAmount: null, ... }`.

### Checkboxes in PDF overlay
- Do **not** use `[(ngModel)]` on a checkbox inside the PDF overlay — `ngModel` on a checkbox expects a boolean, but `pdfRaw` stores strings.
- Use the explicit pattern instead:
  ```html
  <input type="checkbox" class="pdf-checkbox"
    [checked]="!!pdfRaw['key']"
    (change)="pdfRaw['key'] = $any($event.target).checked ? 'X' : ''" />
  ```
- In `syncFormToPdf()` store `'X'` for checked, `''` for unchecked. In `syncPdfToForm()` read back with `!!r['key']`.

### Retired / reserved fields
- W-2 Box 9 ("Advance EIC payment") was removed from the W-2 in 2011. The semantic CSV still contains a field entry for it but no input should be rendered over it in the PDF view.
- For any statement, if a CSV field is marked as reserved or is a known retired box, skip it — do not render an input.

### Field discoverability
- All `.pdf-field` inputs have a subtle blue-tinted background (`rgba(220,235,255,0.15)`) so users can see where fields are on the form image. Hover brightens the tint; focus applies a yellow highlight with a blue outline.

### Rollout order
Work one statement at a time; do not proceed to the next until the user approves the current one. Current order: W-2 (done) → 1099-MISC (done) → W-2G → 1099-INT → 1099-DIV → 1099-R → 1099-B → 1099-NEC → 1099-G → 1099-K → 1099-OID → SSA-1099 → RRB-1099 → RRB-1099-R → Schedule K-1 (1065/1120-S/1041). Field mapping documents are saved to `C:\us-tax\mappings\`.

### Per-statement implementation checklist
Before starting any new statement overlay:
1. Locate the rasterized PNG for the correct copy (e.g., Copy B) in `C:\us-tax\images\`.
2. Check the **actual pixel dimensions** of the PNG (not assumed).
3. Identify the correct page index in the semantic CSV (`pages_0_indexed` column).
4. Compute all field coordinates fresh from the CSV — do not copy from a planning document.
5. Set `aspect-ratio: <image_width> / <clip_height>` using the real image width and a clip height that shows all form content with ~120px of padding below the last field.
6. Store the verified coordinates in a mapping file under `C:\us-tax\mappings\` before implementing the component.

---

## Sidebar Navigation Rules - Documented 2026-04-02

- Shared Playwright sidebar helpers must match section titles from `.sidebar-section-title`, not from arbitrary descendant text inside the whole section.
- This is required because statement sidebar labels can now contain words like `Interest Income`, `Dividends`, or other phrases that also appear as names of non-statement forms in other sidebar sections.
- Prefer direct section-title reads over locator `filter({ has: ... })` chains for sidebar section selection when the live DOM proves flaky; the imperative title match is the stable fallback contract for this app shell.
- Shared Playwright helpers that open a form by `data-form-id` should scope those lookups to `.app-sidebar` so they do not collide with non-sidebar elements such as picker cards that reuse the same `data-form-id`.

---

## Statement Semantic Asset Rules - Documented 2026-04-02

- Use `C:\us-tax\us-tax-be\scripts\generate-and-publish-statement-semantic-assets.js` as the canonical workflow for active statement semantic assets.
- Statement semantic assets should be canonical in `C:\us-tax\pdfs` and, when the statement is active in the UI picker/sidebar, published to `C:\us-tax\us-tax-ui\public\irs`.
- When the user asks for visual page renders of statement semantic PDFs, rasterize the canonical PDFs from `C:\us-tax\pdfs` into `C:\us-tax\images\<pdf_base_name>\` as per-page PNG files rather than mixing all pages into one flat directory.
- For statement assets, prefer existing canonical pairs already in `C:\us-tax\pdfs`; if they do not exist there but a user-authored semantic pair exists in `C:\us-tax\docs\IRS-Forms`, copy that pair instead of regenerating it.
- Only generate a new statement semantic pair from the raw IRS PDF when no semantic pair already exists in either `C:\us-tax\pdfs` or `C:\us-tax\docs\IRS-Forms`.
- The generator may accept alternate raw source filenames when the user drops a statement PDF under a non-canonical name in `C:\us-tax\docs\IRS-Forms`, but the emitted semantic asset base names must remain canonical.
- `ssa-1099` currently resolves from raw source `1099ssa.pdf` but still emits canonical assets `fssa1099_semantic_labels.pdf` and `fssa1099_field_map_semantic.csv`.
- The only remaining missing active-statement source PDFs in `C:\us-tax\docs\IRS-Forms` are `rrb-1099` and `rrb-1099-r`. Do not invent substitute source files for those forms; report the gap and wait for the real source PDFs.
- The UI statement id `1099-e` corresponds to the actual IRS form `Form 1098-E`, so its semantic asset base name should remain `f1098e`, not `f1099e`.

---

## Statement Picker Catalog Rules - Documented 2026-04-02

- The active statement picker must show both the form code/number and a readable statement title for each selectable form.
- Selected statement labels in the sidebar and statement-entry toolbar should use the richer `code - title` label so users can identify statements without opening them.
- Statement picker options should be grouped into typed sections rather than shown as one flat checkbox list.
- The active picker catalog must include `child-interest-dividends` as `Form 8814 - Child's Interest and Dividends`; frontend and backend statement catalogs should stay aligned on that form id.
- Playwright helpers that select statement forms should target stable picker selectors such as `data-form-id` rather than exact visible text, because the visible label now includes both a code and a title.
- Selecting a statement from `Select form` is allowed to navigate away from the picker into the selected statement form immediately; page objects/tests should verify persisted selection state or sidebar presence rather than assuming the picker checkbox remains in the DOM.
- Backend statement validation and audit logging should use the same readable form catalog metadata used by the picker, so statement CRUD traces include a human-readable `formLabel` as well as the raw `formId`.

---

## Filing-Status MFS/HOH Checkbox Rules - Documented 2026-04-01

- The canonical filing-status companion boolean for the Form 1040 MFS/HOH lived-apart or legally-separated checkbox is `mfsOrHohLivedApartOrLegallySeparated`.
- Active filing-status UI must show that question only when `filingStatus` is `Married filing separately` or `Head of household`.
- Active filing-status UI should render that question as an accessible Yes/No radio group, not as a dropdown/select control.
- For Playwright stability, prefer native accessible radio inputs for that question over component wrappers that hide or virtualize the actual radio node.
- Do not bind the long question prompt to the `Yes` radio with a `for` attribute; keep it as the group label only, or the radio's accessible name stops being simply `Yes` and breaks exact-name E2E selectors.
- The UI must treat the field as nullable when hidden so `No` remains distinct from unanswered, and it must clear the saved value when the selected filing status changes to a path that hides the question.
- Backend `buildFilingStatus(...)` must map the boolean only for MFS/HOH returns and leave it null for other filing statuses.
- Form 1040 preview/PDF mapping must drive semantic checkbox `mfs_spouse_itemized_or_hoh_qss_child_not_dependent` from `form1040.filingStatus.mfsOrHohLivedApartOrLegallySeparated`.
- The `hohQualifyingPersonName` input label in the active filing-status UI should match the Form 1040 wording: `If you checked the HOH or QSS box, enter the child's name if the qualifying person is a child but not your dependent`.

---
## Taxpayer Header Split-Form Compatibility Rules — Documented 2026-03-31

- Canonical taxpayer header ownership is split across `identification-taxpayer` and `address-taxpayer`. Legacy `you` remains compatibility-only and is not the preferred write target for the active taxpayer Personal flow.
- Shared taxpayer-header readers in both backend and frontend must resolve taxpayer values by preferring the split forms first and falling back to legacy `you` only when split data is absent.
- Canonical taxpayer address YAML keys map back to legacy compute names as follows: `apartmentNumber` -> `aptNumber`, `foreignProvinceStateCounty` -> `foreignProvince`, and `foreignPostalCode` -> `postalCode`.
- Canonical taxpayer booleans are `digitalAssetsYes` and `presidentialElectionFundTaxpayer`. Legacy aliases `hadDigitalAssetActivity` and `youFundElection` may be read for compatibility, but new saves should use the canonical keys.
- Canonical filing-status payload keys are `filingStatus`, `mfsSpouseName`, `mfsSpouseSSN`, and `hohQualifyingPersonName`. Legacy alias keys may still be read during migration, but new saves should write only canonical keys.
- Frontend flows that need taxpayer SSN, DOB, or address should use a shared taxpayer-header resolver/helper rather than raw `getForm('you')` reads.

---
## Spouse Identification Split-Form Compatibility Rules — Documented 2026-04-01

- Canonical spouse identification ownership is `identification-spouse`. Legacy `spouse` remains compatibility-only and is not the preferred write target for the active spouse Personal flow.
- Shared spouse-identification readers in both backend and frontend must resolve spouse values by preferring `identification-spouse` first and falling back to legacy `spouse` only when split data is absent.
- The authored YAML key `spouseFirstNamefirstName` is intentionally awkward but canonical at the UI/API layer. Do not rename it in the YAML or active save payloads; normalize it to canonical compute/output `firstName` only inside compatibility resolvers.
- Active spouse identification UI must render and save `spouseOccupation` and `spouseIdentityProtectionPin`, and must mask `spouseSsn`, `spouseDateOfBirth`, and `spouseIdentityProtectionPin` by default once values exist.
- The spouse Personal tab should open `Identification`, not legacy `Spouse`, and its label should resolve from the split spouse identification first-name field.
- Form 1040 spouse/signature output must come from the resolved spouse identification payload: spouse identity fields map into `form1040.spouse`, `spouseOccupation` maps to `form1040.signature.spouseOccupation`, and `spouseIdentityProtectionPin` maps to `form1040.signature.spouseIpPin`.

---
## Taxpayer Address Contact Rules — Documented 2026-03-31

- `emailAddress` and `phoneNumber` are part of the canonical `address-taxpayer` YAML contract. Do not drop them from the active taxpayer Address UI when aligning the split taxpayer header flow.
- Frontend taxpayer-address helpers must load and save `emailAddress` and `phoneNumber` alongside the mailing-address fields so the split taxpayer header remains round-trippable.
- Backend taxpayer-header resolution must carry `address-taxpayer.emailAddress` and `address-taxpayer.phoneNumber` into the resolved taxpayer header map.
- On Form 1040 output, taxpayer `emailAddress` maps to `form1040.signature.email` and taxpayer `phoneNumber` maps to `form1040.signature.phoneNumber`.

---
## Lines 33–38 Reference Rules — Documented 2026-03-29

- **Line 33 = 25d + 26 + 32**: Pure arithmetic sum. Never recompute withholding, estimated tax, or refundable credits inside the line 33 block — all upstream values must be finalised first. Stored as null when the sum is zero.
- **Line 34 (overpaid) = line 33 − line 24**: Created only when `line33 > totalTax`. The `Refund` object is not constructed when the taxpayer owes money.
- **Line 35a (refund amount) formula — current simplified state**: `refundAmount = overpaid`. This is a known simplification. The correct formula is `overpaid − line36`. Will be fixed when line 36 is implemented; tracked in `line33-implementation-plan.md`.
- **Line 35b/c/d (direct deposit) — Form 8888 mutual exclusion**: Lines 35b/c/d on Form 1040 apply to single-account direct deposit. If the taxpayer is using Form 8888 (split refund to 2–3 accounts), the IRS ignores lines 35b/c/d. Backend implementation must guard: populate `Refund.routingNumber` etc. **only when `form8888` is null**.
- **Line 36 (apply to next year)**: Capped at line 34 (cannot exceed the overpayment). `Refund.amountAppliedToNextYear` field exists; never populated until line 36 is implemented.
- **Line 37 (amount owed) = line 24 − line 33**: Created only when `totalTax > line33`. Mutually exclusive with `Refund` (line 34) — only one branch fires per return. When `line33 == line24`, neither is created (exact break-even).
- **Line 38 (estimated tax penalty)**: Set by `computeForm2210()` when `totalPenalty > 0` and method ≠ `WAIVED`. Wired to `AmountOwed.estimatedTaxPenalty` and added to `AmountOwed.amountOwed`. Runs after `computeLine31ThroughLine38()` so that `amountOwed` is already set before the penalty is added.

---

## Targeted Taxpayer E2E Selector Rules — Documented 2026-03-31

- For taxpayer-side Yes/No radio groups rendered from Angular templates with `[value]` bindings, Playwright specs should select by accessible radio label within the visible group container, not by CSS selectors like `input[name="..."][value="true"]`. The group id plus role/label text is the stable contract.
- When a spec is not testing the filing-status UI itself, prefer `setFilingStatusApi()` with canonical labels such as `Married filing jointly` or `Married filing separately` before falling back to UI selection.
- Do not use stale suffix labels like `Married filing jointly MFJ` or `Married filing separately MFS` against the current taxpayer filing-status component unless the UI explicitly renders those exact labels.
- For native date inputs in Playwright, do not rely on synthetic `locator.focus()` plus a global `Tab` press to prove blur-driven validation. Use a real user blur path (for example click the field, then click another field) or form submission when testing required-message behavior.
- For setup-only taxpayer/spouse/dependent preconditions in E2E specs, prefer the authenticated shared API helpers over bare `page.request.*` calls so tests do not fall through into brittle UI setup unnecessarily.

---

## Taxpayer Radio Loading Rule — Documented 2026-03-31

- For taxpayer forms that render visible radio groups before async `ngOnInit()` loading is complete, Playwright helpers must wait for the shared loading indicators to clear before asserting radio state.
- In this app, that means waiting for `.loading-overlay` and the `Loading data...` status message to disappear before interacting with taxpayer radio groups that load saved data.
- Do not rely on `locator.check()` alone immediately after the group becomes visible; async model hydration can reset the radio after the click. Use a click-and-poll checked-state loop when the form is known to hydrate after initial render.

---
## Form 8888 Reference Rules — Documented 2026-03-29

- **Purpose**: Routing instruction form only. Directs the IRS to split a direct-deposit refund among 2 or 3 bank accounts. No tax computation; no downstream wiring to any schedule or line.
- **Line 4 is reserved**: Line 4 was previously used for savings bond purchases. Savings bonds via tax refund are discontinued for 2024+ returns. Line 4 is never populated.
- **Line 5 formula**: `line5 = account1Amount + account2Amount + account3Amount`. Must equal Form 1040 line 35a (the refund). If it does not match, the IRS may delay the deposit, convert to a paper check, or deposit the full amount into the last listed account.
- **Gating**: `computeForm8888()` returns null if `wantsRefundAllocation ≠ true` or if `form1040.refund.refundAmount ≤ 0`. The form must run after lines 33–38 are finalized so the refund is populated.
- **Non-blocking mismatch flag**: `FORM_8888_TOTAL_MISMATCH` is emitted when `line5 ≠ refund`. It is non-blocking (`blocking = false`) — the form is still output so the user can review and correct the amounts.
- **Routing number is a string**: Routing numbers must be stored and extracted as `String`, not `BigDecimal`/`Integer`. Leading zeros must be preserved (e.g. `021000089`). Use `getString()` in the service; use `<input type="text">` in the Angular component — never `p-inputNumber`.
- **Account number is a string**: Same as routing — use `getString()`. Account numbers may contain letters or hyphens; do not parse as numeric.
- **Routing prefix validation**: First two digits of a valid routing number must be 01–12 (Federal Reserve routing symbols) or 21–32 (thrift institution symbols). This is documented in `lines/8888.md` as a validation hint; the backend does not enforce it (IRS handles post-filing rejection).
- **Fallback account**: The last account with a populated amount acts as the IRS fallback destination if any earlier deposit fails. In rare cases the IRS may deposit the entire refund into the last valid account.
- **Eligible account types**: Checking, savings, Traditional IRA, Roth IRA, SEP IRA, HSA, Archer MSA, Coverdell ESA. SIMPLE IRA is **not** allowed. The current UI offers only "checking" / "savings"; IRA/HSA support is deferred (see `outstanding.md`).
- **Whole-dollar amounts**: IRS Form 8888 requires whole-dollar deposit amounts (no cents). Use `roundMoney()` and store as integer-valued `BigDecimal`.
- **MFJ**: One Form 8888 covers the entire joint refund. There is no spouse-variant form.
- **E2E test pattern**: Compute the return first to get the actual refund, then save the allocation using that refund amount. The refund is not deterministic — do not hardcode it in E2E assertions.

---

## Form 2210 Reference Rules — Documented 2026-03-29

- **Prior-year safe harbor**: 100% of prior-year total tax (Form 1040 line 24) when prior AGI ≤ $150,000 ($75,000 MFS); 110% when prior AGI exceeds that threshold. Without prior-year data entered, the system uses only the 90% current-year safe harbor (line 6), which may understate the required payment for high-income taxpayers.
- **Balance-due short circuit**: If the computed balance due is less than $1,000, `computeForm2210()` returns `null` (no form, no penalty). The $1,000 threshold comes from IRC §6654(e)(1).
- **NO_PENALTY short circuit**: If total payments (withholding + estimated) ≥ required annual payment (line 8), `computationMethod = "NO_PENALTY"` and no penalty is computed.
- **Waiver box A → WAIVED**: If `waiveFullPenalty = true`, `computationMethod = "WAIVED"` and `estimatedTaxPenalty` is not wired to line 38.
- **Waiver box B (partial)**: Penalty is still computed and stored (`computationMethod = "REGULAR_METHOD"`); the IRS determines the actual waiver amount on review.
- **Regular method equal-split**: Withholding is divided equally across 4 periods (line 12 = totalWithholding / 4). Estimated payments are allocated per the per-period amounts entered on `prior-year-tax-taxpayer`.
- **Default days underpaid**: The system uses default period lengths (365 / 303 / 212 / 90 days) corresponding to the assumption that underpayment was not corrected until the April 15, 2026 filing deadline. Box D (actual payment dates) is out of scope.
- **Line 22 vs line 24**: `computeForm2210()` uses `TaxAndCredits.totalTaxBeforeCredits` = Form 1040 line 22 (total tax after nonrefundable credits, before refundable credits). This matches the Form 2210 instruction which starts with the tax from line 22/24 minus refundable credits.
- **Penalty rate (2025)**: 7% annual (federal short-term rate + 3%). Daily rate = 7% / 365. Applied per period: `underpayment × dailyRate × daysUnderpaid`.
- **Intake form ownership**: `prior-year-tax-taxpayer` is the canonical form for all Form 2210 inputs (prior-year AGI/tax, waiver boxes, and 4 estimated payment amounts). The legacy `estimated-tax-payments-taxpayer` form remains registered for backward compatibility but is separate.

---

## Form 8863 Reference Rules — Documented 2026-03-28

- **MFS disqualification**: MFS filers cannot claim AOTC or LLC. `computeForm8863()` returns `null` immediately when filing status is `Married filing separately` and emits the non-blocking flag `EDUCATION_CREDITS_MFS_INELIGIBLE`. The MFS check occurs before any phaseout or per-student computation.
- **Under-24 refundable restriction (IRC §25A(i))**: When the taxpayer was under age 24 at the end of the tax year and meets one of the three conditions (under 18; age 18 without self-support from earned income; full-time student age 19–23 without self-support), the refundable portion of the AOTC (Form 8863 line 8 / Form 1040 line 29) is zero. The full phased-out AOTC (line 7) shifts to line 9 and flows into the nonrefundable column (Schedule 3 line 3). The restriction is driven by the intake field `refundableAotcRestrictionApplies` on `education-credits-taxpayer`; when absent or false, the normal 40/60 split applies.
- **40/60 split default**: When `refundableAotcRestrictionApplies` is null or false, line 8 = `round(line7 × 0.40)` and line 9 = `line7 − line8`. The `Boolean.TRUE.equals()` pattern ensures a null field defaults to the 40/60 split (safe default).
- **AOTC phaseout thresholds (2025)**: Single $80,000–$90,000 MAGI; MFJ $160,000–$180,000 MAGI. Phaseout fraction = `(upper − MAGI) / range`, rounded to 3 decimal places, capped [0.000, 1.000]. Line 7 = `line1 × fraction`.
- **MAGI add-backs**: Puerto Rico excluded income, Form 2555 foreign earned income exclusion, Form 2555 housing exclusion, Form 4563 excluded income are each added to AGI before applying the phaseout. These are entered manually on the intake form.
- **LLC (Lifetime Learning Credit)**: 20% × min(qualified expenses per return, $10,000) = max $2,000. Subject to the same MAGI phaseout as AOTC. Always nonrefundable (→ Schedule 3 line 3). LLC is never blocked by Form 8862 disallowance.
- **Form 8863 PDF field format**: The f8863 CSV uses columns `old_field_name, old_full_name, semantic_field_name, field_type, pages_0_indexed, rect_first_occurrence`. The page column is 0-indexed (unlike the Schedule 8812 CSV which uses 1-indexed pages). The rect is bracketed (`[x0, y0, x1, y1]`). The Angular component uses a name-based dict lookup, not positional fill.

---

## Lines 25a–25d Reference Rules — Documented 2026-03-27

- **25a = W-2 box 2**: sum of `federalIncomeTaxWithheldAmount` across all W-2 entries. For MFJ, both spouses' W-2s combined — no per-SSN filtering.
- **25b = 1099-series + SSA-1099 + RRB-1099**: 1099-R, RRB-1099-R, 1099-INT, 1099-DIV, 1099-B, 1099-OID, 1099-G, 1099-NEC, 1099-K, 1099-MISC all read `federalIncomeTaxWithheldAmount`. SSA-1099 reads `voluntaryFederalIncomeTaxWithheldAmount` (non-standard field name — box 6 is voluntary); handled by `sumSsa1099Withholding()`. RRB-1099 reads `federalIncomeTaxWithheldAmount` (box 10). IRS 2025 instructions explicitly place SSA-1099 and RRB-1099 on 25b, not 25c.
- **25c = W-2G + Form 8959 line 24**: W-2G box 4 (`federalIncomeTaxWithheldAmount`) → `withholdingOther`. Form 8959 Part V line 24 → `withholdingOther` (additive). IRS instructions place W-2G on 25c.
- **25d = 25a + 25b + 25c**: `totalWithholding`. Null if all three sub-lines are zero/null.
- **Zero vs null rule**: only positive amounts are summed; a sub-line is null (not $0) when its entire input population sums to zero.
- **SSA-1099 field name**: the frontend stores SSA-1099 box 6 as `voluntaryFederalIncomeTaxWithheldAmount`. The generic `sumFederalWithholdingFromEntries()` reads `federalIncomeTaxWithheldAmount` and would silently return null for SSA-1099. Always use `sumSsa1099Withholding()` for SSA-1099 entries.
- **TestStatementDataService coverage**: `w2gEntries`, `necEntries`, `kEntries` added to `TestStatementDataService` so unit tests can seed W-2G, 1099-NEC, and 1099-K withholding.

---

## Form 4868 Reference Rules — Documented 2026-03-26

- **One form per return**: regardless of filing status, the output is a single Form 4868 per tax return. On MFJ returns, taxpayer and spouse intake are consolidated into one joint form.
- **Spouse-split intake**: `extension-of-time-taxpayer` owns the full return-level workflow (filing method, lines 4–7, special status flags 8/9). `extension-of-time-spouse` is supplemental only — it contributes a spouse-side payment amount and optional confirmation reference, which are aggregated into line 7 by the backend.
- **Line 7 → Schedule 3 line 10**: `applyForm4868ToSchedule3()` wires `form4868.line7` → `schedule3.otherPaymentsCredits.amountPaidWithExtension`. This is the only Form 4868 → Form 1040 wiring.
- **Electronic payment substitute**: if `extensionFilingMethod == "electronic-payment-substitute"`, `filedByElectronicPaymentSubstitute = true` and a note is set. No paper Form 4868 is required.
- **Line 6 floor**: `line6 = max(0, line4 - line5)`. It cannot be negative.
- **Applications sidebar**: Form 4868 intake items live under the **Applications** sidebar section (between Deductions and Tax Return). Taxpayer tab shows `extension-of-time-taxpayer`; spouse tab shows `extension-of-time-spouse`. Dependents have no Applications items.

---

## Form 5695 Reference Rules — Documented 2026-03-24

- Default filing count: one Form 5695 per return.
- Exception: MFJ spouses with separate main homes for Part II may need separate Forms 5695 through line 30 for each home, then attach both.
- Exception: joint occupants who are not filing one return together each complete their own Form 5695 and allocate the credit.
- Part I (Residential Clean Energy Credit) is nonrefundable with carryforward; line 15 maps to Schedule 3 line 5a.
- Part II (Energy Efficient Home Improvement Credit) is nonrefundable with no carryforward; line 32 maps to Schedule 3 line 5b.
- Intake split rule: use `energy-credit-taxpayer` for return-level screening plus the primary Part I/Part II inputs, and `energy-credit-spouse` only for spouse-side additive costs/home facts on MFJ returns.
- Output rule: the primary Form 5695 carries the Schedule 3 values (`line15` -> `5a`, `line32` -> `5b`), while an MFJ separate-main-home exception may also generate one supplemental Part II-only Form 5695 attachment in the tax-return payload.
- Validation rule: Form 5695 E2E coverage must seed enough tax on Form 1040 line 18 (for example via W-2 wages) so Part I/Part II credit-limit behavior can be asserted deterministically.
- For 2025 Part II specified property, collect and retain a valid QMID; manufacturer certifications are kept in records and not attached.

---

## Documentation Hygiene Rules

After any implementation session, always update all three of:
1. `C:\us-tax\history.md` — timestamped entry for what was implemented
2. `C:\us-tax\rules.md` — any new business rules or implementation decisions
3. Active workspace `context.md` — summary of what changed

**outstanding.md rule**: Any deferred or out-of-scope items identified during implementation must be added to `C:\us-tax\outstanding.md` before the session ends. Use the format `[Feature / Sub-item] Description — reason for deferral.` Group related deferred items under a `## <Form> — Implemented (<date>); Remaining Deferred Items` heading.

**Markdown preservation rule**: Never overwrite, truncate, delete, or replace any `.md` file in a way that could cause loss of existing information. Before writing any `.md` file, create a backup or staged copy, make the smallest possible additive change, verify the exact diff, and only then write the updated file back. If content preservation cannot be verified, stop and ask the user before proceeding.

**Boolean field presentation rule**: In taxpayer-facing UI forms, render ordinary boolean questions as explicit **Yes / No radio buttons** by default. Do not use dropdowns or single checkboxes for standard boolean inputs unless the field must mirror a third-party statement checkbox exactly or the control is intentionally multi-state.

---

## Input/Output Classification Model

Every Form 1040 line is computed from three categories of inputs. Understanding which category each artifact belongs to governs backend data flow, persistence, and frontend display.

### Category 1 — Statements (true inputs)
Raw financial documents issued by third parties (employers, financial institutions, government agencies). The user uploads or manually enters these. They are the primary source data for the return.
Examples: W-2, 1099-INT, 1099-DIV, 1099-R, SSA-1099, 1099-G, 1099-B, 1099-DA, K-1.

### Category 2 — User Input Forms (true inputs)
Personal forms filled in by the taxpayer to capture facts that are not derivable from statements alone: filing status, dates, elections, override amounts, and situation-specific choices.
Examples: `standard-deductions-taxpayer`, `additional-deductions-taxpayer`, `kiddie-income-taxpayer`, `16-tax-taxpayer`, `investment-interest-expense-deduction`.

### Category 3 — Calculation Forms / Schedules / Worksheets
Intermediate artifacts computed entirely from Category 1 and 2 inputs. They hold structured calculation results. They are **not** true inputs — they are derived.

This category has two sub-types:

| Sub-type | Description | Examples |
|---|---|---|
| **Output forms** (filed with return) | Computed and submitted to the IRS as part of the return package. Must be generated, persisted, and rendered in the Tax Return sidebar. | Schedule D, Form 8949, Form 6251, Schedule B, Form 8606, Form 4972, Schedule 2 |
| **Calculation-only worksheets** (not filed) | Computed internally to arrive at a line amount; never attached to the return. Kept for recordkeeping only. | Tax Computation Worksheet, QDCG Worksheet, Foreign Earned Income Tax Worksheet, Schedule D Tax Worksheet, AMT Exemption Phaseout Worksheet |

### Implementation rule
When implementing any Form 1040 line, classify each artifact before writing code:
- Category 1/2 → captured via statement entries or personal forms; persisted as user data in Firestore; rendered in Statements/Incomes/Deductions/Personal sidebars.
- Category 3 output forms → computed by `TaxReturnComputeService`; persisted in `TaxReturnComputation`; rendered in Tax Return sidebar; included in PDF export.
- Category 3 worksheets → computed transiently in `TaxReturnComputeService`; not persisted as standalone artifacts; values flow into the next computation step.

### Output form classification rule

**Any form or schedule that is attached to the Form 1040 federal tax return is an output form — always.**

This applies regardless of whether that form's computed total is also read by another Form 1040 line. For example:
- Schedule 2 is an output form (filed with the return). The fact that Form 1040 line 23 reads Schedule 2 line 21 does not make Schedule 2 an "input" — it is a computed output that feeds line 23.
- Schedule 3 is an output form. Form 1040 line 20 reads Schedule 3 line 8, but Schedule 3 remains an output.
- Schedule 8812 is an output form. Form 1040 lines 19 and 28 read from it, but it is still an output.

The distinction is: **user-supplied data (statements, personal forms) are inputs; everything the backend computes and attaches to the return is an output.** A form being both computed from inputs and consumed by another line does not make it an input — it makes it an intermediate output in the computation chain.

When listing "input forms" and "output forms" for a given line:
- **Input forms**: the Category 1 statements and Category 2 personal forms whose data drives the line's computation.
- **Output forms**: the IRS schedules and supporting forms that are generated as part of the return and that contain or display the result of that line (including forms that aggregate sub-items into the line total).

### Statement YAML vs. personal form YAML — strict boundary rule

**Statement YAMLs** (`C:\us-tax\yamls\` files whose `category` is `statements` or `capitalItems`, or capital statement configs generated by `generate-capital-statement-ui-artifacts.js`) represent **third-party-issued IRS documents**. Every field in a statement YAML must correspond 1-to-1 with a box or line printed on the actual IRS form.

**Never** add the following to a statement YAML:
- Eligibility screening questions
- User preference or election fields not present on the physical document
- Computed/derived fields that the backend calculates rather than the issuer prints
- Aggregation or cross-statement fields
- Fields that belong to a different form or schedule

**When a computation needs user input that has no corresponding third-party statement** (e.g. a Section 1341 repayment credit, an election, a yes/no gate, a manually-computed credit amount), use a **Category 2 personal intake form** instead. Personal forms live in `C:\us-tax\yamls\` with `category: applications`, `incomes`, `deductions`, or `personal`, and are registered in `PersonalResource.ACCEPTED_PERSONAL_FORM_IDS`.

**Corollary for Form 2439**: Box 2 (`taxPaidOnUndistributedGains`) is printed on the Form 2439 statement and belongs in the `2439` statement entry. The backend aggregates it from statement entries. No separate personal form is needed for the Schedule 3 line 13a credit — it flows directly from the statement data.

---

## Line 17 (AMT / Form 6251) Rules — Implemented 2026-03-21

- Line 17 = Form 6251 line 11 = max(0, line9 − line10), where line9 = tentative min tax after FTC, line10 = line16 + PTC repayment − Form4972 lump-sum.
- `computeLine17()` in `TaxReturnComputeService` is called after `computeLine16()` and `computeForm8962()` are complete.
- **IRS filing requirement**: Form 6251 must be generated (and persisted) when PAB interest (line 2g) > 0, even if AMT = 0. Callers must check `form6251 != null` before rendering; a non-null form with `line11 = null/0` means "no AMT but filing required".
- **Part I AMTI formula**: `line4 = line1b + line2a + line2b + line2g`. `line1a = line14 − schedule1A.line37SeniorDeduction`. `line1b = AGI − line1a`. `line2a = Schedule A SALT (when itemizing)`. `line2b = −(state/local taxable refund from Schedule 1)`. `line2g = PAB interest from 1099-INT box 9`.
- **2025 AMT exemptions**: Single/HOH $88,100; MFJ/QSS $137,000; MFS $68,500. Phaseout starts: Single/HOH/MFS $626,350; MFJ/QSS $1,252,700. Phaseout rate: 25 cents per dollar.
- **26%/28% breakpoint**: Non-MFS $239,100; MFS $119,550. Amounts below are taxed at 26%, above at 28%.
- **AMT compute paths** (mirror Line 16 decision tree): FEITW when Form 2555 present → AMT_PART_III when Schedule D QDCG gains → DIRECT_RATE (26%/28%) otherwise.
- `TaxAndCredits.alternativeMinimumTax` is set to the AMT amount when > 0, null otherwise.
- Schedule 2 `line3AlternativeMinimumTax` is wired from Form 6251 line 11 via `wireLine17ToOutputs()`.
- Schedule 2 `line1aExcessAdvancePtcRepayment` is wired from `form8962.line29RepaymentAmount` in `wireLine17ToOutputs()`.
- AMT FTC (line 8) defaults to 0; separate FTC computation is deferred.
- Deferred: line 2c (AMT investment interest — requires Form 4952 AMT recompute), line 2f (ATNOLD), line 2i (ISO spread, out of scope), line 2m (passive activity — requires Schedule E), line 8 (AMT FTC).

## Line 16 (Tax) Rules — Implemented 2026-03-20

- Line 16 is computed after line 15 is finalized. `computeLine16()` in `TaxReturnComputeService` is called after `form4972Taxpayer` and `form4972Spouse` are computed in `prepare()`.
- Decision tree order is strict: ZERO → FEITW → FORM_8615 → SCHEDULE_D_TAX_WORKSHEET → QDCG → TAX_TABLE/TAX_COMPUTATION_WORKSHEET. The first matching condition wins.
- The Tax Table (line15 < $100k) and Tax Computation Worksheet (line15 ≥ $100k) use the same bracket formula; results are mathematically identical.
- QDCG Worksheet is required when: qualified dividends (line 3a) > 0, OR capital gain distributions on line 7a without Schedule D, OR Schedule D with both lines 15 and 16 positive.
- Schedule D Tax Worksheet is required when Schedule D line 18 (28% rate gain) or line 19 (unrecaptured §1250 gain) > 0, AND both Schedule D lines 15 and 16 are gains.
- Form 2555 exclusion amounts (lines 45, 50) are computed from qualifying period dates in `computeForm2555Exclusions()`. Housing cap defaults to 30% of annual exclusion ($39,000); country-specific caps are deferred.
- Form 8615 path uses the user-entered `childFinalTaxLine18` from the `kiddie-income-taxpayer` personal form. If the value is null (not yet entered), computation falls back to the bracket method.
- Box 3 in-scope: ECR only (`16-tax-taxpayer` personal form). Box 3 out-of-scope: 962, 1291TAX, Form 8978, 965INC — must be added manually after PDF export.
- `TaxAndCredits.tax` (line 16 total) = regularTax + box1Form8814Tax + box2Form4972Tax + ecrBox3Tax.

## Scope Extension (2025 Lines 2a-9)
- Implementation scope now extends beyond wages to lines 2a/2b, 3a/3b, 4a/4b/4c, 5a/5b/5c, 6a/6b/6c/6d, 7a/7b, 8, and 9 with spouse-aware inputs and conditional output forms.
- Use the rule specs in C:\us-tax\lines (for example 2ab.md, 3ab.md, 4abc, 5abc.md, 6abcd.md, 7ab.md, 8.md, 9.md) as authoritative implementation references.
- Self-employment income remains out of scope for this app; block or exclude Schedule C/F paths unless explicitly enabled later.

## Global Rules
- Imported fields are prepopulated from statements/personal forms but remain editable; users may have no statements and must enter or override values manually.
- Employee-only scope for current wage line work (no Schedule C/SE income paths).
- Amounts are rounded using the system-wide rounding policy (round half up when whole-dollar rounding applies); for computed lines, sum raw inputs then round the final line value.
- Line 1i (combat pay election) is for credit calculations only and is never included in taxable wages totals.

## E2E Statement Seeding Rules

- **W-2 wages field**: Always seed W-2 box 1 wages as `wagesTipsOtherCompAmount`, not `wagesAmount`. The field `wagesAmount` is not read by `TaxReturnComputeService` and is silently ignored — wages will not appear in line 1a/AGI/line 15, causing tax to compute as zero with no error.
- **W-2 SS wage base**: When seeding a W-2 for tax-bracket tests, also populate `socialSecurityWagesAmount` (box 3) alongside `wagesTipsOtherCompAmount` so downstream SS-tax computations have consistent data.
- **Optional computed output fields**: Set to `null` (not `BigDecimal.ZERO`) when a computation does not apply. Callers use the `?? null` coalescing pattern to distinguish "not applicable" from "computed zero". Zero and null have different tax meanings and different display behaviors in the UI.
- **E2E test expectations for computed amounts**: When a new compute path is implemented, audit existing tests that asserted a field was `null` under a "deferred" comment and update them to assert the now-computed value. Stale "deferred" assertions become false negatives after the feature ships.

## E2E Helper Stability
- Shared auth helpers are suite-wide infrastructure. If Firebase bootstrap uses an external sign-in, cache the session per worker and retry transient DNS/network failures before failing the suite.
- Shared reset helpers should refresh auth only when the backend actually rejects the cached session (`401`), not before every test.
- Statement page objects must verify the target form is actually active after a sidebar click by waiting for a form-specific heading or unique ready control.
- Save helpers should assert the Save button is enabled before waiting for a network response. If a required gating field is missing, fail immediately instead of hanging on `waitForResponse`.
- Specs that intentionally test blocked saves still need to populate all unrelated required gating inputs so the failure reason stays precise.

## Personal Form Rules (per-person instances)
- Digital assets uses separate taxpayer/spouse forms; Form 1040 "Digital assets" is Yes if either person answers Yes (legacy single-form value is used as fallback).
- Standard deduction uses separate taxpayer/spouse forms:
  - "Someone can claim you as a dependent" (taxpayer) -> Form 1040 dependent claim indicator.
  - "You were a dual-status alien" (taxpayer) OR "Spouse itemizes on a separate return" (spouse) -> Form 1040 spouse itemizes/dual-status indicator.
  - "Someone can claim your spouse as a dependent" (spouse) -> Form 1040 spouse dependent claim indicator.
  - Legacy single-form "spouseItemizesOrDualStatus" is used as fallback when per-person data is missing.
- Age/blindness uses separate taxpayer/spouse forms; each person maps to their respective Form 1040 checkbox (legacy single-form fallback is used if present).
- Presidential Election Campaign uses separate taxpayer/spouse forms; each person maps to their respective Form 1040 checkbox (legacy single-form fallback is used if present).
- Dependent-tab income forms must not reuse taxpayer personal-form ids. If a dependent tab needs its own intake workflow, store it as dependent-scoped data keyed by `dependentId` so one child tab cannot overwrite another child's answers.
- When dependent sections are exposed before child-return computation exists, keep the sidebar section visible but leave the dependent Tax Return item list empty and record the missing compute/output work in `C:\us-tax\outstanding.md`.

## Reference Data (see `ReferenceData`)
- TAX_YEAR = 2025.
- HOUSE_HOLD_EMPLOYEE_THRESHOLD = 2800 (2025 W-2 issuance threshold, explanatory only).
- SOCIAL_SECURITY_WAGE_BASE = 168600.
- Elective deferral limits (2024 values, used until updated):
  - 402(g) limit 23000 + catch-up 7500 (age 50+).
  - SIMPLE limit 16000 + catch-up 3500 (age 50+).
  - 457(b) limit 23000 + catch-up 7500 (age 50+).
- Form 8839 adoption limits (2024 values, used until updated):
  - Max exclusion per child 16810.
  - Phaseout start 252150; phaseout range 40000.

## Form 1040 Line 1a - Wages (W-2 Box 1)
- Line 1a is the sum of W-2 Box 1 wages across all W-2s.
- If no W-2 wages, line 1a may be null/0 depending on context.

## Employment Income W-2 Requirement (Compute-time blocking rule)
- If a taxpayer or spouse answers "Did you receive any wages?" = Yes and "Did you receive pay for household work?" = No,
  a W-2 is required before computing the return.
- Validation checks for a matching W-2 by SSN (fallback: any W-2 if SSN is missing).
- Blocking flags:
  - MISSING_W2_EMPLOYMENT_INCOME_TAXPAYER
  - MISSING_W2_EMPLOYMENT_INCOME_SPOUSE

## Form 1040 Line 1b - Household Employee Wages (no W-2)
- Include wages paid as a household employee where the payer controls what/how work is done.
- Only include if not reported on any W-2.
- The W-2 threshold (2025: $2,800) explains why a W-2 may be missing but is not an eligibility test.

## Form 1040 Line 1c - Tip Income (Form 4137)
- Include tips not in W-2 Box 1: unreported cash/charge tips, allocated tips (W-2 Box 8), and non-cash tips (FMV).
- Form 4137 computes SS/Medicare tax on unreported cash/charge tips and allocated tips; non-cash tips are excluded from 4137.
- If W-2 SS wage/tip data is missing, compute Medicare-only tip tax and emit a blocking flag.
- Form 4137 is per spouse; Schedule 2 line 5 carries the tax.

## Form 1040 Line 1d - Medicaid Waiver Payments
- Include taxable Medicaid waiver payments not in W-2 Box 1.
- If qualified Notice 2014-7 payments are elected for earned income, include them and offset on Schedule 1 line 8s.
- If payments are reported via a home-care trade/business, emit a blocking Schedule C flag.

## Form 1040 Line 1e - Dependent Care Benefits (Form 2441 Part III)
- Triggered by W-2 Box 10 > 0 (employee-only; no self-employment).
- Compute Part III line 26; line 1e equals Form 2441 line 26.
- Line 1e is always derived from Form 2441; do not place W-2 Box 10 directly on line 1e.

## Form 1040 Line 1f - Adoption Benefits (Form 8839 Part III)
- Triggered by W-2 Box 12 code T > 0 (employee-only).
- Allocate current-year benefits across children; sum allocations must equal W-2 code T total.
- Per-child max exclusion and phaseout use reference data; line 1f equals Form 8839 Part III line 29.
- Line 1f may be negative and must flow into wages totals as-is.
- Form 8839 is once per return (MFJ combined).
- Part II adoption credit is held at 0 until MAGI is available.

## Form 1040 Line 1g - Uncollected SS/Medicare Wages (Form 8919)
- Line 1g equals Form 8919 line 6 (sum of firm wages).
- Separate 8919 per spouse on MFJ.
- Reason codes supported: A/C/G/H. A/C require IRS date.
- SS tax is limited by wage base (line 7); Medicare tax applies to full line 6.
- Form 8919 line 13 tax flows to Schedule 2 line 6.

## Form 1040 Line 1h - Other Earned Income
Line 1h = sum of:
- Disability pension wages (1099-R code 3, only if below plan minimum retirement age).
- Excess elective deferrals (402g/SIMPLE/457b over limits; catch-up applies for age 50+).
- Corrective distributions (1099-R code 8 only; code P is prior year and excluded).
- Strike/lockout benefits (manual entry + tagged 1099-MISC Box 3).
Line 1h statement descriptions are stored and output with the return.
1099-R ownership: if SSN missing/mismatched, user must select taxpayer/spouse (no default).

## Form 1040 Line 1i - Nontaxable Combat Pay Election
- Source: W-2 Box 12 code Q totals per person.
- Election is all-or-none per taxpayer/spouse (no partial inclusion).
- Amount is used for credit earned income calculations only; not taxable wages.

## Form 1040 Line 1z - Total Wages
- Line 1z is the arithmetic sum of lines 1a-1h only; line 1i is excluded.
- Negative amounts (e.g., line 1f or 1h) are included as-is.


## 2026-03-08T16:33:26.6918138-04:00
Context and documentation hygiene rule:
- Always update these three artifacts after significant work: C:\us-tax\history.md, C:\us-tax\rules.md, and the active workspace context.md.
- Include timestamp, what changed, and concrete artifact/file paths.

## 2026-03-08T16:41:35.1142646-04:00
Line-10 YAML pattern rule:
- Use spouse-split YAMLs for line 10 (taxpayer and spouse) with title "Income adjustments".
- Keep return-level statement-upload confirmations on taxpayer form only.
- Keep self-employment adjustments (Schedule 1 lines 15-17) as explicit out-of-scope blockers.
- Keep imported statement fields and computed outputs in backend-only sections and do not render them in form components.

## YAML creation standards (canonical, supersedes malformed escaped entries)
- File naming:
  - Use line-prefixed, kebab-case names in `C:\us-tax\yamls` (example: `10-income-adjustments-taxpayer.yaml`, `10-income-adjustments-spouse.yaml`).
  - Use spouse-split files when both spouses can have inputs.
- Top-level required keys:
  - `name` (matches backend personal form id), `title`, `multiplicity`, `formName`, `category`.
  - `instructions`: short list shown at top of form.
  - `sections`: ordered list of form sections.
- Section conventions:
  - `sections[].name`, `sections[].title`, `sections[].multiplicity` (`single` or `multiple`), optional `showIf`, optional `instructions`.
  - Use `showIf` gates to prevent presenting downstream questions when the screening question is No.
  - Put return-level statement gating/confirmations on taxpayer/family-head form only to avoid conflicts on MFJ returns.
- Field conventions:
  - Always include `label` and `help` for user-facing fields.
  - For `amount` fields include `placeholder: 0.00`.
  - For `text` fields include a realistic `placeholder` (e.g., SSN mask `###-##-####`) when applicable.
  - Use explicit, line-anchored names (for example `studentLoanInterestDeductionLine21`) so mapping is unambiguous.
- Backend-only blocks:
  - Keep imported statement totals and computed outputs in YAML (for completeness) but mark the entire section as backend-only in a comment and set `readOnly: true` on those fields.
  - UI components must not render backend-only sections.
- Top-level metadata:
  - Include `name`, `title`, `multiplicity`, `formName`, `category`, `instructions`, `sections`.
  - Keep naming consistent with form purpose; avoid ambiguous generic names.
  - `collection: FIXME` is redundant; ignore it and do not rely on it for behavior.
- Spouse-split convention:
  - Taxpayer form owns return-level gating and cross-person conflict-prone questions.
  - Spouse form contains spouse-specific amounts/facts only.
- Section design:
  - Use clear sections with `name`, `title`, `multiplicity`.
  - Use `showIf` for conditional branches.
  - Use `multiplicity: multiple` only for repeatable item rows (for example, line 8z/24z lists).
- Field standards:
  - Every field should define `name`, `type`, `required`, `label`, and `help`.
  - Add `placeholder` for user-entered text/amount/date/list fields.
  - Prefer `amount` for currency-like numeric values, `boolean` for yes/no, `date` for dates, `list` for enumerated options.
  - Keep labels/help IRS-aligned and line-aware where practical.
- Backend-only sections:
  - Keep imported statement fields and computed outputs in explicit backend-only sections.
  - Mark backend-only fields `readOnly: true` where appropriate.
  - Do not render backend-only sections in frontend components.
- Scope enforcement:
  - If a path is out of scope (for example, self-employment lines), include explicit screening/blocker fields.
  - Do not silently drop out-of-scope conditions.
- Consistency requirements:
  - Match structure and tone used by existing spouse-aware YAMLs (2ab, 3ab, 4abc, 5abc, 6abcd, 7ab, 8, 10).
  - Use concise, deterministic instructions that map directly to compute logic.
- Documentation hygiene:
  - After significant YAML changes, update `C:\us-tax\history.md`, `C:\us-tax\rules.md`, and active workspace `context.md` with timestamped notes.


## 2026-03-08T16:44:44.1615400-04:00
Rules cleanup:
- Removed malformed escaped YAML standards block.
- Corrected line-10 YAML pattern wording to "(taxpayer and spouse)".
- Canonical YAML creation standards section remains authoritative.

## 2026-03-10T14:15:00-04:00
Line 8 / line 10 implementation rule clarification:
- Treat Forms 2555, 8853, and 8889 as conditional output attachments when Schedule 1 computed amounts trigger them (line 8d/8e/8f and line 24j/23/13 as applicable); do not model them as taxpayer statement-selection or upload-gating inputs for line 8.
- For long multi-section numeric forms such as line 8 other incomes and line 10 income adjustments, prefer explicit Save-button submission and block implicit Enter-key form submits to avoid partial persistence during data entry and e2e automation.
## 2026-03-10T17:00:00-04:00
Line 11 implementation rule clarification:
- Model Form 1040 line 11a and line 11b explicitly in backend outputs even if the current UI continues to render a single AGI row; preserve the existing AGI field until the UI adopts separate line labels.
- For 2025 Form 1040 AGI, perform a direct subtraction line 11a = line 9 - line 10 and preserve negative values; line 11b is a direct copy of line 11a.

## 2026-03-11T02:30:00-04:00
Line 12 implementation rule clarification:
- Keep tax-year-sensitive standard-deduction constants and threshold labels in backend reference data and load them in the UI instead of hardcoding dates/amounts in components.
- Model the new consolidated line 12 workflow under a top-level `Deductions` sidebar section; keep the `Incomes` section name pluralized going forward.
- Use `standard-deductions-taxpayer` for return-level line 12 election, dependent worksheet input, and Schedule A inputs, and use `standard-deductions-spouse` only for spouse-specific line 12 indicators.
- Legacy Personal forms `standard-deduction-*` and `age-blindness-*` may remain temporarily for compatibility, but new line 12 work should target the consolidated deductions forms and their backend ids.

## 2026-03-11T03:40:00-04:00
Line 12 UI pattern clarification:
- The consolidated `Standard deductions` UI should follow the same sectioned, question-driven pattern used by the `Incomes` forms (screening/questions first, grouped numeric sections after), not a worksheet- or statement-style layout.
- For line 12 booleans in the new deductions forms, prefer yes/no selects over freeform checkboxes so the interaction model stays consistent with other multi-section tax workflows.

## 2026-03-11T11:06:12.1372889-04:00
Line 12 sidebar cleanup clarification:
- `Standard deduction` and `Age and blindness` should no longer appear as user-facing entries under the `Personal` sidebar section.
- The only visible line-12 workflow entry point should be `Deductions > Standard deductions`.
- Keep legacy `standard-deduction-*` and `age-blindness-*` ids/components temporarily for compatibility and redirect any stale UI selections to the consolidated `standard-deductions-*` forms until backend/data cleanup is completed.

## 2026-03-11T11:19:07.3624759-04:00
E2E setup stabilization rule:
- When a focused Playwright spec needs a baseline filing status but is not actually testing the Filing status form itself, prefer saving `filing-status` by API in test setup and keep UI interaction only as a fallback to reduce dropdown/navigation flake.

## 2026-03-11T11:29:39.4647087-04:00
Line 12 UI cleanup clarification:
- After the consolidated deductions rollout, do not mount the legacy `form-standard-deduction` or `form-age-blindness` components in the shell UI.
- Keep stale-id redirects in the shell only as a temporary compatibility layer until backend/data cleanup removes the legacy ids entirely.

## 2026-03-11T11:58:36.8303419-04:00
Line 12 compatibility cleanup clarification:
- The active line 12 workflow is now authoritative only through `standard-deductions-taxpayer` and `standard-deductions-spouse`.
- Do not accept, read, redirect, or backfill legacy `standard-deduction*` or `age-blindness*` ids in active UI/backend code.
- When updating line 12 logic or tests, seed only the consolidated deductions forms and treat the old standalone Personal forms as dead legacy code pending file deletion.

## 2026-03-11T12:12:22.0543317-04:00
Line 12 dead-file cleanup rule:
- After the line 12 consolidation, keep only `form-standard-deductions.component.*` as the active deductions UI; do not restore standalone `form-standard-deduction` or `form-age-blindness` component files.
- If a smoke/component inventory test enumerates UI components, remove deleted legacy components from that registry in the same change.

## 2026-03-11T13:01:05.6910960-04:00
Line 13 documentation rule:
- Use `C:\us-tax\lines\13ab.md` as the current shared reference for Form 1040 (2025) lines 13a and 13b.
- For 2025 QBI gating, keep thresholds in tax-year reference data and use `394,600` for MFJ and `197,300` for all other filing statuses when selecting Form 8995 vs Form 8995-A.
- Treat Form 1040 line 13b as a direct mapping from Schedule 1-A line 38 and preserve the Schedule 1-A part-level caps, MFJ restrictions, and phaseout rules documented there.

## 2026-03-11T14:41:26.8094643-04:00
Semantic asset generation rule for line 13a forms:
- Use `C:\us-tax\us-tax-be\scripts\generate-semantic-13a-forms.js` to regenerate semantic PDF+CSV artifacts for `f8995.pdf`, `f8995-A.pdf`, and `Schedule E.pdf`.
- Keep the shared output filenames stable as `f8995_*`, `f8995a_*`, and `schedule_e_*` in `C:\us-tax\pdfs` for later wiring.
- The generator intentionally resolves `pdf-lib` from `C:\us-tax\us-tax-ui\package.json` so we reuse the existing workspace dependency instead of duplicating installs.

## 2026-03-11T17:18:39.9119173-04:00
Shared YAML location rule:
- For new line-work intake definitions, create shared copies in `C:\us-tax\yamls`, not `C:\us-tax\yaml`.
- Match the `yamls` folder naming convention with explicit line prefixes and per-person suffixes when the workflow differs for taxpayer and spouse.
- Line 12 shared references now live in `12abcde-standard-deductions-taxpayer.yaml` and `12abcde-standard-deductions-spouse.yaml`.

## 2026-03-11T17:23:30.2247903-04:00
Line 13a shared YAML rule:
- Store the shared supplemental line 13a intake definitions in `C:\us-tax\yamls\13a-qualified-business-income-taxpayer.yaml` and `C:\us-tax\yamls\13a-qualified-business-income-spouse.yaml`.
- Keep raw K-1 and 1099-DIV section 199A statement data out of these forms; use them only for non-statement supplemental facts such as prior-year QBI carryforward, upload confirmation, and out-of-scope screening.

## 2026-03-11T18:08:04.2675395-04:00
Line 13a UI wiring rule:
- Use the reusable Angular component `C:\us-tax\us-tax-ui\src\app\forms\form-qbi-deduction.component.ts` for both `qbi-deduction-taxpayer` and `qbi-deduction-spouse`.
- Wire line 13a under the `Deductions` sidebar, not `Incomes`, using the label `Qualified business income`.
- Keep the UI step separate from backend activation: shell wiring may exist before `PersonalResource.java` and `TaxReturnComputeService.java` are updated, so do not treat save/compute support as complete until those backend steps are implemented.

## 2026-03-11T18:26:09.2847457-04:00
Line 13a backend support rule:
- Accept `qbi-deduction-taxpayer` and `qbi-deduction-spouse` in `PersonalResource.java` before treating the new line 13a UI as active.
- Persist conditional `Form8995` / `Form8995A` outputs through `TaxReturnComputation.java` and `TaxReturnDataService.java` whenever line 13a is computed.
- Treat only semantically mapped `1099-DIV` box 5 section 199A dividends as direct statement-extracted line 13a amounts for now; do not guess at K-1 imported-field values.
- Keep K-1-driven line 13a paths blocking until semantic 199A extraction exists, and keep above-threshold non-REIT/PTP QBI blocking until 8995-A wage, UBIA, and SSTB semantics are wired.

## 2026-03-11T18:56:01.6410066-04:00
Line 13a verification rule:
- Lock in the current support boundary with tests: semantically mapped `1099-DIV` box 5 plus supplemental carryforward/manual fields must compute line 13a and emit `Form8995` below threshold.
- Keep explicit guardrail tests for uploaded K-1 section 199A paths and unsupported complex-threshold 8995-A paths so later work cannot silently bypass those blocks.
- Follow existing e2e convention for compute blocking flags: if the UI still renders Form 1040 preview, assert the returned flag payload instead of assuming HTTP `409`.
- Keep a dedicated dataflow diagram for line 13a in `C:\us-tax\diagrams\13a.drawio` once the intake, compute, and verification path are in place.
## 2026-03-12T00:26:00-04:00
Line 13a K-1 support clarification:
- Uploaded `Schedule K-1` section 199A paths are no longer categorically blocked for line 13a. When the stable semantic K-1 fields are present, `TaxReturnComputeService.java` may compute line 13a from those inputs, including the supported non-SSTB above-threshold `Form 8995-A` branch.
- Preserve explicit blocking only for missing K-1 199A semantic detail, unsupported SSTB/negative-manual threshold paths, or other documented unsupported complex cases; do not treat every K-1-driven line 13a case as out of scope.
- When saving `qbi-deduction-taxpayer` / `qbi-deduction-spouse` by API in tests or tooling, use the backend semantic payload keys and native booleans/numbers, not the UI field ids or `Yes`/`No` strings.
- For focused e2e setup that bypasses the UI save flow, capture and reuse the real authenticated `Authorization` header from a successful app request rather than assuming `page.request` is already authenticated.

## 2026-03-12T10:22:35.2133874-04:00
Statements and semantic-assets rule:
- When adding a new statement form, wire all four layers together before considering it usable: backend `StatementFormCatalog.java`, UI `statement-selection.service.ts`, shell render wiring, and a concrete Angular statement form component.
- For new shared semantic statement assets, keep the output basename aligned to the source IRS PDF filename when practical (for example `f1099nec` from `f1099nec.pdf`, `f1040s1a` from `f1040s1a.pdf`).
- If a requested IRS source PDF is missing from `C:\us-tax\docs\IRS-Forms`, do not invent a substitute file or fake semantic output; record the missing source explicitly and generate only the assets backed by real source PDFs.

## 2026-03-18T19:50:00-04:00
Schedule 1/2/3 2025 migration rule:
- Keep Schedule 1, Schedule 2, and Schedule 3 semantic asset basenames aligned to the 2025 IRS source PDFs: `f1040s1_*`, `f1040s2_*`, and `f1040s3_*`.
- When a schedule PDF layout changes but the backend compute contract does not, prefer a compatibility field-map layer over unnecessary compute-model churn. The canonical runtime copies must still be published to both `C:\us-tax\pdfs` and `C:\us-tax\us-tax-ui\public\irs`.
- Cleanup is not optional: remove retired schedule runtime assets and stale `_regen` / legacy-name references only after the new 2025 assets are verified in the UI build and targeted regression checks.

## 2026-03-19T15:34:26-04:00
Capital gain/loss Schedule D / Form 8949 rule:
- Treat `capital-gain-loss-taxpayer` and `capital-gain-loss-spouse` as orchestration/supplement forms. Detailed transaction rows should come from statement data when available (`1099-B`, `1099-DA`, and related capital sources), while the capital-gain/loss interview only collects missing direct-aggregation, carryover, nominee, QOF, and manual transaction facts.
- Child capital gain inclusion on the parent return must come from computed dependent-side Form 8814 output, not from manual taxpayer/spouse re-entry on the capital-gain/loss forms.
- Treat `f1040sd_semantic_labels.pdf` / `f1040sd_field_map_semantic.csv` and `f8949_semantic_labels.pdf` / `f8949_field_map_semantic.csv` as the canonical 2025 capital-output assets in both `C:\us-tax\pdfs` and `C:\us-tax\us-tax-ui\public\irs`.
- Keep Schedule D and Form 8949 outputs reconciled from a single normalized capital-source model so direct Schedule D aggregation cases can omit Form 8949 while transaction-detail or adjustment cases still roll into the correct Schedule D lines.
- Do not run dependent asset steps in parallel when one step publishes outputs generated by another. Generate first, then publish, then verify that the runtime-copy hashes match the canonical files.

## 2026-03-19T16:05:00-04:00
Dependent-tab E2E navigation rule:
- `selectPersonTab()` must not fall back to the first tab immediately when a just-created dependent is addressed by first name. After reload, dependent tabs can appear a moment later than the person-tab container itself.
- For dependent first-name tabs, retry exact-label lookup and wait for the shell/network to settle after the click before concluding that the tab is unavailable.
- If a shared person-tab helper changes, rerun at least one dependent-only spec and one sidebar-label spec, because a wrong fallback can silently leave the suite on the taxpayer tab while dependent-specific sidebar items disappear.

## 2026-03-12T12:21:31.5730310-04:00
Statement selection and upload-gating rule:
- Do not treat statement selection alone as an uploaded statement. Selecting a statement may expose its workflow in the UI, but placeholder entries must not satisfy line-level upload gates.
- Taxpayer interview forms that require uploaded statements must gate on statement entries with meaningful saved data, not raw entry counts alone, because statement workflows may auto-create blank first entries.
- In Playwright sidebar assertions, target sections by the exact `.sidebar-section-title` rather than broad whole-section `hasText` matching so new item labels cannot create strict-mode collisions across sections.

## 2026-03-15T00:00:00-04:00 — Lines 14 and 15 Rules

### Form 1040 Line 14 — Total Deductions
- `line14 = line12e + line13a + line13b` (no floor applied here).
- Stored as `deductions.totalDeductions` in the backend output model.
- Computed in `computeLine12()` as the interim sum; finalized in `prepare()` after Schedule 1-A provides line 13b.

### Form 1040 Line 15 — Taxable Income
- `line15 = max(0, line11b − line14)` — floor at zero; taxable income is never negative.
- Form 1040 instruction: "Subtract line 14 from line 11b. If zero or less, enter -0-."
- Stored as `deductions.line15TaxableIncome` in the backend output model.
- Set twice in `TaxReturnComputeService.java`: interim in `computeLine12()` (without line 13b), final in `prepare()` (with line 13b).
- Line 15 feeds directly into line 16 (Tax computation — not yet implemented).

### Naming rule
- Do not confuse line 14 (total deductions) with line 15 (taxable income). On 2025 Form 1040: line 14 = sum of deductions; line 15 = taxable income.

## 2026-03-15T13:00:00-04:00 — Line 13b / Schedule 1-A Implementation Rules

- Form 1040 line 13b = Schedule 1-A line 38 (sum of lines 13 + 21 + 30 + 37). Schedule 1-A is attached only when at least one of its four parts produces a non-zero deduction.
- Schedule 1-A MAGI (Part I line 3) = Form 1040 line 11b + Puerto Rico excluded income + Form 2555 lines 45/50 + Form 4563 line 15. This MAGI is the phaseout base for all four deduction parts.
- Parts II (tips), III (overtime), and V (enhanced senior) require MFJ if the taxpayer is married. The backend must gate these parts on filing status before computing.
- Parts II and III also require a valid SSN for each person claiming the deduction.
- W-2 box 7 (tips) and Form 4137 unreported tips can be auto-imported for Part II. W-2 box 1 overtime is NOT separately identified on the W-2 — the user must enter the overtime portion manually using their pay records.
- 1099-MISC box 3 and 1099-K box 1a can contribute to tips (Part II) and/or overtime (Part III). These statements are already in the statement catalog. Auto-import when uploaded; provide manual entry fallback.
- Part IV car loan interest is return-level (not per-person). Multiple vehicles are supported. The $10,000 cap and phaseout ($100k/$200k MFJ, $200 per $1,000 step, round up) apply to the combined return-level total.
- Schedule C/F deductions must be blocked from Part IV; Schedule E deductions must be subtracted from column (iii).
- Part V (enhanced senior, $6,000 base per eligible person) uses the same age threshold (born before Jan 2, 1961) as Form 1040 line 12d. Pre-populate from existing DOB data.
- YAML split: taxpayer form owns MAGI exclusions, Part IV car loan, and return-level gating; spouse form owns spouse-specific Parts II/III/V amounts only.
- Semantic assets generated: `f4563` (Form 4563, 45 fields), `f1099msc` (1099-MISC, 119 fields), `f1099k` (1099-K, 151 fields). All in `C:\us-tax\pdfs\`. Source PDFs: `f4563.pdf` from `C:\us-tax\docs\IRS-Forms\`; `1099msc.pdf` and `1099k.pdf` from `C:\us-tax\us-tax-ui\PDF\`.

## 2026-03-15T00:00:00-04:00 — E2E Test Authoring Rules

These rules apply whenever a new Playwright e2e test is added to `C:\us-tax\us-tax-be\e2e`. Follow them to avoid breaking existing tests and to keep new tests reliable from the start.

### Running tests

- **Never run tests inside the Claude Code sandbox.** Playwright uses `child_process.spawn` for browser workers, which is blocked by the sandbox (`EPERM`). Always run in a real PowerShell/bash terminal.
- **Always use a fresh `--output` directory** on each run (or omit `--output` entirely). Re-using the same path causes Windows file-lock `EPERM` errors on startup.
- **Set credentials before invoking Playwright:**
  ```powershell
  $env:E2E_SHARED_AUTH_EMAIL = "user@example.com"
  $env:E2E_SHARED_AUTH_PASSWORD = "secret"
  ```
- **To run a subset of tests**, call `npx playwright test` directly with explicit file paths. Do not rely on `-PlaywrightArgs` splatting through the PS1 wrapper scripts, which does not forward file paths reliably.
- **Run with `--workers=1`** for full-suite regression runs. The app is single-user and tests share state via the same Firebase account; parallel workers will stomp on each other's data.

### Page Object Model (POM) navigation methods

- **Never resolve `navigate()` on a DOM-visible field alone.** The Angular directive's `loadEntry()` is async: it resets the model to empty initial values, then fetches and applies saved data. Resolving on field-visible means `fill()` may run before the reset, leaving the form in an empty state after the directive's reset fires.
- **After a statement form's first input field is visible, always add `waitForLoadState('networkidle')`:**
  ```typescript
  await field.waitFor({ state: 'visible', timeout: 10000 });
  await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => undefined);
  ```
  This guarantees the `ensureEntries` list GET and `loadEntry` single-entry GET have both completed and Angular has processed their responses before `fill()` is called.
- **Never use `Promise.race` between `waitForResponse` and `field.waitFor`.** The response listener can match a different form's GET in multi-form contexts. Use the field-visible + networkidle pattern instead.
- **For sidebar navigation to statement forms**, use the retry-click + heading-confirmation pattern (see `Form1099DivPage` and `Form1099BPage`): attempt to click the sidebar item up to 4 times, confirming the form heading `h3` appeared within 8 s each attempt, then wait for the first input field (15 s). This is robust to navigation from any starting state.

### Test setup: filing status and personal forms

- **Prefer API-first saves for setup data** (filing status, spouse seeding, personal forms). Use the helpers in `e2e/tests/helpers/api-flow.ts` (`setupFilingStatus`, `savePersonalForm`, `seedSpouseApi`, `runCompute`).
- **Never rely on the UI alone for MFJ/filing-status setup** in a full-suite run. PrimeNG dropdown setup is flaky when the form hasn't fully loaded. The `setupFilingStatus()` helper tries `page.request` first, then browser `fetch`, then UI fallback.
- **Do not seed data through the UI when you can seed it via API.** The API path is deterministic (no animation, no navigation timing). Reserve UI interaction for the exact behaviors being tested.

### Statement upload gates

- **Do not count raw statement entry counts to satisfy upload gates.** Statement workflows auto-create a blank first entry when a statement is selected. Count only entries with meaningful saved data (at least one non-empty field).
- **When adding a new statement form to the catalog**, ensure the UI component's upload gate uses the "has meaningful data" count, not the raw entry count.

### Sidebar locators

- **Target sidebar sections by their exact CSS class** (`.sidebar-section-title`), not by broad `hasText` matching on the section container. Broad matching causes strict-mode collisions when new items are added to the sidebar.

### PrimeNG interactive controls

- **`selectOption()` for `p-select`:** The control checks `this.disabled` internally and rejects clicks if the binding is `true` at the time of interaction. When a p-select is gated on async-loaded data (e.g. `[disabled]="!hasCombatPay()"`), ensure `waitForLoadState('networkidle')` has been called so the async chain completes and the control is enabled before `selectOption()` runs.
- **`setNumberValue()` for `p-inputnumber`:** Use the helper from `e2e/tests/helpers/form-controls.ts`. Do not use a plain `page.fill()` on PrimeNG number inputs — it races against the Angular formatter.

### SSN handling in backend compute

- Backend `normalize()` trims only (keeps dashes like `"222-22-2222"`). `normalizeSsn()` strips all non-digits. The `computeCombatPay` method uses `normalize()` when matching W-2 `employeeSSN` to the spouse SSN.
- **Always fill W-2 `employeeSSN` with dashes** (e.g. `'222-22-2222'`), not stripped digits, so it matches the stored spouse SSN format that the backend normalizes identically.
- **Verify the employeeSSN field is non-empty after `navigate()` completes.** If box12 data is present but `nontaxableCombatPayElection = 0`, the most likely cause is an empty `employeeSSN` due to a `loadEntry()` race (see Problem 10 in history.md).

### K-1 / authenticated API save patterns

- **When saving personal forms by API in test setup**, use backend semantic payload keys and native booleans/numbers (e.g. `hadQualifiedBusinessIncomeInputs: true`), not UI field IDs or `"Yes"`/`"No"` strings.
- **For API calls that require a real Firebase bearer token**, capture the `Authorization` header from a successful browser request (e.g. after a statement save), then reuse it in `page.request` or browser `fetch` calls for the rest of that test.

### Regression hygiene

- **After any change to a helper (`api-flow.ts`, `auth.ts`, `ui-flow.ts`, `form-controls.ts`, `seed-dob.ts`) or a page class**, run the full regression suite before committing:
  ```powershell
  npx playwright test --project=regression --workers=1
  ```
  A helper change can silently break many tests at once.
- **Do not add `page.waitForTimeout()` as a fix** for timing issues. Identify the async operation (API call, Angular effect, loadEntry) and wait on the correct signal (`networkidle`, `waitForResponse`, `waitFor({ state: 'visible' })`).
- **Keep new specs under `e2e/tests/`** and new page classes under `e2e/tests/pages/` (statement forms in `pages/statement-forms/`, personal forms in `pages/personal-forms/`). Do not place page objects inline in spec files.
- **Verify actions produce their expected results** before concluding a change. Confirm files appear in their intended directories, tests show the expected output, or the backend/UI logs the success to avoid chasing missing artifacts later.

## 2026-03-15T14:00:00-04:00 — E2E Test Failures: Lessons Learned (line 13b / combat pay)

Two categories of failures were observed when the line 13b e2e spec first ran. Both are preventable with the rules below.

### 1. Never overwrite `seedRequiredDob` with a bare `PUT /api/personal/you`

**What happened:** Four line 13b tests called `seedRequiredDob(page)` to set taxpayer DOB, then immediately called `PUT /api/personal/you { ssn: '...' }` to set a different SSN. The bare PUT replaced the entire `you` document with only the SSN field, silently deleting `dateOfBirth`. The backend `validateRequiredDatesOfBirth()` then emitted `MISSING_TAXPAYER_DATE_OF_BIRTH` (blocking: true), causing `computeReturnApi` to return 409.

**Why it was hard to spot:** The 409 error message said only "POST returned 409", not which flag caused it. Three out of seven scenarios in the same spec passed because they either did not call the bare PUT (so DOB survived) or included `dateOfBirth` in their PUT payload.

**Rule:**
- **Never call `PUT /api/personal/you` with a partial payload after `seedRequiredDob`.** The PUT replaces the entire document; any field not included in the payload is lost.
- **To set a non-default SSN**, pass it as an option to `seedRequiredDob`: `await seedRequiredDob(page, { ssn: '333-33-3333' })`. The helper merges over the default payload and always includes `dateOfBirth`.
- **When a test requires a custom DOB** (e.g. a senior taxpayer), include both SSN and DOB in the same call: `await seedRequiredDob(page, { ssn: '555-55-5555', dateOfBirth: '1955-06-15' })`.
- **For MFJ tests**, the spouse also requires a DOB. Include `dateOfBirth` in the `PUT /api/personal/spouse` payload; `seedRequiredDob` only covers the taxpayer.
- **When a compute 409 is unexpected**, retrieve the flags payload with `{ overrideFlags: true }` to identify the blocking flag code before investigating further.

### 2. When a POM `navigate()` exits on field-visible, async component data may still be in-flight

**What happened:** The `CombatPayPage._openFormById()` method exited as soon as `#electCombatPay` was found visible, after one `waitForLoadState('networkidle')`. However, the combat pay Angular component fetches W-2 data asynchronously after initial render to determine `hasCombatPay()`. When the shell imports array grew (new `FormAdditionalDeductionsComponent` added), the component's data fetch occasionally completed after the first networkidle settled, leaving the control in an intermediate "enabled" state. The test then asserted `"No W-2 Box 12 code Q..."` text that had not yet appeared.

**Why it was hard to spot:** The POM already called `waitForLoadState('networkidle')` once. The failure only surfaced after the shell imports array changed, which subtly shifted Angular's initial compilation/change-detection timing.

**Rule:**
- **When a POM method exits on a field being visible, add a second `waitForLoadState('networkidle')` after the field check** if the component's rendered state depends on a secondary async data fetch (e.g. W-2 lookup, API-driven flags). The first networkidle catches the navigation; the second catches the component's own data load:
  ```typescript
  if (await field.count()) {
    await expect(field).toBeVisible();
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => undefined);
    return;
  }
  ```
- **Do not use `waitForTimeout` as a substitute.** It masks the problem and adds fixed delay regardless of actual load time.
- **When a shell import is added**, re-run any specs that rely on async-data-gated UI state (disabled controls, conditional messages) to catch timing regressions early.

## 2026-03-12T12:55:57.2001250-04:00
Filing-status e2e setup rule:
- For flaky filing-status setup in Playwright, prefer the authenticated API save path first: retry `page.request` with a real Firebase bearer token, then retry browser `fetch` with the same token, and only then fall back to the PrimeNG select UI.
- Do not rely on label-variant guessing alone for filing-status selection in long suites; use the stable saved value `Married filing jointly MFJ` and keep the UI path as a last resort.
- 2026-03-12T15:54:00-04:00 Fixed the remaining line 5abc pension e2e regression. form-pension-annuity-income-taxpayer.component.ts now counts only 1099-r and rrb-1099-r entries with meaningful saved data instead of raw entry counts, so blank placeholder statement entries no longer satisfy the pension upload gate. Verified with cd C:\us-tax\us-tax-ui; npm run build and cd C:\us-tax\us-tax-be\e2e; npm test -- --workers=1 --output=test-results-line5abc-fix line5abc-pension-withdrawals.spec.ts (3/3 passed outside the sandbox after an in-sandbox Playwright worker spawn EPERM).
- 2026-03-12T17:05:00-04:00 Started the Playwright suite refactor to reduce setup-related flake without changing frameworks. Added e2e\tests\helpers\api-flow.ts with shared API-first helpers for authenticated personal-form saves, spouse seeding, filing-status setup, and compute execution; added optional shared-auth storage-state support through e2e\tests\setup\auth.setup.ts and conditional Playwright projects (setup-shared-auth, shared-auth-smoke) in playwright.config.ts; added explicit test:smoke and test:regression scripts in e2e\package.json; documented the new pattern in e2e\README.md; and refactored the flaky line2ab-interest-income.spec.ts and line4abc-ira-income.spec.ts MFJ setup/compute paths onto the shared helper layer. Focused verification passed with cd C:\us-tax\us-tax-be\e2e; npm test -- --workers=1 --output=test-results-api-first-refactor line4abc-ira-income.spec.ts line2ab-interest-income.spec.ts (5/5 passed outside the sandbox after the in-sandbox run hit Playwright worker spawn EPERM). Full-suite Playwright regression has not been rerun yet on this refactor.
- 2026-03-12T18:05:00-04:00 Extended the shared Playwright helper refactor to the remaining duplicated filing-status/auth-heavy specs: line3ab-dividend-income.spec.ts, line6abcd-social-security-benefits.spec.ts, and line13a-qbi-deduction.spec.ts now use the shared api-flow.ts helper for filing-status setup and/or shared save/compute flows, joining the earlier line2ab-interest-income.spec.ts and line4abc-ira-income.spec.ts refactors. Focused verification passed with cd C:\us-tax\us-tax-be\e2e; npm test -- --workers=1 --output=test-results-api-first-refactor-2b line3ab-dividend-income.spec.ts line6abcd-social-security-benefits.spec.ts line13a-qbi-deduction.spec.ts (9/9 passed outside the sandbox after sandbox worker spawn EPERM and a stale output-dir EPERM on the first reruns). Full regression then passed cleanly with cd C:\us-tax\us-tax-be\e2e; npm run test:regression -- --workers=1 --output=test-results-full-regression-refactor: 88 Playwright tests passed in 31.1 minutes.
## 2026-03-17T23:00:00-04:00 — Schedule D assets
- Treat 1040sd_semantic_labels.pdf / 1040sd_field_map_semantic.csv as the authoritative Schedule D assets whenever the backend or UI render the Download/Tax Return views for Schedule D.
- Delete the legacy schedule_d_semantic_labels.pdf and schedule_d_field_map_semantic.csv from C:\us-tax\pdfs so only the 2025-named files remain in the shared semantic library.

## 2026-03-17T23:10:13.1205775-04:00
Form 4952 input workflow rule:
- Model Form 4952 as a taxpayer-only Deductions form with backend id `investment-interest-expense-deduction` because the form is attached once per return, including MFJ.
- Keep Form 4952 computation, Schedule A line 9 routing, AMT-side recomputation output, and Tax Return UI rendering deferred until deduction compute work is implemented.
- For this long numeric form, prefer explicit Save-button submission and block implicit Enter-key saves, matching other multi-section numeric workflows.

## 2026-03-17T23:22:41.4925589-04:00
E2E reset stabilization rule:
- `e2e/tests/helpers/api-flow.ts` should retry `DELETE /api/user-data/reset` on transient 5xx responses before failing a spec, because reset is shared setup and occasional backend cleanup races should not create false negatives.
- Backend reset logging must identify whether cleanup failed in personal forms, a specific statement form, or tax-return deletion so reset failures can be diagnosed from logs.

## 2026-03-18T10:20:00-04:00
E2E shared-helper hardening rule:
- Treat every change to `e2e/tests/helpers/*.ts` and `e2e/tests/pages/**/*.ts` as suite-wide risk, even if the immediate task adds only one new spec. Shared helper/page-object changes can break unrelated tests hours later.
- When a shared setup helper fails with a backend 5xx (`clearUserData`, `seedW2StatementApi`, similar API seeders), prefer a narrow helper-layer retry on transient 5xx responses before changing production code. Do not retry 4xx responses, because those usually indicate a real payload/auth bug.
- For statement forms backed by an async `loadEntry()` reset, field visibility is not enough. If a spec depends on values like W-2 `employeeSSN` or Box 12 rows surviving through save, the page object must verify those values still exist immediately before clicking Save and re-apply them if the form was cleared by a late async reset.
- For controls whose enabled/disabled state depends on a secondary async fetch (for example combat-pay `#electCombatPay`), a POM open method must wait for a terminal state: either the control becomes enabled or the explicit "not available" message appears. Do not return merely because the control is visible.
- If an e2e stabilization is clearly test-setup-only, keep the fix in the e2e layer unless production behavior is actually wrong. This keeps the blast radius small and avoids mixing flaky-test mitigation with backend compute changes.
- After fixing a shared e2e helper or page object, rerun the originally failing spec plus at least one unrelated spec that exercises the same helper path, then run the full regression suite before concluding the fix is safe.

## 2026-03-18T10:30:00-04:00
Form 8863 semantic asset rule:
- Treat `C:\us-tax\pdfs\f8863_semantic_labels.pdf` and `C:\us-tax\pdfs\f8863_field_map_semantic.csv` as the canonical semantic asset pair for Form 8863 once generated.
- Use `scripts/generate-semantic-f8863.js` to regenerate the pair from `C:\us-tax\docs\IRS-Forms\f8863.pdf` so future updates stay consistent with the shared semantic-field naming pattern.

## 2026-03-18T11:05:00-04:00
Form 8863 filing-count rule:
- For tax year 2025, treat Form 8863 as **one form per return**, not one per spouse and not one per student.
- Use **one Part III per student** claiming either AOTC or LLC, and attach additional copies of page 2 / Part III when the return covers more students than the printed form page allows.
- A return may claim both AOTC and LLC, but never for the same student on the same return.

## 2026-03-18T07:10:00-04:00
Form 8863 intake split and UI rule:
- Use `education-credits-taxpayer` and `education-credits-spouse` as the active personal-form ids for Form 8863 intake.
- The taxpayer form owns all return-level Form 8863 questions: screening, upload confirmation, MAGI add-backs, and any Form 8862 dependency flag.
- The spouse form is only for additional student Part III entries; do not duplicate a student already entered on the taxpayer form.
- The future tax-return output remains a single consolidated Form 8863, so merge the taxpayer and spouse student arrays into one Part III list during compute.
- Wire `Education credits` under `Deductions` on both taxpayer and spouse tabs, and expose only one `Form 8863` entry in the Tax Return section when backend computation later emits `form8863`.

## 2026-03-21T17:00:00-04:00
Form 8962 (Premium Tax Credit) computation rules:
- **FPL tables**: Use 2024 federal poverty level tables (effective for 2025 returns) — continental: base $15,060 + $5,380/person; Alaska: $18,810 + $6,730; Hawaii: $17,310 + $6,230.
- **Applicable figure**: Piecewise linear interpolation from IRS Table 2. ≤150% → 0.0000; 150–300%: step 0.0004/pt; 300–400%: interpolate through keypoints (0.0600, 0.0663, 0.0725, 0.0788, 0.0850); ≥400% → 0.0850. See `ReferenceData.getApplicableFigure()`.
- **Repayment cap**: IRS Table 5 (2025). <200%: $375/$750; 200–299%: $975/$1,950; 300–399%: $1,625/$3,250; ≥400%: null (no cap). See `ReferenceData.getRepaymentCap()`.
- **Line 6 truncation**: Household income ÷ FPL × 100, truncated (floor) to integer, capped at 401.
- **Part II**: col_d = max(0, col_B − col_C); col_e = min(col_A, col_d). Aggregate across all 1095-A entries per month before computing col_d/col_e.
- **Part III wiring deferred**: Schedule 3 line 9 (net PTC) and Schedule 2 line 1a (repayment) are populated at Line 17; Form 8962 records the values but does not wire them yet.
- **Gate**: `computeForm8962()` returns null if `claimsOrReceivedPtc ≠ true` or if no 1095-A statements exist.

## 2026-03-24T17:08:00-04:00
Form 8801 intake/output rule:
- Use `prior-min-tax-credit-taxpayer` and `prior-min-tax-credit-spouse` as the active Form 8801 personal-form ids.
- Form 8801 is one form per return. The taxpayer form owns the return-level screening, prior-year Form 6251/Form 8801 inputs, and any Part III inputs.
- The spouse form is additive only for MFJ prior-year Form 2555 supplemental input. Do not create a second Form 8801 from spouse data.
- `computeForm8801()` must consolidate taxpayer and spouse intake into one `form8801` output and wire Form 8801 line 25 to Schedule 3 line 6b (`priorYearMinimumTaxCredit`).

## 2026-03-24T19:46:12-04:00
Schedule R intake/output rule:
- Use `elderly-disabled-credit-taxpayer` and `elderly-disabled-credit-spouse` as the active Schedule R personal-form ids.
- Schedule R is one schedule per return. The taxpayer form owns the return-level screening and MFS lived-apart gating; the spouse form is additive only for spouse-specific disability facts and line 13b reductions.
- `computeScheduleR()` must consolidate taxpayer and spouse intake into one `scheduleR` output and wire Schedule R line 22 to Schedule 3 line 6d (`elderlyDisabledCredit`).
- Keep imported DOB, filing status, AGI, nontaxable Social Security, and credit-limit inputs authoritative from existing personal forms and the computed return rather than duplicating them in the Schedule R intake UI.

---

## Form 1040 Mandatory Fields — Documented 2026-03-30

Source: IRS Instructions for Forms 1040 and 1040-SR (2025), `i1040gi_2025.txt`.

These are fields that every filer **must** complete on Form 1040, regardless of income type or tax situation. Fields that are only required in certain circumstances are noted as conditional.

---

### 1. Header — Identity & Contact

| Field | Rule |
|---|---|
| **Taxpayer Name** | Full legal name required; must match SSA records. |
| **Mailing Address** | Street or P.O. box, city, state, ZIP; foreign filers add country/postal code. |
| **Social Security Number (SSN)** | **Mandatory.** "You must enter your social security number (SSN) in the spaces provided." IRS may assess a $50 penalty per missing SSN. Substitute: ITIN for filers ineligible for an SSN. |
| **Spouse SSN** | Mandatory on joint returns; also required on MFS returns (spouse's full name + SSN/ITIN). SSNs must appear in the same order as names. |
| **Daytime Phone Number** | Required on all paper returns; also required for e-filed returns when making a payment. |
| **Occupation** | Every filer must enter their occupation. MFJ filers enter both taxpayer and spouse occupations. |

---

### 2. Filing Status

| Field | Rule |
|---|---|
| **Filing Status checkbox** | **Exactly one** of the five checkboxes must be checked: Single; Married filing jointly; Married filing separately; Head of household; Qualifying surviving spouse. Determined as of December 31 of the tax year. Cannot be left blank — it drives standard deduction amounts, tax brackets, credit eligibility, and gross income thresholds. |
| **MFS — spouse's name** | If MFS, the spouse's full name must appear on the return. |
| **HOH — qualifying person** | If Head of Household, the qualifying person's name must be entered. |

---

### 3. Digital Assets Disclosure

| Field | Rule |
|---|---|
| **Digital Assets checkbox (Yes / No)** | **Mandatory for all filers.** Every return must answer whether the taxpayer received, sold, exchanged, or otherwise disposed of a digital asset. Cannot be left blank. |

---

### 4. Dependents Section (Conditional — required when claiming dependents)

| Field | Rule |
|---|---|
| **Dependent first and last name** | Required for each dependent claimed. |
| **Dependent SSN** | **Mandatory for every dependent claimed**, regardless of age. A return cannot claim a dependent without the dependent's SSN. |
| **Relationship to taxpayer** | Required for each dependent. |
| **Child Tax Credit / ODC checkbox** | Must indicate eligibility for CTC or Other Dependent Credit per dependent. |

---

### 5. Income Lines (all filers)

| Line | Rule |
|---|---|
| **Line 1z — Total wages** | Sum of 1a–1i; must be completed if any wage income exists. |
| **Line 9 — Total income** | Mandatory arithmetic sum: `1z + 2b + 3b + 4b + 5b + 6b + 7a + 8`. Must always be computed. |
| **Line 11b — AGI** | Mandatory: `line9 − line10`. Drives standard deduction eligibility, credit phase-outs, and filing thresholds. |
| **Line 15 — Taxable income** | Mandatory: `max(0, line11b − line14)`. Cannot be negative; floor is zero. |

---

### 6. Standard Deduction / Itemized Deduction Election

| Field | Rule |
|---|---|
| **Standard vs. Itemized election** | Every filer must choose one path. Leaving line 12 blank makes the return incomplete. MFS filers: if one spouse itemizes, the other **must** itemize (cannot take standard deduction). |
| **Age/blind checkboxes** | The two checkboxes for age ≥ 65 and blindness on the standard deduction line must be completed accurately — they increase the standard deduction amount. |

---

### 7. Tax Computation

| Line | Rule |
|---|---|
| **Line 16 — Tax** | Must be computed via the applicable method (Tax Table, Tax Computation Worksheet, QDCG Worksheet, Schedule D Tax Worksheet, FEITW, or Form 8615). Cannot be skipped. |
| **Line 24 — Total tax** | `line22 + line23`; represents the filer's total tax liability. Must always be computed. |

---

### 8. Payments

| Line | Rule |
|---|---|
| **Line 25a — Federal income tax withheld (W-2)** | Required when W-2 withholding exists; enter $0 if none. |
| **Line 33 — Total payments** | Mandatory aggregate of all payments and refundable credits. |
| **Line 37 or Line 34** | Exactly one of "Amount Owed" (line 37) or "Overpayment" (line 34) must be populated, or both are zero (exact break-even). |

---

### 9. Direct Deposit Information (Conditional — required if requesting direct deposit)

| Field | Rule |
|---|---|
| **Routing number** | Must be the RTN of the financial institution; first two digits must be 01–12 or 21–32. |
| **Account number** | Savings or checking account number. |
| **Account type checkbox** | Checking or savings must be indicated. |

---

### 10. Signature & Certification

| Field | Rule |
|---|---|
| **Taxpayer signature** | **Absolutely mandatory.** An unsigned return is not a valid return — the IRS will not process it. |
| **Signature date** | Must be signed on or after the date the return is completed and no earlier than the last day of the tax year. |
| **Spouse signature** | Required on joint returns. Both spouses must sign; neither spouse may sign for the other without a valid POA (Form 2848). |
| **Spouse signature date** | Required on joint returns. |
| **Under penalties of perjury declaration** | Pre-printed on Form 1040; taxpayer signature confirms acceptance of this declaration. Cannot be modified or struck out. |

---

### 11. Electronic Filing — Additional Required Fields

| Field | Rule |
|---|---|
| **Self-Select PIN** | Five-digit PIN chosen by the taxpayer; required in lieu of a paper signature on e-filed returns. |
| **Taxpayer date of birth** | Required for e-file signature authentication. |
| **Prior-year AGI** (or prior-year PIN) | Required to authenticate the e-filed return unless using a practitioner-assigned PIN. |
| **IP PIN** | If the IRS has issued an Identity Protection PIN, it **must** appear in the IP PIN box on every return (paper and e-file). "Failure to include an issued IP PIN on the electronic return will result in rejection." On MFJ returns, both spouses' IP PINs must be entered if both were issued. |
| **Spouse PIN / DOB / IP PIN** | Required on MFJ e-filed returns; both spouses must independently authenticate. |

---

### 12. Paid Preparer (Conditional — required when return is prepared by a paid preparer)

| Field | Rule |
|---|---|
| **Preparer's name** | Required in the Paid Preparer Use Only section. |
| **PTIN (Preparer Tax Identification Number)** | Mandatory; IRS rejects returns with a missing PTIN in the paid preparer section. |
| **Firm name and EIN** | Required when the preparer is employed by a firm. |
| **Firm address** | Required. |
| **Self-employed checkbox** | Preparer must check if not employed by a firm. |
| **Preparer's signature** | Required; may be electronic or handwritten depending on filing method. |

---

### 13. Third-Party Designee (Conditional — required only when designee is authorized)

| Field | Rule |
|---|---|
| **Designee's name, phone, and PIN** | All three fields mandatory when the "Yes" box is checked to authorize a third-party discussion with the IRS. |

---

### Summary — Always-Required Fields (No Exceptions)

1. Taxpayer name, address, and SSN (or ITIN)
2. Filing status (exactly one checkbox)
3. Digital assets yes/no checkbox
4. Occupation
5. Line 9 — Total income
6. Line 11b — AGI
7. Line 15 — Taxable income
8. Line 16 — Tax (via correct computation method)
9. Line 24 — Total tax
10. Line 33 — Total payments
11. Taxpayer signature and date
12. IP PIN (if issued by IRS — mandatory when applicable)

---

### 14. Playwright Save/Compute Rule

When a Playwright spec saves a personal form and then computes immediately afterward, do not use ad hoc `page.waitForResponse(.../compute...)` helpers or bare save-click helpers that return as soon as the PUT resolves. Use the shared guarded helpers in `C:\us-tax\us-tax-be\e2e\tests\helpers\api-flow.ts`, especially `savePersonalFormViaUi(...)` and `computeReturnViaUi(...)`, so the shell waits for overlays, disabled header actions, and delayed post-save UI state to settle before clicking `Compute return`. This rule is mandatory for forms that can leave the header in `Saving data...` briefly after the PUT succeeds, such as `childcare-expenses`.

When a Playwright helper clicks a sidebar form entry, it must verify that the clicked `data-form-id` actually becomes the active sidebar item before returning. Do not treat a successful DOM click as proof that navigation happened; retry the click when the active form does not change. This is especially important for spouse-tab flows where the sidebar can absorb a click while leaving the previous form visible.

Spouse-specific W-2 attribution helpers and UI components must resolve spouse identity through the shared split-form spouse helper, not raw legacy `spouse` reads. When attributing spouse-only W-2 values, require an exact spouse SSN match; if spouse SSN is unavailable, treat the spouse-specific total as unavailable rather than counting unmatched taxpayer W-2 rows.

### 15. YAML-Backed Personal Forms

When aligning an active Personal-tab UI flow to a YAML form in `C:\us-tax\yamls`, the active UI component must use the YAML field names as its primary contract and keep any legacy keys only as a compatibility bridge at the service/backend boundary. Do not keep the active component authored against legacy field names after the YAML-aligned flow exists.

For these YAML-backed Personal forms, every boolean question shown in the active UI must render as an explicit native Yes/No radio group, not as a checkbox or dropdown, unless the YAML or a later user instruction explicitly says otherwise.

For form-level user input design, apply the TurboTax interview pattern inside each form rather than rendering the whole form as a static data-entry sheet. Each form should begin with the highest-value screening question available, reveal only the follow-up questions made relevant by the user's answer, and keep the active UI focused on one primary question or one tightly related question group at a time. Hidden branches must not be validated, required, or saved unless they are currently applicable. Labels and follow-up prompts should carry forward the user's context such as person name, employer, property, dependent, or statement identity whenever that context makes the question clearer.

Operationally, this means:
- start each form with a gating or screening question when one exists
- reveal downstream questions only when the parent answer makes them relevant
- prefer one primary question per row or section unless two fields are naturally inseparable
- hide uncommon branches until the user explicitly enters that uncommon path
- clear, ignore, or exclude hidden fields consistently so stale answers do not leak into saved data or validation
- keep progress understandable through sections, summaries, and saved-state cues while preserving a focused active step
- use explicit Yes/No radio groups for ordinary boolean questions

For expanded dependent identification data, keep the IRS face-page Form 1040 dependent table mapping intact (name, SSN, relationship, CTC, ODC), and surface any additional YAML-driven dependent facts in the Form 1040 preview as supplemental dependent detail rather than overloading unrelated face-page fields.

When writing or fixing Playwright helpers for person-tab navigation, do not assume `Add dependent` immediately creates a visible dependent tab. In the current shell behavior, a dependent tab appears only after the dependent has been saved. Helpers must support the draft-dependent state by continuing once the dependent form is active even if no dependent tab is yet rendered.

When a Personal-tab identification-style form captures high-sensitivity PII such as SSN or date of birth, follow the shared header-form pattern: keep the same field ids/contract, but mask the value by default once it exists and provide an explicit eye-toggle control to reveal it. This applies to dependent identification as well as taxpayer/spouse identity forms.

### 16. Form 1040 Line Implementation Workflow

When working on any Form 1040 line, the first step is always to understand the requirement before implementing code. Start with the existing line documentation in `C:\us-tax\lines` whenever a file for that line already exists. Use the current Form 1040 semantic assets in `C:\us-tax\pdfs\f1040_semantic_labels.pdf` and `C:\us-tax\pdfs\f1040_field_mapping_semantic.csv` as the local reference for field wording, checkbox semantics, line placement, and related face-page mappings.

For substantive tax requirements, use the latest authoritative information only. Built-in knowledge, local notes, and books in `C:\us-tax\docs\books` can help frame the problem, but current official IRS guidance and current-year IRS instructions/publications are the primary authority. Treat older books, prior notes, and existing implementation behavior as secondary cross-checks rather than final authority. If sources conflict, prefer the latest official IRS guidance.

Before changing a line, read the existing Angular UI flow in `C:\us-tax\us-tax-ui`, the matching YAML form contract, the Quarkus backend implementation in `C:\us-tax\us-tax-be`, and the related unit and e2e tests. Preserve the current codebase conventions: centralized reference data, commented backend logic, meaningful log statements, YAML rules from `C:\us-tax\rules.md` and `C:\us-tax\history.md`, and the shared Playwright helper patterns already in the repository. Increase unit and e2e coverage whenever a new rule, branch, or regression surface is identified.

Use `C:\us-tax\turbotax.md` and the screenshot corpus in `C:\us-tax\Maaz\turbo_tax` to improve question flow, reveal logic, and YAML-backed form design. Apply the TurboTax interview style at the form level rather than blindly copying screens. Keep outstanding scope and constraints in mind by checking `C:\us-tax\outstanding.md` and `C:\Users\alimu\.claude\projects\C--us-tax-us-tax-be\memory\MEMORY.md` when relevant.

Treat the dataflow diagram for the line in `C:\us-tax\diagrams` as a first-class implementation reference. The diagrams consistently capture the contract for a line in terms of: user-form inputs, statement/import inputs, reference or derived inputs, validation gates, core computation, emitted outputs, downstream line dependencies, and required supporting forms or attachments. When implementing or changing a line, keep the line markdown spec, the draw.io dataflow diagram, the Angular form/YAML inputs, the backend computation, and the tests aligned. If logic changes materially, update the diagram as part of the work rather than leaving it stale.

For Form 1040 line analysis and implementation, distinguish clearly between input forms and output forms. Input forms are taxpayer-facing UI forms and statement entries that collect facts used to compute a 1040 line, such as W-2s, 1099s, and guided user-input forms defined in the Angular app and backed by YAML. Output forms are computed schedules, worksheets, and attachments generated while computing the return, such as Schedule 1 or other IRS forms submitted with Form 1040. Output forms may receive values from statements, personal forms, reference data, and the 1040 computation itself, but they are not primary taxpayer-input sources for the line unless the product explicitly models them as such. When evaluating whether a line is implemented correctly, judge the line first by whether the correct upstream input facts are gathered and mapped, then by whether the computation routes those facts into the right 1040 fields and any required output forms without double counting or circularly treating computed output forms as original user input.

Self-employment income and business income are out of scope for this workstream unless the user explicitly changes scope. New e2e tests and changes to shared e2e helpers must not break existing e2e suites. When adding coverage, prefer shared helpers, preserve backwards compatibility in test utilities, and rerun the related existing specs to confirm no regressions were introduced.

### 17. No facilitation of misrepresentation or under-reporting — absolute, non-overrideable

**Established 2026-05-30.**

Under no circumstances may the application facilitate a user misrepresenting or under-reporting income, withholding, or any other tax-significant fact on the return. When the application's own validators detect that proceeding would produce a return the application itself knows to be wrong — wages missing, withholding lost, an income source that has no destination on the return, an attachment the IRS requires that is not generated, or any other gap the IRS would catch via document-matching — that is an **absolute blocking** scenario. The user must fix the input before the return can be generated, previewed for filing, or submitted. There is no override path, no "compute anyway" escape hatch, and no `overrideFlags=true` bypass for these flags.

**Flags in this category are not overrideable.** Examples (the list is not exhaustive — future validators that detect a similar silent-failure mode default to non-overrideable):

- `MISMATCH_CONTRACTOR_HOUSEHOLD_NEEDS_FORM_8919_TAXPAYER` / `_SPOUSE` — contractor-flagged household-employer wages with no matching Form 8919 firm row. Wages would disappear from the return; the IRS would issue a CP-2000 notice for the missing income.
- `WITHHOLDING_ON_CONTRACTOR_HOUSEHOLD_FIRM_NEEDS_1099_STATEMENT_TAXPAYER` / `_SPOUSE` — federal income tax withheld on a contractor-flagged household row with no matching 1099 statement on file. Withholding credit would be lost from Line 25b.
- `STATEMENT_DOES_NOT_BELONG_TO_FAMILY` — a statement (W-2, 1099, K-1, etc.) whose recipient SSN/TIN matches no one in the family. Including it would inflate the return with someone else's income.

Distinguish these from **judgment-call flags**, which may remain overrideable: situations where the user has visible information the validator cannot see, or where the "right answer" depends on a choice the user is entitled to make (for example, an advisory that says "your refund could be larger if you claim X" — the user may legitimately decline X). Judgment-call flags continue to support the existing "compute anyway" UX path. Misrepresentation / under-reporting flags do not.

The user-interface error message for a non-overrideable flag must:

1. **Name the affected dollar amount and the specific input** (employer, statement, line) that produced it.
2. **Spell out the consequence in plain English** — what will be missing from the return and the IRS reaction the user can expect (matching notice, interest, possibly penalties) — not just the form name.
3. **Offer the concrete resolution paths** (add the matching row, change the answer, delete the statement), with no "proceed anyway" option.

Implementation discipline: the override list is **opt-in, not opt-out**. A flag does not become overrideable by accident. Any new flag a developer wants to add to the overrideable category must be explicitly justified (the user has visible information the validator can't see, or the situation is a genuine judgment call) and reviewed against this rule. When in doubt, default to non-overrideable.

The application's job is to prevent the user from filing a return it knows to be wrong. Convenience never trumps correctness here.

### 18. IRS audit risk or CP2000 risk — always blocking

**Established 2026-06-04.**

Any validator that detects a condition the IRS would catch through document matching (CP2000 notice) or that would survive document matching but be caught on examination (audit risk) must emit a **blocking** flag — never a non-blocking advisory.

Rationale: a non-blocking advisory leaves the decision to the user, and users routinely ignore advisories. When the application can predict that ignoring the advisory will produce an IRS notice (CP2000) or an unfavorable audit finding, the application has the knowledge the user does not — and that knowledge gap is exactly what the validator is supposed to close. Filing a return that the application has independently flagged as IRS-notice-bait is not a service to the user.

**What counts as "CP2000 risk":** the IRS document-matching pass could find a discrepancy from 1099-series statements, Forms 5498, W-2 data, or any other AcroForm-matched data source and issue an automated underreporter notice. Cleared by either correcting the input or attaching a substantiating statement that resolves the apparent discrepancy.

**What counts as "audit risk":** the return looks consistent on document matching but a substantive rule (a per-person cap that aggregates across years, a once-per-lifetime election, a required attachment that has no AcroForm field) is being violated. Discovered only on examination. Typically results in tax + interest + 20% accuracy-related penalty under Internal Revenue Code §6662 if material.

**What does NOT count as "CP2000 / audit risk" (and may stay non-blocking advisory):**

- The return is already mathematically correct (the application has applied a silent cap or other adjustment internally) — for example, `QCD_EXCEEDS_ANNUAL_CAP_TAXPAYER` after the silent $108,000 cap is applied. The advisory exists for user education.
- The failure mode hurts only the taxpayer (over-payment of tax), not the IRS. Example: `IRA_TAXABLE_AMOUNT_NOT_DETERMINED_NO_BASIS_TAXPAYER` — basis recovery the user forgot to claim reduces *their* tax, not the IRS's collection. The IRS will not issue a notice for an over-payment. Amend within 3 years per Internal Revenue Code §6511.
- Pure user-education prompts that surface information the user would benefit from knowing but that do not change return correctness.

**Override discipline.** Flags promoted to blocking under this rule support the standard `overrideFlags=true` user-acknowledgement path (unlike §17 flags, which are absolutely non-overrideable). The "audit risk / CP2000 risk" category is about preventing accidental filing — it is not an absolute bar. The user may override after reviewing the consequences. The override path must surface the advisory message in the override-confirmation dialog so the user understands what they are acknowledging.

**Implementation checklist when emitting a blocking flag under this rule:**

1. Set the `blocking` constructor argument to `true`.
2. Make the flag message specific — name the dollar amount, the input field, the IRS rule (Internal Revenue Code section or IRS Publication number), and the predicted IRS reaction.
3. Lock in with a unit test that asserts both `code` and `blocking == true`.
4. Update the affected line's `XLS/Computations/<line>.md` advisory-flag table to record the new severity classification.
5. If the existing user flow has no remediation path (no input field to fix, no attachment-confirmation field), document it as a known UX gap — the override path is the interim resolution.

**Flags currently blocking under this rule (Line 4b — added 2026-06-04):**

- `QCD_SIE_EXCEEDS_LIFETIME_CAP_TAXPAYER` / `..._SPOUSE` — split-interest-entity Qualified Charitable Distribution exceeds the $54,000 lifetime per-person cap (Internal Revenue Code §408(d)(8)(F)). Discovered on audit; lookback up to 6 years.
- `IRA_ROLLOVER_ATTACHMENT_REVIEW` — rollover into a qualified plan or completed in the following calendar year requires an explanatory attachment. The mismatch between 1099-R box 7 code and Line 4b is detectable on document matching → CP2000 risk.
- `IRA_QCD_SIE_ATTACHMENT_REVIEW` — one-time Qualified Charitable Distribution to a split-interest entity requires an attachment statement (Internal Revenue Code §408(d)(8)(F)). Disallowance on audit converts the exclusion to taxable income.
- `FORM_8606_LINE4_EXCEEDS_LINE1_TAXPAYER` / `..._SPOUSE` — Form 8606 line 4 (post-year-end contributions for the tax year) exceeds line 1 (current-year nondeductible contributions). Detectable via Form 5498 cross-match → CP2000 risk.


## Separate-filing splits (HOH-split feature) — 2026-06-20

Filing status is a **user-declared per-tab election**, not optimizer-derived. The
Family Head form holds the household election; `filing-status-spouse` holds the
spouse's own election. When the household does not file jointly, each spouse is
**MFS or HoH** (never MFJ/Single/QSS) and the app generates two separate returns.
Guardrails:

- **Per-leg status from the election, never hard-coded.** `MfsFormScoper.
  overrideFilingStatusToSeparate` sets each scoped leg's `filingStatus` from the
  Family Head election (mfs_head) / `spouseFilingStatus` (mfs_spouse). Absent a
  spouse election it defaults to MFS (legacy behavior). Do NOT reintroduce a
  forced-MFS override.
- **HoH legs name no spouse**; MFS legs name the OTHER spouse (mfs_head → the
  spouse, mfs_spouse → the Family Head — the spouse-name flip).
- **Considered-unmarried (§7703(b)) is REQUIRED for a married HoH election** and
  is validated Tier-2: `validateConsideredUnmarriedForHoh` runs ONLY on the
  unscoped/primary compute (`SCOPED_FORMS_OVERRIDE == null`) — never per scoped
  leg — and emits blocking-but-overrideable flags
  (`HOH_HEAD_NOT_CONSIDERED_UNMARRIED`, `HOH_SPOUSE_NOT_CONSIDERED_UNMARRIED`,
  `HOH_DUPLICATE_QUALIFYING_PERSON`). Decision logic is the pure
  `ConsideredUnmarriedEligibilityService.hohElectionProblems(...)`.
- **MFS credit disallowances must key on `"Married filing separately"` only** —
  never a combined MFS-or-HoH predicate — so an HoH leg correctly re-enables EIC
  / education credits / dependent-care.
- Each HoH return needs its own **distinct** qualifying child; per-dependent
  attribution is `dependent.claimedByMfs` (required under HoH).








