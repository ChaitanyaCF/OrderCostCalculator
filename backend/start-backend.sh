#!/bin/bash

# Backend Startup Script for ProCost Application
# This ensures the backend always starts from the correct directory

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "Starting ProCost Backend..."
echo "Script location: $SCRIPT_DIR"
echo "Current directory before change: $(pwd)"

# Change to the backend directory
cd "$SCRIPT_DIR"

echo "Changed to backend directory: $(pwd)"

# Verify we're in the correct directory by checking for pom.xml
if [ ! -f "pom.xml" ]; then
    echo "ERROR: pom.xml not found in current directory!"
    echo "Make sure this script is in the backend directory."
    exit 1
fi

# Verify the correct pom.xml (check for procost-api artifactId)
if ! grep -q "procost-api" pom.xml; then
    echo "ERROR: Wrong pom.xml detected!"
    echo "This doesn't appear to be the backend pom.xml"
    exit 1
fi

echo "✓ Verified correct backend directory and pom.xml"

# Kill any existing backend processes
echo "Checking for existing backend processes..."
if pgrep -f "com.procost.api.ProCostApplication" > /dev/null; then
    echo "Found existing backend process. Killing it..."
    pkill -f "com.procost.api.ProCostApplication"
    sleep 3
fi

# Start the backend with explicit directory settings
echo "Starting Maven Spring Boot application..."
mvn spring-boot:run \
    -Dmaven.multiModuleProjectDirectory="$SCRIPT_DIR" \
    -Dspring.profiles.active=local

echo "Backend startup script completed."