#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$ROOT_DIR/server/.venv/Scripts/daphne.exe" ]; then
    DAPHNE="$ROOT_DIR/server/.venv/Scripts/daphne.exe"
else
    DAPHNE="$ROOT_DIR/server/.venv/bin/daphne"
fi

DAPHNE_PID=""
cleanup() {
    if [ -n "$DAPHNE_PID" ]; then
        echo "== Stopping backend =="
        kill "$DAPHNE_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT

echo "== Starting Django Channels backend (http://localhost:8000) =="
(cd "$ROOT_DIR/server" && "$DAPHNE" -p 8000 config.asgi:application) &
DAPHNE_PID=$!

echo "== Starting client dev server (http://localhost:3000) =="
cd "$ROOT_DIR/client"
npm run dev
