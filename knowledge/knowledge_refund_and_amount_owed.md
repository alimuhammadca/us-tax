# Knowledge: Unified Refund and Amount Owed Form — UI Audit (2025)

> Tax year 2025. Audit date: 2026-04-22.
> Tests confirmed passing: Angular build ✓; E2E compute tests pending user run.
> Sources: `ui.md` (R1–R44), `turbotax.md`, `form-refund-and-amount-owed.component.ts`,
> `refund-and-amount-owed-taxpayer.yaml`, `PersonalResource.java`, `TaxReturnComputeService.java`.

---

## 1. Form Identity

**Form ID**: `refund-and-amount-owed-taxpayer`

A unified Angular form consolidating four previously separate Applications forms into a single
Tax Return sidebar entry. Covers Form 1040 lines 34–38:

| Consolidated form | IRS lines | Purpose |
|---|---|---|
| `35-direct-deposit` | 35b/c/d | Bank routing + account for direct deposit |
| `refund-allocation-taxpayer` | Form 8888 | Split refund across 2–3 accounts |
| `36-apply-to-next-year` | 36 | Credit overpayment to 2026 estimated tax |
| `prior-year-tax-taxpayer` | 38 / Form 2210 | Prior-year data for underpayment penalty |

Taxpayer-only — no spouse variant (lines 34–38 are per-return, not per-person).

---

## 2. Backend Merge-with-Fallback

`TaxReturnComputeService.java` lines ~193–199:

```java
// Read unified form first; fall back to legacy form IDs for each field group
Map<String, Object> unifiedForm = getPersonalForm(uid, "refund-and-amount-owed-taxpayer");
Map<String, Object> directDepositForm = getPersonalForm(uid, "35-direct-deposit");
// ... merge logic: unified field takes precedence; legacy used if unified field absent
```

All field names are **identical** between unified and legacy documents — the backend reads the
same keys regardless of which Firestore document they come from.

Registered in `PersonalResource.java` PERSONAL_FORMS set: all 5 IDs accepted on
`PUT /api/personal/{formId}`.

---

## 3. UI Audit — Violations Found and Fixed

### 3a. HIGH — IRS line/form references in visible text (R33, R34)

**R34 — Section titles (3 in template + 3 in YAML):**

| Before | After |
|---|---|
| `Direct deposit (lines 35b–35d)` | `Direct deposit` |
| `Split refund — Form 8888` | `Split refund` |
| `Apply to 2026 estimated tax (line 36)` | `Apply to 2026 estimated tax` |

**R33 — Field labels (3 in template, 6 more in YAML-only):**

| Before | After |
|---|---|
| `Routing number (line 35b)` | `Routing number` |
| `Account type (line 35c)` | `Account type` |
| `Account number (line 35d)` | `Account number` |

YAML-only (template already clean): `amountToApply`, `priorYearAgi`, `priorYearTaxLiability`,
`overpaid`, `refundAmount`, `amountOwed`, `estimatedTaxPenalty` — all stripped of `(line N)` and
`(Form 1040 line N)` suffixes.

**Display banners (5 instances):** `"Your refund (line 34)"` → `"Refund summary"`;
`"Amount to be refunded (line 35a):"` → `"Amount to be refunded:"`; etc.

### 3b. MEDIUM — Currency mode, help icons, preambles, validation

**R8 — Currency mode (10 fields):**
All `p-inputNumber` elements changed from `mode="decimal"` to `mode="currency" currency="USD" locale="en-US"`.
Whole-dollar fields (Form 8888 amounts, prior-year AGI/tax) keep `[maxFractionDigits]="0"`.
Dollar-and-cents fields (amountToApply, payment1–4Amount) keep `[minFractionDigits]="2"`.

**R10 + R6 — Form 8888 help icons (12 fields):**
12 account sub-fields (4 per account × 3 accounts) had no help icons and 8 were missing YAML
helpText. All 12 now have:
- `<div class="label-row">` wrapper with `<i class="pi pi-info-circle help-icon">`
- `helpMap` entry in the component class
- `helpText` in the YAML spec

**R22 — Section preambles (2 sections):**
- `directDeposit`: "Direct deposit is the fastest way to receive your refund..."
- `splitRefund`: "Split your refund among two or three bank accounts..."

Both added as `<p class="section-instructions">` in template and `instructions:` array in YAML.
The `priorYearInfo` section already had a preamble — no change needed.

**R43 — Negative value rejection (10 fields):**
`[min]="0"` added to all 10 `p-inputNumber` elements.

### 3c. LOW — Labels, helpText, jargon

**R18 — Parenthetical format notes (9 fields in template, 13 in YAML):**
Stripped `(whole dollars)`, `(9 digits)`, `(up to 17 characters)` from Form 8888 field labels.
Kept `(optional)` on Account 3 fields (that's a visibility cue, not a format note).

**R2 — Filing-status-specific helpText (1 field):**
`priorYearAgi` helpText: `"$75,000 if married filing separately"` → `"the threshold depends on your filing status"`.
helpMap text: `"($75,000 MFS)"` → `"(lower for MFS filers)"`.

**R12 — Section title "Your" prefix (1 YAML section):**
`refundSummary` title: `"Your refund"` → `"Refund summary"`.

**TurboTax — Jargon in waiver label (1 field):**
`waivePartialPenalty` label: `"Request a partial waiver using the annualized income method?"` →
`"Did your income arrive unevenly during the year? (You can request a reduced penalty.)"`.

### 3d. DEFERRED — R38 (ChangeDetectionStrategy.OnPush)

No form component in the project uses OnPush. Adding it to one form would be inconsistent.
Deferred for project-wide adoption.

---

## 4. Component Structure

File: `C:\us-tax\us-tax-ui\src\app\forms\form-refund-and-amount-owed.component.ts`
Type: Standalone Angular component with inline template (~940 lines post-edit).

| Section | Template lines | Description |
|---|---|---|
| Refund banner | ~53–66 | Computed read-only; `*ngIf="overpaid != null"` |
| Amount owed banner | ~68–81 | Computed read-only; `*ngIf="amountOwed != null"` |
| Direct deposit | ~85–160 | Gate + 3 conditional fields; exclusive with split refund |
| Split refund | ~162–290 | Gate + 12 sub-fields in 3 account blocks |
| Apply to next year | ~292–345 | Gate + amountToApply with ceiling |
| Prior year info | ~347–580 | AGI/tax + waiver radios + estimated payments |
| Save button | ~582–586 | `[disabled]="saving || loading"` |

**Class properties:**
- `model: any` — flat object with all 24 fields, defaults to null
- `helpMap: Record<string, {title, text}>` — 33 entries (21 original + 12 new Form 8888)
- `overpaid`, `refundAmount`, `amountOwed`, `estimatedTaxPenalty` — computed getters from `TaxReturnService`
- `routingNumberInvalid` — ABA Mod-10 checksum validation
- `normalized()` — strips conditionally-hidden fields from save payload

---

## 5. YAML Spec

File: `C:\us-tax\yamls\refund-and-amount-owed-taxpayer.yaml`

| Section ID | Title | Fields | Instructions |
|---|---|---|---|
| `refundSummary` | Refund summary | 2 (computed, readOnly) | — |
| `directDeposit` | Direct deposit | 4 | ✓ (added in audit) |
| `splitRefund` | Split refund | 13 | ✓ (added in audit) |
| `applyToNextYear` | Apply to 2026 estimated tax | 2 | — |
| `balanceDue` | Balance due | 2 (computed, readOnly) | — |
| `priorYearInfo` | Prior year information (underpayment penalty) | 9+ | ✓ (pre-existing) |
| `computedOutputs` | — | 0 (readOnly, computed) | — |

---

## 6. E2E Tests

### Compute tests: `refund-and-amount-owed.spec.ts` (14 tests)

| # | Test name | Coverage |
|---|---|---|
| 1 | Unified form ID accepted by backend — HTTP 200 on PUT | Form registration |
| 2 | Direct deposit fields saved via unified form reflected in compute | Lines 35b/c/d |
| 3 | Apply-to-next-year reduces refundAmount | Line 36 |
| 4 | Apply-to-next-year capped at overpaid ceiling | Line 36 cap |
| 5 | Split refund (Form 8888) — two accounts | Form 8888 |
| 6 | Split refund suppresses single direct deposit | DD suppression |
| 7 | Underpayment penalty from prior-year data | Form 2210 |
| 8 | 110% safe harbor — no penalty when threshold met | Form 2210 safe harbor |
| 9 | waiveFullPenalty sets Form 2210 box A | Box A |
| 10 | waivePartialPenalty sets Form 2210 box B | Box B |
| 11 | jointSeparateMismatch sets Form 2210 box E | Box E |
| 12 | Fallback: legacy prior-year-tax-taxpayer | Backward compat |
| 13 | Fallback: legacy 35-direct-deposit | Backward compat |
| 14 | Sidebar entry appears in Tax Return section | UI navigation |

### UI verification tests: `refund-and-amount-owed-ui.spec.ts` (4 tests)

| # | Test name | Rules verified |
|---|---|---|
| 1 | Section titles do not contain IRS line numbers | R33, R34 |
| 2 | Section preamble exists for direct deposit | R22 |
| 3 | Help icons on Form 8888 account sub-fields | R10, R6 |
| 4 | Display banners do not contain IRS line numbers | R33 |

---

## 7. Gaps

| ID | Priority | Description | Status |
|---|---|---|---|
| UI-R38 | LOW | `ChangeDetectionStrategy.OnPush` not set | **DEFERRED** — no form in project uses OnPush; defer for project-wide adoption |
| G3 | LOW | $1 minimum refund rule not enforced | **OPEN** — carried from line 33 audit |
| UI-8888-PDF | LOW | Form 8888 PDF fill/export not implemented | **DEFERRED** — semantic assets published; no client fill code yet |
| UI-8888-IRA | LOW | Form 8888 IRA/HSA/Coverdell account types not in dropdown | **DEFERRED** — only Checking/Savings offered |
| F2210-AI | OOS | Form 2210 Schedule AI (annualized income computation) | **OUT OF SCOPE** |
| F2210-D | OOS | Form 2210 Box D (actual withholding dates) | **OUT OF SCOPE** |
| F2210-F | OOS | Form 2210-F (farmers/fishermen 66⅔% safe harbor) | **OUT OF SCOPE** |
