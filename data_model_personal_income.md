# Personal-Income Forms — Field Inventory

Phase 2b Azure SQL schema design feed. Source of truth: Angular `FormGroup`/model interfaces in `C:\us-tax\us-tax-ui\src\app\forms\form-*.component.ts`. All forms use template-driven `[(ngModel)]` against a model interface (not `FormGroup`); the TS interface is the schema.

Validators column: `R` = required (asterisk in template + validateForm); blank = optional. Most numeric fields use `p-inputNumber` (no min/max) — non-trivial constraints noted under Notes. `null` is the empty/unset value across the board.

Storage paths refer to Firestore today (`users/{uid}/personal/{formId}`); same shape will land in SQL.

Out-of-scope notes:
- Form IDs `employment-income`, `tip-income-spouse`, `medicaid-waiver-spouse`, `uncollected-ss-medicare-spouse`, `combat-pay-spouse`, etc. ship as **per-person variants**. The non-suffixed `employment-income` is a legacy single-form variant still on disk (kept in inventory; storage path different).
- Form IDs `capital-gain-loss-dependent` and `kiddie-income-dependent` **reuse the taxpayer component** via `formId` `@Input` and route through `saveDependentScopedForm` — same model shape as the taxpayer form, stored under the dependent uid scope.
- `31-other-payments` is a single household-level form (no person variant). Storage path `users/{uid}/personal/31-other-payments`.

Legend for TS type: `bool` = `boolean | null`; `num` = `number | null`; `str` = `string | null` (or `string` when always-present-empty-string); `Date` = `Date | string | null` (PrimeNG datepicker round-trip). `[T]` = FormArray of T.

---

## employment-income

Legacy single-form variant covering both filer and spouse. Storage path: `users/{uid}/personal/employment-income`.

| Field | TS type | Required | Validators | Notes |
|---|---|---|---|---|
| filerHasEmploymentIncome | bool | R | Yes/No select | Gates all filer-side fields |
| filerSubmittedW2 | bool |  | Required when filerHasEmploymentIncome=true | |
| filerHouseholdWork | bool |  | Required when filerHasEmploymentIncome=true | |
| filerHouseholdEmployeeUnderControlTest | bool |  | Required when filerHouseholdWork=true | |
| filerHouseholdReceivedW2 | bool |  | Required when control test=true | |
| filerHouseholdEmployers | [HouseholdEmployerEntry] |  | Required >=1 row when receivedW2=false | 0..N |
| spouseHasEmploymentIncome | bool | R if MFJ | Yes/No select | Shown only on joint returns |
| spouseSubmittedW2 | bool |  | Required when spouseHasEmploymentIncome=true | |
| spouseHouseholdWork | bool |  | Required when spouseHasEmploymentIncome=true | |
| spouseHouseholdEmployeeUnderControlTest | bool |  |  | |
| spouseHouseholdReceivedW2 | bool |  |  | |
| spouseHouseholdEmployers | [HouseholdEmployerEntry] |  |  | 0..N |

HouseholdEmployerEntry child shape (used by both filer + spouse arrays):

| Field | TS type | Required | Notes |
|---|---|---|---|
| employerName | str |  | optional free text |
| wages | num | R per row | row valid if empty OR wages set |

**Storage path:** `users/{uid}/personal/employment-income`

---

## employment-income-taxpayer

Per-person v2 of employment income with Form 4852 + incarceration-wage linkage. Field set differs materially from the legacy form.

| Field | TS type | Required | Validators | Notes |
|---|---|---|---|---|
| hasEmploymentIncome | bool | R | Yes/No radio | Auto-answered Yes if W-2 statements present |
| isMissingW2 | bool |  | Required when hasEmploymentIncome=true | Drives Form 4852 advisory; compute emits blocking flag if no Form 4852 exists |
| householdWork | bool |  | Required when hasEmploymentIncome=true | |
| householdEmployeeUnderControlTest | bool |  | Required when householdWork=true | false => Schedule C (out of scope) |
| householdReceivedW2 | bool |  | Required when controlTest=true | |
| householdEmployers | [HouseholdEmployerEntry] |  | >=1 row required when receivedW2=false | 0..N |
| hasInmateWages | bool |  | Asked when hasEmploymentIncome=true | Drives W-2/Form 4852 picker |
| inmateWageW2Ids | str[] |  |  | IDs of W-2 statement entries flagged as prison wages |
| inmateForm4852Indices | num[] |  |  | indices into Form 4852 forms[] flagged as prison wages |
| inmateWagesAmount | num |  | derived | sum of selected sources; persisted snapshot |

HouseholdEmployerEntry (taxpayer/spouse) — child shape:

| Field | TS type | Required | Notes |
|---|---|---|---|
| employerName | str |  | optional |
| wages | num | R per row |  |
| employerTreatedAsContractor | bool |  | if Yes => wages route to line 1g elsewhere |
| federalTaxWithheld | bool |  | only when contractor=false; Yes triggers Schedule H advisory |

**Storage path:** `users/{uid}/personal/employment-income-taxpayer`

---

## employment-income-spouse

Same shape as `employment-income-taxpayer` (identical `EmploymentIncomeModel`, identical `HouseholdEmployerEntry`). Spouse-side gating only fires when filing-status is MFJ (component reads `filing-status.filingStatus`). `inmateForm4852Indices` indexes into spouse's Form 4852.

**Storage path:** `users/{uid}/personal/employment-income-spouse`

---

## tip-income-taxpayer

Form 1040 line 1c (Form 4137 allocated/unreported tips). Storage path: `users/{uid}/personal/tip-income-taxpayer`.

| Field | TS type | Required | Validators | Notes |
|---|---|---|---|---|
| hasUnreportedTips | bool | R | Yes/No |  |
| tipsByEmployer | [TipEmployerEntry] |  | >=1 row when hasUnreportedTips=true | 0..N |

TipEmployerEntry child shape:

| Field | TS type | Notes |
|---|---|---|
| employerName | str |  |
| employerEIN | str | EIN format via TinDirective |
| totalTipsReceived | num |  |
| totalTipsReportedToEmployer | num |  |
| medicareOnlyGovernmentTips | num | gov tip indicator |
| line5Under20PerMonthTips | num |  |
| allocatedTipsW2Box8 | num | auto-filled from W-2 |
| hasAdequateRecordsUnreportedLessThanAllocated | bool |  |
| substantiatedUnreportedTipsIfLessThanAllocated | num |  |
| nonCashTipsFmv | num |  |
| rRTACompensationW2Box14 | num |  |
| rRTACompensationW2Box14Notes | str |  |
| socialSecurityWagesW2Box3 | num |  |
| socialSecurityTipsW2Box7 | num |  |
| w2AutoFilledFrom | str | UI-only, stripped on save |
| rRTAAutoFillSourceLabel | str | UI-only |
| hasGovernmentTips | boolean | UI toggle, stripped |
| hasNonCashTips | boolean | UI toggle, stripped |
| hasRrtaCompensation | boolean | UI toggle, stripped |

**Storage path:** `users/{uid}/personal/tip-income-taxpayer`

---

## tip-income-spouse

Same as tip-income-taxpayer (identical `TipIncomeModel` + `TipEmployerEntry`). Gated by MFJ.

**Storage path:** `users/{uid}/personal/tip-income-spouse`

---

## medicaid-waiver-taxpayer

Form 1040 line 1d (Notice 2014-7 qualified Medicaid waiver). Storage path: `users/{uid}/personal/medicaid-waiver-taxpayer`.

| Field | TS type | Required | Validators | Notes |
|---|---|---|---|---|
| receivedMedicaidWaiverPayments | bool | R | Yes/No | |
| includeQualifiedPaymentsInEarnedIncomeForEIC_ACTC | bool |  |  | EIC/ACTC election |
| hasTradeOrBusinessProvidingHomeCare | bool |  |  | out-of-scope if Yes |
| programName | str |  | free text |  |
| careRecipientRelationship | str |  | free text |  |
| livesWithCareRecipient | bool |  |  | |
| medicaidWaiverPayments | [MedicaidWaiverEntry] |  | rows added via statement picker | 0..N |

MedicaidWaiverEntry child shape:

| Field | TS type | Notes |
|---|---|---|
| payerName | str |  |
| payerTIN | str | TIN format |
| sourceType | str | enum-ish: source of the row (W-2 / 1099-MISC / 1099-NEC) |
| qualifiedNotice2014_7Amount | num |  |
| w2Box12CodeIIAmount | num |  |
| qualifiedAmountIncludedInW2Box1 | num |  |
| taxablePaymentsNotInW2Box1 | num |  |
| notes | str |  |

**Storage path:** `users/{uid}/personal/medicaid-waiver-taxpayer`

---

## medicaid-waiver-spouse

Same as medicaid-waiver-taxpayer (identical `MedicaidWaiverModel` + `MedicaidWaiverEntry`). Gated by MFJ.

**Storage path:** `users/{uid}/personal/medicaid-waiver-spouse`

---

## uncollected-ss-medicare-taxpayer

Form 1040 line 1g — Form 8919 uncollected wages (worker-classification disputes). Storage path: `users/{uid}/personal/uncollected-ss-medicare-taxpayer`.

| Field | TS type | Required | Validators | Notes |
|---|---|---|---|---|
| imports.totalSSWagesTipsRRTAAnd4137 | num |  | backend-populated readonly | derived total of upstream W-2/4137 SS wages |
| firms | [FirmEntry] |  | >=1 row when this form is in use | 0..N |

FirmEntry child shape:

| Field | TS type | Notes |
|---|---|---|
| firmName | str |  |
| firmFederalIdNumber | str | EIN |
| reasonCode | str | Form 8919 reason code A/C/G/H/etc. (enum) |
| irsDeterminationDate | str | ISO date string |
| received1099MiscOrNec | bool |  |
| wagesNoFicaNotW2 | num | wages not reported on W-2 |

**Storage path:** `users/{uid}/personal/uncollected-ss-medicare-taxpayer`

---

## uncollected-ss-medicare-spouse

Same shape as uncollected-ss-medicare-taxpayer (identical `UncollectedTaxModel` + `FirmEntry`). Gated by MFJ.

**Storage path:** `users/{uid}/personal/uncollected-ss-medicare-spouse`

---

## combat-pay-taxpayer

Form 1040 line 1i — combat-pay EIC/ACTC election.

| Field | TS type | Required | Validators | Notes |
|---|---|---|---|---|
| combatPayTotal | num |  | derived from W-2 box 12 code Q | snapshot stored on save; user sees but cannot edit |
| electCombatPay | bool | R | Yes/No radio | gated visible only when combatPayTotal > 0 |

**Storage path:** `users/{uid}/personal/combat-pay-taxpayer`

---

## combat-pay-spouse

Same as combat-pay-taxpayer (identical `CombatPayModel`). Gated by MFJ.

**Storage path:** `users/{uid}/personal/combat-pay-spouse`

---

## interest-income-taxpayer

Form 1040 lines 2a/2b, Schedule B Part I + Part III. Owns the return-level gates (upload check, Schedule B foreign questions).

| Field | TS type | Required | Validators | Notes |
|---|---|---|---|---|
| hasBusinessRelatedInterest | bool |  | out-of-scope screening | true => blocking |
| hadInterestIncome | bool | R | screening Yes/No | gates rest of form |
| hasUploadedAtLeastOneInterestStatement | bool |  |  | statement-upload check |
| confirmAllReceivedInterestStatementsUploaded | bool |  |  | |
| manualTaxableInterestNotOnStatements | num |  | supplemental |  |
| manualTaxExemptInterestNotOnStatements | num |  |  |  |
| taxExemptStatedInterestFrom1099OidBox2 | num |  |  | 1099-OID box 2 |
| taxablePortionFrom1099OidBox2Override | num |  |  | |
| hasInterestAdjustments | bool |  | gates adjustment fields |  |
| accruedInterestPaidAdjustment | num |  |  |  |
| nomineeInterestAdjustment | num |  |  |  |
| taxableBondPremiumAdjustmentNotInStatements | num |  |  |  |
| treasuryBondPremiumAdjustmentNotInStatements | num |  |  |  |
| taxExemptBondPremiumAdjustmentNotInStatements | num |  |  |  |
| oidAcquisitionPremiumAdjustmentNotInStatements | num |  |  |  |
| payerAlreadyReportedNetInterestOrOid | bool |  |  | |
| reducingInterestBelow1099ByBondPremium | bool |  |  | |
| reducingOidBelow1099ByAcquisitionPremium | bool |  |  | |
| claimsSavingsBondExclusionForm8815 | bool |  |  | Form 8815 election |
| savingsBondExclusionAmount | num |  |  | |
| hasForeignFinancialSituation | bool |  | Schedule B Part III gate |  |
| hasForeignAccountForScheduleBPartIII | bool |  |  |  |
| hasFbarRequirement | bool |  |  | FinCEN 114 |
| hasForeignTrustDistributionOrTransfer | bool |  |  | Form 3520 indicator |

**Storage path:** `users/{uid}/personal/interest-income-taxpayer`

---

## interest-income-spouse

Spouse-specific subset. Spouse form does NOT own return-level upload/Schedule B gates (those stay on taxpayer form).

| Field | TS type | Required | Notes |
|---|---|---|---|
| hasBusinessRelatedInterest | bool |  | out-of-scope |
| hadInterestIncome | bool | R | screening |
| manualTaxableInterestNotOnStatements | num |  |  |
| manualTaxExemptInterestNotOnStatements | num |  |  |
| taxExemptStatedInterestFrom1099OidBox2 | num |  |  |
| taxablePortionFrom1099OidBox2Override | num |  |  |
| hasInterestAdjustments | bool |  |  |
| accruedInterestPaidAdjustment | num |  |  |
| nomineeInterestAdjustment | num |  |  |
| taxableBondPremiumAdjustmentNotInStatements | num |  |  |
| treasuryBondPremiumAdjustmentNotInStatements | num |  |  |
| taxExemptBondPremiumAdjustmentNotInStatements | num |  |  |
| oidAcquisitionPremiumAdjustmentNotInStatements | num |  |  |

**Storage path:** `users/{uid}/personal/interest-income-spouse`

---

## dividend-income-taxpayer

Form 1040 lines 3a/3b, Schedule B Part II. Owns return-level upload gate.

| Field | TS type | Required | Notes |
|---|---|---|---|
| hadDividendIncome | bool | R | screening |
| hasUploadedAtLeastOne1099DivStatement | bool |  | |
| received1099Div | bool |  | |
| uploaded1099Div | bool |  | |
| confirmAllReceived1099DivUploaded | bool |  | |
| manualOrdinaryDividendsNotOnStatements | num |  | |
| manualQualifiedDividendsNotOnStatements | num |  | |
| hasNomineeDividends | bool |  | gates next two |
| nomineeOrdinaryDividends | num |  | |
| nomineeQualifiedDividends | num |  | |
| nonQualifiedFromHoldingPeriodCommon61of121 | num |  | holding period disallowance |
| nonQualifiedFromHoldingPeriodPreferred91of181 | num |  | |
| nonQualifiedFromRelatedPaymentObligationShortSale | num |  | |
| nonQualifiedPaymentsInLieu | num |  | |
| nonQualifiedSurrogateForeignCorporationDividends | num |  | |
| willIssueNominee1099DivToActualOwner | bool |  | |
| willFileNominee1096And1099DivWithIrs | bool |  | |
| hasQualifiedDividendDisallowances | bool |  | gates disallowance fields |

**Storage path:** `users/{uid}/personal/dividend-income-taxpayer`

---

## dividend-income-spouse

Spouse-specific subset (no return-level gates).

| Field | TS type | Required | Notes |
|---|---|---|---|
| hadDividendIncome | bool | R | screening |
| manualOrdinaryDividendsNotOnStatements | num |  | |
| manualQualifiedDividendsNotOnStatements | num |  | |
| hasNomineeDividends | bool |  | |
| nomineeOrdinaryDividends | num |  | |
| nomineeQualifiedDividends | num |  | |
| nonQualifiedFromHoldingPeriodCommon61of121 | num |  | |
| nonQualifiedFromHoldingPeriodPreferred91of181 | num |  | |
| nonQualifiedFromRelatedPaymentObligationShortSale | num |  | |
| nonQualifiedPaymentsInLieu | num |  | |
| nonQualifiedSurrogateForeignCorporationDividends | num |  | |
| hasQualifiedDividendDisallowances | bool |  | |

**Storage path:** `users/{uid}/personal/dividend-income-spouse`

---

## capital-gain-loss-taxpayer

Form 1040 lines 7a/7b, Schedule D, Form 8949. Owns return-level gates.

| Field | TS type | Required | Notes |
|---|---|---|---|
| hadCapitalGainOrLoss | bool | R | screening |
| hasUploadedAtLeastOneCapitalStatement | bool |  | upload gate |
| received1099DivWithCapitalGainDistributions | bool |  | |
| uploaded1099DivWithCapitalGainDistributions | bool |  | |
| received1099BOr1099Da | bool |  | |
| uploaded1099BOr1099Da | bool |  | |
| receivedForm2439 | bool |  | |
| uploadedForm2439 | bool |  | |
| receivedOtherScheduleDSourceStatements | bool |  | |
| uploadedOtherScheduleDSourceStatements | bool |  | |
| confirmAllReceivedCapitalStatementsUploaded | bool |  | |
| hadCapitalAssetSalesOrExchanges | bool |  | Schedule D trigger |
| hasQofDeferralOrTermination | bool |  | Form 8997 trigger |
| hasCapitalLossesForTaxYear | bool |  | |
| hasCapitalLossCarryoverFromPriorYear | bool |  | |
| hasForm2439UndistributedCapitalGains | bool |  | |
| hasOtherScheduleDSourceForms | bool |  | |
| hasAny1099DivBoxes2b2c2dAmounts | bool |  | |
| manualCapitalGainDistributionsNotOnStatements | num |  | |
| manualOtherCapitalGainAdjustments | num |  | |
| manualOtherCapitalLossAdjustments | num |  | |
| hasNomineeCapitalGainDistributions | bool |  | |
| nomineeCapitalGainDistributionsToSubtract | num |  | |
| confirmNomineeStatementWillBeProvided | bool |  | |
| manualShortTermDirectAggregationProceedsLine1a | num |  | Schedule D line 1a aggregation |
| manualShortTermDirectAggregationBasisLine1a | num |  | |
| manualShortTermDirectAggregationAdjustmentsLine1a | num |  | |
| manualLongTermDirectAggregationProceedsLine8a | num |  | Schedule D line 8a aggregation |
| manualLongTermDirectAggregationBasisLine8a | num |  | |
| manualLongTermDirectAggregationAdjustmentsLine8a | num |  | |
| shortTermOtherFormsGainLossLine4 | num |  | |
| shortTermScheduleK1GainLossLine5 | num |  | |
| longTermOtherFormsGainLossLine11 | num |  | |
| longTermScheduleK1GainLossLine12 | num |  | |
| twentyEightPercentRateGainWorksheetAmountLine18 | num |  | 28% rate worksheet |
| unrecapturedSection1250GainWorksheetAmountLine19 | num |  | unrec. §1250 worksheet |
| priorYearCapitalLossCarryoverShortTerm | num |  | |
| priorYearCapitalLossCarryoverLongTerm | num |  | |
| priorYearScheduleDLine21AllowableLoss | num |  | |
| manualForm8949Transactions | [CapitalGainLossTransactionEntry] |  | 0..N |

CapitalGainLossTransactionEntry child shape:

| Field | TS type | Notes |
|---|---|---|
| transactionDescription | str |  |
| transactionTerm | 'short'\|'long' | enum |
| form8949Box | str | Box A-F selector |
| dateAcquired | str | ISO date |
| dateSoldOrDisposed | str | ISO date or 'VARIOUS' |
| proceeds | num |  |
| costOrOtherBasis | num |  |
| adjustmentCode | str | Form 8949 col (f) code |
| adjustmentAmount | num |  |
| transactionNotes | str |  |

**Storage path:** `users/{uid}/personal/capital-gain-loss-taxpayer`

---

## capital-gain-loss-spouse

Spouse-side superset/refinement of the taxpayer form (separate `CapitalGainLossSpouseModel` + `CapitalGainLossSpouseTransactionEntry`). Adds uncommon-situations screening + imported-statement totals.

| Field | TS type | Required | Notes |
|---|---|---|---|
| hadCapitalGainOrLoss | bool | R | screening |
| hadCapitalAssetSalesOrExchanges | bool |  | |
| hasCapitalLossesForTaxYear | bool |  | |
| hasCapitalLossCarryoverFromPriorYear | bool |  | |
| hasForm2439UndistributedCapitalGains | bool |  | |
| hasOtherScheduleDSourceForms | bool |  | |
| hasAny1099DivBoxes2b2c2dAmounts | bool |  | |
| manualCapitalGainDistributionsNotOnStatements | num |  | |
| manualOtherCapitalGainAdjustments | num |  | |
| manualOtherCapitalLossAdjustments | num |  | |
| manualShortTermDirectAggregationProceedsLine1a | num |  | |
| manualShortTermDirectAggregationBasisLine1a | num |  | |
| manualShortTermDirectAggregationAdjustmentsLine1a | num |  | |
| manualLongTermDirectAggregationProceedsLine8a | num |  | |
| manualLongTermDirectAggregationBasisLine8a | num |  | |
| manualLongTermDirectAggregationAdjustmentsLine8a | num |  | |
| shortTermOtherFormsGainLossLine4 | num |  | |
| shortTermScheduleK1GainLossLine5 | num |  | |
| longTermOtherFormsGainLossLine11 | num |  | |
| longTermScheduleK1GainLossLine12 | num |  | |
| hasNomineeCapitalGainDistributions | bool |  | uncommon-situations gate |
| hasQofDeferralOrTermination | bool |  | uncommon-situations gate |
| hasCollectiblesOrSection1202Gain | bool |  | uncommon-situations gate |
| hasRealEstateDepreciationRecapture | bool |  | uncommon-situations gate |
| hasNonbusinessBadDebt | bool |  | uncommon-situations gate |
| nomineeCapitalGainDistributionsToSubtract | num |  | |
| confirmNomineeStatementWillBeProvided | bool |  | |
| twentyEightPercentRateGainWorksheetAmountLine18 | num |  | |
| unrecapturedSection1250GainWorksheetAmountLine19 | num |  | |
| nonbusinessBadDebtFaceAmount | num |  | |
| nonbusinessBadDebtDescription | str |  | |
| priorYearCapitalLossCarryoverShortTerm | num |  | |
| priorYearCapitalLossCarryoverLongTerm | num |  | |
| priorYearScheduleDLine21AllowableLoss | num |  | |
| manualForm8949Transactions | [CapitalGainLossSpouseTransactionEntry] |  | 0..N |
| imported1099BRecordCount | num |  | backend-populated readonly |
| imported1099DaRecordCount | num |  | backend-populated readonly |
| imported1099B1099DaNetGainOrLossTotal | num |  | backend-populated readonly |
| imported1099DivBox2aCapitalGainDistributionsTotal | num |  | backend-populated readonly |
| verifiedCapitalStatementTotals | bool |  | user confirmation of imported totals |

CapitalGainLossSpouseTransactionEntry differs from taxpayer's by: drops `form8949Box`, adds `basisReportedToIrs: 'reported' | 'not_reported' | 'no_1099b' | null` (enum). Other fields same.

**Storage path:** `users/{uid}/personal/capital-gain-loss-spouse`

---

## capital-gain-loss-dependent

Reuses `FormCapitalGainLossTaxpayerComponent` with `formId="capital-gain-loss-dependent"`. **Same `CapitalGainLossTaxpayerModel` schema as taxpayer.** Persisted under the dependent's scoped path via `saveDependentScopedForm`.

**Storage path:** `users/{uid}/dependents/{dependentId}/personal/capital-gain-loss-dependent`

---

## other-incomes-taxpayer

Form 1040 line 8 / Schedule 1 Part I (lines 1-7 + 8a-8z). Owns return-level upload gate.

| Field | TS type | Required | Notes |
|---|---|---|---|
| hadAdditionalIncomeForSchedule1 | bool | R | screening |
| hasUploadedAtLeastOneOtherIncomeStatement | bool |  | upload check |
| received1099G | bool |  | |
| uploaded1099G | bool |  | |
| received1099C | bool |  | |
| uploaded1099C | bool |  | |
| confirmAllReceivedOtherIncomeStatementsUploaded | bool |  | |
| hasScheduleCBusinessIncomeOutOfScope | bool |  | OOS gate |
| hasScheduleFFarmIncomeOutOfScope | bool |  | OOS gate |
| hasSection962CfcElection | bool |  | section 962 CFC indicator |
| form1099KPersonalItemsDisclosureAmount | num |  | personal-items deduction |
| taxableStateLocalRefundsLine1 | num |  | Sched 1 line 1 |
| alimonyReceivedLine2a | num |  | Sched 1 line 2a |
| alimonyAgreementDateLine2b | Date |  | Sched 1 line 2b (PrimeNG p-datepicker) |
| otherGainsLossesLine4 | num |  | Sched 1 line 4 (Form 4797) |
| rentalRealEstateRoyaltiesLine5 | num |  | Sched 1 line 5 (Schedule E) |
| unemploymentCompensationLine7 | num |  | Sched 1 line 7 |
| repaidUnemploymentOverpaymentIn2025 | bool |  | |
| unemploymentRepaymentAdjustment | num |  | |
| otherIncomeNetOperatingLoss8a | num |  | 8a NOL |
| otherIncomeGambling8b | num |  | 8b |
| otherIncomeCancellationOfDebt8c | num |  | 8c |
| otherIncomeForeignEarnedIncomeExclusion8d | num |  | 8d (Form 2555) |
| otherIncomeForm88538e | num |  | 8e |
| otherIncomeForm88898f | num |  | 8f |
| otherIncomeAlaskaPermanentFundDividends8g | num |  | 8g |
| otherIncomeJuryDutyPay8h | num |  | 8h |
| otherIncomePrizesAwards8i | num |  | 8i |
| otherIncomeHobbyIncome8j | num |  | 8j |
| otherIncomeStockOptions8k | num |  | 8k |
| otherIncomeRentalPersonalProperty8l | num |  | 8l |
| otherIncomeOlympicParalympic8m | num |  | 8m |
| otherIncomeSection951a8n | num |  | 8n |
| otherIncomeSection951A8o | num |  | 8o (GILTI) |
| otherIncomeSection461l8p | num |  | 8p |
| otherIncomeAbleDistributions8q | num |  | 8q |
| otherIncomeScholarships8r | num |  | 8r |
| otherIncomeNonqualifiedDeferredComp8t | num |  | 8t |
| otherIncomeWagesWhileIncarcerated8u | num |  | 8u |
| otherIncomeDigitalAssets8v | num |  | 8v |
| otherIncomeItems8z | [OtherIncomeItem] |  | 0..N free-text rows |

OtherIncomeItem child shape: `{ description: str, amount: num }`.

**Storage path:** `users/{uid}/personal/other-incomes-taxpayer`

---

## other-incomes-spouse

Spouse-side subset — no upload-gate fields, no `alimonyAgreementDateLine2b` field. All other line 1-7 + 8a-8z + write-in items same as taxpayer.

| Field | TS type | Required | Notes |
|---|---|---|---|
| hadAdditionalIncomeForSchedule1 | bool | R | screening |
| hasScheduleCBusinessIncomeOutOfScope | bool |  | |
| hasScheduleFFarmIncomeOutOfScope | bool |  | |
| hasSection962CfcElection | bool |  | |
| form1099KPersonalItemsDisclosureAmount | num |  | |
| taxableStateLocalRefundsLine1 | num |  | |
| alimonyReceivedLine2a | num |  | |
| otherGainsLossesLine4 | num |  | |
| rentalRealEstateRoyaltiesLine5 | num |  | |
| unemploymentCompensationLine7 | num |  | |
| repaidUnemploymentOverpaymentIn2025 | bool |  | |
| unemploymentRepaymentAdjustment | num |  | |
| otherIncomeNetOperatingLoss8a..otherIncomeDigitalAssets8v | num |  | same 20 line-8 fields as taxpayer |
| otherIncomeItems8z | [OtherIncomeItem] |  | 0..N |

**Storage path:** `users/{uid}/personal/other-incomes-spouse`

---

## kiddie-income-taxpayer

Form 8615 (kiddie tax) — child's return-level inputs. Stored against taxpayer scope when filed alongside the family return.

| Field | TS type | Required | Notes |
|---|---|---|---|
| hasKiddieTaxUnearnedIncome | bool | R | screening; threshold $2,700 |
| childFilingStatus | str |  | enum: Single/MFJ/MFS/HOH/QSS |
| childUnearnedIncomeLine1 | num |  | Form 8615 line 1 |
| childItemizedDeductionLine2 | num |  | Form 8615 line 2 |
| childTaxableIncomeLine4 | num |  | Form 8615 line 4 |
| childNetUnearnedIncomeLine5 | num |  | Form 8615 line 5 |
| parentFirstName | str |  | |
| parentLastName | str |  | |
| parentSsn | str |  | SSN format via TinDirective |
| parentFilingStatus | str |  | enum |
| parentTaxableIncomeLine6 | num |  | Form 8615 line 6 |
| otherChildrenNetUnearnedLine7 | num |  | Form 8615 line 7 (siblings) |
| childTaxableIncomeNotSubjectToKiddieTaxLine14 | num |  | |
| childTentativeTaxShareLine13 | num |  | |
| childFinalTaxLine18 | num |  | |

**Storage path:** `users/{uid}/personal/kiddie-income-taxpayer`

---

## kiddie-income-dependent

Reuses `FormKiddieIncomeTaxpayerComponent` with `formId="kiddie-income-dependent"`. **Same `KiddieIncomeTaxpayerModel` schema.** Persisted under dependent-scoped path.

**Storage path:** `users/{uid}/dependents/{dependentId}/personal/kiddie-income-dependent`

---

## income-adjustments-taxpayer

Form 1040 line 10 / Schedule 1 Part II (lines 11-26). SE adjustments (15-17) are out-of-scope flags.

| Field | TS type | Required | Notes |
|---|---|---|---|
| hadIncomeAdjustmentsForSchedule1 | bool | R | screening |
| hasDeductibleSelfEmploymentTaxLine15OutOfScope | bool |  | OOS gate |
| hasSelfEmployedRetirementPlanAdjustmentLine16OutOfScope | bool |  | OOS gate |
| hasSelfEmployedHealthInsuranceAdjustmentLine17OutOfScope | bool |  | OOS gate |
| educatorExpensesLine11 | num |  | $300 cap |
| reservistPerformingArtistFeeBasisExpensesLine12 | num |  | Form 2106 |
| hsaDeductionLine13 | num |  | Form 8889 |
| movingExpensesArmedForcesLine14 | num |  | Form 3903 (military only) |
| movingExpensesStorageFeesOnlyLine14 | bool |  | sub-indicator |
| penaltyOnEarlyWithdrawalOfSavingsLine18 | num |  | 1099-INT box 2 |
| alimonyPaidLine19a | num |  | pre-2019 agreements |
| alimonyRecipientSsnLine19b | str |  | SSN |
| alimonyAgreementDateLine19c | Date |  | p-datepicker |
| iraDeductionLine20 | num |  | |
| isCoveredByWorkplaceRetirementPlanTaxpayer | bool |  | IRA deduction phaseout gate |
| iraDeductionMfsLivedApartLine20 | bool |  | MFS-lived-apart election |
| studentLoanInterestDeductionLine21 | num |  | $2,500 cap |
| archerMsaDeductionLine23 | num |  | Form 8853 |
| otherAdjustmentJuryDutyPayLine24a | num |  | 24a |
| otherAdjustmentDeductibleExpensesRelatedTo8lLine24b | num |  | 24b |
| otherAdjustmentNontaxableOlympicParalympicLine24c | num |  | 24c |
| otherAdjustmentReforestationAmortizationLine24d | num |  | 24d |
| otherAdjustmentTradeActRepaymentLine24e | num |  | 24e |
| otherAdjustmentContributions501c18dLine24f | num |  | 24f |
| otherAdjustmentChaplain403bContributionsLine24g | num |  | 24g |
| otherAdjustmentAttorneyFeesUnlawfulDiscriminationLine24h | num |  | 24h |
| otherAdjustmentAttorneyFeesIrsAwardLine24i | num |  | 24i |
| otherAdjustmentHousingDeductionForm2555Line24j | num |  | 24j |
| otherAdjustmentExcessDeductionsSection67eLine24k | num |  | 24k |
| otherAdjustmentsItems24z | [OtherAdjustmentItem] |  | 0..N free-text rows |

OtherAdjustmentItem child shape: `{ description: str, amount: num }`.

**Storage path:** `users/{uid}/personal/income-adjustments-taxpayer`

---

## income-adjustments-spouse

Same as income-adjustments-taxpayer with one rename: `isCoveredByWorkplaceRetirementPlanTaxpayer` -> `isCoveredByWorkplaceRetirementPlanSpouse`. All other fields identical.

**Storage path:** `users/{uid}/personal/income-adjustments-spouse`

---

## 31-other-payments

Schedule 3 lines 12 / 13b / 13d / 13z (single household-level form, no person variant).

| Field | TS type | Required | Notes |
|---|---|---|---|
| hasFuelTaxCredit | bool |  | screening; gates line 12 |
| creditForFederalTaxOnFuels | num |  | Form 4136 line 14; Schedule 3 line 12 |
| hasSection1341Credit | bool |  | screening; gates line 13b |
| section1341RepaymentAmount | num |  | must exceed $3,000 |
| section1341Credit | num |  | computed credit |
| hasOtherRefundableCredits | bool |  | screening; gates line 13z items |
| hasDeferred965Tax | bool |  | screening; gates line 13d |
| deferredNet965TaxLiability | num |  | Section 965 deferred liability |
| otherRefundableCreditItems | [CreditItem] |  | 0..N free-text rows |

CreditItem child shape: `{ description: str, amount: num }`.

**Storage path:** `users/{uid}/personal/31-other-payments`

---

## estimated-tax-payments-taxpayer

Form 1040 line 26 estimated tax payments + prior-year overpayment credits. Component is reused with `@Input() formId` for the spouse variant. Model type is `any` (no interface) but the shape is fixed by the constructor literal.

| Field | TS type | Required | Notes |
|---|---|---|---|
| madeEstimatedTaxPayments | bool | R | screening |
| installment1Amount | num |  | Q1 (Apr 15) |
| installment2Amount | num |  | Q2 (Jun 16) |
| installment3Amount | num |  | Q3 (Sep 15) |
| installment4Amount | num |  | Q4 (Jan 15 next year) |
| priorYearOverpaymentCredited | num |  | 2024 refund applied to 2025 |
| amendedReturnOverpaymentCredited | num |  | additional refund from amended 2024 return |
| divorceFormerSpouseSSN | str |  | former spouse SSN for joint estimated payment apportionment |

**Storage path:** `users/{uid}/personal/estimated-tax-payments-taxpayer`

---

## estimated-tax-payments-spouse

Same component as estimated-tax-payments-taxpayer, mounted with `formId="estimated-tax-payments-spouse"` and `person="spouse"`. **Identical model shape.** On MFJ joint returns, the spouse-side amounts are combined with the taxpayer's; on MFS, only this spouse's own payments belong here.

**Storage path:** `users/{uid}/personal/estimated-tax-payments-spouse`

---

## Cross-form notes for SQL schema

1. **Polymorphic person scope**: every form has an implicit `owner = {taxpayer|spouse|dependent}` axis encoded in the form-id suffix. A SQL design can either keep separate tables per form-id or use a unified `personal_form (user_id, owner_kind, owner_dep_id, form_id, payload_jsonb)` row + per-form normalized child tables for the FormArray contents.
2. **Repeating child shapes**: `HouseholdEmployerEntry`, `TipEmployerEntry`, `MedicaidWaiverEntry`, `FirmEntry`, `OtherIncomeItem`, `OtherAdjustmentItem`, `CreditItem`, `CapitalGainLossTransactionEntry`/`CapitalGainLossSpouseTransactionEntry` are 0..N arrays — these are first-class child-table candidates.
3. **Boolean tri-state**: every yes/no field is `boolean | null`. SQL should use `BIT NULL` / `BOOLEAN NULL`. `null` = unanswered, never coerced.
4. **Numeric semantics**: all dollar fields are `decimal(2)` in the UI (`p-inputNumber minFractionDigits=2 maxFractionDigits=2`). SQL `DECIMAL(15,2)` is sufficient.
5. **Date semantics**: PrimeNG p-datepicker round-trips a JS `Date` but JSON persisted shape is an ISO `string`. Treat as `DATE` in SQL.
6. **Enums in free-string fields**: `transactionTerm` (short/long), `basisReportedToIrs` (reported/not_reported/no_1099b), `form8949Box` (A-F), `reasonCode` (Form 8919 letter codes), `childFilingStatus`/`parentFilingStatus` (filing status enum) — candidates for CHECK constraints or lookup tables.
7. **UI-only fields** in `TipEmployerEntry` (`w2AutoFilledFrom`, `rRTAAutoFillSourceLabel`, `hasGovernmentTips`, `hasNonCashTips`, `hasRrtaCompensation`) are stripped before save — do NOT include in SQL schema.
8. **Backend-populated readonly fields** (`imports.totalSSWagesTipsRRTAAnd4137`, `imported1099BRecordCount`, `combatPayTotal`, etc.) are computed-and-stored snapshots — keep in SQL as a denormalized cache but treat the upstream W-2/1099 statement table as truth.
9. **Dependent-scoped paths** (`capital-gain-loss-dependent`, `kiddie-income-dependent`): same schema as the taxpayer form but scoped under dependent. SQL should join on `(user_id, dependent_id)` rather than `user_id` alone.
