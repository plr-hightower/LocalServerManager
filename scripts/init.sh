#!/bin/bash
set -e
source ./scripts/config.sh

echo "================================"
echo "  Server Project — Init Script  "
echo "================================"

# ── 1. start Docker if not running ──────────────────────────
echo ""
echo "[1/4] Checking Docker..."
if ! docker info > /dev/null 2>&1; then
  echo "Docker not running — starting it..."
  sudo systemctl start docker
  sleep 3  # give it a moment to fully start
fi
echo "Docker is running"

# ── 2. load game images ──────────────────────────────────────
echo ""
echo "[2/4] Loading game images..."
./scripts/load_images.sh

# ── 3. start containers ──────────────────────────────────────
echo ""
echo "[3/4] Starting containers..."
docker compose up -d --build

# ── 4. run migrations ────────────────────────────────────────
echo ""
echo "[4/4] Running migrations..."
./scripts/migration.sh

echo ""
echo "================================"
echo "  Done — everything is running  "
echo "================================"
echo ""
echo "Frontend: http://localhost:$BACKEND_PORT"
echo "API:      http://localhost:$BACKEND_PORT/api"
echo "Database: localhost:$DB_EXPOSE_PORT"