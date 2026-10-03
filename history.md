## 2026-10-03 - Schedule K-1 (1065), the answer key used first, and a gap I wrongly called external

Same defect as the 1041 and the same day: `schedule-k1-1065` has a config entry, so uploads
returned 200, but its field map was empty and nothing was ever recognised.

★ THE ANSWER KEY WENT FIRST THIS TIME, AND IT EARNED ITS PLACE. Yesterday's entry ended by saying
the fixture's AcroForm plus the component's slot map is a complete answer key and should be the
first move on the remaining two K-1s. Doing that on the 1065 produced all 111 field names and 104
values before a line of layout was written, and then caught, on the first run, the same class of
mistake that on the 1041 I only found after being corrected: Part III's right sub-column is
irregular — some printed rows carry a code the component models, some only a container slot, and
some print an amount with no code at all — and skipping those one-token rows shifted every row
below them into the wrong box. On the 1041 that shift reached the user. Here it never left the
loop.

Two mechanisms the form needed:

**A list whose rows name their field.** The 1041's boxes 11-14 take a fixed 3 / 3 / 5 / 8 of their
column, so counts were enough. The 1065's boxes 14-21 are not regular, so a list now names the
field for every row in order, with a null where that row's code is not modelled, and a lone token's
side of the row is decided by its position.

**A row whose values sit beside the label.** Part II is a grid — Profit, Loss and Capital each
carry a Beginning and an Ending figure to their right, and items C, H2, I1, L and N put their value
beside the label too. Every row the reader had handled until now put its value underneath. Item N
also forced a label index that counts from the BOTTOM of the page: "Beginning" and "Ending" are
printed four times down that column and item N's are simply the last of each.

★ AND THEN I CALLED A SOLVABLE GAP SOMEONE ELSE'S. Five checkboxes came back unread — Final K-1,
item I2, item K3, box 16, box 22 — and I reported them as "not mine to fix", on the grounds that
Azure's key-value pass does not return them. The user's reply was that the checkboxes were the
problem. They were right, and the evidence was one API field away: `pages[].selectionMarks` had
all eighteen marks, with positions and states, the whole time. The key-value pass reports only
some of a form's checkboxes and the choice is the model's, not the form's — and the ones it drops
are exactly those printed at the END of a long label, where no text follows the box for it to pair
with.

So a checkbox is now matched to the mark NEAREST its own label, on that label's row, whichever
side it sits. Where two share a row ("General partner" beside "Limited partner", "Yes" beside
"No") nearest-to-the-label separates them, because each label begins just after its own box. The
key-value pass stays as a fallback for a box whose reported label is not what the form prints —
Form 5498's box 7 answers to "IRA", "SEP" and "SIMPLE" against a line beginning "7 IRA".

The lesson is not about checkboxes. "The tool does not return it" was a statement about ONE output
of the tool, and I let it stand for the tool. Worth a second look before any gap gets labelled
external.

MEASURED, NOT ASSUMED. 104 of 104 on the PNG and 103 on the PDF, checked field by field against the
fixture's AcroForm through the component's slot map. The single remaining miss is not the mapper's:
the PDF render OCRs box 11's 375 as 37, and the PNG reads it correctly. Re-verified live: K-1 1041
still 74/74 and byte-identical, and 1099-SB, 1099-LS, 1097-BTC, 5498, 1099-DA, 1099-A and 1099-C
all unchanged. Unit suite 2,675 / 0 failures.

Still open on this form: nothing. Still open on the family: the 1120-S K-1, which has the same slot
map and should now go quickly — the selection-mark reader is shared, so its checkboxes come free.

Earlier this week on the same machinery: Schedule K-1 (1041), Form 1099-SB (which retired the
wrapped-label spacing rule for each row naming its own last label line), Forms 1099-LS and 1097-BTC
(both rejected outright for want of a config entry), Form 5498 (4-5 fields to 45), and Form
1099-DA's transposed 1f/1g with Form 1099-A's duplicated lender name.
