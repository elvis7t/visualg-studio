Add-Type -AssemblyName System.Drawing

$Root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$Resources = Join-Path $Root "resources"

function New-IconBitmap {
  param([int]$Size)

  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $scale = $Size / 1024.0
  function S([float]$Value) { return [float]($Value * $scale) }

  $cardRect = New-Object System.Drawing.RectangleF (S 70), (S 70), (S 884), (S 884)
  $cardPath = New-RoundedRectPath $cardRect (S 170)
  $cardBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $cardRect, ([System.Drawing.Color]::FromArgb(255, 29, 22, 58)), ([System.Drawing.Color]::FromArgb(255, 6, 27, 45)), 135
  $graphics.FillPath($cardBrush, $cardPath)

  $borderRect = New-Object System.Drawing.RectangleF (S 86), (S 86), (S 852), (S 852)
  $borderPath = New-RoundedRectPath $borderRect (S 154)
  $borderBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $borderRect, ([System.Drawing.Color]::FromArgb(255, 124, 60, 255)), ([System.Drawing.Color]::FromArgb(255, 0, 212, 255)), 135
  $borderPen = New-Object System.Drawing.Pen $borderBrush, (S 30)
  $graphics.DrawPath($borderPen, $borderPath)

  $cyanBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (New-Object System.Drawing.RectangleF (S 170), (S 360), (S 684), (S 300)), ([System.Drawing.Color]::FromArgb(255, 34, 240, 255)), ([System.Drawing.Color]::FromArgb(255, 0, 164, 255)), 0
  $cyanPen = New-Object System.Drawing.Pen $cyanBrush, (S 70)
  $cyanPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $cyanPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $cyanPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $graphics.DrawLine($cyanPen, (S 230), (S 512), (S 334), (S 408))
  $graphics.DrawLine($cyanPen, (S 230), (S 512), (S 334), (S 616))
  $graphics.DrawLine($cyanPen, (S 794), (S 512), (S 690), (S 408))
  $graphics.DrawLine($cyanPen, (S 794), (S 512), (S 690), (S 616))

  $vPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $vPoints = @(
    (New-PointF (S 386) (S 318)),
    (New-PointF (S 500) (S 318)),
    (New-PointF (S 568) (S 593)),
    (New-PointF (S 688) (S 318)),
    (New-PointF (S 806) (S 318)),
    (New-PointF (S 632) (S 704)),
    (New-PointF (S 512) (S 792)),
    (New-PointF (S 392) (S 704)),
    (New-PointF (S 286) (S 454))
  )
  $vPath.AddPolygon($vPoints)
  $vBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (New-Object System.Drawing.RectangleF (S 286), (S 318), (S 520), (S 474)), ([System.Drawing.Color]::FromArgb(255, 240, 102, 255)), ([System.Drawing.Color]::FromArgb(255, 108, 52, 232)), 90
  $graphics.FillPath($vBrush, $vPath)

  $highlightPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $highlightPoints = @(
    (New-PointF (S 406) (S 350)),
    (New-PointF (S 478) (S 350)),
    (New-PointF (S 550) (S 628)),
    (New-PointF (S 600) (S 628)),
    (New-PointF (S 718) (S 350)),
    (New-PointF (S 760) (S 350)),
    (New-PointF (S 615) (S 690)),
    (New-PointF (S 516) (S 760)),
    (New-PointF (S 420) (S 690)),
    (New-PointF (S 320) (S 456))
  )
  $highlightPath.AddPolygon($highlightPoints)
  $highlightBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(42, 255, 255, 255))
  $graphics.FillPath($highlightBrush, $highlightPath)

  $dotOuterBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 33, 20, 69))
  $dotPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 189, 147, 249)), (S 10)
  $graphics.FillEllipse($dotOuterBrush, (S 450), (S 776), (S 124), (S 124))
  $graphics.DrawEllipse($dotPen, (S 450), (S 776), (S 124), (S 124))
  $dotBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 54, 242, 255))
  $graphics.FillEllipse($dotBrush, (S 488), (S 814), (S 48), (S 48))

  $graphics.Dispose()
  return $bitmap
}

function New-PointF {
  param([float]$X, [float]$Y)
  return New-Object System.Drawing.PointF $X, $Y
}

function New-RoundedRectPath {
  param([System.Drawing.RectangleF]$Rect, [float]$Radius)

  $diameter = $Radius * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($Rect.X, $Rect.Y, $diameter, $diameter, 180, 90)
  $path.AddArc($Rect.Right - $diameter, $Rect.Y, $diameter, $diameter, 270, 90)
  $path.AddArc($Rect.Right - $diameter, $Rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($Rect.X, $Rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Convert-BitmapToPngBytes {
  param([System.Drawing.Bitmap]$Bitmap)
  $stream = New-Object System.IO.MemoryStream
  $Bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
  return $stream.ToArray()
}

function Write-Png {
  param([int]$Size, [string]$Path)
  $bitmap = New-IconBitmap $Size
  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

function New-IcoBytes {
  param([int[]]$Sizes)

  $pngs = New-Object System.Collections.ArrayList
  foreach ($size in $Sizes) {
    $bitmap = New-IconBitmap $size
    [void]$pngs.Add([pscustomobject]@{ Size = $size; Bytes = [byte[]](Convert-BitmapToPngBytes $bitmap) })
    $bitmap.Dispose()
  }

  $stream = New-Object System.IO.MemoryStream
  $writer = New-Object System.IO.BinaryWriter $stream
  $writer.Write([uint16]0)
  $writer.Write([uint16]1)
  $writer.Write([uint16]$pngs.Count)

  $offset = 6 + ($pngs.Count * 16)
  foreach ($png in $pngs) {
    $dimension = $png.Size
    if ($dimension -eq 256) {
      $dimension = 0
    }
    $writer.Write([byte]$dimension)
    $writer.Write([byte]$dimension)
    $writer.Write([byte]0)
    $writer.Write([byte]0)
    $writer.Write([uint16]1)
    $writer.Write([uint16]32)
    $writer.Write([uint32]$png.Bytes.Length)
    $writer.Write([uint32]$offset)
    $offset += $png.Bytes.Length
  }

  foreach ($png in $pngs) {
    $writer.Write($png.Bytes)
  }

  $writer.Flush()
  return $stream.ToArray()
}

Write-Png 1024 (Join-Path $Resources "icon.png")
Write-Png 256 (Join-Path $Resources "icon-256.png")
[System.IO.File]::WriteAllBytes((Join-Path $Resources "icon.ico"), (New-IcoBytes @(16, 24, 32, 48, 64, 128, 256)))
