"""Builds the fictional 2024 Form 1040 test files for Personal > Last year 1040.

    python make_1040.py <blank f1040--2024.pdf>

Output: <name>-1040-2024.pdf (flattened: no form fields, no XFA, so every viewer shows the data)
plus <name>-1040-2024-page-N.png. Text fields are baked into the page; checkboxes are drawn as
vector lines, because a check-mark font is not available in every viewer.
Blank form: https://www.irs.gov/pub/irs-prior/f1040--2024.pdf
Field names were identified from the printed labels next to each widget (2024 revision).
"""
import sys
import fitz  # PyMuPDF

# Checkbox keys: (field name, test on the widget rect) — the 2024 form reuses names across boxes.
HOH = ('c1_3', lambda r: r.x0 > 300 and abs(r.y0 - 199) < 3)
MFJ = ('c1_3', lambda r: r.x0 < 200 and abs(r.y0 - 211) < 3)
MFS = ('c1_3', lambda r: r.x0 < 200 and abs(r.y0 - 224) < 3)
DIGITAL_NO = ('c1_5', lambda r: r.x0 > 530)
CTC_ROW1 = ('c1_14', lambda r: True)
CTC_ROW2 = ('c1_16', lambda r: True)
CHECKING = ('c2_5', lambda r: r.x0 < 400)
SAVINGS = ('c2_5', lambda r: r.x0 > 400)
DESIGNEE_YES = ('c2_6', lambda r: r.x0 < 450)
DESIGNEE_NO = ('c2_6', lambda r: r.x0 > 450)

HOUSEHOLDS = {
    # Head of household, two children, apartment, savings account, third-party designee.
    'rivera': {
        'text': {
            'f1_04': 'MORGAN A', 'f1_05': 'RIVERA', 'f1_06': '412551234',
            'f1_10': '2450 OAK RIDGE DR', 'f1_11': '12B', 'f1_12': 'COLUMBUS', 'f1_13': 'OH', 'f1_14': '43215',
            'f1_20': 'AVA RIVERA', 'f1_21': '412551235', 'f1_22': 'DAUGHTER',
            'f1_23': 'NOAH RIVERA', 'f1_24': '412551236', 'f1_25': 'SON',
            'f1_32': '68,500', 'f1_41': '68,500', 'f1_43': '320', 'f1_54': '68,820', 'f1_56': '68,820',
            'f1_57': '21,900', 'f1_59': '21,900', 'f1_60': '46,920',
            'f2_02': '5,299', 'f2_05': '4,000', 'f2_07': '4,000', 'f2_08': '1,299', 'f2_10': '1,299',
            'f2_11': '5,400', 'f2_14': '5,400', 'f2_22': '5,400', 'f2_23': '4,101', 'f2_24': '4,101',
            'f2_25': '041000124', 'f2_26': '9876543210',
            'f2_30': 'DANA RIVERA', 'f2_31': '614-555-0199', 'f2_32': '24680',
            'f2_33': 'REGISTERED NURSE', 'f2_37': '614-555-0142', 'f2_38': 'morgan.rivera@example.com',
        },
        'checks': [HOH, DIGITAL_NO, CTC_ROW1, CTC_ROW2, SAVINGS, DESIGNEE_YES],
    },
    # Married filing separately: the spouse's NAME goes on the filing-status line (f1_18) and their SSN in the
    # spouse SSN box; the "If joint return, spouse's first name" line stays empty. No dependents.
    'chen': {
        'text': {
            'f1_04': 'TAYLOR J', 'f1_05': 'CHEN', 'f1_06': '433221234',
            'f1_09': '433226789',
            'f1_10': '88 LAKEVIEW AVE', 'f1_12': 'MADISON', 'f1_13': 'WI', 'f1_14': '53703',
            'f1_18': 'ALEX CHEN',
            'f1_32': '72,000', 'f1_41': '72,000', 'f1_54': '72,000', 'f1_56': '72,000',
            'f1_57': '14,600', 'f1_59': '14,600', 'f1_60': '57,400',
            'f2_02': '7,681', 'f2_08': '7,681', 'f2_10': '7,681',
            'f2_11': '8,200', 'f2_14': '8,200', 'f2_22': '8,200', 'f2_23': '519', 'f2_24': '519',
            'f2_25': '075000022', 'f2_26': '55501234',
            'f2_33': 'ACCOUNTANT', 'f2_37': '608-555-0177', 'f2_38': 'taylor.chen@example.com',
        },
        'checks': [MFS, DIGITAL_NO, CHECKING, DESIGNEE_NO],
    },
    # Married filing jointly, one child, checking account, no designee (the e2e household).
    'sample': {
        'text': {
            'f1_04': 'JORDAN M', 'f1_05': 'SAMPLE', 'f1_06': '400123456',
            'f1_07': 'CASEY', 'f1_08': 'SAMPLE', 'f1_09': '400123457',
            'f1_10': '100 MAIN ST', 'f1_11': '4', 'f1_12': 'SPRINGFIELD', 'f1_13': 'IL', 'f1_14': '62701',
            'f1_20': 'RILEY SAMPLE', 'f1_21': '400123458', 'f1_22': 'SON',
            'f1_32': '137,000', 'f1_41': '137,000', 'f1_43': '1,850', 'f1_44': '1,900', 'f1_45': '2,400',
            'f1_52': '4,100', 'f1_54': '145,350', 'f1_55': '2,300', 'f1_56': '143,050', 'f1_57': '29,200',
            'f1_59': '29,200', 'f1_60': '113,850',
            'f2_02': '15,233', 'f2_10': '12,233', 'f2_11': '13,100', 'f2_14': '13,100', 'f2_22': '13,200',
            'f2_23': '967', 'f2_24': '967', 'f2_25': '071000013', 'f2_26': '123456789',
            'f2_33': 'SOFTWARE TESTER', 'f2_35': 'TEACHER', 'f2_37': '217-555-0100', 'f2_38': 'jordan@example.com',
        },
        'checks': [MFJ, DIGITAL_NO, CTC_ROW1, CHECKING, DESIGNEE_NO],
    },
}


def build(blank: str, name: str, spec: dict) -> None:
    doc = fitz.open(blank)
    marks = []  # (page, rect) of boxes to tick
    for page in doc:
        for w in page.widgets():
            short = w.field_name.split('.')[-1].split('[')[0]
            if w.field_type_string in ('CheckBox', 'RadioButton'):
                if any(short == key and test(w.rect) for key, test in spec['checks']):
                    marks.append((page.number, fitz.Rect(w.rect)))
                w.field_value = False
                w.update()
            elif short in spec['text']:
                w.field_value = spec['text'][short]
                w.update()
    doc.xref_set_key(doc.pdf_catalog(), 'AcroForm/XFA', 'null')  # the XFA layer is what blank viewers show
    doc.bake(annots=True, widgets=True)
    for pno, r in marks:  # vector tick, viewer-independent
        shape = doc[pno].new_shape()
        inset = r.width * 0.2
        shape.draw_line(fitz.Point(r.x0 + inset, r.y0 + r.height * 0.55), fitz.Point(r.x0 + r.width * 0.42, r.y1 - inset))
        shape.draw_line(fitz.Point(r.x0 + r.width * 0.42, r.y1 - inset), fitz.Point(r.x1 - inset, r.y0 + inset))
        shape.finish(color=(0, 0, 0), width=1.3)
        shape.commit()
    out = f'{name}-1040-2024'
    doc.save(f'{out}.pdf', garbage=3, deflate=True)
    for page in doc:
        page.get_pixmap(dpi=150).save(f'{out}-page-{page.number + 1}.png')
    print(f'{out}.pdf  ticks={len(marks)}')


if __name__ == '__main__':
    for hh_name, hh_spec in HOUSEHOLDS.items():
        build(sys.argv[1], hh_name, hh_spec)
