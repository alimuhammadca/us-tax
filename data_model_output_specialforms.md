# Output Model: Special Forms (Phase 2b SQL Schema Input)

Inventory of Java POJO output classes under `com.ustax.model.output` that are NOT Form1040 / main Schedules. Source: `C:\us-tax\us-tax-be\src\main\java\com\ustax\model\output\*.java`.

Excluded (handled in `data_model_output_1040.md`): Form1040 + nested types (Filer, FilingStatus, PresidentialElection, DigitalAssets, StandardDeductionIndicators, Address, Spouse, Dependent, Income, Adjustments, Deductions, TaxAndCredits, Payments, Refund, AmountOwed, ThirdPartyDesignee, Signature, ScheduleHeader); Schedule1/1A/1AdditionalIncome/1Adjustments/1OtherIncomeItem/1OtherAdjustmentItem; Schedule2/2Tax/2OtherTaxes/2OtherAdditionItem/2OtherAdditionalTaxItem/2RecaptureOtherCreditItem; Schedule3/3NonrefundableCredits/3OtherPaymentsCredits/3OtherNonrefundableCreditItem/3OtherRefundableCreditItem; ScheduleA, ScheduleB+InterestItem, ScheduleD+DTableRow, Schedule8812; TaxReturnComputation, TaxReturnFlag, RequiredAttachmentForm.

All fields are POJO instance fields (`private` declarations). All BigDecimal/Boolean/Integer/String/LocalDate reference types are nullable in Java (no primitive marker except where noted `boolean`/`int`). `ScheduleHeader header` references the shared header struct (name, ssn) — treat as FK to a `schedule_header` row or denormalize. Lists are 1:N child collections (FK from child to parent on `_id`).

---

### Form4137 (Unreported tip income SS/Medicare tax)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | shared header |
| employers | List<Form4137Employer> | no (init empty) | 1:N |
| line2TotalCashChargeTips | BigDecimal | yes | |
| line3ReportedTips | BigDecimal | yes | |
| line4UnreportedTips | BigDecimal | yes | |
| line5UnderTwentyTips | BigDecimal | yes | |
| line6UnreportedTipsSubjectMedicare | BigDecimal | yes | |
| line7MaxSocialSecurityWages | BigDecimal | yes | |
| line8SocialSecurityWagesTipsRrta | BigDecimal | yes | |
| line9RemainingSocialSecurityWageBase | BigDecimal | yes | |
| line10UnreportedTipsSubjectSocialSecurity | BigDecimal | yes | |
| line11SocialSecurityTax | BigDecimal | yes | |
| line12MedicareTax | BigDecimal | yes | |
| line13TotalTax | BigDecimal | yes | |

### Form4137Employer

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| employerName | String | yes | |
| employerEin | String | yes | |
| totalCashChargeTips | BigDecimal | yes | |
| reportedCashChargeTips | BigDecimal | yes | |

### Form2441 (Child & dependent care expenses)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| marriedFilingSeparatelyException | Boolean | yes | |
| studentOrDisabledDeemedIncome | Boolean | yes | |
| moreThanThreeCareProviders | Boolean | yes | |
| moreThanThreeQualifyingPersons | Boolean | yes | |
| careProviders | List<Form2441CareProvider> | no (init) | 1:N |
| qualifyingPersons | List<Form2441QualifyingPerson> | no (init) | 1:N |
| line3TotalQualifiedExpensesLimited | BigDecimal | yes | |
| line4EarnedIncome | BigDecimal | yes | |
| line5SpouseEarnedIncomeOrLine4 | BigDecimal | yes | |
| line6SmallestOf3_4_5 | BigDecimal | yes | |
| line7Agi | BigDecimal | yes | |
| line8ApplicablePercentage | BigDecimal | yes | |
| line9aLine6TimesPercentage | BigDecimal | yes | |
| line9bPriorYearExpensesPaidThisYear | BigDecimal | yes | |
| line9cTotalCreditBeforeLimit | BigDecimal | yes | |
| line10TaxLiabilityLimit | BigDecimal | yes | |
| line11ChildDependentCareCredit | BigDecimal | yes | |
| line12TotalDependentCareBenefits | BigDecimal | yes | |
| line13GracePeriodBenefitsUsed | BigDecimal | yes | |
| line14ForfeitedOrCarriedTo2025 | BigDecimal | yes | |
| line15TotalBenefitsAvailable | BigDecimal | yes | |
| line16QualifiedExpenses | BigDecimal | yes | |
| line17SmallerOf15Or16 | BigDecimal | yes | |
| line18EarnedIncome | BigDecimal | yes | |
| line19SpouseEarnedIncomeOrLine18 | BigDecimal | yes | |
| line20SmallestOf17_18_19 | BigDecimal | yes | |
| line21PlanLimit | BigDecimal | yes | |
| line22NoSoleProprietorshipBenefits | Boolean | yes | |
| line22YesSoleProprietorshipBenefits | Boolean | yes | |
| line22AmountFromSoleProprietorship | BigDecimal | yes | |
| line23Line15MinusLine22 | BigDecimal | yes | |
| line24DeductibleBenefits | BigDecimal | yes | |
| line25ExcludedBenefits | BigDecimal | yes | |
| line26TaxableBenefits | BigDecimal | yes | |
| line27StatutoryExpenseLimit | BigDecimal | yes | |
| line28AddLines24And25 | BigDecimal | yes | |
| line29Line27MinusLine28 | BigDecimal | yes | |
| line30QualifiedExpensesExcludingBenefits | BigDecimal | yes | |
| line31SmallerOf29Or30 | BigDecimal | yes | |

### Form2441CareProvider

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| name | String | yes | |
| addressLine1 | String | yes | |
| addressLine2 | String | yes | |
| identifyingNumber | String | yes | EIN/SSN |
| householdEmployee | Boolean | yes | |
| amountPaid | BigDecimal | yes | |

### Form2441QualifyingPerson

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| firstName | String | yes | |
| lastName | String | yes | |
| ssn | String | yes | |
| disabledOver12 | Boolean | yes | |
| qualifiedExpenses | BigDecimal | yes | |

### Form8919 (Uncollected SS/Medicare on wages)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| firms | List<Form8919Firm> | no (init) | 1:N |
| line6TotalWages | BigDecimal | yes | |
| line7MaxWagesSubjectToSsTax | BigDecimal | yes | |
| line8TotalSsWagesTipsRrtaUnreportedTips | BigDecimal | yes | |
| line9Line7MinusLine8 | BigDecimal | yes | |
| line10WagesSubjectToSsTax | BigDecimal | yes | |
| line11SocialSecurityTax | BigDecimal | yes | |
| line12MedicareTax | BigDecimal | yes | |
| line13TotalUncollectedTax | BigDecimal | yes | |

### Form8919Firm

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| firmName | String | yes | |
| firmFederalIdNumber | String | yes | EIN |
| reasonCode | String | yes | A/B/C/D/E/F/G per IRS |
| irsDeterminationDate | String | yes | date as string |
| received1099MiscOrNec | Boolean | yes | |
| wagesNoFicaNotW2 | BigDecimal | yes | |

### Form8606 (Nondeductible IRAs)

One per person per tax year (MFJ aggregates). `owner` distinguishes taxpayer/spouse.

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| owner | String | yes | "taxpayer" or "spouse" |
| part1Line1NondeductibleContributions | BigDecimal | yes | |
| part1Line2TotalBasisTraditionalIras | BigDecimal | yes | |
| part1Line3AddLines1And2 | BigDecimal | yes | |
| part1Line4ContributionsMadeAfterYearEndForTaxYear | BigDecimal | yes | |
| part1Line5Line3MinusLine4 | BigDecimal | yes | |
| part1Line6Dec31ValueAllTraditionalSepSimpleIras | BigDecimal | yes | |
| part1Line7DistributionsExcludingRolloversAndOtherExclusions | BigDecimal | yes | |
| part1Line8NetAmountConvertedToRoth | BigDecimal | yes | |
| part1Line9AddLines6_7_8 | BigDecimal | yes | |
| part1Line10RatioWholePart | BigDecimal | yes | |
| part1Line10RatioDecimalPart | BigDecimal | yes | |
| part1Line11NontaxablePortionConvertedAmount | BigDecimal | yes | |
| part1Line12NontaxablePortionDistributionsNotConverted | BigDecimal | yes | |
| part1Line13TotalNontaxableDistributions | BigDecimal | yes | |
| part1Line14TotalBasisEndOfYear | BigDecimal | yes | |
| part1Line15aLine7MinusLine12 | BigDecimal | yes | |
| part1Line15bQualifiedDisasterDistributionsAmount | BigDecimal | yes | |
| part1Line15cTaxableAmount | BigDecimal | yes | |
| part2Line16NetAmountConvertedToRoth | BigDecimal | yes | |
| part2Line17BasisInConvertedAmount | BigDecimal | yes | |
| part2Line18TaxableConversionAmount | BigDecimal | yes | |
| part3Line19TotalNonqualifiedRothDistributions | BigDecimal | yes | |
| part3Line20QualifiedFirstTimeHomebuyerExpenses | BigDecimal | yes | |
| part3Line21Line19MinusLine20 | BigDecimal | yes | |
| part3Line22BasisInRothContributions | BigDecimal | yes | |
| part3Line23Line21MinusLine22 | BigDecimal | yes | |
| part3Line24BasisInConversionsAndRolloversToRoth | BigDecimal | yes | |
| part3Line25aLine23MinusLine24 | BigDecimal | yes | |
| part3Line25bQualifiedDisasterDistributionsAmount | BigDecimal | yes | |
| part3Line25cTaxableAmount | BigDecimal | yes | |

### Form5329 (Additional taxes on qualified plans)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| additionalTaxOnEarlyDistributions | BigDecimal | yes | |
| exceptionCodeOrReason | String | yes | IRS exception code |

### Form2555 (Foreign earned income exclusion)

One per claiming spouse (max 2 per return).

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| taxHomeCountry | String | yes | |
| bfResidenceOrPresenceCountry | String | yes | |
| citizenOrResidentOf | String | yes | |
| qualifyingTest | String | yes | "bonaFideResidence" or "physicalPresence" |
| bfResidenceStartDate | String | yes | date string |
| bfResidenceEndDate | String | yes | date string |
| physPresence12MonthStartDate | String | yes | |
| physPresence12MonthEndDate | String | yes | |
| foreignEarnedIncomeType | String | yes | |
| employerName | String | yes | |
| employerAddressForeign | String | yes | |
| foreignWagesAmount | BigDecimal | yes | |
| claimsHousingExclusion | Boolean | yes | |
| housingExpensesTotal | BigDecimal | yes | |
| housingLocationCountry | String | yes | |
| foreignEarnedIncomeExclusion | BigDecimal | yes | |
| housingExclusionAmount | BigDecimal | yes | |

### Form4972 (Lump-sum distribution tax)

One per participant born before Jan 2, 1936.

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| eligible | Boolean | yes | |
| payerName | String | yes | |
| box1GrossDistribution | BigDecimal | yes | from 1099-R |
| box2aTaxableAmount | BigDecimal | yes | |
| box3CapitalGain | BigDecimal | yes | |
| box6Nua | BigDecimal | yes | net unrealized appreciation |
| box8ActuarialValue | BigDecimal | yes | |
| box9aMultipleRecipientPct | BigDecimal | yes | |
| partII_line6CapitalGain | BigDecimal | yes | |
| partII_line7CapitalGainTax | BigDecimal | yes | |
| partIII_line8OrdinaryIncome | BigDecimal | yes | |
| partIII_line9DeathBenefit | BigDecimal | yes | |
| partIII_line10Taxable | BigDecimal | yes | |
| partIII_line11AnnuityValue | BigDecimal | yes | |
| partIII_line12Net | BigDecimal | yes | |
| partIII_line13OneTenth | BigDecimal | yes | |
| partIII_line14Mda | BigDecimal | yes | minimum distribution allowance |
| partIII_line15Reduced | BigDecimal | yes | |
| partIII_line16OneTenth | BigDecimal | yes | |
| partIII_line25TaxOnLine13 | BigDecimal | yes | |
| partIII_line28TaxOnLine16 | BigDecimal | yes | |
| partIII_line29TenYearTax | BigDecimal | yes | |
| line30Total | BigDecimal | yes | total tax |

### Form8814 (Election to report child's interest/dividends)

One per child; child gross income <$13,500.

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| childFirstName | String | yes | |
| childLastName | String | yes | |
| childSsn | String | yes | |
| line1aTaxableInterest | BigDecimal | yes | |
| line1bTaxExemptInterest | BigDecimal | yes | |
| line2aOrdinaryDividends | BigDecimal | yes | |
| line2bQualifiedDividends | BigDecimal | yes | |
| line3CapGainDistributions | BigDecimal | yes | |
| line4Total | BigDecimal | yes | |
| line6AboveBase | BigDecimal | yes | |
| line9QualifiedDividends | BigDecimal | yes | |
| line10CapGainDistributions | BigDecimal | yes | |
| line12OtherIncomeToSchedule1 | BigDecimal | yes | |
| line15ExtraTax | BigDecimal | yes | |

### Form4952Output (Investment interest expense)

One per return (MFJ combined); may have second AMT copy.

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| line1InvestmentInterestExpense | BigDecimal | yes | |
| line2DisallowedCarryforward | BigDecimal | yes | |
| line3TotalInvestmentInterestExpense | BigDecimal | yes | |
| line4aGrossInvestmentIncome | BigDecimal | yes | |
| line4bQualifiedDividends | BigDecimal | yes | |
| line4cInvestmentIncomeExcludingQualifiedDividends | BigDecimal | yes | |
| line4dNetGainFromDisposition | BigDecimal | yes | |
| line4eNetCapitalGainUsed | BigDecimal | yes | |
| line4fGainExcludingNetCapitalGain | BigDecimal | yes | |
| line4gElectedInvestmentIncome | BigDecimal | yes | |
| line4hInvestmentIncome | BigDecimal | yes | |
| line5InvestmentExpenses | BigDecimal | yes | |
| line6NetInvestmentIncome | BigDecimal | yes | |
| line7DisallowedCarryforward | BigDecimal | yes | |
| line8AllowableDeduction | BigDecimal | yes | |
| requiresAmtRecomputation | Boolean | yes | triggers AMT copy |

### Form1116 (Foreign tax credit)

One per income category (or summary).

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| incomeCategory | String | yes | category name |
| categoryCheckboxCode | String | yes | a/b/c/d/e/f |
| residentOfCountry | String | yes | |
| countries | List<Form1116Country> | yes | 1:N |
| totalGrossIncome | BigDecimal | yes | |
| totalNetForeignTi | BigDecimal | yes | |
| totalForeignTaxes | BigDecimal | yes | |
| carryoverFromPriorYears | BigDecimal | yes | |
| totalForeignTaxesAvail | BigDecimal | yes | |
| adjustedNetForeignTi | BigDecimal | yes | |
| worldwideTaxableIncome | BigDecimal | yes | |
| apportionmentFraction | BigDecimal | yes | |
| totalUsTax | BigDecimal | yes | |
| maximumCredit | BigDecimal | yes | |
| allowedCreditForCategory | BigDecimal | yes | |
| isSummaryForm | boolean | n/a | primitive |
| totalAllowedCredit | BigDecimal | yes | summary total across categories |
| simplifiedExceptionUsed | boolean | n/a | primitive |

### Form1116Country

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| countryOrTerritory | String | yes | |
| grossForeignIncome | BigDecimal | yes | |
| definitivelyRelatedDeds | BigDecimal | yes | |
| proRataDeductions | BigDecimal | yes | |
| homeInterest | BigDecimal | yes | |
| otherInterest | BigDecimal | yes | |
| foreignLosses | BigDecimal | yes | |
| totalDeductions | BigDecimal | yes | |
| netForeignIncome | BigDecimal | yes | |
| taxesPaid | boolean | n/a | primitive |
| datePaidOrAccrued | String | yes | |
| foreignTaxesPaidUsd | BigDecimal | yes | |

### Form6251 (AMT)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| line1aTotalDeductionsMinusSenior | BigDecimal | yes | |
| line1bAgiMinusLine1a | BigDecimal | yes | |
| line2aStateLocalTaxes | BigDecimal | yes | |
| line2bStateLocalRefund | BigDecimal | yes | |
| line2gPrivateActivityBondInterest | BigDecimal | yes | |
| line4AlternativeMinimumTaxableIncome | BigDecimal | yes | |
| line5Exemption | BigDecimal | yes | |
| line6AmtBaseAfterExemption | BigDecimal | yes | |
| line7TentativeMinimumTax | BigDecimal | yes | |
| line7ComputationPath | String | yes | path identifier |
| line8AmtForeignTaxCredit | BigDecimal | yes | |
| line9TentativeMinimumTaxAfterFtc | BigDecimal | yes | |
| line10RegularTaxAdjusted | BigDecimal | yes | |
| line11AlternativeMinimumTax | BigDecimal | yes | |
| line12AmtBase | BigDecimal | yes | |
| line13QualifiedDividendAndCapitalGainAmount | BigDecimal | yes | |
| line14ScheduleDLine19 | BigDecimal | yes | |
| line15AdjustedCapitalGainAmount | BigDecimal | yes | |
| line16SmallerOfLine12OrLine15 | BigDecimal | yes | |
| line17OrdinaryAmti | BigDecimal | yes | |
| line18TaxOnLine17 | BigDecimal | yes | |
| line19ZeroRateThreshold | BigDecimal | yes | |
| line20RegularTaxWorksheetAmount | BigDecimal | yes | |
| line21ZeroRateRoom | BigDecimal | yes | |
| line22SmallerOfLine12OrLine13 | BigDecimal | yes | |
| line23AmountTaxedAtZeroPct | BigDecimal | yes | |
| line24Line22MinusLine23 | BigDecimal | yes | |
| line25FifteenPctThreshold | BigDecimal | yes | |
| line26AmountFromLine21 | BigDecimal | yes | |
| line27QdcgtwOrSdtwAmount | BigDecimal | yes | |
| line28Line26PlusLine27 | BigDecimal | yes | |
| line29Line25MinusLine28 | BigDecimal | yes | |
| line30SmallerOfLine24OrLine29 | BigDecimal | yes | |
| line31FifteenPctTax | BigDecimal | yes | |
| line32Line23PlusLine30 | BigDecimal | yes | |
| line33Line22MinusLine32 | BigDecimal | yes | |
| line34TwentyPctTax | BigDecimal | yes | |
| line35Line17PlusLine32PlusLine33 | BigDecimal | yes | |
| line36Line12MinusLine35 | BigDecimal | yes | |
| line37TwentyFivePctTax | BigDecimal | yes | |
| line38AddLines18_31_34_37 | BigDecimal | yes | |
| line39TaxOnLine12AtDirectRates | BigDecimal | yes | |
| line40SmallestOf38Or39 | BigDecimal | yes | |

### Form8949 (Sales/dispositions of capital assets)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| required | Boolean | yes | |
| requirementReason | String | yes | |
| pages | List<Form8949Page> | yes | 1:N pages |

### Form8949Page

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| part | String | yes | "I" or "II" |
| term | String | yes | "short" or "long" |
| box | String | yes | A/B/C (Part I) or D/E/F (Part II) |
| pageSequence | Integer | yes | |
| scheduleDLineReference | String | yes | |
| transactions | List<Form8949Transaction> | yes | 1:N |
| totalProceeds | BigDecimal | yes | |
| totalCostOrOtherBasis | BigDecimal | yes | |
| totalAdjustments | BigDecimal | yes | |
| totalGainOrLoss | BigDecimal | yes | |

### Form8949Transaction

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| source | String | yes | broker/statement source |
| descriptionOfProperty | String | yes | |
| dateAcquired | String | yes | |
| dateSoldOrDisposed | String | yes | |
| proceeds | BigDecimal | yes | |
| costOrOtherBasis | BigDecimal | yes | |
| adjustmentCode | String | yes | IRS adjustment code |
| adjustmentAmount | BigDecimal | yes | |
| gainOrLoss | BigDecimal | yes | |
| notes | String | yes | |

### Form8962 (Premium tax credit)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| line1TaxFamilySize | Integer | yes | |
| line2aModifiedAgiTaxpayer | BigDecimal | yes | |
| line2bDependentsModifiedAgi | BigDecimal | yes | |
| line3HouseholdIncome | BigDecimal | yes | |
| line4aCheckBelowFplException | Boolean | yes | |
| line4bCheckLineZero | Boolean | yes | |
| line4cCheckAlternativeCalculation | Boolean | yes | |
| line5FederalPovertyLine | BigDecimal | yes | |
| line6HouseholdIncomeAsPctOfFpl | Integer | yes | |
| line7ApplicableFigure | BigDecimal | yes | |
| line8aAnnualContributionAmount | BigDecimal | yes | |
| line8bMonthlyContributionAmount | BigDecimal | yes | |
| line9UnemploymentCompensation | Boolean | yes | |
| line10EmployerCoverageAffordability | Boolean | yes | |
| line11AnnualColAEnrollmentPremiums | BigDecimal | yes | |
| line11AnnualColBSlcspPremium | BigDecimal | yes | |
| line11AnnualColCContributionAmount | BigDecimal | yes | |
| line11AnnualColDMaxPremiumAssistance | BigDecimal | yes | |
| line11AnnualColECreditClaimed | BigDecimal | yes | |
| line11AnnualColFAptcPaid | BigDecimal | yes | |
| monthlyRows | List<Form8962MonthlyRow> | yes | 1:N (up to 12) |
| line24TotalPremiumTaxCredit | BigDecimal | yes | |
| line25AdvancePaymentOfPtc | BigDecimal | yes | |
| line26NetPremiumTaxCredit | BigDecimal | yes | |
| line27ExcessAdvancePayment | BigDecimal | yes | |
| line28RepaymentLimitation | BigDecimal | yes | |
| line29RepaymentAmount | BigDecimal | yes | |
| policyAllocations | List<Form8962PolicyAllocation> | yes | 1:N |
| line34UseAlternativeCalculation | Boolean | yes | |
| line35aAltCalcMonthsTaxpayer | Integer | yes | |
| line35bAltCalcCoverageMonthsTaxpayer | Integer | yes | |
| line35cAltCalcMonthsSpouse | Integer | yes | |
| line35dAltCalcCoverageMonthsSpouse | Integer | yes | |
| line35eAltCalcMonthlyContributionTaxpayer | BigDecimal | yes | |
| line35fAltCalcMonthlySlcspTaxpayer | BigDecimal | yes | |
| line35gAltCalcMonthlyContributionSpouse | BigDecimal | yes | |
| line35hAltCalcMonthlySlcspSpouse | BigDecimal | yes | |

### Form8962MonthlyRow

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| month | String | yes | "January".."December" |
| colAEnrollmentPremiums | BigDecimal | yes | |
| colBSlcspPremium | BigDecimal | yes | |
| colCContributionAmount | BigDecimal | yes | |
| colDMaxPremiumAssistance | BigDecimal | yes | |
| colECreditClaimed | BigDecimal | yes | |
| colFAptcPaid | BigDecimal | yes | |

### Form8962PolicyAllocation

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| policyNumber | String | yes | |
| otherTaxpayerSsn | String | yes | |
| premiumAllocationPct | BigDecimal | yes | |
| slcspAllocationPct | BigDecimal | yes | |
| aptcAllocationPct | BigDecimal | yes | |
| allocationStartMonth | Integer | yes | 1..12 |
| allocationStopMonth | Integer | yes | 1..12 |

### Form8995 (QBI deduction — simplified)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| qualifiedBusinessIncomeAmount | BigDecimal | yes | |
| priorYearQualifiedBusinessLossCarryforward | BigDecimal | yes | |
| netQualifiedBusinessIncomeAfterCarryforward | BigDecimal | yes | |
| qualifiedReitAndPtpAmount | BigDecimal | yes | |
| priorYearReitPtpLossCarryforward | BigDecimal | yes | |
| tentativeQualifiedBusinessIncomeDeduction | BigDecimal | yes | |
| taxableIncomeBeforeQualifiedBusinessIncomeDeduction | BigDecimal | yes | |
| netCapitalGainAndQualifiedDividends | BigDecimal | yes | |
| taxableIncomeLimitation | BigDecimal | yes | |
| line15QualifiedBusinessIncomeDeduction | BigDecimal | yes | |

### Form8995A (QBI deduction — above threshold)

Same as Form8995 plus line39 (replaces line15).

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| qualifiedBusinessIncomeAmount | BigDecimal | yes | |
| priorYearQualifiedBusinessLossCarryforward | BigDecimal | yes | |
| netQualifiedBusinessIncomeAfterCarryforward | BigDecimal | yes | |
| qualifiedReitAndPtpAmount | BigDecimal | yes | |
| priorYearReitPtpLossCarryforward | BigDecimal | yes | |
| tentativeQualifiedBusinessIncomeDeduction | BigDecimal | yes | |
| taxableIncomeBeforeQualifiedBusinessIncomeDeduction | BigDecimal | yes | |
| netCapitalGainAndQualifiedDividends | BigDecimal | yes | |
| taxableIncomeLimitation | BigDecimal | yes | |
| line39QualifiedBusinessIncomeDeduction | BigDecimal | yes | |

### Form8880 (Saver's credit)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| line1a | BigDecimal | yes | IRA + ABLE contributions (taxpayer) |
| line2a | BigDecimal | yes | Elective deferrals (taxpayer) |
| line3a | BigDecimal | yes | = line1a + line2a |
| line4a | BigDecimal | yes | Distributions in lookback window |
| line5a | BigDecimal | yes | = max(0, line3a - line4a) |
| line6a | BigDecimal | yes | = min(line5a, 2000) |
| line1b | BigDecimal | yes | spouse |
| line2b | BigDecimal | yes | spouse |
| line3b | BigDecimal | yes | spouse |
| line4b | BigDecimal | yes | spouse (MFJ combined distributions) |
| line5b | BigDecimal | yes | spouse |
| line6b | BigDecimal | yes | spouse |
| line7 | BigDecimal | yes | = line6a + line6b |
| line8 | BigDecimal | yes | AGI |
| line9 | BigDecimal | yes | credit rate (0.5/0.2/0.1/0.0) |
| line10 | BigDecimal | yes | = line7 × line9 |
| line11 | BigDecimal | yes | tax liability limit |
| line12 | BigDecimal | yes | final credit → Schedule 3 line 4 |
| taxpayerDisqualified | Boolean | yes | age<18/student/dependent |
| spouseDisqualified | Boolean | yes | |
| agiExceedsLimit | Boolean | yes | |

### Form8801 (Credit for prior-year minimum tax)

Header + lines 1–55 all BigDecimal. Includes routing fields.

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| priorYearFilingStatus | String | yes | |
| priorYearFiledForm2555 | Boolean | yes | |
| usesPartIII | Boolean | yes | |
| filedWithReturn | Boolean | yes | |
| line11ComputationMethod | String | yes | |
| note | String | yes | |
| line1..line55 | BigDecimal | yes | 55 numeric line fields (line1, line2, … line55) |

### Form8396 (Mortgage interest credit)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| filedWithReturn | Boolean | yes | |
| qualifiedMcc | Boolean | yes | |
| mainHomeQualified | Boolean | yes | |
| interestPaidToRelatedPerson | Boolean | yes | |
| certificateNumber | String | yes | |
| homeAddress | String | yes | |
| note | String | yes | |
| certificateCreditRatePercent | BigDecimal | yes | |
| scheduleAMortgageInterestReductionAmount | BigDecimal | yes | |
| scheduleAReductionApplied | Boolean | yes | |
| line1..line17 | BigDecimal | yes | 17 numeric line fields |

### Form8834 (Qualified electric vehicle credit)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| filedWithReturn | Boolean | yes | |
| note | String | yes | |
| line1 | BigDecimal | yes | |
| line2 | BigDecimal | yes | |
| line3a | BigDecimal | yes | |
| line3b | BigDecimal | yes | |
| line3c | BigDecimal | yes | |
| line4 | BigDecimal | yes | |
| line5 | BigDecimal | yes | |
| line6 | BigDecimal | yes | |
| line7 | BigDecimal | yes | |

### Form8859 (DC first-time homebuyer carryforward)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| filedWithReturn | Boolean | yes | |
| schedule8812WorksheetBOverrideUsed | Boolean | yes | |
| note | String | yes | |
| line2Form1040Line18 | BigDecimal | yes | |
| line2AdjustedLine19 | BigDecimal | yes | |
| line2OtherCreditsTotal | BigDecimal | yes | |
| line1 | BigDecimal | yes | |
| line2 | BigDecimal | yes | |
| line3 | BigDecimal | yes | |
| line4 | BigDecimal | yes | |

### Form8862 (Information to claim certain credits after disallowance)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| filedWithReturn | boolean | n/a | primitive |
| taxYearOfDisallowance | Integer | yes | |
| claimsEIC | boolean | n/a | primitive |
| claimsCTC | boolean | n/a | primitive |
| claimsAOTC | boolean | n/a | primitive |
| eicEligible | Boolean | yes | |
| eicLine3OnlyIncomeError | Boolean | yes | |
| ctcEligible | Boolean | yes | |
| aotcEligible | Boolean | yes | |
| aotcStudentEligible | List<Boolean> | yes | per-student eligibility |

### Form8863 (Education credits)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | Form8863Header | yes | not ScheduleHeader |
| students | List<Form8863Student> | yes | 1:N |
| studentCount | Integer | yes | |
| magiForPhaseout | BigDecimal | yes | |
| magiExceedsPhaseoutCeiling | Boolean | yes | |
| line1TotalAotcBeforePhaseout | BigDecimal | yes | |
| line7AllowableAotc | BigDecimal | yes | |
| line8RefundableAotc | BigDecimal | yes | →Form1040 line 29 |
| line19NonrefundableEducationCredits | BigDecimal | yes | →Schedule 3 line 3 |

### Form8863Header

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| name | String | yes | |
| ssn | String | yes | |

### Form8863Student

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| studentName | String | yes | |
| studentSsn | String | yes | |
| creditType | String | yes | "AOTC" or "LLC" |
| adjustedQualifiedEducationExpenses | BigDecimal | yes | |
| institution1Name | String | yes | |
| institution1Address | String | yes | |
| perStudentLine30 | BigDecimal | yes | AOTC tentative credit |
| perStudentLlcExpenses | BigDecimal | yes | |

### Form8839 (Adoption credit & exclusion)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| children | List<Form8839Child> | no (init) | 1:N |
| part2Line3NoPriorYearForm | Boolean | yes | |
| part2Line3YesPriorYearForm | Boolean | yes | |
| part2Line7ModifiedAgi | BigDecimal | yes | |
| part2Line8MagiNotMoreThanThreshold | Boolean | yes | |
| part2Line8MagiMoreThanThreshold | Boolean | yes | |
| part2Line8MagiExcess | BigDecimal | yes | |
| part2Line9PhaseoutFraction | BigDecimal | yes | |
| part2Line12TotalAfterPhaseout | BigDecimal | yes | sum per-child line 11a |
| part2Line11cTotalRefundableBase | BigDecimal | yes | |
| part2Line13RefundableAdoptionCredit | BigDecimal | yes | |
| part2Line15CreditCarryforward | BigDecimal | yes | |
| part2Line16TotalAvailableCredit | BigDecimal | yes | |
| part2Line17CreditLimit | BigDecimal | yes | |
| part2Line18NonrefundableAdoptionCredit | BigDecimal | yes | →Schedule 3 line 6c |
| part3Line20NoPriorYearBenefits | Boolean | yes | |
| part3Line20YesPriorYearBenefits | Boolean | yes | |
| part3Line23TotalBenefits | BigDecimal | yes | |
| part3Line25ModifiedAgi | BigDecimal | yes | |
| part3Line26MagiNotMoreThanThreshold | Boolean | yes | |
| part3Line26MagiMoreThanThreshold | Boolean | yes | |
| part3Line26MagiExcess | BigDecimal | yes | |
| part3Line27PhaseoutFraction | BigDecimal | yes | |
| part3Line30TotalExcludedBenefits | BigDecimal | yes | |
| part3Line31Line30NotMoreThanLine23 | Boolean | yes | |
| part3Line31Line30MoreThanLine23 | Boolean | yes | |
| part3Line31TaxableBenefits | BigDecimal | yes | |
| section1372DisallowedFromW2BoxT | BigDecimal | yes | |

### Form8839Child

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| firstName | String | yes | |
| lastName | String | yes | |
| yearOfBirth | String | yes | |
| bornBefore2008AndDisabled | Boolean | yes | |
| specialNeeds | Boolean | yes | |
| foreignChild | Boolean | yes | |
| identifyingNumber | String | yes | |
| adoptionFinal2025OrEarlier | Boolean | yes | |
| part2Line2MaxCredit | BigDecimal | yes | |
| part2Line3PriorYearAmount | BigDecimal | yes | |
| part2Line4RemainingCredit | BigDecimal | yes | |
| part2Line5QualifiedExpenses | BigDecimal | yes | |
| part2Line6SmallerOf4Or5 | BigDecimal | yes | |
| part2Line10PhaseoutAmount | BigDecimal | yes | |
| part2Line11aCreditAfterPhaseout | BigDecimal | yes | |
| part2Line11bRefundableBase | BigDecimal | yes | |
| part3Line19MaxExclusion | BigDecimal | yes | |
| part3Line20PriorYearBenefits | BigDecimal | yes | |
| part3Line21RemainingExclusion | BigDecimal | yes | |
| part3Line22BenefitsReceived | BigDecimal | yes | |
| part3DeferredPriorYearForeignBenefits | BigDecimal | yes | |
| part3Line24SmallerOf21Or22 | BigDecimal | yes | |
| part3Line28PhaseoutAmount | BigDecimal | yes | |
| part3Line29ExcludedBenefits | BigDecimal | yes | |

### Form8911 (Alt fuel vehicle refueling property credit — return-level)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| filedWithReturn | Boolean | yes | |
| note | String | yes | |
| itemATotalQualifiedRefuelingProperties | Integer | yes | |
| line1 | BigDecimal | yes | |
| line2 | BigDecimal | yes | |
| line3 | BigDecimal | yes | |
| line4 | BigDecimal | yes | |
| line5 | BigDecimal | yes | |
| line6a | BigDecimal | yes | |
| line6b | BigDecimal | yes | |
| line6c | BigDecimal | yes | |
| line7 | BigDecimal | yes | |
| line8 | BigDecimal | yes | |
| line9 | BigDecimal | yes | |
| line10 | BigDecimal | yes | |

### Form8911ScheduleA (per-property)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| ownerType | String | yes | |
| ownerDisplayName | String | yes | |
| propertyIndex | Integer | yes | |
| filedWithReturn | Boolean | yes | |
| eligibleForForm8911 | Boolean | yes | |
| note | String | yes | |
| line1RegistrationNumber | String | yes | |
| line2PropertyDescription | String | yes | |
| line3OwnerNameTinIfDifferent | String | yes | |
| line4PropertyLocation | String | yes | |
| line5ConstructionBeganDate | String | yes | |
| line6PlacedInServiceDate | String | yes | |
| line6aEligibleCensusTract | Boolean | yes | |
| line6bEligibleCensusTractGeoid | String | yes | |
| line7CertificationPermitNumber | String | yes | |
| line8Cost | BigDecimal | yes | |
| line9BusinessInvestmentUsePercentage | BigDecimal | yes | |
| line10BusinessInvestmentUseCost | BigDecimal | yes | |
| line11Section179Deduction | BigDecimal | yes | |
| line12AdjustedBusinessInvestmentCost | BigDecimal | yes | |
| line13PwaRequirementsMet | Boolean | yes | |
| line14TentativeBusinessCredit | BigDecimal | yes | |
| line15BusinessCreditCap | BigDecimal | yes | |
| line16BusinessInvestmentCredit | BigDecimal | yes | |
| line17InstalledAtMainHome | Boolean | yes | |
| line18PersonalUseCost | BigDecimal | yes | |
| line19TentativePersonalUseCredit | BigDecimal | yes | |
| line20PersonalCreditCap | BigDecimal | yes | |
| line21PersonalUseCredit | BigDecimal | yes | |
| schedule3Line6jContribution | BigDecimal | yes | |

### Form8936ScheduleA (Clean vehicle credit — per vehicle)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| ownerType | String | yes | |
| ownerDisplayName | String | yes | |
| vehicleIndex | Integer | yes | |
| vehicleCreditPath | String | yes | "new"/"previouslyOwned"/"commercial" |
| filedWithReturn | Boolean | yes | |
| eligibleForSchedule3 | Boolean | yes | |
| unsupportedBusinessUse | Boolean | yes | |
| unsupportedCommercialVehicle | Boolean | yes | |
| note | String | yes | |
| line1aYear | Integer | yes | |
| line1bMake | String | yes | |
| line1cModel | String | yes | |
| line2Vin | String | yes | |
| line3PlacedInServiceDate | String | yes | |
| line4aCreditTransferredToDealer | Boolean | yes | |
| line4aTransferredAmount | BigDecimal | yes | |
| line4bRecaptureCheckbox | Boolean | yes | |
| line5NewCleanVehicle | Boolean | yes | |
| line6PreviouslyOwnedCleanVehicle | Boolean | yes | |
| line7QualifiedCommercialCleanVehicle | Boolean | yes | |
| line8aResoldWithin30Days | Boolean | yes | |
| line8bFilingIndividualReturn | Boolean | yes | |
| line8cCurrentYearMagiAboveLimit | Boolean | yes | |
| line8dPriorYearMagiAboveLimit | Boolean | yes | |
| line8eAcquiredForUseOrLeaseNotResale | Boolean | yes | |
| line9TentativeCreditAmount | BigDecimal | yes | |
| line10BusinessUsePercentage | BigDecimal | yes | |
| line11BusinessInvestmentCreditAmount | BigDecimal | yes | |
| line12PersonalUseCreditAmount | BigDecimal | yes | |
| line13aResoldWithin30Days | Boolean | yes | |
| line13bCurrentYearMagiAboveLimit | Boolean | yes | |
| line13cPriorYearMagiAboveLimit | Boolean | yes | |
| line13dClaimedPreviouslyOwnedCreditInPrior3Years | Boolean | yes | |
| line13eSalesPriceAboveLimit | Boolean | yes | |
| line13fAcquiredForUseNotResale | Boolean | yes | |
| line13gCanBeClaimedAsDependent | Boolean | yes | |
| line14SalesPrice | BigDecimal | yes | |
| line15ThirtyPercentOfSalesPrice | BigDecimal | yes | |
| line16MaximumCredit | BigDecimal | yes | |
| line17PreviouslyOwnedCreditAmount | BigDecimal | yes | |
| currentYearMagi | BigDecimal | yes | |
| priorYearMagi | BigDecimal | yes | |
| schedule3Line6fContribution | BigDecimal | yes | |
| schedule3Line6mContribution | BigDecimal | yes | |

### Form5695 (Residential energy credits)

Has `primaryForm` flag + `formIndex` to support multiple copies (supplemental Part II only).

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| formIndex | Integer | yes | |
| primaryForm | Boolean | yes | |
| supplementalPartIiOnly | Boolean | yes | |
| moreThanOneMainHome | Boolean | yes | |
| note | String | yes | |
| line5aBatteryCapacityAtLeast3kwh | Boolean | yes | |
| line7aFuelCellInstalledOnMainHomeInUs | Boolean | yes | |
| line7bMainHomeAddress | String | yes | |
| line7cJointOccupants | Boolean | yes | |
| partIAdditionalResidenceAddresses | List<String> | no (init) | |
| line1..line4 | BigDecimal | yes | |
| line5b, line6a, line6b | BigDecimal | yes | |
| line8..line16 | BigDecimal | yes | |
| line17aMainHomeInUs | Boolean | yes | |
| line17bOriginalUser | Boolean | yes | |
| line17cExpectedToRemainFiveYears | Boolean | yes | |
| line17dMainHomeAddress | String | yes | |
| line17eRelatedToConstruction | Boolean | yes | |
| line18a | BigDecimal | yes | |
| line18b | BigDecimal | yes | |
| line19DoorItems | List<Form5695QualifiedCostItem> | no (init) | |
| line19OtherDoorsCost | BigDecimal | yes | |
| line19f, line19g, line19h | BigDecimal | yes | |
| line20WindowItems | List<Form5695QualifiedCostItem> | no (init) | |
| line20bOtherWindowsCost | BigDecimal | yes | |
| line20c, line20d | BigDecimal | yes | |
| line21aQualifiedEnergyPropertyInstalled | Boolean | yes | |
| line21bOriginalUser | Boolean | yes | |
| line21cResidenceAddresses | List<String> | no (init) | |
| line22CentralAirConditioners | List<Form5695QualifiedCostItem> | no (init) | |
| line22bOtherCosts | BigDecimal | yes | |
| line22c, line22d | BigDecimal | yes | |
| line23WaterHeaters | List<Form5695QualifiedCostItem> | no (init) | |
| line23bOtherCosts | BigDecimal | yes | |
| line23c, line23d | BigDecimal | yes | |
| line24FurnacesBoilers | List<Form5695QualifiedCostItem> | no (init) | |
| line24bOtherCosts | BigDecimal | yes | |
| line24c, line24d | BigDecimal | yes | |
| line25aInstalledSameYear | Boolean | yes | |
| line25bEnabledPropertyCode | String | yes | |
| line25cEnablingPropertyCosts | BigDecimal | yes | |
| line25dQmids | List<String> | no (init) | |
| line25e | BigDecimal | yes | |
| line26aQualifiedAudit | Boolean | yes | |
| line26b, line26c | BigDecimal | yes | |
| line27, line28 | BigDecimal | yes | |
| line29HeatPumps | List<Form5695QualifiedCostItem> | no (init) | |
| line29bOtherHeatPumpsCost | BigDecimal | yes | |
| line29HeatPumpWaterHeaters | List<Form5695QualifiedCostItem> | no (init) | |
| line29dOtherHeatPumpWaterHeaterCost | BigDecimal | yes | |
| line29BiomassStovesBoilers | List<Form5695QualifiedCostItem> | no (init) | |
| line29fOtherBiomassCost | BigDecimal | yes | |
| line29g, line29h | BigDecimal | yes | |
| line30, line31, line32 | BigDecimal | yes | |
| line32aJointOccupants | Boolean | yes | |
| line32bCondominiumOrCooperative | Boolean | yes | |

### Form5695QualifiedCostItem

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| description | String | yes | |
| qmid | String | yes | qualified manufacturer ID |
| cost | BigDecimal | yes | |

### Form8912 (Credit to holders of tax credit bonds)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| filedWithReturn | Boolean | yes | |
| note | String | yes | |
| partIIIEntries | List<Form8912PartIIIEntry> | yes | 1:N |
| partIVEntries | List<Form8912DirectBondEntry> | yes | 1:N |
| line1, line2, line3, line4 | BigDecimal | yes | |
| line7, line8, line9 | BigDecimal | yes | |
| line10a, line10b, line10c, line10d, line10e | BigDecimal | yes | |
| line11, line12, line14 | BigDecimal | yes | |

### Form8912PartIIIEntry

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| issuerName | String | yes | |
| issuerEin | String | yes | |
| uniqueIdentifier | String | yes | |
| creditAmount | BigDecimal | yes | |

### Form8912DirectBondEntry

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| bondType | String | yes | |
| issuerName | String | yes | |
| issuerCityState | String | yes | |
| issuerEin | String | yes | |
| issueDate | String | yes | |
| maturityDate | String | yes | |
| disposalDate | String | yes | |
| cusipOrPaymentDates | String | yes | |
| basisAmount | BigDecimal | yes | |
| creditRatePercent | BigDecimal | yes | |
| allocationPercentage | BigDecimal | yes | |
| line19BaseCreditAmount | BigDecimal | yes | |
| line20AllowedCreditAmount | BigDecimal | yes | |
| issueDateEligible | Boolean | yes | |

### Form4868 (Application for automatic extension)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| filedWithReturn | Boolean | yes | |
| planningJointReturn | Boolean | yes | |
| filedByElectronicPaymentSubstitute | Boolean | yes | |
| filingMethod | String | yes | |
| line1Names | String | yes | |
| addressLine1 | String | yes | |
| addressLine2 | String | yes | |
| cityStatePostal | String | yes | |
| line2PrimarySsn | String | yes | |
| line3SpouseSsn | String | yes | |
| fiscalYearBegin | String | yes | |
| fiscalYearEnd | String | yes | |
| line4 | BigDecimal | yes | |
| line5 | BigDecimal | yes | |
| line6 | BigDecimal | yes | |
| line7 | BigDecimal | yes | |
| line8 | Boolean | yes | |
| line9 | Boolean | yes | |
| paymentMethod | String | yes | |
| paymentDate | String | yes | |
| confirmationNumber | String | yes | |
| note | String | yes | |

### Form8959 (Additional Medicare Tax — currently out of scope, model exists)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| line1MedicareWages | BigDecimal | yes | |
| line2UnreportedTips | BigDecimal | yes | |
| line3UncollectedWages | BigDecimal | yes | |
| line4TotalMedicareWages | BigDecimal | yes | |
| line5Threshold | BigDecimal | yes | |
| line6ExcessMedicareWages | BigDecimal | yes | |
| line7PartITax | BigDecimal | yes | |
| line14RrtaCompensation | BigDecimal | yes | |
| line15RrtaThreshold | BigDecimal | yes | |
| line16ExcessRrta | BigDecimal | yes | |
| line17PartIIITax | BigDecimal | yes | |
| line18TotalAdditionalMedicareTax | BigDecimal | yes | |
| line19MedicareTaxWithheld | BigDecimal | yes | |
| line20MedicareWages | BigDecimal | yes | |
| line21RegularMedicareWithholding | BigDecimal | yes | |
| line22AmtWithheldOnWages | BigDecimal | yes | |
| line23RrtaAmtWithheld | BigDecimal | yes | |
| line24TotalAmtWithheld | BigDecimal | yes | |

### Form2210 (Underpayment of estimated tax penalty)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| currentYearTax | BigDecimal | yes | |
| otherTaxes | BigDecimal | yes | |
| combinedTax | BigDecimal | yes | |
| refundableCredits | BigDecimal | yes | |
| netTaxBasis | BigDecimal | yes | |
| ninetyPctCurrentYear | BigDecimal | yes | |
| priorYearTax | BigDecimal | yes | |
| priorYearSafeHarbor | BigDecimal | yes | |
| requiredAnnualPayment | BigDecimal | yes | |
| totalPayments | BigDecimal | yes | |
| boxAFullWaiver | Boolean | yes | |
| boxBPartialWaiver | Boolean | yes | |
| boxCAnnualizedIncome | Boolean | yes | |
| boxDActualDates | Boolean | yes | |
| boxEJointSeparate | Boolean | yes | |
| computationMethod | String | yes | |
| requiredInstallments | BigDecimal[] | yes | 4-element array (quarters) |
| estimatedPayments | BigDecimal[] | yes | 4-element |
| withholdings | BigDecimal[] | yes | 4-element |
| overpaymentCarry | BigDecimal[] | yes | 4-element |
| underpayments | BigDecimal[] | yes | 4-element |
| daysUnderpaid | Integer[] | yes | 4-element |
| periodPenalties | BigDecimal[] | yes | 4-element |
| totalPenalty | BigDecimal | yes | →AmountOwed.estimatedTaxPenalty |

Note: arrays should be normalized to a 1:N child table (period_index 0..3).

### Form8888 (Allocation of refund among accounts)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| names | String | yes | name(s) shown on return |
| ssn | String | yes | primary SSN |
| account1Amount | BigDecimal | yes | |
| account1Routing | String | yes | 9-digit |
| account1Type | String | yes | "checking"\|"savings" |
| account1Number | String | yes | up to 17 chars |
| account2Amount | BigDecimal | yes | |
| account2Routing | String | yes | |
| account2Type | String | yes | |
| account2Number | String | yes | |
| account3Amount | BigDecimal | yes | |
| account3Routing | String | yes | |
| account3Type | String | yes | |
| account3Number | String | yes | |
| totalAllocated | BigDecimal | yes | line 5 |
| refundFromReturn | BigDecimal | yes | snapshot of Form1040 line 35a |
| totalMatchesRefund | Boolean | yes | mismatch raises flag |

Note: 3 account slots could be normalized to a 1:N child table.

### ScheduleR (Credit for the elderly/disabled)

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| partIBoxChecked | Integer | yes | box 1-9 selector |
| taxpayerAgeQualified | Boolean | yes | |
| taxpayerDisabilityQualified | Boolean | yes | |
| spouseAgeQualified | Boolean | yes | |
| spouseDisabilityQualified | Boolean | yes | |
| taxpayerPartIIRequired | Boolean | yes | |
| spousePartIIRequired | Boolean | yes | |
| taxpayerExistingPhysicianStatement | Boolean | yes | |
| spouseExistingPhysicianStatement | Boolean | yes | |
| mfsLivedApartAllYear | Boolean | yes | |
| qualifiedIndividual | Boolean | yes | |
| filedWithReturn | Boolean | yes | |
| note | String | yes | |
| line10..line12, line13a, line13b, line13c, line14..line22 | BigDecimal | yes | |

### Form4852 (Substitute for W-2/1099-R)

One per missing W-2 or 1099-R per person.

| Field | Java type | Nullable | Notes |
|---|---|---|---|
| header | ScheduleHeader | yes | |
| filedWithReturn | Boolean | yes | |
| line1NameShownOnReturn | String | yes | |
| line2YourSocialSecurityNumber | String | yes | |
| line3Address | String | yes | |
| line4TaxYear | String | yes | |
| line4IsFormW2 | Boolean | yes | |
| line4IsForm1099R | Boolean | yes | |
| line5EmployerOrPayerNameAddressZip | String | yes | |
| line6EmployerOrPayerTin | String | yes | |
| line7aWagesTipsOtherCompensation | BigDecimal | yes | |
| line7bSocialSecurityWages | BigDecimal | yes | |
| line7cMedicareWagesAndTips | BigDecimal | yes | |
| line7dSocialSecurityTips | BigDecimal | yes | |
| line7eFederalIncomeTaxWithheld | BigDecimal | yes | |
| line7fStateIncomeTaxWithheld | BigDecimal | yes | |
| line7fStateName | String | yes | |
| line7gLocalIncomeTaxWithheld | BigDecimal | yes | |
| line7gLocalityName | String | yes | |
| line7hSocialSecurityTaxWithheld | BigDecimal | yes | |
| line7iMedicareTaxWithheld | BigDecimal | yes | |
| line8aGrossDistribution | BigDecimal | yes | |
| line8bTaxableAmount | BigDecimal | yes | |
| line8cTaxableAmountNotDetermined | Boolean | yes | |
| line8dTotalDistribution | Boolean | yes | |
| line8eCapitalGain | BigDecimal | yes | |
| line8fFederalIncomeTaxWithheld | BigDecimal | yes | |
| line8gStateIncomeTaxWithheld | BigDecimal | yes | |
| line8gStateName | String | yes | |
| line8hLocalIncomeTaxWithheld | BigDecimal | yes | |
| line8hLocalityName | String | yes | |
| line8iEmployeeContributions | BigDecimal | yes | |
| line8jDistributionCodes | String | yes | |
| line8jIraSepSimple | Boolean | yes | |
| line9HowAmountsWereDetermined | String | yes | |
| line10EffortsToObtainMissingOrCorrectedForm | String | yes | |
| note | String | yes | |

---

## Notes for SQL schema design

1. **Common parentage**: most special forms hang off the tax return (or computation snapshot). Add `tax_return_id` FK on every top-level form table.
2. **Per-person scoping**: `Form8606`, `Form2555`, `Form4972`, `Form4852` are per-person (taxpayer/spouse) — add `owner` discriminator column ("taxpayer" or "spouse").
3. **Per-child / per-vehicle / per-property**: `Form8814` (per child), `Form8839Child` (per child), `Form8936ScheduleA` (per vehicle), `Form8911ScheduleA` (per property), `Form5695` (per copy via formIndex). Add stable `child_id`/`vehicle_index`/`property_index`/`form_index`.
4. **Multi-category**: `Form1116` is per-income-category plus summary — composite key on (`tax_return_id`, `income_category`).
5. **`ScheduleHeader`** is denormalizable (just name+ssn) — copy onto each form row rather than join.
6. **Lists** become child tables with FK to parent: Form4137Employer, Form2441CareProvider/QualifyingPerson, Form8919Firm, Form8949Page→Transaction, Form8962MonthlyRow/PolicyAllocation, Form8912PartIIIEntry/DirectBondEntry, Form5695QualifiedCostItem, Form8839Child, plus the `List<String>` address/QMID lists in Form5695.
7. **Form2210 arrays**: 4-element arrays (`requiredInstallments`, `estimatedPayments`, `withholdings`, `overpaymentCarry`, `underpayments`, `daysUnderpaid`, `periodPenalties`) — normalize to a `form2210_period` table with `period_index` 0..3.
8. **Form8888 accounts**: 3-slot account layout — normalize to `form8888_account` child table with `account_index` 1..3.
9. **Form8801 line1..line55** and **Form8396 line1..line17**: many numeric line columns — consider an EAV `form_line_value(form_id, line_number, value)` if you want flexibility, or keep wide columns for query simplicity.
10. **Enum-ish String fields** (good candidates for CHECK constraints):
    - `Form8606.owner`: "taxpayer" | "spouse"
    - `Form2555.qualifyingTest`: "bonaFideResidence" | "physicalPresence"
    - `Form1116.categoryCheckboxCode`: a/b/c/d/e/f
    - `Form8862` flag bundles (claimsEIC/CTC/AOTC)
    - `Form8863Student.creditType`: "AOTC" | "LLC"
    - `Form8888.accountNType`: "checking" | "savings"
    - `Form8949Page.part`/`term`/`box`
    - `Form8919Firm.reasonCode`: A..G
    - `Form8936ScheduleA.vehicleCreditPath`: "new"/"previouslyOwned"/"commercial"
    - `Form4972.eligible` + `Form8814.line7bScheduleDNotRequired`-style booleans
11. **Date storage**: Many "date" fields are typed `String` (ISO-ish) rather than `LocalDate` — at SQL level, store as DATE if validated, otherwise VARCHAR.
12. **All BigDecimal columns**: model as `DECIMAL(15,2)` or `NUMERIC(18,4)` for percentages/fractions.
13. **`isSummaryForm`, `taxesPaid`, `simplifiedExceptionUsed` (Form1116) and `Form8862` flags** are primitive `boolean` in Java — NOT NULL at DB level (with default false).
14. **Out of scope but modeled**: `Form8959` is in the codebase but compute is currently out of scope; include in schema for forward compatibility.
