## 2026-10-02 - Form 5498 captured 4 fields of thirty-odd, and ONE ratio could not fix it

Reported as "the OCR service was not able to capture most of the form". It captured four values
on the PNG, five on the PDF, and one of the four was wrong: box 1 held `1545-0747`, the OMB
number.

★ THE CONFIGURED LABEL MAP WAS NEVER GOING TO WORK. Its eight keys were invented names rather
than anything Azure returns (`IRAContributions`, `FMVOfAccount`), and matching is camelCase-token
CONTAINMENT against the key-value label, so `IRAContributions` needed only "ira" and
"contributions" somewhere in it:

    "1 IRA contributions (other OMB No."              => 1545-0747   <- matched; the OMB number
    "than amounts in boxes 2-4, 8-10, 13a, and 14a)"  => 4001        <- the real value

Azure had CHOPPED box 1's label across two key-value pairs, so the value sits under a key that is
the tail of the label text. Relabelling cannot reach that. And the key-value pass is unusable on
this form anyway: it bleeds each cell's amount into its right-hand neighbour (box 3's 4003 arrives
under "4 Recharacterized contributions", box 8's under box 9, likewise 13a, 14a and 15a) and drops
box 10 entirely.

So the boxes and the address block are now read from the PRINTED LAYOUT - the mechanism yesterday's
1099-DA box-1 fix introduced, generalised to what this form needs: rows of three cells
(13a/13b/13c, state/country/ZIP); rows far taller than their labels, so a cell's bottom edge is the
NEXT row's labels rather than a multiple of the label height; a two-column page, so a row carries
an explicit right edge measured from the right column's leftmost label, or the address block runs
to the page margin and claims the boxes beside it; and labels printed twice, once per party,
selected by position DOWN THE PAGE and never by OCR reading order, which the two renders disagree
about. Box 7's checkboxes are read by EXACT key-value label, because "Roth IRA" as a substring hits
"3 Roth IRA conversion amount" first and consumes its only slot.

★ THE MISTAKE WORTH KEEPING: ONE THRESHOLD, TWO LAYOUTS. The labels wrap - "6 Life insurance cost
included / **in box 1**" made box 6 report `1`, and "15a FMV of certain specified / **assets**"
made box 15a report `"assets 4014"` - so a cell has to start below its label's wrapped block, not
below its label's first line. I measured the spacing on both renders: a wrapped line follows its
label by at most 0.27 label-heights, while the nearest a value ever comes is 0.40. A 0.33 threshold
sits cleanly between them.

And applying it form-wide BROKE THE PNG, dropping the entire trustee block - name, street, city,
state - plus the participant's name and state/country/ZIP. In the left-hand address block the cells
are short and the value is written TIGHTER under its label (0.21) than a wrapped line is. The
measurement was sound; the generalisation was not. I had derived it from the numbered boxes and
assumed it described the form. Absorption is now applied per table rather than form-wide (the
address labels are single-line, so the question does not arise there), with a second guard that a
line which is itself a plain value - an amount, a year, a date, a short code - is never absorbed,
whatever the spacing. That keeps `PC`, `2024` and `04/15/2027` safe where the gap runs near the
threshold.

★ AND A TEST THAT AGREED WITH ME FOR THE WRONG REASON. The first mutation check - inverting the
per-cell top - turned only 1 of 11 cases red. The box 6 cases should have failed and did not: I had
modelled the wrapped line as a single glyph reading "in box 1", while production builds glyphs from
WORDS, so the bare `1` that was the actual defect never appeared in the fixture. Rebuilt from the
measured word boxes; the same mutation now turns 3 red, and removing the column right edge turns 1.

MEASURED, NOT ASSUMED. 4-5 fields -> **45**, and the PNG and PDF outputs are now byte-identical.
Every value matches the fixture: boxes 1-6 = 4001-4006, 8/9/10 = 4007/4008/4009, 12a 04/15/2027,
12b 4010, 13a/b/c 4011/2024/PC, 14a/b 4012/RP, 15a/b 4014/SA, all four account-type checkboxes,
CORRECTED, box 11, both address blocks, ACCT-4013, tax year 2026. 1099-DA re-verified
byte-identical on both renders after the shared helpers were generalised; 1099-A unchanged. Unit
suite 2,652 / 0 failures.

Also today, before this: 1099-DA box 1f/1g transposed, 1b dropped and 1h never populated turned out
to be one defect - the two renders of a fixture disagree on OCR reading order, so the split-and-deal
repair was correct on the PNG and transposed on the PDF, and the label-pairing scheme I had proposed
would have fixed the PDF and broken the PNG. And 1099-A wrote the lender name twice because the
combined name/address composer had been written out once per form, so the guard added for the
1099-B payer box reached none of 1099-A, 1099-C or 1099-CAP.
