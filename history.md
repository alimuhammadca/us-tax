


## 2026-09-21 - sc_00387 (PTC ↔ SEHI circular): four line-number comments right, and the DOC beats the software

★ FOUR LINE-NUMBER COMMENTS, AGAINST THREE DIFFERENT FORMS, ALL CORRECT:
    Schedule 1  doc "line 25 = total adjustments"  → 25 is "Total OTHER adjustments (24a-24z)" = 0;
                                                     26 is "these are your adjustments to income"
    Schedule 3  doc "line 13 = net PTC"            → 9 is "Net premium tax credit"; 13 is a HEADER;
                                                     15 is what feeds Form 1040 line 31
    Form 8995   doc "line 1 = total QBI"           → 1 is the PER-BUSINESS table (1i-1v);
                                                     2 is "Total qualified business income"
    Form 8995   doc "line 13 = 20% income limit"   → 13 is "Subtract line 12 from line 11";
                                                     14 is "Income limitation. Multiply line 13 by 20%"
A fifth follows and the tester did not need to state it: line 15 takes the smaller of line 10 and line
14, not of line 5 and line 13. Values unchanged throughout - only labels.

★ AND ON THE SUBSTANTIVE ROW THE DOCUMENT IS RIGHT AND THE COMMERCIAL SOFTWARE IS ONE ITERATION SHORT.
It reported SEHI 6,555 / MAGI 77,133; the comment called the gap "iterative rounding", which would make
it a wash. It is not:

    exact        S = 0.085 × (83,688 − S) → 1.085 S = 7,113.48 → S = 6,556.20
    iterating    converges to 6,556 / 77,132 whether you ROUND or TRUNCATE at each step
                 (both simulated across every iteration, not argued from one)
    consistency  at 77,132: 0.085 × 77,132 = 6,556.22 → PTC 2,444 → SEHI 6,556  ✓ closes
                 at 77,133: 0.085 × 77,133 = 6,556.31 → PTC 2,444 → SEHI 6,556  ✗ 6,555 does not

★ THE CLEANEST TELL NEEDS NO ALGEBRA AT ALL: the enrolled plan IS the SLCSP, so the deduction and the
credit must together exhaust the premium EXACTLY. 6,556 + 2,444 = 9,000; the software's 6,555 strands a
dollar belonging to neither. That invariant is what the fixed-point test asserts, and it is a far better
oracle than matching a total - it identifies an unconverged iterate on sight.

us-tax-be lands on 6,556 / 2,444 and reproduces all 13 Form 1040 rows plus the 8962 and 8995 rows.

The us-tax-hrb tree is ENTIRELY BLOCKED on this scenario by a harness limit (the 1095-A dollar amounts
never reach the return), so it records no H&R Block behaviour and its rows are not evidence either way.
Only the sqa tree had data here.

★ ONE INTERNAL NOTE, DELIBERATELY NOT FIXED: our model names the FPL getter
`getLine5FederalPovertyLine` and the percentage `getLine6HouseholdIncomeAsPctOfFpl`, but the printed
Form 8962 puts the FPL on **line 4** and the percentage on **line 5**, and RESERVES line 6 for future
use. Each name is one line too high. I checked whether this was a V266 repeat - it is not: the semantic
field map is correct (`line4_federal_poverty_line_amount`,
`line5_household_income_as_percent_of_poverty_line`) and BOTH UI components bridge the misnamed getters
to the right fields explicitly, so the rendered form is correct. A naming hazard, not a live defect;
reported rather than renamed, since a rename touches the entity, model, mapper, a DB column and two UI
components for no change in output.

Sc00387SqaScenarioTest 4 tests. Suite 2,447 green.
