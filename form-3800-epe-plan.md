# Schedule 3 line 13c - Form 3800 Part III elective payment (section 6417) - Implementation Plan

_Authored 2026-11-15 (outstanding.md, Other payments / credits: "Line 13c is a typed total: Form 3800 Part III is not produced").
Owner chose option B: build it rather than keep the typed amount. Status: stage 1 Stage A DONE 2026-11-15 (blank Form 3800, waiting for the owner's visual review). Owner 2026-11-15: "start with stage 1 but keep in mind that you cannot change the structure of a statement or tax return form. You can modify an existing user input form or you could add a new user input form."_

## Background (2025 Instructions for Form 3800 and Form 3800 (2025); irs.gov/pub/irs-prior/*--2025.pdf)
- Schedule 3 line 13c = Form 3800 Part III line 6, column (j), the net elective payment election (EPE) amount.
- An individual is not an "applicable entity" (section 6417(d)(1)(A)). The instructions: taxpayers that are not applicable entities
  "may elect to be treated as applicable entities but only with respect to" three credits:
  - carbon oxide sequestration, section 45Q, Form 8933 Part III (capture equipment placed in service after 2022) - Part III line 1x;
  - clean hydrogen production, section 45V, Form 7210 Part IV - Part III line 1g;
  - advanced manufacturing production, section 45X, Form 7207 Part II - Part III line 1b.
  (Section 48D, Form 3468 Part IV, line 1o, also allows an election by "taxpayers" - a semiconductor-plant credit; out of scope.)
- Before an election: an IRS pre-filing registration number for each facility (IRS.gov/Register; Pub. 5884), entered on the source
  credit form and in Part III column (b); valid for one tax year. More than one facility for a credit: Part V lists each one.
- The credit is first applied against tax: Part III columns - (e) credit not subject to the passive limits, (g) = (e) + (f) (+ allowed
  passive (d)), (h) gross EPE amount, (i) the part of (g) applied against tax in Part II (carryforwards first, then current credits in
  the "Order in which credits are used"), (j) net EPE = smaller of (h) or (g) - (i). With no tax in Part II, (j) = (h).
- Credit amounts allowed as net EPE are treated as payments and are not carried back or forward.

## What the app has today
- Form 3800 is not produced. Part II Section A (lines 7-17) is figured for a typed general business credit carryforward
  (general-business-credit screen) -> Schedule 3 line 6a; current-year credits are not figured (outstanding.md "General business
  credit (Form 3800)").
- Line 13c is typed on Other payments (netElectivePaymentElectionAmount); none of Forms 7207, 7210, 8933 exist.

## Proposed stages (each new tax-return form follows the Form 4136 method: Stage A blank pure-HTML form for the owner's visual
## review, then the screen, the computation and the filled form)
1. **Form 3800 on the return** (9 pages): semantic names + layout generators, pure-HTML preview; fill Parts I, II and IV from what
   is figured today (the carryforward, Part II Section A). Prerequisite for the rest; also closes "Form 3800 itself is not produced".
2. **Form 7210, clean hydrogen** (1 page, 39 fields) - the smallest source form: a screen (facility, registration number,
   production and emissions tier, tax-exempt bond reduction, Part IV credit), the form, and Part III line 1g with the EPE columns
   (b), (e), (g), (h), (i), (j); Part II extended for current-year credits so column (i) is real; line 6 (j) -> Schedule 3 line 13c.
3. **Form 8933, carbon oxide sequestration** (4 pages, 141 fields): the same, Part III line 1x.
4. **Form 7207, advanced manufacturing production** (5 pages, 490 fields - a per-component table): the same, Part III line 1b.
5. **Part V** when a credit has more than one facility; then the typed line 13c is removed (owner sign-off; columns dropped).

## Out of scope (blocking where it would mislead)
- The other Part III lines (current-year credits that can't be paid out to an individual) - stay with the "General business credit"
  item; credits subject to the passive activity limit (column (d), Form 8582-CR); a partnership's or S corporation's own election
  (the entity is paid, not the partner); transfer elections (section 6418, column (f)); section 48D; revoking a section 6417 election.

## Size
Four new tax-return forms (about 2,600 fields in all) and three new screens: each stage is about the size of the Form 4136 work.

## Stage 1, Stage A - done 2026-11-15
- docs/IRS-Forms/f3800.pdf replaced with the 2025 edition (it was 2024). generate-semantic-3800.js: all 1,921 fields named - pages 1-2 by
  hand (Part I lines 1-6, Part II lines 7-38, items A and B), the tables from the IRS's own row names (Pg3Table ... Line1a) with each
  row's fields left to right as its columns (every row has the table's column count; rows descend in printed order) - e.g.
  partIII_line1g_col_j_net_epe_amount, partIV_line1b_col_i_carryforward_to_2026, partV_line3_col_h1_gross_epe_amount.
- generate-f3800-elements.py (copy of the Form 4136 extractor): 9 pages, pages 3-9 landscape. A field inside a grey IRS cell carries
  "shaded" (286 fields), painted by pure-pdf-preview as the field's background - opt-in, no other form's JSON has it.
- form-tax-return-3800 wrapper (attachedForms.form3800List, filled in Stage B), Tax Return sidebar under the TEMP gate; e2e
  tax-return-3800-preview.spec.ts.
- Seen in review: landscape pages are drawn at the preview's 8.5-inch width (the shared .tax-page max-width), so they are smaller
  than the portrait pages; the large "3800" renders light like the other shared-renderer forms.
