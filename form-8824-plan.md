# Form 8824 (Like-Kind Exchanges) - Implementation Plan

_Authored 2026-10-23. Owner approved the intake field list the same day ("approved"). Status: BUILT 2026-10-23 - preview
awaiting the owner's visual review._

## Why
A like-kind exchange could be entered only through the statement API under PDF slot keys (`Form8824Mapper`, no screen ever
used it), and compute read just the typed Part III line 22, always as a long-term capital gain. Line 21 (section 1245
recapture) never became ordinary income, business or rental property went to Schedule D instead of Form 4797, and the basis of
the property received (line 25) was never figured.

## Shape (the app's normal input form -> compute -> preview)
1. **Intake** `like-kind-exchanges-taxpayer` / `like-kind-exchanges-spouse` (Incomes), one entry per exchange, semantic names
   (`taxpayerExchanges` / `spouseExchanges`). `pf_like_kind_exchange` + `pf_like_kind_exchange_item`, V380.
2. **Compute** `Form8824Compute` (helper class - constant pool):
   - Line 15 = cash + other property received + net liabilities assumed by the other party (their excess over the liabilities
     you assumed, cash you paid and other property you gave up), reduced (not below 0) by exchange expenses; expenses not used
     there go on line 18 with the basis and the net amount paid. Lines 17-20, 22-25 as printed.
   - Line 21: the smaller of the section 1245 depreciation (up to line 19) and line 20 plus the FMV of the non-section 1245
     like-kind property received (instructions, line 21; section 1245(b)(4)). Straight-line section 1250 property: none.
   - Lines 25a/25b: line 25 split by the FMV of the section 1245 part received; investment land has no 25a.
   - Investment property: line 22 (+ line 14) to Schedule D line 11 or line 4 by lines 3 and 4. Business, rental, or anything
     depreciated (section 1221(a)(2)): a Form 4797 entry - line 21 to line 16, line 22 to line 5 (over a year, section 1231
     netting and lookback, unrecaptured section 1250 gain to Schedule D line 19) or line 16.
   - Related party (Part II): an exchange in 2023-2024 is filed again; a disposition within 2 years with no line 11 exception
     makes line 24 taxable this year as if the exchange had been a sale.
   - Blocking flags: date transferred / acquired / received missing, transferred after 2025, not real property, U.S. and
     foreign property, identification after 45 days, receipt after 180 days. Advisories: received after April 15 (extension),
     depreciated "investment" property, line 14 reported like the exchange, line 11c explanation, related-party disposition,
     an earlier unrelated exchange (nothing to file).
3. **Output** `Form8824` model (one per exchange; `fields` from the finished entry, names from
   `f8824_field_map_semantic.csv`), `out_form_8824` (V380), `Form8824ListOutputMapper`, `TaxReturnComputation.form8824s`.
   The Form 4797 preview gains lines 5 and 16.
4. **Preview** `form-tax-return-8824`: `pure-pdf-preview` over `f8824_elements.json` (`scripts/generate-f8824-elements.py`,
   both pages), exchange selector, sidebar Tax Return section, both UI repos.
5. **Retire** the statement path: `Form8824Mapper.formIds()` is empty (dormant, like `Form6252Mapper`); the transcribed-entry
   path in compute stays for the unit tests that feed it.

## Deviations from the approved list (reported to the owner)
- The out-of-scope cases (a former main home with the section 121 exclusion, an installment note received, Part IV section
  1043) and multi-asset exchanges have no field that identifies them, so no flag can fire; the form's screening hint says they
  are not handled. A Yes/No question would need the owner's sign-off.
- Depreciation on property marked "investment" sends it through Form 4797 (depreciable property is not a capital asset), with
  an advisory.

## Tests
- Unit: `Form8824ComputeTest` (12) - the instructions' Taylor/Finley examples line by line, exchange expenses, recapture
  without boot, sc_00291 A/C/D returns, short-term, a rental through Form 4797 (tax 13,455), related-party disposition and
  exception, an earlier unrelated exchange, the blocking checks and their exact limits. Mutation-tested.
- e2e: `like-kind-exchanges-form-8824.spec.ts` (UI save/reload, compute, preview; rental through Form 4797; 45-day block);
  `form4797-installment-likekind.spec.ts` and the B26 case in `open-questions-b10-b14-b26-b31-b45.spec.ts` moved to the
  intake form.
