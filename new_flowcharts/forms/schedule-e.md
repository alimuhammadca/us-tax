# Schedule E — flowchart (as the code does it)

IRS rules: `C:\us-tax\new_lines\forms\schedule-e.md`. Code details and deviations: `C:\us-tax\new_knowledge\forms\schedule-e.md`.

Before the compute, rental expenses entered as whole-year totals are split by rental / personal days, and only then is
a linked Form 1098 copied into line 12 — so the 1098 interest is never split (D-sch-e-5). Each property on the
"Rental & royalty income" forms (taxpayer and spouse; on MFS the spouse's only by community share) is figured: rented
under 15 days while used as a home → dropped; rents and royalties less lines 5–19 and depreciation / depletion; a home
used as a home is held to its rent with carryovers. The at-risk cap (Form 6198) follows, then the property is classed
nonpassive (real estate professional — the owner only, D-sch-e-7) or put in the shared §469 pool with farm rentals,
passive K-1s and the typed other passive income (Form 8582; royalties and homes used as a home are pooled too —
D-8582-6, D-8582-7). The pool's result is line 26, which therefore also holds passive K-1 amounts (D-sch-e-2). Line 32 is
nonpassive K-1 box 1 of partnerships, S corporations **and** trusts (D-sch-e-2), with no basis limit (D-sch-e-8). Trust
K-1 boxes 5, 7, 8 and REMICs never enter (D-sch-e-3, D-sch-e-6). Line 41 = 26 + 32 + 40, while Schedule 1 line 5 also adds
the K-1 royalties (D-sch-e-1). The preview's per-line detail is incomplete (D-sch-e-4).

Main code: `computeRentalScheduleE` (`TaxReturnComputeService.java:30490`), `computeScheduleEOutput`
(`TaxReturnComputeService.java:31383`), Schedule 1 line 5 (`TaxReturnComputeService.java:32268-32279`).

```mermaid
flowchart TD
    S([Compute return]) --> SPLIT["Whole-year totals split by days<br/>personal taxes and interest to Schedule A"]
    RI[/"Rental and royalty form per person<br/>rents, royalties, lines 5-19, depreciation, days,<br/>participation, at risk, prior losses"/]:::input --> SPLIT
    SPLIT --> F1098["Linked Form 1098 box 1 x share fills a blank line 12<br/>after the split - D-sch-e-5"]:::warn
    F98[/"Form 1098 statements"/]:::input --> F1098
    F1098 --> MFS{"MFS return?"}
    MFS -->|"yes: spouse form dropped<br/>unless community share"| PROP
    MFS -->|no| PROP["One column per property"]
    PROP --> U15{"Used as a home and<br/>rented under 15 days?"}
    U15 -->|yes| DROP["Not reported"]
    DROP --> UF>RENTAL_UNDER_15_DAYS_INTEREST_AND_TAXES_NOT_DEDUCTED]:::flag
    U15 -->|no| L21["Line 21 = rents or royalties - lines 5-19 - line 18<br/>depletion: percentage or cost"]
    L21 --> HOME{"Used as a home<br/>or below market?"}
    HOME -->|yes| VAC["Limit to rent: interest and taxes, operating, depreciation;<br/>excess carried to 2026"]
    HOME -->|no| ATR
    VAC --> ATR[["Form 6198: loss capped at amount at risk"]]
    ATR --> CLASS{"Nonpassive?<br/>owner is real estate professional,<br/>or exception with material participation"}
    CLASS -->|yes| NP["Nonpassive total<br/>professional status not shared on MFJ - D-sch-e-7"]:::warn
    CLASS -->|no| POOL[["Form 8582 pool: rentals, royalties, homes used as a home,<br/>farm rentals, passive K-1s, typed other passive income"]]
    FARM[/"Form 4835 farm rentals"/]:::input --> POOL
    K1[/"K-1 1065 / 1120-S / 1041: box 1, 2, 3, royalties;<br/>material participation; recipient TIN"/]:::input --> K1SPLIT{"Box 1 with material<br/>participation No, or box 2 / 3?"}
    K1SPLIT -->|yes| POOL
    K1SPLIT -->|"no: box 1 nonpassive"| L32["Line 32 = 1065 box 1 at-risk capped + 1120-S box 1 + 1041 box 6<br/>no basis limit, trusts not on line 37 - D-sch-e-2, D-sch-e-8"]:::warn
    K1 -.-> K1X["1041 boxes 5, 7, 8 never read - D-sch-e-3"]:::oos
    REMIC["REMIC Part IV - no input - D-sch-e-6"]:::oos
    POOL --> L26["Line 26 = nonpassive + allowed pool result less farm slice<br/>includes passive K-1 and typed income - D-sch-e-2"]:::warn
    NP --> L26
    POOL --> L40["Line 40 = farm rental slice"]
    L26 --> L41["Line 41 = line 26 + line 32 + line 40"]
    L32 --> L41
    L40 --> L41
    L41 --> OUT["scheduleEDetail, out_schedule_e<br/>preview lines 22, 23c, 25, 43 incomplete - D-sch-e-4"]:::warn
    L26 --> S1L5["Schedule 1 line 5 = line 26 + nonpassive K-1 + K-1 royalties + farm slice<br/>line 41 leaves out K-1 royalties - D-sch-e-1"]:::warn
    L32 --> S1L5
    L40 --> S1L5
    ROY[/"K-1 1065 box 7, 1120-S box 6 royalties"/]:::input --> S1L5
    S1L5 --> NEXT[["Schedule 1 line 10, Form 1040 line 8, AGI"]]:::output
    OUT --> PREV[["Schedule E preview"]]:::output

    classDef input fill:#e3f2fd,stroke:#1565c0
    classDef flag fill:#ffebee,stroke:#c62828
    classDef output fill:#e8f5e9,stroke:#2e7d32
    classDef warn fill:#fff3e0,stroke:#e65100
    classDef oos fill:#f5f5f5,stroke:#9e9e9e,stroke-dasharray: 5 5
```

Deviation ids in the chart: D-sch-e-1 (line 41 vs Schedule 1 line 5, K-1 royalties), D-sch-e-2 (passive K-1 and trust
amounts on the wrong lines), D-sch-e-3 (trust K-1 boxes 5, 7, 8), D-sch-e-4 (preview lines), D-sch-e-5 (Form 1098 after
the days split), D-sch-e-6 (REMIC), D-sch-e-7 (real estate professional on a joint return), D-sch-e-8 (basis limits);
pool classification D-8582-6, D-8582-7 (in `forms\8582.md`).
