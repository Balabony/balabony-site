# Test LiqPay webhook simulation
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$WebhookUrl = "https://balabony-site-git-feature-payment-flow-balabony.vercel.app/api/webhook/liqpay"
$EnvFile = ".env.local"

if (-not (Test-Path $EnvFile)) {
    Write-Error "No .env.local found"
    exit 1
}

$envLines = Get-Content $EnvFile
$privateKey = $null
foreach ($line in $envLines) {
    if ($line -match "^LIQPAY_PRIVATE_KEY=(.+)$") {
        $privateKey = $matches[1].Trim().Trim('"').Trim("'")
        break
    }
}

if (-not $privateKey) {
    Write-Error "LIQPAY_PRIVATE_KEY not found in .env.local"
    exit 1
}

Write-Host "OK: LIQPAY_PRIVATE_KEY loaded, length=$($privateKey.Length)" -ForegroundColor Green

$userId = "d6503de8-8b51-4269-95da-4c0b60c13b8"
$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$orderId = "sub_${userId}_${timestamp}"

$payload = @{
    version = 3
    public_key = "test"
    action = "pay"
    amount = 129
    currency = "UAH"
    description = "Manual webhook test"
    order_id = $orderId
    status = "sandbox"
    payment_id = 9999999999
    transaction_id = 9999999999
    type = "buy"
} | ConvertTo-Json -Compress

Write-Host "OK: payload ready, order_id=$orderId" -ForegroundColor Green

$dataBytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
$dataBase64 = [Convert]::ToBase64String($dataBytes)

$signString = $privateKey + $dataBase64 + $privateKey
$sha1 = [System.Security.Cryptography.SHA1]::Create()
$hashBytes = $sha1.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($signString))
$signature = [Convert]::ToBase64String($hashBytes)

Write-Host "OK: signature generated" -ForegroundColor Green
Write-Host ""
Write-Host "POST to $WebhookUrl" -ForegroundColor Cyan

$body = @{
    data = $dataBase64
    signature = $signature
}

try {
    $response = Invoke-WebRequest -Uri $WebhookUrl -Method POST -Body $body -ContentType "application/x-www-form-urlencoded" -ErrorAction Stop
    Write-Host ""
    Write-Host "===== RESULT =====" -ForegroundColor Yellow
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Body:"
    Write-Host $response.Content
} catch {
    Write-Host ""
    Write-Host "===== ERROR =====" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Body:"
        Write-Host $errorBody
    } else {
        Write-Host $_.Exception.Message
    }
}

Write-Host ""
Write-Host "Check app_subscriptions in Supabase for order_id=$orderId" -ForegroundColor Cyan
