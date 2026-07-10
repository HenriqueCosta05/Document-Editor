$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $PSScriptRoot
$ServerDir = Join-Path $RootDir "server"
$ClientDir = Join-Path $RootDir "client"
$Python = Join-Path $ServerDir ".venv\Scripts\python.exe"
$Pip = Join-Path $ServerDir ".venv\Scripts\pip.exe"
$Daphne = Join-Path $ServerDir ".venv\Scripts\daphne.exe"

# -- install --
if (-not (Test-Path (Join-Path $ClientDir "node_modules"))) {
    Write-Host "== Installing client dependencies =="
    Push-Location $ClientDir
    npm install
    Pop-Location
}

if (-not (Test-Path $Python)) {
    Write-Host "== Setting up server virtualenv =="
    Push-Location $ServerDir
    python -m venv .venv
    Pop-Location
    & $Pip install --upgrade pip
    & $Pip install -r (Join-Path $ServerDir "requirements-dev.txt")
}

# -- init --
Write-Host "== Running migrations =="
& $Python (Join-Path $ServerDir "manage.py") migrate

Write-Host "== Seeding demo document =="
& $Python (Join-Path $ServerDir "manage.py") seed_demo_document

# -- start --
Write-Host "== Starting Django Channels backend (http://localhost:8000) =="
$daphne = Start-Process -FilePath $Daphne -ArgumentList "-p", "8000", "config.asgi:application" `
    -WorkingDirectory $ServerDir -NoNewWindow -PassThru

$clientA = $null
try {
    Write-Host "== Starting client A (http://localhost:3000) =="
    $env:PORT = "3000"
    $clientA = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev" `
        -WorkingDirectory $ClientDir -NoNewWindow -PassThru

    Write-Host "== Starting client B (http://localhost:3001) =="
    Push-Location $ClientDir
    $env:PORT = "3001"
    npm run dev
} finally {
    Pop-Location
    Remove-Item Env:\PORT -ErrorAction SilentlyContinue
    if ($clientA -and -not $clientA.HasExited) {
        Write-Host "== Stopping client A =="
        Stop-Process -Id $clientA.Id -Force
    }
    if ($daphne -and -not $daphne.HasExited) {
        Write-Host "== Stopping backend =="
        Stop-Process -Id $daphne.Id -Force
    }
}
