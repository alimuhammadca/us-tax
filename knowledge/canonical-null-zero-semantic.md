---
name: canonical-null-zero-semantic
description: Canonical rule for when a tax-compute helper returns null vs BigDecimal.ZERO. Established 2026-05-10 during the wage-block audit (lines 1a–1z).
type: reference
---

# Canonical Rule — `null` vs `BigDecimal.ZERO` in Tax Computation Helpers

**Established:** 2026-05-10 (during the wage-block audit closures — see `history.md` 2026-05-10 line-1z entry and `1z.xlsx` Code Validation #1).

**Applies to:** All `compute*` helper methods in `TaxReturnComputeService.java` that return a `BigDecimal` (or a record containing BigDecimal fields).

---

## The Rule

| Return value | Meaning |
|---|---|
| **`null`** | This concept does not apply / no input was provided / no determination was made. The Form 1040 PDF cell renders **blank**. |
| **`BigDecimal.ZERO`** | This concept applies, the input was provided, and the computed value is zero. The Form 1040 PDF cell renders **"0"**. |

### Decision Test

When writing a compute helper, ask: *"Would a user with no relevant inputs at all see something on the PDF for this line?"*

- **No → return null.** The line is conceptually irrelevant for this filer.
- **Yes (because they signaled it applies, or a statement is present, or a spec mandate forces a 0) → return ZERO.**

---

## Worked Examples (Canonical Interpretations)

| Scenario | Return | Rationale |
|---|---|---|
| User has no `childcare-expenses` form AND no W-2 box 10 benefits | **NULL** | Concept doesn't apply at all. |
| User has `childcare-expenses` form, claims $0 qualifying expenses | **ZERO** | Concept applies; computed value is 0. |
| User has W-2 box 10 benefits but no `childcare-expenses` form | **ZERO** (+ blocking flag) | Concept applies via the statement; user must complete Form 2441. |
| User elected combat pay but has no W-2 box 12 code Q | **ZERO** | Election applies; value is 0. Per spec §10.4 — explicitly distinguishes "elected with no Q" from "not elected". |
| User did NOT elect combat pay | **NULL** | Concept (the election) doesn't apply. |
| User is MFS, has W-2 code T adoption benefits, no separation exception | **ZERO** | Concept applies (employer benefits exist); exclusion disallowed per IRC §137(f). |
| User has no W-2 code T at all | **NULL** | Adoption-benefits concept doesn't apply. |
| User has no tip-income form (didn't claim unreported tips) | **NULL** | Concept doesn't apply. |
| User has tip-income form but $0 unreported tips | **ZERO** | Concept applies; value is 0. |

---

## Why This Matters

### Correctness consequences

1. **Line 1z null propagation** depends on this rule. When all 8 sub-lines (1a–1h) return null on absent inputs, the addNonNull chain correctly produces `line1z = null`, and the Form 1040 line 1z cell renders blank for filers with no wage activity.

2. **Downstream consumers branch on null**. Code like `if (income.getX() != null)` (Schedule 8812 line 19135, Schedule 3 credits, EIC worksheet, etc.) interprets null as "field absent" and ZERO as "field computed to zero". Mixing the two breaks the branching.

3. **PDF rendering** distinguishes blank from "0". The IRS form convention is: blank when the line doesn't apply, "0" when the line applies but the value is zero. The frontend's `formatAmount(null)` produces blank; `formatAmount(0)` produces "0".

### Anti-pattern: Incidental ZERO

Returning `BigDecimal.ZERO` when "I don't have a value" is a classic anti-pattern. It looks defensive (no NullPointerException) but pollutes downstream logic:
- `addNonNull(null, ZERO) = ZERO`, not null — breaks aggregator null propagation.
- `if (x != null) { displayX(); }` displays a $0 the user didn't expect.
- Test scenarios setting up "no input" cannot reach null states for assertion.

The line 1e bug (`computeDependentCareBenefits` returning ZERO on absent form, pre-2026-05-10 fix) is the textbook example.

---

## Spec-Driven Exceptions

Some methods return ZERO for legitimate spec reasons. These are NOT violations of the canonical rule — they exhibit the "concept applies, value is zero" shape.

| Method | Spec basis | ZERO path |
|---|---|---|
| `computeCombatPay` (line 1i) | Spec `lines/1i.md` §10.4 | Elected with no W-2 code Q → ZERO (distinguishes from "not elected" = NULL). |
| `computeAdoptionBenefits` (line 1f) | IRC §137(f) / `lines/1f.md` §4.X | MFS without separation exception, W-2 code T present → ZERO (exclusion disallowed). |
| `computeLine1aWages` (line 1a) | IRC carve-outs | After statutory-employee exclusion + box 11 NQDC subtraction + inmate-wage exclusion, residual may be ZERO when carve-outs zero out positive wages. |

In each case the method's javadoc/comment cites the spec mandate so future readers see the ZERO is deliberate, not incidental.

---

## Compliance Checklist (For Future Audits)

When auditing a new compute method or writing a new helper:

1. **Identify the "no input" exit path**: where does the method return when nothing has been entered?
2. **Verify the return value is `null`** unless a spec mandates ZERO with a documented citation.
3. **Add a comment near the exit citing this rule**: `// Canonical NULL semantic (see knowledge/canonical-null-zero-semantic.md).`
4. **Add a lock-in test**: assert `null` when no inputs; assert `ZERO` only for the spec-mandated ZERO path.
5. **Trace downstream consumers**: confirm any `if (x != null)` branch behaves correctly under the null-on-absent contract.
6. **For frontend rendering**: confirm `formatAmount(null)` renders blank on the relevant PDF cell.

---

## Audit Coverage

| Line | Method | Status (as of 2026-05-10) | Notes |
|---|---|---|---|
| 1a | `computeLine1aWages` | CONFORMS (MIXED — carve-out ZEROs are spec-driven) | IRC carve-outs documented |
| 1b | `householdEmployeeAmount` | CONFORMS | Always-null on absent / failed gates |
| 1c | `computeTipsForPerson` | CONFORMS | Null on hasUnreportedTips=false |
| 1d | `computeMedicaidForPerson` | CONFORMS | Null on absent form / MFS guard |
| **1e** | **`computeDependentCareBenefits`** | **FIXED 2026-05-10** | Was the canonical-rule outlier; now returns null when no inputs. |
| 1f | `computeAdoptionBenefits` | CONFORMS (MIXED — MFS ZERO is spec-driven IRC §137(f)) | |
| 1g | `computeForm8919ForPerson` | CONFORMS | Null on no Form 8919 firms |
| 1h | `computeOtherEarnedIncome` | CONFORMS (MIXED — all-zero-inputs ZERO documented in 1h #4(g)) | |
| 1i | `computeCombatPay` | CONFORMS (MIXED — elected-no-Q ZERO is spec-driven §10.4) | |
| 2a/2b | `computeInterestIncome` | UNAUDITED — pending future audit | Add 0-vs-null check to the audit Code Validation sheet. |
| 3a/3b | `computeDividendIncome` | UNAUDITED — pending future audit | Add 0-vs-null check. |
| 4a/4b/4c | `computeIraDistributions` | UNAUDITED — pending future audit | Add 0-vs-null check. |
| 5a/5b | `computePensionIncome` | UNAUDITED — pending future audit | Add 0-vs-null check. |
| 6a/6b | `computeSocialSecurityBenefits` | UNAUDITED — pending future audit | Add 0-vs-null check. |
| 7a/7b | `computeCapitalGainLoss` | UNAUDITED — pending future audit | Add 0-vs-null check. |
| 8 | `computeOtherIncomes` | UNAUDITED — pending future audit | Add 0-vs-null check. |
| 9–38 | Downstream lines | UNAUDITED — pending future audit | Add 0-vs-null check per line. |

Audit plan: **The 0-vs-null compliance check is now a standard step in every Code Validation sheet for the remaining Form 1040 lines.** See `outstanding.md` "Cross-line 0-vs-null compliance audit — folded into each remaining line audit" entry.

---

## References

- `rules.md` § Canonical 0-vs-null Rule
- `lines/1e.md` (post-2026-05-10 fix narrative)
- `history.md` 2026-05-10 entry "Cross-line 0-vs-null Canonical Rule — Established"
- `outstanding.md` § Cross-line 0-vs-null compliance audit
- `XLS/computations/1z.xlsx` Code Validation #1, #9 (origin investigations)
- `XLS/computations/1h.xlsx` Code Validation #4(g) (early sighting)
