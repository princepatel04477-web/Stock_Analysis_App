#!/bin/bash
set -e

echo "Starting NiftyPulse backend..."
cd /home/runner/workspace
uvicorn backend.server:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Starting NiftyPulse frontend..."
npm run dev &
FRONTEND_PID=$!

wait $BACKEND_PID $FRONTEND_PID
