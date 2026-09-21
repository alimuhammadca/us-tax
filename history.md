


## 2026-09-21 - sc_00389 (§170(b) ↔ §199A ordering): both comments right, all 32 rows reproduce

Both comments are correct and are the same corrections already settled against the printed forms in
sc_00387: Schedule 1 **line 26** (25 is "total other adjustments" and really is 0), and Form 8995
**line 14** for the 20% income limitation (13 is "subtract line 12 from line 11" = 15,761).

★ AND THE SAME DOCUMENT CARRIES TWO MORE OF THE IDENTICAL KIND THAT NEITHER TREE FLAGGED - Form 8995
line 1 is the per-business table (the total is line 2), and line 15 takes the smaller of "line 10 and
line 14", not of "line 5 and line 13". Corrected alongside. This is now the THIRD scenario carrying the
Schedule 1 25/26 mislabel (387, 388, 389) and the SECOND carrying all four Form 8995 ones: a template
error running through this document family rather than independent slips, which is worth naming because
it predicts where to look next rather than re-deriving each time.

EVERY DOLLAR VALUE MATCHES in both trees and in us-tax-be; all 32 rows reproduce.

★ THE ORDERING CONTROL IS THE COUNTERFACTUAL, NOT THE TOTAL. Matching 83,642 proves little by itself -
plenty of wrong methods would land near it. The test asserts what the WRONG base produces: applying the
60% ceiling to AGI-less-QBI (139,403 − 3,152 = 136,251) allows **81,751** and carries over **18,249**,
wrong on both halves. It is also self-referential, since the QBI limit depends on the very charitable
deduction it would be feeding - the ordering is not a convention, it is what makes the system solvable.

★ AND THE ASYMMETRY IS PINNED IN BOTH DIRECTIONS IN ONE TEST: halving the gift leaves AGI - and
therefore the ceiling - untouched at 139,403, while the QBI deduction GROWS because taxable income
before QBI rose. Charity feeds the QBI limit; QBI never re-opens the charitable ceiling.

WHY THE ORDERING IS VISIBLE HERE AT ALL: the tentative QBI component is 20% × 139,403 = 27,881, but the
§199A(a) taxable-income cap cuts it to 3,152 - nearly nine times smaller. In a scenario where the
20%-of-QBI figure governed, the charitable deduction would never enter the QBI computation and the
question would be invisible. Worth remembering when designing a case to test this.

The us-tax-hrb tree confirms it from the outside: it recorded H&R Block's deductions summary showing
"Charitable donations Cash or money 83,642" - exactly 60% of the 139,403 AGI, not of any post-QBI
figure. 32/32.

SEEDING: SALT is PER-COMPONENT (`stateLocalTaxChoice` + `realEstateTaxesPaid` +
`personalPropertyTaxesPaid`), not one combined field. The scenario's undivided "state income +
real-property = 50,000" goes in as real-estate tax; the cap binds at 40,000 either way.

Sc00389SqaScenarioTest 4 tests. Suite 2,455 green.
