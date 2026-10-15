**★ An employer contribution to an Archer MSA leaves no deduction for the filer's own (round-2 QA, sc_00091,
2026-10-15).** IRC §220(b)(5); 2025 Instructions for Form 8853: "If an employer made contributions to your Archer MSA,
you aren't entitled to a deduction" - Part I (1): complete lines 1-2, skip 3-4, enter -0- on line 5. Any line 1
amount now forces Form 8853 line 5 (Schedule 1 line 23) to 0; the filer's line-2 money is then an excess contribution
(Form 5329 Part VI, not computed - the app has no year-end MSA value). The line-3 limitation stays month-by-month
(eligible on the 1st) / 12. **Open:** line 1 is not auto-read from W-2 box 12 code R (HSA line 9 is, from code W).

**★ A real estate professional's rental is nonpassive only if she materially participates in IT (round-2 QA,
sc_00075, 2026-10-15).** §469(c)(7)(A) only switches off §469(c)(2)'s per-se-passive rule; the rental is then tested
under §469(c)(1) (Pub. 925: "rental real estate activities in which you materially participated aren't passive").
The engine treats an explicit "No" on the property's `materialParticipation` as passive (with the active-participation
allowance); unanswered keeps the old professional-means-nonpassive behaviour. **Open:** the UI control is Yes-only, so
"No" cannot be sent from the form; the same control makes a NON-professional's rental nonpassive when ticked, which
§469(c)(2) forbids for long-term rentals; and the rental form has no related-buyer question for §469(g)(1)(B).

**★ Four more IRS limits the engine now applies (round-2 QA, sc_00062/64/66/68, 2026-10-15).**
(1) **QCD age gate (§408(d)(8)(B)(ii)):** a QCD must be made on or after the owner reaches 70½ (70th birthday + 6
months). The payment date is not captured, so the QCD entries are dropped (and QCD_OWNER_UNDER_AGE_70_HALF_* raised)
only when the owner cannot have reached 70½ at any time in the tax year. (2) **Form 8582 line placement:** a rental
WITHOUT active participation prints on line 2 ("All other passive activities"), not line 1 - line 1 sends a loss to
the Part II allowance by the form's own flow. (3) **Automatic 15% royalty depletion** is capped at the property's
income before depletion (§613(a), 100% for oil and gas); a typed depletion figure is trusted. (4) **§280A(e) before
§280A(c)(5):** rental expenses are first limited to the fair-rental-days share; a below-market rental with no
fair-rental days has a share of 0 - the whole rent is income, nothing is deductible and nothing carries. Capping the
full expenses at the rent (net 0) skips that step and understates income by the whole rent.
**Open:** the rental intake takes the RENTAL share of each expense (no day split), and has no lease-bonus field.

**★ Three IRS limits the engine now applies itself (round-2 QA, sc_00044/00055/00060, 2026-10-14).**
(1) **Simplified Method:** the monthly exclusion is the ORIGINAL cost (worksheet line 2) ÷ the table number; a
prior-year tax-free recovery only CAPS the year's exclusion at the cost not yet recovered (lines 6-8) - it never
shrinks the monthly amount (both the per-person and the per-stream path). (2) **Spousal IRA:** on a joint return
the 6% §4973 excess-contribution test uses the couple's combined compensation less the OTHER spouse's traditional +
Roth contributions (§219(c)) - the same rule the line-20 deduction cap already used; per-person compensation charged
a non-earning spouse 420 on a valid 7,000 spousal IRA. (3) **Form 5329 exception 09** (first home) stops at $10,000
whatever amount is entered (§72(t)(8)(B)); 08 (higher education) has no cap. When a field could hold either the raw
fact or the post-limit figure, apply the statutory limit in compute rather than trusting the entry.

**★ A pre-fill from an uploaded document fills BLANKS only, and says what it did.** Personal > Last year
1040 writes into forms the user owns, so it never overwrites a value already entered; re-applying is
therefore idempotent and safe, and the summary lists both what it filled and what it kept. Pre-fill only
facts the source document actually states for THIS year's return: date of birth is not on a 1040,
IP PINs are reissued yearly, digital-asset and campaign answers are about this year, and CTC/ODC
eligibility changes with age - leave those to the user rather than carrying last year's answer forward.

**★ Azure's `prebuilt-tax.us.1040` folds the unit into `valueAddress.streetAddress`** ("100 MAIN ST Apt. 4")
although the form prints a separate Apt. box - build the street from `houseNumber` + `road`. And on photos
the filing-status checkbox is often unread: a spouse on the "If joint return" name line implies MFJ.




**★ `localhost` in a dev proxy target is a ~200ms tax and a flake source — use `127.0.0.1`.** The backend binds IPv4-only (`127.0.0.1:8080`) and the Angular dev server IPv6-only (`[::1]:4200`), while `localhost` resolves **IPv6 first**. A proxy target of `http://localhost:8080` therefore attempts `::1:8080`, finds nothing, and falls back — measured at **2.126s vs 0.048s of connect time over 10 calls (~45x)**, and **451 `http proxy error` entries in one dev-server log against zero after the fix**. ★ This is the mechanism behind the recurring e2e flake class: `connect ETIMEDOUT ::1:4200`, `page.evaluate: TypeError: Failed to fetch`, and bare test timeouts, all passing on retry, all with 2–10x inflated durations. Proxy config is read at **startup**, so the dev server must be restarted.

**★ "Transient network" is a classification, not an explanation.** That flake class appeared in four consecutive full regressions and was correctly triaged each time — retry passed, a real defect sat elsewhere, move on. The literal address `::1:4200` was in the error text every single time and went unread. When the same non-deterministic signature recurs across runs, stop re-triaging it and go read what it is naming; a recurring flake with a stable signature has a cause.

**★ Splitting on text the document itself prints is an ORDER rule, and order is a property of the render, not of the document.** Form 1042-S prints boxes 3a and 4a on one line, so box 3a's value was read as everything before the "4a" the form prints between them. The two renders of one fixture return that strip as **`"10 4a Exemption code 64"` (PDF)** and **`"10 64 4a Exemption code"` (PNG)**, which split to `10 / 64` and `1064 / nothing`. The same trap caught label-to-value pairing a day earlier. Bound by a POSITION derived from the document's own printed marks - a neighbouring label - and treat `numericOnly`-style "first match wins" as an order rule too. ★ **And when a test contradicts your explanation of a bug, the explanation is what is wrong.** My first test fed the row's five measured glyphs to `orderForReading` and got the same order from both renders, because line grouping runs across the whole page: the divergence was real but not reproducible from the row alone. Log the actual value out of the running system before writing the comment, the commit message or the test.

**★ ...but "order is a render artifact" does NOT cover a row number in a structured table — I over-applied it the same day I wrote it.** Form 1095-A Part III is a thirteen-row printed table whose month names are **pre-printed on the blank form**, so a row's identity is its row number and the label is an echo of it. Azure returned **fourteen** rows on one render, losing the "July" label and pairing every later label with the next row's amounts; keying on the label — straight off the rule above — **shifted six months and lost the annual totals**. The distinction: reading order of glyphs on a page is a render artifact; the row index of a grid the model extracted from a fixed printed table is that table's own row number. Ask which one you have before choosing a key, use the other as a cross-check that warns on disagreement, and settle it against the fixture's AcroForm rather than against whichever rule you reached for last.

**★ A fixture where every box is ticked cannot tell a correct read from an over-read — a perfect score against it is not evidence.** Form 1095-B's Part IV has a 6×13 checkbox grid and all **78** boxes are ticked in the fixture, so **133/133 against its AcroForm said nothing** about whether an UNticked box reads as false, or about what happens when a column header is lost. Both were broken: an absent header made nearest-column file that month's mark under its **neighbour**, so August reported two months' coverage the form does not claim. Found only by writing synthetic cases on the measured geometry. **Ask what the fixture cannot distinguish before trusting the score** — uniform data (all-true, all-same, all-present) is the tell, and the answer is a unit test with the variation the fixture lacks, not another fixture run. Corollary: when a guard exists on one axis of a two-axis attribution, it probably belongs on the other too.

**★ Extraction transcribes a form; it does not correct it — so a field named for a BOX must hold what is printed in that box.** Azure parses an address semantically. On Form 1095-C it reported city "Milwaukee" and state "MI" while the form's **City** box (line 11) held `US 53704`, its **State** box (12) held `Milwaukee`, and its **Country/ZIP** box (13) held `MI`. Mapping `Recipient.Address.City` → `employerCity` is therefore wrong in principle and happens to be right only while the data is sane — which is exactly why the fixtures scramble it. **Ask what a UI field is NAMED for**: named for a box → read the box, by geometry if the model only offers a semantic parse; named for a concept → the parse is fine. The same test settles whether to "fix" odd-looking input: if the form says it, transcribe it and let the user see what their statement actually shows. Corollary: a model's structured output is a convenience, not an authority — it also merged two printed boxes into one field on the same form (`"22910
12770"`), which geometry does not.

**★ A search that finds nothing is a fact about the SEARCH, not about the thing searched.** I grepped Form 1095-C's Part III page for printed row numbers with a pattern that required the number and the name on one line — the layout Form 1095-B uses. It found nothing, and I wrote "its rows are UNNUMBERED" into a commit message, `history.md`, `context.md` and the plan for the next task. **The rows are numbered 18 to 30**; each number is simply its own glyph. The inference would have bought a whole row-discovery mechanism nobody needed. Before recording an absence as a property, weaken the pattern until it matches something and see what comes back, or count what IS there (235 filled fields had to be described by *some* structure). Same family as **an absent artifact is not a zero**. **★ Corollary for OCR work: probe the model the extraction actually runs.** `dump_marks`/`words` use `prebuilt-document`; a form configured for `prebuilt-tax.us.*` gets different OCR for the same page, so a glyph present in one is no evidence about the other. I diagnosed a reader bug from the wrong model's output; instrumenting the real reader settled it in one run.

**★ Read the audit log before theorising about an "it does not work" report.** A report that `1095-p3-c.png` would not extract had me checking UI bindings, directive code and component row caps. One log query ended it: `AUDIT formId=1095-c fileSize=175412` — and 175412 bytes is `1095-b-p3.png`, not `1095-c-p3.png`. **The wrong file had been uploaded into the right form.** The log records formId, size and content type on every extract; start there, and match the size against the fixtures.

**★ Silent misattribution is worse than failure, and a green sweep over real fixtures can hide the bug that causes it.** That wrong-form upload did not fail — it returned **36 plausible values in the wrong rows** (1095-B numbers its continuation rows 29-40, 1095-C's Part III reads 18-30, so two rows overlapped) with nothing in the response saying so. When a reader attributes input to slots, ask what happens when the input is from somewhere else entirely, and refuse rather than guess. **Then test the guard as a pure function:** my matcher shipped past a live sweep of 45 forms with a broken character class — `[\\w-]` is the class {backslash, w, hyphen}, not word characters — because the expected value was always found first and the faulty branch never ran. Seven unit tests found it immediately. **Corollary for any code-set matcher: check for prefixes.** Seventeen of these 56 form codes are prefixes of others ("Form 1098" of "Form 1098-C", "Form W-2" of "Form W-2G"), and a trailing `\b` matches all of them because the boundary between "8" and "-" is a word boundary.

**★ A form uploaded page by page must have each page report only what that page carries — anything else overwrites a sibling page.** Form 1095-C's page 3 prints no VOID or CORRECTED box (they are on page 1) yet reported both as `false`, so uploading page 3 into a statement that already held page 1 **cleared** them; the reverse cleared the self-insured flag. Azure makes the distinction decidable: a box it found and read as empty carries `":unselected:"` **and a bounding region**, while a box it never located has neither — so absent-from-page maps to null and found-but-empty still maps to false. This is the codebase's own null/zero semantic (null = does not apply, false = applies and is false) applied per page. **Check it on every multi-page statement**, and more generally whenever two inputs write the same record: ask what the second one says about fields it knows nothing about.

**★ Taking the FIRST match on a page is only safe when the label occurs once — and "once" is a property of the page, not of the form.** Form 1095-C prints month column headers in Part II as well as Part III. Every fixture carried one Part per page, so `findLabelIn(..., 0)` was right every time — until the whole form arrived scanned as ONE image, when the first `"Jan"` became Part II's and Part III's grid columns landed 400px from its marks. **62 of 169 checkboxes were lost.** Scope a section's search to below its own heading, and when you write a first-match lookup, ask what happens if the page holds two of that thing. Note what saved this from being worse: the column guard discarded marks it could not place rather than filing them under the wrong month — a guard that fails safe turns silent corruption into silent loss, which is better and still not good.

**★ A specialised model is not automatically better than the generic one — compare them on the same page.** `prebuilt-tax.us.1095C` read four ticked checkboxes as `unselected` at confidence **0.364** while `prebuilt-document` read the same four correctly, on the same image. That is independent of the separate problem that our configs named the tax models' fields wrongly. Everything a named model gave for Form 1095-C — five scalars and three checkboxes — was on the page to be measured, so the form moved to `prebuilt-document` and all 169 boxes now read right. **When a model's output looks wrong, try the other model before building around it**, and when a fix spans several pages of one form, check that the merged page equals the union of its pages field for field — that is a stronger statement than any single page's score.

**★ A fixture whose every box holds ONE word cannot test a multi-word box — build the fixture that stresses the assumption.** Forms 1095-B and 1095-C print their name in three boxes; we read one combined value and split it on the assumption that the surname is its last word. Both forms scored full marks against their AcroForm (133/133, 85/85) while the rule was broken, because every shipped box holds a single word. Set the widgets to `"Mary Jo" / "K" / "Van Der Berg"` and it returns **first="Mary Jo K Van Der", last="Berg"**, with the middle initial lost entirely. Ten minutes with PyMuPDF — set the three widgets, call `w.update()` to regenerate the appearance streams — turns a judgement call into a measurement. Sibling of the all-ticked-checkbox rule above: ask what the shipped data never exercises.

**★ Measure a margin before declining to act on it — my estimate was out by 2x and nearly cost the fix.** I read the gap between those name boxes off the single-word fixtures, got ~2x the word spacing, judged that too tight against the 4–8x of comparable rules, and recommended leaving it. Measured properly on multi-word names it is **5x on the tighter form and 34x on the other**. The estimate was pessimistic because single-word boxes happen to sit closer together. When a margin is the reason for not doing something, that margin is the thing to measure. Corollary from the same exercise: **physically impossible test data reads exactly like a bug** — I dropped a word from the middle of "Van Der Berg", leaving a 0.30in hole that genuinely IS a box boundary, and spent a cycle suspecting the code.

**★ One printed box can hold TWO facts, and a config that stores it as one field loses the
other silently.** The IRS prints a single box captioned "State/Payer's state no." - box 17 on
Form 1099-MISC, box 6 on 1099-NEC, box 15 on 1099-R. Azure carries one field per printed box, so
both facts arrive in one string (`"$ NY\n76565"`), and we stored all of it as `payerStateId`,
leaving the screens' state input - 1099-NEC captions it "State (Box 6)" - permanently blank.
Forms 1099-INT, -DIV, -G and -K give the state its OWN box, and their configs differ for that
reason; I nearly read the difference as a copy-and-paste shift in three configs. **When one
config disagrees with its siblings, check the FORMS before 'fixing' the odd one out.** Corollary:
**fixing one fault is what makes the next one legible** - with the state finally split out, the
neighbour was visible as `stateTaxWithheldAmount = 76565`, the state's own ID reported as tax
withheld, because Azure had assigned the same bundled string to the number-typed box beside it.

**★ A fallback that works hides the defect it is covering.** The 1099-INT config asked for
`Payer.RTN`; the model returns `Payer.Rtn`. The key never matched, so someone wrote an OCR regex
on the printed caption and a comment asserting the model "doesn't expose Payer's RTN as a
structured field" - it does, `"786543"` at confidence 0.799 on the fixture already in the repo.
No data was lost, so nothing looked wrong; the weaker route was simply the only route. **Treat a
hand-written recovery path as a claim about the upstream that needs checking**, and when a
comment explains WHY a workaround exists, verify the why - this is the third prose claim in this
file that was false. Same family as *a comment claiming a refactor is not the refactor*.

**★ Count the keys, then ask whether anything FILLS the field - the raw count is noise.** The
named-model audit opened at 325 of 818 configured keys absent from the schemas, which reads like
a catastrophe and was not one: the configs deliberately list several Azure spellings per target
(`Payer.TIN` AND `Payer.IdNumber`), arrays are flattened into the top level with `putIfAbsent`,
`concatFields` consumes keys too, and targets get written by Java through loop variables no
literal grep can see. Asking the one question that matters - *is this target filled by any path
at all?* - took 325 keys to 18 targets to **2 real findings**. **Model every path that can fill
the field before reporting a gap**, and state the metric you are actually measuring: three of my
own passes each inflated the number, the third because it did not parse `concatFields`.
Corollary: this kind of audit compares a key NAME against a schema and **cannot** see a live key
mapped to the WRONG target - a name audit and a meaning audit are different jobs.

**★ Mutation-test an AUDIT before believing a clean result from it.** The box-number meaning
check came back with 219 pairs and zero real mismatches, which is either good news or a check
with no power, and nothing in the output distinguishes the two. Injecting three deliberate box
swaps (1099-INT 1<->2, 1099-MISC 1<->2, 1099-DIV 1a<->3) caught all **six** sides and took the
flag count 13 -> 19; then the config went back byte-identical. **A negative result is only worth
something once the positive control has fired** - the same discipline as mutating a rule to see
the explanation change, applied to the measuring instrument rather than the code. Corollary: when
an audit's own regex produces the flags, expect most of them to be ITS faults, not the code's -
5 of 6 type flags here were `^qualified` and `Income$` matching legitimate amounts, and 10 of 13
box flags were scratch keys. Triage before reporting.

**★ A number and a checkbox can be offered for the SAME printed box - take the one the box
actually is.** Form 1099-LTC box 4 is a checkbox ("4 Qualified contract"), and Azure returns
both `Box4` (a boolean selection mark) and `Box4Amount` (a number) for it. The config mapped the
NUMBER onto the UI's boolean, and because the generic field pass runs before the form's
post-process, that number would have beaten the `putIfAbsent` filling the flag from the selection
mark. It never did, because `Box4Amount` reads empty at confidence 0.953 - **a populated ZERO
would have unchecked a box the form has ticked.** Compare the model's field TYPE against what the
target's name claims, and when a post-process holds the authoritative value, let it `put` rather
than `putIfAbsent` - deferring to whatever ran first is only safe if you know what that was.

**★ "Reserved" on this year's form can mean the concept MOVED TO ANOTHER FORM.** Form
1099-MISC box 14 carries a number and no caption on Rev. 4-2025 - no fillable widget either,
while every other money box has one, and "golden parachute" appears nowhere in the document. The
concept relocated to **Form 1099-NEC box 3**. Our config still maps 1099-MISC `Box14` to it,
which is harmless (empty at confidence 0.428 on a 2025 form, and CORRECT on a pre-2025 upload
someone may still file) - so it stays. **Before calling a cross-form mapping stale, find where
the concept went**, and check the AcroForm widgets and tooltips, not just the page text: three
independent signals settled this where the text alone was ambiguous. Same family as
*"reserved for future use" can mean RELOCATED, not repealed*, now observed across forms rather
than across lines of one form. **And it is the concrete cost of having no form-YEAR check.**

**★ A render difference is usually an ORDER difference, and an order-dependent reader turns it
into loss AND misattribution.** I reported that "1099-da.pdf loses the whole state section".
Both renders contain every printed value; Azure just emits them in different orders - the PNG
interleaves caption and values, the PDF groups all three captions then all six values. A line
walk that takes "the lines after the caption" therefore read the next two CAPTIONS, hit its own
`"15 state"` stop-word and reported success having read nothing - while the NEXT box's walk
collected those six values and wrote a state IDENTIFICATION NUMBER into a tax-withheld field.
**The reader's own stop-word guard is what silently zeroed it**, and the guard is correct; it is
the order-dependence around it that is not. So: never conclude "this render has worse recall"
before diffing the OCR CONTENT of both - and when a reader collects N values after an anchor,
ask what it does when the anchor is immediately followed by its own stop-word. Extends
*OCR reading order is not a property of the form*, which warned of a SWAP; this is the same
cause producing a silent shift into the wrong box.

**★ Diff BOTH renders of a fixture FIELD BY FIELD - it finds faults no single render can
show.** Form W-2G prints "City or town" twice, and its config had ONE fan-out slot where the
four sibling address captions all have two, so the winner's city was read and DISCARDED.
Scarborough was sitting in the PDF's key-value pairs the whole time. Nothing about either render
alone looks wrong - only `comm -13` over the two field sets shows it, and the same diff then
drove every remaining gap to a named cause (a merged caption, three unreported selection marks)
instead of a vague "the PDF is worse". A field-set diff of both renders belongs in the routine
check for every fixture.

**★ A mutation that reddens NOTHING is telling you your explanation is wrong, not that your
code is safe.** Having just written the rule about mutation-testing an audit, I mutated the new
geometric readers against their own tests. One mutation - giving the column the 2% left slack
used elsewhere - reddened nothing, and the test carried a comment asserting that *any* left slack
would swallow the neighbouring column's amount. **The comment was false**: the margin is 0.410in
(3.9 caption heights) against a 2% slack of 0.170in, and it takes 5% to break it. The code was
fine; the stated REASON for it was not. Treat a no-op mutation as a finding about the
justification, re-measure, and write the measurement into the comment - a fourth prose claim in
this file corrected by checking it.

**★ A matching KEY SET is not a matching extraction - diff the VALUES.** Having closed every
missing field on Form 1099-DA, both renders reported 58 fields and I nearly called it done. The
value-level diff found three filer-block fields where the PDF is wrong -
`filer_country = "+1 545
1234
US"`, `filer_zip = "KOKO
12345"` (box 1b's asset name bled into
the ZIP) - none of which a count or a key list can show. **Count agreement is the weakest form of
agreement**: it says the same slots were filled, not that they hold the same thing, and it is the
form of agreement a bled or merged value preserves. Sibling of *don't diff a human-readable
listing*, where the opposite error cost me a false "byte-identical" claim - both say the same
thing, that the comparison must be over the DATA.

**★ Ask where the box is printed relative to its caption before pairing them.** Form 1099-DA's
boxes 2, 5 and 9 have captions that WRAP over two to four lines with the checkbox UNDERNEATH,
while `readSelectionMarks` pairs a mark with a label on the same ROW - so three ticked boxes read
empty even though Azure reported all 16 of the form's marks on both renders, matching the
AcroForm one for one, including the one unselected. **The data was never missing; only the
pairing was.** When a checkbox comes back empty, dump the marks and the captions with their
geometry and look at the layout before assuming poor recall - and validate the pairing rule
against the fixture's AcroForm BEFORE writing the reader, which here turned a design question
into a table lookup. Note too what made it safe: box 6 prints three marks on box 5's own rows,
so the caption's horizontal span, not nearest-below, is what keeps them apart.

**★ When one party's block is wrong and the OTHER party's identical block is right, the labels
are fine - it is the value REGION.** Form 1099-DA's FILER telephone, country and ZIP came back as
`"12 555"`, `"+1 545 1234 US"` and `"KOKO 12345"` on the PDF, while the RECIPIENT's three boxes -
same captions, same config fan-out, same page - were correct on both renders. That asymmetry is
the diagnosis: nothing about label matching or config can explain it, so the fault is which words
Azure paired with the label. Read the cell from its own geometry instead, and note what the
region got wrong that geometry gets right: box 1b's "KOKO" is both to the RIGHT of the ZIP
caption and ABOVE its value band, so a two-sided cell test excludes it twice over. **Look for the
working twin before theorising** - it localises the fault in one observation.

**Personal forms: one list of required fields (2026-10-13).** Which fields a Personal form requires lives in
`us-tax-ui/src/app/utils/personal-requirements.ts` only. Both the form's save message ("Saved. Some required fields
are not completed yet: …") and Get started > Your checklist read it, so they cannot disagree. When a form gains or
drops a required field, change that file (and the template's `required` highlighting) together. A new compute flag
gets a Fix link only once it is added to `us-tax-ui/src/app/data/flag-form-links.ts`. A flag about one dependent must also carry `withDependentId(dep.id())` (and one about a particular statement `withFormId(...)`), or the checklist cannot tell which tab to open.

**1099-B term with no box 2 (2026-10-14).** `derive1099BBox` takes the term from, in order: an explicit Form 8949
category, the box 2 short/long flags, a date acquired of "INHERITED" (long-term, IRC 1223(9)), then the dates (more than
one year = long-term). A sale whose term cannot be derived is dropped from Schedule D, so any new text value allowed in
column (b) ("VARIOUS" etc.) needs a rule here too.
