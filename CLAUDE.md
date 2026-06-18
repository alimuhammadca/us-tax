# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Layout

| Directory | Purpose |
|---|---|
| `C:\us-tax\us-tax-be` | Quarkus 3.30.6 backend (Java 17, Maven) |
| `C:\us-tax\us-tax-ui` | Angular 21 + PrimeNG frontend |
| `C:\us-tax\yamls\` | Shared YAML intake specs (line-prefixed, per-person, kebab-case) |
| `C:\us-tax\lines\` | **Authoritative** line specification docs — consult before implementing any line |
| `C:\us-tax\docs\IRS-Forms\` | IRS source PDFs |
| `C:\us-tax\pdfs\` | Generated semantic PDF+CSV label assets (used by PDF export) |
| `C:\us-tax\diagrams\` | Data-flow diagrams (.drawio, one per line) |
| `C:\us-tax\history.md` | Timestamped change log |
| `C:\us-tax\rules.md` | Implementation rules and guardrails |
| `C:\us-tax\outstanding.md` | Deferred/pending work items |

Tax year: **2025**.

---

## Three-Layer Source-of-Truth System

Before implementing any Form 1040 line or supporting form, consult all three layers in order:

| Layer | Location | What it contains |
|---|---|---|
| **IRS source PDFs** | `C:\us-tax\docs\IRS-Forms\` | Authoritative 2025 IRS forms and instructions (original PDF files) |
| **Semantic label assets** | `C:\us-tax\pdfs\` | Generated `*_semantic_labels.pdf` + `*_field_map_semantic.csv` pairs used for client-side PDF export. The CSV lists every fillable field with its semantic name and page/rect coordinates. Read the CSV to learn exact field names and form structure before implementation. |
| **Line spec docs** | `C:\us-tax\lines\` | Developer-ready rule maps (see below). These are the primary specification for each implemented line. |

## Line Specifications (`C:\us-tax\lines\`)

Always read the relevant `C:\us-tax\lines\<line>.md` file before implementing or modifying a line. These are **2025 IRS-aligned, developer-ready rule maps**. Each spec follows a consistent structure:

1. **Line identity** — the exact Form 1040 label and sub-items (checkboxes, write-in spaces)
2. **Formula** — the mathematical definition (`line_n = f(...)`) with all inputs named
3. **Input mapping table** — every input field, its source form/line, and how it enters the computation
4. **Decision tree / routing** — conditional paths (e.g., Tax Table vs. Computation Worksheet; which sub-form applies)
5. **Worksheet / sub-form computations** — line-by-line calculations for each path, with 2025 constants
6. **Compute order** — explicit step ordering, upstream dependencies, downstream consumers
7. **Outputs / forms produced** — which forms/schedules are conditionally generated
8. **Validations** — floor/ceiling rules, gating conditions, cross-field constraints
9. **Out of scope** — explicit exclusions (e.g., self-employment paths) with rationale
10. **Forms checklist** — filed-with-return vs. computed-and-retained distinction

Available specs: `1b`, `1c`, `1d`, `1e`, `1f`, `1g`, `1h`, `1i`, `2ab`, `3abc`, `4abc`, `4952`, `4972`, `5abc`, `6abcd`, `7ab`, `8`, `8615`, `8621`, `8814`, `8863`, `8978`, `9`, `10`, `11ab`, `12abcde`, `13ab`, `14`, `15`, `16`, `17`, `2555`, `section962`, `section965`.

---

## Backend (us-tax-be)

### Build & Run

```bash
# Dev mode (live reload) — requires GOOGLE_APPLICATION_CREDENTIALS
./mvnw quarkus:dev
# Or use the PowerShell helper which sets credentials automatically:
.\run-dev.ps1
```

Backend listens on `http://localhost:8080`. `GOOGLE_APPLICATION_CREDENTIALS` must point to a Firebase service-account JSON.

```bash
# Build runnable JAR
./mvnw package
java -jar target/quarkus-app/quarkus-run.jar
```

### Java Unit Tests

```bash
# All tests
./mvnw test

# Single class
./mvnw test -Dtest=TaxReturnComputeServiceTest

# Multiple classes
./mvnw test -Dtest=TaxReturnComputeServiceTest,PersonalResourceTest
```

Key test classes (`src/test/java/com/ustax/microservices/`):
- `TaxReturnComputeServiceTest` — ~500 cases covering all Form 1040 line computations
- `PersonalResourceTest` — personal form endpoint validation
- `TaxLine15TaxableIncomeTest` — lines 14–15 (deductions, taxable income)
- `Line10IncomeAdjustmentsApiTest` — income adjustments workflow

### E2E Tests (Playwright)

```bash
cd e2e
npm install && npx playwright install

# Set credentials
export E2E_SHARED_AUTH_EMAIL="testuser@example.com"
export E2E_SHARED_AUTH_PASSWORD="password"

# Single spec (preferred)
npx playwright test --workers=1 --output=test-results-latest line1z-total-wages.spec.ts

# Full regression
npm run test:regression -- --workers=1

# Smoke subset
npm run test:smoke
```

**Critical rules:**
- Always `--workers=1` — tests share one Firebase account and are not parallel-safe.
- Never run inside the Claude Code sandbox — Playwright worker spawn fails with `EPERM`.
- Use a fresh `--output` directory on every run.

### Core Architecture

**Compute flow:**

1. Frontend saves personal forms and statement entries (W-2, 1099-*, etc.) via REST API.
2. `POST /api/tax-return/compute` triggers `TaxReturnComputeService`, which aggregates statement data, reads personal forms, computes Form 1040 lines 1a–15, emits blocking `TaxReturnFlag` values for missing data, and assembles conditional schedules/forms.
3. Output persists to Firestore; retrieved via `GET /api/tax-return`.

**Key classes (`src/main/java/com/ustax/`):**

| Class | Role |
|---|---|
| `TaxReturnComputeService` | All Form 1040 line computation (~500 KB) |
| `TaxReturnComputation` | Output data model assembly |
| `PersonalResource` | `/api/personal` — per-person form save/load |
| `StatementFormCatalog` | Statement type catalog (W-2, 1099-INT, 1099-R, etc.) |
| `ReferenceData` | Tax-year constants (standard deductions, QBI thresholds, SALT caps) |
| `TaxReturnFlag` | Blocking flags emitted during compute |

**Key API endpoints:**

```
PUT    /api/personal/{formId}           Save personal form
POST   /api/statements/{formId}         Create statement entry
POST   /api/tax-return/compute          Compute Form 1040
GET    /api/tax-return                  Fetch computed return
GET    /api/reference-data              Tax-year constants for UI (thresholds, limits)
DELETE /api/user-data/reset             Clear all user data (test use)
```

**Output model** (`model/output/`): Each class maps to a specific form/schedule — `Form1040`, `Deductions`, `Schedule1AdditionalIncome`, `ScheduleD`, `Form8949`, `Form4972`, `Form8814`, `Form2555`, etc.

**Firestore layout**: Statement entries stored in per-form subcollections — `users/{uid}/{formId}` (e.g. `users/{uid}/w-2`). Statement queries are sorted in-memory; no composite Firestore indexes required. Dependent-scoped personal forms (e.g. child capital-gain/loss, kiddie income) are stored under the dependent's uid scope and cleaned up on dependent deletion.

**Backend YAML** (`us-tax-be/yaml/`): Output schema YAML files (`1040.yaml`, `schedule-1.yaml`, etc.) — these are output contract definitions, distinct from the shared intake YAMLs in `C:\us-tax\yamls\`.

### Implemented Form 1040 Lines (2025)

- **1a–1z** — Wages (W-2, household, tips, Medicaid waiver, dependent care, adoption, Form 8919, other earned, combat pay)
- **2a/2b** — Interest (Schedule B if >$1,500; box 9 → Form 6251 AMT)
- **3a/3b** — Dividends (Schedule B if >$1,500 or nominee)
- **4a/4b/4c** — IRA (Form 8606 conditional; QCD and HFD exceptions)
- **5a/5b/5c** — Pension/annuity (Form 4972, 5329 conditional; PSO election)
- **6a–6d** — Social security benefits (SSA-1099/RRB-1099; lump-sum election)
- **7a/7b** — Capital gains/losses (Schedule D, Form 8949, Form 8814 child inclusion)
- **8** — Other income (Schedule 1 Part I, lines 1–7 + 8a–8z)
- **9** — Total income: `1z + 2b + 3b + 4b + 5b + 6b + 7a + 8`
- **10** — Adjustments (Schedule 1 Part II lines 11–26; SE lines 15–17 out of scope)
- **11a/11b** — AGI: `line9 - line10`
- **12a–12e** — Standard deduction (Schedule A for itemized; dependent worksheet; age/blind chart)
- **13a** — QBI deduction (Form 8995 below threshold; Form 8995-A above; K-1 199A supported)
- **13b** — Additional deductions (Schedule 1-A: tips, overtime, car loan interest, enhanced senior)
- **14–15** — `line14 = line12e + line13a + line13b`; `line15 = max(0, line11b - line14)`

### Line 16 (Next Implementation)

Line 16 = `regular_tax + Form8814.tax + Form4972.tax + section962_tax + ECR + Form8621.line16e + Form8978.line14 + section965i_tax`

**regular_tax decision tree** (first matching condition wins):
1. Form 2555 filer → Foreign Earned Income Tax Worksheet
2. Form 8615 applies (kiddie tax) → Form 8615
3. Schedule D has qualified dividends/capital gains → Schedule D Tax Worksheet
4. Qualified dividends/capital gains present → QDCG Worksheet
5. Taxable income < $100,000 → Tax Table
6. Taxable income ≥ $100,000 → Tax Computation Worksheet

**2025 Tax Computation Worksheet brackets:**

| Filing Status | Bracket 1 | Bracket 2 | Bracket 3 | Bracket 4 | Bracket 5 |
|---|---|---|---|---|---|
| Single | 10%/12%/22% table | 24% over $103,350 | 32% over $197,300 | 35% over $250,525 | 37% over $626,350 |
| MFJ/QSS | 24% over $206,700 | 32% over $394,600 | 35% over $501,050 | 37% over $751,600 | — |
| MFS | 24% over $103,350 | 32% over $197,300 | 35% over $250,525 | 37% over $375,800 | — |
| HOH | 24% over $103,350 | 32% over $197,300 | 35% over $250,500 | 37% over $626,350 | — |

**Box 3 write-ins**: `962` (Section 962 CFC), `ECR` (excess capital reconversion), `1291TAX` (Form 8621 PFIC), `Form 8978` (BBA partnership pushout), `965INC` (Section 965(i) triggered deferred tax).

**QDCG 0% thresholds**: Single $48,350 / MFJ $96,700. **20% thresholds**: Single $533,400 / MFJ $600,050.

### Intake-Only Forms (Compute Deferred — see outstanding.md)

| Form | Multiplicity | Purpose |
|---|---|---|
| Form 8863 | One per return; one Part III per student | Education credits (AOTC $2,500/student refundable → line 29; LLC nonrefundable → Sched 3 line 3); MAGI limit $90k/$180k MFJ |
| Form 8615 | One per child return | Kiddie tax; unearned income >$2,700; line 18 → child's line 16 |
| Form 2555 | One per claiming spouse (max 2) | Foreign earned income; feeds Foreign Earned Income Tax Worksheet → Line 16 |
| Form 4952 | One per return (MFJ combined) | Investment interest expense; AMT requires second computational copy |

### Form Multiplicity Rules

| Form | Cardinality |
|---|---|
| Form 4972 | One per participant (born before Jan 2, 1936); not for IRAs/403(b)s |
| Form 8621 | One per PFIC; MFJ may file one for jointly-owned PFIC; line 16e → line 16 box 3 "1291TAX" |
| Form 8978 | One per BBA partnership source type; positive line 14 → line 16 box 3; negative → Sched 3 line 6l |
| Form 8814 | One per child; child gross income must be <$13,500; line 4 ≤$2,700 skips lines 5–12 |
| Form 8606 | One per person per tax year (MFJ aggregates both spouses) |

### Out of Scope

- Self-employment (Schedule C / SE / F)
- Form 8959 Additional Medicare Tax
- Form 8839 Part II credit (MAGI required)

---

## Frontend (us-tax-ui)

Angular 21 + PrimeNG SPA. Run in dev mode:

```bash
cd C:\us-tax\us-tax-ui
npm start -- --proxy-config proxy.conf.json   # Proxies /api to localhost:8080
```

Build check: `npm run build`

### Key Structure

| Path | Purpose |
|---|---|
| `src/app/shell/shell.component.ts` | App shell: sidebar navigation, person tabs (Family Head / Spouse / Dependents), form routing |
| `src/app/forms/` | Standalone Angular components — one per intake form or tax-return view |
| `src/app/service/` | Services: `TaxReturnService`, `StatementEntryStateService`, `PersonalDataService`, `ReferenceDataService`, `InactivityService` |
| `src/app/auth/` | Firebase auth UI (email link, sign-in/sign-up, route guards) |
| `src/app/components/` | Shared layout, help modal, statement entry toolbar, topbar compute button |
| `src/app/directives/` | Reusable directives: section-clear (with confirmation), statement form binding |
| `src/app/utils/` | `confirmDataLoss`, `resetObjectFields` helpers used by clear/delete flows |
| `public/irs/` | IRS form PDF templates + semantic CSV field maps served as static assets for client-side export |
| `YAML/` | YAML form definitions (documentation/reference) |

### Sidebar Sections

The sidebar sections rendered per person tab are: **Statements → Incomes → Deductions → Personal → Tax Return**. Sidebar links carry `data-form-id` attributes for stable Playwright selection. Items are filtered by the active person tab (taxpayer/spouse/dependent). Dependent tabs show Capital gain/loss and Kiddie income in the Incomes section; dependent Tax Return is empty until child-return compute exists.

### PDF Export

Forms are exported client-side via `pdf-lib`, using IRS PDF templates from `public/irs/` and semantic CSV field maps (generated by scripts in `C:\us-tax\us-tax-be\scripts\`) for accurate field placement.

### Other Behaviors

- **Global loading overlay** (HTTP interceptor): "Loading data..." on GET, "Saving data..." on mutations.
- **Inactivity logout**: auto sign-out after 5 minutes.
- **Reference data**: `ReferenceDataService` fetches tax-year constants from `GET /api/reference-data` (avoids hardcoding thresholds in UI).
- **Statement gating**: forms count only entries with meaningful saved data; blank placeholder entries do not satisfy upload gates.
- Imported statement fields remain user-editable (users may not have uploaded statements).

---

## YAML Conventions

Files live in `C:\us-tax\yamls\` with line-number prefix and person suffix (e.g., `13b-additional-deductions-taxpayer.yaml`).

**Section structure pattern** (in order):
1. `screening` — eligibility/gating questions
2. `statementUploadCheck` — check whether statements were uploaded
3. Named input sections (one or more, may have `multiplicity: single|multiple` and `showIf` conditionals)
4. `importedStatementFields` — `readOnly: true`; backend-only fields populated from statements (not rendered by UI)
5. `computedOutputs` — `readOnly: true` + `computed: true`; backend-only computed results (not rendered by UI)

Additional conventions:
- Taxpayer form owns all return-level gating questions; spouse form has spouse-only supplemental inputs.
- `multiplicity: multiple` marks repeatable sections (e.g., per-vehicle, per-employer, per-transaction).
- `showIf` provides conditional rendering based on field values.
- Self-employment paths use explicit out-of-scope blockers.

---

## Semantic PDF Assets (`C:\us-tax\pdfs\`)

Generated semantic PDF + CSV field-map pairs for client-side PDF export. Each form has `*_semantic_labels.pdf` and `*_field_map_semantic.csv`. Generated by scripts in `us-tax-be/scripts/`; published to `us-tax-ui/public/irs/`.

Coverage includes: `f1040`, `f1040s1`, `f1040s1a`, `f1040s2`, `f1040s3`, `f1040sd`, `f1099da`, `f1099div`, `f1099int`, `f1099k`, `f1099msc`, `f1099nec`, `f1099oid`, `f1099r`, `f2106`, `f2441`, `f2555`, `f3903`, `f4137`, `f4563`, `f4684`, `f4797`, `f4952`, `f4972`, `f5329`, `f6251`, `f6252`, `f6781`, `f8606`, `f8615`, `f8621`, `f8624`, `f8839`, `f8853`, `f8863`, `f8889`, `f8919`, `f8949`, `f8978`, `f8995`, `f8995a`, `schedule_e`, `schedule_k1_form_1041/1065/1120s`, `scheduleb`.

---

## Key 2025 Tax Constants

| Constant | Value |
|---|---|
| Standard deduction — Single/MFS | $15,750 |
| Standard deduction — MFJ/QSS | $31,500 |
| Standard deduction — HOH | $23,625 |
| QBI threshold — MFJ | $394,600 |
| QBI threshold — others | $197,300 |
| SS base amount — MFJ | $32,000 |
| SS base amount — Single/HOH/QSS/MFS-apart | $25,000 |
| QDCG 0% rate — Single | $48,350 |
| QDCG 0% rate — MFJ | $96,700 |
| QDCG 20% rate — Single | $533,400 |
| QDCG 20% rate — MFJ | $600,050 |
| Kiddie tax unearned income threshold | $2,700 |
| Form 8863 MAGI phaseout — Single | $80,000–$90,000 |
| Form 8863 MAGI phaseout — MFJ | $160,000–$180,000 |
| Schedule 1-A tips cap | $25,000; phaseout $150k/$300k MFJ at $100/per $1k |
| Schedule 1-A overtime cap | $12,500/$25,000 MFJ; same phaseout |
| Schedule 1-A car loan interest cap | $10,000; phaseout $100k/$200k MFJ at $200/per $1k (ceiling) |
| Schedule 1-A enhanced senior | $6,000/person; 6% of MAGI above $75k/$150k MFJ |

---

## Documentation Hygiene

After significant changes, always update:
1. `C:\us-tax\history.md`
2. `C:\us-tax\rules.md`
3. Active workspace `context.md` (e.g., `C:\us-tax\us-tax-be\context.md`)
