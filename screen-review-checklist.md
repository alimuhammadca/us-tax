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

Screens reviewed before an item existed may still need it (e.g. item 5 Form names and item 6 Links were added with
Employment, after the earlier screens).
