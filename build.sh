#!/usr/bin/env bash

trap 'exit' ERR

GIT_ID=$(git rev-parse --short HEAD)

PROJECT="wiki-140001"
IMAGE_ID="ckt-service"
IMAGE_NAME="$IMAGE_ID:$GIT_ID"

echo "Building docker image: $IMAGE_NAME"
docker build -t $IMAGE_NAME .

if [ "$1" = "push" ]; then
  # tag and upload to registry
  docker tag -f $IMAGE_NAME gcr.io/$PROJECT/$IMAGE_NAME
  docker tag -f $IMAGE_NAME gcr.io/$PROJECT/$IMAGE_ID:latest
  gcloud docker push gcr.io/$PROJECT/$IMAGE_NAME
  gcloud docker push gcr.io/$PROJECT/$IMAGE_ID:latest
fi
