# Schedule SE (Form 1040) — Self-Employment Tax

Tax year 2025. What the IRS requires. How the app does it: `C:\us-tax\new_knowledge\forms\schedule-se.md`. Picture:
`C:\us-tax\new_flowcharts\forms\schedule-se.md`.

Sources. The rules come from the 2025 Instructions for Schedule SE (`i1040sse.pdf`, 5 pages, "Oct 23, 2025"), Pub. 334
(2025) chapter 10 (`p334.pdf`) and the 2025 Form 1040 instructions (`i1040gi_ty2025.pdf`) in `C:\us-tax\docs\books\`.
The 2025 Schedule SE form itself is **not** in `docs\books\`; the only copy on disk is the **2024** form
(`C:\us-tax\docs\IRS-Forms\Schedule SE.pdf`, "Schedule SE (Form 1040) 2024"). Its line structure (1a … 17) is the one
the 2025 instructions refer to, so line captions below are quoted from it as `f1040sse-2024 p. N`, with every 2024
dollar figure replaced by the 2025 figure from the 2025 instructions. Pub. 225 and Pub. 517 are not in `docs\books\`.

---

## 1. At a glance

Schedule SE figures the social security and Medicare tax of a self-employed person. Net profit from all of the person's
farms (line 1a) and other businesses (line 2), less Conservation Reserve Program payments of a Social Security
recipient (line 1b), is combined (line 3) and multiplied by **92.35%** (line 4a). If the result — plus any optional-
method amount (line 4b) — is under **$400**, there is no tax (line 4c) unless the person also had **church employee
income** of $108.28 or more (line 5). The 12.4% social security part applies only up to the **2025 wage base of
$176,100**, reduced by the person's social security wages and tips already taxed (W-2 boxes 3 and 7, railroad tier 1
compensation, Form 4137 line 10, Form 8919 line 10). The 2.9% Medicare part applies to all net earnings. The result
(line 12) goes to **Schedule 2 line 4**; half of it (line 13) is deducted on **Schedule 1 line 15**.

```text
line 3  = 1a + 1b + 2                        (1b is a negative: CRP of a Social Security recipient)
line 4a = line 3 × 0.9235 if line 3 > 0, else line 3
line 4c = 4a + 4b (optional methods);  if < $400 → no SE tax  (exception: church employee income → 4c = 0, continue)
line 5b = line 5a (church employee income) × 0.9235; if < $100 → 0
line 6  = 4c + 5b
line 9  = max(0, $176,100 − (8a W-2 boxes 3 + 7 and RRTA tier 1 + 8b Form 4137 line 10 + 8c Form 8919 line 10))
line 10 = min(line 6, line 9) × 12.4%      line 11 = line 6 × 2.9%
line 12 = 10 + 11  → Schedule 2 line 4       line 13 = line 12 × 50%  → Schedule 1 line 15
Part II: farm optional   line 15 = min(⅔ × gross farm income, $7,240)
         nonfarm optional line 17 = min(⅔ × gross nonfarm income, line 16 = $7,240 − line 15)
```

Terms used below:

- **Net earnings from self-employment (NESE)** — the person's net profit from a trade or business (farm or nonfarm),
  partnership earnings from Schedule K-1 (Form 1065) box 14 code A, and the other items in the instructions' lists,
  multiplied by 92.35% (`i1040sse.pdf p. 3–4`; `p334.pdf p. 45`: "multiply your self-employment earnings by 92.35%
  (0.9235)").
- **Church employee income** — "wages you received as an employee (other than as a minister, member of a religious
  order, or Christian Science practitioner) of a church or qualified church-controlled organization that has a
  certificate in effect electing an exemption from employer social security and Medicare taxes" (`i1040sse.pdf p. 1`).
- **Optional methods** — two elections (farm and nonfarm) that let a person with a loss or small profit report a fixed
  share of gross income as net earnings to earn social security credit (`i1040sse.pdf p. 4–5`).
- **CRP** — Conservation Reserve Program payments.
- **Form 4361 / Form 4029** — approved exemptions for ministers (on ministerial earnings) and for members of certain
  religious sects (on all SE income).

## 2. The IRS wording

**Purpose** (`i1040sse.pdf p. 1`): "Use Schedule SE (Form 1040) to figure the tax due on net earnings from
self-employment. … This tax applies no matter how old you are and even if you are already getting social security or
Medicare benefits."

**Who must file** (`i1040sse.pdf p. 1`): "You must file Schedule SE if: • The amount on line 4c of Schedule SE is $400
or more, or • You had church employee income of $108.28 or more."

**2025 wage base** (`i1040sse.pdf p. 1`): "For 2025, the maximum amount of self-employment income subject to social
security tax is $176,100." (`p334.pdf p. 43–44`): "Only the first $176,100 of your combined wages, tips, and net earnings
in 2025 is subject to any combination of the 12.4% social security part of SE tax, social security tax, or the Tier 1
part of railroad retirement tax. … If your wages and tips are subject to either social security tax or the Tier 1 part
of railroad retirement tax, or both, and total at least $176,100, don't pay the 12.4% social security part of the SE tax
on any of your net earnings. However, you must pay the 2.9% Medicare part of SE tax on all your net earnings."

**Line captions** (`f1040sse-2024 p. 1`, structure; 2025 figures substituted):

> "1a Net farm profit or (loss) from Schedule F, line 34, and farm partnerships, Schedule K-1 (Form 1065), box 14,
> code A" · "b If you received social security retirement or disability benefits, enter the amount of Conservation
> Reserve Program payments included on Schedule F, line 4b, or listed on Schedule K-1 (Form 1065), box 20, code AQ" ·
> "2 Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box 14, code A (other than farming)"
> · "3 Combine lines 1a, 1b, and 2" · "4a If line 3 is more than zero, multiply line 3 by 92.35% (0.9235). Otherwise,
> enter amount from line 3" · "4b If you elect one or both of the optional methods, enter the total of lines 15 and 17
> here" · "4c Combine lines 4a and 4b. If less than $400, stop; you don't owe self-employment tax. Exception: If less
> than $400 and you had church employee income, enter -0- and continue" · "5a Enter your church employee income from
> Form W-2" · "5b Multiply line 5a by 92.35% (0.9235). If less than $100, enter -0-" · "6 Add lines 4c and 5b" · "7
> Maximum amount of combined wages and self-employment earnings subject to social security tax or the 6.2% portion of
> the 7.65% railroad retirement (tier 1) tax" [2025: $176,100] · "8a Total social security wages and tips (total of
> boxes 3 and 7 on Form(s) W-2) and railroad retirement (tier 1) compensation" · "b Unreported tips subject to social
> security tax from Form 4137, line 10" · "c Wages subject to social security tax from Form 8919, line 10" · "d Add
> lines 8a, 8b, and 8c" · "9 Subtract line 8d from line 7. If zero or less, enter -0-" · "10 Multiply the smaller of
> line 6 or line 9 by 12.4% (0.124)" · "11 Multiply line 6 by 2.9% (0.029)" · "12 Self-employment tax. Add lines 10 and
> 11. Enter here and on Schedule 2 (Form 1040), line 4" · "13 Deduction for one-half of self-employment tax. Multiply
> line 12 by 50% (0.50). Enter here and on Schedule 1 (Form 1040), line 15".

**Schedule 2 line 4** (`i1040gi_ty2025.pdf p. 112`): "On line 4, enter the amount of the tax due on net earning from
self-employment from Schedule SE, line 12. If you filed Form 4361, received IRS approval, and had no other income
subject to self-employment tax, check box 1 on line 4. If you filed Form 4029 and received IRS approval, check box 2 …
[for an exempt foreign-country earner] check box 3, and enter "EAS" … [for exempt community income] check box 3 and
enter "ECI" … [notary fees] check box 3 and enter "EN"".

**Schedule 1 line 15** (`i1040gi_ty2025.pdf p. 93`): "If you were self-employed and owe self-employment tax, fill in
Schedule SE to figure the amount of your deduction. The deductible part of your self-employment tax is on line 13 of
Schedule SE."

## 3. What goes on this form

Net earnings (`i1040sse.pdf p. 3–4`):

- Net profit or loss from every Schedule F (line 1a) and Schedule C (line 2); losses in one business reduce income from
  another ("More Than One Business", `p. 2`).
- Partnership Schedule K-1 (Form 1065) box 14 code A (farm partnerships on line 1a, others on line 2); limited partners
  only guaranteed payments for services (`p. 3`).
- Ministers, members of a religious order without a vow of poverty and Christian Science practitioners (unless exempt
  by Form 4361): salaries and fees, the rental value of a home or housing allowance (with utilities), meals and lodging
  furnished for the employer's convenience — on line 2, less allowable unreimbursed business expenses of an employee
  minister (`p. 1`).
- U.S. citizens employed in the U.S. or a territory by a foreign government or international organization — line 2
  (`p. 2`).
- Other included items: farm rent of a materially participating landlord; USDA cash or payment-in-kind for a subsidy or
  conservation reserve program; space rented with substantial services; newspaper sales by those 18 or older; direct
  sellers; certain insurance agents' renewal / deferred commissions; small-boat fishing crews; fee-basis state or local
  officials; business interest; director fees; section 179 / 280F recapture when business use fell to 50% or less;
  professional fiduciary fees; section 1256 gains of options / commodities dealers (`p. 3–4`).
- Church employee income (line 5a) — reported here, never on line 2 (`p. 1`).
- A chapter 11 debtor's net profit or loss (written on the dotted line of line 3) (`p. 2`).

## 4. What does not go here

| Look-alike amount | Treatment | Source |
|---|---|---|
| Employee wages subject to social security / Medicare (including RRTA) | Not NESE; they reduce the wage base on line 8a | `i1040sse.pdf p. 4` |
| Statutory employee net profit (Schedule C with the box checked) | Not on line 2; their W-2 SS wages go on line 8a | `i1040sse.pdf p. 4` |
| Notary public fees | Not NESE; "Exempt—Notary" on the dotted line of line 3, subtracted | `i1040sse.pdf p. 4` |
| Real estate rents (not a dealer), farm rent of a non-participating landlord (Form 4835) | Not NESE | `i1040sse.pdf p. 4` |
| CRP payments of a Social Security recipient | Subtracted on line 1b | `i1040sse.pdf p. 3–4` |
| Dividends, interest on securities (non-dealer); capital gains; gains on business property not held for sale; timber / coal / iron ore | Not NESE | `i1040sse.pdf p. 4` |
| Net operating losses from other years | Not NESE | `i1040sse.pdf p. 4` |
| Retired partner's lifetime retirement payments; qualifying insurance-agent termination payments | Not NESE | `i1040sse.pdf p. 4` |
| Church-plan retirement benefits and post-retirement housing of a minister | Not on line 2 | `i1040sse.pdf p. 1` |
| Ministerial income of an approved Form 4361 filer; all SE income of an approved Form 4029 member | Exempt (Schedule 2 line 4 box 1 / box 2) | `i1040sse.pdf p. 1–2` |
| Foreign earned income exclusion | Cannot reduce NESE (also for ministers abroad) | `i1040sse.pdf p. 1–2` |
| Self-employment income exempt under a totalization agreement | No Schedule SE; statement attached, Schedule 2 line 4 box 3 "EAS" | `i1040sse.pdf p. 2`; `i1040gi_ty2025.pdf p. 112` |
| Additional Medicare Tax (0.9%) | Form 8959, not Schedule SE | `i1040sse.pdf p. 3` |

## 5. Where the numbers come from

| Source | Box / line | Schedule SE line |
|---|---|---|
| Schedule F | Line 34 (each farm) | 1a |
| Schedule K-1 (Form 1065) | Box 14 code A (farm / nonfarm); box 14 code B (gross farming) and code C (gross nonfarm) for the optional methods; box 20 code AQ (CRP) | 1a / 2; 15 / 17; 1b |
| Schedule F / K-1 | CRP payments of a Social Security recipient | 1b |
| Schedule C | Line 31 (not statutory employee); line 7 (gross for the nonfarm optional method) | 2; 17 |
| Minister's records, W-2 | Salary, housing allowance, meals and lodging, less unreimbursed expenses | 2 |
| Form W-2 (church employer with the exemption certificate) | Box 1 church employee wages | 5a |
| Form W-2 | Boxes 3 and 7 (all employers, statutory employees included); RRTA tier 1 compensation | 8a |
| Form 4137 | Line 10 | 8b |
| Form 8919 | Line 10 | 8c |
| Schedule F line 9 | Gross farm income | 15 |

## 6. How to figure it, line by line

**Who completes it.** Each person with self-employment income completes their own Schedule SE; on a joint return
"If both spouses have self-employment income, each must file a separate Schedule SE" and the combined tax goes on
Schedule 2 line 4 (`i1040sse.pdf p. 2`; `p334.pdf p. 47`: "you can't file a joint Schedule SE").

**Line A** — a minister / religious-order member / Christian Science practitioner with an approved Form 4361 who also had
$400 or more of other net earnings checks line A and continues (`i1040sse.pdf p. 1`).

**Part I — Self-Employment Tax**

1. **Only church employee income?** Skip lines 1–4b, enter -0- on line 4c and go to line 5a (`i1040sse.pdf p. 3`).
2. **Line 1a** — Schedule F line 34 plus farm-partnership K-1 box 14 code A. Skip lines 1a and 1b when using the farm
   optional method (`f1040sse-2024 p. 1`).
3. **Line 1b** — "If you were receiving social security retirement or social security disability benefits at the time
   you received your Conservation Reserve Program (CRP) payment(s), enter the amount of your taxable CRP payment(s) on
   line 1b" (as a negative) (`i1040sse.pdf p. 3`).
4. **Line 2** — Schedule C line 31 (not statutory-employee profit, less notary profit), nonfarm K-1 box 14 code A, and
   the minister / foreign-government / other included items. Skip when using the nonfarm optional method.
5. **Line 3** — combine 1a, 1b and 2. Add a chapter 11 debtor's net profit or loss written on the dotted line; subtract
   "Exempt—Notary" profit; adjust for community income ("Community income taxed to spouse" added by the spouse who ran
   the business; "Exempt community income" subtracted by the other spouse) (`i1040sse.pdf p. 2, 4`).
6. **Line 4a** — if line 3 is more than zero, line 3 × 92.35%; otherwise line 3 itself.
7. **Line 4b** — the total of lines 15 and 17 (optional methods).
8. **Line 4c** — 4a + 4b. **If less than $400, stop** — no SE tax — unless there is church employee income, in which
   case enter -0- and continue. CRP rule: "If both lines 4a and 4c are less than $400 and you have an amount on line
   1b, combine lines 1a and 2. If the total … is $434 or more, file Schedule SE (completed through line 4c) … Enter -0-
   on Schedule 2 (Form 1040), line 4" (`i1040sse.pdf p. 3`). Pub. 334 Example 4: net earnings under $400 under both the
   regular and the nonfarm optional method → no SE tax (`p334.pdf p. 46`).
9. **Line 5a** — church employee income from Form W-2. **Line 5b** — line 5a × 92.35%; if less than $100, -0-. (A W-2
   of $108.28 is the filing trigger, `i1040sse.pdf p. 1`.)
10. **Line 6** — 4c + 5b.
11. **Line 7** — $176,100 for 2025 (`i1040sse.pdf p. 1`).
12. **Line 8a** — social security wages and tips (W-2 boxes 3 and 7) and railroad retirement tier 1 compensation; if
    $176,100 or more, skip to line 11. Include statutory-employee W-2 social security wages (`i1040sse.pdf p. 4`).
    **Line 8b** — Form 4137 line 10. **Line 8c** — Form 8919 line 10. **Line 8d** — 8a + 8b + 8c.
13. **Line 9** — line 7 − line 8d, not below zero.
14. **Line 10** — the smaller of line 6 or line 9 × 12.4%. **Line 11** — line 6 × 2.9%.
15. **Line 12** — 10 + 11 → Schedule 2 line 4.
16. **Line 13** — line 12 × 50% → Schedule 1 line 15 (not for Form 1040-SS filers, `i1040sse.pdf p. 3`).

Rounding: if the return is rounded, all amounts are rounded (`i1040gi_ty2025.pdf p. 23`); each line above is an entry
space, so each is rounded and the later lines use the rounded figures.

**Part II — Optional Methods To Figure Net Earnings** (`i1040sse.pdf p. 4–5`)

17. **Farm optional method** — available if "your gross farm income was $10,860 or less or your net farm profits were
    less than $7,840". Net farm profits = Schedule F line 34 + farm K-1 box 14 code A − the CRP that would have been on
    line 1b. Gross farm income = Schedule F line 9 + K-1 box 14 code B. "There is no limit on how many years you can use
    this method." **Line 14** — $7,240 (2025 maximum). **Line 15** — the smaller of ⅔ of gross farm income (not less
    than zero) or $7,240; also included on line 4b. The method "can increase or decrease your net earnings from farm
    self-employment even if the farming business had a loss."
18. **Nonfarm optional method** — available if net nonfarm profits (Schedule C line 31 + nonfarm K-1 box 14 code A) were
    less than $7,840 **and** less than 72.189% of gross nonfarm income (Schedule C line 7 + K-1 box 14 code C), and the
    person was **regularly self-employed** (actual NESE of $400 or more in 2 of the 3 preceding years), and has used it
    **fewer than 5 times**. **Line 16** — line 14 − line 15. **Line 17** — the smaller of ⅔ of gross nonfarm income (not
    less than zero) or line 16; "you can't report less than your actual net earnings from nonfarm self-employment."
19. **Both methods** — "you can report less than your total actual net earnings from farm and nonfarm self-employment,
    but you can't report less than your actual net earnings from nonfarm self-employment alone"; combined not more than
    $7,240 (`i1040sse.pdf p. 5`; `p334.pdf p. 46–47`, Table 10-3).
20. A partner's share of gross income follows the partnership agreement (guaranteed payments plus the share of gross
    after guaranteed payments; limited partners only guaranteed payments for services) (`i1040sse.pdf p. 5`).

Note on a source inconsistency: Pub. 334 Table 10-1 (`p334.pdf p. 46`) prints "more than $10,860 → $7,840" for nonfarm
net earnings, but its own Example 1 on the same page and the 2025 Schedule SE instructions give **$7,240** as the
maximum; the instructions govern.

## 7. Special cases and elections

| Case | Rule | Source |
|---|---|---|
| Ministers etc. | SE tax on ministerial earnings unless Form 4361 approved; housing allowance / rental value and convenience meals and lodging included; unreimbursed employee business expenses subtracted on line 2 with an explanation; Form 2031 election irrevocable | `i1040sse.pdf p. 1` |
| Form 4361 with other earnings ≥ $400 | Check line A; Schedule SE on the other earnings | `i1040sse.pdf p. 1` |
| Form 4361 / 4029, no other SE income | No Schedule SE; Schedule 2 line 4 box 1 / box 2 | `i1040sse.pdf p. 1–2`; `i1040gi_ty2025.pdf p. 112` |
| Church employee income | $108.28 filing trigger; line 5a, not line 2; no $400 floor | `i1040sse.pdf p. 1, 3` |
| Statutory employee | Profit not on line 2; W-2 social security wages on line 8a | `i1040sse.pdf p. 4` |
| Notary public | Excluded; "Exempt—Notary" on line 3 or Schedule 2 line 4 box 3 "EN" | `i1040sse.pdf p. 4`; `i1040gi_ty2025.pdf p. 112` |
| CRP and Social Security | Line 1b; $434 rule when 4a and 4c fall under $400 | `i1040sse.pdf p. 3` |
| U.S. citizen / resident abroad | SE tax applies; FEIE does not reduce it; totalization agreement → exempt with a foreign certificate ("EAS") | `i1040sse.pdf p. 2` |
| Foreign government / international organization employee in the U.S. or a territory | SE tax on that income, line 2 | `i1040sse.pdf p. 2` |
| Nonresident alien | Only if a totalization agreement covers them under U.S. social security | `i1040sse.pdf p. 2` |
| Chapter 11 debtor | Debtor pays SE tax on the business net profit taxed to the estate; dotted line of line 3 | `i1040sse.pdf p. 2` |
| Community income | Earnings of the spouse who carried on the business; MFS: "Community income taxed to spouse" / "Exempt community income"; partnership shares never split | `i1040sse.pdf p. 2–3` |
| Qualified joint venture | Each spouse files a separate Schedule C or F and Schedule SE; rental QJV not SE income; farm-rental QJV uses two Forms 4835 | `i1040sse.pdf p. 2–3` |
| Partnership | Box 14 code A (general partners reduce by certain expenses and attach an explanation); deceased partner's share through the month of death | `i1040sse.pdf p. 3` |
| Optional methods | Changeable by Form 1040-X; may raise SE tax; may raise EIC / ACTC / child-care credit when actual NESE is under $7,240; also usable for the SE health insurance deduction | `i1040sse.pdf p. 4–5` |
| Additional Medicare Tax | 0.9% on line 6 of all Schedules SE above $250,000 MFJ / $125,000 MFS / $200,000 others, reduced by wages; Form 8959 | `i1040sse.pdf p. 3` |
| Fiscal year | Rate and base in effect when the year begins | `i1040sse.pdf p. 3` |

## 8. Married filing jointly / separately

- **Joint return:** a separate Schedule SE for each spouse with self-employment income; never a joint Schedule SE; each
  spouse's own wage base (line 8a uses only that spouse's wages); line 12 amounts add on Schedule 2 line 4 and line 13
  amounts on Schedule 1 line 15 (`i1040sse.pdf p. 2`; `p334.pdf p. 47`).
- **Separate returns:** each spouse's own businesses; in a community property state the SE earnings stay with the spouse
  who carried on the business (or follow distributive shares when both participate), with the dotted-line adjustments
  of line 3 (`i1040sse.pdf p. 2`).
- **Per-person limits:** the $400 floor, the $176,100 base and the $7,240 optional-method maximum are per person.

## 9. Forms to attach or keep

| Form | Filed? |
|---|---|
| Schedule SE | Filed for each person with line 4c ≥ $400 or church employee income ≥ $108.28, or using an optional method; also the $434 CRP case (through line 4c) (`i1040sse.pdf p. 1, 3`) |
| Explanation of reduced K-1 box 14 amount; minister's expense explanation | Attached (`i1040sse.pdf p. 1, 3`) |
| Foreign social security certificate (totalization) | Attached instead of Schedule SE (`i1040sse.pdf p. 2`) |
| Form 8959 | Filed when Additional Medicare Tax applies (`i1040sse.pdf p. 3`) |

## 10. Where the amount goes next

- **Line 12 → Schedule 2 line 4** → Schedule 2 line 21 → Form 1040 line 23 (other taxes) (`i1040gi_ty2025.pdf p. 112`).
- **Line 13 → Schedule 1 line 15** → Schedule 1 line 26 → Form 1040 line 10 → AGI (`i1040gi_ty2025.pdf p. 93`).
- **Line 6 → Form 8959 Part II** (Additional Medicare Tax) (`i1040sse.pdf p. 3`).
- **Line 3 and line 4b → EIC** (Worksheet B uses Schedule SE line 3 and lines 4b and 5a, and subtracts line 13,
  `i1040gi_ty2025.pdf p. 47`), Schedule 8812 and Form 2441 earned income.
- **Line 13 → QBI** ("deductible part of self-employment tax" attributable to the business reduces QBI, `i8995.pdf
  p. 2`), Schedule 1 line 16 / 17 limits (net profit minus Schedule 1 line 15), IRA compensation.
- **Line 4b** replaces the net profit in the Self-Employed Health Insurance Deduction Worksheet when an optional method
  is used (`i1040gi_ty2025.pdf p. 94`).

## 11. Worked example

Pat Example (000-00-0006) and Lee Example (000-00-0007) file jointly.

**Pat:** Schedule C line 31 $60,000; Schedule F line 34 ($5,000); W-2 box 3 $150,000, box 7 $0; Form 4137 line 10
$2,000.

| Line | Figure | Amount |
|---|---|---|
| 1a | Schedule F loss | (5,000) |
| 2 | Schedule C | 60,000 |
| 3 | Combine | 55,000 |
| 4a | 55,000 × 0.9235 = 50,792.50 | 50,793 |
| 4c / 6 | No optional method, no church income | 50,793 |
| 7 | 2025 base | 176,100 |
| 8a / 8b / 8d | 150,000 + 2,000 | 152,000 |
| 9 | 176,100 − 152,000 | 24,100 |
| 10 | 24,100 × 12.4% = 2,988.40 | 2,988 |
| 11 | 50,793 × 2.9% = 1,473.00 | 1,473 |
| 12 | 2,988 + 1,473 | **4,461** |
| 13 | 4,461 × 50% = 2,230.50 | **2,231** |

**Lee:** church employee W-2 box 1 $1,000 (no box 3); Schedule C line 31 $300.

| Line | Figure | Amount |
|---|---|---|
| 2 / 3 | Schedule C | 300 |
| 4a | 300 × 0.9235 = 277.05 | 277 |
| 4c | Less than $400 but church income → -0- | 0 |
| 5a / 5b | 1,000 × 0.9235 = 923.50 | 924 |
| 6 | 0 + 924 | 924 |
| 9 | 176,100 − 0 | 176,100 |
| 10 / 11 | 924 × 12.4% = 114.58; 924 × 2.9% = 26.80 | 115 / 27 |
| 12 / 13 | | **142** / **71** |

Schedule 2 line 4 = 4,461 + 142 = **$4,603**; Schedule 1 line 15 = 2,231 + 71 = **$2,302**.

Optional method variant: if Pat's only business were a farm with gross income (Schedule F line 9) of $9,000 and a net
loss of ($1,000), Pat could elect the farm optional method: line 15 = the smaller of ⅔ × 9,000 = 6,000 or 7,240 =
**$6,000** on line 4b; line 4c = 6,000; SE tax = 6,000 × 15.3% split as 744 + 174 = $918.

## 12. 2025 amounts used

| Amount | Value | Source |
|---|---|---|
| Social security wage base (line 7) | $176,100 | `i1040sse.pdf p. 1`; `p334.pdf p. 43–44` |
| Net-earnings factor | 92.35% | `p334.pdf p. 45`; `f1040sse-2024 p. 1` |
| Rates | 12.4% social security + 2.9% Medicare = 15.3% | `p334.pdf p. 43` |
| Filing floor | $400 of line 4c | `i1040sse.pdf p. 1` |
| Church employee income trigger / line 5b floor | $108.28 / $100 | `i1040sse.pdf p. 1`; `f1040sse-2024 p. 1` |
| CRP filing rule | $434 | `i1040sse.pdf p. 3` |
| Optional methods: maximum | $7,240 | `i1040sse.pdf p. 5` |
| Farm optional: gross farm income ceiling / net farm profit ceiling | $10,860 / $7,840 | `i1040sse.pdf p. 5` |
| Nonfarm optional: net profit ceiling / share of gross | $7,840 / 72.189% | `i1040sse.pdf p. 5` |
| Nonfarm optional: prior years / lifetime | $400 in 2 of 3 prior years / 5 years | `i1040sse.pdf p. 5` |
| Credit benefit hint | Actual NESE under $7,240 | `i1040sse.pdf p. 4` |
| Additional Medicare thresholds | $250,000 MFJ; $125,000 MFS; $200,000 others | `i1040sse.pdf p. 3` |

## 13. IRS sources

| Document | Pages | Used for |
|---|---|---|
| `i1040sse.pdf` (2025 Instructions for Schedule SE) | 1 | 2025 base, who must file, church employees, ministers |
| | 2 | Religious sects, foreign governments, citizens abroad, nonresident aliens, chapter 11, more than one business, joint returns, community income |
| | 3 | QJV, line instructions, church-only, line 1b, lines 4a–4c, Additional Medicare, partnership income, share farming |
| | 4 | Included and excluded items, statutory employees, why use optional methods |
| | 5 | Farm and nonfarm optional methods, both methods |
| `p334.pdf` (Pub. 334, 2025) | 43–44 | Who must pay, rate, wage base, church employee, special rules |
| | 45 | Methods, regular method (92.35%), nonfarm optional tests |
| | 46 | Table 10-1 (inconsistent $7,840 figure), examples |
| | 47 | Both methods ($7,240), reporting, joint returns, more than one business |
| `i1040gi_ty2025.pdf` | 11 | Filing requirement: $400 / $108.28 |
| | 23 | Rounding |
| | 47 | EIC Worksheet B |
| | 93–94 | Schedule 1 lines 15 and 17 |
| | 112 | Schedule 2 line 4 and its boxes |
| `C:\us-tax\docs\IRS-Forms\Schedule SE.pdf` (2024 form, structure only) | 1–2 | Line captions and Part II layout |
| `i8995.pdf` | 2 | Deductible part of SE tax reduces QBI |
