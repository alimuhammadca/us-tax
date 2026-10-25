# Form W-2AS (`w-2-as`) — every box and where it goes

Paths are relative to `C:\us-tax`. `TRCS` = `us-tax-be/src/main/java/com/ustax/microservices/TaxReturnComputeService.java`.
`MAP` = `us-tax-be/src/main/java/com/ustax/microservices/statement/W2TerritoryMapper.java`. `UI-T` =
`us-tax-ui/src/app/forms/form-w-2-as.component.ts`.

---

## 1. What this statement is

Form W-2AS, American Samoa Wage and Tax Statement, is the territory version of Form W-2: it reports wages paid by an employer in
American Samoa and the **territory** income tax withheld — "Do not use these forms to report wages subject to U.S. income
tax withholding. Instead, use Form W-2" (`iw2w3--2025.pdf p. 4`). The General Instructions for Forms W-2 and W-3 cover
it ("reference to Forms W-2 and W-3 includes Forms W-2AS, W-2CM, W-2GU, W-2VI", `iw2w3--2025.pdf p. 4`); boxes 8 and 10
and boxes 15-20 do not apply to it (`iw2w3--2025.pdf p. 18, p. 23`). The form copy in `docs/IRS-Forms/fw2as.pdf` and
`us-tax-ui/public/irs/` is the **2026 revision** (it adds box 14b); the box captions below are the same in 2025 except
box 14, which in 2025 is the single box "Other".

Where it goes on a 2025 Form 1040 depends on residence (Pub. 570):
- A bona fide resident of American Samoa files an American Samoa return and may exclude American Samoa-source income from the U.S. return with Form 4563 (`p570.pdf p. 16-17`). Such a person generally has no U.S. return for this income — out of the app's scope.
- A U.S. citizen or resident alien who is **not** a bona fide resident "generally files both U.S. and American Samoa tax returns, and claims a foreign tax credit on the U.S. return for taxes paid to American Samoa"; the U.S. return reports "your income from worldwide sources" (`p570.pdf p. 17`).

So for a filer of a U.S. Form 1040 the boxes go where the same boxes of a Form W-2 go (box 1 → line 1a, box 4 →
Schedule 3 line 11, box 5 / 6 → Form 8959, codes → section 3 of `w-2.md`), except box 2, which is territory tax.

**Whose statement it is.** Box a, saved as `employeeSSN` (`MAP:128`). Stored per household account (`MAP:87-97`,
table `se_w2_territory`, discriminated by `form_id`). A statement whose box a is nobody in the household raises the
blocking `STATEMENT_DOES_NOT_BELONG_TO_FAMILY` (`TRCS:13891-13913`; rule in `StatementSsnRules.java:55-57`). No compute
code reads the statement at all, so the person-filter issue of D-1a-1 does not arise.

**Where it is stored.** Entity `SeW2Territory` / `se_w2_territory`; children `se_w2_territory_box12_entry` and
`se_w2_territory_box14_other`. Mapper `MAP:122-161` (parent), `:166-197` (children). There is no state/local child.

**What the user sees.** The form-replica view (`_pdfView = true`, `UI-T:876`); `syncPdfToForm`
(`UI-T:1117`) copies it into the saved keys on save (`UI-T:1391`). Upload extraction uses the W-2 model and
the W-2 OCR fallback (`us-tax-be/.../microservices/GenericFieldMapper.java:72-78`, `:483-498`).

## 2. Box by box

Every amount is stored and **none is read by any computation** — the only references to `w-2-as` outside the mapper are
the statement catalog, extraction and the family-SSN rule (`StatementFormCatalog.java:13-15`, `GenericFieldMapper.java:78`,
`StatementSsnRules.java:55-57`). This is **D-1a-3** (`new_knowledge/1a.md`), which this file extends from box 1 to every
box.

| Box | IRS caption | App field | Where it goes on the return (IRS) | What the app does | Status |
|---|---|---|---|---|---|
| a | Employee's social security number | `employeeSSN` | Identifies the employee | Family check only | Match |
| b | Employer identification number (EIN) | `employerEIN` | — | Stored only | Not used |
| c | Employer's name, address, and ZIP code | `employerNameAddress` | — | Stored only | Not used |
| d | Control number | `controlNumber` | — | Stored only | Not used (informational) |
| e / f | Employee's name / address | `employeeFirstName`, `employeeLastName`, `employeeSuffix`, `employeeAddress` | — | Stored only | Not used |
| 1 | Wages, tips, other compensation | `wagesTipsOtherCompAmount` | Form 1040 line 1a (worldwide income of a non-bona-fide resident) | Not read. If the Employment form says "wages = Yes" and the person has no Form W-2, the blocking `MISSING_W2_EMPLOYMENT_INCOME_*` fires (`hasW2ForSsn` reads only `w-2`, `TRCS:41674-41692`, `:13774-13792`); if it says No, the wages are silently left out | **D-1a-3** |
| 2 | Samoa income tax withheld | `federalIncomeTaxWithheldAmount` (UI key) → entity `territoryIncomeTaxWithheldAmount` (`MAP:139-140`, read back under the federal key `MAP:223-224`) | Foreign tax credit on the U.S. return (Form 1116 → Schedule 3 line 1) for tax paid to American Samoa (`p570.pdf p. 17`) — **not** Form 1040 line 25a (`iw2w3--2025.pdf p. 17`: for these forms box 2 shows "the total American Samoa, CNMI, Guam, or U.S. Virgin Islands income tax withheld") | Not read (so it is also not wrongly put on line 25a) | **D-1a-3** (territory tax credit not supported) |
| 3 | Social security wages | `socialSecurityWagesAmount` | Schedule SE line 8a; Form 4137 / 8919 line 8 | Not read | **D-1a-3** |
| 4 | Social security tax withheld | `socialSecurityTaxWithheldAmount` | Schedule 3 line 11 when more than one employer withheld too much (`i1040gi_ty2025.pdf p. 117`; the GU / AS form copies: "if you are required to file Form 1040 or 1040-SR with the United States, you must claim the excess tax as a credit on Form 1040", `fw2gu.pdf p. 5`, `fw2as.pdf p. 5`) | Not read — a Form W-2 plus a W-2AS never produce an excess-SS credit | **D-1a-3** |
| 5 | Medicare wages and tips | `medicareWagesAndTipsAmount` | Form 8959 line 1 (`fw2as.pdf p. 5`, Box 5) | Not read | **D-1a-3** |
| 6 | Medicare tax withheld | `medicareTaxWithheldAmount` | Form 8959 line 19 | Not read | **D-1a-3** |
| 7 | Social security tips | `socialSecurityTipsAmount` | Part of box 1; Schedule SE 8a; Schedule 1-A tips | Not read | **D-1a-3** |
| 8 | (blank on this form — `iw2w3--2025.pdf p. 18`) | `allocatedTipsAmount` (hidden form view only; the replica shows an empty box 8) | — | Stored if sent | n/a |
| 9 | (blank) | — | — | — | n/a |
| 10 | (blank on this form — `iw2w3--2025.pdf p. 18`) | `dependentCareBenefitsAmount` (hidden form view only) | — | Stored if sent | n/a |
| 11 | Nonqualified plans | `nonqualifiedPlansAmount` | Schedule 1 line 8t (as Form W-2) | Not read | **D-1a-3** |
| 12 | See instructions for box 12 (codes) | `box12Entries[].code`, `.box12Amount` (`MAP:174-183`) | As Form W-2 (codes W → Form 8889, T → Form 8839, D/E/F… → line 1h, Q → line 1i …; see `w-2.md` §3) | Not read | **D-1a-3** |
| 13 | Statutory employee / Retirement plan / Third-party sick pay | `statutoryEmployee`, `retirementPlan`, `thirdPartySickPay` (`UI-T:555`) | Schedule C (statutory) / IRA deduction limit (retirement plan) | Not read — a box-13 "Retirement plan" on a territory W-2 does not limit the IRA deduction | **D-1a-3** |
| 14 | Other (2026 copy: 14a Other, 14b Treasury Tipped Occupation Code(s)) | `box14Other[].label`, `.box14Amount` (`MAP:186-197`); the replica binds labels only (`UI-T:564`) | Informational | Not read | Not used (informational) |

Boxes 15-20 do not exist on this form; the app has none.

## 3. Checkboxes and codes

Same box 12 codes and box 13 checkboxes as Form W-2 (`fw2as.pdf p. 5-7`; `iw2w3--2025.pdf p. 19-23`); their
destinations are in `w-2.md` §3. None is read for a W-2AS.

## 4. Questions the app asks with this statement

None. No screen asks whether the filer was a bona fide resident of American Samoa; bona fide residents of American Samoa /
Puerto Rico are handled by the possession-residence exclusion form (`new_knowledge/1a.md` §9).

## 5. Differences from the IRS instructions

| Id | IRS rule | What the app does | Effect |
|---|---|---|---|
| **D-1a-3** (reused) | A non-bona-fide resident reports worldwide income on the U.S. return (`p570.pdf p. 17, p. 24-25, p. 27`) | No compute code reads `w-2-as`; no flag | SILENT: wages, territory tax credit, excess SS, Additional Medicare Tax and box 12 items all omitted; BLOCKING `MISSING_W2_EMPLOYMENT_INCOME_*` if the Employment form says wages = Yes and there is no Form W-2. High (per D-1a-3) |

## 6. IRS sources

- `iw2w3--2025.pdf`: p. 4 (territory forms), p. 17 (box 2 for territory forms), p. 18 (boxes 8 and 10 not applicable),
  p. 19-23 (box 12 codes, box 13, box 14; boxes 15-20 not applicable).
- `docs/IRS-Forms/fw2as.pdf` (2026 revision): p. 3 (captions), p. 5 (Notice / Instructions for Employee).
- `p570.pdf`: p. 16-17 (American Samoa), p. 24-25 (Guam), p. 26-27 (USVI, Form 8689).
- `i1040gi_ty2025.pdf`: p. 23 (line 1a), p. 117 (Schedule 3 line 11).
