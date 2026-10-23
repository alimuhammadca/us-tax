# Form 4797 sales (Business property sales intake) - Implementation Plan

_Authored 2026-10-23. Owner approved the field list ("approved, go ahead and build it"). Follows form-6252-plan.md. Status: BUILT 2026-10-23._

## Why
An ordinary sale of business or rental property could not be entered: the Form 4797 statement replica saves PDF slot keys
and is not offered anywhere (the mapper is active, but only the REST API reaches it), and the Depreciable assets form has
no sale fields. A filer could only type a hand-figured total on Schedule 1 line 4 / Schedule D line 11 - no recapture, no
section 1231 netting or lookback, no section 1250 worksheet, and the Form 4797 preview was always blank.

## Shape
1. **Intake** `business-property-sales-taxpayer` / `-spouse` (Incomes), one entry per sale (owner-approved fields:
   description, property type 1250 / 1245 / land, used for, inherited, dates, gross sales price, selling expenses, cost,
   depreciation, optional additional depreciation and AMT depreciation). `pf_business_property_sale` + `_item`, V377.
2. **Compute** `Form4797SalesCompute` (helper - constant pool): each sale -> a Form 4797 entry with a Part III property
   (line 19 description/dates - "INHERITED" for an inherited property, which counts as long-term; line 20 price; line 21
   cost + expenses; line 22 depreciation; line 26a for real property; AMT depreciation) appended to the Form 4797 entries,
   so the existing Part III recapture, section 1231 netting and lookback, and section 1250 worksheet run unchanged. A typed
   Form 4797 property or an Installment sales entry with the same description and dates wins (blocking when it is the
   same property on both new forms). Recapture of property not used in a Schedule C business stays on Schedule 1 line 4
   but out of Schedule C QBI.
3. **Preview** the existing `form-tax-return-4797` gets values: `Form4797Fields` builds the semantic-name map
   (`f4797_field_map_semantic.csv`) from the finished entries - Part III columns A-D for depreciable gains, land and losses
   on line 2 (over a year) or line 10 (a year or less), Part I lines 4 / 6-9, Part II lines 11-13 / 17, Part IV 33-35 -
   stored on `Form4797Recapture.fields` (`out_form_4797_recapture.fields_json`, V377).

## Not covered (outstanding.md)
Section 1252 / 1254 / 1255 recapture, the 24-month cattle and horse holding period, Form 4684 casualty items, more than
four Part III properties or line 2 / 10 rows on one form (advisory), linking a sale to a Depreciable assets entry.
