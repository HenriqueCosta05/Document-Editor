#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$ROOT_DIR/server"
CLIENT_DIR="$ROOT_DIR/client"

if [ -f "$SERVER_DIR/.venv/Scripts/python.exe" ]; then
    PYTHON="$SERVER_DIR/.venv/Scripts/python.exe"
    PIP="$SERVER_DIR/.venv/Scripts/pip.exe"
    DAPHNE="$SERVER_DIR/.venv/Scripts/daphne.exe"
else
    PYTHON="$SERVER_DIR/.venv/bin/python"
    PIP="$SERVER_DIR/.venv/bin/pip"
    DAPHNE="$SERVER_DIR/.venv/bin/daphne"
fi

# -- install --
if [ ! -d "$CLIENT_DIR/node_modules" ]; then
    echo "== Installing client dependencies =="
    (cd "$CLIENT_DIR" && npm install)
fi

if [ ! -f "$PYTHON" ]; then
    echo "== Setting up server virtualenv =="
    (cd "$SERVER_DIR" && python -m venv .venv)
    "$PIP" install --upgrade pip
    "$PIP" install -r "$SERVER_DIR/requirements-dev.txt"
fi

# -- init --
echo "== Running migrations =="
(cd "$SERVER_DIR" && "$PYTHON" manage.py migrate)

echo "== Seeding demo document =="
(cd "$SERVER_DIR" && "$PYTHON" manage.py seed_demo_document)

# -- start --
DAPHNE_PID=""
CLIENT_A_PID=""
cleanup() {
    echo "== Stopping backend and clients =="
    [ -n "$CLIENT_A_PID" ] && kill "$CLIENT_A_PID" 2>/dev/null || true
    [ -n "$DAPHNE_PID" ] && kill "$DAPHNE_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "== Starting Django Channels backend (http://localhost:8000) =="
(cd "$SERVER_DIR" && "$DAPHNE" -p 8000 config.asgi:application) &
DAPHNE_PID=$!

echo "== Starting client A (http://localhost:3000) =="
(cd "$CLIENT_DIR" && PORT=3000 npm run dev) &
CLIENT_A_PID=$!

echo "== Starting client B (http://localhost:3001) =="
(cd "$CLIENT_DIR" && PORT=3001 npm run dev)
