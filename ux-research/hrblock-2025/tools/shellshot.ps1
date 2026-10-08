# Capture the whole H&R Block main window (native MFC chrome + WebView) via PrintWindow, and dump the
# UI Automation names of the native chrome (left nav, refund meter, menu, tabs) to a .txt next to it.
# Usage: powershell -File shellshot.ps1 -Out C:\us-tax\ux-research\hrblock-2025\shell\S01-home   [-NoUia]
param([Parameter(Mandatory=$true)][string]$Out, [switch]$NoUia, [string]$Class)
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System; using System.Runtime.InteropServices;
public class PW {
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint f);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern IntPtr FindWindow(string c, string t);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
}
'@
$p = Get-Process HRBlock2025 -ErrorAction Stop | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
. "$PSScriptRoot\winlib.ps1"
if (-not $Class) { $Class = 'H&R Block 2025' }
$h = Find-HrbWindow $Class; if ($h -eq [IntPtr]::Zero) { 'no window matching ' + $Class; exit 1 }
$r = New-Object PW+RECT; [PW]::GetWindowRect($h, [ref]$r) | Out-Null
$w = $r.R - $r.L; $ht = $r.B - $r.T
$bmp = New-Object System.Drawing.Bitmap $w, $ht
$g = [System.Drawing.Graphics]::FromImage($bmp); $hdc = $g.GetHdc()
[PW]::PrintWindow($h, $hdc, 2) | Out-Null
$g.ReleaseHdc($hdc); $g.Dispose()
$bmp.Save("$Out.png", [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
"title: $($p.MainWindowTitle)  size: ${w}x${ht}" | Set-Content -Encoding utf8 "$Out.txt"
if (-not $NoUia) {
  Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes
  $root = [System.Windows.Automation.AutomationElement]::FromHandle($h)
  $walker = [System.Windows.Automation.TreeWalker]::ControlViewWalker
  $lines = New-Object System.Collections.Generic.List[string]
  function Walk($el, $depth) {
    if ($depth -gt 9 -or $lines.Count -gt 1500) { return }
    $ct = $el.Current.ControlType.ProgrammaticName -replace 'ControlType\.',''
    $nm = $el.Current.Name; $cls = $el.Current.ClassName
    if ($cls -like 'Chrome_*' -or $ct -eq 'Document') { $lines.Add((' ' * $depth) + "[$ct/$cls] (webview - skipped)"); return }
    if ($nm -or $ct -match 'Button|MenuItem|TabItem|TreeItem|ListItem|Text|Hyperlink') { $lines.Add((' ' * $depth) + "[$ct/$cls] $nm") }
    $c = $walker.GetFirstChild($el)
    while ($c -ne $null) { Walk $c ($depth + 1); $c = $walker.GetNextSibling($c) }
  }
  Walk $root 0
  $lines | Add-Content -Encoding utf8 "$Out.txt"
}
"saved $Out.png"
