# Click inside the H&R Block main window WITHOUT moving the real mouse: posts WM_LBUTTONDOWN/UP to the deepest
# child window under (X,Y), where X,Y are pixel coords in the PrintWindow screenshot (window-relative).
# Usage: powershell -File clickwin.ps1 -X 395 -Y 310 [-Class "Help Central 2025"]
param([int]$X, [int]$Y, [string]$Class)
Add-Type @'
using System; using System.Runtime.InteropServices;
public class CWin {
  [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X, Y; }
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool ScreenToClient(IntPtr h, ref POINT p);
  [DllImport("user32.dll")] public static extern IntPtr ChildWindowFromPointEx(IntPtr h, POINT p, uint f);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern IntPtr FindWindow(string c, string t);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(IntPtr h, System.Text.StringBuilder s, int m);
  public static string Click(IntPtr top, int x, int y) {
    RECT r; GetWindowRect(top, out r);
    int sx = r.L + x, sy = r.T + y; IntPtr cur = top; string path = "";
    for (int i = 0; i < 12; i++) {
      POINT p; p.X = sx; p.Y = sy; ScreenToClient(cur, ref p);
      IntPtr ch = ChildWindowFromPointEx(cur, p, 1 | 2 | 4);
      if (ch == IntPtr.Zero || ch == cur) break;
      cur = ch; var sb = new System.Text.StringBuilder(64); GetClassName(cur, sb, 64); path += " > " + sb.ToString();
    }
    POINT c; c.X = sx; c.Y = sy; ScreenToClient(cur, ref c);
    IntPtr lp = (IntPtr)((c.Y << 16) | (c.X & 0xFFFF));
    PostMessage(cur, 0x0200, IntPtr.Zero, lp);           // WM_MOUSEMOVE
    PostMessage(cur, 0x0201, (IntPtr)1, lp);             // WM_LBUTTONDOWN
    System.Threading.Thread.Sleep(60);
    PostMessage(cur, 0x0202, IntPtr.Zero, lp);           // WM_LBUTTONUP
    return "clicked" + path + " @" + c.X + "," + c.Y;
  }
}
'@
. "$PSScriptRoot\winlib.ps1"
if (-not $Class) { $Class = 'H&R Block 2025' }
$h = Find-HrbWindow $Class
[CWin]::Click($h, $X, $Y)
