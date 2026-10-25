# Schedule B (Form 1040) — flowchart (as the code does it)

IRS rules: `C:\us-tax\new_lines\forms\schedule-b.md`. Code details and deviations: `C:\us-tax\new_knowledge\forms\schedule-b.md`.

The amounts come from the line 2b and 3b computation (`computeInterestIncome`, `computeDividendIncome`; see the
`2b`, `3b` charts). Part I items are listed seller-financed first, then each person's 1099 / hand-entered items with
the adjustments as negative items under app labels and no subtotal (D-sch-b-6), then K-1 items. Line 3 is the Form
8815 line 14 applied on the second compute pass. Schedule B is built only when one of the IRS conditions holds. The
three Part III answers are read only from the taxpayer's Interest form, which shows them only after "interest income"
= Yes; anything unanswered becomes "No" (D-sch-b-1). Line 7b is never collected (D-sch-b-3). The preview draws 14
interest and 15 dividend rows (D-sch-b-5).

Main code: `computeInterestIncome` (`TaxReturnComputeService.java:18875-19160`, triggers `:19077-19101`) and
`buildScheduleB` (`TaxReturnComputeService.java:36163-36179`).

```mermaid
flowchart TD
    S([Compute return]) --> L2B[["Line 2b computation - 2b chart"]]
    S --> L3B[["Line 3b computation - 3b chart"]]
    L2B --> ITEMS["Part I items: seller-financed first, then 1099-INT / 1099-OID per payer net of statement premium, hand-entered interest, K-1 items"]
    ITEMS --> ADJ["Adjustments as negative items with app labels, no subtotal; 54A gross-up has no item - D-sch-b-6"]:::warn
    ADJ --> LINE2["Line 2 = interest before exclusion"]
    F8815[["Form 8815 line 14, second pass"]] --> LINE3["Line 3 = applied exclusion"]
    LINE2 --> LINE4["Line 4 = line 2 - line 3, floor 0 = Form 1040 line 2b"]
    LINE3 --> LINE4
    L3B --> DIV["Part II items per payer, nominee row; no Form 8814 item - D-3b-4"]:::warn
    DIV --> LINE6["Line 6 = Form 1040 line 3b"]
    TPF[/"Taxpayer Interest form"/]:::input --> GATE{"Interest income = Yes?"}
    GATE -->|no| CLR["Part III answers cleared or never asked - D-sch-b-1"]:::warn
    GATE -->|yes| P3Q[/"Foreign account box; over 10,000 question; foreign trust box"/]:::input
    SPF[/"Spouse form, MFS spouse leg, dependent's own return: no Part III questions"/]:::input --> CLR
    P3Q --> Q2["7a Q2 asked as over 10,000; grantor not asked - D-sch-b-2, D-sch-b-4"]:::warn
    CLR --> FALSE["Unanswered = false"]
    Q2 --> REQ
    FALSE --> REQ{"Line 2b over 1,500, line 3b over 1,500, nominee, accrued, OID / ABP question, Form 8815, seller-financed, prior-year bond, frozen deposit, 1278b, foreign account or trust?"}
    LINE4 --> REQ
    LINE6 --> REQ
    REQ -->|no| NONE(["No Schedule B - foreign account with no interest form answer is lost - D-sch-b-1"]):::warn
    REQ -->|yes| BUILD["buildScheduleB: header, items, lines 2, 3, 4, 6, Part III booleans"]
    BUILD --> L7B["Line 7b countries not modelled - D-sch-b-3"]:::oos
    BUILD --> OUT["scheduleB / out_schedule_b + item tables"]:::output
    OUT --> PREV["Preview: 14 interest rows, 15 dividend rows, extra items dropped - D-sch-b-5"]:::warn
    OUT --> NEXT[["Form 1040 lines 2b and 3b; line 2 to the Social Security worksheet"]]:::output
    ITEMS --> SELLF>SELLER_FINANCED_LOAN_MISSING_REQUIRED_FIELDS blocks]:::flag
    ITEMS --> PAYF>SCHEDULE_B_PAYER_NAME_MISSING advisory]:::flag

    classDef input fill:#e3f2fd,stroke:#1565c0
    classDef flag fill:#ffebee,stroke:#c62828
    classDef output fill:#e8f5e9,stroke:#2e7d32
    classDef warn fill:#fff3e0,stroke:#e65100
    classDef oos fill:#f5f5f5,stroke:#9e9e9e,stroke-dasharray: 5 5
```

Deviation ids in the chart: D-sch-b-1 (Part III unreachable / defaulted to No), D-sch-b-2 (7a question 2 wording and
blank-vs-No), D-sch-b-3 (no line 7b), D-sch-b-4 (grantor of a foreign trust not asked), D-sch-b-5 (preview row
limit), D-sch-b-6 (adjustment labels, no subtotal, §54A item), D-3b-4 (no Form 8814 item on line 5). Amount
deviations of the feeding lines are on the 2b / 3b charts.
