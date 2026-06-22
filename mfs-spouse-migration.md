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
7. ☑ **Employment** — `employment-taxpayer` ↔ `employment-spouse`. **DONE 2026-06-20 — first gated form; removed the MFS gate (option #1).** Backend already MFS-ready (owner_role rows, scoper rename, isMfs-gated compute); the spouse form just self-disabled on `isJointReturn`. Fix: removed the gate + dead derivation/banner, renamed flag → `canEdit`=true (trust the shell). ★ **PATTERN for the remaining gated forms #8–#23:** remove the `isJointReturn` self-gate, trust the shell's per-tab visibility (covers MFJ/MFS/HoH-split). Verified: npm build + `e2e/tests/mfs-spouse-employment.spec.ts` (head $2,000 / spouse $1,500 line-1b → per-leg) green. See history.md.
8. ☑ **Tips** — `tips-taxpayer` ↔ `tips-spouse`. **DONE 2026-06-20 — removed MFS gate (option #1, same as #7).** Backend already MFS-ready (tip-income-* owner_role rows, scoper rename, isMfs-gated computeTips); removed the spouse form's isJointReturn gate → `canEdit`=true. Verified: npm build + `e2e/tests/mfs-spouse-tips.spec.ts` (head $1,200 / spouse $800 line-1c → per-leg) green. See history.md.
9. ☑ **Medicaid waiver** — `medicaid-waiver-taxpayer` ↔ `medicaid-waiver-spouse`. **DONE 2026-06-21 — removed MFS gate (option #1).** Was flagged Bucket A/B but is **A**: full field parity (9 fields + entries), backend already MFS-ready (medicaid-waiver-payments-* owner_role rows, scoper rename, isMfs-gated compute). Removed the spouse form's isJointReturn gate + 6 method guards → `canEdit`=true. Verified: npm build + `e2e/tests/mfs-spouse-medicaid-waiver.spec.ts` (head $3,000 / spouse $2,000 line-1d → per-leg) green. See history.md.
10. ☑ **Uncollected SS/Medicare** — `uncollected-ss-medicare-taxpayer` ↔ `-spouse`. **DONE 2026-06-21 — verify-only (already MFS-ready, no code change).** Spouse component ungated; backend stores firms under separate owner_role rows in pf_uncollected_ss_medicare (two-row model, NOT the shared-row shape that leaked in Presidential/#5); scoper generic `-spouse`→`-taxpayer` rename applies cleanly; `computeForm8919ForPerson` MFS-guarded (TaxReturnComputeService:19801-19803 passes null spouseData → line 1g/Schedule 2 line 6 filer-only). Verified: `e2e/tests/mfs-spouse-uncollected-ss-medicare.spec.ts` (head $5,000 / spouse $3,000 line-1g → per-leg, no leak) green. See history.md.
11. ☑ **Combat pay** — `combat-pay-taxpayer` ↔ `combat-pay-spouse`. **DONE 2026-06-21 — verify-only (already MFS-ready, no code change).** Spouse component ungated (only Save button `[disabled]`); `pf_combat_pay` stores one row per (uid, owner_role) — two-row model, NOT the shared-row shape that leaked in Presidential/#5; scoper generic `-spouse`→`-taxpayer` rename routes both the elect flag and the resolved filer SSN per leg; `computeCombatPay` has a THREE-POINT MFS guard (spouseSsn / electSpouse / spouseTotal each nulled — lines/1i.md §4) so code Q is filer-only. Verified: `e2e/tests/mfs-spouse-combat-pay.spec.ts` (head code-Q $2,500 / spouse code-Q $1,200, both electing → per-leg line 1i, per-SSN attribution, no leak) green. See history.md.
12. ☑ **Child & dependent care** — `childcare-expenses` ↔ `childcare-expenses-spouse`. **DONE 2026-06-21 — Option B (mirrored spouse Form 2441).** First half was verify-only (IRC §21(e)(2) already correct: `creditDisallowed = (isMfs && !marriedFilingSeparatelyException) || noCareExpenses`). User then chose **Option B**: added a spouse copy so the MFS spouse leg computes its OWN Form 2441. **V82** adds `owner_role` to `pf_childcare_expenses` (surrogate id PK + UNIQUE(uid,owner_role), V81 shape) + `parent_owner_role` to both child tables; mapper keyed by (uid,owner_role); `PERSONAL_FORMS += childcare-expenses-spouse`; `MfsFormScoper` childcare special-case (spouse leg's `-spouse`→`childcare-expenses` read key, head copy dropped). Kept `childcare-expenses` formId (no rename → taxpayer e2e/UI untouched). **MFJ MERGES both forms** into one combined Form 2441 (`TaxReturnComputeService.mergeChildcareForms` — per user feedback; "hide on MFJ" was wrong because Part III benefits are per-spouse); spouse form shown on MFJ too. Component parameterized `@Input formId`. **The earlier return-level 409 gap is RESOLVED** (childcare is now per leg). Verified: backend compile + V82 boot + frontend tsc + Phase3/Phase4 unit tests + `e2e/tests/mfs-spouse-childcare-credit.spec.ts` 4/4 (head null; head exception=$660; MFJ merge line1e=$0/line16=$5,000; spouse own 2441=$810) + `line1e-dependent-care` 20/20. See history.md + outstanding.md (gap RESOLVED).
13. ☑ **Adoption expenses** — `adoption-expenses` ↔ `adoption-expenses-spouse`. **DONE 2026-06-21 — Option B (mirror), same playbook as #12.** V83 owner_role split on `pf_adoption_expenses` (surrogate id PK + UNIQUE) + `parent_owner_role` on `pf_adoption_child`; mapper keyed by (uid,owner_role); `PERSONAL_FORMS += adoption-expenses-spouse`; `MfsFormScoper` adoption special-case; `TaxReturnComputeService.mergeAdoptionForms` (MFJ merge with per-child `child{N}` re-indexing); parameterized component + spouse sidebar entry. Differs from #12: credit (Part II §23) OUT OF SCOPE (only §137 line-1f exclusion); NO §17 family block (no 409 gap); §137(f) MFS gate already existed. Verified: compile + V83 boot + frontend tsc + Phase3/Phase4 + `e2e/tests/mfs-spouse-adoption-benefits.spec.ts` 3/3 (per-leg head $8,000/spouse $5,000; MFJ merge line1f=$0; spouse-leg exception exclude $0) + `line1f-adoption-benefits` regression. See history.md.
14. ☑ **Other earned income** — `other-earned-income` ↔ `other-earned-income-spouse`. **DONE 2026-06-21 — Option B (full mirror); hardest UI yet.** Line 1h is statement-derived (W-2 box-12 excess deferrals + 1099-R disability/corrective, SSN-attributed) with per-person inputs baked into wide `_taxpayer`/`_spouse` column pairs + `owner`-tagged child entries. V84 owner_role split (surrogate id PK + UNIQUE) on `pf_other_earned_income` + parent_owner_role on both child tables; each row holds one person's data in the "you"/taxpayer slot; mapper keyed by (uid,owner_role); `MfsFormScoper` special-case (no slot remap — data already in taxpayer slot); `mergeOtherEarnedForms` maps the spouse form's taxpayer slot → combined spouse slot + concats entries. Component person-aware (active-person record filter by SSN + active gates, hide the other person's blocks). **Fixes the leak** where the MFS spouse leg read the head's §117/457b/403b flags. Verified: compile + V84 boot + frontend tsc + Phase3/Phase4 + `e2e/tests/mfs-spouse-other-earned-income.spec.ts` 2/2 (MFS head $2,100/spouse $1,000 via spouse's own §117 flag; MFJ merge $3,100) + `line1h-other-earned-income` regression. See history.md.
15. ☑ **Interest income** — `interest-income-taxpayer` ↔ `interest-income-spouse`. **DONE 2026-06-21 — spouse gate removal + 8815 MFS UX (frontend only).** Storage already owner_role; backend already MFS-ready (scoper rename + MFS guard) → NO migration/backend change. Removed the spouse form's `!isJointReturn` editability gate (27 `[disabled]` + info-note + save-guard + Save-button, option-#1 like #7/#8/#9) so the spouse can enter interest income on MFS. **Form 8815 is NOT a parity gap** — it's a single household input on the Family Head form (disallowed on MFS per §135(d)(2), already compute-blocked); per user feedback the head form now HIDES the savings-bond-exclusion section on MFS (`*ngIf="!isMfs"`) instead of inviting-then-blocking; completion counter MFS-aware. Verified: frontend tsc + `e2e/tests/mfs-spouse-interest-income.spec.ts` 2/2 (MFS head $500 / spouse $300; MFJ $800) + line2ab regressions. See history.md.
16. ☑ **Dividend income** — `dividend-income-taxpayer` ↔ `dividend-income-spouse`. **DONE 2026-06-21 — spouse gate removal (frontend only), twin of #15.** Storage already owner_role; backend already MFS-ready (`dividendIncomeSpouse = isMfsReturn ? null` + scoper rename) → NO migration/backend change. Removed the spouse form's `!isJointReturn` gate (info-note + wrapper class + 11 `[disabled]` + 10 `[attr.disabled]` + isValid guard + Save button, option-#1). No 8815-analog. Verified: frontend tsc + `e2e/tests/mfs-spouse-dividend-income.spec.ts` 2/2 (MFS head $500 / spouse $300; MFJ $800) + line3ab regression. See history.md.
17. ☑ **IRA income** — `ira-income-taxpayer` ↔ `ira-income-spouse`. **DONE 2026-06-21 — spouse gate removal (frontend only), same as #15/#16.** Storage already owner_role; backend already MFS-ready (`iraIncomeSpouse = isMfsReturn ? null` + scoper rename) → NO migration/backend change. Removed the spouse form's `!isJointReturn` gate (info-note + wrapper class + 43 `[disabled]` + the running-totals projection `*ngIf` + isValid guard + Save button, option-#1). No 8815-analog. Verified: frontend tsc + `e2e/tests/mfs-spouse-ira-income.spec.ts` 2/2 (MFS head $2,000/$1,500 / spouse $1,000/$800; MFJ $3,000/$2,300) + line4abc regression. See history.md.
18. ☑ **Pension withdrawals** — `pension-annuity-income-taxpayer` ↔ `pension-annuity-income-spouse`. **DONE 2026-06-21 — spouse gate removal (frontend only), same as #15/#16/#17.** Storage already owner_role; backend already MFS-ready (`pensionIncomeSpouse = isMfsReturn ? null` + scoper rename) → NO migration/backend change. Different gate mechanism (multi-screen wizard): whole `form-view` + `wizard-nav` were `*ngIf="isJointReturn"`-hidden. Removed the gate at 6 spots (form-intro `*ngIf`, info-note, form-view `*ngIf`, wizard-nav `*ngIf`, `projectionVisible` getter, isValid guard). No 8815-analog (PSO per-person; lump-sum/4972 separate form). Verified: frontend tsc + `e2e/tests/mfs-spouse-pension-income.spec.ts` 2/2 (MFS head $5,000 / spouse $3,000; MFJ $8,000) + line5abc regression. See history.md.
19. ☑ **Social Security benefits** — `social-security-benefits-taxpayer` ↔ `social-security-benefits-spouse`. **DONE 2026-06-21 — gate removal + §86 lived-apart on the spouse form (frontend only).** Storage already owner_role; shared mapper already persists the lived-apart fields; backend already MFS-ready (scoper rename + `socialSecuritySpouse = isMfsReturn ? null`) → NO migration/backend change. Removed the `!isJointReturn` gate (info-note + wrapper + 20 `[disabled]` + isValid + Save). **The wrinkle:** §86 MFS base amount is $0 (lived together any time) vs $25k (lived apart all year); those fields were only on the taxpayer form, so the spouse leg defaulted to the wrong base. Per user choice, ADDED the mfsOnly lived-apart section to the spouse form (`isMfs`-aware) — each MFS return carries its own answer; compute reads it from the renamed spouse form (no backend change). Verified: frontend tsc + `e2e/tests/mfs-spouse-social-security.spec.ts` 2/2 (spouse leg SS $10k + $5k income: lived-apart → taxable $0; lived-with → $8,500) + line6abcd regression. See history.md.
20. ☑ **Capital gain/loss** — `capital-gain-loss-taxpayer` ↔ `capital-gain-loss-spouse`. **DONE 2026-06-21 — gate removal + MFS 1099-B leak fix.** Storage already owner_role; backend already MFS-ready; §1211(b) $1,500 loss cap already in compute. Frontend: removed the `!isJointReturn` gate (info-note + `disabled-section` class + onSubmit save-guard + Save button). **Backend bug the e2e surfaced:** `belongsToEitherCapitalPersonByKey`'s catch-all `(taxpayerHadCapital && !spouseHadCapital)` leaked the OTHER spouse's 1099-B onto the head leg on MFS (spouseSsn/spouseHadCapital nulled → unmatched TIN falls to taxpayer). Fix: exclude entries whose recipient TIN = `filing-status.mfsOtherSpouseSsn` (scoper-set, same as the W-2 line-1a filter) before the catch-all; threaded `excludeSsn` through the 1099-B/1099-DA build + belongs methods (null off-MFS → single/MFJ unchanged). Verified: compile + restart + frontend tsc + `e2e/tests/mfs-spouse-capital-gain-loss.spec.ts` 2/2 (MFS head +$2,000 / spouse +$1,000 no leak; spouse-leg $5k loss → -$1,500 cap) + line7ab regression. See history.md.
21. ☑ **Other incomes** — `other-incomes-taxpayer` ↔ `other-incomes-spouse`. **DONE 2026-06-22 — gate removal + alimony line-2b parity (frontend only).** Storage already owner_role (`pf_other_incomes`, shared `OtherIncomesMapper`); backend already MFS-ready (`computeOtherIncomes` nulls `otherIncomeSpouse` on MFS — 13-orchestrator single-guard cascade — + scoper generic `-spouse`→`-taxpayer` rename) → NO migration/backend change. Removed the spouse form's `!isJointReturn` gate (info-note + ng-container wrapper + Save button + isValid/validationErrors short-circuits, option-#1). **The "alimony-date gap" was real:** the taxpayer form had the Schedule 1 line 2b agreement-date field but the spouse form had only line 2a; the backend runs `validateAlimonyAgreementDate` per-side, so a spouse with alimony on her renamed leg was permanently stuck on `OTHER_INCOME_ALIMONY_DATE_REQUIRED_TAXPAYER`. Mirrored `alimonyAgreementDateLine2b` onto the spouse form (model/default/`FieldType+='date'`/`DatePickerModule`/`p-datepicker`+TCJA warning/`gatedByNonZero` config/help/`isAlimonyAgreementPost2018()`/post-2018 error/reset). **Follow-up (user request):** also mirrored the full `statementUploadCheck` section (6 fields: `received/uploaded1099G/C`, `confirmAllReceivedOtherIncomeStatementsUploaded`, `hasUploadedAtLeastOneOtherIncomeStatement` + count pills/auto-answer/upload-CTA via `FormNavigationService`/`isFullyAutoDetected()`/`refreshStatementCounts()`/isValid+validationErrors gates) so the spouse satisfies the statement-confirmation gate on her OWN leg instead of leaning on the head form — shared `OtherIncomesMapper` already persists all 6 per owner_role, still no backend change. Verified: `npm run build` clean + `e2e/tests/mfs-spouse-other-incomes.spec.ts` 5/5 (MFS per-leg head $4,000/spouse $6,000 line 8 no leak; MFJ merge $10,000; MFS spouse post-2018 date → §17 409; spouse own confirmation clears gate 200; missing confirmation → 409) + `line8-other-incomes` 34/34. See history.md.
22. ☐ **Income adjustments** — `income-adjustments-taxpayer` ↔ `-spouse` (gated). Bucket A. **← CURRENT**
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
