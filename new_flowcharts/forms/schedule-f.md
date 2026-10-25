# Schedule F — flowchart (as the code does it)

IRS rules: `C:\us-tax\new_lines\forms\schedule-f.md`. Code details and deviations: `C:\us-tax\new_knowledge\forms\schedule-f.md`.

For each farm on the taxpayer's (and, unless the return is married filing separately, the spouse's) "Farm income
(Schedule F)" form, the app first fills blank cooperative lines of a person's only farm from their Form 1099-PATR
(3b set equal to 3a — D-sch-f-5). Gross income is Part I (cash: 1c + 2 + 3b + 4b + 5a + 5c + 6b + 7 + 8, with no line 6d
— D-sch-f-4, and blank taxable boxes counted as 0 — D-sch-f-5) or Part III (accrual: line 44 less cost of goods sold),
plus Form 4797 Part IV recapture. Typed expenses are subtracted with conservation expenses in full (D-sch-f-3) and no
negative entries (D-sch-f-8); line 14 comes from the depreciable-asset engine (section 179 shared with Schedule C) or
the typed field. The at-risk limit and carryforward run next. Every farm's line 34 adds to Schedule 1 line 6 and to
QBI; only farms whose line E is not "No" reach Schedule SE (D-sch-f-1), and line E "No" never triggers Form 8582 or
NIIT (D-sch-f-2). No Schedule F form is produced (D-sch-f-7). Only Form 1099-PATR is read among farm statements
(D-sch-f-6); a QJV farm is not split (D-sch-f-9).

Main code: `computeFarmIntermediates` (`TaxReturnComputeService.java:27610-27678`), `computeScheduleF`
(`TaxReturnComputeService.java:27686-27780`), called at `TaxReturnComputeService.java:4031` and `:4076`; line 6 at
`TaxReturnComputeService.java:32282-32284`.

```mermaid
flowchart TD
    S([Compute return]) --> FARM[/"Farm income form: taxpayer;<br/>spouse unless MFS - one entry per farm"/]:::input
    PATR[/"Form 1099-PATR boxes 1, 2, 3, 5<br/>matched to the person's SSN"/]:::input --> ONE{"One farm and<br/>3a / 3b blank?"}
    FARM --> ONE
    ONE -->|yes| FILL["3a = 3b = 1099-PATR total<br/>(38a / 38b if accrual) - D-sch-f-5"]:::warn
    ONE -->|no| MISM>FORM_1099PATR_FARM_MISMATCH advisory when 3a differs]:::flag
    OTHER[/"1099-G box 7, 1099-MISC box 9,<br/>CCC-1099-G, 1099-A"/]:::input -.-> OTHX["Not read - D-sch-f-6"]:::oos
    FILL --> METH{"Accounting method?"}
    MISM --> METH
    METH -->|cash| CASH["Line 9 = 1c + 2 + 3b or 3a + 4b + 5a + 5c + 6b + 7 + 8<br/>no line 6d - D-sch-f-4; blank 4b / 5c / 6b = 0 - D-sch-f-5"]:::warn
    METH -->|accrual| ACC["Line 9 = line 44 - (45 + 46 - 48)"]
    CASH --> REC["+ Form 4797 Part IV recapture of this farm's assets"]
    ACC --> REC
    REC --> EXP["Lines 10-32: typed expenses + line 32 rows<br/>line 12 conservation in full, no 25 percent cap - D-sch-f-3<br/>no hedging loss, no 263A line 32f - D-sch-f-8"]:::warn
    ASSETS[/"Depreciable assets tagged schedule_f,<br/>matched by line A"/]:::input --> DEP{"Any asset matched?"}
    DEP -->|yes| ENG[["Form 4562 engine: bonus + MACRS;<br/>section 179 shared with Schedule C"]]
    DEP -->|no| DEPT["Typed line 14"]
    EXP --> NET["Net before section 179"]
    ENG --> NET
    DEPT --> NET
    NET --> S179["Line 34 = net - allocated section 179"]
    S179 --> PRIOR[/"Prior-year at-risk carryforward:<br/>per farm, or return-level from SE options"/]:::input
    PRIOR --> AR{"Loss and line 36b<br/>with an amount at risk?"}
    AR -->|yes| CAP[["Form 6198: loss capped, excess carried to 2026"]]
    AR -->|no| LE
    CAP --> LE{"Line E answer is No?"}
    LE -->|yes| NOSE["Left out of Schedule SE, EIC base and<br/>Form 2210-F gross farm income - D-sch-f-1"]:::warn
    LE -->|"no or blank"| SEB["Net, gross and CRP added to the<br/>person's self-employment figures"]
    NOSE --> PAS["No Form 8582 limit, not NIIT income - D-sch-f-2"]:::warn
    LINE6["Schedule 1 line 6 = sum of all farms, rounded<br/>schedule1.additionalIncome.farmIncomeLoss"]:::output
    PAS --> LINE6
    SEB --> LINE6
    SEB --> SE[["Schedule SE line 1a / 1b and Part II base"]]:::output
    LINE6 --> QBI[["QBI: one component per farm, loss farms too"]]:::output
    LINE6 --> F461[["Form 461 - Schedule 1 line 8p"]]:::output
    LINE6 --> F1040[["Form 1040 line 8, line 9, AGI"]]:::output
    CP{"MFS in a community<br/>property state?"} -.-> CPS["Income-tax share split by communityPct;<br/>SE stays with the operator"]
    LINE6 --> CP
    LINE6 --> PREV["Schedule F preview: blank form - D-sch-f-7"]:::oos
    QJV["QJV farm split between spouses - D-sch-f-9"]:::oos

    classDef input fill:#e3f2fd,stroke:#1565c0
    classDef flag fill:#ffebee,stroke:#c62828
    classDef output fill:#e8f5e9,stroke:#2e7d32
    classDef warn fill:#fff3e0,stroke:#e65100
    classDef oos fill:#f5f5f5,stroke:#9e9e9e,stroke-dasharray: 5 5
```

Deviation ids in the chart: D-sch-f-1 (line E "No" removes the farm from Schedule SE, EIC and Form 2210-F), D-sch-f-2
(no Form 8582, no NIIT for a passive farm), D-sch-f-3 (no 25% conservation limit or carryforward), D-sch-f-4 (line 6d
missing, deferral amount mislabelled), D-sch-f-5 (taxable boxes and the 1099-PATR fill), D-sch-f-6 (other farm
statements not read), D-sch-f-7 (no Schedule F output), D-sch-f-8 (no negative entries, §263A, prepaid supplies),
D-sch-f-9 (QJV farm not split).
