#!/bin/bash
set -e

# Load global configuration and environment secrets
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

echo "================================"
echo "  Server Project — Init Script  "
echo "================================"

# ── 1. Start Docker if not running ──────────────────────────
echo ""
echo "[1/4] Checking Docker..."
if ! docker info > /dev/null 2>&1; then
  echo "Docker not running — starting it..."
  sudo systemctl start docker
  sleep 3  
fi
echo "Docker is running"

# ── 2. Load game images ──────────────────────────────────────
echo ""
echo "[2/4] Loading game images..."
"$PROJECT_ROOT/scripts/load_images.sh" "$IMAGES_DIR"

# ── 3. Start containers ──────────────────────────────────────
echo ""
echo "[3/4] Starting containers..."
cd "$PROJECT_ROOT"
docker compose up -d --build

# ── 4. Run migrations ────────────────────────────────────────
echo ""
echo "[4/4] Running migrations..."
"$PROJECT_ROOT/scripts/migration.sh"

echo ""
echo "================================"
echo "  Done — everything is running  "
echo "================================"
echo ""
echo "Frontend: http://localhost"
echo "API:      http://localhost/api  (backend internal port: $BACKEND_PORT)"
echo "Database: localhost:$DB_EXPOSE_PORT"