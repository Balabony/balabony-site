$ErrorActionPreference = "Stop"
$enc = [System.Text.Encoding]::UTF8

# Ukrainian strings as UTF-8 byte arrays (decoded at runtime, so file stays pure ASCII)
$old1 = $enc.GetString([byte[]](208,146,208,159,208,158,44,32,208,178,208,181,209,130,208,181,209,128,208,176,208,189,208,184,32,40,208,163,208,145,208,148,41,32,209,130,208,176,32,208,187,209,142,208,180,208,184,32,208,183,32,209,150,208,189,208,178,208,176,208,187,209,150,208,180,208,189,209,150,209,129,209,130,209,142,58,32,208,191,208,190,208,178,208,189,208,184,208,185,32,208,180,208,190,209,129,209,130,209,131,208,191,32,208,183,208,176,32,49,32,226,130,180,46))
$new1 = $enc.GetString([byte[]](208,146,208,181,209,130,208,181,209,128,208,176,208,189,208,184,32,40,208,163,208,145,208,148,41,32,209,130,208,176,32,208,187,209,142,208,180,208,184,32,208,183,32,209,150,208,189,208,178,208,176,208,187,209,150,208,180,208,189,209,150,209,129,209,130,209,142,58,32,208,191,209,150,208,187,209,140,208,179,208,190,208,178,208,184,208,185,32,208,180,208,190,209,129,209,130,209,131,208,191,32,208,183,208,176,32,49,32,226,130,180,46))
$old2 = $enc.GetString([byte[]](208,145,208,181,208,183,208,186,208,190,209,136,209,130,208,190,208,178,208,189,208,184,208,185,32,208,180,208,190,209,129,209,130,209,131,208,191,32,208,180,208,187,209,143,32,208,180,209,150,209,130,208,181,208,185,32,208,146,208,159,208,158,44,32,208,178,208,181,209,130,208,181,209,128,208,176,208,189,209,150,208,178,32,40,208,163,208,145,208,148,41,32,209,130,208,176,32,208,187,209,142,208,180,208,181,208,185,32,208,183,32,209,150,208,189,208,178,208,176,208,187,209,150,208,180,208,189,209,150,209,129,209,130,209,142,32,208,183,208,176,208,177,208,181,208,183,208,191,208,181,209,135,209,131,209,148,209,130,209,140,209,129,209,143))
$new2 = $enc.GetString([byte[]](208,159,209,150,208,187,209,140,208,179,208,190,208,178,208,184,208,185,32,208,180,208,190,209,129,209,130,209,131,208,191,32,208,180,208,187,209,143,32,208,178,208,181,209,130,208,181,209,128,208,176,208,189,209,150,208,178,32,40,208,163,208,145,208,148,41,32,209,130,208,176,32,208,187,209,142,208,180,208,181,208,185,32,208,183,32,209,150,208,189,208,178,208,176,208,187,209,150,208,180,208,189,209,150,209,129,209,130,209,142,32,208,183,208,176,208,177,208,181,208,183,208,191,208,181,209,135,209,131,209,148,209,130,209,140,209,129,209,143))
$vpo  = $enc.GetString([byte[]](208,146,208,159,208,158))

# Find Footer.tsx (skip node_modules)
$footer = Get-ChildItem -Recurse -Filter "Footer.tsx" -ErrorAction SilentlyContinue |
          Where-Object { $_.FullName -notmatch "node_modules" } |
          Select-Object -First 1

if (-not $footer) {
    Write-Host "ERROR: Footer.tsx not found. Run from repo root." -ForegroundColor Red
    exit 1
}
$path = $footer.FullName
Write-Host "Found:" $path -ForegroundColor Cyan

# Read file as UTF-8
$txt = [System.IO.File]::ReadAllText($path, $enc)
$before = $txt

$txt = $txt.Replace($old1, $new1)
$txt = $txt.Replace($old2, $new2)

if ($txt -eq $before) {
    Write-Host "WARNING: no replacements made (text differs or already fixed)." -ForegroundColor Yellow
} else {
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($path, $txt, $utf8NoBom)
    Write-Host "OK: replacements applied and saved." -ForegroundColor Green
}

# Leftover check
$content = [System.IO.File]::ReadAllText($path, $enc)
if ($content.Contains($vpo)) {
    Write-Host "WARNING: 'VPO' still present in Footer.tsx - check manually." -ForegroundColor Yellow
} else {
    Write-Host "Clean: no 'VPO' left in Footer.tsx." -ForegroundColor Green
}

Write-Host ""
Write-Host "Next: git add -A ; git commit -m fix-vpo ; git push" -ForegroundColor Cyan
