# D-k1-1065-1 — correct slot → box map (from f1065sk1.pdf field rects + printed box label positions, 2026-10-26)

Column 2 (code x310-331, amount x331-446). Box labels: 10 @y352, 11 @y328, 12 @y280, 13 @y256, 22 @y183.
| slot | rect y | box/row | current (wrong) key |
|---|---|---|---|
| f1_49 | 336-350 | 10 amount | part3Line10NetSection1231GainLoss (ok) |
| f1_50 / f1_51 | 312-326 | 11 row 1 code / amount | part3Line11Code / part3Line11Amount (ok) |
| f1_52 / f1_53 | 288-312 | 11 row 2 code / amount | part3Line12Code / part3Line12Section179DeductionAmount (WRONG) |
| f1_54 | 264-278 | 12 amount (section 179) | part3Line13Row1Amount (WRONG) |
| Line13 / f1_55 | 240-254 | 13 row 1 code / amount | part3Line13Row2Code / part3Line13Row2Amount (WRONG) |
| f1_56 / f1_57 | 216-240 | 13 row 2 | part3Line13Row3 (WRONG) |
| f1_58 / f1_59 | 192-216 | 13 row 3 | part3Line13Row4 (WRONG) |

Column 3 (code x446-468, amount x468-574). Labels: 14 @y712, 15 @y664, 16 @y616, 17 @y592, 18 @y520, 19 @y436, 20 @y388, 21 @y280.
| slot | rect y | box/row | current key |
|---|---|---|---|
| Line14 / f1_60 | 696-710 | 14 row 1 | part3Line14Code / part3Line14SelfEmploymentEarningsLossAmount (ok) |
| f1_61 / f1_62 | 672-696 | 14 row 2 | part3Line15Row1Code / Amount (WRONG) |
| Line15 / f1_63 | 648-662 | 15 row 1 | part3Line15Row2Code / Row2Amount (WRONG) |
| f1_64 / f1_65 | 624-648 | 15 row 2 | part3Line15Row3 (WRONG) |
| c1_12 | 604-612 | 16 K-3 attached | ok |
| Line17 / f1_79 | 576-590 | 17 row 1 | part3Line17Code / AmtItemsAmount (ok) |
| f1_80 / f1_81 | 552-576 | 17 row 2 | part3Line18Row1 (WRONG) |
| f1_82 / f1_83 | 528-552 | 17 row 3 | part3Line18Row2 (WRONG) |
| Line18 / f1_84 | 492-504 | 18 row 1 | part3Line18Row3Code / Row3Amount (WRONG) |
| f1_85 / f1_86 | 468-492 | 18 row 2 | part3Line19Row1 (WRONG) |
| f1_87 / f1_88 | 444-468 | 18 row 3 | part3Line19Row2 (WRONG) |
| Line19 / f1_89 | 420-434 | 19 row 1 | part3Line19Row3 (WRONG) |
| f1_90 / f1_91 | 396-420 | 19 row 2 | part3Line20Row1 (WRONG) |
| Line20 / f1_92 | 360-386 | 20 row 1 | part3Line20Row2 (WRONG) |
| f1_93 / f1_94 | 336-360 | 20 row 2 | part3Line20Row3 (WRONG) |
| f1_95 / f1_96 | 312-336 | 20 row 3 | part3Line20Row4 (WRONG) |
| f1_97 / f1_98 | 288-312 | 20 row 4 | part3Line21Row1 (WRONG) |
| f1_66 | 264-278 | 21 amount | part3Line21Row2Amount (WRONG) |

Missing backend keys: box 11 row 2, box 14 row 2, box 17 rows 2-3 (new columns = filling existing printed boxes, a defect fix).
Box 15 / 18 / 19 / 20 rows shrink (15: 2, 18: 3, 19: 2, 20: 4) - the extra existing keys go unused.
Compute readers of these keys: grep part3Line1[1-9]/2[01] (box 11 code C now read by Form6781Compute.withK1; box 12 by K1Section179).
