# new_flowcharts — the computation as a picture

One flowchart per Form 1040 **income-section** line (1a … 11a) and, under `forms/`, per feeding schedule or form —
the same names as `C:\us-tax\new_lines\` and `C:\us-tax\new_knowledge\`.

Each line has two files:

- `<line>.md` — **the source.** A short explanation and the flowchart in Mermaid. It renders in GitHub and VS Code.
- `<line>.drawio` — **generated** from the `.md` for diagrams.net. Do not edit it by hand; change the `.md` and run
  `python _tools/mermaid_to_drawio.py <line>.md` (or `--all`).

Each chart combines what the old `diagrams\` folder showed (where the data comes from and goes) and what the old
`flowcharts\` folder showed (the decisions and steps), and follows the **current code**. A step where the code
differs from the IRS rules is coloured as a warning and names its deviation id (for example `D-1a-1`).

## Shapes and colours

| Shape (Mermaid) | Meaning |
|---|---|
| `([Start])` | start or end |
| `[/W-2 box 1/]` with `:::input` | data entered by the user or read from a statement |
| `[Step]` | a calculation or action |
| `{Question?}` | a decision |
| `[[Form 8949]]` | another form, schedule or worksheet |
| `>FLAG_CODE]` with `:::flag` | a flag or advisory shown to the user |
| `:::output` | the line's result and where it goes next |
| `:::warn` | a step where the code differs from the IRS rules (names the deviation id) |
| `:::oos` | not supported by the app |

Supported Mermaid syntax is listed at the top of `_tools/mermaid_to_drawio.py`; keep charts inside it.
