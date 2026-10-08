# TurboTax 2024 (tax year 2024) desktop - static extraction of interview content

Purpose: a readable knowledge base of the TurboTax desktop interview (screen titles, body copy,
answer options, help links, navigation tree) for a UX study of competitor tax software.
Everything here was produced by a **read-only static scan** of the installed product
(`C:\Program Files\TurboTax\Individual 2024\`). TurboTax was not launched or modified, no
binaries were copied, and the scripts only open install files for reading.

## Files in this folder

| file | what it is |
|---|---|
| `screens.csv` | **Main deliverable.** One row per distinct screen content (5,877 rows, 5,503 screen ids). Columns: `screen_id`, `title`, `title_variants`, `body`, `options`, `buttons`, `fields`, `dropdowns`, `links`, `learn_more`, `images`, `personalization_tokens`, `control_kinds`, `modules`, `programs`, `occurrences`, `first_offset`. Multi-valued cells are joined with ` \|\| `. UTF-8 with BOM (opens in Excel). |
| `screens.jsonl` | Same data, one JSON object per line, lists kept as lists, plus `title_variant_scope`, `title_fully_decoded`, `debug_screen`. |
| `screen_instances.jsonl` | Slim index of all 11,844 compiled occurrences (screen id, module, program, file offset, title). |
| `topic-hierarchy.md` | Navigation structure: outer EasyStep tabs, the federal interview topic tree (4,031 nodes), and the hub "landing table" sections. |
| `topic-tree.json` | The topic tree as data (id, title, parent, index, next sibling, children, description). |
| `stats.md` / `stats.json` | All statistics (generated). |
| `assets-summary.md` | Help XML files, in-screen help-link resolution, UI image families, purchase dialogs. |
| `help-topics.csv` | Index of the 6,838 help articles (file, key, H1 title, length) - titles only, not article text. |
| `extract_screens.py`, `extract_topics.py`, `summarize_assets.py`, `compute_stats.py` | The reproducible pipeline (see "Usage"). |

## Usage (reproduce)

```
cd C:\us-tax\ux-research\turbotax-2024\static
python -I extract_screens.py      # fdiin.1pe -> screens.csv / screens.jsonl / screen_instances.jsonl  (~30 s)
python -I extract_topics.py       # fdiin.1pe + EasyStep\TP_*.xml -> topic-hierarchy.md / topic-tree.json
python -I summarize_assets.py     # dhtmlhelp\*.xml, img\, dlg\ -> assets-summary.md / help-topics.csv
python -I compute_stats.py        # -> stats.md / stats.json
```
Each script takes optional positional arguments (source path / install root, output dir); defaults are
the standard install path and the script's own folder. Python 3 standard library only.

## Method and file formats found

### Install layout (relevant parts)
- `Forms\1040_24\*.1pe` - proprietary **XPRF** containers. Header: `"XPRF"`, version bytes, u32 entry
  count at offset 12 (137 for `fdiin.1pe`), then 12-byte entries `(u16 type, u16 program, u32 offset,
  u32 length)`. Type `0x0CE4` entries name **nine compiled "programs"**: `INTERVIEW` (the main federal
  interview), `REVIEW` (Smart Check), `FINALREVIEW`, `EFINTERVIEW`, `WRAPUP`, `EFPOSTACK`, `PLANNER`,
  `PROREVIEW`, `AUDIT`. Every other section carries the program index it belongs to. Shared functions
  are compiled into every program, which is why most screens occur several times.
  - `fdiin.1pe` (58 MB) - interview bytecode with embedded, uncompressed cp1252 strings. **Source of
    everything in `screens.csv` and the topic tree.**
  - `fdittx.1pe` (36 MB) - not interview text: it is the calculation graph (thousands of data-model
    paths such as `/Return/ReturnData/IRS1040ScheduleB/...`). Not used.
  - `fdidg.1pe` - diagnostics / e-file error messages ("Not Eligible for Electronic Filing", ...). Not decoded.
  - `fdihlp.1pe` - binary help index (topic names like `ninfo26`); the help text itself is in the XML below.
  - `fdif01..21.1pe` - form definitions (field tables). Not used.
- `Forms\1040_24\dhtmlhelp\*.xml` - HTML help in CDATA: `hyper.xml` (6,191 in-interview popups,
  key = `hyp` + link target), `taxhelp.xml` (349 forms-mode articles), `xrefer.xml` (297 line
  cross-references), `govinst.xml` (1 stub).
- `64bit\local\EasyStep\*.xml` - outer shell navigation: `TP_*.xml` topic lists (tabs), `EP_*.xml` entry-point
  maps (which interview/dialog runs, where "Done" goes), `WPF_*.xml` WPF dialog pages.
- `64bit\local\img\` - 1,106 UI images (1,061 PNG); `64bit\local\dlg\` - 8 purchase/payment HTML dialogs.

### How a screen is encoded in `fdiin.1pe` (reverse-engineered)
1. **Module** (compiled function) header: `00 00 00 00 00 01 <NAME> 00` (e.g. `GETKEEPUPHOMEQUESTION`),
   followed by its variable table (`<idx> 01 00 <type> 00 00 <len><NAME> 00 00`).
2. **Display-screen statement**: opcode `0x34` + u32, a 13-byte header
   (`01 0? 01 01 ?? 01 01 ?? 00 00 ?? ?? ??`), one or more **title expressions**, the **screen id** as a
   length-prefixed string (mostly `fdiNNNN...`, but also numeric ids, `tps_fdi_*`, `com*`, `aca*` ...),
   1-3 numeric arguments, then a **control table**: u16 count + u32 offsets (first offset = 2 + 4*count).
3. **Controls**: u8 kind + 10 attribute bytes + payload. Containers carry a u32 size and a nested table;
   leaf kinds identified: 3 text, 7 image, 8 spacer, 9 button, 13 input field, 14 checkbox,
   16 drop-down, 17 radio group, 20 add/edit/delete list table, 25 action button (e.g. "Talk to an
   Expert"), 26 embedded web widget, 28 radio option, 32 rule, 37 included sub-screen.
4. **Rich text**: `09 <u32 len> <u32 len> [14-byte paragraph-format prefix] <text>`; inside, `02 <style>` ...
   `08` = bold/italic span, `08 08` = paragraph break, `07 <idx> 00 00 00 00` = module variable
   (rendered `{VARNAME}`), `06 .. ff <32-byte name> 00 00 <n> 00` = runtime value (rendered `{value}` or
   `{FIELD}`), `05 <target> 08 08 08 <label> 08` = help hyperlink (rendered `[label](target)`),
   `0e <url> ...` = external URL.
5. **Expressions** (titles, option labels) are prefix-notation: `03 02 <len><str>` string, `03 01` number,
   `04 <idx> 01 00 ..` variable, `01 0b 00 05 00 <n> 00` concatenate n operands, `07 00 01 00 ..` tax-form
   field reference (`{FORM.FIELD}`). When a title is a variable (`THETITLE`, `ASSETDESC`, ...) the script
   collects that variable's assignments since the previous screen in the same module as `title_variants`.
6. **Topic-tree record**: `<ID> 00 <flags> <u16 ?> <u16 index> <PARENT> 00 [<NEXT-SIBLING> 00] [description
   rich text / condition] 01 00 00 01 00 ff ff <TITLE> 00 <u16 n> n x <len><CHILD-ID>`.

### Reliability - read this before quoting numbers
- **Screen detection is reliable**: 11,844 of 11,875 display-statement header matches yield a screen with a
  control table. Distinct-content rows = 5,877; distinct ids = 5,503 (25 developer "Debug Screen" /
  `dbg*` ids are flagged `debug_screen` and excluded from statistics).
- **Text coverage**: ~88% of all distinct rich-text strings (>= 20 chars) in the file land in a decoded
  screen or topic description. The remaining ~12% are mostly text held in variables, debug/trace strings,
  message boxes, and content inside conditional containers the walker does not enter.
- **Grouping is exact for content inside a screen's control table** (it is structurally parsed, not
  guessed). The one heuristic step is the **last** top-level control when it is not a container: its
  rich texts are taken while they stay contiguous (stops at a variable assignment / next screen / >400 B
  gap). Rare leakage of a following string is possible.
- **Conditional copy is flattened**: the bytecode shows *all* variants a screen can display (e.g. single
  vs joint wording, parent vs child), not what one user sees. `body` therefore often lists alternative
  paragraphs back to back; `title_variants` lists alternative titles. `title_variant_scope` =
  `whole-module` (175 rows) means the assignments were collected from the whole module and may include
  titles of sibling screens.
- **Classification of text role** follows control kind: text controls -> `body` (this includes short
  field captions and column headers), radio/checkbox labels -> `options`, button labels -> `buttons`,
  input-field and drop-down captions -> `fields` (these are often internal names such as
  "Line 1 First fed date", not on-screen labels).
- **Personalization tokens**: `{NAME}` = a module variable (names like `POSSFIRSTNAME`, `THEPAYER`,
  `BUSNAME` are reliable semantically); `{value}` = a runtime-evaluated value whose expression was not
  decoded (very often a year or a name); `{FORM.FIELD}` = a tax-form field. Shares of "name" vs "year"
  tokens are therefore lower bounds.
- 3.6% of screen ids have no decoded title (title is an undecoded expression or a pure graphic); where
  the title expression only partly decodes, literal fragments are joined with ` | ` (e.g.
  `Do any of these apply to  |  home office?`, where a name was dropped).
- Statistics are over **distinct screen ids**; a screen counts once if any of its variants matches.

## Key statistics (full tables in `stats.md`)

| measure | value |
|---|---|
| screen occurrences in fdiin.1pe | 11,844 (INTERVIEW 10,265; REVIEW 422; EFINTERVIEW 280; WRAPUP 186; EFPOSTACK 171; FINALREVIEW 163; AUDIT 155; PLANNER 104; PROREVIEW 98) |
| distinct screen ids / distinct contents | 5,478 non-debug ids / 5,877 content rows |
| distinct titles | 3,926 |
| topic-tree nodes (titled) | 4,031 (3,092) |
| body copy per screen variant | median 42 words, p90 118 |
| screens with a "Learn More" link | 17.9% (978) |
| screens with any in-text help link (underlined term, Learn More, See Examples...) | 38.6% (2,113) |
| screens with radio/checkbox options / with buttons / with input fields | 24.0% / 24.2% / 34.7% |
| Yes/No **button** screens vs sentence-style **"Yes, I ..." / "No, ..."** radio answers | 12.2% vs 7.8% |
| add/edit/delete summary-list screens | 1.9% (104) |
| screens using any personalization token | 66.7% (name/entity-like variable 22.9%; runtime `{value}` 46.6%) |
| screens whose title is chosen at run time from variants | 553 (301 with 2+ variants) |
| "Learn More" placed at the end of its paragraph | 87% of occurrences (1,467 / 1,693) |

**Title phrasing** (3,926 distinct titles): Title Case 75%; ends with "?" 16%; starts "Enter" 7.5%,
"Let's" 5.2%, "Which/What/How/Where/When" 4.3%, "Tell us" 3.8%, "Your/About your" 3.7%, "Did you" 3.2%,
"Review/Check/Confirm" 3.0%, "Are/Is/Was" 2.0%, "Do you/Does" 1.8%, "We ..." 1.5%, "Select/Choose" 1.1%,
"Good/Great news/Congrats" 0.7%, "Here's" 0.5%, **"Do any of these apply" only 0.1% (5 titles)**.
Top two-word openings: "Tell Us" 104, "Did you" 75, "Did You" 51, "Tell us" 46, "Do you" 39,
"Let's Check" 37, "Enter Your" 35, "Let's get" 34, "Did {X}" 27.

**Vocabulary** (share of screen ids): "we'll" 12.0%, "Let's" 7.2%, "Continue/Select ... to continue" 5.0%,
"savings/saved/maximize" 3.4%, "We noticed/Looks like" 3.0%, "None of the above/these" 2.3%,
"recommend(ed)" 2.2%, "double-check/Let's check" 2.0%, "Good/Great news" 1.5%, "uncommon/less common"
1.2%, "Don't worry" 0.8%, "We've chosen/we chose" 0.2%, "Why we ask" 1 screen. Outcome-style titles
(results, "Good News!", "We've Chosen ... for You", "You Do Not Qualify", "Your ... Summary"): 96 = 2.4%.

## Topic hierarchy (summary - full tree in `topic-hierarchy.md`)

Three layers:
1. **Outer shell** (`TP_1040TOPICLIST.xml`): Federal (interview) - Smart Check - State Taxes - Review
   (Live Tax Advice, Analysis, Final Review, Audit Protection, Summary) - File (File a Return, Print/Save,
   Final Steps, Check E-file Status) - Analysis & Advice (Refund, Income, Deductions, Credits). Items are
   shown/hidden by C# predicates (`IsPersonalWithNoState`, `SupportEF`, ...).
2. **Federal interview tree** (`fdiin.1pe`): `THEVERYTOP` "Prepare Your Federal Tax Return" ->
   **Wages & Income** / **Deductions & Credits** / **Other Tax Situations** / **Federal Review**
   (Personal Info is a separate tree, `PERSONALINFO` "You & Your Family").
   - *Your Income* hub (14): Wages and Salary (W-2), Download/Import, Unemployment & Paid Family Leave
     (1099-G), Interest and Dividends, Stocks/Mutual Funds/Investment Sales, Retirement Distributions,
     Rental and Farm, Rental Income (Sch E), Other Income, Business Income and Expenses, **Less Common
     Income** (MSA/HSA, other tax documents, alimony, jury duty, foreign income, kiddie tax, scholarships,
     home sale, installment sales, misc).
   - *Your Deductions and Credits* hub (11): Your Home, You and Your Family, Charitable, Cars and Personal
     Property, Education, Covid-related credits, Medical, Estimates and Other Taxes Paid, Retirement and
     Investments, Job Expenses, Other Deductions/Credits; most have a "Less Common ..." sub-gateway.
   - Each hub is preceded by invisible routing nodes (imports, de-duplication checks, "postcard"
     summaries) and followed by a "Finish Up" wrap-up node with double-checks (missed K-1, foreign
     accounts, virtual currency, disaster question).
   - Federal Review (35 children) is a list of Smart-Check style checks ("Let's check your Child and
     Dependent Care", "Check for incomplete 1099-NEC forms", ...).
   - Repeated items (each W-2, 1099-R, business, rental, asset, vehicle) get their own **per-item mini
     hub** whose rows carry a subtitle: e.g. rental "Profile Info", "Property Income", "Depreciation,
     Sales, at-Risk Transactions", asset "Purchase Date, Cost, Type, Transfer".
3. **Hub landing table** rows: icon + heading + one-line examples of what is inside, e.g.
   "Interest and Dividends - Forms 1099-INT, 1099-DIV, 1099-OID"; "Less Common Income - Home sale,
   canceled debt (1099-C, 1099-A), 1099-SA, gambling, etc."; "Your Home - Property taxes, mortgage
   interest, points, home refinance, energy improvements" (26 rows, table in `topic-hierarchy.md`).

## Help, images, dialogs (summary - details in `assets-summary.md`)
- `hyper.xml`: 6,191 popup articles (median ~600 characters). 93% of the 703 distinct link targets used
  in decoded screens resolve to one of them. 85% of popup titles are noun phrases ("Backup Withholding");
  "How ..." 4%, "Why ..." 3%, "What is/are/'s ..." 4%. Recurring internal headings: "Note:",
  "Example:", "TurboTip", "CAUTION!", "Eligibility requirements", "What paperwork do I need?",
  "Limitations of this deduction/credit", "Special circumstances or exceptions".
- Most frequent link labels: "Learn More" (460) / "Learn more" (74), then glossary-style underlined terms
  ("Repairs and maintenance", "Supply expenses"), "See More Examples", "More Info", "Details".
- Images: `intgfx_*` 859 interview graphics (state badges 216, hub landing icons 62, e-file art 53, form
  samples 27, upsell 21, audit-risk meter 16, progress bar 10, refund meter 12, personal-info flow 12...),
  `icn_*` 65 icons incl. 1x/2x/3x "sectionOpener" illustrations, cross-sell icons (QuickBooks, payments).

## Notable UX patterns evident from the text (with quoted examples)

1. **Questions are carried by the title; the body explains and defines.** Titles are short, Title-Case
   and frequently a direct question ("Did You Maintain Your Home in {CURRYR}?"), while the body gives a
   one-sentence operational definition plus a help link: "Tell us if you paid more than half the cost to
   run your home in {CURRYR}. Typical costs include rent, mortgage interest, repairs, food eaten in the
   home, and utilities. [Learn More]". Median body = 42 words.
2. **Answer options restate the full decision, not just Yes/No.** "Yes, I paid more than half the cost to
   run the home in {year}." / "No, someone else paid more than half the cost to run the home."; "Yes,
   {THISBIZ} receives income from a co-owned SSTB." Plain Yes/No buttons still dominate older screens
   (12.2% vs 7.8% of screens).
3. **Heavy personalization and pronoun switching.** Two thirds of screens interpolate something; names
   appear in titles ("Did You Pay for More Than Half of {POSSFIRSTNAME} Living Expenses?"), and whole
   strings switch between I/we and you/spouse ("No, we'll keep the deduction (recommended)." vs "No, I'll
   keep my deduction (recommended)."; tokens such as `{WHOOWNS}`, `{YOUORNAME}`, `{BUTTONIWE}`).
4. **Progressive disclosure via "less common / uncommon" bucketing.** The navigation separates
   common topics from "Less Common Income", "Less Common Home Credits", "Dependent Care Credit Uncommon
   Situations"; screens explicitly label rare branches ("My form has info in more than just box 1 (this
   is uncommon)."; "Do any of these uncommon situations apply to this W-2?"; "These may be uncommon, but
   they could save you some money if you qualify.").
5. **Multi-select checklists with an exclusive "None" answer**, used sparingly as titles ("Do any of
   these apply to the series EE or I bonds you cashed?", "Do Any of These Apply to Your Spouse?") but
   "None of the above/these" appears on 124 screens, with an explicit rule: "You cannot select 'None of
   these' in combination with another selection."
6. **The software makes and announces decisions** ("We've Chosen a Filing Status for You", "We've Chosen
   Itemized Deductions for You", "That's why we've chosen the standard mileage rate. Would you like to
   change...?") and marks a **recommended option inline** ("Direct deposit ... (Recommended for a faster
   refund)", "No, we can skip AMT (recommended if you don't have carryovers ...)", "(Not recommended)").
7. **Outcome / celebration screens close a topic**: "Good News! We Just Reduced Your Tax Bill",
   "Great news! You've got a total vehicle deduction of ${X}", "Here's Your Education Summary",
   "You Do Not Qualify for the Exclusion" - always naming the concrete effect.
8. **Error prevention in a friendly register** - "Let's Check ..." (37 titles), "We noticed ...",
   "Looks Like We're Missing Important Info About This 1099-R", "Are You Sure About Your Total Sales Tax
   Rate? ... We noticed that your total sales tax was a little on the high side. Remember, this number is
   a percentage." Reassurance copy: "Don't worry this is a quick and easy process."
9. **Repeating items use list hubs** ("Here's the interest we have so far. If you have more to add right
   now, let's do it. Otherwise let's move on." with Add / Edit / Delete), and each item has a mini-hub of
   sub-sections with descriptive subtitles; topics start with **import-first** offers that can be skipped
   ("Let's see if your employer offers W-2 import" - [Skip Import]; "Snap a Photo of Your W-2" - [Skip
   This]) and deferrals ("Remind Me Later", "Skip For Now").
10. **Help is layered and inline**: ~39% of screens carry in-text links - generic "Learn More" (usually
    the last thing in the paragraph) plus glossary-style underlined terms inside the sentence ("[roll
    over] any part of the [qualifying lump-sum distribution]"), "See Examples", and very rarely a "Why We
    Ask" link (1 screen). Hub rows teach scope with example lists ("1099-MISC, 1099-K, 1099-G, tax
    refunds"). Upsell lives in the same channel ("[Why do I need Premier?]").

## Caveats / what was not extracted
- No screenshots or runtime flow: screen **order** is only implied by module code and the topic tree;
  the conditions that select variants are not decoded into readable rules.
- The state interview, Smart Check diagnostic messages in `fdidg.1pe`, and WPF dialog layouts were not decoded.
- `fields` captions are partly internal names; `{value}` placeholders hide whether a name or a year is shown.
- Content is TurboTax's copyrighted text, quoted for internal competitive UX research only.
