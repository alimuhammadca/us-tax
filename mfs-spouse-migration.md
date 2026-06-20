# MFS Spouse-Forms Migration — Working Protocol & Queue

**Goal:** Make the **Spouse tab** able to produce a correct, standalone **MFS** return for the
spouse, WITHOUT breaking the existing **MFJ** joint-return behavior. We work **one form at a
time**, in **Taxpayer-tab sidebar order**. Dependents are deferred. Self-employment
(Schedule C/SE/F) stays out of scope.

Background (why we're doing this) lives in memory `project_spouse_forms_compute_sufficiency`
(2026-06-19 update) and `project_taxpayer_vs_spouse_tab_forms`. Short version: the `mfs_spouse`
backend compute is wired and active, but the spouse input forms are MFJ-only — 14 of them are
`[disabled]="!isJointReturn"` (locked under MFS), there's no spouse Address form, and several
per-person compute gaps exist.

---

## THE PROMPT (run this for the CURRENT form each time I'm asked)

> Work the **current** form in the queue (the one marked `← CURRENT`) in **two phases with a hard
> checkpoint between them**. Be honest and principled — **no guesswork**. Ground every tax
> decision in the IRS sources (`C:\us-tax\lines\<line>.md`, `C:\us-tax\docs\IRS-Forms\`,
> `C:\us-tax\docs\books\` incl. `i1040gi_2025`, Pub 17, J.K. Lasser, topic pubs). Do **not**
> design ahead for later forms. Preserve MFJ behavior.
>
> **PHASE 1 — ANALYZE & PRESENT (no code changes).** Do Steps 0–3, then present the written
> change plan (Step P) covering **frontend**, **program logic / backend**, **unit tests**, and
> **e2e tests**, with impact & reversibility. **Then STOP and wait** for my go-ahead. Do not edit
> any file in Phase 1.
>
> **PHASE 2 — APPLY & DOCUMENT (only after I approve).** Implement exactly what was agreed
> (Steps 4–7), run the tests, then **document the changes in `history.md` and `memory.md`**
> (Step 8), advance the pointer, and show the next form.

### PHASE 1 — Analyze & present

#### Step 0 — Identify & scope the form
- State: sidebar section, taxpayer form id + component, the corresponding spouse form id (if
  any), the IRS form/line(s) it drives, and its position in the queue.
- Decide whether it's **per-person** (each spouse has their own) or **return-level/household**
  (one per return). Cite the IRS source for that classification.

#### Step 1 — IRS grounding (mandatory, no guesswork)
- Read the authoritative sources for this line/form. Answer:
  - What inputs does the IRS require **per filer**?
  - **How does MFS differ from MFJ** here — eligibility, limits (½-limits), disallowed credits,
    required facts (e.g., MFS "lived apart from spouse all year"), itemize-coordination
    (§63(c)(6)(A)), SS base amounts, phaseouts? Quote the rule + source.
- If MFS **disallows** the item entirely (e.g., EIC, education credits, certain credits unless
  lived apart), say so — the spouse form may need a gate/blocker rather than full parity.

#### Step 2 — Current-state inventory (read before deciding)
- Read: taxpayer component, spouse component (if any), generic person-scoped component (if used),
  the YAML intake spec(s) in `C:\us-tax\yamls\`, the backend Mapper + entity + migration, the
  relevant compute code in `TaxReturnComputeService`, `MfsFormScoper`, and the output model.
- Record: does a spouse form exist? Is it `isJointReturn`-gated? Is it a field-subset of the
  taxpayer form? What does the backend read for the spouse, and how does it currently flow into
  the joint return?

#### Step 3 — Classify into a bucket
- **A. Per-person, paired & complete** → just invert/remove the MFS gate so it's editable under
  MFS; verify structural completeness.
- **B. Per-person, paired but spouse is a subset** → bring spouse to computational parity (add
  missing fields), then invert the gate.
- **C. Per-person, taxpayer-only (no spouse form)** → add a spouse version.
- **D. Return-level/household, taxpayer-only by design** → decide if the spouse's MFS return
  needs its own copy. If yes, add a spouse version with a **reuse mechanism** so MFJ users don't
  type twice. (e.g., Address.)
- **E. Mixed: a per-person question currently lives only on the taxpayer form** → **split** it —
  move the per-person part to a spouse version; keep the shared part on the taxpayer form.
- **F. Shared / deferred / out of scope** → Statements (TIN-attributed; handle via attribution,
  not pairing), dependents (deferred), self-employment (out of scope).

#### Step P — PRESENT THE CHANGE PLAN, then STOP
Present a written plan (no edits yet) with these labelled sections, then pause for approval:
- **(a) Frontend changes** — exact components/templates/SCSS/YAML to touch; the UI mechanism
  (e.g., gate inversion, "Same as Family Head" copy-on-select/clear-on-deselect checkbox, new
  fields, MFS-specific questions); whether spouse mirrors taxpayer or a tailored subset; how MFJ
  behavior is preserved.
- **(b) Program logic / backend changes** — mapper/entity/migration; `MfsFormScoper` scoping;
  `TaxReturnComputeService` compute flow into MFJ primary + `mfs_head` + `mfs_spouse`; any
  per-person compute-gap fix; output mapping (which `C:\us-tax\pdfs` semantic CSV / 1040 line).
  If none, say "no backend change."
- **(c) Unit-test changes** — which Java tests to add/modify and the exact IRS-hand-computed
  values they will pin.
- **(d) e2e-test changes** — which specs to add/modify; the MFJ-unchanged case and the MFS
  two-returns case; exact pinned values.
- **(e) Impact & reversibility** — files touched, tests expected to break (file:line), how to
  revert (TEMP-toggle convention for reversible gates), and any register-in-N-places hazards in
  play.
> **End Phase 1 here. Wait for explicit approval before any edit.**

### PHASE 2 — Apply & document (after approval)

#### Step 4 — Frontend implementation
- Implement exactly the agreed (a). **No double-entry rule:** under MFJ the user must not re-type
  data already entered on the Family Head tab. **Invert/remove the `isJointReturn` gate** so the
  form is editable under MFS while MFJ still behaves correctly (rule ≈ editable when MFJ **or**
  when this spouse owns an MFS return). Use the TEMP-toggle convention for reversible gates.

#### Step 5 — Backend changes
- Implement the agreed (b). New spouse form / fields → Mapper + entity + Liquibase migration.
  **Respect the register-in-N-places hazards:** `PersonalResource.PERSONAL_FORMS` allow-list;
  `UserDataBulkDelete.PARENT_TABLES_UID_CASCADE`; add the `V*.sql` to `db.changelog-master.xml`;
  `--liquibase formatted sql` header; no bullet-block comments; PG-compatible SQL.
- `MfsFormScoper`: scope the new/changed spouse form correctly for `mfs_spouse`; keep MFJ
  aggregating both. Fix touched per-person compute gaps (age-65/blindness via
  `deductionsStandardSpouse`, cross-return itemize match, strict `scopedFilerSsn` attribution).
- Verify the value flows into **all three** return kinds: MFJ primary, `mfs_head`, `mfs_spouse`.

#### Step 6 — Output mapping (tax-return PDFs)
- Map the computed result onto Form 1040 + schedules/owner-suffixed forms for **each** return,
  using the `C:\us-tax\pdfs` semantic field maps so field names match. Confirm owner attribution
  (8606/4972/8919/4137/4852/2555/4563 etc.) per return.

#### Step 7 — Tests
- Implement the agreed (c)/(d). **Java unit** + **paired e2e** where feasible (Java unit ≠ e2e
  parity); pin **exact** IRS-hand-computed values (never `> 0`). e2e covers MFJ unchanged **and**
  MFS → two correct returns. Reuse known patterns (expand collapsed sections; §17 raw-fetch 409;
  reload before reading the Form 1040 preview). Repair tests broken by the change — diagnose
  principally; don't lie green.

#### Step 8 — Document & advance
- **Document the changes in `C:\us-tax\history.md` AND `memory.md`** (and `rules.md` / active
  `context.md` when relevant). The `memory.md` entry: one-line index pointer + a topic file if the
  change is non-obvious/reusable.
- Tick the form off in the queue below, move `← CURRENT` to the next form, and **show me the next
  form** with a one-line note on its likely bucket.

### Global guardrails
- Honest, principled, IRS-grounded; no guesswork. Leave red rather than lie green.
- Never break MFJ while enabling MFS. Avoid double data entry.
- One form at a time. Don't pre-decide later forms.
- Dependents deferred; self-employment out of scope; Statements handled via TIN attribution.

---

## QUEUE (Taxpayer-tab sidebar order) — status: ☐ todo · ◐ in-progress · ☑ done

### Personal
1. ☑ **Identification** — `identification-taxpayer` ↔ `identification-spouse`. **DONE 2026-06-19** — frontend already complete (parity, ungated); backend fix in `MfsFormScoper.normalizeSpouseIdentity` so the mfs_spouse filer header gets the spouse's name/DOB/occupation/IP-PIN (spouse-prefixed → canonical). Unit (`Phase7bComputeScopingTest`) + e2e (`mfs-spouse-identity.spec.ts`) green. See history.md.
2. ☑ **Address** — `address-taxpayer` ↔ `address-spouse`. **DONE 2026-06-20** — new spouse Address form with "Same as Family Head" flag; `pf_address.owner_role` (V78); `AddressMapper`+`MfsFormScoper` resolve the spouse's MFS-return address (own or household). Unit + e2e (`mfs-spouse-address.spec.ts`) green. Email/Phone moved to end of both Address forms. See history.md.
3. ☑ **Filing status** — `filing-status` ↔ `filing-status-spouse` (NEW). **DONE 2026-06-20.** Expanded far beyond the first-guess Bucket E into the full **HOH-split feature** (user-declared per-tab election → MFJ one return; non-MFJ → spouse elects {MFS, HoH}; both legs may be HoH). Design: `C:\us-tax\docs\separate-filing-hoh-split-design.md`; memory `project_hoh_split_optimizer`. Phases A–F COMPLETE & GREEN: V79 kept-up-home + V80 spouse-election columns; paired form + MFJ-locks-spouse gating + married-HoH question; `MfsFormScoper.overrideFilingStatusToSeparate` (per-leg status + the original MFS spouse-name flip); dependent `claimedByMfs` under HoH (required); Tier-2 blocking-overrideable considered-unmarried validation. Verified: 47 multireturn + 869 compute unit tests + **5/5 IRS-pinned e2e** (`e2e/tests/hoh-split-filing.spec.ts`) green; V79+V80 clean Liquibase apply.
4. ☐ **Digital assets** — `digital-assets-taxpayer` ↔ `digital-assets-spouse` (exists). Bucket A. **← CURRENT**
5. ☐ **Presidential Election Campaign** — `presidential-election-campaign-taxpayer` ↔ `-spouse` (exists). Bucket A.
6. ☐ **Third party designee** — `third-party-designee-taxpayer` ↔ *(none)*. Bucket D/E.

### Statements  (shared, recipient-TIN attributed — handle via attribution, not pairing; revisit as a group)

### Incomes
7. ☐ **Employment** — `employment-taxpayer` ↔ `employment-spouse` (gated). Bucket A.
8. ☐ **Tips** — `tips-taxpayer` ↔ `tips-spouse` (gated). Bucket A.
9. ☐ **Medicaid waiver** — `medicaid-waiver-taxpayer` ↔ `medicaid-waiver-spouse` (gated). Bucket A/B.
10. ☐ **Uncollected SS/Medicare** — `uncollected-ss-medicare-taxpayer` ↔ `-spouse` (NOT gated). Bucket A.
11. ☐ **Combat pay** — `combat-pay-taxpayer` ↔ `-spouse` (NOT gated). Bucket A.
12. ☐ **Child & dependent care** — `childcare-expenses` ↔ *(none)*. Bucket D — Form 2441; MFS usually disallowed (verify lived-apart).
13. ☐ **Adoption expenses** — `adoption-expenses` ↔ *(none)*. Bucket D — Form 8839; MFS rules.
14. ☐ **Other earned income** — `other-earned-income` ↔ *(none)*. Bucket C — per-person (line 1h).
15. ☐ **Interest income** — `interest-income-taxpayer` ↔ `-spouse` (gated; subset, missing 8815). Bucket B.
16. ☐ **Dividend income** — `dividend-income-taxpayer` ↔ `-spouse` (gated). Bucket A/B.
17. ☐ **IRA income** — `ira-income-taxpayer` ↔ `-spouse` (gated; complete). Bucket A.
18. ☐ **Pension withdrawals** — `pension-annuity-income-taxpayer` ↔ `-spouse` (gated). Bucket A.
19. ☐ **Social Security benefits** — `social-security-benefits-taxpayer` ↔ `-spouse` (gated; MFS lived-with facts). Bucket B.
20. ☐ **Capital gain/loss** — `capital-gain-loss-taxpayer` ↔ `-spouse` (gated). Bucket A.
21. ☐ **Other incomes** — `other-incomes-taxpayer` ↔ `-spouse` (gated; alimony-date gap). Bucket B.
22. ☐ **Income adjustments** — `income-adjustments-taxpayer` ↔ `-spouse` (gated). Bucket A.
23. ☐ **Foreign income** — `foreign-earned-income-taxpayer` ↔ `-spouse` (generic person-scoped; Form 2555). Bucket A.
24. ☐ **US possession exclusion** — `possession-residence-exclusion-taxpayer` ↔ `-spouse` (generic; Form 4563). Bucket A.
25. ☐ **Lump-sum distributions** — `lump-sum-distribution-taxpayer` ↔ `-spouse` (generic; Form 4972). Bucket A.
26. ☐ **Other tax items** — `16-tax-taxpayer` ↔ *(none)*. Bucket C/D — inspect contents (line 16 box-3 items).

### Deductions
27. ☐ **Additional deductions** — `additional-deductions-taxpayer` ↔ `-spouse` (generic; Schedule 1-A). Bucket A.
28. ☐ **Education credits** — `education-credits-taxpayer` ↔ `-spouse` (generic; Form 8863 — **MFS disallowed**). Bucket → gate/blocker.
29. ☐ **Energy credit** — `energy-credit-taxpayer` ↔ `-spouse` (generic). Bucket A.
30. ☐ **Elderly/Disabled credit** — `elderly-disabled-credit-taxpayer` ↔ `-spouse` (generic; Schedule R — MFS lived-apart). Bucket B.
31. ☐ **Interest expense** — `investment-interest-expense-deduction` ↔ *(none)*. Bucket C/D — Form 4952.
32. ☐ **Prior min tax credit** — `prior-min-tax-credit-taxpayer` ↔ `-spouse` (generic; Form 8801). Bucket A.
33. ☐ **Clean car credit** — `clean-car-credit-taxpayer` ↔ `-spouse` (generic). Bucket A.
34. ☐ **Alt fuel credit** — `alt-fuel-credit-taxpayer` ↔ `-spouse` (generic). Bucket A.
35. ☐ **Bond credit** — `bond-credit-taxpayer` ↔ `-spouse` (generic; Form 8912). Bucket A.
36. ☐ **Electric Vehicle credit** — `electric-vehicle-credit-taxpayer` ↔ `-spouse` (generic). Bucket A.
37. ☐ **Mortgage interest credit** — `mortgage-interest-credit-taxpayer` ↔ `-spouse` (generic; Form 8396). Bucket A.
38. ☐ **Carryforward homebuyer credit** — `carryforward-homebuyer-credit-taxpayer` ↔ `-spouse` (generic). Bucket A.
39. ☐ **Premium tax credit** — `premium-tax-credit-taxpayer` ↔ `-spouse` (generic; Form 8962 — MFS special rules). Bucket B.
40. ☐ **Qualified business income** — `qbi-deduction-taxpayer` ↔ `-spouse` (generic; Form 8995; SE out of scope — REIT/PTP only). Bucket A.
41. ☐ **Standard deductions** — `standard-deductions-taxpayer` ↔ `-spouse` (generic; **age/blindness + itemize-match — key MFS backend gap**). Bucket B.
42. ☐ **Foreign tax credit** — `foreign-tax-credit-taxpayer` ↔ `-spouse` (separate components; Form 1116). Bucket A/B.
43. ☐ **Savings credit** — `savings-credit-taxpayer` ↔ `-spouse` (separate components; Form 8880). Bucket A.
44. ☐ **Earned income credit** — `earned-income-credit-taxpayer` ↔ `-spouse` (generic; **MFS disallowed unless separated/lived-apart**). Bucket → gate/blocker.

### Applications
45. ☐ **W-2 Substitute** — `form4852-taxpayer` ↔ `-spouse` (generic; Form 4852). Bucket A.
46. ☐ **Extension of time** — `extension-of-time-taxpayer` ↔ `-spouse` (generic; Form 4868). Bucket A.
47. ☐ **Estimated tax payments** — `estimated-tax-payments-taxpayer` ↔ `-spouse` (generic). Bucket A.
48. ☐ **Credits after disallowance** — `form8862` ↔ *(none)*. Bucket D — Form 8862 per-return.
49. ☐ **Other payments / credits** — `31-other-payments` ↔ *(none)*. Bucket D — per-return.
50. ☐ **Child Tax Credit settings** — `ctc-actc-screening-taxpayer` ↔ *(none)*. Defer (dependents).

> Bucket labels are **first-guess hints only** — Step 1/2 re-verify them per form against the IRS
> sources before any change.
