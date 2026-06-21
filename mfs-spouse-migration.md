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

## THE PROMPT — run for the CURRENT form each time I'm asked ("do the current form" / "start form #N")

> Work the ONE form marked `← CURRENT` in the queue below, end to end, in a single continuous
> pass. Be honest and principled — **NO guesswork**; ground every tax decision in the IRS sources
> (`C:\us-tax\lines\<line>.md`, `C:\us-tax\docs\IRS-Forms\`, `C:\us-tax\docs\books\` incl.
> `i1040gi_2025`, Pub 17, J.K. Lasser, topic pubs) and quote the rule + source. One form at a
> time — do **not** design ahead for later forms. **Taxpayer + Spouse only** (dependents deferred;
> self-employment Schedule C/SE/F out of scope; Statements handled via recipient-TIN attribution,
> not pairing). **Never break MFJ** while enabling MFS, and **never make the user type the same
> data twice.**
>
> Run Steps 0–6. Do **not** stop to ask "shall I proceed?" between steps — present the plan
> impact-first and keep going (see `feedback_auto_proceed_default_yes`). **STOP and ask ONLY** when
> a genuine design/architectural fork appears — one where the answer changes WHAT gets built and a
> wrong pick means rework (e.g. add-a-spouse-form-or-not when the IRS rule is ambiguous;
> blocking-vs-advisory; a data-model shape choice). Then resume on my answer.

### Step 0 — Orient
- The taxpayer form at the CURRENT sidebar position: form id + component. **Find the corresponding
  spouse form** — id + component. **It may or may not exist.** Note the IRS form/line(s) it drives.

### Step 1 — IRS grounding (mandatory, no guesswork)
- Read the authoritative sources; quote the rule + source. Answer:
  - Is this item **PER-PERSON** (each spouse has their own answer) or **PER-RETURN/household**
    (one answer for the whole return)?
  - **How does MFS differ from MFJ** — eligibility, ½-limits, disallowed credits, required facts
    (e.g. "lived apart from spouse all year"), itemize-coordination (§63(c)(6)(A)), SS base
    amounts, phaseouts?
- If MFS **disallows** the item (EIC, education credits, dependent-care unless lived-apart, …) →
  the spouse path is a **gate/blocker**, not parity.

### Step 2 — Current-state inventory (read before deciding — inspect, don't assume)
- Read: taxpayer component, spouse/generic component (if any), the YAML intake spec, the backend
  Mapper + entity + migration, the compute path in `TaxReturnComputeService`, `MfsFormScoper`, and
  the output model.
- Record: does a spouse form exist? Is it **gated under MFS** (`[disabled]="!isJointReturn"`, etc.)?
  Field-subset or parity? What does the backend read for the spouse and how does it flow into the
  joint return today?
- ★ **Some forms are ALREADY MFS-ready** (e.g. Form #4 Digital assets). If every layer already
  works correctly, the job is to **VERIFY with an e2e**, not manufacture changes. Don't invent work.

### Step 3 — Decide the SPOUSE-FORM SHAPE (the core thinking — grounded in Step 1)
Walk this decision tree:
1. **Does a spouse form need to exist?** Per-person item → yes. Pure return-level item → the
   taxpayer form is usually the single household election — but check whether the spouse's MFS leg
   needs its own per-leg copy/answer.
2. **What contents?** Same as the taxpayer form, a tailored subset, or different (spouse-specific
   MFS facts)?
3. **Avoid double-entry under MFJ.** The spouse form is ALSO used on a joint return — do NOT make
   the user re-type data already on the Family Head tab. Provide a **reuse mechanism**: e.g. a
   "Same as Family Head" checkbox — on select, copy the taxpayer's values; on deselect, clear them
   (the Address pattern, Form #2). Decide whether the spouse form needs this.
4. **Maybe MOVE questions.** Sometimes a per-person question currently lives ONLY on the taxpayer
   form (and wrongly serves both spouses under MFS) — **SPLIT it:** move the per-person part to the
   spouse form, keep the shared/return-level part on the taxpayer form.
5. **If MFS disallows the item** → a gate/blocker on the spouse path, not parity.
- Classify into a bucket: **A** paired & complete (ungate / verify) · **B** paired but subset
  (bring to parity) · **C** taxpayer-only (add spouse form) · **D** return-level (add spouse copy
  with a reuse mechanism) · **E** split a per-person question out to the spouse · **F**
  shared/deferred/out-of-scope.

### Step 4 — Plan all layers (impact-first), then implement
Cover each, then act (pausing only on a real design fork):
- **(a) Frontend** — components/templates/YAML; the reuse mechanism / gate inversion / new or moved
  fields; how MFJ behavior is preserved. Register a new spouse component in `shell.component.ts`
  (import + `imports[]` + template `*ngIf` + sidebar `personalSpouseItems` + nav order).
- **(b) Backend** — mapper/entity/migration; `MfsFormScoper` scoping for `mfs_spouse` (and drop for
  `mfs_head`); `TaxReturnComputeService` flow into MFJ primary + `mfs_head` + `mfs_spouse`;
  per-person compute gaps. **Register-in-N-places hazards:** `PersonalResource.PERSONAL_FORMS`;
  `UserDataBulkDelete.PARENT_TABLES_UID_CASCADE`; add `V*.sql` to `db.changelog-master.xml`;
  `--liquibase formatted sql` header (no bullet-block comments); PG-compatible SQL.
- **(c) Output mapping** — how the computed result maps onto Form 1040 + schedules / owner-suffixed
  forms for EACH return kind, using the `C:\us-tax\pdfs` semantic field maps; confirm owner
  attribution (8606/4972/8919/4137/4852/2555/4563 …).
- **(d) Tests** — Java unit + e2e. Pin **EXACT IRS-hand-computed values** (never `> 0`, never the
  app's own output — derive from the IRS brackets/limits so a red surfaces a real bug). Cover
  **MFJ-unchanged AND MFS → two correct returns.**
- **(e) Impact & reversibility** — files, tests expected to break (file:line), revert path, hazards.

### Step 5 — Verify against the live stack
- Build (`mvnw compile` / `npm run build`) + Java unit tests. Then run the e2e against a running
  backend + UI: start `run-dev.ps1` + `npm start -- --proxy-config proxy.conf.json`; auth env
  `E2E_SHARED_AUTH_PHONE=+19056193359` / `E2E_SHARED_AUTH_CODE=123456`; `npx playwright test
  --workers=1 --output=test-results-<tag>` with `dangerouslyDisableSandbox`. Repair tests broken by
  the change — diagnose principally (IRS → spec → code); **NEVER match the test to observed output.
  Leave red rather than lie green.**

### Step 6 — Document & advance
- Update `C:\us-tax\history.md`, `memory.md` (index pointer + a topic file if reusable), and
  `rules.md` when a guardrail emerges.
- Tick the form ☑ in the queue, move `← CURRENT` to the next form, and **SHOW ME THE NEXT FORM**
  with a one-line note on its likely bucket. Commit/push only when I ask.

### Global guardrails
- Honest, principled, IRS-grounded; **no guesswork**. Leave red rather than lie green.
- Never break MFJ while enabling MFS. **Never double-enter data** (use a reuse mechanism).
- One form at a time; don't pre-decide later forms.
- **Taxpayer + Spouse only.** Dependents deferred; self-employment out of scope; Statements via
  TIN attribution.
- **Inspect before building** — verify already-MFS-ready forms rather than manufacturing changes.
- **Auto-proceed** on procedural gates; pause only for genuine design/architectural forks.

---

## QUEUE (Taxpayer-tab sidebar order) — status: ☐ todo · ◐ in-progress · ☑ done

### Personal
1. ☑ **Identification** — `identification-taxpayer` ↔ `identification-spouse`. **DONE 2026-06-19** — frontend already complete (parity, ungated); backend fix in `MfsFormScoper.normalizeSpouseIdentity` so the mfs_spouse filer header gets the spouse's name/DOB/occupation/IP-PIN (spouse-prefixed → canonical). Unit (`Phase7bComputeScopingTest`) + e2e (`mfs-spouse-identity.spec.ts`) green. See history.md.
2. ☑ **Address** — `address-taxpayer` ↔ `address-spouse`. **DONE 2026-06-20** — new spouse Address form with "Same as Family Head" flag; `pf_address.owner_role` (V78); `AddressMapper`+`MfsFormScoper` resolve the spouse's MFS-return address (own or household). Unit + e2e (`mfs-spouse-address.spec.ts`) green. Email/Phone moved to end of both Address forms. See history.md.
3. ☑ **Filing status** — `filing-status` ↔ `filing-status-spouse` (NEW). **DONE 2026-06-20.** Expanded far beyond the first-guess Bucket E into the full **HOH-split feature** (user-declared per-tab election → MFJ one return; non-MFJ → spouse elects {MFS, HoH}; both legs may be HoH). Design: `C:\us-tax\docs\separate-filing-hoh-split-design.md`; memory `project_hoh_split_optimizer`. Phases A–F COMPLETE & GREEN: V79 kept-up-home + V80 spouse-election columns; paired form + MFJ-locks-spouse gating + married-HoH question; `MfsFormScoper.overrideFilingStatusToSeparate` (per-leg status + the original MFS spouse-name flip); dependent `claimedByMfs` under HoH (required); Tier-2 blocking-overrideable considered-unmarried validation. Verified: 47 multireturn + 869 compute unit tests + **5/5 IRS-pinned e2e** (`e2e/tests/hoh-split-filing.spec.ts`) green; V79+V80 clean Liquibase apply.
4. ☑ **Digital assets** — `digital-assets-taxpayer` ↔ `digital-assets-spouse`. **DONE 2026-06-20 — already MFS-ready, no code change.** Spouse component ungated under MFS; mapper owner_role; scoper generic `-spouse` rename routes to mfs_spouse; `buildDigitalAssets` per-leg (OR-combine only for MFJ — IRS per-return rule). Verified by `e2e/tests/mfs-spouse-digital-assets.spec.ts` (head Yes / spouse No → mfs_head Yes, mfs_spouse No) — 1/1 green. See history.md.
5. ☑ **Presidential Election Campaign** — `presidential-election-campaign-taxpayer` ↔ `-spouse`. **DONE 2026-06-20 — per-leg $3 leak FOUND & FIXED** (looked Bucket-A "already done" but wasn't). Shared `pf_presidential_election` row → `load('-spouse')` carried the head's `youFundElection`, leaking onto the spouse's MFS 1040. Fix: `MfsFormScoper.normalizePresidentialSpouse` maps the spouse's election onto the filer keys. Verified: 2 Phase7bComputeScopingTest cases (31 green) + `e2e/tests/mfs-spouse-presidential-election.spec.ts` green. See history.md.
6. ☑ **Third party designee** — `third-party-designee-taxpayer` ↔ `third-party-designee-spouse` (NEW). **DONE 2026-06-20 — added spouse designee form** (Bucket C/D; first genuine add since resuming). Per-return designee; spouse's MFS return was blank. **owner_role two-row (V81, mirrors pf_address)** — chosen over dual-column to avoid the Form #5 shared-row leak; same field names → generic scoper rename routes it with no normalization. Parameterized `form-third-party-designee` (@Input formId+person) + shell registration; NO reuse checkbox (MFS-only form, no MFJ double-entry). Verified: 33 Phase7b + `e2e/tests/mfs-spouse-third-party-designee.spec.ts` green. See history.md.

### Statements  (shared, recipient-TIN attributed — handle via attribution, not pairing; revisit as a group)

### Incomes
7. ☐ **Employment** — `employment-taxpayer` ↔ `employment-spouse` (gated). Bucket A. **← CURRENT**
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
