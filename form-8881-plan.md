# Form 8881 plan - small employer retirement plan credits (outstanding.md 1B-18, first credit form)

Owner-approved 2026-11-24 (option a: screen, compute, Form 3800 lines, deduction cut, Form 8881 preview). Sources: Form 8881 (Rev.
December 2025, replaced the Rev. 12-2023 PDF in docs/IRS-Forms) and its instructions (Rev. December 2025, docs/books/i8881.pdf).

## Stage A - blank preview (done, owner-reviewed 2026-11-24)

- `scripts/generate-semantic-8881.js` - 29 fields named by printed line (line A, 1-5, 6a-6g, 7-15; the line 3 and line 12 counts
  before "x $250" / "x $200"); geometry-checked (right column descends; the counts on their amount's row).
- `scripts/generate-f8881-elements.py` - copy of the Form 7210 extractor (PyMuPDF) -> `us-tax-ui/public/irs/f8881_elements.json`.
- `form-tax-return-8881` (pure HTML/CSS), one copy per person in the Tax Return sidebar (`tax-return-8881-taxpayer` / `-spouse`),
  reading `attachedForms.form8881List` by `ownerRole` (blank until Stage B).
- e2e `tax-return-8881-preview.spec.ts`.

## Stage B - screen, compute, Form 3800, deduction cut (done 2026-11-24; the screen is listed like the other credit screens, not hidden without a business)

**One Form 8881 per person.** The employer is the person's own businesses (sole proprietorships under common control are one employer,
IRC 414(c)); on a joint return each spouse with a plan gets a copy.

**Screen** "Small employer retirement plan credits (Form 8881)" in Deductions (`small-employer-plan-credit-taxpayer` / `-spouse`;
`pf_small_employer_plan_credit`, V565). Shown when the person has a Schedule C or Schedule F business.
- Gate: did your business start or keep a retirement plan for employees that qualifies for these credits?
- Which business paid the costs and contributions (one of the person's Schedule C / F businesses).
- Part I section 1 (startup costs): this year is year 1, 2 or 3 of the credit (later = none); employees paid $5,000+ in the year
  before the first credit year (line A, over 100 = not eligible); qualified startup costs (line 1); non-highly-compensated employees
  eligible for the plan (line 3).
- Part I section 2 (employer contributions): plan year 1-5 (later = none); employees in the preceding year (line 6a, over 100 = not
  eligible); contributions for employees who got $1,000 or less (line 6b); for employees who got more, the total of each one's
  contributions capped at $1,000 / $1,334 / $2,000 / $4,000 by plan year (line 6c, help text explains). Not a defined benefit plan
  (yes/no) - a DB plan gets no contributions credit.
- Part II: an automatic enrollment arrangement in its 1st, 2nd or 3rd year (line 9 = $500).
- Part III: military spouse employees in their first 3 years in the plan (count, line 12 = x $200); employer contributions for them
  (line 13, at most $300 each - checked against the count).

**Compute** (`Form8881Compute`, outside TaxReturnComputeService):
- Line 2 = line 1 (line A <= 50) or 50% (51-100); line 3 = count x $250; line 4 = max($500, line 3) capped $5,000; line 5 = min(2, 4).
- Line 6d = 6b + 6c; 6e only when 6a is 51-100 (6e(1) = 6a - 50, 6e(2) = x 2%, 6e(3) = 6e(2) x 6d, 6e(4) = 6d - 6e(3)); 6f; 6g by plan
  year (100 / 100 / 75 / 50 / 25%).
- Lines 7, 10, 14 = the person's K-1 codes AE / AF / AG (today they go straight to Form 3800 lines 1j / 1dd / 1ee; with a Form 8881 they
  go through it instead, so they are not counted twice).
- Line 8 -> Form 3800 Part III line 1j, line 11 -> line 1dd, line 15 -> line 1ee (Form3800Current, the person's EIN/SSN column as for
  the other own credits); then Schedule 3 line 6a through Part II.
- Over 100 employees (line A, or 6a for Parts I section 2 / III, or the Part II test) -> that credit is 0 with an advisory.
- **No double benefit** (instructions, "No Deduction Allowed for Credit Amount"): the chosen business's deductions are cut - line 5 off
  the startup costs (Schedule C line 27a other expenses / Schedule F line 32), line 6g off the employer contributions (Schedule C line
  19 / Schedule F line 23 pension and profit-sharing plans), each cut capped at that line. Flows through net profit, SE tax and QBI.

**Preview:** `Form8881Fields` builds the fields from the finished Form 8881 (counts and amounts as printed, lines skipped as the form
says), `AttachedForms.form8881List` (per person, ownerRole), sidebar gate in the TEMP comment.

**Tests:** Form8881ComputeTest (limits, 51-100 phase-down, plan years, military cap, K-1 lines, eligibility), the deduction cut, the
fields map; e2e screen save / reopen, compute to Form 3800 line 1j / Schedule 3 line 6a, the preview filled.
