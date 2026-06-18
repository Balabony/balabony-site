# ============================================================
#  Balabony :: прибрати "ВПО" з Footer.tsx
#  Узгодження сайту з договором Дія (пільга лише УБД + інвалідність)
#  Запускати з КОРЕНЯ репо:  C:\Users\Bogdan\balabony-site
# ============================================================

$ErrorActionPreference = "Stop"

# 1. Знайти Footer.tsx у репо (сам)
$footer = Get-ChildItem -Recurse -Filter "Footer.tsx" -ErrorAction SilentlyContinue |
          Where-Object { $_.FullName -notmatch "node_modules" } |
          Select-Object -First 1

if (-not $footer) {
    Write-Host "ПОМИЛКА: Footer.tsx не знайдено. Запусти скрипт із кореня репо." -ForegroundColor Red
    exit 1
}

$path = $footer.FullName
Write-Host "Знайдено файл:" $path -ForegroundColor Cyan

# 2. Прочитати
$txt = Get-Content $path -Raw -Encoding UTF8
$before = $txt

# 3. Заміна 1 (короткий блок "Інклюзивність")
$txt = $txt.Replace(
  'ВПО, ветерани (УБД) та люди з інвалідністю: повний доступ за 1 ₴.',
  'Ветерани (УБД) та люди з інвалідністю: пільговий доступ за 1 ₴.'
)

# 4. Заміна 2 (довгий абзац про партнерство)
$txt = $txt.Replace(
  'Безкоштовний доступ для дітей ВПО, ветеранів (УБД) та людей з інвалідністю забезпечується',
  'Пільговий доступ для ветеранів (УБД) та людей з інвалідністю забезпечується'
)

# 5. Перевірка, чи щось змінилось
if ($txt -eq $before) {
    Write-Host "УВАГА: жодної заміни не зроблено. Можливо, текст уже виправлений або відрізняється." -ForegroundColor Yellow
} else {
    Set-Content $path -Value $txt -Encoding UTF8 -NoNewline
    Write-Host "Заміни застосовано й файл збережено." -ForegroundColor Green
}

# 6. Контроль: чи лишилось "ВПО"
Write-Host ""
Write-Host "Перевірка решток 'ВПО' у Footer.tsx:" -ForegroundColor Cyan
$rest = Select-String -Path $path -Pattern "ВПО"
if ($rest) {
    $rest | ForEach-Object { Write-Host ("  рядок " + $_.LineNumber + ": " + $_.Line.Trim()) -ForegroundColor Yellow }
    Write-Host "  ^ Якщо вище є рядки — їх треба глянути вручну." -ForegroundColor Yellow
} else {
    Write-Host "  Чисто. 'ВПО' у Footer.tsx більше немає." -ForegroundColor Green
}

Write-Host ""
Write-Host "Далі:  git add -A ; git commit -m 'Прибрано ВПО (узгодження з договором Дія)' ; git push" -ForegroundColor Cyan
