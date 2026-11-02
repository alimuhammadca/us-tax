"""Builds the scenario set of fictional 2024 Form 1040 test files for Personal > Last year 1040.

    python make_1040_scenarios.py <blank f1040--2024.pdf>

Output, in scenarios/: for every scenario <name>.pdf (flattened, both pages), <name>.png and <name>.jpg (both pages
stacked in one image at 150 dpi; the app splits a stacked image into pages). Names are built from the combination
each file covers - see README.md for the key. All people, SSNs, addresses and numbers are fictional.

Amounts follow the 2024 rules: standard deduction (with the age-65/blind additions and the claimed-as-a-dependent
limit), tax from the Tax Table (income under $100,000: the middle of the $50 row) or the Tax Computation Worksheet,
the $2,000 child tax credit and $500 credit for other dependents (limited to the tax), then refund or amount owed.
Blank form: https://www.irs.gov/pub/irs-prior/f1040--2024.pdf
"""
import io
import os
import sys
import fitz  # PyMuPDF
from PIL import Image

# ---- checkbox widgets: (field name, test on the widget rect) - the 2024 form reuses names across boxes ----
CB = {
    'pec_you': ('c1_1', lambda r: True),
    'pec_spouse': ('c1_2', lambda r: True),
    'single': ('c1_3', lambda r: r.x0 < 200 and abs(r.y0 - 200) < 3),
    'mfj': ('c1_3', lambda r: r.x0 < 200 and abs(r.y0 - 212) < 3),
    'mfs': ('c1_3', lambda r: r.x0 < 200 and abs(r.y0 - 224) < 3),
    'hoh': ('c1_3', lambda r: r.x0 > 300 and abs(r.y0 - 200) < 3),
    'qss': ('c1_3', lambda r: r.x0 > 300 and abs(r.y0 - 224) < 3),
    'nra_spouse': ('c1_4', lambda r: True),
    'da_yes': ('c1_5', lambda r: r.x0 < 520),
    'da_no': ('c1_5', lambda r: r.x0 > 520),
    'you_dependent': ('c1_6', lambda r: True),
    'spouse_dependent': ('c1_7', lambda r: True),
    'spouse_itemizes': ('c1_8', lambda r: True),
    'you_65': ('c1_9', lambda r: True),
    'you_blind': ('c1_10', lambda r: True),
    'spouse_65': ('c1_11', lambda r: True),
    'spouse_blind': ('c1_12', lambda r: True),
    'more_than_4': ('c1_13', lambda r: True),
    'ctc1': ('c1_14', lambda r: True), 'odc1': ('c1_15', lambda r: True),
    'ctc2': ('c1_16', lambda r: True), 'odc2': ('c1_17', lambda r: True),
    'ctc3': ('c1_18', lambda r: True), 'odc3': ('c1_19', lambda r: True),
    'ctc4': ('c1_20', lambda r: True), 'odc4': ('c1_21', lambda r: True),
    'checking': ('c2_5', lambda r: r.x0 < 400),
    'savings': ('c2_5', lambda r: r.x0 > 400),
    'tpd_yes': ('c2_6', lambda r: r.x0 < 450),
    'tpd_no': ('c2_6', lambda r: r.x0 > 450),
}
DEP_FIELDS = [('f1_20', 'f1_21', 'f1_22'), ('f1_23', 'f1_24', 'f1_25'), ('f1_26', 'f1_27', 'f1_28'), ('f1_29', 'f1_30', 'f1_31')]

# ---- 2024 constants ----
STD = {'single': 14600, 'mfs': 14600, 'mfj': 29200, 'qss': 29200, 'hoh': 21900}
ADDL = {'single': 1950, 'hoh': 1950, 'mfj': 1550, 'mfs': 1550, 'qss': 1550}
BRACKETS = {  # upper bound of each rate band
    'single': [11600, 47150, 100525, 191950, 243725, 609350],
    'mfs': [11600, 47150, 100525, 191950, 243725, 365600],
    'mfj': [23200, 94300, 201050, 383900, 487450, 731200],
    'qss': [23200, 94300, 201050, 383900, 487450, 731200],
    'hoh': [16550, 63100, 100500, 191950, 243700, 609350],
}
RATES = [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37]


def schedule_tax(ti: float, fs: str) -> float:
    tax, lower = 0.0, 0
    for upper, rate in zip(BRACKETS[fs] + [float('inf')], RATES):
        if ti > lower:
            tax += (min(ti, upper) - lower) * rate
        lower = upper
    return tax


def tax_2024(ti: int, fs: str) -> int:
    if ti <= 0:
        return 0
    if ti < 100000:  # Tax Table: the tax on the middle of the row
        width = 5 if ti < 25 else 25 if ti < 3000 else 50
        lo = ti - ti % width
        return int(schedule_tax(lo + width / 2, fs) + 0.5)
    return int(schedule_tax(ti, fs) + 0.5)


def money(n: int) -> str:
    return f'{n:,}'


def compute(s: dict) -> dict:
    """Form 1040 lines 1a-38 for a scenario; returns {field: text}."""
    fs = s['fs']
    wages, interest = s['wages'], s.get('interest', 0)
    total = wages + interest
    if 'itemized' in s:
        deduction = s['itemized']
    else:
        base = STD[fs]
        if 'you_dependent' in s['checks']:
            base = min(base, max(1300, wages + 450))
        boxes = sum(1 for k in ('you_65', 'you_blind', 'spouse_65', 'spouse_blind') if k in s['checks'])
        deduction = base + boxes * ADDL[fs]
    ti = max(0, total - deduction)
    tax = tax_2024(ti, fs)
    # extra_ctc: children past the four rows (the "more than four dependents" box; listed on a statement).
    ctc = sum(1 for d in s.get('deps', []) if d[3] == 'ctc') + s.get('extra_ctc', 0)
    odc = sum(1 for d in s.get('deps', []) if d[3] == 'odc')
    credits = min(tax, ctc * 2000 + odc * 500)
    line22 = tax - credits
    w = s['withholding']
    t = {
        'f1_32': money(wages), 'f1_41': money(wages),
        'f1_54': money(total), 'f1_56': money(total), 'f1_57': money(deduction), 'f1_59': money(deduction),
        'f1_60': money(ti),
        'f2_02': money(tax), 'f2_04': money(tax), 'f2_08': money(line22), 'f2_10': money(line22),
        'f2_11': money(w), 'f2_14': money(w), 'f2_22': money(w),
    }
    if interest:
        t['f1_43'] = money(interest)
    if credits:
        t['f2_05'] = money(credits)
        t['f2_07'] = money(credits)
    if w >= line22:
        t['f2_23'] = money(w - line22)
        t['f2_24'] = money(w - line22)
        t['f2_25'], t['f2_26'] = s['bank']
    else:
        t['f2_28'] = money(line22 - w)
    s['_summary'] = dict(total=total, deduction=deduction, ti=ti, tax=tax, credits=credits, total_tax=line22,
                         refund=w - line22 if w >= line22 else None, owed=line22 - w if w < line22 else None)
    return t


def p(first_mi, last, ssn):
    return first_mi, last, ssn


# ---- scenarios ----------------------------------------------------------------------------------------------------
# you/spouse: (first name and initial, last name, SSN digits). deps: (name, SSN digits, relationship, 'ctc'|'odc').
# addr: (street, apt, city, state, zip) or a foreign address dict. bank: (routing, account) for a refund.
# checks: extra boxes (filing status, digital assets and designee boxes are added from the keys below).
US = lambda street, apt, city, st, z: dict(street=street, apt=apt, city=city, state=st, zip=z)

SCENARIOS = [
    dict(name='01-single_0dep_pec-none_da-no_tpd-no_refund-checking', fs='single', da=False,
         you=p('AVERY L', 'BROOKS', '400210001'), occ='GRAPHIC DESIGNER', phone='303-555-0101', email='avery.brooks@example.com',
         addr=US('1420 PINE ST', '', 'DENVER', 'CO', '80202'), wages=52000, withholding=6100, bank=('102000021', '4400110001'),
         savings=False, checks=[]),
    dict(name='02-single_0dep_pec-you_da-yes_tpd-yes_owe', fs='single', da=True, pec=('you',),
         you=p('JORDAN K', 'ELLIS', '400210002'), occ='SALES MANAGER', phone='512-555-0102', email='jordan.ellis@example.com',
         addr=US('77 RIVER BEND RD', '', 'AUSTIN', 'TX', '78701'), wages=88000, interest=640, withholding=9800,
         designee=('SAM ELLIS', '512-555-0190', '13579'), checks=[]),
    dict(name='03-single_0dep_claimed-as-dependent_pec-none_da-no_tpd-no_refund-savings', fs='single', da=False,
         you=p('MIA R', 'FOSTER', '400210003'), occ='STUDENT', phone='614-555-0103', email='mia.foster@example.com',
         addr=US('310 COLLEGE AVE', '5', 'ATHENS', 'OH', '45701'), wages=9800, withholding=640,
         bank=('044000024', '7700330003'), savings=True, checks=['you_dependent']),
    dict(name='04-single_0dep_age65-blind_ip-pin_pec-you_da-no_tpd-no_refund-checking', fs='single', da=False, pec=('you',),
         you=p('HAROLD T', 'GRANT', '400210004'), occ='RETIRED', phone='602-555-0104', email='harold.grant@example.com',
         addr=US('9 SAGUARO LN', '', 'PHOENIX', 'AZ', '85004'), wages=41000, interest=2200, withholding=3500,
         bank=('122100024', '5500440004'), ip_pin_you='482913', checks=['you_65', 'you_blind']),
    dict(name='05-single_0dep_foreign-address_pec-none_da-yes_tpd-no_refund-checking', fs='single', da=True,
         you=p('NINA C', 'HOLT', '400210005'), occ='ENGINEER', phone='303-555-0105', email='nina.holt@example.com',
         addr=dict(street='22 KING ST W', apt='1801', city='TORONTO', country='CANADA', province='ONTARIO', postal='M5H 1A1'),
         wages=67000, withholding=8200, bank=('102000021', '4400550005'), checks=[]),
    dict(name='06-single_1dep-odc_pec-you_da-no_tpd-no_refund-checking', fs='single', da=False, pec=('you',),
         you=p('OWEN P', 'IVERS', '400210006'), occ='ELECTRICIAN', phone='317-555-0106', email='owen.ivers@example.com',
         addr=US('48 MAPLE CT', '', 'INDIANAPOLIS', 'IN', '46204'), wages=58000, withholding=6400,
         bank=('074000010', '6600660006'), deps=[('RUTH IVERS', '400210061', 'MOTHER', 'odc')], checks=[]),
    dict(name='07-mfj_0dep_pec-both_da-no_tpd-no_refund-checking', fs='mfj', da=False, pec=('you', 'spouse'),
         you=p('DANIEL J', 'KIM', '400220001'), spouse=p('GRACE H', 'KIM', '400220002'), occ='PHARMACIST',
         spouse_occ='ARCHITECT', phone='206-555-0201', email='daniel.kim@example.com',
         addr=US('5100 LAKE WASHINGTON BLVD', '', 'SEATTLE', 'WA', '98118'), wages=142000, interest=1150,
         withholding=17800, bank=('125000024', '3300110007'), checks=[]),
    dict(name='08-mfj_0dep_pec-you_da-yes_tpd-yes_owe', fs='mfj', da=True, pec=('you',),
         you=p('LUIS A', 'MORALES', '400220003'), spouse=p('ELENA', 'MORALES', '400220004'), occ='CONTRACTOR',
         spouse_occ='NURSE', phone='305-555-0203', email='luis.morales@example.com',
         addr=US('1200 BRICKELL AVE', '2204', 'MIAMI', 'FL', '33131'), wages=118000, withholding=9900,
         designee=('PAT MORALES', '305-555-0290', '86420'), checks=[]),
    dict(name='09-mfj_0dep_pec-spouse_both-age65_spouse-blind_ip-pin-both_da-no_tpd-no_refund-savings', fs='mfj', da=False,
         pec=('spouse',), you=p('WALTER E', 'NASH', '400220005'), spouse=p('JUNE M', 'NASH', '400220006'),
         occ='RETIRED', spouse_occ='RETIRED', phone='207-555-0205', email='walter.nash@example.com',
         addr=US('16 HARBOR VIEW RD', '', 'PORTLAND', 'ME', '04101'), wages=38000, interest=4800, withholding=2600,
         bank=('011400495', '2200330009'), savings=True, ip_pin_you='305118', ip_pin_spouse='774260',
         checks=['you_65', 'spouse_65', 'spouse_blind']),
    dict(name='10-mfj_1dep-ctc_pec-none_da-no_tpd-no_refund-checking', fs='mfj', da=False,
         you=p('ETHAN B', 'OKAFOR', '400220007'), spouse=p('CHLOE', 'OKAFOR', '400220008'), occ='ACCOUNTANT',
         spouse_occ='DENTIST', phone='404-555-0207', email='ethan.okafor@example.com',
         addr=US('230 PEACHTREE ST NE', '', 'ATLANTA', 'GA', '30303'), wages=124000, withholding=13900,
         bank=('061000104', '1100220010'), deps=[('ZOE OKAFOR', '400220071', 'DAUGHTER', 'ctc')], checks=[]),
    dict(name='11-mfj_2dep-ctc-odc_apt_pec-both_da-yes_tpd-no_refund-savings', fs='mfj', da=True, pec=('you', 'spouse'),
         you=p('RAJ S', 'PATEL', '400220009'), spouse=p('PRIYA', 'PATEL', '400220010'), occ='SOFTWARE ENGINEER',
         spouse_occ='TEACHER', phone='732-555-0209', email='raj.patel@example.com',
         addr=US('85 MAIN ST', '3C', 'EDISON', 'NJ', '08817'), wages=156000, interest=900, withholding=19500,
         bank=('021200339', '9900110011'), savings=True,
         deps=[('ARJUN PATEL', '400220091', 'SON', 'ctc'), ('MEERA PATEL', '400220092', 'DAUGHTER', 'odc')], checks=[]),
    dict(name='12-mfj_4dep-3ctc-1odc_pec-you_da-no_tpd-yes_refund-checking', fs='mfj', da=False, pec=('you',),
         you=p('MARCUS D', 'QUINN', '400220011'), spouse=p('TASHA L', 'QUINN', '400220012'), occ='FIREFIGHTER',
         spouse_occ='PARALEGAL', phone='901-555-0211', email='marcus.quinn@example.com',
         addr=US('402 POPLAR AVE', '', 'MEMPHIS', 'TN', '38103'), wages=131000, withholding=12000,
         bank=('084000026', '8800220012'), designee=('TINA QUINN', '901-555-0299', '11223'),
         deps=[('JADEN QUINN', '400220111', 'SON', 'ctc'), ('KAYLA QUINN', '400220112', 'DAUGHTER', 'ctc'),
               ('LEO QUINN', '400220113', 'SON', 'ctc'), ('NIA QUINN', '400220114', 'DAUGHTER', 'odc')], checks=[]),
    dict(name='13-mfj_more-than-4dep_pec-both_da-yes_tpd-no_owe', fs='mfj', da=True, pec=('you', 'spouse'),
         you=p('SAMUEL O', 'REYES', '400220013'), spouse=p('ANA', 'REYES', '400220014'), occ='PHYSICIAN',
         spouse_occ='HOMEMAKER', phone='210-555-0213', email='samuel.reyes@example.com',
         addr=US('18 ALAMO PLAZA', '', 'SAN ANTONIO', 'TX', '78205'), wages=210000, withholding=17000,
         deps=[('DIEGO REYES', '400220131', 'SON', 'ctc'), ('LUCIA REYES', '400220132', 'DAUGHTER', 'ctc'),
               ('MATEO REYES', '400220133', 'SON', 'ctc'), ('SOFIA REYES', '400220134', 'DAUGHTER', 'ctc')],
         extra_ctc=1, checks=['more_than_4']),
    dict(name='14-mfj_nonresident-spouse-as-resident_0dep_pec-you_da-no_tpd-no_refund-checking', fs='mfj', da=False,
         pec=('you',), you=p('THOMAS W', 'SINGH', '400220015'), spouse=p('AIKO', 'SINGH', '400220016'),
         occ='PROFESSOR', spouse_occ='TRANSLATOR', phone='617-555-0215', email='thomas.singh@example.com',
         addr=US('75 COMMONWEALTH AVE', '6', 'BOSTON', 'MA', '02116'), wages=98000, withholding=9000,
         bank=('011000138', '7700110014'), nra_name='AIKO SINGH', checks=['nra_spouse']),
    dict(name='15-mfs_0dep_pec-you_da-no_tpd-no_refund-checking', fs='mfs', da=False, pec=('you',),
         you=p('CLAIRE V', 'TURNER', '400230001'), spouse_ssn='400230002', mfs_spouse_name='BRIAN TURNER',
         occ='MARKETING DIRECTOR', phone='312-555-0301', email='claire.turner@example.com',
         addr=US('600 N LAKE SHORE DR', '1205', 'CHICAGO', 'IL', '60611'), wages=94000, withholding=14200,
         bank=('071000013', '6600110015'), checks=[]),
    dict(name='16-mfs_1dep-ctc_spouse-itemizes_pec-none_da-no_tpd-no_owe', fs='mfs', da=False,
         you=p('DEREK M', 'UPTON', '400230003'), spouse_ssn='400230004', mfs_spouse_name='KAREN UPTON',
         occ='MECHANIC', phone='414-555-0303', email='derek.upton@example.com',
         addr=US('2120 W WISCONSIN AVE', '', 'MILWAUKEE', 'WI', '53233'), wages=61000, withholding=2500,
         itemized=13250, deps=[('EVAN UPTON', '400230031', 'SON', 'ctc')], checks=['spouse_itemizes']),
    dict(name='17-mfs_0dep_pec-none_da-yes_tpd-yes_refund-savings', fs='mfs', da=True,
         you=p('FIONA G', 'VANCE', '400230005'), spouse_ssn='400230006', mfs_spouse_name='GREGORY VANCE',
         occ='ATTORNEY', phone='503-555-0305', email='fiona.vance@example.com',
         addr=US('1001 SW 5TH AVE', '', 'PORTLAND', 'OR', '97204'), wages=126000, interest=1800, withholding=26500,
         bank=('123000220', '5500330017'), savings=True, designee=('HANNAH VANCE', '503-555-0399', '97531'), checks=[]),
    dict(name='18-hoh_1dep-ctc_pec-you_da-no_tpd-no_refund-checking', fs='hoh', da=False, pec=('you',),
         you=p('IRENE J', 'WALSH', '400240001'), occ='OFFICE MANAGER', phone='615-555-0401', email='irene.walsh@example.com',
         addr=US('912 BROADWAY', '', 'NASHVILLE', 'TN', '37203'), wages=54000, withholding=4300,
         bank=('064000017', '4400110018'), deps=[('LILY WALSH', '400240011', 'DAUGHTER', 'ctc')], checks=[]),
    dict(name='19-hoh_3dep-2ctc-1odc_pec-none_da-yes_tpd-yes_refund-savings', fs='hoh', da=True,
         you=p('KEVIN R', 'XAVIER', '400240002'), occ='POLICE OFFICER', phone='702-555-0402', email='kevin.xavier@example.com',
         addr=US('3300 LAS VEGAS BLVD S', '808', 'LAS VEGAS', 'NV', '89109'), wages=76000, interest=310, withholding=7400,
         bank=('122400724', '3300220019'), savings=True, designee=('MARIA XAVIER', '702-555-0499', '24601'),
         deps=[('ADAM XAVIER', '400240021', 'SON', 'ctc'), ('BELLA XAVIER', '400240022', 'DAUGHTER', 'ctc'),
               ('CARLOS XAVIER', '400240023', 'FATHER', 'odc')], checks=[]),
    dict(name='20-hoh_qualifying-child-not-dependent_0dep_age65_pec-you_da-no_tpd-no_owe', fs='hoh', da=False,
         pec=('you',), you=p('LINDA S', 'YATES', '400240003'), occ='REAL ESTATE AGENT', phone='919-555-0403',
         email='linda.yates@example.com', addr=US('150 FAYETTEVILLE ST', '', 'RALEIGH', 'NC', '27601'),
         wages=72000, withholding=4000, qualifying_name='NOAH YATES', checks=['you_65']),
    dict(name='21-qss_1dep-ctc_pec-you_da-no_tpd-no_refund-checking', fs='qss', da=False, pec=('you',),
         you=p('MICHAEL F', 'ZIMMER', '400250001'), occ='CIVIL ENGINEER', phone='816-555-0501',
         email='michael.zimmer@example.com', addr=US('2400 GRAND BLVD', '', 'KANSAS CITY', 'MO', '64108'),
         wages=89000, withholding=7900, bank=('101000019', '2200110021'),
         deps=[('EMMA ZIMMER', '400250011', 'DAUGHTER', 'ctc')], checks=[]),
    dict(name='22-qss_2dep-ctc_pec-none_da-yes_tpd-yes_owe', fs='qss', da=True,
         you=p('NATALIE K', 'ABBOTT', '400250002'), occ='PHARMACY TECH', phone='402-555-0502',
         email='natalie.abbott@example.com', addr=US('1615 HOWARD ST', '2', 'OMAHA', 'NE', '68102'),
         wages=105000, withholding=3000, designee=('OSCAR ABBOTT', '402-555-0599', '55555'),
         deps=[('PAUL ABBOTT', '400250021', 'SON', 'ctc'), ('QUINN ABBOTT', '400250022', 'DAUGHTER', 'ctc')], checks=[]),
    dict(name='23-mfj_1dep-odc_spouse-age65_ip-pin-you_pec-spouse_da-no_tpd-no_refund-checking', fs='mfj', da=False,
         pec=('spouse',), you=p('ROBERT C', 'BAKER', '400220017'), spouse=p('SUSAN', 'BAKER', '400220018'),
         occ='PLUMBER', spouse_occ='RETIRED', phone='405-555-0217', email='robert.baker@example.com',
         addr=US('500 N BROADWAY AVE', '', 'OKLAHOMA CITY', 'OK', '73102'), wages=83000, withholding=6900,
         bank=('103000648', '9900220023'), ip_pin_you='619042',
         deps=[('TYLER BAKER', '400220171', 'SON', 'odc')], checks=['spouse_65']),
]


def fields_for(s: dict) -> tuple[dict, list]:
    t = {}
    fi, ln, ssn = s['you']
    t.update({'f1_04': fi, 'f1_05': ln, 'f1_06': ssn})
    if 'spouse' in s:
        sfi, sln, sssn = s['spouse']
        t.update({'f1_07': sfi, 'f1_08': sln, 'f1_09': sssn})
    if 'spouse_ssn' in s:  # MFS: spouse SSN box + name on the filing-status line
        t['f1_09'] = s['spouse_ssn']
    if 'mfs_spouse_name' in s:
        t['f1_18'] = s['mfs_spouse_name']
    if 'qualifying_name' in s:  # HOH/QSS: qualifying child who is not your dependent
        t['f1_18'] = s['qualifying_name']
    if 'nra_name' in s:
        t['f1_19'] = s['nra_name']
    a = s['addr']
    t.update({'f1_10': a['street'], 'f1_11': a['apt'], 'f1_12': a['city']})
    if 'country' in a:
        t.update({'f1_15': a['country'], 'f1_16': a['province'], 'f1_17': a['postal']})
    else:
        t.update({'f1_13': a['state'], 'f1_14': a['zip']})
    checks = [s['fs'], 'da_yes' if s['da'] else 'da_no'] + list(s['checks'])
    for who in s.get('pec', ()):
        checks.append('pec_' + who)
    for i, (name, dssn, rel, credit) in enumerate(s.get('deps', [])):
        nf, sf, rf = DEP_FIELDS[i]
        t.update({nf: name, sf: dssn, rf: rel})
        checks.append(f'{credit}{i + 1}')
    t.update(compute(s))
    if s.get('_summary', {}).get('refund') is not None:
        checks.append('savings' if s.get('savings') else 'checking')
    if 'designee' in s:
        t.update({'f2_30': s['designee'][0], 'f2_31': s['designee'][1], 'f2_32': s['designee'][2]})
        checks.append('tpd_yes')
    else:
        checks.append('tpd_no')
    t.update({'f2_33': s['occ'], 'f2_37': s['phone'], 'f2_38': s['email']})
    if 'spouse_occ' in s:
        t['f2_35'] = s['spouse_occ']
    if 'ip_pin_you' in s:
        t['f2_34'] = s['ip_pin_you']
    if 'ip_pin_spouse' in s:
        t['f2_36'] = s['ip_pin_spouse']
    return {k: v for k, v in t.items() if v}, checks


def build(blank: str, s: dict, out_dir: str) -> dict:
    text, checks = fields_for(s)
    doc = fitz.open(blank)
    marks, ticked = [], set()
    for page in doc:
        for w in page.widgets():
            short = w.field_name.split('.')[-1].split('[')[0]
            if w.field_type_string in ('CheckBox', 'RadioButton'):
                for key in checks:
                    name, test = CB[key]
                    if short == name and test(w.rect):
                        marks.append((page.number, fitz.Rect(w.rect)))
                        ticked.add(key)
                w.field_value = False
                w.update()
            elif short in text:
                w.field_value = text[short]
                w.update()
    missing = set(checks) - ticked
    if missing:
        raise SystemExit(f"{s['name']}: no widget for {sorted(missing)}")
    doc.xref_set_key(doc.pdf_catalog(), 'AcroForm/XFA', 'null')  # the XFA layer is what blank viewers show
    doc.bake(annots=True, widgets=True)
    for pno, r in marks:  # vector tick, viewer-independent
        shape = doc[pno].new_shape()
        inset = r.width * 0.2
        shape.draw_line(fitz.Point(r.x0 + inset, r.y0 + r.height * 0.55), fitz.Point(r.x0 + r.width * 0.42, r.y1 - inset))
        shape.draw_line(fitz.Point(r.x0 + r.width * 0.42, r.y1 - inset), fitz.Point(r.x1 - inset, r.y0 + inset))
        shape.finish(color=(0, 0, 0), width=1.3)
        shape.commit()
    base = os.path.join(out_dir, s['name'])
    doc.save(base + '.pdf', garbage=3, deflate=True)
    pages = [Image.open(io.BytesIO(pg.get_pixmap(dpi=150).tobytes('png'))).convert('RGB') for pg in doc]
    stacked = Image.new('RGB', (max(i.width for i in pages), sum(i.height for i in pages)), 'white')
    y = 0
    for img in pages:
        stacked.paste(img, (0, y))
        y += img.height
    stacked.save(base + '.png', optimize=True)
    stacked.save(base + '.jpg', quality=90)
    return s['_summary']


if __name__ == '__main__':
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scenarios')
    os.makedirs(out, exist_ok=True)
    for sc in SCENARIOS:
        sm = build(sys.argv[1], sc, out)
        if ('_owe' in sc['name']) != (sm['owed'] is not None):  # the name must say what the return shows
            raise SystemExit(f"{sc['name']}: name says {'owe' if '_owe' in sc['name'] else 'refund'}, return does not")
        result = f"refund {sm['refund']:,}" if sm['refund'] is not None else f"owe {sm['owed']:,}"
        print(f"{sc['name']}  income {sm['total']:,}  ded {sm['deduction']:,}  ti {sm['ti']:,}  tax {sm['tax']:,}"
              f"  credits {sm['credits']:,}  total {sm['total_tax']:,}  {result}")
