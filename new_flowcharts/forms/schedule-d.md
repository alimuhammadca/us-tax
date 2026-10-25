# Schedule D (Form 1040) — flowchart (as the code does it)

IRS rules: `C:\us-tax\new_lines\forms\schedule-d.md`. Code details and deviations:
`C:\us-tax\new_knowledge\forms\schedule-d.md`. Line 7a side: `C:\us-tax\new_flowcharts\7a.md`.

When Exception 1 is ruled out, `computeCapitalGainLoss` builds Schedule D. Lines 1a / 8a take the broker rows in box
A / D / G / J with no wash sale or QOF box, plus typed "not on any broker statement" totals (D-sch-d-3); lines 1b–3 /
8b–10 take the Form 8949 page totals by box. Lines 4 / 5 / 11 / 12 come from Forms 6781, 6252, 4797, 4684, 8824, 2439
and the K-1s; line 13 is box 2a less nominee plus Form 8814 line 10; lines 6 / 14 are the carryovers (D-7a-3,
D-7a-4). Line 16 = line 7 + line 15. A loss is limited to $3,000 ($1,500 MFS) on line 21 and the rest carried to 2026
by the Capital Loss Carryover Worksheet. When lines 15 and 16 are both gains, the 28% worksheet (lines 1 and 3 not
derived, D-sch-d-2) and the §1250 worksheet (no Form 4797 line 7 cap, D-sch-d-1) give lines 18 / 19, and line 20
picks the QDCG worksheet or the Schedule D Tax Worksheet for Form 1040 line 16 (Form 4952 ignored on the printed
answer, D-sch-d-6). Line 17 and line 22 are answered even where the form says skip (D-sch-d-5); the QOF box is Yes
for a deferral too (D-sch-d-4).

Main code: `computeCapitalGainLoss` (`TaxReturnComputeService.java:23515`), lines 18 / 19 (`:23771-23955`),
Schedule D object (`:24110-24178`), carryover (`:25982`, `:6099`), Schedule D Tax Worksheet (`:12227`, `:12354`).

```mermaid
flowchart TD
    S([Exception 1 ruled out]) --> QOF["QOF box Yes for deferral or disposal - D-sch-d-4"]:::warn
    S --> ROWS[/"Form 8949 rows by box, see the Form 8949 chart"/]:::input
    ROWS --> DIR{"Box A, D, G or J with no wash sale and no QOF box?"}
    DIR -->|yes| L1A["Line 1a or 8a total"]
    DIR -->|no| L1B["Lines 1b, 2, 3, 8b, 9, 10 by box pair"]
    TYP[/"Typed line 1a or 8a proceeds, basis, adjustments"/]:::input --> L1AW["Added to line 1a or 8a - D-sch-d-3"]:::warn
    L1AW --> L1A
    OTH[/"Forms 6781, 6252, 4797, 4684, 8824, 2439; K-1 1065, 1120-S, 1041; typed lines 4, 5, 11, 12"/]:::input --> L45["Lines 4, 5, 11, 12 - D-7a-9, D-7a-10"]
    DIV[/"1099-DIV box 2a less nominee; Form 8814 line 10"/]:::input --> L13["Line 13"]
    CO[/"Carryovers: typed, imported, or prior line 21 - D-7a-3, D-7a-4"/]:::input --> L614["Lines 6 and 14"]:::warn
    L1A --> L7["Line 7 = 1a + 1b + 2 + 3 + 4 + 5 - 6"]
    L1B --> L7
    L45 --> L7
    L614 --> L7
    L1A --> L15["Line 15 = 8a + 8b + 9 + 10 + 11 + 12 + 13 - 14"]
    L1B --> L15
    L45 --> L15
    L13 --> L15
    L614 --> L15
    L7 --> L16["Line 16 = line 7 + line 15"]
    L15 --> L16
    L16 --> SIGN{"Line 16 sign?"}
    SIGN -->|loss| L21["Line 21 = smaller of the loss and 3,000, or 1,500 if MFS"]
    L21 --> CLC[["Capital Loss Carryover Worksheet: short-term loss used first,<br/>taxable-income limit after line 15"]]
    CLC --> NEXTY["nextYear carryovers in out_schedule_d"]:::output
    SIGN -->|zero or loss| L17N["Line 17 printed No - D-sch-d-5"]:::warn
    L17N --> L22["Line 22: qualified dividends? answered on every Schedule D - D-sch-d-5"]:::warn
    SIGN -->|gain| L17{"Line 17: lines 15 and 16 both gains?"}
    L17 -->|no| L22
    L17 -->|yes| W28[["28% Rate Gain Worksheet: typed + K-1 + 2439 1d + 1099-DIV 2d + section 1202 part,<br/>minus short-term loss and long-term carryover"]]
    W28 --> W28X["Lines 1 and 3 collectibles not derived - D-sch-d-2"]:::warn
    L17 -->|yes| W1250[["Unrecaptured 1250 Worksheet: typed + Form 4797 properties + K-1 + 2439 1b + 1099-DIV 2b,<br/>minus loss offset"]]
    W1250 --> W1250X["No cap at the Form 4797 line 7 gain, no line 8 subtraction - D-sch-d-1"]:::warn
    W28X --> L18["Line 18"]
    W1250X --> L19["Line 19"]
    L18 --> L20{"Line 20: lines 18 and 19 both zero?<br/>Form 4952 not checked - D-sch-d-6"}:::warn
    L19 --> L20
    L20 -->|yes| QDCG[["QDCG worksheet"]]
    L20 -->|no| SDTW[["Schedule D Tax Worksheet lines 1-47"]]
    L4G[/"Form 4952 line 4g election"/]:::input --> SDTW
    QDCG --> L16TAX["Form 1040 line 16"]:::output
    SDTW --> L16TAX
    L22 --> L16TAX
    L16 --> L7A["Line 16 or line 21 to Form 1040 line 7a"]:::output
    L21 --> L7A
    L7A --> OUT["scheduleD in out_schedule_d; Schedule D preview"]:::output

    classDef input fill:#e3f2fd,stroke:#1565c0
    classDef flag fill:#ffebee,stroke:#c62828
    classDef output fill:#e8f5e9,stroke:#2e7d32
    classDef warn fill:#fff3e0,stroke:#e65100
    classDef oos fill:#f5f5f5,stroke:#9e9e9e,stroke-dasharray: 5 5
```

Deviation ids in the chart: D-sch-d-1 (§1250 worksheet lines 7–9), D-sch-d-2 (28% worksheet lines 1 and 3),
D-sch-d-3 (typed line 1a / 8a), D-sch-d-4 (QOF box), D-sch-d-5 (line 17 / 22 answered when skipped), D-sch-d-6
(line 20 ignores Form 4952); from line 7a: D-7a-3, D-7a-4 (carryovers), D-7a-9, D-7a-10 (lines 5 / 11 / 12). Not shown:
D-7a-1, D-7a-5, D-7a-8 (Form 8949 side, see the Form 8949 chart).
