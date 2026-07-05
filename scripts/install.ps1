$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $PSScriptRoot

Write-Host "== Installing client dependencies =="
Push-Location (Join-Path $RootDir "client")
npm install
Pop-Location

Write-Host "== Setting up server virtualenv =="
Push-Location (Join-Path $RootDir "server")
python -m venv .venv
& ".venv\Scripts\pip.exe" install --upgrade pip
& ".venv\Scripts\pip.exe" install -r requirements-dev.txt
Pop-Location

Write-Host "== Done. Run scripts/init.ps1 next. =="
