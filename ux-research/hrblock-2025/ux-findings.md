# H&R Block Software 2025 Premium (Windows desktop) — UX findings

Live walk-through on 2026-10-08 of a fresh return for the fictional MFJ household (Jordan & Casey Sample,
Illinois, son Riley). **249 numbered screens** (`screens/NNN-*.png` + `.json`), 243 whole-window shell
captures (`shell/NNN.png` + OCR of the refund meter/FAQ rail), chronological log in `walkthrough.md`.
Screen numbers below are `#NNN`. Static structure of the product (242 topics, CXml format) is in
`C:\us-tax\H&RBlock2025.md` and is not repeated here. Nothing was activated, purchased, signed in or filed
(the File flow was taken down the *Print and mail* path and stopped at "Taxes Are Done" without printing).

Outcome reached: Federal refund **$1,951**, Illinois refund **$363**; AGI 143,050, taxable 111,550 (#187).

---

## 1. Navigation model

**Four ways to move, layered on one linear interview.**

| Layer | Element | Behaviour |
|---|---|---|
| 1 | **Top tabs** WELCOME · FEDERAL · STATE · FILE · PLAN (#S02 `shell/S02-import.png`) | Always visible. Clicking a tab resumes the *last* screen of that section (FEDERAL after finishing → Tax Summary, #246). |
| 2 | **Sub-tabs** under the active tab — FEDERAL: PERSONAL INFORMATION · INCOME · ADJUSTMENTS · DEDUCTIONS · CREDITS · TAXES · MISC · FINISH; IL: WELCOME · INCOME · CREDITS · TAXES · MISC · FINISH; FILE: FILE YOUR RETURN · ELECTRONIC FILING · FILING ON PAPER · FINISHED · WRAPPING UP | Highlight follows progress. **Clicking a sub-tab opens a section index**, "Where Do You Want To Go?" (#247): every topic of that section in a 3-level hierarchy, each with **Go To**. |
| 3 | **The interview**: one screen at a time with image buttons **Back** (left) / **Next** (right). The right button is *relabelled* by context: **FINISHED** on list screens (#024, #046), **Quick Entry** on a fork (#117), **Yes / No** on one-click questions (#127, #205). | Strictly linear inside a topic; topics chain automatically in a fixed order. |
| 4 | **Toolbar**: Take Me To · Forms · New/Open · Save · Print · E-File Status · AI Help | **Take Me To** (#243/#244) = full outline tree of all 5 sections with ✓ for completed topics, an arrow at the current topic, and one node per entered record ("1st (Riley Sample)", "Add…"). **Forms** = Forms Central (#241). Search (#176) = keyword + alphabetical topic index, results typed *(Interview)* vs *(Form)*. |

- **Back is topic-scoped, not history-scoped**: Back from the first screen of the next topic re-enters the
  previous topic at its *intro*, not at the screen you just left (#108 → #109).
- **No dead-end protection**: the very last screen of the product (#240 "Completed Planning Topics") has
  only Back and a link to hrblock.com.
- **Gateways chain instead of a hub**: there is no persistent "income hub" with status per topic (TurboTax's
  model). Instead, checklist gateways decide which topics are queued, then the interview walks them in a fixed
  order and ends each section on a **summary table** with Go To links (#094, #112, #142, #161, #172).
- **Two-speed paths are offered explicitly**: *Guide Me* buttons (filing status #008, dependents #035,
  care provider #150), *Home Mortgage Assistant vs Quick Entry* (#117), *Enter your sales as a group* (#078),
  *Capital Gains Assistant* link (#079).

**Recommendation:** keep the sub-tab-as-section-index idea (#247 is an excellent, scannable "where can I
go" page) but add per-topic status (not started / in progress / done / needs attention) as Take Me To does
with ticks. Make Back history-based.

## 2. Screen-type taxonomy (counts over #001–#249)

| Type | Count | Examples |
|---|---|---|
| Entry (form fields) | 58 | #013 personal info, #050 W-2 boxes 1–20, #065 1099-INT, #079 1099-B sale, #119 1098, #129 charity grid |
| Summary / List | 40 | #024 dependents, #046 W-2 hub, #082 sales, #094 IncSumm, #142 DedSumm, #187 Tax Summary |
| Checklist ("check any that apply") | 31 | #045/#073/#074/#085/#086/#089/#090 income gateways, #098 adjustments, #114 deductions, #144/#145 credits |
| Question (Y/N) | 28 | #052 overtime, #091 digital assets, #127 charity (Yes/No buttons), #159 8862 |
| Intro / Interstitial | 28 | #042 income intro, #044 gig-income essay, #071 "lower tax than the table", #131/#139/#202 planning tips |
| Review / Error-check | 17 | #019 SSN/DOB re-check, #030 consistency, #070 1b>1a, #178–#186 Accuracy Review |
| Question (choice) | 13 | #008 filing status, #064 kind of interest, #100 who contributed, #149 provider type |
| Outcome / Eligibility result | 13 | #012 "We recommend you file jointly", #105 IRA results, #123, #125, #137, #157, #160, #229 |
| Help pop-up (h*) | 10 | #007, #009, #021, #043, #048, #095, #096, #115, #138, #170 |
| Gateway / Hub | 8 | #001 home, #117 assistant fork, #176 search, #241 Forms Central, #243/#244 Take Me To, #247 section index |
| Upsell | 2 | #022 personalization pitch, #234 survey (plus upsell copy inside #229 audit-risk) |
| Variant / What-if (v*) | 1 | #134 left-rail FAQ |

Roughly **a third of screens are pure data entry**, a sixth are lists/summaries, an eighth are checklists.
About one screen in nine is non-input (intro/education/planning tip). The MFJ household with 2 W-2s, 1099-INT,
1099-DIV, one 1099-B, 1098, charity, child care, IRA and educator expenses took **~190 interview screens to the
federal Tax Summary** (#187) and ~50 more for Illinois + File + Plan.

## 3. Question phrasing, microcopy and personalisation

- **Titles are statements or questions in sentence case, ending with a period**: "Tell us about you and your
  spouse." (#013), "Choose any common income items that apply to you." (#045). Some hybrids end with "?"
  oddly: "Tell us if you have tips reported in Box 14 of your 2025 W-2?" (#054), "A couple more questions about
  your expenses?" (#156).
- **Gateways use two voices**: income uses noun labels ("Wages from a job / Income reported on Form W-2", #045);
  adjustments/deductions use **first-person statements** ("I made traditional or Roth IRA contributions by April
  15, 2026.", #098; "I paid real estate tax on property I own.", #114).
- **Every gateway item = plain-language label + grey sub-line naming the form + help link** (LEARN MORE or
  WHAT QUALIFIES?) — e.g. "Interest income / From a bank or other sources; often reported on Forms 1099-INT or
  1099-OID" (#045). This lets users map documents to topics without knowing form numbers.
- **Reassurance refrain**: "Even if you don't have a form or statement, check any of these that might apply, and
  we'll work on it together." (#045, #055, #144, #200). **Frequency hints** inside answers: "Yes (This is
  uncommon.)" (#104), "Interest reported on a Form 1099-INT (most common)" (#064), "Payment made… (common)" (#132).
- **Names everywhere once known**: "Jordan's Residency / Casey's Residency" (#017), "When was Riley born?" (#028),
  "Enter Casey's traditional IRA contributions." (#102), and even in FAQ titles ("What if Casey made a traditional
  IRA contribution that Casey later decided…", #102). Falls back to "he or she" (#103) and "his/her" (#152).
- **Template failures when the name is blank**: "You's Residency" (#014), "keep 's information on file" (#025),
  "1st (No first name given)" (#212). Personalisation without a guaranteed value produces broken grammar.
- **Live numbers embedded in copy**: "I want to apply all or part of refund of $1,951 to 2026 estimated tax."
  (#173), "State and local income taxes we already know about: $6,781" (#132), "So far, your AMT is $0" (#168),
  "Your Illinois refund $363" (#222).
- **Results stated in the title**: "Your mortgage interest deduction is $11,200." (#123), "Your child and
  dependent care credit is $600." (#157), "You're getting a credit!" (#160), "You get a deduction!" (#137).
- **Recommendation + override on one screen**: "We recommend you file jointly with your spouse." then the MFJ/MFS
  radios (#012); "Standard deduction (recommended)" pre-selected next to the computed itemized total (#137).
- **"Why we ask"** appears on a few screens ("We'll use this date to see if Riley qualifies as your dependent,
  and search for additional benefits.", #028; "To combat stolen-identity tax refund fraud…", #174) but not
  systematically.
- **Positive framing** is heavy: "Good News!" (#125, #137, #229), "Great news — your federal return is almost
  complete!" (#175), "Congratulations, Jordan" (#187).

## 4. Statement entry layout (W-2, 1099s, 1098)

- **One long page per statement mirroring the paper form**. W-2 = 2 pages: (1) *Whose W-2* + employer block
  (#047), (2) **all boxes 1–20 on one scrolling page** (#050): Boxes 1–11 in a two-column grid with box numbers,
  Boxes 12a–12h as eight code selects whose options carry the full meaning ("D - Elective Deferrals 401(k)"),
  Box 13 checkboxes, Box 14 state-specific code select (CA SDI, NJ FLI…), Boxes 15–20 as a 4-row state grid and
  4-row local grid, with special-instruction links (CASDI, NYC/Yonkers, NJ FLI, St Louis/KC).
- **1099-INT, 1099-DIV, 1098 are single pages with every box** (#065, #069, #119) — no progressive disclosure of
  rare boxes (TurboTax hides them behind "My form has info in other boxes").
- **Ownership radio on every statement**, including **"Both"** for joint 1099s and 1098s (#065, #069, #119;
  1098 defaults to Both on MFJ).
- **Post-entry follow-ups per statement**: W-2 → overtime Y/N, tips Y/N, special-situations checklist
  (#052–#055), repeated for *each* W-2 (#059–#061). 1098 → average balance, extra points/PMI checklist,
  result screen, limit check (#121–#125).
- **Import is offered but visually equal to manual**: four inline "+" text links on the W-2 hub — Import from
  Employer / Upload a PDF / Take a Pic with Phone / Enter Manually (#046).
- **Nested lists** for brokerage data: 1099-B account list (#083) → sales per 1099-B (#082) → sale entry (#079).
- **Inline grids** for many small items: cash donations are a 10-row Organization | Amount | DAF grid (#129).
- **Masks/formatting**: SSN digits auto-dash (#016), EIN/TIN hints "(NN-NNNNNNN)", thousands separators on blur.
  Amounts are **whole dollars — cents are silently rounded** (1,232.50 → 1,233, #051).
- **Prefill and dedup between topics**: the property-tax topic shows "Real estate tax (reported on Form 1098)
  4,800" read-only and asks only for *other* taxes (#126); SALT shows the W-2 total first (#132).
  But **no prefill across jurisdictions**: Illinois re-asks residency (#192), asks property-tax Yes/No defaulted to
  **No** (#206) and then shows an empty amount (#210) although $4,800 was entered federally.

## 5. The checklist-gateway pattern (how HRB asks "which of these apply" up front)

Income is gated by **seven sequential checklist pages**, each appearing only after the previous group's
topics are done:

| Page | Screen | Scope |
|---|---|---|
| 1 | #045 "Choose any common income items that apply to you." | W-2, state refunds, unemployment, interest, dividends |
| 2 | #073 "Choose any business activities that apply." | Sch C/1099-NEC, rental, K-1, farm, royalties |
| 3 | #074 "Now, let's work on your investment income." | stock sales, 1099-DA, crypto, ESPP/RSU, estate K-1, 2439, 1256 |
| 4 | #085 "Choose any that apply." (RetGateway) | 1099-R, annuities, SSA-1099, disaster distributions |
| 5 | #086 property sales | home sale, 1031, installment, business property, other assets |
| 6–7 | #089 / #090 other income | 1099-K/NEC/MISC not yet entered, jury duty, W-2G, alimony, 1099-C, 529, tips, scholarships, FEIE, 8814 |
| + | #091 / #092 / #093 | mandatory digital-asset Y/N, foreign accounts Y/N, "Final Income Items" catch-all |

Adjustments (#098), deductions (#114 + #128 charity sub-checklist), credits (#144 + #145), other taxes
(#166), payments (#171), wrap-up (#173) and each Illinois section (#200, #201, #215, #222) reuse the same pattern.

Observations:
- **Checking an item jumps straight into its topic** (no confirmation list): #045 → #046 W-2 hub.
- **State is shared across pages**: "Sale of other real estate…" arrived pre-checked on page 5 because a stock
  sale was checked on page 3 (#086), routing into an extra topic that contained a phantom record (#087).
- Because gateways are interleaved with the topics they unlock, the user never sees the whole income
  inventory at once; there is no "you said you have 5 kinds of income, 3 done" progress.
- Each section ends in a **summary table** (IncSumm #094, AdjSumm #112, DedSumm #142, CredSumm #161,
  TaxSumm #172) with *amount · EXPLAIN AMOUNT · Go To* per row.

## 6. Summaries

- Zebra table, category label, right-aligned amount, orange **EXPLAIN AMOUNT**, green **Go To** mini-button
  (#094). Rows for every category even when 0 (14 income rows, 12 adjustment rows…).
- Disclaimer on all of them: "Due to our calculations, this amount might be different from the total income
  you entered earlier." (bold in #094).
- **EXPLAIN AMOUNT is static help**, not a derivation of the user's number (#095: a generic list of what *could*
  be in wages).
- **Misleading labels**: IncSumm is titled "Here's your taxable income." but shows total income by category
  (#094); DedSumm lists itemized amounts although the standard deduction was chosen and never states which
  deduction is used (#142); the final Tax Summary labels withholding as "Tax payments and credits $13,100" while
  the $2,800 of credits is netted invisibly inside "Actual tax due $11,149" (#187).
- The federal **Tax Summary** (#187) is a compact 1040 waterfall: Income → Adjustments → **AGI** → Deductions →
  **Taxable income** → payments → tax due → orange **Refund** band. Good model for our summary page.

## 7. Review / error UX (Accuracy Review™)

Validation happens at **five levels**:

1. **Field format → blocking JS `alert()`** on blur: "Please use 123-45-6789 format." (#015), "Please Use
   MM/DD/YYYY format." (#080; inconsistent capitalisation). Modal, generic, no field highlight.
2. **Required radio with no default → native Windows message box** "Please select either YES or NO." (#053).
   Required *text* fields are **not** enforced: an entirely empty personal-info page (#014), an empty dependent
   (#025), an empty county (#194) and a blank 1099-B account number (#076) were all accepted.
3. **Missing-info recovery micro-interview**: after the empty dependent was accepted, HRB asked for each missing
   fact on its own screen — first name, last name, "When was Riley born?", SSN, relationship, living situation
   (#026–#032) — then a **consistency screen** "Time and months lived with should match." (#030) and a review
   recap (#033). This is a strong pattern: recovery without an error message.
4. **Dedicated correction screens** for cross-field rules: "Confirm or update your dividend amounts. Your entries
   show your qualified dividends are more than your total ordinary dividend distribution. The IRS taxes your
   qualified dividends at a lower rate. They should always be less than your total distribution." showing only
   1a and 1b (#070). Over-limit values are **silently capped** instead (educator $500 → $300 effect, #108; child
   care $4,000 → $3,000 limit, #155).
5. **Accuracy Review™** — a separate window launched at the end of each return (#178, #225):
   - Summary page with **severity tiers**: red ⓘ "2 Issues — Address these items before filing your return." and
     orange ⚠ "1 Data Verification — Review these items before filing. Some are just reminders, but others require
     action." (#178).
   - Each item: "Issue 1 of 2", **Required Information** text in user language, **Location** (worksheet name),
     "You must fix this problem before filing. Make any changes in the form below." with Back / **Delete Form** /
     Next; the bottom pane embeds the **actual worksheet with the offending cell painted red** (#179) or **yellow**
     for verifications (#184). Fixes are made in-place on the form.
   - Both issues it raised (mortgage origination date, outstanding principal — #179, #181) were fields the
     interview had shown as optional and skipped; the interview even said "Good News! … your deduction has not been
     limited!" (#125) without the principal.
   - Re-runs automatically and explains optionality: "You don't have to clear these verifications. However, we
     want to make sure you know the notifications are there." (#185). **SHOW LIST** gives a printable list with
     Go To per item (#186). Federal and state get tabs in the same window (#225/#226).
   - Form-cell date fields accepted digits only; typed slashes were silently dropped, the red highlight cleared on
     blur and the value was empty (#180 vs #183) — a false "fixed" signal.

**For our app:** validate format inline (keep the value, highlight the field, specific message — never a modal
alert); require answers that drive eligibility before leaving a topic; adopt HRB's *missing-info micro-interview*
and *show only the conflicting fields* correction screens; keep a two-tier final review (blocking vs advisory)
with plain-language messages and a direct fix control; never show a "good news" outcome computed from missing data.

## 8. Help system

| Affordance | Where | Mechanism | Example |
|---|---|---|---|
| **LEARN MORE** (10px bold orange caps) | under almost every option/field | `tc:TOPICHELP=<Topic>,h<Name>` → separate **Help Central** window (#007) with PRINT and a "Still Have Questions? … Help Center … AI Tax Assist" rail | Military (#007) — one sentence |
| **Inline glossary links** (green text) | option labels and terms | same `h*` pop-up | each filing-status option label is a link (#008 → #009 "Married Filing Jointly…"); "qualified expenses", "eligible educator" (#107); W-2 "Allocated tips", "Nonqual plan" (#050) |
| **WHAT QUALIFIES?** | every deduction/adjustment/credit checklist item | `h*` pop-up with *What qualifies? / What doesn't qualify?* bullet lists | charity (#115) |
| **WHY DOES THIS MATTER?** / **What's this?** | sensitive questions | `h*` | disaster (#021), IP PIN (#173) |
| **EXPLAIN AMOUNT** | summaries | `h*` static | wages (#095) |
| **Left-rail FAQs** (native panel, from the page's hidden `#faqs` div) | every screen, contextual, 0–8 questions | `v*` variant screens | "How can I create a list of items to add up and go into a field?" (#134) |
| **Refund Reveal℠** | meter "View Details" | report window | #135 (see §9) |
| **Guide Me / Assistants** | complex topics | alternate interview path | dependents, filing status, mortgage, capital gains |
| AI Help / AI Tax Assist | toolbar | online only | no in-app panel offline (#245) |

- The **FAQ rail is personalised by context and by name** ("What if Casey made…") and is the most consistently
  useful help surface — but it is drawn natively and is invisible to screen readers that read the page.
- Help pop-ups are often a single sentence (#007, #096) — the cost of opening a window for one sentence is high.
- **Tooling help**: Edit › Add Itemized List (#134) lets any field be backed by a line-item list whose sum
  carries into the field.

## 9. Refund meter

Left column, always visible: **FEDERAL REFUND** card (US-map icon) and **STATE REFUND** card (state silhouette once
a state exists), plus a **LATEST CHANGE** card that appears after the first change: ▲/▼ arrow, "Increase of $X" /
"Decrease of $X" and **View Details**.

| Event | Screen | Federal | State | Latest change |
|---|---|---|---|---|
| Start | #003 | $0 | $0 | — |
| Jordan W-2 (after leaving the W-2) | #056 | $5,254 | $0 | ▲ $5,254 |
| Casey W-2 | #062 | $2,262 | $0 | ▼ $2,992 |
| 1099-INT | #067 | $1,855 | $0 | ▼ $407 |
| 1099-DIV | #072 | $1,370 | $0 | ▼ $485 |
| 1099-B sale | #082 | $845 | $0 | ▼ $525 |
| Casey IRA $2,000 | #106 | $1,285 | $0 | ▲ $440 |
| Educator $300 (entered 500) | #108 | $1,351 | $0 | ▲ $66 |
| Mortgage/property tax/charity | #116–#142 | $1,351 | — | unchanged (std deduction wins; said explicitly on #137/#139) |
| Child care $4,000 | #155 | $1,951 | $0 | ▲ $600 |
| Illinois started | #190 | $1,951 | $123 | — |
| IL property-tax credit | #212 | $1,951 | $363 | — |

- **Updates on topic exit, not per keystroke** (W-2 values typed on #051 did not move it until the list #056) —
  calmer than TurboTax's live flicker and never shows garbage mid-entry.
- The **LATEST CHANGE delta** isolates the marginal effect of the last topic — a cheap, very effective explanation.
- **View Details → Refund Reveal℠** (#135): a vertical timeline narrative — "Wondering how we calculated your
  refund of $1,351? It's easy!" → (1) "First, we calculated your federal taxes… you owe $13,949" with the sources
  named from the user's data ("Jordan & Casey's income from Acme Testing LLC & Springfield School District",
  red bullets = increases, green = decreases) → (2) credits lowered it by $2,200 ("Child tax credits for Riley")
  → (3) withholding $13,100 → "Finally, we totaled everything up" → big green **Your federal refund: $1,351**.
  This is the best explanatory artifact in either product and should be copied.

## 10. Outcomes, eligibility and advice

- Outcome screens state the conclusion in the title and keep the override on the same screen (#012, #137).
- Topic results: IRA two-column result table (#105), mortgage result (#123), dependent-care result (#157), CTC
  (#160, with the ACTC opt-out checkbox on the result screen).
- **Eligibility can be inferred silently**: the IRA deduction was fully allowed because W-2 box 13 "Retirement
  plan" was left unchecked — no active-participant question was asked (#105).
- **Proactive planning advice** triggered by data: donate appreciated stock (#131), bunch deductions (#139,
  because itemized < standard), Illinois tax-exempt bonds (#202, because investment income exists).
- **Expectation management**: "you might find the federal tax we calculate is less than the amount from the IRS
  tax table. The amount we calculate is correct." (#071).
- File tab opens with guarantees, not tasks: "Your Maximum Refund — Guaranteed!" (#228), "Your Audit Risk Results
  — Good news — your return looks risk-free!" with a gauge graphic followed by the audit-support pitch (#229).

## 11. Visual design

- **Fixed-width desktop layout**: content pane 745 px wide inside a ~1550×830 window; left rail 236 px
  (brand, edition band "Premium" in blue, meter cards, green **Help Center** bar, FAQ list, "Send Us Feedback").
- **Colour**: H&R Block green family — light/lime titles and headings (#62a61f / #64a31a), dark green buttons
  (#468522 range) with white bold text, green links; **orange** (#c35409) for LEARN MORE / EXPLAIN AMOUNT /
  WHAT QUALIFIES?; blue edition band; summary tables zebra white/#E4E4E4; Tax Summary refund band orange;
  Accuracy Review uses red (issues) / orange (verifications) icons with red/yellow cell fills.
- **Typography**: Noto Sans throughout; screen title 24 px light green; body ~13 px; help links **10 px bold
  uppercase** — too small and low-emphasis for primary help.
- **Buttons are GIF images** (`Navigation/*_up.gif`, `_ht`, `_dn`, `_kf` states) with alt text; Next/Back are
  large rectangles bottom-left/right; content buttons ("Add Dependent", "Guide Me", "Add Sale") are smaller
  green rectangles.
- **Density**: one question per screen for Y/N, but entry screens are long single pages (W-2 boxes ~1,500 px tall,
  Misc Taxes ~25 fields, Final Income Items ~20 fields).
- **Forms mode** (#242): IRS-faithful replica, monospace values, grey = calculated/carried, white = editable.

**Accessibility observed**
- Two Yes/No image buttons both with alt text **"Next"** (#205) — screen readers hear two "Next" buttons.
- Grid inputs with no programmatic labels (charity grid #129, survey #234, W-2 state rows #050).
- 10 px help links; orange-on-white small caps.
- Critical context (refund meter, FAQ rail, Accuracy Review content) is native-drawn, not in the DOM.
- Errors via modal `alert()` / message boxes with no field association (#015, #053, #080).
- "QC" column header abbreviation with no expansion on the dependent-care allocation grid (#152).

## 12. Things NOT to copy

1. **Accepting empty required fields** and deferring the problem (#014, #025, #194) — produces template bugs
   ("You's Residency") and late surprises; and **"good news" outcomes computed from missing data** (#125).
2. **Phantom records**: clicking Add / answering Yes creates a persisted empty record that later shows up as
   "1st | 0" or "2nd (50 sh XYZ)" ordinals (#082, #087, #212). Create on save, not on intent.
3. **Instant delete with no confirmation or undo** (#088).
4. **Silent capping / silent rounding** (#051, #108, #155) — tell the user ("We can only use $300 of this").
5. **Modal alerts and OS message boxes for validation** (#015, #053, #080).
6. **Mislabelled summaries** ("taxable income" for total income #094; credits hidden in "tax due" #187).
7. **EXPLAIN AMOUNT that doesn't explain the amount** (#095).
8. **Unconditional catch-all walls** shown to everyone: gig-economy essay (#044), Final Income Items (#093),
   Misc Adjustments (#111), Other Deductions (#136), Misc Taxes with Form 4255 column references (#167).
9. **Asking the same thing twice** — tips/overtime per W-2 (#052/#059) and again on Schedule 1-A (#140); IL
   residency (#192) after the state grid (#017); senior deduction offered to a couple aged 40 and 38 (#140).
10. **Cryptic abbreviations as required controls** ("QC" #152) and question-less Yes/No screens (#205).
11. **No cross-jurisdiction carry-over** (IL property tax re-keyed #210; IL educator credit not suggested #215).
12. **Topic-scoped Back** (#109) and a terminal screen with no forward path (#240).
13. **Upsell inside outcomes** (#229 audit-risk → audit-support pitch) and the post-file survey placed in the
   file flow (#234).

## 13. Things worth copying

1. **Refund Reveal** narrative breakdown with sources named from the user's own data (#135).
2. **LATEST CHANGE delta card** under the meter; meter updates on topic exit (#056, #062).
3. **Checklist item anatomy**: plain label + "which form this is" sub-line + WHAT QUALIFIES? (#045, #114).
4. **Missing-info micro-interview + consistency screen** for recovery (#026–#032, #030).
5. **"Show only the conflicting fields"** correction screens with a plain-language rule (#070).
6. **Two-tier final review** (must-fix vs verify) with per-item location and in-place fix (#178–#186).
7. **Section index on sub-tab click** ("Where Do You Want To Go?", #247) and the **Take Me To** outline with
   completion ticks and per-record nodes (#243/#244).
8. **Recommendation + override on the same screen** (#012, #137) and **results in the title** (#123, #157).
9. **Read-only carry-overs with "ask only for the remainder"** (#126, #132).
10. **"Both" owner option** for joint statements (#065).
11. **Contextual FAQ rail** with personalised questions; **inline glossary links** on option labels (#008).
12. **Interview ↔ form split view** (SHOW FORM, #249) and Forms Central "Show Forms with Data" (#241).
13. **Expectation-setting interstitials** before confusing outcomes (#071) and closure messages that say why we
   are stopping ("Since you don't have marketplace insurance, your health insurance won't affect your taxes.", #165).

## 14. Differences vs TurboTax (placeholder — inferred from `../turbotax-2024/ux-findings.md`)

| Dimension | H&R Block 2025 | TurboTax 2024 (per the TurboTax study) |
|---|---|---|
| Section entry | Checklist gateways chained with topics; no persistent hub | Hubs with Start/Update/Visit All per topic + "Guide me / explore" fork |
| Section index | Sub-tab click → "Where Do You Want To Go?" list (#247) | Show Topic List modal tree |
| Meter | Updates on topic exit; LATEST CHANGE delta; Refund Reveal narrative | Updates while typing (shows transient garbage); no delta |
| Statement entry | Every box on one page (1099-INT/DIV/1098) | Rare boxes behind "My form has info in other boxes" |
| Answers | Radios labelled Yes/No; first-person only in some checklists | Full-sentence first-person answers ("No, I lived in Illinois all year.") |
| Validation | alert()/message box for format; empty fields accepted; correction screens; Accuracy Review two-tier with in-form fix | Inline (sometimes wrong) messages; "double-check" interstitials; Smart Check with embedded form snippet |
| Help | Separate Help Central window; inline glossary links; WHAT QUALIFIES?; FAQ rail | Learn More panels; side help |
| Forms | Forms Central window + SHOW FORM split pane | Forms mode + Show Relevant Form pane |
| PII order | Full names/SSNs/DOBs up front on one page (#013) | First name first, SSNs deferred |
| Tax year | 2025, OBBBA screens (tips/overtime/car loan/senior, Trump Account) | 2024 |
| Defaults | Many radios pre-answered (MFJ, No, Standard) | Sentence answers, product decides with "Change…" link |

The TurboTax agent's cross-product write-up (`../cross-product-patterns.md`) should treat this table as a
starting point; screen numbers here are H&R Block `#NNN`.

## 15. Coverage notes

- Covered: welcome/import, filing status (incl. Guide Me), personal info, state residency, taxpayer statuses,
  §7216 consent, dependents (quick + Guide Me + recovery path), Trump-account election, all income gateways,
  2 W-2s, 1099-INT, 1099-DIV (with an injected error), 1099-B (nested), capital-loss carryover, income summary,
  adjustments (IRA, educator incl. over-cap test), deductions (1098 quick entry, property tax, charity, SALT,
  misc), std-vs-itemized decision, OBBBA Schedule 1-A, credits (dependent care, CTC), health coverage, other
  taxes, AMT, payments, wrap-up, ID, Accuracy Review (2 issues fixed in-form, 1 verification), Tax Summary,
  Illinois return (incl. property-tax credit and review), File (print/mail path), Plan, Forms Central, Take Me
  To, Search, section index, SHOW FORM, Refund Reveal, ~11 help pop-ups.
- Not covered: activation screen (product skips it on this install), e-file path (deliberately avoided),
  import flows (PDF/photo/employer), AI Tax Assist (online), Reports menu (native menus not driven),
  W-2 "Guide Me" for filing status beyond MFJ, HSA/education/EITC topics (not in household).
