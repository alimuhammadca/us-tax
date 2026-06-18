# Knowledge: Form 1040 Line 1d — Medicaid Waiver Payments Not Reported on W-2 Box 1

Built from: spec, backend compute service, frontend forms, unit tests, E2E tests, YAML files, output models.
Last updated: 2026-05-06 (created during 1d.xlsx Code Validation walkthrough — Issues #1–#9).

---

## 1. What is Line 1d?

Form 1040 line 1d reports **Medicaid waiver payments NOT in W-2 box 1**. It implements the IRS Notice 2014-7 difficulty-of-care exclusion under IRC §131.

The line participates in a three-line interaction:

| Component | Where it goes |
|---|---|
| Taxable Medicaid waiver payments NOT in W-2 box 1 | Line 1d (permanent — no offset) |
| Nontaxable qualified payments NOT in W-2 box 1, election ON | Line 1d (positive) + Schedule 1 line 8s (negative same amount) |
| Nontaxable qualified payments IN W-2 box 1, election ON | Already in line 1a; Schedule 1 line 8s (negative) backs them out |
| Nontaxable qualified payments IN W-2 box 1, election OFF | Stays in line 1a permanently (NO line 8s offset) |
| Nontaxable qualified payments NOT in W-2 box 1, election OFF | Excluded from the return entirely |

**Net AGI effect for nontaxable elected amounts is zero** (line 1d gross + line 8s offset cancel) — but the gross amount counts as earned income for EIC and ACTC purposes per Notice 2014-7.

---

## 2. Personal Form IDs

| Form ID | Role |
|---|---|
| `medicaid-waiver-payments-taxpayer` | Taxpayer Medicaid waiver payments; drives line 1d + Schedule 1 line 8s (taxpayer side) |
| `medicaid-waiver-payments-spouse` | Spouse Medicaid waiver payments; gated on MFJ (UI hides on non-MFJ; backend MFS guard since 2026-05-06 — see §4) |

Cross-form integration:
- W-2 statement entries (`users/{uid}/w-2/{entryId}`) for `findMatchingW2Entry` lookup when `sourceType=W-2`
- `filing-status` (`users/{uid}/filing-status`) for the MFS guard

---

## 3. YAML Fields — `medicaid-waiver-payments-{taxpayer,spouse}`

### Form-level

| Field | Type | Notes |
|---|---|---|
| `receivedMedicaidWaiverPayments` | boolean | Outer gate. Backend HARD gate: `Boolean.TRUE.equals` required. Hard (not soft) because there is no auto-fill path that depends on null — see 1d.xlsx Issue #2. |
| `includeQualifiedPaymentsInEarnedIncomeForEIC_ACTC` | boolean | Notice 2014-7 election. ALL-OR-NONE per spouse (each spouse on MFJ may make a different choice). When ON: nontaxable amounts flow to line 1d AND line 8s offset is generated. |
| `hasTradeOrBusinessProvidingHomeCare` | boolean | Schedule C path gate. When true AND amounts > 0 → blocking flag fires; line 1d returns null (Schedule C is out of scope). |
| `programName` | text | Display only. Helps user trace which Medicaid program (e.g., HCBS §1915(c) waiver). NOT used by compute. |
| `careRecipientRelationship` | text | Display only. Notice 2014-7 applies regardless of provider-recipient relationship. |
| `livesWithCareRecipient` | boolean | Informational. Notice 2014-7 requires shared home, but compute trusts the user's `qualifiedNotice2014_7Amount` directly. (Issue #9 in 1d.xlsx — UI guidance gap noted.) |

### Per-entry (`medicaidWaiverPayments[]`)

| Field | Type | Notes |
|---|---|---|
| `payerName` | text | Required for display + W-2 fallback matching |
| `payerTIN` | text | Optional. Used by `findMatchingW2Entry` for W-2 cross-reference. Subject to `TinValidator` (EIN format, lenient on incomplete) |
| `sourceType` | string enum | `W-2`, `1099-MISC`, `1099-NEC`, `Other`. Only `W-2` triggers the W-2 box-1 lookup branch. |
| `qualifiedNotice2014_7Amount` | amount | Nontaxable Notice 2014-7 amount for this entry. Drives both line 1d (when election) and line 8s offset. |
| `w2Box12CodeIIAmount` | amount | Informational reconciliation. If present without `qualifiedNotice2014_7Amount` → `MEDICAID_WAIVER_CODE_II_MISSING_QUALIFIED_*` blocking flag. |
| `qualifiedAmountIncludedInW2Box1` | amount | Portion of qualified amount already in W-2 box 1. Required (UI per-entry conditional `[required]` since 2026-05-06 — see §6) when sourceType=W-2 AND qualifiedAmount > 0. Drives line 1d / line 8s split. |
| `taxablePaymentsNotInW2Box1` | amount | Optional. Contributes directly to line 1d unconditionally (election does NOT gate taxable amounts). Permanent — no line 8s offset. |
| `notes` | text | User-side reference only |

---

## 4. Backend Compute Logic

> *Convention*: code references in this file use **function names** (e.g., `computeMedicaidForPerson`) rather than source-code line numbers, which drift with refactors. Established 2026-05-06 (1c.xlsx Issue #9; applied here from initial creation).

### Entry point

`TaxReturnComputeService.computeMedicaidWaiverPayments(...)` — called once per compute pass from `prepare()`.

Reads:
- `personalForms.get("medicaid-waiver-payments-taxpayer")` / `-spouse`
- `w2Entries` (all W-2 statements for the return) — for `findMatchingW2Entry` lookup
- `you` and `spouse` identification forms (for SSN extraction)
- `filing-status` (derived to `boolean isMfs` by `prepare()`)

### Per-spouse independence + MFS guard (since 2026-05-06)

Two separate `computeMedicaidForPerson` calls on MFJ; each produces its own `MedicaidResult(line1d, line8s)`.

**MFS guard:** `computeMedicaidWaiverPayments(...)` accepts `boolean isMfs`; when true, the spouse `computeMedicaidForPerson` call is skipped and a null-pair `MedicaidResult(null, null)` is substituted. **Single guard cascades to BOTH outputs** automatically via `addNonNull`:
- `form1040.income.medicaidWaiverPayments` (line 1d) excludes spouse
- `schedule1.additionalIncome.otherIncomeMedicaidWaiverPayments` (line 8s) excludes spouse offset

UI hides spouse form on non-MFJ; backend gate handles stale-data / direct-API edge cases. Mirrors the line 1c `computeTips` MFS-guard pattern. Test: `line1dMfsGuard_spouseMedicaidWaiverNotAggregatedOnMfs`.

### `hasUnreportedTips`-style outer gate (HARD, not soft)

At the top of `computeMedicaidForPerson`: `if !Boolean.TRUE.equals(received) → return MedicaidResult(null, null)`. **HARD gate** (rejects null and false) — correct here because there's no auto-fill convenience to preserve, unlike line 1c's soft gate. See 1d.xlsx Issue #2.

### Schedule C path (blocking — broadened 2026-05-20)

When `hasTradeOrBusinessProvidingHomeCare=true` (regardless of whether amounts have been entered):
- `MEDICAID_WAIVER_SCHEDULE_C_{TAXPAYER,SPOUSE}` blocking flag fires
- Line 1d path entirely blocked; returns `MedicaidResult(null, null)`
- Schedule C with Notice 2014-7 expense offset required (out of scope for this app)

Earlier behaviour (2026-05-06 through 2026-05-19) required `hasAmounts` (qualified or taxable > 0) as a co-condition; that has been removed. The user's declaration alone routes the return out of the Line 1d path — entering payments first is no longer necessary to trigger the block.

Tests: `flagsMedicaidWaiverBusinessPath`, `flagsMedicaidWaiverBusinessPath_firesEvenWithNoAmounts`.

### Per-entry W-2 lookup (only when `sourceType=W-2`)

`findMatchingW2Entry(w2Entries, ssn, payerTIN, payerName)` matches by SSN + EIN/name:

| Match outcome | Action |
|---|---|
| Match found AND `wagesTipsOtherCompAmount` (box 1) > 0 AND `qualifiedAmountIncludedInW2Box1` not provided | Emit `MEDICAID_WAIVER_W2_BOX1_UNSPECIFIED_*` (blocking); set `missingIncludedAmount = true`; exclude entry's `qualifiedNotInW2` from accumulation |
| Match found AND box 1 ≤ 0 AND `qualifiedAmountIncludedInW2Box1` not provided | Auto-set `includedInW2 = 0`; no flag (the modern 2024+ code-II reporting standard) |
| No W-2 match found | `includedInW2` used as provided (may be null → treated as 0 in arithmetic); no flag (W-2 may not be imported yet) |

Tests: `flagsWhenW2Box1IncludedAmountMissing`, `line1dW2LookupNoMatch_includedInW2NullTreatedAsZero`, `line1dW2LookupMatchedBox1Zero_autoSetsIncludedInW2Zero`.

### Election mechanics — all-or-none per spouse

```
line1d_person = taxableNonW2 + (election ? qualifiedNotInW2 : 0)
line8s_person = (election ? -(qualifiedIncludedInW2 + qualifiedNotInW2) : null)
```

Per spouse independently. Tests: `line1dMfj_bothSpousesElect`, `line1dMfj_taxpayerElectsSpouseDoesNot_perSpouseElectionRule`.

### Cross-entry duplication invariant (verified 2026-05-06)

Algebraically `line8s = -qualifiedTotal` under the per-entry W2_OVERAGE constraint. Cross-entry duplication of the same real-world payment leaves AGI unchanged (offset cancels) but inflates EIC/ACTC earned-income basis. See `lines/1d.md` §8.6 for the proof and `outstanding.md` for the deferred UI heuristic enhancement.

### Blocking flags inventory

All seven flags are blocking. The UI never refuses save in any of these states — guidance is delivered through inline advisory hints (pivot applied 2026-05-20).

| Flag | Trigger | UI guidance |
|---|---|---|
| `MEDICAID_WAIVER_SCHEDULE_C_{TP,SP}` | `hasTradeOrBusinessProvidingHomeCare=true` AND amounts > 0 | Prominent informational banner appears the moment trade-or-business is answered Yes |
| `MEDICAID_WAIVER_W2_BOX1_UNSPECIFIED_{TP,SP}` | sourceType=W-2 AND matched W-2 box 1 > 0 AND `qualifiedAmountIncludedInW2Box1=null` | Inline advisory hint next to the field explains both valid answers (0 for modern 2024+ reporting; positive for legacy box-1 reporting) |
| `MEDICAID_WAIVER_CODE_II_MISSING_QUALIFIED_{TP,SP}` | `w2Box12CodeIIAmount > 0` AND `qualifiedNotice2014_7Amount=null` | Inline advisory hint next to the qualified-amount field tells the user to either enter the qualified amount or clear the code II value |
| `MEDICAID_WAIVER_W2_OVERAGE_{TP,SP}` | per-entry: `qualifiedAmountIncludedInW2Box1 > qualifiedNotice2014_7Amount` | Inline warning hint (red) next to the included-in-box-1 field explains the inconsistency and offers both repair options |
| `MEDICAID_WAIVER_ELECTION_NO_QUALIFIED_{TP,SP}` | election=true AND `qualifiedTotal ≤ 0` | Inline advisory hint next to the election radio buttons tells the user to either enter a qualified amount or change the election to No |
| `MEDICAID_WAIVER_LINE8S_EXCEEDS_QUALIFIED_{TP,SP}` | computed offset > qualifiedTotal (internal-consistency error) | None — internal-consistency guardrail; should never fire |
| `MEDICAID_WAIVER_LINE8S_MISSING_{TP,SP}` | election=true AND offset computes to null | None — internal-consistency guardrail; should never fire |

**Save-vs-compute pivot (2026-05-20):** the CODE_II_MISSING_QUALIFIED and W2_BOX1_UNSPECIFIED flags previously had a UI-side save block (`isValid()` returned false). The save block was removed; both flags now fire only at compute time. Messages on all four user-facing flags (1, 2, 4, 5) were rewritten in action-oriented style — they name the section ("Medicaid waiver payments (taxpayer)"), identify the specific row by payer name, and give a concrete fix step.

---

## 5. Downstream integrations

### Schedule 1 line 8s
```
schedule1.additionalIncome.otherIncomeMedicaidWaiverPayments
  = taxpayer.line8s + spouse.line8s   (both negative; spouse skipped on MFS)
```
Must be NEGATIVE (entered in preprinted parentheses on Schedule 1). Backs out the FULL nontaxable amount included on either line 1a (via W-2 box 1) or line 1d.

### Form 1040 totals
```
line 1z = line 1a + line 1b + line 1c + line 1d + ... + line 1h
line 8 = Schedule 1 line 10 (which includes line 8s as negative)
line 9 = line 1z + 2b + 3b + 4b + 5b + 6b + 7a + line 8
```
Net effect on AGI for nontaxable elected amounts is exactly zero (line 1d gross + line 8s offset cancel).

### Pub 915 Social Security Worksheet 1 line 3
Includes line 1d via the "Form 1040 line 1z" reference. Schedule 1 line 8 (which includes line 8s) is ALSO in the worksheet, so the offset cancellation is preserved. Same MFS guard applies.

### Form 2441 / EIC / ACTC earned income
When election=true: nontaxable Medicaid waiver amounts count as earned income for EIC and ACTC even though they are not taxable. The IRS scope is specifically EIC + ACTC (Notice 2014-7); Form 2441 (§21) earned income may also include them — verify in the §21 audit. **No FICA implications** — Notice 2014-7 payments are not subject to SS/Medicare under the non-employee path (no Form 4137 / 8919 interaction).

---

## 6. Frontend Forms

### `form-medicaid-waiver-taxpayer.component.ts` / `form-medicaid-waiver-spouse.component.ts`

**Six-section layout (restructured 2026-05-20):** Screening → Classification gate (business) → Available statements picker → Payment entries → Program context → Earned-income election. When `hasTradeOrBusinessProvidingHomeCare=true`, sections 3–6 are entirely hidden in the template (`*ngIf="hasTradeOrBusinessProvidingHomeCare !== true"`).

- **Auto-populate from W-2** on init: `loadW2Entries()` → `autoPopulateFromW2()` creates entries from W-2s with positive `w2Box12CodeIIAmount` (matching by SSN). Pre-fills `payerName`, `payerTIN`, `sourceType=W-2`, `w2Box12CodeIIAmount`, `qualifiedNotice2014_7Amount`. Does NOT pre-fill `qualifiedAmountIncludedInW2Box1`.
- **Available statements picker** (added 2026-05-20): loads W-2, 1099-MISC, and 1099-NEC statements (all SSNs, not just the form's owner). Each picker row shows source type, payer name + EIN, the key dollar amount, and the recipient's masked SSN with a "You" / "Spouse" / "Unknown" label. "Bring into form" creates a pre-filled entry row. Auto-extract rules:
  - W-2 without code II: pre-fills `taxablePaymentsNotInW2Box1` from Box 1 wages.
  - 1099-MISC Box 3 (Other Income): pre-fills `taxablePaymentsNotInW2Box1` with that amount.
  - 1099-MISC Box 6 (Medical/health care): same; shown as a second picker entry when both Box 3 and Box 6 are populated.
  - 1099-NEC Box 1 (Nonemployee compensation): pre-fills `taxablePaymentsNotInW2Box1`.

  **Default-to-taxable rule:** non-code-II sources always pre-fill the taxable bucket. The form shows a one-line note above the entries list explaining that the user must move the amount to "Qualified Medicaid waiver payments" if Notice 2014-7 applies. Picker de-dups against existing entries via `findMatchingPayerFor1099`.

- **Per-entry helper `entryNeedsIncludedInW2(entry)`**: returns true when `sourceType==='W-2'` AND `qualifiedNotice2014_7Amount > 0`. Drives:
  - Conditional `*` on the `qualifiedAmountIncludedInW2Box1` label
  - Inline advisory hint (no longer save-blocking after 2026-05-20 pivot) clarifying the two valid answers (0 for modern 2024+ box-12-code-II reporting; positive for legacy box-1 inclusion)
- Spouse form gated on `isJointReturn` — entirely disabled (greyed out) on non-MFJ filing statuses.
- `sourceTypeOptions = [W-2, 1099-MISC, 1099-NEC, Other]`
- Schedule C path: section 2's "Yes" answer triggers a prominent banner explaining the Schedule C path and hides sections 3–6 entirely.

### Sidebar entries
| Section | Sidebar label | Form ID |
|---|---|---|
| Incomes | Medicaid waiver | `medicaid-waiver-payments-taxpayer` / `-spouse` |

### PDF export
Line 1d and Schedule 1 line 8s render via the standard tax-return PDF templates (`f1040`, `f1040s1`). No dedicated form like Form 4137.

---

## 7. Unit Test Coverage (refreshed 2026-05-06)

File: `TaxReturnComputeServiceTest.java`. **12 dedicated tests** as of 2026-05-06.

| Test | Branch covered |
|---|---|
| `computesMedicaidWaiverLine1dAndSchedule1Offset` | Happy path — election ON, taxable + qualified, with W-2 box 1 overlap |
| `ignoresNontaxableMedicaidWhenElectionOff` | Election OFF → only taxable on line 1d, no Schedule 1 line 8s |
| `flagsMedicaidWaiverBusinessPath` | Schedule C blocking flag |
| `line1dMfsGuard_spouseMedicaidWaiverNotAggregatedOnMfs` | Issue #1 — MFS spouse exclusion (cascades to both line 1d + line 8s) |
| `flagsWhenCodeIiMissingQualifiedAmount` | Code II reconciliation flag |
| `flagsWhenW2Box1IncludedAmountMissing` | W-2 box 1 unspecified flag |
| `flagsWhenElectionEnabledWithoutQualifiedAmounts` | Election ON with qualifiedTotal=0 (the no-qualified flag) |
| `flagsWhenLine8sExceedsQualifiedTotal` | Line 8s exceeds qualified total + W2_OVERAGE flag (tightened in Issue #4 to assert both) |
| `line1dMfj_bothSpousesElect` | Issue #4(f) — MFJ both spouses elect; line 1d + line 8s both aggregate |
| `line1dMfj_taxpayerElectsSpouseDoesNot_perSpouseElectionRule` | Issue #4(g) — pins all-or-none-PER-SPOUSE election rule |
| `line1dW2LookupNoMatch_includedInW2NullTreatedAsZero` | Issue #4(i) — sourceType=W-2 + no matching W-2 → no flag, full qualified flows |
| `line1dW2LookupMatchedBox1Zero_autoSetsIncludedInW2Zero` | Issue #4(i) — W-2 match + box 1 = 0 (modern 2024+ reporting) → auto-set, no flag |

---

## 8. E2E Test Coverage

File: `e2e/tests/medicaid-waiver.spec.ts` — **5 tests**.

| Test (line) | Scenario covered |
|---|---|
| `taxable Medicaid waiver payments flow to Form 1040 line 1d` (94) | Basic taxable-only path |
| `qualified payments with election populate line 1d and Schedule 1 line 8s` (116) | Election ON happy path |
| `W-2 box 12 code II auto-fill flows into line 1d and Schedule 1 line 8s` (138) | Auto-populate from W-2 + downstream verification |
| `code II requires qualified amount before save` (168) | UI / backend block when code II without qualified amount |
| `trade or business Medicaid waiver payments raise blocking flag and exclude line 1d` (189) | Schedule C path E2E |

**Untested at the E2E layer:** MFS guard (covered by unit test); per-spouse election (covered by unit tests `line1dMfj_*`); cross-entry duplication invariant (algebraic — no E2E needed).

---

## 9. Known Implementation Gaps

See `outstanding.md` for tracked items. Summary:

| Gap | Type | Severity |
|---|---|---|
| IRC §131(c) per-individual cap (>10 individuals under 19 OR >5 individuals 19+) | Compute deferred | Low — niche case (HCBS structurally one recipient per household). Verified 2026-05-06; tracked in `outstanding.md`. Effort estimate: ~2-2.5 hours basic pro-rata if revisited. |
| UI heuristic for cross-entry duplicate detection | UX deferred | Low — primary AGI impact protected by W2_OVERAGE constraint + algebraic offset cancellation; only EIC/ACTC over-claim risk. False-positive rate too high for an automatic check. Tracked in `outstanding.md`. |
| `livesWithCareRecipient` informational field not wired (1d.xlsx Issue #9) | UX | **RESOLVED 2026-05-06** — yellow `.notice2014-warning` advisory callout in both forms (taxpayer + spouse) when `livesWithCareRecipient === false` AND any entry has positive qualified Notice 2014-7 amount. Help text strengthened with explicit Notice 2014-7 home-sharing reference. Blocking-flag escalation considered + deferred (see `outstanding.md`). |

---

## 10. Key Constants

**None — line 1d uses no tax-year-specific computation constants.**

Statutory references (IRS rules, not configurable constants):
- IRS Notice 2014-7: defines qualified Medicaid waiver payments for the difficulty-of-care exclusion
- IRC §131: foster care payments / difficulty-of-care exclusion authority
- IRC §131(c): per-individual cap (>10 under 19 OR >5 19+) — NOT IMPLEMENTED, see Known Gaps
- IRC §32(c)(2) + Notice 2014-7: earned-income inclusion election scope (EIC + ACTC)
- 2024+ payer-side reporting: nontaxable amounts on W-2 box 12 code II (informational/reconciliation only — does not change compute)

---

## Verification log

- **2026-05-06** — 1d.xlsx Code Validation walkthrough complete (Issues #1–#9):
  - **Issue #1** (DEFENSIVE GAP — MFS guard): Backend `computeMedicaidWaiverPayments` gained `boolean isMfs` parameter; spouse skipped on MFS via `MedicaidResult(null, null)`. Single guard cascades to both line 1d + line 8s via `addNonNull`. Test: `line1dMfsGuard_spouseMedicaidWaiverNotAggregatedOnMfs`. Files: `TaxReturnComputeService.java`, `lines/1d.md` §8.5, `dependencies/1d.md`.
  - **Issue #2** (HARD vs SOFT gate decision): Verified `computeMedicaidForPerson` HARD gate on `receivedMedicaidWaiverPayments` is correct — no auto-fill convenience to preserve. No code change; documented contract above.
  - **Issue #3** (DOC vs CODE inconsistency): Resolved by Issue #1 doc edits (`dependencies/1d.md` rows for spouse form, filing status, absence behavior, cross-line consistency all updated).
  - **Issue #4** (TEST COVERAGE GAP): Tightened `flagsWhenLine8sExceedsQualifiedTotal` to also assert W2_OVERAGE; added 4 new tests covering MFJ both-elect, MFJ taxpayer-only-elects (per-spouse rule), and the two W-2 lookup branches (no-match + box1=0). Total +5 changes.
  - **Issue #5** (UI ENFORCEMENT GAP): Added per-entry helper `entryNeedsIncludedInW2(entry)` to both forms; conditional `*` + `[required]` + inline error on `qualifiedAmountIncludedInW2Box1` when sourceType=W-2 AND qualifiedAmount > 0. `isValid()` per-entry block.
  - **Issue #6** (IRC §131(c) cap deferred): Verified safe to defer. Added entry to `outstanding.md` (resolved broken cross-reference); added verification footnote to `lines/1d.md` §4.2. No code change.
  - **Issue #7** (cross-entry double-count — verified benign for AGI): Algebraic proof in `lines/1d.md` §8.6; residual EIC/ACTC inflation risk documented + UI heuristic deferred to `outstanding.md`. No code change.
  - **Issue #8** (KNOWLEDGE FILE MISSING): Created this file mirroring `knowledge/line-1c-tip-income.md` structure. Function-name convention applied throughout per 1c.xlsx Issue #9.
  - **Issue #9** (UX issue — `livesWithCareRecipient` not wired): RESOLVED — added yellow `.notice2014-warning` advisory callout to both `form-medicaid-waiver-{taxpayer,spouse}.component.ts` when `livesWithCareRecipient === false` AND `hasAnyQualifiedAmount()` returns true. Help text rewritten with explicit Notice 2014-7 home-sharing reference. Blocking-flag escalation option deferred to `outstanding.md` for future evaluation. No backend change.
- 471/471 backend tests pass at end of Issue #4. Angular build clean throughout (verified after each UI change).
