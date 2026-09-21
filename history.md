


## 2026-09-21 - sc_00383 (qualifying-child tiebreaker): the comment is right; the doc mixed tax YEARS

ROW 18 IS CORRECT, and it catches an error of a kind this scenario's own arithmetic can never expose.
The doc computes the EIC with a phaseout beginning at **$22,720 - the 2024 figure** - while using the
**2025** maximum credit of $4,328. Mixing the years yields 1,563 where 2025 yields 1,663.

★ THE DOC IS INTERNALLY CONSISTENT WITH ITS OWN WRONG NUMBER, which is why nothing flagged it: it even
derives a matching completed-phaseout point ("~$49,804" = 22,720 + 4,328/0.1598). A self-consistent
document is not a correct one, and cross-checking the derived figure would not have helped - only the
primary source does.

THE 2025 FORM 1040 INSTRUCTIONS SETTLE EVERY ELEMENT:
    pp.46, 48    phaseout begins $23,350 ($30,470 MFJ) for 1+ qualifying children
    pp.40/42/47  completed at    $50,434 ($57,554 MFJ) for 1 qualifying child
    p.52 table   23,300-23,350 -> 4,328 (still the maximum); 23,350-23,400 -> 4,324
    p.55 table   40,000-40,050 -> 1,663   <- this scenario's EXACT bracket, no interpolation
Neither 22,720 nor "~49,804" appears anywhere in the 2025 instructions. The 2024 pair was 22,720 /
49,084; the 2025 pair is 23,350 / 50,434.

OUR ENGINE WAS ALREADY RIGHT (23,350 / 4,328 / 0.1598), so us-tax-be, the printed IRS table and the
commercial software all agree at 1,663 and only the document was wrong. Rows 20/21 follow arithmetically
(1,000 + 1,663 + 562 = 3,225). Both trees now 14/14.

★ WHICH NUMBER IS AUTHORITATIVE MATTERS HERE. The EIC is **read from a table** in $50 brackets, not
computed from a formula. The formula at the bracket midpoint (4,328 - 0.1598 x (40,025 - 23,350) =
1,663.33) agrees with the printed 1,663, but the TABLE governs - so the control pins the table's own
bracket boundaries (4,328 at 23,300, 4,324 at 23,350) rather than the formula's output. A 22,720
threshold would have started the decline $630 earlier, which is exactly where the doc's 1,563 came from.

★ AND THE TIEBREAKER IS NOT A CLOSE CALL, though the scenario is built to look like one. §152(c)(4)(C)
is not an AGI contest that the grandmother's $60,000 wins: when a parent CAN claim the child and does,
the non-parent is barred OUTRIGHT. The AGI comparison only opens if NO parent claims the child, and then
the non-parent needs an AGI above the highest parental AGI. Her higher AGI is a decoy, and nothing about
her enters the return - she is not a dependent, not a modelled household member, not a competing claimant
the engine weighs. The credits are the mother's by right.

Sc00383SqaScenarioTest 3 tests. Suite 2,431 green.
