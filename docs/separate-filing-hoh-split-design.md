# Design — Separate-Filing Optimizer: HOH/HOH and HOH/MFS splits

**Status:** DESIGN (no code yet). Authored 2026-06-20.
**Trigger:** A married couple living apart, where each spouse is independently
"considered unmarried" and can file **Head of Household** with a *different*
qualifying child. The current multi-return optimizer models the only separate
alternative as **MFS + MFS** and therefore recommends a strictly-worse status
(or under-states achievable savings) for the living-apart-with-children cohort.

This document is the full design the queue was paused to produce (MFS-spouse
migration Form #3 = Filing status).

> **STATUS UPDATE 2026-06-20 — model revised; see §0.** Phase A (kept-up-home
> inputs + eligibility service) is built and green. The driving model changed
> from *optimizer-derived* to **user-declared per-tab election** (§0). Sections
> §1–§10 below remain valid for IRS grounding, eligibility logic, itemize-
> coupling, and the scoper/compute mechanics; where they describe the optimizer
> as the *driver*, read §0 instead — the optimizer is now **advisory only** and
> the `multi_return.feature.*` flags no longer exist (removed 2026-06-16, MFS is
> unconditional).

---

## 0. REVISED MODEL (2026-06-20) — user-declared per-tab filing election

The separate-filing split is **declared by the user, not derived by the
optimizer.** Selecting a non-MFJ status already materializes the separate
returns today (`TaxReturnV2LifecycleService.enableMfs` on an MFS election; the
optimizer creates nothing). We generalize that election to cover HoH and to be
**per-tab**.

**Filing Status becomes a paired per-person form** (Family Head + Spouse):

| Family Head picks | Spouse tab Filing Status | Returns generated |
|---|---|---|
| **MFJ** | disabled, mirrors "MFJ" read-only | **one** joint return |
| **MFS** | enabled — options **{MFS, HoH}** only | two separate returns (each leg's elected status) |
| **HoH** (married, considered unmarried) | enabled — options **{MFS, HoH}** only | two separate returns |
| Single / QSS | no spouse tab | one return |

- **Both legs may independently be HoH** (head HoH + spouse HoH is first-class,
  not an edge case). Distinct qualifying persons are guaranteed structurally:
  `dependent.claimedByMfs` is single-valued, so each child anchors exactly one
  leg; kept-up-home is per side.
- When **not** filing jointly the spouse's only options are **{MFS, HoH}** —
  never MFJ/Single/QSS (they are married and not filing jointly).
- **Married-HoH detection:** when the Family Head picks HoH, an explicit
  question ("Are you married but lived apart from your spouse?") establishes
  considered-unmarried-married-HoH (enables the spouse tab/return) vs plain
  unmarried HoH (single return). Chosen over inferring from spouse-identity
  presence, which is fragile (a considered-unmarried HoH filer often lists no
  spouse).
- **Optimizer = always advisory.** It never creates or mutates a filed return;
  the user's election is the sole driver of what is generated.

**HoH inputs are consolidated** onto each tab's Filing Status form, shown only
when that tab = HoH: lived-apart (already present, symmetric → captured once),
kept-up-own-home (Phase A `head/spouse_kept_up_own_home`, per tab), qualifying-
person-if-not-a-dependent (already present). The **dependent → which spouse**
attribution stays on the Dependents form (`claimedByMfs` selector already
exists, MFS-only today) — broaden to show under HoH and **require it under
HoH**; relabel away from "(MFS)".

**Two-tier HoH validation:**
1. *Early advisory* (frontend, best-effort, non-blocking): inline hint when the
   considered-unmarried tests look unmet while the user fills the form.
2. *Hard block at Tax Return generation* (compute): the repurposed
   `ConsideredUnmarriedEligibilityService` emits a blocking `TaxReturnFlag`
   preventing an ineligible HoH return — **overrideable** (can be promoted to a
   non-overrideable §17 blocker later). Save always succeeds in between, per
   `[[feedback_save_vs_compute_validation]]`.

**Revised phasing** (Phase A done; B–F user-declared):
- **A — DONE/repurposed:** kept-up-home inputs (V79) + `ConsideredUnmarried
  EligibilityService` (now an election *validator*, not an optimizer input).
- **B — Frontend:** paired `filing-status-spouse` form (+ id/mapper/allow-list);
  MFJ-locks-spouse gating; `{MFS, HoH}` subset; per-tab HoH inputs; Family-Head
  married-HoH question; Tier-1 advisory.
- **C — Backend generation/scoper:** `enableMfs → enableSeparateFiling`
  (per-leg elected status); `overrideFilingStatusToMfs →
  overrideFilingStatusToSeparate(side, electedStatus, …)`; fold in the original
  Form #3 MFS spouse-name flip.
- **D — Dependents:** surface `claimedByMfs` under HoH, required under HoH,
  relabel; verify EIC/education/dependent-care re-enable under HoH on the scoped
  leg.
- **E — Validation:** Tier-2 blocking flag (HoH ineligibility + distinct-
  qualifying-person) at compute.
- **F — Tests & docs:** Java unit + e2e (MFJ one return; MFS+MFS; **HoH+HoH**;
  HoH+MFS) with exact pinned values; history/rules/outstanding/memory.

---

## 1. IRS grounding (the eligibility model to encode)

Sources: IRC §2(b), §7703(b); Pub 17 ch. 2 "Considered Unmarried" / "Head of
Household" / "Qualifying Person"; Pub 501; i1040gi_2025.

A **married** person is *considered unmarried* (eligible to file HOH) only if
**all** hold on the last day of the year:

1. **Files a separate return** (anything other than MFJ).
2. **Paid > half the cost of keeping up their home** for the year
   (Pub 17 Worksheet 2-1 "Cost of Keeping Up a Home").
3. **Spouse did not live in that home during the last 6 months** of the year
   (temporary absences — school, illness, business, military, juvenile
   detention — excepted; the absentee must be expected to return).
4. The home was, **for > half the year, the main home of a qualifying person** —
   a qualifying child / stepchild / foster child whom the taxpayer **can claim
   as a dependent** (or could but for the §152(e) release to the noncustodial
   parent). A **dependent parent** qualifies without living with the taxpayer.

For **both** spouses to file HOH, the IRS rule forces structural separation:

- **Two separate households.** They cannot both pay > half the cost of the
  *same* home, and a qualifying person must live with *each* — so necessarily
  two homes. (Ties directly to Form #2 Address: `address-spouse.
  sameAsTaxpayerAddress = false` + the spouse's own address is the signal.)
- **Distinct qualifying persons.** Pub 17: *"You must have **another**
  qualifying person and meet the other tests."* The same child cannot anchor
  both HOH returns.
- **Lived apart** — test (3) is symmetric (already captured as
  `mfsOrHohLivedApartOrLegallySeparated`).

### Status space per side is bounded

A married person who is **not** considered-unmarried must file MFJ or MFS — never
Single. So under a *separate* split, **each side ∈ {HOH, MFS}**. That bounds the
whole-household scenario set:

| Scenario | Feasibility gate |
|---|---|
| **S0 — MFJ** | always (the primary) |
| **S1 — MFS + MFS** | always (current behavior) |
| **S2 — HOH + HOH** | both sides considered-unmarried-eligible |
| **S3 — HOH(head) + MFS(spouse)** | head eligible, spouse not |
| **S4 — MFS(head) + HOH(spouse)** | spouse eligible, head not |

The optimizer enumerates the **feasible** scenarios, computes each, and
recommends the minimum total tax. (Do **not** assume HOH always beats MFS per
side — compute both and let the numbers decide; see §6 itemize-coupling risk.)

---

## 2. What already exists (reuse, don't rebuild)

| Capability | Mechanism | Location |
|---|---|---|
| Per-side dependent attribution | `dependent.claimedByMfs ∈ {taxpayer, spouse, null}` + `scopedDependentSide` filter | `Dependent.java:39-42`, `TaxReturnComputeService.loadScopedDependents:287-320` (V75) |
| Per-side residency / qualifying-child facts | `monthsLivedWithTaxpayer` (0-12), `relationship`, `childLivedWithOtherParent`, `qualifiesForCtc/Odc` | `Dependent.java:47-77` |
| Separate-home signal | `address-spouse.sameAsTaxpayerAddress=false` + own address | Form #2 (V78), `AddressMapper`, `MfsFormScoper.resolveSpouseAddress` |
| Lived-apart-6-months fact | `mfsOrHohLivedApartOrLegallySeparated` (symmetric) | `pf_filing_status`, `FilingStatusMapper` |
| Per-return materialization + compute | `tax_return_v2` rows; `computeService.prepare(returnId)`; ThreadLocal scoping | `TaxReturnV2LifecycleService`, `MfsFormScoper` |
| HOH tax math | HOH brackets + `$23,625` std deduction keyed on `filingStatus` | `TaxReturnComputeService:3414-3457`; `ReferenceData.LINE16_BRACKET_HOH_*` |
| HOH output (1040 box + qualifying person) | `FilingStatus` output model already carries `hohQualifyingPersonName` | `model/output/FilingStatus.java` |

**Consequence:** the qualifying person is **derivable** from the side's
attributed dependents — no new per-spouse qualifying-person field is needed. The
existing free-text `hohQualifyingPersonName` stays only for the rare
"qualifying person not claimed as a dependent" case.

**Semantic clarification required (no schema change):** `monthsLivedWithTaxpayer`
and `childLivedWithTaxpayer` must be interpreted as *"with the **claiming**
parent"* (the side named by `claimedByMfs`), not literally the head. Document
this in the field Javadoc; it is already the only coherent reading once a
dependent is attributed to the spouse side.

---

## 3. The only genuinely new input

The **"kept up own home (> half the cost)"** test (Pub 17 Worksheet 2-1) has no
representation today. Under a separate split there are two homes, so we need it
**per side**:

- `head_kept_up_own_home` (boolean attestation) — head paid > half cost of head's home.
- `spouse_kept_up_own_home` (boolean attestation) — spouse paid > half cost of spouse's home.

**MVP:** boolean attestations, consistent with the existing `mfsOrHohLivedApart`
attestation style. **Stretch:** a Worksheet 2-1 mini-form computing the
boolean from itemized home costs (defer).

**Storage decision:** add the two booleans to `pf_filing_status` (the household
return-level form already owns the filing election and the lived-apart fact).
This avoids inventing a per-side personal form for a return-level concept and
keeps all "considered unmarried" facts colocated. New Liquibase migration adds
two nullable BOOLEAN columns; no `owner_role` (filing-status stays a singleton).

---

## 4. Eligibility service (new)

`ConsideredUnmarriedEligibilityService` — pure, side-parameterized, no I/O:

```
eligible(side) =
      isMarried(household)                       // spouse person exists
   && livedApartLast6Months                      // mfsOrHohLivedApart == true
   && keptUpOwnHome(side)                         // head_/spouse_kept_up_own_home
   && hasQualifyingPersonFor(side)                // derived (below)

hasQualifyingPersonFor(side) =
      ∃ dependent d:
           attributedTo(d, side)                  // claimedByMfs rule, §2 above
        && isQualifyingChildOrRelative(d.relationship)
        && d.monthsLivedWithTaxpayer > 6          // "with the claiming parent"
        && claimableAsDependentBy(side, d)        // or §152(e)-releasable
   OR  hohQualifyingPersonName present for that side (free-text fallback)

distinctQualifyingPersons(head, spouse) =           // S2 guard
      head and spouse anchor on different dependents
```

The service returns, per side, `{eligible, status: HOH|MFS, qualifyingPersonName}`.
`qualifyingPersonName` is derived from the chosen dependent (or the free-text
fallback). It also exposes `bothEligibleWithDistinctPersons` for the S2 gate.

---

## 5. Scoper generalization

Today `MfsFormScoper.overrideFilingStatusToMfs(...)` hard-codes
`"Married filing separately"` for both split sides. Generalize to a status-aware
override:

```
overrideFilingStatusToSeparate(out, side, targetStatus, otherSpouseSsn, filerSsn, qualifyingPersonName)
  switch targetStatus:
    MFS  -> filingStatus = "Married filing separately"   (existing path unchanged:
            inject mfsOtherSpouseSsn, scopedFilerSsn, scopedDependentSide;
            flip mfsSpouseName/SSN per Form #3 fix)
    HOH  -> filingStatus = "Head of household"
            set hohQualifyingPersonName = qualifyingPersonName (derived)
            inject scopedFilerSsn + scopedDependentSide (for dependent scoping)
            do NOT set mfsSpouse* (not an MFS return)
```

`targetStatus` per side comes from the eligibility service for the scenario being
materialized. **Return-kind handling — two options:**

- **Option A (recommended): keep `mfs_head`/`mfs_spouse` rows, parameterize the
  forced status.** The `return_kind` becomes a *which-side* marker, not a
  *which-status* marker. Rename intent in Javadoc to "separate-head /
  separate-spouse"; no DB enum churn, no new backfill. The scoper + a
  per-scenario status map decide HOH vs MFS.
- **Option B: add `hoh_head`/`hoh_spouse` return_kinds.** Cleaner names but
  multiplies kinds, needs migration + lifecycle changes, and the optimizer would
  materialize different row sets per scenario. Higher cost, no compute benefit.

Go with **A**. The optimizer drives status selection; rows stay stable.

**MFJ preserved:** the override only runs on separate-split scoping paths; the
`primary` return is never touched.

---

## 6. Optimizer generalization

`OptimizerService` today computes {MFJ, MFS-head, MFS-spouse} and compares
`mfjTax` vs `mfsHeadTax + mfsSpouseTax`. Generalize to **scenario enumeration**:

```
feasible = [S0_MFJ, S1_MFS_MFS]                       // always
if eligible(head): feasible += S3_HOH_MFS
if eligible(spouse): feasible += S4_MFS_HOH
if bothEligibleWithDistinctPersons: feasible += S2_HOH_HOH

for each S in feasible:
    materialize/compute each side under S's per-side status (via scoper)
    totalTax(S) = sum of side taxes
recommend = argmin totalTax(S)
```

`Recommendation` enum extends to `{MFJ, MFS_SPLIT, HOH_SPLIT, HOH_MFS_MIXED}` and
returns the per-side status breakdown so the UI comparison panel can label it.

**Caching:** reuse `computeService.prepare(returnId)` per (side, status); memoize
within a single optimize call to avoid recomputing the same side twice across
scenarios that share a leg (e.g. S1 and S4 share the MFS-head leg).

---

## 7. Compute, output, validation

- **Compute:** largely free — once the scoped map carries `filingStatus="Head of
  household"` and the side's dependents, std-deduction selection ($23,625),
  HOH brackets, and credit eligibility already key off `filingStatus`. Verify
  EIC / education / dependent-care credits (disallowed under MFS) correctly
  *re-enable* under HOH on the scoped return.
- **Output / PDF:** each HOH leg emits a 1040 with the HOH box checked and the
  derived qualifying-person name; the existing `FilingStatus` output model and
  per-return PDF path already support this.
- **Validation (advisory, non-blocking):** when a user manually elects HOH on
  the **primary** return while a spouse person exists, emit an **informational**
  `TaxReturnFlag` if considered-unmarried tests aren't satisfied (lived-apart
  false, no kept-up-home attestation, no qualifying person). Advisory — not a
  §17 blocker — because the facts may be entered out of order. Per
  `[[feedback_save_vs_compute_validation]]` this surfaces at compute, not save.

---

## 8. Open verification items (resolve during implementation — no guessing)

1. **§63(c)(6)(A) both-itemize coupling — RESOLVED 2026-06-20.** The IRS
   standard-deduction-zero rule keys on the **filer's own status being MFS**:
   i1040gi "Persons not eligible for the standard deduction" — zero *"if your
   filing status is **married filing separately**, and your spouse itemizes
   deductions"*; the 2024 Std Deduction Table CAUTION and MFS special-rule #11
   repeat it, all scoped to MFS. Therefore:
   - **HOH leg: never zeroed.** A considered-unmarried HOH filer is not "filing
     status married filing separately," so the coupling does not apply — full
     HOH standard deduction ($23,625) regardless of the estranged spouse's
     choice.
   - **MFS leg: coupled.** An MFS filer's standard deduction is zero iff its
     spouse (the other leg) itemizes. In **S1** the two MFS legs are mutually
     coupled (existing behavior). In **S3/S4** the lone MFS leg is coupled to the
     **HOH** leg's choice per the literal instruction ("if your spouse
     itemizes…") — i.e. if the HOH leg itemizes, the MFS leg cannot take the
     standard deduction.
   - **Documented assumption:** the plain IRS instruction does not extend
     §7703(b)'s "not married" fiction to exempt the MFS leg when the *other* leg
     is HOH, so we implement the coupling (conservative literal reading). It can
     only ever cost the taxpayer in the narrow HOH-itemizes case, and the
     optimizer's min-selection over scenarios bounds the downside. Revisit only
     if a cited authority (Pub 501 §7703(b) chain) says otherwise.
2. **Residency semantics.** Confirm `monthsLivedWithTaxpayer` is safe to read as
   "with the claiming parent" for spouse-attributed dependents, or whether a
   distinct per-side residency field is warranted (prefer reuse).
3. **§152(e) release.** Confirm the "could claim but for release to noncustodial
   parent" path is representable (a custodial parent who released the exemption
   can still be HOH). May need a dependent flag if not already inferable.
4. **Community property states (Pub 555).** Income attribution under separate
   filing in AZ/CA/ID/LA/NV/NM/TX/WA/WI — currently out of scope for the MFS
   split too; keep out of scope, flag explicitly.
5. **Feature-flag surface.** Reuse `multi_return.feature.*`; decide whether HOH
   scenarios need a sub-flag for staged rollout.

---

## 9. Phasing (each phase shippable behind the flag)

- **Phase A — Inputs & eligibility:** two `kept_up_own_home` booleans
  (migration + `FilingStatusMapper` + entity + UI), residency-semantics Javadoc,
  `ConsideredUnmarriedEligibilityService` + unit tests (truth table).
- **Phase B — Scoper:** `overrideFilingStatusToSeparate` (status-aware), Option A
  return-kind reuse; extend `Phase7bComputeScopingTest` (HOH map assertions,
  MFJ-unchanged, distinct-person guard).
- **Phase C — Optimizer:** scenario enumeration + memoized legs + extended
  recommendation enum + unit tests pinning exact per-scenario totals.
- **Phase D — Frontend:** kept-up-home attestations on filing-status; comparison
  panel labels (HOH/HOH, HOH/MFS); advisory eligibility flag display.
- **Phase E — Tests & docs:** e2e (living-apart, 2 kids split via `claimedByMfs`,
  separate addresses → recommends HOH/HOH, each return shows HOH + correct
  child); `history.md`, `rules.md`, `outstanding.md`, memory.

---

## 10. Impact, risk, reversibility

- **New artifacts:** 1 migration (2 columns), 1 service, optimizer + scoper
  edits, mapper/entity edits, UI fields, tests. **Register-in-N-places:** none of
  the four parent-table hazards (no new table); but the migration must be added to
  `db.changelog-master.xml` with `--liquibase formatted sql` header.
- **MFJ + existing MFS untouched:** all new behavior is gated and additive; S0/S1
  paths are byte-for-byte the current behavior. Reverting = drop the feature
  flag / scenario branches.
- **Biggest risk:** itemize-coupling correctness (§8.1) and credit re-enablement
  under HOH (§7). Both are *compute-correctness* items that demand exact
  hand-computed IRS pins per `[[feedback_e2e_exact_value_pins]]`, never `> 0`.
- **Honest scope note:** this is a multi-phase feature (~A–E), materially larger
  than one form migration. It reuses the multi-return scaffolding and the two
  existing enablers (dependent attribution + separate-home signal), so it is a
  clean follow-on rather than a rewrite.
