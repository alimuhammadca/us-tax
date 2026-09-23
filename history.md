


## 2026-09-22 - Full regression after the 1098-e rename: 1,592 passed / 1 failed / 1 flaky

1,605 tests, --workers=1, 3.3h. **1,592 passed / 1 failed / 1 flaky / 11 skipped.** Run specifically to
exercise the `1099-e` -> `1098-e` statement-id rename, which touched statement routing, the shell's form
dispatch and both income-adjustments components.

★ THE RENAME CAME THROUGH CLEAN, and that is what this run was for. 27+ statement-picker /
income-adjustments specs passed, and NEITHER failure references `1098-e` or `1099-e` (checked, not
assumed). The failure mode that would have mattered - a missed call site yielding a silently EMPTY
statement list rather than a loud error - did not appear.

THE TWO FAILURES, from the JSON reporter:
  line16-tax:412 (1291TAX)  `apiRequestContext.put: connect ETIMEDOUT ::1:4200` - a network timeout to
        the UI proxy on a PUT of address-taxpayer. Marked flaky (passed on its retry) and passes on
        re-run. Transient.
  line1h:135 (PSO)          attempt 0: Save button `Expected: enabled / Received: disabled`
                            attempt 1: `Unable to create 1099-r statement entry via API`
        TWO DIFFERENT ERROR MODES across the two attempts, which is itself the evidence: a deterministic
        defect does not change its symptom. Neither is an assertion about a tax figure.

★ AND I COULD NOT REPRODUCE THE PSO ONE TO DIAGNOSIS, so I did not patch it. In isolation: 4 of 4 clean
at ~10.5s with --retries=0, plus 2 more clean and 1 flaky in an earlier batch - roughly 1-in-4 under
load, 0-in-6 alone. The flakiness only manifests under full-suite contention. Contrast the autofill hang
last run, where the call log named the cause precisely and a real fix followed; here there is nothing to
read. Recorded as an open flake rather than papered over with a speculative wait.

The PSO compute path has not changed this session - the most recent commit touching it long predates
today - so nothing in the 1098-e work or the EIC rounding fix is implicated.

Run time 3.3h, the fastest of the four full regressions this week (4.5h, 3.4h, 3.3h).
