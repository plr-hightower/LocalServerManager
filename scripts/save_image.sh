#!/bin/bash
# scripts/save-image.sh
GAME=$1
IMAGE=$2

echo "Saving $IMAGE → images/$GAME.tar..."
docker save $IMAGE -o ./images/$GAME.tar
echo "Done — $(du -sh ./images/$GAME.tar | cut -f1)"

#./scripts/save-image.sh minecraft itzg/minecraft-server:2024.1.0