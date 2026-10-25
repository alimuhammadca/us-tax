# Schedule C (Form 1040) — Profit or Loss From Business (Sole Proprietorship)

Tax year 2025. What the IRS requires. How the app does it: `C:\us-tax\new_knowledge\forms\schedule-c.md`. Picture:
`C:\us-tax\new_flowcharts\forms\schedule-c.md`. Related forms: `forms\8829.md` (actual-expense home office, line 30),
`forms\4562.md` (depreciation and section 179, line 13). The 2025 form text is from `C:\us-tax\docs\IRS-Forms\f1040sc.pdf`
(cited `f1040sc.pdf p. N`); everything else is from `C:\us-tax\docs\books\`.

---

## 1. At a glance

Schedule C reports the income and expenses of a business that one person runs as a **sole proprietor** (including a
single-member LLC that has not elected to be a corporation). One Schedule C is filed **per business**. Its result,
line 31, is the business's net profit or loss; it goes to **Schedule 1 line 3** (and from there into total income and
AGI), to **Schedule SE line 2** (self-employment tax), to **Form 8995 / 8995-A** (qualified business income
deduction) and to **Form 461** (excess business loss). A loss on line 31 is first limited by the **at-risk rules**
(Form 6198) and, when the owner did not materially participate (line G "No"), by the **passive activity rules**
(Form 8582).

```text
Part I   line 3  = line 1 gross receipts − line 2 returns and allowances
         line 5  = line 3 − line 4 cost of goods sold (Part III line 42)
         line 7  = line 5 + line 6 other income                       (gross income)
Part II  line 28 = lines 8 … 27b                                       (expenses before home office)
         line 29 = line 7 − line 28                                    (tentative profit or loss)
         line 30 = Form 8829 line 36, or the Simplified Method Worksheet line 5 ($5 × up to 300 sq ft, limited)
         line 31 = line 29 − line 30, after the at-risk (Form 6198) and passive (Form 8582) limits on a loss
Part III line 42 = (lines 35 + 36 + 37 + 38 + 39) − line 41           (cost of goods sold → line 4)
Part V   line 48 = total of the listed other expenses                  (→ line 27b)

line 31 → Schedule 1 line 3 (all filers) and Schedule SE line 2 (not for statutory-employee income or notary fees)
```

Terms used below:

- **Sole proprietor** — an individual who owns an unincorporated business alone.
- **Statutory employee** — a worker the law treats as an employee for social security and Medicare only (full-time
  life insurance agents, certain commission drivers, traveling salespersons and homeworkers). Their W-2 has box 13
  "Statutory employee" checked; their wages and expenses go on their own Schedule C, but they owe **no**
  self-employment tax on it.
- **Material participation** — regular, continuous and substantial work in the business, proven by one of seven
  tests (line G). Without it the business is a **passive activity**.
- **At risk** — the money and property the owner could actually lose in the business (cash, property, recourse
  debt). Nonrecourse or protected amounts are "not at risk".
- **Qualified joint venture (QJV)** — a business owned and run only by spouses filing jointly who elect to split it
  and each file a Schedule C instead of a partnership return.
- **Hobby** — an activity not engaged in for profit; it is not reported on Schedule C.

## 2. The IRS wording

**Schedule C (2025), heading and lines** (`f1040sc.pdf p. 1`): "Attach to Form 1040, 1040-SR, 1040-SS, 1040-NR, or
1041; partnerships must generally file Form 1065." Line 31: "Net profit or (loss). Subtract line 30 from line 29. •
If a profit, enter on both Schedule 1 (Form 1040), line 3, and on Schedule SE, line 2. (If you checked the box on
line 1, see instructions.) … • If a loss, you must go to line 32." Line 32: "If you checked 32a, enter the loss on both
Schedule 1 (Form 1040), line 3, and on Schedule SE, line 2. … If you checked 32b, you must attach Form 6198. Your loss
may be limited."

**Who uses Schedule C** (`i1040sc.pdf p. 2`):

> "Use Schedule C (Form 1040) to report income or (loss) from a business you operated or a profession you practiced
> as a sole proprietor. An activity qualifies as a business if your primary purpose for engaging in the activity is
> for income or profit and you are involved in the activity with continuity and regularity. For example, a sporadic
> activity, a not-for-profit activity, or a hobby does not qualify as a business. To report income from a
> nonbusiness activity, see the Instructions for Schedule 1 (Form 1040), line 8j."
>
> "Also, use Schedule C to report (a) wages and expenses you had as a statutory employee; (b) income and deductions of
> certain qualified joint ventures; and (c) certain amounts shown on a Form 1099, such as Form 1099-MISC, Form
> 1099-NEC, and Form 1099-K."

**Line A** (`i1040sc.pdf p. 3`): "If you owned more than one business, complete a separate Schedule C for each
business."

**Line 1** (`i1040sc.pdf p. 5`):

> "Enter gross receipts from your trade or business. Be sure to check any Forms 1099 you received for business
> income that must be reported on this line. If you received one or more Forms 1099-NEC, be sure line 1 includes
> amounts properly shown on your Forms 1099-NEC. If the total amounts that were reported in box 1 of Forms 1099-NEC
> are more than the total you are reporting on line 1, attach a statement explaining the difference."
>
> "Statutory employees. … Enter your statutory employee income from box 1 of Form W-2 on line 1 of Schedule C and
> check the box on that line. … you do not owe self-employment tax on these earnings. … If you had both
> self-employment income and statutory employee income, you must file two Schedules C. You cannot combine these
> amounts on a single Schedule C."

**Line G** (`i1040sc.pdf p. 4–5`): "If you check “No,” this activity is passive. If you have a loss from a passive
activity, see Limit on losses, later." … "a business activity in which you do not materially participate or a
rental activity is a passive activity and you have to use Form 8582 to apply a limitation that may reduce the loss,
if any, that you may enter on Schedule C, line 31."

**Line 31** (`i1040sc.pdf p. 14`): "If your expenses (including the expenses you report on line 30) are more than
your gross income, don’t enter your loss on line 31 until you have applied the at-risk rules and the passive activity
loss rules." … "Individuals. Enter your net profit or loss on line 31 and include it on Schedule 1 (Form 1040),
line 3. Also, include your net profit or loss on Schedule SE (Form 1040), line 2." … "Statutory employees. Enter
your net profit or loss on line 31 and include it on Schedule 1 (Form 1040), line 3. However, do not report this
amount on Schedule SE (Form 1040), line 2."

**Schedule 1 line 3** (`i1040gi_ty2025.pdf p. 89`): "If you operated a business or practiced your profession as a
sole proprietor, report your income and expenses on Schedule C."

**Excess business loss** (`i1040sc.pdf p. 1`): "The disallowed loss resulting from the limitation will not be
reflected on line 31 of your Schedule C. Instead, use Form 461 to determine the amount of your excess business loss,
which will be included as income on Schedule 1 (Form 1040), line 8p."

## 3. What goes on this form

- Gross receipts of a sole-proprietor business, including all business amounts on Forms 1099-NEC (box 1), 1099-K
  (box 1a, less amounts reported in error or for personal items) and the business boxes of 1099-MISC (box 3 when it
  is trade or business income, box 5 fishing-boat crew pay, box 6 medical and health care payments, sales of box 7
  consumer products) (`i1040sc.pdf p. 5`; `f1099msc.pdf p. 5`, Instructions for Recipient, `docs\IRS-Forms`).
- Cash, check and in-kind business income that no Form 1099 reports (`i1040sc.pdf p. 5`: "Be sure to report all
  income attributable to your trade or business from all sources").
- Statutory-employee W-2 box 1 wages and the related expenses, on their **own** Schedule C with the line 1 box checked
  (`i1040sc.pdf p. 5`).
- Name, image and likeness (NIL) income of a student-athlete that is self-employment income (`i1040sc.pdf p. 6`).
- Medicaid waiver payments for home-care services received on a 1099-MISC / 1099-NEC: the full amount on line 1 and
  the excludable part as a Part V expense marked "Notice 2014-7" (`i1040sc.pdf p. 6`).
- Line 6 other business income: finance reserve income, scrap sales, recovered bad debts, interest on business
  receivables, fuel tax credits and refunds, business prizes, **Form 1099-PATR** amounts, a net positive §481(a)
  adjustment, and Form 4797 Part IV recapture of listed property whose business use fell to 50% or less
  (`i1040sc.pdf p. 4`, `p. 6`).
- Business expenses on lines 8–27b and Part V; the business-use-of-home deduction only on line 30
  (`f1040sc.pdf p. 1`: "Enter expenses for business use of your home only on line 30").
- Each spouse's share of a qualified joint venture, each on a separate Schedule C (`i1040sc.pdf p. 3`).

## 4. What does not go here

| Look-alike amount | Where it goes instead | Source |
|---|---|---|
| An activity not engaged in for profit (hobby) | Schedule 1 line 8j (income); expenses are not deductible on Schedule 1 | `i1040sc.pdf p. 2`; `i1040gi_ty2025.pdf p. 91`; `p525.pdf p. 31` |
| Business owned with someone other than a spouse (or spouses who do not elect QJV and are not community-property owners) | Form 1065 partnership return; the owner's K-1 | `i1040sc.pdf p. 2` |
| Rental real estate and royalties not subject to SE tax (including a QJV's rental) | Schedule E | `i1040sc.pdf p. 2`, `p. 3`, `p. 6` |
| Farming | Schedule F | `i1040sc.pdf p. 2` |
| Sale of business property (other than inventory) | Form 4797 (Schedule 1 line 4), Form 4684 for casualties | `i1040sc.pdf p. 2` |
| Excess business loss disallowed by §461(l) | Form 461 → Schedule 1 line 8p (shown after line 31, not on it) | `i1040sc.pdf p. 1` |
| Self-employed health insurance for the owner | Schedule 1 line 17 (not line 14 or 15) | `i1040sc.pdf p. 7` |
| Retirement contributions for the owner (SEP, SIMPLE, solo 401(k)) | Schedule 1 line 16 (only employees' plan contributions on line 19) | `i1040sc.pdf p. 8` |
| One-half of self-employment tax | Schedule 1 line 15; never line 23 | `i1040sc.pdf p. 9` |
| Personal-use share of car-loan interest | Schedule 1-A (no tax on car loan interest), not line 16b | `i1040sc.pdf p. 1`, `p. 6`, `p. 8` |
| Qualified tips and overtime | Schedule 1-A, not Schedule C | `i1040sc.pdf p. 1` |
| Mortgage interest, real estate taxes and casualty losses on the home not used for business | Schedule A (if itemizing) | `i1040sc.pdf p. 2`, `p. 14` |
| Contributions to a capital construction fund | Reduce Form 1040 line 15 ("CCF") | `i1040sc.pdf p. 3` |
| Form 1099-K amounts reported in error or for personal items sold at a loss | The entry space at the top of Schedule 1 | `i1040gi_ty2025.pdf p. 88` |
| Form 1099-K personal item sold at a gain | Form 8949 / Schedule D | `i1040gi_ty2025.pdf p. 88` |
| 1099-MISC box 1 rents (no significant services) and box 2 royalties | Schedule E | `f1099msc.pdf p. 5` |
| Charitable contributions, fines and penalties paid to a government, personal living expenses | Not deductible on Schedule C (charity on Schedule A) | `i1040sc.pdf p. 16` |

## 5. Where the numbers come from

| Source document / form | Box or line | How it enters Schedule C |
|---|---|---|
| Form 1099-NEC | Box 1 nonemployee compensation | Included in line 1 (statement required if the 1099-NEC total exceeds line 1) |
| Form 1099-K | Box 1a gross amount | Included in line 1, less amounts reported in error / personal items (those go on Schedule 1's entry space) |
| Form 1099-MISC | Boxes 3 (if business), 5, 6, 7 | Line 1 |
| Form W-2 with box 13 "Statutory employee" | Box 1 | Line 1 of a separate Schedule C, line 1 box checked |
| Form 1099-PATR | Business patronage distributions | Line 6 |
| Form 4797 Part IV | Recapture of listed property (business use ≤ 50%) | Line 6 |
| Owner's books and records | Cash receipts, every expense, inventory counts | Lines 1–48 |
| Form 4562 | Line 22 (total depreciation and §179) | Line 13 |
| Form 8829 | Line 36 | Line 30 (actual-expense method) |
| Simplified Method Worksheet (`i1040sc.pdf p. 12`) | Line 5 | Line 30 (simplified method) |
| Form 7205 | Energy efficient commercial buildings deduction | Line 27a |
| Form 8990 | Allowed business interest | Lines 16a / 16b ("report the reduced interest") |
| Form 6198 | Allowed loss | Line 31 when line 32b is checked |
| Form 8582 | Allowed passive loss | Line 31 when line G is "No" |
| Employment-credit forms 5884, 8844, 8932, 8994 | Credit amount | Reduces line 26 |
| Form 8941 | Small employer health insurance credit | Reduces line 14 |
| Form 8846 | Line 4 | Reduces the FICA part of line 23 |

## 6. How to figure it, step by step (every line of the 2025 form)

**Heading.** Name of proprietor and SSN (`f1040sc.pdf p. 1`).

1. **Line A — Principal business or profession.** Describe the activity that produced line 1 (`i1040sc.pdf p. 3`).
2. **Line B — Business code.** The six-digit Principal Business or Professional Activity code from the chart at the
   end of the instructions (`i1040sc.pdf p. 3–4`, chart `p. 17–19`).
3. **Line C — Business name.** Blank if none (`f1040sc.pdf p. 1`).
4. **Line D — EIN.** Only an EIN issued to you (or to your single-member LLC for employment, excise, retirement-plan
   or gambling-payer purposes); never your SSN or a payer's EIN (`i1040sc.pdf p. 4`).
5. **Line E — Business address.** Street address; not needed if the business is run from the home on page 1 of the
   return (`i1040sc.pdf p. 4`).
6. **Line F — Accounting method.** Cash, accrual or other. A non-small-business taxpayer must use accrual for
   inventory. A change needs Form 3115 and a §481(a) adjustment: a net positive adjustment goes on line 6 (generally
   spread over 4 years), a net negative one in Part V (`i1040sc.pdf p. 4`).
7. **Line G — Material participation.** "Yes" if any of the seven tests is met (more than 500 hours; substantially
   all the participation; more than 100 hours and not less than anyone else; significant participation activities
   over 500 hours in total; 5 of the prior 10 years; a personal service activity in any 3 prior years; facts and
   circumstances over 100 hours) or the oil-and-gas working-interest exception applies; otherwise "No", and the
   business is passive (`i1040sc.pdf p. 4–5`). A spouse's participation counts as yours (`p. 4`).
8. **Line H — Started or acquired in 2025.** Check it; also when reopening a business with no 2024 Schedule C
   (`i1040sc.pdf p. 5`).
9. **Line I — Payments requiring Forms 1099?** Yes / No (`i1040sc.pdf p. 5`).
10. **Line J — Did you or will you file them?** Yes / No (`f1040sc.pdf p. 1`).

**Part I — Income**

11. **Line 1 — Gross receipts or sales.** All business receipts, including the Forms 1099 above and income no form
    reports; check the box when the amount is statutory-employee W-2 income (and use a separate Schedule C for it).
    Include state and local sales tax you collected as the seller only when the tax is imposed on you
    (`i1040sc.pdf p. 9`, line 23). If 1099-NEC box 1 totals more than line 1, attach an explanation (`i1040sc.pdf
    p. 5`). Installment sales by dealers generally cannot use the installment method (`i1040sc.pdf p. 6`).
12. **Line 2 — Returns and allowances**, as a positive number (`i1040sc.pdf p. 6`).
13. **Line 3** = line 1 − line 2.
14. **Line 4 — Cost of goods sold** from line 42.
15. **Line 5 — Gross profit** = line 3 − line 4.
16. **Line 6 — Other income** (list in section 3), including Form 1099-PATR business amounts and Form 4797 Part IV
    recapture (`i1040sc.pdf p. 6`).
17. **Line 7 — Gross income** = line 5 + line 6.

**Part II — Expenses** (reduce each line by amounts capitalized under the uniform capitalization rules unless the
small business taxpayer or creative-property exception applies, `i1040sc.pdf p. 6`)

18. **Line 8 — Advertising.**
19. **Line 9 — Car and truck expenses.** Either the **standard mileage rate** — business miles × $0.70, plus parking
    fees and tolls, with no depreciation, lease payments or operating costs — or **actual expenses** (business share
    of gas, oil, repairs, insurance, plates; depreciation on line 13; lease on line 20a). Actual expenses are required
    for five or more vehicles used at once; the standard rate is allowed for an owned vehicle only if it was used in
    the first year the vehicle was placed in service, and for a leased vehicle only for the whole lease
    (`i1040sc.pdf p. 6–7`). Complete Part IV, or Form 4562 Part V when depreciating the vehicle (`i1040sc.pdf p. 7`).
20. **Line 10 — Commissions and fees** (not capitalized ones) (`i1040sc.pdf p. 7`).
21. **Line 11 — Contract labor** (non-employees; not amounts on lines 17, 21, 26 or 37) (`i1040sc.pdf p. 7`).
22. **Line 12 — Depletion** (Form T for timber) (`i1040sc.pdf p. 7`).
23. **Line 13 — Depreciation and section 179 expense** — from Form 4562 (attach it for 2025 placements, listed
    property or §179) (`i1040sc.pdf p. 7`). See `forms\4562.md`.
24. **Line 14 — Employee benefit programs** (not the owner's own health plan; reduced by the Form 8941 credit)
    (`i1040sc.pdf p. 7`).
25. **Line 15 — Insurance (other than health)** (`i1040sc.pdf p. 8`).
26. **Lines 16a / 16b — Interest.** 16a: business-property mortgage interest reported on Form 1098; 16b: other
    business interest, including the **business share** of vehicle-loan interest. Allocate interest by tracing the
    loan's use; apply Form 8990 first if the business is not a small business taxpayer; deduct only the part for
    2025; the personal-use share of car-loan interest claimed on Schedule 1-A cannot also be here
    (`i1040sc.pdf p. 8`).
27. **Line 17 — Legal and professional services** (`i1040sc.pdf p. 8`).
28. **Line 18 — Office expense** (supplies, postage) (`i1040sc.pdf p. 8`).
29. **Line 19 — Pension and profit-sharing plans** for employees only (`i1040sc.pdf p. 8`).
30. **Lines 20a / 20b — Rent or lease**: vehicles, machinery, equipment (less any lease inclusion amount) / other
    business property (`i1040sc.pdf p. 8`).
31. **Line 21 — Repairs and maintenance** (incidental only) (`i1040sc.pdf p. 8`).
32. **Line 22 — Supplies** not in Part III (`i1040sc.pdf p. 8–9`).
33. **Line 23 — Taxes and licenses** (business sales tax imposed on you, business property taxes, licenses, the
    employer share of FICA less Form 8846 line 4, FUTA, highway use tax; not federal income or SE tax)
    (`i1040sc.pdf p. 9`).
34. **Line 24a — Travel** (lodging and transportation away from the tax home; no meals; optional $5 a day for
    incidental expenses on days with no meal cost) (`i1040sc.pdf p. 9`).
35. **Line 24b — Deductible meals**: 50% of business meals (actual or the standard meal allowance), **80%** for
    individuals subject to the Department of Transportation hours-of-service limits; meals treated as employee wages
    or reported to a nonemployee on Form 1099-NEC are fully deductible; no entertainment (`i1040sc.pdf p. 9–10`).
36. **Line 25 — Utilities** (not the base rate of the first home phone line) (`i1040sc.pdf p. 10`).
37. **Line 26 — Wages** paid to employees, **less** the work opportunity, empowerment zone, differential wage and paid
    family leave credits; never amounts paid to yourself (`i1040sc.pdf p. 10`).
38. **Line 27a — Energy efficient commercial buildings deduction** (attach Form 7205) (`i1040sc.pdf p. 1`, `p. 10`).
39. **Line 27b — Other expenses** from line 48 (`i1040sc.pdf p. 1`).
40. **Line 28 — Total expenses** = lines 8 through 27b.
41. **Line 29 — Tentative profit or (loss)** = line 7 − line 28.
42. **Line 30 — Business use of your home.** Either Form 8829 line 36 (actual expenses, `forms\8829.md`) or the
    **Simplified Method Worksheet** (`i1040sc.pdf p. 11–12`):
    1. Line 1 gross income limitation = Schedule C line 29 + gain from business use of the home on Form 8949 /
       Form 4797 − losses allocable to the business but not to the home use. If part of the income is earned
       elsewhere, use only the part from the home, less line 28 expenses (`p. 11`).
    2. Line 2 allowable square feet: the smaller of the area used or **300** (average monthly area for part-year use
       or area changes — no more than 300 a month, 0 for a month with under 15 days of use; QJV spouses split it;
       shared space allocated) (`p. 11`, `p. 13`).
    3. Line 3: $5 × line 3b (1.0, or the Daycare Facility Worksheet fraction for daycare not used exclusively)
       (`p. 12`).
    4. Line 4 = line 2 × line 3c. Line 5 = smaller of line 1 or line 4 (not below 0) → Schedule C line 30.
    5. No carryover: "If this limitation reduces the amount of your deduction, you can’t carry over the difference
       to another tax year" (`p. 13`). Prior Form 8829 carryovers (lines 43 / 44) stay suspended (worksheet lines
       6a / 6b, `p. 11`); home depreciation for the year is deemed zero (`p. 13`).
    6. One election for all qualified uses of the home; 300 square feet in total for all businesses in that home
       (`p. 10`); only one home per business may use it (`p. 13`).
    Fill the two square-footage boxes on line 30 only with the simplified method (`i1040sc.pdf p. 10`, `p. 14`).
43. **Line 31 — Net profit or (loss)** = line 29 − line 30. For a loss, first apply the at-risk rules (line 32) and,
    when line G is "No", Form 8582; a profit from a passive activity with prior-year unallowed losses also goes
    through Form 8582 ("PAL") (`i1040sc.pdf p. 14`).
44. **Line 32 — Investment at risk.** Only when there is a loss (not needed if line 7 exceeds lines 28 + 30).
    32a: all at risk — the loss is not reduced by the at-risk rules. 32b: some not at risk — attach Form 6198 and
    enter the allowed loss; a loss not allowed only because of the at-risk rules is a 2026 deduction of this business
    (`i1040sc.pdf p. 14–15`).

**Part III — Cost of goods sold** (required when production, purchase or sale of merchandise is an income-producing
factor; a small business taxpayer — average gross receipts of $31 million or less — may treat inventory as
non-incidental materials and supplies or follow its financial accounting) (`i1040sc.pdf p. 15`)

45. **Line 33** — method used to value closing inventory: cost, lower of cost or market, other (`p. 15`).
46. **Line 34** — any change in quantities, costs or valuations between opening and closing inventory? (explain).
47. **Line 35** — inventory at beginning of year (refigured under a new method if the method changed) (`p. 15`).
48. **Line 36** — purchases less cost of items withdrawn for personal use.
49. **Line 37** — cost of labor (not amounts paid to yourself).
50. **Line 38** — materials and supplies. **Line 39** — other costs.
51. **Line 40** = lines 35 through 39. **Line 41** — inventory at end of year. **Line 42** = line 40 − line 41 → line 4.

**Part IV — Information on your vehicle** (only when claiming line 9 and not required to file Form 4562; attach a
statement for each additional vehicle) (`f1040sc.pdf p. 2`; `i1040sc.pdf p. 7`)

52. **Line 43** — date placed in service for business.
53. **Line 44a / 44b / 44c** — 2025 business, commuting and other miles (commuting = home to a regular work location;
    travel to a temporary work location or from a home that is the principal place of business is not commuting)
    (`i1040sc.pdf p. 15–16`).
54. **Line 45** — available for personal use off duty? **Line 46** — another vehicle available for personal use?
55. **Lines 47a / 47b** — evidence to support the deduction? written? (`i1040sc.pdf p. 16`).

**Part V — Other expenses** (`i1040sc.pdf p. 16`)

56. **Line 48** — list each other business expense (amortization, at-risk carryover deduction, bad debts, startup
    costs up to $5,000, barrier removal, the excludable Medicaid waiver amount "Notice 2014-7", the de minimis safe
    harbor, section 181 productions, reforestation, technology tools, a negative §481(a) adjustment); the total goes
    on line 27b.

## 7. Special cases and elections

| Case | Rule | Source |
|---|---|---|
| Statutory employee | W-2 box 1 on line 1 with the box checked; separate Schedule C from any other business; no SE tax (line 31 not on Schedule SE line 2); still qualified business income | `i1040sc.pdf p. 5`, `p. 14`; `i1040sse.pdf p. 4`; `i8995.pdf p. 2` |
| Notary public | Net profit not on Schedule SE line 2 unless other SE income requires Schedule SE | `i1040sc.pdf p. 14` |
| Qualified joint venture | Both spouses own and materially participate, joint return; each files a Schedule C (and SE) with their share; LLCs do not qualify | `i1040sc.pdf p. 2–3` |
| Community-property business of spouses | May be reported as a sole proprietorship on one spouse's Schedule C | `i1040sc.pdf p. 3` |
| Hobby | Not Schedule C; income on Schedule 1 line 8j | `i1040sc.pdf p. 2`; `p525.pdf p. 31` |
| Passive business (line G "No") | Losses limited by Form 8582; prior-year unallowed losses may offset profit ("PAL") | `i1040sc.pdf p. 5`, `p. 14` |
| Not fully at risk (line 32b) | Form 6198 limits the loss; the excess carries to 2026 | `i1040sc.pdf p. 14–15` |
| Excess business loss | Figured on Form 461 after line 31; the excess goes on Schedule 1 line 8p and becomes an NOL | `i1040sc.pdf p. 1`; `i461.pdf p. 2` (Form 461 line 2 = Schedule 1 line 3) |
| Business interest limit | Form 8990 unless a small business taxpayer; report only the allowed interest on 16a / 16b | `i1040sc.pdf p. 8` |
| Medicaid waiver payments (Notice 2014-7) | Full amount on line 1, excludable part in Part V | `i1040sc.pdf p. 6` |
| Car-loan interest | Business share on line 16b; personal share on Schedule 1-A; never both | `i1040sc.pdf p. 1`, `p. 8` |
| Meals under DOT hours of service | 80% instead of 50% | `i1040sc.pdf p. 10` |
| Simplified home office | $5 × up to 300 sq ft, limited to the business income, no carryover, no home depreciation | `i1040sc.pdf p. 10–14` |
| Wagering business | §165(d): wagering losses and the expenses of the wagering business only to the extent of wagering gains (not described in i1040sc; IRC §165(d)) | not in the 2025 books — **unverified from IRS documents here** |
| Accounting method change | Form 3115; §481(a) adjustment on line 6 (positive) or Part V (negative) | `i1040sc.pdf p. 4` |
| Chapter 11 debtor | See the Form 1040 and Schedule SE instructions | `i1040sc.pdf p. 5` |

## 8. Married filing jointly / separately

- **One Schedule C per business, per owner.** On a joint return each spouse files a Schedule C for each business
  they own; the line 31 amounts of both spouses are added on Schedule 1 line 3, but Schedule SE is figured per
  person (`f1040sc.pdf p. 1`; `i1040sc.pdf p. 2–3`).
- **A business run by both spouses** is a partnership (Form 1065) unless they elect QJV (joint return only — each
  reports their share on a separate Schedule C) or own it as community property and treat it as a sole
  proprietorship (`i1040sc.pdf p. 2–3`).
- **Separate returns in a community property state:** see the Schedule SE instructions before figuring SE tax
  (`i1040sc.pdf p. 14`); income tax follows the community-property split (Pub. 555).
- **Simplified home office:** QJV spouses split the square footage (`i1040sc.pdf p. 11`).
- No per-person dollar limit on Schedule C itself; the §179, §461(l) and §163(j) limits apply on their own forms.

## 9. Forms to attach or keep

| Form | Filed with the return? |
|---|---|
| Schedule C | Filed — one per business (two when a person has both statutory-employee and self-employment income) |
| Statement explaining a 1099-NEC total above line 1 | Attached (`i1040sc.pdf p. 5`) |
| Form 4562 | Attached when 2025 placements, any listed property, §179, or 2025 amortization (`i1040sc.pdf p. 7`, `p. 16`) |
| Form 8829 | Attached for the actual-expense home office (`f1040sc.pdf p. 1`, line 30) |
| Simplified Method Worksheet, Daycare Facility Worksheet | Kept ("Keep for Your Records", `i1040sc.pdf p. 12`) |
| Form 6198 | Attached when line 32b is checked (`i1040sc.pdf p. 15`) |
| Form 8582 | Filed when a passive activity loss is limited |
| Form 461 | Filed when an excess business loss applies |
| Form 7205 | Attached for line 27a |
| Form 8990 | Filed unless an exception applies |
| Statement for each additional vehicle (Part IV) | Attached (`i1040sc.pdf p. 7`) |
| Installment-method statement (gross sales, COGS, gross profit for 2025 and 3 prior years) | Attached (`i1040sc.pdf p. 6`) |
| Form 3115 | Filed for an accounting-method change |
| Schedule SE | Filed when net earnings from self-employment are $400 or more (Schedule SE instructions) |
| Form 8995 / 8995-A | Filed to claim the QBI deduction |
| Books, receipts, mileage logs | Kept (`i1040sc.pdf p. 16`, line 47) |

## 10. Where the amount goes next

- **Schedule 1 line 3** — the total of every Schedule C line 31 (both spouses on a joint return) → Schedule 1 line 10
  → Form 1040 line 8 → line 9 → AGI (`i1040sc.pdf p. 14`; `i1040gi_ty2025.pdf p. 89`).
- **Schedule SE line 2** — per person, excluding statutory-employee income and notary fees (`i1040sc.pdf p. 14`;
  `i1040sse.pdf p. 4`) → Schedule 2 line 4, and one-half → Schedule 1 line 15.
- **Form 8995 / 8995-A** — line 31 (with the line 31 adjustments for ½ SE tax, SE health insurance and SE retirement)
  is qualified business income (`i1040sc.pdf p. 5`: "Income you report on Schedule C may be qualified business
  income") → Form 1040 line 13a.
- **Form 461 line 2** — Schedule 1 line 3 enters the excess business loss computation (`i461.pdf p. 2`) → Schedule 1
  line 8p.
- **Earned income** — a line 31 profit is earned income for the EIC (Worksheet B), and net earnings from
  self-employment feed IRA compensation, the SE health insurance and SE retirement limits (`i1040sc.pdf p. 14`).
- **Form 8960** — a passive business's income is net investment income (Form 8960 instructions; not traced here).
- **Line 30 casualty part** — per the Form 8829 instructions, the casualty-loss part of Form 8829 line 34 (line 35)
  goes to Form 4684 rather than to line 30 (see `forms\8829.md`).

## 11. Worked example

Riley Sample (000-00-0001), single, runs a design-and-print shop from home on the cash method, materially
participates (line G Yes), all investment at risk.

| Item | Amount |
|---|---|
| Form 1099-NEC box 1 from two clients | $30,000.00 |
| Cash and card sales with no 1099 | $5,000.00 |
| Refunds to customers (line 2) | $500.00 |
| Inventory 1 Jan / purchases / inventory 31 Dec | $1,000 / $3,000 / $1,500 |
| Bad debt recovered (line 6) | $200.00 |
| Advertising | $800.00 |
| Car: 4,000 business miles of 10,000 total, parking $100, car-loan interest $600 | — |
| Form 4562 line 22 (computer, §179) | $1,200.00 |
| Office expense / supplies | $400 / $600 |
| Business meals (actual cost) | $500.00 |
| Design software subscription (Part V) | $300.00 |
| Home office: 200 sq ft used regularly and exclusively all year, simplified method | — |

1. Line 1 = $30,000 + $5,000 = **$35,000** (line 1 is not less than the 1099-NEC total, so no statement).
2. Line 2 = $500; line 3 = **$34,500**.
3. Part III: line 35 $1,000 + line 36 $3,000 = line 40 $4,000; line 41 $1,500; line 42 = **$2,500** → line 4.
4. Line 5 = $34,500 − $2,500 = $32,000; line 6 = $200; line 7 = **$32,200**.
5. Line 9 = 4,000 × $0.70 + $100 = **$2,900**. Line 16b = $600 × 4,000 / 10,000 = **$240** (the other $360 may go on
   Schedule 1-A).
6. Line 24b = $500 × 50% = **$250**. Line 27b = line 48 = $300.
7. Line 28 = 800 + 2,900 + 1,200 + 240 + 400 + 600 + 250 + 300 = **$6,690**.
8. Line 29 = $32,200 − $6,690 = **$25,510**.
9. Simplified Method Worksheet: line 1 $25,510; line 2 200; line 3c $5.00; line 4 $1,000; line 5 = **$1,000** → line 30
   (square-footage boxes filled: home 1,800, business 200).
10. Line 31 = $25,510 − $1,000 = **$24,510**. Line 32 is not needed (a profit).
11. Riley's Schedule 1 line 3 = **$24,510**; Schedule SE line 2 = $24,510; Form 8995 starts from $24,510; Part IV
    is not completed because the computer's §179 requires Form 4562, so the vehicle data go on Form 4562 Part V.

## 12. 2025 amounts used

| Amount | Value | Source |
|---|---|---|
| Standard mileage rate | 70 cents a mile | `i1040sc.pdf p. 1`, `p. 6` |
| Business meals | 50%; 80% under DOT hours-of-service limits | `i1040sc.pdf p. 1`, `p. 10` |
| Optional incidental expenses | $5 a day | `i1040sc.pdf p. 9` |
| Simplified home office | $5 per sq ft, at most 300 sq ft | `i1040sc.pdf p. 10`, `p. 12` |
| Section 179 maximum / phase-out start | $2,500,000 / $4,000,000 | `i1040sc.pdf p. 1` |
| Bonus depreciation | 100% for qualified property acquired and placed in service after Jan. 19, 2025 | `i1040sc.pdf p. 1` |
| Small business taxpayer gross receipts test | $31 million average (3 prior years) | `i1040sc.pdf p. 15` |
| Startup costs deduction | $5,000, reduced dollar for dollar above $50,000; rest over 180 months | `i1040sc.pdf p. 16` |
| De minimis safe harbor | $2,500 per item / invoice ($5,000 with an applicable financial statement) | `i1040sc.pdf p. 16` |
| Barrier removal deduction | $15,000 | `i1040sc.pdf p. 16` |
| Reforestation expensing | $10,000 ($5,000 MFS) per qualified timber property | `i1040sc.pdf p. 16` |
| Qualified sound recording productions | up to $150,000 | `i1040sc.pdf p. 1` |
| Form 1099-NEC filing threshold for payments | $600 | `i1040sc.pdf p. 7` |
| Form 1099-K issuing threshold (2025) | more than $20,000 and more than 200 transactions | `i1040gi_ty2025.pdf p. 88` |
| Excess business loss threshold | $313,000 ($626,000 joint) | `i461.pdf p. 1` |

## 13. IRS sources

| Document | Pages | Used for |
|---|---|---|
| `f1040sc.pdf` (Schedule C 2025, in `docs\IRS-Forms`) | 1–2 | Line wording, lines A–J, 1–48 |
| `i1040sc.pdf` (2025 Instructions for Schedule C) | 1 | What's new: mileage, 27a / 27b, bonus, §179, Schedule 1-A items, Form 461 |
| | 2–3 | Who files, other forms, QJV, community income, line A |
| | 4–5 | Lines B, D, E, F, G (material participation), H, I, Part I, line 1, statutory employees |
| | 6 | NIL, Medicaid waiver, installment sales, lines 2, 6, Part II, line 9 |
| | 7–10 | Lines 9–27a, meals, line 30 |
| | 11–14 | Simplified Method Worksheet and its rules; line 31; line 32 |
| | 15–16 | Line 32 (cont.), Part III, Part IV, Part V |
| `i1040gi_ty2025.pdf` | 88 | Form 1099-K amounts in error / personal items |
| | 89 | Schedule 1 line 3 |
| | 91 | Schedule 1 line 8j |
| `i1040sse.pdf` | 4 | Statutory employee net profit not on Schedule SE line 2 |
| `i8995.pdf` | 2 | Statutory-employee W-2 income is QBI |
| `i461.pdf` | 1–2 | Threshold; Form 461 line 2 = Schedule 1 line 3 |
| `p525.pdf` | 31 | Activity not for profit → Schedule 1 line 8j |
| `f1099msc.pdf` (Rev. April 2025, in `docs\IRS-Forms`) | 5 | Recipient instructions for boxes 1, 3, 5, 6, 7 |

Not in the 2025 books: Pub. 587 (business use of home), Pub. 946 (depreciation), Pub. 925 (passive activities),
Pub. 538 (accounting methods). Statements that rely on them are marked where used.
