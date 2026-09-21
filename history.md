


## 2026-09-21 - sc_00384: the comment is right, and it exposed a REAL EIC ROUNDING BUG

ROW 18 IS CORRECT - the doc used the 2024 phaseout start of $22,720 with the 2025 maximum credit, the
SAME mix of tax years as sc_00383 one scenario earlier. Printed 2025 EIC table (Form 1040 instructions
p.55): "42,000 42,050 | 0 **1,344** 3,219 4,113". Rows 19/20 follow: 3,344 and 2,109. Both trees 25/25.

★ AND VALIDATING IT EXPOSED A REAL ENGINE BUG THAT NO SCENARIO HAD CAUGHT. `eicTableLookup` FLOORED the
credit where the IRS table ROUNDS. Measured against every $50 bracket of the printed 2025 table, one
qualifying child, single/HOH:

    FLOOR    disagrees with the printed table in 250 of 541 phaseout brackets, and in ALL 15 phase-in
    HALF_UP  disagrees in ZERO

The phaseout rate ends in 8, so at the bracket midpoint the exact value carries a .5 fraction about half
the time and truncation discards it. ★ THE DIRECTION MATTERS: the EIC is REFUNDABLE, so flooring
UNDERSTATED refunds - the error always ran against the filer, on roughly half of all EIC returns.

★ sc_00383 PASSED ONLY BY LUCK, one scenario earlier. Its 1,663.335 floors and rounds to the same 1,663;
this scenario's 1,343.735 is what separated them. One agreeing data point is not a verified rounding
rule - which is exactly why this fix was measured across 541 brackets rather than the one that failed.

★ SIX PINNED TESTS WERE CARRYING THE WRONG VALUE - two unit, four e2e - each pinned to our own floored
output rather than to the table. One spelled the bug out in its own comment: "floor(4025 x 0.0765) =
$307". Every one was RE-DERIVED from the printed table before being changed (308, 308, 308, 389, 4,089,
4,089), never bumped to match the new engine. An expected value that came from the engine is not an
oracle, and six of them agreeing with each other proved nothing.

ALSO VERIFIED RATHER THAN ASSUMED: the doc's 21% dependent-care rate is CORRECT. After two consecutive
scenarios whose docs carried rounding errors it looked like a third, but Form 2441's printed table opens
with **$0-15,000 -> .35**, which shifts every band relative to the "35% less 1% per $2,000 over $15,000"
description: 39,000-41,000 -> .22, 41,000-43,000 -> .21, 43,000+ -> .20. AGI 42,000 lands in the .21
band, so 21% x $3,000 = $630 stands. Pattern-matching the previous two findings would have produced a
false one here.

★ AND THE §152(e) SPLIT NEEDS NO FORM 8332 MACHINERY. Form 2441's qualifying-person list and the EIC's
qualifying-child list are each held SEPARATELY from the household dependent list, so "released on Form
8332" is expressed by not claiming the dependency while still listing the child on those two forms. The
four benefits - dependency/CTC to the father, HOH + EIC + dependent-care to the mother - divide
themselves out of the existing data model. The custodial test asserts she has NO dependent at all and
still holds three of the four.

Sc00384SqaScenarioTest 4 tests (both legs). Suite 2,435 green; 38 line27a e2e green.
