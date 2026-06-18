$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.Encoding]::UTF8

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

# Read as UTF-8 explicitly
$txt = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
$before = $txt

# --- Replacement strings stored as UTF-8 byte arrays decoded at runtime ---
$old1 = "ВПО, ветерани (УБД) та люди з інвалідністю: повний доступ за 1 ₴."
$new1 = "Ветерани (УБД) та люди з інвалідністю: пільговий доступ за 1 ₴."

$old2 = "Безкоштовний доступ для дітей ВПО, ветеранів (УБД) та людей з інвалідністю забезпечується"
$new2 = "Пільговий доступ для ветеранів (УБД) та людей з інвалідністю забезпечується"

$txt = $txt.Replace($old1, $new1)
$txt = $txt.Replace($old2, $new2)

if ($txt -eq $before) {
    Write-Host "WARNING: no replacements made. Text may differ or be already fixed." -ForegroundColor Yellow
} else {
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($path, $txt, $utf8NoBom)
    Write-Host "OK: replacements applied and file saved." -ForegroundColor Green
}

# Check leftover VPO
Write-Host ""
$rest = Select-String -Path $path -Pattern ([char]0x0412 + [char]0x041F + [char]0x041E)  # VPO in cyrillic
if ($rest) {
    Write-Host "Leftover VPO found:" -ForegroundColor Yellow
    $rest | ForEach-Object { Write-Host ("  line " + $_.LineNumber) -ForegroundColor Yellow }
} else {
    Write-Host "Clean: no VPO left in Footer.tsx." -ForegroundColor Green
}

Write-Host ""
Write-Host "Next: git add -A ; git commit -m fix-vpo ; git push" -ForegroundColor Cyan
