# Schedule B (Form 1040) — how the app does it

IRS rules: `C:\us-tax\new_lines\forms\schedule-b.md`. Flowchart: `C:\us-tax\new_flowcharts\forms\schedule-b.md`.
The amounts on Parts I and II are computed by the line 2b and 3b code — see `C:\us-tax\new_knowledge\2b.md`,
`2a.md`, `3b.md`, `3c.md` (not repeated here); Form 8815 (line 3) is in `forms\8815.md`.
Paths are relative to `C:\us-tax`. `TRCS` = `us-tax-be/src/main/java/com/ustax/microservices/TaxReturnComputeService.java`.

---

## 1. Status

Schedule B is produced. `computeInterestIncome` decides whether it is required (a $1,500 test on line 2b and on
line 3b, plus every other IRS condition), collects the Part I and Part II payer items, and reads three Part III
answers; `buildScheduleB` turns that into the `ScheduleB` output, which the Schedule B preview draws. The amounts are
right whenever lines 2b and 3b are right.

**6 differences from the IRS rules at form level** (D-sch-b-1 … D-sch-b-6). The serious one is **D-sch-b-1**: the
Part III questions can only be answered on the taxpayer's Interest form after answering Yes to "Did you have any
interest income?". A filer with a foreign account and no interest income — or on the spouse's married-filing-
separately return, or a dependent's own return — cannot answer them: Schedule B is then either not produced at all
(foreign account alone) or printed with **"No"** in Part III for questions the user was never asked. Line 7b
(countries) is never collected (D-sch-b-3). The other four are wording or layout issues.

Amount-level deviations that show on Schedule B but belong to the lines: D-2b-1 / D-3b-1 (K-1 interest / dividends
not attributed to a person), D-2b-2 / D-3b-3 (blank-TIN statements), D-2b-6 (statement bond premium netted silently
inside the payer line and not a Schedule B trigger), D-3b-4 (no line 5 item for Form 8814 line 9 or the PFIC
subtraction, so line 5 does not foot to line 6), D-2b-5 (Form 8815 QSS thresholds, line 3).

## 2. Where the user enters it

Parts I and II have no Schedule B screen: the items come from the statements and the Interest / Dividend forms (full
tables in `2b.md` and `3b.md` section 2). Part III and the return-level Part I triggers are on the **taxpayer's**
Interest form only.

| Sidebar | Form (id) | Question / field (label) | Saved key | Feeds |
|---|---|---|---|---|
| Incomes | Interest income (`interest-income-taxpayer`) | "Did you have any interest income during the tax year?" | `hadInterestIncome` | **gate for every question below** (`form-interest-income-taxpayer.component.ts:195`) |
| | | Section "Foreign account disclosure": "I had a financial account at a foreign bank, brokerage, or investment institution at any time during 2025, or I had signature authority over such an account" (checkbox) | `hasForeignAccountForScheduleBPartIII` | line 7a question 1; Schedule B trigger |
| | | "Did aggregate value of all foreign accounts exceed $10,000 at any point during 2025?" (shown only when the box above is checked) | `hasFbarRequirement` | line 7a question 2 |
| | | "I received money or property from a foreign trust, or transferred money or property to a foreign trust" (checkbox) | `hasForeignTrustDistributionOrTransfer` | line 8; Schedule B trigger |
| | | "Did you buy a bond at more than face value, and are you reducing the reported interest…?" / "…Original Issue Discount bond…?" | `reducingInterestBelow1099ByBondPremium` / `reducingOidBelow1099ByAcquisitionPremium` | Part I trigger only |
| | | Adjustments (accrued interest, nominee, premiums, savings bond previously reported, frozen deposits), seller-financed rows, §1278(b) election, Form 8815 | see `2b.md` §2 | Part I items and triggers; line 3 |
| Incomes | Interest income (`interest-income-spouse`) | Spouse's interest questions — **no Part III questions** | — | — |
| Incomes | Dividend income (`dividend-income-taxpayer` / `-spouse`) | Nominee dividends | `hasNomineeDividends`, `nomineeOrdinaryDividends` | Part II item and trigger — **no Part III questions** |

UI: Part III section `us-tax-ui/src/app/forms/form-interest-income-taxpayer.component.ts:1009-1053`, inside the
container opened at `:195` (`model.hadInterestIncome === true && model.hasBusinessRelatedInterest !== true`). Saving
with "interest income" not Yes clears all three Part III answers (`:1871-1908`, the `hadInterestIncome !== true`
branch sets them to `null`); `hasFbarRequirement` is cleared whenever the foreign-account box is unchecked
(`:1953-1955`). Help text: `:2063-2071`. Sidebar: `us-tax-ui/src/app/shell/shell.component.ts:1596-1597` (Schedule B
preview item always listed — TEMP gate `if (true /* computation?.scheduleB */)`).

## 3. Where it is stored

| Data | Id | Entity / table | Columns |
|---|---|---|---|
| Part III answers | personal `interest-income-taxpayer` | `PfInterestIncome` / `pf_interest_income` (`us-tax-be/src/main/java/com/ustax/entity/PfInterestIncome.java:216-220`) | `has_foreign_account_for_schedule_b_part_iii`, `has_fbar_requirement`, `has_foreign_trust_distribution_or_transfer` (mapper `us-tax-be/.../microservices/personal/InterestIncomeMapper.java:108-112`, `:205-207` — the UI key spells `PartIII`, the entity field `PartIii`) |
| Computed Schedule B | output | `OutScheduleB` / `out_schedule_b` (`us-tax-be/.../entity/OutScheduleB.java:12-46`) | `header_name`, `header_ssn`, `line2_total_interest`, `line3_excludable_interest_series_ee_i`, `line4_taxable_interest`, `line6_total_ordinary_dividends`, `line7a_foreign_account_or_signature_authority`, `line7a_fbar_required`, `line8_foreign_trust_or_distribution` |
| Part I / Part II items | output children | `out_schedule_b_interest_item`, `out_schedule_b_dividend_item` (`OutScheduleBInterestItem`, `OutScheduleBDividendItem`) | `payer_name`, `amount` |

There is no column for line 7b. Mapper: `us-tax-be/.../microservices/output/ScheduleBOutputMapper.java:60-150`.

## 4. How it is computed

Methods:

- Requirement, items and Part III: `computeInterestIncome` `TRCS:18875-19160` (triggers `TRCS:19042-19101`, item
  order `TRCS:19116-19122`, result record `TRCS:19144-19160`); per-person items in `computeInterestForPerson`
  (`addScheduleBItem` calls `TRCS:19231-19439`, seller-financed `TRCS:19486`); dividend items and the dividend
  trigger in `computeDividendIncome` (`TRCS:19806-19808`, see `3b.md`).
- Assembly: `buildScheduleB` `TRCS:36163-36179`, called at `TRCS:5215`.
- Item helper: `addScheduleBItem` (skips zero / null, rounds each item to whole dollars, fallback name "Interest
  payer").

Steps, mirroring `new_lines/forms/schedule-b.md` section 6:

1. **Line 1 items.** Order: seller-financed rows of the taxpayer, then the spouse (`TRCS:19116-19117`), then each
   person's other items (`TRCS:19118-19119`), then K-1 interest items (`TRCS:19120-19122`). Per person
   (`computeInterestForPerson`): one item per 1099-INT under `payerNameAddress` (default "1099-INT Payer") at
   box 1 + box 3 **less** box 11 + box 12 (`TRCS:19231`; D-2b-6); one per 1099-OID at box 1 + box 8 less box 6 +
   box 10 (`TRCS:19260`); market discount under §1278(b) (`TRCS:19272`); "{Taxpayer|Spouse} 1099-OID Box 2 taxable
   portion" (`TRCS:19340`); hand-entered interest under its payer names (`TRCS:19348`, `:19362`); "Imputed interest -
   below-market loan (IRC 7872)" (`TRCS:19354`). The seller-financed item carries the buyer data in its label
   (`TRCS:19456-19488`). The §54A tax-credit-bond gross-up is added to line 2 (`TRCS:19008`) with **no** line 1 item
   (D-sch-b-6).
2. **Reductions.** Each hand-entered adjustment becomes its own negative item, labelled "{Taxpayer|Spouse} accrued
   interest adjustment", "… nominee interest adjustment", "… taxable bond premium adjustment", "… Treasury bond
   premium adjustment", "… OID acquisition premium adjustment", "… U.S. savings bond interest previously reported",
   "… frozen deposit interest" (`TRCS:19433-19439`). There is no subtotal row and the IRS labels ("Nominee
   Distribution", "Accrued Interest", "ABP Adjustment", "OID Adjustment") are not used (D-sch-b-6).
3. **Line 2** = `taxableBeforeExclusion` (taxpayer + spouse + §54A + K-1 items, `TRCS:18999-19014`), rounded
   (`TRCS:36171`).
4. **Line 3** = the Form 8815 line 14 applied on the second compute pass (`form8815ExclusionAppliedThisPass`,
   `TRCS:19040`; `TRCS:36172`). Blank on pass 1 and when Form 8815 is not produced.
5. **Line 4** = line 2 − line 3, floored at 0 (`TRCS:19041`, `:36173`) — the same value as Form 1040 line 2b.
6. **Line 5 items** = `dividends.scheduleBDividendItems()` (per 1099-DIV payer, hand-entered dividends, K-1 items,
   negative nominee row) — see `3b.md` §4 step 7 and D-3b-4.
7. **Line 6** = Form 1040 line 3b (`TRCS:36174`).
8. **Is Schedule B required?** `TRCS:19088-19101`: line 2b (after the exclusion) > $1,500; or accrued interest,
   nominee interest, OID adjustment (question Yes or a hand OID premium), bond-premium adjustment (question Yes or a
   hand premium), Form 8815 claimed or applied, seller-financed rows, savings bond interest previously reported,
   frozen deposits, §1278(b) election; or line 3b > $1,500 or nominee dividends (`TRCS:19806-19808`); or a Part III
   Yes. If not required, `buildScheduleB` returns null (`TRCS:36164-36166`).
9. **Part III.** `hasForeignAccount`, `hasFbarRequirement`, `hasForeignTrust` are read **only** from the
   `interest-income-taxpayer` form as `Boolean.TRUE.equals(…)` (`TRCS:19077-19079`), so an unanswered question is
   `false`, never null, and is printed as "No" (`TRCS:36175-36177`). The spouse's form is never read for them
   (pinned by `ignoresSpouseOnlyScheduleBConditionQuestionsToAvoidReturnLevelConflicts`). On a married-filing-
   separately **spouse** leg the spouse's forms are renamed to the taxpayer keys
   (`us-tax-be/.../microservices/multireturn/MfsFormScoper.java:678-679`), and the spouse's Interest form has no
   Part III fields, so all three are false. Line 7b is not modelled (D-sch-b-3).
10. **Output.** `ScheduleB` with the header of the return; persisted to `out_schedule_b` and the two item tables.

## 5. Flags and advisories

| Code | Blocks? | When | Tells the user | Where |
|---|---|---|---|---|
| `SCHEDULE_B_PAYER_NAME_MISSING` | No | Hand-entered interest or dividends without payer names | A fallback label is used on Schedule B | `TRCS:2012-2025` |
| `SELLER_FINANCED_LOAN_MISSING_REQUIRED_FIELDS_<PERSON>` | Yes | A seller-financed row lacks buyer name, address, SSN/EIN or amount | Complete the row | `TRCS:19489-19501` |
| `FORM_8815_MFS_BLOCKED`, `FORM_8815_MAGI_ABOVE_CEILING` | No | Line 3 denied | see `forms\8815.md` | `TRCS:8899-8930` |

No flag exists for: Part III unanswered while Schedule B is required, a foreign account entered with no interest
income, more items than the preview has rows, or a missing line 7b.

## 6. What it produces

| Item | Value |
|---|---|
| Output model | `ScheduleB` (`us-tax-be/src/main/java/com/ustax/model/output/ScheduleB.java:9-18`): `header`, `interestItems`, `dividendItems`, `line2TotalInterest`, `line3ExcludableInterestSeriesEeI`, `line4TaxableInterest`, `line6TotalOrdinaryDividends`, `line7aForeignAccountOrSignatureAuthority`, `line7aFbarRequired`, `line8ForeignTrustOrDistribution`; items are `ScheduleBInterestItem` (`payerName`, `amount`) |
| JSON path | `scheduleB` (top level of the computed return; null when not required) |
| Database | `out_schedule_b`, `out_schedule_b_interest_item`, `out_schedule_b_dividend_item` |
| Preview | `us-tax-ui/src/app/forms/form-tax-return-scheduleb.component.ts:180-227`: header name / SSN; **14** line 1 rows (`:185-190`) and **15** line 5 rows (`:202-207`) — items beyond are not shown (D-sch-b-5); lines 2-4 and 6; Part III Yes/No boxes from the three booleans (`:214-219`); line 7b fields always blank (`:221-225`) |
| Next | Line 4 = Form 1040 line 2b, line 6 = line 3b (computed independently, same values); line 2 is used by the Social Security worksheet carve-out (`TRCS:33986-34004`) |

## 7. Tests

Java unit tests (`us-tax-be/src/test/java/com/ustax/microservices/TaxReturnComputeServiceTest.java`):

| Test | Proves |
|---|---|
| `computesInterestIncomeLinesAndConditionalScheduleBAndForm6251` (:882) | full flow; Schedule B lines 2-4 |
| `ignoresSpouseOnlyScheduleBConditionQuestionsToAvoidReturnLevelConflicts` (:1125) | a Part III answer on the spouse form is ignored |
| `computesInterestIncomeWithoutScheduleBWhenBelowThresholdAndNoTriggers` (:1165), `requiresScheduleBWhenTaxableInterestExceedsThreshold` (:1207) | $1,500 test |
| `requiresScheduleBForForeignAccountEvenBelowThreshold` (:1243) | foreign account alone requires Schedule B (when entered on the taxpayer form) |
| `nomineeInterestBelowThresholdTriggersScheduleB` (:1317) | nominee trigger |
| `fbarFlagIsIndependentOfForeignAccountFlag` (:1353) | 7a question 2 carried separately |
| `scheduleBDividendItemsArePopulated` (:1461) | Part II items |
| `priorYearReportedSavingsBondAdjustmentReducesLine2bAndEmitsScheduleBItem` (:10192), `frozenDepositInterestAdjustmentReducesLine2bAndEmitsScheduleBItem` (:10241) | Pub. 17 conditions 4 and 6 |
| `sellerFinancedMortgageTriggersScheduleBBelowThreshold` (:46355), `sellerFinancedMortgageOnlyEmptyRowsDoesNotTriggerScheduleB` (:46492) | seller-financed trigger |

Other: `ScheduleBManualPayerNamesTest`; QA classes `Hrb2025Sc00022Test` (threshold boundary), `Sc00023` (two
payers), `Sc00150` / `Sc00163` (Schedule B feeders).

E2E (`us-tax-be/e2e/tests/`): `line2ab-interest-income.spec.ts` ("Line 2a/2b flow computes and adds Schedule B…",
"Nominee interest below $1,500 independently triggers Schedule B", "hasFbarRequirement = No keeps
line7aFbarRequired false when foreign account present", seller-financed rows first), `line3ab-dividend-income.spec.ts`
(Part II, nominee row), `open-questions-b87-schedule-b-payer-names.spec.ts` (payer names), `tax-return-output-roundtrip.spec.ts`.
Not tested: Part III for a filer without interest income, on an MFS spouse leg or a dependent's own return
(D-sch-b-1); more than 14 / 15 items (D-sch-b-5).

## 8. Compared with the IRS rules

| # | IRS rule (source) | What the app does | Result |
|---|---|---|---|
| 1 | Required if taxable interest or ordinary dividends > $1,500 (`i1040sb.pdf p. 1`) | Line 2b > 1,500 or line 3b > 1,500 (`TRCS:19088`, `:19807`) | Match |
| 2 | Required for seller-financed interest, accrued interest, OID / ABP reductions, Form 8815, nominee interest or dividends (`i1040sb.pdf p. 1`); savings bond interest reported earlier, frozen deposits (`p17.pdf p. 63`) | All are triggers (`TRCS:19089-19099`), except premium already netted by the statement (D-2b-6) | Match (see D-2b-6) |
| 3 | Required, and Part III completed, if you had a foreign account or a foreign-trust distribution / grant / transfer (`i1040sb.pdf p. 1`; `i1040gi_ty2025.pdf p. 23`); Part III completed whenever line 4 or 6 > $1,500 (form notes) | The Part III questions exist only on the taxpayer's Interest form and only after "interest income" = Yes (`form-interest-income-taxpayer.component.ts:195`, cleared at `:1871-1908`); not on the dividend forms, the spouse's form, or a dependent's own return; on an MFS spouse leg the renamed spouse form has none. Unanswered = `false` (`TRCS:19077-19079`), printed "No" (`form-tax-return-scheduleb.component.ts:214-219`). Effects: a foreign account with no interest income and dividends ≤ $1,500 → no Schedule B at all; Schedule B required by dividends, or on the spouse's MFS return / a dependent's own return → Part III answered "No" without asking. No flag | **Deviation D-sch-b-1** (wrong disclosure, silent; high) |
| 4 | Line 7a Q2: "Check the "Yes" box if you are required to file [FinCEN Form 114]" — the FinCEN instructions decide, including exceptions; Q2 is asked only "If "Yes"" to Q1 (`i1040sb.pdf p. 3`; form text) | Asked as "Did aggregate value of all foreign accounts exceed $10,000…?" (`form-interest-income-taxpayer.component.ts:1025`), so a FinCEN exception cannot be reflected; when Q1 is No, Q2 is output `false` and the preview checks Q2 "No" instead of leaving it blank (`TRCS:19078`, preview `:216-217`) | **Deviation D-sch-b-2** (cosmetic / wording; low) |
| 5 | Line 7b: list the foreign countries when FinCEN Form 114 is required; attach a statement if needed (`i1040sb.pdf p. 3`) | No input, no model field, preview fields hard-coded blank (`form-tax-return-scheduleb.component.ts:221-225`); no flag | **Not supported D-sch-b-3** (required entry left blank, silent; medium) |
| 6 | Line 8 covers a distribution from, **or being the grantor of**, or a transferor to, a foreign trust; a loan of cash or marketable securities is generally a distribution (`i1040sb.pdf p. 3`; form text) | Question asks only "received money or property from … or transferred money or property to a foreign trust" (`:1049`); a grantor of a trust existing in 2025 with no 2025 transfer, or a loan from the trust, is not prompted | **Deviation D-sch-b-4** (wrong answer possible; low) |
| 7 | More payers than entry lines: several per line or a continuation statement in the same format, totals on Schedule B (`i1040sb.pdf p. 1`) | Model keeps every item, but the preview draws only 14 interest and 15 dividend rows (`form-tax-return-scheduleb.component.ts:186`, `:203`); further items are dropped with no statement; totals still printed | **Deviation D-sch-b-5** (printed form incomplete, cosmetic; low) |
| 8 | Reductions shown under a subtotal and labelled "Nominee Distribution", "Accrued Interest", "OID Adjustment", "ABP Adjustment" (`i1040sb.pdf p. 1-2`); line 1 lists every taxable interest item so line 2 is its sum | Reductions are negative items with app labels, no subtotal (`TRCS:19433-19439`); §54A credit gross-up is in line 2 without a line 1 item (`TRCS:19008`), so line 1 does not foot to line 2 when it applies | **Deviation D-sch-b-6** (layout, cosmetic; low) |
| 9 | Seller-financed interest first with buyer's name, address, SSN (`i1040sb.pdf p. 1`) | Listed first; missing data blocks (`TRCS:19116-19117`, `:19489-19501`) | Match |
| 10 | Line 3 = Form 8815 line 14; line 4 = line 2 − line 3 → line 2b (`f1040sb.pdf`; `f8815.pdf p. 1`) | `TRCS:19040-19041`, `:36171-36173` | Match (Form 8815 itself: see `forms\8815.md`, D-2b-5) |
| 11 | Line 6 → Form 1040 line 3b; Form 8814 line 9 listed on line 5 (`i8814.pdf p. 4`) | Line 6 = line 3b; no Form 8814 item | Match / D-3b-4 |
| 12 | Joint return: Part III answered for the couple; MFS: each spouse answers for their own accounts (form text) | MFJ: one set of answers from the taxpayer form (Match). MFS head leg: taxpayer form (Match). MFS spouse leg: cannot be answered | Match / D-sch-b-1 |
| 13 | Brokerage firm listed as the payer (form margin note) | `payerNameAddress` of each statement used as the label | Match |

## 9. Limits and out of scope

- FinCEN Form 114, Form 3520 and Form 3520-A are filed outside the return and are not produced (the UI tells the
  user to file FBAR separately, `form-interest-income-taxpayer.component.ts:1038-1042`).
- Form 5471 (foreign corporation officer / owner) is not produced; Form 8938 has its own compute slice.
- The payer name printed is the statement's name-and-address text; it is not shortened.
- Deliberate design: Schedule B is null (not an empty form) when no condition applies (`TRCS:36164`).

## 10. History

| Date | Entry |
|---|---|
| 2026-10-20 | `history.md`: "Schedule B payer names for hand-entered interest and dividends (OPEN_QUESTIONS B87; owner-approved)" (git `a9906682`, 2026-10-19) |
| 2026-10-18 | `history.md`: "Round-2 QA scenarios sc_00161-00170 (… Schedule B feeders …) - no engine change" |
| 2026-10-17 | `history.md`: "Round-2 QA scenarios sc_00141-00150 (… Schedule B) + two engine fixes" |
| 2026-10-16 | git `239c53a8`: "Schedule K-1 portfolio interest now reaches Schedule B and Form 1040 line 2b" |
| 2026-06-03 | code comments `TRCS:19047-19067`: Pub. 17 conditions 4 / 6 and §1278(b) as Schedule B triggers |
| 2026-06-02 | code comments `TRCS:19082-19087`, `:19104-19114`: seller-financed trigger and "listed first" ordering |
| 2026-05-11 | code comment `TRCS:18892-18899`: Part III read from `interest-income-taxpayer` only ("return-level, not spouse-specific") |
