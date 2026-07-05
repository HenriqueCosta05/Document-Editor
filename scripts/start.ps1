$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $PSScriptRoot
$ServerDir = Join-Path $RootDir "server"
$ClientDir = Join-Path $RootDir "client"

Write-Host "== Starting Django Channels backend (http://localhost:8000) =="
$daphne = Start-Process -FilePath (Join-Path $ServerDir ".venv\Scripts\daphne.exe") `
    -ArgumentList "-p", "8000", "config.asgi:application" `
    -WorkingDirectory $ServerDir -NoNewWindow -PassThru

try {
    Write-Host "== Starting client dev server (http://localhost:3000) =="
    Push-Location $ClientDir
    npm run dev
} finally {
    Pop-Location
    if ($daphne -and -not $daphne.HasExited) {
        Write-Host "== Stopping backend =="
        Stop-Process -Id $daphne.Id -Force
    }
}
