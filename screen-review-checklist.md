# Screen Review Checklist

The changes we make to a screen in the owner's screen-by-screen review, so the next screen gets the same treatment.
Apply every item to the screen **and** to each of its tabs (Family Head, spouse, dependent - one component often serves
more than one tab). The list grows as we learn: add a new item when a review produces a new kind of change, with the
screen it came from.

Started 2026-11-03. Related rules: `rules.md` ("No hard-coded tax year", "No formatting characters in the database").

---

## 1. Subtitle

- [ ] Plain words: say what the screen asks and why it matters to the user. No YAML, no internal names.
- [ ] No Form 1040 line numbers or other return mechanics ("help fill in lines 1a, 1b and 1g") - those go in the help.
- [ ] Worded for the tab: "you" / "your spouse" / the dependent's name.
- [ ] Year from `tax-year.ts`, not typed.

*From: Digital assets, Presidential election campaign, Employment.*

## 2. Help (the info icons)

- [ ] Rewritten from the IRS source, IRS rule first: `C:\us-tax\docs\books` (TY2025 editions `<name>--2025`), the form
      instructions, the publication (e.g. Pub. 926), or the 2025 prior edition from `irs.gov/pub/irs-prior/`. Never
      general web text.
- [ ] Sources listed in a comment at the top of the help file.
- [ ] Help lives in one shared file `src/app/data/<screen>-help.ts`, used by every tab's component - not a copy per
      component.
- [ ] Worded for the tab: "you" / "your spouse" / the dependent by name (e.g. `employmentHelpForDependent(name)`), plus
      any rule specific to that person (a dependent's wages go on the dependent's own return).
- [ ] Every question has a help icon; add one where it is missing (e.g. the chapter 11 question).
- [ ] Check the old text for wrong claims and fix them (e.g. "Schedule H rules" was really Pub. 926; inmate wages go
      to Schedule 1 line 8u, not line 1a; a frozen deposit is one held by a bankrupt or insolvent institution, not any
      court-frozen account; a section 1278(b) choice covers bonds acquired that year and later, not "once in a lifetime";
      a "this application does NOT compute" note about a tax the return does compute (Dividend income, Form 8960); a
      penalty amount from an older year ($310, not the 2025 $340); a rule stated backwards (surrogate foreign corporation); codes the IRS never gave as examples ("ABLE",
      "PYAB" for line 4c); threats the instructions don't make (a CP2000 notice and a 10% penalty for a rollover statement).
- [ ] Long help must scroll inside the modal (shared help-modal already does: max-height 90vh).
- [ ] Explanations go behind the help icon, not on the screen. An on-screen note is only for something the user must act on
      or should know about their own answers: a warning, a pointer with a link to the screen where something is entered, a
      note saying an answer was filled in. A paragraph explaining a rule under a question ("The Section 962 election is now
      supported. Enter your CFC inclusions ... consult a tax professional") is help: move it into the question's help and
      leave at most one line with the link (owner 2026-11-06, Other incomes).
- [ ] A note that names another screen uses the sidebar name and links to it (it said "Line 16 tax form"; the screen is
      Other tax items).

*From: Digital assets, Presidential election, Third party designee, Prior-year carryovers, Employment.*

## 3. Tax year

- [ ] No typed year in labels, help, hints or dates: `TAX_YEAR`, `PRIOR_TAX_YEAR`, `FILING_YEAR` from
      `src/app/tax-year.ts` (in templates expose a field, e.g. `readonly currentTaxYear = TAX_YEAR`).
- [ ] Dates derived from the year are computed (e.g. designee authorization ends April 15, `TAX_YEAR + 2`).
- [ ] Don't rely on reference data that can be null for a label (`taxYear` from `/api/reference-data`).
- [ ] Keep literal: saved field names, IRS form revision labels, comments.

*From: Identification, Digital assets, Third party designee, Employment.*

## 4. Number inputs (SSN, ITIN, PIN, ZIP, phone, dates)

- [ ] Digits only, formatted as typed: `appDigitFormat` (ssn | pin | designeePin | zip | phone, `[phoneInternational]`);
      dates use `<app-date-input>`.
- [ ] Same rules as Identification / Address for the same kind of field.
- [ ] Validation with a clear message (`utils/id-validation.ts`); a malformed value blocks the save with the field
      message.
- [ ] Digits only in the model and the database - no dashes, parentheses or spaces. Backend `InputNormalizer` strips
      them for the form id; output formats them (e.g. `InputNormalizer.formatPhone`).
- [ ] PINs masked with a show/hide eye (see item 14).

*From: Identification, Address, Third party designee.*

## 5. Form names

- [ ] Never a bare form number ("1099", "4852", "Schedule C") in user text - notes, labels, section titles, help,
      status messages, link text.
- [ ] First mention in each note / help popup gives the IRS title; later mentions in the same note may be short.
      Examples: Form W-2 (Wage and Tax Statement); Form W-2c (Corrected Wage and Tax Statement); Form 1099-NEC
      (Nonemployee Compensation); Form 1099-MISC (Miscellaneous Information); Form 4852 (Substitute for Form W-2);
      Form 8919 (Uncollected Social Security and Medicare Tax on Wages); Schedule C (Profit or Loss From Business);
      Form 1040 (U.S. Individual Income Tax Return); Schedule 1 (Additional Income and Adjustments to Income);
      Form 1040-X (Amended U.S. Individual Income Tax Return); Form SS-8 (Determination of Worker Status);
      Pub. 926 (Household Employer's Tax Guide).
- [ ] Use the sidebar's real screen names ("Uncollected Social Security", not "Uncollected wages").

*From: Employment.*

## 6. Links in notes

- [ ] A note that names another form links to it with `<form-link>` (`components/form-link.component.ts`) instead of
      "open X under the Y section of the sidebar".
- [ ] Person-aware target: the component's `linkTo(base)` returns the tab's own copy (`-taxpayer`, `-spouse`,
      `-dependent`), or `null` where that person has no such form - the name then shows in bold without a link.
- [ ] `[beforeOpen]="saveForLink"`: partial save of the screen (no validation) before leaving.
- [ ] Statement targets (`w-2`, ...) are selected if needed; `[entryId]` opens a specific entry (the W-2 to correct).
- [ ] The opened screen shows "Back to <screen>" (`returnLabel`).
- [ ] A list or summary that shows amounts taken from statements (e.g. "Form W-2, Acme Analytics Inc, Box 10: $1,500")
      links each row to that statement entry: `<form-link formId="w-2" [entryId]="row.entryId">`, so the user can open and
      check or correct the exact Form W-2 the amount came from. Keep the entry id when building the rows.
- [ ] A screen that lists or reads statements shows only the statements of the person whose screen it is (their SSN on
      the statement: Family Head, spouse or dependent). A statement without an SSN is listed nowhere; every statement
      screen saves it but shows an error dialog asking for the SSN (`StatementDataService.saveEntry` +
      `utils/statement-recipient.ts` STATEMENT_PERSON_TIN; not Form 1042-S, whose U.S. TIN is "if any"). Owner 2026-11-05.
- [ ] A statement with no SSN is matched by the name on it when it fits exactly one household person
      (`utils/person-name-match.ts`, backend `PersonNameMatch`), and the screen says "matched by name".
- [ ] Use the shared test, not a copy: `utils/statement-owner.ts` (`loadHouseholdPeople`, `statementOwnedBy`: SSN first,
      then the name). A comment that says a screen filters by SSN is not the filter - check the code (Interest income
      listed every person's Forms 1099 under a comment claiming a spouse-TIN filter).

*From: Employment (Form 4852, Business income, Uncollected Social Security, W-2); Child and dependent care (box 10 rows,
owner 2026-11-04).*

## 7. Wording and grammar per tab

- [ ] Each tab reads correctly: "Was your spouse", not "Were your spouse"; the dependent's name, not "you".
- [ ] Remove leftover tags or internal markers shown to users (e.g. "NOW SUPPORTED").
- [ ] No template code shown as text: in an inline template (inside backticks) an apostrophe in a quoted string needs
      `\\'` (e.g. `'your spouse\\'s'`), because `\'` reaches Angular as a bare `'` and the whole `{{ ... }}` prints
      as text. Look at every message that only shows for another person (spouse, dependent) - that is where it hides.
- [ ] Build "Were you" / "Was your spouse" from who the screen is about, not by patching a sentence: `.replace('Was you', 'Were you')` also
      turns "Was your spouse" into "Were your spouse" (HSA). The spouse e2e asserting the spouse's question caught it.
- [ ] A component shared by two tabs (Family Head and dependent): search its whole template for "you" / "your", not
      only the questions - picker warnings, hints, notes and caps warnings are easy to miss (Medicaid waiver second pass).

*From: Prior-year carryovers, Employment.*

## 8. Placement and per-person copies

- [ ] Is the screen in the right section and step of the workflow (e.g. Prior-year carryovers moved to Get started)?
- [ ] Does each spouse need their own copy (form ids `<base>-taxpayer` / `<base>-spouse`)? Household-only forms stay
      single.
- [ ] Layout matches the section's other screens (`form-card`, shared `<form-actions>` Prev / Save / Next bar).
- [ ] Title as on the other screens: `<h3>Screen name (person)</h3>` (`ownerNames.taxpayerLabel()` / `spouseLabel()`, or the
      dependent's name), then the statement badges ("Forms W-2 (Wage and Tax Statement) on file: 2"). No "Tax Year 2025"
      tag (the year is in the top bar and footer) and no "Form 8839" tag (the form is named in the subtitle or help).
- [ ] Gaps found but deferred go in `outstanding.md` (e.g. MFS spouse Last year 1040).

*From: Prior-year carryovers; Adoption expenses (title tags, owner 2026-11-04).*

## 9. Tax scenarios

- [ ] Each form on the screen that the calculation reads is linked to a matching scenario in `data/tax-scenarios.ts`;
      add a new scenario only with the owner's approval.

*From: Incomes forms audit (Other earned income, SE tax options, Form 8824, Form 4684, Lump-sum, dependent forms).*

## 10. Statement screens (W-2, 1099, ...) - different rule

- [ ] "Values yes, structure no": any visual or structural change needs the owner's confirmation.
- [ ] Compare the boxes against the IRS 2025 (or earlier) edition of the recipient copy (Copy B) - boxes only, not
      spacing; ignore 2026 editions.
- [ ] Labels must not be clipped (e.g. 1099-OID box 12 / 13); box numbering as on the form (1095-A lines 21-33).

*From: statement box audit (1095-A, 1099-OID, 1099-Q).*

## 11. Tests and records

- [ ] An e2e spec per reviewed screen covering each tab: subtitle text, key IRS phrases in the help, the year, links
      open the right copy and come back, values saved digits-only.
- [ ] Update existing specs that assert the old wording; run the related e2e (`--workers=1`, fresh `--output`).
- [ ] Before trusting an e2e run, check the UI dev build after the LAST edit is clean (no `X [ERROR]` after the last
      "Changes detected"): with a template error the dev server keeps serving the previous bundle, so the run passes on
      old code (Pension withdrawals: a broken heading passed 60 tests).
- [ ] A clean build is not proof either: the watcher can miss a file (a data file edited by a script was never rebuilt,
      and a later rebuild still served the old module). Compare the edited file's time with the last "Application bundle
      generation complete", and grep the served code for one new string (curl `localhost:4200/`, its `.js` files and the
      `chunk-*.js` they name); if it isn't there, restart `npm start` (Social security benefits: 4 tests failed on old help).
- [ ] A template list must not come from a getter that builds new arrays or objects on every call (`get questions() { return
      [...] }`): `*ngFor` then destroys and recreates every field on each check, the page never settles and every UI test
      times out with "Target page ... has been closed" and an empty result folder. Build the list once and keep it
      (Capital gain/loss, 2026-11-06).
- [ ] After a backend edit, wait for `/q/health/ready` before starting the run: a hot reload in the middle of a run fails
      its requests and looks like a flaky test.
- [ ] A rule the screen shows (a "Disqualifies" banner, an eligibility verdict) must be the calculation's rule: the screen said either of
      Form 4972 lines 3 and 4 disqualified, the calculation (and the form) said only both - every beneficiary saw "not eligible". Test
      the verdict in the e2e with one No and with both (Lump-sum distributions).
- [ ] Every key the calculation reads from the screen's form is either asked on the screen or sent back as loaded: a mapper that rebuilds
      every column from the payload erases a key the screen doesn't send (Other tax items erased Form 8978, section 965(i) and line 2b on
      every save). Compare the mapper's columns with the screen's payload.
- [ ] An amount another screen figures is not typed here too: typed and figured amounts were added (Form 8611, 8828) or the typed one
      replaced the figured one for both spouses (HSA / MSA). Link to the screen that figures it instead (Other tax items).
- [ ] A question the screen asks must be saved. An answer kept only in the component (a wizard's routing answer) comes
      back blank on reopening; it needs a column (field addition: owner's sign-off).
- [ ] A "no such word" check uses a whole-word pattern: `not.toContainText(' you ')` trims the text to "you", which then matches "your
      spouse" (Business casualties and thefts). Write `not.toContainText(/\byou\b/)`. A file path in a spec is a Windows path
      (`C:/Users/...`): a Git Bash path (`/c/Users/...`) makes Node write under `C:\c\`.
- [ ] A per-item limit on the form is applied per item, not to the total: Schedule H line 1 takes "only the first $176,100 of that
      employee's cash wages" - the calculation added every employee's full wages (Household employees). Read each line's instruction
      for "each", "per" and "that employee's".
- [ ] A question whose answer the IRS publishes (is this a credit reduction state?) is worked out from what the user already picked (the
      state), not asked - and the figure it changes is computed, not left as an "understated" message (Household employees).
- [ ] A screen that explains what the calculation will do with an entry (a note under each employee) uses the same rules as the
      calculation, in a unit-tested helper (Household employees: `employeeTaxes`).
- [ ] A screen for a return built elsewhere (the child's own return, an MFS leg) must have its answers actually reach that return: the
      dependent_own return built its own Form 8615 copy and read only the support answer from Kiddie income - the gate, filing status
      and five typed amounts did nothing. Trace each key from the save to the compute of the return it is meant for.
- [ ] "Earned income" means what the IRS worksheet says, not line 1z alone: Form 8615 counts Schedule 1 lines 3 and 6 (business and
      farm profit) too (Kiddie income).
- [ ] A statement figure is shown, not copied into the box: a box filled from statements and saved becomes a typed amount that overrides the
      statements forever (Child's int. & dividends). Show the total as the placeholder or a note; save only what the user typed.
- [ ] A screen on a person's tab is about that person: a household list of every child on each dependent's tab, with names and SSNs typed
      again, becomes the one child's question with the identity from the dependent record (Child's int. & dividends).
- [ ] An answer about a fact another screen owns (a date of birth) must not override that screen: the typed "born before January 2, 1961"
      replaced the date of birth on Identification for the senior deduction (Additional deductions). Read the fact; show where it came from.
- [ ] A figure one screen works out must reach every calculation that uses it, not only the one the screen was built for: the Puerto Rico
      exclusion from the territory screen reached no MAGI, while a box typed elsewhere did (Additional deductions). Grep every reader of
      the old key.
- [ ] A date is entered with the shared date control and saved as YYYY-MM-DD - never a text box with an "MM/DD/YYYY" hint: the calculation
      parses YYYY-MM-DD, so typed dates silently switched off every rule that reads them (Noncash charity: property held a year or less was
      never moved to cost and every bargain sale was short-term). Read the old typed values as dates on load (UI and mapper).
- [ ] A list that only reports what another screen deducts (Form 8283 vs the Standard or itemized deductions amounts) shows those amounts with a link
      and is checked against them in the compute - leaving out what the list itself adds to the deduction (a bargain sale's part given),
      or the check fires on a correct return (Noncash charity).
- [ ] A household list on a separate return: each spouse's return keeps that spouse's own entries and half of the joint ones ("Given by",
      MfsFormScoper) - otherwise the spouse's return reports the Family Head's (Noncash charity).
- [ ] A form with an eligibility part ("Stop here. Do not file this form") has every stop question asked or worked out from the return,
      and the calculation leaves the form out with a note when the answers say not to file it - Form 8379 was produced for a spouse legally
      obligated for the debt (Injured spouse).
- [ ] A figure taken from the return for another form uses the exact lines its instructions name: Form 8379 line 13a is the Forms W-2 income
      (line 1a), not line 1z, and line 18 includes Schedule 2 line 1z (Injured spouse).
- [ ] A screen that splits figures of the return shows the figure being split (the last computed amount) and the other part beside each
      box, and warns when the part typed is more than the whole (Injured spouse).
- [ ] A field map's semantic names are a claim: check each box name against the printed form before writing values into it - Form 8938's
      line 22 names had "jointly owned" on the "opened" box (Foreign assets). Render the page and compare positions.
- [ ] A form with a part per item (Form 8938 Part V / VI, one account and one asset per page 2) fills the first on the form and the rest as
      additional pages (`copies`), with the form's "additional statements" box and count (Foreign assets).
- [ ] A form filed "for each" item (each building, each property) is a list on the screen with one form per item - a single set of
      answers can't report two buildings (Low-income housing credit recapture). Keep the old single save readable as item 1.
- [ ] The form's own skip rules decide which lines are asked: "Skip lines 1-7 and go to line 8" if passed through on a K-1; "Only section
      42(j)(5) partnerships need to complete lines 16 and 17" - ask the routing question and leave the skipped lines blank on the form, not
      zero (Low-income housing credit recapture).
- [ ] A date on the form split into month / day / year boxes gets each part in its own box - the whole date in the month box is a wrong
      form (Mortgage subsidy recapture). Look at every date box on the preview.
- [ ] A "Do not complete this form" note on the form (a loan closed before 1991) is a rule: the screen says so and the calculation leaves
      the form out (Mortgage subsidy recapture).
- [ ] A figure filled from the return must be one the return has worked out at the point the calculation needs it; one worked out later
      that depends on this calculation (the QBI deduction for the business interest limit) stays typed, and the screen says why (Business
      interest limit).
- [ ] Unit tests for new helpers (e.g. `id-validation.spec.ts`, `scenario-completeness.spec.ts`).
- [ ] Entry in `history.md`; commit and push us-tax-ui, us-tax-be (e2e / backend) and us-tax (docs).

## 12. SSN, ITIN and EIN: formatting is not part of the value

- [ ] Dashes and spaces in an SSN, ITIN or EIN are display only: the value is the 9 digits ("123-45-6789" is saved as
      "123456789", an EIN "12-3456789" as "123456789"). A masked value keeps its X's ("XXXXX1234").
- [ ] UI: every SSN / ITIN / EIN / TIN input uses `appTin` (`individual` | `ein` | `any`), which shows the value formatted
      and keeps only the digits in the model; placeholders may show the formatted example.
- [ ] Backend: the field name must be recognized by `InputNormalizer.isTinKey` (names ending in ssn / tin / ein, or
      listed in `EXTRA_TIN_KEYS`) so the save path strips it - add a new name to `EXTRA_TIN_KEYS` if it doesn't match.
      Nested rows (e.g. tips by employer) are covered.
- [ ] Old rows: V425 cleaned existing pf_* / se_* / dependent columns; a new TIN column needs the same clean-up if it
      can already hold formatted values.
- [ ] Output (printed forms, previews) formats the digits; values copied from statements stay digits only.
- [ ] e2e: type the value with dashes and check the saved value is digits only.
- [ ] Words the IRS instructions allow in place of the number are accepted and saved as spelled there (e.g. Form 2441
      provider: "Tax-Exempt", "LAFCP"; Form 8919 firm: "unknown"): `appTin` with `[tinWords]`.
- [ ] **An SSN (or ITIN) is always shown ###-##-####**, as on the Identification screen - never ##-####### (that layout
      is only for an EIN). Check every SSN field on the screen after typing it, after leaving it and after reopening the
      screen. With `appTin="any"` the layout is chosen from the field name (payer / employer / provider / firm ... ->
      EIN), so an SSN in a field whose name also says EIN or an entity (e.g. `buyerSsnOrEin`, `firmFederalIdNumber` of a
      firm that is a person) came out as an EIN. Use `appTin="individual"` when only an SSN / ITIN belongs there;
      when the screen knows whether it is a person or a business, bind `[tinShowAs]="... ? 'ssn' : 'ein'"`. An ITIN is
      always shown as an individual's; a field named for an SSN (`...Ssn...`) shows an SSN layout. e2e: assert the shown
      value (`toHaveValue('123-45-6789')`), not only the saved digits.

*From: owner 2026-11-03 (rule in `rules.md` "No formatting characters in the database"); applied on Tips (employer EIN).
SSN layout ###-##-####: owner 2026-11-05; fixed on Interest income (buyer SSN), Uncollected Social Security (firm
that is a person) and Child and dependent care (provider a person or a business, V431).*

## 13. Messages that quote the screen

- [ ] When a label or question changes, search the backend for messages that quote it (blocking `TaxReturnFlag`
      messages often name a question or checkbox in quotes) and update them, so the message still matches the screen.
- [ ] The same IRS check applies to those messages: a claim the help no longer makes must go from the message too.

*From: Medicaid waiver payments (home-sharing flag in `Line1WageComputations`).*

## 14. Show/hide eye on personal identifying information

- [ ] Every field that holds a person's identifying information is hidden once it has a value, with an eye button to
      show it: SSN / ITIN (filer, spouse, dependents and anyone else named on the screen, e.g. an alimony recipient or
      registered domestic partner), date of birth, IP PIN / self-select PIN / designee PIN, and bank routing and account
      numbers.
- [ ] Same pattern as Identification: `showSensitive[field]` + `toggleSensitive(field)`; the input's `[type]` is
      `password` when it has a value and is hidden (`inputTypeFor(field)`), `text` while empty or shown; a date field
      uses `<app-date-input [masked]="isMasked(field)">` (CSS mask, since a date can't be `type="password"`).
- [ ] The button sits in the label row before the help icon: `pi-eye` when hidden, `pi-eye-slash` when shown, with an
      `aria-label` "Show ..." / "Hide ...". Hidden is the default every time the screen opens.
- [ ] Masking is display only: the saved value is unchanged (digits only, item 12) and validation still runs on it.
- [ ] Not PII: a business's EIN (employer, payer). A field that can hold either (Form 8919's firm ID, which is an SSN
      when the firm is a person) gets the eye too.
- [ ] e2e: the value is hidden after typing and leaving the field, the eye shows it, and the saved value is right.

*From: owner 2026-11-04; existing on Identification, Filing status, Third party designee, Refund and amount owed,
Income adjustments (alimony recipient SSN).*

## 15. Clear in every section, Reset on every screen

- [ ] Every section (`<section class="section">`) has a Clear button in its header (`sectionClear` directive,
      `section.clear()`): it asks first ("Clear this section?") and blanks only that section's answers. A section
      without a heading gets one (e.g. "Chapter 11 bankruptcy"); a collapsible "Less common situations" panel carries
      Clear on its own heading.
- [ ] Every screen has Reset in the shared bottom bar (`<form-actions [showReset]="true" (reset)="resetScreen()">`):
      after asking ("Clear everything on this screen and start over?", `RESET_SCREEN_MESSAGE`) it restores the screen's
      blank model, saves it (partial save, no validation) and says "This screen was reset." Values imported from
      statements (Form W-2 totals) are kept.
- [ ] The screen uses the shared bar for Save (and Prev / Next where the sidebar order has them), not its own Save
      button; "Add ..." buttons sit above the bar. Save is never disabled for missing answers (save partial, warn).
- [ ] The Save button and the status message are reachable on every path of the screen, including after a "No" to
      the screening question.
- [ ] No keyboard-shortcut hints ("Ctrl+S") or other screen-only buttons in the bar.
- [ ] e2e: Reset asks, clears and saves blank; a section Clear blanks only that section.

*From: owner 2026-11-04 (Adoption expenses "Ctrl+S" hint; Clear and Reset on Employment, Tips, Medicaid waiver payments,
Uncollected Social Security, Combat pay, Child and dependent care, Adoption expenses).*

## 16. The same kind of field looks and works the same

- [ ] Compare every field with the fields beside it and with the same kind of field elsewhere on the screen (and on the
      other tab's copy): same control, same size and border, same label row with a help icon, a placeholder of the same
      kind. A field that looks different is usually built differently (owner 2026-11-05: Dividend income's "Who paid them
      (names for Schedule B)" was a bare browser input next to styled amount fields).
- [ ] A PrimeNG directive works only when its module is imported by the component: `pInputText` needs `InputTextModule`,
      `pTextarea` `TextareaModule`, `pButton` `ButtonModule`. Without it Angular raises no error - the element renders
      as a plain browser control (no `p-inputtext` class, different height and border). Check the component's
      `imports`, not the template. Quick audit: every file with `pInputText` must also name `InputTextModule`.
- [ ] Same markup for the same thing: help icons are `<i class="pi pi-info-circle help-icon" role="button"
      tabindex="0" aria-label="Help for ...">`, not a `<button>?</button>` on one question; every label sits in a
      `label-row`; a text field beside amount fields gets the same row layout.
- [ ] Exactly one help icon per question, in its label row - never inside a radio option after "Yes" or "Single" (a
      script that adds icons can run past labels that already have one). Quick audit: no `help-icon` between
      `class="radio-option"` and its closing `</div>`.
- [ ] Radio ids in repeated rows follow one pattern across screens: `<name>_yes_<row>` / `<name>_no_<row>` (Like-kind exchanges, Archer
      MSA / LTC) - a `<name>_<row>_yes` variant on one screen broke the spec written from the other.
- [ ] A question's `<label for>` points at the radio group's id, not at its Yes radio: `for="x_yes"` makes the question
      text part of the Yes radio's accessible name, so "Yes" is no longer found by role (`selectRadioOption`).
- [ ] Two fields that look alike must say how they differ (Dividend income: "Dividends with no Form 1099-DIV at all"
      and "Other dividends not on an entered Form 1099-DIV" had near-identical labels).
- [ ] e2e: assert the class (`toHaveClass(/p-inputtext/)`) and that the field's label row has a help icon; compare the
      height with a neighbouring field.

*From: owner 2026-11-05 (Dividend income, "Who paid them (names for Schedule B)").*

## 17. The bottom bar is the shared one, not the screen's own

- [ ] The screen ends with the shared `<form-actions>` bar (`components/form-actions.component.ts`): Prev on the left (Personal
      screens), Reset, then Save and Next on the right, in the same place and style on every screen. Not a Save button of the
      screen's own: no `<div class="form-actions">` / `form-actions-sticky` with a `pButton` Save, no floating or sticky
      bar, no second Save at the top.
- [ ] Save is never `[disabled]` for missing answers and never refused by an `isValid()` that returns early: the screen
      saves what is there and names what is still needed (`missingAnswers()`, "Saved. Still to answer ...").
- [ ] Delete the screen's own bar CSS (`.form-actions-sticky`, `.form-actions`) when switching, so no leftover rule
      restyles the shared bar.
- [ ] Quick audit: a component with `label="Save"`, `>Save<` or `form-actions-sticky` and no `<form-actions` is not
      compliant (44 personal screens on 2026-11-05 - see `outstanding.md`).
- [ ] e2e: `form-actions .form-actions-bar` is there, `.form-actions-sticky` is not, and Save sends the PUT with a question
      left unanswered.

*From: owner 2026-11-05 (IRA income: its own sticky Save bar, Save refused until the upload questions were answered).*

## 18. Screens are built the same way: one page that reveals its follow-up questions

- [ ] A screen is one page of sections, like Employment, Interest income or IRA income. A follow-up question appears in place,
      under the answer that needs it (`*ngIf` on the answer), not on another step. No step-by-step wizard: no Back / Continue
      buttons, no "Step N" label, no review step that repeats the answers with Edit buttons, no "next screen" wording.
- [ ] Converting a wizard: each step becomes a `<section class="section" sectionClear>` with a heading (a noun, not the
      step's question), shown under the same condition the step order used (Pension withdrawals: `visible(step)` walks the
      old `getNextScreen()`), so no follow-up logic is lost; side effects of "Continue" (clearing answers that no longer
      apply) move into `normalizeForSave()`; the review step is removed (the answers are already on the page).
- [ ] The shared bottom bar (item 17) is the only navigation; Save is never held back until a step is finished.
- [ ] Text that talks about steps ("select Continue", "on the next screens", "return here and continue") is reworded.
- [ ] Quick audit: `screenHistory`, `continueToNext`, `wizard-nav`, `currentScreen` or a `*Step` counter in a component.
- [ ] e2e: no `.wizard-nav` / `.step-label` / review section and no Continue button; answering a gating question shows its
      follow-up section on the same page; specs that clicked Continue or a review Edit button are updated.

*From: owner 2026-11-05 (Pension withdrawals: a 16-step wizard; "why not have the revealing ui as we have done for other
screens").*

## 19. Plain language

- [ ] Everyday words: "get" not "receive", "back payment" not "lump-sum back payment", "paid back" not "repaid beyond the
      benefits received". A form's own term (lump-sum election, base amount) appears once, in the help, with what it means.
- [ ] Years, not relative terms: "2024" / "that year" / "an earlier year", never "current-year", "prior-year" or "the tax
      year" (years from tax-year.ts).
- [ ] No program words: allocation, recomputation, override, worksheet support, previously reported, facts.
- [ ] A label names the figure and where it is on the form: "Taxable benefits on the 2024 return (Form 1040 line 6b)". A line
      number is shown only for years whose form has that line (Form 1040 lines 2a, 6a, 6b, 9, 10 are the same 2021-2025).
- [ ] Section notes say what the answer changes, in one or two short sentences, and are checked against the IRS source
      (the Social Security note claimed a "lower $25,000 base"; the base is $0 when the spouses lived together).
- [ ] One fact, one question: two questions that are each other's opposite ("lived with your spouse at any time?" /
      "lived apart all year?") become one, the other saved as its opposite in `normalizeForSave()` and read back from older
      saves on load (field removal needs owner sign-off).
- [ ] The same thing said once: no count badge, list and "entered" line all saying how many statements there are.

*From: owner 2026-11-05 (Social security benefits: "the language on the ui is complicated").*

## 20. Answers the app can work out are filled in, never forced

- [ ] For each question, ask: can it be answered from something already entered - the person's statements, another
      screen (Filing status, Identification), last year's return computed here, or the uploaded last-year Form 1040?
      List the candidates with their source and check each against the IRS meaning of the question before mapping
      (Pub. 915's "other income" is line 9 minus line 6b, not AGI).
- [ ] Fill only blanks, and only while the user hasn't answered: anything typed or saved wins, and the filled answer
      stays editable. Where the answer can't be fully worked out (a lump sum listed for several years with no split), fill
      what is known and say what is left.
- [ ] Say where it came from, under the answer or section: "We answered Yes because a Form SSA-1099 with your SSN is
      entered", "Filled in from your 2024 return. Check the figures." (`.auto-answer-note`).
- [ ] A conflict the user can still override (answered No while a statement with their SSN is on file) gets a non-blocking
      advisory from the compute naming both; a conflict that would make the return wrong blocks (non-overrideable,
      `[[feedback_household_facts_once_conflicts_block]]`).
- [ ] An election (a choice the IRS leaves to the filer, e.g. the lump-sum election) is never made for the user: the
      compute says when it would lower the tax, and doesn't use a chosen election that wouldn't.
- [ ] Blank vs zero in the source: a figure missing from a return computed here means none (0); a blank on an uploaded
      or read document may be a box that wasn't read, so it stays blank.
- [ ] A fact the household answers once (lived together, married) is read from its owning screen, not asked again; the
      screen says where it was answered.
- [ ] A filled amount comes from a statement the return does not already count: filling excluded territory wages from ordinary Forms
      W-2 (still on line 1a) counted them twice; the Form W-2AS, which the compute keeps off line 1a, is the right source (Income earned
      in a US territory).
- [ ] e2e: the filled value and its note; a typed value is kept on reopening; the conflict advisory.

*From: owner 2026-11-05 (Social security benefits: "could they be inferred ... always allow the user to override if it
does not cause any conflict": Yes from the statements, lump-sum rows from Form SSA-1099 box 3 / Form RRB-1099 boxes 7-9,
last year's figures from last year's return or upload, the lump-sum election suggestion).*

## 21. Every question earns its place, and every saved field can be reached

- [ ] For each question, find what reads it: the compute (`TaxReturnComputeService` and helpers), a blocking check or
      the screen's own reveal logic. A question nothing reads is removed from both copies, the help and the intake YAML,
      with a note if users would look for it ("SSI isn't taxed and isn't on Form SSA-1099, so leave it out"). Keep the
      column; remove the dead validator and its registry entries (`NonOverrideableFlags`) too.
- [ ] Two questions that are one fact turned around become one (item 19).
- [ ] The other way: every field the screen's model saves and the compute reads is shown on every copy where that person
      can have it (the spouse copy saved a terrorist-attack disability amount it never displayed). Quick audit: each key
      in the component's field lists (`exclusionsFields`, `allFieldDefs`) appears in the template.
- [ ] Removing or merging a question needs the owner's sign-off (field deletion), even when nothing reads it.

*From: owner 2026-11-05 (Social security benefits: the three SSI questions removed, "why remove the SSI fields?" - unused
since D-6a-1; the spouse disability field shown).*

## 22. Both spouses: the spouse copy is complete and the checks read either spouse

- [ ] Return-level checks that read a screen's answers (statement upload gates, "every statement entered") read both
      copies: a joint return where only the spouse has the income must not be blocked by the Family Head's blank answer
      (Social Security and IRA income were always blocked; Dividend income had the same pattern).
- [ ] The spouse copy asks every per-person question the Family Head copy asks (upload question, nominee questions),
      reads the spouse's own identity fields (`spouseSsn` / `spouseDateOfBirth` on identification-spouse, not
      `ssn` / `dateOfBirth`) and lists only the spouse's statements (item 6).
- [ ] e2e: a joint return where only the spouse has the statements computes without the upload blocker once the spouse
      answers.

*From: owner 2026-11-05 (IRA income and Social security benefits: "add the spouse upload question").*

## 23. Statement fields the screen reads are real

- [ ] Every statement key a screen reads (`r.data['...']` for a row amount, a count, an inference) exists in that
      statement's model and mapper - grep the statement component and `*Mapper.java` for the name. A wrong key fails
      silently: the row shows $0.00 or the inference never fires (the Form RRB-1099 row read a key that doesn't exist;
      the right one is `netSSEBAmount`).
- [ ] Free-text boxes the IRS uses to carry a figure (Form SSA-1099's box 3 description "Box 3 includes $... paid in 2025
      for 2024") are parsed with a unit-tested helper, and an unreadable text leaves the answer blank.
- [ ] The statement entry LIST (`statementData.listEntries`) carries only ids: read amounts and SSNs from `getEntry` for each one.
      A screen that read them off the list showed $0 for every total and counted every household statement as the person's own,
      silently (Income adjustments). Same for the spouse's own SSN: `identification-spouse` keeps it as `spouseSsn`.
- [ ] e2e: seed the statement through the API with the real field names and check the screen shows the amount.

*From: Social security benefits (Form RRB-1099 row; lump sums read from the statements), 2026-11-05.*

## 24. Looks like the screens already fixed: shared styles, compared side by side

- [ ] The screen's sections sit inside `<div class="form-view">`: the shared styles in `styles.scss` (white section cards, small
      grey labels, the grey-filled inputs, the `.row` field grid) apply only there. Without it the sections have no card and
      the fields no box (Installment sales, 2026-11-06).
- [ ] No local CSS that redoes the shared look: no own `.field`, `.label-row`, `.help-icon`, `.section-instructions`, label
      colours or field grid in the component. Use `.row` for fields side by side.
- [ ] Inputs are grey-filled (`#F9FAFB`) with no border until focus - so never put them on a grey background: a repeated
      entry is a white card (`.row-card`, or its own `.section` as the firms on Uncollected Social Security), not the grey
      dashed `.section-item`, or the fields look like plain text until the mouse is over them.
- [ ] Each repeated entry (a sale, a firm, a year) has **Clear** (`sectionClear` on the card) and **Remove** (asks first:
      "Remove this ... ? This will delete the data ..."), in its header; a title from the entry (its description) when it has one.
- [ ] Add buttons are the plain `toolbar-button` used on the fixed screens, not PrimeNG `pButton` icon buttons.
- [ ] A component style that changes a shared rule (the `.row` grid) needs at least the shared rule's specificity: `.prop-row` alone
      loses to `.app-shell .form-view .row`, so write `.form-view .row.prop-row`. Check it in the screenshot, not in the CSS
      (Rental & royalty income: a lone amount still stretched across the card).
- [ ] A question with only a "Yes" radio (a checkbox in disguise) can never be answered No: every question gets Yes and No, with
      its label on the group (Rental & royalty income had six).
- [ ] `.row-card` is not a shared style: a screen that uses it for entry cards must give it the white card with a border (as on
      Social security benefits), or the entries run into the section (Business income, Rental & royalty income REMICs).
- [ ] Every field the screen shows is in the save payload and loaded back: a bound field left out of `save()` is erased by every
      save (Business property sales: the section 1231 lookback amount). Quick audit: each `[(ngModel)]` key appears in the payload.
- [ ] A link to an entry on another screen is saved by name, not by its position in that list - a position silently points elsewhere
      when the list is reordered (Business property sales: "rental:0").
- [ ] A message (flag) about the spouse's entry opens the spouse's copy: set the flag's `formId` to the spouse form when the
      checklist link table names only the taxpayer copy (Like-kind exchanges).
- [ ] A label built from `ownerDisplayName` + "'s" reads "you's" on the taxpayer tab: word it from the `CgWho` (poss / Poss) instead
      (Like-kind exchanges).
- [ ] A pick list of countries is the shared `data/foreign-countries.ts` (plus United States where a U.S. answer is valid), never a short
      copy with an "Other (type below)" placeholder that has no box - it saved "__other__" onto Form 2555 (Foreign income).
- [ ] A field that must match a name entered on another screen (an asset's business, farm or rental) is a pick list of that person's
      own names, saving the same text - not free text that silently fails to match (Depreciable assets).
- [ ] A pick list that mirrors a printed form uses the form's own choices (Form 4563 line 2 has Rented room / Rented house or apartment /
      Quarters furnished by employer / Purchased home - the screen had "Hotel"); a cases-by-place screen checks for each place what the IRS
      lets it do (Guam, CNMI and USVI residents exclude nothing on Form 1040) - Income earned in a US territory.
- [ ] Questions about all the entries of a list (Schedule C lines 46-47 about the vehicles) come after the entries, in the form's
      order, not before them.
- [ ] Before calling the screen done: take a screenshot of it with a filled-in entry and one of a fixed screen of the same
      section (Incomes: Uncollected Social Security has entries, a select, a date and an eye field) and compare them - section
      cards, label size, input fill, date field, Clear / Remove, add button, spacing between stacked questions.

*From: owner 2026-11-06 ("It does not have the look and feel of the previous screens ... The date fields look strange. The
sections are supposed to have Clear rather than Remove. Input field outline do not show until mouseover"). The same faults
were on Capital gain/loss and Social security benefits rows, fixed together.*

## 25. The screen's name: the sidebar label and the heading in the Incomes style

- [ ] The sidebar label names what the screen is about in plain words, as the Incomes labels do ("Interest income",
      "Pension withdrawals", "Income earned in a US territory") - no abbreviations or shorthand ("LIHC", "Alt fuel", "Prior
      min tax", "Elderly/Disabled"), no program words ("Interest expense" for investment interest, "Qualified business income"
      for the deduction), and accurate in number and scope ("Standard or itemized deductions", not "Standard deductions").
- [ ] A form tag only when the screen is built around one form, and always with the word: "(Form 6252)", "(Schedule C)" - never a
      bare number ("(5405)", "(3800)") or a statement in place of the form the screen fills ("(K-1)" for Form 8582). A screen
      that feeds several forms has no tag ("Self-employed health insurance and retirement plans": Form 7206 and Schedule 1).
- [ ] Sentence case: only the first word and proper names capitalized ("Electric vehicle credit", not "Electric Vehicle credit";
      "Earned income credit", not "Earned Income Credit").
- [ ] The heading is the sidebar name without the form tag, then the person: `<h3>Home energy credits (Dana)</h3>` - not the old
      "Form 8611 — Recapture of Low-Income Housing Credit" or "Form 8880 – Savings credit (taxpayer)" (the IRS title goes in the
      subtitle or help, item 5; names, not "taxpayer", item 8). The spouse and dependent copies use the same name.
- [ ] Renaming a screen: update everything that quotes the old name - the calculation's messages (`Open the \"<sidebar label>\"
      form`, checked by `NonOverrideableFlagMessagesTest`; item 13), `<form-link>` text and `returnLabel` on other screens, help and
      notes that name it, the e2e sidebar regexes and heading asserts, the checklist and `outstanding.md`. In a Java string a quoted
      name needs `\"` - a bare `"` breaks the build.
- [ ] e2e: the sidebar link shows the new label and the heading reads "<name> (<person>)".

*From: owner 2026-11-08 ("look at the titles of the forms in incomes section and then look at the titles in Deductions"): the
Deductions labels renamed in the Incomes style. Headings still in the old "Form NNNN — title" style (Forms 8611, 8828, 8938,
8990, 1116, 8880, "Earned Income Credit") are fixed when each screen is reviewed.*

---

## Screens reviewed

| Screen | Items applied | Date |
|---|---|---|
| Identification (Family Head, spouse) | 2, 3, 4 | 2026-11-02 |
| Address | 2, 4 | 2026-11-02 |
| Filing status | 2 | 2026-11-02 |
| Prior-year carryovers | 2, 7, 8 | 2026-11-03 |
| Digital assets | 1, 2, 3 | 2026-11-03 |
| Presidential election campaign | 1, 2 | 2026-11-03 |
| Third party designee | 2, 3, 4 | 2026-11-03 |
| Employment (Family Head, spouse, dependent) | 1, 2, 3, 5, 6, 7; 15 on 2026-11-04 | 2026-11-03 |
| Tips (Family Head, spouse, dependent) | 1, 2, 3, 5, 6, 7, 12; 15 on 2026-11-04 | 2026-11-03 |
| Medicaid waiver payments (Family Head, spouse, dependent) | 1, 2, 3, 5, 6, 7, 9, 12, 13 (second pass: 2, 3, 5, 7, 13); 15 | 2026-11-04 |
| Uncollected Social Security (Family Head, spouse, dependent) | 1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15 | 2026-11-04 |
| Combat pay election (Family Head, spouse) | 1, 2, 3, 5, 6, 7, 9, 15 | 2026-11-04 |
| Child and dependent care (Family Head, spouse copy) | 1, 2, 3, 4, 5, 6, 7, 9, 12, 13, 14, 15 | 2026-11-04 |
| Adoption expenses and benefits (Family Head, spouse copy) | 1, 2, 3, 5, 6, 7, 8, 9, 14, 15 | 2026-11-04 |
| Other earned income (Family Head, spouse copy) | 1, 2, 3, 5, 6, 7, 8, 9, 15 | 2026-11-05 |
| Interest income (Family Head, spouse copy) | 1, 2, 3, 5, 6, 7, 9, 12, 13, 14, 15 | 2026-11-05 |
| Dividend income (Family Head, spouse copy) | 1, 2, 3, 5, 6, 7, 9, 13, 15, 16 | 2026-11-05 |
| IRA income (Family Head, spouse copy) | 1, 2, 3, 5, 6, 7, 9, 13, 15, 16, 17 | 2026-11-05 |
| Pension withdrawals (Family Head, spouse copy) | 1, 2, 3, 5, 6, 7, 13, 15, 16, 17, 18 | 2026-11-05 |
| Social security benefits (Family Head, spouse copy) | 1, 2, 3, 5, 6, 7, 11, 13, 15, 16, 17, 19, 20, 21, 22, 23, 24 | 2026-11-06 |
| Capital gain/loss (Family Head, spouse, dependent) | 1-8, 11, 13, 15-24 | 2026-11-06 |
| Installment sales (Family Head, spouse) | 1-8, 11-17, 19, 20, 21, 24 | 2026-11-06 |
| Other incomes (Family Head, spouse) | 1-8, 11, 13, 15-24 | 2026-11-06 |
| Rental & royalty income (Family Head, spouse) | 1-8, 11-17, 19-24 | 2026-11-06 |
| Business income (Family Head, spouse) | 1-8, 11-17, 19-24 | 2026-11-06 |
| Farm income (Family Head, spouse) | 1-8, 11-17, 19-24 | 2026-11-06 |
| Farm rental (Family Head, spouse) | 1-8, 11-17, 19-24 | 2026-11-06 |
| Self-employment tax options (Family Head, spouse) | 1-8, 11-17, 19-21, 24 | 2026-11-06 |
| Depreciable assets (Family Head, spouse) | 1-8, 11-17, 19-21, 24 | 2026-11-06 |
| Business property sales (Family Head, spouse) | 1-8, 11-17, 19-24 | 2026-11-06 |
| Like-kind exchanges (Family Head, spouse) | 1-8, 11-17, 19-24 | 2026-11-06 |
| Business casualties and thefts (Family Head, spouse) | 1-9, 11, 13, 15-24 (second pass: 5, form titles in help) | 2026-11-06 |
| Income adjustments (Family Head, spouse) | 1-9, 11-24 | 2026-11-06 |
| HSA (Family Head, spouse) | 1-8, 11, 13-17, 19-24 | 2026-11-06 |
| Archer MSA / LTC (Family Head, spouse) | 1-8, 11-17, 19-24 | 2026-11-06 |
| Foreign income (Family Head, spouse) | 1-8, 11, 13-21, 24 | 2026-11-06 |
| Income earned in a US territory (Family Head, spouse) | 1-8, 11, 13-24 | 2026-11-07 |
| Lump-sum distributions (Family Head, spouse) | 1-8, 11, 13-24 | 2026-11-07 |
| Other tax items (Family Head, spouse) | 1-8, 11, 13-24 | 2026-11-07 |
| Household employees (Family Head, spouse) | 1-8, 11-17, 19-24 | 2026-11-07 |
| Kiddie income (dependent) | 1-8, 11, 13, 15-21, 24 | 2026-11-07 |
| Child's int. & dividends (dependent) | 1-8, 11-24 | 2026-11-07 |
| Additional deductions (Family Head, spouse) | 1-8, 11-24 | 2026-11-07 |
| Noncash charity (Form 8283; household, Family Head tab) | 1-8, 11, 13, 15-21, 24 | 2026-11-08 |
| Injured spouse (Form 8379; joint return, Family Head tab; moved to Applications) | 1-8, 11, 13, 15-21, 24 | 2026-11-08 |
| Foreign assets (Form 8938; household, Family Head tab; moved to Applications) | 1-8, 11, 13-21, 24, 25 | 2026-11-08 |
| Low-income housing credit recapture (Form 8611; household, Family Head tab; moved to Incomes) | 1-8, 11, 13, 15-21, 24, 25 | 2026-11-08 |
| Mortgage subsidy recapture (Form 8828; household, Family Head tab; moved to Incomes) | 1-8, 11, 13, 15-21, 24, 25 | 2026-11-08 |
| Business interest limit (Form 8990; Family Head and spouse copies) | 1-8, 11, 13, 15-21, 24, 25 | 2026-11-08 |

Screens reviewed before an item existed may still need it (e.g. item 5 Form names and item 6 Links were added with
Employment, after the earlier screens).
