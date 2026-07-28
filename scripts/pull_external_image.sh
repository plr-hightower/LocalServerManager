#!/bin/bash
NAME=$1
IMAGE=$2
OUTPUT_DIR=${3:-./images}

echo "Pulling $IMAGE..."
docker pull $IMAGE

echo "Saving to $OUTPUT_DIR/$NAME.tar..."
docker save $IMAGE -o $OUTPUT_DIR/$NAME.tar

echo "Done , $OUTPUT_DIR/$NAME.tar"

#How to use
#./scripts/pull_external_image.sh minecraft itzg/minecraft-server:2026.7.0-java21
#./scripts/pull_external_image.sh valheim ich777/valheim:2023.12.0
# becomes for example minecraft.tar -> which is our image