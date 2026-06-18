---
name: Tax Return Section — Form List and UI Components
description: All IRS forms that can appear in the Tax Return sidebar section, with their Angular component file and any input parameters
type: reference
---

# Tax Return Section — Form List and UI Components

All forms listed here appear conditionally in the Tax Return sidebar section based on the computed return output, except Form 1040 which is always present.

Component files are under `C:\us-tax\us-tax-ui\src\app\forms\`.

Seven forms use the generic `form-tax-return-required-attachment.component.ts` stub (shows only Name, SSN, Required flag, Reason, Related Schedule 1 amount — not a full form display).

---

## Always Present

| Sidebar Label | Component File |
|---|---|
| Form 1040 | `form-tax-return-1040.component.ts` |

---

## Conditional — Full Dedicated Components

| Sidebar Label | Component File | Notes |
|---|---|---|
| Schedule 1 | `form-tax-return-schedule1.component.ts` | |
| Schedule 2 | `form-tax-return-schedule2.component.ts` | |
| Schedule 3 | `form-tax-return-schedule3.component.ts` | |
| Schedule A | `form-tax-return-schedulea.component.ts` | |
| Schedule B | `form-tax-return-scheduleb.component.ts` | |
| Schedule D | `form-tax-return-scheduled.component.ts` | |
| Schedule R | `form-tax-return-schedule-r.component.ts` | |
| Schedule 8812 | `form-tax-return-schedule8812.component.ts` | |
| Schedule A (Form 8911) | `form-tax-return-8911sa.component.ts` | |
| Schedule A (Form 8936) | `form-tax-return-8936sa.component.ts` | |
| Form 2210 | `form-tax-return-2210.component.ts` | |
| Form 2441 | `form-tax-return-2441.component.ts` | |
| Form 2555 (You) | `form-tax-return-2555.component.ts` | `[owner]="taxpayer"` |
| Form 2555 (Spouse) | `form-tax-return-2555.component.ts` | `[owner]="spouse"` |
| Form 4137 (You) | `form-tax-return-4137-taxpayer.component.ts` | |
| Form 4137 (Spouse) | `form-tax-return-4137-spouse.component.ts` | |
| Form 4852 (You) | `form-tax-return-4852.component.ts` | `[owner]="taxpayer"` |
| Form 4852 (Spouse) | `form-tax-return-4852.component.ts` | `[owner]="spouse"` |
| Form 4868 | `form-tax-return-4868.component.ts` | |
| Form 4972 (You) | `form-tax-return-4972.component.ts` | `[owner]="taxpayer"` |
| Form 4972 (Spouse) | `form-tax-return-4972.component.ts` | `[owner]="spouse"` |
| Form 5329 | `form-tax-return-5329.component.ts` | |
| Form 5695 | `form-tax-return-5695.component.ts` | |
| Form 6251 | `form-tax-return-6251.component.ts` | |
| Form 8396 | `form-tax-return-8396.component.ts` | |
| Form 8606 (You) | `form-tax-return-8606.component.ts` | `[owner]="taxpayer"` |
| Form 8606 (Spouse) | `form-tax-return-8606.component.ts` | `[owner]="spouse"` |
| Form 8801 | `form-tax-return-8801.component.ts` | |
| Form 8814 | `form-tax-return-8814.component.ts` | |
| Form 8834 | `form-tax-return-8834.component.ts` | |
| Form 8839 | `form-tax-return-8839.component.ts` | |
| Form 8859 | `form-tax-return-8859.component.ts` | |
| Form 8862 | `form-tax-return-8862.component.ts` | |
| Form 8863 | `form-tax-return-8863.component.ts` | |
| Form 8880 | `form-tax-return-8880.component.ts` | |
| Form 8888 | `form-tax-return-8888.component.ts` | |
| Form 8911 | `form-tax-return-8911.component.ts` | |
| Form 8912 | `form-tax-return-8912.component.ts` | |
| Form 8919 (You) | `form-tax-return-8919-taxpayer.component.ts` | |
| Form 8919 (Spouse) | `form-tax-return-8919-spouse.component.ts` | |
| Form 8949 | `form-tax-return-8949.component.ts` | |
| Form 8959 | `form-tax-return-8959.component.ts` | |
| Form 8962 | `form-tax-return-8962.component.ts` | |
| Form 1116 (per category) | `form-tax-return-1116.component.ts` | `[index]="0..3"`; up to 7 instances (Passive, General, GILTI, Foreign Branch, Treaty, Lump-sum, 901(j)) |

---

## Conditional — Stub (form-tax-return-required-attachment.component.ts)

These render a minimal placeholder — not a full form display.

| Sidebar Label | `formKey` input | `title` input |
|---|---|---|
| Form 2106 | `form2106` | Form 2106 |
| Form 3903 | `form3903` | Form 3903 |
| Form 4684 | `form4684` | Form 4684 |
| Form 4797 | `form4797` | Form 4797 |
| Schedule E | `scheduleE` | Schedule E |
| Form 8853 | `form8853` | Form 8853 |
| Form 8889 | `form8889` | Form 8889 |
