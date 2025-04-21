#!/bin/bash

# Source the environment file
if [ -f "./environment/.env.${NODE_ENV:-development}" ]; then
    set -a
    source "./environment/.env.${NODE_ENV:-development}"
    set +a
else
    echo "Error: Environment file ./environment/.env.${NODE_ENV:-development} not found"
    exit 1
fi

# Set build arguments
export BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
export VCS_REF=$(git rev-parse HEAD)

# Check for required environment variables
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    echo "Error: NEXT_PUBLIC_API_URL environment variable is not set"
    exit 1
fi

# Handle the commands
if [ "$1" = "down" ]; then
    # For down command, we don't need the build arguments
    docker-compose down
elif [ "$1" = "up" ]; then
    # For up command, pass all arguments to docker-compose
    docker-compose up "${@:2}"
else
    # For all other commands, pass them through
    docker-compose "$@"
fi
