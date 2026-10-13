# Test files for Personal > Last year 1040

Official IRS 2024 Form 1040 (irs.gov/pub/irs-prior/f1040--2024.pdf) filled in with **fictional** data.

The PDFs are **flattened** (no form fields, no XFA layer, check marks drawn as lines), so they look the same in
every viewer. The blank IRS form carries an XFA layer that Adobe Reader / Edge show instead of filled fields,
which is why an unflattened copy looks empty. Rebuild with `python make_1040.py <blank f1040--2024.pdf>`.

| File | Use |
|---|---|
| `rivera-1040-2024.pdf` | Both pages — the full test. Head of household, two dependents |
| `rivera-1040-2024-page-1.png` | Photo/scan case: page 1 only (identity, address, filing status, dependents) |
| `rivera-1040-2024-merged.png` | Both pages stacked in one image — read as two pages |
| `rivera-1040-2024-page-2.png` | Page 2 only (occupation, phone, email, designee, bank) — shows a partial read |
| `chen-1040-2024.pdf` | Married filing separately — spouse named on the filing-status line, no dependents |
| `chen-1040-2024-page-1.png` | Page 1 of the MFS return as an image |
| `chen-1040-2024-page-2.png` | Page 2 of the MFS return |
| `sample-1040-2024.pdf` | The e2e household (MFJ, one child) — same as `e2e/tests/fixtures/prior-1040` |
| `sample-1040-2024-page-1.png` | Page 1 of the same, as an image |

An image may hold one page, or several pages stacked into one tall image (`rivera-1040-2024-merged.png`):
the app splits a stacked image into letter-size pages before sending it to Azure, which otherwise reads an
image as a single page and loses page 1. Use at least ~150 dpi — smaller renders can lose the SSN digits.

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

## Expected result — `chen-1040-2024.pdf` (MFS; verified 2026-10-12 against the local backend)

| Form | Result |
|---|---|
| Identification (you) | Taylor J. Chen · SSN 433-22-1234 · Accountant |
| Address | 88 Lakeview Ave, Madison WI 53703 · (608) 555-0177 · taylor.chen@example.com |
| Filing status | **Not filled, on purpose** — choosing MFS splits the household into two returns in the app, so the user picks it on the Filing status form |
| Spouse | **Not created** — on an MFS return the spouse (Alex Chen, SSN 433-22-6789) appears only on the filing-status line and SSN box |
| Dependents / designee | None on this return |
| Last year's numbers shown | Total income $72,000 · AGI $72,000 · Taxable income $57,400 · Total tax $7,681 · Refund $519 |

The page-1 PNG gives the same result minus the occupation, phone and email (they are on page 2). This file also
guards a rule: a spouse SSN by itself must not be read as a joint return (only a spouse NAME on the
"If joint return" line implies MFJ when the checkbox is unreadable).
