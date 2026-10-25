# Schedule F (Form 1040) — Profit or Loss From Farming

Tax year 2025. What the IRS requires. How the app does it: `C:\us-tax\new_knowledge\forms\schedule-f.md`. Picture:
`C:\us-tax\new_flowcharts\forms\schedule-f.md`.

Sources. The rules come from the 2025 Instructions for Schedule F (`i1040sf.pdf`, 10 pages, "Dec 10, 2025") and the
2025 Instructions for Schedule SE (`i1040sse.pdf`), both in `C:\us-tax\docs\books\`. The form itself is not in
`docs\books\`; the line captions quoted below are from the 2025 form in `C:\us-tax\docs\IRS-Forms\f1040sf.pdf`
("Schedule F (Form 1040) 2025 Created 5/6/25"), cited as `f1040sf.pdf p. N`. The instructions send the reader to
Pub. 225 (Farmer's Tax Guide) for many details; Pub. 225 is **not** in `docs\books\`, so where the instructions stop at
"see Pub. 225" this file stops too.

---

## 1. At a glance

Schedule F reports the income and expenses of a **farming business** run by an individual (a sole proprietor, a
single-member LLC that is not treated as a corporation, or each spouse of a qualified joint venture). Part I is the
income of a **cash-method** farmer, Part III the income of an **accrual-method** farmer (its line 50 is copied to Part I
line 9), and Part II the expenses of both. Line 34, the net farm profit or loss, goes to **Schedule 1 line 6** and to
**Schedule SE line 1a** (self-employment tax), and is the starting point for the farm's qualified business income (QBI)
deduction. A loss first passes the at-risk rules (Form 6198), then — if the farmer did not materially participate — the
passive activity rules (Form 8582), then the excess business loss limit (Form 461).

```text
Cash method:     line 9  = 1c + 2 + 3b + 4b + 5a + 5c + 6b + 6d + 7 + 8          (1c = 1a − 1b)
Accrual method:  line 9  = line 50 = (37 + 38b + 39b + 40a + 40c + 41 + 42 + 43) − line 49
                           line 49 = (45 + 46) − 48       (unit-livestock-price / farm-price footnote: may add instead)
line 33 = lines 10 … 32e − line 32f (§263A capitalized costs shown as a negative)
            line 12 (conservation) ≤ 25% of gross income from farming; excess carried forward
line 34 = line 9 − line 33     (a loss only after Form 6198 / Form 8582; Form 461 may limit it further)
line 34 → Schedule 1 line 6 → Form 1040 line 8;   line 34 → Schedule SE line 1a;   line 34 → QBI (Form 8995 / 8995-A)
```

Terms used below:

- **Cash method** — income is reported when actually or constructively received, expenses when paid
  (`i1040sf.pdf p. 3`).
- **Accrual method** — income is reported when earned and expenses when incurred; inventories of animals and crops
  generally must be kept (`i1040sf.pdf p. 3, p. 10`).
- **CCC** — the Commodity Credit Corporation (U.S. Department of Agriculture), which lends against a pledged crop.
- **Material participation** — the passive-activity test of the Schedule C line G instructions, answered on line E
  (`i1040sf.pdf p. 3`). It decides whether a loss is limited by Form 8582; it does **not** decide whether the profit is
  self-employment income (see section 7).
- **Qualified joint venture (QJV)** — a farm owned and run only by a married couple filing jointly, both materially
  participating, who elect to file two Schedules F instead of a partnership return (`i1040sf.pdf p. 2`).
- **Gross income from farming** — the base for the conservation-expense limit; it excludes "certain gains from selling
  assets such as farm machinery and land" (`i1040sf.pdf p. 6`).
- **CRP** — Conservation Reserve Program payments (reported among agricultural program payments).

## 2. The IRS wording

**Heading** (`f1040sf.pdf p. 1`): "Profit or Loss From Farming … Attach to Form 1040, 1040-SR, 1040-SS, 1040-NR, 1041,
or 1065." "Part I Farm Income—Cash Method. Complete Parts I and II. (Accrual method. Complete Parts II and III, and
Part I, line 9.)"

**Purpose** (`i1040sf.pdf p. 2`): "Use Schedule F (Form 1040) to report farm income and expenses."

**Line C** (`i1040sf.pdf p. 3`): "If you use the cash method, check the box for "Cash." Complete Schedule F (Form 1040),
Parts I and II. In most cases, report income in the year in which you actually or constructively received it and deduct
expenses in the year you paid them." "If you use the accrual method, check the box for "Accrual." Complete Schedule F
(Form 1040), Part I, line 9; Part II; and Part III. Generally, report income in the year in which you earned it and
deduct expenses in the year you incurred them, even if you didn't pay them in that year."

**Line E** (`i1040sf.pdf p. 3`): "For the definition of "material participation" for purposes of the passive activity
rules, see the instructions for Schedule C (Form 1040), line G. … Check the "No" box if you didn't materially
participate. If you checked "No" and you have a loss from this business, see Limit on passive losses next."

**Line 12 — conservation expenses** (`i1040sf.pdf p. 6`):

> "These expenses can be deducted only if they're consistent with a conservation plan approved by the Natural
> Resources Conservation Service of the Department of Agriculture or a recovery plan approved pursuant to the
> Endangered Species Act of 1973 for the area in which your land is located. … Your deduction can't exceed 25% of your
> gross income from farming (excluding certain gains from selling assets such as farm machinery and land). If your
> conservation expenses are more than the limit, the excess can be carried forward and deducted in later tax years.
> However, the amount deductible for any 1 year can't exceed the 25% gross income limit for that year."

**Lines 6a through 6d — crop insurance** (`i1040sf.pdf p. 5`):

> "In most cases, you must report crop insurance proceeds in the year you receive them. Federal crop disaster payments
> are treated as crop insurance proceeds. However, if 2025 was the year of damage, you can elect to include certain
> proceeds in income for 2026. To make this election, check the box on line 6c and attach a statement to your return.
> … If you elect to defer any eligible crop insurance proceeds, you must defer all such crop insurance proceeds
> (including federal crop disaster payments) from a single trade or business. Enter on line 6a the total crop
> insurance proceeds you received in 2025, even if you elect to include them in income for 2026. Enter on line 6b the
> taxable amount of the proceeds you received in 2025. Don't include proceeds you elect to include in income for 2026.
> Enter on line 6d the amount, if any, of crop insurance proceeds you received in 2024 and elected to include in income
> for 2025."

**Lines 5a through 5c — CCC loans** (`i1040sf.pdf p. 4–5`): "if you pledge part or all of your production to secure a
CCC loan, you can elect to report the loan proceeds as income in the year you receive them. If you make this election
(or made the election in a prior year), report loan proceeds you received in 2025 on line 5a. Attach a statement …
Forfeited CCC loans. Include the full amount forfeited on line 5b, even if you reported the loan proceeds as income. …
If you didn't elect to report the loan proceeds as income, also include the forfeited amount on line 5c. If you did
elect …, you generally won't have an entry on line 5c. But if the amount forfeited is different from your basis in the
commodity, you may have an entry on line 5c."

**Line 34 — reporting** (`i1040sf.pdf p. 9`): "Individuals. Enter your net profit or loss on line 34 and on Schedule 1
(Form 1040), line 6 and; Schedule SE (Form 1040), line 1a." "If line 33 is more than line 9, don't enter your loss on
line 34 until you have applied the at-risk rules and the passive activity loss rules."

**Line 36** (`i1040sf.pdf p. 10`): "If all your investment amounts are at risk in this activity, check box 36a. If you
also checked the "Yes" box on line E, your remaining loss is your loss. … if you checked the "No" box on line E, you may
need to complete Form 8582 … If some investment isn't at risk, check box 36b; the at-risk rules apply to your loss. Be
sure to attach Form 6198 to your return."

**Self-employment** (`i1040sse.pdf p. 3`): "You are considered self-employed if you produce crops or livestock on
someone else's land for a share of the crops or livestock produced … This applies even if you paid another person (an
agent) to do the actual work or management for you. Report your net earnings for income tax purposes on Schedule F
(Form 1040) and for SE tax purposes on Schedule SE."

## 3. What goes on this form

- Sales of livestock and other items bought for resale (line 1a, less their cost on line 1b) and of products the farmer
  raised (line 2) (`f1040sf.pdf p. 1`).
- Rents based on crop shares or farm production **when the landlord materially participated** — "report these rents as
  income on line 2" (`i1040sf.pdf p. 4`).
- Cooperative distributions from Form 1099-PATR (line 3a total; line 3b the taxable part), agricultural program payments
  from Form 1099-G / CCC-1099-G (line 4a; 4b taxable), CCC loans reported under the election and forfeited CCC loans
  (lines 5a–5c), crop insurance and federal crop disaster payments (lines 6a–6d) (`i1040sf.pdf p. 4–5`).
- Custom hire (machine work) income (line 7); other farm income on line 8 — illegal federal irrigation subsidies,
  bartering, cancelled debt, state fuel tax refunds, the prior-year federal fuel credit, listed-property recapture
  (Form 4797 Part IV), breeding fees, hedging gains or losses on commodity futures (`i1040sf.pdf p. 5`).
- Pasture income from caring for someone else's livestock (line 8) (`i1040sf.pdf p. 2`).
- Ordinary and necessary farm expenses (lines 10–32), depreciation and section 179 (line 14, Form 4562).
- Under the accrual method, the Part III income and the inventory change (lines 37–50).

## 4. What does not go here

| Look-alike amount | Where it goes instead | Source |
|---|---|---|
| Crop- or livestock-share rent of a landlord who did **not** materially participate | Form 4835 (not subject to SE tax) | `i1040sf.pdf p. 2`; `i1040sse.pdf p. 4` |
| Flat-charge rent for pastureland; farm rent of a trust or estate | Schedule E Part I | `i1040sf.pdf p. 2` |
| Agricultural services (soil preparation, veterinary, farm labor), pet breeding, managing a farm for a fee | Schedule C | `f1040sf.pdf p. 2` (Part IV caution) |
| Sales of livestock held for draft, breeding, sport or dairy; sales of farm machinery and land | Form 4797 | `f1040sf.pdf p. 2`; `i1040sf.pdf p. 2` |
| Casualty or theft of farm property | Form 4684 | `i1040sf.pdf p. 2` |
| Speculative commodity futures (not hedges) | Form 6781 | `i1040sf.pdf p. 5` |
| Patronage dividends from buying personal or family items, capital assets or depreciable assets | Line 3a only, not 3b (reduce the item's basis) | `i1040sf.pdf p. 4` |
| Crop insurance received in 2025 and elected to be deferred | 2026 return (next year's line 6d) | `i1040sf.pdf p. 5` |
| The farmer's own health insurance; own retirement-plan contributions | Schedule 1 line 17; Schedule 1 line 16 | `i1040sf.pdf p. 7–8` |
| Self-employment tax | One-half on Schedule 1 line 15 (never line 29) | `i1040sf.pdf p. 8` |
| Personal or living expenses; animals raised that died; inventory losses | Not deductible | `i1040sf.pdf p. 5` |
| Conservation expenses over 25% of gross income from farming | Carried forward | `i1040sf.pdf p. 6` |
| Business use of the home | Line 32 using the Pub. 587 worksheets — "Don't use Form 8829" | `i1040sf.pdf p. 8` |

## 5. Where the numbers come from

| Source | Box / item | Schedule F line |
|---|---|---|
| Farmer's sales records | Resale livestock sold and their cost; raised products sold | 1a, 1b, 2 (cash); 37 (accrual) |
| Form 1099-PATR | Distributions (patronage dividends, nonpatronage, per-unit retains, redemptions) | 3a / 3b (38a / 38b) |
| Form 1099-G, CCC-1099-G | Agricultural program payments; disaster payments | 4a / 4b (39a / 39b); 6a (disaster) |
| CCC loan records, Form 1099-A | Loans under the election; forfeited loans | 5a, 5b, 5c (40a–40c) |
| Form 1099-MISC (crop insurance), insurer records | Crop insurance proceeds; 2024 proceeds deferred to 2025 | 6a, 6b, 6c, 6d (41) |
| Form 1099-MISC / 1099-NEC / 1099-K | Custom farming work and other farm receipts | 7, 8 (`i1040sf.pdf p. 4`) |
| Form 1099-C | Cancelled farm debt (possibly excludable, Pub. 4681) | 8 |
| Form 4797 Part IV | Listed-property recapture | 8 |
| Form 4562 | Depreciation, section 179, amortization; vehicle information | 10, 14, 32 |
| Inventory records | Beginning / ending inventory, purchases | 45–48 |
| Form 6198 / Form 8582 / Form 461 | Allowed loss | 34 |

The Form 1099 routing table (`i1040sf.pdf p. 4`): "1099-PATR … Line 3a; 1099-A … Line 5b; 1099-MISC for crop insurance
… Line 6a; 1099-G or CCC-1099-G • For disaster payments … Line 6a • For other agricultural program payments … Line 4a".

## 6. How to figure it, line by line (every line of the 2025 form)

**Header** (`f1040sf.pdf p. 1`; `i1040sf.pdf p. 3–4`)

1. **Line A** — principal crop or activity.
2. **Line B** — one of the 17 principal agricultural activity codes in Part IV, the one that "best describes the source
   of most of your income".
3. **Line C** — accounting method: Cash or Accrual. Farming syndicates can't use the cash method.
4. **Line D** — the farmer's own EIN, only if one was issued (needed for a retirement plan, employment or excise
   returns, or as a payer of gambling winnings); never the SSN or an LLC's EIN.
5. **Line E** — material participation (Schedule C line G tests). A retired or disabled farmer who materially
   participated 5 of the 8 years before retirement / disability, and a qualifying surviving spouse who actively
   manages the farm, are treated as participating.
6. **Lines F and G** — whether payments requiring Forms 1099 were made, and whether they were filed.

**Part I — Farm Income, Cash Method** (`f1040sf.pdf p. 1`; `i1040sf.pdf p. 4–5`). Include cash and the fair market
value of goods or property received.

7. **Line 1a** sales of purchased livestock and other resale items; **line 1b** their cost or other basis; **line 1c**
   = 1a − 1b.
8. **Line 2** sales of livestock, produce, grains and other products raised (and crop-share rents of a participating
   landlord). Sales of livestock forced by drought, flood or other weather conditions may be deferred one year if the
   main business is farming, the sale was only because of the weather and the area qualified for federal aid (details
   in Pub. 225, not available).
9. **Line 3a** total cooperative distributions; **line 3b** taxable amount (leave out patronage dividends from personal
   items, capital assets or depreciable assets).
10. **Line 4a** total agricultural program payments (price loss and agriculture risk coverage, Market Facilitation
    Program, CCC market gain, diversion, cost-share, payments in materials or services); **line 4b** taxable amount
    (leave out the CCC market gain if CCC loans were reported as income under the election).
11. **Line 5a** CCC loans reported under the election (attach a statement); **line 5b** CCC loans forfeited (full
    amount); **line 5c** taxable amount of the forfeiture (the forfeited amount without the election; usually nothing
    with it, unless the forfeited amount differs from basis).
12. **Line 6a** crop insurance and federal crop disaster payments received in 2025 (even if deferred); **line 6b**
    taxable amount (leaving out amounts deferred to 2026); **line 6c** check if the deferral election is attached;
    **line 6d** proceeds received in 2024 and deferred to 2025.
13. **Line 7** custom hire (machine work) income.
14. **Line 8** other income (see section 3). A loss on a closed hedging futures contract is entered in parentheses.
15. **Line 9** gross income = 1c + 2 + 3b + 4b + 5a + 5c + 6b + 6d + 7 + 8; under the accrual method, Part III line 50.

**Part II — Farm Expenses, Cash and Accrual Method** (`f1040sf.pdf p. 1`; `i1040sf.pdf p. 5–9`). Reduce an expense by
any reimbursement received in the same year. Small business taxpayers (average gross receipts of $31 million or less)
need not capitalize under §263A; others "don't reduce your deductions on lines 10 through 32e by the capitalized
expenses. Instead, enter the total amount capitalized in parentheses on line 32f … and enter "263A"" (`p. 5`). Prepaid
farm supplies of a cash-method farmer above 50% of the other deductible farm expenses are deductible only when used
(`p. 6`).

16. **Line 10** car and truck expenses: actual costs (business share; depreciation on line 14, lease on line 24a) or the
    standard mileage rate of 70 cents a mile plus parking and tolls; attach Form 4562 Part V. Vehicle-loan interest
    already deducted on Schedule 1-A is not deducted here (`p. 1, 6`).
17. **Line 11** chemicals.
18. **Line 12** conservation expenses — soil and water conservation, erosion prevention, endangered-species recovery
    (earth moving, terracing, ditches, ponds, brush eradication, windbreaks), consistent with an approved plan; not for
    draining or filling wetlands, center-pivot preparation or foreign land. **Limited to 25% of gross income from
    farming; the excess carries forward, and each later year is again limited to that year's 25%** (`p. 6`).
19. **Line 13** custom hire (machine work) paid (equipment operated by the hirer; equipment the farmer runs goes on
    line 24a).
20. **Line 14** depreciation and section 179 (Form 4562). 2025: section 179 limit $2,500,000, reduced above
    $4,000,000 of property; 100% special allowance for property acquired after January 19, 2025; 100% / 40% allowance
    for certain fruit- and nut-bearing plants; an electing farming business uses ADS for 10-year-or-longer property
    (`p. 1, 7`).
21. **Line 15** employee benefit programs (not the farmer's own accident, health or group-term life), reduced by the
    Form 8941 credit.
22. **Line 16** feed (prepaid feed only if a purchase, for a business purpose and not distorting income).
23. **Line 17** fertilizers and lime. **Line 18** freight and trucking (not freight on livestock bought for resale).
    **Line 19** gasoline, fuel and oil. **Line 20** insurance other than health.
24. **Line 21a** mortgage interest paid to banks etc. (Form 1098); **line 21b** other interest. Apply the interest
    allocation rules and the Form 8990 business interest limit first (`p. 7`).
25. **Line 22** labor hired, less the Form 5884 / 8844 / 8932 / 8994 credits; not amounts paid to the farmer.
26. **Line 23** pension and profit-sharing plans for employees (the farmer's own share goes to Schedule 1 line 16).
27. **Line 24a** rent or lease of vehicles, machinery, equipment (inclusion amount for a 30-day-plus vehicle lease);
    **line 24b** other rent (pasture, farmland).
28. **Line 25** repairs and maintenance (not improvements; not the home). **Line 26** seeds and plants. **Line 27**
    storage and warehousing. **Line 28** supplies. **Line 29** taxes (real estate and personal property taxes on farm
    assets, employer FICA match, FUTA, highway use tax; not income or self-employment tax). **Line 30** utilities. **Line
    31** veterinary, breeding and medicine.
29. **Lines 32a–32e** other expenses (specify): advertising, the at-risk loss carried in from 2024, bad debts, startup
    costs (up to $5,000, phased out above $50,000), business use of the home (Pub. 587 worksheets), the de minimis safe
    harbor, the §179D deduction, reforestation (up to $10,000, $5,000 MFS, per timber property), legal and professional
    fees, tools, travel and 50% of meals (`p. 8–9`). **Line 32f** — capitalized §263A / preproductive period costs,
    in parentheses, marked "263A".
30. **Line 33** total expenses: lines 10 through 32e, less a negative line 32f.
31. **Line 34** net farm profit or (loss) = line 9 − line 33:
    - a profit and no prior-year unallowed passive loss → line 34;
    - a profit with prior-year unallowed passive losses → figure the allowed amount on Form 8582 first and write "PAL"
      to the left of line 34;
    - a loss → apply the at-risk rules (line 36, Form 6198) and, with line E "No", the passive rules (Form 8582); Form
      461 may limit it further (`p. 9`).
32. **Line 35** reserved for future use.
33. **Line 36** — box 36a "All investment is at risk" or 36b "Some investment is not at risk" (Form 6198 attached). A
    loss not allowed only because of the at-risk rules is a deduction of the activity in 2026 (`p. 10`).

**Part III — Farm Income, Accrual Method** (`f1040sf.pdf p. 2`; `i1040sf.pdf p. 10`)

34. **Line 37** sales of livestock, produce, grains and other products.
35. **Lines 38a / 38b, 39a / 39b, 40a / 40b / 40c** — as lines 3a–5c.
36. **Line 41** crop insurance proceeds. **Line 42** custom hire income. **Line 43** other income (as line 8).
37. **Line 44** = 37 + 38b + 39b + 40a + 40c + 41 + 42 + 43.
38. **Line 45** beginning inventory (not including sales reported on Form 4797); **line 46** cost of livestock and
    products purchased; **line 47** = 45 + 46; **line 48** ending inventory; **line 49** = 47 − 48. Footnote: with the
    unit-livestock-price or farm-price inventory method, if line 48 is larger than line 47, subtract 47 from 48 and add
    the result to line 44.
39. **Line 50** gross income = 44 − 49, entered also on Part I line 9.

**Part IV** — the activity codes (111100 oilseed and grain … 113310 logging) and the list of activities that do not
belong on Schedule F (`f1040sf.pdf p. 2`).

## 7. Special cases and elections

| Case | Rule | Source |
|---|---|---|
| Line E "No" (passive) | A loss may be limited by Form 8582; a profit may free prior passive losses ("PAL"). **Self-employment tax still applies** — Schedule F line 34 goes to Schedule SE line 1a for individuals; only a non-participating **landlord** files Form 4835 instead | `i1040sf.pdf p. 3, 9`; `i1040sse.pdf p. 3–4` |
| Qualified joint venture | Divide every item by interest; each spouse files a separate Schedule F and Schedule SE | `i1040sf.pdf p. 2` |
| Community property, spouses own the farm | May be treated as a sole proprietorship; one participating spouse → all SE earnings to that spouse; both → by distributive shares | `i1040sf.pdf p. 3`; `i1040sse.pdf p. 2` |
| Single-member LLC | File Schedule F; line D gets only the owner's own EIN | `i1040sf.pdf p. 2–3` |
| CCC loan election | Report loan proceeds as income (line 5a); market gain then not on 4b; forfeiture usually not on 5c | `i1040sf.pdf p. 4–5` |
| Crop insurance deferral | Year of damage 2025; check 6c with a statement; all eligible proceeds of the business deferred; 2024 deferrals on 6d | `i1040sf.pdf p. 5` |
| Weather-related livestock sales | May report in the year after the sale | `i1040sf.pdf p. 4` |
| Conservation expenses | 25% of gross income from farming; carry the excess forward | `i1040sf.pdf p. 6` |
| §263A / preproductive expenses | Capitalized total on line 32f in parentheses with "263A"; election to deduct plants with a preproductive period over 2 years (ADS then required) | `i1040sf.pdf p. 5–6, 9` |
| Prepaid farm supplies | Over 50% of other deductible farm expenses: deduct when used | `i1040sf.pdf p. 6` |
| CRP payments and Social Security | A recipient of SS retirement or disability benefits subtracts CRP payments on Schedule SE line 1b; "Don't make any adjustment on Schedule F" | `i1040sf.pdf p. 9`; `i1040sse.pdf p. 3` |
| At-risk / passive / excess business loss | Order: at-risk, passive, then Form 461 ($313,000; $626,000 joint) | `i1040sf.pdf p. 9–10` |
| Farming NOL | Must be carried back 2 years unless the farmer elects to forgo the carryback (Form 172) | `i1040sf.pdf p. 1–2` |
| Chapter 11 debtor | See the Form 1040 and Schedule SE instructions (estate reports income; debtor pays SE tax) | `i1040sf.pdf p. 4, 10`; `i1040sse.pdf p. 2` |
| Farm income averaging | Schedule J may reduce the tax | `i1040sf.pdf p. 2` |
| Estimated tax | No penalty if gross farming or fishing income is at least two-thirds of gross income (2024 or 2025) and the return is filed and tax paid by March 2, 2026 | `i1040sf.pdf p. 3` |
| Nonresident alien | Line 34 on Schedule SE only if covered by a totalization agreement | `i1040sf.pdf p. 9` |

## 8. Married filing jointly / separately

- **Joint return:** a separate Schedule F for each farm, in the name of the spouse who runs it; with a QJV each spouse
  files one for their share (`i1040sf.pdf p. 2`). All farms' line 34 add on Schedule 1 line 6; each spouse's farm and
  business earnings go on that spouse's own Schedule SE (`i1040sse.pdf p. 2`).
- **Separate returns in a community property state:** income tax follows community property law; SE earnings belong to
  the spouse who carried on the farm (`i1040sf.pdf p. 9`: "If you and your spouse had community income and are filing
  separate returns, see the Instructions for Schedule SE"; `i1040sse.pdf p. 2`).
- **Limits per return:** Form 461 threshold $313,000 ($626,000 joint) (`i1040sf.pdf p. 9`); reforestation expensing
  $10,000 per timber property ($5,000 MFS) (`p. 9`).

## 9. Forms to attach or keep

| Form | Filed? |
|---|---|
| Schedule F | Filed, one per farm (two for a QJV) |
| Form 4562 | Filed for depreciation / section 179 / amortization started in 2025 / vehicle information (`i1040sf.pdf p. 2, 6`) |
| CCC loan statement; crop insurance deferral statement | Attached (`i1040sf.pdf p. 4–5`) |
| Form 6198 | Attached with box 36b and a loss (`i1040sf.pdf p. 10`) |
| Form 8582, Form 461, Form 8990, Form 172 | Filed when they apply (`i1040sf.pdf p. 2, 9`) |
| Schedule SE | Filed (see `schedule-se.md`) |
| Statement for extra mortgage interest or shared mortgage | Attached, "See attached" in the margin of line 21a / 21b (`i1040sf.pdf p. 7`) |
| Forms 1099-PATR, 1099-G, CCC-1099-G, 1099-MISC, 1099-A, 1099-C | Kept |

## 10. Where the amount goes next

- **Line 34 → Schedule 1 line 6** ("Farm income or (loss). Attach Schedule F") → Schedule 1 line 10 → **Form 1040 line 8**
  → line 9 → AGI (`i1040sf.pdf p. 9`).
- **Line 34 → Schedule SE line 1a** (with K-1 (Form 1065) box 14 code A of farm partnerships); CRP of a Social Security
  recipient comes back off on line 1b (`i1040sf.pdf p. 9`; `i1040sse.pdf p. 3`). Schedule SE produces Schedule 2 line 4
  and Schedule 1 line 15.
- **Line 9 → Schedule SE Part II** (farm optional method base: "gross farm income" is Schedule F line 9,
  `i1040sse.pdf p. 5`); line 9 is also "gross income from a business" for the filing requirement
  (`i1040gi_ty2025.pdf p. 9`) and gross farming income for the farmer estimated-tax rule (`i1040sf.pdf p. 3`).
- **QBI**: the farm is a trade or business; QBI includes the deductible part of SE tax, SE health insurance and plan
  contributions attributable to it; patrons of specified agricultural or horticultural cooperatives must use Form
  8995-A and take the patron reduction (`i8995.pdf p. 1, 2–3`; `i1040sf.pdf p. 1`).
- **Earned income**: a net profit on line 34 is earned income for the EIC (`i1040sf.pdf p. 9`; EIC Worksheet B line 2a,
  `i1040gi_ty2025.pdf p. 47`); also the base for Schedule 1 lines 16 and 17.
- **Form 461** (excess business loss → Schedule 1 line 8p), **Form 6198**, **Form 8582**.
- **Form 8960 line 4a** takes Schedule 1 line 6; income of a passive farm is net investment income, a farm "where the
  owners meet material participation tests, is not subject to NIIT" (`i8960.pdf p. 5, 8`).
- **Schedule J** (optional farm income averaging).

## 11. Worked example

Sam Grower (000-00-0005), single, runs a grain and cattle farm on the cash method, materially participates, all
investment at risk, not receiving Social Security, no prior-year conservation carryover.

| Line | Item | Amount |
|---|---|---|
| 1a / 1b / 1c | Feeder cattle bought for resale and sold $10,000; their cost $6,000 | $4,000 |
| 2 | Grain and raised calves sold | $80,000 |
| 3a / 3b | Form 1099-PATR $1,500, of which $300 is a patronage dividend on a pickup bought from the co-op | $1,500 / $1,200 |
| 4a / 4b | Agricultural program payments, all taxable | $5,000 / $5,000 |
| 6a / 6b / 6c | Crop insurance received $7,000; $3,000 deferred to 2026 (6c checked) | $7,000 / $4,000 |
| 6d | 2024 crop insurance deferred to 2025 | $2,500 |
| 7 | Custom combining for neighbours | $1,500 |
| 8 | State fuel tax refund | $300 |
| **9** | **Gross income** = 4,000 + 80,000 + 1,200 + 5,000 + 4,000 + 2,500 + 1,500 + 300 | **$98,500** |
| 10 | Car and truck | $3,000 |
| 12 | Conservation paid $30,000; limit 25% × $98,500 = $24,625 (no asset gains) | $24,625 (carry $5,375 to 2026) |
| 14 | Depreciation | $12,000 |
| 16 / 17 | Feed / fertilizer | $15,000 / $6,000 |
| 21a | Mortgage interest | $4,000 |
| 22 | Labor hired | $10,000 |
| 29 / 30 | Taxes / utilities | $2,500 / $1,875 |
| **33** | **Total expenses** | **$79,000** |
| **34** | **Net farm profit** = 98,500 − 79,000 | **$19,500** |

Sam's Schedule 1 line 6 = $19,500. Schedule SE line 1a = $19,500 → line 4a = 19,500 × 0.9235 = $18,008 → line 10 =
18,008 × 12.4% = $2,233, line 11 = 18,008 × 2.9% = $522, line 12 (Schedule 2 line 4) = $2,755, line 13 (Schedule 1
line 15) = $1,378. The $19,500 is QBI before the half-SE-tax reduction.

## 12. 2025 amounts used

| Amount | Value | Source |
|---|---|---|
| Standard mileage rate | 70 cents a mile | `i1040sf.pdf p. 1, 6` |
| Section 179 limit / phase-out start | $2,500,000 / $4,000,000 | `i1040sf.pdf p. 1` |
| Special depreciation allowance | 100% for property acquired after January 19, 2025 (phase-down rules before) | `i1040sf.pdf p. 1, 7` |
| Conservation expense limit | 25% of gross income from farming | `i1040sf.pdf p. 6` |
| Prepaid farm supplies limit | 50% of other deductible farm expenses | `i1040sf.pdf p. 6` |
| Small business taxpayer (§263A, cash method) | Gross receipts $31 million or less | `i1040sf.pdf p. 5` |
| Startup costs | $5,000, reduced above $50,000; rest over 180 months | `i1040sf.pdf p. 8` |
| Reforestation expensing | $10,000 per timber property ($5,000 MFS); rest over 84 months | `i1040sf.pdf p. 9` |
| Excess business loss threshold | $313,000 ($626,000 joint) | `i1040sf.pdf p. 9` |
| Form 1099 filing threshold referenced | $600 | `i1040sf.pdf p. 4` |
| Farmer estimated tax | Two-thirds test; file and pay by March 2, 2026 | `i1040sf.pdf p. 3` |

## 13. IRS sources

| Document | Pages | Used for |
|---|---|---|
| `i1040sf.pdf` (2025 Instructions for Schedule F) | 1 | What's new: mileage, bonus, §179, Form 461, QBI, NOL |
| | 2 | Purpose, other forms, Form 4835 / Schedule E, QJV |
| | 3 | Community income, estimated tax, lines B–E |
| | 4 | Line F, Part I, 1099 table, lines 3–5 |
| | 5 | Lines 5c–6d, line 8, Part II, §263A, small business taxpayer |
| | 6 | Preproductive, prepaid supplies, lines 10, 12, 13 |
| | 7 | Lines 14–21 |
| | 8 | Lines 22–32 |
| | 9 | Line 32 items, excess business loss, lines 33–34, CRP, EIC |
| | 10 | Line 36, Part III |
| `f1040sf.pdf` (2025 Schedule F, in `docs\IRS-Forms\`) | 1–2 | Line captions, Part III footnote, Part IV codes and exclusions |
| `i1040sse.pdf` (2025 Instructions for Schedule SE) | 2 | Community income |
| | 3 | Share farming, line 1b CRP |
| | 4 | Farm rentals of non-participating landlords excluded |
| | 5 | Gross farm income for the farm optional method |
| `i1040gi_ty2025.pdf` | 9 | Gross income from a business (Schedule F line 9) |
| | 47 | EIC Worksheet B line 2a (Schedule F line 34) |
| `i8995.pdf` | 1, 2–3 | QBI components, cooperative patrons |
| `i8960.pdf` | 5, 8 | Passive farm income is net investment income; line 4a takes Schedule 1 line 6 |
