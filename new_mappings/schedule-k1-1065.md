# Schedule K-1 (Form 1065) — Partner's Share of Income, Deductions, Credits, etc.

Statement form id `schedule-k1-1065`. Paths are relative to `C:\us-tax`. `TRCS` =
`us-tax-be/src/main/java/com/ustax/microservices/TaxReturnComputeService.java`; `MAP` =
`us-tax-be/src/main/java/com/ustax/microservices/statement/ScheduleK1Form1065Mapper.java`; `UI` =
`us-tax-ui/src/app/forms/form-schedule-k1-1065.component.ts`; `GFM` =
`us-tax-be/src/main/java/com/ustax/microservices/GenericFieldMapper.java`. Many K-1 items were already analysed at line
level (`new_knowledge\2a.md`, `2b.md`, `3a.md`, `7a.md`, `8.md`, `10.md`, `1e.md`, `forms\4562.md`, `4797.md`, `6198.md`,
`6781.md`, `7206.md`, `8582.md`, `schedule-d.md`, `schedule-e.md`, `schedule-se.md`); their ids are reused here.

---

## 1. What this statement is

A partnership gives each partner a Schedule K-1 (Form 1065) showing the partner's share of the partnership's income,
deductions, credits and other items. The partner does not file it; each box is carried to the line the instructions name.
Form copy: **2025 Schedule K-1 (Form 1065)** (`docs/IRS-Forms/f1065sk1.pdf`, one page; the box layout is the same as
2024). Codes: "In box 11, boxes 13 through 15, and boxes 17 through 20, the partnership will identify each item by
entering a code in the column to the left of the dollar amount entry space" (`i1065sk1.pdf p. 14`); the code list is
`i1065sk1.pdf p. 33-36`.

IRS instructions used: `i1065sk1.pdf` (Partner's Instructions, 2025) p. 1, 12, 14-36; `i1040se.pdf` p. 2, 8-11
(Schedule E Part II line 28, line 42); `i8582.pdf`, `i6198.pdf` (passive / at-risk, through the reused ids);
`i1040gi_ty2025.pdf` p. 39 (line 25c), p. 47 (Schedule SE); `i1040sd.pdf` (worksheets, via D-sch-d-1).

**Whose statement it is.** The partner in Part II item E ("Partner's SSN or TIN"), stored as `part2EPartnerSsnOrTin` and
mirrored into `recipientTIN` on save (`UI:346-356`: "recipientTIN drives statement->person attribution"); on a new entry
the person tab's SSN pre-fills `recipientTIN` and is copied into item E (`UI:334-344`). "For your protection, this form may
show only the last four digits of your identifying number" (`i1065sk1.pdf p. 1`) — see D-k1-1065-9.

**Storage.** `MAP` → entity `SeScheduleK11065` (table `se_schedule_k1_1065`); amounts are stored as text
(`NVARCHAR(40)`, `MAP:17-19`). The list call returns every K-1 (1065) of the account (`uid`) for the year — the whole
household (`MAP:71-80`). Before compute the list passes through `CommunityProperty.splitK1` (MFS community-property split,
`TRCS:3246-3247`; `us-tax-be/.../microservices/CommunityProperty.java:586-600`).

**How the screen works.** The K-1 is typed onto a drawing of the form (`k1-html-statement.component.ts` with the geometry in
`us-tax-ui/src/app/forms/k1-html-form-data.ts`, variant `1065`). Each input has a PDF-slot name; `fieldMap` (`UI:203-312`)
translates slot ↔ saved key, generated from `pdfs/schedule_k1_form_1065_field_map_semantic.csv`. Every key the screen
binds has a mapper column and every mapper column except the section 199A group, `part3OilGasIdcAmtPreferenceAmount`,
`ownerRole`, `taxYear`, `legacyDocId` is on the screen (diff of `UI` fieldMap vs `MAP:96-266`). **But the slot ↔ key map is
wrong for 23 Part III inputs** — the value a user types into box 12, 13, 14 (2nd row), 15, 17-21 is saved under a
different box's key (**D-k1-1065-1**). Upload extraction (Azure layout, `GFM:2693-2735`) writes the same keys in the same
row order. The screen's drawing is the 2024 form (it prints "2024") — layout identical (D-k1-1065-10, cosmetic).

**Amount parsing / losses.** The K-1 screens do **not** use the shared `parseAmountAndNotes` parser (D-ui-1): `syncPdfToForm`
copies the typed text unchanged (`UI:346-356`) and the mapper stores it as text. Compute parses with `parseAmount`
(`TRCS:52507-52536`): "(1,000)" → −1,000, "-1,000" → −1,000, "$" and "," stripped. A loss is therefore kept with its sign
whichever way it is typed — **Match**. A trailing minus ("1,000-") or text such as "STMT" parses to nothing (the box is
treated as blank, no flag) — minor, not given an id.

**Person filter (the D-1a-1 question).** It depends on the reader:

| Reader | Filter | Effect |
|---|---|---|
| Boxes 5, 6a/6b, 7 (interest, dividends, royalties) | Only drops the **other spouse's** K-1 on an MFS leg (`filterK1EntriesForMfs`, `TRCS:31667-31680`, used `:3709-3726`) | Dependent's K-1 on a parent's return and the parents' on a dependent's own return — **D-2b-1, D-3b-1, D-8-8** |
| Boxes 1, 2, 3 (Schedule E / line 5), box 17 (AMT), box 14 code B (Form 2210-F) | Same MFS-only filter (`TRCS:3832-3834`) | **D-8-8** |
| Boxes 8, 9a, 9b, 9c (Schedule D) | By `recipientTIN` = person's SSN (`belongsToCapitalPersonByKey`, `TRCS:25512-25535`) | Match; a blank TIN falls back to `ownerRole` (the mapper writes "taxpayer" when absent, `MAP:98-99`) |
| Section 199A fields (box 20 code Z) | `belongsToPerson` (`TRCS:17589-17591`) | Match (but the fields are unreachable, D-k1-1065-3) |
| Box 14 code A, box 20 code AQ (Schedule SE) | Exact SSN match (`TRCS:29015-29051`) | Match; a **blank** TIN is dropped silently (D-k1-1065-9) |

A TIN that belongs to nobody in the household raises the blocking `STATEMENT_DOES_NOT_BELONG_TO_FAMILY`
(`us-tax-be/.../microservices/StatementSsnRules.java:101`; check `TRCS:13891-13915`).

## 2. Box by box

`Status` uses the reused ids where the analysis already exists. "Row" means the code/amount line inside a box.

### Header, Part I, Part II

| Box | IRS caption | App field (`MAP` line) | Where it goes on the return (IRS) | What the app does | Status |
|---|---|---|---|---|---|
| — | Final K-1 / Amended K-1 | `headerFinalK1`, `headerAmendedK1` (`:132-133`) | Informational | Stored, not used | Not used |
| — | Tax year beginning / ending | `headerTaxYearBeginningMonth/Day`, `headerTaxYearEndingMonth/Day/Year` (`:177-181`) | A fiscal-year K-1 is reported in the year the partnership's year ends | Stored, not used (entry year = `returnTaxYear`) | Not used |
| A | Partnership's EIN | `part1APartnershipEin` (`:139`) | Schedule E line 28 column (d) (`i1040se.pdf p. 10`) | QBI aggregation key (`k1AggregationKey`, `TRCS:17988-18010`) | Match |
| B | Partnership's name, address | `part1BPartnershipNameAddressCityStateZip` (`:140`) | Schedule E line 28 (a); Schedule B payer name | First line used as Schedule B payer label (`TRCS:36048-36077, 36125-36131`) | Match |
| C | IRS center | `part1CIrsCenterWherePartnershipFiledReturn` (`:141`) | Informational | Stored, not used | Not used |
| D | Publicly traded partnership (PTP) | `part1DPubliclyTradedPartnership` (`:119`) | PTP income / losses follow the PTP rules (`i1065sk1.pdf p. 14`; `i8582.pdf`) | Stored, not used | **D-8582-11** |
| E | Partner's SSN or TIN | `part2EPartnerSsnOrTin` (`:144`) → `recipientTIN` (`:102`) | Whose K-1 it is | Person filter (§1) | Match / D-k1-1065-9 |
| F | Partner's name, address | `part2FPartnerNameAddressCityStateZip` (`:145`) | — | Stored, not used | Not used |
| G | General partner or LLC member-manager / Limited partner | `part2GGeneralPartnerOrLlcMemberManager`, `part2GLimitedPartnerOrOtherLlcMember` (`:120-121`) | Limited partners: no $25,000 rental allowance; only guaranteed payments for services are SE (`i1065sk1.pdf p. 14`, p. 21-22) | Stored, not used; boxes 2/3 always treated as "other passive" | **D-8582-12** |
| H1 / H2 | Domestic / foreign partner; disregarded entity, TIN, name | `part2H1DomesticPartner`, `part2H1ForeignPartner`, `part2H2DisregardedEntity`, `part2H2DisregardedEntityTin/Name` (`:122-124, 146-147`) | Informational | Stored, not used | Not used |
| I1 / I2 | Entity type; retirement plan | `part2I1PartnerEntityType`, `part2I2RetirementPlan` (`:125, 148`) | Informational | Stored, not used | Not used |
| J | Profit / loss / capital % beginning, ending; decrease due to sale / exchange | `part2JProfitPercent…`, `part2JLossPercent…`, `part2JCapitalPercent…`, `part2JDecreaseDueToSale/Exchange` (`:126-127, 149-154`) | Informational | Stored, not used | Not used |
| K1 | Share of liabilities: nonrecourse, qualified nonrecourse financing, recourse (beginning / ending) | `part2K1Nonrecourse…`, `part2K1QualifiedNonrecourseFinancing…`, `part2K1Recourse…` (`:157-162`) | Basis and at-risk (Form 6198) (`i1065sk1.pdf p. 12`; `i6198.pdf p. 2-4`) | Ending recourse + QNR used in the box 1 at-risk cap (`atRiskLimitedK1PartnershipOrdinary`, `TRCS:31534-31547`) | **D-6198-1** |
| K2 / K3 | Lower-tier liabilities; guarantees | `part2K2…`, `part2K3…` (`:130-131`) | Basis / at-risk information | Stored, not used | Not used |
| L | Capital account analysis | `part2LBeginningCapitalAccount`, `…CapitalContributedDuringYear`, `…CurrentYearNetIncomeLoss`, `…OtherIncreaseDecrease`, `…WithdrawalsAndDistributions`, `…EndingCapitalAccount` (`:165-170`) | Informational (not basis) | `CapitalContributedDuringYear` used in the at-risk cap; beginning capital ignored | **D-6198-1** |
| M | Built-in gain property contributed Yes / No | `part2MBuiltInGainPropertyContributedYes/No` (`:128-129`) | Informational | Stored, not used | Not used |
| N | Net unrecognized §704(c) gain (loss) | `part2NUnrecognizedSection704cGainLossBeginning/Ending` (`:173-174`) | Informational | Stored, not used | Not used |
| — | "Did you materially participate?" (app question, not on the K-1) | `materiallyParticipatedInActivity` (`:185`) | Decides box 1 passive vs nonpassive (`i1065sk1.pdf p. 14`) | No → box 1 joins the §469 pool; Yes/blank → nonpassive (`isPassiveK1`, `TRCS:31581-31583`) | Match (blank = nonpassive is a default, not an IRS rule) |

### Part III

| Box | IRS caption | App field (`MAP` line) | Where it goes on the return (IRS) | What the app does | Status |
|---|---|---|---|---|---|
| 1 | Ordinary business income (loss) | `part3Line1OrdinaryBusinessIncomeLoss` (`:184`) | Schedule E line 28: nonpassive col (i)/(k), passive income col (h), passive loss via Form 8582 col (g) — "after applying the basis and at-risk limitations" (`i1065sk1.pdf p. 14`) | Nonpassive: at-risk-capped, summed to Schedule 1 line 5 (`TRCS:4291, 4394, 31498-31547`); passive: §469 pool (`TRCS:3836-3841`, `31557-31579`) | Match in route; **D-6198-1, D-6198-2, D-6198-3, D-8582-1, D-sch-e-2, D-sch-e-8, D-8-8** |
| 2 | Net rental real estate income (loss) | `part3Line2NetRentalRealEstateIncomeLoss` (`:186`) | Schedule E line 28; passive unless real estate professional; $25,000 allowance if active participation and not a limited partner (`i1065sk1.pdf p. 14`) | Always "other passive", no allowance (`sumPassiveK1RentalNet`, `TRCS:31484-31496`) | **D-8582-12** |
| 3 | Other net rental income (loss) | `part3Line3OtherNetRentalIncomeLoss` (`:187`) | Schedule E line 28, passive (`i1065sk1.pdf p. 14-15`) | Same pool (`TRCS:31484-31496`) | Match (D-8582-1 for pool order) |
| 4a | Guaranteed payments for services | `part3Line4aGuaranteedPaymentsForServices` (`:188`) | Schedule E line 28 column (k), nonpassive (`i1065sk1.pdf p. 15`) | Stored, never read | **Not supported D-k1-1065-2** |
| 4b | Guaranteed payments for capital | `part3Line4bGuaranteedPaymentsForCapital` (`:189`) | Schedule E line 28 column (k) (`i1065sk1.pdf p. 15`) | Stored, never read | **D-k1-1065-2** |
| 4c | Total guaranteed payments | `part3Line4cTotalGuaranteedPayments` (`:190`) | Total of 4a + 4b (`i1065sk1.pdf p. 15`) | Read only by the community-property allocation table (`CommunityProperty.java:592`), not as income | **D-k1-1065-2** |
| 5 | Interest income | `part3Line5InterestIncome` (`:191`) | Form 1040 line 2b; Schedule B line 1 (`i1065sk1.pdf p. 15`) | Schedule B item → line 2b (`TRCS:3705-3713, 36048-36077`) | Match; **D-2b-1** (person) |
| 6a | Ordinary dividends | `part3Line6aOrdinaryDividends` (`:192`) | Form 1040 line 3b, less PTEP (`i1065sk1.pdf p. 15`) | Schedule B Part II item → line 3b (`TRCS:3714-3723, 36079-36106`) | Match; **D-3b-1, D-3b-5** |
| 6b | Qualified dividends | `part3Line6bQualifiedDividends` (`:193`) | Form 1040 line 3a (`i1065sk1.pdf p. 15`) | Line 3a, capped at the K-1's 6a (`TRCS:36100-36102`) | Match; D-3b-1, D-3b-5 |
| 6c | Dividend equivalents | `part3Line6cDividendEquivalents` (`:194`) | "Dividend equivalents aren't reported on Form 1040" (`i1065sk1.pdf p. 15`) | Stored, not used | Match (correctly unused) |
| 7 | Royalties | `part3Line7Royalties` (`:195`) | Schedule E line 4 (`i1065sk1.pdf p. 15`) | Added to Schedule 1 line 5 and Form 8960 (`TRCS:3724-3726, 4394, 5532, 36110-36123`); not shown on Schedule E line 4 | Match in amount; **D-sch-e-1**, D-461-2, D-8-8 |
| 8 | Net short-term capital gain (loss) | `part3Line8NetShortTermCapitalGainLoss` (`:196`) | Schedule D line 5 (`i1065sk1.pdf p. 15`) | Schedule D line 5 (`TRCS:25463-25471`) | Match; D-7a-2 (lost if the capital-gain form is not answered) |
| 9a | Net long-term capital gain (loss) | `part3Line9aNetLongTermCapitalGainLoss` (`:197`) | Schedule D line 12 (`i1065sk1.pdf p. 15`) | Schedule D line 12 (`TRCS:25472-25473`) | Match; D-7a-2 |
| 9b | Collectibles (28%) gain (loss) | `part3Line9bCollectibles28PercentGainLoss` (`:198`) | 28% Rate Gain Worksheet line 4 (`i1065sk1.pdf p. 16`) | Worksheet line 4 (`TRCS:25474-25475`) | Match |
| 9c | Unrecaptured section 1250 gain | `part3Line9cUnrecapturedSection1250Gain` (`:199`) | Unrecaptured §1250 Gain Worksheet line 5 / 10 / 11 by type (`i1065sk1.pdf p. 16`) | Added to the worksheet total (`TRCS:25476-25477`) | **D-sch-d-1** |
| 10 | Net section 1231 gain (loss) | `part3Line10NetSection1231GainLoss` (`:200`) | Form 4797 line 2 col (g), passive loss via Form 8582 (`i1065sk1.pdf p. 16`) | Stored, never read | **Not supported D-4797-1** (coordinator-verified) |
| 11 | Other income (loss) — code + amount, rows 1-2 | row 1 `part3Line11Code` / `part3Line11Amount` (`:203-204`); **row 2 saved as** `part3Line12Code` / `part3Line12Section179DeductionAmount` (`:207-208`, D-k1-1065-1) | By code — §3 | No code is read | **D-k1-1065-4**; code C **D-6781-9** |
| 12 | Section 179 deduction | **saved as** `part3Line13Row1Amount` (`:211`; the screen slot of box 12 maps there, D-k1-1065-1) | Form 4562 Part I (`i1065sk1.pdf p. 18`) | Never read (neither key) | **Not supported D-4562-11**; D-k1-1065-1 |
| 13 | Other deductions — code + amount, rows 1-3 | **saved as** `part3Line13Row2…`, `…Row3…`, `…Row4…` Code/Amount (`:212-217`) | By code — §3 | No code is read | **D-k1-1065-5**; code O **D-1e-7** |
| 14 | Self-employment earnings (loss) — rows 1-2 | row 1 `part3Line14Code` / `part3Line14SelfEmploymentEarningsLossAmount` (`:220-221`); **row 2 saved as** `part3Line15Row1Code/Amount` (`:224-225`) | Code A → Schedule SE line 2 (after the reductions on p. 21-22); B → Schedule E line 42 + farm optional method; C → nonfarm optional method (`i1065sk1.pdf p. 21-22`) | Row 1 only: code A or blank → Schedule SE line 2 per person (`TRCS:29031-29051`, used `:29194`; also QBI SE attribution `:18015-18022`, `:4253-4256`); code B → Form 2210-F / Schedule E line 42 (`Form2210FGrossIncome.java:45-52, 102-110`). Row 2 never read | Match for row 1; **D-sch-se-8, D-7206-2**; row 2 **D-k1-1065-1** |
| 15 | Credits — rows 1-2 | **saved as** `part3Line15Row2…`, `part3Line15Row3…` Code/Amount (`:226-229`) | By code — §3 (O backup withholding → line 25c; H → Schedule 3 line 13a) | Never read | **D-k1-1065-6** |
| 16 | Schedule K-3 is attached | `part3Line16ScheduleK3Attached` (`:136`) | Use Schedule K-3 for Form 1116 etc. (`i1065sk1.pdf p. 24`) | Stored, not used (Form 1116 reads hand-entered income) | Not used (informational) |
| 17 | AMT items — rows 1-3 | row 1 `part3Line17Code` / `part3Line17AlternativeMinimumTaxAmtItemsAmount` (`:232-233`); **rows 2-3 saved as** `part3Line18Row1…`, `part3Line18Row2…` (`:237-240`) | A → Form 6251 line 2l; B → 2k; C → 2d; D/E → statement; F → applicable lines (`i1065sk1.pdf p. 24`) | Row 1 only: A → 2l (nonpassive) / 2m (passive), C → 2d / 2m, F → line 3 (`TRCS:4114-4116, 4178-4194, 31603-31624`); B, D, E not read; rows 2-3 never read | Match for A/C/F row 1; **D-k1-1065-7**, **D-k1-1065-1** |
| — | IDC preference (app field, no K-1 box) | `part3OilGasIdcAmtPreferenceAmount` (`:234`) | Form 6251 line 2t (from the box 17 D/E statement) | Summed to line 2t (`TRCS:4190, 31648-31660`) — **not on the screen**; reachable only by API | Not supported from the UI (part of D-k1-1065-7) |
| 18 | Tax-exempt income and nondeductible expenses — rows 1-3 | **saved as** `part3Line18Row3…`, `part3Line19Row1…`, `part3Line19Row2…` (`:242, 245-248`) | A → Form 1040 line 2a; B, C → basis only (`i1065sk1.pdf p. 25`) | Never read | **Not supported D-2a-1** (code A); B/C correctly unused |
| 19 | Distributions — rows 1-2 | **saved as** `part3Line19Row3…`, `part3Line20Row1…` (`:249-254`) | Basis; a cash distribution over basis is a gain (`i1065sk1.pdf p. 25-27`) | Never read | Not used; basis not modelled **D-sch-e-8** |
| 20 | Other information — rows 1-4 | **saved as** `part3Line20Row2…`, `…Row3…`, `…Row4…`, `part3Line21Row1…` (`:255-264`) | By code — §3 | Only code AQ is read, from keys `part3Line20Row1-4` (`TRCS:29015-29028`) — i.e. rows 1-3 of box 20 plus box 19 row 2 | AQ Match for rows 1-3; **D-k1-1065-8**; code Z **D-k1-1065-3** |
| 21 | Foreign taxes paid or accrued | **saved as** `part3Line21Row2Amount` (`:265`) | "Don't use this amount to complete your Form 1116 … See Schedule K-3" (`i1065sk1.pdf p. 32`) | Never read | Match (correctly unused) |
| 22 | More than one activity for at-risk purposes | `part3Line22MoreThanOneActivityForAtRiskPurposes` (`:134`) | Use the attached statement (`i1065sk1.pdf p. 32`) | Stored, not used; at-risk is aggregated | **D-6198-3** |
| 23 | More than one activity for passive purposes | `part3Line23MoreThanOneActivityForPassiveActivityPurposes` (`:135`) | Use the attached statement (`i1065sk1.pdf p. 32`) | Stored, not used (one participation answer per K-1) | Not used (low; no id) |
| 20 Z | Section 199A statement (QBI, W-2 wages, UBIA, REIT, PTP, SSTB) | `section199AQualifiedBusinessIncomeAmount`, `…W2WagesAmount`, `…UbiaQualifiedPropertyAmount`, `…QualifiedReitDividendsAmount`, `…QualifiedPtpIncomeOrLossAmount`, `section199AIsSstb`, `section199AStatementNotes` (`:110-116`) | Form 8995 / 8995-A (`i1065sk1.pdf p. 29-30`) | Read per person into the QBI activities (`TRCS:17589-17604, 17960-18010`) — **but the K-1 screen has no input for any of them**, and a save from the screen writes them null | **D-k1-1065-3** |

## 3. Checkboxes and codes

Only the codes the app reads have a non-"none" app column. Destinations from `i1065sk1.pdf` (page in brackets).

**Box 11 — Other income (loss)** (no code is read; **D-k1-1065-4** unless noted)

| Code | Meaning | IRS destination | App |
|---|---|---|---|
| A | Other portfolio income (loss) | Per statement; REMIC → Schedule E line 38 (p. 16) | None |
| B | Involuntary conversions | Form 4684 line 34 (p. 16) | None |
| C | Section 1256 contracts and straddles | Form 6781 (p. 16) | None — **D-6781-9** |
| D | Mining exploration costs recapture | Per statement (p. 16) | None |
| E | Cancellation of debt | Schedule 1 line 8c (p. 16) | None |
| F | §743(b) positive income adjustments | Schedule E line 28 (p. 14, 16) | None |
| I | Disposition of oil, gas, geothermal, mineral property | Form 4797 / Schedule D per statement (p. 16-17) | None |
| J | Recoveries of tax benefit items | Schedule 1 line 8z (p. 17) | None |
| K | Gambling gains and losses | Schedule 1 line 8b; losses Schedule A line 16 (p. 17) | None |
| L | §751(b) distribution income | Form 4797 Part II line 10 (p. 17) | None |
| M, N | Gain eligible for §1045 rollover | Schedule D per statement (p. 17) | None |
| O | QSB stock with §1202 exclusion | Schedule D per statement (p. 18) | None |
| P | Farm recapture property (§1252) | Form 4797 Part III (p. 18) | None |
| Q | Fannie Mae / Freddie Mac preferred stock | Form 4797 per statement (p. 18) | None |
| R | Specially allocated ordinary gain (loss) | Form 4797 Part II line 10 (p. 18) | None |
| S | Non-portfolio capital gain (loss) | Schedule D per statement (p. 18) | None |
| ZZ | Other | Per statement (p. 18) | None |

**Box 13 — Other deductions** (no code is read; **D-k1-1065-5** unless noted)

| Code | Meaning | IRS destination | App |
|---|---|---|---|
| A, B | Cash contributions (60% / 30%) | Schedule A line 11 (p. 18-19) | None |
| C, D, E, F | Noncash / capital gain property contributions | Schedule A line 12 (p. 19) | None |
| G | Contributions (100%) | Schedule A per statement (p. 19) | None |
| H | Investment interest expense | Form 4952 line 1 (p. 20) | None |
| I | Deductions — royalty income | Schedule E line 19 (p. 20) | None |
| J | §59(e)(2) expenditures | Election per statement (p. 20) | None |
| K | Excess business interest expense | Form 8990 (p. 20) | None |
| L | Deductions — portfolio income (other) | Schedule A line 16 (p. 20) | None |
| M | Amounts paid for medical insurance | Schedule 1 line 17 / Form 7206 (p. 20) | None |
| N | Educational assistance benefits | Schedule E line 28, up to $5,250 (p. 20) | None |
| O | Dependent care benefits | Form 2441 Part III (p. 20) | None — **D-1e-7** |
| P | Preproductive period expenses | Per statement (p. 20) | None |
| R | Pensions and IRAs | Schedule 1 line 16 / line 20 (p. 20-21) | None |
| S | Reforestation expense | Per statement (p. 21) | None |
| V | §743(b) negative income adjustments | Schedule E line 28 (p. 21) | None |
| W, X, Y | Soil and water conservation; film production; removal of barriers | Per statement (p. 21) | None |
| Z | Itemized deductions | Schedule A (p. 21) | None |
| AA | Capital construction fund | Subtract from line 15, "CCF" (p. 21) | None |
| AB | Penalty on early withdrawal of savings | Schedule 1 line 18 (p. 21) | None |
| AC | Interest on debt-financed distributions | By use of proceeds, e.g. Schedule E line 28 (p. 21) | None |
| AD | Interest on oil/gas working interest | Per statement (p. 21) | None |
| AE | Deductions — portfolio income | Not deductible by individuals for 2025 (p. 21) | None (correct) |
| ZZ | Other | Per statement (p. 21) | None |

**Box 14 — Self-employment earnings (loss)** (p. 21-22)

| Code | Meaning | IRS destination | App |
|---|---|---|---|
| A | Net earnings (loss) from self-employment | Schedule SE line 2 (after reductions) | Row 1 (or blank code) → Schedule SE line 2, per person (`TRCS:29031-29051`) — **D-7206-2** (not earned income for Form 7206); row 2 lost **D-k1-1065-1** |
| B | Gross farming or fishing income | Schedule E line 42; farm optional method | Row 1 → Schedule E line 42 + Form 2210-F (`Form2210FGrossIncome.java:45-52`); optional method not used **D-sch-se-8** |
| C | Gross nonfarm income | Nonfarm optional method | Not read **D-sch-se-8** |

**Box 15 — Credits** (none read; **D-k1-1065-6**). A, B → Form 7213; C, D → Form 8586; E → Form 3468; F, G → per
statement; **H → Schedule 3 line 13a**; I → Form 6478; J → Form 5884; K → Form 8826; L → Form 8844; M → Form 6765;
N → Form 8846; **O (backup withholding) → Form 1040 line 25c**; P-U → Form 3468; V → 7207; W → 7211; X → 7218; Y → 7210;
Z → 8820; AA → 8830; AB → 8835; AC → 8864; AD → 8874; AE-AG → 8881; AH → 8882; AI → 8896; AJ → 8900; AK → 8904;
AL → 8906; AM → 8908; AO → 8911; AP-AU → 8912; AV → 8932; AW, AX → 8933; AY, AZ → 8936; BA → 8941; BB → 8994;
BC → Form 3800; ZZ → statement (`i1065sk1.pdf p. 22-24`). The general business credits are not supported by the app.

**Box 17 — AMT items** (p. 24)

| Code | Meaning | IRS destination | App |
|---|---|---|---|
| A | Post-1986 depreciation adjustment | Form 6251 line 2l | Row 1 → 2l (nonpassive) / 2m (passive) (`TRCS:4114-4116, 4185-4188`) — Match |
| B | Adjusted gain or loss | Form 6251 line 2k | Not read **D-k1-1065-7** |
| C | Depletion (other than oil & gas) | Form 6251 line 2d | Row 1 → 2d / 2m (`TRCS:4178-4188`) — Match |
| D, E | Oil, gas & geothermal gross income / deductions | Per statement (line 2t) | Not read; IDC only via the API-only field **D-k1-1065-7** |
| F | Other AMT items | Applicable lines of Form 6251 | Row 1 → line 3 (`TRCS:4192-4194`) — Match in total, not per line |

Rows 2-3 of box 17 are never read (**D-k1-1065-1**).

**Box 18** (p. 25): A tax-exempt interest → Form 1040 line 2a (**D-2a-1**); B other tax-exempt income → basis only; C
nondeductible expenses → basis only. App: none.

**Box 19 — Distributions** (p. 25-27): A cash and marketable securities; B §737; C other property; D deemed distributions
(decrease in liabilities); F, G distributions for services. All reduce basis; excess cash over basis is gain. App: none
(basis not modelled, **D-sch-e-8**).

**Box 20 — Other information** (p. 27-32)

| Code | Meaning | IRS destination | App |
|---|---|---|---|
| A | Investment income | Form 4952 line 4a | None **D-k1-1065-8** |
| B | Investment expenses | Form 4952 line 5 | None **D-k1-1065-8** |
| C | Fuel tax credit information | Form 4136 | None (credit not supported) |
| D, E | Rehabilitation expenditures; basis of energy property | Form 3468 | None |
| F, G, H, I | Credit recaptures | Form 8611 / 4255 / per statement | None |
| J, K | Look-back interest | Form 8697 / 8866 | None |
| L, M | §179 property dispositions / recapture | Form 4797 | None **D-k1-1065-8** |
| N | Business interest expense (basis loss class) | Basis information | None |
| O, P, Q | §453(l)(3), §453A(c), §1260(b) interest | Schedule 2 / statement | None |
| R, S, T | Production-period interest; CCF withdrawals; oil & gas depletion info | Per statement | None |
| U | §743(b) basis adjustment | Information | None (correct) |
| V | UBTI (tax-exempt partners) | — | None (correct) |
| W, X | Precontribution gain; payment obligations | Per statement / information | None |
| Y | Net investment income | Form 8960 | None **D-k1-1065-8** |
| Z | Section 199A information | Form 8995 / 8995-A | Separate section 199A fields, not on the screen — **D-k1-1065-3** |
| AA | §704(c) information | Information | None (correct) |
| AB, AC, AD | §751 gain; collectibles gain; unrecaptured §1250 gain on sale of the interest | Form 4797 / 28% and §1250 worksheets | None **D-k1-1065-8** |
| AE, AF, AG | Excess taxable income; excess business interest income; gross receipts | Form 8990 | None **D-k1-1065-8** |
| AH | Noncash charitable contributions (basis-limited) | Schedule A per statement | None (D-k1-1065-5) |
| AI | §409A interest and tax | Schedule 2 | None |
| AJ | Excess business loss limitation | Form 461 | None **D-k1-1065-8** (cf. D-461-3) |
| AK, AL, AM | Mark-to-market gain; §721(c); §1061 | Per statement | None |
| AN | Farming and fishing business | §1301 information | None |
| AO, AP | PTP information; inversion gain | Per statement | None |
| AQ | Conservation reserve program payments | Schedule SE line 1b exclusion | Read from keys `part3Line20Row1-4`, per person, → Schedule SE line 1b (`TRCS:29015-29028, 29226-29247`) — Match except row 4 (**D-k1-1065-1**) |
| AR-AZ | IRA disclosure; Form 3468 property; reportable transactions; CAMT; foreign partners; preformation reimbursement | Per statement | None |
| ZZ | Other | Per statement | None |

**Checkboxes:** Final / Amended K-1, item D (PTP — **D-8582-11**), G, H1, H2, I2, J sale / exchange, K2, K3, M yes / no,
box 16 (K-3), box 22 (at-risk activities — **D-6198-3**), box 23 (passive activities). None but item D/box 22 bear on a
rule; none is read.

## 4. Questions the app asks with this statement

- On the K-1 screen: "Did you materially participate in this business activity?" (`materiallyParticipatedInActivity`,
  `UI:33-41`, radio at `:37-38`) — passive / nonpassive for box 1. Boxes 2/3 ignore it (per se passive).
- Passive-activity carryforward form (`passive-activity-carryforward-taxpayer` / `-spouse`): prior suspended K-1 loss and
  the K-1 amount at risk (`passiveK1AtRiskAmount`, `TRCS:3858-3870`) — see `new_knowledge\forms\6198.md`, `8582.md`.
- QBI form (`qbi-deduction-*`): counts K-1s and says the deduction "is calculated from the section 199A amounts in your
  uploaded statements — no need to re-enter" (`us-tax-ui/src/app/forms/form-qbi-deduction.component.html:56-59`); a
  manual adjustment exists under "advanced" (`:220-250`). See D-k1-1065-3.
- Capital-gain/loss form: must be answered Yes / saved for boxes 8-9c to count (D-7a-2).
- MFS community property: `cpPassThroughCommunityPct` splits every Part III amount except box 14 (`CommunityProperty.java:586-600`).

## 5. Differences from the IRS instructions

Reused (see the cited file): D-2a-1 (18A), D-2b-1 (5), D-3b-1 / D-3b-5 (6a/6b), D-7a-2 (8-9c gated on the capital form),
D-8-8 (1, 2, 3, 7, 17 person filter), D-4797-1 (10), D-6781-9 (11C), D-4562-11 (12), D-1e-7 (13O), D-sch-se-8 /
D-7206-2 (14), D-sch-d-1 (9c), D-sch-e-1 / D-sch-e-2 / D-sch-e-8 (Schedule E presentation, basis / Form 7203 not
modelled), D-8582-1 / D-8582-11 / D-8582-12 (passive), D-6198-1 / -2 / -3 (at-risk), D-461-2 / D-461-3.

New:

**D-k1-1065-1 — the screen saves 23 Part III inputs under another box's key** (medium; silent wrong amounts today in
boxes 14, 17, 20; a trap for every future reader).
IRS: each box has its own line (`i1065sk1.pdf p. 14-32`); the form prints box 11 with two rows, box 12 one amount,
box 13 three rows, box 14 two, box 15 two, box 17 three, box 18 three, box 19 two, box 20 four, box 21 one
(`docs/IRS-Forms/f1065sk1.pdf` p. 1).
Code: the renderer places each slot at its printed position (box labels "11" top 611, "12" 675, "13" 707; "14" 99,
"15" 163, "16" 227, "17" 259, "18" 355, "19" 467, "20" 531, "21" 675 in `k1-html-form-data.ts`, variant 1065), but
`fieldMap` (`UI:272-311`), generated from a mis-labelled `pdfs/schedule_k1_form_1065_field_map_semantic.csv`, maps:

| Printed position (slot) | Saved as |
|---|---|
| Box 11 row 2 (`f1_52`, `f1_53`) | `part3Line12Code`, `part3Line12Section179DeductionAmount` (`UI:272-273`) |
| Box 12 (`f1_54`) | `part3Line13Row1Amount` (`UI:274`) |
| Box 13 rows 1-3 (`Line13`/`f1_55`, `f1_56/57`, `f1_58/59`) | `part3Line13Row2…`, `Row3…`, `Row4…` |
| Box 14 row 2 (`f1_61/62`) | `part3Line15Row1Code/Amount` (`UI:283-284`) |
| Box 15 rows 1-2 (`Line15`/`f1_63`, `f1_64/65`) | `part3Line15Row2…`, `Row3…` |
| Box 17 rows 2-3 (`f1_80/81`, `f1_82/83`) | `part3Line18Row1…`, `part3Line18Row2…` (`UI:290-293`) |
| Box 18 rows 1-3 (`Line18`/`f1_84`, `f1_85/86`, `f1_87/88`) | `part3Line18Row3…`, `part3Line19Row1…`, `part3Line19Row2…` |
| Box 19 rows 1-2 (`Line19`/`f1_89`, `f1_90/91`) | `part3Line19Row3…`, `part3Line20Row1…` |
| Box 20 rows 1-4 (`Line20`/`f1_92`, `f1_93/94`, `f1_95/96`, `f1_97/98`) | `part3Line20Row2…`, `Row3…`, `Row4…`, `part3Line21Row1…` |
| Box 21 (`f1_66`) | `part3Line21Row2Amount` (`UI:288`) |

Upload extraction writes the same keys in the same order (`GFM:2693-2735`). Effects in today's compute: a second box 17
row (e.g. 17C under 17A) never reaches Form 6251 (only `part3Line17Code` is read, `TRCS:31611-31612`); a second box 14 row
(14B gross farming income, or 14A when the partnership lists it second) never reaches Schedule E line 42 / Form 2210-F /
Schedule SE (`TRCS:29041-29045`, `Form2210FGrossIncome.java:49-51`); a box 20 code AQ in row 4 never reaches Schedule SE
line 1b (`TRCS:29021-29024` reads keys `part3Line20Row1-4`, whose Row1 is box 19). Latent: a fix for D-4562-11 that reads
`part3Line12Section179DeductionAmount` would take box 11 row 2 as section 179, and a box 13 reader would take the
section 179 amount as box 13 row 1. Not caught by tests: the UI round-trip spec drives only box 1, EIN and TIN
(`us-tax-be/e2e/tests/k1-1065-ui-roundtrip.spec.ts:18-20`); code-box specs seed the semantic keys by API.

**D-k1-1065-2 — guaranteed payments (boxes 4a / 4b / 4c) are never income** (high; silent; income omitted).
IRS: "Generally, amounts on this line aren't passive income, and you should report them in column (k) of Schedule E
(Form 1040), line 28" (box 4a); box 4b "should be reported in column (k) of Schedule E (Form 1040), line 28"
(`i1065sk1.pdf p. 15`).
Code: no compute reader of `part3Line4aGuaranteedPaymentsForServices`, `…4b…`, or `…4c…` (only
`CommunityProperty.java:592` lists 4c for the Form 8958 allocation table; `GFM` extraction). Schedule 1 line 5 takes
K-1 box 1 and royalties only (`TRCS:4291, 4394`).
Effect: a partner paid $60,000 of guaranteed payments has $0 of it in AGI; SE tax is still charged through box 14A (which
includes them), so the return is internally inconsistent. Severity **high** (guaranteed payments are common for working
partners and LLC members).

**D-k1-1065-3 — section 199A (box 20 code Z) cannot be entered, so K-1 QBI never reaches line 13a from the screen**
(high; silent). Same for K-1 (1120-S) box 17 code V and K-1 (1041) box 14 code I.
IRS: "The partnership will provide the information you need to figure your" QBI deduction — QBI, W-2 wages, UBIA, SSTB,
REIT dividends, PTP income — on Form 8995 / 8995-A (`i1065sk1.pdf p. 29-30`).
Code: compute reads only `section199AQualifiedBusinessIncomeAmount`, `…W2WagesAmount`, `…UbiaQualifiedPropertyAmount`,
`section199AIsSstb`, `…QualifiedReitDividendsAmount`, `…QualifiedPtpIncomeOrLossAmount` (`TRCS:17589-17604,
17960-18010`). None is in the K-1 screen's model or `fieldMap` (`UI:83-199, 203-311`) — they exist only in
`capital-statement-configs.ts`, which the shell does not use for K-1s (`us-tax-ui/src/app/shell/shell.component.ts:579-581,
1042-1052`). A screen save sends no section 199A keys and `MAP:110-116` writes them null, erasing any value seeded by API.
The QBI form's blocking checks for "missing the stable section 199A statement fields" (`TRCS:17488-17510`) fire only when
`receivedScheduleK1Form1065With199A` is true, a key no UI file writes. The QBI form tells the user the deduction "is
calculated from the section 199A amounts in your uploaded statements — no need to re-enter"
(`form-qbi-deduction.component.html:56-59`).
Effect: every partner / S shareholder / beneficiary with QBI gets no Form 8995 line for the K-1 unless they find the
"advanced — supplemental adjustments" manual amount. Severity **high**.

**D-k1-1065-4 — box 11 (other income) is never read** (medium; silent; codes A, B, E, F, I-S, ZZ — code C is D-6781-9).
IRS: e.g. code E "cancellation of debt … included in your gross income (Schedule 1 (Form 1040), line 8c)"; code K
"report gambling winnings on Schedule 1 (Form 1040), line 8b"; code R "Report this amount on Form 4797, Part II,
line 10" (`i1065sk1.pdf p. 16-18`).
Code: no compute reader of `part3Line11Code` / `part3Line11Amount` (or of row 2, D-k1-1065-1).
Effect: income or loss omitted. Severity **medium**.

**D-k1-1065-5 — box 13 (other deductions) is never read** (medium; silent; deduction lost; code O is D-1e-7).
IRS: codes A-F to Schedule A lines 11 / 12; H to Form 4952 line 1; M "On Schedule 1 (Form 1040), line 17, you may be
allowed to deduct"; AB "Report this amount on Schedule 1 (Form 1040), Part II, line 18" (`i1065sk1.pdf p. 18-21`).
Code: no reader of any `part3Line13Row*` key.
Effect: partnership charitable contributions, investment interest, early-withdrawal penalty, self-employed health
insurance, SEP/Keogh contributions passed through on a K-1 are lost unless typed on another form. Severity **medium**.

**D-k1-1065-6 — box 15 (credits) is never read, including two payments** (medium; silent).
IRS: code O backup withholding — "Include this amount in the total you enter on Form 1040 or 1040-SR, line 25c"; code H
undistributed capital gains tax — "Report these taxes on Schedule 3 (Form 1040), Part II, line 13a" (`i1065sk1.pdf
p. 22-23`); line 25c includes "Federal income tax withheld that is shown on a Schedule K-1" (`i1040gi_ty2025.pdf p. 39`).
Code: no reader of `part3Line15Row*`.
Effect: refund understated by the K-1 backup withholding / §852 tax; the business credits (codes A-N, P-BC) are simply
not supported. Severity **medium** (payments), credits low.

**D-k1-1065-7 — box 17 codes B, D, E are not used** (low; AMT only).
IRS: code B → "Form 6251, Part I, line 2k"; codes D/E per the attached statement (`i1065sk1.pdf p. 24`).
Code: `sumK1AmtItems` is called only with codes A, C, F (`TRCS:4114-4116, 4178-4194`); its comment lists B, D / E (and F, which is in fact read at `:4192-4194`) as
deferred (`TRCS:31597-31601`). The IDC preference has an API-only field (`part3OilGasIdcAmtPreferenceAmount`, `MAP:234`)
that the screen does not offer. Severity **low**.

**D-k1-1065-8 — box 20 codes that change an amount are not read** (low-medium; silent).
IRS: A → "Form 4952, Part II, line 4a"; B → "Form 4952, Part II, line 5"; Y → net investment income tax; AE / AF / AG →
Form 8990; AJ → Form 461; L / M → section 179 dispositions / recapture; AB / AC / AD → gain on sale of the interest
(`i1065sk1.pdf p. 27-31`).
Code: only code AQ is read (`TRCS:29015-29028`). Severity **low-medium** (Form 4952 and Form 8990 are filed from other
inputs; only affected filers).

**D-k1-1065-9 — truncated or blank partner TIN** (low).
IRS: "this form may show only the last four digits of your identifying number" (`i1065sk1.pdf p. 1`).
Code: typing the TIN as printed ("XXX-XX-1234") normalises to "1234", which matches no household SSN →
**blocking** `STATEMENT_DOES_NOT_BELONG_TO_FAMILY` (`TRCS:13899-13911`). A **blank** TIN is skipped by that check; the
income boxes then count on every return of the household (MFS filter only drops a matching TIN, `TRCS:31675-31677`), the
capital boxes fall back to `ownerRole` "taxpayer", but box 14A and box 20 AQ require an exact SSN match and are dropped
(`TRCS:29020, 29038`) — box 1 income without its SE tax, silently. Severity **low** (the screen pre-fills the person's
SSN).

**D-k1-1065-10 — the screen draws the 2024 form** (cosmetic). The drawing prints "2024" and "For calendar year 2024"
(`k1-html-form-data.ts`, variant 1065, from `us-tax-ui/public/irs/schedule_k1_form_1065_page_01.png`); the 2025 form has
the same boxes (`docs/IRS-Forms/f1065sk1.pdf`). No effect on amounts.

## 6. IRS sources

| Document | Pages | Used for |
|---|---|---|
| `docs/IRS-Forms/f1065sk1.pdf` (2025 Schedule K-1 (Form 1065)) | 1 | Captions, box layout (rows per box) |
| `i1065sk1.pdf` (Partner's Instructions for Schedule K-1 (Form 1065), 2025) | 1 (truncated TIN), 12 (at-risk / basis), 14-16 (boxes 1-11), 16-18 (box 11 codes), 18-21 (boxes 12-13), 21-22 (box 14), 22-24 (box 15), 24 (boxes 16-17), 25-27 (boxes 18-19), 27-32 (box 20), 32 (boxes 21-23), 33-36 (list of codes) | Destination of every box and code |
| `i1040se.pdf` | 2, 8-11 | Schedule E Part II line 28 columns, line 42 |
| `i1040gi_ty2025.pdf` | 39, 47 | Line 25c (K-1 withholding), Schedule SE K-1 lines |
| `i8582.pdf`, `i6198.pdf`, `i1040sd.pdf`, `i4797.pdf`, `i6781.pdf`, `i4562.pdf` | via the reused ids | Passive, at-risk, worksheets, §1231, §1256, §179 |
