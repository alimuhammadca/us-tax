**★ Notary profit is neither self-employment earnings nor EIC earned income; what round 2 pinned in the dependency, credit-ordering, PFIC, BBA, health-insurance, IRA and charity corners (round-2 QA, sc_00381-00390, 2026-10-16; one engine fix).** (1) A notary public's net profit stays on Schedule C (income, and QBI) but comes off Schedule SE line 3 ("Exempt—Notary"; with no other SE income no Schedule SE at all) and out of EIC earned income - 2025 1040 instructions, EIC Worksheet B: Part 1 line 1a is Schedule SE line 3, and Part 2 says *"Don't include on these lines … any net profit from services performed as a notary public"*; the compute removed it from the SE base but kept it in the EIC base (an all-notary 16,500 got EIC 197) - fix fa03a3b4. Also pinned (no engine change): the four Schedule 1-A deductions are open to itemizers and come off before the QBI income limit (Form 8995 line 11 = 11a − 12e − 13b); a parent claimed under a multiple support agreement earns the 500 credit but is not a head-of-household qualifying person (1040 instructions, Test 1: *"except under a multiple support agreement"*; no app field - A84); a non-parent may claim a child the parent does not claim only with an AGI HIGHER than the parent's - equal is not enough (no tiebreaker inputs - A85); a Form 8332 release moves only the dependency / CTC / ODC / ACTC, and the nonrefundable CTC is limited to the tax left after Schedule 3 line 2 (Credit Limit Worksheet A); a section 1291 excess distribution is allocated per DAY of the holding period (2024 has 366), there is none in the first year of the holding period, and a distribution up to 125% of the prior average is a nonexcess dividend on line 3b (a PFIC's dividends are never qualified); a Form 8978 line 14 belongs to the year the Forms 8986 were furnished, a positive amount goes on line 16 box 3 and a negative one on Schedule 3 line 6l (capped at line 18, the excess to Schedule 2 line 17z - not implemented, B53); Pub. 974 allows the Iterative or the Simplified method for SEHI beside a PTC (any method keeping deduction + credit ≤ the premium), so only method-free figures are graded, and where the credit is zero there is no circularity; SEHI excludes any month or part of a month of employer-plan eligibility; Pub. 590-A Appendix B fixes the IRA phase-out MAGI with benefits taxed as if there were no IRA deduction, then refigures line 6b with the deduction; the 60% cash ceiling sits on AGI (no QBI deduction in it) and a SEP moves both the base and QBI; whole-dollar vs cents Schedule SE arithmetic is a convention, not a rule. Round-1 Lasser slips corrected: 21.5 -> 2.6/1.12, 21.7 -> 2.3, 21.12/1.6 -> 2.7/25.2/25.5-25.7, "30.x" -> none, "11.x" -> 12.13, 21.13 -> 13.2/25.13, 8.4 -> 9.4/34.3, 14.17 -> 18.17/18.18, 45.4 -> 45.3; round 1 also missed sc_00390's EIC (refund 168 -> 457).

**★ An RRB‑1099‑R box 3 cost does not make box 4 tax‑free by itself; what round 2 pinned in the NIIT, Social Security, estimated‑tax and Schedule 1‑A corners (round-2 QA, sc_00371-00380, 2026-10-16; one engine fix).** (1) RRB‑1099‑R box 4 (NSSEB + tier 2) is fully taxable until a Simplified Method / General Rule worksheet figures its tax‑free part — box 3 prints the TOTAL employee contributions every year (Pub. 575 (2025): *"It may be partly taxable and partly tax free or fully taxable. If you determine you are eligible to compute a tax-free part … use the latest reported employee contribution amount shown in box 3 as the cost"*); the compute dropped all of box 4 whenever box 3 was typed - fix 51779d92 (e2e GAP A4.3 updated). Table 1 is read at the age **at the annuity starting date**, and prior tax‑free recovery caps line 8 without shrinking line 4. Also pinned (no engine change): Form 8960 line 9a is only investment interest *"deducted on Schedule A"* (none for a standard‑deduction filer), line 9b shares out the state INCOME tax actually deducted - the instructions' illustrated method is line 8 ÷ AGI - and *"Sales taxes aren't deductible in computing NII"* (line 9b is still typed and ungated, outstanding B48); NIIT MAGI adds back Form 2555 line 42 only, never the housing exclusion, and MAGI exactly at the threshold is not over it; the Social Security worksheet's line 4 is Form 1040 line 2a, i.e. tax‑exempt interest NET of the amortized premium (1099‑INT box 13); withholding counts in equal parts on the four due dates (late withholding reaches back), while an estimate counts on its date and is applied to the oldest shortfall first; the retirement waiver (§6654(e)(3)(B)) is REQUESTED on Form 2210 Part II box A and decided by the IRS - age 62 at the retirement date, not at year end; the required annual payment is the smaller of 90% of 2025 and 100%/110% of 2024; Schedule 1‑A caps (tips 25,000, overtime 25,000 joint, car loan 10,000) are per RETURN, not per spouse, and the joint thresholds (300,000 / 300,000 / 200,000 / 150,000) apply; the tips figure may be the Forms 4070 total when box 7 stops at the wage base; qualified overtime is only the FLSA half (pay over time‑and‑a‑half never qualifies); a used vehicle is not an applicable passenger vehicle; the senior line 35 is figured once and taken by each eligible spouse. Round-1 Lasser slips corrected: 28.2 -> 28.3, "36.x" -> 36.1/36.4, 27.2 -> 27.1.

**★ Schedule K-1 portfolio interest is interest income; what round 2 pinned in the COD, charitable, mortgage, gambling and NIIT corners (round-2 QA, sc_00361-00370, 2026-10-16; one engine fix).** (1) K-1 interest - Form 1065 box 5, Form 1120-S box 4, Form 1041 box 1 - goes on Schedule B and Form 1040 line 2b (Shareholder's Instructions for Schedule K-1 (Form 1120-S) (2025), Box 4: *"Report interest income on Form 1040 or 1040-SR, line 2b"*) and is net investment income whatever the owner's participation (portfolio income *"isn't subject to the passive activity limitations"*); the compute never read the fields - fix 239c53a8 (dividends / royalties / portfolio gains still open, outstanding B46). Also pinned (no engine change): the QPRI exclusion applies only to the canceled amount over the non-QPRI part of the loan, and refinanced debt is QPRI only up to the old principal (Pub. 4681, ordering rule; A75); a gift loan between individuals of 100,000 or less imputes no more than the borrower's net investment income, and NII of 1,000 or less is zero (section 7872(d)(1)); the 2025 blended annual rate is 4.22% (Rev. Rul. 2025-13); for 2018-2025 a professional gambler's expenses are "losses from wagering transactions" and with the wagers are allowed only up to the winnings - no Schedule C loss (section 165(d) as it read for 2025; the 90% rule starts in 2026); a QCC is limited to 50% of AGI minus the gifts deducted in Pub. 526 steps 1-5 and carries 15 years, while the same land given outright is 30% capital-gain property; a bargain sale splits the basis by FMV, so a sale at the basis still gains (Pub. 544), and the gift part of short-term property is deductible only at its share of the basis (Pub. 526 Step 3); Pub. 936 Table 1 gives old and new mortgage debt ONE limit (line 9 = the larger of the pre-2017 debt and 750,000), and pre-2017 debt over 1,000,000 is prorated; a medical improvement counts at its cost less the value it adds - none when the value added equals the cost (Worksheet A "more than or equal to") - while ramps, doorways, porch lifts and grab bars count in full (Pub. 502); a short-term gain on investment property is Form 4952 line 4f investment income without any election, so line 4g can hold only lines 4b + 4e; a passive owner's S-corporation income and a passive partner's gain on selling the interest are NII, and NIIT is 3.8% of the SMALLER of NII and the MAGI excess; line 5c (section 1411(c)(4)) is only for a partner who materially participated. Round-1 Lasser slips corrected: 11.8 -> 12.8, 4.31 -> 5.31, 11.3 -> 12.3, 14.12 -> 18.10/18.17, 14.6 -> 18.8, 15.2 -> 17.2, 17.10 -> 15.13, 15.10 -> 17.9, 28.2 -> 28.3; round 1 also omitted Form 8959 (sc_00366) and used a placeholder AFR (sc_00362).

**★ Schedule 8812 line 22 reads Schedule 2 lines 5, 6 and 13; church-employee ½-SE is not the business's for QBI; what round 2 pinned in the credit, SE and recapture corners (round-2 QA, sc_00351-00360, 2026-10-16; two engine fixes).** (1) Part II-B line 22 is *"the total of the amounts from Schedule 1 (Form 1040), line 15; Schedule 2 (Form 1040), line 5; Schedule 2 (Form 1040), line 6; and Schedule 2 (Form 1040), line 13"* - the half-SE deduction, Form 4137's tax on unreported tips, Form 8919 and the uncollected tax on tips / group-term life. Each Schedule 2 term was read one line off (6, 13 and 11), so Form 4137 never counted and Additional Medicare Tax - which reaches LINE 21 through the Additional Medicare Tax and RRTA Tax Worksheet - counted twice; fix ba8faade. (2) Church employee income (Schedule SE 5a/5b) is W-2 wages, not a trade or business: only the trades' share of line 6 (line 4c / line 6) of the ½-SE deduction is attributable to them for QBI (i8995: *"all items that are attributable to the trade or business ... deductible part of self-employment tax"*; QBI excludes *"Wage income"*), and none when line 4c was zeroed under the $400 church exception; fix 880103b4 (QBI only - the SE retirement / health ceilings still net the whole ½-SE, outstanding B43). Also pinned (no engine change): the line 4c $400 test applies to the non-church SE income alone (*"If less than $400 and you had church employee income, enter -0- and continue"*); the Form 5695 line 14 worksheet subtracts the Part II credit (line 32) first, and a 2024 carryforward (line 12) is added to the 2025 credit before the limit; the Form 8863 line 7 refundable bar needs all of 1(a/b/c), 2 and 3 - 24 is not *"under age 24"* and a joint return is never barred; Schedule 8812 Credit Limit Worksheet A subtracts Schedule 3 lines 1-4 before the CTC, so other credits push the CTC into the ACTC where line 16b caps it at 1,700 a child; the farm optional method replaces only line 1a (*"Skip lines 1a and 1b if you use the farm optional method"*) while a Schedule C stays on line 2, and the EIC counts Schedule SE line 3 + 4b - line 13 (EIC Worksheet B); non-listed §179 recapture is the deduction less Table A-1 MACRS INCLUDING the recapture year at its business-use % (Pub. 946 ch. 2), listed-property §280F(b)(2) recapture uses ADS for the PRIOR years only and the drop year is depreciated with ADS x business use (ch. 5; Lasser 43.10), both reported as Schedule C other income; the refund worksheet's line 2 is all of 2024 line 5d (income + real-estate + personal-property taxes) less 5e, and line 6 adds 1,950 (single/HOH) for age or blindness; §108(b) attribute reduction comes AFTER the year's tax - a capital loss carryover first gives its 2025 deduction, then what is left is cut (Pub. 4681; Form 982 line 9). Round-1 slips corrected: Lasser 25.16-25.17 -> 25.15, 45.4 -> 45.5, 43.9 -> 42.3, 11.5 -> 12.5, 11.8 -> 12.8; sc_00354/00355 omitted the EIC, sc_00358 the drop-year ADS deduction.

**★ Code-J Roth earnings carry the 10%; the Form 1116 high-tax kickout reads the per-type tax columns; what round 2 pinned in the IRA and foreign corners (round-2 QA, sc_00341-00350, 2026-10-16; two engine fixes).** (1) The taxable part of an early Roth IRA distribution (Form 1099-R code J, Form 8606 line 25c) is on Form 5329 line 1 - 2025 Instructions for Form 5329, line 1: *"you only need to include the amount from line 25c of your 2025 Form 8606 on line 1 of this form"*. The engine's 10% base took codes 1 and S only; fix a5b15d42 adds the code-J share of line 25c (a mixed J/T year takes the J share; an unused line-2 exception reduces it). The five-year conversion RECAPTURE amount (conversions "in 2021 through 2025", allocated contributions first, then conversions first-in first-out, taxable part first) is also line 1 although never income - not derived (no conversion-year input; outstanding A69). (2) Passive income taxed above 37% after allocation of expenses is general category ("HTKO"; i1116) and is limited apart from low-taxed passive income; isHighTaxedPassiveCountry read only the legacy foreignTaxesPaidUsd, so a country entered by withholding type (columns q-t) was never kicked out - fix 8ae3da1e uses column (u) as line 8 does. Also pinned (no engine change): a code-4 beneficiary distribution owes no 10% at any age, but a surviving spouse who TREATED the IRA as his own gets code 1 and the 10% (Pub. 590-B); the SEPP exception (02) covers only the series' payments, and from an employer plan only after separation from service (i5329); one IRA-to-IRA rollover per 1-year period counted from RECEIPT of the first distribution, plan-to-IRA rollovers unlimited (Pub. 590-A); the no-Form-1116 election applies at exactly 300 ("aren't more than $300") and removes the LIMITATION, not just the form - 301 brings Form 1116 and its limit back; Form 2555 line 30 caps the EXPENSES at the Notice 2025-16 location limit (Abu Dhabi 49,687), the base 20,800 comes off after, and line 41 limits the FEIE to foreign earned income less the housing exclusion; Form 1116 line 12 removes foreign tax x excluded / total foreign earned income, and what survives is still limited by line 21; Schedule 8812 line 18a for a filer not taking the EIC is the Earned Income Worksheet - wages + Schedule C profit or LOSS - the half-SE deduction. Not modelled: the Form 1116 foreign-qualified-dividend adjustment (x 0.4054 on line 1a, Worksheet for Line 18 x 0.5946) and its exception (QDCG line 5 <= 197,300 single AND foreign QD + CGD < 20,000) - outstanding B39. Round-1 Lasser slips corrected: 8.14 -> 9.12/9.15, 8.12 -> 9.12/8.13, 8.24 -> 9.25, 8.10 -> 9.10, 36.14/36.15 do not exist (36.13).

**★ An installment sale's Form 4797 Part III figures only the recapture; what round 2 pinned in the capital-gain and AMT corners (round-2 QA, sc_00331-00340, 2026-10-16; one engine fix).** (1) §453(i): the section 1245/1250 recapture of an installment sale is ordinary income in the YEAR OF SALE even with no payment received, and is added to basis on Form 6252 line 12 so only the rest of the gain is spread - 2025 Instructions for Form 6252, line 12: *"Enter it on line 12 of Form 6252 and also on line 13 of Form 4797. Don't enter any gain for this property on line 32 of Form 4797."* The engine also routed the Part III remainder (line 32) to Schedule D while Form 6252 line 24 reported its installment share; fix 09bd4733 drops the §1231 remainder of a Part III slot whose date acquired and date sold match a Form 6252 entry (outstanding B37). Line 14 zero or less: *"Don't file Form 6252"* - a gain at or below the depreciation is all recapture. Also pinned (no engine change): §1202 - stock acquired 09/27/2010 gets 75%, 09/28/2010 100%; the included quarter of a 75% exclusion is 28% rate gain (Schedule D line 18 = 1/3 of the exclusion) taxed at ordinary rates up to the 28% ceiling, and 7% of the exclusion is Form 6251 line 2h (A66); §1259 - a short sale against the box is a constructive sale on the short-sale date unless closed by the 30th day after year end and the position then held 60 days unhedged (Pub. 550), and the gain's term ends on that date (Lasser 30.5 Example 1); the AMT exemption is in full at AMTI exactly 626,350 and zero (never negative) from 978,750 (single); Form 6251 Part III measures the 0/15/20% bands from the REGULAR worksheet's line 5 (lines 20/27), so a filer with no regular ordinary income keeps the whole 0% band in the AMT; ISO shares sold in a later year - line 2k = AMT gain minus regular gain, Part III uses the gain as refigured for the AMT, and an AMT capital loss is limited to 3,000 separately (i6251 line 2k example; A68); the AMT foreign tax credit has its own Form 1116 - line 18 = Form 6251 line 4, line 20 = line 7, numerator without the standard-deduction apportionment unless the simplified limitation election is made; the ATNOLD (line 2f) is 90% of AMTI before it, independent of the regular NOL's 80% (which line 2e adds back); a backdoor Roth is pro-rated on the December 31 value of all traditional IRAs, and a direct rollover to a 401(k) is neither in line 6 nor line 7 (B38); the 10% early-distribution tax reaches only the amount includible in income (Form 5329 line 1) - the NUA of a lump sum escapes it, and without a lump sum the NUA from employer money is taxable. Round-1 slips: the rate schedule used where the Tax Table applies under 100,000 (sc_00333, sc_00335).

**★ Four engine fixes and what round 2 pinned (round-2 QA, sc_00321-00330, 2026-10-16).** (1) A net Social Security repayment (negative box 5) of **$3,000 or less is not deductible** - Pub. 915 (2025): *"If the figure is $3,000 or less, it is a miscellaneous itemized deduction and can no longer be deducted"*; fix f61246ac stops the Schedule A line 16 auto-add at or below 3,000 (it now applies only above 3,000) and the advisory fires whether or not the filer itemizes, without the Form 1040-X pointer. Above 3,000 the tax is the smaller of the Schedule A line 16 deduction (only the part included in an earlier year's income) and the section 1341 credit on Schedule 3 line 13b (Pub. 915 methods 1/2) - the engine takes method 1 with the whole figure unless a credit is typed (outstanding A63, B34). (2) The **mid-quarter convention is mandatory**, not advisory, when more than 40% of a person's year's MACRS basis (before any special allowance, after section 179, real property excluded) is placed in service in Oct-Dec (2025 Form 4562 instructions); exactly 40% stays half-year. Fix afba1fb5 switches that person's 2025 5- and 7-year 200% DB assets to mid-quarter in loadPersonalForms (the filer's entry kept as conventionEntered for the advisory); other classes keep the typed convention (B35). (3) **Section 280A(g)**: a home rented fewer than 15 days (1-14 fair-rental days, a residence under 280A(d)(1)) is not on Schedule E - no income, no rental expense (Pub. 527 ch. 5); fix 7d9a7342. 15 days reports all the rent with expenses divided by days used. (4) **Corrective distributions are not pensions**: non-IRA Forms 1099-R coded 8 or P are kept off lines 5a/5b (2025 Form 1040 instructions, lines 5a/5b: *"report them on line 1h"*); code 8 reaches line 1h, code P is the prior year's income (Pub. 525); fix 6d88bb69. Also pinned (no engine change): Form 1099-PATR patronage dividends on Schedule F line 3a, only the farm-supply part on 3b (personal-use purchases on 3a only), per-unit retains included, box 4 on line 25b; Form 8962 Part V on Pub. 974's worked example (line 24 7,021 vs 5,481, repayment 1,402 vs 2,942); a decedent's standard deduction is never prorated, IRD (wages unpaid at death, Form 1099-MISC box 3 to the estate) stays off the final return, and the age-65 amounts depend on age AT DEATH (65 on the day before the 65th birthday) - the engine has no date-of-death input (A64); Schedule C line 36 is purchases less personal withdrawals and less purchase returns; a designated Roth (code AA) excess deferral is not added on line 1h; unrecaptured section 1250 gain is taxed at ordinary rates up to 197,300 and at 25% only above it, and it is stacked below the 28% collectibles gain (Schedule D Tax Worksheet lines 21, 39, 42).

**★ Round-2 QA sc_00311-00320 rules pinned (2026-10-15; no engine change).** Form 4868 line 5 is line 33 *excluding* Schedule 3 line 10 and line 6 floors at 0; the extension payment is credited once, on Schedule 3 line 10 -> 1040 line 31. Section 121(c): the reduced limit is the shortest of the residence, ownership and since-last-exclusion periods / 730 days x 250,000 (Pub. 523 Worksheet 1 Section B) - the engine takes it as a typed cap (outstanding A59); a home held from 09/01/2024 to 09/01/2025 is short-term. QTP: AQEE = qualified expenses - tax-free assistance - the expenses used for the AOTC/LLC; taxable earnings = box 2 - box 2 x AQEE / box 1; the 10% (Form 5329 Part II) excepts what is taxable only because of the credit or a scholarship (the engine has no QTP field for Part II - A58). Foreclosure (Pub. 4681 Table 1-1): nonrecourse realizes the whole debt, no COD; recourse realizes the smaller of (debt - amount still owed) and FMV, the excess is ordinary COD. QOF: only gain realized within the 180 days before the investment can be deferred, chosen by character, never more than the gain (engine trusts code-Z rows - B32). Installment notes: later-year line 20 = 0; a sold note's basis = unpaid balance x (1 - gross profit %), gain keeps the original sale's character. ABLE: a beneficiary's own contributions count on Form 8880 line 1 and ALL ABLE distributions in the testing period go on line 4 (the engine imports 1099-R, not 1099-QA - B33). Form 1099-CAP: report a gain, never a loss (Pub. 550: enter nothing). Life policy sale (Lasser 12.20): basis = all premiums; ordinary up to the inside buildup (surrender value - premiums), capital above; a term-policy loss is personal. QLAC: its value is left out of the RMD base until it fails (Instructions for Form 1098-Q); Part IX taxes only a shortfall (25%, 10% if corrected in the window).

**★ Form 8615 Line 5 Worksheet #1; what the §931 exclusion does to the rest of the return; Form 8888 splits line 35a (round-2 QA, sc_00301-00310, 2026-10-16; one engine fix).** (1) Form 8615 line 5 carries only the part of the child's qualified dividends / net capital gain left after the 2,700 on line 2 is charged against them pro rata - 2025 Instructions for Form 8615, Line 5 Worksheet #1 (*"Use this worksheet only if line 2 of the child's Form 8615 is $2,700 and lines 3 and 5 are the same amount"*): QD on line 5 = QD - 2,700 x (QD / line 1), ratio rounded to at least three places; the rest stays on line 14 at the child's own rate. We put all of it on line 5 (min(line 5, QD + NCG)); fix d455da7c applies Worksheet #1 and keeps the old path for Worksheets #2/#3 (outstanding B30). (2) A bona fide resident of American Samoa excludes Samoa-source income by NOT reporting it (Form 4563 is a disclosure); U.S. Government wages are never excludable; the standard deduction (incl. the 65+ amount) is multiplied by U.S.-taxed gross income / all gross income (Pub. 570 ch. 4) but the Schedule 1-A senior deduction is not - it is phased out on a MAGI that includes the excluded income and then taken in full. (3) Form 8888 line 5 must equal line 35a (line 34 less line 36), not line 34. Also pinned (no engine change): Form 8828 line 23 = smaller of half the gain and subsidy x holding % x income % (line 18 = excess / 5,000 below 5,000; line 17 zero stops it); Form 2210-F one January 15 installment of min(0.667 x line 6, 2024 tax); the QBI deduction reduces neither Form 8960 NII nor MAGI and stays subtracted in 2025 Form 6251 (line 1b; line 2a adds back only 12e or Schedule A line 7); the §172 80% base excludes the QBI deduction while Form 8995 line 11 starts after the NOL; Form 6251 line 2a = the SALT deducted after the phase-down; taxable social security is in the Schedule 1-A MAGI. Not modelled: Form 8938's year-end value (outstanding A57 - the engine tests the maximum against the year-end threshold); Form 8828 line 15 is typed (B31).

**★ HSA excess carried from an earlier year; Form 8379 off-container; what round 2 found the app cannot express (round-2 QA, sc_00291-00300, 2026-10-16; one engine fix + one robustness fix).** (1) Form 5329 Part VII: a prior-year excess HSA contribution absorbed by this year's unused room (line 43 = Form 8889 line 12 - line 2) is not only untaxed but DEDUCTIBLE this year - 2025 Instructions for Form 5329, line 43: *"Also include on your 2025 Form 8889, line 13, the smaller of: Form 5329, line 43; or The excess, if any, of Form 5329, line 42, over Form 5329, line 44"* (Pub. 969, Deducting an excess contribution in a later year) - fix 0e471afe adds it to line 13 in computeForm8889; line 46 = line 42 - (line 43 + line 44) now also subtracts line 44 (Form 8889 line 16). (2) computeForm8379 now reads the tax year null-safely like every other builder (c85ea385) - a return with an injured-spouse claim threw outside the CDI container, so Form 8379 had no end-to-end pin. Also pinned (no engine change): Form 8824 line 20 = smaller of boot and realized gain, not below zero, and only NET debt relief is boot; Form 6781 splits 40/60 before Schedule D netting; the general business credit's 38(c) floor is the tentative minimum tax even when no AMT is owed (Form 3800 line 14 = Form 6251 line 9); Form 2210 Schedule AI period (c) ends August 31 and an annualized installment never exceeds the regular one plus unused regular amounts; OBBBA 100% bonus is for property ACQUIRED after January 19, 2025 (Jan 19 itself is 40%); Form 4137 line 8 adds the social security wages of ALL the filer's W-2s; Form 8379 line 15 halves the BASIC standard deduction (31,500 for 2025 - the Rev. 11-2024 instructions still print 30,000); Form 8611 line 4 is .333 through year 11 and .267 in year 12; the Form 8283 appraisal line is MORE than 5,000 per item or group of similar items (across donees), never for listed securities. Not modelled (outstanding A54-A56): an HSA excess withdrawn by the due date; an asset's acquisition (binding-contract) date; a Form 8283 property category for grouping similar items.

**★ Home office for a standard-deduction filer; Form 8814 in the parent's EIC test; carryovers limited with the current year (round-2 QA, sc_00281-00290, 2026-10-16; two engine fixes).** (1) Form 8829: a filer who takes the STANDARD deduction puts the business part of mortgage interest and real estate taxes on lines 16/17 (operating tier, limited by line 15, excess carried on line 43), not lines 10/11 (2025 Instructions for Form 8829, lines 9-11, 16, 17; Lasser 40.15's example) - fix 9f4d39d8 re-runs prepare() once with HOME_OFFICE_STANDARD_DEDUCTION when the first pass took the standard deduction and an office has line 10/11 amounts. A prior-year operating carryover (line 25) is limited AGAIN together with the year's expenses. (2) Pub. 596 Worksheet 1 line 4: the amount a parent reports from Form 8814 (Schedule 1 line 8z) is the parent's EIC investment income - fix 98f9bd0c (FORM8814_LINE12_FOR_EIC); only line 12 counts, not the child's whole income (11,900 <= 11,950 keeps the EIC). Also pinned (no engine change): a 2024 foreign tax carryover joins Form 1116 line 10 and is capped with the 2025 tax by the 2025 limit, the standard deduction apportioned on line 3a; the capital loss carryover worksheet starts from line 15 as a NEGATIVE number - a 3,000 deduction that only deepened a negative taxable income is not used and carries over; the prior-year minimum tax credit stops at the tentative minimum tax, measured after the other nonrefundable credits (Form 8801 line 22); Schedule H: "2,800 or more" (exactly 2,800 is taxed, on all of it), an under-18 student is out of the 2,800 test but FUTA's line 15 has no under-18 exclusion; Form 4835 crop-share rent is not SE income, material participation makes it Schedule F; a crop share is income when converted to money; with equal incomes MFS brackets cost nothing, so a large medical floor can make separate returns win. Not modelled (outstanding A50-A53): the clergy smallest-of limit and line-1h excess allowance; the CRP exclusion's timing test; Schedule H per-employee tests.

**★ Carryovers keep their limits and come back in order; two engine fixes (round-2 QA, sc_00271-00280, 2026-10-16).** (1) A prior-year
charitable carryover is Schedule A input however it arrives (legacy single field, per-category fields, bridge import) - fix b976ed48; it keeps
its category: a 30% capital-gain-property carryover is limited to the smaller of 30% of AGI or 50% of AGI minus this year's 60%-limit cash
(Pub. 526 step 4, Carryovers Example 2), current-year gifts first. (2) A loss suspended by the at-risk rules is a deduction of the activity in
the next year (465(a)(2)); the activity's own income absorbs it before any at-risk loss arises, so the release headroom of an at-risk-tracked
rental/4835 activity is amount at risk + net (fix 087c7405); what is left of the income then releases the 469 prior-year unallowed loss. A
blank amount at risk still gives no headroom (outstanding B22). Also pinned (no other engine change): MFS AMTI over 900,350 adds 25% of the
excess, at most 68,500 (6251 line 4); a building placed in service before 1999 uses 40-year SL for the AMT (a 1990s building whose 27.5-year
schedule ended gives a NEGATIVE line 2m), none after 1998, and a passive rental's adjustment goes on 2m, not 2l; 1245 recapture = smaller of
gain or depreciation, 1250 straight-line gain is unrecaptured (Sch D line 19) and the Schedule D Tax Worksheet taxes it at ordinary rates up to
the 24% bracket (line 21 = larger of line 18 or line 20) - 25% is a ceiling; the Schedule R limit starts from Form 1040 line 18, which includes
the Form 4972 tax; a post-2017 NOL deduction is limited to 80% of taxable income without the NOL/199A/250 deductions, and Form 6251 adds it
back (2e) and takes the ATNOLD (2f, 90% of AMTI); a 448(c) small business is exempt from 163(j) (no Form 8990, interest in full); the QBI loss
and REIT/PTP loss carryforwards net only against their own component (Form 8995 lines 4 and 8, floored at 0, leftovers on 16/17); 461(l)
limits only the business loss ABOVE 313,000 (single, 2025) - a loss of exactly 313,000 is allowed in full.

**★ Round-2 QA sc_00261-00270 rules pinned (2026-10-15; no engine change).** Form 8863: AOTC and LLC share the 80,000-90,000 (single)
phase-out, line 6/17 = (90,000 - MAGI) / 10,000 to at least three places, nothing at 90,000; the AOTC's refundable 40% (line 8) is taken from
the PHASED-OUT credit. §24(d)(5): a return with Form 2555 gets no ACTC (line 19 still applies; the FEITW taxes the rest at the stacked rate).
Income needs no information return: no-1099-DIV dividends keep their qualified status, a canceled debt under $600 is line 8c, a sale with no
1099-B is Form 8949 box C/F. HSA: one family limit (8,550) for spouses, divided as they agree on each line 6; the 1,000 catch-up only raises
the owner's own limit - a catch-up put in the other spouse's HSA is excess (6%). Seller-financed interest received needs Schedule B at any
amount; interest paid to an individual seller is Schedule A line 8b (we hold one 8a amount - outstanding A48). EIC: investment income
"11,950 or less" (exactly 11,950 allowed) and it includes tax-exempt interest (Pub. 596 Worksheet 1 line 2). Roth: Worksheet 2-1 adds the
traditional IRA deduction back to AGI; Worksheet 2-2 line 11 caps the reduced limit at 7,000 minus other IRA contributions. Form 8814: one form
per child - the 2,700 base and the 1,350 / 10% tax apply per child. 402(g): the 11,250 catch-up is for ages 60-63 AT YEAR END (a 12/31
birthday at 60 is in, at 64 out). Dependent standard deduction: a taxable scholarship (Schedule 1 line 8r) is earned income.

**★ Form 1098 box 4 is a line 8z recovery, never a cut to line 8a (round-2 QA, sc_00251-00260, 2026-10-15).** A refund of mortgage interest
overpaid in an EARLIER year (Form 1098 box 4) is not subtracted from this year's interest (Schedule A instructions line 8a; Pub. 525 "Mortgage
interest refund"); it is other income on Schedule 1 line 8z up to the tax benefit it gave - the lesser of the refund and the amount by which the
earlier year's itemized deductions exceeded its standard deduction (Pub. 525 Standard deduction limit, Example 32; Lasser 12.6), zero if the filer
did not itemize - fix 70dd8573 (the box was stored and never read). Gating mirrors the state-refund worksheet: prior-year itemizing unanswered ->
the full refund; the itemized excess is shared with a taxable line-1 state refund (state refund first; Pub. 525's pro-rata split of the included
total between line 1 and 8z is not modelled - same total). Box 5 (mortgage insurance premiums) stays ignored: the deduction expired after 2021
(line 8d "Reserved"). Also pinned by Hrb2025Sc00251-00260 (no other engine change): a Trade Act SUB-pay repayment is Schedule 1 line 24e at ANY
amount (no $3,000 floor - Lasser 3.5), while a 3,000 repayment of an earlier year's state unemployment gives nothing; cash to a private
non-operating foundation is limited to the smaller of 30% of AGI and 50% of AGI minus gifts to 50% limit organizations; Form 4684 takes $100 per
CASUALTY (items of one casualty share it; line 12 floors at 0) then one 10%-of-AGI floor; the 402(g) deferral limit is per person across all W-2s
(23,500; 31,000 from 50; 34,750 at 60-63) and the excess is line 1h; Form 4137 line 5 removes under-$20 months from the FICA base (still line 1c
income), noncash tips are line 1c only (not 4137, not qualified tips), Schedule 1-A line 4c is the larger of W-2 box 7 and Form 4137 col. (c);
allocated tips (box 8) are line 1c + Form 4137 unless records prove less; Medicaid waiver pay is excludable only for care in the provider's own
home (Notice 2014-7); 1099-R box 6 NUA is not in line 5b and its gain on sale is long-term up to the NUA (Notice 98-24); the Social Security
worksheet line 6 takes Schedule 1 lines 11-20, 23, 25 - the IRA deduction, NOT student loan interest (§86(b)(2)).

**★ General Rule percentage to 3 places; SECURE 2.0 exceptions stop at their dollar limits; elected Medicaid waiver pay is EIC earned
income (round-2 QA, sc_00241-00250, 2026-10-15).** (1) Pub. 939 (Rev. 12-2025) Step 3: the exclusion percentage = investment / expected
return ROUNDED TO THREE DECIMAL PLACES, applied to the first regular payment x payments received this year; Table V is entered at the age
at the birthday NEAREST the annuity starting date (60,000 / (12,000 x 19.2) = .260 -> 3,120 tax-free, not 3,125) - fix 4890f474, both
General Rule paths. (2) Form 5329 line 2 exception 23 (emergency personal expense) is at most 1,000 a year and exception 22 (domestic
abuse victim) at most 10,300 for 2025 (Pub. 590-B; the account-value limbs need a balance we do not hold) - fix 688b7825, IRA and plan
paths, like exception 09's 10,000; exception 19 (birth/adoption) is 5,000 PER birth or adoption, so it is not capped without a count
(outstanding A42). (3) EIC Worksheet A line 1 is Form 1040 line 1z, which includes line 1d (Medicaid waiver pay not on a W-2, incl.
qualified payments the filer elects to include) - fix 3c4c4f08 (sc_00249 B: EIC 4,328 not 1,709); Schedule 8812 already used 1z. Also
pinned by Hrb2025Sc00241-00250 (no other engine change): MFS without Form 8962 box A -> line 24 = 0 and the whole advance is excess,
limited by Table 5's "any other filing status" column (265% -> 1,950, not the single 975; 401 -> no limit); with box A (spousal abandonment)
the credit is figured normally; an ITIN child gives the 500 ODC (nonrefundable) and the parent a SELF-ONLY EIC (Pub. 596 Rule 2), never the
CTC/ACTC; student loan interest is barred to a claimed dependent (the engine bars "can be claimed" - statute "allowable"; the 1040
instructions say "aren't claimed", outstanding B16); attorney fees on 24h/24i stop at the income from the claim (fees = income -> all
deductible); 1099-OID box 11 is line 2a, never netted against box 1, and enters the Social Security worksheet; SS benefits are the NET box 5
and a spouse's negative box 5 offsets on a joint return; W-2 box 12 A/B/M/N are Schedule 2 line 13 tax, not withholding.

**★ A 1099-S real-estate sale is capital detail on its own; after an EIC disallowance the REASON and the DETERMINATION YEAR decide
(round-2 QA, sc_00231-00240, 2026-10-17).** (1) The capital statement gate (`CAPITAL_STATEMENT_UPLOAD_REQUIRED`) counted neither the
1099-S nor its `property1099SDispositions` rows, so a return whose only capital item was a land / second-home / over-the-cap home sale
was blocked - fix (this batch): disposition rows count as manual capital detail, like the section 1033 conversion (sc_00239 D: land
elected out of the installment method -> 40,000 LTCG, owe 3,855). (2) Pub. 596 ch. 5: a math or clerical error never needs Form
8862; any other disallowance does, unless claiming WITHOUT a qualifying child after a child-only disallowance (Exception 1) or Form
8862 was filed since and allowed; reckless disregard bars the EIC for the year of the IRS determination and the next (determined
2024 -> none for 2025), fraud for 10 years from it (determined 2015 -> 2025 is the first year back, with Form 8862). Our EIC form
asks only "previously denied" (outstanding A37). Also pinned by Hrb2025Sc00231-00240 (no other engine change): Form 8814 needs
gross income LESS than 13,500 and line 15's 135 reaches line 16 even when line 6 is 0 (2,700); a dependent incapable of self-care
must live with the filer MORE than half the year for Form 2441 (6 months no, 7 yes), and the care credit comes off the tax before
the CTC/ODC (Credit Limit Worksheet A -> ACTC); the IRA limit is 8,000 if 50 by 12/31 (born 12/31/1975 yes, 01/02/1976 no) and
traditional + Roth share it (the overage is a Roth excess); a pre-2019 alimony decree modified later stays taxable unless the
modification expressly adopts TCJA section 11051 (line 2b = the ORIGINAL date); inmate pay is Schedule 1 line 8u and not EIC
earned income; qualified Medicaid waiver pay is excluded and out of EIC earned income unless elected; the Simplified Method recovers
cost / table number x MONTHS paid this year; the Pub. 915 lump-sum election refigures the earlier-year part with THAT year's income;
the car-loan deduction loses 200 per 1,000 OR PART over 100,000 (100,001 -> 3,800); Form 6252 gross profit is after selling
expenses and the contract price excludes debt the buyer assumes up to basis; the section 1341 credit is the earlier year's tax
decrease from its Tax Table. Open: section 962 deemed-paid credit without the section 78 gross-up (A40).

**★ An optional-method SE base is EIC earned income; a later estimated payment pays the EARLIEST unpaid installment first
(round-2 QA, sc_00224 / sc_00228, 2026-10-16).** (1) EIC Worksheet B line 1a is Schedule SE line 3, which skips the farm lines under
the farm optional method and line 2 under the nonfarm optional method; line 1b adds Schedule SE line 4b. So the elected optional
amount REPLACES the net profit in EIC earned income - fix 609d0c8d (sc_00224: gross farm income 9,000, net 1,000, optional 6,000 ->
EIC 423, not 40; net 5,000, optional 7,240 -> 511, not 339). The farm method needs gross farm income <= 10,860 OR net farm profit
< 7,840 (alternatives) and has no year limit. (2) 2025 Instructions for Form 2210, penalty worksheet line 1b: "Your payments are
applied in the order made first to any underpayment balance in an earlier column until that underpayment is fully paid"
(Example 3) - fix 4826d51b: a later payment pays off earlier underpayments, whose penalty days end on that payment's due date
(sc_00228 D: one 15,700 payment on 01/15/2026 against 1,500 a quarter -> 176, not 253). Line 7's 1,000 test subtracts WITHHOLDING
only (line 6 "Don't include estimated tax payments"), so 991 left to pay can still carry a penalty. Also pinned by
Hrb2025Sc00221-00230 (no other engine change): below the threshold QBI = the smaller of 20% x (net profit - 1/2 SE) and 20% x TI before
QBI (equal at 15,750 of wages for an 80,000 profit); an SSTB keeps the APPLICABLE PERCENTAGE of its QBI and wages inside 197,300-
247,300 and nothing above; a non-SSTB above the threshold is capped at the greater of 50% of W-2 wages or 25% + 2.5% of UBIA, phased
in over the range (Part III); hobby income on line 8j is receipts less cost of goods sold, other hobby costs nothing; a QJV gives each
spouse a Schedule SE with their own wage base and 400 floor; Form 8995 nets QBI across businesses, a negative total -> 0 and a
carryforward; MFS bars SLI and education credits outright, the EIC unless 32(d)(2), never the ODC; a separated spouse who pays the
home is head of household; 4 prior AOTC years or less than half-time leave the lifetime learning credit, no 1098-T leaves nothing.

**★ Each Schedule 3 credit has its OWN limit - not "the tax" (round-2 QA, sc_00201-00210, 2026-10-16; no engine change).** Form
8834 line 6 and Form 8911 line 9 = net regular tax MINUS the tentative minimum tax (Form 6251 line 9) - a 12,000 qualified-EV release
against tax 17,867 / TMT 8,294 is cut to 9,573 and the rest is LOST (8834 instructions, line 7); Form 8912 line 11 = regular tax PLUS
AMT minus earlier credits - no TMT floor - and the credit is also line-2b interest (§54A(f)); Form 8859 line 2 = Form 1040 line 18
less the worksheet's earlier credits (education, CTC, care, saver's ...), the rest carries indefinitely. Form 8911 personal part:
30% of cost, 1,000 per property, main home only (Schedule A line 17). Form 8815: line 7 = expenses / proceeds when smaller; MAGI
(line 9) is figured BEFORE the exclusion; 114,500 single or more stops. Form 8853 line 23 is the LARGER of 420 x days and the costs,
less line-24 reimbursements. Schedule SE: line 9 = 176,100 - W-2 box 3 (never box 1); lines 10 and 11 are rounded separately
(12,000 profit -> 1,374 + 321 = 1,695, not 1,696); the line-4c 400 floor is tested after line 4a is rounded (433 -> 400 -> taxed,
outstanding.md B8). Form 172: a Schedule C loss is an NOL only where AGI itself goes below zero (the standard deduction is added
back). A 1099-K is gross: returns go on Schedule C line 2 and unsold goods stay in ending inventory (Part III line 41). A low
Schedule C profit earns the EIC (earned income = net profit - half SE tax).

**★ Excess social security is WITHHOLDING for the estimated-tax penalty; a per-annuity-stream Simplified Method must not be blocked
(round-2 QA, sc_00197 / sc_00193, 2026-10-15).** (1) 2025 Instructions for Form 2210, line 6: "Include the taxes withheld shown on
... Form 1040 ... line 25d ... Also, Schedule 3 (Form 1040), line 11"; Part III: withheld tax "and excess social security or tier 1
RRTA" is deemed paid one-fourth on each due date; Form 2210-F line 12 says the same. computeForm2210 / computeForm2210F used line 25d
only, so a two-employer filer (48,000 withheld + 5,202 excess SS vs a 50,187 required payment) was charged a 102 penalty - fix
2521fa22 adds Schedule 3 line 11 (withholdingForForm2210) to the de-minimis stop, the annual safe harbor and the per-quarter
withholding. Never treat Schedule 3 line 11 as a refundable credit on Form 2210 line 3 (it is a payment). (2) When
pension-annuity-income carries annuityStreams[] the Simplified Method already runs PER ANNUITY (i1040 lines 5a/5b: "figure the
taxable part of each separately"), but the aggregate-path flags PENSION_SIMPLIFIED_METHOD_INPUTS_MISSING (non-overrideable) and
PENSION_BASIS_RECOVERY_PER_ANNUITY_LIMITATION still fired and 409'd the return - fix 5d7921b8 skips both when streams are present.
Related, pinned by Hrb2025Sc00191-00200 (no other engine change): with 3+ qualifying children Schedule 8812 Part II-B (payroll tax
withheld less EIC) applies when line 16b is 5,100 OR MORE; several rentals are one passive pool (Form 8582 line 10 income absorbs a
loss even with no allowance); excess SS counts each EMPLOYER (EIN, not W-2) at most 10,918.20 and one employer's over-collection is
not creditable; the 15%/20% line is TI 533,400 single and a short-term gain is still NII; a gain in provisional income makes 85
cents of benefits taxable per dollar while benefits phase in; the QBI limit is 20% of (TI before QBI - net capital gain);
Schedule 1-A takes the $100-per-$1,000 reduction from EACH of the tips and overtime parts, each floored at 0; a disability
pension before minimum retirement age is line 1h and EIC earned income, and nontaxable SSDI is Schedule R line 13a. **Open (owner,
no fields added):** the app's pension form has no per-annuity (stream) inputs; line-1h disability pay is not carried into EIC
earned income automatically (the EIC form's "other earned income" must be typed).

**★ The MFS rental special allowance needs living apart ALL year - the last-6-months answer is not enough (round-2 QA, sc_00185,
2026-10-15).** IRC §469(i)(5)(B) ("unless the taxpayer lives apart from his spouse at all times during the taxable year"); 2025
Instructions for Form 8582, Part II caution ("If your filing status is married filing separately and you lived with your spouse at
any time during the year, you are not eligible for the special allowances") and line 8 ($12,500 "if ... you and your spouse lived
apart at all times during the year"). The engine keyed the $12,500 / $50,000 MFS allowance on the filing-status answer
mfsOrHohLivedApartOrLegallySeparated, which is the LAST-6-MONTHS / legally-separated test (EIC, HOH, 1040 page-1 box), so an MFS
filer whose spouse moved out on 05/15 deducted a 10,000 rental loss. Fix e1a06bef reads the ENTIRE-year residence fact on the
Social Security form (livedApartFromSpouseEntireTaxYear - the same answer line 6d and the MFS IRA phase-out read); no answer -> $0.
Do not reuse the 6-month flag for any "at all times during the year" rule. Related, pinned by Hrb2025Sc00181-00190 (no other
engine change): the EIC separated-spouse rule has two prongs (apart July 1 - December 31, or a written separation agreement + not
in the same household at year end); the MFS care-credit exception (§21(e)(4)) also needs over half the home's cost, and those facts
make the filer HOH; a pension is in NIIT MAGI but not NII, MFS threshold 125,000 (MAGI exactly 125,000 -> 0); MFS cannot take the
Form 8815 exclusion (a QTP contribution is a qualified expense on a joint return); the MFS QDCG 20% line is 300,000; the MFS
Form 2210 110% line is 2024 AGI MORE than 75,000; a spouse who died during 2025 allows MFJ, one who died in 2024 with no child
leaves you single; a custodial parent who released the child on Form 8332 is still HOH, a dependent parent need not live with you.
**Open (owner, no fields added):** no spouse date-of-death input; no community-property (Form 8958) split for MFS.

**★ Taxable alimony under a pre-2019 instrument is IRA COMPENSATION (round-2 QA, sc_00171, 2026-10-15).** IRC §219(f)(1);
Pub. 590-A (2025) "Alimony and separate maintenance. For IRA purposes, compensation includes any taxable alimony ... only with
respect to divorce or separation instruments executed on or before December 31, 2018"; interest is NOT compensation.
computeIraCompensation read W-2 box 1 (+ combat pay) only, so a 7,000 contribution covered by 4,000 of wages + 3,000 of 2016-decree
alimony was flagged IRA_DEDUCTION_EXCEEDS_COMPENSATION and charged a 180 excise - fix 6d7a55ec adds Schedule 1 line 2a alimony
(dropped when the agreement date is after 12/31/2018; kept when the date is blank, as line 2a keeps it) to BOTH the line-20 cap
check and the Form 5329 Part III limit. Related, pinned by Hrb2025Sc00172-00180 (no other engine change): the Saver's credit
student test is any part of 5 calendar months and the credit is limited to tax (line 11); a 2024 Roth distribution is Form 8880
line 4; born 01/01/2008 is eligible, 01/02/2008 is not (this app ASKS the question, it does not derive it from the DOB); §30D MAGI
and MSRP both use "exceeds" (150,000 / 55,000 qualify; an SUV's cap is 80,000) and MAGI is AGI after an IRA deduction; the Roth
limit is 0 at MAGI 165,000 ("or more"), 200 at 164,999 (Worksheet 2-2 floor), 3,500 at 157,500; MFS joint-account interest goes
out as a nominee distribution (Schedule B required) and joint estimates are split as the spouses agree (i1040 line 26); MFS
Social Security lived together = 85% of the SMALLER of line 7 and benefits, lived apart ALL year = single figures + line 6d; the
MFS IRA range 0-10,000 applies when only the spouse is covered, and not after a year apart. **Open (owner, no fields added):**
the MFS "lived with your spouse" fact is read only from the Social Security form (an IRA-only or Roth-only MFS filer has nowhere
else to answer it).

**★ Form 8615 line 1 is the child's unearned income AFTER the early-withdrawal penalty (round-2 QA, sc_00151, 2026-10-17).**
2025 Instructions for Form 8615, Line 1: with no earned income, line 1 is the child's AGI (line 11b); the Child's Unearned
Income Worksheet line 2 is "earned income ... plus the amount of any penalty on early withdrawal of savings from the child's
Schedule 1 (Form 1040), line 18" (Example 2: 16,000 - 100 = 15,900). deriveChildUnearnedIncome subtracted wages only, so 2,750 of
interest with a 50 penalty (2,700, not MORE than 2,700) got Form 8615 and tax 142 instead of 136 - fix f6904003 subtracts the
Schedule 1 line 18 penalty. Related, pinned by Hrb2025Sc00151-00160 (no other engine change): interest and dividends are ADDED
for the 2,700 test; the Schedule 1-A Part V senior deduction is cut by 6% of MAGI over 75,000 and is NOT allowed on a separate
return (the MFS age box is still 1,600); Schedule 8812 line 9 and Form 8959 use 200,000 for a qualifying surviving spouse (the
joint 400,000 / 250,000 are for MFJ only; Form 8960 uses 250,000 for QSS); IRA MAGI (Pub. 590-A Worksheet 1-1) adds back the
student loan interest deduction, 50+ uses 8,000 and 80%, the $200 floor never applies at or above the top of the range and never
exceeds the contribution; excess social security is figured per spouse; Pub. 936 Table 1 pools the main and second home against
one 750,000 (375,000 MFS); Form 8959 Part II reduces the 200,000 by Medicare wages; Form 8960 line 5a is Form 1040 line 7a (the
loss after the 3,000 limit). **Open (owner, no fields added):** no medical-mileage input (the 21-cent miles are typed into the
medical total).

**★ An unemployment repayment entry is the SAME-YEAR repayment, netted on Schedule 1 line 7 - never line 24e (round-2 QA,
sc_00145, 2026-10-15).** 2025 i1040 line 7: "If you received an overpayment of unemployment compensation in 2025 and you repaid
any of it in 2025, subtract the amount you repaid ... check the box on line 7 and enter the amount you repaid". Line 24e is ONLY
the Trade Act of 1974 supplemental-benefit repayment; the Pub. 525 sentence sc_00322 (65d28bc2) used to move the entry there
("Deduct the repayment in the later year as an adjustment ... line 24e") is in Pub. 525's SUPPLEMENTAL unemployment benefits
paragraph. Ordinary (1099-G) benefits repaid in a LATER year: $3,000 or less not deductible; over $3,000 -> claim of right
(Schedule A line 16 or Schedule 3 line 13b, the existing section 1341 inputs). Fix eb116838 restored the line 7 netting; the
over-3,000 advisory now says a prior-year repayment does not belong in the entry; UI help text reworded (us-tax-ui abacdbd +
9128079). **Open (owner, no field added):** there is no separate "repaid benefits received in an EARLIER year" input.

**★ Form 8396 line 3 comes off Schedule A home mortgage interest BEFORE the standard-vs-itemized choice (round-2 QA, sc_00141,
2026-10-15).** Form 8396 line 3: "You must reduce your deduction for home mortgage interest on Schedule A (Form 1040) by the
amount on line 3." Line 3 depends only on interest and the certificate rate (the 2,000 cap applies only when the rate is MORE
than 20%), so buildScheduleA now subtracts it (fix 63b7840d). Reducing it afterwards let an unreduced total win the itemize
choice (12,000 x 20% + 5,000 SALT: 17,000 chosen, then cut to 14,600 < 15,750) and left an itemizer's line 15 / 16 on the
unreduced figure. Related, pinned by Hrb2025Sc00141-00150 (no other engine change): Form 8962 line 5 truncates (60,239 / 15,060
-> 399) and is 400 at exactly 4 x FPL, where Table 5 leaves line 28 blank (no repayment limit); 1099-INT/DIV/B box 4 all go to
line 25b (1099-B backup withholding is 24% of proceeds and refunded in full); age-55 separation exception 01 is decided by the
YEAR the filer reaches 55; Form 2210 line 7 stops only when LESS than 1,000, and 110% applies only when 2024 AGI is MORE than
150,000 (rate periods all 7% in the 2025 i2210); Form 8959 tests the total of all W-2 box 5 against 200,000 / 250,000 joint /
125,000 MFS while employers withhold per employee over 200,000; NIIT is on MAGI (tax-exempt interest excluded, alimony
included) and qualified dividends are NII; Schedule B is required for a nominee subtraction at any amount, and the 1,500 tests
on interest and on dividends are separate. **Open:** the engine takes Form 5329 exception 01 as entered (it does not check the
birth year).

**★ The no-child EIC age test: 25 is reached on the DAY BEFORE the 25th birthday, 65 ON the 65th (round-2 QA, sc_00135,
2026-10-16).** Pub. 596 (2025) Rule 11: "You meet the age test if you were born after December 31, 1960, and before January 2,
2001" (also 2025 i1040 EIC Step 4 question 2). `meetsChildlessEicAgeTest` uses the age on the day after the year end for the
25 test and the age on 12/31 for the under-65 test (fix c0e8205a; the engine used 12/31 for both, so a 01/01/2001 birthday lost
the 649 credit). Related, pinned by Hrb2025Sc00131-00140 (no engine change): Form 8615 line 10 is the parents' ACTUAL line 16 -
the Tax Table amount below 100,000 (99,000 MFJ -> 11,614, not the formula's 11,608) - while line 9 at 100,000+ uses the
worksheet; line 18 is the LARGER of 16 and 17; Form 8814 line 9 (qualified share = line 6 x 2b/4) goes to 1040 lines 3a/3b at
QDCG rates; the CTC phase-out excess rounds UP to the next 1,000 (440,001 -> 2,050); Form 2441's 6,000 limit is reduced by
excluded box 10 benefits (Part III line 29) and the care credit is taken BEFORE the CTC; §25D carries forward, §25C and the
§30D personal part do not; §30D uses the LESSER of 2025 and 2024 MAGI and "acquired" = binding contract + a payment.
**Open (no fields added):** the app has no Form 8615 age-18/student "earned income more than half of support" input (the filer
answers the kiddie question) and no §25D utility-subsidy input (cost is typed net of a nontaxable rebate).

**★ Amortizable bond premium over a bond's interest is deductible only up to the bond's EARLIER interest (round-2 QA,
sc_00122, 2026-10-15).** Reg. §1.171-2(a)(4)(i); Pub. 550 (2025) How To Report Amortization: the excess of the premium
over the period's qualified stated interest goes to Schedule A line 16, "limited to the amount by which your total
interest inclusions on the bond in prior accrual periods is more than your total bond premium deductions on the bond in
prior periods"; the rest carries forward (and is deducted when the bond is disposed of). **Open (no field added - owner
sign-off needed):** the app has no input for a bond's prior interest inclusions / prior premium deductions / carryforward,
so it carries EVERY 1099-INT box 11 (and manual) excess to line 16 - right when the bond has history (sc_00122 A, pinned),
wrong for a bond bought this year (C: cap 0; not pinned). BOND_PREMIUM_EXCEEDS_INTEREST now states the cap (a552ad63).
Related advisory wording (a552ad63): the §691(c) deduction is the recipient's SHARE of the estate tax caused by the IRD
(Pub. 559: IRD included this year / total IRD x (estate tax with - without the IRD)); the app still takes it as typed.

**★ A donated car's §170(f)(12) cap is $500 when the charity sells it for $500 or less, and box 5a/5b means no cap
(round-2 QA, sc_00114, 2026-10-15).** Pub. 526 (2025) Cars, Boats, and Airplanes: sold for more than $500 -> the smaller
of gross proceeds or FMV; "Deduction $500 or less. If the qualified organization sells the vehicle for $500 or less and
Exceptions 1 and 2 don't apply, you can deduct the smaller of $500, or the vehicle's FMV"; Exception 1 (significant
intervening use / material improvement, 1098-C box 5a) and Exception 2 (needy individual, box 5b) -> FMV. buildScheduleA
caps the vehicle at max(box 4c, 500) when sold (fix 72398e81; was the 450 sale price), and a 1098-C with box 5a/5b sets no
cap; the sc_00300 CHARITABLE_VEHICLE_1098C_REQUIRED block now fires only when NO 1098-C is on file (it fired on a box-5a
1098-C, which has no box 4c). **A §1033 involuntary conversion is manual capital detail** (fix a1c02edb): a return
whose only capital item is a condemnation award / insurance proceeds (no 1099-B exists) no longer hits the blocking
CAPITAL_STATEMENT_UPLOAD_REQUIRED. **Open (no fields added):** the casualty guided inputs apply only the $100 + 10%
regime - a qualified disaster's net loss ($500, no 10%, Form 4684 window: declared 01/01/2020-09/02/2025, incident
ended by 08/03/2025) is typed; Form 4684 Section B line 38b is typed (no "profit motive" / "prospect of recovery"
inputs); the 30%/50% charitable buckets are the filer's choice (no holding-period check from Form 8283 dates); the §1341
deduction-vs-credit comparison is not computed (the filer enters the winning method; both are blocked).

**★ The MFS SALT cap phase-down is figured on the full $40,000 and halved AFTERWARDS (round-2 QA, sc_00104,
2026-10-15).** 2025 Schedule A State and Local Tax Deduction Worksheet: line 1 $40,000; line 5 $500,000 ($250,000
MFS); line 7 = 30% of line 11b over line 5; line 9 = the larger of (line 1 - line 7) or $10,000; line 10 = the smaller
of line 9 (HALF of line 9 if MFS) or line 5d. So an MFS cap falls 15 cents per dollar over $250,000 to a $5,000 floor
at $350,000 - never 30% off the already-halved $20,000 (MAGI 300,000: 12,500, not 5,000). `saltLimitForStatusAndMagi`
follows the worksheet (fix e9264a55). Non-MFS unchanged. Related, all pinned by Hrb2025Sc00101-00103: one $40,000 cap
per JOINT return; "more than $500,000" means line 11b (after Schedule 1 adjustments), so exactly 500,000 is not
reduced; the reduction cuts the cap, never the taxes (line 10 still takes the smaller of the cap and 5d).
**Open (no fields added):** the app has one mortgage-points entry (in full OR amortized) - it cannot hold a cash-out
refinance's improvement share plus the spread rest, or a paid-off loan's leftover points (released in full unless the
same lender refinances - Pub. 936); the filer types the year's figure. The optional sales-tax table amount and the real-estate-tax day split are likewise typed
results, not computed from the tables / dates.

**★ An employer contribution to an Archer MSA leaves no deduction for the filer's own (round-2 QA, sc_00091,
2026-10-15).** IRC §220(b)(5); 2025 Instructions for Form 8853: "If an employer made contributions to your Archer MSA,
you aren't entitled to a deduction" - Part I (1): complete lines 1-2, skip 3-4, enter -0- on line 5. Any line 1
amount now forces Form 8853 line 5 (Schedule 1 line 23) to 0; the filer's line-2 money is then an excess contribution
(Form 5329 Part VI, not computed - the app has no year-end MSA value). The line-3 limitation stays month-by-month
(eligible on the 1st) / 12. **Open:** line 1 is not auto-read from W-2 box 12 code R (HSA line 9 is, from code W).

**★ A real estate professional's rental is nonpassive only if she materially participates in IT (round-2 QA,
sc_00075, 2026-10-15).** §469(c)(7)(A) only switches off §469(c)(2)'s per-se-passive rule; the rental is then tested
under §469(c)(1) (Pub. 925: "rental real estate activities in which you materially participated aren't passive").
The engine treats an explicit "No" on the property's `materialParticipation` as passive (with the active-participation
allowance); unanswered keeps the old professional-means-nonpassive behaviour. **Open:** the UI control is Yes-only, so
"No" cannot be sent from the form; the same control makes a NON-professional's rental nonpassive when ticked, which
§469(c)(2) forbids for long-term rentals; and the rental form has no related-buyer question for §469(g)(1)(B).

**★ Four more IRS limits the engine now applies (round-2 QA, sc_00062/64/66/68, 2026-10-15).**
(1) **QCD age gate (§408(d)(8)(B)(ii)):** a QCD must be made on or after the owner reaches 70½ (70th birthday + 6
months). The payment date is not captured, so the QCD entries are dropped (and QCD_OWNER_UNDER_AGE_70_HALF_* raised)
only when the owner cannot have reached 70½ at any time in the tax year. (2) **Form 8582 line placement:** a rental
WITHOUT active participation prints on line 2 ("All other passive activities"), not line 1 - line 1 sends a loss to
the Part II allowance by the form's own flow. (3) **Automatic 15% royalty depletion** is capped at the property's
income before depletion (§613(a), 100% for oil and gas); a typed depletion figure is trusted. (4) **§280A(e) before
§280A(c)(5):** rental expenses are first limited to the fair-rental-days share; a below-market rental with no
fair-rental days has a share of 0 - the whole rent is income, nothing is deductible and nothing carries. Capping the
full expenses at the rent (net 0) skips that step and understates income by the whole rent.
**Open:** the rental intake takes the RENTAL share of each expense (no day split), and has no lease-bonus field.

**★ Three IRS limits the engine now applies itself (round-2 QA, sc_00044/00055/00060, 2026-10-14).**
(1) **Simplified Method:** the monthly exclusion is the ORIGINAL cost (worksheet line 2) ÷ the table number; a
prior-year tax-free recovery only CAPS the year's exclusion at the cost not yet recovered (lines 6-8) - it never
shrinks the monthly amount (both the per-person and the per-stream path). (2) **Spousal IRA:** on a joint return
the 6% §4973 excess-contribution test uses the couple's combined compensation less the OTHER spouse's traditional +
Roth contributions (§219(c)) - the same rule the line-20 deduction cap already used; per-person compensation charged
a non-earning spouse 420 on a valid 7,000 spousal IRA. (3) **Form 5329 exception 09** (first home) stops at $10,000
whatever amount is entered (§72(t)(8)(B)); 08 (higher education) has no cap. When a field could hold either the raw
fact or the post-limit figure, apply the statutory limit in compute rather than trusting the entry.

**★ A pre-fill from an uploaded document fills BLANKS only, and says what it did.** Personal > Last year
1040 writes into forms the user owns, so it never overwrites a value already entered; re-applying is
therefore idempotent and safe, and the summary lists both what it filled and what it kept. Pre-fill only
facts the source document actually states for THIS year's return: date of birth is not on a 1040,
IP PINs are reissued yearly, digital-asset and campaign answers are about this year, and CTC/ODC
eligibility changes with age - leave those to the user rather than carrying last year's answer forward.

**★ Azure's `prebuilt-tax.us.1040` folds the unit into `valueAddress.streetAddress`** ("100 MAIN ST Apt. 4")
although the form prints a separate Apt. box - build the street from `houseNumber` + `road`. And on photos
the filing-status checkbox is often unread: a spouse on the "If joint return" name line implies MFJ.




**★ `localhost` in a dev proxy target is a ~200ms tax and a flake source — use `127.0.0.1`.** The backend binds IPv4-only (`127.0.0.1:8080`) and the Angular dev server IPv6-only (`[::1]:4200`), while `localhost` resolves **IPv6 first**. A proxy target of `http://localhost:8080` therefore attempts `::1:8080`, finds nothing, and falls back — measured at **2.126s vs 0.048s of connect time over 10 calls (~45x)**, and **451 `http proxy error` entries in one dev-server log against zero after the fix**. ★ This is the mechanism behind the recurring e2e flake class: `connect ETIMEDOUT ::1:4200`, `page.evaluate: TypeError: Failed to fetch`, and bare test timeouts, all passing on retry, all with 2–10x inflated durations. Proxy config is read at **startup**, so the dev server must be restarted.

**★ "Transient network" is a classification, not an explanation.** That flake class appeared in four consecutive full regressions and was correctly triaged each time — retry passed, a real defect sat elsewhere, move on. The literal address `::1:4200` was in the error text every single time and went unread. When the same non-deterministic signature recurs across runs, stop re-triaging it and go read what it is naming; a recurring flake with a stable signature has a cause.

**★ Splitting on text the document itself prints is an ORDER rule, and order is a property of the render, not of the document.** Form 1042-S prints boxes 3a and 4a on one line, so box 3a's value was read as everything before the "4a" the form prints between them. The two renders of one fixture return that strip as **`"10 4a Exemption code 64"` (PDF)** and **`"10 64 4a Exemption code"` (PNG)**, which split to `10 / 64` and `1064 / nothing`. The same trap caught label-to-value pairing a day earlier. Bound by a POSITION derived from the document's own printed marks - a neighbouring label - and treat `numericOnly`-style "first match wins" as an order rule too. ★ **And when a test contradicts your explanation of a bug, the explanation is what is wrong.** My first test fed the row's five measured glyphs to `orderForReading` and got the same order from both renders, because line grouping runs across the whole page: the divergence was real but not reproducible from the row alone. Log the actual value out of the running system before writing the comment, the commit message or the test.

**★ ...but "order is a render artifact" does NOT cover a row number in a structured table — I over-applied it the same day I wrote it.** Form 1095-A Part III is a thirteen-row printed table whose month names are **pre-printed on the blank form**, so a row's identity is its row number and the label is an echo of it. Azure returned **fourteen** rows on one render, losing the "July" label and pairing every later label with the next row's amounts; keying on the label — straight off the rule above — **shifted six months and lost the annual totals**. The distinction: reading order of glyphs on a page is a render artifact; the row index of a grid the model extracted from a fixed printed table is that table's own row number. Ask which one you have before choosing a key, use the other as a cross-check that warns on disagreement, and settle it against the fixture's AcroForm rather than against whichever rule you reached for last.

**★ A fixture where every box is ticked cannot tell a correct read from an over-read — a perfect score against it is not evidence.** Form 1095-B's Part IV has a 6×13 checkbox grid and all **78** boxes are ticked in the fixture, so **133/133 against its AcroForm said nothing** about whether an UNticked box reads as false, or about what happens when a column header is lost. Both were broken: an absent header made nearest-column file that month's mark under its **neighbour**, so August reported two months' coverage the form does not claim. Found only by writing synthetic cases on the measured geometry. **Ask what the fixture cannot distinguish before trusting the score** — uniform data (all-true, all-same, all-present) is the tell, and the answer is a unit test with the variation the fixture lacks, not another fixture run. Corollary: when a guard exists on one axis of a two-axis attribution, it probably belongs on the other too.

**★ Extraction transcribes a form; it does not correct it — so a field named for a BOX must hold what is printed in that box.** Azure parses an address semantically. On Form 1095-C it reported city "Milwaukee" and state "MI" while the form's **City** box (line 11) held `US 53704`, its **State** box (12) held `Milwaukee`, and its **Country/ZIP** box (13) held `MI`. Mapping `Recipient.Address.City` → `employerCity` is therefore wrong in principle and happens to be right only while the data is sane — which is exactly why the fixtures scramble it. **Ask what a UI field is NAMED for**: named for a box → read the box, by geometry if the model only offers a semantic parse; named for a concept → the parse is fine. The same test settles whether to "fix" odd-looking input: if the form says it, transcribe it and let the user see what their statement actually shows. Corollary: a model's structured output is a convenience, not an authority — it also merged two printed boxes into one field on the same form (`"22910
12770"`), which geometry does not.

**★ A search that finds nothing is a fact about the SEARCH, not about the thing searched.** I grepped Form 1095-C's Part III page for printed row numbers with a pattern that required the number and the name on one line — the layout Form 1095-B uses. It found nothing, and I wrote "its rows are UNNUMBERED" into a commit message, `history.md`, `context.md` and the plan for the next task. **The rows are numbered 18 to 30**; each number is simply its own glyph. The inference would have bought a whole row-discovery mechanism nobody needed. Before recording an absence as a property, weaken the pattern until it matches something and see what comes back, or count what IS there (235 filled fields had to be described by *some* structure). Same family as **an absent artifact is not a zero**. **★ Corollary for OCR work: probe the model the extraction actually runs.** `dump_marks`/`words` use `prebuilt-document`; a form configured for `prebuilt-tax.us.*` gets different OCR for the same page, so a glyph present in one is no evidence about the other. I diagnosed a reader bug from the wrong model's output; instrumenting the real reader settled it in one run.

**★ Read the audit log before theorising about an "it does not work" report.** A report that `1095-p3-c.png` would not extract had me checking UI bindings, directive code and component row caps. One log query ended it: `AUDIT formId=1095-c fileSize=175412` — and 175412 bytes is `1095-b-p3.png`, not `1095-c-p3.png`. **The wrong file had been uploaded into the right form.** The log records formId, size and content type on every extract; start there, and match the size against the fixtures.

**★ Silent misattribution is worse than failure, and a green sweep over real fixtures can hide the bug that causes it.** That wrong-form upload did not fail — it returned **36 plausible values in the wrong rows** (1095-B numbers its continuation rows 29-40, 1095-C's Part III reads 18-30, so two rows overlapped) with nothing in the response saying so. When a reader attributes input to slots, ask what happens when the input is from somewhere else entirely, and refuse rather than guess. **Then test the guard as a pure function:** my matcher shipped past a live sweep of 45 forms with a broken character class — `[\\w-]` is the class {backslash, w, hyphen}, not word characters — because the expected value was always found first and the faulty branch never ran. Seven unit tests found it immediately. **Corollary for any code-set matcher: check for prefixes.** Seventeen of these 56 form codes are prefixes of others ("Form 1098" of "Form 1098-C", "Form W-2" of "Form W-2G"), and a trailing `\b` matches all of them because the boundary between "8" and "-" is a word boundary.

**★ A form uploaded page by page must have each page report only what that page carries — anything else overwrites a sibling page.** Form 1095-C's page 3 prints no VOID or CORRECTED box (they are on page 1) yet reported both as `false`, so uploading page 3 into a statement that already held page 1 **cleared** them; the reverse cleared the self-insured flag. Azure makes the distinction decidable: a box it found and read as empty carries `":unselected:"` **and a bounding region**, while a box it never located has neither — so absent-from-page maps to null and found-but-empty still maps to false. This is the codebase's own null/zero semantic (null = does not apply, false = applies and is false) applied per page. **Check it on every multi-page statement**, and more generally whenever two inputs write the same record: ask what the second one says about fields it knows nothing about.

**★ Taking the FIRST match on a page is only safe when the label occurs once — and "once" is a property of the page, not of the form.** Form 1095-C prints month column headers in Part II as well as Part III. Every fixture carried one Part per page, so `findLabelIn(..., 0)` was right every time — until the whole form arrived scanned as ONE image, when the first `"Jan"` became Part II's and Part III's grid columns landed 400px from its marks. **62 of 169 checkboxes were lost.** Scope a section's search to below its own heading, and when you write a first-match lookup, ask what happens if the page holds two of that thing. Note what saved this from being worse: the column guard discarded marks it could not place rather than filing them under the wrong month — a guard that fails safe turns silent corruption into silent loss, which is better and still not good.

**★ A specialised model is not automatically better than the generic one — compare them on the same page.** `prebuilt-tax.us.1095C` read four ticked checkboxes as `unselected` at confidence **0.364** while `prebuilt-document` read the same four correctly, on the same image. That is independent of the separate problem that our configs named the tax models' fields wrongly. Everything a named model gave for Form 1095-C — five scalars and three checkboxes — was on the page to be measured, so the form moved to `prebuilt-document` and all 169 boxes now read right. **When a model's output looks wrong, try the other model before building around it**, and when a fix spans several pages of one form, check that the merged page equals the union of its pages field for field — that is a stronger statement than any single page's score.

**★ A fixture whose every box holds ONE word cannot test a multi-word box — build the fixture that stresses the assumption.** Forms 1095-B and 1095-C print their name in three boxes; we read one combined value and split it on the assumption that the surname is its last word. Both forms scored full marks against their AcroForm (133/133, 85/85) while the rule was broken, because every shipped box holds a single word. Set the widgets to `"Mary Jo" / "K" / "Van Der Berg"` and it returns **first="Mary Jo K Van Der", last="Berg"**, with the middle initial lost entirely. Ten minutes with PyMuPDF — set the three widgets, call `w.update()` to regenerate the appearance streams — turns a judgement call into a measurement. Sibling of the all-ticked-checkbox rule above: ask what the shipped data never exercises.

**★ Measure a margin before declining to act on it — my estimate was out by 2x and nearly cost the fix.** I read the gap between those name boxes off the single-word fixtures, got ~2x the word spacing, judged that too tight against the 4–8x of comparable rules, and recommended leaving it. Measured properly on multi-word names it is **5x on the tighter form and 34x on the other**. The estimate was pessimistic because single-word boxes happen to sit closer together. When a margin is the reason for not doing something, that margin is the thing to measure. Corollary from the same exercise: **physically impossible test data reads exactly like a bug** — I dropped a word from the middle of "Van Der Berg", leaving a 0.30in hole that genuinely IS a box boundary, and spent a cycle suspecting the code.

**★ One printed box can hold TWO facts, and a config that stores it as one field loses the
other silently.** The IRS prints a single box captioned "State/Payer's state no." - box 17 on
Form 1099-MISC, box 6 on 1099-NEC, box 15 on 1099-R. Azure carries one field per printed box, so
both facts arrive in one string (`"$ NY\n76565"`), and we stored all of it as `payerStateId`,
leaving the screens' state input - 1099-NEC captions it "State (Box 6)" - permanently blank.
Forms 1099-INT, -DIV, -G and -K give the state its OWN box, and their configs differ for that
reason; I nearly read the difference as a copy-and-paste shift in three configs. **When one
config disagrees with its siblings, check the FORMS before 'fixing' the odd one out.** Corollary:
**fixing one fault is what makes the next one legible** - with the state finally split out, the
neighbour was visible as `stateTaxWithheldAmount = 76565`, the state's own ID reported as tax
withheld, because Azure had assigned the same bundled string to the number-typed box beside it.

**★ A fallback that works hides the defect it is covering.** The 1099-INT config asked for
`Payer.RTN`; the model returns `Payer.Rtn`. The key never matched, so someone wrote an OCR regex
on the printed caption and a comment asserting the model "doesn't expose Payer's RTN as a
structured field" - it does, `"786543"` at confidence 0.799 on the fixture already in the repo.
No data was lost, so nothing looked wrong; the weaker route was simply the only route. **Treat a
hand-written recovery path as a claim about the upstream that needs checking**, and when a
comment explains WHY a workaround exists, verify the why - this is the third prose claim in this
file that was false. Same family as *a comment claiming a refactor is not the refactor*.

**★ Count the keys, then ask whether anything FILLS the field - the raw count is noise.** The
named-model audit opened at 325 of 818 configured keys absent from the schemas, which reads like
a catastrophe and was not one: the configs deliberately list several Azure spellings per target
(`Payer.TIN` AND `Payer.IdNumber`), arrays are flattened into the top level with `putIfAbsent`,
`concatFields` consumes keys too, and targets get written by Java through loop variables no
literal grep can see. Asking the one question that matters - *is this target filled by any path
at all?* - took 325 keys to 18 targets to **2 real findings**. **Model every path that can fill
the field before reporting a gap**, and state the metric you are actually measuring: three of my
own passes each inflated the number, the third because it did not parse `concatFields`.
Corollary: this kind of audit compares a key NAME against a schema and **cannot** see a live key
mapped to the WRONG target - a name audit and a meaning audit are different jobs.

**★ Mutation-test an AUDIT before believing a clean result from it.** The box-number meaning
check came back with 219 pairs and zero real mismatches, which is either good news or a check
with no power, and nothing in the output distinguishes the two. Injecting three deliberate box
swaps (1099-INT 1<->2, 1099-MISC 1<->2, 1099-DIV 1a<->3) caught all **six** sides and took the
flag count 13 -> 19; then the config went back byte-identical. **A negative result is only worth
something once the positive control has fired** - the same discipline as mutating a rule to see
the explanation change, applied to the measuring instrument rather than the code. Corollary: when
an audit's own regex produces the flags, expect most of them to be ITS faults, not the code's -
5 of 6 type flags here were `^qualified` and `Income$` matching legitimate amounts, and 10 of 13
box flags were scratch keys. Triage before reporting.

**★ A number and a checkbox can be offered for the SAME printed box - take the one the box
actually is.** Form 1099-LTC box 4 is a checkbox ("4 Qualified contract"), and Azure returns
both `Box4` (a boolean selection mark) and `Box4Amount` (a number) for it. The config mapped the
NUMBER onto the UI's boolean, and because the generic field pass runs before the form's
post-process, that number would have beaten the `putIfAbsent` filling the flag from the selection
mark. It never did, because `Box4Amount` reads empty at confidence 0.953 - **a populated ZERO
would have unchecked a box the form has ticked.** Compare the model's field TYPE against what the
target's name claims, and when a post-process holds the authoritative value, let it `put` rather
than `putIfAbsent` - deferring to whatever ran first is only safe if you know what that was.

**★ "Reserved" on this year's form can mean the concept MOVED TO ANOTHER FORM.** Form
1099-MISC box 14 carries a number and no caption on Rev. 4-2025 - no fillable widget either,
while every other money box has one, and "golden parachute" appears nowhere in the document. The
concept relocated to **Form 1099-NEC box 3**. Our config still maps 1099-MISC `Box14` to it,
which is harmless (empty at confidence 0.428 on a 2025 form, and CORRECT on a pre-2025 upload
someone may still file) - so it stays. **Before calling a cross-form mapping stale, find where
the concept went**, and check the AcroForm widgets and tooltips, not just the page text: three
independent signals settled this where the text alone was ambiguous. Same family as
*"reserved for future use" can mean RELOCATED, not repealed*, now observed across forms rather
than across lines of one form. **And it is the concrete cost of having no form-YEAR check.**

**★ A render difference is usually an ORDER difference, and an order-dependent reader turns it
into loss AND misattribution.** I reported that "1099-da.pdf loses the whole state section".
Both renders contain every printed value; Azure just emits them in different orders - the PNG
interleaves caption and values, the PDF groups all three captions then all six values. A line
walk that takes "the lines after the caption" therefore read the next two CAPTIONS, hit its own
`"15 state"` stop-word and reported success having read nothing - while the NEXT box's walk
collected those six values and wrote a state IDENTIFICATION NUMBER into a tax-withheld field.
**The reader's own stop-word guard is what silently zeroed it**, and the guard is correct; it is
the order-dependence around it that is not. So: never conclude "this render has worse recall"
before diffing the OCR CONTENT of both - and when a reader collects N values after an anchor,
ask what it does when the anchor is immediately followed by its own stop-word. Extends
*OCR reading order is not a property of the form*, which warned of a SWAP; this is the same
cause producing a silent shift into the wrong box.

**★ Diff BOTH renders of a fixture FIELD BY FIELD - it finds faults no single render can
show.** Form W-2G prints "City or town" twice, and its config had ONE fan-out slot where the
four sibling address captions all have two, so the winner's city was read and DISCARDED.
Scarborough was sitting in the PDF's key-value pairs the whole time. Nothing about either render
alone looks wrong - only `comm -13` over the two field sets shows it, and the same diff then
drove every remaining gap to a named cause (a merged caption, three unreported selection marks)
instead of a vague "the PDF is worse". A field-set diff of both renders belongs in the routine
check for every fixture.

**★ A mutation that reddens NOTHING is telling you your explanation is wrong, not that your
code is safe.** Having just written the rule about mutation-testing an audit, I mutated the new
geometric readers against their own tests. One mutation - giving the column the 2% left slack
used elsewhere - reddened nothing, and the test carried a comment asserting that *any* left slack
would swallow the neighbouring column's amount. **The comment was false**: the margin is 0.410in
(3.9 caption heights) against a 2% slack of 0.170in, and it takes 5% to break it. The code was
fine; the stated REASON for it was not. Treat a no-op mutation as a finding about the
justification, re-measure, and write the measurement into the comment - a fourth prose claim in
this file corrected by checking it.

**★ A matching KEY SET is not a matching extraction - diff the VALUES.** Having closed every
missing field on Form 1099-DA, both renders reported 58 fields and I nearly called it done. The
value-level diff found three filer-block fields where the PDF is wrong -
`filer_country = "+1 545
1234
US"`, `filer_zip = "KOKO
12345"` (box 1b's asset name bled into
the ZIP) - none of which a count or a key list can show. **Count agreement is the weakest form of
agreement**: it says the same slots were filled, not that they hold the same thing, and it is the
form of agreement a bled or merged value preserves. Sibling of *don't diff a human-readable
listing*, where the opposite error cost me a false "byte-identical" claim - both say the same
thing, that the comparison must be over the DATA.

**★ Ask where the box is printed relative to its caption before pairing them.** Form 1099-DA's
boxes 2, 5 and 9 have captions that WRAP over two to four lines with the checkbox UNDERNEATH,
while `readSelectionMarks` pairs a mark with a label on the same ROW - so three ticked boxes read
empty even though Azure reported all 16 of the form's marks on both renders, matching the
AcroForm one for one, including the one unselected. **The data was never missing; only the
pairing was.** When a checkbox comes back empty, dump the marks and the captions with their
geometry and look at the layout before assuming poor recall - and validate the pairing rule
against the fixture's AcroForm BEFORE writing the reader, which here turned a design question
into a table lookup. Note too what made it safe: box 6 prints three marks on box 5's own rows,
so the caption's horizontal span, not nearest-below, is what keeps them apart.

**★ When one party's block is wrong and the OTHER party's identical block is right, the labels
are fine - it is the value REGION.** Form 1099-DA's FILER telephone, country and ZIP came back as
`"12 555"`, `"+1 545 1234 US"` and `"KOKO 12345"` on the PDF, while the RECIPIENT's three boxes -
same captions, same config fan-out, same page - were correct on both renders. That asymmetry is
the diagnosis: nothing about label matching or config can explain it, so the fault is which words
Azure paired with the label. Read the cell from its own geometry instead, and note what the
region got wrong that geometry gets right: box 1b's "KOKO" is both to the RIGHT of the ZIP
caption and ABOVE its value band, so a two-sided cell test excludes it twice over. **Look for the
working twin before theorising** - it localises the fault in one observation.

**Personal forms: one list of required fields (2026-10-13).** Which fields a Personal form requires lives in
`us-tax-ui/src/app/utils/personal-requirements.ts` only. Both the form's save message ("Saved. Some required fields
are not completed yet: …") and Get started > Your checklist read it, so they cannot disagree. When a form gains or
drops a required field, change that file (and the template's `required` highlighting) together. A new compute flag
gets a Fix link only once it is added to `us-tax-ui/src/app/data/flag-form-links.ts`. A flag about one dependent must also carry `withDependentId(dep.id())` (and one about a particular statement `withFormId(...)`), or the checklist cannot tell which tab to open.

**1099-B term with no box 2 (2026-10-14).** `derive1099BBox` takes the term from, in order: an explicit Form 8949
category, the box 2 short/long flags, a date acquired of "INHERITED" (long-term, IRC 1223(9)), then the dates (more than
one year = long-term). A sale whose term cannot be derived is dropped from Schedule D, so any new text value allowed in
column (b) ("VARIOUS" etc.) needs a rule here too.

**Self-employed LTC premiums are age-limited per person (2026-10-15, sc_00215).** `seLongTermCarePremiums` on the
se-deductions form counts toward Schedule 1 line 17 (Form 7206 line 2) only up to the §213(d)(10) band for the owner's
age at year end — `ReferenceData.ltcPremiumAgeLimit` (2025: 480 / 900 / 1,800 / 4,810 / 6,020). The Pub. 974 PTC second
pass must use the same eligible amount (`SeDeductionsResult.eligibleLtc`), never the raw field. Reuse the helper when the
Schedule A medical LTC gap (outstanding.md) is closed.

**Form 4562 line 12 is the ALLOWED §179, not the elected one (2026-10-15, sc_00219).** `computeScheduleC` applies the
§179(b) aggregate limit (dollar cap, phase-out, business income incl. wages) and records {requested, allowed} in the
`SECTION_179_LIMIT` ThreadLocal (reset at the start of every computeScheduleC). `buildForm4562List` must read it: line 12 =
this form's proportional share of the allowed amount, line 13 = the rest. Any new path that builds Form 4562 has to do
the same, or the form disagrees with Schedule C line 13.

**Round-2 SE scenarios: pick amounts where Schedule SE rounding conventions agree.** Rounding every line (our engine,
H&R Block) and carrying cents can differ by 1 on line 12 / 13 (e.g. 4a 184,700 → 27,192 vs 27,193). New runs use amounts
where both give the same SE tax and half; a kept round-1 run grades the per-line figure H&R Block printed.

**Rental expenses entered as whole-year totals are split ONCE, up front (2026-10-16, outstanding.md A1).**
`applyRentalAnnualTotalsSplit` rewrites the rental-income forms' property lists to the rental share and adds the
personal real estate taxes / qualifying mortgage interest to `standard-deductions-taxpayer` before `prepare()` captures
either form. Every later reader therefore sees rental-share figures - never split again downstream, and never read
`expensesEnteredAs` anywhere else. A new rental expense field must be added to `RENTAL_SPLIT_FIELDS` unless it is a
direct rental expense (Worksheet 5-1 line 2d), or a whole-year total will be deducted in full.

**Rental material participation is not a universal "nonpassive" switch (2026-10-16, outstanding.md A5).** For a
long-term rental (`rentalActivityType` blank / LONG_TERM) only a real estate professional's participation can make it
nonpassive (469(c)(2)). Only the Pub. 925 exception types make a non-professional's Yes count - and those properties,
when passive, never get the $25,000 allowance (they go to the "other passive" pool). Any new path that classifies a
rental as nonpassive must follow the same three-way rule (royalty / exception / long-term).

**A §465 carryover belongs to one activity (2026-10-16, outstanding.md A49).** A prior-year at-risk loss is released
only against the room of the activity that produced it (§465(a)(2)) - never pooled across properties. Any new
carryover input for an at-risk activity goes on the activity, not on the parent form; a total that cannot be matched
to an activity is carried forward with a note, not released against whichever activity has room.

**A held rate table is checked against the published table, row by row (2026-10-19, OPEN_QUESTIONS B35).** Six of
the eight MACRS mid-quarter rows in the engine were wrong - none of the six totalled 100% - and had been used live. Any percentage
table copied into the code (MACRS, AMT, locality limits) gets a unit test that compares it to the IRS PDF figures or
to a generator that reproduces them; a depreciation row must total exactly 100%.

**A statement belongs to the return of the person it was issued to (2026-10-25, D-1a-1 and root causes 1-2).** Every
compute read of a household statement list goes through `ownEntries()` / `ReturnStatementOwners`: an entry whose person
field is another household member's SSN is left off this return (income AND withholding together). A blank person field
stays on the primary / MFS-head return (advisory) and is dropped on the MFS-spouse leg and a dependent's own return. A
new statement type gets its person field in `ReturnStatementOwners.OWNER_FIELD`, `StatementSsnRules` and the UI
`newEntrySeed`; a new statement read in TaxReturnComputeService uses `ownEntries`, never `listEntriesWithData` (except a
consumer that legitimately reads another person's statements, like Form 8814, with a comment saying so).

**A box the screen says is "applied automatically" must be read by compute (2026-10-25, root cause 3).** 1099-G box 1,
W-2G box 1/7, 1099-C box 2, K-1 guaranteed payments, K-1 net section 1231 and K-1 QBI were saved and never read. When a
statement amount and a typed amount describe the same line, say which wins (additive, floor, or typed-wins) in the code
comment and in the screen's help text, and raise an advisory when they disagree.

**A blank date or amount never means "the most generous answer" (2026-10-25, D-2555-1/2).** A missing qualifying period or
wage figure excludes nothing and blocks; it is not 365 days or "no limit".

**One form, one limit, across the people on a joint return (2026-10-26, D-4797-2, D-w-2-1, D-4562-11).** A joint return files
ONE Form 4797, one Form 4562 Part I and one Schedule 3 line 11 per person: section 1231 nets across both spouses before
anything is called capital or ordinary; a K-1 section 179 shares the dollar and business-income limits with Schedule C / F;
social security tax and tier 1 RRTA tax share one $10,918.20 limit per person. Never compute a limit twice in parallel.

**An amount a schedule does not take is not printed as if it were (2026-10-26, D-4562-10, D-6781-6).** A depreciation
asset that matches no business, farm or property, or a Form 6781 row of another person, is left off the attached form
with an advisory - the attached form and the tax must agree.

