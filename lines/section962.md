# Section 962 election (2025)

A **section 962 election** is an **annual election** that lets an **individual U.S. shareholder of a controlled foreign corporation (CFC)** be taxed **as if a domestic corporation** on certain CFC income inclusions. The statute says that, if the election is made, the individual’s tax on amounts included under **section 951(a)** is computed at the **corporate tax rules of section 11** instead of the normal individual tax rules, and those amounts are also treated as if received by a domestic corporation for purposes of the **section 960 deemed-paid foreign tax credit**. ([U.S. Code][1])

In practical 2025 IRS filing terms, a section 962 elector can also use **Form 8993** to determine any available **section 250 deduction** tied to **GILTI**, and must attach **Form 1118** to claim the related deemed-paid foreign tax credit. The IRS instructions for Form 8993 expressly say that **U.S. individual shareholders of CFCs making a section 962 election** use Form 8993, and the Form 1118 instructions say individuals who make a section 962 election must attach Form 1118 if they want the foreign tax credit based on their share of foreign taxes paid or accrued by the CFC. ([irs.gov][2])

On the Form 1040 side, the 2025 instructions describe it as an election made by a **domestic shareholder of a controlled foreign corporation to be taxed at corporate rates**. If it applies, the tax is reported on **Form 1040 line 16**, reduced by any foreign tax credits claimed on Form 1118, with **box 3** checked and **“962”** written next to it, plus a statement showing how the tax was figured. The same instructions also say that if you made a section 962 election for section 951 or 951A income, you **do not** report that income on Schedule 1 line 8n/8o in the ordinary way. ([irs.gov][3])

One important catch is that section 962 can create a **second tax layer later**. The statute says that when the CFC later distributes earnings that were previously taxed under a section 962 election, those distributions are included in gross income **to the extent the distribution exceeds the amount of tax actually paid under chapter 1 on the amounts to which the election applied**. In other words, the election can reduce the current-year U.S. tax burden, but it can change how later distributions are taxed, so it usually needs modeling rather than a reflexive “always yes.” ([U.S. Code][1])

In plain English: **section 962 is a way for an individual with CFC income to “borrow” corporate-style tax treatment for Subpart F / GILTI-type inclusions, mainly to access lower corporate-rate treatment, section 250 benefits, and deemed-paid foreign tax credits.** ([U.S. Code][1])

[1]: https://uscode.house.gov/quicksearch/get.plx?section=962&title=26 "26 USC 962: Election by individuals to be subject to tax at corporate rates"
[2]: https://www.irs.gov/instructions/i8993 "Instructions for Form 8993 (12/2025) | Internal Revenue Service"
[3]: https://www.irs.gov/pub/irs-pdf/i1040gi.pdf?os=wtmbzegmu5hwrefapp&ref=app "2025 Instruction 1040"

For a **section 962 election**, the return package will typically include these forms:

### Core forms

* **Form 1040** — the section 962 tax is included on **line 16**; the 2025 instructions say to check **box 3** and write **“962”** next to line 16, and attach a statement showing how the tax was figured.
* **Statement for the section 962 computation** — required with the return to show the tax calculation.

### Usually required supporting international forms

* **Form 1118** — if you are claiming the deemed-paid foreign tax credit associated with the section 962 election. The Form 1118 instructions say individuals making a section 962 election use Form 1118 for that purpose.
* **Form 8993** — if you are claiming a **section 250 deduction** for GILTI/FDII-related amounts in connection with the section 962 election. The Form 8993 instructions specifically say U.S. individuals making a section 962 election use it to determine their section 250 deduction.

### Common underlying information returns that may also be required

These are not created by the election itself, but they are commonly part of the same filing because the election usually arises from CFC ownership and CFC income inclusions:

* **Form 5471** — often required if you are a U.S. shareholder/officer/director of a CFC.
* **Schedule 1 (Form 1040)** may be affected because the 2025 instructions say section 951/951A amounts subject to a section 962 election are **not** reported on Schedule 1 lines 8n/8o in the usual way.

## Minimal developer-safe rule

If `section962_election == true`, then require:

1. **Form 1040 line 16 box 3 checked with “962”**
2. **Attached section 962 tax computation statement**
3. **Form 1118** if foreign tax credits are claimed
4. **Form 8993** if section 250 deduction is claimed
5. **Form 5471** if the taxpayer has the filing obligation for the CFC

If you want, I can turn this into a stricter filing-dependency map: **trigger → required forms → line mappings**.
