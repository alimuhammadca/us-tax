# Prior-year return import — first step in both products

Question investigated (2026-10-12): do TurboTax and H&R Block start by inviting the user to upload last
year's return, use it to pre-fill the taxpayer's information, and let the user skip to manual entry?

**Answer: yes in both — with two important qualifications:** (1) a *PDF* of last year's return fills only
the personal/identity basics; the full carry-forward needs the product's own *data file*; (2) neither takes
a scan or photo — the PDF must be the software-generated return.

Evidence: live screens (TT#001, HRB#002–#004), the in-app help text (TurboTax `Forms\1040_24\dhtmlhelp\hyper.xml`,
H&R Block `Program\US\Screens\GettingStarted.cxml`), and extracted screens. The import itself was **not**
executed in either walk-through (both chose Skip / Continue Without Transferring).

## Side by side

| | TurboTax Deluxe 2024 | H&R Block 2025 |
|---|---|---|
| Where | First screen after **Begin**: "Let's Find and Transfer Last Year's Tax Return" (TT#001) | First screen after **Start a Return**: "How do you want to import your taxes from last year?" (HRB#002) |
| How it finds the file | Auto-searches the computer for tax files and lists them (File Name / Last Modified), plus **Browse** and **Import From TurboTax Online** | User picks a radio, then a file-picker (data file) or a **drag-and-drop box** (PDF) — "Let's upload your 2024 return" |
| Accepted inputs | `.tax2023` (own data file); **PDF** from TurboTax, **H&R Block** or **TaxAct** | `.T24` (own data file) **or a TurboTax `.tax2024` data file** (recommended); PDF of the 2024 return |
| Not accepted | — | "Don't upload any tax documents (Ex: W-2) now or a scanned copy of your return – we won't be able to import them." Password-protected PDFs, more than one file at a time |
| Skip | **Continue Without Transferring** (TT#001) | **Skip** button (HRB#002) |
| Then | Interview starts at "What's Your Name?" (manual) | Offers Quicken/TXF financial-software import (Y/N, default No, HRB#004), then "Let's start on your basic info." |
| Late import | Via File › Transfer on a new return | "Can I import last year's data into a return I've already started? **No.** To import data from last year, you need to create a completely new return." |

## What gets filled in

**From a PDF (both products — personal basics only).** TurboTax help, verbatim:
> "Only the following information will transfer from a PDF file: Name, address, and filing status · Social
> Security number · Adjusted Gross Income · Dependent information · Bank information for direct deposit of tax
> refunds"

H&R Block help: "If you don't have the data file, we can import your **personal info** from the PDF."

**From the product's data file (personal + tax data).**
- H&R Block: "We import basic information such as your name, address, and dependent information. We also import
  information that is likely to remain the same from year to year from your W-2s, 1099s, and other tax forms."
- TurboTax help (scattered across topics) shows a transferred data file also brings: prior-year AGI for the
  e-file signature, prior-year tax liability (Form 2210 safe harbor), carryovers (Federal Carryover Worksheet —
  capital loss, §179, at-risk Form 6198, passive, energy credit), depreciable assets and vehicles, pension
  "amount previously recovered tax-free", seller-financed mortgage payer details, and last year's payers
  (W-2 employers, 1099-MISC/NEC, mortgage lenders). Marketing copy: "Fill out up to half your info for you ·
  Get your tax breaks from last year · Make electronic filing fast and easy · Connect your bank info to your
  refund."

## After the import — review is mandatory in spirit
- H&R Block: "Great news! We've successfully imported your return" → **"Here's what we pulled in from your 2024
  return"** summary → "Review Your Imported Information": a **Review Last Year's Data report** (per form: field
  description + 2024 value) and, in the interview, **"The information you imported is in brown."** "Whether you
  import the data file directly or upload a PDF, we'll always have you review the info after."
- TurboTax: list summaries switch to "Carefully review any items transferred from last year or imported"; a
  cleanup screen "Do You Still Need These Forms? — You have forms that transferred from last year that you did
  not use… we will remove them to simplify e-filing."
- Both: imported values stay editable/deletable in the interview.

## Implications for us-tax
1. We already have the pieces: Azure Document Intelligence extraction (statements) and the multi-year
   carryforward bridges (`importedPriorYear*`). A prior-year **1040 PDF import** would be the third.
2. We can do better than both competitors on PDFs: Azure OCR can read **scanned/photographed** returns, and the
   1040 + schedules carry more than the five identity items they take (e.g. last year's state refund context,
   itemized-vs-standard, carryover-relevant schedule lines).
3. Copy the review step: a "Here's what we pulled in" summary, imported values visibly tagged with their source
   (our A1 provenance rule), and editable in place.
4. Allow import into an existing return (merge with a field-by-field conflict view) — both competitors force a
   new return, which is a real usability gap.
5. Prior-year AGI from the import also feeds the e-file identity check.
