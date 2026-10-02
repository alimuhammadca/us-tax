## 2026-10-01 - Form 1099-DA box-1: reading order CANNOT resolve it, so the cells are read by geometry

Reported as three separate OCR bugs on `1099-da.pdf`: box 1f and 1g transposed, box 1b dropped, box 1h
never populated. One defect. Azure's key-value pass bleeds a printed row's two amounts into the
RIGHT-hand box's value and leaves the left one holding a bare `"$"`:

    pdf:  1f => "$"   1g => "10001 $ 135"   1h => "$"   1i => "65 $ 89"
    png:  1f => -     1g => "$ 135 10001"   1h => "$"   1i => "65 $ 89"

★ THE TWO RENDERS DISAGREE ON THE ORDER. 1f's 10001 is **first** in the PDF's string and **second** in
the PNG's. The existing repair split that string and dealt the numbers out by position - `nums.get(0)`
to 1g, the last to 1f - which is right on the PNG and transposed on the PDF. It was never a bug in the
splitting; **no ordering rule can work at all**, because the order follows OCR reading order and that is
not a property of the form. The content lines are no better: the PDF emits a run of labels and then a run
of values, the PNG interleaves them, and neither layout has a stable "value after label" relationship.

    pdf:  1f Proceeds / 1g Cost or other basis / 1 London Street / 21 / $ 10001 / $ 135
    png:  if Proceeds / 1 London Street / 21 / $ / 1g Cost or other basis / $ / 135 ... / 10001

I had proposed pairing N consecutive labels with the N values that follow. That would have fixed the PDF
and **broken the PNG**, where 10001 is emitted three lines further down, after "Cambridge". Checking the
second render before building is what caught it.

★ GEOMETRY IS STABLE WHERE ORDER IS NOT. Normalised against page width the cells land in the same place
on both renders - one measured in inches on an 8.5-wide page, the other in pixels on an 852-wide one:

    label 1f  x0  0.488 (pdf) / 0.479 (png)        10001  x0  0.608 / 0.607
    label 1g  x0  0.652 / 0.658                    135    x0  0.787 / 0.797

So the printed layout itself resolves it, and the rule is just a statement of that layout: **a value
belongs to the rightmost label in its row whose left edge is at or left of the value's left edge.** No
tolerance constant - an amount is right-aligned in its cell, so its left edge always lands inside its own
cell and clear of the next cell's label. Box 1b is the same defect with one cell: Azure returns an empty
key-value for it although the word sits plainly under the label.

GUARD: a row is overwritten only when geometry reads BOTH its cells - a complete, self-consistent row.
Anything else fills blanks only, so a render this does not recognise keeps whatever the old repair gave.

★ 1b NEEDED A RIGHT EDGE, AND THE PAGE EDGE IS NOT IT. 1b has no right-hand box, and the first cut read
the cell out to the page edge and produced `"KOKO For State Tax"`: the "Copy 1 / For State Tax Department"
stub sits at x 7.19 of 8.5 in the same horizontal band. Fixed by reading the cell from the value outward -
start at the word under the label, keep taking words while the gap stays within a label-height. Word
spacing inside a name is hundredths of an inch; the jump to the next column is 2.76 inch. Not close.

VERIFIED, NOT ASSUMED. Full field-set diff of the live extraction, before vs after, on both renders:
the PDF shows exactly the three reported fixes and nothing else (46 -> 48 fields); **the PNG diff is
empty** - 58 fields, byte-identical. All of 1a-1i now match the fixture on both: 1b=KOKO, 1f=10001,
1g=135, 1h=65, 1i=89. Unit suite 2,625 / 0 failures.

The decision logic was extracted out of the Azure SDK types into `attributeRowCells` /
`readCellUnderLabel` over a plain `Glyph` record, so it can be pinned directly:
`GenericFieldMapper1099DaCellGeometryTest`, 17 cases, every coordinate MEASURED from the real fixtures -
including one that asserts the PDF and PNG agree *given opposite word orders*, and one that asserts the
amounts from the row below are not pulled up. Mutation-checked: inverting the single comparison that does
the work turns 8 of the 17 red, so they are not passing vacuously.
