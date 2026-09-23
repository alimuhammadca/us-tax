


## 2026-09-23 - Full regression: 1,589 passed / 0 failed / 5 flaky - and the FLAKE CLASS finally has a cause

1,605 tests, --workers=1, 3.4h. **1,589 passed / 0 FAILED / 5 flaky / 11 skipped.** No code had changed
since the previous run, so the run itself was expected to be uneventful. The five flaky tests were not.

ALL FIVE FIRST-ATTEMPT ERRORS WERE NETWORK-LEVEL, never an assertion about a tax figure:
    §469 bridge          page.evaluate: TypeError: Failed to fetch
    Form 5405 bridge     page.evaluate: TypeError: Failed to fetch
    Low IRA flow         Test timeout of 120000ms exceeded
    pub974 B2            connect ETIMEDOUT ::1:4200
    Form 8959 Part II    connect ETIMEDOUT ::1:4200
Every one passed on retry. All five also ran 2-10x their normal duration (24.5s, 24.5s, 2.0m, 27.9s,
26.5s against 5-11s baselines), which is what pointed away from logic and toward the transport.

★ AND THE `::1` IN THOSE ERRORS WAS THE CLUE. The two dev servers sit on OPPOSITE SINGLE STACKS:
    backend        127.0.0.1:8080   IPv4 ONLY
    UI dev server  [::1]:4200       IPv6 ONLY
and `proxy.conf.json` targeted `http://localhost:8080`, which resolves **IPv6 first**. So every proxied
/api call attempted ::1:8080, found nothing listening, and fell back to IPv4.

MEASURED, NOT INFERRED:
    connect over 10 calls    localhost:8080    2.126s   (~213ms each)
                             127.0.0.1:8080    0.048s   (~4.8ms each)
a **~45x** difference, entirely the doomed IPv6 attempt. And the previous UI dev log carried **451**
'http proxy error' / 445 ECONNREFUSED entries; the fresh log after the fix carries **zero**. Fixed by
pointing both proxy targets at 127.0.0.1 (requires a dev-server restart - proxy config is read at
startup).

★ HONEST LIMIT: this is not proved to eliminate the flakes. The fresh log is minutes old under light
traffic, and only another full regression will show whether the retry-level failures stop. What IS proved
is the mechanism and that the wasted connect is gone. Recorded that way rather than as a victory.

★ WHY IT TOOK FOUR RUNS TO SEE. The same class had appeared every time - 0919 (ETIMEDOUT ::1:4200 on
GAP-G7), 0921 (Unexpected end of JSON input), 0922b (ETIMEDOUT ::1:4200), and here - and each time I
correctly classified it as "transient network" and moved on, because each time the retry passed and there
was a real defect elsewhere to fix. Classifying a failure correctly is not the same as explaining it. The
address was printed in the error text every single time.
