## 2026-10-03 - Form 2439: the first form that needed nothing new

Ninth form in the statements sweep, same defect as the eight before it: `2439` had a config entry
with an empty field map, so uploads returned 200 and populated nothing.

**16 of 16 on both renders**, every field the component binds, checked against the fixture's
AcroForm. Three regions — the RIC/REIT and shareholder block down the left, the numbered boxes
beside it, and the tax-year block up in the OMB panel where each value sits beside its label
("For calendar year 20 __", "beginning __ , 20 __", "ending __ , 20 __"). The printed ", 20"
between those cells is harmless: a cell takes the FIRST figure in it and the label's own 20 comes
after.

★ AND THAT IS THE POINT OF THIS ENTRY. It is the first form in the sweep that the reader already
fitted — a layout table and one measurement, no new mechanism. Every form before it added
something: geometric cell attribution (1099-DA), N-cell rows and tall cells (5498), a lone "$" and
the label-overlap bound (1097-BTC), a column right edge and a footer-bounded last row (1099-LS),
labels that NAME their own last line (1099-SB), N columns with stated extents and code/amount
lists (K-1 1041), lists whose rows name their field and rows whose values sit beside the label
(K-1 1065), selection-mark checkboxes and anchor-scoped label skipping (K-1 1120-S).

The one measurement 2439 did need is the shape the whole sweep kept returning to: where the left
block stops. The shareholder's ZIP ends by 0.410 of the width and box 2's number begins at 0.427,
so 0.42 separates them — and without it that number joined the address, but only on the PNG.
Measured on both renders, as everything here now is.

★ WHAT THE NINE FORMS TAUGHT, UNCHANGED. Each failed the same way at root: I inferred a rule from
the forms in front of me and it was a coincidence of them.

    the wrapped-label gap      a threshold, then per column, then per row, then deleted outright
                               once a row could simply NAME its own last label line
    reading order              stable within a render, never between two of them
    column extents             derivable from labels, until a form printed its box numbers to the
                               left of the labels they belong to
    "the tool cannot do it"    true of ONE output of the tool; selectionMarks had every checkbox

The correction each time was not a better inference but a different KIND of fact — something the
printed form or the fixture states outright rather than something measured off it. Building the
answer key first (the fixture's AcroForm named through the component's slot map) is the same move,
and it took the 1120-S from a day's work to an hour.

And the habit that kept failing: four mutation checks agreed with me for the wrong reason, three
because the fixture resembled the case instead of being it. A mutation that turns nothing red is a
question about the fixture, not a pass.

MEASURED, NOT ASSUMED. Re-verified live across everything sharing this machinery: K-1 1120-S
114/114, K-1 1065 104/104, K-1 1041 74/74, and 1099-SB, 1099-LS, 1097-BTC, 5498, 1099-DA, 1099-A
and 1099-C byte-identical. Unit suite 2,675 / 0 failures.

A note for whoever adds the next form here: 2439 has no component of its own. It is rendered by
the shared `form-capital-statement`, which binds `pdfRaw` keys mirrored from the model by
`syncFormToPdf()`, so extraction has to produce the MODEL key names exactly. That component serves
several form ids.

Still open in the sweep: the `w-2.pdf` box-12 amounts and box 14b, `employeeSuffix` on
`w-2-as.pdf` and `w-2.pdf`, `1099-g.png`'s duplicated phone fragment, and mapping an Azure 429 to
503 rather than a bare 500.
