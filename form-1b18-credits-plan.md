# 1B-18 plan - own-business credit forms 6765, 8941, 8826, 8844

Owner-approved 2026-11-25 (option b: all four in full). Sources in docs/IRS-Forms (Form 6765 Rev. 12-2024, Form 8941 2025, Form 8826
Rev. 9-2017, Form 8844 Rev. 3-2020) and docs/books (Instructions for Forms 6765 Rev. 12-2025, 8941 2025, 8844 Rev. 12-2021; Form 8826 has its instructions on the form).
Form 8881 (form-8881-plan.md) is the model: one copy per person (each spouse's own businesses), Form 3800 Part III lines, the
deduction cut where the law requires it.

## Stage A - blank previews (done 2026-11-25, waiting for the owner's visual review)

- Field names: auto-name-form-fields.py (the printed line number beside each field) + fix-form-maps-1b18.py (header, yes/no items,
  Form 6765 Section G by business component 1-15 / totals and column 49(a)-56), checked with check-form-map.py. Maps in
  scripts/form-maps/<base>.json; generate-semantic-from-map.js and generate-elements-from-csv.py make the CSV, labelled PDF and layout.
- form-tax-return-6765 / 8941 / 8826 / 8844 (pure HTML/CSS), one per person in the Tax Return sidebar, reading
  attachedForms.form<n>List by ownerRole; e2e tax-return-1b18-credit-previews.spec.ts.
- Form 8826 lines 2 and 4 print "$250 00" and "$10,000 00" as field values on the IRS PDF; the preview fills them with the computation.

## Stage B - screens and compute (after the review)

**Form 8826 - Disabled access credit (IRC 44)** -> Form 3800 Part III line 1e. Eligible small business: gross receipts of $1 million
or less last year, or no more than 30 full-time employees. Screen: the business (Schedule C / F), eligibility (gross receipts last
year, full-time employees), eligible access expenditures. Line 3 = line 1 - $250; line 5 = min(line 3, $10,000); line 6 = 50%; line 7
K-1 code K; line 8 at most $5,000. The credit reduces the basis / deduction of the expenditures (IRC 44(d)(7)).

**Form 8844 - Empowerment zone employment credit (IRC 1396)** -> Form 3800 Part III line 3 (Section B; specified credit for the
AMT? no - line 3 is Section B, allowed against regular tax only as 3800 directs). Screen: the business, qualified zone wages (at most
$15,000 per employee), number of qualified employees. Line 2 = 20%; line 3 K-1 code L. The wage deduction is reduced by line 2 (IRC
280C(a)).

**Form 6765 - Credit for increasing research activities (IRC 41)** -> Form 3800 Part III line 1c, or line 4i for an eligible small
business (gross receipts of $50 million or less, not publicly traded). Screen: the business, item A (section 280C reduced credit),
item B (controlled group), Section F (qualified wages, officers' wages, supplies, computer rental, contract research, basic research
payments), the method (Section A regular / Section B alternative simplified), Section A inputs (energy consortia, basic research
payments, qualified organization base period amount, fixed-base percentage, average annual gross receipts), Section B inputs (prior 3
years' QREs), Section E (business components, acquisitions / dispositions, new categories, ASC 730). Section D (payroll tax election)
is for a qualified small business that is a corporation or partnership - shown as not available. Section G is optional for 2025 -
not asked. Section 280C(c): without the election the QREs deduction is reduced; with it the credit is reduced (15.8% / 79%).

**Form 8941 - Credit for small employer health insurance premiums (IRC 45R)** -> Form 3800 Part III line 4h (specified credit).
Screen: line A (SHOP Marketplace, identifier), line B (EIN), line C (an earlier return 2014-2023 claimed it - stop), the Worksheet 1-7
inputs (employees, hours for FTEs, wages, premiums paid, average small group premium by state, state subsidies, payroll taxes for a
tax-exempt employer not applicable), the 2-consecutive-year limit. Lines 1-16 figured as printed (FTE and average wage phase-downs).
The premium deduction is reduced by the credit (IRC 280C(h)).

**Common:** pf_* tables (one migration), Form 3800 lines through Form3800Current (+ the K-1 codes merged as for Form 8881), the
deduction cuts, the previews filled, unit and e2e tests.
