# Form 6252 (Installment Sale Income) - Implementation Plan

_Authored 2026-10-22. Owner approved the intake field list the same day ("approved, go ahead and build it"). Status: BUILT 2026-10-23 - preview awaiting the owner's visual review._

## Why
Form 6252 could never be entered. `form-6252.component.ts` (a statement-style replica, 2026-03) saved opaque PDF slot keys,
`Form6252Mapper` was left dormant because of that, the picker entry was removed on 2026-07-12 ("a tax-return form, not a
statement") with no replacement, and no Form 6252 output or preview existed. Every Form 6252 computation (B14 arithmetic, the
09bd4733 Form 4797 link, B37 and its follow-up) was reachable only from unit tests.

## Shape (the app's normal input form -> compute -> preview)
1. **Intake** `installment-sales-taxpayer` / `installment-sales-spouse` (Incomes), one entry per sale, semantic names.
   `pf_installment_sale` (uid, tax_year, owner_role, has_installment_sale) + `pf_installment_sale_item` (per sale). V376.
2. **Compute** `Form6252Compute` (helper class - TaxReturnComputeService constant pool): each sale -> a Form 6252 entry map
   under the semantic keys compute already reads (`line1DescriptionOfProperty` ... `line37SubtractLine36FromLine35`), lines
   7/10/13/14/16-20/22/24/26 and 31-35/37 figured; these replace `statementDataService.listEntriesWithData(uid, "6252")`.
   - Business or rental property: a Form 4797 entry is synthesized for the sale (year of sale: Part III property with
     line 20 = line 5, line 21 = line 8 + line 11, line 22 = line 9, line 26a = 0 for real property / blank otherwise; an
     earlier-year sale: installment income only), so the existing Part III / B37 machinery figures the section 453(i)
     recapture (Form 6252 line 12) and puts line 26 on Form 4797 line 4 (over a year) or line 10. A typed Form 4797 property
     that already matches the sale wins.
   - Capital asset: line 26 to Schedule D (existing path).
   - Flags: line 14 or 24 zero or less (blocking), contingent sale without a stated maximum (blocking), depreciable property
     to a related party (advisory), section 453A interest (advisory), typed line 12 / 19 differing from the figured value.
3. **Output** `Form6252` model (one per sale; `fields` built last, semantic names from `f6252_field_map_semantic.csv`),
   `out_form_6252` (V376), `Form6252OutputMapper`, `TaxReturnComputation` slot.
4. **Preview** `form-tax-return-6252`: thin `pure-pdf-preview` wrapper over `f6252_elements.json`
   (`scripts/generate-f6252-elements.py`, Form 982 method), sidebar Tax Return section, both UI repos.
5. **Retire** the slot-key `form-6252` component and its shell route. Kept: the dormant `Form6252Mapper`, `se_form_6252` and
   the transcribed-entry path in compute (nothing was ever saved there; ~100 unit-test references feed it), with the B14
   arithmetic advisory, which only fires on transcribed entries.

## Deviation from the approved list (reported to the owner)
- Item 3 `propertyUse` has three options, not two: investment or personal (capital asset) / business or rental real
  property (buildings - section 1250) / other business or rental property (equipment, vehicles - section 1245). The
  recapture differs (section 1250 straight-line: no ordinary recapture, unrecaptured gain at 25%; section 1245: the
  depreciation is ordinary) and nothing else on the form says which it is.

## Tests
- Unit: `Form6252ComputeTest` (arithmetic, year of sale vs earlier year, contingent, related party Part III, flags;
  business real property and equipment through the synthesized Form 4797; mutation-tested).
- e2e: the intake form saves and reloads; compute -> preview fields; B37 spec rewritten through the intake.
