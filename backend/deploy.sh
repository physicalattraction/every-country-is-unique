#!/bin/bash

# Exit on error
set -e

# Get current git commit hash
GIT_HASH=$(git rev-parse HEAD)
GIT_DATE=$(git show -s --format=%ci HEAD)

echo "Deploying commit: $GIT_HASH from $GIT_DATE"

echo "Stopping and removing containers..."
./docker-compose.sh down -v # -v removes volumes

echo "Removing application image..."
docker rmi -f every-country-is-unique-backend-api:latest || true

echo "Pruning unused images..."
docker image prune -f

echo "Fetching latest code..."
git fetch origin
git reset --hard origin/main
git pull

echo "Building containers without cache..."
./docker-compose.sh build --no-cache --progress=plain

echo "Starting containers..."
./docker-compose.sh up -d

# Verify the running container
echo "Verifying container..."
MAX_ATTEMPTS=60
ATTEMPT=1
while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    if docker logs api-every-country-is-unique 2>&1 | grep -q "Nest application successfully started"; then
        echo "Application is running successfully!"
        break
    fi
    if [ $((ATTEMPT % 10)) -eq 0 ]; then
        echo "Waiting for application to start... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
    fi
    sleep 0.5
    ATTEMPT=$((ATTEMPT + 1))
done

if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
    echo "Error: Application failed to start within the expected time"
    echo "Check logs for more details: docker logs api-every-country-is-unique"
    exit 1
fi

# Check the logs
echo "Checking application logs..."
docker logs -f api-every-country-is-unique
