#!/bin/bash

# Exit on error
set -e

# Parse arguments
RUN_MIGRATIONS=false
while [[ "$#" -gt 0 ]]; do
    case $1 in
    -m | --migrate)
        RUN_MIGRATIONS=true
        shift
        ;;
    *)
        echo "Unknown parameter: $1"
        exit 1
        ;;
    esac
done

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

if [ "$RUN_MIGRATIONS" = true ]; then
    echo "Starting containers in migration mode..."
    # Start the database
    ./docker-compose.sh up -d postgres

    # Start the API container with a temporary command that keeps it alive
    docker-compose run -d --name api-every-country-is-unique api sleep infinity

    # Wait a bit for the database to be ready
    echo "Waiting for database to be ready..."
    sleep 5

    echo "Running database migrations..."
    if ! docker exec api-every-country-is-unique npm run migration:run; then
        echo "Error: Migrations failed"
        docker rm -f api-every-country-is-unique
        exit 1
    fi
    echo "Migrations completed successfully!"

    # Clean up the temporary container
    docker rm -f api-every-country-is-unique
fi

echo "Starting containers normally..."
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
