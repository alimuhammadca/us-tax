# dlgbtn.ps1 <windowName> <buttonName|AutomationId|innerText> : invoke a button inside a child [Window] of TurboTax (async-safe)
param([string]$win, [string]$btn, [switch]$list)
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes
$p = Get-Process TurboTax | Select-Object -First 1
$desk = [System.Windows.Automation.AutomationElement]::RootElement
$top = $desk.FindAll([System.Windows.Automation.TreeScope]::Children, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ProcessIdProperty, $p.Id))) | Where-Object { $_.Current.Name -like 'TurboTax*' } | Select-Object -First 1
$wins = $top.FindAll([System.Windows.Automation.TreeScope]::Descendants, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Window)))
$dlg = $wins | Where-Object { $_.Current.Name -like "*$win*" } | Select-Object -First 1
if (-not $dlg) { "NO_DIALOG '$win'"; exit 1 }
$btns = $dlg.FindAll([System.Windows.Automation.TreeScope]::Descendants, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Button)))
foreach ($b in $btns) {
  $inner = ''; $t = $b.FindFirst([System.Windows.Automation.TreeScope]::Descendants, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Text))); if ($t) { $inner = $t.Current.Name }
  if ($list) { "btn name='$($b.Current.Name)' id='$($b.Current.AutomationId)' text='$inner'"; continue }
  if ($b.Current.Name -eq $btn -or $b.Current.AutomationId -eq $btn -or $inner -eq $btn) {
    $job = Start-Job -ArgumentList $b.Current.NativeWindowHandle, $dlg.Current.Name, $btn -ScriptBlock { param($x,$dn,$bn)
      Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes
      $p = Get-Process TurboTax | Select-Object -First 1
      $desk = [System.Windows.Automation.AutomationElement]::RootElement
      $top = $desk.FindAll([System.Windows.Automation.TreeScope]::Children, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ProcessIdProperty, $p.Id))) | Where-Object { $_.Current.Name -like 'TurboTax*' } | Select-Object -First 1
      $d = $top.FindAll([System.Windows.Automation.TreeScope]::Descendants, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Window))) | Where-Object { $_.Current.Name -eq $dn } | Select-Object -First 1
      $bs = $d.FindAll([System.Windows.Automation.TreeScope]::Descendants, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Button)))
      foreach ($b in $bs) { $i=''; $t = $b.FindFirst([System.Windows.Automation.TreeScope]::Descendants, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Text))); if ($t) { $i = $t.Current.Name }
        if ($b.Current.Name -eq $bn -or $b.Current.AutomationId -eq $bn -or $i -eq $bn) { $b.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke(); break } } }
    Start-Sleep -Seconds 3; "invoked '$btn' in '$($dlg.Current.Name)' (job $($job.State))"; exit 0
  }
}
if (-not $list) { "NO_BUTTON '$btn'" }
