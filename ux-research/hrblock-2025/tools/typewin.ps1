# Click a point in an HRB window (window-relative coords) then type text into whatever child is under it,
# using PostMessage WM_CHAR (no global keyboard/mouse). Optional -Enter / -Tab afterwards.
param([int]$X, [int]$Y, [string]$Text='', [string]$Class, [switch]$Tab, [switch]$Enter, [int]$VKey=0, [int]$Repeat=1)
. "$PSScriptRoot\winlib.ps1"
Add-Type @'
using System; using System.Runtime.InteropServices;
public class TW {
  [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X, Y; }
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool ScreenToClient(IntPtr h, ref POINT p);
  [DllImport("user32.dll")] public static extern IntPtr ChildWindowFromPointEx(IntPtr h, POINT p, uint f);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, IntPtr p);
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
  [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a, uint b, bool f);
  [DllImport("user32.dll")] public static extern IntPtr GetFocus();
  public static IntPtr Deep(IntPtr top, int x, int y, out int cx, out int cy) {
    RECT r; GetWindowRect(top, out r); int sx = r.L + x, sy = r.T + y; IntPtr cur = top;
    for (int i = 0; i < 12; i++) { POINT p; p.X = sx; p.Y = sy; ScreenToClient(cur, ref p); IntPtr ch = ChildWindowFromPointEx(cur, p, 1|2|4); if (ch == IntPtr.Zero || ch == cur) break; cur = ch; }
    POINT c; c.X = sx; c.Y = sy; ScreenToClient(cur, ref c); cx = c.X; cy = c.Y; return cur;
  }
  public static IntPtr FocusOf(IntPtr w) { uint t = GetWindowThreadProcessId(w, IntPtr.Zero); uint me = GetCurrentThreadId(); AttachThreadInput(me, t, true); IntPtr f = GetFocus(); AttachThreadInput(me, t, false); return f; }
}
'@
if (-not $Class) { $Class = 'H&R Block 2025' }
$top = Find-HrbWindow $Class
$cx = 0; $cy = 0; $w = [TW]::Deep($top, $X, $Y, [ref]$cx, [ref]$cy)
$lp = [IntPtr](($cy -shl 16) -bor ($cx -band 0xFFFF))
[TW]::PostMessage($w, 0x0201, [IntPtr]1, $lp) | Out-Null; Start-Sleep -Milliseconds 60; [TW]::PostMessage($w, 0x0202, [IntPtr]0, $lp) | Out-Null
Start-Sleep -Milliseconds 400
$f = [TW]::FocusOf($w); if ($f -eq [IntPtr]::Zero) { $f = $w }
foreach ($ch in $Text.ToCharArray()) { [TW]::PostMessage($f, 0x0102, [IntPtr][int]$ch, [IntPtr]1) | Out-Null; Start-Sleep -Milliseconds 40 }
if ($Tab) { [TW]::PostMessage($f, 0x0100, [IntPtr]0x09, [IntPtr]1) | Out-Null; [TW]::PostMessage($f, 0x0101, [IntPtr]0x09, [IntPtr]1) | Out-Null }
if ($Enter) { [TW]::PostMessage($f, 0x0100, [IntPtr]0x0D, [IntPtr]1) | Out-Null; [TW]::PostMessage($f, 0x0101, [IntPtr]0x0D, [IntPtr]1) | Out-Null }
if ($VKey -gt 0) { for ($i=0; $i -lt $Repeat; $i++) { [TW]::PostMessage($f, 0x0100, [IntPtr]$VKey, [IntPtr]1) | Out-Null; [TW]::PostMessage($f, 0x0101, [IntPtr]$VKey, [IntPtr]1) | Out-Null; Start-Sleep -Milliseconds 30 } }
"typed into $f (child $w)"
