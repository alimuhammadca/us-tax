# Form 4797 Recapture Engine — Implementation Plan

_Authored 2026-07-27. Status: **Phase 1 DONE & e2e-verified (2026-07-27)**; Phases 2–5 deferred._

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

**Phase 2 — Raw disposition intake + §1245 recapture** _(recapture-engine foundation; largest)_
- New `asset-disposition-taxpayer/-spouse` intake (mapper + entity + migration + `PERSONAL_FORMS` +
  `PARENT_TABLES_UID_CASCADE` + UI + shell + PurePdfPreview).
- §1245: ordinary = min(depreciation, gain); excess → §1231 Part I. Build Form 4797 Part III/II/I output.
- Tests: gain < deprec → all ordinary; gain > deprec → deprec ordinary + excess §1231; loss → §1231.

**Phase 3 — §1250 recapture + unrecaptured §1250 @ 25%**
- Add straightLineDepreciation; compute §1250 ordinary (excess accel over SL) + unrecaptured §1250 → Sch D
  25% worksheet (now computed). Tests: MACRS real-property sale → §1250 ordinary $0 + unrecaptured §1250 @ 25%.

**Phase 4 — §179/§280F business-use-drop recapture (Part IV)**
- Add businessUsePercentAtDisposal + prior-year §179/depreciation (bridge or user-entered). Recapture =
  accelerated − SL/ADS allowed → ordinary. Tests: §179 drops to 40% → recapture; §280F vehicle drop.

**Phase 5 — Integration + precedence**
- Computed-vs-transcribed precedence (keep transcription as fallback or supersede); Sch D line 11/19 consumers
  stay correct; QBI interaction (§1231 excluded from QBI; ordinary recapture IS QBI); AMT; Form 6252 / 8824.

## Cross-cutting
- **Multi-year**: Phase 1 (lookback) + Phase 4 (prior deprec) need prior-year data — the bridge pattern
  (loadByTaxReturnId + prior-year-primary resolve + primary-path guard) applies.
- **Regression guardrail**: the transcribed-4797 → Schedule D wiring must keep working through every phase.
- **Effort**: Phase 1 ≈ one focused slice; Phases 2–4 each a compute-slice (Phase 2 largest). Order 1→2→3→4→5.
