# Scope — rental-tagged depreciation assets are collected but never computed

**Status: BUILT 2026-09-02 (Phases 1 and 2).** Raised the same day from sc_00272 (AMT passive-loss
recompute), while answering "how does H&R Block implement the pre-1999 AMT depreciation adjustment?".
Phase 3 (Form 4562 for Schedule E; UBIA for the rental QBI safe harbor) remains open — see §8.

> Everything below §7 is the original scoping analysis, kept as the record of what was decided and why.
> §8 records what was actually built and how the open decisions were resolved.

---

## 1. The finding

`form-depreciation-asset.component.ts` offers three activity types:

```ts
{ value: 'schedule_c', label: 'Schedule C business' },
{ value: 'schedule_f', label: 'Schedule F farm' },
{ value: 'rental',     label: 'Rental property (Schedule E)' },
```

The compute reads only two of them:

```java
if (!"schedule_f".equals(getString(a, "activityType"))) continue;   // TaxReturnComputeService:21810
if (!"schedule_c".equals(getString(a, "activityType"))) continue;   // TaxReturnComputeService:22097
```

**Nothing consumes `"rental"`.** The only other reader of `depreciationAssets(...)` is
`checkMidQuarterConvention` (line 21159), a validation helper that iterates all assets but explicitly
skips 27.5/39-year real property — so rental assets influence a convention warning and nothing else.

An asset a filer tags as a rental property is validated, saved, persisted… and produces **no
depreciation deduction at all**. No flag warns them. There is no note in `outstanding.md` or `rules.md`,
so this does not appear to be a recorded deferral.

### Reachability

Not obscure. `Depreciable assets (Form 4562)` sits unconditionally in the Incomes sidebar
(`shell.component.ts:855`) — a rental-only filer with no Schedule C sees it, opens it, finds "Rental
property (Schedule E)" in the dropdown, and fills it in. The form asks for date placed in service, cost
basis, business-use %, recovery period, method and convention, all of which are saved.

### Direction and size

**Taxpayer harm — a missing deduction.** The filer only gets rental depreciation if they *also* type a
figure into the rental property's own `depreciationAmount` box on the rental form. Someone who entered
their building as an asset (the more thorough thing to do) and left the box blank silently loses the
whole deduction — on a $275,000 building, $10,000 a year.

This is the classic shape from `[[feedback_verify_entry_not_outcome]]`: the return is complete,
plausible, and wrong only on the line that was tested.

---

## 2. Why the fix is smaller than it looks

**The arithmetic already exists.** `computeMacrsDepreciation` handles 27.5- and 39-year real property
with straight-line mid-month, including the partial first year and the extra partial year at the end
(lines 22353-22366). Nothing new has to be written to depreciate a building.

**The combination rule already has a precedent.** Schedule C:

```java
BigDecimal line13 = matched.isEmpty() ? scNz(getAmount(b, "depreciation")) : bonusPlusMacrs;
```

Assets win; the typed figure is the fallback used only when no asset matches. Schedule F does the same
at line 21873. Applying the identical rule to Schedule E line 18 answers the double-count question
without inventing anything: `line18 = matched.isEmpty() ? typed depreciationAmount : computedFromAssets`.

**No schema change.** The data is already stored. This is wiring, not migration.

---

## 3. Blast radius

Rental depreciation is upstream of a long chain. Everything below moves when line 18 changes:

| Consumer | Effect |
|---|---|
| Schedule E line 18 → property net income | direct |
| §280A personal-use tier-3 limit + `depreciationCarryforward` | depreciation is the last tier limited |
| §465 at-risk (Form 6198) | a larger loss may hit the at-risk cap |
| §469 passive loss, $25,000 special allowance, carryforward | the loss the allowance absorbs changes |
| **AMT §469 recompute → Form 6251 line 2m** | the original sc_00272 question |
| Form 8960 line 4 (NIIT on passive rental) | net rental income feeds NIIT |
| §199A QBI on the rental safe harbor | QBI is net of depreciation |
| Form 4797 / §1250 recapture on a later sale | depends on accumulated depreciation |

Two things are absent today and would become reachable rather than newly broken:

- **Schedule E produces no Form 4562.** Business and farm assets do; rentals never had assets to report.
- **Rentals have no UBIA at all** — no field on the rental form, and `assetUbia` is called only from the
  Schedule C and F paths. UBIA only bites above the QBI threshold ($197,300 / $394,600), so this is
  conditional, but a rental's building is exactly the kind of large UBIA that matters there.

---

## 4. Decisions needed before building

1. **Matching rule.** Schedule C matches an asset's `activityDescription` against the business name or
   profession, with a first-match rule so a shared description isn't claimed twice, and falls back to
   "the first for-profit business" when the description is blank. Rentals would match
   `propertyDescription`. **Open:** what should a blank description do when the filer has several
   properties — attach to the first, or refuse and flag? Attaching silently to the wrong property
   misstates per-property income while leaving the total right, which is hard to notice.

2. **§179 and bonus must be blocked for lodging real property.** `assetDepreciationSection179AndBonus`
   applies §179 and 100% bonus to any asset. Residential rental *real property* is eligible for
   neither — §179(d)(1) excludes it and bonus needs a recovery period of 20 years or less. Wiring
   rentals without a guard would let a filer expense a building, which is a very large wrong deduction
   in the **over**-statement direction. Appliances and carpet inside a rental (5-year property) *are*
   eligible for both, so the guard must key on the asset's recovery period, not on the activity type.

3. **Whether to emit a Form 4562 for Schedule E.** Correct once rentals carry assets, but new output
   surface (mapper, entity, preview) rather than a compute change.

4. **Whether to wire UBIA for the rental QBI safe harbor** in the same pass or leave it.

5. **Existing users.** Anyone who typed `depreciationAmount` *and* created rental assets will see their
   figure change on the next compute — assets would now win. Worth a one-off advisory rather than a
   silent switch.

---

## 5. Risks

- **Over-deduction if decision 2 is missed.** This is the one that matters: it reverses the direction of
  the error from a missing deduction to an inflated one.
- **Per-property misallocation if decision 1 is loose** — total correct, per-property wrong, invisible on
  the 1040 and visible only on Schedule E.
- Touching the §469 / at-risk / NIIT chain, which is well covered by existing tests but widely used.
- *Not* a risk: `computeMacrsDepreciation` itself is unchanged in this phase.

---

## 6. Phasing

**Phase 1 — wire the rental leg (the fix proper).**
Match rental assets to properties, compute line 18 from them with the Schedule C fallback rule, guard
§179/bonus by recovery period. Unit tests for: a building-only asset producing the right MACRS figure;
the typed-value fallback when no asset matches; §179/bonus refused on 27.5-year property but allowed on
a 5-year appliance; and the full chain (line 18 → §469 → carryforward) moving coherently. One e2e.

**Phase 2 — the AMT adjustment (the original sc_00272 ask).**
With the placed-in-service date now reaching the rental path, add the pre-1999 branch to
`computeAmtMacrsDepreciation` (40-year straight line for real property placed in service before
1999-01-01) and feed the difference into the existing `amtDelta`. This is the piece that also fixes
line 2l for **business** real property, and it needs no UI at all. Test both directions: the positive
adjustment while regular depreciation still runs, and the **negative** one after the 27.5-year recovery
ends while the 40-year AMT track continues — the live 2025 case.

**Phase 3 — optional.** Form 4562 for Schedule E; UBIA for the rental QBI safe harbor.

Phase 1 is the larger piece and Phase 2 depends on it. Phase 2 alone is not worth doing first: without
Phase 1 there is still no way to state a rental building's placed-in-service date.

---

## 7. How H&R Block does it (for comparison)

One shared Depreciation Worksheet per asset serves Schedule C, Schedule F, the Rentals and Royalty
Worksheet and Form 4835 alike — there is no separate "type your rental depreciation" path, which is
precisely what makes the purchase date available everywhere. Its section 11 computes the AMT figures
rather than asking for them ("Fill in numbers a, b, c, and/or d below, **if they aren't already
calculated by the program**"), branches on the 1998 date and prints the rule on the form, classifies the
asset into an AMT category (pre-87 leased → 6251 line 3b, pre-87 real estate → 3a, 1987-and-later →
2l), and routes the adjustment by passive status — passive to the AMT Passive Activity Worksheet and on
to line 2m, non-passive straight to 2l or 3.

Captured in `C:/us-tax-hrb/_pdf/sc00272_S272E_for_records.txt` lines 1788-1830.

The phasing above converges on that architecture rather than adding a second parallel way to enter
rental depreciation.

---

## 8. What was built (2026-09-02)

### Phase 1 — the rental leg

`TaxReturnComputeService`:

- `rentalAssetsForProperty(...)` — matches rental-tagged assets to a property by `activityDescription`
  vs `propertyDescription`, first-match-wins, blank description falling to the first property on that
  side. **Decision 1 resolved:** a blank description attaches to the first property *and* raises
  `RENTAL_DEPRECIATION_ASSET_UNNAMED` when the filer has more than one, because that is precisely the
  case where the total stays right and the Schedule E split goes silently wrong.
- `rentalAssetDepreciation(...)` — one asset's `[regular, AMT]` pair.
- Schedule E line 18 now follows the Schedule C rule verbatim:
  `matched.isEmpty() ? typedDepreciationAmount : computedFromAssets`. **Assets win; they do not add.**
  Anyone who had done both is told which figure won, via
  `RENTAL_DEPRECIATION_ASSETS_OVERRIDE_ENTERED_AMOUNT` — **decision 5 resolved**, since the change would
  otherwise be silent for someone who had been relying on the typed number.
- The asset AMT figure feeds the existing per-activity `amtDelta`, so it flows through the AMT §469
  recompute to Form 6251 line 2m unchanged.

**Decision 2 resolved, and it is the guard that mattered.** Two refusals, both advisory-backed:

- `RENTAL_ASSET_SECTION179_NOT_APPLIED` — §179(d)(1) requires the ACTIVE CONDUCT of a trade or business;
  property held to produce rental income does not qualify. Refused for every rental asset.
- `RENTAL_REAL_PROPERTY_BONUS_NOT_APPLIED` — §168(k) qualified property needs a recovery period of 20
  years or less, so a 27.5-year building never qualifies. **Keyed on the asset's recovery period, not on
  the activity**, so the appliances inside the same rental keep their 100% bonus.

Without these a filer could have expensed a building — flipping a missing deduction into a phantom one
an order of magnitude larger. `bonusDepreciationIsRefusedOnTheBuilding` and
`bonusIsStillAllowedOnFiveYearPropertyInsideTheRental` pin both sides.

### Phase 2 — the pre-1999 AMT schedule

`preTra97RealPropertyAmtDepreciation(...)`, called first from `computeAmtMacrsDepreciation`: real
property (27.5 / 31.5 / 39) placed in service **before 1999-01-01** is refigured over **40 years,
straight line, mid-month**, mirroring the regular real-property branch exactly. Everything else falls
through to the existing post-1998 handling untouched.

Scope boundary, deliberate: **only real property needs the branch.** Pre-1999 personal property was
refigured over its ADS class life, and the longest of those (25 years) expired in 2023 for a 1998 asset
— every pre-1999 personal-property schedule is exhausted on both tracks by 2025, so the adjustment is
zero either way. This also fixes Form 6251 **line 2l** for pre-1999 business real property, which shared
the same hole and needed no UI at all.

### Coverage

`RentalDepreciationAssetsTest`, 9 tests. The regression closed (an asset-only rental went from 14,000 of
net income to the correct 4,000); the typed fallback intact; assets replacing rather than adding; both
§179/bonus refusals plus the appliance that keeps its bonus; the 3,125 pre-1999 adjustment; **no**
adjustment on a post-1998 building (the control that proves the date branch is real rather than a
blanket 40-year rule); and the live 2025 case — a 1990-placed building whose regular recovery ended in
2017 producing a **negative** 6,875 adjustment that reduces AMTI.

Unit suite 1,978, same 8 pre-existing failures. **No UI change and no migration were needed** — the
intake form already collected date, basis, method, convention and recovery period, and already offered
"Rental property (Schedule E)".

### Still open (Phase 3)

- **Form 4562 for Schedule E.** Now that rentals carry assets, a rental asset placed in service during
  the year should be reported on one. Compute is right; the output form is absent. New mapper/entity/
  preview surface across two repos.
- **UBIA for the rental §199A safe harbor.** Rentals still have no UBIA; `assetUbia` is called only from
  the Schedule C and F paths. Only bites above the QBI threshold ($197,300 / $394,600), where a rental
  building is exactly the large UBIA that matters. **Decisions 3 and 4 deferred, not resolved.**
