# Knowledge: Form 1040 Line 1g — Wages from Form 8919

Built from: `lines/1g.md`, `lines/8919.md`, backend compute service, frontend intake + display components, output models, unit tests, E2E tests, YAML files.
Last updated: 2026-05-09 (refreshed during 1g.xlsx Code Validation walkthrough — Issues #1–#10 closure pass; renamed from `knowledge-line-1g-form-8919.md` → `line-1g-form-8919.md` per Issue #5; verification log added per Issue #6).

---

## 1. What is Line 1g?

Form 1040 line 1g holds wages that should have been treated as **employee wages** but whose employer failed to withhold the employee share of Social Security and Medicare tax. The worker files **Form 8919** to compute the uncollected tax, and the wages flow to line 1g.

Line 1g is **not** for:
- True independent contractor income (Schedule C / SE path)
- Unreported tip income (Form 4137 / line 1c)
- W-2 box 12 codes M and N (group-term life uncollected taxes → Schedule 2 line 5)

---

## 2. Trigger: Who Must File Form 8919?

All four conditions must apply to a spouse:
1. Performed services for a firm during the tax year
2. Worker believes the pay was employee wages (not independent-contractor)
3. Firm did **not** withhold the worker's share of SS and Medicare taxes
4. At least one reason code (A, C, G, H) applies

---

## 3. Personal Form IDs

| Form ID | Role |
|---|---|
| `uncollected-ss-medicare-taxpayer` | Taxpayer firm data (Form 8919); drives line 1g (taxpayer portion) |
| `uncollected-ss-medicare-spouse` | Spouse firm data (Form 8919); drives line 1g (spouse portion); MFJ only |

---

## 4. YAML Fields — `1g-uncollected-ss-medicare.yaml`

Multiplicity: `perSpouse` (separate documents for taxpayer and spouse).

### `identity` section (computed/readOnly)
| Field | Notes |
|---|---|
| `taxpayerName` | Imported from identification form |
| `taxpayerSSN` | Imported from identification form |

### `firms` section (multiplicity: multiple; up to 999)
| Field | Required? | Notes |
|---|---|---|
| `firmName` | Yes | Column (a) |
| `firmFederalIdNumber` | Required at compute time (since 2026-05-19) | Column (b); save accepts blank, but compute emits blocking flag `MISSING_FIRM_FEDERAL_ID_FORM_8919_*` when any firm row has it blank. User may enter literal word `unknown` when the EIN is genuinely not known. |
| `reasonCode` | Yes | A, C, G, or H — column (c) |
| `irsDeterminationDate` | Conditional | Required if code A or C — column (d) |
| `received1099MiscOrNec` | No (boolean) | Column (e); contextual for code H |
| `wagesNoFicaNotW2` | Yes | Column (f); contributes to line 6 |

### `imports` section (computed/readOnly)
| Field | Notes |
|---|---|
| `ssWageBaseMax` | `$176,100` (2025); injected from ReferenceData |
| `totalSSWagesTipsRRTAAnd4137` | W-2 box 3 + box 7 + RRTA + Form 4137 line 10 — needed for line 8 |

### `computed` section (readOnly)
All Form 8919 output lines 6–13.

---

## 5. Reason Codes

| Code | Meaning | IRS date required | SS-8 |
|---|---|---|---|
| A | IRS issued determination letter | **Yes** | No |
| C | IRS issued other correspondence | **Yes** | No |
| G | Worker filed Form SS-8, no reply yet | No | **File separately** |
| H | Worker received W-2 and 1099-MISC/NEC from same firm | No | **Do NOT file SS-8** |

---

## 6. Backend Compute Logic

### Entry point
`TaxReturnComputeService.computeUncollectedSSTax(taxpayerData, spouseData, you, spouse, w2Entries, tips, isMfsReturn, flags)` — called during `prepare()`.

The `isMfsReturn` parameter (added 2026-05-09 per 1g.xlsx Issue #1) implements the single-guard MFS cascade: when true, the spouse's `computeForm8919ForPerson` call receives `null` for `data`, `form4137`, and `ssn` → empty result → `addNonNull` aggregations skip spouse → line 1g + Schedule 2 line 6 reflect taxpayer only. The Form 8959 line 3 path (in `computeAdditionalMedicareTax`) is independently gated by `mfj`.

Reads:
- `personalForms.get("uncollected-ss-medicare-taxpayer")` / `...spouse`
- `w2Entries` (all W-2 statements for the return)
- `you` and `spouse` identification forms (SSN extraction)
- `TipComputation` result (provides Form 4137 for line 8 import)
- `isMfsReturn` boolean (single source of truth from `prepare()`)

### MFS gating cascade

| Boolean | Source | Effect |
|---|---|---|
| `isMfsReturn` | derived in `prepare()` from `filing-status` | Single source of truth; passed to `computeTips`, `computeMedicaidWaiverPayments`, `computeDependentCareBenefits`, `computeAdoptionBenefits`, `computeUncollectedSSTax` |
| MFS guard application | `computeForm8919ForPerson(isMfsReturn ? null : spouseData, ...)` | Spouse Form 8919 result is `Form8919Result(null, null, null)` on MFS → no contribution |
| Cascade outputs (all auto-gated) | `addNonNull` semantics | line 1g (taxpayer only); Schedule 2 line 6 (taxpayer line 13 only); `form8919Spouse` is null |

### Per-spouse computation — `computeForm8919ForPerson()`

```
line6 = Σ wagesNoFicaNotW2 across all firm rows

line7 = 176,100   (2025 SS wage base; from ReferenceData.SOCIAL_SECURITY_WAGE_BASE)

line8 = Σ W-2.box3 (SS wages, SSN-filtered)
      + Σ W-2.box7 (SS tips, SSN-filtered)
      + Σ RRTA compensation (W-2 box 14 RRTA fields, SSN-filtered)
      + Form4137.line10 (unreported tips subject to SS, for same spouse)

line9  = max(0, line7 − line8)     // Remaining SS wage base
line10 = min(line6, line9)          // Wages subject to SS tax
line11 = line10 × 0.062             // Uncollected SS tax
line12 = line6  × 0.0145            // Uncollected Medicare tax (no wage base cap)
line13 = line11 + line12            // Total uncollected → Schedule 2 line 6
```

### Aggregation to Form 1040

```
form1040.income.uncollectedSocialSecurityMedicareWages
    = taxpayer.line6 + spouse.line6   [= Form 1040 line 1g]

schedule2.otherTaxes.uncollectedSocialSecurityMedicareTaxOnWages
    = taxpayer.line13 + spouse.line13   [= Schedule 2 line 6]
```

### Form 8959 integration

If Form 8959 is required (Medicare wages > threshold):
```
form8959.line3UncollectedWages += form8919Taxpayer.line6
form8959.line3UncollectedWages += form8919Spouse.line6   // MFJ
```

### Upstream dependency on Form 4137

`computeUncollectedSSTax()` receives the `TipComputation` result as a parameter. Form 4137 must be computed first so that `form4137.line10` is available for Form 8919 line 8. Execution order:

```
computeTips()  [produces Form 4137]
  ↓
computeUncollectedSSTax(tips, ...)  [uses Form 4137 line 10 for line 8]
```

### Flags inventory

| Flag | Condition | Blocking |
|---|---|---|
| `FORM8919_REASON_CODE_INVALID_TAXPAYER` | Code not in {A, C, G, H} | Yes |
| `FORM8919_REASON_CODE_INVALID_SPOUSE` | Same for spouse | Yes |
| `FORM8919_IRS_DATE_REQUIRED_TAXPAYER` | Code A or C, no `irsDeterminationDate` | Yes |
| `FORM8919_IRS_DATE_REQUIRED_SPOUSE` | Same for spouse | Yes |
| `FORM8919_SS8_REQUIRED_TAXPAYER` | Code G (informational: file SS-8 separately) | No |
| `FORM8919_SS8_REQUIRED_SPOUSE` | Same for spouse | No |
| `FORM8919_CODE_H_1099_TAXPAYER` | Code H but `received1099MiscOrNec = false` | **Yes** (rules.md §17 non-overrideable; promoted 2026-05-31 from soft warning) |
| `FORM8919_CODE_H_1099_SPOUSE` | Same for spouse | **Yes** (rules.md §17 non-overrideable) |
| `FORM8919_LINE1C_COLLISION_TAXPAYER` | BOTH Form 4137 AND Form 8919 generated for taxpayer (added 2026-05-09 per 1g.xlsx Issue #3) | No (soft cross-form reminder — verify no double-count of same payment on lines 1c + 1g) |
| `FORM8919_LINE1C_COLLISION_SPOUSE` | Same for spouse | No |

---

## 7. Output Model

`Form8919.java`:
| Field | Value |
|---|---|
| `header` | Taxpayer name + SSN |
| `firms` | List of `Form8919Firm` objects |
| `line6TotalWages` | Sum of column (f) |
| `line7MaxWagesSubjectToSsTax` | $176,100 |
| `line8TotalSsWagesTipsRrtaUnreportedTips` | W-2 box 3+7 + RRTA + Form 4137 line 10 |
| `line9Line7MinusLine8` | max(0, line7 − line8) |
| `line10WagesSubjectToSsTax` | min(line6, line9) |
| `line11SocialSecurityTax` | line10 × 6.2% |
| `line12MedicareTax` | line6 × 1.45% |
| `line13TotalUncollectedTax` | line11 + line12 |

`TaxReturnComputation` fields:
- `form8919Taxpayer` — `Form8919` (null if not applicable)
- `form8919Spouse` — `Form8919` (null if not applicable)
- `form1040().income.uncollectedSocialSecurityMedicareWages` — line 1g

---

## 8. Frontend

### Intake forms
| Component | Form ID | Tab |
|---|---|---|
| `form-uncollected-ss-medicare-taxpayer.component.ts` | `uncollected-ss-medicare-taxpayer` | Family Head |
| `form-uncollected-ss-medicare-spouse.component.ts` | `uncollected-ss-medicare-spouse` | Spouse |

Both components render:
- Repeatable firm rows (Add/Remove/Clear); max 999 firms
- `firmName` — `pInputText`
- `firmFederalIdNumber` — `pInputText`
- `reasonCode` — **`p-select`** with options A/C/G/H (4 options — multi-option select, not boolean; `p-select` appropriate)
- `irsDeterminationDate` — `pInputText` date field; conditionally shown when code A or C
- `received1099MiscOrNec` — **`p-select`** Yes/No (boolean field; ⚠ **ui.md Rule 7 violation** — should be radio buttons)
- `wagesNoFicaNotW2` — **`p-inputNumber`** (⚠ E2E tests use `page.fill()` which does not work on `p-inputNumber`)

### Tax return display forms
| Component | Form ID | Condition |
|---|---|---|
| `form-tax-return-8919-taxpayer.component.ts` | `tax-return-8919-taxpayer` | `computation?.form8919Taxpayer` |
| `form-tax-return-8919-spouse.component.ts` | `tax-return-8919-spouse` | `computation?.form8919Spouse` |

Sidebar wiring is conditional — Form 8919 items appear only after compute when the relevant `form8919Taxpayer`/`form8919Spouse` output is non-null.

PDF export:
- Template: IRS `f8919.pdf` from `public/irs/`
- Multi-page: `buildMultiPagePdf()` chunks firms in groups of 5; computation lines 6–13 filled on first page only; extra pages appended via `pdf-lib` `copyPages()`

### Sidebar entries (Incomes section)
| Label | Form ID | Tab |
|---|---|---|
| Uncollected Social Security | `uncollected-ss-medicare-taxpayer` | Family Head |
| Uncollected Social Security | `uncollected-ss-medicare-spouse` | Spouse |

---

## 9. Multi-page Rule (> 5 Firms)

Form 8919 holds 5 firm rows per page. If a spouse has > 5 firms:
- `buildMultiPagePdf()` splits firms into groups of 5
- Each group generates one page; computation lines (6–13) filled on first page only
- Overflow pages get lines 1–5 only
- Backend `computeForm8919ForPerson()` sums all firms regardless of count; no backend pagination needed

**Resolved 2026-04-09.** Multi-page PDF implemented.

---

## 10. Unit Test Coverage (refreshed 2026-05-09)

File: `TaxReturnComputeServiceTest.java` — **14 dedicated Form 8919 unit tests** (was 4 pre-audit; +10 added during 1g.xlsx walkthrough Issues #1, #3, #4).

| Test | Scenario |
|---|---|
| `computesForm8919Line1gAndSchedule2Line6` | Single taxpayer firm (code A, IRS date, 1099 received); line 6 = $10k; line 13 = $765 |
| `form8919_sixFirmsAllWagesSummedToLine6` | Six firms aggregate; line 6 = sum across all rows |
| `includesForm8919WagesInAdditionalMedicareTax` | AMT trigger via line 6 (Medicare wages > threshold) |
| `flagsMissingIrsDateForForm8919ReasonCodeA` | Code A without IRS date → blocking flag |
| `mfsExcludesSpouseForm8919FromLine1g` | 1g.xlsx Issue #1 — MFS spouse-skip cascade (taxpayer $7k; stale spouse $5k → line 1g = $7k, form8919Spouse = null) |
| `emitsLineCollisionAdvisoryWhenBothForm4137AndForm8919GeneratedForTaxpayer` | 1g.xlsx Issue #3 — line 1c collision advisory fires when both forms generated |
| `noLineCollisionAdvisoryWhenOnlyForm8919Generated` | 1g.xlsx Issue #3 — sanity (Form 8919 alone → no advisory) |
| `mfsSuppressesSpouseLineCollisionAdvisory` | 1g.xlsx Issue #3 — Issue #1 cascade suppresses spouse-side advisory on MFS |
| `form8919RrtaCompensationContributesToLine8` | 1g.xlsx Issue #4(b) — W-2 box 14 RRTA contributes to line 8 ($50k RRTA + $20k box 3 → line 8 = $70k) |
| `form8919Form4137Line10ContributesToLine8` | 1g.xlsx Issue #4(c) — cross-form: Form 4137 line 10 included in Form 8919 line 8; locks `computeTips` → `computeUncollectedSSTax` execution order |
| `form8919CodeHWithout1099EmitsSoftWarning` | 1g.xlsx Issue #4(d) — `FORM8919_CODE_H_1099_TAXPAYER` non-blocking warning |
| `form8919CodeGEmitsSS8Advisory` | 1g.xlsx Issue #4(e) — `FORM8919_SS8_REQUIRED_TAXPAYER` non-blocking advisory; no IRS date needed for code G |
| `form8919SsWageBaseCapZerosLine10` | 1g.xlsx Issue #4(f) — SS wage base reached → line 9/10/11 = 0; Medicare (line 12) still applies (no annual cap) |
| `form8919MfjBothSpousesAggregateLine1gAndSchedule2Line6` | 1g.xlsx Issue #4(g) — MFJ aggregation: $7k + $5k = $12k line 1g; $536 + $383 = $919 Schedule 2 line 6 |

---

## 11. E2E Test Coverage

File: `e2e/tests/line1g-uncollected-ss-medicare.spec.ts` — 7 tests.

| Test | Type | Scenario |
|---|---|---|
| Form 8919 wages flow to line 1g and Schedule 2 line 6 | UI | Code A, single firm, $10k wages, SS base partial |
| Spouse Form 8919 wages flow to line 1g | UI | Code C, spouse firm, $5k |
| Six firms aggregate to Form 8919 line 6 | API | 6 × code G firms; total = $21k; PDF limit exercised |
| Form 8919 line 6 → Form 8959 line 3 | API | W-2 Medicare wages > $200k; AMT triggered |
| SS wage base cap limits line 10 | API | W-2 box 3 = $170k; line 9 = $6,100; line 10 = $6,100 |
| Code G → non-blocking SS-8 advisory flag | API | Flag present, non-blocking; no date-required flag |
| Code H with 1099 — no IRS date needed | API | Code H, received1099=true; no blocking flags |
| MFJ: both spouses aggregate into line 1g | API | Taxpayer $7k + spouse $5k = $12k |

**Not covered by E2E** (refreshed 2026-05-09 — many now covered at unit-test layer):
- Blocking flag when code A/C used without IRS date — **closed at unit layer** by `flagsMissingIrsDateForForm8919ReasonCodeA`; E2E coverage still missing
- Soft warning when code H used with `received1099MiscOrNec = false` — **closed at unit layer** by `form8919CodeHWithout1099EmitsSoftWarning`; E2E coverage still missing
- Form 4137 line 10 inclusion in Form 8919 line 8 (cross-form interaction) — **closed at unit layer** by `form8919Form4137Line10ContributesToLine8`; E2E coverage still missing
- RRTA compensation in Form 8919 line 8 — **closed at unit layer** by `form8919RrtaCompensationContributesToLine8`; E2E coverage still missing
- MFS guard (1g.xlsx Issue #1) — **closed at unit layer** by `mfsExcludesSpouseForm8919FromLine1g`; E2E test still missing (1g.xlsx Issue #9, deferred)
- Line 1c collision advisory (1g.xlsx Issue #3) — **closed at unit layer** by 3 advisory tests; E2E coverage not added (low practical incidence)
- Both code A and code C blocking paths separately — code A unit-test exists; code C still uncovered separately

---

## 12. 2025 Constants

| Constant | 2025 Value | 2024 Value |
|---|---|---|
| SS wage base (line 7) | **$176,100** | $168,600 |
| SS tax rate (line 11) | 6.2% | 6.2% |
| Medicare rate (line 12) | 1.45% | 1.45% |
| AMT threshold — Single/HOH/QSS | $200,000 | $200,000 |
| AMT threshold — MFJ | $250,000 | $250,000 |
| AMT threshold — MFS | $125,000 | $125,000 |

---

## 13. Known Gaps (refreshed 2026-05-09)

### Open

| Gap | Type | Severity | Documented |
|---|---|---|---|
| `received1099MiscOrNec` boolean uses `p-select` instead of radio buttons | UI violation (Rule 7) | Medium | outstanding.md (UI-side; xlsx-export side resolved 2026-05-09 by Issue #2) |
| `electCombatPay` boolean (combat pay forms) uses `p-select` instead of radio buttons | UI violation (Rule 7) | Medium | outstanding.md |
| E2E `addFirm` helper uses `page.fill()` on `p-inputNumber` (`wagesNoFicaNotW2`) | E2E bug | Medium | outstanding.md |
| No E2E test for MFS guard (1g.xlsx Issue #1) | Test coverage | Low | 1g.xlsx Issue #9 — open (deferred E2E for the new MFS-guard behavior) |
| W-2 box 12 codes M/N (uncollected SS/Medicare on group-term life insurance > $50k for FORMER employees) → Schedule 2 line 5 | NOT IMPLEMENTED — observation | Low | 1g.xlsx Issue #10 — out of scope for line 1g audit; verify whether implemented elsewhere or also deferred |

### Closed during 1g.xlsx walkthrough (2026-05-09)

| Closed gap | Closed by |
|---|---|
| MFS guard at orchestrator level | 1g.xlsx Issue #1 — `isMfsReturn` parameter on `computeUncollectedSSTax` + spouse-skip cascade |
| `form-uncollected-ss-medicare-*.xlsx` missing `reasonCode` field | 1g.xlsx Issue #2 — `generate-form-xlsx.js` regex updated to include `p-select` and `p-datepicker` (modern PrimeNG names); 118 input xlsx files regenerated |
| Line 1c collision (Form 4137 + Form 8919 same person) | 1g.xlsx Issue #3 — non-blocking advisory + cascade-aware suppression on MFS |
| Test coverage gaps (RRTA, Form 4137 cross-form, code H soft warning, code G advisory, SS wage base cap, MFJ aggregation) | 1g.xlsx Issue #4 — 6 new unit tests added |
| Knowledge-file naming deviation (`knowledge-line-1g-` prefix) | 1g.xlsx Issue #5 — renamed to `line-1g-form-8919.md` |
| Knowledge-file outdated content | 1g.xlsx Issue #6 — this refresh |
| Form 4137 null-safety on line 8 | 1g.xlsx Issue #7 — verified false positive (no fix needed) |
| Line 7 ($176,100) only set when form generated | 1g.xlsx Issue #8 — verified correct (no fix needed) |

---

## 14. Verification log

- **2026-05-09** — 1g.xlsx Code Validation walkthrough through Issue #6 (Issues #1–#8 closed; #9, #10 open):
  - **Issue #1** (MFS guard not in orchestrator): Added `boolean isMfsReturn` parameter to `computeUncollectedSSTax`; on MFS the spouse's `computeForm8919ForPerson` call receives `null` for `data`, `form4137`, and `ssn` → empty result via `getList(null, "firms")` → `hasAnyForm8919Inputs` returns false → early-return `Form8919Result(null, null, null)`. Single-guard cascade through `addNonNull` for line 1g + Schedule 2 line 6. Form 8959 line 3 path (in `computeAdditionalMedicareTax`) already gated by `mfj`. Same pattern as line 1c #1, 1d #1, 1e #2, 1f #2. Test: `mfsExcludesSpouseForm8919FromLine1g`. Net +1 test.
  - **Issue #2** (input xlsx out of sync with YAML — `reasonCode` missing): Root cause was `generate-form-xlsx.js` regex didn't include `p-select` (modern PrimeNG name; legacy was `p-dropdown`) or `p-datepicker` (legacy was `p-calendar`). Added both to the alternation list; regenerated 118 input xlsx files (3,188 fields). 42 form components using `<p-select>` + any using `<p-datepicker>` benefited. Verified: `form-uncollected-ss-medicare-taxpayer.xlsx` now contains `reasonCode` at row 3. No test changes (pure documentation refresh).
  - **Issue #3** (line 1g vs line 1c collision guard incomplete): Added non-blocking `FORM8919_LINE1C_COLLISION_{TAXPAYER,SPOUSE}` advisory inside `computeForm8919ForPerson` after the form8919 result is built, when `form4137 != null` for that person. Trusts user judgment but flags the cross-form scenario without false-positive blocking. Auto-detection (per-row fuzzy payer-name + dollar-overlap matching) rejected as over-engineering. Tests: `emitsLineCollisionAdvisoryWhenBothForm4137AndForm8919GeneratedForTaxpayer`, `noLineCollisionAdvisoryWhenOnlyForm8919Generated`, `mfsSuppressesSpouseLineCollisionAdvisory`. Net +3 tests.
  - **Issue #4** (test coverage gaps): Added 6 new unit tests for previously uncovered branches — RRTA (b), Form 4137 line 10 cross-form (c), code H without 1099 soft warning (d), code G advisory (e), SS wage base cap (f), MFJ both-spouses aggregation (g). Sub-bullet (a) MFS guard already closed by Issue #1. Net +6 tests; total Form 8919 unit tests = 14.
  - **Issue #5** (knowledge file naming deviation): Renamed `knowledge/knowledge-line-1g-form-8919.md` → `knowledge/line-1g-form-8919.md` to match the established `line-{N}-{topic}.md` pattern across line 1c/1d/1e/1f knowledge files. No content change. Plain `mv` (project root not a git repo).
  - **Issue #6** (this refresh): Updated header date; updated §6 entry-point signature with `isMfsReturn` + added MFS gating cascade table; added `FORM8919_LINE1C_COLLISION_*` to flag inventory; replaced §10 1-test undercount with the full 14-test inventory; updated §11 "Not covered by E2E" to reflect closures-at-unit-layer; restructured §13 into Open + Closed sub-tables; added this verification log.
  - **Issue #7** (Form 4137 null-safety on line 8): Verified false positive — `form4137 == null ? null : form4137.getLine10UnreportedTipsSubjectSocialSecurity()` is correct; `addNonNull` semantics handle null gracefully. No code change.
  - **Issue #8** (line 7 not set when form null): Verified correct — when `firmEntries` is empty, no Form 8919 generated and no constants set; correct behavior (no form, no constant). No code change.
- Backend test count: **718/718 passing as of 2026-05-09** (started at 708 from end of 1f closeout; +10 net for 1g Issues #1–#8 = +1(#1) +0(#2) +3(#3) +6(#4) +0(#5) +0(#6) +0(#7) +0(#8)).
- Open audit items: Issue #9 (E2E test for MFS guard — deferred until E2E sweep) and Issue #10 (W-2 box 12 codes M/N → Schedule 2 line 5 — observation, out of scope for line 1g).
