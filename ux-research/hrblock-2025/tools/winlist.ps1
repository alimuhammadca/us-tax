. "$PSScriptRoot\winlib.ps1"
Add-Type @'
using System; using System.Text; using System.Collections.Generic; using System.Runtime.InteropServices;
public class HWL { public delegate bool EP(IntPtr h, IntPtr p);
 [DllImport("user32.dll")] public static extern bool EnumWindows(EP c, IntPtr p);
 [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int m);
 [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder s, int m);
 [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
 public static List<string> L(uint want){ var r=new List<string>(); EnumWindows((h,p)=>{ uint pid; GetWindowThreadProcessId(h,out pid); if(pid==want && IsWindowVisible(h)){ var t=new StringBuilder(200); GetWindowText(h,t,200); var c=new StringBuilder(80); GetClassName(h,c,80); r.Add(h.ToString()+" ["+c+"] "+t);} return true;},IntPtr.Zero); return r; } }
'@
$p=(Get-Process HRBlock2025 | Select-Object -First 1).Id; [HWL]::L([uint32]$p)
