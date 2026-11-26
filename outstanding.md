# Outstanding Items

**Reorganized 2026-11-22.** Every entry of the old file (1,103 entries) was checked against the current code and history.md and
sorted into four parts:

| Part | What it holds | Count |
|---|---|---|
| [1. TODO](#1-todo--true-outstanding-work) | Real work still to do, true in today's code | **29** |
| [2. Parked](#2-parked--waiting-on-the-owner-or-something-outside-the-app) | Deferred by the owner, or waiting on something outside the app (2026 figures, a 2025 PDF, a field sign-off, the H&R Block tester) | 25 items (54 entries) |
| [3. No action](#3-no-action--decisions-accepted-limits-out-of-scope-obsolete) | Decision records, accepted limits, out of scope by design, obsolete | 147 |
| [4. Completed](#4-completed) | Already fixed or built | 854 |

The full original text of every entry is kept unchanged in [outstanding-history.md](outstanding-history.md); `(hist L123)` points
to its line there. **New items go in Part 1.** When an item is finished, move it to Part 4 ("Finished since the reorganization") as one line with the date and commit;
the remaining items keep their numbers.

---

## 1. TODO — true outstanding work

### 1A. Wrong or possibly wrong tax amounts (do these first)

46. **Form 8960 line 5b for installment sales, like-kind exchanges and casualties** - **DONE 2026-11-27**, see Part 4.
47. **Real estate professional safe harbor for K-1 box 2 and Form 4835 farm rentals** - **DONE 2026-11-27**, see Part 4.

### 1B. Missing features (not supported today)

18. **Form 3800 credits for the filer's own business** - **DONE 2026-11-25**: Forms 8881 (V565), 6765 / 8826 / 8844 / 8941 (V570),
    Form 3800 Part II Section B, and K-1 code M on line 4i for an eligible small business (the Research credit screen's question,
    owner-approved option b). (hist L382)
19. **Form 4136 Schedule A (more than one business)** - **DONE 2026-11-25** (Stage A preview, Stage B screen + compute, V571): an
    activity selector on the Fuel tax credit screen, a Schedule A (Form 4136) per activity, Form 4136 their total. Still not prepared:
    lines 6-8, 13, 15, 16 (registered vendors, card issuers, blenders, exporters) and the bus rate (type of use 5) on lines 11 and 14 -
    its rate goes in column (b), whose box on the form is a hidden 1-point field. (hist L47)
21. **Puerto Rico Form 499R-2/W-2PR statement.** **DONE 2026-11-25** (Stage A screen + storage V572; Stage B compute, owner-approved:
    keep the e-mail box; line 1a = box 11 + boxes 16-18 + box 19, boxes 14 / 15 left out with an advisory). A bona fide resident's wages
    are excluded and fill the territory screen's wages; a non-resident's box 13 is a Form 1116 general category credit for Puerto Rico
    (or the Schedule A deduction); boxes 20-26 count like W-2 boxes 3-7 / box 12 A-B. Still not done: upload extraction (Azure has no
    499R-2 model). (hist L691)

### 1C. Tax-return forms and previews

29. **Schedule EIC** - **DONE 2026-11-25** (owner-approved option a): the 2025 schedule produced from the EIC's qualifying children
    (ScheduleEicCompute; AttachedForms.scheduleEicList), the self-only EIC's Child 1 without a valid SSN. (hist L5980)
30. **Form 8960 preview is blank** - **DONE 2026-11-25** (owner-approved option a): lines 1-17 and the header filled from the computed
    form (Form8960Fields, AttachedForms.form8960List). (hist L3272)
31. **No Form 4562 in a year with only a §179 carryover** - **DONE 2026-11-25**: the form of the business the carryover is deducted
    on (Part I lines 1-13, line 22). (hist L2441)
32. **Form 8962 line 4 a/b/c poverty-table box is not ticked** - **DONE 2026-11-26** (V573 line4_poverty_table; the 2024 line 4
    check columns dropped). (hist L2970)
33. **Form 8863 student view shows gross, not net, education expenses** - **DONE 2026-11-26**: the student record's adjusted expenses
    are net of the tax-free assistance (lines 27 / 31 already were). (hist L2881)
34. **Territory filers: Schedule A lines print unprorated** - **DONE 2026-11-26**: lines 8a / 8c / 9 / 10, 6, 15 and the parts of 16 carry
    their allowed share; line 17 is their sum (TerritoryRelatedDeductions.prorateLines). (hist L7588)
34a. **Schedule A preview: lines 6, 9, 15 and 16** - **DONE 2026-11-26** (owner-approved): line 6 foreign income taxes (line 7 = 5e + 6),
    line 9 Form 4952 line 8, line 15 Form 4684 line 18, line 16 the other itemized deductions with their description (gambling losses
    kept apart, V574) - the printed lines add up to line 17.
35. **A partly taxable recovery is not split between Schedule 1 line 1 and line 8z** - **DONE 2026-11-26**: Pub. 525's allocation
    (RecoveryAllocation) for a state refund with a Form 1098 box 4 refund. (hist L2382)

### 1D. Tests to add

48. **Unreliable e2e tests** - **DONE 2026-11-27**, see Part 4.

### 1E. Docs and code housekeeping

49. **Previews on a separate return's tab are empty after a reload** - **DONE 2026-11-27**, see Part 4.
42. **Intake YAMLs that said self-employment is out of scope** - **DONE 2026-11-26**: 17 YAMLs checked against the screens and
    compute and rewritten (10, 13b, 2555, 2ab, 4abc, 5abc, 6abcd, 7ab, 8 - each person); the Schedule C preview's stale comment fixed.
    Follow-up DONE 2026-11-26: the two retired pf_other_incomes toggles dropped (V575, owner-approved). (hist L3198)
43. **`lines/6abcd.md` is out of date** - **DONE 2026-11-26**: re-verified against the code and the 2025 Form 1040 instructions,
    Pub. 915, Pub. 590-A Appendix B and the Form 8815 instructions; 26 corrections (IRA coordination computed, Form 8839 line 30,
    Form 8815 at worksheet line 3, no SSI subtraction, excess repayments, line 6d / lump-sum blockers, flag table, method citations).
    No code change found wrong. (hist L3210)
43a. **Social Security worksheet line 5 adds Guam / USVI / CNMI mirror-code exclusions** - **CLOSED 2026-11-26, not a defect**: the
    code already adds only American Samoa and Puerto Rico (TerritoryExclusion.excludesOnUsReturn, 2026-11-07); the 1E-43 refresh misread
    the old spec text. lines/6abcd.md corrected.
45. **Refund and amount owed screen lacks OnPush change detection** - **DONE 2026-11-26**: OnPush added (the screen already read the
    return through signals and called markForCheck after every async step); unit 8/8, e2e 20/20, build. UI b1e8c14.

---

## 2. Parked — waiting on the owner or something outside the app

1. **Optional section 965 exclusion on Form 2210 line 8** (Refund and amount owed) - Owner 2026-11-15 "skipped for now"; the 110% AGI test after separate 2024 returns uses the Family Head's AGI pending IRS clarity. (hist L15-18)
2. **No Form 8615 preview or PDF** - **DONE 2026-11-27** (owner-approved, staged), see Part 4.
3. **Section 1062 farmland installment election (Form 1062)** (Like-kind exchanges (8824)) - Applies to tax years beginning after July 4, 2025 - build with the 2026 return. (hist L859-865)
4. **Class-wide elections, GAA, aircraft, 5% owner, Section C** (Depreciable assets (4562)) - Field additions waiting for owner sign-off (credit basis reduction since done via CreditBasisReduction). (hist L982-984)
5. **Clergy parsonage, Form 2031, community income, chapter 11** (Self-employment tax options) - Field additions waiting for owner sign-off. (hist L996-998)
6. **EIN and QJV election not asked** (Farm rental (4835)) - Disposition FIXED V552 (FarmRentalDisposition); EIN and QJV election are field additions waiting for owner sign-off. (hist L1008-1014)
7. **EIN, weather livestock election, Schedule J, NOL carryback** (Farm income (Sch F)) - Field additions waiting for owner sign-off. (hist L1028-1029)
8. **Line 1 explanation, notary, meals, mileage, Part V** (Business income (Sch C)) - Field additions waiting for owner sign-off. (hist L1048-1051)
9. **Schedule E Part I lines A/B, address, codes, QJV, line 43** (Rental & royalty income) - Field additions waiting for owner sign-off. (hist L1057-1060)
10. **Spouse's own 2024 Form 1040 upload** (Last year 1040 on Spouse tab) - Owner "skip for now, keep for later"; pf_prior_year_1040 still has no person column. (hist L1140-1158)
11. **Keep, remove or label Form 1040-X preview** - **DONE 2026-11-27** (owner: "remove it from the sidebar"), see Part 4.
12. **2025 Schedule SE template** - **DONE 2026-11-27** (owner-approved exception to the no-form-change rule), see Part 4.
13. **VOID and CORRECTED checkboxes still shown on statement screens** - **PLANNED FOR THE TAX YEAR 2026 UPGRADE** (owner 2026-11-27: "we will remove these checkboxes from all statement later when upgrading to tax year 2026") - remove them from every statement screen then, with the 2026 statement layouts; not possible before (statement forms can't be modified). Today they are harmless: nothing on the return uses them (the CORRECTED tick is saved but unused; VOID is referenced in 16 UI files). (hist L2087-2093)
14. **H&R Block tester: confirm screen routes** for the round-2 QA scenarios (27 entries: route guesses for sc_00161-00390, Forms-mode routes, beneficiary-age and medical-exception screens, returned excess IRA contribution, K-1 box 14/20 field ids) - waits on the tester; each scenario md already gives a fallback. (hist L2561-2587)
15. **Suite-shape questions from sc_00001 never answered** (Round-2 QA E housekeeping) - waits on the owner to answer the two suite-shape questions (hist L2629)
16. **Canada/Germany treaty Social Security has no input** - **DONE 2026-11-26**, see Part 4. (hist L2993)
17. **Active-business disposition gains only removable by override** - **DONE 2026-11-26**, see Part 4. (hist L3010)
18. **Form 2210 underpayment interest rate - yearly refresh** - 7% is right for TY2025; refresh with the TY2026 rates (owner 2026-07-14). (hist L3646-3664, hist L7245-7266)
19. **OCR-content fallback for other statement types** (OCR extraction) - The text says to wait for user reports; still W-2 only (OcrContentFallback.extractMissingW2Fields); statements area on hold. (hist L4984-4998)
20. **Spatial OCR using word polygons** (OCR extraction) - Build only if the current fallback fails on real W-2s; none reported. (hist L5000-5014)
21. **Account phone-change save e2e** (Header dialogs e2e) - Blocked from outside the code: needs a second Firebase test phone. (hist L5066)
22. **Real card processor for the payment dialog** (Payments) - Waits for monetization go-live (the text says "High once monetization goes live; Low today"); still a demo UI. (hist L5115-5127)
23. **Visual check of statement PDF overlay alignment** - **OBSOLETE 2026-11-27, moved to Part 3** (owner: the statements are pure HTML/CSS). The April 2026 note described image overlays; today every statement screen draws the form in HTML/CSS (e.g. 1099-INT `irs-statement form-1099int-html`, K-1 `k1-html-statement`) with real inputs in the cells - no picture behind them, so nothing can be misaligned. The old `<img>` overlay markup survives only inside `*ngIf="false"` blocks (SSA-1099, 5498, 3921, 8606) and in the 2026-04-29 `.bak` copies; never rendered. (hist L5669-5686)
24. **Shared FE/BE statement catalog** (Deep-pass) - Owner deferred: the Statements section is under active development; drift-guard pins added. (hist L6454)
25. **PDF vs PNG extraction differences in 18 fixtures** (Statement render differences) - Owner parked 2026-10-05 (statement upload feature on hold). (hist L7970-8039)

---

## 3. No action — decisions, accepted limits, out of scope, obsolete

- **P23 Visual check of statement PDF overlay alignment** (moved from Part 2, 2026-11-27) - obsolete: the statement screens are pure HTML/CSS, not image overlays; the overlay code left in `*ngIf="false"` blocks and `.bak` files is never rendered.
Kept so the reasoning isn't lost; nothing to build. Grouped by the old file's section.

**Closed since the reorganization**

- 1A-2 Kiddie-tax child AMT exemption limit (old §59(j)) - not a 2025 rule: the 2025 Instructions for Form 6251 (line 5 Exemption
  Worksheet: $88,100 / $137,000 / $68,500, phase-out above $626,350) and Instructions for Form 8615 (AMT paragraph) give no child limit,
  so a child's own return correctly uses the normal exemption. Closed 2026-11-23 (owner). (hist L2844)
- 1A-10 Form 5695 "other doors" $250-per-door cap - not a defect: the 2025 Form 5695 line 19 caps only the most expensive door
  (19c, $250) and the total (19h, $500); line 19e (all other doors, one amount) takes 30% with no per-door cap, as the app does.
  The result always equals §25C(b)(2)'s $250 per door / $500 total: if the top door is under the $250 cap every other door is too,
  and if it reaches $250 the $500 total leaves at most $250 for the rest. Closed 2026-11-23 (owner). (hist L2858)
- 1A-16 Refund under $1 - cannot occur: the app rounds to whole dollars (roundMoney, WHOLE_DOLLAR), so line 34 =
  roundMoney(line 33 - line 24) and line 35a = roundMoney(line 34 - line 36) is $0 (no refund) or at least $1; the 2025 i1040 states
  no sub-$1 rule. Closed 2026-11-23 (owner). (hist L6611, L6695)


**Credits after disallowance (8862)**

- Lines 14-16 exception answer - Checked 2026-11-16 against i8862: not a gap. (hist L71-73)

**Estimated tax payments**

- Old uploads lack 2024 refund applied - Closed 2026-11-16 by owner: only test uploads, no change. (hist L82-84)

**Schedule R**

- Workers' comp in line 13a - CLOSED 2026-11-17, no change needed (Pub. 915). (hist L365-370)

**Homebuyer credit repayment (5405)**

- Form 5405 not produced - CLOSED 2026-11-18: 2024 was the last year to file it. (hist L433-434)
- Joint 2024 spouse halves - CLOSED 2026-11-18 with the above (Form5405Repayment.LAST_YEAR). (hist L435-440)

**Kiddie income (8615)**

- Child required to file check - Checked 2026-11-13: always met when Form 8615 applies; legacy household copy note only. (hist L603-607)

**Additional deductions (Sch 1-A)**

- Statements confirmation on Family Head only - Design note: covers both spouses. (hist L629)

**Household employees (Sch H)**

- Quarter test, fiscal year, W-2, states - Owner closed 2026-11-20, no change. (hist L644-645)
- Schedule H preview drawing differences - Schedule H is done; minor drawing differences left as drawn. (hist L646-648)
- Worksheet 2 rates and credit reduction states - Explanation of current behavior. (hist L656)

**Foreign income (2555)**

- Notice 2025-16 figures checked - Verification record; all match. (hist L725-727)

**Archer MSA / LTC (8853)**

- Line 6a / 10 override - Owner closed 2026-11-19, no change. (hist L739-740)

**HSA (8889)**

- Line 14b code 2 amounts - Owner closed 2026-11-19: no double count. (hist L756-759)

**Self-employment tax options**

- Carryovers are a household total - Documented behavior; MFS legs use SeCarryMfs since 2026-11-13. (hist L999-1002)

**Business income (Sch C)**

- No-business advisory blank TIN - Documented behavior; separate-return SSN excluded since 2026-11-11. (hist L1052-1053)

**IRS deviations header**

- Section status, method and severity explanation - explanation only; status line says all fixed or closed except the held items listed separately (hist L1207-1224)

**IRS dev high-severity follow-ups**

- 1098-T / 1095-A / 1099-Q not person-filtered - by design: ReturnStatementOwners.java:40-45 documents why these families are excluded (hist L1259)

**IRS dev mappings 1099-B/DA/S**

- D-1099-s-4: 1099-S screen uses Rev. Dec 2026 box numbering - HELD as no change needed: values are correct, renumbering would change a statement form's structure (hist L2122)

**IRS dev mappings 1098 family**

- QLAC dollar limit ($210,000 vs $200,000 indexed) not used - CLAUDE.md records Form 1098-Q / QLAC cap as out of scope (issuer enforces the cap); the app only leaves the QLAC value out of the RMD base (TRCS:37937) (hist L2261-2262)

**Round-2 QA B**

- B8: Schedule SE rounds line 4a to whole dollars before the line‑4c - decision record: DECIDED 2026-10-18: keep (hist L2439)
- B11: Schedule SE line 12 rounding: the engine rounds every line (H&R - decision record: DECIDED 2026-10-18: keep (hist L2442)
- B13: Form 2210 per‑column rounding: each penalty slice is rounded to cents - decision record: DECIDED 2026-10-18: keep (hist L2444)
- B19: Allocated tips as qualified tips: Schedule 1-A takes Form 4137 line - decision record: DECIDED 2026-10-18: keep (hist L2450)

**Round-2 QA D H&R Block findings**

- Form 4972: H&R Block prints line 5a although Part III is used - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2591)
- QCD $108,000 cap not applied by H&R Block (sc_00062, as round-1 sc_00264). - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2592)
- Below-fair-rent rental to a relative: H&R Block allowed a 5,400 loss in - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2593)
- Charitable: H&R Block deducted market value where basis applies (sc_00113 B, sc_00114 - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2594)
- sc_00058: graded 4a blank; if H&R Block prints 25,000 that row fails. - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2595)
- §30D MSRP cap: H&R Block never asks the MSRP — sc_00175 Runs - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2596)
- MFS Social Security lived apart all year: guided mode cannot express it - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2597)
- H&R Block grants head of household from the status radio alone (run - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2598)
- Schedule R box 2 (under 65, disabled): round 1 found the guided - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2599)
- Part II-B of Schedule 8812 (3+ children) and Form 8582 aggregation across - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2600)
- H&R Block 2025 has no Form 8834, 8911 or 8912 - H&R Block limitation; scenarios sc_00201-00203 reworked 2026-10-15 so those rows are ungraded (hist L2601)
- Expected H&R Block deviations for sc_00211-00220 - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2602)
- Expected H&R Block deviations for sc_00221-00230 - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2603)
- Expected H&R Block deviations for sc_00231-00240 - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2604)
- Expected H&R Block deviations for sc_00241-00250 - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2605)
- Expected H&R Block deviations for sc_00251-00260 - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2606)
- Expected H&R Block deviations for sc_00261-00270 - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2607)
- Expected H&R Block deviations for sc_00271-00280 - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2608)
- Expected H&R Block deviations for sc_00281-00290 - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2609)
- Expected H&R Block deviations for sc_00291-00300 - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2610)
- Expected H&R Block deviations for sc_00301-00310 - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2611)
- Expected H&R Block deviations for sc_00311-00320 - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2612)
- Expected H&R Block deviations for sc_00321-00330 - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2613)
- Expected H&R Block deviations for sc_00331-00340 - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2614)
- Expected H&R Block deviations for sc_00341-00350 - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2615)
- Expected H&R Block deviations for sc_00351-00360 - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2616)
- Expected H&R Block deviations for sc_00361-00370 - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2617)
- Expected H&R Block deviations for sc_00371-00380 - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2618)
- Expected H&R Block deviations for sc_00381-00390 - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2619)
- Round 1's H&R Block run of sc_00210 showed no EIC (owed 1,695) - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2620)
- MFS rental special allowance: if H&R Block never asks at any time - H&R Block's own behaviour, not an app bug; recorded so the tester expects it (hist L2621-2622)

**Round-2 QA E housekeeping**

- GitHub collaborator invite for us-tax-hrb2025 - owner skipped the invite 2026-10-22 (hist L2630-2631)
- Scenario commit messages state wrong check counts - record only; spreadsheets are right and history.md records each slip (hist L2632)
- sc_00213-00217 check count and Lasser section slips - record only; corrected in d960e8d (hist L2634)
- sc_00223 commit message check count wrong - record only (hist L2635)
- sc_00242 commit message check count wrong - record only; empty correction commit 3f15ba8 (hist L2636)
- sc_00253 commit message check count wrong - record only; correction commit 3697d71 (hist L2637)
- sc_00265 commit message check count wrong - record only; correction commit 2acf984 (hist L2638)
- sc_00274 check count and memory-quoted citations - record only; correction commits dbae606 / e0b47d1 / 96dd742 (hist L2639)
- Stale bug claims in us-tax-hrb _repro_progress.md - file in another repo with no remote, deliberately not edited; claims superseded (hist L2640)
- sc_00282 check count; 2025 texts not added as PDFs - record only; docs/IRS-Forms now also holds f1040sh.pdf / i1040sh.pdf (hist L2643)
- sc_00297 check count and memory-quoted IRC 1031(b) - record only; replaced in b16472c (hist L2645)
- irs_text f3800.txt was the 2024 form - already replaced with the 2025 form by sc_00293 (50f5651); line numbers unchanged (hist L2646)
- sc_00302 check count and memory-cited statutes - record only; fixed in 56fb3a0 (hist L2647)
- sc_00314 check count and memory-quoted citations - record only; replaced in 2c4ac1e (hist L2648)
- sc_00329 check count and IRS publication typos - record only; correction commit 8186254 (hist L2649)
- sc_00333 check count and round-1 Lasser citations - record only; correction commit 4d55517 (hist L2650)
- Round-1 Lasser citations corrected by sc_00341-00350 - record only; its 'still untracked PDFs' remark is obsolete (committed 2026-10-23, line 2642) (hist L2651)
- Round-1 Lasser citations corrected by sc_00351-00360 - record only (hist L2652)
- sc_00366 check count and Lasser citations - record only; noted in sc_00367 commit 5c7571c (hist L2658)
- sc_00371-00380 citations; line5abc spec changed not run - record only; line5abc-pension-withdrawals.spec.ts has since been run green (history.md:156, :5095) (hist L2659)
- sc_00381-00390 Lasser citations and ungraded conventions - record only (hist L2660-2661)

**MAGI audit LOW**

- Form 8863 spouse-side PR/4563 add-backs - Verified non-issue: household-total fields on the taxpayer form by design. (hist L2791-2794)
- Historical LOW list (#8-#10) - Marked superseded; all three resolved above. (hist L2796-2804)

**Verification sweep: correct-as-is**

- AMT NOL / ATNOLD line 2f - Correct as-is; separate AMT NOL track is an accepted narrow edge. (hist L2827)
- Form 8606 nondeductible advisory text - Compute complete; only a trivial text nudge, accepted. (hist L2828)
- 461(l) carryforward and negative Form 8978 - Confirmed correct earlier. (hist L2829)

**Verification sweep: needs field**

- Form 4972 Part III page-3 worksheets - No effect on the filed return; recommended won't-do. (hist L2838)

**Capital gains audit**

- Special-rate gain auto-extraction findings #6/#10-#12 - Closed: already covered by designation fields; the extraction is a convenience only. (hist L2866)

**QBI audit**

- De-minimis SSTB safe harbor not automated - Accepted for self-filing: the user answers the SSTB question. (hist L2870)

**QBI audit 2026-08-01**

- Null W-2 wages above threshold treated as $0 - Deliberate and IRS-correct; at most an optional advisory. (hist L2875)
- F-E duplicate of SSTB dilution - Duplicate of #6 (now done). (hist L2877)

**Form 8959 audit**

- Whole-dollar rounding of the 0.9% lines - Ambiguous, left as-is; lines 13/17 are now rounded per line anyway. (hist L2884)

**Line 16 audit**

- 16.md stale bits and LOW notes - MFS typo fixed; the rest are unreachable or doc-only notes. (hist L2893)

**PTC audit**

- Stale-item correction note - Explanation that the neighbouring items were already fixed. (hist L2899-2907)

**EIC audit**

- LOW edges (relationships, Medicaid waiver, etc.) - Documented and accepted limitations. (hist L2985)

**Social Security re-audit**

- MFS residence flag scoping - Verified false positive. (hist L2994)

**NIIT audit**

- Lines 1/2 business carve-out and line 3 default - Documented as defensible; overrides are available. (hist L3014)

**SE plan, Form 4797**

- Activate the Form 6252 statement mapper - Superseded: installment sales now come from personal forms through Form6252Compute.sales(); the statement mapper is left dormant on purpose (Form6252Mapper.formIds returns an empty set). (hist L3045)

**SE plan, SE health**

- Pub. 974 remaining simplifications (MFS, months ratio, split) - Documented, accepted simplifications. (hist L3046)

**SE plan, decisions**

- Owner scope and sequencing decisions of 2026-07-19 - Decision record; C4 depreciation engine marked COMPLETE. (hist L3050-3078)

**SE plan, §G**

- Registry hazards checklist - Reference checklist, not a work item. (hist L3318-3326)

**SE plan, §H**

- SQA acceptance targets with stale numbers - Reference only; coverage handled in C7d. (hist L3328-3343)

**SE plan, §I**

- Still out of scope after the plan - Out of scope by design. (hist L3345-3351)

**§199A rental QBI**

- Optional read-only display of the auto-included rental QBI - Optional enhancement; the double-entry residual is accepted. (hist L3486-3491)

**Form 5329**

- No default cap at the year-end account value - Intended conservative default; the IRS cap applies whenever the value is entered. (hist L3514-3516)

**MFS spouse forms**

- Form 4868 #46 spouse standalone extension edge case - Noted rare edge; the MFJ path is unchanged and no gap is named. (hist L3666)

**Dependent-own returns**

- Auto-offered core statement list and dependent_id on rows - Left out by owner choice; SSN matching works. (hist L3670-3697)

**Line 6d**

- Duplicate entry; optional radio-group UI polish - Superseded by the blocker; the radio group is optional polish, not a gap. (hist L3892-3933)

**Tips**

- Adequate-records options considered but skipped - Decision record; marked CLOSED with no action. (hist L4892-4913)

**Extraction UI**

- Show the missing-fields list after extraction - Owner does not want it; the review-before-save banner already exists; confidence bars are not possible today. (hist L5016-5037)

**Line 5**

- Pension wizard implementation plan (archived) - Archived plan for work marked Implemented at 5386. (hist L5392-5489)

**Line 1z**

- Single 8-way sub-line e2e test - Explicitly left open as a low-value nice-to-have; the 5-way test covers the sum. (hist L5569-5579)

**Header**

- Timestamp and Form 4852 note; 1040-X trigger out of scope - Timestamp and decision note only. (hist L5620-5621)

**Identification**

- Spouse identification live e2e pending credentials - Obsolete environment note; e2e runs routinely with shared credentials. (hist L5694-5696)

**Remaining work**

- Priority list intro narrative - Narrative only; the items are listed below. (hist L5700-5704)

**Priority 6**

- Schedule 8812 sidebar always visible - Deliberate section-wide TEMP toggle (shell.component.ts:1682+ `if (true /* ... */)`); a decision record. (hist L5907)

**Form 8888**

- IRA/HSA account types - Form 8888 only asks checking or savings; an IRA/HSA is a checking/savings-type account (i1040 lines 35a-d), so no change needed. (hist L5950)
- Routing number Mod-10 check - Decision record; the IRS does not validate it at filing. (hist L5951)

**Form 8862**

- EIC ban-period check - The IRS enforces bans administratively; accepted limit. (hist L5967)
- LLC not affected - Explanation only. (hist L5968)

**Schedule R**

- Physician / VA statement records - Records kept by the filer, not filed with the return; out of scope. (hist L6125)

**Line 26**

- MFS spouse form isolation - Explanation only; no code change needed. (hist L6137)
- Form 1040-ES voucher PDF - Next-year vouchers are not filed with the return (IRS-attachment scope rule). (hist L6139)

**Form 4868**

- Combat zone automatic extension - Out of scope; no form is filed. (hist L6150)

**Form 8911**

- Census-tract GIS lookup - Needs an outside lookup service; the user confirms eligibility (Form8911Stops). (hist L6258)

**Form 8912**

- Treasury credit-rate lookup - Outside data; the user enters the rate and the base credit is computed (Form8912DirectBondEntry). (hist L6270)
- CREB/QZAB unused-credit deduction - Decision record: no 2025 Form 1040 line for it; advisory FORM_8912_UNUSED_CREB_QZAB_CREDIT_DEDUCTIBLE. (hist L6271)

**Form 2555**

- Yearly update of high-cost housing limits - Recurring yearly maintenance note, not 2025 work. (hist L6304)

**Form 8839**

- G8 semantic field mapping check - Documentation only; no tax effect, and the pure-HTML preview replaced the PDF fill. (hist L6322)

**Output wiring / Line 5**

- Attach 1099-R with withholding - Paper attachment rule; the app is electronic self-filing only. (hist L6368)

**Output wiring / Line 8**

- Topic-hub UI for other incomes - Superseded by the screen-review rebuild (sectioned screen with less-common toggle and Clear). (hist L6394)

**Dependent return**

- Dependent return generation (cancelled) - Cancelled 2026-06-04; later superseded by the dependent_own multi-return build. (hist L6425-6432)

**Deep-pass**

- More frontend tests - Open-ended goal; 114 UI spec files now exist. (hist L6453)

**Line 31 gaps**

- G13 uncertain f1_29 PDF field for line 13d - Obsolete: Schedule 3 preview is now pure-HTML keyed by semantic names (form-tax-return-schedule3.component.ts:304-309 maps line13c/line13d by name), so the AcroForm short-name question no longer applies. (hist L6511)

**Refund deferred items**

- Form 8888 IRA/HSA/ESA/MSA account types - Premise wrong: the 2025 Form 8888 type box is only Checking/Savings (f8888_field_map_semantic.csv lines 1c/2c/3c), which matches the UI accountTypes at form-refund-and-amount-owed.component.ts:342. (hist L6693)

**Statement family check**

- RRB-1099 claim numbers not SSN-checked - Owner-approved deliberate skip (B94, 2026-10-20): StatementSsnRules.STATEMENT_SSN_RULE_SKIPS lists rrb-1099/rrb-1099-r with a guard test. (hist L6711)
- Form 8606 not SSN-checked - Out of scope by design (ownerRole, not recipient SSN). (hist L6715)
- Transactional schedules not SSN-checked - Out of scope by design (no recipient SSN field). (hist L6717)
- Child interest/dividends not SSN-checked - Out of scope by design (dependent-scoped storage). (hist L6719-6721)

**Form 8889/8853/4797 compute**

- Old user-fill stub write-up and effort table - Superseded history; all three forms are now computed. (hist L6761-6789)

**Pure-HTML view gaps**

- Gap 5 Schedule D placeholder fields - Blank by IRS design; documented as no action. (hist L6992-7000)

**Preserved legacy components**

- Keep four legacy refund screens (DO NOT DELETE) - Obsolete: the four components (form-direct-deposit, form-refund-allocation, form-apply-next-year, form-prior-year-tax) no longer exist and shell.component.ts mounts only form-refund-and-amount-owed (removed 2026-11-14, V478); the entry should be deleted. (hist L7004-7048)

**Form 4972 view gaps**

- 4972-3 page 3 worksheets - Recommended won't-do: three unbuilt records-only worksheets, never filed, zero return impact. (hist L7123-7136)

**Form 4972/8863 view gaps**

- Cumulative summary table - Stale summary of the gaps above, all now closed or won't-do. (hist L7226-7241)

**Multi-return items**

- Cross-request duplicate prepare() runs - Within-request fix done; the cross-request case is a decision to leave as-is (caching would risk stale results). (hist L7303)
- Line 20/31/32/33 test coverage - Verified essentially closed; no gap remaining. (hist L7305)

**Schedule A mortgage**

- Home-equity loan use-of-proceeds tracing - Decision record: user judgment, deliberately not computed. (hist L7307-7309)

**Schedule A charitable**

- Quid pro quo, donated car, appraisal cases - Pass-through by design (user enters net deductible amount). (hist L7316)

**SQA Tier B2**

- Intake-completeness flags not converted - Excluded by design (no IRS outcome to grade). (hist L7426-7430)
- Families already covered elsewhere - Already covered by existing scenarios. (hist L7432-7435)

**Section 465 at-risk**

- Pre-V225 carryforward provenance transition - Accepted, bounded and self-healing limitation; revisit only if it becomes material. (hist L7449-7473)

**Territory exclusions**

- Form 1116 reduction for excluded territory income - Advisory by design (TERRITORY_EXCLUSION_FOREIGN_TAX_CREDIT_REDUCTION_REQUIRED, TaxReturnComputeService.java:7575); the inputs it needs are not on a U.S. return. (hist L7619-7621)

---

## 4. Completed

One line per finished entry, with the evidence (class, migration, date). Grouped by the old file's section.

**Finished since the reorganization**

- 1E-49 Separate return previews after a reload (2026-11-27, owner-approved; be d9e868b1, UI 37742bc): GET /api/tax-return/{id}
  reads a dependent's own / MFS / HOH-split return's saved rows; the page loads it the first time a preview asks. Read-only.
- P2 Form 8615 preview (2026-11-27, owner-approved Stage A / B; be 698f0462, UI 4f70cf8): pure HTML/CSS from the 2025 IRS PDF, on the
  child's own return (the dependent's tab), filled by Form8615Fields - header incl. the parent's name / SSN / filing status, lines
  1-18 (12a / 12b only with line 7), the worksheet boxes. Note: multi-return-full-household runs near its 240 s limit (3.4 min alone).
- P11 Form 1040-X preview (2026-11-27, owner decision; UI 7d09f6c): removed from the Tax Return sidebar - the app doesn't
  amend filed returns (owner 2026-11-02). The blank preview component is kept unchanged, just not listed.
- Statement-screen cleanup (2026-11-27, owner-approved; UI 9f96342): 24 unused .bak copies (21,727 lines) and the never-shown
  *ngIf="false" overlay blocks (628 lines in 8606, 5498, 3921, RRB-1099-R, SSA-1099) removed; nothing on screen changed.
- P12 2025 Schedule SE template (2026-11-27, owner-approved exception; be 08aa7174, UI f70780d): the preview is drawn on the 2025
  IRS printing (docs/IRS-Forms/Schedule SE 2025.pdf) - only printed text changed (2025, $176,100, $7,240, $10,860 / $7,840); same
  fields and boxes; the 2024-text note removed. Owner reviewed the Stage A screenshots.
- 1D-48 Unreliable e2e tests (2026-11-27; be 8bd27fed): only D-6198-6 was flaky - the Form 8859 preview and
  withheld-income-not-reported never failed (the full regression's summary had no flaky count; their "(retries)" progress lines were
  misread). D-6198-6 failed in setup as the first test after a Maven build (dev-mode restart); reproduced; fixed in the helpers
  (globalSetup waits for /q/health/ready, clearUserData retries after waiting). 30/30 with no retries.
- 1A-47 Real estate professional 500-hour NIIT safe harbor for K-1 box 2 and Form 4835 farm rentals (2026-11-27, owner-approved
  option a, V579; be dedaa475, UI 4461ae1): the question inside the K-1 (1065 / 1120-S) material participation box and on the farm
  rental; without Yes the nonpassive box 2 / farm rental stays in NII; a rental K-1's section 1231 gain needs it for line 5b too.
  Not covered: K-1 (Form 1041).
- 1A-46 Form 8960 line 5b for installment sales, like-kind exchanges and business casualties (2026-11-27, owner-approved option a,
  V578; be 9f95c730, UI 7e0de60): one business-use question per item; the recognized gain or loss of an actively run business's
  (or a safe-harbor rental's) property comes off line 5b. Form8960OtherDispositions. Not covered: the section 1043 sale.
- K-1 blank material participation is passive (2026-11-27, owner-approved option a, follows 1A-6; be 7946c1eb): one rule,
  K1ParticipationBlank.passive (passive unless Yes), in isPassiveK1, K1PassThroughAmounts, K1Passive1231, Form8911Business; the 1A-6
  blocking flag stays.
- Real estate professional rentals (2026-11-27, owner-approved option a, V577; be cdf34905, UI 0c7b784): material participation
  must be answered Yes (a blank counted as Yes); NIIT excludes a nonpassive professional's rental only with the 500-hour safe harbor
  (new per-property question); a safe-harbor rental's sale comes off Form 8960 line 5b. RentalReProNiit. Not covered: K-1 rental
  real estate, Form 4835 farm rentals, the §1.469-9(g) grouping election.
- P17 Form 8960 active-business sales (2026-11-26, owner-approved option a; be 5bb387e3, UI 7ad3e5a): line 5a = Form 1040 line
  7a + Schedule 1 line 4 (the Form 4797 ordinary part was missing); line 5b backs out a Business property sale used in a materially
  participated Schedule C business or farm (with the 1A-7 K-1 amount). Not covered (typed line 5b): Form 6252 / 8824 / 4684
  dispositions of business property; rentals (the real estate professional fix, next). Form8960Line5bBusinessSales.
- P16 Social Security tax treaties (2026-11-26, owner-approved option b, V576; be 5937e059, UI 1f6e269): both Pub. 915 rules -
  Canadian / German social security of a U.S. resident is added to line 6a (Worksheet 1 line 1); a U.S. citizen living in Canada,
  Egypt, Germany, Ireland, Israel, Italy (also Italian), Romania or the UK has their benefits left out of lines 6a / 6b (all year, or
  the part received there). No Form 8833 (waived for social security). SocialSecurityTreaty; lines/6abcd.md §2.5.
- 1B-26 Territory filers' itemized deductions tied to one kind of income (2026-11-25, owner-approved option b, V569): per Schedule A
  line, the part tied to the excluded income isn't deducted, the part tied to U.S.-taxed income is in full, the rest is prorated
  (Pub. 570). TerritoryRelatedDeductions.
- 1B-25 Form 4972 for a beneficiary of more than one participant (2026-11-24, owner-approved option a, V568): one Form 4972 per
  participant's distribution, the taxes added on line 16 box 2; the screen switches between participants, the preview between copies.
  Form4972Participants.
- 1B-23 Form 8396 with more than one mortgage credit certificate (2026-11-24, owner-approved, V567): each other certificate figured
  on its own and added into the one Form 8396's lines 1 and 3 with the attached statement (Pub. 530). Form8396Rules.additional.
- 1B-22 K-1 at-risk suspended loss carried to next year automatically (2026-11-24, owner-approved option b, no form field):
  each partnership K-1's loss over its amount at risk is recorded and fills that K-1's blank box next year; the Suspended passive
  losses screen shows last year's amount read-only. K1AtRiskCarry.
- 1B-20 Foreign tax credit one-year carryback (2026-11-24, owner-approved option b, V566): this year's unused foreign tax goes to
  last year's excess limit first (typed, else last year's return here) and out of the carryforward, with a Form 1040-X advisory.
  Form1116Carryback.
- 1C-28 Form 1040 line 27b is ticked for clergy filing Schedule SE whose line 2 includes ministerial W-2 wages or a housing allowance
  over the limit (both also on line 1z); not under an approved Form 4361 (ClergyLine27b, V564; 2026-11-24). (hist L3086, L5979)
- 1B-24 Form 8859: when last year was a joint return and this year is married filing separately, last year's joint line 4 is no longer
  imported onto one return (the instructions give no split); advisory FORM_8859_JOINT_CARRYFORWARD_SPLIT on both returns asks each
  spouse to enter their own share (Form8859Rules.bridged / flag; 2026-11-24). (hist L6237)
- 1B-27 Foreign Earned Income Tax Worksheet line 2b is asked on the Foreign income screen (Family Head's copy, when the exclusion is
  claimed) and saved on Other tax items (feitwLine2bDisallowedDeductions, no new field; 2026-11-24). (hist L660)
- 1A-1 AMT: Form 6251 line 10 now adds all of Schedule 2 line 1z - the clean vehicle credit repayments (lines 1b/1c) figured after
  the AMT join line 10 and lower the AMT, line 17 and line 18 (AmtLine10Schedule2; 2026-11-22). (hist L2842)
- 1A-3 EIC investment income: the royalty tier (royalties + rental of personal property, Schedule 1 line 8l - 24b) and the
  passive tier are floored at $0 separately per Pub. 596 Worksheet 1 lines 10 / 13 (EicInvestmentIncomeTiers; 2026-11-23). (hist L2982)
- 1A-4 MFS blank recipient SSN: on a married-filing-separately return a one-person statement with no recipient SSN (and no name that
  settles its owner) is now a BLOCKING, overrideable STATEMENT_RECIPIENT_SSN_BLANK; other returns keep the advisory; each statement is
  counted once (ReturnStatementOwners; 2026-11-23). (hist L2876, L3016)
- 1A-5 Form 8959 blank filer SSN: on a return that is not joint, lines 1 / 14 / 19 leave out W-2s carrying another household
  person's SSN (the MFS list still holds the spouse's) and still count W-2s with no SSN (Form8959OwnW2s; 2026-11-23). (hist L2887)
- 1A-6 K-1 participation blank: a 1065 / 1120-S / 1041 K-1 with Part III amounts and no "materially participate" answer is a
  BLOCKING, overrideable K1_<form>_MATERIAL_PARTICIPATION_BLANK; an overridden blank stays nonpassive (K1ParticipationBlank;
  2026-11-23). (hist L3013)
- 1A-7 Form 8960 line 5b: with nothing typed, line 5b = -(the net section 1231 gains on K-1s answered "materially participated: Yes",
  1065 box 10 / 1120-S box 9, PTPs and other people's K-1s skipped), capped at Schedule D line 11 and line 7a (Form8960Line5bK1;
  2026-11-23). Known limit: a trading partnership's gain is backed out too - the help text tells the user to type line 5b. (hist L1255)
- 1A-8 Pub. 974 SE health / PTC solver: reads the same earned income as line 17 (Schedule C/F + K-1 SE earnings, Form 7206
  adjusted; SeDeductionsResult.earnedIncome), so a K-1-only partner with a Marketplace plan is coordinated (2026-11-23). (hist L1256)
- 1A-9 Form 8936: the new clean vehicle tentative credit is capped at $7,500 per vehicle with advisory
  FORM_8936_NEW_VEHICLE_CREDIT_OVER_7500 (NewCleanVehicleCap; 2026-11-23). (hist L2857)
- 1A-11 QBI §461(l) (option b): the disallowed excess business loss is added back on the QBI-loss activities pro rata (i8995 p.5),
  and carried into next year's QBI loss carryforward from last year's Form 172 (QbiExcessBusinessLoss; the Form 172 loader now
  loads excessBusinessLoss461lThisYear; 2026-11-23). Approximation: all of it enters next year's QBI. (hist L2872)
- 1A-12 Form 8962: each month is figured from its printed whole-dollar (a) / (b), and lines 24 / 25 add the printed (e) / (f)
  (2026-11-23). (hist L2977)
- 1A-13 Form 8615 line 9: the other children's 28%-rate / section 1250 gain on line 7 is taxed at 28% / 25% (each sibling's line 5
  split recorded by Form8615SiblingSlices, read by KiddieTaxParentReader; 2026-11-23). (hist L5855)
- 46 Royalty kind (V561, owner-approved field): automatic 15% percentage depletion for oil and gas only; other minerals typed (advisory);
  book / music / copyright / patent / other royalties get no depletion (a typed amount is left off, advisory); unanswered = none
  with ROYALTY_KIND_UNANSWERED (RoyaltyKind; 2026-11-23).
- 47 Form 8995 in a year with no income: a QBI loss carrying in now makes the form (taxable income before QBI null -> $0), so the
  loss carries on (2026-11-23).
- 1A-15 Form 2441 MFS: the spouse's earned income left blank with no spouse W-2 now blocks (overrideable)
  DEPENDENT_CARE_MFS_SPOUSE_EARNED_INCOME_LIMIT; 0 = nothing excluded (2026-11-23). (hist L3004)
- 1A-14 Oil and gas percentage depletion: 65% of taxable income limit (IRC 613A(d)(1)) with a re-run, the excess and each royalty
  property's year-end mineral basis carried to next year on Schedule 1 (V562; RoyaltyDepletionLimit / RoyaltyDepletionBridge;
  2026-11-23). (hist L2490)
- 1A-17 Territory filers: the tips / overtime excluded as Puerto Rico or American Samoa income come off before the Schedule 1-A caps
  (V563, asked only of territory excluders; TerritoryTipsOvertime; 2026-11-23). (hist L7609)


**Refund and amount owed**

- 2024 tax for Form 2210 line 8 asked as worksheet - V481, PriorYearTaxWorksheet; dependent copy prior-year-tax-dependent. (hist L5-10)
- Box E joint 2025 after separate 2024 returns - Both spouses' worksheets added since 2026-11-15 - JointPriorYearTax. (hist L11-14)
- Four legacy refund/prior-year screens removed - V478 removed components, shell entries, form ids and YAMLs. (hist L19-22)

**Dependent**

- Joint-return test for a married dependent - V479, DependentQualification.flagMarried with blocking flags. (hist L26-33)

**Foreign assets (8938)**

- Part III interest/dividends from Forms 1099-INT/DIV - Form8938Statements since 2026-11-13; other assets' items stay typed by design. (hist L37-40)
- Line 18 number of Forms 8621 typed - V482 forms8621Count, Form8938Parts.line18. (hist L41-43)

**Schedule 3 Part II**

- Line 13c Form 3800 elective payments - Explicit DONE 2026-11-15 (V487, Forms 7210/8933/7207); the remaining rare sub-cases block on purpose. (hist L53-57)
- Section 1341 advisories cleanup - Threshold flag removed and both-claimed made advisory 2026-11-12. (hist L58-60)

**Credits after disallowance (8862)**

- Line 8 child date of death printed - V488, DEPENDENT_DATE_OF_DEATH_INVALID. (hist L64-66)
- More people than form rows go on a statement page - "Form 8862 statement" page with FORM_8862_STATEMENT since 2026-11-16. (hist L67-70)

**Estimated tax payments**

- Legacy Prior Year Tax & Estimated Payments screen removed - V478. (hist L77-78)
- More than one payment per period - V489 pf_estimated_tax_extra_payment, EstimatedTaxPaymentDates.extras. (hist L79-81)

**Form 4852**

- Replaced W-2/1099-R matched by EIN or name - Form4852Replaces since 2026-11-12. (hist L88-89)

**Earned income credit**

- SSN valid for work checked - V490, SsnForWork. (hist L93-97)
- Married child rule for typed children - V480, EicInputs.marriedChildBarred. (hist L98-101)

**Retirement savings credit (8880)**

- Line 4 military pay and inherited IRA exclusions - V491, Form8880Inputs.excluded. (hist L105-108)
- Line 2 non-governmental 457(b) excluded - V492, Form8880Inputs.nonGovernmental457b. (hist L109-112)
- ABLE contributions stay typed with 5498-QA guide - Screen lists Forms 5498-QA and warns since 2026-11-16; typed by design. (hist L113-115)

**Foreign tax credit (1116)**

- Mutual fund foreign-source share of box 1a - V493, Form1116Inputs.withForeignSource. (hist L119-122)
- K-1 1120-S and 1041 foreign taxes read - Form1116Inputs.statementSources since 2026-11-16; K-1/K-3 income by category stays typed. (hist L123-126)
- AMT foreign tax credit without 59(a)(4) election - Form6251AmtFtc (V475) with carryover by year; other AMT adjustments to foreign income are a documented simplification. (hist L127-133)
- Line 3e uses gross business/rental income - Form1116Inputs.netToGross since 2026-11-12. (hist L134-135)
- Line 16 adjustments, loss accounts, lump-sum worksheet - V472 ForeignSourceBusinessLoss, Form1116LossAllocation, carryovers kind ftcloss, Form1116LumpSum; 904(f)(3) not asked (documented limit). (hist L136-151)
- Carryover kept in a deduction year - Form1116DeductionYear, FORM_1116_CARRYOVER_IN_DEDUCTION_YEAR since 2026-11-12/14. (hist L157-165)

**Additional deductions (13b)**

- 1099 tips amount asked - V494, Tips1099.withTipAmounts. (hist L169-172)
- Line 4c tips by employer worksheet - TipsByEmployer since 2026-11-12. (hist L173-174)
- W-2 box 14 tips and overtime - V495, W2Box14Answers. (hist L175-179)
- Business tips limit per business - V496, BusinessTipsLimit. (hist L180-183)

**Standard or itemized (Sch A)**

- Medical lodging for up to 4 travellers - MedicalLodgingLimit.MAX_PEOPLE. (hist L187-188)
- Territory W-2 tax deducted on Schedule A - V497, TerritoryW2s.deductOnScheduleA; split between separate returns not checked (minor). (hist L189-193)
- Part employer-paid coverage excess reimbursement share - V476, MedicalExcessShare. (hist L194-197)
- Private-foundation 30% limit capital gain property - Fixed 2026-11-12 (Pub. 526 Worksheet 2 line 20). (hist L198)
- Points through Pub. 936 Table 1 ratio - Fixed 2026-11-12. (hist L199-200)
- Mortgage over-limit question for blank average balance - V498, SCHEDULE_A_MORTGAGE_AVERAGE_BALANCE_NEEDED. (hist L201-204)
- MFS split of gambling losses and line 16 items - V477, MfsScheduleAAllocator. (hist L205-208)

**QBI deduction (13a)**

- Aggregation for farms and safe-harbor rentals - Cards with farm/rental keys since 2026-11-16. (hist L212-214)

**Premium tax credit (8962)**

- Line 2b from dependents' own returns - DependentOwnMagi since 2026-11-13; dependent without a return stays typed by design. (hist L218-222)
- Spouse's separate-return dependents MAGI - spousePtcDependentMagiEntries since 2026-11-16. (hist L223-227)

**Mortgage interest credit (8396)**

- Certificate reissued at a different rate - V499, Form8396Rules.reissue. (hist L231-234)
- Recapture on home sale via Form 8828 - FORM_8828_MCC_HOME_SOLD since 2026-11-12. (hist L235-237)

**Electric vehicle credit (8834)**

- Line 1 credit released from prior-year carryover - V500, FORM_8834_RELEASED_FROM_CARRYOVER; full Form 8582-CR sharing with other passive credits remains a documented simplification. (hist L241-245)

**Credit for tax credit bonds (8912)**

- Unused CREB/QZAB credit deduction - Warning only by owner decision - Form8912Carryforward. (hist L249-252)
- Pass-through CREB limit - V501, Form8912PassThrough. (hist L253-257)
- Form 1097-BTC monthly boxes - Form8912Statements.withMonthTotals. (hist L258-261)
- Old typed 1097-BTC rows removed - V502. (hist L262-264)

**Refueling credit (8911)**

- Line 3 business part to Form 3800 line 1s - Form8911Business since 2026-11-17. (hist L268-273)
- K-1 code AO passive credit limit - Form8911Business.limitPassive; prior-year disallowed passive credit has no entry (would need a new field, owner sign-off). (hist L274-278)
- Owner name/TIN and coordinates - V503, Form8911Business.ownerAndCoordinates. (hist L279-281)
- Basis reduction reaches depreciation - CreditBasisReduction, AssetCostCarry. (hist L282-286)

**Clean vehicle credit (8936)**

- Business-use part to Form 3800 line 1y - Form8936Business since 2026-11-17. (hist L290-292)
- Commercial clean vehicle credit - V504, Form8936Commercial. (hist L293-296)
- K-1 codes AY/AZ clean vehicle credits - K1VehicleCredits since 2026-11-17. (hist L297-301)
- 2024 MAGI from 2024 return here - Since 2026-11-11. (hist L302-303)
- 2024 MAGI tested against 2024 status - CleanVehicleRules.PRIOR_STATUS. (hist L304-305)
- Line 13g from household dependent answer - V505, CleanVehicleRules.withHouseholdDependent. (hist L306-308)
- Basis reduction reaches depreciation - CreditBasisReduction, AssetCostCarry. (hist L309-313)

**Prior-year minimum tax credit (8801)**

- Lines 1, 2, 14, 16 from last year's return - V474, Form8801PriorYearLines; depletion line 2m stays typed (documented). (hist L317-322)
- Part III and MTFTCE from last year - Form8801PriorYearLines, Form8801Mtftce. (hist L323-327)
- 2024 Form 1040-NR real property gain floor - V506, Form8801Rules.line10NrFloor. (hist L328-329)
- Bridge reads each return's own prior return - Since 2026-11-11. (hist L330-331)

**Investment interest (4952)**

- Lines 4a/4b from 1099-INT/DIV - FIXED 2026-11-17, Form4952StatementIncome. (hist L335-339)
- Investment interest asked on two screens - Closed 2026-11-17; V455 dropped the duplicate. (hist L340-344)
- AMT Form 4952 and line 4e election - CLOSED 2026-11-17: V507 Form4952Amt; 4e not supported by decision. (hist L345-352)
- Line 8 parts carried to activities - FIXED 2026-11-17, V508 Form4952ActivityInterest. (hist L353-358)

**Schedule R**

- Blank claim answer by age - ScheduleRByAge since 2026-11-12. (hist L362-364)
- Spouse first names on Part II line 2 - FIXED V509, ScheduleRSpouseNames. (hist L371-374)
- out_schedule_r keeps physician answers - FIXED V510, ScheduleRRowFields. (hist L375-378)

**General business credit (3800)**

- Carryforward per credit and year - FIXED V511, Form3800Carryforward. (hist L397-403)
- Line 7 exclusions - Form3800Line7 since 2026-11-12. (hist L404-405)

**Suspended passive losses (8582)**

- Per-K-1 disposition and typed carryovers - V471, K1PerActivity, V512 K1TypedCarryovers. (hist L409-422)
- Part V share per activity on full sale - FIXED 2026-11-18, PassiveCarryforwardByActivity.seed. (hist L423-429)

**Home energy credits (5695)**

- Joint occupants allocation - FIXED V513, Form5695JointOccupancy. (hist L444-451)
- Line 17e new-home construction - FIXED 2026-11-18, EnergyCreditInputs.withoutNewHomeConstruction. (hist L452-458)
- Form 5695 statement page - FIXED 2026-11-18, Form5695Statement. (hist L459-466)

**Education credits (8863)**

- No Form 1098-T exception for spouse's student - FIXED 2026-11-18, EducationCreditComputations.spouseStudentHas1098T. (hist L470-475)
- Screening fields shown again - FIXED 2026-11-18, EducationCreditsInputs.withNonresidentStatus. (hist L476-482)
- Third and later schools - FIXED V514; extra page 2 in preview not printed by owner decision. (hist L483-488)

**Business interest limit (8990)**

- Lines 6 and 10 two-pass; exempt release - Form8990TwoPass, Form8990Compute.releasedWhenExempt. (hist L492-496)
- Schedules A/B; gross receipts test - Schedules FIXED V515 (Form8990Schedules); gross receipts / excepted allocation CLOSED by owner. (hist L497-506)

**Mortgage subsidy recapture (8828)**

- Sale details from Form 1099-S - FORM_8828_FILLED_FROM_1099S since 2026-11-12. (hist L510-512)
- QSML adjustment; one home per year - QSML FIXED V516; one home CLOSED by owner. (hist L513-520)

**Low-income housing recapture (8611)**

- Line 2 worksheet; line 11 interest - Line 2 FIXED V517 Form8611Line2Worksheet; line 11 CLOSED (typed) by owner. (hist L524-531)

**Foreign assets (8938)**

- Parts III and IV not filled - Stale: Form8938Parts fills Part III and Part IV (V463, V482). (hist L535-536)
- Specified individual / NRA spouse joint asset - Form8938Compute handles a nonresident spouse (full value) since 2026-11-12; a nonresident filer doesn't use Form 1040. (hist L537-539)
- Additional page 2 and several issuers - FIXED V518, Form8938Parties. (hist L540-545)
- Any-time one-day total - FIXED V519, pf_form_8938.any_time_one_day_total. (hist L546-551)

**Injured spouse (8379)**

- "Injured Spouse" written on Form 1040 - FIXED 2026-11-19, notice FORM_8379_WRITE_INJURED_SPOUSE. (hist L555-557)
- Line 13b other income types listed - FIXED 2026-11-19, Form8379Notes. (hist L558-561)

**Noncash charity (8283)**

- Private foundation and related use - FIXED V520, Form8283Deduction. (hist L565-575)
- Section B Part II - FIXED V521, Form8283PartII. (hist L576-580)
- Conservation contributions on the list - FIXED 2026-11-19. (hist L581-584)
- Part III items $500 or less - FIXED 2026-11-19. (hist L585-587)
- Art appraisal and vehicle 1098-C match - FIXED 2026-11-19 (struck); certified historic structure not asked (minor). (hist L588-593)

**Kiddie income (8615)**

- 30% rule and qualified disability trust - FIXED V522, Form8615Line1.withEarnedIncomeRules. (hist L598-602)

**Additional deductions (Sch 1-A)**

- Tips SSN, specified service, TTOC, multi-business - V490, V523, V496; TTOC closed (no box). (hist L611-620)
- Overtime FLSA and W-2 box 14 - Out of date note; V495. (hist L621-623)
- Car loan obligor at death, lemon law - V456, V524; lemon law handled by help. (hist L624-628)

**Child's int. & dividends (8814)**

- A No to the election is saved - FIXED V525, Form8814Declined. (hist L633-636)
- 1099-OID, K-1, Alaska PFD, not-required-to-file - Since 2026-11-12, Form8814Required. (hist L637-640)

**Household employees (Sch H)**

- State disability payments; Puerto Rico - FIXED V526 and 2026-11-20; rest closed per 644. (hist L649-655)

**Other tax items**

- Section 962 election asked three times - FIXED V527, Section962Answer. (hist L662-666)
- PFIC joint Part V and section 453A interest - FIXED 2026-11-20 Form8621Spouses; Section453ALaterYear. (hist L667-676)
- Form 8960 5c messages and line 17h - Since 2026-11-12, Form8960Owners, Misc1099Income.applyLine17h. (hist L677-678)

**Lump-sum distributions (4972)**

- 403(b)/457 distributions listed - FIXED V528, Form4972NotQualified. (hist L682-685)
- Earlier rollover, 5% owner rules - FIXED 2026-11-20 in V528. (hist L686-687)

**US territory income (4563)**

- Ordinary W-2 for territory work - FORM_4563_EXCLUDED_WAGES_ALSO_ON_W2 since 2026-11-12. (hist L693-694)
- US government pay and 10-year rule - FIXED 2026-11-20, TerritoryExclusion.flagUsGovernmentWages. (hist L695-699)
- Line 6 more than four absences - FIXED 2026-11-20, TerritoryExclusion.flagExtraAbsences. (hist L700-702)
- Duplicate exclusion boxes on Additional deductions - Out of date; AdditionalDeductionsInputs.withFiguredExclusions. (hist L703-705)

**Foreign income (2555)**

- MFS spouse-leg messages and housing rule - Fixed 2026-11-11/12, SpouseLegFlags. (hist L709-711)
- Line 18 trips and housing locality - FIXED V529, Form2555Trips, Form2555Locality. (hist L712-720)
- Foreign SE net profit fill - ForeignSeNetProfit since 2026-11-12. (hist L721-724)

**Archer MSA / LTC (8853)**

- Spouse deductible and joint family limit - HsaMsaRules.forArcherRules, jointArcherFamilyLimit. (hist L731-734)
- Medicare Advantage MSA partial exception - FIXED V530, MaMsaException. (hist L735-738)
- Line 2 from 5498-SA; Medicare age check - Form5498SaChecks, MedicareAgeCheck. (hist L741-744)

**HSA (8889)**

- Line 6 on separate returns - MfsFormScoper.OTHER_SPOUSE_HSA_KEY. (hist L748-750)
- Line 3 rule 4 coverage change - FIXED V531. (hist L751-755)
- Line 18 last-month rule testing period - HsaLastMonthRule since 2026-11-13. (hist L760-762)
- Contributions vs 5498-SA; Medicare age - Form5498SaChecks, MedicareAgeCheck. (hist L763-767)

**Income adjustments (Sch 1 II)**

- Unread MFS lived-apart column - FIXED V532. (hist L771-773)
- Spouse-copy links on notes - Since 2026-11-11/12. (hist L774-776)
- Less common adjustments answer saved - FIXED V533. (hist L777-779)
- Old SE line 15-17 columns - FIXED V534. (hist L780-782)
- Line 24z rows - FIXED V535. (hist L783-785)

**Business casualties (4684 B)**

- Home used personally section 280A(c)(5) - FIXED V536, HomeUsedPersonally. (hist L789-794)
- Passive activity property - FIXED V537 (recurring case blocks by design). (hist L795-799)
- Mixed-use property split - FIXED V538, MixedUseSplit. (hist L800-804)
- Destroyed asset stops depreciation - CasualtyDisposedAssets, AssetCostCarry. (hist L805-814)
- Section 1033 postponement - FIXED V539, Section1033Postponement. (hist L815-821)

**Like-kind exchanges (8824)**

- Section 1245 parts given up - FIXED V540, Section1245PartsGain. (hist L825-828)
- Section 1252/1254/1255 property - FIXED V541. (hist L829-833)
- Intangible real property line 25c - FIXED V542. (hist L834-836)
- QI, default, reverse exchanges - FIXED V543, ExchangeMethod. (hist L837-841)
- Part IV section 1043 permitted property - FIXED V544. (hist L842-847)
- Incidental personal property - DONE 2026-11-20, question withdrawn; ExchangeMethod.incidental. (hist L848-854)
- Recourse vs nonrecourse debt - FIXED 2026-11-19 via help text. (hist L855-858)
- QOF deferral of exchange gain - FIXED 2026-11-19, Form8824Qof. (hist L866-870)
- Add property received to Depreciable assets - FIXED 2026-11-19, button on screen. (hist L871-878)
- Installment-note path recapture - Checked/fixed 2026-11-12 (Form 6252 line 9). (hist L879-881)
- Held for sale / personal home choices - FIXED 2026-11-19. (hist L882-885)

**Business property sales (4797)**

- At-risk widening and sale loss limit - AtRiskSaleLoss since 2026-11-12/14. (hist L889-896)
- MFS lookback replay - Fixed 2026-11-12. (hist L897-898)
- Disposed asset not reported; depreciation fill - DisposedAssetCheck, DepreciationAllowedFill. (hist L899-903)
- Section 1254 property - FIXED V545. (hist L904-910)
- Section 1239 related-party sales - FIXED V546. (hist L911-916)
- Timber section 631 - FIXED V547. (hist L917-922)
- Unharvested crops - FIXED 2026-11-19, UnharvestedCrop. (hist L923-927)
- K-1 section 1231 amounts, passive and at-risk - FIXED 2026-11-19/20, K1Passive1231, K1AtRisk.passiveCap, Form8582Notes.k1Gross. (hist L928-952)
- Condemnation section 1033 path - FIXED V548, Form4797Condemnation; two edge rules in help only. (hist L953-960)
- Line 1a 1099-S reconciliation - FIXED 2026-11-20, Form4797Fields.line1a; 1099-B proceeds for business property not in line 1a (minor gap). (hist L961-965)
- Section 1245 real property types - FIXED V549, Section1245RealProperty; rarer line 25 adjustments not asked. (hist L966-972)

**Depreciable assets (4562)**

- Depreciation engine follows return year - ReferenceData.computeYear(), section179Max. (hist L976-979)
- Other fixed-2025 tests follow return year - ComputeYearChecksTest since 2026-11-12. (hist L980-981)
- Earlier depreciation/amortization from last year - V473, DepreciationPriorYear. (hist L985-991)
- Amortization not on an activity reported - FORM_4562_AMORTIZATION_NOT_ON_AN_ACTIVITY since 2026-11-11. (hist L992)

**Self-employment tax options**

- Typed 0 honored by carry bridges - Fixed 2026-11-13. (hist L1003-1004)

**Farm rental (4835)**

- Farm rental depreciable asset type - FIXED 2026-11-20, FarmRentalAssets; amortization/AMT depreciation for farm rental left. (hist L1015-1022)
- Conservation carryover and 1099-G check - Since 2026-11-12. (hist L1023-1024)

**Farm income (Sch F)**

- QJV spouse material participation - FIXED V553, Wave2FieldsW4.markFarmQjv. (hist L1030-1035)
- Statement matching by SSN - Since 2026-11-11. (hist L1036-1037)
- Conservation excess carry - ConservationCarryBridge since 2026-11-13. (hist L1038-1044)

**Rental & royalty income**

- At-risk and passive carryover per property - V470, AtRiskCarryforwardByActivity, PassiveCarryforwardByActivity. (hist L1061-1069)

**Capital gain/loss**

- Unused 1099-DIV box 2a column - FIXED V551. (hist L1073-1075)
- Form 2439 in STATEMENT_PERSON_TIN - Since 2026-11-12. (hist L1076-1077)
- Reduced home sale exclusion per spouse - FIXED V554, JointHomeSaleMaximum. (hist L1078-1086)

**Screens with own Save button**

- form-dependents and dead components - DONE 2026-11-20 (dependents list, dead files removed). (hist L1091-1099)
- Filing status UI spec passes - Fixed 2026-11-12. (hist L1100-1102)

**Interest income spouse copy**

- Spouse copy missing four fields - DONE 2026-11-20 (struck heading). (hist L1104-1113)

**Sort sidebar sections**

- Alphabetical sidebar sort - DONE 2026-11-14, ShellComponent.sortByLabel. (hist L1115-1138)

**Date of birth / death logic**

- Revise DOB/DOD rules in UI and backend - Items 1-5 done 2026-11-12 (PersonDates, IdNumbers, IdentificationMapper); Deceased box FIXED V550. (hist L1160-1195)

**IRS dev shared root causes**

- Seven shared root causes behind many deviation ids - every id listed is marked FIXED in the tables below (person filter ReturnStatementOwners 2026-10-25, D-ui-1 parser, required forms produced) (hist L1225-1250)

**IRS dev highest severity**

- 36 high-severity deviation ids and duplicate/overlap list - all 36 FIXED 2026-10-25 (history.md); person-filter ids re-verified by mutation per their table rows (hist L1252-1283)

**IRS dev 1a**

- 9 deviation rows for 1a - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1287-1299)

**IRS dev 1c**

- 5 deviation rows for 1c - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1301-1309)

**1c**

- UI says employer EIN optional; compute blocks without it (MISSING_EMPLOYER_EIN_FORM_4137_) — form-tip-income-taxpayer.component.ts:1230 - closed marker: CLOSED 2026-11-20 (hist L1311-1314)

**IRS dev 1b**

- 7 deviation rows for 1b - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1315-1325)

**IRS dev 1e**

- 11 deviation rows for 1e - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1327-1341)

**IRS dev 1d**

- 7 deviation rows for 1d - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1343-1353)

**1d**

- se-tax-options.medicaidWaiverIncludeInSe adds whole 1d to Sch SE line 2 (TRCS:29210-29212) — not - closed marker: FIXED 2026-11-20 (hist L1355-1359)

**IRS dev 1f**

- 10 deviation rows for 1f - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1360-1373)

**IRS dev 1g**

- 9 deviation rows for 1g - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1375-1387)

**1g**

- 8919 screening + IRS-letter confirmation have no backend column (not persisted); code - closed marker: FIXED 2026-11-20 (hist L1389-1394)

**IRS dev 1h**

- 15 deviation rows for 1h - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1395-1413)

**IRS dev 1i**

- 3 deviation rows for 1i - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1415-1421)

**IRS dev 1z**

- 5 deviation rows for 1z - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1423-1431)

**IRS dev 2a**

- 4 deviation rows for 2a - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1433-1440)

**2a**

- Form 8814 line 1b added to parent's 2a — no 2025 source - closed marker: FIXED 2026-11-20 (hist L1442-1449)

**IRS dev 2b**

- 8 deviation rows for 2b - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1450-1461)

**2b**

- Sch 1 line 18 early-withdrawal penalty sums box 2 of every 1099-INT/OID - closed marker: FIXED 2026-11-20 (hist L1463-1469)

**IRS dev 3a/3b/3c (3a: no own deviation**

- 8 deviation rows for 3a/3b/3c (3a: no own deviation - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1470-1481)

**3a/3b/3c (3a: no own deviations)**

- child's 1099-DIV box 4 withholding may be credited on parent's 25b on - closed marker: CLOSED 2026-11-20 (hist L1483-1486)
- stale comment TRCS:19924 says legacy mode ignores recipient TIN; code filters - closed marker: FIXED 2026-11-20 (hist L1487-1489)

**IRS dev 4a/4b/4c**

- 18 deviation rows for 4a/4b/4c - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1490-1511)

**IRS dev 5a/5b/5c**

- 21 deviation rows for 5a/5b/5c - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1513-1537)

**5a/5b/5c**

- code D annuity income never reaches 8960 line 3 except typed override - closed marker: CLOSED 2026-11-20 (hist L1539-1542)

**IRS dev 6a/6b/6c/6d**

- 14 deviation rows for 6a/6b/6c/6d - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1543-1560)

**IRS dev 7a/7b (7b: none of its own)**

- 10 deviation rows for 7a/7b (7b: none of its own) - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1562-1575)

**7a/7b (7b: none of its own)**

- compute reads imported1099DivBox2aCapitalGainDistributionsTotal, mapper stores imported1099divBox2a…; importedPriorYearCapitalLossCarryoverTotal never written - closed marker: FIXED 2026-11-20 (hist L1577-1580)

**IRS dev 8 (Schedule 1 Part I)**

- 14 deviation rows for 8 (Schedule 1 Part I) - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1581-1598)

**IRS dev 9 / 11a**

- 10 deviation rows for 9 / 11a - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1600-1613)

**9 / 11a**

- Note: D-9-1: DUPLICATE of D-8-9 (manualOtherIncomeLine8) - closed marker: CLOSED 2026-11-20 (hist L1615-1617)
- KiddieTaxParentReader.java:285-290 uses another return's line 9 as "gross income" for qualifying-relative test - closed marker: FIXED 2026-11-20 (hist L1618-1624)

**IRS dev 10 (Schedule 1 Part II)**

- 16 deviation rows for 10 (Schedule 1 Part II) - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1625-1644)

**10 (Schedule 1 Part II)**

- INCOME_ADJUSTMENTS_MISSING_UPLOADED_ flags never fire (mapper doesn't save answers); 3 imported… keys never - closed marker: CLOSED 2026-11-20 (hist L1646-1649)

**IRS dev Schedule D / 8949**

- 14 deviation rows for Schedule D / 8949 - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1650-1667)

**IRS dev Schedule B / 8815**

- 11 deviation rows for Schedule B / 8815 - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1669-1683)

**IRS dev Schedule C / 8829 / 4562**

- 38 deviation rows for Schedule C / 8829 / 4562 - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1685-1726)

**IRS dev 4835**

- 10 deviation rows for 4835 - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1728-1741)

**4835**

- RENTAL_MFS_LIVED_APART_ALL_YEAR_UNANSWERED checks only rental properties, not farm rental - closed marker: CLOSED 2026-11-20 (hist L1743-1745)
- Sch E line 41 excludes K-1 royalties while Sch 1 line 5 - closed marker: CLOSED 2026-11-20 (hist L1746-1748)

**IRS dev 6252 (statement mapper Form625**

- 7 deviation rows for 6252 (statement mapper Form625 - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1749-1759)

**IRS dev 6781 (Form6781Mapper and Form4**

- 9 deviation rows for 6781 (Form6781Mapper and Form4 - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1761-1773)

**IRS dev 4684**

- 12 deviation rows for 4684 - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1775-1790)

**IRS dev 4797 (Form4797Mapper active bu**

- 16 deviation rows for 4797 (Form4797Mapper active bu - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1792-1811)

**IRS dev Schedule F / Schedule SE**

- 18 deviation rows for Schedule F / Schedule SE - every row marked FIXED/CLOSED 2026-10-25..28 (history.md); except D-sch-se-7 (HELD, own line) (hist L1813-1834)

**IRS dev Schedule E / 8582 / 6198**

- 30 deviation rows for Schedule E / 8582 / 6198 - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1836-1869)

**IRS dev 8606**

- 10 deviation rows for 8606 - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1871-1884)

**8606**

- e2e open-questions-b3-b33-b38.spec.ts 118 reads f8606?.line7 — wrong key, assertion can never fail - closed marker: FIXED 2026-11-20 (hist L1886-1889)
- sidebar lists Form 8606 taxpayer + spouse for every return incl. Single - closed marker: CLOSED 2026-11-20 (hist L1890-1894)

**IRS dev 4972**

- 9 deviation rows for 4972 - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1895-1907)

**IRS dev 2555**

- 14 deviation rows for 2555 - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1909-1926)

**IRS dev 2441 (credit side)**

- 9 deviation rows for 2441 (credit side) - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1928-1940)

**2441 (credit side)**

- Sc00384SqaScenarioTest / Hrb2025Sc00384Test seed personSsn/personName but compute reads qualifyingSSN — family check - closed marker: FIXED 2026-11-20 (hist L1942-1946)

**IRS dev 8839 (credit side)**

- 10 deviation rows for 8839 (credit side) - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1947-1960)

**IRS dev 8814**

- 5 deviation rows for 8814 - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1962-1970)

**IRS dev 461**

- 4 deviation rows for 461 - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1972-1979)

**IRS dev 172**

- 8 deviation rows for 172 - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1981-1992)

**IRS dev 982**

- 5 deviation rows for 982 - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L1994-2002)

**IRS dev 8889**

- 10 deviation rows for 8889 - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L2004-2017)

**IRS dev 8853**

- 8 deviation rows for 8853 - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L2019-2030)

**IRS dev 2106 / 3903 / 7206**

- 18 deviation rows for 2106 / 3903 / 7206 - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L2032-2053)

**IRS dev mappings: W-2 family**

- 9 deviation rows for mappings: W-2 family - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L2055-2067)

**mappings: W-2 family**

- D-1a-3 extended: territory W-2 boxes never read (wages, box 2 tax, excess - closed marker: CLOSED 2026-11-20 (hist L2069-2071)

**IRS dev mappings: 1099-INT / OID / DIV**

- 6 deviation rows for mappings: 1099-INT / OID / DIV - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L2072-2081)

**mappings: 1099-INT / OID / DIV**

- D-2b-3 narrower: TIN belonging to nobody in household → blocking STATEMENT_DOES_NOT_BELONG_TO_FAMILY (TRCS:13891-13910); - closed marker: CLOSED 2026-11-20 (hist L2083-2086)

**IRS dev mappings 1099-INT/OID/DIV**

- VOID, corrected-copy, box 9/13 and negative OID box 8 note - CLOSED 2026-11-22 owner decision (every statement is the latest copy; V559 drops void columns); box 9/13 fixed V557 (PrivateActivityBondPremium), negative OID box 8 fixed V558 (TipsDeflation) (hist L2087-2105)

**IRS dev mappings: 1099-B / DA / S**

- 14 deviation rows for mappings: 1099-B / DA / S - every row marked FIXED/CLOSED 2026-10-25..28 (history.md); except D-1099-s-4 (HELD, own line) (hist L2106-2123)

**IRS dev mappings: SSA-1099 / RRB-1099**

- 4 deviation rows for mappings: SSA-1099 / RRB-1099 - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L2125-2132)

**mappings: SSA-1099 / RRB-1099**

- D-6a-3 reachable: SSA box 2 not required (form-ssa-1099.component.ts:228) - closed marker: CLOSED 2026-11-20 (hist L2134-2137)
- Medicare premiums never carried from SSA-1099/RRB-1099 box 11 (user must retype); blank - closed marker: CLOSED 2026-11-22 (hist L2138-2152)

**IRS dev CROSS-CUTTING (coordinator)**

- 1 deviation rows for CROSS-CUTTING (coordinator) - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L2153-2157)

**IRS dev mappings: 1099-MISC / NEC / K**

- 28 deviation rows for mappings: 1099-MISC / NEC / K - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) except D-sch-se-7b and D-k1-1041-11b-cp (own lines) (hist L2159-2190)

**IRS dev mappings 1099-MISC/NEC/K**

- D-k1-1041-11b-cp: community-property split vs full box 11B breakdown - fixed 2026-11-13: K1Form1041Items.java:272-296 uses the community factor for the check (history.md:2837); outstanding row is stale (hist L2188)

**mappings: 1099-MISC / NEC / K**

- box 4 of 1099-MISC/NEC/K → 25b, person-filtered only on MFS/dependent-own; credited even - closed marker: CLOSED 2026-11-22 (hist L2192-2198)
- 1099-MISC box 10 attorney proceeds / box 11 fish purchases not read - closed marker: CLOSED 2026-11-22 (hist L2199-2206)

**IRS dev mappings: 1099-R / RRB-1099-R**

- 11 deviation rows for mappings: 1099-R / RRB-1099-R - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L2207-2221)

**IRS dev mappings 1099-R/RRB-1099-R**

- 1099-R box 4 and RRB-1099-R box 9 withholding person filter - ReturnStatementOwners.java:50 owns 1099-r by recipientTIN and rrb-1099-r by recipientIdNumber, so withholding follows the person filter; D-rrb-1099-r-1 FIXED 2026-10-26 (hist L2223-2224)

**IRS dev mappings: 1099-G / C / A / LTC**

- 15 deviation rows for mappings: 1099-G / C / A / LTC - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L2225-2243)

**IRS dev mappings: 1098 family (1098-T**

- 11 deviation rows for mappings: 1098 family (1098-T - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L2245-2259)

**IRS dev mappings: 1095-A / B / C (only**

- 13 deviation rows for mappings: 1095-A / B / C (only - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L2263-2279)

**IRS dev mappings: Schedule K-1s (K-1 s**

- 17 deviation rows for mappings: Schedule K-1s (K-1 s - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L2281-2301)

**IRS dev mappings: other statements (10**

- 15 deviation rows for mappings: other statements (10 - every row marked FIXED/CLOSED 2026-10-25..28 (history.md) (hist L2303-2321)

**YAML drift**

- 5329 contribution section and rental-income YAML missing - RESOLVED 2026-10-28: yamls/rental-income-taxpayer/spouse.yaml exist and 10-income-adjustments-taxpayer.yaml has the Form 5329 section (hist L2328-2329)

**Round-2 QA A**

- A1: Rental expenses are entered as the rental share; no annual totals - closed marker: DONE 2026-10-16 (owner-approved field). (hist L2340)
- A2: No lease-bonus field for oil & gas royalties - closed marker: DONE 2026-10-16 (owner-approved field). (hist L2341)
- A3: No QCD distribution date - closed marker: DONE 2026-10-16 (owner-approved field). (hist L2342)
- A4: Rental per-property material-participation control offers only "Yes" - closed marker: DONE 2026-10-16 (owner-approved). (hist L2343)
- A5: Same control lets a non-professional make a long-term rental nonpassive - closed marker: DONE 2026-10-16 (owner-approved field). (hist L2344)
- A6: No related-buyer question on a rental disposition - closed marker: DONE 2026-10-16 (owner-approved field). (hist L2345)
- A7: No input for a moving reimbursement exceeding costs - closed marker: DONE 2026-10-17 (owner-approved, no new field). (hist L2346)
- A8: Schedule 1 line 12: no category and no eligibility gates - closed marker: DONE 2026-10-17 (owner-approved fields, V294). (hist L2347)
- A9: Form 8853 line 1 not read from W-2 box 12 code - closed marker: DONE 2026-10-16. (hist L2348)
- A10: No Form 5329 Part VI (Archer MSA excess contribution 6%) - closed marker: DONE 2026-10-16 (owner-approved fields). (hist L2349)
- A11: Schedule A: no medical-reimbursement input and no line 5a breakdown - closed marker: DONE 2026-10-17 (owner-approved fields, V295). (hist L2350)
- A12: Mortgage points: one entry only - closed marker: DONE 2026-10-18 (owner-approved fields, V296). (hist L2351)
- A13: No sales-tax table, no real-estate day split, no mortgage date - closed marker: DONE 2026-10-18 (owner-approved fields, V297). (hist L2352)
- A14: Qualified disaster, line 38b and the 30%/50% bucket typed - closed marker: DONE 2026-10-18 (owner-approved fields, V298). (hist L2353)
- A15: Claim of right: deduction vs credit not compared - closed marker: DONE 2026-10-18 (owner-approved). (hist L2354)
- A16: No field to refuse an ineligible impairment-related item - closed marker: DONE 2026-10-18 (owner-approved fields, V299). (hist L2355)
- A17: Bond premium excess not limited to the bond's earlier interest - closed marker: DONE 2026-10-18 (owner-approved). (hist L2356)
- A18: Section 691(c) deduction is typed, not computed - closed marker: DONE 2026-10-18 (owner-approved). (hist L2357)
- A19: Form 8615: no age / support test - closed marker: DONE 2026-10-18 (owner-approved). (hist L2358)
- A20: Form 5695 Part I: no input for a utility subsidy that - closed marker: DONE 2026-10-18 (owner-approved). (hist L2359)
- A21: Unemployment: no input for a repayment of benefits received in an - closed marker: DONE 2026-10-16 (owner-approved field). (hist L2360)
- A22: Form 5329 exception 01 (age 55) accepted as entered - closed marker: DONE 2026-10-16 (owner-approved fields). (hist L2361)
- A23: No medical-mileage input - closed marker: DONE 2026-10-16 (owner-approved field). (hist L2362)
- A24: Interest with no Form 1099 still demands an upload - closed marker: DONE 2026-10-18 (owner-approved). (hist L2363)
- A25: MFS lived-with-spouse fact asked on several forms - closed marker: DONE 2026-10-18 (owner-approved). (hist L2364)
- A26: No spouse date of death: filing status after a death is - closed marker: DONE 2026-10-18 (owner-approved). (hist L2365)
- A27: No community-property allocation on MFS returns - closed marker: DONE 2026-10-19 (owner-approved). (hist L2366)
- A28: MFS lived-apart-all-year fact for the IRA ranges - closed marker: DONE 2026-10-18 (owner-approved). (hist L2367)
- A29: The pension form has no per-annuity (stream) inputs - closed marker: (hist L2368)
- A30: A line-1h disability pension is not carried into EIC earned income - closed marker: DONE 2026-10-16 (owner-approved; no new field). (hist L2369)
- A31: Form 8853 line 24 is a typed field only - closed marker: DONE 2026-10-17 (owner-approved; no new field). (hist L2370)
- A32: Schedule C meals have only the 50% rate - closed marker: DONE 2026-10-18 (owner-approved). (hist L2371)
- A33: SE long-term-care premiums: one age limit for everyone covered - closed marker: DONE 2026-10-19 (owner-approved). (hist L2372)
- A34: No car-loan interest in the Schedule C vehicle section - closed marker: DONE 2026-10-18 (owner-approved). (hist L2373)
- A35: Form 2210 penalty assumes every payment was made on its due - closed marker: DONE 2026-10-18 (owner-approved). (hist L2374)
- A36: QBI W-2 wages only from line 26 - closed marker: DONE 2026-10-18 (owner-approved). (hist L2375)
- A37: EIC after a disallowance: no reason / ban period - closed marker: DONE 2026-10-18 (owner-approved). (hist L2376)
- A38: Alimony: no input for a post-2018 modification adopting the TCJA - closed marker: DONE 2026-10-18 (owner-approved). (hist L2377)
- A39: IRA excess contributions: no "withdrawn by the due date" input - closed marker: DONE 2026-10-17 (owner-approved fields, V284). (hist L2378)
- A40: Section 962 deemed-paid credit has no section 78 gross-up / 80% - closed marker: DONE 2026-10-18 (owner-approved). (hist L2379)
- A41: General Rule annuity: expected return typed, no earlier-years recovery - closed marker: DONE 2026-10-17 (owner-approved fields, V285). (hist L2380)
- A42: Form 5329 line 2 exception limits need facts the form does - closed marker: DONE 2026-10-17 (owner-approved fields, V286). (hist L2381)
- A43: Form 1098 box 4 recovery capped at interest deducted - DONE 2026-10-18 V305 prior_year_mortgage_interest_deducted; residual split listed as its own TODO line (hist L2382)
- A44: One item per casualty event - closed marker: DONE 2026-10-18 (owner-approved). (hist L2383)
- A45: Medicaid waiver: one home-sharing answer for all care recipients - closed marker: DONE 2026-10-18 (owner-approved). (hist L2384)
- A46: NUA: no election, no sale split - closed marker: DONE 2026-10-17 (owner-approved fields, V287). (hist L2385)
- A47: Dividends with no Form 1099-DIV still demand an upload - closed marker: DONE 2026-10-18 (owner-approved). (hist L2386)
- A48: Seller-financed mortgage - no line 8b split, no seller identity, seller - closed marker: DONE 2026-10-18 (owner-approved). (hist L2387)
- A49: Rental §465 prior-year carryover is one form-level amount - closed marker: DONE 2026-10-16 (owner-approved field). (hist L2388)
- A50: Clergy housing allowance - no limit, excess never taxed - closed marker: DONE 2026-10-18 (owner-approved). (hist L2389)
- A51: CRP exclusion applied to anyone with a 2025 SSA-1099 - closed marker: DONE 2026-10-18 (owner-approved). (hist L2390)
- A52: Schedule H lines typed as totals - the $2,800 test and - closed marker: DONE 2026-10-19 (owner-approved). (hist L2391)
- A53: home office mortgage/taxes vs Schedule A double count - DONE 2026-10-18 V309; its 'STILL OPEN' line 17 split was later fixed by D-8829-4 (Form8829Line11Worksheet, TRCS:27084) (hist L2392)
- A54: HSA: no "excess withdrawn by the due date" input - closed marker: DONE 2026-10-17 (owner-approved fields, V288). (hist L2393)
- A55: Bonus depreciation keyed to the placed-in-service date - closed marker: DONE 2026-10-18 (owner-approved). (hist L2394)
- A56: Form 8283 rows have no property category - closed marker: DONE 2026-10-18 (owner-approved). (hist L2395)
- A57: Form 8938 has no year-end value - closed marker: DONE 2026-10-18 (owner-approved). (hist L2396)
- A58: Form 1099-Q taxable earnings derived and sent to Form 5329 - DONE 2026-10-17 V289 computeQtpTaxableEarnings adds to Form 5329 Part II line 5; the 'STILL OPEN ESA/QTP line 5' cross-reference is superseded (hist L2397)
- A59: Section 121 reduced exclusion typed as a cap - closed marker: DONE 2026-10-19 (owner-approved). (hist L2398)
- A60: Forms 1099-A / 1099-CAP / 1099-LS / 1099-SB derive nothing - closed marker: DONE 2026-10-19 (owner-approved). (hist L2399)
- A61: RMD not computed - closed marker: DONE 2026-10-17 (owner-approved fields, V290). (hist L2400)
- A62: Form 1099-PATR distributions not carried to Schedule F - closed marker: DONE 2026-10-19 (owner-approved). (hist L2401)
- A63: SS net repayment over $3,000: whole box 5 deducted, no method - closed marker: DONE 2026-10-17 (owner-approved fields, V291). (hist L2402)
- A64: Decedent's age 65 measured at December 31 instead of at death - closed marker: DONE 2026-10-18 (owner-approved). (hist L2403)
- A65: Schedule C line 36 is one typed net figure - closed marker: DONE 2026-10-18 (owner-approved). (hist L2404)
- A66: Section 1202 percentage typed separately from the code-Q row - closed marker: DONE 2026-10-18 (owner-approved). (hist L2405)
- A67: Section 1259 constructive sale: exception and term not applied - closed marker: DONE 2026-10-18 (owner-approved). (hist L2406)
- A68: ISO shares sold: AMT basis / line 2k typed by hand - closed marker: DONE 2026-10-19 (owner-approved). (hist L2407)
- A69: Roth conversion history: no year / taxable part - closed marker: DONE 2026-10-17 (owner-approved list, V292). (hist L2408)
- A70: Form 5329 exception 02 on an employer plan before separation - closed marker: DONE 2026-10-17 (owner-approved, no new field). (hist L2409)
- A71: IRA rollovers: no dates, one-per-year limit not applied - closed marker: DONE 2026-10-17 (owner-approved fields, V293). (hist L2410)
- A72: Foreign earned income: no way to keep it taxable without the - closed marker: DONE 2026-10-18 (owner-approved). (hist L2411)
- A73: Form 4797 Part IV recapture typed by hand - closed marker: DONE 2026-10-19 (owner-approved). (hist L2412)
- A74: Form 982 line 10a (basis of property) not computed - closed marker: DONE 2026-10-18 (owner-approved). (hist L2413)
- A75: QPRI ordering rule applied by hand - closed marker: DONE 2026-10-18 (owner-approved). (hist L2414)
- A76: Below-market gift loan interest (section 7872) typed by hand - closed marker: DONE 2026-10-18 (owner-approved). (hist L2415)
- A77: No bargain-sale-to-charity flow - closed marker: DONE 2026-10-18 (owner-approved). (hist L2416)
- A78: No worksheet for medical home improvements - closed marker: DONE 2026-10-18 (owner-approved). (hist L2417)
- A79: Mortgage debt of two vintages cannot be entered - closed marker: DONE 2026-10-18 (owner-approved). (hist L2418)
- A80: Form 8960 line 5c is taken without checking material participation - closed marker: DONE 2026-10-18 (owner-approved). (hist L2419)
- A81: Schedule 1-A line 4a: no Forms 4070 total in place of - closed marker: DONE 2026-10-18 (owner-approved). (hist L2420)
- A82: Schedule 1-A overtime: no way to separate the qualified half from - closed marker: DONE 2026-10-18 (owner-approved). (hist L2421)
- A83: RRB-1099-R box 3 not read; annuity starting date not used - closed marker: DONE 2026-10-17 (owner-approved behaviour, no new fields). (hist L2422)
- A84: Head of household not barred for a multiple-support-agreement dependent - closed marker: DONE 2026-10-18 (owner-approved). (hist L2423)
- A85: Qualifying-child tiebreaker taken as entered - closed marker: DONE 2026-10-18 (owner-approved). (hist L2424)
- A86: Form 8621 Part V figured by hand - closed marker: DONE 2026-10-19 (owner-approved). (hist L2425)
- A87: No per-month employer-plan eligibility for SE health insurance - closed marker: DONE 2026-10-18 (owner-approved). (hist L2426)

**Round-2 QA B**

- B1: Mortgage-limit proration uses an exact ratio; Pub. 936 Table 1 (optional) - closed marker: DONE 2026-10-18 (owner-approved, no new fields). (hist L2432)
- B2: §280A depreciation carryover figures are not pinned by any test (fill-if-shown - closed marker: DONE 2026-10-18 (owner-approved, test only). (hist L2433)
- B3: Archer MSA waiver of a missed RMD (Form 5329 Part IX - closed marker: DONE 2026-10-18 (owner-approved field, V348). (hist L2434)
- B4: Saver's credit "born after January 1, 2008" is a yes/no answer, - closed marker: DONE 2026-10-18 (owner-approved, no new field). (hist L2435)
- B5: §469(i)(5) allowance with no all-year answer now defaults to $0 (conservative, - closed marker: DONE 2026-10-18 (owner-approved). (hist L2436)
- B6: DONE 2026-10-21 (owner-approved). Form 2210 box D: optional withholding-timing section on - closed marker: DONE 2026-10-21 (owner-approved). (hist L2437)
- B7: Round-1 Sc00200SqaScenarioTest still pins the round-1 routing (code-3 pension on 5b, - closed marker: DONE 2026-10-18 (owner-approved, test only). (hist L2438)
- B9: DONE 2026-10-21 (owner-approved). Form 8912 carryforward to next year (V373; CREB - closed marker: DONE 2026-10-21 (owner-approved). (hist L2440)
- B10: section 179 carryover persisted and imported as next year's line 10 - DONE 2026-10-18 V345/V346 (importedPriorYearSection179Carryover); residual listed as its own TODO line (hist L2441)
- B12: EIC under the nonfarm optional method (fix 609d0c8d): the optional amount - closed marker: CLOSED 2026-10-18 - already done by fa03a3b4. (hist L2443)
- B14: Form 6252: the engine routes the filer's line 24 to Schedule - closed marker: DONE 2026-10-18 as a warning (owner-approved). (hist L2445)
- B15: §1341 credit (Schedule 3 line 13b) is a typed figure — - closed marker: DONE 2026-10-18 - already built by A15. (hist L2446)
- B16: §221(c) "allowable" vs the Form 1040 instructions' "aren't claimed": the engine - closed marker: DONE 2026-10-18 (owner-approved fields, V347). (hist L2447)
- B17: EIC earned income is assembled from W-2 box 1 + typed - closed marker: DONE 2026-10-18 (owner-approved). (hist L2448)
- B18: Medicaid waiver: one election field (includeQualifiedPaymentsInEarnedIncomeForEIC_ACTC) covers both credits. EIC Worksheet - closed marker: DONE 2026-10-18 as a calculated choice (owner-approved, no new field). (hist L2449)
- B20: Form 1098 box 4 with the prior-year itemizing question unanswered: the - closed marker: DONE 2026-10-18 (owner-approved). (hist L2451)
- B21: Should the statement‑upload gates exempt amounts that by nature have no - closed marker: CLOSED 2026-10-18. (hist L2452)
- B22: Rental §465 carryover when the property's amount at risk is blank - closed marker: DONE 2026-10-16 with A49: (hist L2453)
- B23: DONE 2026-10-18 (owner-approved). Property placed in service after 2015 (bonus-eligible, bonus - closed marker: DONE 2026-10-18 (owner-approved). (hist L2454)
- B24: DONE 2026-10-21 (owner-approved). Not another pass: with AUTO, the 8829 / - closed marker: DONE 2026-10-21 (owner-approved). (hist L2455)
- B25: DONE 2026-10-21 (owner-approved). FORM8814_LINE12_FOR_EIC saved/restored in prepare() with the B69/B80/B106 thread-locals; - closed marker: DONE 2026-10-21 (owner-approved). (hist L2456)
- B26: Forms 8824 and 6781 are transcription statements: Part III lines 17–25 - closed marker: DONE 2026-10-18 as a warning (owner-approved). (hist L2457)
- B27: DONE 2026-10-21 (owner-approved). Column (b) figured when blank on 13a (W-2 - closed marker: DONE 2026-10-21 (owner-approved). (hist L2458)
- B28: DONE 2026-10-22 (owner-approved). Line 4 looked up when blank from the - closed marker: DONE 2026-10-22 (owner-approved). (hist L2459)
- B29: HSA fix 0e471afe also subtracts Form 5329 line 44 (taxable distributions) - closed marker: DONE 2026-10-18 (test only). (hist L2460)
- B30: DONE 2026-10-22 (owner-approved). Line 5 Worksheets #1/#2/#3 in Form8615Line5Worksheets (old proportional - closed marker: DONE 2026-10-22 (owner-approved). (hist L2461)
- B31: Form 8828 line 15 (modified AGI) is typed (line15ModifiedAgi), not derived - closed marker: DONE 2026-10-18 (owner-approved, no new fields). (hist L2462)
- B32: DONE 2026-10-18 (owner-approved). Advisories QOF_DEFERRAL_MORE_THAN_GAIN and QOF_INVESTMENT_OUTSIDE_180_DAYS from the Form 8949 - closed marker: DONE 2026-10-18 (owner-approved). (hist L2463)
- B33: Form 8880 line 4 auto‑imports 1099‑R distributions but not 1099‑QA (ABLE) - closed marker: DONE 2026-10-18 (owner-approved). (hist L2464)
- B34: SS net repayment over $3,000 with itemized deductions: the engine takes - closed marker: CLOSED 2026-10-18 - already done by A63 (V291). (hist L2465)
- B35: DONE 2026-10-18 (owner-approved). macrsPercentages builds any Pub. 946 table (DB on - closed marker: DONE 2026-10-18 (owner-approved). (hist L2466)
- B36: DONE 2026-10-18 (owner-approved). Advisory RENTAL_UNDER_15_DAYS_INTEREST_AND_TAXES_NOT_DEDUCTED names the dropped mortgage interest and - closed marker: DONE 2026-10-18 (owner-approved). (hist L2467)
- B37: DONE 2026-10-22 (owner-approved). Linked by description + dates (both forms' own - closed marker: DONE 2026-10-22 (owner-approved). (hist L2468)
- B38: A code‑G IRA Form 1099‑R (direct rollover to an employer plan) - closed marker: DONE 2026-10-18 (owner-approved). (hist L2469)
- B39: DONE 2026-10-18 (owner-approved). Form1116QdAdjustment: foreign qualified dividends (1099-DIV box 1b where - closed marker: DONE 2026-10-18 (owner-approved). (hist L2470)
- B40: DONE 2026-10-18 (owner-approved). The full Notice 2025-16 Section 3 table (136 - closed marker: DONE 2026-10-18 (owner-approved). (hist L2471)
- B41: DONE 2026-10-18 (owner-approved). The high-tax kickout nets the apportioned deduction (line - closed marker: DONE 2026-10-18 (owner-approved). (hist L2472)
- B42: State refund worksheet: a blank priorYearStandardDeductionAvailable is read as 0, so - closed marker: DONE 2026-10-18 (owner-approved, no new field). (hist L2473)
- B43: The sc_00356 fix (880103b4) excludes church‑employee income's share of the ½‑SE - closed marker: DONE 2026-10-18 (owner-approved). (hist L2474)
- B44: The AOTC refundable bar (Form 8863 line 7) is decided from - closed marker: DONE 2026-10-18 (owner-approved, no new field). (hist L2475)
- B45: Form 4952 line 4e defaults to line 4d when netCapitalGainFromDispositionOfInvestmentPropertyLimit is - closed marker: DONE 2026-10-18 (owner-approved). (hist L2476)
- B46: DONE 2026-10-18 (owner-approved). K-1 dividends (1065 6a/6b, 1120-S 5a/5b, 1041 2a/2b) - closed marker: DONE 2026-10-18 (owner-approved). (hist L2477)
- B47: Pub. 936 Table 1 line 14 is rounded to three places; - closed marker: DONE 2026-10-18 with B1. (hist L2478)
- B48: Form 8960 line 9b is the filer's figure with no gate - closed marker: DONE 2026-10-18 (owner-approved). (hist L2479)
- B49: RRB‑1099‑R: the Simplified Method runs on the person's whole pension gross - closed marker: DONE 2026-10-18 (owner-approved). (hist L2480)
- B50: Part IV vehicle that fails a condition (used, no U.S. final - closed marker: DONE 2026-10-18 (owner-approved). (hist L2481)
- B51: DONE 2026-10-18 (with B40). Qatar - Doha 45,888 and Oman - - closed marker: DONE 2026-10-18 (with B40). (hist L2482)
- B52: Form 8621 1291TAX applies 37% to the user's total prior‑year allocation - closed marker: DONE 2026-10-21 under B74: (hist L2483)
- B53: DONE 2026-10-22 (owner-approved). Both Negative Form 8978 Adjustment Worksheets: 6l at - closed marker: DONE 2026-10-22 (owner-approved). (hist L2484)
- B54: SEHI ↔ PTC coordination is gated on marketplacePlan, whose UI label - closed marker: DONE 2026-10-18 (owner-approved). (hist L2485)
- B55: DONE 2026-10-19 (owner-approved: values, not structure). Lines 1 and 2a-2d are - closed marker: DONE 2026-10-19 (owner-approved: values, not structure). (hist L2486)
- B56: DONE 2026-10-19 (owner-approved). Settled: the engine's limit is right - the - closed marker: DONE 2026-10-19 (owner-approved). (hist L2487)
- B57: DONE 2026-10-19 (owner-approved, with B58). A standard-deduction filer's rental share of - closed marker: DONE 2026-10-19 (owner-approved, with B58). (hist L2488)
- B58: DONE 2026-10-19 (owner-approved fields, V350). Per-home inputs for the 2024 Worksheet - closed marker: DONE 2026-10-19 (owner-approved fields, V350). (hist L2489)
- B59: lease bonus cost depletion and recapture - DONE 2026-10-16 V275 (RoyaltyCostDepletionTest); residual gap listed as its own TODO line (hist L2490)
- B60: DONE 2026-10-19 (owner-approved fields, V351). Prior-year itemizing answers ignored / unreachable: - closed marker: DONE 2026-10-19 (owner-approved fields, V351). (hist L2491)
- B61: DONE 2026-10-19 (owner-approved). Form 8829 casualty losses moved from the operating - closed marker: DONE 2026-10-19 (owner-approved). (hist L2492)
- B62: DONE 2026-10-19 (owner-approved). New input form "Household employees (Schedule H)" (Incomes, - closed marker: DONE 2026-10-19 (owner-approved). (hist L2493)
- B63: DONE 2026-10-19 (owner-approved). Line 25 = 0 on the line C - closed marker: DONE 2026-10-19 (owner-approved). (hist L2494)
- B64: DONE 2026-10-19 (owner-approved). Schedule SE line 1b now also subtracts Schedule - closed marker: DONE 2026-10-19 (owner-approved). (hist L2495)
- B65: DONE 2026-10-19 (owner-approved). The Schedule SE line 1b benefits check (personReceivesSocialSecurityBenefits - closed marker: DONE 2026-10-19 (owner-approved). (hist L2496)
- B66: CLOSED 2026-10-19 (owner-approved, not modelled). Pub. 517's fourth cap on the - closed marker: CLOSED 2026-10-19 (owner-approved, not modelled). (hist L2497)
- B67: DONE 2026-10-19 (owner-approved). Schedule C line 24b (meals x 50% / - closed marker: DONE 2026-10-19 (owner-approved). (hist L2498)
- B68: DONE 2026-10-19 (owner-approved field, V352 pf_business_vehicle.vin). Schedule 1-A Part IV: a - closed marker: DONE 2026-10-19 (owner-approved field, V352 pf_business_vehicle.vin). (hist L2499)
- B69: DONE 2026-10-19 (owner-approved). 2025 i7206: premiums not deductible on Schedule 1 - closed marker: DONE 2026-10-19 (owner-approved). (hist L2500)
- B70: DONE 2026-10-19 (owner-approved field, V353 pf_farm_activity.farm_w2_wages). A farm's QBI W-2 wages - closed marker: DONE 2026-10-19 (owner-approved field, V353 pf_farm_activity.farm_w2_wages). (hist L2501)
- B71: DONE 2026-10-19 (owner-approved). computeIsoAmtAdjustmentLine2i skips a Form 3921 whose box 2 - closed marker: DONE 2026-10-19 (owner-approved). (hist L2502)
- B72: DONE 2026-10-19 (owner-approved). mergeLine16TaxForms (joint return, both Other tax items forms) - closed marker: DONE 2026-10-19 (owner-approved). (hist L2503)
- B73: DONE 2026-10-19 (owner-approved). mergeLine16TaxForms (joint return): Form 8960 lines 5b, 6, - closed marker: DONE 2026-10-19 (owner-approved). (hist L2504)
- B74: DONE 2026-10-19 (owner-approved). ReferenceData.section1291TopRate(year) (IRC 1291(c)(2): 37% 2018+, 39.6% 2013-17, 35% - closed marker: DONE 2026-10-19 (owner-approved). (hist L2505)
- B75: DONE 2026-10-19 (owner-approved). ReferenceData.bonusRateForPlacedInService(date) (IRC 168(k): 50% before 9/28/2017, 100% to - closed marker: DONE 2026-10-19 (owner-approved). (hist L2506)
- B76: DONE 2026-10-19 (owner-approved). Form 4562 line 14 = the bonus assetDepreciationSection179AndBonus - closed marker: DONE 2026-10-19 (owner-approved). (hist L2507)
- B77: DONE 2026-10-19 (owner-approved). No new field - A73 priorYearBusinessUsePercent already existed. - closed marker: DONE 2026-10-19 (owner-approved). (hist L2508)
- B78: DONE 2026-10-19 (owner-approved, field added). adsRecoveryPeriod(asset, flags): typed adsRecoveryPeriodYears (V354) -> - closed marker: DONE 2026-10-19 (owner-approved, field added). (hist L2509)
- B79: DONE 2026-10-19 (owner-approved). form-depreciation-asset: the four single radios are native checkboxes - closed marker: DONE 2026-10-19 (owner-approved). (hist L2510)
- B80: DONE 2026-10-19 (owner-approved). withDerivedForm4797PartIv covers schedule_c / schedule_f / rental (rental - closed marker: DONE 2026-10-19 (owner-approved). (hist L2511)
- B81: DONE 2026-10-19 (owner-approved). mergeForm982Inputs(tp, sp, flags) feeds applySection108AttributeReduction and the line - closed marker: DONE 2026-10-19 (owner-approved). (hist L2512)
- B82: DONE 2026-10-19 (owner-approved). foreignEarnedIncomeBareKeys (un-prefix when spouseHadForeignEarnedIncome is present) at the - closed marker: DONE 2026-10-19 (owner-approved). (hist L2513)
- B83: DONE 2026-10-19 (owner-approved). Wording only: the home-sharing violation message is built - closed marker: DONE 2026-10-19 (owner-approved). (hist L2514)
- B84: DONE 2026-10-19 (owner-approved). Gates: uploadedAtLeastOne = statements on file OR either - closed marker: DONE 2026-10-19 (owner-approved). (hist L2515)
- B85: DONE 2026-10-19 (owner-approved). No IRS code exists for line 1h (2025 - closed marker: DONE 2026-10-19 (owner-approved). (hist L2516)
- B86: DONE 2026-10-19 (owner-approved). Q1: manual 1099 tips moved from line 4c - closed marker: DONE 2026-10-19 (owner-approved). (hist L2517)
- B87: DONE 2026-10-19 (owner-approved fields). manualTaxableInterestPayers / manualOrdinaryDividendPayers (V357, entities, mappers, 4 - closed marker: DONE 2026-10-19 (owner-approved fields). (hist L2518)
- B88: DONE 2026-10-19 (owner-approved). 1099-S description fallback reads propertyAddressOrLegalDescription (then the old - closed marker: DONE 2026-10-19 (owner-approved). (hist L2519)
- B89: DONE 2026-10-19 (owner-approved). buildPrincipalResidenceTransaction(disp, dateSold, ...) - the resolved sale date - closed marker: DONE 2026-10-19 (owner-approved). (hist L2520)
- B90: DONE 2026-10-19 (owner-approved). UI only: dispositionSection121Cap / dispositionExclusionApplied mirror buildPrincipalResidenceTransaction (override - closed marker: DONE 2026-10-19 (owner-approved). (hist L2521)
- B91: DONE 2026-10-19 (owner-approved). buildPrincipalResidenceTransaction (now takes flags): eligible -> full; !eligible - closed marker: DONE 2026-10-19 (owner-approved). (hist L2522)
- B92: DONE 2026-10-19 (owner-approved). adjustmentCodeOptions rewritten from the 2025 i8949 code table - closed marker: DONE 2026-10-19 (owner-approved). (hist L2523)
- B93: DONE 2026-10-19 (owner-approved). Spouse capital-gain form: 28% field label/help/screening help reworded - closed marker: DONE 2026-10-19 (owner-approved). (hist L2524)
- B94: DONE 2026-10-20 (owner-approved). STATEMENT_SSN_RULES now covers 1099-LS (paymentRecipientTIN), 1099-SB (sellerTIN) and - closed marker: DONE 2026-10-20 (owner-approved). (hist L2525)
- B95: DONE 2026-10-20 (owner-approved). Schedule 1 line 2b and 19b/19c come from - closed marker: DONE 2026-10-20 (owner-approved). (hist L2526)
- B96: DONE 2026-10-20 (owner-approved). Form 8938 header: name -> name_shown_on_return, SSN -> - closed marker: DONE 2026-10-20 (owner-approved). (hist L2527)
- B97: DONE 2026-10-20 (owner-approved). Form 2210 column (b) stays 06/15/25 / 304 - closed marker: DONE 2026-10-20 (owner-approved). (hist L2528)
- B98: DONE 2026-10-20 (owner-approved). dependent_own kiddie form gets the dependent's isFullTimeStudent and - closed marker: DONE 2026-10-20 (owner-approved). (hist L2529)
- B99: DONE 2026-10-20 (owner-approved). us-tax-ui ageAtEndOfTaxYear (no UTC shift, day-before-birthday rule) used - closed marker: DONE 2026-10-20 (owner-approved). (hist L2530)
- B100: DONE 2026-10-20 (owner-approved). Claim-of-right fields moved to their own Standard or - closed marker: DONE 2026-10-20 (owner-approved). (hist L2531)
- B101: DONE 2026-10-20 (owner-approved field). V358 pf_filing_status.qss_spouse_date_of_death (Filing status form, QSS only); - closed marker: DONE 2026-10-20 (owner-approved field). (hist L2532)
- B102: DONE 2026-10-20 (owner-approved). iraDeductionMfsLivedApartLine20 removed from both income-adjustments forms and the - closed marker: DONE 2026-10-20 (owner-approved). (hist L2533)
- B103: DONE 2026-10-20 (owner-approved). Unanswered MFS residence = lived together for every - closed marker: DONE 2026-10-20 (owner-approved). (hist L2534)
- B104: DONE 2026-10-20 (owner-approved). validateUnmarriedHoh: HOH_HOME_COST_NOT_MET (headKeptUpOwnHome not Yes) and HOH_NO_QUALIFYING_PERSON (no - closed marker: DONE 2026-10-20 (owner-approved). (hist L2535)
- B105: DONE 2026-10-20 (owner-approved fields). V359 why/when fields for the CTC (CTC - closed marker: DONE 2026-10-20 (owner-approved fields). (hist L2536)
- B106: DONE 2026-10-20 (owner-approved). EIC child count drops a child whose dependent - closed marker: DONE 2026-10-20 (owner-approved). (hist L2537)
- B107: DONE 2026-10-20 (owner-approved). withPatrOnScheduleF also fills accrual lines 38a/38b (one farm, - closed marker: DONE 2026-10-20 (owner-approved). (hist L2538)
- B108: DONE 2026-10-20 (owner-approved). Form 8958 computed and previewed (pure HTML/CSS, Form - closed marker: DONE 2026-10-20 (owner-approved). (hist L2539)
- B109: DONE 2026-10-20 (owner-approved). 2024 gross farming/fishing income and 2024 total gross - closed marker: DONE 2026-10-20 (owner-approved). (hist L2540)
- B110: DONE 2026-10-20 (owner-approved). Form 8829 line 9: home-office form asks "federally - closed marker: DONE 2026-10-20 (owner-approved). (hist L2541)
- B111: DONE 2026-10-20 (owner-approved). Form 8829 line 35 (allowed casualty part) off - closed marker: DONE 2026-10-20 (owner-approved). (hist L2542)
- B112: DONE 2026-10-20 (owner-approved). Listed property on Form 4562 Part V Section - closed marker: DONE 2026-10-20 (owner-approved). (hist L2543)
- B113: DONE 2026-10-21 (owner-approved). Rental listed property = investment use (Pub. 946 - closed marker: DONE 2026-10-21 (owner-approved). (hist L2544)
- B114: DONE 2026-10-21 (owner-approved). Earlier Form 4797 Part IV recapture on the - closed marker: DONE 2026-10-21 (owner-approved). (hist L2545)
- B115: DONE 2026-10-21 (owner-approved). Schedule D required whenever line 7 Exception 1 - closed marker: DONE 2026-10-21 (owner-approved). (hist L2546)
- B116: DONE 2026-10-21 (owner-approved). Form 2210-F "file and pay by March 2, - closed marker: DONE 2026-10-21 (owner-approved). (hist L2547)
- B117: DONE 2026-10-21 (owner-approved). IRA forms QCD age warning: under 70½ = - closed marker: DONE 2026-10-21 (owner-approved). (hist L2548)
- B118: DONE 2026-10-21 (owner-approved). Community property MFS: Schedule C / F net - closed marker: DONE 2026-10-21 (owner-approved). (hist L2549)
- B119: DONE 2026-10-21 (owner-approved). Community property MFS: 1099-R (not IRA) / RRB-1099-R - closed marker: DONE 2026-10-21 (owner-approved). (hist L2550)
- B120: DONE 2026-10-21 (owner-approved). Schedule A already split by "paid by" (Pub. - closed marker: DONE 2026-10-21 (owner-approved). (hist L2551)
- B121: DONE 2026-10-21 (owner-approved). Form 2210-F test: fishing business mark (V369; code - closed marker: DONE 2026-10-21 (owner-approved). (hist L2552)
- B122: DONE 2026-10-21 (owner-approved). Form 4562 Part V line 24a / 24b - closed marker: DONE 2026-10-21 (owner-approved). (hist L2553)
- B123: DONE 2026-10-21 (owner-approved). Rental / royalty properties and Form 4835 farm - closed marker: DONE 2026-10-21 (owner-approved). (hist L2554)
- B124: DONE 2026-10-21 (owner-approved). Primary MFS return: filing-status stamped with both SSNs - closed marker: DONE 2026-10-21 (owner-approved). (hist L2555)
- ENG: TaxReturnComputeService constant pool headroom - DONE 2026-10-23 (helper classes, TaxReturnComputeServiceConstantPoolTest); splitting prepareReturn explicitly not needed (hist L2557)

**E0. Found while fixing A4 (2026-10-16)**

- Seven more personal forms load saved data without re-rendering - closed marker: DONE 2026-10-16 (owner-approved). (hist L2625-2626)

**E. Housekeeping**

- us-tax-be/context.md has not been updated by the round-2 batches. - closed marker: DONE 2026-10-23: (hist L2633)
- Hrb2025Sc00250Test seeded the 1099-R taxable amount under a non-canonical key (taxableAmount; the - closed marker: DONE 2026-10-23: (hist L2641)
- Downloaded IRS instruction PDFs left untracked in docs/IRS-Forms/_dl_i1040sr (Schedule R) and docs/IRS-Forms/_dl_i172 - closed marker: DONE 2026-10-23: (hist L2642)
- e2e se-home-office-280a-tiers.spec.ts was changed by fix 9f4d39d8 (−1000 → 0 for a - closed marker: DONE 2026-10-23: (hist L2644)
- e2e line28-actc-schedule8812.spec.ts (the removed‑T30 comment) labels Form 4137 → Schedule 2 line - closed marker: DONE 2026-10-23: (hist L2654)
- sc_00201–00203 graded credit rows H&R Block cannot enter (expected FAILs) - closed marker: RESOLVED 2026-10-15 (hist L2655-2656)

**LTC premium cap**

- Long-term-care premium age-band cap on Schedule A medical - Status marker DONE 2026-10-23 (V382, LtcPremiumCap, LtcPremiumCapTest); related mileage/offset/lodging also derived (V283/V302/V383). (hist L2662-2711)

**LTC premium cap (sub-gap)**

- Optional State/Local Sales Tax Table derived - Status marker DONE 2026-10-23 (V383, OptionalSalesTax + sales-tax CSVs, OptionalSalesTaxTest); tables need annual refresh. (hist L2712-2750)

**MAGI audit batch 1**

- Senior deduction phaseout applied per person - Marked FIXED + committed 2026-07-30 (history.md). (hist L2760-2762)
- NIIT MAGI drops foreign housing exclusion add-back - Marked FIXED + committed 2026-07-30. (hist L2763-2764)
- Saver's credit AGI adds 911/931/933 exclusions - Marked FIXED + committed 2026-07-30. (hist L2765)
- Roth MAGI adds Form 8815 and 8839 add-backs - Marked FIXED; TRCS ~6215-6242 excMagi includes excForm8815/excForm8839. (hist L2766)
- Schedule 8812 MAGI adds Puerto Rico and Form 4563 - Marked FIXED + committed 2026-07-30. (hist L2767)

**MAGI audit LOW**

- Adoption credit MAGI worksheet re-derived - Struck and marked FIXED 2026-07-30 (Form 8839 line 30 excluded benefits). (hist L2770-2778)
- Form 8880 testing period includes early-2026 distributions - Struck and marked FIXED 2026-07-30 (V205). (hist L2779-2782)
- IRA deduction MFS spouse-covered phaseout range - Struck and marked FIXED (applyPub590aIraPhaseout MFS branch). (hist L2785-2787)
- Form 8815 default MAGI adds foreign exclusions - Struck and marked FIXED (foreignExclusionAddback in computeForm8815). (hist L2788-2790)

**Verification sweep: stale**

- Form 8815 savings-bond exclusion computed - Sweep confirmed implemented (computeForm8815). (hist L2813)
- Form 8615 parent-rate and sibling aggregation - Sweep confirmed implemented. (hist L2814)
- Form 6251 line 2k AMT disposition - Sweep confirmed implemented (V197). (hist L2815)
- Schedule SE flows to Schedule 2 line 4 - Sweep confirmed computeScheduleSE wired. (hist L2816)
- Schedule E per-property output - Sweep confirmed computeScheduleEOutput; REMIC Part IV since added (Wave2FieldsW4 D-sch-e-6). (hist L2817)
- Form 4972 Q6 eligibility gate - Resolved 2026-07-11 per sweep. (hist L2818)
- Line 27c EIC checkbox auto-derived - Sweep confirmed wired and tested. (hist L2819)
- Student-loan interest dependent guard - Sweep confirmed implemented. (hist L2820)
- Olympic medal AGI ceiling and flag - Sweep confirmed implemented. (hist L2821)
- Form 8839 foreign-child finality exclusion - Sweep confirmed implemented. (hist L2822)
- Form 2441 Worksheet A tighter cap - Resolved 2026-07-09 (V95). (hist L2823)
- Form 5695 Part II and Form 8936 credits computed - Sweep confirmed computed; many 8936/5695 e2e specs added since (history.md 1587-1660). (hist L2824)

**Verification sweep: compute-only**

- EIC investment income includes passive rental/royalty - Struck and marked FIXED 2026-07-29 (computeInvestmentIncomeForEic). (hist L2832)
- Roth MAGI subtracts conversion income - Struck and marked FIXED 2026-07-29 (TRCS ~6243 excMagi). (hist L2833)

**Verification sweep: needs field**

- K-1 oil and gas IDC to Form 6251 line 2t - Struck and marked DONE 2026-07-29 (V203). (hist L2836)
- Form 1116 foreign tax carryforward ledger - Struck and marked DONE (V202); carryback needs an amended return and stays out of scope. (hist L2837)

**AMT audit deferred**

- MFS AMTI add-back above $900,350 - Implemented at TRCS:33995-34002 (25% of the excess, capped at $68,500). (hist L2841)
- Form 2555 filer with capital gains uses Part III - The FEITW path passes hasQdcgOrCapGains and stacks Part III (TRCS:34225-34230). (hist L2843)
- Form 8801 line 22 excludes Form 8912 credit - Excluded on purpose in sumSchedule3NonrefundableCreditsForForm8801Line22 (TRCS:~40250). (hist L2845)
- MFS 20% QDCG floor $300,000 - Fixed 2026-07-30 (see line 2865, ReferenceData). (hist L2846)
- Form 6251 line 2a includes Schedule A line 6 - Line 2a = deductible taxes + deductible foreign taxes (TRCS:33873). (hist L2847)
- Section 1202 exclusion fields have no UI - Fields now in form-capital-gain-loss-taxpayer/-spouse components; code-Q percentage derived (history 2026-10-18 A66). (hist L2848)

**Credits-stack audit**

- EIC uses the table midpoint method - eicTableLookup snaps to the $50 midpoint (TRCS:~45671). (hist L2851)
- Education/saver CLWs read the elderly credit too early - Schedule R now runs first (TRCS:7660) before Form 8863 (7670) and 8880 (7683). (hist L2852)
- Form 2441 CLW uses an over-broad helper - Replaced; TRCS:39250 comment, line 10 = FTC + 6l (deferred-gap closure 2026-08). (hist L2853)
- Schedule 3 line 6l set too late for CLWs - Form8978NegativeAdjustment.setLine6l runs at TRCS:7183, before the credits. (hist L2854)
- CTC under-17 and SSN not enforced - DependentQualification.java:115 checks age < 17 and a work-valid SSN. (hist L2855)
- EIC Rule 10 (filer is someone's qualifying child) - Question asked and enforced (V459, TRCS ~45264). (hist L2856)
- Unverified CLW lists (8801, 8936, 8396) - Verified per-form CLW lists recorded in rules.md (deferred-gap closure 2026-08-02/03); Form 8801 audit 2026-08-05. (hist L2859)

**Capital gains audit**

- Schedule D Tax Worksheet stacking reversed - Struck and marked FIXED (commit 6d033e4). (hist L2862)
- Form 4952 line 4g election ignored - Struck and marked FIXED (commit e7a6771). (hist L2863)
- Capital-loss carryover taxable-income limit - Struck and marked FIXED (commit e7a6771). (hist L2864)
- MFS 20% floor $300,000 - Struck and marked FIXED (commit e7a6771). (hist L2865)

**QBI audit**

- Above-threshold SSTB dilutes loss apportionment - Includible view zeroes such SSTBs before netting (TRCS:16279-16303). (hist L2869)
- Elective aggregation not offered - Aggregation groups implemented (TRCS:16306-16327, 2026-08-04). (hist L2871)

**Form 8863 audit**

- Schedule R credit ordering - Schedule R moved ahead of the credits (TRCS:7660 vs 7670/7683; deferred-gap closure). (hist L2880)

**Form 8959 audit**

- Output stores lines 7/13/17/18 unrounded - Lines 13/17 now roundMoney on compute (TRCS ~38863-38880). (hist L2885)
- Line 22 subtracts unrounded line 21 - Line 22 now = rounded 19 - rounded 21 (TRCS ~38905). (hist L2886)
- Legacy computeAdditionalMedicareTax dead code - The method no longer exists in the backend (grep finds only a comment). (hist L2888)

**Line 16 audit**

- Schedule D line 19 not reduced by losses - line19Amount = raw - line19Reduction (CapitalGainLossComputations:561). (hist L2892)

**PTC audit**

- Shared-policy allocation applied to columns A/B/F - Marked stale at line 2899 (fixed 2026-08-03/04); Form8962Computations:388-399. (hist L2896)
- No corrected-SLCSP path - Column B is user-editable on the 1095-A, with advisory PTC_1095A_SLCSP_MISSING (Form1095ARules:69), plus a substitute SLCSP for shared policies. (hist L2897)
- Line 11 annual shown for partial-year coverage - Line 10 election uses line 11 only for 12 uniform months (Form8962Computations:~641-646). (hist L2898)
- AMT FTC simplified limitation election - Built 2026-09-13 (V253); original entry struck. (hist L2909-2925)
- Section 1202 QSBS fields have no UI - Fields now in the capital-gain-loss components; code-Q percentage derived (history 2026-10-18). (hist L2927-2935)
- Form 8962 Part V year-of-marriage alternative - Built 2026-09-11 (V251); original entry struck. (hist L2937-2968)
- 300-400% applicable figure rounded down - Marked fixed at line 2905 (HALF_UP linear segment). (hist L2976)
- Immigrant exception and dependents required to file - Immigrant answer read (history 2026-11-10); dependents' own returns via DependentOwnMagi (Form8962Computations:239). (hist L2978)
- QSEHRA reduction and LOW nominal notes - QSEHRA applied (PtcQsehra.reduceMonthly, Form8962Computations:586); the rest are label-only. (hist L2979)

**EIC audit**

- EIC table FLOOR versus rounding - Now HALF_UP, checked against the printed table (TRCS:~45684-45697). (hist L2983)
- EIC Form 2555 bar uses self-attestation - Eic2555Bar marks it from the computed Form 2555 objects (TRCS:6205). (hist L2984)

**Social Security audit**

- IRA coordination re-runs lump-sum election - Marked FIXED 2026-08-01. (hist L2988)

**Form 8880 audit**

- 1099-R line 4 excludes only G/H - ROLLOVER_DISTRIBUTION_CODES now G,H,L,8,P,N,R (TRCS:149) plus Form8880Inputs.excluded (D/E, military, inherited IRA). (hist L2997)

**Form 5695 audit**

- Fuel-cell joint-occupancy proration - Form5695JointOccupancy computes it from the occupants' totals; the door sub-cap is tracked at line 2858. (hist L3000)

**Form 2441 audit**

- Disqualified care providers not checked - Wave2FieldsW0.ineligibleProviderPayments (D-1e-9) checks the provider against the filer and dependents. (hist L3003)
- Deemed income per month, not annual - Per-month deemed months and their earnings (Wave2FieldsW0.deemedEarned, V400; Line1WageComputations:2328-2372). (hist L3005)
- MFS considered-unmarried field differs from filing status - FilingStatusConsistency.java:75-76 derives it from the filing-status lived-apart answer. (hist L3006)

**NIIT audit**

- Line 5b sign convention - Line 5d now adds 5a + 5b + 5c, signed (TRCS:38341). (hist L3009)
- Real-estate pro makes every rental nonpassive - nonpassive = reProApplies && material participation not No (TRCS:29372). (hist L3011)
- No self-rental recharacterization - rentedToYourOwnBusiness input + Wave2FieldsW4.recharacterizedNonpassive (D-8582-13). (hist L3012)
- Spouse Form 2555 leaks into MFS Roth MAGI - Roth MAGI uses form2555SpouseOwn (MFS-guarded, TRCS:6183/6227); other MAGI consumers guarded (6553/6664). (hist L3015)

**Out-of-scope list**

- Schedule H household employment tax - Struck and marked BUILT 2026-07-30 (V204). (hist L3019)
- Form 8814 versus child's own return - Struck and marked DONE 2026-07-29. (hist L3020)

**SE plan, status banner**

- SE program C1-C7 and three audit gap fixes - Marked "NO KNOWN GAPS" 2026-07-21; gap fixes cited by commit (270ae57, 5a6d1af, 735845c, b3fb2ee, b5f69d0, 8a2f0fc) and migrations V152-V158. (hist L3024-3034)

**SE plan, simplifications**

- Form 8829 home-office carryforward bridge - Struck and RESOLVED 2026-07-29 (V194); the §461(l) loss already flows into the Form 172 NOL bridge. (hist L3036)
- §179(b)(2) phaseout uses elected cost, not cost placed - Fixed by D-4562-13: Section179Limit.line2() now totals the cost of all section 179 property placed in service, and line5() applies the phaseout before the MFS halving. (hist L3037)
- §199A UBIA drop-off and optional-method gates - Both struck and RESOLVED 2026-07-29 (assetDepreciablePeriodEndedBeforeYearClose; V195). (hist L3038-3039)

**SE plan, QBI**

- Negative QBI netting, 8995-A loss apportionment, QBI loss carryforward - Struck and RESOLVED 2026-07-27, with e2e qbi-negative-netting and qbi-loss-carryforward-bridge. (hist L3042)

**SE plan, Form 4797**

- Form 4797 recapture engine, Phases 1-5 - "PHASE 5 COMPLETE" (V185-V188); the AMT disposition gap was later built as Form 6251 line 2k (V197). (hist L3045)
- Property-type routing for §1250 real property - The FORM_4797_POSSIBLE_SECTION_1250_REAL_PROPERTY advisory (TaxReturnComputeService.java:3967) now points to the "Building or other real property" choice on Business property sales. (hist L3045)
- Stale StatementFormCatalogTest pin - Refreshed in commit 728a2c3d (42 to 56 forms). (hist L3045)

**SE plan, SE health**

- Pub. 974 SE-health and premium tax credit circular calculation - Struck and RESOLVED 2026-07-28; both spouses covered in V192. (hist L3046)

**SE plan, deferrals**

- Form 2210-F safe harbor and Form 172 NOL tracking - Both "NOW BUILT" (V190 out_form_2210f; V175 out_form_172 plus the bridge). (hist L3048)

**SE plan, new gaps**

- Household-work SE blocker and IRA compensation from SE - Retired in C7c (now an advisory); SE earnings added to the §219 compensation in the C2 add-on. (hist L3080-3085)

**SE plan, line table**

- Line-by-line SE gap table (Sch 1 L3/L6/L15-17, Sch 2 L4/L11, 13a, 27a, 8960, 461) - Every row except L27b is marked DONE; statutory-employee and Medicaid-waiver Schedule C routing are live (StatutoryEmployeeScheduleC.java; NonOverrideableFlags.java:86 D-1d-4). (hist L3089-3109)

**SE plan, Stage 1**

- All eight SE input forms (V141-V148) - Marked "COMPLETE 2026-07-20"; the F7 Form 1098 hook was done in V385, and 1099-MISC rents with no property raise FORM_1099_MISC_RENTS_ROYALTIES_NOT_ON_SCHEDULE_E (Misc1099Income.java). (hist L3113-3123)

**SE plan, Stage 2**

- Compute phases C1-C7 - C1-C7 are each marked DONE; dependent-own SE scoping is listed as completed at line 3033. (hist L3124-3141)

**SE plan, C7d**

- SQA-to-e2e coverage for SE scenarios - "C7d COMPLETE" (schedule-c-1099k-cogs, schedule-c-qjv); the sc_00225 hobby case is pinned in schedule-c-compute.spec.ts:85. (hist L3143-3168)

**SE plan, §A**

- Retire the SE out-of-scope blocker flags - The flags are retired in NonOverrideableFlags.java:437-439; only comments mention them now. (hist L3172-3197)
- Absorbed dormant items (K-1 rework, SE tax, Schedule E) - K-1 semantic rework done 2026-07-18; the others were absorbed into SE phases that are now done. (hist L3202-3212)

**SE plan, §B**

- Statement routing S1-S8 - S1 done (V385); 1099-NEC/K go to Schedule C (ScheduleCStatements) with the personal-items path; 1099-PATR and 1099-G box 7 go to Schedule F (ScheduleFIncomeFill); 1099-MISC boxes are wired (Misc1099Income); K-1 box 14A done. (hist L3214-3239)

**SE plan, §C**

- New SE personal input forms U1-U7 - Built in Stage 1 (V141-V148, V151 QJV). (hist L3241-3254)

**SE plan, §D**

- SE output previews T1-T9, T11, T12 - Previews for Schedule C/E/F/SE and Forms 4562/8829/7206/4835/461 read attachedForms lists from compute (for example form-tax-return-4835.component.ts:41, V387). (hist L3256-3274)

**SE plan, §E**

- Phase SE-1 Schedule C core - C1 marked DONE 2026-07-20. (hist L3278-3282)
- Phase SE-2 Schedule SE and downstream - C2 DONE; K-1 box 14A done (270ae57). (hist L3283-3286)
- Phase SE-3 SE deductions and QBI - C3a/C3b marked DONE. (hist L3287-3290)
- Phase SE-4 depreciation engine, Forms 4562 and 8829 - "C4 COMPLETE". (hist L3291-3294)
- Phase SE-5 Schedule F and Form 4835 - C5 DONE; Form 4835 compute (3dacaf0); Form 2210-F built. (hist L3295-3297)
- Phase SE-6 Schedule E and investment-income closure - Schedule E V152/V153; royalty depletion (ReferenceData ROYALTY_PERCENTAGE_DEPLETION_RATE); Form 8960 line 4 (C6b); K-1 passthrough boxes wired. (hist L3298-3302)
- Phase SE-7 cross-cutting closure - C7a-C7d DONE; Form 461 (C6c). (hist L3303-3306)

**SE plan, §F**

- Reconcile 2025 SE constants with OBBBA - ReferenceData.java:108-110 holds the OBBBA §179 values ($2,500,000 / $4,000,000). (hist L3308-3316)

**Admin SWA**

- GitHub Actions deploy workflow for the admin app - Struck and RESOLVED 2026-07-18 (admin repo commit 70909dd). (hist L3358-3431)

**Save-as-PDF**

- Blank-field FQN sweep plus Form 8863 address split - Struck and RESOLVED 2026-07-13 (fillAcroFormByLeaf; V127; assets regenerated in b2b0079). (hist L3433-3477)

**§199A rental QBI**

- Safe-harbor rental auto-feeds the QBI deduction - Struck and RESOLVED 2026-07-26; losses now count too (safeHarborRentalNetForQbi is SIGNED, TaxReturnComputeService.java:10520). (hist L3479-3491)

**Form 5329**

- Excess-contribution 6% excise simplifications - Verified 2026-10-23 and fixed 2026-10-24 (Roth MAGI, combined cap, lines 10-12/19-20, V385). (hist L3493-3516)

**Line 5b §72(t)**

- Early-distribution penalty base: basis, PSO, box 5, blank 2a - "Both FIXED 2026-10-24" (PensionEarlyDistributionBase); rollover, PSO and box 5 netted 2026-07-28. (hist L3518-3552)

**Form 6251 AMT**

- AMT adjustments 2d/2e/2f/2k/2l/2m and Form 8582 AMT - "COMPLETE"; the leftover pieces are built too: ATNOL input atnolCarryforwardAmount, K-1 code B to 2k, IDC 2t, code F to line 3 (TaxReturnComputeService.java:4900-4935); the "line 2k STILL DEFERRED" paragraph is superseded by V197. (hist L3554-3644)

**MFS spouse forms**

- MFS spouse-forms migration #12-#50 - "COMPLETE"; the four residuals were resolved 2026-07-13 (V126). (hist L3666)

**Dependent-own returns**

- Dependent statements, EIC advisory, picker curation - Verified 2026-10-23: limitations 1 and 2 done; the picker excludes parent-claimed types (statement-selection.service.ts:133). (hist L3668-3699)

**Save-as-PDF**

- Follow-ups after the semantic-name migration - "ALL RESOLVED" (generator, e2e, V93). (hist L3701-3710)

**Multi-return**

- Pattern-C mappers missing loadByTaxReturnId - Struck and RESOLVED 2026-07-01. (hist L3711-3736)

**MFS childcare**

- Return-level Form 2441 blocks the spouse's MFS leg - Struck and RESOLVED 2026-06-21 (V82). (hist L3738-3776)

**Line 4abc**

- QCD $108,000 and split-interest $54,000 caps - Completed 2026-06-03 (ReferenceData constants and flags). (hist L3778-3782)

**Line 5b**

- Basis recovery per annuity stream - Struck and RESOLVED (computePensionTaxableViaPerStream). (hist L3784-3834)

**Line 6b**

- Prior-year accuracy of the lump-sum election - Struck and RESOLVED (V48). (hist L3836-3882)

**Line 6d**

- Lived-apart and lived-with flags must be mutually exclusive - Closed 2026-06-06 (blocker SOCIAL_SECURITY_LINE6D_MFS_RESIDENCE_INCONSISTENT). (hist L3884-3891)

**Lines 2a/2b**

- Seller-financed mortgage interest triggers Schedule B - RESOLVED 2026-06-02 (V39). (hist L3935-3979)

**Line 2b**

- Form 8815 line-by-line exclusion reduces line 2b - Struck and RESOLVED 2026-07-07 (two-pass prepare). (hist L3981-4036)

**Line 3a**

- Field for non-treaty foreign corporation dividends - RESOLVED 2026-06-03 (V42); the older entry is superseded. (hist L4038-4078)

**Cross-line audit**

- 0-vs-null compliance audit, lines 1a-38 - Struck, COMPLETE 2026-07-08. (hist L4080-4152)

**Refactor**

- addNonNullVarargs helper migration - Struck and RESOLVED 2026-07-09. (hist L4153-4216)

**Form 1040 header**

- Combat-zone checkbox - Struck and RESOLVED 2026-07-07. (hist L4217-4263)

**Line 1i**

- Combat pay counts as IRA compensation - Struck and RESOLVED 2026-07-09 (computeIraCompensation). (hist L4264-4297)

**Helper**

- sumW2Box12ByCodes null-SSN handling - Struck and RESOLVED 2026-07-07. (hist L4298-4329)

**Line 28**

- CTC per-child amount documentation drift - Struck and CLOSED 2026-07-09. (hist L4330-4362)

**Line 27c**

- EIC opt-out checkbox auto-fill - Struck, ALREADY RESOLVED (verified 2026-07-07). (hist L4363-4403)

**Line 27a**

- Deprecate the legacy electNontaxableCombatPay fields - Struck and RESOLVED 2026-07-07. (hist L4404-4434)

**Line 1h**

- Advisory for corrective distribution with box 2a missing - Struck and RESOLVED 2026-07-07 (LINE1H_CORRECTIVE_BOX2A_MISSING). (hist L4435-4474)
- Advisory for code-P-only 1099-R - Struck and RESOLVED 2026-07-07 (LINE1H_CODE_P_PRIOR_YEAR_INFO). (hist L4475-4518)

**Schedule 2 line 13**

- Uncollected SS/Medicare from W-2 codes A/B/M/N - Struck and RESOLVED 2026-07-07. (hist L4519-4559)

**Form 8839**

- Special-needs adoption off-W-2 Part III - Struck and RESOLVED 2026-05-23. (hist L4560-4580)
- §137(d) same-expense auto-subtraction - Struck and RESOLVED 2026-05-23. (hist L4581-4600)
- §1372 over-2% S corporation owner disallowance - Struck and RESOLVED 2026-05-23. (hist L4601-4618)
- Shared adoption line 19 split with a non-spouse - Struck and RESOLVED 2026-05-23. (hist L4619-4639)
- Cross-check manual MAGI against the worksheet - Struck and RESOLVED 2026-07-07. (hist L4640-4661)
- Retroactive exclusion in a foreign child's finality year - Struck and RESOLVED 2026-05-24; the older entry is superseded. (hist L4662-4709)

**Notice 2014-7**

- Home-sharing advisory raised to a blocker - Struck and RESOLVED 2026-07-09. (hist L4710-4743)

**Medicaid waiver**

- UI check for duplicate entries - Struck and RESOLVED 2026-07-09. (hist L4744-4770)
- §131(c) per-person cap - Struck and CLOSED 2026-07-09. (hist L4771-4785)

**Form 2441**

- Full Pub 503 Worksheet A for line 9b - Struck and RESOLVED 2026-07-09 (V95). (hist L4786-4822)

**Docs**

- Sweep source line numbers in knowledge files - Struck and RESOLVED 2026-07-07. (hist L4823-4841)

**Tips**

- Store an adequate-records audit trail - Struck and RESOLVED 2026-07-09 (V96). (hist L4842-4867)
- Hide SS wage-base fallback fields when a W-2 exists - Struck and RESOLVED 2026-07-07. (hist L4868-4891)

**Line 1c**

- buildTipEntriesFromW2 null-SSN double count - RESOLVED 2026-07-07 with a lock-in unit test. (hist L4914-4965)

**Diagrams**

- Line 1b diagram refresh - Struck and RESOLVED 2026-07-09. (hist L4966-4983)

**W-2 UI**

- Structured-form alternate view - Struck and RESOLVED 2026-10-30 (deleted). (hist L5039-5050)

**Header dialogs e2e**

- e2e for Account, Payment, Support, Messages - header-dialogs.spec.ts (9/9); Support submit and Messages residuals closed 2026-07-14. (hist L5052-5070)

**Admin tooling**

- Admin message creation backend and compose UI - Backend V98 plus POST /api/admin/messages; the "admin UI still deferred" residual is built: reply-to-inbox in the support dashboard and broadcast to selected users in us-tax-admin-ui/src/app/screens/notifications.component.ts. (hist L5077-5092)

**Support dashboard**

- Support-request dashboard backend, route, guard and UI - Backend V99; /admin/support plus supportRoleGuard built 2026-07-14; the "remain PARKED" note is superseded; us-tax-admin-ui has support.component.ts. (hist L5094-5113)

**Payments**

- Backend redemption of payment codes - Struck and RESOLVED 2026-07-09 (V97); production code minting is built too (AdminAccessCodeResource plus us-tax-admin-ui screens/codes.component.ts). (hist L5129-5146)

**Line 13a/13b**

- Taxable income before QBI subtracts line 13b - Marked Implemented 2026-04-17; second-pass computeLine13a with unit test. (hist L5147-5149)

**Line 13a**

- QBI taxable-income limit capital gain proxy - Resolved 2026-04-17; the formula was confirmed correct. (hist L5153-5155)

**Line 13b**

- Tips from 1099-NEC auto-imported - Implemented 2026-04-17 (sum1099NecTipsForSsn + unit test). (hist L5159-5161)
- Net income cap for trade tips - Implemented 2026-04-17 (trade tips net income cap fields + unit test). (hist L5165-5167)

**Line 13a**

- SSTB above-threshold path computed - Implemented 2026-04-17 (phase-in scaling + unit test). (hist L5171-5173)
- Cooperative patron path blocked - Implemented 2026-04-17 (LINE13A_COOPERATIVE_PATRON_UNSUPPORTED flag). (hist L5177-5179)

**Line 13b**

- Car loan interest from Schedule C/F excluded - Implemented 2026-04-17 (exclusions summed in vehicle loop + unit test). (hist L5183-5185)
- Car loan refinancing limit - Implemented 2026-04-17 (proportional interest + unit test). (hist L5189-5191)
- Multiple-employer tip worksheet - Resolved 2026-04-17; the combined total is identical, info panel added. (hist L5195-5197)

**Line 13a**

- REIT/PTP loss carryforward - Implemented 2026-04-17; also auto-imported now (importedPriorYearReitPtpLossCarryforward). (hist L5201-5203)

**Line 13b**

- E2E test for tips phaseout - Implemented 2026-04-17 (Scenario 8 in line13b spec). (hist L5207-5209)

**Line 10 / 21**

- Student loan interest cap, phaseout and dependent guard - Implemented 2026-04-16; dependent guard now in Schedule1Computations.java:1194 (SCHEDULE1_LINE21_STUDENT_LOAN_INTEREST_DEPENDENT_DISALLOWED). (hist L5213-5217)

**Line 10 / 19a**

- Alimony post-2018 guard - Implemented 2026-04-16 (blocking flag + tests). (hist L5221-5225)

**Line 10 / 11**

- Educator expenses $300 cap - Implemented 2026-04-16 (EDUCATOR_EXPENSES_CAP_PER_PERSON). (hist L5229-5233)

**Line 10 / 20**

- IRA deduction phaseout and nondeductible advisory - Implemented 2026-04-16; the Form 8606 residual is done in IraNondeductible.java (IRA_NONDEDUCTIBLE_CONTRIBUTION_NOT_ON_FORM_8606_*). (hist L5237-5243)

**Line 10 / 18, 21**

- Statement auto-import tests - Implemented 2026-04-17 (4 unit + 2 e2e tests). (hist L5247-5259)

**Line 10 / 24k**

- K-1 (1041) box 11 excess deductions parsed - Implemented 2026-04-16. (hist L5263-5267)

**Lines 6c/6d**

- PDF checkboxes mapped - Implemented 2026-04-15. (hist L5271-5277)

**Line 6b**

- SS worksheet line 5 exclusions - Implemented; Form 8815, adoption and possession exclusions are now in worksheetLine5 / line 3 (TaxReturnComputeService.java:31241-31300). (hist L5281-5283)
- SS worksheet line 6 uses Schedule 1 adjustments - Implemented 2026-04-15 and later refined to the Pub. 915 subset. (hist L5287-5289)
- Lump-sum election full Pub. 915 worksheet - Implemented 2026-04-16. (hist L5293-5301)
- Adoption, Form 8815 and Samoa/PR on SS worksheet - Residuals done: adoptionExclusion, form8815ExclusionAppliedThisPass and computePossessionExclusionForSsWorksheet all feed the worksheet. (hist L5305-5312)
- Pub. 590-A IRA and SS coordination - Done (runPub590aCoordination, Worksheet 1 fix 2026-07-29, e2e ira-ss-coordination-pub590a.spec.ts). (hist L5316-5322)
- Special cases: negative benefits, IRA coordination - Negative-benefit advisory added 2026-04-15; IRA coordination done (see above). (hist L5326-5329)

**Line 6**

- E2E tests rewritten to API style - Implemented 2026-04-15. (hist L5333-5337)

**Line 5c**

- PDF checkboxes mapped - Implemented 2026-04-15. (hist L5341-5343)

**Line 5**

- PSO field label - Implemented 2026-04-15. (hist L5347-5349)
- RRB-1099-R taxable amount read - Implemented 2026-04-15. (hist L5353-5355)
- Rollover base starts from box 1 - Implemented 2026-04-15. (hist L5359-5361)
- Simplified Method prior-year recovery - Implemented 2026-04-15. (hist L5365-5367)
- Pension E2E coverage - Verified 2026-04-16 (10 e2e passing). (hist L5371-5375)
- Box 2b taxable-not-determined test - Resolved 2026-07-08 (unit + e2e). (hist L5381)
- Spouse pension upload gate - Fixed 2026-10-30 (PensionSpouseUploadGate). (hist L5382)
- Pension UI wizard screens - Implemented 2026-04-15. (hist L5386-5388)

**Form 8814**

- Statement-driven child income - Implemented 2026-04-14 (7 unit + 4 e2e tests). (hist L5493-5497)

**Line 2a**

- Box 9 double-counted - Resolved 2026-04-13 and re-verified; subtractNonNegative(box8, box13). (hist L5501-5523)

**Line 2**

- FBAR flag separate from foreign account - Resolved (hasFbarRequirement is a separate field). (hist L5527-5529)
- Nominee interest triggers Schedule B - Resolved (hasNomineeInterest in scheduleBRequired). (hist L5533-5535)

**Line 3**

- Schedule B dividend payer detail - Resolved (scheduleBDividendItems). (hist L5539-5541)

**Line 3c**

- Child dividend checkbox - Closed 2026-04-14 and verified 2026-07-09. (hist L5545-5553)

**Line 2b / 8815**

- Form 8815 compute and line 2b two-pass - Closed 2026-06-02; the Gap 7 residual is done by the two-pass at TaxReturnComputeService.java:238-263. (hist L5557-5565)

**Line 1d**

- IRC 131(c) per-person cap - Resolved 2026-05-31 (placeholder pointing to the canonical entry). (hist L5584-5586)

**Line 1c**

- E2E coverage gaps - Resolved 2026-07-07. (hist L5590-5600)

**Line 1b**

- Dead household-employee YAML - Resolved 2026-05-10 (file deleted). (hist L5604-5610)
- Form 8919 collision guard - Resolved 2026-04-09. (hist L5614-5616)

**Form 8839**

- Part II adoption credit notice and hint - Resolved 2026-04-18; the adoption screen no longer has an out-of-scope note. (hist L5625-5629)

**Line 1g / 1i**

- Boolean fields use radio buttons - Resolved (both fields, verified 2026-07-09). (hist L5633-5639)

**Line 1i**

- Combat pay compute-both-ways guidance - Fixed 2026-04-13. (hist L5643-5645)
- ACTC earned income includes combat pay - Fixed 2026-04-13 with 2 unit tests. (hist L5649-5653)

**Line 1g**

- E2E page.fill bug - Fixed 2026-04-12. (hist L5657)
- Form 8919 E2E coverage - Fixed 2026-04-12 (4 tests). (hist L5661-5667)

**Priority 1**

- Schedule 8812 Part II-B line 24 order - Fixed 2026-04-18. (hist L5708-5716)

**Priority 2**

- Form 4952 preview and AMT line 2c - Complete 2026-07-13 (form-tax-return-4952.component.ts, computeAmtInvestmentInterestAdjustment). (hist L5720-5745)

**Line 20 G2**

- Form 8978 negative to Schedule 3 line 6l - Resolved 2026-07-08 and 2026-07-29 (applyForm8978NegativeToSchedule3). (hist L5754-5779)

**Line 20 G3**

- Form 4136 fuel tax credit - Fixed 2026-04-18. (hist L5783-5785)

**Line 20 G5**

- Section 965(i) to Schedule 3 line 13d - Fixed 2026-04-18. (hist L5789-5791)

**Line 20 G6**

- Schedule 3 line 7 total - Fixed 2026-04-18. (hist L5795-5797)

**Line 21**

- Unit tests and retries - Fixed 2026-04-19. (hist L5821-5834)

**Line 22**

- Spec retries - Fixed 2026-04-19. (hist L5838-5845)

**Priority 3**

- Form 8839 line 18 nonrefundable credit - Fixed 2026-04-18. (hist L5849-5851)

**Priority 5**

- Dependent own return - Resolved 2026-07-10; self-claim residual done (DEPENDENT_OWN_RETURN_EIC_AND_SELF_CLAIM_DISALLOWED, TaxReturnComputeService.java:4114); 2-child e2e in dependent-own-kiddie-tax.spec.ts. (hist L5887-5898)

**Priority 6**

- electsNoActc control - Resolved (stale) 2026-07-08. (hist L5906)
- Line 36 cap in UI - Resolved (stale) 2026-07-08. (hist L5908)

**Priority 7**

- PDF fill-export backlog - Resolved 2026-07-10 (pure-HTML previews for all 11 forms). (hist L5912-5933)

**Lines 33-38**

- Routing check and line 36 ceiling - Fully implemented 2026-03-29. (hist L5937-5943)

**Form 8888**

- No split refund with Form 8379 - The UI blocks it (form-refund-and-amount-owed.component.ts:67,129 "A split refund isn't offered with Form 8379"), per i1040 line 35. (hist L5949)
- Form 8888 PDF fill/export - Superseded by the pure-HTML preview form-tax-return-8888.component.ts. (hist L5952)

**Form 8862**

- Semantic PDF assets - Generated 2026-03-28. (hist L5966)
- More than 3 EIC / 4 CTC children statement - Form8862.statement continuation (model/output/Form8862.java:86-98, 2026-11-16). (hist L5969)

**Line 27a**

- Form 8862, student path, MFS exception, SE earned income, Part II-B - Fixed; SE earnings feed EIC (scheduleSE.taxpayerEicSeAdjustment, TaxReturnComputeService.java:45444). (hist L5981-5986)
- G1-G6 gaps incl. Schedule E investment income - Fixed; computeInvestmentIncomeForEic takes netPassiveRentalRoyaltyForEic (TaxReturnComputeService.java:45470). (hist L5989-5994)

**Lines 25a-25d**

- 1099-DA, 8959, NEC withholding; K-1/1042-S - Fixed 2026-04-19; 1042-S and K-1 withholding now wired (Withholding1042S, K1Form1041Items at TaxReturnComputeService.java:8222). (hist L5998-6003)

**Line 24**

- Form 2210 line 1 and line 24 spec - Fixed 2026-04-19. (hist L6007-6010)

**Lines 20-38**

- 5329 wiring, line 26, EIC, 8863 MAGI - Fixed or resolved (struck). (hist L6014-6021)

**Form 8863**

- Dependent student cross-check - A dependent's own return is barred (EducationCreditComputations.java:396, dependentOwnReturn flag). (hist L6022)
- PDF, unit tests, e2e - Implemented 2026-03-28. (hist L6023-6025)
- 1098-T statement import - 1098-T is in StatementFormCatalog with Form1098TMapper. (hist L6026)
- Prior-year AOTC recapture - ECR recapture on line 16 (hasEcrRecapture) with the 1098-T box 4 advisory (Form1098TPriorYear.java). (hist L6027)
- Second institution and institution EIN - Form8863Student has institution1Ein and institution2* fields. (hist L6028-6029)

**Line 29**

- G1-G24 Form 8863 gaps - Fixed 2026-04-20; G4 under-24 sub-conditions now asked (EducationCreditComputations.java:868-870). (hist L6030-6048)

**Line 15**

- Taxable income gaps - All resolved 2026-04-17. (hist L6052-6056)

**Lines 11a/11b**

- AGI gaps - All resolved 2026-04-17. (hist L6060-6064)

**Line 12e**

- Schedule A / standard deduction gaps - All resolved; Form 4684 is now computed (model/output/Form4684.java). (hist L6068-6096)

**Form 8396**

- Line 20 wiring - Resolved 2026-03-26. (hist L6102)
- Schedule A reduction and PDF - Resolved 2026-04-17; PDF superseded by pure-HTML preview. (hist L6104-6105)
- Prior-year carryforward import - 20th carryforward bridge (Form8396Rules.withPriorYearCarryforwards, 2026-11-09). (hist L6106)

**Form 8936**

- Line 20, commercial/business, Form 3800, recapture, PDF, MFS MAGI - Done: Part V commercial (V504), Form 3800 lines 1y/1aa, Schedule 2 repayment (CleanVehicleRules.java:130), form-tax-return-8936sa, V126. (hist L6112-6117)

**Schedule R**

- Line 20 and PDF - Resolved; PDF superseded by pure-HTML preview. (hist L6123-6124)

**Line 26**

- Form 2210 and MFJ gaps G1-G5 - Fixed; Schedule AI box C and box D now computed (TaxReturnComputeService.java:44552,44583), 2210-F computed. (hist L6131-6136)
- Prior-year overpayment auto-import - The estimated tax screen fills last year's line 36 (form-estimated-tax-payments.component.ts:413). (hist L6138)
- Farmers and fishermen 2210-F - Now in scope (computeForm2210F, CLAUDE.md 2026-09-10). (hist L6140)
- Community property split of joint payments - JointEstimatedPayments.java (B120) and CommunityProperty.java. (hist L6141)

**Form 4868**

- Line 26 and PDF - Resolved; PDF superseded by pure-HTML preview. (hist L6147-6148)
- Name and address auto-fill - computeForm4868 sets names and address (TaxReturnComputeService.java:41603-41606). (hist L6149)

**Form 5695**

- Line 20 and PDF - Resolved; PDF superseded by pure-HTML preview. (hist L6156-6157)

**Form 8880**

- Line 20 wiring - Resolved 2026-03-26. (hist L6163)

**Form 1116**

- Line 20 wiring and AMT FTC - Done 2026-03-26 and 2026-07-13. (hist L6169-6170)
- Carryover ledger - Carryover vintages auto-imported (importedPriorYearFtcCarryover, TaxReturnComputeService.java:1293). (hist L6171)
- High-tax kickout - Done 2026-07-13. (hist L6172)
- Part IV consolidation - Part IV sums every category's credit, capped at US tax (TaxReturnComputeService.java:50496-50510). (hist L6173)
- Audit deferrals (QDCG, line 3g, FEIE, de-minimis, 1099 full path, 4972, MFS) - Built later: 0.4054/0.5405 (50126), line 3g apportionment (50432), section 911(d)(6) (49987), hardened election tests and statement tax added automatically (50300-50340), Form 4972 on line 20 (50397). (hist L6174-6181)
- MFS spouse simplified exception - Resolved 2026-06-23. (hist L6182)

**Line 17**

- MFS AMTI add-back - Implemented (TaxReturnComputeService.java:34007, 34052). (hist L6188)
- Form 6251 line 2c - Done 2026-07-13. (hist L6189)
- Line 2f ATNOLD - Computed (setLine2fAtnold, TaxReturnComputeService.java:34284). (hist L6190)
- Line 2i ISO - Computed (setLine2iIsoExercise, TaxReturnComputeService.java:34281). (hist L6191)
- Line 2m passive activity - Computed with the AMT 469 bridge (TaxReturnComputeService.java:4918, V200). (hist L6192)
- Line 8 AMT FTC - Done 2026-07-13. (hist L6193)
- Schedule 2 Part I credit recapture - Schedule2Tax has clean vehicle repayment and Form 4255 lines, set by CleanVehicleRules. (hist L6194)
- Additional gaps G1-G-new-4 - All fixed 2026-04-18. (hist L6196-6206)

**Line 18**

- Uses Schedule 2 line 3 - Fixed 2026-04-18. (hist L6210-6212)

**Form 8962**

- MFS spouse standalone leg and refinements - Done 2026-07-13; both copies now share the questions incl. alternative calculation and dependent MAGI (form-premium-tax-credit.component.ts:25,29,413,582). (hist L6214-6218)

**Form 8801**

- Line 20 and line 12 decision - Resolved; line 12 won't-implement decision recorded. (hist L6224-6225)
- PDF fill-export - Superseded by pure-HTML preview. (hist L6226)
- Part III MFS path - Form8801Rules.java:18 handles the MFS line 4 add-back. (hist L6227)
- Prior-year import - 19th carryforward bridge (Form8801Rules.withPriorYearCarryforward). (hist L6228)

**Form 8859**

- Line 20 and PDF - Resolved; PDF superseded by pure-HTML preview. (hist L6234-6235)
- Prior-year line 4 import - 21st carryforward bridge (Form8859Rules.java). (hist L6236)
- CLW-B automation and spouse override - CLW-B line 14 computed (TaxReturnComputeService.java:49947); spouse override done 2026-07-13. (hist L6238-6239)

**Form 8834**

- Line 20 and PDF - Resolved; PDF superseded by pure-HTML preview. (hist L6245-6246)
- Form 8582-CR release automation - The carried credit is released against tax on net passive income (V500, FORM_8834_RELEASED_FROM_CARRYOVER). (hist L6247)
- MFS spouse confirm field - Done 2026-07-13. (hist L6248)

**Form 8911**

- Line 20, Form 3800, PDF - Resolved 2026-11-17 and by the preview. (hist L6254-6257)
- Pass-through-only path - Resolved 2026-11-17. (hist L6259-6260)

**Form 8912**

- Line 20, 54A(f) gross-up, PDF - Resolved. (hist L6266-6268)
- Form 1097-BTC intake - 1097-btc in StatementFormCatalog.java:39. (hist L6269)

**Line 16 box 3**

- 962, 1291TAX, 8978, 965INC - Done or won't-implement with reasons 2026-07-13. (hist L6275-6280)

**Line 16**

- Additional gaps G2-G6 - FEITW housing deduction now in Form2555 (line50HousingDeduction, feitwHousingDeduction); e2e has SCHEDULE_D_TAX_WORKSHEET and box1Form8814Tax. (hist L6282-6288)

**Form 8615**

- Parent-rate tentative tax - Superseded by Priority 4 (computed 2026-07-10/11). (hist L6292-6295)

**Form 2555**

- Housing deduction, Schedule 1-A wiring, housing cap - Done (line50HousingDeduction; 2026-04-17; V123 2026-07-13). (hist L6301-6303)

**Form 8839**

- Nonrefundable credit, MAGI, MFS, PDF, CLW-B - Resolved 2026-04-11 to 2026-04-20. (hist L6310-6320)
- G7 Schedule 8812 CLW-B substitute - Full CLW-B line 14 formula implemented (TaxReturnComputeService.java:49910-49947). (hist L6321)

**Form 4972**

- NUA election - Done 2026-07-13 (V121). (hist L6328)
- QDRO alternate payee - Done 2026-07-13 (V121). (hist L6330)

**Schedule 8812**

- Parts I/II, CLW-A, ITIN, PR, G1-G11 - Fixed or implemented (struck). (hist L6336-6353)
- G3 line 22 SE tax - Line 22 uses Schedule 1 line 15 half SE tax (TaxReturnComputeService.java ~49845). (hist L6354)
- Lines 22-26 not fillable on PDF - The pure-HTML preview shows them (form-tax-return-schedule8812.component.ts:557-558). (hist L6355)

**Output wiring / Line 4**

- IRA attachments, code Q, QCD, fallback, tests - Fixed 2026-04-14/15. (hist L6362-6367)

**Output wiring / Line 7**

- Capital attachment forms, 8997, carryover, UI fixes - Implemented 2026-04-16. (hist L6369-6385)

**Output wiring / Line 8**

- Schedule C and F output - Self-employment now in scope (Schedule C/F computed 2026-07-20). (hist L6386)
- 1099-K space, 8m, 962 gate, 1099-G - Fixed 2026-04-16. (hist L6387-6390)
- State refund tax-benefit worksheet - D-8-7 State and Local Income Tax Refund Worksheet (LowIrsFixesChunk1.java:631). (hist L6391)
- Unemployment repayment over $3,000 - Section 1341 claim-of-right handled (ClaimOfRightTax.java). (hist L6392)

**Output wiring / Line 8d**

- Form 2555 exclusion auto-wired - Resolved stale duplicate. (hist L6393)

**Output wiring / Line 8**

- 1099-G note without dollar amount - The screen lists each statement with its detail (form-other-incomes-taxpayer.component.ts:96-100). (hist L6395)
- 8d, 1099-C, alimony date, spouse 962, help text - Fixed 2026-04-16. (hist L6396-6402)

**Output wiring / Form 4952**

- AMT recompute and Tax Return UI - Done 2026-07-13 (form-tax-return-4952 preview). (hist L6403-6404)

**Line 9**

- Test coverage gaps - All fixed 2026-04-16. (hist L6408-6421)

**Cross-cutting**

- Form 8959 and Form 8839 Part II - Implemented. (hist L6438-6439)
- Form 2441 earned income from 1g/1h - Per-person 1g and 1h now added (Line1WageComputations.java:2286-2304). (hist L6440)
- Form 8919 multi-page - Resolved 2026-04-09. (hist L6441)
- Semantic PDF fill-export, general - Superseded by pure-HTML previews (Priority 7). (hist L6442)
- Capital forms e2e coverage - Many specs now cover 4684/4797/6781/8824/K-1 (e.g. form4797-*.spec.ts, form6781-section1256-from-1099b.spec.ts). (hist L6443)

**Deep-pass**

- Auth user state and admin endpoints - Moot: AuthService/AuthResource deleted 2026-04-28. (hist L6449-6450)
- Inactivity timeout policy - Resolved 2026-07-08 (1 hour in app.settings.ts). (hist L6452)

**Line 23 G1**

- Self-employment tax - Schedule SE computed (ot.setSelfEmploymentTax, TaxReturnComputeService.java:38714). (hist L6460)

**Line 23 G2**

- Household employment taxes (Schedule H) - Computed (setHouseholdEmploymentTaxes, TaxReturnComputeService.java:6456, 38138; PfScheduleH). (hist L6461)

**Line 23 G3-G7**

- RRTA, NIIT, finalize pass, spec, Form 2210 - Fixed or resolved. (hist L6462-6466)

**Line 23 G8**

- W-2 box 12 A/B to Schedule 2 line 13 - Set at TaxReturnComputeService.java:37813; e2e added 2026-07-07 (line1c spec). (hist L6467)

**Line 31 gaps**

- G1 other-payments boolean dropdowns replaced by radios - Struck "Fixed 2026-04-21" marker. (hist L6477)
- G2 help modal added to other-payments form - Struck "Fixed 2026-04-21" marker. (hist L6479)
- G3 Form 8689 documented as line 13z source - Struck "Fixed 2026-04-21" marker. (hist L6481)
- G4 multi-credit Schedule 3 integration e2e test - Struck "Fixed 2026-04-21"; test in line31-other-payments.spec.ts. (hist L6483)
- G5 Form 3800 net elective payment on line 13c - Form 3800 is now computed: TaxReturnComputeService.java:8090/8184 feeds netElectivePayment via Form7210Compute.withNetEpe (Form3800*.java classes exist), so the "out of scope" premise is stale. (hist L6485)
- G6 e2e for Section 965(i) deferred tax - Struck "Fixed 2026-04-21" marker. (hist L6487)
- V1/NV1-NV4 IRS line references removed from labels and titles - All five bullets struck "Fixed 2026-04-21". (hist L6489-6497)
- G7/G8 screening-gate guard on stale amounts plus unit test - Struck "Fixed 2026-04-21"; test line31_gateFalse_staleAmountsNotApplied. (hist L6499-6501)
- G9-G12 line 13z items and Schedule 3 PDF field mappings - All four bullets struck "Fixed 2026-04-21". (hist L6503-6509)

**Form 8962 UI**

- Premium Tax Credit form UI violations - Section struck "Fixed 2026-04-21". (hist L6515-6528)

**Form 4868 UI**

- Extension-of-time form UI violations - Section struck "Fixed 2026-04-21". (hist L6530-6543)

**Form 2441 UI**

- Child-care expenses form UI violations - Section struck "Fixed 2026-04-11". (hist L6545-6549)

**Line 32 audit**

- G1-G4 line 30 mapping and line 32 contribution tests - All four bullets marked FIXED 2026-04-21. (hist L6555-6561)

**Line 32 UI audit**

- First-pass UI audit, 23 violations - Section struck and "CLOSED (verified done 2026-07-09)". (hist L6567-6585)
- Second-pass UI audit, 8863 and others - Section struck and "CLOSED (verified done 2026-07-09)". (hist L6587-6601)

**Line 33 audit**

- G1/G2 e2e for line 36 and direct deposit - Both bullets struck "Fixed 2026-04-21". (hist L6607-6609)

**Line 33 UI audit**

- Second-pass UI audit of refund-related forms - Section struck and "CLOSED (verified done 2026-07-09)". (hist L6613-6619)

**Line 33 gaps**

- Third-pass gap closure tests - Section struck and "CLOSED (verified done 2026-07-09)". (hist L6621-6643)
- Fourth-pass gap closure tests - Section struck and "CLOSED (verified done 2026-07-09)". (hist L6645-6659)

**Unified refund UI audit**

- R34/R33/R8/R10/R22/R43 refund form fixes - All six bullets struck "Fixed 2026-04-22". (hist L6665-6675)
- R18/R2/R12/TurboTax label and help fixes - All four bullets struck "Fixed 2026-04-22". (hist L6679-6685)

**Refund deferred items**

- Form 8888 PDF export - Struck "STALE - RESOLVED 2026-07-13"; form-tax-return-8888.component.ts has saveAsPdf. (hist L6691)
- Form 2210 Schedule AI annualized method - Now computed: computeScheduleAiRequiredInstallments (TaxReturnComputeService.java:44550/44846), Form2210.boxCAnnualizedIncome. (hist L6697)
- Form 2210 Box D actual withholding dates - Now computed: setBoxDActualDates(TRUE) at TaxReturnComputeService.java:44583, persisted as OutForm2210.actualWithholdingDatesUsed. (hist L6699)
- Form 2210-F farmers and fishermen - Superseded: computeForm2210F in scope since 2026-09-10 (CLAUDE.md, outstanding 7687 V259). (hist L6701)

**Form 1040 PDF-to-HTML cleanup**

- Delete served f1040 CSV and dead preview component - Marked "RESOLVED 2026-07-07", all follow-ups done. (hist L6703-6705)

**Statement family check**

- 1098-E borrower SSN check - StatementSsnRules.java:90 has the 1098-e/borrowerTIN rule. (hist L6713)

**Schedule 2 preview**

- Schedule 2 PDF field-position drift - Section struck "RESOLVED - superseded by pure-HTML preview (verified 2026-07-07)". (hist L6723-6731)

**Form 8889/8853 compute**

- HSA and Archer MSA/LTC standalone compute - Marked COMPLETE 2026-07-11 with e2e line8889-hsa.spec.ts and line8853-msa-ltc.spec.ts. (hist L6736-6759)

**Form 4797 compute**

- Form 4797 sales of business property - Built since SE went in scope: Form4797SalesCompute, Form4797PartIvBasis, Form4797Condemnation, Form4797RecaptureOutputMapper; the 4797 advisory is gone from TaxReturnComputeService. (hist L6738)

**Prior-year data**

- Steps 1-2 prior-year storage and state refund worksheet - Marked DONE 2026-07-11 (V112), e2e prior-year-state-refund-worksheet.spec.ts. (hist L6795-6796)
- Step 3 unemployment repayment (claim of right) - Done by later work: repayment routes to Schedule 1 line 24e (outstanding 7893, FIXED 2026-09-11) and the over-$3,000 section 1341 credit is computed via ClaimOfRightTax (TaxReturnComputeService.java:5803-5816). (hist L6797)

**Schedule 1 PDF render**

- Schedule 1 Save-as-PDF lock-in and field-map audit - schedule1-pdf-render.spec.ts un-skipped 2026-07-08 (spec line 87) and passing 2/2 (history.md:9717); FQN sweep resolved and the 8801/1-A/Sch D assets regenerated (outstanding 3433, b2b0079). (hist L6799-6834)

**Kiddie income**

- Form 8615 compute, auto-detect, parent pull, form simplification - Body marks #1-#4 DONE 2026-07-10 and deferred e2e DONE 2026-07-12 (header still says "in progress", which is stale). (hist L6836-6879)

**Schedule 1 Part II**

- Line 21 phaseout, 24c ceiling, 24h/24i caps - Section struck "RESOLVED 2026-07-07 (all 5 sub-items)". (hist L6881-6918)

**Pure-HTML view gaps**

- Gap 1 Schedule 1-A worksheet intermediates - Struck "RESOLVED 2026-07-10" (V106). (hist L6931-6937)
- Gap 2 Form 6251 sub-adjustments 2c-2t - Struck "RESOLVED"; the re-tracked 2c/2f compute now exists (Form6251.line2cInvestmentInterest, line2fAtnold). (hist L6939-6948)
- Gap 3 Form 8814 ratios and Part II checkboxes - Struck "RESOLVED 2026-07-10" (V105). (hist L6950-6964)
- Gap 4 Form 8606 filer address, preparer, signature - Struck "RESOLVED 2026-07-10"; preparer/signature out of scope by product design. (hist L6966-6990)

**Form 4972 view gaps**

- 4972-1 Part I questions 2-6 - Struck "FULLY RESOLVED" (Q2-Q5 V100, Q6 V113.1/V113.2). (hist L7060-7065)
- Older copy of 4972-1 with Q6 deferred - Superseded by the 7060 entry (Q6 resolved 2026-07-11). (hist L7066-7085)
- 4972-2 Part II intermediate lines - Struck "RESOLVED 2026-07-09" (V101). (hist L7086-7122)

**Form 8863 view gaps**

- 8863-1 1098-T disclosure checkboxes - Struck "RESOLVED 2026-07-09" (V100). (hist L7139-7155)
- 8863-2 institution EIN and structured address - EIN resolved 2026-07-10 (V102), structured address resolved 2026-07-13 (V127); attendance dates were a misread. (hist L7156-7178)
- 8863-3 second institution line 22b - Resolved 2026-07-10 plus the V127 address work. (hist L7179-7195)
- 8863-4 line 7 under-24 checkbox - Struck "RESOLVED 2026-07-10" (V103). (hist L7196-7209)
- 8863-5 AOTC lines 27-29 - Struck "RESOLVED 2026-07-10" (V104). (hist L7210-7225)

**Separate-filing optimizer**

- HOH/HOH and HOH/MFS splits - Section struck "RESOLVED 2026-06-20 (verified 2026-07-10)". (hist L7270-7298)

**Multi-return items**

- HoH leg stored as MFS - Struck "FIXED 2026-07-14" (syncLegFilingStatus). (hist L7302)
- Front-end tests for multi-return/optimizer UI - Struck "CLOSED 2026-07-14" (46 tests). (hist L7304)

**Schedule A charitable**

- Combined 50% ceiling and ordering - Marked RESOLVED 2026-07-12. (hist L7314)
- Charitable carryover character and 5-year expiry - Residue now built: per-category carryover fields and origin year (PfStandardDeductions.java:496+), vintage aging and SCHEDULE_A_CHARITY_CARRYOVER_EXPIRED (ScheduleAComputations.java:612-655). (hist L7315)

**Schedule A casualty**

- Multi-event 4684, 1033 conversion, 165(h)(5)(B) gain offset - Heading struck "BOTH VERIFIED DONE"; the mixed-path gain offset is now done by Form4684SectionA (lines 13-18 incl. 165(h)(5)(B) netting from the guided inputs), with the filed 4684 taking precedence. (hist L7318-7379)

**Schedule E deferred**

- $0-net carryforward, MFS trigger, Schedule E preview, 8582/6198 - All four bullets struck: FIXED V260, DONE V130, STALE (preview exists), BUILT V128. (hist L7385-7388)

**K-1 parked items**

- Passive vs nonpassive K-1 and section 469 - Struck "DONE 2026-07-14 (V129)". (hist L7393)
- K-1 statement semantic rework - Struck "DONE 2026-07-18"; the leftover parseAmount note is minor clean-up. (hist L7394-7399)
- K-1 MFS attribution, incl. Schedule D - Struck DONE 2026-07-14; the Schedule D residue is covered too, since all K-1 lists are now MFS-filtered up front (TaxReturnComputeService.java:4400-4416). (hist L7400)
- Other K-1 boxes (rental, guaranteed payments, 179) - Rental routed 2026-09-16; the parked items are now built too: guaranteed payments to Schedule E line 28 (TaxReturnComputeService.java:30032) and K1Section179.java feeding ScheduleEParts. (hist L7401)
- Schedule E Part II preview - form-tax-return-schedule-e.component.ts renders Part II nonpassive K-1 lines 29/32. (hist L7402)

**SQA Tier B2**

- Portable blocking families as scenarios - Marked AUTHORED 2026-07-12 (sc_00241-sc_00251). (hist L7408-7424)

**Form 8814 vs 8615**

- Suppress parent Form 8814 for a dependent_own child - Built: section 1(g)(7) mutual exclusion at TaxReturnComputeService.java:4121-4152 and KiddieTaxParentReader.java:247. (hist L7437-7447)

**Rental depreciation**

- Rental-tagged depreciation assets computed - Heading "BUILT 2026-09-02" (phases 1-3, V247). (hist L7475-7499)

**Passive K-1 at-risk**

- Passive K-1 losses through section 465 gate - Struck "FIXED 2026-09-15 (V258)". (hist L7501-7522)

**Form 8283 appraisal**

- Qualified-appraisal gate for gifts over $5,000 - Struck "FIXED 2026-09-15 (V257)". (hist L7524-7549)

**Territory exclusions**

- Pub. 570 deduction allocation for 931/933 - Struck "FIXED 2026-09-10". (hist L7556-7587)
- SE-tax deduction proration - Struck "FIXED 2026-09-16" (territorySelfEmploymentFraction). (hist L7605-7608)
- IRA deduction MAGI add-backs - Struck "VERIFIED CORRECT 2026-09-16". (hist L7615-7618)
- Form 4563 line 15 MAGI add-backs, plus Puerto Rico - Struck FIXED 2026-09-10; the Puerto Rico residue is now computed-first too (puertoRicoFigured in AdditionalDeductionsInputs.java:41 and EducationCreditsInputs.java:51). (hist L7623-7647)

**Form 8828**

- Holding-period percentage worksheet - Struck "BUILT 2026-09-11 (V248)". (hist L7649-7685)

**Form 2210-F**

- Prior-year alternative and gross non-farm income - Struck "FIXED 2026-09-16 (V259)". (hist L7687-7720)

**Section 163(j)**

- Two-way 163(j) income adjustment - Struck "FIXED 2026-09-10 (sc_00305)"; only an optional e2e re-run was suggested. (hist L7722-7768)

**Enhanced senior deduction**

- Senior deduction without opt-in - Struck "FIXED 2026-09-10"; the date-of-death limit is now handled too (age65AtDeath, Schedule1AComputations.java:877/883, A64). (hist L7770-7809)

**Form 8997**

- QOF blocker keyed on deferral codes Y/Z - Struck "FIXED 2026-09-11 (sc_00315)". (hist L7811-7844)

**ABLE 1099-QA**

- ABLE taxability and Form 5329 Part II - Struck "BUILT 2026-09-11 (V249)"; the ESA/QTP residue is marked DONE 2026-10-17 (A58). (hist L7846-7891)

**Unemployment repayment**

- Cross-year repayment to Schedule 1 line 24e - Struck "FIXED 2026-09-11". (hist L7893-7932)

**Unpersisted carryforwards**

- Rental passive loss and investment interest bridges - Struck "BOTH FIXED 2026-09-16 (V261)"; V261__rental_passive_and_investment_interest_bridges.sql. (hist L7935-7966)
