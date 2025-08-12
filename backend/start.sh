#!/bin/bash

# Backend-only startup script
# Run this from anywhere - it will always find the correct directory

# Get the directory where this script is located (should be backend/)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "🚀 Starting ProCost Backend from: $SCRIPT_DIR"

# Ensure we're in the backend directory
cd "$SCRIPT_DIR"

# Kill existing processes
pkill -f "com.procost.api.ProCostApplication" 2>/dev/null || true
lsof -ti :8082 | xargs kill -9 2>/dev/null || true

# Wait a moment
sleep 2

# Start the backend
echo "Starting from: $(pwd)"
mvn spring-boot:run -Dmaven.multiModuleProjectDirectory="$SCRIPT_DIR"