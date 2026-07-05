#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/server"

if [ -f .venv/Scripts/python.exe ]; then
    PYTHON=.venv/Scripts/python.exe
else
    PYTHON=.venv/bin/python
fi

echo "== Running migrations =="
"$PYTHON" manage.py migrate

echo "== Seeding demo document =="
"$PYTHON" manage.py seed_demo_document

echo "== Done. Start the backend with: (cd server && .venv/Scripts/daphne -p 8000 config.asgi:application) =="
echo "== Start the client with: (cd client && npm run dev) =="
