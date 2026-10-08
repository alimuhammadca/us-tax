# H&R Block 2025 — Desktop Application Analysis

> Reverse-engineering / architecture analysis of the installed **H&R Block Software 2025 (Premium edition)**
> Windows desktop application. Captured 2026-08-07 via the Windows **UI Automation API** (PowerShell) plus
> direct inspection of the app's on-disk assets, config, and data folders. No return data was modified; the
> app was sitting on its **Welcome** screen throughout.

---

## 1. How this was captured (methodology)

The app's live GUI is drawn by an embedded Chromium browser (WebView2), whose HTML DOM is **not** exposed to
UI Automation unless a screen reader is attached — so the native UIA tree yields only ~26 elements (window
shell + a stub of the web document). The productive route was therefore **file-based**:

- **UI Automation** (`System.Windows.Automation` via PowerShell) — attached to the process window by handle
  (`AutomationElement.FromHandle`), confirmed the shell structure, and read the few exposed content strings
  (e.g. the current screen title and the "Next" button).
- **On-disk assets** — the app renders each screen from **gzip-compressed CXml** interview definitions and
  writes the current screen's rendered HTML to a temp file (`tmpscreen.htm`). Decompressing the CXml exposes
  every interview screen and form definition statically, without navigating the live app.

Scripts used are in the session scratchpad (`uia_dump.ps1`, `uia_web.ps1`) — see §12 for the recipes.

**Privacy note:** the embedded browser profile (`EBWebView`) contains Chromium stores (Login Data, Cookies,
History, Web Data) and there are personal registration files (`reg.xml`). These were **deliberately not read** —
only the application's own structural/config/form assets were inspected.

---

## 2. Application identity

| Property | Value |
|---|---|
| Product | H&R Block Software 2025 |
| Edition (installed) | **Premium** (active stylesheet `StyleSheets/Edition/Premium.css`) |
| Editions shipped in the binary | Basic, Deluxe, EZ, Mac, Premium |
| Process | `HRBlock2025.exe` (PID 86924 at capture) |
| Window class / title | class `H&R Block 2025`, title `Untitled - HR Block Software 2025` |
| Install path | `C:\Program Files (x86)\HRBlock2025\` |
| Architecture | **32-bit (x86)** |
| Build | `/B 9401` (`TcVersion.cfg`); client module `cmWCPA9401.25` |
| Tax year | 2025 (forms marked "Final expected 1/6/26") |
| Update server | `softwareupdate.hrblock.com` |
| Data-file format | `FormatCXml` (per `tc25.cfg`) |
| Lineage | Internally still "**TaxCut**" (data folders, `tc*.cfg`, `Tt2Tc32.dll`, `tttc32.dll`) — H&R Block's product evolved from TaxCut |

---

## 3. Architecture

A classic **native MFC shell hosting a WebView2 (Chromium) UI**, driven by native tax-calculation engines:

```
HRBlock2025.exe  (MFC/Win32 shell, class "H&R Block 2025")
└─ Pane: NavigationView                (Afx:… MFC window)
   └─ Pane: WebView2EmbeddedBrowser     (aid 6147)
      └─ Chrome_WidgetWin_0/_1
         └─ tmpscreen.htm               ← current screen, rendered HTML
            └─ BrowserRootView … BrowserView   (Chromium view tree)
```

- **UI layer:** Microsoft **WebView2** — bundled **Fixed-Version Runtime `137.0.3296.83` (x86)**, i.e. a full
  embedded Edge/Chromium (includes Widevine CDM, SmartScreen, ad/tracker filtering lists, autofill, speech,
  hyphenation data — a complete browser profile under `AppData\Roaming\TaxCut\EBWebView`).
- **Screen engine:** each interview screen is HTML generated from a **CXml** topic definition and written to
  `C:\ProgramData\TaxCut\2025\tmpscreen.htm`; the WebView2 loads that file. Navigation/JS via
  `Scripts/tc_navigation.js`; buttons are GIF images (`Navigation/next_up.gif`, `back_up.gif`, …).
- **Tax engine (native DLLs in `…\Program\`):**
  - `USTax.dll` (**15.2 MB**) — the federal tax calculation engine (in `Program\US\`).
  - `DataTierAPI.dll` (11.4 MB) — data/return persistence layer.
  - `FormRenderMgmt.dll` — form rendering; `TaxPDF.dll` + `PDF995` folder — PDF export.
  - `Primitives.dll`, `Exceptions.dll`, `TCStateHelp.dll`, `TCGetProxy.dll`, `Tt2Tc32.dll`, `tttc32.dll`.
  - Bundled OSS libraries: `libcurl`, `libssl-1_1/3`, `libcrypto-1_1/3`, `libxml2`, `libexpat`, `zlib1`.
  - Updater: `HRBlockSwMgr.exe`, `HRBlockSWmgr2.exe`, `HRBlockSWMgrAsst.exe`.

---

## 4. Install directory layout

**Root `C:\Program Files (x86)\HRBlock2025\`:**

| Folder | Purpose |
|---|---|
| `Program\` | Executables, DLLs, federal (`US\`) + state (`State\`) data, config |
| `Help\` | Help content |
| `Images\` | Screen content images (e.g. `intro_thankyou_hrb.gif`) |
| `Navigation\` | Button GIFs (up/down/hover/focus/disabled states for Back, Next, …) |
| `Scripts\` | Client JS (`tc_navigation.js`, …) |
| `Stylesheets\` / `StyleSheets\` | CSS: `Templates/`, `Global/`, `Edition/` (5 editions), `ScreenType/` |
| `Templates\` | Screen layout templates |
| `PDF995\` | Third-party PDF print engine for return export |

**`Program\` subfolders:** `US\` (federal), `State\` (state modules — **only `IL` installed**),
`Bmp256\` (405 `.bmp` UI icons/images).

**`Program\US\` (federal data):**

| Item | Count / note |
|---|---|
| `Screens\` | **242** `.cxml` interview-topic definitions (the GUI) |
| `TaxForms\` | **247** `.cxml` tax-form/worksheet definitions (the math) |
| `TaxFormDisplayLists\` | 247 form display-list definitions |
| `HDL\`, `ORT\`, `Scripts\`, `TifMaps\` | handlers, overrides, scripts, TIFF field maps (print layout) |
| `USTax.dll` | federal calc engine (15.2 MB) |
| Loose `.cxml` | `SearchTopics` (17 KB), `IncludedTopicsHelpScreens`, `DynamicMacro`, `StaticMacro`, `ImportRules`, `Shoebox`, `CrossStateTopics`, `IncludedTopics` |

Asset counts across `US\` + `State\`: **~943 `.cxml`**, 334 `.hdl`, 269 `.tcc`, plus `.ort`, `.txt`.

---

## 5. The interview / screen system (CXml)

Each `.cxml` is **gzip** (magic `1F 8B 08 00`) wrapping an XML document:

```xml
<InterviewScreens TopicName="F1040V">
  <TopicScreens>
    <Screen ScreenName="ActualAmt"><![CDATA[ <!DOCTYPE html> … full screen HTML … ]]></Screen>
    <Screen ScreenName="NotNeeded"> … </Screen>
    <Screen ScreenName="PayFullAmtQues"> … </Screen>
  </TopicScreens>
</InterviewScreens>
```

- A **topic** (file) maps to a tax concept (e.g. `F1040V`, `SchedC`, `Med`) and contains **N named screens**
  (`F1040V` → 3: `ActualAmt`, `NotNeeded`, `PayFullAmtQues`).
- Each screen body is a **complete HTML page** referencing shared CSS/JS by relative path:
  `../StyleSheets/Templates/BasicScreenLayoutIE.css`, `Global/global.css`, `Edition/Premium.css`,
  `ScreenType/Generic.css`, and `../Scripts/tc_navigation.js`.
- **Rendered screen structure** (from live `tmpscreen.htm`):
  `div#title` (screen title) · `div#leftcolumn` (screen-type icon) · `div#content` (a `table.data-entry`
  with the questions/fields) · `div#navigation` (Back/Next GIF buttons wired to JS image swaps).
- The class name `BasicScreenLayoutIE.css` and `onclick="tcjs_onclick()"` reflect the legacy
  Internet-Explorer-era interview markup, now hosted in Chromium.

This confirms the product is a **wizard/interview** ("Guide Me") layered over a forms engine — directly relevant
to the **sc_00009 finding**: the interview path asks eligibility questions (e.g. a dependent's gross income)
that the direct forms-entry path can skip.

---

## 6. Interview topics (all 242, grouped)

*Authoritative flat list in Appendix A. Grouped here by function (interpretation of the topic names):*

- **Startup / setup:** `GettingStarted`, `GTKYEZ`, `Activation`, `Updates`, `TransferData`, `WhichReturn`,
  `NameFS`, `Personal`, `PersPlan1`, `DriversLicense`, `Home`, `InfoRev`, `TrumpActs` (tax-law-change screen).
- **Income:** `Inc`/`IncGateway`/`IncSumm`, `W2KB`, `W2G`, `IntInc`, `Div`, `FIRA`, `F1099R`, `F1099M/MC/MF/MFR/MRE`,
  `F1099NEC/NECC/NECF`, `F1099K*`, `F1099GR`, `F1099GU`, `OtherInc`/`OtherIncGateway`, `SchedC`/`SchedCInc`/`SchedCExp`,
  `SchedF`/`SchFInc`/`SchFExps`/`SchFLosses`, `rentinc`/`RentExp`, `FRe`, `K1Wks`/`K1Est`, `StockOp`,
  `KG`/`KG_1099B`/`KG_Crypto`/`KG_LongTerm1099B`/`KG_ShortTerm1099B`/`KG_Other` (capital gains), `Scholar`, `SSWks`,
  `ExcessDefComp`, `ExcessSS`, `FECOMP`, `Tuition`.
- **Adjustments:** `Adjust`/`AdjSumm`/`MiscAdj`, `AlimnyPd`/`AlimnyRc`, `Educator`, `SEHealth`, `KeoghSEP`, `SchedSE`.
- **Deductions:** `Dedux`/`DedSumm`, `ItemElec`, `Med`, `Chtbl`/`CharCash`/`CharMisc`, `NonCashDePro`/`NonCashOther`,
  `PropertyTax`, `SalesTax`, `VehicleTax`, `MiscDed`/`MiscDed2`, `dedhmiwksspl`, `AdditionaDed`.
- **Credits:** `Credits`/`CredSumm`, `ChTxCr`, `FChildKB`, `F2441KB` (dependent care), `F8880KB` (savers),
  `F8839KB` (adoption), `F8936KB`/`F8936SCHA` (clean vehicle), `F5695KB` (energy), `F8859KB`, `F8801KB` (AMT credit),
  `F8396KB`, `F3468KB`, `F3800KB` (general business), `F8586KB` (LIHC), `PTCIntro`/`PTCSummary`/`ACAIntro` (premium
  tax credit), `Scholar`/`Tuition` (education).
- **Other taxes / SE / penalties:** `Taxes`/`SelectTaxes`/`MiscTax`, `TaxPenal`, `F8959KB` (Add'l Medicare),
  `F8960KB` (NIIT), `SchedH` (household employment), `SchedSE`, `F5329KB`, `ExcContribPen`, `F4137KB`, `F2210KB`.
- **Business / depreciation / passive:** `BusGateway`, `Car`/`CarC`/`CarEmp`/`CarFarm`/`CarInv`/`CarRent`/`Car4835K`,
  `Dep*` (depreciation counterparts), `F8829Emp`/`F8829SE` (home office), `F4797KB`, `F4835KB`, `F6198KB` (at-risk),
  `LossLimit`, `QBI`, `F8995A*` (`F8995A_E`/`_F`/`_K1`/`_Summary`).
- **Specific-form interviews (`F####KB`):** `F1116KB`, `F1310KB`, `F2106KB`, `F2119KB`, `F2439KG`, `F2555KB`,
  `F3903KB`, `F4547Sign`, `F4684KB`, `F4868KB`, `F4952KB`, `F6251KB` (AMT), `F6252KB` (installment),
  `F6781KB` (§1256), `F8379KB` (injured spouse), `F8606KB`, `F8611KB` (LIHC recapture), `F8615KB` (kiddie),
  `F8814KB`, `F8815KB`, `F8822kb`, `F8824KB` (like-kind), `F8853KB`, `F8958KB` (community property),
  `F8889KB` (HSA), `F982KB` (COD), `FW10KB`.
- **Retirement / planning:** `RetGateway`, `RetireAdvisor`, `RothAsst`, `TaxPlRet`, `TaxPlan`/`TaxPlan2`,
  `PPWks`, `KLCO`.
- **Filing (the `FT_*` family):** `FT_Intro`, `FT_FedOp`, `FT_Efile`, `FT_Paper`, `FT_PrintFed`/`FT_PrintSt`/`FT_PrintRec`,
  `FT_Check`/`FT_SepCheck`/`FT_ExtCheck`/`FT_AmdCheck`/`FT_StExtCheck`/`FT_StAmdCheck`, `FT_Trans`/`FT_SepTrans`/
  `FT_ExtTrans`/`FT_AmdTrans`/`FT_StExtTrans`/`FT_StAmdTrans`/`FT_StEstPmtTrans`, `FT_Ext*`, `FT_Sep*`/`FT_SepSt*`,
  `FT_Backup`, `FT_Finish`, `FT_End`; plus `DirDep`, `TPDesig` (third-party designee), `F4547Sign`, `PDFAttachWizard`,
  `InstPay` (installment), `TaxPmts`/`TaxPmts`.
- **State:** `State`, `StateLauncher`, `USSecondaryNavs`, cross-state via `CrossStateTopics.cxml`.
- **Review / summary:** `ReviewTab`, `WrapUp`, `Reports`, `TaxSumm`, `End`, `EndPlan`, `F9000`, `SharedText`.
- **Dev/test artifacts:** `TestRegularExpressions` (leftover QA screen).

---

## 7. Tax-form / worksheet definitions (247)

*Authoritative flat list in Appendix B. Highlights showing breadth of coverage:*

- **Core 1040:** `f1040`, `f1040a`, `f1040sr`, `f1040es`, `f1040v`, `f1040x` (amended).
- **Schedules:** `scheda`, `schedb`, `schedc`/`schedcez`, `schedd`, `schede`, `schedf`, `schedh`, `schedj` (farm
  averaging), `schedlep`, `schedr`, `schedse`, `sched3`, `scheic`.
- **QBI (§199A):** `f8995a`, `f8995aA/C/D/FRE/sum/ovf`, `qbiwks`, `qbistmt`.
- **Capital / investment:** `f8949`, `f1099b`, `f1099da` (digital assets), `fkg`/`kgwks`, `f6252` (installment),
  `f6781` (§1256), `f8824` (like-kind), `f4952`/`f4952amt`, `stockop`.
- **Passive / at-risk:** `f8582` + `pg2`/`pg3`/`amt` variants + worksheets `f8582w1…w7`, `f6198`.
- **AMT:** `f6251`, `amtwks`, `f1116amt`, `f4952amt`, `f8582amt`.
- **Retirement / IRA:** `f8606`/`f8606wks`, `f5329`, `fira`, `irastmt`, `rothcont`, `rothconv`, `keowks`, `f8915/A/B/E`.
- **Depreciation / business:** `f4562c`, `bonusdep`, `s179wks`, `f8829` (home office), `f7206` (SE health).
- **Credits:** `f8812` (CTC), `f8863` (education), `f8880` (savers), `f8962`/`f8962inf`/`f8962wk4`/`f1095a`/`marketex`
  (PTC/ACA), `f8936`/`f8936SchA` (clean vehicle), `altveh`, `f5695`/`JT5695` (energy), `f2441` (dependent care),
  `f8839` (adoption), `f8859`, `f8396`, `f3468`, `f3800` (general business), `f8586`/`f8609`/`f8609a`/`f8611` (LIHC),
  `f8801` (AMT credit), `f8910`/`f8911` (alt-fuel vehicle), `f8863`, `pycrwks`.
- **Other taxes:** `f8959` (Add'l Medicare), `f8960` (NIIT), `f4137` (tip tax), `f8919`(via wagewks), `f2210`/`f2210wks`.
- **Foreign / special:** `f2555`/`f2555ez`, `f1116`/`f1116amt`, `f8938`, `f8858`(via f8958 community prop), `f982` (COD).
- **Clergy:** `clergywks1`–`clergywks4`.
- **ACA:** `acacover`, `acainc`, `acamagi`, `acanodep`, `acapenal`, `acasumm`, `affordex`, `f8965`/`wk1`/`wk3`.
- **Filing / admin:** `f4868` (extension), `f2688`, `f9465` (installment agreement), `f8453`/`f8453ol` (e-file),
  `f1310` (decedent refund), `f8332` (release of dependent), `f8822`/`f8822b` (address change), `fss4`, `fw4`, `fw10`.
- **Planning:** `swhatif` (what-if analyzer), `f5yr` (5-year comparison), `usavg` (income averaging), `TaxFormList`.
- **Tangible-property regs:** `tprdemin`, `tprsmall`, `tprstmt`.

**Form availability** (`formAvail.xml`, 168 US forms) — every form is marked **"Final expected 1/6/26"**, i.e.
at capture time the 2025 program shipped with forms in pre-final ("draft/expected") status pending the Jan-2026
final IRS release. (Consistent with an early-season build; `dir.txt` timestamp 4/16/2026.)

---

## 8. Data & configuration folders

| Location | Contents |
|---|---|
| `C:\ProgramData\TaxCut\2025\` | `tmpscreen.htm` (current screen), `formAvail.xml` (updated), `cmWCPA9401.25` (client module), `pmWCPA.25`, `download.cfg`, `update.tim`/`update2.tim`, `IL.txt` (installed-state marker), `Trusted.txt`, `cache\`, `Downloads\`, `Update\` |
| `C:\ProgramData\TaxCut\WebView2\` | WebView2 support |
| `AppData\Roaming\TaxCut\` | `tc25.cfg`, `alert.cfg`, `reg.xml` (registration — *not read*), `centrallog.log`, `usalert.txt`/`ilalert.txt`, `EBWebView\` (full Chromium profile), `Webview2\` |
| `AppData\Roaming\TaxCut\EBWebView\` | Embedded-Edge profile: `Default\` (History, Cookies, Login Data, Web Data — *not read*), `Crashpad\`, `GraphiteDawnCache\`, component subfolders (Widevine, SmartScreen, ad-block "Filtering Rules", tracker "Entities", speech, zxcvbn, hyphenation) |

**`tc25.cfg` (key settings):** `DataFileFormat=FormatCXml`, `DefaultBackupPath=C:\`,
`ui_prop_update_server=softwareupdate.hrblock.com`, proxy = system, `auto_alert_update_check=false`,
`ui_prop_user_registered=0`. `tcsystem.cfg` is an encrypted/hex blob (licensing/system state).

---

## 9. Update mechanism

- Updater executables `HRBlockSwMgr*.exe` poll `softwareupdate.hrblock.com`.
- `download.cfg` + `update.tim` track update state; `Update\` and `Downloads\` stage payloads.
- Forms ship as datable modules (`cmWCPA9401.25` = client module build 9401); `formAvail.xml` is refreshed from
  the server so form-final dates update in-season.

---

## 10. Live GUI capture (current screen)

At capture the app was on the **Welcome** screen. UIA-exposed content:

```
[Text]  'Welcome to H&R Block Software'
[Image] 'intro_thankyou_hrb.gif'
[Group/Hyperlink/Image] 'Next'   → single forward navigation button
```

Rendered HTML (`tmpscreen.htm`, abbreviated):
```html
<div id="title"><span class="title">Welcome to H&amp;R Block Software</span></div>
<div id="content"><table class="data-entry"><tr><td>
  <img src=".../Images/intro_thankyou_hrb.gif" /></td></tr></table></div>
<div id="navigation"> …Next button (next_up.gif) wired to tc_navigation.js… </div>
```

Because the full DOM isn't exposed to UIA, per-screen interactive detail is best obtained by **decompressing the
CXml** (static, complete) or by driving the wizard and re-reading `tmpscreen.htm` after each step (dynamic, but
advances the session — not done here to avoid mutating any return).

---

## 11. Relevance to us-tax-be / the SQA suite

- H&R Block 2025 is exactly the class of **commercial benchmark** the SQA suite measures us-tax-be against.
  Its **interview vs. direct-forms** duality is the mechanism behind **sc_00009** (the manual dependent screen
  can skip the §152(d)(1)(B) gross-income question while the "Guide Me" wizard asks it).
- The form inventory (§7) is a near-superset of us-tax-be's implemented forms and confirms scope overlap on the
  areas the SQA suite exercises (QBI, passive/at-risk, AMT, clergy, ACA, §1256, like-kind, LIHC recapture,
  decedent `f1310`, injured-spouse `f8379`, household `schedh`, etc.).
- The `.cxml` topics are a ready-made **cross-reference of screen→form** that could map H&R Block's interview
  ordering to us-tax-be's compute order, if desired.

---

## 12. Reverse-engineering recipes

**Attach to the app and dump the shell UIA tree** (`uia_dump.ps1`):
```powershell
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes,WindowsBase
$win = [System.Windows.Automation.AutomationElement]::FromHandle((Get-Process HRBlock2025).MainWindowHandle)
# walk with [System.Windows.Automation.TreeWalker]::ControlViewWalker
```

**Read the current live screen:**
```powershell
Get-Content 'C:\ProgramData\TaxCut\2025\tmpscreen.htm' -Raw
```

**Decompress any interview/form CXml (gzip → XML with CDATA HTML):**
```powershell
$fs = [IO.File]::OpenRead("$env:ProgramFiles(x86)\HRBlock2025\Program\US\Screens\F1040V.cxml")
$gz = New-Object IO.Compression.GzipStream($fs,[IO.Compression.CompressionMode]::Decompress)
(New-Object IO.StreamReader($gz)).ReadToEnd()   # → <InterviewScreens>…<Screen>…<![CDATA[ HTML ]]>
```

**Enumerate all topics / forms:**
```powershell
Get-ChildItem '…\Program\US\Screens'  -Filter *.cxml | % BaseName   # 242 interview topics
Get-ChildItem '…\Program\US\TaxForms' -Filter *.cxml | % BaseName   # 247 forms/worksheets
```

---

## 13. Limitations

- **Live DOM not fully machine-readable via UIA** — WebView2/Chromium only builds its full accessibility tree
  for an attached assistive-technology client; the static CXml is the complete substitute.
- **Only the IL state module is installed** — other states would add ~95 topics each when downloaded.
- **CXml is the *definition*, not runtime state** — actual field values/answers for an open return live in the
  return file (via `DataTierAPI.dll`) and the WebView2 session, which were not opened/inspected.
- **Sensitive stores intentionally skipped** (Chromium Login Data/Cookies/History, `reg.xml`).
- Full screen-by-screen HTML for all 242 topics (each with multiple screens) was **not** dumped inline — the
  decompression recipe (§12) reproduces any of them on demand.

---

## Appendix A — All 242 interview topics (`US\Screens\*.cxml`)

```
ACAIntro, Activation, AdditionaDed, AdjSumm, Adjust, AlimnyPd, AlimnyRc, AutoEntry, BusGateway, Car, Car4835K,
CarC, CarEmp, CarFarm, CarInv, CarRent, CharCash, CharMisc, Chtbl, ChTxCr, Credits, CredSumm, dedhmiwksspl,
DedSumm, Dedux, Dep4835K, DepC, DepEmp, DepFarm, DepInv, DepRent, DirDep, Div, Dpndt, DriversLicense, Educator,
End, EndPlan, ExcContribPen, ExcessDefComp, ExcessSS, F1040V, F1040X, F1095A, F1098E, F1098KB, F1099B, F1099DA,
F1099GR, F1099GU, F1099KC, F1099KF, F1099KFR, F1099KOthInc, F1099KRE, F1099M, F1099MC, F1099MF, F1099MFR,
F1099MRE, F1099NEC, F1099NECC, F1099NECF, F1099R, F1116KB, F1310KB, F2106KB, F2119KB, F2210KB, F2439KG, F2441KB,
F2555KB, F3468KB, F3800KB, F3903KB, F4137KB, F4547Sign, F4684KB, F4797KB, F4835KB, F4868KB, F4952KB, F5329KB,
F5695KB, F6198KB, F6251KB, F6252KB, F6781KB, F8379KB, F8396KB, F8586KB, F8606KB, F8615KB, F8801KB, F8814KB,
F8815KB, F8822kb, F8824KB, F8829Emp, F8829SE, F8839KB, F8853KB, F8859KB, F8880KB, F8889KB, F8936KB, F8936SCHA,
F8958KB, F8959KB, F8960KB, F8995A, F8995A_E, F8995A_F, F8995A_K1, F8995A_Summary, F9000, F982KB, FChildKB,
FECOMP, FElder, FIRA, ForAcct, FRe, FT_AmdCheck, FT_AmdTrans, FT_Backup, FT_Check, FT_Efile, FT_End,
FT_ExtCheck, FT_ExtOp, FT_ExtPrint, FT_ExtTrans, FT_FedOp, FT_Finish, FT_Intro, FT_Paper, FT_PrintFed,
FT_PrintRec, FT_PrintSt, FT_SepCheck, FT_SepCheck2, FT_SepSt, FT_SepSt2, FT_SepTrans, FT_SepTrans2,
FT_StAmdCheck, FT_StAmdTrans, FT_StEstPmtTrans, FT_StExtCheck, FT_StExtTrans, FT_StOp, FT_Trans, FW10KB,
GettingStarted, GTKYEZ, Home, Inc, IncGateway, IncSumm, InfoRev, InstPay, IntInc, InvGateway, ItemElec, K1Est,
K1Wks, KeoghSEP, KG, KG_1099B, KG_Crypto, KG_LongTerm1099B, KG_Other, KG_ShortTerm1099B, KLCO, LossLimit, Med,
MiscAdj, MiscDed, MiscDed2, MiscTax, NameFS, NonCashDePro, NonCashOther, OtherInc, OtherIncGateway,
PDFAttachWizard, Personal, PersPlan1, PPWks, PropertyTax, PTCIntro, PTCSummary, QBI, RentExp, rentinc, Reports,
RetGateway, RetireAdvisor, ReviewTab, RothAsst, SalesGateway, SalesTax, SchedC, SchedCExp, SchedCInc, SchedF,
SchedH, SchedJ, schedlep, SchedSE, SchEIC, SchFExps, SchFInc, SchFLosses, Scholar, SEHealth, SelectTaxes,
SharedText, SSWks, State, StateLauncher, StockOp, Taxes, TaxPenal, TaxPlan, TaxPlan2, TaxPlRet, TaxPmts,
TaxSumm, TestRegularExpressions, TPDesig, TransferData, TrumpActs, Tuition, Updates, USSecondaryNavs,
VehicleTax, W2G, W2KB, WhichReturn, WrapUp
```

## Appendix B — All 247 tax-form definitions (`US\TaxForms\*.cxml`)

```
acacover, acainc, acamagi, acanodep, acapenal, acasumm, affordex, altveh, amtwks, bonusdep, bwks1, bwks2,
cfwdwks, charwks, clergywks1, clergywks2, clergywks3, clergywks4, ctcwks, dedhmiwksspl, dpndtatt, eiwks, ewks1,
ewks2, ewks3, f1040, f1040a, f1040es, f1040sr, f1040v, f1040x, f1095a, f1098, f1098e, f1098t, f1099b, f1099da,
f1099div, f1099gov, f1099int, f1099k, f1099m, f1099msa, f1099nec, f1099r, f1099sa, f1116, f1116amt, f1310,
f2106, f2106ez, f2119, f2120, f2210, f2210wks, f2439, f2441, f2555, f2555ez, f2688, f2xmit, f3468, f3800,
f3903, f4136, f4137, f4255, f4547, f4547sign, f4547wks, f4562c, f4684, f4797, f4835, f4868, f4952, f4952amt,
f4972, f5329, f5695, f5yr, f6198, f6251, f6252, f6781, f7206, f8082, f8283, f8332, f8379, f8396, f8453,
f8453ol, f8582, f8582amt, f8582pg2, f8582pg2amt, f8582pg3, f8582pg3amt, f8582w1, f8582w2, f8582w3, f8582w4,
f8582w5, f8582w6, f8582w7, f8586, f8606, f8606wks, f8609, f8609a, f8611, f8615, f8801, f8812, f8814, f8815,
f8818, f8822, f8822b, f8824, f8828, f8829, f8839, f8853, f8859, f8862, f8863, f8880, f8888, f8889, f8900,
f8901, f8903, f8910, f8911, f8914, f8915, f8915A, f8915B, f8915E, f8917, f8931, f8936, f8936SchA, f8938, f8942,
f8949, f8958, f8959, f8960, f8962, f8962inf, f8962wk4, f8965, f8965wk1, f8965wk3, f8995a, f8995aA, f8995aC,
f8995aD, f8995aFRE, f8995asum, f8995ovf, f9000, f9465, f982, faaaa, fbbbb, fcar, fcccc, fchild, fdepc, fdeps,
fdpndt, fecomp, felder, ffiling, filewks, fimportsummary, fira, fkg, fpers, fre, frtnhdr, fseries, fss4,
ftdf90, fw10, fw2, fw2g, fw4, fwizard, hcehard, hcerelig, hcetribe, homemtg, irastmt, JT5695, k1wk1041, k1wks,
keowks, kgwks, marketex, mwks, noncash, ppwks, pycrwks, qbistmt, qbiwks, returnex, rothcont, rothconv, s179wks,
sched3, scheda, schedb, schedc, schedcez, schedd, schede, schedf, schedh, schedj, schedlep, schedr, schedse,
scheic, sehdeds, sehidwks, sehiter, smtImp, sswks, stInfo, stockop, stOthTC, swhatif, TaxFormList, tprdemin,
tprsmall, tprstmt, txpmtwks, usavg, utExpPrtN, utExpPrtY, wagewks
```

---
*Captured 2026-08-07. Method: Windows UI Automation (PowerShell) + static asset inspection. No return data
modified; sensitive browser/registration stores intentionally not read.*


---
---

# Deep-dive appendices (added 2026-08-07)

The three sections below extend the analysis with: (#2) a live wizard-drive capture, (#3) an interview→form
cross-reference, and (Appendix C) the **complete decompressed screen/field extraction for all 242 interview
topics** (15,486 screens, 6,027 distinct data fields).

---

## 14. Live wizard-drive capture (#2)

**Method:** attach to the process by window handle, invoke the exposed navigation control via UI Automation
`InvokePattern`, then re-read the freshly-rendered `C:\ProgramData\TaxCut\2025\tmpscreen.htm` after each step to
extract the new screen's title, inputs, and buttons.

**Result — the dynamic pipeline is confirmed and the entry transition was captured:**

| Step | Screen (title) | Action | Outcome |
|---|---|---|---|
| 0 | **Welcome to H&R Block Software** | invoke `Next` (Hyperlink) | advanced |
| 1 | **Activate and Register Your Software** | (stopped) | — |

**Screen 1 detail (captured, not acted on):**
- **Text:** "What's your activation code? You need your activation code to unlock free federal e-files… Registration
  info — First name / MI / Last name / Address / City / State / ZIP / Phone / Ext. / Email / Where did you
  purchase this program?"
- **Inputs:** activation-code field (`183.31893`) + registration fields (`92.43713`–`92.43776`) + a
  purchase-location `select`.
- **Buttons:** `Dont_Activate`, `Activate_Later`, `Activate_Now`.

**Why the drive stopped here (honest limitation):** WebView2/Chromium exposes only the **default/focused**
control (the `Next` hyperlink on the Welcome screen) to UI Automation; the Activation screen's buttons
(`Activate_Later`, etc.) are **not** surfaced as invokable UIA elements, so `InvokePattern` can't reach them.
Reliable deeper click-through would require a **DevTools/CDP** connection to the WebView2 or brittle
coordinate-clicking — and proceeding risked either triggering **online activation** (`Activate_Now`) or entering
**PII** (name/SSN). I therefore stopped. This costs **no information**: the static extraction (#1 / Appendix C)
already contains every screen of every topic, including the full 8-screen `Activation` topic and everything
downstream of it.

**What the live drive did prove:**
- Each screen is rendered by rewriting `tmpscreen.htm`, which the WebView2 reloads — so the current on-screen GUI
  is always readable from that single file.
- The interview immediately gates on **activation/registration** (`ui_prop_user_registered=0` in `tc25.cfg`),
  offering a skip (`Activate_Later`) — consistent with the `Activation` topic's `…WithDont` screen variants.

---

## 15. Interview topic → tax-form cross-reference (#3)

**Method:** each interview topic (`US\Screens\*.cxml`) was matched to the tax-form definitions
(`US\TaxForms\*.cxml`) by exact/suffix name-match plus a curated alias table for non-obvious mappings. **119 of
242** topics map to one or more specific forms; the remaining ~123 are **gateway / summary / help / navigation**
screens that drive the interview but don't own a single form.

**Field-ID convention observed in the screens** (useful for reading Appendix C):
- **`<formIndex>.<fieldId>`** — a reference into a tax-form's field table, e.g. `126.x` = the vehicle
  (Car/§4562) worksheet, `57.x` = Alimony Paid, `92.x` = registration/system, `1.x` = the 1040 core. The numeric
  prefix is the form's internal index.
- **`rb_*`** — semantically-named radio-button groups (e.g. `rb_ChildSupport`, `rb_LiveApart`).
- **Screen-name prefixes:** `h*` = help/"Explain This" pop-ups, `v*` = "what-if"/validation variant screens,
  `F####…` = the interview for that IRS form.

The full mapping table follows; Appendix C then gives the per-topic screen + field detail.

﻿| Interview topic | Form(s)/schedule(s) driven | match |
|---|---|---|
| ACAIntro | f1095a/f8962 | curated |
| Activation | (gateway / summary / help / navigation - no single form) | none |
| AdditionaDed | (gateway / summary / help / navigation - no single form) | none |
| AdjSumm | (gateway / summary / help / navigation - no single form) | none |
| Adjust | (gateway / summary / help / navigation - no single form) | none |
| AlimnyPd | sched1 | curated |
| AlimnyRc | sched1 | curated |
| AutoEntry | (gateway / summary / help / navigation - no single form) | none |
| BusGateway | (gateway / summary / help / navigation - no single form) | none |
| Car | f4562c/schedc | curated |
| Car4835K | (gateway / summary / help / navigation - no single form) | none |
| CarC | (gateway / summary / help / navigation - no single form) | none |
| CarEmp | (gateway / summary / help / navigation - no single form) | none |
| CarFarm | (gateway / summary / help / navigation - no single form) | none |
| CarInv | (gateway / summary / help / navigation - no single form) | none |
| CarRent | (gateway / summary / help / navigation - no single form) | none |
| CharCash | scheda | curated |
| CharMisc | scheda | curated |
| Chtbl | scheda/f8283 | curated |
| ChTxCr | f8812/ctcwks | curated |
| Credits | (gateway / summary / help / navigation - no single form) | none |
| CredSumm | (gateway / summary / help / navigation - no single form) | none |
| dedhmiwksspl | dedhmiwksspl | exact |
| DedSumm | (gateway / summary / help / navigation - no single form) | none |
| Dedux | scheda | curated |
| Dep4835K | (gateway / summary / help / navigation - no single form) | none |
| DepC | (gateway / summary / help / navigation - no single form) | none |
| DepEmp | (gateway / summary / help / navigation - no single form) | none |
| DepFarm | (gateway / summary / help / navigation - no single form) | none |
| DepInv | (gateway / summary / help / navigation - no single form) | none |
| DepRent | (gateway / summary / help / navigation - no single form) | none |
| DirDep | f8888 | curated |
| Div | schedb/f1099div | curated |
| Dpndt | fdpndt/dpndtatt | curated |
| DriversLicense | (gateway / summary / help / navigation - no single form) | none |
| Educator | sched1 | curated |
| End | (gateway / summary / help / navigation - no single form) | none |
| EndPlan | (gateway / summary / help / navigation - no single form) | none |
| ExcContribPen | f5329 | curated |
| ExcessDefComp | wagewks | curated |
| ExcessSS | sched3 | curated |
| F1040V | f1040v | exact |
| F1040X | f1040x | exact |
| F1095A | f1095a | curated |
| F1098E | f1098e | exact |
| F1098KB | f1098 | suffix |
| F1099B | f1099b | exact |
| F1099DA | f1099da | exact |
| F1099GR | (gateway / summary / help / navigation - no single form) | none |
| F1099GU | (gateway / summary / help / navigation - no single form) | none |
| F1099KC | (gateway / summary / help / navigation - no single form) | none |
| F1099KF | (gateway / summary / help / navigation - no single form) | none |
| F1099KFR | (gateway / summary / help / navigation - no single form) | none |
| F1099KOthInc | (gateway / summary / help / navigation - no single form) | none |
| F1099KRE | (gateway / summary / help / navigation - no single form) | none |
| F1099M | f1099m | exact |
| F1099MC | (gateway / summary / help / navigation - no single form) | none |
| F1099MF | (gateway / summary / help / navigation - no single form) | none |
| F1099MFR | (gateway / summary / help / navigation - no single form) | none |
| F1099MRE | (gateway / summary / help / navigation - no single form) | none |
| F1099NEC | f1099nec | exact |
| F1099NECC | (gateway / summary / help / navigation - no single form) | none |
| F1099NECF | (gateway / summary / help / navigation - no single form) | none |
| F1099R | f1099r | curated |
| F1116KB | f1116 | suffix |
| F1310KB | f1310 | suffix |
| F2106KB | f2106 | suffix |
| F2119KB | f2119 | suffix |
| F2210KB | f2210 | suffix |
| F2439KG | f2439 | curated |
| F2441KB | f2441 | suffix |
| F2555KB | f2555 | suffix |
| F3468KB | f3468 | suffix |
| F3800KB | f3800 | suffix |
| F3903KB | f3903 | suffix |
| F4137KB | f4137 | suffix |
| F4547Sign | f4547sign | exact |
| F4684KB | f4684 | suffix |
| F4797KB | f4797 | suffix |
| F4835KB | f4835 | suffix |
| F4868KB | f4868 | suffix |
| F4952KB | f4952 | suffix |
| F5329KB | f5329 | suffix |
| F5695KB | f5695 | suffix |
| F6198KB | f6198 | suffix |
| F6251KB | f6251 | suffix |
| F6252KB | f6252 | suffix |
| F6781KB | f6781 | suffix |
| F8379KB | f8379 | suffix |
| F8396KB | f8396 | suffix |
| F8586KB | f8586 | suffix |
| F8606KB | f8606 | suffix |
| F8615KB | f8615 | suffix |
| F8801KB | f8801 | suffix |
| F8814KB | f8814 | suffix |
| F8815KB | f8815 | suffix |
| F8822kb | f8822 | suffix |
| F8824KB | f8824 | suffix |
| F8829Emp | f8829 | curated |
| F8829SE | f8829 | curated |
| F8839KB | f8839 | suffix |
| F8853KB | f8853 | suffix |
| F8859KB | f8859 | suffix |
| F8880KB | f8880 | suffix |
| F8889KB | f8889 | suffix |
| F8936KB | f8936 | suffix |
| F8936SCHA | f8936SchA | exact |
| F8958KB | f8958 | suffix |
| F8959KB | f8959 | suffix |
| F8960KB | f8960 | suffix |
| F8995A | f8995a | exact |
| F8995A_E | (gateway / summary / help / navigation - no single form) | none |
| F8995A_F | (gateway / summary / help / navigation - no single form) | none |
| F8995A_K1 | (gateway / summary / help / navigation - no single form) | none |
| F8995A_Summary | (gateway / summary / help / navigation - no single form) | none |
| F9000 | f9000 | exact |
| F982KB | f982 | suffix |
| FChildKB | f8615 | curated |
| FECOMP | fecomp | curated |
| FElder | schedr/felder | curated |
| FIRA | fira/f8606 | curated |
| ForAcct | (gateway / summary / help / navigation - no single form) | none |
| FRe | fre/schede | curated |
| FT_AmdCheck | (gateway / summary / help / navigation - no single form) | none |
| FT_AmdTrans | (gateway / summary / help / navigation - no single form) | none |
| FT_Backup | (gateway / summary / help / navigation - no single form) | none |
| FT_Check | (gateway / summary / help / navigation - no single form) | none |
| FT_Efile | (gateway / summary / help / navigation - no single form) | none |
| FT_End | (gateway / summary / help / navigation - no single form) | none |
| FT_ExtCheck | (gateway / summary / help / navigation - no single form) | none |
| FT_ExtOp | (gateway / summary / help / navigation - no single form) | none |
| FT_ExtPrint | (gateway / summary / help / navigation - no single form) | none |
| FT_ExtTrans | (gateway / summary / help / navigation - no single form) | none |
| FT_FedOp | (gateway / summary / help / navigation - no single form) | none |
| FT_Finish | (gateway / summary / help / navigation - no single form) | none |
| FT_Intro | (gateway / summary / help / navigation - no single form) | none |
| FT_Paper | (gateway / summary / help / navigation - no single form) | none |
| FT_PrintFed | (gateway / summary / help / navigation - no single form) | none |
| FT_PrintRec | (gateway / summary / help / navigation - no single form) | none |
| FT_PrintSt | (gateway / summary / help / navigation - no single form) | none |
| FT_SepCheck | (gateway / summary / help / navigation - no single form) | none |
| FT_SepCheck2 | (gateway / summary / help / navigation - no single form) | none |
| FT_SepSt | (gateway / summary / help / navigation - no single form) | none |
| FT_SepSt2 | (gateway / summary / help / navigation - no single form) | none |
| FT_SepTrans | (gateway / summary / help / navigation - no single form) | none |
| FT_SepTrans2 | (gateway / summary / help / navigation - no single form) | none |
| FT_StAmdCheck | (gateway / summary / help / navigation - no single form) | none |
| FT_StAmdTrans | (gateway / summary / help / navigation - no single form) | none |
| FT_StEstPmtTrans | (gateway / summary / help / navigation - no single form) | none |
| FT_StExtCheck | (gateway / summary / help / navigation - no single form) | none |
| FT_StExtTrans | (gateway / summary / help / navigation - no single form) | none |
| FT_StOp | (gateway / summary / help / navigation - no single form) | none |
| FT_Trans | (gateway / summary / help / navigation - no single form) | none |
| FW10KB | fw10 | curated |
| GettingStarted | (gateway / summary / help / navigation - no single form) | none |
| GTKYEZ | (gateway / summary / help / navigation - no single form) | none |
| Home | (gateway / summary / help / navigation - no single form) | none |
| Inc | (gateway / summary / help / navigation - no single form) | none |
| IncGateway | (gateway / summary / help / navigation - no single form) | none |
| IncSumm | (gateway / summary / help / navigation - no single form) | none |
| InfoRev | (gateway / summary / help / navigation - no single form) | none |
| InstPay | f9465 | curated |
| IntInc | schedb/f1099int | curated |
| InvGateway | (gateway / summary / help / navigation - no single form) | none |
| ItemElec | (gateway / summary / help / navigation - no single form) | none |
| K1Est | (gateway / summary / help / navigation - no single form) | none |
| K1Wks | k1wks | curated |
| KeoghSEP | keowks | curated |
| KG | schedd/f8949/fkg | curated |
| KG_1099B | (gateway / summary / help / navigation - no single form) | none |
| KG_Crypto | (gateway / summary / help / navigation - no single form) | none |
| KG_LongTerm1099B | (gateway / summary / help / navigation - no single form) | none |
| KG_Other | (gateway / summary / help / navigation - no single form) | none |
| KG_ShortTerm1099B | (gateway / summary / help / navigation - no single form) | none |
| KLCO | (gateway / summary / help / navigation - no single form) | none |
| LossLimit | (gateway / summary / help / navigation - no single form) | none |
| Med | scheda | curated |
| MiscAdj | (gateway / summary / help / navigation - no single form) | none |
| MiscDed | scheda | curated |
| MiscDed2 | (gateway / summary / help / navigation - no single form) | none |
| MiscTax | (gateway / summary / help / navigation - no single form) | none |
| NameFS | fpers | curated |
| NonCashDePro | f8283/noncash | curated |
| NonCashOther | f8283/noncash | curated |
| OtherInc | (gateway / summary / help / navigation - no single form) | none |
| OtherIncGateway | (gateway / summary / help / navigation - no single form) | none |
| PDFAttachWizard | (gateway / summary / help / navigation - no single form) | none |
| Personal | fpers | curated |
| PersPlan1 | (gateway / summary / help / navigation - no single form) | none |
| PPWks | ppwks | exact |
| PropertyTax | scheda | curated |
| PTCIntro | f8962 | curated |
| PTCSummary | f8962 | curated |
| QBI | f8995a/qbiwks | curated |
| RentExp | schede | curated |
| rentinc | schede | curated |
| Reports | (gateway / summary / help / navigation - no single form) | none |
| RetGateway | (gateway / summary / help / navigation - no single form) | none |
| RetireAdvisor | (gateway / summary / help / navigation - no single form) | none |
| ReviewTab | (gateway / summary / help / navigation - no single form) | none |
| RothAsst | rothcont/rothconv | curated |
| SalesGateway | (gateway / summary / help / navigation - no single form) | none |
| SalesTax | scheda | curated |
| SchedC | schedc | curated |
| SchedCExp | (gateway / summary / help / navigation - no single form) | none |
| SchedCInc | (gateway / summary / help / navigation - no single form) | none |
| SchedF | schedf | curated |
| SchedH | schedh | curated |
| SchedJ | schedj | exact |
| schedlep | schedlep | exact |
| SchedSE | schedse | curated |
| SchEIC | scheic/eiwks | curated |
| SchFExps | (gateway / summary / help / navigation - no single form) | none |
| SchFInc | (gateway / summary / help / navigation - no single form) | none |
| SchFLosses | (gateway / summary / help / navigation - no single form) | none |
| Scholar | f1098t/f8863 | curated |
| SEHealth | sehdeds/f7206 | curated |
| SelectTaxes | (gateway / summary / help / navigation - no single form) | none |
| SharedText | (gateway / summary / help / navigation - no single form) | none |
| SSWks | sswks | curated |
| State | (gateway / summary / help / navigation - no single form) | none |
| StateLauncher | (gateway / summary / help / navigation - no single form) | none |
| StockOp | stockop | curated |
| Taxes | (gateway / summary / help / navigation - no single form) | none |
| TaxPenal | f2210 | curated |
| TaxPlan | (gateway / summary / help / navigation - no single form) | none |
| TaxPlan2 | (gateway / summary / help / navigation - no single form) | none |
| TaxPlRet | (gateway / summary / help / navigation - no single form) | none |
| TaxPmts | (gateway / summary / help / navigation - no single form) | none |
| TaxSumm | (gateway / summary / help / navigation - no single form) | none |
| TestRegularExpressions | (gateway / summary / help / navigation - no single form) | none |
| TPDesig | (gateway / summary / help / navigation - no single form) | none |
| TransferData | (gateway / summary / help / navigation - no single form) | none |
| TrumpActs | (OBBBA/law-change info) | curated |
| Tuition | f8863/f1098t | curated |
| Updates | (gateway / summary / help / navigation - no single form) | none |
| USSecondaryNavs | (gateway / summary / help / navigation - no single form) | none |
| VehicleTax | scheda | curated |
| W2G | fw2g | curated |
| W2KB | fw2 | curated |
| WhichReturn | (gateway / summary / help / navigation - no single form) | none |
| WrapUp | (gateway / summary / help / navigation - no single form) | none |


---

## Appendix C — Complete interview extraction: all 242 topics (screens · titles · data fields)

*Decompressed from every `US\Screens\*.cxml` (gzip → XML `InterviewScreens`). For each topic: total screen count,
sample screen titles (the questions asked), the unique screen names, and the data-model field names collected.
Field-ID convention is documented in §15. This is the complete GUI content, captured statically.*

﻿
### ACAIntro  (17 screens, 17 unique)
- titles: Minimum Essential Coverage | Type of Health Insurance | Your Health Insurance Coverage | Special Rule for Births, Deaths, and Adoptions | Health Insurance Coverage | Affordable Care Act (ACA)
- screens: FullMECAndMarketplace, FullMECNoMarketplace, FullYrCoverage, FullYrCoverageAndMarketplace_Dependents, InsuranceType, MarketplaceInsurance_UnclaimedDep, PartialMECNoMarketplaceV2, UnclaimedDependent_NoMarketplace, vCanBeClaimedAsDependent, vForm1095bOrForm1095c, vVoidForm1095A, hBirthDeathAdoption, hF1095A, hHousehold, hMarketplaceInsurance, hMinimumEssentialCoverage, hStillNeedInsurance
- data fields (2): rb_CoverageAllYr, rb_UnclaimedDepMarketplace

### Activation  (8 screens, 8 unique)
- titles: Activate and Register Your Software | Welcome to H&R Block Software | What can I do if I can't find my activation code?
- screens: hrbsIntro, NormalRegCamry, NormalRegDownload, NormalRegRetail, RegCamryWithDont, RegDownloadWithDont, RegRetailWithDont, hWhatIfCantFindKeyCode
- data fields (13): 183.31893, 92.43713, 92.43714, 92.43715, 92.43716, 92.43718, 92.43719, 92.43720, 92.43721, 92.43722, 92.43723, 92.43775, 92.43776

### AdditionaDed  (30 screens, 30 unique)
- titles: Next, we'll help with your additional deductions. | What if I deduct car loan interest as a vehicle expense for my business? | What if I have overtime on my W-2? | No Tax on Overtime | No Tax on Tips | You don't qualify for No Tax on Car Loan Interest Deduction
- screens: AddlDedOverview, AddlDedSummy, OneW2EachSpouse, OneW2OTDed, QualCarIntNo, QualCarIntYes, QualCarLoanIntDed, QualOTDed, QualOTNo, QualOTYes, QualSeniorNo, QualSeniorYes, QualTipsDed, QualTipsNo, QualTipsYes, vLemonLaw, vMoreThan2Veh, vW2Overtime, hAddlDedSummary, hCarLoanIntBus, hCarLoanVIN, hDedCarLoanInt, hDedEnhancedSenior, hDedNoTaxOnOT, hDedNoTaxOnTips, hNoTaxOnBusTips, hNoTaxOnCarLoan, hNoTaxOnOT, hNoTaxOnSenior, hNoTaxOnTips
- data fields (11): 1.258982, 1.258985, 1.261266, 1.261267, 1.261268, 1.261269, 1.261295, 1.261296, 1.261491, rb_CarInt, rb_CarInt2

### AdjSumm  (19 screens, 19 unique)
- titles: Here are your adjustments. | Self-Employed Health Insurance | Health Savings Account (HSA) Deduction | Alimony Paid | Other Adjustments | Educator Expenses
- screens: AdjustmentSummary, AdjustmentSummary_Simple, AdjustmentSummary_WithRoth, AdjustmentSummaryNoTuition, AdjustmentSummaryNoTuition_WithRoth, vTuition, hAlimonyPaid_ExplainThis, hEarlyWithdrawal_ExplainThis, hEducatorExps_ExplainThis, hHealthSavingsDed_ExplainThis, hIRAContrib_ExplainThis, hJobExpenses, hKeoghSEP_ExplainThis, hMovingExps_ExplainThis, hOtherAdjs_ExplainThis, hRoth_ExplainThis, hSEHealth_ExplainThis, hSETaxDeduc_ExplainThis, hStudentLoadDed_ExplainThis

### Adjust  (22 screens, 22 unique)
- titles: Let's get started on your adjustments to income. | What if I contributed to a SEP-IRA or SIMPLE IRA? | Do I need to itemize to take these adjustments? | Alimony Paid | Choose any adjustments that applied in 2025 | What about a tax refund that's directly deposited into my IRA?
- screens: Adjust_GetReady, Adjustments, Adjustments_SelfEmp, Adjustments_Simple, vDeemedIRA, vDontNeedToItemize, vIRADirectDeposit, vMissingForm, vMSA, vmyRAContributions, vNxtYr, vPYStorageExp, vSEPOrSIMPLE, vTuition, hAlimonyPaid, hIRAContribs, hJobExpenses, hLearnMore_EdExpense, hLearnMore_HSA, hLearnMore_Moving, hLearnMore_MSA, hLearnMore_StudentLoanInt
- data fields (1): 92.1038

### AlimnyPd  (37 screens, 37 unique)
- titles: How do I know what part is for child support? | What if I paid my ex-spouse's rent or mortgage payments? | Payments Based on Family Relationship | Payments Are Alimony | What if I paid alimony and child support? | Designated as Non-Alimony
- screens: AgreementDate, AlimonyInfo, AnyPost84Pmts, CeaseAtDeath, ChildSupport, JointReturn, LiveApart, NonAlimony, PaymentCash, PaymentsAreAlimony, PaymentsAreNotAlimony, PmtBasedOnRelationship, vAgmtChangedPost2019, vAlimForChild, vBoth, vCombined, vGoods, vHowKnow, vHowKnowCease, vHowKnowPartCS, vIOU, vLegallySep, vLoan, vModAgr, vNoPmtReq, vNoSSN, vNotAfford, vPdRent, vSameHouse, vSepNotDiv, vSpentOnKid, vTuition, hAllCash, hFamilyRelationship, hNotNonAlimony, hPost84DecreeOrAgr, hSupport
- data fields (17): 57.107, 57.108, 57.109, 57.110, 57.111, 57.112, 57.218772, 57.218773, 57.218774, rb_AnyPost84Pmts, rb_CeaseAtDeath, rb_ChildSupport, rb_JointReturn, rb_LiveApart, rb_NonAlimony, rb_PaymentCash, rb_PmtBasedOnRelationship

### AlimnyRc  (40 screens, 40 unique)
- titles: How do I know what part is for child support? | What if my former spouse paid my tuition? | What if alimony and child support were combined in one check? | Payments Based on Family Relationship | Amount of Alimony Received | What if I borrowed money from my former spouse?
- screens: AgreementDate, AgreementDate2, AmountAlimonyPaid, AnyPost84Pmts, CeaseAtDeath, ChildSupport, JointReturn, LiveApart, NeedHelp, NewGateway, NonAlimony, PaymentCash, PaymentsAreAlimony, PaymentsAreNotAlimony, PmtBasedOnRelationship, vAgmtChangedPost2019, vAlimForChild, vBoth, vCombined, vCombo, vGoods, vHowKnow, vHowKnowCease, vHowKnowPartCS, vIOU, vLegallySep, vLoan, vModAgr, vNoPmtReq, vNotAfford, vPdRent, vSameHouse, vSepNotDiv, vSpentOnKid, vTuition, hAllCash, hFamilyRelationship, hNotNonAlimony, hPost84DecreeOrAgr, hSupport
- data fields (15): 1.216573, 1.219277, 1.219278, 1.219317, 1.81, rb_AnyPost84Pmts, rb_CeaseAtDeath, rb_ChildSupport, rb_JointReturn, rb_LiveApart, rb_MorePre2019Agts, rb_NeedHelp, rb_NonAlimony, rb_PaymentCash, rb_PmtBasedOnRelationship

### AutoEntry  (128 screens, 128 unique)
- titles: Will I still be able to update transferred information? | How do I create a Capital Gains Report? | How do I export my data? | Import Quicken&reg; 2025 | When is it a good idea to transfer information from last year? | SmartImportQAServerInUse
- screens: 1098Success, 1098SuccessDDC, 109xCryptoSuccess, 109xSuccess, AssemblingScreenData, AutoEntryImport, AutoEntryImport_BackEndDisabled, AwaitingFIResponse, BeforeYouBegin, CheckSSNFILogin, CheckSSNFILoginMFJ, CheckYourPhoneWantURL, CheckYourPhoneWantXML, ChooseFinSoftware, ChooseFinSoftwareMac, ConnectionError, ConnectionFound, ConnectionNotFound, ConnectionRequired, CryptoUserSelection, DedProImportSummary, DProEntryScreen, DUMMY_BUTTON_SCREEN, EINFound, EINNotFoundDDC, EINNotFoundNoDDC, EnterCellPhoneNum, EnterSpSSNFILoginMFJ, EnterSSNFILogin, EnterSSNsFILoginMFJ, EnterTPSSNFILoginMFJ, ExractingDataValues, ExtractingPdfDropValues, ExtractingW2PdfDropValues, F1098ImageFileSelect, F1098PdfDropSelect, F109XComparisonReport, F109XSummaryReport, FIList, FIListRetrievalError, FinancialSoftwareSuccess, FinancialSoftwareSummaryReport, FinSoftFileSelect, FinSoftFileSelectNoPassword, FinSoftNoValidData, FinSoftPreviewData, FinSoftSelectType, FinSoftStartWiz, ImageScanFileSelect, ImportFailed ...(+78)
- data fields (13): 53372.218492, 53372.219616, 53372.53386, 53372.53613, 53372.53614, 53372.69618, 53372.70042, 92.7, 92.8, FileList, rb_CryptoImport, rb_Import, rb_SoftwareType

### BusGateway  (19 screens, 19 unique)
- titles: What if I received a Form 1099-K with more than one type of income or income for more than one business? | What if I received a 1099-NEC? | What if I have a fishing business? | How do I know if I had a business or was self-employed? | Tax Treatment of Forgiven PPP Loans | What if I was a limited partner?
- screens: BusinessItems, Farm, vFishing, vForgivenPPP, vHowKnowBusOrSE, vLimitedPartner, vLLC, vMissingForm, vNameImageLikenessIncome, vReceived1099MISC, vReceived1099NEC, h1099KMoreThanOneInc, hForgivenPPPLoansTreatment, hLearnMore_Business, hLearnMore_Farm, hPartnerships, hRentals, hRoyalties, hWhatIfCovid

### Car  (273 screens, 273 unique)
- titles: What if my spouse and I each have a business? | Manually Adjust | Was your rental activity a trade or business? | Did you own or lease the | Exceptions | How can I create a list of items to add up and go into a field?
- screens: AcquireAfterSep27, ActualExpensesDed, ActualExpensesDed_NoBonusDep, AddlInfo, AddlInfo_Employee, AnnualLeaseValue, AnnualLeaseValueQuest, ArmsLength, ArtistsBusMiles, BalanceItemized, BalanceItemized_Inv, BalanceNotItemized, BasicInfo, BasicInfo_LiveAudit, BasicInfo_LLY, Basis, Basis_PriorYr, BasisAsst_Conversion, BasisAsst_Conversion_PriorYr, BasisAsst_Gift, BasisAsst_Gift_PriorYr, BasisAsst_HowAcquired, BasisAsst_HowAcquired_PriorYr, BasisAsst_Inherit, BasisAsst_Inherit_PriorYr, BasisAsst_Intro, BasisAsst_Intro_PriorYr, BasisAsst_Marital, BasisAsst_Marital_PriorYr, BasisAsst_Purchase, BasisAsst_Purchase_PriorYr, BasisAsst_SecondInst, BasisAsst_SecondInst_PriorYr, BonusDepChoices_100Pct, BonusDepChoices_40Pct, BonusDepElectOut, BonusDepNewProp, BonusDepRecapture, BusinessMilesPersonalMiles, BusinessMilesPersonalMiles_Conversion, BusinessMilesPersonalMilesEmp, BusinessMilesPersonalMilesEmp_Conversion, BusUseOver50, CashPaidOnTradeIn, ChoiceOfMethods, ChooseMethod_StdFirstYr, ComparisonResults, ComputerSvcsBusMiles, ConvenienceOfEmployer, ConversionToPersonal ...(+223)
- data fields (74): 126.11, 126.12, 126.14, 126.16, 126.17, 126.20, 126.203390, 126.21, 126.22, 126.23, 126.24, 126.25, 126.26, 126.265, 126.27, 126.270, 126.271, 126.272, 126.28, 126.31, 126.33, 126.34, 126.36, 126.363, 126.38, 126.380, 126.381, 126.461, 126.60, 126.61, 126.67, 126.7, FCar.BusMileThisYrFirstPart, FCar.BusMileThisYrSecondPart, PriorYrBonusDepType_2008, PriorYrBonusDepType_2011, PriorYrBonusDepType_GOZA, PriorYrBonusDepType_Old50, PriorYrBonusDepType_PostSep27, rb_AcqPostSep27, rb_AnnLease, rb_ArmsLength, rb_BusOver50, rb_ChooseMethStdFirstYr, rb_ConvertToPers, rb_ElectOut, rb_EmplConv, rb_EmpOwnership, rb_FortyBonusDepChoice, rb_HowAcquired, rb_InvPriorYr, rb_Lease, rb_ListedPropType, rb_MethodDefaultAct, rb_MethodDefaultStd, rb_New, rb_Nonpersonal, rb_OneHundredBonusDepChoice, rb_PersonalUseRecords, rb_PriorYrBonusDepOptOut ...(+14)

### Car4835K  (283 screens, 283 unique)
- titles: What if my spouse and I each have a business? | Manually Adjust | Was your rental activity a trade or business? | Did you own or lease the | Exceptions | How can I create a list of items to add up and go into a field?
- screens: car4835k1, car4835k2, car4835k3, car4835k7, vHeavyEquipLease_FRV, vMultipleVehicles_FRV, vNotOwnOrLease_FRV, vPersonalUse_FRV, vRecords_FRV, vShortTermRental_FRV, AcquireAfterSep27, ActualExpensesDed, ActualExpensesDed_NoBonusDep, AddlInfo, AddlInfo_Employee, AnnualLeaseValue, AnnualLeaseValueQuest, ArmsLength, ArtistsBusMiles, BalanceItemized, BalanceItemized_Inv, BalanceNotItemized, BasicInfo, BasicInfo_LiveAudit, BasicInfo_LLY, Basis, Basis_PriorYr, BasisAsst_Conversion, BasisAsst_Conversion_PriorYr, BasisAsst_Gift, BasisAsst_Gift_PriorYr, BasisAsst_HowAcquired, BasisAsst_HowAcquired_PriorYr, BasisAsst_Inherit, BasisAsst_Inherit_PriorYr, BasisAsst_Intro, BasisAsst_Intro_PriorYr, BasisAsst_Marital, BasisAsst_Marital_PriorYr, BasisAsst_Purchase, BasisAsst_Purchase_PriorYr, BasisAsst_SecondInst, BasisAsst_SecondInst_PriorYr, BonusDepChoices_100Pct, BonusDepChoices_40Pct, BonusDepElectOut, BonusDepNewProp, BonusDepRecapture, BusinessMilesPersonalMiles, BusinessMilesPersonalMiles_Conversion ...(+233)
- data fields (75): 126.11, 126.12, 126.14, 126.16, 126.17, 126.20, 126.203390, 126.21, 126.22, 126.23, 126.24, 126.25, 126.26, 126.265, 126.27, 126.270, 126.271, 126.272, 126.28, 126.31, 126.33, 126.34, 126.36, 126.363, 126.38, 126.380, 126.381, 126.43613, 126.461, 126.60, 126.61, 126.67, 126.7, FCar.BusMileThisYrFirstPart, FCar.BusMileThisYrSecondPart, PriorYrBonusDepType_2008, PriorYrBonusDepType_2011, PriorYrBonusDepType_GOZA, PriorYrBonusDepType_Old50, PriorYrBonusDepType_PostSep27, rb_AcqPostSep27, rb_AnnLease, rb_ArmsLength, rb_BusOver50, rb_ChooseMethStdFirstYr, rb_ConvertToPers, rb_ElectOut, rb_EmplConv, rb_EmpOwnership, rb_FortyBonusDepChoice, rb_HowAcquired, rb_InvPriorYr, rb_Lease, rb_ListedPropType, rb_MethodDefaultAct, rb_MethodDefaultStd, rb_New, rb_Nonpersonal, rb_OneHundredBonusDepChoice, rb_PersonalUseRecords ...(+15)

### CarC  (277 screens, 277 unique)
- titles: What if my spouse and I each have a business? | Manually Adjust | Was your rental activity a trade or business? | Did you own or lease the | Exceptions | How can I create a list of items to add up and go into a field?
- screens: carc1, carc2, carc3, carc7, AcquireAfterSep27, ActualExpensesDed, ActualExpensesDed_NoBonusDep, AddlInfo, AddlInfo_Employee, AnnualLeaseValue, AnnualLeaseValueQuest, ArmsLength, ArtistsBusMiles, BalanceItemized, BalanceItemized_Inv, BalanceNotItemized, BasicInfo, BasicInfo_LiveAudit, BasicInfo_LLY, Basis, Basis_PriorYr, BasisAsst_Conversion, BasisAsst_Conversion_PriorYr, BasisAsst_Gift, BasisAsst_Gift_PriorYr, BasisAsst_HowAcquired, BasisAsst_HowAcquired_PriorYr, BasisAsst_Inherit, BasisAsst_Inherit_PriorYr, BasisAsst_Intro, BasisAsst_Intro_PriorYr, BasisAsst_Marital, BasisAsst_Marital_PriorYr, BasisAsst_Purchase, BasisAsst_Purchase_PriorYr, BasisAsst_SecondInst, BasisAsst_SecondInst_PriorYr, BonusDepChoices_100Pct, BonusDepChoices_40Pct, BonusDepElectOut, BonusDepNewProp, BonusDepRecapture, BusinessMilesPersonalMiles, BusinessMilesPersonalMiles_Conversion, BusinessMilesPersonalMilesEmp, BusinessMilesPersonalMilesEmp_Conversion, BusUseOver50, CashPaidOnTradeIn, ChoiceOfMethods, ChooseMethod_StdFirstYr ...(+227)
- data fields (75): 126.11, 126.12, 126.14, 126.16, 126.17, 126.20, 126.203390, 126.21, 126.22, 126.23, 126.24, 126.25, 126.26, 126.265, 126.27, 126.270, 126.271, 126.272, 126.28, 126.31, 126.33, 126.34, 126.36, 126.363, 126.38, 126.380, 126.381, 126.43613, 126.461, 126.60, 126.61, 126.67, 126.7, FCar.BusMileThisYrFirstPart, FCar.BusMileThisYrSecondPart, PriorYrBonusDepType_2008, PriorYrBonusDepType_2011, PriorYrBonusDepType_GOZA, PriorYrBonusDepType_Old50, PriorYrBonusDepType_PostSep27, rb_AcqPostSep27, rb_AnnLease, rb_ArmsLength, rb_BusOver50, rb_ChooseMethStdFirstYr, rb_ConvertToPers, rb_ElectOut, rb_EmplConv, rb_EmpOwnership, rb_FortyBonusDepChoice, rb_HowAcquired, rb_InvPriorYr, rb_Lease, rb_ListedPropType, rb_MethodDefaultAct, rb_MethodDefaultStd, rb_New, rb_Nonpersonal, rb_OneHundredBonusDepChoice, rb_PersonalUseRecords ...(+15)

### CarEmp  (278 screens, 278 unique)
- titles: What if my spouse and I each have a business? | Manually Adjust | Was your rental activity a trade or business? | Did you own or lease the | Exceptions | How can I create a list of items to add up and go into a field?
- screens: caremp1, caremp2, caremp3, caremp7, vCommuting_EV, AcquireAfterSep27, ActualExpensesDed, ActualExpensesDed_NoBonusDep, AddlInfo, AddlInfo_Employee, AnnualLeaseValue, AnnualLeaseValueQuest, ArmsLength, ArtistsBusMiles, BalanceItemized, BalanceItemized_Inv, BalanceNotItemized, BasicInfo, BasicInfo_LiveAudit, BasicInfo_LLY, Basis, Basis_PriorYr, BasisAsst_Conversion, BasisAsst_Conversion_PriorYr, BasisAsst_Gift, BasisAsst_Gift_PriorYr, BasisAsst_HowAcquired, BasisAsst_HowAcquired_PriorYr, BasisAsst_Inherit, BasisAsst_Inherit_PriorYr, BasisAsst_Intro, BasisAsst_Intro_PriorYr, BasisAsst_Marital, BasisAsst_Marital_PriorYr, BasisAsst_Purchase, BasisAsst_Purchase_PriorYr, BasisAsst_SecondInst, BasisAsst_SecondInst_PriorYr, BonusDepChoices_100Pct, BonusDepChoices_40Pct, BonusDepElectOut, BonusDepNewProp, BonusDepRecapture, BusinessMilesPersonalMiles, BusinessMilesPersonalMiles_Conversion, BusinessMilesPersonalMilesEmp, BusinessMilesPersonalMilesEmp_Conversion, BusUseOver50, CashPaidOnTradeIn, ChoiceOfMethods ...(+228)
- data fields (75): 126.11, 126.12, 126.14, 126.16, 126.17, 126.20, 126.203390, 126.21, 126.22, 126.23, 126.24, 126.25, 126.26, 126.265, 126.27, 126.270, 126.271, 126.272, 126.28, 126.31, 126.33, 126.34, 126.36, 126.363, 126.38, 126.380, 126.381, 126.43613, 126.461, 126.60, 126.61, 126.67, 126.7, FCar.BusMileThisYrFirstPart, FCar.BusMileThisYrSecondPart, PriorYrBonusDepType_2008, PriorYrBonusDepType_2011, PriorYrBonusDepType_GOZA, PriorYrBonusDepType_Old50, PriorYrBonusDepType_PostSep27, rb_AcqPostSep27, rb_AnnLease, rb_ArmsLength, rb_BusOver50, rb_ChooseMethStdFirstYr, rb_ConvertToPers, rb_ElectOut, rb_EmplConv, rb_EmpOwnership, rb_FortyBonusDepChoice, rb_HowAcquired, rb_InvPriorYr, rb_Lease, rb_ListedPropType, rb_MethodDefaultAct, rb_MethodDefaultStd, rb_New, rb_Nonpersonal, rb_OneHundredBonusDepChoice, rb_PersonalUseRecords ...(+15)

### CarFarm  (277 screens, 277 unique)
- titles: What if my spouse and I each have a business? | Manually Adjust | Was your rental activity a trade or business? | Did you own or lease the | Exceptions | How can I create a list of items to add up and go into a field?
- screens: carfarm1, carfarm2, carfarm3, carfarm7, AcquireAfterSep27, ActualExpensesDed, ActualExpensesDed_NoBonusDep, AddlInfo, AddlInfo_Employee, AnnualLeaseValue, AnnualLeaseValueQuest, ArmsLength, ArtistsBusMiles, BalanceItemized, BalanceItemized_Inv, BalanceNotItemized, BasicInfo, BasicInfo_LiveAudit, BasicInfo_LLY, Basis, Basis_PriorYr, BasisAsst_Conversion, BasisAsst_Conversion_PriorYr, BasisAsst_Gift, BasisAsst_Gift_PriorYr, BasisAsst_HowAcquired, BasisAsst_HowAcquired_PriorYr, BasisAsst_Inherit, BasisAsst_Inherit_PriorYr, BasisAsst_Intro, BasisAsst_Intro_PriorYr, BasisAsst_Marital, BasisAsst_Marital_PriorYr, BasisAsst_Purchase, BasisAsst_Purchase_PriorYr, BasisAsst_SecondInst, BasisAsst_SecondInst_PriorYr, BonusDepChoices_100Pct, BonusDepChoices_40Pct, BonusDepElectOut, BonusDepNewProp, BonusDepRecapture, BusinessMilesPersonalMiles, BusinessMilesPersonalMiles_Conversion, BusinessMilesPersonalMilesEmp, BusinessMilesPersonalMilesEmp_Conversion, BusUseOver50, CashPaidOnTradeIn, ChoiceOfMethods, ChooseMethod_StdFirstYr ...(+227)
- data fields (75): 126.11, 126.12, 126.14, 126.16, 126.17, 126.20, 126.203390, 126.21, 126.22, 126.23, 126.24, 126.25, 126.26, 126.265, 126.27, 126.270, 126.271, 126.272, 126.28, 126.31, 126.33, 126.34, 126.36, 126.363, 126.38, 126.380, 126.381, 126.43613, 126.461, 126.60, 126.61, 126.67, 126.7, FCar.BusMileThisYrFirstPart, FCar.BusMileThisYrSecondPart, PriorYrBonusDepType_2008, PriorYrBonusDepType_2011, PriorYrBonusDepType_GOZA, PriorYrBonusDepType_Old50, PriorYrBonusDepType_PostSep27, rb_AcqPostSep27, rb_AnnLease, rb_ArmsLength, rb_BusOver50, rb_ChooseMethStdFirstYr, rb_ConvertToPers, rb_ElectOut, rb_EmplConv, rb_EmpOwnership, rb_FortyBonusDepChoice, rb_HowAcquired, rb_InvPriorYr, rb_Lease, rb_ListedPropType, rb_MethodDefaultAct, rb_MethodDefaultStd, rb_New, rb_Nonpersonal, rb_OneHundredBonusDepChoice, rb_PersonalUseRecords ...(+15)

### CarInv  (277 screens, 277 unique)
- titles: What if my spouse and I each have a business? | Manually Adjust | Was your rental activity a trade or business? | Did you own or lease the | Exceptions | How can I create a list of items to add up and go into a field?
- screens: carinv1, carinv2, carinv3, carinv7, AcquireAfterSep27, ActualExpensesDed, ActualExpensesDed_NoBonusDep, AddlInfo, AddlInfo_Employee, AnnualLeaseValue, AnnualLeaseValueQuest, ArmsLength, ArtistsBusMiles, BalanceItemized, BalanceItemized_Inv, BalanceNotItemized, BasicInfo, BasicInfo_LiveAudit, BasicInfo_LLY, Basis, Basis_PriorYr, BasisAsst_Conversion, BasisAsst_Conversion_PriorYr, BasisAsst_Gift, BasisAsst_Gift_PriorYr, BasisAsst_HowAcquired, BasisAsst_HowAcquired_PriorYr, BasisAsst_Inherit, BasisAsst_Inherit_PriorYr, BasisAsst_Intro, BasisAsst_Intro_PriorYr, BasisAsst_Marital, BasisAsst_Marital_PriorYr, BasisAsst_Purchase, BasisAsst_Purchase_PriorYr, BasisAsst_SecondInst, BasisAsst_SecondInst_PriorYr, BonusDepChoices_100Pct, BonusDepChoices_40Pct, BonusDepElectOut, BonusDepNewProp, BonusDepRecapture, BusinessMilesPersonalMiles, BusinessMilesPersonalMiles_Conversion, BusinessMilesPersonalMilesEmp, BusinessMilesPersonalMilesEmp_Conversion, BusUseOver50, CashPaidOnTradeIn, ChoiceOfMethods, ChooseMethod_StdFirstYr ...(+227)
- data fields (75): 126.11, 126.12, 126.14, 126.16, 126.17, 126.20, 126.203390, 126.21, 126.22, 126.23, 126.24, 126.25, 126.26, 126.265, 126.27, 126.270, 126.271, 126.272, 126.28, 126.31, 126.33, 126.34, 126.36, 126.363, 126.38, 126.380, 126.381, 126.43613, 126.461, 126.60, 126.61, 126.67, 126.7, FCar.BusMileThisYrFirstPart, FCar.BusMileThisYrSecondPart, PriorYrBonusDepType_2008, PriorYrBonusDepType_2011, PriorYrBonusDepType_GOZA, PriorYrBonusDepType_Old50, PriorYrBonusDepType_PostSep27, rb_AcqPostSep27, rb_AnnLease, rb_ArmsLength, rb_BusOver50, rb_ChooseMethStdFirstYr, rb_ConvertToPers, rb_ElectOut, rb_EmplConv, rb_EmpOwnership, rb_FortyBonusDepChoice, rb_HowAcquired, rb_InvPriorYr, rb_Lease, rb_ListedPropType, rb_MethodDefaultAct, rb_MethodDefaultStd, rb_New, rb_Nonpersonal, rb_OneHundredBonusDepChoice, rb_PersonalUseRecords ...(+15)

### CarRent  (277 screens, 277 unique)
- titles: What if my spouse and I each have a business? | Manually Adjust | Was your rental activity a trade or business? | Did you own or lease the | Exceptions | How can I create a list of items to add up and go into a field?
- screens: carrent1, carrent2, carrent3, carrent7, AcquireAfterSep27, ActualExpensesDed, ActualExpensesDed_NoBonusDep, AddlInfo, AddlInfo_Employee, AnnualLeaseValue, AnnualLeaseValueQuest, ArmsLength, ArtistsBusMiles, BalanceItemized, BalanceItemized_Inv, BalanceNotItemized, BasicInfo, BasicInfo_LiveAudit, BasicInfo_LLY, Basis, Basis_PriorYr, BasisAsst_Conversion, BasisAsst_Conversion_PriorYr, BasisAsst_Gift, BasisAsst_Gift_PriorYr, BasisAsst_HowAcquired, BasisAsst_HowAcquired_PriorYr, BasisAsst_Inherit, BasisAsst_Inherit_PriorYr, BasisAsst_Intro, BasisAsst_Intro_PriorYr, BasisAsst_Marital, BasisAsst_Marital_PriorYr, BasisAsst_Purchase, BasisAsst_Purchase_PriorYr, BasisAsst_SecondInst, BasisAsst_SecondInst_PriorYr, BonusDepChoices_100Pct, BonusDepChoices_40Pct, BonusDepElectOut, BonusDepNewProp, BonusDepRecapture, BusinessMilesPersonalMiles, BusinessMilesPersonalMiles_Conversion, BusinessMilesPersonalMilesEmp, BusinessMilesPersonalMilesEmp_Conversion, BusUseOver50, CashPaidOnTradeIn, ChoiceOfMethods, ChooseMethod_StdFirstYr ...(+227)
- data fields (75): 126.11, 126.12, 126.14, 126.16, 126.17, 126.20, 126.203390, 126.21, 126.22, 126.23, 126.24, 126.25, 126.26, 126.265, 126.27, 126.270, 126.271, 126.272, 126.28, 126.31, 126.33, 126.34, 126.36, 126.363, 126.38, 126.380, 126.381, 126.43613, 126.461, 126.60, 126.61, 126.67, 126.7, FCar.BusMileThisYrFirstPart, FCar.BusMileThisYrSecondPart, PriorYrBonusDepType_2008, PriorYrBonusDepType_2011, PriorYrBonusDepType_GOZA, PriorYrBonusDepType_Old50, PriorYrBonusDepType_PostSep27, rb_AcqPostSep27, rb_AnnLease, rb_ArmsLength, rb_BusOver50, rb_ChooseMethStdFirstYr, rb_ConvertToPers, rb_ElectOut, rb_EmplConv, rb_EmpOwnership, rb_FortyBonusDepChoice, rb_HowAcquired, rb_InvPriorYr, rb_Lease, rb_ListedPropType, rb_MethodDefaultAct, rb_MethodDefaultStd, rb_New, rb_Nonpersonal, rb_OneHundredBonusDepChoice, rb_PersonalUseRecords ...(+15)

### CharCash  (19 screens, 19 unique)
- titles: What are qualified organizations? | Records | How do I enter or delete a donation? | What about amounts that I transfer tax-free to a charity from an IRA after I'm 70-1/2? | Planning to make a cash gift next year? | Documentation From Charity
- screens: CashAmounts1, CashAmounts1DedPro, CashAmounts2, CashAmounts2DedPro, GiftStrategy_PremiumExpert, vBenefitFromCharity, vDocFromCharity, vEnterOrDeleteContrib, vHowCashImported, vK1Contribs, vMembershipFees, vMultipleContribsToCharity, vOutOfPocket, vQualCharDistribs, vQualOrg, vRecordsForCash, vSALTContrib, hCash, hDonorFund
- data fields (90): 152.10, 152.12, 152.13, 152.15, 152.16, 152.18, 152.19, 152.21, 152.22, 152.228608, 152.228609, 152.228610, 152.228611, 152.228612, 152.228613, 152.228614, 152.228615, 152.228616, 152.228617, 152.228618, 152.228619, 152.228620, 152.228621, 152.228622, 152.228623, 152.228624, 152.228625, 152.228626, 152.228627, 152.228628, 152.228629, 152.228630, 152.228631, 152.228632, 152.228633, 152.228634, 152.228635, 152.228636, 152.228637, 152.24, 152.25, 152.27, 152.28, 152.30, 152.31, 152.33, 152.34, 152.36, 152.37, 152.39, 152.40, 152.42, 152.43, 152.45, 152.46, 152.48, 152.49, 152.51, 152.52, 152.54 ...(+30)

### CharMisc  (27 screens, 27 unique)
- titles: Opening Up and Completing Forms | Tell us about donations you carried over to this year. | Regular 50% | What about parking and tolls? | Tell us about noncash donations carried over to this year. | Foster child
- screens: AGILimit20, AGILimit30, CarryoverContribs, CarryoverContribsAnyNonCash, Miles, MilesBasic, OutOfPocket, vActualExpenses, vAGILimits, vCapGainElec, vCarryover, vColumnNames, vFindingCarryovers, vGasOil, vNonDeductCar, vOutOfPocketReqs, vParkingAndTolls, vReimburse, hAttachSupportingDocuments, hCapGain20, hCapGain30, hCouldNotDeduct, hFosterChild, hOpeningForms, hRegular30, hRegular50, hRegular60
- data fields (28): 152.211, 152.211287, 152.211288, 152.211289, 152.211290, 152.211291, 152.212, 152.213, 152.214, 152.215, 152.216, 152.217, 152.218, 152.219, 152.220, 152.221, 152.222, 152.223, 152.224, 152.225, 152.226, 152.227, 152.228, 152.229, 152.230, 152.336, 152.340, rb_NonCashCarryover

### Chtbl  (22 screens, 22 unique)
- titles: Donation Carryover | Charitable Donations From DeductionPro | What about amounts that I transfer tax-free to a charity from an IRA after I'm 70-1/2? | Donated Time | Volunteer Expenses | Do I have to review the donations imported from DeductionPro?
- screens: chtbl1, chtbl2, KindsOfContrib, KindsOfContribBasic, KindsOfContribDedPro, ReviewImported, vBargainSale, vContribsForUseOf, vContribsToIndiv, vDonatedTime, vExchangeStudent, vIntangibles, vIntangiblesII, vPriorYrContribs, vQualCharDistribs, vReviewDedProEntries, hCarryoverXpl, hCashDonationXpl, hDeProXpl, hNonCashXpl, hOutOfPocketXpl, hQualifiedOrg

### ChTxCr  (57 screens, 57 unique)
- titles: Now, tell us who else lived with your children. | Let us know if either of these applies. | Previous Disallowance | Military personnel stationed outside the United States. | What is IRS letter 6419? | Additional Child Tax Credit Federal Disaster Relief
- screens: AdditionalHsholdInfo, AdditionalHsholdInfo2, CTCandCOD, CTCandCODMFJ, Disallowance, HouseholdDetails, HurricaneBoxes, HurricaneEligible, HurricaneNA, HurricanePYEI, HurricaneUseEINo, IntroScreen, MedWaiverACTC, MedWaiverEICResults, MoreAboutLivingSituation, MoreAddresses, NoCTCFEI, NoCTCNoACTCNoTax0EI, NoCTCNoACTCPubPhaseOut, NoMoreQuestions, NoQualifyingChild, OthHsholdMem1, OthHsholdMem2, OthHsholdMemV2, PRresident, RailroadRep, RailroadWorker, RailroadWrkRep, ReasonCreditDenied, RelationshipOfOtherHsholdMember, ResultAllCrMultiDep, ResultAllCrMultiDepNonMFJ, ResultCTCOTC, vWhatIsAdditionalCTC, vWhatIsCTCandODC, vWhatIsQC, vWhatIsRefundableCredit, vWhoCanClaimCTC, vWhoQualifiesCTC, hAdvancePayments, hBonaFidePR, hDisasterZone, hEffectEIandTaxOnCTC, hFStatusLastYear, hhAGITooHigh, hHowEnterQualifyingChild, hHowPaymentDetermined, hInMilitary, hIRSLetter6419, hIslandLiving ...(+7)
- data fields (318): 100.241953, 160.148845, 160.148846, 160.148847, 160.148849, 160.148850, 160.148851, 160.239613, 160.239615, 178.199971, 178.199972, 178.200067, 178.200068, 178.200069, 178.200070, 178.200071, 178.200072, 178.200073, 178.200074, 178.200075, 178.200076, 178.200077, 178.200078, 178.200079, 178.200080, 178.200081, 178.200082, 178.200083, 178.200084, 178.200085, 178.200086, 178.200087, 178.200088, 178.200089, 178.200090, 178.200091, 178.200092, 178.200093, 178.200094, 178.200095, 178.200096, 178.200097, 178.200098, 178.200099, 178.200100, 178.200101, 178.200102, 178.200103, 178.200104, 178.200105, 178.200106, 178.200107, 178.200108, 178.200109, 178.200110, 178.200111, 178.200112, 178.200113, 178.200114, 178.200115 ...(+258)

### Credits  (42 screens, 42 unique)
- titles: Residential Clean Energy Credit | Previous Disallowance | Low Income Housing Credit | Check any credits that apply. | What if I'm claiming a credit for repayment of amounts included in income in an earlier year? | What if the adoption was finalized in 2025
- screens: AOCDeniedPast10Yrs, AOCDeniedReason, Credits_All, Credits_GetReady, LifeChanges_Adopt, MiscBusInvCredits, MiscBusInvCreditsForeign, MiscCreditsForeignW8901, MiscCreditsW8901, vAbout8911, vAdoptionFinalized, vHowKnowAMT, vHowKnowCarryForward, vMFS, vMortMCC, vPellGrant, vRehab, vRepaymentCredit, vSolar, vSomeoneElsePaid, vThisYearCourse, vVoluntaryContribsForSaversCredit, hABLESaversCredit, hAdoption, hF8936_ChangeHighlights, hGenBusCredit, hInvestmentCredit, hLearnMore_AOCDeniedPast10Yrs, hLearnMore_ChildCareCredit_Gateway, hLearnMore_F5695, hLearnMore_F5695_Insulation_Doors_Windows, hLearnMore_F8859, hLearnMore_F8911, hLearnMore_F8936, hLearnMore_FTC, hLearnMore_MCC, hLearnMore_MiscBusCrdts, hLearnMore_PrevOwnCleanVCrdt, hLearnMore_PriorYrAMT, hLearnMore_QualComCleanVCrdt, hLIHCr, hTuition
- data fields (1): rb_AOCDenied

### CredSumm  (24 screens, 24 unique)
- titles: Additional Child Tax Credit | The New Clean Vehicle Credit and the Previously Owned Vehicle Credit | Other Business Credits | Child and Dependent Care Credit | American Opportunity and Lifetime Learning Credits | Excess Social Security
- screens: CreditSummary, CreditSummary_Simple, hAdoption_ExplainThis, hAltRefuelingPropCredit, hEdCredit_ExplainThis, hExcessSocialSecurity, hExplain_AdditionalChild, hExplain_DCHomebuyerCr, hExplain_DisplacedWorkers, hExplain_EIC, hExplain_ElderlyDisabled, hExplain_EnergyHomeimprove, hExplain_ForeignTaxCr, hExplain_MortgageIntCr, hExplain_OtherBusiness, hExplain_PlugInElectricVeh, hExplain_ResidentialEnergy, hExplain_Savers, hExplain_SFamLvCr, hExplain_This_Child_Dep_Care, hExplain_This_Child_Tax_Credit, hExplain_This_Minimum_Tax_Credit, hLearn_more_CreditsSummary, hRebate_ExplainThis

### dedhmiwksspl  (4 screens, 4 unique)
- titles: Deductible Home Mortgage Interest | What if I got more than one Form 1098 and now my interest deduction is limited?
- screens: DedMortIntSum, NoDedMortInt, vMoreThanOne1098, hDedHMInt

### DedSumm  (15 screens, 15 unique)
- titles: What if I find out my spouse is taking the standard deduction? | Investment Interest Expense | Miscellaneous Deductions Not Subject to 2% Limitation | Charitable Donations &ndash; Carryover | Additional Deductions | Medical and Dental Expenses
- screens: DeductionSummary, DeductionSummary_MFS, vSpouseStandard, hAdditionalDeductions, hCharCarryover, hCharCash, hCharNoncash, hExplThisMiscDedNonTwo, hExplThisStateLocalTax, hLearn_More_DeductionSummary, hLearnMore_F4684, hLearnMore_InvIntExp, hMedicalExpenses, hMortgageInt, hQBIDeduction

### Dedux  (36 screens, 36 unique)
- titles: Here's what you should know about Arizona medical expenses. | Vehicle or Depreciable Property Used in an Investment Activity | State Adoption of the Tax Cuts and Jobs Act (TCJA) | What if I itemize deductions, but my spouse later files a return claiming the standard deduction? | No Tax on Overtime | No Tax on Tips
- screens: AZMedicalExpenses, BasicDedsNoStd, BasicDedsNoStd_NoInc, DedsOverviewMFS, Dedux_GetReady, LifeChanges_NewHome, MortgIntPreScreen, MortgIntPreScreen2, WarnDedProUsed, vChariVol, vDetermMethod, vForeignTax, vNotYetKnow, vPaidStateIncTax, vPaidStateSalesTax, vProGuidance_Records, vPropTax, vSalesTax, vSeparateReturns, vSpClaimsStd, hCharitableDonations, hDedCarLoanInt, hDedOT, hDedSenior, hDedTips, hInvestmentProp, hItemized, hLearnMore_Casualty, hLearnMore_F4952, hMedicalAndDental, hMortgageInterest, hPersonalPropTax, hRealEstateTax, hSalesTax, hStandard, hStateImpactTCJA
- data fields (12): 92.185995, 92.199, 92.200, 92.203, 92.20708, 92.20710, 92.20711, 92.20714, 92.27738, rb_AZMed, rb_DedMeth, rb_MoreMortg

### Dep4835K  (260 screens, 260 unique)
- titles: Tell us this property gift's basis. | Business Use | What if I amended my 2024 | Long Production Period Property | Regular Straight Line | What about database software?
- screens: dep4835k1, dep4835k2, dep4835k3, dep4835k7, vAmort_DFR, vDepProp_DFR, vMultActiv_DFR, vNonBusiness_DFR, vUseInYear_DFR, vVehicle_DFR, AcquireAfterSep27, ADSReqd, ADSReqd_PriorYr, ADSYrs, ArmsLength, ArtistsDepreciation, BasicInfo_Business, BasicInfo_Business_LiveAudit, BasicInfo_Investment, BasicInfo_Rental, Basis, Basis_PriorYr, BasisAsst_Conversion, BasisAsst_Conversion_Land, BasisAsst_Conversion_PriorYr, BasisAsst_Gift, BasisAsst_Gift_Land, BasisAsst_Gift_PriorYr, BasisAsst_HowAcquired, BasisAsst_HowAcquired_PriorYr, BasisAsst_Inherit, BasisAsst_Inherit_Land, BasisAsst_Inherit_PriorYr, BasisAsst_Intro, BasisAsst_Intro_PriorYr, BasisAsst_Marital, BasisAsst_Marital_Land, BasisAsst_Marital_PriorYr, BasisAsst_Purchase, BasisAsst_Purchase_Land, BasisAsst_Purchase_Land_PriorYr, BasisAsst_Purchase_PriorYr, BasisAsst_SecondInst, BasisAsst_SecondInst_Land, BasisAsst_SecondInst_Land_PriorYr, BasisAsst_SecondInst_Land_PriorYr_Rental, BasisAsst_SecondInst_Land_Rental, BasisAsst_SecondInst_PriorYr, BasisLand, BasisLand_PriorYr ...(+210)
- data fields (52): 31.12, 31.13, 31.135, 31.136, 31.137, 31.17182, 31.2, 31.203393, 31.261560, 31.27807, 31.295, 31.3, 31.352, 31.357, 31.387, 31.388, 31.391, 31.392, 31.63, 31.86, 31.9, FDepC.isEvProp, rb_AcqPostSep27, rb_ArmsLength, rb_BusAcq, rb_BusEst, rb_BusOver50, rb_BusUseEnt, rb_Carpets, rb_ElectOut, rb_EmplConv, rb_Entertain, rb_Evidence, rb_HowAcquired, rb_HowAcquired_Prior, rb_Lease, rb_ListedQues, rb_MQConv, rb_New, rb_OneHundredBonusDepChoice, rb_OtherProp, rb_OtherS179, rb_Photo, rb_PriorYrBonusDepOptOut, rb_PriorYrMethod, rb_Purchase, rb_RentBus, rb_S179Excep, rb_S179Qual, rb_Software, rb_TangPers, rb_Written

### DepC  (264 screens, 264 unique)
- titles: Tell us this property gift's basis. | Business Use | What if I amended my 2024 | Long Production Period Property | Regular Straight Line | What about database software?
- screens: depc1, depc2, depc3, depc7, vAmort_DC, vDepProp_DC, vDepreciationDef, vImprovements_DC, vItemsUnder500, vMultActiv_DC, vNonBusiness_DC, vUseInYear_DC, vVehicle_DC, hDepreciationCodes, AcquireAfterSep27, ADSReqd, ADSReqd_PriorYr, ADSYrs, ArmsLength, ArtistsDepreciation, BasicInfo_Business, BasicInfo_Business_LiveAudit, BasicInfo_Investment, BasicInfo_Rental, Basis, Basis_PriorYr, BasisAsst_Conversion, BasisAsst_Conversion_Land, BasisAsst_Conversion_PriorYr, BasisAsst_Gift, BasisAsst_Gift_Land, BasisAsst_Gift_PriorYr, BasisAsst_HowAcquired, BasisAsst_HowAcquired_PriorYr, BasisAsst_Inherit, BasisAsst_Inherit_Land, BasisAsst_Inherit_PriorYr, BasisAsst_Intro, BasisAsst_Intro_PriorYr, BasisAsst_Marital, BasisAsst_Marital_Land, BasisAsst_Marital_PriorYr, BasisAsst_Purchase, BasisAsst_Purchase_Land, BasisAsst_Purchase_Land_PriorYr, BasisAsst_Purchase_PriorYr, BasisAsst_SecondInst, BasisAsst_SecondInst_Land, BasisAsst_SecondInst_Land_PriorYr, BasisAsst_SecondInst_Land_PriorYr_Rental ...(+214)
- data fields (52): 31.12, 31.13, 31.135, 31.136, 31.137, 31.17182, 31.2, 31.203393, 31.261560, 31.27807, 31.295, 31.3, 31.352, 31.357, 31.387, 31.388, 31.391, 31.392, 31.63, 31.86, 31.9, FDepC.isEvProp, rb_AcqPostSep27, rb_ArmsLength, rb_BusAcq, rb_BusEst, rb_BusOver50, rb_BusUseEnt, rb_Carpets, rb_ElectOut, rb_EmplConv, rb_Entertain, rb_Evidence, rb_HowAcquired, rb_HowAcquired_Prior, rb_Lease, rb_ListedQues, rb_MQConv, rb_New, rb_OneHundredBonusDepChoice, rb_OtherProp, rb_OtherS179, rb_Photo, rb_PriorYrBonusDepOptOut, rb_PriorYrMethod, rb_Purchase, rb_RentBus, rb_S179Excep, rb_S179Qual, rb_Software, rb_TangPers, rb_Written

### DepEmp  (260 screens, 260 unique)
- titles: Tell us this property gift's basis. | Business Use | What if I amended my 2024 | Long Production Period Property | Regular Straight Line | What about database software?
- screens: depemp1, depemp2, depemp3, depemp7, vAmort_DEmp, vDepProp_DEmp, vMultActiv_DEmp, vNonBusiness_DEmp, vUseInYear_DEmp, vVehicle_DEmp, AcquireAfterSep27, ADSReqd, ADSReqd_PriorYr, ADSYrs, ArmsLength, ArtistsDepreciation, BasicInfo_Business, BasicInfo_Business_LiveAudit, BasicInfo_Investment, BasicInfo_Rental, Basis, Basis_PriorYr, BasisAsst_Conversion, BasisAsst_Conversion_Land, BasisAsst_Conversion_PriorYr, BasisAsst_Gift, BasisAsst_Gift_Land, BasisAsst_Gift_PriorYr, BasisAsst_HowAcquired, BasisAsst_HowAcquired_PriorYr, BasisAsst_Inherit, BasisAsst_Inherit_Land, BasisAsst_Inherit_PriorYr, BasisAsst_Intro, BasisAsst_Intro_PriorYr, BasisAsst_Marital, BasisAsst_Marital_Land, BasisAsst_Marital_PriorYr, BasisAsst_Purchase, BasisAsst_Purchase_Land, BasisAsst_Purchase_Land_PriorYr, BasisAsst_Purchase_PriorYr, BasisAsst_SecondInst, BasisAsst_SecondInst_Land, BasisAsst_SecondInst_Land_PriorYr, BasisAsst_SecondInst_Land_PriorYr_Rental, BasisAsst_SecondInst_Land_Rental, BasisAsst_SecondInst_PriorYr, BasisLand, BasisLand_PriorYr ...(+210)
- data fields (52): 31.12, 31.13, 31.135, 31.136, 31.137, 31.17182, 31.2, 31.203393, 31.261560, 31.27807, 31.295, 31.3, 31.352, 31.357, 31.387, 31.388, 31.391, 31.392, 31.63, 31.86, 31.9, FDepC.isEvProp, rb_AcqPostSep27, rb_ArmsLength, rb_BusAcq, rb_BusEst, rb_BusOver50, rb_BusUseEnt, rb_Carpets, rb_ElectOut, rb_EmplConv, rb_Entertain, rb_Evidence, rb_HowAcquired, rb_HowAcquired_Prior, rb_Lease, rb_ListedQues, rb_MQConv, rb_New, rb_OneHundredBonusDepChoice, rb_OtherProp, rb_OtherS179, rb_Photo, rb_PriorYrBonusDepOptOut, rb_PriorYrMethod, rb_Purchase, rb_RentBus, rb_S179Excep, rb_S179Qual, rb_Software, rb_TangPers, rb_Written

### DepFarm  (260 screens, 260 unique)
- titles: Tell us this property gift's basis. | Business Use | What if I amended my 2024 | Long Production Period Property | Regular Straight Line | What about database software?
- screens: depfarm1, depfarm2, depfarm3, depfarm7, vAmort_DFarm, vDepProp_DFarm, vMultActiv_DFarm, vNonBusiness_DFarm, vUseInYear_DFarm, vVehicle_DFarm, AcquireAfterSep27, ADSReqd, ADSReqd_PriorYr, ADSYrs, ArmsLength, ArtistsDepreciation, BasicInfo_Business, BasicInfo_Business_LiveAudit, BasicInfo_Investment, BasicInfo_Rental, Basis, Basis_PriorYr, BasisAsst_Conversion, BasisAsst_Conversion_Land, BasisAsst_Conversion_PriorYr, BasisAsst_Gift, BasisAsst_Gift_Land, BasisAsst_Gift_PriorYr, BasisAsst_HowAcquired, BasisAsst_HowAcquired_PriorYr, BasisAsst_Inherit, BasisAsst_Inherit_Land, BasisAsst_Inherit_PriorYr, BasisAsst_Intro, BasisAsst_Intro_PriorYr, BasisAsst_Marital, BasisAsst_Marital_Land, BasisAsst_Marital_PriorYr, BasisAsst_Purchase, BasisAsst_Purchase_Land, BasisAsst_Purchase_Land_PriorYr, BasisAsst_Purchase_PriorYr, BasisAsst_SecondInst, BasisAsst_SecondInst_Land, BasisAsst_SecondInst_Land_PriorYr, BasisAsst_SecondInst_Land_PriorYr_Rental, BasisAsst_SecondInst_Land_Rental, BasisAsst_SecondInst_PriorYr, BasisLand, BasisLand_PriorYr ...(+210)
- data fields (52): 31.12, 31.13, 31.135, 31.136, 31.137, 31.17182, 31.2, 31.203393, 31.261560, 31.27807, 31.295, 31.3, 31.352, 31.357, 31.387, 31.388, 31.391, 31.392, 31.63, 31.86, 31.9, FDepC.isEvProp, rb_AcqPostSep27, rb_ArmsLength, rb_BusAcq, rb_BusEst, rb_BusOver50, rb_BusUseEnt, rb_Carpets, rb_ElectOut, rb_EmplConv, rb_Entertain, rb_Evidence, rb_HowAcquired, rb_HowAcquired_Prior, rb_Lease, rb_ListedQues, rb_MQConv, rb_New, rb_OneHundredBonusDepChoice, rb_OtherProp, rb_OtherS179, rb_Photo, rb_PriorYrBonusDepOptOut, rb_PriorYrMethod, rb_Purchase, rb_RentBus, rb_S179Excep, rb_S179Qual, rb_Software, rb_TangPers, rb_Written

### DepInv  (260 screens, 260 unique)
- titles: Tell us this property gift's basis. | Confirm your investment depreciation. | Business Use | Land Only | What if I amended my 2024 | Long Production Period Property
- screens: depinv1, depinv2, depinv3, depinv7, vAmort_DInv, vDepProp_DInv, vMultActiv_DInv, vNonBusiness_DInv, vUseInYear_DInv, vVehicle_DInv, AcquireAfterSep27, ADSReqd, ADSReqd_PriorYr, ADSYrs, ArmsLength, ArtistsDepreciation, BasicInfo_Business, BasicInfo_Business_LiveAudit, BasicInfo_Investment, BasicInfo_Rental, Basis, Basis_PriorYr, BasisAsst_Conversion, BasisAsst_Conversion_Land, BasisAsst_Conversion_PriorYr, BasisAsst_Gift, BasisAsst_Gift_Land, BasisAsst_Gift_PriorYr, BasisAsst_HowAcquired, BasisAsst_HowAcquired_PriorYr, BasisAsst_Inherit, BasisAsst_Inherit_Land, BasisAsst_Inherit_PriorYr, BasisAsst_Intro, BasisAsst_Intro_PriorYr, BasisAsst_Marital, BasisAsst_Marital_Land, BasisAsst_Marital_PriorYr, BasisAsst_Purchase, BasisAsst_Purchase_Land, BasisAsst_Purchase_Land_PriorYr, BasisAsst_Purchase_PriorYr, BasisAsst_SecondInst, BasisAsst_SecondInst_Land, BasisAsst_SecondInst_Land_PriorYr, BasisAsst_SecondInst_Land_PriorYr_Rental, BasisAsst_SecondInst_Land_Rental, BasisAsst_SecondInst_PriorYr, BasisLand, BasisLand_PriorYr ...(+210)
- data fields (52): 31.12, 31.13, 31.135, 31.136, 31.137, 31.17182, 31.2, 31.203393, 31.261560, 31.27807, 31.295, 31.3, 31.352, 31.357, 31.387, 31.388, 31.391, 31.392, 31.63, 31.86, 31.9, FDepC.isEvProp, rb_AcqPostSep27, rb_ArmsLength, rb_BusAcq, rb_BusEst, rb_BusOver50, rb_BusUseEnt, rb_Carpets, rb_ElectOut, rb_EmplConv, rb_Entertain, rb_Evidence, rb_HowAcquired, rb_HowAcquired_Prior, rb_Lease, rb_ListedQues, rb_MQConv, rb_New, rb_OneHundredBonusDepChoice, rb_OtherProp, rb_OtherS179, rb_Photo, rb_PriorYrBonusDepOptOut, rb_PriorYrMethod, rb_Purchase, rb_RentBus, rb_S179Excep, rb_S179Qual, rb_Software, rb_TangPers, rb_Written

### DepRent  (261 screens, 260 unique)
- titles: Tell us this property gift's basis. | Business Use | What if I amended my 2024 | Long Production Period Property | Regular Straight Line | What about database software?
- screens: deprent1, deprent2, deprent3, deprent7, vAmort_DRent, vImprovements, vItemsUnder500, vMultActiv_DRent, vNonBusiness_DRent, vUseInYear_DRent, vVehicle_DRent, AcquireAfterSep27, ADSReqd, ADSReqd_PriorYr, ADSYrs, ArmsLength, ArtistsDepreciation, BasicInfo_Business, BasicInfo_Business_LiveAudit, BasicInfo_Investment, BasicInfo_Rental, Basis, Basis_PriorYr, BasisAsst_Conversion, BasisAsst_Conversion_Land, BasisAsst_Conversion_PriorYr, BasisAsst_Gift, BasisAsst_Gift_Land, BasisAsst_Gift_PriorYr, BasisAsst_HowAcquired, BasisAsst_HowAcquired_PriorYr, BasisAsst_Inherit, BasisAsst_Inherit_Land, BasisAsst_Inherit_PriorYr, BasisAsst_Intro, BasisAsst_Intro_PriorYr, BasisAsst_Marital, BasisAsst_Marital_Land, BasisAsst_Marital_PriorYr, BasisAsst_Purchase, BasisAsst_Purchase_Land, BasisAsst_Purchase_Land_PriorYr, BasisAsst_Purchase_PriorYr, BasisAsst_SecondInst, BasisAsst_SecondInst_Land, BasisAsst_SecondInst_Land_PriorYr, BasisAsst_SecondInst_Land_PriorYr_Rental, BasisAsst_SecondInst_Land_Rental, BasisAsst_SecondInst_PriorYr, BasisLand ...(+210)
- data fields (52): 31.12, 31.13, 31.135, 31.136, 31.137, 31.17182, 31.2, 31.203393, 31.261560, 31.27807, 31.295, 31.3, 31.352, 31.357, 31.387, 31.388, 31.391, 31.392, 31.63, 31.86, 31.9, FDepC.isEvProp, rb_AcqPostSep27, rb_ArmsLength, rb_BusAcq, rb_BusEst, rb_BusOver50, rb_BusUseEnt, rb_Carpets, rb_ElectOut, rb_EmplConv, rb_Entertain, rb_Evidence, rb_HowAcquired, rb_HowAcquired_Prior, rb_Lease, rb_ListedQues, rb_MQConv, rb_New, rb_OneHundredBonusDepChoice, rb_OtherProp, rb_OtherS179, rb_Photo, rb_PriorYrBonusDepOptOut, rb_PriorYrMethod, rb_Purchase, rb_RentBus, rb_S179Excep, rb_S179Qual, rb_Software, rb_TangPers, rb_Written

### DirDep  (3 screens, 3 unique)
- titles: Why would I want to apply my refund this way? | Do You Want to Apply Your Refund to 2026 | Refund Amount to Apply
- screens: AmtToApply, DirDepGWNoRefundYet, vWhyApplyRefund
- data fields (2): 92.546, rb_NoRefundApplyRefund

### Div  (86 screens, 86 unique)
- titles: Enter your nonqualified dividends. | Here's what you should know about restricted stock dividends. | Enter state-exempt dividends for Issuer1099Div | Foreign Taxes | Subject to AMT | What if my holdings have different percentages?
- screens: div1, div2, div3, div7, Adjustments, AdjustmentsQualDiv, AmountMissing, AmountMissingExempt, Box1aTooSmall, ExemptInfo, ExemptInfoNotMarried, F1099DIVForm, F1099DIVForm_LLY, F1099DIVForm_LLY_Premium, F1099DIVForm_Premium, F1099DIVFormNotMarried, F1099DIVFormNotMarried_LLY, F1099DIVFormNotMarried_LLY_Premium, F1099DIVFormNotMarried_Premium, F1099DIVNoStatement, F1099DIVNoStatement_Premium, F1099DIVNoStmtNotMarried, F1099DIVNoStmtNotMarried_Premium, Form1099ForActualOwner, Form1099ForActualOwnerMFJ, LowerKGRate, NomAdjustAmount, NomineeExempt, NonTaxExpl, NYInfo, PayerAndAmountMissing, PayerAndAmountMissingExempt, PayerMissing, QualDivAdjAmt, RestrictedKG, RestrictedStock_PremiumExpert, Section1202Gain, StateExemptInfo, TreasuryInterest, TreasuryInterestAbbrev, TreasuryInterestOther, TreasuryInterestOtherAbbrev, vChildDividends, vCompletingForms, vConsolidatedStatement, vCopiesOfForms, vCorrect1099, vFormNotReceivedDiv, vIRADividends, vKGLoss ...(+36)
- data fields (55): 164.10, 164.11, 164.12, 164.13, 164.133765, 164.133766, 164.133767, 164.14, 164.144115, 164.144116, 164.144117, 164.15, 164.16, 164.17, 164.184590, 164.184591, 164.184592, 164.184593, 164.184594, 164.184595, 164.184596, 164.184597, 164.184598, 164.184599, 164.184600, 164.184601, 164.184602, 164.184603, 164.184604, 164.184605, 164.184606, 164.184607, 164.184608, 164.184609, 164.184610, 164.184611, 164.204690, 164.226926, 164.226927, 164.32, 164.40, 164.41, 164.42, 164.5, 164.52, 164.53298, 164.6, 164.60, 164.61, 164.65, 164.7, 164.8, 164.9, rb_TypeAdj, rb_WhoOwned

### Dpndt  (161 screens, 161 unique)
- titles: What's a claim? | If my child can't get an SSN, what form do I use? | What's adjusted gross income (AGI)? | Will DepName | You can claim your dependent. | Your spouse can't be your dependent.
- screens: dpndt1, dpndt2, dpndt3, dpndt4, dpndt7, AdoptChild, AgencyPlacement, AttachDocumentation, AuditSpouseDependentMFJ, BasicInformation, ChildOfDivorce, ChildResidence, ChkRelationship, CitizenOrOther, ClaimThisYr, ClaimThisYr2, ClaimYrStudent, ConfirmNameSSN, CustodialParent, CustParentWaiver, DependentOverEighteen, DependentOverTwentyThree, DepFilesJoint, Disabled, DisabledGrossIncome, DivOrSepParent, DQSupport, DurationOfRelease, ElderParentGI, ExemptionAgreement, FailsGITest, FailsRelTest, FailsRelTestHelp, FailsRelTestQuickEntry, FosterPTTTip, FullTimeStudent, FutureYearsCovered, GrossIncome, HigherAGIMFS, HigherAGIOtherPerson, JtReturnException, LifeChanges_NewBaby, LivedWithOrNot, LivedWithOrNotHelp, LivedWParents, LivedWPersons, MakeSureOtherComplies, MemberHshldAllYr, MSAAndMSANamesYou, MultipleSupportK ...(+111)
- data fields (51): 113.1071, 113.1093, 113.1095, 113.1099, 113.1103, 113.1104, 113.1105, 113.1106, 113.1107, 113.1108, 113.1109, 113.1124, 113.1141, 113.1145, 113.18020, 113.187195, 113.210273, 113.22913, 113.22915, 113.258703, 113.53252, 113.53253, rb_AdoptChild, rb_AgencyPlacement, rb_AltDep, rb_ChildResidence, rb_ChooseDep, rb_Citizen, rb_DepFiledJt, rb_DisabledDep, rb_DpndtWks11, rb_DpndtWks6, rb_DpndtWks7, rb_Duration, rb_ExAgmt, rb_F8332, rb_FTStudent, rb_GITest, rb_HsHld, rb_LivedWParents, rb_LivedWPersons, rb_LvdAprt, rb_OwnSupport, rb_PersonMarried, rb_QCAnother, rb_RelClaim, rb_RelLive, rb_SupClaim, rb_TopAGI, rb_WhoClaim, rb_WhoPar

### DriversLicense  (10 screens, 10 unique)
- titles: Driver's License or State-Issued ID | What should I do if I have a license or ID but don't want to provide it? | What should I choose if I have a foreign driver's license or ID? | Where can I find the issue date on my Missouri license? | Driver's License or ID Details | What if my new license or ID is in the mail?
- screens: DLType, DLTypeMFJ, IDInfoSP, IDInfoTP, NYDocNumberSP, NYDocNumberTP, vForeignID, vInTheMail, vMOIssueDate, vNotProvided
- data fields (12): 92.184582, 92.184583, 92.184584, 92.184585, 92.184586, 92.184587, 92.184588, 92.184589, 92.195617, 92.195618, rb_IDTypeSP, rb_IDTypeTP

### Educator  (10 screens, 10 unique)
- titles: What if I'm taking the standard deduction? | Qualified Expenses | Let's work on your educator expenses. | What if my spouse and I are both teachers? | What about expenses over the limit? | Do I need to have receipts for my expenses?
- screens: Expenses, ExpensesMFJ, NewTaxLawEducator, NewTaxLawEducatorBoxNotChecked, vBothTeachers, vExcessAmounts, vNeedReceipts, vTakingStdDed, hEligibleEducator, hQualExpenses
- data fields (3): 57.325, 57.326, rb_EdExp

### End  (8 screens, 8 unique)
- titles: Fix Errors on Your Federal Return | Update Now | Review Your Remaining Imported Information | Why are updates required? | Do I have to correct all Data Verifications before filing my return? | How do I go back and look at an Interview topic again?
- screens: end1, end4, DraftForms, endErrors, vHowToRevisit, vReportCorrectWarningsFAQ, vWhereDoIEnter, vWhyUpdates

### EndPlan  (1 screens, 1 unique)
- titles: Completed Planning Topics
- screens: Endplan1

### ExcContribPen  (63 screens, 63 unique)
- titles: Prior Year Excess Coverdell ESA Contribution Penalty | Coverdell ESA Distributions | Prior Year Excess Archer MSA Contribution Penalty | ABLE Rollover | Excess ABLE Account Contributions | Excess Contributions
- screens: ExcContribPen1, ExcContribPen2, ExcContribPen3, ExcContribPen4, ExcContribPen5, ExcContribPen6, CurrentExcessContribsRothIRA, CurrentExcessContribsTradIRA, EarlierExcessContribsESA_LLY, EarlierExcessContribsHSA_LLY, EarlierExcessContribsMSA_LLY, EarlierExcessContribsRothIRA_LLY, EarlierExcessContribsRothIRAAmt, EarlierExcessContribsRothIRAYesNo, EarlierExcessContribsTradIRA_LLY, EarlierExcessContribsTradIRAAmt, EarlierExcessContribsTradIRAYesNo, EarlierExcessEdContribsAmt, EarlierExcessEdContribsYesNo, EarlierExcessHSAContribsAmt, EarlierExcessHSAContribsYesNo, EarlierExcessMSAContribsAmt, EarlierExcessMSAContribsYesNo, EdContributionCredit, EdDistribs, EdValue, EdValueLess, ExcessABLEContribs, ExcessContribsIntro, ExcessEdContribs, ExcessHSAContribs, HSAContributionCredit, HSAValue, HSAValueLess, MSAContributionCredit, MSAValue, MSAValueLess, RothValue, RothValueLess, TaxOnExcessABLE, TaxOnExcessEd, TaxOnExcessHSA, TaxOnExcessMSA, TaxOnExcessRoth, TaxOnExcessTrad, TradValue, TradValueLess, vMoreInfoPenalties, vNoEarlierIRAExcessTopic, vPreviousYearsExcessTopic ...(+13)
- data fields (28): 40.11, 40.11330, 40.169564, 40.169565, 40.19601, 40.198, 40.203, 40.20555, 40.209, 40.220, 40.221, 40.227, 40.239, 40.250, 40.260, 40.261, 40.262, 40.265, rb_EarlierExcessContribRothIRA, rb_EarlierExcessContribTradIRA, rb_EarlierExcessEdContribs, rb_EarlierExcessHSAContrib, rb_EarlierExcessMSAContrib, rb_EdValueLess, rb_HSAValueLess, rb_MSAValueLess, rb_RothValueLess, rb_TradValueLess

### ExcessDefComp  (28 screens, 28 unique)
- titles: Corrective Distribution | What about corrective distributions of designated Roth contributions? | Excess Salary Deferrals | Excess Retirement Contributions | TPNameFirst | What if I have more than one retirement plan?
- screens: BelowLimit_Self, BelowLimit_Spouse, CorrDist, CorrDistSp, DeferralLimit, DeferralLimit_MFJSelf, DeferralLimit_MFJSpouse, ExcessDeferral, ExcessDeferral_MFJSelf, ExcessDeferral_MFJSpouse, HigherLimitQues, HigherLimitQues_MFJSelf, HigherLimitQues_MFJSpouse, HigherLimitQues_Roth, HigherLimitQues_Roth_MFJSelf, HigherLimitQues_Roth_MFJSpouse, NoEDC, NoEDC_Self, NoEDC_Spouse, vCatchUpAdjustments, vCorrectiveDist, vCorrectiveDistrib_Roth, vLowerLimit, vMultiplePlans, vSec457Adjustments, vSec457Adjustments_Form, hRetPlanLimit, hRetPlanLimit_SIMPLE401kExpl
- data fields (7): 181.26, 181.27, 181.50, 181.51, rb_ContinueTP, rb_DefLimit, rb_SpDefLimit

### ExcessSS  (3 screens, 3 unique)
- titles: Credit for Social Security Overpayment | No Excess Social Security Tax Withheld | What if one employer withheld too much Social Security tax?
- screens: ExcessSocSec, NoExcessSocSec, vOneEmployer

### F1040V  (3 screens, 3 unique)
- titles: Tell Us the Amount You'll Pay When You File | Not Needed | Will You Pay The Amount You Owe?
- screens: ActualAmt, NotNeeded, PayFullAmtQues
- data fields (2): 136.30, rb_group

### F1040X  (47 screens, 47 unique)
- titles: Can I have my refund on Form 1040-X deposited directly into my bank account? | What do I enter if I'm making a combat pay election for the Earned Income Credit? | What if I want to file a 2025 | Amended Return Instructions | Original Dependents | Refund Amount to Apply to Estimated Taxes
- screens: F1040X1, F1040X2, AmendedReturnProcess, ApplyToEstimated, ChangesComplete, CompletedSteps, CreateAmendedCopy, Explanation, FilingInstructions, MakeACopy, MakeChanges, MoreInfo, PECF_MFJ_SP, PECF_MFJ_TP, PECF_MFJ_TPandSP, PECF_NonMFJ, PrintAmendedReturn, PrintOrig1040X, RandomAccessGateway, ReturnSummary, RunErrorCheck, TaxesPaid, vAcctMeth, vActiveDuty, vCarrybackCreditLoss, vChangingFS, vChangingIRA, vChildReturn, vCombatInjuredVet, vCombatPay, vCurrentTaxYear, vDeadline, vDirectDepositForm1040XRefund, vEarlierYear, vElection, vInclude1040, vNannyTax, vNewAddress, vNoStateReturnYet, vStateReturn, vStatOfLims, vTaxIDTiming, hBizCred, hLearnMore_AmendedReturn, hNOL, hOverpmt, hPrint
- data fields (15): 88.153, 88.154, 88.155, 88.156, 88.157, 88.158, 88.197, 88.72220, 88.72221, 88.92, rb_Done, rb_Gateway, rb_PECF_SP, rb_PECF_TP, rb_Ready

### F1095A  (14 screens, 14 unique)
- titles: Values Shown on Form 1095-A | Form 1095-A Lines 1 - 20 | Should I enter a void 1095-A? | Do I need to add a 1095-A for someone I enrolled in the marketplace but I'm not claiming as a dependent? | Age 65 or Older and Enrolled in Marketplace Plan | If my 1095-A has the corrected box checked off, what should I do?
- screens: F1095A3, ColumnBEmpty, EnrolledWhileOver65, MonthlyAmtsDifferent, MonthlyAmtsIdentical, RecipientAndCoverage, vCorrectedForm1095A, vNotClaimingAsDependent, vVoidForm1095A, hCorrectValues, hIncludedForm1095As, hIncorrectSLCSP, hMonthlyPremiumAmount, hSharedPolicyAllocation
- data fields (87): 152480.152498, 152480.152499, 152480.152500, 152480.152501, 152480.152513, 152480.152514, 152480.152515, 152480.152516, 152480.152517, 152480.152518, 152480.152519, 152480.152520, 152480.152521, 152480.152522, 152480.152523, 152480.152524, 152480.152525, 152480.152526, 152480.152527, 152480.152528, 152480.152529, 152480.152530, 152480.152531, 152480.152532, 152480.152533, 152480.152534, 152480.152535, 152480.152536, 152480.152537, 152480.152538, 152480.152540, 152480.152541, 152480.152543, 152480.152544, 152480.152546, 152480.152547, 152480.152549, 152480.152550, 152480.152552, 152480.152553, 152480.152555, 152480.152556, 152480.152558, 152480.152559, 152480.152561, 152480.152562, 152480.152564, 152480.152565, 152480.152567, 152480.152568, 152480.152570, 152480.152571, 152480.152573, 152480.152574, 152480.152576, 152480.152853, 152480.152854, 152480.152855, 152480.152856, 152480.152857 ...(+27)

### F1098E  (43 screens, 43 unique)
- titles: How much interest can you deduct? | What if I deferred my loan, but my loan accrued interest? | Tell us about your Form 1098-E. | We've successfully imported your student loan interest! | Let's work on your student loan interest (Form 1098-E). | You can deduct your student loan interest!
- screens: F1098E1, F1098E2, F1098E3, F1098E7, CombinedLenderAndInterest1098E, CombinedLenderAndInterest1098EMFJ, CombinedLenderAndInterestNo1098E, CombinedLenderAndInterestNo1098EMFJ, DeductibleStudentLoanInterest, FullDeduction, NoDeduction, NoDeductionMFS, NoDeudctionClaimedByAnother, NoDeudctionClaimedByAnotherSp, PartialDeduction, QuestionReDeductibility, ReceivedForm1098E, SPClaimedByAnother, TPClaimedByAnother, vHowKnowIntDed, vNo1098E, vNo1098EMulti, vNo1098ERandomAccess, vNotGet1098E, vNotSureMFS, vOrigLenderDif, vPaidFordep, vPaidFordepAmt, vProGuidance_NameOnLoan, vQualify, vRelativeLoanTopic, vStudentLoanDebtReliefTaxable, vStudentLoanTopic, vvBondOrESA, vvEmployerReimburse, vvRecdScholarship, vvRelativeLoan, vWhereFinalDed, vWhyChange, hLearnMore_Qualifications, hOrigFeesAndCapInt, hPartialPhase, hQualifyStuLnInt
- data fields (9): 162.14, 162.24, 162.39, 162.40, rb_SPClaimed, rb_TPClaimed, rb_XAllDed, rb_XRecFrm, rb_XSelfSp

### F1098KB  (150 screens, 150 unique)
- titles: Why can't I deduct all the points I paid this year? | You told us you had a farming business in 2025 | Your mortgage interest deduction is $ | Did you pay any points in 2025 | We need to know about your farm businesses. | Benefit Home
- screens: F1098KB1, F1098KB2, F1098KB3, F1098KB7, AdditionalPtsDescrip, AmortizablePoints, AmortLoanInfo, AmortLoanInfoLLY, AnotherPerson, AnotherPersonMFJ, AnyPointsQues_Asst, AvgMtgBalance, BasicAmtsForm1098Premium, BasicAmtsForm1098Premium_RentHomeOff, BasicAmtsNoForm1098, BenefitHome, BothLenderName, BuyFromRecip, Consolidated, Consolidated_LLY, ConsolidatedMFJ, ConsolidatedMFJ_LLY, ConsolidatedMFJRental, ConsolidatedMFJRental_LLY, ConsolidatedRental, ConsolidatedRental_LLY, ContinueInterview, ExistingFarm1, ExistingFarm2, ExistingFarm3, FarmAllocPct, FinancialInstitution, Form1098, HELOC1098No, HELOC1098Yes, HomeMortgageAssistant, ImportFirstInst, ImportTransition, InsurancePremiums, InsurancePremiums_Extra, IntNotOn1098, MortgageInterestDeduction, MortgageIntStatement, No1098MortgIntPaid, No1098PointsPaid, OtherAmountsForm1098, OtherInsuranceQues_Asst, OtherInterestQues_Asst, OtherPointsQues_Asst, PriorYrAmortPointsQues_Asst ...(+100)
- data fields (52): 130.121, 130.132167, 130.132168, 130.132169, 130.14, 130.144, 130.145, 130.146, 130.147, 130.150, 130.151, 130.152, 130.153, 130.154, 130.156, 130.158, 130.171, 130.172, 130.173, 130.18057, 130.210277, 130.210278, 130.210279, 130.237782, 130.237783, 130.242350, 130.242351, 130.250556, 130.36, 130.42567, 130.42568, 130.45353, 130.53299, 130.59, 130.61, 130.62, 130.64, 92.817, F1098.dTotalInsurance, F1098.Points1098, F1098.RETaxes, rb_AnyPointsAsst, rb_BenefitHome, rb_Download, rb_FarmAlloc, rb_IntRefund, rb_On1098, rb_OtherIntAsst, rb_OtherPerson, rb_PriorYrAmortPts, rb_SoldHome, rb_WhoOwned

### F1099B  (8 screens, 8 unique)
- titles: Where do I find Collectibles? | Where do I enter sales without a 1099-B? | FATCA | Tell us about this 1099-B. | Tell us about your 1099-Bs. | Do I enter my child's 1099-B sales here?
- screens: F1099B3, F1099B7, Description, vchilds1099b, vNoForm1099B, vvchilds1099b, vWhereCollectibles, hFATCA
- data fields (4): 195607.195623, 195607.195629, 195607.195630, 195607.195631

### F1099DA  (10 screens, 10 unique)
- titles: Tell us the state information on your 1099-DA. | Great news! We've imported your 1099-DA digital asset sales | Let's report your 1099-DA digital asset sales. | Tell us about this 1099-DA. | Tell us about the issuer of your 1099-DA. | Tell us about the activities on your 1099-DA. (Boxes 7 - 12b)
- screens: F1099DA3, F1099DA7, Box14_16, Box1a_1i, Box1a_1i_NotMFJ, Box2_6, Box7_12b, FilerInfo, Whose1099DA, vWithout1099DA
- data fields (38): 257467.257476, 257467.257477, 257467.257479, 257467.257480, 257467.257481, 257467.257483, 257467.257484, 257467.257485, 257467.257487, 257467.257501, 257467.257502, 257467.257503, 257467.257504, 257467.257505, 257467.257506, 257467.257507, 257467.257508, 257467.257509, 257467.257510, 257467.257511, 257467.257512, 257467.257514, 257467.257515, 257467.257516, 257467.257517, 257467.257518, 257467.257521, 257467.257522, 257467.257523, 257467.257524, 257467.257525, 257467.257526, 257467.257527, 257467.257528, 257467.257529, 257467.257530, 257467.258580, rb_F1099Sel

### F1099GR  (109 screens, 109 unique)
- titles: Your state or local refund won't be taxed. | Your tax situation is a special case. | Do any of these special cases apply? | What's the address on your 1099-G? | Your state refund won't be taxed. | What's on your 2024
- screens: F1099GR1, F1099GR2, F1099GR3, vNYS, vPropTaxRefund, h1099GStateTaxRebBox2, AmtItemizedLastYr, AMTScreen, BadNews, BoxesLastYr, BusinessIncome, ConfirmTaxYear, DeductedSalesTax, DeterminePYSalesTax, DidSpItemize, DoSpecialCasesApply, EmployeeNameAndAddressGroup, EmployeeNameGroup, EnterAgPmt, FilingStatusLastYr, GoodNews, HOHDeleteSpouseForm, IncomeTaxDeductedLastYr, IndianaCountyInfo, ItemizedLastYr, KindOf1099G, LLYRefundScreen, LLYRefundScreenMFJ, LocalRate_Combined, LocalRate_Combined_Earlier, LocalRate_Regular, LocalRate_Regular_Earlier, MarketGainAdvice, MFSDeleteSpouseForm, MFSLastYrTaxReturn, MFSLastYrTaxReturnNoSales, MissingPYInfo_LiveAudit, NeedState, NeedStateRefund, NonMFSLastYrTaxReturn, NonMFSLastYrTaxReturnNoSales, NotLessThanZero, OtherPayment, OtherPaymentMFJ, PayerAndRecipInfo1, Pub525AmtAMT, PYTaxReturn, PYTaxReturnForLLY, RefundScreen, RefundScreenMFJ ...(+59)
- data fields (49): 1.27699, 1.38342, 1.38343, 1.38344, 1.38346, 1.38347, 1.38349, 1.38350, 1.38351, 1.38352, 1.38353, 1.38355, 1.38397, 149.220060, 149.220061, 149.27813, 149.27814, 149.33, 149.34, 149.41, 165.13, 165.14, 165.162018, 165.162019, 165.20719, 165.20720, 165.20721, 165.20722, 165.20723, 165.30, 165.31, 165.32, 165.33, 165.35, 165.36, 165.37, 165.38, 165.39, 165.43, 165.53, CfwdWks.NumAddlDedns, rb_FilingStatus, rb_ItemLastYear, rb_KindOf1099G, rb_MFSeparate, rb_RefNotSim, rb_SalesTax, rb_WantToDetermine, rb_WhoOwned

### F1099GU  (108 screens, 107 unique)
- titles: Your state or local refund won't be taxed. | Your tax situation is a special case. | Do any of these special cases apply? | What's the address on your 1099-G? | Your state refund won't be taxed. | What's on your 2024
- screens: F1099GU1, F1099GU2, F1099GU3, vRefund, vTheftReport, AmtItemizedLastYr, AMTScreen, BadNews, BoxesLastYr, BusinessIncome, ConfirmTaxYear, DeductedSalesTax, DeterminePYSalesTax, DidSpItemize, DoSpecialCasesApply, EmployeeNameAndAddressGroup, EmployeeNameGroup, EnterAgPmt, FilingStatusLastYr, GoodNews, HOHDeleteSpouseForm, IncomeTaxDeductedLastYr, IndianaCountyInfo, ItemizedLastYr, KindOf1099G, LLYRefundScreen, LLYRefundScreenMFJ, LocalRate_Combined, LocalRate_Combined_Earlier, LocalRate_Regular, LocalRate_Regular_Earlier, MarketGainAdvice, MFSDeleteSpouseForm, MFSLastYrTaxReturn, MFSLastYrTaxReturnNoSales, MissingPYInfo_LiveAudit, NeedState, NeedStateRefund, NonMFSLastYrTaxReturn, NonMFSLastYrTaxReturnNoSales, NotLessThanZero, OtherPayment, OtherPaymentMFJ, PayerAndRecipInfo1, Pub525AmtAMT, PYTaxReturn, PYTaxReturnForLLY, RefundScreen, RefundScreenMFJ, RefundTaxFree ...(+57)
- data fields (48): 1.27699, 1.38342, 1.38343, 1.38344, 1.38346, 1.38347, 1.38349, 1.38350, 1.38351, 1.38352, 1.38353, 1.38355, 1.38397, 149.220060, 149.220061, 149.27813, 149.27814, 149.33, 149.34, 149.41, 165.14, 165.162018, 165.162019, 165.20719, 165.20720, 165.20721, 165.20722, 165.20723, 165.30, 165.31, 165.32, 165.33, 165.35, 165.36, 165.37, 165.38, 165.39, 165.43, 165.53, CfwdWks.NumAddlDedns, rb_FilingStatus, rb_ItemLastYear, rb_KindOf1099G, rb_MFSeparate, rb_RefNotSim, rb_SalesTax, rb_WantToDetermine, rb_WhoOwned

### F1099KC  (12 screens, 12 unique)
- titles: What if my Form 1099-K includes more than one type of income or income for more than one business? | Tell us about the filer on your 1099-K | Tell us about any 1099-K income for this business. | Did this business have income reported on 1099-K? | What if my Form 1099-K includes more than one type of income? | Where do I enter amounts from Form 1099-K, Box 5?
- screens: F1099KC1, F1099KC2, F1099KC3, F1099KC7, v1099KFinRpts, v1099KMoreThanOneIncAlt, Box1to8F1099K, F1099kDetails, FilerInfo, v1099KOthIncMoreThanOne, vWhereEnterMore, hGrossAmount
- data fields (12): 186662.186685, 186662.186689, 186662.186690, 186662.186691, 186662.186692, 186662.186693, 186662.186694, 186662.186720, 186662.239290, F1099K.Nonemplcomp, rb_PCor3rdPN, rb_PSEorEPF

### F1099KF  (8 screens, 8 unique)
- titles: What if my Form 1099-K includes more than one type of income? | Now, tell us if you have a 1099-K for this farm. | Where do I enter amounts from Form 1099-K, Box 5? | Box 1a Gross Amount | Tell us about the activities on your 1099-K | Tell us about the filer on your 1099-K
- screens: F1099KF3, F1099KF7, Box1to8F1099K, F1099kDetails, FilerInfo, v1099KOthIncMoreThanOne, vWhereEnterMore, hGrossAmount
- data fields (12): 186662.186685, 186662.186689, 186662.186690, 186662.186691, 186662.186692, 186662.186693, 186662.186694, 186662.186720, 186662.239290, F1099K.Nonemplcomp, rb_PCor3rdPN, rb_PSEorEPF

### F1099KFR  (8 screens, 8 unique)
- titles: What if my Form 1099-K includes more than one type of income? | Now, tell us if you have a 1099-K for this farm rental | Where do I enter amounts from Form 1099-K, Box 5? | Box 1a Gross Amount | Tell us about the activities on your 1099-K | Tell us about the filer on your 1099-K
- screens: F1099KFR3, F1099KFR7, Box1to8F1099K, F1099kDetails, FilerInfo, v1099KOthIncMoreThanOne, vWhereEnterMore, hGrossAmount
- data fields (12): 186662.186685, 186662.186689, 186662.186690, 186662.186691, 186662.186692, 186662.186693, 186662.186694, 186662.186720, 186662.239290, F1099K.Nonemplcomp, rb_PCor3rdPN, rb_PSEorEPF

### F1099KOthInc  (24 screens, 24 unique)
- titles: Did this business have income reported on 1099-K? | Whose 1099-K is this? | Certain other taxable income | Non-taxable, hobby, other taxable income, incorrect 1099-K | What if I received a 1099-K showing a loss from the sale of personal property? | Non-taxable and hobby income 1099-K summary
- screens: F1099KOthInc1, F1099KOthInc2, F1099KOthInc3, F1099KOthInc7, Box1to8, FilerInfo, GotYouCovered, HobbyIncome, NontaxableAmount, OtherTaxInc, OtherTaxIncZeroNonTax, SumScreen, WhatIncomeType, Whose1099K, v1099KOthInc_MoreThanOne, vF1099KlossPersProp, vOther1099M, vWhatIsPAC, h1099KCertOthTaxInc, h1099KCostOfGoods, h1099KHobbyInc, h1099KNonTaxableInc, hGrossAmount, hIncorrect1099K
- data fields (15): 186662.186685, 186662.186689, 186662.186690, 186662.186691, 186662.186692, 186662.186693, 186662.186694, 186662.186720, 186662.239290, 186662.239291, 186662.239292, F1099K.Nonemplcomp, rb_PCor3rdPN, rb_PSEorEPF, rb_TpOrSp

### F1099KRE  (11 screens, 11 unique)
- titles: What if I have a Form 1099-K but it's not for this rental or royalty activity? | Tell us about the filer on your 1099-K | What if my Form 1099-K includes more than one type of income? | Tell us about any 1099-K royalty income | Payment Card Income (Form 1099-K) | Where do I enter amounts from Form 1099-K, Box 5?
- screens: F1099KRE1, F1099KRE2, F1099KRE3, F1099KRE7, vOther1099MRE, Box1to8F1099K, F1099kDetails, FilerInfo, v1099KOthIncMoreThanOne, vWhereEnterMore, hGrossAmount
- data fields (12): 186662.186685, 186662.186689, 186662.186690, 186662.186691, 186662.186692, 186662.186693, 186662.186694, 186662.186714, 186662.186720, 186662.239290, rb_PCor3rdPN, rb_PSEorEPF

### F1099M  (106 screens, 106 unique)
- titles: You're considered self-employed. | What's this Box 7 compensation for? | What if I have more than one Schedule C or F in my return? | Tell us about your 1099-MISC. | We'll enter your other income for you. | Choose the Schedule C for your 1099-MISC income.
- screens: F1099M1, F1099M2, F1099M3, F1099M7, vAccepted_1099Misc, vNo1099M, vNo1099M_Multi, vNo1099M_Tunnel, vProGuidance_FromEmployer, hBox3_OtherInc, hLearn_more_1099Misc, Box7Compensation, ChooseYourScheduleC, CropInsuranceCopy, CropInsuranceForm, DisplayReCopyOfForm4835CropIns, DisplayReCopyOfForm4835Rent, DisplayReCopyOfRentalsRent, DisplayReCopyOfRentalsRoy, DisplayReCopyOfScheduleCFish, DisplayReCopyOfScheduleCLawyer, DisplayReCopyOfScheduleCMed, DisplayReCopyOfScheduleCOthComp, DisplayReCopyOfScheduleCOthCompSp, DisplayReCopyOfScheduleCPrize, DisplayReCopyOfScheduleCRent, DisplayReCopyOfScheduleCRoy, DisplayReCopyOfScheduleFCropIns, DisplayReCopyOfScheduleFOthComp, DisplayReCopyOfScheduleFPrize, EnterOlympicPrize, FishingBoatCopy, Form4835Description, FormEntry_LiveAudit, GroupOfBoxes, GroupOfBoxesSchF, HobbyIncome, INELFInfo, LawyerCopy, MedicalAndHealthCareCopy, NonemployeeCompensationCopy, NonemployeeCompensationForm, OlympicPrizeYorN, OtherIncomeCopy, OtherIncomeForm, OtherIncQuestionRePrize, OtherIncQuestionReSEIncome, QnReUseCurrentRRWkshtRent, QnReUseCurrentRRWkshtRoy, QnReUseCurrentSchedCFish ...(+56)
- data fields (71): 110.11, 110.112, 110.12, 110.129, 110.130, 110.131, 110.132, 110.133, 110.134, 110.135, 110.14, 110.143663, 110.143664, 110.143665, 110.15, 110.16, 110.17, 110.18071, 110.18074, 110.19, 110.20, 110.22, 110.23, 110.231917, 110.239611, 110.241951, 110.25, 110.29, 110.31, 110.33086, 110.37, 110.38, 110.42, 110.44, 110.45, 110.46, 110.48, 110.5, 110.6, 110.8, 110.9, 15.184, 15.215, 15.259, 15.260, 16.7, 223973.225620, 7.7, 75.70, F1099M.Def409ANonEmp, F1099M.DirSales, F1099M.Dist409ANonEmp, F1099M.Nonemplcomp, rb_Box7, rb_CropInsuranceForm, rb_F1099Sel, rb_NonemployeeCompensationForm, rb_OlympicYorN, rb_OtherIncomeForm, rb_OthIncSE ...(+11)

### F1099MC  (100 screens, 100 unique)
- titles: You're considered self-employed. | What if I have more than one Schedule C or F in my return? | Tell us about your 1099-MISC. | We'll enter your other income for you. | Choose the Schedule C for your 1099-MISC income. | Other 1099-MISC Boxes
- screens: F1099MC1, F1099MC2, F1099MC3, F1099MC7, vOther1099M, Box7Compensation, ChooseYourScheduleC, CropInsuranceCopy, CropInsuranceForm, DisplayReCopyOfForm4835CropIns, DisplayReCopyOfForm4835Rent, DisplayReCopyOfRentalsRent, DisplayReCopyOfRentalsRoy, DisplayReCopyOfScheduleCFish, DisplayReCopyOfScheduleCLawyer, DisplayReCopyOfScheduleCMed, DisplayReCopyOfScheduleCOthComp, DisplayReCopyOfScheduleCOthCompSp, DisplayReCopyOfScheduleCPrize, DisplayReCopyOfScheduleCRent, DisplayReCopyOfScheduleCRoy, DisplayReCopyOfScheduleFCropIns, DisplayReCopyOfScheduleFOthComp, DisplayReCopyOfScheduleFPrize, EnterOlympicPrize, FishingBoatCopy, Form4835Description, FormEntry_LiveAudit, GroupOfBoxes, GroupOfBoxesSchF, HobbyIncome, INELFInfo, LawyerCopy, MedicalAndHealthCareCopy, NonemployeeCompensationCopy, NonemployeeCompensationForm, OlympicPrizeYorN, OtherIncomeCopy, OtherIncomeForm, OtherIncQuestionRePrize, OtherIncQuestionReSEIncome, QnReUseCurrentRRWkshtRent, QnReUseCurrentRRWkshtRoy, QnReUseCurrentSchedCFish, QnReUseCurrentSchedCLawyer, QnReUseCurrentSchedCMed, QnReUseCurrentSchedCPrize, QnReUseCurrentSchedCRent, QnReUseCurrentSchedCRoy, RentalWkshtDescription ...(+50)
- data fields (71): 110.11, 110.112, 110.12, 110.129, 110.130, 110.131, 110.132, 110.133, 110.134, 110.135, 110.14, 110.143663, 110.143664, 110.143665, 110.15, 110.16, 110.17, 110.18071, 110.18074, 110.19, 110.20, 110.22, 110.23, 110.231917, 110.239611, 110.241951, 110.25, 110.29, 110.31, 110.33086, 110.37, 110.38, 110.42, 110.44, 110.45, 110.46, 110.48, 110.5, 110.6, 110.8, 110.9, 15.184, 15.215, 15.259, 15.260, 16.7, 223973.225620, 7.7, 75.70, F1099M.Def409ANonEmp, F1099M.DirSales, F1099M.Dist409ANonEmp, F1099M.Nonemplcomp, rb_Box7, rb_CropInsuranceForm, rb_F1099Sel, rb_NonemployeeCompensationForm, rb_OlympicYorN, rb_OtherIncomeForm, rb_OthIncSE ...(+11)

### F1099MF  (97 screens, 97 unique)
- titles: You're considered self-employed. | What if I have more than one Schedule C or F in my return? | Tell us about your 1099-MISC. | We'll enter your other income for you. | Choose the Schedule C for your 1099-MISC income. | Other 1099-MISC Boxes
- screens: F1099MF3, F1099MF7, Box7Compensation, ChooseYourScheduleC, CropInsuranceCopy, CropInsuranceForm, DisplayReCopyOfForm4835CropIns, DisplayReCopyOfForm4835Rent, DisplayReCopyOfRentalsRent, DisplayReCopyOfRentalsRoy, DisplayReCopyOfScheduleCFish, DisplayReCopyOfScheduleCLawyer, DisplayReCopyOfScheduleCMed, DisplayReCopyOfScheduleCOthComp, DisplayReCopyOfScheduleCOthCompSp, DisplayReCopyOfScheduleCPrize, DisplayReCopyOfScheduleCRent, DisplayReCopyOfScheduleCRoy, DisplayReCopyOfScheduleFCropIns, DisplayReCopyOfScheduleFOthComp, DisplayReCopyOfScheduleFPrize, EnterOlympicPrize, FishingBoatCopy, Form4835Description, FormEntry_LiveAudit, GroupOfBoxes, GroupOfBoxesSchF, HobbyIncome, INELFInfo, LawyerCopy, MedicalAndHealthCareCopy, NonemployeeCompensationCopy, NonemployeeCompensationForm, OlympicPrizeYorN, OtherIncomeCopy, OtherIncomeForm, OtherIncQuestionRePrize, OtherIncQuestionReSEIncome, QnReUseCurrentRRWkshtRent, QnReUseCurrentRRWkshtRoy, QnReUseCurrentSchedCFish, QnReUseCurrentSchedCLawyer, QnReUseCurrentSchedCMed, QnReUseCurrentSchedCPrize, QnReUseCurrentSchedCRent, QnReUseCurrentSchedCRoy, RentalWkshtDescription, RentalWkshtDescriptionRoyalty, RentCopy, RentForm ...(+47)
- data fields (71): 110.11, 110.112, 110.12, 110.129, 110.130, 110.131, 110.132, 110.133, 110.134, 110.135, 110.14, 110.143663, 110.143664, 110.143665, 110.15, 110.16, 110.17, 110.18071, 110.18074, 110.19, 110.20, 110.22, 110.23, 110.231917, 110.239611, 110.241951, 110.25, 110.29, 110.31, 110.33086, 110.37, 110.38, 110.42, 110.44, 110.45, 110.46, 110.48, 110.5, 110.6, 110.8, 110.9, 15.184, 15.215, 15.259, 15.260, 16.7, 223973.225620, 7.7, 75.70, F1099M.Def409ANonEmp, F1099M.DirSales, F1099M.Dist409ANonEmp, F1099M.Nonemplcomp, rb_Box7, rb_CropInsuranceForm, rb_F1099Sel, rb_NonemployeeCompensationForm, rb_OlympicYorN, rb_OtherIncomeForm, rb_OthIncSE ...(+11)

### F1099MFR  (96 screens, 96 unique)
- titles: You're considered self-employed. | What if I have more than one Schedule C or F in my return? | Tell us about your 1099-MISC. | We'll enter your other income for you. | Choose the Schedule C for your 1099-MISC income. | Other 1099-MISC Boxes
- screens: F1099MFR3, Box7Compensation, ChooseYourScheduleC, CropInsuranceCopy, CropInsuranceForm, DisplayReCopyOfForm4835CropIns, DisplayReCopyOfForm4835Rent, DisplayReCopyOfRentalsRent, DisplayReCopyOfRentalsRoy, DisplayReCopyOfScheduleCFish, DisplayReCopyOfScheduleCLawyer, DisplayReCopyOfScheduleCMed, DisplayReCopyOfScheduleCOthComp, DisplayReCopyOfScheduleCOthCompSp, DisplayReCopyOfScheduleCPrize, DisplayReCopyOfScheduleCRent, DisplayReCopyOfScheduleCRoy, DisplayReCopyOfScheduleFCropIns, DisplayReCopyOfScheduleFOthComp, DisplayReCopyOfScheduleFPrize, EnterOlympicPrize, FishingBoatCopy, Form4835Description, FormEntry_LiveAudit, GroupOfBoxes, GroupOfBoxesSchF, HobbyIncome, INELFInfo, LawyerCopy, MedicalAndHealthCareCopy, NonemployeeCompensationCopy, NonemployeeCompensationForm, OlympicPrizeYorN, OtherIncomeCopy, OtherIncomeForm, OtherIncQuestionRePrize, OtherIncQuestionReSEIncome, QnReUseCurrentRRWkshtRent, QnReUseCurrentRRWkshtRoy, QnReUseCurrentSchedCFish, QnReUseCurrentSchedCLawyer, QnReUseCurrentSchedCMed, QnReUseCurrentSchedCPrize, QnReUseCurrentSchedCRent, QnReUseCurrentSchedCRoy, RentalWkshtDescription, RentalWkshtDescriptionRoyalty, RentCopy, RentForm, RoyaltyCopy ...(+46)
- data fields (71): 110.11, 110.112, 110.12, 110.129, 110.130, 110.131, 110.132, 110.133, 110.134, 110.135, 110.14, 110.143663, 110.143664, 110.143665, 110.15, 110.16, 110.17, 110.18071, 110.18074, 110.19, 110.20, 110.22, 110.23, 110.231917, 110.239611, 110.241951, 110.25, 110.29, 110.31, 110.33086, 110.37, 110.38, 110.42, 110.44, 110.45, 110.46, 110.48, 110.5, 110.6, 110.8, 110.9, 15.184, 15.215, 15.259, 15.260, 16.7, 223973.225620, 7.7, 75.70, F1099M.Def409ANonEmp, F1099M.DirSales, F1099M.Dist409ANonEmp, F1099M.Nonemplcomp, rb_Box7, rb_CropInsuranceForm, rb_F1099Sel, rb_NonemployeeCompensationForm, rb_OlympicYorN, rb_OtherIncomeForm, rb_OthIncSE ...(+11)

### F1099MRE  (100 screens, 100 unique)
- titles: You're considered self-employed. | What if I have more than one Schedule C or F in my return? | Tell us about your 1099-MISC. | We'll enter your other income for you. | Choose the Schedule C for your 1099-MISC income. | Other 1099-MISC Boxes
- screens: F1099MRE1, F1099MRE2, F1099MRE3, F1099MRE7, vOther1099MRE, Box7Compensation, ChooseYourScheduleC, CropInsuranceCopy, CropInsuranceForm, DisplayReCopyOfForm4835CropIns, DisplayReCopyOfForm4835Rent, DisplayReCopyOfRentalsRent, DisplayReCopyOfRentalsRoy, DisplayReCopyOfScheduleCFish, DisplayReCopyOfScheduleCLawyer, DisplayReCopyOfScheduleCMed, DisplayReCopyOfScheduleCOthComp, DisplayReCopyOfScheduleCOthCompSp, DisplayReCopyOfScheduleCPrize, DisplayReCopyOfScheduleCRent, DisplayReCopyOfScheduleCRoy, DisplayReCopyOfScheduleFCropIns, DisplayReCopyOfScheduleFOthComp, DisplayReCopyOfScheduleFPrize, EnterOlympicPrize, FishingBoatCopy, Form4835Description, FormEntry_LiveAudit, GroupOfBoxes, GroupOfBoxesSchF, HobbyIncome, INELFInfo, LawyerCopy, MedicalAndHealthCareCopy, NonemployeeCompensationCopy, NonemployeeCompensationForm, OlympicPrizeYorN, OtherIncomeCopy, OtherIncomeForm, OtherIncQuestionRePrize, OtherIncQuestionReSEIncome, QnReUseCurrentRRWkshtRent, QnReUseCurrentRRWkshtRoy, QnReUseCurrentSchedCFish, QnReUseCurrentSchedCLawyer, QnReUseCurrentSchedCMed, QnReUseCurrentSchedCPrize, QnReUseCurrentSchedCRent, QnReUseCurrentSchedCRoy, RentalWkshtDescription ...(+50)
- data fields (71): 110.11, 110.112, 110.12, 110.129, 110.130, 110.131, 110.132, 110.133, 110.134, 110.135, 110.14, 110.143663, 110.143664, 110.143665, 110.15, 110.16, 110.17, 110.18071, 110.18074, 110.19, 110.20, 110.22, 110.23, 110.231917, 110.239611, 110.241951, 110.25, 110.29, 110.31, 110.33086, 110.37, 110.38, 110.42, 110.44, 110.45, 110.46, 110.48, 110.5, 110.6, 110.8, 110.9, 15.184, 15.215, 15.259, 15.260, 16.7, 223973.225620, 7.7, 75.70, F1099M.Def409ANonEmp, F1099M.DirSales, F1099M.Dist409ANonEmp, F1099M.Nonemplcomp, rb_Box7, rb_CropInsuranceForm, rb_F1099Sel, rb_NonemployeeCompensationForm, rb_OlympicYorN, rb_OtherIncomeForm, rb_OthIncSE ...(+11)

### F1099NEC  (30 screens, 30 unique)
- titles: We'll enter your Box 1 amount for you. | Nonemployee Compensation | Choose the Schedule C for your 1099-NEC income. | You're considered self-employed. | What 1099-NEC Gets Entered Here? | Medicaid waiver payments reported on Form 1099-NEC
- screens: F1099NEC3, hWhat1099, AsOtherIncome, ChooseYourScheduleC, Debugging, Debugging2, DisplayReCopyOfScheduleCOthComp, DisplayReCopyOfScheduleCOthCompSp, DisplayReCopyOfScheduleFOthComp, GetNecIncome, GetNecIncomeTPSP, GetNecInfo, HobbyIncome, NonemployeeCompensationCopy, NonemployeeCompensationForm, SchedFDescription, TakeNextSteps, This1099NowInSchC, TypeOfNEC, YouAreSelfEmployed, v8919Inc, vNECReporting, hDirectSalesCB, hExcsGoldenParachute, hFATCA, hHowPayMedSocSec, hMedicaidWaiverPayment, hNonEmplComp, hPayQuarterlyEstimates, hRptIncAsWages
- data fields (28): 223973.224156, 223973.224200, 223973.224989, 223973.225617, 223973.225618, 223973.225620, 223973.225621, 223973.225623, 223973.225624, 223973.225625, 223973.225626, 223973.225627, 223973.225628, 223973.225629, 223973.225631, 223973.225632, 223973.225633, 223973.225634, 223973.225635, 223973.225636, 223973.225637, 223973.225638, 223973.231918, 223973.254974, 223973.256175, rb_Box7, rb_F1099Sel, rb_NonemployeeCompensationForm

### F1099NECC  (29 screens, 29 unique)
- titles: Choose the Schedule C for your 1099-NEC income. | Where should we report your 1099-NEC income? | Enter your Form 1099-NEC info. | It's time to complete your Schedule C. | What's this Box 1 compensation for? | Take these steps to report your wages.
- screens: F1099NECC3, AsOtherIncome, ChooseYourScheduleC, Debugging, Debugging2, DisplayReCopyOfScheduleCOthComp, DisplayReCopyOfScheduleCOthCompSp, DisplayReCopyOfScheduleFOthComp, GetNecIncome, GetNecIncomeTPSP, GetNecInfo, HobbyIncome, NonemployeeCompensationCopy, NonemployeeCompensationForm, SchedFDescription, TakeNextSteps, This1099NowInSchC, TypeOfNEC, YouAreSelfEmployed, v8919Inc, vNECReporting, hDirectSalesCB, hExcsGoldenParachute, hFATCA, hHowPayMedSocSec, hMedicaidWaiverPayment, hNonEmplComp, hPayQuarterlyEstimates, hRptIncAsWages
- data fields (28): 223973.224156, 223973.224200, 223973.224989, 223973.225617, 223973.225618, 223973.225620, 223973.225621, 223973.225623, 223973.225624, 223973.225625, 223973.225626, 223973.225627, 223973.225628, 223973.225629, 223973.225631, 223973.225632, 223973.225633, 223973.225634, 223973.225635, 223973.225636, 223973.225637, 223973.225638, 223973.231918, 223973.254974, 223973.256175, rb_Box7, rb_F1099Sel, rb_NonemployeeCompensationForm

### F1099NECF  (29 screens, 29 unique)
- titles: Choose the Schedule C for your 1099-NEC income. | Where should we report your 1099-NEC income? | Enter your Form 1099-NEC info. | It's time to complete your Schedule C. | What's this Box 1 compensation for? | Direct Sales
- screens: F1099NECF3, AsOtherIncome, ChooseYourScheduleC, Debugging, Debugging2, DisplayReCopyOfScheduleCOthComp, DisplayReCopyOfScheduleCOthCompSp, DisplayReCopyOfScheduleFOthComp, GetNecIncome, GetNecIncomeTPSP, GetNecInfo, HobbyIncome, NonemployeeCompensationCopy, NonemployeeCompensationForm, SchedFDescription, TakeNextSteps, This1099NowInSchC, TypeOfNEC, YouAreSelfEmployed, v8919Inc, vNECReporting, hDirectSalesCB, hExcsGoldenParachute, hFATCA, hHowPayMedSocSec, hMedicaidWaiverPayment, hNonEmplComp, hPayQuarterlyEstimates, hRptIncAsWages
- data fields (28): 223973.224156, 223973.224200, 223973.224989, 223973.225617, 223973.225618, 223973.225620, 223973.225621, 223973.225623, 223973.225624, 223973.225625, 223973.225626, 223973.225627, 223973.225628, 223973.225629, 223973.225631, 223973.225632, 223973.225633, 223973.225634, 223973.225635, 223973.225636, 223973.225637, 223973.225638, 223973.231918, 223973.254974, 223973.256175, rb_Box7, rb_F1099Sel, rb_NonemployeeCompensationForm

### F1099R  (372 screens, 372 unique)
- titles: Does the exception apply to the entire withdrawal? | What if I received settlement income in connection with the Exxon Valdez litigation? | What if I want to re-pay a Qualified Birth and Adoption Distribution? | This distribution was taxable in 2024 | Do I have to attach a statement of explanation if I am making a one-time QCD to an SIE? | Which of these applies to your distribution?
- screens: f1099r1, f1099r2, f1099r3, f1099r7, Age, AmtSIMPLE, AmtSIMPLE_IncorrectExceptions, AnnuityStartingDate, AnnuityStartingDateCiv, BasicAmounts, Box2aByDefault, Box2aByDefaultButNull, Box2aByDefaultButPSO, Box2aByDefaultCSA, Box2aByDefaultCSF, Box2aNull_Screen2, CantUseSpecialMethods2aNull, CantUseSpecialMethods2aNullPre36, CharitableGiftAnnuity, CivilRRBNeedTaxable, CivilServDefault, CivilServDefault_PartialRollover, Code_1_S_Exception_Adjustment, Code1_2aNull, Code1_457Plan, Code1_Screen, Code1_Screen_Over60Half, Code2_IncorrectExceptions, Code2_NonIRA, Code2_Screen, Code2_Screen_55, Code2_ShouldQualify, Code3_Screen, CodeOutOfRange, CodeS_2aNull, CodeS_Screen, Conduit, ConvertQues, CorrectiveDistrib, CorrectRecipAddr, CorrectRecipAddrCSA, CorrectRecipAddrCSF, CorrectRecipAddrRRB, CorrectRecipName, CorrectRecipNameAndAddr, CorrectRecipNameAndAddrCSA, CorrectRecipNameAndAddrCSF, CorrectRecipNameAndAddrRRB, CorrectRecipNameCSA, CorrectRecipNameCSF ...(+322)
- data fields (161): 84.11, 84.13, 84.134, 84.135, 84.14, 84.15, 84.150640, 84.150641, 84.150642, 84.150643, 84.150644, 84.150645, 84.151474, 84.154, 84.155, 84.156, 84.157, 84.158, 84.159, 84.16, 84.163, 84.164, 84.16601, 84.16606, 84.167, 84.168, 84.169, 84.17, 84.170, 84.171, 84.172, 84.173, 84.174, 84.18, 84.187270, 84.187271, 84.187272, 84.187273, 84.19, 84.202, 84.203, 84.203905, 84.203906, 84.208, 84.21, 84.225, 84.23, 84.233, 84.236, 84.239, 84.24, 84.241, 84.242352, 84.245, 84.25, 84.256949, 84.256950, 84.257081, 84.26, 84.27 ...(+101)

### F1116KB  (99 screens, 99 unique)
- titles: Do all of these apply? | Other Reasons | Are you excluding any earned income? | You need Form 1116. | What if the foreign tax was imposed on the combined income of two or more persons? | Reduction of taxes
- screens: F1116KB1, F1116KB2, F1116KB3, F1116KB7, Adjustments, AdjustmentsAMT, AMTAmounts, AMTAmountsB, AMTAmountsC, BoycottReduction, BoycottReductionAMT, CanClaimAll, CapitalLosses, CapitalLossesB, CapitalLossesC, CarrybackCarryover, CarrybackCarryoverAMT, CountryOfResidence, DirectExpenses, DirectExpensesB, DirectExpensesC, ForeignEarnedIncExclusion, ForeignEarnedIncExclusionB, ForeignEarnedIncExclusionC, GeneralLimitationIncome, HowConverted, HowConvertedB, HowConvertedC, IncomeCategory, InterestExpense, InterestExpenseB, InterestExpenseC, K1Summary, K1SummaryB, K1SummaryC, Kickout, KickoutAMT, LetsComplete, MoreCountries, MoreCountriesB, OtherDeductions, OtherDeductionsB, OtherDeductionsC, OverThreshold, PaidVsAccrued, PaidVsAccruedB, PaidVsAccruedC, PaidVsAccruedUSD, PaidVsAccruedUSDB, PaidVsAccruedUSDC ...(+49)
- data fields (107): 72.105, 72.114, 72.115, 72.133619, 72.142678, 72.142679, 72.142680, 72.147, 72.154, 72.155, 72.156, 72.16, 72.190983, 72.190984, 72.190985, 72.190986, 72.212234, 72.214136, 72.214137, 72.214138, 72.214139, 72.214140, 72.214141, 72.214142, 72.214143, 72.214144, 72.214145, 72.214146, 72.214147, 72.214148, 72.214149, 72.214150, 72.214151, 72.214152, 72.214153, 72.214154, 72.214155, 72.214156, 72.214157, 72.214158, 72.215313, 72.215314, 72.215315, 72.246400, 72.267, 72.268, 72.269, 72.276, 72.277, 72.278, 72.28, 72.282, 72.283, 72.284, 72.29, 72.291, 72.292, 72.293, 72.297, 72.298 ...(+47)

### F1310KB  (20 screens, 20 unique)
- titles: Refund Will Be Sent to You | Proof of Death | Existence of Will | Attach Evidence to Your Return | Form 1310 Not Needed | Other Evidence
- screens: F1310KB1, F1310KB2, F1310KB3, F1310KB4, F1310KB6, AttachEvidence, Eligible, Filer, MFJTopicNotNeededForSP, MFJTopicNotNeededForTP, NotEligible, NotEligibleNoProof, OtherEvidence, ProofOfDeath, RefundSentToYou, RepMustFile, StateLaw, TopicNotNeeded, Will, hPersonalRep
- data fields (15): 206.10, 206.11, 206.12, 206.13, 206.14, 206.15, 206.16, 206.17, 206.215153, 206.8, 206.9, rb_OtherEvidence, rb_ProofOfDeath, rb_StateLaw, rb_Will

### F2106KB  (131 screens, 131 unique)
- titles: Worker with a disability claiming expenses related to their impairment | What if the courses I took were to help me get a promotion? | What if I was partially reimbursed for one or more of these expenses? | Does it matter whether I travel out of the country? | What if I qualify for a tuition tax break for just some of my tuition expenses? | Fee-Basis Official
- screens: F2106KB1, F2106KB2, F2106KB3, F2106KB7, ClergyEEExp, ClergyMeals, CommutingExpenses, DisabledAndWeKnowIt, DisabledExplanation, DisplayCompletedThisTopic, DisplayCompletedThisTopicMin, DisplayCompletedThisTopicSp, DisplayCompletedThisTopicSpMin, DisplayCompletedThisTopicTp, DisplayCompletedThisTopicTpMin, EmpeeSubjToHrsOfSvcLimits, EmployeeExpenseAssistant, GeneralExpenses, GeneralExpensesSp, GeneralExpensesTp, JobEdExpenses, JobEdExpensesSp, JobEdExpensesTp, JobEducationExps, JobHuntExps, JobHuntExpsSp, JobHuntExpsTp, JobRelatedExpenses, JobRelatedExpensesSp, JobRelatedExpensesTp, LocalTransportation, LocalTransportationSp, LocalTransportationTp, MealAndEntertainment, MealAndEntertainmentSp, MealAndEntertainmentTp, MealsActualCost, MealsActualCostNotMarried, MinisterReimbursements, NonWageMealAndOtherReimbs, NotQualified, Occupation, OccupationSp, OccupationTp, OtherGenlExpenses, OtherGenlExpensesSp, OtherGenlExpensesTp, OvernightTravel, OvernightTravelSp, OvernightTravelTp ...(+81)
- data fields (43): 19.10, 19.11, 19.12, 19.14, 19.163168, 19.163169, 19.163170, 19.163171, 19.163172, 19.163173, 19.163174, 19.163175, 19.163176, 19.163179, 19.163180, 19.17, 19.17073, 19.17074, 19.203, 19.210365, 19.210366, 19.210368, 19.215567, 19.221, 19.222, 19.223, 19.224, 19.225, 19.226, 19.227, 19.228, 19.31, 19.5, 19.7, 19.8, F2106.State, rb_DeptOfTrans, rb_DisabledWorkExp, rb_F2106Bool, rb_MealAcctg, rb_Reimb, rb_SpecialCases, SchedA.TwoPctAGI

### F2119KB  (119 screens, 119 unique)
- titles: Cash | Home Not Main Home | What if I never claimed the business use on my taxes at the time? | Ownership and Use Tests | Depreciation Recapture | Days After Your Spouse's Sale
- screens: F2119KB1, F2119KB2, F2119KB3, AcquiredInTrade, AllGainTaxFree, BasisSummary, BizUseYrOfSale, BuiltByOwner, CashOnly, CombinedSaleInfo, CombinedSaleInfo2, DaysFromPrevSale, DaysFromPrevSaleSp, DaysHomeOwned, DaysHomeOwnedJoint, DaysHomeOwnedJointSP, DaysHomeOwnedJointTP, DaysHomeUsed, DaysHomeUsedJoint, DaysHomeUsedJointSP, DaysHomeUsedJointTP, DepGainToSchedD, DepGainToSchedDBizUse, DepGainToSchedDDisqualUse, DepreciationAmt, ElectOut, ExclusionAdj, FrequencyLimitation, FrequencyLimitationWidow, GainToSchedD, GetOrganized, HealthOrJob, HomeWasGift, HowAcquired, HowAcquiredSp, HowAcquiredWe, InheritedHome, InstallmentSale, LikeKind, MaritalSettlement, MinusBasis, MoveInDate, MoveInDateMFJ, NoExclusionLikeKind, NoGainFormComplete, NonUseDays, NothingToElectOut, OriginalBasis, OtherThanMain, OwnershipNUseTest ...(+69)
- data fields (18): 20.34, rb_BizUseYrSale, rb_CashPurchase, rb_ExcludedGain, rb_ExcludeGain, rb_FiveYrPrincRes, rb_FrequencySP, rb_FrequencyTP, rb_HealthOrJob, rb_HowAcquired, rb_InstallmentMethod, rb_LikeKind, rb_OtherThanMain, rb_OwnershipTest, rb_OwnNUseTest, rb_OwnNUseTestJoint, rb_Qual, rb_SepProp

### F2210KB  (55 screens, 55 unique)
- titles: What if I had taxes withheld on more than 4 dates? | Tell us about your withholding. | Now, we'll help you complete Schedule AI. | Do you want to use the annualized method? | Unfair to Impose the Penalty | What if my work is seasonal?
- screens: CasualtyInterfered, CitizenOrResLastYr, CrEarlyFiling, DoSchedAI, EnterWithholding, F2210Gateway, F2210GatewayTopicNotNeeded, FarmerFish, FilingAndPayingByMarch1, FilingStatusChanged, HowToClaimWaiver, LastYrAddlTax, LastYrAddlTaxMFJ, LastYrAGI, LastYrRegTax, LastYrRegTaxLLY, LastYrTaxBoxd, LiveAudit_OverEightPmts, LiveAudit_OverEightPmts_PriorYrRef, MayNeed2210, NoPenaltyFarmFish, NoPenaltyNoTaxLastYr, NoPenaltySmallUP, PenaltyAmtLM, PenaltyAmtSM, QualifyForShortMethod, RegularTaxYear, RetDisabled, TreatWithholdingAsEstTax, Use2210F, UseAI, vAGI, vAnnualizedIncomeMethodTopic, vCasualtyUnderpaymentTopic, vCostMore, vDisabledTopic, vDisasterRelief, vDisasterUnderpaymentTopic, vHouseholdTaxReq, vInterest, vLastYearsAmountTopic, vLateStockSale, vMoreThanFourDates, vSeasonalWorkTopic, vTaxAmountTopic, vWaiver85Percent, vWithholdingPaidEarlyTopic, vWithholdingPaidLaterTopic, hAnnualized, hBeforeApril15 ...(+5)
- data fields (73): 149.10, 149.11, 149.13, 149.140402, 149.143310, 149.143313, 149.144309, 149.15, 149.167159, 149.174039, 149.18257, 149.19426, 149.19587, 149.230391, 149.237020, 149.237021, 149.238659, 149.238660, 149.239662, 149.241773, 149.242311, 149.250535, 149.259845, 149.35, 149.42, 149.43, 149.45, 149.46, 149.46030, 149.48, 149.49493, 149.49494, 149.62, 149.63, 149.64, 149.65, 149.66, 149.7, 149.72, 149.75571, 149.75572, 149.75951, 149.75952, 149.85, 21.11, 21.202966, 21.256951, 21.38811, 21.38812, 21.38813, 21.38814, 21.38815, 21.38816, 21.38817, 21.38818, 21.89, CfwdWks.Form2441AmtRefundable, CfwdWks.QlFmSkLvWgs13b, CfwdWks.QualFamSickLvWages, CfwdWks.RebateRecoveryCr ...(+13)

### F2439KG  (14 screens, 14 unique)
- titles: What if the mutual fund paid tax on my behalf? | Whose Form 2439 is this? | How do I claim the exemption on the sale of my 1202 stock? | What if I have more than one Form 2439? | Undistributed Capital Gains | Section 1202 Gain Advice
- screens: F2439KG1, F2439KG2, F2439KG3, F2439KG7, DistributeeInfo, Sec1202Gain, ShareholderInfo, UndistKG, vBoughtEndYr, vBoughtSharesEOY, vMTOne, vPdTaxMyBehalf, vSec1202line1e, vTaxesPaid
- data fields (2): 184.28, rb_WhoOwned

### F2441KB  (227 screens, 227 unique)
- titles: Do you want to delete your provider information? | You can't claim the credit or the exclusion. | Qualifying Nondependent | Get credit for a previous year's expenses. | How do I get information from my care provider? | Why can't I claim a dependent care credit?
- screens: AdditionalProviders, AdditionalProviders2, AmtsNotIncurredAndPaid, AnyNonDeps, AreYouUnmarried, BusinessBenes, ChildDepCareExpDCB, ChildDepCareExpenses, ChildDepCareExpensesLLY, Credit, DCBsButNoCredit, deductibleBenefits, DependsWhoQual1, DependsWhoQual1FSA, DependsWhoQual2, DependsWhoQual2FSA, DependsWhoQual3, DependsWhoQual3FSA, DependsWhoQual4, DependsWhoQual4FSA, DependsWhoQual5, DependsWhoQual5FSA, DidYouPayPriorYrExp, EarnedIncomeSP, EarnedIncomeTP, EarnedIncomeTPNonMFJ, EmployerProvCareNonDeps, EmployerProvCareV1, EmployerProvCareV10, EmployerProvCareV11, EmployerProvCareV12, EmployerProvCareV1B, EmployerProvCareV1C, EmployerProvCareV1D, EmployerProvCareV1E, EmployerProvCareV2, EmployerProvCareV2B, EmployerProvCareV2C, EmployerProvCareV2D, EmployerProvCareV2E, EmployerProvCareV3, EmployerProvCareV3B, EmployerProvCareV3C, EmployerProvCareV3D, EmployerProvCareV3E, EmployerProvCareV4, EmployerProvCareV4B, EmployerProvCareV4C, EmployerProvCareV4D, EmployerProvCareV4E ...(+177)
- data fields (143): 124.242458, 124.242469, 124.242480, 124.32443, 124.32445, 124.32447, 124.32449, 124.32451, 124.32453, 124.32541, 124.32548, 124.32555, 124.32562, 124.32569, 124.32576, 124.32759, 124.32768, 124.32777, 95.101, 95.10334, 95.105, 95.131, 95.135, 95.139, 95.14070, 95.14071, 95.14072, 95.14076, 95.14077, 95.14078, 95.14082, 95.14083, 95.14084, 95.143, 95.148, 95.18147, 95.18151, 95.18155, 95.185, 95.229, 95.233, 95.23469, 95.23470, 95.23471, 95.23473, 95.23477, 95.23478, 95.23479, 95.23480, 95.23481, 95.23490, 95.23494, 95.23498, 95.23502, 95.23503, 95.237, 95.241, 95.241750, 95.241751, 95.241752 ...(+83)

### F2555KB  (58 screens, 58 unique)
- titles: Reporting Travel Abroad | Present in the United States | Do I need to calculate my own tax if I'm filing Schedule J, Form 2555, and Form 8615? | Foreign Earned Income Exclusion | Travel Abroad | Did You Claim the Housing Deduction Last Year?
- screens: F2555KB1, F2555KB2, F2555KB3, F2555KB6, AGIDeductions, AllowancesReimbursements, BFRDates, BonaFideRes, ChkFilingRevoke, DaysPresentInUS, Disqualified, EmployerInformation, EmployTerms, F1040Tax, FamilyMembers, FEIHEHD, ForeignAddress, FullYrLimit, HousingDedCarry, HousingDedCarryMFJ, HousingExlcDed, HseExpsDays, IncPersSrvcs, ItemizedDeductions, LivingArrangements, LocationAndDays, NonCashInc, NotBFR, OtherForeignInc, PartYrLimit, PhysicalPresence, PriorFilings, PriorYrHousingDed, QualifiedDays, SeparateResidence, StatementsTaxes, TaxHome, TaxHomeInformation, TravelAbroad, TravelRecord, USHomeAddress, USPresence, VisaExplanation, WagesEtc, vBizEntryInstr, vF1040Tax, vImpactCOVID19, vMFJHousingExp, vNonW2EntryInstr, vOutOfCountryOnDueDate ...(+8)
- data fields (155): 111.10, 111.100, 111.101, 111.102, 111.103, 111.104, 111.105, 111.106, 111.107, 111.108, 111.109, 111.110, 111.111, 111.112, 111.113, 111.114, 111.115, 111.116, 111.117, 111.118, 111.119, 111.12, 111.120, 111.121, 111.122, 111.123, 111.124, 111.125, 111.126, 111.127, 111.128, 111.129, 111.13, 111.130, 111.131, 111.133, 111.134, 111.136, 111.14, 111.142, 111.142077, 111.143, 111.15, 111.151, 111.16, 111.161, 111.17, 111.18, 111.181, 111.19, 111.191, 111.192, 111.194, 111.195, 111.196, 111.197, 111.198, 111.199, 111.20, 111.201 ...(+95)

### F3468KB  (4 screens, 4 unique)
- titles: How do I know if I need this Form? | Investment Credit | Form 3468
- screens: F3468KB1, F3468KB2, Summary, vF3468Eligibility

### F3800KB  (5 screens, 5 unique)
- titles: Credits Included in the General Business Credit | Forms Not Supported in the Program | Other Business Credits | Form 3800
- screens: F3800KB1, F3800KB2, Summary, vCreditsIncluded, vFormsNotIncluded

### F3903KB  (105 screens, 105 unique)
- titles: Self or Spouse | What if I'm now self-employed? | Can I deduct some moving expenses any other way? | What if I moved to avoid a long commute? | What if I'm a survivor who couldn't move within six months? | Begun
- screens: F3903KB1, F3903KB2, F3903KB3, Accommodation, AlternativeTests, ArmedForces, DeductingThisYear, DelayingDeduction, Disabled, EmploymentType, ExpensesPaidThisYr, HypoNewCommute, LifeChanges_Move, MoveWasForWork, MovingExp_NonAsstPath, MovingExp_NonPremium, MovingExpAreDeductible_NoEmpReimb, MovingExpAreDeductible_YesEmpReimb, MovingExpenses, MovingExpNotDeductible, MovingExpWash, OldCommute, OnlyClaimStorage, PermChangeOfStation, Reimbursement, SelfOrSpouse, SpecialCases, StoringBelongings, TimeTestEmployees, TimeTestSelfEmployed, TransportingBelongings, TravelExpenses, YouDoNotQualify, YouDoNotQualifyForStateDeduction, YouMayQualify, YouQualify, YouQualifyForStateDeduction, vAvoidCommute, vBestChoice, vBootCamp, vBoth, vBothMoved, vCarExpenses, vClubMemberships, vDetour, vEmployerPaid, vEmployerPaidPart, vFired, vFirstJob, vFullTime ...(+55)
- data fields (20): 25.18248, 25.18249, 25.18256, 25.77, rb_3903SelfSp, rb_dAlternatTests, rb_dAssnWJob2, rb_dDeductThisYr, rb_dDelay, rb_dExpPaidThisYr, rb_dReimb, rb_dSec217d1test2, rb_dSpecialCase, rb_EmploymentType, rb_Storage, rb_TimeTestEmployees, rb_TimeTestSelfEmployed, rb_TravelExpNonPrem, rb_XArmedForces, rb_XPermChgSta

### F4137KB  (23 screens, 23 unique)
- titles: What if my unreported tips were received as a government employee? | What if all my tips were reported in the W-2 topic? | Unreported Tip Income&mdash; SpNameFirst1 | Unreported Tips | Unreported Tip Income | Enter Additional Unreported Tip Information
- screens: F4137KB1, F4137KB2, F4137KB3, F4137KB6, GovtAndUnder20TipInfo, TopicNotApply, UnreportedTipInfo, UnreportedTipInfo_CarryEmpl1And2, UnreportedTipInfo_CarryEmpl1Thru3, UnreportedTipInfo_CarryEmpl1Thru4, UnreportedTipInfo_CarryEmplAll, UnreportedTipInfo_CarryEmplOne, vAllocatedTips, vAllTips, vEmployerNotListed, vLessThan20, vMoreThanThreeEmployers, vNonCashTips, vReportedTips, vReturnW2, vSelfEmployed, vTipsEarnedAsGovtEmployee, vTipsToInclude
- data fields (23): 26.29415, 26.29416, 26.33232, 26.44986, 26.44987, 26.44988, 26.44989, 26.44990, 26.44991, 26.44992, 26.44993, 26.44994, 26.44995, 26.44996, 26.44997, 26.44998, 26.44999, 26.45000, 26.45001, 26.45002, 26.5, 26.6, 26.7

### F4547Sign  (12 screens, 12 unique)
- titles: Learn more | How can I make changes to my Beneficiaries? | When will I get more info about my Trump account? | How do I get my initial $1,000 funding from the government? | How do I change a signature field if it will not allow an entry? | One last step for Your Trump Account election.
- screens: AuditSign, IntroScreenTwoSigners, NoEF, SkipScreen, SummaryScreen, vHowGetPaid, vHowToChange, vWhenMoreInfo, heSigLearnMore, hHowChange, hHowGetPaid, hWhenMoreInfo
- data fields (1): 260947.261015

### F4684KB  (91 screens, 91 unique)
- titles: What if I lost my investment in a Ponzi scheme? | What if my loss occurred in 2026 | Casualty Loss to be Entered | What are considered collectibles? | Value of BusPropD | Tell Us About the Change in Value for PropertyC
- screens: F4684KB1, F4684KB2, F4684KB3, BusUseA, BusUseB, BusUseC, BusUseD, BusUseProp, ChangeInValueA, ChangeInValueB, ChangeInValueC, ChangeInValueD, CostInsA, CostInsB, CostInsC, CostInsD, Event, FederalDisasterElection, FederalDisasterID, FederalDisasterRevocation, HomeOfficePropA, HomeOfficePropB, HomeOfficePropC, HomeOfficePropD, MoreThanFour_Pers_Cost_Insurance_Gain, MoreThanFour_Pers_Cost_Insurance_Loss, MoreThanFour_Pers_Cost_Insurance_Loss_GainEntered, MoreThanFour_Pers_GainOrLossQues, MoreThanFour_Pers_ValueBeforeAndAfter, MoreThanFour_Pers_ValueBeforeAndAfter_GainEntered, NumberProperties_Personal, PersCostInsuranceA, PersCostInsuranceB, PersCostInsuranceC, PersCostInsuranceD, PersUseProp, SafeHarborA, SafeHarborAmountA, SafeHarborAmountB, SafeHarborAmountC, SafeHarborAmountD, SafeHarborB, SafeHarborC, SafeHarborD, ValueA, ValueB, ValueC, ValueD, VerifyRevocation, vAddlInfoForRevocation ...(+41)
- data fields (128): 35.1, 35.10, 35.13, 35.14, 35.16, 35.17, 35.18, 35.196846, 35.196852, 35.196853, 35.199277, 35.199278, 35.199279, 35.199280, 35.199281, 35.199282, 35.199283, 35.199284, 35.2, 35.200214, 35.200215, 35.200216, 35.204661, 35.204662, 35.204663, 35.204664, 35.204665, 35.204666, 35.204667, 35.204668, 35.204669, 35.204670, 35.204671, 35.204672, 35.204673, 35.21, 35.211104, 35.211105, 35.211106, 35.211107, 35.22, 35.235892, 35.24, 35.24631, 35.24632, 35.24633, 35.24634, 35.24635, 35.24636, 35.24638, 35.24639, 35.24640, 35.24641, 35.25, 35.25171, 35.25172, 35.25173, 35.25174, 35.25175, 35.25867 ...(+68)

### F4797KB  (113 screens, 113 unique)
- titles: Soil, Water, and Land Clearing Expenses | Tell us about your sale of oil, gas, or geothermal property. | Enter your sales of long-term property. | Sale to a Related Person | What is depreciation and other expenses that could've been deducted? | How do I postpone the gain from the sale of empowerment zone property?
- screens: F4797KB1, F4797KB2, F4797KB3, F4797KB7, CasLossEmpProp, CasualtyTheftA, CasualtyTheftB, CasualtyTheftC, CasualtyTheftD, EnterInPartI, EnterOnFormPrtII, File4797Past5, Pro1099S, Property2, Property3, Property4, PropFour1245, PropFour1250, PropFour1252, PropFour1254, PropFour1255, PropFourType, PropOne1245, PropOne1250, PropOne1252, PropOne1254, PropOne1255, PropOneType, PropThree1245, PropThree1250, PropThree1252, PropThree1254, PropThree1255, PropThreeType, PropTwo1245, PropTwo1250, PropTwo1252, PropTwo1254, PropTwo1255, PropTwoType, PY1231Losses, PY1231LossesLiveAudit, PY1231LossesLLY, RecapRecomp179, RecapRecomp280, Recapture179, Recapture280, ReportIncome179, ReportIncome280F, Sec179_LiveAudit ...(+63)
- data fields (242): 36.1, 36.10, 36.102, 36.103, 36.104, 36.105, 36.106, 36.107, 36.108, 36.109, 36.11, 36.110, 36.111, 36.112, 36.113, 36.114, 36.115, 36.116, 36.12, 36.121, 36.122, 36.125, 36.129, 36.13, 36.130, 36.133, 36.135, 36.137, 36.138, 36.139, 36.14, 36.144, 36.145, 36.148, 36.15, 36.152, 36.153, 36.156, 36.158, 36.160, 36.161, 36.162, 36.167, 36.168, 36.171, 36.175, 36.176, 36.179, 36.18, 36.181, 36.183, 36.184, 36.185, 36.187197, 36.187198, 36.187199, 36.187200, 36.187201, 36.187202, 36.187203 ...(+182)

### F4835KB  (15 screens, 15 unique)
- titles: What if the rent I received was based on a flat charge? | Schedule F and Schedule E | Definition of Rental Activity | What if the farm rental income was based on crops or livestock produced by the tenant? | Farm Rentals | Form 4835
- screens: F4835KB1, F4835KB2, F4835KB3, F4835KB7, Form4835InterviewScreen, vActPart, vFarmIncomeFlatCharge, vFarmIncomeFromCrops, vForgivenPPP, vMealsExpense, vRecharacterizePassiveIncome, vSchFSchE, vSETax, hMatPartic, hRental
- data fields (2): 75.66, 75.95

### F4868KB  (43 screens, 43 unique)
- titles: What is included in withholding and payments? | Does an extension give me more time to pay my taxes? | What if I want correspondence regarding this extension sent to another address or to an agent? | How do I determine my tax liability? | Amount Paid With Extension | Let's Check Your Extension Information
- screens: AmountPaid, ErrorCheck, EstimatedLiability, Intro_ExtMode, NoAmountDue, OutOfCountry, OutOfCountry_MFJ, Payments, Revisiting, SelectState, StateExtension_1, StateExtension_2, StateExtension_3, StateExtension_4, StateExtension_5, StateExtension_6, StateExtension_7, StateExtension_8, StateExtension_9, SummaryAmts, SummaryQues, vAmtPaidWithExtension, vCheckingErrors, vCorrespondenceAddress, vCredits, vDeterminingLiability, vExtensionWithoutLiability, vFileIfPayingLess, vForeignResidence, vHowDoIpay, vLateFilingPenalty, vLiabilityChanges, vMoreTimeToPay, vNotPayingAll, vOweLessThanEstimated, vPayingMore, vPhysicallyPresent, vRecalculatePayments, vStatePurchase, vUnderestimateLiability, vViewing4868, vWithholding, hOtherTaxes
- data fields (7): 37.60, 37.76, 37.78, 37.79, rb_ExtensionFiled, rb_OptionalPymt, rb_OutOfCountry

### F4952KB  (17 screens, 17 unique)
- titles: Investment Interest Expense | What if I had investment income other than annuities and royalties? | What if I invested in tax-exempt securities? | Did You Pay Any Investment Interest Expense During 2025 | AMT Form 4952 | Enter Your 2024
- screens: F4952KB1, F4952KB2, ElectionToIncludeCapGains, Gains, LastYrDisallowedExp, LastYrDisallowedExp_LLY, OtherInvestmentIncome, OtherInvIntExpense, vAllowedAmounts, vAnotherForm, vCarryforwards, vDeductAllInvInt, vInvestmentExpenses, vK1OrdinaryGain, vOtherInvestIncome, vTaxExemptInvInt, vTaxExemptInvInt2
- data fields (5): 149.24, 38.46, 38.51, 38.70, 38.75

### F5329KB  (25 screens, 25 unique)
- titles: How do I know if I took enough money out? | What is the Amount Actually Distributed in 2025 | What is the Correction Window? | Letter of Explanation | Your Required Minimum Distribution | Amount of the excess accumulation shortfall you want waived
- screens: F5329KB1, F5329KB2, F5329KB3, F5329KB4, F5329KB5, F5329KB6, AmtActuallyDist, AmtActuallyDistSelf, AmtActuallyDistSpouse, MinimumReqDistEntry, ShortfallWantedWaived, TaxExcessAccum, WaiverSteps, WaiverXpl, vAmtActuallyDist, vApril1RMD, vCorrectionWindow, vhRMDDefinition, vMoreInfoPenalties, vQCD, vRMD, vRMDTaxTiming, hDistribRules, hMinDistrib, hRMDDescrip
- data fields (12): 40.236742, 40.254525, 40.254526, 40.256302, 40.256303, 40.256304, 40.256305, 40.256306, 40.257147, 40.38, 40.39, rb_Waiver

### F5695KB  (101 screens, 101 unique)
- titles: Types of Improvements to your Main Home | What furnaces and boilers qualify? | Energy Efficient Home Improvement Credit | Improvements to more than one home you used during 2025 | Residential Energy Credits | Qualified Energy Efficiency improvement Costs
- screens: F5695KB1, F5695KB2, F5695KB3, AddressCheckmainhome, AddressforExpenses, AddressForFuelCell, AddressforNBEP, AddressForSolarcosts, CentralACcosts, CentralACcostsJOC, claimStatus, DQEneryEffIntro, EFCPcosts, EFCPcostsJOC, EffPropCr, EfhImproexp, EfhImproexpJOC, EfhImproexpMFJ, EneryEffIntro, furnaceWaterBoilers, furnaceWaterBoilersJOC, HomecleanEner, HomeEnerAudit, HomeEnerAuditDQ, HomeEnerAuditWrap, ImproveHomConstruction, ImpvMainHome, InsulationandDoors, InsulationandDoorsJOC, JOCPath, LifetimeLimit, NonBusPropCr1, NonBusPropCr1MFJ, PriorYearAmounts, PropCleanEnerCheck, pumpsHeatersBiomass, pumpsHeatersBiomassJOC, QEACost, QEACostJOC, QEPExpenDQ, QualEnerEffImprovements, QualFuelCellQues, ResEnPropExpdtures, TypesofExpenditure, WaterHeaters, WaterHeatersJOC, WindowsandSkylights, WindowsandSkylightsJOC, WrapSchAIntroSecB, YourCredit ...(+51)
- data fields (167): 34241.233370, 34241.243915, 34241.243916, 34241.243917, 34241.243918, 34241.243919, 34241.243936, 34241.243937, 34241.243938, 34241.243939, 34241.243940, 34241.243941, 34241.243942, 34241.243943, 34241.243944, 34241.243945, 34241.243946, 34241.243947, 34241.243948, 34241.243949, 34241.243950, 34241.243951, 34241.243952, 34241.243953, 34241.243954, 34241.243955, 34241.243956, 34241.243960, 34241.243962, 34241.243966, 34241.243970, 34241.243971, 34241.243972, 34241.246511, 34241.246514, 34241.252488, 34241.257234, 34241.257235, 34241.257236, 34241.257237, 34241.257238, 34241.257239, 34241.257241, 34241.257242, 34241.257243, 34241.257244, 34241.257245, 34241.257246, 34241.257247, 34241.257248, 34241.257249, 34241.257251, 34241.257252, 34241.257254, 34241.257255, 34241.257256, 34241.257257, 34241.257258, 34241.257260, 34241.257261 ...(+107)

### F6198KB  (8 screens, 8 unique)
- titles: At-Risk Limitations | What happens to losses that are disallowed under the At-Risk rules? | Which Part to Complete | Instruction for Line 9. | What amounts are "at-risk" in an activity? | Form 6198
- screens: F6198KB1, F6198KB3, F6198KB7, Summary, vAtRisk, vDisallowedLosses, vInstLine9, vWhichPart
- data fields (1): 76.36

### F6251KB  (52 screens, 52 unique)
- titles: Bonds issued in 2009 or 2010 | Circulation Expenditures | What's the alternative minimum tax? | Certain Installment Sales | Bond Interest Excluded from AMT Income | Selling ISO Stock in Same Year as Purchase
- screens: AMTKLCOAdj, AMTSummary, CapitalGainsRates, CapitalGainsRates2, ForeignTaxCredit, InvIntExpAdj, IsoAdjustment, KGWKSAdj, NoAMTNoMrtgIntAdj, OrdAdjPtyDisp, OtherAdjsAndPrefs, OweAMTNoMrtgIntAdj, PABInterestAndOtherDeductions, PABsExcludedFromAMT, PrsvdISODeluxe, PrsvdISOPremium, Sec1201Adj, v501C3Bond, vExerciseOption, vExerciseOptionThisYear, vFindPY4952Amt, vHowAMTCalcd, vHowKnowISO, vInvestInt, vISOAndSoldSameYr, vISOBasis, vPABInt, vRefBond, vWhatIfISO, vWhatIsAMT, vWhatIsInvProperty, hAMTAdjList, hAMTBasis, hAMTLossCarryForward, hBondsIssuedIn2009, hCapGnsAdj, hCapGnsAdj2, hCertainInstallmentSales, hCirculationExpenditures, hdateStkAcq, hDisqDisp, hExludedBondInterest, hFuelCredits, hGoZone, hHowUnusual, hLongTermContracts, hMiningExplorationAndDevelopmentCosts, hNOL, hPollution, hPrivateActBondIntExp ...(+2)
- data fields (38): 149.25, 41.128, 41.15, 41.16, 41.17, 41.18, 41.183136, 41.192, 41.193, 41.195, 41.196, 41.199, 41.20, 41.200, 41.21, 41.241115, 41.241116, 41.252, 41.255, 41.256, 41.27613, 41.27758, 41.27759, 41.290, 41.35, 41.52389, 41.52390, 41.52391, 41.52392, 41.60, 41.64, 41.70137, 41.72, 41.73, f6251.MiscSubjAft2Pct, F6251.MrtgIntInvPurposes, rb_DoAMT, rb_KeepISO

### F6252KB  (9 screens, 9 unique)
- titles: Enter Installment Sales | Do I record sales of inventory here? | Installment Sales | Installment Sale Income | Can I elect not to report a sale for multiple payments under the installment method? | What if I sold stock on December 31 and got the money in January?
- screens: F6252KB1, F6252KB2, F6252KB3, F6252KB7, InstallmentSales, vElectOut, vInstSalestock, vInventory, hInstSaleIncome

### F6781KB  (7 screens, 7 unique)
- titles: Section 1256 Contracts and Straddles | If my gains are unrealized, do I need to report them? | Section 1256 Contracts | Straddles | Purpose Of Form 6781 | Can I deduct my realized straddle losses against unrealized gains?
- screens: F6781KB1, F6781KB2, PurposeOf6781, vDeductLoss, vUnrealGain, hSec1256, hStraddle

### F8379KB  (44 screens, 44 unique)
- titles: Injured Spouse Data | Refundable Tax Credits | Injured Spouse | Refundable credits | Joint Overpayment | Information from Joint Return
- screens: F8379KB1, F8379KB2, Address_LiveAudit, ClaimYear, CmtyProp, CmtyProp2, CurrentAddress, CurrentAddress2, CurrentAddress3, Disqualified, DivorcedRefund, FormComplete, InjSpData, IRSAllocate, JointReturn, JtRetIncome, JtRetInfo3, JtRetInfo5, MarriageRecog, PriorYear, PYInjSpData, PYJtRetInfo3, QEarnedIncome, QEICorACTC, QJointOverpayment, QLegallyOblig, QPayments, QRefundableCredit, WhoseClaim, WhosePriorClaim, WhosePriorClaimLiveAudit, vAlreadyEFiled, vHowFile, vIncomeNotOnW2, vNoELF, vStdtLoan, vWantToEfile, hInjSpouse, hMissingQBID, hNonRefTaxCr, hOtherTaxes, hRefTaxCr, hRefTaxCrAllocation, hStandardOrItemized
- data fields (68): 177.111, 177.112, 177.113, 177.115, 177.116, 177.117, 177.119, 177.120, 177.121, 177.123, 177.124, 177.125, 177.127, 177.128, 177.129, 177.131, 177.132, 177.133, 177.16, 177.17, 177.18, 177.19, 177.21, 177.22, 177.22920, 177.22921, 177.23, 177.233157, 177.233158, 177.24, 177.26, 177.27, 177.28, 177.29, 177.30, 177.31, 177.37, 177.38, 177.39, 177.40, 177.41, 177.42, 177.43, 177.44, 177.45, 177.51, 177.52, 177.67, 177.69, 177.70, 177.83, 177.84, 177.86, 177.87, 177.89, 177.90, 177.92, 177.93, F8379.ExmptINJ, F8379.ExmptJT ...(+8)

### F8396KB  (7 screens, 7 unique)
- titles: Here are your Mortgage Interest Credits | Associated Form 1098 | Unfortunately, you can't claim the Mortgage Interest Credit. | Enter Information About the Mortgage Interest Certificate | Mortgage Interest Credit | What if I take a mortgage interest deduction on Schedule A?
- screens: Associated1098, CertificateInfo, DQCredit, MortgageIntCr, YourCredit, vMtgIntCredit, vMtgIntDedOnSchA
- data fields (13): 143.10, 143.11, 143.12, 143.34844, 143.34845, 143.34846, 143.41, 143.42, 143.43, 143.44, 143.7, 143.8, rb_On1098

### F8586KB  (40 screens, 40 unique)
- titles: What if I don't have an original, signed Form 8609 (or copy thereof)? | Decrease in Qualified Basis | 42(f)(3)(B) Modification | Choice of Form | Final Display Screen | Part-Year Adjustment
- screens: F8586KB1, F8586KB2, AddsToQualBasis, Adjustments, BIN, BldgOrRehab, ChoiceOfForm, CrdtPercent, CreditAllowed, DateBldgInService, DecreaseBasis, DecreaseQualBasis, EligBasis, EntireCredit, FedGrants, FinalScreen, FinishedSchA, FloThruEIN, FlowThruCrdts, Form8609, Introduction, LowIncHsngCrdt, LowIncPortion, MultBldgProj, Original8609, PartYrAdj, ProporShare, QualBasis, QualifiedLowIncome, Recapture, ScheduleA, Section42Mod, Stop1, Stop2, Stop3, WhatToInclude, vCovidBasis, vCovidHousing, vGoZone, vNoOriginalCopy
- data fields (18): 147.11, 147.12, 147.13, 147.16, 147.25, 147.26, 147.28, 147.35, 147.40, 147.44, 147.45, rb_8586Bool, rb_8586Bool2, rb_8586Bool3, rb_8586Bool4, rb_BldgOrRehab, rb_DateInService, rb_FormChoice

### F8606KB  (60 screens, 60 unique)
- titles: Let's find out more about your IRA distributions. | Higher Education Expenses | Now, let's look at your spouse's IRA distributions. | Let's see if there's a penalty on your early distribution. | Let's work on your Roth IRA distributions. | Outstanding Rollovers
- screens: F8606KB1, F8606KB2, F8606KB3, F8606KB4, F8606KB5, F8606KB6, BasisXpl, BeginningIRABasis, BeginningIRABasisII, ConvertAll, ConvOrRollover, EarlyDistPenaltyROTH, ExceptionsIRA, HomebuyerExpenses, NoCoveredDistribs, OutstandingRollovers, PenaltyAmtRoth, PreviousRothContribBasis, PreviousRothConvBasis, Recapture, RothDistributions, TaxablePortion, TradIRAContribs, TradIRAContribsMade, ValueOfIRAs, vAdjustmentsToValue_Disaster, vAdjustmentsToValue_PastYrDisaster, vAirlinePayments_FAAModernization, vBasisInContribs, vBasisInConv, vDistributionsPriorToDeath, vDivorce, vHowMuchFTHexpenses, vPartialException, vRepayHurricaneOrReservist, vSeparate8606_Rollover, vSpouseContribs, vTreatingAsOwn, vValue, hActiveReservist, hBasisAdj, hDeductibleMedical, hDisability, hDistDueToDeath, hexceptions, hFTHBExp, hHealthInsPrem, hHigherEd, hIRSLevy, hLearnMore_ConversRollover ...(+10)
- data fields (7): 46.166491, 46.166494, rb_AnyTradContribs, rb_ConvertAll, rb_EarlyDistPenaltyROTH, rb_ExceptionIRA, rb_Rollover

### F8615KB  (29 screens, 29 unique)
- titles: Let's look at your parent's tax info. | Tell us the amount related to your unearned income. | Was your investment interest related to unearned income? | What if my parents used Schedule J to calculate their tax? | What if I'm missing some info? | Let's look at your sibling's income.
- screens: BusIncMatFactor, DisabilityTrust, DisabilityTrustBusCap, DQEarnedIncGTHalfSupport, DQMFJ, dqNoLivingParent, DQTooOld, DQTooOldNotStudent, F1040Tax, Intro, InvIncUnderThreshold, InvInterestAmount, InvInterestGW, ParentCapGain, ParentIncome, ParentNameSSN, QualifiedTrustIncome, SiblingIncome, SiblingTopRateGains, vF1040Tax, vKidInvestInc, vParentsDied, vWhatsQDT, vWhenKidTax, hCapIsMatFactor, hEstimates, hForm2555, hSchedJ, hSiblingTopRateGains
- data fields (34): 47.207026, 47.221060, 47.221062, 47.221063, 47.221110, 47.226162, 47.226163, 47.226164, 47.226165, 47.226168, 47.226172, 47.229088, 47.229089, 47.229090, 47.229849, 47.229850, 47.229851, 47.229852, 47.229860, 47.229868, 47.230390, 47.50733, 47.53054, 47.53055, 47.53056, 47.53057, 47.6, 47.7, 47.79145, 47.8, rb_InvInt8615, rb_ParentFS, rb_ParentMethod, rb_QDTDist

### F8801KB  (6 screens, 6 unique)
- titles: Prior&ndash;Year Alternative Minimum Tax Credit | Form 8801 | Credit Limited | When to Use This Form | How do I enter last year's data?
- screens: F8801KB1, F8801KB2, Form8801InterviewScreen, vCrLim, vLLYInfo, vUseForm

### F8814KB  (30 screens, 30 unique)
- titles: When can I report my child's income on my return? | Should I report my child's income on my return? | Nominee Capital Gain Distributions | What if my child has nominee capital gain distributions? | How do I know if my child has capital gain distributions? | May Not Use This Form
- screens: F8814KB1, F8814KB2, F8814KB3, F8814KB7, CapitalGains, ChildNameSSN, CompletedTopic, CompletedTopic2, Dividends, InterestInc, KGDistr28, MayNotUseThisForm, NontaxableInt, PABInt, Sec1202Gain, Sec1250Gain, SSAInc, vChildGotW2, vChildIncYrRet, vIfHadAdj, vNomCGD, vNomDiv, vNomineeInt, vShouldIChild, vWhereNCG, vWhereOrdDiv, hNomDivs, hNomGains, hQDivs, hSec1202Dist
- data fields (24): 49.162842, 49.163188, 49.28, 49.38, 49.5, 49.55, 49.56, 49.57, 49.58, 49.59, 49.6, 49.60, 49.61, 49.62, 49.64, 49.66, 49.68, 49.7, 49.71, 49.72, 49.74, 49.8, 49.80, 49.81

### F8815KB  (48 screens, 48 unique)
- titles: Nontaxable Education Benefits | Can I also apply for the Education Credits? | Who is the Student? | School Information | Qualified Education Expenses | Is this the only tax benefit I can get from paying education expenses?
- screens: F8815KB1, F8815KB2, BondOwner, DisqAGI, DisqMFS, Disqualified, ExcludedInt, ExpensesPaid, FirstStudent, MAGIAdj, NonMFJBondOwner, NonMFJExpensesPaid, NonTaxBenes, SecondStudent, ThirdStudent, WhichDep1, WhichDep2, WhichDep3, WhoIsFirstStudent, WhoIsFirstStudentMFJ, WhoIsSecondStudent, WhoIsSecondStudentMFJ, WhoIsThirdStudent, WhoIsThirdStudentMFJ, WholeFormScreen, vCoverdellOrQTP, vCreditsToo, vCreditTkn, vDistanceProg, vEdExpenses, vEdIRA, vEdIRACont, vEdIRAIV, vEligibleSchool, vExpenses, vExpensesIV, vNonTaxBene, vNonTaxSchl, vNotSpentEd, vParentBought, vPub550, vQualExp, vUPLan, hfees, hLearn_Tuition, hNTBenes, hQEdExp, hSupStmt
- data fields (97): 81.100, 81.101, 81.102, 81.103, 81.104, 81.105, 81.106, 81.107, 81.12, 81.134, 81.135, 81.137, 81.138, 81.140, 81.141, 81.143, 81.144, 81.146, 81.147, 81.149, 81.150, 81.152, 81.153, 81.155, 81.156, 81.158, 81.159, 81.16, 81.161, 81.162, 81.164, 81.165, 81.167, 81.168, 81.170, 81.171, 81.173, 81.174, 81.176, 81.177, 81.179, 81.180, 81.182, 81.183, 81.183143, 81.183144, 81.183145, 81.183146, 81.183148, 81.183149, 81.183150, 81.183151, 81.183153, 81.183154, 81.183155, 81.183156, 81.185, 81.186, 81.188, 81.189 ...(+37)

### F8822kb  (7 screens, 7 unique)
- titles: Introduction | Change of Address | Final Display Screen | Change of Address (Form 8822) | What should I do if my business name and address is not appearing on Form 8822-B after I checked the applicable box? | Change of Name
- screens: F8822KB1, ChangeofAddress, ChangeofName, FinalDisplayScreen, Introduction, vBusinessAddressHelp, hBusinessAddressHelp

### F8824KB  (70 screens, 70 unique)
- titles: Exceptions to Reporting Rules | Report Gain on Form 4797 | Information about Properties Traded | Sixty Day Replacement Period | Tell us about the cash paid and other property traded. | Like-Kind Exchanges
- screens: F8824KB1, F8824KB2, F8824KB3, BasisLikeProperty, BootReceived, Conflict, Dates, Dates_LiveAudit, DebtsAssumed, DeferredGain, Exceptions, ExceptionStmt, ExchangeExps, ExchangeInfo, GainLossOtherProp, GainNoException, GainOnExchange, InstallmentSale, LiabilitiesAssumed, MultiAsset, MultiGain, NoDeferredGain, NoException, NotLikeKind, NotLikeKindRec, OrdIncRecap, PropInfo, RecogGain, RecogGain2, RelatedParty, RelPartyInfo, RelPartyInfoBus, ReportGainOthProperty, S1043DeferredGain, S1043PropInfo, S1245Questions, S1250Questions, S1252Questions, SaleAndReplace, SaleNotTimely, SaleTime, ToFrm4797, ToFrm4797RelParty, ToSchD, ToSchDCollectible, ToSchDRelParty, TradeOrBiz, v1245PropOrIntangibleProp, vDec20RegChng, vForm1062Gain ...(+20)
- data fields (71): 83.10, 83.102, 83.103, 83.127, 83.128, 83.129, 83.130, 83.131, 83.132, 83.133629, 83.133630, 83.133631, 83.15, 83.156, 83.17, 83.18, 83.19, 83.20, 83.21, 83.22, 83.23, 83.24, 83.246451, 83.246452, 83.246453, 83.246454, 83.246455, 83.246456, 83.246457, 83.28, 83.29, 83.32, 83.35, 83.36, 83.38, 83.39, 83.40, 83.41, 83.42, 83.44, 83.5, 83.51, 83.56, 83.57, 83.6, 83.64, 83.65, 83.69, 83.7, 83.76, 83.77, 83.78, 83.79, 83.8, 83.80, 83.83, 83.85, 83.86, 83.9, 83.96 ...(+11)

### F8829Emp  (137 screens, 137 unique)
- titles: What if I manage my business from home but sell products outside my home office? | Work&ndash;Related Home Office | Why does the date of improvement matter? | How can I review my earlier entries for interest and taxes? | What if the home office is in the "Gulf Opportunity Zone" of Alabama, Florida, Louisiana, or Mississippi? | How to Calculate Based on Square Feet
- screens: F8829emp1, F8829emp2, F8829emp3, F8829emp7, vNotSureHO_EE, vProGuidance_HomeOffice, AmountOfSalary, BasisLiveAudit, BusinessArea, BusinessArea_LiveAudit, CarryoverLosses, CasualtyLossPortionOfOtherLines, ClaimingBalance, ConvenienceOfEmployer, DateFirstUsedHomeInBusiness, DayCareFacilityQual, DisplayCompletedHomeOfficeNoDeductionsEmployee, DisplayYourOfficeQualifies, EmployeeHOExp, EmployeeMtgeTaxes, ExcessCasualtyLosses, Gain, HomeHasStorageUse, HomeOfficeDesc, HomeOfficePercentage, HomeOfficeResultsDQ, HomeOfficeSafeHarborDeductionEE, HomeOfficeSafeHarborDeductionLLYEE, HomeOfficeSafeHarborDeductionNew, HOSummarySEHO, HOSummarySEHONoDeduction, HOSummarySERenter, HOSummarySERenterNoDeduction, Improvements, IsQualifiedResidenceInterest, ItemizedDeduction, MortgInt, NeedToAskDepreciationQuestions, No1098LenderInfo, NoHomeOfficeMin, NumberOfHours, OIHSafeHarborResult, OthEmpExpsNotForHomeScreen, PercentHomeOfficeDaycare, PercentHomeOfficeEmpeeScreen, PercentHomeOfficeSelfEmpScreen, PersonalPortionRETax, REDedLimit, ReduceLimit, RegularUse ...(+87)
- data fields (124): 103.148555, 103.150740, 103.150741, 103.150742, 103.150743, 103.150744, 103.150745, 103.150746, 103.150749, 103.150750, 103.157, 103.18, 103.19, 103.195635, 103.195636, 103.195637, 103.195642, 103.195643, 103.195644, 103.195649, 103.195650, 103.195651, 103.195656, 103.195657, 103.195658, 103.195663, 103.195664, 103.195665, 103.195670, 103.195671, 103.195672, 103.195677, 103.195678, 103.195679, 103.195684, 103.195685, 103.195686, 103.195691, 103.195692, 103.195693, 103.195698, 103.195699, 103.195700, 103.196054, 103.196061, 103.196062, 103.196215, 103.196216, 103.203625, 103.203626, 103.203627, 103.203628, 103.203795, 103.203796, 103.203797, 103.203798, 103.203799, 103.203800, 103.211671, 103.215633 ...(+64)

### F8829SE  (140 screens, 139 unique)
- titles: What if I manage my business from home but sell products outside my home office? | Tell us about lender information not on Form 1098. | Why does the date of improvement matter? | How can I review my earlier entries for interest and taxes? | Your home office can be a valuable deduction! | What if the home office is in the "Gulf Opportunity Zone" of Alabama, Florida, Louisiana, or Mississippi?
- screens: F8829se1, F8829se2, F8829se3, F8829se7, vBoat, vMultipleHO, vNotSureHO_SE, vPYUseHO, vWhatAreConsequences, AmountOfSalary, BasisLiveAudit, BusinessArea, BusinessArea_LiveAudit, CarryoverLosses, CasualtyLossPortionOfOtherLines, ClaimingBalance, ConvenienceOfEmployer, DateFirstUsedHomeInBusiness, DayCareFacilityQual, DisplayCompletedHomeOfficeNoDeductionsEmployee, DisplayYourOfficeQualifies, EmployeeHOExp, EmployeeMtgeTaxes, ExcessCasualtyLosses, Gain, HomeHasStorageUse, HomeOfficeDesc, HomeOfficePercentage, HomeOfficeResultsDQ, HomeOfficeSafeHarborDeductionEE, HomeOfficeSafeHarborDeductionLLYEE, HomeOfficeSafeHarborDeductionNew, HOSummarySEHO, HOSummarySEHONoDeduction, HOSummarySERenter, HOSummarySERenterNoDeduction, Improvements, IsQualifiedResidenceInterest, ItemizedDeduction, MortgInt, NeedToAskDepreciationQuestions, No1098LenderInfo, NoHomeOfficeMin, NumberOfHours, OIHSafeHarborResult, OthEmpExpsNotForHomeScreen, PercentHomeOfficeDaycare, PercentHomeOfficeEmpeeScreen, PercentHomeOfficeSelfEmpScreen, PersonalPortionRETax ...(+89)
- data fields (124): 103.148555, 103.150740, 103.150741, 103.150742, 103.150743, 103.150744, 103.150745, 103.150746, 103.150749, 103.150750, 103.157, 103.18, 103.19, 103.195635, 103.195636, 103.195637, 103.195642, 103.195643, 103.195644, 103.195649, 103.195650, 103.195651, 103.195656, 103.195657, 103.195658, 103.195663, 103.195664, 103.195665, 103.195670, 103.195671, 103.195672, 103.195677, 103.195678, 103.195679, 103.195684, 103.195685, 103.195686, 103.195691, 103.195692, 103.195693, 103.195698, 103.195699, 103.195700, 103.196054, 103.196061, 103.196062, 103.196215, 103.196216, 103.203625, 103.203626, 103.203627, 103.203628, 103.203795, 103.203796, 103.203797, 103.203798, 103.203799, 103.203800, 103.211671, 103.215633 ...(+64)

### F8839KB  (85 screens, 85 unique)
- titles: Eligible Child | What are qualified adoption expenses? | Enter Benefit Amounts | Adoption Credit Results | Special-Needs Adoption | Adoption Credit Carryforward to 2025
- screens: F8839KB1, F8839KB2, AddPYAB1stKid, AddPYAB2ndKid, AddPYAB3rdKid, AdoptionExpenses1, AdoptionExpenses2, AdoptionExpenses3, AdoptionExpensesThisYr1, AdoptionExpensesThisYr2, AdoptionExpensesThisYr3, AskReMore, AskReMore3rd, CFAmounts, CFAmountsDoYouHave, CFAmountsEnter, Disqualified, Documentation, EmployerBenefits, EmployerBenefits3Kids, EmployerPlan, FileStatus, FirstChild, NoCreditOrCarry, NonFinalForeignAdoptions, NonFinalForeignAdoptionsAB, OtherPost2001Expenses1, OtherPost2001Expenses2, OtherPost2001Expenses3, PenInPYAB, Prior8839s, Prior8839s2, Prior8839s3, PriorAmts, PriorAmts2, PriorAmts3, PriorBeneAmount1, PriorBeneAmount2, PriorBeneAmount3, PriorBenefits1Kid, PriorBenefits2Kids, PriorBenefits3Kids, PriorForeignChild1Bens, PriorForeignChild2Bens, PriorForeignChild3Bens, PriorYearExpenses1, PriorYearExpenses2, PriorYearExpenses3, PYABRecvd1, PYABRecvd2 ...(+35)
- data fields (71): 157.105, 157.106, 157.112, 157.113, 157.12, 157.13, 157.132, 157.133, 157.134, 157.14, 157.15, 157.17104, 157.17105, 157.18, 157.183, 157.184, 157.19, 157.20, 157.21, 157.22, 157.23, 157.24, 157.25, 157.256, 157.257, 157.323, 157.324, 157.329, 157.330, 157.356, 157.357, 157.374, 157.379, 157.380, 157.382, 157.383, 157.384, 157.385, 157.388, 157.389, 157.390, 157.391, 157.392, 157.398, 157.399, 157.72925, 157.72926, 157.72927, 157.72929, 157.72930, 157.72931, 157.72932, 157.72933, 157.72936, 157.72940, 157.72943, 157.72944, 157.72945, 157.72950, 157.72951 ...(+11)

### F8853KB  (12 screens, 12 unique)
- titles: What if I received payments for a life insurance policy? | Medical Savings Account | MSA's and Long-Term Care | What if I (or my spouse) received Archer MSA or Medicare Advantage MSA distributions this year? | What if I didn't spend all the money in my MSA? | Payments from and premiums paid to my health insurer.
- screens: F8853KB1, F8853KB2, F8853KB3, UseWholeForm, vBeneficiaryOfArcherMSA, vHealthInsuranceTopic, vLifeInsPayments, vMoneyLeftOver, vMustFileReturn, vNoActivityMSATopic, vPYExcessArcherMSAContrib, hMSA

### F8859KB  (9 screens, 9 unique)
- titles: DC 1st-Time Homebuyer Credit and Carryforward Amounts | District of Columbia First-Time Homebuyer Credit | Amount of Credit Carryforward from 2024 | DC First-Time Homebuyer Credit | No DC 1st-Time Homebuyer Credit | Credit Carryforward from 2024
- screens: F8859KB1, F8859KB2, AmountCarriedForward, CreditCarryforward, LLYCarryFwdAmt, Results, ResultsCarryFwdNoCYCredit, ResultsCreditNoCF, ResultsNoCreditNoCarryFwd
- data fields (2): 149.46120, rb_CreditCarry

### F8880KB  (35 screens, 35 unique)
- titles: Who Qualifies for the Saver's Credit? | Why didn't I get a credit for the full amount of my contributions? | What Are Voluntary Employee Contributions? | Your Saver's Credit | Other Qualified Retirement Plans | What should I include as a "distribution"?
- screens: F8880KB1, F8880KB2, AbleContribs, AbleContribsMFJ, AnyDistributions, DistributionAmt, DistributionAmtMFJ, NoCredit, NoCreditHiAGI, SaversCredit, Sec457Deferrals, Sec457DeferralsMFJ, SelfEmployedDeferrals, SelfEmployedDeferralsMFJ, VoluntaryContributions, VoluntaryContributionsMFJ, YourCredit, YourCreditMFJ, vABLESaversCreditFAQ, vAmtToEnter, vDistributions, vEligible, vExtension, vGovtDesignatedRothContribs, vS414h2Contribs, vSEP, vSIMPLE, vVoluntary, vWhoQuals, vWhyNoCredit, vWhyNotAll, hFTS, hLimits, hOtherPlans, hQualPlan
- data fields (19): 202.140400, 202.140401, 202.209986, 202.209987, 202.55, 202.56, 202.70, 202.72, 202.76, 202.77, 202.78, 202.79, 202.80, 202.81, 202.82, 202.83, 202.90, 202.91, rb_Distribs

### F8889KB  (69 screens, 69 unique)
- titles: Here are your health savings account (HSA) results. | Tell us how you spent the $ 0 | How should I answer if I rolled over the distribution into another HSA? | Were you enrolled in Medicare on Dec. 1, 2025 | What type of plan did you have each month? | What if my family plan had both an umbrella deductible and embedded deductibles for each family member?
- screens: F8889KB1, F8889KB2, F8889KB3, F8889KB6, AddExtraMoneySP, AddExtraMoneyTP, AdditionalContribs, AllForMedExp, AllocationMFJ_SP, AllocationMFJ_TP, AllocationNonMFJ, AnyContribsNoW2, ComplexDataEntry, ComplexDataEntrySP, ContribAmt, DistributionnInfo, ExcessContrib_Employ, ExcessContrib_NonEmploy, FamilyAllocationQues, FamilyAllocationQues_Unmarried, HowSpentDistrib, HSAContribs, LastMonthFamily, LastMonthRule, LastMonthRuleSP, LiveAudit_NP, MedicareSP, MedicareTP, OtherCoverage, PartIIICoverageFailure, PartIIIQuestion, PartIIIQuestionSP, PartIIIResults, PenaltyExc, Recd1099SA, Results, SameCoverage, vDidntGet1099SA, vExceptionExpl, vFSAcontributions, vGWDeathOfBen, vGWDeathOfBen2, vHighDedPlan, vHowToDivide, vHSA, vIneligibleForMonth, vLapsedCoverage, vLapseDueToDeathDisability, vMFJFamilyPlan, vOtherContributor ...(+19)
- data fields (69): 10297.10464, 10297.10467, 10297.164161, 10297.164163, 10297.164165, 10297.164169, 10297.186674, 10297.186676, 10297.238656, 10297.238657, 10297.38028, 10297.38032, 10297.38036, 10297.38040, 10297.38044, 10297.38048, 10297.38052, 10297.38056, 10297.38060, 10297.38064, 10297.38068, 10297.38072, 10297.38082, 10297.45681, 10297.45682, 10297.48447, F8889.DistRolledOver, F8889.EmployerWDEarnings, F8889.MedExp, F8889.QualHSADistrib, F8889.TaxpayerWDEarnings, F8889.TotExcessDistWithdrawn, rb_1099SA, rb_AnyContribs, rb_ComplexEntry1, rb_ComplexEntry10, rb_ComplexEntry11, rb_ComplexEntry12, rb_ComplexEntry2, rb_ComplexEntry3, rb_ComplexEntry4, rb_ComplexEntry5, rb_ComplexEntry6, rb_ComplexEntry7, rb_ComplexEntry8, rb_ComplexEntry9, rb_CoverageChange, rb_EmployerExcessInW2, rb_ExtraMoneySP, rb_ExtraMoneyTP, rb_FamilyAllocation, rb_LastMonth, rb_LastMonthFamily, rb_LiveAudNP1, rb_LiveAudNP10, rb_LiveAudNP11, rb_LiveAudNP12, rb_LiveAudNP2, rb_LiveAudNP3, rb_LiveAudNP4 ...(+9)

### F8936KB  (40 screens, 40 unique)
- titles: Modified Adjusted Gross Income (MAGI) Limits | Vehicle Identification Number (VIN) | Sorry, you don't qualify for a Clean Vehicle Credit | How do I add a third vehicle? | Sorry, you don't qualify for the Previously Owned Clean Vehicle Credit | New Clean Vehicle Credit or Qualified Commercial Clean Vehicle Credit
- screens: F8936KB3, AcquisitionDate, BizUseNewCV, CVCrdts, CVCsWelcome, CVDisqualified, CVInfo, CVNewCrdt, CVNewDisqualified, CVPrevDis, CVPrevDisqualified, DoNotQualNewCVCrdt, DoNotQualPrevOwnedCVCrdt, InfoVehicle1, InfoVehicle2, NewCVCrdt, NewCVCrdtSum, PrevOwnedCVCrdtSum, PrevOwnedFuelCell, PrevOwnedInfo, QualComCVCrdt, QualInc, Results, v8936PartV, vAdd3rdVehicle, vBusinessVehicle, vCrdtPriority, vModAGILimits, vPriorPrevOwnedCVCrdt, hCrdtSelector, hDatePurchasedPlacedInService, hEligibilityReq, hLearnMore_F8936, hLearnMore_NewCleanVehicle, hLearnMore_PrevOwnCleanVCrdt, hLearnMore_QualComCleanVCrdt, hLearnMore_VIN, hModAGIIncLmts, hTentativeCredit, hVehicleCreditPhaseOut
- data fields (44): 150908.244870, 150908.244871, 150908.244872, 150908.244873, 150908.244874, 246804.247054, 246804.247055, 246804.247056, 246804.247057, 246804.247058, 246804.247069, 246804.247070, 246804.247086, 246804.250384, 246804.253642, F8936.AllowableCredit1, F8936.AllowableCredit2, F8936.dAnotherVehicle, F8936.DateInSrvc1, F8936.DateInSrvc2, F8936.GM_1, F8936.GM_2, F8936.Make1, F8936.Make2, F8936.Model1, F8936.Model2, F8936.NA_Assembly_1, F8936.NA_Assembly_2, F8936.Tesla_1, F8936.Tesla_2, F8936.Toyota_1, F8936.Toyota_2, F8936.V2or3Cost1, F8936.V2or3Cost2, F8936.VIN1, F8936.VIN2, F8936.Year1, F8936.Year2, rb_AcqDate, rb_CleanVehicleType, rb_ForeignUse, rb_UseOrLease, rb_UseOrLease0, rb_UseOrLease1

### F8936SCHA  (59 screens, 59 unique)
- titles: Clean Vehicle Credit Qualifying Income | Modified Adjusted Gross Income (MAGI) Limits | How do you plan to use your new clean vehicle? | Sorry, you don't qualify for a Clean Vehicle Credit | Does the VIN entered belong to a NEW clean vehicle placed in service during the tax year? | What is the tentative credit amount?
- screens: F8936SCHA3, AlreadyReceivedCrdt, BizUseNewCV, BusInvestCrInfo, CommCrInfo, CommVIN, CVCrdts, CVCrdts_V2, CVDisqualified, CVInfo, CVNewCrdt, CVNewCrdtResell, CVNewDisqualified, CVPrevDis, CVPrevDisqualified, DoNotQualNewCVCrdt, DoNotQualPrevOwnedCVCrdt, DoNotSupport, InfoVehicle1, InfoVehicle2, NewCVCrdt, NewCVCrdtSum, NewVIN, PrevOwnedCrInfo, PrevOwnedCVCrdtSum, PrevOwnedFuelCell, PrevOwnedInfo, PrevOwnedVIN, QualComCVCrdt, QualInc, QualIncMFJ, RePymtNewHighMAGI, RePymtNewThirtyDays, RePymtPrevOwnedHighMAGI, RePymtPrevOwnedThirtyDays, Resell, Results, VehicleInfo, v8936PartV, vAdd3rdVehicle, vBusinessVehicle, vCP99D_Notice, vCrdtPriority, vHowManyTransfers, vPriorPrevOwnedCVCrdt, vZeroCrdt, vZeroCrdtReason, hCP99DNotice, hDatePurchasedPlacedInService, hEligibilityReq ...(+9)
- data fields (51): 150908.256197, 150908.256682, 150908.256683, 150908.256684, 150908.256685, 150908.256686, 246804.247054, 246804.247055, 246804.247056, 246804.247057, 246804.247058, 246804.247069, 246804.247070, 246804.247086, 246804.247096, 246804.247097, 246804.247100, 246804.250384, 246804.253642, F8936.AllowableCredit1, F8936.AllowableCredit2, F8936.dAnotherVehicle, F8936.DateInSrvc1, F8936.DateInSrvc2, F8936.GM_1, F8936.GM_2, F8936.Make1, F8936.Make2, F8936.Model1, F8936.Model2, F8936.NA_Assembly_1, F8936.NA_Assembly_2, F8936.Tesla_1, F8936.Tesla_2, F8936.Toyota_1, F8936.Toyota_2, F8936.V2or3Cost1, F8936.V2or3Cost2, F8936.VIN1, F8936.VIN2, F8936.Year1, F8936.Year2, rb_BusPersonalUse, rb_CleanVehicleType, rb_Deprallowed, rb_ForeignUse, rb_GasPower, rb_UseOrLease, rb_UseOrLease0, rb_UseOrLease1, rb_UseOrLease2

### F8958KB  (29 screens, 29 unique)
- titles: What do I do if I have more than five W-2s to enter? | Tell us about your dividend income. | What do I do if I have more than two sources of pension income? | Splitting Dividend Income | Was all your interest community income? | Are all your wages community income?
- screens: AllDivCommIncome, AllIntCommIncome, AllWagesCommIncome, BasicInfoMFS, BasicInfoNonMFS, CapGainInfo, DivInfo, DontNeedTopic, InterestInfo, OtherInfo, PensionInfo, RentInfo, SEIncInfo, SETaxInfo, StateRefund, WageInfo, WithholdingInfo, vMoreThan2Pensions, vMoreThan5, vWhenIsDivCommInc, vWhenIsIntCommInc, hCommunityPropertyStates, hOtherDeds, hOtherInc, hOtherMisc, hSplittingCapGain, hSplittingDiv, hSplittingIncOrLoss, hSplittingInt
- data fields (120): 203617.203931, 203617.203933, 203617.203935, 203617.209230, 203617.209232, 203617.209233, 203617.209234, 203617.209236, 203617.209237, 203617.209238, 203617.209240, 203617.209241, 203617.209242, 203617.209244, 203617.209245, 203617.209246, 203617.209248, 203617.209249, 203617.209250, 203617.209252, 203617.209253, 203617.209254, 203617.209256, 203617.209257, 203617.209258, 203617.209260, 203617.209261, 203617.209262, 203617.209264, 203617.209265, 203617.209266, 203617.209268, 203617.209269, 203617.209270, 203617.209272, 203617.209273, 203617.209277, 203617.209278, 203617.209280, 203617.209281, 203617.209282, 203617.209284, 203617.209285, 203617.209286, 203617.209288, 203617.209289, 203617.209290, 203617.209292, 203617.209293, 203617.209294, 203617.209296, 203617.209297, 203617.209298, 203617.209300, 203617.209301, 203617.209302, 203617.209304, 203617.209305, 203617.209306, 203617.209308 ...(+60)

### F8959KB  (4 screens, 4 unique)
- titles: Additional Medicare Tax | Code N | Code B | Codes B and N
- screens: AddlMedTax, CodeB, CodeN, CodesBAndN
- data fields (1): 144375.162738

### F8960KB  (19 screens, 19 unique)
- titles: Net Investment Income Tax Summary | CFC or PFIC Net Investment Income Adjustment | Net Investment Income Tax | Adjustments to Net Investment Income | Regulations Section 1.1411-10(g) Election | State Income Tax
- screens: CFCAndPFICAdjustments, ExpenseAdjustments, IncomeAdjustments, NetInvIncTax, Summary, vAnyAdj, hLearnMore_AddlMods, hLearnMore_Alien, hLearnMore_CFCGrossIncMod, hLearnMore_CFCIncAdj, hLearnMore_CFCOrPFIC, hLearnMore_EarlyWD, hLearnMore_NonQual, hLearnMore_OtherIncAdj, hLearnMore_PartnerSCorp, hLearnMore_Rental, hLearnMore_Sec1411Elec, hLearnMore_StateTax, hLearnMore_TradeOrBiz
- data fields (15): 144376.147047, 144376.147048, 144376.147050, 144376.150108, 144376.150112, 144376.150124, 144376.150145, 144376.150148, 144376.150213, 144376.241755, F8960.MiscExpAdj, F8960.MiscExpCalcd, F8960.OtherDeds, F8960.TaxPrepCalcdMW, F8960.TaxPreptoLn10MW

### F8995A  (8 screens, 8 unique)
- titles: Why does it matter if I have a specified service trade or business? | Property Basis | Tell us about | Specified Service Trade or Business | Self-employed health insurance premiums | Trade or Business W-2 Wages
- screens: F8995A3, TellUsAboutC, TellUsAboutCSE, vSpecifiedFAQ, hBasis, hSEHI, hSpecified, hW2Wages
- data fields (7): 7.218567, 7.218568, 7.219279, 7.219280, 7.220964, 7.69, rb_IsSpecified

### F8995A_E  (6 screens, 6 unique)
- titles: Why does it matter if I have a specified service trade or business? | Specified Service Trade or Business | Property Basis | Tell us about | Let's work on your Sched. E qualified business income deduction. | Trade or Business W-2 Wages
- screens: F8995A_E3, TellUsAboutE, vSpecifiedFAQ, hBasis, hSpecified, hW2Wages
- data fields (5): 220983.221007, 220983.221017, 220983.221018, 220983.221019, rb_IsSpecified

### F8995A_F  (8 screens, 8 unique)
- titles: Why does it matter if I have a specified service trade or business? | Property Basis | Tell us about | Let's work on your Sched. F qualified business income deduction. | Specified Service Trade or Business | Self-employed health insurance premiums
- screens: F8995A_F3, TellUsAboutF, TellUsAboutFSE, vSpecifiedFAQ, hBasis, hSEHI, hSpecified, hW2Wages
- data fields (7): 16.218582, 16.218583, 16.220544, 16.220545, 16.220957, 16.72, rb_IsSpecified

### F8995A_K1  (4 screens, 4 unique)
- titles: Let's work on your QBI deduction for Schedule K-1. | Tell us about | Self-employed health insurance premiums
- screens: F8995A_K13, TellUsAboutK1CSE, TellUsAboutK1SE, hSEHI
- data fields (9): 51.218573, 51.221208, 51.221209, 51.221224, 51.221225, rb_IsSpecified, SchedF.mwQBIBasis, SchedF.mwQBIPatrWages, SchedF.mwQBIWages

### F8995A_Summary  (4 screens, 4 unique)
- titles: Your QBI deduction is $ | You're not eligible for the QBI deduction. | Reduction Amount | Self-employment Adjustments
- screens: F8995ANoQBID, F8995AResults, hReduction, hSelfEmpAdj
- data fields (1): F8995ASUM.qbiOther

### F9000  (5 screens, 5 unique)
- titles: Alternative Media Preference | Tell us your Alternative Media Preference
- screens: F90001, F90002, F90003, F90006, Form9000InterviewScreen

### F982KB  (55 screens, 55 unique)
- titles: Cancelled Mortgage Debt | Real Property Business Debt | Basis of Other Property | Your Mortgage Debt Cancellation Results | Insolvency Exclusion for Mortgage Debt | Qualifying Mortgage Balance Before Refinancing
- screens: F982KB2, AgreementBefore2018, BankruptcyAmt, BasisRedux, BasisReduxNonDep, CancDebtIncome, CapLossCarryOver, COD_GW, DebtGrtrAssets, ExclFarmDebt, ExclOtherDebt, ExclOtherDebtEZ, F1099CAmt, FedStudentDebtRelief, HomeBasisMortgDebt, HomeOwnerShip, NotEligibleHomeMortExcept, QPRIresults, RealPropBusDebt, ReducedHomeBasis, ReduxTaxAttributes, ReduxTaxAttributes_Farm, ReportHomeSale, TaxableCOD, TaxBeneRedux, TaxBeneRedux2, YrRefiMortg, vBusinessDebt, vCOVIDCancelDebt, vDebtNotMortg, vHowTellIfTaxable, vMtgAndOtherDebt, hAmtOfCancelledDebt, hFedStudentLoanRelief, hInsolvExcl, hInsolvExclMortgDebtt, hLearnMore_1099C, hLearnMore_BasisOtherProp, hLearnMore_BuildOrImprove, hLearnMore_DebtMoreThanAssets, hLearnMore_ExclDebt, hLearnMore_ForTaxCrcarry, hLearnMore_GBCrCarry, hLearnMore_Including_COD_in_income, hLearnMore_Insolvent, hLearnMore_MinTaxCr, hLearnMore_NOL, hLearnMore_OthCancelDebt, hLearnMore_PassActLossCrCarry, hLearnMore_PreCancelBasis ...(+5)
- data fields (38): 49779.166275, 49779.166276, 49779.166277, 49779.166278, 49779.166279, 49779.166280, 49779.166283, 49779.166284, 49779.166286, 49779.166347, 49779.166348, 49779.166349, 49779.166350, 49779.166351, 49779.166352, 49779.185894, 49779.49808, 49779.49809, 49779.49810, 49779.49811, 49779.49812, 49779.49813, 49779.49815, 49779.49816, 49779.49817, 49779.49818, 49779.49819, F982.ReduceDeprecBasisFarm, F982.ReduceLandBasisFarm, F982.ReduceOtherBasis, F982.ReduceOtherTBBasisFarm, F982.SPStudentDebtAmt, F982.StudentDebtReliefCB, F982.TPStudentDebtAmt, rb_agreement, rb_COD, rb_debt, rb_home

### FChildKB  (26 screens, 26 unique)
- titles: Here's your child and dependent care credit results. | How do I Get Earned Income? | Tell us about your unused dependent care FSA amounts. | Did you pay for 2024 | What if I included the amounts paid for 2024 | Enter the requested information if applicable.
- screens: FChildKB1, FChildKB2, AmtForfeited, CanGetFullCredit, CanGetFullCreditRef, CantGetFullCredit, CreditAndExclusion, CreditAndExclusionRef, DepCarePlanInfo, DepCarryoverInfo, EPCNonQualExp, GracePdCarry, NoCreditOrExclusion, PdInOtherYearDCBs, PdInOtherYearNoDCBs, PrevYrExp, PrevYrExpCont, PrevYrExpCont2, YouHaveFSA, vCarryover, vMadeAMistake, vPurposeTheseAmts, vPurposeTheseAmtsDCBs, hEarnedIncome, hNon_Qual_Exp, hQuaifying_Person
- data fields (81): 149.243077, 149.243078, 149.243079, 149.243080, 149.243081, 149.243082, 149.243083, 149.249633, 242325.243084, 242325.243085, 242325.243086, 242325.243087, 242325.243088, 242325.243089, 242325.243090, 242325.243091, 242325.243092, 242325.243093, 242325.243094, 242325.243095, 242325.243096, 242325.243097, 242325.243098, 242325.243099, 242325.243100, 242325.243101, 242325.243102, 242325.243103, 242325.243104, 242325.243105, 242325.243106, 242325.243107, 242325.243108, 242325.243109, 242325.243110, 242325.243111, 242325.243112, 242325.243113, 242325.243114, 242325.243115, 242325.243116, 242325.243117, 242325.243118, 242325.243119, 242325.243120, 242325.243121, 242325.243122, 242325.243123, 242325.243124, 242325.243125, 242325.243126, 242325.243127, 242325.243128, 242325.249008, 242325.249009, 242325.249010, 242325.249011, 242325.249012, 242325.249856, 242325.249857 ...(+21)

### FECOMP  (5 screens, 5 unique)
- titles: Foreign Wages Earned in the United States | Foreign Wages | If I have a green card, what rules apply? | Foreign Wages Not on a W-2
- screens: FECOMP3, EarnedInUS, WageEntry, WageEntryMFJ, vGreenCard
- data fields (18): 187186.187241, 187186.187243, 187186.187244, 187186.187248, 187186.187249, 187186.187250, 187186.187251, 187186.187288, 187186.187289, 187186.195110, 187186.195111, 187186.195112, 187186.195113, 187186.195114, 187186.195115, 187186.195117, 187186.195118, rb_TpOrSp

### FElder  (65 screens, 65 unique)
- titles: Substantial Gainful Activity | Alternative Form | What form is used to claim this credit? | What if my spouse did not retire because of a permanent or total disability? | Retired on Disability | What if I received Workers' Compensation?
- screens: felder1, felder2, DateRetired, DateRetiredSp, DisabilityIncome, DisabIncAmt, ElimGainfulAct, MandRetAge, NoCredit, NontaxPension, NoPhysStateNeeded, PhysNameAndAddress, PhysNameAndAddressSp, PhysStateNeeded, Post83Physician, Pre84Physician, RetiredOnDisab, SpouseDisabInc, SpouseElimGainAct, SpouseMandRetAge, SpouseNoPhysStateNeeded, SpousePhysStateNeeded, SpousePost83PhysSt, SpousePre84PhysSt, SpouseRetiredOnDisab, YourElderlyOrDisabledCredit1040, vAgeDuringYr, vAgeDuringYrSp, vDisUncertain, vDisUncertainSp, vDontHave, vDontHaveSp, vHowDetermine, vNeedStmt, vNeedStmtSp, vNoStmt, vNoStmtSp, vPartTime, vPartTimeSp, vRecvdPension, vRecvdPensionSp, vRecvdSSBenes, vRecvdSSBenesSp, vRecvdWrkComp, vRecvdWrkCompSp, vRetNotDis, vRetNotDisabled, vRetNotDisSp, vTaxedPensions, vVolunteer ...(+15)
- data fields (20): 94.105, 94.106, 94.107, 94.73, 94.74, 94.75, 94.76, 94.77, rb_MandaRetireAge, rb_OldPhysicianStatmt, rb_PostPhysicianStatmt, rb_RetDisabInc, rb_RetiredOnDisab, rb_SpouseNoGainActiv, rb_SpouseOldPhysStmt, rb_SpousePostPhysStmt, rb_SpseRetDisInc, rb_SpseRetiredOnDisab, rb_SpseRetMandaAge, rb_SubstantGainAct

### FIRA  (237 screens, 237 unique)
- titles: You can contribute to an H&R Block Easy IRA. | We need SPNameFirst1 | What are primary and contingent beneficiaries? | Tell us about your recharacterization. | What if the IRA was recharacterized as a Roth IRA after December 31, 2025 | Filing Alone
- screens: BasisXpl, BasisXplSpouse, Consent, ConsentMFJ, ContribCompletedEither, ContribCompletedSelf, ContribCompletedSpouse, ContributionsAfterYrEndAndRoll, ConvertAll, EMailSelf, EMailSelfLiveAudit, EMailSpouse, EMailSpouseLiveAudit, ExistingHRBFARothIRASelf, ExistingHRBFARothIRASpouse, ExistingHRBFATradIRASelf, ExistingHRBFATradIRASpouse, FundingLinkSelf, FundingLinkSelfExisting, FundingLinkSpouse, FundingLinkSpouseExisting, IRAContribs, IRARemoved, JointAdditionalCompensation, LowerTaxes, NoDeductionSelf, NoDeductionSelf_MFJ, NoDeductionSpouse, NoIRACompensation, NoIRACompensationMFJSP, NoIRACompensationMFJTP, NoIRACompensationMFJTPSP, NonMFJGatewayNoIRA, OfferXIRA2, OfferXIRA2A, PrimBeneficiarySelf, PrimBeneficiarySelfLiveAudit, PrimBeneficiarySpouse, PrimBeneficiarySpouseLiveAudit, ProceedWithExpressNoIRAJoint, ProceedWithExpressNoIRAJointPlusSavers, ProceedWithExpressNoIRAJointRothOnly, ProceedWithExpressNoIRAJointRothOnlyPlusSavers, ProceedWithExpressNoIRASelf, ProceedWithExpressNoIRASelfPlusSavers, ProceedWithExpressNoIRASelfRothOnly, ProceedWithExpressNoIRASelfRothOnlyPlusSavers, ProceedWithExpressNoIRASpouse, ProceedWithExpressNoIRASpousePlusSavers, ProceedWithExpressNoIRASpouseRothOnly ...(+187)
- data fields (93): 92.10, 92.1098, 92.1099, 92.9, 92.987, 92.988, 93.101, 93.149, 93.151526, 93.151527, 93.151528, 93.151529, 93.181596, 93.181597, 93.181598, 93.181599, 93.184, 93.185, 93.243750, 93.243751, 93.243752, 93.243753, 93.352, 93.353, 93.354, 93.355, 93.368, 93.369, 93.425, 93.426, 93.483, 93.484, 93.497, 93.498, 93.501, 93.502, 93.580, 93.581, 93.582, 93.583, 93.584, 93.585, 93.586, 93.587, 93.588, 93.589, 93.590, 93.591, 93.592, 93.593, 93.594, 93.595, 93.596, 93.597, 93.598, 93.599, 93.600, 93.601, 93.602, 93.603 ...(+33)

### ForAcct  (19 screens, 19 unique)
- titles: Foreign Accounts | What if I'm living abroad? | Distribution | Grantor | Foreign Accounts and Financial Assets | Foreign Assets
- screens: FORACCT1, FORACCT2, Checkboxes, Country, ForAssets, ForeignAcctsTrustsGW, ForTrust, LiveAudit_GW, vChildForeignAcct, vF8938LivingAbroad, vF8938LivingAbroadCBScreen, vForAcct, hDistribution, hForeignTrust, hForFinAcct, hForFinAssets, hForFinAssets2, hGrantor, hTransferor
- data fields (4): 3.188711, 3.188713, 3.49, rb_ForeignAcctTrust

### FRe  (110 screens, 110 unique)
- titles: What about days where I was repairing or maintaining the property? | What if I'm in business as a self-employed writer, inventor, artist, etc.? | Tax Court Method | Your rental income is taxable. | When do I need to report income from a vacation rental? | What if I actively participated in the activity?
- screens: fre1, fre2, fre3, fre7, BefAftRental, BoughtOrSoldThisYr, ComputationMethod, DaysOfPersonalUse, DisposedEntireInt, FileAll1099s, IncomeTaxFreeExpensesNonDeductible, KindOfActivity, LessThanFairPrice, LessThanFairQues, LLYPropertyInfo, LLYPropertyInfoMFJ, MainOrSecondHome, MultiFamilyHousing, NameOfActivity, NameOfActivityMFJ, NumberOfDaysDwellingNoPers, NumberOfDaysDwellingNoPersAudit, NumberOfDaysDwellingPers, NumberOfDaysIncludedRoomNoPers, NumberOfDaysIncludedRoomNoPers_NotOwned, NumberOfDaysIncludedRoomPers, NumberOfDaysIncludedRoomPers_NotOwned, NumberOfDaysNonDwelling, NumberOfDaysNonDwellingAudit, OtherTypeDescrip, PartOwnership, PartOwnSpecialItems, PersonalAndFairRent, PersonalUse, PersonalUse_IncludedRoom, PlatClosingGenRule, PlatClosingGenRuleWithTip, PlatClosingIncludeNoIncExp, PlatClosingNoSpecialRules, PlatDaysBefAftRent, PlatDaysOfPersonalUse, PlatDaysOwned, PlatDaysPersUseWhileRent, PlatDaysRented, PlatMainHomeBefAftRent, PlatPersUseWhileRent, PlatVacationAssistant, PropertyInfo, PropertyInfoMFJ, RentalDaysAudit_Dwelling ...(+60)
- data fields (44): 15.108, 15.131610, 15.131614, 15.131615, 15.150655, 15.150656, 15.150657, 15.18, 15.184, 15.185973, 15.185974, 15.185975, 15.19, 15.20, 15.210280, 15.211685, 15.215, 15.22, 15.256, 15.259, 15.260, 15.261, 15.262, 15.27770, 15.27771, 15.27772, 15.27773, 15.280, 15.281, 15.282, 15.283, 15.284, 15.52021, 15.53276, 15.79570, rb_BefAftRent, rb_Home, rb_Kind, rb_Partial, rb_PersonalUse, rb_RoyaltiesInTopic, rb_TaxCtMethod, rb_UseWhileRent, rb_WhoseRental

### FT_AmdCheck  (12 screens, 12 unique)
- titles: Amended Return Transmitted | Your E-file Status: Amended Federal Return Accepted | Your E-file Status: Amended Federal Return Rejected | How do I amend my state return? | E-file Your Amended Return | Check Your E-file Status
- screens: CheckStatusAmendedGateway, CheckStatusAmendedGatewayJustSent, CheckStatusAmendedGatewayNotSub, CreditCardInstructAmd, FedAcceptedMailCheckAmd, FedAcceptedNothingToMailACHAmd, FedAcceptedNothingToMailAmd, FedAcceptedPayCCAmd, FedAcceptedPrintSigFormAmd, FedAcceptedPrintSigFormPayCCAmd, RejectedReturnAmd, vHowToAmendStateReturn

### FT_AmdTrans  (46 screens, 46 unique)
- titles: Sign Your Amended Federal Return | How can I get the status of my amended return refund? | Can I e-file if I have to amend my amended return? | Print and Mail Your Amended Return | Getting Ready to Sign Your Amended Federal Return | Update the Program
- screens: AuditBustersFoundAmd, CollectEMailAddressAmd, CollectWhoIsPreparingAmd, ConsentPaperlessACHAmd, ConsentPaperlessAmd, CreditCardPaymentAmd, GatherACHDataAmd, GatherDirectDepositInfoAmd, IdentityVerificationAmd, IdentityVerificationLLYAmd, IdentityVerificationMFJAmd, IdentityVerificationMFJLLYAmd, IdentityVerificationMFJLLYSepLYAmd, IdentityVerificationMFJLLYSPAmd, IdentityVerificationMFJSepLYAmd, IdentityVerificationMFJTPNoLYAmd, InstallPDF995Amd, LastYearFilingStatusAmd, LastYearFilingStatusMFJAmd, LastYearFilingStatusMFJLLYSPAmd, MustMailInDocsAmd, PDFAttachFormPrintDisabledAmd, PrintAndMailAmendedReturn, QualificationFailedAmd, ReviewAmendedReturn, SelectPmtMethodAmd, SignatureAmd, SignatureIPPINAmd, SignatureIPPINMFJAmd, SignatureMFJAmd, SignatureSPAmd, SubmitAmendedGateway, SubmitAmendedGatewayDraftForm, SubmitAmendedGatewayNotAccepted, SubmitAmendedGatewayNotElig, SubmitAmendedGatewayNotPrepared, TransmitReturnAlreadySentAmd, TransmitReturnAmd, UpdateRequiredAmd, VerifyACHDataAmd, VerifyDirectDepositInfoAmd, YourRefundBasicAmd, vCanEfileIfAmendAmended, vEnteredIncorrectDDInfoAmd, vHowGetStatusOfAmendedRefund, vHowToFileOnPaperAmd
- data fields (28): 183.144146, 92.147970, 92.191898, 92.191899, 92.391, 92.392, 92.399, 92.400, 92.638, 92.639, 92.640, 92.641, 92.644, 92.645, 92.647, 92.648, 92.709, 92.710, 92.711, 92.712, 92.734, 92.73584, 92.789, 92.791, 92.843, rb_EFAcctType, rb_EFPmtMethod, rb_RefundType

### FT_Backup  (3 screens, 3 unique)
- titles: Back Up Your Entire Return | What's the best place to save a backup so I can find it again? | Save Copies of Returns for Your Records
- screens: BackupGroupGateway, BackupGroupGatewayMac, vBestPlaceBackup

### FT_Check  (50 screens, 50 unique)
- titles: How do I make the corrections? | What should I do if my credit card payment isn't accepted? | What is the status of my refund? | Print and Mail Your Return | Returns Transmitted | Return Transmitted
- screens: AuditSupportInfo, CheckStatusGateway, CheckStatusGatewayAmd, CheckStatusGatewayFedSt, CheckStatusGatewayJustSent, CheckStatusGatewayJustSentFedSt, CheckStatusGatewayNotEF, CheckStatusGatewayNotSub, CheckStatusReminder, CreditCardInstruct, FedAcceptedMailCheck, FedAcceptedNothingToMail, FedAcceptedNothingToMailACH, FedAcceptedPayCC, FedAcceptedPrintSigForm, FedAcceptedPrintSigFormPayCC, RejectedReturn, StateRejectedDirect, StateRejectedJELF, vBackToCheckStatus, vCCNotAccepted, vForgetCheck, vHowPrintRec, vHowPrintSig, vHowToAMendReturn, vHowToCorrect, vHowToPrintState, vHowToStartNewReturn, vIsDCNOnForm, vOtherWaysToCheck, vPayByCheck, vPayByEFW, vStatusOfRefund, vWaitForCC, vWhyKeepDCN, hDCN, hEfileCCChargeWhenRejected, hEnrolledAgent, hReturnNotSub, StateAcceptedDisplayDCN, StateAcceptedPrintChecklist, StateAcceptedPrintSigForm, StateAcceptedPrintSigFormNoDCN, StateAcceptedPrintSigFormOpt, StateAcceptedPrintSigFormOpt2, StateAcceptedPrintSigFormOptV, StateAcceptedPrintSigFormOptV2, StateAcceptedPrintVoucher, StateBundledReturnAccepted, StateBundledReturnRejected

### FT_Efile  (40 screens, 40 unique)
- titles: Filing Your Federal Extension | How do I print the extension form? | How do you protect the security of my tax information? | Your Current Extension Filing Options | Your Current Filing Options | Can I file without connecting to the Internet?
- screens: EfileGroupGatewayDraftForm, EfileGroupGatewayExt, EfileGroupGatewayKeyCode, EfileGroupGatewayKeyCodeUsed, EfileGroupGatewayNoEfileYet, EfileGroupGatewayNoEfileYetExt, EfileGroupGatewayNoFilingYet, EfileGroupGatewayNoFilingYetExt, EfileGroupGatewayNoKeyCode, EfileGroupGatewayNoPricing, EfileGroupGatewayNoPricingExt, EfileGroupGatewayNotElig, EfileGroupGatewayNotEligExt, EfileGroupGatewayNotEligXIRA, EfileGroupGatewayReturnAcceptedExt, EfileGroupGatewayReturnPendingExt, FilerUnderAge16, FilingFederalExtension, PricingConnectFailed, ReportExtensionEfilePrice, vAdditionalExt, vCanFileWithoutConnecting, vCantEFileState, vCanUnder16Efile, vEFileChangeMind, vEfileDecedent, vEFileFedState, vEFilePrivacy, vEFileStateIfFedPaper, vFaxReturn, vFilingDeadline, vHowPrintExtension, vProtectSecurity, vWhatsAuditSupport, vWhatsEFiling, vWhatsEFilingExt, vWhenCanEFile, vWhenCanEFileExt, vXIRAPaperFile, hAuditSupport

### FT_End  (2 screens, 2 unique)
- titles: Check Your E-file Status | Congratulations! Your 2025
- screens: AllDoneGroupGateway, AllDoneGroupGatewayNotDone

### FT_ExtCheck  (15 screens, 15 unique)
- titles: E-file Fee Processing and Rejected Extension | Do I need to keep my Submission ID? | Extension Transmitted | What if I need to complete a state extension? | Moving on to Your Return | Your E-file Status: Federal Extension Rejected
- screens: CheckStatusExtGateway, CheckStatusExtGatewayJustSent, CheckStatusExtGatewayNotEF, CheckStatusExtGatewayNotSub, ExtFinished, FedExtAcceptedEFW, FedExtAcceptedMailCheck, FedExtAcceptedNoPmt, RejectedExt, vHowPrintRecExt, vKeepSubIDExt, vNeedCheckExtStatus, vWhatIfNeedStateExt, hEfileCCChargeWhenRejectedExt, hSubIDExt

### FT_ExtOp  (23 screens, 23 unique)
- titles: Final Accuracy Review | Can I cancel the electronic funds withdrawal after I e-file? | Electronic Funds Withdrawal of Payment with Extension | What are the advantages of each method? | Not E-filing | Topic Not Needed for Return
- screens: AuditBustersFound, EFilingDisabled, ExtOptionsGatewayDone, ExtOptionsGatewayNotEF, ExtOptionsGatewayNotReady, ExtOptionsGatewayReturn, ExtOptionsGatewayReturnAccepted, ExtOptionsGatewayReturnPending, GatherACHData, PaymentAmountNotEntered, PaymentNotRequired, PriorYearFilingStatusForPIN, QualificationFailed, SelectPmtMethod, VerifyACHData, vACHPmtDelay, vCancelDebit, vChangeDebitAmt, vHowKnowFilingStatus, vNeedClearAllMsgs, vPmtMethods, vQualReq, vWhyAskFilingStatus
- data fields (9): 183.268, 183.269, 183.270, 183.271, 183.272, 183.273, 183.274, rb_EFAcctType, rb_EFPmtMethod

### FT_ExtPrint  (11 screens, 11 unique)
- titles: Extension Filing Advice | Can I fax my extension to the IRS? | Fix Your Errors | Consider Making a Payment With Your Extension | Prepare Your Federal Return | Can I use FedEx or another overnight service?
- screens: AssembleExt, AuditBustersFound, ExtFinished, PaymentAmountNotEntered, PaymentNotRequired, PrintExt, PrintExtGateway, vFaxReturnExt, vHowPrintRecExt, vIfFoundMistakeExt, vUseFedExExt

### FT_ExtTrans  (32 screens, 32 unique)
- titles: When will the charge be processed? | Not E-filing | Finish Selecting Your Extension Filing Options | Tell Us Your Email Address | Sign Your Federal Extension | Paying Your E-file Fee by Credit or Debit Card
- screens: CCOptionsForEFileFeePmtExt, CollectEMailAddress, ConsentExt, ConsentExtEFW, EnterCCInfoForEFileFeePmtExt, SignatureExt, SignatureExtMFJ, SignatureExtMFJOneAGI, SubmitExtGateway, SubmitExtGatewayNoPricing, SubmitExtGatewayNotEF, SubmitExtGatewayNotReady, SubmitExtGatewaySent, TransmitExt, TransmitExtAlreadySent, UpdateRequired, vChangeAfterSubExt, vChangeExtFilingOpt, vHowEnterAGIfFiledSep, vHowEnterAGIIfAmended, vHowEnterAGIIfMFJ, vHowPrintExtBeforeFile, vHowToChangeImportedAGI, vIsCCChargedEachTimeSendExt, vNoEmailAddressExt, vPayingEfileFeeByCCExt, vRejectErrorsExt, vTroubleSendExt, vWhatIfNotAcceptedExt, vWhenChargeProcessedExt, vWhereGotAGIfrom, hPriorYrAGI
- data fields (20): 183.277, 183.278, 183.279, 183.280, 183.281, 183.282, 183.283, 92.48755, 92.48756, 92.48757, 92.48758, 92.48759, 92.48760, 92.48761, 92.48762, 92.48763, 92.48764, 92.843, rb_CCOption, rb_EFCC

### FT_FedOp  (163 screens, 163 unique)
- titles: What if I can't file my return electronically? | When will the money be withdrawn from my bank account? | What if I find that I have entered incorrect bank account information after I e-file my return? | What is IRS exception processing? | What does the Application for a Refund Processing Transfer mean to me? | Return Not Ready for E-filing
- screens: AuditBustersFound, CreditCardPayment, EFilingDisabled, ExceptionProcessingOption, EZPayAppStat, EZPayInfo, EZPayInstruct, FederalOptionsGatewayAmd, FederalOptionsGatewayDone, FederalOptionsGatewayDoneRefund, FederalOptionsGatewayExt, FederalOptionsGatewayExtStat, FederalOptionsGatewayNotEF, FederalOptionsGatewayNotReady, GatherACHData, GatherBankInfo, GatherDirectDepositInfo, GatherDirectDepositInfo3Acct, GC7216ConsentToDisclose, GC7216ConsentToDiscloseAmazon, GC7216ConsentToDiscloseMFJ, GC7216ConsentToDiscloseMFJAmazon, GC7216ConsentToUse, GC7216ConsentToUseMFJ, GCCollectResidentialAddressSP, GCCollectResidentialAddressTP, GCConsentToElectronicComm, GCNotAvailableNoDiscloseConsent, GCNotAvailableNoDiscloseConsentAmazon, GCNotAvailableNoUseConsent, GCNotAvailableNoUseConsentAmazon, GCNotQualified, GCNotQualifiedAmazon, GCOfferUsed, GCOfferUsedAmazon, GCRefundOptions, GCRefundOptionsAmazon, GCRefundOptionsWalmart, GCRefundSummary, GCRefundSummaryAmazon, GCRefundSummaryWalmart, GCRefundSummaryWithDD, GCRefundSummaryWithDDAmazon, GCRefundSummaryWithDDWalmart, GCTermsAndConditions, GCTermsAndConditionsAmazon, GCTermsAndConditionsWalmart, GiftCardOffer, GiftCardOfferAmazon, GiftCardOfferWalmart ...(+113)
- data fields (69): 183.158071, 183.158072, 183.161702, 183.20668, 92.1149, 92.1150, 92.1151, 92.1152, 92.1153, 92.1154, 92.1155, 92.1156, 92.1157, 92.1158, 92.158029, 92.158038, 92.158039, 92.158040, 92.158041, 92.158042, 92.158045, 92.158046, 92.158047, 92.158048, 92.158049, 92.391, 92.392, 92.399, 92.400, 92.44027, 92.44028, 92.44029, 92.44032, 92.44033, 92.44036, 92.44037, 92.44038, 92.44040, 92.44041, 92.44044, 92.44046, 92.44047, 92.44050, 92.638, 92.639, 92.640, 92.641, 92.644, 92.645, 92.647, 92.648, 92.942, 92.943, 92.944, 92.945, 92.950, 92.951, 92.952, 92.953, 92.984 ...(+9)

### FT_Finish  (11 screens, 11 unique)
- titles: Give Us Your Feedback | Thanks for Taking Our Survey | Purchase Software Assist | You're ready to chat with a tax pro. | Why should I print a paper copy of my return? | Thanks for Your Feedback
- screens: PurchaseWiz_ATPOffer, PurchaseWiz_ATPPurchaseConfirmation, PurchaseWiz_CreditCardInfo, SurveySent, UserFeedbackForm, UserFeedbackSent, WrappingUpGroupGateway, WrappingUpGroupGatewaySurveySent, vHowGetNextYearSoftware, vSecurityInfo, vWhyPrintRec
- data fields (31): 199.185978, 199.237533, 199.38097, 199.38098, 199.38099, 199.38100, 199.38101, 199.38102, 199.38103, 199.38104, 199.38105, 92.48755, 92.48756, 92.48757, 92.48758, 92.48759, 92.48760, 92.48761, 92.48762, 92.48763, 92.48764, 92.843, rb_BlockCaresRating, rb_EFCC, rb_FindDedRating, rb_FinGoalsRating, rb_MadeEasyRating, rb_NextYrRating, rb_OnlineRating, rb_PriceFairRating, rb_RecRating

### FT_Intro  (9 screens, 9 unique)
- titles: Your Maximum Refund &mdash; Guaranteed! | Questions frequently asked of our Tax Pros | Your Audit Risk Results | What are the benefits of e-filing an extension? | Filing Your Returns
- screens: Analyzer, FilingGroupGateway, FilingGroupGatewayNoFreeEfile, YourAuditRiskGreen, YourAuditRiskRed, YourAuditRiskYellow, YourMaxRefund, vBenefitsEfileExt, vProGuidance_W2s

### FT_Paper  (2 screens, 2 unique)
- titles: File Your Extension | Print and Mail Your Returns
- screens: FilingOnPaperGroupGateway, FilingOnPaperGroupGatewayExt

### FT_PrintFed  (37 screens, 37 unique)
- titles: Your Tax Return May Be Incorrect | What should I do if my credit card payment isn't accepted? | What kind of paper and printer should I use to print my return? | Why does the form I printed say "DRAFT FORM" on it? | What can I do if I'm using a Mac and the printed forms are too big or too small? | Go to the Amended Return Interview
- screens: AssembleReturn, AuditBustersFound, AuditSupportInfoPrint, CannotDoXIRA, CreditCardInstruct, CreditCardPayment, EZPayAppStat, EZPayInfo, EZPayInstruct, GatherDirectDepositInfo, PrintFederalGateway, PrintFederalGatewayAmd, PrintFederalGatewayEfiled, PrintFederalGatewayRefund, PrintFederalGatewaySent, PrintReturn, SelectPmtMethodPaper, SelectPmtMethodPaperEZPay, VerifyDirectDepositInfo, YourRefundPaper, vCCNotAcceptedPaper, vChangeMindRefundOptPaper, vDeadlinePayByCCPaper, vDraftForms, vFaxReturn, vIfFoundMistake, vIfNotAllFormsPrint, vIfNotAllFormsPrintSt, vMacPrintScalingIssues, vPayByCheckPaper, vPrintCopy, vPrintingProblems, vStateReturn, vUseFedEx, vWhatKindOfPaperShouldIUse, hCreditCardPmtPaper, hMayBeIncorrect
- data fields (24): 92.391, 92.392, 92.399, 92.400, 92.44027, 92.44028, 92.44029, 92.44032, 92.44033, 92.44036, 92.44037, 92.44038, 92.44040, 92.44041, 92.44044, 92.44046, 92.44047, 92.44050, 92.729, rb_EFAcctType1, rb_EFAcctType2, rb_EFAcctType3, rb_EFPmtMethod, rb_RefundType

### FT_PrintRec  (1 screens, 1 unique)
- titles: Print Copies of Returns For Your Records
- screens: FT_PrintRec3

### FT_PrintSt  (166 screens, 166 unique)
- titles: How long can I wait to pay? | Virginia Payment Options | Your Georgia Proof of Account | What should I do if my state requires federal forms to be attached? | Your Missouri Tax Payment | DDSpecAcctFAQTitleSt
- screens: FT_PrintSt1, FT_PrintSt3, AssembleReturnState, PrintReturnState, StateEfiled, StatePending, vIsStateAvail, vMultiStates, vWhatIfMyStateRequiresFederalFormsToBeAttached, vWhyStateNotListed, ArkansasRefund, AuditBustersFoundState, AuditBustersFoundStatePaper, DirectDepositDisclosure_OH, EfileMandate_MI, EPaymentOption_MI_efile, EPaymentOption_MI_paper, EPaymentOption_MN_efile, EPaymentOption_ND_efile, EPaymentOption_ND_paper, EPaymentOption_VA_efile, EPaymentOption_VA_paper, GatherACHDataSt, GatherACHDataSt4Acct, GatherACHDataStAcctHolderName, GatherACHDataStBankName, GatherACHDataStDC, GatherACHDataStDE, GatherACHDataStHI, GatherACHDataStIA, GatherACHDataStID, GatherACHDataStLA, GatherACHDataStMA, GatherACHDataStMD, GatherACHDataStME, GatherACHDataStMS, GatherACHDataStNM, GatherACHDataStNY, GatherACHDataStOK, GatherACHDataStPA, GatherACHDataStSC, GatherACHDataStVA, GatherDirectDepositInfo1, GatherDirectDepositInfo2, GatherDirectDepositInfo3, GatherDirectDepositInfo4, GatherDirectDepositInfo5, GatherDirectDepositInfo6, GatherDirectDepositInfoCO, GatherDirectDepositInfoIN ...(+116)
- data fields (35): 183.158, 183.159, 183.160, 183.161, 183.162, 183.163, 183.164, 183.165, 183.188831, 183.191, 183.195550, 183.229433, 183.249362, 183.249363, 183.249364, 183.249367, 183.249368, 183.249369, 183.249370, 183.249373, 183.33, 183.34, 183.35, 183.36, 183.39, 183.40, 183.69705, 183.79111, 183.79765, 183.79766, 183.79767, rb_EFAcctType, rb_EFAcctType1, rb_EFAcctType2, rb_EFPmtMethod

### FT_SepCheck  (17 screens, 17 unique)
- titles: E-file Your State Return | Your E-file Status: SelectedReturnName | Check Your E-file Status | Return(s) Transmitted | Print and Mail Your Return
- screens: StateAcceptedDisplayDCN, StateAcceptedPrintChecklist, StateAcceptedPrintSigForm, StateAcceptedPrintSigFormNoDCN, StateAcceptedPrintSigFormOpt, StateAcceptedPrintSigFormOpt2, StateAcceptedPrintSigFormOptV, StateAcceptedPrintSigFormOptV2, StateAcceptedPrintVoucher, StateBundledReturnAccepted, StateBundledReturnRejected, CheckStatSepStGatewayNotEFSep, CheckStatSepStGatewayNotSub, CheckStatusReminder, CheckStatusSepStGateway, CheckStatusSepStGatewayJustSnt, RejectedReturnSepState

### FT_SepCheck2  (17 screens, 17 unique)
- titles: E-file Your State Return | Your E-file Status: SelectedReturnName | Check Your E-file Status | Return(s) Transmitted | Print and Mail Your Return
- screens: StateAcceptedDisplayDCN, StateAcceptedPrintChecklist, StateAcceptedPrintSigForm, StateAcceptedPrintSigFormNoDCN, StateAcceptedPrintSigFormOpt, StateAcceptedPrintSigFormOpt2, StateAcceptedPrintSigFormOptV, StateAcceptedPrintSigFormOptV2, StateAcceptedPrintVoucher, StateBundledReturnAccepted, StateBundledReturnRejected, CheckStatSepStGatewayNotEFSep, CheckStatSepStGatewayNotSub, CheckStatusReminder, CheckStatusSepStGateway, CheckStatusSepStGatewayJustSnt, RejectedReturnSepState

### FT_SepSt  (174 screens, 174 unique)
- titles: E-filing Your State Returns | Virginia Payment Options | Your Georgia Proof of Account | Install Your State Program | Can I e-file my state return later? | Your State E-filing Options
- screens: ArkansasRefund, AuditBustersFoundState, AuditBustersFoundStatePaper, DirectDepositDisclosure_OH, EfileMandate_MI, EPaymentOption_MI_efile, EPaymentOption_MI_paper, EPaymentOption_MN_efile, EPaymentOption_ND_efile, EPaymentOption_ND_paper, EPaymentOption_VA_efile, EPaymentOption_VA_paper, GatherACHDataSt, GatherACHDataSt4Acct, GatherACHDataStAcctHolderName, GatherACHDataStBankName, GatherACHDataStDC, GatherACHDataStDE, GatherACHDataStHI, GatherACHDataStIA, GatherACHDataStID, GatherACHDataStLA, GatherACHDataStMA, GatherACHDataStMD, GatherACHDataStME, GatherACHDataStMS, GatherACHDataStNM, GatherACHDataStNY, GatherACHDataStOK, GatherACHDataStPA, GatherACHDataStSC, GatherACHDataStVA, GatherDirectDepositInfo1, GatherDirectDepositInfo2, GatherDirectDepositInfo3, GatherDirectDepositInfo4, GatherDirectDepositInfo5, GatherDirectDepositInfo6, GatherDirectDepositInfoCO, GatherDirectDepositInfoIN, GatherDirectDepositInfoMN, GatherDirectDepositInfoSplit2, HowDoYouWantRefundSt, HowDoYouWantRefundStDbtChk, HowDoYouWantRefundStDDDbt, HowDoYouWantRefundStDDDbtChk, HowDoYouWantRefundStDDDbtOrChk, HowDoYouWantRefundStYesNoDD, HowDoYouWantRefundStYesNoDebit, InstallPDF995St ...(+124)
- data fields (39): 183.158, 183.159, 183.160, 183.161, 183.162, 183.163, 183.164, 183.165, 183.188831, 183.191, 183.195550, 183.229433, 183.249362, 183.249363, 183.249364, 183.249367, 183.249368, 183.249369, 183.249370, 183.249373, 183.33, 183.34, 183.35, 183.36, 183.39, 183.40, 183.42762, 183.42763, 183.42764, 183.42765, 183.69705, 183.79111, 183.79765, 183.79766, 183.79767, rb_EFAcctType, rb_EFAcctType1, rb_EFAcctType2, rb_EFPmtMethod

### FT_SepSt2  (174 screens, 174 unique)
- titles: E-filing Your State Returns | Virginia Payment Options | Your Georgia Proof of Account | Install Your State Program | Can I e-file my state return later? | Your State E-filing Options
- screens: ArkansasRefund, AuditBustersFoundState, AuditBustersFoundStatePaper, DirectDepositDisclosure_OH, EfileMandate_MI, EPaymentOption_MI_efile, EPaymentOption_MI_paper, EPaymentOption_MN_efile, EPaymentOption_ND_efile, EPaymentOption_ND_paper, EPaymentOption_VA_efile, EPaymentOption_VA_paper, GatherACHDataSt, GatherACHDataSt4Acct, GatherACHDataStAcctHolderName, GatherACHDataStBankName, GatherACHDataStDC, GatherACHDataStDE, GatherACHDataStHI, GatherACHDataStIA, GatherACHDataStID, GatherACHDataStLA, GatherACHDataStMA, GatherACHDataStMD, GatherACHDataStME, GatherACHDataStMS, GatherACHDataStNM, GatherACHDataStNY, GatherACHDataStOK, GatherACHDataStPA, GatherACHDataStSC, GatherACHDataStVA, GatherDirectDepositInfo1, GatherDirectDepositInfo2, GatherDirectDepositInfo3, GatherDirectDepositInfo4, GatherDirectDepositInfo5, GatherDirectDepositInfo6, GatherDirectDepositInfoCO, GatherDirectDepositInfoIN, GatherDirectDepositInfoMN, GatherDirectDepositInfoSplit2, HowDoYouWantRefundSt, HowDoYouWantRefundStDbtChk, HowDoYouWantRefundStDDDbt, HowDoYouWantRefundStDDDbtChk, HowDoYouWantRefundStDDDbtOrChk, HowDoYouWantRefundStYesNoDD, HowDoYouWantRefundStYesNoDebit, InstallPDF995St ...(+124)
- data fields (39): 183.158, 183.159, 183.160, 183.161, 183.162, 183.163, 183.164, 183.165, 183.188831, 183.191, 183.195550, 183.229433, 183.249362, 183.249363, 183.249364, 183.249367, 183.249368, 183.249369, 183.249370, 183.249373, 183.33, 183.34, 183.35, 183.36, 183.39, 183.40, 183.42762, 183.42763, 183.42764, 183.42765, 183.69705, 183.79111, 183.79765, 183.79766, 183.79767, rb_EFAcctType, rb_EFAcctType1, rb_EFAcctType2, rb_EFPmtMethod

### FT_SepTrans  (153 screens, 153 unique)
- titles: Sign Your Mississippi Return | Illinois Consent to Disclosure and Signature | Your New Jersey Consent to Disclosure | How Do You Want to Sign Your West Virginia Return? | Your Vermont Consent to Disclosure | How do I know what my filing status was last year?
- screens: BalDueIL, CA_FirstTimeFiler, Consent_AL, Consent_AR, Consent_CO, Consent_CT, Consent_DC, Consent_GA, Consent_HI, Consent_IA, Consent_ID, Consent_IL, Consent_IN, Consent_KS, Consent_KY, Consent_LA, Consent_MA, Consent_ME, Consent_MO, Consent_MS, Consent_MT, Consent_NC, Consent_ND, Consent_NE, Consent_NJ, Consent_NM, Consent_OR, Consent_PA, Consent_RI, Consent_SC, Consent_TN, Consent_UT, Consent_VA, Consent_VT, Consent_WI, Consent_WV, ConsentAZ, ConsentHI, ConsentMA, ConsentMD, ConsentNY, ConsentNY_MFJ, ConsentOH, ConsentPA, CreatePIN_MS_Married, CreatePIN_MS_Single, CreatePIN_NJ_Married, CreatePIN_NJ_Single, CreatePIN_NY_Married, CreatePIN_NY_Single ...(+103)
- data fields (69): 183.109, 183.110, 183.16618, 183.16619, 183.16620, 183.16621, 183.17075, 183.17076, 183.20763, 183.20764, 183.210, 183.211, 183.212, 183.213, 183.214, 183.215, 183.218, 183.219, 183.221, 183.222, 183.33291, 183.46031, 183.46032, 183.53223, 183.53224, 183.53225, 183.53226, 183.53227, 183.53228, 183.53229, 183.53230, 183.53231, 183.53232, 92.48755, 92.48756, 92.48757, 92.48758, 92.48759, 92.48760, 92.48761, 92.48762, 92.48763, 92.48764, 92.734, EIWKS.ILPrepDate, FPERS.dNum08, FPERS.dNum09, FPERS.dStr07, FPERS.dStr08, FPERS.dStr09, FPERS.dStr10, FPERS.dStr11, FPERS.dStr12, FPERS.dStr13, FPERS.dStr14, rb_CCOption, rb_consentPAPIN, rb_EFCC, rb_EFFeePmtMethod, rb_UseFedAZ ...(+9)

### FT_SepTrans2  (153 screens, 153 unique)
- titles: Sign Your Mississippi Return | Illinois Consent to Disclosure and Signature | Your New Jersey Consent to Disclosure | How Do You Want to Sign Your West Virginia Return? | Your Vermont Consent to Disclosure | How do I know what my filing status was last year?
- screens: BalDueIL, CA_FirstTimeFiler, Consent_AL, Consent_AR, Consent_CO, Consent_CT, Consent_DC, Consent_GA, Consent_HI, Consent_IA, Consent_ID, Consent_IL, Consent_IN, Consent_KS, Consent_KY, Consent_LA, Consent_MA, Consent_ME, Consent_MO, Consent_MS, Consent_MT, Consent_NC, Consent_ND, Consent_NE, Consent_NJ, Consent_NM, Consent_OR, Consent_PA, Consent_RI, Consent_SC, Consent_TN, Consent_UT, Consent_VA, Consent_VT, Consent_WI, Consent_WV, ConsentAZ, ConsentHI, ConsentMA, ConsentMD, ConsentNY, ConsentNY_MFJ, ConsentOH, ConsentPA, CreatePIN_MS_Married, CreatePIN_MS_Single, CreatePIN_NJ_Married, CreatePIN_NJ_Single, CreatePIN_NY_Married, CreatePIN_NY_Single ...(+103)
- data fields (69): 183.109, 183.110, 183.16618, 183.16619, 183.16620, 183.16621, 183.17075, 183.17076, 183.20763, 183.20764, 183.210, 183.211, 183.212, 183.213, 183.214, 183.215, 183.218, 183.219, 183.221, 183.222, 183.33291, 183.46031, 183.46032, 183.53223, 183.53224, 183.53225, 183.53226, 183.53227, 183.53228, 183.53229, 183.53230, 183.53231, 183.53232, 92.48755, 92.48756, 92.48757, 92.48758, 92.48759, 92.48760, 92.48761, 92.48762, 92.48763, 92.48764, 92.734, EIWKS.ILPrepDate, FPERS.dNum08, FPERS.dNum09, FPERS.dStr07, FPERS.dStr08, FPERS.dStr09, FPERS.dStr10, FPERS.dStr11, FPERS.dStr12, FPERS.dStr13, FPERS.dStr14, rb_CCOption, rb_consentPAPIN, rb_EFCC, rb_EFFeePmtMethod, rb_UseFedAZ ...(+9)

### FT_StAmdCheck  (17 screens, 17 unique)
- titles: Choose Your Amended State Return | Amended Return Transmitted | Your E-file Status: SelectedReturnName | Check Your E-file Status | E-file Your Amended SelectedReturnName | E-file Your Amended State Return
- screens: CheckStatusAmdStGateway, CheckStatusAmdStGatewayJustSnt, CheckStatusAmdStGatewayNotSub, NoAmendedStateReturnsCheck, RejectedReturnAmdSt, SelectAmendedStateCheck, StateAcceptedDisplayDCN, StateAcceptedPrintChecklist, StateAcceptedPrintSigForm, StateAcceptedPrintSigFormNoDCN, StateAcceptedPrintSigFormOpt, StateAcceptedPrintSigFormOpt2, StateAcceptedPrintSigFormOptV, StateAcceptedPrintSigFormOptV2, StateAcceptedPrintVoucher, StateBundledReturnAccepted, StateBundledReturnRejected
- data fields (1): 183.237532

### FT_StAmdTrans  (153 screens, 153 unique)
- titles: E-filing Your Amended SelectedReturnName | Sign Your Mississippi Return | Illinois Consent to Disclosure and Signature | Your New Jersey Consent to Disclosure | How Do You Want to Sign Your West Virginia Return? | Your Vermont Consent to Disclosure
- screens: AuditBustersFoundStateAmd, InstallPDF995StAmd, NoAmendedStateReturnsTrans, PDFAttachFormPrintDisabledStAmd, QualificationFailedStateAmd, SelectAmendedStateTrans, StateReturnNotPrequalifiedAmd, SubmitAmendedStateGateway, SubmitAmendedStateGatewayNotAccepted, SubmitAmendedStateGatewayNotAmended, TransmitAmdStateReturn, TransmitAmdStateReturnAlreadySnt, UpdateRequiredStAmd, vHowFileAmendedReturnForStateNotListed, BalDueIL, CA_FirstTimeFiler, Consent_AL, Consent_AR, Consent_CO, Consent_CT, Consent_DC, Consent_GA, Consent_HI, Consent_IA, Consent_ID, Consent_IL, Consent_IN, Consent_KS, Consent_KY, Consent_LA, Consent_MA, Consent_ME, Consent_MO, Consent_MS, Consent_MT, Consent_NC, Consent_ND, Consent_NE, Consent_NJ, Consent_NM, Consent_OR, Consent_PA, Consent_RI, Consent_SC, Consent_TN, Consent_UT, Consent_VA, Consent_VT, Consent_WI, Consent_WV ...(+103)
- data fields (56): 183.109, 183.110, 183.16618, 183.16619, 183.16620, 183.16621, 183.17075, 183.17076, 183.20763, 183.20764, 183.210, 183.211, 183.212, 183.213, 183.214, 183.215, 183.218, 183.219, 183.221, 183.222, 183.237532, 183.46031, 183.46032, 183.53223, 183.53224, 183.53225, 183.53226, 183.53227, 183.53228, 183.53229, 183.53230, 183.53231, 183.53232, 92.734, EIWKS.ILPrepDate, FPERS.dNum08, FPERS.dNum09, FPERS.dStr07, FPERS.dStr08, FPERS.dStr09, FPERS.dStr10, FPERS.dStr11, FPERS.dStr12, FPERS.dStr13, FPERS.dStr14, rb_consentPAPIN, rb_UseFedAZ, rb_UseFedMO, rb_useIAPIN, rb_useINPIN, rb_useMDPIN, rb_useMIPIN, rb_useORPIN, rb_usePAPIN, rb_useUTPIN, rb_useWVPIN

### FT_StEstPmtTrans  (7 screens, 7 unique)
- titles: QualifyStatusSt | Update Now | How can I find out the status of estimated tax payments I've already submitted? | E-filing Your SelectedReturnName | Your SelectedReturnName | E-file Your SelectedReturnName
- screens: QualificationFailedStateEstPmt, SubmitStateEstPmtGateway, SubmitStateEstPmtGatewayMoreSelected, SubmitStateEstPmtGatewayNoneSelected, TransmitStateEstPmt, UpdateRequiredStEstPmt, vPaymentsStatus

### FT_StExtCheck  (9 screens, 9 unique)
- titles: How can I find out the status of my extension payment? | Your E-file Status: SelectedReturnName | Check Your E-file Status | SelectedReturnName | Moving on to Your Return | State Extension Not E-filed
- screens: CheckStatusStExtGateway, CheckStatusStExtGatewayJustSnt, CheckStatusStExtGatewayNotSub, NoExtSupportStateReturnsCheck, RejectedStExt, SelectExtensionStateCheck, StateExtAccepted, StateExtFinished, vExtPaymentsStatus
- data fields (1): 183.257934

### FT_StExtTrans  (151 screens, 151 unique)
- titles: Sign Your Mississippi Return | Illinois Consent to Disclosure and Signature | Your New Jersey Consent to Disclosure | How Do You Want to Sign Your West Virginia Return? | Your Vermont Consent to Disclosure | How do I know what my filing status was last year?
- screens: NoExtSupportStateReturnsTrans, QualificationFailedStateExt, SelectExtensionStateTrans, SubmitStateExtensionGateway, SubmitStateExtensionGatewayExtNotSelected, SubmitStateExtensionGatewayFedNotAcc, SubmitStateExtensionGatewayStAccepted, SubmitStateExtensionGatewayStPending, TransmitStateExt, TransmitStateExtAlreadySent, UpdateRequiredStExt, vHowFileExtensionForStateNotListed, BalDueIL, CA_FirstTimeFiler, Consent_AL, Consent_AR, Consent_CO, Consent_CT, Consent_DC, Consent_GA, Consent_HI, Consent_IA, Consent_ID, Consent_IL, Consent_IN, Consent_KS, Consent_KY, Consent_LA, Consent_MA, Consent_ME, Consent_MO, Consent_MS, Consent_MT, Consent_NC, Consent_ND, Consent_NE, Consent_NJ, Consent_NM, Consent_OR, Consent_PA, Consent_RI, Consent_SC, Consent_TN, Consent_UT, Consent_VA, Consent_VT, Consent_WI, Consent_WV, ConsentAZ, ConsentHI ...(+101)
- data fields (56): 183.109, 183.110, 183.16618, 183.16619, 183.16620, 183.16621, 183.17075, 183.17076, 183.20763, 183.20764, 183.210, 183.211, 183.212, 183.213, 183.214, 183.215, 183.218, 183.219, 183.221, 183.222, 183.257934, 183.46031, 183.46032, 183.53223, 183.53224, 183.53225, 183.53226, 183.53227, 183.53228, 183.53229, 183.53230, 183.53231, 183.53232, 92.734, EIWKS.ILPrepDate, FPERS.dNum08, FPERS.dNum09, FPERS.dStr07, FPERS.dStr08, FPERS.dStr09, FPERS.dStr10, FPERS.dStr11, FPERS.dStr12, FPERS.dStr13, FPERS.dStr14, rb_consentPAPIN, rb_UseFedAZ, rb_UseFedMO, rb_useIAPIN, rb_useINPIN, rb_useMDPIN, rb_useMIPIN, rb_useORPIN, rb_usePAPIN, rb_useUTPIN, rb_useWVPIN

### FT_StOp  (190 screens, 190 unique)
- titles: You Already E-filed Your Federal Return | SelectedReturnName | State of Michigan E-file Mandate | Do I need to update the federal program? | Print and Mail Your SelectedReturnName | E-file Your State and Federal Returns
- screens: FileStateWithFedGatewayAmd, FileStateWithFedGatewayDirBalDue, FileStateWithFedGatewayDirRefund, FileStateWithFedGatewayDirUnknown, FileStateWithFedGatewayDirZeroBal, FileStateWithFedGatewayFed, FileStateWithFedGatewayFedOp, FileStateWithFedGatewayJELF, FileStateWithFedGatewayNone, FileStateWithFedGatewayNoneEF, FileStateWithFedGatewayNoneReady, FileStateWithFedGatewayNotEF, FileStateWithFedGatewaySelectState1, FileStateWithFedGatewaySelectState2, FileStateWithFedGatewaySelectState3, FileStateWithFedGatewaySelectState4, FileStateWithFedGatewayStSub, MultiStateTransitionScreen, StateNotInstalled, vDontWantEfileState, vEfileDiffState, vEfileStateLater, vFileStateLater, vHowFileStateOnPaper, vHowToChangeSelectedStates, vHowToPayLater, vMultiStateRet, vNeedMultiStates, vNeedUpdateFed, vOtherStUpdate, vStateNotCompleted, vStateNotListed, vStateNotStarted, vWhatIfNoEfileFeeState, ArkansasRefund, AuditBustersFoundState, AuditBustersFoundStatePaper, DirectDepositDisclosure_OH, EfileMandate_MI, EPaymentOption_MI_efile, EPaymentOption_MI_paper, EPaymentOption_MN_efile, EPaymentOption_ND_efile, EPaymentOption_ND_paper, EPaymentOption_VA_efile, EPaymentOption_VA_paper, GatherACHDataSt, GatherACHDataSt4Acct, GatherACHDataStAcctHolderName, GatherACHDataStBankName ...(+140)
- data fields (39): 183.158, 183.159, 183.160, 183.161, 183.162, 183.163, 183.164, 183.165, 183.188831, 183.191, 183.195550, 183.229433, 183.249362, 183.249363, 183.249364, 183.249367, 183.249368, 183.249369, 183.249370, 183.249373, 183.33, 183.34, 183.35, 183.36, 183.39, 183.40, 183.42762, 183.42763, 183.42764, 183.42765, 183.69705, 183.79111, 183.79765, 183.79766, 183.79767, rb_EFAcctType, rb_EFAcctType1, rb_EFAcctType2, rb_EFPmtMethod

### FT_Trans  (248 screens, 248 unique)
- titles: When will I receive my remaining funds? | What if I don't have a valid IL driver's license or ID? | Why do I have to enter a PIN? | Your Vermont Consent to Disclosure | Your Utah Consent to Disclosure | Where can I find my prior year's adjusted gross income?
- screens: CCOptionsForEFileFeePmt, CollectEMailAddress, CollectResidentialAddressSP, CollectResidentialAddressTP, CollectWhoIsPreparing, ConsentPaperless, ConsentPaperlessACH, DelayedFilingNotice, EfileFeePmtMethodSP, EfileFeePmtMethodStateSP, EnterCCInfoForEFileFeePmt, EnterStateKeyCode, GatherDirectDepositInfo, IdentityVerification, IdentityVerificationLLY, IdentityVerificationMFJ, IdentityVerificationMFJLLY, IdentityVerificationMFJLLYSepLY, IdentityVerificationMFJLLYSP, IdentityVerificationMFJSepLY, IdentityVerificationMFJTPNoLY, LastYearFilingStatus, LastYearFilingStatusMFJ, LastYearFilingStatusMFJLLYSP, NotQualifiedForSimplePay, Signature, SignatureIPPIN, SignatureIPPINMFJ, SignatureMFJ, SignatureSP, SimplePayDisclosure, SimplePayOCCDisclosure, SimplePaySummary, SimplePaySummaryGiftCardBonus, SimplePaySummaryGiftCardBonusAmazon, SimplePayTermsofApp, SP7216ConsentToDisclose, SP7216ConsentToDiscloseMFJ, SP7216ConsentToUse, SP7216ConsentToUseMFJ, SPNotAvailableNoDiscloseConsent, SPNotAvailableNoUseConsent, SubmitGatewayAmd, SubmitGatewayFedOnly, SubmitGatewayFedState, SubmitGatewayNoPricing, SubmitGatewayNotEF, SubmitGatewayNotReadyFedOnly, SubmitGatewayNotReadyFedState, SubmitGatewaySentFedOnly ...(+198)
- data fields (111): 183.109, 183.110, 183.144146, 183.158071, 183.158072, 183.16618, 183.16619, 183.16620, 183.16621, 183.17075, 183.17076, 183.20763, 183.20764, 183.210, 183.211, 183.212, 183.213, 183.214, 183.215, 183.218, 183.219, 183.221, 183.222, 183.31893, 183.33291, 183.46031, 183.46032, 183.53223, 183.53224, 183.53225, 183.53226, 183.53227, 183.53228, 183.53229, 183.53230, 183.53231, 183.53232, 183.75995, 92.1149, 92.1150, 92.1151, 92.1152, 92.1153, 92.1154, 92.1155, 92.1156, 92.1157, 92.1158, 92.147970, 92.191898, 92.191899, 92.391, 92.392, 92.399, 92.400, 92.48755, 92.48756, 92.48757, 92.48758, 92.48759 ...(+51)

### FW10KB  (60 screens, 60 unique)
- titles: Which dependents are disabled? | What if the dashes are in the wrong place in the tax ID? | What if I had a temporary absence from work? | Maximum Number of Providers Reached | Noncustodial and Custodial Parent | Does your care provider meet state and local regulations?
- screens: FW10KB1, FW10KB2, FW10KB3, FW10KB7, CaredFor1, CaredFor10, CaredFor11, CaredFor12, CaredFor2, CaredFor3, CaredFor4, CaredFor5, CaredFor6, CaredFor7, CaredFor8, CaredFor9, CareGiverInfo, CareGiverInfoForeign, CareGiverInfoPerson, ConfirmProviderInfo, ConfirmProviderInfoPerson, DoesProviderQualify, EPCSoNoInfoNeeded, IsDep1Disabled, IsDep2Disabled, IsDep3Disabled, IsDep4Disabled, IsDep5Disabled, IsDep6Disabled, KindOfCareProvider, MaxProvReached, MefProviderType, NannyOrSitter, NannyOrSitterMarriedVer, ProviderDQ, ProviderDQKindergarten, ProviderDQRegs, ProviderDQRelPerson, ProviderQualification, WhichDepsDisabled, WhichDepsDisabled2, WhichDepsDisabled3, WhichDepsDisabled4, WhichDepsDisabled5, vCantGetTaxID, vDepTurnedThirteen, vMaternityLeave, vMaxNumProviders, vMoreThanOneApplies, vNotAllDepsListed ...(+10)
- data fields (69): 124.11, 124.150497, 124.150498, 124.150499, 124.150500, 124.158064, 124.236056, 124.242443, 124.242444, 124.242445, 124.242446, 124.242447, 124.242448, 124.242449, 124.242450, 124.242451, 124.242452, 124.242453, 124.242462, 124.242463, 124.242464, 124.242473, 124.242474, 124.242475, 124.242484, 124.32426, 124.32444, 124.32446, 124.32448, 124.32450, 124.32452, 124.32454, 124.32536, 124.32537, 124.32538, 124.32539, 124.32540, 124.32541, 124.32542, 124.32547, 124.32548, 124.32549, 124.32554, 124.32555, 124.32556, 124.32561, 124.32562, 124.32563, 124.32568, 124.32569, 124.32570, 124.32575, 124.32576, 124.32577, 124.32754, 124.32755, 124.32763, 124.32764, 124.32772, 124.32773 ...(+9)

### GettingStarted  (33 screens, 33 unique)
- titles: Check to see if we can connect to a help server | How do I contact H&R Block? | Here's what we pulled in from your 2024 | How to Use This Program | What if I've never used tax software before? | What if I've already made entries to this return and now want to import last year's return?
- screens: FilingExtension, ImportComplete, ImportDatafile, ImportDropPDF, ImportPDF, ImportSuccessTC, ImportSuccessTT, LastYearsTaxesSummary, ReviewYourData, SaveReturn, StartReturn, TrafficCop, UsingTaxCut, UsingTheProgramVideo, vCanIJustFillInTheIRSForms, vHowToContactHRBlock, vHowToFileExtension, vHowToImportPiorYearReturn, vHowToUseTheProgram, vImportAfterStart, vImportOrUploadPDFReturn, vImportOrUploadPDFW2, vInfoChangedSinceLastYear, vLLYData, vLLYEntries, vLYError, vNewUser, vPdfFileTooBig, vReturnNotOnComputer, vUpdateLLYData, hCheckHelpServerConnection, hFilePermissionError, hWhatIsImported
- data fields (5): 92.33279, 92.33280, FileList, rb_GoHomeOrReviewWelcome, rb_LastYearsTaxes

### GTKYEZ  (1 screens, 1 unique)
- titles: Welcome to H&R Block tax software
- screens: gtkyez

### Home  (10 screens, 10 unique)
- titles: How do I delete a return? | Internet Connection Required | Program Updates and Update Center | New Interview Screen | Prior-Year Returns | How can I get technical support via chat?
- screens: HomeScreenNoTour, HomeScreenSaved, HomeScreenWithTour, hDisplayIssues, hExtension_LearnMore, hHowToDeleteReturn, hHowToGetTechSupportViaChat, hInfoUnavailable, hLookingForPriorYearReturn, hProgramUpdatesAndUpdateCenter
- data fields (1): FileList

### Inc  (20 screens, 20 unique)
- titles: What if I received a Form 1099-K with more than one type of income or income for more than one business? | How do I import from my financial institution? | Interest Income | Household Employee | Your earnings from freelancing and short-term rentals. | Taxable Scholarship Income
- screens: Inc_GetReady, LifeChanges_Inheritance, LifeChanges_JobLoss, SideHustle, UseCommunityPropRules, v1099KMoreThanOneInc, v1099KNeedToKnow, vHowToImportFromFI, vMFSinCommunityPropState, vPPPForgiven, hForgivenPPPLoansTreatment, hHsHldEE, hInterest, hLearnMore_AKPermFund, hLearnMore_ScholarshipInc, hLearnMore_UnreportedTips, hListActivities, hListForms, hTipsAndOvertime, hUnemployment

### IncGateway  (24 screens, 24 unique)
- titles: What do I do if I have tax-free investment income? | What if I received interest from a seller-financed mortgage? | Get help for your specific tax situation. | Interest Income | State and Local Income Tax Refunds | The IRS is still finalizing tax forms.
- screens: DraftForms_PreEFile, DraftForms_PreEFile_For_Mac, IncomeItems, IncomeItems_Simple, UpgradeFromBasicNoOccupation, UpgradeFromBasicSt, UpgradeFromDeluxe, UpgradeFromDeluxeSt, vChapter11, vChildInc, vConsolidatedStmt, vHomeDebtDischarge, vMissingForm, vNoW2Inc, vPYRefund, vSFMInterest, vStateRefund, vTaxFreeInvInc, vUnemployment, hDividends, hInterest, hStateRefund, hUnemployment, hWages(W-2)

### IncSumm  (20 screens, 20 unique)
- titles: Interest | Unemployment Compensation | Wages | Farm | What if I have excessive business losses? | Other Gains and Losses
- screens: IncomeSummary, IncomeSummary_Simple, vDiffWages, vExcessiveBusinessLosses, hExplainThis_4797, hExplainThis_AlimonyReceived, hExplainThis_BusinessIncome, hExplainThis_Dividends, hExplainThis_Farm, hExplainThis_Interest, hExplainThis_IRADistribs, hExplainThis_OtherIncome, hExplainThis_PensionIncome, hExplainThis_SchedE, hExplainThis_SocSecIncome, hExplainThis_StateRefund, hExplainThis_Unemployment, hExplainThis_W2, hKGAmounts, hLearnMoreAmtEnteredTI

### InfoRev  (3 screens, 3 unique)
- titles: Tax Summary | Are you including all of the various deductions included in this summary, such as the senior deduction and QBID?
- screens: TaxSummaryOwe, TaxSummaryRefund, vInclAllDed

### InstPay  (11 screens, 11 unique)
- titles: Can I get an extension of time to pay? | How long do I have to pay? | Installment Payment of Tax | Can I change or end an agreement? | Installment Arrangement | Will I receive an annual statement?
- screens: InstPay1, F9465FSNeeded, F9465Placeholder, vAnnualStatement, vExtension, vFutureRefunds, vIRSReject, vModifyOrTerminateAgt, vPaymentPeriod, vWhenFindOut, hNewPaymentRules

### IntInc  (88 screens, 88 unique)
- titles: Seller-Financed Mortgages | It looks like you have a nonstandard or missing Form 1099. | Other Adjustments | Interest Belongs to Someone Else | How much of this OID is exempt from your resident state's tax? | Do I need to report interest I earned from my retirement plan?
- screens: intinc1, intinc2, intinc3, intinc7, ABP_LiveAudit, ABPAdjustment, AccruedInterestAdj, Adjustments, AmountMissing, AmountMissingOID, ExemptFromStateTax, ExemptFromStateTaxOID, Form1099INTForActualOwner, Form1099INTForActualOwnerMFJ, Form1099OIDForActualOwner, Form1099OIDForActualOwnerMFJ, IntForm, IntForm_LLY, IntFormNoStmt, IntFormNotMarried, IntFormNotMarried_LLY, KindOfInterest, KindOfInterest_EZ, NeedIntAmt, NeedSFMInfo, NomineeAmount, NYInfo, OIDAdjustment, OIDForm, OIDFormNotMarried, OtherAdjustment, OtherStatement, OtherStatementNotMarried, PayerAndAmountMissing, PayerAndAmountMissingOID, PayerMissing, SFMAddlInfo, SFMInfo, SFMInfoNotMarried, USSavingsBondAdjustment, YourInterestIncome, vCantImport, vChildInterest, vCompletingForms, vCompletingFormsOID, vConsolidatedStatement, vConsolStatementInt, vCopiesOfForms, vCopiesOfFormsOID, vDontWantTo ...(+38)
- data fields (74): 166.10, 166.11, 166.12, 166.13, 166.133633, 166.133634, 166.133635, 166.133636, 166.133637, 166.133638, 166.14, 166.144125, 166.144126, 166.144127, 166.144130, 166.144131, 166.144132, 166.144133, 166.144134, 166.144135, 166.144136, 166.15, 166.151530, 166.151531, 166.152486, 166.152487, 166.167058, 166.17, 166.18, 166.184613, 166.184614, 166.184615, 166.184616, 166.184617, 166.184618, 166.184619, 166.184620, 166.184621, 166.184622, 166.184623, 166.184624, 166.184625, 166.184626, 166.184627, 166.184628, 166.184629, 166.184630, 166.184631, 166.184632, 166.184633, 166.184634, 166.188769, 166.188770, 166.19, 166.197490, 166.20, 166.27, 166.27824, 166.36, 166.44427 ...(+14)

### InvGateway  (19 screens, 19 unique)
- titles: Employer Stock | Undistributed Capital Gains From a Mutual Fund or REIT (Form 2439) | What if I received a 1099-K for the sale of collectibles or other non-business (personal use) property? | What about dividends paid in the form of stock? | Now, let's work on your investment income. | Section 1256 Contracts or Straddles
- screens: InvItems, InvItems_Premium, LifeChanges_NewInvest, v1099KSalePerProp, vBusinessRentalProp, vDivInStockForm, vForAcct, vMissingForm, vNo1099B, vProGuidance_InheritedHome, vRetirementFunds, vStockOptions, hEstates, hKGIncomeFrom1099, hLearnMore_EmpStkOptns, hLearnMore_F2439, hSaleDigiAssets1099da, hSaleOfCrypto, hSec1256

### ItemElec  (9 screens, 9 unique)
- titles: What if I find out that my spouse is itemizing deductions? | Itemized Deductions Results | How was my standard deduction calculated? | You get a deduction! | What if I find out that my spouse is taking the standard deduction? | Itemized or Standard Deduction
- screens: BunchDeds_CoBrand, ItemHigher, ItemizedMFS, StandardHigher, StandardMFS, vHowStdDed, vSpouseItemizing, vSpouseStandard, hWhyItemize
- data fields (1): rb_Deduction

### K1Est  (57 screens, 57 unique)
- titles: Enter K-1 Box 9 | Passive Loss Carryforwards | Enter Schedule K-1 Information | Passive Activity | No K-1 | What if the net rental real estate income shown on my Schedule K-1 is from multiple activities?
- screens: k1est1, k1est2, k1est3, k1est7, AcceleratedDepreciation, ActivityDeductions, ActivityIncome, AMTAdjust, Credits, EntityInfo, EntityInfo_MFJ, EstateTaxAmt, FinalYearDedux, LIHC, NonBusinessInfo, OtherBoxes, OtherInfo, PassiveLossCarryforwards, PassiveLossCarryforwards_LLY, SpecialRealEstateType, StateExemptInt, TreasuryDivs, TreasuryInterest, UnsupportedCodes_AMT, UnsupportedCodes_Credit, UnsupportedCodes_FinalYearDedux, UnsupportedCodes_OtherInfo, UnsupportedCodes_OtherInfo199A, vAMTCarryforward, vBackupWithholdingSteps, vEstateButNoK1, vFiling, vForeignTaxes, vFormEntries, vHowIntAndDivReported, vMissingBenInstructions, vMultipleRentalActivities, vPassiveDisposition, vReceivedDeceasedK1, vReceivedEstateK1, vReceivedPshipSCorpK1, vRecharacterizePassiveIncome, vSplittingForeignTaxCredits, vStatement, vUnsupportedForm, hBusiness_Passive, hExcess_Deductions, hLandRental, hLIHCPassThru, hPassiveLossCarryforward ...(+7)
- data fields (82): 89.10, 89.123, 89.124, 89.132, 89.139, 89.148, 89.149, 89.15, 89.151, 89.153, 89.158, 89.16, 89.17, 89.18, 89.24137, 89.24138, 89.24139, 89.24140, 89.24141, 89.24142, 89.24143, 89.24144, 89.24145, 89.24146, 89.24147, 89.24148, 89.24149, 89.24150, 89.24151, 89.24152, 89.24153, 89.24154, 89.24155, 89.24156, 89.24157, 89.24158, 89.24159, 89.24160, 89.24161, 89.24162, 89.24163, 89.24164, 89.24165, 89.24166, 89.24167, 89.24168, 89.24169, 89.24170, 89.24171, 89.24172, 89.24173, 89.24174, 89.24175, 89.24176, 89.24177, 89.24178, 89.24179, 89.24180, 89.24181, 89.24182 ...(+22)

### K1Wks  (221 screens, 221 unique)
- titles: K-1, Box 22 | What about food inventory contributions or qualified conservation contributions? | Box 13: Pensions and IRAs | What if I have more than one K-1? | Section 1256 Contracts and Straddles | What if none of these boxes have data?
- screens: k1wks1, k1wks2, k1wks3, k1wks7, ActiveParticipation, AMTPart, AMTPassivePart, AMTPassiveSCorp, AMTSCorp, AnyCarryforwardsPart, AnyCarryforwardsSCorp, BasisSCorp, CapGainsPart, CapGainsSCorp, CarryforwardLossAmtsPart, CarryforwardLossAmtsSCorp, CashOrSecurities, CreditsPart, CreditsSCorp, DispositionAmtsPart, DispositionAmtsSCorp, DispositionQuesPart, DispositionQuesSCorp, DistribPart, DomProdActDed, EnterOnScheduleDPart, EnterOnScheduleDSCorp, ForeignPartnership, Form8283Part, Form8283SCorp, FormerPassActPart, FormerPassActSCorp, GuarPayments, IdentifyingData, IdentifyingDataPart, IdentifyingInfo_LiveAudit, InterestDivPart, InterestDivSCorp, KindOfAMTActivity, LinesWithDataPart, LinesWithDataSCorp, LoansPart, LoansSCorp, LossOverBasisPart, LossOverBasisSCorp, NondeductExpPart, NondeductExpSCorp, OilAndGasPart, OilAndGasSCorp, OrdInc ...(+171)
- data fields (221): 51.10401, 51.10404, 51.10405, 51.10406, 51.10407, 51.10408, 51.10409, 51.10411, 51.10412, 51.10413, 51.10414, 51.10415, 51.10416, 51.10417, 51.10418, 51.10419, 51.10420, 51.10421, 51.10422, 51.10423, 51.10424, 51.10439, 51.10440, 51.10441, 51.10442, 51.10443, 51.10444, 51.10445, 51.10446, 51.10447, 51.10448, 51.10449, 51.10450, 51.10451, 51.10452, 51.10453, 51.10454, 51.10455, 51.10456, 51.10457, 51.10458, 51.10459, 51.10460, 51.10461, 51.10462, 51.11286, 51.11287, 51.11288, 51.11289, 51.11290, 51.11291, 51.11292, 51.11293, 51.11294, 51.11295, 51.11296, 51.11297, 51.11298, 51.11299, 51.11300 ...(+161)

### KeoghSEP  (49 screens, 49 unique)
- titles: What is a SIMPLE plan? | Plan Contribution Rate | Contributions to Multiple Plans | Deductible Qualified Plan Contributions | What is a defined benefit plan? | Kind of Plan
- screens: keoghsep1, keoghsep2, keoghsep3, keoghsep6, CatchUpAmt, CatchUpQues, ContribAmtMoneyPurch, ContribAmtProfSh, ContribAmtSEP, ContribRateAudit, DeferralsAmt, DeferralsQues, EarnedIncAdj, ExcessContribMP, ExcessContribPS, ExcessContribSEP, KeoghDefBenContrib, KeoghType, KindOfPlan, KnowContrib, KnownContribAmtKeogh, KnownContribAmtSEP, MultiplePlanContrib, NumberOfPlans, PlanContribRate, RothContribs, SARSEPContrib, SARSEPQues, SIMPLEContrib, vCalculateEarnedIncome, vCommunityProp, vContributionDeadline, vContributionForEmployees, vDeferrals, vDefinedBenefitKeogh, vElectiveDeferralInfo, vEmployeeContribs, vHomeOfficeDeduction, vIndividual401kDescrip, vKeoghDescrip, vMoneyPurchaseKeogh, vNeedToAdjust, vNotSelfEmployed, vProfitSharingKeogh, vSEPDescrip, vSIMPLEDescrip, vSpecialCases, vTypeForIndividual401k, hSIMPLEContribs
- data fields (16): 182.130, 182.141, 182.151, 182.19, 182.35, 182.36, 182.45018, 182.52, 182.90, rb_CatchUp, rb_Deferral, rb_HelpCalc, rb_NumPlans, rb_PlanType, rb_QualPlanType, rb_SARSEP

### KG  (173 screens, 173 unique)
- titles: Contingent Payment Debt Instrument | You're paying less tax on your investment income! | Return of Investment | Taxable Trade | Employee Stock Purchase Plan | Expired Purchased Option
- screens: AboutQSBS, AmtRealized, AmtRealized_Premium, BasicInfo, BasicInfo_No1099B_Asst_NonPremium, BasicInfo_No1099B_LookupsOnly, BasicInfo_No1099B_NoAssistant, BasicInfo_SimpleGroup, BasicInfoDeluxeFirstInst, BasicInfoPlatFirstInst, BasisDebt, BasisDivorce, BasisDivorce_Deluxe, BasisDivorce_Premium, BasisEmplStock, BasisGift, BasisGift_Premium, BasisInherited, BasisInherited_Premium, BasisMutualFund, BasisMutualFund_Basic, BasisMutualFundDeluxe, BasisOn1099B, BasisOtherPurchased, BasisOtherPurchased_Basic, BasisOtherPurchasedDeluxe, BasisPurchase, BasisPurchase_Basic, BasisPurchaseDeluxe, BasisTrade, BasisTrade_Basic, BasisTradeDeluxe, BusinessAssets, DateAcqForGroup, DateAcquired, DateSold, Description, DisallowedWashLoss, ExpiredOptionsGranted, ExpiredOptionsPurchased, F1099BBasisAdjustment, F1099BBasisEtc, F1099BTypeOfGain, GainLossAdjustment, HowAcquiredColl, HowAcquiredReg, InstallmentSale, Is1099BasisCorrect, LikeKindExchange, LowerKGRate ...(+123)
- data fields (33): 135.163189, 135.163201, 135.163202, 135.163203, 135.163204, 135.163205, 135.163206, 135.163207, 135.188544, 135.188545, 135.188546, 135.188547, 135.188718, 135.215572, 135.239299, 135.36, 135.37, 135.38, 135.39, 135.40, 135.645, 135.79682, 135.79686, 135.80477, 135.81213, 135.81634, rb_AcqColl, rb_AcqReg, rb_F1099BHP, rb_PropType, rb_SimpleGroup, rb_SpecialType, rb_StockType

### KG_1099B  (179 screens, 179 unique)
- titles: Disqualifying Disposition | Nonstatutory Option | Property Received in a Demutualization | What if my statement reports more than one sale? | What if the disallowed wash sale loss exceeds the total loss? | What if there was a stock split?
- screens: KG_1099B3, KG_1099B7, vGainLossCalculation, vPDFCombine_codeM, vVirtualCurrencyNotOn1099B, vWhatisacoveredsale, AboutQSBS, AmtRealized, AmtRealized_Premium, BasicInfo, BasicInfo_No1099B_Asst_NonPremium, BasicInfo_No1099B_LookupsOnly, BasicInfo_No1099B_NoAssistant, BasicInfo_SimpleGroup, BasicInfoDeluxeFirstInst, BasicInfoPlatFirstInst, BasisDebt, BasisDivorce, BasisDivorce_Deluxe, BasisDivorce_Premium, BasisEmplStock, BasisGift, BasisGift_Premium, BasisInherited, BasisInherited_Premium, BasisMutualFund, BasisMutualFund_Basic, BasisMutualFundDeluxe, BasisOn1099B, BasisOtherPurchased, BasisOtherPurchased_Basic, BasisOtherPurchasedDeluxe, BasisPurchase, BasisPurchase_Basic, BasisPurchaseDeluxe, BasisTrade, BasisTrade_Basic, BasisTradeDeluxe, BusinessAssets, DateAcqForGroup, DateAcquired, DateSold, Description, DisallowedWashLoss, ExpiredOptionsGranted, ExpiredOptionsPurchased, F1099BBasisAdjustment, F1099BBasisEtc, F1099BTypeOfGain, GainLossAdjustment ...(+129)
- data fields (40): 135.163189, 135.163201, 135.163202, 135.163203, 135.163204, 135.163205, 135.163206, 135.163207, 135.188544, 135.188545, 135.188546, 135.188547, 135.188718, 135.215572, 135.239299, 135.36, 135.37, 135.38, 135.39, 135.40, 135.416, 135.645, 135.79682, 135.79686, 135.80477, 135.81213, 135.81634, 195607.214986, 195607.214987, 195607.214988, 195607.214989, 195607.214990, 195607.214991, rb_AcqColl, rb_AcqReg, rb_F1099BHP, rb_PropType, rb_SimpleGroup, rb_SpecialType, rb_StockType

### KG_Crypto  (187 screens, 187 unique)
- titles: Disqualifying Disposition | Nonstatutory Option | Property Received in a Demutualization | What if my statement reports more than one sale? | What if the disallowed wash sale loss exceeds the total loss? | What if there was a stock split?
- screens: KG_Crypto3, KG_Crypto7, TransactionDetails, vCryptoSaleProceeds, vImportCryptoTransaction, vReportCryptoCurrency, vSignUpCointracker, hCryptoBasis, hCryptoDateAcquired, hCryptoDescription, hCryptoSalesPrice, hCryptoService, hNoForm, hWhatInfo, AboutQSBS, AmtRealized, AmtRealized_Premium, BasicInfo, BasicInfo_No1099B_Asst_NonPremium, BasicInfo_No1099B_LookupsOnly, BasicInfo_No1099B_NoAssistant, BasicInfo_SimpleGroup, BasicInfoDeluxeFirstInst, BasicInfoPlatFirstInst, BasisDebt, BasisDivorce, BasisDivorce_Deluxe, BasisDivorce_Premium, BasisEmplStock, BasisGift, BasisGift_Premium, BasisInherited, BasisInherited_Premium, BasisMutualFund, BasisMutualFund_Basic, BasisMutualFundDeluxe, BasisOn1099B, BasisOtherPurchased, BasisOtherPurchased_Basic, BasisOtherPurchasedDeluxe, BasisPurchase, BasisPurchase_Basic, BasisPurchaseDeluxe, BasisTrade, BasisTrade_Basic, BasisTradeDeluxe, BusinessAssets, DateAcqForGroup, DateAcquired, DateSold ...(+137)
- data fields (35): 135.163189, 135.163201, 135.163202, 135.163203, 135.163204, 135.163205, 135.163206, 135.163207, 135.188544, 135.188545, 135.188546, 135.188547, 135.188718, 135.215572, 135.238419, 135.239299, 135.36, 135.37, 135.38, 135.39, 135.40, 135.416, 135.645, 135.79682, 135.79686, 135.80477, 135.81213, 135.81634, rb_AcqColl, rb_AcqReg, rb_F1099BHP, rb_PropType, rb_SimpleGroup, rb_SpecialType, rb_StockType

### KG_LongTerm1099B  (177 screens, 177 unique)
- titles: Contingent Payment Debt Instrument | You're paying less tax on your investment income! | Return of Investment | Tell us about the Long Term sales for [ InstanceSource | Taxable Trade | Employee Stock Purchase Plan
- screens: KG_LongTerm1099B3, KG_LongTerm1099B7, vGainLossCalculation, vWhatisacoveredsale, AboutQSBS, AmtRealized, AmtRealized_Premium, BasicInfo, BasicInfo_No1099B_Asst_NonPremium, BasicInfo_No1099B_LookupsOnly, BasicInfo_No1099B_NoAssistant, BasicInfo_SimpleGroup, BasicInfoDeluxeFirstInst, BasicInfoPlatFirstInst, BasisDebt, BasisDivorce, BasisDivorce_Deluxe, BasisDivorce_Premium, BasisEmplStock, BasisGift, BasisGift_Premium, BasisInherited, BasisInherited_Premium, BasisMutualFund, BasisMutualFund_Basic, BasisMutualFundDeluxe, BasisOn1099B, BasisOtherPurchased, BasisOtherPurchased_Basic, BasisOtherPurchasedDeluxe, BasisPurchase, BasisPurchase_Basic, BasisPurchaseDeluxe, BasisTrade, BasisTrade_Basic, BasisTradeDeluxe, BusinessAssets, DateAcqForGroup, DateAcquired, DateSold, Description, DisallowedWashLoss, ExpiredOptionsGranted, ExpiredOptionsPurchased, F1099BBasisAdjustment, F1099BBasisEtc, F1099BTypeOfGain, GainLossAdjustment, HowAcquiredColl, HowAcquiredReg ...(+127)
- data fields (34): 135.163189, 135.163201, 135.163202, 135.163203, 135.163204, 135.163205, 135.163206, 135.163207, 135.188544, 135.188545, 135.188546, 135.188547, 135.188718, 135.215572, 135.239299, 135.36, 135.37, 135.38, 135.39, 135.40, 135.416, 135.645, 135.79682, 135.79686, 135.80477, 135.81213, 135.81634, rb_AcqColl, rb_AcqReg, rb_F1099BHP, rb_PropType, rb_SimpleGroup, rb_SpecialType, rb_StockType

### KG_Other  (178 screens, 178 unique)
- titles: Contingent Payment Debt Instrument | You're paying less tax on your investment income! | Return of Investment | Market Discount Adjustment | Taxable Trade | Employee Stock Purchase Plan
- screens: KG_Other3, KG_Other7, v1099KSaleOfNonBizPropAlt, hVacationHome, hVirtualCurrency, AboutQSBS, AmtRealized, AmtRealized_Premium, BasicInfo, BasicInfo_No1099B_Asst_NonPremium, BasicInfo_No1099B_LookupsOnly, BasicInfo_No1099B_NoAssistant, BasicInfo_SimpleGroup, BasicInfoDeluxeFirstInst, BasicInfoPlatFirstInst, BasisDebt, BasisDivorce, BasisDivorce_Deluxe, BasisDivorce_Premium, BasisEmplStock, BasisGift, BasisGift_Premium, BasisInherited, BasisInherited_Premium, BasisMutualFund, BasisMutualFund_Basic, BasisMutualFundDeluxe, BasisOn1099B, BasisOtherPurchased, BasisOtherPurchased_Basic, BasisOtherPurchasedDeluxe, BasisPurchase, BasisPurchase_Basic, BasisPurchaseDeluxe, BasisTrade, BasisTrade_Basic, BasisTradeDeluxe, BusinessAssets, DateAcqForGroup, DateAcquired, DateSold, Description, DisallowedWashLoss, ExpiredOptionsGranted, ExpiredOptionsPurchased, F1099BBasisAdjustment, F1099BBasisEtc, F1099BTypeOfGain, GainLossAdjustment, HowAcquiredColl ...(+128)
- data fields (34): 135.163189, 135.163201, 135.163202, 135.163203, 135.163204, 135.163205, 135.163206, 135.163207, 135.188544, 135.188545, 135.188546, 135.188547, 135.188718, 135.215572, 135.239299, 135.36, 135.37, 135.38, 135.39, 135.40, 135.416, 135.645, 135.79682, 135.79686, 135.80477, 135.81213, 135.81634, rb_AcqColl, rb_AcqReg, rb_F1099BHP, rb_PropType, rb_SimpleGroup, rb_SpecialType, rb_StockType

### KG_ShortTerm1099B  (177 screens, 177 unique)
- titles: Contingent Payment Debt Instrument | You're paying less tax on your investment income! | Return of Investment | Market Discount Adjustment | Taxable Trade | Employee Stock Purchase Plan
- screens: KG_ShortTerm1099B3, KG_ShortTerm1099B7, vGainLossCalculation, vWhatisacoveredsale, AboutQSBS, AmtRealized, AmtRealized_Premium, BasicInfo, BasicInfo_No1099B_Asst_NonPremium, BasicInfo_No1099B_LookupsOnly, BasicInfo_No1099B_NoAssistant, BasicInfo_SimpleGroup, BasicInfoDeluxeFirstInst, BasicInfoPlatFirstInst, BasisDebt, BasisDivorce, BasisDivorce_Deluxe, BasisDivorce_Premium, BasisEmplStock, BasisGift, BasisGift_Premium, BasisInherited, BasisInherited_Premium, BasisMutualFund, BasisMutualFund_Basic, BasisMutualFundDeluxe, BasisOn1099B, BasisOtherPurchased, BasisOtherPurchased_Basic, BasisOtherPurchasedDeluxe, BasisPurchase, BasisPurchase_Basic, BasisPurchaseDeluxe, BasisTrade, BasisTrade_Basic, BasisTradeDeluxe, BusinessAssets, DateAcqForGroup, DateAcquired, DateSold, Description, DisallowedWashLoss, ExpiredOptionsGranted, ExpiredOptionsPurchased, F1099BBasisAdjustment, F1099BBasisEtc, F1099BTypeOfGain, GainLossAdjustment, HowAcquiredColl, HowAcquiredReg ...(+127)
- data fields (34): 135.163189, 135.163201, 135.163202, 135.163203, 135.163204, 135.163205, 135.163206, 135.163207, 135.188544, 135.188545, 135.188546, 135.188547, 135.188718, 135.215572, 135.239299, 135.36, 135.37, 135.38, 135.39, 135.40, 135.416, 135.645, 135.79682, 135.79686, 135.80477, 135.81213, 135.81634, rb_AcqColl, rb_AcqReg, rb_F1099BHP, rb_PropType, rb_SimpleGroup, rb_SpecialType, rb_StockType

### KLCO  (7 screens, 7 unique)
- titles: We imported your 2024 | Do you have a capital loss carryover? | How do I know if I have capital loss carryover? | Enter any capital loss carryover you have from 2024 | What if my spouse and I once filed a joint return and are filing separate returns for 2025
- screens: CapLossCarryoverAmounts_LLY_PremiumExpert, CapLossCarryoverAmounts_NoLLY_PremiumExpert, CapLossCarryoverGateway_NoLLY_PremiumExpert, CO, CO_LLY, vKnowingAboutKLCO, vMFSFiler
- data fields (3): 149.18, 149.19, rb_KLCarryover

### LossLimit  (51 screens, 51 unique)
- titles: You need to calculate your gain or loss on the disposition. | What are the passive loss rules? | Passive Loss Carryforwards | Passive Losses | Do I need to do anything differently if I had this rental before 1987? | Let's find out about any loss carryovers you have.
- screens: AcquirePre1987, ActiveParticQues, ActiveParticQuesNewRental, AtRisk, CoveredByAtRisk, DispositionOfRentalProp, FinalQuestions, GainOrLoss, GainOrLossFull, ImplicationsOfRealEstateProf, MaterialPartic_SevenDays, MaterialParticGeneric, NonVacPassiveAtRiskBoxes, NonVacPassiveAtRiskBoxes_DispKnown, PassiveLossCarryBoth, PlaceInServicePre87, ReconOfAmtsOnSchedE, REProQuesGeneric, RoyaltyAtRisk, RoyaltyCoveredByAtRisk, SevenDayRental, SoldTheActivity, SoldTheActivity_DispKnown, SpecialTreatment, vActivePartPriorYrLoss, vAMTCaution, vAnythingDiffPre87, vAtRiskRules, vNontaxableGain, vPassiveLossRules, vRecharacterizePassiveIncome, vRentalExceptions, vREProAndFullTimeJob, vREProCombinedBusinessElection, vUseOfInfo, vWhatEnterSomeNonTax, hActivePartic, hAlternativeMinimumTax, hAlternativeMinimumTax2, hAMTGainLoss, hAtRiskExpl, hAtRiskRules, hHowDetermineGainOrLoss, hMaterialParticipation, hPALLimitations, hPassiveLossCarryforwards, hPassiveLossRules, hPlacedInService, hRealEstateBusiness, hREProSpecialRules ...(+1)
- data fields (15): 15.16, 15.168, 15.188, 15.189, 15.8, rb_AcquirePre87, rb_ActivePart, rb_MatPartic, rb_MatParticSevenDay, rb_RentalAtRisk, rb_REPro, rb_RoyaltyAtRisk, rb_Sale, rb_ServicePre87, rb_SevenDays

### Med  (25 screens, 25 unique)
- titles: What medical expenses are not deductible? | Other Transportation and Lodging for Treatment | What about expenses for a wheelchair and modifying my home? | What medical expenses are deductible? | Whose medical expenses can I claim? | Hospitalization
- screens: med1, med2, AmountExpenses, vCoveredPersons, vDeceasedTaxpayer, vDeductibleMedExpenses, vGlasses, vItemizedList, vNondeductibleMedExpenses, vPaidForOther, vProGuidance_MedicalExpenses, vWeight, vWheelchair, hAGI, hCareProviders, hHospitalization, hInsurance, hMedExp, hMedicalDevices, hMedicalMileage, hOtherExpenses, hPrescriptions, hSEHealthInsurance, hTests, hTransportation
- data fields (9): 2.131058, 2.79539, 2.79541, 2.79542, 2.79543, 2.79544, 2.79545, 2.79546, 2.79547

### MiscAdj  (6 screens, 6 unique)
- titles: Sub-Pay | Miscellaneous Adjustments | Attorney Fees and Court Costs Related to Certain Whistleblower Awards From the IRS | Personal Property Rental Expenses | Jury Duty | Attorney Fees And Costs for Post-October 22, 2004 Actions Related To Certain Unlawful Discrimination Claims
- screens: MiscAdj, hJuryDuty, hPersPtyRentalExp, hSubpay, hUDC, hWhistleBlower

### MiscDed  (13 screens, 13 unique)
- titles: Other Deductions | What if I have gambling losses and haven't entered any gambling winnings? | Enter Gambling Losses | Gambling Losses More Than Winnings | Bond Premium | Giving Back Property
- screens: GamblingLosses, GamblingLosses_LiveAudit, OthMiscDeds, OthMiscDeds_NoGambling, vGamblingRecords, vItemizedList, vLossesWithoutWinnings, hBondPremium, hCessationOfAnnuity, hDebtInstrumentLoss, hGambling, hGivingBackProp, hIRDNotFromK1
- data fields (6): 2.143309, 2.156511, 2.67, 2.69, 2.70, 2.72

### MiscDed2  (11 screens, 11 unique)
- titles: Tax Preparation Expenses | Safe-Deposit Fees | Additional Deductions | Certain Other Expenses (AGI Limitation) | Legal Expenses | Hobby Expenses
- screens: OthMiscDedsTwoPct_FullyDeductible, vItemizedList, vTaxcutCost, hConvenienceFee, hHobbyExpenses, hInvestmentExpenses, hLegalExpenses, hLosses, hOtherDeductionsSubject, hSafeDepFees, hTaxPrepExps
- data fields (9): 2.225, 2.49, 2.50, 2.51, 2.52, 2.54, 2.58, 2.69614, SchedA.DuesExp

### MiscTax  (15 screens, 15 unique)
- titles: Miscellaneous Taxes and Penalties | Additional Tax Under Section 457A | Interest On Tax Due On Certain Installment Income | What is an excess benefits tax? | Excise Tax On Insider Stock Compensation From Expatriated Corporation | Employment Tax Deferral
- screens: MiscOtherTaxAmts, vCreditRecapTaxes, vExBeneTax, hDeferDueDates, hDeferredTaxOnInstallGain, hEducationRecap, hEligPlans, hEmploymentTaxDeferral, hExcessBenefitsTax, hFractionalInterestRecapture, hInsiderCompTax, hNonQualDefComp, hRecapDesigRothAcct, hSec457ATax, hTimeshare

### NameFS  (279 screens, 279 unique)
- titles: Download and Install Your State Program | Buy Your State Tax Program Today! | Did a court appoint a representative for the estate? | Standard Deduction | Why didn't I receive an email? | Dependent for Purpose of Qualifying Surviving spouse
- screens: AboutDependent, AddInfoSpouse, AdditionalInfo, AdditionalInfoMFJ, Address_EZ, Address_EZAudit, CACity_LiveAudit, CarryRegistrationInfo, ChildsAge, ChLvdWGTHalf, ConfirmDOBAndSSN, ConfirmDOBAndSSN_MFJ, ConfirmDOBAndSSN_MFS, ConfirmSSN, ConfirmSSNs, DecedentBoth, DecedentTP, DecedentTPCY, DecedentTPTaxYr, Delete_Decedent_TP, DepChLvdWGTHalf, DependentActuallyClaimed, DepException, EIcfSupport, EligibleButWaived, ExecutorInst, FilingJoint, FilingJointHOHOrJoint, FilingJointWdw, FilingSingle, FilingStatus, ForeignAddressAndPhone, Form8914, Form8914MFS, HOH, HOHMarried, HOHPersonInformation, HOHTreatasUnmarried, HomeUS, HouseholdExp, InmateNumMFJ, InmateNumS, KiddieTax_TLA, LifeChanges_DeathInFamily, LifeChanges_Divorced, LifeChanges_Foreclosure, LifeChanges_Married, LifeChanges_MedicalExp, LifeChanges_Military, LivedWithDep ...(+229)
- data fields (161): 24327.25963, 24327.25964, 24327.25965, 24327.25966, 24327.25967, 24327.25968, 24327.25969, 24327.25970, 24327.25971, 24327.25972, 24327.25973, 24327.25974, 24327.25975, 24327.25976, 24327.25977, 24327.25978, 24327.25979, 24327.25980, 24327.25981, 24327.25982, 24327.25983, 24327.25984, 24327.25985, 24327.25986, 24327.25987, 24327.25988, 24327.25989, 24327.25990, 24327.27192, 24327.27193, 24327.27194, 24327.27195, 24327.34852, 24327.70039, 24327.70040, 24327.70041, 92.1, 92.10, 92.11, 92.1106, 92.12, 92.13, 92.13447, 92.14, 92.149599, 92.15, 92.151513, 92.16, 92.163052, 92.18, 92.185998, 92.186035, 92.186036, 92.199166, 92.199276, 92.2, 92.20, 92.20439, 92.20443, 92.20451 ...(+101)

### NonCashDePro  (87 screens, 87 unique)
- titles: Multiple Items On Same Form 8283 | We need a charity's signature for the noncash donation. | Type | What did the charity give you to verify your donation? | Tell us more about your Form 1098-C. | When can I enter "various" as the acquisition date?
- screens: NonCashDePro3, NonCashDePro7, hConditionofDonation, AcqdFreeEntry, AcqdFreeEntry_Big, AddlInfoOver500, AddlInfoOver5000, AddlInfoOver5000NoAppr, Appraisal, BargainSale, BasicInfo, BasicInfoMAC, CharityMiles, DonationInfo, DonationInfoBasic, EnterOwnValue, EventSummary, F1098AddressDifferent, F1098Info, F1098NameAddress, F1098NameAddressDifferent, F1098NameAddressMFJ, F1098NameDifferent, FinalSteps, FinalStepsArt, FinalStepsNoAppraisal, FmvMethodFreeEntry, NoVehAcknowledgment, PartialAddlInfo, PartialAmtDeducted, PartialOtherCharity, PubliclyTraded, PubliclyTradedSec, Restrictions, SpecialCases, VehAcknowledgmentType, VehGoodsAndServices, VehicleInfo, VehMaterialImprovements, vAppraisalNeeded, vAppraisedItemUnder500, vArtOver20000, vArtworkYouCreated, vBargainSaleDed, vCharitySignature, vConservationAndEasement, vCorrected1098C, vDifferentItemsToSameCharity, vFractionalInterest, vGrouping ...(+37)
- data fields (97): 208.136401, 208.136402, 208.136403, 208.14, 208.140231, 208.143673, 208.15, 208.152488, 208.16, 208.17, 208.18, 208.19, 208.20, 208.21, 208.22, 208.23, 208.24, 208.25, 208.255629, 208.26, 208.27, 208.28, 208.29, 208.30, 208.32, 208.34, 208.34751, 208.34753, 208.48262, 208.49, 208.51, 208.52, 208.53, 208.54, 208.56938, 208.56939, 208.56943, 208.56944, 208.56945, 208.56946, 208.56947, 208.56948, 208.56950, 208.56952, 208.56954, 208.56956, 208.56958, 208.56959, 208.56960, 208.56961, 208.56962, 208.56965, 208.56966, 208.56967, 208.56968, 208.56969, 208.56970, 208.56971, 208.56974, 208.56975 ...(+37)

### NonCashOther  (86 screens, 86 unique)
- titles: Multiple Items On Same Form 8283 | We need a charity's signature for the noncash donation. | Type | What did the charity give you to verify your donation? | Tell us more about your Form 1098-C. | When can I enter "various" as the acquisition date?
- screens: NonCashOther3, NonCashOther7, AcqdFreeEntry, AcqdFreeEntry_Big, AddlInfoOver500, AddlInfoOver5000, AddlInfoOver5000NoAppr, Appraisal, BargainSale, BasicInfo, BasicInfoMAC, CharityMiles, DonationInfo, DonationInfoBasic, EnterOwnValue, EventSummary, F1098AddressDifferent, F1098Info, F1098NameAddress, F1098NameAddressDifferent, F1098NameAddressMFJ, F1098NameDifferent, FinalSteps, FinalStepsArt, FinalStepsNoAppraisal, FmvMethodFreeEntry, NoVehAcknowledgment, PartialAddlInfo, PartialAmtDeducted, PartialOtherCharity, PubliclyTraded, PubliclyTradedSec, Restrictions, SpecialCases, VehAcknowledgmentType, VehGoodsAndServices, VehicleInfo, VehMaterialImprovements, vAppraisalNeeded, vAppraisedItemUnder500, vArtOver20000, vArtworkYouCreated, vBargainSaleDed, vCharitySignature, vConservationAndEasement, vCorrected1098C, vDifferentItemsToSameCharity, vFractionalInterest, vGrouping, vIncompleteInfo5000 ...(+36)
- data fields (97): 208.136401, 208.136402, 208.136403, 208.14, 208.140231, 208.143673, 208.15, 208.152488, 208.16, 208.17, 208.18, 208.19, 208.20, 208.21, 208.22, 208.23, 208.24, 208.25, 208.255629, 208.26, 208.27, 208.28, 208.29, 208.30, 208.32, 208.34, 208.34751, 208.34753, 208.48262, 208.49, 208.51, 208.52, 208.53, 208.54, 208.56938, 208.56939, 208.56943, 208.56944, 208.56945, 208.56946, 208.56947, 208.56948, 208.56950, 208.56952, 208.56954, 208.56956, 208.56958, 208.56959, 208.56960, 208.56961, 208.56962, 208.56965, 208.56966, 208.56967, 208.56968, 208.56969, 208.56970, 208.56971, 208.56974, 208.56975 ...(+37)

### OtherInc  (18 screens, 18 unique)
- titles: Medicaid Waiver Payment | What if I received benefits due to the death of a public safety officer? | What if I received foreign pension income? | Final Income Items | What if I inherited money or property in 2025 | Net Operating Loss (NOL) Carryforward Explanation
- screens: NOLCarryforward, OtherItems, OtherItems_Live_audit, OtherItemsMFJ, v1099KNotYetEntered, vChildSupport, vForeignPension, vGift, vInheritedMoney, vMortgageHelp, vPayForPerformanceSuccessPayments, vPublicSafetyOfficer, vRedHillRelief, vResidentialRental, hMedWaiverPmt, hNOL, hOlympic, hOtherInc
- data fields (28): 1.231901, 1.231904, 1.231905, 1.231906, 1.243679, 1.243718, 1.243721, 1.243723, 1.243727, 1.243728, 1.243735, 1.243736, 1.243743, 1.243745, 1.243746, 1.252507, 181.220465, 181.220466, 57.132802, 57.153, 57.154, 57.155, 57.156, 57.157, 57.158, 57.91, 57.95, 57.96

### OtherIncGateway  (76 screens, 76 unique)
- titles: Does a special rule apply to my Retirement Contribution limit? | Enter your Coverdell ESA distributions. | What if I received a Form 1099-K with more than one type of income or income for more than one business? | Tell us about your other wages. | Alimony Received | The IRS requires a statement explaining the withdrawal.
- screens: ABLEDistribs, ABLEDistribsMFJ, Alaska, EdAcctExceptions, EdAcctExceptionsAmt, ESADistribs, ESADistribsMFJ, Exclusions, JuryDutyPay_CoBrand, JuryFees, OtherIncItems, OtherIncItems_Simple, OtherIncItems2, OtherWageTypeIncome, OtherWageTypeIncomeJoint, QTPDistribs, QTPDistribsMFJ, RefundsAndReimbursements, Section408d4Amounts, Section408d4AmountsMFJ, Section408d4Ques, Section408d4Statement, Section408d4Statement_Spouse, SpouseEdAcctExceptions, SpouseEdAcctExceptionsAmt, SpouseTaxOnEdDistribsNotForEduc, TaxOnEdDistribsNotForEduc, VirtualCurrency, v1099Q, v8919line6, vAirlinePayments, vCashForKeys, vChildSupport, vContributionLimits, vDoesChildNeedToReport, vEarningsCalc, vESADistribPen, vFrequentFlier, vGift, vGiveJuryBack, vHowReported, vInheritedMoney, vItemNotOnList, vMortgageHelp, vNJHomesteadRebate, vNotTurnOverInCurrentYear, vProGuidance_Inheritance, vRefunds, vTuitionPlanRollover, vVirtualCurrency ...(+26)
- data fields (28): 1.231897, 1.231898, 1.243713, 1.243714, 181.10, 181.11, 181.44, 181.45, 57.166933, 57.166934, 57.166935, 57.166936, 57.17174, 57.17175, 57.24547, 57.289, 57.290, 57.329, 57.330, 57.331, 57.332, 57.85, 57.86, 57.88, rb_ExceptionsYesNo, rb_Sec408d4, rb_SpExceptionsYesNo, rb_VirtualCurrency

### PDFAttachWizard  (3 screens, 3 unique)
- titles: Your PDF Requirements | PDF Launcher | Your PDF Attachments
- screens: AttachErrors, AttachSelectFile, LaunchExternalPDFAttach

### Personal  (2 screens, 2 unique)
- titles: Let's start on your basic info. | Military Service
- screens: FederalGetStarted, hMilitary_LearnMore

### PersPlan1  (5 screens, 5 unique)
- titles: H&R Block Advantage | Your H&R Block Advantage | How can I view the report later? | How can I contact an H&R Block office? | How do I print the report?
- screens: PersPlan, ShowReport, vHowContact, vPrintReport, vViewLater

### PPWks  (156 screens, 156 unique)
- titles: Estimated Tax on Non-Wage Income | Balance Due with Return | Balance Due of Target Tax Liability | You have a refund! | Where should I send my payment vouchers? | Job Information for First Job
- screens: ActOnRefund, AddtlStandardDed, AddtlStandardDedMFJ, AddWithholding, AdjDedCrdtTax, AdjExempCTC, AdjustWH, BothSEIncome, BusDed, CapitalGains, ChangeMethod, Credits, EmployerMustWithhold, ExamenWithholding, FilingStatus, HiIncOtherTaxes, IntUnderConstruction, IntUnderConstruction2, Investment, ItemizeDeductions, Job1InfoSingle, Job2InfoSingle, MakeEstimates, MakeOnlinePayments, NeedPayPeriods, NeedPayPeriodsSp, Net1Paycheck, NetPaychecks, NewW4, NoIncome, NonWageIncome, NonWageIncomeMFJ, NonWageOnlyChoice, NonWageOptions, NonWageRefOptions, NoPriorMFJ, NWOnlyTaxDueChoice, NWRefundOnlyChoice, OkOrNo, OnlineNonWageIncTaxDue, OtherIncome, OtherPayments, OtherTaxes, OverPay100, OverPayFarmFish, OverPaySafe, PaymentAmount, PaymentOptions, PaymentOptions2, PaymentOptions3 ...(+106)
- data fields (46): 180.114, 180.115, 180.121, 180.122, 180.123, 180.124, 180.125, 180.126, 180.127, 180.128, 180.129, 180.130, 180.131, 180.132, 180.133, 180.134, 180.163, 180.223, 180.227, 180.256749, 180.256754, 180.256759, 180.256764, 180.256769, 180.256774, 180.256779, 180.256784, 180.287, 180.288, 180.48, 180.50, 180.68, 180.76, 180.78, rb_FilingStatus, rb_MultJobs, rb_NewW4, rb_NonWages, rb_NWChoice, rb_PayDate, rb_PayPeriod, rb_PlanYearWages, rb_RedTaxDue, rb_SpPayPeriod, rb_StdDed, rb_WantItemizeDed

### PropertyTax  (16 screens, 16 unique)
- titles: How much can I claim if a homeowner assistance program helped with the payments? | What about real estate tax that I entered for my rental? | We see you've already entered some real estate taxes. | Are all my real estate taxes deductible? | What if I'm an employee with a home office? | What if I bought my home in 2025
- screens: RealEstateTaxSmartFind, StateAndLocalReTax_1098_NoRentalOrHomeOff, StateAndLocalReTax_1098_RentalOrHomeOffCarried, StateAndLocalReTax_1098_RentalOrHomeOffCarriedNo, StateAndLocalReTaxGroupHORentalAllCarried, StateAndLocalReTaxGroupHORentalNotAllCarried, StateAndLocalReTaxGroupNoMtgInt, vCoop, vHomeownerAssistance, vNondeductibleRETax, vRepaidByBuyer, vRepaidSeller, vRETax, vRETax_EmpHomeOffice, vRETaxFromBusiness, vRETaxFromRental
- data fields (3): 2.15, 2.161, 2.163

### PTCIntro  (16 screens, 16 unique)
- titles: Premium Tax Credit | How should I answer, if I included my dependent's income on my return? | Premium Tax Credit &mdash; Unique Situations | Domestic Abuse or Abandonment | Dependent Required to File | Dependents' Modified Adjusted Gross Income
- screens: CompleteFormManually, DependentMAGI_FirstFive, DependentMAGI_Overflow, DependentsRequiredToFile, MedicaidIneligible, RandomAccessGateway, UniqueSituations_MFJ, UniqueSituations_MFS, UniqueSituations_Other, vDependentIncomeIncluded, vSpecialSituationsOnForm, hDependentRequiredToFile, hDomesticAbuse, hOverlappingPolicy, hPTC, hSharedPolicy
- data fields (93): 160687.160706, 160687.160707, 160687.160708, 160687.160709, 160687.160710, 160687.160711, 160687.160712, 160687.160713, 160687.160714, 160687.160715, 160687.160716, 160687.160717, 160687.160718, 160687.160719, 160687.160720, 160687.160721, 160687.160722, 160687.160723, 160687.160724, 160687.160725, 160687.160726, 160687.160727, 160687.160728, 160687.160729, 160687.160730, 160687.160731, 160687.160732, 160687.160733, 160687.160734, 160687.160735, 160687.160736, 160687.160737, 160687.160738, 160687.160739, 160687.160740, 160687.160741, 160687.160742, 160687.160743, 160687.160744, 160687.160745, 160687.160746, 160687.160747, 160687.160748, 160687.160749, 160687.160750, 160687.160751, 160687.160752, 160687.160753, 160687.160754, 160687.160755, 160687.160756, 160687.160757, 160687.160758, 160687.160759, 160687.160760, 160687.160761, 160687.160762, 160687.160763, 160687.160764, 160687.160765 ...(+33)

### PTCSummary  (8 screens, 8 unique)
- titles: Months Self-Employed | Your Premium Tax Credit | How do I enter my additional premiums for a child under age 27? | Self-Employed Health Insurance | We got married in 2025
- screens: APTCCorrect, Credit, ManualSEHIDAndPTC, Repayment, SEHIDAndPTCAdditionalInfo, vAdditionalNondependentPremiums, vAlternativeMarriageCalc, vNondependentIncome
- data fields (2): 164873.164948, 164873.167341

### QBI  (13 screens, 13 unique)
- titles: You're getting the qualified business income deduction! | What if I have tips in my income? | Business Income Tips Deduction | Qualified REIT Dividends and Qualified PTP Loss Carryovers from 2024 | You're not eligible for the QBI deduction. | Qualified Business Income
- screens: CannotCalculate, LetsWork, NotQualified, QBIResult, vQBILossCarryover, vTipsInMyIncome, hbusTipsDed, hCombining, hQBICarryover, hREITCarryover, hSelfEmpAdj, hUserCalculate, hWhatsQBI
- data fields (4): 217797.218598, 217797.218599, 217797.220563, 217797.220565

### RentExp  (108 screens, 108 unique)
- titles: What if the accounting and tax preparation expenses include personal expenses? | Other Interest | Enter your cleaning and maintenance expenses. | Can I deduct the cost of value of my own labor? | Mortgage Insurance Premiums | Can I deduct local transportation expenses?
- screens: AccelerateExps_PremiumExpert, Advertising, AMTUnaffected, ClaimingBalance, CleanMaint, Commissions, Expense1Royalty, Insurance, Itemize_MortgageAndRETax, ItemizedDeduction, LegalProf, Management, MortgageIntAndPoints, MortgageIntAndPoints_Home, MortgageIntRoyalty, OtherExpAll, OtherExpDwellVac, OtherExpDwellVac_NonOwner, OtherExpNonDwellVac, OtherExpNonVac_Dwell, OtherExpNonVac_Dwell_NonOwner, OtherExpNonVac_NonDwell, OtherExpRoyalty, OtherInterest, OtherRentalOnlyExpenses, OtherTaxes, OtherTravel, OtherWholeHouseExpenses, OtherWholeHouseExpenses_NonOwner, PartialRental, PercentRented, PercentRented_IncludedRoom, PersonalPortion_InterestOrRETax, PropertyTax, RentalAmtOnly, RentalExpensesAllocated, RentalExpensesStandard, RentAssistant, RentAssistantNewRental, RepairsXp, Results, SuppliesExp, UtilityExp, WhichExpense, WhichExpense_MultiFam, WhichExpense_MultiFam2, WhichExpenseNewRental, WhichExpenseNewRental_MultiFam, vAccessExpenditures, vAdditionalOtherExpenses ...(+58)
- data fields (50): 15.10480, 15.10490, 15.162963, 15.162964, 15.186, 15.190, 15.229, 15.232, 15.235, 15.238, 15.241, 15.274, 15.29, 15.32, 15.332, 15.333, 15.337, 15.338, 15.342, 15.343, 15.347, 15.348, 15.379, 15.38, 15.380, 15.381, 15.382, 15.383, 15.384, 15.385, 15.386, 15.387, 15.388, 15.389, 15.390, 15.391, 15.392, 15.396, 15.44, 15.440, 15.59, 15.62, 15.65, 15.68, 15.71, 15.74, FRe.MtgInsurA, rb_AMTUnaffected, rb_PartialRental, rb_PersPortion

### rentinc  (34 screens, 34 unique)
- titles: How would you like to enter your income? | Property or Services in Lieu of Rent | How much rent did you receive that wasn't on Form 1099-MISC? | How can I easily enter my total in an entry field? | Tell us about your advance rent payments. | Payment for Canceling a Lease
- screens: AdvanceRent, AmountOfIncome, AmountOfIncome_IncludedRoom, AmountOfIncomeAudit, FirstAndLastMonth, IncomeAssistant, IncomeAssistantNewRental, IncomeSummary, LeaseTermination, MonthlyRent, OtherPayments, PropertyOrServices, QBISafeHarborInstr, RoyaltyAmountOfIncome, SecurityDeposit, TenantPaidExp, WhichRentalIncome, vCODFromShortSale, vExtraTerritorial, vImprovInLieuOfRent, vImprovInLieuOfRent_Later, vItemizedList, vReduceIncByExp, vReduceRoyaltyIncByExp, vUnsureIncome, vWhatIfLastYearsCheck, hAdvanceRent, hLeaseTermination, hMonthlyRent, hPropertyInLieu, hPropOrServ, hSafeHarborStmt, hSecurityDeposit, hTenantPaid
- data fields (18): 15.10481, 15.10482, 15.10483, 15.10484, 15.10485, 15.10486, 15.10487, 15.10488, 15.10489, 15.217, 15.423, 15.424, 15.425, 15.426, 15.427, 15.428, 15.429, 15.467

### Reports  (7 screens, 7 unique)
- titles: Credits | Refund Reveal | Taxes (and More) You've Already Paid | Income and Deductions
- screens: RefundRevealReport, vLearnMoreCredits, vLearnMoreIncAndDed, vLearnMoreTaxes, hLearnMoreCredits, hLearnMoreIncAndDed, hLearnMoreTaxes

### RetGateway  (14 screens, 14 unique)
- titles: Do I need to report the amount by which my IRA or 401(k) grew in 2025 | Retirement Plan Income, Withdrawal, or Rollover (1099-R, CSA 1099-R, CSF 1099-R, RRB-1099-R) | Disaster Retirement Distributions and Repayments | Congratulations on your retirement! | Where do I enter a myRA distribution? | Social Security Income
- screens: Form8915Amounts, LifeChanges_NewRetirementAcct, LifeChanges_Retired, RetItems, RetItems_LLY, vDidNotReceive, vMissingForm, vmyRADistributions, vPreWithdrEarnings, hAnnuities, hDisasterDistributions, hLearnMore_SSIncome, hRetirementPlans, hRetirementPlansAndAnnuities

### RetireAdvisor  (59 screens, 59 unique)
- titles: What if I'm not sure how much income will be earned? | How can I find out more about SEP IRA's? | What if I have employees? | Net Income | Should I open a Keogh if I already have another retirement plan? | How do I learn more about SEP's?
- screens: SERetAddEmployees, SERetAnyEmployees, SERetChooseSEP, SERetEmployees, SERetInd401k, SERetirementPlanAdv, SERetKeogh, SERetKeoghWEmployees, SERetLevelIncome, SERetPlanOpsNextYr, SERetPlanOpsThisYr, SERetPlanOptions, SERetPreferences, SERetSepAndSimple, SERetSepIra, SERetSepIraAdv, SERetSepIraAdv2, SERetSepIraBest, SERetSIMPLE, SERetWhoseBiz, vAnnualReptgReqs, vAnotherPlanKeogh, vBorrowAgainstPlans, vBorrowFromRetAcct, vContributionReqs, vFamilyEmployees, vHavePlanAlready, vHighEarner, vHighTurnoverBus, vHiredEmployee, vIfEmployees, vIRASetUp, vKeoghSetUp, vLearnReSimple, vMandEECont, vMinContribution, vMinPlanCont, vMoreReInd401k, vMoreReKeogh, vMoreReSep, vMoreReSepIra, vNoEmployees, vNotSureReIncome, vOtherCoverage, vPossibleSavings, vReportingReqs, vRetActEachBus, vRulesIfEmployees, vSetUpSepIra, vSimpleSetUp ...(+9)
- data fields (8): rb_AnyEmployees, rb_FutureEmployees, rb_Incentive, rb_IncomeLevel, rb_Preferences, rb_SelectSepIra, rb_WhatYear, rb_WhoseBiz

### ReviewTab  (54 screens, 54 unique)
- titles: Would you like some help deleting the duplicate W-2? | The NonFarm Optional Method for SE Income | How can I get professional help to prepare my tax return? | Why should I finish my return before I run the Accuracy Review? | Would you like some help combining W-2s? | How can I review my entire return?
- screens: AuditBusterBothEFail, AuditBusterBothEFail2ndRun, AuditBusterBothFail, AuditBusterBothFail2ndRun, AuditBusterBothStEFail, AuditBusterBothStEFail2ndRun, AuditBusterFailNoErrors, AuditBusterFailNoErrors2ndRun, AuditBusterPass, AuditBusterStateFail, AuditBusterStateFail2ndRun, AuditBusterStatePass, AuditBusterStFailNoErrors, AuditBusterStFailNoErrors2ndRun, AuditNoWarnEFail, AuditNoWarnEFail2ndRun, AuditNoWarnFail, AuditNoWarnFail2ndRun, AuditNoWarnStateEFail, AuditNoWarnStateEFail2ndRun, AuditNoWarnStateFail, AuditNoWarnStateFail2ndRun, vAuditHelpA1040_HOH, vAuditHelpA1040X_MFS, vAuditHelpA1099GOV_Upgrade, vAuditHelpA1099INT_Adjustment, vAuditHelpA4136_UseCodes, vAuditHelpA8863_Tuition, vAuditHelpA8889_TopicNeeded, vAuditHelpA8938_F8938, vAuditHelpA982_Form982, vAuditHelpADPNDT_QChild, vAuditHelpAIRA_IRATopic, vAuditHelpAPERS_HRBFAAcctNo, vAuditHelpASCHA_F8283, vAuditHelpASCHB_F8938, vAuditHelpASCHB_TDF90, vAuditHelpASCHC_AtRisk, vAuditHelpASCHC_VehicleWorksheet, vAuditHelpASCHCEZ_VehicleWorksheet, vAuditHelpASCHSE_FarmOpt, vAuditHelpASCHSE_NonFarmOpt, vAuditHelpAW2_CombineW2s, vAuditHelpAW2_DelW2, vAuditHelpAW2_EIC, vFinishReturnBeforeErrorCheck, vHowToFileOnPaper, vReportCancelEntries, vReportChanges, vReportCorrectWarnings ...(+4)

### RothAsst  (55 screens, 55 unique)
- titles: No Required Withdrawals at Age 73 | Is a Roth IRA Right For You? | Years Before Withdrawal | 2026 | Additional Roth IRA Limitations | Change Information
- screens: AmountConverted, CalculatorsFromXpl, ComparisonWithTraditional, ContInfoSummary, ContRateOfReturn, ContResults, ContResultsSecond, ContribAmount, ContributionAssumptions, ContributionIntro, ContributionTaxRates, ContYrsBefWithdr, ConversionAssumptions, ConversionNextStep, ConvRateOfReturn, ConvResults, ConvResultsSecond, ConvYrsBefWithdr, DistribOfConvAmts, FiveYearPeriod, InfoSummary, InvestTaxSavings, MakeSense, MakeSenseII, MinimumReqDist, NonQualifiedDistributions, OptionToChangeResults, Outline, QualifiedDistributions, ResultsTooLarge, RothAnnualContribs2000, RothAnnualContribsPhaseOut, RothAsst, RothConcept, RothContributions, RothContWhoseForm, RothConversionContribs, RothVsDeductible, RothVsNonDeductible, SourceOfTaxFunds, TaxImpact, TaxRates, TradIRAInfo, XplNextStep, vCurrentRates, vDesignatedRothAccount, hContAssumptions, hConvAssumptions, hConversionVsRollover, hMaximumDeductible ...(+5)
- data fields (18): 167.14, 167.15, 167.16, 167.19, 167.20, 167.22, 167.28, 167.33, 168.12, 168.13, 168.15, 168.22, 168.25, 168.26, rb_SourceFunds, rb_TaxSav, rb_TaxSavings, rb_WhoseFormCont

### SalesGateway  (14 screens, 14 unique)
- titles: Sale of Other Real Estate, Collectibles, Non-Business (Personal Use) property, and Other Investment Property | Now, let's work on your property sales and exchanges. | What if I sold my home but didn't get a Form 1099-S? | Sale of Business, Farm, or Rental Property (or a Drop in Business Use to 50% or Less) | What if I sold my car? | Sale of Your Home
- screens: SaleItems, v1099KSaleOfNonBizProp, v1099KSaleOfPerPropAlt, vAutoSale, vBankForeclosure, vCondemned, vCOVIDForeclosure, vNo1099S, vRentalSales, hLearnMore_BusinessSale, hLearnMore_Exchange, hLearnMore_HomeSale, hLearnMore_Installment, hRealEstateCollectiblesEtc

### SalesTax  (17 screens, 17 unique)
- titles: Sales Tax | General Sales Tax | Selecting Which Taxes to Deduct | Standard Sales Tax Deduction | Local Sales Tax Rate | Deduction for State Taxes
- screens: AnySalesTaxes_Income, AnySalesTaxes_NoIncome, LocalRate_Combined, LocalRate_Combined_Earlier, LocalRate_Regular, LocalRate_Regular_Earlier, SalesTax_MajorPurchases, SalesTax_OtherPurchases, SalesTax_OtherStateInfo, SalesTax_StandardDedInfo, SalesTax_StandardOrReceipts, SalesTaxSummary_NoIncome, SalesTaxSummary_SalesHigher, StateTaxSummary_IncomeHigher, hGenSalesTax, hNontaxableSales, hWhichToDeductSales
- data fields (17): 2.15115, 2.17500, 2.21556, 2.21558, 2.21559, 2.21560, 2.21561, 2.27504, 2.27506, 2.27507, 2.27509, 2.53235, 2.53236, 2.53237, 2.53238, rb_IncOrSalesTax, rb_StandardOrReceipt

### SchedC  (103 screens, 103 unique)
- titles: Fair Rental Value | Now, we'll ask about business or self-employment income. | Overtime income included as part of business income (uncommon) | Tell us about the tips included in your business income | Tell us about your housing allowance. | Tips income included in business income
- screens: schedc1, schedc2, schedc3, SchedC4, schedc7, ArtistsRoyaltyIncome, AskAcctgMethod, AskAcctgMethod1st, AskAcctgMethodInv, CheckAnyThatApply1099NoImportMFJ, CheckAnyThatApply1099NoImportMFJsp, CheckAnyThatApply1099NoImportNoMFJ, CheckAnyThatApplyImportInvMFJ, CheckAnyThatApplyImportInvMFJsp, CheckAnyThatApplyImportInvNoMFJ, CheckAnyThatApplyImportNoInvMFJ, CheckAnyThatApplyImportNoInvMFJsp, CheckAnyThatApplyImportNoInvNoMFJ, CheckAnyThatApplyNoImportMFJ, CheckAnyThatApplyNoImportMFJsp, CheckAnyThatApplyNoImportNoMFJ, EINReq, EnterInfoReYourJob, ExplanationOfAcctgMethod, GainOrLossOnSaleOfBusiness, HomeFRVLiveAudit, Inventory, LifeChanges_NewBus, MACodeRestriction, MaterialParticipationYes, NonCashAcctgMethod, ParsAllowInfo, ParsAllowInfoSp, ParsonageInfo, ParsonageInfoSp, ParsOrAllowance, ParsOrAllowanceSp, PrincipalBusinessCodeAndEINReq, PrincipalBusinessCodeReq, PrincipalBusinessNameAndCodeAndEINReq, PrincipalBusinessNameAndCodeReq, PrincipalBusinessNameAndEINReq, PrincipalBusinessOrProfessionReq, QualOvertimeIncome, QualTipIncome, RetiredPrincipalBusinessCode, SellBusiness, SpecialSituationsMinisters, SpecialSituationsMinistersSp, TypeOfIncome ...(+53)
- data fields (46): 7.11, 7.150598, 7.150599, 7.150600, 7.153, 7.162965, 7.163286, 7.163287, 7.163288, 7.163290, 7.163291, 7.163292, 7.163293, 7.163978, 7.172, 7.185, 7.186, 7.19, 7.210602, 7.240, 7.241, 7.242, 7.247, 7.261228, 7.261229, 7.261230, 7.261231, 7.314, 7.327, 7.34636, 7.69, 7.69343, 7.7, 7.8, 7.81225, 7.81227, 7.9, 7.90, InstanceList, rb_AccountingMethod, rb_BusOwner, rb_Inventory, rb_ParsOrHousing, rb_SchCBool11, rb_SchCBool17, rb_YouFiledForm4361

### SchedCExp  (106 screens, 106 unique)
- titles: Tell us your supply expenses. | Preparing Form 1099-MISC | Tell us your insurance expenses. | Tell us your local transportation expenses for 2025 | Enter your property rental expenses. | Here's what you should know about at-risk limitations.
- screens: schedcexp1, AcctgOtherExpenses, Advertising, AllRiskYes, ArtistsCommissions, BusinessExpenseSummary, BusinessExpenseSummaryClergy, ChildSnacks, ChildSnacks2, ClergyMeals, ClergySEExp, CommissionsFees, ComputerSvcsOtherExpenses, ContractLabor, DayCareOtherExpenses, DayCareSupplies, Depletion, DirSellersCommissions, EducationOtherExpenses, EducationSupplies, EmployeeBenefits, FamilyCareProvider, FinalItemsNewBusGain, FinalItemsNewBusLoss, FinalItemsOldBusNoLoss, FinalItemsOldBusWithLoss, GenBusinessExpenseSummary, GenBusinessExpenseSummary1099, Insurance, JanitorSupplies, LeaseOtherBiz, LeasePersonalty, LegalProfessional, LocalTravel, MealCost, MealExpDayCare, MealExpNoDayCare, MortgageInterest, OfficeExpense, OtherExpensesGroup, OtherExpensesGroupMedWaiver, OtherInsterest, OtherMealsEntHighest, OtherMealsEntHighestActual, OthPersonalSvcsOtherExpenses, OvernightTravel, PassiveRulesApply, PensionProfitPlan, ProfOtherExpenses, PYUnallowedLoss ...(+56)
- data fields (92): 7.161, 7.163299, 7.163300, 7.163301, 7.163302, 7.163303, 7.163304, 7.163305, 7.163306, 7.168, 7.18058, 7.18061, 7.18062, 7.18063, 7.18065, 7.187089, 7.187090, 7.187091, 7.187092, 7.187093, 7.187094, 7.187095, 7.187291, 7.187292, 7.208155, 7.208156, 7.209, 7.210, 7.211, 7.212, 7.213, 7.214, 7.243, 7.244, 7.245, 7.267, 7.268, 7.269, 7.270, 7.271, 7.272, 7.273, 7.274, 7.275, 7.276, 7.277, 7.278, 7.284, 7.286, 7.287, 7.288, 7.289, 7.290, 7.293, 7.295, 7.296, 7.298, 7.31, 7.315, 7.34 ...(+32)

### SchedCInc  (55 screens, 55 unique)
- titles: Show Me More Examples | Qualified Business Income (QBI) Allocable to Qualified Payments Received From Cooperatives | Tell us your income for receipts and sales. | Depreciation | Tell us about any other business income received in 2025 | Did you have inventory in 2025
- screens: AnyChangeInMethod, BusIncSummary, BusinessIncome, CGSQuestions, ChangeOfInvMethod, COGSOnly, DayCareOtherIncome, ExplainMathError, InvCOGS, InventoryValuationMethod, InvValuationStmt, MethodForValuingInventory, OtherIncome, OtherIncomeDirSellers, PATRIncome, QualOvertimeIncome, QualTipIncome, ReceiptsSales, RecKeepAdv, ReturnsAndAllowances, StartUpCostScreen, TypeOfExpenses, vClosInvDifOpInv, vDedElsewhere, vGenOverhead, vInvForPersUse, vItemizedList, vMoreAboutInv, vMoreThan5K, vShippingCosts, vValueClosingInv, vW2FromSameJob, vWhatAboutTiming, vWhatIfIPurchasedItems, hAmortizeStartCosts, hCarOrTruck, hChangeAcctgMethod, hClosingInventory, hCost, hDepreciableProp, hDPAD, hGenBusExp, hHomeOffice, hLabor, hLowerCM, hMaterials, hMathError, hOtherCosts, hPATRTaxableAmt, hPurchases ...(+5)
- data fields (31): 7.187099, 7.187100, 7.187101, 7.187102, 7.220960, 7.220961, 7.229635, 7.229636, 7.229637, 7.229638, 7.229639, 7.229968, 7.230014, 7.24, 7.25, 7.261229, 7.261231, 7.72, 7.73, 7.74, 7.75, 7.76, 7.78, rb_Inventory, rb_InventoryMethod, rb_MoreIncome, rb_Schbdch, rb_SchCBool13, SchedC.cbPATR, SchedC.mwQBIPatrAlloc, SchedC.mwQBIPatrDPAD

### SchedF  (25 screens, 25 unique)
- titles: What if my PPP loan was improperly forgiven? | Capitalization | What if I have tip income for my farm reported to me on a 1099? | Farm Income (Schedule F) | Loss Limited | What's the main activity on this farm?
- screens: SchedF1, Schedf2, SchedF3, SchedF7, FarmActivityCodes, FarmInfo, FarmInfoMFJ, vAgriculturalActivityCodes, vBizUseHome, vCapitalization, vDepreciation, vDifferentParts, vFarmIncorporated, vForgivenPPP, vIncomeAveraging, vLeasedOutFarm, vLossLimited, vMateriallyParticipate, vProperForm, vSchedSE, vTipIncome, hEIN, hFileForm1099, hMateriallyParticipate, hOutsideUS
- data fields (6): 16.11, 16.7, 16.72, rb_AccountingMethod, rb_MatPart, rb_WhoOwned

### SchedH  (69 screens, 69 unique)
- titles: Employee-Provided Coronavirus Care | How do I know if these wages are taxable by both? | What if I have Changes to the Information that was Reported on the SS-4? | Qualified Health Plan Expenses | Household Help | Several Employees
- screens: schedh1, schedh2, schedh3, schedh6, DisplayYouDoNotNeedScheduleH, EmployerCredit2021, EmployerCredit2021NoSupport, EmployerIdNumber, IncomeTaxWithheld, LateContributions, OneWorkerPaid1000, P2ExpRate1, P2ExpRate2, P2UnempCont, Paid1000InAQuarterQuestionOne, Paid1000InAQuarterQuestionTwo, PaidOnTime, PaidSickFamilyLeaveWages, SocialSecurityTaxDeferral, StateDisabilityTaxesWithheld, TaxedByBoth, WagesSubjectToAddlMedicare, WagesSubjectToFica, YouWithheldIncomeTax, ZeroRating, vAppliedEIN, vChangesToSS4Info, vCreditforSocSec, vEmpeeLessThanThresh, vEmpleeMoreThanMax, vHiredTeens, vIncludeCreditsInGrossIncome, vIncludeSickFamilyLeave, vLocatedinPR, vMealsLodging, vNoStUnempContribs, vNotHaveEIN, vParentChildCare, vPdReltaive, vReimbTransp, vSeveralEmpees, vSmallToSeveral, vSpSelfEmplySamePerson, vStateDisabilityPyts, vStateExtend, vStFed, vTaxWH, vUnderEighteen, vUseSSN, vWhatIsAnEmployerIdentificationNumber ...(+19)
- data fields (30): 133.10, 133.103, 133.147305, 133.17, 133.19, 133.195721, 133.195722, 133.195723, 133.195724, 133.195725, 133.195726, 133.195727, 133.195730, 133.195731, 133.195732, 133.195733, 133.195734, 133.195735, 133.195736, 133.195737, 133.197494, 133.21, rb_AprilPaid, rb_TaxedUSPR, rb_ThreshQrtlyWages2, rb_ThreshWages, rb_ThreshWagesQrtly, rb_WagesWithheld, rb_ZeroRate, rb_ZeroRating

### SchedJ  (14 screens, 14 unique)
- titles: Schedule J | What if the farm was incorporated? | What if I operated the farm in partnership with a partner or partners? | What is income averaging, and how can I take advantage of it? | Is Schedule J the right form for me? | Do I need to calculate my own tax?
- screens: SchedJ1, SchedJ2, SchedJ3, F1040Tax, ScheduleJInterviewScreen, SelfSpouseSchedJ, vF1040Tax, vFarmIncorporatedSchedJ, vFarmPartnership, vIncomeAveraging, vLeasedOutFarmSchedJ, vProperForm, vSchedJCapGain, vSchedSE
- data fields (2): InstanceList, rb_WhoOwned

### schedlep  (5 screens, 5 unique)
- titles: Language preference | Tell us your language preference.
- screens: schedlep1, schedlep2, schedlep3, schedlep6, SchedLEPInterviewScreen

### SchedSE  (35 screens, 35 unique)
- titles: Advantages of Nonfarm Optional Method | Tip Income | Form 2031 | Notary Public | Chapter 11 Bankruptcy | Farm Optional Method
- screens: schedse1, schedse2, schedse3, schedse6, Bankruptcy, CommunityProperty, ConservationResProgramExclusion, DisplayYouHaveFilledOutScheduleSeMFJSelf, DisplayYouHaveFilledOutScheduleSeMFJSpouse, DisplayYouHaveFilledOutScheduleSeNotMFJ, DualCitizen, ExCAttached, ExemptClergy, F4029, FiledForm2031, GrossFarmIncomeAmount, GrossNonfarmIncomeAmount, NotaryPublic, UnreportedTipIncome, YouElectFarmOptionalMethod, YouElectNonfarmOptionalMethod, YouHadOver400OfOtherSeEarnings, vBonus, vFarmOptMeth, vFarmOptMethBens, vFiledForm2031, vGrossFarmInc, vGrossNonFarmInc, vGter400Earnings, vNonFarmOptMeth, vNonFarmOptMethAdvs, vWhoPays, hDeferDates, hDeferIncomeDetermination, hOptionalMethods
- data fields (14): 18.148, 18.154, 18.155, 18.193, 18.260319, 18.260320, 18.37063, 18.51758, rb_F4029, rb_FiledForm2031, rb_UnreportedTipIncome, rb_YouElectFarmOptionalMethod, rb_YouElectNonfarmOptionalMethod, rb_YouHadOver400OfOtherSeEarnings

### SchEIC  (237 screens, 237 unique)
- titles: Tell us about the other person and this qualifying child. | Are you the qualifying child of another person? | Church Employee | Student | Who's considered a qualifying child for the EIC? | The SSN for this child must be a number.
- screens: AboutOtherClaimant1, AboutOtherClaimant2, AboutOtherClaimant3, AboutQualPerson1, AboutQualPerson2, AboutQualPerson3, AddRelationship, AddRelationship2, AddRelationship3, AgencyName1, AgencyName2, AGI1, AGI2, AgmtToClaimChild1, AgmtToClaimChild2, AgmtToClaimChild3, Amish, AreYouSure, BasicInfoNotMFJ, BasicInfoNotMFJw2, BasicInformation, BirthdayMissing1, BirthdayMissing2, BirthdayMissing3, CareAsOwn1, CareAsOwn2, CheckTheBoxes, CheckTheBoxes2, Child1Address, Child1DOD, Child1OthPerson, Child2Address, Child2DOD, Child2OthPerson, Child3Address, Child3AddressSimple, Child3DOD, Child3OthPerson, ChildOrStudent, ChildOrStudentMFJ, ChildOthPerson1, ChildOthPerson2, ChildOthPerson3, ChurchWorkerApplies, Clergy, ClergyApplies, ClergyOrChurchWorker, CombatElectionBoth, CombatElectionSp, CombatPayElection ...(+187)
- data fields (182): 100.12581, 100.12582, 100.12583, 100.12584, 100.12587, 100.12588, 100.12591, 100.12592, 100.15622, 100.17446, 100.207, 100.208, 100.209, 100.210, 100.213, 100.237018, 100.237019, 100.241953, 100.260122, 100.28, 100.29, 100.30, 100.315, 100.341, 100.345, 100.346, 100.35, 100.36, 100.37, 100.372, 100.373, 100.374, 100.375, 100.380, 100.381, 100.386, 100.387, 100.388, 100.389, 100.390, 100.391, 100.392, 100.393, 100.394, 100.395, 100.396, 100.397, 100.398, 100.399, 100.400, 100.401, 100.402, 100.403, 100.404, 100.405, 100.406, 100.407, 100.408, 100.409, 100.410 ...(+122)

### SchFExps  (18 screens, 18 unique)
- titles: Utilities | Taxes | What if my losses exceed my income? | Employee Benefits | Great job, here are your income and expenses. | Freight and Trucking
- screens: FarmExpenses, OtherFarmExpenses, SummaryScreen, vNOLS, hConservation, hCustomHire, hEEBenefits, hFreight, hHomeOffice, hLabor, hNOLS, hPension, hRentMachine, hRentOther, hRepairs, hTaxes, hTravelAndMeals, hUtilities
- data fields (32): 16.248556, 16.38, 16.39, 16.40, 16.41, 16.43, 16.44, 16.45, 16.46, 16.48, 16.49, 16.50, 16.51, 16.52, 16.53, 16.54, 16.55, 16.56, 16.57, 16.58, 16.59, 16.60, 16.61, 16.62, 16.63, 16.64, 16.65, 16.66, 16.67, 16.68, 16.69, 16.70

### SchFInc  (12 screens, 12 unique)
- titles: Farm Inventory Value Method | Will you defer crop insurance and disaster payments to 2026 | Now, tell us about any other farm income. | Qualified Business Income (QBI) Allocable to Qualified Payments Received From Cooperatives | Next, tell us about your inventory. | Domestic Production Activities Deduction
- screens: AccrualF1099PATR, AccrualFarmIncomeNot1099, DeferPayments, F1099PATR, FarmIncomeNot1099, Inventory, OtherIncome, hDPAD, hFarmInventory, hOtherFarmIncome, hQBI, hTaxableAmt
- data fields (46): 16.19, 16.20, 16.22, 16.229623, 16.229624, 16.229625, 16.229626, 16.229627, 16.229628, 16.229629, 16.229630, 16.229631, 16.229632, 16.229633, 16.229634, 16.229957, 16.229958, 16.229959, 16.229960, 16.25, 16.26, 16.27, 16.28, 16.29, 16.31, 16.33, 16.34, 16.35, 16.75, 16.78, 16.79, 16.79883, 16.80, 16.81, 16.82, 16.83, 16.84, 16.85, 16.87, 16.88, 16.90, rb_CropDef, SchedF.CoopDistribsIII, SchedF.CoopDistribsTxblAmtIII, SchedF.mwQBIDPAD, SchedF.mwQBIPatrQBI

### SchFLosses  (9 screens, 9 unique)
- titles: Tell us the amount of your gain or loss. | AMT Gain or Loss | Tell us your total passive loss carryover amounts. | Tax Shelter | At Risk | What if my losses exceed my income?
- screens: AMTGainLoss, LossLimitations, LossLimitationsNoMaterialPart, PassiveLosscarryovers, SummaryScreen, vNOLS, hAmtGainLoss, hAtRisk, hTaxShelter
- data fields (8): 16.108, 16.119, 16.137, 16.138, rb_AtRisk, rb_Disp, rb_SomeRisk, rb_Subsidy

### Scholar  (11 screens, 11 unique)
- titles: What if my child received a scholarship or grant? | Where do I find the amount to enter? | If my scholarship or grant is tax-free, can I use it to claim an education credit? | What if the funds were used for tuition, fees, or books? | What about student loans? | Scholarship Income
- screens: ScholarshipAmtMFJ, ScholarshipAmtSelf, vChild, vLoan, vOtherBreak, vReportTaxFree, vTuitionFeeBook, vTuitionReduction, vWhereFindAmt, hDegreeCandidate, hTaxableScholarships
- data fields (2): 181.18, 181.19

### SEHealth  (32 screens, 32 unique)
- titles: Persons Not Counted As Nondependents | Extra Premiums | Did you pay health insurance premiums in 2025 | Tell us about your businesses with insurance. | You didn't pay extra premiums for a nondependent child. | Tell us your Medicare wages from the S corporation.
- screens: AllDeductible, AmtHealthInsPrem, ExtraPremiumAmount, ExtraPremiumsQues, LTCareIns, ManualEarnedIncome, ManualSEHID, MedicalExpDed, MedicalExpDed_ExtraPremiums, NetSEInc2555, NetSEIncSCorp, NoDeduction, NumBusinessesWithPlans, PartDeductible, PartDeductible_MultBus, SCorpBusinessQues, SEHealthIns, vChild, vExemptFromSETax, vOtherPlan, vQualify, vWhatDeduct, vWhoQualifies, vWhoseName, hExtraPremiums, hInsurancePolicyEstablished, hLTCPremiums, hNetSEInc, hNondependentChildren, hNondependentExceptions, hPartnershipPremiums, hSubsidizedPlan
- data fields (11): 164873.164936, 164873.164944, 164873.164948, rb_ExtraPremiums, rb_HadLTCare, rb_HadSEHealth, rb_MultiBusExtraPrem, rb_SCorp, SEHIDWks.ManualSEHIDAmount, SEHIDWks.SelfEmployedInc, SEHIDWks.TotalSelfEmployedIns

### SelectTaxes  (7 screens, 7 unique)
- titles: Repayment of First-Time Homebuyer Credit | How do I know if excess contributions have been made? | How do I know if I have excess accumulations in a qualified retirement account? | Tell us about any additional taxes and penalties. | Required Minimum Distribution | Excess Contributions
- screens: Intro, vExcessAccum, vExcessContrib, hExcessContrib, hLearnMore_Recapture, hLearnMore_SchH, hMinAmt

### SharedText  (20 screens, 20 unique)
- titles: How much does it cost to purchase an upgrade to a Premium State program? | Dummy Screen | What if I haven't completed my federal return? | How do I upgrade to a Premium State program? | Take Me To | Will I need to redo my entries after I update?
- screens: DummyScreen, vHowCanICheckForTheLatestUpdates, vHowDoIUpgradeToAPremiumStateProgram, vHowMuchDoesItCostToPurchasePremiumStateUpgrade, vInfoStateRequirements, vNeedUpdate, vNoModem, vTransferInfoFromFederal, vWhatIfIHaventCompletedMyFederalReturn, vWhatIfINeedToFileMoreTheOneStateReturn, vWhereCanIFindCountryCodes, vWillINeedToRedoMyEntriesAfterIUpdate, vWillTheInformationIEnteredSoFarBeSaved, hConnectionProblems, hCountryCode, hHelpScreenNotFound, hTakeMeTo, hTaxLawAssistants, hTopicUpdateNeeded, hUnableToConnect

### SSWks  (17 screens, 17 unique)
- titles: Tell us your Medicare Part B and D premiums. | Enter the total federal tax withheld. | How do I have tax withheld? | Tell us the benefits you received for 2025 | Enter the federal tax withheld. | Will Entering My Medicare Part B and D Premiums Here Lower My Taxes?
- screens: sswks1, sswks2, AmountReceived, AmountReceivedMFJ, AmountWithheld, AmountWithheldMFJ, LumpSumElection, MedPartBnDPrem, MedPartBnDPremMFJ, TaxableBenefits, TaxableBenefitsNone, vDoMedExpLowerTax, vNegativeAmt, vRecognizingLumpSum, vWithholding, hEnhancedSeniorDeduction, hLumpSumDetails
- data fields (11): 71.151385, 71.186002, 71.186003, 71.186004, 71.186005, 71.65, 71.66, 71.67, 71.68, 71.69, 71.70

### State  (41 screens, 41 unique)
- titles: What if I enter the wrong install key? | Why do I need to enter my name? | Where is the Tools menu? | Update Before Preparing State Return | What if I'm not completing a state return this year? | Thank You for Submitting Your Email
- screens: AnotherStateReturn, GetStateProgram, GetStateProgramNoGTKY, OpenStateProgram, vCompleteAnotherState, vEFileMultStates, vHowCanIGetNotificationWhenStateIsReady, vNeedToFileaStateReturn, vTwoStateReturns, vWhatIfImNotCompletingAStateReturnThisYear, vWhatIfImNotCompletingAStateReturnThisYear2, vWhatShouldIDoIfIHaveToCompleteMoreTheOneStateTaxReturn, CCOptionsToBuyState, CCOptionsToBuyStateStateList, ConfirmState, EmailNotificationSuccessful, EmailNotificationSuccessfulPreFinal, EnterCCInfoToBuyState, EnterCCInfoToBuyStateStateList, FeatureNotAvailable, GetYourStateNoPurchase, GetYourStatePurchaseNoPing, GetYourStatePurchasePing, NoPurchaseNeededLimitations, PurchaseLimitations, PurchaseState, StateIsNotAvailableYet, StateIsNotAvailableYetPreFinal, vAdvBuyWithinProgram, vEnterWrongKey, vHowDoIChangeMyEmailAddress, vInternetReq, vNetworkError, vSSLErrorBadServerCertificate, vStateEditions, vTCStateNonRes, vWhereIsToolsMenu, vWhyEnterName, vWhyNoEmail, hPYNonResidentSupport, htcHelpFilehlpeulahtmTaxCutEULA
- data fields (17): 92.20439, 92.20443, 92.20451, 92.48755, 92.48756, 92.48757, 92.48758, 92.48759, 92.48760, 92.48761, 92.48762, 92.48763, 92.48764, 92.843, InstanceList, rb_CCOption, rb_EFCC

### StateLauncher  (51 screens, 51 unique)
- titles: What if I enter the wrong install key? | Why do I need to enter my name? | Where is the Tools menu? | What if I purchased a state program but don't see it in the list? | States Not Available Yet | What if I'm not completing a state return this year?
- screens: StateLauncher2, StateLauncher3, StateLauncher4, StateLauncher9, vBuyMoreThanOne, vCompleteAnotherState, vEFileMultStates, vNeedToFileaStateReturn, vNonResidentPartResidentFiling, vPurchasedCantAccess, vPurchasedNotInList, vPurchaseProcess, vStateProgramTransfers, vTaxCutAvailableForAllStates, vTwoStateReturns, vWhatIfImNotCompletingAStateReturnThisYear, vWhatIfImNotCompletingAStateReturnThisYear2, vWhatIfIWantToEfile, vWhatShouldIDoIfIHaveToCompleteMoreTheOneStateTaxReturn, vWhatStateFormsAreAvailable, hPYNonResFormsNotSupported, hReinstallStatesLearnMore, CCOptionsToBuyState, CCOptionsToBuyStateStateList, ConfirmState, EmailNotificationSuccessful, EmailNotificationSuccessfulPreFinal, EnterCCInfoToBuyState, EnterCCInfoToBuyStateStateList, FeatureNotAvailable, GetYourStateNoPurchase, GetYourStatePurchaseNoPing, GetYourStatePurchasePing, NoPurchaseNeededLimitations, PurchaseLimitations, PurchaseState, StateIsNotAvailableYet, StateIsNotAvailableYetPreFinal, vAdvBuyWithinProgram, vEnterWrongKey, vHowDoIChangeMyEmailAddress, vInternetReq, vNetworkError, vSSLErrorBadServerCertificate, vStateEditions, vTCStateNonRes, vWhereIsToolsMenu, vWhyEnterName, vWhyNoEmail, hPYNonResidentSupport ...(+1)
- data fields (16): 92.20439, 92.20443, 92.20451, 92.48755, 92.48756, 92.48757, 92.48758, 92.48759, 92.48760, 92.48761, 92.48762, 92.48763, 92.48764, 92.843, rb_CCOption, rb_EFCC

### StockOp  (79 screens, 79 unique)
- titles: Here's what you need to know about RSA vesting. | Sale of Option Stock | Here's where to enter your RSA share sale. | No Gain or Loss | Tax Treatment of Sale | Enter the grant date.
- screens: stockop1, stockop2, stockop3, ActivelyTraded, AMTAdjustAmount, AMTAdjustIntro, AMTPurchaseAmounts, AscertainableFMV, ESPPConsequencesNoDiscount, ESPPDiscountGain, ESPPDiscountLoss, ESPPDiscountQues, ESPPEarlyDisposition, ESPPExerciseAndSale, ESPPExerciseNoSale, ESPPGainOrLoss, ESPPGrant, ESPPHoldingPeriod, Event, FMVOnExercise, FMVOnVesting, GrantDate, InvestmentOptionExercise, InvestmentOptionExerciseAndSale, InvestmentOptionSale, ISOEarlyDisposition, ISOExerciseAndSale, ISOGrant, ISOHoldingPeriod, ISOReportingSale, ISOSaleTreatment, NQSOExerciseNonrestricted, NQSOExerciseRestricted, NQSOSale, OptionNotTaxable, OptionPrivilege, OptionTaxable, OptionTaxableOnVesting, RestrictedOption, RestrictedStock, RestrictedStockNQSO, RSAgranttaxfree, RSAsharesale, RSAtransactions, RSAvesting, RSUgrant, RSUsharesale, RSUTransactions, RSUvests, SameBlock ...(+29)
- data fields (24): 200.10, 200.11, 200.12, 200.19, 200.20, 200.214722, 200.214723, 200.214724, 200.214725, 200.214726, 200.214727, 200.23, 200.41, rb_ActivelyTraded, rb_Ascertainable, rb_Discount, rb_ESPPGain, rb_ESPPHoldingPeriod, rb_ForfeitOption, rb_ForfeitStock, rb_ISOHoldingPeriod, rb_OptionPrivilege, rb_Transferable, rb_Type

### Taxes  (38 screens, 38 unique)
- titles: State Estimated Income Taxes | Do I need to enter Oregon Statewide Transit Tax in this topic? | Enter 2024 | State Income Taxes Paid in 2025 | What if I had state taxes withheld from my paycheck? | Enter 2025
- screens: taxes1, taxes2, LLYOtherStateTaxes, LLYStatePriorYearOverpayments, LocalEstimtatedTaxPayments1, LocalEstimtatedTaxPayments1ForNY, LocalPriorYearOverpayments, OccupationalTaxes, OtherLocalTaxes, OtherStateTaxes, SLGateway, SLGateway_SkipItem, StateEstimtatedTaxPayments1, StateEstimtatedTaxPayments1ForNY, StatePriorYearOverpayments, vEstTaxPmtForPY, vFLI, vLocalTaxCommon, vOtherPmts, vPaidEstInJanuary, vPerCapita, vProGuidance_NewVehicleTax, vSALTContrib, vStateNY_PFL, vStateOR_STT, vStateTaxWithheld, vTaxes_BusTaxes, vTaxes_RentalProp, hEditAmounts, hEstimated, hForeign, hLearnLocal, hLearnOccup, hOther, hPaymentsWithStateReturn, hRefundApplied, hState2, hWithheldtax
- data fields (115): 190.10, 190.100, 190.101, 190.102, 190.103, 190.104, 190.105, 190.106, 190.107, 190.108, 190.109, 190.11, 190.111, 190.112, 190.113, 190.114, 190.115, 190.116, 190.117, 190.118, 190.119, 190.12, 190.120, 190.121, 190.122, 190.13, 190.14, 190.15, 190.16, 190.17, 190.18, 190.19, 190.20, 190.21, 190.22, 190.23, 190.24, 190.25, 190.26, 190.27, 190.28, 190.29, 190.30, 190.31, 190.32, 190.33, 190.34, 190.35, 190.36, 190.37, 190.38, 190.39, 190.41, 190.42, 190.43, 190.44, 190.45, 190.46, 190.47, 190.48 ...(+55)

### TaxPenal  (1 screens, 1 unique)
- titles: Now, we'll ask about health insurance coverage.
- screens: TaxPenal_GetReady

### TaxPlan  (7 screens, 7 unique)
- titles: When do I need to submit a new W-4 to my employer? | Where do I complete my estimated taxes? | When is my estimated tax payment for the first quarter of 2026 | How can I use my online IRS account? | What if I need to adjust the withholding on my W-4? | Planning&mdash;Brought to You by H&R Block
- screens: PlanningIntro, vIRSaccount, vNeedW4, vNewW4, vWhenEstDue, vWhenW4, vWhereEstTax
- data fields (3): 92.1018, 92.1019, FPers.dTaxReform

### TaxPlan2  (4 screens, 4 unique)
- titles: Tax Planning | When is my estimated tax payment for the first quarter of 2026 | How do I know if I need to pay estimated taxes? | What if I need to adjust the withholding on my W-4?
- screens: TaxPlanning, vNeedEstimates, vNeedW4, vWhenEstDue
- data fields (2): 92.1170, 92.654

### TaxPlRet  (1 screens, 1 unique)
- titles: Retirement Planning
- screens: RetPlanningNoOptimizer

### TaxPmts  (14 screens, 14 unique)
- titles: What if my spouse and I filed a joint extension, but are filing separate returns? | Payment with Extension | Your 2025 | Federal Tax Payments | What if my spouse and I filed separate extensions, but are filing a joint return? | Taxes Withheld on Form 1099-PATR
- screens: EstimatedTax, LastYrRefund, OtherTaxesWithheld, PaymentWithExtension, TaxPayments, vAmendedReturn, vAppliedRefund, vDisasterRelief, vIRSaccount, vNowJoint, vNowSeparate, vPaymentsWFormerSpouse, vPmtW4868, vWithheld
- data fields (20): 149.16, 37.60, 92.261264, 92.33201, 92.33202, 92.33203, 92.33204, 92.33205, 92.33206, 92.33207, 92.33208, 92.33209, 92.33210, 92.33211, 92.33212, 92.33213, 92.33214, 92.33215, 92.33216, 92.33217

### TaxSumm  (22 screens, 22 unique)
- titles: Here's how to avoid an underpayment penalty for 2026 | If you're self-employed, you can make estimated tax payments. | Tax on Unreported Tips | Is it too late to pay estimated taxes for 2025 | Alternative Minimum Tax | When is my first 2026
- screens: EstimatedTax, EstTaxAdvisory, TaxesSummary, TaxesSummary_Simple, vTooLateToPay, vWhenEstDue, hExcessAdvanceCTC, hExplain_This_Additional_Tax_Payments, hExplain_This_Retirement_Tax, hExplainThis_AddlMedTax, hExplainThis_AMT, hExplainThis_HomebuyerCreditRepayment, hExplainThis_KiddieTax, hExplainThis_MiscTaxes, hExplainThis_Nanny, hExplainThis_SETax, hExplainThis_Underpayment, hExplainThis_UnreportedTips, hNetInvIncTax, hPremiumTaxCredit, hPremiumTaxCreditRepayment, hRePymtNewAndPrevOwnedVehCrdt
- data fields (2): F1040.FTHBRepayment, F1040.HealthCare

### TestRegularExpressions  (1 screens, 1 unique)
- titles: Regular Expression Test Screen
- screens: RegularExpressionTestScreen
- data fields (84): 92.203988, 92.203989, 92.203990, 92.203991, 92.203992, 92.203993, 92.203994, 92.203995, 92.203996, 92.203997, 92.203998, 92.203999, 92.204000, 92.204001, 92.204002, 92.204003, 92.204004, 92.204005, 92.204006, 92.204007, 92.204008, 92.204009, 92.204010, 92.204011, 92.204012, 92.204013, 92.204014, 92.204015, 92.204016, 92.204017, 92.204018, 92.204019, 92.204020, 92.204021, 92.204022, 92.204023, 92.204024, 92.204025, 92.204026, 92.204027, 92.204028, 92.204029, 92.204032, 92.204033, 92.204034, 92.204035, 92.204036, 92.204037, 92.204038, 92.204039, 92.204040, 92.204041, 92.204042, 92.204043, 92.204044, 92.204045, 92.204046, 92.204047, 92.204048, 92.204049 ...(+24)

### TPDesig  (11 screens, 11 unique)
- titles: Appoint a Designee | Can I revoke any appointment I make here? | Must the person I appoint be a tax preparer or other tax professional? | Information About Designee | Are there are any rules about what kind of PIN my contact person can choose? | What is the person I appoint allowed to do?
- screens: AppointDesignee, AppointDesigneeMFJ, DesigneeInfo, DesigneeInfo_GatewayBox, DesigneeInfo_GatewayBox_MFJ, DesigneeInfo_LiveAudit, vNotAllowed, vPIN, vRevoke, vScopeOfAuthority, vTaxProfessional
- data fields (3): 92.1000, 92.998, 92.999

### TransferData  (1 screens, 1 unique)
- titles: Transferring Federal Data...
- screens: DataTransfer

### TrumpActs  (46 screens, 46 unique)
- titles: Can I mail in my Form 4547? | What is ITIN? | Important information about you and | Can I use my P.O. box as my address? | Here are your eligible dependents | Provide more information about Alonzo
- screens: TrumpActs1, TrumpActs3, ChooseRecipient, Consentdisclosure, dQTrumAct, MoreDepInfo, qualificationScreen, RecipientDQ, RecipientNameDetails, RecipientOtherDetails, RecipientOtherDetailsMFJ, RecipientValidation, RecipientValidationMFJ, RecipientValidationMFJPilot, RecipientValidationPilot, TrAcDetails, TrAcDetailsNo1K, vAdoptedorFosterChild, vAmIRequiredtoApply, vChildSSN, vClaimCousin, vContributions, vCountyGuide, vDeleteQuestion, vForeignAddress, vHowImpactReturn, vIfmoreRelation, vMustHaveSSN, vNoMiddleName, vNoSSN, vPObox, vPOBoxGuide, vPPElectionEligibility, vPPPaymentTime, vSSNonly, vWhatAreTrumpAccounts, vWhatIsCounty, vWhatisITIN, vWhere2Mail, hAuthorized, hAuthorizedInd, hNonDependents, hvalidSSN, hWhatIsTrumpAccount, hWhatIsTrumpAct, hWhatNext
- data fields (31): 173.260690, 260539.260562, 260539.260563, 260539.260564, 260539.260565, 260539.260566, 260539.260567, 260539.260568, 260539.260575, 260539.260578, 260539.260584, 260539.260688, 260539.261031, 260539.261032, 260539.261033, 260539.261036, 260539.261037, 260539.261038, 260539.261039, 260539.261040, 260539.261041, f4547wks.Child1Relation, FDpndt.CitizenOrResY, FDpndt.DepDescription, FDpndt.DepTimeLivedWith, FDpndt.InUSAY, FDpndt.MonthsLivedWith, FDpndt.XValidSSN, rb_Address, rb_BusOwner, rb_Sponsor

### Tuition  (172 screens, 172 unique)
- titles: Tell us about the person who was a student in 2025 | Relationship of Other Household Member | Tell us about the school on your 1098-T. | What if the other person decides not to claim me as a dependent? | What if the student doesn't qualify for any of these? | Was the school required to provide a 1098-T?
- screens: Tuition1, Tuition2, Tuition3, Tuition7, AdditionalFundingMFJOrDeps, AdditionalFundingNoMFJOrDeps, AdditionalPersons, Box3EtcSchool1MFJOrDeps, Box3EtcSchool1NoMFJOrDeps, Box3EtcSchool2MFJOrDeps, Box3EtcSchool2NoMFJOrDeps, Box3EtcSchool3, Boxes1And2School1, Boxes1And2School2, Boxes1And2School3, ChooseHighestAOC, ChooseHighestAOCLessThanMax, ChooseHighestAOCSelf, ChooseHighestLLC, ChooseHighestLLCSelf, ChooseHighestTD, ChooseHighestTDSelf, ChooseNoEstTaxSavings, ChooseNoEstTaxSavingsSelf, ChooseTaxBreakAll, ChooseTaxBreakAllSelf, CourseMaterialsMFJOrDeps, CourseMaterialsNoMFJOrDeps, DegreeProgMFJOrDeps, DegreeProgNoMFJNoDeps, DepFunds, Done, ExpensesSummary, ExpensesSummary2, ExpensesSummary3, FelonyDrugMFJOrDeps, FelonyDrugNoMFJNoDeps, First4YrsMFJOrDeps, First4YrsNoMFJNoDeps, FundingMFJOrDeps, FundingNoMFJOrDeps, GrantInfoDep, GrantInfoTPSP, HouseholdDetails, JobSkills, LivingSituation, LivingSituationMFJ, NoBreakDep, NoBreakIncTooHigh, NoBreakMFS ...(+122)
- data fields (112): 163.140232, 163.140233, 163.140234, 163.140235, 163.140236, 163.140241, 163.140243, 163.140244, 163.140245, 163.140246, 163.140247, 163.140252, 163.143680, 163.143681, 163.143682, 163.143683, 163.143684, 163.143685, 163.143686, 163.143687, 163.166366, 163.166369, 163.166370, 163.166371, 163.166373, 163.166374, 163.166375, 163.166377, 163.166380, 163.166381, 163.166382, 163.166384, 163.166385, 163.166386, 163.166387, 163.166388, 163.166389, 163.166390, 163.167153, 163.167154, 163.169587, 163.169588, 163.187024, 163.187025, 163.187026, 163.187027, 163.187028, 163.187029, 163.187030, 163.187032, 163.187033, 163.187040, 163.187041, 163.187044, 163.187045, 163.187046, 163.187048, 163.187049, 163.187050, 163.187051 ...(+52)

### Updates  (8 screens, 8 unique)
- titles: What forms and schedules are not final? | How do I know if the changes apply to me? | Update Now | Why do I need an update? | What about my state program? | Update Successful
- screens: UpdateNow, UpdateSuccessful, vChangesApply, vFileReturn, vNonFinalForms, vShouldStart, vWhatAboutMyStateProgram, vWhyNeedUpdate
- data fields (1): rb_Update

### USSecondaryNavs  (58 screens, 58 unique)
- titles: Where Do You Want To Go? | Trump Account Opening Criteria | What is Trump Account?
- screens: TemplateScreen, USSecondaryNavs_Basic_Adjust, USSecondaryNavs_Basic_Credits, USSecondaryNavs_Basic_Dedux, USSecondaryNavs_Basic_End, USSecondaryNavs_Basic_FT_Efile, USSecondaryNavs_Basic_FT_Finish, USSecondaryNavs_Basic_FT_Paper, USSecondaryNavs_Basic_Inc, USSecondaryNavs_Basic_Personal, USSecondaryNavs_Basic_TaxPenal, USSecondaryNavs_Basic_TaxPlan2, USSecondaryNavs_Basic_TaxPlRet, USSecondaryNavs_Basic_WrapUp, USSecondaryNavs_Deluxe_Adjust, USSecondaryNavs_Deluxe_Credits, USSecondaryNavs_Deluxe_Dedux, USSecondaryNavs_Deluxe_End, USSecondaryNavs_Deluxe_FT_Efile, USSecondaryNavs_Deluxe_FT_Finish, USSecondaryNavs_Deluxe_FT_Paper, USSecondaryNavs_Deluxe_Inc, USSecondaryNavs_Deluxe_Personal, USSecondaryNavs_Deluxe_TaxPenal, USSecondaryNavs_Deluxe_TaxPlan2, USSecondaryNavs_Deluxe_TaxPlRet, USSecondaryNavs_Deluxe_WrapUp, USSecondaryNavs_EZ_Credits, USSecondaryNavs_EZ_FT_Efile, USSecondaryNavs_EZ_FT_Finish, USSecondaryNavs_EZ_FT_Paper, USSecondaryNavs_EZ_Inc, USSecondaryNavs_EZ_Personal, USSecondaryNavs_EZ_WrapUp, USSecondaryNavs_Premium_Adjust, USSecondaryNavs_Premium_Credits, USSecondaryNavs_Premium_Dedux, USSecondaryNavs_Premium_End, USSecondaryNavs_Premium_FT_Efile, USSecondaryNavs_Premium_FT_Finish, USSecondaryNavs_Premium_FT_Paper, USSecondaryNavs_Premium_Inc, USSecondaryNavs_Premium_Personal, USSecondaryNavs_Premium_TaxPenal, USSecondaryNavs_Premium_TaxPlan2, USSecondaryNavs_Premium_TaxPlRet, USSecondaryNavs_Premium_WrapUp, USSecondaryNavs_Trialware_Adjust, USSecondaryNavs_Trialware_Credits, USSecondaryNavs_Trialware_Dedux ...(+8)

### VehicleTax  (16 screens, 16 unique)
- titles: What about a vehicle I used as an employee? | Personal Property Tax | Vehicle or other personal property tax | Can I deduct a flat tax or tax based on the vehicle's weight? | How can I tell if my vehicle tax is deductible? | What if I paid tax on more than one vehicle?
- screens: IowaResident, PersonalPropertyTaxPaid, PersonalPropertyTaxPaid_LLY, PersPropTax_ItemFromVeh, PersPropTax_NoItemFromVeh, vCarSalesTax, vDMV, vForeignPersonalPropTax, vItemizedList, vMoreThanOne, vPersPropTax_Employee, vPersPropTax_Investment, vVehicWeight, hExciseTax, hPersPropTax, hVehicleOrOther
- data fields (4): 2.27750, 2.27751, 2.294, 92.138836

### W2G  (14 screens, 14 unique)
- titles: Whose W-2G is this? | Can I claim my gambling losses as a deduction? | Tell us about the payer on your W-2G. | Where on my tax return is information from this W-2G reported? | Enter your 2025 | We imported your W-2Gs from last year's return.
- screens: w2g1, w2g2, w2g3, w2g7, PayerInformation, WhoseW2G, WinningsInfo, WinningsInfoB, vForeignAddress, vLosses, vReportedWhere, vSharedWinnings, vWhyWithhold, hForeignAddress
- data fields (28): 54.12, 54.13, 54.14, 54.144137, 54.144138, 54.144139, 54.144140, 54.15, 54.16, 54.17, 54.18, 54.19, 54.21, 54.22, 54.23, 54.24, 54.25, 54.28, 54.3, 54.33, 54.34, 54.35, 54.37, 54.4, 54.42, 54.5, 54.6, rb_TpOrSp

### W2KB  (139 screens, 139 unique)
- titles: Fair Rental Value | Tell us about your Box 11 amount. | Special rules apply to international agency employees. | If I pay for part of the care and my employer pays for the rest, what should I do? | Enter your withholding reported by IssuerW2NoParen | New Jersey Family Leave Insurance (FLI)
- screens: W2KB1, W2KB2, W2KB3, W2KB7, AreUMinister, AskIfImportW2, AssignCodeP, ChangeAdvanceEICForEFile, CheckBoxFive, CheckBoxOne, CheckBoxTwelveNoAmt, CheckBoxTwelveNoCode, CheckBoxTwo, CodeA, CodeM, CodesAAndM, DisplayReStatEmpSchedCCopyNum, DisplayReStatEmpSchedCCopyNum2, EINUnrecognized, EmployeeNameAndAddressGroup, EmployeeNameGroup, EmplProvDCBs, EmpName_LiveAudit, EnterAllUnreportedTips, EnterUnder20Tips, FSASp, FSATp, HomeFRVLiveAudit, IDNo, ImportFirstInst, ImportSecondInst, InfoReHousingAll, InfoReParsonage, InternationalEE, IsSpMinister, LifeChanges_NewJob, MaxSSWagesTipsTooLarge, MaxSSWagesTooLarge, MoreThanOneMove, NonqualDistribution, NonqualPlan, NY_LiveAudit, OvertimeWage, OvertimeWageAmt, ParsOrHousing, ProceedWithImport, QualTipsAmt, SchedCDescription, SchedCDescription2, SelectAMove ...(+89)
- data fields (134): 25.113, 52.100, 52.101, 52.102, 52.107, 52.108, 52.109, 52.11, 52.110, 52.111, 52.112, 52.113, 52.114, 52.115, 52.116, 52.127, 52.143, 52.143607, 52.143608, 52.143609, 52.143610, 52.143611, 52.143612, 52.143613, 52.143614, 52.146, 52.147, 52.148, 52.149, 52.150, 52.150435, 52.150437, 52.150666, 52.150667, 52.150668, 52.150669, 52.150670, 52.150671, 52.150672, 52.151, 52.151386, 52.152, 52.154, 52.156, 52.163320, 52.163321, 52.163322, 52.163324, 52.163325, 52.163326, 52.163327, 52.163979, 52.164, 52.165, 52.167, 52.17, 52.18, 52.19, 52.20, 52.21 ...(+74)

### WhichReturn  (64 screens, 64 unique)
- titles: What is included in withholding and payments? | Does an extension give me more time to pay? | Let's Check Your Extension | How much extra time does filing an extension give me? | What if I want correspondence regarding this extension sent to another address or to an agent? | Foreign Address
- screens: Address, Address_MFJ, AmountPaid, CompletingInterview, ErrorCheck, EstimatedTax, MFJFiler, Name, Name_MFJ, NoAmountDue, Payments, QuickPathIntro, SelectState, SpouseName_MFJ, StateExtension_1, StateExtension_2, StateExtension_3, StateExtension_4, StateExtension_5, StateExtension_6, StateExtension_7, StateExtension_8, StateExtension_9, SummaryAmts, SummaryQues, WhichExtension, YourExtension, vAddressChange, vAgent, vAmtPaidWithExtension, vCheckingErrors, vCorrespondenecAddress, vCreditsDef, vDeterminingTaxLiability, vEstimatingAmounts, vExtensionTime, vExtensionWithoutLiability, vFileIfPayingLess, vFilingStatusNotKnown, vHowToCompleteExtension_State, vInfoAlreadyInReturn, vInfoInReturn, vITIN, vLateFilingPenalty, vLiabilityChanges, vMilitaryAddress, vMoreTimeToPay, vNameChange, vNotMFJLastYr, vNotPayingAll ...(+14)
- data fields (31): 37.17, 37.60, 37.64, 37.76, 92.1, 92.10, 92.2, 92.20, 92.21, 92.22, 92.23, 92.23466, 92.24, 92.3, 92.4, 92.477, 92.478, 92.5, 92.545, 92.6, 92.671, 92.7, 92.8, 92.81523, 92.81524, 92.81525, 92.9, rb_ExtensionFiled, rb_MFJ, rb_OptionalPymt, rb_WhichExtension

### WrapUp  (42 screens, 42 unique)
- titles: Tell us if any of these special situations apply. | Enter your IP PINs, if any, for the child care credit. | Injured Spouse | What if I'm not sure whether an item applies? | Request for Alternative Media Preference | Identity Protection PIN
- screens: BalanceDue, BalanceDueMFJ, dep2IPpin, dep3IPpin, dep4IPpin, dep5IPpin, dep6IPpin, depAddtlIPpin, depIPpin, MFJipPIN, MissingOUO, MissingOUOMFJ, NondepCare1, NondepCare2, NondepCare3, NondepEIC1, NondepEIC12, NondepEIC13, NondepEIC2, NondepEIC23, NondepEIC3, Refund, Refund_MFJ, TPipPIN, TPipPINnoDeps, ZeroBalance, ZeroBalanceMFJ, vExtensionAllowed, vFiduciaryReturn, vForm8621, vIPPin, vNotSure, vSec962Election, vTPDesignee, vWhyAmend, hLanguagePreference, hLearnMore_AltMediaPreference, hLearnMore_Form8958, hLearnMore_InjSpouse, hLearnMore_LanguagePreference, hLearnMore_NotPayingFull, hOUOCode
- data fields (28): 100.181634, 100.181635, 100.181636, 173.181637, 173.181638, 173.181639, 173.181640, 173.181641, 173.181642, 173.181643, 173.181644, 173.181645, 173.181646, 173.181647, 173.181648, 173.181649, 173.181650, 173.181651, 173.181652, 173.181653, 173.181654, 173.181655, 173.181656, 92.147970, 92.73584, 95.181619, 95.181620, 95.181621

