# Dependencies — Lines 7a / 7b Capital Gain or (Loss)

This document covers every input and output for the lines 7a/7b computation pass.

Tax year: **2025**

---

## Line identity (2025 Form 1040)

- **Line 7a** — Capital gain or (loss). Single numeric amount. 7th operand in line 9 (IRC §61(a)(3)).
- **Line 7b** — Three derived disclosure-only outputs (DISCLOSURE ONLY — never enter line 9 arithmetic):
  - **"Schedule D not required"** checkbox (Exception 1 path)
  - **"Includes child's capital gain or (loss)"** checkbox (Form 8814 line 10 routing)
  - Entry-space for Form 8814 line 10 child amount (already counted in line 7a — entry-space is for IRS visibility only)

---

## Input personal forms

| Form ID | Firestore path | Person | Fields consumed |
|---|---|---|---|
| `capital-gain-loss-taxpayer` | `users/{uid}/capital-gain-loss-taxpayer` | Taxpayer | `hadCapitalGainOrLoss`, `hasUploadedAtLeastOneCapitalStatement`, `confirmAllReceivedCapitalStatementsUploaded`, `received1099DivWithCapitalGainDistributions`, `uploaded1099DivWithCapitalGainDistributions`, `received1099BOr1099Da`, `uploaded1099BOr1099Da`, `receivedForm2439`, `uploadedForm2439`, `receivedOtherScheduleDSourceStatements`, `uploadedOtherScheduleDSourceStatements`, `hadCapitalAssetSalesOrExchanges`, `hasQofDeferralOrTermination` (Exception 1 blocker; triggers Form 8997), `hasCapitalLossesForTaxYear` (Exception 1 blocker), `hasCapitalLossCarryoverFromPriorYear`, `hasOtherScheduleDSourceForms`, `manualCapitalGainDistributionsNotOnStatements`, `nomineeCapitalGainDistributionsToSubtract`, `confirmNomineeStatementWillBeProvided`, `manualOtherCapitalGainAdjustments`, `manualOtherCapitalLossAdjustments`, `shortTermOtherFormsGainLossLine4`, `shortTermScheduleK1GainLossLine5`, `longTermOtherFormsGainLossLine11`, `longTermScheduleK1GainLossLine12`, `twentyEightPercentRateGainWorksheetAmountLine18`, `unrecapturedSection1250GainWorksheetAmountLine19`, `nonbusinessBadDebtFaceAmount` (§166 Box C Form 8949 transaction — Phase 2), `nonbusinessBadDebtDescription`, `priorYearCapitalLossCarryoverShortTerm`, `priorYearCapitalLossCarryoverLongTerm`, `priorYearScheduleDLine21AllowableLoss`, `importedPriorYearCapitalLossCarryoverShortTerm`, `importedPriorYearCapitalLossCarryoverLongTerm`, `importedPriorYearCapitalLossCarryoverTotal`, `manualShortTermDirectAggregationProceedsLine1a`, `manualShortTermDirectAggregationBasisLine1a`, `manualShortTermDirectAggregationAdjustmentsLine1a`, `manualLongTermDirectAggregationProceedsLine8a`, `manualLongTermDirectAggregationBasisLine8a`, `manualLongTermDirectAggregationAdjustmentsLine8a`, `manualForm8949Transactions[]`. **Note:** `hasForm2439UndistributedCapitalGains` and `hasAny1099DivBoxes2b2c2dAmounts` are intentionally absent on the taxpayer form — auto-detected from uploaded statements. |
| `capital-gain-loss-spouse` | `users/{uid}/capital-gain-loss-spouse` | Spouse (MFJ only) | Same fields as taxpayer form, plus two manual-override booleans: `hasForm2439UndistributedCapitalGains` (fallback when Form 2439 not uploaded), `hasAny1099DivBoxes2b2c2dAmounts` (fallback when 1099-DIV box 2b/2c/2d not uploaded). Both OR'd with statement-derived detection. Null-shadowed on MFS. |
| `filing-status` | `users/{uid}/filing-status` | Return-level | `filingStatus` — MFS → lossLimit = $1,500; all others → $3,000 (IRC §1211(b)) |
| `identification-taxpayer` | `users/{uid}/identification-taxpayer` | Taxpayer | `ssn` — TIN matching for 1099-B / 1099-DA / 1099-DIV attribution |
| `identification-spouse` | `users/{uid}/identification-spouse` | Spouse | `ssn` — TIN matching (null-shadowed on MFS) |

---

## Input statement forms

| Statement type | Firestore collection | TIN field | Fields consumed → routing |
|---|---|---|---|
| 1099-DIV | `users/{uid}/1099-div` | `recipientTIN` | `totalCapitalGainDistributionsAmount` (box 2a → line 7a direct under Exception 1 OR Sched D line 13); `unrecapturedSection1250GainAmount` (box 2b → Sched D line 19 — blocks Exception 1); `section1202GainAmount` (box 2c → Sched D line 18 — blocks Exception 1); `collectibles28PercentGainAmount` (box 2d → Sched D line 18 — blocks Exception 1) |
| 1099-B | `users/{uid}/1099-b` | `recipientTIN` | `applicableCheckboxOnForm8949` (box A–F override), `shortTerm`, `longTerm`, `basisReportedToIRS`, `proceedsAmount`, `costOrOtherBasisAmount`, `washSaleLossDisallowedAmount` (forces Form 8949 with code W), `proceedsFromQOF` (Exception 1 blocker; triggers Form 8997), `descriptionOfProperty`, `dateAcquired`, `dateSoldOrDisposed`, `accountNumber` |
| 1099-DA | `users/{uid}/1099-da` | `copyA_recipient_tin` | `copyA_box6_short_term`, `copyA_box6_long_term`, `copyA_box2_basis_reported_to_irs`, `copyA_box1f_proceeds`, `copyA_box1g_cost_or_other_basis`, `copyA_box1i_wash_sale_loss_disallowed` (forces Form 8949 code W), `copyA_box3b_qof` (Exception 1 blocker), `copyA_box1d_date_acquired`, `copyA_box1e_date_sold_or_disposed`, `copyA_box1a_code_for_digital_asset`, `copyA_box1b_name_of_digital_asset`, `copyA_box1c_number_of_units` |
| Form 2439 | `users/{uid}/form-2439` | — | Entries → `hasForm2439FromStatements` → forces Schedule D; amounts NOT auto-parsed (user enters via supplemental line inputs) |
| Form 6252 | `users/{uid}/form-6252` | — | Entries → `hasOtherScheduleDSourcesFromStatements` → forces Schedule D; amounts NOT auto-parsed |
| Form 4797 | `users/{uid}/form-4797` | — | Same as 6252 (Part I ordinary capital gain) |
| Form 4684 | `users/{uid}/form-4684` | — | Same as 6252 (casualty/theft capital gain) |
| Form 6781 | `users/{uid}/form-6781` | — | Same as 6252 (section 1256 contracts) |
| Form 8824 | `users/{uid}/form-8824` | — | Same as 6252 (like-kind exchange) |
| Schedule K-1 (1041) | `users/{uid}/schedule-k1-form-1041` | — | Entries → `hasOtherScheduleDSourcesFromStatements`; amounts via user-entered personal form fields |
| Schedule K-1 (1065) | `users/{uid}/schedule-k1-form-1065` | — | Same |
| Schedule K-1 (1120-S) | `users/{uid}/schedule-k1-form-1120-s` | — | Same |
| 1099-S | `users/{uid}/1099-s` | — | Phase 2 advisory only — emits non-blocking `FORM_1099S_REAL_ESTATE_REPORTED` flag; §121 exclusion + auto-entry deferred |
| child-interest-dividends | `users/{uid}/child-interest-dividends` | per-child SSN | `line3CapGainDistributions` → Form 8814 line 10 → `form8814Line10Total` passed to `computeCapitalGainLoss()` |

---

## Computed inputs from other passes

| Source | Pass / Method | Role in 7a/7b computation |
|---|---|---|
| Form 8814 `line10CapGainDistributions` | `computeChildInterestDividends()` (runs before `computeCapitalGainLoss()`) | Passed as `form8814Line10Total`; routed via dual-path: direct to line 7a under Exception 1 OR through Schedule D line 13 when Schedule D required. Sets `line7bIncludesChildCapitalGainLoss = true` and populates entry-space `line7bChildAmountFromForm8814Line10`. |
| `filingStatus` | `filing-status` personal form | MFS → lossLimit = $1,500; all others → $3,000 (IRC §1211(b)); hard-coded inline at `TaxReturnComputeService.java` ~6604 |
| `you.ssn`, `spouse.ssn` | `identification-taxpayer`, `identification-spouse` | TIN matching for 1099-B / 1099-DA / 1099-DIV attribution |

---

## Exception 1 — 8-condition AND gate (no Schedule D required)

Implemented as a more conservative 8-condition AND gate at `TaxReturnComputeService.java` ~6610-6636 (spec's nominal rule is 4-condition). All 8 must hold:

1. `!hasQofDeferral` — no QOF activity (Phase 2 blocker; triggers Form 8997 generation)
2. `noCapitalLosses` — only gains allowed
3. `onlyCapitalGainsAreBox2aDistributions` — no 1099-B / 1099-DA gain
4. No 1099-DIV box 2b unrecaptured §1250 gain
5. No 1099-DIV box 2c §1202 gain
6. No 1099-DIV box 2d collectibles 28%-rate gain
7. No Form 2439 / 6252 / 4797 Part I / 4684 / 6781 / 8824 amounts
8. No K-1 capital items AND no prior-year capital loss carryover

---

## Output JSON fields

| JSON path | Java class / field | Meaning |
|---|---|---|
| `form1040.income.capitalGainLoss` | `Income.capitalGainLoss` | Line 7a — positive = gain; negative = limited loss (after IRC §1211(b) cap); enters line 9 |
| `form1040.income.line7bScheduleDNotRequired` | `Income.line7bScheduleDNotRequired` | Line 7b checkbox 1 — Exception 1 path TRUE/FALSE |
| `form1040.income.line7bIncludesChildCapitalGainLoss` | `Income.line7bIncludesChildCapitalGainLoss` | Line 7b checkbox 2 — `form8814Line10Total > 0` |
| `form1040.income.line7bChildAmountFromForm8814Line10` | `Income.line7bChildAmountFromForm8814Line10` | Line 7b entry-space — Form 8814 line 10 amount (DISCLOSURE only; double-count-prevention pattern — already in line 7a) |
| `scheduleD` | `TaxReturnComputation.scheduleD` | Full Schedule D (lines 1a–22, QOF checkbox, next-year carryover split, requirement metadata) |
| `form8949` | `TaxReturnComputation.form8949` | Full Form 8949 (pages grouped by box A–L, 11 transactions/page) |
| `form8997` | `TaxReturnComputation.form8997` | `RequiredAttachmentForm` — produced when `hasQofDeferral=true` on taxpayer OR spouse (Phase 2) |
| `form2439`, `form6252`, `form4797`, `form4684`, `form6781`, `form8824`, `scheduleK1Capital` | `RequiredAttachmentForm` stubs (Phase 1) | Produced when corresponding statement entries exist |

### Schedule D output fields (`ScheduleD.java`)

| Field | Schedule D Line | Formula / Source |
|---|---|---|
| `qualifiedOpportunityFundDisposedYes/No` | QOF checkbox | `hasQofDeferral` |
| `line1a` | 1a | Box A/G direct aggregation (basis reported, no adjustment) |
| `line1b` | 1b | Box A/G Form 8949 aggregate |
| `line2` | 2 | Box B/H Form 8949 aggregate |
| `line3` | 3 | Box C/I Form 8949 aggregate (includes nonbusiness bad debt §166 from Phase 2) |
| `line4ShortTermOtherFormsGainLoss` | 4 | User-entered (Form 4797/4684/6781 etc. short-term) |
| `line5ShortTermScheduleK1GainLoss` | 5 | User-entered K-1 short-term |
| `line6ShortTermCapitalLossCarryover` | 6 | Prior-year short-term carryover (absolute value stored) |
| `line7NetShortTermCapitalGainOrLoss` | 7 | Sum lines 1a+1b+2+3+4+5−6 |
| `line8a` | 8a | Box D/J direct aggregation |
| `line8b` | 8b | Box D/J Form 8949 aggregate |
| `line9` | 9 | Box E/K Form 8949 aggregate |
| `line10` | 10 | Box F/L Form 8949 aggregate |
| `line11LongTermOtherFormsGainLoss` | 11 | User-entered (long-term feeders + legacy adjustments) |
| `line12LongTermScheduleK1GainLoss` | 12 | User-entered K-1 long-term |
| `line13CapitalGainDistributions` | 13 | 1099-DIV box 2a total − nominee + **Form 8814 line 10** (when Schedule D required — Phase 1 dual-path fix) |
| `line14LongTermCapitalLossCarryover` | 14 | Prior-year long-term carryover (absolute value stored) |
| `line15NetLongTermCapitalGainOrLoss` | 15 | Sum lines 8a+8b+9+10+11+12+13−14 |
| `line16NetCapitalGainOrLoss` | 16 | line7 + line15 |
| `line17BothLines15And16AreGainsYes/No` | 17 | lines 15 and 16 both > 0 |
| `line18TwentyEightPercentRateGain` | 18 | box2c + box2d + user worksheet (auto-derivation DEFERRED) |
| `line19UnrecapturedSection1250Gain` | 19 | box2b + user worksheet (auto-derivation DEFERRED) |
| `line20QualifiedDividendsAndCapitalGainWorksheetYes/No` | 20 | line18=0 AND line19=0 |
| `line21AllowedCapitalLoss` | 21 | `min(|line16|, lossLimit)` when line16 < 0; lossLimit = $1,500 MFS else $3,000 |
| `line22QualifiedDividendsYes/No` | 22 | qualifiedDividends > 0 |
| `nextYearShortTermCapitalLossCarryover` | (next year) | `computeCapitalLossCarryover(line7, line15, line21)` (Phase 2) |
| `nextYearLongTermCapitalLossCarryover` | (next year) | Same |

---

## Downstream consumers

| Consumer | Line / Form | Input used |
|---|---|---|
| Form 1040 line 9 total income | `computeTotalIncome()` | `capitalGainLoss` (line 7a) — 7th operand |
| Social Security worksheet line 3 | `computeSocialSecurityBenefits()` | `line7a` passed from `prepare()` |
| Line 16 tax decision tree | `computeLine16()` | `scheduleD` → routes to Schedule D Tax Worksheet OR QDCG Worksheet (preferential 0%/15%/20% rates) |
| Form 6251 (AMT) | `buildForm6251()` | `scheduleD.line18` / `line19` for AMT rate-gain preferences; **Form 6251 AMT line 2k** explicitly consumes Schedule D cap-gain data |
| Schedule 8812 earned-income test | `computeForm8812()` | NOT line 7a (capital gain is unearned) |
| PDF export — Form 1040 | `f1040_field_mapping_semantic.csv` | `line7a_capital_gain_or_loss` (`f1_70[0]`), `line7b_schedule_d_not_required` (`c1_43[0]`), `line7b_includes_child_capital_gain_loss` (`c1_44[0]`), `line7b_child_amount_from_form8814_line10` (`f1_71[0]`) — all canonical, no `unmapped_*` parallel to 6c/6d bug |
| PDF export — Schedule D | `f1040sd_field_mapping_semantic.csv` | All Schedule D line fields |
| PDF export — Form 8949 | `f8949_field_mapping_semantic.csv` | All Form 8949 page/transaction fields |

---

## Blocking flags emitted

| Flag code | Severity | Condition |
|---|---|---|
| `CAPITAL_STATEMENT_UPLOAD_REQUIRED` | BLOCKING | `hadAnyCapital=true` AND (`!hasUploadedAtLeastOneCapitalStatement` OR `!confirmAllReceivedCapitalStatementsUploaded`) |
| `MISSING_UPLOADED_1099_DIV_CAPITAL` | BLOCKING | `received1099DivWithCapitalGainDistributions=true` AND (`!uploaded1099DivWithCapitalGainDistributions` OR no 1099-DIV entries with capital gain amounts) |
| `CAPITAL_NOMINEE_DISTRIBUTIONS_REPORTED` | ADVISORY | `nomineeAdjustments > 0` (Phase 1) |
| `FORM_1099S_REAL_ESTATE_REPORTED` | ADVISORY | 1099-S entries present (Phase 2) |

---

## Compute order dependency

`computeCapitalGainLoss()` must run **after:**
- `computeChildInterestDividends()` — Form 8814 `line10Total` passed in
- Identification forms loaded — SSNs needed for TIN matching

`computeCapitalGainLoss()` must run **before:**
- `computeSocialSecurityBenefits()` — line 7a feeds SS worksheet line 3
- `buildIncome()` → `computeTotalIncome()` — line 9 = ... + line7a + ...
- `computeLine16()` — Schedule D used for tax worksheet routing (QDCG vs Schedule D Tax Worksheet)
- `buildForm6251()` — Schedule D line 18/19 used for AMT preferences

---

## Key backend locations (TaxReturnComputeService.java, 2026-06-14)

| Item | Line |
|---|---|
| Orchestrator entry — `computeCapitalGainLoss` | 10923 |
| Call site (from main pipeline) | 523 |
| Per-person aggregator — `computeCapitalForPerson` | 11972 |
| Carryover worksheet — `computeCapitalLossCarryover` | 12857 |
| Capital loss cap hard-coded constants | ~6604 |
| Exception 1 8-condition AND gate | ~6610–6636 |
| Form 8814 dual-path routing breadcrumb | ~6700–6717 |
| Loss-cap breadcrumb (IRC §1211(b)) | ~6653–6671 |
| `CapitalGainLossComputation` record (line 7b derivation) | ~6811–6821 |
| Single-guard MFS cascade citation | ~6374–6396, 13348 |
| `buildIncome` Income setters for line 7a/7b | ~4324–4326 |
| `validateCapitalStatementGating()` | ~6401 |
| `buildCapitalTransactionsFrom1099B()` | ~6006 |
| `buildCapitalTransactionsFrom1099Da()` | ~6043 |
| `derive1099BBox()` / `derive1099DaBox()` | ~6268 / ~6285 |
| `isDirectScheduleDBox()` | ~6264 |
| `CapitalPersonTotals` record | ~16899 |
| `ScheduleD.java` | `src/main/java/com/ustax/model/output/ScheduleD.java` |
| `Form8949.java` / `Form8949Page.java` / `Form8949Transaction.java` | `src/main/java/com/ustax/model/output/` |

---

## Key invariants

1. **Line 7b entry-space double-count-prevention** — `line7bChildAmountFromForm8814Line10` carries the Form 8814 line 10 amount for IRS visibility, but the **child amount is ALREADY in line 7a** (Exception 1 direct OR Schedule D line 13 → line 16 → line 7a). MUST NOT be added a second time to line 9 (exclusion category C).
2. **Line 7b booleans are disclosure-only** — never enter line 9 arithmetic.
3. **Form 8814 dual-path routing** (Phase 1 fix) — child amount flows through EXACTLY ONE path:
   - Exception 1: direct add to line 7a;
   - Schedule D required: Schedule D line 13 → line 16 → line 7a (no separate add).
   - Lock-in test verifies $100 parent + $60 child + Schedule D required = $460 line 7a (Schedule D line 13 = $160), NOT $520.
4. **IRC §1211(b) loss cap** — $3,000 / $1,500 MFS hard-coded inline at ~6604; stable since 1976, NOT inflation-indexed. Applied at Schedule D line 21 BEFORE flowing to line 7a.
5. **Direct Schedule D aggregation** — boxes A/D (1099-B) and G/J (1099-DA) bypass Form 8949 → Schedule D line 1a/8a only when basis reported AND no adjustments AND no wash-sale AND no QOF.
6. **Wash-sale forces Form 8949** — any wash-sale disallowance (1099-B box 1g OR 1099-DA box 1i) forces Form 8949 with adjustment code W.
7. **QOF dual effect** — `hasQofDeferral=true` BOTH blocks Exception 1 (condition #1 of 8) AND triggers Form 8997 + Schedule D QOF checkbox.
8. **MFS single-guard** — orchestrator-level shadow nulls (`capitalSpouse = null`, `spouse = null`) on MFS suppresses spouse-side capital statements, Schedule D + 8949 generation, and spouse `hasQofDeferral` (which would otherwise block Exception 1 for the taxpayer). IRC §1211(b) MFS half-cap compounds the over-taxation risk.
9. **`hasForm2439UndistributedCapitalGains` / `hasAny1099DivBoxes2b2c2dAmounts`** are intentionally on the spouse form only — auto-detected from uploaded statements on the taxpayer side. OR'd with statement-derived detection.
10. **Nominee subtraction is separate from Form 1096 compliance** — `nomineeCapitalGainDistributionsToSubtract` reduces line 7a, but the user must still file nominee Form 1099-DIV / Form 1096 outside the engine.
