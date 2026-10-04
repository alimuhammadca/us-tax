## 2026-10-04 - Form 1095-C Part III: one grid reader for two forms, and a failed grep filed as a fact

**3 -> 237 values** on the PDF (236 on the PNG). **234/234** against the fixture's AcroForm: all
13 rows x 5 text fields, all 169 checkboxes, plus void, corrected and selfInsuredCoverage.

★ I HAD THIS PAGE WRONG IN MY OWN NOTES, AND COMMITTED THE ERROR. The previous entry records
that Part III "needs rows discovered by clustering the marks" because "its rows are UNNUMBERED".
**They are numbered 18 to 30.** Each number is simply its OWN line glyph, where Form 1095-B
merges it with the name ("23 Marianne"). My grep required the number and the name on one line,
found nothing, and I wrote the absence down as a property of the form - in the commit message, in
`history.md`, in `context.md` and in the plan for the next piece of work. **A search that finds
nothing is a fact about the search.** Same family as "an absent artifact is not a zero", and this
time the inference travelled into four documents and would have bought a mechanism nobody needed.

So no new mechanism was built. The 1095-B grid reader now takes its first row number, its row
count and its target list as parameters, and both forms call it:

    1095-B Part IV    rows 23.. (and 29.. on the continuation sheet)   coveredIndividuals
    1095-C Part III   rows 18-30                                      partIIICoveredIndividuals

The thirteen column headers and the thirteen field names are identical on both forms, and the
existing regexes already matched both spellings - 1095-B prints `Jun`/`Jul`/`Sep`, 1095-C prints
`June`/`July`/`Sept`. Second instance is what justified parameterising it; the first would have
been speculation.

★ AND A METHOD NOTE THAT COST A WRONG DIAGNOSIS. Row 24's middle initial "X" is in the PDF's
word list and not the PNG's. I probed with `dump_marks.mjs`/`words.mjs`, saw the glyph present on
the PNG, and concluded my reader must be dropping it. Those tools run **prebuilt-document**; this
form's extraction runs **prebuilt-tax.us.1095C**, and the two models return different OCR for the
same page. Instrumenting the real reader settled it in one run - the bound and the band are
identical on both renders (`textRight` = the grid's left edge, 13 marks attributed) and the glyph
is simply absent from the model's words. **Probe the model the extraction actually runs.**

The other render difference is a plain OCR one: a surname reads "Chandrasekar" on the PDF and
"Chandrasekal" on the PNG. Both differences are upstream of any mapping.

A better oracle than 1095-B's, incidentally: this fixture leaves three of its boxes UNticked, so
the all-true weakness that hid two real bugs there does not apply here.

MEASURED, NOT ASSUMED. The refactor is behaviour-preserving - `1095-c`, `1095-b` and `1095-b-p3`
all re-extract byte-identical on both renders. Unit suite **2,843 / 0** (2 new, pinning 1095-C's
row range and that the self-insured box at the top of the page belongs to no row).

**The 1095 family is complete:** 1095-A 3->103, 1095-B 0->133 (+220 continuation sheet), 1095-C
0->86 (+237 Part III).

Open, in priority order: **the 1095-A address fix** - it reads Azure's SEMANTIC address
components and is correct only because its fixture is sane, the one piece of this family left
undone; **the remaining 24 named-model configs**, since three of three audited were wrong; a sweep
for UI-bound statement fields with no backend column; the dot-leader gap in `attributeRowCells`'
text mode; unify the three name/address compose copies; the four render differences from
2026-10-03; the 1099-SA phone grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on
`w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and mapping an Azure 429 to
503 rather than a bare 500.

## 2026-10-04 - Form 1095-C: five invented keys out of five, and transcribe-don't-correct

**0 -> 86 values, 86/86** against the fixture's AcroForm (71 filled fields), byte-identical on
both renders.

**Every one of the five configured keys was wrong** - `EmployerEIN` for `Employer.EIN`,
`EmployeeSSN` for `Employee.SSN`, `EmployeeNameAddress` for `Employer.Name`,
`EmployeeFirstName`/`LastName` for `Employee.FirstName`/`LastName` - so nothing matched and
nothing was extracted. Second confirmed case of the invented-key class after 1095-A, and worse:
**5 of 5** rather than 7 of 10. Predicted from the config alone before the upload, which is the
first time this class has been called in advance rather than found by a user.

Thirteen Part I scalars now come from `prebuilt-tax.us.1095C`, which reads them well. Two things
do NOT, and both are read from the page instead.

★ 1. THE ADDRESS BLOCKS - EXTRACTION TRANSCRIBES A FORM, IT DOES NOT CORRECT IT. Azure parses
an Address SEMANTICALLY. On this fixture it reports city "Milwaukee" and state "MI", while the
form's own boxes hold:

    line 11  City or town           "US 53704"
    line 12  State or province      "Milwaukee"
    line 13  Country and ZIP        "MI"

The fixture scrambles them deliberately, and the screen's fields are named for those BOXES - so
`employerCity` must hold what is printed in the City box, not what a parser thinks a city is.
Azure also mangled `streetAddress` into `"400 Industrial Pkwy\nUS"`. Read by geometry, all nine
address values are box-faithful.

**Reported, not quietly changed:** Form 1095-A reads its address from those same semantic
components and is correct only because ITS fixture is sane. The same latent mismapping is there.
Changing a verified form unasked is not mine to do, so it is written down instead.

★ 2. PART II, WHERE THE MODEL MERGES TWO BOXES. It folds the "All 12 Months" column into
January for two of its four lines - `Section4980H...January` comes back as `"22910\n12770"` with
`All12Months` null, two values in one field, and `ZIPCode` the same. Read by geometry there is no
merge and all 52 figures are right. Part II is printed as FOUR rows of THIRTEEN columns and
stored as THIRTEEN period rows of four values, so reading it is also a transpose.

★ AND THE LOAD-BEARING DECISION WAS WHERE A COLUMN BEGINS. The values are right-aligned in
their columns while the headers are centred, so a value can start well left of its own header:

    January's 71340 begins 0.096in left of "Jan" on the PDF, and 14px left of it on the PNG
    - both MORE than the half-label-height overhang slack

Taking a header's left edge as the cell edge therefore files January's figure under "All 12
Months" (`cells[0] == "232 71340"`), which a test now pins as the defect. The cells are bounded
at the **midpoints between adjacent header centres**, which leaves about a quarter of an inch
either side and, being header-derived, holds on both renders. The midpoints are passed as
zero-height synthetic labels, so `attributeRowCells` needed no change - a shared rule reused
rather than widened.

MEASURED, NOT ASSUMED. **Purely additive**: zero lines removed from `GenericFieldMapper`. Unit
suite **2,841 / 0** (6 new), including the misfiled-January defect and the midpoint margin on
both renders.

**Still open on this form:** `1095-c-p3` carries **235 filled fields** of Part III covered
individuals and extracts 3. It is the same grid as 1095-B Part IV at the same x positions, but
its rows are **UNNUMBERED** - so it needs rows discovered by clustering the marks by y rather
than from printed row numbers. Not built; stopping there rather than sprawling further in one
commit.

Open, in priority order: **1095-C Part III** (above) and the **1095-A address** fix, best done
together; **the remaining 24 named-model configs**, since three of three audited so far were
wrong (`1095-a` 7 of 10 keys, `1095-b` empty, `1095-c` 5 of 5); a sweep for UI-bound statement
fields with no backend column; the dot-leader gap in `attributeRowCells`' text mode; unify the
three name/address compose copies; the four render differences from 2026-10-03; the 1099-SA phone
grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`;
`1099-g.png`'s duplicated phone fragment; and mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 1095-B: a config entry present but EMPTY, and the first checkbox GRID

**0 -> 133 values** on the main page, **133/133** against the fixture's AcroForm (134 filled
fields; line 1's three name boxes collapse into two model fields), byte-identical on both
renders. The **continuation sheet** reads too: **220 values**, also identical on both renders.

★ A THIRD FAILURE MODE FOR A CONFIG ENTRY. After "missing" (the eight-form sweep) and "names
invented keys" (1095-A), this one was **present but EMPTY**: `prebuilt-document` with
`"fields": {}` and no geometric reader either. So `mapped` stayed empty, the documented
last-resort AcroForm fallback fired, and the response was **301 raw widget names** (`c1_01[0]`)
that match no model field - which is exactly the blank form reported. Eleven other entries are
also empty, but those are cell-reading forms that read by geometry and need no key-value map;
`1095-b` was the only one with neither. There is no `prebuilt-tax.us.1095B` model (404), so
`prebuilt-document` was the right choice all along - its key-value pass gives clean labels for
all of lines 1-22, which is now configured.

★ PART IV NEEDED A CAPABILITY THAT DID NOT EXIST: A CHECKBOX GRID. Each covered individual has
thirteen boxes - "all 12 months" then Jan to Dec - and `readSelectionMarks` pairs a mark with ONE
named label, so it cannot say which ROW a mark is in. `attributeMarkGrid` places each mark by
nearest row (the printed row numbers) and nearest column (the printed month headers), both taken
from the form's own marks and neither from a page fraction. Azure returns all 78 marks on both
renders.

Each row's TEXT is bounded on the right by **that row's leftmost mark** - exact, free because the
marks are already in hand, and it keeps out the "X" glyphs the checkboxes also produce as words.
Name, TIN and date of birth are then separated by the **shape each box requires** (a TIN, a date,
and whatever is left is the name) rather than by x thresholds or by arrival order. Two name
shapes, deliberately different: Part I's first-name input is labelled "First name and middle
initial" so `splitName` is right there, while Part IV has its own M.I. box and takes a three-way
split on the one rule a middle initial obeys - it is one letter.

★ AND THE PRINTED ROW NUMBER IS THE LIST INDEX. Part IV numbers rows from 23 and the
continuation sheet carries on from 29, so `printed - 23` is the row's place in the list and ONE
reader handles both pages without being told which it is looking at: 23-28 fill rows 0-5, 29-40
fill rows 6-17. The screen already pads and slices that list at eighteen - the main page's six
plus the continuation sheet's twelve. Page 3 also repeats the responsible individual across its
top with NO line numbers, which is what tells the two pages apart, so that header is read only
there and never competes with page 1.

★ TWO DEFECTS THE FIXTURE COULD NOT HAVE REVEALED. Every one of its 78 boxes is ticked, so
133/133 says nothing about either:

  - an **UNSELECTED** mark must read false, not be dropped - the two look identical on this
    fixture and differ completely on a real statement with a mid-year lapse;
  - with one month header lost to OCR, nearest-column silently filed that month's mark under its
    **NEIGHBOUR**. August took two marks and reported coverage the form does not claim. A column
    guard symmetric with the row guard now discards it and warns.

Both are unit-tested synthetically on the measured geometry. A fixture where every box is ticked
is a weak oracle for checkboxes, and a perfect score against it is not evidence - same shape as
the 1098-C Yes/No pair, but this time the weakness hid a real bug.

Also: **lines 8 and 9 print side by side and the key-value pass merges them**, returning
`"9 Reserved" => "289 B"` with the two in the opposite order to their labels. They are told apart
geometrically instead - line 8's letter is left of line 9's label, line 9's value is below it -
with the half-label-height overhang slack line 9's value needs on the PDF. And one more
page-fraction trap caught in passing: `attributeRowCells` falls back to
`labels.get(0).x0() - pageWidth * 0.02` for its left edge, so passing a page width of ZERO
silently removes the slack - which dropped the first name on the PDF render of page 3. The caller
now passes a label-derived left edge instead.

MEASURED, NOT ASSUMED. **Purely additive**: zero lines removed from `GenericFieldMapper`, so no
other form's behaviour could change - which is a proof rather than a sweep. Unit suite
**2,835 / 0** (8 new).

Open, in priority order: **sweep the remaining named-model configs against what their models
actually return** - `1095-c` is next and has the same smell as 1095-A, five configured fields
against a structured model; a sweep for UI-bound statement fields with no backend column; the
dot-leader gap in `attributeRowCells`' text mode; unify the three name/address compose copies;
the four render differences from 2026-10-03; the 1099-SA phone grouping; W-2 box-12 amounts and
box 14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone
fragment; and mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 1095-A: the first "invented field names" case, and a lesson over-applied

**3 -> 103 values.** PNG **103/103** against the fixture's own AcroForm (81 filled fields); PDF
**102/103**, the one miss being Azure's OCR dropping the house number on that render - its raw
address `content` lacks the "14", so it is upstream of any mapping.

This form **HAD** a `field-mappings.json` entry, which is exactly why the missing-entry sweep that
finished an hour earlier never caught it. The entry asked for ten of the ninety-three values
`prebuilt-tax.us.1095A` returns, and named **seven of those ten wrong**:

    PolicyNumber                 ->  MarketplaceAssignedPolicyNumber
    RecipientSSN / SpouseSSN     ->  Recipient.SSN / Spouse.SSN
    Recipient{First,Last}Name    ->  Recipient.Name   (one field, needs splitting)
    Spouse{First,Last}Name       ->  Spouse.Name

It never asked for the policy issuer, either address, either date of birth, the void/corrected
marks, the tax year, the five covered individuals, or **any of Part III** - although the backend
already had `se_1095_a_covered_individual` and `se_1095_a_coverage_monthly` and the screen already
had every input. Nothing needed adding to a statement form; the data had nowhere to go only
because nothing asked for it. **This is the first confirmed instance of the class named as the top
open item**, and it was found the same way all five earlier ones were: by an upload, not an audit.

★ I GOT PART III WRONG FIRST, BY OVER-APPLYING YESTERDAY'S LESSON. Thirteen printed rows come
back as thirteen on the PDF and **FOURTEEN** on the PNG, where Azure loses the "July" label and
from that row on pairs each remaining label with the NEXT row's amounts:

    row 6    Month null        400 / 590 / 345     <- July's amounts, unlabelled
    row 7    Month "July"      730 / 785 / 205     <- August's amounts
    row 12   Month "December"  925 / 720 / 175     <- the ANNUAL TOTALS
    row 13   Month "Annual Totals"  (no amounts)

I keyed on the label, straight off the Form 1042-S finding that content beats order. That shifted
six months and lost the annual totals entirely. **Part III's month names are PRE-PRINTED on the
blank form**, so a row's identity is its row number in that table and the label is an echo of it.
A table row number is not the reading order of glyphs on a page: one is the grid the model
extracted, the other a render artifact. The 1042-S lesson is about the second and says nothing
about the first, and I applied it anyway.

The fixture's AcroForm is what settled it rather than my reasoning - `f1_59..61` is July
(400/590/345) and `f1_77..79` the totals (925/720/175) - so this is not a one-fixture guess in the
other direction. The rule now: drop rows carrying no amounts at all (the PNG's fourteenth, which
has a label and nothing else); if thirteen remain, key by **row number** with the label as a
cross-check that WARNS on disagreement; if the count is anything else the shape is wrong, the
positions carry no authority, and the label takes over. Both renders then give the same answer,
and a dropped row or a missing label is still reported.

★ AND A JAVADOC THAT HAD BEEN UNTRUE SINCE IT WAS WRITTEN. `extractValue`'s own comment
advertised configs like `"Filer.Address.StreetAddress"`, but its recursion only stepped through
OBJECT fields - an ADDRESS stopped it, and such a path returned null. **No config used one, so
nothing was broken; the claim was simply untrue.** It is true now, and reading Azure's parsed
`valueAddress` components is better than splitting the field's `content` on its newlines, because
that text is ordered by where the boxes sit. Third instance of a comment describing work the code
did not do.

MEASURED, NOT ASSUMED. All 23 other named-model forms x both renders byte-identical before and
after the `extractValue` change (the new branch runs only after the OBJECT recursion has already
failed, so it can turn a null into a value and never change one - measured anyway). Unit suite
**2,827 / 0** (9 new), pinning the measured fourteen-row PNG shape, the shifted answer
label-keying would have produced, and the misshapen-table fallback.

Open, in priority order: **sweep the remaining 26 named-model configs against what their models
actually return** - 1095-A was the first of this class to be confirmed and there is no reason to
think it is the only one; a sweep for UI-bound statement fields with no backend column; the
dot-leader gap in `attributeRowCells`' text mode; unify the three name/address compose copies; the
four render differences from 2026-10-03; the 1099-SA phone grouping; W-2 box-12 amounts and box
14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and
mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 1042-S: the last form with no config entry, and order is not a form property

No field-mappings entry. **0 -> 73 fields, byte-identical on both renders, every one matching the
fixture's AcroForm.** The AcroForm holds 74 fields; two pairs are the tax-rate combs that collapse
into one value each, and box 9 has no field at all, so 73 is the whole form. Eighth of the original
eight. **Every one of the 56 catalogue forms now has a config entry** - that backlog is closed.

The biggest form in the catalogue and the only one where most boxes print their value ON the
label's own line rather than under it. Sixteen side rows and twenty-three cell rows, one
readCellLayout pass, the divide taken from box 13l at x 4.3455 / 510px.

★ READING THE STRIP AND SPLITTING IT ON THE FORM'S OWN TEXT IS AN ORDER RULE, AND ORDER IS A
PROPERTY OF THE RENDER. Boxes 3a/4a and 3b/4b each share ONE printed line, so a box's value is
what sits between its own label and its neighbour's. I first read the whole strip and split it on
the "4a" the form prints between the two boxes. Measured from the running extraction:

    PDF   "10 4a Exemption code 64"   -> splits to 10 / 64
    PNG   "10 64 4a Exemption code"   -> splits to 1064 / nothing

`SideRow` gained `boundedRight()`: a right-hand bound taken from a neighbouring LABEL, which is
the counterpart to the left bound `readSideRows` already derived from the anchor's own extent. A
label's position is a property of the form. Second instance of this lesson after the 2026-10-03
OCR-reading-order finding, and the first where the two renders disagree WITHIN a single row.

★ AND I NEARLY RECORDED THE WRONG REASON FOR IT. My first attempt to pin the divergence in a
test fed the five measured word glyphs to `orderForReading` and got the SAME order from both
renders - so my explanation was false as written. Line grouping runs across the whole page, so the
order these glyphs come back in depends on their neighbours elsewhere on the row and cannot be
reproduced from the row alone. I logged the two real strings out of the live extraction before
writing either the code comment or the test. A failing test that contradicts the story is the
story being wrong, not the test.

★ TEN OF EIGHTEEN MUTATIONS MADE NO DIFFERENCE, AND SEVEN GOT DELETED. Every null-field row and
null cell in the layout was broken one at a time against the live extraction:

  - **Seven null rows DELETED.** Boxes 5, 6, 7a, 7b, 7c, 7d and 8 each had a null row declared to
    bound box 2's band from below. Every left-column amount on this form is printed RIGHT-ALIGNED
    near x 4.0, past box 2's cell and inside the null third cell that box 2 needed anyway - so the
    third cell already did their work. Not "inert on this fixture": inert because of where the form
    prints its amounts. Removed rather than kept and described.
  - **Three kept as insurance, with the mutation result written beside each.** 15l's alternation,
    and box 3a's and the amendment number's right bounds, change nothing today - each is masked by
    `numericOnly`'s first-match-wins, which is itself an order rule. Kept, and labelled as
    insurance rather than structure so nobody later mistakes them for load-bearing.
  - **Eight proved load-bearing**, with the exact failure recorded: box 2 without its third cell
    reads box 3a's 10 as the gross income; box 12a without its null cell reads
    "59-0067812 12c Ch. 4 status code 775"; box 14b reads "15" (the pro-rata checkbox's own glyph)
    instead of 960.

★ WHICH GLYPHS OCR CORRUPTS IS ALSO PER-RENDER. "12l" comes back as "121" on the PNG and
survives on the PDF; "15l" survives on BOTH; "13l" and "13o" are corrupted on both. Nothing
predicts which, so every l/o box letter is now an alternation. Without 12l's the state and country
ran together and the ZIP was lost; without 13l's the GIIN took the FTIN's value.

Three more things specific to this form:

  - **Two values are printed to the LEFT of the label that names them** - the unique form
    identifier and the amendment number - which no anchor on that label can reach. Each is
    anchored on the block printed left of IT ("Internal Revenue Service", "AMENDED") and bounded
    by its own label. `amendmentNumber` had never been extracted at all.
  - **Four comb fields** (one printed box per character) OCR as separate glyphs on both renders:
    the identifier, both tax rates and the date of birth. Read as text, spacing dropped. A rate's
    point goes between its two printed cells - the form prints two 2-character combs, the PDF
    carries them as two AcroForm fields and the screen splits the model value on "." - and
    anything other than four digits is kept as read and logged rather than split on a guess.
  - **Box 9's brackets are blank-form furniture.** The "(" sits at x 0.7976 and the value and its
    ")" at x 2.5500, an inch and three quarters apart with printed label text between them. 180,
    not -180. The box also has no AcroForm field in the fixture, so it exists only as drawn text.

MEASURED, NOT ASSUMED. Eighteen forms x both renders byte-identical before and after the
`readSideRows` change (the new branch is guarded on a null check, and all four call sites are in
this one layout). Unit suite 2,818 / 0 (19 new). Also caught here: `JSON_OUT` is a PATH, not a
flag - `JSON_OUT=1` wrote to a file called "1" and my first "byte-identical" diff compared two
EMPTY sets. Same shape as the 2026-10-03 listing-diff error, caught this time before publishing.

Open, in priority order: **audit the configs that DO exist for invented field names** - five
instances, every one found by an upload rather than by looking, and now the top item with the
missing-entry backlog closed; a sweep for UI-bound statement fields with no backend column; the
dot-leader gap in `attributeRowCells`' text mode; unify the three name/address compose copies; the
four render differences from 2026-10-03; the 1099-SA phone grouping; W-2 box-12 amounts and box
14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and
mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 1098-C: two shapes in one form, and the stub has two left edges

No field-mappings entry. **0 -> 26 fields, identical on both renders, every one matching the
fixture's AcroForm**, first pass. Seventh of the original eight; only **1042-s** is left.

The top half is the usual three columns - donee and donor on the left, boxes 1-4c in the middle,
a Copy B stub on the right. From box 5a DOWN the form goes FULL WIDTH: boxes 5a to 7 run from
x 0.73 across to 6.5, under the same stub. Two divides again, both from labels, so two
readCellLayout passes - box 1's label bounds the upper-left rows, the stub bounds every box row.
The upper boxes and the full-width rows share ONE column, because each row takes its own left
edge from its own label; nothing extra was needed to put them together.

★ THE DIVIDE HAD TO COME FROM THE RIGHT PARAGRAPH. The stub has two, and they do not start at
the same x:

    "Attachment Sequence No. 155A"   begins 6.6949in / 810px
    boxes 4c and 6b, values begin    6.6138in, 6.6185in / 796px
    "Unless box 5a or"               begins 6.9862in / 848px

A divide taken from the UPPER paragraph falls LEFT of two box values and would cut them off. The
lower one clears both, on both renders. The upper stub is handled instead by box 1's null OMB
cell - the same move as every other form in this sweep, which is why it was already there.

"The stub's left edge" is not one number. I had been treating a prose column as a single x, and
it is a column of paragraphs that are each indented differently. Picking the one that clears the
content is a measurement, not a choice.

★ FIVE ROWS EXIST ONLY TO BOUND THE ROW ABOVE. Boxes 4a, 5a, 5b, 6a and 7 are all checkboxes,
and readRows ends a row at the next CELL row only - a checkbox read from a selection mark is
invisible to that bound. Box 5a is declared in BOTH passes for this reason: in pass 1 it stops
the donor's address row from running to the footer and swallowing the full-width text of boxes
5c and 6c, which start at the same x. Fourth form to need a null-field row, and the first to
need the same one twice.

Two more things specific to this form:

  - SEVEN checkbox groups, including a Yes/No pair on box 6a where the component models only the
    "Yes" side. Anchored on that label, with nearest-mark-to-the-label keeping the two apart -
    which matters here, because this fixture has BOTH marked. The printed form does not allow
    that; the fixture generator filled every checkbox. Anchoring on "Yes" answers the question
    the field actually asks either way.
  - Boxes 2b/2c/2d need the half-label-height overhang slack: "Honda" starts 0.0144in left of
    "2c Make" and "Accord" 0.0143in left of "2d Model". Without it the make and model shift one
    cell left and the model is lost. Third form to need that rule, after 5498-SA and 5498-ESA.

Also noted while reading the glyphs: attributeRowCells skips "" and "$" and anything starting
":" in text mode, but NOT a bare ".". This form prints long dot leaders (". . . . . .") on boxes
6a, 6c and 7. They do not reach a stored field here - every one of those rows is a checkbox with
a null field, or the dots sit above the cell top - but a text box with dot leaders in its band
would collect them.

MEASURED, NOT ASSUMED. The eighteen other cell-reading forms re-verified byte-identical on both
renders. Unit suite 2,799 / 0 (15 new).

Open, in priority order: **1042-s, the last form with no config entry**; **audit the configs that
DO exist for invented field names** - five instances, every one found by an upload; a sweep for
UI-bound statement fields with no backend column; the dot-leader gap in attributeRowCells' text
mode; unify the three name/address compose copies; the four render differences from 2026-10-03;
the 1099-SA phone grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on `w-2-as.pdf` and
`w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and mapping an Azure 429 to 503 rather than
a bare 500.

## 2026-10-04 - Form 1098 needs TWO label-derived divides, so it is read twice

No field-mappings entry. **0 -> 21 fields, identical on both renders, every one matching the
fixture's AcroForm**, first pass. Two of the original eight remain: 1042-s and 1098-c.

The hardest form in this sweep to BOUND. Three columns of content - the lender/borrower block
and boxes 9-10 on the LEFT, boxes 1-8 in the middle, a Copy B prose stub down the right - and
box 11 printed INSIDE that prose column, at the bottom of it.

★ NEITHER DIVIDE CAN BE A PAGE FRACTION. The window between the rightmost box value and the
leftmost prose line does not overlap between the two renders:

    PDF   values end 6.8764in   prose starts 6.9051in   ->  (0.8090, 0.8124]
    PNG   values end 1134px     prose starts 1152px     ->  (0.8265, 0.8397]

That is the 2026-10-04 page-fraction lesson in its sharpest form: not a tight margin, an EMPTY
intersection. No single number exists.

readCellLayout already derives a divide from labels - column 0's leftmost, less 2% of the width -
but exactly ONE per layout, and this form needs two (left|box and box|prose). So it is read in
TWO PASSES, each putting the content that should bound the other in its column 0 with a null
field, so that column stores nothing and exists only to place the divide. Box 11 states a right
edge of its own to opt OUT of the prose divide rather than be cut by it; its left edge still
comes from its own label.

Calling readCellLayout twice for one form is new. It is also the natural reading of what that
function does: one pass is one divide, so a form with two column boundaries is two passes.

★ AND A GUESS OF MINE THAT THE MUTATION CORRECTED - THE FOURTH THIS WEEK.

I wrote that the prose divide was needed because the stub is full of NUMERALS - "boxes 1 through
9 and 11", "the refund of interest (box 4)", "boxes 1 and 6" - so numericOnly could not filter
it, and the "9" of "through 9 and 11 is" would win box 2's amount cell because its line sits
higher.

It does not. Removing the divide leaves EVERY AMOUNT UNCHANGED on both renders, because each box
value is printed to the LEFT of the prose on the same OCR line, and "first number in the cell"
reads left to right along a line before moving down. I reasoned about vertical order and the
rule is horizontal within a line.

What the divide actually protects is the three TEXT boxes - boxes 3 and 11 are dates, box 8 is a
free description - where there is no "first number" rule to fall back on and a cell concatenates
every word in its band:

    box 3   "The information in boxes 1 05/01/2020 through 9 and 11 is"
    box 8   five prose lines, plus box 11's own label AND value, around the real answer

The comment and the test javadoc now say that. The amount case is kept as a test rather than
deleted, labelled as the thing I got wrong, because "the prose cannot reach an amount cell" is
worth knowing and worth having pinned.

MEASURED, NOT ASSUMED. The seventeen other cell-reading forms re-verified byte-identical on both
renders. Unit suite 2,784 / 0 (18 new).

FOUR PROSE CORRECTIONS IN A WEEK, all from the same move - mutate the rule, then read the result
against the EXPLANATION rather than only the assertions. It has now caught: a "one copy" claim
that was three copies; per-cell cell tops that were not load-bearing; a checkbox entry that was
not what set its field; and this. The pattern is stable enough that mutating is no longer a check
on the tests but a check on what I believe about the code.

Open, in priority order: **the two remaining forms with no config entry** (1042-s, 1098-c);
**audit the configs that DO exist for invented field names** - five instances, every one found by
an upload; a sweep for UI-bound statement fields with no backend column; unify the three
name/address compose copies; the four render differences from 2026-10-03; the 1099-SA phone
grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`;
`1099-g.png`'s duplicated phone fragment; and mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 3922, and three bounds a form can need that a label cannot give

Form 3921's ESPP sibling, no field-mappings entry, so every upload extracted nothing. **0 -> 17
fields, identical on both renders, every one matching the fixture's AcroForm.** Three of the
original eight remain: 1042-s, 1098, 1098-c.

Easier than 3921 in one way - the component models the employee name as ONE field, so no split.
Three things are its own:

★ BOXES 3 AND 4 PRINT THE SAME LABEL TEXT. Both read "Fair market value per share". They are
told apart only by their box number and by their second lines:

    3 Fair market value per share     4 Fair market value per share
      on grant date                     on exercise date

and those second lines are also what bound their cells, so the one fact distinguishes them twice.
A test asserts each regex matches its own label and NOT the other, because a form where two
labels differ by a single character is where an anchored-prefix scheme is most likely to be
quietly wrong.

★ BOX 7 NEEDED TWO BOUNDS, AND THE SECOND ONE I GOT WRONG FIRST. It is a DATE, so it reads as
text, and the prose Copy B stub beside it cannot be filtered by numericOnly the way an amount
box filters it for free. So it states a right edge - 0.75 of the width, inside a real gap on
both renders (PDF 5.7876 -> 6.9624in, PNG 1115 -> 1366px).

That was not enough. A column with ONE row has no next row, so its band runs to the footer, and
box 8's own two label lines sit inside this column's edges. The first run returned

    09/15/2026 8 Exercise price per share determined as if the option exercised on the date
    shown in box 1

Box 8 is now named below it with a null field - the same "a row that stores nothing can still be
load-bearing" move as Form 5498-SA's telephone and Form 5498-QA's box 5. Third time; it is a
pattern now rather than a trick.

★ THE PNG READS A VERTICAL RULE AS A "|". The corporation's label comes back as
"|CORPORATION'S name, street address, ..." on the PNG and without the pipe on the PDF, so that
one regex is deliberately NOT anchored. Anchored it would miss on the PNG only - a render
DISAGREEMENT, which is the failure that looks like success on either render taken alone. This is
the same hazard as Form 1098-Q, where both renders merged "ISSUER'S TIN" into the label line; the
difference is that there it happened on BOTH renders and here on one.

MEASURED, NOT ASSUMED. The sixteen other cell-reading forms re-verified byte-identical. Unit
suite 2,766 / 0 (13 new).

AND A PREDICTION OF MINE THAT WAS WRONG. I wrote a test asserting that without its right edge
box 7 would pick up only "Service." - reasoning that "the Internal Revenue" sat above the cell
top. It does not: its centre is 2.4707 against a cell top of 2.4635, a hundredth of an inch
INSIDE the band, so both stub lines bleed in. The test now carries the measured value and a note
that I had expected otherwise. A hundredth of an inch is exactly the margin at which reasoning
from a glance at the numbers stops working, which is the same lesson as the row-pitch cap and
the cell-overhang slack.

Open, in priority order: **the three remaining forms with no config entry** (1042-s, 1098,
1098-c); **audit the configs that DO exist for invented field names** - five instances, every one
found by an upload; a sweep for UI-bound statement fields with no backend column; unify the three
name/address compose copies; the four render differences from 2026-10-03; the 1099-SA phone
grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`;
`1099-g.png`'s duplicated phone fragment; and mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 3921 box 6: the TIN was right and unlabelled, which made it wrong on screen

Reported: the TIN in box 6 should say it is a TIN, as the uploaded statement does. It should.
The form prints

    Bright Star Holdings LLC, 3 Depot St, Austin, TX
    78702, TIN 335577991

and the replica joined box 6's four model fields with newlines, so the screen showed
"335577991" on a line of its own among the address lines, with nothing saying what it was. It
now reads "TIN 335577991". The model keeps the bare identifier - that is what the field is for -
and the read-back strips the label again.

★ THE SAME FACT CUTS BOTH WAYS. Yesterday I declined to split street and city out of box 6,
because the form gives no delimiter for them and a wrong split is worse than an unsplit value.
But it DOES delimit the TIN, in its own printed text, which is exactly why extracting the TIN
separately was defensible. The same fact then says the TIN must be DISPLAYED labelled: a value
is only self-explanatory on screen if the thing that made it separable is still visible. I took
half the consequence of that and left the other half.

★ AND THE LABEL FIXED A ROUND-TRIP BUG IN THE SAME FOUR LINES. The write drops empty fields
with filter(Boolean) while the read-back was POSITIONAL:

    write   [name, TIN, street, csz].filter(Boolean).join("\n")
    read    name = line 0;  TIN = line 1;  street = line 2;  csz = line 3

So every line after a blank one shifted. With no corporation name the TIN was read back AS the
name - and no name is the NORMAL case here, because extraction leaves street and city/state/zip
unsplit on purpose. A labelled line can be found instead of counted to, so the TIN is now
located by its own label and the remaining lines fill name/street/zip in order. The test
requires "TIN" followed by an identifier, so a corporation actually named "TIN Holdings" is not
mistaken for it.

Two writers disagreeing about a shared encoding - one dropping empties, the other counting
positions - is the same class of defect as the compose copies and the two numeric paths that
disagreed about "(500)". Neither side is wrong on its own; they were never read together.

The form view is unaffected - it has four separately labelled inputs for box 6 and already said
"Corporation TIN (Box 6)". The backend is unchanged. Build green.

## 2026-10-04 - Form 3921 merged two boxes into one money field, and why that was invisible

Fifth form in this sweep with invented config key names, and the worst-behaved of them. Box 4
arrived holding BOTH boxes:

    exercisePricePerShareAmount     (absent)
    fairMarketValuePerShareAmount   "9401\n$ 9402"     PNG
    fairMarketValuePerShareAmount   "9401\n$\n9402"      PDF

Box 3 gone, both numbers in one field, and the two renders disagreeing on the spacing inside it -
so each looked complete on its own while saying something different. Six fields of fifteen came
through. **6 -> 16, identical on both renders, every one of the 14 AcroForm values accounted for**
(the employee name splits into first/last, box 6 into name and TIN).

The config entry is now just the corrected flag. The layout overwrites the bad values anyway -
readRows uses put, not putIfAbsent - but leaving seven key names that match the wrong pairs is a
trap for whoever reads the entry next and believes it.

★ THE COPY B STUB IS PROSE, AND THAT IS THE WHOLE DIFFICULTY. On every form so far the
instruction column was filtered out for nothing by numericOnly, because the boxes beside it hold
amounts. Here boxes 1 and 2 hold DATES. Each names the stub label beside it as a second,
null-field cell - "OMB No" for box 1, "(Rev. April" for box 2 - so the stub lands in a cell that
stores nothing. Box 6 is the only row on the form that states a right edge, because it is free
text with nothing to its right to anchor on, and 0.81 of the width falls in a real gap on both
renders (PDF 6.7045 -> 7.0292in, PNG 1304 -> 1368px).

Box 6 prints ONE box for the corporation's "name, address, and TIN" while the component models
four fields. Only the TIN is delimited by the form itself, in its own printed text, so that much
is split off and the rest left whole. Street and city/state/zip are NOT guessed out of the
remainder: the form gives no delimiter for them, and a wrong split is worse than an unsplit
value. Same reasoning as leaving a field alone rather than inventing its parts.

★ AND THE REASON A WRONG VALUE WAS VISIBLE AT ALL: coerceValue RETURNED THE TEXT.

    if (isAmountAppKey(appKey)) {
        try { return Double.parseDouble(cleaned); }
        catch (NumberFormatException ignored) { /* fall through to string return */ }
    }
    return trimmed;

An *Amount key is a declaration that the field is a number. Falling through to the raw string
looks harmless and is not: PayloadCoercion.decimal drops a non-numeric string at save time, so
the value can NEVER persist - but it is returned in the extract response, and the screen renders
it into a money input. That is the entire mechanism by which a config error became two boxes of
text displayed in box 4. The value was unsavable and unexplainable, and shown anyway.

It is now declined and logged. A parenthesised figure is also read as the negative these forms
print it as - which the numericOnly cell path already did and this one did not, so the two paths
disagreed about what "(500)" means. Measured across 30 forms x both renders: byte-identical
everywhere, so the change only touches the case that was producing garbage. An empty box is
honest where that was not.

MEASURED, NOT ASSUMED. All fifteen other cell-reading forms re-verified byte-identical. Unit
suite 2,753 / 0 (14 new).

ON THE REPORT ITSELF. The last two uploads came in with the same wording - "the ocr process does
not correctly extract the values now the application shows the values correctly". On Form 1098-Q
everything measured clean, including a re-derivation of the month-to-day pairing from the
AcroForm RECTANGLES rather than from field-name order, which is what my first check had used and
would have made it circular. So I asked rather than guess. Here the same sentence was a real
defect. Default: treat it as a bug report and measure - that is what found this one.

Open, in priority order: **the four remaining forms with no config entry** (3922, 1042-s,
1098, 1098-c - note 3921 HAD an entry, which is why it failed differently rather than
extracting nothing; I briefly wrote "three" here by conflating the two facts, and the
detector says four); **audit the configs that DO
exist for invented field names** - five instances now, every one found by an upload; a sweep for
UI-bound statement fields with no backend column; unify the three name/address compose copies;
the four render differences from 2026-10-03; the 1099-SA phone grouping; W-2 box-12 amounts and
box 14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone
fragment; and mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 1098-Q boxes 5a-5l: I checked the wrong half of the form for the field

Reported as the dd sub-boxes of boxes 5a-5l showing nothing. Yesterday I wrote that "the
component models only the premium, so the day is left unread" and that "no field was added".
The first half of that was false.

★ THE FIELD EXISTED; I LOOKED ONLY AT THE BACKEND. The screen has had all twelve day inputs
since the form was built:

    form-1098-q.component.ts   renders box5a_day .. box5l_day
    the component model        carries januaryDay .. decemberDay
    syncFormToPdf / syncPdfToForm   move them in BOTH directions

I grepped `Form1098QMapper.java`, found no day fields, and concluded the FORM did not model
them. The mapper is one of four layers, and it was the only one I looked at. "The model has no
field for it" is a claim about a specific file, and I stated it as a claim about the form.

So nothing was added to a statement form here - the boxes are printed by the IRS, rendered by the
UI and already named by the UI model. What was missing was the three BACKEND layers that drop
them: V267 adds twelve columns to se_form_1098_q, the entity and mapper carry them, the cell
reader takes them. **30 fields -> 42, identical on both renders, every day matching the AcroForm.**

★ AND IT WAS NOT ONLY AN EXTRACTION BUG. A day TYPED by a user was accepted by the form,
posted to the API and silently discarded - gone on reload. That had nothing to do with OCR and
has been true since the form shipped. The upload is what surfaced it. A UI-bound field with no
backend column is the same silent-drop shape as the rest of this file, from the other end: the
screen accepts the value, nothing errors, the value is gone.

varchar(2) and PayloadCoercion.string, not a number. The fixture's days include 05, 08, 03 and
07, and the UI input is type="text" maxlength="2" - a numeric type would silently drop the
leading zero on a third of them.

★ A CELL CAN NOW HOLD TWO NUMBERS, where a row asks for it. CellRow gains an optional
secondFields and attributeRowCells an overload that collects the second number per cell; passing
null is what every other form does. The premium comes first because it is printed to the LEFT of
the day and the reader takes values in printed order - a test reverses the two glyphs to show the
day would win if the form printed it first, so this rests on the form's order and not on a
tie-break. All fourteen other cell-reading forms re-verified byte-identical, which is what makes
the change additive rather than merely intended to be. Unit suite 2,739 / 0.

TWO SELF-INFLICTED DETOURS, both worth the note:

    the migration said se_1098_q      taken from the entity CLASS name Se1098Q rather than its
                                      @Table annotation, which says se_form_1098_q. Liquibase
                                      failed the whole startup - the GOOD case, because a wrong
                                      table name cannot fail quietly. Read @Table, not the class.
    TaskStop left the JVM running     stopping run-dev.ps1 by its task id killed the PowerShell
                                      wrapper and orphaned the Quarkus JVM, which kept port 8080
                                      and its Dev Services container. The next start failed on a
                                      bound port; both had to be cleared by hand. A dev server
                                      that "failed to start" still serves its error page on 8080,
                                      so the port being busy is not evidence the app is up.

Open, in priority order: **the four remaining forms with no config entry** (1098, 1098-c, 3922,
1042-s); the audit of the configs that DO exist for invented field names; **a sweep for the shape
this entry found - UI-bound statement fields with no backend column**, which the pdfRaw detector
does not catch because the UI side is complete; unify the three name/address compose copies; the
four render differences from 2026-10-03; the 1099-SA phone grouping; W-2 box-12 amounts and box
14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone fragment;
and mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 1098-Q, and a mutation that edited the wrong form

**0 fields -> 30, identical on both renders, every one matching the fixture's AcroForm.** Four of
the eight catalog forms with no config entry remain: 1098, 1098-c, 3922, 1042-s.

STATEMENT CAPTURE ONLY, AND THE SCOPE NOTE STANDS. Form 1098-Q is an issuer-filed information
return with no line on Form 1040 - that is still true and nothing here changes it. But it sits in
the statement catalog, so an upload of it should record what the participant received. I had
flagged this as needing a decision rather than a layout; the upload was the decision. Worth
separating the two questions in future: "does this form produce a return line" and "should an
upload of it extract" have different answers, and the out-of-scope note only ever answered the
first. Same shape as an out-of-scope blocker outliving its own feature (see the §962 note of
2026-09), one category up: there the flag outlived the compute, here the scope note was read
as answering a question it never addressed.

★ EACH MONTHLY CELL HOLDS TWO NUMBERS. Boxes 5a-5l print a premium AND the day of the month it
was paid, side by side in one cell:

    5a January     $        9304   05        premium x 4.8135, day x 5.2289
    5b February    $        9306   08        premium x 6.2126, day x 6.6233

The component models only the premium, so the day is left unread and no field was added. What
makes that safe is position rather than luck: the premium is printed to the LEFT of the day, and
"first amount in the cell wins" reads left to right along the line. A test reverses the two
glyphs to show the day would win if the form printed it first - the layout depends on the form's
order, and says so.

★ TWO RENDER-SPECIFIC DETAILS, AND A DISAGREEMENT IS WORSE THAN A BLANK. Both were confirmed
load-bearing by mutating them against the live extraction, and each one removed makes the PNG
DISAGREE with the PDF rather than simply blank a field - which is the worse failure, because each
render then looks complete on its own.

    box 5l         the PNG reads its label as "51 December". Anchored on "5l" alone the row does
                   not resolve there and December is lost on that render only. Form 1097-BTC's
                   box 5l already carried this alternation for the same reason - the comment now
                   credits it instead of presenting it as new.
    ISSUER'S TIN   has NO label of its own: both renders merge the issuer box's first label line
                   with it into one OCR line. So it comes from the key-value pass - and on the
                   PNG that pair reads "998877665 Hartford," because the issuer city bleeds in
                   from the box to its left, so only the leading identifier is kept.

Box 2's checkbox entry names the second line of its label, where the mark is printed. Mutation
shows that is NOT what sets the field - Azure also reports it as a ":selected:" pair, as on
Form 5498-QA - and the comment says so rather than claiming otherwise. Fourth time this week.

★ THE MUTATION EDITED THE WRONG FORM, AND REPORTED "NO CHANGE".

My first run of the box-5l mutation replaced Form 1097-BTC's identical row, because the search
string

    new CellRow(new String[] { "^5k November", "^5[l1] December" },

appears TWICE in the file and the patch asserted only that it was present, not that it was
unique. The run came back "no change" on both renders, and the conclusion that followed - that
the alternation does nothing - was the exact opposite of the truth. I caught it only because the
result contradicted the line text I had measured ten minutes earlier.

The lesson is narrow and mechanical: every patch and mutation script in this sweep asserts
`X in s`. That is the wrong assertion. It must be `s.count(X) == 1`, or the edit must be anchored
on something unique to the form - the surrounding field names work. A mutation that silently
edits a different form does not fail; it produces a clean, plausible "no change" and invites
precisely the wrong conclusion. Which is the same failure mode as every other entry in this file.

MEASURED, NOT ASSUMED. The fourteen other cell-reading forms re-verified byte-identical on both
renders. Unit suite 2,735 / 0 (11 new).

Open, in priority order: **the four remaining forms with no config entry** (1098, 1098-c, 3922,
1042-s); the audit of the configs that DO exist for invented field names; unify the three
name/address compose copies; the four render differences from 2026-10-03; the 1099-SA phone
grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`;
`1099-g.png`'s duplicated phone fragment; and mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 5498-QA, and the third prose correction in three days

Third and last of the 5498 siblings with no field-mappings entry. **0 fields -> 28, identical on
both renders, every one matching the fixture's AcroForm**, first pass. Five of the eight are
left: 1098, 1098-c, 1098-q, 3922, 1042-s - and those are real layouts rather than siblings.

The left region is Form 5498-ESA's exactly, ISSUER for TRUSTEE, carried across unchanged. The
right is eight boxes rather than two, two to a row from box 3 down; box 5 is a checkbox whose
label runs to four lines and box 7 holds a code rather than an amount.

★ TWO OF MY OWN COMMENTS WERE WRONG, AND MUTATION CAUGHT BOTH.

The checkbox entry names box 5's LAST label line, because its mark is printed 0.33in below the
first - more than the single line height readSelectionMarks allows:

    the mark's vertical centre        2.2315in
    "5 If checked, account" centre    1.9050in   (height 0.1051)   0.3266in away
    "on this form" centre             2.2416in   (height 0.1003)   0.0100in away

I wrote that without the third element the box reads as unchecked. It does not. Azure ALSO
reports box 5 as a ":selected:" key-value pair keyed "5 If checked...", and readCheckboxes
matches that on the label prefix - a second, independent source I had forgotten was there.
Dropping the third element left all 28 fields unchanged on both renders.

The second: box 5's four-line label extent does not change the output either, because its cell
carries a null field and anything read into a null-field cell is discarded.

Both entries stay. They describe the form correctly, they make the GEOMETRIC path right rather
than accidentally absent, and the selection marks are the more dependable of the two sources.
But they are redundancy, not rescue, and the comments and the test javadoc now say so.

★ THREE DAYS, THREE PROSE CORRECTIONS, ALL FROM THE SAME MOVE.

    10-04  composeNameAddress said these twelve lines were reduced to "one copy"    there were 3
    10-04  a test javadoc credited PER-CELL cell tops for a two-line label block    collapsing
                                                                                   them changed
                                                                                   nothing
    10-04  a comment said a checkbox entry was what set the field                   a kv pair was

Each was written in good faith, each read as fact afterwards, and each named a mechanism that was
not the one doing the work. The move that caught all three is the same: mutate the rule, then
read the result against the EXPLANATION and not just the assertions. A test that still passes is
telling you something about your comment. I now do this deliberately rather than as a by-product
of checking the tests.

MEASURED, NOT ASSUMED. The thirteen other cell-reading forms re-verified byte-identical on both
renders. Unit suite 2,724 / 0 (11 new).

Open, in priority order: **the five remaining forms with no config entry** (1098 and 1098-c next;
1098-q still needs a scope call, since it is recorded out of scope for the return yet sits in the
statement catalog); the audit of the configs that DO exist for invented field names; unify the
three name/address compose copies; the four render differences from 2026-10-03; the 1099-SA phone
grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`;
`1099-g.png`'s duplicated phone fragment; and mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 5498-ESA, the second of the eight, and a test that credited the wrong rule

Same cause as its sibling: no `5498-esa` key in field-mappings.json, so every upload extracted
nothing. **0 fields -> 22, identical on both renders, every one matching the fixture's AcroForm**,
first pass. Six of the eight are left: 5498-qa, 1098, 1098-c, 1098-q, 3922, 1042-s.

The frame is 5498-SA's and most of it carried straight across - two numbered boxes instead of
six, no telephone (so neither the SideRow nor the null-field boundary row that form needed), and
the year printed level with box 2 rather than box 1. The left region is again bounded by where
the box labels begin rather than by a page fraction, which mattered again: this pair is cropped
differently too, the PDF a full page and the PNG tight to the form.

Its own wrinkle is the trustee block, which splits its four address labels across two printed
lines while all four values sit on one line below both:

    City/town                                    ZIP/foreign code      y 1.1888
                        State/province  Country                        y 1.1840 / 1.1888
    Eugene                 OR           US            97401            y 1.3464

The second label line falls inside the row's band and is kept out by the cell tops.

★ A SECOND FORM CONFIRMS YESTERDAY'S SLACK. The half-label-height overhang rule was written
for 5498-SA. This form needs it independently - "US" starts 0.0286in left of "Country", "Oregon"
0.0191in left of "State/province", "USA" 0.0143in left of "Country" - so it is a property of how
these forms print their boxes, not of the one fixture it was derived from. That is the first time
in this sweep a rule has been confirmed by a form other than the one that forced it.

★ AND A TEST OF MINE CREDITED A RULE IT DID NOT EXERCISE. My first draft of the test javadoc
said the two label lines worked because cell tops are measured PER CELL. I mutated the tops to a
single shared one for the whole row: all eight tests still passed. The claim was not established
by anything I had written, and the real reason is simpler - both label lines sit above the tops,
per-cell or not. (Forms 1097-BTC and 5498 do need per-cell tops. This one does not.)

The mutation was run to check the tests, and it caught the PROSE instead. Same shape as the
compose-consolidation note two entries ago: an explanation written in good faith, carried as
fact, describing a mechanism that is not the one doing the work. A comment is not checkable, so
the only way it stays true is if something fails when it stops being true - which is exactly
what mutating a rule tests. Worth doing for the explanation and not just the assertion.

MEASURED, NOT ASSUMED. The other twelve cell-reading forms re-verified byte-identical on both
renders. Unit suite 2,713 / 0 (8 new); mutating the overhang slack to zero fails 6 of the 8.

Open, in priority order: **the six remaining forms with no config entry** (5498-qa next, the last
close sibling; 1098-q still needs a scope call); the audit of the configs that DO exist for
invented field names; unify the three name/address compose copies; the four render differences
from 2026-10-03; the 1099-SA phone grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on
`w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and mapping an Azure 429
to 503 rather than a bare 500.

## 2026-10-04 - Form 5498-SA had no config entry, and SEVEN more still do not

Every upload of this form extracted nothing, because `5498-sa` was simply absent from
field-mappings.json. This time I checked the whole catalog instead of the one form reported:
**eight** of the 56 catalog forms have no entry at all.

    5498-sa                       fixed here
    5498-esa, 5498-qa             close siblings of it
    1098, 1098-c, 3922, 1042-s    separate layouts
    1098-q                        no entry, and recorded OUT OF SCOPE as a return attachment -
                                  but it is still listed in the statement catalog, so whether an
                                  upload of it should extract is a decision, not an oversight

The answer key came first: the fixture PDF's own AcroForm (`topmostSubform[0].CopyB[0]`) carries
all 29 values, so the target was known before a single line of layout was written. That is the
third form where building the key first turned a day into an hour.

Boxes 1-6 on the right, trustee and participant blocks on the left. Box 6 is a checkbox strip
and bounds boxes 4 and 5 above it; the calendar year is printed in the OMB block beside box 1,
as on Form 1097-BTC. **0 fields -> 29, identical on both renders, every one matching the key.**

★ NO ABSOLUTE X FRACTION SURVIVES THIS FORM. The PNG fixture is cropped tight around the form
while the PDF is a full 8.5x11 page, so the same content sits about half an inch apart in page
coordinates:

    TRUSTEE'S name   PDF x0 0.7449in    PNG x0 0.2147in (scaled to the same width)

Every earlier form happened to render both ways from the same crop, so page fractions worked and
I had been using them freely - RRB-1099's header SideRow still does. Here the left region states
no right edge at all and is bounded by where the BOX LABELS begin, which readCellLayout derives
from the labels themselves. Nothing in this layout is a page measurement.

★ A CELL VALUE MAY START LEFT OF ITS OWN LABEL. The rule was "a value belongs to the rightmost
label whose left edge is at or left of the value's left edge". The printed boxes inset their
contents slightly, so:

    trustee     WA   starts 0.019in LEFT of "State/province"
    participant ID   starts 0.029in LEFT of "State/province"

and both rows shifted one cell left - `trusteeCity="Spokane WA"`, `trusteeStateProvince="US"`,
the country landing under the state and the ZIP under the country. A complete, plausible address
block, wrong in every cell but the first.

Each label now allows half its own height of overhang. Half a label height is what readSideRows
already allows VERTICALLY, so the constant is not new, and it is far inside the 0.50in gap
between the cells it applies to. Being a fraction of the LABEL rather than of the page, it holds
on both renders - which is the whole reason it works here.

MEASURED, NOT ASSUMED - AND THIS ONE WAS A SHARED RULE. The slack changes cell attribution on
every form that reads by position, so I measured all eleven of them with the slack at zero and
then at a half: Form 2439, the three K-1s, 1099-SB, 1099-LS, 1097-BTC, 5498, RRB-1099, RRB-1099-R
and SSA-1099 are byte-identical either way, on both renders. 5498-SA is the only form it moves,
and it moves it from wrong to right. Unit suite 2,705 / 0 (9 new); 7 of the 9 fail with the slack
removed and the 2 that do not are the pure config-shape assertions.

Also worth keeping: the telephone is printed BESIDE its label rather than under it, so it is a
SideRow - but it ALSO needs a null-field cell row, because readRows bounds a row at the next
CELL row only. Without it the trustee address row ran on over the telephone line and took it in
("Spokane Telephone number:", "WA +1 509"). A row that stores nothing can still be load-bearing.

Open, in priority order: **the seven remaining forms with no config entry** (5498-esa and 5498-qa
first, as siblings of this one; 1098-q needs a scope decision); then the audit of the configs
that DO exist for invented field names; unify the three name/address compose copies; the four
render differences from 2026-10-03; the 1099-SA phone grouping; W-2 box-12 amounts and box 14b;
`employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and
mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 1099-SA printed the trustee name twice, and "one copy" was three

Reported as the TRUSTEE'S/PAYER'S name repeating its first name. The extraction was right; the
composition was not. Azure split the party box MID-NAME on the PDF render:

    Payer.Name        "Alex Manning,"
    Payer.Address     "Alex\n4 Oxford Street, London, ON, Canada, 12345, +1"
    Payer.PhoneNumber "416 234 1234"

The address's first line IS the name's first word, and the existing guard only fires when the
address repeats the WHOLE name - so the composed box printed the name and then "Alex" again
underneath. The PNG render of the same fixture splits the box cleanly, which is why it showed on
one render only. (It also splits the PHONE differently on each render; that part was already
being repaired.)

`dropNameFragmentLine` drops a first line whose TOKENS are a leading prefix of the name's tokens.
The negative cases are the design, not the padding:

    "Oxford Trust" vs "Oxford Street 4\nLondon, ON"  kept - "oxford street 4" is not
                                                        a prefix of the name, only a shared word
    "Alex Manning" vs "A\n4 Oxford Street"           kept - a bare initial matches far too easily
    a single-line address                               never touched, so this cannot empty one
    the WHOLE name as the first line                    left to nameAlreadyInAddress

★ AND THE CONSOLIDATION I DOCUMENTED NEVER HAPPENED. `composeNameAddress` carries a note
saying these twelve lines "had been written out once per form" and were reduced to "one copy, so
the next form to need this cannot inherit the bug again." That was true of 1099-A, 1099-C and
1099-CAP. It missed `postProcessParties` - which serves 1099-DIV/G/INT/MISC/NEC/OID/PTR/Q/QA/R/SA
plus 1099-K, 1099-S and 1099-LTC under their own party prefixes - and `postProcess1099B`. Three
copies, each with its own call to the same guard, and the form that broke went through the copy
the note did not cover.

A comment claiming a refactor is not the refactor. The guard went into all three rather than the
one this form takes, because the other two are one fixture away from the same report. Unifying
them is now an open item: `postProcessParties` also does `reassembleSplitPhone` and a
trailing-comma strip that `composeNameAddress` does not, so merging them changes behaviour for
1099-A/C/CAP and needs its own before/after.

MEASURED, NOT ASSUMED. Baselined all 18 affected forms x both renders on the committed code, then
re-measured with the fix: exactly ONE difference, the stray line on 1099-SA's PDF. Unit suite
2,696 / 0 (13 new) - and with the guard neutralised the six positive tests fail while the seven
negative ones correctly do not, which is what makes them worth having.

Not changed, and not reported: 1099-SA's phone grouping still differs between renders (PNG
"+1 416 234 1234", PDF Azure's normalised "+14162341234"). The digits are right on both. Fixing
it touches phone handling on every form, so it waits for its own baseline.

Open, in priority order: **audit the remaining tax-model and key-value configs for invented field
names**; unify the three name/address compose copies; the four render differences from 2026-10-03;
the 1099-SA phone grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on `w-2-as.pdf` and
`w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and mapping an Azure 429 to 503 rather than
a bare 500.

## 2026-10-03 - RRB-1099-R box 10 was blank, and the OCR was not at fault

Reported as "OCR fails to read box 10 for rrb-1099-r". It does not: the extraction returns
`medicarePremiumsTotalAmount` = 1764.60 on both renders, and has since this morning's fix. The
value was lost on the way to the screen.

`form-rrb-1099-r.component.ts` contains TWO replicas of the form. The visible one labels box 10
"Medicare Premium Total" and binds `pdfRaw['box10']`. The other - hidden behind `*ngIf="false"`,
an older revision of the form - labels box 10 "Rate of Tax" and puts the Medicare total in box 12.
`syncFormToPdf` wrote `r['box12']` and `syncPdfToForm` read it back, so the one key the screen
actually renders was never written by anything. Both are written now, and the read-back prefers
whichever the visible replica filled, so re-enabling the retired layout still works.

★ A SECOND SILENT-DROP SHAPE, AND THE SWEEP THAT ALMOST MISSED IT. The first shape was a
config naming fields Azure does not produce (four forms). This one is a rendered binding that no
sync writes: the extraction is right, the model is right, and the box is empty. Nothing fails.

I wrote a detector for it - pdfRaw keys the template renders that the component never writes -
and the first three versions each reported "clean" across every component:

    v1  guessed the hidden replica's extent by indentation, and swallowed the visible one
    v2  tracked tag depth properly, but ended the template at the first "syncFormToPdf",
        which the template itself calls as an event handler on line 44 - so it read 44 lines
    v3  scanned the body for quoted strings; an apostrophe mis-pairs the quotes, and `r` was
        rebound by the loop above it, so the body window started in the wrong place

Each "clean" was a green light from a detector looking at almost nothing. What caught all three
was running it against the PRE-FIX file as a control, where the answer was known: it must report
box10 and nothing else. It now does.

Result across the statement components: box 10 here was the only instance where the model already
held the value. The other 41 hits are a different thing - 1099-MISC boxes 13a/13b/14 and the
split payer address have no model field at all (adding one needs sign-off), the W-2G signature
boxes are out of scope by the self-filing rule, and the W-2 box-12 code/amount pairs were already
on the open list.

Open, in priority order: **audit the remaining tax-model and key-value configs for invented field
names**; the four render differences from the previous entry; W-2 box-12 amounts and box 14b;
`employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and
mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-03 - Form RRB-1099-R, and a claim of mine that was not true

Twelfth form in the statements sweep, and the FOURTH with invented key names in its config:
`EmployeeContributions`, `ContributoryAmountPaid`, `VestedDualBenefit` and six more. Nine of them
happened to match nine of the ten printed boxes, so box 8 (repayments for prior or unknown years),
the tax year and both header checkboxes had no source at all.

The form is the same frame as RRB-1099 down to the header strip - two cells on the first row,
three on each of the two middle rows, two on the last - so it reuses that form's header SideRow
and checkbox list and only needed its own grid. **9 fields -> 13, identical on both renders**, and
13 is every value the page prints. The component also models a payer id, a recipient name and
address, a rate of tax and a country; this form prints none of them, and they stay empty.

★ THE PREVIOUS ENTRY'S VERIFICATION CLAIM WAS FALSE. Yesterday I wrote that the three K-1s,
2439, SSA-1099, 1099-SB, 1099-LS, 1097-BTC, 5498, 1099-DA, 1099-A and 1099-C were all
"byte-identical". Four of them are not, and never were:

    schedule-k1-1065    part3Line11Amount          png 375    pdf 37
    schedule-k1-1120s   part3Line10Row5Amount      png 715    pdf 71
    1099-a              lenderNameAddress          a newline where the PDF has a space
    1099-da             ten fields                 png 58, pdf 48; the PDF's filer phone,
                                                   country and zip are interleaved, two state
                                                   rows collapse into one, three checkboxes and
                                                   box 12a's three unit counts are lost

The first two are a digit dropped off the END of a value - the kind of defect that leaves a
plausible number in place, which is why it survived. I confirmed all four exist on the committed
code as well, by stashing this change and re-measuring, so none of them is a regression from this
work; they are open defects that my own summary had declared absent.

The cause was the measurement, not the forms. I compared the two renders by piping the extractor's
aligned text listing through `sed` and `sort`. Values containing a NEWLINE - 1099-A's lender
address, 1099-DA's scrambled PDF fields - break one record into two lines, and the comparison
silently read the continuation as a separate field. A later attempt to repair the parser made it
over-count instead (18 fields became 20 lines). The format was never the right thing to diff: the
extractor now writes one JSON line per field under `JSON_OUT`, which survives any value, and every
number in this entry comes from that.

★ AND THE PITCH RULE WAS LOAD-BEARING FOR BOTH RRB FORMS. Yesterday's note said the
four-label-height cap put RRB-1099's last row 0.01in outside its band. RRB-1099-R's last row is
0.036in outside the same cap - so the rule I changed for one form was already needed by the next,
and the new `GenericFieldMapperRrbCellGeometryTest` pins both from measured fixture coordinates:

                     label top   label h   cap = top + 4h   first value's centre
    RRB-1099           4.3498     0.1689       5.0254            5.0375
    RRB-1099-R         4.3558     0.1629       5.0074            5.0435

Reverting the pitch to the cap fails exactly the two tests that read those rows, and nothing else.

Also, the claim-number tidy shared by both forms (box 1 prints "<claim number> / <payee code>" and
the renders tokenise the slash differently) was written `replaceAll("\s*/\s*", ...)` with ONE
backslash. That compiles - since JEP 378, `\s` in a Java string literal is an escape for a SPACE -
so it worked on the spaces it was given and would have ignored a line break or a tab. It is now
the whitespace class it was meant to be, with a test over both.

MEASURED, NOT ASSUMED. Every one of the 14 forms fixed before this one re-verified byte-identical
to the committed code, field by field, through the JSON comparison. Unit suite 2,683 / 0 failures
(8 new).

Open, in priority order: **audit the remaining tax-model and key-value configs for invented field
names** - FOUR instances now, every one found by a user upload rather than by looking. Then the
four render differences above (1099-DA's PDF is the worst of them), the `w-2.pdf` box-12 amounts
and box 14b, `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`, `1099-g.png`'s duplicated phone
fragment, and mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-03 - Form RRB-1099, and an audit I named and then did not do

Eleventh form in the statements sweep. Seven of eleven boxes came through; boxes 6 to 9 (workers'
compensation offset and the three prior-year SSEB amounts), the tax year and both header
checkboxes had no source at all.

The form is a plain grid — two cells on the first row, three on each of the rest, every value
under its own label — so it is read by position. No stated extents needed; the whole form is one
column. The tax year sits beside its label in the header strip, and CORRECTED and DUPLICATE come
from the selection marks. **7 fields -> 14, identical on both renders.**

★ AND IT IS THE THIRD TIME FOR THE SAME CAUSE. The configured key-value map carried invented key
names — `GrossSSEB`, `NetSSEB`, `MedicarePremiumTotal` — which happened to match seven labels and
missed the rest. Form 5498 had this, Form SSA-1099 had it, and after SSA-1099 I wrote in this file
that the remaining configs were "worth auditing rather than waiting to be told one at a time", and
then told the user it was the highest-value open item. Two forms later it was still open, and they
hit the next instance.

Naming a cheap preventive action and then not doing it is worse than not having spotted it: the
cost was already known and paid for. The audit is now the first thing on the list rather than a
line at the bottom of it.

★ A SHARED RULE, LOOSENED ON EVIDENCE. The last row of a column has nothing below it to stop at,
and falls back to a guess when the page carries no "www.irs.gov/Form..." footer. That fallback
capped the row at four label-heights:

    RRB-1099's bottom row of values sits  0.69in below its labels
    the cap allowed                       0.68in

Outside its own band by a hundredth of an inch. With no footer, the row PITCH is the better
statement of how tall a row is — it comes from the form rather than from a constant — so the cap
is gone. Only a footer-less form reaches that path; every other one is bounded by a label or a
footer, and all of them re-verified byte-identical.

Also: box 1 prints "<claim number> / <payee code>", and the renders tokenise the slash differently
— the PDF reads it alone, the PNG attaches it to the claim number. Spacing around a separator is
not information, so both are normalised to what the form prints.

★ WHAT THE ELEVEN TAUGHT. Each failed the same way at root: a rule inferred from what was in front
of me, which turned out to be a coincidence of it.

    the wrapped-label gap   a threshold, then per column, then per row, then deleted outright once
                            a row could simply NAME its own last label line
    reading order           stable within a render, never between two of them
    column extents          derivable from labels, until a form printed its box numbers to the left
                            of the labels they belong to
    "the tool cannot do it" true of ONE output of the tool; selectionMarks had every checkbox
    field names             taken from the form's vocabulary, not the model's — three times
    a row's height          four label-heights, until a grid row was 0.69in tall

The correction each time was a different KIND of fact — something the form, the fixture or the
tool states outright. Building the answer key first is the same move, and it took the 1120-S from
a day's work to an hour.

MEASURED, NOT ASSUMED. Re-verified live: the three K-1s, Form 2439, SSA-1099, 1099-SB, 1099-LS,
1097-BTC, 5498, 1099-DA, 1099-A and 1099-C all byte-identical. Unit suite 2,675 / 0 failures.

Open, in priority order: **audit the remaining tax-model and key-value configs for invented field
names** — three instances found by accident so far. Then the `w-2.pdf` box-12 amounts and box 14b,
`employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`, `1099-g.png`'s duplicated phone fragment, and
mapping an Azure 429 to 503 rather than a bare 500.
