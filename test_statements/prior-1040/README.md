# Test files for Personal > Last year 1040

Official IRS 2024 Form 1040 (irs.gov/pub/irs-prior/f1040--2024.pdf) filled in with **fictional** data.

The PDFs are **flattened** (no form fields, no XFA layer, check marks drawn as lines), so they look the same in
every viewer. The blank IRS form carries an XFA layer that Adobe Reader / Edge show instead of filled fields,
which is why an unflattened copy looks empty. Rebuild with `python make_1040.py <blank f1040--2024.pdf>`.

| File | Use |
|---|---|
| `rivera-1040-2024.pdf` | Both pages — the full test. Head of household, two dependents |
| `rivera-1040-2024-page-1.png` | Photo/scan case: page 1 only (identity, address, filing status, dependents) |
| `rivera-1040-2024-page-2.png` | Page 2 only (occupation, phone, email, designee, bank) — shows a partial read |
| `sample-1040-2024.pdf` | The e2e household (MFJ, one child) — same as `e2e/tests/fixtures/prior-1040` |
| `sample-1040-2024-page-1.png` | Page 1 of the same, as an image |

An image upload covers **one page**; for both pages use the PDF. (Stacking two pages into one tall PNG
does not work — Azure reads it as a single page and only picks up part of it.)

## Expected result — `rivera-1040-2024.pdf` (verified 2026-10-12 against the local backend)

| Form | Filled in |
|---|---|
| Identification (you) | Morgan A. Rivera · SSN 412-55-1234 · Registered Nurse |
| Address | 2450 Oak Ridge Dr, Apt 12B, Columbus OH 43215 · (614) 555-0142 · morgan.rivera@example.com |
| Filing status | Head of household |
| Dependents (added) | Ava Rivera (Daughter, 412-55-1235) · Noah Rivera (Son, 412-55-1236) |
| Third party designee | Yes · Dana Rivera · (614) 555-0199 · PIN 24680 |
| Not filled (by design) | Dates of birth, IP PIN, digital assets, CTC/ODC eligibility |
| Last year's numbers shown | Total income $68,820 · AGI $68,820 · Taxable income $46,920 · Total tax $1,299 · Refund $4,101 |

No spouse on this return, so no spouse tab is created. Direct deposit (savings, routing 041000124) is read but
not pre-filled — the bank form is in the Tax Return section, not Personal.

**Fill-blanks-only check:** change something (e.g. occupation) on Identification, return to Last year 1040 and
click *Fill in blanks again* — your change is kept, and the dependents are not added twice.
