# TurboTax UI helper: shot <file> | dump [depth] | click <name> | type <text> | keys <sendkeys>
param([string]$cmd, [string]$arg, [string]$arg2)
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes,System.Windows.Forms,System.Drawing
Add-Type @"
using System; using System.Runtime.InteropServices;
public class W { [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
 [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h,int n);
 [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
 [DllImport("user32.dll")] public static extern bool SetCursorPos(int x,int y);
 [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint f);
 [DllImport("user32.dll")] public static extern void mouse_event(int f,int x,int y,int d,int e);
 public struct RECT{public int L,T,R,B;} }
"@
$p = Get-Process TurboTax -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $p) { "NO_WINDOW"; exit 1 }
$__desk = [System.Windows.Automation.AutomationElement]::RootElement
$__top = $__desk.FindAll([System.Windows.Automation.TreeScope]::Children, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ProcessIdProperty, $p.Id))) | Where-Object { $_.Current.Name -like 'TurboTax*' } | Select-Object -First 1
if (-not $__top) { "NO_WINDOW"; exit 1 }
$h = [IntPtr]$__top.Current.NativeWindowHandle
$root = $__top
function Walk($el, $d, $max) {
  if ($d -gt $max) { return }
  $w = [System.Windows.Automation.TreeWalker]::ControlViewWalker
  $c = $w.GetFirstChild($el)
  while ($c) {
    $ct = $c.Current.ControlType.ProgrammaticName -replace 'ControlType.',''
    $n = $c.Current.Name; $aid = $c.Current.AutomationId
    $v = ''
    try { $vp = $c.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern); $v = $vp.Current.Value } catch {}
    if ($n -or $aid -or $v) { ('  ' * $d) + "[$ct] '$n'" + $(if($aid){" #$aid"}) + $(if($v){" =$v"}) + $(if(-not $c.Current.IsEnabled){" (disabled)"}) }
    Walk $c ($d+1) $max
    $c = $w.GetNextSibling($c)
  }
}
switch ($cmd) {
  'shot' {
    # PrintWindow(PW_RENDERFULLCONTENT) captures without needing the window in the foreground
    $r = New-Object W+RECT; [W]::GetWindowRect($h, [ref]$r) | Out-Null
    $bmp = New-Object System.Drawing.Bitmap ($r.R-$r.L), ($r.B-$r.T)
    $g = [System.Drawing.Graphics]::FromImage($bmp); $hdc = $g.GetHdc()
    [W]::PrintWindow($h, $hdc, 2) | Out-Null; $g.ReleaseHdc($hdc)
    $bmp.Save($arg, [System.Drawing.Imaging.ImageFormat]::Png); "saved $arg"
  }
  'dump' { $max = if ($arg) { [int]$arg } else { 40 }; "TITLE: " + $root.Current.Name; Walk $root 0 $max }
  'click' {
    $cond = New-Object System.Windows.Automation.OrCondition((New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, $arg)), (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::AutomationIdProperty, $arg)))
    $els = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $cond)
    $idx = if ($arg2) { [int]$arg2 } else { 0 }
    if ($els.Count -le $idx) { "NOT_FOUND '$arg' (count $($els.Count))"; exit 1 }
    $e = $els[$idx]
    try { $e.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke(); "invoked '$arg'" }
    catch { try { $e.GetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern).Select(); "selected '$arg'" }
    catch { try { $e.GetCurrentPattern([System.Windows.Automation.TogglePattern]::Pattern).Toggle(); "toggled '$arg'" }
    catch { $b = $e.Current.BoundingRectangle; [W]::SetForegroundWindow($h) | Out-Null; [W]::SetCursorPos([int]($b.X+$b.Width/2), [int]($b.Y+$b.Height/2)); [W]::mouse_event(2,0,0,0,0); [W]::mouse_event(4,0,0,0,0); "mouse-clicked '$arg'" } } }
  }
  'fill' {
    # fill <name-or-automationId> <value> : first Edit whose Name or AutomationId matches
    $all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)
    $e = $all | Where-Object { $_.Current.ControlType -eq [System.Windows.Automation.ControlType]::Edit -and ($_.Current.Name -eq $arg -or $_.Current.AutomationId -eq $arg) } | Select-Object -First 1
    if (-not $e) { "NOT_FOUND edit '$arg'"; exit 1 }
    try { $e.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern).SetValue($arg2); "filled '$arg'" }
    catch { $e.SetFocus(); [System.Windows.Forms.SendKeys]::SendWait("^a" + $arg2); "typed '$arg'" }
  }
  'edits' {
    $all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)
    $i = 0; foreach ($e in $all) { if ($e.Current.ControlType -eq [System.Windows.Automation.ControlType]::Edit -or $e.Current.ControlType -eq [System.Windows.Automation.ControlType]::ComboBox) { "$i [$($e.Current.ControlType.ProgrammaticName)] name='$($e.Current.Name)' id='$($e.Current.AutomationId)'" }; $i++ }
  }
  'combo' {
    # combo <AutomationId> [itemText] : expand, list items (or select the one matching itemText)
    $cond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::AutomationIdProperty, $arg)
    $cb = $root.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $cond)
    if (-not $cb) { "NOT_FOUND combo '$arg'"; exit 1 }
    $ec = $cb.GetCurrentPattern([System.Windows.Automation.ExpandCollapsePattern]::Pattern); $ec.Expand(); Start-Sleep -Milliseconds 500
    $items = $cb.FindAll([System.Windows.Automation.TreeScope]::Descendants, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::ListItem)))
    $done = $false
    foreach ($it in $items) {
      $nm = $it.Current.Name
      if (-not $nm) { $t = $it.FindFirst([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition); if ($t) { $nm = $t.Current.Name } }
      if ($arg2 -and -not $done -and $nm -like "*$arg2*") { $it.GetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern).Select(); "selected '$nm'"; $done = $true }
      elseif (-not $arg2) { "item '$nm'" }
    }
    try { $ec.Collapse() } catch {}
  }
  'mouse' {
    $cond = New-Object System.Windows.Automation.OrCondition((New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, $arg)), (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::AutomationIdProperty, $arg)))
    $els = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $cond)
    $idx = if ($arg2) { [int]$arg2 } else { 0 }
    if ($els.Count -le $idx) { "NOT_FOUND '$arg'"; exit 1 }
    $b = $els[$idx].Current.BoundingRectangle; [W]::SetForegroundWindow($h) | Out-Null; Start-Sleep -Milliseconds 300
    [W]::SetCursorPos([int]($b.X+$b.Width/2), [int]($b.Y+$b.Height/2)); [W]::mouse_event(2,0,0,0,0); [W]::mouse_event(4,0,0,0,0); "mouse-clicked '$arg' at $([int]($b.X+$b.Width/2)),$([int]($b.Y+$b.Height/2))"
  }
  'clickxy' {
    # clickxy <x> <y> : window-relative coordinates (as in the PrintWindow screenshot)
    $r = New-Object W+RECT; [W]::GetWindowRect($h, [ref]$r) | Out-Null
    [W]::SetForegroundWindow($h) | Out-Null; Start-Sleep -Milliseconds 300
    [W]::SetCursorPos($r.L + [int]$arg, $r.T + [int]$arg2); [W]::mouse_event(2,0,0,0,0); [W]::mouse_event(4,0,0,0,0); "clicked at $($r.L + [int]$arg),$($r.T + [int]$arg2)"
  }
  'wins' {
    # list top-level windows belonging to TurboTax process(es)
    $pids = (Get-Process TurboTax).Id
    $desk = [System.Windows.Automation.AutomationElement]::RootElement
    $ws = $desk.FindAll([System.Windows.Automation.TreeScope]::Children, [System.Windows.Automation.Condition]::TrueCondition)
    foreach ($w in $ws) { if ($pids -contains $w.Current.ProcessId) { "hwnd=$($w.Current.NativeWindowHandle) name='$($w.Current.Name)' rect=$($w.Current.BoundingRectangle)" } }
  }
  'shotwin' {
    # shotwin <file> <windowNameSubstring> : PrintWindow of a TurboTax-owned top-level window (or owned child window)
    $pids = (Get-Process TurboTax).Id
    $all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Window)))
    $desk = [System.Windows.Automation.AutomationElement]::RootElement
    $tops = $desk.FindAll([System.Windows.Automation.TreeScope]::Children, [System.Windows.Automation.Condition]::TrueCondition) | Where-Object { $pids -contains $_.Current.ProcessId }
    $w = @($all) + @($tops) | Where-Object { $_.Current.Name -like "*$arg2*" -and $_.Current.NativeWindowHandle -ne 0 } | Select-Object -First 1
    if (-not $w) { "NO_SUCH_WINDOW"; exit 1 }
    $wh = [IntPtr]$w.Current.NativeWindowHandle
    $r = New-Object W+RECT; [W]::GetWindowRect($wh, [ref]$r) | Out-Null
    $bmp = New-Object System.Drawing.Bitmap ($r.R-$r.L), ($r.B-$r.T)
    $g = [System.Drawing.Graphics]::FromImage($bmp); $hdc = $g.GetHdc()
    [W]::PrintWindow($wh, $hdc, 2) | Out-Null; $g.ReleaseHdc($hdc)
    $bmp.Save($arg, [System.Drawing.Imaging.ImageFormat]::Png); "saved $arg"
  }
  'close' {
    # close <windowNameSubstring>
    $all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Window)))
    $pids = (Get-Process TurboTax).Id
    $desk = [System.Windows.Automation.AutomationElement]::RootElement
    $tops = $desk.FindAll([System.Windows.Automation.TreeScope]::Children, [System.Windows.Automation.Condition]::TrueCondition) | Where-Object { $pids -contains $_.Current.ProcessId -and $_.Current.NativeWindowHandle -ne $h.ToInt32() }
    $w = @($all) + @($tops) | Where-Object { $_.Current.Name -like "*$arg*" } | Select-Object -First 1
    if (-not $w) { "NO_SUCH_WINDOW"; exit 1 }
    $w.GetCurrentPattern([System.Windows.Automation.WindowPattern]::Pattern).Close(); "closed '$($w.Current.Name)'"
  }
  'keys' { [W]::SetForegroundWindow($h) | Out-Null; Start-Sleep -Milliseconds 300; [System.Windows.Forms.SendKeys]::SendWait($arg); "sent keys" }
}




