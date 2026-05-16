#!/bin/bash
# scripts/load_images.sh

# Fallback cleanly to the environment value calculated by config.sh
TARGET_DIR=${1:-${IMAGES_DIR:-./images}}

echo "Loading images from $TARGET_DIR..."

for tar in "$TARGET_DIR"/*.tar; do
  [ -e "$tar" ] || continue
  echo "Loading $tar..."
  docker load -i "$tar"
done

echo "Done:"
docker images