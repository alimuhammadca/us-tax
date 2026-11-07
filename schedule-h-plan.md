# Schedule H (Form 1040) on the return - Implementation Plan

_Authored 2026-11-07 (Household employees screen review). Owner: "I want option #2 but not embedded PDF. I want pure html/css form which
looks like a PDF as we have done for other tax return forms." Status: Stage A done - waiting for the owner's visual review._

## Background
- ScheduleHCompute figures every Schedule H line (screen review 2026-11-07) and line 26 reaches Schedule 2 line 9, but the schedule itself
  was never on the return: no model slot, no persistence, no preview. "If you file Form 1040 ... remember to attach Schedule H to it."
- One per person: "Only two Schedules H can be attached to Form 1040 ... one Schedule H for each of the primary taxpayer and the secondary
  taxpayer" (2025 Instructions for Schedule H, Name of employer).

## Stage A - the blank form, pure HTML/CSS (stop for owner visual review) - DONE
1. `docs/IRS-Forms/f1040sh.pdf` (2025, irs.gov/pub/irs-prior/f1040sh--2025.pdf).
2. `us-tax-be/scripts/generate-semantic-1040sh.js` - 72 fields named by line (lineA_yes ... line17_row2_col_h_contributions_paid ...
   line27_no, Part IV and the preparer block), checked against the rects (line 17 columns left to right on one baseline, the Yes / No pairs
   stacked as printed - line C and line 9 print No first) -> `pdfs/f1040sh_*`, copied to `public/irs`.
3. `us-tax-be/scripts/generate-f1040sh-elements.py` (copy of the Form 8958 extractor) -> `public/irs/f1040sh_elements.json`: 2 pages, 72
   fields, every name in the CSV and unique.
4. Thin wrapper `form-tax-return-schedule-h` (`person` input, reads `scheduleHTaxpayer` / `scheduleHSpouse`.fields); sidebar
   `tax-return-schedule-h-taxpayer` / `-spouse` under the TEMP `if (true /* real gate */)` convention, owner-specific prefix.
5. Side-by-side images for review (IRS page vs app preview). Differences seen: line 13's dashed rule drawn solid; the empty Yes / No cells
   of lines 10-12 drawn as checkboxes; the line 17 rows' field shading.

## Stage B - computation slot and fields
- ScheduleH model: header (name, SSN, EIN or "Applied For" + date), `fields` built LAST as strings from the finished model (lines A-C
  boxes, 1-8, 9, 10-12, 13-16 or 17 rows / 18-24 with the line 23 box, 25-26, line 27 Yes).
- `out_schedule_h` V-migration + OutputMapper (taxpayer / spouse) + TaxReturnComputation slots `scheduleHTaxpayer` / `scheduleHSpouse` +
  TaxReturnDataService save/load + the test constructors. MFS: the person's own leg.
- Real sidebar gate kept in the comment.

## Stage C - tests, docs, commits
- Unit: `getFields()` keys and strings (header EIN, line 1 capped, line 23 box, line 27); e2e preview inputs by `data-field-name`.
- Docs: history, outstanding, checklist; memory note.
