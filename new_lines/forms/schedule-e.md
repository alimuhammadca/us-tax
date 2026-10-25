# Schedule E (Form 1040) — Supplemental Income and Loss

Tax year 2025. What the IRS requires. How the app does it: `C:\us-tax\new_knowledge\forms\schedule-e.md`. Picture:
`C:\us-tax\new_flowcharts\forms\schedule-e.md`.

The 2025 form is quoted from `f1040se.pdf` (Schedule E (Form 1040) 2025, "Created 5/6/25", kept in
`C:\us-tax\docs\IRS-Forms\`); the rules from the **2025 Instructions for Schedule E** (`i1040se.pdf`, in
`C:\us-tax\docs\books\`), the **2025 Instructions for Form 8582** (`i8582.pdf`), the partner's / shareholder's /
beneficiary's instructions for Schedule K-1 (`i1065sk1.pdf`, `i1120ssk.pdf`, `i1041sk1.pdf`) and the Form 4835 form
(`f4835.pdf`). Pub. 527 (Residential Rental Property) and Pub. 925 (Passive Activity and At-Risk Rules) are **not** in
`docs\books\`; where the instructions send the reader there (the vacation-home worksheet, recharacterization, PTP
detail) this file says so and stops. Passive-loss detail is in `forms\8582.md`, at-risk detail in `forms\6198.md`,
farm rentals in `forms\4835.md`.

---

## 1. At a glance

Schedule E collects five kinds of "supplemental" income or loss and totals them for **Schedule 1 line 5**:

| Part | What | Total line |
|---|---|---|
| I | Rental real estate and royalties you own directly (one column per property) | line 26 |
| II | Your share from partnerships and S corporations (Schedule K-1 (Form 1065) / (Form 1120-S)) | line 32 |
| III | Your share from estates and trusts (Schedule K-1 (Form 1041)) | line 37 |
| IV | Residual interests in REMICs (Schedule Q (Form 1066)) | line 39 |
| V | Farm rental from Form 4835 (line 40), the total (line 41) and two reconciliations (lines 42, 43) | line 41 |

```text
Part I, per property:  line 21 = (line 3 rents + line 4 royalties) − line 20 (lines 5–19)
                       line 22 = deductible rental real estate loss after Form 6198 / Form 8582 (blank for royalties)
line 26 = line 24 (positive line 21 amounts) + line 25 (royalty losses from line 21 + rental losses from line 22)
line 32 = line 30 (columns (h) + (k)) − line 31 (columns (g) + (i) + (j))
line 37 = line 35 (columns (d) + (f)) − line 36 (columns (c) + (e))
line 39 = REMIC columns (d) + (e)  (column (c) excess inclusion is NOT added)
line 41 = line 26 + line 32 + line 37 + line 39 + line 40          → Schedule 1 (Form 1040) line 5
```

Before a loss reaches Schedule E it passes up to four limits, in this order: **basis** (partnerships and
S corporations), **at risk** (Form 6198), **passive activity** (Form 8582), and afterwards **excess business loss**
(Form 461, whose disallowed part is added back on Schedule 1 line 8p and is *not* shown on Schedule E)
(`i1040se.pdf p. 2–3, 8`).

Terms used below:

- **Passive activity** — "any business activity in which you did not materially participate and any rental activity,
  except as explained later" (`i1040se.pdf p. 3`). Its losses generally offset only passive income (Form 8582).
- **Active participation** — a lighter test than material participation (approving tenants, setting rents, approving
  repairs); it unlocks the $25,000 special allowance for rental real estate (`i1040se.pdf p. 4`).
- **Material participation** — the seven hour-based / facts tests in `i8582.pdf p. 5`.
- **Real estate professional** — more than half of your personal services and more than 750 hours in real property
  trades or businesses in which you materially participated (`i1040se.pdf p. 3`).
- **Dwelling unit used as a home** — personal use of more than the greater of 14 days or 10% of the fair-rental days
  (`i1040se.pdf p. 5`).
- **QJV (qualified joint venture)** — spouses who are the only members of a jointly owned and operated rental
  real estate business, file jointly, and elect to report it directly instead of on Form 1065 (`i1040se.pdf p. 2`).
- **REMIC** — real estate mortgage investment conduit; a *residual* interest holder reports on Part IV.

## 2. The IRS wording

**Form heading** (`f1040se.pdf p. 1`): "Supplemental Income and Loss (From rental real estate, royalties,
partnerships, S corporations, estates, trusts, REMICs, etc.) … Attach to Form 1040, 1040-SR, 1040-NR, or 1041.
… Attachment Sequence No. 13".

**Part I note** (`f1040se.pdf p. 1`): "If you are in the business of renting personal property, use Schedule C. …
If you are an individual, report farm rental income or loss from Form 4835 on page 2, line 40."

**Line 26** (`f1040se.pdf p. 1`): "Total rental real estate and royalty income or (loss). Combine lines 24 and 25.
Enter the result here. If Parts II, III, and IV, and line 40 on page 2 do not apply to you, also enter this amount on
Schedule 1 (Form 1040), line 5. Otherwise, include this amount in the total on line 41 on page 2."

**Line 41** (`f1040se.pdf p. 2`): "Total income or (loss). Combine lines 26, 32, 37, 39, and 40. Enter the result here
and on Schedule 1 (Form 1040), line 5."

**Limitation on losses** (`i1040se.pdf p. 2–3`):

> "If you report a loss from rental real estate or royalties in Part I, a loss from a partnership or S corporation in
> Part II, or a loss from an estate or trust in Part III, your loss may be reduced or not allowed this year. …
> • Basis rules apply to losses from a partnership or S corporation. … • At-risk rules apply to losses from rental
> real estate or royalties. They also apply to losses from a partnership, S corporation, estate, or trust. …
> • Passive activity loss rules apply to losses from rental real estate. They also apply to losses from a partnership,
> S corporation, estate, or trust. … • Excess business loss rules apply … Any limitation to your loss resulting from
> these rules will not be reflected on your Schedule E."

**Passive activity loss rules** (`i1040se.pdf p. 3`): "These rules apply to losses in Parts I, II, and III, and line 40
of Schedule E. Losses from passive activities may be subject first to the at-risk rules. Losses deductible under the
at-risk rules are then subject to the passive activity loss rules."

**Not passive** (`i1040se.pdf p. 4`): "The rental of a dwelling unit that you used as a home is not subject to the
passive loss limitation rules." … "Royalty income not derived in the ordinary course of a trade or business reported on
Schedule E in most cases is not considered income from a passive activity."

**Line 2** (`i1040se.pdf p. 5`): "You used the unit as a home if your personal use of the unit was more than the
greater of: • 14 days, or • 10% of the total days it was rented to others at a fair rental price. … If you did use the
unit as a home and rented the unit out for fewer than 15 days in 2025, do not report the rental income and do not
deduct any rental expenses. … If you did use the unit as a home and rented the unit out for 15 or more days in 2025,
you may not be able to deduct all your rental expenses. See Pub. 527 for more information." … "Regardless of whether
you used the unit as a home, expenses related to days of personal use do not qualify as rental expenses. You must
allocate your expenses based on the number of days of personal use to total use of the property."

**Line 22** (`i1040se.pdf p. 8`): "Do not complete line 22 if the amount on line 21 is from royalty properties. … If you
have an unallowed rental real estate loss from a prior year that after completing Form 8582 you can include this year,
include that loss on line 22."

**Part IV** (`i1040se.pdf p. 11`): "REMIC income or loss is not income or loss from a passive activity." … Column (c)
"is the smallest amount you are allowed to report as your taxable income (Form 1040 …, line 15). … Do not include the
amount shown in column (c) in the total on Schedule E, line 39."

## 3. What goes on this form

- **Part I:** rents from real estate (including personal property leased with it), rooms or other space, and "any other
  income" of the rental (line 3); royalties from oil, gas or mineral properties (not operating interests), copyrights,
  name-image-likeness rights and patents (line 4) (`i1040se.pdf p. 5–6`); your **part** of a property you co-own
  ("report only your part of the income and expenses", `i1040se.pdf p. 4`); and royalties a partnership or
  S corporation passes through (K-1 (Form 1065) box 7 and K-1 (Form 1120-S) box 6, each: "Report royalties on
  Schedule E (Form 1040), line 4", `i1065sk1.pdf p. 15`; `i1120ssk.pdf p. 7`).
- **Part II:** each partnership's and S corporation's ordinary income or loss (K-1 box 1), net rental real estate
  (box 2) and other net rental income (box 3), separately stated deductions that belong on Schedule E (for example
  depletion, §179 from Form 4562, debt-financed interest allocated to business or passive use), prior-year losses now
  allowed under the basis / at-risk rules ("PYA"), and unreimbursed partnership expenses ("UPE") (`i1040se.pdf p. 9–10`;
  `i1065sk1.pdf p. 14–15`).
- **Part III:** each estate's or trust's ordinary business, rental real estate and other rental income, and "other
  portfolio and nonbusiness income" (royalties, annuities, IRD) from K-1 (Form 1041) boxes 5–8 (`i1041sk1.pdf p. 2`;
  `i1040se.pdf p. 10`).
- **Part IV:** a REMIC residual holder's taxable income or loss for each quarter (Schedule Q lines 1b and 3b)
  (`i1040se.pdf p. 11`).
- **Part V line 40:** an individual landlord's Form 4835 farm rental income or loss (`f1040se.pdf p. 2`).

## 4. What does not go here

| Look-alike | Where it goes instead | Source |
|---|---|---|
| Rental with significant services (maid service) | Schedule C | `i1040se.pdf p. 5` |
| Rental of real estate held for sale by a dealer | Schedule C | `i1040se.pdf p. 5–6` |
| Business of renting personal property (equipment, vehicles) | Schedule C; a non-business personal property rental → Schedule 1 lines 8l / 24b | `i1040se.pdf p. 5` |
| Royalties of a self-employed writer, inventor, artist; NIL income from business activity | Schedule C | `i1040se.pdf p. 6` |
| Crop-share / livestock-share rent, landlord not materially participating | Form 4835 → Schedule E line 40 | `i1040se.pdf p. 6`; `f4835.pdf p. 1` |
| A home used as a home and rented under 15 days | Not reported at all (interest, taxes, casualty → Schedule A) | `i1040se.pdf p. 5` |
| Expenses of the personal-use days | Not rental expenses; personal (interest / taxes may be Schedule A items) | `i1040se.pdf p. 5` |
| A regular interest in a REMIC | Form 1040 line 2b | `i1040se.pdf p. 11` |
| K-1 interest, dividends, capital gains | Schedule B / Form 1040 lines 2b, 3a, 3b; Schedule D | `i1065sk1.pdf p. 15`; `i1041sk1.pdf p. 2` |
| S corporation distributions of prior accumulated E&P | Form 1040 line 3b | `i1040se.pdf p. 9` |
| Estimated tax credited from a trust (K-1 (1041) box 13 code A) | Form 1040 line 26 (write "ES payment claimed" by line 37, not in the total) | `i1040se.pdf p. 11` |
| Excess business loss | Form 461 → Schedule 1 line 8p (not shown on Schedule E) | `i1040se.pdf p. 1, 3` |
| Partnership self-employment earnings (K-1 box 14 code A) | Schedule SE | `i1040se.pdf p. 9` |
| Gambling winnings / losses of a partnership not in the gambling business | Schedule 1 / Schedule A | `i1040se.pdf p. 10` |

## 5. Where the numbers come from

| Source | Box / line | Schedule E line |
|---|---|---|
| Lease records, Form 1099-MISC box 1 (rents) | Rents received | 3 |
| Form 1099-MISC box 2 ("$10 or more in royalties") | Royalties | 4 (`i1040se.pdf p. 6`) |
| Schedule K-1 (Form 1065) box 7; Schedule K-1 (Form 1120-S) box 6 | Royalties | 4 (`i1065sk1.pdf p. 15`; `i1120ssk.pdf p. 7`) |
| Form 1098 box 1 (from a bank or financial institution) | Mortgage interest | 12; else line 13 (`i1040se.pdf p. 7`) |
| Form 4562 | Depreciation / §179 / amortization | 18 (Part I); 28 column (j) (Part II) |
| Form 6198 line 21 | At-risk deductible loss | 21 (write "Form 6198" to its left); 28 column (i) for nonpassive | 
| Form 8582 Parts VI–IX | Passive loss allowed | 22 (Part I); 28 column (g); 33 column (c) |
| Schedule K-1 (Form 1065 / 1120-S) box 1, 2, 3 | Ordinary business, net rental real estate, other net rental | 28 columns (g)–(k) |
| Schedule K-1 (Form 1041) boxes 5, 6, 7, 8 | Other portfolio, ordinary business, rental real estate, other rental | 33 columns (c)–(f) |
| Schedule Q (Form 1066) lines 1b, 2c, 3b | REMIC | 38 columns (c), (d), (e) |
| Form 4835 line 32 / 34c | Farm rental net | 40 |
| Form 4835 line 7; K-1 (1065) box 14 code B; K-1 (1120-S) box 17 code AN; K-1 (1041) box 14 code F | Gross farming and fishing income | 42 (`f1040se.pdf p. 2`) |

## 6. How to figure it, line by line (2025 form, in order)

**Name / SSN** at the top of each page (page 2: "Do not enter name and social security number if shown on other
side"). A fiduciary filing with Form 1041 enters the EIN (`i1040se.pdf p. 4`).

### Part I — Income or loss from rental real estate and royalties

1. **Line A** — "Did you make any payments in 2025 that would require you to file Form(s) 1099?" Yes if, generally,
   you paid at least $600 to a non-employee for services (Form 1099-NEC) or at least $600 of rents and similar items
   (Form 1099-MISC) (`i1040se.pdf p. 4`).
2. **Line B** — "If 'Yes,' did you or will you file required Form(s) 1099?" (`f1040se.pdf p. 1`).
3. **Line 1a** — "Physical address of each property (street, city, state, ZIP code)", rental real estate only (foreign:
   city, province or state, country, postal code). For a royalty property leave lines 1a and 2 blank
   (`i1040se.pdf p. 4–5`).
4. **Line 1b — Type of property**, code 1 single family, 2 multi-family, 3 vacation/short-term rental, 4 commercial,
   5 land, 6 royalties, 7 self-rental (property rented to a trade or business in which you materially participated),
   8 other (attach a description) (`f1040se.pdf p. 1`; `i1040se.pdf p. 5`). Land rental and self-rental can be
   recharacterized as nonpassive under Pub. 925 (`i1040se.pdf p. 5`; `i8582.pdf p. 8`).
5. **Line 2 — Fair rental days, personal use days, QJV box**, per rental property. A personal-use day includes any day
   used by you or a co-owner, a family member (unless at fair rent as a main home), anyone paying less than fair rent,
   or under a swap; repair days and main-home days before or after a 12-month rental do not count (`i1040se.pdf p. 5`).
   Then:
   - personal use ≤ greater of 14 days or 10% of fair-rental days → not used as a home: all rental-part expenses
     deductible, "subject to the at-risk rules and the passive activity loss rules";
   - used as a home and rented < 15 days → do not report the rent, do not deduct rental expenses;
   - used as a home and rented ≥ 15 days → deductions limited (Pub. 527 worksheet; Pub. 527 is not in `docs\books`);
   - in every case expenses are allocated "based on the number of days of personal use to total use" (example: 7
     personal days, 63 rented → 10% not deductible on Schedule E) (`i1040se.pdf p. 5`).
   - QJV: check the box for each property in a QJV; each spouse reports their interest as a **separate property** with
     their share of each line (`i1040se.pdf p. 2`).
6. **Line 3 — Rents received.** Rental income (including personal property leased with the real estate, rooms or other
   space), fair market value of services or property received as rent, and "any other income … with a statement
   attached" (`i1040se.pdf p. 5`).
7. **Line 4 — Royalties received**, gross, even if state or local tax was withheld (the tax goes on line 16)
   (`i1040se.pdf p. 6`).
8. **Lines 5–19 — Expenses** of each property ("ordinary and necessary … Do not deduct the value of your own labor or
   amounts paid for capital investments or capital improvements"; rent part of a home → deduct the rented part)
   (`i1040se.pdf p. 6`):
   - **5** advertising; **6** auto and travel (actual or 70 cents a mile for 2025, plus parking and tolls; 50% of meals
     away from home; Form 4562 Part V required) (`i1040se.pdf p. 1, 6`); **7** cleaning and maintenance;
     **8** commissions; **9** insurance; **10** legal and other professional fees (tax advice and preparation for the
     rental; title-defense fees are capitalized) (`i1040se.pdf p. 6`); **11** management fees;
   - **12** mortgage interest paid to banks and other financial institutions (the Form 1098 amount; more than the
     Form 1098 → explain, "See attached"); **13** other interest (lender not a financial institution, no Form 1098, or
     a co-borrower received the Form 1098); interest is allocated by tracing loan proceeds; prepaid interest and points
     are spread over the loan; a rental trade or business may be limited by Form 8990 (`i1040se.pdf p. 6–7`);
   - **14** repairs (not improvements); **15** supplies; **16** taxes (including tax withheld from oil or gas
     royalties); **17** utilities (not the base rate of the first home phone line) (`i1040se.pdf p. 6–7`);
   - **18** depreciation (Form 4562; land not depreciable; separate land and building cost) or depletion
     (`i1040se.pdf p. 7`); **19** other ordinary and necessary expenses, including a §179D deduction
     (`i1040se.pdf p. 7`).
9. **Line 20** — total expenses, lines 5 through 19.
10. **Line 21** — line 3 and/or line 4 minus line 20. "If you have amounts for which you are not at risk, use Form 6198
    to determine the amount of your deductible loss. Enter that amount in the appropriate column of Schedule E,
    line 21. In the space to the left of line 21, enter 'Form 6198.'" (`i1040se.pdf p. 7–8`).
11. **Line 22** — "Deductible rental real estate loss after limitation, if any, on Form 8582". Blank for royalties. If
    the loss is not passive (real estate professional, home used as a home) or the small-landlord exception applies,
    enter the line 21 loss. Prior-year unallowed losses allowed this year are included here. A property with net
    profit on line 21 and an allowed prior-year loss shows the profit on line 21 and the allowed loss on line 22
    (`i1040se.pdf p. 8`; `i8582.pdf p. 15`).
12. **Lines 23a–23e** — totals for all properties (all Schedules E combined, on one Schedule E): 23a rents (line 3),
    23b royalties (line 4), 23c mortgage interest (line 12), 23d depreciation / depletion (line 18), 23e total
    expenses (line 20) — filled "even if you have only one property" (`f1040se.pdf p. 1`; `i1040se.pdf p. 6`).
13. **Line 24** — "Add positive amounts shown on line 21. Do not include any losses."
14. **Line 25** — "Add royalty losses from line 21 and rental real estate losses from line 22."
15. **Line 26** — line 24 + line 25 → Schedule 1 line 5 directly if Parts II–IV and line 40 do not apply, otherwise into
    line 41 (`f1040se.pdf p. 1`).

### Part II — Partnerships and S corporations

16. **Line 27** — Yes/No: "Are you reporting any loss not allowed in a prior year due to the at-risk or basis
    limitations, a prior year unallowed loss from a passive activity (if that loss was not reported on Form 8582), or
    unreimbursed partnership expenses?" If Yes: prior-year basis / at-risk losses now deductible → a separate line,
    column (i), "PYA"; prior-year passive losses not on Form 8582 → separate line, column (g), "PYA"; unreimbursed
    partnership expenses → separate line, column (i) (nonpassive) or (g) (passive without Form 8582), "UPE"
    (`i1040se.pdf p. 10`).
17. **Line 28** — one row per entity: (a) name; (b) P or S; (c) foreign partnership; (d) EIN; (e) basis computation
    required (S corporation loss, distribution, stock disposition or loan repayment → attach Form 7203); (f) any amount
    not at risk (attach Form 6198) (`f1040se.pdf p. 2`; `i1040se.pdf p. 8, 10`). Then:
    - **(g) passive loss allowed** (after Form 8582) and **(h) passive income** — K-1 box 1 of an activity you did not
      materially participate in; box 2 and box 3 amounts (passive "for all partners", except box 2 of a real estate
      professional who materially participated) (`i1065sk1.pdf p. 14–15`);
    - **(i) nonpassive loss allowed** (after basis and at-risk), **(j) §179 deduction from Form 4562**, **(k) nonpassive
      income** — box 1 of an activity you materially participated in; box 2 of a materially participating real estate
      professional (`i1065sk1.pdf p. 14`);
    - related items stated separately on the K-1 go on following lines with a description (`i1040se.pdf p. 10`);
      debt-financed acquisition interest: business → column (i) "business interest"; passive → Form 8582 then column
      (g) "passive interest"; investment → Form 4952, the part allocated to royalties to column (i) (`i1040se.pdf p. 10`).
    - A general partner or S corporation shareholder with an actively participated rental real estate loss who meets the
      small-landlord exception enters the loss in column (g) without Form 8582 (`i1040se.pdf p. 9`;
      `i1065sk1.pdf p. 14`). Publicly traded partnership (K-1 item D) items follow separate PTP rules (`i8582.pdf p. 15–16`).
18. **Line 29a / 29b** — totals of columns (h), (k) (29a) and (g), (i), (j) (29b).
19. **Line 30** = columns (h) + (k) of line 29a. **Line 31** = columns (g) + (i) + (j) of line 29b (a loss).
20. **Line 32** — "Total partnership and S corporation income or (loss). Combine lines 30 and 31." (`f1040se.pdf p. 2`).

### Part III — Estates and trusts

21. **Line 33** — (a) name, (b) EIN; (c) passive deduction or loss allowed (attach Form 8582 if required), (d) passive
    income from Schedule K-1, (e) nonpassive deduction or loss from Schedule K-1, (f) other income from Schedule K-1
    (`f1040se.pdf p. 2`). K-1 (Form 1041) box 5 is "income that isn't subject to the passive activity rules"; losses in
    boxes 6–8 "may be subject to the passive loss limitations of section 469" (`i1041sk1.pdf p. 2`).
22. **Line 34a / 34b** — totals. **Line 35** = columns (d) + (f) of 34a. **Line 36** = columns (c) + (e) of 34b.
23. **Line 37** — "Total estate and trust income or (loss)." Trust estimated tax credited (box 13 code A) is written on
    the dotted line, not in the total (`i1040se.pdf p. 11`).

### Part IV — REMICs (residual holder)

24. **Line 38** — (a) name, (b) EIN, (c) excess inclusion (Schedule Q line 2c), (d) taxable income (net loss) (Schedule Q
    line 1b), (e) income (Schedule Q line 3b). Column (c) is a floor on Form 1040 line 15 and on Form 6251 line 4 ("Sch Q"
    on the dotted line) (`i1040se.pdf p. 11`).
25. **Line 39** — columns (d) + (e) only, into line 41.

### Part V — Summary

26. **Line 40** — "Net farm rental income or (loss) from Form 4835. Also, complete line 42 below." (Form 4835 line 32 if
    income; line 34c if a loss, after Forms 6198 and 8582 — `forms\4835.md`.)
27. **Line 41** — line 26 + 32 + 37 + 39 + 40 → **Schedule 1 (Form 1040) line 5** (`f1040se.pdf p. 2`).
28. **Line 42** — gross farming and fishing income from Form 4835 line 7, K-1 (1065) box 14 code B, K-1 (1120-S) box 17
    code AN, K-1 (1041) box 14 code F. Used for the farmer/fisherman estimated-tax rule (two-thirds of gross income;
    file and pay by March 2, 2026) (`f1040se.pdf p. 2`; `i1040se.pdf p. 11`).
29. **Line 43** — a real estate professional enters "the net income or (loss) you reported anywhere on Form 1040 …
    from all rental real estate activities in which you materially participated under the passive activity loss rules"
    (`f1040se.pdf p. 2`; `i1040se.pdf p. 4`: "If you were a real estate professional for 2025, complete Schedule E,
    line 43").

## 7. Special cases and elections

| Case | Rule | Source |
|---|---|---|
| Small-landlord exception (no Form 8582) | Only passive activities are actively participated rental real estate; no prior-year unallowed losses; if a net loss: active participation in all, MFS lived apart all year, net loss ≤ $25,000 ($12,500 MFS), no passive credits, MAGI ≤ $100,000 ($50,000 MFS), no interest as a limited partner or as a beneficiary | `i1040se.pdf p. 4`; `i8582.pdf p. 1` |
| Active participation | Management decisions in a significant and bona fide sense; not if your (with spouse's) interest was under 10% by value at any time; limited partners generally not | `i1040se.pdf p. 4` |
| Real estate professional | Rental real estate in which you materially participated is not passive; on a joint return one spouse must meet both tests alone; election to treat all rental interests as one activity (statement; Rev. Proc. 2011-34 late election); complete line 43 | `i1040se.pdf p. 3–4` |
| Home used as a home | Not subject to the passive loss rules; deductions limited (Pub. 527); under 15 rental days → nothing reported | `i1040se.pdf p. 4–5`; `i8582.pdf p. 3` |
| Royalties | Portfolio income (not passive) unless derived in the ordinary course of a trade or business; no line 22 | `i1040se.pdf p. 4, 8`; `i8582.pdf p. 7` |
| Pre-1987 real property | Outside the at-risk rules (not mineral property) | `i1040se.pdf p. 3` |
| Qualified nonrecourse financing | Treated as at risk for holding real property | `i1040se.pdf p. 3` |
| QJV | Spouses filing jointly who both materially participate in a jointly owned rental business; each reports their share as a separate property; check QJV on line 2; no change to SE tax or passive rules | `i1040se.pdf p. 2` |
| More than three properties | Attach more Schedules E; lines A, B and 23a–26 on one only | `i1040se.pdf p. 4` |
| Business interest limit | Rental real estate that is a trade or business may need Form 8990 before lines 12–13 | `i1040se.pdf p. 7` |
| Basis limits (Part II) | Partnership: adjusted basis of the interest; S corporation: stock and loan basis (Form 7203); carried forward indefinitely | `i1040se.pdf p. 8` |
| Foreign partnership | Report on Schedule E only the K-1 amount when a 1099 also reports it; Form 8865 may be required | `i1040se.pdf p. 9` |
| Single-member LLC | Disregarded; report on Schedule E (or C / F) | `i1040se.pdf p. 2` |
| Chapter 11 debtor | See the Form 1040 instructions | `i1040se.pdf p. 5` |
| Recharacterized income (self-rental, land, incidental development) | May be nonpassive; Pub. 925 (not in `docs\books`) | `i1040se.pdf p. 3, 5`; `i8582.pdf p. 8` |

## 8. Married filing jointly / separately

- **Joint return:** one Schedule E for both spouses; each property, entity and REMIC listed once (both spouses' shares
  combined unless a QJV, where each spouse's share is a separate property) (`i1040se.pdf p. 2, 4`). Real estate
  professional status: one spouse must meet both tests "without taking into account services performed by the other
  spouse" (`i1040se.pdf p. 3`); for material participation a spouse's work counts as yours (`i8582.pdf p. 5`, "Test for
  a spouse"). Active participation looks at "your interest (including your spouse's interest)" (`i1040se.pdf p. 4`).
- **Separate returns:** each spouse reports only their own properties and K-1s (their share of jointly owned property;
  community property rules where they apply). The special allowance is $12,500 (phase-out $50,000–$75,000) if the
  spouses lived apart all year, and **none** if they lived together at any time (`i8582.pdf p. 4`).

## 9. Forms to attach or keep

| Form | Filed with the return? |
|---|---|
| Schedule E | Attached when any part applies ("Attach to Form 1040 …", `f1040se.pdf p. 1`) |
| Form 4562 | Attached when depreciation starts in 2025, listed property (any vehicle), §179 or new amortization; and whenever auto expenses are claimed (Part V) (`i1040se.pdf p. 6–7`) |
| Form 6198 | Attached for each at-risk activity with amounts not at risk (`i1040se.pdf p. 7–8`) |
| Form 8582 | Attached when required (`i1040se.pdf p. 8`; `forms\8582.md`) |
| Form 7203 | Attached for an S corporation loss, distribution, stock disposition or loan repayment (`i1040se.pdf p. 8, 10`) |
| Form 4835 | Attached for a farm rental (line 40) |
| Statements | Other income on line 3; "See attached" on lines 12 / 13; line 1b code 8 description; real estate professional aggregation election (`i1040se.pdf p. 4–7`) |
| Schedules K-1 and Q | **Not** attached — kept ("Do not attach Schedules K-1 to your return. Keep them for your records", `i1040se.pdf p. 8, 11`) |
| Form 8082 | When treating an item differently from the K-1 / Schedule Q (`i1040se.pdf p. 8, 11`) |
| Form 8886 | For a reportable transaction (`i1040se.pdf p. 2`) |

## 10. Where the amount goes next

- **Line 41 → Schedule 1 line 5** → Schedule 1 line 10 → Form 1040 line 8 → line 9 → AGI.
- Line 26 alone goes to Schedule 1 line 5 when nothing else on page 2 applies (`f1040se.pdf p. 1`).
- Losses on lines 26, 32, 37, 39 feed **Form 461** (excess business loss → Schedule 1 line 8p) (`i1040se.pdf p. 1`).
- Passive rental, royalty and passthrough income → **Form 8960** (Net Investment Income Tax) (`i1040se.pdf p. 2`).
- Rental / passthrough income may be qualified business income → **Form 8995 / 8995-A** (`i1040se.pdf p. 5`).
- Partner / shareholder AMT preferences → **Form 6251** (`i1040se.pdf p. 8`); REMIC column (c) floors Form 1040
  line 15 and Form 6251 line 4 (`i1040se.pdf p. 11`).
- Line 42 → Form 2210-F / the farmer's estimated-tax test (`i1040se.pdf p. 11`).
- Carryovers out of Schedule E: Form 6198 at-risk carryovers, Form 8582 unallowed losses, basis-limited losses,
  vacation-home disallowed expenses (Pub. 527).

## 11. Worked example

Casey Sample (000-00-0001) and Drew Sample (000-00-0002) file jointly; MAGI $80,000 (`i8582.pdf p. 11` definition).

| Item | Amount |
|---|---|
| Property A — single-family rental, 365 fair-rental days, 0 personal days; rents $18,000; expenses lines 5–17 $9,000, line 18 depreciation $6,000; Form 1098 interest (included in the $9,000) $4,000 | |
| Property B — duplex, rents $12,000; expenses $14,000; depreciation $5,000; actively participated | |
| Royalty — Form 1099-MISC box 2 $3,000; severance tax $200 | |
| Schedule K-1 (Form 1065), general partnership, Casey materially participates: box 1 $(2,000) | |
| Form 4835 — net farm rental income $1,500 | |

1. Property A: line 3 $18,000; line 20 = 9,000 + 6,000 = $15,000; **line 21 $3,000**.
2. Property B: line 20 = 14,000 + 5,000 = $19,000; **line 21 $(7,000)**. Passive with active participation; Form 8582:
   line 1a 3,000 (A) + 1,500 (the farm rental, see `forms\4835.md`), line 1b (7,000), line 3 (2,500); line 4 2,500;
   line 8 25,000; line 9 2,500 → all allowed. **Line 22 $(7,000).**
3. Royalty: line 4 $3,000; line 16 $200; **line 21 $2,800** (no line 22 — royalty).
4. Line 23a 30,000; 23b 3,000; 23c 4,000; 23d 11,000; 23e 34,200 (15,000 + 19,000 + 200).
5. **Line 24** = 3,000 + 2,800 = 5,800. **Line 25** = (7,000). **Line 26** = $(1,200).
6. Part II: column (i) $(2,000). Line 31 (2,000). **Line 32 = $(2,000).**
7. **Line 40 = $1,500.**
8. **Line 41** = (1,200) + (2,000) + 1,500 = **$(1,700) → Schedule 1 line 5.**

## 12. 2025 amounts used

| Amount | Value | Source |
|---|---|---|
| Standard mileage rate for rental activities | 70 cents a mile | `i1040se.pdf p. 1, 6` |
| Form 1099-NEC / 1099-MISC filing threshold (line A) | $600 | `i1040se.pdf p. 4` |
| Royalty Form 1099-MISC threshold | $10 | `i1040se.pdf p. 6` |
| Form 1098 threshold | $600 of interest | `i1040se.pdf p. 7` |
| Home-use test | Personal use > greater of 14 days or 10% of fair-rental days | `i1040se.pdf p. 5` |
| Minimum rental days for reporting a home used as a home | 15 | `i1040se.pdf p. 5` |
| Real estate professional | > 750 hours and > half of personal services | `i1040se.pdf p. 3` |
| Special allowance / MAGI phase-out | $25,000; $100,000–$150,000 ($12,500; $50,000–$75,000 MFS apart all year) | `i8582.pdf p. 4` |
| Active participation minimum interest | 10% by value | `i1040se.pdf p. 4` |
| §179 limit / phase-out start | $2,500,000 / $4,000,000 | `i1040se.pdf p. 1` |
| Barrier-removal deduction | Up to $15,000 | `i1040se.pdf p. 6` |
| Farmer / fisher estimated-tax test | Two-thirds of gross income; file and pay by March 2, 2026 | `i1040se.pdf p. 11` |

## 13. IRS sources

| Document | Pages | Used for |
|---|---|---|
| `f1040se.pdf` (Schedule E 2025, in `docs\IRS-Forms\`) | 1–2 | Every line's wording; lines 26, 41, 42, 43 |
| `i1040se.pdf` (2025 Instructions for Schedule E) | 1 | What's new (mileage, §179, Form 461) |
| | 2 | Forms list, QJV, reportable transactions, limitation on losses |
| | 3 | Excess business loss, at-risk rules, QNR, passive activity, real estate professionals |
| | 4 | Election, not-passive activities, small-landlord exception, active participation, line A, Part I scope |
| | 5 | Personal property, line 1a, 1b, line 2 (home use, 15 days, allocation, QJV), line 3 |
| | 6 | Dealers, crop shares, line 4, lines 5–21 general, line 6, line 10, lines 12–13 |
| | 7 | Interest, line 14, 17, 18, 19, 21 |
| | 8 | Line 21 (Form 6198), line 22, Parts II–III, basis and at-risk rules for partners |
| | 9 | Passive rules for partners, foreign partnerships, S corporations |
| | 10 | Line 27 (PYA, UPE), gambling, line 28, debt-financed interest |
| | 11 | Part III, Part IV (REMIC), line 42 |
| `i8582.pdf` (2025 Instructions for Form 8582) | 1, 3, 4, 5, 7, 8, 11, 15 | Exception, home used as residence, special allowance, spouse test, portfolio income, recharacterization, MAGI, reporting on Schedule E |
| `i1065sk1.pdf` (Partner's Instructions for Schedule K-1 (Form 1065), 2025) | 14–15 | Boxes 1, 2, 3, 7 |
| `i1120ssk.pdf` (Shareholder's Instructions for Schedule K-1 (Form 1120-S), 2025) | 7 | Box 6 royalties |
| `i1041sk1.pdf` (Instructions for Schedule K-1 (Form 1041), 2025) | 2 | Boxes 5–8 |
| `f4835.pdf` (Form 4835) | 1 | Line 32 / 34c → Schedule E line 40 |
