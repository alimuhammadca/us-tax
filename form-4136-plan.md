# Form 4136 (Credit for Federal Tax Paid on Fuels) - Implementation Plan

_Status: ALL STAGES DONE 2026-11-15 (Stage A owner-reviewed: "go ahead"). Authored 2026-11-15 (outstanding.md, Other payments / credits: "Lines 12 and 13c are typed totals: Form 4136 and Form 3800 Part III are
not produced"). Owner: "go with A. But make sure that the new form is built correctly. Look at the workflow of how other tax return forms
were built. A tax return form must be implemented pure html/css form rather than a PDF embedded form." Scope approved: lines 1-4._

## Background
- Schedule 3 line 12 is a typed total (`creditForFederalTaxOnFuels` on Other payments, "Form 4136 line 17 total"); Form 4136 is never
  produced, so a return claiming line 12 lacks its required attachment.
- The repo's `docs/IRS-Forms/f4136.pdf` was the 2024 edition. The 2025 form (irs.gov/pub/irs-prior/f4136--2025.pdf, created 12/18/25)
  changed: a new **Part I, Information About Your Business** (A qualifying business Yes / No; B number of qualifying business activities -
  more than one needs a Schedule A (Form 4136) for each; C business name; D EIN; E principal business activity code; F make, model and
  type of the equipment that used most of the fuel), and a new **column (d), Actual fuel cost from your records** on lines 1-16.
  Part II columns: (a) type of use, (b) rate, (c) qualified gallons, (d) actual fuel cost, (e) amount of credit, (f) CRN.
- 2025 Instructions for Form 4136 (Dec 10, 2025): biodiesel / renewable diesel (lines 10a-10c), SAF (10d) and alternative fuel (lines
  12a-12i) credits expired after 2024; line 11 is still printed. Amount of credit = rate x gallons; a bracket means one combined result.
  Line A exemption: undyed kerosene bought (not from a blocked pump) and used at home for heating, lighting or cooking - answer Yes on A,
  skip B-F; claim on line 4a with type of use 8. Gasoline for personal use, commuting or ride sharing doesn't qualify.
- Brackets on the printed form (one column (d) / (e) amount and one CRN for the group): 1a+1b+1c (CRN 362), 3a+3b (360), 4a+4b (346);
  every other line has its own amount.

## How tax-return forms are built here (surveyed 2026-11-15: form-8958-plan.md, schedule-h-plan.md, the Form 982 method)
- Every `form-tax-return-*` preview is pure HTML/CSS. New forms: `generate-semantic-<n>.js` (hand-made field names by printed
  line / column, checked against the rects) -> `pdfs/f<n>_field_map_semantic.csv` + `f<n>_semantic_labels.pdf`, copied to
  `us-tax-ui/public/irs`; `generate-f<n>-elements.py` (PyMuPDF: texts, rules, shaded rects from the IRS PDF; fields from the CSV) ->
  `public/irs/f<n>_elements.json`; a thin `pure-pdf-preview` wrapper bound to the computation's `fields` map.
- `fields` is built LAST from the finished model, as strings (a number renders blank).
- Sidebar entries use the TEMP `if (true /* real gate */)` convention. Stop after Stage A for the owner's visual review.

## Stage A - the blank form, pure HTML/CSS (stop for owner visual review)
1. `docs/IRS-Forms/f4136.pdf` replaced with the 2025 edition.
2. `us-tax-be/scripts/generate-semantic-4136.js` - every field named by its printed line and column: `name`, `tin`, `partI_lineA_yes`
   / `_no`, `partI_lineB_activities`, `partI_lineC_business_name`, `partI_lineD_ein`, `partI_lineE_activity_code`, `partI_lineF_make` /
   `_model` / `_equipment_type`; per Part II row `line1a_type_of_use`, `line1a_rate`, `line1a_gallons`, `line1c_fuel_cost_dollars` /
   `_cents`, `line1c_credit_dollars` / `_cents`, `line1b_crn` ...; `line3_dye_exception` ...; `line17_total_dollars` / `_cents`. Rows are
   assigned from the field y and the printed line labels, columns from x (checked: one field per row and column).
3. `us-tax-be/scripts/generate-f4136-elements.py` (copy of the Schedule H / Form 8958 extractor) -> `public/irs/f4136_elements.json`;
   4 pages; every field name in the CSV and unique; every name resolves in the published labelled PDF.
4. Thin wrapper `form-tax-return-4136` (reads `computation().form4136.fields`); shell import + render + sidebar entry
   `tax-return-4136` under the TEMP gate; `data/tax-scenarios.ts` form ids if listed there.
5. Side-by-side images (IRS page vs app preview, normal and "Show all fields") for review.

## Stage B - the intake screen (Credits section; owner-approved new fields)
- New personal form `fuel-tax-credit` (pf_fuel_tax_credit, V483; PersonalResource allow-list; UserDataBulkDelete catalog). One per
  return: the Family Head's on a joint return (the Spouse tab shows a note), each spouse's own when filing separately.
- Part I: A (Yes / No; "home kerosene only" exemption skips B-F), B (number of activities; more than 1 blocks - Schedule A (Form 4136)
  isn't supported), C-F.
- Part II lines 1-4: per row gallons; the type of use where the form leaves it blank, picked from the codes the instructions allow
  (1c: 4, 5, 7, 11, 13, 14, 15; 2b: 1, 2, 9, 10, 11, 13, 14, 15; 3a / 4a: 2, 6, 7, 8, 11, 13, 14, 15; 3d / 4c: buses - none; 4e / 4f:
  2); actual fuel cost per amount row (one per bracket); the dye exception boxes for lines 3 and 4 (an explanation must be attached -
  advisory). The rate, the credit and the CRN are shown, not typed.
- Lines 5-16 aren't offered (registered vendors / credit card issuers / aviation kerosene / emulsions / exported dyed fuels; 9, 10, 12
  reserved) - noted on the screen and in outstanding.md. **Corrected 2026-11-24:** line 11 (nontaxable use of alternative fuel) did NOT
  expire - the 2025 instructions still give it; what expired after 2024 is the alternative fuel credit (line 12, reserved). Lines 5,
  11 and 14 were added that day (outstanding.md 1B-19).
- Other payments: the typed "Form 4136 line 17 total" is removed (the app isn't in production - dropped outright); line 12 shows the
  figured amount with a link to the new screen.
- Screen Review Checklist applied; screenshot-compared with a fixed Credits screen.

## Stage C - computation and the form
- `Form4136Compute`: column (e) = rate x gallons, rounded to cents, combined for each bracket; line 17 = sum -> Schedule 3 line 12.
  A positive line 17 needs Part I line A Yes; blank answers that the form needs block (FUEL_TAX_CREDIT_*). Kept out of
  TaxReturnComputeService (constant-pool limit).
- `fields` built last from the finished model: header (name, TIN), Part I, rows (type of use, rate, gallons, (d) and (e) split into
  dollars / cents as printed, CRN), line 17.
- Persistence: the per-person attached-forms holder (`AttachedForms.form4136List`, V387 JSON - the Schedule H pattern); no output
  table.
- Done as planned, with: line 17 rounds to cents on the form, Schedule 3 line 12 to whole dollars (roundMoney); the screen is in the
  Deductions section next to the other credit screens; the line A No / no gallons / Part I / type of use / fuel cost / home kerosene
  checks block; the dye exceptions and the income inclusion are advisories.
- The preview picks the active tab's copy by owner role.

## Stage D - tests, docs, commits
- Unit: rates x gallons, the brackets, line 17 -> Schedule 3 line 12, `getFields()` strings (header, a bracket row, line 17), the
  blockers; mutation-checked.
- e2e: screen save / reload, the figured line 12, the preview's fields by `data-field-name`, blank preview before compute.
- Docs: history.md, outstanding.md, rules.md, the YAML (`yamls/4136-fuel-tax-credit-taxpayer.yaml`), memory.

## Not in scope (recorded in outstanding.md)
- Lines 5-16 and Schedule A (Form 4136) for more than one business activity.
- The credit's inclusion in income ("Include any credit ... in your gross income if you claimed the total cost of the fuel ... as an
  expense deduction") - stays a typed Schedule C / F other-income amount.
- Schedule 3 line 13c (Form 3800 Part III) stays typed until Form 3800 Part III is built.
