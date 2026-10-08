# scroll.ps1 <notches> : positive = scroll down, posts WM_MOUSEWHEEL to the CEF render window (no focus needed)
param([int]$n = 5, [string]$target = 'cef')
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes
if (-not ([System.Management.Automation.PSTypeName]'SW').Type) {
Add-Type @"
using System; using System.Runtime.InteropServices;
public class SW { [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, int m, IntPtr w, IntPtr l);
[DllImport("user32.dll")] public static extern bool SendMessage(IntPtr h, int m, IntPtr w, IntPtr l);
[DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r); public struct RECT{public int L,T,R,B;} }
"@ }
$p = Get-Process TurboTax | Select-Object -First 1
$desk = [System.Windows.Automation.AutomationElement]::RootElement
$top = $desk.FindAll([System.Windows.Automation.TreeScope]::Children, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ProcessIdProperty, $p.Id))) | Where-Object { $_.Current.Name -like 'TurboTax*' } | Select-Object -First 1
$cw = $top.FindFirst([System.Windows.Automation.TreeScope]::Descendants, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, 'Chrome Legacy Window')))
if ($target -eq 'cef' -and $cw) { $h = [IntPtr]$cw.Current.NativeWindowHandle } else {
  # WPF: use ScrollPattern on #scrollViewer
  $sv = $top.FindFirst([System.Windows.Automation.TreeScope]::Descendants, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::AutomationIdProperty, 'scrollViewer')))
  $sp = $sv.GetCurrentPattern([System.Windows.Automation.ScrollPattern]::Pattern)
  $pct = [Math]::Max(0, [Math]::Min(100, $sp.Current.VerticalScrollPercent + $n * 10)); $sp.SetScrollPercent(-1, $pct); "wpf scrolled to $pct"; return }
$r = New-Object SW+RECT; [SW]::GetWindowRect($h, [ref]$r) | Out-Null
$x = [int](($r.L + $r.R) / 2); $y = [int](($r.T + $r.B) / 2)
$lp = [IntPtr](($y -shl 16) -bor ($x -band 0xFFFF))
$delta = if ($n -gt 0) { -120 } else { 120 }
for ($i = 0; $i -lt [Math]::Abs($n); $i++) { $wp = [IntPtr](($delta -shl 16) -band 0xFFFF0000); [SW]::PostMessage($h, 0x020A, $wp, $lp) | Out-Null; Start-Sleep -Milliseconds 60 }
"posted $n wheel notches"
