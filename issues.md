# Issues

Identified design and implementation issues, with status and resolution notes.

---

## Issue 1 — Form 4852 (Substitute W-2) is undiscoverable

**Status:** Resolved (2026-04-09)

### Problem
Form 4852 lives in the **Applications** sidebar section and its screening question is:
*"Do you need to attach Form 4852 for yourself?"*
A naive user who did not receive a W-2 from their employer has no idea what Form 4852 is and will never navigate to it independently. The employment income form asks "Did you upload/submit your W-2 form(s)?" but when the user answers No, nothing happens — no guidance, no link, no explanation.

### Root cause
The form was designed from the tax-form perspective (Form 4852 exists → give it an entry in the sidebar) rather than from the user-journey perspective (user says "I didn't get a W-2" → guide them to the solution).

### Resolution
Added a plain-language guidance banner to the employment income form (taxpayer and spouse tabs) that appears when `submittedW2 === false`:
> *"If your employer has not sent your W-2, you may need to file a Substitute W-2 (Form 4852) using your last pay stub. Complete Form 4852 under the **Applications** section in the sidebar."*

YAML `statementUploadCheck` section updated with matching `instructions` for backend reference.

New UI rule added: **Rule 32** — Guide users proactively to forms they may not know exist.

---

## Issue 2 — `reportedOnForm8919` question asks users to cross-reference two tax forms simultaneously

**Status:** Resolved (2026-04-09)

### Problem
Each row in the "Household employers" list had a question:
*"Are these wages also reported on Form 8919 (line 1g)?"*

Two defects:
1. **"line 1g" does not exist on Form 8919.** Form 8919 lines are 1–5 (firm rows) and 6–13 (computation). The "(line 1g)" reference was to **Form 1040 line 1g** — a reference a naive user cannot decode.
2. **The paths are mutually exclusive by design.** Line 1b (household employee wages without W-2) and Form 8919 / line 1g (misclassified employee wages) represent different real-world situations. A household nanny or caregiver does not simultaneously have a Form 8919 misclassification dispute with the same employer. Asking the user to resolve the overlap is wrong; the form design should prevent the overlap.

### Root cause
The collision guard was added defensively to prevent double-counting, but the defense was placed in the wrong layer (interview question instead of form design boundary).

### Resolution
- Removed `reportedOnForm8919` field from both employment income YAMLs and Angular components.
- Removed the backend collision guard in `computeLine1b()` (no longer needed — the two paths are entered via separate forms).
- Removed two unit tests and one E2E test that covered the now-deleted behavior.

New UI rule added: **Rule 33** — Never ask the user to cross-reference another tax form by name or line number; enforce mutual exclusion through form design.

---

## Issue 3 — Inmate wages question uses IRS routing language instead of situational language

**Status:** Resolved (2026-04-09)

### Problem
The W-2 form's "Uncommon W-2 situations" section asked:
*"Does any part of Box 1 represent wages earned while incarcerated in a penal institution?"*

A naive user who worked in a prison work program does not think of their situation in terms of IRS routing rules ("Box 1 amounts from a penal institution flow to Schedule 1 line 8u"). They know whether their employer was a prison or jail. The current question forces the user to translate tax law into their own situation instead of the other way around.

### Root cause
Question was written from the IRS instructions perspective rather than the taxpayer perspective. This violates the principle that interview questions should require no prior tax knowledge.

### Resolution
Changed the `includesInmateWages` question label from:
> *"Does any part of Box 1 represent wages earned while incarcerated in a penal institution?"*

to:
> *"Was this employer a prison, jail, or correctional facility?"*

Updated help text to explain the IRS routing rule as a consequence, not as the question premise.

New UI rule added: **Rule 34** — Frame questions around the user's real-world situation, not tax form mechanics.
