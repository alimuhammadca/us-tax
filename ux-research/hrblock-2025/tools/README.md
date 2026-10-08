# H&R Block 2025 UX-research tools

Scripts used to walk H&R Block Software 2025 (Premium) screen by screen and capture each screen.
The interview renders in a WebView2 (`C:\ProgramData\TaxCut\2025\tmpscreen.htm`) driven over Chrome DevTools
Protocol; the native MFC chrome (refund meter, FAQ rail, toolbar, Accuracy Review, Forms Central, Take Me To,
Search) is captured with `PrintWindow` and read with the built-in Windows OCR.

**Safety:** never e-file, activate, purchase, register or sign in. Another agent may be driving TurboTax at the
same time — every input here is either CDP (per-page) or `PostMessage` to an HRB window; nothing uses the global
mouse/keyboard (`SendInput`/`SendKeys`).

## Files

| File | What it does |
|---|---|
| `launch-hrb.ps1 [-Fresh]` | Kills HRB, optionally moves the in-progress return `C:\ProgramData\TaxCut\2025\cmWCPA9401.25` aside (fresh start), sets `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9223`, starts HRB and the dialog watcher. |
| `dialog-watcher-ux.ps1` | Background loop: logs every native `#32770` dialog (title, text, buttons) to `../dialogs.log`, answers Save→No, AutoSave As→names the file `UX-Research-Sample` + OK, else OK. Unlike the QA watcher it does **not** close the Accuracy Review window. |
| `ux.mjs '<actions>' <slug> [--nocap] [--full]` | Connects over CDP, runs trusted-input actions, then saves `../screens/NNN-<slug>.png` (full content: inner scroll containers are temporarily expanded) and `.json` (title, topic(s) from `tc:TOPICHELP` hrefs, full text, every input with name/label/value/options, buttons with hrefs, help links, left-rail FAQ links, JS dialogs). Counter in `state.json`. |
| `step.sh '<actions>' <slug>` | `ux.mjs` + whole-window `shell/NNN.png` + OCR of the meter/FAQ rail and tab strip into `shell/NNN-ocr.txt`. `NOSHELL=1` skips the shell part; `LINES_MAX=n` trims console output. ~14 s per step. |
| `helpcap.mjs <slug> [--url=<regex>] [--prefix=report-] [--keep]` | Captures a pop-up WebView page (default: Help Central `help/ovhl/vhl.htm`; `--url=tmpreportscreen` for Refund Reveal) as the next numbered screen, then closes its window. |
| `shellshot.ps1 -Out <path> [-Class <substr>] [-NoUia]` | PrintWindow capture of an HRB top-level window (default the main window; e.g. `-Class 'Accuracy Review'`, `'Forms Central'`, `'Take Me To'`, `'Search'`) + UI Automation dump of native buttons. |
| `ocr.ps1 -Png <file> [-CropS x,y,w,h]` | Windows.Media.Ocr text of an image or crop (2× upscaled). |
| `clickwin.ps1 -X -Y [-Class]` | Window-relative click via `PostMessage` to the deepest child under the point (native tabs, meter "View Details", toolbar, Accuracy Review buttons). |
| `typewin.ps1 -X -Y -Text <s> [-Tab] [-Enter] [-VKey n -Repeat k] [-Class]` | Click a cell then type via `WM_CHAR` (form cells in Accuracy Review / Forms Central). Form date cells take **digits only** (`06012018`). |
| `closewin.ps1 -Class <substr>` | WM_CLOSE an HRB window by class/title substring. |
| `winlist.ps1` | Lists visible HRB windows (class + title). |
| `stub.sh NNN slug "<title>" <shell-png>` | Turns a native-window capture into a numbered screen (`screens/NNN-slug.png` + `.json` with OCR text). |
| `note.sh NNN "<Type>" "<note>"` | Appends the researcher's classification/notes to `notes.jsonl`. |
| `gen-walkthrough.py` | Regenerates `../walkthrough.md` from screens JSON + shell OCR (meter) + `notes.jsonl`. |
| `pages.mjs`, `dbg.mjs "<js expr>"` | List CDP pages / evaluate an expression in the interview page. |
| `winlib.ps1` | Shared window lookup used by the PowerShell tools. |

## Action vocabulary (`ux.mjs`)

`["fill",name,value]` (click + Ctrl+A + Delete + typed + Tab, verified) · `["radio",name,value]` (focus+Space,
mouse fallback) · `["radioLabel",name,substr]` · `["check",name]` / `["uncheck",name]` (focus+Space) ·
`["select",name,labelSubstr]` (ArrowUp/Down — never `selectOption`, which the HRB engine ignores) ·
`["click",css]` (real mouse at element centre) · `["pwclick",css]` (Playwright forced click — needed for GIF
image buttons such as `img[name=Add_Dependent]`) · `["clickText",text]` · `["next"]` / `["back"]` ·
`["wait",ms]` · `["key","Enter"]`.

Yes/No *navigation-button* screens use ids `59` (Yes) and `60` (No): `["pwclick","[name='60'] img"]`.
Generic `["next"]` clicks `a.navbtnright`, which on those screens is **Yes**.

## Re-running

```bash
cd C:/us-tax/ux-research/hrblock-2025/tools
powershell -ExecutionPolicy Bypass -File launch-hrb.ps1 -Fresh     # wait ~60 s for the home screen
echo '{"n":0}' > state.json                                           # restart numbering (overwrites captures!)
bash step.sh '[]' start
bash step.sh '[["clickText","Start a Return"]]' start-return
bash step.sh '[["click","[name=\"4\"] img"]]' skip-import
bash step.sh '[["next"]]' next
# … one call per screen; see walkthrough.md "Actions taken" lines for the exact sequence used
python gen-walkthrough.py
```

Gotchas: a native modal (e.g. "AutoSave As") silently queues clicks — check `../dialogs.log` and `winlist.ps1`
when a click "does nothing". Help/report/review windows are separate top-level windows; the FAQ rail is native
(click it with `clickwin.ps1`, e.g. `-X 390 -Y 555`). The return autosaves to
`%USERPROFILE%\OneDrive\Documents\HRBlock\UX-Research-Sample.T25`.
