# Form W-2G (`w-2g`) — every box and where it goes

Paths are relative to `C:\us-tax`. `TRCS` = `us-tax-be/src/main/java/com/ustax/microservices/TaxReturnComputeService.java`.
`MAP` = `us-tax-be/src/main/java/com/ustax/microservices/statement/W2gMapper.java`. `UI-G` =
`us-tax-ui/src/app/forms/form-w-2g.component.ts`.

---

## 1. What this statement is

Form W-2G, Certain Gambling Winnings, is a continuous-use form (Rev. December 2023 — `docs/IRS-Forms/fw2g.pdf`)
that a casino, track, lottery or other payer sends to a winner whose winnings reach the reporting thresholds or had
federal income tax withheld. Filer instructions: `iw2g.pdf` (Instructions for Forms W-2G and 5754, Rev. January 2026 —
the edition in `docs/books`). The winner's instructions are on the form copy ("Instructions to Winner",
`fw2g.pdf p. 5`): "Generally, report all gambling winnings under the 'Other income' line of Schedule 1 (Form 1040)",
and "Include the amount shown in box 4 on your Form 1040 or 1040-SR as federal income tax withheld." The Form 1040
lines: Schedule 1 line 8b (`i1040gi_ty2025.pdf p. 91`) and Form 1040 line 25c (`i1040gi_ty2025.pdf p. 39`).

**Whose statement it is.** Box 9, winner's TIN, saved as `winnerTIN` (`MAP:129`). All W-2Gs of the household are
stored under one account (`MAP:88-98`, by `uid` and tax year). A W-2G whose box 9 matches nobody in the household raises
the blocking `STATEMENT_DOES_NOT_BELONG_TO_FAMILY` (`TRCS:13891-13913`, rule `StatementSsnRules.java:54`). The only
compute readers are filtered by person on MFS and dependent's-own returns only (line 25c through
`filterWithholdingEntriesForScopedFiler`, `TRCS:49826-49827`, TIN keys `TRCS:51786-51790`; Schedule A line 5a on MFS,
`TRCS:8562-8572`). On single / joint / HOH / QSS returns a dependent's W-2G withholding counts on the parent's return —
the same issue as D-1a-1.

**Where it is stored.** Entity `SeW2g` / table `se_w2g`; child `SeW2gStateLocalInfo` / `se_w2g_state_local_info`
(boxes 13-18). Mapper `MAP:120-163` (parent), `:168-192` (child).

**What the user sees.** The screen opens in the form-replica view (`_pdfView = true`, `UI-G:710`); on save
`syncPdfToForm` (`UI-G:1014-1080`) copies the replica fields into the saved keys (`UI-G:1082-1086`).

## 2. Box by box

| Box | IRS caption (`fw2g.pdf p. 3`) | App field | Where it goes on the return (IRS) | What the app does | Status |
|---|---|---|---|---|---|
| — | VOID / CORRECTED | `void`, `corrected` | — | Stored only | Not used (informational) |
| — | For calendar year | `calendarYear` | — | Stored only | Not used |
| — | Payer's name, address, telephone | `payerNameAddress`, `payerName`, `payerStreetAddress`, `payerRoomSuite`, `payerCity`, `payerStateOrProvince`, `payerCountry`, `payerZipCode`, `payerTelephone` | — | Stored only | Not used (informational) |
| — | Payer's TIN | `payerTIN` | — | Stored only | Not used |
| — | Winner's name and address | `winnerFirstName`, `winnerLastName`, `winnerSuffix`, `winnerAddress`, `winnerAptNumber`, `winnerCity`, `winnerStateOrProvince`, `winnerCountry`, `winnerZipCode` | — | Stored only | Not used |
| 1 | Reportable winnings | `reportableWinningsAmount` (entity `box1ReportableWinningsAmount`, `MAP:149`) | Schedule 1 line 8b, gambling winnings (`fw2g.pdf p. 5`; `i1040gi_ty2025.pdf p. 91`); it also caps gambling losses on Schedule A line 16 (`i1040sca_2025.pdf p. 11`) | **Never read** by any compute code (no reference to `reportableWinningsAmount` outside the mapper / extraction); line 8b is only what the user types on Other incomes | **D-8-3** (coordinator-verified) |
| 2 | Date won | `dateWon` | — | Stored only | Not used (informational) |
| 3 | Type of wager | `typeOfWager` | — | Stored only | Not used (informational) |
| 4 | Federal income tax withheld | `federalIncomeTaxWithheldAmount` (entity `box4FederalIncomeTaxWithheldAmount`, `MAP:153`) | Form 1040 line 25c: "Federal income tax withheld on your Form(s) W-2G. The amount withheld should be shown in box 4" (`i1040gi_ty2025.pdf p. 39`) | Line 25c (`TRCS:49821-49827`, rounded with Form 8959 line 24); filtered by winner TIN on MFS / dependent's-own returns | Match — but the winnings in box 1 are not reported (D-8-3), so the credit is taken for income left off the return |
| 5 | Transaction | `transaction` | — | Stored only | Not used |
| 6 | Race | `race` | — | Stored only | Not used |
| 7 | Winnings from identical wagers | `identicalWagersWinningsAmount` (`MAP:157`) | Additional gambling winnings (`iw2g.pdf p. 3`: "Enter the amount of additional winnings from identical wagers") → Schedule 1 line 8b | Never read | **D-8-3** (same cause) |
| 8 | Cashier | `cashier` | — | Stored only | Not used |
| 9 | Winner's TIN | `winnerTIN` | Identifies the winner (`iw2g.pdf p. 3`: "This is required information") | Person filter for line 25c and Schedule A line 5a on MFS / dependent's-own returns; family check | Match (filter scope as D-1a-1) |
| 10 | Window | `window` | — | Stored only | Not used |
| 11 | First identification no. | `firstIdentificationNumber` | — | Stored only | Not used |
| 12 | Second identification no. | `secondIdentificationNumber` | — | Stored only | Not used |
| 13 | State / Payer's state identification no. | `stateLocalInfo[].state`, `.payerStateId` | State return | Stored only. The replica shows them joined in one field (`UI-G:1006`) but `syncPdfToForm` never writes them back (`UI-G:1014-1080`) | Not used (state); **D-w-2g-1** |
| 14 | State winnings | `stateLocalInfo[].stateWinningsAmount` | State return | Stored only | Not used (state) |
| 15 | State income tax withheld | `stateLocalInfo[].stateIncomeTaxWithheldAmount` | Schedule A line 5a: "Forms W-2G … may also show state and local income taxes withheld" (`i1040sca_2025.pdf p. 3`) | Added to Schedule A line 5a (`TRCS:8536-8600`; key list `TRCS:8540-8541`) | Match (non-MFS: a dependent's W-2G counts — as D-w-2-4) |
| 16 | Local winnings | `stateLocalInfo[].localWinningsAmount` | Local return | Stored only | Not used (local) |
| 17 | Local income tax withheld | `stateLocalInfo[].localIncomeTaxWithheldAmount` | Schedule A line 5a | As box 15 | Match |
| 18 | Name of locality | `stateLocalInfo[].localityName` (`MAP:190`) | Local return | Stored only | Not used (local) |
| — | Signature / date | replica only (`pdfRaw['signature']`, `pdfRaw['signature_date']`) | — | Not saved | Not used (payer copy) |

Notes fields (`…Notes`) are stored, never used.

## 3. Checkboxes and codes

W-2G has no code boxes. VOID and CORRECTED are stored only. Box 3 (type of wager) is free text and does not change
any routing in the app; the IRS does not route by it either on the winner's return.

## 4. Questions the app asks with this statement

None on the W-2G screen. Gambling winnings are typed on the Other incomes form (Schedule 1 line 8b; its help text says
"Enter gambling winnings not already reported on a W-2G statement" while the "where to find" text points at W-2G box 1
— see D-8-3 in `new_knowledge/8.md`). Gambling losses are typed on the itemized-deductions form and capped at line 8b
(`TRCS:16688-16701`).

## 5. Differences from the IRS instructions

| Id | IRS rule | What the app does | Effect |
|---|---|---|---|
| **D-8-3** (reused, coordinator-verified) | Report all gambling winnings on Schedule 1 line 8b (`fw2g.pdf p. 5`; `i1040gi_ty2025.pdf p. 91`) | W-2G box 1 and box 7 are never read; only the typed line 8b counts; box 4 is still credited on line 25c | SILENT under-reported income (and gambling losses capped at the typed 8b); high |
| **D-w-2g-1** | Box 13 is part of the statement (`fw2g.pdf p. 3`) | The replica's box 13 field (`UI-G:489`) is filled from `state` + `payerStateId` (`UI-G:1006`) but `syncPdfToForm` does not parse it back, so an edit typed there is discarded on save (earlier saved values stay) | Cosmetic (state data only). Severity low |

Observation (not a deviation, unverified): the sidebar's per-person statement grouping uses
`StatementDataService.RECIPIENT_TIN_KEYS` (`us-tax-be/.../microservices/StatementDataService.java:189-196`), which lists
`recipientTIN`, `employeeSSN`, `payeeSSN` but not `winnerTIN`, so a W-2G has no recipient TIN for tab grouping. The
effect on the sidebar was not checked in the UI.

## 6. IRS sources

- `docs/IRS-Forms/fw2g.pdf` (Rev. 12-2023): p. 3 (Copy B captions), p. 5 (Instructions to Winner).
- `iw2g.pdf` (Rev. January 2026): p. 3 (boxes 1-12 for horse / dog racing and jai alai, incl. box 7 and box 9), p. 4
  (boxes 13-18).
- `i1040gi_ty2025.pdf`: p. 39 (line 25c), p. 91 (Schedule 1 line 8b).
- `i1040sca_2025.pdf`: p. 3 (line 5a), p. 11 (line 16 gambling losses).
