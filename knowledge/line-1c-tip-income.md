# Knowledge: Form 1040 Line 1c — Tip Income Not Reported on Line 1a

Built from: spec, backend compute service, frontend forms, unit tests, E2E tests, YAML files, output models.
Last updated: 2026-05-06 (refreshed during 1c.xlsx Code Validation walkthrough — Issues #1–#9).

---

## 1. What is Line 1c?

Form 1040 line 1c holds taxable tip income that was **not already included in W-2 box 1 (line 1a)**. Three categories belong here:

| Category | Notes |
|---|---|
| Unreported cash and charge tips | Tips received but not reported to employer; includes sub-$20/month tips |
| Allocated tips from W-2 box 8 | Box 8 is not included in box 1; use box 8 amount unless adequate records show lower actual unreported |
| Noncash tips (FMV) | Tickets, passes, merchandise; income only — no Form 4137 tax |

---

## 2. Personal Form IDs

| Form ID | Role |
|---|---|
| `tip-income-taxpayer` | Taxpayer tip employers; drives line 1c and Form 4137 (taxpayer) |
| `tip-income-spouse` | Spouse tip employers; drives line 1c and Form 4137 (spouse); gated on MFJ |
| `uncollected-ss-medicare-taxpayer` | Form 8919 firm data for uncollected SS/Medicare on wages (separate from tips) |
| `uncollected-ss-medicare-spouse` | Same for spouse |

---

## 3. YAML Fields — `tip-income-taxpayer` / `tip-income-spouse`

Section `tipsByEmployer` — multiplicity: multiple (one row per employer).

| Field | Type | Notes |
|---|---|---|
| `employerName` | text | Required; auto-filled from W-2 when possible |
| `employerEIN` | text | Conditionally required — only when Form 4137 would apply for this employer |
| `totalTipsReceived` | amount | W-2 col (c): all cash and charge tips received |
| `totalTipsReportedToEmployer` | amount | W-2 col (d): tips reported to employer |
| `allocatedTipsW2Box8` | amount | Box 8 from W-2; auto-filled |
| `hasAdequateRecordsUnreportedLessThanAllocated` | boolean | True → use `substantiatedUnreportedTipsIfLessThanAllocated` |
| `substantiatedUnreportedTipsIfLessThanAllocated` | amount | Actual unreported; used only when adequate records claimed AND less than allocated |
| `line5Under20PerMonthTips` | amount | Tips under $20/month; reduces Form 4137 line 6 but NOT line 1c |
| `medicareOnlyGovernmentTips` | amount | Federal/state/local govt tips; subject to Medicare (1.45%) only, not SS (6.2%) |
| `nonCashTipsFmv` | amount | FMV of property tips; income only — no FICA tax |
| `rRTACompensationW2Box14` | amount | Railroad retirement compensation; added to SS wage base on Form 4137 |
| `rRTACompensationW2Box14Notes` | text | RRTA Medicare withheld from W-2 box 14 text |
| `socialSecurityWagesW2Box3` | amount | W-2 box 3 fallback when W-2 entries not in system |
| `socialSecurityTipsW2Box7` | amount | W-2 box 7 fallback |

---

## 4. Backend Compute Logic

> *Convention*: code references in this file use **function names** (e.g., `computeTipsForPerson`) rather than source-code line numbers, which drift with refactors. If a line number is required, mark it with a verification date (e.g., "line 11260, verified 2026-05-06"). Established 2026-05-06 (1c.xlsx Issue #9).

### Entry point
`TaxReturnComputeService.computeTips()` — called once per compute pass.

Reads:
- `personalForms.get("tip-income-taxpayer")` / `personalForms.get("tip-income-spouse")`
- `w2Entries` (all W-2 statements for the return)
- `you` and `spouse` identification forms (for SSN extraction)

### Employer EIN required on Form 4137 — single-layer compute-time enforcement (since 2026-05-19)
IRS Form 4137 requires the EIN for each employer row. Single-layer enforcement, per the save-vs-compute principle:
- **UI**: per-row helper `rowNeedsEinForForm4137(employer)` → true when received>reported OR allocated>0. When true, EIN field gets a conditional `*` indicator and an advisory hint block (`form4852-guidance` class) that tells the user the EIN is needed for compute. **Save is never refused.**
- **Backend**: `MISSING_EMPLOYER_EIN_FORM_4137_{TAXPAYER,SPOUSE}` **blocking** flag fires when Form 4137 is built AND any employer in the employer table has blank/missing EIN. Compute is mathematically correct; the resource layer returns HTTP 409 to prevent persisting an unfileable Form 4137. Earlier (2026-05-06 to 2026-05-18) this was a dual-layer enforcement with the UI blocking save and the backend non-blocking; the save-vs-compute pivot on 2026-05-19 moved all enforcement to compute time so the user is never frustrated by an inability to save partial progress.

Tests: `line1cMissingEmployerEinFlag_firesWhenForm4137HasBlankEinCell` (now asserts blocking), `line1cMissingEmployerEinFlag_noFlagWhenEinPresent`, `line1cMissingEmployerEinFlag_noFlagWhenForm4137NotProduced`, and the E2E test `save-vs-compute: tip-income form with Form-4137-eligible employer and blank EIN saves OK; compute returns 409 with MISSING_EMPLOYER_EIN_FORM_4137_TAXPAYER blocking flag` in `line1c-tip-income.spec.ts`.

### SS wage-base sourcing — W-2 is canonical (verified 2026-05-06)
For Form 4137 line 8, `firstNonNull(ssWagesTipsFromW2, ssWagesTipsFromInput)` makes the W-2 canonical. The form-input fallback fields (`socialSecurityWagesW2Box3`, `socialSecurityTipsW2Box7`) fire ONLY when no matching W-2 exists in the system. **Edge case (intentional):** when a matching W-2 has explicit `$0` in boxes 3+7, the W-2 still wins (returns `BigDecimal.ZERO`, not null) — fallback is silently ignored. By design: typo'd W-2s should be corrected at the source. UI help text on both fallback fields marks them "FALLBACK ONLY" with explicit warning. Test: `line1cSsWageBaseW2IsCanonicalEvenWhenZero`.

### Adequate-records claim — single-layer compute-time enforcement (since 2026-05-19)
When the user claims adequate records (`hasAdequateRecordsUnreportedLessThanAllocated=true`), the substantiated amount must be provided OR the claim must be changed to No. Single-layer enforcement, per the save-vs-compute principle:
- **UI**: substantiated field shows an advisory hint block (`form4852-guidance` class) when the claim is true and the amount is missing. **Save is never refused.**
- **Backend**: `ADEQUATE_RECORDS_MISSING_SUBSTANTIATED_AMOUNT_{TAXPAYER,SPOUSE}` **blocking** flag in `computeTipsForPerson` per-employer loop (post-loop emission). When this state occurs, compute uses the allocated-tips override as a fallback, but the resulting Line 1c is wrong (higher than what the user claimed) — the blocking flag prevents persistence so the user can resolve the inconsistency. Earlier (2026-05-06 to 2026-05-18) this was a dual-layer enforcement with the UI blocking save and the backend non-blocking; the save-vs-compute pivot on 2026-05-19 moved all enforcement to compute time so users can always save partial progress.

Tests: `line1cAdequateRecordsClaim_flagFiresWhenSubstantiatedAmountMissing` (now asserts blocking), `line1cAdequateRecordsClaim_noFlagWhenSubstantiatedProvided`, `line1cAdequateRecordsClaim_noFlagWhenAdequateRecordsNotClaimed`, and the E2E test `save-vs-compute: tip-income form with adequate-records claim and no substantiated amount saves OK; compute returns 409 with ADEQUATE_RECORDS_MISSING_SUBSTANTIATED_AMOUNT_TAXPAYER blocking flag` in `line1c-tip-income.spec.ts`.

### `hasUnreportedTips` defensive soft gate (since 2026-05-06)
At the top of `computeTipsForPerson`: if `Boolean.FALSE.equals(hasUnreportedTips)`, return null TipResult immediately. SOFT semantics — null falls through so the W-2 box 8 auto-fill below still works for new users. UI `normalizeForSave` clears `tipsByEmployer` when not exactly true (defense in depth). Mirrors line 1b Issue #2 hardening but soft (not hard) because of the auto-fill convenience. Tests: `line1cDefensiveGate_returnsNullWhenHasUnreportedTipsExplicitlyFalse`, `line1cAutoFill_stillWorksWhenHasUnreportedTipsNotAnswered`.

### Auto-fill from W-2

**Backend (`buildTipEntriesFromW2()`):** If `tipsByEmployer` list is empty, creates synthetic entries for every W-2 with matching SSN that has `allocatedTipsAmount > 0`. This means the user does not need to manually enter anything if they only have W-2 allocated tips.

**Frontend (`form-tip-income-{taxpayer,spouse}.component.ts` — refactored 2026-05-20):** richer behaviour that builds on the same idea:

1. **Auto-create on ngOnInit** for every matching-SSN W-2 (regardless of Box 8) — calls `fillFromW2` which copies employer name, EIN, allocated tips (Box 8), SS wages (Box 3), SS tips (Box 7), and triggers the Box 14 RRTA fuzzy match (see #3).
2. **W-2 picker** at the bottom of the form lists matching-SSN W-2s NOT linked to any tipsByEmployer row (because the user removed them or because they were uploaded after the form was last loaded). Each picker entry has a "Bring into form" button that calls `pickW2()` → `buildEntryFromW2()`.
3. **Box 14 RRTA fuzzy match** (`tryFillRrtaFromBox14`) — scans the W-2's `box14Other` array for labels matching `/rrta|tier\s*[12]|railroad/i` (case-insensitive). On hit: prefills `rRTACompensationW2Box14` with the amount, stores the matched label in the UI-only `rRTAAutoFillSourceLabel`, checks `hasRrtaCompensation`, and renders an attribution banner reading "From W-2 Box 14 code 'XYZ' — confirm this is RRTA compensation." The user dismisses by unchecking the RRTA checkbox.
4. **Box 3 + Box 7 display-only when sourced from W-2.** When `w2AutoFilledFrom` is set, the form renders Box 3 / Box 7 as read-only currency-formatted values with a note: *"These come from your W-2 directly and feed Form 4137 line 8. If they look wrong, fix the W-2 statement at its source."* Preserves the `line1cSsWageBaseW2IsCanonicalEvenWhenZero` contract. When no W-2 is sourced, the editable fallback inputs are shown (their original behaviour). The form-input `socialSecurityWagesW2Box3` / `socialSecurityTipsW2Box7` fields still serve as backend fallback when no matching W-2 exists in the system.

**Pre-existing edge case (not yet fixed):** `buildTipEntriesFromW2` (backend) uses `hasSsn = hasText(normalizedSsn)` to gate SSN filtering. When called for the spouse on a return without spouse identification, `ssn` is null → `hasSsn=false` → ALL W-2s are included (no filter). The taxpayer's W-2 then auto-fills into the spouse path too, double-counting line 1c. Mitigated in practice by Issue #1's MFS guard (skips spouse on MFS) and by the UI requiring spouse identification before the spouse tip-income form is accessible. Worth a future fix — `buildTipEntriesFromW2` should return empty when called with null/empty SSN.

### Per-employer computation

```
unreported = max(0, totalTipsReceived - totalTipsReportedToEmployer)

if allocatedTips > 0:
    if hasAdequateRecords AND substantiated < allocatedTips:
        unreportedForIncome = substantiated          ← adequate-records reduction
    else:
        unreportedForIncome = max(unreported, allocatedTips)  ← take higher
else:
    unreportedForIncome = unreported
```

### Line 1c income formula
```
line1c = sum(unreportedForIncome per employer) + sum(nonCashTipsFmv per employer)
```

### Form 4137 line-by-line
```
Line 2 = sum(totalTipsReceived)
Line 3 = sum(totalTipsReportedToEmployer)
Line 4 = sum(unreportedForIncome)       ← = line 1c minus noncash
Line 5 = sum(line5Under20PerMonthTips)
Line 6 = Line 4 - Line 5               ← subject to Medicare tax

Line 7 = $176,100                       ← 2025 SS wage base
Line 8 = sum(W-2 boxes 3+7 for SSN, or form input fallback) + sum(rRTAComp)
Line 9 = max(0, Line 7 - Line 8)       ← remaining SS base

SS-eligible tips = Line 6 - medicareOnlyGovernmentTips
Line 10 = min(SS-eligible tips, Line 9)
Line 11 = Line 10 × 6.2%               ← SS tax
Line 12 = Line 6 × 1.45%               ← Medicare tax
Line 13 = Line 11 + Line 12            ← total tax → Schedule 2 line 5
```

### Form 4137 creation gate
Form 4137 is created only when:
- `Line 4 > 0` AND (`Line 6 > 0` OR `allocatedTips > 0`)

All-noncash or all-under-$20 scenarios produce **no Form 4137**.

### Missing SS W-2 data flag
If `Line 6 > 0` and SS wages/tips are unavailable from W-2:
- Flag `MISSING_SS_W2_DATA_TAXPAYER` or `MISSING_SS_W2_DATA_SPOUSE` emitted (blocking)
- Medicare tax (line 12) still computed; SS tax (line 11) set to null

### Per-spouse independence + MFS guard (since 2026-05-06)
- Two separate `computeTipsForPerson()` calls on MFJ; each produces its own `Form4137`
- `line1c = taxpayer.line1c + spouse.line1c`
- `totalTipTax = taxpayer.tipTax + spouse.tipTax`
- **MFS guard:** `computeTips(...)` accepts `boolean isMfs`; when true, the spouse `computeTipsForPerson` call is skipped and a null `TipResult` is substituted. Cascades to: `form1040.income.tipIncome` taxpayer-only, `form4137Spouse=null`, `schedule2.unreportedTipIncomeTax` excludes spouse, Form 8959 base excludes spouse Form 4137 line 6. Mirrors the `sumHouseholdEmployeeWages` pattern from line 1b. UI disables the spouse form on non-MFJ; backend gate handles stale-data / direct-API edge cases. Test: `line1cMfsGuard_spouseTipIncomeAndForm4137NotAggregatedOnMfs`.

---

## 5. Downstream integrations

### Schedule 2 line 5
```
schedule2.otherTaxes.unreportedTipIncomeTax = totalTipTax (Form 4137 line 13 aggregate)
```

### Form 8959 (Additional Medicare Tax — 0.9%)
Part I includes `Form 4137 line 6` (unreported tips subject to Medicare) in the total wages used to calculate the 0.9% Additional Medicare Tax on high earners:
```
threshold = $250k MFJ / $200k Single/HOH/QSS / $125k MFS
total = W-2 box 5 wages + Form 4137 line 6 + Form 8919 line 6
additionalMedicareTax = max(0, total - threshold) × 0.009
→ Schedule 2 additionalMedicareTax
```

### Form 1040 line 1c preview
`form1040.income.tipIncome` is the output field name (JSON). The 1040 preview UI label is:
> "Tip income not reported on line 1a (see instructions)"

---

## 6. Frontend Forms

### `form-tip-income-taxpayer.component.ts` / `form-tip-income-spouse.component.ts`
- Repeatable employer section with Add/Remove/Clear controls
- W-2 auto-fill of employer name, EIN, and allocated tips box 8 on component init
- `requiresEmployerEin(index)` — returns true when this employer row would trigger Form 4137 (unreported > 0 after allocated-tips logic)
- Conditional visibility: adequate-records sub-fields shown only when `allocatedTipsW2Box8 > 0`
- Spouse form disabled entirely when filing status is not MFJ

### Sidebar entries
| Section | Sidebar label | Form ID |
|---|---|---|
| Incomes | Tips | `tips-taxpayer` / `tips-spouse` |
| Incomes | Uncollected Social Security | `uncollected-ss-medicare-taxpayer` / `uncollected-ss-medicare-spouse` |
| Tax Return | Form 4137 (You) | `tax-return-4137-taxpayer` |
| Tax Return | Form 4137 (Spouse) | `tax-return-4137-spouse` |

### PDF export
- Template: `us-tax-ui/public/irs/f4137_semantic_labels.pdf` (2025 IRS form, 34 fields)
- Field map: `us-tax-ui/public/irs/f4137_field_map_semantic.csv`
- Component: `form-tax-return-4137-taxpayer.component.ts` and `form-tax-return-4137-spouse.component.ts`
- Default filename prompt: `Form-4137-2025.pdf`

---

## 7. Unit Test Coverage (refreshed 2026-05-06)

File: `TaxReturnComputeServiceTest.java`

| Test | Scenario |
|---|---|
| `computesTipIncomeAndForm4137` | Substantiated adequate records; noncash; under-$20; full Form 4137 computation |
| `computesAdditionalMedicareTaxForTipIncome` | High-income Additional Medicare Tax (0.9%) triggered by tips |
| `line1cMfsGuard_spouseTipIncomeAndForm4137NotAggregatedOnMfs` | Issue #1 — MFS spouse exclusion; line 1c, Form 4137 spouse, Schedule 2 line 5 all skip spouse |
| `line1cDefensiveGate_returnsNullWhenHasUnreportedTipsExplicitlyFalse` | Issue #2 — soft gate when user answered No |
| `line1cAutoFill_stillWorksWhenHasUnreportedTipsNotAnswered` | Issue #2 — soft-gate semantics preserve W-2 box 8 auto-fill for new users |
| `line1cNoncashOnly_lineIncomeReportedButNoForm4137` | Issue #3(c) — noncash-only path; line 1c populated, no Form 4137 (no FICA tax base) |
| `line1cAllUnder20PerMonth_lineIncomeReportedButNoForm4137` | Issue #3(d) — sub-$20 path; line 1c populated, no Form 4137 (line 6 = 0) |
| `line1cMfj_separateForm4137PerSpouse` | Issue #3(e) — MFJ produces separate Form 4137 per spouse; companion to MFS-guard test |
| `line1cForm4137RrtaContributionAddedToLine8` | Issue #3(f) — RRTA box 14 compensation feeds Form 4137 line 8 SS-wage-base |

9 dedicated unit tests (up from 2 as of 2026-05-06). The spec defines 12 scenarios; remaining scenarios (W-2 box 12 codes A/B → Schedule 2 line 13; some of the timely-reported / RRTA-no-Form-4137 corners) are still covered only by E2E tests — see §8 and §9.

---

## 8. E2E Test Coverage (refreshed 2026-05-06)

Files: `e2e/tests/line1c-tip-income.spec.ts` (11 tests) + `e2e/tests/line1c-tip-income-overflow.spec.ts` (2 tests). **13 total** — earlier "7 UI-based tests" claim was outdated.

### Main spec (`line1c-tip-income.spec.ts`)

| Test (line) | Scenario covered |
|---|---|
| Unreported cash tips + missing SS W-2 flag (74) | Spec 2 — unreported cash; `MISSING_SS_W2_DATA` flag |
| Non-cash tips only — no Form 4137 (95) | Spec 4 — noncash income only, no FICA |
| Allocated tips with adequate records (118) | Spec 5 — adequate-records reduction |
| Under-$20 per month reduces line 6 but not line 1c (143) | Spec 7 — sub-$20 mechanic on Form 4137 line 5 |
| Allocated override unreported when higher (166) | Spec 5 — allocated-tips override path |
| Actual unreported override allocated when higher (186) | Spec 5 — unreported wins when greater |
| Under-$20 tips do not create Form 4137 (206) | Spec 7 — full sub-$20 negative path (no Form 4137) |
| Timely-reported tips do not appear on line 1c (230) | **Spec 1** — tips in W-2 box 1 stay on line 1a |
| MFJ both spouses with unreported tips → separate Form 4137 outputs (248) | **Spec 9** — MFJ separate-form rule |
| Form 8919 uncollected SS/Medicare tax flows to Schedule 2 (296) | **Spec 11** — uncollected-SS routing to Schedule 2 |
| RRTA compensation exhausts SS wage base — SS tax zero, Medicare still applies (321) | **Spec 12** — RRTA case |

### Overflow spec (`line1c-tip-income-overflow.spec.ts`)

| Test (line) | Scenario covered |
|---|---|
| 7 employers — all aggregated, none truncated (27) | Form 4137 row overflow above the printed-form 5-row table |
| 10 employers (2-copy boundary) — all aggregated (83) | Multi-page Form 4137 boundary |

### Spec scenarios fully covered

All 12 scenarios from `lines/1c.md` §9 have at least one E2E test (after the 2026-05-06 reconciliation). No "not covered by E2E" gap remains. The xlsx Code Validation #7 (which claimed scenarios 9, 11, 12 were missing) was a false positive — generated against an older state of the test file.

---

## 9. Known Implementation Gaps

See `outstanding.md` for tracked items. Summary:

| Gap | Type | Severity |
|---|---|---|
| E2E missing `test.describe.configure({ retries: 1 })` | Test fragility | Low |
| E2E uses `page.fill()` on amount fields — may fail if they are `p-inputNumber` | Potential flakiness | Medium |
| `buildTipEntriesFromW2` null-SSN fallthrough (double-counts spouse on no-spouse-SSN returns) | Defensive bug | Medium — see `outstanding.md` (Discovered 2026-05-06) |

(Spec scenarios 9, 11, 12 E2E gaps from earlier knowledge-file revisions are now closed — see §8 above. Tests live at `line1c-tip-income.spec.ts:248`, `:296`, `:321` respectively.)

---

## 10. Key Constants (2025)

| Constant | Value | Used in |
|---|---|---|
| `SOCIAL_SECURITY_WAGE_BASE` | $176,100 | Form 4137 line 7 |
| SS tax rate | 6.2% | Form 4137 line 11 |
| Regular Medicare rate | 1.45% | Form 4137 line 12 |
| Additional Medicare rate | 0.9% | Form 8959 / Schedule 2 |
| Additional Medicare threshold (Single) | $200,000 | Form 8959 |
| Additional Medicare threshold (MFJ) | $250,000 | Form 8959 |
| Additional Medicare threshold (MFS) | $125,000 | Form 8959 |
| Additional Medicare threshold (HOH/QSS) | $200,000 | Form 8959 |

---

## Verification log

- **2026-05-06** — Issue #9 (knowledge-file outdated line numbers, from `1c.xlsx` Code Validation) verified resolved: `grep -nE "TaxReturnComputeService\.java"` returns zero matches; all backend code references use function names. Convention captured in §4.
