# Schedule F (Form 1040) — how the app does it

IRS rules: `C:\us-tax\new_lines\forms\schedule-f.md`. Flowchart: `C:\us-tax\new_flowcharts\forms\schedule-f.md`.
Paths are relative to `C:\us-tax`. `TRCS` = `us-tax-be/src/main/java/com/ustax/microservices/TaxReturnComputeService.java`.
`FARM-UI` = `us-tax-ui/src/app/forms/form-farm-income.component.ts`. Depreciation and section 179 (line 14, Form 4562)
are detailed in `new_knowledge\forms\4562.md`; Schedule SE in `new_knowledge\forms\schedule-se.md`; Form 4835 (the
non-participating landlord) in `new_knowledge\forms\4835.md`.

---

## 1. Status

Schedule F is **computed but not produced as a form**. For every farm the taxpayer (and, except on a married-filing-
separately return, the spouse) enters on the "Farm income (Schedule F)" form, the app figures gross income (cash method:
Part I lines 1c–8; accrual method: Part III lines 37–50), subtracts the typed expenses of lines 10–32 and the line 14
depreciation (computed from the depreciable-asset form, else typed), applies the section 179 limit together with
Schedule C, applies the at-risk limit (Form 6198, line 36b) with a prior-year carryforward, and sends the total to
**Schedule 1 line 6**. Each farm whose line E answer is not "No" goes to the person's **Schedule SE** (with its gross
income for the farm optional method and its CRP payments for line 1b); every farm goes to **QBI**; the total joins Form
461. A single farm's blank cooperative lines are filled from the person's Form 1099-PATR. On a community-property MFS
return each farm's profit is split for income tax (SE stays whole).

Missing: no Schedule F form is output (D-sch-f-7); the 25% conservation limit and its carryforward (D-sch-f-3); line 6d
(D-sch-f-4); and line E "No" both removes the farm from self-employment tax (D-sch-f-1) and has no passive-loss or NIIT
effect (D-sch-f-2).

**9 differences from the IRS rules** (D-sch-f-1 … D-sch-f-9). The most serious: a farm marked "did not materially
participate" escapes self-employment tax, EIC earned income and the Form 2210-F gross-farm test (D-sch-f-1), and
conservation expenses are deducted without the 25% limit (D-sch-f-3). Both give a wrong amount with no flag.

The household-statement root cause of D-1a-1 does **not** repeat here: the farm form is per person (taxpayer / spouse
tabs only) and the only statement read, Form 1099-PATR, is matched to the person's SSN (`TRCS:27526`).

## 2. Where the user enters it

| Sidebar | Form (id) | Question / field (label) | Saved key | Feeds |
|---|---|---|---|---|
| Incomes | Farm income (Schedule F) (`farm-income-taxpayer` / `farm-income-spouse`) | "Did … operate a farm in 2025?" | `hasFarmIncome` | gate for the farm list |
| | per farm (repeatable) | "Principal crop or activity (line A)" | `principalProduct` | matches depreciation assets |
| | | "Activity code (line B)" | `activityCode` | stored only |
| | | "Accounting method (line C)" — Cash / Accrual | `accountingMethod` | Part I vs Part III |
| | | "Did … materially participate in the farm? (line E)" | `materiallyParticipated` | **No → left out of Schedule SE** (D-sch-f-1) |
| | | "Community share of this farm (%)" (MFS in a community property state only) | `communityPct` | income-tax split |
| | | "All investment is at risk (line 36a)" / "Some investment is not at risk (line 36b, Form 6198)" | `allInvestmentAtRisk`, `someInvestmentNotAtRisk` | at-risk limit (36b) |
| | | "Amount at risk (Form 6198)" | `amountAtRisk` | loss cap |
| | | "Prior-year suspended at-risk loss for this farm" | `priorYearAtRiskCarryforward` | released first |
| | | "Conservation Reserve Program (CRP) payments included above" | `crpPayments` | Schedule SE line 1b |
| | Part I (cash) | lines 1a, 1b, 2, 3a, 3b, 4a, 4b, 5a, 5b, 5c, 6a, 6b, 7, 8 | `livestockResaleSales`, `livestockResaleCostBasis`, `produceGrainsSales`, `coopDistributions`, `coopDistributionsTaxable`, `agProgramPayments`, `agProgramPaymentsTaxable`, `cccLoansReported`, `cccLoansForfeited`, `cccLoansForfeitedTaxable`, `cropInsuranceReceived`, `cropInsuranceTaxable`, `customHireIncome`, `otherIncome` | gross income |
| | | "Elect to defer crop insurance proceeds to 2026 (line 6c)" | `cropInsuranceDeferElection` | stored only |
| | | "Amount deferred to 2026 (line 6d)" | `cropInsuranceDeferredAmount` | **stored only; mislabelled** (D-sch-f-4) |
| | Part III (accrual) | lines 37–43, 45, 46, 48 | `accrualSales`, `accrualCoopDistributions(Taxable)`, `accrualAgProgram(Taxable)`, `accrualCccReported`, `accrualCccForfeited(Taxable)`, `accrualCropInsurance`, `accrualCustomHire`, `accrualOtherIncome`, `accrualInventoryBeginning`, `accrualCostOfProductsPurchased`, `accrualInventoryEnd` | gross income |
| | Part II | lines 10–31 | `carAndTruck` … `veterinaryBreedingMedicine` (24 keys, `TRCS:27438-27444`) | expenses |
| | | "Wages on the Forms W-2 you issued to farm employees" (shown when line 22 > 0) | `farmW2Wages` | QBI wage limit |
| | | "Add other expense (line 32)" | `otherExpenses[].description`, `.amount` | expenses |

UI: `FARM-UI:60-236` (template), `:265-321` (line lists). Every amount box has `[min]="0"` (`FARM-UI:166, 191, 202,
224`), so a hedging loss on line 8 or the negative line 32f cannot be typed (D-sch-f-8). Line D (EIN), lines F / G
(Forms 1099) and the 6c / 36a / 36b checkboxes are not used by compute; `madePaymentsRequiring1099` / `filed1099s` have
mapper columns but no UI input. Sidebar: `us-tax-ui/src/app/shell/shell.component.ts:889-890`.

Related inputs elsewhere: the depreciable-asset form (assets tagged `schedule_f`, matched to a farm by
`activityDescription` = line A, else the first farm — `TRCS:27484-27501`); the Self-employment tax options form
(`priorYearFarmAtRiskCarryforward`, `farmOptionalMethod`, `receivingSsBenefitsWhenCrpPaid`).

Statements: **Form 1099-PATR** (boxes 1, 2, 3, 5) only (`TRCS:27519-27608`). Form 1099-G box 7 (`agriculturePaymentsAmount`,
`statement/Form1099GMapper.java:131`) and Form 1099-MISC box 9 (`cropInsuranceProceedsAmount`,
`statement/Form1099MiscMapper.java:144`) are stored but never read by compute; CCC-1099-G and 1099-A are not tied to the
farm (D-sch-f-6).

## 3. Where it is stored

| Data | Id | Entity / table | Notes |
|---|---|---|---|
| Farm form | personal `farm-income-taxpayer` / `-spouse` | `PfFarm` / `pf_farm` (`has_farm_income`, `owner_role`, `tax_year`) | one row per person |
| Each farm | child list `taxpayerFarms` / `spouseFarms` | `PfFarmActivity` / `pf_farm_activity` | every key in §2 |
| Line 32 rows | `otherExpenses` | `PfFarmOtherExpense` / `pf_farm_other_expense` | description, amount |
| SE options | personal `se-tax-options-*` | `PfSeTaxOptions` / `pf_se_tax_options` | farm at-risk carryover, farm optional method |

Mapper: `us-tax-be/src/main/java/com/ustax/microservices/personal/FarmIncomeMapper.java:41-157` (save), `:160-259` (load).

## 4. How it is computed

Methods:

- 1099-PATR fill: `withPatrOnScheduleF` `TRCS:27519-27608`, called `TRCS:4031-4035`.
- Pre-pass per farm: `computeFarmIntermediates` `TRCS:27610-27678`; gross `scheduleFCashGrossIncome` `TRCS:27782-27794`,
  `scheduleFAccrualGrossIncome` `TRCS:27796-27810`.
- Section 179 across Schedule C and F: `computeScheduleC` Phase-2, called `TRCS:4051-4072` (see `forms\4562.md`).
- Finalize: `computeScheduleF` `TRCS:27686-27780`, called `TRCS:4076`.
- Merge into the self-employment base: `mergeFarmIntoSelfEmployment` `TRCS:27815-27844`, called `TRCS:4202`.
- Schedule 1 line 6: `TRCS:32282-32284`, output `TRCS:32690`.

Steps, mirroring `new_lines\forms\schedule-f.md` section 6:

1. **Which farms.** The taxpayer's farm form, and the spouse's unless the return is MFS (`TRCS:4034`). Nothing is read
   unless `hasFarmIncome` is true (`TRCS:27621`).
2. **Line E.** `materiallyParticipated`: blank or Yes → `se = true`; an explicit No → `se = false` (`TRCS:27662`). The
   only effect of No is that the farm's net, gross and CRP are **not** added to the person's Schedule SE figures
   (`TRCS:27755-27759`) (D-sch-f-1). No Form 8582 step and no Form 8960 effect follow (D-sch-f-2).
3. **Part I (cash).** Gross = (1a − 1b) + 2 + (3b, or 3a when 3b is blank) + 4b + 5a + 5c + 6b + 7 + 8
   (`TRCS:27782-27794`). Line 4a, 5b and 6a are never read, so a blank "taxable" box counts as 0 (D-sch-f-5). **Line 6d
   is missing** (D-sch-f-4). The deferral election (6c) is not used: the user's 6b is trusted.
4. **1099-PATR.** For a person with exactly one farm whose cooperative boxes are both blank, the person's 1099-PATR
   total (boxes 1 + 2 + 3 + 5, matched by recipient TIN) is put on 3a **and** 3b (or 38a / 38b for an accrual farm)
   (`TRCS:27576-27594`); otherwise a typed 3a / 38a that differs gets the advisory `FORM_1099PATR_FARM_MISMATCH_*`
   (`TRCS:27595-27606`). With no farm the total goes to a single business's Schedule C line 6, else
   `FORM_1099PATR_INCOME_NOT_REPORTED_*` (`TRCS:27535-27573`). The auto-fill does not keep patronage dividends on
   personal or capital purchases off line 3b (D-sch-f-5).
5. **Part III (accrual).** Gross = 37 + 38b + 39b + 40a + 40c + 41 + 42 + 43 − (45 + 46 − 48) (`TRCS:27796-27810`). A
   negative cost of goods sold (ending inventory above line 47) adds to income, which reproduces the form's footnote.
6. **Line 8 extra.** Form 4797 Part IV recapture of this farm's assets is added to gross income (`TRCS:27633-27634`).
7. **Part II.** All typed expense keys except depreciation, plus every line 32 row (`TRCS:27636-27643`). **Line 12
   conservation expenses are added in full** — no 25% limit, no carryforward in or out (D-sch-f-3). No §263A (line
   32f) or prepaid-supplies logic (D-sch-f-8).
8. **Line 14.** Bonus + MACRS of the farm's matched assets, else the typed `depreciation` (`TRCS:27646-27658`); the
   section 179 request is held back and allocated across all Schedule C businesses and farms by `computeScheduleC`;
   then net = net before 179 − allocated 179 (`TRCS:27730`).
9. **At risk (line 36).** A per-farm prior-year carryforward (or the unattributed return-level one, released only
   against the first at-risk-limited farm) is subtracted first (`TRCS:27704-27742`); a loss with 36b and an amount at
   risk is capped at that amount and the excess suspended (`TRCS:27745-27753`); unreleased prior amounts carry forward
   (`TRCS:27771-27775`). These feed Form 6198 and the farm at-risk bridge (`TRCS:7614-7622`).
10. **Line 34 and line 6.** Each farm's net is added to the Schedule 1 line 6 total, rounded once
    (`TRCS:27754`, `:27766`). Line 6 = that total, or the legacy typed `farmIncomeLossLine6OutOfScope` only when no farm
    exists (`TRCS:32282-32284`). Community property MFS split: `CommunityProperty.split`
    (`us-tax-be/.../microservices/CommunityProperty.java:385-480`), called `TRCS:4100`.
11. **Self-employment base.** Per person: net of participating farms (`taxpayerNetForSe` / `spouseNetForSe`), gross
    (`taxpayerGrossFarm`, for the farm optional method and Form 2210-F) and CRP (`TRCS:27755-27759`, `:27766-27777`) →
    `computeScheduleSE` (`TRCS:4087-4098`). After that the farm net is merged into the Schedule C result, so the EIC,
    Schedule 1 lines 16 / 17 and IRA compensation see it (`TRCS:27815-27844`).
12. **QBI.** Every farm with a non-zero net (loss farms too) becomes a QBI component: never an SSTB, W-2 wages =
    `farmW2Wages` else line 22, UBIA of its assets (`TRCS:27761-27763`, `:27664-27671`).
13. **Form 461.** Line 6 is part of the business aggregate (`TRCS:32296-32297`).
14. **Rounding.** Amounts are summed with cents per farm; line 6 is rounded half-up once (`TRCS:27766`).

## 5. Flags and advisories

| Code | Blocks? | When | Tells the user | Where |
|---|---|---|---|---|
| `FORM_1099PATR_FARM_MISMATCH_TAXPAYER` / `_SPOUSE` | No | Typed 3a + 38a differ from the 1099-PATR total | Check the farm form; with several farms put it on the right one | `TRCS:27600-27606` |
| `FORM_1099PATR_INCOME_NOT_REPORTED_*` | No | 1099-PATR income, no farm and not exactly one business | Enter it on the right form | `TRCS:27565-27572` |
| `FORM_1099PATR_ADDED_TO_SCHEDULE_C_*`, `FORM_1099PATR_SCHEDULE_C_LINE6_SHORT_*` | No | No farm, one business | Added to / short on Schedule C line 6 | `TRCS:27551-27562` |
| `FARM_QBI_W2_WAGES_FROM_LABOR_HIRED` | No | Above the QBI threshold and a farm's W-2 wages fell back to line 22 | Enter the Forms W-2 total | `TRCS:5477-5482` |
| `COMMUNITY_PROPERTY_BUSINESS_SPLIT` | No | MFS community split applied | Profit split for income tax; SE stays with the operator | `CommunityProperty.java:480-497` |
| Mid-quarter, section 179 and depreciation advisories | No | See `forms\4562.md` | | `TRCS:4079-4082` |

There is no flag for a conservation expense over 25%, a blank taxable box with an amount in the "a" box, a line E "No"
farm, or a 1099-G / 1099-MISC farm payment not on the farm form.

## 6. What it produces

| Item | Value |
|---|---|
| Schedule 1 line 6 | `Schedule1AdditionalIncome.farmIncomeLoss` → JSON `schedule1.additionalIncome.farmIncomeLoss`; DB `out_schedule1.add_inc_farm_income_loss` (`us-tax-be/.../microservices/output/Schedule1OutputMapper.java:94`) |
| Schedule SE line 1a / 1b / Part II base | per person, see `forms\schedule-se.md` |
| QBI | components → Form 8995 / 8995-A |
| Form 6198 | built from the combined Schedule C + F at-risk figures (`TRCS:7614-7622`) |
| Schedule F preview | `us-tax-ui/src/app/forms/form-tax-return-schedule-f.component.ts:1-58` — the blank 2025 IRS layout; no `[values]` binding; always listed in the sidebar (`shell.component.ts:1658-1659`, gate `if (true /* … blank until SE compute phases */)`) (D-sch-f-7) |

There is no Schedule F output model, so lines 1–50 of a farm are not shown or persisted.

## 7. Tests

| Test | Proves |
|---|---|
| e2e `schedule-f-compute.spec.ts` (3) | cash farm net → line 6 with SE tax; farm feeds QBI; accrual gross nets cost of goods |
| e2e `schedule-f-depreciation.spec.ts` (4) | section 179, 100% bonus, MACRS on farm assets; section 179 limit shared with Schedule C |
| e2e `farm-at-risk-carryforward.spec.ts` (5) | per-farm and aggregate at-risk carryforwards, provenance, off-year persistence |
| e2e `farm-income-save-load.spec.ts`, `se-farm-qbi-ubia.spec.ts`, `open-questions-b70-farm-qbi-w2-wages.spec.ts`, `open-questions-b109-2024-farmer-test.spec.ts` | persistence; UBIA; QBI wages; Form 2210-F farmer test |
| Java `Form1099PatrRoutingTest` | PATR to a cash farm, an accrual farm (38a / 38b), or a single Schedule C |
| Java `FarmQbiW2WagesTest`, `CommunityPropertyBusinessSplitTest.bothRunABusinessAndAFarm`, `Form4797PartIvActivityRoutingTest.aFarmAssetsRecaptureIsScheduleFOtherIncome`, `Form2210FGrossIncomeGateTest` | QBI wages, MFS split, recapture to line 8, farmer gate |
| Java `Hrb2025Sc00224Test` (profit to line 6 with SE tax; farm optional method), `Hrb2025Sc00288Test` (material participation → Schedule F and SE tax), `Hrb2025Sc00321Test` (1099-PATR on 3a / 3b) | scenario pins |
| `TaxReturnComputeServiceTest.scheduleFOutOfScopeFlagRetired_noBlockerEmitted` (:25541) | old blocker retired |

Untested: conservation limit, line 6d, line E "No".

## 8. Compared with the IRS rules

| # | IRS rule (source) | What the app does | Result |
|---|---|---|---|
| 1 | Cash method: line 9 = 1c + 2 + 3b + 4b + 5a + 5c + 6b + 6d + 7 + 8 (`f1040sf.pdf p. 1`) | Same, without 6d (`TRCS:27782-27794`) | Match except D-sch-f-4 |
| 2 | Line 6d: crop insurance received in 2024 and elected to be included in 2025 (`i1040sf.pdf p. 5`) | Not asked; the UI calls the 2026-deferred amount "line 6d" (`FARM-UI:178`) and `cropInsuranceDeferredAmount` is never read; no prior-year bridge. Example: $2,500 deferred from 2024 → line 9 and line 34 $2,500 too low, SE tax ≈ $353 too low | **Not supported D-sch-f-4** (silent) |
| 3 | Lines 4b, 5c, 6b are the taxable amounts; 3b leaves out patronage dividends on personal / capital / depreciable purchases (`i1040sf.pdf p. 4–5`) | 3b falls back to 3a; 4b / 5c / 6b blank → 0 even when 4a / 5b / 6a are filled; no advisory; the 1099-PATR fill sets 3b = full total (`TRCS:27589-27590`) | **Deviation D-sch-f-5** (low) |
| 4 | Accrual: line 9 = Part III line 50 = line 44 − line 49, footnote for unit-livestock / farm-price methods (`f1040sf.pdf p. 2`) | `TRCS:27796-27810` | Match |
| 5 | Line 12 conservation ≤ 25% of gross income from farming; excess carried forward; later years again capped (`i1040sf.pdf p. 6`) | Added in full (`TRCS:27637-27639`); no cap, no carryforward field, no bridge. Example (section 11 of new_lines): $30,000 deducted instead of $24,625 → line 34 $5,375 too low, SE tax ≈ $759 too low, and the 2026 carryforward is lost. Form 4835 at least caps (D-4835-4 / D-4835-5) | **Deviation D-sch-f-3** (medium) |
| 6 | Line 34 → Schedule SE line 1a for individuals — whatever line E says; only a non-participating **landlord** uses Form 4835 (`i1040sf.pdf p. 9`; `i1040sse.pdf p. 3`: "even if you paid another person (an agent) to do the actual work or management", `p. 4` item 5) | Line E "No" drops the farm's net, gross and CRP from Schedule SE (`TRCS:27662`, `:27755-27759`), and therefore from the EIC base (merged net-for-SE), the SE health / retirement limits and the Form 2210-F gross farm income (`TRCS:7091-7092`) | **Deviation D-sch-f-1** (understated SE tax; medium-high) |
| 7 | Line E "No": a loss limited by Form 8582; prior passive losses ("PAL") (`i1040sf.pdf p. 3, 9`); passive farm income is net investment income (`i8960.pdf p. 5`; line 4a takes Schedule 1 line 6, `p. 8`) | No Form 8582 step: the full loss reduces other income. Form 8960 line 4a is built from Schedule 1 line 5 only (`TRCS:5524-5530`, `:43506-43601`), so passive farm profit is never NIIT income. Same root cause as D-sch-c-1 | **Not supported D-sch-f-2** (silent; medium) |
| 8 | At-risk: box 36b → Form 6198; disallowed loss carried to 2026 (`i1040sf.pdf p. 10`) | Capped at `amountAtRisk`; carryforward and bridge (`TRCS:27704-27777`) | Match (Form 6198 detail out of this file) |
| 9 | Line 14 / Form 4562 (`i1040sf.pdf p. 7`) | Computed assets or typed (`TRCS:27646-27658`) | Match (see `forms\4562.md`) |
| 10 | Line 8 includes hedging losses in parentheses; line 32f §263A capitalized costs in parentheses; prepaid supplies over 50% deducted when used (`i1040sf.pdf p. 5-6, 9`) | UI boxes have `[min]="0"`; no §263A or prepaid-supplies logic | **Not supported D-sch-f-8** (low; user can net by hand) |
| 11 | Form 1099 routing: 1099-PATR → 3a, 1099-A → 5b, 1099-MISC crop insurance → 6a, 1099-G / CCC-1099-G → 4a or 6a (`i1040sf.pdf p. 4`) | Only 1099-PATR is read; 1099-G box 7 and 1099-MISC box 9 stored but unused, no reconciliation advisory | **Not supported D-sch-f-6** (low; silent if not typed) |
| 12 | Schedule F is filed with the return (`f1040sf.pdf p. 1`); line D EIN, lines F / G | No output model; the preview is blank and always listed; D / F / G not asked | **Not supported D-sch-f-7** (form missing; amounts flow) |
| 13 | QJV: each spouse files a Schedule F for their share (`i1040sf.pdf p. 2`) | No QJV split for farms (Schedule C has one); each spouse must enter their own share as a farm; no prompt | **Not supported D-sch-f-9** (low; workaround exists) |
| 14 | 1099-PATR per person; household statements | Matched by recipient TIN (`TRCS:27526`) | Match (D-1a-1 does not repeat) |
| 15 | MFS: each spouse's own farms; community property follows state law, SE with the operator (`i1040sf.pdf p. 9`; `i1040sse.pdf p. 2`) | Spouse farm form ignored on MFS (`TRCS:4034`); community split by `communityPct` | Match |
| 16 | CRP of a Social Security recipient: no Schedule F adjustment; Schedule SE line 1b (`i1040sf.pdf p. 9`) | `crpPayments` sent to Schedule SE only | Match |
| 17 | Order of loss limits: at risk, passive, Form 461 (`i1040sf.pdf p. 9`) | At risk then Form 461 (passive missing — D-sch-f-2) | Match except D-sch-f-2 |
| 18 | QBI: the farm is a trade or business; patrons of specified cooperatives use Form 8995-A (`i8995.pdf p. 1–3`) | Every farm a QBI component (`TRCS:27761-27763`) | Match (patron reduction not reviewed here — unverified) |
| 19 | Line 34 rounding: add with cents, round the total (`i1040gi_ty2025.pdf p. 23`) | `TRCS:27766` | Match |

Already-recorded findings that touch Schedule F: D-4835-4 / D-4835-5 (conservation in Form 4835), D-sch-c-1 (same passive
gap for Schedule C), D-10-8 (SE compensation for the IRA limit).

## 9. Limits and out of scope

- **Schedule J** (farm income averaging) is not computed.
- **Farming NOL carryback** (2 years unless waived) — the NOL bridge carries forward only.
- **Weather-related livestock sale deferral**, CCC loan election statement, crop insurance deferral statement: the
  user enters the result; no statements are produced.
- **Part IV activity code** is stored only (used nowhere).
- Line 6 falls back to the legacy `farmIncomeLossLine6OutOfScope` field only when no farm is entered (`TRCS:32284`).

## 10. History

| Date | Entry |
|---|---|
| 2026-10-21 | git: "community property MFS - Schedule C / F net profit split per business (community share field, V366)" |
| 2026-10-20 | git: "Form 1099-PATR distributions go on lines 38a/38b of a single accrual-method farm …" (`history.md`: "Form 1099-PATR routed to an accrual farm or a single business (OPEN_QUESTIONS B107)") |
| 2026-10-20 | git: "the 2024 Form 2210-F farmer/fisher figures are asked … the farm merge keeps Schedule C gross receipts" (B109) |
| 2026-10-19 | git: "Form 4797 Part IV recapture … goes back as other income to its own schedule - … Schedule F line 8" |
| 2026-10-19 | `history.md`: "Farm QBI W-2 wages (OPEN_QUESTIONS B70; owner-approved field, V353)" |
| 2026-10-18 | `history.md`: "Form 1099-PATR - cooperative distributions to Schedule F lines 3a/3b (outstanding.md A62)" |
| 2026-08-01 | git: "Schedule F §465 at-risk lifecycle + carryforward provenance split (V225)" |
| 2026-07-20 | git: Self-employment Stage 2 C5 — Schedule F computed, blocker retired (comment `TRCS:32085-32087`) |
