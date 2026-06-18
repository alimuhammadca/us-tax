# Form 1040 (2025) - Lines 25a Through 25d: Federal Income Tax Withheld

> Source of truth: 2025 Form 1040 and the 2025 Instructions for Form 1040.

---

## 1. Line Identity

| Sub-line | 2025 Form 1040 label |
|---|---|
| `25a` | Federal income tax withheld from Form(s) W-2 |
| `25b` | Federal income tax withheld from Form(s) 1099 |
| `25c` | Federal income tax withheld from other forms |
| `25d` | Add lines 25a through 25c |

Exact mappings:

```text
Form1040.line25a = Σ W-2 box 2 (taxpayer + spouse non-MFS) + Form 4852 line 7e (taxpayer + spouse non-MFS)
Form1040.line25b = Σ 1099-series box 4 (13 variants) + SSA-1099 box 6 + Form 4852 line 8f
Form1040.line25c = Σ W-2G box 4 + Form 8959 Part V line 24 (positive-filter)
Form1040.line25d = roundMoney(line25a + line25b + line25c)
```

Sub-line totals are each rounded to whole dollars before being summed into 25d (consistency-rounding closure, see §3 below). Each sub-line is set to null when its inputs sum to zero.

`line 25d` is part of the payments section and later feeds:

```text
Form1040.line33 = Form1040.line25d + Form1040.line26 + Form1040.line32
```

All four sub-lines are wired in `computeLine31ThroughLine38` at `TaxReturnComputeService.java:27089-27211`. The method's name is historical — it actually handles lines 25-38.

---

## 2. Core 2025 Formula

```text
line25a = Σ W-2 box 2 (taxpayer + spouse W-2 entries on non-MFS)
        + Form 4852 line 7e (taxpayer + spouse on non-MFS)
        (all rounded to whole dollars; null when total ≤ 0)

line25b = Σ 1099-series box 4
            { 1099-R, 1099-INT, 1099-DIV, 1099-B, 1099-OID, 1099-G,
              1099-NEC, 1099-K, 1099-MISC, 1099-PATR,
              RRB-1099, RRB-1099-R, 1099-DA (new 2025) }
        + SSA-1099 box 6 (non-standard field name — see §4b)
        + Form 4852 line 8f (taxpayer + spouse on non-MFS)
        (rounded to whole dollars; null when total ≤ 0)

line25c = Σ W-2G box 4
        + Form 8959 Part V line 24 (only when > 0 — positive filter)
        (rounded to whole dollars; null when total ≤ 0)

line25d = roundMoney(nz(line25a) + nz(line25b) + nz(line25c))
        (null when total ≤ 0 — ternary at setter)
```

Implementation convention:

```text
Form1040.line25d = nz(line25a) + nz(line25b) + nz(line25c)
```

where `nz(x) = safeAmount(x)` treats null as zero.

---

## 3. Whole-Dollar Sub-Line Rounding (consistency closure)

Each sub-line is rounded to whole dollars before being summed into 25d. This is a recent consistency closure across all three sub-lines:

- **25a §8b G2 closure (2026-06-10)** — `withholdingW2 = withholdingW2 == null ? null : roundMoney(withholdingW2);` at `TaxReturnComputeService.java:27150`
- **25b §9e Gap D closure (2026-06-10)** — `withholding1099 = withholding1099 == null ? null : roundMoney(withholding1099);` at `TaxReturnComputeService.java:27175`
- **25c §8a Gap A closure (2026-06-10)** — `withholdingOther = withholdingOther == null ? null : roundMoney(withholdingOther);` at `TaxReturnComputeService.java:27204`

Before these closures, the W-2G-only path stored the raw `BigDecimal` from `sumFederalWithholdingFromEntries` without rounding while the Form-8959-add branch did round. The inconsistency produced no observable difference on integer-dollar inputs but would surface on any non-integer cents input. The unified rounding mirrors the line 25d top-level `roundMoney` call.

---

## 4. 2025 IRS Routing By Sub-Line

### 4a. Line 25a - Form(s) W-2

IRS rule:

- Add the amounts shown as federal income tax withheld on all `Form W-2`
- The withholding amount is shown in `box 2`

So:

```text
line25a = Σ W-2 box 2 + Form 4852 line 7e
```

The W-2 box-2 sum aggregates **both spouses' W-2 entries** on non-MFS returns. MFS protection is enforced at the **Firestore storage layer** — each household has one user UID, queries are user-scoped, and on MFS only the taxpayer's W-2 entries are loaded. This is the "upstream-data-segregated-at-storage" MFS-protection mechanism documented in the audit trail.

Form 4852 line 7e (W-2-substitute withholding) joins via `extractForm4852Line25aWithholding`:

```java
// TaxReturnComputeService.java:27144-27150
BigDecimal withholdingW2 = sumFederalWithholdingFromEntries(w2Entries);
withholdingW2 = addNonNull(withholdingW2, extractForm4852Line25aWithholding(form4852TaxpayerData));
withholdingW2 = addNonNull(withholdingW2,
        isMfsForForm4852 ? null : extractForm4852Line25aWithholding(form4852SpouseData));
withholdingW2 = withholdingW2 == null ? null : roundMoney(withholdingW2);
payments.setWithholdingW2(withholdingW2);
```

The explicit `isMfsForForm4852` guard at line 27147 is the **only** in-method MFS check needed for line 25a — and it exists only because Form 4852 is a personal form (per-spouse), not a statement (already storage-segregated).

### 4b. Line 25b - Form(s) 1099

IRS rule:

- Include withholding from all 1099-series forms (`box 4`)
- Also include `SSA-1099` box 6, `RRB-1099` box 10, `RRB-1099-R` box 9

13 1099 variants are summed via `sumFederalWithholdingFromMultipleLists` (variadic):

| Form | Status |
|---|---|
| 1099-R | Implemented |
| 1099-INT | Implemented |
| 1099-DIV | Implemented |
| 1099-B | Implemented |
| 1099-OID | Implemented |
| 1099-G | Implemented |
| 1099-NEC | Implemented |
| 1099-K | Implemented |
| 1099-MISC | Implemented |
| 1099-PATR | Implemented (Gap B closure 2026-06-10) |
| RRB-1099 | Implemented |
| RRB-1099-R | Implemented |
| **1099-DA** | **NEW for 2025 — Digital Asset Proceeds From Broker Transactions; box 2a** |

`SSA-1099` box 6 is special — it uses the **non-standard field name** `voluntaryFederalIncomeTaxWithheldAmount` (frontend convention) rather than the canonical `federalIncomeTaxWithheldAmount`. It is summed by a dedicated helper `sumSsa1099Withholding`:

```java
// TaxReturnComputeService.java:27159-27176
BigDecimal withholding1099 = sumFederalWithholdingFromMultipleLists(
        form1099REntries, formRrb1099REntries,
        form1099IntEntries, form1099DivEntries,
        form1099BEntries, form1099OidEntries,
        form1099GEntries, form1099NecEntries, form1099KEntries,
        form1099MiscEntries, formRrb1099Entries, form1099DaEntries,
        // 25b.md Gap B closure (2026-06-10) — 1099-PATR box 4 backup withholding
        form1099PtrEntries);
withholding1099 = addNonNull(withholding1099, sumSsa1099Withholding(formSsa1099Entries));
withholding1099 = addNonNull(withholding1099, extractForm4852Line25bWithholding(form4852TaxpayerData));
withholding1099 = addNonNull(withholding1099,
        isMfsForForm4852 ? null : extractForm4852Line25bWithholding(form4852SpouseData));
withholding1099 = withholding1099 == null ? null : roundMoney(withholding1099);
payments.setWithholding1099(withholding1099);
```

Form 4852 line 8f (1099-R-substitute withholding) joins the same line per the Form 4852 instructions.

Important 2025 correction:

- `1099-K` federal withholding is **box 4**, not box 10 — generic 1099-series box-4 rule applies.
- `1099-DA` federal withholding is in **box 2a**, not box 4 (1099-DA is the new 2025 digital-asset form). The mapper reads box 2a as `federalIncomeTaxWithheldAmount` for compatibility with the variadic helper.

### 4c. Line 25c - Other Forms

The 2025 Form 1040 instructions say line 25c includes:

- federal income tax withheld on `Form(s) W-2G` (`box 4`)
- `Additional Medicare Tax` withheld, from `Form 8959 line 24` (Part V)
- federal income tax withheld shown on a `Schedule K-1`
- tax withheld shown on `Form 1042-S`, `Form 8805`, or `Form 8288-A`

Currently implemented:

```java
// TaxReturnComputeService.java:27180-27205
BigDecimal withholdingOther = sumFederalWithholdingFromEntries(formW2gEntries);

// Form 8959 Part V line 24 with defensive positive filter
BigDecimal form8959Line24 = form8959 == null ? null : form8959.getLine24TotalAmtWithheld();
if (form8959Line24 != null && form8959Line24.compareTo(BigDecimal.ZERO) > 0) {
    withholdingOther = safeAmount(withholdingOther).add(form8959Line24);
}

withholdingOther = withholdingOther == null ? null : roundMoney(withholdingOther);
payments.setWithholdingOther(withholdingOther);
```

The `> 0` guard on Form 8959 line 24 is the **Gap B closure (2026-06-10)** — a defensive positive-filter. Per the 2025 Form 8959 instructions line 24 = `max(0, line22) + line23` with both addends non-negative by construction. A non-positive value would indicate corrupt upstream data and must not silently subtract from Form 1040 line 25c. This mirrors the line-25a (§9 G6) and line-25b (§9d Gap C) positive-filter pattern.

**Deferred OOS (Gap E)** — K-1 / 1042-S / 8805 / 8288-A withholding:

- These source forms exist but their withholding fields are not yet wired into line 25c.
- Documented as implementation gap, not tax-law exclusion.
- Real-return impact is rare (typical filers in current scope do not have K-1/1042-S/8805/8288-A).

### 4d. Line 25d - Total withholding

```text
line25d = nz(line25a) + nz(line25b) + nz(line25c)
```

The 2025 form instruction is exact: `Add lines 25a through 25c.`

Implementation:

```java
// TaxReturnComputeService.java:27208-27211
BigDecimal totalWithholding = roundMoney(safeAmount(withholdingW2)
        .add(safeAmount(withholding1099))
        .add(safeAmount(withholdingOther)));
payments.setTotalWithholding(totalWithholding.compareTo(BigDecimal.ZERO) > 0 ? totalWithholding : null);
```

The `null-when-zero` convention is enforced via a **ternary at the setter** — unique among the four sub-lines (25a/25b/25c each use an inline `roundMoney(...)` with their own ternary before the `setXxx` call; 25d uses the ternary directly inside the `setTotalWithholding(...)` argument).

---

## 5. Major 2025 Guardrails

### 5a. Line 25b includes SSA-1099 and RRB-1099

The official 2025 instructions place these on `line 25b`, not `25c`:

- `SSA-1099` box 6 (via the dedicated `sumSsa1099Withholding` helper — non-standard field name)
- `RRB-1099` box 10
- `RRB-1099-R` box 9

### 5b. Line 25c includes more than W-2G and Form 8959

For 2025, `line 25c` is not limited to W-2G and Additional Medicare Tax withholding. It also includes:

- withholding shown on `Schedule K-1`
- `Form 1042-S`
- `Form 8805`
- `Form 8288-A`

These are deferred OOS (Gap E) in current scope.

### 5c. Line 33 reads line 25d, not lines 25a-25c individually

For 2025 Form 1040:

```text
Form1040.line32 = total of other payments and refundable credits
Form1040.line33 = line25d + line26 + line32
```

So `line 25d` feeds `line 33` as a single value, not through the older expanded arithmetic that summed each sub-line.

### 5d. 1099-DA is new for 2025 (Gap G1 closure)

Form 1099-DA "Digital Asset Proceeds From Broker Transactions" is new for tax year 2025. Federal withholding is in **box 2a** (not box 4). Lock-in test: `line25bWithholdingFrom1099Da`.

### 5e. Form 4852 substitute-withholding MFS guard

Form 4852 is a personal form (per-spouse). On MFS the spouse's Form 4852 line 7e (line 25a) and line 8f (line 25b) **must not** aggregate into the taxpayer's return — each spouse files their own return. The guard at `TaxReturnComputeService.java:27137-27138`:

```java
boolean isMfsForForm4852 = "Married filing separately"
        .equalsIgnoreCase(normalizeFilingStatus(getString(filingStatusData, "filingStatus")));
```

is applied at lines 27147 (25a) and 27171 (25b).

### 5f. Paper-return attachment rule

The 2025 IRS instructions specifically call out attachment handling for withheld forms:

- `W-2`
- `1099-R` if federal withholding is shown
- `W-2G`
- `Form 8959`
- `1042-S`, `8805`, and `8288-A` when used to claim withholding credit

---

## 6. Practical Input Mapping For This Project

### Line 25a

```text
line25a = Σ all W-2 box 2 + Form 4852 line 7e (taxpayer + spouse non-MFS)
```

Helper: `sumFederalWithholdingFromEntries(w2Entries)` + `extractForm4852Line25aWithholding(...)`.

### Line 25b

```text
line25b = Σ all supported 1099 variants box 4 (13 forms; 1099-DA via box 2a)
        + SSA-1099 box 6 (non-standard field name)
        + Form 4852 line 8f (taxpayer + spouse non-MFS)
```

Helpers: `sumFederalWithholdingFromMultipleLists(...)` + `sumSsa1099Withholding(...)` + `extractForm4852Line25bWithholding(...)`.

### Line 25c

```text
line25c = Σ W-2G box 4
        + Form 8959 Part V line 24 (only when > 0)
        + (deferred OOS — Gap E) K-1 / 1042-S / 8805 / 8288-A withholding
```

Helper: `sumFederalWithholdingFromEntries(formW2gEntries)` + inline positive-filtered add of `form8959.getLine24TotalAmtWithheld()`.

### Line 25d

```text
line25d = nz(line25a) + nz(line25b) + nz(line25c)
```

---

## 7. Filing Status And Allocation Notes

### MFJ

For a joint return, aggregate withholding from both spouses' forms on the same return. Aggregation is implicit for statements (W-2, 1099-X, etc.) because they are stored at the household-UID scope and queried unscoped. Aggregation for personal-form-derived withholding (Form 4852) is explicit — spouse data joins unless MFS.

### MFS

For a separate return, report only the withholding properly attributable to that filer. Statement-derived withholding is segregated at storage (each MFS household has its own UID). Form 4852 is gated by `isMfsForForm4852`.

### Joint estimated payments are different

Do not confuse `line 25` withholding with `line 26` estimated tax payments. The former follows the source withholding documents; the latter follows estimated-payment allocation rules.

---

## 8. Validation Rules

```text
line25a >= 0
line25b >= 0
line25c >= 0
line25d = nz(line25a) + nz(line25b) + nz(line25c)
line25d >= line25a
line25d >= line25b
line25d >= line25c
```

Practical checks:

- `SSA-1099` and `RRB-1099` withholding should be in `25b`, not `25c`
- `W-2G` withholding should be in `25c`, not `25b`
- `Form 8959 line 24` belongs in `25c`, not `line 23` (this is the critical line 24 vs. line 18 distinction — note: Form 8959 line 24 is **line 24 of Form 8959 Part V**, the withheld amount, not Form 1040 line 24)
- generic 1099 withholding should follow the `box 4 of Form 1099` rule, with the 1099-DA box-2a exception for 2025
- if all three sub-lines are zero, `line25d` should be null per the null-when-zero convention (PDF cell blank)

---

## 9. Implementation Notes For This Project

Compute order inside `computeLine31ThroughLine38` at `TaxReturnComputeService.java:27089-27211`:

1. derive `isMfsForForm4852` from filing status (line 27137-27138)
2. sum all W-2 withholding + Form 4852 line 7e → `withholdingW2` → `25a` (line 27144-27151)
3. sum all 1099 / SSA-1099 / RRB-1099 + Form 4852 line 8f → `withholding1099` → `25b` (line 27159-27176)
4. sum W-2G + Form 8959 Part V line 24 (positive-filter) → `withholdingOther` → `25c` (line 27180-27205)
5. total the three sub-lines → `totalWithholding` → `25d` (line 27208-27211)
6. feed `25d` into line 33 (downstream at line 27293-27313)

If the application does not yet support K-1, 1042-S, 8805, or 8288-A withholding (Gap E), that is documented as deferred support rather than excluding those sources from the tax-year rule.

### Frontend dual-path recompute for line 25d

The frontend PDF export reads `form.payments?.totalWithholding` directly, but the line-33 recompute view at `form-tax-return-1040.component.ts:454` uses `sumAmounts([line25dTotalWithholding(), payments.estimatedTaxPayments, line32OtherPayments()])` — preferring the backend `totalWithholding` value but falling back to the client-side sum of the three sub-lines when the backend value is absent.

---

## 10. Forms Checklist

| Form | Count per return | Where it matters |
|---|---|---|
| Form 1040 | 1 | lines 25a through 25d live here |
| Form W-2 | 0 or more | line 25a (box 2) |
| Form 4852 (taxpayer + spouse) | 0 or 1 per person | line 25a (line 7e) + line 25b (line 8f); MFS-guarded |
| Form 1099-R | 0 or more | line 25b (box 4) |
| Form 1099-INT | 0 or more | line 25b (box 4) |
| Form 1099-DIV | 0 or more | line 25b (box 4) |
| Form 1099-B | 0 or more | line 25b (box 4) |
| Form 1099-OID | 0 or more | line 25b (box 4) |
| Form 1099-G | 0 or more | line 25b (box 4) |
| Form 1099-NEC | 0 or more | line 25b (box 4 — backup withholding) |
| Form 1099-K | 0 or more | line 25b (box 4) |
| Form 1099-MISC | 0 or more | line 25b (box 4) |
| Form 1099-PATR | 0 or more | line 25b (box 4; Gap B closure) |
| Form 1099-DA (new 2025) | 0 or more | line 25b (box 2a — non-standard) |
| Form SSA-1099 | 0 or more | line 25b (box 6 — non-standard field name) |
| Form RRB-1099 | 0 or more | line 25b (box 10) |
| Form RRB-1099-R | 0 or more | line 25b (box 9) |
| Form W-2G | 0 or more | line 25c (box 4) |
| Form 8959 | 0 or 1 | line 25c (Part V line 24, positive-filtered) |
| Schedule K-1 | 0 or more | line 25c (DEFERRED OOS — Gap E) |
| Form 1042-S | 0 or more | line 25c (DEFERRED OOS — Gap E) |
| Form 8805 | 0 or more | line 25c (DEFERRED OOS — Gap E) |
| Form 8288-A | 0 or more | line 25c (DEFERRED OOS — Gap E) |

---

## 11. Scope Note

The tax-law rule for `lines 25a-25d` is broader than the application's currently implemented statement set. This spec reflects the full 2025 IRS routing, while separately marking unsupported source forms (K-1, 1042-S, 8805, 8288-A) as implementation gaps (Gap E) where necessary.

The MFS-protection story is two-tier:

- **Statement-derived withholding** (W-2 box 2, 1099-series box 4, SSA-1099 box 6, RRB-1099 box 10, W-2G box 4) is segregated at the **Firestore storage layer** (user-scoped queries; no in-method MFS check needed). This is the "upstream-data-segregated-at-storage" mechanism.
- **Personal-form-derived withholding** (Form 4852 line 7e and line 8f) is segregated by an **explicit in-method `isMfsForForm4852` check** at lines 27147 and 27171.

---

## 12) Verification log

This is a combined-spec log covering 25a, 25b, 25c, 25d audits. Each audit appends a new row.

| # | Date | Auditor | Sub-line | Result | Closures |
|---|---|---|---|---|---|
| 1 | 2026-05-15 | Claude Code | 25a | COMPLETE — 10/10 closed | #1 (17th defensive-gap-NOT-needed; NEW MFS PATTERN "upstream-data-segregated-at-storage") + #2 (18th Legacy A migration; 30 → 31 convergence; FIRST payments-section Legacy A) + #3 (Verification log created with combined-spec 6-column adaptation) + #4 (5th META-AUDIT; sub-type (b) at 80% DOMINANCE) + #5 (FIRST PAYMENTS-SECTION METHOD-LEVEL BREADCRUMB at computeLine31ThroughLine38) + #6 (14th anti-duplication; FIRST same-audit anti-duplication) + #7 (SIMPLEST chain — W-2 box 2 source → helper+setter → line 25a) + #8 (4 conventions — null-when-zero + no SSN filtering + MFJ aggregation + MFS storage segregation) + #9 (22nd Path A; 26 consecutive zero-outstanding walkthroughs) + #10 (FIRST PAYMENTS-SECTION AUDIT — multiple FIRSTs) |
| 2 | 2026-05-15 | Claude Code | 25b | COMPLETE — 10/10 closed | #1 (18th defensive-gap-NOT-needed; SAME NEW MFS PATTERN — RECURRENCE CONFIRMED) + #2 (FIRST "already-migrated" closure — Legacy A inherits from 25a #2) + #3 (FIRST combined-spec ROW APPEND) + #4 (6th META-AUDIT; sub-type (b) at 83%) + #5 (15th anti-duplication; FIRST cross-audit anti-duplication within payments-section) + #6 (LONGEST chain — 13 sources via variadic + SSA-1099 special) + #7 (5 CONVENTIONS — tied with line 23 for most; SSA-1099 SPECIAL FIELD NAME unique) + #8 (MOST routing guardrails — SSA+RRB → 25b; 1099-K box 4; 1099-DA box 2a NEW 2025; RRB-1099 box 10 vs. RRB-1099-R box 9) + #9 (23rd Path A; 10th consecutive ZERO NEW GAPS DOUBLE-DIGIT) + #10 (SECOND PAYMENTS-SECTION AUDIT) |
| 3 | 2026-05-15 | Claude Code | 25c | COMPLETE — 10/10 closed | #1 (19th defensive-gap-NOT-needed; 3rd NEW MFS PATTERN instance) + #2 (2nd "already-migrated" closure) + #3 (2nd combined-spec ROW APPEND) + #4 (7th META-AUDIT; DOMINANCE at 86%) + #5 (16th anti-duplication; 2nd CROSS-AUDIT) + #6 (CONDITIONAL inheritance chain — STRUCTURALLY UNIQUE; 4th distinct complexity dimension) + #7 (4 conventions same as 25a; NO 5th convention) + #8 (VERIFIED CORRECT — W-2G→25c; Form 8959 line 24→25c with critical line 24 vs. line 18 distinction) + #9 (24th Path A; 11th CONSECUTIVE ZERO NEW GAPS) + #10 (THIRD PAYMENTS-SECTION AUDIT) |
| 4 | 2026-05-15 | Claude Code | 25d | COMPLETE — 10/10 closed | #1 (20th defensive-gap-NOT-needed; 4th NEW MFS PATTERN instance) + #2 (3rd "already-migrated" closure) + #3 (3rd combined-spec ROW APPEND — COMPLETES 25abcd §11 family) + #4 (8th META-AUDIT; DOMINANCE at 88%) + #5 (17th anti-duplication; 4th reuse of 25a #5 — LOAD-BEARING CONFIRMED) + #6 (PURE-SUM chain — STRUCTURALLY SIMPLEST) + #7 (Convention 1 null-when-zero ENFORCED VIA TERNARY at setter — UNIQUE) + #8 (ZERO routing distinctions; frontend DUAL-PATH compute verified) + #9 (25th Path A; 12th CONSECUTIVE ZERO NEW GAPS) + #10 (25abcd CLUSTER COMPLETE; LOAD-BEARING CONFIRMATION milestone) |
