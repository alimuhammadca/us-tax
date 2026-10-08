# TurboTax Deluxe 2024 (Windows desktop) — UX findings

Source: a scripted walk-through of a new TY2024 return for a fictional MFJ Illinois household (two W-2s, 1099-INT/DIV/B, 1098, charity, child care, educator expenses, traditional IRA). 222 numbered screens + 5 auxiliary captures in `screens/`; the chronological log is `walkthrough.md`. Screen numbers below are written as `#NNN`.

Scope reached: Personal Info (complete), Wages & Income (all scenario items), Deductions & Credits (all scenario items), Other Tax Situations hub (+ campaign fund, AMT check), Federal Review, Smart Check (with 5 fixes), State tab entry list, Review tab (Analysis, Audit Protection, Summary), start of the File tab. Not reached: the Illinois state interview (blocked behind a "use your one free state now?" entitlement prompt, #204), and anything after choosing a filing method.

---

## 1. Navigation model

**Three nested levels plus two side doors.**

| Level | Element | Behaviour |
|---|---|---|
| 1 | Main tabs: PERSONAL INFO · FEDERAL TAXES · STATE TAXES · REVIEW · FILE | Always visible, freely clickable, uppercase, flat grey bar; active tab is white. |
| 2 | Sub-tab "pills" under the active tab (e.g. Wages & Income · Deductions & Credits · Other Tax Situations · Federal Review · Smart Check) | Rounded grey pill marks the current section; visited sub-tabs keep an outline (#191). |
| 3 | The interview: one screen at a time, **Back** (grey, left) / **Continue** (cyan, right) under a hairline at the end of the content. | Linear within a topic; topic ends on a summary list or returns to the hub. |
| Side door A | **Hubs** ("Your 2024 Income Summary" #069, "Your 2024 Deductions & Credits" #137, "Other Tax Situations" #180, "Your State Returns" #203) | Long scrollable lists of topics with Start / Update / Visit All. |
| Side door B | **Show Topic List** (#103) — a modal tree of every topic with "visited" ticks; **Forms** mode (#107) — the real IRS forms/worksheets. |

- Each section offers a **mode fork** at its entry: "Guide me — Walk me through everything" vs "I'll explore on my own — I'll choose what I work on" (#068, #113). In practice "Walk me through everything" in Deductions asked a 9-question life-event screener (#115–#123), handled family credits, then **dropped the user onto the hub** anyway (#137) — the guided path is shorter than it promises.
- Every hub ends with a section "Done" button (**Done with Income / Deductions / Other / States**), which may run hidden mandatory checks (e.g. Done with Other → AMT check #183–#186).
- Leaving a section is never blocked, but a missing answer comes back later in Smart Check (#194: the digital-asset question was never asked in "explore" mode).
- Back always works and returns to the exact previous screen; Back from a summary goes to the prior question, not the hub.

**Recommendation for our app:** keep the tab › section › screen hierarchy and the hub-with-status pattern, but make the hub the *real* home of each section (with the guided path simply walking its rows in order and showing progress), and surface "questions we still need" inline on the hub instead of saving them for the final check.

## 2. Screen-type taxonomy (approximate counts over #000–#221)

| Type | Count | Typical examples |
|---|---|---|
| Question (Y/N or single choice; sentence-style answers or big Yes/No buttons) | ~59 | #008, #024, #115–#123, #088–#092 |
| Entry (form fields) | ~42 | #026, #036, #049/#052 (W-2), #075 (1099-INT), #096 (1099-B), #143 (1098) |
| Outcome / Recommendation ("Good news…", "We've chosen…") | ~20 | #032, #034, #065, #135, #149, #179 |
| Review / Validation | ~20 | #018, #061, #062, #079, #177, #189–#191, #194–#199 |
| Hub (topic list with Start/Update/Visit All) | ~18 | #069, #137, #180, #203 |
| Intro / Interstitial (incl. fake "analysis" progress) | ~17 | #002, #042, #124, #174, #209 |
| List-summary (entries with Edit/Delete/Add) | ~14 | #033, #054, #098, #129, #150, #156 |
| Help / tools / forms views | ~13 | #007, #041, #051, #103–#109 |
| Checklist ("Do any of these apply?") | ~11 | #011, #053, #077, #097, #184 |
| Upsell / import offer / retention | ~9 | #046, #073, #159, #206, #207, #213 |

Roughly **one screen in three is a question**, one in five an entry form, and **one in four is non-input** (celebration, interstitial, upsell). A two-W-2 family with five common forms took ~180 interview screens.

## 3. Question phrasing and personalisation

- **Titles are the question**, in Title Case on WPF screens ("Did You and Casey Own a Home in 2024?" #115) and sentence case on web screens ("Did you pay any home loans in 2024?" #139) — inconsistent.
- **Answers are full first-person sentences**, not bare Yes/No: "No, I lived in Illinois all year." (#008), "No, a relative didn't live in my home and help support him." (#031), "Yes, we owned a home in 2024." — the user re-reads their own answer as a statement.
- **Names and pronouns everywhere** after first-name-only capture (#003): "Jordan, What Do You Do for a Living?" (#004), "Riley's Parents" (#029), "…each month **he** lived with you" (#027, pronoun from "Son"), "We see Jordan was covered by a retirement plan at work based on the W-2 from Acme Testing LLC." (#165), "Because Casey's occupation is listed as "Teacher," you may be able to take advantage of this deduction." (#171). Personal Info answers actively drive later prompts.
- **Computed thresholds are baked into the question**: "Yes, we paid more than **$10,901** in medical expenses in 2024." (#119 — 7.5% of AGI), so the user never needs to know the rule.
- **State-aware copy**: Illinois reciprocity states listed by name (#023); interest-exemption states listed (#077).
- **Normalising / permission copy**: "These don't apply to most taxpayers, but we still have to ask…" (#053), "(This is not common.)" (#134, #161), "If you're not sure, select Yes and we'll help you figure it out." (#024), "It's okay to leave empty boxes blank." (#050).
- **"Why we ask" reassurance**: "This is a question the IRS wants us to ask. Don't worry, this information doesn't affect your tax outcome." (#004); "Selecting Yes won't affect your tax due or refund." (#181).
- **Deferred PII**: first name only on #003; last names on #035 ("Just a Few More Questions"); SSNs last, framed as optional-now: "We'll ask you again before you file, but entering it now will give you a better idea of how much you're saving." (#038).
- **The product decides, the user can override**: "We've Chosen a Filing Status for You — Married Filing Jointly… will give you the maximum refund… ☐ Change my filing status" (#034); "Standard Deduction is right for you… Change my deduction" (#179); "No, we'll keep the deduction (recommended)." (#168).

## 4. Entry screens for statements (W-2, 1099s, 1098)

- **Box-labelled fields mirror the paper form**: "Box c - Employer name", "Box 12 - Code", "Box 1d - Proceeds" (#049, #050, #096). Users can type straight from the document.
- **Split by form region**: W-2 = page 1 "boxes b through f" (employer/employee, #048) then page 2 "Let's review the rest… Focus on boxes 1-20" (#050) with section headings *Income & taxes withheld (Boxes 1-6)*, *Less common items (Boxes 7-14)*, *State taxes (Boxes 15-17) - Leave blank if empty on your form.*, *Local taxes (Boxes 18-20)*.
- **Progressive disclosure of rare boxes**: 1099-INT shows Box 1 and 3 only and a checkbox "My form has info in other boxes (this is uncommon)." (#075); 1099-DIV shows 1a/1b/2a (#083); 1099-B has "I have other boxes on my 1099-B to enter" (#096).
- **Repeatable rows** with trash icons and "+ Add another box 12 item / box 14 item / state / locality" (#050).
- **Prefill from Personal Info** (employee name/address/SSN, #048) — collapsed behind "Show employee info" on the second W-2 (#058).
- **Ownership selector on every statement** ("This W-2 belongs to…", "This 1099-INT belongs to…") even on a joint return.
- **Import first, type second**: every statement type starts with an import offer — EIN lookup → "Great News! We Can Enter Your W-2 for You" (#046), card choice "Type it in myself / Upload it from my computer (Recommendation)" (#045), bank/brokerage picker with hundreds of institutions (#073). Manual entry is always reachable but is the second choice visually.
- **Per-statement "uncommon situations" checklist** after each form (#053, #077, #084, #097) instead of cluttering the entry screen.
- **Live formatting**: currency fields reformat to "$85,000" / "$1,232.50" on blur; masks for EIN/SSN.
- **1099-B entry is preceded by a 4-question profiling page** (#088–#092) that picks the entry method ("One-by-one is the best way since you have only a few sales." #093) and an explainer animation on how to read the form (#094).

## 5. List / summary pattern

- After each repeatable item: a table with key columns + status + **Edit** / **Delete** and an **Add another…** button; the advance button is **Done** or **Continue** (#033, #054, #098, #129, #133, #150).
- Columns echo form boxes ("Box c, Employer · Name · Box 1, Wages, tips, other · Box 2, Federal income tax withheld", **Total** row, #054); a "Complete" badge per row.
- Two-level lists for nested data: donations per charity (#155) → all charities (#156).
- The web investment "wallet" (#078) groups cards by institution with a **NEEDS REVIEW** badge and a single **Confirm** button.
- Inconsistency: WPF lists say "Done", web lists say "Continue"/"Confirm"; trash icons vs "Delete" text; dates as 05/05/2016 in one list and 2024-06-15 in another (#098).

## 6. Validation and error UX

TurboTax validates in **four different places**, from soft to hard:

1. **Inline on the field (rare)** — bad date → field cleared and red bold text to the right: "Date of birth needs to have a value not later than 2024" (#018). The message didn't match the error (13/45/1987 is an invalid date, not a future year) and the user's input was erased.
2. **Silent acceptance / silent discard** — SSN 000-00-0000 accepted with no message (#040); EIN 00-0000000 silently dropped (#044→#045); empty checklists treated as "none" (#011); Box 1b > Box 1a accepted (#083).
3. **Dedicated soft-check interstitials** — "Let's review the amounts in boxes 1 and 2 — Double-check these amounts match what's on your W-2 from Springfield School District." showing only the two conflicting fields (#061); "Let's double-check your state and local taxes — We noticed boxes 15-20 are missing some info… it's okay to leave this blank." (#062); "Now, let's review your 1099-INT — ⚠ We still need some required info." with the field outlined red and "Needs info" (#079). No blame language; never red headlines.
4. **Smart Check at the end** (#193–#201): "We found 5 areas on your federal return where we'll need to review your entries. We'll handle them one at a time." Each "Check This Entry" screen shows the form-centric message ("Schedule B -- Form 1099-DIV (Big Fund): Qualified dividends in box 1b can't be greater than…"), **only the offending field** as an editable control, and an **embedded live snippet of the actual form** scrolled to that field. Then "Run Smart Check Again" → "Congratulations! We reviewed your federal return and found no errors."
   - Smart Check also asks questions the interview skipped (digital assets #194, Schedule B foreign trust/account #198–#199), using raw form labels ("Virtual Currency No Chbx", "Line 7a, No", "Foreign_Trust").
5. **Forms mode** shows hard errors continuously: red "!" next to forms "(Not Done)", red cells, and an Errors bar with ▲/▼ (#107–#109).

The meter reacts to invalid data immediately (Box 2 = $60,000 pushed the refund to **$57,178**, #061) — numbers the user should not trust are shown prominently.

**For our app:** validate format at the field (keep the value, say exactly what's wrong), run cross-field checks on Continue with TurboTax-style "double-check" screens that show only the conflicting fields, keep a visible "needs attention" count on hubs, and write final-check messages in user language with a direct fix control (the #194–#199 layout is worth copying minus the jargon).

## 7. Refund meter behaviour

Header gauge: black box "Federal Refund $ N" (green digits) that flips to **"Federal Tax Due" with red digits** (#097+); a second box "Illinois — See Amount" appears after ZIP entry (#007) and is a link that triggers the state purchase/entitlement prompt (#221) — the state number is never shown without starting the state.

| Event | Screen | Meter |
|---|---|---|
| Start | #001 | Refund $0 |
| Jordan W-2 boxes 1–2 typed (updates **while typing**, before Continue) | #052 | Refund $4,765 |
| Casey W-2 with bogus Box 2 = 60,000 | #061 | Refund $57,178 |
| Box 2 corrected | #062 | Refund $1,278 |
| 1099-INT typed / after Continue | #076 / #077 | $901 / $871 |
| 1099-DIV (with 1b error) | #084 | $463 |
| 1099-B sale ($3,500 LT gain) | #097 | **Tax Due $62** |
| Child-care expenses $4,000 | #129 | Refund $538 |
| Mortgage, property tax, charity | #149–#156 | $538 (unchanged — "Right now, the Standard Deduction saves you the most on taxes." #149) |
| Casey IRA $2,000 | #163 | $978 |
| Educator expenses $300 | #173 | $1,044 |
| Smart Check fix of Box 1b | #197 | $967 (final) |

- The meter is the emotional backbone: celebrations quote it ("So far, your refund is $1,278!" #065), the std-vs-itemized chart quotes it (#179), review screens quote it (#210, #214).
- Good: when an entry doesn't move the meter, TurboTax says why (#149). Bad: the meter shows transient garbage during typing and never explains drops (e.g. −$377 for interest).

## 8. Form linking (interview ↔ IRS forms)

- Bottom bar **Show Relevant Form** slides up a resizable pane with the exact worksheet behind the current screen (#041 — Federal Information Worksheet), with **QuickZoom** buttons that jump between forms. On web (Fuego) screens the button is disabled ("No Form").
- **Forms mode** (header "Forms" → "Step-by-Step") is a full alternate UI: left list "Forms in My Return" with "(Not Done)" + red "!", right paper-replica worksheets with yellow input cells, typed values in monospace blue, tabs for open forms, Print / Delete Form / Close Form, and an Errors bar (#107–#109). Switching back returns to the same interview screen (#110).
- Smart Check embeds form snippets in the error screen (#194–#199).
- Takeaway: the interview is an overlay on a forms engine; exposing the form on demand builds trust for expert users. For us: a read-only "see this on Form 1040 line X" drawer is high-value and cheap since we already have form previews.

## 9. Help system

| Affordance | Where | Behaviour |
|---|---|---|
| In-sentence glossary links (dotted/underlined terms: "state of residence", "dependent", "support", "legal parents") | WPF screens | Open a separate movable **On Demand Tax Guidance** window with Back/Print/zoom and a styled article + "See More Help" (#007b). |
| "Learn More" after a label/option | everywhere | Same window. |
| ⓘ/? icons next to fields | Web screens | Same window, but article rendered as **unstyled Times-serif HTML** (#051b) — visibly broken styling. |
| "What if…" / "How do I…" links under the form ("What if I don't have my W-2?", "What if my form has other boxes filled in?") | most screens | Same window. |
| Inline education cards ("Tips for next time", crypto video, FSA tip) | #100, #072, #132 | In-page. |
| "Did this help? / Was this helpful?" micro-surveys | #094, #100 | In-page. |
| SEARCH (top right) | global | Opens an Intuit **sign-in** overlay first; after dismissing, a "TurboTax Help" side panel searching online FAQ articles with "People like you viewed these answers" and **Contact Us** (#104–#106). Result snippets were all the site's nav text (bug). Not a topic search. |
| Help Center / Help Others (community) | top bar / bottom bar | Not explored (online). |

Help windows are non-modal and don't cover the field — good. Help content is not exposed to assistive technology (UIA shows an empty pane).

## 10. Outcome / motivation patterns

- Frequent celebrations: "Good News! Riley Qualified You for a Tax Break" (#032), "Congrats, you get a tax break — Your $300 deduction just saved you money" (#173), "Great news! You qualify for this credit. Money back in your pocket is always a good thing." (#135), confetti on the std-deduction chart (#179).
- Transparent math in outcomes: "Eligible dependent care expenses $3,000 · Credit percentage 20% · Your credit $600" (#135); "2024 Tax Breakdown" with **You Entered / You're Allowed** columns and **Why the Difference?** per row plus **Revisit** per section (#191) — the single most useful review pattern seen.
- Staged "analysis" progress bars ("Checking For Missed Deductions and Credits", "Give Us a Minute to Look Things Over…", #174, #209) — labour illusion with no real wait.
- Overclaiming / mixing units: "You're getting $31,200 in tax breaks so far!" adds a deduction to a credit (#065); "Federal Credits … Tax Withholding $13,100" counts withholding as a credit (#177); "Deductions We Found For You" (#190); EIC listed as a likely break at ~$145k income (#114) then "It turns out you don't qualify for this credit" **without naming the credit** (#136).

## 11. Visual design notes

- **Window chrome**: dark menu bar (File/Edit/View/Tools/Online/Help + Show Topic List / Print Center / Help Center), saturated Intuit-blue header (~#0077C5) with logo left, black refund boxes centred, white-outline icons right (Forms, Flags, Notifications); light-grey main-tab bar; white canvas; grey status bar (Show Relevant Form, Upgrade TurboTax, Help Others "New", zoom 80% A A).
- **Content column** is fixed at ~770 px (WPF at 80%) or ~950 px (web) and **left-aligned**; on a 1920-px window ~60% of the screen is empty white.
- **Typography**: screen titles in blue Avenir-style ~20 px, body ~12 px Arial at the default 80% zoom (small), bold labels for groups. Web screens use a different humanist font at larger sizes, bigger radios and rounded buttons — two visual systems interleave on consecutive screens (#042 → #043 → #044).
- **Buttons**: primary = flat cyan (#33BBEE-ish) with white text; secondary = grey (Back); Start = cyan vs Update = grey on hubs; "Get Extra Help" small outline pills; purchase CTAs orange ("Buy now", #213).
- **Status colours**: "Needs review" in **green** text (#137) — wrong semantic colour; errors red; meter green/red.
- **Density**: one question per screen with lots of whitespace, but entry screens (W-2 page 2) are long scrolling pages; illustrations on web screens (coin, confetti, icons per question card).
- **Zoom**: A/A buttons step 80% → 130% in 10% steps, scaling only the interview column (#218–#219).

## 12. Accessibility issues observed (via UI Automation / MSAA)

- Many controls expose **.NET type names or internal ids** as their accessible name: "Intuit.Ctg.Wte.Service.EasyStep.EasyStep.Import.ImportInputMode" (import cards #045), "Intuit.Ctg.Wte.Service.Import.ImportableFiSource" (bank list #073), "…TopicTreeItem" (Topic List #103), "stk-transaction-summary-entry-views-0-fields-5-choice-…-DateAcquiredDtPP" (1099-B date #096), "icn-accurate-reporting-investment-sales.svg" (heading #078).
- **Unnamed controls**: header Forms/Flags/Notifications buttons, zoom buttons, IRA matrix checkboxes (#158), four identical "Add" buttons (#153).
- Web (CEF) content is not exposed to UI Automation at all until an MSAA client probes it; help windows expose an empty pane.
- **Keyboard**: on screen load focus is on the window, not the first field; **Enter does not activate Continue** (#220); ~19 tab stops of chrome before reaching Continue; Continue precedes Back in tab order; inline "Learn More" links are skipped.
- Mismatched icon alt text on stacked questions ("Refund transfer" on a 1099-B question, #091).
- Low-contrast grey helper text and 12-px body at default zoom; green-on-white "Needs review".

## 13. Things NOT to copy

1. **Upsells inside the task flow**: Premier upgrade in the middle of IRA entry (#159, "Upgrade to TurboTax Premier for just $35.00"); Audit Defense right after "Your audit risk is low" with a "$2,000" fear anchor and the decline phrased as "I will do it later" (#212–#213); "Get Extra Help" pills on hubs; Upgrade TurboTax in the status bar.
2. **Retention loops**: two consecutive "are you sure you don't want a state return?" screens (#206–#207) with identically-styled accept/decline buttons.
3. **Search behind sign-in** (#104) and an online FAQ masquerading as search.
4. **Misleading aggregates**: deductions + credits summed as "tax breaks" (#065); withholding as a credit (#177); a SALT line that doesn't foot (#177).
5. **Permissive entry + late hard errors**: invalid SSN and 1b>1a accepted silently until Smart Check; questions skipped in explore mode resurfacing as form-jargon errors.
6. **Raw form/field labels in the UI** ("Virtual Currency No Chbx", "Foreign_Trust", "Line 7a, No").
7. **Validation that clears input** and gives the wrong reason (#018).
8. **Two visual systems** (WPF vs web) alternating screen to screen; unstyled help pages (#051b).
9. **Contradictory screens**: "E-filing is closed" immediately followed by "We recommend e-filing" (#216 → #217); "Walk me through everything" that dumps you on the hub.
10. **Labour-illusion progress bars** that add clicks without doing visible work (#174, #209).

## 14. Things worth copying

1. Name-first, PII-last ordering (#003 → #035 → #038) with "why we ask" microcopy.
2. Sentence-style answer options that restate the fact ("No, I lived in Illinois all year.").
3. Personalisation that reuses earlier answers to target prompts (occupation → educator expenses #171; W-2 box 13 → IRA coverage #165; computed medical floor #119).
4. System-recommended defaults with an explicit override (filing status #034, deduction method #179).
5. Box-labelled statement entry with progressive disclosure of rare boxes and per-statement "uncommon situations" checklists.
6. Cross-field "double-check" interstitials showing only the conflicting fields (#061, #062).
7. Hubs with Start/Update status and amounts, plus a Topic List tree with visited ticks.
8. "You Entered / You're Allowed / Why the Difference? / Revisit" breakdown (#191).
9. Error-fix screens with the single offending field plus a live form snippet (#194–#199).
10. On-demand "Show Relevant Form" drawer linking each interview screen to the form it fills (#041).
11. Honest no-change explanations ("Right now, the Standard Deduction saves you the most on taxes." #149).
12. Live refund/tax-due meter — but only with validated inputs and with a "why did this change?" affordance.

## 15. Microcopy samples (verbatim)

- "Your children and those you support are worth every penny you spend on them. Let's see who qualifies you for the tax breaks that go with having a dependent." (#024)
- "Important: If you're not sure, select Yes and we'll help you figure it out." (#024)
- "Based on what you've told us, filing Married Filing Jointly will give you the maximum refund on your taxes this year." (#034)
- "Instead of filling up to 20 boxes yourself, let us import your W-2 into your return." (#046)
- "Focus on boxes 1-20. It's okay to leave empty boxes blank." (#050)
- "These don't apply to most taxpayers, but we still have to ask if any are related to your work with Acme Testing LLC." (#053)
- "Double-check these amounts match what's on your W-2 from Springfield School District." (#061)
- "Any inherited or gifted investments are **not** considered bought" (#092)
- "Right now, the Standard Deduction saves you the most on taxes." (#149)
- "Because Casey's occupation is listed as "Teacher," you may be able to take advantage of this deduction." (#171)
- "That's OK. We'll keep looking for other tax breaks for you." (#136)
- "Breathe easy knowing the calculations in your return are guaranteed 100% accurate." (#211)
- "If you wait until after you're audited, you could pay more than $2,000 for professional audit representation." (#213)

## 16. Technical observations relevant to our build

- The desktop app is mid-migration: legacy **WPF** interview screens (field ids like `FPERSWKS_1__SSN`, `FHOMEINT_1__L3`, `F2441_L1A_1_` that map 1:1 to worksheet fields) interleave with a **web "Fuego" player** in CEF (`Replatforming/fuegoV2`) used for W-2, 1099s, investments, educator expenses, AMT and results screens. The web screens lose form linking ("No Form").
- Field ids encode form + instance + line (`FWDEPINF_1__CCEXP` = dependent worksheet #1, child-care expense) — a useful naming scheme for our own field registry.
- The refund is recomputed on every keystroke in web entry screens.
