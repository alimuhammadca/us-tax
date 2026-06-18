# TurboTax Knowledge Base

## Source And Scope

- Source folder: `C:\us-tax\Maaz\turbo_tax`
- Review date: April 6, 2026
- Corpus size: `1484` PNG screenshots and `124` YAML companion files
- Major areas:
  - `personal_information`: `160` screenshots, `14` YAML flows
  - `wages&income`: `818` screenshots, `64` YAML flows
  - `deductions&credits`: `506` screenshots, `46` YAML flows
- This document combines:
- representative visual review of the screenshots
  - topic and flow extraction from the YAML companions
- Not every screenshot was manually transcribed one by one. Breadth comes from the YAML inventory; UX and reveal-pattern observations come from sampled screenshots across the corpus.

## What This Knowledge Base Captures

- the overall TurboTax interview structure
- recurring UI patterns from the screenshots
- how yes/no answers, uncommon flags, and selected options reveal follow-up questions
- topic-by-topic flow notes for `Personal information`, `Wages & income`, and `Deductions & credits`
- an inventory of the discovered TurboTax topic flows
- practical design takeaways for improving our own user-input forms

## Key High-Level Takeaways

- TurboTax is strongly interview-driven, not form-driven
- it usually asks one high-value question per screen
- most topics start with a screening question and skip the subtree on `No`
- uncommon cases are hidden behind explicit uncommon branches
- large areas use hub pages with `Start`, `Update`, and current-value summaries
- entity-specific context like employer name or property address is carried into later screens

## What The TurboTax Interview Looks Like

- TurboTax Deluxe 2024 is organized as an interview, not as a traditional long form.
- The global top navigation is stable:
  - `PERSONAL INFO`
  - `FEDERAL TAXES`
  - `STATE TAXES`
  - `REVIEW`
  - `FILE`
- Inside `FEDERAL TAXES`, the main working tabs are also stable:
  - `Wages & Income`
  - `Deductions & Credits`
  - `Other Tax Situations`
  - `Federal Review`
  - `Smart Check`
- Most working screens follow the same layout:
  - one prominent blue question heading
  - short explanatory text
  - one control or one small related control group
  - `Back` and `Continue` buttons fixed near the bottom
  - optional `Learn More` or `More Info` links
- Some pages are topic hubs rather than question screens. Those pages show:
  - topic group headings
  - current entered amount or `$0`
  - `Start`, `Update`, or `Visit All` actions
- The interface keeps context visible:
  - federal refund amount at the top
  - sometimes state amount at the top
  - entity-specific titles like employer name, property address, or charity context

## Observed Question Styles

- Single text field prompts
  - Example: `What's Your Name?`
- Simple yes/no prompts
  - sometimes as radio buttons
  - sometimes as two large `Yes` / `No` buttons
- One-of-many choice prompts
  - filing status
  - relationship
  - state
  - category
- Checklists for conditions
  - special conditions
  - uncommon situations
  - items that apply to a person, vehicle, donation, or property
- Numeric entry screens
  - tax document boxes
  - expenses
  - withheld tax
  - carryovers
- Date screens
  - birth dates
  - move-in dates
  - acquisition dates
  - death dates
- Repeating-record flows
  - multiple W-2s
  - multiple donations
  - multiple states
  - multiple dependents
  - multiple properties or assets

## Core Interview Patterns

### 1. Screening First, Details Second

- TurboTax usually starts a topic with a screening question.
- If the user answers `No`, TurboTax often skips the rest of the topic.
- If the user answers `Yes`, TurboTax opens a detail subtree.
- This keeps rare topics out of the main path.

### 2. One High-Value Question Per Screen

- TurboTax strongly prefers short, focused screens.
- Even when a topic logically belongs together, it is often broken into multiple screens.
- Example from screenshots:
  - name entry starts with only first name
  - W-2 starts with only employer EIN
  - donations start with only the screening decision

### 3. Basic Before Uncommon

- TurboTax captures common fields first.
- Less common items are usually behind:
  - a checkbox such as `My form has info in other boxes`
  - a dedicated `Less Common Items` section
  - explicit labels like `No (uncommon)`
  - a later `Uncommon Situations` screen

### 4. Contextualized Titles

- TurboTax personalizes prompts with prior answers.
- Examples:
  - `Let's confirm your allocated tips from ENC Solutions`
  - `Allocating Interest and Taxes`
  - property-specific heading like `127 street near gateway`
- This reduces ambiguity when the user is editing multiple records.

### 5. Topic Hub Plus Sub-Interview

- Many areas use a two-level pattern:
  - a hub page with `Start` / `Update` / `Visit All`
  - an inner interview for the chosen subtopic
- The hub page also acts as a progress and review surface.

### 6. Entity-Centric Repetition

- TurboTax treats each tax object as an entity:
  - one employer
  - one W-2
  - one dependent
  - one property
  - one charity donation
  - one 1099
- Each entity gets its own mini-flow.
- The user then returns to a list or hub to add another one.

### 7. Inline Validation And Review

- Validation is visible and immediate.
- Screenshot evidence shows:
  - red warning banner
  - `We found something wrong with your info.`
  - inline `Needs info.`
- TurboTax does not bury validation only at the very end.

### 8. Educational Framing Before Data Entry

- Many screens explain:
  - what the form is
  - why the question matters
  - what counts and what does not count
- Example:
  - `Did you receive any 1099-R forms?` lists typical sources before asking yes/no.

## Reveal Logic Patterns

## Boolean Gates

- A boolean answer often gates an entire topic subtree.
- Examples inferred from screenshots and YAML:
  - `Did you receive Social Security or Railroad Retirement benefits in 2024?`
  - `Did you pay for child and dependent care in 2024?`
  - `Did you pay any home loans in 2024?`
  - `Did you have any income for a business in 2024?`
  - `Do you want to enter your donations for 2024?`

## Rare Case Expansion

- TurboTax hides unusual complexity until the user explicitly signals it.
- Examples:
  - W-2 `allocated tips`
  - 1099-INT `My form has info in other boxes`
  - interest adjustments
  - state-specific tax-exempt interest rules
  - foreign account and FATCA follow-ups

## Branches Off Of Selected Options

- Option selections often determine which subsequent questions appear.
- Examples:
  - dependent relationship changes later custody/support questions
  - marital status changes spouse/filing flow
  - military status changes pay-grade and reservist questions
  - donation category changes the valuation and substantiation path
  - property/rental answers change mortgage, expense, and vehicle follow-ups

## Checkbox-Driven Subquestions

- TurboTax frequently asks `Do any of these apply?`
- The selected flags then imply follow-up details.
- Examples:
  - special conditions
  - W-2 box 13
  - dependent conditions
  - uncommon interest situations

## Prior-Year And Carryover Branches

- If the user reports a carryover, amended timing issue, or lump-sum payment, TurboTax opens prior-year data capture.
- Examples:
  - charitable carryovers
  - capital loss carryover
  - prior-year estimated taxes paid in current year
  - lump-sum Social Security / RRB payments
  - homebuyer credit carryover

## State And Local Branching

- State and local detail capture is not shown unless the source form or situation supports it.
- Examples:
  - W-2 state/local boxes
  - 1099-INT state tax sections
  - estimated state and local tax payments
  - state-specific tax treatment follow-ups

## High-Level UI Lessons From The Screenshots

- Use a conversational heading instead of a dense form title.
- Put one decision on screen unless several fields are inseparable.
- Place guidance above the input, not buried below it.
- Use clear labels for rare paths:
  - `uncommon`
  - `Less common items`
  - `Other situations`
- Carry entity context forward into the title.
- Let the user return to a hub with current amounts and `Update` buttons.
- Expose review states as part of normal flow, not only at filing time.

## Topic Knowledge By Area

## Personal Information

### What TurboTax Asks Here

- Identity:
  - name
  - middle initial
  - suffix
  - birth date
- Occupation and status:
  - occupation
  - military service
  - student status
- Residence:
  - ZIP code
  - state of residence
  - prior state
  - residency date
- Special conditions:
  - legally blind
  - nonresident alien / dual-status spouse
  - deceased before filing
  - incarcerated
  - language preference
- Marital / spouse:
  - marital status
  - file jointly or not
  - spouse death year
- Dependents:
  - whether the taxpayer supports anyone
  - who the dependent is
  - identity, residency, support, custody, filing behavior

### Strong Reveal Patterns Here

- Military service opens a large subtree:
  - status
  - duty category
  - pay grade
  - reservist travel
  - combat zone
  - residence issues
- Special conditions open subordinate questions:
  - if deceased, ask date of death
  - if language preference, ask preferred language
  - if nonresident alien, ask residency-election questions
- Marital status controls spouse and filing-status follow-ups.
- Dependent support answers open a major dependent-specific subtree.

### Personal Information Flow Inventory

- `Your Information`
- `Personal Identifiers`
- `Address`
- `Home And Mailing Address`
- `Contact Information`
- `Military Service`
- `Tax Residency`
- `Your Special Conditions`
- `Your Student And Enrollment Status`
- `Your Marital Status`
- `Your Filing Status`
- `Spouse Information`
- `Dependents Information`

## Wages & Income

### W-2 Wages And Salaries

- Observed screenshot pattern:
  - starts with employer EIN only
  - then moves into employee and employer detail
  - then wages and withholding boxes
  - then uncommon W-2 follow-ups
- YAML flows:
  - `W-2 Income Information`
  - `Employer Identification`
  - `Employee Information`
  - `Income & Taxes Withheld`
  - `Additional W2 Information`
  - `Uncommon W-2 Situations`
- Good reusable lessons:
  - start from the most locating field on the source document
  - separate common boxes from uncommon boxes
  - personalize correction screens with employer name

### Interest And Dividends

- 1099-INT, 1099-DIV, and 1099-OID follow the same pattern:
  - payer first
  - common boxes
  - uncommon boxes behind a toggle or later section
  - state information only if present
  - special tax treatment only if relevant
- Representative flow titles:
  - `Let's get the info from your 1099-INT`
  - `Let's get the info from your 1099-DIV`
  - `Let's get the info from your 1099-OID`
  - `Let's get the info from All of your Foreign Accounts`
  - `More About Foreign Financial Assets`
  - `Seller Financed Loan`

### 1099-MISC And Other Common Income

- TurboTax groups related but not identical forms into one family.
- It still keeps each form in its own subflow.
- Representative titles:
  - `Government Payments Form 1099-G?`
  - `Miscellaneous Income Form 1099-MISC`
  - `Non Employee Compensation 1099-NEC`
  - `Payment Received Through Payment Card And Third-Party Network 1099k`
  - `State or Local Tax Refund`

### Retirement Plans And Social Security

- Screenshot sample shows TurboTax educates first, then asks if the taxpayer had a 1099-R.
- It explicitly handles the case where there is no form but there is still a disaster-distribution reporting need.
- Representative titles:
  - `Pensions Plan Withdrawls 1099-R`
  - `Social Security & Railroad Retirement Benefits`
  - `Disaster Distributions Information`
  - `Canadian Retirement Plans and Funds`
- Important reveal logic:
  - benefits yes/no gate
  - SSA-1099 vs RRB-1099 subbranches
  - lump-sum payment branch opens prior-year questions

### Investment Income

- Representative titles:
  - `Stock,Bonds & Mutual Funds Info`
  - `Cryptocurrency Information`
  - `Any Straddles or Section 1256 Contracts?`
  - `Do you have investment losses you couldn't claim last year?`
  - `Let's get the info from Undistributed Capital Gains`

### Less Common Income

- TurboTax reserves very broad, high-branching content for a dedicated area.
- Representative titles:
  - `Did You Make Any Money Outside the United States?`
  - `Any Child's Income?`
  - `Installment Sales information`
  - `Jury Duty pay`
  - `Did you win money or other prizes in 2024?`
  - `Sale of Your Main Home`
  - `Tell us about your Miscellaneous Income`

### Rental Properties And Royalties

- This is one of the largest numeric-detail areas in the corpus.
- Screenshot sample confirms entity-scoped property headings.
- Representative titles:
  - `Income from Rentals or Royalty Property You Own`
  - `Rental Income Information`
  - `Vehicle Expenses Information`
  - `Any Other Situations?`
- Strong design pattern:
  - the property becomes the active context for many consecutive screens

### Business Items

- This is the largest screenshot topic family in the corpus.
- It uses many subflows, not one giant business form.
- Representative titles:
  - `Business Items Information`
  - `Did you have any income for a business in 2024?`
  - `Business Information`
  - `Business Schedules Information`
  - `Business Deductions And Credits`
  - `Business Assets information`
  - `Any Vehicle Expenses or Sales?`
  - `Schedules K-1 or Q`
  - `Sales of Business Property`

### Unemployment

- Representative title:
  - `Unemployment Information`
- This appears to be a smaller, more focused subflow than business or rental income.

## Deductions & Credits

### Deductions Hub Pattern

- Screenshot evidence shows this area often starts from a hub page.
- The hub page shows grouped sections like:
  - vehicle/home items
  - education
  - medical
- Each row has:
  - current amount
  - `Start` or `Update`
  - sometimes `Visit All`

### Charitable Donations

- Screenshot sample:
  - introductory explanation
  - eligible items list
  - yes/no buttons at bottom
- YAML reveals a deep donation flow:
  - do you want to enter donations
  - charity name
  - donation date
  - donation category
  - item description and value
  - valuation method
  - purchase details
  - direct association question
  - Form 1098-C / written statement branch
  - 1098-C details
  - carryovers and additional donations
- This is a strong example of:
  - educational intro
  - one-screen gate
  - detailed follow-up only for users who opt in

### Education And Medical

- Representative titles:
  - `Did you receive Form 1095-A for your health insurance plan?`
  - `Tell us about your education plans`
  - `Education Expenses Scholarship And Student Loan`
  - `Medical Expenses`
- This area has strong form-driven capture patterns:
  - 1095-A
  - education plan forms
  - tuition and scholarship questions
  - student loan interest

### Employment Expenses

- Representative titles:
  - `Employment Expenses for W-2 Work`
  - `Job Related Expenses`
  - `Any Vehicle Expenses or Sales?`
  - `Other Employment Expenses`
  - `Teacher Educator Expenses`
- Reusable pattern:
  - one screening topic, then split into expense families

### Estimates And Other Taxes Paid

- Representative titles:
  - `Did you pay Federal estimated taxes for 2024?`
  - `Did you pay state estimated taxes for 2024?`
  - `Did you pay local estimated taxes for 2024?`
  - `How much of your 2023 estimated taxes did you pay in 2024?`
  - `Foreign Taxes`
  - `Other Taxes Information`

### Retirement And Investments

- Representative titles:
  - `Did You Contribute To a Traditional IRA?`
  - `Roth IRA Contributions`
  - `Investment Interest Expenses`
  - `Other Investment Expenses`

### You And Your Family

- Representative titles:
  - `Did you pay any adoption expenses in 2024 or earlier?`
  - `Did you pay for child and dependent care in 2024?`
  - `Let's check for child and other dependents credits`
  - `Earned Income Credit Information`

### Your Home

- Representative titles:
  - `Did you pay any home loans in 2024?`
  - `Do you have a mortgage credit certificate?`
  - `Home Energy Credits Information`
  - `Do you have a D.C. first-time homebuyer credit carryover?`
  - `Tell Us About Your Homebuyer Credit`

### Other Deductions And Credits

- Representative titles:
  - `Did you pay alimony to a former spouse in 2024?`
  - `Tell us about your casualty loss or theft`
  - `Elderly Or Disabled Credit Information`
  - `How much did you spend on tax preparation in 2024?`
  - `Did a personal debt somebody owed you become uncollectible in 2024?`

## High-Branching Topics In The YAML Corpus

- `personal_information/personal_info.yaml`: `45` boolean fields
- `wages&income/LessCommonIncome/saleOfHomeGainOrLoss_info.yaml`: `19` boolean fields
- `wages&income/LessCommonIncome/miscellaneousIncomeBadDebtsRecovery_info.yaml`: `17` boolean fields
- `deductions&credits/EducationAndMedical/educationExpensesScholarshipAndStudentLoan_info.yaml`: `16` boolean fields
- `deductions&credits/YourHome/homeEnergyCredits_info.yaml`: `16` boolean fields
- `personal_information/spouse_info.yaml`: `14` boolean fields
- `personal_information/dependent_info.yaml`: `12` boolean fields
- `wages&income/BusinessItems/businessVehicleExpenses_info.yaml`: `12` boolean fields
- `wages&income/RentalPropertiesAndRoyalties/vehicleExpenses_info.yaml`: `12` boolean fields

## Highest Numeric-Intensity Topics

- `wages&income/RentalPropertiesAndRoyalties/incomeFromRentalsOrRoyaltyProperty_info.yaml`: `75` number fields
- `wages&income/BusinessItems/additionalFarmIncomeAndRental_info.yaml`: `52` number fields
- `wages&income/BusinessItems/businessScheduleK-1Q_info.yaml`: `48` number fields
- `wages&income/BusinessItems/additonalBusinessSchedules_info.yaml`: `43` number fields
- `deductions&credits/RetirementAndInvestments/rothIRAContributions_info.yaml`: `42` number fields
- `deductions&credits/EducationAndMedical/affordableCareActForm1095A_info.yaml`: `40` number fields
- `wages&income/BusinessItems/businessAllOtherExpenses_info.yaml`: `40` number fields

## Practical Lessons For Our Application

- Replace large monolithic forms with interview-style subflows for complex topics.
- Start each topic with a screening question whenever the topic is optional.
- Use `Yes/No` radio controls for booleans.
- Keep rare cases behind clearly labeled uncommon branches.
- Prefer one major decision per screen.
- Use entity-specific context in titles:
  - employer name
  - property address
  - dependent name
  - charity name
- Add topic hubs with `Start`, `Update`, and current-value summaries for big areas.
- Break document-entry topics into:
  - form locator fields first
  - common boxes second
  - uncommon boxes third
- Use explicit validation screens and inline warnings before users get too far.
- Model repeating entities as mini-wizards, not as giant repeating form blocks.
- Keep state and local follow-ups out of the main path unless the source form requires them.
- Support prior-year and carryover subflows as dedicated branches instead of cramming them into one screen.

## Suggested Adaptation Strategy For Our Forms

- Treat TurboTax as a source of interview sequencing, not as a source of final field naming.
- Preserve our YAML-driven canonical data model.
- Add a presentation layer that can:
  - ask one question at a time
  - reveal sections conditionally
  - return to a topic hub
  - handle multiple records cleanly
- Prioritize TurboTax-like interview flows first for:
  - Personal information
  - Filing status
  - Dependents
  - W-2
  - 1099-INT / 1099-DIV / 1099-R
  - Donations
  - Mortgage / property tax flows

## Topic Inventory By Folder

### personal_information

- `Your Information`
- `Personal Identifiers`
- `Address`
- `Home And Mailing Address`
- `Contact Information`
- `Military Service`
- `Tax Residency`
- `Your Special Conditions`
- `Your Student And Enrollment Status`
- `Your Marital Status`
- `Your Filing Status`
- `Spouse Information`
- `Dependents Information`

### wages&income / wages&salaries

- `W-2 Income Information`
- `Employer Identification`
- `Employee Information`
- `Income & Taxes Withheld`
- `Additional W2 Information`
- `Uncommon W-2 Situations`

### wages&income / Interest&Dividends

- `Let's get the info from your 1099-INT`
- `Let's get the info from your 1099-DIV`
- `Let's get the info from your 1099-OID`
- `Let's get the info from All of your Foreign Accounts`
- `More About Foreign Financial Assets`
- `Seller Financed Loan`

### wages&income / 1099-MISC&OtherCommonIncome

- `Government Payments Form 1099-G?`
- `Miscellaneous Income Form 1099-MISC`
- `Non Employee Compensation 1099-NEC`
- `Payment Received Through Payment Card And Third-Party Network 1099k`
- `State or Local Tax Refund`

### wages&income / RetirementPlansAndSocialSecurity

- `Pensions Plan Withdrawls 1099-R`
- `Social Security & Railroad Retirement Benefits`
- `Disaster Distributions Information`
- `Canadian Retirement Plans and Funds`

### wages&income / InvestmentIncome

- `Do you have investment losses you couldn't claim last year?`
- `Any Straddles or Section 1256 Contracts?`
- `Cryptocurrency Information`
- `Other Investment Income Info`
- `Stock,Bonds & Mutual Funds Info`
- `Let's get the info from Undistributed Capital Gains`

### wages&income / LessCommonIncome

- `Foreign Earned Income And Exclusion Info`
- `Additional Health Related Accounts Information`
- `Did you receive alimony or spousal support?`
- `Any Child's Income?`
- `Did You Make Any Money Outside the United States?`
- `Tell us about the health-related accounts you had in 2024`
- `Installment Sales information`
- `Jury Duty pay`
- `Recovery Of Bed Debts Information`
- `Miscellaneous Income Not Reported On W-2`
- `Miscellaneous Income Forgiveness Of PPP Loans`
- `Foreign Income And Exclusion Information`
- `Tell us about your Miscellaneous Income`
- `Did you win money or other prizes in 2024?`
- `Sale of Your Main Home`

### wages&income / RentalPropertiesAndRoyalties

- `Income from Rentals or Royalty Property You Own`
- `Rental Income Information`
- `Vehicle Expenses Information`
- `Any Other Situations?`

### wages&income / BusinessItems

- `Business Items Information`
- `Did you have any income for a business in 2024?`
- `Business Information`
- `Business Schedules Information`
- `Business Schedules Additional Information`
- `Business Deductions And Credits`
- `Business Assets information`
- `Business Home Expenses`
- `Enter Your Business Expenses`
- `Do you have any of these other business situation expenses?`
- `Any Vehicle Expenses or Sales?`
- `Schedules K-1 or Q`
- `Additional Schedule K-1Q Information`
- `Tell Us About Your Farm or Farm Rental Income`
- `Farm or Farm Rental Income`
- `Sales of Business Property`

### wages&income / unemployment

- `Unemployment Information`

### deductions&credits / CharitableDonations

- `Donations Information`
- `Tell us about your Donations`
- `We'd like to check some details about Donations`
- `Do you have charitable donation carryovers?`

### deductions&credits / EducationAndMedical

- `Did you receive Form 1095-A for your health insurance plan?`
- `Tell us about your education plans`
- `Education Expenses Scholarship And Student Loan`
- `Medical Expenses`

### deductions&credits / EmploymentExpenses

- `Employment Expenses for W-2 Work`
- `Job Related Expenses`
- `Any Vehicle Expenses or Sales?`
- `Other Employment Expenses`
- `Teacher Educator Expenses`

### deductions&credits / EstimatesAndOtherTaxesPaid

- `Did you pay Federal estimated taxes for 2024?`
- `Did you pay state estimated taxes for 2024?`
- `Did you pay local estimated taxes for 2024?`
- `How much of your 2023 estimated taxes did you pay in 2024?`
- `Foreign Taxes`
- `Additional Foreign Taxes Information`
- `Other Taxes Information`

### deductions&credits / RetirementAndInvestments

- `Did You Contribute To a Traditional IRA?`
- `Roth IRA Contributions`
- `Investment Interest Expenses`
- `Other Investment Expenses`

### deductions&credits / YouAndYourFamily

- `Did you pay any adoption expenses in 2024 or earlier?`
- `Did you pay for child and dependent care in 2024?`
- `Let's check for child and other dependents credits`
- `Earned Income Credit Information`

### deductions&credits / YourHome

- `Did you pay any home loans in 2024?`
- `Do you have a mortgage credit certificate?`
- `Home Energy Credits Information`
- `Do you have a D.C. first-time homebuyer credit carryover?`
- `Tell Us About Your Homebuyer Credit`

### deductions&credits / OtherDeductionsAndCredits

- `Did you pay alimony to a former spouse in 2024?`
- `Tell us about your casualty loss or theft`
- `Elderly Or Disabled Credit Information`
- `Let us know how much you paid in legal fees`
- `Did you have any work-related moving expenses in 2024?`
- `Did a personal debt somebody owed you become uncollectible in 2024?`
- `Other Credits Information`
- `Other Deductible Expenses Information`
- `How much did you spend on tax preparation in 2024?`

### deductions&credits / CarAndOtherThingsYouOwn

- `Car Registration Fees`
- `Personal Property Taxes`
- `Energy-Efficient Vehicles`
- `Energy-Efficient Vehicle Charging Station`
