# Form 4797 Recapture Engine — Implementation Plan

_Authored 2026-07-27. Status: **Phases 1–4 DONE & e2e-verified (2026-07-27/28)**; Phase 5 deferred._

## Current state (verified)
- The Form 4797 intake is a **full transcription** of the already-filled IRS form (statement `se_form_4797`,
  fields = the form's own lines: `partiLine7CombineLines2Through6GainOrLoss`, `partiLine8NonrecapturedNet
  Section1231LossesFromPriorYears`, `partiiiLine26b…§1250`, `partivLine35A…§179Recapture`, etc.).
- The compute consumes the transcribed **totals**: Part I line 9 → Schedule D LT (line 11); Part III line 26b
  → the 25%-rate §1250 worksheet (line 19). It **computes no recapture**.
- The advisory `OTHER_INCOME_FORM_4797_REQUIRED_TO_BE_FILED_SEPARATELY` tells users to complete the form
  externally (incl. §1245/§1250 recapture). The depreciation-asset form has **no disposition fields**.

## What Form 4797 computes (the target)
| Part | Content | Destination |
|---|---|---|
| I   | §1231 gains/losses (business property >1yr) → net (line 7); **line 8 = 5-yr lookback** recharacterizes gain as ordinary; line 9 → capital | Sch D LT (line 9) + Sch 1 L4 (line 8) |
| II  | Ordinary gains/losses incl. §1245/§1250 recapture from Part III | Schedule 1 line 4 |
| III | §1245 / §1250 **recapture computation** per property → ordinary (Part II); excess → §1231 (Part I) | feeds I & II |
| IV  | §179/§280F **business-use-drop recapture** | ordinary (Sch 1 L4 / activity) |

## IRS rules to encode
- **§1245** (personal property): ordinary = min(total depreciation incl. §179/bonus, gain); excess (sold
  above original cost) → §1231.
- **§1250** (real property): ordinary = excess of accelerated over straight-line (≈$0 for post-1986 MACRS SL);
  the SL depreciation up to gain → **unrecaptured §1250 gain @ max 25%** via Schedule D.
- **§1231 netting**: net gain → LT capital; net loss → ordinary (Sch 1 L4).
- **§1231(c) 5-yr lookback**: net §1231 gain is ordinary to the extent of **non-recaptured net §1231 losses**
  from the prior 5 years. IRS line-8 worksheet: `min(line 7, Σ losses[Y-5..Y-1] − Σ recaptured[Y-5..Y-1])`.
- **§179/§280F recapture**: business use ≤50% before recovery period ends → (accelerated/§179 − SL/ADS
  allowed) → ordinary.

## Phases (each independently shippable + IRS-pinned e2e)

**Phase 1 — §1231(c) 5-year lookback** _(self-contained; carryforward-bridge family; smallest — ✅ DONE 2026-07-27)_
- Builds on the existing transcribed intake (line 7 and line 8 already exist).
- ✅ Persist per year: net §1231 **loss** magnitude + amount **recaptured** (this year's line 8) + the 4
  display fields. `Section1231Recapture` model (nested in Form1040), `OutSection1231Recapture` entity,
  `V185` (+185.3 display cols), `Section1231RecaptureOutputMapper`, sqlSave + getLatestComputation wiring.
- ✅ Compute line 8 = `min(line 7 gain, max(0, Σ losses[Y-5..Y-1] − Σ recaptured[Y-5..Y-1]))` —
  `nonrecapturedPriorYear1231Losses` replays the prior 5 primary tax_return_v2 rows; `section1231RoutingDelta`
  = computed line 8 − transcribed line 8 → route to Sch 1 L4 ordinary (add to otherGainsLossesLine4) and
  reduce entry line 9 (→ Sch D LT). User's own transcribed line 8 makes delta 0 (no double-count).
- ✅ Required activating `Form4797Mapper.formIds()` → `Set.of("4797")` so 4797 dispositions are enterable
  via the statement REST API (backend-only; 4797 stays out of the FE picker until its config uses semantic keys).
- ✅ e2e `section1231-lookback-bridge.spec.ts` (GREEN): loss-year → gain-year recharacterized; routing to
  Sch 1 L4; year isolation. TODO if revisited: loss >5 yrs ago excluded; partial recapture; multi-year chain.

**Phase 2 — Raw disposition intake + §1245 recapture** _(recapture-engine foundation — ✅ DONE 2026-07-28)_
- ★ DEVIATION from the original plan (and the leaner path): NO new `asset-disposition` form was built. The
  reconnaissance found the existing `se_form_4797` statement ALREADY carries the raw Part III per-property
  inputs (line 20 gross sales price, line 21 cost + expense of sale, line 22 depreciation, per property
  A–D). The plan's "new form" assumed these fields didn't exist — they do. So the engine computes directly
  from that existing intake: no new entity/mapper/migration/PERSONAL_FORMS/UI.
- ✅ `computeForm4797Part3Recapture` (per entry, per property A–D): line 23 = 21−22, line 24 = 20−23; held
  ≤1yr → all Part II ordinary; held >1yr gain → line 25b §1245 recapture = min(gain, deprec) ordinary +
  excess → §1231; held >1yr loss → §1231 loss. OVERWRITES the entry's computed display slots (23/24/25a/25b)
  and Part I line 7/9 with the computed §1231 (so the §1231(c) lookback + Schedule D pick it up), superseding
  any transcribed line 7 for that entry. Gated on Part III raw present AND no §1250 line-26 fields — entries
  without Part III raw data are untouched (regression-safe). §1245 ordinary recapture → Schedule 1 line 4
  (per owner). `Form4797Recapture` output (nested in Form1040) + `OutForm4797Recapture` + `V186` +
  `Form4797RecaptureOutputMapper` persist the computed breakdown for the preview.
- ✅ e2e `form4797-section1245-recapture.spec.ts` (3 GREEN): gain<cost → all ordinary; gain>cost → deprec
  ordinary + excess §1231 → Schedule D; loss → §1231 loss recorded.
- SCOPE BOUNDARY (→ Phase 5): multi-entry §1231 netting across entries, §1231-loss routing to Schedule 1
  line 4 (the net §1231 loss flows through line 7 to the lookback record, matching the transcribed path's
  existing scope), and transcribed-vs-computed precedence when both styles coexist on one return.

**Phase 3 — §1250 recapture + unrecaptured §1250 @ 25%** _(✅ DONE 2026-07-28)_
- ★ DEVIATION (leaner, no new field): the plan said "add straightLineDepreciation," but the existing 4797
  statement already has line 26a "additional depreciation after 1975" (= accelerated over straight-line, a
  real Form 4797 field). So line 26a's PRESENCE discriminates §1250 (real property) from §1245, and IS the
  additional-depreciation input (0 for the dominant post-1986 MACRS straight-line case). No new intake field.
- ✅ Per §1250 property held >1yr with a gain: §1250 ordinary recapture (line 26g) = min(gain, line 26a) →
  Part II ordinary → Schedule 1 line 4; unrecaptured §1250 = min(gain, line 22 depreciation) − line 26g →
  Schedule D line 19 (max 25%); residual gain → §1231 (line 7 → lookback → Schedule D LT). The unrecaptured
  §1250 is written to the entry's line 26b (this codebase's existing Schedule D line-19 reader channel).
- ★ Fixed TWO pre-existing gaps that blocked any 4797 §1231 gain from reaching Schedule D: (1) `scheduleDRequired`
  now also fires on a 4797 net §1231 gain (line 9 > 0), and (2) `computeCapitalForPerson` no longer
  early-returns empty for a person with a 4797 §1231 gain but no capital form / capital-gains flag.
- ✅ Form4797Recapture gains section1250Recapture + unrecapturedSection1250 (V187). e2e
  `form4797-section1250-recapture.spec.ts` (2): MACRS SL → ordinary 0 + unrecaptured §1250 @ 25% (Sch D
  line 19); accelerated → ordinary recapture + unrecaptured §1250 + §1231.

**Phase 4 — §179/§280F business-use-drop recapture (Part IV)** _(✅ DONE 2026-07-28)_
- ★ DEVIATION (leaner, no new field): the plan said "add businessUsePercentAtDisposal + prior-year §179/
  depreciation," but the existing 4797 statement already has the Part IV lines — line 33a/33b (prior §179 /
  §280F accelerated deduction) and line 34a/34b (recomputed straight-line/ADS). So the engine computes line
  35 directly; no new intake field, no prior-year bridge.
- ✅ Per entry with Part IV inputs (line 33 present): line 35a = max(0, line 33a − line 34a) §179 recapture;
  line 35b = max(0, line 33b − line 34b) §280F recapture. Pure ordinary income (no §1231, no Schedule D) →
  Schedule 1 line 4 (per owner). The entry gate now also admits Part IV-only entries; the Part I line 7/9
  overwrite is guarded to Part III entries so a Part IV-only entry never clobbers a transcribed §1231.
- ✅ Form4797Recapture gains section179Recapture + section280fRecapture (V188). e2e
  `form4797-part4-recapture.spec.ts` (3): §179 recapture; §280F vehicle; recomputed ≥ prior → floored at 0.
- SCOPE BOUNDARY (→ Phase 5): IRS routes line 35 back to the ORIGINATING Schedule C/E/F activity (SE tax +
  QBI); absent an activity link on the 4797 entry it is routed to Schedule 1 line 4 ordinary (taxed, but not
  as SE income / QBI). Correct activity attribution is a Phase 5 refinement.

**Phase 5 — Integration + precedence** _(IN PROGRESS — QBI/SE attribution ✅ DONE 2026-07-28; rest deferred)_
- ✅ **QBI (§199A) / SE-tax (§1402) attribution** — the recapture is attributed to the person's single
  Schedule C business by treatment: Part IV §179/§280F business-use-drop recapture → the originating
  Schedule C net income (Schedule 1 line 3 + **SE tax** + QBI), MOVED off line 4; Part II/III §1245/§1250
  sale recapture → stays on line 4 (AGI) + the **QBI base only** (not SE — §1402(a)(3)). Attribution via a
  single-Schedule-C heuristic (`hasSingleScheduleCBusiness`, non-QJV); 0 or >1 businesses → conservative
  fallback to line 4 (pre-Phase-5 behavior). `computeScheduleC` gained two per-side recapture seeds
  (SE→netProfit, QBI-only→the ScheduleCQbiComponent). e2e `form4797-recapture-qbi-se.spec.ts` (3): §179 →
  line 3 56k + SE 7913; §1245 → line 4 20k + QBI 66,467 + SE unchanged 7065; no-business → line-4 fallback.
- ✅ **§1231 netting correctness** (2026-07-28) — per-owner consolidation (`consolidateSection1231`): each
  person's computed Part III §1231 entries net into a carrier entry so the §1231(c) lookback + Schedule D see
  the true NET (not the sum of only the gain entries); a net §1231 LOSS (§1231(a)(2)) is ordinary → routed to
  Schedule 1 line 4 + the §199A QBI base (via qbiRecapture, not SE), where it was previously DROPPED. e2e:
  updated §1245 scenario C (loss → line 4 −5000 + recorded for lookback) + new multi-entry netting test
  (20k gain + 5k loss → 15k net → Schedule D).
- ✅ **§1250-lookback interaction** (2026-07-28) — `capUnrecapturedSection1250`: when the §1231(c) lookback
  recharacterizes part of a net §1231 gain as ordinary, the unrecaptured §1250 (line 26b → Schedule D line 19,
  25%) is CAPPED at the residual capital gain (line 9 after the recharacterization delta), since the 25%
  slice can't exceed the remaining capital gain. Two-year e2e `form4797-section1250-lookback-cap.spec.ts`:
  prior §1231 loss 40k + current §1250 gain 50k → recharacterize 40k, capital 10k, line 19 capped 30k→10k.
- ✅ **Multi-business advisory** (2026-07-28) — when a recapture can't be attributed because the owner has
  >1 Schedule C (or a QJV), a non-blocking `FORM_4797_RECAPTURE_MULTI_BUSINESS` advisory surfaces that the
  recapture fell back to Schedule 1 line 4 (not in that business's QBI, and any §179/§280F not in the SE
  base). e2e in `form4797-recapture-qbi-se.spec.ts`.
- ✅ **Computed-vs-transcribed precedence** (2026-07-28) — verified the rule (a Part III raw entry supersedes
  a transcribed line 7 on the same entry) and added a non-blocking `FORM_4797_MIXED_COMPUTED_TRANSCRIBED`
  advisory when a computed disposition and a separately-transcribed §1231 amount coexist (they net at the
  §1231(c) lookback but not per-entry for Schedule D). e2e `form4797-precedence.spec.ts` (2).
- STILL DEFERRED (Phase 5 remainder, thin edges): Form 6252 (installment) / 8824 (like-kind) interplay —
  §453(i) recapture-in-full / §1031 recapture limitation (separate inputs; a guidance advisory at most); AMT
  disposition adjustment (recapture itself has no separate AMT adjustment; the AMT-vs-regular depreciation
  basis difference on disposition would need AMT-depreciation tracking the 4797 statement doesn't carry).

## Cross-cutting
- **Multi-year**: Phase 1 (lookback) + Phase 4 (prior deprec) need prior-year data — the bridge pattern
  (loadByTaxReturnId + prior-year-primary resolve + primary-path guard) applies.
- **Regression guardrail**: the transcribed-4797 → Schedule D wiring must keep working through every phase.
- **Effort**: Phase 1 ≈ one focused slice; Phases 2–4 each a compute-slice (Phase 2 largest). Order 1→2→3→4→5.
