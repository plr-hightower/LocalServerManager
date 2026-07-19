#!/bin/bash
# scripts/fetch_all_images.sh
#
# Pulls (or builds), saves, and loads the Docker image for every supported
# game in one shot — combines pull_external_image.sh + load_images.sh so you
# don't have to run one game at a time.
#
# Image references are read directly from backend/src/services/games/*.ts,
# so this script never drifts out of sync with what the app actually uses —
# add a new game there and this script picks it up automatically, no manual
# list to update here.
#
# A game with its own docker/<name>/Dockerfile (e.g. a locally-patched fork
# of an upstream image) is built instead of pulled.
#
# Usage:
#   ./scripts/fetch_all_images.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

GAMES_DIR="$PROJECT_ROOT/backend/src/services/games"
mkdir -p "$IMAGES_DIR"

# Tracks which image reference was pulled for each game last time, so a game
# switching to a different image gets its old, now-unused image removed
# instead of silently left behind taking up disk space.
IMAGE_REFS_FILE="$IMAGES_DIR/.image-refs"
touch "$IMAGE_REFS_FILE"

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

  # Same reasoning as above: grep finding no match for this game (e.g. first
  # run, nothing recorded yet) must not trip set -e.
  old_image="$(grep "^$name=" "$IMAGE_REFS_FILE" 2>/dev/null | cut -d= -f2- || true)"

  if [ -n "$old_image" ] && [ "$old_image" != "$image" ]; then
    echo ""
    echo "=== $name: image changed ($old_image -> $image) — removing old image ==="
    docker rmi "$old_image" 2>/dev/null || echo "  (old image not present locally / still in use by a container, leaving it)"
  fi

  echo ""
  echo "=== $name ($image) ==="

  # A game with its own docker/<name>/Dockerfile is built locally (e.g. a
  # fixed fork of an upstream image) instead of pulled from a registry —
  # nothing to pull for those, since the image only exists once we build it.
  BUILD_CONTEXT="$PROJECT_ROOT/docker/$name"
  if [ -f "$BUILD_CONTEXT/Dockerfile" ]; then
    echo "Building $image from $BUILD_CONTEXT..."
    docker build -t "$image" "$BUILD_CONTEXT"
    docker save "$image" -o "$IMAGES_DIR/$name.tar"
    echo "Saved to $IMAGES_DIR/$name.tar"
  else
    "$SCRIPT_DIR/pull_external_image.sh" "$name" "$image" "$IMAGES_DIR"
  fi

  # Record the image we just pulled for next run's comparison. `grep -v`
  # exits 1 (tripping set -e) if nothing matches to keep — e.g. a brand new
  # refs file — so this also needs `|| true`.
  grep -v "^$name=" "$IMAGE_REFS_FILE" > "$IMAGE_REFS_FILE.tmp" 2>/dev/null || true
  echo "$name=$image" >> "$IMAGE_REFS_FILE.tmp"
  mv "$IMAGE_REFS_FILE.tmp" "$IMAGE_REFS_FILE"
done

echo ""
echo "=== Loading all saved images into Docker ==="
"$SCRIPT_DIR/load_images.sh" "$IMAGES_DIR"

echo ""
echo "All game images pulled, saved to $IMAGES_DIR, and loaded — ready for the backend to use."
