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

## Stage D - base-year capital gain worksheets (later, if wanted)

The instructions' 2022 / 2023 / 2024 Qualified Dividends and Capital Gain Tax Worksheets and the Schedule D Tax Worksheet path for
line 2b - each base year's qualified dividends and capital gain amounts as more inputs.

## As built (2026-11-26)

- The screen is listed on the Family Head tab always (not only with a farm): the shell's income list has no per-household gate; the screen
  points to Farm income first.
- Schedule J is kept in attachedForms.scheduleJList (the V387 JSON holder), so no out_schedule_j table; the preview and its sidebar item
  appear when the return uses Schedule J.
- 2024 is filled from the 2024 return computed here (GET /api/estimated-tax/prior-year now returns regularTax16 / computationMethod16)
  unless it used Schedule J.
