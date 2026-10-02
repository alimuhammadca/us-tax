## 2026-10-02 - Form 1097-BTC: rejected outright, then three things Form 5498 never had to face

Reported as "this form is not supported" on upload. `1097-btc` had no entry in
`field-mappings.json` at all, so `fieldMapper.supports()` was false and the extract endpoint
400'd every upload. The statement catalog, the UI component and both fixtures were already in
place — only the extraction config was missing.

Adding the entry alone would have bought little. Azure's key-value pass scrambles this form the
way it scrambles Form 5498, and differently on each render. On the PDF every box is shifted one
place:

    "2a Code"                => 5001      <- box 1's value
    "2b Unique identifier"   => 5002      <- box 2a's value
    "RECIPIENT'S name"       => 887996655 <- the recipient's TIN

and box 1 gets no pair of its own at all. So it is read from the printed layout, and yesterday's
5498 reader becomes a `CellLayout` that both forms supply — 5498's tables, wrap flags and
checkbox list carried across unchanged and re-verified byte-identical afterwards.

★ THREE THINGS THIS FORM NEEDED THAT 5498 DID NOT, each found only by running both renders.

**A lone `$` is a value, not label text.** Each monthly box prints its currency symbol between
the label and the figure, and it lands inside the gap that marks a wrapped label line. Absorbed,
it took the figure below it out of the cell — **seven of the twelve monthly boxes vanished, and
which seven differed by render**, because the gaps sit within thousandths of the threshold.

**A wrapped line is bounded by overlap with its own label, not by the cell.** The Copy B
instruction column runs down the right of the form, level with the boxes, and its first line
falls 0.02in below box 5f's label against a 0.03in wrapped-line gap. Spacing alone cannot tell
it from a continuation, and absorbing it pushed four more cells' tops below their own values. A
wrapped line always begins UNDER its own label, which excludes the instruction column by
construction — and also survives the sub-pixel difference between a label's x0 and its
continuation's, which was why the issuer block's second label line was reading as part of the
address.

**A multi-line text cell is assembled line by line.** Sorting the whole cell left to right
interleaves them, and the issuer block came out as

    province, Meridian Hartford, country, Municipal CT 06103 ZIP or Finance foreign postal
    Authority, code, and 40 telephone Statehouse no. Sq,

★ AND THE MUTATION CHECK CAUGHT ME AGAIN, IN THE SAME PLACE AS YESTERDAY. Two of four mutations
turned tests red and two did not. The first miss was structural — `labelBlockBottom` took an
Azure SDK page, so the tests could not reach it at all and were asserting around it; pulled out
onto plain line boxes, as `attributeRowCells` had been. The second was a fixture choice: I had
written the instruction-column case with a line 0.14in below the label, which the spacing guard
rejects on its own, so the bound I was trying to pin was never exercised. Using the line that
was ACTUALLY absorbed, 0.02in below, the mutation fails as it should. Yesterday's lesson was that
a test can agree with you for the wrong reason; today it was that the fixture has to be the case
that broke, not one that merely resembles it.

MEASURED, NOT ASSUMED. 27 fields, PNG and PDF byte-identical, every value matching: box 1 = 5001,
2a = 5002, 2b = UID-5003, 3 = CREB, 5a-5l = 5004-5015, 6 = "Sample comment 5016", both issuer
checkboxes, CORRECTED, the issuer and recipient blocks, tax year 2026. Every extracted key is one
the component's `model` declares, so the HTML replica renders it through `(extractionApplied)`.
Geometry writes now go through `coerceValue`, so a field named `*Amount` holds a number like
every other path produces. Re-verified live: 5498 still 45/45 and unchanged, 1099-DA identical to
its baseline, 1099-A and 1099-C unchanged. Unit suite 2,661 / 0 failures.

Yesterday, for the record: Form 5498 went from 4-5 fields to 45 on the same mechanism, after one
spacing threshold measured on its numbered boxes turned out not to describe its address block and
dropped the entire trustee section on the PNG. Before that, 1099-DA's transposed 1f/1g and 1099-A's
duplicated lender name.
