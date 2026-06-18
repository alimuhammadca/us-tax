# Dependencies: Form 1040 Lines 25a–25d — Federal Income Tax Withheld (2025)

> Re-authored 2026-06-14. Source of truth: `lines/25abcd.md`.

---

## Formula

```
line25a = roundMoney(Σ W-2 box 2 + Form 4852 line 7e (taxpayer + spouse non-MFS))
        (null-when-zero)

line25b = roundMoney(Σ 1099-series box 4 (13 variants)
                   + SSA-1099 box 6 (non-standard field name)
                   + Form 4852 line 8f (taxpayer + spouse non-MFS))
        (null-when-zero)

line25c = roundMoney(Σ W-2G box 4 + Form 8959 Part V line 24 (positive-filter))
        (null-when-zero)

line25d = roundMoney(nz(line25a) + nz(line25b) + nz(line25c))
        (null-when-zero — ternary at setter)
```

Each sub-line is rounded to whole dollars before being summed into 25d (consistency-rounding closures, see §3). Each sub-line is stored as **null** when its inputs sum to zero.

All four sub-lines are wired in `computeLine31ThroughLine38()` at `TaxReturnComputeService.java:27089-27211`. The method name is historical — it actually handles lines 25-38.

---

## Inputs to Line 25a (W-2 withholding)

| Source | Statement type | Field read | Java variable | Notes |
|---|---|---|---|---|
| W-2 box 2 | `w-2` | `federalIncomeTaxWithheldAmount` | `w2Entries` | MFS-protected at Firestore storage layer (user-scoped queries) |
| Form 4852 line 7e (taxpayer) | personal form `form-form4852` | (per Form 4852 mapper) | `form4852TaxpayerData` | W-2 substitute withholding |
| Form 4852 line 7e (spouse) | personal form | (per Form 4852 mapper) | `form4852SpouseData` | **MFS-guarded** — only included when not MFS |

Helper: `sumFederalWithholdingFromEntries(w2Entries)` + `extractForm4852Line25aWithholding(...)`.

Reference implementation (`TaxReturnComputeService.java:27144-27151`):

```java
BigDecimal withholdingW2 = sumFederalWithholdingFromEntries(w2Entries);
withholdingW2 = addNonNull(withholdingW2, extractForm4852Line25aWithholding(form4852TaxpayerData));
withholdingW2 = addNonNull(withholdingW2,
        isMfsForForm4852 ? null : extractForm4852Line25aWithholding(form4852SpouseData));
withholdingW2 = withholdingW2 == null ? null : roundMoney(withholdingW2);
payments.setWithholdingW2(withholdingW2);
```

---

## Inputs to Line 25b (1099 withholding)

### 13 1099 variants summed via `sumFederalWithholdingFromMultipleLists` (variadic)

| Form | Statement type | Field read | Java variable | Box |
|---|---|---|---|---|
| 1099-R | `1099-r` | `federalIncomeTaxWithheldAmount` | `form1099REntries` | box 4 |
| RRB-1099-R | `rrb-1099-r` | `federalIncomeTaxWithheldAmount` | `formRrb1099REntries` | box 9 |
| 1099-INT | `1099-int` | `federalIncomeTaxWithheldAmount` | `form1099IntEntries` | box 4 |
| 1099-DIV | `1099-div` | `federalIncomeTaxWithheldAmount` | `form1099DivEntries` | box 4 |
| 1099-B | `1099-b` | `federalIncomeTaxWithheldAmount` | `form1099BEntries` | box 4 |
| 1099-OID | `1099-oid` | `federalIncomeTaxWithheldAmount` | `form1099OidEntries` | box 4 |
| 1099-G | `1099-g` | `federalIncomeTaxWithheldAmount` | `form1099GEntries` | box 4 |
| 1099-NEC | `1099-nec` | `federalIncomeTaxWithheldAmount` | `form1099NecEntries` | box 4 |
| 1099-K | `1099-k` | `federalIncomeTaxWithheldAmount` | `form1099KEntries` | box 4 (NOT box 10) |
| 1099-MISC | `1099-misc` | `federalIncomeTaxWithheldAmount` | `form1099MiscEntries` | box 4 |
| RRB-1099 | `rrb-1099` | `federalIncomeTaxWithheldAmount` | `formRrb1099Entries` | box 10 |
| **1099-DA** | `1099-da` | `federalIncomeTaxWithheldAmount` | `form1099DaEntries` | **box 2a — NEW 2025**, non-standard (mapper reads box 2a into the canonical field) |
| 1099-PATR | `1099-patr` | `federalIncomeTaxWithheldAmount` | `form1099PtrEntries` | box 4 — **Gap B closure 2026-06-10** |

### Special handling — SSA-1099

| Source | Statement type | Field read | Java variable | Notes |
|---|---|---|---|---|
| SSA-1099 box 6 | `ssa-1099` | `voluntaryFederalIncomeTaxWithheldAmount` | `formSsa1099Entries` | **Non-standard field name** — frontend convention. Summed by dedicated helper `sumSsa1099Withholding`. |

### Form 4852 line 8f

| Source | Variable | Notes |
|---|---|---|
| Form 4852 line 8f (taxpayer) | `form4852TaxpayerData` | 1099-R substitute withholding |
| Form 4852 line 8f (spouse) | `form4852SpouseData` | **MFS-guarded** |

Reference implementation (`TaxReturnComputeService.java:27159-27176`):

```java
BigDecimal withholding1099 = sumFederalWithholdingFromMultipleLists(
        form1099REntries, formRrb1099REntries,
        form1099IntEntries, form1099DivEntries,
        form1099BEntries, form1099OidEntries,
        form1099GEntries, form1099NecEntries, form1099KEntries,
        form1099MiscEntries, formRrb1099Entries, form1099DaEntries,
        form1099PtrEntries);                                              // Gap B closure 2026-06-10
withholding1099 = addNonNull(withholding1099, sumSsa1099Withholding(formSsa1099Entries));
withholding1099 = addNonNull(withholding1099, extractForm4852Line25bWithholding(form4852TaxpayerData));
withholding1099 = addNonNull(withholding1099,
        isMfsForForm4852 ? null : extractForm4852Line25bWithholding(form4852SpouseData));
withholding1099 = withholding1099 == null ? null : roundMoney(withholding1099);
payments.setWithholding1099(withholding1099);
```

---

## Inputs to Line 25c (Other forms)

| Source | Statement type / form | Field read | Java variable / computation | Notes |
|---|---|---|---|---|
| W-2G box 4 | `w-2g` | `federalIncomeTaxWithheldAmount` | `formW2gEntries` | Gambling winnings withholding |
| Form 8959 Part V line 24 | Computed form (built in `prepare()`) | `Form8959.line24TotalAmtWithheld` | `form8959` | **Positive-filter Gap B** — only included when `> 0` |

Form 8959 Part V line 24 composition (built by `buildForm8959()`):

```
line19 = sumW2MedicareTaxWithheld(w2Entries)          // W-2 box 6 — total Medicare tax withheld
line21 = 1.45% × Medicare wages (Part I line 1)       // regular Medicare on those wages
line22 = max(0, line19 - line21)                      // excess withheld beyond regular 1.45%
line23 = sumRrtaAmtWithheldFromTipForm(tipForms)      // RRTA tip withholding (Form 4137 Part II)
line24 = addNonNull(line22, line23)                   // → 25c contribution
```

Note: line22 is null (not zero) when box 6 does not exceed 1.45% × Medicare wages.

Reference implementation (`TaxReturnComputeService.java:27180-27205`):

```java
BigDecimal withholdingOther = sumFederalWithholdingFromEntries(formW2gEntries);

// Form 8959 Part V line 24 with defensive positive filter (Gap B closure 2026-06-10)
BigDecimal form8959Line24 = form8959 == null ? null : form8959.getLine24TotalAmtWithheld();
if (form8959Line24 != null && form8959Line24.compareTo(BigDecimal.ZERO) > 0) {
    withholdingOther = safeAmount(withholdingOther).add(form8959Line24);
}

withholdingOther = withholdingOther == null ? null : roundMoney(withholdingOther);
payments.setWithholdingOther(withholdingOther);
```

The `> 0` guard on Form 8959 line 24 is a **defensive positive-filter**. Per the 2025 Form 8959 instructions, line 24 = `max(0, line22) + line23` with both addends non-negative by construction. A non-positive value would indicate corrupt upstream data and must not silently subtract from line 25c. Same pattern as line 25a (§9 G6) and line 25b (§9d Gap C).

### Deferred OOS (Gap E) line 25c inputs

| Source | Status |
|---|---|
| Schedule K-1 (pass-through withholding) | Not implemented |
| Form 1042-S (foreign person withholding) | Not implemented |
| Form 8805 (§1446 withholding) | Not implemented |
| Form 8288-A (FIRPTA withholding) | Not implemented |

Documented as implementation gap, not tax-law exclusion. Real-return impact is rare for filers in current scope.

---

## Line 25d (Total withholding)

```
line25d = roundMoney(nz(line25a) + nz(line25b) + nz(line25c))
```

The 2025 form instruction is exact: `Add lines 25a through 25c.`

Reference implementation (`TaxReturnComputeService.java:27208-27211`):

```java
BigDecimal totalWithholding = roundMoney(safeAmount(withholdingW2)
        .add(safeAmount(withholding1099))
        .add(safeAmount(withholdingOther)));
payments.setTotalWithholding(totalWithholding.compareTo(BigDecimal.ZERO) > 0 ? totalWithholding : null);
```

The null-when-zero convention is enforced via a **ternary at the setter** — unique among the four sub-lines (25a/25b/25c each use an inline `roundMoney(...)` with their own ternary before the `setXxx` call; 25d uses the ternary directly inside the `setTotalWithholding(...)` argument).

---

## Whole-Dollar Sub-Line Rounding (consistency closure)

Each sub-line is rounded to whole dollars before being summed into 25d. Recent consistency closures (2026-06-10):

| Sub-line | Closure ID | Location |
|---|---|---|
| 25a | §8b G2 closure | `TaxReturnComputeService.java:27150` — `withholdingW2 = withholdingW2 == null ? null : roundMoney(withholdingW2);` |
| 25b | §9e Gap D closure | `TaxReturnComputeService.java:27175` — `withholding1099 = withholding1099 == null ? null : roundMoney(withholding1099);` |
| 25c | §8a Gap A closure | `TaxReturnComputeService.java:27204` — `withholdingOther = withholdingOther == null ? null : roundMoney(withholdingOther);` |

Before these closures, the W-2G-only path stored the raw `BigDecimal` from `sumFederalWithholdingFromEntries` without rounding while the Form-8959-add branch did round. The inconsistency produced no observable difference on integer-dollar inputs but would surface on non-integer cents.

---

## MFS Protection (Two-tier)

### Tier 1 — Statement-derived withholding (upstream-data-segregated-at-storage)

W-2 box 2, all 1099-series box 4, SSA-1099 box 6, RRB-1099 box 10, W-2G box 4 are segregated at the **Firestore storage layer**:

- Each household has one user UID.
- Statement queries are user-scoped.
- On MFS, only the taxpayer's statements are loaded.
- No in-method MFS check needed — segregation is structural.

### Tier 2 — Personal-form-derived withholding (explicit in-method guard)

Form 4852 is a personal form (per-spouse), so spouse data is **not** automatically segregated. Explicit guard at `TaxReturnComputeService.java:27137-27138`:

```java
boolean isMfsForForm4852 = "Married filing separately"
        .equalsIgnoreCase(normalizeFilingStatus(getString(filingStatusData, "filingStatus")));
```

Applied at lines 27147 (line 25a — Form 4852 line 7e spouse) and 27171 (line 25b — Form 4852 line 8f spouse). When `isMfsForForm4852 = true`, the spouse's Form 4852 substitute withholding is excluded.

---

## Outputs

| Output | Java field | Model class | Storage convention |
|---|---|---|---|
| Line 25a — W-2 withholding | `Payments.withholdingW2` | `Payments.java` | null-when-zero |
| Line 25b — 1099 withholding | `Payments.withholding1099` | `Payments.java` | null-when-zero |
| Line 25c — other withholding | `Payments.withholdingOther` | `Payments.java` | null-when-zero |
| Line 25d — total withholding | `Payments.totalWithholding` | `Payments.java` | null-when-zero (ternary at setter — unique mechanism) |

---

## Downstream Consumers of Line 25d

| Consumer | Field read | How used | Location |
|---|---|---|---|
| `computeLine31ThroughLine38()` — line 33 | `payments.getTotalWithholding()` | `line33 = line25d + line26 + line32` | `TaxReturnComputeService.java:~27293-27313` |
| Frontend `line25dTotalWithholding()` | `payments.withholdingW2 / withholding1099 / withholdingOther` | **Dual-path recompute**: PDF export reads `payments.totalWithholding` directly; line-33 recompute view uses `sumAmounts([line25dTotalWithholding(), payments.estimatedTaxPayments, line32OtherPayments()])` — prefers backend `totalWithholding`, falls back to client-side sum of three sub-lines when backend value is absent | `form-tax-return-1040.component.ts:454` (recompute) and ~line 396 (PDF) |
| PDF field `line25d_total_withholding` | `line25dTotalWithholding()` | AcroForm field `f2_20[0]` page 2 | `f1040_field_mapping_semantic.csv` |

---

## Compute Order

```
prepare() {
  form1099DaEntries = listEntriesWithData(uid, "1099-da")     // ~line 245
  formW2gEntries    = listEntriesWithData(uid, "w-2g")        // ~line 260
  form8959          = buildForm8959(...)                       // ~line 591 — Part V line24 set here
  ...
}

computeLine31ThroughLine38() {                                 // TaxReturnComputeService.java:27089
  isMfsForForm4852 = (filingStatus == "Married filing separately")    // 27137-27138

  // Line 25a
  withholdingW2 = sumFederalWithholdingFromEntries(w2Entries)        // 27144
  withholdingW2 += extractForm4852Line25aWithholding(taxpayer)       // 27145
  withholdingW2 += isMfsForForm4852 ? null
                 : extractForm4852Line25aWithholding(spouse)         // 27147
  withholdingW2 = roundMoney(withholdingW2)                          // 27150 — Gap closure
  payments.setWithholdingW2(withholdingW2)                           // 27151

  // Line 25b
  withholding1099 = sumFederalWithholdingFromMultipleLists(          // 27159
      form1099REntries, formRrb1099REntries,
      form1099IntEntries, form1099DivEntries,
      form1099BEntries, form1099OidEntries,
      form1099GEntries, form1099NecEntries, form1099KEntries,
      form1099MiscEntries, formRrb1099Entries, form1099DaEntries,
      form1099PtrEntries)                                            // Gap B closure
  withholding1099 += sumSsa1099Withholding(formSsa1099Entries)       // 27167
  withholding1099 += extractForm4852Line25bWithholding(taxpayer)     // 27170
  withholding1099 += isMfsForForm4852 ? null
                   : extractForm4852Line25bWithholding(spouse)       // 27171
  withholding1099 = roundMoney(withholding1099)                      // 27175 — Gap D closure
  payments.setWithholding1099(withholding1099)                       // 27176

  // Line 25c
  withholdingOther = sumFederalWithholdingFromEntries(formW2gEntries)    // 27180
  if (form8959.line24TotalAmtWithheld > 0)                              // 27182-27184 — positive-filter
      withholdingOther += form8959.line24TotalAmtWithheld
  withholdingOther = roundMoney(withholdingOther)                        // 27204 — Gap A closure
  payments.setWithholdingOther(withholdingOther)                         // 27205

  // Line 25d
  totalWithholding = roundMoney(safeAmount(line25a)
                              + safeAmount(line25b)
                              + safeAmount(line25c))                    // 27208-27210
  payments.setTotalWithholding(totalWithholding > 0 ? totalWithholding : null)  // 27211
}
```

---

## PDF Field Mapping (Form 1040 page 2)

| Sub-line | PDF semantic key | AcroForm field |
|---|---|---|
| 25a | `line25a_federal_income_tax_withheld_w2` | `f2_17[0]` |
| 25b | `line25b_federal_income_tax_withheld_1099` | `f2_18[0]` |
| 25c | `line25c_federal_income_tax_withheld_other_forms` | `f2_19[0]` |
| 25d | `line25d_total_withholding` | `f2_20[0]` |

CSV source: `C:\us-tax\us-tax-ui\public\irs\f1040_field_mapping_semantic.csv`.

---

## Guardrails (from lines/25abcd.md §5)

| Rule | Notes |
|---|---|
| `line25a/b/c/d >= 0` | Each sub-line is non-negative; total dominates each addend |
| `line25d = nz(25a) + nz(25b) + nz(25c)` | structural |
| SSA-1099 and RRB-1099 belong in **25b** (not 25c) | Confusion trap — moved to 25b per 2025 instructions |
| W-2G belongs in **25c** (not 25b) | W-2G is gambling winnings, routed separately |
| 1099-K withholding is **box 4** (not box 10) | Common mismatch in older mappers |
| 1099-DA withholding is **box 2a** (not box 4) | NEW 2025 — mapper reads box 2a into canonical field |
| Form 8959 line 24 belongs in **25c** (NOT Schedule 2 line 11 / Form 1040 line 23) | Critical line 24 vs. line 18 distinction; line 24 of Form 8959 Part V is the withheld amount |
| Form 4852 substitute withholding is MFS-guarded for spouse | Statement-derived withholding is auto-segregated at storage |
| Paper-return attachments: W-2, 1099-R (if withholding shown), W-2G, Form 8959, 1042-S, 8805, 8288-A | When used to claim withholding credit |

---

## Scope Boundaries

| Item | Status |
|---|---|
| W-2 box 2 → line 25a | Implemented |
| Form 4852 lines 7e + 8f (taxpayer + spouse non-MFS) | Implemented |
| All 13 1099 variants box 4 → line 25b | Implemented (1099-DA box 2a, 1099-PATR Gap B closure 2026-06-10) |
| SSA-1099 box 6 (non-standard field name) → line 25b | Implemented |
| RRB-1099 box 10 → line 25b | Implemented |
| RRB-1099-R box 9 → line 25b | Implemented |
| W-2G box 4 → line 25c | Implemented |
| Form 8959 Part V line 24 → line 25c (positive-filter) | Implemented |
| Schedule K-1 / Form 1042-S / Form 8805 / Form 8288-A → line 25c | **Deferred OOS (Gap E)** |
| Community property MFS allocation | Not implemented |

---

## Lock-in Tests

| Test | Asserts |
|---|---|
| `line25bWithholdingFrom1099Da` | 1099-DA box 2a flows to line 25b (Gap G1 closure) |
| (Form 4852 MFS guards) | Spouse Form 4852 line 7e / 8f excluded when MFS |
| (Form 8959 positive-filter) | Negative or null line 24 is not subtracted from line 25c |

---

## Known Gaps

| Gap | Severity | Status |
|---|---|---|
| Gap E | LOW | K-1 / 1042-S / 8805 / 8288-A withholding deferred OOS — documented as implementation gap |
| (G1, G2 historical) | — | 1099-DA support, 1099-PATR addition, sub-line rounding consistency, Form 8959 positive-filter all closed 2026-04-19 / 2026-06-10 |

No outstanding gaps beyond the documented Gap E deferred-OOS list.
