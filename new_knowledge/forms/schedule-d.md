# Schedule D (Form 1040) — how the app does it

IRS rules: `C:\us-tax\new_lines\forms\schedule-d.md`. Flowchart: `C:\us-tax\new_flowcharts\forms\schedule-d.md`.
Paths are relative to `C:\us-tax`. `TRCS` = `us-tax-be/src/main/java/com/ustax/microservices/TaxReturnComputeService.java`.
What reaches Form 1040 line 7a (person matching, Exception 1, the carryover import, Form 8814) is in
`new_knowledge\7a.md`, whose deviations D-7a-1 … D-7a-10 are referenced here, not repeated. Form 8949 rows are in
`new_knowledge\forms\8949.md`.

---

## 1. Status

Schedule D is built in the same method as line 7a, `computeCapitalGainLoss` (`TRCS:23515`), whenever Exception 1 is
ruled out (`TRCS:24109`). Every line of Parts I–III is filled: lines 1a / 8a (direct broker totals + typed totals),
1b–3 / 8b–10 (Form 8949 totals by box), 4 / 5 / 11 / 12 (other forms and K-1s), 6 / 14 (carryovers), 13
(distributions less nominee, plus Form 8814 line 10), 7 / 15 / 16, the line 17–20 routing, line 21 (the
$3,000 / $1,500 limit) and line 22. The 28% Rate Gain Worksheet and the Unrecaptured Section 1250 Gain Worksheet are
reduced to their totals (raw sum less the loss / carryover offset); the Capital Loss Carryover Worksheet figures the
2026 carryover with the taxable-income limit; the Schedule D Tax Worksheet is implemented line by line (lines 1–47).

**6 differences from the IRS rules** (D-sch-d-1 … D-sch-d-6). Two change tax, silently:

- **D-sch-d-1:** the Unrecaptured Section 1250 Gain Worksheet does not limit Form 4797 property and partnership /
  S corporation K-1 amounts to the Form 4797 line 7 gain, nor subtract line 8 (except after a lookback change), so
  line 19 can be too high — gain taxed at up to 25% instead of 0 / 15 / 20%.
- **D-sch-d-2:** 28% Rate Gain Worksheet lines 1 and 3 (collectibles on Form 8949 Part II and on Forms 4684 / 6252 /
  6781 / 8824) are not derived; a collectibles sale is taxed at 15 / 20% unless the filer types the amount.

The other four are cosmetic (checkbox answers and line 1a / 8a use). Inherited from line 7a and also visible on
Schedule D: D-7a-1 (a dependent's sales on Form 8949 → lines 1a–10), D-7a-2, D-7a-3 and D-7a-4 (lines 6 / 13 / 14),
D-7a-5 (collectibles / ordinary boxes), D-7a-7, D-7a-8 (Schedule D produced when not required), D-7a-9 (K-1 1041
box 11 C / D on lines 5 / 12 and worksheet line 5 / 16), D-7a-10 (Form 4684 short-term gain on line 11).

## 2. Where the user enters it

There is no "Schedule D" screen; it is assembled from statements and the Capital gain/loss form (full table in
`new_knowledge\7a.md` §2). The fields that act on single Schedule D lines:

| Sidebar | Form | Label | Saved key | Schedule D line |
|---|---|---|---|---|
| Incomes | Capital gain/loss (`capital-gain-loss-taxpayer` / `-spouse`) | "Short-term sale proceeds / cost basis / adjustments … not on any broker statement" | `manualShortTermDirectAggregationProceedsLine1a`, `…BasisLine1a`, `…AdjustmentsLine1a` | 1a (D-sch-d-3) |
| | | "Long-term … not on any broker statement" | `manualLongTermDirectAggregation…Line8a` | 8a (D-sch-d-3) |
| | | "Short-term gain or loss from casualty, theft, or like-kind exchanges" | `shortTermOtherFormsGainLossLine4` | 4 |
| | | "Short-term gain or loss from a partnership or S-corp K-1" | `shortTermScheduleK1GainLossLine5` | 5 |
| | | "Long-term gain or loss from casualty, theft, or like-kind exchanges" | `longTermOtherFormsGainLossLine11` | 11 |
| | | "Long-term gain or loss from a partnership or S-corp K-1" | `longTermScheduleK1GainLossLine12` | 12 |
| | | "Other capital gain / loss adjustments" | `manualOtherCapitalGainAdjustments`, `manualOtherCapitalLossAdjustments` | 11 (net) |
| | | "Capital gain distributions not already on a 1099-DIV or 2439"; nominee amount | `manualCapitalGainDistributionsNotOnStatements`, `nomineeCapitalGainDistributionsToSubtract` | 13 |
| | | "Short-term / Long-term loss carried over from last year", "Total loss deduction taken on last year's return" + term | `priorYearCapitalLossCarryoverShortTerm`, `…LongTerm`, `priorYearScheduleDLine21AllowableLoss`, `…Term` | 6 / 14 (D-7a-4) |
| | | "Profit on collectibles … taxed at a special 28% rate" | `twentyEightPercentRateGainWorksheetAmountLine18` | 28% worksheet (added to the automatic parts) |
| | | "Profit on real estate from depreciation you previously deducted (taxed at up to 25%)" | `unrecapturedSection1250GainWorksheetAmountLine19` | §1250 worksheet |
| | | Section 1202 exclusion amount / percentage; Form 8949 code-Q rows | `section1202ExclusionAmount`, `section1202ExclusionPercentage`, `manualForm8949Transactions[]` | 28% worksheet line 2 |
| | | QOF questions, "I will file Form 8997 separately" | `hasQofDeferralOrTermination`, `qofForm8997AcknowledgedExternallyFiled` | top QOF box (D-sch-d-4) |

UI labels: `us-tax-ui/src/app/forms/form-capital-gain-loss-taxpayer.component.ts:1563-1568` (lines 1a / 8a),
`:1586-1591` (lines 4 / 5 / 11 / 12 / 18 / 19), `:1603-1606` (carryovers). Statements feeding Schedule D lines:
1099-B and 1099-DA (via Form 8949 / lines 1a / 8a), 1099-S (via property rows), 1099-DIV boxes 2a–2d, 2439 boxes
1a / 1b / 1d, K-1 (1065) 8 / 9a / 9b / 9c, K-1 (1120-S) 7 / 8a / 8b / 8c, K-1 (1041) 3 / 4a / 4b / 4c, and the
computed Forms 4797, 6252, 6781, 4684, 8824.

## 3. Where it is stored

| Data | Entity / table |
|---|---|
| Capital gain/loss form | `PfCapitalGainLoss` / `pf_capital_gain_loss` (see `new_knowledge\7a.md` §3) |
| Schedule D output | `OutScheduleD` / `out_schedule_d` (`us-tax-be/src/main/java/com/ustax/entity/OutScheduleD.java:12`), written by `us-tax-be/src/main/java/com/ustax/microservices/output/ScheduleDOutputMapper.java:123-137`, read `:162-218` |
| Next-year carryover | `out_schedule_d.next_year_short_term_capital_loss_carryover` / `…long_term…` (`ScheduleDOutputMapper.java:136-137`); read back next year by the carryover bridge (`TRCS:1139-1160`) |
| Worksheets (28%, §1250, carryover, Schedule D Tax Worksheet) | Not stored; only their results (lines 18, 19, carryovers, Form 1040 line 16) |

## 4. How it is computed

Methods: `computeCapitalGainLoss` `TRCS:23515-24288`; `computeCapitalForPerson` `TRCS:24734-24898`;
`aggregateStatementCapitalAmountsForPerson` `TRCS:25250-25505`; `buildDirectAggregationRow` /
`buildForm8949AggregateRow` `TRCS:26013-26045`; `computeCapitalLossCarryover` `TRCS:25977-26011`;
`isScheduleDTaxWorksheetRequired` `TRCS:11943-11956`; `computeScheduleDTaxWorksheet` `TRCS:12354-12413`;
`computeScheduleDTaxWorksheetExact` `TRCS:12227-12327`.

Steps, mirroring `new_lines\forms\schedule-d.md` §6:

1. **QOF question.** Yes when `hasQofDeferral` — the screening answer "deferral or termination", any Form 8949 row
   from a 1099-B / 1099-DA with the QOF box, or a statement QOF indicator (`TRCS:23865-23868`, set `:24113-24114`).
   A code-Z deferral alone also answers Yes (D-sch-d-4).
2. **Line 1a / 8a.** Sum of 1099-B / 1099-DA rows in box A or G (short) / D or J (long) with no wash-sale amount and
   no QOF box (`directScheduleDEligible`, `TRCS:24929-24931`, `:25062-25064`), plus the typed line 1a / 8a proceeds,
   basis and adjustments of both spouses (`TRCS:23716-23729`). Collectibles / Ordinary / market-discount boxes are not
   tested (D-7a-5); typed amounts labelled "not on any broker statement" land here (D-sch-d-3).
3. **Lines 1b, 2, 3, 8b, 9, 10.** Form 8949 rows that are not direct-eligible, grouped by box: A+G → 1b, B+H → 2,
   C+I → 3, D+J → 8b, E+K → 9, F+L → 10 (`TRCS:23730-23735`). Column (h) = (d) − (e) + (g) on the cent sums
   (`computeGainOrLoss`, `TRCS:26158-26166`).
4. **Line 4 / 11.** Typed amounts plus Form 6781 line 8 / 9, Form 6252 line 26 by holding period, Form 4797 line 9 (if
   > 0, to line 11), Form 4684 Section A line 15 (line 11 — D-7a-10), Form 8824 by holding period, Form 2439 box 1a
   (line 11), the section 1033 gain, and the net "other adjustments" (`TRCS:24830-24865`, `:25276-25440`, `:23757`).
5. **Line 5 / 12.** Typed amounts plus K-1 (1041) 3 / 4a, (1065) 8 / 9a, (1120-S) 7 / 8a (`TRCS:25443-25497`).
   K-1 (1041) box 11 codes C / D are not read (D-7a-9).
6. **Line 6 / 14.** Typed short / long carryover, else the imported 2024 carryover, else the typed prior line 21
   amount (D-7a-4) (`TRCS:23788-23822`, `:24794-24805`). The import runs on every return of the account (D-7a-3).
7. **Line 7 / 15 / 16.** `TRCS:23896-23915`. Line 13 = distributions − nominee (`:23895`); when Schedule D is needed
   and a Form 8814 child amount exists it is added to line 13 and lines 15 / 16 recomputed (`TRCS:24037-24044`).
8. **Line 17.** Yes when line 15 > 0 and line 16 > 0, else **No** (`TRCS:24133-24135`) — "No" is also printed when
   line 16 is zero or a loss, where the form says to skip line 17 (D-sch-d-5).
9. **Line 18 — 28% Rate Gain Worksheet.** Raw total = typed 28% amount + K-1 collectibles (1065 9b, 1120-S 8b,
   1041 4b) + Form 2439 box 1d + 1099-DIV box 2d + the taxable part of a section 1202 exclusion (`exclusion ×
   (100 − %)/%`, from the typed exclusion or the code-Q rows) (`TRCS:23771-23785`, `:23378-23399`). Worksheet lines 5
   and 6 = long-term carryover + net short-term loss; line 18 = max(0, raw − offset) (`TRCS:23928-23939`). Lines 1
   and 3 are never derived (D-sch-d-2). Filled only when line 17 is Yes (`TRCS:24144-24146`).
10. **Line 19 — Unrecaptured §1250 Gain Worksheet.** Raw total = typed amount + Form 4797 per-property
    min(line 22, line 24) − line 26g (`InstallmentSaleLink.unrecaptured`,
    `us-tax-be/src/main/java/com/ustax/microservices/InstallmentSaleLink.java:80-101`; computed properties
    `TRCS:2141-2162`) + K-1 (1065) 9c, (1120-S) 8c, (1041) 4c + Form 2439 box 1b + 1099-DIV box 2b
    (`TRCS:23786`, `:25284-25285`, `:25356-25360`, `:25443-25497`). Worksheet lines 14–17: offset =
    max(0, short-term loss + long-term carryover − 28% raw total) (`TRCS:23948-23955`). Worksheet line 7 (cap at the
    Form 4797 line 7 gain) and lines 8–9 (subtract Form 4797 line 8) are applied only through
    `InstallmentSaleLink.capUnrecaptured` when the section 1231 lookback changes line 9 (`TRCS:1747-1750`) — not when
    Form 4797 line 7 is zero or a loss, and never to the K-1 amounts (D-sch-d-1).
11. **Line 20.** Yes when line 18 and line 19 are both zero (`TRCS:24147-24149`). A Form 4952 filer is not considered
    (D-sch-d-6). The tax engine itself sends a line 4g election to the Schedule D Tax Worksheet (`TRCS:11702`), so
    only the printed answer is affected.
12. **Line 21.** Line 16 < 0: `min(|line 16|, limit)`, limit $1,500 when the filing status is "Married filing
    separately", else $3,000 (`TRCS:24025-24053`; `us-tax-be/src/main/java/com/ustax/microservices/ReferenceData.java:309-310`).
13. **Line 22.** Yes when qualified dividends > 0, else No — answered on every Schedule D (`TRCS:24165-24167`),
    including when line 20 says not to complete it (D-sch-d-5).
14. **Capital Loss Carryover Worksheet (to 2026).** When line 16 < 0: `computeCapitalLossCarryover` nets each loss
    against the other term's gain, applies the absorbed amount to the short-term loss first, then long-term
    (`TRCS:25982-26010`) — equivalent to worksheet lines 5–13. First run assumes the full limit is absorbed
    (`TRCS:24160-24163`); after line 15 is known it is re-run with taxable income = AGI − total deductions (negative
    allowed) for lines 1–4 (`TRCS:6099-6113`).
15. **Schedule D Tax Worksheet.** Chosen by the line 16 decision tree when line 18 or 19 > 0 and lines 15 and 16 > 0,
    or a Form 4952 line 4g election exists (`TRCS:11702-11706`, `:11943-11956`). Line 7 = smaller of lines 15 and 16;
    the 4g / 4e split reduces net gain first, then qualified dividends (worksheet lines 3–9); line 19 and line 18 are
    capped at the remaining net gain, §1250 first (`TRCS:12395-12412`). The exact lines 10–47 follow with the 2025
    thresholds (`TRCS:12227-12327`; `ReferenceData.java:401-412`); lines 44 / 46 use the Tax Table midpoint under
    $100,000 (`computeTaxBracket`, `TRCS:12021-12041`).
16. **Rounding.** Each Schedule D line is `roundMoney` of its cent total (`roundScheduleDRow` `TRCS:26126-26136`,
    lines `TRCS:24115-24164`), matching "include cents when adding … and round off only the total".

## 5. Flags and advisories

| Code | Blocks? | When | Where |
|---|---|---|---|
| `FORM_8997_REQUIRED_MANUAL_FILL` | Yes | QOF deferral / disposal without the "I will file Form 8997" box | `TRCS:23846-23863` |
| `PRIOR_YEAR_LINE21_CARRYOVER_TERM_UNDISCLOSED` | No | Prior line 21 amount used as a carryover without a term | `TRCS:23806-23819` |
| `SCHEDULE_D_28_RATE_TYPED_WITH_AUTOMATIC_AMOUNTS_<PERSON>` | No | Typed 28% amount beside a code-Q or box 2d amount | `TRCS:23360-23376` |
| `CAPITAL_NOMINEE_DISTRIBUTIONS_REPORTED` | No | Nominee amount subtracted from line 13 | `TRCS:23994-24001` |
| `FORM_8824_AND_FORM_4797_LINE5_BOTH_POPULATED_DOUBLE_COUNT_RISK` | No | Form 8824 and Form 4797 line 5 both filled | `TRCS:23595-23611` |
| `LINE7B_INTERNAL_INCONSISTENCY` | Yes (internal) | Exception 1 and the Schedule D object disagree | `TRCS:24265-24276` |
| `CAPITAL_ANSWERED_NO_WITH_CAPITAL_DETAIL` | Yes (overrideable) | Capital question answered No with capital detail on file | `TRCS:24099-24106` |

Upload and statement flags (`CAPITAL_STATEMENT_UPLOAD_REQUIRED`, `MISSING_UPLOADED_…`) are listed in
`new_knowledge\7a.md` §5; Form 8949 row flags in `new_knowledge\forms\8949.md` §5.

## 6. What it produces

| Item | Value |
|---|---|
| Output model | `ScheduleD` (`us-tax-be/src/main/java/com/ustax/model/output/ScheduleD.java`), rows `ScheduleDTableRow` (proceeds, basis, adjustments, gain or loss) |
| JSON path | `scheduleD` of the computed return (`TaxReturnComputation`, `us-tax-be/src/main/java/com/ustax/microservices/TaxReturnComputation.java:77`); `requirementReason` lists why Schedule D is required |
| Database | `out_schedule_d` (`ScheduleDOutputMapper.java`) |
| Preview | Schedule D tax-return preview, `us-tax-ui/src/app/forms/form-tax-return-scheduled.component.ts:133-207` (QOF box, lines 1a–22) |
| Next | Line 16 / 21 → Form 1040 line 7a (`new_knowledge\7a.md`); lines 15 / 16 / 18 / 19 → line 16 worksheets, Form 6251, Form 8615; carryovers → 2026 return |

## 7. Tests

| Test (`TaxReturnComputeServiceTest` unless named) | Proves |
|---|---|
| `computesCapitalGainLossWithScheduleDAndForm8949WhenSalesExist` (:1549), `computesScheduleDWithoutForm8949ForDirect1099BSales` (:4201) | lines 1a / 8a vs Form 8949 boxes (Exception 2) |
| `phase2A_form2439_box1aFlowsToScheduleDLine11` (:2031), `…box1dCollectiblesFlowsTo28PercentRateWorksheet` (:2052), `…box1bSection1250FlowsToUnrecaptured1250Worksheet` (:2162) | Form 2439 boxes |
| `phase2A_k1Form1065_…` (:2230), `phase2A_k1Form1120s_…` (:2253), `phase2A_k1Form1041_section1250AndCollectiblesContributeToWorksheets` (:2276) | K-1 lines 5 / 12 and worksheets |
| `phase2D_form4797_…` (:2454, :2474), `phase3_form4797_partIIILine26bSection1250FlowsToScheduleDLine19` (:3130) | Form 4797 to line 11 / 19 |
| `scheduleDLine18SkippedWhenLine15IsLossEvenIfLine16Gain` (:2111) | lines 18–20 only after line 17 Yes |
| `phase3_longTermCarryoverReducesLine19Section1250Worksheet` (:3185), `…PartiallyReducesLine19` (:3218), `…ReducesLine18CollectiblesWorksheet` (:3254), `capGainsAudit7_unrecaptured1250NotOverReducedWhenCollectiblesAbsorbCarryover` (:3358) | worksheet offsets |
| `phase3_section1202QsbsExclusionViaForm8949CodeQ` (:3288), `capGainsAudit2_section1202TaxablePortionRoutesTo28PctRateGainLine18` (:3327), `phase3_box2cNoLongerFlowsToLine18` (:3160) | 28% worksheet line 2 |
| `capGainsAudit1_scheduleDTaxWorksheetStacksSpecialGainsBelowRegularPreferential` (:3395), `capGainsAudit4_…CapsSpecialGainsAtNetCapitalGain` (:3431), `capGainsSchedDWorksheetUsesLine7aDistributionsWhenNoScheduleD` (:3457) | Schedule D Tax Worksheet |
| `capitalLossCarryoverWorksheetComputesNextYearShortAndLongTermCarryovers` (:4143) | carryover worksheet |
| `ScheduleDWithoutScreeningTest`; `Sc00329SqaScenarioTest`, `Sc00330SqaScenarioTest`, `Sc00368SqaScenarioTest`; `Hrb2025Sc00025Test` … `Sc00041Test` | B115; §1250 / 28% slices; Form 4952 4g; capital-gain scenarios |
| e2e `collectibles-28-percent-rate.spec.ts` (4) | Schedule D Tax Worksheet 25% / 28% ceilings |
| e2e `form4797-section1250-recapture.spec.ts` (2), `form4797-section1250-lookback-cap.spec.ts` (1) | line 19 from Form 4797, lookback cap |
| e2e `line7ab-capital-gain-loss.spec.ts` (12), `capital-loss-carryover-bridge.spec.ts`, `open-questions-b115-schedule-d-without-screening.spec.ts`, `open-questions-b93-28-rate-typed-advisory.spec.ts` | Schedule D end to end, carryover import, screening, typed-28% advisory |

Not tested: a Form 4797 property with unrecaptured §1250 gain when Form 4797 line 7 is a net loss, or a K-1 box 9c
without a Form 4797 gain (D-sch-d-1); a Form 8949 code-C row (D-sch-d-2); the line 17 / 20 / 22 checkboxes on a loss
year or with Form 4952 (D-sch-d-5, D-sch-d-6).

## 8. Compared with the IRS rules

| # | IRS rule (source) | What the app does | Result |
|---|---|---|---|
| 1 | Line 1a / 8a: broker-reported, basis reported, no 1f / 1g / 1h / 1i, Ordinary and QOF unchecked, no collectibles (`i1040sd.pdf p. 10`) | Box A/G/D/J rows without wash sale or QOF (`TRCS:24931`, `:25064`); collectibles / Ordinary / market discount not tested | Match except D-7a-5 |
| 2 | Lines 1a / 8a are only for broker-reported sales with no adjustments; sales not reported on a 1099-B / 1099-DA go on Form 8949 box C / F / I / L (`i1040sd.pdf p. 10`; `i8949.pdf p. 3–4`) | Typed "proceeds / basis / adjustments not on any broker statement (e.g., wash sale corrections)" are added to line 1a / 8a, including column (g) (`TRCS:23716-23729`; labels `form-capital-gain-loss-taxpayer.component.ts:1563-1568`) | **Deviation D-sch-d-3** (same tax; the return shows non-broker sales and adjustments on lines meant for matched broker totals; cosmetic) |
| 3 | Lines 1b–3, 8b–10 = Form 8949 totals by box pair (`f1040sd.pdf p. 1`) | Same grouping (`TRCS:23730-23735`) | Match |
| 4 | Lines 4, 5, 11, 12 sources (`f1040sd.pdf p. 1`) | Same, see `new_knowledge\7a.md` row 16 | Match (D-7a-9, D-7a-10) |
| 5 | Lines 6 / 14 from the Capital Loss Carryover Worksheet (`i1040sd.pdf p. 10`) | Typed / imported / line-21 fallback | D-7a-3, D-7a-4 |
| 6 | Line 13: box 2a, your share; Form 8814 line 10 (`i1040sd.pdf p. 2`; `i8814.pdf p. 4`) | Same (`TRCS:23895`, `:24037-24044`) | Match (D-7a-2 for skipped persons) |
| 7 | Lines 7, 15, 16 combinations (`f1040sd.pdf p. 1–2`) | Same (`TRCS:23896-23915`) | Match |
| 8 | QOF box: "Did you dispose of any investment(s) in a qualified opportunity fund" (`f1040sd.pdf p. 1`; `i1040sd.pdf p. 10`) | Yes also for a deferral only (screening "deferral or termination", code Z) (`TRCS:23865-23868`, `:24113`) | **Deviation D-sch-d-4** (wrong Yes; cosmetic; Form 8997 still required by flag) |
| 9 | Line 16 loss / zero: skip lines 17–20 (17–21 when zero); line 20 path: "Don't complete lines 21 and 22" (`f1040sd.pdf p. 2`) | Line 17 is answered No on a loss / zero line 16; line 22 is answered on every Schedule D (`TRCS:24133-24135`, `:24165-24167`; printed `form-tax-return-scheduled.component.ts:206-207`) | **Deviation D-sch-d-5** (extra checkbox answers; cosmetic) |
| 10 | Line 18: 28% Rate Gain Worksheet lines 1–7 (`i1040sd.pdf p. 11`) | Lines 2, 4, 5, 6 automatic; line 1 (Form 8949 Part II collectibles, code C) and line 3 (collectibles in Forms 4684 / 6252 / 6781 / 8824) only through the typed amount; no flag when a code-C row exists without one (`TRCS:23780-23785`) | **Not supported D-sch-d-2** (collectibles gain taxed at 15 / 20 % instead of up to 28 %; silent; medium) |
| 11 | 28% worksheet line 2 fractions 1, 2/3, 1/3, none (`i1040sd.pdf p. 11`) | `exclusion × (100 − %)/%` (`TRCS:23378-23399`) | Match |
| 12 | Line 19: worksheet line 7 = smaller of (Form 4797 property amounts + Form 6252 + partnership / S corporation K-1 amounts) and the Form 4797 line 7 gain; line 9 = that − Form 4797 line 8; "If you aren't reporting a gain on Form 4797, line 7, skip lines 1 through 9" (`i1040sd.pdf p. 13`) | All Form 4797 property amounts and K-1 (1065) 9c / (1120-S) 8c are added to line 19 uncapped (`TRCS:25356-25360`, `:25476`, `:25496`); the cap / line 8 subtraction only runs when the lookback changes line 9 (`TRCS:1747-1750`). Line 19 is later capped at net long-term gain in the tax worksheet (`TRCS:12407`) | **Deviation D-sch-d-1** (line 19 too high when Form 4797 line 7 is a loss / zero or smaller than the slices — that part taxed at up to 25 % instead of 0 / 15 / 20 %; silent; medium) |
| 13 | §1250 worksheet lines 10–18 (`i1040sd.pdf p. 13`) | Lines 11 (2b, 2439 1b, K-1 1041 4c) and 14–18 (`TRCS:23948-23955`); line 10 (partnership interest sale) and 12 (no-Form-4797 dispositions) only by the typed amount | Match (typed) |
| 14 | Lines 18–20 only after line 17 Yes (`f1040sd.pdf p. 2`) | Same (`TRCS:24144-24155`) | Match |
| 15 | Line 20: "Are lines 18 and 19 both zero or blank and you are not filing Form 4952?" (`f1040sd.pdf p. 2`) | Only lines 18 / 19 tested (`TRCS:24147`) | **Deviation D-sch-d-6** (line 20 "Yes" printed for a Form 4952 filer; tax unaffected — `TRCS:11702` routes a 4g election to the Schedule D Tax Worksheet, and without 4g the two worksheets give the same tax; cosmetic) |
| 16 | Line 21 = smaller of the loss and $3,000 / $1,500 (`f1040sd.pdf p. 2`) | Same (`TRCS:24025-24053`) | Match |
| 17 | 2026 carryover per the Capital Loss Carryover Worksheet with the taxable-income limit (`i1040sd.pdf p. 10, 14`) | `computeCapitalLossCarryover` + refinement (`TRCS:25982-26010`, `:6099-6113`) | Match |
| 18 | Schedule D Tax Worksheet lines 1–47 and 2025 thresholds (`i1040sd.pdf p. 15–16`) | Exact implementation (`TRCS:12227-12327`, `:12354-12413`; `ReferenceData.java:401-412`) | Match |
| 19 | Rounding: cents kept while adding, total rounded (`i1040sd.pdf p. 9`) | `roundMoney` per line on cent totals | Match |
| 20 | Joint: both spouses' totals on one Schedule D; MFS: own items, $1,500 (`i8949.pdf p. 1`; `f1040sd.pdf p. 2`) | Spouse side nulled on MFS (`TRCS:23563-23564`) | Match (person matching: D-7a-1) |

## 9. Limits and out of scope

- Form 8997 is not computed (blocked until acknowledged).
- The 28% and §1250 worksheets are not stored or printed (the IRS says keep them); only lines 18 / 19.
- Regulations section 1.1(h)-1(e) statements (sale of a partnership / S corporation / trust interest), the nominee
  statement and Form 8453 are not produced.
- Traders' mark-to-market (Form 4797 Part II) and section 1260 interest are not modelled here.

## 10. History

| Date | Entry |
|---|---|
| 2026-10-23 | history: "Form 4684 Section A figured and shown; a casualty gain reaches Schedule D" |
| 2026-10-23 | history: "Form 6781 Part I from Form 1099-B box 11 (section 1256 contracts)" |
| 2026-10-22 | history: "Form 6252 line 26 of business property goes to Form 4797, not straight to Schedule D (B37 follow-up)"; "Form 4797 Part III / Form 6252 linked …; installment unrecaptured section 1250 gain as received" (B37) |
| 2026-10-21 | history: "Schedule D / Form 8949 whenever line 7's Exception 1 is ruled out (OPEN_QUESTIONS B115)" |
| 2026-10-21 | history: "Form 8958 computed; community-property capital gains split (B108)" |
| 2026-10-20 | history: "28% rate gain: spouse help no longer causes double counts (B93)" |
| 2026-09-11 | code comment `TRCS:12269`: QA sc_00329 — Schedule D Tax Worksheet line 14 restored (special gains taxed at ordinary rates below the 24% bracket) |
| 2026-08-04 | code comments: "Schedule D audit (C2)" — lines 18–20 only after line 17 Yes (`TRCS:24136`); Form 4952 4g split in the Schedule D Tax Worksheet (`TRCS:12395`) |
| 2026-07-30 | code comments: "17 cap-gains audit" #1 (exact Schedule D Tax Worksheet), #2 (section 1202 taxable part on line 18), #4 (caps), #5 (carryover taxable-income limit), #7 (§1250 offset) |
| 2026-06-06 | code comments: "7a.md Phase 2A–3" — statement feeders and worksheet reductions |
