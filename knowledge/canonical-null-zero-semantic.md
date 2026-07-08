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

2. **Downstream consumers branch on null**. Code like `if (income.getX() != null)` (`computeSchedule8812()`, Schedule 3 credits, EIC worksheet, etc.) interprets null as "field absent" and ZERO as "field computed to zero". Mixing the two breaks the branching.

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
| **2a/2b** | **`computeInterestIncome`** | **CONFORMS — audited 2026-07-08** | Line 2a/2b null when no interest input (addNonNull / subtractNonNegative / roundMoney all null-preserving); ZERO only for an explicit $0 entry. Breadcrumb at the record return; lock-in tests `interestLine2aAnd2bNullWhenNoInput` + `interestLine2bZeroForExplicitZeroEntryLine2aStillNull`. |
| **3a/3b** | **`computeDividendIncome`** | **CONFORMS — audited 2026-07-08** | Line 3a/3b null when no dividend input (addNonNull aggregates; computeDividendForPerson all-null on !personHadDividend; roundMoney(null)=null; the 3a≤3b cap is hasPositiveAmount-guarded); ZERO only for an explicit $0 box-1a entry. Breadcrumb at the record return; lock-in tests `dividendLine3aAnd3bNullWhenNoInput` + `dividendLine3bZeroForExplicitZeroEntryLine3aStillNull`. |
| **4a/4b/4c** | **`computeIraDistributions`** | **CONFORMS (nuanced) — audited 2026-07-08** | Whole record is null on `!hasOutput`, so line 4a/4b null when no IRA activity. Unlike 2b/3b, an all-$0 1099-R also yields null (hasOutput uses hasNonZeroAmount — a $0 distribution is "no distribution", IRS leaves blank). ZERO on line 4b only via activity that nets fully nontaxable (QCD/8606 basis). Breadcrumb at the hasOutput gate; lock-in tests `iraLine4aAnd4bNullWhenNoInput` + `iraLine4bZeroWhenFullQcdOffsetsDistribution`. |
| **5a/5b** | **`computePensionIncome`** | **CONFORMS (nuanced) — audited 2026-07-08** | Mirrors IRA (4a/4b): whole record null on `!hasOutput`, so line 5a/5b null when no pension activity; an all-$0 pension 1099-R also → null (hasNonZeroAmount). ZERO on line 5b only via activity that nets nontaxable (full rollover / PSO / basis recovery). Breadcrumb at the hasOutput gate; lock-in tests `pensionLine5aAnd5bNullWhenNoInput` + `pensionLine5bZeroWhenFullRolloverOffsetsDistribution`. |
| **6a/6b** | **`computeSocialSecurityBenefits`** | **CONFORMS — audited 2026-07-08** | Whole record null on `!hasOutput`, so line 6a/6b null when no SS benefits. ZERO is the natural common case: benefits present but none taxable at low income → the §86 "no-blank" rule (line6a≠null && line6b==null → 0) forces line 6b = 0. Breadcrumb at the hasOutput gate; lock-in `socialSecurityLine6aAnd6bNullWhenNoInput` (null) + existing `computesZeroTaxableSocialSecurityWhenBelowWorksheetThreshold` (ZERO). |
| **7a/7b** | **`computeCapitalGainLoss`** | **CONFORMS — audited 2026-07-08** | Whole record null on `!hasOutput`, so line 7a null when no capital activity (a computed $0 only counts as output when `hadAnyCapital`). ZERO branch: real transactions netting to exactly $0 → line 7a = 0. Line 7a may also be NEGATIVE (§1211(b)-capped loss). Breadcrumb at the hasOutput gate; lock-in tests `capitalLine7aNullWhenNoInput` + `capitalLine7aZeroWhenTransactionsNetToZero`. |
| **8** | **`computeOtherIncomes`** | **CONFORMS — audited 2026-07-08** | Whole record null on `!hasAnySchedule1Input`, so line 8 (Schedule 1 line 10 pass-through) null when no Schedule 1 input; all-$0 also → null (hasNonZeroAmount gate). ZERO only when genuine activity nets to $0 (e.g. taxable refund offset by an equal NOL); line 8 may also be NEGATIVE. Breadcrumb at the gate; lock-in tests `otherIncomeLine8NullWhenNoInput` + `otherIncomeLine8ZeroWhenRefundOffsetByNol`. |
| **9** | **`buildIncome` (line 9 sum)** | **CONFORMS — audited 2026-07-08** | Line 9 (total income) = addNonNull of the 8 income lines → null when the return has no income (guarded setter); ZERO when components net to $0 (e.g. wages offset by an NOL on line 8); may be NEGATIVE. Breadcrumb at the sum; lock-in tests `line9TotalIncomeNullWhenNoIncome` + `line9TotalIncomeZeroWhenComponentsNetToZero`. |
| **10** | **`computeIncomeAdjustments` / `buildAdjustments`** | **CONFORMS — audited 2026-07-08** | Whole record null on `!hasAnySchedule1Input`, so line 10 (Schedule 1 line 26 pass-through) null when no Part II input; all-$0 also → null. Adjustments are NON-NEGATIVE → no natural ZERO-with-input branch (null-or-positive). Breadcrumb at the gate; lock-in `line10AdjustmentsNullWhenNoInput`. |
| **11a/11b** | **`buildAdjustments` (AGI)** | **CONFORMS — audited 2026-07-08** | AGI null when no income (line 9 null) — even with adjustments — because `line11a = line9==null ? null : (line9−line10)` short-circuits; ZERO when adjustments equal income; may be NEGATIVE. Line 11b copies 11a. Breadcrumb at the line-11a computation; lock-in tests `line11aAgiNullWhenNoIncomeEvenWithAdjustment` + `line11aAgiZeroWhenAdjustmentsEqualIncome`. |
| **12a–12e** | **`computeStandardDeduction` / `computeLine12`** | **CONFORMS — audited 2026-07-08** | Standard deduction (line 12e) null when no filing status (concept needs one). ZERO here is SPEC-MANDATED (not "no input"): line 12b (MFS spouse itemizes) or 12c (dual-status alien) → $0 per §63(c)(6). Otherwise a positive floor by status (dependents min $1,350). Breadcrumb in computeStandardDeduction; lock-in `line12eDeductionNullWhenNoFilingStatus` (null) + `computesLine12cForcesStandardDeductionToZeroForDualStatusAlien` (ZERO). |
| **13a/13b** | **`computeLine13a` / Schedule 1-A wiring** | **CONFORMS — audited 2026-07-08** | Line 13a (QBI) null when no QBI workflow (record null); ZERO when a QBI workflow's deduction computes to 0 (net-loss year / taxable-income limit). Line 13b (Schedule 1-A additional deductions) null when no Schedule 1-A (guarded setter); ZERO if amounts fully phase out. Both non-negative. Breadcrumbs at both null-exits; lock-in tests `line13aQbiNullWhenNoQbiWorkflow` + `line13bAdditionalDeductionsNullWhenNoSchedule1A`. |
| **14/15** | **`computeLine12` (line 14/15)** | **CONFORMS — audited 2026-07-08** | Line 14 (total deductions) = addNonNull(line12e, line13[, 13b]) → null only when no deduction at all (no filing status); positive floor otherwise. Line 15 (taxable income) = `agi==null ? null : subtractNonNegative(agi, line14)`: null when no income; ZERO by the SPEC-MANDATED floor when deductions ≥ AGI (common low-income case). Breadcrumb at the line-14/15 computation; lock-in tests `line15TaxableIncomeNullWhenNoIncome` + `line15TaxableIncomeZeroWhenDeductionExceedsAgi`. |
| **16** | **`computeLine16`** | **CONFORMS — audited 2026-07-08** | Line 16 (tax) null when line 15 (taxable income) is null — computeLine16 returns before TaxAndCredits/setTax exists. ZERO when line 15 ≤ 0 (the ZERO decision-tree branch sets regular tax 0). Note: line 16 can be > 0 even at line 15 = 0 if a Form 8814 / 4972 / box-3 add-on applies (§2.3). Breadcrumb at the line-15 null gate; lock-in tests `line16TaxNullWhenNoTaxableIncome` + `line16TaxZeroWhenTaxableIncomeZero`. |
| **17** | **`wireLine17ToOutputs`** | **CONFORMS — audited 2026-07-08** | Line 17 (AMT / Schedule 2 line 3) is NULL-or-POSITIVE by design — `amt > 0 ? amt : null` coalesces a computed $0 to null (IRS "leave blank if no additional tax"). No ZERO branch. Breadcrumb at the wiring; lock-in `line17AmtNullWhenNoAmt`. |
| **18** | **`computeLine18`** | **CONFORMS — audited 2026-07-08** | Line 18 (total tax before credits) null when no tax was computed (taxAndCredits null, i.e. line 15 was null); else = line16 + line17 (each coalesced to 0), so ZERO when taxable income is 0 and positive otherwise (always non-negative). Breadcrumb at the taxAndCredits-null guard; lock-in tests `line18TotalTaxBeforeCreditsNullWhenNoTaxableIncome` + `line18TotalTaxBeforeCreditsZeroWhenTaxableIncomeZero`. |
| **19** | **Schedule 8812 wiring** | **CONFORMS — audited 2026-07-08** | Line 19 (CTC/ODC) mirrors Schedule 8812 line 14. Schedule 8812 always computes (helper never null), so a childless return has line 14 = 0 → line 19 = 0 (IRS-defensible computed zero). NULL only when no tax context (TaxAndCredits null — no income; guarded setter). Positive when CTC/ODC allowed. Breadcrumb at the wiring; lock-in tests `line19ChildTaxCreditZeroWhenNoDependents` + `line19ChildTaxCreditNullWhenNoTaxContext`. |
| **20** | **`computeLine20ThroughLine24`** | **CONFORMS — audited 2026-07-08** | Line 20 (amount from Schedule 3 line 8) is NULL-or-POSITIVE by design — set only when Schedule 3 line 8 > 0, so an absent/$0 total coalesces to null (IRS "leave blank if no credits"). No ZERO branch. Breadcrumb at the wiring; lock-in `line20OtherCreditsNullWhenNoSchedule3Credits`. |
| **21/22** | **`computeLine20ThroughLine24`** | **CONFORMS — audited 2026-07-08** | Line 21 (total credits = 19+20) NULL-or-POSITIVE — `> 0 ? : null` coalesces $0 (no credits) to null. Line 22 (tax after credits) null only when no tax context (early return), ZERO by the SPEC-MANDATED floor when credits ≥ tax-before-credits (`.max(0)`), positive otherwise. Breadcrumbs at both; lock-in tests `line21_isNullWhenNoCreditsPresent` + `line21_line22FlooredAtZeroWhenCreditsAbsorbAllTax` (existing, 2026-04-19). |
| **23/24** | **`finalizeSchedule2OtherTaxes` / `computeLine20ThroughLine24`** | **CONFORMS — audited 2026-07-08** | Line 23 (other taxes) NULL-or-POSITIVE — set only when the Schedule 2 grand total > 0. Line 24 (total tax = 22 + 23) null only when no tax context (early return); else 0-or-POSITIVE — `> 0 ? : ZERO` coalesces to a shown 0. Breadcrumbs at both; lock-in tests `line23OtherTaxesNullWhenNone` + `line24TotalTaxZeroWhenNoTax`. |
| **25a–25d** | **`computeLine31ThroughLine38` (withholding)** | **CONFORMS — audited 2026-07-08** | Each sub-line (25a W-2, 25b 1099, 25c other) null when no withholding of that type (`x==null ? null : roundMoney(x)`); withholding is non-negative so no natural ZERO-with-input. Line 25d (total) NULL-or-POSITIVE — `> 0 ? : null` coalesces $0 to null. Breadcrumb at line 25d; lock-in `line25WithholdingNullWhenNone`. |
| **26** | **`computeLine26EstimatedTax`** | **CONFORMS — audited 2026-07-08** | Line 26 (estimated tax payments) NULL-or-POSITIVE — returns null when no estimated-payment gate is set, and the installment sum accumulates only positive amounts (null total stays null if all installments 0/absent). No ZERO-with-input. Breadcrumb at the gate; lock-in `line26EstimatedTaxNullWhenNone`. |
| **27a** | **`computeLine27aEIC`** | **CONFORMS — audited 2026-07-08** | Line 27a (EIC) null when not claimed / disqualified (no EIC form, claimsEIC != true, Form 2555, nonresident, ITIN, Form 8862 gate — each an early return null). Positive when allowed; can be ZERO when income is above the phase-out completion point (EIC table returns 0). Breadcrumb at the entry guards; lock-in `line27aEicNullWhenNotClaimed`. |
| 27b–38 | Downstream lines | UNAUDITED — pending future audit | Add 0-vs-null check per line. |

Audit plan: **The 0-vs-null compliance check is now a standard step in every Code Validation sheet for the remaining Form 1040 lines.** See `outstanding.md` "Cross-line 0-vs-null compliance audit — folded into each remaining line audit" entry.

---

## References

- `rules.md` § Canonical 0-vs-null Rule
- `lines/1e.md` (post-2026-05-10 fix narrative)
- `history.md` 2026-05-10 entry "Cross-line 0-vs-null Canonical Rule — Established"
- `outstanding.md` § Cross-line 0-vs-null compliance audit
- `XLS/computations/1z.xlsx` Code Validation #1, #9 (origin investigations)
- `XLS/computations/1h.xlsx` Code Validation #4(g) (early sighting)

> *Convention (added 2026-07-07, knowledge-file line-number sweep):* code references use stable function/method names rather than source-code line numbers, which drift with refactors. IRS form/schedule line references (line 1c, Schedule 1 line 21, etc.) are stable and retained.
