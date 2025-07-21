#!/bin/bash

# Start Backend
echo "Starting backend server..."
cd "$(dirname "$0")/backend" && mvn spring-boot:run &
BACKEND_PID=$!

# Start Frontend
echo "Starting frontend server..."
cd "$(dirname "$0")/frontend" && npm start &
FRONTEND_PID=$!

# Setup trap to kill both processes when the script is terminated
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM EXIT

# Keep the script running
wait 