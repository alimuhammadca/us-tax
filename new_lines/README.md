# new_lines — what the IRS requires, line by line

One file per Form 1040 **income-section** line (1a … 11a) and, under `forms/`, one file per schedule or form that
feeds those lines. Each file answers one question: **what does the IRS say must go on this line, and how is it figured?**

These files describe the **2025 IRS rules**, not the app. How the app implements each rule is in
`C:\us-tax\new_knowledge\` (same file name), and the picture of the computation is in `C:\us-tax\new_flowcharts\`.

## Sources

Every rule cites the IRS document it comes from: a file in `C:\us-tax\docs\books\` and its page, for example
`i1040gi_ty2025.pdf p. 23` (page = the PDF page number, which is what a PDF viewer jumps to; it can differ from
the number printed at the foot of the page). For information-return instructions the IRS has already re-issued for 2026, the 2025
edition (`<name>--2025.pdf`) is the one cited. Nothing is taken from memory or general web pages.

## Layout of every line file

1. **At a glance** — one short paragraph and the formula.
2. **The IRS wording** — the line's text on the 2025 form, and the key sentences from the instructions (quoted, with page).
3. **What goes on this line** — every kind of amount that belongs here.
4. **What does not go here** — look-alike amounts, and the line or form where each one goes instead.
5. **Where the numbers come from** — table: source document / form, box or line, and how it enters.
6. **How to figure it, step by step** — numbered steps in plain language, including worksheets.
7. **Special cases and elections** — each with its rule and its source.
8. **Married filing jointly / separately** — whose amounts count, and any per-person limits.
9. **Forms to attach or keep** — what is filed with the return and when; what is only kept with records.
10. **Where the amount goes next** — the lines and forms that use this line.
11. **Worked example** — fictional people and numbers, every step shown.
12. **2025 amounts used** — thresholds, limits and rates, each with its source.
13. **IRS sources** — every document and page used.

Lines that are only a checkbox (3c, 4c, 5c, 6c, 6d, 7b) use the same layout with the sections that apply.

## Writing rules

- Plain language first; the formula and the IRS quotation back it up.
- Name a line as `Form 1040 line 1a`, `Schedule 1 line 8z`, `Form 8949 Part I` — never a bare number.
- Every dollar amount, threshold and date carries a source.
- Examples use fictional people, SSNs of the `000-00-0000` style and round numbers.
