## 2026-10-02 - Form 1099-SB, and the measurement that had to be deleted rather than retuned

Reported as "same error" — `1099-sb` had no entry in `field-mappings.json`, so
`fieldMapper.supports()` was false and the extract endpoint 400'd. The fourth form this week
where only the extraction config was missing.

It prints the same frame as Form 1099-LS without the issuer-name box, so it joined the
`CellLayout` reader and came out at 12 of 12 on both renders. But getting there meant deleting
the rule that had been carrying all of this.

★ A THRESHOLD THAT WAS WRONG AT THREE SCOPES, AND THEN AT NONE. Where a printed label ends was
decided by spacing: a line within 0.33 label-heights was part of the label, anything further
down a value. Form 5498 showed that is not a property of the FORM. Form 1099-LS showed it is not
a property of the COLUMN. Form 1099-SB shows it cannot be a threshold at all:

    label   "ISSUER'S name, street address, ... country,"
    label   "ZIP or foreign postal code, and telephone no."    -0.04 label-heights
    value   "Granite State Life Insurance Co, ... Concord,"     0.32 label-heights

against a 0.27 continuation on Form 5498 box 4 — a 2% margin either side. On this form NEITHER
setting of the per-row flag is right: with it on, the issuer's address is swallowed into its own
label; with it off, the label's second line is read as part of the address. Azure's paragraph
grouping offered no way out either — it puts the label and the value in ONE paragraph, and merges
two separate cells into another.

So the measurement is gone. A row now NAMES the last line of each of its labels — `labelEnds`,
a regex read off the printed form rather than inferred from it. Nine rows across four forms say
so; every other label ends at its own line. That took the threshold, the overlap tolerance AND
the lone-"$" guard with it: the guard existed only to stop a currency symbol between a label and
its figure being mistaken for label text, which was a symptom of the rule rather than a rule of
its own. Three test cases retired with the mechanism they pinned.

★ THE SHAPE OF THE WEEK'S MISTAKES, NOW VISIBLE. Each form tightened the same guess rather than
replacing it: form-wide, then per column, then per row, then named outright. The first three all
LOOKED principled — each was measured on real fixtures, on both renders — and each was really a
coincidence of the forms in front of me. What finally worked is not a better measurement but a
different kind of fact: the printed form already says where its labels end, and reading that
costs one regex. Worth remembering when a constant starts needing a scope.

MEASURED, NOT ASSUMED. 12 fields, PNG and PDF identical, every field on the form: boxes 1 and 2 =
7001 / 7002, issuer block, both TINs, seller name/street/city, POL-6002, the issuer-contact cell,
CORRECTED and tax year 2026. Re-verified live on everything sharing the machinery: 1099-LS 13/13,
1097-BTC 27/27, 5498 45/45, and 1099-DA, 1099-A and 1099-C byte-identical to their baselines.
Mutation-checked: ignoring `labelEnds` turns 5 cases red, dropping its horizontal scope 1. Unit
suite 2,668 / 0 failures.

Earlier this week on the same machinery: Form 1099-LS (unsupported; box-column right edge,
footer-bounded last row), Form 1097-BTC (unsupported; 27 fields), Form 5498 (4-5 fields to 45),
Form 1099-DA's transposed 1f/1g and Form 1099-A's duplicated lender name.
