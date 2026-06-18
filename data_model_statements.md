# Statement-Entry Form Field Inventory (UI persisted shape)

Source: Angular UI components at `C:\us-tax\us-tax-ui\src\app\forms\form-*.component.ts`. Persisted shape = the `model` object literal bound to `[(ngModel)]` and saved via `StatementDataService` to Firestore. Generic capital-statement forms (no per-form component) come from `C:\us-tax\us-tax-ui\src\app\forms\capital-statement-configs.ts`. Form registry: `C:\us-tax\us-tax-be\src\main\java\com\ustax\microservices\StatementFormCatalog.java`.

Storage layout: `users/{uid}/{formId}/{entryId}` (Firestore). Each entry is one issuer-side document.

## Conventions and reusable shapes

- **PII_HEADER** (1099-series common header): `void: bool`, `corrected: bool`, `calendarYear: text`, `payerTIN: text`, `payerNameAddress: text`, `payerTelephone: text`, `recipientTIN: text`, `recipientName: text`, `recipientFirstName: text`, `recipientLastName: text`, `recipientSuffix: text`, `recipientStreetAddress: text`, `recipientCityStateCountryZip: text`, `accountNumber: text`. (Some forms omit `void`; noted per form.)
- **AMOUNT_NOTES pair**: every money box is stored as TWO fields — `<box>Amount` (decimal, nullable) + `<box>Notes` (text). Notes capture printed annotations beside the amount (e.g. "INCLUDES 12,345"). SQL: split into `<box>_amount NUMERIC(15,2) NULL` and `<box>_notes TEXT NULL`.
- **StateInfo array** (1099-INT/DIV/OID/G shape): `[{ state: text, payerStateId: text, stateTaxWithheldAmount: decimal, stateTaxWithheldNotes: text }]` — typically 2 slots persisted (issuer can report up to 2 states). SQL: child table `<form>_state_info` with `entry_id FK, slot_index INT, state, payer_state_id, state_tax_withheld_amount, state_tax_withheld_notes`.
- **StateLocalInfo array** (W-2/1099-R shape): adds `localWagesAmount/Notes`, `localIncomeTaxAmount/Notes`, `localityName` to StateInfo. Variants noted per form.
- **All `*Amount` fields are nullable decimal** (rendered with PrimeNG `<p-inputNumber>`); all other fields are nullable text unless flagged `bool`.
- **calendarYear** is text not int — entered as printed on the statement (e.g. "2025"); preserves leading zeros / non-numeric edge cases.
- **TIN fields** (SSN, EIN, ITIN) — text; UI accepts with/without dashes.
- Forms that use generic PDF-slot keys (`page1_0_f1_*_0`, `page1_0_c1_*_*`) persist the raw PDF field slot name, NOT a semantic name. Schedule K-1 family and Form 6252 follow this pattern. Recommend mapping to semantic names in SQL via a key-translation table.

---

## w-2

| Field | Type | Required | Notes |
|---|---|---|---|
| employeeSSN | text | yes | Box a |
| employeeFirstName | text | yes | Box e |
| employeeLastName | text | yes | Box e |
| employeeSuffix | text | no | Box e |
| employeeAddress | text | yes | Box f (single string, U.S./foreign/APO) |
| employerEIN | text | yes | Box b |
| employerNameAddress | text | yes | Box c (single string) |
| controlNumber | text | no | Box d |
| wagesTipsOtherCompAmount/Notes | decimal+text | no | Box 1 |
| federalIncomeTaxWithheldAmount/Notes | decimal+text | no | Box 2 |
| socialSecurityWagesAmount/Notes | decimal+text | yes | Box 3 |
| socialSecurityTaxWithheldAmount/Notes | decimal+text | no | Box 4 |
| medicareWagesAndTipsAmount/Notes | decimal+text | no | Box 5 |
| medicareTaxWithheldAmount/Notes | decimal+text | no | Box 6 |
| socialSecurityTipsAmount/Notes | decimal+text | no | Box 7 |
| allocatedTipsAmount/Notes | decimal+text | no | Box 8 |
| dependentCareBenefitsAmount/Notes | decimal+text | no | Box 10 |
| nonqualifiedPlansAmount/Notes | decimal+text | no | Box 11 |
| box12Entries[] | array | no | per-item: `code` (text), `box12Amount` (decimal), `box12AmountNotes` (text); 1+ slots |
| statutoryEmployee | bool | no | Box 13 |
| retirementPlan | bool | no | Box 13 |
| thirdPartySickPay | bool | no | Box 13 |
| hasUncommonW2Situations | bool | no | UI gating flag |
| box14Other[] | array(3) | no | per-item: `label`, `box14Amount`, `box14AmountNotes` |
| stateLocalInfo[] | array | no | per-item: `state, employerStateId, stateWagesAmount/Notes, stateIncomeTaxAmount/Notes, localWagesAmount/Notes, localIncomeTaxAmount/Notes, localityName` |

Storage path: `users/{uid}/w-2/{entryId}`

## w-2g

| Field | Type | Required | Notes |
|---|---|---|---|
| void | bool | no | |
| corrected | bool | no | |
| calendarYear | text | no | |
| winnerTIN | text | yes | |
| winnerFirstName / winnerLastName / winnerSuffix | text | yes/yes/no | |
| winnerAddress / winnerAptNumber / winnerCity / winnerStateOrProvince / winnerCountry / winnerZipCode | text | no | Granular address |
| payerTIN | text | yes | |
| payerNameAddress | text | no | Legacy combined |
| payerName / payerStreetAddress / payerRoomSuite / payerCity / payerStateOrProvince / payerCountry / payerZipCode | text | no | Granular |
| payerTelephone | text | no | |
| reportableWinningsAmount/Notes | decimal+text | yes | Box 1 |
| dateWon | text | no | Box 2 (date as printed) |
| typeOfWager | text | no | Box 3 |
| federalIncomeTaxWithheldAmount/Notes | decimal+text | no | Box 4 |
| transaction | text | no | Box 5 |
| race | text | no | Box 6 |
| identicalWagersWinningsAmount/Notes | decimal+text | no | Box 7 |
| cashier | text | no | Box 8 |
| window | text | no | Box 10 |
| firstIdentificationNumber | text | no | Box 11 |
| secondIdentificationNumber | text | no | Box 12 |
| stateLocalInfo[] | array | no | per-item: `state, payerStateId, stateWinningsAmount/Notes, stateIncomeTaxWithheldAmount/Notes, localWinningsAmount/Notes, localIncomeTaxWithheldAmount/Notes, localityName` |

Storage path: `users/{uid}/w-2g/{entryId}`

## 1099-nec

| Field | Type | Required | Notes |
|---|---|---|---|
| PII_HEADER (incl. void) | mixed | yes | |
| nonemployeeCompensationAmount/Notes | decimal+text | yes | Box 1 |
| directSalesOver5k | bool | no | Box 2 |
| excessGoldenParachutePaymentsAmount/Notes | decimal+text | no | Box 3 (formerly Form-K Crop) |
| federalIncomeTaxWithheldAmount/Notes | decimal+text | no | Box 4 |
| stateLocalInfo[] (slot=2) | array | no | per-item: `state, payerStateId, stateTaxWithheldAmount, stateIncomeAmount` |

Storage path: `users/{uid}/1099-nec/{entryId}`

## 1099-misc

| Field | Type | Required | Notes |
|---|---|---|---|
| PII_HEADER (incl. void) | mixed | yes | |
| rentsAmount/Notes | decimal+text | no | Box 1 |
| royaltiesAmount/Notes | decimal+text | no | Box 2 |
| otherIncomeAmount/Notes | decimal+text | no | Box 3 |
| federalIncomeTaxWithheldAmount/Notes | decimal+text | no | Box 4 |
| fishingBoatProceedsAmount/Notes | decimal+text | no | Box 5 |
| medicalAndHealthCarePaymentsAmount/Notes | decimal+text | no | Box 6 |
| directSalesOver5k | bool | no | Box 7 |
| substitutePaymentsAmount/Notes | decimal+text | no | Box 8 |
| cropInsuranceProceedsAmount/Notes | decimal+text | no | Box 9 |
| grossProceedsToAttorneyAmount/Notes | decimal+text | no | Box 10 |
| fishPurchasedForResaleAmount/Notes | decimal+text | no | Box 11 |
| section409aDeferralsAmount/Notes | decimal+text | no | Box 12 |
| fatcaFilingRequirement | bool | no | Box 13 |
| excessGoldenParachutePaymentsAmount/Notes | decimal+text | no | Box 14 |
| nonqualifiedDeferredCompAmount/Notes | decimal+text | no | Box 15 |
| stateLocalInfo[] (slot=2) | array | no | per-item: `state, payerStateId, stateTaxWithheldAmount/Notes, stateIncomeAmount/Notes` |

Storage path: `users/{uid}/1099-misc/{entryId}`

## 1099-k

| Field | Type | Required | Notes |
|---|---|---|---|
| void / corrected / calendarYear | bool/bool/text | no | |
| filerNameAddress / filerTelephone | text | yes/no | |
| filerIsPSE / filerIsEPFOrOtherThirdParty | bool | no | Filer-type checkboxes |
| transactionsArePaymentCard / transactionsAreThirdPartyNetwork | bool | no | |
| filerTIN | text | yes | |
| payeeName / payeeFirstName / payeeLastName / payeeSuffix | text | yes | |
| payeeStreetAddress / payeeCityStateCountryZip | text | no | |
| pseNameTelephone | text | no | Cross-reference if PSE separate |
| accountNumber / payeeTIN | text | no/yes | |
| grossAmountTransactions1aAmount/Notes | decimal+text | yes | Box 1a |
| cardNotPresent1bAmount/Notes | decimal+text | no | Box 1b |
| merchantCategoryCode | text | no | Box 2 |
| numberOfPaymentTransactions | decimal | no | Box 3 (integer count stored as decimal) |
| federalIncomeTaxWithheld4Amount/Notes | decimal+text | no | Box 4 |
| january5aAmount/Notes ... december5lAmount/Notes | decimal+text x12 | no | Box 5a-5l monthly breakdown |
| stateInformation[] (slot=2) | array | no | per-item: `state, payerStateId, stateIncomeTaxWithheldAmount/Notes` |

Storage path: `users/{uid}/1099-k/{entryId}`

## 1095-a

(Typed `Form1095A` interface; persisted as-is.)

| Field | Type | Required | Notes |
|---|---|---|---|
| void / corrected | bool | no | |
| calendarYear | text | no | |
| marketplaceIdentifier | text | no | |
| policyNumber | text | yes | |
| policyIssuerName | text | yes | |
| recipientFirstName / recipientLastName / recipientSuffix | text | yes/yes/no | |
| recipientSSN / recipientDOB | text | no | DOB as printed text |
| spouseFirstName / spouseLastName / spouseSuffix / spouseSSN / spouseDOB | text | no | |
| policyStartDate / policyTerminationDate | text | no | |
| recipientStreetAddress / recipientCity / recipientStateProvince / recipientCountryZip | text | no | |
| coveredIndividuals[] | array | no | per-item: `coveredFirstName, coveredLastName, coveredSuffix, coveredSSN, coveredDOB, coverageStartDate, coverageTerminationDate` |
| coverageMonthly[] (12 slots) | array | no | per-item: `monthName, monthlyEnrollmentPremiumsAmount/Notes, monthlySLCSPPremiumAmount/Notes, monthlyAdvancePaymentPTCAmount/Notes` |
| annualTotals | object | no | fields: `annualEnrollmentPremiumsAmount/Notes, annualSLCSPPremiumAmount/Notes, annualAdvancePaymentPTCAmount/Notes` |

Storage path: `users/{uid}/1095-a/{entryId}`

## 1095-b

(Typed `Form1095B` interface; minimal model — most fields optional.)

| Field | Type | Required | Notes |
|---|---|---|---|
| void / corrected / calendarYear | bool/bool/text | no | |
| responsibleFirstName / responsibleLastName / responsibleSuffix / responsibleSSNOrTIN / responsibleDOB | text | yes/yes/no/no/no | |
| responsibleStreetAddress / responsibleCity / responsibleStateProvince / responsibleCountryZip | text | no | |
| originOfHealthCoverageCode | text | no | Box 8 (single letter code) |
| reservedLine9 | text | no | |
| employerName / employerEIN / employerStreetAddress / employerCity / employerStateProvince / employerCountryZip | text | no | |
| providerName / providerEIN / providerTelephone / providerStreetAddress / providerCity / providerStateProvince / providerCountryZip | text | no | |
| coveredIndividuals[] | array | no | per-item: `coveredFirstName, coveredMiddleInitial, coveredLastName, coveredSSNOrTIN, coveredDOB, coveredAll12Months (bool), monthJan..monthDec (bool x12)` |

Storage path: `users/{uid}/1095-b/{entryId}`

## 1095-c

| Field | Type | Required | Notes |
|---|---|---|---|
| void / corrected / calendarYear | bool/bool/text | no | |
| employeeFirstName / employeeMiddleInitial / employeeLastName / employeeSSN | text | yes | Part I |
| employeeStreetAddress / employeeCity / employeeStateProvince / employeeCountryZip | text | no | |
| employerName / employerEIN / employerStreetAddress / employerTelephone | text | yes | |
| employerCity / employerStateProvince / employerCountryZip | text | no | |
| employeeAgeOnJan1 | text | no | |
| planStartMonth | text | no | 01-12 |
| partIIMonthlyRows[] | array | no | per-item: `period (text - "All 12 Months"/month), offerOfCoverageCode14 (text), employeeRequiredContribution15Amount (decimal), section4980HSafeHarbor16Code (text), zipCode17 (text)` |
| selfInsuredCoverage | bool | no | |
| partIIICoveredIndividuals[] | array | no | per-item: `coveredFirstName, coveredMiddleInitial, coveredLastName, coveredSSNOrTIN, coveredDOB, coveredAll12Months, monthJan..monthDec` (same shape as 1095-B covered) |

Storage path: `users/{uid}/1095-c/{entryId}`

## 1098-t

| Field | Type | Required | Notes |
|---|---|---|---|
| corrected | bool | no | (no void on 1098-T) |
| calendarYear | text | no | |
| filerEIN | text | yes | |
| filerNameAddress | text | no | Legacy combined |
| filerName / filerStreetAddress / filerRoomSuite / filerCity / filerStateOrProvince / filerCountry / filerZipCode / filerTelephoneNumber | text | yes/no/no/no/no/no/no/no | Granular |
| studentTIN | text | yes | |
| studentFirstName / studentLastName | text | yes | |
| studentStreetAddress / studentAptNumber / studentCity / studentStateOrProvince / studentCountry / studentZipCode | text | no | |
| accountNumber | text | no | |
| paymentsReceivedForQualifiedTuitionAmount/Notes | decimal+text | no | Box 1 |
| box2 / box3 | text | no | Reserved fields persisted as text |
| adjustmentsMadeForPriorYearAmount/Notes | decimal+text | no | Box 4 |
| scholarshipsOrGrantsAmount/Notes | decimal+text | no | Box 5 |
| adjustmentsToScholarshipsOrGrantsAmount/Notes | decimal+text | no | Box 6 |
| box7AcademicPeriodIncluded / box8AtLeastHalfTime / box9GraduateStudent | bool | no | Boxes 7-9 |
| insuranceContractReimbursementsOrRefundsAmount/Notes | decimal+text | no | Box 10 |

Storage path: `users/{uid}/1098-t/{entryId}`

## 1098-e

(formId is `1099-e` per catalog despite Form 1098-E label.)

| Field | Type | Required | Notes |
|---|---|---|---|
| corrected | bool | no | |
| lenderTIN | text | yes | |
| lenderNameAddress | text | no | Legacy combined |
| lenderName / lenderStreetAddress / lenderRoomSuite / lenderCity / lenderStateOrProvince / lenderCountry / lenderZipCode / lenderTelephone | text | yes/no/no/no/no/no/no/no | Granular |
| borrowerTIN | text | yes | |
| borrowerName / borrowerFirstName / borrowerLastName / borrowerSuffix | text | yes | |
| borrowerStreetAddress / borrowerAptNumber / borrowerCity / borrowerStateOrProvince / borrowerCountry / borrowerZipCode | text | no | |
| borrowerCityStateCountryZip | text | no | Legacy |
| accountNumber | text | no | |
| studentLoanInterestReceivedAmount/Notes | decimal+text | no | Box 1 |
| box1ExcludesOriginationFeesOrCapitalizedInterestPre2004 | bool | no | Box 2 |

Storage path: `users/{uid}/1099-e/{entryId}`

## 1099-q

| Field | Type | Required | Notes |
|---|---|---|---|
| corrected / calendarYear | bool/text | no | (no void) |
| PII_HEADER minus void | mixed | yes | |
| grossDistributionAmount/Notes | decimal+text | yes | Box 1 |
| earningsAmount/Notes | decimal+text | no | Box 2 |
| basisAmount/Notes | decimal+text | no | Box 3 |
| transferTrusteeToTrustee | bool | no | Box 4 |
| transferQtpToRothIra | bool | no | Box 4 sub |
| distributionFromPrivateQtp | bool | no | Box 5 |
| distributionFromStateQtp | bool | no | Box 5 |
| distributionFromCoverdellEsa | bool | no | Box 5 |
| recipientNotDesignatedBeneficiary | bool | no | Box 6 |

Storage path: `users/{uid}/1099-q/{entryId}`

## 1099-qa

| Field | Type | Required | Notes |
|---|---|---|---|
| corrected / calendarYear | bool/text | no | |
| PII_HEADER minus void | mixed | yes | |
| grossDistributionAmount/Notes | decimal+text | yes | Box 1 |
| earningsAmount/Notes | decimal+text | no | Box 2 |
| basisAmount/Notes | decimal+text | no | Box 3 |
| programToProgramTransfer | bool | no | Box 4 |
| ableAccountTerminated | bool | no | Box 5 |
| recipientNotDesignatedBeneficiary | bool | no | Box 6 |

Storage path: `users/{uid}/1099-qa/{entryId}`

## 1099-ltc

| Field | Type | Required | Notes |
|---|---|---|---|
| corrected / calendarYear | bool/text | no | (no void) |
| payerTIN / payerNameAddress / payerTelephone | text | yes | |
| policyholderTIN / policyholderName / policyholderFirstName / policyholderLastName / policyholderSuffix | text | yes | |
| policyholderStreetAddress / policyholderCityStateCountryZip | text | no | |
| accountNumber | text | no | |
| insuredTIN / insuredName / insuredFirstName / insuredLastName / insuredSuffix | text | no | |
| insuredStreetAddress / insuredCityStateCountryZip | text | no | |
| grossLTCBenefitsPaidAmount/Notes | decimal+text | no | Box 1 |
| acceleratedDeathBenefitsPaidAmount/Notes | decimal+text | no | Box 2 |
| perDiem | bool | no | Box 3 |
| reimbursedAmount | bool | no | Box 3 |
| qualifiedContract | bool | no | Box 4 |
| chronicallyIll | bool | no | Box 5 |
| terminallyIll | bool | no | Box 5 |
| dateCertified | text | no | Box 5 (date as printed) |

Storage path: `users/{uid}/1099-ltc/{entryId}`

## 1099-sa

| Field | Type | Required | Notes |
|---|---|---|---|
| corrected / calendarYear | bool/text | no | (no void) |
| PII_HEADER minus void | mixed | yes | |
| grossDistributionAmount/Notes | decimal+text | yes | Box 1 |
| earningsOnExcessContributionsAmount/Notes | decimal+text | no | Box 2 |
| distributionCode | text | no | Box 3 (single-digit code) |
| fmvOnDateOfDeathAmount/Notes | decimal+text | no | Box 4 |
| hsa / archerMsa / maMsa | bool | no | Box 5 mutually-exclusive flags |

Storage path: `users/{uid}/1099-sa/{entryId}`

## 1099-int

| Field | Type | Required | Notes |
|---|---|---|---|
| PII_HEADER (incl. void) | mixed | yes | |
| payerRTN | text | no | Payer Routing Transit Number |
| fatcaFilingRequirement | bool | no | |
| interestIncomeAmount/Notes | decimal+text | no | Box 1 |
| earlyWithdrawalPenaltyAmount/Notes | decimal+text | no | Box 2 |
| usSavingsBondsTreasuryInterestAmount/Notes | decimal+text | no | Box 3 |
| federalIncomeTaxWithheldAmount/Notes | decimal+text | no | Box 4 |
| investmentExpensesAmount/Notes | decimal+text | no | Box 5 |
| foreignTaxPaidAmount/Notes | decimal+text | no | Box 6 |
| foreignCountryOrTerritory | text | no | Box 7 |
| taxExemptInterestAmount/Notes | decimal+text | no | Box 8 |
| specifiedPrivateActivityBondInterestAmount/Notes | decimal+text | no | Box 9 |
| marketDiscountAmount/Notes | decimal+text | no | Box 10 |
| bondPremiumAmount/Notes | decimal+text | no | Box 11 |
| bondPremiumTreasuryAmount/Notes | decimal+text | no | Box 12 |
| bondPremiumTaxExemptAmount/Notes | decimal+text | no | Box 13 |
| taxExemptTaxCreditBondCusip | text | no | Box 14 |
| stateInfo[] (2 slots) | array | no | StateInfo shape |

Storage path: `users/{uid}/1099-int/{entryId}`

## 1099-div

| Field | Type | Required | Notes |
|---|---|---|---|
| PII_HEADER (incl. void) | mixed | yes | |
| fatcaFilingRequirement | bool | no | |
| totalOrdinaryDividendsAmount/Notes | decimal+text | no | Box 1a |
| qualifiedDividendsAmount/Notes | decimal+text | no | Box 1b |
| totalCapitalGainDistributionsAmount/Notes | decimal+text | no | Box 2a |
| unrecapturedSection1250GainAmount/Notes | decimal+text | no | Box 2b |
| section1202GainAmount/Notes | decimal+text | no | Box 2c |
| collectibles28PercentGainAmount/Notes | decimal+text | no | Box 2d |
| section897OrdinaryDividendsAmount/Notes | decimal+text | no | Box 2e |
| section897CapitalGainAmount/Notes | decimal+text | no | Box 2f |
| nondividendDistributionsAmount/Notes | decimal+text | no | Box 3 |
| federalIncomeTaxWithheldAmount/Notes | decimal+text | no | Box 4 |
| section199ADividendsAmount/Notes | decimal+text | no | Box 5 |
| investmentExpensesAmount/Notes | decimal+text | no | Box 6 |
| foreignTaxPaidAmount/Notes | decimal+text | no | Box 7 |
| foreignCountryOrUsPossession | text | no | Box 8 |
| cashLiquidationDistributionsAmount/Notes | decimal+text | no | Box 9 |
| noncashLiquidationDistributionsAmount/Notes | decimal+text | no | Box 10 |
| exemptInterestDividendsAmount/Notes | decimal+text | no | Box 12 |
| specifiedPrivateActivityBondInterestDividendsAmount/Notes | decimal+text | no | Box 13 |
| stateInfo[] (2 slots) | array | no | StateInfo shape |

Storage path: `users/{uid}/1099-div/{entryId}`

## 1099-oid

| Field | Type | Required | Notes |
|---|---|---|---|
| PII_HEADER (incl. void) | mixed | yes | |
| fatcaFilingRequirement | bool | no | |
| originalIssueDiscountAmount/Notes | decimal+text | no | Box 1 |
| otherPeriodicInterestAmount/Notes | decimal+text | no | Box 2 |
| earlyWithdrawalPenaltyAmount/Notes | decimal+text | no | Box 3 |
| federalIncomeTaxWithheldAmount/Notes | decimal+text | no | Box 4 |
| marketDiscountAmount/Notes | decimal+text | no | Box 5 |
| acquisitionPremiumAmount/Notes | decimal+text | no | Box 6 |
| description | text | no | Box 7 |
| oidOnUSTreasuryObligationsAmount/Notes | decimal+text | no | Box 8 |
| investmentExpensesAmount/Notes | decimal+text | no | Box 9 |
| bondPremiumAmount/Notes | decimal+text | no | Box 10 |
| taxExemptOidAmount/Notes | decimal+text | no | Box 11 |
| stateInfo[] (2 slots) | array | no | StateInfo shape |

Storage path: `users/{uid}/1099-oid/{entryId}`

## 1099-b

| Field | Type | Required | Notes |
|---|---|---|---|
| void / corrected / calendarYear | bool/bool/text | no | |
| payerTIN / payerNameAddress / payerTelephone | text | yes | |
| recipientTIN / recipientFirstName / recipientLastName / recipientSuffix | text | yes | |
| recipientStreetAddress / recipientCityStateCountryZip | text | no | |
| accountNumber / secondTinNotice / cusipNumber / fatcaFilingRequirement | mixed | no | accountNumber/cusip = text; secondTinNotice/fatca = bool |
| applicableCheckboxOnForm8949 | text | no | One-of "A","B","C","D","E","F","X" |
| descriptionOfProperty | text | no | Box 1a |
| dateAcquired / dateSoldOrDisposed | text | no | Box 1b/1c |
| proceedsAmount/Notes | decimal+text | yes | Box 1d |
| costOrOtherBasisAmount/Notes | decimal+text | no | Box 1e |
| accruedMarketDiscountAmount/Notes | decimal+text | no | Box 1f |
| washSaleLossDisallowedAmount/Notes | decimal+text | no | Box 1g |
| shortTerm / longTerm / ordinary | bool | no | Box 2 type |
| proceedsFromCollectibles / proceedsFromQOF | bool | no | Box 3 |
| federalIncomeTaxWithheldAmount/Notes | decimal+text | no | Box 4 |
| noncoveredSecurity | bool | no | Box 5 |
| reportedToIRSGrossProceeds / reportedToIRSNetProceeds | bool | no | Box 6 |
| lossNotAllowedBasedOn1d | bool | no | Box 7 |
| profitLossClosedContractsAmount/Notes | decimal+text | no | Box 8 (Section 1256) |
| unrealizedProfitLossOpenContractsPriorAmount/Notes | decimal+text | no | Box 9 |
| unrealizedProfitLossOpenContractsCurrentAmount/Notes | decimal+text | no | Box 10 |
| aggregateProfitLossOnContractsAmount/Notes | decimal+text | no | Box 11 |
| basisReportedToIRS | bool | no | Box 12 |
| barteringAmount/Notes | decimal+text | no | Box 13 |
| stateInfo[] (1 slot) | array | no | StateInfo shape (single slot persisted) |

Storage path: `users/{uid}/1099-b/{entryId}`

## 1099-da

(Defined in `capital-statement-configs.ts`; persisted with DUAL copy_A_*/copy_Other_* prefix — the same logical fields appear twice, once for Copy A (issuer copy) and once for Copy Other (payee copy used for entry). 116 keys total.)

| Field | Type | Required | Notes |
|---|---|---|---|
| copyA_void_checkbox / copyOther_void_checkbox | bool | no | VOID flag |
| copyA_corrected_checkbox / copyOther_corrected_checkbox | bool | no | CORRECTED flag |
| copyA_box2_basis_reported_to_irs / copyOther_… | bool | no | Box 2 |
| copyA_box3a_reported_to_irs_gross_proceeds / copyOther_… | bool | no | Box 3a |
| copyA_box3a_reported_to_irs_net_proceeds / copyOther_… | bool | no | Box 3a |
| copyA_box3b_reserved_for_future_use / copyOther_… | bool | no | Box 3b |
| copyA_box3b_qof / copyOther_… | bool | no | Box 3b QOF |
| copyA_box5_loss_not_allowed_based_on_amount_in_1f / copyOther_… | bool | no | Box 5 |
| copyA_box6_short_term / copyA_box6_long_term / copyA_box6_ordinary (+copyOther_…) | bool | no | Box 6 |
| copyA_box7_check_if_1f_is_only_cash / copyOther_… | bool | no | Box 7 |
| copyA_box8_broker_relied_on_customer_provided_acquisition_information / copyOther_… | bool | no | Box 8 |
| copyA_box9_digital_asset_is_noncovered_security / copyOther_… | bool | no | Box 9 |
| copyA_box11a_qualifying_stablecoins / copyOther_… | bool | no | Box 11a |
| copyA_box11a_specified_nfts / copyOther_… | bool | no | Box 11a |
| copyA_filer_name / copyOther_filer_name | text | yes | Filer |
| copyA_filer_street_address / copyA_filer_room_or_suite_no / copyA_filer_city_or_town / copyA_filer_telephone_number / copyA_filer_state_or_province / copyA_filer_country / copyA_filer_zip_or_foreign_postal_code (+copyOther_…) | text | no | Filer address granular |
| copyA_filer_tin / copyOther_filer_tin | text | yes | Filer TIN |
| copyA_recipient_tin / copyOther_recipient_tin | text | yes | Recipient TIN |
| copyA_recipient_name / copyOther_recipient_name | text | yes | Recipient |
| copyA_recipient_street_address / copyA_recipient_apt_no / copyA_recipient_city_or_town / copyA_recipient_state_or_province / copyA_recipient_country / copyA_recipient_zip_or_foreign_postal_code (+copyOther_…) | text | no | Recipient address granular |
| copyA_account_number / copyOther_account_number | text | no | |
| copyA_cusip_number / copyOther_cusip_number | text | no | |
| copyA_box1a_code_for_digital_asset / copyOther_… | text | no | Digital asset code (Box 1a) |
| copyA_box1b_name_of_digital_asset / copyOther_… | text | no | Asset name (Box 1b) |
| copyA_box1c_number_of_units / copyOther_… | text | no | Units (Box 1c) — text not decimal (precision) |
| copyA_box1d_and_1e_dates / copyOther_… | text | no | Combined dates |
| copyA_box1d_date_acquired / copyOther_… | text | no | Box 1d |
| copyA_box1e_date_sold_or_disposed / copyOther_… | text | no | Box 1e |
| copyA_box1f_proceeds / copyOther_… | text | no | Box 1f (text not decimal in source) |
| copyA_box1g_cost_or_other_basis / copyOther_… | text | no | Box 1g |
| copyA_box1h_accrued_market_discount / copyOther_… | text | no | Box 1h |
| copyA_box1i_wash_sale_loss_disallowed / copyOther_… | text | no | Box 1i |
| copyA_box4_federal_income_tax_withheld / copyOther_… | text | no | Box 4 |
| copyA_box11b_number_of_transactions / copyOther_… | text | no | Box 11b |
| copyA_box11c_aggregate_gross_proceeds_of_specified_nfts / copyOther_… | text | no | Box 11c |
| copyA_box12a_number_of_units_transferred_in_1..3 / copyOther_… | text | no | Box 12a (three slots) |
| copyA_box12b_transfer_in_date / copyOther_… | text | no | Box 12b |
| copyA_box14_state_name_1 / copyA_box14_state_name_2 / copyOther_… | text | no | Box 14 (2 state slots) |
| copyA_box15_state_identification_no_1 / copyA_box15_state_identification_no_2 / copyOther_… | text | no | Box 15 |
| copyA_box16_state_tax_withheld_1 / copyA_box16_state_tax_withheld_2 / copyOther_… | text | no | Box 16 |
| copyA_applicable_checkbox_on_form_8949 / copyOther_… | text | no | 8949 code |

Storage path: `users/{uid}/1099-da/{entryId}`

## 1099-cap

| Field | Type | Required | Notes |
|---|---|---|---|
| void / corrected / calendarYear | bool/bool/text | no | |
| corporationTIN / corporationNameAddress / corporationTelephone | text | yes/no/no | |
| shareholderTIN / shareholderName / shareholderFirstName / shareholderLastName / shareholderSuffix | text | yes | |
| shareholderStreetAddress / shareholderCityStateCountryZip / accountNumber | text | no | |
| dateOfSaleOrExchange | text | no | Box 1 |
| aggregateAmountReceivedAmount/Notes | decimal+text | yes | Box 2 |
| numberOfSharesExchanged | decimal | no | Box 3 |
| classesOfStockExchanged | text | no | Box 4 |
| additionalInfo | text | no | |

Storage path: `users/{uid}/1099-cap/{entryId}`

## 2439

(From `capital-statement-configs.ts`; all values stored as TEXT — no amount/notes split. 11 fields.)

| Field | Type | Required | Notes |
|---|---|---|---|
| void / corrected | bool | no | |
| ricReitNameAddress | text | yes | RIC/REIT issuer |
| ricReitEin | text | yes | EIN |
| shareholderTin | text | yes | SSN/EIN |
| shareholderNameAddress | text | yes | |
| box1aTotalUndistributedLongTermCapitalGain | text | yes | Box 1a |
| box1bUnrecapturedSection1250Gain | text | no | Box 1b |
| box1cSection1202Gain | text | no | Box 1c |
| box1dCollectiblesGain | text | no | Box 1d (28%) |
| taxPaidOnUndistributedGains | text | no | Box 2 |

Storage path: `users/{uid}/2439/{entryId}`

## 3921

| Field | Type | Required | Notes |
|---|---|---|---|
| void / corrected / calendarYear | bool/bool/text | no | |
| transferorTIN / transferorNameAddress | text | yes | |
| employeeTIN / employeeFirstName / employeeLastName / employeeSuffix | text | yes | |
| employeeStreetAddress / employeeCityStateCountryZip / accountNumber | text | no | |
| dateOptionGranted | text | no | Box 1 |
| dateOptionExercised | text | no | Box 2 |
| exercisePricePerShareAmount/Notes | decimal+text | no | Box 3 |
| fairMarketValuePerShareAmount/Notes | decimal+text | no | Box 4 |
| sharesTransferredAmount/Notes | decimal+text | no | Box 5 (number of shares — stored decimal for fractional) |
| underlyingCorpTIN / underlyingCorpName / underlyingCorpStreetAddress / underlyingCorpCityStateCountryZip | text | no | Box 6 (if other than transferor) |

Storage path: `users/{uid}/3921/{entryId}`

## 6781

(From `capital-statement-configs.ts`; 71 fields — almost all generic `page1_0_f1_<n>_0` text slots + `page1_0_c1_<n>_<m>` boolean slots mirroring the PDF field layout. No semantic Section/Box names persisted. Recommend mapping to semantic names in SQL via translation table.)

| Field | Type | Required | Notes |
|---|---|---|---|
| page1_0_c1_<n>_<m> | bool | no | Multiple checkbox slots (Box A/B/C/D for elections; mixed straddle indicators) |
| page1_0_f1_<n>_0 | text | no | All amount/identifier slots stored as text (e.g. property descriptions, gain/loss amounts, contract names) |

Storage path: `users/{uid}/6781/{entryId}`

## child-interest-dividends (Form 8814)

(Entries are PER CHILD — multiple children per filing. The form-level `electionMade` gate is stored separately in a state service, NOT in each entry.)

| Field | Type | Required | Notes |
|---|---|---|---|
| id | text | yes | Client-generated entry id |
| childFirstName / childLastName / childSsn | text | yes | Child identity |
| line1aTaxableInterest | decimal | no | Per Form 8814 line 1a |
| line1bTaxExemptInterest | decimal | no | Line 1b |
| line2aOrdinaryDividends | decimal | no | Line 2a |
| line2bQualifiedDividends | decimal | no | Line 2b |
| line3CapGainDistributions | decimal | no | Line 3 |
| statementDerived | object/null | no | Server-supplied: `{ line1aTaxableInterest, line1bTaxExemptInterest, line2aOrdinaryDividends, line2bQualifiedDividends, line3CapGainDistributions, sourceCount }` (cached aggregation from child's own statements) |
| saving | bool | no | UI-only — should NOT be persisted in SQL |

Storage path: `users/{uid}/child-interest-dividends/{entryId}` (one document per child)

## 8606

(Single-document per person per tax year — stores Form 8606 directly with PDF-aligned field names. All amount fields stored as TEXT not decimal — preserves user-entered formatting.)

| Field | Type | Required | Notes |
|---|---|---|---|
| paid_preparer_self_employed_checkbox | bool | no | |
| taxpayer_name / taxpayer_ssn | text | yes | |
| home_address_street / home_address_apt_no / home_address_city_state_zip | text | no | |
| foreign_country_name / foreign_province_state_county / foreign_postal_code | text | no | |
| part1_line1_nondeductible_contributions | text | no | Line 1 |
| part1_line2_total_basis_traditional_iras | text | no | Line 2 |
| part1_line3_add_lines1_and_2 | text | no | Line 3 |
| part1_line4_contributions_made_after_year_end_for_tax_year | text | no | Line 4 |
| part1_line5_line3_minus_line4 | text | no | Line 5 |
| part1_line6_dec31_value_all_traditional_sep_simple_iras | text | no | Line 6 |
| part1_line7_distributions_excluding_rollovers_and_other_exclusions | text | no | Line 7 |
| part1_line8_net_amount_converted_to_roth | text | no | Line 8 |
| part1_line9_add_lines6_7_8 | text | no | Line 9 |
| part1_line10_ratio_whole_part / part1_line10_ratio_decimal_part | text | no | Line 10 (two-part decimal) |
| part1_line11_nontaxable_portion_converted_amount | text | no | Line 11 |
| part1_line12_nontaxable_portion_distributions_not_converted | text | no | Line 12 |
| part1_line13_total_nontaxable_distributions | text | no | Line 13 |
| part1_line14_total_basis_end_of_year | text | no | Line 14 |
| part1_line15a_line7_minus_line12 | text | no | Line 15a |
| part1_line15b_qualified_disaster_distributions_amount | text | no | Line 15b |
| part1_line15c_taxable_amount | text | no | Line 15c |
| part2_line16_net_amount_converted_to_roth | text | no | Line 16 |
| part2_line17_basis_in_converted_amount | text | no | Line 17 |
| part2_line18_taxable_conversion_amount | text | no | Line 18 |
| part3_line19_total_nonqualified_roth_distributions | text | no | Line 19 |
| part3_line20_qualified_first_time_homebuyer_expenses | text | no | Line 20 |
| part3_line21_line19_minus_line20 | text | no | Line 21 |
| part3_line22_basis_in_roth_contributions | text | no | Line 22 |
| part3_line23_line21_minus_line22 | text | no | Line 23 |
| part3_line24_basis_in_conversions_and_rollovers_to_roth | text | no | Line 24 |
| part3_line25a_line23_minus_line24 | text | no | Line 25a |
| part3_line25b_qualified_disaster_distributions_amount | text | no | Line 25b |
| part3_line25c_taxable_amount | text | no | Line 25c |
| signature_taxpayer_if_filing_by_itself / signature_date_if_filing_by_itself | text | no | |
| paid_preparer_name_and_signature / paid_preparer_firm_name_or_address / paid_preparer_ptin / paid_preparer_firm_ein_or_phone | text | no | Preparer block |

Storage path: `users/{uid}/8606/{entryId}` (typically one doc; backend aggregates if multiple)

## 1099-r

| Field | Type | Required | Notes |
|---|---|---|---|
| void / corrected / calendarYear | bool/bool/text | no | |
| PII_HEADER | mixed | yes | |
| grossDistributionAmount/Notes | decimal+text | yes | Box 1 |
| taxableAmountAmount/Notes | decimal+text | no | Box 2a |
| taxableAmountNotDetermined | bool | no | Box 2b |
| totalDistribution | bool | no | Box 2b |
| capitalGainIncludedIn2aAmount/Notes | decimal+text | no | Box 3 |
| federalIncomeTaxWithheldAmount/Notes | decimal+text | no | Box 4 |
| employeeOrRothContributionsOrPremiumsAmount/Notes | decimal+text | no | Box 5 |
| netUnrealizedAppreciationAmount/Notes | decimal+text | no | Box 6 |
| distributionCodes | text | yes | Box 7 (one or two letters/digits) |
| iraSepSimple | bool | no | Box 7 IRA/SEP/SIMPLE flag |
| otherAmount | decimal | no | Box 8 amount |
| otherPercentage | text | no | Box 8 percent (text — fractional %) |
| yourPercentageOfTotalDistribution | text | no | Box 9a |
| totalEmployeeContributionsAmount/Notes | decimal+text | no | Box 9b |
| amountAllocableToIRRWithin5YearsAmount/Notes | decimal+text | no | Box 10 |
| firstYearOfDesignatedRothContrib | text | no | Box 11 |
| fatcaFilingRequirement | bool | no | Box 12 |
| dateOfPayment | text | no | Box 13 |
| stateLocalInfo[] (2 slots) | array | no | per-item: `stateTaxWithheldAmount/Notes, payerStateId, stateDistributionAmount/Notes, localTaxWithheldAmount/Notes, localityName, localDistributionAmount/Notes` |

Storage path: `users/{uid}/1099-r/{entryId}`

## 5498

| Field | Type | Required | Notes |
|---|---|---|---|
| void / corrected / calendarYear | bool/bool/text | no | |
| trusteeOrIssuerTIN / trusteeOrIssuerNameAddress | text | yes | |
| participantTIN / participantFirstName / participantLastName / participantSuffix | text | yes | |
| participantStreetAddress / participantCityStateCountryZip / accountNumber | text | no | |
| iraContributionsAmount/Notes | decimal+text | no | Box 1 |
| rolloverContributionsAmount/Notes | decimal+text | no | Box 2 |
| rothConversionAmount/Notes | decimal+text | no | Box 3 |
| recharacterizedContributionsAmount/Notes | decimal+text | no | Box 4 |
| fmvOfAccountAmount/Notes | decimal+text | no | Box 5 |
| lifeInsuranceCostIncludedInBox1Amount/Notes | decimal+text | no | Box 6 |
| iraCheckbox / sepCheckbox / simpleCheckbox / rothIraCheckbox | bool | no | Box 7 |
| sepContributionsAmount/Notes | decimal+text | no | Box 8 |
| simpleContributionsAmount/Notes | decimal+text | no | Box 9 |
| rothIraContributionsAmount/Notes | decimal+text | no | Box 10 |
| rmdForNextYear | bool | no | Box 11 |
| rmdDate | text | no | Box 12a |
| rmdAmountAmount/Notes | decimal+text | no | Box 12b |
| postponedLateContributionsAmount/Notes | decimal+text | no | Box 13a |
| postponedLateContributionsYear | text | no | Box 13b |
| postponedLateContributionsCode | text | no | Box 13c |
| repaymentsAmount/Notes | decimal+text | no | Box 14a |
| repaymentsCode | text | no | Box 14b |
| fmvOfCertainSpecifiedAssetsAmount/Notes | decimal+text | no | Box 15a |
| specifiedAssetsCodes | text | no | Box 15b (code list) |

Storage path: `users/{uid}/5498/{entryId}`

## rrb-1099

| Field | Type | Required | Notes |
|---|---|---|---|
| corrected / duplicate / calendarYear | bool/bool/text | no | |
| claimNumberPayeeCode | text | yes | Box 1 |
| recipientIdNumber | text | yes | Box 2 |
| ssebGrossAmount/Notes | decimal+text | no | Box 3 |
| ssebRepaidAmount/Notes | decimal+text | no | Box 4 |
| netSSEBAmount/Notes | decimal+text | no | Box 5 (Box 3 - Box 4; may be negative) |
| workersCompOffsetAmount/Notes | decimal+text | no | Box 6 |
| ssebPriorYearY1Amount/Notes | decimal+text | no | Box 7 |
| ssebPriorYearY2Amount/Notes | decimal+text | no | Box 8 |
| ssebPriorYearY3PlusAmount/Notes | decimal+text | no | Box 9 |
| federalIncomeTaxWithheldAmount/Notes | decimal+text | no | Box 10 |
| medicarePremiumsTotalAmount/Notes | decimal+text | no | Box 11 |

Storage path: `users/{uid}/rrb-1099/{entryId}`

## rrb-1099-r

| Field | Type | Required | Notes |
|---|---|---|---|
| corrected / duplicate / calendarYear | bool/bool/text | no | |
| claimNumberPayeeCode | text | yes | Box 1 |
| recipientIdNumber | text | yes | Box 2 |
| employeeContributionsCostAmount/Notes | decimal+text | no | Box 3 |
| contributoryAmountPaidAmount/Notes | decimal+text | no | Box 4 |
| vestedDualBenefitAmount/Notes | decimal+text | no | Box 5 |
| supplementalAnnuityAmount/Notes | decimal+text | no | Box 6 |
| totalGrossPaidAmount/Notes | decimal+text | no | Box 7 (= 4+5+6) |
| repaymentsPriorUnknownYearsAmount/Notes | decimal+text | no | Box 8 |
| federalIncomeTaxWithheldAmount/Notes | decimal+text | no | Box 9 |
| medicarePremiumsTotalAmount/Notes | decimal+text | no | Box 10 |

Storage path: `users/{uid}/rrb-1099-r/{entryId}`

## ssa-1099

| Field | Type | Required | Notes |
|---|---|---|---|
| calendarYear | text | no | |
| beneficiarySSN | text | yes | Box 2 |
| beneficiaryFirstName / beneficiaryLastName / beneficiarySuffix | text | yes | Box 1 |
| beneficiaryStreetAddress / beneficiaryCityStateCountryZip | text | no | Box 7 |
| claimNumber | text | no | Box 8 |
| benefitsPaidGrossAmount/Notes | decimal+text | yes | Box 3 |
| benefitsRepaidAmount/Notes | decimal+text | no | Box 4 |
| netBenefitsAmount/Notes | decimal+text | yes | Box 5 (= Box 3 - Box 4; may be negative) |
| voluntaryFederalIncomeTaxWithheldAmount/Notes | decimal+text | no | Box 6 |

Storage path: `users/{uid}/ssa-1099/{entryId}`

## 1099-a

| Field | Type | Required | Notes |
|---|---|---|---|
| void / corrected / calendarYear | bool/bool/text | no | |
| lenderTIN / lenderNameAddress / lenderTelephone | text | yes/no/no | |
| borrowerTIN / borrowerName / borrowerFirstName / borrowerLastName / borrowerSuffix | text | yes | |
| borrowerStreetAddress / borrowerCityStateCountryZip / accountNumber | text | no | |
| dateOfAcquisitionOrAbandonment | text | no | Box 1 |
| balanceOfPrincipalOutstandingAmount/Notes | decimal+text | no | Box 2 |
| fairMarketValueOfPropertyAmount/Notes | decimal+text | no | Box 4 |
| borrowerPersonallyLiable | bool | no | Box 5 |
| descriptionOfProperty | text | no | Box 6 |

Storage path: `users/{uid}/1099-a/{entryId}`

## 1099-c

| Field | Type | Required | Notes |
|---|---|---|---|
| void / corrected / calendarYear | bool/bool/text | no | |
| creditorTIN / creditorNameAddress / creditorTelephone | text | yes | |
| debtorTIN / debtorName / debtorFirstName / debtorLastName / debtorSuffix | text | yes | |
| debtorStreetAddress / debtorCityStateCountryZip / accountNumber | text | no | |
| dateOfIdentifiableEvent | text | no | Box 1 |
| amountOfDebtDischargedAmount/Notes | decimal+text | yes | Box 2 |
| interestIncludedInBox2Amount/Notes | decimal+text | no | Box 3 |
| debtDescription | text | no | Box 4 |
| debtorPersonallyLiable | bool | no | Box 5 |
| identifiableEventCode | text | no | Box 6 (single-letter code A-I) |
| fairMarketValueOfPropertyAmount/Notes | decimal+text | no | Box 7 |

Storage path: `users/{uid}/1099-c/{entryId}`

## 1099-g

| Field | Type | Required | Notes |
|---|---|---|---|
| PII_HEADER (incl. void) | mixed | yes | |
| unemploymentCompensationAmount/Notes | decimal+text | no | Box 1 |
| stateLocalIncomeTaxRefundsAmount/Notes | decimal+text | no | Box 2 |
| box2Year | text | no | Box 3 (year applicable to Box 2) |
| federalIncomeTaxWithheldAmount/Notes | decimal+text | no | Box 4 |
| rtaaPaymentsAmount/Notes | decimal+text | no | Box 5 |
| taxableGrantsAmount/Notes | decimal+text | no | Box 6 |
| agriculturePaymentsAmount/Notes | decimal+text | no | Box 7 |
| tradeOrBusinessIncome | bool | no | Box 8 |
| marketGainAmount/Notes | decimal+text | no | Box 9 |
| stateInfo[] (2 slots) | array | no | per-item: `state, payerStateId, stateIncomeTaxWithheldAmount/Notes` |

Storage path: `users/{uid}/1099-g/{entryId}`

## 1099-s

| Field | Type | Required | Notes |
|---|---|---|---|
| void / corrected / calendarYear | bool/bool/text | no | |
| filerTIN / filerName / filerNameAddress (legacy) | text | yes | |
| filerStreetAddress / filerRoomSuite / filerCity / filerTelephone / filerStateOrProvince / filerCountry / filerZipCode | text | no | |
| transferorTIN / transferorName / transferorFirstName / transferorLastName / transferorSuffix | text | yes | |
| transferorStreetAddress / transferorAptNumber / transferorCity / transferorStateOrProvince / transferorCountry / transferorZipCode | text | no | |
| transferorCityStateCountryZip | text | no | Legacy combined |
| accountNumber | text | no | |
| dateOfClosing | text | no | Box 1 |
| grossProceedsAmount/Notes | decimal+text | yes | Box 2 |
| cashGrossProceedsAmount/Notes | decimal+text | no | Box 2a |
| digitalAssetGrossProceedsAmount/Notes | decimal+text | no | Box 2b |
| propertyAddressOrLegalDescription | text | yes | Box 3 |
| buyersPartOfRealEstateTaxAmount/Notes | decimal+text | no | Box 6 |
| considerationIncludesPropertyOrServices | bool | no | Box 4 |
| transferorIsForeignPerson | bool | no | Box 5 |
| digitalAssetCode / digitalAssetName / digitalAssetUnits / digitalAssetDate | text | no | New digital asset blocks |

Storage path: `users/{uid}/1099-s/{entryId}`

## 4684

(From `capital-statement-configs.ts`; 162 fields — almost entirely generic `page1_0_*` / `page2_0_*` PDF-slot keys. Casualty and theft loss schedule.)

| Field | Type | Required | Notes |
|---|---|---|---|
| page<N>_0_c<...>_<n>_<m> | bool | no | All checkbox slots (election boxes, federally declared disaster flags) |
| page<N>_0_f<...>_<n>_0 | text | no | All text/amount slots — descriptions, dates, FMV before/after, basis, insurance recoveries |

Storage path: `users/{uid}/4684/{entryId}`

## 4797

(From `capital-statement-configs.ts`; 182 fields — largest in capital configs. Generic page1_0_* / page2_0_* PDF-slot keys throughout. Sales of business property — Part I/II/III/IV.)

| Field | Type | Required | Notes |
|---|---|---|---|
| page<N>_0_c<...>_<n>_<m> | bool | no | Checkbox slots (recapture elections, ordinary income flags) |
| page<N>_0_f<...>_<n>_0 | text | no | All amount/descriptor slots — property descriptions, dates acquired/sold, gross sales price, depreciation, cost basis, gain |

Storage path: `users/{uid}/4797/{entryId}`

## 6252

| Field | Type | Required | Notes |
|---|---|---|---|
| page1_0_c1_1_0 / page1_0_c1_1_1 | bool | no | Checkbox slots (Year of sale / Installment sale election) |
| page1_0_c1_2_0 / page1_0_c1_2_1 | bool | no | |
| page1_0_c1_3_0 / page1_0_c1_3_1 | bool | no | |
| page1_0_c1_4_0 ... page1_0_c1_4_4 | bool | no | 5 checkboxes (related-party indicators) |
| page1_0_f1_1_0 ... page1_0_f1_38_0 | text | no | 38 generic text slots — description of property, dates, gross profit %, payments received, related-party info |

Storage path: `users/{uid}/6252/{entryId}`

## 8824

(From `capital-statement-configs.ts`; 63 fields. Like-Kind Exchanges. Generic page1_0_* / page2_0_* PDF-slot keys.)

| Field | Type | Required | Notes |
|---|---|---|---|
| page<N>_0_c<...>_<n>_<m> | bool | no | Checkbox slots (related-party flags, multi-asset exchange) |
| page<N>_0_f<...>_<n>_0 | text | no | Property descriptions, dates identified/received, FMV, adjusted basis, realized/recognized gain |

Storage path: `users/{uid}/8824/{entryId}`

## schedule-k1-1041

(82 fields — mix of semantic Section 199A QBI fields PLUS generic PDF-slot keys. Component uses raw page1_0_* keys; capital-statement-configs.ts adds 8 semantic keys for 199A.)

| Field | Type | Required | Notes |
|---|---|---|---|
| recipientTIN | text | yes | TIN of the recipient (taxpayer or spouse) |
| section199AQualifiedBusinessIncomeAmount | text | no | Attached 199A statement — QBI amount |
| section199AQualifiedReitDividendsAmount | text | no | 199A — REIT dividends |
| section199AQualifiedPtpIncomeOrLossAmount | text | no | 199A — PTP income/loss |
| section199AW2WagesAmount | text | no | 199A — W-2 wages |
| section199AUbiaQualifiedPropertyAmount | text | no | 199A — UBIA |
| section199AIsSstb | bool | no | 199A — SSTB indicator |
| section199AStatementNotes | text | no | 199A — preparer notes |
| page1_0_left_col_0_c<...>_<n>_<m> | bool | no | Left-column checkboxes (final K-1, amended) |
| page1_0_page_header_0_c<...> / f<...> | mixed | no | Header date/year fields |
| page1_0_left_col_0_f<...>_<n>_0 | text | no | Left-column text — fiduciary name/EIN, beneficiary name/SSN/address |
| page1_0_right_col_0_lines1_10_0_f1_<12-29>_0 | text | no | Lines 1-10 (interest, dividends, capital gains, rental, other portfolio) |
| page1_0_right_col_0_lines11_14_0_f1_<30-67>_0 | text | no | Lines 11-14 (final-year deductions, AMT items, credits, other info codes) |

Storage path: `users/{uid}/schedule-k1-1041/{entryId}`

## schedule-k1-1065

(119 fields — same dual-shape as K-1 1041: semantic 199A keys + page1_0_* generic PDF slots. Partner's share.)

| Field | Type | Required | Notes |
|---|---|---|---|
| recipientTIN | text | yes | |
| section199AQualifiedBusinessIncomeAmount | text | no | |
| section199AQualifiedReitDividendsAmount | text | no | |
| section199AQualifiedPtpIncomeOrLossAmount | text | no | |
| section199AW2WagesAmount | text | no | |
| section199AUbiaQualifiedPropertyAmount | text | no | |
| section199AIsSstb | bool | no | |
| section199AStatementNotes | text | no | |
| page1_0_c<...>_<n>_<m> | bool | no | Checkboxes — final K-1, amended, partner type (general/LP/LLC member-manager), domestic/foreign, etc. |
| page1_0_f<...>_<n>_0 | text | no | Partnership name/EIN, partner SSN/name/address, partner capital account, profit/loss/cap %, lines 1-23 (ordinary income, guaranteed payments, real estate, dividends, royalties, capital gains, Section 1231, credits, distributions) |

Storage path: `users/{uid}/schedule-k1-1065/{entryId}`

## schedule-k1-1120s

(122 fields — same dual-shape. Shareholder's share of S-corp income.)

| Field | Type | Required | Notes |
|---|---|---|---|
| recipientTIN | text | yes | |
| section199AQualifiedBusinessIncomeAmount | text | no | |
| section199AQualifiedReitDividendsAmount | text | no | |
| section199AQualifiedPtpIncomeOrLossAmount | text | no | |
| section199AW2WagesAmount | text | no | |
| section199AUbiaQualifiedPropertyAmount | text | no | |
| section199AIsSstb | bool | no | |
| section199AStatementNotes | text | no | |
| page1_0_c<...>_<n>_<m> | bool | no | Checkboxes — final K-1, amended, S-corp shareholder type |
| page1_0_f<...>_<n>_0 | text | no | S-corp name/EIN, shareholder SSN/name/address, ownership %, lines 1-17 (ordinary income, real estate, dividends, royalties, capital gains, Section 1231, credits, distributions, AMT items, foreign transactions) |

Storage path: `users/{uid}/schedule-k1-1120s/{entryId}`

## 1099-ptr (Form 1099-PATR)

| Field | Type | Required | Notes |
|---|---|---|---|
| PII_HEADER (incl. void) | mixed | yes | |
| patronageDividendsAmount/Notes | decimal+text | no | Box 1 |
| nonpatronageDistributionsAmount/Notes | decimal+text | no | Box 2 |
| perUnitRetainAllocationsAmount/Notes | decimal+text | no | Box 3 |
| federalIncomeTaxWithheldAmount/Notes | decimal+text | no | Box 4 |
| redeemedNonqualifiedNoticesAmount/Notes | decimal+text | no | Box 5 |
| section199AgDeductionAmount/Notes | decimal+text | no | Box 6 |
| qualifiedPayments199Ab7Amount/Notes | decimal+text | no | Box 7 |
| section199AaQualifiedItemsAmount/Notes | decimal+text | no | Box 8 |
| section199AaSstbItemsAmount/Notes | decimal+text | no | Box 9 |
| investmentCreditAmount/Notes | decimal+text | no | Box 10 |
| workOpportunityCreditAmount/Notes | decimal+text | no | Box 11 |
| otherCreditsAndDeductionsAmount/Notes | decimal+text | no | Box 12 |
| specifiedCoop | bool | no | Box 13 (specified agricultural/horticultural cooperative flag) |

Storage path: `users/{uid}/1099-ptr/{entryId}`

---

## Cross-form SQL design notes

1. **Common columns on EVERY statement entry table**: `entry_id UUID PK`, `user_id UUID NOT NULL`, `form_id TEXT NOT NULL` (redundant if per-form table), `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`, `tax_year INT NULL` (derived from `calendarYear` where present).
2. **Per-form tables vs single-table-inheritance**: Recommend per-form table — each 1099 variant has 30-80 distinct columns and a small number of common columns. STI would create 250+ NULL-able columns.
3. **Array fields → child tables**: `stateInfo`, `stateLocalInfo`, `box12Entries`, `box14Other`, `coveredIndividuals`, `coverageMonthly`, `partIIMonthlyRows`, `partIIICoveredIndividuals` all become 1:N child tables keyed on parent `entry_id` + `slot_index` (ordered position preserved).
4. **Amount + Notes pairs** (the dominant pattern, ~200+ pairs across all forms): keep as two columns `<box>_amount NUMERIC(15,2)` + `<box>_notes TEXT`. Do NOT collapse to a JSON column — would lose queryability for tax-compute pipelines that need per-box numeric aggregation.
5. **Generic PDF-slot forms** (6252, 6781, 4684, 4797, 8824, schedule-k1-*): the persisted key (`page1_0_f1_<n>_0`) is OPAQUE without a translation map. Either (a) translate to semantic names at SQL load time using a `pdf_field_map_semantic.csv` lookup, or (b) keep the opaque keys in a `field_values JSONB` column with no schema enforcement. (a) is preferred for compute pipelines; (b) is simpler if only used for PDF export round-trip.
6. **1099-DA dual-copy duplication**: every field exists twice (`copyA_*` and `copyOther_*`). The duplication is structural to the IRS form layout (issuer's copy vs payee's copy). Recommend persisting ONLY `copyOther_*` (primary data) in SQL; reconstruct Copy A on PDF export. Saves ~58 columns.
7. **Text-typed amount fields on 8606, 2439, K-1s, 6252, 6781, 4684, 4797, 8824**: source persists as TEXT to preserve user-entered formatting and IRS PDF slot constraints. In SQL, store as TEXT and parse to NUMERIC only when consuming for compute (back end already has `parseAmountAndNotes()` for this).
8. **Person-scope**: most statement entries belong to taxpayer OR spouse. The current schema does NOT carry an explicit `owner: 'taxpayer'|'spouse'` discriminator on each entry — instead the issuer-side TIN (`recipientTIN`/`payeeTIN`/`employeeSSN`) is matched against personal-form SSN at compute time. SQL design should ADD an explicit `owner_role` column to avoid TIN matching at query time.
9. **`child-interest-dividends` (Form 8814) is per-dependent**: each entry is for a child. Separate from per-person statement entries — recommend distinct table `child_interest_dividends_entries`.
10. **W-2 special: `hasUncommonW2Situations`** is a UI-gating boolean only; persisted but does not affect compute beyond exposing additional fields. Safe to drop in SQL if storage trimming is desired.
