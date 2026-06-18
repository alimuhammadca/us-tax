# Cleanup Tasks

This file tracks deferred cleanup work — dead code, obsolete fields, and structural simplifications that are safe to remove but not urgent.

---

## W-2 Component Dead Code (`form-w-2.component.ts`)

The W-2 form view is permanently in PDF overlay mode (`private _pdfView = true`; toggle hidden with `*ngIf="false"`). The traditional form view block is entirely dead.

### Tasks

1. **Remove dead model fields** from `W2Model` interface and defaults:
   - `hasUncommonW2Situations` — never read by backend or rendered in PDF view
   - `includesInmateWages` — backend no longer reads this from W-2 entries (moved to employment income forms)
   - `inmateWagesAmount` — same as above

2. **Remove the `*ngIf="!pdfView"` template block** — the entire traditional form layout (~400 lines) that includes employee/employer info inputs and all box input fields. It never renders and never will.

3. **Remove the `_pdfView` getter/setter and the hidden toggle button** — `_pdfView` is hardcoded `true`; the toggle button is hidden with `*ngIf="false"`. Both are unnecessary scaffolding.

### What to keep
- `statutoryEmployee`, `retirementPlan`, `thirdPartySickPay` — still active via `syncPdfToForm`/`syncFormToPdf` in the PDF view path.
- All box fields (box 1, 2, 3, etc.) — handled by the PDF overlay.

### Why deferred
No functional impact. Inmate wages already moved to employment income forms (taxpayer/spouse). Cleanup is cosmetic.
