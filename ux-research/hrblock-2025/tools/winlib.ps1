# Shared: find a visible top-level window of the HRBlock2025 process whose class or title contains $Match.
Add-Type @'
using System; using System.Text; using System.Collections.Generic; using System.Runtime.InteropServices;
public class HW { public delegate bool EP(IntPtr h, IntPtr p);
 [DllImport("user32.dll")] public static extern bool EnumWindows(EP c, IntPtr p);
 [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int m);
 [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder s, int m);
 [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
 [DllImport("user32.dll")] public static extern IntPtr SendMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
 public static IntPtr Find(uint want, string match){ IntPtr found=IntPtr.Zero; EnumWindows((h,p)=>{ uint pid; GetWindowThreadProcessId(h,out pid); if(pid==want && IsWindowVisible(h)){ var t=new StringBuilder(200); GetWindowText(h,t,200); var c=new StringBuilder(80); GetClassName(h,c,80); if(c.ToString().IndexOf(match,StringComparison.OrdinalIgnoreCase)>=0 || t.ToString().IndexOf(match,StringComparison.OrdinalIgnoreCase)>=0){ found=h; return false; } } return true;},IntPtr.Zero); return found; } }
'@
function Find-HrbWindow([string]$Match) { $p = Get-Process HRBlock2025 -ErrorAction Stop | Select-Object -First 1; return [HW]::Find([uint32]$p.Id, $Match) }
