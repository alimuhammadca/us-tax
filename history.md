


## 2026-09-21 - V266: Schedule 1-A Part V printed into the WRONG BOXES from line 35 down

FIVE BOXES WERE WRONG on every senior's Schedule 1-A. For sc_00380's 67-year-old with $150,000 of MAGI
the form printed **6,000 in box 35** (the form requires 1,500), a bare **"1" in box 36a**, the deduction
in the **SPOUSE's box 36b**, line 38's total in **box 37**, and left **box 38 blank**.

★ NO TAX IMPACT, WHICH IS WHY NOTHING CAUGHT IT. Line 37 and Form 1040 line 13b were always computed
from the correct per-person figure. Only the persisted intermediate and what the form PRINTS were wrong -
so 1,590 green e2e tests, 2,428 green unit tests and a fully-correct refund all sailed past it. A suite
that asserts VALUES cannot see a form that puts the right value in the wrong box.

TWO INDEPENDENT CAUSES, and each alone would have been enough:

  1. THE VALUE. Line 35 is "Subtract line 34 from $6,000" - the per-person amount AFTER the 6%
     reduction. We persisted the UNREDUCED 6,000, while the correct figure sat in a local
     (perPersonAfterPhaseout) and was thrown away. V266 renames the column WITH the value rather than
     quietly repointing it: leaving it called "base" while changing its contents would rebuild the same
     trap for the next reader.

  2. THE MAP. `scripts/schedule-mappings/f1040s1a.json` is HAND-CURATED and was shifted by one from
     f2_20 onward, inventing a `line36_qualifying_senior_count` field the form does not have. I checked
     all 54 fields geometrically against the AcroForm rects before touching anything: Parts I-IV are
     correct, only these four were wrong. 36a/36b are AMOUNTS - each eligible person enters the FULL
     line 35 figure, because the phaseout applies per person rather than being split - and line 37 adds
     them.

★ THE SQA COMMENT IS WHAT FOUND IT. sc_00380 row 8 said "the $6,000 base appears only in the text of
line 35, not as a printed value", and graded it N/A. Validating that claim meant asking where OUR $6,000
goes - and the answer was "into box 35". A model that stores a number the form never prints has nowhere
legitimate to render it, and that is precisely how it reached the wrong box. The tester was answering a
grading row; the row was unanswerable for a real reason, and the reason was our bug.

VERIFIED BY MEASUREMENT, NOT INFERENCE: drove the scenario through the real REST API after a FULL
RESTART (a column RENAME needs one - hot reload will not apply it) → line35=1500, line37=1500,
line38=1500, taxpayerSeniorEligible=true, spouseSeniorEligible=false, so 36a takes 1,500 and 36b stays
blank. ★ An existing MFJ unit test that pinned the old 6,000 now pins **4,200** with line 37 UNCHANGED
at **8,400** - the cleanest possible proof that the tax never moved.

SCOPE: us-tax-be (compute + entity + model + mapper + V266 + curated map), us-tax/pdfs (regenerated CSV
+ semantic PDF), us-tax-ui (elements.json + published map + component), us-tax-return-forms (assets
only - it renders Part TOTALS, so the re-key alone lands its two writes in boxes 37 and 38). Announced
and signed off before changing a verified preview, per the visual-change protocol.
