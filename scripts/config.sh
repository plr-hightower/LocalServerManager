#!/bin/bash
# scripts/config.sh

# 1. Dynamically compute the absolute path to the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 2. Safely load variables from the root .env file if it exists
if [ -f "$PROJECT_ROOT/.env" ]; then
  # Export lines that aren't empty or comments
  export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
else
  echo "⚠️ Warning: No .env file found at $PROJECT_ROOT/.env"
fi

# 3. Centralized Directory Paths (Using absolute roots)
export MIGRATIONS_DIR="${MIGRATIONS_DIR:-$PROJECT_ROOT/backend/src/db/migrations}"
export IMAGES_DIR="${IMAGES_DIR:-$PROJECT_ROOT/images}"

# 4. Fallback defaults (Used only if they aren't explicitly set in your .env)
export DB_USER="${DB_USER:-hightower-admin}"
export DB_NAME="${DB_NAME:-hightower}"
export DB_EXPOSE_PORT="${DB_EXPOSE_PORT:-3306}"
export BACKEND_PORT="${BACKEND_PORT:-8080}"