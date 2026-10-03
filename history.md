## 2026-10-03 - Form SSA-1099: a different defect, and a field map written from the wrong vocabulary

Tenth form in the statements sweep, and the first that was NOT the empty-field-map defect.
SSA-1099 uses a real Azure tax model (`prebuilt-tax.us.1099SSA`), not `prebuilt-document`, and
that model returns nearly the whole form. One field of six came through.

★ THE CONFIG NAMED FIELDS AZURE DOES NOT HAVE. Its keys were invented from the form's own
vocabulary — `BenefitsPaidGross`, `BenefitsRepaid`, `NetBenefits`,
`VoluntaryFederalIncomeTaxWithheld`, `BeneficiarySSN` — where the model answers to `Box3`,
`Box4`, `Box5`, `Box6` and `Beneficiary.SSN`. Only `ClaimNumber` happened to coincide.

    Azure returns          Beneficiary.Name/.Address/.SSN  Box3 Box4 Box5 Box6  ClaimNumber  TaxYear
    the config asked for   BeneficiarySSN  BenefitsPaidGross  BenefitsRepaid  NetBenefits  ...

This is the third time: the 1099-SA config had it before being rewritten to literal `Box1..Box5`,
and Form 5498's was the same shape. A field map written from what the form is CALLED rather than
from what the model RETURNS. The fix is five minutes once you dump the model's own output, which
is the first thing to do on any tax-model form that comes back thin — and worth auditing across
the rest of them rather than waiting to be told one at a time.

Also: box 7 arrives as one string where the screen binds a street line and a city/state/ZIP line,
so it is split at the first comma.

★ AND ONE RULE THE CELL READER DID NOT HAVE. The two "DESCRIPTION OF AMOUNT IN BOX n" blocks are
not in the model at all and the screen renders both, so they are read by position — but neither a
fixed divide nor "the rightmost label at or left of the value" places them:

    the renders disagree about the gap   PDF 0.406 .. 0.419 of the width
                                         PNG 0.482 .. 0.506      (windows that do not overlap)
    and both blocks begin to the LEFT of their own label

What holds on both is that each block OVERLAPS its own label horizontally and not the other's.
That is a property of the printed form rather than of the scan — the same kind of fact this sweep
has converged on every time a measurement failed. The band stops at box 6's label, or the box 3
block runs three inches down its own cell and takes the "No adjustments this year" line with it.

MEASURED, NOT ASSUMED. 1 field -> 13, both renders identical, every value matching the fixture:
the year, the beneficiary's name, SSN and address, boxes 3-6, the claim number and both
descriptions. Boxes 5 and 6 have no description blocks on the form, so their Notes fields stay
empty — correctly. Re-verified live: Form 2439 and K-1 1120-S byte-identical, and 1099-SB, 5498,
1099-DA, 1099-A, W-2, 1099-R and 1099-INT unchanged. Unit suite 2,675 / 0 failures.

★ WHAT THE TEN TAUGHT. Each failed the same way at root: a rule inferred from what was in front of
me, which turned out to be a coincidence of it.

    the wrapped-label gap   a threshold, then per column, then per row, then deleted outright once
                            a row could simply NAME its own last label line
    reading order           stable within a render, never between two of them
    column extents          derivable from labels, until a form printed its box numbers to the left
                            of the labels they belong to
    "the tool cannot do it" true of ONE output of the tool; selectionMarks had every checkbox
    field names             taken from the form's vocabulary, not the model's

The correction each time was a different KIND of fact, not a better inference — something the
form, the fixture or the tool states outright. Building the answer key first is the same move, and
it took the 1120-S from a day's work to an hour.

A smaller one, recurring: writing patch scripts through shell heredocs ate a backslash level twice
more in this change, both caught at compile time. Those files go through the Write tool.

Still open in the sweep: the `w-2.pdf` box-12 amounts and box 14b, `employeeSuffix` on
`w-2-as.pdf` and `w-2.pdf`, `1099-g.png`'s duplicated phone fragment, mapping an Azure 429 to 503
rather than a bare 500 — and now an audit of the other tax-model configs for invented field names.
