


## 2026-09-21 - sc_00386 (Form 8978 BBA push-out): comments correct, and the NEGATIVE case was untested

Second scenario running where the comments mostly report an ABSENT FEATURE rather than a disagreement.
Both trees independently found no Form 8978/8986 path in H&R Block 2025 - the us-tax-hrb tree swept
every screen of its run for 8978 / push-out / BBA / partnership adjustment / imputed underpayment /
audit and got ZERO hits. No Expected value changed; the document is correct throughout.

ROW 12'S ROUTING CLAIM IS THE CHECKABLE ONE AND IT IS RIGHT. Printed 2025 Schedule 3:
    6  Other nonrefundable credits:
       l  Amount on Form 8978, line 14. See instructions . . . 6l
    7  Total other nonrefundable credits. Add lines 6a through 6z
    8  Add lines 1 through 4, 5a, 5b, and 7 … Form 1040 line 20

★ AND THE SIGN IS THE EASY THING TO GET WRONG. 6l sits among nonrefundable CREDITS, so a NEGATIVE line
14 - a net DECREASE in tax - is entered there as a POSITIVE credit amount. Our engine does exactly that
(`roundMoney(amt.abs())`). The scenario only exercises the positive case, so a dedicated control now
pins the negative one: line 16 stays untouched at 22,667 while 6l carries **+4,000**, not −4,000.
★ Both wrong routings - sending the negative to line 16, or to 6l still signed negative - produce a
COMPLETE, PLAUSIBLE return that differs only on the tested line. This is the same hazard that has cost
false readings before; the fix is to test the mirror case the scenario omits, not to trust the half that
was supplied.

THE DOC'S REVIEWED-YEAR ARITHMETIC IS CORRECT AND IS DONE AT 2023 RATES, which is the substance of
§6226: the partner does NOT re-open 2023, they recompute what 2023's tax would have been and pay the
DELTA on the current return. At the 2023 Single brackets (10% to 11,000, 12% to 44,725, 22% to 95,375,
24% to 182,100): 120,000 → 22,200 and 170,000 → 34,200, so line 14 = 12,000. Applying 2025 rates to a
2023 adjustment is the natural mistake and gives a different number.

ALL 11 FORM 1040 ROWS REPRODUCE, with AGI as the control: the 50,000 of adjusted 2023 income never
touches 2025 AGI, which stays at 140,000 whether the push-out is present or not, while line 16 moves by
exactly 12,000 and a 2,333 refund becomes 9,667 owed.

★ GATE PINNED: without `hasForm8978Adjustment` the entered line 14 is read by nothing - line 16 returns
the plain regular tax and the return shows NO balance due at all. Complete, plausible, and wrong on the
single line the scenario exists to test. Same parent-gate shape as 962 / ECR / 1291TAX / 965INC, and the
second time in two scenarios that this shape cost a run.

DATA NOTE for the us-tax-hrb tree: rows 11 and 12 carry Actuals of 140,000 and 15,750 - the wages and
the standard deduction, not readings of those rows - while the same rows' notes state that no Form 8978
entry exists. Flagged in both the sheet and that tree's commit; they should be N/A like rows 8-10.

Sc00386SqaScenarioTest 4 tests. Suite 2,443 green.
