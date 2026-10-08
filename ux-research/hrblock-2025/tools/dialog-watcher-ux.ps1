# UX-research variant of e2e\dialog-watcher.ps1: dismisses native MFC #32770 dialogs (Save->No, else OK)
# but FIRST logs the dialog title + all static text + button captions to dialogs.log so the copy is documented.
# Unlike the QA watcher it does NOT close the native Accuracy Review window (we want to study it).
Add-Type @'
using System; using System.Text; using System.Collections.Generic; using System.Runtime.InteropServices;
public class DWU {
  public delegate bool EP(IntPtr h, IntPtr p);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EP c, IntPtr p);
  [DllImport("user32.dll")] public static extern bool EnumChildWindows(IntPtr h, EP c, IntPtr p);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int m);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder s, int m);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern IntPtr SendMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern IntPtr SendMessage(IntPtr h, uint m, IntPtr w, string l);
  public static string Handle(uint hrbPid){
    IntPtr dlg=IntPtr.Zero; string title="";
    EnumWindows((h,p)=>{ if(!IsWindowVisible(h))return true; uint pid; GetWindowThreadProcessId(h,out pid); if(pid!=hrbPid) return true;
      var c=new StringBuilder(20); GetClassName(h,c,20); if(c.ToString()=="#32770"){ var t=new StringBuilder(200); GetWindowText(h,t,200); dlg=h; title=t.ToString(); return false;} return true;},IntPtr.Zero);
    if(dlg==IntPtr.Zero) return null;
    var texts=new List<string>(); var buttons=new List<string>();
    EnumChildWindows(dlg,(ch,pp)=>{ var cc=new StringBuilder(30); GetClassName(ch,cc,30); var ct=new StringBuilder(2000); GetWindowText(ch,ct,2000); string s=ct.ToString().Replace("\r"," ").Replace("\n"," ");
      if(cc.ToString()=="Button") buttons.Add(s); else if(s.Length>0) texts.Add(s); return true;},IntPtr.Zero);
    string want = (title.IndexOf("Save",StringComparison.OrdinalIgnoreCase)>=0) ? "No" : "OK";
    if (title.IndexOf("AutoSave As",StringComparison.OrdinalIgnoreCase)>=0) {
      want="OK"; IntPtr ed=IntPtr.Zero;
      EnumChildWindows(dlg,(ch,pp)=>{ var cc=new StringBuilder(20); GetClassName(ch,cc,20); if(cc.ToString()=="Edit"){ ed=ch; return false;} return true;},IntPtr.Zero);
      if(ed!=IntPtr.Zero) SendMessage(ed,0x000C,IntPtr.Zero,"UX-Research-Sample");
    }
    IntPtr btn=IntPtr.Zero;
    EnumChildWindows(dlg,(ch,pp)=>{ var cc=new StringBuilder(20); GetClassName(ch,cc,20); if(cc.ToString()=="Button"){ var ct=new StringBuilder(60); GetWindowText(ch,ct,60); string b=ct.ToString().Replace("&",""); if(b.Equals(want,StringComparison.OrdinalIgnoreCase)||(want=="OK"&&(b.Equals("Close",StringComparison.OrdinalIgnoreCase)))){btn=ch; return false;} } return true;},IntPtr.Zero);
    string desc="TITLE="+title+" | TEXT="+string.Join(" / ",texts)+" | BUTTONS="+string.Join(",",buttons);
    if(btn!=IntPtr.Zero){ SendMessage(btn,0x00F5,IntPtr.Zero,IntPtr.Zero); return desc+" | CLICKED="+want; }
    return desc+" | NO-MATCH (left open)";
  }
}
'@
$log='C:\us-tax\ux-research\hrblock-2025\dialogs.log'
$lastNoMatch=''
while ($true) {
  try {
    $p = Get-Process HRBlock2025 -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($p) { $r=[DWU]::Handle([uint32]$p.Id); if ($r) { if ($r -like '*NO-MATCH*') { if ($r -ne $lastNoMatch) { "$(Get-Date -Format s) $r" | Add-Content $log; $lastNoMatch=$r } } else { "$(Get-Date -Format s) $r" | Add-Content $log; Start-Sleep -Milliseconds 1200 } } }
  } catch {}
  Start-Sleep -Milliseconds 700
}
