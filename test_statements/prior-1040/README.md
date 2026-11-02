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

Every `.png` above also has a `.jpg` copy with the same name (`chen-1040-2024-merged.png` / `.jpg` hold both MFS pages stacked).

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

## Scenario set — `scenarios/` (23 returns × PDF, PNG, JPG)

Built by `python make_1040_scenarios.py <blank f1040--2024.pdf>`. Each scenario is one `.pdf` (both pages, flattened),
one `.png` and one `.jpg` (both pages stacked in one 150 dpi image, which the app splits into pages). The file name
says what the return covers, in this order:

`NN-<filing status>_<dependents>_[extras]_pec-<who>_da-<yes|no>_tpd-<yes|no>_<refund-checking|refund-savings|owe>`

| Token | Meaning on the 2024 Form 1040 |
|---|---|
| `single` `mfj` `mfs` `hoh` `qss` | Filing status box |
| `0dep`, `1dep-ctc`, `2dep-ctc-odc`, `4dep-3ctc-1odc`… | Dependents listed, and which credit column is checked (child tax credit / credit for other dependents) |
| `more-than-4dep` | "If more than four dependents… check here" box, four listed (the fifth is on a statement; credit counted) |
| `pec-none` / `pec-you` / `pec-spouse` / `pec-both` | Presidential Election Campaign boxes |
| `da-yes` / `da-no` | Digital assets question |
| `tpd-yes` / `tpd-no` | Third party designee (Yes fills name, phone, PIN) |
| `claimed-as-dependent` | "Someone can claim you as a dependent" (standard deduction limited to earned income + $450) |
| `age65`, `both-age65`, `spouse-age65`, `blind`, `spouse-blind` | Age/blindness boxes (+$1,950 single/HOH, +$1,550 married/QSS each) |
| `spouse-itemizes` | MFS "Spouse itemizes on a separate return" box; itemized deduction on line 12 |
| `nonresident-spouse-as-resident` | Nonresident alien spouse treated as a U.S. resident (box + name) |
| `qualifying-child-not-dependent` | HOH child's name on the filing-status line, no dependents listed |
| `foreign-address` | Foreign country / province / postal code instead of state and ZIP |
| `apt` | Apartment number (several other scenarios also have one) |
| `ip-pin`, `ip-pin-you`, `ip-pin-both` | Identity Protection PIN boxes on page 2 |
| `refund-checking` / `refund-savings` / `owe` | Direct deposit account type, or an amount owed on line 37 (no bank details) |

MFS returns put the spouse's name on the filing-status line and the SSN in the spouse SSN box (no spouse name
line). Every return has an occupation, phone and email on page 2; MFJ returns also have the spouse's occupation.
Amounts are consistent 2024 returns: standard deduction (or itemized), Tax Table / Tax Computation Worksheet tax,
$2,000 / $500 credits on line 19, withholding on line 25a/25d.

| File | Total income (9) | Deduction (12) | Taxable income (15) | Total tax (24) | Result |
|---|---|---|---|---|---|
| `01-single_0dep_pec-none_da-no_tpd-no_refund-checking` | 52,000 | 14,600 | 37,400 | 4,259 | Refund 1,841 |
| `02-single_0dep_pec-you_da-yes_tpd-yes_owe` | 88,640 | 14,600 | 74,040 | 11,339 | Owe 1,539 |
| `03-single_0dep_claimed-as-dependent_pec-none_da-no_tpd-no_refund-savings` | 9,800 | 10,250 | 0 | 0 | Refund 640 |
| `04-single_0dep_age65-blind_ip-pin_pec-you_da-no_tpd-no_refund-checking` | 43,200 | 18,500 | 24,700 | 2,735 | Refund 765 |
| `05-single_0dep_foreign-address_pec-none_da-yes_tpd-no_refund-checking` | 67,000 | 14,600 | 52,400 | 6,587 | Refund 1,613 |
| `06-single_1dep-odc_pec-you_da-no_tpd-no_refund-checking` | 58,000 | 14,600 | 43,400 | 4,479 | Refund 1,921 |
| `07-mfj_0dep_pec-both_da-no_tpd-no_refund-checking` | 143,150 | 29,200 | 113,950 | 15,175 | Refund 2,625 |
| `08-mfj_0dep_pec-you_da-yes_tpd-yes_owe` | 118,000 | 29,200 | 88,800 | 10,195 | Owe 295 |
| `09-mfj_0dep_pec-spouse_both-age65_spouse-blind_ip-pin-both_da-no_tpd-no_refund-savings` | 42,800 | 33,850 | 8,950 | 898 | Refund 1,702 |
| `10-mfj_1dep-ctc_pec-none_da-no_tpd-no_refund-checking` | 124,000 | 29,200 | 94,800 | 8,968 | Refund 4,932 |
| `11-mfj_2dep-ctc-odc_apt_pec-both_da-yes_tpd-no_refund-savings` | 156,900 | 29,200 | 127,700 | 15,700 | Refund 3,800 |
| `12-mfj_4dep-3ctc-1odc_pec-you_da-no_tpd-yes_refund-checking` | 131,000 | 29,200 | 101,800 | 6,002 | Refund 5,998 |
| `13-mfj_more-than-4dep_pec-both_da-yes_tpd-no_owe` | 210,000 | 29,200 | 180,800 | 19,882 | Owe 2,882 |
| `14-mfj_nonresident-spouse-as-resident_0dep_pec-you_da-no_tpd-no_refund-checking` | 98,000 | 29,200 | 68,800 | 7,795 | Refund 1,205 |
| `15-mfs_0dep_pec-you_da-no_tpd-no_refund-checking` | 94,000 | 14,600 | 79,400 | 12,527 | Refund 1,673 |
| `16-mfs_1dep-ctc_spouse-itemizes_pec-none_da-no_tpd-no_owe` | 61,000 | 13,250 | 47,750 | 3,564 | Owe 1,064 |
| `17-mfs_0dep_pec-none_da-yes_tpd-yes_refund-savings` | 127,800 | 14,600 | 113,200 | 20,211 | Refund 6,289 |
| `18-hoh_1dep-ctc_pec-you_da-no_tpd-no_refund-checking` | 54,000 | 21,900 | 32,100 | 1,524 | Refund 2,776 |
| `19-hoh_3dep-2ctc-1odc_pec-none_da-yes_tpd-yes_refund-savings` | 76,310 | 21,900 | 54,410 | 1,700 | Refund 5,700 |
| `20-hoh_qualifying-child-not-dependent_0dep_age65_pec-you_da-no_tpd-no_owe` | 72,000 | 23,850 | 48,150 | 5,450 | Owe 1,450 |
| `21-qss_1dep-ctc_pec-you_da-no_tpd-no_refund-checking` | 89,000 | 29,200 | 59,800 | 4,715 | Refund 3,185 |
| `22-qss_2dep-ctc_pec-none_da-yes_tpd-yes_owe` | 105,000 | 29,200 | 75,800 | 4,635 | Owe 1,635 |
| `23-mfj_1dep-odc_spouse-age65_ip-pin-you_pec-spouse_da-no_tpd-no_refund-checking` | 83,000 | 30,750 | 52,250 | 5,309 | Refund 1,591 |

These files have not been run through Azure yet; the `Expected result` sections above apply only to the
rivera / chen / sample files. Fields the app does not read from a 1040 (dates of birth, Presidential Election
Campaign, age/blindness, IP PIN, CTC/ODC eligibility) are on the forms so the reader can be checked for not
mis-filing them.
