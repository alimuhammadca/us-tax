# Form 4684 Section B (Business and Income-Producing Property) - Implementation Plan

_Authored 2026-10-23. Status: DRAFT - the intake field list and the decisions below need the owner's sign-off._

## Why
A casualty or theft of business, rental or investment property cannot be entered. Section B's only input is the Form 4684
statement mapper, dormant since 2026 (`Form4684Mapper.formIds()` is empty - it took PDF slot keys and no screen used it), so
`computeForm4684SectionBLine16Loss` never receives anything. A landlord whose rental is damaged by a hurricane, or a business
whose equipment is stolen, has nowhere to report the loss, and an insurance payment above basis (a gain) is never reported.
Two narrow paths already exist and stay: the investment theft (Ponzi / scam) fields on Standard deductions (A14, Schedule A
line 16) and the home-office casualty on Form 8829 line 35 (B111, Schedule 1 line 4).

## What the 2025 form requires (Form 4684 and instructions, Section B)
- **Part I, one per casualty or theft**, a column per property (A-D): line 20 cost or adjusted basis; 21 insurance or other
  reimbursement "whether or not you filed a claim"; 22 gain if 21 > 20 (skip 23-27); 23/24 FMV before/after; 25 = 23 - 24;
  26 = smaller of 20 and 25 - **20 if totally destroyed or stolen**; 27 = 26 - 21 (not below 0); 28 = total. Each item
  figured separately (a building and its trees are two items). **No $100 and no 10%-of-AGI floor.**
- **Part II, once**, a row per casualty, split by holding period: column (b)(i) trade, business, rental or royalty losses,
  (b)(ii) income-producing losses, (c) gains.
  - Held 1 year or less (29-32): 31 = (b)(i) + (c) -> Form 4797 line 14 (ordinary); 32 = (b)(ii) -> Schedule A line 16.
  - Held more than 1 year (33-39): 33 = gains on depreciable property with recapture, figured on Form 4797 Part III (line 32);
    36 = gains; 37 = losses. Losses > gains: 38a = (b)(i) + 36 -> Form 4797 line 14 (ordinary); 38b = (b)(ii) -> Schedule
    A line 16. Otherwise 39 = 36 + 37 -> Form 4797 line 3 (section 1231, with the netting and 5-year lookback).
- Employee property: not deductible after 2017 (no miscellaneous itemized deductions) and not used in the netting.

## Shape (the app's normal input form -> compute -> preview)
1. **Intake** `business-casualties-taxpayer` / `business-casualties-spouse` (Incomes, beside Business property sales), one
   entry per damaged or stolen PROPERTY; properties with the same casualty description are one Part I. `pf_business_casualty`
   + `pf_business_casualty_item` (V381); PERSONAL_FORMS, UserDataBulkDelete, MfsFormScoper.
2. **Compute** `Form4684SectionB` (helper class - constant pool): lines 20-28 per casualty, Part II 29-39, routing above.
   A gain on a building or equipment held over a year becomes a Form 4797 Part III property (price = the reimbursement,
   cost = basis + depreciation), so the existing recapture runs; its line 32 comes to Form 4684 line 33 instead of Form 4797
   line 6. Form 4797 line 14 (ordinary) and line 3 (section 1231) are new inputs to the Form 4797 code; Schedule A line 16
   takes 32 + 38b through the existing `form4684SectionBLine16Loss`.
3. **Output** the existing `Form4684` list (V379): copy *i* carries Section A casualty *i* and Section B casualty *i*;
   Section A lines 13-18 and Section B Part II on the first copy. More than four properties in one casualty continue on the
   next copy. The Form 4797 preview gains lines 3 and 14. **No structural change** - page 2 of the existing preview only
   gets values.
4. **Retire nothing new**: `Form4684Mapper` stays dormant; its transcribed path stays for the unit tests.

## Proposed intake fields (need sign-off)
Screening: `hasBusinessCasualty` - "Did business, rental or investment property of yours get damaged, destroyed or stolen in
2025?"

Per property:

| # | Field | Type | Form |
|---|---|---|---|
| 1 | `casualtyDescription` - which casualty or theft ("Hurricane Milton", "Break-in at shop") | text | 29/34 (a); groups Part I |
| 2 | `casualtyDate` - date of the casualty, or the date a theft was discovered | date | year must be 2025 |
| 3 | `propertyDescription` - the property and its location | text | 19 |
| 4 | `propertyType` - building or other real property (section 1250) / equipment, vehicle or other depreciable property (section 1245) / land / other investment property (stocks, art, a vacant lot) | select | recapture on a gain |
| 5 | `usedIn` - a business (Schedule C) / a farm (Schedule F) / a rental or royalty (Schedule E) / held for investment / used as an employee | select | column (b)(i) vs (b)(ii); employee = not deductible |
| 6 | `dateAcquired` | date | 19; held 1 year or less vs more |
| 7 | `adjustedBasis` - cost plus improvements, minus depreciation | amount | 20 |
| 8 | `depreciationAllowed` - only for a building or equipment | amount | recapture when there is a gain |
| 9 | `reimbursement` - insurance or other reimbursement, received or expected, whether or not a claim was filed | amount | 21 |
| 10 | `totallyDestroyedOrStolen` | Yes/No | 26 = 20 when Yes |
| 11 | `fmvBefore`, `fmvAfter` - shown when #10 is No | 2 amounts | 23, 24 |

## Flags (proposed)
- Blocking: casualty date missing or not in 2025; basis missing; FMV before/after missing on a partial loss.
- Advisory: employee property (not deductible, left out); a gain (reimbursement above basis) can be postponed by buying
  replacement property (section 1033, Pub. 547); a loss on income-producing property only helps when itemizing (Schedule A
  line 16); property on the Depreciable assets form stops depreciating when destroyed or stolen - mark it disposed there.

## Decisions for the owner
1. **One entry per property, grouped by the casualty description** (recommended) - vs. a casualty with a nested list of
   properties. The grouping keeps one item table and the same UI as Business property sales.
2. **Fold the existing investment theft (A14, Standard deductions) into Part II** as an income-producing loss held more than
   a year (recommended): it is a Section B loss, and when there are Section B gains the form nets it against them (line 39)
   instead of sending it to Schedule A. Today it bypasses the netting and the form shows nothing. Alternative: leave it as is.
3. **Fold the Form 8829 line 35 home-office casualty (B111) into Part II** column (b)(i), held more than a year
   (recommended): the Form 8829 instructions put it on Form 4684 line 27 ("See Form 8829"). Today it goes straight to Schedule
   1 line 4 - the same result unless there are Section B gains.

## Out of scope
Section C (Ponzi schemes under Rev. Proc. 2009-20) and Section D (election to deduct a federally declared disaster loss in the
prior year); inventory (through cost of goods sold); leased property; passive-activity casualty losses that recur regularly;
the section 1033 replacement itself (advisory only); a link to the Depreciable assets entry (advisory only).

## Tests (planned)
- Unit `Form4684SectionBTest`: a rental building partly damaged (loss to Form 4797 line 14 -> Schedule 1 line 4); equipment
  stolen with insurance above basis (section 1245 recapture via Form 4797 Part III, the rest section 1231 via line 39); a
  long-term gain netted against a larger loss (38a/38b); a short-term loss and income-producing loss (31/32 -> Schedule A);
  the employee and 2025-date checks; the A14 and B111 amounts in Part II. Hand-derived and mutation-tested.
- e2e: the intake form saves and reloads; compute -> filled Form 4684 page 2 and Form 4797 lines 3 / 14.
