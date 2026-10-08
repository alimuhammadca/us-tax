# Cross-product patterns — TurboTax 2024 vs H&R Block 2025

Synthesis of the two live walk-throughs (same fictional MFJ household, 2026-10-08), the TurboTax static
extraction (5,503 screens from `fdiin.1pe`), and the earlier studies (`C:\us-tax\turbotax.md`,
`C:\us-tax\Maaz\screens.md`, `C:\us-tax\H&RBlock2025.md`). Screen references: **TT#NNN** =
`turbotax-2024/screens/NNN-*`, **HRB#NNN** = `hrblock-2025/screens/NNN-*`.

Outcome for the household: TurboTax (TY2024) federal refund $967; H&R Block (TY2025) federal refund
$1,951, IL refund $363. The two are not comparable as numbers (different tax years, OBBBA changes).

## 1. Side-by-side

| Dimension | TurboTax 2024 | H&R Block 2025 | Better | Our rule |
|---|---|---|---|---|
| Section entry | Hub per section: topic rows with Start/Update/amount/"Needs review", Visit All (TT#069, #137) | Checklist gateways chained with topics; no persistent hub (HRB#045→#093) | TT for orientation, HRB for scoping | **Checklist to scope, hub to navigate**: an up-front "what applies to you?" checklist per section *populates* a hub whose rows carry status and amounts. |
| Section index | Show Topic List modal tree with visited ticks (TT#103) | Sub-tab click → "Where Do You Want To Go?" index (HRB#247); Take Me To outline with ✓ and one node per record (HRB#243) | HRB | Sidebar = outline with per-topic status and per-record children. |
| Guided vs free | "Guide me / I'll explore" fork per section; guided path dumps you on the hub (TT#068, #137) | Guide Me / Quick Entry / Assistant per complex topic (HRB#008, #117) | HRB | Offer a fast path and a guided path **per topic**, not per section. Both use the same YAML gates. |
| Back | History-based (TT) | Topic-scoped — returns to the previous topic's intro (HRB#109) | TT | Back = browser history. |
| Running result | Meter recomputes **per keystroke**, shows garbage ($57,178 from a typo, TT#061) | Updates **on topic exit**, LATEST CHANGE ▲▼ $X card (HRB#056) | HRB | Recompute on save/compute only; show the delta of the last change. |
| Explaining the result | "You Entered / You're Allowed / Why the Difference? / Revisit" breakdown (TT#191); honest no-change note (TT#149) | **Refund Reveal** narrative timeline naming the user's own sources (HRB#135); 1040 waterfall Tax Summary (HRB#187) | Both | Build both: a waterfall summary page + an "explain my refund" narrative + per-item allowed-vs-entered. |
| Statement entry | Box-labelled; rare boxes hidden behind "My form has info in other boxes"; per-statement uncommon checklist (TT#050, #075) | All boxes on one long page (HRB#050, #065) | TT | Common boxes first, labelled disclosure for the rest; per-statement follow-up checklist. |
| Owner of a statement | "This W-2 belongs to…" | Includes **"Both"** for joint 1099/1098 (HRB#065) | HRB | Owner selector with Both where the form can be joint. |
| Import | Import offered first; manual visually secondary (TT#045, #046) | Import and manual equal-weight links (HRB#046) | — | Upload/extract first (our Azure pipeline), manual always one click away. |
| PII order | First name → last names → SSNs last, "why we ask" (TT#003, #035, #038) | Everything on one page up front (HRB#013) | TT | Name first, sensitive identifiers last, with reason text. |
| Answer wording | Full-sentence answers ("No, I lived in Illinois all year.") | Yes/No radios; first-person statements only in checklists | TT | Sentence answers for consequential questions. |
| Required fields | Accepts invalid SSN/EIN silently; catches at Smart Check (TT#040, #044) | Accepts **empty** required fields → "You's Residency" template bugs (HRB#014, #025) | Neither | Format errors inline at the field (keep the value); eligibility-driving answers required before leaving a topic; save still always succeeds. |
| Field errors | Inline but clears input and gives wrong reason (TT#018) | Modal `alert()` / OS message box (HRB#015, #053) | Neither | Inline, specific, value preserved, `aria-describedby`. |
| Cross-field checks | "Double-check" screens showing only the conflicting fields (TT#061) | Correction screen with the rule explained (HRB#070) | Both | Show only the conflicting fields + the rule in plain language. |
| Missing info | Resurfaces in Smart Check as form jargon (TT#194) | **Micro-interview**: one missing fact per screen, then a consistency screen (HRB#026–#032) | HRB | Recover missing facts by asking for them, not by raising errors. |
| Final review | Smart Check: one error per screen, only the offending field, live form snippet (TT#194–#199) | Accuracy Review: **two tiers** (must-fix red / verify orange), location, cell painted on the real form (HRB#178–#186) | Both | Two-tier review page (blocking flags vs advisories), each item = plain message + direct fix control + form-line preview. |
| Limits | — | Silent capping/rounding ($500 educator → $300, $1,232.50 → $1,233; HRB#051, #108) | — | Always say when an amount is limited or rounded ("We can use $300 of this"). |
| Records | Create on save | Phantom empty records on Add; delete without confirm/undo (HRB#082, #088) | TT | Create on save; delete with undo. |
| Form linking | Show Relevant Form drawer + full Forms mode (TT#041, #107) | SHOW FORM split pane + Forms Central (HRB#249, #241) | Both | "See this on Form 1040 line X" drawer from every screen (we have verified previews). |
| Help | Inline glossary links, Learn More, separate help window | Glossary links on option labels, **WHAT QUALIFIES?** (qualifies / doesn't), contextual personalised FAQ rail | HRB | Side-panel help: glossary terms, "What qualifies?", "What if…?" — never a separate window, always in the DOM. |
| Recommendations | "We've Chosen a Filing Status for You… ☐ Change" (TT#034) | "We recommend you file jointly" + radios on same screen (HRB#012) | Both | Recommendation + dollar reason + override on one screen. |
| Results | Celebration screens, some overclaiming ($31,200 "tax breaks", TT#065) | Result in the title ("Your mortgage interest deduction is $11,200.", HRB#123) | HRB | State results factually in the heading; no mixed-unit totals. |
| Carry-over | Personal Info drives later prompts (Teacher → educator, TT#171) | Read-only carry-over, "ask only for the remainder" (HRB#126); but no federal→state carry-over (HRB#210) | Both partly | Reuse every earlier answer; show carried values read-only with their source. |
| Upsell | Premier mid-IRA, Audit Defense with fear anchor (TT#159, #213) | Audit-support pitch inside the audit-risk outcome (HRB#229) | — | None in the task flow. |
| Visual | Fixed ~770–950 px column, left-aligned; two visual systems interleaved; cyan buttons fail contrast | Fixed 745 px pane + 236 px rail; GIF buttons; 10 px orange help links | Neither | Responsive tokens (UI-PRINCIPLES A4–A6). |
| Accessibility | Unnamed controls, .NET type names as labels, focus not on first field, Enter ≠ Continue | Duplicate "Next" alt text, unlabeled grids, critical context drawn natively | Neither | WCAG 2.2 AA (A6); focus first field/heading; Enter submits. |

## 2. Shared skeleton (both products converge on this)

1. **Tabs → sections → topics → screens**, with a running refund indicator always visible.
2. Each topic: *screen question → (import | entry) → per-item follow-ups → list summary → outcome*.
3. Each section closes on a **summary**; the return closes on a **final review** and a **tax summary**.
4. **Recommendations with override**, **results in plain words**, **help one click from every term**.
5. The interview is a layer over a **forms engine**, and both expose the form on demand.

## 3. Adopted rules (delta to `us-tax-ui/UI-PRINCIPLES.md` §A9)

1. Checklist scopes the section; hub (with status + amounts) is its home; sidebar outline shows per-record nodes.
2. Result indicator updates after save/compute (never per keystroke) and shows the delta of the last change
   with a "why?" link to an explain-my-refund narrative.
3. Three explanation surfaces: waterfall Tax Summary, Refund narrative (sources named), Entered vs Allowed.
4. Validation ladder: inline format → required-before-leaving-topic for eligibility answers → cross-field
   correction screen (only conflicting fields) → two-tier final review (blocking / advisory) with direct fix.
   Saves never blocked.
5. Missing facts recovered by micro-interview, not error lists.
6. Never compute a "good news" outcome from missing data; never cap or round silently.
7. Records are created on save; deletes are undoable.
8. Name first, identifiers last, with "why we ask".
9. Sentence-style answers for consequential questions; personalised titles only when the value exists
   (fallback copy otherwise — no "You's Residency").
10. Help lives in a side panel in the DOM: glossary terms, What qualifies / doesn't, What if…, personalised FAQs.
11. Owner selector includes "Both" for joint-capable statements.
12. No upsell, retention loops, labour-illusion progress bars, or mixed-unit totals.
