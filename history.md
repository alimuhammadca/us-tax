## 2026-10-03 - Schedule K-1 (Form 1041), and blaming the data model for my own mis-read

Reported as "the OCR process does not extract values". A different failure from the four forms
before it: `schedule-k1-1041` HAS a config entry, so `supports()` is true and the upload returns
200 — its field map was simply empty, so nothing was ever recognised and the form stayed blank.
Worth separating, because "not supported" and "extracts nothing" have different causes and only
the first was a missing config key.

Reading it by position took two new mechanisms:

**Columns that state their own extent.** The reader had derived the divide between two columns
from the box column's leftmost label. This form has THREE columns — Parts I and II, then Part III
split into boxes 1-10 and boxes 11-14 — and prints its box NUMBERS and box 9's codes to the LEFT
of the labels they belong to, so no divide can come from the labels at all: the fiduciary's
address ran on into the "7 8 9" beside it. Columns now give their extent outright. Columns that
need say nothing keep deriving it, so the four existing forms were untouched.

**A row that is a list.** Boxes 9 and 11-14 print a column of code/amount pairs under one label,
with no label per row. Each printed line gives its first token as the code and its last as the
amount, which needs no measurement.

Also moved the PDF AcroForm reader to the END of `mapToAppModel`. It is a last resort gated on
nothing else having produced a value, but it ran BEFORE the form-specific passes, so a form read
by geometry — whose configured map is deliberately empty — came back full of raw AcroForm names
(`f1_13[0]`) sitting beside the real values.

★ AND THEN I GOT BOXES 11-14 WRONG, AND BLAMED THE FORM FOR IT. I bounded each box by its own
printed label. That gave box 11 five rows and box 12 five against three modelled slots each, and
I reported it as the form printing more rows than the component holds — and asked whether to add
fields to the user's statement form. The user's reply was two sentences: there are no missing
slots; the OCR failed to read boxes 11-14.

They were right. Boxes 11-14 share ONE sub-column and their rows run straight down it:

    f1_30..35   box 11   (860,820) (870,885) (400,880)
    f1_36..41   box 12   (775,740) (715,165) (455,640)
    f1_42..51   box 13   (965,415) (130,555) (435,295) (875,685) (365,830)
    f1_52..67   box 14   (345,615) (595,900) (480,280) (755,795) ... (990,445)

Nineteen rows dealt out **3 / 3 / 5 / 8** — exactly the slots declared. The labels "12 Alternative
minimum tax adjustment", "13 Credits and credit recapture" and "14 Other information" are printed
where they FIT in the column, not beside their box's first row. Bounding by them put 775/740 and
715/165 into box 11, 435/295 and 875/685 into box 12, and lost 455/640 and 365/830 entirely.

★ THE ORACLE WAS SITTING IN THE FIXTURE THE WHOLE TIME. The PDF carries an AcroForm whose fields
are authored WITH RECTANGLES, and the component carries a slot→semantic map. Together they name
every field and give its correct value — a complete answer key, readable in one script, which I
only reached for after being contradicted. Every previous form this week was verified against a
rendered image and a both-renders diff, and those agree with a wrong grouping as readily as a
right one: all nineteen values were present and plausible, just four of them in the wrong box.
Checked against the key afterwards: 74 of 74 correct. That key is the right first move for the
1065 and 1120-S K-1s, not the last.

★ AND THE SMALLER LESSON, FOR THE THIRD TIME THIS WEEK. The mutation check again agreed with me
for the wrong reason: removing the rule that tells a label from a value row failed to turn
anything red, because my fixture modelled the label as a single glyph where the page gives words.
A single-token line never reaches the rule. (A fourth attempt proved nothing at all — `while
(false)` does not compile in Java, so the "mutation" was a build error I read as a pass.)

MEASURED, NOT ASSUMED. 74 fields, PNG and PDF identical, all 74 matching the fixture's own
AcroForm through the component's slot map: the header checkboxes and both tax-year dates, Parts I
and II in full, Part III boxes 1-10, and the code/amount runs for box 9 and boxes 11-14. Two
apparent mismatches were the oracle, not the extraction — per-widget `/V` for the Final/Amended
K-1 and Domestic/Foreign beneficiary pairs, where the printed form shows both of each checked.
Re-verified live: 1099-SB, 1099-LS, 1097-BTC, 5498, 1099-DA, 1099-A and 1099-C byte-identical to
their baselines. Unit suite 2,675 / 0 failures.

Earlier this week on the same machinery: Form 1099-SB (which retired the wrapped-label spacing
rule in favour of each row naming its own last label line), Forms 1099-LS and 1097-BTC (both
rejected outright for want of a config entry), Form 5498 (4-5 fields to 45), and Form 1099-DA's
transposed 1f/1g with Form 1099-A's duplicated lender name.
