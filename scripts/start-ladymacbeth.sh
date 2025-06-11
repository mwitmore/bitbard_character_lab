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
    echo "Starting server with Lady Macbeth..."
    NODE_OPTIONS="--max-old-space-size=4096" CACHE_STORE=filesystem CACHE_DIR=$(pwd)/data SERVER_PORT=3000 pnpm start --character "../characters/ladymacbethcopy.character.json"
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

# Kill any existing processes on ports
kill_port 3000  # Server port
kill_port 3001  # Client port
kill_port 5173  # Vite default port
kill_port 5174  # Vite fallback port

# Start the server with Lady Macbeth in the background
start_server &
SERVER_PID=$!

# Wait for the server to start
echo "Waiting for server to start (this may take up to 2 minutes due to RAG processing)..."
for i in {1..120}; do
    if lsof -i:3000 > /dev/null 2>&1; then
        echo "Server started successfully"
        break
    fi
    if [ $i -eq 120 ]; then
        echo "Server failed to start after 120 seconds"
        kill -9 $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    if [ $((i % 10)) -eq 0 ]; then
        echo "Still waiting for server to start... ($i seconds elapsed)"
    fi
    sleep 1
done

# Start the client
start_client &
CLIENT_PID=$!

# Wait for either process to complete
wait $SERVER_PID $CLIENT_PID 