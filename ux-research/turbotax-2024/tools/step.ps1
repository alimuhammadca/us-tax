# step.ps1 <label> [action] [arg] [arg2] -> performs action, waits, saves screens\NNN-<title-slug>.png + .txt (UIA dump)
param([string]$label, [string]$action, [string]$a1, [string]$a2, [int]$wait = 4)
$S = Split-Path $MyInvocation.MyCommand.Path
$dir = "C:\us-tax\ux-research\turbotax-2024\screens"
if ($action -like "m*") { & "$S\msaa.ps1" $action.Substring(1) $a1 $a2; Start-Sleep -Seconds $wait } elseif ($action) { & "$S\tt.ps1" $action $a1 $a2; Start-Sleep -Seconds $wait }
$n = (Get-ChildItem $dir -Filter ???-*.png | Measure-Object).Count
$tmp = "{0}\{1:D3}-tmp" -f $dir, $n
$ms = $null; $cefTitle = $null; & "$S\tt.ps1" dump 40 | Out-File -Encoding utf8 "$tmp.txt"
$lines = Get-Content "$tmp.txt"
if ($lines -match "Chrome Legacy Window") { $ms = & "$S\msaa.ps1" dump; "---- CEF/MSAA content ----" | Out-File -Append -Encoding utf8 "$tmp.txt"; $ms | Out-File -Append -Encoding utf8 "$tmp.txt"; $lines = Get-Content "$tmp.txt"; $cefTitle = ($ms | Where-Object { $_ -match "\[(grouping|heading\?|text)\] '.+'" } | Select-Object -First 1) }
$t = ($lines | Select-String "#titleTextBlock" | Select-Object -First 1).Line; if (-not $t) { $jj = [Array]::FindIndex($lines, [Predicate[string]]{ param($l) $l -match "#scrollViewer" }); if ($jj -ge 0) { $tt2 = $lines[($jj+1)..($lines.Count-1)] | Where-Object { $_ -match "\[Text\] '.+'" } | Select-Object -First 1; if ($tt2 -match "\[Text\] '(.+)'\s*$") { $t = "[Text] '" + $matches[1] + "' #titleTextBlock" } } }
$slug = ''
if ($t -match "\[Text\] '(.*)' #titleTextBlock") { $slug = ($matches[1].ToLower() -replace "[^a-z0-9]+", '-').Trim('-'); if ($slug.Length -gt 40) { $slug = $slug.Substring(0,40).Trim('-') } }
if ($label -and $label -ne '-') { $slug = if ($slug) { "$label-$slug" } else { $label } }
if ($cefTitle) { $cefTitle = $cefTitle -replace "'[^' ]+\.svg ", "'"; if ($cefTitle -match "'(.+)'") { $s2 = ($matches[1].ToLower() -replace "[^a-z0-9]+", '-').Trim('-'); if ($s2.Length -gt 40) { $s2 = $s2.Substring(0,40).Trim('-') }; $slug = if ($label -and $label -ne '-') { "$label-$s2" } else { $s2 } } }
$slug = $slug -replace 'icn-[a-z0-9-]+?-svg-?',''; if (-not $slug) { $slug = 'screen' }
$base = "{0}\{1:D3}-{2}" -f $dir, $n, $slug
Move-Item "$tmp.txt" "$base.txt" -Force
& "$S\tt.ps1" shot "$base.png" | Out-Null
"== $base"
$i = [Array]::FindIndex($lines, [Predicate[string]]{ param($l) $l -match '#subTab' })
$j = [Array]::FindIndex($lines, [Predicate[string]]{ param($l) $l -match '#scrollViewer' })
$k = [Array]::FindIndex($lines, [Predicate[string]]{ param($l) $l -match '#sideBar' })
$refund = ($lines | Select-String "#_AmountText|#bannerText" | ForEach-Object { $_.Line.Trim() }) -join ' | '
"refund: $refund"
if ($i -ge 0) { ($lines[($i+1)..([Math]::Min($i+12,$lines.Count-1))] | Where-Object { $_ -match 'ListItem' } | ForEach-Object { $_.Trim() }) -join ' ; ' }
if ($j -ge 0) { $end = if ($k -gt $j) { $k - 1 } else { $lines.Count - 1 }; $lines[($j+1)..$end] | Where-Object { $_ -notmatch "^\s*\[(Image|Separator|ScrollBar|Thumb)\] ''" -and $_ -notmatch "^\s*\[Text\] '(Back|Continue|Yes|No|Done)'$" } | Select-Object -First 120 }
$lines | Select-String "#(dialog|Dialog|MessageBox)|\[Window\]" | Select-Object -First 5


if ($ms) { $prev = ''; foreach ($l in $ms) { $x = $l.Trim(); if ($x -match "^\[text\] '(.*)'$" -and $prev -like "*$($matches[1])*") { continue }; $l; $prev = $x } }







