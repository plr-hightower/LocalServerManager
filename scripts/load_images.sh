#!/bin/bash
#just call it (can optionaly pass the path to images)
IMAGES_DIR=${1:-./images}   # default to ./images, or pass a path

echo "Loading images from $IMAGES_DIR..."

for tar in $IMAGES_DIR/*.tar; do
  echo "Loading $tar..."
  docker load -i "$tar"
done

echo "Done:"
docker images