Below is a **2025-tax-year, IRS-verified, developer-ready** rule map for **Form 1040 lines 7a and 7b (Capital gain or (loss))**.

Reviewed against:
- **2025 Instructions for Form 1040/1040-SR** (`i1040gi`)
- **2025 Instructions for Schedule D (Form 1040)** (`i1040sd`)
- **2025 Instructions for Form 8949**
- **2025 Instructions for Form 8814**
- **IRC §1211(b)** (capital loss cap), **§1212(b)** (carryover), **§165(c)** (personal-use loss), **§166(d)** (nonbusiness bad debt), **§121** (principal residence), **§1250 / §1202 / §1400Z-2** (special rates / exclusions)
- Local cross-checks in `C:\us-tax\docs\books\i1040gi_2025.txt` and `J.K. Lasser's Your Income Tax 2025`
- Implementation verified against `TaxReturnComputeService.java` (2026-06-14)

This version keeps two points tight from the prior draft:
- selling a capital asset does **not always** mean **Form 8949** is required, because some broker-reported 1099-B / 1099-DA transactions can be aggregated directly on **Schedule D**; and
- the child-capital-gain path from **Form 8814 line 10** can feed **Form 1040 line 7a directly** when Schedule D is not required, but routes through **Schedule D line 13** when Schedule D is required.

---

# Implementation status (2026-06-14)

**Implemented:**
- Exception 1 (no-Schedule-D direct entry) path — 8-condition AND gate (more conservative than spec's nominal 4-condition rule)
- Schedule D lines 1a–22 (all short-term and long-term rows)
- Form 8949 pages, grouped by box (A–L), 11 transactions per page
- Capital loss limit $3,000 / $1,500 MFS (Schedule D line 21; IRC §1211(b))
- 1099-B and 1099-DA box derivation (A–F, G–L)
- Direct Schedule D aggregation for boxes A/D (1099-B) and G/J (1099-DA) — no Form 8949 for these
- Wash-sale adjustment detection (code W) → forces Form 8949
- QOF flag detection → blocks Exception 1, sets Schedule D QOF checkbox
- Form 8814 line 10 child capital gain → line 7b child checkbox + child amount on line 7a; routed through Schedule D line 13 when Schedule D required (Phase 1 fix)
- Prior-year capital loss carryovers → Schedule D lines 6 (short) and 14 (long)
- 1099-DIV boxes 2b/2c/2d → Schedule D lines 18/19
- Form 2439, 6252, 6781, 8824 — `RequiredAttachmentForm` produced when entries exist (Phase 1)
- Schedule K-1 capital attachment — `RequiredAttachmentForm scheduleK1Capital` produced when K-1 entries exist (Phase 1)
- Nominee reporting — non-blocking advisory flag `CAPITAL_NOMINEE_DISTRIBUTIONS_REPORTED` when nominee amount present (Phase 1)
- Form 8997 — `RequiredAttachmentForm form8997` produced when QOF deferral detected (Phase 2)
- Capital loss carryover worksheet — `computeCapitalLossCarryover()` computes next-year short/long-term split per IRS rule; stored in `ScheduleD.nextYearShortTermCapitalLossCarryover` / `nextYearLongTermCapitalLossCarryover` (Phase 2)
- 1099-S advisory — non-blocking flag `FORM_1099S_REAL_ESTATE_REPORTED` when entries present (Phase 2)
- Nonbusiness bad debt (§166) — Box C Form 8949 transaction created from personal form fields `nonbusinessBadDebtFaceAmount` / `nonbusinessBadDebtDescription` (Phase 2)
- MFS guard on `computeCapitalGainLoss` (orchestrator extends 12-orchestrator cascade)

**Remaining deferred (see `outstanding.md`):**
- Form 2439 / 6252 / 6781 / 8824 / K-1 amounts not auto-derived from statement data into Schedule D lines 4/5/11/12; user must manually enter via supplemental line inputs
- 1099-S full computation — §121 exclusion, investment/rental property gain auto-entry on Schedule D, personal-use loss reporting on Form 8949; currently advisory flag only
- 28% Rate Gain Worksheet (Schedule D line 18) and Unrecaptured §1250 Gain Worksheet (line 19) — user-entered values only; no auto-derivation from statement data
- E2E coverage for capital statement forms (1099-DA, 4684, 4797, 6252, 6781, 8824, K-1) — spec temporarily removed

---

# 1) Line identities (2025 Form 1040)

- **Line 7a:** Capital gain or (loss) — single numeric amount.
- **Line 7b:** two checkboxes + entry-space.
  - **"Schedule D not required"** checkbox (Exception 1 path).
  - **"Includes child's capital gain or (loss)"** checkbox, with entry space for **Form 8814 line 10** amount.

The 2025 form separates the amount and the checkbox logic:
- the amount itself goes on **line 7a**;
- the related filing-mode / child-gain facts go on **line 7b**.

Line 7a is the **7th operand in line 9**. Line 7b is **disclosure-only** — its booleans and entry-space amount NEVER add to line 9 (the child amount is already in line 7a; the entry space duplicates it for IRS visibility, not for arithmetic).

---

# 2) What can feed line 7a

## 2.1 Direct line-7 path (Exception 1)

Line 7a can be populated directly from:
- **capital gain distributions** from **Form 1099-DIV, box 2a**, if the taxpayer qualifies for the no-Schedule-D exception; and
- **Form 8814, line 10**, if the taxpayer includes a child's capital gain distributions on the parent return.

## 2.2 Schedule D path

Line 7a is more commonly populated from **Schedule D** when capital items require that schedule.

Schedule D collects:
- sales and exchanges reported on **Form 8949**;
- certain transactions reported directly on **Schedule D** without Form 8949 (boxes A / D / G / J with basis reported and no adjustments);
- gains from **Form 2439**, **Form 6252**, or **Part I of Form 4797**;
- gains or losses from **Forms 4684, 6781, and 8824**;
- capital items from a **partnership, S corporation, estate, or trust**;
- capital gain distributions not reported directly on Form 1040 line 7a; and
- capital loss carryovers (from the prior-year capital loss carryover worksheet).

## 2.3 Important non-line-7 sources to distinguish

Not every sale or disposition goes on line 7 through the same path:
- some property dispositions belong first on **Form 4797**;
- some nondeductible personal-use losses still must be shown on **Form 8949** if an information return such as **Form 1099-S** or sometimes **1099-K** was issued;
- QOF deferral / exclusion items require **Form 8949** and related **Form 8997** reporting support.

---

# 3) Core inputs

## 3.1 Statements and forms

| Source | Role |
|---|---|
| Form 1099-DIV | box 2a capital gain distributions; boxes 2b/2c/2d trigger Schedule D |
| Form 1099-B | broker proceeds (boxes A–F) |
| Form 1099-DA | digital-asset broker proceeds (boxes G–L, NEW for 2025) |
| Form 2439 | undistributed long-term capital gains |
| Form 6252 | installment sale |
| Form 4797 Part I | ordinary capital gain |
| Form 4684 | casualty / theft capital gain |
| Form 6781 | section 1256 contracts |
| Form 8824 | like-kind exchange |
| Schedule K-1 (1041 / 1065 / 1120-S) | capital items |
| Prior-year capital loss carryover | data from prior return |
| Form 8814 | child capital gain distributions (line 10) |
| Form 1099-S | real estate (Phase 2 advisory only) |

## 3.2 Personal-form facts

- whether the taxpayer has **QOF** deferral / exclusion / disposition activity (`hasQofDeferral`);
- whether any transaction has adjustments or codes requiring **Form 8949**;
- whether any capital gain distributions were received **as a nominee** (`nomineeCapitalGainDistributionsToSubtract`);
- whether the child-income election under **Form 8814** is being used;
- nonbusiness bad debt details (`nonbusinessBadDebtFaceAmount` / `nonbusinessBadDebtDescription`).

---

# 4) Direct-entry path: no Schedule D required (2025 Exception 1)

## 4.1 When Exception 1 applies — 8-condition AND gate

The spec's nominal 4-condition rule is implemented as a more conservative 8-condition AND gate at `TaxReturnComputeService.java` (~line 6610-6636). The taxpayer can report an amount directly on **Form 1040 line 7a** and avoid **Schedule D** only if **all** of these hold:

1. **No QOF activity** — `!hasQofDeferral` (Exception 1 blocker per spec §10);
2. **No capital losses** — `noCapitalLosses` (only gains allowed);
3. **Only-gain source is 1099-DIV box 2a** — `onlyCapitalGainsAreBox2aDistributions` (no 1099-B / 1099-DA gain);
4. **No 1099-DIV box 2b** unrecaptured §1250 gain;
5. **No 1099-DIV box 2c** §1202 gain;
6. **No 1099-DIV box 2d** collectibles 28%-rate gain;
7. **No Form 2439 / 6252 / 4797 Part I / 4684 / 6781 / 8824 amounts** (each triggers Schedule D);
8. **No K-1 capital items** and **no prior-year capital loss carryover**.

If all 8 hold:
- put the amount directly on **line 7a**; and
- check **"Schedule D not required"** on **line 7b**.

## 4.2 Direct-entry amount

If Exception 1 applies:

```text
line7aBase = taxpayer_box2a_amount_less_nominee
line7a     = line7aBase
           + (includesChildCapitalGainLoss ? form8814Line10Total : 0)    // child added directly on Exception 1 path

line7b.scheduleDNotRequired           = true
line7b.includesChildCapitalGainLoss   = (form8814Line10Total > 0)
line7b.childAmountFromForm8814Line10  = roundMoney(form8814Line10Total)  // entry-space, disclosure only
```

## 4.3 Nominee capital gain distributions

If the taxpayer received capital gain distributions **as a nominee**:
- report on line 7a only the amount that actually belongs to the taxpayer (`box2aTotal - nomineeCapitalGainDistributionsToSubtract`);
- include a statement showing the **full amount received** and the **nominee amount**;
- preserve the separate nominee Form 1099-DIV / Form 1096 compliance requirements outside the 1040 line-7 calculation;
- the engine emits an advisory `CAPITAL_NOMINEE_DISTRIBUTIONS_REPORTED` flag.

## 4.4 Tax computation when Schedule D is not required

If Schedule D is not required, the tax is figured using the **Qualified Dividends and Capital Gain Tax Worksheet** in the line-16 instructions (preferential 0% / 15% / 20% rates per the QDCG thresholds — see §16).

---

# 5) Schedule D required — Form 8949 conditional

## 5.1 When Form 8949 is required

Use **Form 8949** to report:
- the sale or exchange of a capital asset **not reported on another form or schedule**;
- income deferral or exclusion of capital gains, including **QOF** reporting handled through Form 8949;
- any transaction with a wash-sale adjustment (`copy_A_box1g_wash_sale_loss_disallowed` on 1099-B; `copyA_box1i_wash_sale_loss_disallowed` on 1099-DA), which forces code **W**;
- any transaction requiring an adjustment code or noncovered-basis reporting.

## 5.2 When Schedule D can be used without Form 8949

Aggregated transactions from **Form 1099-B** and **Form 1099-DA** can go directly on **Schedule D** without Form 8949 when:
- basis was reported to the IRS,
- no adjustment is needed to basis, gain/loss amount, or holding-period character, and
- no special Form 8949 code / QOF handling is required.

Those direct-report totals go on:
- **Schedule D line 1a** for qualifying short-term transactions, or
- **Schedule D line 8a** for qualifying long-term transactions.

## 5.3 Form 8949 box mapping (2025)

| Box | Form | Term | Basis reported to IRS | Schedule D line |
|---|---|---|---|---|
| A | 1099-B | Short | Yes | line 1a (direct) or line 1b (via Form 8949) |
| B | 1099-B | Short | No | line 2 (via Form 8949) |
| C | 1099-B | Short | N/A (noncovered/other) | line 3 (via Form 8949) |
| D | 1099-B | Long | Yes | line 8a (direct) or line 8b (via Form 8949) |
| E | 1099-B | Long | No | line 9 (via Form 8949) |
| F | 1099-B | Long | N/A (noncovered/other) | line 10 (via Form 8949) |
| G | 1099-DA | Short | Yes | line 1a (direct) or line 1b (via Form 8949) |
| H | 1099-DA | Short | No | line 2 (via Form 8949) |
| I | 1099-DA | Short | N/A | line 3 (via Form 8949) |
| J | 1099-DA | Long | Yes | line 8a (direct) or line 8b (via Form 8949) |
| K | 1099-DA | Long | No | line 9 (via Form 8949) |
| L | 1099-DA | Long | N/A | line 10 (via Form 8949) |

**Direct aggregation rule:** Boxes **A**, **D** (1099-B) and **G**, **J** (1099-DA) can bypass Form 8949 and go directly to Schedule D line 1a or 8a — **but only** when the transaction has no wash-sale adjustment, no QOF involvement, and no other adjustment code.

Any wash-sale disallowance forces reporting via Form 8949 with adjustment code **W**.

---

# 6) Schedule D required even without ordinary brokerage sales

Schedule D can be required even if the taxpayer did not have a plain 1099-B-style sale. Examples:
- **Form 2439** undistributed long-term capital gains;
- **Form 6252** installment sale;
- **Form 4797 Part I** ordinary capital gain;
- **Form 4684** casualty/theft capital gain;
- **Form 6781** section 1256 contracts;
- **Form 8824** like-kind exchange;
- capital gain or loss from a **partnership, S corporation, estate, or trust** (K-1);
- **capital loss carryover** from the prior year (Schedule D lines 6 / 14);
- **1099-DIV box 2b / 2c / 2d** amounts (see §11.1);
- nonbusiness bad debt (§166) → Box C Form 8949 transaction (Phase 2).

---

# 7) Mapping Schedule D to Form 1040 line 7a

## 7.1 Gain or zero

When Schedule D is filed:
- if **Schedule D line 16** is a **gain**, enter that gain on **Form 1040 line 7a**;
- if **Schedule D line 16** is **zero**, enter **0** on line 7a.

## 7.2 Loss case (IRC §1211(b))

If Schedule D line 16 is a **loss**, the amount that can go on Form 1040 line 7a is limited:
- deductible capital losses are limited to **capital gains plus $3,000**;
- **$1,500** if **married filing separately**.

Operationally, Schedule D enforces this at line 21 before the amount flows to Form 1040:

```text
lossLimit = isMfsReturn ? new BigDecimal("1500") : new BigDecimal("3000")    // hard-coded inline ~line 6604

if scheduleD_line16Amount < 0:
    scheduleD_line21 = min(lossLimit, |scheduleD_line16Amount|)
    line7aBase       = -scheduleD_line21
else:
    line7aBase       = scheduleD_line16Amount    // gain (or zero)
```

The $3,000 / $1,500 caps have been **stable since IRC §1211(b) (1976)**; not inflation-indexed.

## 7.3 Carryovers (IRC §1212(b))

If the taxpayer has a loss on Schedule D line 16 and not all of that loss is allowed currently, the disallowed portion becomes a **capital loss carryover** to 2026.

Phase 2's `computeCapitalLossCarryover(line7, line15, scheduleDLine21)` computes the next-year short/long-term split per IRS rules; the result is stored in `ScheduleD.nextYearShortTermCapitalLossCarryover` / `nextYearLongTermCapitalLossCarryover` for next year's return.

---

# 8) Line 7b checkbox logic (disclosure-only)

Line 7b has **three** derived outputs (all in the `CapitalGainLossComputation` record):

```text
line7bScheduleDNotRequired         = exception1 ? TRUE : FALSE
line7bIncludesChildCapitalGainLoss = includesChildCapitalGainLossFromForm8814 ? TRUE : FALSE
line7bChildAmountFromForm8814Line10 = roundMoney(form8814Line10Total)
```

Persisted on `Income` via:

```text
income.setLine7bScheduleDNotRequired(...)
income.setLine7bIncludesChildCapitalGainLoss(...)
income.setLine7bChildAmountFromForm8814Line10(roundMoney(...))
```

## 8.1 Schedule D not required

Check **"Schedule D not required"** on line 7b only if the taxpayer qualifies for **Exception 1** (8-condition AND gate per §4.1).

## 8.2 Includes child's capital gain or (loss)

If the taxpayer is including the child's capital gain distributions in the total on line 7a:
- check **"Includes child's capital gain or (loss)"** on line 7b; and
- enter the amount from **Form 8814, line 10** in the entry space.

This checkbox can coexist with the **Schedule D not required** checkbox when the child amount is flowing directly to line 7a rather than through Schedule D.

## 8.3 Entry-space is disclosure-only

The `line7bChildAmountFromForm8814Line10` entry-space carries the Form 8814 line 10 amount for IRS visibility, but the **child amount is already in line 7a** (either directly under Exception 1 or via Schedule D line 13 under the Schedule D path). It must **NOT** be added a second time to line 9 — this is the "exclusion category (C) Double-count-prevention" pattern.

## 8.4 Practical limitation

Within the **Form 8814** path, this "child capital gain or (loss)" amount is the child's **capital gain distributions** allocation from Form 8814 line 10. Form 8814 is not a general child capital-loss workflow.

## 8.5 PDF field mapping (canonical)

- `f1_70[0]` → `line7_capital_gain_or_loss` (line 7a amount)
- `c1_43[0]` → `line7_schedule_d_not_required` (line 7b checkbox 1)
- `c1_44[0]` → `line7_includes_child_capital_gain_or_loss` (line 7b checkbox 2)
- `f1_71[0]` → `line7_schedule_d_note_text` (line 7b entry-space)

All canonical — no `unmapped_*` parallel to the 6c / 6d bug.

---

# 9) Form 8814 interaction — dual-path routing (Phase 1 fix)

## 9.1 What Form 8814 contributes

If the parent elects to report the child's income under **Form 8814**, the amount from **Form 8814 line 10** is the capital-gain-distribution amount that flows to the parent return.

Form 8814 has its own multiplicity: **one Form 8814 per child** with `childGrossIncome < $13,500` for 2025. If Form 8814 line 4 ≤ $2,700, lines 5–12 are skipped.

## 9.2 Dual-path routing on line 7a

Per the 2025 Form 8814 instructions, the line-10 amount is reported on:
- **Schedule D line 13**, **or**
- **Form 1040 line 7a**, if Schedule D is not required.

```text
if form8814_used:
    if scheduleD_required:
        include form8814Line10Total on ScheduleD.line13
        line7a = scheduleD_line16  // child amount flows through Schedule D line 16 → line 7a (no separate add)
    else:
        include form8814Line10Total directly in Form1040.line7a
    check child checkbox on line7b
    populate line7b entry-space with form8814Line10Total
```

Concrete example (Phase 1 fix verification): parent $100 box 2a + child $60 line 10 + scheduleD_required → Schedule D line 13 = $160; line 16 = $460 = line 7a (rest of Schedule D producing $300). Without the Phase 1 fix, the $60 would have been added separately to line 7a → double-counted.

---

# 10) Qualified Opportunity Fund (QOF) handling

QOF activity matters in two distinct ways:

1. It **blocks** the simple **line-7 direct-entry** exception (§4.1 condition #1).
2. It **requires** **Form 8949** and related **Form 8997** reporting.

Implementation:
- if `hasQofDeferral = true`, do not treat the taxpayer as an Exception 1 direct-entry filer;
- generate **Form 8997** (Phase 2 fix) via `buildCapitalAttachmentForms`;
- set the Schedule D QOF checkbox.

---

# 11) Other important edge cases

## 11.1 1099-DIV boxes 2b / 2c / 2d

If any Form 1099-DIV has an amount in:
- **box 2b** unrecaptured section 1250 gain (25% rate via Unrecaptured §1250 Gain Worksheet — DEFERRED auto-derivation; user-entered only);
- **box 2c** section 1202 gain (§1202 exclusion — DEFERRED);
- **box 2d** collectibles 28%-rate gain (28% Rate Gain Worksheet — DEFERRED auto-derivation),

the taxpayer must complete **Schedule D**.

## 11.2 Personal-use losses with information returns

A personal-use loss is generally **not deductible** under IRC §165(c). But if the taxpayer received an information return such as **Form 1099-S** for the sale, the transaction may still have to be reported on **Form 8949** even though the loss itself isn't deductible. (Phase 2: advisory `FORM_1099S_REAL_ESTATE_REPORTED` flag only; full §121 exclusion + auto-entry deferred.)

## 11.3 Nonbusiness bad debts (§166)

Schedule D is also used to report a **nonbusiness bad debt** as a short-term capital loss. Phase 2 implementation: personal-form fields `nonbusinessBadDebtFaceAmount` + `nonbusinessBadDebtDescription` create a Box C Form 8949 transaction automatically.

## 11.4 §121 principal residence exclusion (deferred)

Up to $250,000 / $500,000 MFJ exclusion on home sale under IRC §121. **Full computation DEFERRED.**

---

# 12) Deterministic compute pipeline

## Step 0 — Gather inputs

- 1099-DIV box 2a / 2b / 2c / 2d data;
- 1099-B data;
- 1099-DA data;
- Form 2439 / 6252 / 4797 / 4684 / 6781 / 8824 / K-1 capital items (user-supplemental);
- prior-year capital loss carryovers;
- QOF facts;
- nominee adjustments;
- Form 8814 line 10, if applicable.

## Step 1 — MFS guard

`computeCapitalGainLoss` receives `boolean isMfsReturn`. At the method top, `capitalSpouseRaw` → `capitalSpouse = null` AND `spouseRaw` → `spouse = null` on MFS via the shadowing pattern. This single guard protects:
- the `hadAnyCapital` flag (Schedule D / 8949 generation gate);
- SSN-matched statements (1099-DIV / 1099-B / 1099-DA / 2439 / etc.);
- spouse `hasQofDeferral` (which would otherwise block Exception 1 for the taxpayer);
- spouse supplemental Schedule D + nominee + nonbusiness bad debt.

Part of the 12-orchestrator MFS-cascade. **IRC §1211(b) MFS loss cap of $1,500 compounds the over-taxation risk** that the guard prevents.

## Step 2 — Validate gating

`validateCapitalStatementGating` emits **BLOCKING** `CAPITAL_STATEMENT_UPLOAD_REQUIRED` when `hadAnyCapital = true` but statements are missing.

## Step 3 — Test Exception 1 (8-condition AND gate)

```text
exception1 =
    !hasQofDeferral
    AND noCapitalLosses
    AND onlyCapitalGainsAreBox2aDistributions
    AND no1099DivBox2bGain
    AND no1099DivBox2cGain
    AND no1099DivBox2dGain
    AND noSupplementalScheduleDFeeders          // 2439/6252/4797/4684/6781/8824
    AND noK1AndNoCarryover
```

## Step 4 — Branch

If Exception 1 applies → direct-entry path (§4.2).

Otherwise → Schedule D path:
- aggregate all Schedule D feeder lines (1a–22);
- apply IRC §1211(b) loss cap at line 21;
- route Form 8814 line 10 to Schedule D line 13;
- compute next-year carryover (Phase 2).

## Step 5 — Compute final line 7a

```text
if Schedule D not filed (exception1):
    line7a = direct-entry amount + (child checkbox ? form8814Line10 : 0)
else:
    line7a = scheduleD.line16 (gain) OR -scheduleD.line21 (capped loss)
```

## Step 6 — Finalize line 7b

```text
line7bScheduleDNotRequired         = exception1
line7bIncludesChildCapitalGainLoss = (form8814Line10Total > 0)
line7bChildAmountFromForm8814Line10 = roundMoney(form8814Line10Total)
```

---

# 13) Validation flags

| Flag | Severity | Trigger |
|---|---|---|
| `CAPITAL_STATEMENT_UPLOAD_REQUIRED` | BLOCKING | `hadAnyCapital = true` AND statements missing |
| `CAPITAL_NOMINEE_DISTRIBUTIONS_REPORTED` | ADVISORY | `nomineeAdjustments > 0` (Phase 1) |
| `FORM_1099S_REAL_ESTATE_REPORTED` | ADVISORY | 1099-S entries present (Phase 2) |

---

# 14) Downstream consumers

- **Form 1040 line 9** uses **line 7a** as the 7th income operand (IRC §61(a)(3)).
- **Form 1040 line 11a/11b** (AGI) and **line 15** (taxable income) inherit via line 9.
- **Pub. 915 SS Benefits Worksheet line 3** includes line 7a as part of provisional income (see `6abcd.md` §6.2).
- **Form 6251 AMTI** — no capital-gain-specific preference; line 7a feeds via AGI.
- **Form 1040 line 16** uses the **Qualified Dividends and Capital Gain Tax Worksheet** (no Schedule D) or **Schedule D Tax Worksheet** (with Schedule D) for preferential 0% / 15% / 20% rates on net long-term capital gains and qualified dividends.
- **Line 7b** booleans + entry-space — DISCLOSURE ONLY; never enter line 9 arithmetic.

---

# 15) Implementation guardrails

- Do **not** assume every capital-asset sale requires **Form 8949**; aggregable boxes A/D/G/J can go directly to Schedule D.
- Do **not** use Exception 1 if there is **QOF** activity.
- Do **not** use Exception 1 if there are any **capital losses**.
- Do **not** use Exception 1 if any 1099-DIV has **box 2b / 2c / 2d** amounts.
- Do **not** ignore **Form 2439**, carryovers, or K-1 capital items when deciding whether Schedule D is required.
- Do **not** forget the **nominee** reduction and statement.
- Do **not** treat the line 7b child checkbox as a general child capital-loss pipeline; in this context it is driven by **Form 8814 line 10**.
- Do **not** map a Schedule D loss to line 7a without applying the **$3,000 / $1,500** limit through Schedule D line 21.
- Do **not** double-count the Form 8814 child amount: it flows through ONE path (Exception 1 direct OR Schedule D line 13), never both.
- Do **not** add `line7bChildAmountFromForm8814Line10` to line 9 — it is disclosure entry-space, the amount is already in line 7a.
- Do **not** read spouse-side capital data on MFS; the single orchestrator-level guard suppresses it.

---

# 16) 2025 key constants (reference)

| Constant | Value | Source |
|---|---|---|
| Capital loss cap — non-MFS | $3,000 | IRC §1211(b)(1) |
| Capital loss cap — MFS | $1,500 | IRC §1211(b)(2) |
| Form 8814 child gross-income ceiling | $13,500 | Form 8814 instructions |
| Form 8814 line 4 threshold (skip 5–12) | $2,700 | Form 8814 instructions |
| QDCG 0% threshold — Single | $48,350 | IRC §1(h) / 2025 indexed |
| QDCG 0% threshold — MFJ | $96,700 | IRC §1(h) / 2025 indexed |
| QDCG 20% threshold — Single | $533,400 | IRC §1(h) / 2025 indexed |
| QDCG 20% threshold — MFJ | $600,050 | IRC §1(h) / 2025 indexed |
| §121 home-sale exclusion — Single | $250,000 | IRC §121 (deferred) |
| §121 home-sale exclusion — MFJ | $500,000 | IRC §121 (deferred) |

Loss-cap thresholds hard-coded inline at `TaxReturnComputeService.java` ~line 6604; stable since 1976, NOT inflation-indexed.

---

# 17) Practical developer cheat sheet

- **Only box 2a capital gain distributions, no losses, no 2b/2c/2d, no QOF, no feeders** -> direct to **Form 1040 line 7a**, check **Schedule D not required**.
- **Child Form 8814 line 10 amount** -> add to **line 7a** if no Schedule D is required, otherwise include on **Schedule D line 13**; check child box on **line 7b**.
- **1099-B / 1099-DA with basis reported and no adjustments** -> may go directly to **Schedule D** without **Form 8949**.
- **QOF / adjustments / noncovered / special coding** -> generally **Form 8949** required.
- **Wash-sale disallowance** -> forces Form 8949 with adjustment code **W**.
- **Boxes 2b / 2c / 2d nonzero** -> **Schedule D required**.
- **Capital loss deduction** -> limited to **$3,000** (**$1,500** if MFS); excess carries forward.
- **MFS capital cap is half** — protect with the orchestrator MFS guard.
- **Form 8814 dual routing** — Exception 1 path: add to line 7a directly; Schedule D path: Schedule D line 13 then line 7a inherits.

---

# 18) Forms checklist

**Filed with the return** (when applicable):
- Form 1040 — line 7a / 7b
- Schedule D — when Exception 1 does not apply
- Form 8949 — for non-aggregable transactions, wash sales, QOF, etc.
- Form 8997 — QOF deferral (Phase 2)
- Form 8814 — child capital gain distributions (when elected)
- Form 2439 / 6252 / 4797 / 4684 / 6781 / 8824 — when entries exist (`RequiredAttachmentForm`)
- Schedule K-1 (1041 / 1065 / 1120-S) — when entries exist

**Computed and retained**:
- 28% Rate Gain Worksheet (Schedule D line 18 — DEFERRED auto-derivation);
- Unrecaptured §1250 Gain Worksheet (Schedule D line 19 — DEFERRED);
- Capital loss carryover worksheet (Phase 2: `computeCapitalLossCarryover`).

**Information returns** (inputs only):
- Form 1099-DIV / 1099-B / 1099-DA / 1099-S / 2439.

---

# 19) Current code citations (TaxReturnComputeService.java, 2026-06-14)

| Concern | Method / line |
|---|---|
| Orchestrator entry — `computeCapitalGainLoss` | 10923 |
| Call site (from main pipeline) | 523 |
| Per-person aggregator — `computeCapitalForPerson` | 11972 |
| Carryover worksheet — `computeCapitalLossCarryover` | 12857 |
| Capital loss cap hard-coded constants | ~6604 |
| Exception 1 8-condition AND gate | ~6610–6636 |
| Form 8814 dual-path routing breadcrumb | ~6700–6717 |
| Loss-cap breadcrumb (IRC §1211(b)) | ~6653–6671 |
| `CapitalGainLossComputation` record (line 7b derivation) | ~6811–6821 |
| Single-guard MFS cascade citation | ~6374–6396, 13348 |
| `buildIncome` Income setters for line 7a/7b | ~4324–4326 |

---

## Verification log

| Date | Walkthrough | Scope | Outcome |
|---|---|---|---|
| 2026-05-12 | 7a.xlsx Code Validation walkthrough | Line 7a verification (10 issues) | COMPLETE — 10/10 closed. MFS guard added to `computeCapitalGainLoss` (cascade extended to 12 orchestrators — codebase maximum); knowledge file renamed (first Legacy A underscore-prefix migration: `knowledge_7ab.md` → `line-7ab-capital-gain-loss.md`); Exception 1 8-condition AND gate verified (more conservative than spec's nominal 4-condition rule); $3,000 / $1,500 MFS loss cap (IRC §1211(b)) verified with three-protection chain + carryover; Form 8814 dual-path routing (Phase 1 fix) verified; Phase 2 history context preserved. Backend regression: 755 → 756 tests (+1 lock-in). |
| 2026-05-12 | 7b.xlsx Code Validation walkthrough | Line 7b verification (10 issues) | COMPLETE — 10/10 closed. MFS guard cascade extended to 2 audits at `computeCapitalGainLoss`; **NEW THIRD exclusion category (C) Double-count-prevention** documented at line-9 site (line 7b checkboxes in Boolean-type category; entry-space `line7bChildAmountFromForm8814Line10` in new category C since child amount already in line 7a); block-breadcrumb header for `CapitalGainLossComputation` record args 2/3/4 (`exception1 ? TRUE : FALSE`); all 3 PDF semantic mappings canonical (no parallel to 6c/6d bug). 7ab pair complete (smallest pair-aligned log in workflow at 2 rows). Backend regression: 756/756 pass. |
| 2026-06-14 | Specification re-author | Lines 7a + 7b | Re-authored against current code state (orchestrator at line 10923; per-person at 11972; carryover at 12857; adjustment constants at ~6604); preserved IRS prose and statutory citations (IRC §61(a)(3), §1211(b), §1212(b), §165(c), §166(d), §121, §1250, §1202, §1400Z-2); documented 8-condition Exception 1 AND gate (more conservative than spec's 4-condition rule); documented Form 8814 dual-path routing (Schedule D line 13 vs line 7a direct); documented line 7b disclosure-only entry-space (Double-count-prevention category); preserved QDCG reference thresholds ($48,350 / $96,700 / $533,400 / $600,050) for downstream line-16 use. |
