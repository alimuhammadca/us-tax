# Form 1040 Output Model Inventory

Source: `C:\us-tax\us-tax-be\src\main\java\com\ustax\model\output\` (POJOs, all fields private with getter/setter; no JSR-303 annotations present; all object reference fields nullable; `BigDecimal` fields nullable; `Boolean`/`Integer` boxed = nullable; primitives (only `boolean blocking` in TaxReturnFlag) non-null). `List<T>` fields default to empty `ArrayList<>` and setters coerce `null` to empty list (so list refs are non-null at runtime but elements/list may be empty).

Scope: Form1040 root + immediate child objects + Schedules 1, 1A, 2, 3, A, B, D, 8812 + TaxReturnComputation container + TaxReturnFlag. (Forms like 8606, 4972, 8814, 8949, 8995, 2555, 6251, 2441, 8839, etc. referenced by TaxReturnComputation are listed in the container but not expanded here.)

---

### Form1040

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| filer | Filer | Y | FK → Filer |
| filingStatus | FilingStatus | Y | FK → FilingStatus |
| presidentialElection | PresidentialElection | Y | FK → PresidentialElection |
| digitalAssets | DigitalAssets | Y | FK → DigitalAssets |
| standardDeductionIndicators | StandardDeductionIndicators | Y | FK → StandardDeductionIndicators |
| address | Address | Y | FK → Address |
| spouse | Spouse | Y | FK → Spouse (null when no spouse) |
| dependents | List\<Dependent\> | N (list ref) | empty by default; element type Dependent |
| income | Income | Y | FK → Income |
| adjustments | Adjustments | Y | FK → Adjustments |
| deductions | Deductions | Y | FK → Deductions |
| taxAndCredits | TaxAndCredits | Y | FK → TaxAndCredits |
| payments | Payments | Y | FK → Payments |
| refund | Refund | Y | FK → Refund |
| amountOwed | AmountOwed | Y | FK → AmountOwed |
| thirdPartyDesignee | ThirdPartyDesignee | Y | FK → ThirdPartyDesignee |
| signature | Signature | Y | FK → Signature |

### Filer

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| firstName | String | Y | |
| middleInitial | String | Y | single character expected |
| lastName | String | Y | |
| ssn | String | Y | 9 digits stored as string |
| dateOfBirth | String | Y | ISO date stored as string |

### FilingStatus

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| status | String | Y | enum-like; values: SINGLE, MFJ, MFS, HOH, QSS |
| mfsSpouseName | String | Y | MFS only |
| mfsSpouseSSN | String | Y | MFS only |
| mfsOrHohLivedApartOrLegallySeparated | Boolean | Y | |
| hohQualifyingPersonName | String | Y | HOH only |
| treatNonresidentSpouseAsResident | Boolean | Y | |
| alienPersonName | String | Y | |

### PresidentialElection

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| you | Boolean | Y | $3 election checkbox |
| spouse | Boolean | Y | $3 election checkbox (MFJ) |

### DigitalAssets

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| digitalAssets | String | Y | enum-like: "yes"/"no" |

### StandardDeductionIndicators

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| someoneCanClaimYou | Boolean | Y | |
| someoneCanClaimSpouse | Boolean | Y | |
| spouseItemizesSeparateReturn | Boolean | Y | line 12b |
| youWereDualStatusAlien | Boolean | Y | line 12c |
| spouseItemizesOrDualStatus | Boolean | Y | @Deprecated 2026-05-13 (combined flag) |
| youBornBeforeThreshold | Boolean | Y | age 65+ |
| youAreBlind | Boolean | Y | |
| spouseBornBeforeThreshold | Boolean | Y | |
| spouseIsBlind | Boolean | Y | |
| line12dBoxesCheckedCount | Integer | Y | 0–4 |
| spouseMeetsAgeBlindnessMfsRequirements | Boolean | Y | MFS only |

### Address

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| addressLine1 | String | Y | |
| addressLine2 | String | Y | apt/suite |
| city | String | Y | |
| state | String | Y | 2-letter |
| zipCode | String | Y | |
| foreignCountry | String | Y | |
| foreignProvince | String | Y | |
| postalCode | String | Y | foreign postal code |

### Spouse

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| firstName | String | Y | |
| middleInitial | String | Y | |
| lastName | String | Y | |
| ssn | String | Y | |
| dateOfBirth | String | Y | ISO date string |

### Dependent

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| firstName | String | Y | |
| middleInitial | String | Y | |
| lastName | String | Y | |
| ssn | String | Y | |
| dateOfBirth | String | Y | |
| relationship | String | Y | |
| childTaxCreditEligible | Boolean | Y | CTC checkbox |
| otherDependentCreditEligible | Boolean | Y | ODC checkbox |
| fullTimeStudent | Boolean | Y | |
| permanentlyAndTotallyDisabled | Boolean | Y | |
| livedWithTaxpayerMoreThanHalfYear | Boolean | Y | |
| monthsLivedWithTaxpayer | Integer | Y | 0–12 |
| livedWithTaxpayerInUSA | Boolean | Y | |
| livedWithOtherParent | Boolean | Y | |
| qualifyingChildOfAnotherTaxpayer | Boolean | Y | |

### Income

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| wages | BigDecimal | Y | line 1a |
| householdEmployeeWages | BigDecimal | Y | line 1b |
| tipIncome | BigDecimal | Y | line 1c |
| medicaidWaiverPayments | BigDecimal | Y | line 1d |
| dependentCareBenefits | BigDecimal | Y | line 1e |
| adoptionBenefits | BigDecimal | Y | line 1f |
| uncollectedSocialSecurityMedicareWages | BigDecimal | Y | line 1g |
| otherEarnedIncome | BigDecimal | Y | line 1h |
| otherEarnedIncomeStatements | List\<String\> | N (list ref) | element type String |
| nontaxableCombatPayElection | BigDecimal | Y | line 1i |
| totalWages | BigDecimal | Y | line 1z = sum 1a–1h |
| taxExemptInterest | BigDecimal | Y | line 2a |
| taxableInterest | BigDecimal | Y | line 2b |
| qualifiedDividends | BigDecimal | Y | line 3a |
| ordinaryDividends | BigDecimal | Y | line 3b |
| iraDistributions | BigDecimal | Y | line 4a |
| taxableIraDistributions | BigDecimal | Y | line 4b |
| line4cBox1Rollover | Boolean | Y | |
| line4cBox2Qcd | Boolean | Y | |
| line4cBox3Other | Boolean | Y | |
| line4cBox3Text | String | Y | |
| line4cExceptionBreakoutStatementRequired | Boolean | Y | |
| line4aRolloverAttachmentText | String | Y | |
| line4cQcdSieAttachmentText | String | Y | |
| line4cBreakoutStatementText | String | Y | |
| pensionsAnnuities | BigDecimal | Y | line 5a |
| taxablePensionsAnnuities | BigDecimal | Y | line 5b |
| line5cBox1Rollover | Boolean | Y | |
| line5cBox2Pso | Boolean | Y | |
| line5cBox3Other | Boolean | Y | |
| line5cBox3Text | String | Y | |
| socialSecurityBenefits | BigDecimal | Y | line 6a |
| taxableSocialSecurityBenefits | BigDecimal | Y | line 6b |
| line6cLumpSumElection | Boolean | Y | |
| line6dMfsLivedApartAllYear | Boolean | Y | |
| capitalGainLoss | BigDecimal | Y | line 7a |
| line7bScheduleDNotRequired | Boolean | Y | |
| line7bIncludesChildCapitalGainLoss | Boolean | Y | |
| line7bChildAmountFromForm8814Line10 | BigDecimal | Y | |
| line3cChildDividendsInLine3a | Boolean | Y | |
| line3cChildDividendsInLine3b | Boolean | Y | |
| otherIncomeSchedule1 | BigDecimal | Y | line 8 |
| totalIncome | BigDecimal | Y | line 9 |

### Adjustments

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| adjustmentsSchedule1 | BigDecimal | Y | line 10 |
| line11aAdjustedGrossIncome | BigDecimal | Y | line 11a |
| line11bAmountFromLine11aAdjustedGrossIncome | BigDecimal | Y | line 11b |
| adjustedGrossIncome | BigDecimal | Y | AGI |

### Deductions

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| line12aChecked | Boolean | Y | |
| line12bChecked | Boolean | Y | spouse itemizes (MFS) |
| line12cChecked | Boolean | Y | dual-status alien |
| line12dBoxesCheckedCount | Integer | Y | 0–4 |
| deductionElection | String | Y | enum-like: "STANDARD"/"ITEMIZED" |
| standardDeductionComputed | BigDecimal | Y | |
| itemizedDeductionsFromScheduleA | BigDecimal | Y | |
| deductionType | String | Y | enum-like |
| deductionAmount | BigDecimal | Y | line 12e |
| qualifiedBusinessIncomeDeduction | BigDecimal | Y | line 13a |
| additionalDeductions | BigDecimal | Y | line 13b (from Sched 1-A line 38) |
| totalDeductions | BigDecimal | Y | line 14 = 12e+13a+13b |
| taxableIncome | BigDecimal | Y | line 15 mirror |
| line15TaxableIncome | BigDecimal | Y | line 15 explicit |

### TaxAndCredits

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| tax | BigDecimal | Y | composite |
| regularTax | BigDecimal | Y | line 16 base |
| computationMethod | String | Y | enum-like: TAX_TABLE/TCW/QDCG/SCHEDULE_D_TW/F2555_FEITW/F8615 |
| box1Form8814Tax | BigDecimal | Y | |
| box2Form4972Tax | BigDecimal | Y | |
| ecrBox3Tax | BigDecimal | Y | |
| box1Checked | Boolean | Y | |
| box2Checked | Boolean | Y | |
| box3Checked | Boolean | Y | |
| box3Code | String | Y | enum-like: 962/ECR/1291TAX/Form 8978/965INC |
| alternativeMinimumTax | BigDecimal | Y | line 17 |
| additionalTaxSchedule2 | BigDecimal | Y | |
| totalTaxBeforeCredits | BigDecimal | Y | |
| childTaxCredit | BigDecimal | Y | line 19 |
| otherCreditsSchedule3 | BigDecimal | Y | line 20 |
| totalCredits | BigDecimal | Y | line 21 |
| taxAfterCredits | BigDecimal | Y | line 22 |
| otherTaxes | BigDecimal | Y | line 23 |
| totalTax | BigDecimal | Y | line 24 |

### Payments

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| withholdingW2 | BigDecimal | Y | line 25a |
| withholding1099 | BigDecimal | Y | line 25b |
| withholdingOther | BigDecimal | Y | line 25c |
| totalWithholding | BigDecimal | Y | line 25d |
| estimatedTaxPayments | BigDecimal | Y | line 26 |
| earnedIncomeCredit | BigDecimal | Y | line 27 |
| additionalChildTaxCredit | BigDecimal | Y | line 28 |
| americanOpportunityCredit | BigDecimal | Y | line 29 |
| refundableAdoptionCredit | BigDecimal | Y | line 30 (Form 8839 Part II) |
| otherPaymentsSchedule3 | BigDecimal | Y | line 31 |
| totalOtherPaymentsAndRefundableCredits | BigDecimal | Y | line 32 |
| totalPayments | BigDecimal | Y | line 33 |

### Refund

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| overpaid | BigDecimal | Y | line 34 |
| refundAmount | BigDecimal | Y | line 35a |
| directDeposit | Boolean | Y | |
| routingNumber | String | Y | line 35b |
| accountType | String | Y | enum-like: checking/savings |
| accountNumber | String | Y | line 35d |
| amountAppliedToNextYear | BigDecimal | Y | line 36 |

### AmountOwed

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| amountOwed | BigDecimal | Y | line 37 |
| estimatedTaxPenalty | BigDecimal | Y | line 38 (Form 2210) |

### ThirdPartyDesignee

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| allowDesignee | Boolean | Y | |
| designeeName | String | Y | |
| designeePhone | String | Y | |
| designeePin | String | Y | 5-digit PIN |

### Signature

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| taxpayerSignature | String | Y | |
| spouseSignature | String | Y | |
| taxpayerOccupation | String | Y | |
| spouseOccupation | String | Y | |
| taxpayerIpPin | String | Y | 6-digit IRS-issued |
| spouseIpPin | String | Y | |
| dateSigned | LocalDate | Y | |
| phoneNumber | String | Y | |
| email | String | Y | |

### RequiredAttachmentForm

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | Y | FK → ScheduleHeader |
| required | Boolean | Y | |
| requirementReason | String | Y | |
| relatedSchedule1Amount | BigDecimal | Y | |

### ScheduleHeader

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| name | String | Y | |
| ssn | String | Y | |

---

### Schedule1

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | Y | FK |
| additionalIncome | Schedule1AdditionalIncome | Y | FK |
| adjustments | Schedule1Adjustments | Y | FK |
| otherIncomeItems | List\<Schedule1OtherIncomeItem\> | N (list ref) | line 8z line-items |
| otherAdjustmentItems | List\<Schedule1OtherAdjustmentItem\> | N (list ref) | line 24z line-items |

### Schedule1AdditionalIncome

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| taxableRefundsStateLocal | BigDecimal | Y | line 1 |
| alimonyReceived | BigDecimal | Y | line 2a |
| alimonyReceivedAgreementDate | String | Y | line 2b |
| businessIncomeLoss | BigDecimal | Y | line 3 |
| otherGainsLosses | BigDecimal | Y | line 4 |
| rentalRealEstateRoyalties | BigDecimal | Y | line 5 |
| farmIncomeLoss | BigDecimal | Y | line 6 |
| unemploymentCompensation | BigDecimal | Y | line 7 |
| otherIncomeNetOperatingLoss | BigDecimal | Y | 8a |
| otherIncomeGambling | BigDecimal | Y | 8b |
| otherIncomeCancellationOfDebt | BigDecimal | Y | 8c |
| otherIncomeForeignEarnedIncomeExclusion | BigDecimal | Y | 8d |
| otherIncomeForm8853 | BigDecimal | Y | 8e |
| otherIncomeForm8889 | BigDecimal | Y | 8f |
| otherIncomeAlaskaPermanentFundDividends | BigDecimal | Y | 8g |
| otherIncomeJuryDutyPay | BigDecimal | Y | 8h |
| otherIncomePrizesAwards | BigDecimal | Y | 8i |
| otherIncomeNotForProfitActivity | BigDecimal | Y | 8j |
| otherIncomeStockOptions | BigDecimal | Y | 8k |
| otherIncomeRentalPersonalProperty | BigDecimal | Y | 8l |
| otherIncomeOlympicParalympicAwards | BigDecimal | Y | 8m |
| otherIncomeSection951a | BigDecimal | Y | 8n (sec 951(a)) |
| otherIncomeSection951A | BigDecimal | Y | 8o (sec 951A GILTI) |
| otherIncomeSection461l | BigDecimal | Y | 8p |
| otherIncomeAbleAccountDistributions | BigDecimal | Y | 8q |
| otherIncomeScholarshipGrants | BigDecimal | Y | 8r |
| otherIncomeMedicaidWaiverPayments | BigDecimal | Y | 8s |
| otherIncomeNonqualifiedDeferredComp | BigDecimal | Y | 8t |
| otherIncomeWagesWhileIncarcerated | BigDecimal | Y | 8u |
| otherIncomeDigitalAssets | BigDecimal | Y | 8v |
| otherIncomeOther | BigDecimal | Y | 8z |
| otherIncomeForm8814 | BigDecimal | Y | |
| totalOtherIncome | BigDecimal | Y | line 9 |
| totalAdditionalIncome | BigDecimal | Y | line 10 |

### Schedule1Adjustments

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| educatorExpenses | BigDecimal | Y | line 11 |
| certainBusinessExpenses | BigDecimal | Y | line 12 |
| healthSavingsAccountDeduction | BigDecimal | Y | line 13 |
| movingExpensesArmedForces | BigDecimal | Y | line 14 |
| deductibleSelfEmploymentTax | BigDecimal | Y | line 15 |
| selfEmployedSepSimpleQualifiedPlans | BigDecimal | Y | line 16 |
| selfEmployedHealthInsuranceDeduction | BigDecimal | Y | line 17 |
| earlyWithdrawalPenalty | BigDecimal | Y | line 18 |
| alimonyPaid | BigDecimal | Y | line 19a |
| alimonyPaidRecipientSsn | String | Y | line 19b |
| alimonyPaidAgreementDate | String | Y | line 19c |
| iraDeduction | BigDecimal | Y | line 20 |
| studentLoanInterestDeduction | BigDecimal | Y | line 21 |
| archerMsaDeduction | BigDecimal | Y | line 23 |
| otherAdjustmentJuryDutyPay | BigDecimal | Y | 24a |
| otherAdjustmentRentalPersonalPropertyExpenses | BigDecimal | Y | 24b |
| otherAdjustmentOlympicParalympicMedals | BigDecimal | Y | 24c |
| otherAdjustmentReforestation | BigDecimal | Y | 24d |
| otherAdjustmentRepaymentSupplementalUnemployment | BigDecimal | Y | 24e |
| otherAdjustmentSection501c18d | BigDecimal | Y | 24f |
| otherAdjustmentChaplains403b | BigDecimal | Y | 24g |
| otherAdjustmentAttorneyFeesUnlawfulDiscrimination | BigDecimal | Y | 24h |
| otherAdjustmentAttorneyFeesWhistleblower | BigDecimal | Y | 24i |
| otherAdjustmentHousingDeduction | BigDecimal | Y | 24j |
| otherAdjustmentExcessDeductionsSection67e | BigDecimal | Y | 24k |
| otherAdjustmentOther | BigDecimal | Y | 24z |
| totalOtherAdjustments | BigDecimal | Y | line 25 |
| totalAdjustmentsToIncome | BigDecimal | Y | line 26 |

### Schedule1OtherIncomeItem

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| description | String | Y | |
| amount | BigDecimal | Y | |

### Schedule1OtherAdjustmentItem

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| description | String | Y | |
| amount | BigDecimal | Y | |

---

### Schedule1A

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | Y | FK |
| magi | BigDecimal | Y | Part I line 3 |
| line13TipsDeduction | BigDecimal | Y | tips deduction (taxpayer+spouse) |
| line21OvertimeDeduction | BigDecimal | Y | OT deduction |
| line30CarLoanInterestDeduction | BigDecimal | Y | car loan interest |
| line37EnhancedSeniorDeduction | BigDecimal | Y | senior deduction |
| line38Total | BigDecimal | Y | → Form 1040 line 13b |
| taxpayerRawTips | BigDecimal | Y | pre-phaseout |
| spouseRawTips | BigDecimal | Y | |
| taxpayerRawOvertime | BigDecimal | Y | |
| spouseRawOvertime | BigDecimal | Y | |
| taxpayerSeniorEligible | Boolean | Y | |
| spouseSeniorEligible | Boolean | Y | |

---

### Schedule2

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | Y | FK |
| tax | Schedule2Tax | Y | FK Part I |
| otherTaxes | Schedule2OtherTaxes | Y | FK Part II |
| otherAdditionItems | List\<Schedule2OtherAdditionItem\> | N (list ref) | |
| recaptureOtherCreditItems | List\<Schedule2RecaptureOtherCreditItem\> | N (list ref) | |
| otherAdditionalTaxItems | List\<Schedule2OtherAdditionalTaxItem\> | N (list ref) | |

### Schedule2Tax

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| excessAdvancePremiumTaxCreditRepayment | BigDecimal | Y | line 1a |
| repaymentNewCleanVehicleCredit | BigDecimal | Y | |
| repaymentPreviouslyOwnedCleanVehicleCredit | BigDecimal | Y | |
| recaptureNetEpeForm4255Line2aColL | BigDecimal | Y | |
| excessivePaymentsForm4255 | BigDecimal | Y | |
| excessivePaymentsReference | String | Y | |
| twentyPercentExcessivePaymentsForm4255 | BigDecimal | Y | |
| twentyPercentExcessivePaymentsReference | String | Y | |
| otherAdditionsToTax | BigDecimal | Y | |
| totalAdditionsToTax | BigDecimal | Y | line 2 |
| alternativeMinimumTax | BigDecimal | Y | line 1 AMT |
| totalTax | BigDecimal | Y | line 3 |

### Schedule2OtherTaxes

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| selfEmploymentTax | BigDecimal | Y | line 4 |
| unreportedTipIncomeTax | BigDecimal | Y | line 5 (F4137) |
| uncollectedSocialSecurityMedicareTaxOnWages | BigDecimal | Y | line 6 |
| totalAdditionalSocialSecurityMedicareTax | BigDecimal | Y | line 7 |
| additionalTaxOnIras | BigDecimal | Y | line 8 (F5329) |
| form5329NotRequired | Boolean | Y | |
| householdEmploymentTaxes | BigDecimal | Y | line 9 |
| repaymentFirstTimeHomebuyerCredit | BigDecimal | Y | line 10 |
| additionalMedicareTax | BigDecimal | Y | line 11 |
| netInvestmentIncomeTax | BigDecimal | Y | line 12 |
| uncollectedSocialSecurityMedicareRrtaTax | BigDecimal | Y | line 13 |
| interestOnInstallmentSalesResidentialLots | BigDecimal | Y | 17a |
| interestOnDeferredTaxInstallmentSalesOver150k | BigDecimal | Y | 17b |
| recaptureLowIncomeHousingCredit | BigDecimal | Y | 17c |
| recaptureOtherCredits | BigDecimal | Y | 17d |
| recaptureFederalMortgageSubsidy | BigDecimal | Y | 17e |
| additionalTaxOnHsaDistributions | BigDecimal | Y | 17f |
| additionalTaxOnHsaNotEligible | BigDecimal | Y | 17g |
| additionalTaxOnArcherMsaDistributions | BigDecimal | Y | 17h |
| additionalTaxOnMedicareAdvantageMsaDistributions | BigDecimal | Y | 17i |
| recaptureCharitableContributionDeduction | BigDecimal | Y | 17j |
| incomeFromNonqualifiedDeferredCompPlan409a | BigDecimal | Y | 17k |
| compensationFromNonqualifiedDeferredCompPlan457a | BigDecimal | Y | 17l |
| section72m5Tax | BigDecimal | Y | 17m |
| goldenParachutePayments | BigDecimal | Y | 17n |
| taxOnAccumulationDistributionOfTrusts | BigDecimal | Y | 17o |
| exciseTaxOnInsiderStockCompensation | BigDecimal | Y | 17p |
| lookBackInterestSection167g | BigDecimal | Y | 17q |
| taxOnNonEffectivelyConnectedIncome | BigDecimal | Y | 17r |
| interestFromForm8621Line16f | BigDecimal | Y | 17s |
| interestFromForm8621Line24 | BigDecimal | Y | 17t |
| otherAdditionalTaxes | BigDecimal | Y | 17z |
| totalAdditionalTaxes | BigDecimal | Y | line 18 |
| recaptureNetEpeForm4255Line1dColL | BigDecimal | Y | line 19 |
| section965NetTaxLiabilityInstallment | BigDecimal | Y | line 20 |
| totalOtherTaxes | BigDecimal | Y | line 21 |

### Schedule2OtherAdditionItem

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| description | String | Y | |
| formNumber | String | Y | |
| amount | BigDecimal | Y | |

### Schedule2RecaptureOtherCreditItem

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| description | String | Y | |
| formNumber | String | Y | |
| amount | BigDecimal | Y | |

### Schedule2OtherAdditionalTaxItem

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| description | String | Y | |
| amount | BigDecimal | Y | |

---

### Schedule3

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | Y | FK |
| nonrefundableCredits | Schedule3NonrefundableCredits | Y | FK Part I |
| otherPaymentsCredits | Schedule3OtherPaymentsCredits | Y | FK Part II |
| otherNonrefundableCreditItems | List\<Schedule3OtherNonrefundableCreditItem\> | N (list ref) | |
| otherRefundableCreditItems | List\<Schedule3OtherRefundableCreditItem\> | N (list ref) | |

### Schedule3NonrefundableCredits

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| foreignTaxCredit | BigDecimal | Y | line 1 |
| childDependentCareCredit | BigDecimal | Y | line 2 |
| educationCredits | BigDecimal | Y | line 3 |
| retirementSavingsContributionsCredit | BigDecimal | Y | line 4 |
| residentialCleanEnergyCredit | BigDecimal | Y | 5a |
| energyEfficientHomeImprovementCredit | BigDecimal | Y | 5b |
| generalBusinessCredit | BigDecimal | Y | line 6a |
| priorYearMinimumTaxCredit | BigDecimal | Y | 6b |
| adoptionCredit | BigDecimal | Y | 6c |
| elderlyDisabledCredit | BigDecimal | Y | 6d |
| cleanVehicleCredit | BigDecimal | Y | 6e |
| mortgageInterestCredit | BigDecimal | Y | 6f |
| dcFirstTimeHomebuyerCredit | BigDecimal | Y | 6g |
| qualifiedElectricVehicleCredit | BigDecimal | Y | 6h |
| alternativeFuelVehicleRefuelingPropertyCredit | BigDecimal | Y | 6i |
| creditToHoldersOfTaxCreditBonds | BigDecimal | Y | 6j |
| amountFromForm8978Line14 | BigDecimal | Y | 6l |
| creditPreviouslyOwnedCleanVehicles | BigDecimal | Y | 6m |
| otherNonrefundableCredits | BigDecimal | Y | 6z |
| totalOtherNonrefundableCredits | BigDecimal | Y | line 7 |
| totalNonrefundableCredits | BigDecimal | Y | line 8 |

### Schedule3OtherPaymentsCredits

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| netPremiumTaxCredit | BigDecimal | Y | line 9 |
| amountPaidWithExtension | BigDecimal | Y | line 10 |
| excessSocialSecurityRrtaTaxWithheld | BigDecimal | Y | line 11 |
| creditForFederalTaxOnFuels | BigDecimal | Y | line 12 |
| form2439 | BigDecimal | Y | 13a |
| section1341Credit | BigDecimal | Y | 13b |
| netElectivePaymentElectionAmount | BigDecimal | Y | 13c |
| deferredNet965TaxLiability | BigDecimal | Y | 13d |
| otherRefundableCredits | BigDecimal | Y | 13z |
| totalOtherPaymentsRefundableCredits | BigDecimal | Y | line 14 |
| totalOtherPaymentsAndRefundableCredits | BigDecimal | Y | line 15 |

### Schedule3OtherNonrefundableCreditItem

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| description | String | Y | |
| formNumber | String | Y | |
| amount | BigDecimal | Y | |

### Schedule3OtherRefundableCreditItem

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| description | String | Y | |
| amount | BigDecimal | Y | |

---

### ScheduleA

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | Y | FK |
| stateLocalTaxChoice | String | Y | enum-like: "income"/"sales" |
| medicalDentalExpensesPaid | BigDecimal | Y | line 1 |
| adjustedGrossIncome | BigDecimal | Y | line 2 |
| medicalExpenseFloor | BigDecimal | Y | line 3 |
| deductibleMedicalExpenses | BigDecimal | Y | line 4 |
| stateLocalIncomeTaxesPaid | BigDecimal | Y | 5a |
| stateLocalSalesTaxesPaid | BigDecimal | Y | 5a alt |
| realEstateTaxesPaid | BigDecimal | Y | 5b |
| personalPropertyTaxesPaid | BigDecimal | Y | 5c |
| taxesBeforeLimit | BigDecimal | Y | 5d |
| deductibleTaxes | BigDecimal | Y | 5e |
| homeMortgageInterestPaid | BigDecimal | Y | 8a |
| homeMortgagePointsPaid | BigDecimal | Y | 8c |
| investmentInterestPaid | BigDecimal | Y | line 9 |
| netInvestmentIncome | BigDecimal | Y | |
| deductibleInvestmentInterest | BigDecimal | Y | |
| totalInterestPaid | BigDecimal | Y | line 10 |
| charitableCashContributions | BigDecimal | Y | line 11 |
| charitableNonCashContributions | BigDecimal | Y | line 12 |
| totalCharitableContributions | BigDecimal | Y | line 14 |
| personalCasualtyAndTheftLoss | BigDecimal | Y | line 15 |
| netQualifiedDisasterLoss | BigDecimal | Y | |
| foreignTaxesPaid | BigDecimal | Y | |
| deductibleForeignTaxes | BigDecimal | Y | |
| otherAllowedItemizedDeductions | BigDecimal | Y | line 16 |
| totalItemizedDeductions | BigDecimal | Y | line 17 |
| usedForItemizedDeduction | Boolean | Y | |
| usedForStandardDeductionIncrease | Boolean | Y | |
| electsToItemizeAlthoughLessThanStandard | Boolean | Y | line 18 |

---

### ScheduleB

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | Y | FK |
| interestItems | List\<ScheduleBInterestItem\> | N (list ref) | Part I |
| dividendItems | List\<ScheduleBInterestItem\> | N (list ref) | Part II (reuses same item shape) |
| line2TotalInterest | BigDecimal | Y | |
| line3ExcludableInterestSeriesEeI | BigDecimal | Y | |
| line4TaxableInterest | BigDecimal | Y | |
| line6TotalOrdinaryDividends | BigDecimal | Y | |
| line7aForeignAccountOrSignatureAuthority | Boolean | Y | |
| line7aFbarRequired | Boolean | Y | |
| line8ForeignTrustOrDistribution | Boolean | Y | |

### ScheduleBInterestItem

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| payerName | String | Y | |
| amount | BigDecimal | Y | |

---

### ScheduleD

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | Y | FK |
| qualifiedOpportunityFundDisposedYes | Boolean | Y | |
| qualifiedOpportunityFundDisposedNo | Boolean | Y | |
| line1a | ScheduleDTableRow | Y | FK |
| line1b | ScheduleDTableRow | Y | FK |
| line2 | ScheduleDTableRow | Y | FK |
| line3 | ScheduleDTableRow | Y | FK |
| line4ShortTermOtherFormsGainLoss | BigDecimal | Y | |
| line5ShortTermScheduleK1GainLoss | BigDecimal | Y | |
| line6ShortTermCapitalLossCarryover | BigDecimal | Y | |
| line7NetShortTermCapitalGainOrLoss | BigDecimal | Y | |
| line8a | ScheduleDTableRow | Y | FK |
| line8b | ScheduleDTableRow | Y | FK |
| line9 | ScheduleDTableRow | Y | FK |
| line10 | ScheduleDTableRow | Y | FK |
| line11LongTermOtherFormsGainLoss | BigDecimal | Y | |
| line12LongTermScheduleK1GainLoss | BigDecimal | Y | |
| line13CapitalGainDistributions | BigDecimal | Y | |
| line14LongTermCapitalLossCarryover | BigDecimal | Y | |
| line15NetLongTermCapitalGainOrLoss | BigDecimal | Y | |
| line16NetCapitalGainOrLoss | BigDecimal | Y | |
| line17BothLines15And16AreGainsYes | Boolean | Y | |
| line17BothLines15And16AreGainsNo | Boolean | Y | |
| line18TwentyEightPercentRateGain | BigDecimal | Y | |
| line19UnrecapturedSection1250Gain | BigDecimal | Y | |
| line20QualifiedDividendsAndCapitalGainWorksheetYes | Boolean | Y | |
| line20ScheduleDTaxWorksheetNo | Boolean | Y | |
| line21AllowedCapitalLoss | BigDecimal | Y | |
| line22QualifiedDividendsYes | Boolean | Y | |
| line22QualifiedDividendsNo | Boolean | Y | |
| scheduleDRequired | Boolean | Y | |
| form8949Required | Boolean | Y | |
| requirementReason | String | Y | |
| nextYearShortTermCapitalLossCarryover | BigDecimal | Y | carryover worksheet |
| nextYearLongTermCapitalLossCarryover | BigDecimal | Y | carryover worksheet |

### ScheduleDTableRow

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| proceeds | BigDecimal | Y | col (d) |
| costOrOtherBasis | BigDecimal | Y | col (e) |
| adjustments | BigDecimal | Y | col (g) |
| gainOrLoss | BigDecimal | Y | col (h) |

---

### Schedule8812

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| line4NumQualifyingChildren | Integer | Y | |
| line5CtcPotential | BigDecimal | Y | |
| line6NumOtherDependents | Integer | Y | |
| line7OdcPotential | BigDecimal | Y | |
| line8TotalPotential | BigDecimal | Y | |
| line3Magi | BigDecimal | Y | |
| line9ThresholdAmount | BigDecimal | Y | $400k MFJ / $200k other |
| line10PhaseOutExcess | BigDecimal | Y | |
| line11PhaseOutReduction | BigDecimal | Y | |
| line12CreditAfterPhaseOut | BigDecimal | Y | |
| line13CreditLimitWorksheetA | BigDecimal | Y | |
| line14CtcOdcCredit | BigDecimal | Y | → Form 1040 line 19 |
| line16aExcessCreditOverTax | BigDecimal | Y | |
| line16bActcCeiling | BigDecimal | Y | |
| line17ActcPotential | BigDecimal | Y | |
| line18aEarnedIncome | BigDecimal | Y | |
| line18bCombatPay | BigDecimal | Y | nontaxable combat pay |
| line19EarnedIncomeOverFloor | BigDecimal | Y | |
| line20EarnedIncomeActc | BigDecimal | Y | |
| line21WithheldPayrollTaxes | BigDecimal | Y | deferred |
| line22OtherTaxes | BigDecimal | Y | deferred |
| line23TaxesTotal | BigDecimal | Y | deferred |
| line24RefundableCredits | BigDecimal | Y | deferred |
| line25ExcessPayroll | BigDecimal | Y | deferred |
| line26AlternativeActcBase | BigDecimal | Y | deferred |
| electsNoActc | Boolean | Y | opt-out flag |
| line27ActcCredit | BigDecimal | Y | → Form 1040 line 28 |
| creditLimitWorksheetBLine14 | BigDecimal | Y | CLW-B for adoption |

---

### TaxReturnComputation (record; container for compute output)

Located at `com.ustax.microservices.TaxReturnComputation`. Java record — all components final, nullable.

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| form1040 | Form1040 | Y | FK |
| schedule1 | Schedule1 | Y | FK |
| schedule2 | Schedule2 | Y | FK |
| schedule3 | Schedule3 | Y | FK |
| scheduleA | ScheduleA | Y | FK |
| scheduleB | ScheduleB | Y | FK |
| form6251 | Form6251 | Y | AMT |
| form8606Taxpayer | Form8606 | Y | nondeductible IRA |
| form8606Spouse | Form8606 | Y | |
| form2441 | Form2441 | Y | dep care |
| form8839 | Form8839 | Y | adoption |
| form4852TaxpayerList | List\<Form4852\> | Y | W-2/1099-R substitute |
| form4852SpouseList | List\<Form4852\> | Y | |
| form8919Taxpayer | Form8919 | Y | uncollected SS/Medicare |
| form8919Spouse | Form8919 | Y | |
| form4137Taxpayer | Form4137 | Y | tip income |
| form4137Spouse | Form4137 | Y | |
| form4972Taxpayer | Form4972 | Y | lump-sum |
| form4972Spouse | Form4972 | Y | |
| form5329 | Form5329 | Y | additional IRA tax |
| scheduleD | ScheduleD | Y | |
| form8949 | Form8949 | Y | |
| form8814List | List\<Form8814\> | Y | one per child |
| form8995 | Form8995 | Y | QBI simple |
| form8995A | Form8995A | Y | QBI complex |
| schedule1A | Schedule1A | Y | additional deductions |
| form4797 | RequiredAttachmentForm | Y | |
| form4684 | RequiredAttachmentForm | Y | |
| scheduleE | RequiredAttachmentForm | Y | |
| form2106 | RequiredAttachmentForm | Y | |
| form3903 | RequiredAttachmentForm | Y | |
| form2439Capital | RequiredAttachmentForm | Y | |
| form6252Capital | RequiredAttachmentForm | Y | |
| form6781Capital | RequiredAttachmentForm | Y | |
| form8824Capital | RequiredAttachmentForm | Y | |
| scheduleK1Capital | RequiredAttachmentForm | Y | |
| form8997 | RequiredAttachmentForm | Y | QOF |
| form2555Taxpayer | Form2555 | Y | FEIE |
| form2555Spouse | Form2555 | Y | |
| form8853 | RequiredAttachmentForm | Y | Archer MSA |
| form8889 | RequiredAttachmentForm | Y | HSA |
| form8962 | Form8962 | Y | PTC |
| form4952 | Form4952Output | Y | investment interest |
| schedule8812 | Schedule8812 | Y | CTC/ODC/ACTC |
| form1116List | List\<Form1116\> | Y | foreign tax credit |
| form8911saList | List\<Form8911ScheduleA\> | Y | per refueling property |
| form8936saList | List\<Form8936ScheduleA\> | Y | per clean vehicle |
| form5695List | List\<Form5695\> | Y | residential energy |
| form8880 | Form8880 | Y | Saver's Credit |
| form8801 | Form8801 | Y | prior-year AMT credit |
| form8396 | Form8396 | Y | mortgage interest credit |
| form8911 | Form8911 | Y | refueling property |
| form8912 | Form8912 | Y | tax credit bonds |
| form8834 | Form8834 | Y | qualified EV |
| form8859 | Form8859 | Y | DC FTHB carryforward |
| form4868 | Form4868 | Y | extension |
| scheduleR | ScheduleR | Y | elderly/disabled |
| form8863 | Form8863 | Y | education credits |
| form8959 | Form8959 | Y | additional Medicare tax |
| form8862 | Form8862 | Y | credits after disallowance |
| form2210 | Form2210 | Y | est tax underpayment |
| form8888 | Form8888 | Y | refund split |
| flags | List\<TaxReturnFlag\> | Y | blocking/advisory flags |

---

### TaxReturnFlag

Located at `com.ustax.microservices.TaxReturnFlag`.

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| code | String | Y | flag identifier |
| message | String | Y | human-readable |
| blocking | boolean | N | primitive; non-nullable |
