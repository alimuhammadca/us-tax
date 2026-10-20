# Form 8958 (Allocation of Tax Amounts Between Certain Individuals in Community Property States) — Implementation Plan

_Authored 2026-10-20 (OPEN_QUESTIONS B108). Status: ALL STAGES DONE 2026-10-20 (Stages A-B owner-reviewed; Stage C with the capital-gains split, as the owner asked)._

## Background
- A27 (`withCommunityPropertySplit`, V344) splits W-2 box 1 / withholding and 1099-INT / 1099-DIV amounts between the two
  MFS returns in a community property state, and the advisory `COMMUNITY_PROPERTY_ALLOCATION_APPLIED` says "Attach Form
  8958" — but the app never produces the form.
- Form 8958 (Rev. November 2023): page 1 lines 1 wages (each employer), 2 interest (each payer), 3 dividends (each payer),
  4 state refund, 5 self-employment income, 6 capital gains, 7 pension income, 8 rents/royalties/pass-throughs; page 2
  lines 9 deductible part of SE tax, 10 SE tax, 11 taxes withheld, 12 other items. Columns A total, B and C allocated to
  each spouse (SSN in each column head). Pages 3-4 are instructions.

## How tax-return forms are built in this app (surveyed 2026-10-20)
- All 79 `form-tax-return-*` previews are pure HTML/CSS (no embedded PDF). Families: 38 own renderers ported from a
  standalone `Downloads\f<form>\form.js`; 34 thin wrappers over the shared `pure-pdf-preview` drawing a
  `f<form>_elements.json`; 7 helpers/wrappers.
- Current practice (Form 982, 2026-09-17): `generate-semantic-<form>.js` (hand-crafted meaningful field names, verified
  against field rects; CSV + labelled PDF to `C:\us-tax\pdfs`, copied to `public/irs`) + `generate-f<form>-elements.py`
  (layout extracted directly from the IRS PDF with PyMuPDF) + thin `pure-pdf-preview` wrapper bound to
  `computation().form<n>.fields`. The July 2026 batch generators gave some forms positional names (`page1_0_f1_3_0`).
- No `Downloads\f8958` renderer folder exists, so Form 8958 follows the Form 982 path.
- Sidebar: TEMP 2026-05-18 convention — every output form pushed with `if (true /* <real gate> */)`.
- MFS spouse returns (persistent MFS) are computed by id, not persisted; the UI keeps them per return id and only the
  Form 1040 preview reads them (`[taxReturnId]="activeTabTaxReturnId()"`). Form 8958 is MFS-only, so it needs the same input.

## Stage A — the blank form, pure HTML/CSS (stop for owner visual review)
1. `C:\us-tax\docs\IRS-Forms\f8958.pdf` (Rev. 11-2023).
2. `us-tax-be/scripts/generate-semantic-8958.js` — meaningful names per printed line / row / column, verified by rect
   → `C:\us-tax\pdfs\f8958_field_map_semantic.csv` + `f8958_semantic_labels.pdf`, copied to `us-tax-ui/public/irs`.
3. `us-tax-be/scripts/generate-f8958-elements.py` — PyMuPDF texts / rules / shaded rects from the two form pages; fields
   from the CSV → `us-tax-ui/public/irs/f8958_elements.json`.
4. Checks: every element field name in the CSV and unique; every name resolves in the published labelled PDF.
5. Side-by-side images (IRS page vs app preview, normal and "Show all fields") for the owner's review.
   - Review found black ovals on the column-head SSN boxes: the shared renderer paints a small white unstroked rect as a
     radio bullet; on 8958 those are the white backgrounds under text fields. Fixed in generate-f8958-elements.py (white
     fills exactly under a text field are dropped); no other form has the pattern.
   - Not changed (owner's call): the form number renders light on all 29 shared-renderer forms (no rule for the
     HelveticaNeueLTStd-BlkCn face in pure-pdf-preview mapFont).

## Stage B — wiring (both UI repos)
- us-tax-ui: `form-tax-return-8958` thin wrapper + `taxReturnId` input (per-return computation, else primary); shell
  import / imports[] / render (`[taxReturnId]="activeTabTaxReturnId()"`) / sidebar `if (true /* (computation as any)?.form8958 */)`;
  `data/tax-scenarios.ts` formIds.
- us-tax-return-forms: same component, 3 assets, sidebar id `form-tax-return-8958`, shell html render.
- `npm run build` green in both.
- e2e `tax-return-8958-preview.spec.ts`: listed in the sidebar, 2 pages, 202 fields, blank before compute.
- The sandbox keeps its own blank-only component (its TaxReturnService is a stub), like its Form 8938.

## Stage C — computation
- `Form8958` model (header, rows: line / description / total / column B / column C, `fields` built LAST as strings).
- `computeForm8958` from the split entries: line 1 per W-2 employer, 2 per interest payer, 3 per dividend payer,
  (6 capital gains — only if the capital-gains split extension is approved), 11 taxes withheld. MFS + split applied only.
  Column B/C meaning confirmed against the Form 8958 instructions first.
- `out_form_8958` + V360 + `Form8958OutputMapper`; `TaxReturnComputation` slot; `TaxReturnDataService` save/load; the 6
  test constructors. Advisory reworded to "Form 8958 is included".

## Stage D — tests, docs, commits
- Unit: `getFields()` strings (header, a line 1 row, line 11); not MFS / not answered → none; IRA not split; mutation-tested.
- e2e: primary MFS fields + preview inputs; Spouse tab (persistent MFS) shows the spouse's own form; non-MFS → blank preview
  still listed.
- Docs: history, outstanding (B119 self-employment split, B120 pensions, B121 deductions), OPEN_QUESTIONS, memory note
  (Form 982 path as the current recipe, TEMP gate, per-return input for MFS-only forms).
- Commits: us-tax-be, us-tax-ui, us-tax-return-forms, us-tax (pdfs/); us-tax-hrb2025 commit only.

## Stage C/D outcome
- Capital-gains split approved ("start stage C with capital gains") and built: 1099-DIV 2a-2d split; 1099-B / 1099-DA full share
  copies (Form 8949 row keeps dates / description / box), marked `communityPropertyShare`.
- Found by the Spouse-tab e2e: her return had his sale's share but no capital screening of her own, so Schedule D was not
  required while Exception 1 was ruled out -> LINE7B_INTERNAL_INCONSISTENCY blocked her return. A share copy now requires
  Schedule D.
- Follow-ups: B118 self-employment split (lines 5, 9, 10), B119 pensions / rents / refunds / other (4, 7, 8, 12), B120 deductions.
