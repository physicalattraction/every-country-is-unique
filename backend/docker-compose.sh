#!/bin/bash

# Set build arguments
export BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
export VCS_REF=$(git rev-parse HEAD)

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
