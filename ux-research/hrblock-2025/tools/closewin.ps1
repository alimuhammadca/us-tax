param([string]$Class='Help Central 2025')
. "$PSScriptRoot\winlib.ps1"
$h = Find-HrbWindow $Class
if ($h -ne [IntPtr]::Zero) { [HW]::SendMessage($h,0x0010,[IntPtr]::Zero,[IntPtr]::Zero) | Out-Null; "closed" } else { "none" }
