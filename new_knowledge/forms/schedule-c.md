# Schedule C (Form 1040) — how the app does it

IRS rules: `C:\us-tax\new_lines\forms\schedule-c.md`. Flowchart: `C:\us-tax\new_flowcharts\forms\schedule-c.md`.
Paths are relative to `C:\us-tax`. `TRCS` = `us-tax-be/src/main/java/com/ustax/microservices/TaxReturnComputeService.java`.
`BIZ-UI` = `us-tax-ui/src/app/forms/form-business-income.component.ts`. Home office (line 30, Form 8829) is detailed in
`new_knowledge\forms\8829.md`; depreciation and section 179 (line 13, Form 4562) in `new_knowledge\forms\4562.md`.

---

## 1. Status

Schedule C is **computed but not produced as a form**. For every business the taxpayer (and, except on a
married-filing-separately return, the spouse) enters on the "Business income (Schedule C)" form, `computeScheduleC`
figures gross income (lines 1–7 with Part III cost of goods sold), expenses (lines 8–27b with 50% / 80% meals, the
standard mileage rate and the business share of car-loan interest), computed depreciation and the section 179 limit,
the home office (simplified method or Form 8829), the §165(d) wagering cap, the at-risk limit (Form 6198) and the
qualified joint venture split. The total goes to Schedule 1 line 3, each person's self-employment share to Schedule
SE, each business to the QBI deduction, and the total to Form 461. A not-for-profit activity goes to Schedule 1 line
8j. Gross receipts left blank on a person's only business are filled from that person's 1099-NEC box 1 + 1099-K box
1a (matched by recipient TIN — no dependent or other-spouse leak, so the D-1a-1 root cause does **not** repeat here).

What is missing: no Schedule C itself (per-business lines) is output — the preview shows a blank form (D-sch-c-2);
line G "No" (passive) has no effect (D-sch-c-1).

**10 differences from the IRS rules** (D-sch-c-1 … D-sch-c-10), plus already-recorded ones that touch Schedule C:
D-1a-4 (statutory-employee W-2 not carried here), D-1g-3 (Form 8919 firm's 1099-NEC auto-filled as gross receipts),
D-1b-4 and D-1d-4 (stale "Schedule C not supported" texts / blocker), D-1z-5 (§179 income limit's wage figure),
D-8-14 (Other incomes form says Schedule C is not computed), D-8829-1 (home-office limit before §179).

## 2. Where the user enters it

| Sidebar | Form (id) | Question / field (label) | Saved key | Feeds |
|---|---|---|---|---|
| Incomes | Business income (Schedule C) (`business-income-taxpayer` / `-spouse`) | "Did … operate a sole-proprietor business or profession in 2025?" | `hasBusinessIncome` | No → empty business list saved (`BIZ-UI:791-792`) |
| | per business (repeatable) | "Principal business or profession (line A)", "Business code (line B)", "Business name (line C)", "EIN (line D)", address (line E) | `principalBusinessOrProfession`, `principalBusinessCode`, `businessName`, `businessEin`, `businessAddressStreet`, `businessAddressCityStateZip` | name / profession used to match assets and home offices; code for Form 2210-F |
| | | "Accounting method (line F)" | `accountingMethod`, `accountingMethodOtherSpecify` | stored only |
| | | "Did … materially participate in this business? (line G)" | `materiallyParticipated` | **stored only** (D-sch-c-1) |
| | | "Started or acquired this business during 2025 (line H)" | `startedOrAcquiredThisYear` | stored only |
| | | (lines I / J not asked) | — | — |
| | | "This income was on a W-2 with the "statutory employee" box checked (no SE tax)" | `statutoryEmployeeW2Link` | out of the SE base, still QBI |
| | | "Is this a commercial fishing business?" | `commercialFishingBusiness` | Form 2210-F only |
| | | "Gross receipts or sales (line 1)", "Returns and allowances (line 2)", "Other income (line 6)" | `grossReceiptsOrSales`, `returnsAndAllowances`, `otherIncome` | lines 1, 2, 6 |
| | | Expenses (Part II), labels "Advertising (8)" … "Wages (26)" (`BIZ-UI:589-613`) | `advertising`, `carAndTruckExpenses`, `commissionsAndFees`, `contractLabor`, `depletion`, `depreciation`, `employeeBenefitPrograms`, `insuranceOtherThanHealth`, `interestMortgage`, `interestOther`, `legalAndProfessionalServices`, `officeExpense`, `pensionAndProfitSharingPlans`, `rentVehiclesMachineryEquipment`, `rentOtherBusinessProperty`, `repairsAndMaintenance`, `supplies`, `taxesAndLicenses`, `travel`, `meals`, `utilities`, `wages`, `wagesNotOnW2`, `energyEfficientCommercialBldgsDeduction` | lines 8–27a |
| | | "These meals were eaten while subject to the Department of Transportation hours-of-service limits" | `mealsSubjectToDotHoursOfService` | 80% instead of 50% |
| | | Other expenses (Part V) rows | `otherExpenses[].description`, `.amount` | line 27b |
| | | Cost of goods sold (Part III): "Inventory method (line 33)", "Inventory at beginning of year (35)", "Purchases (36)", "Cost of merchandise you took for personal or family use", "Purchase returns and allowances", "Cost of labor (37)", "Of the cost of labor, the part paid as W-2 wages", "Materials and supplies (38)", "Other costs (39)", "Inventory at end of year (41)" | `inventoryMethod`, `inventoryAtBeginningOfYear`, `purchasesLessPersonalUse`, `purchasesWithdrawnForPersonalUse`, `purchaseReturnsAndAllowances`, `costOfLabor`, `costOfLaborW2Wages`, `materialsAndSupplies`, `otherCosts`, `inventoryAtEndOfYear` | line 42 → line 4 |
| | | Home office (line 30): Method; simplified → "Total square footage of your home", "Square footage used for business (max 300)" | `homeOfficeMethod` (`simplified` / `form8829`), `homeOfficeTotalSqft`, `homeOfficeBusinessSqft` | line 30 |
| | | Vehicle information (Part IV) rows: description, business / commuting / other miles (44a–c), parking fees, tolls, "Car loan interest paid (full amount - we take the business share)", VIN, in-service date, personal use | `vehicles[].businessMiles`, `commutingMiles`, `otherMiles`, `parkingFees`, `tolls`, `carLoanInterest`, `vin`, `inServiceMonth/Day/Year`, `availableForPersonalUse`; per business `anotherVehicleAvailablePersonalUse`, `evidenceToSupportDeduction`, `evidenceIsWritten` | line 9, line 16b, Form 4562 Part V |
| | | "Is this activity carried on to make a profit?" (No = hobby), "Briefly describe the activity" | `operatedForProfit`, `hobbySupportingDocs` | No → Schedule 1 line 8j |
| | | "Is this a gambling or wagering business?" | `isWageringBusiness` | §165(d) cap |
| | | "All investment is at risk (line 32a)" / "Some investment is not at risk (line 32b, Form 6198)", "Amount at risk (Form 6198)", "Prior-year suspended at-risk loss for this business" | `allInvestmentAtRisk`, `someInvestmentNotAtRisk`, `amountAtRisk`, `priorYearAtRiskCarryforward` | at-risk cap |
| | | SSTB, "Qualified Joint Venture?", "Your share of the business (%)", Form 4361 ministerial income, community share (MFS in a community property state) | `isSpecifiedServiceTradeOrBusiness`, `qualifiedJointVenture`, `qjvTaxpayerSharePercent`, `ministerialIncome`, `communityPct` | QBI / SE / community split |
| Incomes | Depreciable assets (Form 4562) (`depreciation-asset-*`) | per asset, matched to a business by name | see `forms\4562.md` | line 13 |
| Deductions | Home office (Form 8829) (`home-office-actual-*`) | per office | see `forms\8829.md` | line 30 |
| Incomes | Self-employment tax options (`se-tax-options-*`) | prior-year §179 carryover, prior-year business at-risk carryforward, notary fees | `priorYearSection179Carryover`, `priorYearBusinessAtRiskCarryforward`, `notaryFeeIncome` | §179 line 10, at-risk, Schedule SE |

UI: `BIZ-UI:130-542` (template), `:589-625` (expense and COGS label lists); sidebar entries
`us-tax-ui/src/app/shell/shell.component.ts:887-888`, routed `:497-498`.

Statements read: **Form 1099-NEC** box 1 (`nonemployeeCompensationAmount`, matched by `recipientTIN`) and **Form 1099-K**
box 1a (`grossAmountTransactions1aAmount`, matched by `payeeTIN`, else `recipientTIN`) — `TRCS:28924-28953`;
**Form 1099-PATR** (boxes 1, 2, 3, 5) into line 6 of a person's single business when no farm exists (`TRCS:27512-27560`).
**Form 1099-MISC is not read** for Schedule C (D-sch-c-4). A statutory-employee **W-2** is not read either (D-1a-4).

## 3. Where it is stored

| Data | Id | Entity / table | Columns |
|---|---|---|---|
| Business form | personal `business-income-taxpayer` / `-spouse` | `PfBusiness` / `pf_business` (row per `uid`, `owner_role`, `tax_year`) | `has_business_income` |
| One business = one Schedule C | (child `taxpayerBusinesses` / `spouseBusinesses`) | `PfBusinessActivity` / `pf_business_activity` | every field above (`gross_receipts_or_sales`, `returns_and_allowances`, `other_income`, expense columns, COGS columns, `home_office_method`, `home_office_business_sqft`, `materially_participated`, `statutory_employee_w2_link`, `operated_for_profit`, `some_investment_not_at_risk`, `amount_at_risk`, `qualified_joint_venture`, `community_pct`, …) |
| Vehicles | `vehicles[]` | `PfBusinessVehicle` / `pf_business_vehicle` | miles, parking, tolls, `car_loan_interest`, `vin` |
| Part V | `otherExpenses[]` | `PfBusinessOtherExpense` / `pf_business_other_expense` | `description`, `amount` |

Entities: `us-tax-be/src/main/java/com/ustax/entity/PfBusiness.java:16`, `PfBusinessActivity.java:17-275`,
`PfBusinessVehicle.java:14`, `PfBusinessOtherExpense.java:14`. Mapper:
`us-tax-be/src/main/java/com/ustax/microservices/personal/BusinessIncomeMapper.java` (save `:43-190`, load `:195+`;
the whole activity set is replaced on each save). Liquibase: `us-tax-be/src/main/resources/db/changelog/changes/V141__pf_business_income.sql`
plus later column additions (V312 meals DOT, V313 car-loan interest, V315 COGS reductions, V352 VIN, V366 community share).

## 4. How it is computed

Methods:

- Call site: `TRCS:4051-4072` inside `prepare` — the spouse's business, depreciation and home-office forms are passed
  as `null` on an MFS return (`TRCS:4053, :4059, :4061`). Farm items are computed first (`TRCS:4031-4038`) so the
  section 179 limit spans Schedule C and Schedule F.
- `computeScheduleC` `TRCS:26843-27398`: Phase 1 per business `TRCS:26906-27057`; Phase 2 section 179 limit
  `TRCS:27076-27128`; Phase 3 finalize each business `TRCS:27184-27344`; result `TRCS:27362-27397`.
- Helpers: `scheduleCCogs` `TRCS:28572-28592`, `scheduleCExpenses` `TRCS:28595-28611`, `scheduleCVehicleLoanInterest`
  `TRCS:28623-28647`, `qbiW2WagesForBusiness` `TRCS:28654-28664`, `scheduleCVehicleMileage` `TRCS:28666-28678`,
  `scheduleCSimplifiedHomeOffice` `TRCS:28682-28687`, `computeHomeOfficeDeduction` `TRCS:28763-28871`,
  `matchHomeOfficeToBusiness` `TRCS:28900-28919`, `sumScheduleCStatements` `TRCS:28924-28953`.
- Routing: Schedule 1 line 3 `TRCS:32256-32266` (+ the signed Form 8990 §163(j) adjustment), output
  `TRCS:32660`; hobby → line 8j `TRCS:32394-32399`; advisory `TRCS:32117-32124`; §461(l) aggregate
  `TRCS:32285-32300`; Schedule SE `computeScheduleSE` `TRCS:29128`; QBI `buildScheduleCQbi` `TRCS:30144`; community
  property split `CommunityProperty.split` (`TRCS:4100`).
- Dependent's own return: a synthetic one-business form is injected when the dependent has a 1099-NEC / 1099-K with
  their SSN (`TRCS:677-692`, `:702-717`).

Steps, mirroring `new_lines\forms\schedule-c.md` section 6:

1. **Header, lines A–F, H.** Saved; not used in the computation except name / profession (matching assets, home
   offices, QBI aggregation key) and the business code (Form 2210-F, `Form2210FGrossIncome.java:20,34`). Lines I / J
   and line 34 are not asked. No form is output (D-sch-c-2).
2. **Line G.** `materiallyParticipated` is saved but never read for Schedule C (the only compute read is the farm path
   `TRCS:27662`). A "No" answer neither limits a loss through Form 8582 nor allows prior-year passive losses
   (D-sch-c-1).
3. **Line 1.** `grossReceiptsOrSales`. If blank **and** the person has exactly one business **and** a positive
   1099-NEC + 1099-K total for that person's SSN, the total is used (`TRCS:26924-26927`). The 1099-K total is the full
   box 1a — the amounts the user reports as "in error / personal items" (`form1099KPersonalItemsDisclosureAmount`) are
   not subtracted (D-sch-c-3); 1099-MISC boxes are never included (D-sch-c-4); the auto-fill does not look at whether
   that one business is a statutory-employee or hobby activity (D-sch-c-5) or whether a 1099-NEC comes from a Form 8919
   firm (D-1g-3). Per person, when the 1099 total differs from the sum of gross receipts (after any auto-fill), the
   non-blocking `SCHEDULE_C_GROSS_RECEIPTS_1099_MISMATCH` is raised (`TRCS:27054-27056`, `:32117-32124`).
4. **Line 2, 3.** `line3net = gross − returnsAndAllowances` (`TRCS:26930`).
5. **Part III → line 4.** `scheduleCCogs`: lines 35 + 36 + 37 + 38 + 39, less the personal-withdrawal and purchase-return
   amounts (not below 0 of purchases), less line 41; 0 when nothing entered. A negative result raises
   `SCHEDULE_C_NEGATIVE_COGS_*` (`TRCS:26931-26941`).
6. **Line 5, 6, 7.** `grossIncome = line3net − cogs + otherIncome` plus Form 4797 Part IV recapture of this business's
   assets (`TRCS:26942-26947`). 1099-PATR distributions are put in `otherIncome` first when the person has no farm and
   exactly one business with line 6 blank (`TRCS:27536-27560`, advisories `FORM_1099PATR_*`).
7. **Hobby.** `operatedForProfit == false` → a positive line 7 goes to `hobbyTotal` (Schedule 1 line 8j) and the
   business is skipped (`TRCS:26949-26952`). Correct per `i1040sc.pdf p. 2`.
8. **Line 8 … 27b.** `scheduleCExpenses` sums the 21 expense keys, adds meals × 50% (80% with the DOT box) rounded to
   whole dollars, and the Part V rows (`TRCS:28595-28611`). No credit reductions are applied to lines 14, 23, 26 —
   the app computes none of Forms 5884 / 8844 / 8932 / 8994 / 8941 / 8846, so the typed figures are used as entered.
9. **Line 9.** Standard mileage = Σ business miles × $0.70 + parking + tolls, only when `carAndTruckExpenses` (actual)
   is blank (`TRCS:28666-28678`). A business that uses mileage and depreciates a passenger automobile gets
   `VEHICLE_STANDARD_MILEAGE_WITH_DEPRECIATION_*` (`TRCS:26968-26987`).
10. **Line 16b (car-loan interest).** Per vehicle, interest × business miles ÷ (business + commuting + other) added to
    the expenses (`TRCS:28623-28647`); advisories `VEHICLE_LOAN_INTEREST_NO_MILEAGE_*`,
    `VEHICLE_LOAN_INTEREST_WITH_ACTUAL_EXPENSES_*`. Schedule 1-A removes the business share from its car-loan
    deduction via the VIN (`TRCS:5623-5632`).
11. **Line 13.** When any depreciation asset matches the business (by name / profession, `matchAssetsToBusiness`),
    line 13 = computed bonus + MACRS of those assets, and section 179 is held back for Phase 2; otherwise the typed
    `depreciation` field is used (`TRCS:26954-26966`). A typed amount is silently ignored once one asset matches
    (D-sch-c-8). Details: `forms\4562.md`.
12. **Line 28, 29.** Not stored; `tentativeBeforeHomeOffice = grossIncome − expenses − mileage − car-loan interest −
    line 13 (without §179)` (`TRCS:26992-26996`).
13. **Line 30.** `computeHomeOfficeDeduction` with `ceiling = max(0, tentativeBeforeHomeOffice)`:
    - simplified: `$5 × min(homeOfficeBusinessSqft, 300)`, capped at the ceiling; any Form 8829 carryover passes
      through unchanged (`TRCS:28776-28781`, `:28682-28687`). The ceiling is before §179 (D-sch-c-6, same root cause
      as D-8829-1); the 300 sq ft cap is per business, there is no part-year average or daycare fraction, and the
      worksheet line 1 adjustments are not modelled (D-sch-c-7).
    - `form8829`: the matched office's three-tier Form 8829 (`TRCS:28784-28870`); the line 35 casualty part is moved
      off line 30 to Form 4684 / Schedule 1 line 4 except for a QJV (`TRCS:27026-27032`). See `forms\8829.md`.
14. **Net before §179.** `netProfitBefore179 = tentative − home office` (`TRCS:27033`).
15. **Section 179 (Phase 2).** Total elected (Schedule C + Schedule F) against the dollar cap ($2,500,000, half on MFS,
    reduced above $4,000,000), the business-income ceiling = Σ net before §179 + **all W-2 box 1 in the account**
    (`TRCS:4063`, D-1z-5), and the prior-year carryover; allowed amount spread over businesses in proportion to their
    elections; carryover out stored (`TRCS:27076-27133`, `:27184-27196`). Advisory `SCHEDULE_C_SECTION_179_LIMITED`.
16. **§165(d) wagering business.** Total deductions capped at gross income for 2025 (rate 1.0; 0.90 from 2026)
    (`TRCS:27198-27229`, `:26819-26822`); advisory `SECTION_165D_WAGERING_LOSSES_LIMITED`.
17. **Line 32 / Form 6198.** The business's own prior-year at-risk carryforward (or the return-level aggregate, released
    once on the first at-risk-limited business) is subtracted; a loss with `someInvestmentNotAtRisk` and an amount at
    risk is capped at `−amountAtRisk`, the excess suspended (`TRCS:27230-27265`). A 32b box with a blank amount at
    risk is treated as fully at risk.
18. **Form 4797 recapture.** For a person with exactly one non-QJV business: Part IV recapture added to net (SE + QBI);
    Part II / III recapture added to the QBI base only (`TRCS:27266-27283`).
19. **Line 31 and its destinations.** `netProfitTotal` = Σ business nets (`TRCS:27284`) → `netProfitLine3`, rounded
    (`TRCS:27363`). Per person: non-statutory nets → `taxpayerNetForSe` / `spouseNetForSe` (Schedule SE line 2),
    ministerial slice tracked for Form 4361 (`TRCS:27316-27326`); QJV on a joint return splits the net, wages and UBIA
    by the taxpayer share (default 50%) (`TRCS:27285-27315`); each non-zero business becomes a QBI component, the
    statutory one included (`TRCS:27327-27340`). No Form 8582 step (D-sch-c-1).
20. **Schedule 1 line 3.** `line3 = scheduleC.netProfitLine3` (else the legacy typed `businessIncomeLossLine3OutOfScope`)
    + the signed Form 8990 adjustment (`TRCS:32256-32266`) → `Schedule1AdditionalIncome.businessIncomeLoss`
    (`TRCS:32660`). On a community-property MFS return the community part of each business is split between the two
    returns for income tax (`CommunityProperty.java:385-455`).

## 5. Flags and advisories

| Code | Blocks? | When | Tells the user | Where |
|---|---|---|---|---|
| `SCHEDULE_C_GROSS_RECEIPTS_1099_MISMATCH` | No | A person's 1099-NEC + 1099-K total ≠ their gross receipts total (either direction) | Confirm gross receipts include statements plus cash income | `TRCS:27054-27056`, `:32117-32124` |
| `SCHEDULE_C_NEGATIVE_COGS_TAXPAYER` / `_SPOUSE` | No | Part III result < 0 | Check the inventory figures | `TRCS:26935-26941` |
| `VEHICLE_STANDARD_MILEAGE_WITH_DEPRECIATION_*` | No | Mileage claimed and a passenger auto depreciated in the same business | Same car can't use both | `TRCS:26978-26986` |
| `VEHICLE_LOAN_INTEREST_NO_MILEAGE_*` | No | Car-loan interest with no miles | Enter the miles | `TRCS:28631-28637` |
| `VEHICLE_LOAN_INTEREST_WITH_ACTUAL_EXPENSES_*` | No | Interest share and actual car expenses | Don't include interest in line 9 | `TRCS:28641-28645` |
| `QBI_WAGE_PARTS_EXCEED_LINES_*` | No | Wages not on W-2 > line 26, or W-2 labor > line 37 | Fix QBI wage details | `TRCS:28658-28662` |
| `SCHEDULE_C_SECTION_179_LIMITED` | No | Allowed §179 < elected + carryover | Amount limited; carryover / non-deductible excess | `TRCS:27113-27127` |
| `HOME_OFFICE_LIMITED_BY_GROSS_INCOME` | No | Form 8829 tiers 2–3 exceed the limit | Disallowed part carries forward | `TRCS:28863-28869` |
| `FORM_8829_LINE35_CASUALTY_TO_FORM_4684` | No | Home casualty allowed on Form 8829 line 35 | Moved to Form 4684 / Schedule 1 line 4 | `TRCS:4217-4224` |
| `SECTION_165D_WAGERING_LOSSES_LIMITED` | No | Wagering business deductions > gains | Disallowed, not carried | `TRCS:27218-27225` |
| `FORM_1099PATR_ADDED_TO_SCHEDULE_C_*` / `_SCHEDULE_C_LINE6_SHORT_*` / `_INCOME_NOT_REPORTED_*` | No | 1099-PATR routing | Where the amount went / should go | `TRCS:27545-27570` |
| `DEPRECIATION_MID_QUARTER_REQUIRED_*` / `DEPRECIATION_HALF_YEAR_REQUIRED_*` | No | 40% test | Convention switched | `TRCS:26733-26752` |
| `STATUTORY_EMPLOYEE_W2_SCHEDULE_C` | No | Statutory-employee W-2 (line 1a side) | Add a statutory business by hand | `TRCS:40998-41005` (D-1a-4) |
| `SECTION_461L_EXCESS_BUSINESS_LOSS_CARRYFORWARD` | No | §461(l) excess | Excess on 8p, NOL next year | `TRCS:32309` |

No flag exists for: line G "No", a 1099-MISC with business boxes, a typed line 13 being dropped, the simplified-method
300 sq ft being used twice in one home.

## 6. What it produces

| Item | Value |
|---|---|
| Output model | **No Schedule C model.** Only the aggregate `Schedule1AdditionalIncome.businessIncomeLoss` (`us-tax-be/src/main/java/com/ustax/model/output/Schedule1AdditionalIncome.java:10,117-122`) |
| JSON path | `schedule1.additionalIncome.businessIncomeLoss` (Schedule 1 line 3); hobby in the line 8j total |
| Database | `out_schedule_1.add_inc_business_income_loss` (`us-tax-be/.../entity/OutSchedule1.java:38`); at-risk carryforward `OutSchedule1.java:168` (V196); §179 carryover via Form 4562 output |
| Preview | Schedule C preview `form-tax-return-schedule-c` always listed (`shell.component.ts:1820-1821`, gate commented `if (true /* computation?.scheduleC */)`), renders the blank IRS layout; `buildSemanticValues` fills only a `scheduleC.header` the backend never sends; its comment still says "Schedule C compute is OUT OF SCOPE" (`us-tax-ui/src/app/forms/form-tax-return-schedule-c.component.ts:79-87, :166-177`) (D-sch-c-2) |
| Next | Schedule 1 line 3 → line 10 → Form 1040 line 8 → line 9 → AGI; Schedule SE (per person) → Schedule 2 line 4 and Schedule 1 line 15; QBI (Form 8995 / 8995-A) → line 13a; Form 461 → Schedule 1 line 8p; EIC / §219 / SE health and retirement limits via the per-person net |

## 7. Tests

Java unit tests (`us-tax-be/src/test/java/com/ustax/microservices/`): `ScheduleCMealsRoundingTest` (line 24b whole
dollars), `CarLoanInterestBusinessShareTest` (line 16b share), `CommunityPropertyBusinessSplitTest` (MFS community
split), `Form1099PatrRoutingTest` (1099-PATR → line 6), `Form4797PartIvActivityRoutingTest` (Part IV recapture →
line 6), `HomeOfficeDeductionChoiceTest`, `Form8829Line35And44Test`, `Form8829Line9DisasterTest`,
`Form2210FGrossIncomeGateTest`, `PriorYearBusinessUseBasisTest`; `TaxReturnComputeServiceTest`
`scheduleCOutOfScopeFlagRetired_noBlockerEmitted` (:25517), `qbiScheduleC_seDeductionAllocationExcludesQbiOnlyRecapture`
(:3735); SQA scenario pins `Hrb2025Sc00207Test` … `Sc00228Test` (Schedule C / SE, statutory employee, simplified home
office, standard mileage, §179 income limit, meals, hobby with COGS, QJV, two Schedules C).

E2E specs (`us-tax-be/e2e/tests/`):

| Spec | Proves |
|---|---|
| `schedule-c-compute.spec.ts` (5) | net profit → line 3 with meals 50% and simplified home office; COGS + other income; hobby → 8j; 1099-NEC auto-fill for one business; Schedule SE rounding |
| `schedule-c-1099k-cogs.spec.ts` | 1099-K gross − COGS → SE tax |
| `schedule-c-depreciation.spec.ts` (12) | §179, bonus, MACRS, mid-quarter, mileage, listed property, §280F caps, Form 8829, §179 income limit |
| `schedule-c-qbi.spec.ts`, `schedule-c-qjv.spec.ts`, `schedule-c-se-tax.spec.ts` | QBI, QJV split, SE tax |
| `se-statutory-employee-qbi.spec.ts` | statutory business: no SE tax, QBI included |
| `se-cogs.spec.ts`, `se-vehicle-expense.spec.ts`, `se-vehicle-parking-tolls.spec.ts`, `se-home-office-280a-tiers.spec.ts`, `se-mid-quarter-convention.spec.ts`, `se-bonus-cutover.spec.ts`, `se-asset-double-match.spec.ts` | line-level pieces |
| `at-risk-schedule-c-f.spec.ts`, `at-risk-per-activity-carryforward.spec.ts`, `business-at-risk-carryforward-bridge.spec.ts` | Form 6198 limit and carryforward |
| `professional-gambler-section165d.spec.ts` | §165(d) cap |
| `open-questions-b107-1099patr-schedule-c.spec.ts`, `open-questions-b68-car-loan-business-share.spec.ts`, `open-questions-b118-community-business-split.spec.ts`, `open-questions-b80-part-iv-activity-routing.spec.ts` | 1099-PATR, car-loan share, community split, Part IV recapture |
| `dependent-own-self-employment.spec.ts`, `mfs-spouse-se-income.spec.ts` | dependent's own Schedule C from 1099s; MFS spouse isolation |
| `section461l-excess-business-loss.spec.ts` | Form 461 / line 8p |
| `business-income-save-load.spec.ts`, `business-income-qjv-render.spec.ts` | intake persistence |

No test covers line G "No", a 1099-K with personal items next to a business, a 1099-MISC box 6, or the Schedule C
preview contents.

## 8. Compared with the IRS rules

| # | IRS rule (source) | What the app does | Result |
|---|---|---|---|
| 1 | One Schedule C per business; line 31 of all go to Schedule 1 line 3 (`i1040sc.pdf p. 3`, `p. 14`; `i1040gi_ty2025.pdf p. 89`) | Per-business computation, summed to line 3 (`TRCS:27284`, `:32256-32260`) | Match |
| 2 | Schedule C is filed with the return (`f1040sc.pdf p. 1`) | No Schedule C output; the preview is the blank form with a stale "OUT OF SCOPE" comment and is always listed (`form-tax-return-schedule-c.component.ts:79-87, :166-177`; `shell.component.ts:1820`) | **Not supported D-sch-c-2** (form missing; amounts flow) |
| 3 | Line G "No" → passive; loss limited by Form 8582; prior-year passive losses ("PAL") (`i1040sc.pdf p. 4–5`, `p. 14`) | `materiallyParticipated` stored, never read for Schedule C; a passive loss is deducted in full against other income | **Not supported D-sch-c-1** (silent, overstated loss) |
| 4 | Line 1 includes all 1099-NEC / 1099-K / 1099-MISC business amounts and other receipts (`i1040sc.pdf p. 2`, `p. 5`) | Typed; auto-fill from 1099-NEC + 1099-K for a person's single business when blank (`TRCS:26924-26927`), filtered by the person's TIN (no dependent / other-spouse leak) | Match (with D-sch-c-3, -4, -5) |
| 5 | 1099-K amounts in error / personal items go in the Schedule 1 entry space, not Schedule C (`i1040gi_ty2025.pdf p. 88`) | Auto-fill takes the full 1099-K box 1a; `form1099KPersonalItemsDisclosureAmount` is not subtracted; the mismatch advisory then asks the user to match the full total (`TRCS:28939-28950`, `:32117-32124`). Example: business 1099-K $8,000 + couch sold $700 on the same 1099-K, gross left blank → line 1 $8,700 and $700 also on the Schedule 1 entry space | **Deviation D-sch-c-3** (overstated income and SE tax; silent when gross receipts are blank) |
| 6 | 1099-MISC box 3 (business), 5, 6, 7 go on Schedule C (`f1099msc.pdf p. 5`) | 1099-MISC never read for Schedule C (only withholding, strike benefits, the contractor check: `TRCS:3260`, `:3528`, `:39984`); not in the auto-fill or the mismatch check | **Not supported D-sch-c-4** (silent if not typed; low) |
| 7 | Statutory-employee income on its own Schedule C, never combined with SE income (`i1040sc.pdf p. 5`); hobby is not Schedule C | The 1099 auto-fill fills the single business whatever it is — a statutory-employee business (its 1099-NEC income then escapes SE tax) or a hobby (goes to 8j) | **Deviation D-sch-c-5** (edge case; low) |
| 8 | Statutory employee: box 1 on line 1, no SE tax, still QBI (`i1040sc.pdf p. 5, 14`; `i1040sse.pdf p. 4`; `i8995.pdf p. 2`) | Business marked `statutoryEmployeeW2Link`: out of `netForSe`, in QBI (`TRCS:27321-27340`); the W-2 is not carried automatically (D-1a-4) | Match (D-1a-4 on the W-2 side) |
| 9 | Pay that is Form 8919 wages is not Schedule C income (`f8919.pdf p. 2`) | 8919 firm's 1099-NEC is in the auto-fill | see **D-1g-3** |
| 10 | Line 3 = 1 − 2; Part III line 42 → line 4; line 7 = 5 + 6 (`f1040sc.pdf p. 1–2`) | `TRCS:26930-26943`, `:28572-28592` | Match |
| 11 | Line 6 includes 1099-PATR and Form 4797 Part IV recapture (`i1040sc.pdf p. 6`) | `TRCS:27536-27560`, `:26944-26947` | Match |
| 12 | Line 9: $0.70 × business miles + parking + tolls, or actual (`i1040sc.pdf p. 6–7`) | `TRCS:28666-28678`; the 5-vehicle / first-year rules are the user's choice | Match |
| 13 | Line 16b business share of car-loan interest; personal share on Schedule 1-A, never both (`i1040sc.pdf p. 8`) | `TRCS:28623-28647`; VIN coordination with Schedule 1-A | Match |
| 14 | Line 13 = Form 4562 (`i1040sc.pdf p. 7`) | Computed assets, else the typed field; a typed amount is dropped without notice once one asset matches (`TRCS:26966`) | **Not supported D-sch-c-8** (mixed typed + itemized depreciation understated; low) |
| 15 | Line 24b 50% / 80% DOT (`i1040sc.pdf p. 10`) | `TRCS:28600-28606` | Match |
| 16 | Lines 14, 23, 26 reduced by Forms 8941, 8846, 5884 / 8844 / 8932 / 8994 (`i1040sc.pdf p. 7, 9, 10`) | Typed as entered; the app computes none of those credits, so no double benefit | Match (user-entered) |
| 17 | Simplified home office: limit = Schedule C line 29 (after line 13, which includes §179) adjusted for home gains / losses (`i1040sc.pdf p. 11-12`; `p334.pdf p. 42`: the limit is the gross income less the business expenses "such as … depreciation on equipment") | Ceiling = tentative profit **before** §179 (`TRCS:26992-26996`, `:28780`) | **Deviation D-sch-c-6** (same root cause as D-8829-1; at most $1,500 overstated, and a §179 carryover appears where the IRS limits the home office; low) |
| 18 | Simplified: 300 sq ft for **all** businesses in the home; part-year average monthly area; daycare fraction; other-location income split (`i1040sc.pdf p. 10-13`) | `min(sqft, 300)` per business (`TRCS:28682-28687`); no part-year, daycare or location inputs | **Not supported D-sch-c-7** (silent; low) |
| 19 | Simplified: no carryover of the limited amount; prior Form 8829 carryovers stay suspended (`i1040sc.pdf p. 11, 13`) | Capped, no carry; prior carryovers pass through (`TRCS:28776-28781`) | Match |
| 20 | Line 30 = Form 8829 line 36 (`i1040sc.pdf p. 10, 14`) | `TRCS:28784-28870`, casualty to Form 4684 | Match (see `forms\8829.md`, D-8829-*) |
| 21 | Line 31 / 32: at-risk limit before the loss reaches line 31; excess is a 2026 deduction (`i1040sc.pdf p. 14-15`) | `TRCS:27230-27265`, carryforward bridge | Match |
| 22 | Excess business loss on Form 461 after line 31 (`i1040sc.pdf p. 1`; `i461.pdf p. 2`) | `TRCS:32285-32300` | Match |
| 23 | Line 31 → Schedule SE line 2 per person, not statutory / notary (`i1040sc.pdf p. 14`) | `netForSe` per side (`TRCS:27321-27326`); notary fees subtracted in Schedule SE (`TRCS:29250-29258`) | Match |
| 24 | Schedule C income may be QBI (`i1040sc.pdf p. 5`) | Each business a QBI component (`TRCS:27327-27340`) | Match |
| 25 | Hobby → Schedule 1 line 8j, no Schedule C (`i1040sc.pdf p. 2`; `p525.pdf p. 31`) | Positive line 7 → 8j (`TRCS:26949-26952`, `:32394-32399`) | Match |
| 26 | QJV: spouses own the business, **each materially participates**, joint return; each reports a share (`i1040sc.pdf p. 2-3`) | Split only on MFJ (`TRCS:27285`); participation not checked — only the label says so (`BIZ-UI:507`) | **Not supported D-sch-c-9** (an ineligible couple gets the QJV split; low) |
| 27 | Separate returns: each spouse's own businesses; community-property MFS rules (`i1040sc.pdf p. 3`, `p. 14`) | Spouse forms null on MFS (`TRCS:4053`); community split per business (`CommunityProperty.java`) | Match |
| 28 | Line labels: energy efficient buildings is line 27a, other expenses 27b (`i1040sc.pdf p. 1`); a 1099-NEC statement is needed only when the 1099-NEC total exceeds line 1 (`i1040sc.pdf p. 5`) | UI says "Energy efficient commercial buildings (27b)" (`BIZ-UI:613`); the mismatch advisory also fires when gross receipts exceed the statements (normal with cash income) | **Deviation D-sch-c-10** (cosmetic; low) |
| 29 | §179 business income limit includes the wages of Form 1040 line 1a (`i4562.pdf p. 5`) | All W-2 box 1 in the account (`TRCS:4063`) | see **D-1z-5** |
| 30 | Medicaid waiver home-care business: line 1 + Part V "Notice 2014-7" (`i1040sc.pdf p. 6`) | Blocked on the Medicaid form; Part V rows can carry it | see **D-1d-4** |

## 9. Limits and out of scope

- **Form 8582** (passive activity losses) is not computed for Schedule C (D-sch-c-1); rentals and K-1s have their own
  passive handling (`new_knowledge\8.md` 4.5).
- **Accounting-method changes** (Form 3115, §481(a)), the installment-method statement, uniform capitalization,
  startup-cost and de minimis elections are not modelled: the user types the resulting amounts on line 6 or Part V.
- **Lines I, J, 34** are not asked; **Part IV** answers feed Form 4562 Part V only (`Form4562PartV.java:175,188`).
- **Dependents:** the business form exists only for the taxpayer and the spouse; a dependent's own return gets a
  synthetic business with gross receipts from their 1099-NEC / 1099-K and no expenses (`TRCS:677-692`).
- The §163(j) adjustment is applied to the line 3 total, not to the business's lines 16a / 16b.
- `computeScheduleC` reads the business list regardless of `hasBusinessIncome`; the UI saves an empty list for "No"
  (`BIZ-UI:791-792`), so this is safe through the UI.
- The return-level at-risk aggregate is not released against a fully-at-risk business (deliberate, `TRCS:27162-27175`).

## 10. History

`history.md` holds entries from 2026-10-03 on; older changes are in the git log of `us-tax-be`.

| Date | Entry |
|---|---|
| 2026-10-21 | `history.md`: "Community property: Schedule C / F businesses split on MFS returns (OPEN_QUESTIONS B118)" |
| 2026-10-21 | `history.md`: "Form 8829 line 35 to Form 4684 Section B; lines 43 and 44 kept apart (B111)" |
| 2026-10-21 | `history.md`: "Form 1099-PATR routed to an accrual farm or a single business (B107)" |
| 2026-10-20 | `history.md`: "Form 4797 Part IV recapture goes back to its own schedule (B80)" |
| 2026-10-19 | `history.md`: "Car loan interest not deducted twice (B68, V352)"; "Schedule C meals rounded per line (B67)" |
| 2026-10-18 | `history.md`: "Schedule C line 36 - personal withdrawals and returns subtracted (A65)"; "QBI W-2 wages (A36)"; "Schedule C car-loan interest (A34)"; "Schedule C meals at 80% under the DOT hours-of-service limits (A32)"; "Section 179 carryover bridge (B10)" |
| 2026-10-15/16 | `history.md`: round-2 QA scenarios sc_00201-00230 pinned (Schedule C / SE, statutory employee, simplified home office, standard mileage, §179 income limit, hobby with COGS, QJV) |
| 2026-09-17 | git: "V265 -- IRC 165(d) on the professional-gambler Schedule C path" |
| 2026-07-20 | git: "SE Stage 2 C1" — Schedule C computed on Schedule 1 line 3 (retired `hasScheduleCBusinessIncomeOutOfScope`; `TRCS:32082-32084`); C4b–C4d depreciation and home office |
