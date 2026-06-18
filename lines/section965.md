A **section 965(i) triggered tax** is the amount of a previously **deferred S corporation-related section 965 net tax liability** that stops being deferred because a **triggering event** occurred. The IRS defines a section 965(i) election as an election by an **S corporation shareholder** to defer payment of the shareholder's section 965(i) net tax liability until a triggering event occurs, and it says the liability is calculated and the election is made on an **S corporation-by-S corporation** and **shareholder-by-shareholder** basis. ([IRS][1])

## What counts as a triggering event

The IRS instructions for **Form 965-D** define a covered triggering event to include a **transfer of any share of S corporation stock** that changes ownership for federal tax purposes, including by death, and they separately describe a section 965(i)(2)(A)(ii) triggering event as events like a **liquidation, sale, exchange, or other disposition of substantially all assets**, cessation of business, or the S corporation ceasing to exist. ([IRS][2])

## Which form computes / reports it

The main annual reporting form is **Form 965-A, Individual Report of Net 965 Tax Liability**. The IRS says Form 965-A is used by individuals and entities taxed like individuals to report a taxpayer's net 965 liability for each tax year in which the taxpayer must account for section 965 amounts. ([IRS][3])

For a **triggered deferred 965(i) liability**, the Form 965-A instructions specifically say:

* in **Part IV, column (f)**, report the amount of each deferred S corporation-related net 965 tax liability whose payment **ceases to be deferred** because of a triggering event during the reporting year,
* report that amount as a **negative number** in Part IV column (f), and
* transfer it to **Part I, lines 5 through 8, column (f)** as a **positive number**. ([IRS][4])

So, for implementation, the primary form you need is:

```text
Form965A  # annual reporting / amount determination
```

### Additional section 965(i) forms that may also be required

There are two important special-case forms:

1. **Form 965-D** — used when a stock transfer would otherwise trigger the deferred liability, but the transferor and transferee enter into a **transfer agreement** so the transferee assumes the deferred 965(i) liability and the transfer is **not treated as a triggering event**. Both the eligible transferor and transferee must file it, and separate transfer agreements are required for each partial transfer. ([IRS][2])

2. **Form 965-E** — used when a **section 965(i)(2)(A)(ii)** triggering event has occurred (for example, liquidation / cessation of business) and the shareholder wants IRS consent to make a **section 965(h)** installment election for the triggered liability. Each shareholder must file their **own** Form 965-E, and each shareholder must make their **own** section 965(h) election. ([IRS][1])

## How it relates to Form 1040 line 16

The **2025 Instructions for Form 1040** say that if you had a **triggering event under section 965(i)** during the year **and did not enter into a transfer agreement**, you include the **triggered deferred net 965 tax liability** on **Form 1040 line 16**, check **box 3**, and write **"965INC"** next to that box. ([IRS][5])

So the direct mapping is:

```text
Form1040.line16 += triggered_deferred_net_965_tax_liability
Form1040.line16_box3_checked = true
Form1040.line16_box3_text = "965INC"
```

## How to complete the related form(s)

### A) Form 965-A — the main form you complete

Use **Form 965-A** every year the taxpayer still has any outstanding net 965 liability, including deferred S corporation-related liabilities. The IRS also says taxpayers with deferred S corporation-related liabilities must report them with the income tax return for the year of election **and every year thereafter through the year the amount is fully paid**. ([IRS][3])

#### Core 965-A flow for a triggered 965(i) liability

1. **Identify the S corporation and tax year** in **Part IV**.
2. In **Part IV, column (d)**, report the **beginning deferred S corporation-related net 965 tax liability**.
3. In **Part IV, column (f)**, report the amount that **ceased to be deferred because of the triggering event**. This is the “triggered” amount. ([IRS][4])
4. Transfer that amount to **Part I, one of lines 5–8**, as a **positive amount**. The instructions say lines 5–8 are used for “other amounts” of net 965 tax liability, including triggered deferred liabilities. ([IRS][4])
5. Decide whether the triggered amount will:

   * be paid **immediately** (reported in the “No” path / current-year payment path), or
   * be put on an **8-year installment schedule** if a valid section 965(h) installment election is available after the triggering event. The 965-A instructions describe the installment schedule as **8%, 8%, 8%, 8%, 8%, 15%, 20%, 25%** over years 1–8. ([IRS][4])

#### Important annual-reporting rule

If the taxpayer fails to file the annual required reporting under section 965(i)(7), the instructions say **5% of the deferred net 965 tax liability** is assessed as an addition to tax for that reporting year. ([IRS][4])

### B) Form 965-D — if a transfer agreement avoids the trigger

Use this form only if there was a transfer of S corporation stock that would otherwise be a triggering event, and the transferee will assume the deferred liability. In that case:

* both the **eligible 965(i) transferor** and the **eligible 965(i) transferee** must file Form 965-D,
* they must also attach duplicate copies to their returns for the year of the covered triggering event,
* and multiple partial transfers require **separate transfer agreements**. ([IRS][2])

If Form 965-D is properly completed and filed, the transfer is not treated as a triggering event, so there would be **no "965INC" amount on line 16** for that transfer. That follows from the 1040 instruction saying line 16 inclusion applies when there was a triggering event **and you did not enter into a transfer agreement**. ([IRS][5])

### C) Form 965-E — if a triggering event occurred and the shareholder wants installment treatment

If a **section 965(i)(2)(A)(ii)** triggering event occurred and the shareholder wants to pay the now-triggered deferred 965(i) tax under a section 965(h) installment election, the shareholder uses **Form 965-E** to obtain IRS consent. The IRS says:

* each shareholder must file **their own** Form 965-E,
* the S corporation cannot file it for them,
* the original must generally be mailed within **30 days** of the triggering event,
* and a duplicate must be attached to the tax return for that year. ([IRS][1])

## How many forms do you submit?

### Form 965-A

This is generally **one Form 965-A per taxpayer per return**, but that one form can report **multiple S corporation-related net 965 liabilities** on separate lines. The instructions explicitly refer to reporting each S corporation-related liability on an **individual S corporation basis**, and Part IV has columns for S corporation name and EIN, allowing multiple lines. ([IRS][4])

So it is **not per spouse by default** and **not per investment**. It is best modeled as:

* **per taxpayer return**, with
* **one or more S corporation lines** inside the form.

If spouses file **MFJ** and **both spouses separately** have section 965(i) liabilities, you would generally need separate shareholder-level reporting for each spouse's liabilities because the liability is **shareholder-by-shareholder**. The election itself is on a shareholder-by-shareholder basis. ([IRS][1])

### Form 965-D

This is **not per return** and **not per investment**. It is **per covered transfer agreement**. If there are multiple partial transfers, the instructions require **separate transfer agreements for each partial transfer**. Both the transferor and transferee file it. ([IRS][2])

### Form 965-E

This is **per shareholder triggering event requiring consent**, not per return and not per investment. The IRS says **each shareholder** must file their **own** Form 965-E. ([IRS][1])

## Developer-safe model

Use this model:

```text
if taxpayer_has_section965i_deferred_liability:
    create Form965A for the taxpayer
    add one line per S_corporation_related_965i_liability

    for each S-corp line:
        if triggering_event_occurred:
            if valid_transfer_agreement_exists:
                require Form965D for transferor and transferee
                do not add triggered amount to Form1040.line16
            else:
                move triggered amount from Form965A PartIV col(f) to PartI lines5-8
                Form1040.line16 += triggered_amount
                set line16 box3 text = "965INC"

                if triggering_event_is_965i_2_A_ii and taxpayer_wants_965h_installments:
                    require Form965E
```

## Bottom line

* **section965i_triggered_tax** = previously deferred **S corporation-related section 965(i) tax** that becomes payable because a triggering event occurred. ([IRS][2])
* The main reporting form is **Form 965-A**. ([IRS][3])
* It maps to **Form 1040 line 16** if a triggering event happened **and there was no transfer agreement**, with **box 3 checked** and **"965INC"** written next to it. ([IRS][5])
* **Form 965-D** is for transfer agreements that avoid triggering the tax. ([IRS][2])
* **Form 965-E** is for getting consent to make a post-trigger **965(h)** installment election in certain triggering-event cases. ([IRS][1])
* The filing count is driven by **shareholder + S corporation-related liability / transfer event**, not by “per spouse” or “per investment” in the ordinary sense.

[1]: https://www.irs.gov/instructions/i965e "Instructions for Form 965-E (12/2019) | Internal Revenue Service"
[2]: https://www.irs.gov/instructions/i965d "Instructions for Form 965-D (12/2019) | Internal Revenue Service"
[3]: https://www.irs.gov/forms-pubs/about-form-965-a "About Form 965-A, Individual Report of Net 965 Tax Liability | Internal Revenue Service"
[4]: https://www.irs.gov/pub/irs-pdf/i965a.pdf "Instructions for Form 965-A (Rev. January 2021)"
[5]: https://www.irs.gov/pub/irs-pdf/i1040gi.pdf?os=wtmbzegmu5hwrefapp&ref=app "2025 Instruction 1040"
