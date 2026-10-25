# new_mappings — every statement box and where it goes on the return

One file per statement the app accepts (W-2, W-2G, each 1099, 1098, 1095, 5498, SSA-1099, RRB-1099, the K-1s …).
Each file answers: **for every box on this statement, what is it, where does the app store it, and where does the
IRS say it goes on the 2025 return?**

This replaces the purpose of the old `C:\us-tax\mappings\` files, which held screen coordinates for drawing the
statement image. Coordinates are not covered here.

## Layout of every file

1. **What this statement is** — who sends it, to whom, and why; the IRS instructions used (file in
   `C:\us-tax\docs\books\` and page — for the recipient, usually the "Instructions for Recipient" on the back of
   the form copy, plus the filer instructions).
2. **Box by box** — table:
   `Box` · `IRS caption` · `App field` (the saved key) · `Where it goes on the return (IRS)` · `What the app does` ·
   `Status` (Match / Deviation id / Not used / Not supported).
3. **Checkboxes and codes** — boxes holding a code or a check (for example 1099-R box 7 codes, W-2 box 12 codes),
   each value with its meaning and its destination.
4. **Questions the app asks with this statement** — follow-up questions that decide where an amount goes.
5. **Differences from the IRS instructions** — each with its id (also listed in `outstanding.md`).
6. **IRS sources** — documents and pages used.

## Writing rules

- `App field` is the key the backend reads (check the mapper / compute code, not only the UI template).
- "Where it goes" names the exact form and line, for example `Form 1040 line 1a`, `Schedule B line 1`,
  `Form 8949 Part II, box E`.
- A box the app stores but never uses in the computation says so plainly.
