## 2026-10-03 - Form SSA-1099: a field map written from the wrong vocabulary, and a box that had been over-built

Tenth form in the statements sweep, and the first that was NOT the empty-field-map defect.
SSA-1099 uses a real Azure tax model (`prebuilt-tax.us.1099SSA`), not `prebuilt-document`, and
that model returns nearly the whole form. One field of six came through.

★ THE CONFIG NAMED FIELDS AZURE DOES NOT HAVE. Its keys were invented from the form's own
vocabulary — `BenefitsPaidGross`, `BenefitsRepaid`, `NetBenefits`,
`VoluntaryFederalIncomeTaxWithheld`, `BeneficiarySSN` — where the model answers to `Box3`,
`Box4`, `Box5`, `Box6` and `Beneficiary.SSN`. Only `ClaimNumber` happened to coincide.

    Azure returns          Beneficiary.Name/.Address/.SSN  Box3 Box4 Box5 Box6  ClaimNumber  TaxYear
    the config asked for   BeneficiarySSN  BenefitsPaidGross  BenefitsRepaid  NetBenefits  ...

Third instance of this: the 1099-SA config had it before being rewritten to literal `Box1..Box5`,
and Form 5498's was the same shape. A field map written from what the form is CALLED rather than
from what the model RETURNS. Dumping the model's own output is a five-minute first move on any
tax-model form that comes back thin, and the rest are worth auditing rather than waiting to be
told one at a time.

Box 7 arrives as one string where the screen binds a street line and a city/state/ZIP line, so it
is split at the first comma.

★ ONE RULE THE CELL READER DID NOT HAVE. The two "DESCRIPTION OF AMOUNT IN BOX n" blocks are not
in the model at all and the screen renders both, so they are read by position — but neither a
fixed divide nor "the rightmost label at or left of the value" places them:

    the renders disagree about the gap   PDF 0.406 .. 0.419 of the width
                                         PNG 0.482 .. 0.506      (windows that do not overlap)
    and both blocks begin to the LEFT of their own label

What holds on both is that each block OVERLAPS its own label horizontally and not the other's —
a property of the printed form rather than of the scan, which is the kind of fact this sweep has
converged on every time a measurement failed. The band stops at box 6's label, or the box 3 block
runs three inches down its own cell and takes the "No adjustments this year" line with it.

1 field -> 13, both renders identical, every value matching the fixture.

★ AND THE BOX HAD BEEN OVER-BUILT. The user then pointed out that box 3's description area in the
replica carried four labelled sub-fields — "Paid by check or direct deposit", "Medicare Part B
premiums deducted from your benefits", "Total Additions", "Benefits for <year>" — that the printed
SSA-1099 does not have. It carries a free-text block. Commented out, not deleted, along with the
two sync sites that existed only to serve them; the `.box3-description-lines` styles stay in
place, so restoring them is uncommenting three blocks.

Those four WERE the whole description area, so removing them alone would have left the box empty —
and nowhere to show the description extraction had just started filling. A plain textarea went in
their place, bound to the `box3_desc` key the PDF-overlay view of the same component already uses.

★ WHAT SETTLED THAT IT WAS THE RIGHT SHAPE RATHER THAN AN INVENTION: the stylesheet already had a
`.desc-3 textarea` rule, matching nothing. Dead CSS for an element that does not exist is evidence
about what a block was built for, and about what was added later. Worth reading before reshaping a
template — it is cheaper than asking and more reliable than guessing.

★ WHAT THE TEN TAUGHT. Each failed the same way at root: a rule inferred from what was in front of
me, which turned out to be a coincidence of it.

    the wrapped-label gap   a threshold, then per column, then per row, then deleted outright once
                            a row could simply NAME its own last label line
    reading order           stable within a render, never between two of them
    column extents          derivable from labels, until a form printed its box numbers to the left
                            of the labels they belong to
    "the tool cannot do it" true of ONE output of the tool; selectionMarks had every checkbox
    field names             taken from the form's vocabulary, not the model's

The correction each time was a different KIND of fact — something the form, the fixture or the
tool states outright. Building the answer key first is the same move, and it took the 1120-S from
a day's work to an hour.

A smaller one, recurring: writing patch scripts through shell heredocs ate a backslash level twice
more in this change, both caught at compile time. Those files go through the Write tool.

MEASURED, NOT ASSUMED. Re-verified live: Form 2439 and K-1 1120-S byte-identical, and 1099-SB,
5498, 1099-DA, 1099-A, W-2, 1099-R and 1099-INT unchanged. Unit suite 2,675 / 0 failures;
`npm run build` clean.

Still open in the sweep: the `w-2.pdf` box-12 amounts and box 14b, `employeeSuffix` on
`w-2-as.pdf` and `w-2.pdf`, `1099-g.png`'s duplicated phone fragment, mapping an Azure 429 to 503
rather than a bare 500, and an audit of the other tax-model configs for invented field names.
