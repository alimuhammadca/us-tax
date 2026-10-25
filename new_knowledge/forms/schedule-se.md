# Schedule SE (Form 1040) — how the app does it

IRS rules: `C:\us-tax\new_lines\forms\schedule-se.md`. Flowchart: `C:\us-tax\new_flowcharts\forms\schedule-se.md`.
Paths are relative to `C:\us-tax`. `TRCS` = `us-tax-be/src/main/java/com/ustax/microservices/TaxReturnComputeService.java`.
`SEO-UI` = `us-tax-ui/src/app/forms/form-se-tax-options.component.ts`. The inputs that feed lines 1a and 2 are described
in `new_knowledge\forms\schedule-f.md` and `new_knowledge\forms\schedule-c.md`.

---

## 1. Status

Schedule SE is **computed per person** and shown as a preview for the taxpayer and the spouse. `computeScheduleSE`
combines the person's Schedule F net (line 1a), the CRP exclusion of a Social Security recipient (line 1b), the
Schedule C net, partnership K-1 box 14 code A, clergy housing and ministerial wages and a few typed additions (line 2),
applies the 92.35% factor, the $400 floor, the church-employee track (lines 5a / 5b), the farm and nonfarm optional
methods (Part II, with the 2-of-3-years and 5-times gates), the 2025 wage base of $176,100 less W-2 boxes 3 + 7, Form
4137 line 10 and Form 8919 line 10, and the 12.4% / 2.9% rates, rounding every line as the form does. Line 12 of both
people goes to **Schedule 2 line 4**, line 13 to **Schedule 1 line 15**. Form 4029 removes the person; Form 4361 removes
only ministerial income; notary fees are excluded.

**9 differences from the IRS rules** (D-sch-se-1 … D-sch-se-9), all low or medium-low. The ones that change tax: an
optional-method amount under $400 is still taxed (D-sch-se-1); railroad tier 1 compensation is not in line 8a
(D-sch-se-3); the Medicaid-waiver "election" adds amounts no 2025 instruction puts in self-employment income
(D-sch-se-5). The biggest Schedule-SE-related error sits on Schedule F: a farm with line E "No" is left out entirely
(D-sch-f-1).

Person filtering: line 8a W-2 wages, K-1 box 14 / box 20 and SSA / RRB statements are matched to the person's SSN
(`TRCS:29401-29402`, `:29031-29050`, `:29015-29029`, `:29071-29094`); Schedule C / F inputs are per-person forms. The
D-1a-1 root cause (a dependent's statement on the parent's return) does **not** repeat here.

## 2. Where the user enters it

| Sidebar | Form (id) | Question / field (label) | Saved key | Feeds |
|---|---|---|---|---|
| Incomes | Self-employment tax options (`se-tax-options-taxpayer` / `-spouse`) | "Do any Schedule SE special situations apply to …?" | `hasSeTaxOptions` | gate |
| | | "Church employee income (W-2 with no Social Security tax withheld)" | `churchEmployeeIncome` | line 5a |
| | | "Is … a member of the clergy filing Schedule SE?" | `isClergy` | gate |
| | | "Housing / parsonage allowance (subject to SE tax)"; amount spent; fair rental value | `clergyHousingAllowance`, `clergyHousingAmountUsed`, `clergyHomeFairRentalValue` | line 2 (allowance); line 1h excess |
| | | "Ministerial W-2 wages (church salary, no FICA — subject to SE tax)" | `ministerialW2Wages` | line 2 |
| | | "Notary public fees included in your business income (excluded from SE tax)" | `notaryFeeIncome` | subtracted from line 2 |
| | | "… were you already receiving Social Security … when you received [CRP]?" | `receivingSsBenefitsWhenCrpPaid` | line 1b |
| | | "Form 4361 approved …" / "Form 4029 approved …" | `form4361Exemption`, `form4029Exemption` | exemptions |
| | | "Use the farm optional method" / "Use the nonfarm optional method" | `farmOptionalMethod`, `nonfarmOptionalMethod` | Part II |
| | | "$400+ net self-employment earnings in at least 2 of the last 3 years?"; "How many prior years have you used the nonfarm optional method?" | `metTwoOfThreePriorYearsSe400`, `nonfarmOptionalMethodPriorUses` | nonfarm gates (pre-filled from prior returns) |
| | | "Elect to include Medicaid-waiver payments (Notice 2014-7) in SE earnings" | `medicaidWaiverIncludeInSe` | line 2 (D-sch-se-5) |
| | | "Prior-year unreported tips subject to SE tax"; "Group-term-life insurance additions to SE income" | `priorYearUnreportedTips`, `groupTermLifeAdditions` | line 2 (unverified, §8 row 22) |
| | | (also carryovers for Schedule C / F / Form 4562) | `priorYearBusinessAtRiskCarryforward`, `priorYearFarmAtRiskCarryforward`, `priorYearSection179Carryover` | not Schedule SE |

UI: `SEO-UI:54-260`; sidebar `us-tax-ui/src/app/shell/shell.component.ts:893-894`. No question exists for a minister's
unreimbursed employee expenses, employer-convenience meals and lodging, foreign-government employment, chapter 11
income or a totalization-agreement exemption (D-sch-se-9).

Other inputs read: Schedule C / Schedule F per-person nets and gross (forms `business-income-*`, `farm-income-*`);
statements **Form W-2** (`socialSecurityWagesAmount` box 3, `socialSecurityTipsAmount` box 7, `employeeSSN`),
**Schedule K-1 (Form 1065)** (`part3Line14Code` / `part3Line14SelfEmploymentEarningsLossAmount`; `part3Line20Row1-4Code`
/ `Amount` for code AQ), **SSA-1099** (`beneficiarySSN`, `benefitsPaidGrossAmount`, `netBenefitsAmount`) and
**RRB-1099** (`recipientIdNumber`, `ssebGrossAmount`, `netSSEBAmount`); the computed Form 4137 line 10 and Form 8919
line 10; the line 1d Medicaid-waiver amounts.

## 3. Where it is stored

| Data | Id | Entity / table |
|---|---|---|
| SE options | personal `se-tax-options-taxpayer` / `-spouse` | `PfSeTaxOptions` / `pf_se_tax_options` (`us-tax-be/.../microservices/personal/SeTaxOptionsMapper.java:47-67`) |
| Schedule SE output | `scheduleSETaxpayer` / `scheduleSESpouse` | `OutScheduleSE` / `out_schedule_se` (`owner_role`, `line12_self_employment_tax`, `line13_half_se_tax_deduction`, `se_net_earnings`, `nonfarm_optional_method_used`, `fields_json`); mappers `microservices/output/ScheduleSETaxpayerOutputMapper.java`, `ScheduleSESpouseOutputMapper.java` |
| Schedule 2 line 4 | `schedule2.otherTaxes.selfEmploymentTax` | `out_schedule2.other_self_employment_tax_4` |
| Schedule 1 line 15 | `schedule1.adjustments.deductibleSelfEmploymentTax` | `out_schedule1.adj_deductible_self_employment_tax_15` (`Schedule1OutputMapper.java:148`) |

## 4. How it is computed

Method: `computeScheduleSE` `TRCS:29128-29496`, called `TRCS:4087-4098` (before the farm merge, so farm and nonfarm
stay separate for Part II). Constants: `us-tax-be/.../microservices/ReferenceData.java:12-39` (176,100; 0.9235; 0.124;
0.029; 400; 108.28; 7,240; 7,840; 10,860; 0.72189; ⅔). Per person (`side` 0 = taxpayer, 1 = spouse; the spouse is null
on MFS):

1. **Form 4029** → the person is skipped entirely (`TRCS:29172-29176`).
2. **Line 1a** = the person's Schedule F net of participating farms (`fNet`, `TRCS:29178`); farms with line E "No" are
   missing (D-sch-f-1).
3. **Line 2** (`cNet`) = Schedule C net for SE (statutory-employee businesses already excluded upstream) − ministerial-
   flagged Schedule C net (moved to the ministerial base) + K-1 box 14 code A (all K-1s, farm or not — D-sch-se-8) +
   `priorYearUnreportedTips` + `groupTermLifeAdditions` + (if `medicaidWaiverIncludeInSe`) the person's whole line 1d
   amount (D-sch-se-5) − `notaryFeeIncome` (`TRCS:29177-29213`, `:29256-29258`).
4. **Line 1b** — CRP = Schedule F `crpPayments` of participating farms + K-1 box 20 code AQ. Subtracted when the answer
   `receivingSsBenefitsWhenCrpPaid` is Yes, or, if blank, when an SSA-1099 / RRB-1099 with gross benefits is found for
   the SSN (`TRCS:29219-29249`; `benefitsReceived` `:29066-29069`). Two advisories cover the mismatch cases.
5. **Clergy** — housing allowance + ministerial W-2 wages + ministerial Schedule C net form the ministerial base, zeroed
   by Form 4361 (`TRCS:29263-29278`); an advisory fires when ministerial wages have no matching W-2 (`:29270-29273`).
6. **Line 3 / 4a (regular method)** — `combined = cNet + fNet + ministerialBase`; net earnings = combined × 0.9235 if
   positive, else 0 (`TRCS:29301-29304`). (The form keeps a negative line 3 on line 4a; with no other line it makes no
   difference.)
7. **Part II (optional methods)** — elected methods are applied only when the verifiable tests pass
   (`TRCS:29279-29297`): farm: gross farm ≤ $10,860 or net farm < $7,840 (`farmOptionalIncomeEligible` `:29504-29507`);
   nonfarm: net < $7,840 and < 72.189% of gross Schedule C income, plus the self-certified gates (Yes to 2-of-3 and
   fewer than 5 uses; blank = benefit of the doubt with an advisory) (`:29510-29513`, `:29566-29577`). Farm amount =
   min(⅔ gross farm, 7,240); nonfarm amount = min(⅔ (gross nonfarm − notary fees), 7,240 − farm amount); a category not
   elected uses its own regular net × 0.9235 **floored at 0** (D-sch-se-2); ministerial base added at 92.35% when the
   nonfarm method is applied (`TRCS:29305-29342`). Gross nonfarm comes from Schedule C line 7 only (no K-1 code C) and
   gross farm from Schedule F line 9 only (no K-1 code B) (D-sch-se-8). An ineligible election falls back to the regular
   method with an advisory.
8. **Line 4c and the floor** — lines 4a and 4b are rounded; 4c = 4a + 4b; if 4c < $400 and church income exists → 4c =
   0 (`TRCS:29361-29380`). The person is dropped when no optional method applied, 4c < $400 and no church income
   (`TRCS:29393-29396`). **An applied optional method skips the $400 test** (D-sch-se-1).
9. **Line 5a / 5b** — `churchEmployeeIncome` ≥ $108.28 → round(income × 0.9235), else 0 (`TRCS:29345-29347`). This
   equals the form's "less than $100 → 0" except at exactly $108.28 (99.9966 rounds to 100).
10. **Line 6** = 4c + 5b (`TRCS:29380`).
11. **Line 8a** = the person's W-2 boxes 3 + 7 by SSN (`sumW2SocialSecurityWagesAndTipsForSsn` `TRCS:52174-52195`); no
    RRTA tier 1 (D-sch-se-3), no Form 4852 or territory W-2 (D-sch-se-4). **8b** = computed Form 4137 line 10; **8c** =
    computed Form 8919 line 10; **8d** = sum; **line 9** = max(0, 176,100 − 8d) (`TRCS:29401-29416`).
12. **Lines 10–13** — line 10 = round(min(line 6, line 9) × 12.4%); line 11 = round(line 6 × 2.9%); line 12 = 10 + 11;
    line 13 = round-half-up(line 12 × 0.5) (`TRCS:29417-29450`).
13. **Totals** — Schedule 2 line 4 = Σ line 12; Schedule 1 line 15 = Σ line 13 (`TRCS:29449-29450`), set at
    `TRCS:43880-43886` and `TRCS:32872-32874` / `:33264-33265` (the line 15 output is prorated for a §931 / §933
    territory excluder, while line 26 uses the full amount — D-10-4).
14. **Community property MFS** — Schedule SE stays on the whole of the operator's own businesses; lines 1a / 2 of the
    preview are shifted to the income-tax shares; a return receiving only a community share with no SE of its own gets
    Schedule 2 line 4 box 3 "ECI" (`CommunityProperty.java:458-479`, `:501-512`).
15. **Downstream** — EIC net-SE adjustment per person (K-1, line 2 additions, housing, − CRP, optional-method swap)
    (`TRCS:29196-29199`, `:29278`, `:29330-29341`); QBI and Schedule 1 lines 16 / 17 use the trade share of line 13
    (`tradeShareOfHalfSe` `TRCS:29690-29703`); Form 8959 Part II uses the per-person net earnings.

## 5. Flags and advisories

| Code | Blocks? | When | Tells the user | Where |
|---|---|---|---|---|
| `SE_CRP_SS_TIMING_UNCONFIRMED_TAXPAYER` / `_SPOUSE` | No | CRP present, question blank, SS statement found | Confirm benefits had started when the CRP was paid | `TRCS:29233-29237` |
| `SE_CRP_SS_NOT_FOUND_*` | No | Answered Yes but no SS statement | CRP left out as answered | `TRCS:29238-29241` |
| `SE_OPTIONAL_METHOD_ELIGIBILITY_FARM_*` / `_NONFARM_*` | No | Elected method fails the income test | Regular method used | `TRCS:29518-29530` |
| `SE_NONFARM_OPTIONAL_METHOD_GATE_FAILED_*` | No | 2-of-3 = No or 5+ prior uses | Regular method used | `TRCS:29581-29597` |
| `SE_OPTIONAL_METHOD_APPLIED_UNVERIFIED_GATES_*` | No | Nonfarm method applied with a gate unanswered | Confirm the gates | `TRCS:29550-29560` |
| `MINISTERIAL_WAGES_MISSING_W2_*` | No | Ministerial wages typed, no W-2 for the person | Enter the W-2 too | `TRCS:29535-29545` |
| `COMMUNITY_PROPERTY_BUSINESS_SPLIT` | No | MFS community split | SE stays with the operator | `CommunityProperty.java:497` |

No flag covers an optional-method amount under $400, railroad compensation, or an exemption box on Schedule 2 line 4.

## 6. What it produces

| Item | Value |
|---|---|
| Per-person preview fields | `part1_line1a_net_farm_profit_loss` … `part1_line13_half_se_deduction` (`TRCS:29454-29476`); line 7 not filled (printed on the form) |
| Output model | `com.ustax.model.output.ScheduleSE` built by `buildScheduleSEOutput` (`TRCS:31362-31375`) for `scheduleSETaxpayer` / `scheduleSESpouse` (`TRCS:7634-7645`), with `seNetEarnings` and `nonfarmOptionalMethodUsed` for next year's gates |
| Schedule 2 line 4 | `Schedule2OtherTaxes.selfEmploymentTax` (`TRCS:43885`), added into line 21 (`TRCS:43920-43933`) → Form 1040 line 23 |
| Schedule 1 line 15 | `Schedule1Adjustments.deductibleSelfEmploymentTax` (`TRCS:33264-33265`) → line 26 → Form 1040 line 10 |
| Preview | `us-tax-ui/src/app/forms/form-tax-return-schedule-se-taxpayer.component.ts` / `-spouse.component.ts`, rendering `public/irs/f1040sse_elements.json` — the **2024** form (D-sch-se-7); always listed (`shell.component.ts:1814-1819`, gates `if (true /* computation?.scheduleSE… */)`) |

Schedule 2 line 4 boxes: only box 3 "ECI" is ever set (`CommunityProperty.java:510-511`); the output fields
`line4Form4029Exemption` / `line4Form4361Exemption` exist (`model/output/Schedule2OtherTaxes.java:343-346`) but nothing
sets them (D-sch-se-6).

## 7. Tests

| Test | Proves |
|---|---|
| e2e `schedule-c-se-tax.spec.ts` (6) | Schedule 2 line 4 / Schedule 1 line 15; wage-base coordination; Form 8959 Part II; EIC; Form 2210; $400 floor |
| e2e `schedule-se-preview.spec.ts` (3) | Part I lines; separate MFJ copies; lines 10 + 11 = 12 |
| e2e `se-threshold-floors.spec.ts` (4) | $400 and $108.28 floors on both sides |
| e2e `schedule-se-clergy-church.spec.ts` (4), `se-clergy-notary-optional.spec.ts` (4) | housing, Form 4361 per business, church track, ministerial wages, notary, optional advisory |
| e2e `schedule-se-crp-line1b.spec.ts` (2), `open-questions-b64-k1-crp-schedule-se.spec.ts` (3) | CRP line 1b incl. K-1 code AQ and gross-benefit receipt |
| e2e `schedule-se-line8bc.spec.ts` (2) | Form 4137 on line 8b |
| e2e `schedule-se-optional-methods.spec.ts` (3), `se-optional-method-2025-max.spec.ts` (1), `se-nonfarm-optional-gates.spec.ts` (4), `se-nonfarm-optional-autoderive.spec.ts` | Part II, $7,240 cap ($1,108 tax), gates |
| e2e `schedule-se-partnership-k1.spec.ts` (2) | box 14 code A taxed; code C alone creates no tax |
| e2e `schedule-se-line2-additions.spec.ts` (3) | tips / group-term life additions; Medicaid election and its control |
| e2e `se-taxpayer-spouse-symmetry.spec.ts`, `mfs-spouse-se-income.spec.ts`, `eic-se-earnings-coordination.spec.ts`, `se-loss-eic-earned-income.spec.ts` | spouse symmetry, MFS, EIC links |
| Java `Sc00210SqaScenarioTest`, `Sc00219…`, `Sc00220…` | whole-dollar lines 4a … 13; odd line 12 → line 13 rounds up |
| Java `Hrb2025Sc00224Test`, `Sc00355SqaScenarioTest` / `Hrb2025Sc00355Test`, `Sc00356SqaScenarioTest` / `Hrb2025Sc00356Test`, `Hrb2025Sc00287Test`, `K1CrpScheduleSeLine1bTest`, `Hrb2025Sc00084Test`, `Hrb2025Sc00214Test`, `Hrb2025Sc00390Test`, `TerritorySelfEmploymentDeductionTest` | farm optional, nonfarm optional and gates, church income, CRP timing, K-1 partners, statutory employees, notary, territory line 15 |

Untested: optional amount under $400, RRTA on line 8a, a regular-method loss beside an optional method.

## 8. Compared with the IRS rules

| # | IRS rule (source) | What the app does | Result |
|---|---|---|---|
| 1 | Line 3 = 1a + 1b + 2; losses offset (`i1040sse.pdf p. 2`) | `combined` (`TRCS:29303`) | Match |
| 2 | Line 4a = line 3 × 92.35% if positive (`p334.pdf p. 45`) | `TRCS:29304`, rounded `:29362` | Match |
| 3 | Line 4c < $400 → no SE tax; church exception (`i1040sse.pdf p. 1, 3`) | `TRCS:29375-29396` | Match for the regular method |
| 4 | The $400 test applies to line 4c **including** line 4b; Pub. 334 Example 4: under $400 by both methods → no SE tax (`p334.pdf p. 46`) | An applied optional method bypasses the floor (`TRCS:29382-29395`). Example: gross farm $540, net loss, farm optional → $360 → SE tax $55 (45 + 10) instead of $0 | **Deviation D-sch-se-1** (low) |
| 5 | Line 4a = line 3 when not positive, so a loss in the category not under an optional method reduces line 4c; nonfarm optional can't report less than actual nonfarm earnings (`f1040sse-2024 p. 1`; `i1040sse.pdf p. 5`) | The non-elected category is floored at 0 (`TRCS:29309`, `:29319`); with both methods and the cap used by the farm amount, the nonfarm amount can be below actual nonfarm earnings (`TRCS:29312-29318`). Example: farm optional $6,000 beside a $2,000 Schedule C loss → line 4c $6,000 instead of $4,000 (line 4a = line 3 = −2,000) | **Deviation D-sch-se-2** (low) |
| 6 | Line 1b CRP of a Social Security recipient, Schedule F and K-1 code AQ (`i1040sse.pdf p. 3`) | `TRCS:29219-29249` | Match |
| 7 | Church employee income: line 5a, $108.28 trigger, 5b < $100 → 0 (`i1040sse.pdf p. 1, 3`) | `TRCS:29345-29347` | Match (equivalent threshold) |
| 8 | Line 7 = $176,100 (`i1040sse.pdf p. 1`) | `ReferenceData.java:12` | Match |
| 9 | Line 8a = W-2 boxes 3 + 7 **and railroad retirement (tier 1) compensation** (`f1040sse-2024 p. 1`; `p334.pdf p. 43–44`: base shared with "the Tier 1 part of railroad retirement tax") | Boxes 3 + 7 only; W-2 `rrtaCompensationW2Box14` (stored on `se_w2`, `entity/SeW2.java:121`) not added | **Not supported D-sch-se-3** (SE social security tax too high for a railroad worker; silent) |
| 10 | Form 4852 substitutes a missing W-2 (`f4852.pdf p. 1`); territory W-2s of non-bona-fide residents | Only `w-2` statements, and only those with box a = the person's SSN | **Deviation D-sch-se-4** (same gap as D-1g-5; root of D-1a-3; low) |
| 11 | Lines 8b / 8c = Form 4137 / Form 8919 line 10 | `TRCS:29408-29415` | Match |
| 12 | Lines 10 / 11 / 12 / 13 rounded as entered (`i1040gi_ty2025.pdf p. 23`) | `TRCS:29444-29447` | Match |
| 13 | Separate Schedule SE per spouse; combined on Schedule 2 line 4 (`i1040sse.pdf p. 2`) | Per-side loop and totals | Match |
| 14 | Form 4029: no Schedule SE; Form 4361: ministerial income exempt; line A when other earnings ≥ $400 (`i1040sse.pdf p. 1–2`) | `TRCS:29172-29176`, `:29274-29275` | Match (tax) |
| 15 | Schedule 2 line 4 boxes 1 / 2 / 3 ("EAS", "ECI", "EN"); notary profit on the dotted line of line 3 (`i1040gi_ty2025.pdf p. 112`; `i1040sse.pdf p. 4`) | Only "ECI" set; 4361 / 4029 / "EN" boxes never set; notary netted inside line 2; line A not shown | **Deviation D-sch-se-6** (cosmetic) |
| 16 | Minister: housing allowance and salary on line 2 (`i1040sse.pdf p. 1`) | `TRCS:29263-29275` | Match |
| 17 | Statutory employee profit not on line 2; their W-2 social security wages on 8a (`i1040sse.pdf p. 4`) | Statutory businesses excluded upstream; W-2s all in 8a | Match |
| 18 | Notary fees not NESE (`i1040sse.pdf p. 4`) | Subtracted (`TRCS:29256-29258`) | Match (presentation: D-sch-se-6) |
| 19 | Partnership: box 14 code A to line 1a (farm) or 2; codes B / C are the gross for the optional methods (`i1040sse.pdf p. 3, 5`) | All code A on line 2; codes B / C not read (`TRCS:29031-29050`, `:29144-29147`) — a partner cannot use the farm optional method and the nonfarm test ignores partnership gross | **Not supported D-sch-se-8** (low) |
| 20 | Farm optional: gross ≤ $10,860 or net < $7,840; min(⅔ gross, $7,240) (`i1040sse.pdf p. 5`) | `TRCS:29504-29507`, `:29307-29309` | Match |
| 21 | Nonfarm optional: net < $7,840 and < 72.189% of gross; 2 of 3 prior years; 5 uses; min(⅔ gross, line 16) (`i1040sse.pdf p. 5`) | `TRCS:29286-29297`, `:29312-29318` (self-certified gates, pre-filled) | Match |
| 22 | Items in net earnings are those listed in `i1040sse.pdf p. 3–4` | Also adds typed "prior-year unreported tips" and "group-term-life additions" to line 2 (`TRCS:29206-29209`) | Unverified — neither item appears in the 2025 books; the app only adds what the user types |
| 23 | Medicaid waiver payments: the 2025 books give an earned-income **choice for credits** only (`i1040gi_ty2025.pdf p. 24, p. 42`); a home-care business reports excludable payments on Schedule C line 1 and takes them back out in Part V, so they leave Schedule C line 31 (`i1040sc.pdf p. 1, 6, 16`); payments of a person without such a business go on Form 1040 line 1d, not a business schedule (`i1040gi_ty2025.pdf p. 24`); none of the SE lists includes them (`i1040sse.pdf p. 3–4`) | `medicaidWaiverIncludeInSe` adds the person's whole line 1d amount (taxable 1099 / no-form payments **and** elected excluded payments) to line 2 (`TRCS:29210-29212`) | **Deviation D-sch-se-5** (opt-in; overstated SE tax; resolves the "unverified" note in `new_knowledge\1d.md` §9 as far as the 2025 books go; low) |
| 24 | Minister's unreimbursed employee expenses subtracted; convenience meals and lodging; foreign-government employees; chapter 11 income; totalization exemption ("EAS"); the $434 CRP filing rule (`i1040sse.pdf p. 1–3`) | No inputs; none modelled | **Not supported D-sch-se-9** (silent; low) |
| 25 | Line 12 → Schedule 2 line 4; line 13 → Schedule 1 line 15 (`i1040gi_ty2025.pdf p. 93, 112`) | `TRCS:43880-43886`; `:32872-32874` | Match (territory proration: D-10-4) |
| 26 | Line 1a = Schedule F line 34 of every farm (`i1040sf.pdf p. 9`) | Farms with line E "No" are left out | see **D-sch-f-1** |
| 27 | Community income: SE with the spouse who carried on the business; "ECI" for the other (`i1040sse.pdf p. 2`) | `CommunityProperty.java:385-512` | Match |
| 28 | Form shown is the 2025 Schedule SE | Preview renders the 2024 layout: line 7 prints 168,600, Part II prints 6,920, 10,380, 7,493 (`public/irs/f1040sse_elements.json`) | **Deviation D-sch-se-7** (cosmetic) |
| 29 | FEIE does not reduce NESE (`i1040sse.pdf p. 2`) | Schedule C / F nets are taken before Schedule 1 line 8d | Match |

Already-recorded findings that touch Schedule SE: D-1g-5 (Form 4852 wages absent from Form 8919 line 8 — the same gap
is D-sch-se-4 on line 8a), D-10-4 (line 15 proration for AS / PR excluders), D-10-8 (SE compensation for the IRA limit
subtracts only line 13), D-sch-f-1 (passive farms left out of line 1a).

## 9. Limits and out of scope

- **Form 1040-SS** filers and fiscal-year filers are not supported.
- **Form 8959** (Additional Medicare Tax on line 6) is a separate form, not detailed here.
- The nonfarm optional gates are self-certified (pre-filled from earlier returns filed in the app, V195); the app has
  no multi-year history before its first year.
- Changing between regular and optional methods after filing (Form 1040-X) is not supported.

## 10. History

| Date | Entry |
|---|---|
| 2026-10-21 | git: community property MFS — SE tax and its deduction stay with the spouse carrying on the business (V366) |
| 2026-10-19 | `history.md`: "CRP exclusion: Social Security receipt read from gross benefits (OPEN_QUESTIONS B65)"; "K-1 code AQ CRP on Schedule SE line 1b (B64)" |
| 2026-10-18 | `history.md`: "Schedule SE line 1b CRP - receiving Social Security when the CRP was paid (outstanding.md A51)"; "Rounding conventions … Schedule SE … kept and pinned (B8, B11, B13)" |
| 2026-10-17 | git: clergy housing allowance — only the smallest of designated, used and fair rental value excluded (A50, V310) |
| 2026-10-16 | git: notary profit no longer EIC earned income; QBI charges only the trades' share of line 13 |
| 2026-10-15 | git: EIC earned income uses the optional-method net earnings (line 4b) |
| 2026-08-31 | git: "Schedule SE carries whole dollars from line 4a down"; "Schedule SE line 12 adds two rounded lines, not one 15.3% step" |
| 2026-07-31 | git: "fix(se): church-employee line-4c exception + Form 8959 RRTA advisory" |
| 2026-07-29 | git: "SE nonfarm optional method: enforce prior-year/5-time gates (self-cert, V195)" |
| 2026-07-20 | git: Self-employment Stage 2 C2 — Schedule SE computed → Schedule 2 line 4, Schedule 1 line 15 |
