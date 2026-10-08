# msaa.ps1 dump | click <name> [idx] | fill <name> <value> | find <name>  -- MSAA access to TurboTax CEF ("Fuego Web Player") content
param([string]$cmd = 'dump', [string]$arg, [string]$arg2)
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes,System.Windows.Forms
if (-not ([System.Management.Automation.PSTypeName]'A').Type) {
Add-Type @"
using System; using System.Runtime.InteropServices;
public class A { [DllImport("oleacc.dll")] public static extern int AccessibleObjectFromWindow(IntPtr hwnd, uint id, ref Guid iid, [MarshalAs(UnmanagedType.IUnknown)] out object o);
[DllImport("oleacc.dll")] public static extern int AccessibleChildren([MarshalAs(UnmanagedType.IDispatch)] object acc, int start, int count, [Out, MarshalAs(UnmanagedType.LPArray, SizeParamIndex=2)] object[] children, out int obtained);
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
[DllImport("user32.dll")] public static extern bool SetCursorPos(int x,int y);
[DllImport("user32.dll")] public static extern void mouse_event(int f,int x,int y,int d,int e); }
"@ }
$p = Get-Process TurboTax -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $p) { "NO_WINDOW"; exit 1 }
$__desk = [System.Windows.Automation.AutomationElement]::RootElement
$__top = $__desk.FindAll([System.Windows.Automation.TreeScope]::Children, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ProcessIdProperty, $p.Id))) | Where-Object { $_.Current.Name -like 'TurboTax*' } | Select-Object -First 1
if (-not $__top) { "NO_WINDOW"; exit 1 }

$root = $__top
$cw = $root.FindFirst([System.Windows.Automation.TreeScope]::Descendants, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, 'Chrome Legacy Window')))
if (-not $cw) { 'NO_CEF'; exit 1 }
$h = [IntPtr]$cw.Current.NativeWindowHandle
$g = [Guid]"618736E0-3C3D-11CF-810C-00AA00389B71"
$o = $null; [A]::AccessibleObjectFromWindow($h, [uint32]4294967292, [ref]$g, [ref]$o) | Out-Null
$roles = @{9='window';10='client';15='document';20='grouping';30='link';41='text';42='edit';43='button';44='checkbox';45='radio';46='combobox';33='list';34='listitem';40='graphic';25='heading?';28='cell';26='row';24='table';35='outline';36='outlineitem';37='tab';60='page';13='menuitem'}
$script:items = New-Object System.Collections.ArrayList
function Kids($acc) {
  $n = 0; try { $n = $acc.accChildCount } catch {}
  if ($n -le 0) { return @() }
  $arr = New-Object object[] $n; $got = 0
  [A]::AccessibleChildren($acc, 0, $n, $arr, [ref]$got) | Out-Null
  return $arr[0..($got-1)]
}
function Walk($acc, $d) {
  if ($d -gt 40) { return }
  foreach ($c in (Kids $acc)) {
    if ($c -is [int]) { continue }
    $nm = ''; $role = ''; $val = ''; $st = 0
    try { $nm = $c.accName(0) } catch {}
    try { $role = $c.accRole(0) } catch {}
    try { $val = $c.accValue(0) } catch {}
    try { $st = [int]$c.accState(0) } catch {}
    $rn = if ($roles.ContainsKey([int]$role)) { $roles[[int]$role] } else { "r$role" }
    $flags = ''
    if ($st -band 0x10) { $flags += ' [checked]' }
    if ($st -band 0x1) { $flags += ' [unavail]' }
    if ($st -band 0x8000) { continue }  # invisible/offscreen-ish: STATE_SYSTEM_INVISIBLE
    [void]$script:items.Add([pscustomobject]@{ acc = $c; name = "$nm"; role = $rn; val = "$val"; depth = $d })
    if ($nm -or $val -or $rn -match 'edit|button|radio|checkbox|combobox|link') { ('  ' * $d) + "[$rn] '$nm'" + $(if ($val -and $val -ne $nm) { " =$val" }) + $flags }
    Walk $c ($d + 1)
  }
}
function Pick($name, $idx, $roleFilter) {
  $m = @($script:items | Where-Object { $_.name -eq $name -and (-not $roleFilter -or $_.role -match $roleFilter) })
  if ($m.Count -le $idx) { $m = @($script:items | Where-Object { $_.name -like "*$name*" -and (-not $roleFilter -or $_.role -match $roleFilter) }) }
  if ($m.Count -le $idx) { return $null }
  return $m[$idx]
}
switch ($cmd) {
  'dump' { Walk $o 0 }
  'click' {
    Walk $o 0 | Out-Null
    $idx = if ($arg2) { [int]$arg2 } else { 0 }
    $it = Pick $arg $idx 'button|radio|checkbox|link|listitem|combobox|menuitem|r12|r57|outlineitem|tab'
    if (-not $it) { $it = Pick $arg $idx $null }
    if (-not $it) { "NOT_FOUND '$arg'"; exit 1 }
    try { $it.acc.accDoDefaultAction(0); "did-default '$($it.name)' ($($it.role))" }
    catch { "DEFAULT_ACTION_FAILED '$($it.name)' ($($it.role))" }
  }
  'fill' {
    Walk $o 0 | Out-Null
    $m = @($script:items | Where-Object { ($_.role -eq 'edit' -or $_.role -eq 'combobox') -and ($_.name -eq $arg) })
    if ($m.Count -eq 0) { $m = @($script:items | Where-Object { $_.role -eq 'edit' -and $_.name -like "*$arg*" }) }
    $idx = 0
    if ($m.Count -eq 0) { "NOT_FOUND edit '$arg'"; exit 1 }
    $it = $m[$idx]
    try { $it.acc.accValue(0) = $arg2; "set '$($it.name)'" } catch {
      # fall back to UIA ValuePattern on the focused element after MSAA select/focus
      try { $it.acc.accSelect(3, 0) } catch {}
      Start-Sleep -Milliseconds 200
      $f = [System.Windows.Automation.AutomationElement]::FocusedElement
      try { $f.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern).SetValue($arg2); "uia-set '$($it.name)'" } catch { "FILL_FAILED '$($it.name)': $_" }
    }
  }
  'select' {
    # select <comboName> <optionText> [comboIndex]
    $script:inv = $true
    Walk $o 0 | Out-Null
    $ci = 0
    $cbs = @($script:items | Where-Object { $_.role -eq 'combobox' -and $_.name -eq $arg })
    if ($cbs.Count -eq 0) { "NOT_FOUND combobox '$arg'"; exit 1 }
    $cb = $cbs[$(if ($args.Count) {0} else {0})].acc
    if ($env:COMBO_IDX) { $cb = $cbs[[int]$env:COMBO_IDX].acc }
    try { $cb.accSelect(1,0) } catch {}; Start-Sleep -Milliseconds 400; try { $cb.accDoDefaultAction(0) } catch {}; Start-Sleep -Milliseconds 900
    $opts = New-Object System.Collections.ArrayList
    function Collect($a, $d) { if ($d -gt 4) { return }; foreach ($k in (Kids $a)) { if ($k -is [int]) { continue }; $nn=''; try { $nn = $k.accName(0) } catch {}; [void]$opts.Add([pscustomobject]@{acc=$k; name="$nn"}); Collect $k ($d+1) } }
    Collect $cb 0
    if (-not $arg2) { $opts | ForEach-Object { "opt '$($_.name)'" }; return }
    $t = $opts | Where-Object { $_.name -eq $arg2 } | Select-Object -First 1
    if (-not $t) { $t = $opts | Where-Object { $_.name -like "*$arg2*" } | Select-Object -First 1 }
    if (-not $t) { "NO_OPTION '$arg2' among $($opts.Count)"; exit 1 }
    try { $t.acc.accDoDefaultAction(0); "chose '$($t.name)'"; Start-Sleep -Milliseconds 500; $stt = 0; try { $stt = [int]$cb.accState(0) } catch {}; if ($stt -band 0x200) { $cb.accDoDefaultAction(0); "closed popup" } } catch { try { $t.acc.accSelect(3,0); "accselected '$($t.name)'" } catch { "SELECT_FAILED $_" } }
  }
  'type' {
    # type <name> <sendkeys> : focus element via MSAA, bring TurboTax to the foreground, send keystrokes
    Walk $o 0 | Out-Null
    $m = @($script:items | Where-Object { ($_.role -eq 'edit' -or $_.role -eq 'combobox') -and $_.name -eq $arg })
    if ($m.Count -eq 0) { $m = @($script:items | Where-Object { ($_.role -eq 'edit' -or $_.role -eq 'combobox') -and $_.name -like "*$arg*" }) }
    if ($m.Count -eq 0) { "NOT_FOUND '$arg'"; exit 1 }
    [A]::SetForegroundWindow([IntPtr]$__top.Current.NativeWindowHandle) | Out-Null; Start-Sleep -Milliseconds 300
    try { $m[0].acc.accSelect(1, 0) } catch {}
    Start-Sleep -Milliseconds 300
    [System.Windows.Forms.SendKeys]::SendWait("^a{DEL}"); [System.Windows.Forms.SendKeys]::SendWait($arg2); "typed into '$($m[0].name)'"
  }
  'loc' {
    Walk $o 0 | Out-Null
    $it = Pick $arg 0 $null
    $l=0;$t=0;$w=0;$hh=0; $it.acc.accLocation([ref]$l,[ref]$t,[ref]$w,[ref]$hh,0); "$l $t $w $hh"
  }
}






