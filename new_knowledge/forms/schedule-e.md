# Schedule E (Form 1040) — how the app does it

IRS rules: `C:\us-tax\new_lines\forms\schedule-e.md`. Flowchart: `C:\us-tax\new_flowcharts\forms\schedule-e.md`.
Paths are relative to `C:\us-tax`. `TRCS` = `us-tax-be/src/main/java/com/ustax/microservices/TaxReturnComputeService.java`.
`RI-UI` = `us-tax-ui/src/app/forms/form-rental-income.component.ts`. Passive-loss detail: `forms\8582.md`; at-risk:
`forms\6198.md`; farm rental (line 40): `forms\4835.md`.

---

## 1. Status

Schedule E is **computed and produced** as one preview per return. Part I is figured property by property from the
"Rental & royalty income" form (rents, royalties with automatic or cost depletion, expense lines 5–19, depreciation from
typed amounts or depreciation assets, the 14-day / 10% home-use test, under-15-day rentals dropped, the vacation-home
limit with carryovers, whole-year totals split by days, a Form 1098 picked per property for line 12). Each property is
capped at its amount at risk (Form 6198) and then pooled in one §469 engine with Form 4835 farm rentals and passive
K-1s (Form 8582). Part II takes nonpassive partnership / S corporation K-1 box 1 (partnership losses at-risk-capped);
estate / trust K-1 box 6 is added there too. Line 40 is the Form 4835 farm rental; line 41 is line 26 + 32 + 40.
**Schedule 1 line 5** is computed separately from the same pieces **plus K-1 royalties**.

**8 differences recorded here** (D-sch-e-1 … D-sch-e-8). The most serious: Schedule K-1 (Form 1041) boxes 5, 7 and 8
(trust royalties / IRD, rental real estate, other rental) are stored and never used (D-sch-e-3, silent omission); the
real-estate-professional status is applied only to the qualifying spouse's own properties on a joint return
(D-sch-e-7, under-deduction); partnership and S corporation basis limits are not applied (D-sch-e-8); and line 41 leaves
out the K-1 royalties that Schedule 1 line 5 includes (D-sch-e-1). The §469 classification problems that show up on
Schedule E (royalties and vacation homes treated as passive, one active-participation switch, whole-pool release on a
sale) are recorded in `forms\8582.md` (D-8582-1 … D-8582-15). Already recorded elsewhere and not repeated: Form 1099-MISC
boxes 1 / 2 never read (D-8-4), K-1 ordinary income and royalties not person-filtered on single / joint returns (D-8-8),
the §469 MAGI (D-11a-3, D-1z-4), and the farm-rental findings D-4835-1 … D-4835-10.

## 2. Where the user enters it

| Sidebar | Form (id) | Question / field (label) | Saved key | Feeds |
|---|---|---|---|---|
| Incomes | Rental & royalty income (`rental-income-taxpayer` / `rental-income-spouse`) | "Did {name} have any rental real estate or royalty income in 2025?" | `hasRentalOrRoyaltyIncome` | gate (not read by compute) |
| | | "{name} qualify as a real estate professional (> 750 hours …)" | `isRealEstateProfessional` | owner's rentals nonpassive (D-sch-e-7) |
| | | "Elect the Rev. Proc. 2019-38 §199A rental safe harbor" | `claims199aRentalSafeHarbor` | QBI only |
| | | "Passive income from other activities (e.g. limited partnership K-1s)" | `otherPassiveIncome` | passive income **and** line 26 income (D-8582-8) |
| | per property: "Type" (Rental real estate / Royalty) | `propertyType` (`RENTAL_REAL_ESTATE` / `ROYALTY`) | line 1b code 1 or 6 |
| | "Description / address" | `propertyDescription` | line 1a |
| | "Community share of this property (%)" (MFS community property) | `communityPct` | MFS split |
| | "Rents received" / "Royalties received" | `rentsReceived` / `royaltiesReceived` | lines 3 / 4 |
| | lease bonus / advance royalties, mineral basis, expected royalties, units, lease ended, prior depletion to restore | `leaseBonusAndAdvanceRoyalties`, `advanceRoyalties`, `mineralAdjustedBasis`, `royaltiesExpectedOverLease`, `unitsPaidForInYear`, `unitsRemainingEndOfYear`, `leaseEndedWithoutProduction`, `priorDepletionToRestore` | royalty depletion |
| | "Advertising (line 5)" … "Utilities (line 17)", "Other expenses (line 19)" | `advertising` … `utilities`, `otherOperatingExpenses` (legacy `mortgageInterestAndPropertyTaxes`) | lines 5–17, 19 |
| | "Which Form 1098 is for this property?" / "Share of that Form 1098 for this property (%)" | `form1098EntryId`, `form1098SharePct` | line 12 when blank (V385) |
| | "Depreciation (from your Form 4562)" / "Depletion …" | `depreciationAmount`, `depletionAmount` (+ AMT fields) | line 18 |
| | "Days rented at fair value" / "Days of personal use" | `rentalDays`, `personalUseDays` | line 2, §280A |
| | "How did you enter the expenses above?" (rental share only / whole-year totals) | `expensesEnteredAs` (`RENTAL_SHARE` / `ANNUAL_TOTALS`) | split by days |
| | "Operating expenses / Depreciation carried over from 2024 (Pub. 527 Worksheet 5-1 …)" | `priorYearVacationOperatingCarryover`, `priorYearVacationDepreciationCarryover` | vacation-home limit |
| | "Rented below market value" | `isBelowMarketRental` | §280A |
| | "Actively participate (management decisions) — eligible for the $25,000 loss allowance" | `activeParticipation` | Form 8582 |
| | "What kind of rental is this?" (long-term / 7 days / 30 days with services / extraordinary / other) | `rentalActivityType` | rental-activity exceptions |
| | "Did {name} materially participate in this rental …?" | `materialParticipation` | nonpassive test |
| | "Amount at risk (cash invested + recourse debt) — leave blank if fully at risk" | `amountAtRisk` | Form 6198 (label: D-6198-4) |
| | "Prior-year at-risk loss carried over (Form 6198)" | `priorYearAtRiskCarryforward` (property) | Form 6198 |
| | "Prior-year suspended passive loss carried into 2025" / "AMT version …" | `priorYearSuspendedPassiveLoss`, `priorYearAmtSuspendedPassiveLoss` | Form 8582 line 1c |
| | "Sold / fully disposed of this property in 2025" / "Was the buyer related …?" | `fullyDisposedInCurrentYear`, `soldToRelatedParty` | §469(g) release |
| Deductions | Suspended passive losses (K-1) (`passive-activity-carryforward-*`) | "Total prior-year suspended passive loss from K-1s"; "Is any of your investment in these passive K-1 activities NOT at risk?" / "Total amount at risk …" | `priorYearSuspendedPassiveLoss`, `someK1InvestmentNotAtRisk`, `k1AmountAtRisk` | Form 8582 / 6198 |
| Statements | Schedule K-1 (Form 1065) (`schedule-k1-1065`) | box 1, 2, 3, 7; item K1 recourse / QNR ending; item L capital contributed; "Did you materially participate in this business activity?"; box a recipient TIN | `part3Line1OrdinaryBusinessIncomeLoss`, `part3Line2NetRentalRealEstateIncomeLoss`, `part3Line3OtherNetRentalIncomeLoss`, `part3Line7Royalties`, `part2K1RecourseEnding`, `part2K1QualifiedNonrecourseFinancingEnding`, `part2LCapitalContributedDuringYear`, `materiallyParticipatedInActivity`, `recipientTIN` | Part II, line 4 (royalties) |
| | Schedule K-1 (Form 1120-S) | box 1, 2, 3, 6 (royalties) | `part3Line1…`, `part3Line2…`, `part3Line3…`, `part3Line6Royalties` | Part II |
| | Schedule K-1 (Form 1041) | box 6 ordinary business | `part3Line6OrdinaryBusinessIncome` | Part II line 32 (D-sch-e-2) |
| | | boxes 5, 7, 8 | `part3Line5OtherPortfolioAndNonbusinessIncome`, `part3Line7NetRentalRealEstateIncome`, `part3Line8OtherRentalIncome` | **not read** (D-sch-e-3) |
| | Form 1098 | box 1, box 6 | `mortgageInterestReceivedAmount`, `pointsPaidOnPurchaseAmount` | line 12 via the link |

UI sources: `RI-UI:100-445` (template), `:482-505` (rental types and expense labels), `:576-592` (Forms 1098 list);
`us-tax-ui/src/app/forms/form-passive-activity-carryforward.component.ts:47-89`;
`us-tax-ui/src/app/forms/form-schedule-k1-1065.component.ts:33-38`; sidebar `us-tax-ui/src/app/shell/shell.component.ts:885-886`
(Incomes), `:941-942` (Deductions), `:1812` (Schedule E preview). The rental form exists for the taxpayer and spouse
tabs only; K-1 statements can be entered on any tab (person filter: D-8-8). Not asked anywhere: Schedule E lines A / B,
the property type codes 2–5, 7, 8, QJV, line 27 items (PYA / UPE), K-1 basis, REMIC Schedule Q, 10% ownership for
active participation, the real-estate-professional aggregation election.

## 3. Where it is stored

| Data | Id | Entity / table | Columns |
|---|---|---|---|
| Rental form | personal `rental-income-taxpayer` / `-spouse` | `PfRentalIncome` / `pf_rental_income` (row per `uid`, `owner_role`, `tax_year`) | `has_rental_or_royalty_income`, `is_real_estate_professional`, `claims_199a_rental_safe_harbor`, `other_passive_income`, `prior_year_at_risk_carryforward` |
| Property | child | `PfRentalProperty` / `pf_rental_property` | one column per field in §2, incl. `form1098_entry_id`, `form1098_share_pct` (V385) |
| K-1 companion | personal `passive-activity-carryforward-*` | `PfPassiveActivityCarryforward` / `pf_passive_activity_carryforward` | `has_passive_activity_carryforward`, `prior_year_suspended_passive_loss`, `some_k1_investment_not_at_risk`, `k1_amount_at_risk` |
| K-1s | statements | `se_schedule_k1_1065`, `se_schedule_k1_1120s`, `se_schedule_k1_1041` | see §2 |

Mapper: `us-tax-be/src/main/java/com/ustax/microservices/personal/RentalIncomeMapper.java:32-214`; registered in
`us-tax-be/.../microservices/PersonalResource.java:60-69`. Liquibase: `V117__pf_rental_income.sql`,
`V118__pf_rental_passive_at_risk.sql`, `V147`, `V153` (granular lines), `V193`, `V198`, `V213`, `V260`, `V261`,
`V273`–`V278`, `V371`, `V385__form1098_rental_link_and_5329_lines_12_20.sql`; output `V152__out_schedule_e.sql`.

## 4. How it is computed

Methods:

- Pre-processing: whole-year totals split by days `applyRentalAnnualTotalsSplit` `TRCS:31732-31818` (called `TRCS:2621`);
  Form 1098 → line 12 `Form1098RentalLink.apply` (`us-tax-be/.../microservices/Form1098RentalLink.java:35-89`, called
  `TRCS:3550-3560`); MFS community split `CommunityProperty.shareRentals` (`TRCS:3874`).
- Part I + §465 + §469: `computeRentalScheduleE` `TRCS:30490-31256` (call `TRCS:3907-3925`).
- K-1: nonpassive box 1 `sumK1OrdinaryBusinessIncome` `TRCS:31498-31525` (partnership at-risk cap `TRCS:31534-31544`);
  passive box 1 `sumPassiveK1OrdinaryNet` `TRCS:31551`; boxes 2 / 3 `sumPassiveK1RentalNet` `TRCS:31484-31496`;
  royalties `k1PortfolioRoyalties` `TRCS:36110-36123` (called `TRCS:3724-3726`); MFS filter `TRCS:3831-3834`.
- Schedule 1 line 5: `computeOtherIncomes` `TRCS:32268-32279`.
- Schedule E output: `computeScheduleEOutput` `TRCS:31383-31455` (called `TRCS:7626-7629`); line 42
  `Form2210FGrossIncome.scheduleELine42`.

Steps, following `new_lines/forms/schedule-e.md` section 6:

1. **Lines A, B, 1a, 1b, 2.** Lines A / B are not asked. Line 1a is the free-text description. Line 1b is written as
   "1" for every rental and "6" for royalties (`TRCS:31416`). Line 2's days drive the §280A tests below but are not
   printed; there is no QJV box (D-sch-e-4).
2. **Days tests (line 2).** A rental with personal use above the greater of 14 days or 10% of `rentalDays`
   (`isSection280APersonalResidence`, `TRCS:31869-31875`, "more than" as the IRS says) and fewer than 15 rental days is
   skipped entirely, with the advisory `RENTAL_UNDER_15_DAYS_INTEREST_AND_TAXES_NOT_DEDUCTED` when it carried interest
   or taxes (`TRCS:30651-30671`). With `expensesEnteredAs = ANNUAL_TOTALS` the expense fields are reduced to
   rental days / (rental + personal days) and the personal taxes (and qualifying interest) are added to Schedule A
   (`TRCS:31756-31809`). The Form 1098 link fills line 12 **after** this split, so a linked 1098 is never divided by
   days (D-sch-e-5).
3. **Lines 3–4.** Rents (`rentsReceived`) plus Form 4797 Part IV recapture of the property's listed property
   (`TRCS:30776-30785`); royalties (`royaltiesReceived`) plus restored depletion (`TRCS:30683-30723`). K-1 royalties
   are **not** put on line 4 (D-sch-e-1). Form 1099-MISC boxes 1 / 2 are not read (D-8-4).
4. **Lines 5–19.** `rentalExpenseBreakdown` (`TRCS:30337-30360`): granular lines 5–17 + line 19; tier 1 = lines 12, 13,
   16 (interest and taxes), tier 2 = the rest; the legacy combined field maps to line 12 when no granular field is
   filled. Line 12 comes from the linked Form 1098 box 1 × share when the typed amount is blank; a typed amount wins
   (`FORM_1098_RENTAL_INTEREST_DIFFERS`); box 6 points are left out (`FORM_1098_POINTS_ON_RENTAL`)
   (`Form1098RentalLink.java:53-80`).
5. **Line 18.** Royalty: depletion typed, else 15% of production royalties capped at the property's income before
   depletion, compared with cost depletion (`TRCS:30724-30773`). Rental: depreciation from matched depreciation assets
   (assets win over the typed figure, with an advisory), else the typed amount (`TRCS:30798-30823`).
6. **Lines 20–21.** Line 20 = tier 1 + tier 2 + line 18; line 21 = income − line 20 (`TRCS:30894`, `:30913-30922`).
   A home used as a home (or a below-market rental) follows the vacation-home order — rent, then interest and taxes,
   then operating expenses (+ carried-in operating), then depreciation (+ carried-in depreciation) — floored at 0, the
   excess carried to 2026 (`TRCS:30857-30892`); a below-market rental with no fair-rental days deducts nothing
   (`TRCS:30848-30856`). Whether Pub. 527 puts the "direct rental expenses" (advertising, agency fees) ahead of the
   limit could not be checked: Pub. 527 is not in `docs\books` (unverified).
7. **At risk (line 21 "Form 6198").** A loss is capped at `amountAtRisk`; the property's own prior-year at-risk loss is
   released up to its room (`TRCS:30897-30937`). Detail and deviations: `forms\6198.md`.
8. **Passive or not.** Royalty: nonpassive only if `materialParticipation` is Yes, otherwise **passive** (D-8582-6).
   Rental: nonpassive only if the property's **owner** is a real estate professional and did not answer No to material
   participation (`TRCS:30942-30979`) (D-sch-e-7); Pub. 925 rental-activity exceptions: nonpassive with material
   participation, else "other passive" (`TRCS:30960-31019`). A home used as a home is passive (D-8582-7).
9. **Line 22 / Form 8582.** Passive amounts are pooled with Form 4835 farm rentals, passive K-1 box 1 net, K-1 boxes 2
   and 3, and the typed "other passive income", and limited in aggregate (`TRCS:31101-31172`; `forms\8582.md`). The
   per-property line 22 printed is the at-risk-capped loss, not the Form 8582 result (D-sch-e-4).
10. **Lines 23a–26.** 23a, 23b, 23d, 23e and 24 / 25 are totals of the per-property line 3, 4, 18, 20 and line 21
    (`TRCS:31402-31434`); 23c is not written; line 25 uses line 21 losses (before Forms 6198 / 8582). **Line 26** =
    `rental.netIncome` = nonpassive total + (passive income − passive losses allowed − the farm-rental slice)
    (`TRCS:31171-31172`, `:31436-31438`) — which also contains passive K-1 income / allowed loss and the typed other
    passive income (D-sch-e-2).
11. **Part II (lines 27–32).** Line 27 is not asked. No rows on line 28. Line 32 = nonpassive K-1 ordinary income:
    1065 box 1 (loss capped at capital contributed during the year + ending recourse + QNR, `TRCS:31534-31544`,
    D-6198-1), 1120-S box 1, **and 1041 box 6** (`TRCS:31498-31525`). Line 29a gets the total when positive; 29b / 30 /
    31 are not written (`TRCS:31441-31446`). A K-1 is passive only when "materially participated" is explicitly No
    (`isPassiveK1`, `TRCS:31581-31583`); passive K-1s and boxes 2 / 3 go to the §469 pool and land in line 26
    (D-sch-e-2). Basis limits are not applied (D-sch-e-8).
12. **Part III (lines 33–37).** Not produced; 1041 box 6 is in line 32; boxes 5, 7, 8 are not read (D-sch-e-3).
13. **Part IV (lines 38–39).** No input; nothing computed (D-sch-e-6).
14. **Line 40.** `farmRentalNetForLine40` from the pool (`TRCS:31157-31167`, `:31449-31450`; `forms\4835.md`).
15. **Line 41** = line 26 + line 32 + line 40 (`TRCS:31451-31453`).
16. **Line 42** = Σ Form 4835 line 7 + K-1 farming codes (`Form2210FGrossIncome.java:102-110`). **Line 43** is not
    written (D-sch-e-4).
17. **Schedule 1 line 5** = `rentalScheduleE.netIncome` (else the typed `rentalRealEstateRoyaltiesLine5` of both
    spouses when no property, K-1 passive amount or farm rental exists) + nonpassive K-1 ordinary income **+ K-1
    royalties** + the farm-rental slice (`TRCS:4394`, `:32271-32279`). This differs from line 41 by the K-1 royalties
    (and the typed fallback) (D-sch-e-1).

## 5. Flags and advisories

| Code | Blocks? | When | Tells the user | Where |
|---|---|---|---|---|
| `RENTAL_UNDER_15_DAYS_INTEREST_AND_TAXES_NOT_DEDUCTED` | No | Home used as a home, rented 1–14 days, with interest / taxes entered | Rental not reported; move interest / taxes to Schedule A | `TRCS:30660-30669` |
| `RENTAL_EXPENSES_SPLIT_BY_DAYS` | No | Whole-year totals split | Percent used; personal taxes / interest added to Schedule A | `TRCS:31810-31816` |
| `RENTAL_VACATION_HOME_CARRYOVER_NOT_ASSIGNED` | No | Imported vacation-home carryovers with several homes | Enter each home's carryover | `TRCS:30569-30577` |
| `ROYALTY_LEASE_BONUS_EXCEEDS_ROYALTIES` / `ROYALTY_ADVANCE_ROYALTIES_EXCEED_BONUS_FIELD` | Yes | Inconsistent royalty sub-amounts | Fix the amounts | `TRCS:30691-30715` |
| `ROYALTY_DEPLETION_METHOD` | No | Cost depletion computed | Which method won; basis to carry | `TRCS:30762-30770` |
| `RENTAL_DEPRECIATION_ASSETS_OVERRIDE_ENTERED_AMOUNT` | No | Assets and a typed depreciation | Assets used | `TRCS:30812-30821` |
| `RENTAL_MATERIAL_PARTICIPATION_DOES_NOT_MAKE_NONPASSIVE` | No | Non-professional answers Yes on a long-term rental | Stays passive | `TRCS:30968-30978` |
| `RENTAL_SOLD_TO_RELATED_PARTY_LOSSES_STAY_SUSPENDED` | No | Disposed to a related buyer | Losses stay suspended | `TRCS:30980-30990` |
| `RENTAL_AT_RISK_CARRYOVER_NOT_ASSIGNED_TO_A_PROPERTY` | No | Form-level at-risk carryover with several activities | Enter per property | `TRCS:30600-30612` |
| `FORM_1098_LINK_NOT_FOUND` / `FORM_1098_RENTAL_INTEREST_DIFFERS` / `FORM_1098_POINTS_ON_RENTAL` / `FORM_1098_INTEREST_NOT_ON_SCHEDULE_A` | No | Form 1098 link issues | As named | `Form1098RentalLink.java:51-79`, `:122-128` |
| `RENTAL_MFS_LIVED_APART_ALL_YEAR_UNANSWERED` | Yes (overrideable) | MFS, residence unanswered, suspended loss, MAGI < $75,000, an active-participation **rental property** (not a farm rental — D-8582-15) | Answer the lived-apart question | `TRCS:3930-3941` |
| `QBI_RENTAL_SAFE_HARBOR_AUTO_INCLUDED` | No | Safe harbor elected | Included in QBI | `TRCS:4014-4024` |

## 6. What it produces

| Item | Value |
|---|---|
| Output model | `com.ustax.model.output.ScheduleE` — `line26TotalRentalRoyalty`, `line32TotalPartnershipScorp`, `line41TotalIncomeOrLoss`, `fields` (semantic name → whole dollars) |
| JSON path | `scheduleEDetail` (record `TaxReturnComputation`, `us-tax-be/.../microservices/TaxReturnComputation.java:172`) |
| Database | `out_schedule_e` (`line26_total_rental_royalty`, `line32_total_partnership_scorp`, `line41_total_income_or_loss`, `fields_json`) (`us-tax-be/.../output/ScheduleEOutputMapper.java:43-66`) |
| Preview | `us-tax-ui/src/app/forms/form-tax-return-schedule-e.component.ts` (pure HTML from `f1040se_elements.json`); sidebar item always shown (`shell.component.ts:1811-1813`) |
| Schedule 1 line 5 | `schedule1.additionalIncome.rentalRealEstateRoyalties` (`TRCS:32662`); carryforwards `rentalDepreciationCarryforward`, `rentalOperatingCarryforward`, `rentalPassiveLossCarryforward`, `rentalAtRiskCarryforward`, `amtPassiveLossCarryforward` (`TRCS:32663-32669`) |
| Other consumers | Form 8960 (`passiveNetForNiit` + farm + K-1 royalties, `TRCS:5526-5532`); Form 461 (nonpassive rental, `TRCS:32294-32298`); QBI safe harbor (`TRCS:3963-4013`); Form 6251 line 2m (`line2mAmtDepreciation`); EIC investment income |

## 7. Tests

Java unit tests (`us-tax-be/src/test/java/com/ustax/microservices/`):

| Test | Proves |
|---|---|
| `Hrb2025Sc00063Test`, `Hrb2025Sc00067Test` | Rental net with MACRS building depreciation; converted home basis |
| `Hrb2025Sc00066Test`, `RoyaltyCostDepletionTest` | Royalty depletion (percentage cap, cost depletion, bonus) |
| `Hrb2025Sc00064Test`, `Hrb2025Sc00070Test`, `Hrb2025Sc00071Test`, `Hrb2025Sc00192Test` | Special allowance and phase-out; three rentals as one pool |
| `Hrb2025Sc00072Test`, `Hrb2025Sc00073Test`, `Hrb2025Sc00075Test`, `Hrb2025Sc00391Test`, `RentalActivityTypeTest` | Disposition / related buyer; passive K-1 + rental; real estate professional; 7-day exception |
| `VacationHomeCarryoverTest`, `Section280ADepreciationCarryforwardTest`, `RentalAnnualTotalsSplitTest` | Vacation-home limit and carryovers; days split |
| `Form1098RentalLinkTest` | Form 1098 → line 12 (does not combine with `ANNUAL_TOTALS` — D-sch-e-5 untested) |
| `CommunityPropertyRentalSplitTest`, `Phase7bComputeScopingTest` | MFS split and scoping |
| `CarryforwardBridgesV261Test`, `Hrb2025Sc00279Test` | Passive and at-risk carryover bridges |

E2E specs (`us-tax-be/e2e/tests/`):

| Spec | Proves |
|---|---|
| `schedule-e-output.spec.ts` (3) | two rentals + nonpassive K-1 → lines 26 / 32 / 41; royalty line 18; persistence |
| `schedule-e-rental-income.spec.ts` (11) | basic net, royalty, vacation home, three properties, phase-out, at risk, disposition, real estate professional |
| `schedule-e-granular-expenses.spec.ts` (2), `rental-annual-totals-split.spec.ts` (2) | lines 5–17; days split |
| `form1098-rental-link-and-5329-lines-12-20.spec.ts` (A) | Form 1098 picked → line 12 by share |
| `rental-material-participation-no-ui.spec.ts` (3), `rental-at-risk-per-property-ui.spec.ts`, `rental-at-risk-carryforward-bridge.spec.ts` (3) | participation, at-risk carryovers |
| `mfs-spouse-rental-income.spec.ts`, `mfs-spouse-k1-income.spec.ts`, `open-questions-b123-community-rental-split.spec.ts` | MFS attribution |
| `rental-199a-safe-harbor.spec.ts`, `eic-investment-income-passive-rental.spec.ts` | QBI field round trip; EIC |

Untested: K-1 royalties against line 41 (D-sch-e-1), any 1041 K-1 box 5 / 7 / 8 (D-sch-e-3), a joint return where the
non-professional spouse owns the rental (D-sch-e-7).

## 8. Compared with the IRS rules

| # | IRS rule (source) | What the app does | Result |
|---|---|---|---|
| 1 | Line 41 = lines 26 + 32 + 37 + 39 + 40 → Schedule 1 line 5 (`f1040se.pdf p. 2`); K-1 (1065) box 7 / (1120-S) box 6 royalties → Schedule E line 4 (`i1065sk1.pdf p. 15`; `i1120ssk.pdf p. 7`) | K-1 royalties go to Schedule 1 line 5 (`TRCS:4394`) but not to line 4 / 23b / 24 / 26 / 41 (`computeScheduleEOutput` gets only `k1OrdinaryBusinessIncome`, `TRCS:7627`, `:31451`). Example: rental $5,000, K-1 royalties $2,000 → line 41 $5,000, Schedule 1 line 5 $7,000. With only K-1 royalties no Schedule E is produced at all (`TRCS:31387-31392`) | **Deviation D-sch-e-1** (printed return inconsistent; tax right; low) |
| 2 | Passive K-1 income → column (h), allowed passive loss → column (g) of line 28, total on line 32; estates and trusts on Part III line 37 (`i1040se.pdf p. 9–11`; `i8582.pdf p. 15`) | Passive K-1 box 1, boxes 2 / 3 and the typed other passive income are pooled and come out inside line 26 (`TRCS:30528-30530`, `:31171-31172`); 1041 box 6 nonpassive goes in line 32 (`TRCS:31519-31523`); no line 28 rows, 29b, 30, 31, 35–37 | **Deviation D-sch-e-2** (wrong lines; totals right; low) |
| 3 | K-1 (Form 1041) box 5 (royalties, annuities, IRD), box 7 (net rental real estate), box 8 (other rental) → Schedule E Part III (`i1041sk1.pdf p. 2`; `i1040se.pdf p. 10`) | Saved (`ScheduleK1Form1041Mapper.java:151-155`) and only touched by the community-property split (`CommunityProperty.java:593`); no compute reads them; no flag | **Not supported D-sch-e-3** (silent omission; medium) |
| 4 | Part I lines: A / B, line 1b codes, line 2 days and QJV, line 22 = loss after Form 8582 (blank for royalties), 23c, line 25 = royalty losses from line 21 + rental losses from line 22, line 43 for a real estate professional (`f1040se.pdf p. 1–2`; `i1040se.pdf p. 4–8`; `i8582.pdf p. 15`) | A / B not asked; 1b always 1 or 6; line 2 not printed; line 22 = at-risk-capped loss (also for royalties); 23c missing; line 25 from line 21; lines 24 + 25 ≠ 26 whenever a limit or a K-1 applies; line 43 empty (`TRCS:31402-31438`); typed Schedule 1 line 5 fallback produces no Schedule E | **Deviation D-sch-e-4** (preview incomplete / inconsistent; amounts that reach Schedule 1 unaffected; low) |
| 5 | Expenses of personal-use days are not rental expenses; allocate by days (`i1040se.pdf p. 5`) | Whole-year totals are split before the Form 1098 link runs (`TRCS:2621` vs `:3550`), so a linked box 1 on an `ANNUAL_TOTALS` property goes to line 12 in full; its personal part is neither removed nor sent to Schedule A. Example: 1098 $10,000, 300 rental / 60 personal days → line 12 $10,000 instead of $8,333 | **Deviation D-sch-e-5** (overstated rental interest, silent; medium-low) |
| 6 | REMIC residual interest: Part IV, columns (d) + (e) to line 39; column (c) floors taxable income (`i1040se.pdf p. 11`) | No input, no computation, no flag | **Not supported D-sch-e-6** (silent; rare; low) |
| 7 | Joint return: real estate professional if either spouse alone meets both tests; spouse's participation counts as yours (`i1040se.pdf p. 3`; `i8582.pdf p. 2, 5`) | Status applies only to properties on the qualifying spouse's own form (`TRCS:30522-30523`, `:30942-30944`); a rental entered on the other spouse's form stays passive even with material participation. Example: Ana (professional) and Ben file jointly; Ben's rental, run by both, loss $40,000, MAGI $200,000 → app allows $0 (suspended), IRS $40,000 | **Deviation D-sch-e-7** (under-deduction, silent; medium) |
| 8 | Partnership / S corporation losses limited first by basis (Form 7203; partner's basis worksheet); prior-year basis-limited losses on line 28 "PYA" (`i1040se.pdf p. 8, 10`) | No basis input or limit; S corporation and 1041 losses flow in full; no PYA line | **Not supported D-sch-e-8** (over-deduction possible, silent; medium) |
| 9 | Home used as a home rented < 15 days: not reported (`i1040se.pdf p. 5`) | Skipped, advisory (`TRCS:30651-30671`) | Match |
| 10 | Home-use test: more than the greater of 14 days or 10% of fair-rental days (`i1040se.pdf p. 5`) | `isSection280APersonalResidence` (`TRCS:31869-31875`) | Match |
| 11 | Allocate expenses by personal days (`i1040se.pdf p. 5`) | Split when `ANNUAL_TOTALS`; else the user's figures are the rental share | Match (see D-sch-e-5) |
| 12 | Line 12 from Form 1098 / financial institution; points over the loan (`i1040se.pdf p. 7`) | Link fills line 12; points left out with advisory | Match (except D-sch-e-5) |
| 13 | Lines 5–19, 20, 21 per property (`f1040se.pdf p. 1`) | Granular lines, totals, line 21 per property | Match |
| 14 | Depletion; line 18 (`i1040se.pdf p. 7`) | Percentage / cost depletion; assets or typed depreciation | Match |
| 15 | At-risk before passive (`i1040se.pdf p. 3`) | Cap before pooling | Match (detail D-6198-*) |
| 16 | Passive classification, special allowance, dispositions (`i8582.pdf`) | Shared engine | See D-8582-1 … D-8582-15 |
| 17 | Royalties are portfolio income, line 22 blank (`i1040se.pdf p. 4, 8`) | Royalty net in the passive pool unless material participation Yes | See D-8582-6 |
| 18 | Form 4835 → line 40 (`f1040se.pdf p. 2`) | `farmRentalNetForLine40` | Match (D-4835-1 for the split) |
| 19 | Line 42 reconciliation (`f1040se.pdf p. 2`) | Form 4835 line 7 + K-1 codes | Match |
| 20 | Rent and royalty Forms 1099-MISC → lines 3 / 4 (`i1040se.pdf p. 6`) | Not read | See D-8-4 |
| 21 | Only your and your spouse's K-1s (`i1040se.pdf p. 8`) | MFS filter only (`TRCS:3831-3834`) | See D-8-8 |
| 22 | MFS: each spouse's own properties (`i8582.pdf p. 4`) | Spouse form dropped on MFS unless community share (`TRCS:3909`) | Match |
| 23 | Nonpassive K-1 box 1 → column (i) / (k) after basis and at-risk (`i1065sk1.pdf p. 14`) | Line 32; partnership at-risk cap (see D-6198-1) | Match for income |

## 9. Limits and out of scope

- **Form 8990 for a rental trade or business** (`i1040se.pdf p. 7`): rental interest is not passed to Form 8990
  (`deriveBusinessInterest8990` reads Schedule C / F only); most filers meet the small-business exception (unverified
  for any particular filer).
- **Form 8873, §179D (Form 7205), barrier-removal deduction, Form 8826**: typed into line 19 by the user if wanted.
- **Personal property rentals** are not a Schedule E type (correct: Schedule C or Schedule 1 lines 8l / 24b).
- **Several Schedules E** (more than three properties): the preview prints three columns; totals include all
  properties (`TRCS:31398-31413`) — matches the IRS "attach as many Schedules E as you need" in amount.
- **Pub. 527 worksheet detail** (order of direct rental expenses) and **Pub. 925 recharacterization** cannot be checked
  against `docs\books`.

## 10. History

| Date | Entry |
|---|---|
| 2026-10-24 | `history.md`: "Form 1098 linked to a rental (Schedule E line 12); Form 5329 lines 12 and 20 asked (owner-approved fields, V385)" |
| 2026-10-21 | `history.md`: "Community property: rental properties and Form 4835 farm rentals split on MFS returns (OPEN_QUESTIONS B123)" |
| 2026-10-21 | `history.md`: "Listed property in a rental: ADS straight line, no bonus, Form 4562 line 27 (OPEN_QUESTIONS B113)" |
| 2026-10-19 | `history.md`: "Vacation-home carryovers (OPEN_QUESTIONS B58 with B57; owner-approved fields, V350)" |
| 2026-10-16 | `history.md`: rental at-risk carryover per property (A49 + B22); related buyer (A6); material participation and the 7-day exceptions (A5); royalty cost depletion (B59) and lease bonus (A2); whole-year totals split (A1) |
| 2026-10-15 | `history.md`: Round-2 QA scenarios sc_00061–00080 (rentals, royalties, passive, at risk, real estate professional) |
| 2026-07-21 | git: "Rental Schedule E: granular expense lines 5-17 (full breakout)"; "SE Stage 2 C6d tail: Schedule E output persistence (out_schedule_e)" |
| 2026-07-20 | git: "SE Stage 2 C6d: Schedule E (Form 1040) output model + data-bound preview" |
| 2026-07-14 | git: "Passive K-1 §469 routing + materiallyParticipatedInActivity field (V129)"; "K-1 statement MFS per-spouse attribution" |
| 2026-07-12 | git: "SQA↔e2e gap-closure Phases 1–6: Schedule A limits + Schedule E rental engine + K-1 routing" |
