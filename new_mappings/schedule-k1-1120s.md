# Schedule K-1 (Form 1120-S) — Shareholder's Share of Income, Deductions, Credits, etc.

Statement form id `schedule-k1-1120s`. Paths are relative to `C:\us-tax`. `TRCS` =
`us-tax-be/src/main/java/com/ustax/microservices/TaxReturnComputeService.java`; `MAP` =
`us-tax-be/src/main/java/com/ustax/microservices/statement/ScheduleK1Form1120sMapper.java`; `UI` =
`us-tax-ui/src/app/forms/form-schedule-k1-1120s.component.ts`; `GFM` =
`us-tax-be/src/main/java/com/ustax/microservices/GenericFieldMapper.java`. The partnership K-1 file
(`schedule-k1-1065.md`) describes the shared screen, parser and person-filter machinery in more detail; this file
repeats only what differs. Reused ids come from `new_knowledge\` (see `schedule-k1-1065.md` §5).

---

## 1. What this statement is

An S corporation gives each shareholder a Schedule K-1 (Form 1120-S) showing the shareholder's pro rata share of its
income, deductions, credits and other items. Form copy: **2025 Schedule K-1 (Form 1120-S)**
(`docs/IRS-Forms/f1120ssk.pdf`, one page; same box layout as 2024). Boxes 10, 12, 13, 15, 16 and 17 carry codes,
listed in `i1120ssk.pdf p. 20-21`.

IRS instructions used: `i1120ssk.pdf` (Shareholder's Instructions, 2025) p. 1, 6-21; `i1040se.pdf` p. 2, 8-11
(Schedule E line 28, Form 7203 basis); `i1040gi_ty2025.pdf` p. 39 (line 25c).

**Whose statement it is.** Part II item E "Shareholder's identifying number", stored as
`part2EShareholderIdentifyingNumber` and copied into `recipientTIN` on save (`UI:352-361`); a new entry is pre-filled
with the person tab's SSN (`UI:340-350`). The instructions allow a truncated number (`i1120ssk.pdf p. 1`) — D-k1-1120s-8.

**Storage.** `MAP` → entity `SeScheduleK11120s`; amounts stored as text. The list call returns every K-1 (1120-S) of the
account for the year (`MAP:69-78`). Compute receives the list after `CommunityProperty.splitK1` (`TRCS:3248-3249`).

**Screen.** Same drawn-form screen as the 1065 (`k1-html-statement.component.ts`, variant `1120s`); `fieldMap`
`UI:206-321`. Every screen key has a mapper column; the mapper's section 199A group,
`part3OilGasIdcAmtPreferenceAmount`, `ownerRole`, `taxYear`, `legacyDocId` are not on the screen (diff of `UI` vs
`MAP:94-251`). The slot ↔ key map is right for every box **except one slot**: the fifth row of box 16 is saved as box 17
row 1 (**D-k1-1120s-1**, latent). Upload extraction uses the same keys and row order (`GFM:2494-2560`).

**Amount parsing / losses.** As for the 1065: the typed text is saved unchanged and compute's `parseAmount`
(`TRCS:52507-52536`) reads "-1,000" and "(1,000)" as −1,000. Losses keep their sign — **Match** (D-ui-1 does not apply).

**Person filter.** Boxes 4, 5a/5b, 6 (portfolio) and 1-3, 15 (AMT), 17 code AN: only the other spouse's K-1 is dropped on
an MFS leg (`TRCS:3709-3726, 3832-3834, 31667-31680`) → **D-2b-1, D-3b-1, D-8-8**. Boxes 7-8c: by `recipientTIN`
(`TRCS:25483-25497, 25512-25535`) — Match. Section 199A fields: `belongsToPerson` (`TRCS:17607-17620`) — Match but
unreachable (D-k1-1120s-2). Box 17 code AN (Form 2210-F) is read from every K-1 in the list (`Form2210FGrossIncome.java:53-60`).

## 2. Box by box

### Header, Part I, Part II

| Box | IRS caption | App field (`MAP` line) | Where it goes (IRS) | What the app does | Status |
|---|---|---|---|---|---|
| — | Final K-1 / Amended K-1 | `headerFinalK1`, `headerAmendedK1` (`:114-115`) | Informational | Stored, not used | Not used |
| — | Tax year beginning / ending | `headerTaxYearBeginningMonthDay`, `…BeginningYear`, `…EndingMonth/Day/Year` (`:121-125`) | Fiscal-year K-1 | Stored, not used | Not used |
| A | Corporation's EIN | `part1ACorporationEin` (`:128`) | Schedule E line 28 (d) | QBI aggregation key (`TRCS:17988-18010`) | Match |
| B | Corporation's name, address | `part1BCorporationNameAddressCityStateZip` (`:129`) | Schedule E line 28 (a); Schedule B payer | Schedule B payer label (`TRCS:36062-36065`) | Match |
| C | IRS Center | `part1CIrsCenterWhereCorporationFiledReturn` (`:130`) | Informational | Stored, not used | Not used |
| D | Corporation's total shares (beginning / end) | `part1DCorporationTotalNumberOfSharesBeginning/Ending` (`:131-132`) | Information | Stored, not used | Not used |
| E | Shareholder's identifying number | `part2EShareholderIdentifyingNumber` (`:135`) → `recipientTIN` (`:100`) | Whose K-1 it is | Person filter | Match / D-k1-1120s-8 |
| F1 | Shareholder's name, address | `part2F1ShareholderNameAddressCityStateZip` (`:136`) | — | Stored, not used | Not used |
| F2 / F3 | Reporting entity TIN / name; entity type | `part2F2ReportingEntityTin/Name`, `part2F3ShareholderEntityType` (`:137-139`) | Information | Stored, not used | Not used |
| G | Current year allocation % | `part2GCurrentYearAllocationPercentage` (`:140`) | Information | Stored, not used | Not used |
| H | Shareholder's shares (beginning / end) | `part2HShareholderNumberOfShares…` (`:141-142`) | Stock basis (Form 7203) | Stored, not used | **D-sch-e-8** |
| I | Loans from shareholder (beginning / end) | `part2ILoansFromShareholder…` (`:143-144`) | Debt basis (Form 7203) | Stored, not used | **D-sch-e-8** |
| — | "Did you materially participate?" (app question) | `materiallyParticipatedInActivity` (`:148`) | Box 1 passive / nonpassive (`i1120ssk.pdf p. 6`) | `isPassiveK1` (`TRCS:31581-31583`) | Match |

### Part III

| Box | IRS caption | App field (`MAP` line) | Where it goes (IRS) | What the app does | Status |
|---|---|---|---|---|---|
| 1 | Ordinary business income (loss) | `part3Line1OrdinaryBusinessIncomeLoss` (`:147`) | Schedule E line 28 (h)/(i)/(k), passive loss via Form 8582 col (g) (`i1120ssk.pdf p. 6`), after basis / at-risk limits | Nonpassive → Schedule 1 line 5 with no basis or at-risk limit (`TRCS:31515-31517, 4291, 4394`); passive → §469 pool (`TRCS:3836-3841`) | Match in route; **D-6198-7, D-sch-e-8, D-sch-e-2, D-8582-1, D-8-8** |
| 2 | Net rental real estate income (loss) | `part3Line2NetRentalRealEstateIncomeLoss` (`:149`) | Schedule E line 28; passive unless real estate professional (`i1120ssk.pdf p. 6-7`) | "Other passive", no $25,000 allowance (`TRCS:31484-31496`) | **D-8582-12** |
| 3 | Other net rental income (loss) | `part3Line3OtherNetRentalIncomeLoss` (`:150`) | Schedule E line 28, passive (`i1120ssk.pdf p. 7`) | Same pool | Match |
| 4 | Interest income | `part3Line4InterestIncome` (`:151`) | Form 1040 line 2b (`i1120ssk.pdf p. 7`) | Schedule B item → line 2b (`TRCS:36062-36065`) | Match; **D-2b-1** |
| 5a | Ordinary dividends | `part3Line5aOrdinaryDividends` (`:152`) | Form 1040 line 3b, less PTEP (`i1120ssk.pdf p. 7`) | Line 3b (`TRCS:36088-36089`) | Match; **D-3b-1, D-3b-5** |
| 5b | Qualified dividends | `part3Line5bQualifiedDividends` (`:153`) | Form 1040 line 3a (`i1120ssk.pdf p. 7`) | Line 3a, capped at 5a | Match; D-3b-1 |
| 6 | Royalties | `part3Line6Royalties` (`:154`) | Schedule E line 4 (`i1120ssk.pdf p. 7`) | Schedule 1 line 5 + Form 8960 (`TRCS:36116-36120, 4394`) | Match in amount; **D-sch-e-1** |
| 7 | Net short-term capital gain (loss) | `part3Line7NetShortTermCapitalGainLoss` (`:155`) | Schedule D line 5 (`i1120ssk.pdf p. 7`) | Schedule D line 5 (`TRCS:25489-25490`) | Match; D-7a-2 |
| 8a | Net long-term capital gain (loss) | `part3Line8aNetLongTermCapitalGainLoss` (`:156`) | Schedule D line 12 (`p. 7`) | Line 12 (`TRCS:25492-25493`) | Match; D-7a-2 |
| 8b | Collectibles (28%) gain (loss) | `part3Line8bCollectibles28PercentGainLoss` (`:157`) | 28% Rate Gain Worksheet line 4 (`p. 7`) | Worksheet line 4 | Match |
| 8c | Unrecaptured section 1250 gain | `part3Line8cUnrecapturedSection1250Gain` (`:158`) | Unrecaptured §1250 Gain Worksheet (`p. 7`) | Added uncapped (`TRCS:25496-25497`) | **D-sch-d-1** |
| 9 | Net section 1231 gain (loss) | `part3Line9NetSection1231GainLoss` (`:159`) | Form 4797 line 2 col (g) / Form 8582 for a passive loss (`i1120ssk.pdf p. 7-8`) | Stored, never read | **Not supported D-4797-1** |
| 10 | Other income (loss) — 5 rows | `part3Line10Row1-5Code/Amount` (`:162-171`) | By code — §3 | Not read | **D-k1-1120s-3**; code C **D-6781-9** |
| 11 | Section 179 deduction | `part3Line11Section179Deduction` (`:174`) | Form 4562 Part I (`i1120ssk.pdf p. 9`) | Never read | **Not supported D-4562-11** |
| 12 | Other deductions — 8 rows | `part3Line12Row1-8Code/Amount` (`:177-192`) | By code — §3 | Not read | **D-k1-1120s-4** |
| 13 | Credits — 5 rows | `part3Line13CreditsRow1-5Code/Amount` (`:195-204`) | By code — §3 (O → line 25c; H → Schedule 3 line 13a) | Not read | **D-k1-1120s-5** |
| 14 | Schedule K-3 is attached | `part3Line14ScheduleK3Attached` (`:118`) | Use Schedule K-3 (`i1120ssk.pdf p. 14`) | Stored, not used | Not used (informational) |
| 15 | AMT items — 5 rows | `part3Line15AmtRow1-5Code/Amount` (`:207-216`) | A → Form 6251 line 2l; B → 2k; C → 2d; D/E → statement; F → applicable lines (`i1120ssk.pdf p. 15`) | All 5 rows: A → 2l / 2m, C → 2d / 2m, F → line 3 (`TRCS:31620-31623, 4114-4116, 4178-4194`) | Match for A/C/F; **D-k1-1120s-6** |
| — | IDC preference (app field) | `part3OilGasIdcAmtPreferenceAmount` (`:217`) | Form 6251 line 2t | Line 2t (`TRCS:4190, 31648-31660`); not on the screen | Not supported from the UI (D-k1-1120s-6) |
| 16 | Items affecting shareholder basis — 5 rows printed | rows 1-4 `part3Line16ItemsAffectingBasisRow1-4Code/Amount` (`:220-227`); **row 5 saved as** `part3Line17OtherInformationRow1Code/Amount` | A → Form 1040 line 2a; B, C → basis; D distributions → basis (excess over basis is gain); E loan repayments; F → Form 7203 line 46 (`i1120ssk.pdf p. 15`) | Not read | **D-2a-1** (16A); basis **D-sch-e-8**; row 5 **D-k1-1120s-1** |
| 17 | Other information — 10 rows printed | `part3Line17OtherInformationRow2-11Code/Amount` hold printed rows 1-10 (`:230-251`) | By code — §3 | Only code AN read, rows 1-11 (`Form2210FGrossIncome.java:53-60`) | AN Match; **D-k1-1120s-7**; code V **D-k1-1120s-2** |
| 18 | More than one activity for at-risk purposes | `part3Line18MoreThanOneActivityForAtRiskPurposes` (`:116`) | Use statement (`i1120ssk.pdf p. 19`) | Stored, not used | Not used (D-6198-7: no at-risk for S corps) |
| 19 | More than one activity for passive purposes | `part3Line19MoreThanOneActivityForPassiveActivityPurposes` (`:117`) | Use statement (`p. 19`) | Stored, not used | Not used |
| 17 V | Section 199A statement | `section199A…` group (`:105-111`) | Form 8995 / 8995-A (`i1120ssk.pdf p. 17-18`) | Read per person (`TRCS:17607-17620`) but not on the screen | **D-k1-1120s-2** |

## 3. Checkboxes and codes

Destinations from `i1120ssk.pdf` (page in brackets); list of codes `p. 20-21`.

**Box 10 — Other income (loss)** — none read (**D-k1-1120s-3**): A other portfolio income (p. 8); B involuntary
conversions → Form 4684 (p. 8); **C §1256 → Form 6781 (p. 8) — D-6781-9**; D mining exploration recapture (p. 8);
E §951A inclusions, F subpart F inclusions, G §951(a)(1)(B) inclusions → "your Form 1040" (p. 8); I disposition of
oil/gas/mineral property (p. 8); J recoveries of tax benefit items → Schedule 1 line 8z (p. 8); K gambling → Schedule 1
line 8b / Schedule A line 16 (p. 8-9); M, N §1045 rollover; O §1202 QSB stock → Schedule D (p. 9); S non-portfolio
capital gain → Schedule D (p. 9); ZZ other (p. 9). H, L, P-R, T-X reserved.

**Box 12 — Other deductions** — none read (**D-k1-1120s-4**): A, B cash contributions → Schedule A line 11; C-F noncash /
capital gain property → Schedule A line 12; G 100% contributions (p. 10-11); H investment interest → Form 4952 line 1
(p. 11); I royalty deductions → Schedule E line 19; J §59(e)(2); L portfolio deductions → Schedule A line 16; M
preproductive expenses; O reforestation; W, X, Y conservation / film / barriers (p. 11-12); Z itemized deductions →
Schedule A; AA CCF; AB early-withdrawal penalty → Schedule 1 line 18; AC debt-financed distribution interest; ZZ other
(p. 12). K, N, P-V, AD-AJ reserved.

**Box 13 — Credits** — none read (**D-k1-1120s-5**): same code letters and forms as the partnership box 15 (A, B → 7213;
C, D → 8586; E → 3468; F, G statement; **H → Schedule 3 line 13a**; I → 6478; J → 5884; K → 8826; L → 8844; M → 6765;
N → 8846; **O backup withholding → Form 1040 line 25c**; P-U → 3468; V → 7207; W → 7211; X → 7218; Y → 7210; Z → 8820;
AA → 8830; AB → 8835; AC → 8864; AD → 8874; AE-AG → 8881; AH → 8882; AI → 8896; AJ → 8900; AK → 8904; AL → 8906;
AM → 8908; AO → 8911; AP-AU → 8912; AV → 8932; AW, AX → 8933; AY, AZ → 8936; BA → 8941; BB → 8994; BC → 3800; ZZ)
(`i1120ssk.pdf p. 12-14, 20-21`).

**Box 15 — AMT items** (p. 15)

| Code | Meaning | IRS destination | App |
|---|---|---|---|
| A | Post-1986 depreciation adjustment | Form 6251 line 2l | Any row → 2l (nonpassive) / 2m (passive) — Match |
| B | Adjusted gain or loss | Form 6251 line 2k | Not read **D-k1-1120s-6** |
| C | Depletion (other than oil & gas) | Form 6251 line 2d | Any row → 2d / 2m — Match |
| D, E | Oil, gas, geothermal gross income / deductions | Per statement | Not read **D-k1-1120s-6** |
| F | Other AMT items | Applicable lines | Any row → line 3 — Match in total |

**Box 16 — Items affecting shareholder basis** (p. 15): A tax-exempt interest → Form 1040 line 2a (**D-2a-1**); B other
tax-exempt income → basis only; C nondeductible expenses → basis only; D distributions → reduce basis, excess is gain;
E repayment of shareholder loans → basis / possible gain; F foreign taxes → Form 7203 line 46, not Form 1116. App: none
(basis not modelled — **D-sch-e-8**).

**Box 17 — Other information** (p. 15-19)

| Code | Meaning | IRS destination | App |
|---|---|---|---|
| A | Investment income | Form 4952 line 4a | None **D-k1-1120s-7** |
| B | Investment expenses | Form 4952 line 5 | None **D-k1-1120s-7** |
| C, D | Rehabilitation expenditures; energy property basis | Form 3468 | None |
| E, F, G, H | Credit recaptures | Form 8611 / 4255 / statement | None |
| I, J | Look-back interest | Form 8697 / 8866 | None |
| K, L | §179 property dispositions / recapture | Form 4797 | None **D-k1-1120s-7** |
| M, N, O | §453(l)(3), §453A(c), §1260(b) interest | Schedule 2 / statement | None |
| P, Q, R | Production interest; CCF withdrawals; oil & gas depletion | Statement | None |
| U | Net investment income | Form 8960 | None **D-k1-1120s-7** |
| V | Section 199A information | Form 8995 / 8995-A | Separate fields, not on the screen — **D-k1-1120s-2** |
| AA, AB, AC | Excess taxable income; excess business interest income; gross receipts | Form 8990 | None **D-k1-1120s-7** |
| AJ | Excess business loss limitation | Form 461 | None **D-k1-1120s-7** |
| AN | Farming and fishing income | Schedule E Part V line 42, information only | Rows 1-11 → Schedule E line 42 and Form 2210-F (`Form2210FGrossIncome.java:53-60, 102-110`) — Match |
| AP | Inversion gain | Statement | None |
| AS-AW | Form 3468 property; reportable transactions | Statement | None |
| BA | Domestic research expenditures (§174A) | Statement | None |
| ZZ | Other | Statement | None |

## 4. Questions the app asks with this statement

The material-participation question on the screen (`UI:33-41`); the passive-activity carryforward form (prior suspended
K-1 loss, amount at risk — applied to the passive pool only); the QBI form (no K-1 section 199A input — D-k1-1120s-2);
the capital-gain/loss form (gates boxes 7-8c, D-7a-2); the MFS community-property pass-through percentage
(`CommunityProperty.java:586-600`). No question asks for stock or debt basis (D-sch-e-8).

## 5. Differences from the IRS instructions

Reused: D-2a-1 (16A), D-2b-1 (4), D-3b-1 / D-3b-5 (5a/5b), D-7a-2 (7-8c), D-8-8 (1-3, 15), D-4797-1 (9), D-6781-9 (10C),
D-4562-11 (11), D-sch-d-1 (8c), D-sch-e-1 / -2 / -8 (Schedule E presentation; basis and Form 7203 not modelled),
D-6198-7 (no at-risk limit for S-corporation losses), D-8582-1 / D-8582-12.

New:

**D-k1-1120s-1 — the fifth row of box 16 is saved as box 17 row 1** (low; latent).
The form prints five rows in box 16 and ten in box 17 (`docs/IRS-Forms/f1120ssk.pdf` p. 1; renderer labels "16" top 451,
"17" top 611; slot `f1_88/89` at top 589 lies in box 16). `fieldMap` maps `f1_88/89` to
`part3Line17OtherInformationRow1Code/Amount` (`UI:299-300`); extraction does the same (`GFM:2526-2560`). Today no
compute reads box 16, and code AN cannot appear in box 16, so no amount changes; a future box 16 (16A tax-exempt
interest, 16D distributions) reader would miss row 5 and a box 17 reader would see a box 16 code.

**D-k1-1120s-2 — box 17 code V (section 199A) cannot be entered** (high; silent). Same defect as **D-k1-1065-3**: the
K-1 screen has no section 199A input, a save writes `section199A…` null (`MAP:105-111`), and K-1 QBI never reaches
Form 8995 / 8995-A except by the QBI form's manual adjustment. IRS: `i1120ssk.pdf p. 17-18` ("Code V. Section 199A
information"). Code: `TRCS:17607-17620, 17960-18010`.

**D-k1-1120s-3 — box 10 (other income) is never read** (medium; silent). IRS: e.g. code J → "Schedule 1 (Form 1040),
line 8z", code K → "Schedule 1 (Form 1040), line 8b", codes E/F/G → "your Form 1040" (`i1120ssk.pdf p. 8-9`). Code: no
reader of `part3Line10Row*` (only `MAP` and `GFM:2495-2510`). Code C is D-6781-9.

**D-k1-1120s-4 — box 12 (other deductions) is never read** (medium; silent; deduction lost). IRS: A-F → Schedule A
lines 11 / 12; H → "Form 4952, line 1"; AB → "Schedule 1 (Form 1040), line 18" (`i1120ssk.pdf p. 10-12`). Code: no
reader of `part3Line12Row*`.

**D-k1-1120s-5 — box 13 (credits) is never read, including backup withholding** (medium; silent). IRS: code O
"Include this amount in the total you enter on Form 1040 or 1040-SR, line 25c"; code H → "Schedule 3 (Form 1040) …
line 13a" (`i1120ssk.pdf p. 13`; `i1040gi_ty2025.pdf p. 39`). Code: no reader of `part3Line13CreditsRow*`. Refund
understated by those payments; the business credits are not supported.

**D-k1-1120s-6 — box 15 codes B, D, E are not used; the IDC field is API-only** (low; AMT only). IRS: B → Form 6251
line 2k (`i1120ssk.pdf p. 15`). Code: `sumK1AmtItems` called with A, C, F only (`TRCS:4114-4116, 4178-4194`);
`part3OilGasIdcAmtPreferenceAmount` (`MAP:217`) has no screen input.

**D-k1-1120s-7 — box 17 amount codes other than AN are not read** (low-medium). IRS: A → "Form 4952, line 4a"; B →
"Form 4952, line 5"; U → net investment income tax; AA-AC → Form 8990; AJ → Form 461; K / L → §179 dispositions /
recapture (`i1120ssk.pdf p. 15-18`). Code: only AN (`Form2210FGrossIncome.java:53-60`).

**D-k1-1120s-8 — truncated or blank shareholder number** (low). Same as D-k1-1065-9: a truncated number as printed
(`i1120ssk.pdf p. 1`) gives the blocking `STATEMENT_DOES_NOT_BELONG_TO_FAMILY` (`TRCS:13899-13911`;
`StatementSsnRules.java:102`); a blank one counts the income boxes on every return of the household (no SE items exist on
this K-1, so nothing else is dropped).

**D-k1-1120s-9 — the screen draws the 2024 form** (cosmetic; `us-tax-ui/public/irs/schedule_k1_form_1120s_page_01.png`
prints "2024"; the 2025 layout is identical).

## 6. IRS sources

| Document | Pages | Used for |
|---|---|---|
| `docs/IRS-Forms/f1120ssk.pdf` (2025 Schedule K-1 (Form 1120-S)) | 1 | Captions, rows per box |
| `i1120ssk.pdf` (Shareholder's Instructions for Schedule K-1 (Form 1120-S), 2025) | 1 (truncated TIN), 6-8 (boxes 1-9), 8-9 (box 10), 9 (box 11), 10-12 (box 12), 12-14 (box 13), 14-15 (boxes 14-16), 15-19 (box 17), 19 (boxes 18-19), 20-21 (list of codes) | Destination of every box and code |
| `i1040se.pdf` | 2, 8-11 | Schedule E line 28, basis (Form 7203), line 42 |
| `i1040gi_ty2025.pdf` | 39 | Line 25c (K-1 withholding) |
