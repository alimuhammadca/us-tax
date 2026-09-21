


## 2026-09-21 - sc_00385 (Form 8621 PFIC §1291): comments correct, and NOTHING needed correcting

★ THE FIRST SCENARIO IN THIS RUN WHERE THE DOCUMENT NEEDED NO CHANGE AT ALL. Five consecutive scenarios
(377, 378, 380, 383, 384) each carried a doc error; this one does not, and saying so plainly matters as
much as finding the others. No Expected value moved.

The comments here are a DIFFERENT KIND: almost every one reports an ABSENT FEATURE in the commercial
software rather than a disagreement about the rule. Both trees independently found that **H&R Block 2025
does not ship Form 8621 at all** - the us-tax-hrb tree checked the product on disk and recorded it
missing from formAvail.xml's 165 forms, with zero hits for 8621/PFIC/1291 in its search topics. A row
that cannot be entered is not a computation we disagree about, and "N/A" is the right entry for it.

★ THE ONE PRECISELY CHECKABLE ROUTING CLAIM IS ROW 14, AND IT IS RIGHT. Printed 2025 Schedule 2:
    17o  …
      p  Any interest from Form 8621, line 16f, relating to distributions from, and …
      q  Any interest from Form 8621, line 24
So the §1291(c) interest belongs on **17p** exactly as recorded. ★ Note 17**q** is a DIFFERENT charge -
Form 8621 line 24, the §1294 deferred-tax election - which is why they are separate lines. Reaching for
"the 8621 interest line" as though there were one would have picked the wrong one.

ALL 13 FORM 1040 ROWS REPRODUCE, with three controls that isolate the REGIME rather than just matching
totals:
  * the 30,000 prior-year allocation NEVER enters AGI - switch the deferred tax off and AGI is identical
    at 160,000. That separation is the whole of §1291(a)(1)(C).
  * line 16 moves by exactly 37% × 30,000 = 11,100 between those two runs
  * the interest is an OTHER TAX - removing it leaves line 16 UNCHANGED at 38,567 and moves only line 24
    and the balance due (10,343 → 8,567)

WHERE THE TREES DIVERGE IT IS SEEDING, NOT SUBSTANCE. The SQA run never entered the 10,000 current-year
slice, so its lines 8/9/11/15/16 all shifted (5 of 12 comparable rows); us-tax-hrb entered that slice as
1099-MISC box 3 and matched 11 of 12. The hrb reading exercises the scenario, and its implied regular
tax of 27,467 on the resulting 144,250 confirms the doc's figure independently of us.

SCOPE, STATED PLAINLY: the line spec's contract is `Form1040.line16 += Form8621.PartV.line16e`, so Part
V's allocation arithmetic is the filer's own Form 8621 work, prepared once per PFIC. Our engine goes one
step beyond pure intake - given the prior-year allocation it applies the flat 37% itself, accurate for
any holding period inside the 2018+ top-rate era - while the §6621 interest stays user-entered because
it is daily-compounded at rates that change quarterly. The doc agrees: it labels its own 1,776
"illustrative" and says the exact figure will differ.

★ SEEDING GATE: the entire §1291 branch sits behind a parent flag, `hasForm8621PficTax`. Without it the
allocation is read by nothing and line 16 returns the plain regular tax with NO flag to say why - the
same shape as the other line-16 box-3 write-ins (962, ECR, 8978, 965INC). Cost one run to find.

Sc00385SqaScenarioTest 4 tests. Suite 2,439 green.
