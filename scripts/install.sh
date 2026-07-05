#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "== Installing client dependencies =="
(cd "$ROOT_DIR/client" && npm install)

echo "== Setting up server virtualenv =="
cd "$ROOT_DIR/server"
python -m venv .venv

if [ -f .venv/Scripts/pip.exe ]; then
    PIP=.venv/Scripts/pip.exe
else
    PIP=.venv/bin/pip
fi

"$PIP" install --upgrade pip
"$PIP" install -r requirements-dev.txt

echo "== Done. Run scripts/init.sh next. =="
