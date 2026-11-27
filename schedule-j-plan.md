# Schedule J plan - farm income averaging (outstanding.md parked item 7, option b)

Owner-approved 2026-11-26: option (b) for item 7 - the Schedule F line D EIN and weather-related livestock election (done first, V586),
plus Schedule J (Form 1040), Income Averaging for Individuals With Income From Farming or Fishing. Sources: the 2025 Schedule J
(`docs/IRS-Forms/f1040sj.pdf`, irs.gov/pub/irs-pdf/f1040sj.pdf) and its 2025 instructions (`docs/books/i1040sj.pdf`, Dec 8, 2025),
Pub. 225 (2025).

## What Schedule J does

Part of this year's farm (or fishing) taxable income - the **elected farm income**, line 2a, up to taxable income - is taxed at the
rates of the three base years (2022, 2023, 2024) instead of 2025: line 4 is the 2025 tax on taxable income less 2a; lines 8, 12, 16 are
the 2022 / 2023 / 2024 tax on each base year's taxable income plus 1/3 of 2a, using that year's rate schedule (printed in the
instructions, by that year's filing status); line 23 = (lines 4 + 8 + 12 + 16) - (the base years' own tax, lines 19-21). Line 23 goes on
Form 1040 line 16 only when it is lower than the regular tax ("Your tax may be less if you figure it using the 2025 Tax Table ... Attach
Schedule J only if you are using it"). It doesn't apply to the AMT (Form 6251) or to a child's kiddie tax.

Base-year amounts come from the earlier returns: line 5 / 9 / 13 is that year's taxable income (or, when Schedule J was used in a later
base year, a line of that Schedule J); lines 19-21 that year's tax (section 1 tax only). A base year with taxable income of zero or less
uses the instructions' Taxable Income Worksheet (taxable income without the NOL and capital loss limits).

## Stage A - blank preview (done 2026-11-26; owner-approved with the fields)

- `scripts/generate-semantic-1040sj.js` - fields named by printed line (header, 1, 2a-2c, 3-23), geometry-checked (amounts descend).
- `scripts/generate-f1040sj-elements.py` (copy of the 8881 extractor) -> `us-tax-ui/public/irs/f1040sj_elements.json`.
- `form-tax-return-schedule-j` (pure HTML/CSS) in the Tax Return sidebar, Family Head tab (one per return), blank until Stage C.
- e2e `tax-return-schedule-j-preview.spec.ts`.

## Stage B - the screen (done 2026-11-26, V587; the 16 fields owner-approved)

New screen **"Farm income averaging (Schedule J)"** in Incomes on the Family Head tab (one per return), listed when the household has a
Schedule F farm (`pf_schedule_j`, new table, uid-cascade registered in UserDataBulkDelete, PersonalResource allow-list):

1. Figure the tax with farm income averaging? (Yes / No) - the election.
2. Elected farm income (line 2a) - pre-filled with the return's Schedule F net profit; help explains what counts (Schedule F, Form 4835
   crop-share rent, farm sales on Form 4797, the farm part of the SE tax deduction) and that less than all of it can be elected.
3. Of that, net capital gain (line 2b) and 4. unrecaptured section 1250 gain (line 2c).
5-7. For 2022, 2023 and 2024: the amount for lines 5 / 9 / 13 - "taxable income from your [year] Form 1040 line 15, or the line of your
   later Schedule J the form names" (help quotes the form's rules and the zero-or-less worksheet).
8-10. For each base year: the tax for lines 19 / 20 / 21 (Form 1040 line 16, section 1 tax only, or the Schedule J line named).
11-13. For each base year: the filing status (picks the rate schedule) - pre-filled with this year's status.
14-16. For each base year: "Did that year's tax use the Qualified Dividends and Capital Gain Tax Worksheet, the Schedule D Tax Worksheet
   or the Foreign Earned Income Tax Worksheet?" (Yes / No).

2024 (lines 13 / 21) is pre-filled from the 2024 return when it was figured here.

That is 16 fields, more than the "about 4-7" first estimated - the base years each need taxable income, tax and filing status.

## Stage C - compute (done 2026-11-26: ScheduleJCompute, attachedForms.scheduleJList - no out_ table needed)

- `ScheduleJCompute` (outside TaxReturnComputeService): line 1 = Form 1040 line 15; 2a capped at line 1; line 3; line 4 = the 2025 tax
  on line 3 with the return's own regular-tax path (Tax Table / Tax Computation Worksheet / QDCG worksheet on the smaller taxable
  income); lines 5-16 with the 2022 / 2023 / 2024 Tax Rate Schedules from the instructions (`ScheduleJRates`); 17-23.
- Form 1040 line 16 uses line 23 when the election is Yes and line 23 is lower; an advisory when Schedule J would be higher (not used).
- Out of scope first (blocking flag, Stage D): 2b > 0, or a base year that used the QDCG / Schedule D / Foreign Earned Income worksheet -
  each needs that base year's worksheet with its own capital gain amounts.
- Persisted with the return (`out_schedule_j`), preview filled, unit tests with hand-figured base-year tax, e2e.

## Stage D - base-year capital gain and foreign income worksheets (owner-approved option b, 2026-11-26: 27 new fields, 3 changed)

Sources: 2025 Instructions for Schedule J (lines 2b/2c, 4, 8, 12, 16 and the 2022-2024 Qualified Dividends and Capital Gain and Foreign
Earned Income Tax Worksheets printed there); the 2022 / 2023 / 2024 Instructions for Schedule D (their Schedule D Tax Worksheets, 47 lines,
same structure each year - docs/books/i1040sd--2022/2023/2024.pdf); Reg. 1.1301-1(a)(2).

Fields (V588, pf_schedule_j; per base year y = 2022 / 2023 / 2024):
- CHANGED base{y}UsedWorksheet (Yes/No) -> base{y}Worksheet: none / qdcg / scheduleD (the old column dropped - not in production).
- NEW base{y}FiledForm2555 (Yes/No).
- NEW base{y}QualifiedDividends (Form 1040 line 3a), base{y}NetCapitalGain (smaller of Schedule D lines 15 and 16, or line 7 without
  Schedule D; 0 if a loss), base{y}Form4952Line4g - shown when the worksheet isn't none, or line 2b has an amount.
- NEW base{y}Form4952Line4e, base{y}Gain28Rate (Schedule D line 18), base{y}Unrecaptured1250 (Schedule D line 19) - shown for the
  Schedule D Tax Worksheet, or when line 2b has an amount.
- NEW base{y}Form2555Exclusions (Form 2555 lines 45 + 50, both spouses if joint), base{y}Form2555Disallowed - shown with Form 2555 Yes.
- 2024 filled from the 2024 return figured here (worksheet from its method; qualified dividends; Schedule D 15/16/18/19; Form 4952 4g/4e;
  Form 2555 lines 45 + 50).

Compute (ScheduleJWorksheets, a new helper):
- Base-year tax on line 7 / 11 / 15 (amount A; zero or less -> 0):
  - line 2b > 0 -> that year's Schedule D Tax Worksheet, with 1/3 of 2b added to its line 7 and 1/3 of 2c to Schedule D line 19
    (instructions, line 8: "If your elected farm income includes net capital gain, you must use the ... Schedule D Tax Worksheet");
  - else the worksheet answered (QDCG worksheet as printed in the Schedule J instructions; Schedule D Tax Worksheet); none -> rate schedule;
  - lines 44 / 46 (and QDCG 24 / 26) use that year's Tax Rate Schedules. The instructions say "lines 34 and 36" of the Schedule D Tax
    Worksheet - the numbering of an older worksheet; the 2022-2024 worksheets' tax lines are 44 and 46 (deviation noted).
  - Form 2555 Yes: Foreign Earned Income Tax Worksheet - line 3 = A + max(0, exclusions - disallowed); line 4 = the worksheet tax on line 3
    (with the capital gain excess: QDCG line 6 / Schedule D line 10 minus A; when positive a second worksheet reduces the gain (QDCG 3 /
    SD 9) then the dividends (QDCG 2 / SD 6), Schedule D line 18, and line 19 (the 1250 worksheet loss)); line 5 = rate-schedule tax on
    line 2c; line 6 = 4 - 5 (not below 0).
- Line 4 (2025): with line 2b, the return's Schedule D Tax Worksheet on line 3 with its net capital gain less 2b and its unrecaptured
  section 1250 gain less 2c - Reg. 1.1301-1(a)(2)(i) figures the tax "as if taxable income were reduced by elected farm income", so the
  capital-gain part leaves 2025's net capital gain (interpretation: the instructions don't spell it out). A 2025 return on the Schedule D
  Tax Worksheet is now supported the same way (no reduction without 2b).
- Blocking: 2b more than 2a or than 2025's net capital gain; 2c more than 2b or 2025's unrecaptured section 1250 gain; a 2025 tax figured
  on the Foreign Earned Income Tax Worksheet or Form 8615 (still not supported); a missing base-year filing status.

## As built (2026-11-26)

- The screen is listed on the Family Head tab always (not only with a farm): the shell's income list has no per-household gate; the screen
  points to Farm income first.
- Schedule J is kept in attachedForms.scheduleJList (the V387 JSON holder), so no out_schedule_j table; the preview and its sidebar item
  appear when the return uses Schedule J.
- 2024 is filled from the 2024 return computed here (GET /api/estimated-tax/prior-year now returns regularTax16 / computationMethod16)
  unless it used Schedule J.
- Stage D as built (2026-11-26, V588): ScheduleJWorksheets (QDCG 1-27, Schedule D Tax Worksheet 1-47 for 2022-2025, Foreign Earned
  Income with the capital gain excess); ScheduleJCompute.baseTax picks the worksheet; TaxReturnComputeService passes the 2025 gains
  (ScheduleJWorksheets.gains2025) and a bracket function. The preview now prints lines 2b and 2c. GET /api/estimated-tax/prior-year adds
  scheduleJGains (2024 qualified dividends, net capital gain, Schedule D 18/19, Form 4952 4g/4e, Form 2555 45 + 50) for the pre-fill.
  The worksheets' tax lines under $100,000 use the Tax Table (row midpoint), as the worksheets say.

## Stage E - 2025 Foreign Earned Income worksheet and the parent's Schedule J on Form 8615 (owner-approved option b, 2026-11-26; no new fields)

- Line 4 with Form 2555 filed for 2025: the return's own Foreign Earned Income Tax Worksheet on line 3 (computeForeignEarnedIncomeTaxWorksheet,
  which already handles the capital gain excess); with line 2b, ScheduleJWorksheets.baseYear(2025, ..., Schedule D Tax Worksheet, the
  gains less 2b / 2c, Form 2555 line 2a less 2b) - the same worksheet shape as the base years.
- Form 8615 (a dependent's own return; the parent is the household's return figured here - KiddieTaxParentReader): when the parent's
  return used Schedule J, line 9 is a worksheet Schedule J (i8615, "Using Schedule J (Form 1040) for line 9 tax"): line 1 = Form 8615
  line 8; 2a / 2b / 2c and lines 5-16 and 19-22 from the parent's Schedule J; line 3 = 1 - 2a; line 4 = the tax line 9 uses on line 3
  (with the parent's 2b / 2c out of the preferential amounts - the parent's own line 4 rule, an interpretation); 17 = 4 + 8 + 12 + 16;
  23 = 17 - 22 -> line 9, its box ticked. Line 10 = the parent's Form 1040 line 16 regular tax, i.e. Schedule J line 23 (box ticked).
- The parent's Schedule J values travel with ParentReturnInfo (from the parent computation's attachedForms.scheduleJList) into the
  kiddie map; the reader keeps the dependent's own Schedule J context (ScheduleJCompute thread-local) around the nested parent compute.
- A child's own Schedule J can't arise (a dependent's tab has no farm screens; the Schedule J screen is the Family Head's); the
  FORM_8615 block stays as a guard.
