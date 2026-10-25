# Schedule B (Form 1040) — Interest and Ordinary Dividends

Tax year 2025. What the IRS requires. How the app does it: `C:\us-tax\new_knowledge\forms\schedule-b.md`. Picture:
`C:\us-tax\new_flowcharts\forms\schedule-b.md`. The amounts that end on Schedule B are documented line by line in
`C:\us-tax\new_lines\2b.md` (taxable interest), `3b.md` (ordinary dividends) and `forms\8815.md` (line 3); this file
covers the form itself — when it is required, its layout, and Part III.

---

## 1. At a glance

Schedule B is a one-page attachment with three parts. **Part I** lists every payer of taxable interest and ends in
Form 1040 line 2b; **Part II** lists every payer of ordinary dividends and ends in Form 1040 line 3b; **Part III**
asks three yes/no questions about foreign financial accounts and foreign trusts. It is required when taxable interest
or ordinary dividends are over $1,500, or when any one of seven other conditions applies (seller-financed mortgage,
accrued interest, OID or bond-premium reductions, the savings bond exclusion, nominee income, a foreign account or a
foreign trust). Whenever Schedule B is filed, Part III must be completed if either total is over $1,500 or a foreign
account or trust exists.

```text
Part I    line 1  = each taxable-interest payer and amount (seller-financed mortgage interest first)
                    − labelled reductions under a subtotal ("Nominee Distribution", "Accrued Interest",
                      "OID Adjustment", "ABP Adjustment")
          line 2  = total of line 1
          line 3  = Form 8815 line 14 (excludable series EE / I savings bond interest)
          line 4  = line 2 − line 3                     →  Form 1040 line 2b
Part II   line 5  = each ordinary-dividend payer and amount (1099-DIV box 1a), − "Nominee Distribution"
          line 6  = total of line 5                     →  Form 1040 line 3b
Part III  line 7a = Q1 foreign financial account or signature authority? (Yes/No)
                    Q2 if Yes: required to file FinCEN Form 114 (FBAR)? (Yes/No)
          line 7b = country names, if FinCEN Form 114 is required
          line 8  = distribution from, grantor of, or transferor to a foreign trust? (Yes/No)
```

Terms used below:

- **Nominee** — someone who receives income in their name that actually belongs to someone else.
- **OID** — original issue discount: the part of a bond's redemption price above its issue price, taxed as interest
  over the bond's life.
- **ABP** — amortizable bond premium: the amount paid for a taxable bond above its face value, which the holder may
  elect to amortize against the bond's interest.
- **FinCEN Form 114 (FBAR)** — Report of Foreign Bank and Financial Accounts, filed electronically with the
  Treasury's Financial Crimes Enforcement Network, never with the tax return.
- **Signature authority** — the power, alone or with someone else, to direct the disposition of assets in an account
  by communicating with the institution (`i1040sb.pdf p. 3`).

## 2. The IRS wording

**Schedule B (Form 1040) 2025** (`docs\IRS-Forms\f1040sb.pdf p. 1`; the form itself is not in `docs\books\`, the
quotations are its printed text):

> Part I line 1: "List name of payer. If any interest is from a seller-financed mortgage and the buyer used the
> property as a personal residence, see the instructions and list this interest first. Also, show that buyer's social
> security number and address:"
> Margin note: "If you received a Form 1099-INT, Form 1099-OID, or substitute statement from a brokerage firm, list
> the firm's name as the payer and enter the total interest shown on that form."
> Line 2: "Add the amounts on line 1". Line 3: "Excludable interest on series EE and I U.S. savings bonds issued after
> 1989. Attach Form 8815". Line 4: "Subtract line 3 from line 2. Enter the result here and on Form 1040 or 1040-SR,
> line 2b". "Note: If line 4 is over $1,500, you must complete Part III."
> Part II line 5: "List name of payer". Line 6: "Add the amounts on line 5. Enter the total here and on Form 1040 or
> 1040-SR, line 3b". "Note: If line 6 is over $1,500, you must complete Part III."
> Part III: "You must complete this part if you (a) had over $1,500 of taxable interest or ordinary dividends; (b) had
> a foreign account; or (c) received a distribution from, or were a grantor of, or a transferor to, a foreign trust."
> Line 7a: "At any time during 2025, did you have a financial interest in or signature authority over a financial
> account (such as a bank account, securities account, or brokerage account) located in a foreign country? … If
> "Yes," are you required to file FinCEN Form 114, Report of Foreign Bank and Financial Accounts (FBAR), to report that
> financial interest or signature authority?"
> Line 7b: "If you are required to file FinCEN Form 114, list the name(s) of the foreign country(-ies) where the
> financial account(s) is (are) located". Line 8: "During 2025, did you receive a distribution from, or were you the
> grantor of, or transferor to, a foreign trust? If "Yes," you may have to file Form 3520."

**When Schedule B is required** (`i1040sb.pdf p. 1`):

> "Use Schedule B (Form 1040) if any of the following applies. • You had over $1,500 of taxable interest or ordinary
> dividends. • You received interest from a seller-financed mortgage and the buyer used the property as a personal
> residence. • You have accrued interest from a bond. • You are reporting original issue discount (OID) of less than
> the amount shown on Form 1099-OID. • You are reporting interest income of less than the amount shown on a Form 1099
> due to amortizable bond premium. • You are claiming the exclusion of interest from series EE or I U.S. savings bonds
> issued after 1989. • You received interest or ordinary dividends as a nominee. • You had a financial interest in, or
> signature authority over, a financial account in a foreign country or you received a distribution from, or were a
> grantor of, or transferor to, a foreign trust."

Pub. 17 states the Part I list as nine conditions, adding two that are reported the same way (`p17.pdf p. 63`):
"4. You received a Form 1099-INT for U.S. savings bond interest that includes amounts you reported in a previous tax
year. … 6. You received a Form 1099-INT for interest on frozen deposits."

**Form 1040 instructions** (`i1040gi_ty2025.pdf p. 23`): "Foreign accounts and trusts. You must complete Part III of
Schedule B if you: • Had a foreign account; or • Received a distribution from, or were a grantor of, or a transferor
to, a foreign trust. You may also have to file Form 3520." (`p. 25`, line 2b): "But you must fill in and attach
Schedule B if the total is over $1,500 or any of the other conditions listed at the beginning of the Schedule B
instructions applies to you."

**More space** (`i1040sb.pdf p. 1`): "You can list more than one payer on each entry space for lines 1 and 5, but be
sure to clearly show the amount paid next to each payer's name. … If you still need more space, attach separate
statements using the same format as lines 1 and 5, but show your totals on Schedule B. Put your name and social
security number (SSN) on the statements and attach them at the end of your return."

## 3. What goes on this form

- **Part I:** every item of taxable interest — Form 1099-INT box 1 and box 3, Form 1099-OID taxable OID and other
  periodic interest, series EE / H / HH / I savings bond interest, accrued market discount includible in income, gain
  on a contingent payment debt instrument treated as interest, Schedule K-1 interest, seller-financed mortgage
  interest, and interest with no Form 1099 (`i1040sb.pdf p. 1`; the full list is in `new_lines\2b.md` section 3).
- **Part I reductions** below a subtotal: nominee interest, accrued interest paid on a bond bought between interest
  dates, OID reduced by acquisition premium, interest reduced by amortizable bond premium (`i1040sb.pdf p. 1-2`), and
  savings bond interest reported in an earlier year and excludable frozen-deposit interest (`p17.pdf p. 59, 63`).
- **Part I line 3:** the Form 8815 exclusion (`i1040sb.pdf p. 2`).
- **Part II:** every ordinary dividend — Form 1099-DIV box 1a and substitute statements, Schedule K-1 ordinary
  dividends, dividends with no Form 1099-DIV, and the Form 8814 line 9 amount when a parent elects to report a child's
  dividends ("Form 8814" written next to it, `i8814.pdf p. 4`; see `new_lines\3c.md`), less nominee dividends.
- **Part III:** the foreign-account and foreign-trust answers, and country names.

## 4. What does not go here

| Look-alike item | Where it goes instead | Source |
|---|---|---|
| Tax-exempt interest (1099-INT box 8, 1099-OID box 2 / 11 on tax-exempt bonds, 1099-DIV box 12) | Form 1040 line 2a ("Don't report on line 1 any tax-exempt interest") | `i1040sb.pdf p. 1-2` |
| Market discount on a tax-exempt bond | Part I line 1 — it **is** taxable interest | `i1040sb.pdf p. 1` |
| Private activity bond interest (1099-INT box 9) | Form 6251 line 2g (it stays in line 2a) | `i1040sb.pdf p. 2` |
| Qualified dividends (1099-DIV box 1b) | Form 1040 line 3a; they are part of, not added to, line 5 | `i1040gi_ty2025.pdf p. 26` |
| Capital gain distributions (1099-DIV box 2a) | Form 1040 line 7a / Schedule D | `i1040gi_ty2025.pdf p. 33` |
| Early-withdrawal penalty (1099-INT box 2) | Schedule 1 line 18; not netted against interest | `i1099int.pdf p. 3` |
| FinCEN Form 114 itself | Filed electronically with FinCEN; "Do not attach FinCEN Form 114 to your tax return" | `i1040sb.pdf p. 3` |
| Form 3520 | Filed separately at the address in its instructions; "Don't attach Form 3520 to Form 1040" | `i1040sb.pdf p. 3` |
| Form 8938 (specified foreign financial assets) | Its own form attached to the return; required "regardless of whether you are required to file FinCEN Form 114" | `i1040sb.pdf p. 2` |

## 5. Where the numbers come from

| Source | Box / line | Where it lands on Schedule B |
|---|---|---|
| Form 1099-INT | Boxes 1, 3 (10 under a §1278(b) election) | Line 1, under the payer (brokerage firm = payer) |
| Form 1099-INT | Boxes 11, 12 (premium) when the payer reported gross | "ABP Adjustment" below the line 1 subtotal |
| Form 1099-OID | Boxes 1, 2, 8 (5 under §1278(b)) | Line 1 |
| Form 1099-OID | Box 6 (acquisition premium) when not already netted | "OID Adjustment" |
| Schedule K-1 (1065 box 5, 1120-S box 4, 1041 box 1) | Interest | Line 1 |
| Buyer of seller-financed property | Interest received, buyer's name, address, SSN | Line 1, listed first |
| Your records | Nominee interest, accrued interest paid | "Nominee Distribution", "Accrued Interest" |
| Form 8815 | Line 14 | Line 3 |
| Form 1099-DIV | Box 1a | Line 5, under the payer |
| Schedule K-1 (1065 box 6a, 1120-S box 5a, 1041 box 2a) | Ordinary dividends | Line 5 |
| Form 8814 | Line 9 | Line 5, labelled "Form 8814" |
| Your records | Nominee dividends | "Nominee Distribution" under the line 5 subtotal |
| Your records / FinCEN 114 rules | Foreign accounts, maximum values, countries; foreign trust distributions, grants, transfers | Lines 7a, 7b, 8 |

## 6. How to fill it in, line by line

Header: the name(s) shown on the return and **your** SSN (the first SSN on a joint return).

**Part I — Interest**

1. **Line 1.** List each payer of taxable interest and the amount (`i1040sb.pdf p. 1`). Seller-financed mortgage
   interest comes first, with the buyer's name, address and SSN; the seller must also give the buyer their own SSN —
   "If you don't show the buyer's name, address, and SSN, or let the buyer know your SSN, you may have to pay a $50
   penalty" (`i1040sb.pdf p. 1`). For a brokerage statement, list the firm as the payer with the total interest on
   that form (form margin note). Enter amounts as reported (gross).
2. **Reductions on line 1.** If any reduction applies, write a subtotal under the last entry, then each reduction as
   a labelled negative line (`i1040sb.pdf p. 1-2`):
   - "Nominee Distribution" — interest received as nominee; also issue Form 1099-INT to the owner unless the owner is
     your spouse.
   - "Accrued Interest" — accrued interest paid to the seller of a bond bought between interest dates.
   - "OID Adjustment" — OID reported below Form 1099-OID box 1 or 8. Not allowed when the payer already reported net
     OID.
   - "ABP Adjustment" — interest reduced by amortizable bond premium on a taxable bond. Not allowed when the payer
     already reported net interest.
   - Savings bond interest reported in an earlier year and excludable interest on frozen deposits (`p17.pdf p. 59,
     63`; the IRS gives no fixed label for these).
3. **Line 2.** Add line 1 (the net figure after the reductions).
4. **Line 3.** Form 8815 line 14 — "If, during 2025, you cashed series EE or I U.S. savings bonds issued after 1989
   and you paid qualified higher education expenses for yourself, your spouse, or your dependents, you may be able to
   exclude part or all of the interest on those bonds. See Form 8815" (`i1040sb.pdf p. 2`). Not available when
   married filing separately (`f8815.pdf p. 3`).
5. **Line 4.** Line 2 − line 3. Enter on **Form 1040 line 2b**. If line 4 is over $1,500, complete Part III.

**Part II — Ordinary dividends**

6. **Line 5.** List each payer and its ordinary dividends (1099-DIV box 1a, `i1040sb.pdf p. 2`), the brokerage firm
   as payer for a brokerage statement. Include K-1 ordinary dividends, dividends with no 1099-DIV, and the Form 8814
   line 9 amount labelled "Form 8814" (`i8814.pdf p. 4`). For nominee dividends: subtotal, then "Nominee
   Distribution" and the nominee amount, subtracted (`i1040sb.pdf p. 2`).
7. **Line 6.** Add line 5. Enter on **Form 1040 line 3b**. If line 6 is over $1,500, complete Part III.

**Part III — Foreign accounts and trusts** (required if line 4 or line 6 is over $1,500, or you had a foreign account,
or a foreign trust event — form text)

8. **Line 7a, question 1.** "Yes" if at any time in 2025 you had a financial interest in or signature authority over
   a financial account located in a foreign country — "Check the "Yes" box even if you aren't required to file FinCEN
   Form 114" (`i1040sb.pdf p. 2`). A financial account includes bank, securities, brokerage, commodity futures or
   options accounts, cash-value insurance and annuity policies, and mutual-fund shares (`i1040sb.pdf p. 2-3`). It is
   foreign if the account is physically outside the United States — a foreign branch of a U.S. bank counts; a U.S.
   branch of a foreign bank does not (`i1040sb.pdf p. 3`). The FinCEN exceptions to signature authority are ignored
   for this question ("Don't consider the exceptions relating to signature authority in answering Question 1",
   `i1040sb.pdf p. 3`).
9. **Line 7a, question 2.** Answered only after a "Yes" to question 1: "Check the "Yes" box if you are required to
   file the form. Check the "No" box if you aren't required to file the form" (`i1040sb.pdf p. 3`). The general test:
   "A U.S. person that has a financial interest in or signature authority over foreign financial accounts must file
   the form if the aggregate value of foreign financial accounts exceeds $10,000 at any time during 2025"; the FinCEN
   Form 114 instructions decide exceptions (`i1040sb.pdf p. 3`).
10. **Line 7b.** If FinCEN Form 114 is required, list the foreign country or countries where the accounts are;
    "Attach a separate statement if you need more space" (`i1040sb.pdf p. 3`).
11. **Line 8.** "Yes" if during 2025 you received a distribution from a foreign trust ("a loan of cash or marketable
    securities is generally considered to be a distribution"), or were the grantor of, or transferor to, a foreign
    trust (`i1040sb.pdf p. 3`; form text). A "Yes" may require Form 3520 (filed separately) and, for an owner under
    the grantor trust rules, the trust's Form 3520-A (due March 16, 2026, `i1040sb.pdf p. 3`).

## 7. Special cases and elections

| Case | Rule | Source |
|---|---|---|
| More payers than entry lines | Several payers per entry space with each amount shown; otherwise a continuation statement in the same format with totals on Schedule B, name and SSN on it, attached at the end of the return | `i1040sb.pdf p. 1` |
| Payer already netted premium / acquisition premium | No further ABP / OID Adjustment allowed on Schedule B for that bond | `i1040sb.pdf p. 2` |
| Nominee interest or dividends | Report the total, subtract "Nominee Distribution"; file Forms 1099 / 1096 for the owner unless the owner is your spouse | `i1040sb.pdf p. 1-2` |
| Seller-financed mortgage | Listed first with buyer's name, address, SSN; $50 penalty if omitted; use the appropriate TIN if either party has no SSN | `i1040sb.pdf p. 1` |
| Officer / director / 10% owner of a foreign corporation | May have to file Form 5471 (not part of Schedule B) | `i1040sb.pdf p. 2` |
| Specified foreign financial assets | Form 8938 may be required regardless of FBAR | `i1040sb.pdf p. 2` |
| FBAR penalties | Civil penalty up to $10,000; willful: the greater of $100,000 or 50% of the balance; criminal penalties possible | `i1040sb.pdf p. 3` |
| Foreign trust owner under the grantor trust rules | Must ensure the trust files Form 3520-A (due March 16, 2026) | `i1040sb.pdf p. 3` |
| Child's income by parent's election (Form 8814) | Line 9 on Schedule B line 5 as "Form 8814"; the parent's dividends plus this amount decide the $1,500 test | `i8814.pdf p. 4` |

## 8. Married filing jointly / separately

- **Joint return:** one Schedule B for both spouses; Parts I and II list both spouses' payers, and the Part III
  questions are answered for the couple ("did you have …" covers either spouse on a joint return; the form has one
  set of boxes).
- **Separate returns:** each spouse files their own Schedule B with their own items and answers Part III about
  their own accounts and trusts. Line 3 is always blank — Form 8815 is not allowed when married filing separately
  (`f8815.pdf p. 3`; `p17.pdf p. 61`).

## 9. Forms to attach or keep

| Form | Filed with the return? |
|---|---|
| Schedule B | Attached when any condition in section 2 applies (Attachment Sequence No. 08) |
| Continuation statement for lines 1 / 5 / 7b | Attached at the end of the return (`i1040sb.pdf p. 1, p. 3`) |
| Form 8815 | Attached when line 3 has an amount (form line 3: "Attach Form 8815") |
| FinCEN Form 114 | Never attached; e-filed with FinCEN (`i1040sb.pdf p. 3`) |
| Form 3520 / 3520-A | Never attached; filed separately (`i1040sb.pdf p. 3`) |
| Form 8938 | Attached when required (`i1040sb.pdf p. 2`) |
| Forms 1099-INT / 1099-DIV and 1096 for a nominee owner | Filed with the IRS by the nominee (`i1040sb.pdf p. 2`) |

## 10. Where the amounts go next

- **Line 4 → Form 1040 line 2b**; **line 6 → Form 1040 line 3b**; both then enter line 9 (total income) and AGI.
- **Line 2** (interest **before** the Form 8815 exclusion) is used instead of line 2b where a worksheet must ignore
  the exclusion: the Social Security Benefits Worksheet line 3 ("include the amount from Schedule B (Form 1040),
  line 2", `p17.pdf p. 67`) and the Form 8815 Line 9 Worksheet line 1 (`f8815.pdf p. 4`).
- **Line 3** is taken from Form 8815 line 14, and its amount also reduces qualified educator expenses on Schedule 1
  line 11 (`i1040gi_ty2025.pdf p. 93`).
- **Part III** answers trigger filings outside the return (FinCEN Form 114, Form 3520 / 3520-A) and remind of
  Form 8938.

## 11. Worked example

Alex Sample (000-00-0001) and Jordan Sample (000-00-0002) file jointly.

| Item | Amount |
|---|---|
| Pat Buyer (000-00-0031, 12 Elm St, Springfield) pays interest on the note for Alex's old house, Pat's home | $1,200.00 |
| First Bank — Form 1099-INT box 1 | $900.00 |
| Broker A — Form 1099-INT box 1 (includes $300 belonging to Jordan's sister) | $2,000.00 |
| U.S. Treasury — Form 1099-INT box 3 (series EE bonds cashed) | $4,000.00 |
| Form 8815 line 14 (exclusion figured on Form 8815) | $1,500.00 |
| Fund Co — Form 1099-DIV box 1a | $1,100.00 |
| Broker A — Form 1099-DIV box 1a | $700.00 |
| Jordan's savings account at a bank in Toronto, highest balance in 2025 | $14,000 |

Part I: line 1 lists Pat Buyer $1,200 (with SSN and address) first, then First Bank $900, Broker A $2,000, U.S.
Treasury $4,000; subtotal $8,100; "Nominee Distribution" ($300). **Line 2 = $7,800. Line 3 = $1,500. Line 4 =
$6,300 → Form 1040 line 2b.** Alex and Jordan also send a Form 1099-INT for the $300 to Jordan's sister.

Part II: Fund Co $1,100, Broker A $700. **Line 6 = $1,800 → Form 1040 line 3b.**

Part III (required — line 4 and line 6 are over $1,500, and there is a foreign account): **7a question 1 Yes**;
question 2 **Yes** (aggregate value over $10,000, so FinCEN Form 114 is filed separately with FinCEN); **7b
"Canada"**; **line 8 No**.

## 12. 2025 amounts used

| Amount | Value | Source |
|---|---|---|
| Schedule B / Part III threshold | Over $1,500 of taxable interest or ordinary dividends | `i1040sb.pdf p. 1`; form notes |
| FBAR filing threshold | Aggregate foreign account value over $10,000 at any time in 2025 | `i1040sb.pdf p. 3` |
| FBAR civil penalty | Up to $10,000; willful: greater of $100,000 or 50% of the balance | `i1040sb.pdf p. 3` |
| Seller-financed mortgage identification penalty | $50 | `i1040sb.pdf p. 1` |
| Form 3520-A due date (calendar-year trust) | March 16, 2026 | `i1040sb.pdf p. 3` |

## 13. IRS sources

| Document | Pages | Used for |
|---|---|---|
| `i1040sb.pdf` (2025 Instructions for Schedule B) | 1 | When required, continuation statements, line 1, seller-financed, nominees |
| | 2 | Accrued interest, OID / ABP adjustments, tax-exempt interest, line 3, Part II line 5, Form 5471, Form 8938, line 7a Q1 |
| | 3 | Account definitions, signature authority, line 7a Q2, FBAR threshold and penalties, line 7b, line 8, Forms 3520 / 3520-A |
| `docs\IRS-Forms\f1040sb.pdf` (Schedule B 2025, the form) | 1 | Line wording, Part III requirement, notes after lines 4 and 6 |
| `i1040gi_ty2025.pdf` | 23 | Foreign accounts and trusts → Part III |
| | 25-26 | Line 2b / 3b: Schedule B conditions |
| | 93 | Educator expenses reduced by Form 8815 exclusion |
| `p17.pdf` (Pub. 17, 2025) | 59, 61, 63 | Frozen deposits, Education Savings Bond Program (no MFS), nine Schedule B Part I conditions |
| | 67 | Social Security worksheet uses Schedule B line 2 when Form 8815 is filed |
| `f8815.pdf` | 3-4 | No exclusion on MFS; Line 9 Worksheet line 1 = Schedule B line 2 |
| `i8814.pdf` | 4 | Form 8814 line 9 on Schedule B line 5 |
| `i1099int.pdf` | 3 | Early-withdrawal penalty not netted |
