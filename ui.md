# UI Form & Question Design Rules

Rules developed for designing YAML intake forms and Angular UI question flows in this project.

---

## Structural Layout

1. **Screening first, details second** — gate the entire subtopic with a boolean ("Did you have X?"); skip the full subtree on No.
2. **Section order**: `screening` → `statementUploadCheck` → named input sections → `importedStatementFields` → `computedOutputs`.
3. **Group related numeric inputs together** after the screening section is resolved; do not interleave yes/no gates with amounts.
4. **One high-value question per screen** for complex decisions; do not front-load multiple fields when one boolean determines relevance.
5. **Taxpayer form owns return-level gating questions**; spouse form contains only spouse-specific supplemental inputs.
6. **Topic hub + sub-interview pattern** for multi-entity or multi-situation forms (Start / Update / Visit All); present current summarized amounts on the hub screen with Edit buttons.

---

## Field Design

7. **Boolean fields** → Yes/No radio buttons, never dropdowns or single checkboxes.
8. **Amount fields** → `type: amount`, `placeholder: 0.00`.
9. **Text fields** → `type: text` with a realistic placeholder showing expected format.
10. **Every user-facing field must have both `label` and `help`**; help text is IRS-line-aware and explains why the field matters.
11. **Labels match IRS box/line language** so users can cross-reference their documents without translation.
12. **`showIf` gates** control whether downstream fields render; never present a dependent question when the screening answer is No or a parent field is null.
13. **Rare/uncommon cases** go behind an explicit expansion branch ("Any of these less common situations apply?") — hide until the user signals with a checkbox; do not clutter the primary flow.

---

## Conditional Logic

14. **`multiplicity: multiple`** only for genuinely repeatable item rows (one row per vehicle, employer, transaction, etc.); single-value inputs never use it.
15. **Filing-status-conditional fields** must be nullable when hidden and cleared automatically when filing status changes to one that excludes them.
16. **MFS/MFJ gates** — fields invalid for MFS must be gated; do not require the user to know the rule — gate it in the form definition.
17. **`showIf` targets the immediate parent field**, not a distant ancestor — each step in a conditional chain gates only its own subtree.

---

## Statement vs. Personal Form Separation

18. **Statement YAMLs** contain only IRS-box fields from the physical document — no eligibility screening, no computed results, no override fields.
19. **Personal intake forms** own: elections (e.g., combat pay election), yes/no eligibility gates, user overrides, and any amount that does not appear on a statement box.
20. **`importedStatementFields`** — `readOnly: true`; backend-only; never rendered in the UI; populated from statement aggregation.
21. **`computedOutputs`** — `readOnly: true` + `computed: true`; backend-only; never rendered; hold derived results.

---

## UX / Interview Flow

22. **Educational framing before data entry** — lead with a short explanation of what the section covers and why before presenting the first input field.
23. **Contextualize repeated sections** by entity name (employer name, dependent name, property address) so the user knows which entity the current mini-form applies to.
24. **Entity-centric repetition** — complete all questions for one entity before moving to the next; never interleave fields from two entities on the same screen.
25. **Inline validation** — surface errors at the field level as the user moves through the form, not only at compute/submit time.
26. **"Do any of these apply?" checkbox list** for enumerating uncommon sub-situations; checking one item expands only that item's fields.

---

## Out-of-Scope Handling

27. **Explicit out-of-scope blockers** — if a self-employment path or unsupported election is detected, surface a clear `showIf`-gated message explaining it is not supported; do not silently ignore it or allow the user to enter data that will be discarded.
28. **Out-of-scope fields must be documented** in the spec's "Out of scope" section with rationale; the YAML must have a corresponding gating field or blocker message.

---

## Backend / Frontend Contract

29. **Backend-only sections** use `readOnly: true` at the section level; the UI must not render them even if they appear in the YAML.
30. **Required fields** — mark `required: true` only for fields the backend will reject if absent; do not mark informational fields required.
31. **Field `name` values** must be stable Firestore keys — never rename a field after it has been saved to production data without a migration plan.

---

## Proactive Guidance & Question Framing

32. **Guide users proactively to forms they may not know exist** — when an answer implies a need for a secondary form the user is unlikely to know about (e.g., W-2 not received → Form 4852), the interview must surface a plain-language explanation and sidebar navigation hint at the point of the answer. Never rely on the user finding an edge-case form independently by browsing the sidebar.

33. **Never ask the user to reference another tax form by name or line number** in a question label (e.g., "Are these wages also reported on Form 8919 (line 1g)?"). If data from another form already in scope can resolve the question, read it programmatically. Mutual exclusion between income paths must be enforced by form design, not by asking the user to know both forms simultaneously.

34. **Frame questions around the user's real-world situation, not tax form mechanics** — "Was this employer a prison or correctional facility?" is a question the user can answer from lived experience; "Does this W-2 include wages earned while incarcerated in a penal institution?" requires the user to translate IRS routing rules into their own situation. Always prefer the situational framing.

---

## Statement-First Design (Most Important Principle)

35. **Statements are the primary data source — get them first, derive answers from them.** The taxpayer's primary goal is to complete the return in the least possible time. The fastest path is to upload or manually enter their statements (W-2, 1099-INT, 1099-DIV, 1099-R, etc.) once, and let the application derive as many answers as possible from those statements automatically. Personal intake forms should be a thin layer of elections, overrides, and edge cases — not a re-entry of information already present in statements.

36. **Never ask a question the application can answer from submitted statements.** If the user has uploaded a W-2, the application already knows they have employment income, how many W-2s were submitted, and what the wages are. Do not ask "Did you receive any wages?", "Did you upload your W-2?", or "How many W-2s do you have?" as freestanding questions when the answer is determinable from the statement store. These questions must be auto-answered and pre-populated. The user is invited to validate, not to re-enter.

37. **Auto-complete personal form fields from statement data; surface them in read-only or pre-filled mode.** When a personal intake form field can be derived from a submitted statement (e.g., `hasEmploymentIncome` from the presence of a W-2, `submittedW2` from the count of W-2 entries, `hasDividends` from 1099-DIV), the backend must auto-populate those fields and the UI must display the derived value as the default answer. The user may override it, but should not have to type what the application already knows.

38. **Statement upload / manual entry is the entry point, not a sidebar checkpoint.** The workflow must guide the user to enter their statements first. Only after statements are entered (or explicitly skipped) should personal intake questions be presented. Questions whose answer is already implied by the statement data must be shown as pre-answered with a brief "Based on your W-2" / "Based on your 1099-DIV" attribution so the user understands the source and can correct it if wrong.

39. **OCR / AI extraction feeds the same statement model as manual entry.** Whether a statement is populated via AI/OCR from a scanned PDF or typed manually by the user, it must produce identical Firestore fields. The extraction pipeline is an accelerator on top of the existing statement schema — not a separate path. The UI must confirm extracted values and invite the user to verify: "We read the following from your W-2 — please confirm or correct."

40. **Provide real-time acknowledgement of recognized statements.** When a statement is submitted (via upload, OCR, or manual entry), the application must immediately show feedback: which statement was recognized, which key fields were extracted, and what downstream personal form fields it will auto-answer. This closes the loop and builds user confidence that the statement was understood correctly before the user proceeds to intake questions.

---

## Statement-Derived Field Verification Pattern

41. **Read-only derived fields must show source attribution.** Any field whose value is derived from a submitted statement must display the value as read-only, accompanied by a clear attribution label identifying the source — e.g., *"$8,200 — from Box 1 of State Correctional Facility W-2"*. The user must never see a plain number without knowing where it came from.

42. **Always offer a verification step for statement-derived amounts; corrections go back to the statement.** Immediately below a derived read-only amount, show a "Does this amount look correct?" Yes/No question. If the user answers No, display inline guidance pointing to the specific statement and field to correct — e.g., *"Please correct Box 1 on this W-2 in the Statements section of the sidebar, then return here and re-save. The amount will update automatically."* Do not provide a manual override field in the personal intake form. The statement is the single source of truth; correcting it there propagates the fix everywhere automatically.

43. **Statement schema is fixed — never add fields to statement YAMLs or statement Firestore documents.** Statement entries (W-2, 1099-R, 1099-INT, 1099-DIV, etc.) mirror the boxes on the physical IRS document. Their schema is intentionally frozen. When a computation requires distinguishing sub-categories of a statement (e.g., inherited vs. own IRA for a 1099-R, short-term vs. long-term for a 1099-B), the distinction must be captured in the personal intake form — not by adding a new field to the statement. The personal form then carries the sub-categorization as a user-entered or user-confirmed value, and the backend applies it against the aggregated statement totals.

---

## Multi-Copy Form Pattern (Row Overflow)

43. **When entity rows exceed a form's physical row limit, generate multiple PDF copies rather than truncating.** IRS forms with fixed row counts (e.g., Form 4137 Part I has 5 employer rows) must not silently drop overflow entities. Instead, produce N copies of the form where N = ⌈entityCount / rowsPerCopy⌉:
    - **Copies 1 through N−1** contain only the entity detail rows (columns a–d or equivalent); all calculation lines remain blank.
    - **Copy N (the final copy)** contains the remaining entity rows plus all calculation lines, with aggregates computed across every entity from every copy.
    - The PDF export produces a single merged file containing all copies in sequence.
    - The Tax Return display component must show an informational note when N > 1, stating how many copies will be generated and why.
    - This pattern applies to any form with a fixed row grid: Form 4137 (5 employer rows), Form 8949 (28 transaction rows), Schedule B (15 interest/dividend rows), etc.
    - Never show an amber warning or ask the user to manually attach a statement when this pattern is applicable — handle it automatically in the PDF export.

---

## Write-In Description Field Overflow

44. **For write-in description fields on IRS forms, check at export time whether the description fits in the inline field. If it fits, write it directly; if not, write "Refer to attached sheet" and append a separate statement page. Never leave the inline field blank when a description exists.**
    - At the minimum rendering font size (6pt), measure the text width against the field's available width (field pixel width minus 3pt padding).
    - If `font.widthOfTextAtSize(description, 6) ≤ availableWidth`: write the description text into the inline field; do not append a separate page.
    - If the text is wider: write the literal string `"Refer to attached sheet"` into the inline field and append a clearly titled separate page (e.g., *"Form 1040 Line 1h Statement"*) containing the full description wrapped at the page margin.
    - This rule applies to any form field that is a write-in companion to an amount field (e.g., Form 1040 line 1h `line1h_statement_text`, Schedule 1 other-income descriptions, etc.).
    - Do not conditionally append the page without also filling the inline field — the inline field must always be populated when a description exists.
