# Data model — personal credits & deductions forms

Inventory of Angular intake form models in `C:\us-tax\us-tax-ui\src\app\forms\`. Each form's `model` (or `taxpayerModel`/`spouseModel`) is serialized as a JSON object and PUT to `/api/personal/{formId}`; backend stores at `users/{uid}/personal/{formId}` (single document per form per user; not per-person subcollection — the `-taxpayer`/`-spouse` suffix is part of the formId).

Type conventions:
- All boolean fields are `boolean | null` (tri-state). `null` = unanswered.
- All numeric fields are `number | null` (currency, percent, kWh, year).
- All string fields are `string | null` unless noted.
- No Angular reactive `FormControl`/`Validators` — these are template-driven `[(ngModel)]` forms. "Required" below = enforced by component `isValid()`/`isFormValid()` before save; partial saves are permitted when the screening gate is `false`/`null`.
- Date fields are persisted as ISO-ish strings (`string | null`), not `Date`.
- Arrays default to `[]`; cardinality is unbounded unless noted.

---

## standard-deductions-taxpayer

Component: `FormStandardDeductionsComponent` (also serves spouse via `@Input() person`).

| Field | TS type | Required | Validators | Notes |
|---|---|---|---|---|
| deductionElection | string\|null | yes (default `AUTO`) | enum | `AUTO` \| `STANDARD` \| `ITEMIZED` |
| someoneCanClaimYou | boolean\|null | no | — | dependent indicator |
| someoneCanClaimSpouse | boolean\|null | no | — | |
| youWereDualStatusAlien | boolean\|null | no | — | |
| spouseItemizesSeparateReturn | boolean\|null | MFS only | gated to MFS on save | cleared when not MFS |
| youBornBeforeThreshold | boolean\|null | no | — | age box |
| youAreBlind | boolean\|null | no | — | |
| spouseBornBeforeThreshold | boolean\|null | no | — | |
| spouseIsBlind | boolean\|null | no | — | |
| spouseMeetsAgeBlindnessMfsRequirements | boolean\|null | MFS only | gated to MFS | |
| dependentStandardDeductionEarnedIncome | number\|null | no | — | worksheet input |
| medicalDentalExpensesPaid | number\|null | no | section gate | |
| stateLocalTaxChoice | string\|null | no | enum | `Income` \| `Sales` (default `Income`) |
| stateLocalIncomeTaxesPaid | number\|null | no | section gate | |
| stateLocalSalesTaxesPaid | number\|null | no | section gate | |
| realEstateTaxesPaid | number\|null | no | section gate | |
| personalPropertyTaxesPaid | number\|null | no | section gate | |
| homeMortgageInterestPaid | number\|null | no | section gate | |
| homeMortgagePointsPaid | number\|null | no | section gate | |
| investmentInterestPaid | number\|null | no | section gate | |
| netInvestmentIncome | number\|null | no | gated on investmentInterestPaid>0 | |
| charitableCashContributions | number\|null | no | section gate | |
| charitableNonCashContributions | number\|null | no | section gate | |
| personalCasualtyAndTheftLoss | number\|null | no | section gate | |
| foreignTaxesPaid | number\|null | no | section gate | |
| otherAllowedItemizedDeductions | number\|null | no | section gate | |
| netQualifiedDisasterLoss | number\|null | no | section gate | |
| electDisasterLossStandardDeductionIncrease | boolean\|null | no | gated on disaster-loss + non-ITEMIZED | |

Storage path: `users/{uid}/personal/standard-deductions-taxpayer`

## standard-deductions-spouse

Same shape as `standard-deductions-taxpayer` (single component, parameterized). The deduction method and Schedule A amount fields are only meaningful on the taxpayer document; spouse document still carries the full model schema but is used primarily for spouse-only age/blindness booleans and `spouseMeetsAgeBlindnessMfsRequirements`.

Storage path: `users/{uid}/personal/standard-deductions-spouse`

---

## investment-interest-expense-deduction

Component: `FormInterestExpenseComponent`. Return-level (not per-person).

| Field | TS type | Required | Validators | Notes |
|---|---|---|---|---|
| needsForm4952 | boolean\|null | yes (gate) | — | when false, full payload reset to defaults |
| receivedInterestDividendStatementsForInvestmentIncome | boolean\|null | no | — | |
| uploadedInterestDividendStatementsForInvestmentIncome | boolean\|null | conditional | required when received=true | |
| receivedCapitalGainStatementsForInvestmentIncome | boolean\|null | no | — | |
| uploadedCapitalGainStatementsForInvestmentIncome | boolean\|null | conditional | required when received=true | |
| receivedScheduleK1WithInvestmentInterestOrIncome | boolean\|null | no | — | |
| uploadedScheduleK1WithInvestmentInterestOrIncome | boolean\|null | conditional | required when received=true | |
| confirmAllReceivedInvestmentSupportUploaded | boolean\|null | yes when needsForm4952=true | === true | |
| investmentInterestExpensePaidOrAccruedLine1 | number\|null | yes when needsForm4952=true | numeric | Form 4952 line 1 |
| disallowedInvestmentInterestExpenseFrom2024Line2 | number\|null | no | numeric | carryforward |
| grossIncomeFromPropertyHeldForInvestmentLine4a | number\|null | yes when needsForm4952=true | numeric | |
| qualifiedDividendsIncludedInLine4aLine4b | number\|null | no | numeric | |
| netGainFromDispositionOfInvestmentPropertyLine4d | number\|null | no | numeric | |
| netCapitalGainFromDispositionOfInvestmentPropertyLimit | number\|null | no | numeric | |
| investmentExpensesLine5 | number\|null | no | numeric | |
| electToIncludeQualifiedDividendsOrCapitalGainInInvestmentIncome | boolean\|null | no | — | |
| electedInvestmentIncomeAmountLine4g | number\|null | yes if elect=true | numeric | |
| electedLine4eAmountAttributedToLine4g | number\|null | conditional | numeric | |
| line4gElectionNotes | string\|null | no | trimmed | |
| hasRoyaltiesInvestmentInterestPortion | boolean\|null | no | — | |
| royaltiesInvestmentInterestPortionAmount | number\|null | yes if portion=true | numeric | |
| hasNonPassiveBusinessInvestmentInterestPortion | boolean\|null | no | — | |
| nonPassiveBusinessInvestmentInterestPortionAmount | number\|null | yes if portion=true | numeric | |
| hasAtRiskActivityInvestmentInterestPortion | boolean\|null | no | — | |
| atRiskActivityInvestmentInterestPortionAmount | number\|null | yes if portion=true | numeric | |
| hasJointOrCommunityAccountAllocationIssue | boolean\|null | no | — | |
| jointOrCommunityAccountAllocationNotes | string\|null | yes if issue=true | trimmed non-empty | |
| requiresAmtInvestmentInterestRecompute | boolean\|null | no | — | |

Storage path: `users/{uid}/personal/investment-interest-expense-deduction`

---

## education-credits-taxpayer

Component: `FormEducationCreditsComponent` (taxpayer mode). Owns return-level Form 8863 fields + taxpayer student array.

| Field | TS type | Required | Validators | Notes |
|---|---|---|---|---|
| claimsEducationCreditsOnReturn | boolean\|null | yes (gate) | — | |
| receivedAny1098TForClaimedStudents | boolean\|null | no | — | |
| uploadedAll1098TStatementsForClaimedStudents | boolean\|null | conditional | required when received=true | |
| usingAlternativeEnrollmentDocumentationForAnyStudent | boolean\|null | no | — | |
| confirmAllEducationSupportUploaded | boolean\|null | yes when gate=true | === true | |
| aotcPreviouslyDenied | boolean\|null | no | — | |
| refundableAotcRestrictionApplies | boolean\|null | no | — | |
| hasMagiAddBacks | boolean\|null | no | — | |
| magiAddBackPuertoRicoExcludedIncome | number\|null | gated on hasMagiAddBacks | numeric | |
| magiAddBackForm2555ExcludedIncome | number\|null | gated on hasMagiAddBacks | numeric | |
| magiAddBackForm2555HousingExclusion | number\|null | gated on hasMagiAddBacks | numeric | |
| magiAddBackForm4563ExcludedIncome | number\|null | gated on hasMagiAddBacks | numeric | |
| educationCreditsReturnNotes | string\|null | no | trimmed | |
| taxpayerEducationCreditStudents | EducationCreditStudentEntry[] | when gate=true: ≥1 | array | FormArray-equivalent |

EducationCreditStudentEntry (child shape, unbounded array per Form 8863 Part III):

| Field | TS type | Required | Notes |
|---|---|---|---|
| studentFirstNameLine20 | string\|null | yes | trimmed |
| studentLastNameLine20 | string\|null | yes | trimmed |
| studentTinLine21 | string\|null | yes | SSN/ITIN string |
| studentRelationshipToTaxReturn | string\|null | yes | enum: `taxpayer` \| `spouse` \| `dependent` \| `other_eligible_student` |
| creditTypeRequested | string\|null | yes | enum: `aotc` \| `llc` |
| adjustedQualifiedEducationExpenses | number\|null | yes | numeric |
| taxFreeEducationAssistanceReductionAmount | number\|null | no | numeric |
| educationSupportNotes | string\|null | no | trimmed |
| institution1NameLine22 | string\|null | yes | |
| institution1AddressLine22 | string\|null | yes | |
| institution1EinLine22 | string\|null | conditional | required if AOTC or 1098-T received |
| institution1Received1098T | boolean\|null | yes | |
| institution1PriorYear1098TBox7Checked | boolean\|null | conditional | required if 1098T=true |
| studentHasSecondInstitutionLine22 | boolean\|null | no | |
| institution2NameLine22 | string\|null | conditional | yes if second institution |
| institution2AddressLine22 | string\|null | conditional | yes if second institution |
| institution2EinLine22 | string\|null | conditional | as institution1 |
| institution2Received1098T | boolean\|null | conditional | |
| institution2PriorYear1098TBox7Checked | boolean\|null | conditional | |
| aotcClaimedFourPriorYearsLine23 | boolean\|null | required for AOTC | |
| studentWasAtLeastHalfTimeLine24 | boolean\|null | required for AOTC | |
| studentCompletedFirstFourYearsBefore2025Line25 | boolean\|null | required for AOTC | |
| studentHadFelonyDrugConvictionLine26 | boolean\|null | required for AOTC | |

Storage path: `users/{uid}/personal/education-credits-taxpayer`

## education-credits-spouse

Component reuses `FormEducationCreditsComponent` in spouse mode. Different model — only adds extra students:

| Field | TS type | Required | Validators | Notes |
|---|---|---|---|---|
| spouseHasAdditionalEducationCreditStudents | boolean\|null | yes (gate) | — | |
| spouseEducationCreditStudents | EducationCreditStudentEntry[] | when gate=true: ≥1 | array | same shape as taxpayer |

Storage path: `users/{uid}/personal/education-credits-spouse`

---

## energy-credit-taxpayer

Component: `FormEnergyCreditComponent` (taxpayer mode). Form 5695 — return-level on taxpayer doc.

| Field | TS type | Required | Notes |
|---|---|---|---|
| claimsEnergyCreditOnReturn | boolean\|null | yes (gate) | |
| confirmAllEnergySupportUploaded | boolean\|null | yes when gate=true | === true |
| claimsResidentialCleanEnergyCredit | boolean\|null | one-of-two required | Part I |
| claimsEnergyEfficientHomeImprovementCredit | boolean\|null | one-of-two required | Part II |
| line1SolarElectricCosts | number\|null | Part I | |
| line2SolarWaterHeatingCosts | number\|null | Part I | |
| line3SmallWindEnergyCosts | number\|null | Part I | |
| line4GeothermalHeatPumpCosts | number\|null | Part I | |
| line5BatteryCapacityAtLeast3kwh | boolean\|null | required if battery cost | |
| line5BatteryStorageCosts | number\|null | Part I | |
| line7aFuelCellInstalledOnMainHomeInUs | boolean\|null | required if fuel cell | |
| line7bFuelCellMainHomeAddress | string\|null | required if fuel cell | |
| line7cFuelCellJointOccupants | boolean\|null | Part I | |
| line8FuelCellPropertyCosts | number\|null | Part I | |
| line10FuelCellCapacityKw | number\|null | Part I | kW |
| line12PriorYearCarryforward | number\|null | Part I | |
| additionalResidenceAddressesText | string\|null | Part I | freeform |
| partIIInstalledOnMainHomeInUs | boolean\|null | Part II | |
| partIIOriginalUser | boolean\|null | Part II | |
| partIIFiveYearUse | boolean\|null | Part II | |
| mainHomeAddress | string\|null | Part II | |
| partIIRelatedToConstruction | boolean\|null | Part II | |
| installedQualifiedEnergyProperty | boolean\|null | Part II | |
| qualifiedEnergyPropertyOriginalUser | boolean\|null | Part II | |
| qualifiedEnergyPropertyResidenceAddressesText | string\|null | Part II | freeform |
| enablingPropertyInstalledSameYear | boolean\|null | required if enabling cost | |
| enabledPropertyCode | string\|null | Part II | |
| qualifiedAudit | boolean\|null | required if audit cost | |
| jointOccupants | boolean\|null | Part II | |
| condominiumOrCooperative | boolean\|null | Part II | |
| insulationAirSealingCosts | number\|null | Part II | |
| otherDoorCosts | number\|null | Part II | |
| otherWindowCosts | number\|null | Part II | |
| centralAirOtherCosts | number\|null | Part II | |
| waterHeaterOtherCosts | number\|null | Part II | |
| furnaceBoilerOtherCosts | number\|null | Part II | |
| enablingPropertyCosts | number\|null | Part II | |
| enablingPropertyQmidsText | string\|null | Part II | freeform |
| homeEnergyAuditCosts | number\|null | Part II | |
| otherHeatPumpCosts | number\|null | Part II | |
| otherHeatPumpWaterHeaterCosts | number\|null | Part II | |
| otherBiomassCosts | number\|null | Part II | |
| doorItems | QualifiedCostItem[] | unbounded | repeater |
| windowItems | QualifiedCostItem[] | unbounded | repeater |
| centralAirItems | QualifiedCostItem[] | unbounded | repeater |
| waterHeaterItems | QualifiedCostItem[] | unbounded | repeater |
| furnaceBoilerItems | QualifiedCostItem[] | unbounded | repeater |
| heatPumpItems | QualifiedCostItem[] | unbounded | repeater |
| heatPumpWaterHeaterItems | QualifiedCostItem[] | unbounded | repeater |
| biomassItems | QualifiedCostItem[] | unbounded | repeater |

QualifiedCostItem shape: `{ description: string|null; qmid: string|null; cost: number|null }`. Items with all three fields null are dropped on save.

Storage path: `users/{uid}/personal/energy-credit-taxpayer`

## energy-credit-spouse

Different model (spouse-supplemental). All taxpayer Part I/II fields are duplicated with `spouse` prefix; gate field is `spouseHasEnergyCreditInputs`. Additional spouse-only gate: `spouseSeparateMainHomeForPartII`.

| Field | TS type | Notes |
|---|---|---|
| spouseHasEnergyCreditInputs | boolean\|null | gate |
| spouseSeparateMainHomeForPartII | boolean\|null | |
| spouseLine1SolarElectricCosts ... spouseLine12PriorYearCarryforward | number/boolean/string | mirror of taxpayer Part I with `spouse` prefix; `spouseLine12PriorYearCarryforward` absent on spouse model |
| spousePartIIInstalledOnMainHomeInUs ... spouseCondominiumOrCooperative | boolean\|null | mirror Part II booleans |
| spouseMainHomeAddress / spouseQualifiedEnergyPropertyResidenceAddressesText / spouseEnabledPropertyCode / spouseEnablingPropertyQmidsText / spouseLine7bFuelCellMainHomeAddress | string\|null | freeform |
| spouseInsulationAirSealingCosts ... spouseOtherBiomassCosts | number\|null | mirror Part II amounts |
| spouseDoorItems / spouseWindowItems / spouseCentralAirItems / spouseWaterHeaterItems / spouseFurnaceBoilerItems / spouseHeatPumpItems / spouseHeatPumpWaterHeaterItems / spouseBiomassItems | QualifiedCostItem[] | unbounded |

Same conditional clearing logic as taxpayer.

Storage path: `users/{uid}/personal/energy-credit-spouse`

---

## clean-car-credit-taxpayer

Component: `FormCleanCarCreditComponent`. Form 8936 intake.

| Field | TS type | Required | Notes |
|---|---|---|---|
| claimsCleanCarCreditOnReturn | boolean\|null | yes (gate) | |
| confirmSellerReportsAndSupportReady | boolean\|null | yes when gate | |
| currentYearAdditionalMagiAddbacks | number\|null | no | |
| priorYearMagi | number\|null | no | for MAGI lookback |
| taxpayerVehicles | VehicleEntry[] | array | unbounded |

VehicleEntry (child shape):

| Field | TS type | Notes |
|---|---|---|
| vehicleNickname | string\|null | |
| creditPath | string\|null | enum (e.g. `new` \| `previously-owned` \| `commercial`) — values implied by routing |
| vehicleYear | number\|null | integer year |
| vehicleMake | string\|null | |
| vehicleModel | string\|null | |
| vehicleVin | string\|null | |
| vehiclePlacedInServiceDate | string\|null | ISO date string |
| vehicleAcquiredDate | string\|null | ISO date string |
| sellerReportReceived | boolean\|null | |
| creditTransferredToDealer | boolean\|null | |
| transferredCreditAmount | number\|null | |
| resoldWithin30Days | boolean\|null | |
| newVehicleAcquiredForUseOrLeaseNotResale | boolean\|null | new-vehicle path |
| newVehicleTentativeCreditAmount | number\|null | |
| businessUsePercentage | number\|null | 0–100 |
| previouslyOwnedAcquiredForUseNotResale | boolean\|null | previously-owned path |
| previouslyOwnedSalesPrice | number\|null | |
| previouslyOwnedClaimedInPrior3Years | boolean\|null | |
| previouslyOwnedCanBeClaimedAsDependent | boolean\|null | |

Storage path: `users/{uid}/personal/clean-car-credit-taxpayer`

## clean-car-credit-spouse

| Field | TS type | Notes |
|---|---|---|
| spouseHasCleanCarCreditInputs | boolean\|null | gate |
| spouseVehicles | VehicleEntry[] | same shape as taxpayer |

Storage path: `users/{uid}/personal/clean-car-credit-spouse`

---

## alt-fuel-credit-taxpayer

Component: `FormAltFuelCreditComponent`. Form 8911.

| Field | TS type | Notes |
|---|---|---|
| claimsAltFuelCreditOnReturn | boolean\|null | gate |
| confirmEligibleCensusTractSupportReady | boolean\|null | |
| passthroughRefuelingPropertyCredit | number\|null | |
| taxpayerProperties | PropertyEntry[] | unbounded |

PropertyEntry (child shape):

| Field | TS type | Notes |
|---|---|---|
| propertyNickname | string\|null | |
| registrationNumber | string\|null | |
| propertyDescription | string\|null | |
| ownerNameTinIfDifferent | string\|null | |
| propertyLocation | string\|null | |
| constructionBeganDate | string\|null | ISO date |
| placedInServiceDate | string\|null | ISO date |
| eligibleCensusTract | boolean\|null | |
| eligibleCensusTractGeoid | string\|null | |
| certificationPermitNumber | string\|null | |
| propertyCost | number\|null | |
| businessInvestmentUsePercentage | number\|null | 0–100 |
| section179Deduction | number\|null | |
| pwaRequirementsMet | boolean\|null | prevailing-wage/apprenticeship |
| installedAtMainHome | boolean\|null | |
| originalUseBeginsWithTaxpayer | boolean\|null | |
| usedPredominantlyOutsideUs | boolean\|null | |

Storage path: `users/{uid}/personal/alt-fuel-credit-taxpayer`

## alt-fuel-credit-spouse

| Field | TS type | Notes |
|---|---|---|
| spouseHasAltFuelCreditInputs | boolean\|null | gate |
| spousePassthroughRefuelingPropertyCreditContribution | number\|null | |
| spouseProperties | PropertyEntry[] | same shape |

Storage path: `users/{uid}/personal/alt-fuel-credit-spouse`

---

## bond-credit-taxpayer

Component: `FormBondCreditComponent`. Form 8912.

| Field | TS type | Notes |
|---|---|---|
| claimsBondCredit | boolean\|null | gate |
| priorYearCarryforwardCredit | number\|null | |
| taxpayer1097BtcEntries | Bond1097Entry[] | unbounded |
| taxpayerDirectBondEntries | DirectBondEntry[] | unbounded |

Bond1097Entry: `{ issuerName: string|null; issuerEin: string|null; uniqueIdentifier: string|null; creditAmount: number|null }`

DirectBondEntry:

| Field | TS type | Notes |
|---|---|---|
| bondType | string\|null | enum (issuer-defined) |
| issuerName | string\|null | |
| issuerCityState | string\|null | |
| issuerEin | string\|null | |
| issueDate | string\|null | ISO date |
| maturityDate | string\|null | ISO date |
| disposalDate | string\|null | ISO date |
| cusipOrPaymentDates | string\|null | |
| basisAmount | number\|null | |
| creditRatePercent | number\|null | percent |
| allocationPercentage | number\|null | percent |
| line19BaseCreditAmount | number\|null | |

Storage path: `users/{uid}/personal/bond-credit-taxpayer`

## bond-credit-spouse

| Field | TS type | Notes |
|---|---|---|
| spouseHasBondCreditInputs | boolean\|null | gate |
| spousePriorYearCarryforwardContribution | number\|null | |
| spouse1097BtcEntries | Bond1097Entry[] | same shape |
| spouseDirectBondEntries | DirectBondEntry[] | same shape |

Storage path: `users/{uid}/personal/bond-credit-spouse`

---

## electric-vehicle-credit-taxpayer

Component: `FormElectricVehicleCreditComponent`. Released QEV passive-activity credit only (small form).

| Field | TS type | Notes |
|---|---|---|
| claimsElectricVehicleCredit | boolean\|null | gate |
| confirmReleasedQevCreditAvailable | boolean\|null | |
| releasedQevPassiveActivityCredit | number\|null | |

Storage path: `users/{uid}/personal/electric-vehicle-credit-taxpayer`

## electric-vehicle-credit-spouse

| Field | TS type | Notes |
|---|---|---|
| spouseHasElectricVehicleCreditInputs | boolean\|null | gate |
| spouseReleasedQevPassiveActivityCreditContribution | number\|null | |

Storage path: `users/{uid}/personal/electric-vehicle-credit-spouse`

---

## mortgage-interest-credit-taxpayer

Component: `FormMortgageInterestCreditComponent`. Form 8396.

| Field | TS type | Notes |
|---|---|---|
| claimsMortgageInterestCredit | boolean\|null | gate |
| hasQualifiedMortgageCreditCertificate | boolean\|null | |
| mainHomeWithinMccJurisdiction | boolean\|null | |
| interestPaidToRelatedPerson | boolean\|null | |
| mccCertificateNumber | string\|null | |
| mccHomeAddress | string\|null | |
| certificateCreditRatePercent | number\|null | percent |
| totalMortgageInterestPaid | number\|null | |
| certifiedMortgageInterestPaidOverride | number\|null | |
| certifiedIndebtednessAmount | number\|null | |
| originalMortgageAmount | number\|null | |
| nonSpouseOwnerSharePercent | number\|null | percent |
| carryforward2022From2024Form8396Line16 | number\|null | |
| carryforward2023From2024Form8396Line14 | number\|null | |
| carryforward2024From2024Form8396Line17 | number\|null | |

Storage path: `users/{uid}/personal/mortgage-interest-credit-taxpayer`

## mortgage-interest-credit-spouse

| Field | TS type | Notes |
|---|---|---|
| spouseHasMortgageInterestCreditInputs | boolean\|null | gate |
| spouseMortgageInterestPaidContribution | number\|null | |

Storage path: `users/{uid}/personal/mortgage-interest-credit-spouse`

---

## carryforward-homebuyer-credit-taxpayer

Component: `FormCarryforwardHomebuyerCreditComponent`. Form 8859.

| Field | TS type | Notes |
|---|---|---|
| claimsCarryforwardHomebuyerCredit | boolean\|null | gate |
| confirmPriorYearForm8859Available | boolean\|null | |
| priorYearForm8859Line4Carryforward | number\|null | |
| useSchedule8812CreditLimitWorksheetBOverride | boolean\|null | |
| schedule8812CreditLimitWorksheetBLine14Override | number\|null | |

Storage path: `users/{uid}/personal/carryforward-homebuyer-credit-taxpayer`

## carryforward-homebuyer-credit-spouse

| Field | TS type | Notes |
|---|---|---|
| spouseHasCarryforwardHomebuyerCreditInputs | boolean\|null | gate |
| spousePriorYearCarryforwardContribution | number\|null | |

Storage path: `users/{uid}/personal/carryforward-homebuyer-credit-spouse`

---

## prior-min-tax-credit-taxpayer

Component: `FormPriorMinTaxCreditComponent`. Form 8801.

| Field | TS type | Notes |
|---|---|---|
| claimsPriorMinTaxCredit | boolean\|null | gate |
| confirmPriorYearReturnsAvailable | boolean\|null | |
| priorYearFilingStatus | string\|null | enum mirroring filing-status set |
| priorYearForm6251Line1Plus2e | number\|null | |
| priorYearExclusionItemAdjustments | number\|null | |
| priorYearMtcnold | number\|null | net operating loss |
| priorYearMtftceOnExclusionItems | number\|null | |
| priorYearForm6251Line10 | number\|null | |
| priorYearForm6251Line11 | number\|null | |
| priorYearForm8801Line26Carryforward | number\|null | |
| priorYearUnallowedQualifiedElectricVehicleCredit | number\|null | |
| priorYearFiledForm2555 | boolean\|null | |
| priorYearUsesPartIII | boolean\|null | |
| priorYearFeitwLine3Taxpayer | number\|null | |
| partIIILine28Amount | number\|null | |
| partIIILine29Amount | number\|null | |
| partIIILine30CapAmount | number\|null | |
| partIIILine35Amount | number\|null | |
| partIIILine42Amount | number\|null | |

Storage path: `users/{uid}/personal/prior-min-tax-credit-taxpayer`

## prior-min-tax-credit-spouse

| Field | TS type | Notes |
|---|---|---|
| spouseHasPriorMinTaxCreditInputs | boolean\|null | gate |
| priorYearFeitwLine3Spouse | number\|null | |

Storage path: `users/{uid}/personal/prior-min-tax-credit-spouse`

---

## elderly-disabled-credit-taxpayer

Component: `FormElderlyDisabledCreditComponent`. Schedule R.

| Field | TS type | Notes |
|---|---|---|
| claimsElderlyDisabledCredit | boolean\|null | gate |
| confirmQualificationSupportReady | boolean\|null | |
| mfsLivedApartAllYear | boolean\|null | MFS only |
| taxpayerRetiredOnPermanentTotalDisability | boolean\|null | |
| taxpayerReceivedTaxableDisabilityIncome | boolean\|null | |
| taxpayerTaxableDisabilityIncomeAmount | number\|null | |
| taxpayerUnderMandatoryRetirementAgeOnJan1 | boolean\|null | |
| taxpayerExistingPhysicianStatement | boolean\|null | |
| taxpayerNontaxablePensionBenefits | number\|null | |

Storage path: `users/{uid}/personal/elderly-disabled-credit-taxpayer`

## elderly-disabled-credit-spouse

| Field | TS type | Notes |
|---|---|---|
| spouseHasElderlyDisabledCreditInputs | boolean\|null | gate |
| spouseRetiredOnPermanentTotalDisability | boolean\|null | |
| spouseReceivedTaxableDisabilityIncome | boolean\|null | |
| spouseTaxableDisabilityIncomeAmount | number\|null | |
| spouseUnderMandatoryRetirementAgeOnJan1 | boolean\|null | |
| spouseExistingPhysicianStatement | boolean\|null | |
| spouseNontaxablePensionBenefits | number\|null | |

Storage path: `users/{uid}/personal/elderly-disabled-credit-spouse`

---

## extension-of-time-taxpayer

Component: `FormExtensionOfTimeComponent`. Form 4868. (Model declared loosely as `any` in source; fields enumerated from initializer.)

| Field | TS type | Required | Notes |
|---|---|---|---|
| needsExtensionOfTime | boolean\|null | yes (gate) | |
| extensionFilingMethod | string\|null | yes when gate=true | enum: `e-file` \| `mail` \| `electronic-payment-substitute` |
| hasFiscalYear | boolean\|null | no | |
| fiscalYearBegin | string\|null | required if hasFiscalYear=true | ISO date |
| fiscalYearEnd | string\|null | required if hasFiscalYear=true | ISO date |
| estimatedTotalTaxLiability2025 | number\|null | no | |
| estimatedTotalPaymentsExcludingExtensionPayment | number\|null | no | |
| taxpayerExtensionPaymentAmount | number\|null | no | |
| paymentMethod | string\|null | no | enum: `Direct Pay` \| `EFTPS` \| `Credit card` \| `Debit card` \| `Check` \| `None` |
| paymentDate | string\|null | no | ISO date |
| confirmationNumber | string\|null | no | |
| outOfCountryFlag | boolean\|null | no | |
| form1040nrSpecialFlag | boolean\|null | no | |

Storage path: `users/{uid}/personal/extension-of-time-taxpayer`

## extension-of-time-spouse

| Field | TS type | Notes |
|---|---|---|
| spouseHasExtensionOfTimeInputs | boolean\|null | gate |
| spouseIncludedOnJointExtension | boolean\|null | |
| spouseExtensionPaymentContribution | number\|null | |
| spousePaymentReference | string\|null | |

Storage path: `users/{uid}/personal/extension-of-time-spouse`

---

## form4852-taxpayer

Component: `FormForm4852Component`. Substitute W-2 / 1099-R. Multi-entry.

Top-level model:

| Field | TS type | Required | Notes |
|---|---|---|---|
| needsForm4852 | boolean\|null | yes (gate) | |
| forms | Form4852Entry[] | when gate=true: ≥1 | unbounded array, one per missing W-2/1099-R |

Form4852Entry (child shape — string fields are `string` not `string\|null`; numeric fields are `number\|null`):

| Field | TS type | Notes |
|---|---|---|
| substituteFormType | string | enum: `''` \| `w2` \| `1099-r` |
| employerOrPayerNameAddressZip | string | |
| employerOrPayerTin | string | EIN |
| line7aWagesTipsOtherCompensation | number\|null | W-2 path |
| line7bSocialSecurityWages | number\|null | |
| line7cMedicareWagesAndTips | number\|null | |
| line7dSocialSecurityTips | number\|null | |
| line7eFederalIncomeTaxWithheld | number\|null | |
| line7fStateIncomeTaxWithheld | number\|null | |
| line7fStateName | string | |
| line7gLocalIncomeTaxWithheld | number\|null | |
| line7gLocalityName | string | |
| line7hSocialSecurityTaxWithheld | number\|null | |
| line7iMedicareTaxWithheld | number\|null | |
| line8aGrossDistribution | number\|null | 1099-R path |
| line8bTaxableAmount | number\|null | |
| line8cTaxableAmountNotDetermined | boolean\|null | |
| line8dTotalDistribution | boolean\|null | |
| line8eCapitalGain | number\|null | |
| line8fFederalIncomeTaxWithheld | number\|null | |
| line8gStateIncomeTaxWithheld | number\|null | |
| line8gStateName | string | |
| line8hLocalIncomeTaxWithheld | number\|null | |
| line8hLocalityName | string | |
| line8iEmployeeContributions | number\|null | |
| line8jDistributionCodes | string | |
| line8jIraSepSimple | boolean\|null | |
| line9HowAmountsWereDetermined | string | freeform text |
| line10EffortsToObtainMissingOrCorrectedForm | string | freeform text |

Storage path: `users/{uid}/personal/form4852-taxpayer`

## form4852-spouse

Same as `form4852-taxpayer` (single component, parameterized by `@Input() person`).

Storage path: `users/{uid}/personal/form4852-spouse`

---

## qbi-deduction-taxpayer

Component: `FormQbiDeductionComponent`. Line 13a inputs (Form 8995/8995-A intake).

NOTE: this component uses a single in-memory model but maps to/from different persisted field names per person via `FIELD_MAPS`. Persisted field names below are the taxpayer-side names.

| Field (persisted) | TS type | Notes |
|---|---|---|
| hadQualifiedBusinessIncomeInputs | boolean\|null | gate |
| confirmAllReceivedQbiStatementsUploaded | boolean\|null | yes when gate=true |
| hasScheduleCOrScheduleFQbiSources | boolean\|null | out-of-scope blocker |
| isCooperativePatronOfAgriculturalHorticulturalCooperative | boolean\|null | out-of-scope blocker |
| hasPriorYearQbiLossCarryforward | boolean\|null | |
| priorYearQbiLossCarryforwardAmount | number\|null | |
| priorYearQbiCarryforwardNotes | string\|null | |
| hasPriorYearReitPtpLossCarryforward | boolean\|null | |
| priorYearReitPtpLossCarryforwardAmount | number\|null | |
| manualQualifiedBusinessIncomeAdjustment | number\|null | |
| manualQualifiedReitDividendAdjustment | number\|null | |
| manualQualifiedPtpIncomeOrLossAdjustment | number\|null | |
| qbiSupplementalAdjustmentNotes | string\|null | freeform |

Storage path: `users/{uid}/personal/qbi-deduction-taxpayer`

## qbi-deduction-spouse

Same logical fields, but each is persisted with the `spouse` prefix variant from `FIELD_MAPS`:
`spouseHadQualifiedBusinessIncomeInputs`, `spouseConfirmAllReceivedQbiStatementsUploaded`, `spouseHasScheduleCOrScheduleFQbiSources`, `spouseIsCooperativePatronOfAgriculturalHorticulturalCooperative`, `spouseHasPriorYearQbiLossCarryforward`, `spousePriorYearQbiLossCarryforwardAmount`, `spousePriorYearQbiCarryforwardNotes`, `spouseHasPriorYearReitPtpLossCarryforward`, `spousePriorYearReitPtpLossCarryforwardAmount`, `spouseManualQualifiedBusinessIncomeAdjustment`, `spouseManualQualifiedReitDividendAdjustment`, `spouseManualQualifiedPtpIncomeOrLossAdjustment`, `spouseQbiSupplementalAdjustmentNotes`.

Storage path: `users/{uid}/personal/qbi-deduction-spouse`

---

## Cross-form notes for SQL schema design

1. **Persistence is JSON-document-per-(uid, formId).** Backend treats the entire payload as a typed POJO per form (see `src/main/java/com/ustax/model/output/` for output models; intake side is loosely-typed). Repeater arrays are nested JSON arrays.
2. **No FormGroup/Validators.** All forms are template-driven (`[(ngModel)]`). The component's `isValid()` / `isFormValid()` method enforces gating + cross-field requirements before save; partial saves are allowed when gate is `false`/`null`.
3. **Tri-state booleans** are pervasive: `true` / `false` / `null` (unanswered). SQL representation should preserve nullable BOOLEAN.
4. **Conditional clearing on save.** When a section gate flips to `false`, the component zeroes out all descendant fields server-side. SQL will not see "orphan" data once a gate is cleared.
5. **Date fields** are stored as plain strings (`YYYY-MM-DD`-style), not Date objects.
6. **Two taxpayer/spouse patterns:**
   - **Single shared shape** (standard-deductions, form4852, education-credit student entries): same TS model on both docs.
   - **Asymmetric shapes** (most credit forms): taxpayer doc carries the full Form 8X/return-level fields; spouse doc carries only `spouseHas*Inputs` gate + a small set of spouse-supplemental fields. SQL should model these as two separate tables (or a single table with nullable taxpayer/spouse field sets).
7. **QBI is the only form** that uses a runtime field-name remap (`FIELD_MAPS`) between in-memory model and persistence. Schema should use the persisted (prefixed) names.
8. **Repeater arrays** (FormArrays-equivalent): `taxpayerEducationCreditStudents`, `spouseEducationCreditStudents`, `taxpayerVehicles`, `spouseVehicles`, `taxpayerProperties`, `spouseProperties`, `taxpayer1097BtcEntries`, `taxpayerDirectBondEntries`, `spouse1097BtcEntries`, `spouseDirectBondEntries`, energy `*Items` (8 variants × 2 sides), `forms` (Form4852). These warrant child tables.
