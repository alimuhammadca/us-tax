**★ The MFS rental special allowance needs living apart ALL year - the last-6-months answer is not enough (round-2 QA, sc_00185,
2026-10-15).** IRC §469(i)(5)(B) ("unless the taxpayer lives apart from his spouse at all times during the taxable year"); 2025
Instructions for Form 8582, Part II caution ("If your filing status is married filing separately and you lived with your spouse at
any time during the year, you are not eligible for the special allowances") and line 8 ($12,500 "if ... you and your spouse lived
apart at all times during the year"). The engine keyed the $12,500 / $50,000 MFS allowance on the filing-status answer
mfsOrHohLivedApartOrLegallySeparated, which is the LAST-6-MONTHS / legally-separated test (EIC, HOH, 1040 page-1 box), so an MFS
filer whose spouse moved out on 05/15 deducted a 10,000 rental loss. Fix e1a06bef reads the ENTIRE-year residence fact on the
Social Security form (livedApartFromSpouseEntireTaxYear - the same answer line 6d and the MFS IRA phase-out read); no answer -> $0.
Do not reuse the 6-month flag for any "at all times during the year" rule. Related, pinned by Hrb2025Sc00181-00190 (no other
engine change): the EIC separated-spouse rule has two prongs (apart July 1 - December 31, or a written separation agreement + not
in the same household at year end); the MFS care-credit exception (§21(e)(4)) also needs over half the home's cost, and those facts
make the filer HOH; a pension is in NIIT MAGI but not NII, MFS threshold 125,000 (MAGI exactly 125,000 -> 0); MFS cannot take the
Form 8815 exclusion (a QTP contribution is a qualified expense on a joint return); the MFS QDCG 20% line is 300,000; the MFS
Form 2210 110% line is 2024 AGI MORE than 75,000; a spouse who died during 2025 allows MFJ, one who died in 2024 with no child
leaves you single; a custodial parent who released the child on Form 8332 is still HOH, a dependent parent need not live with you.
**Open (owner, no fields added):** no spouse date-of-death input; no community-property (Form 8958) split for MFS.

**★ Taxable alimony under a pre-2019 instrument is IRA COMPENSATION (round-2 QA, sc_00171, 2026-10-15).** IRC §219(f)(1);
Pub. 590-A (2025) "Alimony and separate maintenance. For IRA purposes, compensation includes any taxable alimony ... only with
respect to divorce or separation instruments executed on or before December 31, 2018"; interest is NOT compensation.
computeIraCompensation read W-2 box 1 (+ combat pay) only, so a 7,000 contribution covered by 4,000 of wages + 3,000 of 2016-decree
alimony was flagged IRA_DEDUCTION_EXCEEDS_COMPENSATION and charged a 180 excise - fix 6d7a55ec adds Schedule 1 line 2a alimony
(dropped when the agreement date is after 12/31/2018; kept when the date is blank, as line 2a keeps it) to BOTH the line-20 cap
check and the Form 5329 Part III limit. Related, pinned by Hrb2025Sc00172-00180 (no other engine change): the Saver's credit
student test is any part of 5 calendar months and the credit is limited to tax (line 11); a 2024 Roth distribution is Form 8880
line 4; born 01/01/2008 is eligible, 01/02/2008 is not (this app ASKS the question, it does not derive it from the DOB); §30D MAGI
and MSRP both use "exceeds" (150,000 / 55,000 qualify; an SUV's cap is 80,000) and MAGI is AGI after an IRA deduction; the Roth
limit is 0 at MAGI 165,000 ("or more"), 200 at 164,999 (Worksheet 2-2 floor), 3,500 at 157,500; MFS joint-account interest goes
out as a nominee distribution (Schedule B required) and joint estimates are split as the spouses agree (i1040 line 26); MFS
Social Security lived together = 85% of the SMALLER of line 7 and benefits, lived apart ALL year = single figures + line 6d; the
MFS IRA range 0-10,000 applies when only the spouse is covered, and not after a year apart. **Open (owner, no fields added):**
the MFS "lived with your spouse" fact is read only from the Social Security form (an IRA-only or Roth-only MFS filer has nowhere
else to answer it).

**★ Form 8615 line 1 is the child's unearned income AFTER the early-withdrawal penalty (round-2 QA, sc_00151, 2026-10-17).**
2025 Instructions for Form 8615, Line 1: with no earned income, line 1 is the child's AGI (line 11b); the Child's Unearned
Income Worksheet line 2 is "earned income ... plus the amount of any penalty on early withdrawal of savings from the child's
Schedule 1 (Form 1040), line 18" (Example 2: 16,000 - 100 = 15,900). deriveChildUnearnedIncome subtracted wages only, so 2,750 of
interest with a 50 penalty (2,700, not MORE than 2,700) got Form 8615 and tax 142 instead of 136 - fix f6904003 subtracts the
Schedule 1 line 18 penalty. Related, pinned by Hrb2025Sc00151-00160 (no other engine change): interest and dividends are ADDED
for the 2,700 test; the Schedule 1-A Part V senior deduction is cut by 6% of MAGI over 75,000 and is NOT allowed on a separate
return (the MFS age box is still 1,600); Schedule 8812 line 9 and Form 8959 use 200,000 for a qualifying surviving spouse (the
joint 400,000 / 250,000 are for MFJ only; Form 8960 uses 250,000 for QSS); IRA MAGI (Pub. 590-A Worksheet 1-1) adds back the
student loan interest deduction, 50+ uses 8,000 and 80%, the $200 floor never applies at or above the top of the range and never
exceeds the contribution; excess social security is figured per spouse; Pub. 936 Table 1 pools the main and second home against
one 750,000 (375,000 MFS); Form 8959 Part II reduces the 200,000 by Medicare wages; Form 8960 line 5a is Form 1040 line 7a (the
loss after the 3,000 limit). **Open (owner, no fields added):** no medical-mileage input (the 21-cent miles are typed into the
medical total).

**★ An unemployment repayment entry is the SAME-YEAR repayment, netted on Schedule 1 line 7 - never line 24e (round-2 QA,
sc_00145, 2026-10-15).** 2025 i1040 line 7: "If you received an overpayment of unemployment compensation in 2025 and you repaid
any of it in 2025, subtract the amount you repaid ... check the box on line 7 and enter the amount you repaid". Line 24e is ONLY
the Trade Act of 1974 supplemental-benefit repayment; the Pub. 525 sentence sc_00322 (65d28bc2) used to move the entry there
("Deduct the repayment in the later year as an adjustment ... line 24e") is in Pub. 525's SUPPLEMENTAL unemployment benefits
paragraph. Ordinary (1099-G) benefits repaid in a LATER year: $3,000 or less not deductible; over $3,000 -> claim of right
(Schedule A line 16 or Schedule 3 line 13b, the existing section 1341 inputs). Fix eb116838 restored the line 7 netting; the
over-3,000 advisory now says a prior-year repayment does not belong in the entry; UI help text reworded (us-tax-ui abacdbd +
9128079). **Open (owner, no field added):** there is no separate "repaid benefits received in an EARLIER year" input.

**★ Form 8396 line 3 comes off Schedule A home mortgage interest BEFORE the standard-vs-itemized choice (round-2 QA, sc_00141,
2026-10-15).** Form 8396 line 3: "You must reduce your deduction for home mortgage interest on Schedule A (Form 1040) by the
amount on line 3." Line 3 depends only on interest and the certificate rate (the 2,000 cap applies only when the rate is MORE
than 20%), so buildScheduleA now subtracts it (fix 63b7840d). Reducing it afterwards let an unreduced total win the itemize
choice (12,000 x 20% + 5,000 SALT: 17,000 chosen, then cut to 14,600 < 15,750) and left an itemizer's line 15 / 16 on the
unreduced figure. Related, pinned by Hrb2025Sc00141-00150 (no other engine change): Form 8962 line 5 truncates (60,239 / 15,060
-> 399) and is 400 at exactly 4 x FPL, where Table 5 leaves line 28 blank (no repayment limit); 1099-INT/DIV/B box 4 all go to
line 25b (1099-B backup withholding is 24% of proceeds and refunded in full); age-55 separation exception 01 is decided by the
YEAR the filer reaches 55; Form 2210 line 7 stops only when LESS than 1,000, and 110% applies only when 2024 AGI is MORE than
150,000 (rate periods all 7% in the 2025 i2210); Form 8959 tests the total of all W-2 box 5 against 200,000 / 250,000 joint /
125,000 MFS while employers withhold per employee over 200,000; NIIT is on MAGI (tax-exempt interest excluded, alimony
included) and qualified dividends are NII; Schedule B is required for a nominee subtraction at any amount, and the 1,500 tests
on interest and on dividends are separate. **Open:** the engine takes Form 5329 exception 01 as entered (it does not check the
birth year).

**★ The no-child EIC age test: 25 is reached on the DAY BEFORE the 25th birthday, 65 ON the 65th (round-2 QA, sc_00135,
2026-10-16).** Pub. 596 (2025) Rule 11: "You meet the age test if you were born after December 31, 1960, and before January 2,
2001" (also 2025 i1040 EIC Step 4 question 2). `meetsChildlessEicAgeTest` uses the age on the day after the year end for the
25 test and the age on 12/31 for the under-65 test (fix c0e8205a; the engine used 12/31 for both, so a 01/01/2001 birthday lost
the 649 credit). Related, pinned by Hrb2025Sc00131-00140 (no engine change): Form 8615 line 10 is the parents' ACTUAL line 16 -
the Tax Table amount below 100,000 (99,000 MFJ -> 11,614, not the formula's 11,608) - while line 9 at 100,000+ uses the
worksheet; line 18 is the LARGER of 16 and 17; Form 8814 line 9 (qualified share = line 6 x 2b/4) goes to 1040 lines 3a/3b at
QDCG rates; the CTC phase-out excess rounds UP to the next 1,000 (440,001 -> 2,050); Form 2441's 6,000 limit is reduced by
excluded box 10 benefits (Part III line 29) and the care credit is taken BEFORE the CTC; §25D carries forward, §25C and the
§30D personal part do not; §30D uses the LESSER of 2025 and 2024 MAGI and "acquired" = binding contract + a payment.
**Open (no fields added):** the app has no Form 8615 age-18/student "earned income more than half of support" input (the filer
answers the kiddie question) and no §25D utility-subsidy input (cost is typed net of a nontaxable rebate).

**★ Amortizable bond premium over a bond's interest is deductible only up to the bond's EARLIER interest (round-2 QA,
sc_00122, 2026-10-15).** Reg. §1.171-2(a)(4)(i); Pub. 550 (2025) How To Report Amortization: the excess of the premium
over the period's qualified stated interest goes to Schedule A line 16, "limited to the amount by which your total
interest inclusions on the bond in prior accrual periods is more than your total bond premium deductions on the bond in
prior periods"; the rest carries forward (and is deducted when the bond is disposed of). **Open (no field added - owner
sign-off needed):** the app has no input for a bond's prior interest inclusions / prior premium deductions / carryforward,
so it carries EVERY 1099-INT box 11 (and manual) excess to line 16 - right when the bond has history (sc_00122 A, pinned),
wrong for a bond bought this year (C: cap 0; not pinned). BOND_PREMIUM_EXCEEDS_INTEREST now states the cap (a552ad63).
Related advisory wording (a552ad63): the §691(c) deduction is the recipient's SHARE of the estate tax caused by the IRD
(Pub. 559: IRD included this year / total IRD x (estate tax with - without the IRD)); the app still takes it as typed.

**★ A donated car's §170(f)(12) cap is $500 when the charity sells it for $500 or less, and box 5a/5b means no cap
(round-2 QA, sc_00114, 2026-10-15).** Pub. 526 (2025) Cars, Boats, and Airplanes: sold for more than $500 -> the smaller
of gross proceeds or FMV; "Deduction $500 or less. If the qualified organization sells the vehicle for $500 or less and
Exceptions 1 and 2 don't apply, you can deduct the smaller of $500, or the vehicle's FMV"; Exception 1 (significant
intervening use / material improvement, 1098-C box 5a) and Exception 2 (needy individual, box 5b) -> FMV. buildScheduleA
caps the vehicle at max(box 4c, 500) when sold (fix 72398e81; was the 450 sale price), and a 1098-C with box 5a/5b sets no
cap; the sc_00300 CHARITABLE_VEHICLE_1098C_REQUIRED block now fires only when NO 1098-C is on file (it fired on a box-5a
1098-C, which has no box 4c). **A §1033 involuntary conversion is manual capital detail** (fix a1c02edb): a return
whose only capital item is a condemnation award / insurance proceeds (no 1099-B exists) no longer hits the blocking
CAPITAL_STATEMENT_UPLOAD_REQUIRED. **Open (no fields added):** the casualty guided inputs apply only the $100 + 10%
regime - a qualified disaster's net loss ($500, no 10%, Form 4684 window: declared 01/01/2020-09/02/2025, incident
ended by 08/03/2025) is typed; Form 4684 Section B line 38b is typed (no "profit motive" / "prospect of recovery"
inputs); the 30%/50% charitable buckets are the filer's choice (no holding-period check from Form 8283 dates); the §1341
deduction-vs-credit comparison is not computed (the filer enters the winning method; both are blocked).

**★ The MFS SALT cap phase-down is figured on the full $40,000 and halved AFTERWARDS (round-2 QA, sc_00104,
2026-10-15).** 2025 Schedule A State and Local Tax Deduction Worksheet: line 1 $40,000; line 5 $500,000 ($250,000
MFS); line 7 = 30% of line 11b over line 5; line 9 = the larger of (line 1 - line 7) or $10,000; line 10 = the smaller
of line 9 (HALF of line 9 if MFS) or line 5d. So an MFS cap falls 15 cents per dollar over $250,000 to a $5,000 floor
at $350,000 - never 30% off the already-halved $20,000 (MAGI 300,000: 12,500, not 5,000). `saltLimitForStatusAndMagi`
follows the worksheet (fix e9264a55). Non-MFS unchanged. Related, all pinned by Hrb2025Sc00101-00103: one $40,000 cap
per JOINT return; "more than $500,000" means line 11b (after Schedule 1 adjustments), so exactly 500,000 is not
reduced; the reduction cuts the cap, never the taxes (line 10 still takes the smaller of the cap and 5d).
**Open (no fields added):** the app has one mortgage-points entry (in full OR amortized) - it cannot hold a cash-out
refinance's improvement share plus the spread rest, or a paid-off loan's leftover points (released in full unless the
same lender refinances - Pub. 936); the filer types the year's figure. The optional sales-tax table amount and the real-estate-tax day split are likewise typed
results, not computed from the tables / dates.

**★ An employer contribution to an Archer MSA leaves no deduction for the filer's own (round-2 QA, sc_00091,
2026-10-15).** IRC §220(b)(5); 2025 Instructions for Form 8853: "If an employer made contributions to your Archer MSA,
you aren't entitled to a deduction" - Part I (1): complete lines 1-2, skip 3-4, enter -0- on line 5. Any line 1
amount now forces Form 8853 line 5 (Schedule 1 line 23) to 0; the filer's line-2 money is then an excess contribution
(Form 5329 Part VI, not computed - the app has no year-end MSA value). The line-3 limitation stays month-by-month
(eligible on the 1st) / 12. **Open:** line 1 is not auto-read from W-2 box 12 code R (HSA line 9 is, from code W).

**★ A real estate professional's rental is nonpassive only if she materially participates in IT (round-2 QA,
sc_00075, 2026-10-15).** §469(c)(7)(A) only switches off §469(c)(2)'s per-se-passive rule; the rental is then tested
under §469(c)(1) (Pub. 925: "rental real estate activities in which you materially participated aren't passive").
The engine treats an explicit "No" on the property's `materialParticipation` as passive (with the active-participation
allowance); unanswered keeps the old professional-means-nonpassive behaviour. **Open:** the UI control is Yes-only, so
"No" cannot be sent from the form; the same control makes a NON-professional's rental nonpassive when ticked, which
§469(c)(2) forbids for long-term rentals; and the rental form has no related-buyer question for §469(g)(1)(B).

**★ Four more IRS limits the engine now applies (round-2 QA, sc_00062/64/66/68, 2026-10-15).**
(1) **QCD age gate (§408(d)(8)(B)(ii)):** a QCD must be made on or after the owner reaches 70½ (70th birthday + 6
months). The payment date is not captured, so the QCD entries are dropped (and QCD_OWNER_UNDER_AGE_70_HALF_* raised)
only when the owner cannot have reached 70½ at any time in the tax year. (2) **Form 8582 line placement:** a rental
WITHOUT active participation prints on line 2 ("All other passive activities"), not line 1 - line 1 sends a loss to
the Part II allowance by the form's own flow. (3) **Automatic 15% royalty depletion** is capped at the property's
income before depletion (§613(a), 100% for oil and gas); a typed depletion figure is trusted. (4) **§280A(e) before
§280A(c)(5):** rental expenses are first limited to the fair-rental-days share; a below-market rental with no
fair-rental days has a share of 0 - the whole rent is income, nothing is deductible and nothing carries. Capping the
full expenses at the rent (net 0) skips that step and understates income by the whole rent.
**Open:** the rental intake takes the RENTAL share of each expense (no day split), and has no lease-bonus field.

**★ Three IRS limits the engine now applies itself (round-2 QA, sc_00044/00055/00060, 2026-10-14).**
(1) **Simplified Method:** the monthly exclusion is the ORIGINAL cost (worksheet line 2) ÷ the table number; a
prior-year tax-free recovery only CAPS the year's exclusion at the cost not yet recovered (lines 6-8) - it never
shrinks the monthly amount (both the per-person and the per-stream path). (2) **Spousal IRA:** on a joint return
the 6% §4973 excess-contribution test uses the couple's combined compensation less the OTHER spouse's traditional +
Roth contributions (§219(c)) - the same rule the line-20 deduction cap already used; per-person compensation charged
a non-earning spouse 420 on a valid 7,000 spousal IRA. (3) **Form 5329 exception 09** (first home) stops at $10,000
whatever amount is entered (§72(t)(8)(B)); 08 (higher education) has no cap. When a field could hold either the raw
fact or the post-limit figure, apply the statutory limit in compute rather than trusting the entry.

**★ A pre-fill from an uploaded document fills BLANKS only, and says what it did.** Personal > Last year
1040 writes into forms the user owns, so it never overwrites a value already entered; re-applying is
therefore idempotent and safe, and the summary lists both what it filled and what it kept. Pre-fill only
facts the source document actually states for THIS year's return: date of birth is not on a 1040,
IP PINs are reissued yearly, digital-asset and campaign answers are about this year, and CTC/ODC
eligibility changes with age - leave those to the user rather than carrying last year's answer forward.

**★ Azure's `prebuilt-tax.us.1040` folds the unit into `valueAddress.streetAddress`** ("100 MAIN ST Apt. 4")
although the form prints a separate Apt. box - build the street from `houseNumber` + `road`. And on photos
the filing-status checkbox is often unread: a spouse on the "If joint return" name line implies MFJ.




**★ `localhost` in a dev proxy target is a ~200ms tax and a flake source — use `127.0.0.1`.** The backend binds IPv4-only (`127.0.0.1:8080`) and the Angular dev server IPv6-only (`[::1]:4200`), while `localhost` resolves **IPv6 first**. A proxy target of `http://localhost:8080` therefore attempts `::1:8080`, finds nothing, and falls back — measured at **2.126s vs 0.048s of connect time over 10 calls (~45x)**, and **451 `http proxy error` entries in one dev-server log against zero after the fix**. ★ This is the mechanism behind the recurring e2e flake class: `connect ETIMEDOUT ::1:4200`, `page.evaluate: TypeError: Failed to fetch`, and bare test timeouts, all passing on retry, all with 2–10x inflated durations. Proxy config is read at **startup**, so the dev server must be restarted.

**★ "Transient network" is a classification, not an explanation.** That flake class appeared in four consecutive full regressions and was correctly triaged each time — retry passed, a real defect sat elsewhere, move on. The literal address `::1:4200` was in the error text every single time and went unread. When the same non-deterministic signature recurs across runs, stop re-triaging it and go read what it is naming; a recurring flake with a stable signature has a cause.

**★ Splitting on text the document itself prints is an ORDER rule, and order is a property of the render, not of the document.** Form 1042-S prints boxes 3a and 4a on one line, so box 3a's value was read as everything before the "4a" the form prints between them. The two renders of one fixture return that strip as **`"10 4a Exemption code 64"` (PDF)** and **`"10 64 4a Exemption code"` (PNG)**, which split to `10 / 64` and `1064 / nothing`. The same trap caught label-to-value pairing a day earlier. Bound by a POSITION derived from the document's own printed marks - a neighbouring label - and treat `numericOnly`-style "first match wins" as an order rule too. ★ **And when a test contradicts your explanation of a bug, the explanation is what is wrong.** My first test fed the row's five measured glyphs to `orderForReading` and got the same order from both renders, because line grouping runs across the whole page: the divergence was real but not reproducible from the row alone. Log the actual value out of the running system before writing the comment, the commit message or the test.

**★ ...but "order is a render artifact" does NOT cover a row number in a structured table — I over-applied it the same day I wrote it.** Form 1095-A Part III is a thirteen-row printed table whose month names are **pre-printed on the blank form**, so a row's identity is its row number and the label is an echo of it. Azure returned **fourteen** rows on one render, losing the "July" label and pairing every later label with the next row's amounts; keying on the label — straight off the rule above — **shifted six months and lost the annual totals**. The distinction: reading order of glyphs on a page is a render artifact; the row index of a grid the model extracted from a fixed printed table is that table's own row number. Ask which one you have before choosing a key, use the other as a cross-check that warns on disagreement, and settle it against the fixture's AcroForm rather than against whichever rule you reached for last.

**★ A fixture where every box is ticked cannot tell a correct read from an over-read — a perfect score against it is not evidence.** Form 1095-B's Part IV has a 6×13 checkbox grid and all **78** boxes are ticked in the fixture, so **133/133 against its AcroForm said nothing** about whether an UNticked box reads as false, or about what happens when a column header is lost. Both were broken: an absent header made nearest-column file that month's mark under its **neighbour**, so August reported two months' coverage the form does not claim. Found only by writing synthetic cases on the measured geometry. **Ask what the fixture cannot distinguish before trusting the score** — uniform data (all-true, all-same, all-present) is the tell, and the answer is a unit test with the variation the fixture lacks, not another fixture run. Corollary: when a guard exists on one axis of a two-axis attribution, it probably belongs on the other too.

**★ Extraction transcribes a form; it does not correct it — so a field named for a BOX must hold what is printed in that box.** Azure parses an address semantically. On Form 1095-C it reported city "Milwaukee" and state "MI" while the form's **City** box (line 11) held `US 53704`, its **State** box (12) held `Milwaukee`, and its **Country/ZIP** box (13) held `MI`. Mapping `Recipient.Address.City` → `employerCity` is therefore wrong in principle and happens to be right only while the data is sane — which is exactly why the fixtures scramble it. **Ask what a UI field is NAMED for**: named for a box → read the box, by geometry if the model only offers a semantic parse; named for a concept → the parse is fine. The same test settles whether to "fix" odd-looking input: if the form says it, transcribe it and let the user see what their statement actually shows. Corollary: a model's structured output is a convenience, not an authority — it also merged two printed boxes into one field on the same form (`"22910
12770"`), which geometry does not.

**★ A search that finds nothing is a fact about the SEARCH, not about the thing searched.** I grepped Form 1095-C's Part III page for printed row numbers with a pattern that required the number and the name on one line — the layout Form 1095-B uses. It found nothing, and I wrote "its rows are UNNUMBERED" into a commit message, `history.md`, `context.md` and the plan for the next task. **The rows are numbered 18 to 30**; each number is simply its own glyph. The inference would have bought a whole row-discovery mechanism nobody needed. Before recording an absence as a property, weaken the pattern until it matches something and see what comes back, or count what IS there (235 filled fields had to be described by *some* structure). Same family as **an absent artifact is not a zero**. **★ Corollary for OCR work: probe the model the extraction actually runs.** `dump_marks`/`words` use `prebuilt-document`; a form configured for `prebuilt-tax.us.*` gets different OCR for the same page, so a glyph present in one is no evidence about the other. I diagnosed a reader bug from the wrong model's output; instrumenting the real reader settled it in one run.

**★ Read the audit log before theorising about an "it does not work" report.** A report that `1095-p3-c.png` would not extract had me checking UI bindings, directive code and component row caps. One log query ended it: `AUDIT formId=1095-c fileSize=175412` — and 175412 bytes is `1095-b-p3.png`, not `1095-c-p3.png`. **The wrong file had been uploaded into the right form.** The log records formId, size and content type on every extract; start there, and match the size against the fixtures.

**★ Silent misattribution is worse than failure, and a green sweep over real fixtures can hide the bug that causes it.** That wrong-form upload did not fail — it returned **36 plausible values in the wrong rows** (1095-B numbers its continuation rows 29-40, 1095-C's Part III reads 18-30, so two rows overlapped) with nothing in the response saying so. When a reader attributes input to slots, ask what happens when the input is from somewhere else entirely, and refuse rather than guess. **Then test the guard as a pure function:** my matcher shipped past a live sweep of 45 forms with a broken character class — `[\\w-]` is the class {backslash, w, hyphen}, not word characters — because the expected value was always found first and the faulty branch never ran. Seven unit tests found it immediately. **Corollary for any code-set matcher: check for prefixes.** Seventeen of these 56 form codes are prefixes of others ("Form 1098" of "Form 1098-C", "Form W-2" of "Form W-2G"), and a trailing `\b` matches all of them because the boundary between "8" and "-" is a word boundary.

**★ A form uploaded page by page must have each page report only what that page carries — anything else overwrites a sibling page.** Form 1095-C's page 3 prints no VOID or CORRECTED box (they are on page 1) yet reported both as `false`, so uploading page 3 into a statement that already held page 1 **cleared** them; the reverse cleared the self-insured flag. Azure makes the distinction decidable: a box it found and read as empty carries `":unselected:"` **and a bounding region**, while a box it never located has neither — so absent-from-page maps to null and found-but-empty still maps to false. This is the codebase's own null/zero semantic (null = does not apply, false = applies and is false) applied per page. **Check it on every multi-page statement**, and more generally whenever two inputs write the same record: ask what the second one says about fields it knows nothing about.

**★ Taking the FIRST match on a page is only safe when the label occurs once — and "once" is a property of the page, not of the form.** Form 1095-C prints month column headers in Part II as well as Part III. Every fixture carried one Part per page, so `findLabelIn(..., 0)` was right every time — until the whole form arrived scanned as ONE image, when the first `"Jan"` became Part II's and Part III's grid columns landed 400px from its marks. **62 of 169 checkboxes were lost.** Scope a section's search to below its own heading, and when you write a first-match lookup, ask what happens if the page holds two of that thing. Note what saved this from being worse: the column guard discarded marks it could not place rather than filing them under the wrong month — a guard that fails safe turns silent corruption into silent loss, which is better and still not good.

**★ A specialised model is not automatically better than the generic one — compare them on the same page.** `prebuilt-tax.us.1095C` read four ticked checkboxes as `unselected` at confidence **0.364** while `prebuilt-document` read the same four correctly, on the same image. That is independent of the separate problem that our configs named the tax models' fields wrongly. Everything a named model gave for Form 1095-C — five scalars and three checkboxes — was on the page to be measured, so the form moved to `prebuilt-document` and all 169 boxes now read right. **When a model's output looks wrong, try the other model before building around it**, and when a fix spans several pages of one form, check that the merged page equals the union of its pages field for field — that is a stronger statement than any single page's score.

**★ A fixture whose every box holds ONE word cannot test a multi-word box — build the fixture that stresses the assumption.** Forms 1095-B and 1095-C print their name in three boxes; we read one combined value and split it on the assumption that the surname is its last word. Both forms scored full marks against their AcroForm (133/133, 85/85) while the rule was broken, because every shipped box holds a single word. Set the widgets to `"Mary Jo" / "K" / "Van Der Berg"` and it returns **first="Mary Jo K Van Der", last="Berg"**, with the middle initial lost entirely. Ten minutes with PyMuPDF — set the three widgets, call `w.update()` to regenerate the appearance streams — turns a judgement call into a measurement. Sibling of the all-ticked-checkbox rule above: ask what the shipped data never exercises.

**★ Measure a margin before declining to act on it — my estimate was out by 2x and nearly cost the fix.** I read the gap between those name boxes off the single-word fixtures, got ~2x the word spacing, judged that too tight against the 4–8x of comparable rules, and recommended leaving it. Measured properly on multi-word names it is **5x on the tighter form and 34x on the other**. The estimate was pessimistic because single-word boxes happen to sit closer together. When a margin is the reason for not doing something, that margin is the thing to measure. Corollary from the same exercise: **physically impossible test data reads exactly like a bug** — I dropped a word from the middle of "Van Der Berg", leaving a 0.30in hole that genuinely IS a box boundary, and spent a cycle suspecting the code.

**★ One printed box can hold TWO facts, and a config that stores it as one field loses the
other silently.** The IRS prints a single box captioned "State/Payer's state no." - box 17 on
Form 1099-MISC, box 6 on 1099-NEC, box 15 on 1099-R. Azure carries one field per printed box, so
both facts arrive in one string (`"$ NY\n76565"`), and we stored all of it as `payerStateId`,
leaving the screens' state input - 1099-NEC captions it "State (Box 6)" - permanently blank.
Forms 1099-INT, -DIV, -G and -K give the state its OWN box, and their configs differ for that
reason; I nearly read the difference as a copy-and-paste shift in three configs. **When one
config disagrees with its siblings, check the FORMS before 'fixing' the odd one out.** Corollary:
**fixing one fault is what makes the next one legible** - with the state finally split out, the
neighbour was visible as `stateTaxWithheldAmount = 76565`, the state's own ID reported as tax
withheld, because Azure had assigned the same bundled string to the number-typed box beside it.

**★ A fallback that works hides the defect it is covering.** The 1099-INT config asked for
`Payer.RTN`; the model returns `Payer.Rtn`. The key never matched, so someone wrote an OCR regex
on the printed caption and a comment asserting the model "doesn't expose Payer's RTN as a
structured field" - it does, `"786543"` at confidence 0.799 on the fixture already in the repo.
No data was lost, so nothing looked wrong; the weaker route was simply the only route. **Treat a
hand-written recovery path as a claim about the upstream that needs checking**, and when a
comment explains WHY a workaround exists, verify the why - this is the third prose claim in this
file that was false. Same family as *a comment claiming a refactor is not the refactor*.

**★ Count the keys, then ask whether anything FILLS the field - the raw count is noise.** The
named-model audit opened at 325 of 818 configured keys absent from the schemas, which reads like
a catastrophe and was not one: the configs deliberately list several Azure spellings per target
(`Payer.TIN` AND `Payer.IdNumber`), arrays are flattened into the top level with `putIfAbsent`,
`concatFields` consumes keys too, and targets get written by Java through loop variables no
literal grep can see. Asking the one question that matters - *is this target filled by any path
at all?* - took 325 keys to 18 targets to **2 real findings**. **Model every path that can fill
the field before reporting a gap**, and state the metric you are actually measuring: three of my
own passes each inflated the number, the third because it did not parse `concatFields`.
Corollary: this kind of audit compares a key NAME against a schema and **cannot** see a live key
mapped to the WRONG target - a name audit and a meaning audit are different jobs.

**★ Mutation-test an AUDIT before believing a clean result from it.** The box-number meaning
check came back with 219 pairs and zero real mismatches, which is either good news or a check
with no power, and nothing in the output distinguishes the two. Injecting three deliberate box
swaps (1099-INT 1<->2, 1099-MISC 1<->2, 1099-DIV 1a<->3) caught all **six** sides and took the
flag count 13 -> 19; then the config went back byte-identical. **A negative result is only worth
something once the positive control has fired** - the same discipline as mutating a rule to see
the explanation change, applied to the measuring instrument rather than the code. Corollary: when
an audit's own regex produces the flags, expect most of them to be ITS faults, not the code's -
5 of 6 type flags here were `^qualified` and `Income$` matching legitimate amounts, and 10 of 13
box flags were scratch keys. Triage before reporting.

**★ A number and a checkbox can be offered for the SAME printed box - take the one the box
actually is.** Form 1099-LTC box 4 is a checkbox ("4 Qualified contract"), and Azure returns
both `Box4` (a boolean selection mark) and `Box4Amount` (a number) for it. The config mapped the
NUMBER onto the UI's boolean, and because the generic field pass runs before the form's
post-process, that number would have beaten the `putIfAbsent` filling the flag from the selection
mark. It never did, because `Box4Amount` reads empty at confidence 0.953 - **a populated ZERO
would have unchecked a box the form has ticked.** Compare the model's field TYPE against what the
target's name claims, and when a post-process holds the authoritative value, let it `put` rather
than `putIfAbsent` - deferring to whatever ran first is only safe if you know what that was.

**★ "Reserved" on this year's form can mean the concept MOVED TO ANOTHER FORM.** Form
1099-MISC box 14 carries a number and no caption on Rev. 4-2025 - no fillable widget either,
while every other money box has one, and "golden parachute" appears nowhere in the document. The
concept relocated to **Form 1099-NEC box 3**. Our config still maps 1099-MISC `Box14` to it,
which is harmless (empty at confidence 0.428 on a 2025 form, and CORRECT on a pre-2025 upload
someone may still file) - so it stays. **Before calling a cross-form mapping stale, find where
the concept went**, and check the AcroForm widgets and tooltips, not just the page text: three
independent signals settled this where the text alone was ambiguous. Same family as
*"reserved for future use" can mean RELOCATED, not repealed*, now observed across forms rather
than across lines of one form. **And it is the concrete cost of having no form-YEAR check.**

**★ A render difference is usually an ORDER difference, and an order-dependent reader turns it
into loss AND misattribution.** I reported that "1099-da.pdf loses the whole state section".
Both renders contain every printed value; Azure just emits them in different orders - the PNG
interleaves caption and values, the PDF groups all three captions then all six values. A line
walk that takes "the lines after the caption" therefore read the next two CAPTIONS, hit its own
`"15 state"` stop-word and reported success having read nothing - while the NEXT box's walk
collected those six values and wrote a state IDENTIFICATION NUMBER into a tax-withheld field.
**The reader's own stop-word guard is what silently zeroed it**, and the guard is correct; it is
the order-dependence around it that is not. So: never conclude "this render has worse recall"
before diffing the OCR CONTENT of both - and when a reader collects N values after an anchor,
ask what it does when the anchor is immediately followed by its own stop-word. Extends
*OCR reading order is not a property of the form*, which warned of a SWAP; this is the same
cause producing a silent shift into the wrong box.

**★ Diff BOTH renders of a fixture FIELD BY FIELD - it finds faults no single render can
show.** Form W-2G prints "City or town" twice, and its config had ONE fan-out slot where the
four sibling address captions all have two, so the winner's city was read and DISCARDED.
Scarborough was sitting in the PDF's key-value pairs the whole time. Nothing about either render
alone looks wrong - only `comm -13` over the two field sets shows it, and the same diff then
drove every remaining gap to a named cause (a merged caption, three unreported selection marks)
instead of a vague "the PDF is worse". A field-set diff of both renders belongs in the routine
check for every fixture.

**★ A mutation that reddens NOTHING is telling you your explanation is wrong, not that your
code is safe.** Having just written the rule about mutation-testing an audit, I mutated the new
geometric readers against their own tests. One mutation - giving the column the 2% left slack
used elsewhere - reddened nothing, and the test carried a comment asserting that *any* left slack
would swallow the neighbouring column's amount. **The comment was false**: the margin is 0.410in
(3.9 caption heights) against a 2% slack of 0.170in, and it takes 5% to break it. The code was
fine; the stated REASON for it was not. Treat a no-op mutation as a finding about the
justification, re-measure, and write the measurement into the comment - a fourth prose claim in
this file corrected by checking it.

**★ A matching KEY SET is not a matching extraction - diff the VALUES.** Having closed every
missing field on Form 1099-DA, both renders reported 58 fields and I nearly called it done. The
value-level diff found three filer-block fields where the PDF is wrong -
`filer_country = "+1 545
1234
US"`, `filer_zip = "KOKO
12345"` (box 1b's asset name bled into
the ZIP) - none of which a count or a key list can show. **Count agreement is the weakest form of
agreement**: it says the same slots were filled, not that they hold the same thing, and it is the
form of agreement a bled or merged value preserves. Sibling of *don't diff a human-readable
listing*, where the opposite error cost me a false "byte-identical" claim - both say the same
thing, that the comparison must be over the DATA.

**★ Ask where the box is printed relative to its caption before pairing them.** Form 1099-DA's
boxes 2, 5 and 9 have captions that WRAP over two to four lines with the checkbox UNDERNEATH,
while `readSelectionMarks` pairs a mark with a label on the same ROW - so three ticked boxes read
empty even though Azure reported all 16 of the form's marks on both renders, matching the
AcroForm one for one, including the one unselected. **The data was never missing; only the
pairing was.** When a checkbox comes back empty, dump the marks and the captions with their
geometry and look at the layout before assuming poor recall - and validate the pairing rule
against the fixture's AcroForm BEFORE writing the reader, which here turned a design question
into a table lookup. Note too what made it safe: box 6 prints three marks on box 5's own rows,
so the caption's horizontal span, not nearest-below, is what keeps them apart.

**★ When one party's block is wrong and the OTHER party's identical block is right, the labels
are fine - it is the value REGION.** Form 1099-DA's FILER telephone, country and ZIP came back as
`"12 555"`, `"+1 545 1234 US"` and `"KOKO 12345"` on the PDF, while the RECIPIENT's three boxes -
same captions, same config fan-out, same page - were correct on both renders. That asymmetry is
the diagnosis: nothing about label matching or config can explain it, so the fault is which words
Azure paired with the label. Read the cell from its own geometry instead, and note what the
region got wrong that geometry gets right: box 1b's "KOKO" is both to the RIGHT of the ZIP
caption and ABOVE its value band, so a two-sided cell test excludes it twice over. **Look for the
working twin before theorising** - it localises the fault in one observation.

**Personal forms: one list of required fields (2026-10-13).** Which fields a Personal form requires lives in
`us-tax-ui/src/app/utils/personal-requirements.ts` only. Both the form's save message ("Saved. Some required fields
are not completed yet: …") and Get started > Your checklist read it, so they cannot disagree. When a form gains or
drops a required field, change that file (and the template's `required` highlighting) together. A new compute flag
gets a Fix link only once it is added to `us-tax-ui/src/app/data/flag-form-links.ts`. A flag about one dependent must also carry `withDependentId(dep.id())` (and one about a particular statement `withFormId(...)`), or the checklist cannot tell which tab to open.

**1099-B term with no box 2 (2026-10-14).** `derive1099BBox` takes the term from, in order: an explicit Form 8949
category, the box 2 short/long flags, a date acquired of "INHERITED" (long-term, IRC 1223(9)), then the dates (more than
one year = long-term). A sale whose term cannot be derived is dropped from Schedule D, so any new text value allowed in
column (b) ("VARIOUS" etc.) needs a rule here too.
