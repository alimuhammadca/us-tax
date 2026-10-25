# Schedule K-1 (Form 1041) — Beneficiary's Share of Income, Deductions, Credits, etc.

Statement form id `schedule-k1-1041`. Paths are relative to `C:\us-tax`. `TRCS` =
`us-tax-be/src/main/java/com/ustax/microservices/TaxReturnComputeService.java`; `MAP` =
`us-tax-be/src/main/java/com/ustax/microservices/statement/ScheduleK1Form1041Mapper.java`; `UI` =
`us-tax-ui/src/app/forms/form-schedule-k1-1041.component.ts`; `GFM` =
`us-tax-be/src/main/java/com/ustax/microservices/GenericFieldMapper.java`. The shared screen, parser and person-filter
machinery is described in `schedule-k1-1065.md`; reused ids come from `new_knowledge\`.

---

## 1. What this statement is

An estate or trust gives each beneficiary a Schedule K-1 (Form 1041) showing the beneficiary's share of the entity's
income, deductions and credits. "Keep it for your records. Don't file it with your tax return, unless backup withholding
was reported in box 13, code B" (`i1041sk1.pdf p. 1`). "In box 9 and boxes 11 through 14, the fiduciary will identify
each item by entering a code" (`i1041sk1.pdf p. 1-2`). The 2025 instructions point to "page 2 of Schedule K-1" for the
code list and summarized reporting; the copy on file is the 2024 form (`docs/IRS-Forms/Schedule k-1 Form 1041.pdf`
p. 1-2, cited below as `fk1041 p. 2`) — the 2025 instructions describe the same boxes and codes.

IRS instructions used: `i1041sk1.pdf` (2025, for a beneficiary filing Form 1040) p. 1-5; `fk1041 p. 2` (code list,
"Report on" column); `i1040se.pdf p. 10` (Schedule E Part III); `i1040gi_ty2025.pdf p. 39` (lines 25c, 26).

**Printed rows per box** (`fk1041 p. 1`): box 9 three rows; box 11 five rows; box 12 five rows; box 13 three rows;
box 14 six rows.

**Whose statement it is.** Part II item F "Beneficiary's identifying number", stored as
`part2FBeneficiaryIdentifyingNumber` and copied into `recipientTIN` on save (`UI:272-281`); a new entry is pre-filled with
the person tab's SSN (`UI:260-270`). "Schedule K-1 may show only the last four digits of your identifying number"
(`i1041sk1.pdf p. 1`) — D-k1-1041-10.

**Storage.** `MAP` → entity `SeScheduleK11041`; amounts stored as text. The list call returns every K-1 (1041) of the
account for the year (`MAP:73-82`); compute receives it after `CommunityProperty.splitK1` (`TRCS:3244-3245`).

**Screen.** Drawn-form screen, variant `1041`; `fieldMap` `UI:166-241`. Every screen key has a mapper column; the
section 199A group, `ownerRole`, `taxYear`, `legacyDocId` are mapper-only (diff of `UI` vs `MAP:98-212`). **The
slot ↔ key map is wrong for boxes 11-14**: it assumes 3 / 3 / 5 / 8 rows where the form prints 5 / 5 / 3 / 6, so 16 code /
amount pairs are saved under the wrong box (**D-k1-1041-1**). Upload extraction uses the same 3 / 3 / 5 / 8 split
(`GFM:2901-2922`, whose comment says "the first three belong to box 11, the next three to box 12, then five to box 13 and
eight to box 14 — the slots the component declares").

**Amount parsing / losses.** Typed text saved unchanged; compute's `parseAmount` (`TRCS:52507-52536`) reads "-1,000" and
"(1,000)" as −1,000 — **Match** (D-ui-1 does not apply).

**Person filter.** Boxes 1, 2a/2b (portfolio), box 6 (line 5), box 12 (AMT), box 14 code F: only the other spouse's K-1 is
dropped on MFS (`TRCS:3709-3723, 3832-3834`) → **D-2b-1, D-3b-1, D-8-8**. Boxes 3-4c: by `recipientTIN`
(`TRCS:25443-25458, 25512-25535`) — Match. Section 199A fields: `belongsToPerson` (`TRCS:17572-17587`) — Match but
unreachable (D-k1-1041-9).

## 2. Box by box

### Header, Part I, Part II

| Box | IRS caption | App field (`MAP` line) | Where it goes (IRS) | What the app does | Status |
|---|---|---|---|---|---|
| — | Final K-1 / Amended K-1 | `headerFinalK1`, `headerAmendedK1` (`:122-123`) | "If the 'Final K-1' box … is checked, this is the final return for the beneficiary" (`i1041sk1.pdf p. 1`) | Stored, not used | Not used |
| — | Tax year beginning / ending | `headerTaxYearBeginningMonth/Day/Year`, `…EndingMonth/Day/Year` (`:136-141`) | Fiscal-year K-1 | Stored, not used | Not used |
| A | Estate's or trust's EIN | `part1AEstateOrTrustEin` (`:126`) | Schedule E line 33 (b) | QBI aggregation key (`TRCS:17988-18010`) | Match |
| B | Estate's or trust's name | `part1BEstateOrTrustName` (`:127`) | Schedule E line 33 (a); Schedule B payer | Schedule B payer label (`TRCS:36066-36072`) | Match |
| C | Fiduciary's name, address | `part1CFiduciaryNameAddress` (`:128`) | — | Stored, not used | Not used |
| D | Form 1041-T filed, date | `part1DForm1041tFiled`, `part1DForm1041tDateFiled` (`:118, 129`) | Needed for box 13 code A credit (`i1041sk1.pdf p. 3`) | Stored, not used | Not used (D-k1-1041-2) |
| E | Final Form 1041 | `part1EFinalForm1041` (`:119`) | "this is the final year of the estate or trust" — box 11 applies (`i1041sk1.pdf p. 1-2`) | Stored, not used | Not used |
| F | Beneficiary's identifying number | `part2FBeneficiaryIdentifyingNumber` (`:132`) → `recipientTIN` (`:104`) | Whose K-1 it is | Person filter | Match / D-k1-1041-10 |
| G | Beneficiary's name, address | `part2GBeneficiaryNameAddress` (`:133`) | — | Stored, not used | Not used |
| H | Domestic / foreign beneficiary | `part2HDomesticBeneficiary`, `part2HForeignBeneficiary` (`:120-121`) | Information | Stored, not used | Not used |
| — | "Did you materially participate?" (app question) | `materiallyParticipatedInActivity` (`:153`) | Boxes 6-8 losses "may be subject to the passive loss limitations … The rules for applying these limitations to beneficiaries haven't yet been issued" (`i1041sk1.pdf p. 2`) | No → box 6 joins the §469 pool (`TRCS:31572-31576`) | Match (reasonable reading) |

### Part III

| Box | IRS caption | App field (`MAP` line) | Where it goes (IRS) | What the app does | Status |
|---|---|---|---|---|---|
| 1 | Interest income | `part3Line1InterestIncome` (`:144`) | Form 1040 line 2b; Schedule B Part I line 1 (`i1041sk1.pdf p. 2`) | Schedule B item → line 2b (`TRCS:36066-36072`) | Match; **D-2b-1** |
| 2a | Ordinary dividends | `part3Line2aOrdinaryDividends` (`:145`) | Form 1040 line 3b; Schedule B Part II line 5 (`p. 2`) | Line 3b (`TRCS:36090-36091`) | Match; **D-3b-1** |
| 2b | Qualified dividends | `part3Line2bQualifiedDividends` (`:146`) | Form 1040 line 3a (`p. 2`) | Line 3a, capped at 2a | Match; D-3b-1 |
| 3 | Net short-term capital gain | `part3Line3NetShortTermCapitalGain` (`:147`) | Schedule D line 5 (`p. 2`) | Schedule D line 5 (`TRCS:25449-25450`) | Match; D-7a-2 |
| 4a | Net long-term capital gain | `part3Line4aNetLongTermCapitalGain` (`:148`) | Schedule D line 12 (`p. 2`) | Line 12 (`TRCS:25451-25452`) | Match; D-7a-2 |
| 4b | 28% rate gain | `part3Line4b28PercentRateGain` (`:149`) | 28% Rate Gain Worksheet line 4 (`p. 2`) | Worksheet line 4 | Match |
| 4c | Unrecaptured section 1250 gain | `part3Line4cUnrecapturedSection1250Gain` (`:150`) | Unrecaptured §1250 Gain Worksheet line 11 (`p. 2`) | Added to the worksheet (`TRCS:25455-25456`) | **D-sch-d-1** |
| 5 | Other portfolio and nonbusiness income | `part3Line5OtherPortfolioAndNonbusinessIncome` (`:151`) | Schedule E line 33 column (f) (`fk1041 p. 2`; royalties, annuities, IRD — `i1041sk1.pdf p. 2`) | Stored, never read | **Not supported D-sch-e-3** |
| 6 | Ordinary business income | `part3Line6OrdinaryBusinessIncome` (`:152`) | Schedule E line 33 column (d) or (f) (`fk1041 p. 2`) | Nonpassive → Schedule 1 line 5 via Schedule E line 32 (`TRCS:31519-31523, 4291, 4394`); passive → §469 pool | Match in amount; **D-sch-e-2** (line 32 not Part III), **D-6198-7**, D-8-8 |
| 7 | Net rental real estate income | `part3Line7NetRentalRealEstateIncome` (`:154`) | Schedule E line 33 column (d) or (f) | Stored, never read (only the community-property table, `CommunityProperty.java:593`) | **Not supported D-sch-e-3** |
| 8 | Other rental income | `part3Line8OtherRentalIncome` (`:155`) | Schedule E line 33 column (d) or (f) | Stored, never read | **Not supported D-sch-e-3** |
| 9 | Directly apportioned deductions — 3 rows (A depreciation, B depletion, C amortization) | `part3Line9DirectlyApportionedDeductionsBox1-3Code/Amount` (`:158-163`) | "Form 8582; or Schedule E, line 33, column (c) or (e)" (`fk1041 p. 2`; statement per activity, `i1041sk1.pdf p. 2`) | Never read | **D-k1-1041-4** |
| 10 | Estate tax deduction | `part3Line10EstateTaxDeduction` (`:166`) | "You may claim this amount on line 16 of Schedule A" (`i1041sk1.pdf p. 2`) | Never read | **D-k1-1041-5** |
| 11 | Final year deductions — 5 rows printed | rows 1-3 `part3Line11FinalYearDeductionsBox1-3Code/Amount` (`:169-174`); **rows 4-5 saved as** `part3Line12AlternativeMinimumTaxAdjustmentBox1-2…` | By code — §3 | Not read as box 11; rows 4-5 **read as box 12 AMT** | **D-10-5** (A), **D-7a-9** (C, D), **D-k1-1041-5** (B), **D-k1-1041-6** (E, F), **D-k1-1041-1** |
| 12 | AMT items — 5 rows printed | row 1 **saved as** `part3Line12AlternativeMinimumTaxAdjustmentBox3…`; **rows 2-5 saved as** `part3Line13CreditsAndCreditRecaptureBox1-4…` | A → Form 6251 line 2j; B-F portions of A; G-I applicable lines; J → 2026 Form 8801 (`i1041sk1.pdf p. 3`) | Keys `…Box1-3`: code A → line 2j, F → line 3 (`TRCS:4117-4121, 4192-4194, 31626-31634`); printed rows 2-5 never read | Row 1 Match for A; **D-k1-1041-1**, **D-k1-1041-7** |
| 13 | Credits and credit recapture — 3 rows printed | row 1 **saved as** `part3Line13CreditsAndCreditRecaptureBox5…`; rows 2-3 **saved as** `part3Line14OtherInformationBox1-2…` | A → Form 1040 line 26; B → line 25c; others → credit forms (`i1041sk1.pdf p. 3`) | Never read as credits; rows 2-3 are read as box 14 (code F) | **D-k1-1041-2**, **D-k1-1041-1** |
| 14 | Other information — 6 rows printed | **saved as** `part3Line14OtherInformationBox3-8Code/Amount` (`:197-212`) | By code — §3 | Only code F read, keys Box1-8 (`Form2210FGrossIncome.java:62-68`) | F Match (plus box 13 rows); **D-k1-1041-3, -8**; code I **D-k1-1041-9** |
| 14 I | Section 199A statement | `section199A…` group (`:109-115`) | Form 8995 / 8995-A (`i1041sk1.pdf p. 4`) | Read per person (`TRCS:17572-17587`) but not on the screen | **D-k1-1041-9** |

## 3. Checkboxes and codes

**Box 9 — Directly apportioned deductions** (`fk1041 p. 2`; `i1041sk1.pdf p. 2`): A depreciation, B depletion,
C amortization → "Form 8582; or Schedule E, line 33, column (c) or (e)". App: none (**D-k1-1041-4**).

**Box 11 — Final year deductions** (`i1041sk1.pdf p. 2-3`)

| Code | Meaning | IRS destination | App |
|---|---|---|---|
| A | Excess deductions — section 67(e) expenses | Schedule 1 line 24k | None **D-10-5**; in printed rows 4-5 it is read as AMT code A → Form 6251 line 2j (**D-k1-1041-1**) |
| B | Excess deductions — non-miscellaneous itemized | Applicable line of Schedule A | None **D-k1-1041-5** |
| C | Short-term capital loss carryover | Schedule D line 5 | None **D-7a-9** |
| D | Long-term capital loss carryover | Schedule D line 12; 28% worksheet line 5; §1250 worksheet line 16 | None **D-7a-9** |
| E | NOL carryover — regular tax | Schedule 1 line 8a | None **D-k1-1041-6** |
| F | NOL carryover — minimum tax | Form 6251 line 2f | None **D-k1-1041-6**; in printed rows 4-5 read as AMT code F → Form 6251 line 3 with the wrong sign (**D-k1-1041-1**) |

**Box 12 — AMT items** (`i1041sk1.pdf p. 3`)

| Code | Meaning | IRS destination | App |
|---|---|---|---|
| A | Adjustment for minimum tax purposes | Form 6251 line 2j | Printed row 1 only → line 2j (`TRCS:4117-4121`) — Match; rows 2-5 lost (**D-k1-1041-1**) |
| B-F | Portions of A attributable to qualified dividends, ST / LT gain, §1250, 28% gain | Form 6251 lines 13-15 instructions | None **D-k1-1041-7**; code F is summed to line 3 (`TRCS:4192-4194`) although for a 1041 it is a portion of A — double count when both A and F are present |
| G, H, I | Accelerated depreciation, depletion, amortization | Applicable line of Form 6251 | None **D-k1-1041-7** |
| J | Exclusion items | 2026 Form 8801 | None (next year) |

**Box 13 — Credits and credit recapture** (`i1041sk1.pdf p. 3`; `fk1041 p. 2`): **A credit for estimated taxes → Form 1040
line 26** ("treat the amount … as an estimated tax payment made on January 15, 2026"); **B backup withholding → Form
1040 line 25c**; C → Form 8586 / 3800; D → 7207; E → 7211; F work opportunity → 5884; G → 8941; H → 6478; I → 6765;
J → 8835; K → 8844; L → 7218; M → 8820; N → 8882; O → 8864; P → 8912; Q → 8932; R recapture → statement; S, T → 7213;
ZZ other. App: none (**D-k1-1041-2**). Codes in printed rows 2-3 are read as box 14: a code **F** (work opportunity credit)
there is taken as gross farming income (**D-k1-1041-1**).

**Box 14 — Other information** (`i1041sk1.pdf p. 3-5`; `fk1041 p. 2`)

| Code | Meaning | IRS destination | App |
|---|---|---|---|
| A | Tax-exempt interest | Form 1040 line 2a | None **D-k1-1041-3** |
| B | Foreign taxes | Schedule 3 line 1 or Schedule A line 6 | None **D-k1-1041-8** |
| C, D | Rehabilitation expenditures; energy property basis | Form 3468 | None |
| E | Net investment income | Form 4952 line 4a | None **D-k1-1041-8** |
| F | Gross farm and fishing income | Schedule E line 42 | All keys Box1-8 → Schedule E line 42 and Form 2210-F (`Form2210FGrossIncome.java:62-68, 102-110`) — Match, but keys Box1-2 are box 13 rows 2-3 (**D-k1-1041-1**) |
| G | Foreign trading gross receipts | Form 8873 | None (not applicable to most) |
| H | Adjustment for section 1411 NII | Form 8960 line 7 | None **D-k1-1041-8** |
| I | Section 199A information | Form 8995 / 8995-A | Separate fields not on the screen — **D-k1-1041-9** |
| J-M | Form 3468 property | Form 3468 | None |
| ZZ | Other (incl. §965, §951A, §1061, §163(j) items, `i1041sk1.pdf p. 5`) | Per statement | None |

**Checkboxes:** Final / Amended K-1, item D (Form 1041-T), item E (final Form 1041), item H. None read.

## 4. Questions the app asks with this statement

The material-participation question on the screen (`UI:33-41`); the income-adjustments form's line 24k field for box 11A
(typed only — the import key is never written, D-10-5); the capital-gain/loss form (gates boxes 3-4c, D-7a-2); the QBI form
(no K-1 section 199A input, D-k1-1041-9). Nothing asks whether the K-1 is from the estate's or trust's final year.

## 5. Differences from the IRS instructions

Reused: D-2b-1 (1), D-3b-1 (2a/2b), D-7a-2 (3-4c), D-7a-9 (11C/D), D-8-8 (6, 12, 14F person filter), D-10-5 (11A),
D-sch-d-1 (4c), D-sch-e-2 (box 6 on line 32), D-sch-e-3 (boxes 5, 7, 8 never read), D-6198-7 (box 6 losses unlimited).

New:

**D-k1-1041-1 — the screen splits boxes 11-14 as 3 / 3 / 5 / 8 rows; the form prints 5 / 5 / 3 / 6** (medium; silent
wrong amounts).
IRS: box 11 holds codes A-F, box 12 A-J, box 13 A-ZZ, box 14 A-ZZ, each in its own box (`i1041sk1.pdf p. 2-4`; printed
rows `fk1041 p. 1`).
Code: the renderer draws the slots at their printed rows (labels "11" top 97, "12" 257, "13" 417, "14" 513 in
`k1-html-form-data.ts`, variant 1041), but `fieldMap` (`UI:203-240`) and extraction (`GFM:2901-2922`) map:

| Printed position | Saved as |
|---|---|
| Box 11 rows 4-5 (`f1_36/37`, `f1_38/39`) | `part3Line12AlternativeMinimumTaxAdjustmentBox1…`, `…Box2…` |
| Box 12 row 1 (`f1_40/41`) | `…AlternativeMinimumTaxAdjustmentBox3…` |
| Box 12 rows 2-5 (`f1_42`-`f1_49`) | `part3Line13CreditsAndCreditRecaptureBox1-4…` |
| Box 13 row 1 (`f1_50/51`) | `part3Line13CreditsAndCreditRecaptureBox5…` |
| Box 13 rows 2-3 (`f1_52`-`f1_55`) | `part3Line14OtherInformationBox1-2…` |
| Box 14 rows 1-6 (`f1_56`-`f1_67`) | `part3Line14OtherInformationBox3-8…` |

Effects: a box 12 code A in rows 2-5 never reaches Form 6251 line 2j; a box 11 code A (§67(e) excess deductions) in row 4
or 5 is added to Form 6251 line 2j as if it were an AMT adjustment, and a code F (ATNOL carryover, a deduction) is added to
line 3 as a positive item (`sumK1AmtItems` reads `…Box1-3`, `TRCS:31626-31634`); a box 13 code F (work opportunity
credit) in row 2 or 3 is counted as gross farming income on Schedule E line 42 and Form 2210-F
(`Form2210FGrossIncome.java:62-68`). The UI round-trip spec drives only box 6, EIN and TIN
(`us-tax-be/e2e/tests/k1-1041-ui-roundtrip.spec.ts:18-20`).

**D-k1-1041-2 — box 13 codes A and B (payments) are never credited** (medium; silent; refund understated).
IRS: code A "The beneficiary treats this amount as a payment of estimated tax"; code B "Include this amount on line 25c of
your Form 1040 or 1040-SR" (`i1041sk1.pdf p. 3`); line 25c includes "Federal income tax withheld that is shown on a
Schedule K-1" (`i1040gi_ty2025.pdf p. 39`).
Code: no reader of `part3Line13CreditsAndCreditRecaptureBox*` outside `MAP` / `GFM`; line 26 and line 25c ignore K-1s.
The business credits (C-T, ZZ) are not supported.

**D-k1-1041-3 — box 14 code A tax-exempt interest is not on line 2a** (low-medium; silent). Same pattern as D-2a-1 for
the 1065 / 1120-S. IRS: 14A → "Form 1040 or 1040-SR, line 2a" (`fk1041 p. 2`). Code: never read. Line 2a and every
amount that uses it (social security taxable part, MAGI tests) understated.

**D-k1-1041-4 — box 9 directly apportioned deductions are never subtracted** (medium; silent; income overstated).
IRS: box 9 depreciation / depletion / amortization "directly apportioned to you … for each activity reported in boxes 5
through 8" (`i1041sk1.pdf p. 2`), reported on "Form 8582; or Schedule E, line 33, column (c) or (e)" (`fk1041 p. 2`).
Code: box 6 is income on Schedule 1 line 5 (`TRCS:31519-31523`) but `part3Line9DirectlyApportioned…` is never read.

**D-k1-1041-5 — box 10 estate tax deduction and box 11 code B are never deducted** (low-medium; silent). IRS: box 10
"You may claim this amount on line 16 of Schedule A"; 11B "deduct … on the applicable line of Schedule A"
(`i1041sk1.pdf p. 2`). Code: `part3Line10EstateTaxDeduction` and box 11 rows are never read. Itemizers only.

**D-k1-1041-6 — box 11 codes E and F (NOL carryovers on termination) are never used** (low; silent). IRS: E → "Schedule 1
(Form 1040), line 8a"; F → "Form 6251, line 2f" (`i1041sk1.pdf p. 3`). Code: not read; the Schedule 1 line 8a NOL comes only
from the filer's own carryforward.

**D-k1-1041-7 — box 12 codes B-I are not used, and code F is misread** (low; AMT only). IRS: "Codes B through F represent
the portion, if any, of the amount included in code A … Codes G through I. Include the amount … on the applicable line of
Form 6251" (`i1041sk1.pdf p. 3`). Code: only A (line 2j) and F (line 3, as the 1065 "other AMT items" meaning) are read
(`TRCS:4117-4121, 4192-4194`); for a 1041 code F is a portion of A, so A + F double-counts.

**D-k1-1041-8 — box 14 codes B, E, H are not read** (low). IRS: B foreign taxes → Schedule 3 line 1 / Schedule A line 6;
E → "Form 4952, line 4a"; H → "line 7 of Form 8960" (`fk1041 p. 2`; `i1041sk1.pdf p. 4`). Code: only code F is read.

**D-k1-1041-9 — box 14 code I (section 199A) cannot be entered** (high; silent). Same defect as **D-k1-1065-3**: no
screen input for the `section199A…` fields, a save writes them null (`MAP:109-115`), QBI from a trust or estate never
reaches Form 8995 / 8995-A (`i1041sk1.pdf p. 4`; `TRCS:17572-17587`).

**D-k1-1041-10 — truncated or blank beneficiary number** (low). Same as D-k1-1065-9: the truncated number allowed by
`i1041sk1.pdf p. 1` gives the blocking `STATEMENT_DOES_NOT_BELONG_TO_FAMILY` (`StatementSsnRules.java:100`;
`TRCS:13899-13911`); a blank one counts the income boxes on every return of the household.

**D-k1-1041-11 — the screen draws the 2024 form** (cosmetic; `us-tax-ui/public/irs/schedule_k1_form_1041_page_01.png`
prints "2024").

## 6. IRS sources

| Document | Pages | Used for |
|---|---|---|
| `i1041sk1.pdf` (Instructions for Schedule K-1 (Form 1041) for a Beneficiary Filing Form 1040, 2025) | 1 (purpose, truncated TIN, item E, codes), 2 (boxes 1-11A), 3 (11C-F, 12, 13), 4 (14C-I, ZZ), 5 (other items) | Destination of every box and code |
| `docs/IRS-Forms/Schedule k-1 Form 1041.pdf` (2024 Schedule K-1 (Form 1041)) | 1 (rows per box), 2 (code list and "Report on" column) | Codes and summarized destinations; layout (the 2025 copy is not on file) |
| `i1040se.pdf` | 10 | Schedule E Part III line 33 |
| `i1040gi_ty2025.pdf` | 39 | Lines 25c and 26 |
