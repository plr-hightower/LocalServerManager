#!/bin/bash
# scripts/fetch_all_images.sh
#
# Pulls, saves, and loads the Docker image for every supported game in one
# shot — combines pull_external_image.sh + load_images.sh so you don't have
# to run one game at a time.
#
# Image references are read directly from backend/src/services/games/*.ts,
# so this script never drifts out of sync with what the app actually uses —
# add a new game there and this script picks it up automatically, no manual
# list to update here.
#
# Usage:
#   ./scripts/fetch_all_images.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

GAMES_DIR="$PROJECT_ROOT/backend/src/services/games"
mkdir -p "$IMAGES_DIR"

for service_file in "$GAMES_DIR"/*.service.ts; do
  name="$(basename "$service_file" .service.ts)"
  # `|| true` matters here: under pipefail, a no-match from grep (exit 1)
  # would otherwise propagate through the pipeline and trip `set -e`,
  # killing the whole script before the empty-check below ever runs.
  image="$(grep -oP "image:\s*'\K[^']+" "$service_file" | head -n1 || true)"

  if [ -z "$image" ]; then
    echo "⚠️  No image found in $service_file — skipping"
    continue
  fi

  echo ""
  echo "=== $name ($image) ==="
  "$SCRIPT_DIR/pull_external_image.sh" "$name" "$image" "$IMAGES_DIR"
done

echo ""
echo "=== Loading all saved images into Docker ==="
"$SCRIPT_DIR/load_images.sh" "$IMAGES_DIR"

echo ""
echo "All game images pulled, saved to $IMAGES_DIR, and loaded — ready for the backend to use."
