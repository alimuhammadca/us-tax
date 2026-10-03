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
