# ZhongKao Mentor - PNG Asset Generator
# Run this script in PowerShell to generate all required PNG files
# Usage: Right-click -> "Run with PowerShell" or: powershell -ExecutionPolicy Bypass -File generate_assets.ps1

Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$themeGreen = [System.Drawing.Color]::FromArgb(255, 76, 175, 80)
$themeGreenDark = [System.Drawing.Color]::FromArgb(255, 56, 142, 60)
$themeGreenLight = [System.Drawing.Color]::FromArgb(255, 102, 187, 106)
$white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
$gold = [System.Drawing.Color]::FromArgb(255, 255, 215, 0)
$transparent = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)

function Draw-Star {
    param([System.Drawing.Graphics]$g, [float]$cx, [float]$cy, [int]$spikes, [float]$outerR, [float]$innerR, [System.Drawing.Brush]$brush)

    $points = @()
    $rot = -[Math]::PI / 2
    $step = [Math]::PI / $spikes

    for ($i = 0; $i -lt $spikes * 2; $i++) {
        $r = if ($i % 2 -eq 0) { $outerR } else { $innerR }
        $x = $cx + [Math]::Cos($rot) * $r
        $y = $cy + [Math]::Sin($rot) * $r
        $points += [System.Drawing.PointF]::new($x, $y)
        $rot += $step
    }

    $g.FillPolygon($brush, $points)
}

function Draw-IconContent {
    param([System.Drawing.Graphics]$g, [int]$w, [int]$h, [bool]$isAdaptive = $false)

    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

    # Rounded rectangle background
    $radius = [int]($w * 0.22)
    $margin = [int]($w * 0.02)

    # Create gradient brush for background
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $rect = [System.Drawing.Rectangle]::new($margin, $margin, $w - 2*$margin, $h - 2*$margin)
    $path.AddArc($rect.X, $rect.Y, $radius * 2, $radius * 2, 180, 90)
    $path.AddArc($rect.Right - $radius * 2, $rect.Y, $radius * 2, $radius * 2, 270, 90)
    $path.AddArc($rect.Right - $radius * 2, $rect.Bottom - $radius * 2, $radius * 2, $radius * 2, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $radius * 2, $radius * 2, $radius * 2, 90, 90)
    $path.CloseFigure()

    $gradientBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.Point]::new(0, 0),
        [System.Drawing.Point]::new($w, $h),
        $themeGreenLight, $themeGreenDark
    )
    $g.FillPath($gradientBrush, $path)

    # Book
    $bookW = [int]($w * 0.45)
    $bookH = [int]($h * 0.30)
    $bookX = [int](($w - $bookW) / 2)
    $bookY = [int]($h * 0.25)
    $bookRadius = [int]($w * 0.015)

    # Book shadow
    $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 0, 0, 0))
    $g.FillRoundedRectangle($shadowBrush, $bookX + 6, $bookY + 6, $bookW, $bookH, $bookRadius)

    # Book body
    $g.FillRoundedRectangle([System.Drawing.SolidBrush]::new($white), $bookX, $bookY, $bookW, $bookH, $bookRadius)

    # Book spine
    $spineBrush = [System.Drawing.SolidBrush]::new($themeGreen)
    $spineWidth = [int]($bookW * 0.06)
    $g.FillRectangle($spineBrush, $bookX, $bookY, $spineWidth, $bookH)

    # Book lines
    $linePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(100, 165, 214, 167), [Math]::Max(2, $w * 0.005))
    for ($i = 1; $i -le 4; $i++) {
        $lineY = $bookY + [int]($bookH * (0.20 + $i * 0.15))
        $lineStartX = $bookX + [int]($bookW * 0.15)
        $lineEndX = $bookX + [int]($bookW * 0.80)
        $g.DrawLine($linePen, $lineStartX, $lineY, $lineEndX, $lineY)
    }

    # Stars
    $goldBrush = [System.Drawing.SolidBrush]::new($gold)
    Draw-Star $g ([int]($w * 0.72)) ([int]($h * 0.18)) 5 ([int]($w * 0.12)) ([int]($w * 0.05)) $goldBrush
    Draw-Star $g ([int]($w * 0.25)) ([int]($h * 0.15)) 5 ([int]($w * 0.07)) ([int]($w * 0.03)) $goldBrush

    # Text "私人导师"
    $textFont = $null
    $fontSize = [int]($w * 0.10)
    try {
        $textFont = New-Object System.Drawing.Font("Microsoft YaHei", $fontSize, [System.Drawing.FontStyle]::Bold)
    } catch {
        try {
            $textFont = New-Object System.Drawing.Font("SimHei", $fontSize, [System.Drawing.FontStyle]::Bold)
        } catch {
            $textFont = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
        }
    }
    $textBrush = [System.Drawing.SolidBrush]::new($white)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString("私人导师", $textFont, $textBrush, [int]($w / 2), [int]($h * 0.75), $sf)

    # Subtitle
    $subFontSize = [int]($w * 0.05)
    try {
        $subFont = New-Object System.Drawing.Font("Microsoft YaHei", $subFontSize, [System.Drawing.FontStyle]::Regular)
    } catch {
        $subFont = New-Object System.Drawing.Font("Arial", $subFontSize, [System.Drawing.FontStyle]::Regular)
    }
    $subBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(220, 255, 255, 255))
    $g.DrawString("科学育娃 精准提分", $subFont, $subBrush, [int]($w / 2), [int]($h * 0.87), $sf)

    # Cleanup
    $gradientBrush.Dispose()
    $shadowBrush.Dispose()
    $spineBrush.Dispose()
    $linePen.Dispose()
    $goldBrush.Dispose()
    $textBrush.Dispose()
    $subBrush.Dispose()
    $textFont.Dispose()
    $subFont.Dispose()
    $sf.Dispose()
    $path.Dispose()
}

function Draw-SplashContent {
    param([System.Drawing.Graphics]$g, [int]$w, [int]$h)

    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

    # Gradient background
    $gradientBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.Point]::new(0, 0),
        [System.Drawing.Point]::new(0, $h),
        $themeGreenLight, $themeGreenDark
    )
    $g.FillRectangle($gradientBrush, 0, 0, $w, $h)

    # Subtle decorative circles
    $circleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 255, 255, 255))
    $g.FillEllipse($circleBrush, -200, -200, 800, 800)
    $g.FillEllipse($circleBrush, [int]($w * 0.5), [int]($h * 0.4), 600, 600)
    $g.FillEllipse($circleBrush, [int]($w * 0.2), [int]($h * 0.7), 500, 500)

    # Book in center
    $bookW = [int]($w * 0.30)
    $bookH = [int]($h * 0.08)
    $bookX = [int](($w - $bookW) / 2)
    $bookY = [int]($h * 0.33)
    $bookRadius = [int]($w * 0.012)

    $g.FillRoundedRectangle([System.Drawing.SolidBrush]::new($white), $bookX, $bookY, $bookW, $bookH, $bookRadius)

    # Book spine
    $spineWidth = [int]($bookW * 0.06)
    $g.FillRectangle([System.Drawing.SolidBrush]::new($themeGreen), $bookX, $bookY, $spineWidth, $bookH)

    # Book lines
    $linePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(80, 76, 175, 80), [Math]::Max(2, $w * 0.004))
    for ($i = 1; $i -le 3; $i++) {
        $lineY = $bookY + [int]($bookH * (0.25 + $i * 0.20))
        $g.DrawLine($linePen, $bookX + [int]($bookW * 0.12), $lineY, $bookX + [int]($bookW * 0.85), $lineY)
    }

    # Stars
    $goldBrush = [System.Drawing.SolidBrush]::new($gold)
    Draw-Star $g ([int]($w * 0.65)) ([int]($h * 0.28)) 5 ([int]($w * 0.08)) ([int]($w * 0.035)) $goldBrush
    Draw-Star $g ([int]($w * 0.35)) ([int]($h * 0.26)) 5 ([int]($w * 0.05)) ([int]($w * 0.02)) $goldBrush

    # Title "私人导师"
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $titleSize = [int]($w * 0.10)
    try { $titleFont = New-Object System.Drawing.Font("Microsoft YaHei", $titleSize, [System.Drawing.FontStyle]::Bold) }
    catch { $titleFont = New-Object System.Drawing.Font("SimHei", $titleSize, [System.Drawing.FontStyle]::Bold) }
    $g.DrawString("私人导师", $titleFont, [System.Drawing.SolidBrush]::new($white), [int]($w / 2), [int]($h * 0.52), $sf)

    # Subtitle
    $subSize = [int]($w * 0.045)
    try { $subFont = New-Object System.Drawing.Font("Microsoft YaHei", $subSize, [System.Drawing.FontStyle]::Regular) }
    catch { $subFont = New-Object System.Drawing.Font("Arial", $subSize, [System.Drawing.FontStyle]::Regular) }
    $g.DrawString("科学育娃，精准提分", $subFont, [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(230, 255, 255, 255)), [int]($w / 2), [int]($h * 0.58), $sf)

    # Bottom decorative line
    $linePen2 = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(80, 255, 255, 255), 2)
    $g.DrawLine($linePen2, [int]($w * 0.2), [int]($h * 0.88), [int]($w * 0.8), [int]($h * 0.88))

    # Version text
    $verSize = [int]($w * 0.025)
    $verFont = New-Object System.Drawing.Font("Arial", $verSize)
    $g.DrawString("v1.0.0", $verFont, [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(128, 255, 255, 255)), [int]($w / 2), [int]($h * 0.92), $sf)

    # Cleanup
    $gradientBrush.Dispose()
    $circleBrush.Dispose()
    $linePen.Dispose()
    $goldBrush.Dispose()
    $titleFont.Dispose()
    $subFont.Dispose()
    $verFont.Dispose()
    $linePen2.Dispose()
    $sf.Dispose()
}

# Extension method for rounded rectangles
Add-Type @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;

public static class GraphicsExtensions {
    public static void FillRoundedRectangle(this Graphics g, Brush brush, int x, int y, int w, int h, int radius) {
        using (GraphicsPath path = new GraphicsPath()) {
            int d = radius * 2;
            path.AddArc(x, y, d, d, 180, 90);
            path.AddArc(x + w - d, y, d, d, 270, 90);
            path.AddArc(x + w - d, y + h - d, d, d, 0, 90);
            path.AddArc(x, y + h - d, d, d, 90, 90);
            path.CloseFigure();
            g.FillPath(brush, path);
        }
    }
}
"@ -ReferencedAssemblies System.Drawing

Write-Host "============================================" -ForegroundColor Green
Write-Host "  ZhongKao Mentor - PNG Asset Generator" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# 1. icon.png - 1024x1024
Write-Host "[1/4] Generating icon.png (1024x1024)..." -ForegroundColor Cyan
$bmp = New-Object System.Drawing.Bitmap(1024, 1024)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear($transparent)
Draw-IconContent $g 1024 1024
$g.Dispose()
$bmp.Save((Join-Path $scriptDir "icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$fi = Get-Item (Join-Path $scriptDir "icon.png")
Write-Host "  Done: icon.png ($($fi.Length) bytes)" -ForegroundColor Green

# 2. splash.png - 1284x2778
Write-Host "[2/4] Generating splash.png (1284x2778)..." -ForegroundColor Cyan
$bmp = New-Object System.Drawing.Bitmap(1284, 2778)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear($themeGreen)
Draw-SplashContent $g 1284 2778
$g.Dispose()
$bmp.Save((Join-Path $scriptDir "splash.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$fi = Get-Item (Join-Path $scriptDir "splash.png")
Write-Host "  Done: splash.png ($($fi.Length) bytes)" -ForegroundColor Green

# 3. adaptive-icon.png - 1024x1024
Write-Host "[3/4] Generating adaptive-icon.png (1024x1024)..." -ForegroundColor Cyan
$bmp = New-Object System.Drawing.Bitmap(1024, 1024)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear($transparent)
Draw-IconContent $g 1024 1024 $true
$g.Dispose()
$bmp.Save((Join-Path $scriptDir "adaptive-icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$fi = Get-Item (Join-Path $scriptDir "adaptive-icon.png")
Write-Host "  Done: adaptive-icon.png ($($fi.Length) bytes)" -ForegroundColor Green

# 4. favicon.png - 48x48
Write-Host "[4/4] Generating favicon.png (48x48)..." -ForegroundColor Cyan
$bmp = New-Object System.Drawing.Bitmap(48, 48)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear($transparent)

# Simple favicon: green rounded rect with white book and gold star
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$rect = [System.Drawing.Rectangle]::new(2, 2, 44, 44)
$path.AddArc($rect.X, $rect.Y, 16, 16, 180, 90)
$path.AddArc($rect.Right - 16, $rect.Y, 16, 16, 270, 90)
$path.AddArc($rect.Right - 16, $rect.Bottom - 16, 16, 16, 0, 90)
$path.AddArc($rect.X, $rect.Bottom - 16, 16, 16, 90, 90)
$path.CloseFigure()
$g.FillPath([System.Drawing.SolidBrush]::new($themeGreen), $path)

# Book
$g.FillRectangle([System.Drawing.SolidBrush]::new($white), 14, 16, 22, 16)
$g.FillRectangle([System.Drawing.SolidBrush]::new($themeGreen), 14, 16, 3, 16)

# Star
Draw-Star $g 36 12 5 6 3 ([System.Drawing.SolidBrush]::new($gold))

$g.Dispose()
$bmp.Save((Join-Path $scriptDir "favicon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$fi = Get-Item (Join-Path $scriptDir "favicon.png")
Write-Host "  Done: favicon.png ($($fi.Length) bytes)" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  All files generated successfully!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Summary
$files = @("icon.png", "splash.png", "adaptive-icon.png", "favicon.png")
foreach ($f in $files) {
    $fi = Get-Item (Join-Path $scriptDir $f)
    $sizeKB = [math]::Round($fi.Length / 1024, 1)
    Write-Host "  $f - $sizeKB KB" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
