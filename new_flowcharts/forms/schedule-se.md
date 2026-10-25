# Schedule SE — flowchart (as the code does it)

IRS rules: `C:\us-tax\new_lines\forms\schedule-se.md`. Code details and deviations: `C:\us-tax\new_knowledge\forms\schedule-se.md`.

`computeScheduleSE` runs once per person (taxpayer, and the spouse unless the return is MFS). A Form 4029 member is
skipped. Line 1a is the Schedule F net of farms not marked line E "No" (D-sch-f-1); line 1b takes off CRP payments when
the person was on Social Security; line 2 is the Schedule C net plus every K-1 box 14 code A (D-sch-se-8), typed
additions and the Medicaid-waiver election (D-sch-se-5), less notary fees, plus the clergy base unless Form 4361 applies.
The regular method multiplies the total by 92.35%; an eligible optional method replaces its category with 2/3 of gross
(capped at $7,240), the other category being floored at zero (D-sch-se-2). Lines 4a, 4b and 4c are rounded; a regular
4c under $400 ends the computation unless there is church income, but an optional amount under $400 is still taxed
(D-sch-se-1). Church income adds line 5b. Line 9 is $176,100 less the person's W-2 boxes 3 + 7, Form 4137 line 10 and
Form 8919 line 10 — no railroad compensation, Form 4852 or territory W-2 (D-sch-se-3, D-sch-se-4). Lines 10 and 11 are
rounded and added into line 12 (Schedule 2 line 4); line 13 is half of line 12 (Schedule 1 line 15). The preview is the
2024 form (D-sch-se-7) and the Schedule 2 line 4 exemption boxes are not set (D-sch-se-6).

Main code: `computeScheduleSE` (`TaxReturnComputeService.java:29128-29496`), called at
`TaxReturnComputeService.java:4087`; Schedule 2 line 4 at `TaxReturnComputeService.java:43880-43886`; Schedule 1
line 15 at `TaxReturnComputeService.java:32872-32874`.

```mermaid
flowchart TD
    S([Compute return - each person]) --> F4029{"Form 4029 approved?"}
    F4029 -->|yes| SKIP([No Schedule SE for this person])
    F4029 -->|no| L1A[/"Line 1a: Schedule F net of farms<br/>not marked line E No - D-sch-f-1"/]:::input
    L1A --> CRP{"CRP present and person<br/>on Social Security?<br/>answer, else SSA / RRB gross found"}
    CRP -->|yes| L1B["Line 1b: subtract Schedule F CRP<br/>and K-1 box 20 code AQ"]
    CRP -->|no| L2
    CRP --> CRPF>SE_CRP_SS_TIMING_UNCONFIRMED or SE_CRP_SS_NOT_FOUND advisory]:::flag
    L1B --> L2[/"Line 2: Schedule C net for SE<br/>+ all K-1 box 14 code A - D-sch-se-8<br/>+ typed tips / group-term life<br/>+ Medicaid line 1d if elected - D-sch-se-5<br/>- notary fees"/]:::input
    L2 --> CLER{"Clergy?"}
    CLER -->|yes| MIN["Ministerial base = housing allowance + ministerial wages<br/>+ ministerial Schedule C; zero if Form 4361"]
    CLER -->|no| OPT
    MIN --> OPT{"Optional method elected<br/>and income test passed?<br/>nonfarm also 2-of-3 and under 5 uses"}
    OPT -->|no| REG["Line 3 x 92.35 percent if positive, else 0"]
    OPT -->|"elected but fails"| OPTF>SE_OPTIONAL_METHOD_ELIGIBILITY or GATE_FAILED advisory]:::flag
    OPTF --> REG
    OPT -->|yes| OPTM["Farm: min of 2/3 gross farm, 7,240<br/>Nonfarm: min of 2/3 gross Schedule C, 7,240 - farm<br/>other category regular, floored at 0 - D-sch-se-2"]:::warn
    REG --> RND["Round lines 4a and 4b; line 4c = 4a + 4b"]
    OPTM --> RND
    CH[/"Church employee income, line 5a"/]:::input --> L5B["Line 5b = round of 5a x 92.35 percent<br/>if 5a is at least 108.28"]
    RND --> FLOOR{"Optional method applied?"}
    FLOOR -->|yes| NOFLOOR["Skip the 400 test - D-sch-se-1"]:::warn
    FLOOR -->|no| U400{"Line 4c under 400?"}
    U400 -->|"yes, no church income"| NOTAX([No SE tax])
    U400 -->|"yes, church income"| ZERO["Line 4c = 0"]
    U400 -->|no| L6
    ZERO --> L6["Line 6 = 4c + 5b"]
    NOFLOOR --> L6
    L5B --> L6
    W2[/"W-2 boxes 3 + 7 with box a = person's SSN"/]:::input --> L8["Line 8d = 8a + Form 4137 line 10 + Form 8919 line 10<br/>no RRTA tier 1, Form 4852, territory W-2 - D-sch-se-3, D-sch-se-4"]:::warn
    L8 --> L9["Line 9 = max of 0 and 176,100 - 8d"]
    L6 --> L10["Line 10 = round of min of 6 and 9 x 12.4 percent<br/>Line 11 = round of line 6 x 2.9 percent"]
    L9 --> L10
    L10 --> L12["Line 12 = 10 + 11<br/>Line 13 = round half-up of line 12 / 2"]
    L12 --> SCH2[["Schedule 2 line 4 = sum of both people's line 12<br/>schedule2.otherTaxes.selfEmploymentTax"]]:::output
    L12 --> SCH1[["Schedule 1 line 15 = sum of line 13<br/>territory proration - D-10-4"]]:::output
    L6 --> F8959[["Form 8959 Part II"]]:::output
    L12 --> DOWN[["EIC, QBI, Schedule 1 lines 16 / 17, IRA compensation"]]:::output
    L12 --> PREV["Schedule SE preview per person: 2024 layout - D-sch-se-7;<br/>Schedule 2 line 4 boxes 1 / 2 / EN not set - D-sch-se-6"]:::warn
    GAPS["Minister's employee expenses, foreign-government pay,<br/>chapter 11, totalization exemption, 434 CRP rule - D-sch-se-9"]:::oos

    classDef input fill:#e3f2fd,stroke:#1565c0
    classDef flag fill:#ffebee,stroke:#c62828
    classDef output fill:#e8f5e9,stroke:#2e7d32
    classDef warn fill:#fff3e0,stroke:#e65100
    classDef oos fill:#f5f5f5,stroke:#9e9e9e,stroke-dasharray: 5 5
```

Deviation ids in the chart: D-sch-se-1 (optional amount under $400 taxed), D-sch-se-2 (other category floored at zero),
D-sch-se-3 (no railroad tier 1 on line 8a), D-sch-se-4 (no Form 4852 / territory W-2 on line 8a; same gap as D-1g-5),
D-sch-se-5 (Medicaid-waiver election without a 2025 source), D-sch-se-6 (Schedule 2 line 4 boxes and line A),
D-sch-se-7 (2024 preview), D-sch-se-8 (K-1 farm code A and codes B / C), D-sch-se-9 (special situations not modelled).
Earlier ids: D-sch-f-1, D-10-4.
