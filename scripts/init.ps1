$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $PSScriptRoot

Push-Location (Join-Path $RootDir "server")

Write-Host "== Running migrations =="
& ".venv\Scripts\python.exe" manage.py migrate

Write-Host "== Seeding demo document =="
& ".venv\Scripts\python.exe" manage.py seed_demo_document

Pop-Location

Write-Host "== Done. Start the backend with: cd server; .venv\Scripts\daphne -p 8000 config.asgi:application =="
Write-Host "== Start the client with: cd client; npm run dev =="
