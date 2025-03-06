#!/bin/bash

# Kill any existing server processes
pkill -f "node backend/server.js" || true

# Change to the backend directory and start the server
cd backend
node server.js 