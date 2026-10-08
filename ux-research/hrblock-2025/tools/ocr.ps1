# OCR a PNG (optionally a crop rect x,y,w,h) with the built-in Windows.Media.Ocr engine. Prints lines.
param([Parameter(Mandatory=$true)][string]$Png, [string]$CropS)
$Crop = if ($CropS) { $CropS.Split(",") | ForEach-Object { [int]$_ } } else { $null }
Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType = WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, [Type]$t) { $task = $asTask.MakeGenericMethod($t).Invoke($null, @($op)); $task.Wait(-1) | Out-Null; $task.Result }
$src = $Png
if ($Crop) {
  $bmp = [System.Drawing.Bitmap]::FromFile($Png)
  $rect = New-Object System.Drawing.Rectangle $Crop[0], $Crop[1], $Crop[2], $Crop[3]
  $c = $bmp.Clone($rect, $bmp.PixelFormat)
  # upscale 2x for better OCR of small text
  $big = New-Object System.Drawing.Bitmap ($Crop[2]*2), ($Crop[3]*2)
  $g = [System.Drawing.Graphics]::FromImage($big); $g.InterpolationMode = 'HighQualityBicubic'; $g.DrawImage($c, 0, 0, $Crop[2]*2, $Crop[3]*2); $g.Dispose()
  $src = [System.IO.Path]::GetTempFileName() + '.png'; $big.Save($src, [System.Drawing.Imaging.ImageFormat]::Png)
  $big.Dispose(); $c.Dispose(); $bmp.Dispose()
}
$file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($src)) ([Windows.Storage.StorageFile])
$stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
$dec = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$sb = Await ($dec.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
$eng = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
$res = Await ($eng.RecognizeAsync($sb)) ([Windows.Media.Ocr.OcrResult])
$res.Lines | ForEach-Object { $_.Text }
$stream.Dispose()
