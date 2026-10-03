## 2026-10-03 - Schedule K-1 (1120-S): the third of three, and what eight forms of this taught

Last of the K-1s, same defect as the other two: a config entry with an empty field map, so
`schedule-k1-1120s` uploads returned 200 and populated nothing.

It took about an hour against the 1041's day, because the method had settled. Build the answer key
first - the fixture's AcroForm fields are authored with rectangles, the component carries a slot
-> semantic map, and together they name every field and give its value - then write the layout
against it and check field by field. 114 slots, every one resolved: the cleanest key of the three.
The form shares the 1065's frame and column positions exactly, so most of it was a table.

**114 of 114 on the PNG, 113 on the PDF.** The single miss is not the mapper's: the PDF render
OCRs box 10 row 5's 715 as 71 - the same artifact as the 1065's 375 read as 37, and both PNGs read
them correctly.

★ THREE REFINEMENTS, ALL SHARED, ALL FROM THE RENDERS DISAGREEING.

**A side row skips only what its anchor MATCHED, not its whole line.** Skipping the line is right
for "What type of entity is this shareholder?", whose trailing word is label text, and wrong for
"TIN 556-77-8811", where the line swallows the value - and which of the two you get differs by
render. The boundary comes from how far through the line's text the match ends.

**A cell's text is trimmed of non-alphanumerics at its edges.** The rule printed between the code
and amount columns arrived glued to a figure, as "|460".

**The tax-year fields are named by the form.** This one splits the beginning date into two fields
where the 1041 and 1065 use three.

Also: an unanchored "TIN" matched "Aus-tin, TX" first, the search being case-insensitive. Word
boundaries, rather than re-anchoring to a line start the renders disagree about.

★ WHAT THE EIGHT FORMS ACTUALLY TAUGHT. Every one of them failed the same way at root: I inferred
a rule from the forms in front of me and it was really a coincidence of them.

    the wrapped-label gap      a threshold, then per column, then per row, then deleted outright
                               once a row could simply NAME its own last label line
    reading order              stable within a render, never between two of them
    column extents             derivable from labels, until a form printed its box numbers to the
                               left of the labels they belong to
    "the tool cannot do it"    true of ONE output of the tool; selectionMarks had every checkbox

The correction each time was not a better inference but a different KIND of fact - something the
printed form or the fixture states outright, rather than something measured off it. The answer key
is the same move: the PDF already knows which box each value belongs to, so stop deducing it.

★ AND THE HABIT THAT KEPT FAILING. Four times the mutation check agreed with me for the wrong
reason, and three of those were one mistake: the fixture resembled the case instead of being it -
a label modelled as one glyph where the page gives words, a line chosen 0.14in below its label
where the real one sits 0.02in below, two-decimal coordinates where the rule turns on the third.
The fourth proved nothing at all: `while (false)` does not compile, and I read the build error as
a pass. A mutation that turns nothing red is not evidence; it is a question about the fixture.

MEASURED, NOT ASSUMED. Re-verified live across everything sharing this machinery: K-1 1065 still
104/104, K-1 1041 74/74 byte-identical, and 1099-SB, 1099-LS, 1097-BTC, 5498, 1099-DA, 1099-A and
1099-C unchanged. Unit suite 2,675 / 0 failures.

The three K-1s are done. Still open in the statements sweep: the `w-2.pdf` box-12 amounts and box
14b, `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`, `1099-g.png`'s duplicated phone fragment, and
mapping an Azure 429 to 503 rather than a bare 500.
