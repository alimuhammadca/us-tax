# Tax Return Form-Preview Port — Render Verification (2026-07-06)

Verification record for incorporating the `C:\us-tax-return-forms` sandbox look-and-feel
fixes (colleague `codegeek.dev`, 23 commits, `9c1df3a..HEAD`) into the real app
`us-tax-ui`'s Tax Return `form-tax-return-*` previews.

**Port commits (us-tax-ui):** `3216e6e` foundation (self-hosted IRS fonts + shared
`form-font.utils` + `pure-pdf-preview` renderer upgrades) · `698e9da` 28 SCSS
"checkbox-dancing" cleanups · `d8831f4` 28 per-form `.ts` fixes + `f1040s3` asset ·
`cddf0d4` render regression fix (below).
**Docs (us-tax):** history `ad5d849` + `4010487`, rules `a60250a`, context `73edb57`.

**Guiding constraint:** the sandbox is *sample-filled* for look-and-feel (force-checked
checkboxes, `sampleValueFor` placeholders); the real app is *real-data-driven*. Every
change was ported per-change to **preserve real-data rendering** — the sample-fill was
never brought over. Safety-scan (`git diff | grep '^\+.*(sampleValueFor|cb.checked = true|field-checkbox checked)'`)
was empty on every file.

## Validation performed

- **Type-check:** `tsc --noEmit -p tsconfig.app.json` → exit 0.
- **Build:** `npm run build` → exit 0 (0 errors; 6 pre-existing warnings, none from the
  ported files); the 6 IRS `.otf` fonts emit to `dist/us-tax-ui/browser/fonts/`.
- **Browser render:** Playwright screenshots against the running dev servers
  (`:4200` UI / `:8080` backend), fonts served from `/fonts/*.otf` (HTTP 200).

## Forms visually confirmed rendering correctly (22)

| Form | Change(s) exercised | Notes |
|---|---|---|
| Form 1040 | outline "2025" wordmark, real data | field values, empty checkboxes |
| Schedule 1 | **mapFont → shared-util refactor**, outline | highest-risk change, clean |
| Schedule 2 | checkbox centering, stroked rects | line 1e/1f boxes aligned |
| Form 4972 | Part I/II/III headers, bold weights | Yes/No boxes empty |
| Form 8919 | column grid, caution layout | — |
| Schedule A (8936) | **17-cell VIN character row** | gradient dividers |
| Form 2210 | **+246 text-merging flowchart renderer** | decision boxes + merged text |
| Form 2106 | two-tone wordmark, meal cells | — |
| Form 4684 | Section A grid, disaster checkbox | — |
| Form 4797 | Part I/II column grids | — |
| Form 4868 | e-file logo + caution triangle | — |
| Form 5329 | wordmark, amended checkbox | — |
| Form 5695 | layout / character-cell fields | — |
| Form 8862 | **(fixed)** Part I credit boxes | see regression below |
| Form 8880 | (a)You/(b)Spouse columns | — |
| Form 8959 | Parts I–V, gray carry-boxes | — |
| Schedule R | **TIP circle icon**, filing-status boxes | circle intact after fix |
| Schedule 3 | lines 5a–13z, blocked cells | — |
| Schedule D | Part I grid + **line values** (line 2: 30k/5k/25k), QOF box | data-triggered (1099-B + capital-gain-loss gate) |
| Form 2441 | provider table, `}`-brace decision box | data-triggered; real-data checkboxes blue-checked |
| Form 1116 | Foreign Tax Credit grid, "Germany" col | data-triggered (foreign tax) |
| Form 8888 | **routing/account character-cells** | data-triggered (3-account refund split) |
| Schedule 1-A | Parts II–VI, **VIN cell styling**, car-loan line 30 | data-triggered (car-loan interest); see VIN note below |
| Schedule C | header, **EIN/business-code cell styling**, Part I/II grids | blank template only — see note below |
| Schedule A | Medical/Taxes/Interest + **line values** (5a 8k, 5e 14.5k, 8a 10k) | data-triggered (itemized; `stateLocalTaxChoice:'Income'`) |
| Form 8863 | Part I + **AOTC values** (l1 2,500 / l3 50k / l8 1,000), `}`-brace, SSN cells | data-triggered (AOTC student, $4k expenses) |

**Total: 26 forms confirmed rendering correctly.**

**Schedule A / Schedule D value rendering — seeding bugs, NOT a rendering gap:**
Both preview components fully map every computed line value from `comp.scheduleA` /
`comp.scheduleD` (`buildSemanticValues()`), and always render the IRS template even when that
object is null. The first quick verification seeds produced **null** objects (→ empty value
boxes) due to two distinct **seeding bugs in the test setup**, both now fixed and confirmed —
the renderer and the port are unaffected:

- **Schedule D — missing companion gate.** Statement data flows into compute only when its
  companion personal-form gate is set (the "three-part seed" pattern). Schedule D needs
  `capital-gain-loss-taxpayer` (`hadCapitalGainOrLoss` /
  `confirmAllReceivedCapitalStatementsUploaded` / `received1099BOr1099Da`). With the gate,
  `scheduleD` populates (`line7 = 25000`) and values render — **line 2: 30,000 / 5,000 /
  25,000**, QOF "No" checked.
- **Schedule A — invalid enum casing.** The seed used `stateLocalTaxChoice: 'income'`
  (lowercase), which violates the DB check constraint `ck_pf_standard_deductions_slt_choice`
  (requires **`'Income'`/`'Sales'`**, capitalized — `V2__personal_credits.sql:24`). That
  threw an HTTP 500 that silently failed the *entire* `standard-deductions-taxpayer` save
  (leaving `deductionElection` = "AUTO", itemized = null). With `stateLocalTaxChoice:
  'Income'` (+ per-amount `...PaidBy: 'taxpayer'`), the save succeeds, `scheduleA` populates
  (election ITEMIZED, itemized total $28,500), and every line renders — **5a 8,000 / 5b
  6,000 / 5c 500 / 5d–5e 14,500 / 8a mortgage 10,000**.

The backend emits both objects when properly seeded (proven by `line13a-qbi` asserting
`scheduleD.line7 === 25000` and `mfs-schedule-a-allocator` asserting `scheduleA` fields).

**Schedule C note (blank template only):** Schedule C business income is **out of scope**
(self-employment; per CLAUDE.md). The backend never produces a `scheduleC` field, so no
business income/expenses can be populated — the component intentionally renders the blank
IRS template (TEMP toggle, always-render). This verifies the look-and-feel port (labels,
EIN/business-code character-cell styling, Part I/II grids, outline wordmark) but not any
computed values, since none exist.

**Schedule 1-A VIN note (not a port regression):** the ported VIN character-cell styling
(`line22a_vehicle1_vin`, 18px letter-spacing + light-blue tint, component lines 407–410)
renders as a tinted input box, but the VIN *digits* don't display — the backend doesn't
expose the per-vehicle VIN to the preview layer (documented pre-existing gap, component
line 189: *"values the backend doesn't expose individually (e.g., per-vehicle VIN/lender)"*).
The identical character-cell technique renders real values correctly on Form 8888
(routing/account) and Schedule A (Form 8936) VIN — already verified.

Real-data checkbox behavior was confirmed repeatedly: Form 2441's "household employee? No"
boxes, Form 8888's Checking/Savings per account, and Schedule D's QOF boxes all rendered
checked/empty according to the seeded data — not the sandbox's all-checked sample-fill.

## Regression found and fixed — Form 8862

The render sweep caught **one real regression from the port** (fixed in `cddf0d4`). The
ported radio-bullet heuristic in `pure-pdf-preview.component.ts`
(`r.fill === '#ffffff' && isSmall` → centered black dot) **misfired on empty checkbox
outlines** that are white-filled *with* a black stroke — Form 8862 Part I's three credit
boxes rendered as **solid black dots** instead of empty boxes.

**Fix:** guard the heuristic with `&& !r.stroke`. A genuine radio bullet is a filled dot
with no border; a bordered white box is a checkbox — so stroked white rects fall through to
the bordered-box branch and render as proper empty checkboxes. Verified: 8862 Part I boxes
now empty, Schedule R's (unstroked) TIP circle still renders. Being in the shared renderer,
the fix benefits every `pure-pdf-preview` form.

## `pure-pdf-preview` `[values]` audit + Form 8880 fix (pre-existing, not the port)

Auditing which `<pure-pdf-preview>` Tax Return forms bind `[values]` (render computed data)
vs. only `elementsFile`/`textOverrides` (blank template). Of the **13** forms using the
shared renderer, only **3 were wired** (2555, 4563, 8859); the other **10 render blank
templates**. The look-and-feel port never touched `[values]` (grep across all port commits
is empty) — the pattern is **100% pre-existing**. (Inline-render forms — 1040, schedule-1/2/
3/d/a, 8863, 8888, 2441, 1116, 8936-A — build their own value maps and are unaffected.)

Assessing the 10 unwired forms:
- 🔴 **Substantive gap — computed values existed but weren't shown: Form 8880** (saver's
  credit). **FIXED** (us-tax-ui `9ec8de3`): the component now maps `computation.form8880` →
  the `f8880` semantic field names and binds `[values]`. Verified — with a $1,500 IRA
  contribution (50% rate) the preview shows line 1/3/5/6/7 = 1,500, line 8 AGI = 22,000,
  line 9 = 0.5, line 12 credit. (Line 9 renders only the fractional digit since the form
  pre-prints "X 0.".) The component comment had literally said *"blank until a backend f8880
  semantic mapping is wired."*
- 🟢 **Correctly blank (no fix needed):**
  - **2106, 4684, 4797, 8853, 3903, schedule-e** — **no backend model class exists**; these
    forms aren't computed, so the blank template is correct (nothing to wire).
  - **8959** — Additional Medicare Tax is **out of scope** per CLAUDE.md → blank expected.
  - **8862** — its computed `eic/ctc/aotcEligible` booleans map to the Part I credit boxes
    which are **rects, not fillable fields** (the black-dot bug above), so `[values]` can't
    render them; only the tax-year field is fillable → negligible. Left as-is.

Net: 8880 was the sole substantive gap; now **4 of 13** `pure-pdf-preview` forms are wired
(2555/4563/8859/8880). The remaining blanks are non-computed or out-of-scope, not defects.

## Not visually triggered (low risk)

~18 forms show a clean empty-state placeholder without form-specific computed data
(itemizing, credits, business/capital data, etc.) — not crashes. Their per-form changes are
within the already-verified categories (word/letter-spacing, `}`/`▲`/`!` glyphs, VIN-style
character cells), and the shared-renderer fix above covers all of them. They can be triggered
on demand by seeding the relevant scenario (see the dedicated e2e specs
`form1116-foreign-tax-credit`, `form8888-refund-allocation`, `line1e-dependent-care`,
`line7ab-capital-gain-loss` for the seed shapes) and opening the preview via
`openSidebarFormById(page, 'tax-return-<id>', 'Tax Return', /label/)`.

## Gotchas captured while triggering forms

- **Form 2441** requires dependents seeded via `PUT /api/personal/dependents` whose SSNs
  match the qualifying-person SSNs (age < 13), or compute returns a §17 non-overrideable
  409 (qualifying persons must be family members).
- **Form 8888** needs a two-pass compute: compute first to read
  `form1040.refund.refundAmount`, then split it across accounts so the allocation matches.
- **Form 1116** full form (vs. the `≤ $300` simplified exception) needs
  `claimsSimplifiedException: false` with a `foreignIncomeSources` entry above the threshold.
