# Schedule 3 line 13c - Form 3800 Part III elective payment (section 6417) - Implementation Plan

_Authored 2026-11-15 (outstanding.md, Other payments / credits: "Line 13c is a typed total: Form 3800 Part III is not produced").
Owner chose option B: build it rather than keep the typed amount. Status: stage 1 DONE 2026-11-15 (Stage A owner-reviewed: "go ahead"; Stage B filled). Stage 2 DONE 2026-11-15 (Stage A owner-reviewed: "go ahead", which also approved the screen). Stage 3 DONE 2026-11-15 (Stage A owner-reviewed: "go ahead", which also approved the Stage B scope). Stage 4 DONE 2026-11-15 (Stage A owner-reviewed: "go ahead", which also approved the Stage B scope). Next: stage 5 (Part V; retire the typed line 13c). Owner 2026-11-15: "start with stage 1 but keep in mind that you cannot change the structure of a statement or tax return form. You can modify an existing user input form or you could add a new user input form."_

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

## Stage 1, Stage B - done 2026-11-15
- Form3800Fields builds the fields from the finished Part II figures of applyGeneralBusinessCreditToSchedule3 (the typed carryforward):
  items A and B(i) No; Part I line 4 / 6; Part II lines 7-17 (10b = 10c - 10a), Section B skipped with line 26 -0- (the form's own
  note), lines 27-29, 36-37 -0-, line 38 = Schedule 3 line 6a; Part IV lines 6 and 7 columns (f), (g), (i). Whole dollars, -0- on
  lines the form fills. Noted into AttachedForms.form3800List (name / identifying number from the return header). No input change.
- Part IV per-credit lines stay blank (one total, not each credit and year) - advisory FORM_3800_PART_IV_ONE_TOTAL.
- Tests: Form3800FieldsTest (3); e2e tax-return-3800-filled.spec.ts.

## Stage 2, Stage A - done 2026-11-15
- docs/IRS-Forms/f7210.pdf (2025, created 7/22/25). generate-semantic-7210.js: 39 fields by hand (item A, Part I lines 1-5 with the
  line 2b latitude / longitude sign, degrees and decimal digits, Part II lines 6a-6d columns (a)-(c) and 7, Part III 8a-9, Part IV
  10-12), rows 6a-6d and lines 7-12 geometry-checked. generate-f7210-elements.py: the six comb fields of line 2b are drawn as their
  19 character boxes (outlined cells; the field see-through, "shaded": transparent).
- "File a separate Form 7210 for each qualified clean hydrogen production facility": form-tax-return-7210 shows
  attachedForms.form7210List with a facility selector (the Form 7206 pattern). e2e tax-return-7210-preview.spec.ts.

## Stage 2, Stage B - done 2026-11-15
- Screen "Clean hydrogen production credit (Form 7210)" in Deductions (clean-hydrogen-credit-taxpayer / -spouse; V484
  pf_clean_hydrogen_credit + pf_clean_hydrogen_facility, person_id trigger): one entry per facility - address and description,
  coordinates, dates, item A, the owner if not the filer (TIN with the eye), the increased credit, kilograms per tier, tax-exempt bonds,
  the elective payment and its registration number; the credit shown as figured.
- Form7210Compute: column (c) = kg x the printed amount, line 7, the bond reduction (lesser of 15% or the fraction), line 10 x 5.0 with
  line 5; a facility begun in 2028 or later, not in service by year end, or past its 10 years earns nothing (blocked). Blocks: Part I
  missing, no kilograms, an election without a registration number, bonds without the capital additions, more than one registration
  number (Part V - stage 5). Advisories: Form 7220 and the statement for the increased credit; the verification report; treated as not
  passive.
- Form 3800: Part II now takes the carryforward first, then this year's credit (column (i)); column (j) = smaller of (h) or (g) - (i)
  -> Schedule 3 line 13c (Form7210Compute.withNetEpe; a typed line 13c next to a figured one blocks, FORM_3800_LINE_13C_TYPED_AND_FIGURED);
  with no tax the whole elected credit is paid. Part I line 1, Part III lines 1g, 2 and 6 columns (b), (e), (g)-(j) filled. An unused,
  unelected credit carries to next year (the general business credit bridge).
- Tests: Form7210ComputeTest (5); UI spec (2); e2e clean-hydrogen-credit-screen.spec.ts (2) with the related specs - 29 passed.

## Stage 3, Stage A - done 2026-11-16
- docs/IRS-Forms/f8933.pdf (Rev. December 2025, created 12/22/25). generate-semantic-8933.js: all 141 fields named by hand from the
  printed lines (Part I Sections 1-4 with Yes / No pairs, Part II boxes 1-8, Part III lines 1a-10 and 7a-7c columns (i)-(iv)); checks:
  Yes left of No on one baseline, every page's fields in printed order. generate-f8933-elements.py: the comb fields (line 3 facility
  types, line 4c latitude / longitude) drawn as their 28 boxes.
- "you must complete a separate Form 8933 for each facility": form-tax-return-8933, attachedForms.form8933List with a facility
  selector. e2e tax-return-8933-preview.spec.ts.

## Stage 3, Stage B - done 2026-11-15
- Screen "Carbon oxide sequestration credit (Form 8933)" in Deductions (carbon-oxide-sequestration-credit-taxpayer / -spouse; V485
  pf_carbon_oxide_credit + pf_carbon_oxide_facility, 54 facility fields, person_id trigger): the kind of facility (industrial /
  electricity-generating / DAC - a DAC facility skips lines 11-15), address, coordinates, EPA e-GGRT ID, owner if not the filer, the
  dates, the industrial-facility questions (lines 12-15), the equipment (lines 20-25), tons per path (Part III lines 1a-1c, 2a-2c,
  3a-3c, the displacement factor), Part II lines 1-3, line 33, the bonds, the unsupported situations, the elective payment.
- Form8933Compute: rates $17 / $12 (equipment after 2022 and before July 5, 2025), $17 for all three after July 4, 2025, DAC $36 / $26;
  x 5.0 with line 33; line 4, the bond reduction, line 6 = line 9 -> Form 3800 Part III line 1x. Derived: line 3 (GEO / EOR / UTZ), lines
  7, 18, 26, 30-32. No credit (blocked): equipment before 2023, construction from 2033, not in service by year end, past the 12 years,
  under the capture threshold (1,000 / 18,750 / 12,500 t), lines 27 / 1e-3e, 28-29 and (f)(9), 7-8, 10. Other blocks: Part I missing,
  measured tons, displacement factor, LCA for utilization, Part II lines 2-3, line 20a, line 12a gas, registration number, bond
  fraction. Advisories: Form 7220 + statement; the Schedules (Form 8933) and statements that apply.
- Form3800Current: this year's credits in the order used (Instructions for Form 3800, Order in which credits are used - Form 8933
  before Form 7210); column (i) applied in that order, column (j) per line; Part V (more than one registration number) checked across
  both forms. Form3800Fields fills each Part III line plus lines 2 and 6.
- Tests: Form8933ComputeTest (4), Form7210ComputeTest updated (5); UI spec (2); e2e carbon-oxide-sequestration-credit-screen.spec.ts
  (2) with the related specs - 34 passed.

## Stage 4, Stage A - done 2026-11-15
- docs/IRS-Forms/f7207.pdf (Rev. December 2025, created 10/21/25). generate-semantic-7207.js: all 490 fields named - page 1 and Part II
  lines 7-8c by hand; the Part II table rows (1a-6b) by line and component, each row's four fields in x order: (b) and (c) are
  1-point-wide fields with no printed box (named ..._col_b_hidden / ..._col_c_hidden, left out of the layout), (d) quantity or costs,
  (e) amount of credit; Part III vessels 1-49 (name, purpose, official number, New / Retrofitted, sales price - rows 2 and 3 reuse leaf
  names, so fields are keyed by their path) and the total; Part IV lines 1-74 from the printed mineral labels. Checks: Yes / New left of
  No / Retrofitted on one baseline; every page's fields in printed order. generate-f7207-elements.py: the latitude / longitude comb
  boxes drawn as cells; 440 drawn fields.
- "File a separate Form 7207 for each facility": form-tax-return-7207, attachedForms.form7207List with a facility selector; Part IV
  line 25 narrowed (textOverrides) - the IRS prints it with tighter spacing. e2e tax-return-7207-preview.spec.ts.

## Stage 4, Stage B - done 2026-11-15
- Screen "Advanced manufacturing production credit (Form 7207)" in Deductions (advanced-manufacturing-credit-taxpayer / -spouse; V486
  pf_adv_mfg_credit, pf_adv_mfg_facility, pf_adv_mfg_mineral, pf_adv_mfg_vessel - the children cascade): Part I, the units per Part II
  component (1a-1g, 2b-2f, 3a-3f, 5a-5c), the costs of lines 4a and 6b, Part IV critical minerals (a list: the line 1-73 picked from
  the printed labels, and the costs), Part III vessels (a list), credit from other entities (blocks), the elective payment.
- Form7207Compute: column (e) = the printed credit per unit x the units; 10% of the costs (4a), Part IV line 74 (6a) and the vessel
  sales (2a); 2.5% for metallurgical coal (6b); line 8a -> Form 3800 Part III line 1b. No credit (blocked): not in service by year end,
  line 5 related-person election, line 6 section 48C facility, lines 7 / 8b. Other blocks: Part I missing, nothing produced,
  registration number, an incomplete vessel, a mineral line missing or repeated. Advisory: the technical description, Appendix A, the
  integrated-component rule, the battery limits.
- Form3800Current: order 1x (8933), 1g (7210), 1b (7207) - Instructions for Form 3800, Order in which credits are used.
- Tests: Form7207ComputeTest (3); UI spec (2); e2e advanced-manufacturing-credit-screen.spec.ts (2) with the related specs - 37 passed.
