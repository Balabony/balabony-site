# ============================================================
#  Balabony — встановлення шахів (фігури Staunty + золото-сіра дошка)
#  Запускати з кореня репозиторію:  C:\Users\Bogdan\balabony-site
#  Подвійний клік не спрацює — відкрий PowerShell у цій теці й:  .\install-chess.ps1
# ============================================================
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)   # UTF-8 без BOM
function WriteFile($rel, $content) {
  $full = Join-Path (Get-Location) $rel
  $dir = Split-Path $full -Parent
  if (!(Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  [System.IO.File]::WriteAllText($full, $content, $utf8)
  Write-Host "  + $rel"
}

if (!(Test-Path 'app\games')) { Write-Host 'ПОМИЛКА: запусти скрипт із кореня репозиторію (там, де тека app).' -ForegroundColor Red; exit 1 }
Write-Host 'Створюю фігури та сторінку гри...' -ForegroundColor Cyan

WriteFile 'public\chess\wK.svg' @'
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill-rule="evenodd" clip-rule="evenodd" image-rendering="optimizeQuality" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" viewBox="0 1.5 50 50"><defs><linearGradient href="#a" id="b" x1="-505.97" x2="-484.22" y1="-408.5" y2="-408.5" gradientTransform="matrix(1.0113 0 0 1.0008 536.22 433.79)" gradientUnits="userSpaceOnUse"/><linearGradient id="a" x1="9.241" x2="40.761" y1="27.266" y2="27.266" gradientTransform="matrix(.98495 0 0 .98605 .376 .641)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffffff"/></linearGradient><linearGradient href="#a" id="c" x1="-520.15" x2="-490.84" y1="-394.44" y2="-394.44" gradientTransform="matrix(1.0113 0 0 1.0008 536.22 433.79)" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="d" x1="-526.74" x2="-504.98" y1="-408.5" y2="-408.5" gradientTransform="matrix(1.0113 0 0 1.0008 536.22 433.79)" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="f" x1="-510.08" x2="-500.85" y1="-412.72" y2="-412.72" gradientTransform="matrix(1.0113 0 0 1.0008 536.22 433.79)" gradientUnits="userSpaceOnUse"/><filter id="e" width="1.169" height="1.067" x="-.085" y="-.033" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".392"/></filter><filter id="g" width="1.205" height="1.063" x="-.102" y="-.031" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".172"/></filter><filter id="h" width="1.117" height="1.081" x="-.058" y="-.041" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".258"/></filter></defs><path fill="url(#b)" stroke="#000" d="M29.132 18.792c6.387-5.74 17.544-2.606 16.851 6.813-.679 6.17-7.013 8.347-7.013 8.347s-3.827-2.228-13.94-2.228l-.014-3.993z"/><path fill="url(#c)" stroke="#000" d="m37.942 38.831 1.304 5.276S35.468 46.335 25 46.335s-14.247-2.228-14.247-2.228l1.304-5.276-.996-4.878s3.645-2.229 13.94-2.229c10.296 0 13.94 2.228 13.94 2.228z"/><path fill="none" stroke="#000" d="M10.754 44.106s3.779-2.228 14.248-2.228 14.248 2.228 14.248 2.228m-27.192-5.275s3.394-2.228 12.978-2.228 12.977 2.228 12.977 2.228"/><path fill="url(#d)" stroke="#000" d="M20.9 18.792c-6.387-5.74-17.544-2.606-16.851 6.813.679 6.17 7.013 8.347 7.013 8.347s3.827-2.228 13.94-2.228l.014-3.993z"/><path fill="#59917a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" d="M21.65 9.911h6.733M25.016 6.33v7.98"/><path d="M-494.08-417.53a11.67 11.67 0 0 0-1.732.146c9.088-.224 13.443 11.958 1.394 16.485l-1.272 4.958 1.526 5.482 2.961 1.105-1.489-5.469.987-5.207s6.273-1.781 6.934-7.82c.506-4.624-2.547-9.727-9.309-9.68" filter="url(#e)" opacity=".15" style="mix-blend-mode:normal" transform="matrix(1.0113 0 0 1.0008 536.22 433.79)"/><path fill="url(#f)" stroke="#000" stroke-linejoin="round" d="m20.9 18.792 4.13 8.653 4.13-8.653s.702-4.768-4.13-4.768c-4.833 0-4.13 4.768-4.13 4.768z"/><path d="M-505.48-419.2c4.757.97.867 10.52.016 13.186.024.025 3.078-5.404 4.02-8.913.09-4.504-3.867-4.392-4.036-4.273" filter="url(#g)" opacity=".15" style="mix-blend-mode:normal" transform="matrix(1.0113 0 0 1.0008 536.22 433.79)"/><path d="M-505.49-402.26v-.075l.015-3.396s-2.681-6.895-4.052-8.914c-1.333-1.963-3.778-2.93-6.565-2.784 3.972 1.765 8.937 10.029 10.602 15.169" filter="url(#h)" opacity=".15" style="mix-blend-mode:normal" transform="matrix(1.0113 0 0 1.0008 536.22 433.79)"/><path fill="#fff" d="M6.314 29.527c-1.196-1.647-2.01-3.85-1.445-6.636 1.436-7.074 9.457-6.296 9.457-6.296C2.73 20.063 6.454 29.557 6.314 29.527" opacity=".8"/><path fill="#fff" d="m23.57 23.025-2.114-4.402s-.69-4.12 3.54-4.056c-4.212 1.33-1.426 8.458-1.426 8.458m3.456 1.934 2.752-5.929s2.447-2.223 6.116-2.571c-3.947 1.032-6.33 4.875-8.868 8.5"/><path d="M25.318 41.924c-10.311 0-14.564 2.183-14.564 2.183s4.253 2.182 14.564 2.182h.021c-15.44-1.99 7.315-3.803 8.284-3.81-2.173-.317-4.917-.554-8.305-.554z" opacity=".15"/><path d="M25 46.296c-9.241 0-13.744-2.209-13.744-2.209S15.759 41.878 25 41.878s13.744 2.21 13.744 2.21S34.241 46.295 25 46.295z" opacity=".15"/><path fill="#fff" d="M12.528 39.169c.85-.45 1.729-.643 2.593-.962-.587.841-.634 2.724-.357 4.062 0 0-.892.125-3.232.905z" opacity=".7"/><path fill="#fff" d="M12.464 38.021s.3-.288 2.416-.877c-1.59-1.601-1.4-3.446-1.575-3.516-.566.168-1.111.39-1.65.628z" opacity=".8"/></svg>
'@
WriteFile 'public\chess\wQ.svg' @'
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill-rule="evenodd" clip-rule="evenodd" image-rendering="optimizeQuality" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" viewBox="0 1.5 50 50"><defs><linearGradient id="a" x1="9.241" x2="40.761" y1="27.266" y2="27.266" gradientTransform="matrix(.98495 0 0 .98605 .376 .641)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffffff"/></linearGradient><linearGradient href="#a" id="b" x1="-25.017" x2="14.084" y1="-249.82" y2="-249.82" gradientTransform="matrix(.99988 0 0 .97754 30.455 272.6)" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="c" x1="-27.911" x2="-21.13" y1="-264.3" y2="-264.3" gradientTransform="matrix(.99988 0 0 .97754 29.927 272.6)" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="e" x1="-18.928" x2="-12.147" y1="-267.53" y2="-267.53" gradientTransform="matrix(.99988 0 0 .97754 30.455 272.6)" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="f" x1="-8.857" x2="-2.076" y1="-268.55" y2="-268.55" gradientTransform="matrix(.99988 0 0 .97754 30.455 272.6)" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="g" x1="1.214" x2="7.995" y1="-267.53" y2="-267.53" gradientTransform="matrix(.99988 0 0 .97754 30.455 272.6)" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="h" x1="10.196" x2="16.978" y1="-264.3" y2="-264.3" gradientTransform="matrix(.99988 0 0 .97754 30.983 272.6)" gradientUnits="userSpaceOnUse"/><filter id="d" width="1.19" height="1.064" x="-.095" y="-.032" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".388"/></filter></defs><path fill="url(#b)" stroke="#000" stroke-linecap="round" stroke-width="1.001" d="m37.159 38.874 3.17-4.809 4.239-19.826-9.653 14.798.144-17.439-6.903 16.413-3.167-17.929-3.167 17.927-6.902-16.413.144 17.44-9.654-14.8 4.24 19.827 3.36 4.809-1.41 5.385s4.397 2.039 13.4 2.039c9.005 0 13.39-2.038 13.39-2.038z"/><path fill="none" stroke="#000" stroke-linecap="round" stroke-width="1.001" d="M9.747 34.064c1.347.18 1.645-.355 2.056-1.906 0 0 2.488 1.343 3.762 1.062 1.365-.301 2.474-2.172 2.474-2.172s2.113 1.559 3.38 1.454c1.475-.122 3.504-1.98 3.504-1.98s2.029 1.858 3.503 1.98c1.268.105 3.38-1.454 3.38-1.454s1.11 1.87 2.475 2.172c1.274.281 3.762-1.062 3.762-1.062.411 1.551.84 2.088 2.187 1.907"/><ellipse cx="5.41" cy="14.238" fill="url(#c)" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.001" rx="2.894" ry="2.799"/><path d="M13.559-262.78c-1.191 4.726-4.701 13.531-6.049 18.221l-3.738 4.819 1.08 4.99 3.08 1.16-1.227-5.51 2.961-4.677z" filter="url(#d)" opacity=".15" style="mix-blend-mode:normal" transform="matrix(.99988 0 0 .97754 30.455 272.6)"/><path d="M24.496 41.69c-4.835 0-9.67.857-12.894 2.57 3.226 1.714 8.068 1.746 12.908 1.745-11.917-1.877 1.961-3.693 6.74-3.726-2.135-.391-4.443-.589-6.753-.589z" opacity=".15"/><path fill="none" stroke="#000" stroke-width="1.001" d="M11.601 44.26s4.388-2.136 13.392-2.136 13.392 2.136 13.392 2.136m-25.528-5.386s3.666-2.04 12.151-2.04 12.151 2.04 12.151 2.04"/><ellipse cx="14.92" cy="11.08" fill="url(#e)" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.002" rx="2.894" ry="2.799"/><ellipse cx="24.989" cy="10.082" fill="url(#f)" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.002" rx="2.894" ry="2.799"/><ellipse cx="35.059" cy="11.082" fill="url(#g)" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.002" rx="2.894" ry="2.799"/><ellipse cx="44.568" cy="14.239" fill="url(#h)" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.002" rx="2.894" ry="2.799"/><path fill="#fff" d="m6.657 17.385 3.462 16.129s.794.057 1.273-2.295z" opacity=".8"/><path fill="#fff" d="m15.522 14.499 2.34 15.169c-.625 1.087-1.471 2-2.163 2.17zm6.464 16.528 3.027-17.612-.139 15.757c-1.066.913-2.15 1.858-2.888 1.855m12.473-16.422-6.78 16.182c.016-.092.467 1.394 3.83-1.244z" opacity=".9"/><path fill="#fff" d="m33.921 31.807 9.219-14.326-5.598 13.346s-3.153 1.734-3.621.98" opacity=".7"/><path fill="#fff" d="M4.184 16.16s-3.017-2.692.934-4.17c.088.013-1.833 2.155-.934 4.17m9.647-3.129s-3.018-2.692.934-4.17c.09 0-1.796 2.054-.934 4.17m10.018-1.025s-3.018-2.692.934-4.17c.059 0-1.927 2.09-.934 4.17m10.086.986s-3.018-2.692.934-4.17c.044-.004-1.919 2.093-.934 4.17m9.496 3.158s-3.018-2.692.934-4.17c.046.017-1.882 2.19-.934 4.17"/><path d="M24.993 46.396c-9.004 0-13.392-2.136-13.392-2.136s4.387-2.137 13.392-2.137c9.004 0 13.392 2.137 13.392 2.137s-4.388 2.136-13.392 2.136M6.771 12.412c.08.026 2.315 1.75-.147 3.864-.074-.124 1.162-2.001.147-3.864m9.565-3.166c.08.026 2.314 1.75-.148 3.863-.074-.124 1.162-2 .148-3.863m10.089-.97c.08.026 2.314 1.75-.148 3.864-.074-.124 1.162-2.001.148-3.864m10.09.992c.08.027 2.314 1.751-.148 3.864-.074-.124 1.162-2 .148-3.864m9.544 3.297c.08.026 2.314 1.75-.148 3.864-.074-.124 1.162-2.001.148-3.864" opacity=".15"/><path fill="#fff" d="M13.514 39.223c.848-.45 1.7-.66 2.571-.878-.587.84-.616 2.64-.34 3.978 0 0-.89.125-3.224.905z" opacity=".7"/><path fill="#fff" d="M13.146 38.084c.11-.016.33-.29 2.591-.951-2.014-1.585-3.55-4.075-3.55-4.075-.329.914-.773 1.514-1.415 1.58z" opacity=".8"/></svg>
'@
WriteFile 'public\chess\wR.svg' @'
<svg xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" image-rendering="optimizeQuality" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" viewBox="0 1.5 50 50"><defs><linearGradient id="a" x1="9.005" x2="40.995" y1="26.762" y2="26.762" gradientTransform="translate(0 1.029)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffffff"/></linearGradient><linearGradient id="c" x1="-36.133" x2="-9.938" y1="-313.97" y2="-313.97" gradientTransform="matrix(-1 0 0 1 1.964 333.28)" gradientUnits="userSpaceOnUse"><stop offset="0"/><stop offset="1" stop-opacity="0"/></linearGradient><filter id="b" width="1.223" height="1.061" x="-.112" y="-.03" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".463"/></filter></defs><path fill="url(#a)" stroke="#000" stroke-linecap="round" d="M12.973 41.57h24.121m-24.127-4.371h24.066m-20.061-4.052H33.03M17.062 21.53h15.879m-21.038-4.432h26.196m-26.196-7.81v7.81l5.158 4.433-.09 11.618-4.003 4.051v4.371H9.505v4.726h30.99V41.57h-3.462V37.2l-4.004-4.052-.09-11.618 5.159-4.433v-7.81h-5.593v3.347h-4.613V9.286h-5.783v3.348h-4.613V9.286z"/><path d="M46.199-268.38v7.725l-5.02 4.386.089 11.489 4.413 4.006v4.323h2.829v4.673h2.632v-4.673h-3.358v-4.322L43.9-244.78l-.088-11.492 5.002-4.383v-7.725z" filter="url(#b)" opacity=".15" style="mix-blend-mode:normal" transform="matrix(1.031 0 0 1.0112 -12.232 280.67)"/><path fill="#fff" d="m12.466 16.525-.041-6.675 3.328-.095-1.997.711v5.356l4.704.667zm5.13 5.506h7.58l-6.467 1v8.598l-1.161.922z" opacity=".8" style="mix-blend-mode:normal"/><path fill="#fff" d="m14.358 36.582 2.86-2.83h1.479l-2.4 2.83zm-.84 1.212.005 3.214h1.524l-.003-3.225zm-3.451 4.31h1.015v2.66l3.872.987h-4.887z" opacity=".7" style="mix-blend-mode:normal"/><path fill="#fff" d="m22.651 9.794-.017 2.433c.658-1.23 1.363-2.176 3.026-2.424z" opacity=".8" style="mix-blend-mode:normal"/><path fill="#fff" d="m33.051 9.807-.017 2.433c.388-1.52 1.111-2.39 3.026-2.425z" opacity=".7" style="mix-blend-mode:normal"/><path fill="url(#c)" d="M38.098 17.097H11.903l5.16 4.433H32.94z" opacity=".15"/></svg>
'@
WriteFile 'public\chess\wB.svg' @'
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill-rule="evenodd" clip-rule="evenodd" image-rendering="optimizeQuality" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" viewBox="0 0 50 50"><defs><linearGradient href="#a" id="b" x1="381.9" x2="387.68" y1="-386.04" y2="-386.02" gradientTransform="translate(.53)" gradientUnits="userSpaceOnUse"/><linearGradient id="a"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><linearGradient href="#a" id="c" x1="391.1" x2="393.27" y1="-401.61" y2="-401.61" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="d" x1="395.53" x2="401.31" y1="-387.49" y2="-387.49" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="e" x1="490.24" x2="511.24" y1="-382.24" y2="-382.24" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="f" x1="491.59" x2="499.17" y1="-377.43" y2="-377.43" gradientUnits="userSpaceOnUse"/></defs><g transform="translate(-368.06 412.37)"><path fill="#ffffff" stroke="#191919" stroke-linejoin="round" stroke-width="1.2" d="M393.07-404.07a2.66 2.503 0 0 0-2.659 2.504 2.66 2.503 0 0 0 1.063 2.001c-16.923 14.771-5.84 26.84-5.84 26.84h14.872s7.78-8.476.342-19.915l-5.546 7.742-2.995-2.144 6.215-8.674a38.64 38.64 0 0 0-3.856-3.85 2.66 2.503 0 0 0 1.063-2.001 2.66 2.503 0 0 0-2.659-2.504z"/><path fill="url(#b)" d="M386.47-373.35s-10.266-12.757 6.618-26.134c-4.083 5.062-10.216 13.857-1.513 26.129z"/><ellipse cx="392.19" cy="-401.61" fill="url(#c)" rx="1.083" ry="1.199" style="paint-order:markers fill stroke"/><path fill="url(#d)" d="M395.53-384.07c.094 0 5.262-7.413 5.262-7.413s.357.38.52.847l-5.02 7.144z"/><path fill-opacity=".902" stroke="#000" stroke-width=".265" d="M402.5-388.01c2.846 8.943-2.293 14.667-2.293 14.667h-3.391c2.263-.08 6.966-8.42 5.684-14.667z" opacity=".15"/><g transform="translate(-107.69 9.782)"><path fill="#ffffff" stroke="#191919" stroke-linejoin="round" stroke-width="1.2" d="m490.96-383.12-1.27.788v3.129l1.27.788h19.564l1.27-.788v-3.13l-1.27-.787h-9.782z"/><path fill="url(#e)" d="m511.24-381.97-20.994.009.884-.542 19.247-.015z"/><path d="m511.24-381.97-.008 2.404-.866.523-8.44-.01s2.95-.628 1.94-2.894c-.001-.004 5.277-.02 7.374-.023" opacity=".15"/><path fill="#ffffff" stroke="#191919" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2" d="M490.96-378.42v1.96h19.564v-1.96z" style="paint-order:normal"/><rect width="7.576" height=".709" x="491.59" y="-377.79" fill="url(#f)" ry="0" style="paint-order:markers fill stroke"/></g></g></svg>
'@
WriteFile 'public\chess\wN.svg' @'
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill-rule="evenodd" clip-rule="evenodd" image-rendering="optimizeQuality" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" viewBox="0 1.5 50 50"><defs><filter id="c" width="1.128" height="1.077" x="-.064" y="-.038" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".57"/></filter><filter id="e" width="1.469" height="1.834" x="-.234" y="-.417" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".299"/></filter><filter id="f" width="1.238" height="1.198" x="-.119" y="-.099" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".467"/></filter><filter id="g" width="1.089" height="1.104" x="-.045" y="-.052" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".073"/></filter><filter id="h" width="1.641" height="1.823" x="-.321" y="-.411" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="1.013"/></filter><filter id="i" width="1.479" height="1.139" x="-.239" y="-.07" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".279"/></filter><linearGradient id="a" x1="9.241" x2="40.761" y1="27.266" y2="27.266" gradientTransform="matrix(.98495 0 0 .98605 .376 .641)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffffff"/></linearGradient><linearGradient href="#a" id="b" x1="-736.5" x2="-696.5" y1="-367.96" y2="-367.96" gradientTransform="matrix(.99995 0 0 .99606 740.69 393.31)" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="d" x1="-116.32" x2="-77.199" y1="299.9" y2="299.9" gradientTransform="matrix(1.1045 0 0 1.0827 130.81 -314.94)" gradientUnits="userSpaceOnUse"/></defs><path fill="url(#b)" stroke="#000" stroke-dashoffset="1.852" stroke-linecap="round" d="M10.393 35.883c2.887 2.407 4.157-.702 5.178-3.053 1.398-3.953 7.128-1.826 8.733-6.795 2.83 11.085-9.865 8.393-9.264 20.26h28.386c1.913-22.102-5.002-37.42-25.957-35.287-2.083-2.176-4.992-3.558-4.992-3.558-1.13 2.085-1.012 4.716.667 5.722.439.4-3.527 2.078-2.996 7.892 0 0-3.192 5.317-5.055 8.811-1.356 2.732 1.074 6.265 4.536 6.59"/><path d="M16.859 17.328a.472.472 0 0 0-.053.006c-2.943.479-3.352 3.258-3.352 3.258a.55.55 0 0 0 1.079.218s.172-2.023 2.451-2.393a.549.549 0 0 0-.125-1.089" color="#000" style="font-feature-settings:normal;font-variant-alternates:normal;font-variant-caps:normal;font-variant-east-asian:normal;font-variant-ligatures:normal;font-variant-numeric:normal;font-variant-position:normal;font-variation-settings:normal;inline-size:0;isolation:auto;mix-blend-mode:normal;shape-margin:0;shape-padding:0;text-decoration-color:#000;text-decoration-line:none;text-decoration-style:solid;text-indent:0;text-orientation:mixed;text-transform:none;white-space:normal"/><path d="M16.7 19.572a1.117 1.204 69.395 0 1-.943 1.366 1.117 1.204 69.395 0 1-1.401-.825 1.117 1.204 69.395 0 1 .943-1.366 1.117 1.204 69.395 0 1 1.401.825" paint-order="markers fill stroke"/><path d="M8.419 29.95a.55.55 0 0 0-.384.16c-.438.436-.669.85-.78 1.172-.11.323-.093.617-.093.617a.55.55 0 0 0 .597.495c.304-.027.715-.248.687-.55 0 0-.014 0 .04-.162.056-.16.184-.42.514-.749.215-.214.028-.609-.188-.823a.552.552 0 0 0-.393-.16" color="#000" style="font-feature-settings:normal;font-variant-alternates:normal;font-variant-caps:normal;font-variant-east-asian:normal;font-variant-ligatures:normal;font-variant-numeric:normal;font-variant-position:normal;font-variation-settings:normal;inline-size:0;isolation:auto;mix-blend-mode:normal;shape-margin:0;shape-padding:0;text-decoration-color:#000;text-decoration-line:none;text-decoration-style:solid;text-indent:0;text-orientation:mixed;text-transform:none;white-space:normal"/><path d="M-718.42-382.86c17.099.645 19.298 14.991 17.595 34.473h3.526c1.754-20.341-3.914-34.957-21.01-35.602z" filter="url(#c)" opacity=".15" transform="matrix(.99995 0 0 .99606 740.69 393.31)"/><path fill="url(#d)" stroke="#000" stroke-linecap="round" d="M17.454 12.38s.652-4.143 3.9-4.848c0 0 2.08 1.085 1.664 5.969" paint-order="markers fill stroke"/><path fill="none" stroke="#000" stroke-linecap="round" d="M12.206 33.765c-.306.526-1.452 1.747-2.575 2.701"/><path fill="#fff" d="m5.427 30.42 4.195-7.324 1.172-1.892s-.797-4.414 2.719-7.38c0 0 .554-.615.003-1.107-.553-.492-1.936-2.128-.753-4.336-.077-.022.274 4.806 4.353 4.864-3.919 1.25-6.11 4.99-5.15 8.582-.736 1.173-1.458 2.08-2.375 3.208-.82 1.01-1.796 2.196-3.078 3.907-.34.454-.7.944-1.085 1.478z" opacity=".8" style="mix-blend-mode:normal"/><path fill="#fff" d="M15.757 45.676c-.744-9.435 10.084-8.795 9.438-17.61 1.104 10.971-7.883 9.13-9.438 17.61" opacity=".7"/><path fill="#fff" d="M-733.97-364.25c-.015.573 1.587-1.887 3.06-.439-.597-1.43-2.217-1.902-3.06.439" filter="url(#e)" transform="matrix(.99995 0 0 .99606 740.69 393.31)"/><path fill="#fff" d="M18.027 12.578s.58-3.7 3.249-4.46c-1.554 1.972-1.745 5.155-3.249 4.46" opacity=".8"/><path d="M-716.03-369.64c.405-1.184.326-3.052-.03-3.612-2.96 8.671-8.246 5.492-9.102 11.347 1.64-3.708 7.813-2.42 9.132-7.735" filter="url(#f)" opacity=".15" transform="matrix(.99995 0 0 .99606 740.69 393.31)"/><path fill="#fff" d="M-723.87-377.47c-3.217.615-3.405 3.277-3.405 3.277s-.499.21-.49-.328c-.231-.688 1.215-3.475 3.895-2.949" filter="url(#g)" opacity=".8" transform="matrix(.99995 0 0 .99606 740.69 393.31)"/><path fill="#fff" d="M-723.63-356.13c-6.532-.827-7.581 5.84-7.581 5.84 1.11-2.066 4.294-4.784 7.581-5.84" filter="url(#h)" transform="matrix(.76507 0 0 .92137 575.69 349.88)"/><path fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round" d="M24.304 26.035s.399-.909.744-3.487"/><path d="M23.987 32.169c.364-.026 5.37-6.215 1.061-9.62l-.51 4.556c.107 1.682.437 3.359-.551 5.064" filter="url(#i)" opacity=".15"/></svg>
'@
WriteFile 'public\chess\wP.svg' @'
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill-rule="evenodd" clip-rule="evenodd" image-rendering="optimizeQuality" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" viewBox="0 1.5 50 50"><defs><linearGradient id="a" x1="9.241" x2="40.761" y1="27.266" y2="27.266" gradientTransform="matrix(.98495 0 0 .98605 .376 .641)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffffff"/></linearGradient><linearGradient href="#a" id="b" x1="779.03" x2="794.63" y1="54.449" y2="54.449" gradientTransform="matrix(.98131 0 0 .97235 -747.13 -34.817)" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="c" x1="777.73" x2="795.93" y1="63.423" y2="63.423" gradientTransform="matrix(.98131 0 0 .97235 -747.13 -34.817)" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="d" x1="772.83" x2="800.83" y1="74.581" y2="74.581" gradientTransform="matrix(.98131 0 0 .97235 -747.13 -34.817)" gradientUnits="userSpaceOnUse"/><filter id="e" width="1.099" height="1.093" x="-.049" y="-.047" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".344"/></filter><filter id="f" width="1.151" height="1.07" x="-.075" y="-.035" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".269"/></filter></defs><ellipse cx="25" cy="18.126" fill="url(#b)" stroke="#000" stroke-linejoin="round" paint-order="markers fill stroke" rx="7.161" ry="6.834"/><path fill="url(#c)" stroke="#000" d="M25 24.598c-5.228.044-7.985-.028-8.394 4.508h16.788c-.41-4.536-3.165-4.464-8.394-4.508z"/><path fill="url(#d)" stroke="#000" d="M20.484 29.106c.496 6.787-9.303 7.996-8.706 17.19h26.444c.597-9.194-9.202-10.403-8.706-17.19H25z"/><path fill="#fff" d="M19.884 21.629c-.528.225-4.585-7.628 4.867-9.772.717-.119 1.252.64.008 1.04 0 0-7.74 3.346-4.875 8.732" opacity=".8"/><path fill="#fff" d="M12.504 45.701c-.324-1.24-.204-3.973 3.513-8.008-.37 2.437-3.065 5.393-.9 8.024z" opacity=".7"/><path fill="#fff" d="M17.282 28.557s-.026-2.905 3.106-3.142c-1.079 1.212-1.462 1.906-.933 3.174z" opacity=".8"/><path d="M275.09-101.12c.228 6.037 18.734 9.314 16.553 17.682 1.286-7.878-9.282-10.089-8.875-17.682z" filter="url(#e)" opacity=".1" style="mix-blend-mode:normal" transform="matrix(.98092 0 0 .9722 -247.86 127.42)"/><path d="M278.37-118.34c4.975.663 6.596 10.501 1.92 13.454 0 0 3.409.512 3.967 2.688.17.66.468 2.181.468 2.181h2.202s-.196-1.54-.47-2.164c-.888-2.035-4.685-2.771-4.685-2.771 1.871-1.18 3.898-4.253 3.898-6.358.388-4.551-5.508-7.548-7.3-7.03" filter="url(#f)" opacity=".15" style="mix-blend-mode:normal" transform="matrix(.98092 0 0 .9722 -248.05 126.34)"/></svg>
'@
WriteFile 'public\chess\bK.svg' @'
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill-rule="evenodd" clip-rule="evenodd" image-rendering="optimizeQuality" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" viewBox="0 1.5 50 50"><filter id="wl" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="0.6" result="d"/><feFlood flood-color="#ffffff" result="c"/><feComposite in="c" in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter><g filter="url(#wl)"><defs><filter id="e" width="1.17" height="1.07" x="-.09" y="-.03" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".39"/></filter><filter id="g" width="1.21" height="1.06" x="-.1" y="-.03" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".17"/></filter><filter id="h" width="1.12" height="1.08" x="-.06" y="-.04" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".26"/></filter><filter id="i" width="1.25" height="1.19" x="-.13" y="-.09" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".51"/></filter><filter id="j" width="1.36" height="1.15" x="-.18" y="-.08" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".27"/></filter><filter id="k" width="1.21" height="1.22" x="-.11" y="-.11" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".39"/></filter><filter id="l" width="1.46" height="1.33" x="-.23" y="-.17" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".34"/></filter><filter id="m" width="1.45" height="1.33" x="-.23" y="-.17" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".3"/></filter><linearGradient id="a" x1="9.24" x2="40.76" y1="27.27" y2="27.27" gradientTransform="matrix(1.0155 0 0 1.0103 -.39 .48)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1c1c1c"/><stop offset="1" stop-color="#1c1c1c"/></linearGradient><linearGradient href="#a" id="b" x1="-505.97" x2="-484.22" y1="-408.5" y2="-408.5" gradientTransform="matrix(1.0113 0 0 1.0008 536.22 433.79)" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="c" x1="-520.15" x2="-490.84" y1="-394.44" y2="-394.44" gradientTransform="matrix(1.0113 0 0 1.0008 536.22 433.79)" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="d" x1="-526.74" x2="-504.98" y1="-408.5" y2="-408.5" gradientTransform="matrix(1.0113 0 0 1.0008 536.22 433.79)" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="f" x1="-510.08" x2="-500.85" y1="-412.72" y2="-412.72" gradientTransform="matrix(1.0113 0 0 1.0008 536.22 433.79)" gradientUnits="userSpaceOnUse"/></defs><path fill="url(#b)" stroke="#000" d="M29.13 18.8c6.39-5.75 17.55-2.61 16.85 6.8-.68 6.17-7.01 8.35-7.01 8.35s-3.83-2.23-13.94-2.23l-.01-3.99z"/><path fill="url(#c)" stroke="#000" d="m37.94 38.83 1.3 5.28S35.48 46.34 25 46.34 10.75 44.1 10.75 44.1l1.3-5.28-.99-4.88s3.65-2.23 13.94-2.23c10.3 0 13.94 2.23 13.94 2.23z"/><path fill="none" stroke="#000" d="M10.75 44.1s3.78-2.22 14.25-2.22 14.25 2.23 14.25 2.23m-27.2-5.28s3.4-2.23 12.99-2.23S38 38.83 38 38.83"/><path fill="url(#d)" stroke="#000" d="M20.9 18.8c-6.39-5.75-17.54-2.61-16.85 6.8.68 6.17 7.01 8.35 7.01 8.35S14.9 31.72 25 31.72l.02-3.99z"/><path fill="#59917a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" d="M21.65 9.91h6.73m-3.36-3.58v7.98"/><path d="M-494.08-417.53a11.67 11.67 0 0 0-1.73.15c9.09-.23 13.44 11.95 1.4 16.48l-1.28 4.96 1.53 5.48 2.96 1.1-1.5-5.46 1-5.21s6.27-1.78 6.93-7.82c.5-4.62-2.55-9.73-9.31-9.68" filter="url(#e)" opacity=".2" style="mix-blend-mode:normal" transform="matrix(1.0113 0 0 1.0008 536.22 433.79)"/><path fill="url(#f)" stroke="#000" stroke-linejoin="round" d="m20.9 18.8 4.13 8.65 4.13-8.66s.7-4.77-4.13-4.77-4.13 4.77-4.13 4.77z"/><path d="M-505.48-419.2c4.76.97.87 10.52.02 13.19.02.02 3.07-5.4 4.02-8.92.09-4.5-3.87-4.39-4.04-4.27" filter="url(#g)" opacity=".2" style="mix-blend-mode:normal" transform="matrix(1.0113 0 0 1.0008 536.22 433.79)"/><path d="M-505.49-402.26v-.07l.01-3.4s-2.68-6.9-4.05-8.91c-1.33-1.97-3.78-2.93-6.56-2.79 3.97 1.77 8.93 10.03 10.6 15.17" filter="url(#h)" opacity=".2" style="mix-blend-mode:normal" transform="matrix(1.0113 0 0 1.0008 536.22 433.79)"/><path fill="#fff" d="M6.31 29.53a8.15 8.15 0 0 1-1.44-6.64c1.43-7.07 9.46-6.3 9.46-6.3-11.6 3.47-7.88 12.97-8.02 12.94" filter="url(#i)" opacity=".3"/><path fill="#fff" d="m23.57 23.02-2.11-4.4s-.7-4.12 3.54-4.05c-4.22 1.33-1.43 8.45-1.43 8.45" filter="url(#j)" opacity=".25"/><path fill="#fff" d="m27.03 24.96 2.75-5.93s2.44-2.22 6.11-2.57c-3.94 1.03-6.33 4.87-8.86 8.5" filter="url(#k)" opacity=".2"/><path d="M25.32 41.92c-10.31 0-14.57 2.19-14.57 2.19s4.26 2.18 14.57 2.18h.02c-15.44-2 7.31-3.8 8.28-3.81a57.55 57.55 0 0 0-8.3-.55z" opacity=".15"/><path d="M25 46.3c-9.24 0-13.74-2.21-13.74-2.21s4.5-2.21 13.74-2.21 13.74 2.2 13.74 2.2S34.24 46.3 25 46.3" opacity=".2"/><path fill="#fff" d="M12.53 39.17c.85-.45 1.73-.64 2.6-.96-.6.84-.64 2.72-.37 4.06 0 0-.89.12-3.23.9z" filter="url(#l)" opacity=".1"/><path fill="#fff" d="M12.46 38.02s.3-.29 2.42-.88c-1.59-1.6-1.4-3.44-1.57-3.51-.57.17-1.12.39-1.65.63z" filter="url(#m)" opacity=".15"/></g></svg>
'@
WriteFile 'public\chess\bQ.svg' @'
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill-rule="evenodd" clip-rule="evenodd" image-rendering="optimizeQuality" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" viewBox="0 1.5 50 50"><filter id="wl" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="0.6" result="d"/><feFlood flood-color="#ffffff" result="c"/><feComposite in="c" in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter><g filter="url(#wl)"><defs><filter id="d" width="1.19" height="1.06" x="-.1" y="-.03" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".39"/></filter><filter id="i" width="1.21" height="1.06" x="-.1" y="-.03" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".22"/></filter><filter id="j" width="1.4" height="1.05" x="-.2" y="-.03" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".2"/></filter><filter id="k" width="1.33" height="1.06" x="-.16" y="-.03" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".21"/></filter><filter id="l" width="1.17" height="1.07" x="-.08" y="-.03" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".23"/></filter><filter id="m" width="1.12" height="1.08" x="-.06" y="-.04" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".24"/></filter><filter id="n" width="1.33" height="1.16" x="-.16" y="-.08" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".14"/></filter><filter id="o" width="1.33" height="1.16" x="-.16" y="-.08" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".14"/></filter><filter id="p" width="1.33" height="1.16" x="-.17" y="-.08" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".14"/></filter><filter id="q" width="1.33" height="1.16" x="-.17" y="-.08" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".14"/></filter><filter id="r" width="1.33" height="1.16" x="-.17" y="-.08" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".14"/></filter><filter id="s" width="1.46" height="1.33" x="-.23" y="-.17" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".34"/></filter><filter id="t" width="1.39" height="1.38" x="-.19" y="-.19" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".4"/></filter><linearGradient href="#a" id="b" x1="-25.02" x2="14.08" y1="-249.82" y2="-249.82" gradientTransform="matrix(.99988 0 0 .97754 30.45 272.6)" gradientUnits="userSpaceOnUse"/><linearGradient id="a" x1="9.24" x2="40.76" y1="27.27" y2="27.27" gradientTransform="matrix(1.0155 0 0 1.0103 -.39 .48)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1c1c1c"/><stop offset="1" stop-color="#1c1c1c"/></linearGradient><linearGradient href="#a" id="c" x1="-27.91" x2="-21.13" y1="-264.3" y2="-264.3" gradientTransform="matrix(.99988 0 0 .97754 29.93 272.6)" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="e" x1="-18.93" x2="-12.15" y1="-267.53" y2="-267.53" gradientTransform="matrix(.99988 0 0 .97754 30.45 272.6)" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="f" x1="-8.86" x2="-2.08" y1="-268.55" y2="-268.55" gradientTransform="matrix(.99988 0 0 .97754 30.45 272.6)" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="g" x1="1.21" x2="8" y1="-267.53" y2="-267.53" gradientTransform="matrix(.99988 0 0 .97754 30.45 272.6)" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="h" x1="10.2" x2="16.98" y1="-264.3" y2="-264.3" gradientTransform="matrix(.99988 0 0 .97754 30.98 272.6)" gradientUnits="userSpaceOnUse"/></defs><path fill="url(#b)" stroke="#000" stroke-linecap="round" d="m37.16 38.87 3.17-4.8 4.24-19.83-9.66 14.8.15-17.44-6.9 16.4-3.17-17.93L21.82 28l-6.9-16.41.14 17.44-9.65-14.8 4.24 19.82 3.36 4.81-1.41 5.39S16 46.3 25 46.3s13.39-2.04 13.39-2.04z"/><path fill="none" stroke="#000" stroke-linecap="round" d="M9.75 34.06c1.34.18 1.64-.35 2.05-1.9 0 0 2.5 1.34 3.77 1.06 1.36-.3 2.47-2.17 2.47-2.17s2.11 1.56 3.38 1.45c1.47-.12 3.5-1.98 3.5-1.98s2.03 1.86 3.5 1.98c1.27.1 3.39-1.45 3.39-1.45s1.1 1.87 2.47 2.17c1.27.28 3.76-1.06 3.76-1.06.41 1.55.84 2.09 2.19 1.9"/><ellipse cx="5.41" cy="14.24" fill="url(#c)" stroke="#000" stroke-linecap="round" stroke-linejoin="round" rx="2.89" ry="2.8"/><path d="M13.56-262.78c-1.2 4.73-4.7 13.53-6.05 18.22l-3.74 4.82 1.08 4.99 3.08 1.16-1.23-5.51 2.97-4.68z" filter="url(#d)" opacity=".2" style="mix-blend-mode:normal" transform="matrix(.99988 0 0 .97754 30.45 272.6)"/><path d="M24.5 41.69c-4.84 0-9.67.86-12.9 2.57 3.23 1.71 8.07 1.75 12.91 1.75-11.92-1.88 1.96-3.7 6.74-3.73-2.13-.4-4.44-.59-6.75-.59" opacity=".15"/><path fill="none" stroke="#000" d="M11.6 44.26S16 42.12 25 42.12s13.39 2.14 13.39 2.14m-25.53-5.39s3.66-2.04 12.15-2.04 12.15 2.04 12.15 2.04"/><ellipse cx="14.92" cy="11.08" fill="url(#e)" stroke="#000" stroke-linecap="round" stroke-linejoin="round" rx="2.89" ry="2.8"/><ellipse cx="24.99" cy="10.08" fill="url(#f)" stroke="#000" stroke-linecap="round" stroke-linejoin="round" rx="2.89" ry="2.8"/><ellipse cx="35.06" cy="11.08" fill="url(#g)" stroke="#000" stroke-linecap="round" stroke-linejoin="round" rx="2.89" ry="2.8"/><ellipse cx="44.57" cy="14.24" fill="url(#h)" stroke="#000" stroke-linecap="round" stroke-linejoin="round" rx="2.89" ry="2.8"/><path fill="#fff" d="m6.39 16.87 3.73 16.64s.8.06 1.27-2.3z" filter="url(#i)" opacity=".3"/><path fill="#fff" d="m15.52 14.5 2.34 15.17c-.62 1.08-1.47 2-2.16 2.17z" filter="url(#j)" opacity=".25"/><path fill="#fff" d="M21.99 31.03 25 13.42l-.14 15.75c-1.06.92-2.15 1.86-2.88 1.86z" filter="url(#k)" opacity=".2"/><path fill="#fff" d="m34.46 14.6-6.78 16.2c.02-.1.47 1.4 3.83-1.25z" filter="url(#l)" opacity=".15"/><path fill="#fff" d="m33.92 31.8 9.22-14.32-5.6 13.35s-3.15 1.73-3.62.98z" filter="url(#m)" opacity=".1"/><path fill="#fff" d="M4.18 16.16s-3.01-2.7.94-4.17c.09.01-1.83 2.15-.94 4.17" filter="url(#n)" opacity=".25"/><path fill="#fff" d="M13.83 13.03s-3.02-2.7.93-4.17c.1 0-1.8 2.06-.93 4.17" filter="url(#o)" opacity=".2"/><path fill="#fff" d="M23.85 12s-3.02-2.69.93-4.16c.06 0-1.92 2.09-.93 4.17z" filter="url(#p)" opacity=".2"/><path fill="#fff" d="M33.94 13s-3.02-2.7.93-4.18c.04 0-1.92 2.1-.93 4.17z" filter="url(#q)" opacity=".15"/><path fill="#fff" d="M43.43 16.15s-3.02-2.7.93-4.17c.05.02-1.88 2.19-.93 4.17" filter="url(#r)" opacity=".1"/><path d="M25 46.4c-9.01 0-13.4-2.14-13.4-2.14S16 42.12 25 42.12s13.38 2.14 13.38 2.14S34 46.4 25 46.4M6.77 12.41c.08.03 2.32 1.75-.15 3.87-.07-.13 1.17-2 .15-3.87m9.57-3.16c.08.02 2.31 1.75-.15 3.86-.08-.12 1.16-2 .15-3.86m10.09-.97c.08.02 2.3 1.75-.15 3.86-.08-.12 1.16-2 .14-3.86zm10.09.99c.07.03 2.3 1.75-.15 3.86-.08-.12 1.16-2 .14-3.86zm9.54 3.3c.08.02 2.31 1.74-.15 3.86-.07-.13 1.16-2 .15-3.87z" opacity=".2"/><path fill="#fff" d="M13.51 39.22c.85-.45 1.7-.66 2.57-.87-.58.83-.61 2.63-.33 3.97 0 0-.9.13-3.23.9z" filter="url(#s)" opacity=".1"/><path fill="#fff" d="M13.15 38.08c.1-.01.33-.29 2.59-.95a18.02 18.02 0 0 1-3.55-4.07c-.33.91-.78 1.51-1.42 1.58z" filter="url(#t)" opacity=".15"/></g></svg>
'@
WriteFile 'public\chess\bR.svg' @'
<svg xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" image-rendering="optimizeQuality" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" viewBox="0 1.5 50 50"><filter id="wl" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="0.6" result="d"/><feFlood flood-color="#ffffff" result="c"/><feComposite in="c" in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter><g filter="url(#wl)"><defs><filter id="b" width="1.223" height="1.061" x="-.112" y="-.03" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".463"/></filter><filter id="c" width="1.255" height="1.187" x="-.127" y="-.094" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".264"/></filter><filter id="d" width="1.296" height="1.17" x="-.148" y="-.085" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".373"/></filter><filter id="e" width="1.171" height="1.294" x="-.085" y="-.147" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".173"/></filter><filter id="f" width="1.277" height="1.177" x="-.139" y="-.088" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".119"/></filter><filter id="g" width="1.164" height="1.315" x="-.082" y="-.158" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".24"/></filter><filter id="h" width="1.195" height="1.242" x="-.097" y="-.121" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".123"/></filter><filter id="i" width="1.195" height="1.242" x="-.097" y="-.121" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".123"/></filter><linearGradient id="a" x1="9.005" x2="40.995" y1="26.762" y2="26.762" gradientTransform="translate(0 1.029)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1c1c1c"/><stop offset="1" stop-color="#1c1c1c"/></linearGradient><linearGradient id="j" x1="-36.133" x2="-9.938" y1="-313.97" y2="-313.97" gradientTransform="matrix(-1 0 0 1 1.964 333.28)" gradientUnits="userSpaceOnUse"><stop offset="0"/><stop offset="1" stop-opacity="0"/></linearGradient></defs><path fill="url(#a)" stroke="#000" stroke-linecap="round" d="M12.973 41.57h24.121m-24.127-4.371h24.066m-20.061-4.052H33.03M17.062 21.53h15.879m-21.038-4.432h26.196m-26.196-7.81v7.81l5.158 4.433-.09 11.618-4.003 4.051v4.371H9.505v4.726h30.99V41.57h-3.462V37.2l-4.004-4.052-.09-11.618 5.159-4.433v-7.81h-5.593v3.347h-4.613V9.286h-5.783v3.348h-4.613V9.286z"/><path d="M46.199-268.38v7.725l-5.02 4.386.089 11.489 4.413 4.006v4.323h2.829v4.673h2.632v-4.673h-3.358v-4.322L43.9-244.78l-.088-11.492 5.002-4.383v-7.725z" filter="url(#b)" opacity=".2" style="mix-blend-mode:normal" transform="matrix(1.031 0 0 1.0112 -12.232 280.67)"/><path fill="#fff" d="m12.466 16.525-.041-6.675 3.328-.095-1.997.711v5.356l4.704.667z" filter="url(#c)" opacity=".25" style="mix-blend-mode:normal"/><path fill="#fff" d="M17.596 22.031h7.58l-6.467 1v8.598l-1.161.922z" filter="url(#d)" opacity=".25" style="mix-blend-mode:normal"/><path fill="#fff" d="m14.358 36.582 2.86-2.83h1.479l-2.4 2.83z" filter="url(#e)" opacity=".15" style="mix-blend-mode:normal"/><path fill="#fff" d="m13.518 37.794.005 3.214h1.524l-.003-3.225z" filter="url(#f)" opacity=".1" style="mix-blend-mode:normal"/><path fill="#fff" d="M10.067 42.104h1.015v2.66l3.872.987h-4.887z" filter="url(#g)" opacity=".15" style="mix-blend-mode:normal"/><path fill="#fff" d="m22.651 9.794-.017 2.433c.658-1.23 1.363-2.176 3.026-2.424z" filter="url(#h)" opacity=".15" style="mix-blend-mode:normal"/><path fill="#fff" d="m33.051 9.807-.017 2.433c.388-1.52 1.111-2.39 3.026-2.425z" filter="url(#i)" opacity=".1" style="mix-blend-mode:normal"/><path fill="url(#j)" d="M38.098 17.097H11.903l5.16 4.433H32.94z" opacity=".2"/></g></svg>
'@
WriteFile 'public\chess\bB.svg' @'
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill-rule="evenodd" clip-rule="evenodd" image-rendering="optimizeQuality" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" viewBox="0 0 50 50"><filter id="wl" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="0.6" result="d"/><feFlood flood-color="#ffffff" result="c"/><feComposite in="c" in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter><g filter="url(#wl)"><defs><linearGradient href="#a" id="b" x1="381.9" x2="388.19" y1="-386.04" y2="-386.21" gradientTransform="translate(.53)" gradientUnits="userSpaceOnUse"/><linearGradient id="a"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><linearGradient href="#a" id="c" x1="391.1" x2="393.27" y1="-401.61" y2="-401.61" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="d" x1="393.32" x2="401.31" y1="-388.47" y2="-387.49" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="e" x1="490.24" x2="511.24" y1="-382.24" y2="-382.24" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="f" x1="491.59" x2="499.17" y1="-377.43" y2="-377.43" gradientUnits="userSpaceOnUse"/></defs><g transform="translate(-368.06 412.37)"><path fill="#1c1c1c" stroke="#000" stroke-linejoin="round" stroke-width="1.2" d="M393.07-404.07a2.66 2.503 0 0 0-2.659 2.504 2.66 2.503 0 0 0 1.063 2.001c-16.923 14.771-5.84 26.84-5.84 26.84h14.872s7.78-8.476.342-19.915l-5.546 7.742-2.995-2.144 6.215-8.674a38.64 38.64 0 0 0-3.856-3.85 2.66 2.503 0 0 0 1.063-2.001 2.66 2.503 0 0 0-2.659-2.504z"/><path fill="url(#b)" d="M386.47-373.35s-10.266-12.757 6.618-26.134c-4.083 5.062-10.216 13.857-1.513 26.129z" opacity=".5"/><ellipse cx="392.19" cy="-401.61" fill="url(#c)" opacity=".5" rx="1.083" ry="1.199" style="paint-order:markers fill stroke"/><path fill="url(#d)" d="M395.53-384.07c.094 0 5.262-7.413 5.262-7.413s.357.38.52.847l-5.02 7.144z" opacity=".5"/><path fill-opacity=".902" stroke="#000" stroke-width=".265" d="M402.5-388.01c2.846 8.943-2.293 14.667-2.293 14.667h-3.391c2.263-.08 6.966-8.42 5.684-14.667z" opacity=".2"/><g transform="translate(-107.69 9.782)"><path fill="#1c1c1c" stroke="#000" stroke-linejoin="round" stroke-width="1.2" d="m490.96-383.12-1.27.788v3.129l1.27.788h19.564l1.27-.788v-3.13l-1.27-.787h-9.782z"/><path fill="url(#e)" d="m511.24-381.97-20.994.009.884-.542 19.247-.015z" opacity=".5"/><path d="m511.24-381.97-.008 2.404-.866.523-8.44-.01s2.95-.628 1.94-2.894c-.001-.004 5.277-.02 7.374-.023" opacity=".2"/><path fill="#1c1c1c" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2" d="M490.96-378.42v1.96h19.564v-1.96z" style="paint-order:normal"/><rect width="7.576" height=".709" x="491.59" y="-377.79" fill="url(#f)" opacity=".5" ry="0" style="paint-order:markers fill stroke"/></g></g></g></svg>
'@
WriteFile 'public\chess\bN.svg' @'
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill-rule="evenodd" clip-rule="evenodd" image-rendering="optimizeQuality" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" viewBox="0 1.5 50 50"><filter id="wl" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="0.6" result="d"/><feFlood flood-color="#ffffff" result="c"/><feComposite in="c" in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter><g filter="url(#wl)"><defs><filter id="c" width="1.128" height="1.077" x="-.064" y="-.038" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".57"/></filter><filter id="e" width="1.216" height="1.115" x="-.108" y="-.057" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".527"/></filter><filter id="f" width="1.307" height="1.167" x="-.153" y="-.083" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".612"/></filter><filter id="g" width="1.469" height="1.834" x="-.234" y="-.417" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".299"/></filter><filter id="h" width="1.461" height="1.329" x="-.231" y="-.164" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".312"/></filter><filter id="i" width="1.238" height="1.198" x="-.119" y="-.099" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".467"/></filter><filter id="j" width="1.358" height="1.415" x="-.179" y="-.207" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".292"/></filter><filter id="k" width="1.641" height="1.823" x="-.321" y="-.411" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="1.013"/></filter><filter id="l" width="1.479" height="1.139" x="-.239" y="-.07" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".279"/></filter><linearGradient href="#a" id="b" x1="-736.5" x2="-696.5" y1="-367.96" y2="-367.96" gradientTransform="matrix(.99995 0 0 .99606 740.69 393.31)" gradientUnits="userSpaceOnUse"/><linearGradient id="a" x1="9.241" x2="40.761" y1="27.266" y2="27.266" gradientTransform="matrix(1.0155 0 0 1.0103 -.389 .482)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1c1c1c"/><stop offset="1" stop-color="#1c1c1c"/></linearGradient><linearGradient href="#a" id="d" x1="-116.32" x2="-77.199" y1="299.9" y2="299.9" gradientTransform="matrix(1.1045 0 0 1.0827 130.81 -314.94)" gradientUnits="userSpaceOnUse"/></defs><path fill="url(#b)" stroke="#000" stroke-dashoffset="1.852" stroke-linecap="round" d="M10.393 35.883c2.887 2.407 4.157-.702 5.178-3.053 1.398-3.953 7.128-1.826 8.733-6.795 2.83 11.085-9.865 8.393-9.264 20.26h28.386c1.913-22.102-5.002-37.42-25.957-35.287-2.083-2.176-4.992-3.558-4.992-3.558-1.13 2.085-1.012 4.716.667 5.722.439.4-3.527 2.078-2.996 7.892 0 0-3.192 5.317-5.055 8.811-1.356 2.732 1.074 6.265 4.536 6.59"/><path d="M16.859 17.328a.472.472 0 0 0-.053.006c-2.943.479-3.352 3.258-3.352 3.258a.55.55 0 0 0 1.079.218s.172-2.023 2.451-2.393a.549.549 0 0 0-.125-1.089" color="#000" style="font-feature-settings:normal;font-variant-alternates:normal;font-variant-caps:normal;font-variant-east-asian:normal;font-variant-ligatures:normal;font-variant-numeric:normal;font-variant-position:normal;font-variation-settings:normal;inline-size:0;isolation:auto;mix-blend-mode:normal;shape-margin:0;shape-padding:0;text-decoration-color:#000;text-decoration-line:none;text-decoration-style:solid;text-indent:0;text-orientation:mixed;text-transform:none;white-space:normal"/><path d="M16.7 19.572a1.117 1.204 69.395 0 1-.943 1.366 1.117 1.204 69.395 0 1-1.401-.825 1.117 1.204 69.395 0 1 .943-1.366 1.117 1.204 69.395 0 1 1.401.825" paint-order="markers fill stroke"/><path d="M8.419 29.95a.55.55 0 0 0-.384.16c-.438.436-.669.85-.78 1.172-.11.323-.093.617-.093.617a.55.55 0 0 0 .597.495c.304-.027.715-.248.687-.55 0 0-.014 0 .04-.162.056-.16.184-.42.514-.749.215-.214.028-.609-.188-.823a.552.552 0 0 0-.393-.16" color="#000" style="font-feature-settings:normal;font-variant-alternates:normal;font-variant-caps:normal;font-variant-east-asian:normal;font-variant-ligatures:normal;font-variant-numeric:normal;font-variant-position:normal;font-variation-settings:normal;inline-size:0;isolation:auto;mix-blend-mode:normal;shape-margin:0;shape-padding:0;text-decoration-color:#000;text-decoration-line:none;text-decoration-style:solid;text-indent:0;text-orientation:mixed;text-transform:none;white-space:normal"/><path d="M-718.42-382.86c17.099.645 19.298 14.991 17.595 34.473h3.526c1.754-20.341-3.914-34.957-21.01-35.602z" filter="url(#c)" opacity=".2" transform="matrix(.99995 0 0 .99606 740.69 393.31)"/><path fill="url(#d)" stroke="#000" stroke-linecap="round" d="M17.454 12.38s.652-4.143 3.9-4.848c0 0 2.08 1.085 1.664 5.969" paint-order="markers fill stroke"/><path fill="none" stroke="#000" stroke-linecap="round" d="M12.206 33.765c-.306.526-1.452 1.747-2.575 2.701"/><path fill="#fff" d="m5.427 30.42 4.195-7.324 1.172-1.892s-.797-4.414 2.719-7.38c0 0 .554-.615.003-1.107-.553-.492-1.936-2.128-.753-4.336-.077-.022.274 4.806 4.353 4.864-3.919 1.25-6.11 4.99-5.15 8.582-.736 1.173-1.458 2.08-2.375 3.208-.82 1.01-1.796 2.196-3.078 3.907-.34.454-.7.944-1.085 1.478z" filter="url(#e)" opacity=".3" style="mix-blend-mode:normal"/><path fill="#fff" d="M15.757 45.676c-.744-9.435 10.084-8.795 9.438-17.61 1.104 10.971-7.883 9.13-9.438 17.61" filter="url(#f)" opacity=".2"/><path fill="#fff" d="M-733.97-364.25c-.015.573 1.587-1.887 3.06-.439-.597-1.43-2.217-1.902-3.06.439" filter="url(#g)" opacity=".2" transform="matrix(.99995 0 0 .99606 740.69 393.31)"/><path fill="#fff" d="M18.027 12.578s.58-3.7 3.249-4.46c-1.554 1.972-1.745 5.155-3.249 4.46" filter="url(#h)" opacity=".2"/><path d="M-716.03-369.64c.405-1.184.326-3.052-.03-3.612-2.96 8.671-8.246 5.492-9.102 11.347 1.64-3.708 7.813-2.42 9.132-7.735" filter="url(#i)" opacity=".2" transform="matrix(.99995 0 0 .99606 740.69 393.31)"/><path fill="#fff" d="M-723.87-377.47c-3.217.615-3.405 3.277-3.405 3.277s-.499.21-.49-.328c-.231-.688 1.215-3.475 3.895-2.949" filter="url(#j)" opacity=".2" transform="matrix(.99995 0 0 .99606 740.69 393.31)"/><path fill="#fff" d="M-723.63-356.13c-6.532-.827-7.581 5.84-7.581 5.84 1.11-2.066 4.294-4.784 7.581-5.84" filter="url(#k)" opacity=".1" transform="matrix(.76507 0 0 .92137 575.69 349.88)"/><path fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round" d="M24.304 26.035s.399-.909.744-3.487"/><path d="M23.987 32.169c.364-.026 5.37-6.215 1.061-9.62l-.51 4.556c.107 1.682.437 3.359-.551 5.064" filter="url(#l)" opacity=".2"/></g></svg>
'@
WriteFile 'public\chess\bP.svg' @'
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill-rule="evenodd" clip-rule="evenodd" image-rendering="optimizeQuality" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" viewBox="0 1.5 50 50"><filter id="wl" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="0.6" result="d"/><feFlood flood-color="#ffffff" result="c"/><feComposite in="c" in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter><g filter="url(#wl)"><defs><filter id="e" width="1.46" height="1.33" x="-.23" y="-.16" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".67"/></filter><filter id="f" width="1.55" height="1.29" x="-.27" y="-.15" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".49"/></filter><filter id="g" width="1.61" height="1.59" x="-.3" y="-.3" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".39"/></filter><filter id="h" width="1.1" height="1.09" x="-.05" y="-.05" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".34"/></filter><filter id="i" width="1.15" height="1.07" x="-.07" y="-.04" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".27"/></filter><linearGradient href="#a" id="b" x1="779.03" x2="794.63" y1="54.45" y2="54.45" gradientTransform="matrix(.98131 0 0 .97235 -747.13 -34.82)" gradientUnits="userSpaceOnUse"/><linearGradient id="a" x1="9.24" x2="40.76" y1="27.27" y2="27.27" gradientTransform="matrix(1.0155 0 0 1.0103 -.39 .48)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1c1c1c"/><stop offset="1" stop-color="#1c1c1c"/></linearGradient><linearGradient href="#a" id="c" x1="777.73" x2="795.93" y1="63.42" y2="63.42" gradientTransform="matrix(.98131 0 0 .97235 -747.13 -34.82)" gradientUnits="userSpaceOnUse"/><linearGradient href="#a" id="d" x1="772.83" x2="800.83" y1="74.58" y2="74.58" gradientTransform="matrix(.98131 0 0 .97235 -747.13 -34.82)" gradientUnits="userSpaceOnUse"/></defs><ellipse cx="25" cy="18.13" fill="url(#b)" stroke="#000" stroke-linejoin="round" paint-order="markers fill stroke" rx="7.16" ry="6.83"/><path fill="url(#c)" stroke="#000" d="M25 24.6c-5.23.04-7.99-.03-8.4 4.5h16.8c-.42-4.53-3.17-4.46-8.4-4.5z"/><path fill="url(#d)" stroke="#000" d="M20.48 29.1c.5 6.8-9.3 8-8.7 17.2h26.44c.6-9.2-9.2-10.4-8.7-17.2H25z"/><path fill="#fff" d="M19.88 21.63c-.52.22-4.58-7.63 4.87-9.77.72-.12 1.25.64 0 1.04 0 0-7.73 3.34-4.87 8.73" filter="url(#e)" opacity=".25"/><path fill="#fff" d="M12.5 45.7c-.32-1.24-.2-3.97 3.52-8-.37 2.43-3.07 5.39-.9 8.02z" filter="url(#f)" opacity=".2"/><path fill="#fff" d="M17.28 28.56s-.02-2.9 3.1-3.15c-1.07 1.22-1.45 1.91-.93 3.18z" filter="url(#g)" opacity=".2"/><path d="M275.09-101.12c.23 6.04 18.73 9.31 16.55 17.68 1.29-7.88-9.28-10.09-8.87-17.68z" filter="url(#h)" opacity=".15" style="mix-blend-mode:normal" transform="matrix(.98092 0 0 .9722 -247.86 127.42)"/><path d="M278.37-118.34c4.97.66 6.6 10.5 1.92 13.45 0 0 3.4.52 3.97 2.7.17.65.47 2.17.47 2.17h2.2s-.2-1.54-.47-2.16c-.9-2.04-4.69-2.77-4.69-2.77 1.87-1.18 3.9-4.25 3.9-6.36.39-4.55-5.5-7.55-7.3-7.03" filter="url(#i)" opacity=".2" style="mix-blend-mode:normal" transform="matrix(.98092 0 0 .9722 -248.05 126.34)"/></g></svg>
'@

WriteFile 'app\games\chess\page.tsx' @'
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ===================== ШАХОВИЙ РУШІЙ (перевірено PERFT) ===================== */
// Дошка — масив[64], 0 = a8 … 63 = h1. Фігури: 'PNBRQK' білі, малі — чорні, '' порожньо.

type Sq = number;
type Castle = { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean };
type GState = { board: string[]; turn: 'w' | 'b'; castle: Castle; ep: number | null };
type Move = { from: Sq; to: Sq; promo?: string; cap?: boolean; castle?: 'K' | 'Q'; epCap?: boolean; dbl?: boolean };

const START_BOARD = (): string[] => {
  const b = new Array(64).fill('');
  const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let i = 0; i < 8; i++) { b[i] = back[i]; b[8 + i] = 'p'; b[48 + i] = 'P'; b[56 + i] = back[i].toUpperCase(); }
  return b;
};
const startState = (): GState => ({ board: START_BOARD(), turn: 'w', castle: { wK: true, wQ: true, bK: true, bQ: true }, ep: null });

const isW = (p: string) => !!p && p === p.toUpperCase();
const colorOf = (p: string): 'w' | 'b' | null => (p ? (isW(p) ? 'w' : 'b') : null);
const rc = (i: number): [number, number] => [Math.floor(i / 8), i % 8];
const idx = (r: number, c: number) => r * 8 + c;
const onB = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

const N_OFF = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const K_OFF = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const B_DIR = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const R_DIR = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function attacked(board: string[], sq: number, by: 'w' | 'b'): boolean {
  const [r, c] = rc(sq);
  const prow = by === 'w' ? r + 1 : r - 1;
  for (const dc of [-1, 1]) { if (onB(prow, c + dc)) { const p = board[idx(prow, c + dc)]; if (p && colorOf(p) === by && p.toUpperCase() === 'P') return true; } }
  for (const [dr, dc] of N_OFF) { const nr = r + dr, nc = c + dc; if (onB(nr, nc)) { const p = board[idx(nr, nc)]; if (p && colorOf(p) === by && p.toUpperCase() === 'N') return true; } }
  for (const [dr, dc] of K_OFF) { const nr = r + dr, nc = c + dc; if (onB(nr, nc)) { const p = board[idx(nr, nc)]; if (p && colorOf(p) === by && p.toUpperCase() === 'K') return true; } }
  for (const [dr, dc] of B_DIR) { let nr = r + dr, nc = c + dc; while (onB(nr, nc)) { const p = board[idx(nr, nc)]; if (p) { if (colorOf(p) === by && (p.toUpperCase() === 'B' || p.toUpperCase() === 'Q')) return true; break; } nr += dr; nc += dc; } }
  for (const [dr, dc] of R_DIR) { let nr = r + dr, nc = c + dc; while (onB(nr, nc)) { const p = board[idx(nr, nc)]; if (p) { if (colorOf(p) === by && (p.toUpperCase() === 'R' || p.toUpperCase() === 'Q')) return true; break; } nr += dr; nc += dc; } }
  return false;
}
function kingSq(board: string[], color: 'w' | 'b') { const k = color === 'w' ? 'K' : 'k'; for (let i = 0; i < 64; i++) if (board[i] === k) return i; return -1; }

function pseudoMoves(state: GState): Move[] {
  const { board, turn, castle, ep } = state;
  const me = turn, opp: 'w' | 'b' = turn === 'w' ? 'b' : 'w';
  const moves: Move[] = [];
  const push = (from: number, to: number, extra: Partial<Move> = {}) => moves.push({ from, to, ...extra });
  for (let i = 0; i < 64; i++) {
    const p = board[i]; if (!p || colorOf(p) !== me) continue;
    const [r, c] = rc(i); const t = p.toUpperCase();
    if (t === 'P') {
      const dir = me === 'w' ? -1 : 1;
      const startRow = me === 'w' ? 6 : 1;
      const promoRow = me === 'w' ? 0 : 7;
      if (onB(r + dir, c) && board[idx(r + dir, c)] === '') {
        const one = idx(r + dir, c);
        if (r + dir === promoRow) { for (const pr of ['Q', 'R', 'B', 'N']) push(i, one, { promo: pr }); }
        else push(i, one);
        if (r === startRow && board[idx(r + 2 * dir, c)] === '') push(i, idx(r + 2 * dir, c), { dbl: true });
      }
      for (const dc of [-1, 1]) {
        const nr = r + dir, nc = c + dc; if (!onB(nr, nc)) continue; const to = idx(nr, nc);
        if (board[to] !== '' && colorOf(board[to]) === opp) {
          if (nr === promoRow) { for (const pr of ['Q', 'R', 'B', 'N']) push(i, to, { promo: pr, cap: true }); }
          else push(i, to, { cap: true });
        } else if (ep !== null && to === ep) push(i, to, { epCap: true });
      }
    } else if (t === 'N') {
      for (const [dr, dc] of N_OFF) { const nr = r + dr, nc = c + dc; if (!onB(nr, nc)) continue; const to = idx(nr, nc); if (board[to] === '' || colorOf(board[to]) === opp) push(i, to, { cap: board[to] !== '' }); }
    } else if (t === 'K') {
      for (const [dr, dc] of K_OFF) { const nr = r + dr, nc = c + dc; if (!onB(nr, nc)) continue; const to = idx(nr, nc); if (board[to] === '' || colorOf(board[to]) === opp) push(i, to, { cap: board[to] !== '' }); }
      const homeRow = me === 'w' ? 7 : 0;
      if (r === homeRow && c === 4) {
        const kSide = me === 'w' ? castle.wK : castle.bK;
        const qSide = me === 'w' ? castle.wQ : castle.bQ;
        if (kSide && board[idx(homeRow, 5)] === '' && board[idx(homeRow, 6)] === '' && !attacked(board, idx(homeRow, 4), opp) && !attacked(board, idx(homeRow, 5), opp) && !attacked(board, idx(homeRow, 6), opp)) push(i, idx(homeRow, 6), { castle: 'K' });
        if (qSide && board[idx(homeRow, 3)] === '' && board[idx(homeRow, 2)] === '' && board[idx(homeRow, 1)] === '' && !attacked(board, idx(homeRow, 4), opp) && !attacked(board, idx(homeRow, 3), opp) && !attacked(board, idx(homeRow, 2), opp)) push(i, idx(homeRow, 2), { castle: 'Q' });
      }
    } else {
      const dirs = t === 'B' ? B_DIR : t === 'R' ? R_DIR : [...B_DIR, ...R_DIR];
      for (const [dr, dc] of dirs) { let nr = r + dr, nc = c + dc; while (onB(nr, nc)) { const to = idx(nr, nc); if (board[to] === '') push(i, to); else { if (colorOf(board[to]) === opp) push(i, to, { cap: true }); break; } nr += dr; nc += dc; } }
    }
  }
  return moves;
}

function makeMove(state: GState, m: Move): GState {
  const board = state.board.slice();
  const castle = { ...state.castle };
  const me = state.turn, opp: 'w' | 'b' = me === 'w' ? 'b' : 'w';
  let ep: number | null = null;
  const p = board[m.from];
  board[m.from] = '';
  if (m.epCap) { const [tr, tc] = rc(m.to); const capRow = me === 'w' ? tr + 1 : tr - 1; board[idx(capRow, tc)] = ''; }
  if (m.promo) board[m.to] = me === 'w' ? m.promo : m.promo.toLowerCase();
  else board[m.to] = p;
  if (m.castle) { const [r] = rc(m.from); if (m.castle === 'K') { board[idx(r, 5)] = board[idx(r, 7)]; board[idx(r, 7)] = ''; } else { board[idx(r, 3)] = board[idx(r, 0)]; board[idx(r, 0)] = ''; } }
  if (m.dbl) { const [fr, fc] = rc(m.from); ep = idx(fr + (me === 'w' ? -1 : 1), fc); }
  if (p.toUpperCase() === 'K') { if (me === 'w') { castle.wK = false; castle.wQ = false; } else { castle.bK = false; castle.bQ = false; } }
  const corners: Record<number, keyof Castle> = { 56: 'wQ', 63: 'wK', 0: 'bQ', 7: 'bK' };
  if (corners[m.from]) castle[corners[m.from]] = false;
  if (corners[m.to]) castle[corners[m.to]] = false;
  return { board, turn: opp, castle, ep };
}

function legalMoves(state: GState): Move[] {
  const opp: 'w' | 'b' = state.turn === 'w' ? 'b' : 'w';
  const res: Move[] = [];
  for (const m of pseudoMoves(state)) {
    const ns = makeMove(state, m);
    if (!attacked(ns.board, kingSq(ns.board, state.turn), opp)) res.push(m);
  }
  return res;
}
const inCheck = (s: GState) => attacked(s.board, kingSq(s.board, s.turn), s.turn === 'w' ? 'b' : 'w');

/* ===================== ШТУЧНИЙ ІНТЕЛЕКТ (мінімакс + альфа-бета) ===================== */
const VAL: Record<string, number> = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };
function evaluate(s: GState): number {
  let sc = 0;
  for (let i = 0; i < 64; i++) { const p = s.board[i]; if (!p) continue; const v = VAL[p.toUpperCase()]; sc += isW(p) ? v : -v; }
  return sc; // позитив — добре для білих
}
function search(s: GState, depth: number, alpha: number, beta: number): number {
  if (depth === 0) return evaluate(s);
  const moves = legalMoves(s);
  if (moves.length === 0) return inCheck(s) ? (s.turn === 'w' ? -100000 - depth : 100000 + depth) : 0;
  moves.sort((a, b) => (b.cap ? 1 : 0) - (a.cap ? 1 : 0)); // спершу взяття
  if (s.turn === 'w') {
    let best = -Infinity;
    for (const m of moves) { best = Math.max(best, search(makeMove(s, m), depth - 1, alpha, beta)); alpha = Math.max(alpha, best); if (beta <= alpha) break; }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) { best = Math.min(best, search(makeMove(s, m), depth - 1, alpha, beta)); beta = Math.min(beta, best); if (beta <= alpha) break; }
    return best;
  }
}
function bestMove(s: GState, depth: number): Move | null {
  const moves = legalMoves(s);
  if (moves.length === 0) return null;
  moves.sort((a, b) => (b.cap ? 1 : 0) - (a.cap ? 1 : 0));
  let chosen = moves[0]; let bestScore = s.turn === 'w' ? -Infinity : Infinity;
  for (const m of moves) {
    const sc = search(makeMove(s, m), depth - 1, -Infinity, Infinity);
    if (s.turn === 'w' ? sc > bestScore : sc < bestScore) { bestScore = sc; chosen = m; }
  }
  return chosen;
}

/* ===================== ВІЗУАЛ ===================== */
const NAVY = '#0E1A2B', NAVY2 = '#14253B', GOLD = '#EF9F27', GREY = '#C9CDCB', CREAM = '#FFF8EE', BLUE = '#B5D4F4';
const LIGHTSQ = '#E6C98C', DARKSQ = '#B5803A', GRID = 'rgba(20,37,59,0.22)', LBL_LIGHT = '#7a5a1e', LBL_DARK = '#FBEFD6';
const FILES = 'abcdefgh';
const pieceSrc = (p: string) => `/chess/${isW(p) ? 'w' : 'b'}${p.toUpperCase()}.svg`;
const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

type Mode = 'ai' | 'two';

export default function ChessPage() {
  const [state, setState] = useState<GState>(startState);
  const [mode, setMode] = useState<Mode>('ai');
  const [level, setLevel] = useState<number>(2); // 1,2,3 -> глибина 2,3,4
  const [sel, setSel] = useState<number | null>(null);
  const [legal, setLegal] = useState<Move[]>([]);
  const [last, setLast] = useState<{ from: number; to: number } | null>(null);
  const [promo, setPromo] = useState<{ from: number; to: number } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [clock, setClock] = useState({ w: 0, b: 0 });
  const [flip, setFlip] = useState(false);

  const allLegal = useCallback((s: GState) => legalMoves(s), []);
  const depth = level === 1 ? 2 : level === 3 ? 4 : 3;

  // годинник-секундомір: рахує час того, чий хід
  useEffect(() => {
    if (result) return;
    const id = setInterval(() => setClock((c) => ({ ...c, [state.turn]: c[state.turn] + 1 })), 1000);
    return () => clearInterval(id);
  }, [state.turn, result]);

  // перевірка кінця гри
  const checkEnd = useCallback((s: GState) => {
    const moves = legalMoves(s);
    if (moves.length === 0) {
      if (inCheck(s)) setResult(s.turn === 'w' ? 'Мат. Перемогли чорні.' : 'Мат. Перемогли білі.');
      else setResult('Пат — нічия.');
      return true;
    }
    return false;
  }, []);

  const applyMove = useCallback((s: GState, m: Move) => {
    const ns = makeMove(s, m);
    setState(ns); setLast({ from: m.from, to: m.to }); setSel(null); setLegal([]);
    checkEnd(ns);
    return ns;
  }, [checkEnd]);

  // хід комп'ютера
  useEffect(() => {
    if (mode !== 'ai' || result || state.turn !== 'b') return;
    setThinking(true);
    const id = setTimeout(() => {
      const m = bestMove(state, depth);
      if (m) applyMove(state, m);
      setThinking(false);
    }, 120);
    return () => clearTimeout(id);
  }, [state, mode, result, depth, applyMove]);

  const onSquare = (i: number) => {
    if (result || promo) return;
    if (mode === 'ai' && state.turn === 'b') return; // хід комп'ютера
    const p = state.board[i];
    if (sel === null) {
      if (p && colorOf(p) === state.turn) { setSel(i); setLegal(allLegal(state).filter((m) => m.from === i)); }
      return;
    }
    if (i === sel) { setSel(null); setLegal([]); return; }
    const cand = legal.filter((m) => m.to === i);
    if (cand.length === 0) {
      if (p && colorOf(p) === state.turn) { setSel(i); setLegal(allLegal(state).filter((m) => m.from === i)); }
      else { setSel(null); setLegal([]); }
      return;
    }
    if (cand.some((m) => m.promo)) { setPromo({ from: sel, to: i }); return; }
    applyMove(state, cand[0]);
  };

  const choosePromo = (pr: string) => {
    if (!promo) return;
    const m = allLegal(state).find((x) => x.from === promo.from && x.to === promo.to && x.promo === pr);
    if (m) applyMove(state, m);
    setPromo(null);
  };

  const newGame = () => { setState(startState()); setSel(null); setLegal([]); setLast(null); setResult(null); setClock({ w: 0, b: 0 }); setPromo(null); };

  const checkSq = inCheck(state) ? kingSq(state.board, state.turn) : -1;
  const order = flip ? [...Array(64).keys()].reverse() : [...Array(64).keys()];
  const status = result ? result
    : thinking ? 'Комп\u2019ютер думає\u2026'
      : `Хід: ${state.turn === 'w' ? 'білі' : 'чорні'}${inCheck(state) ? ' — шах!' : ''}`;

  const btn: React.CSSProperties = { fontFamily: 'Montserrat, sans-serif', fontSize: 17, padding: '12px 18px', borderRadius: 12, border: `2px solid ${NAVY2}`, background: CREAM, color: NAVY, cursor: 'pointer', fontWeight: 600 };
  const btnActive: React.CSSProperties = { ...btn, background: GOLD, color: NAVY, borderColor: GOLD };

  return (
    <div style={{ background: CREAM, color: NAVY, padding: '32px 5% calc(88px + env(safe-area-inset-bottom,0px))', fontFamily: 'Montserrat, sans-serif' }}>
      <h1 style={{ fontFamily: 'Lora, serif', fontSize: 34, margin: '0 0 6px', color: NAVY }}>Шахи</h1>
      <p style={{ fontSize: 18, lineHeight: 1.5, margin: '0 0 20px', maxWidth: 620, color: NAVY2 }}>
        Грайте проти комп\u2019ютера (три рівні) або вдвох на одному пристрої. Спокійно, без поспіху — тренування планування й передбачення ходів.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <button style={mode === 'ai' ? btnActive : btn} onClick={() => { setMode('ai'); newGame(); }}>Проти комп\u2019ютера</button>
        <button style={mode === 'two' ? btnActive : btn} onClick={() => { setMode('two'); newGame(); }}>Удвох</button>
      </div>

      {mode === 'ai' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 600 }}>Рівень:</span>
          {[1, 2, 3].map((l) => (
            <button key={l} style={level === l ? btnActive : btn} onClick={() => setLevel(l)}>{l === 1 ? 'Легкий' : l === 2 ? 'Середній' : 'Складний'}</button>
          ))}
        </div>
      )}

      {/* годинник */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ background: state.turn === 'b' && !result ? GOLD : NAVY2, color: state.turn === 'b' && !result ? NAVY : BLUE, padding: '8px 16px', borderRadius: 10, fontSize: 20, fontWeight: 700, minWidth: 130, textAlign: 'center' }}>
          Чорні&nbsp;&nbsp;{fmtTime(clock.b)}
        </div>
        <div style={{ background: state.turn === 'w' && !result ? GOLD : NAVY2, color: state.turn === 'w' && !result ? NAVY : BLUE, padding: '8px 16px', borderRadius: 10, fontSize: 20, fontWeight: 700, minWidth: 130, textAlign: 'center' }}>
          Білі&nbsp;&nbsp;{fmtTime(clock.w)}
        </div>
      </div>

      <p style={{ fontSize: 21, fontWeight: 700, margin: '0 0 14px', color: inCheck(state) && !result ? '#B5710C' : NAVY }}>{status}</p>

      {/* дошка */}
      <div style={{ width: 'min(92vw, 560px)', height: 'min(92vw, 560px)', aspectRatio: '1 / 1', border: `2px solid ${NAVY}`, borderRadius: 6, overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)', boxShadow: '0 6px 20px rgba(14,26,43,0.18)' }}>
        {order.map((i) => {
          const [r, c] = rc(i);
          const lightSq = (r + c) % 2 === 0;
          const bg = lightSq ? LIGHTSQ : DARKSQ;
          const p = state.board[i];
          const isSel = sel === i;
          const isTarget = legal.some((m) => m.to === i);
          const isLast = last && (last.from === i || last.to === i);
          const isChk = i === checkSq;
          return (
            <div key={i} onClick={() => onSquare(i)} style={{ position: 'relative', minWidth: 0, minHeight: 0, background: bg, boxShadow: `inset 0 0 0 0.5px ${GRID}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (mode === 'ai' && state.turn === 'b') || result ? 'default' : 'pointer' }}>
              {isLast && <div style={{ position: 'absolute', inset: 0, background: 'rgba(181,113,12,0.35)' }} />}
              {isSel && <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,26,43,0.30)' }} />}
              {isChk && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(226,75,74,0.75) 30%, transparent 70%)' }} />}
              {p && <img src={pieceSrc(p)} alt="" draggable={false} style={{ width: '86%', height: '86%', position: 'relative', userSelect: 'none' }} />}
              {isTarget && !p && <div style={{ position: 'absolute', width: '32%', height: '32%', borderRadius: '50%', background: 'rgba(14,26,43,0.35)' }} />}
              {isTarget && p && <div style={{ position: 'absolute', inset: 0, border: '4px solid rgba(14,26,43,0.5)', borderRadius: 4 }} />}
              {/* координати */}
              {c === (flip ? 7 : 0) && <span style={{ position: 'absolute', top: 2, left: 3, fontSize: 11, fontWeight: 700, color: lightSq ? LBL_LIGHT : LBL_DARK }}>{8 - r}</span>}
              {r === (flip ? 0 : 7) && <span style={{ position: 'absolute', bottom: 1, right: 3, fontSize: 11, fontWeight: 700, color: lightSq ? LBL_LIGHT : LBL_DARK }}>{FILES[c]}</span>}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
        <button style={btn} onClick={newGame}>Нова гра</button>
        <button style={btn} onClick={() => setFlip((f) => !f)}>Перевернути дошку</button>
      </div>

      {/* вибір фігури при перетворенні пішака */}
      {promo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,26,43,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: CREAM, borderRadius: 16, padding: 24, textAlign: 'center', maxWidth: 360 }}>
            <p style={{ fontFamily: 'Lora, serif', fontSize: 22, margin: '0 0 16px', color: NAVY }}>Оберіть фігуру</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {['Q', 'R', 'B', 'N'].map((pr) => (
                <button key={pr} onClick={() => choosePromo(pr)} style={{ width: 64, height: 64, background: GOLD, border: `2px solid ${NAVY2}`, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={`/chess/${state.turn}${pr}.svg`} alt={pr} style={{ width: '80%', height: '80%' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* модальний результат */}
      {result && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,26,43,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: CREAM, borderRadius: 18, padding: '32px 36px', textAlign: 'center', maxWidth: 420, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <p style={{ fontFamily: 'Lora, serif', fontSize: 28, margin: '0 0 8px', color: NAVY }}>Гру завершено</p>
            <p style={{ fontSize: 20, margin: '0 0 22px', color: NAVY2 }}>{result}</p>
            <button style={{ ...btnActive, fontSize: 19, padding: '14px 28px' }} onClick={newGame}>Реванш</button>
          </div>
        </div>
      )}
    </div>
  );
}

'@

Write-Host 'Додаю картку «Шахи» на /games...' -ForegroundColor Cyan
$gp = 'app\games\page.tsx'
$g = [System.IO.File]::ReadAllText((Join-Path (Get-Location) $gp))
if ($g -notmatch "/games/chess") {
  $icon = @'
    case 'chess':
      return (<svg {...p}><g fill="none" stroke={GOLD_LIGHT} strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round"><path d="M24 6 v6 M21 9 h6"/><path d="M24 14 c-5 0 -8 4 -8 8 l2 12 h12 l2 -12 c0 -4 -3 -8 -8 -8 z"/><path d="M14 38 h20 v4 h-20 z"/></g></svg>)
'@
  $card = @'
  { href: '/games/chess', kind: 'chess', title: 'Шахи', desc: 'Класичні шахи — проти комп’ютера (три рівні) або вдвох. Тренують планування й передбачення ходів.' },
'@
  $g = $g.Replace("    default:", $icon + "`n    default:")
  $g = $g.Replace("  { href: '/games/checkers',", $card + "`n  { href: '/games/checkers',")
  [System.IO.File]::WriteAllText((Join-Path (Get-Location) $gp), $g, $utf8)
  Write-Host '  + картку додано'
} else { Write-Host '  = картка вже є, пропускаю' }

Write-Host 'Додаю /games/chess у sitemap...' -ForegroundColor Cyan
$sp = 'app\sitemap.ts'
$s = [System.IO.File]::ReadAllText((Join-Path (Get-Location) $sp))
if ($s -notmatch "/games/chess") {
  $sm = @'
    { url: `${BASE_URL}/games/chess`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
'@
  $anchor = '    { url: `${BASE_URL}/games/checkers`,'
  $s = $s.Replace($anchor, $sm + "`n" + $anchor)
  [System.IO.File]::WriteAllText((Join-Path (Get-Location) $sp), $s, $utf8)
  Write-Host '  + рядок sitemap додано'
} else { Write-Host '  = sitemap вже має /games/chess, пропускаю' }

Write-Host 'Коміт і пуш...' -ForegroundColor Cyan
git add -A
git commit -m "Шахи: гра з фігурами Staunty (золото-сіра дошка), картка та sitemap"
git push origin main
Write-Host ''
Write-Host 'ГОТОВО. Перевір сторінку /games/chess на сайті (приватне вікно або Ctrl+F5).' -ForegroundColor Green
