# TurboTax Deluxe 2024 (Windows desktop, TY2024) — screen-by-screen walkthrough

Fictional household: Jordan (taxpayer) & Casey (spouse) Sample, MFJ, Illinois full-year residents, son Riley (b. 2016).
All screenshots: `screens/NNN-<slug>.png`; each has a sibling `.txt` with the full UI Automation dump
(WPF screens) and, for web-rendered screens, an appended `---- CEF/MSAA content ----` section.

Conventions used below
- **Tab** = main tab › sub-tab (pill) shown in the second nav row.
- **Type** = Intro/Interstitial · Question (Y/N or single choice) · Entry (fields) · Checklist ("Do any of these apply?") · Hub · List-summary · Outcome/Recommendation · Review/Validation · Upsell.
- **Meter** = Federal Refund gauge value in the blue header at the time of the screen ("Illinois: See Amount" appears from screen 007 on).
- **Advance** = the primary button. Unless noted, the footer always has grey **Back** (left) and cyan **Continue** (right) under a thin rule at the end of the content column.
- **Render** = `WPF` (legacy native interview screen; content exposed to UI Automation with field AutomationIds like `FPERSWKS_1__FIRSTNAM`) or `Web` (new "Fuego" web player embedded via CEF/Chromium — `Replatforming/fuegoV2` — exposed only through MSAA; no field ids; different fonts/buttons).
- Bottom bar: "Show Relevant Form" (enabled when the screen maps to a form) / "No Form" (disabled), "Upgrade TurboTax", "Help Others (New)", zoom "80% A A".

---

## Part 0 — Start-up

### 000 — Hi, Welcome to TurboTax!
`screens/000-welcome.png` · Tab: none (start screen, no tabs/meter) · Type: Intro/Interstitial (launcher)
- Body: "We know you work hard for your money. That's why we're here for you to help you get back every dollar you deserve. Let's get started."
- Buttons: **Begin** (`start_newreturn`), **Continue From TurboTax Online** (`start_newreturn_fromtto`). Side panel: "Need to Amend a Filed Return?" › **Amend a Filed Return**; "Want More Time To File This Year?" › **File an Extension**.

### 001 — Let's Find and Transfer Last Year's Tax Return
`screens/001-begin.png` · Tab: none selected yet (tabs visible, meter $0) · Type: Entry/choice (prior-year transfer)
- "We're searching for your tax return on your computer. **Explain This**" + a DataGrid (`TransferListView`: File Name / Last Modified, "Searching for tax files...").
- "Browse for Your Return — We support files from TurboTax (.tax2023 & .pdf), H&R Block at Home (.pdf) and TaxAct (.pdf)." Buttons **Browse**, **Import From TurboTax Online**, Back, **Continue Without Transferring** (advance — used).
- Note: competitor-PDF import is a headline acquisition feature.

### 002 — Getting started with TurboTax
`screens/002-no-transfer.png` · Personal Info › You & Your Family · Type: Intro/Interstitial · Meter $0
- "TurboTax will ask you simple questions about yourself, then look for ways to get you back every dollar you deserve." Continue.

## Part 1 — Personal Info › You & Your Family (all WPF)

### 003 — What's Your Name?
`screens/003-getting-started.png` · Type: Entry · Meter $0 · Form panel: "No Form"
- Only ONE field: **First Name** (`FPERSWKS_1__FIRSTNAM`). Last name, MI, suffix are deferred to screen 035.
- Note: progressive disclosure of PII — the first-name-only screen gets the user personalised copy ("Jordan, What Do You…") immediately with near-zero effort.

### 004 — Jordan, What Do You Do for a Living?
`screens/004-occupation.png` · Type: Entry + Question · Meter $0
- "This is a question the IRS wants us to ask. Don't worry, this information doesn't affect your tax outcome." Inline link **What if I have more than one occupation?**
- Hint: "Examples of occupation include: student, teacher, retired, truck driver etc."
- **Occupation** (`FPERSWKS_1__OCCUP`) = Software Tester; "Did you serve in the U.S. Armed Forces (Active, Reserve, or National Guard) in 2024?" Yes/No radios (`rdb_7`/`rdb_8`) = No.
- Note: two unrelated questions combined on one screen; reassurance microcopy explains *why* the IRS asks.

### 005 — What's Your Home ZIP Code?
`screens/005-what-s-your-home-zip-code.png` · Type: Entry · Meter $0
- "This is the ZIP code where you lived on December 31, 2024." **ZIP Code** (`FINFOWKS_ZIP`) = 62701. "Note: If you lived in another country last year, just select Continue."

### 006 — Was Illinois Your State of Residence for 2024?
`screens/006-was-illinois-your-state-of-residence-for.png` · Type: Question (Y/N) · Meter $0
- State inferred from ZIP and echoed back in the title. Glossary link on the phrase **state of residence**. Yes is **pre-selected**.
- From this point the header shows a second gauge **Illinois — See Amount** (state refund hidden behind a link).
- Decorative side graphic: Illinois map + "Did you know? We'll automatically transfer your info to your state return too!"

### 007 — (help) state of residence glossary → "On Demand Tax Guidance" window
`screens/007-help-glossary-state-of-residence-…png` + `screens/007b-help-window-state-of-residence.png` · Type: Help
- Clicking an in-sentence glossary link opens a separate, movable, non-modal window **On Demand Tax Guidance** (≈625×590) with Back / Print / A A zoom / 100%, an HTML article ("State of Residency" — bulleted factors with bold keywords, cross-link "Military Filers and Their Families") and a blue **See More Help** button. The help window's content is not exposed to UI Automation (accessibility gap).
- The main window simultaneously enables **Show Relevant Form** in the bottom bar.

### 008 — Did You Live in Another State in 2024?
`screens/008-did-you-live-in-another-state-in-2024.png` · Type: Question (single choice, full-sentence answers)
- "Yes, I lived in another state (or country) in 2024. **Learn More**" / "No, I lived in Illinois all year." (chosen).
- Note: answers are written as full first-person sentences, not bare Yes/No.

### 009 — What's Your Birth Date?
`screens/009-what-s-your-birth-date.png` · Type: Entry
- "This helps us figure out which tax benefits you might qualify for to get your maximum refund." **Birth Date** (`FPERSWKS_1__DOB`) "(mm/dd/yyyy)" = 03/14/1985.

### 010 — Can Another Taxpayer Claim You as a Dependent on Their Tax Return?
`screens/010-can-another-taxpayer-claim-you-as-a-depe.png` · Type: Question
- "Let us know if a parent or any other taxpayer can claim you as a dependent…" glossary link **dependent**. Sentence answers (`rdb_1` yes / `rdb_2` "No, no other taxpayer can claim me as a dependent." chosen).

### 011 — Do Any of These Apply to Jordan?
`screens/011-do-any-of-these-apply-to-jordan.png` · Type: Checklist
- Checkboxes: legally blind as of 12/31/2024 (Learn More) · change the language used by the IRS for written communications (Learn More) — Schedule LEP · passed away before filing · nonresident/dual-status alien spouse · currently incarcerated (Learn More) · **None of the above** (`rdb_32`).
- Validation test: clicked Continue with **nothing** checked → no error; it simply advanced (empty = none). → 012.

### 012 — Were You Married?
`screens/012-validation-empty-checklist-were-you-married.png` · Type: Question (single choice)
- "Make a selection below and we'll recommend a **filing status** later on. On December 31, 2024, you were: **Learn More**". Options Single / **Married** / Divorced / Legally separated / Widowed.
- Note: the user answers a life fact; the product, not the user, picks the filing status (see 034).

### 013 — What's Your Spouse's Name?  → `FPERSWKS_2__FIRSTNAM` = Casey (first name only again).
### 014 — What Does Casey Do for a Living?  → `FPERSWKS_2__OCCUP` = Teacher; military No. Same template as 004.
### 015 — Was Illinois Casey's State of Residence for 2024?  → Yes.
### 016 — Did Casey Live in Another State in 2024?  → "No, Casey lived in Illinois all year."
### 017 — What's Casey's Birth Date?  → `FPERSWKS_2__DOB`.
(All Question/Entry screens, meter $0, identical templates with the person's name substituted.)

### 018 — What's Casey's Birth Date? (validation)
`screens/018-validation-bad-dob-what-s-casey-s-birth-date.png` · Type: Review/Validation (inline)
- Entered **13/45/1987** → stays on screen, **field is cleared**, red bold inline message to the right of the format hint: "**Date of birth needs to have a value not later than 2024**".
- Findings: (1) the message is wrong for the actual error (invalid month/day, not a future year); (2) clearing the user's input destroys the evidence of what was wrong; (3) no focus move/summary. Fixed to 07/22/1987.

### 019 — Can Another Taxpayer Claim Casey as a Dependent…?  → No.
### 020 — Do Any of These Apply to Casey?  → None of the above (same checklist as 011).
### 021 — Did Jordan Take Any Higher Education Classes in 2024?  → No. Glossary link **eligible school**; "Jordan might be able to get education tax breaks."
### 022 — Did Casey Take Any Higher Education Classes in 2024?  → No.

### 023 — Did Either of You Make Money in Any Other States?
`screens/023-did-either-of-you-make-money-in-any-othe.png` · Type: Question with heavy explanatory body
- Long body: reciprocity note ("You don't need to enter Iowa, Kentucky, Michigan or Wisconsin below if you only earned W-2 income… agreement with Illinois"), link **What if my employer withheld tax in one of these states?**, reassurance "Don't worry, TurboTax will figure it all out for you down the road", then a bulleted list "Also, select Yes if you made income from any of the below:" (living in one state/working in another, rental property, business, farm, sale of a home, gambling winnings).
- Answer: "No, we didn't make money in any other states."
- Note: state-specific content personalised by resident state (IL reciprocity states).

### 024 — Do You Have Children or Financially Support Another Person?
`screens/024-do-you-have-children-or-financially-supp.png` · Type: Question
- Warm copy: "Your children and those you support are worth every penny you spend on them. Let's see who qualifies you for the tax breaks that go with having a dependent." "**Important:** If you're not sure, select Yes and we'll help you figure it out." Inline **What does support mean?** inside the Yes option; link **What's new with dependents this year**.
- Note: explicit "if unsure, say Yes" guidance — biases toward the screening path, the tool then decides.

### 025 — Who Do You Support?
`screens/025-who-do-you-support.png` · Type: Question — "If you support more than one person, we'll ask about them one at a time." Options: My child (includes adopted, foster, and stepchildren) / Another person (includes half and step relatives, and **in-laws**) / I don't support anyone.

### 026 — Tell Us About Your Child
`screens/026-tell-us-about-your-child.png` · Type: Entry
- First Name (`FWDEPINF_1__FIRSTNAM`), Middle Initial, Last Name, Jr./Sr., Birth Date (mm/dd/yyyy) (`FWDEPINF_1__DOB`), **Citizenship Status** combobox (`ComboBox_8`: U.S. citizen or legal resident / A resident of Canada or Mexico / Neither of the above) + Learn More, "This child is my" Son/Daughter, "This child is" Adopted (If the adoption was final before 2024, select None of the above) / A foster child / None of the above.
- Note: no SSN here — collected later (038).

### 027 — How many months did Riley live with you in 2024?
`screens/027-how-many-months-did-riley-live-with-you.png` · Type: Entry (dropdown)
- "Claiming Riley as a dependent involves counting each month **he** lived with you in 2024." (pronoun derived from Son). Combobox: "-Select a time period-", "The whole year", 11 … 0. Link **How do I count the months my dependent lived with me?**

### 028 — Did any of these apply to Riley?  → Checklist: Disabled (glossary) / Passed away in 2024 / None of these apply. Footer copy: "Next, we'll ask you a few questions about your family. Every household is different, so we want to make sure you get everything you deserve…"
### 029 — Riley's Parents  → "Who are Riley's **legal parents**?" Jordan and Casey / Jordan / Casey.
### 030 — Did Riley Pay for More Than Half of His Living Expenses?  → No (glossary **support**).
### 031 — Did a Relative Help Support Riley?  → No (tie-breaker/multiple-support screening).

### 032 — Good News! Riley Qualified You for a Tax Break
`screens/032-good-news-riley-qualified-you-for-a-tax.png` · Type: Outcome/Recommendation · Meter still $0
- "**Keep going!** As you enter more information, we'll let you know when we find more deductions and credits related to your family."
- Note: celebratory outcome without a number (no income yet), pure motivation.

### 033 — Your Children and Others You Support
`screens/033-your-children-and-others-you-support.png` · Type: List-summary · Advance = **Done**
- "If you have another dependent, you can add them now, or you can edit or delete any of the info you entered." DataGrid (`myItemsList`) columns First Name / Date of Birth / Relationship / Status → "Riley · 05/05/2016 · Son · Dependent" with **Edit** (`EditButton_0`) / **Delete** (`DeleteButton_0`) and an empty placeholder row; button **Add Another Dependent** (`AddButton`).

### 034 — We've Chosen a Filing Status for You
`screens/034-we-ve-chosen-a-filing-status-for-you.png` · Type: Outcome/Recommendation
- "Your 2024 Filing Status: **Married Filing Jointly**" — "Based on what you've told us, filing Married Filing Jointly will give you the maximum refund on your taxes this year. Learn More". Checkbox **Change my filing status** (`rdb_3`).
- Note: the system decides and offers an opt-out, instead of asking the user to pick a status.

### 035 — Just a Few More Questions
`screens/035-just-a-few-more-questions.png` · Type: Entry (deferred details)
- Two blocks "Jordan's Info" / "Casey's Info": First Name (pre-filled), Middle Initial, **Last Name**, Jr./Sr. (`FPERSWKS_1__LASTNAM`, `FPERSWKS_2__LASTNAM`…).
- Note: last names collected only now, after the "qualifying" questions — deferred-PII pattern.

### 036 — Where Do You Receive Your Mail?
`screens/036-where-do-you-receive-your-mail.png` / `037-mail-address-filled-…png` · Type: Entry
- "This is where the IRS will send your correspondence. This address might be different from where you actually live." Address-type combobox (`ComboBox_3`: U.S. Address / APO/DPO/FPO Address / U.S. Territory Address / Foreign Address) → Street (`FINFOWKS_USADDR`), Apt. #, City, State combobox (`ComboBox_9`), ZIP (pre-filled from 005), Contact Phone (`FPERSWKS_1__PHONE`) + Ext. Phone left blank (optional).

### 038 — Let's get your Social Security numbers
`screens/038-let-s-get-your-social-security-numbers.png` · Type: Entry
- "You'll need to enter it for the IRS. We'll ask you again before you file, but entering it now will give you a better idea of how much you're saving." Link **What if one of us doesn't have a Social Security number?** One SSN field per person, labelled by full name (`FPERSWKS_1__SSN`, `FPERSWKS_2__SSN`, `FWDEPINF_1__SSN`), plus checkbox "Riley Sample's Social Security Number is not valid for employment. This is not common but can be found on their Social Security card."
- Note: SSNs are asked **last**, framed as optional-now ("give you a better idea…") — trust-building ordering.

### 039 / 040 — Your Personal Info Summary (+ SSN validation test)
`screens/039-validation-bad-ssn-your-personal-info-summary.png`, `040-…png` · Type: Review/Validation (summary hub for the section)
- 039: SSNs typed without dashes via automation were silently dropped → summary shows "**Social Security number needed**" under each person (no error on the entry screen itself). Back went to the mail screen; Continue re-presented 038.
- 040: entered **000-00-0000** for Jordan (valid-format dashed SSNs for others) → **accepted without any inline error**; the summary displays it. SSN validity is deferred to Smart Check (see Review section).
- Layout: "This is what we've gathered so far. Next, we'll ask you about your income." Cards with bold headers and a cyan **Edit** button each: Jordan Sample (SSN shown **unmasked**, DOB, occupation, Marital Status, State of Residence) · Casey Sample · Dependents (Riley Sample – Dependent) · Your Filing Status (Married filing jointly) · Mailing Address & Phone Number ("Phone number needed") · Other State Income (None).
- Note: missing items shown in-line as "… needed" rather than as errors — soft prompts.

### 041 — Show Relevant Form (Federal Information Worksheet)
`screens/041-show-relevant-form-your-personal-info-summary.png` · Type: Form-link panel
- Bottom-bar toggle **Show Relevant Form** slides up a resizable split pane (`SizeablePanel`, drag thumb) with the actual TurboTax worksheet rendered like paper: "Federal Information Worksheet 2024 ► Keep for your records — Part I — Personal Information… Information in Part I is completely calculated from entries on Personal Information Worksheets. **QuickZoom** to enter taxpayer and spouse information…" with Taxpayer / Spouse columns (First name….. Jordan / Casey) in a typewriter font. Button changes to **Hide Relevant Form**.
- Note: the interview is a façade over real forms/worksheets; the user can peek at the form in place without leaving the interview.

## Part 2 — Federal Taxes › Wages & Income

### 042 — Let's get your biggest possible refund
`screens/042-lets-get-your-biggest-possible-refund.png` · Tab: Federal Taxes › Wages & Income (sub-tabs now: Wages & Income · Deductions & Credits · Other Tax Situations · Federal Review · Smart Check) · Type: Intro/Interstitial
- "First, answer questions about the income you earned last year. Then, TurboTax will search for money-saving deductions and credits to help you get back every dollar you deserve." Link **What's new about the income tax rates this year**.

### 043 — We'll start with your W-2   *(Web)*
`screens/043-we-ll-start-with-your-w-2.png` · Type: Question (single choice) · Meter $0 · "No Form"
- Radios: Work on Jordan's W-2 / Work on Casey's W-2 / We don't have any W-2s / Skip W-2s for now. Links: What if I don't have my W-2? · What if I have more than one W-2? · How do I enter my 1099 or W-2G income?
- **First web-rendered screen**: larger humanist font, 20px radio circles, bigger rounded Back/Continue buttons, wider column (≈950px) — visibly different from the WPF screens. "Show Relevant Form" disabled on web screens.

### 044 — Let's Start With a Bit of Info from your W-2   *(WPF)*
`screens/044-lets-start-with-a-bit-of-info-from-your-w2.png` · Type: Entry
- "Enter the Employer ID Number (EIN), which is usually in box b on your W-2. Learn More" — **Employer ID Number (EIN) or Federal ID:** (`ein`) with a "Box b" caption.
- Validation test: EIN **00-0000000** → no error; Continue went straight to the upload choice (045) and on Back the EIN field was **empty** — the invalid value was silently discarded and the import lookup skipped.

### 045 / 047 — Uploading your W-2 makes taxes easier
`screens/045-validation-bad-ein-…png`, `047-we-ll-add-your-info-right-to-your-return.png` · Type: Choice cards (import vs manual)
- "We'll add your info right to your return and give you a chance to review". Two large cards: **Type it in myself** ("We will walk you through manually entering your info") and **Upload it from my computer** ("Use a PDF or even a picture of your form") with a "Recommendation" ribbon. Footer: Back / **Skip**.
- Accessibility bug: both card buttons are announced as "Intuit.Ctg.Wte.Service.EasyStep.EasyStep.Import.ImportInputMode" (a .NET type name) — no accessible name.

### 046 — Great News! We Can Enter Your W-2 for You
`screens/046-great-news-we-can-enter-your-w-2-for-you.png` · Type: Upsell-ish import offer (payroll-provider import)
- Shown after a *recognised* EIN. "Instead of filling up to 20 boxes yourself, let us import your W-2 into your return. You'll save time and finish your taxes faster." "All fields are required." Security reassurance + "provided by" (payroll partner logo). Buttons **Import my W-2** / **Skip Import** (used) / Back.
- For Casey's employer (057) the same screen also showed the import credentials inline: Box 'd' Control Number (e.g., 001234 SAN2/ABC), Social Security Number, Box '1' amount (dollars & cents - e.g., 23526.80).

### 048 / 049 — OK, let's review your form and fill in any missing info   *(Web)*
`screens/048-ok-let-s-review-your-form-and-fill-in-an.png`, `049-w2-jordan-employer-filled-ok-lets-review-your-form.png` · Type: Entry (form-mirroring, page 1 of W-2)
- "We'll start with boxes b through f of your W-2." Section **Employer information (Boxes b, c, d)**: Box b – EIN (pre-filled 12-3456789, ⓘ), **This W-2 belongs to…** (Jordan), Box c – Employer name, Employer name line 2 (optional), Address type (U.S. address), Address, ZIP code, City, State (select), Box d – Control number (optional).
- Collapsible **Show employee info** → **Employee information (Boxes a, e, f)**: Box a SSN, Box e First name / MI / Last name / Jr, Box f address — pre-filled from Personal Info (Jordan's Box a was blank because his stored SSN was the invalid 000-00-0000; Casey's was pre-filled).
- Labels are the literal W-2 box captions ("Box c - Employer name"), each with a circled **?** help icon. Two-column label/field layout, ~180px inputs.
- Employer address not given in the scenario → used 200 Commerce Dr, Springfield IL 62701 (Acme) and 300 School Rd (school district).

### 050 / 052 — Let's review the rest   *(Web)*
`screens/050-let-s-review-the-rest.png`, `052-w2-jordan-boxes-filled-let-s-review-the-rest.png` · Type: Entry (W-2 boxes 1–20 on one long page)
- "Focus on boxes 1-20. It's okay to leave empty boxes blank." Sections: **Income & taxes withheld (Boxes 1-6)**; **Less common items (Boxes 7-14)**: 7, 8, 10, 11, **Box 12a-12d** repeatable rows (Code select with the full IRS letter list "A - Uncollected social security… / D - Elective deferrals to 401(k) / DD - Cost of employer-sponsored health coverage …" + Amount + trash-can DeleteRow, **Add another box 12 item**), **Box 13** checkboxes (Statutory employee / Retirement plan / Third-party sick pay), **Box 14 and supplemental statement** (Description + Amount rows, Add another box 14 item); **State taxes (Boxes 15-17) - Leave blank if empty on your form.** (State select, Employer's state ID number "Don't include any dashes.", Box 16, Box 17, Add another state); **Local taxes (Boxes 18-20)** (Associated state, 18, 19, 20 Locality name, Add another locality).
- Currency fields auto-format to "$85,000" / "$1,232.50" on blur.
- **Meter moved live to $4,765 while typing Box 1/2 — before pressing Continue.**
- Entered: 85,000 / 9,000 / 85,000 / 5,270 / 85,000 / 1,232.50; 12 D 6,000; Box 13 Retirement plan checked (assumption — consistent with a 401(k) deferral); IL, state ID 1234567 (invented), 85,000 / 4,207.

### 051 — (help) What's included in box 1?
`screens/051-help-box1-tooltip-what-s-included-in-box-1.png`, `051b-help-window-box1.png` · Type: Help
- The ⓘ next to a web field opens the same **On Demand Tax Guidance** window, but here the article renders as unstyled HTML (Times-like serif, default h1) — "What's included in box 1? This includes all of the taxable wages, tips reported to your employer, and other compensation… This amount doesn't include income you deferred, like nontaxable contributions you made toward your retirement." Inconsistent with the styled help in 007b.

### 053 — Let's check for uncommon situations   *(Web)*
`screens/053-let-s-check-for-uncommon-situations.png` · Type: Checklist (per-W-2) · Meter $4,765
- "These don't apply to most taxpayers, but we still have to ask if any are related to your work with **Acme Testing LLC**." 11 checkboxes each with its own "?" explainer link (Nonstandard W-2; W-2c; Didn't get a W2…; Unreported tips; Paid family leave; Nonqualified pension plan not on my W-2; Medicaid waiver difficulty-of-care; Worked outside the U.S.; Religious employment; Inmate or lived in a halfway house; Employed by a foreign government…) + **None of these apply to me**.
- Note: "These don't apply to most taxpayers" — normalising copy that tells the user it's safe to skip.

### 054 — W-2 Summary   *(Web)*
`screens/054-w-2-summary.png` · Type: List-summary · Meter $4,765
- "Add all the W-2s you need to. When you're done, we'll move on to other income types." Table: Box c, Employer | Name | Box 1, Wages, tips, other | Box 2, Federal income tax withheld | status ("Complete" badge) | **Edit** / trash (DeleteItem); **Total** row ($85,000.00 / $9,000.00); **Add another W-2** button.

### 055 — Who does this W-2 belong to?   *(Web)*  → Jordan (pre-selected) / **Casey**.
### 056 — Let's Start With a Bit of Info from your W-2 (Casey)  → EIN 98-7654321.
### 057 — Great News! We Can Enter Your W-2 for You (with inline import fields) → Skip Import → (upload-choice card screen, not re-captured) → Type it in myself.
### 058 / 059 — OK, let's review your form… (Casey)  → Employee info section collapsed this time (**Show employee info** button), SSN pre-filled 400-12-3457.
### 060 — Let's review the rest (Casey)  → boxes 1–6 entered with Box 2 deliberately **60,000** (> Box 1).

### 061 — Let's review the amounts in boxes 1 and 2   *(Web)*
`screens/061-validation-box2-gt-box1-let-s-review-the-amounts-in-boxes-1-and.png` · Type: Review/Validation (dedicated soft-check screen) · **Meter $57,178** (the bogus withholding flowed straight into the meter)
- "Double-check these amounts match what's on your W-2 from Springfield School District." Only Box 1 and Box 2 shown, editable in place. Fixed Box 2 → 4,100 → meter **$1,278**.
- Note: cross-field validation is a separate interstitial with only the conflicting fields, worded as "double-check" (no red, no blame).

### 062 — Let's double-check your state and local taxes   *(Web)*
`screens/062-let-s-double-check-your-state-and-local.png` · Type: Review/Validation (soft nudge)
- Triggered because Casey's boxes 15–17 were left blank (not entered on 060): "We noticed boxes 15-20 are missing some info. If your state doesn't have income tax, or if your W-2 doesn't have anything in the local taxes section, it's okay to leave this blank." Re-shows the state/local sections. Filled IL / 7654321 (invented) / 52,000 / 2,574.

### 063 — Let's check for uncommon situations (Casey / Springfield School District) → None.
### 064 — W-2 Summary  → two rows (Acme Testing LLC · Jordan's W-2 · $85,000.00 · $9,000.00 · Complete; Springfield School District · Casey's W-2 · $52,000.00 · $4,100.00 · Complete), Total $137,000.00 / $13,100.00. Meter **$1,278**.


### 065 / 066 — You're on track to get tax breaks and a refund!   *(Web)*
`screens/065-you-re-on-track-to-get-tax-breaks-and-a.png`, `066-accordion-expanded-….png` · Type: Outcome/Recommendation (end-of-W-2 celebration) · Meter $1,278
- Hero card (light-blue panel + 3-D coin illustration): "So far, your refund is **$1,278**! We will look for more tax breaks once we wrap up income."
- Accordions: **Standard Deduction: $29,200** ("This deduction reduces your taxable income by $29,200. We'll check to see if itemizing saves you more once we finish adding all your income.") and **Child Tax Credit: $2,000** ("You have 1 qualifying dependent. As of right now, you're getting $2,000 for this credit.").
- Green summary strip: "You're getting **$31,200** in tax breaks so far! This number may change as we collect more info…"
- Finding: the "tax breaks" total **adds a $29,200 deduction to a $2,000 credit** — mixing pre-tax and post-tax dollars into one number. Motivating, but numerically meaningless.

### 067 — Do You Have Other Income to Enter?
`screens/067-do-you-have-other-income-to-enter.png` · Type: Question with examples list (WPF)
- "Now that you've entered your W-2s, tell us if you have other types of income, such as:" bullets (1099-INT/DIV/OID, 1099-G unemployment, 1099-C, SSA-1099/1099-R, 1099-B, 1099-MISC, Capital loss carryover) + **See more examples of income**. Options "Yes, we need to add or change an income item." / "No, take us to deductions and credits." Footer note: "Income does not include things like mortgage or student loan interest. Those are deductions and we'll work on them later."

### 068 — How do you want to enter your income?
`screens/068-how-do-you-want-to-enter-your-income.png` · Type: Choice (mode selection)
- Two columns: **Guide me** — "Walks you through all income sections, one at a time / Best if you want us to take you through all situations" → **Walk me through everything** (`Button_8`); **I'll explore on my own** — "Choose specific types of income… Best if you know which situations apply to you" → **I'll choose what I work on** (`Button_9`, used here).
- Note: explicit novice/expert fork; the same fork appears for Deductions (113).

### 069 – 071 — Your 2024 Income Summary (income hub)
`screens/069-your-2024-income-summary.png`, `070-income-hub-scrolled-…`, `071-income-hub-bottom-…` · Type: **Hub**
- Intro: "You can enter new information for a specific topic by choosing **Start**, or make changes by choosing **Update**, or see a whole section by choosing **Visit All**." A grey "2024" column tab heads the amount column.
- Each category = illustrated icon + bold title + grey sub-line, then topic rows "Topic name **Learn More**" … amount link … button. Cyan **Start** (not visited) vs grey **Update** (has data, amount shown as a link e.g. "$137,000."). Categories with several topics get a **Visit All** button.
- Categories: Import Summary (History of Imported Documents, 0 Item(s), View) · Wages and Salaries (Form W-2) · Unemployment (1099-G) · 1099-MISC and Other Common Income (state/local refunds 1099-G, Other 1099-G, 1099-NEC, 1099-MISC, 1099-K) · Interest and Dividends (1099-INT, 1099-DIV, 1099-OID/Foreign Accounts, Seller-financed loans) · Investment Income (Stocks/Crypto/Mutual Funds/Bonds/Other, Capital Loss Carryover, Undistributed Capital Gains, Contracts and Straddles) · Retirement Plans and Social Security (1099-R, SSA-1099/RRB-1099, Canadian Registered Pension) · Rental Properties and Royalties (Sch E) · Business Items (Sch C, K-1/Q, Farm, Business Deductions and Credits, Sale of Business Property) · Less Common Income (1099-SA/HSA/MSA, Prizes/Gambling, Alimony Received, Jury Duty, Foreign Earned Income, Child's Income (Under 24), Sale of Home, Installment Sales, Misc/1099-A/1099-C). Footer button **Done with Income**.
- Note: the hub is a flat, scrollable list of ~45 topics; status is conveyed by button colour/label and amount only (no checkmarks).

### 072 — Did you have investment income in 2024?   *(Web)*
`screens/072-did-you-have-investment-income-in-2024.png` · Type: Question (Y/N buttons, no Continue)
- "This can include:" Interest earned · Dividends · Sale of stocks, bonds, etc. · Crypto sales, exchanges, or currency use · Other (sales of land, second home, etc.). Promo card "Reporting crypto is easier than you think — Get started with a quick video and FAQs. **Take a look**". Links "What forms and files are covered here?", "What's not included in this section?". Buttons **Yes** / **No**.

### 073 / 082 — Let Us Enter Your Bank and Brokerage Tax Documents   *(WPF)*
`screens/073-let-us-enter-your-bank-and-brokerage-tax.png` · Type: Import offer
- "We can retrieve 1099-INT, 1099-DIV, 1099-B and 1099-OID forms directly from your banks and brokerages… By partnering with **hundreds of financial institutions**… Importing is safe, fast and accurate." Type-ahead "I'm looking for: [Enter financial institution name here]" over a long listbox of institutions (AB Bernstein, Acorns, Ally, Amazon.com …), "Import your data now from Other Financial Software (TXF File), QuickBooks, Quicken" **Import now**; footer **Continue** (`done`), **Skip Import** (`skipIntv`, used), Back.
- Accessibility: list items announced as "Intuit.Ctg.Wte.Service.Import.ImportableFiSource".

### 074 — OK, let's start with one investment type   *(Web)*
- "(We'll come back to add any other types later.)" Radios Interest / Dividends / Stocks, Bonds, Mutual Funds / Cryptocurrency / Other; links "Why don't I see my investment?", "What does each form or file report?".

### 075 / 076 — Let's get the info from your 1099-INT   *(Web)*
`screens/075-…png`, `076-1099int-filled-…png` · Type: Entry (progressive disclosure of boxes)
- **Payer's information**: Federal Identification Number (FEIN), Received from (Learn more; "This is usually your financial institution."), This 1099-INT belongs to… (Jordan — owner is per-person even on a joint return; assigned to Jordan as an assumption). **Interest**: Box 1 - Interest income, Box 3 - Interest on U.S. Savings Bonds and Treas. obligations; checkbox "**My form has info in other boxes (this is uncommon).**" reveals the rest; link "What if my form has other boxes filled in?".
- Only 2 of the 1099-INT boxes shown by default. FEIN was **not** required on this screen. Meter moved $1,278 → **$901** while typing.

### 077 / 080 — Do any of these uncommon situations apply? (1099-INT)
- Checkboxes: "I need to adjust the interest reported on my form. Learn more" · "My state (ME, MD, MA, NH, NJ, or WV) doesn't tax all of this interest. Learn more" · None of these apply. Meter **$871** after Continue.

### 078 / 081 / 085 / 099 — Let's finish pulling in your investment income   *(Web)*
`screens/078-lets-finish-pulling-in-your-investment-income.png` etc. · Type: List-summary (investment "wallet")
- Grouped by institution: **First Bank** › card "Interest (1099-INT) $1,850.00 Box 1 - Interest income" with a **NEEDS REVIEW** badge + **Review** button (first time, because FEIN was missing); later cards become plain buttons. **Add investments**; **See my capital gains** (after a 1099-B); primary button **Confirm**.
- Accessibility: the heading's accessible name starts with the raw file name "icn-accurate-reporting-investment-sales.svg".

### 079 — Now, let's review your 1099-INT   *(Web)*
`screens/079-now-let-s-review-your-1099-int.png` · Type: Review/Validation (deferred required field)
- Red-bordered pink banner with ⚠ "**We still need some required info.**" FEIN field outlined in red with placeholder "xx-xxxxxxx" and "⚠ Needs info" beneath. Filled 36-1234567 (invented — not in scenario).
- Pattern: let the user move fast on entry, then force a review pass that blocks on missing required data.

### 083 / 084 — Let's get the info from your 1099-DIV + uncommon situations   *(Web)*
- Same template: Payer FEIN (36-7654321 invented), Received from "Big Fund", belongs to; **Dividends and gains — Leave blank if empty on your form.** Box 1a, Box 1b (Learn more), Box 2a (Learn more); "My form has info in other boxes (this is uncommon)."
- **Validation test**: entered Box 1b **3,000** > Box 1a 2,400 → **no error at entry time**; it advanced to the uncommon-situations checklist (084: U.S. Government interest / adjust or ESOP / holding period not met / None). The error surfaces only in Forms mode (108–109) and Smart Check. Meter → **$463**.

### 086 / 087 — Which bank or brokerage is on your 1099-B?   *(Web)*
- Bank or brokerage (type-ahead combobox), Account number (optional) "Enter when you need to tell your accounts apart.", Payer's EIN (optional); link "Where can I find my 1099-B?".
- 087: inline error "⚠ Please provide a name." under a red field (shown when the value was injected programmatically rather than typed; real typing cleared it).

### 088 – 092 — Tell us about the sales on your Big Broker 1099-B   *(Web)*
`screens/088-…png` → `092-…png` · Type: **Progressive stacked questions on one page**
- "We'll use this to personalize your experience." Each answer reveals the next question card below (auto-scroll): illustrated icon + bold question + helper + big tile buttons (green fill/border when selected):
  1. Do these sales include any employee stock? (ESPP, RSU, RS, NQSO, ISO) → No
  2. Do you have more than three sales on your 1099-B? "Include sales under every section." → No (1-3) / Yes (4+)
  3. Do these sales include any other types of investments? (land, collectibles…) → No
  4. Did you buy every investment listed on your 1099-B? "Any inherited or gifted investments are **not** considered bought" → Yes
- Continue appears only after the last answer. Accessibility: icon alt texts don't match ("Refund transfer" icon on the "Did you buy…" question).

### 093 — Now, choose how to enter your sales
- "One-by-one is the best way since you have only a few sales." Radios **One by one** (pre-selected, adaptive default from the "1-3" answer) / Sales section totals; link "What's the difference?".

### 094 — Look for your sales on your 1099-B
- Animated illustration ("An animation of Premier Sales Category") + bullets: find all sales within each section (up to 7) / each sale has its own row / enter all sales (don't use the totals). Inline micro-survey "**Did this help?** Yes / No".

### 095 / 096 — Now we'll walk you through entering your sale details   *(Web)*
`screens/096-1099b-sale-filled-…png` · Type: Entry
- "Your info should match your 1099-B exactly…". **Sales section title** explainer ("keywords like: short term, long-term, reported, not reported, covered… Covered and reported mean the same thing. Example: Short-term transactions for which basis is reported to IRS.") + **Sales section** select (Short-term/Long-term × basis reported (covered) / not reported (noncovered) / did not receive 1099-B, Unknown term). **Sales info (Boxes 1a - 1e)**: What type of investment did you sell? (Stock (non-employee)), Box 1a Description ("Example: 20 shares of XYZ company"), Box 1b radio "The date this investment was acquired" (date field) / "Something other than a date", Box 1c Date sold, Box 1d Proceeds, Box 1e Cost basis; checkboxes "The cost basis is incorrect or missing on my 1099-B", "I have other boxes on my 1099-B to enter"; links incl. "Show me a video overview of my 1099-B".
- Accessibility: the Box 1b date field's accessible name is an internal id ("stk-transaction-summary-entry-views-0-fields-5-choice-…-DateAcquiredDtPP").

### 097 — Let us know if any of these situations apply to this sale
- Select all that apply: sales expenses not in proceeds · Box 2 "ordinary" checked · correct holding period · small business stock · worthless security · stock to an ESOP/EWOC · None. **Meter flips: label "Federal Refund" → "Federal Tax Due", value $62 in red.**

### 098 — Review your Big Broker sales   *(Web)*
- Sortable table: Description · Date sold or disposed · Sales section (? "What does this sales section title mean?") · Proceeds · Cost basis · Gain/loss · Status (sort) → "50 sh XYZ · 2024-06-15 · Long-term (Box D) · $7,500.00 · $4,000.00 · $3,500.00" + EditItem/DeleteItem; **Add another sale**; link "What if these numbers don't match my 1099-B?".
- Note: date shown ISO (2024-06-15) although entered mm/dd/yyyy — inconsistent formatting.

### 100 / 101 — Your capital gains so far   *(Web)*
- 100 (via "See my capital gains"): "Capital gains income **4,100** — Tax on this income is included in your total tax due of $62. This amount may change…" links "What is capital gains income?", "How was my capital gain of $4,100 calculated?"; **Tips for next time** cards (Holding investments for a full year · Harvesting losses · Investing through tax-deferred accounts · Reviewing cost basis methods) + "Was this helpful?" Yes/No.
- 101 (after Confirm): short version "$4,100 — Tax on these gains is included in your total tax due of $62." Back / **Next**.
- Note: tax-planning education embedded at the moment of relevance; $4,100 = $3,500 sale gain + $600 cap-gain distribution, which the copy doesn't explain inline.

### 102 — Your 2024 Income Summary (after investments) → rows now show $1,850 / $2,400 / $3,500 with grey **Update** buttons. Meter: Federal Tax Due $62.

## Part 3 — Tools explored from the income hub

### 103 — Show Topic List (modal dialog)
`screens/103-topic-list-dialog.png`, full outline in `screens/103-topic-list-dialog-tree.txt` · Type: Navigation tree
- Modal "Topic List" (≈750×700): toolbar **Collapse all / Main topics / Expand all / Help**; tree "1. Personal Info › Start Your Return › You & Your Family; 2. Federal Taxes › Prepare Your Federal Tax Return › Wages & Income › Your Income › Wage and Salary Income (Form W-2) …; 3. State Taxes; 4. Review; 5. File" with document icons; a **red check** overlay marks visited topics; the current topic is highlighted. Instance nodes appear (e.g. "Form 1099-DIV (Big Fund)"). Cyan **Close** button. Esc did not close it.
- Accessibility: tree items are announced as "Intuit.Ctg.Wte.Service.Outline.Outline.ViewModel.TopicTreeItem".

### 104 / 105 / 106 — SEARCH
`screens/104b-search-panel-window.png`, `105b-search-turbotax-help-window.png`, `106-search-results-child-care.png` · Type: Help search (gated)
- Clicking **SEARCH** first opened an Intuit **sign-in** overlay ("Let's get you in to TurboTax — Phone number, email, or user ID — Sign in — New to Intuit? Create an account"). Closing it (×) revealed the "TurboTax Help" side panel: search box "Search questions, keywords or topics", "People like you viewed these answers" (How do I preview my return in the TurboTax Desktop software? / How do I amend… / What do the letter codes in box 12 of my W-2 mean? / Where do I enter a 1099-MISC? / Where do I enter Form 1098-T?), and a **Contact Us** button.
- Findings: search is a **help-article search** (online FAQ), not "jump to topic"; every result's snippet is the site's navigation text ("TurboTax Support Account management After filing Credits and deductions File taxes…") — a scraping bug; a typed query did not register through automation (results not verified).

### 107 – 109 — Forms mode
`screens/107-forms-mode-1099b-worksheet.png`, `108-forms-mode-1099div-error.png`, `109-forms-mode-errors-panel.png` · Type: Forms view (expert mode)
- Header button **Forms** → layout switches: menu bar gains a **Forms** menu, the button becomes **Step-by-Step**, Flags disappears; left pane "**Forms in My Return**" (Open Form, **Errors** buttons; list "Form 1040: Individual — 1040/1040SR Wks (Not Done), Form 1040, Info Wks, Personal Wks (Casey), Student Info Wk, Personal Wks (Jordan) (Not Done), Dependent Wks (Riley), Form W-2 (Acme Testing LLC), Form W-2 (Springfield School District), Earned Inc Wks, Tax Payments, Qual Div/Cap Gn, Schedule B (Not Done), Form 1099-DIV (Big Fund) (Not Done), Form 1099-INT (First Bank), Schedule D, Form 1099-B Wks (Big Broker), Cap Asset Sales (1), Form 8949 (Copy 1), Schedule 8812, Form 1040-V, W2/W2G Summary, Carryover Wks, Tax History, Tax Summary, Filing Inst, Return Summary, U.S. Averages"). Red "!" markers flag forms with errors.
- Right pane: worksheet facsimile ("Form 1099-B Worksheet 2024 ► Keep for your records") with yellow input cells, blue typed values in a monospace font, **QuickZoom** buttons, a tab per open form, bottom **Print / Delete Form / Close Form**, zoom 100% A A.
- The invalid Box 1b (3,000) is shown in a **red cell**; the **Errors** button opens a bottom error bar: "Form 1099-DIV (Big Fund) — Qualified dividends in box 1b can't be greater than total ordinary dividends in box 1a ($2400.00). In some cases, a second step might be needed. Go to the 1099-DIV for Big Fund and change the amount there." with ▲/▼ to step through errors.
- Jordan's invalid SSN 000-00-0000 also surfaces as "Personal Wks (Jordan) (Not Done)". Forms mode is where hard validation lives; the interview never showed these errors.
- Automation note: invoking the toggle via UIA flipped its label but did not switch views; a real click was required.

### 110 — Back to Step-by-Step → returns to the exact same hub screen.

### 111 / 112 — Flags & Notifications buttons
- **Flags** is a toggle (selected state = white tile). In step-by-step mode toggling it on produced no visible change on the hub (no panel, no markers) — it relates to field-level review flags (the dump shows a hidden `TPFLAG` combobox used by the forms). **Notifications** likewise toggled to a selected state with an empty side bar (nothing to show offline / signed-out). Neither has a tooltip or accessible name.

## Part 4 — Federal Taxes › Deductions & Credits

### 113 — How do you want to enter your deductions and credits?  → Guide me / I'll explore on my own; chose **Walk me through everything**.

### 114 — So Far, It Looks Like You Could Get These Tax Breaks
- Linked list: Earned Income Credit (EIC) · Child and Dependent Care Credit · Child and Other Dependents Tax Credit · Education-Related Deductions or Credits. "Let's keep going and see what else you could get. First, we'll ask you some simple questions about your year…"
- Finding: EIC is promised to a household with ~$145k AGI — overpromising (136 later says "you don't qualify").

### 115 – 123 — Life-event screener (one Y/N question per screen, all WPF, "you and Casey" phrasing)
| # | Title | Answer |
|---|---|---|
| 115 | Did You and Casey Own a Home in 2024? ("…deduct mortgage interest, property taxes… Tell me more") | Yes |
| 116 | Did You or Casey Move in 2024? | No |
| 117 | Did Either of You Use Your Own Money to Pay for Job Expenses in 2024? ("teacher (educator) expenses, uniforms…") | Yes |
| 118 | Did You or Casey Give to Charity in 2024? | Yes |
| 119 | Did Either of You Have Any Medical Expenses in 2024? — options "Yes, we paid more than **$10,901**…" / "No, we didn't pay more than $10,901…" | No |
| 120 | Did You Have Any Education Expenses in 2024? ("Note: Answer yes if you paid education expenses for a dependent.") | No |
| 121 | Did You or Casey Pay Any Student Loan Interest in 2024? | No |
| 122 | Did You or Casey Pay Someone to do Your Taxes Last Year? | No |
| 123 | Did You or Casey Pay Alimony in 2024? | No |
- 119 is notable: the 7.5%-of-AGI medical floor is **computed and embedded in the answer text** ($145,350 × 7.5% = $10,901), turning a threshold rule into a plain yes/no.
- The screener did **not** ask about child care or IRA contributions (child care came via the family-credits block; IRA via the hub).

### 124 — You've Done a Great Job So Far!  → Interstitial: "Next we'll ask you for some more info on the topics you told us you had…"
### 125 — Now We'll Cover These Common Family Credits  → list of 4 credits + "What paperwork do I need?"; buttons Continue / **Skip for now** / Back.
### 126 — Did you pay for child and dependent care in 2024?  → explanatory body + links; **No / Yes** buttons (No on the left). Yes.
### 127 — Whose care did you pay for?  → combobox (`ComboBox_4`: Choose a name… / Jordan (age 39) / Casey (age 37) / Riley (age 8)) + **Add Another Person**. Ages computed and shown in the picker.
### 128 — How much did you pay for Riley's care in 2024?  → "Be sure to also include money paid from a Flexible Spending Account (FSA)…" `FWDEPINF_1__CCEXP` = 4,000.
### 129 — Here's what we have so far  → List-summary (Riley 4,000 / Total Care Expenses 4,000, Add Expenses for Another, Done). **Meter: Tax Due $62 → Refund $538.**
### 130 / 131 — Let's get some info about your care provider
`screens/131-care-provider-filled-…png` · Entry with radio-revealed fields: Tax ID type **EIN** (reveals Business Name `F2441_L1A_1_`, Business (cont'd), Enter the EIN `F2441_L1C2_1_`) / SSN of Care Provider / Other; Address, City, State, ZIP, Total paid to this provider in 2024; "Is this care provider your household employee?" Yes/No. Link "What if I don't have this info?". Daycare address invented (50 Oak Ave, Springfield IL).
### 132 — Before we continue, we thought you should know...  → tax-planning tip about dependent-care FSAs vs the credit (Interstitial/education).
### 133 — Here's what you spent on care providers  → List-summary (Provider / Tax ID Number / EIN Number / Amount Paid; Little Sprouts Daycare 11-2223333 4,000.00; Add Another Care Provider; Done).
### 134 — Did you pay for any 2023 care in 2024?  → "(This is not common.)" No.
### 135 — Your Child and Dependent Care Credit Summary
- Outcome: "Great news! You qualify for this credit. Money back in your pocket is always a good thing." Eligible dependent care expenses **$3,000** · Credit percentage **20%** (Learn more) · Your Child and Dependent Care Credit **$600** — shows the math (cap × rate) transparently.
### 136 — It turns out you don't qualify for this credit   *(Web)*
- "That's OK. We'll keep looking for other tax breaks for you." Back / Done. Finding: **doesn't name the credit** (it was the EIC).

### 137 / 138 — Your 2024 Deductions & Credits (hub)
`screens/137-your-2024-deductions-credits.png`, `138-deductions-hub-bottom-…` · Type: Hub (same component as the income hub)
- Categories: Your Home (Mortgage Interest/Points/Refinancing/Insurance; Property Taxes; Home Energy Credits; Mortgage Interest Credit Certificate; Homebuyer Credit Repayment; D.C. First-Time Homebuyer Credit) · You and Your Family (Child and Dependent Care Credit $600; EIC $0; Adoption Credit; Child and Other Dependents Tax Credit — "**Needs review**" in green text) · Charitable Donations (2024; Carryover from 2023) · Cars and Other Things You Own · Education (1099-Q; 1098-T; 1098-E) · Medical (1099-SA/HSA/MSA; Medical Expenses; ACA 1095-A) · Estimates and Other Taxes Paid (Estimates; Other Income Taxes — pre-filled **$19,881**; Sales Tax; Foreign Taxes; Credit for AMT Paid in Prior Year) · Retirement and Investments (Traditional and Roth IRA Contributions; Saver's Credit; Investment Interest Expenses; Other Investment Expenses) · Employment Expenses (Teacher (Educator) Expenses; Job-Related Expenses) · Other Deductions and Credits (Tax Prep Fees; Moving; Casualties and Thefts; Elderly or Disabled Credit; Alimony Paid; Nonbusiness Bad Debt; Legal Fees; Other Deductible Expenses; Other Credits). Footer **Done with Deductions**.
- Several categories carry a small **Get Extra Help** pill (Your Home, Charitable Donations, Medical) — entry point to paid expert help (not clicked).
- Note: "Walk me through everything" returned to this hub after the family-credits block rather than continuing linearly through the topics the screener flagged.

### 139 — Did you pay any home loans in 2024?
- Scope-setting copy: "This deduction covers: Interest and points…, Mortgage insurance (PMI or MIP), Interest on refinanced or home equity loans. This deduction does not cover rental or business properties, or **other things**. We'll ask about these forms: 1098, HUD-1, Closing Disclosure. You won't need these forms right now (we'll ask about them in another area): 1098-T, 1098-E." Links "What if I don't have my 1098?", "What's new with mortgage interest this year". No / Yes.
### 140 — Who's your mortgage lender?  → Lender name `FHOMEINT_1__L2A` = Home Lender.
### 141 — What kind of property do you have?  → Primary Home / Second Home / Other, each with a one-line definition.
### 142 — Do any of these situations apply? → names not on 1098 / seller-financed / **None of the above**.
### 143 / 144 — Let's get the details from your Home Lender 1098
`screens/144-1098-filled-…png` · Entry mirroring Form 1098: Box 1 Mortgage interest (`FHOMEINT_1__L3`) + checkbox "The interest amount I entered is different than what's on my 1098", Box 2 Outstanding mortgage principal, Box 3 Mortgage origination date, Box 5 Mortgage insurance premiums, Property (real estate) taxes paid (`FHOMEINT_1__PROPTAX`), "Box 7 is checked", Box 11 Mortgage acquisition date ("If Box 11 is blank, leave it blank here."). Principal 300,000 and origination 06/01/2018 invented.
### 145 — Tell us about any points paid to Home Lender → "I have no points to deduct for this loan."
### 146 — Let's see if this is the most recent form for this loan → Yes ("If you only have one 1098, select Yes.")
### 147 — Let's get some details about this loan → not a HELOC/refi.
### 148 — Have you used the money from this loan exclusively on this home? → Yes.
### 149 — Thanks, we got all your mortgage info → Outcome: "**Right now, the Standard Deduction saves you the most on taxes.**" (meter unchanged $538 — honest explanation of why entering $11k of interest didn't move the meter).
### 150 — Home loan deduction summary → List-summary (Mortgage Lender / Interest / Deductible Points; Home Lender 11,200.00; Add a Lender; Done).

### 151 — Deductions hub again (mortgage $11,200 and property taxes $4,800 now shown with Update).

### 152 — Donations → explainer list + "Do you want to enter your donations for 2024?" No / Yes.
### 153 — Let's enter your donations one at a time
`screens/153-let-s-enter-your-donations-one-at-a-time.png` · Entry + action list: "Who did you donate to in 2024?" (`CHARNAME_1__CHNAME`) "(Enter one charity at a time)"; "What did you donate?" four rows each with a cyan **Add**: Items / **Money** / Stock / Mileage and travel expenses; footer **Skip for now**.
- Accessibility: four identical "Add" buttons with no distinguishing accessible name.
### 154 — Tell us about the money you gave to Red Cross → How often you gave (One time / Multiple times, same amount / Multiple times, different amounts) + Amount; button **Done with This Donation**.
### 155 — Review Your Donations to Red Cross → List (Date "(not needed)" / Type Money / 1,500.00); Add Another Donation; "I need to change the name of this charity"; Done.
### 156 — Review All Your Charities → second-level list (Red Cross 1,500.00 / Total); **Done with Charitable Donations**. Meter unchanged ($538, standard deduction).

### 157 — Deductions hub (charity $1,500).
### 158 — Traditional IRA and Roth IRA
`screens/158-traditional-ira-and-roth-ira.png` · Entry (person × type checkbox matrix): columns **Jordan / Casey** (orange headers), rows Traditional IRA / Roth IRA / None of the above. Checked Casey-Traditional, Jordan-None. Accessibility: the six checkboxes have **no accessible names** (`rdb_9`…`rdb_14`).
### 159 — Make the most of your retirement money with TurboTax Premier   **[UPSELL]**
`screens/159-upsell-premier-ira.png` · Title block empty. "Premier is a better product for you if you need retirement guidance. … IRA Calculator … My Analysis & Advice … **Upgrade to TurboTax Premier for just $35.00** and get these extra benefits." Buttons **Upgrade** / **Continue in TurboTax** (used) / Back. Interrupts the IRA flow mid-task.
### 160 — Did Casey Contribute To a Traditional IRA? → Yes (No/Yes buttons).
### 161 — Is This a Repayment of a Retirement Distribution? → No.
### 162 — Tell Us How Much You Contributed → `FW24_STCONT` = 2,000; "…how much of the above… you contributed between January 1, 2025 and April 15, 2025" (`FW24_STLATE`) left blank.
### 163 — Did You Change Your Mind? (recharacterization, echoes "$2,000") → No. **Meter $538 → $978.**
### 164 — Retirement Plan at Work — "Is Casey covered by a retirement plan at work?" → No (assumption: not stated in scenario).
### 165 — Retirement Plan at Work — "We see Jordan was covered by a retirement plan at work based on the W-2 from Acme Testing LLC. Select Continue." → Info-only screen inferred from W-2 box 13 (personalised, no question).
### 166 — Any Excess IRA Contributions Before 2024? → No.
### 167 — Any Nondeductible Contributions to Casey's IRA? → No.
### 168 — Choose Not to Deduct IRA Contributions → "No, we'll keep the deduction (**recommended**)."
### 169 — Your IRA Deduction Summary → "Good News: … you qualify for an IRA deduction of $2,000. You will need to complete your return before we can show you the actual results."
### 170 — Deductions hub.
### 171 — Did you spend your own money as a teacher in 2024?   *(Web)*
- "Because Casey's occupation is listed as "Teacher," you may be able to take advantage of this deduction." — **occupation from Personal Info drives a targeted prompt**. Bulleted qualifying conditions; Back / Yes / No.
### 172 — How much did you spend in educator expenses?   *(Web)* → per-person fields **Jordan** / **Casey** under "Unreimbursed educator expenses"; Casey 300.
### 173 — Congrats, you get a tax break   *(Web)* → "Teacher (Educator) Expenses Deduction — Your $300 deduction just saved you money on your taxes this year." **Meter $1,044.**

### 174 — Let's Check Your Deductions and Credits
`screens/174-let-s-check-your-deductions-and-credits.png` · Type: Interstitial ("analysis" animation)
- "We'll make sure you get every deduction and credit you're entitled to…" "Checking For Missed Deductions and Credits" with three progress bars (Deductions / Credits / Processing) → "Analysis complete." — a staged "labor illusion" screen.
### 175 — Let's Check Your Homebuyer Credit → 2008 first-time homebuyer credit repayment check → No.
### 176 — IRA Contributions Results → table Total Contribution / Amount Deductible (Traditional $2,000/$2,000; Roth $0/$0; Total $2,000/$2,000).
### 177 — Jordan and Casey, Here are Your 2024 Deductions & Credits
`screens/177-jordan-and-casey-here-are-your-2024-dedu.png` · Type: Review summary
- "✓ We've reviewed every deduction and credit available… Good News: You're getting a standard deduction of $29,200." **Deductions**: Standard Deduction $29,200 · Educator Expenses $300 · IRA Contributions $2,000 · State and local taxes greater than $10,000 **(-$1,581)** · Total Deductions **$31,500**. **Credits**: Dependent Care Credit $600 · Child and Other Dependents Tax Credit $2,000 · **Tax Withholding $13,100** · Total Credits $15,700. Link "Where are my other credits?".
- Findings: (1) withholding is labelled a "credit"; (2) the SALT-cap line is shown although itemizing wasn't used, and the column doesn't foot (29,200+300+2,000 = 31,500; the −1,581 is ignored) — confusing.
### 178 / 179 — Based on what you just told us: Standard Deduction is right for you   *(Web)*
`screens/179-std-vs-itemized-breakdown-…png` · Type: Outcome/Recommendation with comparison chart
- Two bars: tall blue **$29,200 Standard Deduction** (confetti icon, "Federal refund with this deduction: $1,044") vs shorter grey **$22,700 Itemized deductions**. Collapsible "Show me the estimated breakdown": Property, state, and local tax deduction (limited to $10,000) $10,000.00 · All Deductible Interest $11,200.00 · Total Deductible Charity $1,500.00 · Itemized Deductions $22,700.00. Copy: "Since the Standard Deduction is a larger amount… Let's keep going and lock in the Standard Deduction for you." Small **Change my deduction** button + links "Why would I change my deduction?", "Explain these deductions".

## Part 5 — Other Tax Situations

### 180 — Other Tax Situations (hub)
`screens/180-other-tax-situations.png` · Type: Hub
- "Here are a few additional items that might apply to you." Alternative minimum tax (AMT) · Business Taxes · Additional Tax Payments (Underpayment penalties; Extra tax on early retirement withdrawals; Nanny and household employee tax; Apply refund to next year) · Other Return Info (Identity protection PIN; Identity theft affidavit; Presidential campaign fund) · Other Tax Forms (Amend a return; File an extension; Form W-4 and estimated taxes; Miscellaneous tax forms). Footer **Done with Other**.

### 181 — Do you want to designate $3 to a presidential campaign fund?   *(Web)*
- "This general fund gives campaign money to presidential candidates. Selecting **Yes** won't affect your tax due or refund." Per-person radio groups **Jordan** Yes/No and **Casey** Yes/No → No / No. Reassurance about no tax effect directly answers the user's real worry.
### 182 — Other Tax Situations hub (campaign fund now "Update").

### 183 — Let's see if you need to pay the alternative minimum tax (AMT) this year   *(Web)*
- Triggered by **Done with Other** (the hub's done button runs a mandatory AMT check before leaving). "The alternative minimum tax-also called AMT-ensures that everyone pays a minimum amount of tax each year… Select **Yes** if you have any of these common deductions for 2024: Standard Deduction · State, local, and property taxes · Exercise or sale of incentive stock options (ISOs)". Buttons Back / Yes / No → Yes (standard deduction applies).
### 184 — Do you have any of these uncommon situations? → six long AMT-adjustment checkboxes (ISOs, investment AMT adjustments, depreciation history, …) + "None of these apply to me in 2024".
### 185 — As it stands right now, your final number → "Alternative Minimum Tax **$0**" + Show more; link "How can I avoid or reduce AMT next year?".
### 186 — Here's the alternative minimum tax (AMT) info we've got for you → table Alternative Minimum Taxable Income 143,050.00 · Tentative Minimum Tax 1,754.00 · Regular Tax 14,656.00 · AMT 0.00 with Update/Delete; Done.
### 187 — Other Tax Situations hub (AMT now "Update"); **Done with Other** again proceeds.

## Part 6 — Federal Review & Smart Check

### 188 — We're Ready to Review Your Federal Return
- "Before we review your federal return and make sure it's error-free, let us know if you have any leftover tax forms or papers to enter. **Which forms and papers can I ignore?** Have you entered all your tax forms or papers?" → "Yes, I've entered everything and let's review" / "No, I have something to enter".
### 189 — Let's double-check your info
`screens/189-let-s-double-check-your-info.png` · Review/Validation (identity re-confirmation)
- "We recommend you review your Social Security number and birth date to make sure they're right. Typos can delay your refund…" Editable name/MI/last/suffix/DOB/**SSN** for both spouses — Jordan's SSN still shows **000-00-0000** with no warning on this screen.
### 190 — Jordan and Casey, Let's Review Your Numbers
`screens/190-jordan-and-casey-let-s-review-your-numbe.png` · Review summary
- "You're almost done! Here's how your federal taxes look this year." **Federal Tax Summary**: Your Total Income $145,350 · Federal Deductions We Found For You $31,500 · Your Taxable Income $113,850 · Federal Credits We Found For You $2,600 · **Detailed tax breakdown** button. **How We Calculate Your Federal Refund**: Federal Taxes You Owe $12,056 · Federal Taxes You've Paid, Plus Certain Credits −$13,100 · Your Federal Refund $1,044.
- Note: "We Found For You" framing credits the software for the user's own entries.
### 191 — 2024 Tax Breakdown
`screens/191-detailed-tax-breakdown-2024-tax-breakdown.png` · Review (explainable math)
- Income (Wages $137,000 · Interest and Dividends $4,250 · Other Income $4,100 · Total $145,350 + **Revisit**). Deductions with two columns **You Entered / You're Allowed** (orange headers): Donations to charity $1,500/$0 **Why the Difference?** · IRAs and ROTH $2,000/$2,000 · Mortgage Interest $11,200/$0 Why the Difference? · Standard deduction $29,200/$29,200 · State and local taxes $6,781/$0 Why the Difference? · Educator expenses $300/$300 · Total $31,500 + Revisit. Payments and Credits (Child and dependent care credit $600/$600 · Child and Other Dependents Tax Credit $2,000/$2,000 · "Money you already gave them (tax payments)" Federal tax withholding $13,100 · Total $15,700 + Revisit). Only **Back** at the bottom.
- Best-in-class pattern: shows *why* entered amounts didn't count, with a per-row explanation link and a jump-back (Revisit) per section.
### 192 — Ready for Federal Review → "We're ready to check your federal return for errors." (large empty body).
### 193 — Let's Check These Entries → "We found **5 areas** on your federal return where we'll need to review your entries. We'll handle them one at a time." (sub-tab now **Smart Check**).

### 194 – 199 — Check This Entry (Smart Check error queue)
`screens/194-check-this-entry.png` … `199-…` · Type: Review/Validation (one error per screen)
- Template: title "Check This Entry"; one-line error prefixed with the form name; the **single offending field** rendered as an interview control (radio group or edit) bound directly to the form field; below it an **embedded, scrollable live snippet of the actual form** scrolled to that field, with the field highlighted; **Continue** only (no Back).
1. 194 — "1040/1040SR Wks: Virtual currency check boxes must be entered." Radios: No entry / **Virtual Currency Yes Chbx** / **Virtual Currency No Chbx** (raw form-field names leak into the UI). The digital-asset question had never been asked in the interview because the user chose "I'll choose what I work on". → No.
2. 195 / 196 — "Schedule B -- Form 1099-DIV (Big Fund): Qualified dividends in box 1b can't be greater than total ordinary dividends in box 1a ($2400.00). In some cases, a second step might be needed. Go to the 1099-DIV for Big Fund and change the amount there." Box 1b edit (`FSCHB_F1099D_1__QDIV` = 3,000.00) fixed in place to 1,900. Meter **$1,044 → $967**.
3. 197 — "Personal Worksheet (Jordan): Social security number is not in a valid range. The social security number(SSN) or individual taxpayer identification number(ITIN) must be in a valid range and all digits must be numeric." SSN edit fixed to 400-12-3456.
4. 198 — "Schedule B: Foreign_Trust question must be answered. During 2024, did you receive a distribution from, or were the grantor of, or transferor to, a foreign trust? (If Yes, you may have to file Form 3520)." Radios No entry / **Line 8, Yes** / **Line 8, No** (form-line labels, internal "Foreign_Trust" token with underscore shown to the user).
5. 199 — "Schedule B: Foreign_Account question must be answered. At any time during 2024, did you have a financial interest in or signature authority over a financial account… located in a foreign country?" Radios **Line 7a, Yes/No**.
- Findings: Smart Check catches what the interview skipped (questions never asked in "explore" mode) and what entry screens allowed (invalid SSN, 1b>1a) — so the interview is permissive and the safety net is at the end. Error copy is form-centric jargon, not user language.
### 200 — Run Smart Check Again → "If you fixed errors or made any changes [Run Smart Check] / Otherwise select Done."
### 201 — Smart Check Complete → "Congratulations! We reviewed your federal return and found no errors."

## Part 7 — State Taxes (stopped at entitlement prompt)

### 202 — Let's work on your state return → "TurboTax is ready to start your state tax return and look for ways to get you back all the money you deserve." (sub-tab "TurboTax State Download").
### 203 / 204 — Your State Returns
`screens/203-your-state-returns.png` · Type: Hub/list
- "From the information you have entered in TurboTax, here is what we think your state tax situation looks like." Row: Illinois map icon + **Start**. "**Other installed states** — TurboTax has the following states installed. Based on the information you have entered, we do not think you need to file taxes in these states…" Arizona / Delaware with **Add**. Buttons **Get Another State** / **Done with States**.
- Clicking **Start** for Illinois raised a modal alert (`alertWindow`, captured only in the UIA dump; the PNG `204b-state-free-state-alert.png` shows the page behind it): "**Your copy of TurboTax includes one free state. Would you like to use your free state now?**" Yes / No. Choosing Yes consumes the license's single free-state entitlement on this test return, so the path was **stopped here** (answered No, nothing changed). The state interview itself was therefore not captured.
### 205 — Your State Returns (after declining).
### 206 — Just Checking About Your State Taxes... (retention #1) → "We noticed you decided not to work on a state return. Since most people need to file a state return… If you don't need to do a state return, that's OK, too. Just select Done with States again."
### 207 — Why not finish your state return now? (retention #2)
`screens/207-why-not-finish-your-state-return-now.png` · Upsell/retention: "You're so close to done." bullets (transfer federal info; "We guarantee the calculations will be 100% accurate"; "We guarantee you'll get your biggest possible state refund") with red "100% ACCURATE" and blue "MAXIMUM REFUND GUARANTEE" seals; buttons Back / **No Thanks** / **Let's Finish My State Taxes** — the decline and accept buttons are styled identically.
- Two consecutive "are you sure?" screens to leave the State tab.

## Part 8 — Review tab

### 208 — Let's make sure your taxes are correct (Review › Analysis) → "Ready to do a final review… TurboTax will also check for additional deductions, so you get your biggest refund possible."
### 209 — Give Us a Minute to Look Things Over... → progress bar "Analyzing Your Return" → "Analysis complete. Select Continue to see your results." (second staged analysis screen).
### 210 — Tax Summary for 2024 → "Jordan and Casey, here's a look at your numbers for the year." Federal 2024 Your Federal Refund **$967**. "Next, we'll ask you to correct any entries that need your attention."
### 211 — We've Checked Your Return For Accuracy → "Good news! Breathe easy knowing the calculations in your return are **guaranteed 100% accurate**." Checklist: Checked accuracy of calculations / Checked for missing information / Checked for errors. "Next, we'll check your return for any audit risks."
### 212 — Your Audit Risk Results (Review › Audit Protection) → "Great news! There's nothing to worry about. Your audit risk is low… We've also got you covered with our free **Audit Support Guarantee**."
### 213 — Protect your return with Audit Defense   **[UPSELL]**
`screens/213-get-full-service-audit-representation.png` · "Get full service audit representation **$45**" orange **Buy now** (top) + photo of a couple with a shield; "Audit Defense by TaxAudit" three benefit icons; lavender callout "If you wait until after you're audited, you could pay more than $2,000 for professional audit representation."; fine print about the free Audit Support Guarantee; footer Back / outline **I will do it later** (`AD_PrePurchase_Continue`, used) / cyan **Buy now** in the primary (right-most) position.
- Finding: shown immediately after telling the user their audit risk is low; fear-based anchor ($2,000); "no" is phrased as procrastination ("I will do it later").
### 214 — We Guarantee Your Maximum Refund → "Checked for federal deductions and credits / Applied 2024 tax changes / Filled out all the right forms for you — Federal Refund $967".

## Part 9 — File tab (start only; stopped before any filing action)

### 215 — Let's get ready to file your taxes (File › File a Return; sub-tabs File a Return · Print/Save for Your Records · Final Steps · Check E-file Status) → "Great job you're almost done. It's time to wrap up your 2024 taxes and file your returns."
### 216 — E-filing is Closed for the Season, You Can File by Mail → "TurboTax e-filing closed for the tax season on October 15, 2025. Learn More" (environment date is after the season).
### 217 — We Recommend E-filing Your Federal Return
- "E-filing federal is FREE… No printer. No envelope. No hassle." bullets; "How do you want to file?" **E-file (recommended)** "There's no faster way to get your refund*" / **File by mail** "Typically takes 4-6 weeks"; link "Need to print for review?"; footnote on 21-day refunds.
- Finding: contradicts 216 one screen earlier (e-file closed, yet "we recommend e-filing"). **Stopped here** — clicked Back; no filing method chosen, nothing printed, saved, signed, or submitted.

## Part 10 — Display & keyboard probes

### 218 / 219 — Zoom (A A)
- The bottom-right **A** (larger) / **A** (smaller) buttons step the interview zoom in 10% increments: 80% (default) → 90% → … → **130%**. Only the interview content column scales (title, body, buttons); the header, tabs and refund meter stay fixed. The two buttons have no accessible names (not in the UIA tree). Reset to 80% afterwards.
### Keyboard (no screenshot; probed via UI Automation focus)
- After a screen loads, focus sits on the window itself, not on the first field or the primary button. **Enter does not trigger Continue** (screen 220 shows the same screen after pressing Enter).
- Tab order from the content area: interviewUC → 2 unnamed controls → menu bar (File, Edit, View, Tools, Online, Help) → Help Center / Print Center / Show Topic List → "See Amount" → Forms/Flags/Notifications (unnamed) → main tab "File" → sub-tab → **Continue → Back** → unnamed bottom-bar buttons → wraps. ~19 stops before reaching Continue; the inline "Learn More" link was not in the tab sequence; Continue precedes Back.
### 221 — Illinois "See Amount" link in the header → triggers the same "use your free state now?" alert (declined).
