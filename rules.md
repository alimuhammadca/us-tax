


**★ Schedule 2 has TWO Form 8621 interest lines and they are different charges.** Line **17p** is "Any interest from Form 8621, line **16f**" — the §1291(c) charge on an excess distribution; line **17q** is "Any interest from Form 8621, line **24**" — the §1294 deferred-tax election. Both reach Form 1040 line 23 through the Part II total, but they are not interchangeable, so resolve "the 8621 interest" to a line number against the printed form before routing it. Our field is `schedule2Line17pForm8621Line16fInterest`.

**★ The §1291 prior-year allocation is a TAX, never income — and the control is AGI.** The slices allocated to prior PFIC years leave current gross income entirely (§1291(a)(1)(C)) and are taxed at each of those years' top rate on line 16 as "1291TAX"; only the current-year slice is ordinary income (Schedule 1 → line 8). The test that proves you have this right is not the total — it is switching the deferred tax off and showing **AGI does not move**. Pins: `Sc00385SqaScenarioTest`.

**★ `hasForm8621PficTax` gates the whole §1291 branch.** Seed the allocation without it and line 16 comes back as the plain regular tax with no flag to say why — the same parent-gate shape as the other line-16 box-3 write-ins (962, ECR, 8978, 965INC). [[feedback_child_list_gated_by_parent_boolean]]

**★ "The software has no such form" is a valid QA finding, not a failed row.** Form 8621 is genuinely not shipped in H&R Block 2025 (absent from `formAvail.xml`, no PFIC/1291 search topics), so eight rows of sc_00385 are unenterable and "N/A" is the correct entry. Don't chase an absent feature as though it were a disagreement about the rule, and don't let the resulting FAIL count read as a defect on either side.
