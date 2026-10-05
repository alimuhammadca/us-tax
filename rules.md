


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
