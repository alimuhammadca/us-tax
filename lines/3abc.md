# Form 1040 Lines 3a, 3b, and 3c — Qualified dividends, Ordinary dividends, Child-dividend disclosure

## 1. Line identity

- Form: `1040 / 1040-SR`
- Lines:
  - `3a` = `Qualified dividends`
  - `3b` = `Ordinary dividends`
  - `3c` = *"Check if your child's dividends are included in  1 □ Line 3a   2 □ Line 3b"* *(new for 2025)*
- Concept:
  - `line 3b` is the total ordinary-dividend amount
  - `line 3a` is the qualified-dividend subset of that total
  - `line 3c` is a disclosure checkbox pair — not a dollar amount — indicating whether Form 8814 child dividends are included in lines 3a and/or 3b
- PDF fields:
  - `3a` → `topmostSubform[0].Page1[0].f1_60[0]` (semantic: `line3a_qualified_dividends`)
  - `3b` → `topmostSubform[0].Page1[0].f1_61[0]` (semantic: `line3b_ordinary_dividends`)
  - `3c` box 1 → `c1_33[0]` (semantic: `line3c_child_dividends_included_in_line3a`)
  - `3c` box 2 → `c1_34[0]` (semantic: `line3c_child_dividends_included_in_line3b`)

This is a 2025 line spec.

---

## 2. Core relationship between the three lines

The IRS is explicit:

- Qualified dividends on `line 3a` are also included in the ordinary-dividend total on `line 3b`.

Core invariant:

```
0 <= line3a <= line3b
```

Line 3c is metadata; it does not change the arithmetic of lines 3a or 3b.

---

## 3. Line 3b — Ordinary dividends

### 3.1 What belongs on line 3b

For tax year 2025, line 3b includes total ordinary dividends.

Primary source:

- `1099-DIV box 1a` = total ordinary dividends (per-entry accumulated via `totalOrdinaryDividendsAmount`)

Also includable:

- ordinary dividends not reported on a 1099-DIV (`manualOrdinaryDividendsNotOnStatements`)
- child qualified dividends from `Form 8814 line 9` — added symmetrically to BOTH line 3a and line 3b at the per-return aggregation step (see §5)

Inclusions and exclusions:

- `box 1a` includes short-term capital gain distributions treated as ordinary dividends
- `box 2a` capital gain distributions do **not** belong on line 3b — they route to line 7a via the Schedule D path
- `box 3` nondividend distributions / return of capital do **not** belong on line 3b — they reduce stock basis
- `box 5` Section 199A dividends are a SUBSET of `box 1a` (already counted) — they feed Form 8995 / 8995-A for line 13a separately
- `box 12` exempt-interest dividends route to line 2a
- `box 13` PAB dividends feed Form 6251 line 2g (subset of box 12, not box 1a)

### 3.2 Nominee dividends

If dividends were received as a nominee for someone else, the nominee amount is subtracted from the taxpayer's own line 3b:

```
line3b_person = subtractNonNegative(ordinary, nomineeOrdinaryDividends)
```

`hasNomineeDividends` independently triggers Schedule B Part II regardless of amount.

### 3.3 Line 3b per-person formula

```
ordinary = Σ 1099-DIV box1a + manualOrdinaryDividendsNotOnStatements
line3b_person = subtractNonNegative(ordinary, nomineeOrdinaryDividends)
```

### 3.4 Line 3b per-return formula

```
line3b = roundMoney( addNonNull(taxpayer.ordinaryDividends, spouse.ordinaryDividends)
                     + form8814QualifiedDividendsTotal )      // when hasChildQualifiedDividends
```

### 3.5 Schedule B trigger from dividends

For 2025, Schedule B Part II is required if:

- Ordinary dividends exceed `$1,500`, or
- Ordinary dividends were received as a nominee (independent trigger)

The check is `scheduleBRequiredFromDividends = (line3b > $1,500) OR hasNomineeDividends`. Schedule B Part II line 6 carries `line3b` (NOT line 3a) and Schedule B Part II per-payer detail items come from `scheduleBDividendItems`.

---

## 4. Line 3a — Qualified dividends

### 4.1 What belongs on line 3a

For tax year 2025, line 3a includes total qualified dividends.

Primary source:

- `1099-DIV box 1b` = qualified dividends (per-entry accumulated via `qualifiedDividendsAmount`)

Also includable:

- qualified dividends not reported on statements (`manualQualifiedDividendsNotOnStatements`)
- child qualified dividends from Form 8814 line 9 — added symmetrically to BOTH lines 3a and 3b

`box 1b` is the starting point. Some amounts reported in `box 1b` are not qualified dividends once IRS exceptions apply (see §4.2).

### 4.2 Disallowed-qualified categories (per-person, manual entry)

The 2025 instructions identify five categories that must be removed from candidate qualified dividends when applicable. All five are user-entry fields on `dividend-income-{taxpayer,spouse}`:

- `nomineeQualifiedDividends` — nominee qualified dividends belonging to someone else (also reduces line 3a; nominee ordinary is the line 3b twin)
- `nonQualifiedFromHoldingPeriodCommon61of121` — failed 61-day-in-121 common-stock holding period
- `nonQualifiedFromHoldingPeriodPreferred91of181` — failed 91-day-in-181 preferred-stock holding period when dividend period exceeds 366 days
- `nonQualifiedFromRelatedPaymentObligationShortSale` — related-payment / short-sale failures
- `nonQualifiedPaymentsInLieu` — payments-in-lieu when known / should-know not qualified
- `nonQualifiedSurrogateForeignCorporationDividends` — disallowed surrogate foreign corporation dividends

These categories are manual entry only — the system does not infer them from brokerage history (per-person manual entry by design).

### 4.3 Foreign corporation rule

Dividends from many foreign corporations can still be qualified dividends, but not all. Do not assume every foreign-source amount in `box 1b` remains qualified. The non-treaty foreign corporation manual-classification field is deferred (see `outstanding.md`).

### 4.4 Line 3a per-person formula

```
candidateQualified      = Σ 1099-DIV box1b + manualQualifiedDividendsNotOnStatements
disallowedQualifiedTotal = nomineeQualifiedDividends
                        + nonQualifiedFromHoldingPeriodCommon61of121
                        + nonQualifiedFromHoldingPeriodPreferred91of181
                        + nonQualifiedFromRelatedPaymentObligationShortSale
                        + nonQualifiedPaymentsInLieu
                        + nonQualifiedSurrogateForeignCorporationDividends
line3a_person           = subtractNonNegative(candidateQualified, disallowedQualifiedTotal)

// Per-person cap (silent)
if (line3a_person > line3b_person) line3a_person = line3b_person
```

### 4.5 Line 3a per-return formula

```
line3a = roundMoney( addNonNull(taxpayer.qualifiedDividends, spouse.qualifiedDividends)
                     + form8814QualifiedDividendsTotal )      // when hasChildQualifiedDividends

// Return-level cap with non-blocking flag
if (line3a > line3b):
    line3a = line3b
    emit QUALIFIED_DIVIDENDS_LIMITED_TO_ORDINARY_DIVIDENDS (non-blocking)
```

---

## 5. Line 3c — Child dividend disclosure (new for 2025)

### 5.1 Trigger

```
hasChildQualifiedDividends = hasPositiveAmount(form8814QualifiedDividendsTotal)
```

Both checkboxes fire on the same condition because Form 8814 line 9 (the only child amount that flows to parent's lines 3a/3b) is added to BOTH lines symmetrically.

| Checkbox | Label | Fires when |
|---|---|---|
| 1 (line 3a) | "Check if your child's dividends are included in Line 3a" | `hasChildQualifiedDividends == true` |
| 2 (line 3b) | "Check if your child's dividends are included in Line 3b" | `hasChildQualifiedDividends == true` |

The two checkboxes are conceptually independent (the IRS designed line 3c as two separable disclosures), but the Form 8814 routing architecture makes them practically equivalent — both fire on `line 9 > 0`. The child's non-qualified ordinary dividends route to Schedule 1 line 8z via Form 8814 line 12, so the line 3b checkbox does NOT fire on line 2a > 0 alone.

Lock-in: `form8814OrdinaryDividendsOnlyAboveThresholdDoesNotSetLine3cCheckboxes`.

### 5.2 When line 3c applies

Line 3c must be checked (both boxes) when all of the following are true:

1. The parent elected to report a child's income on their own return using `Form 8814`.
2. The child's income included qualified dividends.
3. Form 8814 line 9 is non-zero.

Line 3c is blank when:

- No Form 8814 is filed.
- Form 8814 was filed but the child had no qualified dividends (only interest or only ordinary dividends).
- Form 8814 line 4 (child's gross income) ≤ $2,700 — the simplified path skips line 9 / 10 / 12.

### 5.3 Form 8814 dividend routing to parent lines

| Form 8814 line | Child income type | Parent destination |
|---|---|---|
| Line 1a | Taxable interest | Bundled into line 12 → Schedule 1 line 8z |
| Line 1b | Tax-exempt interest | Parent's line 2a |
| Line 2a | Ordinary dividends (box 1a) | Residual via line 12 → Schedule 1 line 8z; qualified portion via line 9 → parent's lines 3a / 3b |
| Line 2b | Qualified dividends (box 1b) | Source for the line 9 proportional calculation |
| Line 3  | Capital gain distributions (box 2a) | Source for line 10 → parent's line 7b |
| Line 9  | Qualified dividend portion = line 6 × line 2b / line 4 | **Parent's lines 3a AND 3b** — triggers both line 3c checkboxes |
| Line 10 | Cap gain distribution portion = line 6 × line 3 / line 4 | **Parent's line 7b** |
| Line 12 | line 6 − line 9 − line 10 | **Parent's Schedule 1 line 8z** |

**Key rule**: only Form 8814 line 9 (qualified-dividend proportion above the $2,700 base) flows to parent lines 3a / 3b. Line 9 appears in BOTH because qualified dividends are a subset of ordinary dividends. The full child ordinary dividend amount (line 2a) does NOT independently flow to parent line 3b — only the line 9 qualified portion does.

When line 4 ≤ $2,700, lines 9 and 10 are blank; the entire line 6 amount flows to Schedule 1 line 8z and line 3c does not fire.

### 5.4 PDF rendering semantics

- `Income.line3cChildDividendsInLine3a` and `Income.line3cChildDividendsInLine3b` are `Boolean` fields.
- They are set to `Boolean.TRUE` when `hasChildQualifiedDividends == true`, otherwise left `null` (never `Boolean.FALSE`).
- `null` renders the PDF checkbox as unchecked; `TRUE` renders it checked.

### 5.5 Analogous checkbox on line 7b

Line 7b carries an analogous "Includes child's capital gain or loss" checkbox (`line7_includes_child_capital_gain_or_loss`). Line 3c follows the same pattern for dividends.

---

## 6. What does not belong on lines 3a / 3b

- `box 2a` capital gain distributions → line 7a path (Schedule D)
- `box 3` nondividend distributions / return of capital → stock basis reduction
- `box 12` exempt-interest dividends → line 2a
- `box 13` PAB dividends → Form 6251 line 2g (AMT)
- `box 5` Section 199A dividends → line 13a QBI deduction (via Form 8995 / 8995-A); already counted in box 1a
- Form 8814 line 12 residual → Schedule 1 line 8z

---

## 7. Tax computation consequence

Qualified dividends on line 3a trigger the preferential-rate worksheet selection at line 16:

- Schedule D Tax Worksheet, when Schedule D has qualified dividends or capital gains
- QDCG (Qualified Dividends and Capital Gain Tax) Worksheet, otherwise

### 7.1 Qualified dividend / capital gain rate brackets (2025)

| Rate | Single / MFS | MFJ / QSS | HOH |
|---|---|---|---|
| 0% | Taxable income ≤ $48,350 | ≤ $96,700 | ≤ $64,750 |
| 15% | $48,351 – $533,400 | $96,701 – $600,050 | $64,751 – $566,700 (approx.) |
| 20% | > $533,400 | > $600,050 | > $566,700 (approx.) |

### 7.2 NIIT (Form 8960)

Qualified dividends are subject to the 3.8% NIIT via Form 8960 above MAGI thresholds ($200k Single/HOH/MFS, $250k MFJ/QSS). **NIIT is out of scope** for this system.

---

## 8. Current program behavior

### 8.1 Lines 3a / 3b

- `1099-DIV box 1a` (`totalOrdinaryDividendsAmount`) feeds ordinary dividends.
- `1099-DIV box 1b` (`qualifiedDividendsAmount`) feeds candidate qualified dividends.
- `1099-DIV box 13` (`specifiedPrivateActivityBondDividendsAmount`) is accumulated separately and passed to `computeLine17()` as the PAB dividend contribution to Form 6251 line 2g.
- Manual ordinary / qualified amounts add at the personal-form layer (`manualOrdinaryDividendsNotOnStatements` / `manualQualifiedDividendsNotOnStatements`).
- Nominee ordinary / qualified amounts subtract per person.
- The five disallowed-qualified categories are user-input on the personal form.
- Line 3a is capped to line 3b at two levels (per-person silent; per-return with `QUALIFIED_DIVIDENDS_LIMITED_TO_ORDINARY_DIVIDENDS` non-blocking flag).
- Schedule B Part II triggers when `line 3b > $1,500` OR `hasNomineeDividends`.
- Per-payer Schedule B Part II detail rows are emitted from `scheduleBDividendItems`.
- Entry attribution is by `recipientTIN` matching taxpayer or spouse SSN via `belongsToPerson()`.
- Legacy fallback: when neither dividend personal form exists, `useLegacyDividendComputation = true` attributes all 1099-DIV entries to the taxpayer (backwards compatibility only).

### 8.2 Line 3c

- `form8814QualifiedDividendsTotal` aggregates `Form8814.line9QualifiedDividends` across elected children (`TaxReturnComputeService.java:459`).
- `hasChildQualifiedDividends = hasPositiveAmount(form8814QualifiedDividendsTotal)` at line 8456.
- When true, `line 9` is added to `line3a` AND `line3b` (lines 8458–8459).
- Both `line3cChildDividendsInLine3a` and `line3cChildDividendsInLine3b` are set to `Boolean.TRUE` from the same `hasChildQualifiedDividends` boolean (lines 8587–8588) — symmetric trigger by design.
- `buildIncome` propagates the booleans only when `Boolean.TRUE.equals(...)` (two-layer null-safe gate at lines 7523 / 7526).

### 8.3 Statement-driven Form 8814 path

When 1099-INT / 1099-DIV statements have a `recipientTIN` matching a registered dependent's SSN, the backend automatically derives Form 8814 line inputs from those statements. Manual `child-interest-dividends` entries for the same SSN can override individual fields.

### 8.4 Statement gating flags

| Flag | Severity | Condition |
|---|---|---|
| `DIVIDEND_STATEMENT_UPLOAD_REQUIRED` | BLOCKING | `hadDividendIncome == true` but `hasUploadedAtLeastOne1099DivStatement != true` |
| `DIVIDEND_1099_DIV_UPLOAD_CONFIRMATION_REQUIRED` | BLOCKING | `confirmAllReceived1099DivUploaded != true` |
| `MISSING_UPLOADED_1099_DIV_DIVIDEND_WORKFLOW` | BLOCKING | `received1099Div == true` but `uploaded1099Div != true` |
| `QUALIFIED_DIVIDENDS_LIMITED_TO_ORDINARY_DIVIDENDS` | NON-BLOCKING | Return-level `line 3a > line 3b` → cap and flag |
| `SECTION199A_DIVIDENDS_EXCEED_ORDINARY_DIVIDENDS_{TAXPAYER,SPOUSE}` | NON-BLOCKING | Per-person `box 5 > box 1a` (issuer error indicator) |
| `MISSING_DIVIDEND_STATEMENTS_{TAXPAYER,SPOUSE}` | NON-BLOCKING | `hadDividendIncome == true` but no 1099-DIV entries matched the person's SSN |
| `FORM8814_CHILD_GROSS_INCOME_TOO_HIGH` | BLOCKING | Child gross income ≥ $13,500 — must file own return |

### 8.5 Code anchors

| Path | Reference |
|---|---|
| `computeDividendIncome` orchestrator | `TaxReturnComputeService.java:8394` |
| `computeDividendForPerson` per-person aggregator | line 8592 |
| `hasChildQualifiedDividends` derivation | line 8456 |
| Form 8814 line 9 → parent 3a/3b | lines 8458–8459 |
| `DividendComputation` constructor (line 3c booleans) | lines 8587–8588 |
| `buildIncome` line 3c propagation (TRUE-or-null) | lines 7523 / 7526 |
| `form8814QualifiedDividendsTotal` aggregation | line 459 |

Personal-form / UI references:

- `C:\us-tax\us-tax-be\src\main\java\com\ustax\microservices\TaxReturnComputeService.java`
- `C:\us-tax\us-tax-ui\src\app\forms\form-dividend-income-taxpayer.component.ts`
- `C:\us-tax\us-tax-ui\src\app\forms\form-dividend-income-spouse.component.ts`
- `C:\us-tax\us-tax-ui\src\app\forms\form-tax-return-1040.component.ts`

---

## 9. Invariants

- `line 3b` equals taxpayer's net ordinary dividends after nominee subtraction (plus child qualified dividends when applicable).
- `line 3a` equals taxpayer's net qualified dividends after all disallowed-category reductions (plus child qualified dividends when applicable).
- `0 ≤ line 3a ≤ line 3b` enforced at two levels.
- Schedule B Part II required if `line 3b > $1,500` OR nominee dividends present.
- `1099-DIV box 2a / 3 / 12 / 13 / 5` must not be misrouted into lines 3a / 3b.
- Both line 3c checkboxes are `Boolean.TRUE` or `null` — never `Boolean.FALSE`.
- Line 3c does not participate in `line 9` arithmetic (Boolean type).
- Form 8814 line 12 must not include the child's qualified-dividend portion (already in line 9).

---

## 10. Compute order and dependencies

1. `prepare(...)` builds Form 8814 records and aggregates `form8814QualifiedDividendsTotal`.
2. `computeInterestIncome(...)` runs and invokes `computeDividendIncome(...)` with the shared `isMfsReturn` guard.
3. `computeDividendForPerson` runs for taxpayer and (on MFJ) spouse: per-person ordinary + qualified + nominee + cap.
4. `computeDividendIncome` aggregates to return level: adds `form8814QualifiedDividendsTotal` to BOTH lines 3a / 3b, applies the return-level cap with flag, sets the line 3c booleans.
5. `buildIncome` writes `ordinaryDividends`, `qualifiedDividends`, and the line 3c boolean checkboxes onto `form1040.income`.

Upstream dependencies: `dividend-income-{taxpayer,spouse}` personal forms; 1099-DIV statements; `identification-{taxpayer,spouse}`; filing status; `child-interest-dividends` statements / dependent records; Form 8814 results.

Downstream consumers:

- `line 3b` → `line 9` total income (3rd operand of the `addNonNull` chain) → AGI → taxable income → line 16
- `line 3a` → line 16 worksheet selection (QDCG or Schedule D Tax Worksheet)
- `Schedule B Part II line 6` = `line 3b`
- `Form 6251 line 2g` (box 13 PAB dividends) via `DividendComputation.form6251Line2gDividends`
- `line 13a` QBI (box 5 Section 199A dividends, subset of box 1a)
- PDF export: `line3a_qualified_dividends`, `line3b_ordinary_dividends`, `line3c_child_dividends_included_in_line3a`, `line3c_child_dividends_included_in_line3b`

---

## 11. Out of scope

- NIIT (Form 8960)
- Auto-classification of non-treaty foreign-corp dividends (deferred — see `outstanding.md`)
- Auto-inference of holding-period failures from brokerage history

---

## 12. Common mistakes (2025)

- Treating `box 1b` as automatically fully qualified without applying IRS exceptions.
- Forgetting that line 3a is a subset of line 3b (double-counting into line 9).
- Treating Schedule B Part II as a `$1,500`-only trigger and missing nominee dividends.
- Misrouting `box 2a` capital gain distributions to line 3b.
- Misrouting `box 12` exempt-interest dividends to lines 3a / 3b.
- Assuming all foreign-source dividends in box 1b are qualified.
- Assuming Form 8814 child ordinary dividends (line 2a) independently flow to parent's line 3b — only line 9 (qualified portion) does.
- Leaving line 3c blank when Form 8814 is used and child qualified dividends are present.

---

## 13. Primary sources

- IRS 2025 Form 1040 (local): `C:\us-tax\docs\IRS-Forms\f1040.pdf`
- IRS 2025 Form 1040 instructions: `https://www.irs.gov/instructions/i1040gi`
- IRS 2025 Form 8814 instructions: `https://www.irs.gov/instructions/i8814`
- IRS 2025 Schedule B instructions: `https://www.irs.gov/instructions/i1040sb`
- IRS 2025 Publication 550: `https://www.irs.gov/publications/p550`
- local reference: `C:\us-tax\docs\books\i1040gi_2025.txt`
- local reference: `C:\us-tax\docs\books\J.K. Lasser Institute - J.K. Lasser's Your Income Tax 2025, Professional Edition (2025) - libgen.li.txt`

---

## 14. Verification log

| Date | Auditor | Scope | Outcome |
|---|---|---|---|
| 2026-05-11 | 3a.xlsx Code Validation walkthrough | Line 3a verification (10 issues) | All closed; two-level cap (per-person + return-level with flag) verified. New lock-in test `dividendsQualifiedExceedingOrdinaryCappedToLine3bViaPerPersonCap`. |
| 2026-05-11 | 3b.xlsx Code Validation walkthrough | Line 3b verification (10 issues) | All closed; Schedule B Part II $1,500-or-nominee trigger verified; Form 8814 child dividend 3-way split documented (line 9 → 3a/3b, line 10 → 7b, line 12 → Sched 1 8z). |
| 2026-05-11 | 3c.xlsx Code Validation walkthrough | Line 3c verification (10 issues) | All closed; symmetric-trigger design documented (both checkboxes share `hasChildQualifiedDividends`); TRUE-or-null PDF semantic verified; Form 8814 line 4 ≤ $2,700 path correctly skips line 3c via three protections. |
| 2026-04-14 | Statement-driven Form 8814 path | Auto-derive Form 8814 inputs from recipientTIN-matched 1099-INT / 1099-DIV statements when no manual `child-interest-dividends` entries exist | Implemented in `computeChildInterestDividends()`; covered by `line8814-statement-driven.spec.ts`. |
