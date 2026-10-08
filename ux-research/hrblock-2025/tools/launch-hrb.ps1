# Launch H&R Block 2025 with the WebView2 CDP port open, on a FRESH return, and start the dialog watcher.
# Usage:  powershell -ExecutionPolicy Bypass -File launch-hrb.ps1 [-Fresh]
param([switch]$Fresh)
Get-Process HRBlock2025 -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3
if ($Fresh) {
  $f = 'C:\ProgramData\TaxCut\2025\cmWCPA9401.25'
  if (Test-Path $f) { Move-Item $f ($f + '.bak-ux-' + (Get-Date -Format 'yyyyMMddHHmmss')) -Force }
}
$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = '--remote-debugging-port=9223'
Start-Process 'C:\Program Files (x86)\HRBlock2025\Program\HRBlock2025.exe'
# dialog watcher (Save->No, else OK; closes the native Accuracy Review window -- disable via -NoWatcher if studying it)
if (-not (Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" | Where-Object { $_.CommandLine -like '*dialog-watcher-ux.ps1*' })) {
  Start-Process powershell -WindowStyle Hidden -ArgumentList '-ExecutionPolicy','Bypass','-File','C:\us-tax\ux-research\hrblock-2025\tools\dialog-watcher-ux.ps1'
}
"launched"
