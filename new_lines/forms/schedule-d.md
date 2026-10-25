# Schedule D (Form 1040) — Capital Gains and Losses

Tax year 2025. What the IRS requires. How the app does it: `C:\us-tax\new_knowledge\forms\schedule-d.md`. Picture:
`C:\us-tax\new_flowcharts\forms\schedule-d.md`. How Schedule D's bottom line becomes Form 1040 line 7a (Exception 1,
the Form 8814 child amount, the line 7b boxes) is in `C:\us-tax\new_lines\7a.md`; the row-by-row detail of
lines 1b, 2, 3, 8b, 9 and 10 is in `C:\us-tax\new_lines\forms\8949.md`. This file is the form-level detail: every
line of the 2025 Schedule D, the Capital Loss Carryover Worksheet, the two special-rate worksheets (28% Rate Gain,
Unrecaptured Section 1250 Gain) and the Schedule D Tax Worksheet that Schedule D lines 18–20 send the filer to.

The 2025 Schedule D itself is in `docs\IRS-Forms\f1040sd.pdf` (not in `docs\books`); its instructions are
`i1040sd.pdf` in `docs\books`.

---

## 1. At a glance

Schedule D nets every capital gain and loss of the year — your own and, on a joint return, your spouse's — into one
figure. Part I collects **short-term** items (held one year or less), Part II **long-term** items (held more than one
year), and Part III combines them, limits a net loss to **$3,000 ($1,500 married filing separately)**, and decides
which tax worksheet figures the tax on Form 1040 line 16.

```text
Part I   line 7  = 1a + 1b + 2 + 3 + 4 + 5 − 6          (column (h); line 6 = short-term carryover)
Part II  line 15 = 8a + 8b + 9 + 10 + 11 + 12 + 13 − 14  (column (h); line 14 = long-term carryover)
Part III line 16 = line 7 + line 15
         line 16 > 0  → Form 1040 line 7a = line 16; go to line 17
         line 16 = 0  → Form 1040 line 7a = 0; go to line 22
         line 16 < 0  → line 21 = −min(|line 16|, 3,000 or 1,500 MFS) → Form 1040 line 7a; go to line 22
         line 17: lines 15 and 16 both gains?  Yes → lines 18, 19, 20 (choose the tax worksheet)
         line 18 = 28% Rate Gain Worksheet line 7
         line 19 = Unrecaptured Section 1250 Gain Worksheet line 18
         line 20: lines 18 and 19 both zero/blank AND no Form 4952? Yes → QDCG worksheet; No → Schedule D Tax Worksheet
         line 22: qualified dividends on Form 1040 line 3a? Yes → QDCG worksheet
```

Terms used below:

- **Capital asset** — "Most property you own and use for personal purposes or investment is a capital asset. For
  example, your house, furniture, car, stocks, and bonds are capital assets" (`i1040sd.pdf p. 1`), minus the listed
  exceptions (inventory, business receivables, depreciable business property, business real estate, self-created
  copyrights and similar, certain government publications, dealer derivatives, hedges, business supplies).
- **Short-term / long-term** — held "1 year or less" / "more than 1 year"; more than 3 years for certain gains on
  "applicable partnership interests" (`i1040sd.pdf p. 2`).
- **Column (d) proceeds, (e) cost or other basis, (g) adjustments, (h) gain or (loss)** — the four money columns of
  lines 1a–3 and 8a–10. Column (h) = (d) − (e) + (g) (`i1040sd.pdf p. 10–11`).
- **Capital loss carryover** — the part of an earlier year's net capital loss not yet deducted, carried forward
  with its short-term or long-term character.
- **28% rate gain** — collectibles gain and the taxable part of a section 1202 small-business-stock gain; taxed at
  up to 28% (`i1040sd.pdf p. 11`).
- **Unrecaptured section 1250 gain** — the part of a gain on depreciated real property that reflects
  straight-line depreciation; taxed at up to 25% (`i1040sd.pdf p. 11–13`).
- **QOF** — qualified opportunity fund (`i1040sd.pdf p. 9`).
- **QDCG worksheet** — the Qualified Dividends and Capital Gain Tax Worksheet in the Form 1040 line 16
  instructions.

## 2. The IRS wording

**Schedule D (Form 1040) 2025** (`docs\IRS-Forms\f1040sd.pdf p. 1–2`), headings and lines quoted in section 6.
Top of the form: "Use Form 8949 to list your transactions for lines 1b, 2, 3, 8b, 9, and 10" and "Did you dispose of
any investment(s) in a qualified opportunity fund during the tax year? ☐ Yes ☐ No If "Yes," attach Form 8949 and see
its instructions for additional requirements for reporting your gain or loss."

**Purpose** (`i1040sd.pdf p. 1`): "Use Schedule D: • To figure the overall gain or loss from transactions reported on
Form 8949; • To report certain transactions you don't have to report on Form 8949; • To report a gain from Form 2439
or 6252 or Part I of Form 4797; • To report a gain or loss from Form 4684, 6781, or 8824; • To report a gain or loss
from a partnership, S corporation, estate, or trust; • To report capital gain distributions not reported directly on
Form 1040 or 1040-SR, line 7a …; and • To report a capital loss carryover from 2024 to 2025."

**Order of work** (`i1040sd.pdf p. 1`): "Complete Form 8949 before you complete line 1b, 2, 3, 8b, 9, or 10 of
Schedule D."

**When Schedule D (and Form 8949) can be skipped** — Form 1040 line 7 instructions (`i1040gi_ty2025.pdf p. 31, 33`):

> "Exception 1. You don't have to file Form 8949 or Schedule D if you aren't deferring any capital gain by investing
> in a qualified opportunity fund and both of the following apply. 1. You have no capital losses, and your only
> capital gains are capital gain distributions from Form(s) 1099-DIV, box 2a (or substitute statements); and 2. None
> of the Form(s) 1099-DIV (or substitute statements) have an amount in box 2b …, box 2c …, or box 2d …."
>
> "Exception 2. You must file Schedule D but generally don't have to file Form 8949 if Exception 1 doesn't apply, you
> aren't deferring any capital gain by investing in a qualified opportunity fund or terminating deferral from an
> investment in a qualified opportunity fund, and your only capital gains and losses are: • Capital gain
> distributions; • A capital loss carryover from 2024; • A gain from Form 2439 or 6252 or Part I of Form 4797; • A
> gain or loss from Form 4684, 6781, or 8824; • A gain or loss from a partnership, S corporation, estate, or trust; or
> • Gains and losses from transactions for which you received a Form 1099-B or 1099-DA … that shows basis was
> reported to the IRS, the QOF box … isn't checked, and you don't need to make any adjustments in column (g) of Form
> 8949 or enter any codes in column (f) of Form 8949."

**Rounding** (`i1040sd.pdf p. 9`): "You can round off cents to whole dollars on your Schedule D. If you do round to
whole dollars, you must round all amounts. … If you have to add two or more amounts to figure the amount to enter on
a line, include cents when adding the amounts and round off only the total."

**Capital losses** (`i1040sd.pdf p. 3`): "You can deduct capital losses up to the amount of your capital gains plus
$3,000 ($1,500 if married filing separately). … Be sure to report all of your capital gains and losses even if you
can't use all of your losses in 2025."

## 3. What goes on this form

| Item | Line | Source |
|---|---|---|
| Short-term sales on Form 1099-B / 1099-DA, basis reported to the IRS, no adjustments, no codes (totals only) | 1a | `i1040sd.pdf p. 10` |
| Form 8949 Part I totals, box A or G / box B or H / box C or I | 1b / 2 / 3 | `f1040sd.pdf p. 1`; `i1040sd.pdf p. 11` |
| Short-term gain from Form 6252; short-term gain or (loss) from Forms 4684, 6781 (40%), 8824 | 4 | `f1040sd.pdf p. 1` |
| Net short-term gain or (loss) from Schedules K-1 (partnership, S corporation, estate, trust) | 5 | `f1040sd.pdf p. 1` |
| Short-term capital loss carryover (Capital Loss Carryover Worksheet line 8) | 6 | `i1040sd.pdf p. 10` |
| Long-term sales on Form 1099-B / 1099-DA, basis reported, no adjustments (totals only) | 8a | `i1040sd.pdf p. 10` |
| Form 8949 Part II totals, box D or J / box E or K / box F or L | 8b / 9 / 10 | `f1040sd.pdf p. 1` |
| Gain from Form 4797 Part I; long-term gain from Forms 2439 and 6252; long-term gain or (loss) from Forms 4684, 6781 (60%), 8824 | 11 | `f1040sd.pdf p. 1`; `i1040sd.pdf p. 6` (Form 2439 box 1a) |
| Net long-term gain or (loss) from Schedules K-1 | 12 | `f1040sd.pdf p. 1` |
| Capital gain distributions (1099-DIV box 2a, your share only); Form 8814 line 10 of an elected child | 13 | `i1040sd.pdf p. 2, 11`; `i8814.pdf p. 4` |
| Long-term capital loss carryover (Capital Loss Carryover Worksheet line 13) | 14 | `i1040sd.pdf p. 10` |

## 4. What does not go here

| Amount | Where it goes instead | Source |
|---|---|---|
| Capital gain distributions only (no box 2b/2c/2d, no losses, no QOF) | Form 1040 line 7a directly (Exception 1), no Schedule D | `i1040gi_ty2025.pdf p. 31, 33` |
| Short-term capital gain distributions of a fund | Ordinary dividends (1099-DIV box 1a) → Form 1040 line 3b | `i1040sd.pdf p. 2` |
| Sales of business real property, depreciable business property, §1244 ordinary loss, a trader's mark-to-market gains | Form 4797 (only its Part I net gain reaches line 11) | `i1040sd.pdf p. 1, 5, 6–7` |
| Section 1256 contracts and straddles | Form 6781 (then lines 4 and 11) | `i1040sd.pdf p. 1` |
| Casualty and theft | Form 4684 (then lines 4 / 11 or Schedule A) | `i1040sd.pdf p. 1` |
| Installment sale payments | Form 6252 (then lines 4 / 11) | `i1040sd.pdf p. 6` |
| Like-kind exchanges | Form 8824 (then lines 4 / 11) | `i1040sd.pdf p. 1` |
| Tax paid on undistributed gains (Form 2439 box 2) | Schedule 3 line 13a | `i1040sd.pdf p. 6` |
| Interest on a section 1260 constructive ownership transaction | Schedule 2 line 17z | `i1040sd.pdf p. 4` |
| Ordinary part of a market discount bond or contingent payment debt instrument gain | Interest income (Form 8949 column (g) codes D / O) | `i1040sd.pdf p. 4–5` |

## 5. Where the numbers come from

| Source | Box / line | Schedule D line |
|---|---|---|
| Form 1099-B / 1099-DA meeting the line 1a / 8a test | 1d / 1f proceeds, 1e / 1g basis | 1a / 8a (columns d, e, h) |
| Form 8949 Part I line 2 totals, by box checked | columns (d), (e), (g), (h) | 1b, 2, 3 |
| Form 8949 Part II line 2 totals, by box checked | columns (d), (e), (g), (h) | 8b, 9, 10 |
| Form 6252 | line 26 (short-term part) | 4 |
| Form 4684 | short-term gain or (loss) | 4 |
| Form 6781 | line 8 (40% short-term) | 4 |
| Form 8824 | short-term gain or (loss) | 4 |
| Schedule K-1 (1065) box 8; (1120-S) box 7; (1041) box 3 (and box 11 code C) | net short-term | 5 |
| 2024 return | Capital Loss Carryover Worksheet line 8 | 6 |
| Form 4797 | line 7 (or line 9 after the 5-year lookback) gain | 11 |
| Form 2439 | box 1a | 11 (box 1b → §1250 worksheet line 11; box 1c → section 1202; box 1d → 28% worksheet line 4) |
| Form 6252 / 4684 / 6781 (60%) / 8824 | long-term part | 11 |
| Schedule K-1 (1065) box 9a; (1120-S) box 8a; (1041) box 4a (and box 11 code D) | net long-term | 12 |
| Form 1099-DIV | box 2a (2b → §1250 worksheet line 11; 2c → section 1202 row on Form 8949; 2d → 28% worksheet line 4) | 13 |
| Form 8814 | line 10 | 13 |
| 2024 return | Capital Loss Carryover Worksheet line 13 | 14 |
| Form 1040 line 3a | qualified dividends | 22 |
| Form 4952 | line 4g / 4e | 20 (filing Form 4952 sends you to the Schedule D Tax Worksheet) |

## 6. How to figure it, line by line

### Top of the form — QOF question

"Did you dispose of any investment(s) in a qualified opportunity fund during the tax year?" Answer **Yes** only for a
**disposal** of a QOF investment; then Form 8949 is attached and Form 8997 Part III completed (`i1040sd.pdf p. 10`:
"If you disposed of any investment in a QOF during the tax year, check the box on page 1 of Schedule D … You must
also complete Part III of Form 8997"). A new deferral (Form 8949 code Z) alone is not a disposal.

### Part I — Short-term

1. **Line 1a** — totals (columns d, e, h) of short-term transactions reported on Form 1099-B or 1099-DA that meet
   **all** of: basis reported to the IRS; no adjustment in 1099-B box 1f / 1g or 1099-DA box 1h / 1i; the "Ordinary"
   box (1099-B box 2 / 1099-DA box 6) not checked; the QOF box (1099-B box 3 / 1099-DA box 3b) not checked; no QOF
   deferral or termination; no adjustment to basis, type of gain or gain; not a sale of collectibles
   (`i1040sd.pdf p. 10`). Column (g) is not used on line 1a. Filers may instead put these on Form 8949 (box A / G) and
   leave line 1a blank.
2. **Line 1b** — Form 8949 Part I totals with **box A or box G** checked. Column (h) = (d) − (e) + (g)
   (`i1040sd.pdf p. 11`).
3. **Line 2** — Form 8949 Part I totals with **box B or box H** checked.
4. **Line 3** — Form 8949 Part I totals with **box C or box I** checked.
5. **Line 4** — "Short-term gain from Form 6252 and short-term gain or (loss) from Forms 4684, 6781, and 8824".
6. **Line 5** — "Net short-term gain or (loss) from partnerships, S corporations, estates, and trusts from
   Schedule(s) K-1".
7. **Line 6** — "Short-term capital loss carryover. Enter the amount, if any, from line 8 of your Capital Loss
   Carryover Worksheet" — printed in parentheses (a subtraction). Worksheet below.
8. **Line 7** — "Net short-term capital gain or (loss). Combine lines 1a through 6 in column (h)."

### Part II — Long-term

9. **Line 8a** — like line 1a, for long-term transactions (`i1040sd.pdf p. 10`).
10. **Line 8b / 9 / 10** — Form 8949 Part II totals with **box D or J / box E or K / box F or L** checked.
11. **Line 11** — "Gain from Form 4797, Part I; long-term gain from Forms 2439 and 6252; and long-term gain or (loss)
    from Forms 4684, 6781, and 8824".
12. **Line 12** — "Net long-term gain or (loss) from partnerships, S corporations, estates, and trusts from
    Schedule(s) K-1".
13. **Line 13** — "Capital gain distributions": "Enter on Schedule D, line 13, the total capital gain distributions
    paid to you during the year, regardless of how long you held your investment. This amount is shown in box 2a of
    Form 1099-DIV." Nominee amounts are left out, with a statement attached (`i1040sd.pdf p. 2`). A child's Form 8814
    line 10 is added here with "Form 8814" on the dotted line (`i8814.pdf p. 4`). A box 2c (section 1202) gain stays in
    the line 13 total; its exclusion is a separate Form 8949 Part II row with code Q (`i1040sd.pdf p. 8`).
14. **Line 14** — "Long-term capital loss carryover. Enter the amount, if any, from line 13 of your Capital Loss
    Carryover Worksheet" (parentheses).
15. **Line 15** — "Net long-term capital gain or (loss). Combine lines 8a through 14 in column (h)."

### Capital Loss Carryover Worksheet — lines 6 and 14 (`i1040sd.pdf p. 10`)

Used only "if your 2024 Schedule D, line 21, is a loss and (a) that loss is a smaller loss than the loss on your 2024
Schedule D, line 16; or (b) if the amount on your 2024 Form 1040 … line 15 would be less than zero if you could
enter a negative amount on that line. Otherwise, you don't have any carryovers."

| Line | Instruction |
|---|---|
| 1 | 2024 Form 1040 line 15 (negative allowed, in parentheses) |
| 2 | 2024 Schedule D line 21 loss, as a positive amount |
| 3 | line 1 + line 2; if zero or less, 0 |
| 4 | smaller of line 2 or line 3 (the part of the 2024 loss actually absorbed) |
| 5 | 2024 Schedule D line 7 loss, as a positive amount (else 0 and go to line 9) |
| 6 | gain on 2024 Schedule D line 15 (loss → 0) |
| 7 | line 4 + line 6 |
| 8 | **Short-term carryover** = line 5 − line 7 (not below 0) → 2025 Schedule D line 6 |
| 9 | 2024 Schedule D line 15 loss, as a positive amount (else skip to the end) |
| 10 | gain on 2024 Schedule D line 7 (loss → 0) |
| 11 | line 4 − line 5 (not below 0) |
| 12 | line 10 + line 11 |
| 13 | **Long-term carryover** = line 9 − line 12 (not below 0) → 2025 Schedule D line 14 |

"If you and your spouse once filed a joint return and are filing separate returns for 2025, any capital loss
carryover from the joint return can be deducted only on the return of the spouse who actually had the loss."
(`i1040sd.pdf p. 10`). The same worksheet in the 2026 instructions turns the 2025 result into the 2026 carryover
(`i1040sd.pdf p. 14`).

### Part III — Summary

16. **Line 16** — "Combine lines 7 and 15". If a gain: enter on Form 1040 line 7a and go to line 17. If a loss: "skip
    lines 17 through 20 below. Then, go to line 21. Also be sure to complete line 22." If zero: "skip lines 17 through
    21 below and enter -0- on Form 1040 … line 7a. Then, go to line 22." (`f1040sd.pdf p. 2`)
17. **Line 17** — "Are lines 15 and 16 both gains?" Yes → line 18. No → "Skip lines 18 through 21, and go to line 22."
18. **Line 18** — "If you are required to complete the 28% Rate Gain Worksheet (see instructions), enter the amount,
    if any, from line 7 of that worksheet." Required (after a Yes on line 17) when Form 8949 Part II shows a section
    1202 exclusion or a collectibles gain or (loss) (`i1040sd.pdf p. 11`). Worksheet below.
19. **Line 19** — "If you are required to complete the Unrecaptured Section 1250 Gain Worksheet (see instructions),
    enter the amount, if any, from line 18 of that worksheet." Required (after a Yes on line 17) when you disposed of
    depreciated real property held more than 1 year, received installment payments on such property, or received a
    K-1, 1099-DIV or 2439 showing unrecaptured section 1250 gain, or sold a partnership interest whose partnership
    owned section 1250 property (`i1040sd.pdf p. 11–12`).
20. **Line 20** — "Are lines 18 and 19 both zero or blank **and you are not filing Form 4952**?" Yes → QDCG
    worksheet; "Don't complete lines 21 and 22." No → Schedule D Tax Worksheet; "Don't complete lines 21 and 22."
21. **Line 21** — "If line 16 is a loss, enter here and on Form 1040 … line 7a, the smaller of: • The loss on line 16;
    or • ($3,000), or if married filing separately, ($1,500). Note: When figuring which amount is smaller, treat both
    amounts as positive numbers." Printed in parentheses.
22. **Line 22** — "Do you have qualified dividends on Form 1040 … line 3a?" Yes → QDCG worksheet. No → "Complete the
    rest of Form 1040". Reached only when line 16 is zero or a loss, or line 17 is No.

### 28% Rate Gain Worksheet — line 18 (`i1040sd.pdf p. 11`)

| Line | Instruction |
|---|---|
| 1 | Total collectibles gain or (loss) from items reported on Form 8949 Part II (collectibles carry code C) |
| 2 | Section 1202 exclusions in Form 8949 Part II column (g), code Q, as a positive number: the full exclusion if it is 50% of the gain; 2/3 of it if 60%; 1/3 of it if 75%; nothing if 100% |
| 3 | Collectibles gain or (loss) from Form 4684 line 4 (only if Form 4684 line 15 > 0), Form 6252, Form 6781 Part II and Form 8824 |
| 4 | Collectibles gain reported on Form 1099-DIV box 2d, Form 2439 box 1d, and Schedules K-1 |
| 5 | Long-term capital loss carryovers from Schedule D line 14 and K-1 (1041) box 11 code D (as a negative) |
| 6 | Schedule D line 7 if a loss (as a negative), else 0 |
| 7 | Lines 1–6 combined; zero or less → 0. This is **Schedule D line 18** |

"Collectibles include works of art, rugs, antiques, metals (such as gold, silver, and platinum bullion), gems, stamps,
coins, alcoholic beverages, and certain other tangible property." Gain (not loss) on selling a partnership,
S corporation or trust interest attributable to collectibles also counts, with the Regulations section 1.1(h)-1(e)
statement attached.

### Unrecaptured Section 1250 Gain Worksheet — line 19 (`i1040sd.pdf p. 12–13`)

"If you aren't reporting a gain on Form 4797, line 7, skip lines 1 through 9 and go to line 10."

| Line | Instruction |
|---|---|
| 1 | Section 1250 property in Form 4797 Part III that has an entry in Part I (not on Form 6252): smaller of Form 4797 line 22 or line 24 (a separate set of lines 1–3 per property) |
| 2 | Form 4797 line 26g for that property |
| 3 | line 1 − line 2 (total over properties) |
| 4 | Unrecaptured §1250 gain included on Form 6252 line 26 or 37 from installment sales of trade or business property held more than 1 year (Steps 1–3, `p. 12`) |
| 5 | Amounts on K-1s from a partnership or S corporation shown as "unrecaptured section 1250 gain" |
| 6 | lines 3 + 4 + 5 |
| 7 | **smaller of line 6 or the gain from Form 4797, line 7** |
| 8 | Form 4797 line 8 (nonrecaptured section 1231 losses) |
| 9 | line 7 − line 8 (not below 0) |
| 10 | Gain on selling a partnership interest attributable to unrecaptured §1250 gain |
| 11 | "unrecaptured section 1250 gain" on a K-1, Form 1099-DIV (box 2b) or Form 2439 (box 1b) from an estate, trust, REIT or RIC, or in connection with a Form 1099-R |
| 12 | Unrecaptured §1250 gain from sales of section 1250 property held more than 1 year with no Form 4797 Part I entry (for example a former rental converted to personal use) |
| 13 | lines 9 through 12 |
| 14 | If any section 1202 gain or collectibles gain or (loss): lines 1–4 of the 28% Rate Gain Worksheet; else 0 |
| 15 | Schedule D line 7 if a loss (negative), else 0 |
| 16 | Long-term carryovers: Schedule D line 14 and K-1 (1041) box 11 code D (negative) |
| 17 | lines 14 + 15 + 16; if a loss, as a positive amount; if zero or a gain, 0 |
| 18 | line 13 − line 17 (not below 0). This is **Schedule D line 19** |

### Schedule D Tax Worksheet (`i1040sd.pdf p. 15–16`; `i1040gi_ty2025.pdf p. 36`)

"Complete this worksheet only if line 18 or line 19 of Schedule D is more than zero and lines 15 and 16 of
Schedule D are gains or if you file Form 4952 and you have an amount on line 4g, even if you don't need to file
Schedule D." It is not used when Schedule D line 15 or 16 is zero or less and there are no qualified dividends, or
when taxable income is zero or less. A Form 2555 filer uses the Foreign Earned Income Tax Worksheet instead.

What Schedule D feeds into it:

| Worksheet line | Input |
|---|---|
| 1 | Form 1040 line 15 taxable income |
| 2 | Form 1040 line 3a qualified dividends |
| 3 / 4 | Form 4952 line 4g / line 4e |
| 5 / 6 | qualified dividends not elected under Form 4952 (line 6 = line 2 − (line 3 − line 4)) |
| 7 | **smaller of Schedule D line 15 or line 16** |
| 8 / 9 | line 9 = line 7 − smaller of line 3 or line 4 |
| 10 | line 6 + line 9 |
| 11 | **Schedule D line 18 + line 19** |
| 12 / 13 | line 12 = smaller of line 9 or line 11; line 13 = line 10 − line 12 (the 0/15/20% pool) |
| 15 / 19 / 26 | 0% ceiling $48,350 single/MFS, $96,700 MFJ/QSS, $64,750 HOH; 32%-bracket start $197,300 single/MFS/HOH, $394,600 MFJ/QSS; 20% floor $533,400 single, $300,000 MFS, $600,050 MFJ/QSS, $566,700 HOH |
| 22, 31, 34 | 0%, 15%, 20% portions of line 13 |
| 35–40 | **smaller of line 9 or Schedule D line 19**, less the part already taxed at ordinary rates (line 38), × 25% |
| 41–43 | the rest of line 1 (the 28% gain) × 28% — only "If Schedule D, line 18" is not zero or blank |
| 44 / 46 | regular tax on line 21 / on line 1 (Tax Table under $100,000, else Tax Computation Worksheet) |
| 47 | smaller of line 45 or line 46 → Form 1040 line 16 |

## 7. Special cases and elections

| Case | Rule | Source |
|---|---|---|
| Nominee capital gain distributions | Line 13 shows only your share; statement attached; file 1099-DIV for the owner | `i1040sd.pdf p. 2` |
| Main home sale | On Form 8949 only if the gain is not all excluded or a 1099-S arrived; up to $250,000 / $500,000 exclusion (code H) | `i1040sd.pdf p. 2–3` |
| Personal-use property loss | Not deductible; reported with code L when a 1099-S / 1099-K arrived | `i1040sd.pdf p. 3` |
| Related-party loss | Not deductible; code L | `i1040sd.pdf p. 3–4` |
| Wash sale | Loss not deductible; code W, amount added to the replacement's basis | `i1040sd.pdf p. 5` |
| Trader with a section 475(f) election | Gains and losses on Form 4797 Part II, not Schedule D | `i1040sd.pdf p. 5` |
| Section 1244 stock | Ordinary loss on Form 4797 up to $50,000 ($100,000 joint); the rest on Form 8949 with code S | `i1040sd.pdf p. 6–7` |
| QSB stock (section 1202) | Exclusion with code Q; 28% worksheet line 2; Form 6251 line 13 gets 7% of a 50/60/75% exclusion | `i1040sd.pdf p. 7–8` |
| Rollovers (QSB stock, ESOP), DC Zone / qualified community assets | Code R / code X | `i1040sd.pdf p. 8–9` |
| QOF deferral / disposal | Eligible gain reported normally; deferral on Form 8949 (code Z); disposal (code Y) checks the top box; Form 8997 | `i1040sd.pdf p. 9–10` |
| Undistributed capital gains (Form 2439) | Box 1a on line 11; box 2 tax as a credit on Schedule 3 line 13a; basis increased | `i1040sd.pdf p. 6` |
| Installment sale election out | Report the full gain on Form 8949 on a timely return | `i1040sd.pdf p. 6` |
| Separate returns after a joint year | Carryover only on the return of the spouse who had the loss | `i1040sd.pdf p. 10` |
| Form 4952 filer | Line 20 answer is No; Schedule D Tax Worksheet is used; a line 4g election removes that amount from the preferential pool | `f1040sd.pdf p. 2`; `i1040sd.pdf p. 15` |

## 8. Married filing jointly / separately

- **Joint return:** one Schedule D with both spouses' items. Form 8949 may list the spouses' transactions on separate
  or combined forms, but "you must include on your Schedule D the totals from all Forms 8949 for both you and your
  spouse" (`i8949.pdf p. 1`). The loss limit is $3,000 for the couple.
- **Separate returns:** each spouse files their own Schedule D with their own items; the loss limit is $1,500 each
  (`f1040sd.pdf p. 2`). A carryover from an earlier joint return goes only to the spouse who had the loss
  (`i1040sd.pdf p. 10`).

## 9. Forms to attach or keep

| Form / worksheet | Filed? |
|---|---|
| Schedule D | Attached whenever Exception 1 does not apply ("Attach to Form 1040, 1040-SR, or 1040-NR", `f1040sd.pdf p. 1`) |
| Form 8949 | Attached when any transaction needs it (Exception 2 lets most broker-reported sales skip it) |
| Nominee statement (line 13) | Attached (`i1040sd.pdf p. 2`) |
| Regulations section 1.1(h)-1(e) statement (sale of a partnership / S corporation / trust interest) | Attached (`i1040sd.pdf p. 11, 13`) |
| Capital Loss Carryover Worksheet, 28% Rate Gain Worksheet, Unrecaptured Section 1250 Gain Worksheet, Schedule D Tax Worksheet | "Keep for Your Records" — not filed (`i1040sd.pdf p. 10, 11, 13, 15`) |
| Form 8997 | Filed with any QOF deferral or disposal (`i1040sd.pdf p. 9–10`) |

## 10. Where the amounts go next

| Schedule D line | Goes to |
|---|---|
| 16 (gain or zero) / 21 (limited loss) | **Form 1040 line 7a** (then line 9 total income, line 11 AGI) |
| 7, 15, 16 | Capital Loss Carryover Worksheet for 2026; Schedule D Tax Worksheet line 7 (smaller of 15 / 16); QDCG worksheet |
| 18, 19 | Schedule D Tax Worksheet lines 11, 35, 41–43; Form 6251 Part III (AMT capital-gain rates); Form 8615 (a child's return) |
| 20, 22 | Choice of tax worksheet for **Form 1040 line 16** |
| Schedule D items | Form 8960 (net investment income tax, `i1040sd.pdf p. 1`); Form 4952 line 4e (net capital gain from investment property) |

## 11. Worked example

**Pat Sample** (000-00-0011), single, taxable income $120,000, no qualified dividends.

| Item | Detail | Line |
|---|---|---|
| 1099-B, short-term, basis reported, no adjustment | proceeds 10,000, basis 6,000 | 1a: (h) 4,000 |
| 1099-B, short-term, basis not reported | proceeds 3,000, basis 5,000 | Form 8949 box B → line 2: (h) (2,000) |
| 1099-B, long-term, basis reported, wash sale box 1g 600 | proceeds 4,000, basis 5,000 | Form 8949 box D, code W, (g) 600 → line 8b: (h) (400) |
| 1099-B, long-term, basis reported, no adjustment | proceeds 20,000, basis 8,000 | 8a: (h) 12,000 |
| K-1 (1065) box 9a | 2,000 | 12 |
| 1099-DIV box 2a 5,000, of which box 2b 4,000 | | 13: 5,000 |
| 2024 long-term carryover (worksheet line 13) | 3,000 | 14: (3,000) |

1. Line 7 = 4,000 − 2,000 = **2,000**.
2. Line 15 = 12,000 − 400 + 2,000 + 5,000 − 3,000 = **15,600**.
3. Line 16 = **17,600** → Form 1040 line 7a = 17,600. Line 17: both gains → Yes.
4. 28% worksheet: no collectibles, no section 1202 → line 18 = 0.
5. §1250 worksheet: no Form 4797 gain → skip to line 10. Line 11 = 4,000 (box 2b); line 13 = 4,000; line 14 = 0;
   line 15 = 0 (line 7 is a gain); line 16 = (3,000); line 17 = 3,000; line 18 = 4,000 − 3,000 = **1,000** →
   Schedule D line 19.
6. Line 20: line 19 is not zero → **No** → Schedule D Tax Worksheet (line 7 = smaller of 15,600 and 17,600 = 15,600;
   line 11 = 1,000; line 13 = 14,600 at 0/15/20%; up to 1,000 at no more than 25%).

**Loss year** — **Robin Sample** (000-00-0012), single: line 7 = (5,000), line 15 = 1,000. Line 16 = (4,000);
line 21 = smaller of 4,000 and 3,000 → **(3,000)** on Form 1040 line 7a; line 22 answered. With 2025 taxable income
of 40,000, the 2026 worksheet gives: line 4 = 3,000; line 5 = 5,000; line 6 = 1,000; line 7 = 4,000; line 8 =
**1,000 short-term carryover**; no long-term carryover.

## 12. 2025 amounts used

| Amount | Value | Source |
|---|---|---|
| Capital loss limit | $3,000; $1,500 married filing separately | `f1040sd.pdf p. 2`; `i1040sd.pdf p. 3` |
| Home-sale exclusion | $250,000; $500,000 joint (both meet use test and Test 2) | `i1040sd.pdf p. 2` |
| Section 1244 ordinary-loss maximum | $50,000; $100,000 joint | `i1040sd.pdf p. 7` |
| Long-term holding period | more than 1 year (3 years for applicable partnership interests) | `i1040sd.pdf p. 2` |
| Schedule D Tax Worksheet 0% ceiling (line 15) | $48,350 single/MFS; $96,700 MFJ/QSS; $64,750 HOH | `i1040sd.pdf p. 15` |
| 32%-bracket start (line 19) | $197,300 single/MFS/HOH; $394,600 MFJ/QSS | `i1040sd.pdf p. 15` |
| 20% floor (line 26) | $533,400 single; $300,000 MFS; $600,050 MFJ/QSS; $566,700 HOH | `i1040sd.pdf p. 15` |
| Rates | 0%, 15%, 20%, 25% (§1250), 28% | `i1040sd.pdf p. 15–16` |
| Tax Table cut-off | under $100,000 Tax Table, else Tax Computation Worksheet | `i1040sd.pdf p. 16` |

## 13. IRS sources

| Document | Pages | Used for |
|---|---|---|
| `docs\IRS-Forms\f1040sd.pdf` (Schedule D 2025) | 1–2 | Line text, Part III routing |
| `i1040sd.pdf` (2025 Instructions for Schedule D) | 1 | Purpose, other forms, capital asset |
| | 2–3 | Holding period, capital gain distributions, home sale, personal-use property, capital losses |
| | 3–4 | Nondeductible losses, special items, market discount |
| | 5–6 | Wash sales, traders, short sales, options, undistributed gains, installment sales |
| | 6–9 | Section 1244, QSB stock, rollovers, DC Zone, qualified community assets, QOF, rounding |
| | 10–11 | Capital Loss Carryover Worksheet, QOF disposal, lines 1a / 8a, lines 1b–10, line 13, line 18 and 28% worksheet |
| | 11–13 | Line 19 and Unrecaptured Section 1250 Gain Worksheet |
| | 14 | Line 21 and carryover to 2026 |
| | 15–16 | Schedule D Tax Worksheet |
| `i1040gi_ty2025.pdf` (2025 Form 1040 instructions) | 31, 33 | Exceptions 1 and 2 |
| | 36 | When to use the Schedule D Tax Worksheet / QDCG worksheet |
| `i8949.pdf` (2025 Instructions for Form 8949) | 1 | Joint filers' Forms 8949 |
| `i8814.pdf` | 4 | Form 8814 line 10 on Schedule D line 13 |
