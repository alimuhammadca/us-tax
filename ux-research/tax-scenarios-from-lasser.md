# Tax scenarios from J.K. Lasser's Your Income Tax 2025

Catalog behind the "Select tax scenarios" screen. Source of truth for the data is
`us-tax-ui/src/app/data/tax-scenarios.ts` (`TAX_SCENARIOS`, `TAX_SCENARIO_CATEGORIES`); this page is
the readable version. Generated 2026-10-13.

**At a glance:** 107 scenarios in 12 categories. Every scenario maps to at least one statement or
app form. 105 map to an input form; 2 map only to a Tax Return preview (amended return, AMT).

## How the list was derived

1. **Source.** *J.K. Lasser's Your Income Tax 2025, Professional Edition* covers tax year 2024. I
   walked the chapter-by-chapter contents for chapters 1–48 and each chapter's numbered sections
   (e.g. "29.1 Avoiding Tax on Sale of Principal Residence"). Chapter 24 is *Computing the "Kiddie
   Tax" on Your Child's Unearned Income*.
2. **What counts as a scenario.** A section became a scenario only if it describes something a filer
   would recognize about their own year: an event, a document they received, an account they hold, or
   a choice they make. Sections about computations, definitions or IRS procedure (tax tables, MACRS
   conventions, audit odds) were folded into the scenario they support, or left out.
3. **Merging.** Closely related sections were combined so the list stays usable as a checklist:
   - married filing separately and community property are both under "I'm married";
   - vacation-home rental and real estate professionals are under rental property;
   - tax-exempt interest and the early-CD penalty are under bank interest;
   - worthless securities are under stock sales;
   - savings bonds used for tuition are under savings bonds;
   - annuities and QDRO payments are under pension payouts;
   - Archer MSA is under HSA;
   - travel, meals and start-up costs are under small business;
   - who claims the children after divorce is under divorce and alimony;
   - foreign taxes on investments and on wages are one scenario.
   A first draft had 144 scenarios; merging brought it to 107.
4. **TY2025 adjustments.** The app targets TY2025. Where the book flags a 2025 change, or the law
   changed after it went to press, the description says so:
   - Form 1099-DA starts for 2025 (the book's Planning Reminder in 12.23);
   - the foreign earned income exclusion is $130,000 for 2025;
   - four scenarios come from 2025 law the book predates. Their book ref says "Not in book": qualified
     tips, overtime, new-car loan interest and the $6,000 senior deduction (Schedule 1-A).
5. **Mapping.**
   - `statementIds` come only from `service/statement-selection.service.ts`.
   - `formIds` come only from the sidebar arrays in `shell/shell.component.ts`. These are the input
     forms (personal, incomes, deductions, applications, dependent) and the `tax-return-*` previews.
   - Per-person forms are listed by their **taxpayer** id only. The `-spouse` twin applies on the
     spouse tab.
   - Every id was checked by script against both source files. No ids were invented.
6. **Order.** Categories and the scenarios inside them run from most to least common. Commonness was
   judged from typical-filer frequency, not measured.

## Categories and scenarios

### Family & household (9)

| # | Label | Description | Book ref | Statements | App forms |
|---|---|---|---|---|---|
| 1 | I'm married | Married couples choose a joint return (usually cheaper, both spouses liable) or separate returns, which lose many credits and in community property states split community income 50/50. | Ch. 1 (1.1–1.6); Ch. 14 (14.3) | — | `filing-status`, `filing-status-spouse`, `spouse`, `identification-spouse` |
| 2 | I have children under 17 | Each qualifying child under 17 can bring a Child Tax Credit, part of it refundable (Schedule 8812). | Ch. 2 (2.2–2.3, 2.8); Ch. 25 (25.2–25.3) | — | `dependent`, `ctc-actc-screening-taxpayer`, `tax-return-schedule8812` |
| 3 | I paid for child or dependent care so I could work | Daycare, after-school or adult-day care costs can earn the Child and Dependent Care Credit, and employer dependent-care benefits must be reconciled (Form 2441). | Ch. 4 (4.5); Ch. 25 (25.5–25.6) | `w-2` | `childcare-expenses`, `tax-return-2441` |
| 4 | I'm unmarried and paid most of the costs of a home for a child or relative | You may qualify for Head of Household status, which has a larger standard deduction and lower rates than Single. | Ch. 1 (1.12) | — | `filing-status`, `dependent` |
| 5 | I worked and had low to moderate income | You may qualify for the refundable Earned Income Credit, with or without children (Schedule EIC). | Ch. 25 (25.7–25.8) | `w-2`, `1099-nec` | `earned-income-credit-taxpayer`, `dependent` |
| 6 | I support a parent, older child or other relative | A qualifying relative you support can be your dependent and earn the $500 Credit for Other Dependents; a multiple support agreement can apply when siblings share the cost. | Ch. 2 (2.4–2.6); Ch. 25 (25.4) | — | `dependent`, `ctc-actc-screening-taxpayer` |
| 7 | I had a baby or adopted a child | A new child adds a dependent and credits; adoption expenses and employer adoption benefits qualify for the adoption credit and exclusion (Form 8839). | Ch. 4 (4.6); Ch. 25 (25.9–25.10) | `w-2` | `dependent`, `adoption-expenses`, `tax-return-8839` |
| 8 | My child had interest, dividends or other investment income | A child's unearned income above $2,700 may be taxed at the parent's rate (kiddie tax, Form 8615), or the parent may elect to report it (Form 8814). | Ch. 24 (24.1–24.4) | `1099-int`, `1099-div`, `1099-b` | `kiddie-income-dependent`, `child-interest-dividends`, `capital-gain-loss-dependent`, `tax-return-8814` |
| 9 | I paid a nanny, housekeeper or other household employee | Paying a household worker above the annual threshold means Social Security, Medicare and possibly federal unemployment tax (Schedule H). | Ch. 38 (38.1–38.4) | — | `16-tax-taxpayer`, `tax-return-schedule2` |

### Jobs & wages (8)

| # | Label | Description | Book ref | Statements | App forms |
|---|---|---|---|---|---|
| 1 | I worked as an employee | Wages, salary, bonuses and taxable fringe benefits are reported to you on Form W-2. | Ch. 3 (3.1–3.4); Ch. 4 | `w-2` | `employment-taxpayer` |
| 2 | I had more than one job, or changed jobs | Two employers may together withhold too much Social Security tax, which comes back as a credit (Schedule 3), and combined pay can push withholding off target. | Ch. 26 (26.2, 26.4, 26.8) | `w-2` | `employment-taxpayer`, `tax-return-schedule3` |
| 3 | I received unemployment benefits | Unemployment compensation is taxable and is reported on Form 1099-G (Schedule 1). | Ch. 3 (3.5); Ch. 26 (26.5) | `1099-g` | `other-incomes-taxpayer` |
| 4 | I received tips | Tips are taxable; unreported tips owe Social Security and Medicare tax (Form 4137), and for 2025 qualified tips may be deductible up to $25,000 (Schedule 1-A). | Ch. 26 (26.6); 2025 deduction not in book | `w-2` | `tips-taxpayer`, `additional-deductions-taxpayer`, `tax-return-4137-taxpayer` |
| 5 | I was paid overtime | New for 2025: the extra "half" of qualified overtime pay may be deductible up to $12,500 ($25,000 joint) (Schedule 1-A). | Not in book (2025 law change) | `w-2` | `additional-deductions-taxpayer`, `tax-return-schedule-1a` |
| 6 | I received stock options, RSUs or ESPP shares from my employer | Exercising or vesting creates wage income or AMT adjustments, and selling the shares is a capital transaction (Forms 3921, 3922, 1099-B, 8949). | Ch. 3 (3.15–3.18); Ch. 30 (30.8) | `w-2`, `3921`, `3922`, `1099-b` | `employment-taxpayer`, `capital-gain-loss-taxpayer`, `other-incomes-taxpayer`, `tax-return-6251` |
| 7 | I didn't get a W-2, or my W-2 is wrong | If your employer will not issue or correct a W-2, you can file with a substitute statement built from your pay stubs (Form 4852). | Not covered in book (filing procedure); see Ch. 46 (46.2) | `w-2` | `form4852-taxpayer` |
| 8 | I was paid as a contractor but was really an employee | A worker treated as a contractor by mistake can pay only the employee share of Social Security and Medicare tax (Form 8919). | Ch. 45 (45.1, 45.6) | `1099-nec`, `1099-misc` | `uncollected-ss-medicare-taxpayer`, `tax-return-8919-taxpayer` |

### Investments & savings (11)

| # | Label | Description | Book ref | Statements | App forms |
|---|---|---|---|---|---|
| 1 | I earned interest from a bank, CD or bonds (including tax-exempt bonds) | Interest is reported on Form 1099-INT or 1099-OID (Schedule B over $1,500); tax-exempt interest is still reported, and a penalty for cashing a CD early is deductible. | Ch. 5 (5.12–5.27); Ch. 30 (30.10) | `1099-int`, `1099-oid` | `interest-income-taxpayer`, `income-adjustments-taxpayer`, `tax-return-scheduleb` |
| 2 | I received dividends or mutual fund distributions | Ordinary, qualified and capital gain distributions are reported on Form 1099-DIV; qualified dividends get the lower capital gain rates. | Ch. 5 (5.1–5.11); Ch. 32 (32.1–32.7) | `1099-div` | `dividend-income-taxpayer`, `tax-return-scheduleb` |
| 3 | I sold stocks, bonds, ETFs or mutual funds | Each sale is a capital gain or loss reported from Form 1099-B (Form 8949 and Schedule D); wash-sale, holding-period and worthless-security rules apply. | Ch. 6 (6.1–6.13, 6.32); Ch. 30 (30.1–30.7); Ch. 32 (32.8–32.10) | `1099-b` | `capital-gain-loss-taxpayer`, `tax-return-8949`, `tax-return-schedule-d` |
| 4 | I bought, sold, traded or earned cryptocurrency | Digital assets are property: sales and trades are capital transactions and earning them is income; for 2025 brokers begin reporting sales on Form 1099-DA. | Ch. 12 (12.23); Ch. 30 (30.16) | `1099-da`, `1099-b`, `1099-k`, `1099-misc` | `digital-assets-taxpayer`, `capital-gain-loss-taxpayer`, `other-incomes-taxpayer` |
| 5 | I have capital losses carried over from earlier years | Net capital losses above $3,000 a year carry forward until used (Schedule D carryover worksheet). | Ch. 6 (6.4–6.5) | — | `prior-year-carryovers`, `capital-gain-loss-taxpayer` |
| 6 | I cashed in U.S. savings bonds (EE or I bonds) | Savings bond interest is federally taxable when redeemed, but can be excluded when used for college costs if income is under the limit (Form 8815). | Ch. 5 (5.28–5.29); Ch. 30 (30.12–30.13); Ch. 33 (33.4) | `1099-int` | `interest-income-taxpayer`, `tax-return-8815` |
| 7 | I own part of a partnership, LLC or S corporation | Your share of income, losses, deductions and credits comes on Schedule K-1 and may be limited by basis, at-risk and passive-loss rules. | Ch. 11 (11.11, 11.17–11.22); Ch. 12 (12.9–12.14) | `schedule-k1-1065`, `schedule-k1-1120s` | `passive-activity-carryforward-taxpayer`, `qbi-deduction-taxpayer`, `tax-return-schedule-e` |
| 8 | I'm a beneficiary of an estate or trust | Income an estate or trust distributes to you is reported on Schedule K-1 (Form 1041), including excess deductions in its final year. | Ch. 12 (12.15–12.17) | `schedule-k1-1041` | `tax-return-schedule-e`, `income-adjustments-taxpayer` |
| 9 | I paid foreign income taxes (on investments or foreign wages) | Foreign income taxes can be a credit (Form 1116, often not needed if $300 or less, $600 joint) or an itemized deduction. | Ch. 16 (16.10); Ch. 32 (32.6); Ch. 36 (36.11, 36.13) | `1099-div`, `1099-int` | `foreign-tax-credit-taxpayer`, `tax-return-1116-0` |
| 10 | I paid interest on money borrowed to invest (such as margin) | Investment interest is deductible up to your net investment income, with the excess carried forward (Form 4952). | Ch. 17 (17.9–17.11) | — | `investment-interest-expense-deduction`, `tax-return-4952` |
| 11 | I sold property and am being paid over time | An installment sale spreads the gain over the years you collect payments, with interest taxed separately (Form 6252). | Ch. 6 (6.21–6.31) | `1099-s`, `1099-int` | `capital-gain-loss-taxpayer`, `interest-income-taxpayer` |

### Retirement & Social Security (13)

| # | Label | Description | Book ref | Statements | App forms |
|---|---|---|---|---|---|
| 1 | I received Social Security or railroad retirement benefits | Up to 85% of benefits can be taxable depending on your other income (Form SSA-1099 or RRB-1099). | Ch. 34 (34.2–34.6) | `ssa-1099`, `rrb-1099` | `social-security-benefits-taxpayer` |
| 2 | I took money from a pension, 401(k), 403(b) or annuity | Payouts from employer plans and annuities you bought are taxable except for your after-tax investment, including payments to you under a divorce court order (Form 1099-R). | Ch. 8 (8.1, 8.8–8.10, 8.15–8.26) | `1099-r`, `rrb-1099-r` | `pension-annuity-income-taxpayer` |
| 3 | I took money out of a traditional IRA | IRA withdrawals are taxable except for any nondeductible basis you track on Form 8606. | Ch. 9 (9.8–9.9) | `1099-r` | `ira-income-taxpayer`, `tax-return-8606-taxpayer` |
| 4 | I'm 65 or older, or blind | You get a larger standard deduction, and for 2025 people 65+ may also take the new $6,000 senior deduction (Schedule 1-A). | Ch. 14 (14.4); Ch. 34 (34.1); senior deduction not in book | — | `identification-taxpayer`, `standard-deductions-taxpayer`, `additional-deductions-taxpayer` |
| 5 | I'm 73 or older and must take required minimum distributions | Missing a required minimum distribution triggers an excise tax that can be reduced or waived if corrected (Form 5329). | Ch. 8 (8.11); Ch. 9 (9.13) | `1099-r`, `5498` | `ira-income-taxpayer`, `pension-annuity-income-taxpayer`, `tax-return-5329` |
| 6 | I withdrew retirement money before age 59½ | Early distributions usually owe an extra 10% tax unless an exception applies (Form 5329). | Ch. 8 (8.13, 8.17); Ch. 9 (9.12) | `1099-r` | `ira-income-taxpayer`, `pension-annuity-income-taxpayer`, `tax-return-5329` |
| 7 | I rolled over or moved a retirement account | Direct transfers and rollovers completed within 60 days are tax free, but must still be reported (Form 1099-R, Form 5498). | Ch. 8 (8.5–8.7); Ch. 9 (9.10) | `1099-r`, `5498` | `ira-income-taxpayer`, `pension-annuity-income-taxpayer` |
| 8 | I contributed to a traditional IRA | Contributions may be deductible depending on income and workplace plan coverage; nondeductible ones build basis (Form 8606). | Ch. 9 (9.1–9.7) | `5498` | `income-adjustments-taxpayer`, `ira-income-taxpayer`, `tax-return-8606-taxpayer` |
| 9 | I converted a traditional IRA or 401(k) to a Roth | The pre-tax amount converted is taxable this year and cannot be recharacterized (Form 8606). | Ch. 9 (9.22–9.24) | `1099-r`, `5498` | `ira-income-taxpayer`, `tax-return-8606-taxpayer` |
| 10 | I took money out of a Roth IRA or Roth 401(k) | Qualified Roth distributions are tax free; others may be partly taxable and penalized (Form 8606 Part III). | Ch. 8 (8.18); Ch. 9 (9.25–9.26) | `1099-r` | `ira-income-taxpayer`, `pension-annuity-income-taxpayer`, `tax-return-8606-taxpayer` |
| 11 | I saved for retirement and had a modest income | Contributions to an IRA, 401(k) or ABLE account can earn the Saver’s Credit (Form 8880). | Ch. 25 (25.11–25.12) | `w-2`, `5498` | `savings-credit-taxpayer`, `tax-return-8880` |
| 12 | I inherited an IRA or retirement account | Beneficiaries owe tax on withdrawals and most must empty the account within 10 years, with yearly RMDs in some cases. | Ch. 8 (8.12); Ch. 9 (9.14–9.15) | `1099-r` | `ira-income-taxpayer`, `pension-annuity-income-taxpayer` |
| 13 | I'm 65+, or retired on permanent disability, with low income | You may qualify for the Credit for the Elderly or the Disabled (Schedule R). | Ch. 34 (34.7–34.8) | `ssa-1099`, `1099-r` | `elderly-disabled-credit-taxpayer`, `tax-return-schedule-r` |

### Home & real estate (9)

| # | Label | Description | Book ref | Statements | App forms |
|---|---|---|---|---|---|
| 1 | I paid mortgage interest or property taxes on my home | Mortgage interest, points and real estate taxes are itemized deductions (Form 1098, Schedule A). | Ch. 16 (16.4–16.7); Ch. 17 (17.1–17.8, 17.12–17.13) | `1098` | `standard-deductions-taxpayer`, `tax-return-schedule-a` |
| 2 | I sold my home | Up to $250,000 of gain ($500,000 joint) is tax free if you owned and lived in it 2 of the last 5 years (Form 1099-S). | Ch. 29 (29.1–29.10) | `1099-s` | `capital-gain-loss-taxpayer` |
| 3 | I installed solar panels or made energy-saving home improvements | Solar, heat pumps, insulation, windows and similar upgrades can earn residential energy credits (Form 5695). | Ch. 25 (25.15) | — | `energy-credit-taxpayer`, `tax-return-5695` |
| 4 | I own rental property, or rented out a vacation home or part of my home | Rents, expenses and depreciation go on Schedule E; personal-use days and the passive-loss rules (eased for real estate professionals) can limit losses. | Ch. 10 (10.1–10.10); Ch. 11 (11.1–11.3) | `1099-misc`, `1099-k` | `rental-income-taxpayer`, `depreciation-asset-taxpayer`, `tax-return-schedule-e` |
| 5 | I lost property to foreclosure, did a short sale, or had a mortgage forgiven | A foreclosure is treated as a sale, and forgiven debt can be taxable unless an exclusion applies (Forms 1099-A, 1099-C, 982). | Ch. 12 (12.8); Ch. 31 (31.9–31.14) | `1099-a`, `1099-c` | `other-incomes-taxpayer`, `capital-gain-loss-taxpayer`, `tax-return-982` |
| 6 | I have rental or passive losses I could not deduct in past years | Suspended passive losses carry forward and are freed up by passive income or when you sell the activity (Form 8582). | Ch. 11 (11.1–11.16) | — | `passive-activity-carryforward-taxpayer`, `prior-year-carryovers`, `tax-return-8582` |
| 7 | I received royalties from oil, gas, minerals, books or patents | Royalties are reported on Schedule E, with depletion allowed for mineral interests. | Ch. 10 (10.11–10.16) | `1099-misc` | `rental-income-taxpayer`, `tax-return-schedule-e` |
| 8 | I have a mortgage credit certificate from a state or local agency | A mortgage credit certificate gives a yearly credit for part of your mortgage interest (Form 8396); selling within 9 years may trigger recapture (Form 8828). | Ch. 25 (25.14); Ch. 17 (17.1) | `1098` | `mortgage-interest-credit-taxpayer`, `form-8828`, `tax-return-8396` |
| 9 | I'm repaying the 2008 first-time homebuyer credit | The 2008 credit is repaid in installments, or all at once if you sold the home or stopped living there (Form 5405). | Ch. 25 (25.17) | — | `form-5405-taxpayer` |

### Deductions & charitable giving (7)

| # | Label | Description | Book ref | Statements | App forms |
|---|---|---|---|---|---|
| 1 | I paid state and local income or sales taxes | If you itemize, state and local income (or sales), property and personal property taxes are deductible up to the SALT cap (Schedule A). | Ch. 16 (16.1–16.3, 16.8) | `w-2` | `standard-deductions-taxpayer`, `tax-return-schedule-a` |
| 2 | I gave money to charity | Cash gifts to qualified charities are deductible if you itemize and keep receipts; amounts over the AGI ceilings carry forward. | Ch. 18 (18.1–18.5, 18.14, 18.17–18.18) | — | `standard-deductions-taxpayer`, `prior-year-carryovers`, `tax-return-schedule-a` |
| 3 | I got a state or local tax refund | A refund is taxable only to the extent the tax gave you a benefit when you itemized last year (Form 1099-G). | Ch. 12 (12.5–12.6) | `1099-g` | `other-incomes-taxpayer`, `prior-year-1040` |
| 4 | I donated clothing, household goods, stock or other property | Property gifts are deductible at fair market value or cost; gifts over $500 need Form 8283 and over $5,000 an appraisal. | Ch. 18 (18.6–18.16, 18.19) | — | `form-8283`, `standard-deductions-taxpayer`, `tax-return-8283` |
| 5 | I donated a car, boat or airplane | The deduction is usually limited to what the charity sold it for, as shown on Form 1098-C. | Ch. 18 (18.7, 18.15) | `1098-c` | `form-8283`, `standard-deductions-taxpayer` |
| 6 | I gave to charity directly from my IRA | A qualified charitable distribution (age 70½+) is excluded from income instead of deducted, and counts toward your RMD. | Ch. 9 (9.8) | `1099-r` | `ira-income-taxpayer` |
| 7 | I paid interest on a loan for a new car | New for 2025: interest on a loan for a new, U.S.-assembled personal vehicle may be deductible up to $10,000 (Schedule 1-A). | Not in book (2025 law change) | — | `additional-deductions-taxpayer`, `tax-return-schedule-1a` |

### Health care (5)

| # | Label | Description | Book ref | Statements | App forms |
|---|---|---|---|---|---|
| 1 | I bought health insurance through the Marketplace | Advance premium tax credit must be reconciled with your actual income, which can mean a refund or repayment (Form 1095-A, Form 8962). | Ch. 25 (25.13) | `1095-a` | `premium-tax-credit-taxpayer`, `tax-return-8962` |
| 2 | I have a Health Savings Account (HSA) or Archer MSA | Contributions are deductible or pre-tax, and withdrawals are tax free when used for medical costs (Forms 5498-SA, 1099-SA, 8889 or 8853). | Ch. 4 (4.2); Ch. 41 (41.10–41.13) | `5498-sa`, `1099-sa`, `w-2` | `hsa-taxpayer`, `msa-ltc-taxpayer`, `tax-return-8889` |
| 3 | I had large medical or dental bills | Unreimbursed medical costs above 7.5% of AGI are deductible if you itemize (Schedule A). | Ch. 15 (15.1–15.14) | — | `standard-deductions-taxpayer`, `tax-return-schedule-a` |
| 4 | I paid for long-term care insurance or received long-term care benefits | Premiums count as medical expenses up to age-based limits, and long-term care benefits are tax free within limits (Form 1099-LTC, Form 8853). | Ch. 15 (15.11, 15.15–15.16) | `1099-ltc` | `msa-ltc-taxpayer`, `standard-deductions-taxpayer`, `tax-return-8853` |
| 5 | I have an ABLE account for someone with a disability | ABLE withdrawals for qualified disability expenses are tax free; other withdrawals are partly taxable (Forms 1099-QA, 5498-QA). | Ch. 34 (34.11–34.12) | `1099-qa`, `5498-qa` | `other-incomes-taxpayer`, `savings-credit-taxpayer` |

### Education (5)

| # | Label | Description | Book ref | Statements | App forms |
|---|---|---|---|---|---|
| 1 | I paid college or job-training tuition | The American Opportunity and Lifetime Learning credits cover tuition and fees for you, your spouse or dependents (Form 1098-T, Form 8863). | Ch. 33 (33.7–33.9) | `1098-t` | `education-credits-taxpayer`, `tax-return-8863` |
| 2 | I paid student loan interest | Up to $2,500 of student loan interest is deductible even if you do not itemize (Form 1098-E). | Ch. 33 (33.13) | `1098-e` | `income-adjustments-taxpayer` |
| 3 | I received a scholarship, grant or fellowship | Scholarships are tax free when used for tuition and books, but amounts for room, board or pay for teaching are taxable. | Ch. 33 (33.1–33.3) | `1098-t`, `w-2` | `other-incomes-taxpayer`, `education-credits-taxpayer` |
| 4 | I took money from a 529 plan or Coverdell education savings account | Withdrawals for qualified education costs are tax free; the earnings part of other withdrawals is taxed plus 10% (Form 1099-Q, Form 5329). | Ch. 33 (33.5–33.6, 33.10–33.11) | `1099-q`, `5498-esa` | `other-incomes-taxpayer`, `education-credits-taxpayer` |
| 5 | I'm a K-12 teacher who paid for classroom supplies | Eligible educators can deduct up to $300 of unreimbursed classroom expenses (Schedule 1). | Ch. 13 (13.2) | — | `income-adjustments-taxpayer` |

### Self-employment & business (13)

| # | Label | Description | Book ref | Statements | App forms |
|---|---|---|---|---|---|
| 1 | I did freelance, gig or contract work | Self-employment income is reported on Schedule C and owes self-employment tax (Forms 1099-NEC, 1099-K, Schedule SE). | Ch. 40 (40.2, 40.5–40.6); Ch. 45 (45.1–45.4) | `1099-nec`, `1099-k`, `1099-misc` | `business-income-taxpayer`, `tax-return-schedule-c`, `tax-return-schedule-se-taxpayer` |
| 2 | I own a small business (sole proprietor or single-member LLC) | Business income and expenses (including travel, 50% of meals and start-up costs) go on Schedule C. | Ch. 40 (40.1–40.11); Ch. 21 (21.1–21.16) | `1099-nec`, `1099-k`, `1099-misc` | `business-income-taxpayer`, `tax-return-schedule-c` |
| 3 | I have business, rental or pass-through income that may qualify for the 20% deduction | The qualified business income deduction can cut taxable business income by up to 20% (Form 8995 or 8995-A). | Ch. 40 (40.24); Ch. 10 (10.17); Ch. 31 (31.16) | `schedule-k1-1065`, `schedule-k1-1120s`, `1099-div` | `qbi-deduction-taxpayer`, `tax-return-8995` |
| 4 | I used my car or truck for business | Deduct either the standard mileage rate or actual costs plus depreciation, based on business-use records. | Ch. 43 (43.1–43.11) | — | `business-income-taxpayer`, `depreciation-asset-taxpayer` |
| 5 | I use part of my home regularly for my business | A home office used regularly and exclusively for business is deductible by the simplified or actual-expense method (Form 8829). | Ch. 40 (40.12–40.17) | — | `home-office-actual-taxpayer`, `business-income-taxpayer`, `tax-return-8829` |
| 6 | I bought equipment, furniture or other assets for my business or rental | Business assets are written off by depreciation, first-year expensing (Section 179) or bonus depreciation (Form 4562). | Ch. 42 (42.1–42.18) | — | `depreciation-asset-taxpayer`, `tax-return-4562` |
| 7 | I paid my own health insurance while self-employed | Self-employed people can deduct health, dental and long-term care premiums above the line (Form 7206). | Ch. 15 (15.8); Ch. 41 (41.1, 41.14) | — | `se-deductions-taxpayer`, `tax-return-7206` |
| 8 | I contributed to a SEP, SIMPLE or solo 401(k) | Self-employed retirement contributions are deductible above the line (Schedule 1). | Ch. 9 (9.16–9.19); Ch. 41 (41.1–41.9) | `5498` | `se-deductions-taxpayer` |
| 9 | I earned money from a hobby | Hobby income is taxable but hobby expenses are no longer deductible. | Ch. 40 (40.10) | `1099-k`, `1099-misc` | `other-incomes-taxpayer` |
| 10 | I sold or traded business equipment, a business vehicle or business real estate | Gains on business property can be part ordinary (depreciation recapture) and part capital (Form 4797). | Ch. 44 (44.1–44.10); Ch. 43 (43.9–43.10) | `1099-s`, `1099-b` | `depreciation-asset-taxpayer`, `other-incomes-taxpayer`, `tax-return-4797` |
| 11 | My business lost money, or I have a net operating loss from a prior year | Business losses offset other income up to the excess-business-loss limit, and the rest carries forward as a net operating loss. | Ch. 40 (40.18–40.20) | — | `prior-year-carryovers`, `other-incomes-taxpayer`, `tax-return-172` |
| 12 | I run a farm or ranch | Farm income and expenses go on Schedule F and owe self-employment tax; farmers have special estimated-tax rules (Form 2210-F). | Ch. 40 (40.22–40.23); Ch. 27 (27.1) | `1099-g`, `1099-misc`, `1099-ptr` | `farm-income-taxpayer`, `tax-return-schedule-f`, `tax-return-2210f` |
| 13 | I rent out farmland for a share of the crops | Crop-share rent from land you do not farm yourself is reported on Form 4835. | Ch. 11 (11.12) | `1099-misc`, `1099-g` | `farm-rental-taxpayer`, `tax-return-4835` |

### Life events & other income (10)

| # | Label | Description | Book ref | Statements | App forms |
|---|---|---|---|---|---|
| 1 | I won money gambling, in a lottery or in a contest | Winnings and prizes are taxable; gambling losses are deductible only up to winnings and only if you itemize (Form W-2G). | Ch. 12 (12.1–12.3); Ch. 26 (26.7) | `w-2g`, `1099-misc` | `other-incomes-taxpayer`, `standard-deductions-taxpayer` |
| 2 | I got divorced or separated, or I pay or receive alimony | Pre-2019 alimony is deductible by the payer and taxable to the recipient; later alimony and child support are neither, and special rules decide which parent claims the children. | Ch. 37 (37.1–37.7); Ch. 2 (2.7); Ch. 7 (7.6) | — | `filing-status`, `dependent`, `other-incomes-taxpayer`, `income-adjustments-taxpayer` |
| 3 | A lender forgave or cancelled a debt I owed | Cancelled debt is usually taxable unless you were insolvent, bankrupt, or another exclusion applies (Form 1099-C, Form 982). | Ch. 12 (12.8) | `1099-c` | `other-incomes-taxpayer`, `tax-return-982` |
| 4 | I inherited money or property | Inheritances are not income, but inherited property gets a stepped-up basis and income in respect of a decedent is taxable. | Ch. 12 (12.4, 12.16–12.17); Ch. 6 (6.17–6.18) | `schedule-k1-1041`, `1099-b`, `1099-r` | `capital-gain-loss-taxpayer` |
| 5 | My spouse died | You can file jointly for the year of death and may qualify as a surviving spouse for two more years if you support a child. | Ch. 1 (1.10–1.11, 1.14) | — | `filing-status`, `identification-spouse` |
| 6 | My property was damaged or stolen in a federally declared disaster | Personal casualty losses are deductible only in declared disaster areas, after a $100 floor and 10%-of-AGI reduction (Form 4684). | Ch. 19 (19.1–19.13) | — | `standard-deductions-taxpayer`, `tax-return-4684` |
| 7 | I received a lawsuit settlement or legal damages | Damages for physical injury are tax free; most others are taxable, and some legal fees are deductible above the line. | Ch. 12 (12.7) | `1099-misc` | `other-incomes-taxpayer`, `income-adjustments-taxpayer` |
| 8 | I received life insurance proceeds or sold or cashed in a policy | Death benefits are tax free, but interest on them and gains from surrendering or selling a policy are taxable (Forms 1099-R, 1099-LS, 1099-SB). | Ch. 12 (12.18–12.20); Ch. 7 (7.10) | `1099-r`, `1099-int`, `1099-ls`, `1099-sb` | `pension-annuity-income-taxpayer`, `capital-gain-loss-taxpayer`, `other-incomes-taxpayer` |
| 9 | I was paid to care for someone in my home (foster care or Medicaid waiver) | Qualified foster care and Medicaid waiver payments are tax free, and you can choose to count them as earned income for credits. | Ch. 12 (12.22) | `w-2`, `1099-misc` | `medicaid-waiver-taxpayer` |
| 10 | My share of a joint refund could be taken for my spouse’s past-due debts | An injured spouse can get back their share of a joint refund applied to the other spouse’s debts (Form 8379). | Ch. 47 (47.6); Ch. 46 (46.4) | — | `form-8379` |

### Tax payments, credits & filing (9)

| # | Label | Description | Book ref | Statements | App forms |
|---|---|---|---|---|---|
| 1 | I made estimated tax payments | Quarterly payments (Form 1040-ES) and any prior-year overpayment applied are credited against this year’s tax. | Ch. 27 (27.2–27.5) | — | `estimated-tax-payments-taxpayer` |
| 2 | I didn't have enough tax withheld or paid during the year | Paying too little through withholding and estimates can cause an underpayment penalty unless a safe harbor applies (Form 2210). | Ch. 26 (26.1, 26.4); Ch. 27 (27.1) | — | `estimated-tax-payments-taxpayer`, `refund-and-amount-owed-taxpayer`, `tax-return-2210` |
| 3 | I bought an electric or clean vehicle, or installed an EV charger | New and used clean vehicles and home charging equipment can earn credits (Form 8936, Form 8911). | Ch. 25 (25.16) | — | `clean-car-credit-taxpayer`, `alt-fuel-credit-taxpayer`, `tax-return-8936sa` |
| 4 | I need more time to file | An extension gives six more months to file, but not to pay (Form 4868). | Ch. 46 (46.3) | — | `extension-of-time-taxpayer`, `tax-return-4868` |
| 5 | I need to fix a return I already filed | An amended return claims a missed refund or corrects an error, generally within 3 years (Form 1040-X). | Ch. 47 (47.1–47.8) | — | `tax-return-1040x` |
| 6 | My income was over $200,000 ($250,000 joint) | High earners may owe the 0.9% Additional Medicare Tax on wages and the 3.8% Net Investment Income Tax (Forms 8959, 8960). | Ch. 28 (28.1–28.3); Ch. 22 (22.8) | `w-2` | `16-tax-taxpayer`, `tax-return-8959`, `tax-return-8960` |
| 7 | I may owe the alternative minimum tax | Large state tax deductions, incentive stock options or private activity bond interest can trigger AMT (Form 6251). | Ch. 23 (23.1–23.5) | `3921`, `1099-int` | `tax-return-6251` |
| 8 | I paid alternative minimum tax in an earlier year | AMT from timing items such as incentive stock options can come back as a credit in later years (Form 8801). | Ch. 23 (23.4) | — | `prior-min-tax-credit-taxpayer`, `tax-return-8801` |
| 9 | The IRS denied my earned income, child or education credit in a past year | After a denial you must recertify before claiming the credit again (Form 8862). | Ch. 25 (25.2, 25.7) | — | `form8862`, `tax-return-8862` |

### Military & international (8)

| # | Label | Description | Book ref | Statements | App forms |
|---|---|---|---|---|---|
| 1 | I'm in the U.S. Armed Forces | Base pay is taxable but many allowances are tax free, and reservists can deduct travel over 100 miles from home (Form 2106). | Ch. 35 (35.1–35.3, 35.8) | `w-2` | `employment-taxpayer`, `income-adjustments-taxpayer` |
| 2 | I served in a combat zone | Combat pay is excluded from income, can be counted for the Earned Income Credit, and deadlines are extended. | Ch. 35 (35.4–35.7) | `w-2` | `combat-pay-taxpayer`, `earned-income-credit-taxpayer` |
| 3 | I moved because of a military order | Active-duty members can deduct unreimbursed costs of a permanent change of station (Form 3903). | Ch. 13 (13.3) | `w-2` | `income-adjustments-taxpayer`, `tax-return-3903` |
| 4 | I lived and worked outside the U.S. | Up to $130,000 (2025; $126,500 in the book’s 2024 figures) of foreign earnings plus housing costs can be excluded if you meet a residence or presence test (Form 2555). | Ch. 36 (36.1–36.8) | `w-2` | `foreign-earned-income-taxpayer`, `tax-return-2555-taxpayer` |
| 5 | I have bank or investment accounts outside the U.S. | Foreign financial assets above the thresholds must be reported (Form 8938), separate from the FBAR filed with FinCEN. | Ch. 48 (48.7); Ch. 5 (5.10) | — | `form-8938`, `tax-return-8938` |
| 6 | I lived or worked in Puerto Rico, Guam, the USVI or American Samoa | Territory wages come on Forms W-2GU, W-2VI or W-2AS, and some territory income is excluded from U.S. tax (Form 4563). | Ch. 36 (36.9–36.10) | `w-2-gu`, `w-2-vi`, `w-2-as` | `possession-residence-exclusion-taxpayer`, `tax-return-4563-taxpayer` |
| 7 | My spouse is not a U.S. citizen or resident | You can elect to treat a nonresident spouse as a resident to file jointly, or file separately or as head of household. | Ch. 1 (1.5) | — | `filing-status`, `spouse` |
| 8 | I moved to or left the U.S. during the year | Arriving or departing can make you a dual-status alien, with special filing and deduction rules (Form 1042-S for U.S.-source income). | Ch. 1 (1.16–1.19) | `1042-s` | `filing-status`, `standard-deductions-taxpayer` |

## Book material deliberately left out

| Book topic | Why it is not a scenario |
|---|---|
| Ch. 39 Gift & estate tax (Form 709, estate tax) | These are separate returns, not part of the Form 1040 family. Gifts received are covered by "I inherited money or property" (12.4). |
| 1.7–1.9 Innocent spouse / separate liability / equitable relief | This is a stand-alone request (Form 8857) filed apart from the return. The app has no form for it. |
| 1.15 Return for an incompetent person; 1.13 filing for your child | These are about who files the return, not a tax situation. A dependent's own return is outside the single-return design. |
| 1.19–1.20 Sailing permit, expatriation tax (Form 8854) | Rare, and the app has no form for them. |
| Ch. 7 like-kind exchanges, 30.14–30.15 traders, 6.7 / 30.11 QSBS and §1244, 32.6 Form 2439, 5.31 below-market loans, 8.8 NUA, 8.16 / 9.7 excess contributions, 8.3 pre-1936 lump sums | Dropped to keep the list near 100. The app supports most of them inside existing forms: capital-gain-loss (like-kind, installment), statement `2439`, lump-sum-distribution, Form 5329. They can come back if the screen gets an "advanced" tier. |
| 3.7 deferred compensation, 3.8 claim-of-right repayment, 3.12–3.14 sick or disability pay, 4.14 / 45.6 clergy, 20.2 performing artists | Dropped for length. The app supports them in other-incomes, 31-other-payments, employment and se-tax-options. |
| 12.21 jury duty, 46.6 identity theft, 46.7 address change, 46.4 refund splitting, 33.7 education-credit payback, 40.21 business credits, 45.5 optional SE method, 40.11 start-up costs | Too minor for a checklist, or already asked inside the forms that handle them. |
| Ch. 4 most fringe benefits (group-term life, transit, de minimis, cafeteria plans, FSAs) | The employer reports these on the W-2. The filer has nothing to decide, so the W-2 scenario covers them. |
| Ch. 14 standard vs itemized; Ch. 22 tax computation; 23.1–23.3 AMT mechanics; Ch. 26 withholding mechanics | These are calculations the app does, not filer situations. AMT keeps one scenario because it is a real concern for people with ISOs. |
| Ch. 42 / 43 depreciation detail (MACRS tables, conventions, listed property, luxury-auto caps) | Covered by "I bought equipment…" and "I used my car or truck for business". |
| Ch. 48 IRS exams and penalties (except 48.7 foreign accounts) | This is procedure, not a filer situation. 48.7 is kept as the foreign-accounts scenario. |

## Gaps: scenarios with weak or preview-only app support

- **"I need to fix a return I already filed"** maps only to the `tax-return-1040x` preview. There is
  no input form for entering changes.
- **"I may owe the alternative minimum tax"** maps only to the `tax-return-6251` preview. AMT is
  computed, so this is a routing question rather than a missing feature.
- **Installment sale (Form 6252).** A `Form6252Component` exists and is routed (`'6252'`), but it is
  not in any sidebar array. The scenario points to capital-gain-loss instead.
- **Household employee (Schedule H)** lives inside the "Other tax items" form (`16-tax-taxpayer`). The
  sidebar has no Schedule H entry.
- **Misclassified worker (Form 8919)** maps to Uncollected Social Security and the 8919 preview. There
  is no statement for it (no 1099 equivalent).
- **Opportunity Zone deferral (Form 8997), like-kind exchange (Form 8824) and Form 8857** have no
  dedicated app form.
- **"Not in book" 2025 scenarios** (tips, overtime, car loan interest, senior deduction) cite no book
  section. Their authority is the 2025 Schedule 1-A instructions.
