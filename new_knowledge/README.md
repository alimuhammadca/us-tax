# new_knowledge — how the app does it, line by line

One file per Form 1040 **income-section** line (1a … 11a) and, under `forms/`, one file per schedule or form that
feeds them — the same names as `C:\us-tax\new_lines\`. Each file answers: **how does the current code produce this
line, and where does it differ from the IRS rules?**

Everything here is read from the code as it is (us-tax-be, us-tax-ui), with `file:line` references, and checked
against the matching `new_lines` file. When the code and the IRS rules disagree, the difference is listed in
section 8 and recorded in `C:\us-tax\outstanding.md` under "IRS deviations (2026-10-24 documentation rebuild)".

## Layout of every file

1. **Status** — one paragraph: what is supported, what is not, and the number of deviations.
2. **Where the user enters it** — sidebar section and form, each question's label, the field name it saves, and the
   statement types (and boxes) that feed the line.
3. **Where it is stored** — personal form id / statement form id, entity and database table and columns.
4. **How it is computed** — the method(s) with `file:line`, then numbered steps that mirror the IRS steps in
   `new_lines`, saying what the code does at each step.
5. **Flags and advisories** — each code, whether it blocks the return, when it fires, what it tells the user.
6. **What it produces** — output model field, JSON path in the computed return, database column, and the tax-return
   form preview that shows it.
7. **Tests** — Java unit test classes and e2e specs that pin this line, with what each proves.
8. **Compared with the IRS rules** — table: IRS rule (with source) · what the app does · Match / Deviation / Not
   supported. Every Deviation or Not supported row has an id (for example `D-1a-1`) that also appears in
   `outstanding.md`.
9. **Limits and out of scope** — what the app deliberately does not do, and why.
10. **History** — the `history.md` entries that shaped this line (date and title).

## Writing rules

- Cite code as `us-tax-be/src/main/java/.../TaxReturnComputeService.java:1234` (path relative to `C:\us-tax`).
- Describe what the code does, not what a comment says it does — read the code.
- Plain language first; method and field names in `code` font after the plain description.
