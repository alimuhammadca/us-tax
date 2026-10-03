## 2026-10-02 - Form 1099-LS, and a flag that has now been wrong at two different scopes

Reported as "this form is not supported" on upload. `1099-ls` had no entry in
`field-mappings.json`, so `fieldMapper.supports()` was false and the extract endpoint 400'd.
The catalog, the UI component and both fixtures were already in place — the third form this
week where only the extraction config was missing.

Its key-value pass is as unusable as Form 5498's and Form 1097-BTC's, so it joins them on the
`CellLayout` reader. Two mechanisms it needed that neither of those did:

**The box column takes a right edge.** The Copy B instruction column runs level with the
"Issuer's name" row, so reading that row to the page edge appended "For Payment" to the issuer's
name. Declared per layout (0.81 of the page width, measured on both renders) and left at the page
edge for the two forms already verified without it.

**The last row of a column ends at the form's printed footer.** The acquirer-contact cell spans
four printed rows, and its value lies past any bound derived from the row pitch or the label
height, so "Concord, NH 03301" fell outside the band. Every form in this family prints
`www.irs.gov/Form<name>` directly beneath its grid, which is where the cells actually stop — a
measurement that does not have to be guessed.

★ AND THE LARGER CORRECTION: THE SAME FLAG HAS NOW BEEN WRONG AT TWO SCOPES. Yesterday Form 5498
showed that the spacing separating a wrapped label line from a cell's value is not a property of
the FORM, and the flag moved onto the column. Form 1099-LS shows it is not a property of the
COLUMN either. Its acquirer/recipient block has a two-line label at the top and tight single-line
labels below it, values 0.25–0.33 label-heights down — inside the band a wrapped line occupies:

    absorption ON   "12 Birchwood Ct" and "Manchester, NH 03104" read as part of their own
                    labels, and lost
    absorption OFF  the acquirer's address loses its second label line INTO the value

The same split sits in the box column: "Issuer's name" does not wrap, and on the PNG its value is
0.29 label-heights below it — absorbed, and the issuer's name went missing on that render alone.
So the flag is now on the ROW, which is where the fact lives: whether a label wraps is visible on
the printed form. Nine rows across the three forms declare it; the rest start their cells below
the label line, as they did before any of this existed.

★ THE MUTATION CHECK MISSED AGAIN, AND FOR A THIRD DISTINCT REASON. Yesterday it was a helper the
tests could not reach, then a fixture that resembled the bug instead of being it. This time all
three new mechanisms survived mutation because the cases pinned the PRIMITIVES — handing
`attributeRowCells` a band, a right edge and a set of cell tops — while **choosing** those three
is `readRows`' job, and that is where the new logic lives. Testing around the decision is not
testing it. `readRows` was already plain data; opened up and pinned, removing the footer bound or
forcing the wrap flag on now turns a case red. One line still is not unit-covered: the
`w * layout.mainRightEdge()` in `readCellLayout`, which needs an Azure SDK page fixture, so it
rests on the live check instead. Recorded rather than papered over.

A fourth measurement lesson, smaller: the first version of the street-address case asserted
against two-decimal coordinates and passed whatever the code did. The real gap is 0.0382in against
a 0.0394in threshold — 3% apart — so the fixtures are now measured to four decimals.

MEASURED, NOT ASSUMED. 13 fields, PNG and PDF identical, every field on the form correct: box 1 =
6001, box 2 = 03/12/2026, the acquirer block, both TINs, recipient name/street/city, issuer name,
contact, POL-6002, CORRECTED, tax year 2026. Re-verified live: Form 5498 still 45/45, Form
1097-BTC 27/27, Form 1099-DA all byte-identical to their baselines. Unit suite 2,671 / 0 failures.

Earlier this week, on the same machinery: Form 1097-BTC (also unsupported, 27 fields, needed the
lone-"$" guard and the label-overlap bound), Form 5498 (4–5 fields to 45), Form 1099-DA's
transposed 1f/1g and Form 1099-A's duplicated lender name.
