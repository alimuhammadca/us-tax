"""
Fill IRS PDF form templates with sample data for all 38 statement types.
Uses the actual fillable PDFs from C:\\us-tax\\pdfs as source templates.

Strategy: For each PDF, enumerate ALL text fields on the first copy/page,
assign sample values based on field position and the CSV semantic names.
"""
import os, csv, re
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, BooleanObject

PDFS_DIR = r"C:\us-tax\pdfs"
OUT_DIR = r"C:\us-tax\test_statements"

FORMS = {
    "w-2": "fw2",
    "w-2g": "fw2g",
    "1099-nec": "f1099nec",
    "1099-misc": "f1099msc",
    "1099-k": "f1099k",
    "1095-a": "f1095a",
    "1095-b": "f1095b",
    "1095-c": "f1095c",
    "1098-t": "f1098t",
    "1099-e": "f1098e",
    "1099-q": "f1099q",
    "1099-qa": "f1099qa",
    "1099-ltc": "f1099ltc",
    "1099-sa": "f1099sa",
    "1099-int": "f1099int",
    "1099-div": "f1099div",
    "1099-oid": "f1099oid",
    "1099-b": "f1099b",
    "1099-da": "f1099da",
    "1099-cap": "f1099cap",
    "2439": "f2439",
    "3921": "f3921",
    "6781": "f6781",
    "child-interest-dividends": "f8814",
    "8606": "f8606",
    "1099-r": "f1099r",
    "5498": "f5498",
    "ssa-1099": "fssa1099",
    "1099-a": "f1099a",
    "1099-c": "f1099c",
    "1099-g": "f1099g",
    "1099-s": "f1099s",
    "4684": "f4684",
    "4797": "f4797",
    "6252": "f6252",
    "8824": "f8824",
    "schedule-k1-1041": "schedule_k1_form_1041",
    "schedule-k1-1065": "schedule_k1_form_1065",
    "schedule-k1-1120s": "schedule_k1_form_1120s",
    "1099-ptr": "f1099ptr",
}


def load_csv_semantic_map(csv_path):
    """Load CSV → dict of {old_field_name: semantic_field_name}."""
    result = {}
    if not os.path.exists(csv_path):
        return result
    with open(csv_path, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            old = row.get("old_field_name", "").strip()
            sem = row.get("semantic_field_name", "").strip()
            if old and sem:
                result[old] = sem
    return result


def guess_value_from_semantic(sem_name, field_name_lower):
    """Given a semantic field name, return an appropriate sample value."""
    s = sem_name.lower()

    # SSN/TIN/EIN patterns
    if any(k in s for k in ["ssn", "social_security_number", "taxpayer_id", "recipient_tin"]):
        return "123-45-6789"
    if any(k in s for k in ["ein", "employer_id", "payer_tin", "filer_tin", "payer_federal",
                             "corrected_payer", "issuer_ein", "lender_tin", "trustee_tin",
                             "creditor_tin", "filer_federal", "corporation_tin", "cooperative_tin"]):
        return "25-1234567"

    # Name patterns
    if any(k in s for k in ["recipient_name", "employee_name", "borrower_name",
                             "policyholder_name", "insured_name", "winner_name",
                             "beneficiary_name", "participant_name", "patron_name",
                             "shareholder_name", "partner_name", "student_name",
                             "transferor_name", "annuitant_name", "child_name",
                             "debtor_name", "customer_name"]):
        return "ELIZABETH A JOHNSON"
    if "first_name" in s:
        return "ELIZABETH A"
    if "last_name" in s:
        return "JOHNSON"
    if any(k in s for k in ["payer_name", "employer_name", "filer_name", "issuer_name",
                             "lender_name", "trustee_name", "creditor_name",
                             "corporation_name", "cooperative_name", "company_name",
                             "partnership_name", "estate_name", "fiduciary_name"]):
        return "ACME CORPORATION"

    # Address patterns
    if any(k in s for k in ["street", "address_line_1", "address1"]):
        return "2001 CAMPUS DRIVE"
    if any(k in s for k in ["city_state_zip", "address_line_2", "address2", "city"]):
        return "PITTSBURGH, PA 15237"
    if "address" in s and "email" not in s:
        return "2001 CAMPUS DRIVE, PITTSBURGH, PA 15237"
    if s.endswith("_state") or s == "state":
        return "PA"
    if "zip" in s:
        return "15237"

    # Account / control number
    if "account" in s:
        return "****4567"
    if "control" in s:
        return "W2-00487"

    # Date patterns
    if any(k in s for k in ["date_acquired", "date_granted", "date_of_birth", "start_date"]):
        return "03/15/2023"
    if any(k in s for k in ["date_sold", "date_exercised", "date_of_closing", "end_date",
                             "date_of_event", "date_of_abandonment", "date_won"]):
        return "06/20/2025"
    if "calendar_year" in s or "tax_year" in s:
        return "2025"
    if "date" in s:
        return "12/31/2025"

    # Phone
    if "phone" in s or "telephone" in s:
        return "412-555-0199"

    # Percentage
    if "percent" in s or "share" in s and ("profit" in s or "loss" in s or "capital" in s):
        return "25"

    # Dollar amount patterns (most common)
    if any(k in s for k in ["wages", "compensation", "wage"]):
        return "48750.00"
    if any(k in s for k in ["federal_income_tax_withheld", "fed_tax_withheld",
                             "federal_tax_withheld"]):
        return "7631.62"
    if "social_security_wages" in s:
        return "48750.00"
    if "social_security_tax" in s:
        return "3021.65"
    if "medicare_wages" in s:
        return "48750.00"
    if "medicare_tax" in s:
        return "706.68"
    if any(k in s for k in ["nonemployee", "nec"]):
        return "32500.00"
    if any(k in s for k in ["ordinary_dividend", "total_ordinary"]):
        return "3456.78"
    if "qualified_dividend" in s:
        return "2890.12"
    if "capital_gain" in s:
        return "1234.56"
    if "interest_income" in s or (s.endswith("_interest") and "loan" not in s):
        return "1245.87"
    if "student_loan" in s:
        return "2450.00"
    if "gross_distribution" in s or "gross_amount" in s:
        return "25000.00"
    if "taxable_amount" in s:
        return "25000.00"
    if any(k in s for k in ["tax_withheld", "withh", "voluntary_federal"]):
        return "2500.00"
    if "foreign_tax" in s:
        return "145.23"
    if any(k in s for k in ["proceed", "gross_sales", "sales_price"]):
        return "22500.00"
    if any(k in s for k in ["cost", "basis", "adjusted_basis"]):
        return "15200.00"
    if any(k in s for k in ["rent", "rental"]):
        return "18000.00"
    if any(k in s for k in ["scholarship", "grant"]):
        return "3000.00"
    if any(k in s for k in ["payment", "premium", "tuition"]):
        return "12500.00"
    if "unemployment" in s:
        return "8400.00"
    if any(k in s for k in ["refund", "credit", "offset"]):
        return "1250.00"
    if any(k in s for k in ["contribution", "ira"]):
        return "7000.00"
    if "fair_market" in s or "fmv" in s:
        return "185000.00"
    if "benefit" in s:
        return "22800.00"
    if any(k in s for k in ["exercise_price", "option_price"]):
        return "12.50"
    if any(k in s for k in ["market_value", "share_price"]):
        return "45.00"
    if "number_of_shares" in s or "shares" in s:
        return "1000"
    if "distribution_code" in s:
        return "7"
    if "type_of_wager" in s:
        return "Slot machine"
    if "description" in s or "property" in s:
        return "Investment property"
    if "locality" in s:
        return "PITTSBURGH"
    if "foreign_country" in s:
        return "Various"
    if "code" in s and "letter" in s:
        return "D"
    if "code" in s:
        return "1"

    # Generic amount - if field name looks like a dollar field
    if any(k in s for k in ["amount", "total", "income", "earning", "gain",
                             "loss", "deduction", "expense", "value", "price",
                             "balance", "principal", "allocation", "patronage",
                             "royalt", "other_income"]):
        return "5000.00"

    # Year field
    if "year" in s:
        return "2025"

    # Generic text fallback for non-amount fields
    return None


def fill_pdf_with_csv(pdf_path, csv_path, output_path):
    """Fill PDF using semantic field names from CSV to determine values."""
    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    writer.append(reader)

    sem_map = load_csv_semantic_map(csv_path)
    fields = reader.get_fields() or {}
    filled = 0

    # Build updates per page
    all_updates = {}
    for full_name, field_obj in fields.items():
        ft = field_obj.get("/FT", "")
        if ft != "/Tx":
            continue

        short = full_name.split(".")[-1]

        # Find semantic name: try the short name first, then the old field patterns
        sem = sem_map.get(short, "")
        if not sem:
            # Try matching by extracting the original field pattern (e.g., f1_09[0])
            m = re.search(r'(f\d+_\d+)\[?\d?\]?', short)
            if m:
                old_pattern = m.group(1) + "[0]"
                sem = sem_map.get(old_pattern, "")

        if not sem:
            sem = short

        value = guess_value_from_semantic(sem, short.lower())
        if value is not None:
            all_updates[full_name] = value
            filled += 1

    # Apply to each page
    for page_idx in range(len(writer.pages)):
        try:
            writer.update_page_form_field_values(
                writer.pages[page_idx], all_updates, auto_regenerate=False
            )
        except Exception:
            pass

    # NeedAppearances flag
    try:
        if hasattr(writer, '_root_object'):
            acro = writer._root_object.get('/AcroForm')
            if acro:
                acro_obj = acro.get_object() if hasattr(acro, 'get_object') else acro
                acro_obj[NameObject('/NeedAppearances')] = BooleanObject(True)
    except Exception:
        pass

    with open(output_path, "wb") as f:
        writer.write(f)
    return filled


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    # Clean old samples
    for f in os.listdir(OUT_DIR):
        if f.endswith("_sample.pdf"):
            os.remove(os.path.join(OUT_DIR, f))

    total = 0
    skipped = []

    for form_id, prefix in FORMS.items():
        pdf_path = os.path.join(PDFS_DIR, f"{prefix}_semantic_labels.pdf")
        csv_path = os.path.join(PDFS_DIR, f"{prefix}_field_map_semantic.csv")
        output_path = os.path.join(OUT_DIR, f"{form_id}_sample.pdf")

        if not os.path.exists(pdf_path):
            skipped.append(form_id)
            continue

        filled = fill_pdf_with_csv(pdf_path, csv_path, output_path)
        print(f"  {form_id}: {filled} fields filled -> {os.path.basename(output_path)}")
        total += 1

    print(f"\nGenerated {total} sample PDFs in {OUT_DIR}")
    if skipped:
        print(f"Skipped (no source PDF): {', '.join(skipped)}")


if __name__ == "__main__":
    main()
