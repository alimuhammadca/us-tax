## 2026-10-16T19:00:00-04:00 - Form 5329 Part VI: the 6% additional tax on excess Archer MSA contributions (outstanding.md A10, owner-approved fields)
- IRC 4973(d); 2025 Instructions for Form 5329 Part VI (lines 34-41) and Form 8853 ("Excess Contributions You Make",
  "Excess Employer Contributions", "Deducting an Excess Contribution in a Later Year"). The excess was never measured.
- V280 pf_form_8853: archer_excess_withdrawn_by_due_date, archer_msa_year_end_value, archer_prior_year_excess_contributions
  (entity + Form8853Mapper + the Archer MSA form, Section A).
- Engine: applyArcherMsaExcessContributions (per person, end of computeForm8853) fills Form 8853's new form5329Line34..41;
  line 41 (6% of the smaller of line 40 and the year-end value, whole dollars) -> Form5329.additionalTaxOnExcessArcherMsaContributions
  (taxpayer + spouse, not the spouse on MFS) -> Schedule 2 line 8. A prior excess absorbed by unused room is added to 8853
  line 5 unless an employer contributed. Informational FORM_8853_EXCESS_ARCHER_MSA_CONTRIBUTION_<PERSON>.
- Tests: Hrb2025Sc00091Test 9 (B/C now seed the scenario's withdrawal; new: B left in 49 -> refund 1,714, C left in 57 ->
  1,568, prior excess absorbed -> line 5 1,700, year-end value 300 -> 18; the 4 new cases red with the call removed).
  Full unit suite 4,137 green. e2e archer-msa-excess-contributions-ui.spec.ts (typed on the form: 57 -> 18 -> 0). The 12 specs that check
  Form 5329, Schedule 2 line 8 or the HSA form re-run: 87 passed, 1 skipped.
- Not built: Part VI on the Form 5329 preview / out_form_5329 (Parts II, VII, IX are not there either), the 2024 line 40
  auto-import, excess employer contributions as income.
- c:/us-tax-hrb2025: sc_00091 md (values unchanged; our-app-only left-in amounts); OPEN_QUESTIONS A10 answered.

## 2026-10-16T18:10:00-04:00 - Form 8853 line 1 is read from W-2 box 12 code R (outstanding.md A9)
- 2025 Instructions for Form 8853, Employer Contributions: "These contributions should be shown in box 12 of Form W-2
  with code R"; any employer contribution means no deduction (§220(b)(5); line 5 = 0). The engine read line 1 only from
  the MSA form, so a filer who left it blank deducted their own contributions in a year none are deductible.
- computeForm8853: blank employerContributionsLine1 -> the person's W-2 box 12 code R (sumW2Box12ByCodes, SSN-matched),
  mirroring Form 8889 line 9 / code W; a typed value wins. MSA form: hint under line 1. No new field.
- Tests: Hrb2025Sc00091Test C2 (code R alone -> line 1 1,000, line 23 0, refund 1,625; red on the old engine, which
  deducted 950) and C3 (typed 600 wins). Full unit suite 4,133 green. e2e line8853-msa-ltc.spec.ts gains a code R case
  with a control. The 19 specs that touch HSA/MSA or W-2 box 12: 280 passed, 8 skipped, 1 flaky; 1 failed (a
  medicaid-waiver picker-dialog test, no compute) and passed when re-run alone.
- c:/us-tax-hrb2025: sc_00091 md note (values unchanged); OPEN_QUESTIONS A9 answered.

## 2026-10-16T17:30:00-04:00 - The QCD's date decides the age-70½ test for an owner who turns 70½ during 2025 (outstanding.md A3, owner-approved field)
- IRC 408(d)(8)(B)(ii): a QCD is a distribution "made on or after the date that the individual ... has attained age
  70½" (Pub. 590-B: "You must be at least age 70½ when the distribution is made"). Without a date the engine could only
  reject an owner under 70½ all year; one turning 70½ mid-year was always accepted.
- V279 `pf_ira_income.qcd_distribution_date` (entity + IraIncomeMapper). UI (taxpayer + spouse IRA forms): "Date of the
  transfer to charity", shown when the owner's 70½ date falls in 2025 or the DOB is unknown, with the 70½ date in a hint.
- Engine (withoutQcdIfUnder70Half): 70½ inside 2025 -> a date before it drops the QCD (informational
  QCD_MADE_BEFORE_AGE_70_HALF_<ROLE>), a missing / out-of-year date is blocking (QCD_DATE_NEEDED_OWNER_TURNS_70_HALF_IN_YEAR_<ROLE>);
  70½ on or before 1 January -> unchanged (qualifies); after 31 December -> unchanged (no QCD).
- Tests: Hrb2025Sc00062Test D-G (DOB 01/20/1955: 09/01 excluded, 05/01 taxable, blank blocks, 07/20 itself excluded; E and F
  red on the old engine). Full unit suite 4,131 green. e2e qcd-distribution-date-ui.spec.ts (2 passed); the 13 specs that use the IRA forms re-run: 108 passed, 1 flaky (a W-2 code-D catch-up test, no QCD: compute timed out once, passed on retry).
- c:/us-tax-hrb2025: sc_00062 md note (values unchanged); OPEN_QUESTIONS A3 answered.

## 2026-10-16T16:30:00-04:00 - The rental at-risk (§465) carryover is entered and released per property (outstanding.md A49 + B22, owner-approved field)
- IRC 465(a)(2): a loss disallowed by the at-risk rules "shall be treated as a deduction allocable to such activity in the
  first succeeding taxable year". The carryover was one form-level amount released against the room of every property
  together - a carryover from a property at its limit was deducted against another property's room, and a property with
  a blank (fully at risk) amount released nothing (B22).
- V278 `pf_rental_property.prior_year_at_risk_carryforward` (entity + RentalIncomeMapper); the migration moves a
  one-property form's form-level amount onto the property. UI: "Prior-year at-risk loss carried over (Form 6198)" on each
  property; the form-level input removed (its value still round-trips for the several-property case).
- Engine (computeRentalScheduleE): per property, released = min(carryover, room), room = atRisk + net (>= 0), blank
  atRisk = all; the released amount reduces the property's net, so it follows the property through §469. The form-level
  amount / last year's imported total goes to the only §465 activity (a property, or a lone Form 4835 farm rental via
  the old headroom path), else it is carried forward with the informational RENTAL_AT_RISK_CARRYOVER_NOT_ASSIGNED_TO_A_PROPERTY.
  A per-property entry wins over it.
- Tests: new RentalAtRiskPerPropertyTest (5; all 5 red on the old engine). Hrb2025Sc00279Test uses the per-property field
  (values unchanged); Sc00279SqaScenarioTest keeps the form-level path (one property). Full unit suite 4,127 green.
  e2e: new rental-at-risk-per-property-ui.spec.ts (typed on the form: on house A -> (9,000), carried 10,000; on house B
  -> (19,000), 0); rental-at-risk-carryforward-bridge.spec.ts gains a two-rental import case; all 23 rental-form specs re-run: 59 passed, 1 skipped.
- c:/us-tax-hrb2025: sc_00279 md note (values unchanged); OPEN_QUESTIONS A49 and B22 answered.

## 2026-10-16T18:20:00-04:00 - A rental sold to a related buyer no longer frees its suspended passive losses (outstanding.md A6, owner-approved field)
- Source: IRC 469 text saved to c:/us-tax-hrb2025/_tools/irs_text/irc_469.txt (law.cornell.edu). 469(g)(1)(B): "If the
  taxpayer and the person acquiring the interest bear a relationship to each other described in section 267(b) or section
  707(b)(1), then subparagraph (A) shall not apply to any loss of the taxpayer until the taxable year in which such
  interest is acquired ... by another person who does not bear such a relationship". Pub. 925 (2025) and Lasser 2025
  section 11.13 say the same.
- V277 `pf_rental_property.sold_to_related_party`; entity + RentalIncomeMapper. UI: "Was the buyer related to you?"
  (No / Yes, with a hint listing related persons) under "Sold / fully disposed".
- Engine: isQualifyingDisposition(p) = sold AND not to a related buyer; used by the rental-pool release (anyDisposed) and
  the A5 exception-property release. Informational note RENTAL_SOLD_TO_RELATED_PARTY_LOSSES_STAY_SUSPENDED.
- Tests: Hrb2025Sc00072Test Run C (sold to his brother -> 0 allowed, 22,000 carried, refund 1,745) - previously
  unpinnable; RentalActivityTypeTest G (short-term property sold to a related buyer -> 45,000 carried). Mutation check:
  ignoring the answer reddens both. Unit suite 3,182 green. e2e rental-material-participation-no-ui.spec.ts gains a
  related-buyer UI case (related -> AGI 90,000; unrelated -> -22,000, AGI 68,000): 3 passed. UI build green.
- c:/us-tax-hrb2025: sc_00072 md note (values unchanged); OPEN_QUESTIONS A6 answered. Checked every rental-sale scenario:
  only sc_00072 involves a passive-loss release (sc_00239 is an installment sale of land - unrelated).

## 2026-10-16T17:10:00-04:00 - Rental passive rules: a non-professional's material participation no longer makes a long-term rental nonpassive; the 7-day (and other Pub. 925) exceptions (outstanding.md A5, owner-approved field); new scenario sc_00391
- V276 `pf_rental_property.rental_activity_type` (LONG_TERM default / AVG_7_DAYS_OR_LESS / AVG_30_DAYS_SERVICES /
  EXTRAORDINARY_SERVICES / OTHER_EXCEPTION); entity + RentalIncomeMapper. UI: "What kind of rental is this?" radio above
  the material-participation question; its hint reworded.
- Engine (computeRentalScheduleE): long-term rental real estate is nonpassive only for a real estate professional who
  did not answer No (IRC 469(c)(2), (c)(7); Pub. 925). Before, ANY Yes made a rental nonpassive - a non-professional's
  long-term rental loss was deducted in full. Now it stays passive with the note
  RENTAL_MATERIAL_PARTICIPATION_DOES_NOT_MAKE_NONPASSIVE. An exception property (not a rental activity) is nonpassive only
  with material participation; passive, it joins "other passive" (Form 8582 line 2) with NO $25,000 allowance (469(i);
  Lasser 2025 section 11.2); on a full sale it releases its own current + prior losses (469(g)). Royalties unchanged.
- Tests: new RentalActivityTypeTest (6 cases; mutation-checked: old any-Yes rule -> 1 red, exception loss in the
  allowance pool -> 3 red, no sale release -> 1 red). Hrb2025Sc00075Test Run B now seeds her true answer (Yes) -> still
  10,000 allowed. Unit suite 3,177 + sc_00391's 3 = 3,180 green. e2e: rental-material-participation-no-ui.spec.ts gains a
  rental-type case (UI: long-term + Yes -> -10,000; 7 days + Yes -> -40,000), 2 passed; 10 rental-related specs re-run,
  37 passed.
- c:/us-tax-hrb2025: new sc_00391 (cabin, loss 20,000, W-2 120,000: A monthly guests -> -15,000 refund 5,445; B 5-day
  guests + 600 hours -> -20,000 refund 6,545; C 5-day guests, 80 hours -> 0, refund 2,133; 18 checks; H&R Block's
  rb_SevenDays / rb_MatParticSevenDay screens) + Hrb2025Sc00391Test. sc_00075 md note; OPEN_QUESTIONS A5 answered.

## 2026-10-16T16:20:00-04:00 - Seven SE-era personal forms now show saved data (outstanding.md E0, owner-approved)
- us-tax-ui: form-business-income, form-depreciation-asset, form-farm-income, form-farm-rental, form-home-office-actual,
  form-se-deductions, form-se-tax-options set their model in an async ngOnInit in the zoneless app without
  ChangeDetectorRef.markForCheck(), so a reopened form looked empty although the data was saved and computed (the same
  defect fixed in the rental form with A4). Each now marks for check after load and after save. `npm run build` green.
- New e2e personal-forms-show-saved-data.spec.ts: one case per form - save through the API, reload, open the form, read
  the saved number out of its input. 7 passed; with the fix stashed all 7 failed. rental-material-participation-no-ui
  re-run, passed. No compute change, so no test scenario values move.

## 2026-10-16T16:10:00-04:00 - Rental material participation: Yes and No (outstanding.md A4, owner-approved); the rental form now shows saved data
- us-tax-ui form-rental-income: the per-property "Materially participate (activity is nonpassive)" single radio became
  the question "Did you materially participate in this rental (e.g. more than 500 hours in 2025)?" with Yes / No, plus a
  hint (No keeps a real estate professional's rental passive). Same materialParticipation field; the engine already
  honoured an explicit false (sc_00075 fix 97b29cd2).
- Defect found while verifying it in the browser: the rental form never displayed saved data. It sets its model in an
  async ngOnInit in a zoneless app without ChangeDetectorRef.markForCheck() (dev mode threw NG0100); proven pre-existing by
  re-running with the pre-A1 component. Fixed (markForCheck after load and after save). Seven other SE-era personal forms
  share the pattern - recorded in outstanding.md E0 for the owner.
- New e2e rental-material-participation-no-ui.spec.ts: seeds a rental, opens the form, answers No -> stored false, then
  Yes -> stored true (1 passed). `npm run build` green.
- c:/us-tax-hrb2025: sc_00075 md note; OPEN_QUESTIONS A4 answered. us-tax-be: Hrb2025Sc00075Test comment.

## 2026-10-16T15:00:00-04:00 - Royalty cost depletion and the bonus add-back (outstanding.md B59, owner-approved fields)
- Sources downloaded and kept in c:/us-tax-hrb2025/_tools/irs_text (commit 8a00f5c): Pub. 535 (2022, the last edition with
  the depletion chapter) and Treas. Reg. 1.611-2, 1.612-3, 1.613-2, 1.613A-3 (eCFR).
- V275: seven pf_rental_property columns - advance_royalties (part of the A2 amount; the rest is bonus),
  mineral_adjusted_basis, royalties_expected_over_lease, units_paid_for_in_year, units_remaining_end_of_year,
  lease_ended_without_production, prior_depletion_to_restore. Entity + RentalIncomeMapper. The owner chose the extra
  advance-royalty field because Reg. 1.612-3 depletes a bonus (basis x bonus / (bonus + royalties expected)) and an
  advance royalty (per unit) differently.
- Compute (royalty branch, depletion left blank): cost = bonus part + units part (basis left after the bonus /
  (units remaining + units sold) x units sold); the larger of cost and the capped 15% is deducted (Pub. 535: "use the
  method that gives you the larger deduction"). A lease ended before production returns the earlier depletion as income
  on Schedule E line 4 (Reg. 1.612-3(a)(2)/(b)(2)), outside the percentage base. Flags ROYALTY_DEPLETION_METHOD
  (informational: both figures + year-end basis) and ROYALTY_ADVANCE_ROYALTIES_EXCEED_BONUS_FIELD (blocking).
- UI: the advance-royalty field under the A2 field; a "Cost depletion" block (shown while Depletion is blank) and the
  lease-ended checkbox + amount. `npm run build` green.
- Tests: new RoyaltyCostDepletionTest (8 cases incl. the regulation's own 21,000 / 10,000 / 20,000 -> 7,000 example);
  mutation-checked (percentage always -> 4 red; units on the pre-bonus basis -> 1 red; add-back dropped -> 1 red). Unit
  suite 3,167 green. e2e royalty-lease-bonus-depletion.spec.ts + a cost-depletion round-trip case, and
  rental-annual-totals-split: 5 passed.
- c:/us-tax-hrb2025: sc_00066 md note (values unchanged, no xlsx rebuilt); OPEN_QUESTIONS B59 answered.

## 2026-10-16T14:10:00-04:00 - Royalty lease bonus / advance royalties kept out of percentage depletion (outstanding.md A2, owner-approved field)
- New royalty-property field on the Rental income form: "Of that, lease bonuses and advance royalties (amounts paid
  whether or not anything is produced)". Column `pf_rental_property.lease_bonus_and_advance_royalties` (V274), entity +
  RentalIncomeMapper. Depletion label reworded ("... of production royalties").
- Compute (royalty branch of the Schedule E loop): line 4 keeps the full royalties; the automatic 15% and the section
  613(a) 100%-of-property-income limit use royalties - bonus (IRC 613A(d)(5); J.K. Lasser 2025 section 10.15). A typed
  depletion still wins. Bonus > royalties -> blocking flag ROYALTY_LEASE_BONUS_EXCEEDS_ROYALTIES.
- Tests: Hrb2025Sc00066Test + Run B2 (bonus field -> 3,000, owe 275), a bonus-only property (no depletion, refund
  3,445), the bonus kept out of the 100% limit (1,500, refund 3,245) and the flag. Mutation-checked (15% of all
  royalties -> B2 red; limit on all royalties -> the limit test red). Unit suite 3,159 green. New e2e
  royalty-lease-bonus-depletion.spec.ts 2 passed; rental-annual-totals-split + rental-199a-safe-harbor re-run, passed.
- c:/us-tax-hrb2025: sc_00066 md note updated (values unchanged, no xlsx rebuilt); OPEN_QUESTIONS A2 answered, B59
  added. outstanding.md: A2 done; B59 (cost depletion of a bonus, recapture when the lease ends unproduced).

## 2026-10-16T13:45:00-04:00 - Rental expenses entered as whole-year totals, split by days (outstanding.md A1, owner-approved field)
- New per-property field on the Rental income form: "How did you enter the expenses above?" - Rental share only (default,
  the old meaning) / Whole-year totals - split them for me. Shown once personal-use days > 0. Column
  `pf_rental_property.expenses_entered_as` (V273), entity + RentalIncomeMapper.
- Compute `applyRentalAnnualTotalsSplit` (TaxReturnComputeService, run in prepare() before any reader of the rental or
  deductions forms): Pub. 527 (2025) ch. 5 "Dividing Expenses" / Worksheet 5-1 line F - each shared expense line, typed
  depreciation and the AMT personal-property figures become rental days / (rental + personal days) of the total;
  advertising, commissions and management fees stay wholly rental (Worksheet 5-1 instructions, line 2d). Personal real
  estate taxes -> Schedule A line 5b; personal mortgage interest -> line 8a only for a qualified residence (used as a
  home, or rented under 15 days; section 163(h)(4)(A)(iii)), added to the filer's own interest so the Pub. 936 limit
  applies to the total. Under 15 rental days (section 280A(g)) every interest and tax dollar is personal. MFS: the
  spouse's form stays on the spouse's leg. Informational flag RENTAL_EXPENSES_SPLIT_BY_DAYS.
- UI: the radio and a hint on the rental form; the Deductions form's mortgage-interest and real-estate-tax "Where to find
  this" notes now say to leave such a home's figures out there. `npm run build` green.
- Tests: new RentalAnnualTotalsSplitTest (5 runs; mutation-checked - disabling the split reddens 4, splitting
  advertising reddens 1); whole-year-totals variants added to Hrb2025Sc00065Test, Sc00068Test, Sc00327Test (each
  reproduces the pre-split return). Unit suite (TaxReturnComputeServiceTest + Sc*SqaScenarioTest + Hrb2025*Test + the new class) 3,155 green. New e2e rental-annual-totals-split.spec.ts (2 passed);
  rental-199a-safe-harbor + mfs-spouse-rental-income re-run, 3 passed.
- c:/us-tax-hrb2025: sc_00065 / 00068 / 00327 md notes updated (expected values unchanged, no xlsx rebuilt);
  OPEN_QUESTIONS.txt A1 answered, B57-B58 added. outstanding.md: A1 done; B57 (Worksheet 5-1 line 4b/4c for a
  standard-deduction filer) and B58 (operating-expense carryover not tracked) recorded.

## 2026-10-16T06:20:00-04:00 - Round-2 QA scenarios sc_00381-00390 (the Schedule 1-A stack beside Schedule A and before QBI, a multiple support agreement and HOH, the parent-grandparent tiebreaker, the custodial parent after Form 8332 and credit ordering, a section 1291 fund, a BBA push-out, SEHI beside a Marketplace plan, Pub. 590-A Appendix B, the charitable ceiling before QBI, notary fees on Schedule SE and the EIC) - the last batch of the owner's range sc_00041-00390
- c:/us-tax-hrb2025: sc_00381-00390 written (md + xlsx, 91 checks, 30 runs), reshaped except 388/389 (extended). 381 (each deduction is graded elsewhere ->
  beside itemized 22,000, refund 6,734; before the QBI limit, 1,050 not 1,600); 382 (MSA parent + her rent -> still Single 633; over half her support ->
  HOH 4,122); 383 (round 1 graded only the parent's return -> the grandmother's: higher AGI claims, 3,125; equal AGI cannot, 925); 384 (noncustodial leg
  = sc_00010 -> no release, CTC after the 630 dependent-care credit, 1,235 + ACTC 965, 4,309; no daycare 3,679); 385 (round 1 split 10,000 a year ->
  by days 9,993 / 1291TAX 11,103, not graded - no Form 8621 in H&R Block; first-year rule, owe 4,667; exactly 125%, nonexcess, 2,533); 386 (no Form
  8986 date -> furnished 01/05/2026, nothing in 2025, 2,333; negative line 14 on 6l, line 16 22,667; A not graded); 387 (round 1 graded one of two
  legal Pub. 974 answers -> A's SEHI/PTC not graded; PTC zero at 123,700, SEHI 9,000, owe 28,271; employer plan from 06/30, 3,750, owe 29,927); 388
  (B: Appendix B gives 1,880 where a self-consistent deduction gives 5,880, refund 252; not covered, 8,000, 2,738); 389 (gift under the ceiling 3,881;
  a SEP moves the base and QBI, 71,642 / 1,552, 2,183); 390 (round 1 missed a 289 EIC - refund 457 not 168; its whole-dollar point is a convention,
  not graded; 4,000 of notary fees: SE 1,766, EIC 266, refund 1,000; all notary: no SE, no EIC, 2,439). New text in _tools/irs_text: i8621.txt,
  i8978.txt (PDFs deleted), f8621.txt, f8978.txt, i1040gi_2023.txt. Correction: the sc_00386 md first said Lasser has no BBA section - ¶12.13 is
  one (da524ce; its commit 8749fa0 named no figure that changed).
- us-tax-be: one engine fix, mutation-checked: fa03a3b4 (notary profit taken out of EIC earned income as well as the SE base - EIC Worksheet B; an
  all-notary 16,500 had EIC 197). Pin tests Hrb2025Sc00381-00390Test (30 tests, ed4af841); no run left unpinned (382 B and 383 C pin the user's
  choice - the engine has no MSA / tiebreaker inputs; 387 B/C pin with the Marketplace flag off). No unit-test pin changed; no e2e spec changed (the
  notary spec se-clergy-notary-optional.spec.ts asserts SE tax only). Gate (TaxReturnComputeServiceTest 1,170, Sc*SqaScenarioTest 650,
  Hrb2025*Test 1,327) from a freshly deleted surefire-reports directory: 3,147 green.
- Open (owner): outstanding.md A84-A87 (multiple support agreement, tiebreaker inputs, Form 8621 Part V, SEHI months of employer-plan
  eligibility), B52-B54 (1291TAX at a flat 37%, the negative Form 8978 worksheets, the SEHI/PTC coordination gated on a flag labelled "with advance
  premium tax credit" - a no-APTC filer answering literally gets SEHI 9,000 and PTC 2,652).

## 2026-10-16T23:00:00-04:00 - Round-2 QA scenarios sc_00371-00380 (Form 8960 Part II, the NIIT MAGI add-back, net tax-exempt interest in the Social Security worksheet, railroad retirement and the Simplified Method, the 110% safe harbor and catch-up payments, a retiree's penalty and waiver, tips, overtime, car-loan interest and the senior deduction on joint returns)
- c:/us-tax-hrb2025: sc_00371-00380 written (md + xlsx, 100 checks, 30 runs - sc_00376 A's penalty and owe not graded), all reshaped. 371 (round 1
  typed 8,000 for its own ratable method -> 8,235, NIIT 2,803; round 1 left out W-2 box 6's 0.9% -> line 25c 360, refund 3,063; Texas sales tax
  allocates nothing, 3,116; standard deduction, no line 9a, 3,420); 372 (round 1's H&R Block run never excluded the salary -> Form 2555 forms mode
  with line 42 / AGI as entry checks; the housing exclusion is not added back, MAGI 300,000, 3,800 not 4,150; MAGI exactly 200,000, none); 373
  (sc_00245/00196 already cover tax-exempt interest and the cap -> box 13 premium nets line 2a, 6b 18,100; provisional exactly 34,000, 4,500);
  374 (round 1 only stipulated box 3 away -> box 3 42,000 + Simplified Method 2,400, 5b 21,600, 6b 5,860; age at start 60 -> 310, 5b 22,200);
  375 (sc_00146/00187 cover the 110% line -> December withholding counts evenly, penalty 0; a January estimate still costs 40); 376 (round 1
  graded a waiver H&R Block cannot request -> box A documented; retired at 61, 163; 90% of 2025 binding, 184); 377 (box 7 capped at the wage
  base -> Forms 4070 total, 21,000; one 25,000 joint cap, 25,000); 378 (double time -> FLSA half 7,500, 6,000; one joint cap, 20,000); 379
  (one 10,000 limit for a joint return, 10,000; used truck, 0); 380 (joint MAGI exactly 150,000, 12,000; line 35 once per spouse, 6,000). New
  IRS text: _tools/irs_text/p575.txt (2025 Pub. 575; PDF not kept).
- us-tax-be: one engine fix, mutation-checked: 51779d92 (RRB-1099-R box 4 stays fully taxable when box 3 is typed and no Simplified Method /
  General Rule worksheet is run - it was dropped entirely, sc_00374 B line 5b 4,000 instead of 24,000). Pin tests Hrb2025Sc00371-00380Test
  (31 tests incl. the 374 no-worksheet control; 374 in 51779d92, the rest in 54b25db4); no run left unpinned. No unit-test pin changed. e2e
  changed, not run: line5abc-pension-withdrawals.spec.ts GAP A4.3 (taxable 800 -> 1,800, line 5a 1,800 -> blank). Gate
  (TaxReturnComputeServiceTest 1,170, Sc*SqaScenarioTest 650, Hrb2025*Test 1,297) from a freshly deleted surefire-reports directory: 3,117 green.
- Open (owner): outstanding.md A81-A83 (Forms 4070 tips total, overtime pay-stub inputs, RRB box 3 not read into the Simplified Method), B48-B51
  (Form 8960 line 9b ungated, the Simplified Method on the whole gross, a used vehicle blocking, Doha missing from the Notice 2025-16 list).

## 2026-10-16T18:00:00-04:00 - Round-2 QA scenarios sc_00361-00370 (the QPRI ordering rule, a section 7872 gift loan, a professional gambler and section 165(d), the conservation-easement ceiling, a bargain sale to charity, pre-2017 mortgage debt, a medical home improvement, Form 4952 and the gain's character, the NIIT on an S corporation owner, the NIIT on a partnership-interest sale)
- c:/us-tax-hrb2025: sc_00361-00370 written (md + xlsx, 124 checks, 30 runs), all reshaped. 361 (round 1's loan was all purchase money and
  its H&R Block run typed the taxable 0 -> H&R Block's own QPRI screens and the section 108(h)(4) ordering rule: 40,000 cash-out canceled
  first, 20,000 excluded, owe 8,398; 60,000 cash-out, none, owe 12,798); 362 (round 1 used an "illustrative" 4% AFR -> the Rev. Rul.
  2025-13 blended rate 4.22%, 8,440, owe 2,093; the section 7872(d)(1) cap at 100,000: NII 1,000 treated as zero, owe 67; capped at
  2,500, owe 667); 363 (round 1's gambler won -> the 165(d) cap: wagers over winnings and, for 2018-2025, expenses with them, Schedule C 0,
  refund 50,000; H&R Block does not cap - its FAQ says trim by hand; A's expenses 20,500 so Schedule SE rounds one way; round 1's 136,522
  was 136,523); 364 (the QCC 50% ceiling vs the same land outright at 30%, 60,000, refund 3,553; QCC after 40,000 of cash, 60,000, refund
  13,086; two 75,000 items for H&R Block's six-figure refusal); 365 (bargain sale at the basis still gains 24,000 and hits 30%, 52,200,
  refund 9,964; short-term gift part at basis 16,000, owe 3,647); 366 (round 1 omitted Form 8959 - refund 8,426 -> 7,976, H&R Block's
  figure; Washington -> Oregon; sc_00107 already covers 750,000 vs 1,000,000 -> 1,250,000 prorated 0.800, refund 7,256; old + new debt
  share one 750,000 limit, refund 5,096); 367 (Pub. 502 Worksheet A: value added equal to cost leaves nothing and the standard
  deduction wins, refund 3,102; accessibility work in full, refund 7,172); 368 (the election is sc_00111 -> a short-term gain is line 4f
  investment income without election, refund 3,353; then elect 15,000 of dividends, refund 5,603; round 1's H&R Block "no election"
  was a missed checklist item; Boston -> Nashua NH); 369 (round 1's contrast 3,230 skipped the smaller-of -> passive owner 2,850; K-1
  box 4 interest is NII for an active owner, 1,140); 370 (round 1's contrast 7,790 and line 5b -> passive partner 4,750 on line 5c's
  absence; all-business deemed sale, 190, refund 743). New text in _tools/irs_text: usc7872.txt, rr2025_13.txt, usc165d.txt (with the 2025
  wording), i1120ssk.txt (PDFs not kept). Correction: the sc_00366 commit (9e11433) says 14 checks - its spreadsheet has 11 (noted in
  the sc_00367 commit 5c7571c).
- us-tax-be: one engine fix, mutation-checked: 239c53a8 (Schedule K-1 portfolio interest - 1065 box 5, 1120-S box 4, 1041 box 1 -
  reaches Schedule B / line 2b and so Form 8960 line 1; it was stored and never read). Pin tests Hrb2025Sc00361-00370Test (30 tests,
  7e114077); no run left unpinned. No unit-test pin changed. Gate (TaxReturnComputeServiceTest 1,170, Sc*SqaScenarioTest 650,
  Hrb2025*Test 1,266) from a freshly deleted surefire-reports directory: 3,086 green. No e2e spec changed (none pins K-1 interest in a
  computed return; statement-mapper-roundtrip.spec.ts only round-trips the 1041 box 1 field).
- Open (owner): outstanding.md A75-A80 (QPRI ordering-rule inputs, section 7872, bargain sale, Pub. 502 Worksheet A, two mortgage
  vintages, Form 8960 line 5c unchecked against participation), B45-B47 (Form 4952 line 4e defaulting to 4d; K-1 dividends, royalties and
  portfolio gains still unrouted; Table 1 rounding).

## 2026-10-16T13:00:00-04:00 - Round-2 QA scenarios sc_00351-00360 (Schedule 8812 Part II-B line 22, the residential clean energy credit after section 25C and with a 2024 carryforward, the refundable AOTC bar, credit ordering and the 1,700 ACTC cap, Schedule SE optional methods and the EIC, church employee income, section 179 recapture, section 280F listed-property recapture, the state refund worksheet, insolvency and attribute reduction)
- c:/us-tax-hrb2025: sc_00351-00360 written (md + xlsx, 116 checks, 30 runs - sc_00355 A not graded). Reshaped: 351 (Part II-B on W-2 boxes
  4+6 is sc_00191 -> line 22: 252 + the 92 Form 4137 tax = 344 beats 300, refund 252; a 3,000 Schedule C's 212 half-SE, ACTC 212, owe 212);
  352 (the carryforward TO 2026 is sc_00138 -> the 2024 carryforward on line 12: 9,000 used, refund 11,286; 9,000 + 9,000 new, 15,714 used,
  2,286 to 2026; H&R Block's 25D-before-25C finding kept on 5a/5b); 355 (H&R Block has no nonfarm optional election -> A hand-worked and not
  graded; regular method owe 477; the farm optional method beside a Schedule C, owe 1,414); 357 (round 1's camera rig is listed property ->
  non-listed workstation, Table A-1 through the recapture year: 40% 4,032, 51% none, 50% 3,840); 359 (the SALT cap is sc_00076 -> line 2 on all
  of 5d: property tax makes a 2,000 refund untaxed; line 6 blind add-on: 450); 360 (the insolvency cap is sc_00079 -> attributes cut after the
  2025 tax: a 6,000 carryover still deducts 3,000, owe 347, Form 982 line 9 3,000; 40,000 -> 25,000 cut, 12,000 to 2026). Kept and extended:
  353 (AOTC bar: age 24 and a joint return both get 1,000 refundable, refund 2,900); 354 (round 1 omitted a 2,462 EIC - refund 2,700 -> 5,162;
  the 1,700 cap takes 500, 62, then nothing as credits come off); 356 (church income beside a 420 / 450 Schedule C: SE 3,956 / 4,020); 358
  (round 1 omitted the drop year's ADS 2,700; 52% keeps MACRS 1,797; 0% is round 1's own 38,049). New IRS text: _tools/irs_text/
  f1040sse_2025.txt (the existing fschse.txt is the 2024 form; PDF not kept).
- us-tax-be: two engine fixes, each mutation-checked: ba8faade (Schedule 8812 line 22 reads Schedule 2 lines 5, 6, 13 - it read 6, 13 and 11,
  dropping Form 4137 and double-counting Additional Medicare Tax), 880103b4 (QBI no longer charges a Schedule C with the church-employee
  share of the half-SE deduction). Pin tests Hrb2025Sc00351-00360Test (30 tests, bea4a2bf); no run left unpinned. No unit-test pin changed.
  Gate (TaxReturnComputeServiceTest 1,170, Sc*SqaScenarioTest 650, Hrb2025*Test 1,236) from a freshly deleted surefire-reports directory:
  3,056 green. No e2e spec changed (none pins Part II-B line 22 or a church + Schedule C QBI; line28-actc-schedule8812.spec.ts has only a
  mislabelled comment, recorded in outstanding E).
- Open (owner): outstanding.md A73-A74 (Form 4797 Part IV line 34 typed, not derived; Form 982 line 10a never computed), B42-B44 (refund
  worksheet blank 2024 standard deduction read as 0; SE retirement/health ceilings still net church half-SE; AOTC bar not cross-checked
  against the DOB).

## 2026-10-16T02:15:00-04:00 - Round-2 QA scenarios sc_00341-00350 (inherited IRA and the spouse who treats it as own, SEPP exception, Roth ordering and conversion recapture, one IRA rollover a year, Form 1116 foreign qualified dividends, the no-Form-1116 election at 300, Form 2555 housing exclusion, FEIE with Form 1116, the high-tax kickout, ACTC earned income)
- c:/us-tax-hrb2025: sc_00341-00350 written (md + xlsx, 97 checks, 30 runs). Reshaped: 341 (duplicated round-2 sc_00080 C -> code 4 kept
  as A; the surviving spouse who treated the IRA as his own owes the 10%, 4,000; kept as an inherited IRA, none); 345 (duplicated sc_00282 ->
  foreign qualified dividends and the Form 1116 adjustment exception: 19,900 credit 2,813; 20,000 x 0.4054, credit 1,016; QDCG line 5 over
  197,300, credit 1,418); 350 (duplicated sc_00134 -> what is ACTC earned income: Schedule C profit less half SE tax 2,134; a business loss
  1,725). Kept and extended: 342 (SEPP only for the series: another IRA's 6,000 owes 600; an employer plan before separation owes 3,000);
  343 (Roth ordering: 2022 conversion recapture 1,500; a 2020 conversion is outside "2021 through 2025", 500; a draw inside the basis owes
  800 with nothing taxable; H&R Block's Form 8606 topic has the Roth basis / Recapture screens round 1 never reached); 344 (one IRA
  rollover per 1-year period from RECEIPT: 04/15/2025 taxed + 10% refund 1,133 - H&R Block expected to FAIL, it ignores its own question;
  05/15/2025 valid 17,645; a 401(k) rollover unlimited 27,645); 346 (exactly 300 still unlimited 300 against a 276 limit; 301 -> 276);
  347 (housing over the Notice 2025-16 Abu Dhabi limit 49,687 -> 28,887; FEIE limited to salary less housing; moved from Muscat to Abu
  Dhabi); 348 (the line-12 reduction 26,000; the limit binding after it, 21,576; no exclusion 45,623); 349 (carryover 7,322, not round 1's
  7,323; the high-tax kickout beside untaxed passive interest 5,150 vs 9,000 at 30%). New IRS text in _tools/irs_text: Notice 2025-16
  (n2025_16.txt, n2025_16_raw.txt; PDF not kept).
- us-tax-be: two engine fixes, each mutation-checked: a5b15d42 (code-J Roth earnings, Form 8606 line 25c, now carry the 10% on Form 5329
  line 1), 8ae3da1e (the Form 1116 high-tax kickout reads the per-type tax columns q-t, as line 8 does). Pin tests Hrb2025Sc00341-00350Test
  (30 tests, 78177f71); not pinned: sc_00343 A/C 10% (no conversion-year input), sc_00345 B/C credit (no foreign-QD adjustment). No
  unit-test pin changed. Gate (TaxReturnComputeServiceTest 1,170, Sc*SqaScenarioTest 650, Hrb2025*Test 1,206) from a freshly deleted
  surefire-reports directory: 3,026 green. No e2e spec changed (none pins a code-J 10% or a kickout with the per-type columns).
- Open (owner): outstanding.md A69-A72 (Roth conversion year/taxable part; per-1099-R 10% exceptions and separation from service; rollover
  dates; foreign-employer wages without the exclusion), B39-B41 (Form 1116 foreign-QD adjustment; Notice 2025-16 locality list; the
  high-tax test's expense allocation).

## 2026-10-16T09:30:00-04:00 - Round-2 QA scenarios sc_00331-00340 (QSBS 75% vs 100%, installment sale of section 1245 property, section 1259 constructive sale, AMT exemption phase-out ends, Form 6251 Part III bands, ISO later-year sale, AMT foreign tax credit, ATNOLD, backdoor Roth pro rata, NUA and the 10%)
- c:/us-tax-hrb2025: sc_00331-00340 written (md + xlsx, 108 checks, 30 runs - sc_00338 A graded on the regular tax only). Reshaped: 340
  (duplicated round-2 sc_00259 -> the 10% early-distribution tax only on box 2a in an NUA lump sum (2,000, not 10,000) and a non-lump-sum NUA
  taxed with its 10% (owe 29,067)); 338 (H&R Block's ATNOL box refuses 3,000,000 and the 90% cap cannot bind with AMT due below ~792,900 ->
  round 1 kept as A, graded on the regular tax only; B/C grade the line 2e add-back and the separate ATNOLD: AMT 45,883 / 34,627). Kept and
  extended: 331 (round 1's 2,000,000 adjustment blocked by the six-figure refusal -> gain 96,000: 09/28/2010 all excluded 25,067; 09/27/2010
  75%, the 24,000 included is 28% rate gain 30,827; at the 28% ceiling 46,065); 332 (round 1 owe 967 kept; Form 6252 in forms mode; gain under
  the depreciation, no 6252, refund 2,933; no 2025 payment, recapture still taxed, refund 533); 333 (round 1's 26,249 -> Tax Table 26,255; short
  closed 01/30/2026 -> no 2025 sale 11,255; a lot under a year -> short-term 34,667); 334 (round 1 A; AMTI exactly 626,350 -> full exemption, AMT
  24,393; 1,000,350 -> exemption 0, AMT 101,281); 335 (round 1's 78,513 -> 78,516; ordinary AMT base over 239,100 at 28%, AMT 61,112; the whole
  96,700 zero band in the AMT, AMT 24,405); 336 (round 1's TMT 1,027 -> 7,994; PAB 100,000 makes the refigured gain decide the AMT 7,739; a sale
  at 60 - the 3,000 AMT loss limit, line 2k -43,000, AMT 8,459; exercise moved to 2023 so no 2024 AMT credit reaches 2025); 337 (four wrong
  round-1 figures and two mixed numerators -> exact fractions: no election 15,477, election 14,692, tax under both limits 15,000); 339 (round 1
  refund 2,621 kept; Form 8606 line 6 in forms mode; rolled into the 401(k) before year end -> tax-free 4,133; 21,000 left -> 5,250 taxable).
  No IRS PDF downloaded (all text already in _tools/irs_text).
- us-tax-be: one engine fix, mutation-checked: 09bd4733 (a Form 4797 Part III property that is also on Form 6252 no longer puts its section
  1231 remainder on Schedule D - Form 6252 line 12 instructions; a one-argument overload kept for the reflection test). Pin tests
  Hrb2025Sc00331-00340Test (30 tests, 814a1baa). No unit-test pin changed. Gate (TaxReturnComputeServiceTest 1,170, Sc*SqaScenarioTest 650,
  Hrb2025*Test 1,176) from a freshly deleted surefire-reports directory: 2,996 green. No e2e spec changed (form4797-installment-likekind.spec.ts
  tests the advisory through Form 8824, not 6252).
- Slips: sc_00333's commit (adac0cf) says 10 checks; the spreadsheet has 9 - corrected in an empty commit 4d55517.
- Open (owner): outstanding.md A66-A68 (section 1202 fields and percentage; no section 1259 input; ISO AMT basis per lot) and B37-B38 (the
  4797/6252 date match and installment section 1250; a code-G IRA rollover on Form 8606 line 7).

## 2026-10-16T00:20:00-04:00 - Round-2 QA scenarios sc_00321-00330 (1099-PATR on Schedule F, Social Security repaid more than received, PTC year-of-marriage Part V, mid-quarter convention, decedent's final return, Schedule C line 36, section 280A(g), excess deferrals Roth and corrective, unrecaptured 1250 under and over 197,300, 1250 and 28% slices together)
- c:/us-tax-hrb2025: sc_00321-00330 written (md + xlsx, 108 checks, 28 graded runs - sc_00323 B fill-if-forms-mode). Reshaped: 321 (two bare rows
  -> a Schedule F return: line 3b 5,000 / 3,800 with 1,200 personal propane and fuel on 3a only / 11,000 with per-unit retains; box 4 on 25b);
  322 (three of our own hard blocks -> a single filer's negative box 5: 6b 0, a 2,500 net repayment not deductible, 5,000 -> the section 1341
  credit 838 beats the deduction (credit not graded - H&R Block has no route)); 323 (our advisory + a capped fixture -> Pub. 974's own worked
  example: repay 2,942 standard vs 1,402 with Part V); 326 (round 1's impossible inventory and our advisory -> Schedule C line 36 net of personal
  withdrawals and returns: COGS 28,000 / 26,500 / 24,500); 328 (duplicated sc_00255 -> the Roth excess not on line 1h, and a code P / code 8
  corrective distribution: only 95 on line 1h). Kept and extended: 324 (80% Q4 -> 5,500; exactly 40% half-year 10,000; 42% -> 11,200, more than
  half-year); 325 (round 1 as A; 65 at death on the day before the birthday: B 17,750 + 6,000, C one day younger 15,750); 327 (12 / 14 days
  excluded, 15 days reported 8,655); 329 (round 1's 28,055 was wrong - H&R Block's 26,867 is the IRS figure; + straddle 54,199 and all at 25%
  61,423); 330 (round 1's 26,460 wrong - 24,655; + the 1250 slice filling the 24% band below the 28% collectibles 57,599, both capped 69,823).
  New IRS text in _tools/irs_text (PDFs deleted): f1099ptr (Rev. 4-2025), i1040sf, p225, p974.
- us-tax-be: four engine fixes, each mutation-checked: f61246ac (a net SS repayment of 3,000 or less no longer added to Schedule A line 16;
  advisory wording), afba1fb5 (mid-quarter convention applied when more than 40% of the year's basis is placed in Q4 - 5/7-year 200% DB),
  7d9a7342 (section 280A(g): a home rented under 15 days left off Schedule E), 6d88bb69 (non-IRA 1099-R codes 8/P kept off lines 5a/5b). Pin
  tests Hrb2025Sc00321-00330Test (28 tests, 81cb5130); sc_00325 C not pinned (no date-of-death input). No unit-test pin changed. Gate
  (TaxReturnComputeServiceTest, Sc*SqaScenarioTest, Hrb2025*Test) from a freshly deleted surefire-reports directory: 2,966 green; full unit
  suite 3,910 green. e2e changed (not run): line6abcd-social-security-benefits.spec.ts (advisory message now cites Pub. 915, not Pub. 17 /
  Form 1040-X).
- Slips: sc_00329's commit (4f1854d) says 11 checks; the spreadsheet has 10 - corrected in an empty commit 8186254. Fix commit 7d9a7342 quotes
  sc_00327 C as 7,935; the scenario was then simplified to 8,655.
- Open (owner): outstanding.md A62-A65 (1099-PATR into Schedule F; SS repayment prior-year inputs; taxpayer date of death; Schedule C line 36
  inputs) and B34-B36 (SS method 1 vs 2; mid-quarter for other classes / SL; 280A(g) interest and taxes to Schedule A).

## 2026-10-15T23:05:00-04:00 - Round-2 QA scenarios sc_00311-00320 (Form 4868 and Schedule 3 line 10, section 121(c) reduced exclusion, 529 with the AOTC and a scholarship, foreclosure recourse vs nonrecourse, QOF 180-day window, seller-financed note in a later year, ABLE saver's credit, Form 1099-CAP no loss, life policy sale split, QLAC and the RMD)
- c:/us-tax-hrb2025: sc_00311-00320 written (md + xlsx, 143 checks, 33 graded runs). All ten reshaped: 311 (round 1 graded abstract Form 4868
  lines H&R Block cannot accept -> a real return whose line 24 is the estimate: line 5 excludes the payment, line 6 floors at 0, the payment is
  Schedule 3 line 10 once: owe 0 / refund 1,305 / owe 1,169 at the 90% mark / refund 805); 312 (full 250,000/500,000 limits far from any edge and
  our own 1099-S blocker -> section 121(c) 365/730 x 250,000 = 125,000: 100,000 all excluded, 160,000 leaves 35,000 short-term (bought 09/01/2024,
  sold 09/01/2025), no reason = no exclusion + NIIT 1,140); 313 (the ratio alone -> AQEE less the AOTC expenses and a scholarship: taxable 250 /
  1,750 / 1,500, Form 5329 Part II 0 / 75 / 0; ratio worked by hand - H&R Block asks the taxable amount); 314 (H&R Block has no 1099-A -> Pub. 4681
  Table 1-1 by hand, entered as a sale at the amount realized + 1099-C: nonrecourse gain 50,000; recourse 20,000 + COD 30,000; still liable no COD;
  basis 190,000 loss (3,000) beside COD); 315 (our Form 8997 gate rows -> the 180-day window and the gain cap: day 180 defers the short-term 30,000,
  day 181 only long-term, 120,000 invested defers 100,000; H&R Block has no QOF - election and code Z not graded, carried by a code-O row); 316
  (duplicated sc_00265 + our SSN blocker -> a seller-financed note two years on: Form 6252 later year 6,000, payoff 60,000, note sold for 85,000
  over basis 38,400 = 46,600 long-term); 317 (round 1's 750 / 75 kept as C -> the beneficiary's own ABLE contribution earns the saver's credit, cut
  by every ABLE distribution: 200 / 50 / 0; round 1 found H&R Block charges no 10% on the ABLE path); 318 (round 1's 50,000 gain kept as A -> the
  1099-CAP loss is never entered: basis 150,000 nothing, two lots only the 35,000 gain lot); 319 (all blank in round 1 -> the Lasser 12.20 split by
  hand: 10,000 ordinary + 25,000 capital; 6,000 all ordinary; term policy 5,000 capital; term loss not deductible); 320 (issuer-side QLAC facts ->
  the QLAC left out of the RMD base: 492,000 / 24.6 = 20,000 met; failed QLAC 738,000 / 24.6 = 30,000, Part IX 25% = 2,500; over-withdrawal no
  excise). New IRS text in _tools/irs_text (PDFs deleted): p523, p537, p970, p4681, p907, i1099ac, i1099cap, i1099ls, i1099s, f1099a/cap/ls/q/qa/s/sb,
  f1098q, i1098q, f4868.
- us-tax-be: no engine change. Pin tests Hrb2025Sc00311-00320Test (33 tests, commit 975d702d); sc_00313 B pinned only to line 22 (no field marks
  a line-8z amount as QTP for Form 5329 Part II - outstanding A58). TaxReturnComputeServiceTest, Sc*SqaScenarioTest and Hrb2025*Test: 2,938 green
  from a freshly deleted surefire-reports directory. No e2e spec changed.
- Slips: sc_00314's commit (9f1dc50) says 20 checks; the spreadsheet has 16 - corrected in an empty commit 9d087e0. sc_00311/00312 first cited
  IRC 6081(a) and quoted 121(c) from memory - replaced in 2c4ac1e.
- Open (owner): outstanding.md A58-A61 (1099-Q / QTP Part II field; section 121(c) inputs; 1099-A / 1099-CAP / 1099-LS derivation; RMD
  computation) and B32-B33 (QOF 180-day / gain-cap check; 1099-QA into Form 8880 line 4).

## 2026-10-16T13:00:00-04:00 - Round-2 QA scenarios sc_00301-00310 (American Samoa section 931, Form 8828, Form 2210-F, REIT dividends as NII and QBI, NOL and QBI, SALT phase-down and the AMT, kiddie tax with qualified dividends, taxable SS and the senior deduction, Form 8938, Form 8888)
- c:/us-tax-hrb2025: sc_00301-00310 written (md + xlsx, 114 checks, 31 graded runs). Kept and extended: 302 (H&R Block has no Form 8828 - worked by
  hand, write-in 1.231964 graded; round 1 as A 10,000, half the gain 5,000, income percentage 45% 4,500, line-17 stop 0); 303 (round 1's stated tax
  replaced by a Schedule F return - SE 7,065, QBI 6,143, total tax 9,776; one payment dated 01/15/2026 in the 4th row: 6,521 no penalty, 999.59 short
  17, the 2024 tax of 5,000 enough); 306 (a 500,000 ISO spread makes the AMT bind so Form 6251 line 2a moves line 17: SALT 10,000 / 25,000 / 40,000 at
  MAGI 600,000 / 550,000 / exactly 500,000, AMT 128,571 / 137,321 / 146,071); 309 (the any-time prong added: 60,000 required, 50,000/75,000 not,
  40,000/80,000 required; Schedule B Part III graded, Form 8938 rows fill-only-if-displayed). Reshaped: 301 (round 1 entered the Samoa income twice
  and never asked for taxable income -> Pub. 570 standard-deduction proration 3,029 / U.S.-government wages 15,144 / senior deduction phased with the
  excluded income but not prorated 8,659 + 5,580); 304 (REIT dividends as both NII and QBI: NIIT 2,280 at excess = NII, 1,520 when the MAGI excess binds,
  AMT 30,607 after QBI); 305 (each round-1 carryforward has its own round-2 scenario -> NOL 80% base without the QBI deduction 67,400, QBI limit after the
  NOL 6,850 / 3,370; C expected H&R Block finding); 307 (28% leg not enterable at H&R Block's parent-income limit -> Line 5 Worksheet #1 and the parents'
  0%/15% band: 438 / 438 at 96,700 / 978); 308 (round 1 said 67 but computed as under 65 - tax 0, not 660; sc_00196 duplicates SS + QDCG -> taxable SS
  in the senior-deduction MAGI: 611 at exactly 75,000, 2,261 with 5,400); 310 (round 1 graded our own mismatch advisory -> Form 8888 line 5 = line 35a
  after 500 applied to 2026; three accounts incl. a Roth IRA). New IRS text in _tools/irs_text: p570, f4563, f8828, i8828, f8938, i8938 (downloaded,
  PDF deleted), f8888.
- us-tax-be: fix d455da7c - Form 8615 line 5 carries only the child's qualified dividends / net capital gain left after the 2,700 is charged against
  them pro rata (2025 Line 5 Worksheet #1), not all of them (sc_00307: line 9 10,002 -> 10,164; tax 412 -> 438); mutation-checked (fix stashed ->
  Hrb2025Sc00307Test 3/3 fail -> restored). Two TaxReturnComputeServiceTest pins that encoded the old allocation updated with hand-derived values
  (line 13 3,432 -> 3,529, tax 5,231 -> 5,196; 3,512 -> 3,652, 5,311 -> 5,319). No e2e spec pins an affected value - none changed. Pin tests
  Hrb2025Sc00301-00310Test (29 tests, commit dbe5e63b); not pinned: sc_00309 B (Form 8938 intake has no year-end value - outstanding A57).
  TaxReturnComputeServiceTest, Sc*SqaScenarioTest and Hrb2025*Test: 2,905 green from a freshly deleted surefire-reports directory.
- Slips: sc_00302's commit (eb50c3c) says 15 checks; the spreadsheet has 12 - corrected in an empty commit f7ac16f. sc_00303-00305 first cited
  statute subsections from memory - replaced in 56fb3a0.
- Open (owner): outstanding.md A57 (Form 8938 year-end value), B30 (Form 8615 Line 5 Worksheets #2/#3), B31 (derive Form 8828 line 15).

## 2026-10-16T09:30:00-04:00 - Round-2 QA scenarios sc_00291-00300 (like-kind boot, section 1256 60/40, general business credit and the TMT, HSA excess excise, Form 2210 Schedule AI, OBBBA bonus cutover, Form 4137 wage base, Form 8379 allocation, Form 8611 recapture, Form 8283 appraisal line)
- c:/us-tax-hrb2025: sc_00291-00300 written (md + xlsx, 119 checks, 34 graded runs). Kept and extended: 291 (round 1's boot 20,000 as A;
  boot 70,000 capped at the 50,000 gain, net debt relief 15,000 as the boot, a realized loss not recognized; investment land -> Schedule D;
  tax 7,460 / 11,960 / 6,710 / 5,075); 292 (round 1's 10,000 gain as A, tax 6,440 not 6,855; a 10,000 loss split and limited to 3,000; the
  split made before netting a 4,000 short-term stock loss, 5,360; Form 6781 in forms mode); 293 (round 1 typed the 38(c) limit as an
  input - replaced by real returns: limit = tax 5,975 below the AMT exemption, 9,573 where the TMT 8,294 binds with no AMT owed, credit used in
  full at exactly 88,100; Form 3800 forms mode); 294 (A 60; B the year-end cap 30 via the Excess Contributions topic round 1 never opened;
  C withdrawn 0; D a 2024 excess absorbed and deducted - line 13 4,000; E taxed 60 again); 295 (round 1 abstract, safe harbour met -> real
  underpayment: penalty 335 regular, 124 with Schedule AI, 251 when the gain falls on Aug 29 in period (c), 335 for an even earner); 296
  (Jan 20 vs Jan 19 instead of Feb 15 vs Jan 10, plus a Jan 15 contract placed in service Feb 15 - still 40%; cost 90,000 so Schedule SE gives
  6,104 under either rounding); 298 (Part III by its rules: half the 31,500 basic standard deduction each - the Rev. 11-2024 instructions print
  30,000 - and student-loan interest to the borrower); 299 (H&R Block has no Form 8611: the form is worked by hand and documented, the graded
  rows are Schedule 2 line 16 and the totals; flow-through 12,800, year 11 .333 -> 17,750, year 12 .267 -> 15,835). Reshaped (duplicated an
  earlier round-2 scenario): 297 (low-income run = sc_00256) -> the Form 4137 wage base counted across two W-2s (217 / 87 / 459); 300 (car
  cap = sc_00114) -> the appraisal line "more than 5,000 per item or group of similar items" (5,000 painting deducted; two paintings 5,500 to
  two museums 0; painting + dining set 5,500; listed stock 9,000). New IRS text in _tools/irs_text: i8824/f8824, f6781, i3800, 2025 f3800
  (replacing the 2024 text), i8889, f4562, i8379/f8379, f8611, i8283/f8283.
- us-tax-be: fix 0e471afe - a prior-year excess HSA contribution absorbed by this year's unused room is deducted on Form 8889 line 13 (2025
  Instructions for Form 5329, line 43), and line 46 subtracts line 44 (sc_00294 D: deduction 3,000 -> 4,000, refund 2,285 -> 2,405);
  mutation-checked (fix stashed -> Hrb2025Sc00294Test D fails -> restored). No e2e spec pins a prior-year HSA excess - none changed. Fix
  c85ea385 - computeForm8379 reads the tax year null-safely (robustness; no value changes) so sc_00298 can be pinned. Pin tests
  Hrb2025Sc00291-00300Test (32, commit 2f99df46); not pinned: sc_00296 C (no acquisition-date field) and sc_00300 B (no property category) -
  outstanding A55/A56. TaxReturnComputeServiceTest, Sc*SqaScenarioTest and Hrb2025*Test: 2,875 green (436 classes) from a freshly deleted
  surefire-reports directory.
- Slips: sc_00297's commit (8e27a05) says 11 checks; the spreadsheet has 10 - corrected in an empty commit 6014433. sc_00291 first quoted
  IRC 1031(b) from memory - replaced in b16472c.
- Open (owner): outstanding.md A54 (HSA excess withdrawn by the due date), A55 (asset acquisition date / 40% election), A56 (Form 8283
  property category for similar items), B26 (derive Forms 8824/6781), B27 (pre-fill Form 8379 column (b)), B28 (Form 8611 line-4 lookup),
  B29 (HSA line 44 path unpinned).

## 2026-10-16T05:30:00-04:00 - Round-2 QA scenarios sc_00281-00290 (Form 8829 limit/carryover and lines 16/17, foreign tax carryover, capital loss carryover with negative taxable income, minimum tax credit, Schedule H thresholds, clergy housing limit, CRP on Schedule SE, Form 4835 vs Schedule F, Form 8814 and the parent's EIC, equal-earner MFS win)
- c:/us-tax-hrb2025: sc_00281-00290 written (md + xlsx, 123 checks, 36 graded runs/returns). Kept and extended: 281 (round 1's Year 1 as A;
  the carryover limited again (B 10,000/3,000 carried), used up (C line 31 6,000) and a standard-deduction filer's mortgage interest/taxes on
  lines 16/17 (D line 31 0, not (300))); 282 (abstract limits replaced by real income - limit 2,501 with the standard deduction apportioned on
  1116 line 3a; carryover 1,500 + tax 1,000 / 1,500 / 3,000 -> 2,500 / 2,501 / 2,501); 284 (abstract figures replaced; Form 8801 line 24
  binds - 5,000 / 8,973 / 5,973 with a 3,000 solar credit shrinking line 22); 285 (round 1's 10,000 as A; exactly 2,800 -> 445, 2,700 -> FUTA
  16, a 16-year-old student babysitter -> FUTA 18); 286 (W-2 minister; the 107 smallest-of limit -> line 1h 0 / 5,000 / 2,000, SE 9,608
  throughout); 288 (Form 4835 through forms mode vs Schedule F with SE 2,826; an unsold crop share is no income -> (8,000) allowed). Reshaped
  (duplicated an earlier round-2 scenario or was not gradable): 283 (carryover character = sc_00039/00161) -> the carryover worksheet's
  negative line 1 (7,000 / 7,000 / 8,500 / 10,000; H&R Block's own worksheet caption says "not less than 0"); 287 (farm optional = sc_00224) ->
  the CRP exclusion and its "at the time you received" test (SE 2,826 / 3,956 / 3,956); 289 (structural mutual exclusion; child had wages) ->
  Form 8814's line-8z amount as the parent's EIC investment income (EIC 2,782 own return / 0 at 12,300 / 1,360 at 11,900; child's own return
  tax 1,099); 290 (optimizer H&R Block lacks; MFS-loses case = sc_00099) -> equal earners where separate returns WIN by 536 (medical 25,000)
  and lose by 469 (15,000). New IRS text in _tools/irs_text: f8829, i1116 + f1116, i8801 + f8801, 2025 f1040sh + i1040sh, p517, f4835 (2025
  texts downloaded from irs.gov where the repo had none or an older year).
- us-tax-be: fix 9f4d39d8 - Form 8829 lines 10/11 -> 16/17 for a standard-deduction filer (2025 Form 8829 instructions; Lasser 40.15):
  prepare() re-runs once with HOME_OFFICE_STANDARD_DEDUCTION when the first pass took the standard deduction and an office has line 10/11
  amounts (sc_00281 D: line 31 (300) -> 0). e2e spec se-home-office-280a-tiers.spec.ts asserted the old behaviour (-1000) for a filer with no
  Schedule A - changed to 0 (not run). Fix 98f9bd0c - the Form 8814 line 12 amount (Schedule 1 line 8z) counts toward the parent's EIC
  investment-income limit (Pub. 596 Worksheet 1 line 4) (sc_00289 B: EIC 1,296 -> 0); no e2e spec asserts an EIC with Form 8814. Both
  mutation-checked (fix stashed -> pin test fails -> restored). Pin tests Hrb2025Sc00281-00290Test (35, commit aaf86866); not pinned: sc_00286
  B/C income side (no line-1h excess-allowance input) and sc_00287 C (no social-security start date) - outstanding A50/A51.
  TaxReturnComputeServiceTest, Sc*SqaScenarioTest and Hrb2025*Test: 2,843 green (426 classes) from a freshly deleted surefire-reports directory.
- Slips: sc_00282's commit (b1871bb) says 14 checks; the spreadsheet has 11 - corrected in an empty commit 48ee797.
- Open (owner): outstanding.md A50 (clergy housing limit / line-1h excess allowance), A51 (CRP timing), A52 (Schedule H per-employee tests),
  A53 (home-office personal share on Schedule A - audit), B24 (8829 re-run decides "standard" from the first pass), B25 (ThreadLocal note).

## 2026-10-16T01:30:00-04:00 - Round-2 QA scenarios sc_00271-00280 (MFS AMT add-back, pre-1999 rental building on line 2m, Form 4797 recapture and the 1250 slice, Schedule R limit with Form 4972, 80% NOL limit, 163(j) small-business exemption, charitable carryover character, separate QBI/REIT carryforwards, at-risk then passive carryovers, 461(l) threshold)
- c:/us-tax-hrb2025: sc_00271-00280 written (md + xlsx, 113 checks, 28 graded runs + 3 documented). Reshaped (round 1 duplicated an earlier
  round-2 scenario, rested on a form H&R Block lacks, or could not discriminate): 271 (single phase-out = sc_00130; round 1's MFS row expected
  45,704 at AMTI 900,000, 350 below the trigger) -> the MFS line-4 add-back at 900,350 / 1,000,350 / 1,200,350 (0 / 25,000 / capped 68,500);
  272 (line 2m on a rental with no AMT) -> a pre-1999 building's 40-year AMT depreciation with PAB interest so the AMT applies (+3,750 for
  12/1998, -8,250 for 1995 after its regular schedule ended, 0 for 2005); 274 (Form 4972 + 750 credit = sc_00047) -> the Schedule R limit
  (Credit Limit Worksheet starts from 1040 line 18, which includes the 4972 tax): 5,820 / 770 / 550 -> credit 750 / 750 / 550; 276 (no Form
  8990 in H&R Block; a sole proprietor is exempt anyway) -> the 163(j)(3) small-business exemption, 22,000 and 60,600 of interest in full,
  Form 8990 runs documented; 277 (cash carryover = sc_00112 D) -> a 30% capital-gain carryover (30,000 of 40,000; 20,000 behind 30,000 of
  cash); 279 (two gates on a K-1, no at-risk entry in H&R Block, 3 of 5 rows non-discriminating) -> a rental's at-risk carryover absorbed by
  its own income before the passive carryover is released (line 5 0 / 0 / 5,000); 280 (no Form 461 in H&R Block) -> losses up to the 2025
  threshold (200,000 and exactly 313,000) in full, the excess documented. Kept and extended: 273 (round 1's two sales + the gain above the
  depreciation; the unrecaptured 1250 slice taxed at 22% via Schedule D Tax Worksheet line 21, tax 20,155 not 22,075); 275 (100,000 kept, plus
  50,000 and exactly 64,000; ATNOLD keeps the AMT at 0); 278 (round 1's Year 2 corrected to 16,467 / 3,293, plus a carryforward larger than
  each component: deduction 600 and 3,293). Round-1 notes corrected: 274's H&R Block "4972 tax 5,120" was most likely 5,870 - 750 (credit);
  the run log's "HRB under-applies the 25% 1250 slice" (sc_00329, 26,867) is the correct worksheet result. New IRS text in _tools/irs_text:
  i1040sr (Schedule R instructions), i172 (Form 172 instructions), f4797, f461.
- us-tax-be: fix b976ed48 - a by-category charitable carryover (priorYearCharitableCarryoverCash/CapGain/...) or a bridge-imported one with
  no other itemized input discarded Schedule A (and the carryover): the "nothing entered" gate checked only the legacy single field; now
  priorCharityTotalForDisplay too (sc_00277 A/B: 15,750 standard deduction instead of 20,000 / 30,000). Fix 087c7405 - a rental's (and a
  Form 4835 farm rental's) prior-year 465 carryover in an INCOME year was released only up to the amount at risk; the activity's own income
  absorbs it first (465(a)(2); Form 6198 line 5), so the headroom is amountAtRisk + net (sc_00279: line 5 5,000 / 15,000 / 20,000 instead
  of 0 / 0 / 5,000). Both mutation-checked (fix stashed -> pin tests fail -> restored). Pin tests Hrb2025Sc00271-00280Test (29, commit
  1e0783a6). TaxReturnComputeServiceTest, Sc*SqaScenarioTest and Hrb2025*Test: 2,808 green (416 classes) from a freshly deleted
  surefire-reports directory. e2e: grepped e2e/tests for both fixes - charitable specs use the legacy field or include current gifts, the
  rental/4835 at-risk specs are loss years; no value changes, no spec edited.
- Slips: sc_00274's commit (6bdbce2) says 15 checks; the spreadsheet has 13 - corrected in an empty commit dbae606. sc_00271 / 00272 authority
  lines first quoted IRC 55(d)(3) from memory and an unverified TRA'97 section - replaced (e0b47d1, 96dd742).
- Open (owner): outstanding.md A49 (rental 465 carryover is one form-level amount), B22 (blank amount at risk = fully at risk, but the
  carryover is never released), B23 (AMT 150% DB applied to post-2015 bonus-eligible personal property, contrary to the 6251 line 2l text).

## 2026-10-15T23:30:00-04:00 - Round-2 QA scenarios sc_00261-00270 (education credit phase-out, Form 2555 vs the ACTC, income with no information return, shared HSA family limit, seller-financed mortgage, EIC investment-income limit, Roth MAGI add-back, one Form 8814 per child, the 60-63 catch-up edges, a dependent's scholarship) - no engine change
- c:/us-tax-hrb2025: sc_00261-00270 written (md + xlsx, 112 checks, 34 graded runs). Reshaped (round 1 graded our app's own gates, or
  duplicated an earlier round-2 scenario): 261 (8863 MFS / 8862 / TIN gates = sc_00168/229/230 or unbuildable in H&R Block) -> the Form 8863
  MAGI phase-out 80,000-90,000 with the 40% refundable share taken after it and the LLC halved (refund 4,945 / 2,595 / 245 / 1,745); 262 (our
  ACTC states) -> §24(d)(5): no ACTC for a Form 2555 filer, H&R Block's 2555 now reachable in forms mode (ACTC 1,700 / 0 / 0, line 19 330);
  263 (upload-gate sweep, NOT APPLICABLE in H&R Block) -> income with no information return: no-1099-DIV dividends (qualified), a 580 debt
  canceled under the 1099-C line, a private stock sale on 8949 box F; 264 (advisory sweep = sc_00062/86/194/214/236) -> one 8,550 HSA family
  limit for spouses, divided by agreement, the catch-up only in the owner's own HSA (excise 60 in B and C); 265 (seven blockers graded
  elsewhere) -> the seller-financed mortgage on both sides (Schedule B at any amount; Schedule A line 8b with no 1098); 268 (single-child
  8814 boundaries = sc_00232) -> one Form 8814 per child (5,000 + 2,000 -> 2,300 / 200; 3,500 x 2 -> 1,600 / 270; pooled 5,003). Kept and
  extended: 266 (rental 12,000 / 11,000 kept; exactly 11,950 allowed, 3,589; tax-exempt interest counts, EIC 0 not 4,328); 267 (round 1's
  7,000 + 7,000 broke the combined limit regardless of MAGI - kept as the H&R Block tree's corrected 3,500 + 3,500, plus 160,000 where the
  add-back moves the limit to 2,340 and a nondeductible control); 269 (59 / 64 kept, moved to December 31 birthdays; 60 on 12/31 and 63);
  270 (900 / scholarship 3,000 kept, with interest so the deduction moves the tax; wages + scholarship 4,350). Round-1 note corrected:
  265's "seller-financed topic has no fields" was the driver stopping at the intro (IntInc has SFMInfo / SFMAddlInfo behind it).
- us-tax-be: pin tests Hrb2025Sc00261-00270Test (34, commit 4b559c36) - the engine agreed with every IRS-derived value; no fix.
  Hrb2025Sc00263/00265 pin that the overrideable DIVIDEND_ / INTEREST_STATEMENT_UPLOAD_REQUIRED gates still fire for no-form dividends and
  seller-financed interest. TaxReturnComputeServiceTest, Sc*SqaScenarioTest and Hrb2025*Test: 2,779 green (406 classes) from a freshly
  deleted surefire-reports directory. e2e: no value changed, no spec edited.
- Slips: sc_00265's commit (dde4981) says 10 checks; the spreadsheet has 9 - corrected in an empty commit 2acf984. The docs commit 4b9721d
  says "history, rules"; it carried outstanding.md only - this entry and the rules.md entry follow in the next commit.
- Open (owner): outstanding.md A47 (no-1099-DIV dividends still gated), A48 (no Schedule A line 8a/8b split or seller identity; seller-financed
  interest still gated), B21 (should the upload gates exempt amounts that never have a form?).

## 2026-10-15T19:30:00-04:00 - Round-2 QA scenarios sc_00251-00260 (Trade Act SUB-pay repayment, Form 1098 box 4/5, private-foundation cash ceiling, $100 per casualty, two-employer deferral limit, Form 4137 tips, allocated tips, Medicaid waiver home rule, NUA, SS worksheet adjustments) + one engine fix
- c:/us-tax-hrb2025: sc_00251-00260 written (md + xlsx, 139 checks, 30 graded runs). Nine of ten reshaped: 251 (1341 on repaid unemployment
  = sc_00015/120/145/240) -> SUB pay repaid for TRA on Schedule 1 line 24e at any amount vs 3,000 of repaid state unemployment (nothing), TRA
  on line 7; 252 (home-equity tracing = sc_00108) -> Form 1098 box 4 refund of 2024 interest as a line 8z recovery (900 / 350 by the 2024
  itemized excess) and box 5 premiums not deductible; 253 (cash + stock ordering = sc_00113 C) -> cash to a private non-operating foundation,
  30% and the 50% room (30,000 / 20,000); 255-260 (round 1 = our app's §17 "blocker variants", expected BLOCKED, nothing for H&R Block to
  compute) -> excess deferrals across two 401(k)s at 45 / 52 / 61 (9,500 / 2,000 / 0, line 1h); Form 4137 unreported cash tips with
  under-$20 months (383 / 379) and noncash tips (line 1c only); allocated tips with and without records on an MFS return (230 / 92 / 0);
  Medicaid waiver pay only for care in the provider's own home (18,000 excluded / taxed / 12,000-6,000 split); 1099-R box 6 NUA (5b 60,000;
  sale 40,000 LT + 6,000 ST / 34,000 LT); the SS worksheet taking the IRA deduction (6b 15,300 -> 12,150) but not student loan interest.
  254 kept round 1 as Run A (now dated after 09/02/2025 so neither disaster is a "qualified" one - round 1 never said) and added one storm
  hitting house + car (one $100, 26,900) and a 60 casualty that floors at 0. New IRS text: _tools/irs_text/f4137.txt.
- us-tax-be: fix 70dd8573 - Form 1098 box 4 was stored but never read; it is now a Schedule 1 line 8z recovery limited by the tax benefit
  rule (prior-year itemized excess), not netted against line 8a. Mutation-checked (fix stashed -> Hrb2025Sc00252Test B/C fail -> restored).
  Pin tests Hrb2025Sc00251-00260Test (30, commit f727b2ef; also corrects Hrb2025Sc00250Test's 1099-R key taxableAmount ->
  taxableAmountAmount, result unchanged). TaxReturnComputeServiceTest, Sc*SqaScenarioTest and Hrb2025*Test: 2,745 green (396 classes) from a
  freshly deleted surefire-reports directory. e2e: grepped e2e/tests - no spec seeds a 1098 box 4 for a compute (statement-mapper-roundtrip
  sends box 5 only and asserts the round-trip); no spec edited.
- Slip: sc_00253's commit (78353e7) says 16 checks; the spreadsheet has 13 - corrected in an empty commit 3697d71.
- Open (owner): outstanding.md A43 (1098 box 4: prior-year interest deducted / pro-rata split), A44 (one item per casualty event in the guided
  inputs), A45 (one Medicaid waiver home answer for several care recipients), A46 (NUA sale character typed by the filer), B19 (are allocated
  tips qualified tips?), B20 (box 4 recovery when prior-year itemizing is unanswered).

## 2026-10-15T15:40:00-04:00 - Round-2 QA scenarios sc_00241-00250 (MFS premium tax credit, ITIN child, dependent student loan interest, attorney-fee ceilings, tax-exempt OID, General Rule annuity, net SS benefits, SECURE 2.0 early-distribution exceptions, Medicaid waiver election, W-2 box 12 uncollected FICA) + three engine fixes
- c:/us-tax-hrb2025: sc_00241-00250 written (md + xlsx, 141 checks, 31 graded runs + 3 documented). Reshaped (round 1 duplicated an
  earlier round-2 scenario or could not be entered): 247 (lump-sum election = sc_00237 C/D; H&R Block does not compute it) -> net
  SSA-1099 box 5 after a 4,000 repayment and a spouse's negative box 5 on a joint return (13,175 not 15,300); 248 (education / medical =
  sc_00060 / sc_00045) -> the SECURE 2.0 exception limits 19 / 23 / 22 (1,500 / 1,900 / 970); 249 (W-2 waiver pay, which H&R Block cannot
  exclude; plain exclusion = sc_00236 D) -> the earned-income election with a child (EIC 1,709 -> 4,328, ACTC 375 -> 1,700) and not making
  it on the plateau; 250 (Form 8919, not in H&R Block; = sc_00236 A) -> W-2 box 12 A/B (306) and M/N (153) on Schedule 2 line 13, with
  round 1's 8919 runs documented. New runs elsewhere: MFS PTC at 265% (the other-status cap 1,950, not 975) and with box A (715 / net
  200) (241); the ITIN child's self-only EIC at 15,000 and an SSN control (242); a 24-year-old nobody can claim (243); fees exactly equal
  to the settlement (244); tax-exempt OID moving taxable SS (4,200 / 6,200 / 4,000) (245); Table V at the nearest birthday (66 -> 19.2),
  3-place rounding and a part year (246). Round-1 errors fixed: 241 "HRB skips the 1095-A" was a driver bug (it clicked Finish, name 58);
  241 line 5 is 401 above 400% (my first pin said 431 - the engine was right); 246's facts said age 62 but 65 at the annuity start and used
  the under-65 deduction (refund 445 -> 1,405); 248's medical run stated an AGI its inputs could not produce; 247 moved from Idaho
  (community property) to Montana. Not graded: 243 B (claimable, not claimed - statute vs instructions), 250 Form 8919 codes A/H.
  New IRS text: _tools/irs_text/p939.txt (Pub. 939 Rev. 12-2025, fetched from irs.gov).
- us-tax-be: three fixes, each mutation-checked (fix stashed -> pin fails -> restored): 4890f474 General Rule exclusion percentage rounded
  to three places (Pub. 939 Step 3; sc_00246 B 8,875 -> 8,880); 688b7825 Form 5329 line 2 stops at 1,000 (exception 23) and 10,300
  (exception 22) on the IRA and plan paths (sc_00248 C/D: line 8 0 -> 1,900 / 970); 3c4c4f08 EIC earned income includes Form 1040 line
  1d (sc_00249 B: 1,709 -> 4,328). Pin tests Hrb2025Sc00241-00250Test (34, commit c82a67c9). TaxReturnComputeServiceTest,
  Sc*SqaScenarioTest and Hrb2025*Test: 2,715 green (386 classes) from a freshly deleted surefire-reports directory. e2e: grepped
  e2e/tests - no spec seeds General Rule inputs or exception codes 22/23, and the Medicaid waiver specs never claim the EIC; no spec
  edited.
- Slip: sc_00242's commit (a81eac6) says 21 checks; the spreadsheet has 17 - corrected in an empty commit 3f15ba8.
- Open (owner): outstanding.md A41 (General Rule prior recovery / Table V / starting date), A42 (exception 19 count, 22/23 account-value
  limbs), B16 (section 221(c) "allowable" vs "aren't claimed"), B17 (EIC earned income from W-2s, not line 1z - 1c/1e/1g unverified),
  B18 (one Medicaid waiver election for EIC and ACTC).

## 2026-10-17T12:00:00-04:00 - Round-2 QA scenarios sc_00231-00240 (Form 8862, Form 8814, dependent care qualifying person, IRA excess, alimony, wage character, Simplified Method + SS lump sum, car loan interest, installment sale, section 1341 / 962) + one engine fix
- c:/us-tax-hrb2025: sc_00231-00240 written (md + xlsx, 113 checks, 37 graded runs + 3 documented). Round 1's ten were mostly
  "conformance" zero-checks or sat far from their rules: 231 graded "EIC without Form 8862" (not an input any product offers);
  232's withholding run and 236's Form 8919 / W-2 waiver runs and 240's section 962 run cannot be entered in H&R Block; 234 and 238
  repeat round-2 sc_00171 / sc_00176 / sc_00152; 237's SSI and lump-sum runs had no figure. New runs: Form 8862 by REASON and
  DETERMINATION YEAR (math error -> no 8862; reckless 2024 -> no EIC; fraud 2015 -> ban over) (231); 8814 at the 2,700 base (135 only)
  (232); a dependent mother at 6 vs 7 months, with the ACTC that appears when the care credit uses the tax first (233); IRA catch-up by
  birth date 12/31/1975 vs 01/02/1976, a timely corrective withdrawal, and traditional + Roth sharing one limit (234); a pre-2019
  decree modified in 2022 - taxed unless the modification adopts the TCJA (235); inmate pay moving EIC 614 -> 461, Medicaid waiver pay
  with no information return (236); Simplified Method on 9 months, Pub. 915 lump-sum election with 2024 AGI 23,000 / 30,000 (237); car
  loan phase-out at 100,000 / 100,001 / 115,500 and a 12/30/2024 loan (238); Form 6252 with a commission and an assumed mortgage, and the
  election out (239); section 1341 credit from the 2024 Tax Table at 6,000 and 3,050 (240). Round-1 errors fixed: 232 missing CTC; 233
  line 6f -> Schedule 3 line 2 (already noted); 240's 1,320 now derived, not given. Not graded (H&R Block cannot): 236 A Form 8919, 240
  section 962, 232 child withholding. New IRS text: _tools/irs_text/f8862.txt, p915.txt, f6252.txt (p915 and f6252 fetched from irs.gov).
- us-tax-be: fix 285c05a8 - CAPITAL_STATEMENT_UPLOAD_REQUIRED blocked a return whose only capital item was a 1099-S real-estate sale
  (the gate counted neither the 1099-S nor property1099SDispositions); disposition rows now count as capital detail. Mutation-checked
  (fix stashed -> Hrb2025Sc00239Test D fails -> restored). No value changes. Pin tests Hrb2025Sc00231-00240Test (43, commit 1d5652dc).
  TaxReturnComputeServiceTest, Sc*SqaScenarioTest and Hrb2025*Test: 2,681 green from a freshly deleted surefire-reports directory.
  e2e: grepped e2e/tests - the only spec touching the gate (section121-home-sale-exclusion.spec.ts) computes with overrideFlags and
  asserts values only; no spec edited.
- Not fixed (needs a field decision): section 962 deemed-paid credit is subtracted without the section 78 gross-up (Reg. 1.962-1(b)(1)(i)
  (A)(3)); the single input cannot separate subpart F taxes from GILTI taxes (80% credit) - outstanding.md A40.
- Open (owner): outstanding.md A37 (EIC disallowance reason / ban year / Exception 1), A38 (modified pre-2019 alimony decree), A39
  (IRA withdrawn-by-due-date), A40 (section 962 / section 78), B14 (Form 6252 lines 10-24 not derived), B15 (section 1341 credit typed).

## 2026-10-16T15:00:00-04:00 - Round-2 QA scenarios sc_00221-00230 (QBI income limit, SSTB phase-in, wage/UBIA limit, Schedule F farm optional method, hobby COGS, qualified joint venture, two Schedules C on Form 8995, Form 2210, MFS bars, education bars) + two engine fixes
- c:/us-tax-hrb2025: sc_00221-00230 written (md + xlsx, 158 checks, 33 runs). Round 1's ten were far from their rules: QBI
  always income-limited (221), an SSTB test that a non-SSTB with no wages also "passes" (222), a wage limit above the phase-in
  with no property (223), a farm on the regular method (224), a hobby with no costs that count (225), a QJV and two businesses
  that H&R Block entered as ONE Schedule C (226, 227), a 2210 with a zero prior year (228), and two zero-only conformance sweeps
  (229, 230). New runs: the crossover of 20% of QBI and 20% of TI (15,750 of wages) (221); SSTB applicable percentage 50% at TI
  222,300 and full 20% at exactly 197,300, with 30,000 of business wages so only the SSTB rule can cut (222); Part III phase-in
  12,435 and 25% wages + 2.5% UBIA 12,500 (223); farm optional method 2/3 of gross 6,000 and the 7,240 cap with net < 7,840, and
  the EIC it earns (224); hobby gross income = receipts - COGS (3,200) and the same activity for profit -> (1,000) Schedule C (225);
  per-spouse wage base (176,100 W-2 -> 1,071 + 5,652) and per-spouse 400 floor (800 -> nothing) (226); Form 8995 netting a 16,000
  loss (2,602) and a negative total (0, (10,000) carried) (227); 2210 line 9 = 6,000 not 90% (279), on-time quarters (0), one
  January payment (176 although 991 is owed) (228); ODC allowed on MFS (round 1 omitted it), section 32(d)(2) EIC 3,581, HOH for a
  separated spouse who pays the home (229); 4 prior AOTC years / less than half-time -> LLC 800, no 1098-T -> 0, eligible control
  2,500 (230). Round-1 errors fixed: 229 missing ODC (refund 1,165 not 665/765); moved out of community-property states 226 (Santa
  Fe NM -> Colorado Springs CO) and 229 (San Jose CA -> Portland OR); 230's dependent / nonresident / late-TIN variants kept as
  documented rules, not graded (impossible on the facts or not enterable). 227 A/B keep round 1's per-line half SE 3,533 (cents
  3,532). New IRS text: _tools/irs_text/f8995a.txt.
- us-tax-be: two fixes, each mutation-checked (fix stashed -> pin fails -> restored): 609d0c8d EIC earned income now uses the
  farm/nonfarm optional-method net earnings (Schedule SE line 4b, EIC Worksheet B line 1b) instead of the actual net profit
  (sc_00224 B/C: 40 -> 423, 339 -> 511); 4826d51b Form 2210 applies a later estimated payment to the earliest unpaid installment
  first, ending its penalty days on that due date (2210 instructions, penalty worksheet line 1b / Example 3; sc_00228 D: 253 ->
  176). Pin tests Hrb2025Sc00221-00230Test (33, commit 8c06388d). TaxReturnComputeServiceTest, Sc*SqaScenarioTest and
  Hrb2025*Test: 2,638 green from a freshly deleted surefire-reports directory. e2e: grepped e2e/tests for optional-method and
  Form 2210 pins - none asserts an EIC under an optional method, and the 2210 specs either pay by withholding (spread evenly,
  unchanged) or assert a penalty > 0 for a Q4-only payment (still > 0) - no spec edited.
- Slip: sc_00223's commit says 19 checks; the xlsx has 17 (not amended).
- Open (owner): outstanding.md A35 (no estimated-payment date input), A36 (section 199A W-2 wages read from Schedule C line 26;
  UBIA only via depreciation-asset rows), B12 (notary profit in EIC earned income under the nonfarm optional method), B13 (2210
  per-slice rounding).

## 2026-10-16T09:00:00-04:00 - Round-2 QA: sc_00201-00203 reworked (credit out of graded rows) + sc_00211-00220 (SE cap / room / floor across businesses and W-2s, statutory employee, Form 7206, SEP, simplified home office, standard mileage, section 179, meals) + two engine fixes
- c:/us-tax-hrb2025, rework: sc_00201 (Form 8834), sc_00202 (Form 8911) and sc_00203 (Form 8912) graded credit rows H&R
  Block cannot enter and expected them to FAIL (PLAYBOOK 3.3). Routes re-checked: formAvail.xml (165 forms) has none of the
  three; SearchTopics.cxml has no 8834/8912/1097 hit; 92.143 ends at Form 3800 (Schedule 3 line 6a); Schedule 3 line 6z
  (OtherCr, id 363) carries the computed attribute (132) like 6i/6j/6k. Now: base return + entry checks of the credit-less
  return graded, the credit row fill-only-if-displayed with a blank expected; 203 grades the 1099-INT gross-up per run and
  adds a 2024 tax (18,000) so the credit-less return owes no 2210 penalty. Checks 12 / 13 / 33 (were 12 / 10 / 15). IRS
  credit figures kept in md sections 4/6, marked not graded. Pin tests unchanged (no value changed).
- c:/us-tax-hrb2025, new: sc_00211-00220 (md + xlsx, 147 checks, 30 runs). Round 1's ten were single-business Schedule C
  returns far from every limit, and four of them (217-219, and 216's SEP) were entered in H&R Block as a plain expense or on
  the wrong screen, so the rule was never exercised there. New runs: the 176,100 cap on the COMBINED earnings of two
  Schedules C, incl. a loss (211); line 8a = box 3 of every W-2 (two employers; 160,000 leaves 16,100 + Form 8959 56) (212);
  the 400 floor on combined businesses (430 + 304 owes 104; 1,000 - 600 owes nothing) (213); a statutory Schedule C stays off
  Schedule SE even beside a real business, and its loss doesn't reduce SE tax (214); Form 7206 cap (profit 8,000 -> 7,435) and
  the LTC age band (1,500 -> 900 at 45) (215); SEP 20% (15,000 -> 11,152) and the 70,000 limit (76,350 at a 398,000 profit)
  (216); simplified home office 300 sq ft cap and the tentative-profit limit with no carryover (217); standard mileage +
  tolls + business share of loan interest (218); section 179 business income limit (70,000 -> 60,000, 10,000 carried) and
  wages counting toward it (219); travel 100% and entertainment 0 beside 50% meals (220). Native H&R Block routes spelled out
  (Add_Business twice, 52.127, 182.13/182.87/182.52, 103.147265 + 103.150742, Add_Vehicle 126.x, 31.267/31.136, 7.276,
  7.208155). New IRS text in _tools/irs_text: i1040sc, i1040sse, i4562, i7206, i8829, i8995a, p560, p587, p334. Kept round-1
  runs whose Schedule SE splits on rounding (211 A, 219 A, 220 A) grade H&R Block's per-line figure; new runs avoid splits.
- us-tax-be: two fixes, each mutation-checked (fix stashed -> pin fails -> restored): a05c9fd3 self-employed LTC premiums
  were added to Schedule 1 line 17 uncapped although labelled "age-limited" (sc_00215 C: 9,500 -> 8,900); f45b21dd Form 4562
  line 12 printed the elected section 179 (70,000) while Schedule C deducted the allowed 60,000 - now line 12 = allowed share,
  line 13 = carryover (sc_00219 B; presentation only). Pin tests Hrb2025Sc00211-00220Test (29). TaxReturnComputeServiceTest,
  Sc*SqaScenarioTest and Hrb2025*Test: 2,605 green from a freshly deleted surefire-reports directory. No e2e spec pins a
  changed value (grep: se-deductions-save-load.spec.ts only round-trips the LTC field; schedule-c/-f-depreciation.spec.ts
  assert the limit flag and net profit, unchanged) - none edited.
- Slips: sc_00213's commit says 18 checks (xlsx 15); sc_00214-00217 first commits carried wrong J.K. Lasser section numbers,
  fixed in d960e8d. Not amended.
- Open (owner): outstanding.md A32 (Schedule C meals has no DOT 80% option), A33 (SE LTC capped at the owner's age, not per
  covered person), A34 (no vehicle loan-interest input), B10 (section 179 carryover bridge), B11 (SE rounding convention).

## 2026-10-16T02:00:00-04:00 - Round-2 QA scenarios sc_00201-00210 (Form 8834, 8911, 8912, 8859, 8815, 8853 Section C, Schedule C / SE, Schedule C loss and NOL, 1099-NEC with a W-2, 1099-K with inventory) - no engine change
- c:/us-tax-hrb2025: sc_00201-00210 written (md + xlsx, 131 checks, 33 runs). Round 1's ten each tested one point far from the
  form's limit. Corrections: sc_00210's SE tax was 1,696 (Schedule SE rounds lines 10 and 11 separately: 1,374 + 321 = 1,695, as
  H&R Block showed) and it never claimed the EIC (607 -> owes 1,088, not 1,696). New runs: Form 8834 limited by tax - TMT (9,573
  exactly, 12,000 cut to 9,573, rest lost) (201); Form 8911 home charger 30%, the 1,000 per-property cap (3,500 -> 1,000) and the
  main-home gate (Schedule A line 17) (202); Form 8912 grossed up as interest and limited by tax + AMT with NO TMT floor (23,000
  under, 25,000 -> 23,867, 1,133 carried) (203); Form 8859 Tax Liability Limit Worksheet - 2,675 exactly the tax, 3,000 leaves
  325, a lifetime learning credit comes first (1,675 / 1,325) (204); Form 8815 line 7 ratio (0.600), MAGI 107,000 halves it,
  114,500 stops it (MAGI before the exclusion) (205); Form 8853 line 23 LARGER of 420 x days or costs, line 24 reimbursements,
  exactly 420 a day tax-free (206); Schedule SE 176,100 cap + Additional Medicare at a 220,000 profit, the 400 floor (432 vs 440)
  (207); a 35,000 loss wipes out TI but is no NOL, a 60,000 loss leaves a 10,000 NOL (Form 172 adds the standard deduction back)
  (208); W-2 box 3 shrinks the 12.4% part (150,100 -> 4,295; 176,100 -> 1,071 + Form 8959 117; box 1 must not be used) (209);
  ending inventory not deducted, returns and allowances, EIC on SE earned income (210). H&R Block has no Form 8834/8911/8912
  (formAvail.xml, computed-only 1040 cells): 201-203 grade the base return, credit rows are expected FAILs. sc_00206 folder renamed
  shorter (Windows path limit). New IRS text in _tools/irs_text: f8834, f8911, f8911sa, f8912, f8859, f8853, f3800, f1099k, f8995,
  f172, i1040ss.
- us-tax-be: Hrb2025Sc00201-00210Test pin 33 tests - the engine agreed with every IRS-derived figure (no fix). One decision
  recorded: Schedule SE rounds line 4a before the $400 test, so a 433 profit (399.88 -> 400) is taxed 62 - legal under round-all,
  outstanding.md B8; Form 8912 has no carryforward output (B9). TaxReturnComputeServiceTest, Sc*SqaScenarioTest and Hrb2025*Test
  2,576 green in a clean report directory. No e2e spec changed (no value changed).
- Commit-message slip: sc_00202's hrb2025 commit says 11 checks; the xlsx has 10 (not amended).
- Open (owner): Form 8853 line 24 is typed even when a reimbursement 1099-LTC is on file (A31); B8; B9.

## 2026-10-15T23:00:00-04:00 - Round-2 QA scenarios sc_00191-00200 (four-children CTC / Part II-B, three rentals, three pensions, three employers, QDCG + NIIT, SS + QDCG, excess SS + Additional Medicare, itemized + QBI + gain, tips + overtime, Schedule R) + two engine fixes
- c:/us-tax-hrb2025: sc_00191-00200 written (md + xlsx, 103 checks, 36 runs). Round 1's ten were "multiplicity" and "interaction"
  returns whose arithmetic was mostly right but which never reached the rule that makes the count or the combination matter.
  Corrections: sc_00198's QBI came from a long-term rental H&R Block cannot make QBI (13a 0, 5 FAILs) - now 30,000 of 1099-DIV box 5
  REIT dividends (same AGI); sc_00200 put a pre-minimum-retirement-age disability pension on 5b (i1040: line 1h - the H&R Block
  tester said so) and missed the EIC it earns (refund 396, not 199). Moved out of community-property states: TX (191, 194), AZ (198).
  New runs: 4 children - tax-limited split 4,146 + ACTC 4,654, and Schedule 8812 Part II-B (payroll tax 306 beats 15% 225; 16b
  exactly 5,100 still qualifies; 2 children 225) (191); three rentals as one passive pool - net -10,000 = the 10,000 allowance,
  -12,000 carries 2,000, MAGI 160,000 still offsets 8,000 (line 10) (192); two partially taxable pensions figured SEPARATELY (1,200 +
  600, not pooled 1,915) and age 60 vs 61 on the annuity starting date (193); excess SS when one employer stops at the base (3,720),
  its own over-collection not creditable, two W-2s with one EIN = one employer (1,860 not 2,102) (194); TI exactly 533,400 all 15%,
  10,000 over at 20%, a short-term gain pays ordinary rates but the same NIIT (195); a 5,000 gain at 0% still costs 510 through
  taxable benefits (196); excess SS counts as withholding for Form 2210, one employer withholds the 0.9% (25c 270), a 401(k) lowers
  box 1 only (197); QBI limit 20% x (TI before QBI - gain): exactly 6,000, then 5,000, and the gain drops into the 0% band (198);
  Schedule 1-A takes 1,500 off EACH of tips and overtime at MAGI 165,000 (18,000 not 19,500) and floors each part at 0 (199);
  Schedule R 75, 36 when the tax limits it, 0 with nontaxable SSDI on line 13a (200). New IRS text in _tools/irs_text: f2210f,
  f1040sr.
- us-tax-be FIX 5d7921b8: a pension form carrying annuityStreams[] (per-annuity Simplified Method) was 409'd by the aggregate-path
  flags PENSION_SIMPLIFIED_METHOD_INPUTS_MISSING (non-overrideable) and PENSION_BASIS_RECOVERY_PER_ANNUITY_LIMITATION; both now skip
  when streams are present. Mutation-checked (Hrb2025Sc00193Test B-D fail without it).
- us-tax-be FIX 2521fa22: Form 2210 line 6 / Form 2210-F line 12 include Schedule 3 line 11 (excess SS) with the withholding
  (i2210 line 6 "Also, Schedule 3 ... line 11"); sc_00197 A had been charged a 102 penalty. Mutation-checked (Hrb2025Sc00197Test A
  owes 2,663 without it). No e2e spec pins a penalty on a return with excess SS (grep of e2e/tests: line20-nonrefundable-credits and
  line31-other-payments have excess SS but no penalty assertion; form2210 specs have one W-2) - no e2e spec changed.
- us-tax-be 5cf568e2: Hrb2025Sc00191, 00192, 00194-00196, 00198-00200Test pin 29 tests (sc_00193's 4 and sc_00197's 3 came with the
  fixes) - green; TaxReturnComputeServiceTest, Sc*SqaScenarioTest and Hrb2025*Test 2,542 green in a clean report directory.
- Commit-message slip: sc_00193's hrb2025 commit says 11 checks; the xlsx has 10 (not amended).
- Open (owner): no per-annuity pension inputs in the UI (A29); line-1h disability pay not carried into EIC earned income (A30);
  Sc00200SqaScenarioTest still pins round 1's 5b routing (B7). H&R Block: Schedule R box 2 must be checked by hand in forms mode.

## 2026-10-15T18:00:00-04:00 - Round-2 QA scenarios sc_00181-00190 (MFS EIC prongs, MFS care credit, MFS pension / interest / rental / gain / IRA, filing status on a death, joint vs separate, HOH qualifying person) + one engine fix
- c:/us-tax-hrb2025: sc_00181-00190 written (md + xlsx, 111 checks, 32 runs). Round 1's ten were mostly right but sat on no
  boundary - five were "spouse's X on her MFS leg" returns that H&R Block files as plain single-income returns, and two lived in
  community-property states (NM, AZ) without applying it (moved to UT, OR). Corrections: sc_00181's round-1 refund (4,500) omitted
  the CTC 428 + ACTC 1,700 for her dependent son (H&R Block's 6,628 adopted); sc_00190's "HOH with the CTC omitted" was only legal
  for a child released on Form 8332 (now stated). New runs: the EIC separated-spouse rule's two prongs - moved out 06/30 yes, 07/02
  no, a written separation agreement yes (181); the care credit's MFS exception also needs over half the home's cost - apart but
  parents pay -> 0; she pays -> HOH + 1,200 (182); a pension in NIIT MAGI but not NII, MFS threshold 125,000: MAGI 130,000 -> 114,
  exactly 125,000 -> 0, and Ronald's own return graded (183); Form 8815 barred on MFS, 1,000 excluded on the joint return (a QTP
  contribution as the expense) (184); MFS rental loss: no allowance together, 12,500 cap apart all year, last 6 months not enough
  (185); MFS QDCG line 13 300,000: TI exactly 300,000 all 15%, 310,000 -> 10,000 at 20%, NIIT over 125,000 (186); MFS Form 2210
  110% line: 2024 AGI 75,000 no penalty, 75,001 -> 47 (187); a spouse who died 03/10/2025 allows MFJ, one who died in 2024 with no
  child leaves you single (188); a second earner on the joint worksheet (15,898) vs the same couple on two MFS returns (19,342)
  (189); HOH qualifying person - released child yes, 5-month child no, dependent parent in her own home yes + ODC (190). New IRS
  text in _tools/irs_text: f8815.
- us-tax-be FIX e1a06bef: the §469(i)(5) MFS rental special allowance ($12,500 / $50,000) now needs the ENTIRE-year "lived apart"
  fact (Social Security form, as line 6d and the MFS IRA range) instead of the filing-status last-6-months / legally-separated
  answer; no answer -> $0. sc_00185 D (moved out 05/15) had its 10,000 loss allowed. Mutation-checked (Hrb2025Sc00185Test D fails
  without it). No unit or e2e test pinned an MFS rental loss through the filing-status flag (the §469(i)(5) unit test passes explicit
  caps to computeRentalScheduleE; mfs-spouse-rental-income.spec.ts has rental income, not a loss) - no e2e spec changed.
- us-tax-be 6e16b4fc: Hrb2025Sc00181-00184, 00186-00190Test pin 31 tests (sc_00185's 4 came with the fix) - green;
  TaxReturnComputeServiceTest, Sc*SqaScenarioTest and Hrb2025*Test 2,506 green in a clean report directory.
- Commit-message slip: sc_00184's hrb2025 commit says 11 checks; the xlsx has 10 (not amended).
- Open (owner): no spouse date-of-death input (sc_00188); no community-property / Form 8958 split for MFS (sc_00184, 00185); the
  all-year "lived apart" fact is asked only on the Social Security form yet now also gates the MFS rental allowance (outstanding.md
  A25-A28, B5).

## 2026-10-19T00:00:00-04:00 - Round-2 QA scenarios sc_00171-00180 (IRA compensation, Saver's credit student / dependent / age, clean vehicle MAGI and MSRP, Roth phase-out, MFS attribution, MFS Social Security, MFS IRA range) + one engine fix
- c:/us-tax-hrb2025: sc_00171-00180 written (md + xlsx, 117 checks, 37 runs). All ten round-1 runs kept as Run A; sc_00171's
  round-1 refund was wrong (it omitted the 200 Saver's credit - H&R Block's tester caught it: 545 not 345) and sc_00180 lived in
  Arizona (community property; moved to Colorado). New runs: what COUNTS as IRA compensation - pre-2019 alimony yes (B 7,000, no
  excise; C 5,500 + 90), post-2018 no (D) (171); the Saver's student test is any part of 5 calendar months (Jan-Apr 30 eligible,
  to May 9 not), the tax limit (1,000 -> 628) and a 2024 Roth distribution on line 4 (250) (172); a dependent vs not (400 at the
  20% step), born 01/02/2008 no / 01/01/2008 yes (173); §30D MAGI exactly 150,000 yes, 150,001 no, an IRA deduction bringing
  152,000 of wages to 150,000 (2024 MAGI 155,000 so 2025 decides) (174); MSRP 55,000 yes, 55,001 no, an SUV at 60,000 under its
  80,000 cap - A and C are expected H&R Block FAILs (it never asks the MSRP, round-1 finding) (175); Roth phase-out 165,000 ->
  420, 164,999 -> 200 floor -> 408, 157,500 -> 210 (176); MFS attribution on shared items - a joint 1099-INT half out as a nominee
  distribution (Schedule B) and joint estimates divided as agreed (i1040 line 26) (177); MFS together: 85% of combined income
  when smaller (17,000 not 25,500) and one month together counts (178); MFS apart all year via H&R Block FORMS-MODE line 6d (round
  1's guided mode cannot - 5 FAILs measured the interview), the 34,000 tier (6,200), two days together lose it (179); MFS IRA
  range when only the spouse is covered, apart all year = single (+ Saver's 200), 700 inside the range (180).
- us-tax-be FIX 6d7a55ec: taxable alimony (pre-2019 instrument) is IRA compensation in the line-20 cap check and the Form 5329
  Part III limit (Pub. 590-A). Mutation-checked: Hrb2025Sc00171Test B and C fail without it (B flagged + 180, C flagged + 180
  instead of 90 - the fix's commit message says "C 210", a slip). No unit or e2e test pinned alimony together with an IRA
  (grep of e2e/tests: none) - no e2e spec changed.
- us-tax-be 4aeff3b5: Hrb2025Sc00172-00180Test pin 33 tests (sc_00171's 4 came with the fix) - green; TaxReturnComputeServiceTest,
  Sc*SqaScenarioTest and Hrb2025*Test 2,471 green in a clean report directory.
- Commit-message slips: sc_00173's hrb2025 commit says 12 checks; the xlsx has 11 (not amended). sc_00171 needed a follow-up
  (6f2f0d5) correcting its wrong-answer signatures (alimony ignored = 180 in B and C); expected values unchanged.
- Open (owner): the MFS "lived with spouse" fact feeds the IRA and Roth phase-outs but is asked only on the Social Security form;
  the Saver's born-after-January-1-2008 answer is asked, not derived from the date of birth.

## 2026-10-18T00:00:00-04:00 - Round-2 QA scenarios sc_00161-00170 (capital loss feeders, student loan MAGI, Schedule B feeders, tips phase-out, HSA months, Form 8814 ceiling, MFS EIC / education / itemizing, interest without a 1099) - no engine change
- c:/us-tax-hrb2025: sc_00161-00170 written (md + xlsx, 135 checks). The five "boundary" rounds (161-165) were right and are
  kept as Run A, but each duplicated a round-2 run, so the new runs test what FEEDS the boundary: a net -3,000 reached by a 1,000
  carryover and by a 500 box 2a distribution netted before the limit, and the distribution using up the limit (-2,500) (161);
  the SLI worksheet line 3 - an HSA (MAGI 97,000 -> 500) and an IRA deduction (98,500 -> 250) come off before the fraction
  (162); Schedule B required by 200 of accrued interest at a net 1,500, a box 2 penalty that is not netted (Sch 1 line 18) and
  box 3 Treasury interest (163); Schedule 1-A line 11 ROUNDS DOWN (opposite of the CTC): 150,999 keeps 25,000, 151,000 -> 24,900,
  160,500 -> 24,000 (164); HSA family limit by month - 8 months 5,700, the 6% excise on a 2,850 excess (171), the December 1
  last-month rule (165). The five "blocked" rounds (166-170) graded OUR 409s/flags, which H&R Block cannot show (166 was never
  even entered - NOT TESTED); round 2 grades the return: Form 8814 at 13,500 refused / 13,499 allowed / tax-exempt interest not
  gross income (166); MFS EIC barred living together, allowed after living apart the last 6 months, Single column at 30,000
  (3,261 not 4,328) (167); MFS education credit 0 and marital status on December 31 - divorce final 12/31 -> Single LLC 800,
  final 01/02/2026 -> MFS 0 (168); spouse itemizes -> MFS std 0 (itemize 2,000), but considered unmarried (spouse out since
  04/30) -> HOH 23,625; out 08/15 -> still MFS (169; Russell moved to New Hampshire so no sales-tax add-on); interest with no
  1099 - a private loan, 9 dollars from a credit union tipping 1,509 over the Schedule B line, and no statement at all (170).
  New IRS text in _tools/irs_text: i8863 (2025).
- us-tax-be 6783bcb2: Hrb2025Sc00161-00170Test pin 36 tests over 35 runs - green, no engine change needed;
  TaxReturnComputeServiceTest, Sc*SqaScenarioTest and Hrb2025*Test 2,434 green in a clean report directory. No e2e spec changed.
- Commit-message slip: sc_00162's hrb2025 commit says 16 checks; the xlsx has 13 (not amended). sc_00169 needed a wording
  follow-up (12b003b: the family rents, so no mortgage/property tax).
- Open (owner): with interest that has NO statement at all (sc_00170 D) the overrideable INTEREST_STATEMENT_UPLOAD_REQUIRED
  gate still fires and tells the filer to upload a 1099 - its trigger/wording may want to allow "no statement received" when
  the interest is entered as not-on-statements. Not changed (product gating, not an IRS computation).

## 2026-10-17T12:00:00-04:00 - Round-2 QA scenarios sc_00151-00160 (kiddie unearned income, age 65 / senior deduction, CTC for a QSS, IRA deduction, excess social security, mortgage limit, medical floor, Form 8959 Part II, NIIT) + one engine fix
- c:/us-tax-hrb2025: sc_00151-00160 written (md + xlsx, 141 checks); every round-1 run was right and is kept as Run A
  (all ten scored full marks in H&R Block, all ten sat exactly on a boundary, and several duplicated round-2 runs), so the new
  runs test what feeds the boundary: kiddie 2,700 - interest 2,750 less a 50 early-withdrawal penalty (line 1 = AGI 2,700, no
  8615), wages are earned income (std 3,450), interest 1,500 + dividends 1,300 together (8615 line 11 = 22) (151); born
  01/01/1961 vs 01/02/1961 with the Schedule 1-A Part V 6% cut at MAGI 100,000 (4,500) and none on a separate return (MFS box
  1,600) (152); a qualifying surviving spouse's CTC threshold is 200,000 (210,000 -> 3,900) and Form 8959's is 200,000 (153); IRA
  MAGI adds back student loan interest (80,000 -> 6,300) and at 50 the 8,000 limit and 80% (154); the $200 floor at 88,999 (200),
  none at exactly 89,000, never above a 100 contribution (155); excess social security 620 and figured per spouse on a joint
  return (156); Pub. 936 Table 1 pools a second home's loan against one 750,000 (0.750) and 375,000 MFS (157); medical exactly on
  the floor, 400 miles at 21 cents (84), one dollar over (158); Form 8959 Part II - wages exactly 200,000 leave a 0 threshold for a
  10,000 Schedule C (83), 195,000 leave 5,000 (38) (159); NIIT with a 5,000 short-term loss: -3,000 brings MAGI back to exactly
  200,000, then cuts NII to 1,000 where NII binds (38) (160; Vivian moved to Florida so no state tax is allocable on 8960 line
  9b). New IRS text in _tools/irs_text: f1040s1a (2025 Schedule 1-A), i8960 (2025, downloaded).
- us-tax-be FIX f6904003: deriveChildUnearnedIncome now subtracts the Schedule 1 line 18 early-withdrawal penalty (Form 8615
  Child's Unearned Income Worksheet line 2; i8615 Example 2). sc_00151 B (2,750 interest, 50 penalty) got Form 8615 and tax 142
  instead of 136. Mutation-checked (the pin test failed with 142 before the fix). No unit or e2e test pinned a kiddie return with
  a penalty (none corrected; no e2e spec changed).
- us-tax-be 14632292: Hrb2025Sc00151-00160Test pin all 35 runs - green; TaxReturnComputeServiceTest, Sc*SqaScenarioTest and
  Hrb2025*Test 2,398 green in a clean report directory.
- Commit-message slip: sc_00156's hrb2025 commit says 12 checks; the xlsx has 13 (noted in follow-up 91a2635, not amended).
- Open (owner, no fields added): no medical-mileage input (sc_00158 B types 6,084).

## 2026-10-15 - Removed the unemployment-repayment §1341 advisory (owner's decision)
The repayment entry means 2025 benefits repaid in 2025 (netted on Schedule 1 line 7, sc_00145); §1341 concerns
earlier-year income only, so the over-$3,000 advisory was misleading. Flags OTHER_INCOME_UNEMPLOYMENT_LARGE_REPAYMENT_
SECTION_1341_MAY_BE_BETTER_{TAXPAYER,SPOUSE} removed from us-tax-be, their checklist links from us-tax-ui; unit and e2e
tests assert no such flag. Also: line8-other-incomes.spec.ts had 4 stale pins of the line-24e behaviour (c377ab1b).

## 2026-10-17T00:00:00-04:00 - Round-2 QA scenarios sc_00141-00150 (MCC, PTC, backup withholding, rollover, unemployment, Form 2210, Additional Medicare, NIIT, Schedule B) + two engine fixes
- c:/us-tax-hrb2025: sc_00141-00150 written (md + xlsx, 139 checks), round 1's run kept as Run A (all ten were right), plus runs
  on the rule: MCC 2,500 capped at 2,000 with no carryforward, exactly 20% uncapped, the tax limit with a 525 carryforward, and
  the Schedule A cut (141; Alicia moved to Colorado to avoid H&R Block's Texas sales-tax add-on); PTC - round 1's H&R Block run
  never entered the 1095-A dollars (driver gap; Part III route + Forms-mode fallback given), plus excess APTC capped at 975 and the
  400% line: 60,240 (line 5 = 400, no limit, repay 3,716) vs 60,239 (399, limit 1,625) (142); backup withholding on a 1099-DIV and
  24% of 1099-B PROCEEDS on a 500 gain, all line 25b (143); the unreplaced 20,000 of a 60-day rollover and exception 01 for a
  12/31/1970 vs 01/02/1971 birthday (144); W-4V withholding plus a same-year repayment netted on line 7 and a prior-year 2,000
  repayment that is not deductible (145); Form 2210 at owe 855 vs exactly 1,000 (penalty 10) and 2024 AGI 150,000 vs 150,001
  (penalty 140) - tester told to choose "calculate myself" (H&R Block defaults to IRS-calculates) (146); Form 8959 with two
  employers neither withholding (360, nothing on 25c), box 5 not box 1, and the 125,000 MFS threshold (147); NIIT on MAGI not
  taxable income, tax-exempt interest in neither, alimony raising MAGI until NII binds (148); MFJ 210,000/90,000 with 90 withheld,
  joint wages under 250,000 with NIIT 3,420, qualified dividends still NII (149); Schedule B with interest and dividends each
  1,500 (no), a 300 nominee share (yes), tax-exempt interest (no) (150). New IRS text in _tools/irs_text: f8396, i8962, f8962,
  f1095a, f2210, i2210 (2025, downloaded - all four rate periods 7%), f8959, f8960, f1040sb, i1040sb (downloaded), f1040s2/s3.
- us-tax-be FIX 63b7840d: Form 8396 line 3 now reduces Schedule A interest inside buildScheduleA, before the standard-vs-itemized
  choice and the tax (sc_00141 C chose itemized 17,000 then cut it to 14,600; E's tax stayed on the unreduced deduction).
  Mutation-checked. No existing unit or e2e test pinned an itemizing MCC filer's line 15 (none corrected).
- us-tax-be FIX eb116838: the unemployment repayment entry is netted on Schedule 1 line 7 again (2025 i1040 line 7); sc_00322's
  line-24e routing (65d28bc2) misread Pub. 525 - its line-24e sentence is about Trade Act supplemental benefits. Mutation-checked
  (sc_00145 B). Tests that pinned the line-24e reading CORRECTED: TaxReturnComputeServiceTest (line 7 6,500; Schedule 1 aggregate
  250 / 630), Sc00322SqaScenarioTest Run C (rewritten, 9 -> 8 tests); e2e line8-other-incomes.spec.ts (365) and
  schedule1-pdf-render.spec.ts (4,600) corrected, NOT run. us-tax-ui abacdbd rewords the help text; it broke the build (an
  unescaped apostrophe) and 9128079 fixed it (tsc clean).
- us-tax-be 04c1e5fa: Hrb2025Sc00141-00150Test pin 37 tests over 38 runs - green; TaxReturnComputeServiceTest, Sc*SqaScenarioTest
  and Hrb2025*Test 2,363 green in a clean report directory.
- Commit-message slip: sc_00142's hrb2025 commit says 20 checks; the xlsx has 17 (not amended).
- Open (owner, no fields added): no input for a repayment of unemployment benefits received in an EARLIER year; the engine takes
  Form 5329 exception 01 as entered (no birth-year check).

## 2026-10-16T18:00:00-04:00 - Round-2 QA scenarios sc_00131-00140 (kiddie tax, Form 8814, EIC, CTC phase-out, dependent care, energy credits, clean vehicle) + one engine fix
- c:/us-tax-hrb2025: sc_00131-00140 written (md + xlsx, 143 checks), round 1's run kept as Run A, plus runs on the rule:
  Form 8615 - H&R Block's guided parent-taxable-income box refuses 100,000+, so round 1's 24% parent (A) gets a Forms-mode
  route and B-E are guided: 22% parent at 99,000 (line 9 worksheet - line 10 TAX TABLE 11,614 = 1,600, not 1,606), a parent
  straddling 96,950, interest 2,700 (no 8615) vs 2,750 (131); round 1's "exact" 99,000 substitution typed the parents' tax as
  11,608 (formula) - line 10 is their Tax Table tax, so line 11 is 720 not 726; parent in the 10% bracket -> line 17 wins (558);
  January 1, 2008 birthday = 18 with earned income over half support -> no 8615 (132); Form 8814 - ROUND 1'S REFUND WAS WRONG:
  it omitted the 10-year-old's 2,200 CTC (H&R Block applied it, refund 8,061); qualified dividends -> 8814 line 9 on 3a/3b at
  15%; the 10% branch at 2,000 (133); two-child EIC phase-out / phase-in and the 1,700-per-child ACTC cap (134); childless EIC
  born 01/02/2001 (no) vs 01/01/2001 (yes) vs 12/31/1960 (no) and the AGI lookup (135); CTC "or fraction" at 440,001, exactly
  400,000, fully phased out - ROUND 1'S W-2 BOX 6 WAS NOT REAL: the employer withholds 0.9% over 200,000, so 360 lands on line
  25c and A's refund is 11,204, not 10,844 (136); Form 2441 box 10 cutting the 6,000 limit and 21% at AGI 43,000 before the CTC
  (137); §25D tax limit + carryforward and batteries at 13.5 vs 2.9 kWh (138); §25C 1,200 aggregate, doors, the 3,200 maximum,
  no carryforward (139); §30D 2024 MAGI look-back, contract+deposit 09/29 vs 10/01, tax limit (140). New 2025 IRS text in
  _tools/irs_text (i8615, f8615, i8814, f8814, p596, Schedule EIC, i1040s8, f1040s8, i2441, f2441, p503, i5695, f5695, f8936,
  i8936).
- us-tax-be FIX c0e8205a: the childless EIC age test used the age on 12/31, so a filer born 01/01/2001 (treated as 25 under
  Pub. 596 Rule 11) lost the 649 credit; 25 now uses the day after the year end, 65 is unchanged. Mutation-checked (sc_00135
  Run C 0 without it). No existing unit or e2e test pinned a January 1 birthday (none corrected).
- us-tax-be 5e56ad9f: Hrb2025Sc00131-00140Test pin all 40 runs (the commit message says 42 - slip, not amended) - green;
  TaxReturnComputeServiceTest, Sc*SqaScenarioTest and Hrb2025*Test 2,327 green in a clean report directory.
- Commit-message slip: sc_00132's hrb2025 commit says 20 checks; the xlsx has 18 (not amended).
- Open (owner, no fields added): no Form 8615 "earned income more than half of support" input for an 18-year-old / student
  (the filer answers the kiddie question); no §25D utility-subsidy input (cost typed net). Sc00136SqaScenarioTest's Javadoc
  repeats round 1's "below the withholding trigger" claim (its seeds are consistent; comment left).

## 2026-10-16T12:00:00-04:00 - Round-2 QA scenarios sc_00121-00130 (IRD estate tax, bond premium, suspended misc, reimbursements, Tax Table vs worksheet, Form 2555, collectibles, AMT) - no engine compute change
- c:/us-tax-hrb2025: sc_00121-00130 written (md + xlsx, 153 checks), round 1's run kept as Run A (all ten were right),
  plus runs on the rule: section 691(c) as the recipient's share (IRA 200,000 caused all 40,000 of estate tax: 40,000
  withdrawn -> 8,000, 25,000 -> 5,000) and lost to the standard deduction (121); bond premium excess capped at the bond's
  prior interest - bought this year -> 0, carried forward - and premium equal to interest (122); suspended misc costs
  ENTERED this time (round 1's tester never entered them), the standard deduction they would have beaten, hobby income
  gross on 8j (123); box 12 code L not income, only the per-diem/mileage excess in box 1 (124); Tax Table at 99,999
  (16,909) vs worksheet at 100,000 / 100,049 (125); Form 2555 via H&R Block FORMS MODE (guided mode has no 2555
  questions - round 1 taxed all 80,000), the 130,000 cap and a 146-day bona fide residence limit (0.400 exactly, so line
  39 rounding cannot matter) (126); collectibles at 28% above 197,300 + NIIT, and beside a 15% stock gain (127); PAB
  preference is box 9 not box 8, and 1099-DIV box 13 (128); TMT 3 dollars under / 127 over the regular tax (129); ISO
  hold vs same-year sale (wages + 8949 code B, no AMT) and the exemption phase-out (130). AMT is Schedule 2 LINE 2 on the
  2025 form (round 1 said line 1). New IRS text in _tools/irs_text: p559, p463, p54, i2555, i6251, f6251.
- us-tax-be a552ad63: Hrb2025Sc00121-00130Test pin 29 runs - green; TaxReturnComputeServiceTest, Sc*SqaScenarioTest and
  Hrb2025*Test 2,287 green in a clean report directory. Advisory TEXT only (no compute change): the 691(c) advisory says
  "your share" (Pub. 559); BOND_PREMIUM_EXCEEDS_INTEREST states the Reg. 1.171-2(a)(4) prior-inclusions cap. No existing
  unit or e2e test changed.
- Not pinned: sc_00122 Run C - the engine deducts a this-year bond's 500 excess (expected 0); no field for the bond's
  prior inclusions (owner sign-off needed; see rules.md).
- H&R Block limits written into the mds: Form 2555 and ISO exercise-and-hold are Forms-mode only (sc_00130 gives the
  guided 41.255 "Enter Basis Adjustments" fallback, which lands on 6251 line 2k); collectibles need a placeholder 1099-B
  to open the collectibles screen (135.188547).

## 2026-10-16T06:00:00-04:00 - Round-2 QA scenarios sc_00111-00120 (investment interest, charitable ceilings and valuation, casualty/disaster losses, section 1033, IRWE, investment theft, claim of right) + two engine fixes
- c:/us-tax-hrb2025: sc_00111-00120 written (md + xlsx, 194 checks), round 1's run kept as Run A where it was right,
  plus runs on the rule: Form 4952 2024 carryover on line 2 and qualified dividends - out by line 4b, in by the line 4g
  election that then loses the 15% rate on the Schedule D Tax Worksheet (111); the 60% ceiling on AGI after an IRA
  deduction and a 2024 carryover fitted in after the year's gifts (112); appreciated property - only the 50% room left
  after cash (Pub. 526 Worksheet 2 line 28), and stock held exactly one year is short-term -> basis (113; H&R Block's
  round-1 B failure kept); a car sold for 450 deducts 500, a car the charity keeps (1098-C box 5a) deducts FMV (114);
  casualty - round 1 never stated the declaration date, which since the 2024/2025 relief acts picks the regime (H&R
  Block's classification defaults to qualified: 19,500 vs 11,900) - now pinned: declared 10/20/2025 -> $100 + 10%,
  07/18/2025 -> qualified $500 on Schedule A line 16, and a loss under 10% of AGI (115); the increased standard
  deduction vs itemizing either way, and the same storm outside the window (116); section 1033 - round 1's "full
  deferral" was a main home whose gain section 121 excludes anyway (and its stated 250,000 replacement basis was wrong:
  400,000); the test moved to condemned land: partial, reinvested under basis (the whole 150,000 gain, not the 200,000
  unspent, + NIIT 1,140), full (117); IRWE not other job costs, net of reimbursement, lost to the standard deduction
  (118); investment theft less a 5,000 recovery prospect, and a romance scam (no profit motive, i4684 / CCA 202511015)
  not deductible (119); section 1341 needs the prior-year tax - deduction when it saves more, credit (Schedule 3 13b)
  when the 2024 rate was 24%, and exactly 3,000 repaid gives nothing (120). Every W-2 states boxes 3-6.
- us-tax-be FIX 72398e81: donated vehicle sold for $500 or less capped at 500 (was the sale price), and a 1098-C with
  box 5a/5b no longer blocked as "no 1098-C" (FMV allowed). Mutation-checked (sc_00114 E gave 450, F blocked). No
  existing unit or e2e test pinned either case (Sc00300SqaScenarioTest's gate tests unchanged and green).
- us-tax-be FIX a1c02edb: hasAnyManualCapitalDetails now counts the section 1033 conversion inputs, so a conversion-only
  return is not blocked by CAPITAL_STATEMENT_UPLOAD_REQUIRED. Mutation-checked (sc_00117 B-D blocked without it). e2e
  schedule-a-itemized.spec.ts's section 1033 test passes overrideFlags:true, unaffected (not run).
- us-tax-be 0e865b76: Hrb2025Sc00111-00120Test pin all 41 runs - green; TaxReturnComputeServiceTest, Sc*SqaScenarioTest
  and Hrb2025*Test green (2,258 in a clean report directory; the 3,179 in 72398e81's message counted stale reports).
- Commit-message slip: sc_00112's hrb2025 commit says 24 checks; the xlsx has 22 (not amended).
- Open (owner, no fields added): qualified-disaster net loss, Form 4684 Section B line 38b, the charitable bucket
  (FMV vs basis) and the section 1341 method are typed figures, not computed from dates / facts (see rules.md).

## 2026-10-15T23:30:00-04:00 - Round-2 QA scenarios sc_00101-00110 (SALT cap, sales tax, real estate tax, mortgage interest, points) + one engine fix
- c:/us-tax-hrb2025: sc_00101-00110 written (md + xlsx, 143 checks), round 1's run kept as Run A where it was right,
  plus runs on the rule: SALT 500 over the cap and one 40,000 cap on a joint return (Form 8959 joint 250,000 threshold
  -> 0 tax while the employer's 450 is credited) (101); sales-tax table + Houston local ratio + car - H&R Block's
  round-1 3,385 was a local-rate entry failure, md now says to read the screen caption (combined 8.25 vs local 2.00);
  tax-exempt interest lifts the table income to exactly 100,000 (next row); receipts replace the table (102); phase-
  down: MAGI exactly 500,000 after an IRA deduction is not reduced, and a reduced cap above the taxes paid (103); MFS
  phase-down figured on 40,000 then halved - 12,500 at 300,000, 5,000 at 350,000 with no standard deduction (104);
  vehicle fee value part decides itemizing, a flat fee deducts nothing (105); sc_00106 - ROUND 1 WAS SLIGHTLY WRONG:
  real estate tax splits by DAYS (181/365 = 4,959, not 5,000; same refund so H&R Block's 13/13 hid it), the buyer of
  the old home paid the bill, and the new home's buyer deducts only her 184 days of a 12,000 bill she paid (106);
  mortgage loan closed 12/16/2017 gets 750,000, not 1,000,000 (107; round 1's H&R Block Run B 6,253 = W-2 without
  box 6, 6,433 with it); home equity interest none / all (addition) / 60% traced (108); seller-paid points deducted
  by the buyer, second-home points spread (109); refinance points: improvement share in full, a paid-off loan's
  leftover points released - but not with the same lender (110). Boxes 5/6 given on every W-2 over 200,000.
- us-tax-be FIX e9264a55: the MFS SALT cap phase-down cut the halved 20,000 by the full 30% (MAGI 300,000 -> 5,000);
  the 2025 Schedule A worksheet reduces 40,000 and halves line 9 afterwards (12,500). Mutation-checked (sc_00104 Run B
  fails without it). No existing unit or e2e test pinned an MFS phase-down value (none corrected).
- us-tax-be e6fe1c09: Hrb2025Sc00101-00110Test pin all 31 runs - green; TaxReturnComputeServiceTest, Sc*SqaScenarioTest
  and Hrb2025*Test green (3,161).
- Open (owner, no fields added): one mortgage-points entry (in full OR amortized) cannot hold a cash-out refinance's
  improvement share + spread rest or a paid-off loan's leftover points (sc_00110 B-D seed the year's figure); no
  optional sales-tax table, real-estate-tax day split or mortgage date (tier only) - typed results. Engine prorates the
  mortgage limit with an exact ratio; Pub. 936 Table 1 line 14 rounds to three places (sc_00107 uses exact ratios).

## 2026-10-15T20:00:00-04:00 - Round-2 QA scenarios sc_00091-00100 (Archer MSA, standard vs itemized, medical, SALT) + one engine fix
- c:/us-tax-hrb2025: sc_00091-00100 written (md + xlsx, 160 checks), round 1's run kept as Run A where it was right,
  plus runs on the rule: Archer MSA limit pro-rated by eligible months, and 0 once the employer contributes (91);
  itemized 15,800 / 15,700 either side of 15,750 and the Schedule A line 18 election (92); born 01/01/1961 is 65 at
  year end, 01/02/1961 is not, and the married 1,600 box (93); MFS spouse-itemizes zero survives age 65, no senior
  deduction on MFS, plus the control run - round 1's Texas SALT ambiguity (H&R Block 3,809) removed (94); dependent
  floor 1,350 and cap 15,750 (95); no overall itemized limit at 300k / 480k / 700k (no 2026 2/37 cut), W-2 boxes 5/6
  explicit so Form 8959 shows (96); medical exactly on the 7.5% floor and a floor on AGI after an IRA deduction (97);
  reimbursements: under the floor, a non-deducted 2024 bill's cheque, an excess from an employer-paid plan on 8z (98);
  sc_00099 - ROUND 1'S CONCLUSION WAS WRONG: filing separately to clear the medical floor costs the couple 2,599
  (12,745 vs 10,146 jointly), since the spouse must then itemize; all three returns graded (99); SALT line 5a built
  from withholding + prior-year balance (no interest) + 2025-paid estimates, and a total exactly on 40,000 (100).
- us-tax-be FIX a1b0cc88: Form 8853 line 5 ignored line 1 - an employer Archer MSA contribution now zeroes the filer's
  deduction (i8853 Part I (1); IRC 220(b)(5)). Mutation-checked (sc_00091 Run C deducted 950 without it).
  TaxReturnComputeServiceTest form8853_sectionsA_B_C_workedExample seeded employer 500 + own 1,000 and pinned a 1,000
  deduction; corrected to 0. e2e line8853-msa-ltc.spec.ts has no employer contribution (unchanged, not run).
- us-tax-be 18dad1d0: Hrb2025Sc00091-00100Test pin all 33 runs - green; TaxReturnComputeServiceTest, Sc*SqaScenarioTest
  and Hrb2025*Test green.
- Open (owner, no fields added): Form 8853 line 1 is not auto-read from W-2 box 12 code R; no Form 5329 Part VI
  (Archer excess) computation; the Schedule A form has no medical-reimbursement input (net is typed) and no line-5a
  breakdown (withholding / prior-year balance / estimates).

## 2026-10-15T14:00:00-04:00 - Round-2 QA scenarios sc_00081-00090 (other income and above-the-line adjustments) - no engine change
- c:/us-tax-hrb2025: sc_00081-00090 written (md + xlsx, 172 checks), round 1's run kept as Run A where it was right,
  plus runs on the rule: section 104 damages - interest on a tax-free award and non-physical emotional distress less the
  medical part (81); section 101(d) life-insurance installments, annual and 10-of-100 monthly, and the insured changed
  from a late spouse (contradicted Single) to a mother (82); jury pay vs the part turned over: all / none / part (83);
  K-1 1065 - ROUND 1 WAS WRONG: a materially participating partner owes SE tax (box 14A) and gets QBI net of half SE
  (owe 3,335, not 1,815); limited partner and a loss with QBI carryforward added (84); staking FMV becomes basis on a
  2025 1099-DA with no basis, short vs long term from receipt (85); educator 300 per ELIGIBLE educator, not the joint
  600, and reimbursements (86); student loan cap before phase-out at 0.200 / 0.900 of the 2025 85k-100k range (87);
  Form 3903 net of W-2 code P, the 217(k) civilian gate, and an excess on line 1h (88); alimony decree on 12/31/2018
  vs 01/02/2019 and a child-contingent part (89); Form 2106 reservist meals 50% and the 100-mile test, performing artist
  at AGI 16,100 > 16,000, and the no-child EIC round 1 omitted (90 - ROUND 1 WRONG TWICE, H&R Block was right).
- us-tax-be 386e67ba: Hrb2025Sc00081-00090Test pin 32 runs - all green, no engine change. Not pinned: sc_00088 Run D.
- Open (owner, no fields added): the app has no input for a Form 3903 excess reimbursement (line 1h, sc_00088 D) and
  no Schedule 1 line 12 category / reservist-distance / performing-artist AGI test - it trusts the amount typed
  (sc_00090 B, D). H&R Block computes SE tax only from K-1 box 14A and QBI only from box 20Z (sc_00084).

## 2026-10-15T09:00:00-04:00 - Round-2 QA scenarios sc_00071-00080 (passive losses, at-risk, RE professional, other income) + one engine fix
- c:/us-tax-hrb2025: sc_00071-00080 written (md + xlsx, 152 checks), round 1's run kept as Run A where it was right,
  plus runs on the rule: allowance phase-out mid-range, on the smaller-of crossover and 500 past it (71); §469(g)
  release on a sale to an unrelated buyer vs not sold vs sold to a brother - Curtis now does NOT actively participate,
  since at MAGI 90,000 the $25,000 allowance alone frees the same 22,000 (72); passive loss against K-1 passive income,
  with active participation, and with income larger than the loss - the rental entered as a rental, not a second K-1
  (73); §465 at-risk moved from a K-1 (no H&R Block guided entry, round-1 FAIL) to Schedule C line 32 / Form 6198,
  nonrecourse vs recourse (74); real estate professional - round 1's facts did not qualify (a W-2 employee's hours count
  only for a 5% owner), plus not-a-professional and no-material-participation runs (75); state refund worksheet:
  all / none / 400 over the standard deduction / 0 above the SALT cap, with every 2024 figure given (76); gambling
  losses capped at winnings and lost without itemizing (77); prize at FMV with and without a 1099 - round 1's "charity
  raffle" was gambling per Pub. 525, story changed to a radio contest, 2024 tax stated so Form 2210 is defined (78);
  COD insolvency capped at 9,000 of 15,000 (79); gift/inheritance excluded but interest on it and an inherited IRA
  (code 4, no 10%) taxed (80).
- us-tax-be FIX 97b29cd2: real-estate-professional status made every one of the owner's rentals nonpassive; an
  explicit No on the property's material participation now keeps it passive (§469(c)(7)/(c)(1)). Mutation-checked
  (sc_00075 Run C -40,000 without it). No existing test or e2e seed answers No; full unit suite green (3066).
- us-tax-be e92c832c: Hrb2025Sc00071-00080Test pin 28 runs - green. Not pinned: sc_00072 Run C (no related-buyer input).
- Open (owner): the rental form's material-participation control is Yes-only (Run C's No unreachable from the UI) and,
  when ticked by a non-professional, makes a long-term rental nonpassive; no §469(g)(1)(B) related-buyer question.

## 2026-10-15T03:30:00-04:00 - Round-2 QA scenarios sc_00061-00070 (Roth conversion, QCD, rentals, royalties, QBI, passive) + four engine fixes
- c:/us-tax-hrb2025: sc_00061-00070 written (md + xlsx), round 1's run kept as Run A where it was right, plus runs on
  the rule: conversion taxable with no 10% while a code-1 cash part pays it, and 6,000 of basis via Form 8606 (61); QCD
  $108,000 cap and the 70-1/2 gate (62 - H&R Block skipped the cap in round 1's sc_00264); 27.5-year depreciation with
  the mid-month first year and a roof capitalized as an improvement (63); $25,000 allowance over the cap and without
  active participation (64); vacation home at 30 / 14 / 15 personal days with annual expenses split by days (65);
  royalty depletion base excludes a lease bonus, and the 100%-of-property-income limit (66); converted home, lesser of
  adjusted basis or FMV either way, April conversion (67); rental to a daughter below / at / split fair rent (68 -
  ROUND 1'S EXPECTED WAS WRONG: it netted the rent to 0; 280A(e) gives a 0/365 rental share, so the 9,600 is income);
  rental QBI with the income limitation binding and net capital gain taken back out (69 - H&R Block needs the
  forms-mode safe-harbor checkbox); allowance gone at 150,000, 500 at 149,000, MAGI without the IRA deduction (70).
  Depreciation bases chosen so the IRS percentage table and the 1/27.5 formula agree.
- us-tax-be FIX 3d68b702: QCD excluded at any age; now gated on 70-1/2 (+ advisory, UI link 54716f3). Three
  TaxReturnComputeServiceTest fixtures and eight e2e tests in line4abc-ira-income.spec.ts seeded QCDs for owners born
  1960-1992; DOBs moved to 1950 (e2e NOT run).
- us-tax-be FIX 7927b4de: Form 8582 printed a non-active rental on line 1; now line 2 (print only).
- us-tax-be FIX cf1012a7: automatic 15% royalty depletion capped at the property's income before depletion.
- us-tax-be FIX 832a624a: below-market rental with no fair-rental days - rent is income, no rental deductions
  (was netted to 0). TaxReturnComputeServiceTest's below-market case pinned 0; corrected to the rent.
- us-tax-be 162fec8a: Hrb2025Sc00061-00070Test pin all 30 runs - green; each fix mutation-checked; full unit suite green.
- Open (owner): the rental form takes rental-share expenses (no day split by rentalDays/personalUseDays) and has no
  lease-bonus field; both pin tests enter the filer's own figures.

## 2026-10-14T23:55:00-04:00 - Round-2 QA scenarios sc_00051-00060 (IRAs) + three engine fixes
- c:/us-tax-hrb2025: sc_00051-00060 written (md + xlsx), round 1's verified run kept as Run A, plus runs on the rule:
  QDRO exception 06 applies to the plan payout but NOT to the same money from an IRA, and the alternate payee's partial
  rollover (51); not-covered deduction stays 7,000 at wages 120,000, and 8,000 at 50 on 12/31 (52); Pub. 590-A
  Worksheet 1-2 round-UP to $10 (84,321 -> 3,280) and the $200 floor (88,800) (53); no deduction AT 89,000 (no $200
  floor) and Form 8606 basis 7,000 + 14,000 -> 21,000 (54); spousal IRA with the covered husband on 126k-146k and the
  non-covered wife on 236k-246k (55; round 1's original Expected missed the 400 Saver's credit H&R Block found); Saver's
  credit at AGI 47,501 (0.2) and capped at the tax (56); 6% excise on the pay limit and the due-date correction with
  earnings on 4b (57); line 4a blank + the 59-1/2 PAYMENT date inside one year (58); Form 8606 pro-rata over ALL IRAs,
  an emptied IRA (0.800) and the 1.000 cap (59 - round 1 was blocked in H&R Block guided mode, which never asks the
  basis amount; round 2 routes lines 2/6 through forms mode); first-home exception capped at 10,000 vs uncapped
  education exception (60).
- us-tax-be FIX 474c329b: the Simplified Method (per-person and per-stream) divided the REMAINING cost by the table
  number after a prior-year recovery; the worksheet divides the ORIGINAL cost and caps at the cost not yet recovered
  (26,000 / 2,400 recovered: 1,200, was 1,089). Hrb2025Sc00044Test runs D/E/F; TaxReturnComputeServiceTest's
  prior-recovery case and e2e line5abc GAP A6.5c (not run) corrected to the worksheet figures.
- us-tax-be FIX 96b6dea3: the §4973 6% excise used each spouse's own compensation, so a valid spousal IRA was charged
  420; now §219(c) combined compensation on a joint return (sc_00055).
- us-tax-be FIX 246c0666: Form 5329 exception 09 (first home) capped at $10,000 on the IRA path (sc_00060).
- us-tax-be 68c3c58f: Hrb2025Sc00051-00060Test pin every run - all green; each fix mutation-checked.

## 2026-10-14T23:30:00-04:00 - Round-2 QA scenarios sc_00041-00050 (retirement income)
- c:/us-tax-hrb2025: sc_00041-00050 written (md + xlsx), round 1's verified run kept as Run A where it was right, plus
  runs on the rule: s.1041 divorce transfer with a 4-month holding period that only tacking makes long-term, and a LOSS
  property where s.1015(e) keeps the gift rule out (41); s.1035 exchange (code 6) vs surrender + re-buy (42); fully
  taxable pension with 5a blank, box 2a blank/2b + no cost, and a code-3 disability pension before minimum retirement
  age on line 1h (43); Simplified Method Table 1 vs Table 2 at the 120/121 combined-age edge (44); s.72(t) full / none /
  partial medical exception 05 at 7.5% of AGI (45); direct rollover vs 60-day rollover with the 20% withheld made up or
  not (46); Form 4972 with the Schedule R credit H&R Block found, and DOB 01/01/1936 vs 01/02/1936 (47); designated
  Roth box 11 2020 qualified vs 2021 nonqualified (48); 2025 Form 5329 Part IX 52a/52b - 25% / 10% corrected in the
  window / RC waiver, which resolves round 1's 25%-vs-10% H&R Block disagreement (49); PSO exclusion = smaller of
  premiums or 3,000, and the PSO gate (50).
- Round-1 corrections carried in: line 5a blank for fully taxable pensions (43, 45, 49) and for Form 4972 Part III (47);
  code-6 line 5a not graded ("need not be reported", 42); Form 2210 ambiguity removed by withholding changes (41, 45).
- us-tax-be: Hrb2025Sc00041-00050Test pin every run except sc_00049 Run C (no waiver input) - all green, no engine change.
- Observed, not fixed: the Simplified Method (per-person and per-stream) divides the REMAINING cost by the expected
  payments when a prior-year recovery is entered; the worksheet divides the ORIGINAL cost (line 4) and caps at the
  remaining cost (lines 7-8). First-year annuities (all of sc_00044) are unaffected.

## 2026-10-14T18:00:00-04:00 - Round-2 QA scenarios sc_00031-00040 (capital gains and losses) + INHERITED 1099-B fix
- c:/us-tax-hrb2025: sc_00031-00040 written (md + xlsx), each keeping round 1's verified run as Run A and adding runs
  that test the rule the title names: ST gain stacking under LT in the 0% band (31), the $3,000 limit on/under the line
  (32), netting in three directions incl. QDCG line 3 = smaller of Sch D 15/16 (33), partial wash sale (34), inherited
  step-up and long-term by law (35), gift dual basis (36), section 1244 via Form 4797 36.646 + the $50,000 ceiling (37 -
  round 1 was blocked), worthless stock deemed sold 12/31 deciding the term (38), carryover character (39), MFS $1,500
  limit on/under the line (40). Expected values from the 2025 Tax Table / QDCG worksheet / Schedule D instructions.
- us-tax-be: Hrb2025Sc00031-00040Test pin every run (all green).
- FIX (found designing sc_00035): derive1099BBox dropped a 1099-B whose date acquired was "INHERITED" (as the Form 8949
  instructions direct) when box 2 was blank - the text does not parse as a date, no term was derived, and the sale
  vanished from Schedule D. "INHERITED" now means long-term (IRC 1223(9)). Mutation-checked: the sc_00035 test fails
  without the fix (Schedule D line 15 = 0).

## 2026-10-14T10:30:00-04:00 - The 3 flaky tests from the 2026-10-13 full regression
- `k1-1065-ui-roundtrip`: the EIN typed first was blank on save while the TIN and box 1 typed after it were kept. The K-1 GETs
  its active entry after "#1" appears and on arrival copies it onto every box (entryLoaded -> syncFormToPdf), wiping what was
  typed meanwhile. Users are shielded by the "Loading data..." overlay; Playwright's fill() is not. The three K-1 round-trip
  specs (1041/1065/1120-S) now wait for that GET before typing. 6/6 green.
- `line1z-total-wages:382` (empty compute response body) and `line4abc-ira-income:111` (500 from GET /api/statement-selection):
  the backend logged neither a 500 nor a slow request during the run, so both came from the UI dev server's proxy, like the
  8814 ETIMEDOUTs. Each passed 3/3 on repeat; no change.

## 2026-10-14T03:40:00-04:00 - Full e2e regression (1609 passed) and fixes for its failures
Full regression on 2026-10-13: 1609 passed, 7 failed, 3 flaky, 11 skipped (4.4h). Re-run individually:
- Five passed: four Form 8814 tests (ETIMEDOUT to the dev UI on :4200 mid-run) and car-loan refinancing ("Failed to fetch" while seeding).
- `line1e-dependent-care.spec.ts:413` failed every time. Since the start page reopens the last page (2026-10-12) a reload keeps the
  person tab, so after the Spouse step the test stayed on the Spouse tab, whose Tax Return section has no Form 2441. The spec's
  `setFilingStatus` helper now switches back to the taxpayer tab after its reload.
- `tax-scenarios.spec.ts:86` (dependent tab): app race. The shell restores the last page only after three startup loads; a tab the
  user clicked meanwhile was overridden. `restoreStartPage` now leaves alone a tab or page opened while it was loading (us-tax-ui shell).
- `get-started.spec.ts:164` flaked once with no Spouse tab after reload (Fix then did nothing); the test now checks the spouse seed
  succeeded and waits for the Spouse tab.
Affected specs re-run green: line1e-dependent-care, tax-scenarios, start-page, get-started (38 passed).

## 2026-10-13T20:40:00-04:00 - Your checklist: Fix links for messages about a dependent or a statement

Of the 17 checklist messages that had no button, 14 now link. A flag can now say where it is fixed:
`TaxReturnFlag` gained two optional fields (sent only when set), `dependentId` and `formId`.
- **About one dependent** (the dependent id is set where the compute knows the child): `DEPENDENT_FAILS_GROSS_INCOME_TEST`,
  `SCHEDULE_8812_CTC_DEMOTED_TO_ODC`, `SCHEDULE_8812_CTC_CHILD_SSN_UNVERIFIED` and `FORM8814_CHILD_NOT_QUALIFYING` open
  the dependent's profile on their tab; `FORM8814_CHILD_FILED_JOINT_RETURN`, `..._WITHHOLDING_OR_ESTIMATED_PAYMENTS`,
  `..._GROSS_INCOME_TOO_HIGH`, `FORM8814_SUPPRESSED_CHILD_FILES_OWN_RETURN` and `FORM8814_MFS_ELECTION_REVIEW` (first
  child) open Child's int. & dividends there. Shown as "In: <name> › <form>"; the shell switches tab
  (`FormNavigationService.openForDependent`). Without an id (a hand entry matching no dependent) there is no button.
- **About a statement:** `STATEMENT_DOES_NOT_BELONG_TO_FAMILY` carries the statement's form id. Such a statement is listed
  on no tab (its SSN matches no one), so the button opens it directly when it is chosen.
- **Other links:** `SCHEDULE_8812_ITIN_ACTC_BLOCKED` -> Family Head Identification; the §461(l) carryforward notice ->
  Form 172; the Social Security excess-repayment notice -> SSA-1099; the Form 2555 FTC-reduction notice -> Foreign tax
  credit.
- **Still no button (3):** `LINE7B_INTERNAL_INCONSISTENCY` (internal error), `DEPENDENT_OWN_RETURN_EIC_AND_SELF_CLAIM_DISALLOWED`
  (raised only on a dependent's own return), `SCHEDULE_H_FUTA_CREDIT_REDUCTION_NOT_APPLIED` (no sidebar form has that input).
- e2e `get-started.spec.ts` +1 test (a dependent message opens their tab, a misattributed W-2 opens the W-2); unit
  assertions on the Form 8814 flags' dependent id.

## 2026-10-13T18:40:00-04:00 - Deployed (manual workflow_dispatch): Get started + Your checklist

Owner asked: start Azure Postgres, deploy, stop it. `pg-ustax-9u14g` started (Stopped -> Ready). Backend run
38476695676 -> Container App revision `ca-ustax-be--0000560` (image `f5497c8`, V271 + V272 applied, readiness 200,
`/api/statement-selection` 401 unauthenticated). Frontend run 38477596489 -> www.taxbeans.com (bundle `main-P6R7CNVC.js`
contains the checklist and statement-selection code). Includes: tax scenarios, the Get started section, Your
checklist (with Fix links, done mark), statement picks on the server, one list of required fields. Postgres stopped
afterwards (state Stopped), so the live site cannot load data until it is started again.

## 2026-10-13T17:45:00-04:00 - Your checklist: links from messages, statement picks on the server, one list of required fields, done mark

- **Messages link to the form that fixes them.** `us-tax-ui/src/app/data/flag-form-links.ts` maps every flag code the
  compute can raise (232, from every `new TaxReturnFlag` site in TaxReturnComputeService; 215 to a form, 17 with no
  single form, + 61 prefix entries for `…_TAXPAYER/_SPOUSE` codes) to its sidebar form. A message shows "In: <form>"
  and a Fix (must-fix) / Review (note) button; a form of the other person opens on their tab
  (`FormNavigationService.openForPerson`, handled in the shell). A statement not chosen yet goes to Select statements.
- **Select statements is kept on the server per user and tax year** (V272 `pf_statement_selection`,
  `GET/PUT /api/statement-selection`, registered in `UserDataBulkDelete`). It was browser-only (localStorage
  `statementFormsSelection`); an existing browser copy is moved up once on sign-in, then removed. Loaded at sign-in
  (before the start page is restored) and after a year switch. e2e helpers now set it through the API.
- **One list of required fields.** The ten Personal forms (identification, address, filing status, digital assets,
  presidential campaign, third party designee; taxpayer and spouse) build their "Saved. Some required fields are not
  completed yet: …" message from `utils/personal-requirements.ts`, the same rules the checklist uses
  (`missingInForm`, `savedStatusFor`). A form's own extra checks (e.g. SSN format) still warn.
- **Done mark.** When every row is done, every statement entered, every scenario form started and nothing must be
  fixed, the checklist says "Everything on your checklist is done" and step 4 in the step bar gets its check
  (`ChecklistStatusService`, per year and tab, as of the last check this session).
- e2e `get-started.spec.ts` +2 tests (server-kept picks incl. migration, other browser and per year; the done mark) and
  the spouse message's Fix link; `start-page.spec.ts` debounce race fixed (waits for page and year together).

## 2026-10-13T15:00:00-04:00 - Get started > Your checklist (steps 2 and 3 of the guided start)

- Step 4 of Get started (Family Head and Spouse): **Your checklist**, built from the steps before it:
  - **Your information**: each Personal form Done / Incomplete ("Still needed: …") / Not started, from its saved
    data. Rules in `us-tax-ui/src/app/utils/personal-requirements.ts` mirror each form's own "complete" check
    (identification, address, filing status, digital assets, presidential campaign, third party designee); e2e pins
    the checklist against the form's save warning.
  - **Statements to enter**: each statement in this tab's Statements section, "N entered" / Not started. An empty
    entry (created when a statement form is opened) and entries for another person's SSN don't count.
  - **Forms to fill in**: the forms the ticked scenarios point to, with the scenarios that need each; input forms
    Started / Not started, previews (tax-return-*) "View".
  - **Messages from your return**: the flags the next compute would raise (`GET /api/tax-return/flags`), must-fix first.
- Backend: `GET /api/statements/entry-summaries?formIds=` (per entry hasData + recipientTin;
  `StatementDataService.hasEnteredData`, unit `StatementEntrySummaryTest`) and `GET /api/personal/forms?formIds=`
  (several personal forms in one request; non-personal ids skipped). No migration.
- Opening a form from a link (checklist, scenario) now expands its sidebar section.
- e2e `get-started.spec.ts` 4/4, `tax-scenarios.spec.ts` 4/4; sidebar/smoke sweep 126/127 before the last fix
  (spouse Prev test race, fixed and green). Not deployed.

## 2026-10-13T14:00:00-04:00 - Sidebar "Get started" section (step 1 of the guided start)

- New first sidebar section **Get started**: 1 Last year 1040 (moved from Personal) → 2 Select tax scenarios →
  3 Select statements (moved from Statements; label now plural). Family Head gets all three; Spouse gets 2 and 3;
  a dependent tab has no Get started and keeps its statement picker under Statements.
- Numbered steps at the top of each Get started page (`get-started-steps`); a step shows a check once it has
  something in it: 1040 uploaded or skipped, a scenario ticked, statements chosen (the default W-2 alone doesn't
  count). Prev/Next walks the steps and continues into Personal (Next from Select statements → Identification).
- Adding a statement (picker or scenario) opens the collapsed Statements section so the new entry is visible.
- e2e: new `get-started.spec.ts` (2); updated personal-form-actions, prior-year-1040, statement picker page object,
  tab-as-person-scope smoke, tax-scenarios. Not deployed.
- Next (step 2 of the plan): a "Your checklist" page built from scenarios + statements.

## 2026-10-13T13:00:00-04:00 - Statements > Select tax scenarios (catalog from J.K. Lasser 2025)

- New first item under Statements: "Select tax scenarios". It has 107 life and tax situations in 12 categories
  (category chips with selected/total counts, plus search), derived from *J.K. Lasser's Your Income Tax 2025*
  (research: `ux-research/tax-scenarios-from-lasser.md`; catalog: `us-tax-ui/src/app/data/tax-scenarios.ts`).
- Ticking a scenario pre-selects its statements in Select statements and lists, under "Your scenarios", links to
  its statements and to the forms to fill in (spouse tab links the -spouse twin). Nothing is hidden; unticking keeps
  the statements (they may already hold entries). Not offered on dependent tabs.
- Saved on the server per user and tax year: V271 `pf_tax_scenarios` (uid, tax_year unique), `GET/PUT
  /api/tax-scenarios`; registered in `UserDataBulkDelete`. Unit `TaxScenariosResourceTest`; e2e
  `tax-scenarios.spec.ts` 4/4 (incl. a load-vs-tick race, mutation-checked).
- Not deployed (deploys are manual).

## 2026-10-13T12:20:00-04:00 - Deployed (manual workflow_dispatch): Personal form actions bar + remembered tax year

Backend run 38426484142 -> Container App revision `ca-ustax-be--0000559` (image `efaa19b`, V270 applied, readiness
200). Frontend run 38427632666 -> www.taxbeans.com. Includes: shared Prev / Save / Next bar on every Personal form,
save-with-missing-fields warning, Next follows the sidebar, "Presidential election campaign", remembered tax year,
stacked 1040 images, 1040 fixes. Production smoke: the bar renders on Identification; `/api/ui/last-page` returns
taxYear 2025; no 5xx. Deploys were triggered through the GitHub REST API (gh is not installed). Azure Postgres was
started by the owner and left running.

## 2026-10-12T23:59:00-04:00 - Remember the last tax year; deploys manual; no Postgres start/stop

- The last page record (`user_ui_state`) now also keeps the tax year (V270 `last_tax_year`); a new session reopens
  that year (applied before any data loads) and then the page. e2e start-page.spec 5/5.
- Deploy-on-push disabled in us-tax-be, us-tax-ui and us-tax-admin-ui: deploys are manual (workflow_dispatch).
  Not yet deployed: V269/V270 server-side last page + year are deployed up to V269; V270 + this UI change await a
  manual deploy.
- Owner's rule: Claude no longer starts or stops Azure Postgres on push, deploy, testing or cleanup;
  `/clean-user-data -Target prod` now refuses when the server is stopped instead of starting it.

## 2026-10-12T23:00:00-04:00 - Deployed: stacked 1040 images read as separate pages

A single image holding both pages of a 1040 (e.g. `rivera-1040-2024-merged.png`, 1275x3300) was read by Azure
`prebuilt-tax.us.1040` as ONE page, so only page 2 was used (occupation, phone/email, designee) and page 1 (names,
SSNs, address, filing status, dependents) was lost - the form said it had filled the Personal forms, but the main
fields stayed empty. `StackedPageSplitter` now splits a tall image by the letter aspect ratio (11/8.5) into a
multi-page PDF before analysis (stored file unchanged), and the form warns plainly when page 1 could not be read.
Backend `17c24ba`, UI `9ea213c`. Unit `StackedPageSplitterTest`; e2e stacked-PNG case (4/4); on production the
merged image filled page-1 dependents and the page-2 designee with no warning. Note: a 110-dpi render lost the SSN
digits; ~150 dpi works. Azure Postgres stopped again afterwards.

## 2026-10-12T22:20:00-04:00 - Deployed: last page kept on the server

The start page's "last page" moved from browser storage to the server so it follows the user across devices:
`/api/ui/last-page` (GET/PUT/DELETE) on a new per-user table `user_ui_state` (V269, one row per user, not per tax
year; cleared by the user-data reset so a reset account starts at Last year 1040). The UI saves debounced (600 ms)
without the loading overlay and drops the old browser copy. Backend `3bee83a` + UI `e327056`.

Verified: unit `UiStateResourceTest`; e2e `start-page.spec.ts` 4/4 locally (incl. a second browser context opening
on the remembered page); on production a second, separate browser signed in and opened on the page saved by the first.
Note: two local start-page runs failed while the Angular dev server was hot-reloading files I had just edited; not
reproducible in 5 subsequent runs (9/9 each). Azure Postgres stopped again afterwards.

## 2026-10-12T21:15:00-04:00 - Deployed: start page, Last year 1040 fixes, clean-user-data skill

- **Start page** (UI `ce502c9`): the first session opens Personal > Last year 1040; later sessions reopen the page
  (and person tab) the user was last on, remembered per Firebase uid in browser storage. With nothing remembered, a
  user who has already uploaded or skipped last year's 1040 (e.g. a returning user on a new device) starts at
  Identification. e2e `start-page.spec.ts` 3/3; related specs (person tabs, header dialogs, DOB, Last year 1040) 16/16.
- **Backend `eb7989b`** (Container App, 100% traffic, readiness 200): designee PIN masked as a PIN in the pre-fill
  summary; a spouse SSN alone no longer implies MFJ (MFS returns fill the spouse SSN box too).
- **`/clean-user-data` skill** (`us-tax-be/.claude/skills/clean-user-data`): deletes one user's data except the
  account, catalog-driven, dry run by default; used to empty the e2e test account in the local database.
- Test files: 2024 Form 1040 PDF/PNG for HOH (Rivera), MFS (Chen) and MFJ (Sample) in `test_statements/prior-1040`,
  flattened because the IRS form's XFA layer made filled copies look blank in Adobe Reader / Edge.

Azure Postgres stopped again afterwards.

## 2026-10-12T20:20:00-04:00 - Deployed: Last year 1040 + a CORS fix that had broken prod since July

Deployed to production (Azure, via the GitHub Actions pipelines on push to main):
- Backend Container App `ca-ustax-be`: revision on image `ustax-be:5db7380` serving 100% (Liquibase V268 applied;
  readiness 200). Frontend Static Web App: bundle with the new Personal > Last year 1040 form.
- Production smoke test (shared e2e test account, fictional data) at https://www.taxbeans.com: upload of the sample
  2024 1040 -> 200, Azure read it, pre-fill applied (identification, spouse, address, filing status, dependent),
  key amounts shown (AGI $143,050, refund $967); the upload was then removed.

**★ Found while testing: production could not load or save ANY personal data.** Every cross-origin call from
www.taxbeans.com failed its CORS preflight with "Request header field x-tax-year is not allowed". The multi-year
year selector (2026-07-27) added the `X-Tax-Year` header to every personal/statement call, but `CorsFilter` -
the real CORS policy; the `quarkus.http.cors.*` properties are NOT read ("Unrecognized configuration key") -
still allowed only `Authorization,Content-Type`. Local dev never saw it because it goes through the same-origin
dev proxy, and no e2e runs against prod. Fixed in `CorsFilter` (+ `PATCH`, which the admin dashboard needs and
which was likewise only in the ignored properties). Lesson: a header added to every request needs a cross-origin
check, and the dev proxy hides CORS entirely.

Azure Postgres `pg-ustax-9u14g` stopped again afterwards (prod is on-demand; local testing uses the Docker DB).

## 2026-10-12 - Personal > Last year 1040: upload last year's return, pre-fill the Personal forms

A new first item in the Personal sidebar section, above Identification. The user uploads last
year's Form 1040 as a PDF or an image (PNG/JPG, a phone photo works); the backend sends it to Azure
Document Intelligence's **`prebuilt-tax.us.1040`** model, stores the file and the normalized
extraction, and fills the Personal forms on a **fill-blanks-only** basis - a value the user already
entered is never overwritten, so "Fill in blanks again" is always safe. The page shows the uploaded
document beside a "Filled in for you" summary (per form, with Review links) and last year's key
amounts. Skipping records the choice and sends the user on to Identification.

Pre-filled: taxpayer + spouse identification (names, middle initial, SSN, occupation), address with
phone/email from the signature block, spouse address "same as yours", filing status, third-party
designee, and dependents (added when not already listed, matched by SSN then name). **Not**
pre-filled, deliberately: date of birth (not printed on a 1040), IP PIN (reissued yearly), MFS (it
splits the household into two returns in the UI), digital assets / presidential campaign (they are
about this year), and a dependent's CTC/ODC eligibility (it changes with age).

Backend: V268 `pf_prior_year_1040` (one row per uid+year; file in BYTEA, extraction + prefill summary
as JSON text); `PriorYear1040Parser` (pure, unit-tested), `PriorYear1040Prefill`,
`PriorYear1040Resource` at `/api/prior-year-1040` (GET state, POST upload/apply/skip, GET file,
DELETE). The Azure REST client moved out of `DocumentExtractionResource` into a shared
`AzureDocumentAnalyzer`; statement extraction re-verified (W-2: 200, 22 fields). Identifiers leave
the server masked in the state payload; the raw Azure response is not logged for this endpoint.

Two things the real Azure output taught (both now unit-tested on the real shape):
- **`valueAddress.streetAddress` includes the unit** ("100 MAIN ST Apt. 4") even though the 1040 has a
  separate Apt. box - the street is built from `houseNumber` + `road`, and "Apt."/"Unit"/"#" is stripped
  from the apartment value.
- **The filing-status checkbox is often unread on a photo**, but the spouse line is printed "If joint
  return, spouse's first name...", so a spouse there means MFJ.

Tests: 7 unit (`PriorYear1040ParserTest`), backend suite 2904/2904; e2e `prior-year-1040.spec.ts`
3/3 against live Azure (PDF, PNG, skip) incl. the fill-blanks-only re-apply and no duplicate dependent.
Fixtures: a filled 2024 IRS Form 1040 for the fictional Sample household (`e2e/tests/fixtures/prior-1040`).


## 2026-10-05 - The filer block: Azure's value REGIONS were wrong, not its labels

The three values left over from yesterday's render work, and the diagnosis turned on one
observation: **the RECIPIENT's identical three boxes are correct on both renders.** Same labels,
same config fan-out, different outcome - so this was never a label-matching problem.

On the PDF render Azure's value REGIONS for the filer block are scrambled:

    Telephone number   "12 555"            the "12" is the Room or suite no., not the phone
    Country            "+1 545 1234 US"    half the phone, then the country
    ZIP                "KOKO 12345"        KOKO is box 1b's digital asset name

Each of these is a single-line box whose value is printed **directly beneath its caption**, so
`readCellUnderLabel` settles all three - it seeds on the word under the label and stops at a gap
wider than a label height. The measured margins are comfortable:

    widest gap inside the phone   0.040in = 0.35 label heights
    "US" -> "12345"               0.640in = 5.57 label heights

KOKO is excluded **twice over** - it is right of the caption AND above its value band - which is
precisely what Azure's region was not. `findLabel` already orders its hits down the PAGE rather
than by OCR order, with a comment saying why, so `nth=0` is reliably the filer's copy. These
OVERWRITE rather than fill blanks, because a value read from its own printed cell beats a region
Azure mis-assigned - and on the PNG, where the pass is already right, geometry returns the same
three values, so that render cannot regress.

### ★ Both renders of both forms are now BYTE-IDENTICAL, values included

    1099-da   58 fields = 58     (was 48 vs 58, with a misattribution and three bled values)
    w-2g      38 fields = 38     (was 36 vs 38)

Every filer and recipient value matches the fixture's own AcroForm. And the comparison itself is
sound this time: the listing is JSON-escaped, **one field per line**, which is the mitigation the
*don't diff a human-readable listing* rule demands - a newline inside a value cannot split a
record and fake agreement, which is how I once published a false "14 byte-identical".

Five render-difference items came out of this three-day sequence and **all five are closed**: the
1099-DA state grid (which was a misattribution, not a loss), box 12a, the W-2G winner ZIP and
city, the three 1099-DA checkboxes, and now the filer block. Each had a DIFFERENT cause -
order-dependence, a stop-word guard firing on its own anchor, a merged caption, a one-slot config
fan-out, an unpaired selection mark, a mis-assigned value region - which is the real lesson:
**"the PDF render is worse" was never one bug, and never a recall problem.**

5 new tests in the form's existing cell-geometry class, both renders in their own units, plus the
gap margins. Mutation-tested: widening the cell-end gap tenfold reddens 2, and extending the
value band ABOVE the label - which makes KOKO eligible, exactly what Azure did - reddens 2. Unit
suite **2,897 / 0**. Reload trigger **v98**. Commit `4c8eb5e3`.

Open, in priority order: **deskewing input before sending it to Azure** - the production readers
misattribute ten values on a 3-degree-rotated 1042-S, the failure a user cannot see; **Azure's
per-field confidence is still discarded**; **a value-level render diff for every other fixture**,
now that the technique has found six faults on two forms; **no arithmetic self-checks** though
these forms print their own totals; **no form-YEAR check**; the 41 unconsumed schema fields; a
page-by-page audit of the other multi-page forms; a sweep for UI-bound statement fields with no
backend column; the dot-leader gap in `attributeRowCells`' text mode; unify the three
name/address compose copies; the 1099-SA phone grouping; W-2 box-12 amounts and box 14b;
`employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and
mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - A checkbox printed BELOW its caption, and a key-set diff that hid three values

The last three fields where the two renders of `1099-da` disagreed: boxes **2**, **5** and **9**
are ticked on the form and the PDF render reported none of them.

**Nothing was missing from the data.** Azure reports all **16** of this form's selection marks on
BOTH renders, with position and state, matching the fixture's own AcroForm widgets **one for
one** - including the single unselected mark. What it never does is PAIR these three with their
captions, so the key-value pass had nothing to match: on the PDF none of the three produced a
pair, on the PNG only box 9 did.

`readSelectionMarks` pairs a mark with a label on the SAME ROW, which is where most checkboxes
sit. These three are printed differently - the caption WRAPS and the box sits underneath it:

    "2 Check if basis reported" / "to IRS"                          caption cy 3.74, box cy 4.16
    "5 Check if loss is not" / "allowed based on" / "amount in 1f"          cy 4.82, box cy 5.24
    "9 Check if digital" / "asset is a" / "noncovered" / "security"         cy 5.41, box cy 5.99

So: the nearest mark BELOW the caption's first line whose left edge falls within the caption's
horizontal span. **The span guard is load-bearing** - box 6 prints three marks on the same two
rows as box 5's, at x 1.99 and 2.99 against box 5's 1.51, so nearest-below alone is ambiguous.
The rule was validated against the AcroForm for all three boxes on both renders **before** any
code was written.

### ★ A MATCHING KEY SET IS NOT A MATCHING EXTRACTION

With the checkboxes in, the two renders' field sets became identical - 58 and 58 - and I almost
stopped there. Diffing at VALUE level instead found **three** 1099-DA filer-block fields where
the PDF is simply wrong:

    copyOther_filer_country                      "+1 545
1234
US"   vs  "US"
    copyOther_filer_telephone_number             "12
555"            vs  "+1 545 555 1234"
    copyOther_filer_zip_or_foreign_postal_code   "KOKO
12345"        vs  "12345"

The phone bleeds into the country, and box 1b's digital-asset name (`"KOKO"`) into the ZIP.
**NOT FIXED** - reported rather than quietly left. This is the third time this session that a
count-level agreement concealed a value-level fault, and the second time on this very form.

**Both renders of both forms now agree on every field**: `1099-da` 48 -> **58** (PNG 58, key sets
identical, three values above excepted); `w-2g` 36 -> **38** (PNG 38, **byte-identical, values
included**).

8 new tests, both renders in their own units, including **the case the fixture cannot provide**:
every box in it is ticked, so a reader that ignored the mark's state entirely would score full
marks. Mutation-tested - removing the span guard reddens 3, the depth limit 2, the same-row
exclusion 4. Unit suite **2,892 / 0**. Reload trigger **v97**. Commit `5b1a7eb1`.

## 2026-10-04 - The two render gaps were ORDER-dependence, and one was a misattribution

Diagnosing the two gaps I had reported with the meaning audit changed what they were.
**"The PDF render loses values" was wrong on both counts:** both renders contain every printed
value, and on Form 1099-DA the PDF did not merely lose four of them - it put a state
IDENTIFICATION NUMBER into a tax-withheld box.

### ★ What was actually happening

Azure emits the two renders of one fixture in different orders:

    PNG   "14 State name" / "NY" / "TX" / ... / "15 State identification no. 767676" / "989898"
    PDF   "14 State name" / "15 State identification no." / "16 State tax withheld"
          / "NY" / "767676" / "$" / "102" / "TX" / "989898" / "$ 103"

`recoverStateRowByLabel` walks the lines after each caption. On the PDF the lines after box 14's
caption are the next two CAPTIONS, so it hit its own `"15 state"` stop-word and collected
nothing. Boxes 14 and 15 came back empty - **and box 16's walk then collected the lines after ITS
caption**, writing `767676` into `copyOther_box16_state_tax_withheld_2` as though it were an
amount, with both real amounts crammed into row 1 as `"102\n103"`. Box 12a lost all three of its
printed units the same way, its next line being box 12b's caption - though 12b's own date read
correctly, so that one was a pure loss.

**A reader's own stop-word guard is what silently zeroed it.** The guard is right - it stops the
walk running into the next box - and on one render it fires immediately and the reader reports
success having read nothing.

### The fix was already named in the file

`recover1099DaCellsByGeometry` exists for exactly this, and its own comment says it runs last
"for why order cannot work" - the state rows and box 12a had simply never been added to it. The
state section is now read as a 3-column x 2-row grid and box 12a as a 1-column x 3-row stack.
Rows are found by **clustering value glyphs on centre-y** rather than assuming where they sit,
so nothing depends on the render's scale: measured, one row's values share a centre to within
0.01in (1px) while consecutive rows sit ~1.5 caption heights apart.

### Form W-2G had TWO causes, neither of them a render fault

  - **The winner's ZIP**: Azure MERGES that caption with the one beside it on BOTH renders
    (`"ZIP or foreign postal code withheld"`), and the value region it pairs with the mangled
    label caught only `"$"` on the PDF and `"98765 $"` on the PNG. Now read from its own cell.
  - **The winner's CITY**: `"CityOrTown"` had **ONE** fan-out slot where its four sibling address
    captions all have two, so the second occurrence was read and **discarded**. The PDF had
    `"Scarborough"` available the whole time. **Found only by diffing the two renders field by
    field** - no audit of a single render would ever show it.

Measured against each fixture's own AcroForm, both renders now agree:

    1099-da   48 -> 55 fields (PNG 58); all 9 state and 12a values correct on BOTH renders
    w-2g      36 -> 38 fields (PNG 38); RENDER-IDENTICAL, gap fully closed

**Still open on 1099-DA**: three CHECKBOXES - box 2 basis-reported-to-IRS, box 5
loss-not-allowed, box 9 noncovered-security - are ticked on the form and the PDF render produces
no selection-mark key-value pair for any of them. A different mechanism from cell geometry; left
for a selection-mark pass.

### ★ Mutation-testing the TEST disproved the test's own comment

9 new tests assert BOTH renders in their own units - inches at 8.5 wide and pixels at 852 - so
render-independence is tested rather than hoped for. Then I mutated the code against them, which
is the rule I had written into this file hours earlier. Merging the row threshold reddens 5. A
left slack of 2% reddened **nothing** - and the test carried a comment claiming that *any* left
slack would swallow box 11c's amount. **That claim was false**: the real margin is 0.410in (3.9
caption heights) and the 2% used elsewhere is 0.170in. It takes a 5% slack to break it, which
then reddens 2 with exactly the right diagnosis (`"first 150"`, `"6575.0 350"`). The comment now
states the measurement. **A mutation that fails to redden anything is telling you something -
usually that your explanation is wrong, not that your code is safe.**

Unit suite **2,884 / 0**. Reload trigger **v96**. Commit `28359ef3`.

Open, in priority order: **the three 1099-DA checkboxes** above; **deskewing input before
sending it to Azure** - the production readers misattribute ten values on a 3-degree-rotated
1042-S; **Azure's per-field confidence is still discarded**; a page-by-page audit of the other
multi-page forms; **and now: diff BOTH renders of every fixture field by field** - it found a
config fault no single-render check could; **no arithmetic self-checks**; **no form-YEAR check**;
the 41 unconsumed schema fields; a sweep for UI-bound statement fields with no backend column;
the dot-leader gap in `attributeRowCells`' text mode; unify the three name/address compose
copies; the 1099-SA phone grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on
`w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and mapping an Azure 429
to 503 rather than a bare 500.

## 2026-10-04 - The MEANING audit: is each live key on the field it actually means?

The name audit earlier today proved every configured key exists in its model's schema. It
**cannot** see a live key mapped to the WRONG target - both names are real and only the value is
wrong, which is how the 1095-A address fault survived a 103/103 score. This is that second half.
Five checks, cheapest first; one real defect, and the rest clean with evidence.

### 1. Internal consistency - no external truth needed

The configs list several Azure spellings per target on purpose, which is also a free check: if
two spellings for the same printed box point at different targets, one is wrong. **0 targets fed
by conflicting box numbers; 0 keys mapped to two targets in one scope.** It did surface 13
**list-valued** mappings (one key fanning out to several targets) on `w-2g` and `1099-da`, which
became check 5.

### 2. Box number vs the form's own printed caption

**219 box->target pairs** checked against captions read out of `docs/IRS-Forms/*.pdf`. **0 real
mismatches.** Of 13 flagged, 10 were `_box*Raw` scratch keys for selection groups (correct by
design) and 3 were caption line-wrapping (1099-OID box 8 really is "Original issue discount on
U.S. Treasury obligations").

**★ I mutation-tested the audit before trusting the clean result.** A check that passes
everything may simply have no power. Injecting three box swaps - 1099-INT 1<->2, 1099-MISC
1<->2, 1099-DIV 1a<->3 - caught all **six** sides (13 -> 19 flags), then the config was restored
byte-identical. The negative result is worth something because the positive control fired.

Eight box keys whose caption the regex missed were each verified by hand against the IRS text.
Seven correct. The eighth is a genuine curiosity:

**Form 1099-MISC box 14 is RESERVED on Rev. 4-2025.** Three independent confirmations: the cell
holds the number and no caption (`13 FATCA filing requirement | 14 | 15 Nonqualified deferred
compensation`), it has **no fillable widget** while every other money box does, and the phrase
"golden parachute" appears nowhere in the document. The concept **RELOCATED to Form 1099-NEC
box 3** ("3 Excess golden parachute payments"), which our NEC config maps correctly. Our stale
`Box14 -> excessGoldenParachutePaymentsAmount` on 1099-MISC returns empty at confidence 0.428 on
a 2025 form and would be RIGHT on a pre-2025 one, so it is benign back-compat and was left
alone. Sibling of the Schedule 8812 line 15 lesson: **reserved can mean relocated.**

### 3. Party roles - which side of the form is this?

Most 1099s print PAYER/RECIPIENT, but seven print role-specific pairs: LENDER/BORROWER (1099-A,
1098-E), CREDITOR/DEBTOR (1099-C), CORPORATION/SHAREHOLDER (1099-CAP), FILER/TRANSFEROR
(1099-S), FILER/PAYEE (1099-K), PAYER/POLICYHOLDER/INSURED (1099-LTC), MARKETPLACE/RECIPIENT
(1095-A). Mapping `Lender.Name` to `borrowerName` would be invisible to a name audit. Every live
party mapping across the 23 forms keeps its printed side - **0 crossings** - and the
role-specific forms keep the printed role in the target name rather than normalising to
payer/recipient, which is the better choice.

### ★ 4. THE ONE REAL DEFECT: an amount field mapped onto a checkbox

Comparing Azure's field TYPE against what the target name claims flagged 6; five were my own
regex matching `^qualified` and `Income$` on legitimate amounts. The sixth is real:

**Form 1099-LTC box 4 is a CHECKBOX** ("4 Qualified contract"), and Azure returns BOTH `Box4`
(boolean selection mark) and `Box4Amount` (a number) for a box that holds no amount. The config
mapped `Box4Amount` onto `qualifiedContract`, the UI's boolean - and because the generic field
pass runs BEFORE `postProcess1099Ltc`, that number would have beaten the `putIfAbsent` that
fills the flag from the selection mark.

Nothing had ever gone wrong: `Box4Amount` reads EMPTY at confidence 0.953 while `Box4` carries
`":selected:"` at 0.944. **A populated ZERO would have unchecked a box the form has ticked.**
Mapping removed; the selection mark now overwrites rather than deferring. Commit `60922f3e`.

### 5. Ordinal fan-out, and a render gap it exposed

Those 13 list-valued mappings assign the **Nth occurrence in document order** to the Nth target -
`StreetAddress` -> `[payerStreetAddress, winnerAddress]` on Form W-2G. That is the exact pattern
**OCR reading order is not a property of the form** warns about: a reordered render would SWAP
two real values silently. Tested on both renders of both forms, and the fixtures are well built
for it (1099-da puts "4 Oxford Street, London ON" on the filer and "1 London Street, Cambridge
SC" on the recipient, so a swap would be unmistakable). **No swaps - both renders assign
identically and correctly.** A structural fragility, not a current defect.

It did expose **render recall gaps, with the printed values confirmed in each AcroForm**:

    w-2g      PDF loses winnerZipCode 98765            (PNG finds it)   36 vs 38 fields
    1099-da   PDF loses the WHOLE state section        (PNG finds it)   48 vs 58 fields
              NY / TX / 767676 / 989898

1099-da was already on the known render-difference list; **w-2g is new**.

**Both halves of the config audit are now done**: names (2 findings) and meanings (1 finding).
Unit suite **2,875 / 0**. Open, in priority order: **deskewing input before sending it to
Azure** - the production readers misattribute ten values on a 3-degree-rotated 1042-S, the
failure a user cannot see; **Azure's per-field confidence is still discarded**, and this audit
leaned on it repeatedly (0.953 empty, 0.944 selected, 0.428 absent) to tell dormant from live;
**the two PDF-render recall gaps above**; **no arithmetic self-checks** though these forms print
their own totals; **no form-YEAR check**, which is what made 1099-MISC box 14 take an hour to
settle; the 41 unconsumed schema fields; a page-by-page audit of the other multi-page forms; a
sweep for UI-bound statement fields with no backend column; the dot-leader gap in
`attributeRowCells`' text mode; unify the three name/address compose copies; the 1099-SA phone
grouping; W-2 box-12 amounts (Azure returns codes and no amounts) and box 14b; `employeeSuffix`
on `w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and mapping an Azure
429 to 503 rather than a bare 500.

## 2026-10-04 - Audited the 26 named-model configs: one printed box was holding two facts

Audited every config that uses an Azure NAMED tax model (`prebuilt-tax.us.*`) against the
schema the model actually returns. A named model returns its whole schema with nulls for what
it did not find, so the key set from one fixture IS the schema, and a configured key absent
from it can never match.

**Scope correction first: there are 26 such entries, not the 24 I had written.** 23 have a
fixture; the other three are the territory W-2s (`w-2-as`, `w-2-gu`, `w-2-vi`), which share
`prebuilt-tax.us.w2` and so were audited against the same dumped schema. 525 target fields,
818 configured keys.

### The raw number was 325 and it was almost all noise

325 of 818 configured keys do not exist in any schema. That reads like a catastrophe and is
not one: the configs deliberately list several Azure spellings per target - `Payer.TIN` AND
`Payer.IdNumber` both map to `payerTIN`, and one of the two is always the real name. Three
more things also had to be modelled before the number meant anything:

  - `Transactions[]` is FLATTENED into the top level by `postProcessTransactionsArray` with
    `putIfAbsent`, so a dead top-level `descriptionOfProperty` is covered by a live
    `Transactions[].Box1a`. That alone accounted for most of 1099-B's, -DIV's and -INT's.
  - `concatFields` consumes keys too - my first pass did not parse it and so reported the W-2's
    `Employer.Name` as unmapped when `Employer.Name+Employer.Address` uses it.
  - a target can be written by Java outright, through a selection group, a geometric reader or
    a composed address.

Asking the only question that matters - **is this target filled by any path at all?** - took it
from 325 keys to **18 targets**, and verifying those by hand to **2 real findings**.

### ★ FINDING 1: "State/Payer's state no." is ONE box holding TWO facts

The IRS prints a single box captioned "State/Payer's state no." - **box 17** on Form 1099-MISC,
**box 6** on 1099-NEC, **box 15** on 1099-R - read from each form's own text in
`docs/IRS-Forms/`. Azure carries one field per printed box, so both facts arrive in one string,
and we stored the whole thing as `payerStateId`. The screens' state input - 1099-NEC captions it
"State (Box 6)" - **could never be filled.**

    Azure box 17   "$ NY\n76565"        the form prints NY and 76565 in SEPARATE widgets
    we stored      payerStateId = all of it,  state = never

**Forms 1099-INT, -DIV, -G and -K are NOT affected** and their configs differ for a real reason:
the IRS gives the state its own box on those four. I nearly read the difference as a
copy-and-paste shift in three configs; it is the forms that differ, not the configs.

**A SECOND fault surfaced only once the first was fixed.** With the state finally split out, the
neighbouring figure was visible: `stateTaxWithheldAmount = 76565` - the state's own ID reported
as tax withheld, because Azure had assigned that same bundled string to the number-typed "State
tax withheld" box as well. A withholding equal to the payer's state number is not a real
amount, and a wrong figure is worse than a blank one the filer completes, so it is dropped with
a warning. **Fixing one fault is what made the next one legible.**

### ★ FINDING 2: an OCR regex was masking a one-character spelling error

The 1099-INT config asked for `Payer.RTN`. The model returns `Payer.Rtn`. The key never matched,
and the comment on `recover1099IntPayerRtnFromOcr` asserted that the model "doesn't expose
Payer's RTN as a structured field" - **it does**, `"786543"` at confidence 0.799 on the very
fixture in the repo. A raw-text regex keyed on the printed caption had been written to cover a
gap that was a capital T and N. No data was being lost, so nothing looked wrong; the weaker
route was simply the only route. **A fallback that works hides the defect it is covering.**

### What the audit cleared, which is most of it

  - **W-2 box 14** - the `Other[]` array config cannot match, because Azure returns `Other` as a
    SCALAR (`"Humpty dumpty"` on the fixture). Not a defect: `OcrContentFallback` already
    handles it and says so in its own comment - "not an array, despite the field-mappings
    entry". The config entry is stale, not broken. All four W-2 variants share it.
  - **13 selection-group targets** on 1099-B, -K, -LTC and -SA - written by
    `applySelectionGroupFlags` from live `_*Raw` keys, through a loop variable no literal scan
    can see. Verified by reading each call site.
  - **`IsVoid` on 1099-DIV/-G/-INT** - genuinely absent from those schemas, and
    `recoverVoidFromOcr` covers it. That comment is accurate.
  - **41 schema fields Azure returns that nothing consumes** - 1099-G has 10
    (`PaidFamilyLeavePayments`, `Repayment`, `InterestOnRefund`, `LocalTaxWithheld`, ...),
    1099-S has 7, plus 1099-Q's `DistributionCode`/`FairMarketValue`, 1099-R's `StateEIN`,
    1099-LTC's `Box3Amount`, 1099-C's `DischargedDebt`. Listed, not actioned: unconsumed is not
    the same as needed, several have no box on our screens, and a statement field cannot be
    added without sign-off.

### What this audit CANNOT see

It compares a key NAME against the schema. It cannot tell that a live key is mapped to the
WRONG target - which is exactly the 1095-A address fault from earlier today, where every name
was real and the meaning was wrong. A name audit and a meaning audit are different jobs.

Live-verified through `POST /api/statements/{form}/extract` on all four fixtures: 1099-MISC now
gives state NY/SC with IDs 76565/97787 and no phantom withholdings; 1099-NEC and 1099-R are
unchanged, their fixtures printing no state and none being invented; 1099-INT reads `payerRTN`
786543 from the structured field. Unit suite **2,875 / 0** (11 new, one of which pins that a
bare "75657" never yields a state of "75").

Open, in priority order: **deskewing input before sending it to Azure** - the perturbation test
showed the production readers misattribute ten values on a 3-degree-rotated 1042-S, the failure
a user cannot see; **Azure's per-field confidence is still discarded**, and it is now doubly
wanted, having flagged the 1095-C checkboxes at 0.364 and the RTN at 0.799; **a MEANING audit of
the named-model configs**, which is the half this one could not do; **no arithmetic self-checks**
though these forms print their own totals; **no form-YEAR check**; the 41 unconsumed schema
fields; a page-by-page audit of the other multi-page forms; a sweep for UI-bound statement
fields with no backend column; the dot-leader gap in `attributeRowCells`' text mode; unify the
three name/address compose copies; the four render differences from 2026-10-03; the 1099-SA
phone grouping; W-2 box-12 amounts (Azure returns the codes and no amounts) and box 14b;
`employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and
mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - A field named for a BOX must hold that box: 1095-A's address, 1095-B/C's names

Two instances of one fault, found by asking the plain question "is this field named for a box?"
and then checking whether we read that box.

★ 1. FORM 1095-A READ AZURE'S INTERPRETED ADDRESS. Lines 12 to 15 are four numbered boxes -
street, city, state, country-and-ZIP - and the screen's fields are named for them. Azure instead
returns ONE address per party and decides for itself which part is the city, and we were writing
its judgement into box-named fields. It agreed on this fixture, because the address is an
ordinary one, which is why the semantic read scored 103/103 and this stood all session.

Two symptoms had been visible the whole time and I had put both down to OCR noise:

    Azure's streetAddress dropped the house number on the PDF and kept it on the PNG,
    so the SAME document gave two different answers - and neither matched the box,
    which holds "14 Sycamore Ridge Rd".

Reading the four boxes fixes both: the renders are now BYTE-IDENTICAL where they differed, and
both score **103/103**. So the PDF had really been 102/103, and my earlier "103/103,
byte-identical on both renders" was wrong on its second half.

**Audited the other 55 forms**: 1095-A was the only one mapping Azure's parsed address
components into box-named fields. Mapping a whole address into a single whole-address field,
which several forms do, is a different thing and is fine.

★ 2. AND THE AUDIT FOUND A SECOND INSTANCE - THE NAMES. Forms 1095-B and 1095-C print the
name in THREE boxes under one caption, and we read the caption's whole line and split it on the
assumption that the surname is its last word.

I first declined to fix it, because the gap between those boxes measured only about twice the
gap between words and the comparable rules in this file have four to eight times' clearance. The
user chose to measure rather than accept the estimate, and **the estimate was wrong**: on
fixtures built with multi-word names in every box,

    within a box     0.039in = 0.20 of a text height
    between boxes    0.195in = 1.02 of a text height   (1095-C, the tighter form)
                     1.320in = 6.92 of a text height   (1095-B)

which is over twice clear either side of a 0.45 threshold. My 2x came from single-word fixtures
whose gaps happen to be tighter. **An estimate was about to cost a real fix.**

What the old rule actually did, on `first="Mary Jo" middle="K" last="Van Der Berg"`:

    1095-B   responsibleFirstName = "Mary Jo K Van Der"   LastName = "Berg"
    1095-C   employeeFirstName    = "Mary Jo B Van Der"   LastName = "Berg"
             employeeMiddleInitial = MISSING entirely

★ A FIXTURE WHERE EVERY BOX HOLDS ONE WORD CANNOT TEST A MULTI-WORD BOX. That is the general
lesson, and it is the sibling of the all-ticked-checkbox weakness found earlier today: both forms
scored full marks against their AcroForm while the rule was broken, because the shipped data
never exercised it. Building the fixture that stresses the assumption took ten minutes with
PyMuPDF - set the three widgets, regenerate the appearance streams - and turned the question from
a judgement call into a measurement.

Two corrections while building it, both my own:

  - My first reader bounded the row by a MULTIPLE OF LABEL HEIGHT with no right edge and swept in
    the next row's captions and the column beside it: `"Mary 4 Street Jo address (including
    apartment no.) K"`. It is bounded by its NEIGHBOURING CAPTIONS now, as every other reader
    here already was.
  - The left slack needed a FULL label height, not the usual half. These captions are indented
    further than their own boxes, so 1095-B's first name starts 0.067in left of its caption
    against a half-height of 0.060 - and a half silently dropped "Mary".

And two of my own TESTS were wrong rather than the code: I had dropped "Der" from the middle of
"Van Der Berg", leaving a 0.30in hole that genuinely IS a box boundary. The reader split there
correctly - the test data could not have existed on paper. **Physically impossible test data
reads exactly like a bug.**

MEASURED, NOT ASSUMED. 1095-A **103/103**, 1095-B **133/133**, 1095-C **85/85** against their
AcroForms; every count across the family unchanged (133 / 220 / 85 / 235 / 320 merged); all four
multi-word fixtures read their boxes exactly. Unit suite **2,864 / 0** (9 new, one of which pins
the gap margin itself so it cannot quietly erode).

**The 1095 family is now complete and audited.** Open, in priority order: **the remaining 24
named-model configs**, where 3 of 3 audited were wrong on their keys and one also misread
checkboxes; **deskewing input before sending it to Azure** - the perturbation test showed the
production readers misattribute ten values on a 3-degree-rotated 1042-S, which is the failure a
user cannot see; **Azure's per-field confidence is still discarded**, and it flagged the 1095-C
checkboxes at 0.364 before we accepted them as fact; **no arithmetic self-checks**, though these
forms print their own totals; **no form-YEAR check**, so a redesigned form is read with this
year's geometry; a page-by-page audit of the other multi-page forms; a sweep for UI-bound
statement fields with no backend column; the dot-leader gap in `attributeRowCells`' text mode;
unify the three name/address compose copies; the four render differences from 2026-10-03; the
1099-SA phone grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on `w-2-as.pdf` and
`w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and mapping an Azure 429 to 503 rather than
a bare 500.

## 2026-10-04 - Part III took Part II's columns on a merged page, and 1095-C left its tax model

The user merged the two 1095-C fixtures into one image, `1095-c-merged.png`, and reported
checkboxes ticked in the image but unticked on screen. Two separate causes, one ours and one not.

★ 1. TAKING THE FIRST MATCH ON A PAGE IS ONLY SAFE WHEN THE LABEL OCCURS ONCE. Form 1095-C
prints month column headers in **Part II as well as Part III**:

    Part II  headers   y~307   "All 12 Months" x133   "Jan" x238
    Part III headers   y~725   "all 12 months" x557   "Jan" x640

`findLabelIn(..., 0)` returns Part II's, so Part III's grid columns were placed about 400px from
its own marks. **62 of the 169 Part III checkboxes were lost** (246 -> 320 fields, 107 -> 169
checkboxes). Every fixture so far carried only one Part per page, which is why this never showed:
a merged page is how the whole form arrives when it is scanned in one go.

The column guard added the same day is why this LOST data instead of filing 62 marks under the
wrong months - it discarded what it could not place. It failed safe, and the failure was still
silent. The grid is now scoped to below its own section heading (`^Part III` for 1095-C,
`^Part IV` for 1095-B), which also protects the row search: `^18\b` would otherwise match a
Part II cell whose value happens to be 18. Every page carries its heading, both continuation
sheets included, and a page without one falls back to the whole page with a log.

★ 2. AND FOUR MORE WERE THE TAX MODEL, NOT US. `prebuilt-tax.us.1095C` reported four ticked
boxes as `unselected` at **confidence 0.364** (row 6 Sep/Oct/Nov, row 9 Nov) while
`prebuilt-document` read the same four as selected. Measured by probing the model the extraction
actually runs - `dump_marks.mjs` uses prebuilt-document and showed all of them selected, which is
exactly the trap recorded two entries down.

Three options were put to the user rather than chosen for them: accept the four; two analyses per
upload; or move the form to `prebuilt-document` and measure the scalars off the page. **They chose
the third**, so Form 1095-C is no longer on a named tax model:

    key-value pass   employee name (one box, split three ways), SSN, employer name, EIN
    side rows        employee's age on January 1, plan start month, calendar year
    selection marks  VOID, CORRECTED, self-insured coverage
    already geometric  both address blocks, Part II's 4x13 grid, Part III's grid

The calendar year is read from beside "CORRECTED" because that is where the form prints it - the
key-value pass pairs them the same way, returning `"CORRECTED" => "2025"`, which is the giveaway
that the year is on that row rather than in a box of its own.

    1095-c           85/85 against the AcroForm, renders identical
    1095-c-p3      234/234 + selfInsuredCoverage; now 235 on BOTH renders, where the tax
                   model's PNG words had lost row 24's middle initial
    1095-c-merged  320 fields = EXACTLY the union of the two pages - no extras, nothing
                   missing, no differing values; the four checkboxes read true

That union check is the one worth keeping: a merged page producing precisely page 1 plus page 3,
field for field, is a stronger statement than either page's own score.

Two bonuses beyond the four: the middle initial above, and the key-value pass turns out to read
the address boxes BOX-FAITHFULLY too (`"11 City or town" => "US 53704"`), which corroborates the
geometric reader written for that reason rather than replacing it - geometry still wins those
fields, so there is one writer per field instead of two agreeing by luck.

★ A SECOND REASON TO DISTRUST THE NAMED MODELS, INDEPENDENT OF THE INVENTED KEYS. Until now
the case against them was that our configs named their fields wrongly. This is the model itself
being worse than the generic one on the same page. When auditing the remaining **24**, compare
both models' MARKS as well as their field names.

MEASURED, NOT ASSUMED. Both changes are 1095-C-scoped bar the shared grid scoping, and all four
single-page fixtures re-extract to their established counts (85 / 235 / 133 / 220). Unit suite
**2,855 / 0**.

Open, in priority order: **the 1095-A address fix** - it reads Azure's SEMANTIC address
components and is correct only because its fixture is sane, the last piece of the 1095 family;
**the remaining 24 named-model configs**, now on two counts; **a page-by-page audit of the other
multi-page forms** for the overwrite shape; a sweep for UI-bound statement fields with no backend
column; the dot-leader gap in `attributeRowCells`' text mode; unify the three name/address compose
copies; the four render differences from 2026-10-03; the 1099-SA phone grouping; W-2 box-12
amounts and box 14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated
phone fragment; and mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - A checkbox absent from the page read as false, so page 3 cleared page 1

A report that `1095-c-p3.png` "does not extract all values". The audit line showed the upload
succeeded - 236 fields, all 13 Part III rows - so the report was about what is NOT on that page:
**page 3 of Form 1095-C carries only Part III and the self-insured box.** Unlike Form 1095-B's
page 3, which repeats the responsible individual across its top and which we do read, 1095-C's
repeats nothing. Parts I and II staying empty is correct; that data is on page 1, uploaded
separately. The one genuinely missing value is row 24's middle initial "X", absent from the tax
model's PNG words and present in its PDF words.

★ BUT CHECKING THAT FOUND A DESTRUCTIVE BUG. Page 3 reported `void: false` and
`corrected: false` for boxes **that are not printed on page 3 at all** - they are on page 1. So
uploading page 3 into a statement that already held page 1 CLEARED them, and the reverse cleared
the self-insured flag. Same shape as the wrong-form misattribution above: plausible, destructive,
and nothing in the response said so.

Azure distinguishes the two cases exactly, which is what makes this decidable rather than a
judgement call:

    content ":selected:"   + a bounding region    on the page, ticked
    content ":unselected:" + a bounding region    on the page, empty     -> false
    no content, no region                         NOT on this page       -> null

That is the canonical null/zero semantic this codebase already holds to - null means the concept
does not apply, false means it applies and is unchecked - and a box the page does not print is
the former. Measured on both pages:

    page 1   void=true corrected=true   selfInsuredCoverage now ABSENT (was false)   86 -> 85
    page 3   selfInsuredCoverage=true   void/corrected now ABSENT (were false)      237 -> 235

★ CORRECTION TO THE 1095-C ENTRY BELOW, WHICH CLAIMED "86/86 AGAINST THE ACROFORM". The 86th
value was `selfInsuredCoverage: false`, and that box is not on page 1. **The right figure is
85/85.** The AcroForm always agreed - an unchecked box has no `/V` and so never appeared in the
key - and I wrote that expectation by hand to match what the code produced. A hand-written
expectation is my own prior work, not an oracle; the same trap as sc_00329, in a new place.

MEASURED, NOT ASSUMED. `extractSimpleValue` is shared by every named-model form, so all **45**
forms with fixtures were extracted before and after: **exactly ONE field changed** across all of
them, the 1095-C value above. The discriminator is split out as `isUnlocatedCheckbox` so it is
tested with plain arguments rather than a stubbed SDK field - five tests, including that
`":unselected:"` WITH a region must still read false, which is the case this must not break.
Unit suite **2,855 / 0** (5 new).

★ THE GENERAL RULE THIS LEAVES: **a form uploaded page by page must have each page report only
what that page carries.** Anything a page reports about a field it does not print will overwrite
a sibling page's reading of it. Worth checking on every multi-page statement - 1095-B/C both have
a page 3, and the W-2 family and Schedule K-1s are candidates.

Open, in priority order: **the 1095-A address fix** - it reads Azure's SEMANTIC address
components and is correct only because its fixture is sane, the last piece of the 1095 family;
**the remaining 24 named-model configs**, since three of three audited were wrong; **a page-by-page
audit of the other multi-page forms** for the overwrite shape above; a sweep for UI-bound
statement fields with no backend column; the dot-leader gap in `attributeRowCells`' text mode;
unify the three name/address compose copies; the four render differences from 2026-10-03; the
1099-SA phone grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on `w-2-as.pdf` and
`w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and mapping an Azure 429 to 503 rather than
a bare 500.

## 2026-10-04 - A wrong-form upload was silently misattributed, not refused

A report of "1095-p3-c.png does not extract" turned out not to be a code defect at all. The
backend log settled it in one query:

    AUDIT formId=1095-c  fileSize=175412  contentType=image/png

`1095-b-p3.png` is 175412 bytes; `1095-c-p3.png` is 187330. **Form 1095-B's continuation sheet
had been uploaded into the Form 1095-C statement.** Reading the audit line beat three rounds of
guessing about the UI, and is the first thing to do with any "it does not work" report.

★ BUT IT DID NOT FAIL - IT PRODUCED 36 PLAUSIBLE VALUES IN THE WRONG ROWS. 1095-B numbers its
continuation rows 29-40 and 1095-C's Part III reads 18-30, so rows 29 and 30 overlapped and
landed in 1095-C's Part III rows 11 and 12 - exactly 2 rows x 18 fields. Nothing in the response
said anything was wrong. **Misattributed data that looks right is worse than a refusal**, and the
only reason it surfaced is that a human noticed the screen looked empty rather than wrong.

Every IRS statement prints its own form number and `StatementFormCatalog` already held it for all
56 forms, so `mapToAppModel` now refuses with a 400 naming what the document actually says:

    "This document says "Form 1095-B" but was uploaded as Form 1095-C.
     Choose the matching statement form, or check the file."

Deliberately conservative: it refuses ONLY when the expected code is **absent** AND another
catalogued code is **present**. A title OCR missed, or a page that merely cross-references another
form, leaves the upload alone - the residual false positive needs both at once.

★ AND THE TESTS FOUND TWO BUGS IN MY FIRST MATCHER. The matching is the whole difficulty:

  - **SEVENTEEN catalogue codes are prefixes of others** - "Form 1098" of "Form 1098-C",
    "Form W-2" of "Form W-2G"/"W-2AS"/"W-2GU"/"W-2VI", "Form 1099-S" of "Form 1099-SA"/"1099-SB",
    "Form 5498" of "Form 5498-ESA"/"-QA"/"-SA", "Form RRB-1099" of "Form RRB-1099-R". A trailing
    `\b` matches every one of them, because the boundary between "8" and "-" IS a word boundary.
    The lookarounds must exclude a neighbouring HYPHEN as well as a word character.
  - **My lookaround class was over-escaped.** I wrote it so the Java string came out as
    `[\\w-]`, which is the class {backslash, w, hyphen} - not word characters. So W-2GU read as
    W-2 and 1099-SA as 1099-S. The live sweep of 45 forms had passed WITH this bug, because the
    expected code was always found first and the function returned before the faulty branch ran.
    A green sweep over real fixtures said nothing about it; seven unit tests on the pure function
    found it immediately.
  - `printsFormCode`'s javadoc said whitespace was collapsed "on both sides" while only the CODE
    was, so a title printed with two spaces went unmatched. **Third instance this week of a
    comment describing work the code did not do** (after `composeNameAddress`'s "one copy" and
    `extractValue`'s advertised address drill-down). It is collapsed inside the function now,
    where the claim can hold however it is reached.

Three codes contain brackets ("Schedule K-1 (Form 1041)"), so the code is quoted rather than
spliced into a pattern.

MEASURED, NOT ASSUMED. All **45** forms with fixtures still return 200 with their full field
counts, including every prefix-collision pair checked explicitly (1098/1098-C, 1099-S/1099-SA,
W-2/W-2G, 5498/5498-SA). Unit suite **2,850 / 0** (7 new, one of which checks all 56 codes
PAIRWISE: a page printing one must never be read as printing another).

Open, in priority order: **the 1095-A address fix** - it reads Azure's SEMANTIC address
components and is correct only because its fixture is sane, the last piece of the 1095 family;
**the remaining 24 named-model configs**, since three of three audited were wrong; a sweep for
UI-bound statement fields with no backend column; the dot-leader gap in `attributeRowCells`' text
mode; unify the three name/address compose copies; the four render differences from 2026-10-03;
the 1099-SA phone grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on `w-2-as.pdf` and
`w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and mapping an Azure 429 to 503 rather than
a bare 500.

## 2026-10-04 - Form 1095-C Part III: one grid reader for two forms, and a failed grep filed as a fact

**3 -> 237 values** on the PDF (236 on the PNG). **234/234** against the fixture's AcroForm: all
13 rows x 5 text fields, all 169 checkboxes, plus void, corrected and selfInsuredCoverage.

★ I HAD THIS PAGE WRONG IN MY OWN NOTES, AND COMMITTED THE ERROR. The previous entry records
that Part III "needs rows discovered by clustering the marks" because "its rows are UNNUMBERED".
**They are numbered 18 to 30.** Each number is simply its OWN line glyph, where Form 1095-B
merges it with the name ("23 Marianne"). My grep required the number and the name on one line,
found nothing, and I wrote the absence down as a property of the form - in the commit message, in
`history.md`, in `context.md` and in the plan for the next piece of work. **A search that finds
nothing is a fact about the search.** Same family as "an absent artifact is not a zero", and this
time the inference travelled into four documents and would have bought a mechanism nobody needed.

So no new mechanism was built. The 1095-B grid reader now takes its first row number, its row
count and its target list as parameters, and both forms call it:

    1095-B Part IV    rows 23.. (and 29.. on the continuation sheet)   coveredIndividuals
    1095-C Part III   rows 18-30                                      partIIICoveredIndividuals

The thirteen column headers and the thirteen field names are identical on both forms, and the
existing regexes already matched both spellings - 1095-B prints `Jun`/`Jul`/`Sep`, 1095-C prints
`June`/`July`/`Sept`. Second instance is what justified parameterising it; the first would have
been speculation.

★ AND A METHOD NOTE THAT COST A WRONG DIAGNOSIS. Row 24's middle initial "X" is in the PDF's
word list and not the PNG's. I probed with `dump_marks.mjs`/`words.mjs`, saw the glyph present on
the PNG, and concluded my reader must be dropping it. Those tools run **prebuilt-document**; this
form's extraction runs **prebuilt-tax.us.1095C**, and the two models return different OCR for the
same page. Instrumenting the real reader settled it in one run - the bound and the band are
identical on both renders (`textRight` = the grid's left edge, 13 marks attributed) and the glyph
is simply absent from the model's words. **Probe the model the extraction actually runs.**

The other render difference is a plain OCR one: a surname reads "Chandrasekar" on the PDF and
"Chandrasekal" on the PNG. Both differences are upstream of any mapping.

A better oracle than 1095-B's, incidentally: this fixture leaves three of its boxes UNticked, so
the all-true weakness that hid two real bugs there does not apply here.

MEASURED, NOT ASSUMED. The refactor is behaviour-preserving - `1095-c`, `1095-b` and `1095-b-p3`
all re-extract byte-identical on both renders. Unit suite **2,843 / 0** (2 new, pinning 1095-C's
row range and that the self-insured box at the top of the page belongs to no row).

**The 1095 family is complete:** 1095-A 3->103, 1095-B 0->133 (+220 continuation sheet), 1095-C
0->86 (+237 Part III).

Open, in priority order: **the 1095-A address fix** - it reads Azure's SEMANTIC address
components and is correct only because its fixture is sane, the one piece of this family left
undone; **the remaining 24 named-model configs**, since three of three audited were wrong; a sweep
for UI-bound statement fields with no backend column; the dot-leader gap in `attributeRowCells`'
text mode; unify the three name/address compose copies; the four render differences from
2026-10-03; the 1099-SA phone grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on
`w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and mapping an Azure 429 to
503 rather than a bare 500.

## 2026-10-04 - Form 1095-C: five invented keys out of five, and transcribe-don't-correct

**0 -> 85 values, 85/85** against the fixture's AcroForm (71 filled fields), byte-identical on
both renders. *(Corrected 2026-10-04 later the same day: this entry first claimed 86/86. The
86th value was `selfInsuredCoverage: false`, and that box is printed on page 3, not page 1 - a
box absent from the page must read null. See the entry at the top of this file.)*

**Every one of the five configured keys was wrong** - `EmployerEIN` for `Employer.EIN`,
`EmployeeSSN` for `Employee.SSN`, `EmployeeNameAddress` for `Employer.Name`,
`EmployeeFirstName`/`LastName` for `Employee.FirstName`/`LastName` - so nothing matched and
nothing was extracted. Second confirmed case of the invented-key class after 1095-A, and worse:
**5 of 5** rather than 7 of 10. Predicted from the config alone before the upload, which is the
first time this class has been called in advance rather than found by a user.

Thirteen Part I scalars now come from `prebuilt-tax.us.1095C`, which reads them well. Two things
do NOT, and both are read from the page instead.

★ 1. THE ADDRESS BLOCKS - EXTRACTION TRANSCRIBES A FORM, IT DOES NOT CORRECT IT. Azure parses
an Address SEMANTICALLY. On this fixture it reports city "Milwaukee" and state "MI", while the
form's own boxes hold:

    line 11  City or town           "US 53704"
    line 12  State or province      "Milwaukee"
    line 13  Country and ZIP        "MI"

The fixture scrambles them deliberately, and the screen's fields are named for those BOXES - so
`employerCity` must hold what is printed in the City box, not what a parser thinks a city is.
Azure also mangled `streetAddress` into `"400 Industrial Pkwy\nUS"`. Read by geometry, all nine
address values are box-faithful.

**Reported, not quietly changed:** Form 1095-A reads its address from those same semantic
components and is correct only because ITS fixture is sane. The same latent mismapping is there.
Changing a verified form unasked is not mine to do, so it is written down instead.

★ 2. PART II, WHERE THE MODEL MERGES TWO BOXES. It folds the "All 12 Months" column into
January for two of its four lines - `Section4980H...January` comes back as `"22910\n12770"` with
`All12Months` null, two values in one field, and `ZIPCode` the same. Read by geometry there is no
merge and all 52 figures are right. Part II is printed as FOUR rows of THIRTEEN columns and
stored as THIRTEEN period rows of four values, so reading it is also a transpose.

★ AND THE LOAD-BEARING DECISION WAS WHERE A COLUMN BEGINS. The values are right-aligned in
their columns while the headers are centred, so a value can start well left of its own header:

    January's 71340 begins 0.096in left of "Jan" on the PDF, and 14px left of it on the PNG
    - both MORE than the half-label-height overhang slack

Taking a header's left edge as the cell edge therefore files January's figure under "All 12
Months" (`cells[0] == "232 71340"`), which a test now pins as the defect. The cells are bounded
at the **midpoints between adjacent header centres**, which leaves about a quarter of an inch
either side and, being header-derived, holds on both renders. The midpoints are passed as
zero-height synthetic labels, so `attributeRowCells` needed no change - a shared rule reused
rather than widened.

MEASURED, NOT ASSUMED. **Purely additive**: zero lines removed from `GenericFieldMapper`. Unit
suite **2,841 / 0** (6 new), including the misfiled-January defect and the midpoint margin on
both renders.

**Still open on this form:** `1095-c-p3` carries **235 filled fields** of Part III covered
individuals and extracts 3. It is the same grid as 1095-B Part IV at the same x positions, but
its rows are **UNNUMBERED** - so it needs rows discovered by clustering the marks by y rather
than from printed row numbers. Not built; stopping there rather than sprawling further in one
commit.

Open, in priority order: **1095-C Part III** (above) and the **1095-A address** fix, best done
together; **the remaining 24 named-model configs**, since three of three audited so far were
wrong (`1095-a` 7 of 10 keys, `1095-b` empty, `1095-c` 5 of 5); a sweep for UI-bound statement
fields with no backend column; the dot-leader gap in `attributeRowCells`' text mode; unify the
three name/address compose copies; the four render differences from 2026-10-03; the 1099-SA phone
grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`;
`1099-g.png`'s duplicated phone fragment; and mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 1095-B: a config entry present but EMPTY, and the first checkbox GRID

**0 -> 133 values** on the main page, **133/133** against the fixture's AcroForm (134 filled
fields; line 1's three name boxes collapse into two model fields), byte-identical on both
renders. The **continuation sheet** reads too: **220 values**, also identical on both renders.

★ A THIRD FAILURE MODE FOR A CONFIG ENTRY. After "missing" (the eight-form sweep) and "names
invented keys" (1095-A), this one was **present but EMPTY**: `prebuilt-document` with
`"fields": {}` and no geometric reader either. So `mapped` stayed empty, the documented
last-resort AcroForm fallback fired, and the response was **301 raw widget names** (`c1_01[0]`)
that match no model field - which is exactly the blank form reported. Eleven other entries are
also empty, but those are cell-reading forms that read by geometry and need no key-value map;
`1095-b` was the only one with neither. There is no `prebuilt-tax.us.1095B` model (404), so
`prebuilt-document` was the right choice all along - its key-value pass gives clean labels for
all of lines 1-22, which is now configured.

★ PART IV NEEDED A CAPABILITY THAT DID NOT EXIST: A CHECKBOX GRID. Each covered individual has
thirteen boxes - "all 12 months" then Jan to Dec - and `readSelectionMarks` pairs a mark with ONE
named label, so it cannot say which ROW a mark is in. `attributeMarkGrid` places each mark by
nearest row (the printed row numbers) and nearest column (the printed month headers), both taken
from the form's own marks and neither from a page fraction. Azure returns all 78 marks on both
renders.

Each row's TEXT is bounded on the right by **that row's leftmost mark** - exact, free because the
marks are already in hand, and it keeps out the "X" glyphs the checkboxes also produce as words.
Name, TIN and date of birth are then separated by the **shape each box requires** (a TIN, a date,
and whatever is left is the name) rather than by x thresholds or by arrival order. Two name
shapes, deliberately different: Part I's first-name input is labelled "First name and middle
initial" so `splitName` is right there, while Part IV has its own M.I. box and takes a three-way
split on the one rule a middle initial obeys - it is one letter.

★ AND THE PRINTED ROW NUMBER IS THE LIST INDEX. Part IV numbers rows from 23 and the
continuation sheet carries on from 29, so `printed - 23` is the row's place in the list and ONE
reader handles both pages without being told which it is looking at: 23-28 fill rows 0-5, 29-40
fill rows 6-17. The screen already pads and slices that list at eighteen - the main page's six
plus the continuation sheet's twelve. Page 3 also repeats the responsible individual across its
top with NO line numbers, which is what tells the two pages apart, so that header is read only
there and never competes with page 1.

★ TWO DEFECTS THE FIXTURE COULD NOT HAVE REVEALED. Every one of its 78 boxes is ticked, so
133/133 says nothing about either:

  - an **UNSELECTED** mark must read false, not be dropped - the two look identical on this
    fixture and differ completely on a real statement with a mid-year lapse;
  - with one month header lost to OCR, nearest-column silently filed that month's mark under its
    **NEIGHBOUR**. August took two marks and reported coverage the form does not claim. A column
    guard symmetric with the row guard now discards it and warns.

Both are unit-tested synthetically on the measured geometry. A fixture where every box is ticked
is a weak oracle for checkboxes, and a perfect score against it is not evidence - same shape as
the 1098-C Yes/No pair, but this time the weakness hid a real bug.

Also: **lines 8 and 9 print side by side and the key-value pass merges them**, returning
`"9 Reserved" => "289 B"` with the two in the opposite order to their labels. They are told apart
geometrically instead - line 8's letter is left of line 9's label, line 9's value is below it -
with the half-label-height overhang slack line 9's value needs on the PDF. And one more
page-fraction trap caught in passing: `attributeRowCells` falls back to
`labels.get(0).x0() - pageWidth * 0.02` for its left edge, so passing a page width of ZERO
silently removes the slack - which dropped the first name on the PDF render of page 3. The caller
now passes a label-derived left edge instead.

MEASURED, NOT ASSUMED. **Purely additive**: zero lines removed from `GenericFieldMapper`, so no
other form's behaviour could change - which is a proof rather than a sweep. Unit suite
**2,835 / 0** (8 new).

Open, in priority order: **sweep the remaining named-model configs against what their models
actually return** - `1095-c` is next and has the same smell as 1095-A, five configured fields
against a structured model; a sweep for UI-bound statement fields with no backend column; the
dot-leader gap in `attributeRowCells`' text mode; unify the three name/address compose copies;
the four render differences from 2026-10-03; the 1099-SA phone grouping; W-2 box-12 amounts and
box 14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone
fragment; and mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 1095-A: the first "invented field names" case, and a lesson over-applied

**3 -> 103 values.** PNG **103/103** against the fixture's own AcroForm (81 filled fields); PDF
**102/103**, the one miss being Azure's OCR dropping the house number on that render - its raw
address `content` lacks the "14", so it is upstream of any mapping.

This form **HAD** a `field-mappings.json` entry, which is exactly why the missing-entry sweep that
finished an hour earlier never caught it. The entry asked for ten of the ninety-three values
`prebuilt-tax.us.1095A` returns, and named **seven of those ten wrong**:

    PolicyNumber                 ->  MarketplaceAssignedPolicyNumber
    RecipientSSN / SpouseSSN     ->  Recipient.SSN / Spouse.SSN
    Recipient{First,Last}Name    ->  Recipient.Name   (one field, needs splitting)
    Spouse{First,Last}Name       ->  Spouse.Name

It never asked for the policy issuer, either address, either date of birth, the void/corrected
marks, the tax year, the five covered individuals, or **any of Part III** - although the backend
already had `se_1095_a_covered_individual` and `se_1095_a_coverage_monthly` and the screen already
had every input. Nothing needed adding to a statement form; the data had nowhere to go only
because nothing asked for it. **This is the first confirmed instance of the class named as the top
open item**, and it was found the same way all five earlier ones were: by an upload, not an audit.

★ I GOT PART III WRONG FIRST, BY OVER-APPLYING YESTERDAY'S LESSON. Thirteen printed rows come
back as thirteen on the PDF and **FOURTEEN** on the PNG, where Azure loses the "July" label and
from that row on pairs each remaining label with the NEXT row's amounts:

    row 6    Month null        400 / 590 / 345     <- July's amounts, unlabelled
    row 7    Month "July"      730 / 785 / 205     <- August's amounts
    row 12   Month "December"  925 / 720 / 175     <- the ANNUAL TOTALS
    row 13   Month "Annual Totals"  (no amounts)

I keyed on the label, straight off the Form 1042-S finding that content beats order. That shifted
six months and lost the annual totals entirely. **Part III's month names are PRE-PRINTED on the
blank form**, so a row's identity is its row number in that table and the label is an echo of it.
A table row number is not the reading order of glyphs on a page: one is the grid the model
extracted, the other a render artifact. The 1042-S lesson is about the second and says nothing
about the first, and I applied it anyway.

The fixture's AcroForm is what settled it rather than my reasoning - `f1_59..61` is July
(400/590/345) and `f1_77..79` the totals (925/720/175) - so this is not a one-fixture guess in the
other direction. The rule now: drop rows carrying no amounts at all (the PNG's fourteenth, which
has a label and nothing else); if thirteen remain, key by **row number** with the label as a
cross-check that WARNS on disagreement; if the count is anything else the shape is wrong, the
positions carry no authority, and the label takes over. Both renders then give the same answer,
and a dropped row or a missing label is still reported.

★ AND A JAVADOC THAT HAD BEEN UNTRUE SINCE IT WAS WRITTEN. `extractValue`'s own comment
advertised configs like `"Filer.Address.StreetAddress"`, but its recursion only stepped through
OBJECT fields - an ADDRESS stopped it, and such a path returned null. **No config used one, so
nothing was broken; the claim was simply untrue.** It is true now, and reading Azure's parsed
`valueAddress` components is better than splitting the field's `content` on its newlines, because
that text is ordered by where the boxes sit. Third instance of a comment describing work the code
did not do.

MEASURED, NOT ASSUMED. All 23 other named-model forms x both renders byte-identical before and
after the `extractValue` change (the new branch runs only after the OBJECT recursion has already
failed, so it can turn a null into a value and never change one - measured anyway). Unit suite
**2,827 / 0** (9 new), pinning the measured fourteen-row PNG shape, the shifted answer
label-keying would have produced, and the misshapen-table fallback.

Open, in priority order: **sweep the remaining 26 named-model configs against what their models
actually return** - 1095-A was the first of this class to be confirmed and there is no reason to
think it is the only one; a sweep for UI-bound statement fields with no backend column; the
dot-leader gap in `attributeRowCells`' text mode; unify the three name/address compose copies; the
four render differences from 2026-10-03; the 1099-SA phone grouping; W-2 box-12 amounts and box
14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and
mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 1042-S: the last form with no config entry, and order is not a form property

No field-mappings entry. **0 -> 73 fields, byte-identical on both renders, every one matching the
fixture's AcroForm.** The AcroForm holds 74 fields; two pairs are the tax-rate combs that collapse
into one value each, and box 9 has no field at all, so 73 is the whole form. Eighth of the original
eight. **Every one of the 56 catalogue forms now has a config entry** - that backlog is closed.

The biggest form in the catalogue and the only one where most boxes print their value ON the
label's own line rather than under it. Sixteen side rows and twenty-three cell rows, one
readCellLayout pass, the divide taken from box 13l at x 4.3455 / 510px.

★ READING THE STRIP AND SPLITTING IT ON THE FORM'S OWN TEXT IS AN ORDER RULE, AND ORDER IS A
PROPERTY OF THE RENDER. Boxes 3a/4a and 3b/4b each share ONE printed line, so a box's value is
what sits between its own label and its neighbour's. I first read the whole strip and split it on
the "4a" the form prints between the two boxes. Measured from the running extraction:

    PDF   "10 4a Exemption code 64"   -> splits to 10 / 64
    PNG   "10 64 4a Exemption code"   -> splits to 1064 / nothing

`SideRow` gained `boundedRight()`: a right-hand bound taken from a neighbouring LABEL, which is
the counterpart to the left bound `readSideRows` already derived from the anchor's own extent. A
label's position is a property of the form. Second instance of this lesson after the 2026-10-03
OCR-reading-order finding, and the first where the two renders disagree WITHIN a single row.

★ AND I NEARLY RECORDED THE WRONG REASON FOR IT. My first attempt to pin the divergence in a
test fed the five measured word glyphs to `orderForReading` and got the SAME order from both
renders - so my explanation was false as written. Line grouping runs across the whole page, so the
order these glyphs come back in depends on their neighbours elsewhere on the row and cannot be
reproduced from the row alone. I logged the two real strings out of the live extraction before
writing either the code comment or the test. A failing test that contradicts the story is the
story being wrong, not the test.

★ TEN OF EIGHTEEN MUTATIONS MADE NO DIFFERENCE, AND SEVEN GOT DELETED. Every null-field row and
null cell in the layout was broken one at a time against the live extraction:

  - **Seven null rows DELETED.** Boxes 5, 6, 7a, 7b, 7c, 7d and 8 each had a null row declared to
    bound box 2's band from below. Every left-column amount on this form is printed RIGHT-ALIGNED
    near x 4.0, past box 2's cell and inside the null third cell that box 2 needed anyway - so the
    third cell already did their work. Not "inert on this fixture": inert because of where the form
    prints its amounts. Removed rather than kept and described.
  - **Three kept as insurance, with the mutation result written beside each.** 15l's alternation,
    and box 3a's and the amendment number's right bounds, change nothing today - each is masked by
    `numericOnly`'s first-match-wins, which is itself an order rule. Kept, and labelled as
    insurance rather than structure so nobody later mistakes them for load-bearing.
  - **Eight proved load-bearing**, with the exact failure recorded: box 2 without its third cell
    reads box 3a's 10 as the gross income; box 12a without its null cell reads
    "59-0067812 12c Ch. 4 status code 775"; box 14b reads "15" (the pro-rata checkbox's own glyph)
    instead of 960.

★ WHICH GLYPHS OCR CORRUPTS IS ALSO PER-RENDER. "12l" comes back as "121" on the PNG and
survives on the PDF; "15l" survives on BOTH; "13l" and "13o" are corrupted on both. Nothing
predicts which, so every l/o box letter is now an alternation. Without 12l's the state and country
ran together and the ZIP was lost; without 13l's the GIIN took the FTIN's value.

Three more things specific to this form:

  - **Two values are printed to the LEFT of the label that names them** - the unique form
    identifier and the amendment number - which no anchor on that label can reach. Each is
    anchored on the block printed left of IT ("Internal Revenue Service", "AMENDED") and bounded
    by its own label. `amendmentNumber` had never been extracted at all.
  - **Four comb fields** (one printed box per character) OCR as separate glyphs on both renders:
    the identifier, both tax rates and the date of birth. Read as text, spacing dropped. A rate's
    point goes between its two printed cells - the form prints two 2-character combs, the PDF
    carries them as two AcroForm fields and the screen splits the model value on "." - and
    anything other than four digits is kept as read and logged rather than split on a guess.
  - **Box 9's brackets are blank-form furniture.** The "(" sits at x 0.7976 and the value and its
    ")" at x 2.5500, an inch and three quarters apart with printed label text between them. 180,
    not -180. The box also has no AcroForm field in the fixture, so it exists only as drawn text.

MEASURED, NOT ASSUMED. Eighteen forms x both renders byte-identical before and after the
`readSideRows` change (the new branch is guarded on a null check, and all four call sites are in
this one layout). Unit suite 2,818 / 0 (19 new). Also caught here: `JSON_OUT` is a PATH, not a
flag - `JSON_OUT=1` wrote to a file called "1" and my first "byte-identical" diff compared two
EMPTY sets. Same shape as the 2026-10-03 listing-diff error, caught this time before publishing.

Open, in priority order: **audit the configs that DO exist for invented field names** - five
instances, every one found by an upload rather than by looking, and now the top item with the
missing-entry backlog closed; a sweep for UI-bound statement fields with no backend column; the
dot-leader gap in `attributeRowCells`' text mode; unify the three name/address compose copies; the
four render differences from 2026-10-03; the 1099-SA phone grouping; W-2 box-12 amounts and box
14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and
mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 1098-C: two shapes in one form, and the stub has two left edges

No field-mappings entry. **0 -> 26 fields, identical on both renders, every one matching the
fixture's AcroForm**, first pass. Seventh of the original eight; only **1042-s** is left.

The top half is the usual three columns - donee and donor on the left, boxes 1-4c in the middle,
a Copy B stub on the right. From box 5a DOWN the form goes FULL WIDTH: boxes 5a to 7 run from
x 0.73 across to 6.5, under the same stub. Two divides again, both from labels, so two
readCellLayout passes - box 1's label bounds the upper-left rows, the stub bounds every box row.
The upper boxes and the full-width rows share ONE column, because each row takes its own left
edge from its own label; nothing extra was needed to put them together.

★ THE DIVIDE HAD TO COME FROM THE RIGHT PARAGRAPH. The stub has two, and they do not start at
the same x:

    "Attachment Sequence No. 155A"   begins 6.6949in / 810px
    boxes 4c and 6b, values begin    6.6138in, 6.6185in / 796px
    "Unless box 5a or"               begins 6.9862in / 848px

A divide taken from the UPPER paragraph falls LEFT of two box values and would cut them off. The
lower one clears both, on both renders. The upper stub is handled instead by box 1's null OMB
cell - the same move as every other form in this sweep, which is why it was already there.

"The stub's left edge" is not one number. I had been treating a prose column as a single x, and
it is a column of paragraphs that are each indented differently. Picking the one that clears the
content is a measurement, not a choice.

★ FIVE ROWS EXIST ONLY TO BOUND THE ROW ABOVE. Boxes 4a, 5a, 5b, 6a and 7 are all checkboxes,
and readRows ends a row at the next CELL row only - a checkbox read from a selection mark is
invisible to that bound. Box 5a is declared in BOTH passes for this reason: in pass 1 it stops
the donor's address row from running to the footer and swallowing the full-width text of boxes
5c and 6c, which start at the same x. Fourth form to need a null-field row, and the first to
need the same one twice.

Two more things specific to this form:

  - SEVEN checkbox groups, including a Yes/No pair on box 6a where the component models only the
    "Yes" side. Anchored on that label, with nearest-mark-to-the-label keeping the two apart -
    which matters here, because this fixture has BOTH marked. The printed form does not allow
    that; the fixture generator filled every checkbox. Anchoring on "Yes" answers the question
    the field actually asks either way.
  - Boxes 2b/2c/2d need the half-label-height overhang slack: "Honda" starts 0.0144in left of
    "2c Make" and "Accord" 0.0143in left of "2d Model". Without it the make and model shift one
    cell left and the model is lost. Third form to need that rule, after 5498-SA and 5498-ESA.

Also noted while reading the glyphs: attributeRowCells skips "" and "$" and anything starting
":" in text mode, but NOT a bare ".". This form prints long dot leaders (". . . . . .") on boxes
6a, 6c and 7. They do not reach a stored field here - every one of those rows is a checkbox with
a null field, or the dots sit above the cell top - but a text box with dot leaders in its band
would collect them.

MEASURED, NOT ASSUMED. The eighteen other cell-reading forms re-verified byte-identical on both
renders. Unit suite 2,799 / 0 (15 new).

Open, in priority order: **1042-s, the last form with no config entry**; **audit the configs that
DO exist for invented field names** - five instances, every one found by an upload; a sweep for
UI-bound statement fields with no backend column; the dot-leader gap in attributeRowCells' text
mode; unify the three name/address compose copies; the four render differences from 2026-10-03;
the 1099-SA phone grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on `w-2-as.pdf` and
`w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and mapping an Azure 429 to 503 rather than
a bare 500.

## 2026-10-04 - Form 1098 needs TWO label-derived divides, so it is read twice

No field-mappings entry. **0 -> 21 fields, identical on both renders, every one matching the
fixture's AcroForm**, first pass. Two of the original eight remain: 1042-s and 1098-c.

The hardest form in this sweep to BOUND. Three columns of content - the lender/borrower block
and boxes 9-10 on the LEFT, boxes 1-8 in the middle, a Copy B prose stub down the right - and
box 11 printed INSIDE that prose column, at the bottom of it.

★ NEITHER DIVIDE CAN BE A PAGE FRACTION. The window between the rightmost box value and the
leftmost prose line does not overlap between the two renders:

    PDF   values end 6.8764in   prose starts 6.9051in   ->  (0.8090, 0.8124]
    PNG   values end 1134px     prose starts 1152px     ->  (0.8265, 0.8397]

That is the 2026-10-04 page-fraction lesson in its sharpest form: not a tight margin, an EMPTY
intersection. No single number exists.

readCellLayout already derives a divide from labels - column 0's leftmost, less 2% of the width -
but exactly ONE per layout, and this form needs two (left|box and box|prose). So it is read in
TWO PASSES, each putting the content that should bound the other in its column 0 with a null
field, so that column stores nothing and exists only to place the divide. Box 11 states a right
edge of its own to opt OUT of the prose divide rather than be cut by it; its left edge still
comes from its own label.

Calling readCellLayout twice for one form is new. It is also the natural reading of what that
function does: one pass is one divide, so a form with two column boundaries is two passes.

★ AND A GUESS OF MINE THAT THE MUTATION CORRECTED - THE FOURTH THIS WEEK.

I wrote that the prose divide was needed because the stub is full of NUMERALS - "boxes 1 through
9 and 11", "the refund of interest (box 4)", "boxes 1 and 6" - so numericOnly could not filter
it, and the "9" of "through 9 and 11 is" would win box 2's amount cell because its line sits
higher.

It does not. Removing the divide leaves EVERY AMOUNT UNCHANGED on both renders, because each box
value is printed to the LEFT of the prose on the same OCR line, and "first number in the cell"
reads left to right along a line before moving down. I reasoned about vertical order and the
rule is horizontal within a line.

What the divide actually protects is the three TEXT boxes - boxes 3 and 11 are dates, box 8 is a
free description - where there is no "first number" rule to fall back on and a cell concatenates
every word in its band:

    box 3   "The information in boxes 1 05/01/2020 through 9 and 11 is"
    box 8   five prose lines, plus box 11's own label AND value, around the real answer

The comment and the test javadoc now say that. The amount case is kept as a test rather than
deleted, labelled as the thing I got wrong, because "the prose cannot reach an amount cell" is
worth knowing and worth having pinned.

MEASURED, NOT ASSUMED. The seventeen other cell-reading forms re-verified byte-identical on both
renders. Unit suite 2,784 / 0 (18 new).

FOUR PROSE CORRECTIONS IN A WEEK, all from the same move - mutate the rule, then read the result
against the EXPLANATION rather than only the assertions. It has now caught: a "one copy" claim
that was three copies; per-cell cell tops that were not load-bearing; a checkbox entry that was
not what set its field; and this. The pattern is stable enough that mutating is no longer a check
on the tests but a check on what I believe about the code.

Open, in priority order: **the two remaining forms with no config entry** (1042-s, 1098-c);
**audit the configs that DO exist for invented field names** - five instances, every one found by
an upload; a sweep for UI-bound statement fields with no backend column; unify the three
name/address compose copies; the four render differences from 2026-10-03; the 1099-SA phone
grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`;
`1099-g.png`'s duplicated phone fragment; and mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 3922, and three bounds a form can need that a label cannot give

Form 3921's ESPP sibling, no field-mappings entry, so every upload extracted nothing. **0 -> 17
fields, identical on both renders, every one matching the fixture's AcroForm.** Three of the
original eight remain: 1042-s, 1098, 1098-c.

Easier than 3921 in one way - the component models the employee name as ONE field, so no split.
Three things are its own:

★ BOXES 3 AND 4 PRINT THE SAME LABEL TEXT. Both read "Fair market value per share". They are
told apart only by their box number and by their second lines:

    3 Fair market value per share     4 Fair market value per share
      on grant date                     on exercise date

and those second lines are also what bound their cells, so the one fact distinguishes them twice.
A test asserts each regex matches its own label and NOT the other, because a form where two
labels differ by a single character is where an anchored-prefix scheme is most likely to be
quietly wrong.

★ BOX 7 NEEDED TWO BOUNDS, AND THE SECOND ONE I GOT WRONG FIRST. It is a DATE, so it reads as
text, and the prose Copy B stub beside it cannot be filtered by numericOnly the way an amount
box filters it for free. So it states a right edge - 0.75 of the width, inside a real gap on
both renders (PDF 5.7876 -> 6.9624in, PNG 1115 -> 1366px).

That was not enough. A column with ONE row has no next row, so its band runs to the footer, and
box 8's own two label lines sit inside this column's edges. The first run returned

    09/15/2026 8 Exercise price per share determined as if the option exercised on the date
    shown in box 1

Box 8 is now named below it with a null field - the same "a row that stores nothing can still be
load-bearing" move as Form 5498-SA's telephone and Form 5498-QA's box 5. Third time; it is a
pattern now rather than a trick.

★ THE PNG READS A VERTICAL RULE AS A "|". The corporation's label comes back as
"|CORPORATION'S name, street address, ..." on the PNG and without the pipe on the PDF, so that
one regex is deliberately NOT anchored. Anchored it would miss on the PNG only - a render
DISAGREEMENT, which is the failure that looks like success on either render taken alone. This is
the same hazard as Form 1098-Q, where both renders merged "ISSUER'S TIN" into the label line; the
difference is that there it happened on BOTH renders and here on one.

MEASURED, NOT ASSUMED. The sixteen other cell-reading forms re-verified byte-identical. Unit
suite 2,766 / 0 (13 new).

AND A PREDICTION OF MINE THAT WAS WRONG. I wrote a test asserting that without its right edge
box 7 would pick up only "Service." - reasoning that "the Internal Revenue" sat above the cell
top. It does not: its centre is 2.4707 against a cell top of 2.4635, a hundredth of an inch
INSIDE the band, so both stub lines bleed in. The test now carries the measured value and a note
that I had expected otherwise. A hundredth of an inch is exactly the margin at which reasoning
from a glance at the numbers stops working, which is the same lesson as the row-pitch cap and
the cell-overhang slack.

Open, in priority order: **the three remaining forms with no config entry** (1042-s, 1098,
1098-c); **audit the configs that DO exist for invented field names** - five instances, every one
found by an upload; a sweep for UI-bound statement fields with no backend column; unify the three
name/address compose copies; the four render differences from 2026-10-03; the 1099-SA phone
grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`;
`1099-g.png`'s duplicated phone fragment; and mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 3921 box 6: the TIN was right and unlabelled, which made it wrong on screen

Reported: the TIN in box 6 should say it is a TIN, as the uploaded statement does. It should.
The form prints

    Bright Star Holdings LLC, 3 Depot St, Austin, TX
    78702, TIN 335577991

and the replica joined box 6's four model fields with newlines, so the screen showed
"335577991" on a line of its own among the address lines, with nothing saying what it was. It
now reads "TIN 335577991". The model keeps the bare identifier - that is what the field is for -
and the read-back strips the label again.

★ THE SAME FACT CUTS BOTH WAYS. Yesterday I declined to split street and city out of box 6,
because the form gives no delimiter for them and a wrong split is worse than an unsplit value.
But it DOES delimit the TIN, in its own printed text, which is exactly why extracting the TIN
separately was defensible. The same fact then says the TIN must be DISPLAYED labelled: a value
is only self-explanatory on screen if the thing that made it separable is still visible. I took
half the consequence of that and left the other half.

★ AND THE LABEL FIXED A ROUND-TRIP BUG IN THE SAME FOUR LINES. The write drops empty fields
with filter(Boolean) while the read-back was POSITIONAL:

    write   [name, TIN, street, csz].filter(Boolean).join("\n")
    read    name = line 0;  TIN = line 1;  street = line 2;  csz = line 3

So every line after a blank one shifted. With no corporation name the TIN was read back AS the
name - and no name is the NORMAL case here, because extraction leaves street and city/state/zip
unsplit on purpose. A labelled line can be found instead of counted to, so the TIN is now
located by its own label and the remaining lines fill name/street/zip in order. The test
requires "TIN" followed by an identifier, so a corporation actually named "TIN Holdings" is not
mistaken for it.

Two writers disagreeing about a shared encoding - one dropping empties, the other counting
positions - is the same class of defect as the compose copies and the two numeric paths that
disagreed about "(500)". Neither side is wrong on its own; they were never read together.

The form view is unaffected - it has four separately labelled inputs for box 6 and already said
"Corporation TIN (Box 6)". The backend is unchanged. Build green.

## 2026-10-04 - Form 3921 merged two boxes into one money field, and why that was invisible

Fifth form in this sweep with invented config key names, and the worst-behaved of them. Box 4
arrived holding BOTH boxes:

    exercisePricePerShareAmount     (absent)
    fairMarketValuePerShareAmount   "9401\n$ 9402"     PNG
    fairMarketValuePerShareAmount   "9401\n$\n9402"      PDF

Box 3 gone, both numbers in one field, and the two renders disagreeing on the spacing inside it -
so each looked complete on its own while saying something different. Six fields of fifteen came
through. **6 -> 16, identical on both renders, every one of the 14 AcroForm values accounted for**
(the employee name splits into first/last, box 6 into name and TIN).

The config entry is now just the corrected flag. The layout overwrites the bad values anyway -
readRows uses put, not putIfAbsent - but leaving seven key names that match the wrong pairs is a
trap for whoever reads the entry next and believes it.

★ THE COPY B STUB IS PROSE, AND THAT IS THE WHOLE DIFFICULTY. On every form so far the
instruction column was filtered out for nothing by numericOnly, because the boxes beside it hold
amounts. Here boxes 1 and 2 hold DATES. Each names the stub label beside it as a second,
null-field cell - "OMB No" for box 1, "(Rev. April" for box 2 - so the stub lands in a cell that
stores nothing. Box 6 is the only row on the form that states a right edge, because it is free
text with nothing to its right to anchor on, and 0.81 of the width falls in a real gap on both
renders (PDF 6.7045 -> 7.0292in, PNG 1304 -> 1368px).

Box 6 prints ONE box for the corporation's "name, address, and TIN" while the component models
four fields. Only the TIN is delimited by the form itself, in its own printed text, so that much
is split off and the rest left whole. Street and city/state/zip are NOT guessed out of the
remainder: the form gives no delimiter for them, and a wrong split is worse than an unsplit
value. Same reasoning as leaving a field alone rather than inventing its parts.

★ AND THE REASON A WRONG VALUE WAS VISIBLE AT ALL: coerceValue RETURNED THE TEXT.

    if (isAmountAppKey(appKey)) {
        try { return Double.parseDouble(cleaned); }
        catch (NumberFormatException ignored) { /* fall through to string return */ }
    }
    return trimmed;

An *Amount key is a declaration that the field is a number. Falling through to the raw string
looks harmless and is not: PayloadCoercion.decimal drops a non-numeric string at save time, so
the value can NEVER persist - but it is returned in the extract response, and the screen renders
it into a money input. That is the entire mechanism by which a config error became two boxes of
text displayed in box 4. The value was unsavable and unexplainable, and shown anyway.

It is now declined and logged. A parenthesised figure is also read as the negative these forms
print it as - which the numericOnly cell path already did and this one did not, so the two paths
disagreed about what "(500)" means. Measured across 30 forms x both renders: byte-identical
everywhere, so the change only touches the case that was producing garbage. An empty box is
honest where that was not.

MEASURED, NOT ASSUMED. All fifteen other cell-reading forms re-verified byte-identical. Unit
suite 2,753 / 0 (14 new).

ON THE REPORT ITSELF. The last two uploads came in with the same wording - "the ocr process does
not correctly extract the values now the application shows the values correctly". On Form 1098-Q
everything measured clean, including a re-derivation of the month-to-day pairing from the
AcroForm RECTANGLES rather than from field-name order, which is what my first check had used and
would have made it circular. So I asked rather than guess. Here the same sentence was a real
defect. Default: treat it as a bug report and measure - that is what found this one.

Open, in priority order: **the four remaining forms with no config entry** (3922, 1042-s,
1098, 1098-c - note 3921 HAD an entry, which is why it failed differently rather than
extracting nothing; I briefly wrote "three" here by conflating the two facts, and the
detector says four); **audit the configs that DO
exist for invented field names** - five instances now, every one found by an upload; a sweep for
UI-bound statement fields with no backend column; unify the three name/address compose copies;
the four render differences from 2026-10-03; the 1099-SA phone grouping; W-2 box-12 amounts and
box 14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone
fragment; and mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 1098-Q boxes 5a-5l: I checked the wrong half of the form for the field

Reported as the dd sub-boxes of boxes 5a-5l showing nothing. Yesterday I wrote that "the
component models only the premium, so the day is left unread" and that "no field was added".
The first half of that was false.

★ THE FIELD EXISTED; I LOOKED ONLY AT THE BACKEND. The screen has had all twelve day inputs
since the form was built:

    form-1098-q.component.ts   renders box5a_day .. box5l_day
    the component model        carries januaryDay .. decemberDay
    syncFormToPdf / syncPdfToForm   move them in BOTH directions

I grepped `Form1098QMapper.java`, found no day fields, and concluded the FORM did not model
them. The mapper is one of four layers, and it was the only one I looked at. "The model has no
field for it" is a claim about a specific file, and I stated it as a claim about the form.

So nothing was added to a statement form here - the boxes are printed by the IRS, rendered by the
UI and already named by the UI model. What was missing was the three BACKEND layers that drop
them: V267 adds twelve columns to se_form_1098_q, the entity and mapper carry them, the cell
reader takes them. **30 fields -> 42, identical on both renders, every day matching the AcroForm.**

★ AND IT WAS NOT ONLY AN EXTRACTION BUG. A day TYPED by a user was accepted by the form,
posted to the API and silently discarded - gone on reload. That had nothing to do with OCR and
has been true since the form shipped. The upload is what surfaced it. A UI-bound field with no
backend column is the same silent-drop shape as the rest of this file, from the other end: the
screen accepts the value, nothing errors, the value is gone.

varchar(2) and PayloadCoercion.string, not a number. The fixture's days include 05, 08, 03 and
07, and the UI input is type="text" maxlength="2" - a numeric type would silently drop the
leading zero on a third of them.

★ A CELL CAN NOW HOLD TWO NUMBERS, where a row asks for it. CellRow gains an optional
secondFields and attributeRowCells an overload that collects the second number per cell; passing
null is what every other form does. The premium comes first because it is printed to the LEFT of
the day and the reader takes values in printed order - a test reverses the two glyphs to show the
day would win if the form printed it first, so this rests on the form's order and not on a
tie-break. All fourteen other cell-reading forms re-verified byte-identical, which is what makes
the change additive rather than merely intended to be. Unit suite 2,739 / 0.

TWO SELF-INFLICTED DETOURS, both worth the note:

    the migration said se_1098_q      taken from the entity CLASS name Se1098Q rather than its
                                      @Table annotation, which says se_form_1098_q. Liquibase
                                      failed the whole startup - the GOOD case, because a wrong
                                      table name cannot fail quietly. Read @Table, not the class.
    TaskStop left the JVM running     stopping run-dev.ps1 by its task id killed the PowerShell
                                      wrapper and orphaned the Quarkus JVM, which kept port 8080
                                      and its Dev Services container. The next start failed on a
                                      bound port; both had to be cleared by hand. A dev server
                                      that "failed to start" still serves its error page on 8080,
                                      so the port being busy is not evidence the app is up.

Open, in priority order: **the four remaining forms with no config entry** (1098, 1098-c, 3922,
1042-s); the audit of the configs that DO exist for invented field names; **a sweep for the shape
this entry found - UI-bound statement fields with no backend column**, which the pdfRaw detector
does not catch because the UI side is complete; unify the three name/address compose copies; the
four render differences from 2026-10-03; the 1099-SA phone grouping; W-2 box-12 amounts and box
14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone fragment;
and mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 1098-Q, and a mutation that edited the wrong form

**0 fields -> 30, identical on both renders, every one matching the fixture's AcroForm.** Four of
the eight catalog forms with no config entry remain: 1098, 1098-c, 3922, 1042-s.

STATEMENT CAPTURE ONLY, AND THE SCOPE NOTE STANDS. Form 1098-Q is an issuer-filed information
return with no line on Form 1040 - that is still true and nothing here changes it. But it sits in
the statement catalog, so an upload of it should record what the participant received. I had
flagged this as needing a decision rather than a layout; the upload was the decision. Worth
separating the two questions in future: "does this form produce a return line" and "should an
upload of it extract" have different answers, and the out-of-scope note only ever answered the
first. Same shape as an out-of-scope blocker outliving its own feature (see the §962 note of
2026-09), one category up: there the flag outlived the compute, here the scope note was read
as answering a question it never addressed.

★ EACH MONTHLY CELL HOLDS TWO NUMBERS. Boxes 5a-5l print a premium AND the day of the month it
was paid, side by side in one cell:

    5a January     $        9304   05        premium x 4.8135, day x 5.2289
    5b February    $        9306   08        premium x 6.2126, day x 6.6233

The component models only the premium, so the day is left unread and no field was added. What
makes that safe is position rather than luck: the premium is printed to the LEFT of the day, and
"first amount in the cell wins" reads left to right along the line. A test reverses the two
glyphs to show the day would win if the form printed it first - the layout depends on the form's
order, and says so.

★ TWO RENDER-SPECIFIC DETAILS, AND A DISAGREEMENT IS WORSE THAN A BLANK. Both were confirmed
load-bearing by mutating them against the live extraction, and each one removed makes the PNG
DISAGREE with the PDF rather than simply blank a field - which is the worse failure, because each
render then looks complete on its own.

    box 5l         the PNG reads its label as "51 December". Anchored on "5l" alone the row does
                   not resolve there and December is lost on that render only. Form 1097-BTC's
                   box 5l already carried this alternation for the same reason - the comment now
                   credits it instead of presenting it as new.
    ISSUER'S TIN   has NO label of its own: both renders merge the issuer box's first label line
                   with it into one OCR line. So it comes from the key-value pass - and on the
                   PNG that pair reads "998877665 Hartford," because the issuer city bleeds in
                   from the box to its left, so only the leading identifier is kept.

Box 2's checkbox entry names the second line of its label, where the mark is printed. Mutation
shows that is NOT what sets the field - Azure also reports it as a ":selected:" pair, as on
Form 5498-QA - and the comment says so rather than claiming otherwise. Fourth time this week.

★ THE MUTATION EDITED THE WRONG FORM, AND REPORTED "NO CHANGE".

My first run of the box-5l mutation replaced Form 1097-BTC's identical row, because the search
string

    new CellRow(new String[] { "^5k November", "^5[l1] December" },

appears TWICE in the file and the patch asserted only that it was present, not that it was
unique. The run came back "no change" on both renders, and the conclusion that followed - that
the alternation does nothing - was the exact opposite of the truth. I caught it only because the
result contradicted the line text I had measured ten minutes earlier.

The lesson is narrow and mechanical: every patch and mutation script in this sweep asserts
`X in s`. That is the wrong assertion. It must be `s.count(X) == 1`, or the edit must be anchored
on something unique to the form - the surrounding field names work. A mutation that silently
edits a different form does not fail; it produces a clean, plausible "no change" and invites
precisely the wrong conclusion. Which is the same failure mode as every other entry in this file.

MEASURED, NOT ASSUMED. The fourteen other cell-reading forms re-verified byte-identical on both
renders. Unit suite 2,735 / 0 (11 new).

Open, in priority order: **the four remaining forms with no config entry** (1098, 1098-c, 3922,
1042-s); the audit of the configs that DO exist for invented field names; unify the three
name/address compose copies; the four render differences from 2026-10-03; the 1099-SA phone
grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`;
`1099-g.png`'s duplicated phone fragment; and mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 5498-QA, and the third prose correction in three days

Third and last of the 5498 siblings with no field-mappings entry. **0 fields -> 28, identical on
both renders, every one matching the fixture's AcroForm**, first pass. Five of the eight are
left: 1098, 1098-c, 1098-q, 3922, 1042-s - and those are real layouts rather than siblings.

The left region is Form 5498-ESA's exactly, ISSUER for TRUSTEE, carried across unchanged. The
right is eight boxes rather than two, two to a row from box 3 down; box 5 is a checkbox whose
label runs to four lines and box 7 holds a code rather than an amount.

★ TWO OF MY OWN COMMENTS WERE WRONG, AND MUTATION CAUGHT BOTH.

The checkbox entry names box 5's LAST label line, because its mark is printed 0.33in below the
first - more than the single line height readSelectionMarks allows:

    the mark's vertical centre        2.2315in
    "5 If checked, account" centre    1.9050in   (height 0.1051)   0.3266in away
    "on this form" centre             2.2416in   (height 0.1003)   0.0100in away

I wrote that without the third element the box reads as unchecked. It does not. Azure ALSO
reports box 5 as a ":selected:" key-value pair keyed "5 If checked...", and readCheckboxes
matches that on the label prefix - a second, independent source I had forgotten was there.
Dropping the third element left all 28 fields unchanged on both renders.

The second: box 5's four-line label extent does not change the output either, because its cell
carries a null field and anything read into a null-field cell is discarded.

Both entries stay. They describe the form correctly, they make the GEOMETRIC path right rather
than accidentally absent, and the selection marks are the more dependable of the two sources.
But they are redundancy, not rescue, and the comments and the test javadoc now say so.

★ THREE DAYS, THREE PROSE CORRECTIONS, ALL FROM THE SAME MOVE.

    10-04  composeNameAddress said these twelve lines were reduced to "one copy"    there were 3
    10-04  a test javadoc credited PER-CELL cell tops for a two-line label block    collapsing
                                                                                   them changed
                                                                                   nothing
    10-04  a comment said a checkbox entry was what set the field                   a kv pair was

Each was written in good faith, each read as fact afterwards, and each named a mechanism that was
not the one doing the work. The move that caught all three is the same: mutate the rule, then
read the result against the EXPLANATION and not just the assertions. A test that still passes is
telling you something about your comment. I now do this deliberately rather than as a by-product
of checking the tests.

MEASURED, NOT ASSUMED. The thirteen other cell-reading forms re-verified byte-identical on both
renders. Unit suite 2,724 / 0 (11 new).

Open, in priority order: **the five remaining forms with no config entry** (1098 and 1098-c next;
1098-q still needs a scope call, since it is recorded out of scope for the return yet sits in the
statement catalog); the audit of the configs that DO exist for invented field names; unify the
three name/address compose copies; the four render differences from 2026-10-03; the 1099-SA phone
grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`;
`1099-g.png`'s duplicated phone fragment; and mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 5498-ESA, the second of the eight, and a test that credited the wrong rule

Same cause as its sibling: no `5498-esa` key in field-mappings.json, so every upload extracted
nothing. **0 fields -> 22, identical on both renders, every one matching the fixture's AcroForm**,
first pass. Six of the eight are left: 5498-qa, 1098, 1098-c, 1098-q, 3922, 1042-s.

The frame is 5498-SA's and most of it carried straight across - two numbered boxes instead of
six, no telephone (so neither the SideRow nor the null-field boundary row that form needed), and
the year printed level with box 2 rather than box 1. The left region is again bounded by where
the box labels begin rather than by a page fraction, which mattered again: this pair is cropped
differently too, the PDF a full page and the PNG tight to the form.

Its own wrinkle is the trustee block, which splits its four address labels across two printed
lines while all four values sit on one line below both:

    City/town                                    ZIP/foreign code      y 1.1888
                        State/province  Country                        y 1.1840 / 1.1888
    Eugene                 OR           US            97401            y 1.3464

The second label line falls inside the row's band and is kept out by the cell tops.

★ A SECOND FORM CONFIRMS YESTERDAY'S SLACK. The half-label-height overhang rule was written
for 5498-SA. This form needs it independently - "US" starts 0.0286in left of "Country", "Oregon"
0.0191in left of "State/province", "USA" 0.0143in left of "Country" - so it is a property of how
these forms print their boxes, not of the one fixture it was derived from. That is the first time
in this sweep a rule has been confirmed by a form other than the one that forced it.

★ AND A TEST OF MINE CREDITED A RULE IT DID NOT EXERCISE. My first draft of the test javadoc
said the two label lines worked because cell tops are measured PER CELL. I mutated the tops to a
single shared one for the whole row: all eight tests still passed. The claim was not established
by anything I had written, and the real reason is simpler - both label lines sit above the tops,
per-cell or not. (Forms 1097-BTC and 5498 do need per-cell tops. This one does not.)

The mutation was run to check the tests, and it caught the PROSE instead. Same shape as the
compose-consolidation note two entries ago: an explanation written in good faith, carried as
fact, describing a mechanism that is not the one doing the work. A comment is not checkable, so
the only way it stays true is if something fails when it stops being true - which is exactly
what mutating a rule tests. Worth doing for the explanation and not just the assertion.

MEASURED, NOT ASSUMED. The other twelve cell-reading forms re-verified byte-identical on both
renders. Unit suite 2,713 / 0 (8 new); mutating the overhang slack to zero fails 6 of the 8.

Open, in priority order: **the six remaining forms with no config entry** (5498-qa next, the last
close sibling; 1098-q still needs a scope call); the audit of the configs that DO exist for
invented field names; unify the three name/address compose copies; the four render differences
from 2026-10-03; the 1099-SA phone grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on
`w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and mapping an Azure 429
to 503 rather than a bare 500.

## 2026-10-04 - Form 5498-SA had no config entry, and SEVEN more still do not

Every upload of this form extracted nothing, because `5498-sa` was simply absent from
field-mappings.json. This time I checked the whole catalog instead of the one form reported:
**eight** of the 56 catalog forms have no entry at all.

    5498-sa                       fixed here
    5498-esa, 5498-qa             close siblings of it
    1098, 1098-c, 3922, 1042-s    separate layouts
    1098-q                        no entry, and recorded OUT OF SCOPE as a return attachment -
                                  but it is still listed in the statement catalog, so whether an
                                  upload of it should extract is a decision, not an oversight

The answer key came first: the fixture PDF's own AcroForm (`topmostSubform[0].CopyB[0]`) carries
all 29 values, so the target was known before a single line of layout was written. That is the
third form where building the key first turned a day into an hour.

Boxes 1-6 on the right, trustee and participant blocks on the left. Box 6 is a checkbox strip
and bounds boxes 4 and 5 above it; the calendar year is printed in the OMB block beside box 1,
as on Form 1097-BTC. **0 fields -> 29, identical on both renders, every one matching the key.**

★ NO ABSOLUTE X FRACTION SURVIVES THIS FORM. The PNG fixture is cropped tight around the form
while the PDF is a full 8.5x11 page, so the same content sits about half an inch apart in page
coordinates:

    TRUSTEE'S name   PDF x0 0.7449in    PNG x0 0.2147in (scaled to the same width)

Every earlier form happened to render both ways from the same crop, so page fractions worked and
I had been using them freely - RRB-1099's header SideRow still does. Here the left region states
no right edge at all and is bounded by where the BOX LABELS begin, which readCellLayout derives
from the labels themselves. Nothing in this layout is a page measurement.

★ A CELL VALUE MAY START LEFT OF ITS OWN LABEL. The rule was "a value belongs to the rightmost
label whose left edge is at or left of the value's left edge". The printed boxes inset their
contents slightly, so:

    trustee     WA   starts 0.019in LEFT of "State/province"
    participant ID   starts 0.029in LEFT of "State/province"

and both rows shifted one cell left - `trusteeCity="Spokane WA"`, `trusteeStateProvince="US"`,
the country landing under the state and the ZIP under the country. A complete, plausible address
block, wrong in every cell but the first.

Each label now allows half its own height of overhang. Half a label height is what readSideRows
already allows VERTICALLY, so the constant is not new, and it is far inside the 0.50in gap
between the cells it applies to. Being a fraction of the LABEL rather than of the page, it holds
on both renders - which is the whole reason it works here.

MEASURED, NOT ASSUMED - AND THIS ONE WAS A SHARED RULE. The slack changes cell attribution on
every form that reads by position, so I measured all eleven of them with the slack at zero and
then at a half: Form 2439, the three K-1s, 1099-SB, 1099-LS, 1097-BTC, 5498, RRB-1099, RRB-1099-R
and SSA-1099 are byte-identical either way, on both renders. 5498-SA is the only form it moves,
and it moves it from wrong to right. Unit suite 2,705 / 0 (9 new); 7 of the 9 fail with the slack
removed and the 2 that do not are the pure config-shape assertions.

Also worth keeping: the telephone is printed BESIDE its label rather than under it, so it is a
SideRow - but it ALSO needs a null-field cell row, because readRows bounds a row at the next
CELL row only. Without it the trustee address row ran on over the telephone line and took it in
("Spokane Telephone number:", "WA +1 509"). A row that stores nothing can still be load-bearing.

Open, in priority order: **the seven remaining forms with no config entry** (5498-esa and 5498-qa
first, as siblings of this one; 1098-q needs a scope decision); then the audit of the configs
that DO exist for invented field names; unify the three name/address compose copies; the four
render differences from 2026-10-03; the 1099-SA phone grouping; W-2 box-12 amounts and box 14b;
`employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and
mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-04 - Form 1099-SA printed the trustee name twice, and "one copy" was three

Reported as the TRUSTEE'S/PAYER'S name repeating its first name. The extraction was right; the
composition was not. Azure split the party box MID-NAME on the PDF render:

    Payer.Name        "Alex Manning,"
    Payer.Address     "Alex\n4 Oxford Street, London, ON, Canada, 12345, +1"
    Payer.PhoneNumber "416 234 1234"

The address's first line IS the name's first word, and the existing guard only fires when the
address repeats the WHOLE name - so the composed box printed the name and then "Alex" again
underneath. The PNG render of the same fixture splits the box cleanly, which is why it showed on
one render only. (It also splits the PHONE differently on each render; that part was already
being repaired.)

`dropNameFragmentLine` drops a first line whose TOKENS are a leading prefix of the name's tokens.
The negative cases are the design, not the padding:

    "Oxford Trust" vs "Oxford Street 4\nLondon, ON"  kept - "oxford street 4" is not
                                                        a prefix of the name, only a shared word
    "Alex Manning" vs "A\n4 Oxford Street"           kept - a bare initial matches far too easily
    a single-line address                               never touched, so this cannot empty one
    the WHOLE name as the first line                    left to nameAlreadyInAddress

★ AND THE CONSOLIDATION I DOCUMENTED NEVER HAPPENED. `composeNameAddress` carries a note
saying these twelve lines "had been written out once per form" and were reduced to "one copy, so
the next form to need this cannot inherit the bug again." That was true of 1099-A, 1099-C and
1099-CAP. It missed `postProcessParties` - which serves 1099-DIV/G/INT/MISC/NEC/OID/PTR/Q/QA/R/SA
plus 1099-K, 1099-S and 1099-LTC under their own party prefixes - and `postProcess1099B`. Three
copies, each with its own call to the same guard, and the form that broke went through the copy
the note did not cover.

A comment claiming a refactor is not the refactor. The guard went into all three rather than the
one this form takes, because the other two are one fixture away from the same report. Unifying
them is now an open item: `postProcessParties` also does `reassembleSplitPhone` and a
trailing-comma strip that `composeNameAddress` does not, so merging them changes behaviour for
1099-A/C/CAP and needs its own before/after.

MEASURED, NOT ASSUMED. Baselined all 18 affected forms x both renders on the committed code, then
re-measured with the fix: exactly ONE difference, the stray line on 1099-SA's PDF. Unit suite
2,696 / 0 (13 new) - and with the guard neutralised the six positive tests fail while the seven
negative ones correctly do not, which is what makes them worth having.

Not changed, and not reported: 1099-SA's phone grouping still differs between renders (PNG
"+1 416 234 1234", PDF Azure's normalised "+14162341234"). The digits are right on both. Fixing
it touches phone handling on every form, so it waits for its own baseline.

Open, in priority order: **audit the remaining tax-model and key-value configs for invented field
names**; unify the three name/address compose copies; the four render differences from 2026-10-03;
the 1099-SA phone grouping; W-2 box-12 amounts and box 14b; `employeeSuffix` on `w-2-as.pdf` and
`w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and mapping an Azure 429 to 503 rather than
a bare 500.

## 2026-10-03 - RRB-1099-R box 10 was blank, and the OCR was not at fault

Reported as "OCR fails to read box 10 for rrb-1099-r". It does not: the extraction returns
`medicarePremiumsTotalAmount` = 1764.60 on both renders, and has since this morning's fix. The
value was lost on the way to the screen.

`form-rrb-1099-r.component.ts` contains TWO replicas of the form. The visible one labels box 10
"Medicare Premium Total" and binds `pdfRaw['box10']`. The other - hidden behind `*ngIf="false"`,
an older revision of the form - labels box 10 "Rate of Tax" and puts the Medicare total in box 12.
`syncFormToPdf` wrote `r['box12']` and `syncPdfToForm` read it back, so the one key the screen
actually renders was never written by anything. Both are written now, and the read-back prefers
whichever the visible replica filled, so re-enabling the retired layout still works.

★ A SECOND SILENT-DROP SHAPE, AND THE SWEEP THAT ALMOST MISSED IT. The first shape was a
config naming fields Azure does not produce (four forms). This one is a rendered binding that no
sync writes: the extraction is right, the model is right, and the box is empty. Nothing fails.

I wrote a detector for it - pdfRaw keys the template renders that the component never writes -
and the first three versions each reported "clean" across every component:

    v1  guessed the hidden replica's extent by indentation, and swallowed the visible one
    v2  tracked tag depth properly, but ended the template at the first "syncFormToPdf",
        which the template itself calls as an event handler on line 44 - so it read 44 lines
    v3  scanned the body for quoted strings; an apostrophe mis-pairs the quotes, and `r` was
        rebound by the loop above it, so the body window started in the wrong place

Each "clean" was a green light from a detector looking at almost nothing. What caught all three
was running it against the PRE-FIX file as a control, where the answer was known: it must report
box10 and nothing else. It now does.

Result across the statement components: box 10 here was the only instance where the model already
held the value. The other 41 hits are a different thing - 1099-MISC boxes 13a/13b/14 and the
split payer address have no model field at all (adding one needs sign-off), the W-2G signature
boxes are out of scope by the self-filing rule, and the W-2 box-12 code/amount pairs were already
on the open list.

Open, in priority order: **audit the remaining tax-model and key-value configs for invented field
names**; the four render differences from the previous entry; W-2 box-12 amounts and box 14b;
`employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`; `1099-g.png`'s duplicated phone fragment; and
mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-03 - Form RRB-1099-R, and a claim of mine that was not true

Twelfth form in the statements sweep, and the FOURTH with invented key names in its config:
`EmployeeContributions`, `ContributoryAmountPaid`, `VestedDualBenefit` and six more. Nine of them
happened to match nine of the ten printed boxes, so box 8 (repayments for prior or unknown years),
the tax year and both header checkboxes had no source at all.

The form is the same frame as RRB-1099 down to the header strip - two cells on the first row,
three on each of the two middle rows, two on the last - so it reuses that form's header SideRow
and checkbox list and only needed its own grid. **9 fields -> 13, identical on both renders**, and
13 is every value the page prints. The component also models a payer id, a recipient name and
address, a rate of tax and a country; this form prints none of them, and they stay empty.

★ THE PREVIOUS ENTRY'S VERIFICATION CLAIM WAS FALSE. Yesterday I wrote that the three K-1s,
2439, SSA-1099, 1099-SB, 1099-LS, 1097-BTC, 5498, 1099-DA, 1099-A and 1099-C were all
"byte-identical". Four of them are not, and never were:

    schedule-k1-1065    part3Line11Amount          png 375    pdf 37
    schedule-k1-1120s   part3Line10Row5Amount      png 715    pdf 71
    1099-a              lenderNameAddress          a newline where the PDF has a space
    1099-da             ten fields                 png 58, pdf 48; the PDF's filer phone,
                                                   country and zip are interleaved, two state
                                                   rows collapse into one, three checkboxes and
                                                   box 12a's three unit counts are lost

The first two are a digit dropped off the END of a value - the kind of defect that leaves a
plausible number in place, which is why it survived. I confirmed all four exist on the committed
code as well, by stashing this change and re-measuring, so none of them is a regression from this
work; they are open defects that my own summary had declared absent.

The cause was the measurement, not the forms. I compared the two renders by piping the extractor's
aligned text listing through `sed` and `sort`. Values containing a NEWLINE - 1099-A's lender
address, 1099-DA's scrambled PDF fields - break one record into two lines, and the comparison
silently read the continuation as a separate field. A later attempt to repair the parser made it
over-count instead (18 fields became 20 lines). The format was never the right thing to diff: the
extractor now writes one JSON line per field under `JSON_OUT`, which survives any value, and every
number in this entry comes from that.

★ AND THE PITCH RULE WAS LOAD-BEARING FOR BOTH RRB FORMS. Yesterday's note said the
four-label-height cap put RRB-1099's last row 0.01in outside its band. RRB-1099-R's last row is
0.036in outside the same cap - so the rule I changed for one form was already needed by the next,
and the new `GenericFieldMapperRrbCellGeometryTest` pins both from measured fixture coordinates:

                     label top   label h   cap = top + 4h   first value's centre
    RRB-1099           4.3498     0.1689       5.0254            5.0375
    RRB-1099-R         4.3558     0.1629       5.0074            5.0435

Reverting the pitch to the cap fails exactly the two tests that read those rows, and nothing else.

Also, the claim-number tidy shared by both forms (box 1 prints "<claim number> / <payee code>" and
the renders tokenise the slash differently) was written `replaceAll("\s*/\s*", ...)` with ONE
backslash. That compiles - since JEP 378, `\s` in a Java string literal is an escape for a SPACE -
so it worked on the spaces it was given and would have ignored a line break or a tab. It is now
the whitespace class it was meant to be, with a test over both.

MEASURED, NOT ASSUMED. Every one of the 14 forms fixed before this one re-verified byte-identical
to the committed code, field by field, through the JSON comparison. Unit suite 2,683 / 0 failures
(8 new).

Open, in priority order: **audit the remaining tax-model and key-value configs for invented field
names** - FOUR instances now, every one found by a user upload rather than by looking. Then the
four render differences above (1099-DA's PDF is the worst of them), the `w-2.pdf` box-12 amounts
and box 14b, `employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`, `1099-g.png`'s duplicated phone
fragment, and mapping an Azure 429 to 503 rather than a bare 500.

## 2026-10-03 - Form RRB-1099, and an audit I named and then did not do

Eleventh form in the statements sweep. Seven of eleven boxes came through; boxes 6 to 9 (workers'
compensation offset and the three prior-year SSEB amounts), the tax year and both header
checkboxes had no source at all.

The form is a plain grid — two cells on the first row, three on each of the rest, every value
under its own label — so it is read by position. No stated extents needed; the whole form is one
column. The tax year sits beside its label in the header strip, and CORRECTED and DUPLICATE come
from the selection marks. **7 fields -> 14, identical on both renders.**

★ AND IT IS THE THIRD TIME FOR THE SAME CAUSE. The configured key-value map carried invented key
names — `GrossSSEB`, `NetSSEB`, `MedicarePremiumTotal` — which happened to match seven labels and
missed the rest. Form 5498 had this, Form SSA-1099 had it, and after SSA-1099 I wrote in this file
that the remaining configs were "worth auditing rather than waiting to be told one at a time", and
then told the user it was the highest-value open item. Two forms later it was still open, and they
hit the next instance.

Naming a cheap preventive action and then not doing it is worse than not having spotted it: the
cost was already known and paid for. The audit is now the first thing on the list rather than a
line at the bottom of it.

★ A SHARED RULE, LOOSENED ON EVIDENCE. The last row of a column has nothing below it to stop at,
and falls back to a guess when the page carries no "www.irs.gov/Form..." footer. That fallback
capped the row at four label-heights:

    RRB-1099's bottom row of values sits  0.69in below its labels
    the cap allowed                       0.68in

Outside its own band by a hundredth of an inch. With no footer, the row PITCH is the better
statement of how tall a row is — it comes from the form rather than from a constant — so the cap
is gone. Only a footer-less form reaches that path; every other one is bounded by a label or a
footer, and all of them re-verified byte-identical.

Also: box 1 prints "<claim number> / <payee code>", and the renders tokenise the slash differently
— the PDF reads it alone, the PNG attaches it to the claim number. Spacing around a separator is
not information, so both are normalised to what the form prints.

★ WHAT THE ELEVEN TAUGHT. Each failed the same way at root: a rule inferred from what was in front
of me, which turned out to be a coincidence of it.

    the wrapped-label gap   a threshold, then per column, then per row, then deleted outright once
                            a row could simply NAME its own last label line
    reading order           stable within a render, never between two of them
    column extents          derivable from labels, until a form printed its box numbers to the left
                            of the labels they belong to
    "the tool cannot do it" true of ONE output of the tool; selectionMarks had every checkbox
    field names             taken from the form's vocabulary, not the model's — three times
    a row's height          four label-heights, until a grid row was 0.69in tall

The correction each time was a different KIND of fact — something the form, the fixture or the
tool states outright. Building the answer key first is the same move, and it took the 1120-S from
a day's work to an hour.

MEASURED, NOT ASSUMED. Re-verified live: the three K-1s, Form 2439, SSA-1099, 1099-SB, 1099-LS,
1097-BTC, 5498, 1099-DA, 1099-A and 1099-C all byte-identical. Unit suite 2,675 / 0 failures.

Open, in priority order: **audit the remaining tax-model and key-value configs for invented field
names** — three instances found by accident so far. Then the `w-2.pdf` box-12 amounts and box 14b,
`employeeSuffix` on `w-2-as.pdf` and `w-2.pdf`, `1099-g.png`'s duplicated phone fragment, and
mapping an Azure 429 to 503 rather than a bare 500.
