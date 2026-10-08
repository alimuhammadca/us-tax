# UX Research — Competitor Tax Software

Purpose: collect first-hand knowledge of how commercial tax software is designed before we revamp
`us-tax-ui`. Findings feed `C:\us-tax\us-tax-ui\UI-PRINCIPLES.md` (§A9).

Started 2026-10-08. All data entered into the apps is **fictional** (household "Jordan & Casey Sample",
SSNs 400-12-345x). Nothing was e-filed, purchased, registered or signed in.

## Products studied

| Product | Tax year | Tech | How we studied it | Folder |
|---|---|---|---|---|
| TurboTax Deluxe 2024 (desktop) | 2024 | .NET WPF shell + CefSharp; Java (IKVM) engine | Live walk-through via Windows UI Automation (WPF exposes titles, text, fields with AutomationIds) + static string extraction from the interview package `Forms\1040_24\fdiin.1pe` | `turbotax-2024/` |
| H&R Block 2025 Premium (desktop) | 2025 | MFC shell + WebView2 (Chromium) rendering CXml interview screens | Live walk-through via Chrome DevTools Protocol (Playwright `connectOverCDP`) + prior static extraction of all 242 interview topics | `hrblock-2025/` + `C:\us-tax\H&RBlock2025.md` |

Note the tax-year mismatch: the installed TurboTax is the 2024 product, H&R Block is 2025. OBBBA-era
screens (no tax on tips/overtime, car-loan interest, enhanced senior deduction) appear only in H&R Block.

## The test household (same in both products)
MFJ, Illinois. Jordan (W-2 $85,000, Software Tester) + Casey (W-2 $52,000, Teacher, $300 educator
expenses, $2,000 traditional IRA), son Riley (b. 2016). 1099-INT $1,850; 1099-DIV $2,400 (qualified
$1,900, cap-gain dist $600); one 1099-B long-term sale ($7,500 proceeds / $4,000 basis); mortgage
interest $11,200 + property tax $4,800; charity $1,500 cash; child care $4,000.

## Contents

| Path | What |
|---|---|
| `turbotax-2024/walkthrough.md` | Chronological screen-by-screen log of the live TurboTax interview |
| `turbotax-2024/ux-findings.md` | Synthesised TurboTax UX patterns, with screen references |
| `turbotax-2024/screens/` | `NNN-<label>.png` screenshot + `.txt` UI Automation dump per screen |
| `turbotax-2024/static/` | Interview text extracted from `fdiin.1pe`, topic hierarchy, extraction scripts |
| `hrblock-2025/walkthrough.md` | Chronological screen log of the live H&R Block interview |
| `hrblock-2025/ux-findings.md` | Synthesised H&R Block UX patterns |
| `hrblock-2025/screens/` | Screenshot + text/controls per screen |
| `hrblock-2025/tools/` | CDP scripts used, with how-to |
| `cross-product-patterns.md` | Comparison of the two products and the rules we adopt |

Earlier studies (kept where they are): `C:\us-tax\turbotax.md` (TurboTax pattern KB),
`C:\us-tax\Maaz\screens.md` (1,236 TurboTax prompts from 1,480 screenshots — OCR-generated; trust the
prompt column only), `C:\us-tax\H&RBlock2025.md` (H&R Block static structure).

## Reproducing
- TurboTax: helper scripts `turbotax-2024/tools/tt.ps1` (dump / click / fill / shot) and `step.ps1`
  (act → screenshot + dump).
- H&R Block: see `hrblock-2025/tools/README.md`; launch with
  `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9223`.
