# Knowledge: Form 1040 Line 1f — Taxable Employer-Provided Adoption Benefits (Form 8839 Part III Line 31)

Built from: spec (`lines/1f.md`), dependency map (`dependencies/1f.md`), backend compute service, frontend adoption-expenses component, unit tests, E2E tests, output models, semantic field map.
Last updated: 2026-05-08 (created during 1f.xlsx Code Validation walkthrough — Issues #1–#4 closed; #5–#12 still open).

---

## 1. What is Line 1f?

Form 1040 line 1f reports the **taxable portion of employer-provided adoption benefits** — exactly Form 8839 Part III line 31. It is the residual of W-2 box 12 code T amounts (per child) that fails one of:

| Limit | Mechanism |
|---|---|
| Per-child exclusion limit (IRC §137(b)(1)) | $17,280 lifetime per eligible child (`ADOPTION_MAX_EXCLUSION_PER_CHILD`) — minus prior-year usage |
| MAGI phaseout (IRC §137(b)(2)) | Starts at $259,190 (`ADOPTION_PHASEOUT_START`); full phase-out at $299,190 (start + $40,000 range) |
| Foreign-child finality | Pre-finality benefits taxable; finality-year retroactive exclusion mechanism deferred (see §9) |
| MFS joint-return restriction (IRC §137(f)) | MFS filer must qualify for lived-apart-6-months OR legal-separation exception; otherwise full benefits taxable |

Special branch: when the **special-needs rule** applies (IRC §137(a)(3)) — special-needs child + adoption final in 2025 — `L24[i] = L21[i]` (full remaining exclusion regardless of W-2 box 12 code T amount). This is the only path in current code that produces a **negative line 1f** (excluded amount > current-year benefits → reduces total wages).

**Two-pass vs single-pass:** Line 1f is **single-pass** (unlike line 1e). Part III + Part II refundable credit (line 13) compute together inside `computeAdoptionBenefits`. Part II nonrefundable credit (line 18, Schedule 3 line 6c) requires the Credit Limit Worksheet and is deferred.

**"PYAB" PDF write-in:** Per 2025 IRS Form 1040 instructions, when line 1f comes from Form 8839 line 31 with line 30 > line 23 (negative result), enter "PYAB" on the dotted line next to line 1f. **NOT currently rendered** — analogous to the line 1e "DCB" write-in (which we DID add in 1e.xlsx Issue #3 via the generic `extraTextOverlays` mechanism); the line 1f write-in could reuse the same mechanism. See §9.

---

## 2. Personal Form ID

| Form ID | Role |
|---|---|
| `adoption-expenses` | Single per-return form (NOT per-spouse — Form 8839 is return-level even on MFJ). Drives Form 8839 Parts I + II + III, line 1f, and (when implemented) Schedule 3 line 6c. |

Cross-form integration:
- W-2 statement entries (`users/{uid}/w-2/{entryId}`) for box 12 code T (`box12Entries[].code = "T"`)
- `filing-status` for MFS detection (IRC §137(f) joint-return requirement) + `mfsOrHohLivedApartOrLegallySeparated` exception
- `you` / `spouse` for SSN-based W-2 attribution (added via 1f.xlsx Issue #2 — SSN filter)

---

## 3. Form Sections + YAML Fields — `adoption-expenses`

### Form-level

| Field | Type | Notes |
|---|---|---|
| `claimsAdoptionExpensesOrBenefits` | boolean | UI display gate ("Did you adopt a child, receive employer adoption assistance...?"). Backend gate is `hasAnyAdoptionInputs` (positive-amount based, mirrors `hasAnyChildcareData`). |
| `doesW2CodeTAmountLookCorrect` | boolean | Optional confirmation. Display only — does not affect compute. |
| `moreThanThreeChildren` | boolean | Display only. Backend separately handles up to 6 inline children + non-blocking `ADOPTION_BENEFITS_TOO_MANY_CHILDREN` if > 6. |

### `children.entries[]` (per child, up to 6)

| Field | Purpose |
|---|---|
| `childFirstName` / `childLastName` / `childYearOfBirth` / `identifyingNumber` | Form 8839 Part I display + per-child allocation key |
| `bornBefore2008AndDisabled` | Part I line 1c checkbox; eligibility marker for over-18 disabled children. No direct Part III impact. |
| `hasSpecialNeeds` | Drives the special-needs override branch (L24 = L21 when also `adoptionFinal=true`) |
| `isForeignChild` | Foreign-adoption finality gate; when `true && !adoptionFinal` → blocking flag |
| `adoptionFinal2025OrEarlier` | Drives both special-needs branch AND foreign-child finality gate |
| `claimsAdoptionCredit` | Display only — does not affect line 1f. Drives Part II credit path (refundable wired; nonrefundable deferred). |

### `adoptionCreditPartII` (Part II credit — refundable wired; nonrefundable deferred)

| Field | Purpose |
|---|---|
| `priorYearAdoptionCreditByChild["child{N}PriorYearCredit"]` | Drives Part II line 3 (prior-year credit reducer) |
| `qualifiedAdoptionExpensesByChild["child{N}QualifiedExpenses"]` | Drives Part II line 5 (credit base) |
| `line15CreditCarryforward` | Return-level credit carryforward; stored on Form 8839; nonrefundable credit deferred |

### `employerBenefitsPartIII` (the line 1f-driving section)

| Field | Purpose |
|---|---|
| `priorYearEmployerBenefitsByChild["child{N}PriorYearBenefits"]` | L20[i]: prior-year usage against this child's lifetime $17,280 cap |
| `currentYearBenefitsAllocation["child{N}Benefits2025"]` | L22[i]: per-child allocation of current-year W-2 box 12 code T. Sum across children must equal `w2TotalBenefits` or `ADOPTION_BENEFITS_ALLOCATION_MISMATCH` fires (blocking). |

### `imports.magiForAdoptionBenefitsExclusion` (backend-only)

| Field | Purpose |
|---|---|
| `magiForAdoptionBenefitsExclusion` | MAGI for Form 8839 line 25; drives phaseout. **Source unclear** — see Issues #9 + #12 in §9 below. |

---

## 4. Backend Compute Logic

Function-name references only (per the 2026-05-06 codification — line numbers drift with refactors). All in `TaxReturnComputeService.java`.

### Entry points

| Function | Role |
|---|---|
| `computeAdoptionBenefits(adoptionData, w2Entries, filingStatus, you, spouse, isMfsReturn, flags)` | Phase 1. Reads MAGI from `imports.magiForAdoptionBenefitsExclusion` (manual entry) — if null, defaults phaseoutFraction to ZERO. Orchestrates Part III (exclusion → line 1f) + Part II refundable credit. MFS gate inline (early-return on disallowed). Returns `AdoptionComputation(line1f, refundableCredit, form8839)`. |
| `applyAdoptionCredit(schedule3, adoption, form1040, schedule8812, form2555*, puertoRico, form4563)` | Phase 2. Runs in `prepare()` after Form 2555 + Schedule 3 lines 1-6b are computed. Performs **G1 MAGI auto-derive** (see §5) when Phase 1 MAGI was absent: `autoMagi = AGI + Form 2555 lines 45/50 + Puerto Rico + Form 4563 line 15`; re-runs Part II + Part III with corrected phaseout; propagates corrected line 1f back to Form 1040. Also computes Credit Limit Worksheet B (line 17) for nonrefundable credit (line 18) — currently deferred. |
| `buildAdoptionChildren(childEntries)` | Maps per-child YAML to `Form8839Child` model objects (up to 6) |
| `computeAdoptionPhaseoutFraction(magi)` | Returns `min(1.0, max(0, (magi − $259,190) / $40,000))` rounded HALF_UP to 4 decimal places. Returns null when magi is null (defaults to ZERO downstream in Phase 1; G1 catches this in Phase 2 — see §5). |

### Helpers

| Function | Role |
|---|---|
| `sumW2AdoptionBenefitsForSsns(w2Entries, ssns...)` | SSN-filtered W-2 box 12 code T sum (added 2026-05-08 for 1f.xlsx Issue #2). Replaces unfiltered sum on MFS. Mirrors `sumW2DependentCareBenefitsForSsns` (line 1e). |
| `sumW2AdoptionBenefits(w2Entries)` | Legacy unfiltered sum — used only as fallback when neither SSN is populated (test data / partial-setup scenarios). |
| `hasAnyAdoptionInputs(...)` | Positive-amount-based predicate; triggers Form 8839 instantiation. Mirror of `hasAnyChildcareData` after line 1e Issue #6 tightening. |
| `hasAnyAdoptionChildInput(entry)` | Per-child positive-data check |
| `hasAnyAmountInMap(map, keys...)` | Per-key positive-amount check |
| `countAdoptionChildren(childEntries)` | Counts populated child rows |

### MFS gating cascade (1f.xlsx Issues #2 + #3)

| Boolean | Source | Effect |
|---|---|---|
| `isMfsReturn` | derived in `prepare()` from `filing-status` | Single source of truth; passed into `computeAdoptionBenefits` (added 2026-05-08); SSN-filters W-2 box T sum to taxpayer-only on MFS |
| `isMfs` (inside `computeAdoptionBenefits`) | derived inline from filingStatus param | Drives the MFS-disallowed early-return (when no exception) |
| `mfsLivedApartOrLegalSeparation` | filingStatus.`mfsOrHohLivedApartOrLegallySeparated` | Lifts the MFS disallowance per IRC §137(f) exception |
| `mfsExclusionDisallowed` | `isMfs && !mfsLivedApartOrLegalSeparation` | Triggers `ADOPTION_BENEFITS_MFS_EXCLUSION_DISALLOWED` (NON-blocking since 2026-05-08 — Issue #3) + line 1f = w2TotalBenefits + form8839 = null |

### Compute order

```
prepare()
  → isMfsReturn = (filing-status == MFS)
  → computeAdoptionBenefits(..., you, spouse, isMfsReturn, flags)
     → SSN-filtered w2TotalBenefits
     → outer-gate flags
     → MFS gate (early-return if disallowed)
     → too-many-children check
     → per-child Part III loop (L19/L20/L21/L22/L24 + Part II 2-6 + foreign-child-finality advisory)
     → allocation-match check
     → MAGI lookup + phaseout fraction
     → Part II refundable credit (line 11a/11b/12/13 when MAGI available)
     → Part III lines 28/29/30/31 (when allowPartIII)
     → return AdoptionComputation(line1f, refundableCredit, form8839)
  → buildForm1040 — line 1f plugged into income aggregation; refundableAdoptionCredit → form1040.payments
```

### Blocking + non-blocking flags inventory

| Flag | Trigger | Severity |
|---|---|---|
| `ADOPTION_BENEFITS_FORM_REQUIRED` | W-2 box T > 0 AND no adoption-expenses inputs | BLOCKING |
| `ADOPTION_BENEFITS_OFF_W2_NOT_SPECIAL_NEEDS_CHILD_N` | Per child: no W-2 box T AND positive priorYearEmployerBenefits OR currentYearBenefitsAllocation AND NOT (specialNeeds && adoptionFinal2025OrEarlier) | BLOCKING (per-child since 2026-05-08, Issue #11 — replaces the prior function-level `ADOPTION_BENEFITS_W2_REQUIRED` which over-blocked legitimate special-needs filings) |
| `ADOPTION_BENEFITS_MFS_EXCLUSION_DISALLOWED` | MFS && !exception | **NON-blocking** (since 2026-05-08, Issue #3) |
| `ADOPTION_BENEFITS_TOO_MANY_CHILDREN` | childEntries > 6 | NON-blocking |
| `ADOPTION_BENEFITS_CHILD_REQUIRED` | (hasBenefits OR hasAdoptionInputs) && childEntryCount = 0 | BLOCKING |
| `ADOPTION_BENEFITS_FOREIGN_CHILD_NOT_FINAL` | Per child: foreignChild && !adoptionFinal | BLOCKING |
| `ADOPTION_BENEFITS_FINALIZATION_REQUIRED` | Per child: specialNeeds && finalization-not-answered | BLOCKING |
| `ADOPTION_BENEFITS_ALLOCATION_MISMATCH` | sum(L22[i]) ≠ w2TotalBenefits | BLOCKING |
| `ADOPTION_BENEFITS_FOREIGN_CHILD_FINALITY_RETRO_PARTIAL` | Per child: foreignChild && adoptionFinal && priorYearBenefits[N] > 0 && !specialNeeds | **NON-blocking** (added 2026-05-08, Issue #1) |

---

## 5. Two-Path MAGI Architecture

Line 1f's MAGI handling is **two-path** — Phase 1 reads a manual entry; Phase 2 (G1 fallback) auto-derives from AGI when Phase 1 had no manual MAGI. This is conceptually similar to line 1e's two-pass architecture for the §21 credit, but applies only to MAGI (the rest of Part III + Part II refundable credit compute in a single pass). 1f.xlsx Issue #9 closure (2026-05-08) verified the G1 path works correctly and added test coverage.

### Phase 1 — `computeAdoptionBenefits` (in `prepare()`)

- Runs BEFORE AGI is computed.
- Reads MAGI from `adoption-expenses.imports.magiForAdoptionBenefitsExclusion` (manual entry — not currently auto-populated by any pre-compute or upload extraction path).
- When MAGI is null → `phaseoutFraction = ZERO` → full exclusion (this is the over-claim risk if Phase 2 doesn't catch it).
- Computes Part III lines 19-31 + Part II lines 2-13 (when MAGI present).
- Returns `AdoptionComputation(line1f, refundableCredit, form8839)`.

### Phase 2 — `applyAdoptionCredit` G1 fallback (after Form 2555 + Schedule 3 lines 1-6b)

- Runs AFTER `buildForm1040` produces AGI AND Form 2555 has computed foreign-earned-income / housing exclusions.
- **G1 gate**: `if (form8839.getPart2Line7ModifiedAgi() == null)` — fires only when Phase 1 didn't have a manual MAGI.
- Auto-derives:
  ```
  autoMagi = AGI
           + Form 2555 line 45 (foreign earned income exclusion, taxpayer + spouse)
           + Form 2555 line 50 (housing exclusion, taxpayer + spouse)
           + Puerto Rico excluded income (additional-deductions-taxpayer.puertoRicoExcludedIncome)
           + Form 4563 line 15 (American Samoa excluded income)
           + Student-loan interest deduction (Schedule 1 line 21)           // Gap #8 (2026-05-24)
           + Series EE/I U.S. savings bond interest exclusion (Sch B line 3) // Gap #8 (2026-05-24)
           + Foreign-housing deduction — self-employed (Sch 1 line 24j)     // Gap #8 (2026-05-24)
  ```
- Re-computes `phaseoutFraction = computeAdoptionPhaseoutFraction(autoMagi)`.
- Re-runs per-child Part II using stored line 6 → recomputes lines 10/11a/11b → updates totals 11c/12/13.
- Re-runs per-child Part III using stored line 24 → recomputes lines 28/29 → updates totals 30/31.
- **Propagates corrected line 1f back**: `form1040.getIncome().setAdoptionBenefits(roundMoney(newLine31))`.
- Updates `form8839.setPart2Line7ModifiedAgi(autoMagi)` + line 9 phaseout fraction + line 8 above/below-threshold flags + Part III line 25 + line 27.

### When does the manual MAGI win over G1?

User-supplied MAGI (any non-null value, including 0) trumps G1. The G1 gate `getPart2Line7ModifiedAgi() == null` only fires when Phase 1 didn't set the field. If user explicitly enters MAGI = 0, Phase 1 sets line 7 = ZERO, G1 doesn't fire, and the user value wins. Tests: `g1DoesNotFireWhenMagiManuallyProvided` locks this behavior.

### Iterative-AGI approximation

G1's `autoMagi` uses the AGI computed in Phase 1 (when line 1f had no phaseout = full exclusion, line 1f = 0). After G1 re-runs Part III with a non-zero phaseout, the corrected line 1f bumps AGI — but G1 doesn't iterate. This is mathematically a one-shot approximation, accepted because:
- Phaseout denominator ($40,000) makes the fraction insensitive to small AGI shifts
- IRS Form 8839 itself uses single-pass MAGI; iterative recomputation isn't required

### Single-pass summary

- **Part III (exclusion → line 1f)** — fully computed Phase 1 with Phase 2 G1 correction
- **Part II refundable credit (line 13 → Form 1040 line 30)** — computed inline when MAGI available; G1 also re-runs this in Phase 2
- **Part II nonrefundable credit (line 18 → Schedule 3 line 6c)** — DEFERRED. Requires the Credit Limit Worksheet (line 17). Outputs `part2Line18NonrefundableAdoptionCredit` set to null.

---

## 6. Form 1040 Line 30 Refundable Credit Wire-Up

```
Form 8839 Part II line 11a per child (after MAGI phaseout)
  → line 11b per child = min(line 11a, $5,000)             (ADOPTION_LINE11B_REFUNDABLE_CAP)
  → line 11c (return total) = Σ line 11b
  → line 13 = line 11c                                      (refundable adoption credit)
  → form1040.payments.refundableAdoptionCredit = roundMoney(line 13)
  → Form 1040 line 30 (refundable credit)
```

This is a **new OBBBA 2025** path — refundable portion of adoption credit, capped at $5,000/return. Independent of line 1f (which is the §137 exclusion); shares only Form 8839 Part II computation infrastructure.

Suppressed when `mfsExclusionDisallowed` (refundable credit also disallowed for MFS-no-exception per IRC §23(f) joint-return restriction; same exception list as IRC §137(f)).

The nonrefundable Part II line 18 (which would feed Schedule 3 line 6c) is DEFERRED — Credit Limit Worksheet not implemented.

---

## 7. Frontend Forms

### `form-adoption-expenses.component.ts`

Single component — NOT per-spouse. Renders:
- Outer `claimsAdoptionExpensesOrBenefits` Yes/No gate
- Per-child entries section (up to 6, with `moreThanThreeChildren` overflow indicator)
- Per-child Part II inputs (priorYearAdoptionCreditByChild + qualifiedAdoptionExpensesByChild)
- Per-child Part III inputs (priorYearEmployerBenefitsByChild + currentYearBenefitsAllocation)
- Return-level `line15CreditCarryforward`
- W-2 box 12 code T source-attribution banner ("Total $X from N W-2(s)")
- `doesW2CodeTAmountLookCorrect` confirmation

Per-child UI dynamically reveals fields based on `claimsAdoptionCredit` (Part II) and the presence of W-2 box 12 code T (Part III).

### Sidebar entry

| Section | Sidebar label | Form ID |
|---|---|---|
| Personal | Adoption Expenses | `adoption-expenses` |

### PDF export

- Form 8839 itself (`f8839`) renders via `form-tax-return-8839.component.ts` → `saveAsPdf()`. Children 1–3 on main page; children 4–6 on overflow page appended via `pdf-lib copyPages()`.
- Form 1040 line 1f amount renders via `line1f_employer_provided_adoption_benefits` field on f1040.
- "PYAB" write-in label NOT rendered (Issue analogous to line 1e Issue #3 — could reuse the `extraTextOverlays` mechanism).

---

## 8. Unit + E2E Test Coverage (refreshed 2026-05-08)

### Unit tests — `TaxReturnComputeServiceTest.java` — **14 dedicated tests** covering line 1f / Form 8839

| Test | Branch covered |
|---|---|
| `computesAdoptionBenefitsLine1fWithPriorYearBenefits` | Happy path — single child, prior-year benefits, line 1f computed |
| `computesNegativeAdoptionBenefitsForSpecialNeeds` | Special-needs branch produces negative L31 |
| `flagsAdoptionBenefitsAllocationMismatch` | sum(L22) ≠ w2TotalBenefits → blocking flag |
| `flagsAdoptionBenefitsMissingW2ForPartIIIInputs` | Part III inputs without W-2 box T → blocking flag (Issue #11 over-blocking) |
| `flagsAdoptionBenefitsForeignChildNotFinal` | Foreign + !final → per-child blocking flag |
| `flagsAdoptionBenefitsFinalizationRequiredForSpecialNeeds` | Special-needs + finalization-not-answered → blocking flag |
| `mfsExcludesSpouseW2BoxTFromLine1f` | 1f.xlsx Issue #2 lock-in: SSN filter excludes spouse W-2 box T on MFS |
| `emitsForeignChildFinalityRetroAdvisoryWhenPriorYearBenefitsPresent` | 1f.xlsx Issue #1 lock-in: foreign-finality-retro non-blocking advisory |
| `noForeignChildFinalityRetroAdvisoryWhenSpecialNeeds` | Issue #1 sanity: special-needs branch suppresses the advisory |
| `adoptionBenefitsMfsWithoutExceptionIsFullyTaxable` | MFS-no-exception: full benefits taxable on line 1f; Issue #3 — flag is non-blocking |
| `adoptionBenefitsMfsWithLivedApartExceptionAllowsExclusion` | MFS WITH separation exception: normal exclusion path |
| `adoptionBenefitsFourChildrenAllExcluded` | 4 children + W-2 box T allocation matches; full exclusion |
| `adoptionBenefitsSevenChildrenEmitsNonBlockingFlag` | > 6 children → non-blocking too-many-children advisory |
| `adoptionCreditMfsWithoutExceptionEmitsAdvisoryAndSuppressesForm` | Issue #3 — Form 8839 null + non-blocking flag + refundable credit suppressed |

Plus 5 dedicated **Part II refundable credit** tests (`computesRefundableAdoptionCreditBelowPhaseout`, `...AtFiftyPercentPhaseout`, `...AbovePhaseoutCeiling`, `...TwoChildren`, `...WithPriorYearCredit`) — these don't directly assert line 1f but exercise the same `computeAdoptionBenefits` function and MAGI phaseout machinery.

### E2E tests — `e2e/tests/line1f-adoption-benefits.spec.ts` (11 tests) + `e2e/tests/form8839-adoption-credits.spec.ts` (8 tests)

| Test (line 1f spec) | Scenario |
|---|---|
| `taxable adoption benefits flow to line 1f` | Happy path |
| `special needs rule can create negative line 1f` | Special-needs negative L31 (E2E) |
| `multiple W-2 entries aggregate box 12 code T totals` | Aggregation |
| `allocation mismatch disables saving adoption benefits` | UI/backend allocation block |
| `foreign child must be final before saving adoption benefits` | Foreign + !final blocking |
| `special needs requires finalization answer before saving adoption benefits` | Finalization-required blocking |
| `MFS without exception makes full W-2 code T amount taxable on line 1f` | MFS-no-exception |
| `MFS with lived-apart exception allows adoption benefit exclusion` | MFS-with-exception |
| `Form 8839 sidebar item appears only after compute with adoption data` | UI navigation |
| `W-2 Box 12 code T source attribution banner appears when benefits are present` | UI banner |

**Untested at the E2E layer**: 1f.xlsx Issue #1 foreign-finality-retro advisory; 1f.xlsx Issue #2 SSN-leak (covered by unit test); MAGI phaseout boundaries (Issue #5).

---

## 9. Known Implementation Gaps

See `outstanding.md` for tracked deferrals. Summary of OPEN items from the 1f.xlsx audit (as of 2026-05-08):

| Issue | Type | Severity | Status |
|---|---|---|---|
| #5 — Test coverage gaps for Part III MAGI phaseout boundaries (start, 50%, ceiling) | Test additions | LOW | OPEN — pending walkthrough |
| ~~#6 — Shared-adoption $17,280 split (when same child adopted with non-spouse)~~ | Backend + UI | LOW | **CLOSED 2026-05-23**. Per-child override on `form-adoption-expenses` under Less common situations + `resolveSharedAdoptionCap` helper applied to both Part II line 2 and Part III line 19 + non-blocking `ADOPTION_BENEFITS_SHARED_ADOPTION_CAP_SPLIT`. 3 unit tests + 1 E2E test. |
| ~~#7 — IRC §1372 over-2% S corp owner exclusion disallowance~~ | Backend + UI | LOW-MEDIUM | **CLOSED 2026-05-23**. Per-W-2 §1372 partition on `form-adoption-expenses` under Less common situations + `computeSection1372DisallowedFromEligibleW2BoxT` helper + `Form8839.section1372DisallowedFromW2BoxT` output + non-blocking `ADOPTION_BENEFITS_SECTION_1372_DISALLOWED`. 3 unit tests + 1 E2E test. Constructive-ownership §318 attribution captured in question wording, not separately computed. |
| #8 — IRC §137(d) same-expense coordination not enforced (Part II credit + Part III exclusion can claim same expenses) | Backend (when nonrefundable credit lands) | MEDIUM | OPEN — pending walkthrough |
| ~~Form 8839 special-needs off-W-2 Part III enablement (negative-line-1f computation)~~ | Backend | LOW-MEDIUM | **CLOSED 2026-05-23** — Issue #11 deferred remainder fully resolved per `XLS/Computations/1f.md` Gap #4. `allowPartIII` now opens when at least one child has `hasSpecialNeeds && adoptionFinal2025OrEarlier`; Part III loop runs even when `hasBenefits=false`; line 1f propagates negative `line31` to `Form1040.income.adoptionBenefits`. 1 existing test renamed + 3 new unit tests + 1 E2E test. |
| ~~Foreign-child finality-year retroactive exclusion (per-child `deferredPriorYearForeignBenefits` input)~~ | Backend + UI | LOW | **CLOSED 2026-05-24** — Gap #6 per `XLS/Computations/1f.md`. New per-child input `deferredPriorYearForeignBenefitsByChild["child{N}DeferredPriorYearForeignBenefits"]` augments L24 via `min(L21, L22 + deferred)` for the `foreignChild && adoptionFinal && !specialNeeds` branch. Produces the negative-L31 outcome the IRS Form 8839 Part III contemplates for foreign-finality returns. `allowPartIII` gate opened to allow Part III with zero W-2 box T when deferred > 0. Off-W-2 blocking gate exception added so L20 > 0 alongside deferred is allowed. New output field `Form8839Child.part3DeferredPriorYearForeignBenefits` for audit trail. Old `ADOPTION_BENEFITS_FOREIGN_CHILD_FINALITY_RETRO_PARTIAL` advisory removed. 5 new unit tests + 1 E2E. |
| ~~"PYAB" write-in PDF overlay~~ | UI | LOW (cosmetic) | **CLOSED 2026-05-24** — Gap #7 per `XLS/Computations/1f.md`. New generic `F1040Overlay` interface + `extraTextOverlays()` computed signal on `form-tax-return-1040.component.ts`. Emits a PYAB badge positioned on the dotted line to the left of the line 1f amount field (rect `[470, 270, 500, 281.999]`) when `adoptionBenefits < 0` — covers both Gap #4 (special-needs off-W-2) and Gap #6 (foreign-finality deferred) negative-line-1f scenarios. Template adds one `*ngFor` parallel to the existing field overlay loop. 2 existing E2E tests extended with PYAB visibility assertions. No backend change. |
| ~~G1 autoMagi missing add-backs (student loan + bond exclusion + foreign-housing deduction)~~ | Backend | LOW | **CLOSED 2026-05-24** — Gap #8 per `XLS/Computations/1f.md`. `applyAdoptionCredit` signature gained `Schedule1` + `ScheduleB` params; G1 autoMagi formula extended with student-loan interest (Sch 1 line 21), Series EE/I bond interest exclusion (Sch B line 3), and foreign-housing deduction (Sch 1 line 24j). All add-backs guarded by `safeAmount(...)` so returns without those line items are unaffected. 4 new unit tests. Manual MAGI cross-check enhancement deferred to `outstanding.md` "Form 8839 manual MAGI cross-check vs autoMagi worksheet". |
| ~~Form 8839 line 23 source: `w2TotalBenefits` vs `sum(L22[i])`~~ | Backend | LOW (cosmetic) | **CLOSED 2026-05-24** — Gap #5 per `XLS/Computations/1f.md`. One-line fix at `TaxReturnComputeService.java:13799` changes `part3Line23 = safeAmount(w2TotalBenefits)` → `safeAmount(totalPart3Line22)` so line 23 reflects the IRS form definition (literal sum of per-child line 22). Within the ±$1 allocation-mismatch tolerance the values can differ by up to $1, and the literal sum is the correct one. 1 new unit test (`part3Line23ReflectsLiteralAllocationSumNotW2BoxTWhenWithinTolerance`); 783/783 backend tests pass. |

**Closed items (from this audit):**
- #1 — Foreign-child finality-year retroactive exclusion (closed 2026-05-08; non-blocking advisory `ADOPTION_BENEFITS_FOREIGN_CHILD_FINALITY_RETRO_PARTIAL`; full implementation deferred to outstanding.md)
- #2 — SSN filter on W-2 box 12 code T sum (closed 2026-05-08; new `sumW2AdoptionBenefitsForSsns` helper + `isMfsReturn` parameter)
- #3 — MFS-disallowed flag severity (closed 2026-05-08; flipped to non-blocking; doc/code reconciled)
- #4 — This knowledge file (closed 2026-05-08)
- #5 — MAGI phaseout boundary tests (closed 2026-05-08; 3 boundary tests at start, 50%, ceiling)
- #6 — Shared-adoption $17,280 split (deferred 2026-05-08; full implementation sketch in `outstanding.md` "Form 8839 Shared-Adoption L19 Split with Non-Spouse")
- #7 — IRC §1372 over-2% S-corp owner exclusion disallowance (deferred 2026-05-08; full implementation sketch in `outstanding.md` "Form 8839 §1372 Over-2% S Corporation Owner Exclusion Disallowance")
- ~~#8 — IRC §137(d) same-expense coordination~~ — **CLOSED 2026-05-23**: Option B fully implemented per `XLS/Computations/1f.md` Gap #3. Per-child Part II input split into `child{N}QualifiedExpensesGross` + `child{N}EmployerReimbursementToSubtract`; backend computes `part2Line5 = max(0, gross − reimbursement)`. The same dollar can no longer reach both Part II and Part III — structurally enforced by the input shape. Old `ADOPTION_BENEFITS_VERIFY_NO_DOUBLE_DIP_CHILD_N` advisory + 3 unit tests deleted. New tests: `qualifiedExpensesNetOfEmployerReimbursementForCreditBase`, `qualifiedExpensesReimbursementExceedsGrossFloorsAtZero`, plus 1 E2E test.
- #9 — MAGI source (closed 2026-05-08 as **VERIFIED-AND-DOCUMENTED**; the `applyAdoptionCredit` G1 fallback handles auto-derivation correctly — original audit severity was wrong; 3 G1 tests added + this knowledge file §5 expanded)
- #10 — Allocation mismatch UX sharp edge (closed 2026-05-08; backend smart default auto-distributes when all-empty allocation + ±$1 rounding tolerance for explicit allocation; 5 tests)
- #11 — Over-blocking `ADOPTION_BENEFITS_W2_REQUIRED` (closed 2026-05-08 partial; function-level gate replaced by per-child `ADOPTION_BENEFITS_OFF_W2_NOT_SPECIAL_NEEDS_CHILD_N`; full §4.2 enablement deferred to outstanding.md)
- #12 — MAGI = null silently applies full exclusion (closed 2026-05-08 — moot once #9 is verified; G1 prevents the silent-exclusion case)

---

## 10. Key Constants

All in `ReferenceData.java`:

| Constant | Value | IRC reference |
|---|---|---|
| `ADOPTION_MAX_EXCLUSION_PER_CHILD` | $17,280 | IRC §137(b)(1) (CPI-indexed) |
| `ADOPTION_PHASEOUT_START` | $259,190 | IRC §137(b)(2)(A) (CPI-indexed) |
| `ADOPTION_PHASEOUT_RANGE` | $40,000 | IRC §137(b)(2)(B) (NOT indexed; statutory) |
| `ADOPTION_LINE11B_REFUNDABLE_CAP` | $5,000 | OBBBA 2025 (new for 2025; refundable Part II credit cap) |
| Phaseout end (computed) | $299,190 | start + range; full phase-out at this MAGI |
| Phaseout precision | 4 decimal places, HALF_UP | `computeAdoptionPhaseoutFraction` (IRS form instructions specify "at least 3 decimal places") |
| Maximum inline children | 6 | Form 8839 layout (3 main page + 3 overflow page) |

Statutory references (rules, not configurable constants):
- IRC §137 — employer-provided adoption assistance exclusion (foundational)
- IRC §137(a)(3) — special-needs rule
- IRC §137(b)(2) — MAGI phaseout
- IRC §137(d)(1) — exclusion vs credit coordination (same-expense rule)
- IRC §137(f)(1) — MFS joint-return requirement
- IRC §23 — adoption credit (Part II)
- IRC §23(d) — eligible child definition (under 18 OR incapable of self-care)
- IRC §23(d)(3) — special-needs definition
- IRC §1372 — over-2% S corporation owner fringe-benefit treatment (NOT IMPLEMENTED — see Issue #7)

---

## Verification log

- **2026-05-24** — 1f.md Gap #8 closure (G1 autoMagi missing add-backs from 2025 Form 8839 MAGI Worksheet): `applyAdoptionCredit` signature gained two parameters (`Schedule1 schedule1`, `ScheduleB scheduleB`); call site at `TaxReturnComputeService.java:1564` passes the already-built `schedule1` (populated at line 635) and `scheduleB` (line 669) objects. G1 autoMagi formula extended with three add-backs from the 2025 Form 8839 MAGI Worksheet: student-loan interest deduction (`schedule1.adjustments.studentLoanInterestDeduction`, Schedule 1 line 21), Series EE/I U.S. savings bond interest exclusion (`scheduleB.line3ExcludableInterestSeriesEeI`, Schedule B line 3), and foreign-housing deduction self-employed (`schedule1.adjustments.otherAdjustmentHousingDeduction`, Schedule 1 line 24j). All add-backs use `safeAmount(...)` so missing values contribute 0 — returns without those Schedule 1 / B line items behave identically to pre-Gap-#8. Direction-of-fix: add-backs can only INCREASE autoMagi, which can only REDUCE the credit/exclusion, so pre-fix error direction was always over-claiming. 4 new unit tests (`g1IncludesStudentLoanInterestAddBackInAutoDerivedMagi`, `g1IncludesSeriesEeBondInterestExclusionAddBackInAutoDerivedMagi`, `g1IncludesForeignHousingDeductionAddBackInAutoDerivedMagi`, `g1CombinesAllMagiAddBacksCorrectly` — combined autoMagi $279,690 → fraction 0.5125). Manual-MAGI path unchanged (user trusted to compute correctly); future cross-check enhancement tracked in `outstanding.md` "Form 8839 manual MAGI cross-check vs autoMagi worksheet". 790/790 backend tests pass.
- **2026-05-24** — 1f.md Gap #7 closure (PYAB write-in on Form 1040 line 1f): Frontend-only. New generic `F1040Overlay` interface and `extraTextOverlays()` computed signal on `form-tax-return-1040.component.ts` — emits an array of `{ page, rect, text, ariaLabel }` overlays. Today only PYAB is wired (emitted when `form1040.income.adoptionBenefits < 0`, covering both Gap #4 special-needs off-W-2 and Gap #6 foreign-finality deferred); future IRS write-ins (DCB, PSO, ROLLOVER, F-prefix on line 1h) are one-line additions to the same array. Template adds one `*ngFor` parallel to the existing field overlay loop. PYAB badge rect `[470, 270, 500, 281.999]` (PDF coords; dotted-line area immediately left of line 1f amount field rect `[504, 270, 576, 281.999]`). SCSS rule `.form-field.text-overlay` shares the same Arial / `1.34cqw` font as the regular text fields, right-aligned to hug the dotted line. Two existing E2E tests extended with `expect(...text-overlay[data-overlay="PYAB"]...).toBeVisible()` after navigating to `tax-return-1040` via sidebar. No backend change; no new tests. Frontend build clean.
- **2026-05-24** — 1f.md Gap #6 closure (foreign-child finality-year retroactive exclusion): New per-child input `deferredPriorYearForeignBenefitsByChild["child{N}DeferredPriorYearForeignBenefits"]` represents employer-provided adoption benefits paid in YEARS PRIOR to 2025 (taxed as wages then) being retroactively excluded in the finality year for a FOREIGN adoption finalised in 2025. Augments L24 via `min(L21, L22 + deferred)` for the `foreignChild && adoptionFinal && !specialNeeds` branch; L22 itself unchanged (preserves Gap #5 IRS-form-23 definition + allocation-mismatch check). `allowPartIII` gate opened to permit Part III with zero W-2 box T when deferred > 0. `hasAdoptionInputs` + `hasPartIIIInputs` extended. Off-W-2 blocking gate (Issue #11) given narrow exception so L20 > 0 alongside deferred is allowed. New `Form8839Child.part3DeferredPriorYearForeignBenefits` read-only output field. Frontend: per-child input on `form-adoption-expenses` under existing "Less common situations" toggle, visible only when `isForeignChild && adoptionFinal2025OrEarlier && !hasSpecialNeeds`. Old `ADOPTION_BENEFITS_FOREIGN_CHILD_FINALITY_RETRO_PARTIAL` advisory removed. 2 old advisory tests deleted; 5 new unit tests (headline negative −$5,000, L21 clamp at $5,280, MAGI 50% phaseout halves to −$2,500, domestic adoption ignores field, special-needs branch ignores field); 1 E2E test. 786/786 backend tests pass.
- **2026-05-24** — 1f.md Gap #5 closure (Form 8839 line 23 source change): One-line backend fix in `computeAdoptionBenefits` — `part3Line23 = safeAmount(totalPart3Line22)` (was `safeAmount(w2TotalBenefits)`). Effect: when the user's per-child allocation is within ±$1 of the W-2 box T total (the allocation-mismatch tolerance), line 23 / line 31 / line 1f now follow the literal allocation rather than the W-2 total. Behaviour unchanged when allocation matches exactly. No interaction with §1372 partition (Gap #1), shared-adoption split (Gap #2), gross/reimbursement input split (Gap #3), or special-needs off-W-2 (Gap #4) — traced through each. 1 new unit test (`part3Line23ReflectsLiteralAllocationSumNotW2BoxTWhenWithinTolerance`, single child, W-2 box T = $5,000, allocation = $5,001, MAGI = $279,190 → 50% phaseout; expected line 1f = $2,501 vs $2,500 before fix, exactly +$1). 783/783 backend tests pass (was 782).
- **2026-05-08** — 1f.xlsx Code Validation walkthrough through Issue #11 (all 12 issues closed):
  - **Issue #10** (Allocation mismatch UX sharp edge): Backend smart default — when all per-child `currentYearBenefitsAllocation` entries are empty/zero AND `hasBenefits=true`, auto-distribute `w2TotalBenefits` evenly across children with the last child absorbing the rounding remainder so the sum is exact. Plus ±$1 rounding tolerance on explicit allocation (handles user-entered $5,001 vs $5,000). Strict-match retained for partial allocation (user explicitly took control) and for diffs > $1 (genuine errors). 5 new tests: `autoDistributesAllocationWhenSingleChildAndNoAllocation`, `autoDistributesAllocationEvenlyAcrossThreeChildrenWithRoundingRemainder`, `allocationToleranceAcceptsOneDollarRoundingVariance`, `allocationMismatchStillFiresOnLargeDifference`, `allocationMismatchStillFiresOnPartialAllocation`. Net +5 tests.
  - **Issue #11** (Over-blocking `ADOPTION_BENEFITS_W2_REQUIRED` for special-needs off-W-2 path) — **Option C (partial)**: Removed the function-level W2_REQUIRED gate. Replaced with per-child blocking flag `ADOPTION_BENEFITS_OFF_W2_NOT_SPECIAL_NEEDS_CHILD_N` that fires only when a non-special-needs child has off-W-2 amounts (positive `priorYearEmployerBenefits` OR `currentYearBenefitsAllocation`) without a W-2 box 12 code T. Special-needs final children pass the gate (legitimate per IRC §137(a)(3) / §4.2). Updated existing test `flagsAdoptionBenefitsMissingW2ForPartIIIInputs` to assert the new per-child flag. 3 new tests: `specialNeedsOffW2BenefitsDoNotBlockButPartIIINotEnabled`, `mixedSpecialAndRegularChildrenBlocksOnlyTheRegularChild`, `priorYearOffW2BenefitsAlsoBlockNonSpecialNeedsChild`. Net +3 tests. **DEFERRED:** full §4.2 enablement (allowPartIII relaxation + L23 source change → spec's negative-line-1f for pure off-W-2 special-needs case). See `outstanding.md` "Form 8839 Special-Needs Off-W-2 Part III Enablement" for the ~30-45 min full-implementation sketch.
- **2026-05-08 (mid-day)** — 1f.xlsx Code Validation walkthrough through Issue #9 (Issues #1–#9 closed; #10, #11 closed in evening pass above):
  - **Issue #5** (MAGI phaseout boundary tests): Added 3 boundary tests — `line1fAtPhaseoutStartNoExclusionReduction` (MAGI = $259,190 → fraction=0); `line1fAtFiftyPercentPhaseoutHalfTaxable` (MAGI = $279,190 → fraction=0.5000); `line1fAtPhaseoutCeilingFullyTaxable` (MAGI = $299,190 → fraction=1.0000). Locks all three branches of `computeAdoptionPhaseoutFraction`. New helper `buildPart3PhaseoutFixture(magi)`. Net +3 tests.
  - **Issue #6** (Shared-adoption L19 split with non-spouse): Deferred. Full implementation sketch (~45-60 min) in `outstanding.md` "Form 8839 Shared-Adoption L19 Split with Non-Spouse"; `dependencies/1f.md` cross-reference enriched. No code change.
  - **Issue #7** (IRC §1372 over-2% S corp owner): Deferred. Full implementation sketch (~30-45 min) in `outstanding.md` "Form 8839 §1372 Over-2% S Corporation Owner Exclusion Disallowance"; `dependencies/1f.md` cross-reference enriched. No code change.
  - **Issue #8** (IRC §137(d) same-expense coordination): Per-child non-blocking advisory `ADOPTION_BENEFITS_VERIFY_NO_DOUBLE_DIP_CHILD_N` added to `computeAdoptionBenefits` per-child loop when both `part2Line5 > 0 && part3Line22 > 0`. Auto-subtraction (Option B) deferred to when nonrefundable credit lands — sketch in `outstanding.md` "Form 8839 §137(d) Same-Expense Coordination — Auto-Subtraction". Tests: `emitsDoubleDipAdvisoryWhenBothCreditAndBenefitsForSameChild`, `noDoubleDipAdvisoryWhenOnlyEmployerBenefits`, `noDoubleDipAdvisoryWhenOnlyQualifiedExpenses`. Net +3 tests.
  - **Issue #9** (MAGI source) — **AUDIT REVISITED**: Original 1f.xlsx claim ("no compute path populates MAGI") was wrong. Tracing revealed the `applyAdoptionCredit` G1 fallback auto-derives MAGI from AGI + Form 2555 lines 45/50 + Puerto Rico + Form 4563 line 15 when Phase 1 didn't have a manual entry, then re-runs Part II + Part III and propagates corrected line 1f back to Form 1040. Issue closed as VERIFIED-AND-DOCUMENTED. Added 3 G1 lock-in tests: `g1AutoDerivesMagiAndAppliesPhaseoutWhenMagiAbsent`, `g1DoesNotFireWhenMagiManuallyProvided`, `g1IncludesPuertoRicoAddBackInAutoDerivedMagi`. Knowledge file §5 expanded from "Single-Pass Architecture" to "Two-Path MAGI Architecture" with full Phase 1 + Phase 2 G1 description. Knowledge file §4 added `applyAdoptionCredit` to function-name table. `dependencies/1f.md` imports row enriched with G1 cross-reference. Issue #12 (MAGI null silent over-claim) closed as MOOT (G1 prevents the silent-exclusion case). Net +3 tests.
- **2026-05-08 (earlier)** — 1f.xlsx Code Validation walkthrough through Issue #4 (Issues #1–#4 closed; #5–#12 open):
  - **Issue #1** (Foreign-child finality-year retroactive exclusion not implemented — was framed as test gap but actually a missing branch): Added non-blocking `ADOPTION_BENEFITS_FOREIGN_CHILD_FINALITY_RETRO_PARTIAL` advisory inside per-child Part III block when `foreignChild && adoptionFinal && priorYearEmployerBenefitsByChild[N] > 0 && !specialNeeds`. Suppressed for special-needs cases (already handled by L24=L21 override). Full implementation (per-child `deferredPriorYearForeignBenefits` input + L22 enrichment + allocation-flag relaxation) deferred to `outstanding.md` "Form 8839 Foreign-Child Finality-Year Retroactive Exclusion". Tests: `emitsForeignChildFinalityRetroAdvisoryWhenPriorYearBenefitsPresent`, `noForeignChildFinalityRetroAdvisoryWhenSpecialNeeds`. Net +2 tests.
  - **Issue #2** (SSN filter on W-2 box 12 code T sum): New helper `sumW2AdoptionBenefitsForSsns(w2Entries, ssns...)`. `computeAdoptionBenefits` signature gained `you`, `spouse`, `isMfsReturn` parameters. SSN-filtered sum: taxpayer-only on MFS, taxpayer + spouse on MFJ. Falls back to legacy unfiltered sum when neither SSN populated. Single call site in `prepare()` updated. Mirrors the line 1e Issue #2 fix shape exactly. Test: `mfsExcludesSpouseW2BoxTFromLine1f`. Net +1 test.
  - **Issue #3** (DOC vs CODE — `ADOPTION_BENEFITS_MFS_EXCLUSION_DISALLOWED` blocking severity): Flipped to non-blocking (matches `dependencies/1f.md`). The MFS-no-exception return — full W-2 box T as taxable wages on line 1f — is a valid IRS return; blocking it would prevent the user from filing correctly. Mirrors line 1e Issue #1 pattern (silently skip §21 credit, not block). Updated 2 existing tests (`adoptionBenefitsMfsWithoutExceptionIsFullyTaxable`, `adoptionCreditMfsWithoutExceptionEmitsBlockingFlag` → renamed to `...EmitsAdvisoryAndSuppressesForm`). Net 0 tests (assertion flips).
  - **Issue #4** (Knowledge file missing): Created this file mirroring `knowledge/line-1e-dependent-care-benefits.md` structure (11 sections + verification log + function-name convention).
- Backend test count: 708/708 passing as of 2026-05-08 (started at 688 from end of 1e closeout; +20 net for 1f Issues #1–#11 = +2(#1) +1(#2) +0(#3) +0(#4) +3(#5) +0(#6) +0(#7) +3(#8) +3(#9) +5(#10) +3(#11)).
