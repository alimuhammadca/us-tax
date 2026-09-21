


## 2026-09-21 - sc_00388 (IRA ↔ SS circular): the comments SPLIT, and resisting the reflex was the work

EVERY DOLLAR VALUE MATCHES in both trees and in us-tax-be - 26,124 / 7,560 / 65,564 / 5,876 / 1,124 /
440 / 32,550 / 79,550. Every recorded "failure" is a line-number claim, and they are NOT all of a kind.

ROW 27 IS A REAL DOC ERROR: Schedule 1 line 25 is "Total OTHER adjustments (24a-24z)" and really is 0
here; the total belongs on LINE 26. Identical to sc_00387's mislabel one scenario earlier. Corrected.

★ BUT ROWS 39-43 ARE CORRECT ABOUT H&R BLOCK AND MUST NOT CHANGE THE DOCUMENT. They shift the Social
Security worksheet numbering by one (7→8, 15→16, 16→17, 17→18, 18→19) - and the tester labelled them
"(H&R numbering)", which is precisely what they are. The IRS Social Security Benefits Worksheet (Form
1040 instructions, p.32):
     7  Subtract line 6 from line 5                          → 59,440  provisional income
    14  Enter the smaller of line 2 or line 13               →  4,500
    15  Multiply line 11 by 85% (0.85)                       → 21,624
    16  Add lines 14 and 15                                  → 26,124
    17  Multiply line 1 by 85% (0.85)                        → 34,000
    18  Taxable social security benefits, smaller of 16 or 17 → 26,124 → Form 1040 line 6b
The document uses IRS numbering and is right on every one.

★ THIS IS THE SINGLE HARDEST JUDGEMENT IN THE RUN SO FAR, and it is the sc_00373/374 trap repeating.
FIVE consecutive scenarios (383-387) each contained a genuine line-number error, four of them in
sc_00387 alone. Arriving at a sixth set of renumbering comments, the reflex is to apply them. The tester
had even flagged the qualifier themselves. Reading the printed worksheet took one command and changed
the answer completely: a commercial package's own layout is not a correction to the federal form.

★ THE us-tax-hrb TREE CAUGHT THE TWO-PASS METHOD IN THE ACT. It recorded H&R Block DISPLAYING Social
Security of 32,550 on a pre-adjustment screen before the return settled on 26,124. Two different
taxable-SS figures inside one run is the signature of Pub. 590-A Appendix B - the strongest evidence in
either tree that the circular is solved rather than approximated. Our controls reproduce both states:
the same return with NO IRA contribution yields taxable SS 32,550 and AGI 79,550 exactly, which is the
pass-1 state that fixes the §219(g) phase-out at (89,000 − 79,550)/10,000 × 8,000 = 7,560.

Also pinned: AGE 60 MATTERS TWICE AND ONLY ONE APPLIES. It raises the IRA limit to 8,000 (7,000 + the
age-50 catch-up), which is the base the 94.5% phase-out is applied to; it gives NO additional standard
deduction, which needs 65. Line 12 is the flat 15,750. Conflating them would add 2,000 and move every
figure below it.

SEEDING: the IRA deduction lives on the INCOME-ADJUSTMENTS form as `iraDeductionLine20` - what the filer
CLAIMS - and the engine applies §219(g) to that claim using the pass-1 MAGI and reduces it.
Active-participant status comes from `isCoveredByWorkplaceRetirementPlanTaxpayer` OR W-2 box 13. Seeding
a separate "ira-contributions" form does nothing: taxable SS comes back as the pass-1 32,550 and the
deduction never appears.

Sc00388SqaScenarioTest 4 tests. Suite 2,451 green.
