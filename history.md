


## 2026-09-21 - Full e2e regression: 1,590 passed / 4 failed, THREE real fixes and one transient

1,605 tests, --workers=1, 4.5 hours. **1,590 passed / 4 failed / 11 skipped.** Unlike the previous two
runs, most of these were REAL.

★ TWO MISSED EIC PINS FROM THE ROUNDING FIX, both confirmed against the printed 2025 EIC table, and both
showing the engine returning EXACTLY the value derived from it:
    line1i-combat-pay   expected /\$307\.00/, received "$308.00"
    se-interaction:54   expected 336, received 337
The combat-pay spec needed FOUR edits: two assertions, the derived delta ($649 − $307 = $342 → $341), and
two stale comments (one still said $306, older than the 307 it sat beside).

★ WHY THEY ESCAPED THE FIRST SWEEP IS THE LESSON. After the sc_00384 fix I grepped for
`earnedIncomeCredit` model assertions and corrected six pins. That sweep could not see the RENDERED UI
TEXT pins (`toHaveText(/\$307\.00/)`) or the DERIVED DELTA — both are EIC values that never mention the
field name. A value-based change needs sweeping by VALUE as well as by field. Swept both forms now, and
separately verified the one remaining pin in an unrun spec (`toBe(1811)`, 3 children) is genuinely
unaffected — exact 1811.25, where floor and round agree — rather than pre-emptively "fixing" it.

★ AND THE AUTOFILL HANG WAS NOT A RACE, which is where I was heading before reading the call log.
`statement-recipient-ssn-autofill` had been timing out at the full 180s about half the time, and the
obvious story was the known post-person-tab-switch race. The `check()` call log says otherwise: the click
SUCCEEDS, navigations finish, and THEN it hangs. Cause: the checkbox is fully controlled —
`<input [checked]="isSelected(form.id)" (change)="toggle(...)">` inside a `<label class="selection-card">`
— and `toggle()` navigates to the statement form. Playwright's `check()` clicks and then VERIFIES the box
reads checked, so it retried forever against a node the navigation had already re-rendered. It passed
only when the timing happened to favour it, which is why it read as a flake for months rather than a
wrong interaction.

Clicking the CARD instead (the real user path — the label forwards the click) took it from ~50% hard-fail
with 3-minute hangs to **9 of 10 runs clean on first attempt**. The card is also now waited for
explicitly, so a future failure lands named in 20s instead of as a bare "Test timeout exceeded" with
nothing to go on. ★ RESIDUAL, STATED PLAINLY: 1 of those 10 still needed its retry. The dominant cause is
fixed; that remainder is not diagnosed.

THE FOURTH, `line13a-qbi` "SyntaxError: Unexpected end of JSON input", was an empty response body — the
Vite dev server logged `ECONNREFUSED` to the backend inside the run window. Passes on re-run, no change.

Also worth recording: this run took 4.5h against the previous 3.5h, and `medicaid-waiver` alone is now
9.2m. Nothing was done about that.
