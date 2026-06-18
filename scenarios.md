# Tax Scenarios — J.K. Lasser 2025 Professional Edition vs. Taxbeans Implementation

Audit of every numbered topic in chapters 1–28 of *J.K. Lasser's Your Income Tax 2025, Professional Edition*, evaluated against the current Taxbeans implementation. Source: `c:/us-tax/docs/books/J.K. Lasser Institute - J.K. Lasser's Your Income Tax 2025, Professional Edition (2025) - libgen.li.txt`.

## Legend

- ✅ **Implemented** — covered end-to-end (intake + compute + output)
- ⚠️ **Partial** — wired but incomplete (intake-only, missing edge cases, or stub)
- ❌ **Not implemented** — feature absent from current codebase
- ➖ **Out of scope (intentional)** — declared OOS per CLAUDE.md or rules.md (Schedule C/SE/F, NRA returns, advisory-only content, etc.)

**Effort scale** (when not "None"):
- **S** — ≤1 day (single field/flag/threshold)
- **M** — 1-5 days (worksheet, mapper, validation)
- **L** — 1-3 weeks (new sub-form or substantial cross-form wiring)
- **XL** — 1+ month (new compute domain — depreciation engine, NOL infrastructure, decedent-return paradigm)

## Roll-up across all 28 chapters

| Chapter group | Topics | ✅ | ⚠️ | ❌ | ➖ |
|---|---:|---:|---:|---:|---:|
| Ch 1–4 (Filing/Dependents/Wages/Fringe) | 64 | 22 | 17 | 4 | 21 |
| Ch 5–8 (Div-Int/Property/Exchanges/Retirement) | 103 | 32 | 40 | 21 | 10 |
| Ch 9–12 (IRAs/Rentals/Loss-Restrictions/Other Income) | 88 | 14 | 16 | 39 | 19 |
| Ch 13–16 (AGI/Std-Itemized/Medical/Taxes) | 55 | 14 | 18 | 14 | 9 |
| Ch 17–20 (Interest/Charity/Casualty/Other-Itemized) | 54 | 1 | 9 | 43 | 1 |
| Ch 21–24 (Travel/Tax-Comp/AMT/Kiddie) | 38 | 7 | 9 | 14 | 8 |
| Ch 25–28 (Credits/Withholding/Estimated/Add'l-Medicare-NIIT) | 35 | 25 | 6 | 0 | 4 |
| **TOTAL** | **437** | **115** | **115** | **135** | **72** |

**Coverage at a glance**:
- 26% fully implemented (115/437)
- 26% partial (115/437)
- 31% not implemented (135/437)
- 16% intentionally out-of-scope (72/437)

## Cross-cutting findings

### Top 10 highest-leverage gaps (by user impact × effort)

1. **Pub 501 Worksheet 1 support-test calculator (§2.5)** — every dependency claim self-asserted; #1 IRS audit area. **Effort: M.**
2. **Form 8332 PDF generation + waiver rules (§2.7)** — custodial flag exists but PDF missing; waiver-moves-CTC-but-not-EIC rule not surfaced. **Effort: M.**
3. **ISO/ESPP basis tracker (§3.16)** — Form 6251 line 2i AMT preference unwired; biggest employee-equity gap. **Effort: L (full) / S (line 2i intake).**
4. **Form 8606 Form 5329 Parts III/IV/V/IX (§9.7, §9.13)** — excess contributions + RMD shortfall. **Effort: M.**
5. **Active-participant IRA deduction phaseout (§9.4)** — W-2 box 13 captured but not consumed. **Effort: M.**
6. **Form 4684 compute Sections A/B/C/D (§19.9)** — currently PDF stub; blocks 9 chapter-19 topics. **Effort: XL.**
7. **Form 8283 + Form 1098-C (§18.15, §18.7)** — all non-cash donations >$500 unverifiable. **Effort: XL.**
8. **Charitable AGI ceilings (§18.17)** — 60/50/30/20% caps not enforced. **Effort: L.**
9. **Form 2210 Schedule AI Box C annualized-income (§27.1)** — sole-proprietors / seasonal-income overpay penalty. **Effort: XL.**
10. **Mortgage-interest $750k cap + Form 1098 intake (§17.1-17.7)** — currently raw lump-sum; no acquisition/equity classification, no points amortization. **Effort: L.**

### Stale CLAUDE.md baseline items

- **Form 8960 NIIT IS implemented** (`TaxReturnComputeService.java:1085` calls `computeForm8960`) — CLAUDE.md says "INTENTIONALLY OUT OF SCOPE." Must update.
- **Pub 590-A IRA-deduction iterative worksheet IS implemented** (`TaxReturnComputeService.java:609-767`) — CLAUDE.md baseline says "NOT IMPLEMENTED."
- **Educator $300 cap IS enforced** (`TaxReturnComputeService.java:14407-14428`) — baseline note stale.
- **SALT $40k MAGI phasedown IS implemented** (`TaxReturnComputeService.java:29440-29462`) — baseline note stale.
- **Student loan interest $2,500 cap IS enforced** — baseline note stale.
- **2025 standard mileage rate** — CLAUDE.md cites 67¢ business (2024); correct value is 70¢ for 2025.

### Architectural OOS clusters (will not fix without product re-scope)

- **Schedule C/SE/F (self-employment)** — removes Ch 21 travel/meals, half of Ch 10 royalties, parts of Ch 18 inventory donations, Ch 28.2 Form 8959 Part II, much of Ch 11/12.
- **Schedule E rental + Form 4562 depreciation + §280A + Form 8582 passive + Form 6198 at-risk** — Ch 10 and Ch 11 wholesale gaps.
- **Single-return-per-household architecture** — Form 8615 lines 9–13 (Ch 24.3) cannot complete; decedent paradigm absent (Ch 1.10, 1.14).
- **Form 1040-NR (NRA returns)** — Ch 1.5, 1.6, 1.16, 1.18 not addressable.

### Statement coverage gaps

- **1099-DA digital-asset mapper** missing despite semantic CSV existing (Ch 12.23).
- **Form 1098-C vehicle donations** missing (Ch 18.7).
- **Form 8283** entirely absent (Ch 18.15).
- **Form 1098** intake (mortgage interest) not modeled (Ch 17.1).

---


---

# Chapters 1-4: Filing Status, Dependents, Wages, Fringe Benefits

J.K. Lasser's Your Income Tax 2025, Professional Edition — Taxbeans coverage audit. Book amounts are 2024; Taxbeans is 2025 (inflation-adjusted equivalents).

## Chapter 1 — Filing Status

### 1.1 — Which Filing Status Should You Use?
- **Description**: Five statuses chosen by year-end marital status and household-maintenance for a qualifying person.
- **Coverage**: ✅
- **Implementation locator**: `c:/us-tax/us-tax-be/src/main/java/com/ustax/microservices/personal/FilingStatusMapper.java`; `form-filing-status-taxpayer` drives MFS guards on 20+ orchestrators in `TaxReturnComputeService.java`.
- **Gap**: None
- **Effort**: None

### 1.2 — Tax Rates Based on Filing Status
- **Description**: Bracket schedule (10/12/22/24/32/35/37%) and QDCG 0/15/20% rates per filing status.
- **Coverage**: ✅
- **Implementation locator**: Line-16 logic in `TaxReturnComputeService.java`; 2025 Tax Computation Worksheet brackets; QDCG worksheet with Single $48,350 / MFJ $96,700 thresholds.
- **Gap**: None
- **Effort**: None

### 1.3 — Filing Separately Instead of Jointly
- **Description**: MFS may save tax with high AGI-floor deductions; itemize-must-match; many credits disallowed.
- **Coverage**: ✅
- **Implementation locator**: MFS cascade on 20 orchestrators; itemized-must-match guard; EIC/AOTC/LLC/PTC/student-loan/dependent-care gated.
- **Gap**: No joint-vs-separate optimizer.
- **Effort**: M (planning helper)

### 1.4 — Filing a Joint Return
- **Description**: Mechanics, signing rules, joint-and-several liability.
- **Coverage**: ✅ compute; ➖ signing-authority paperwork
- **Implementation locator**: MFJ branch throughout `TaxReturnComputeService.java`; combat-pay election handled.
- **Gap**: No POA/Form 2848 workflow.
- **Effort**: None for compute

### 1.5 — Nonresident Alien Spouse
- **Description**: §6013(g)/(h) election to treat NRA spouse as resident; alternative is MFS.
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No NRA-spouse intake, no election capture, no statement attachment.
- **Effort**: M

### 1.6 — Community Property Rules
- **Description**: AZ/CA/ID/LA/NV/NM/TX/WA/WI couples filing MFS must split via Form 8958; CA/NV/WA registered domestic partners likewise.
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No Form 8958, no community-income split.
- **Effort**: L

### 1.7 — Innocent Spouse Rules
- **Description**: Form 8857 relief.
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Standalone post-filing workflow.
- **Effort**: None

### 1.8 — Separate Liability Relief for Former Spouses
- **Description**: Form 8857 allocation.
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Same as 1.7.
- **Effort**: None

### 1.9 — Equitable Relief
- **Description**: Rev. Proc. 2013-34 catch-all.
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Same as 1.7.
- **Effort**: None

### 1.10 — Death of Your Spouse in 2024
- **Description**: Surviving spouse files joint return for year-of-death including decedent's income through DOD.
- **Coverage**: ⚠️
- **Implementation locator**: MFJ supported; no year-of-death intake.
- **Gap**: No spouse-deceased flag; no income-through-DOD partition; no auto-QSS for next two years.
- **Effort**: M

### 1.11 — Qualifying Surviving Spouse Status
- **Description**: Two years post-death with dependent child uses MFJ rates.
- **Coverage**: ⚠️
- **Implementation locator**: QSS selectable in `FilingStatusMapper.java`; uses MFJ brackets.
- **Gap**: No automated eligibility check.
- **Effort**: S

### 1.12 — Qualifying as Head of Household
- **Description**: Unmarried (or considered-unmarried) maintaining home for qualifying person with cost-of-household >50% test.
- **Coverage**: ✅
- **Implementation locator**: HOH cost-of-household test per CLAUDE.md; HOH brackets; HOH dependent gating.
- **Gap**: "Considered unmarried" sub-rule not separately gated; user picks HOH manually.
- **Effort**: S

### 1.13 — Filing for Your Child
- **Description**: Minor child files own return; parent/guardian signs; kiddie-tax threshold $2,700 (2025).
- **Coverage**: ⚠️
- **Implementation locator**: Dependent tab supports child capital-gain/loss and Kiddie income; Form 8615 intake-only per outstanding.md; single-return architecture means no child return produced.
- **Gap**: Kiddie tax intake-only; no independent child return.
- **Effort**: L (architecturally out-of-scope)

### 1.14 — Return for Deceased
- **Description**: Final 1040 + Form 1041 estate return; executor signs; Form 1310 for refund.
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No decedent-status intake, no Form 1310, no Form 1041 path.
- **Effort**: L (1310 alone is M; 1041 is XL)

### 1.15 — Return for an Incompetent Person
- **Description**: Guardian or spouse files.
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Administrative workflow, not compute.
- **Effort**: None

### 1.16 — How a Nonresident Alien Is Taxed
- **Description**: Form 1040-NR.
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Taxbeans is 1040-only.
- **Effort**: XL (separate product)

### 1.17 — How a Resident Alien Is Taxed
- **Description**: Worldwide income; FEIE and FTC available.
- **Coverage**: ✅ compute; ⚠️ residency-test wizard
- **Implementation locator**: Form 2555 per CLAUDE.md; Form 1116 per `lines/16.md` + Schedule 3.
- **Gap**: No residency-test capture.
- **Effort**: S (wizard)

### 1.18 — Who Is a Resident Alien?
- **Description**: Green-card or 183-day substantial-presence with several exception paths.
- **Coverage**: ⚠️ (user self-identifies)
- **Implementation locator**: N/A
- **Gap**: No substantial-presence calculator (Forms 8840/8843).
- **Effort**: M

### 1.19 — Certificate of Tax Compliance for Alien Leaving the U.S.
- **Description**: "Sailing permit" Forms 1040-C / 2063.
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Standalone IRS-office workflow.
- **Effort**: None

### 1.20 — Expatriation Tax
- **Description**: Mark-to-market exit tax on Form 8854.
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Rare separate filing.
- **Effort**: None

## Chapter 2 — Dependents

### 2.1 — No Exemption Deductions Are Allowed
- **Description**: Suspended 2018–2025; dependent status still drives CTC/ODC/EIC/HOH/QSS/medical.
- **Coverage**: ✅
- **Implementation locator**: Dependent model per-household; CTC/ODC via Schedule 8812.
- **Gap**: None
- **Effort**: None

### 2.2 — How Many Dependents Do You Have?
- **Description**: QC or QR path + citizen/resident, joint-return, "not-someone-else's-dependent" gates.
- **Coverage**: ✅
- **Implementation locator**: `form-dependents`; QC/QR drives CTC vs. ODC routing.
- **Gap**: Joint-return and "you're a dependent" gates user-asserted, not auto-verified.
- **Effort**: S (input wizard)

### 2.3 — Qualifying Children
- **Description**: Relationship + residence (>½ year) + age (<19 / <24 student / disabled) + non-self-support + joint-return tests + tie-breaker rules.
- **Coverage**: ✅
- **Implementation locator**: QC tests on dependent intake; CTC age-<17 separately gated.
- **Gap**: Tie-breaker rules (parent vs. grandparent, AGI ranking, residence-period) not automated.
- **Effort**: M (defensible to leave user-asserted)

### 2.4 — Qualifying Relatives
- **Description**: Relationship-or-member + gross-income <$5,050 (2024 — inflation-adjusted for 2025) + support >½ + not-a-QC-of-someone-else.
- **Coverage**: ✅
- **Implementation locator**: QR path on dependent intake; ODC $500 (2025) via Schedule 8812 line 19.
- **Gap**: Gross-income threshold user-asserted.
- **Effort**: None for compute

### 2.5 — Meeting the Support Test for a Qualifying Relative
- **Description**: Multi-line comparison against fair rental value, SS spent on support, government benefits, other contributors.
- **Coverage**: ⚠️
- **Implementation locator**: User self-asserts.
- **Gap**: No Pub. 501 Worksheet 1 calculator — meaningful gap.
- **Effort**: M

### 2.6 — Multiple Support Agreements
- **Description**: Form 2120 when no single contributor provides >50% but taxpayer is >10%.
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No Form 2120; no multi-contributor model.
- **Effort**: S

### 2.7 — Special Rule for Divorced or Separated Parents
- **Description**: Form 8332 waiver moves CTC/ACTC/ODC to noncustodial parent but not EIC/dependent-care/HOH.
- **Coverage**: ⚠️
- **Implementation locator**: Custodial-parent flag on dependent intake.
- **Gap**: No Form 8332 PDF generation; no surfacing of the "waiver moves CTC but not EIC/HOH" rule.
- **Effort**: M

### 2.8 — Reporting Social Security Numbers of Dependents
- **Description**: SSN/ITIN/ATIN required; CTC requires SSN by due date.
- **Coverage**: ✅
- **Implementation locator**: Dependent intake requires SSN/ITIN; SSN-by-due-date check in Schedule 8812.
- **Gap**: ATIN/ITIN holders correctly routed to ODC.
- **Effort**: None

## Chapter 3 — Wages, Salary, and Other Compensation

### 3.1 — Salary and Wage Income
- **Description**: W-2 Box 1 plus the long list of carve-outs (bonuses, taxable fringe, non-accountable reimbursements, severance, Box-11 NQDC, etc.).
- **Coverage**: ✅
- **Implementation locator**: `W2Mapper.java`; Box 1 → Line 1a; statutory-employee out of scope; Box 11 → Schedule 1 line 8t; inmate → 8u per CLAUDE.md.
- **Gap**: None for W-2 mapping; Form 2106 narrow path out of scope.
- **Effort**: None

### 3.2 — Constructive Receipt of Year-End Paychecks
- **Coverage**: ➖
- **Implementation locator**: N/A — encoded by W-2.
- **Gap**: Correct behavior — take W-2 as issued.
- **Effort**: None

### 3.3 — Pay Received in Property Is Taxed
- **Description**: FMV at receipt taxable as wages.
- **Coverage**: ⚠️
- **Implementation locator**: W-2 Box 1 captures it when reported; no standalone path.
- **Gap**: No path for non-W-2 reported property comp.
- **Effort**: S (Form 4852 substitute-W-2 path already exists)

### 3.4 — Commissions Taxable When Credited
- **Coverage**: ✅ (via W-2)
- **Implementation locator**: W-2 Box 1.
- **Gap**: None
- **Effort**: None

### 3.5 — Unemployment Benefits
- **Description**: 1099-G → Schedule 1 line 7; company-paid SUB → W-2; repaid SUB → Sched 1 line 24e.
- **Coverage**: ✅
- **Implementation locator**: `OtherIncomesMapper.java`; `Schedule1AdditionalIncome.java`; 1099-G in statement catalog.
- **Gap**: None
- **Effort**: None

### 3.6 — Strike Pay Benefits and Penalties
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: W-2/1099 flow handles taxable cases.
- **Effort**: None

### 3.7 — Nonqualified Deferred Compensation (Section 409A)
- **Description**: Codes Y (deferrals) and Z (currently includible) on W-2 Box 12; failed plans trigger 20% penalty + interest on Schedule 2 line 17 "NQDC".
- **Coverage**: ⚠️
- **Implementation locator**: W-2 Box 11 → Sched 1 line 8t handled; 20% penalty + interest on Schedule 2 line 17 not separately captured.
- **Gap**: Code Z 20% tax + interest not modeled.
- **Effort**: M

### 3.8 — Did You Return Wages Received in a Prior Year? (Section 1341)
- **Description**: Repaid wages > $3,000 → choice of itemized deduction or §1341 credit (Sched 3 line 13d); ≤ $3,000 not deductible 2018–2025.
- **Coverage**: ⚠️
- **Implementation locator**: §1341 referenced in ReferenceData/tests; Schedule 3 line 13d sub-item not surfaced via intake.
- **Gap**: No "I repaid wages" intake; no credit-vs-deduction compare helper.
- **Effort**: M

### 3.9 — Waiver of Executor's and Trustee's Commissions
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Niche.
- **Effort**: None

### 3.10 — Life Insurance Benefits
- **Description**: Employer-paid group-term ≤ $50k tax-free; over-$50k computed per Table 4-2; split-dollar plans; permanent life premiums.
- **Coverage**: ⚠️
- **Implementation locator**: W-2 Box 12 Code C in Box 1 by employer; Taxbeans takes Box 1.
- **Gap**: No independent recompute.
- **Effort**: None (employer-reported)

### 3.11 — Educational Benefits for Employees' Children
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Employer characterizes on W-2.
- **Effort**: None

### 3.12 — Sick Pay Is Taxable
- **Description**: Employer sick pay = wages; third-party sick pay no withholding unless W-4S.
- **Coverage**: ✅
- **Implementation locator**: W-2 Code J in `W2Mapper`; 1099-R Code 3 disability routing.
- **Gap**: None
- **Effort**: None

### 3.13 — Workers' Compensation Is Tax Free
- **Description**: WC for on-the-job injury tax-free; WC offsetting SS benefits indirectly taxed via §86.
- **Coverage**: ⚠️
- **Implementation locator**: No explicit WC field; SSA-1099 lump-sum-election partial coverage.
- **Gap**: No "WC received" field adjusting SSA-1099 line 6a/6b taxability.
- **Effort**: S

### 3.14 — Disability Pay and Pensions
- **Description**: Pre-min-retirement-age → wages (line 1h); post-MRA → pension; VA and combat-related tax-free; SSA disability is normal SS.
- **Coverage**: ✅
- **Implementation locator**: `PfOtherEarnedDisabilityEntry.java`; 1099-R Code 3 routing per CLAUDE.md.
- **Gap**: User asserts MRA.
- **Effort**: None

### 3.15 — Stock Appreciation Rights
- **Description**: Not taxed until exercised; W-2 reports at exercise; §409A safe harbor for FMV exercise price.
- **Coverage**: ⚠️ (via W-2)
- **Implementation locator**: W-2 Box 1 at exercise.
- **Gap**: No standalone SAR intake.
- **Effort**: None

### 3.16 — Stock Options (ISOs, ESPPs, Nonqualified)
- **Description**: ISO bargain element → AMT preference on Form 6251 line 2i; disqualifying disposition → wages; ESPP taxed at disposition; nonqualified at exercise/vesting.
- **Coverage**: ⚠️
- **Implementation locator**: AMTI add-back for ISO bargain element per MEMORY.md; Forms 3921 and 3922 in semantic-PDF assets per CLAUDE.md; no specialized intake form.
- **Gap**: No ISO/ESPP basis tracker; Form 6251 line 2i intake needs user entry.
- **Effort**: L (full tracker) / S (line 2i intake)

### 3.17 — Election to Defer Income on Qualified Equity Grants (§83(i))
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Not a 1040 line.
- **Effort**: None

### 3.18 — Restricted Stock (§83(b))
- **Description**: Election within 30 days taxes receipt-date FMV as wages, converts later appreciation to capital gain.
- **Coverage**: ➖ for election filing; W-2 captures the tax effect
- **Implementation locator**: W-2 Box 1 at vesting (or at receipt if §83(b) elected).
- **Gap**: No §83(b) filing workflow (separate paper-mail to IRS).
- **Effort**: None

## Chapter 4 — Fringe Benefits

### 4.1 — Tax-Free Health and Accident Coverage
- **Coverage**: ✅ (employer correctly excludes from W-2 Box 1)
- **Implementation locator**: W-2 Box 12 Code DD informational; Box 1 already net.
- **Gap**: None
- **Effort**: None

### 4.2 — Health Savings Accounts (HSAs) and Archer MSAs
- **Description**: HSA limits $4,150/$8,300 (2024) + $1,000 catch-up at 55; Form 8889.
- **Coverage**: ✅
- **Implementation locator**: `Form8889AttachmentMapper.java`; Schedule 1 line 13; 1099-SA; W-2 Box 12 Code W.
- **Gap**: Archer MSA (Form 8853) only partial.
- **Effort**: None for HSA; S for full MSA

### 4.3 — Reimbursements From Employer Health Plans
- **Coverage**: ⚠️
- **Implementation locator**: HSA via Form 8889; 1099-LTC + Form 8853 in statement catalog.
- **Gap**: QSEHRA W-2 Code FF impact on PTC (Form 8962) eligibility not modeled; LTC excess-per-diem taxability not computed.
- **Effort**: M

### 4.4 — Group-Term Life Insurance Premiums
- **Coverage**: ✅ (Code C in Box 1 by employer)
- **Implementation locator**: W-2 Box 1 / Box 12 Code C.
- **Gap**: Verify Codes M/N → Sched 2 line 17 "UT" end-to-end.
- **Effort**: S (verification)

### 4.5 — Dependent Care Assistance
- **Description**: $5,000 / $2,500 MFS exclusion; W-2 Box 10; Form 2441 Part III before Part II credit.
- **Coverage**: ✅
- **Implementation locator**: Form 2441 Part III + Part II 2-pass per CLAUDE.md fringe-benefit baseline.
- **Gap**: None
- **Effort**: None

### 4.6 — Adoption Benefits
- **Coverage**: ✅
- **Implementation locator**: `AdoptionExpensesMapper.java`, `PfAdoptionExpenses.java`, `form-adoption-expenses.component.ts`; Form 8839 Part III; refundable credit on line 30.
- **Gap**: 2025 MAGI thresholds need ReferenceData verification.
- **Effort**: None (constants refresh)

### 4.7 — Education Assistance Plans (§127)
- **Coverage**: ⚠️ (W-2 captures it)
- **Implementation locator**: Excludable already excluded from Box 1 by employer; taxable excess added back by employer.
- **Gap**: No standalone validator.
- **Effort**: None

### 4.8 — Company Cars, Parking, and Transit Passes
- **Description**: Personal-use value taxable; commuter highway vehicle + transit passes + parking each tax-free up to $315/month (2024); bicycle reimbursement suspended 2018–2025.
- **Coverage**: ⚠️ (W-2 captures personal-use)
- **Implementation locator**: W-2 Box 14 / Box 1.
- **Gap**: Per CLAUDE.md "NOT IMPLEMENTED: commuter benefits ceiling check".
- **Effort**: S (validation/warning)

### 4.9 — Working Condition Fringe Benefits
- **Coverage**: ➖
- **Implementation locator**: N/A — employer excludes from Box 1.
- **Gap**: None
- **Effort**: None

### 4.10 — De Minimis Fringe Benefits
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: None
- **Effort**: None

### 4.11 — Employer-Provided Retirement Advice
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: None
- **Effort**: None

### 4.12 — Employee Achievement Awards
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Employer reports taxable portion in W-2 Box 1.
- **Effort**: None

### 4.13 — Employer-Furnished Meals or Lodging
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Employer characterizes on W-2.
- **Effort**: None

### 4.14 — Minister's Housing or Housing Allowance
- **Coverage**: ➖
- **Implementation locator**: N/A — Schedule SE out of scope per CLAUDE.md.
- **Gap**: SE-tax intersection unreachable.
- **Effort**: None

### 4.15 — Cafeteria Plans (§125)
- **Coverage**: ✅ (employer reports Box 1 correctly)
- **Implementation locator**: §125 cafeteria/HSA contributions reflected in W-2 Box 12 codes (W for HSA via §125, etc.); Box 1 already net per CLAUDE.md.
- **Gap**: Wellness-program cash rewards / gym fees should be wages — relies on employer reporting.
- **Effort**: None

### 4.16 — Flexible Spending Arrangements (FSAs)
- **Coverage**: ✅
- **Implementation locator**: W-2 Box 12 / Box 10; dependent care FSA flows to Form 2441 Part III; health FSA pre-tax already net in Box 1.
- **Gap**: Multi-year carryover tracking not modeled.
- **Effort**: S (warning) / L (full multi-year tracker)

### 4.17 — Company Services at No Additional Cost
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: None
- **Effort**: None

### 4.18 — Discounts on Company Products/Services
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: None
- **Effort**: None

## Chapters 1-4 Summary

**Total scenarios**: 64. Coverage: ✅ 22, ⚠️ 17, ❌ 4, ➖ 21.

### Notable findings

1. **Filing-status core is strong; nonresident-spouse and community-property paths are the biggest white spaces.** 1.5 (§6013(g)/(h) NRA-spouse election) and 1.6 (Form 8958 community-property split for MFS) are entirely missing.
2. **Decedent handling is a real gap.** 1.10, 1.14, and auto-QSS-determination not modeled.
3. **Worksheet-style support computation (2.5) is missing.** Users self-assert "I provided over half the support" without an interactive Pub. 501 Worksheet 1.
4. **Multiple Support Agreement (2.6 / Form 2120) entirely missing.**
5. **Form 8332 (2.7) waiver capture is partial.** Custodial flag exists but Form 8332 PDF generation absent.
6. **Section 1341 claim-of-right credit (3.8) is partial.** Schedule 3 line 13d referenced but no intake.
7. **§409A 20% penalty on W-2 Box 12 Code Z (3.7) not modeled.**
8. **ISO/ESPP basis tracking (3.16) is the largest Chapter-3 employee-equity gap.**
9. **Workers' compensation interaction with SS taxability (3.13) is missed.**
10. **Commuter benefits ceiling validation (4.8)** documented as not implemented in CLAUDE.md.
11. **Schedule-SE-dependent items (4.14)** unreachable by design.
12. **Most "Implemented" ratings in fringe-benefit topics rest on "employer reports it correctly on W-2."** Taxbeans cannot detect employer mis-reporting.

---

# Chapters 5-8: Dividends/Interest, Property Sales, Tax-Free Exchanges, Retirement

## Chapter 5 — Dividend and Interest Income

### 5.1 — Reporting Dividends and Mutual Fund Distributions
- **Description**: 1099-DIV boxes 1a/1b/2a-d/3/4/5/6/7-8/9-10 — ordinary, qualified, capital-gain dists, ROC, BUW, QBI, foreign tax, liquidating.
- **Coverage**: ✅
- **Implementation locator**: `Form1099DivMapper.java`; `form-1099-div.component.ts`; line 3a/3b in `TaxReturnComputeService.java`; spec `c:/us-tax/lines/3abc.md`.
- **Gap**: Box 6 non-publicly-offered fund expenses (post-TCJA non-deductible) not surfaced.
- **Effort**: S

### 5.2 — Qualified Corporate Dividends Taxed at Favorable Capital Gain Rates
- **Description**: Box 1b qualified dividends at 0/15/20% via QDCG worksheet; 61-day holding-period rule.
- **Coverage**: ⚠️
- **Implementation locator**: Line 3a routing; QDCG in line 16 compute; spec `c:/us-tax/lines/16.md`.
- **Gap**: No in-app 61/91-day holding-period validator; reliance on payer's Box 1b classification.
- **Effort**: M

### 5.3 — Dividends From a Partnership, S Corporation, Estate, or Trust
- **Coverage**: ⚠️
- **Implementation locator**: K-1 statement mappers (1041/1065/1120S).
- **Gap**: 61-day holding propagation through pass-through not validated.
- **Effort**: S

### 5.4 — Real Estate Investment Trust (REIT) Dividends
- **Coverage**: ✅
- **Implementation locator**: `Form1099DivMapper.java`; QBI line 13a Form 8995 §199A REIT; spec `c:/us-tax/lines/13ab.md`.
- **Gap**: 6-month long-term-loss recharacterization on REIT-share sale not enforced.
- **Effort**: S

### 5.5 — Taxable Dividends of Earnings and Profits
- **Coverage**: ⚠️
- **Implementation locator**: 1099-DIV box 3 nondividend captured.
- **Gap**: Close-corp E&P determination is user judgment (acceptable scope decision).
- **Effort**: None

### 5.6 — Stock Dividends on Common Stock
- **Coverage**: ⚠️
- **Implementation locator**: Schedule D / Form 8949 in `TaxReturnComputeService.java`; spec `c:/us-tax/lines/7ab.md`.
- **Gap**: No basis-allocation tooling for stock dividends/splits.
- **Effort**: M

### 5.7 — Dividends Paid in Property
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No intake field for property-in-kind dividends.
- **Effort**: S

### 5.8 — Taxable Stock Dividends
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No taxonomy or input for the five exceptions.
- **Effort**: S

### 5.9 — Who Reports the Dividends
- **Coverage**: ✅
- **Implementation locator**: Nominee dividend in `3ab-dividend-income-taxpayer.yaml`; line 3a/3b.
- **Gap**: None
- **Effort**: None

### 5.10 — Year Dividends Are Reported
- **Coverage**: ✅
- **Implementation locator**: 1099-DIV year trusted as authoritative per `lines/3abc.md`.
- **Gap**: None
- **Effort**: None

### 5.11 — Distribution Not Out of Earnings: Return of Capital
- **Coverage**: ⚠️
- **Implementation locator**: `Form1099DivMapper.java` box 3.
- **Gap**: No automatic basis-tracking ledger.
- **Effort**: L

### 5.12 — Reporting Interest on Your Tax Return
- **Coverage**: ✅
- **Implementation locator**: `2ab-interest-income-taxpayer.yaml`; `Form1099IntMapper.java`; spec `c:/us-tax/lines/2ab.md`.
- **Gap**: None
- **Effort**: None

### 5.13 — Interest on Frozen Accounts Not Taxed
- **Coverage**: ✅
- **Implementation locator**: `frozenDepositInterestAdjustment` in `2ab-interest-income-taxpayer.yaml` line 137.
- **Gap**: None
- **Effort**: None

### 5.14 — Interest Income on Debts Owed to You
- **Coverage**: ✅
- **Implementation locator**: 2ab YAML seller-financed flow; `manualTaxableInterestNotOnStatements`.
- **Gap**: None
- **Effort**: None

### 5.15 — Reporting Interest on Bonds Bought or Sold
- **Coverage**: ✅
- **Implementation locator**: `accruedInterestPaidAdjustment` in `2ab-interest-income-taxpayer.yaml` line 87.
- **Gap**: None
- **Effort**: None

### 5.16 — Forfeiture of Interest on Premature Withdrawals
- **Coverage**: ✅
- **Implementation locator**: `Form1099IntMapper.java` box 2; Schedule 1 line 18 in `lines/10.md`.
- **Gap**: None
- **Effort**: None

### 5.17 — Amortization of Bond Premium
- **Coverage**: ✅
- **Implementation locator**: 3 fields in `2ab-interest-income-taxpayer.yaml` lines 101-121.
- **Gap**: No amortization-schedule generator; user enters amounts.
- **Effort**: M

### 5.18 — Discount on Bonds (umbrella)
- **Coverage**: ✅ (umbrella)
- **Implementation locator**: 1099-OID in `Form1099OidMapper.java`; 2ab YAML.

### 5.19 — Reporting Original Issue Discount on Your Return
- **Coverage**: ✅
- **Implementation locator**: `Form1099OidMapper.java`; `taxExemptStatedInterestFrom1099OidBox2` and `oidAcquisitionPremiumAdjustmentNotInStatements` in 2ab YAML.
- **Gap**: None
- **Effort**: None

### 5.20 — Reporting Income on Market Discount Bonds
- **Coverage**: ✅
- **Implementation locator**: `marketDiscountSection1278bElection` in `2ab-interest-income-taxpayer.yaml` line 143.
- **Gap**: No accrual-schedule computation.
- **Effort**: M

### 5.21 — Discount on Short-Term Obligations
- **Coverage**: ⚠️
- **Implementation locator**: 1099-INT box 3 only.
- **Gap**: No dedicated short-term OID workflow.
- **Effort**: S

### 5.22 — Stripped Coupon Bonds and Stock
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No specific intake for STRIPS.
- **Effort**: S

### 5.23 — Sale or Retirement of Bonds and Notes
- **Coverage**: ⚠️
- **Implementation locator**: 1099-B/8949 path in `TaxReturnComputeService.java`; `lines/7ab.md`.
- **Gap**: Accrued market discount → ordinary at sale not auto-computed.
- **Effort**: S

### 5.24 — State and City Interest Generally Tax Exempt
- **Coverage**: ✅
- **Implementation locator**: Tax-exempt interest aggregation; PAB box 9 → Form 6251 line 2g.
- **Gap**: None
- **Effort**: None

### 5.25 — Taxable State and City Interest
- **Coverage**: ✅
- **Implementation locator**: `manualTaxableInterestNotOnStatements`.
- **Gap**: None
- **Effort**: None

### 5.26 — Tax-Exempt Bonds Bought at a Discount
- **Coverage**: ⚠️
- **Implementation locator**: 2ab YAML help text (line 61).
- **Gap**: De-minimis classification at sale is manual.
- **Effort**: S

### 5.27 — Treasury Bills, Notes, and Bonds
- **Coverage**: ✅
- **Implementation locator**: `Form1099IntMapper.java` box 3.
- **Gap**: None
- **Effort**: None

### 5.28 — Interest on United States Savings Bonds
- **Coverage**: ✅
- **Implementation locator**: `priorYearReportedSavingsBondAdjustment` in 2ab YAML.
- **Gap**: None
- **Effort**: None

### 5.29 — Deferring United States Savings Bond Interest (Form 8815)
- **Coverage**: ✅
- **Implementation locator**: Full Form 8815 (MEMORY 2026-06-02); `Form8815OutputMapper.java`; `c:/us-tax/lines/f8815.md`; 15 intake fields in 2ab YAML lines 175-274.
- **Gap**: None
- **Effort**: None

### 5.30 — Minimum Interest Rules
- **Coverage**: ⚠️
- **Implementation locator**: Seller-financed flag in 2ab YAML.
- **Gap**: No AFR table or imputation engine.
- **Effort**: M

### 5.31 — Interest-Free or Below-Market-Interest Loans
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No §7872 workflow.
- **Effort**: M

### 5.32 — Minimum Interest on Seller-Financed Sales
- **Coverage**: ⚠️
- **Implementation locator**: Seller-financed-mortgage flow; Form 6252 stub.
- **Gap**: §483/§1274 AFR imputation not computed.
- **Effort**: M

## Chapter 6 — Reporting Property Sales

### 6.1 — General Tax Rules for Property Sales
- **Coverage**: ✅
- **Implementation locator**: `TaxReturnComputeService.java` line 7a/7b; `c:/us-tax/lines/7ab.md`.
- **Gap**: None
- **Effort**: None

### 6.2 — How Property Sales Are Classified and Taxed
- **Coverage**: ⚠️
- **Implementation locator**: Capital-asset path; §1231 Form 4797 is stub.
- **Gap**: §1231 netting/Form 4797 compute not implemented.
- **Effort**: L

### 6.3 — Capital Gains Rates and Holding Periods
- **Coverage**: ✅
- **Implementation locator**: QDCG / Schedule D Tax Worksheet in line 16; `c:/us-tax/lines/16.md`; thresholds in `ReferenceData.java`.
- **Gap**: 25% §1250 / 28% collectibles via Schedule D worksheet.
- **Effort**: None

### 6.4 — Capital Losses and Carryovers
- **Coverage**: ⚠️
- **Implementation locator**: $3k/$1.5k cap in line 7a/7b compute.
- **Gap**: Multi-year carryover ledger not auto-tracked.
- **Effort**: M

### 6.5 — Capital Losses of Married Couples
- **Coverage**: ✅
- **Implementation locator**: MFS half-cap in line 7a (MFS-cascade pattern per MEMORY).
- **Gap**: None
- **Effort**: None

### 6.6 — Losses May Be Disallowed on Sales to Related Persons
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: §267 related-party flag absent.
- **Effort**: S

### 6.7 — Special Treatment of Gain on Sale of Small Business Stock or QOZ
- **Coverage**: ⚠️
- **Implementation locator**: `hasCollectiblesOrSection1202Gain` in `CapitalGainLossMapper.java` line 75.
- **Gap**: §1202 exclusion %, §1244 ordinary loss, QOZ codes Z/Y not modeled.
- **Effort**: L

### 6.8 — Reporting Capital Asset Sales on Form 8949 and on Schedule D
- **Coverage**: ✅
- **Implementation locator**: `Form1099BMapper.java`; `Form1099DaMapper.java`; `lines/7ab.md`; 8949 build.
- **Gap**: None
- **Effort**: None

### 6.9 — Counting the Months in Your Holding Period
- **Coverage**: ✅
- **Implementation locator**: 8949 short/long from 1099-B box 2.
- **Gap**: None
- **Effort**: None

### 6.10 — Holding Period for Securities
- **Coverage**: ⚠️
- **Implementation locator**: Inherited from 1099-B.
- **Gap**: Wash-sale and short-sale special rules limited.
- **Effort**: M

### 6.11 — Holding Period for Real Estate
- **Coverage**: ⚠️
- **Implementation locator**: 1099-S/8949 path.
- **Gap**: No contract-date-vs-closing-date helper.
- **Effort**: S

### 6.12 — Holding Period: Gifts, Inheritances, and Other Property
- **Coverage**: ⚠️
- **Implementation locator**: Manual category routing.
- **Gap**: No auto-long-term flag for inherited property.
- **Effort**: S

### 6.13 — Calculating Gain or Loss
- **Coverage**: ✅
- **Implementation locator**: 8949 in `TaxReturnComputeService.java`.
- **Gap**: None
- **Effort**: None

### 6.14 — Amount Realized Is the Total Selling Price
- **Coverage**: ⚠️
- **Implementation locator**: 1099-B proceeds box 1d.
- **Gap**: Debt-relief inclusion not auto-computed.
- **Effort**: S

### 6.15 — Finding Your Cost
- **Coverage**: ⚠️
- **Implementation locator**: 1099-B box 1e.
- **Gap**: No independent FIFO/avg-cost calculator.
- **Effort**: L

### 6.16 — Unadjusted Basis of Your Property
- **Coverage**: ✅
- **Implementation locator**: Cost basis from 1099-B / hand-entered.
- **Gap**: None
- **Effort**: None

### 6.17 — Basis of Property You Inherited or Received as a Gift
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No inherited/gift basis assistant.
- **Effort**: M

### 6.18 — Joint Tenancy Basis Rules for Surviving Tenants
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No joint-tenancy basis worksheet.
- **Effort**: M

### 6.19 — Allocating Cost Among Several Assets
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: None for typical individual.
- **Effort**: M

### 6.20 — How To Find Adjusted Basis
- **Coverage**: ⚠️
- **Implementation locator**: User-entered on 8949.
- **Gap**: No basis-tracking ledger.
- **Effort**: L

### 6.21 — Tax Advantage of Installment Sales
- **Coverage**: ⚠️
- **Implementation locator**: `Form6252Mapper.java`, `Form6252CapitalAttachmentMapper.java` — passthrough only.
- **Gap**: Gross-profit-ratio compute not implemented.
- **Effort**: L

### 6.22 — Figuring the Taxable Part of Installment Payments
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: User computes externally.
- **Effort**: L

### 6.23 — Electing Not To Report on the Installment Method
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No election flag.
- **Effort**: S

### 6.24 — Restriction on Installment Sales to Relatives
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No related-party installment checks.
- **Effort**: M

### 6.25 — Contingent Payment Sales
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Niche.
- **Effort**: L

### 6.26 — Using Escrow and Other Security Arrangements
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Effort**: None

### 6.27 — Minimum Interest on Deferred Payment Sales
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No AFR imputation.
- **Effort**: M

### 6.28 — Dispositions of Installment Notes
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No tracking.
- **Effort**: M

### 6.29 — Repossession of Personal Property Sold on Installment
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Niche.
- **Effort**: M

### 6.30 — Boot in Like-Kind Exchange Payable in Installments
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Out of scope per CLAUDE.md.
- **Effort**: L

### 6.31 — "Interest" Taxed if Sales Price Exceeds $150,000 With Over $5M Debt
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: §453A interest charge not computed.
- **Effort**: L

### 6.32 — Worthless Securities
- **Coverage**: ⚠️
- **Implementation locator**: Enter on 8949 with proceeds=0.
- **Gap**: No §165(g)/§1244 identification.
- **Effort**: S

### 6.33 — Tax Consequences of Bad Debts
- **Coverage**: ⚠️
- **Implementation locator**: Enter on 8949 as short-term capital loss.
- **Gap**: No bad-debt intake or 8949 code "L" prefilling.
- **Effort**: S

### 6.34 — Four Rules To Prove a Bad Debt Deduction
- **Coverage**: ➖
- **Effort**: None

### 6.35 — Family Bad Debts
- **Coverage**: ➖
- **Effort**: None

## Chapter 7 — Tax-Free Exchanges of Property

### 7.1 — Like-Kind Exchanges of Real Property Used for Investment or Business
- **Coverage**: ⚠️
- **Implementation locator**: `Form8824Mapper.java`, `Form8824CapitalAttachmentMapper.java` — passthrough.
- **Gap**: Out of scope per CLAUDE.md — no §1031 compute.
- **Effort**: L

### 7.2 — Receipt of Cash and Other Property—"Boot"
- **Coverage**: ➖
- **Effort**: None

### 7.3 — Time Limits and Security Arrangements for Deferred Exchanges
- **Coverage**: ➖
- **Effort**: None

### 7.4 — Qualified Exchange Accommodation Arrangements (QEAAs)
- **Coverage**: ➖
- **Effort**: None

### 7.5 — Exchanges Between Related Parties
- **Coverage**: ➖
- **Effort**: None

### 7.6 — Property Transfers Between Spouses and Ex-Spouses
- **Coverage**: ➖
- **Effort**: None

### 7.7 — Tax-Free Exchanges of Stock in Same Corporation
- **Coverage**: ➖
- **Effort**: None

### 7.8 — Joint Ownership Interests
- **Coverage**: ➖
- **Effort**: None

### 7.9 — Setting up Closely Held Corporations (§351)
- **Coverage**: ➖
- **Effort**: None

### 7.10 — Tax-Free Exchanges of Insurance Policies (§1035)
- **Coverage**: ⚠️
- **Implementation locator**: 1099-R code 6 in `Form1099RMapper.java` triggers Box 2a=0.
- **Gap**: No §1035 basis carryover.
- **Effort**: S

## Chapter 8 — Retirement and Annuity Income

### 8.1 — Retirement Distributions on Form 1099-R
- **Coverage**: ✅
- **Implementation locator**: `Form1099RMapper.java`; line 5a/5b; `c:/us-tax/lines/5abc.md`.
- **Gap**: None
- **Effort**: None

### 8.2 — Lump-Sum Distributions
- **Coverage**: ✅
- **Implementation locator**: `4972-lump-sum-distribution-taxpayer.yaml`; `Form4972TaxpayerOutputMapper.java`; `Form4972TaxTable.java`.
- **Gap**: None
- **Effort**: None

### 8.3 — Lump-Sum Options If You Were Born Before January 2, 1936
- **Coverage**: ✅
- **Implementation locator**: Form 4972 Parts I-IV; `lines/4972.md`.
- **Gap**: MEMORY-tracked open bug — Form 4972 Part II cap-gain portion NOT removed from line 5b (double-tax).
- **Effort**: S

### 8.4 — Lump-Sum Payments Received by Beneficiary
- **Coverage**: ✅
- **Implementation locator**: 4972 personal form supports beneficiary election.
- **Gap**: None
- **Effort**: None

### 8.5 — Tax-Free Rollovers From Qualified Plans
- **Coverage**: ✅
- **Implementation locator**: `totalPensionRolloverAmount` in 5abc YAML line 110.
- **Gap**: No 60-day-window or once-per-12-month validation.
- **Effort**: M

### 8.6 — Direct Rollover or Personal Rollover
- **Coverage**: ✅
- **Implementation locator**: Code G detection in `Form1099RMapper.java`.
- **Gap**: None
- **Effort**: None

### 8.7 — Rollover of Proceeds From Sale of Property
- **Coverage**: ❌
- **Gap**: Edge case.
- **Effort**: S

### 8.8 — Distribution of Employer Stock or Other Securities (NUA)
- **Coverage**: ⚠️
- **Implementation locator**: 1099-R box 6 NUA captured.
- **Gap**: NUA basis-vs-appreciation split not auto-computed.
- **Effort**: M

### 8.9 — Survivor Annuity for Spouse
- **Coverage**: ⚠️
- **Implementation locator**: `jointAnnuitantAgeAtStartingDate` in 5abc Simplified Method.
- **Gap**: No QPSA modeling.
- **Effort**: S

### 8.10 — Court Distributions to Former Spouse Under a QDRO
- **Coverage**: ❌
- **Gap**: QDRO 10%-penalty exception not auto-applied.
- **Effort**: S

### 8.11 — When You Must Begin Receiving Required Minimum Distributions (RMDs)
- **Coverage**: ⚠️
- **Implementation locator**: Form 5329 Part IX in `Form5329OutputMapper.java`.
- **Gap**: No RMD life-expectancy calculator.
- **Effort**: L

### 8.12 — Payouts to Beneficiaries
- **Coverage**: ❌
- **Gap**: No beneficiary-payout modeling.
- **Effort**: L

### 8.13 — Penalty for Distributions Before Age 59½
- **Coverage**: ✅
- **Implementation locator**: Form 5329 Part I; intake fields in `5abc-pension-annuity-income-taxpayer.yaml` lines 277-294.
- **Gap**: Exception-code captured as free text; no §72(t)(2) sub-list validation.
- **Effort**: S

### 8.14 — Restrictions on Loans From Company Plans
- **Coverage**: ❌
- **Gap**: Code L default-loan not specially flagged.
- **Effort**: S

### 8.15 — Tax Benefits of 401(k) Plans
- **Coverage**: ✅
- **Implementation locator**: W-2 box 12 code D reduces Box 1.
- **Gap**: None
- **Effort**: None

### 8.16 — Limit on Salary-Reduction Deferrals
- **Coverage**: ⚠️
- **Implementation locator**: W-2 box 12.
- **Gap**: Excess-deferral detection not auto-computed.
- **Effort**: S

### 8.17 — Withdrawals From 401(k) Plans Restricted
- **Coverage**: ➖
- **Effort**: None

### 8.18 — Designated Roth Account Within 401(k), 403(b), or Governmental 457
- **Coverage**: ⚠️
- **Implementation locator**: 1099-R box 11; codes B/H in `Form1099RMapper.java`.
- **Gap**: 5-year-rule tracking not computed.
- **Effort**: M

### 8.19 — 403(b) Plans (Tax-Sheltered Annuity Plans)
- **Coverage**: ⚠️
- **Implementation locator**: W-2 box 12 code E.
- **Gap**: 15-year catch-up not modeled.
- **Effort**: S

### 8.20 — Government and Exempt Organization Deferred Pay Plans
- **Coverage**: ⚠️
- **Implementation locator**: W-2 box 12 code G.
- **Gap**: Pre-retirement 3-year catch-up not modeled.
- **Effort**: S

### 8.21 — Figuring the Taxable Part of Commercial Annuities (General Rule)
- **Coverage**: ✅
- **Implementation locator**: `taxableComputationInputsGeneralRule` in 5abc YAML lines 237-265; `computePensionTaxableViaGeneralRule` in `TaxReturnComputeService.java` line 10198.
- **Gap**: None
- **Effort**: None

### 8.22 — Life Expectancy Tables for Figuring Expected Return
- **Coverage**: ⚠️
- **Implementation locator**: User enters `expectedReturnGeneralRule`.
- **Gap**: No Pub 939 table lookup.
- **Effort**: M

### 8.23 — When You Convert Your Endowment Policy
- **Coverage**: ⚠️
- **Implementation locator**: 1099-R code 6.
- **Gap**: Endowment-conversion-specific gain not modeled.
- **Effort**: S

### 8.24 — Reporting Employee Annuities
- **Coverage**: ✅
- **Implementation locator**: Line 5a/5b/5c in `TaxReturnComputeService.java`.
- **Gap**: None
- **Effort**: None

### 8.25 — Simplified Method for Calculating Taxable Employee Annuity
- **Coverage**: ✅
- **Implementation locator**: `taxableComputationInputsSimplifiedMethod` in 5abc YAML lines 199-235; Simplified Method compute.
- **Gap**: None
- **Effort**: None

### 8.26 — Withdrawals From Employer's Qualified Retirement Plan Before Annuity Starting Date
- **Coverage**: ⚠️
- **Implementation locator**: Box 5 employee contribution captured; box 2a used directly.
- **Gap**: Pro-rata basis-vs-earnings split not separately computed.
- **Effort**: S

## Chapters 5-8 Summary

**Total scenarios**: 103. Coverage: ✅ 32, ⚠️ 40, ❌ 21, ➖ 10.

### Notable findings

1. **Chapter 5 (Interest/Dividends) is strongest** — Form 8815 fully implemented; bond premium / market discount / OID adjustments surfaced. Gaps cluster around basis-tracking automation.
2. **Chapter 6 (Property Sales) is mixed** — capital-asset basics fully implemented; gaps in §1031/§453/§1244/§1202 specialty compute, basis-determination assistants, related-party loss disallowance.
3. **Chapter 7 (Tax-Free Exchanges) intentionally out of scope** — only §1035 (1099-R code 6) and Form 8824 attachment present.
4. **Chapter 8 (Retirement) solid for routine cases** — Form 4972, Simplified Method, General Rule, PSO, rollovers, §72(t) all implemented. **Open bug**: Form 4972 Part II cap-gain not removed from line 5b (double-tax).
5. **Biggest single gap — RMD calculator (§8.11)**: Form 5329 Part IX captured but no life-expectancy calculator.
6. **Qualified dividend holding period (§5.2)** delegated to 1099-DIV payer.
7. **NUA modeling (§8.8)** — Box 6 captured but basis/appreciation split not auto-computed.
8. **Installment-sale compute (§6.21-6.31)** — Form 6252 intake-only; gross-profit-ratio not computed.
9. **Designated Roth 5-year rule (§8.18)** — no clock tracking.
10. **§1202 QSBS exclusion (§6.7)** — only 28%-rate flag; exclusion percentages not modeled.

---

# Chapters 9-12: IRAs, Rentals/Royalties, Loss Restrictions, Other Income

## Chapter 9 — IRAs

### 9.1 — Starting a Traditional IRA
- **Description**: Who can open a traditional IRA and basic eligibility (earned income, no age cap post-SECURE).
- **Coverage**: ➖
- **Implementation locator**: N/A (informational; not a 1040 line)
- **Gap**: No "open new IRA" workflow. Taxbeans intake assumes IRA already exists and surfaces only distributions (line 4a/4b) via 1099-R and contribution deductions via Schedule 1 line 20.
- **Effort**: None

### 9.2 — Contribution Limit for Traditional IRAs
- **Description**: 2025 limit $7,000 ($8,000 age 50+), reduced by Roth contributions; must have earned income.
- **Coverage**: ⚠️
- **Implementation locator**: `c:/us-tax/yamls/10-income-adjustments-taxpayer.yaml` (Schedule 1 line 20 IRA deduction); `TaxReturnComputeService.java`
- **Gap**: Contribution limit not enforced against earned income or combined Roth+traditional cap; no catch-up split helper.
- **Effort**: S

### 9.3 — Contributions to a Traditional IRA If You Are Married
- **Description**: Spousal IRA — non-working spouse may contribute up to $7,000/$8,000 using working spouse's earnings.
- **Coverage**: ⚠️
- **Implementation locator**: `c:/us-tax/yamls/10-income-adjustments-spouse.yaml`
- **Gap**: Per-person deduction collected but no spousal-earnings validation and no MFJ aggregate-cap warning.
- **Effort**: S

### 9.4 — Restrictions on Traditional IRA Deduction for Active Participants in Employer Plans
- **Description**: 2025 MAGI phaseouts when taxpayer (or spouse) is covered by an employer retirement plan.
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No active-participant phaseout worksheet. Taxbeans takes the user-entered IRA deduction at face value rather than computing the allowable amount from W-2 box 13 + MAGI.
- **Effort**: M

### 9.5 — Active Participation in an Employer Plan
- **Description**: Defines "active participant" (W-2 box 13 retirement-plan check).
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: W-2 box 13 retirement flag captured by W-2 mapper but never consumed in IRA-deduction phaseout logic.
- **Effort**: S (once 9.4 worksheet exists)

### 9.6 — Nondeductible Contributions to Traditional IRAs
- **Description**: Form 8606 Part I tracks basis when contribution is partly/fully nondeductible.
- **Coverage**: ✅
- **Implementation locator**: `c:/us-tax/us-tax-be/src/main/java/com/ustax/model/output/Form8606.java`; `Form8606TaxpayerOutputMapper.java`; intake `c:/us-tax/yamls/4abc-ira-income-taxpayer.yaml` section `form8606PartIandPartIIInputs`.
- **Gap**: None
- **Effort**: None

### 9.7 — Penalty for Excess Contributions to Traditional IRAs
- **Description**: 6% excess-contribution excise tax on Form 5329 Part III.
- **Coverage**: ❌
- **Implementation locator**: `Form5329.java` exists but Parts III/IV/V not wired
- **Gap**: Form 5329 only handles §72(t) early-distribution penalty (Part I); excess-contribution and excess-accumulation parts not implemented.
- **Effort**: M

### 9.8 — Distributions From Traditional IRAs
- **Description**: 1099-R box 1 → line 4a, box 2a → line 4b; pro-rata rule.
- **Coverage**: ✅
- **Implementation locator**: `TaxReturnComputeService.java` (line 4a/4b); `c:/us-tax/yamls/4abc-ira-income-taxpayer.yaml`; `c:/us-tax/lines/4abc.md`
- **Gap**: None
- **Effort**: None

### 9.9 — Partially Tax-Free Traditional IRA Distributions Allocable to Nondeductible Contributions
- **Description**: Form 8606 Part I pro-rata calculation (lines 6-15) when basis exists.
- **Coverage**: ✅
- **Implementation locator**: `Form8606TaxpayerOutputMapper.java`; fields `valueAllTraditionalSepSimpleIrasAtYearEnd`, `nondeductibleContributionsMadeAfterYearEndForTaxYear`
- **Gap**: None
- **Effort**: None

### 9.10 — Tax-Free Direct Transfer or Rollover From One Traditional IRA to Another
- **Description**: 60-day rollover, one-per-12-months rule, trustee-to-trustee.
- **Coverage**: ✅
- **Implementation locator**: `4abc-ira-income-taxpayer.yaml` (`hadIraRollover`, `totalIraRolloverAmount`, line 4c box 1 rollover)
- **Gap**: One-per-12-month limit not validated; rollover-into-qualified-plan-following-year flag does not generate statement attachment.
- **Effort**: S

### 9.11 — Transfer of Traditional IRA to Spouse at Divorce
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: No specific intake; handled indirectly via 1099-R code G/H.
- **Effort**: None

### 9.12 — Penalty for Traditional IRA Withdrawals Before Age 59½
- **Description**: 10% additional tax on early distributions; Form 5329 Part I exceptions.
- **Coverage**: ✅
- **Implementation locator**: `Form5329OutputMapper.java`
- **Gap**: Exception-code coverage limited to common cases; SECURE 2.0 expanded exceptions (emergency expense, domestic abuse, terminal illness, federally declared disaster) not separately enumerated.
- **Effort**: S

### 9.13 — Required Minimum Distributions (RMDs) From a Traditional IRA
- **Description**: RMD age 73; Uniform Lifetime Table; 25% failure excise (10% if corrected).
- **Coverage**: ⚠️
- **Implementation locator**: Form 5498 intake captured per CLAUDE.md; Form 5329 Part IX shortfall not implemented.
- **Gap**: RMD shortfall excise (Form 5329 Part IX) absent; no RMD calculator from prior-year 12/31 balance × life-expectancy factor; no age-73 trigger.
- **Effort**: M

### 9.14 — Beneficiaries of Traditional IRA Owners Who Died Before 2020
- **Coverage**: ➖
- **Implementation locator**: `inheritedTraditionalIraDistributionAmount` field in `4abc-ira-income-taxpayer.yaml` (excludes from 8606 basis pro-rata)
- **Gap**: Stretch-IRA RMD computation not implemented; relies on user-entered amount.
- **Effort**: M (deferred)

### 9.15 — Beneficiaries of Traditional IRA Owners Who Die After 2019
- **Coverage**: ➖
- **Implementation locator**: Same as 9.14
- **Gap**: 10-year countdown / EDB classification not modeled.
- **Effort**: M (deferred)

### 9.16 — SEP Basics
- **Coverage**: ⚠️
- **Implementation locator**: 1099-R IRA/SEP/SIMPLE filter covers SEP distributions
- **Gap**: SEP contribution deduction is part of self-employment retirement plans (Schedule 1 line 16) and explicitly out of scope per CLAUDE.md.
- **Effort**: None (declared OOS)

### 9.17 — Salary-Reduction SEP Set Up Before 1997
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Legacy plan type; not in scope.
- **Effort**: None

### 9.18 — Who Is Eligible for a SIMPLE IRA?
- **Coverage**: ➖
- **Implementation locator**: SIMPLE distributions handled via 1099-R iraSepSimple
- **Gap**: Employer-side SIMPLE setup outside scope.
- **Effort**: None

### 9.19 — SIMPLE IRA Contributions and Distributions
- **Description**: 2025 SIMPLE limit $16,500; catch-up $3,500; 25% penalty if distributed within 2 years.
- **Coverage**: ⚠️
- **Implementation locator**: Form 5329 Part I supports 25% rate via 1099-R code S
- **Gap**: Two-year participation date not tracked; 25%/10% rate driven only by 1099-R code S.
- **Effort**: S

### 9.20 — Roth IRA Advantages
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Informational only.
- **Effort**: None

### 9.21 — Annual Contributions to a Roth IRA
- **Description**: 2025 MAGI phaseout for Roth contribution (single ~$150k-$165k / MFJ ~$236k-$246k).
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No Roth contribution-eligibility calculator; Roth excess-contribution detection (Form 5329 Part IV) missing.
- **Effort**: M

### 9.22 — Recharacterizing a Traditional IRA Contribution to a Roth and Vice Versa
- **Coverage**: ⚠️
- **Implementation locator**: `4abc-ira-income-taxpayer.yaml` `hadReturnOfContributionOrRecharacterization`, `returnOfContributionAmount`
- **Gap**: Captured as single boolean+amount; no two-leg accounting between traditional and Roth contribution totals.
- **Effort**: S

### 9.23 — Converting a Traditional IRA to a Roth IRA
- **Description**: Conversion is taxable; Form 8606 Part II.
- **Coverage**: ✅
- **Implementation locator**: `Form8606TaxpayerOutputMapper.java` Part II; intake `totalTraditionalIraConvertedToRothFor8606Line8`
- **Gap**: None
- **Effort**: None

### 9.24 — Conversions Made After 2017 to a Roth IRA Cannot Be Recharacterized
- **Coverage**: ➖
- **Implementation locator**: Implicit in 8606 mapper
- **Gap**: No explicit UI warning on attempted conversion recharacterization.
- **Effort**: None

### 9.25 — Distributions From a Roth IRA
- **Description**: Ordering rules (contributions → conversions → earnings); 5-year clock; Form 8606 Part III.
- **Coverage**: ✅
- **Implementation locator**: `Form8606TaxpayerOutputMapper.java` Part III; `form8606PartIIIInputs` section
- **Gap**: 5-year clock per-conversion tracking not modeled.
- **Effort**: S

### 9.26 — Distributions to Roth IRA Beneficiaries
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: No separate inherited-Roth flow.
- **Effort**: M (deferred)

## Chapter 10 — Income From Real Estate Rentals and Royalties

### 10.1 — Reporting Rental Real Estate Income and Expenses
- **Coverage**: ❌
- **Implementation locator**: `ScheduleEAttachmentMapper.java` (PDF preview only)
- **Gap**: Per CLAUDE.md, Schedule E is OUT OF SCOPE — only embedded PDF preview.
- **Effort**: XL

### 10.2 — Checklist of Rental Deductions
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No rental-expense intake/aggregator; depreciation engine absent.
- **Effort**: XL

### 10.3 — Distinguishing Between a Repair and an Improvement
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No capitalization engine; no Form 4562; no safe-harbor elections.
- **Effort**: XL

### 10.4 — Reporting Rents From a Multi-Unit Residence
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No allocation worksheet.
- **Effort**: L

### 10.5 — Depreciation on Converting a Home to Rental Property
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No conversion-date basis logic or MACRS schedule.
- **Effort**: XL

### 10.6 — Renting a Residence to a Relative
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No FMR comparison; no §280A logic.
- **Effort**: L

### 10.7 — Personal Use and Rental of a Residence During the Year
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: §280A explicitly OOS per CLAUDE.md.
- **Effort**: XL

### 10.8 — Counting Personal-Use Days and Rental Days for Section 280A
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Same — §280A not implemented.
- **Effort**: L

### 10.9 — Allocating Expenses of a Residence to Rental Days
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Same.
- **Effort**: L

### 10.10 — IRS May Challenge Loss Claimed on Temporary Rental of Residence
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Same.
- **Effort**: None (judgmental)

### 10.11 — Reporting Royalty Income
- **Coverage**: ⚠️
- **Implementation locator**: `c:/us-tax/yamls/8-other-incomes-taxpayer.yaml` field `rentalRealEstateRoyaltiesLine5`
- **Gap**: Aggregate Schedule 1 line 5 amount entered as opaque pass-through; no Schedule E royalty detail.
- **Effort**: L

### 10.12 — Production Costs of Books and Creative Properties
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Schedule C territory; OOS.
- **Effort**: None

### 10.13 — Deducting the Cost of Patents or Copyrights
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Schedule C; OOS.
- **Effort**: None

### 10.14 — Intangible Drilling Costs
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Oil & gas working interest not implemented.
- **Effort**: L (rare)

### 10.15 — Depletion Deduction
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No depletion engine.
- **Effort**: L

### 10.16 — Oil and Gas Percentage Depletion
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Same.
- **Effort**: L

### 10.17 — Qualified Business Income Deduction for Real Estate Activities
- **Coverage**: ⚠️
- **Implementation locator**: `13a-qualified-business-income-taxpayer.yaml`; Form 8995/8995-A in `model/output/`
- **Gap**: QBI engine accepts user-supplied rental QBI but does not apply Rev. Proc. 2019-38 safe-harbor screening; no 250-hour log; no aggregation election.
- **Effort**: M

## Chapter 11 — Loss Restrictions: Passive Activities and At-Risk Limits

### 11.1 — Rental Activities Generally Treated as Passive
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: §469 passive loss limits OUT OF SCOPE per CLAUDE.md; no Form 8582.
- **Effort**: XL

### 11.2 — Rental Real Estate Loss Allowance of up to $25,000
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: $25k special allowance not implemented.
- **Effort**: L

### 11.3 — Real Estate Professionals
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No real-estate-professional election; no hours log.
- **Effort**: L

### 11.4 — Business Participation May Avoid Passive Loss Restrictions
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Trade/business → Schedule C/SE OOS.
- **Effort**: None

### 11.5 — Classifying Business Activities as One or Several
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No aggregation framework.
- **Effort**: L

### 11.6 — Material Participation in a Business
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No tests; no hours log.
- **Effort**: L

### 11.7 — Tax Credits of Passive Activities Limited
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Not implemented.
- **Effort**: L

### 11.8 — Determining Passive or Nonpassive Income and Loss
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No classifier.
- **Effort**: L

### 11.9 — Passive Income Recharacterized as Nonpassive Income
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Not implemented.
- **Effort**: L

### 11.10 — Working Interests in Oil and Gas Wells
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Not implemented.
- **Effort**: M

### 11.11 — Partners and Members of LLCs and LLPs
- **Coverage**: ⚠️
- **Implementation locator**: `SeScheduleK11065.java`
- **Gap**: K-1 statement captured but no passive/material-participation classification or §469 limitation on K-1 box 1/2/3 losses.
- **Effort**: L

### 11.12 — Form 8582 and Other Tax Forms
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Form 8582 not implemented per CLAUDE.md.
- **Effort**: XL

### 11.13 — Suspended Losses Allowed on Disposition of Your Interest
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No suspended-loss tracking.
- **Effort**: L

### 11.14 — Suspended Tax Credits
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Not tracked.
- **Effort**: L

### 11.15 — Personal Service and Closely Held Corporations
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Corporate returns OOS.
- **Effort**: None

### 11.16 — Sales of Property and Passive Activity Interests
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No passive-disposition handling.
- **Effort**: L

### 11.17 — At-Risk Limits
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Form 6198 not implemented per CLAUDE.md.
- **Effort**: XL

### 11.18 — What Is At Risk?
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No at-risk basis tracking.
- **Effort**: L

### 11.19 — Amounts Not At Risk
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Same.
- **Effort**: L

### 11.20 — At-Risk Investment in Several Activities
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Same.
- **Effort**: L

### 11.21 — Carryover of Disallowed Losses
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No carryover tracking.
- **Effort**: L

### 11.22 — Recapture of Losses Where At Risk Is Less Than Zero
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Not implemented.
- **Effort**: L

## Chapter 12 — Other Income

### 12.1 — Prizes and Awards
- **Coverage**: ✅
- **Implementation locator**: `8-other-incomes-taxpayer.yaml` field `otherIncomePrizesAwards8i`
- **Gap**: No automatic carve-out for qualifying assignment prizes or $1,600 employee-achievement-award screening; user enters net taxable amount.
- **Effort**: S

### 12.2 — Lottery and Sweepstake Winnings
- **Coverage**: ✅
- **Implementation locator**: `otherIncomeGambling8b`; W-2G mapper
- **Gap**: Installment annuity election (60-day window) not modeled.
- **Effort**: S

### 12.3 — Gambling Winnings and Losses
- **Coverage**: ✅
- **Implementation locator**: `otherIncomeGambling8b`; Schedule A intake; W-2G mapper
- **Gap**: Session-based netting (slot machines) not modeled.
- **Effort**: S

### 12.4 — Gifts and Inheritances
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Informational exclusion.
- **Effort**: None

### 12.5 — Refunds of State and Local Tax Deductions
- **Coverage**: ⚠️
- **Implementation locator**: `8-other-incomes-taxpayer.yaml` Schedule 1 line 1; 1099-G mapper
- **Gap**: Tax-benefit-rule worksheet (prior-year std vs itemized + SALT cap) not implemented.
- **Effort**: M

### 12.6 — Other Recovered Deductions
- **Coverage**: ✅
- **Implementation locator**: `8-other-incomes-taxpayer.yaml` line 8x
- **Gap**: Tax-benefit limitation not auto-enforced; user supplies net taxable.
- **Effort**: S

### 12.7 — How Legal Damages Are Taxed
- **Coverage**: ⚠️
- **Implementation locator**: `8-other-incomes-taxpayer.yaml` line 8z catch-all
- **Gap**: No structured intake for damage allocation between excludable and taxable components.
- **Effort**: M

### 12.8 — Cancellation of Debts You Owe
- **Coverage**: ✅
- **Implementation locator**: `8-other-incomes-taxpayer.yaml` line 8c; 1099-C mapper; `imported1099CLine8cCancellationOfDebt`
- **Gap**: Form 982 §108 exclusion (insolvency worksheet, QPRI) not implemented; user enters net taxable.
- **Effort**: M

### 12.9 — Schedule K-1
- **Coverage**: ⚠️
- **Implementation locator**: `SeScheduleK11041.java`, `SeScheduleK11065.java`, `SeScheduleK11120s.java`; K-1 mappers
- **Gap**: Per CLAUDE.md, only K-1 line items pass through; no entity-level activity computation, no passive/at-risk gating, no §469/§465 limitation.
- **Effort**: L (XL with §469/§465)

### 12.10 — How Partners Report Partnership Profit and Loss
- **Coverage**: ⚠️
- **Implementation locator**: K-1 1065 intake (see 12.9)
- **Gap**: No outside-basis tracking.
- **Effort**: L

### 12.11 — When a Partner Reports Income or Loss
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Year alignment handled by K-1 issuer.
- **Effort**: None

### 12.12 — Partnership Loss Limitations
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: None of the three limitations implemented (basis, Form 6198, Form 8582).
- **Effort**: XL

### 12.13 — Tax Audits of Partnerships
- **Coverage**: ✅
- **Implementation locator**: `c:/us-tax/lines/8978.md`; positive line 14 → line 16 box 3, negative → Schedule 3 line 6l
- **Gap**: None
- **Effort**: None

### 12.14 — Stockholder Reporting of S Corporation Income or Loss
- **Coverage**: ⚠️
- **Implementation locator**: `SeScheduleK11120s.java`, `ScheduleK1Form1120sMapper.java`
- **Gap**: K-1 line items pass through but stock/debt basis limit not enforced; no Form 7203 intake.
- **Effort**: L

### 12.15 — How Beneficiaries Report Estate or Trust Income
- **Coverage**: ⚠️
- **Implementation locator**: `SeScheduleK11041.java`, `ScheduleK1Form1041Mapper.java`
- **Gap**: Excess deductions on termination (line 11) not routed to Schedule A.
- **Effort**: M

### 12.16 — Reporting Income in Respect of a Decedent (IRD)
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: No special IRD intake.
- **Effort**: M

### 12.17 — Deduction for Estate Tax Attributable to IRD
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: §691(c) deduction not implemented on Schedule A.
- **Effort**: M

### 12.18 — How Life Insurance Proceeds Are Taxed to a Beneficiary
- **Coverage**: ➖
- **Implementation locator**: 1099-R / 1099-INT capture interest portion if reported
- **Gap**: No structured exclusion calc; relies on payer reporting.
- **Effort**: S

### 12.19 — A Policy with a Family Income Rider
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Relies on payer reporting.
- **Effort**: None

### 12.20 — Selling or Surrendering Life Insurance Policy
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No life-insurance surrender intake; 1099-R code 7 surrender reported as ordinary but basis recovery not surfaced.
- **Effort**: M

### 12.21 — Jury Duty Fees
- **Coverage**: ✅
- **Implementation locator**: `8-other-incomes-taxpayer.yaml` `otherIncomeJuryDutyPay8h`; `10-income-adjustments-taxpayer.yaml` line 24a
- **Gap**: No automatic pairing — user separately enters income and turn-over.
- **Effort**: S

### 12.22 — Foster Care Payments
- **Coverage**: ⚠️
- **Implementation locator**: `c:/us-tax/yamls/1d-medicaid-waiver-payments-taxpayer.yaml`; Schedule 1 line 8s negative add-back per CLAUDE.md
- **Gap**: Foster-care payments outside Medicaid waiver (state DSS, foster provider) not separately handled.
- **Effort**: S

### 12.23 — Digital Assets
- **Coverage**: ✅
- **Implementation locator**: `c:/us-tax/yamls/digital-assets-taxpayer.yaml`; `8-other-incomes-taxpayer.yaml` `otherIncomeDigitalAssets8v`
- **Gap**: No 1099-DA statement mapper yet (semantic CSV at `c:/us-tax/pdfs/f1099da_field_map_semantic.csv` exists but no Java mapper consumes it); no FMV-at-receipt automation.
- **Effort**: M

## Chapters 9-12 Summary

**Total scenarios**: 88. Coverage: ✅ 14, ⚠️ 16, ❌ 39, ➖ 19.

### Notable findings

1. **Ch 10 + Ch 11 are wholesale gaps** — Schedule E income/expenses, Form 4562 depreciation, §280A vacation-home, Form 8582 passive-loss, and Form 6198 at-risk all explicitly OOS. Combined with Schedule C/SE/F exclusion, Taxbeans cannot serve typical landlord or small-business owner.
2. **Form 8606 (IRA basis) coverage is strong** — Parts I/II/III covered. QCD post-70½ deductible-IRA reduction and split-interest entity cap are modeled.
3. **Form 5329 is under-used** — Only Part I wired. Parts III (excess traditional), IV (excess Roth), V (excess Coverdell), VIII (excess HSA), IX (RMD shortfall) not implemented. RMD-shortfall absence is biggest practical IRA gap.
4. **Active-participant IRA deduction phaseout (§9.4)** is largest IRA accuracy risk — Taxbeans accepts user-entered IRA deduction without consulting W-2 box 13 + MAGI.
5. **K-1 pass-through has structural limits** — All three K-1 forms (1041/1065/1120-S) intake plus capital attachment mapper, but no §465 at-risk, §469 passive, or basis (Form 7203 for S-corp; outside basis for partnerships) limitation applied.
6. **Ch 12 line-8x catch-all carries heavy lifting** — COD §108 exclusions (Form 982), tax-benefit-rule on state refunds and other recoveries, life-insurance surrender basis recovery, §691(c) IRD-related estate tax deduction unmodeled.
7. **Digital assets (§12.23)** — Form 1040 yes/no captured but no 1099-DA mapper yet.
8. **Form 8978 BBA partnership pushout (§12.13)** fully implemented — bright spot in chapter-12 complex-passthrough landscape.

---

# Chapters 13–16: AGI Deductions, Std vs Itemized, Medical/Dental, Taxes

## Chapter 13 — Deductions Allowed in Figuring Adjusted Gross Income

### 13.1 — Determining Adjusted Gross Income (AGI)
- **Description**: AGI = gross income minus Step-2 above-the-line adjustments on Schedule 1 Part II.
- **Coverage**: ✅
- **Implementation locator**: `c:/us-tax/us-tax-be/src/main/java/com/ustax/microservices/TaxReturnComputeService.java` (line 11a/11b AGI); `c:/us-tax/lines/11ab.md`
- **Gap**: None
- **Effort**: None

### 13.2a — Educator Expenses (Line 11, $300 cap)
- **Description**: K-12 educator ≥900 hrs may deduct up to $300/spouse for supplies/PD/PPE.
- **Coverage**: ⚠️
- **Implementation locator**: `TaxReturnComputeService.java:13948, 14407-14428`; `ReferenceData.EDUCATOR_EXPENSES_CAP_PER_PERSON`
- **Gap**: $300 cap IS enforced (baseline note stale). Tax-free savings-bond / QTP / Coverdell ESA reductions NOT applied.
- **Effort**: S

### 13.2b — Reservists / Performing Artists / State Officials (Line 12, Form 2106)
- **Description**: §62(a)(2) employee categories that may deduct unreimbursed business expenses above the line via Form 2106.
- **Coverage**: ✅
- **Implementation locator**: Per CLAUDE.md baseline (Form 2106 wired for Line 12).
- **Gap**: Verify performing-artist $16k AGI cap + 2-employer/10% expense gating enforced.
- **Effort**: S

### 13.2c — HSA Contribution Deduction (Line 13, Form 8889)
- **Description**: HDHP-covered individuals deduct contributions ($4,300 self / $8,550 family 2025 + $1k catch-up >55).
- **Coverage**: ⚠️
- **Implementation locator**: `Form8889AttachmentMapper.java`
- **Gap**: Form 8889 stub — contribution caps, age-55 catch-up, HDHP-coverage-month proration NOT enforced.
- **Effort**: M

### 13.2d — Moving Expenses — Armed Forces (Line 14, Form 3903)
- **Description**: Only active-duty PCS moves; 21¢/mi 2024; no meals; 30-day storage.
- **Coverage**: ⚠️
- **Implementation locator**: `Form3903AttachmentMapper.java`
- **Gap**: Armed-forces gate present; mileage rate / meals exclusion / 30-day storage / reimbursement netting need verification.
- **Effort**: M

### 13.2e — Half SE Tax (Line 15)
- **Description**: ~50% of SE tax flows to Line 15.
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: OOS — SE out of scope.
- **Effort**: None

### 13.2f — SE SEP/SIMPLE/Qualified Plans (Line 16)
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: OOS.
- **Effort**: None

### 13.2g — SE Health Insurance (Line 17)
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: OOS.
- **Effort**: None

### 13.2h — Early Withdrawal Penalty (Line 18)
- **Description**: 1099-INT box 2 / 1099-OID box 3.
- **Coverage**: ✅
- **Implementation locator**: Auto-import per CLAUDE.md baseline.
- **Gap**: None
- **Effort**: None

### 13.2i — Alimony Paid (Line 19a)
- **Description**: Pre-2019 decrees only; post-2018 not deductible.
- **Coverage**: ⚠️
- **Implementation locator**: `TaxReturnComputeService.java` alimony refs
- **Gap**: Confirm pre-2019 path (recipient TIN, decree date gate) still available — baseline says "blocked".
- **Effort**: S

### 13.2j — Traditional IRA Deduction (Line 20, Pub 590-A)
- **Description**: MAGI-phased active-participant deduction; iterative coordination with SS taxability.
- **Coverage**: ✅
- **Implementation locator**: `TaxReturnComputeService.java:609-767`; `c:/us-tax/lines/6b.md` Gap 5 closure
- **Gap**: None — full Pub 590-A iterative coordinator IS implemented (baseline note "NOT IMPLEMENTED" stale; closed 2026-06-05).
- **Effort**: None

### 13.2k — Student Loan Interest (Line 21, 1098-E)
- **Description**: $2,500 cap; MAGI phaseout $80-95k single / $165-195k MFJ for 2025; MFS/dependent disallowed.
- **Coverage**: ⚠️
- **Implementation locator**: `TaxReturnComputeService.java:14037-14081`; `Form1098EMapper.java`; `STUDENT_LOAN_INTEREST_DEDUCTION_CAP`
- **Gap**: $2,500 cap + MFS-disallowed + dependent-disallowed flags present. Confirm gradual MAGI phaseout interpolation between low/high thresholds (baseline says still missing).
- **Effort**: S–M

### 13.2l — Reserved (Line 22)
- **Coverage**: ➖
- **Gap**: N/A
- **Effort**: None

### 13.2m — Archer MSA (Line 23, Form 8853)
- **Coverage**: ⚠️
- **Implementation locator**: `Form8853AttachmentMapper.java`
- **Gap**: Form 8853 stub — 75%/65%-of-deductible contribution caps NOT enforced.
- **Effort**: M

### 13.2n — Jury Duty Pay (Line 24a)
- **Description**: Offsetting adjustment for Line 8h income inclusion.
- **Coverage**: ✅
- **Implementation locator**: CLAUDE.md baseline "jury duty (8h refund)"
- **Gap**: None
- **Effort**: None

### 13.2o — Reforestation Amortization (Line 24d)
- **Coverage**: ➖
- **Gap**: OOS (timber/Schedule F).
- **Effort**: None

### 13.2p — SUB Benefits Repayment (Line 24e)
- **Coverage**: ❌
- **Gap**: Not implemented (rare scenario).
- **Effort**: S

### 13.2q — Whistleblower Award Costs (Line 24i)
- **Coverage**: ❌
- **Gap**: Not implemented.
- **Effort**: S

### 13.2r — Olympic/Paralympic Prize Exclusion (Line 24c)
- **Description**: Inclusion on 8m offset by 24c; lost if AGI >$1M ($500k MFS).
- **Coverage**: ✅
- **Implementation locator**: CLAUDE.md "Olympic income (8m auto-fill)"
- **Gap**: Verify $1M/$500k AGI exclusion phaseout is enforced (baseline mentions only auto-fill).
- **Effort**: S

### 13.2s — Attorney Fees in Discrimination Cases (Line 24h)
- **Coverage**: ❌
- **Gap**: Not implemented.
- **Effort**: S

### 13.2t — Form 2555 Housing Deduction (Line 24j)
- **Coverage**: ⚠️
- **Implementation locator**: CLAUDE.md "24j Form 2555 housing deduction"; Form 2555 implemented
- **Gap**: Per Memory `project_form2555_doesnt_net_wages_from_agi.md` — Form 2555 routing through Schedule 1 line 8d not auto-applied; housing-deduction flow likely similarly affected.
- **Effort**: M

### 13.2u — Other 24-Series Niche Items (24b/24f/24g)
- **Coverage**: ➖
- **Gap**: OOS per CLAUDE.md baseline.
- **Effort**: None

### 13.2v — K-1(1041) §67(e) Excess Deductions (Line 24k)
- **Coverage**: ✅
- **Implementation locator**: CLAUDE.md "24k K-1(1041) §67(e)"
- **Gap**: None
- **Effort**: None

### 13.3 — Moving Costs for Armed Forces
- **Description**: Active-duty PCS only; mileage / meals exclusion / 30-day storage / reimbursement offset.
- **Coverage**: ⚠️
- **Implementation locator**: `Form3903AttachmentMapper.java`
- **Gap**: Same as 13.2d — armed-forces gate present; rule details unverified; 2025 mileage rate not centralized.
- **Effort**: M

---

## Chapter 14 — Claiming the Standard Deduction or Itemized Deductions

### 14.1 — Std vs Itemized Decision
- **Coverage**: ✅
- **Implementation locator**: `TaxReturnComputeService.java` AUTO/STD/ITEMIZED election; `ScheduleA.electsToItemizeAlthoughLessThanStandard`
- **Gap**: None
- **Effort**: None

### 14.2 — Basic Standard Deduction
- **Description**: 2025: Single/MFS $15,750; MFJ/QSS $31,500; HOH $23,625.
- **Coverage**: ✅
- **Implementation locator**: `ReferenceData.java` std-ded constants; `TaxReturnComputeService.java:5824` `baseStandardDeductionForStatus`; `c:/us-tax/lines/12abcde.md`
- **Gap**: None
- **Effort**: None

### 14.3 — Spouses Filing Separate Returns
- **Description**: MFS-itemize-when-spouse-itemizes; HOH-exception when living apart; community-property 50/50 split.
- **Coverage**: ⚠️
- **Implementation locator**: `TaxReturnComputeService.java` election logic
- **Gap**: MFS-itemize linkage implemented; community-property 50/50 medical expense split NOT explicit.
- **Effort**: M

### 14.4 — Standard Deduction if 65+ or Blind
- **Description**: $1,950 single/HOH, $1,550 MFJ/MFS/QSS per box; doubled if 65 AND blind.
- **Coverage**: ✅
- **Implementation locator**: `TaxReturnComputeService.java:5818,5822` `additionalStandardDeductionForBoxes`, `lookupAgeBlindnessStandardDeduction`
- **Gap**: None
- **Effort**: None

### 14.5 — Standard Deduction for Dependents
- **Description**: max($1,300, earned+$450), capped at filing-status base; add age/blind on top.
- **Coverage**: ✅
- **Implementation locator**: `TaxReturnComputeService.java:5811-5825` (uses `STANDARD_DEDUCTION_DEPENDENT_*` constants); earned-income definition per `c:/us-tax/lines/12abcde.md` Gap 1
- **Gap**: None
- **Effort**: None

### 14.6 — Prepaying / Postponing Itemized Expenses
- **Coverage**: ➖
- **Gap**: Advisory only — no compute.
- **Effort**: None

### 14.7 — No Pease Limitation
- **Coverage**: ✅
- **Implementation locator**: No active haircut (correct).
- **Gap**: None
- **Effort**: None

---

## Chapter 15 — Medical and Dental Expense Deductions

### 15.1 — 7.5% AGI Floor
- **Coverage**: ✅
- **Implementation locator**: `ReferenceData.SCHEDULE_A_MEDICAL_FLOOR_RATE` (0.075); `ScheduleA.medicalExpenseFloor` / `deductibleMedicalExpenses`; `ScheduleAOutputMapper.java`
- **Gap**: None
- **Effort**: None

### 15.2 — Allowable Medical/Dental Costs (Table 15-1)
- **Description**: Broad category list — services, dental, equipment, treatments, Rx, insulin, premiums, COVID PPE, smoking-cessation, etc.
- **Coverage**: ⚠️
- **Implementation locator**: `ScheduleA.medicalDentalExpensesPaid` (single aggregate field)
- **Gap**: Single bucket; no category breakdown / eligibility validation / OTC vs Rx hint / marijuana exclusion / special-foods extra-cost rule.
- **Effort**: M (UX checklist) / L (per-category breakdown)

### 15.3 — Nondeductible Medical Expenses (Table 15-2)
- **Description**: OTC, cosmetic, marijuana, gym, dance lessons, marriage counseling, funeral.
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No automated enforcement / advisory text.
- **Effort**: S

### 15.4 — Reimbursements Reduce Deduction
- **Description**: Net subtraction; excess reimbursement on employer-paid premiums → Line 8z; tax-benefit-rule on late reimbursement.
- **Coverage**: ⚠️
- **Implementation locator**: User enters net; no explicit reimbursement field
- **Gap**: No auto-subtraction; no excess-reimbursement → Line 8z routing; no prior-year recapture.
- **Effort**: M

### 15.5 — Expenses of Your Spouse
- **Description**: Married either when services rendered or paid; community-property MFS 50/50.
- **Coverage**: ⚠️
- **Implementation locator**: No spouse-specific intake
- **Gap**: No per-person attribution; CP-state split missing.
- **Effort**: M

### 15.6 — Expenses of Your Dependents
- **Description**: Relaxed qualifying-relative tests; divorced/separated-parent special rule.
- **Coverage**: ⚠️
- **Implementation locator**: No per-dependent intake
- **Gap**: No attribution; relaxed tests + divorced-parent rule not surfaced.
- **Effort**: M

### 15.7 — Decedent's Medical Expenses
- **Description**: Executor election to claim ≤1 year post-death on decedent's final return.
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Decedent return paradigm absent.
- **Effort**: L

### 15.8 — Premiums for Health Insurance
- **Description**: Medicare B/D yes; Medicare A only if voluntarily paying; LTC age-capped; non-dep child <27 excluded.
- **Coverage**: ⚠️
- **Implementation locator**: Aggregate `medicalDentalExpensesPaid`
- **Gap**: No subtype split; LTC age-cap NOT enforced.
- **Effort**: M

### 15.9 — Travel Costs
- **Description**: 21¢/mi 2024 std rate or actual; lodging $50/night/person non-inpatient; no meals (except inpatient).
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No mileage calculator / $50 lodging cap / inpatient distinction.
- **Effort**: M

### 15.10 — Schooling for Disabled
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No structured intake; advisory-only.
- **Effort**: S

### 15.11 — Nursing Homes / Assisted Living
- **Description**: Full cost deductible if confined for medical treatment; assisted living deductible for chronically ill (2+ ADL).
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Not structured.
- **Effort**: M

### 15.12 — Nurses' Wages
- **Description**: Wages + FICA/FUTA deductible; mixed-duty allocation; dependent-care-credit coordination.
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No structured field; credit coordination missing.
- **Effort**: M

### 15.13 — Home Improvements
- **Description**: Cost minus value-increase test; structural disability mods (ramps, grab bars) fully deductible.
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No improvement-value-test compute.
- **Effort**: M

### 15.14 — Impairment-Related Work Expenses
- **Description**: Form 2106 → Schedule A line 16 "Other" (NOT subject to 7.5% floor).
- **Coverage**: ⚠️
- **Implementation locator**: Form 2106 supports Line 12 path
- **Gap**: Distinct Schedule A line 16 path for impairment-related work expenses (no 7.5% floor) likely missing. SE-path OOS.
- **Effort**: S

### 15.15 — Long-Term Care Premiums and Services
- **Description**: Age-capped premiums 2024: $470 (≤40), $880 (41-50), $1,760 (51-60), $4,710 (61-70), $5,880 (>70). Chronically ill = 2+ ADL or severe cognitive. $410/day per diem cap (Form 8853).
- **Coverage**: ❌
- **Implementation locator**: `Form8853AttachmentMapper.java` exists for 1099-LTC, but no `LTC_PREMIUM_CAP_*` in `ReferenceData.java`
- **Gap**: Age-capped premium ceilings missing; chronically-ill cert gate not modeled; $410/day per diem not enforced.
- **Effort**: M

### 15.16 — Life Insurance Viatical Settlements
- **Description**: Terminally-ill: tax-free. Chronically-ill: per diem capped, excess via Form 8853.
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No accelerated-death-benefit / viatical proceed handling.
- **Effort**: M

---

## Chapter 16 — Deductions for Taxes

### 16.1 — SALT $40k/$20k Cap with MAGI Phasedown
- **Description**: 2025 OBBBA: $40k ($20k MFS) cap, phased down $1-for-$1 above MAGI $500k ($250k MFS), floor $10k ($5k MFS).
- **Coverage**: ✅
- **Implementation locator**: `ReferenceData.java:117-129` (SALT limit / phaseout / floor constants); `TaxReturnComputeService.java:29440-29462` (`saltLimitForStatusAndMagi`)
- **Gap**: None — phasedown IS implemented (baseline note stale).
- **Effort**: None

### 16.1a — Charitable Quid-Pro-Quo Safe Harbor
- **Description**: Reclassify disallowed state-tax-credit-for-charitable as SALT payment (Rev Proc 2019-12).
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Not implemented; no carryover when credit exceeds current state liability.
- **Effort**: M

### 16.2 — Nondeductible Taxes
- **Description**: Transfer taxes, gas/cigarette/alcohol, federal income/FICA, driver's license.
- **Coverage**: ✅
- **Implementation locator**: No fields capture these (correct by design)
- **Gap**: None
- **Effort**: None

### 16.3 — State/Local Income vs Sales Tax (Line 5a)
- **Description**: Election between income or sales (whichever larger); IRS optional tables + major-purchase add-on for sales option.
- **Coverage**: ✅
- **Implementation locator**: `ScheduleA.stateLocalIncomeTaxesPaid`, `stateLocalSalesTaxesPaid`, `stateLocalTaxChoice`
- **Gap**: Election wired. IRS sales-tax tables / calculator NOT bundled; mandatory state SDI/FLI/PFL guidance not auto-mapped.
- **Effort**: S (advisory) / L (bundled tables)

### 16.4 — Real Estate Taxes (Line 5b)
- **Description**: Ad-valorem state/local non-business; mortgage-impound only when actually disbursed; co-op share; HAF out-of-pocket-only safe harbor; NO foreign 2018-2025.
- **Coverage**: ⚠️
- **Implementation locator**: `ScheduleA.realEstateTaxesPaid`
- **Gap**: Aggregate only; foreign-realty exclusion not enforced; HAF safe-harbor not modeled; mortgage-impound disbursement qualification absent.
- **Effort**: S–M

### 16.5 — Assessments
- **Description**: Construction assessments add to basis (not deductible); maintenance assessments ARE deductible.
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No allocation guidance.
- **Effort**: S

### 16.6 — Tenants' Payment of Taxes
- **Coverage**: ➖
- **Gap**: Edge case — no automation needed.
- **Effort**: None

### 16.7 — Allocating Taxes on Sale/Buy of Realty
- **Description**: Buyer/seller day-count proration; 1099-S Box 6 import; tax-benefit-rule recapture on over-deducted prior year.
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No allocation calculator / 1099-S Box 6 import / recapture.
- **Effort**: M

### 16.8 — Automobile License Fees (Line 5c)
- **Description**: Deductible only if ad-valorem + annual + on personal property.
- **Coverage**: ⚠️
- **Implementation locator**: `ScheduleA.personalPropertyTaxesPaid`
- **Gap**: Aggregate; no ad-valorem-vs-weight validation; no state-level lookup.
- **Effort**: S

### 16.9 — Taxes as Business Expenses
- **Coverage**: ➖
- **Gap**: OOS — Schedule C/E.
- **Effort**: None

### 16.10 — Foreign Taxes (Line 6)
- **Description**: Foreign income tax deductible OR Form 1116 FTC (credit usually better); NO SALT cap on Line 6; foreign real-property tax NOT deductible 2018-2025.
- **Coverage**: ⚠️
- **Implementation locator**: `ScheduleA.foreignTaxesPaid`, `deductibleForeignTaxes`; `TaxReturnComputeService.java:5991-5992, 5467-5472` (Form 1116 mutual-exclusivity guard); `Form1116ListOutputMapper.java`, `ForeignTaxCreditMapper.java`
- **Gap**: Line 6 IS wired (baseline note stale); Form 1116 FTC route IS supported; deduction-vs-credit mutual-exclusivity guard exists. Gap: foreign real-property exclusion not separately enforced; deduction-vs-credit advisory could be guided.
- **Effort**: S

---

## Chapters 13–16 Summary

### Counts by Coverage Status

| Status | Count |
|---|---|
| ✅ Implemented | 14 |
| ⚠️ Partial | 18 |
| ❌ Not implemented | 14 |
| ➖ Out of scope | 9 |
| **TOTAL** | **55** |

### Effort Distribution

| Effort | Count |
|---|---|
| None | 21 |
| S | 11 |
| M | 17 |
| L | 2 |
| XL | 0 |

### Notable Findings

1. **Baseline drift on FOUR "gap" items**: My initial baseline overstated gaps; code shows these ARE implemented:
   - **Educator $300 cap** — enforced at `TaxReturnComputeService.java:14407-14428`.
   - **Pub 590-A IRA-deduction worksheet** — fully implemented at `TaxReturnComputeService.java:609-767` (iterative coordinator with Pub 915 SS taxability cross-iteration).
   - **Student loan interest $2,500 cap** — enforced at line 14079; MFS-disallowed + dependent-disallowed flags exist. Only gradual MAGI phaseout interpolation may still be partial.
   - **SALT $40k cap MAGI phasedown** — implemented at `TaxReturnComputeService.java:29440-29462` (`saltLimitForStatusAndMagi`) with full $500k/$250k phaseout to $10k/$5k floor.

2. **Largest concentrated gap area — Chapter 15 Medical (9 of 16 ❌)**: §15.6, §15.7, §15.9–15.13, §15.15, §15.16 not implemented because Schedule A captures one aggregate `medicalDentalExpensesPaid` field with no category breakdown. Medical mileage ($0.21/mi), LTC age-capped premium ceilings, $50/night non-inpatient lodging cap, decedent return medical claim, assisted-living chronically-ill gating are all user-discretion. Cumulative effort L–XL.

3. **Form 2555 housing-deduction routing follows known compute bug** (§13.2t): Per Memory `project_form2555_doesnt_net_wages_from_agi.md`, Form 2555 exclusion does not auto-route through Schedule 1 line 8d during seeding/compute. Housing deduction (Line 24j) likely similarly affected.

4. **Sub-$10k LTC area is biggest medical gap with quick win** (§15.15): Adding 2025 age-capped LTC premium ceilings ($470/$880/$1,760/$4,710/$5,880) to `ReferenceData.java` plus a chronically-ill certification gate would close §15.15 + improve §15.8 + improve §15.16. Medium effort, high impact.

5. **Sales-tax IRS optional tables unbundled** (§16.3): Sales-tax election users must compute externally with IRS Sales Tax Deduction Calculator. Low frequency for income-tax states; M effort to bundle.

6. **Schedule 1 line 24-series long-tail missing** (§13.2p, §13.2q, §13.2s): Repayment of SUB benefits (24e), whistleblower legal costs (24i), attorney fees in discrimination cases (24h) — small S addition each.

7. **HSA/Archer MSA stub quality**: §13.2c, §13.2m — Form 8889/8853 attach but no contribution caps, age-55 catch-up, HDHP-month proration enforced. M each.

8. **Form 1116 + Schedule A foreign-tax election IS wired** (§16.10): Both deduction and credit routes exist; mutual-exclusivity guard fires at `TaxReturnComputeService.java:5467-5472`. Gap is advisory guidance and foreign-realty exclusion enforcement.

---

# Chapters 17-20: Interest Expenses, Charitable, Casualty/Theft, Other Itemized

## Chapter 17 — Itemized Deduction for Interest Expenses

### 17.1 — Deduction for Home Mortgage Interest
- **Description**: General rule for Schedule A interest deduction on debt secured by first/second home with TCJA $750k/$375k MFS post-2017 cap and pre-12/16/17 grandfathered $1M/$500k cap.
- **Coverage**: ⚠️
- **Implementation locator**: `form-standard-deductions.component.ts` (`homeMortgageInterestPaid`); `TaxReturnComputeService.java:5938`; `ScheduleA.java`
- **Gap**: Single deductible-amount field. No intake of origination date, acquisition vs. equity flag, principal balance, secured-residence type, or two-residence limit. No $750k/$1M ceiling enforcement, no grandfather logic, no Form 1098 statement intake.
- **Effort**: L

### 17.2 — Home Acquisition Loans
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No intake of loan purpose, origination date, substantial-improvement classification, or transition-rule eligibility. No average-balance worksheet (IRS Pub 936 Table 1) to apportion when balance exceeds cap.
- **Effort**: L

### 17.3 — Home Equity Loans
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No proceeds-use tracing, no acquisition-vs-equity classifier, no separate-loan grandfather analysis.
- **Effort**: M

### 17.4 — Home Construction Loans
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No construction-loan intake (start/completion dates, retroactive window). No election handling.
- **Effort**: M

### 17.5 — Mortgage Insurance Premiums and Other Payment Rules
- **Coverage**: ⚠️ (de facto — PMI correctly absent)
- **Implementation locator**: N/A
- **Gap**: No advisory that PMI is non-deductible for 2025; no field for ground rent or late charges (both deductible). Reverse-mortgage interest not modeled.
- **Effort**: S

### 17.6 — Interest on Refinanced Loans
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No refinance intake, balance tracking, or points-amortization schedule.
- **Effort**: L

### 17.7 — "Points"
- **Coverage**: ⚠️
- **Implementation locator**: `form-standard-deductions.component.ts` (`homeMortgagePointsPaid`); Schedule A line 8
- **Gap**: Single lump-sum field. No purchase-vs-refinance-vs-second-home classification, no amortization schedule, no IRS six-prong test enforcement, no Form 1098 box 6 intake.
- **Effort**: M

### 17.8 — Cooperative and Condominium Apartments
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No co-op share-of-interest intake or allocation schedule.
- **Effort**: M

### 17.9 — Investment Interest Limitations
- **Description**: Investment interest deductible up to net investment income; Form 4952; election to include qualified dividends/net capital gain; excess carries forward indefinitely.
- **Coverage**: ✅
- **Implementation locator**: `form-interest-expense.component.ts`; `4952-investment-interest-expense-deduction.yaml`; `TaxReturnComputeService.java:1002` and `:22655`; `PfInvestmentInterestExpense.java`; `InvestmentInterestExpenseMapper.java`. Carryforward (`disallowedInvestmentInterestExpenseFrom2024Line2`) and election (`electToIncludeQualifiedDividendsOrCapitalGainInInvestmentIncome` + `electedInvestmentIncomeAmountLine4g`) supported.
- **Gap**: Royalties/at-risk/non-passive routing captured as flags but not pushed to Schedule E / Form 6198. AMT-side recomputation flagged but not separately computed.
- **Effort**: S

### 17.10 — Debts To Carry Tax-Exempt Obligations
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No tax-exempt-allocated-debt screening or allocation worksheet.
- **Effort**: M

### 17.11 — Earmarking Use of Loan Proceeds For Investment or Business
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No interest-tracing schedule, no allocation across investment/business/passive/personal, no 30-day re-tracing window.
- **Effort**: L

### 17.12 — Year To Claim an Interest Deduction
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No paid-vs-accrued date capture, no rule preventing deduction of interest paid with proceeds of same loan, no OID amortization on personal debt instruments.
- **Effort**: M

### 17.13 — Prepaid Interest
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No prepaid-interest intake, straight-line amortization schedule, or per-year deductible portion tracking.
- **Effort**: M

## Chapter 18 — Charitable Contribution Deductions

### 18.1 — Deductible Contributions
- **Coverage**: ⚠️
- **Implementation locator**: `form-standard-deductions.component.ts` (`charitableCashContributions`, `charitableNonCashContributions`); `TaxReturnComputeService.java:5973-5980`
- **Gap**: No EIN/charity-status validation. No per-donation timing capture. No security-transfer date rule. No credit-card vs. check distinction.
- **Effort**: M

### 18.2 — Nondeductible Contributions
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No screening checklist for non-qualifying donations.
- **Effort**: S

### 18.3 — Contributions That Provide You With Benefits
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No quid-pro-quo intake or FMV-of-benefit subtraction. $75 disclosure threshold not surfaced.
- **Effort**: M

### 18.4 — Unreimbursed Expenses of Volunteer Workers
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No volunteer-expense category, mileage capture, travel/uniform fields, or $250+ written-acknowledgment substantiation tracking.
- **Effort**: M

### 18.5 — Support of a Student in Your Home
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No student-hosting intake; no $50/month × months calculation.
- **Effort**: S

### 18.6 — What Kind of Property Are You Donating?
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No property-type classification, FMV/basis distinction, or related-use test. Appreciated-property special rules NOT implemented.
- **Effort**: L

### 18.7 — Cars, Clothing, and Other Property Valued Below Cost
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No Form 1098-C statement intake. No vehicle-donation deduction limit logic. No condition-of-clothing attestation.
- **Effort**: M

### 18.8 — Bargain Sales of Appreciated Property
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No bargain-sale intake, basis-allocation schedule, or gain recognition on sale portion.
- **Effort**: M

### 18.9 — Art Objects
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No art-donation intake, no appraisal-required gating, no Form 8283 Section B intake, no Art Advisory Panel flagging.
- **Effort**: M

### 18.10 — Interests in Real Estate
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No real-estate-interest donation intake, conservation-easement path, or 2.5x basis limit on partnership-allocated easements.
- **Effort**: L

### 18.11 — Life Insurance
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No life-insurance donation intake, no interpolated-reserve valuation.
- **Effort**: S

### 18.12 — Business Inventory
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Schedule C/SE explicitly excluded per CLAUDE.md.
- **Effort**: None

### 18.13 — Donations Through Trusts
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No CRT/CLT/pooled-fund intake. No PV-of-remainder computation. Donor-advised fund rules NOT implemented.
- **Effort**: L

### 18.14 — Records Needed To Substantiate Your Contributions
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No substantiation-status attestation or $250+ written-acknowledgment confirmation.
- **Effort**: S

### 18.15 — Form 8283 and Written Appraisal Requirements
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Form 8283 entirely missing. No intake, no PDF output, no Section A vs. B classification, no appraiser-credential capture.
- **Effort**: XL

### 18.16 — Penalty for Substantial Overvaluation of Property
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No valuation-risk warning or taxpayer attestation of FMV methodology.
- **Effort**: S

### 18.17 — Ceiling on Charitable Contributions
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: AGI ceilings (60%/50%/30%/20%) NOT enforced. Cash and non-cash pass straight to Schedule A with no ceiling logic.
- **Effort**: L

### 18.18 — Carryover for Excess Donations
- **Coverage**: ⚠️
- **Implementation locator**: `form-standard-deductions.component.ts` (`priorYearCharitableContributionCarryover`); `TaxReturnComputeService.java:5980`
- **Gap**: Single carryover field, no per-category tracking (60/30/20), no 5-year aging, no current-year-excess emission for next year.
- **Effort**: L

### 18.19 — Election To Reduce Fair Market Value by Appreciation
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No FMV-reduction election checkbox or recomputed deduction.
- **Effort**: M

## Chapter 19 — Casualty and Theft Losses and Involuntary Conversions

### 19.1 — Casualty or Theft Losses for Personal-Use Property Must Be Due to a Federally Declared Disaster
- **Coverage**: ❌
- **Implementation locator**: `form-tax-return-4684.component.ts` (preview only); `SeForm4684.java`; `Form4684Mapper.java`
- **Gap**: No FEMA-disaster-declaration intake. No federally-declared-disaster gating.
- **Effort**: L

### 19.2 — When To Deduct a Casualty or Theft Loss
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No timing logic, reimbursement-pending status, or year-of-sustainment vs. year-of-discovery routing.
- **Effort**: M

### 19.3 — Prior-Year Election for Disaster Losses
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No prior-year election checkbox, comparison computation, or 1040-X path.
- **Effort**: L

### 19.4 — Gain Realized From Insurance Proceeds for Damaged or Destroyed Principal Residence
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No principal-residence insurance-gain intake, no Section 121/1033 routing, no replacement-property tracking.
- **Effort**: L

### 19.5 — Who May Deduct a Casualty or Theft Loss
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No ownership-allocation intake or lessee-liability path.
- **Effort**: S

### 19.6 — Proving a Casualty Loss
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No documentation checklist or substantiation attestation field.
- **Effort**: S

### 19.7 — Theft Losses
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No theft-loss intake, no Ponzi safe-harbor election. Form 4684 Section C entirely missing.
- **Effort**: L

### 19.8 — Floors for Personal-Use Property Losses
- **Coverage**: ⚠️
- **Implementation locator**: `form-standard-deductions.component.ts` (`personalCasualtyAndTheftLoss`, `netQualifiedDisasterLoss`, `electDisasterLossStandardDeductionIncrease`); `TaxReturnComputeService.java:5996-6014`
- **Gap**: Fields are raw user-entered net amounts. No $100/$500 per-event floor enforcement, no 10%-AGI subtraction, no per-event loss tabulation.
- **Effort**: L

### 19.9 — Figuring Your Loss on Form 4684
- **Coverage**: ❌ (stub only)
- **Implementation locator**: `form-tax-return-4684.component.ts` (PDF preview only)
- **Gap**: Form 4684 stub only — embedded PDF preview, no compute. No loss worksheet, no Section A line 1-18 logic.
- **Effort**: XL

### 19.10 — Personal and Business Use of Property
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No mixed-use allocation schedule. Section B entirely missing.
- **Effort**: M

### 19.11 — Repairs May Be a "Measure of Loss"
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No repair-cost-as-evidence intake mode or FMV-vs-repair-cost comparison.
- **Effort**: S

### 19.12 — Excess Living Costs Paid by Insurance Are Not Taxable
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No excess-living-costs intake or income exclusion path.
- **Effort**: S

### 19.13 — Do Your Casualty or Theft Losses Exceed Your Income?
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No NOL computation. Disaster-NOL carryback out of reach without base NOL infrastructure.
- **Effort**: XL

### 19.14 — Defer Gain from Involuntary Conversion by Replacing Property
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Involuntary conversions Section C NOT implemented. No Section 1033 election intake.
- **Effort**: L

### 19.15 — Involuntary Conversions Qualifying for Tax Deferral
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No conversion-type intake or threat-of-condemnation attestation.
- **Effort**: M

### 19.16 — How to Elect to Defer Gain
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No election statement generation, no Form 4684 Section D output.
- **Effort**: M

### 19.17 — Types of Qualifying Replacement Property
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No replacement-property intake or similar-use classifier.
- **Effort**: M

### 19.18 — Time Period for Buying Replacement Property
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No replacement-window tracking or extension election.
- **Effort**: M

### 19.19 — Cost of Replacement Property Determines Postponed Gain
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No replacement-cost-vs-proceeds intake or basis-carryover computation.
- **Effort**: M

### 19.20 — Special Assessments and Severance Damages from Condemnation
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No condemnation-award detail intake.
- **Effort**: S

## Chapter 20 — Other Itemized Deductions

### 20.1 — Only a Few Expenses Are Allowed as "Other" Itemized Deductions
- **Description**: Impairment-related work expenses; casualty/theft loss of investment property; net qualified disaster loss; gambling losses; Section 1341 repayment > $3,000; federal estate tax on IRD; amortizable bond premium; unrecovered investment in annuity; §1244 ordinary loss.
- **Coverage**: ⚠️
- **Implementation locator**: `form-standard-deductions.component.ts` (`otherAllowedItemizedDeductions`, `netQualifiedDisasterLoss`); `TaxReturnComputeService.java:5996-6060`; `ScheduleA.java`; `OutScheduleA.java`
- **Gap**: Single lump-sum + separate disaster field. No per-category breakdown, no category-specific validation, no description text capture, no Form 4684 Section B → line 16 flow.
- **Effort**: L

### 20.2 — Deductions for Job Costs and Other Miscellaneous Expenses No Longer Allowed
- **Coverage**: ⚠️ (de facto correct — suspended)
- **Implementation locator**: N/A
- **Gap**: No user-facing messaging that these categories are suspended for 2025 (TCJA expires 12/31/2025 — could revive for 2026). No screening to prevent mistaken entry in `otherAllowedItemizedDeductions`.
- **Effort**: S

## Chapters 17-20 Summary

**Total scenarios**: 54. Coverage: ✅ 1, ⚠️ 9, ❌ 43, ➖ 1.

### Notable findings

1. **Form 4684 is the single largest gap** — currently a PDF-preview stub. Sections A/B/C/D all lack compute, blocking 9 chapter-19 topics and 20.1's investment-property loss flow.
2. **Form 8283 entirely missing** — affects all non-cash donations >$500 (vehicles, art, real estate). Form 1098-C vehicle-donation statement also missing.
3. **AGI ceilings on charitable contributions not enforced** — cash + non-cash + carryover sum into a single Schedule A figure with no 60/50/30/20% ceiling, no per-category bucketing, no carryover-to-next-year emission.
4. **Mortgage-interest computations are absent** — `homeMortgageInterestPaid` is a raw amount with no $750k/$1M cap, no grandfather logic, no Form 1098 intake, no acquisition-vs-equity classification.
5. **Investment interest (17.9) is the only fully-implemented Ch. 17-20 topic** — Form 4952 wired with carryforward and qualified-dividend election.
6. **Interest-tracing rules (17.11) absent everywhere** — no `Temp. Reg. 1.163-8T` mechanism. Adding this would unblock 17.3, 17.6, 17.10, 17.11.
7. **Line 16 categorization is a single lump-sum** — `otherAllowedItemizedDeductions` collapses ~9 distinct IRS categories.
8. **Standard-deduction increase for net qualified disaster loss IS implemented** — only Form 4684 outcome wired; good template for extending Form 4684 compute.
9. **20.2 is "correctly empty"** — absence of unreimbursed-employee-expense and tax-prep-fee fields is correct 2025 behavior. May need revival for 2026 if TCJA expires.
10. **No QCD double-counting risk** — Ch. 18 charitable rollover IRA handled upstream at line 4c; no double deduction.

---

# Chapters 21-24: Travel/Meals, Tax Computation, AMT, Kiddie Tax

## Chapter 21 — Travel and Meal Expense Deductions

### 21.1 — Who May Deduct Travel and Transportation Expenses
- **Description**: Narrow eligibility — armed-forces reservists, qualified performing artists, fee-basis state/local officials, self-employed (Schedule C). W-2 employees no longer deduct.
- **Coverage**: ⚠️
- **Implementation locator**: `form-tax-return-2106.component.ts`; `Form2106AttachmentMapper.java`
- **Gap**: Form 2106 is PDF preview stub only; no compute path to Schedule 1 line 12.
- **Effort**: M

### 21.2 — Commuting Expenses
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No commuting distinction.
- **Effort**: S

### 21.3 — Overnight-Sleep Test Limits Deduction of Meal Costs
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No travel/meals intake.
- **Effort**: S

### 21.4 — IRS Meal Allowance (Per Diem)
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Per-diem tables/locality lookups not implemented.
- **Effort**: L

### 21.5 — Business Trip Deductions
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No trip-line intake.
- **Effort**: M

### 21.6 — When Are You Away From Home?
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No tax-home logic.
- **Effort**: S

### 21.7 — Tax Home of Married Couple Working in Different Cities
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Not modeled per-spouse.
- **Effort**: S

### 21.8 — Deducting Living Costs on Temporary Assignment
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No temporary-assignment tracking.
- **Effort**: M

### 21.9 — Business-Vacation Trips Within the United States
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No business-day vs personal-day split.
- **Effort**: M

### 21.10 — Business-Vacation Trips Outside the United States
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Foreign travel rules not implemented.
- **Effort**: L

### 21.11 — Deducting Expenses of Business Conventions
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Conventions not implemented.
- **Effort**: S

### 21.12 — Restrictions on Foreign Conventions and Cruises
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Not implemented.
- **Effort**: M

### 21.13 — Entertainment Expenses Generally Not Deductible
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: No-op rule (TCJA repealed).
- **Effort**: None

### 21.14 — Business Meals Are Generally Deductible (50%)
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No 50% meal compute.
- **Effort**: M

### 21.15 — Limitation on Some Deductible Meals
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: DOT 80% bracket not implemented.
- **Effort**: S

### 21.16 — Substantiating Travel Expenses
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: No substantiation log.
- **Effort**: M

### 21.17 — Employee Reporting of Unreimbursed Expenses
- **Coverage**: ⚠️
- **Implementation locator**: `form-tax-return-2106.component.ts`
- **Gap**: PDF stub only; no compute.
- **Effort**: M

### 21.18 — Are You Reimbursed Under an Accountable Plan?
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Employer-side.
- **Effort**: None

### 21.19 — Per Diem Travel Allowance Under Accountable Plans
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Employer-side.
- **Effort**: None

### 21.20 — Automobile Mileage Allowance
- **Description**: 2025 standard rate — IRS-published 70¢ business, 21¢ medical/moving (active-duty only), 14¢ charitable.
- **Coverage**: ❌
- **Implementation locator**: N/A
- **Gap**: Standard mileage rate constants not in `ReferenceData`; no auto-expense compute. **CLAUDE.md cites 67¢ business which is the 2024 rate; correct 2025 value is 70¢.**
- **Effort**: M

### 21.21 — Reimbursements Under Non-Accountable Plans
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Already in W-2 box 1.
- **Effort**: None

## Chapter 22 — Figuring Your Regular Income Tax Liability

### 22.1 — Taxable Income and Regular Income Tax Liability
- **Coverage**: ✅
- **Implementation locator**: `TaxReturnComputeService.java` (lines 11/11b AGI, 14/15 taxable income, 16 dispatcher)
- **Gap**: None
- **Effort**: None

### 22.2 — Using the Tax Table
- **Coverage**: ✅
- **Implementation locator**: `TaxReturnComputeService.java` line-16 <$100k path
- **Gap**: None
- **Effort**: None

### 22.3 — Tax Computation Worksheet
- **Coverage**: ✅
- **Implementation locator**: `TaxReturnComputeService.java` line-16 ≥$100k path; 2025 brackets all 5 filing statuses
- **Gap**: None
- **Effort**: None

### 22.4 — Tax Calculation If You Have Net Capital Gain or Qualified Dividends
- **Coverage**: ✅
- **Implementation locator**: `TaxReturnComputeService.java` line-16 dispatcher rules 3 & 4; 2025 0/15/20 thresholds from `ReferenceData`
- **Gap**: None
- **Effort**: None

### 22.5 — Foreign Earned Income Tax Worksheet
- **Coverage**: ✅ (with known routing issue)
- **Implementation locator**: `TaxReturnComputeService.java` line-16 dispatcher rule 1
- **Gap**: Per `feedback_form2555_doesnt_net_wages_from_agi.md` — Form 2555 path produces FEITW but does NOT auto-route exclusion through Schedule 1 line 8d; line 1z stays at full W-2 wages so FEITW stacks on larger-than-canonical base.
- **Effort**: M

### 22.6 — Income Averaging for Farmers and Fishermen
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: SE-adjacent, OOS per CLAUDE.md.
- **Effort**: None

### 22.7 — Tax Credits
- **Coverage**: ⚠️
- **Implementation locator**: `Schedule3OtherPaymentsCredits.java`; `TaxReturnComputeService.java` Schedule 3 lines 1–6 + Form 1040 lines 19/20/27/28/29/31
- **Gap**: Most personal credits intake-only (8863, 2441, 8839, 5695, 8936, 8911 etc.) per CLAUDE.md. CTC/ODC line 19 + Schedule 8812 partially implemented.
- **Effort**: XL

### 22.8 — Additional Medicare Tax and Net Investment Income Tax
- **Coverage**: ➖
- **Implementation locator**: N/A; `Form8960.java` (model only)
- **Gap**: Explicitly OOS per CLAUDE.md (but per Ch 28 audit, Form 8960 IS implemented — CLAUDE.md is stale).
- **Effort**: None (would be L)

## Chapter 23 — Alternative Minimum Tax (AMT)

### 23.1 — Computing Alternative Minimum Tax on Form 6251
- **Description**: AGI start (per 2025 IRS Form 6251), add-backs, exemption with phaseout, 26%/28% rates, compare to regular tax → Schedule 2 line 1.
- **Coverage**: ✅
- **Implementation locator**: `TaxReturnComputeService.java` `computeLine17`; `c:/us-tax/lines/17.md`
- **Gap**: 2025 exemption $137k/$88,100/$68,500; phaseout $1,252,700/$626,350; 26/28 boundary $239,100/$119,550; lines 1, 2a, 2b, 3, 4, 5, 6, 7, 8, 11 + FEITW correction at line 17 all implemented.
- **Effort**: None for core

### 23.2 — Adjustments and Preferences for AMT
- **Coverage**: ⚠️
- **Implementation locator**: `TaxReturnComputeService.java` Form 6251 build; PAB wired (`form6251Line2gPrivateActivityBondInterest` from 1099-INT Box 9)
- **Gap**: NOT implemented: **2c** investment interest AMT, **2f** NOL recompute, **2i** ISO spread, **2m** passive activity AMT. Also missing: tax-shelter farm losses, MACRS difference, mining/circulation/research/contract preferences, QSBS 7%. WIRED: 2a (std ded), 2b (SALT), 2g (PAB).
- **Effort**: L (4 high-value) — XL for full coverage

### 23.3 — Tax Credits Allowed Against AMT
- **Coverage**: ⚠️
- **Implementation locator**: `TaxReturnComputeService.java` `correctLine17ForFtc`
- **Gap**: AMT-source FTC line 8 not independently computed; code uses regular-FTC correction loop, approximate for foreign-source income.
- **Effort**: L

### 23.4 — Regular Tax Credit for Prior-Year AMT (Form 8801)
- **Coverage**: ⚠️
- **Implementation locator**: `Form8801.java`, `OutForm8801.java`, `Form8801OutputMapper.java`, `PriorMinTaxCreditMapper.java`, `PfPriorMinTaxCredit.java`
- **Gap**: Intake + mapper exist; worksheet compute (deferral vs exclusion separation) is intake-only; push to Schedule 3 line 6b not confirmed.
- **Effort**: M

### 23.5 — Avoiding AMT
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: Advisory content.
- **Effort**: None

## Chapter 24 — Computing the "Kiddie Tax" on Your Child's Unearned Income

### 24.1 — Filing Your Child's Return
- **Coverage**: ⚠️
- **Implementation locator**: Dependent personal forms; `TaxReturnComputeService.java` line-12 path; `c:/us-tax/lines/12abcde.md`
- **Gap**: Per CLAUDE.md single-return architecture — ONE return per household; dependent Tax Return sidebar empty by design. Dependent std ded chart implemented at parent return only.
- **Effort**: XL

### 24.2 — Children Subject to "Kiddie Tax" for 2025
- **Coverage**: ⚠️
- **Implementation locator**: `c:/us-tax/lines/8615.md`; `PfKiddieIncome.java`; `KiddieIncomeMapper.java`; `TaxReturnComputeService.java` Form 8615 build
- **Gap**: Eligibility present; half-of-support test is manual user attestation, not computed.
- **Effort**: S

### 24.3 — Computing "Kiddie Tax" on Child's Return (Form 8615)
- **Coverage**: ⚠️
- **Implementation locator**: `c:/us-tax/lines/8615.md`; `TaxReturnComputeService.java` Form 8615 build
- **Gap**: Per CLAUDE.md — lines 1–8 implemented; **lines 9–13 BLOCKED on single-return architecture (cross-return data design issue)**. Sibling cross-feed (line 7), Part II combined-rate, QDCG/Sched D branching in 8615, custodial-parent rules, lines 14–18 all blocked.
- **Effort**: XL (architectural)

### 24.4 — Parent's Election To Report Child's Dividends and Interest (Form 8814)
- **Coverage**: ✅
- **Implementation locator**: `c:/us-tax/lines/8814.md`; `TaxReturnComputeService.java` Form 8814 build; line 16 box 1 wiring
- **Gap**: Compute complete (one per child, < $13,500 gating, line 4 ≤ $2,700 skip lines 5–12, line 16 box 1). Custodial-parent / unmarried-cohabiting / MFS election rules not explicitly verified. Election disadvantages not surfaced as UX warnings.
- **Effort**: S (UX only)

## Chapters 21-24 Summary

**Total scenarios**: 38. Coverage: ✅ 7, ⚠️ 9, ❌ 14, ➖ 8.

### Notable findings

1. **Chapter 21 is essentially a stub** — only 2 partials (21.1 / 21.17 Form 2106 PDF stub), 14 not implemented. Schedule C OOS removes the dominant use case.
2. **Standard mileage rate constant is stale** — CLAUDE.md cites `2025: 67¢ business` but that's the 2024 rate; **2025 IRS rate is 70¢ business** (effective Jan 1, 2025).
3. **Chapter 22 is well covered** — 5 of 8 implemented; line 16 7-method decision tree complete with 2025 brackets. Known Form 2555 routing flaw at 22.5.
4. **Chapter 23 AMT — 5 specific preferences NOT implemented**: 2c investment interest AMT, 2f NOL, 2i ISO bargain, 2m passive activity AMT, line 8 AMT-source FTC. **ISO (2i) is the highest-impact silent gap** for option-holding taxpayers.
5. **Chapter 23.4 Form 8801 is intake-only** — worksheet compute + Schedule 3 line 6b push not implemented.
6. **Chapter 24.3 Form 8615 lines 9–13 architecturally blocked** — single-return-per-household design prevents cross-return data needed for parent-rate compute. Largest user-visible gap: any dependent with >$2,700 unearned income cannot have kiddie tax computed correctly. Form 8814 (24.4) is the implemented escape hatch.
7. **22.8 NIIT/AdMed explicitly OOS** per CLAUDE.md, but Ch 28 audit shows Form 8960 IS implemented — CLAUDE.md baseline stale.
8. **Register-in-N-places hazards** apply to any future Form 2106 / 6251 missing lines / 8615 9–13 / 8960 work: `PersonalResource.PERSONAL_FORMS`, `UserDataBulkDelete.PARENT_TABLES_UID_CASCADE`, `NonOverrideableFlags.CODES`, Liquibase master changelog `<include>`, formatted-SQL header on every V*.sql.

---

# Chapters 25-28: Personal Credits, Withholdings, Estimated Tax, Add'l Medicare/NIIT

## Chapter 25 — Personal Tax Credits Reduce Your Tax Liability

### 25.1 — Overview of Personal Tax Credits
- **Coverage**: ✅
- **Implementation locator**: `Schedule3NonrefundableCredits.java`, `Schedule3OtherPaymentsCredits.java`, `TaxAndCredits.java`
- **Gap**: None
- **Effort**: None

### 25.2 — Child Tax Credit for Children Under Age 17
- **Description**: $2,000/child SSN-by-due-date rules + Form 8862 disallowance history.
- **Coverage**: ✅
- **Implementation locator**: `microservices/output/Schedule8812OutputMapper.java`, `microservices/personal/Form8862Mapper.java`, `model/output/Schedule8812.java`, `entity/OutForm1040Dependent.java`
- **Gap**: Form 8862 disallowance-history captured but 2-year reckless / 10-year fraud ban not enforced as blocking flag.
- **Effort**: S

### 25.3 — Figuring the Child Tax Credit and Additional Child Tax Credit
- **Description**: $2,000 CTC phaseout 5%/$1k over $200k/$400k; refundable ACTC up to $1,600/child = 15% × (earned − $2,500); 3+ children alt formula.
- **Coverage**: ✅
- **Implementation locator**: `TaxReturnComputeService.java` Schedule 8812 Parts I-A/II-A/II-B, `ReferenceData.java`
- **Gap**: 2025 refundable cap is $1,700 (OBBBA); verify ReferenceData.
- **Effort**: S

### 25.4 — Credit for Other Dependents
- **Description**: $500 nonrefundable for ODC dependents.
- **Coverage**: ✅
- **Implementation locator**: `Schedule8812OutputMapper.java`, `Form1040OutputMapper.java` line 19
- **Gap**: None
- **Effort**: None

### 25.5 — Qualifying for the Child and Dependent Care Credit
- **Coverage**: ✅
- **Implementation locator**: `microservices/personal/ChildcareExpensesMapper.java`, `microservices/output/Form2441OutputMapper.java`, `model/output/Form2441.java`, `entity/OutForm2441QualifyingPerson.java`, `entity/OutForm2441CareProvider.java`
- **Gap**: Verify "treated as unmarried" MFS exception honored not auto-blocked.
- **Effort**: S

### 25.6 — Figuring the Child and Dependent Care Credit
- **Description**: 20%-35% on $3k/$6k base; AGI-graduated Table 25-1; $250/$500 deemed earned income.
- **Coverage**: ✅
- **Implementation locator**: `TaxReturnComputeService.java` Form 2441 Parts II-III, `ReferenceData.java`
- **Gap**: 2025 inflation adjustments to AGI tiers; prior-year-expense rollover not modeled.
- **Effort**: S

### 25.7 — Qualifying Tests for EIC
- **Coverage**: ✅
- **Implementation locator**: `microservices/personal/EarnedIncomeCreditMapper.java`, `entity/PfEarnedIncomeCredit.java`, `entity/PfEicQualifyingChild.java`, `TaxReturnComputeService.java`
- **Gap**: Tie-breaker resolution surfaced as blocking flag — acceptable per save-vs-compute principle.
- **Effort**: None

### 25.8 — Income Tests for Earned Income Credit (EIC)
- **Coverage**: ✅
- **Implementation locator**: `TaxReturnComputeService.java` EIC compute, `ReferenceData.java`
- **Gap**: 2025 ceiling $11,950 (vs book 2024 $11,600); 2025 EIC maxes $649/$4,328/$7,152/$8,046 — verify ReferenceData.
- **Effort**: S

### 25.9 — Qualifying for the Adoption Credit
- **Coverage**: ✅
- **Implementation locator**: `microservices/personal/AdoptionExpensesMapper.java`, `entity/PfAdoptionExpenses.java`, `entity/PfAdoptionChild.java`, `microservices/output/Form8839OutputMapper.java`, `model/output/Form8839.java`
- **Gap**: 2025 max $17,280; verify ReferenceData.
- **Effort**: S

### 25.10 — Claiming the Adoption Credit on Form 8839
- **Coverage**: ✅
- **Implementation locator**: `Form8839OutputMapper.java`, `TaxReturnComputeService.java` Form 8839 Parts I/II/III
- **Gap**: Hague-Convention safe harbors (Rev. Proc. 2010-31) informational only.
- **Effort**: S

### 25.11 — Eligibility for the Saver's Credit
- **Coverage**: ✅
- **Implementation locator**: `microservices/personal/SavingsCreditMapper.java`, `entity/PfSavingsCredit.java`, `microservices/output/Form8880OutputMapper.java`, `model/output/Form8880.java`
- **Gap**: 2025 AGI ceilings $79,000/$59,250/$39,500 — verify ReferenceData.
- **Effort**: S

### 25.12 — Figuring the Saver's Credit
- **Coverage**: ✅
- **Implementation locator**: `TaxReturnComputeService.java` Form 8880 compute, `Form8880.java`
- **Gap**: Confirm post-2021 distribution lookback captured for both spouses; ABLE-account integration.
- **Effort**: M

### 25.13 — Premium Tax Credit
- **Coverage**: ⚠️
- **Implementation locator**: `microservices/personal/PremiumTaxCreditMapper.java`, `entity/PfPremiumTaxCredit.java`, `entity/PfPtcSharedPolicy.java`, `entity/PfPtcDependentMagi.java`, `microservices/output/Form8962OutputMapper.java`, `model/output/Form8962.java`, `entity/OutForm8962MonthlyRow.java`, `entity/OutForm8962PolicyAllocation.java`
- **Gap**: Per project baseline "partial." Verify monthly rows, SLCSP lookup, shared-policy allocation, excess-APTC repayment caps.
- **Effort**: M

### 25.14 — Mortgage Interest Credit
- **Description**: Form 8396 MCC interest credit; $2,000 cap if rate > 20%; 3-year carryforward; reduces Sched A mortgage interest.
- **Coverage**: ✅
- **Implementation locator**: `microservices/personal/MortgageInterestCreditMapper.java`, `entity/PfMortgageInterestCredit.java`, `microservices/output/Form8396OutputMapper.java`, `model/output/Form8396.java`
- **Gap**: Verify Form 8396 line 3 tentative credit reduces Schedule A home-mortgage-interest deduction (cross-form coupling). Form 8828 recapture OOS.
- **Effort**: S

### 25.15 — Residential Energy Credits
- **Coverage**: ✅
- **Implementation locator**: `microservices/personal/EnergyCreditMapper.java`, `entity/PfEnergyCredit.java`, `microservices/output/Form5695ListOutputMapper.java`, `model/output/Form5695.java`, `entity/OutForm5695QualifiedCostItem.java`
- **Gap**: Per-item Table 25-4 sub-caps ($250/door $500 total, $600/window total, $150 audits, $600/item residential energy property) need line-item enforcement.
- **Effort**: S

### 25.16 — Clean Vehicle Credits
- **Coverage**: ⚠️
- **Implementation locator**: `microservices/personal/ElectricVehicleCreditMapper.java`, `microservices/personal/CleanCarCreditMapper.java`, `entity/PfElectricVehicleCredit.java`, `entity/PfCleanCarVehicle.java`, `microservices/output/Form8936ScheduleAListOutputMapper.java`, `model/output/Form8936ScheduleA.java`
- **Gap**: Previously-Owned standalone path with separate MAGI caps + original-owner / 3-year disqualifiers — verify. Form 8936-A (commercial) OOS.
- **Effort**: M

### 25.17 — Repayment of the First-Time Homebuyer Credit
- **Description**: 2008-purchase 15-year repayment; **book notes 2024 = FINAL installment**; accelerated repayment on disposition → Sched 2 line 10.
- **Coverage**: ✅
- **Implementation locator**: `microservices/personal/CarryforwardHomebuyerCreditMapper.java`, `entity/PfCarryforwardHomebuyerCredit.java`, `microservices/output/Form8859OutputMapper.java`, `entity/OutForm8859.java`, `microservices/output/Schedule2OutputMapper.java`
- **Gap**: **2024 was FINAL installment year per book**; 2025 codepath should not collect annual installment — only accelerated-repayment paths remain. Confirm transition.
- **Effort**: S

## Chapter 26 — Tax Withholdings

### 26.1 — Withholdings Should Cover Estimated Tax
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: OOS (payroll-side).
- **Effort**: None

### 26.2 — Income Taxes Withheld on Wages
- **Coverage**: ✅
- **Implementation locator**: `microservices/statement/W2Mapper.java`, `entity/SeW2.java`, `microservices/output/Form1040OutputMapper.java` line 25a, `microservices/W2FieldMapper.java`
- **Gap**: None
- **Effort**: None

### 26.3 — Low Earners May Be Exempt From Withholding
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: OOS.
- **Effort**: None

### 26.4 — Are You Withholding the Right Amount?
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: OOS.
- **Effort**: None

### 26.5 — Voluntary Withholding on Government Payments
- **Coverage**: ✅
- **Implementation locator**: `microservices/personal/SocialSecurityBenefitsMapper.java`, `microservices/statement/Form1099GMapper.java`, `microservices/statement/FormRrb1099Mapper.java`
- **Gap**: ANCSA / CCC-loan withholding fields likely missing on intake — niche.
- **Effort**: S

### 26.6 — When Tips Are Subject to Withholding
- **Coverage**: ✅
- **Implementation locator**: `microservices/personal/TipIncomeMapper.java`, `entity/PfTipIncome.java`, `entity/PfTipEmployer.java`, `microservices/output/Form4137TaxpayerOutputMapper.java`, `microservices/output/Form4137SpouseOutputMapper.java`, `microservices/output/AbstractForm4137OutputMapper.java`, `entity/OutForm4137.java`, `model/output/Form4137.java`
- **Gap**: W-2 box 12 codes A/B → Sched 2 line 13 dispatcher — verify catches both codes.
- **Effort**: S

### 26.7 — Withholding on Gambling Winnings
- **Coverage**: ✅
- **Implementation locator**: `Form1040OutputMapper.java` line 25c (W-2G box 4 + Form 8959 line 24)
- **Gap**: Form 5754 shared-winnings allocation informational.
- **Effort**: None

### 26.8 — FICA Withholdings
- **Coverage**: ✅
- **Implementation locator**: `TaxReturnComputeService.java` excess SS aggregation, `model/output/Schedule3OtherPaymentsCredits.java`, `entity/OutSchedule3.java`
- **Gap**: 2025 wage base $176,100 / max $10,918.20 per project baseline — verify ReferenceData.
- **Effort**: S

### 26.9 — Withholding on Distributions from Retirement Plans and Commercial Annuities
- **Coverage**: ✅
- **Implementation locator**: `microservices/personal/PensionAnnuityIncomeMapper.java`, 1099-R box 4 → line 25b
- **Gap**: None
- **Effort**: None

### 26.10 — Backup Withholding
- **Coverage**: ✅
- **Implementation locator**: `TaxReturnComputeService.java` line 25b aggregation, `microservices/statement/Form1099KMapper.java`, `microservices/statement/ChildInterestDividendsMapper.java`
- **Gap**: Penalties for false W-9 OOS.
- **Effort**: None

## Chapter 27 — Estimated Tax Payments

### 27.1 — Do You Owe an Estimated Tax Penalty for 2024?
- **Coverage**: ⚠️
- **Implementation locator**: `TaxReturnComputeService.java` `computeForm2210` (~lines 20090-20278), `model/output/Form2210.java`, `microservices/output/Form2210OutputMapper.java`, `entity/OutForm2210.java`, `entity/OutForm2210Period.java`, `microservices/personal/RefundAmountOwedMapper.java`, `microservices/personal/PriorYearTaxMapper.java`
- **Gap**: Box A/B/E implemented. **Box C Schedule AI NOT implemented**, **Box D actual-withholding dates NOT implemented**, **Form 2210-F NOT implemented**. Federally-declared-disaster waiver taxpayer-attested. 7%/365-day annual rate confirmed.
- **Effort**: L (Schedule AI alone is XL)

### 27.2 — Planning Estimated Tax Payments for 2025
- **Coverage**: ➖
- **Implementation locator**: N/A
- **Gap**: OOS.
- **Effort**: None

### 27.3 — Dates for Paying Estimated Tax Installments for 2025
- **Coverage**: ⚠️
- **Implementation locator**: `ReferenceData.java`, Form 2210 Part III period boundaries
- **Gap**: Fiscal-year filers not supported; farmer/fisherman single-installment not modeled (blocked by 27.1 Form 2210-F gap).
- **Effort**: M

### 27.4 — Estimates by Married Taxpayers
- **Coverage**: ⚠️
- **Implementation locator**: `microservices/personal/PriorYearTaxMapper.java`, `microservices/personal/RefundAmountOwedMapper.java`, Form 2210 Part I
- **Gap**: Joint-to-separate split proportional-by-separate-equivalent is informational only; user supplies own share. Auto-split needs dual-spouse shadow compute.
- **Effort**: M

### 27.5 — Adjusting Your Payments During the Year
- **Coverage**: ✅
- **Implementation locator**: `TaxReturnComputeService.java` Form 2210 Part III installment carry-over (per line 38 audit: 4-installment regular method with 7%/365-day annual rate)
- **Gap**: None
- **Effort**: None

## Chapter 28 — Additional Medicare Tax and Net Investment Income Tax

### 28.1 — Higher-Income Taxpayers May be Subject to Additional Taxes
- **Coverage**: ✅
- **Implementation locator**: `TaxReturnComputeService.java` `computeForm8959` and `computeForm8960` (~line 21753), `model/output/Form8959.java`, `model/output/Form8960.java`, `microservices/output/Schedule2OutputMapper.java` lines 11/12
- **Gap**: None
- **Effort**: None

### 28.2 — Additional 0.9% Medicare Tax on Earnings
- **Description**: Form 8959: Part I wages, II SE earnings, III RRTA, IV total to Sched 2 line 11, V employer-withheld → line 25c.
- **Coverage**: ⚠️
- **Implementation locator**: `TaxReturnComputeService.java` Form 8959 Parts I/III/IV/V, `microservices/output/Form8959OutputMapper.java`, `entity/OutForm8959.java`, `model/output/Form8959.java`, `Form1040OutputMapper.java` line 25c
- **Gap**: **Part II (SE earnings) is OOS** since Schedule SE is broader OOS. Book Examples 1-2 are SE-heavy; wage-only path correct; mixed wage+SE silently under-computes.
- **Effort**: L (Part II blocked by Schedule SE OOS)

### 28.3 — Additional 3.8% Tax on Net Investment Income
- **Coverage**: ✅
- **Implementation locator**: `TaxReturnComputeService.java` `computeForm8960` (~lines 21753-21800+), `model/output/Form8960.java`, `microservices/output/Schedule2OutputMapper.java` line 12. Overrides via `entity/PfLine16Tax`: `form8960Line3AnnuitiesOverride`, `form8960Line5bNotSubjectToNiit`, `form8960Line5cPartnershipScorpAdjustment`, `form8960Line6CfcPficAdjustments`, `form8960Line7OtherModifications`, `form8960Line9aInvestmentInterestExpense`, `form8960Line9bStateLocalForeignIncomeTax`, `form8960Line9cMiscInvestmentExpenses`, `form8960Line10AdditionalModifications`
- **Gap**: **CLAUDE.md baseline incorrectly says "Form 8960 NIIT NOT IMPLEMENTED — INTENTIONALLY OUT OF SCOPE"**; code shows it IS implemented. Update CLAUDE.md. Estates/trusts NIIT OOS. §121 exclusion-from-NIIT enforced via line 5b override (not auto-derived from Form 8949).
- **Effort**: S (mostly doc correction)

## Chapters 25-28 Summary

**Total scenarios**: 35 (Ch 25 = 17; Ch 26 = 10; Ch 27 = 5; Ch 28 = 3). Coverage: ✅ 25, ⚠️ 6, ❌ 0, ➖ 4.

### Notable findings

1. **CLAUDE.md is WRONG about Form 8960 (NIIT)** — baseline says "NOT IMPLEMENTED — INTENTIONALLY OUT OF SCOPE" but code shows it IS implemented at `TaxReturnComputeService.java:1085` calls `computeForm8960(...)` at ~line 21753 with full override set. CLAUDE.md needs correction.
2. **2025 inflation adjustments need verification across Ch 25 constants** — book uses 2024 numbers throughout. Confirmed 2025 deltas: CTC refundable $1,700 (vs 2024 $1,600); adoption max $17,280 (vs $16,810); saver's AGI ceilings $79,000/$59,250/$39,500 (vs $76,500/$57,375/$38,250); EIC invest-income ceiling $11,950 (vs $11,600); EIC maxes $649/$4,328/$7,152/$8,046; SS wage base $176,100 / max $10,918.20.
3. **2024 was the FINAL year of the 15-year First-Time Homebuyer Credit (2008-purchase) installment schedule** per book §25.17. The 2025 codepath should not collect an annual installment.
4. **Form 2210 Schedule AI (Box C) is the biggest 27.x gap** — XL effort, but used by sole-proprietors / seasonal-income taxpayers who currently overpay penalty. Box D + Form 2210-F round out the three Form 2210 gaps.
5. **Form 8959 Part II (SE earnings) is OOS** because Schedule SE is broader OOS. Wage-only path correct; mixed wage+SE silently under-computes.
6. **Refundable Adoption Credit (Form 8839 Part II) NEW for 2025 OBBBA** is implemented per project baseline (Sched 3 line 13c) but book §25.10 doesn't yet reflect it — code is ahead of book.
7. **Mortgage Interest Credit ↔ Schedule A coupling** — Form 8396 line 3 tentative MCC credit must reduce Sched A home-mortgage-interest deduction; needs explicit test if not present.
8. **Excess SS/RRTA per-SSN cap = $10,918.20 for 2025** (multi-employer only); single-employer over-withholding requires Form 843 from employer, not Sched 3 credit.
9. **Voluntary withholding catch-all** — niche payments (ANCSA, CCC loans) may not be on intake; low priority.
