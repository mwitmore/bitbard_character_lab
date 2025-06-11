#!/bin/bash

# Function to kill process on specified port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "Killing process $pid on port $port"
        kill -9 $pid 2>/dev/null || true
        sleep 2
    fi
}

# Function to start the server
start_server() {
    local character_file=$1
    echo "Starting server with character: $character_file"
    NODE_OPTIONS="--max-old-space-size=4096" CACHE_STORE=filesystem CACHE_DIR=$(pwd)/data SERVER_PORT=3000 pnpm start --character "$character_file"
}

# Function to start the client
start_client() {
    echo "Starting client..."
    cd client && SERVER_PORT=3000 pnpm dev
}

# Cleanup function
cleanup() {
    echo "Cleaning up..."
    kill_port 3000  # Server port
    kill_port 3001  # Client port
    kill_port 5173  # Vite default port
    kill_port 5174  # Vite fallback port
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM EXIT

# Main script
if [ -z "$1" ]; then
    # Default to Lady Macbeth character if no argument provided
    CHARACTER_FILE="../characters/ladymacbethcopy.character.json"
    echo "No character file specified, using default: $CHARACTER_FILE"
else
    CHARACTER_FILE="$1"
fi

# Kill any existing processes on ports
kill_port 3000  # Server port
kill_port 3001  # Client port
kill_port 5173  # Vite default port
kill_port 5174  # Vite fallback port

# Start the server with the specified character in the background
start_server "$CHARACTER_FILE" &
SERVER_PID=$!

# Wait for the server to start
echo "Waiting for server to start..."
for i in {1..30}; do
    if lsof -i:3000 > /dev/null 2>&1; then
        echo "Server started successfully"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Server failed to start after 30 seconds"
        kill -9 $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Start the client
start_client &
CLIENT_PID=$!

# Wait for either process to complete
wait $SERVER_PID $CLIENT_PID 