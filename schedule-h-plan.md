# Schedule H (Form 1040) on the return - Implementation Plan

_Authored 2026-11-07 (Household employees screen review). Owner: "I want option #2 but not embedded PDF. I want pure html/css form which
looks like a PDF as we have done for other tax return forms." Status: ALL STAGES DONE 2026-11-07 (Stage A owner-reviewed: "go ahead with stages B and C")._

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

## Stage B - fields from the computation - DONE
- `ScheduleHFormFields` builds the semantic-name -> string map from the FINISHED ScheduleH (after Part II), following the form's skips
  (line A Yes skips B-C; line B Yes skips C; line C Yes skips lines 1-9 and line 25 is "-0-"; Section A or B; line 17 first two states;
  line 27 Yes), EIN as 00-0000000 or "Applied For MM/DD/YYYY". Amounts whole dollars; zero lines the form fills print "-0-".
- Persistence: changed from the planned `out_schedule_h` table to the existing per-person attached-forms holder (V387
  `out_attached_forms`, JSON): `AttachedForms.scheduleHList`, one `AttachedForm` per person with its owner's name and SSN
  (AttachedFormsBuilder) - the Form 2106 / Schedule C pattern; no migration and no TaxReturnComputation record change.
- The preview reads the person's copy by ownerRole. On a joint return both copies are listed on the Family Head tab.

## Stage C - tests, docs, commits - DONE
- Unit: `ScheduleHScreenReviewTest` +3 (field strings and skips, Applied For / line C Yes, both spouses through prepare() with their
  own header). e2e `tax-return-schedule-h-preview.spec.ts` (both spouses, after a reload).
- Not done: a persistent-MFS spouse's own leg isn't read by the spouse's preview (same as Form 4137) - outstanding.md.
