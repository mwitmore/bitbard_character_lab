#!/bin/bash

# Lady Macbeth Direct Startup - Bypass pnpm completely
# Uses our compiled code directly with database adapter fix

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

echo "🎯 === Lady Macbeth Direct Startup ==="

# Basic checks
log_info "Performing direct startup checks..."

# Switch to Node 20 LTS
if command -v fnm &> /dev/null; then
    log_info "Using Node.js 20 LTS..."
    export PATH="$HOME/.fnm:$PATH"
    eval "$(fnm env)"
    fnm use 20 || fnm install 20
fi

NODE_VERSION=$(node -v)
log_info "Node.js version: $NODE_VERSION"

# Check our compiled code exists
if [ ! -f "agent/dist/index.js" ]; then
    log_error "Compiled agent not found! Run: cd agent && pnpm build"
    exit 1
fi

# Verify our database adapter fix is compiled
if ! grep -q "🔍 \[DB-ADAPTER\]" agent/dist/index.js; then
    log_warning "Database adapter fix not found in compiled code"
    log_info "Rebuilding agent with fix..."
    cd agent
    pnpm build
    cd ..
    
    if ! grep -q "🔍 \[DB-ADAPTER\]" agent/dist/index.js; then
        log_error "Failed to compile database adapter fix!"
        exit 1
    fi
fi

log_success "Database adapter fix confirmed in compiled code"

# Clean up ports
log_info "Cleaning up ports..."
PORTS=(3000 5173 5174 5175 5176 5177)
for port in "${PORTS[@]}"; do
    if lsof -ti:$port > /dev/null 2>&1; then
        log_info "Cleaning port $port..."
        lsof -ti:$port | xargs kill -9 || true
    fi
done

# Character file validation
CHARACTER_FILE="characters/ladymacbethcopy.character.json"
if [ ! -f "$CHARACTER_FILE" ]; then
    log_error "Character file not found: $CHARACTER_FILE"
    exit 1
fi

log_success "Character file found"

# Environment setup
export NODE_OPTIONS="--max-old-space-size=4096"
export TWITTER_DRY_RUN=false
export SERVER_PORT=3000

log_info "🎯 Starting Lady Macbeth directly with Node.js..."
log_info "Using compiled code: agent/dist/index.js"
log_info "Character: $CHARACTER_FILE"
log_info "Port: $SERVER_PORT"

# Start the agent directly
cd agent

# Create startup wrapper to capture PID
{
    node dist/index.js --character "../$CHARACTER_FILE" > ../server-direct.log 2>&1 &
    AGENT_PID=$!
    echo $AGENT_PID > ../agent-direct.pid
    
    log_info "Agent started with PID: $AGENT_PID"
    
    # Wait a moment to check if it started successfully
    sleep 3
    
    if kill -0 $AGENT_PID 2>/dev/null; then
        log_success "Agent is running successfully!"
    else
        log_error "Agent failed to start"
        if [ -f ../server-direct.log ]; then
            echo ""
            log_error "=== ERROR LOG ==="
            tail -20 ../server-direct.log
            echo ""
        fi
        exit 1
    fi
} 

cd ..

# Start client
log_info "Starting client interface..."
cd client
{
    export SERVER_PORT=3000
    export VITE_SERVER_PORT=5173
    pnpm dev > ../client-direct.log 2>&1 &
    CLIENT_PID=$!
    echo $CLIENT_PID > ../client-direct.pid
} &
cd ..

sleep 3

# Check status
echo ""
log_info "=== Lady Macbeth Direct Startup Status ==="

if [ -f agent-direct.pid ]; then
    AGENT_PID=$(cat agent-direct.pid)
    if kill -0 $AGENT_PID 2>/dev/null; then
        log_success "Agent: Running (PID: $AGENT_PID, Port: 3000)"
        log_info "Agent URL: http://localhost:3000"
        
        # Check if our enhanced debugging appears in logs
        if grep -q "🔍 \[DB-ADAPTER\]" server-direct.log; then
            log_success "Enhanced database adapter debugging active!"
        else
            log_warning "Enhanced debugging not yet visible in logs"
        fi
    else
        log_error "Agent: Failed to start"
    fi
fi

if [ -f client-direct.pid ]; then
    CLIENT_PID=$(cat client-direct.pid)
    if kill -0 $CLIENT_PID 2>/dev/null; then
        log_success "Client: Running (PID: $CLIENT_PID)"
        log_info "Client URL: http://localhost:5173"
    else
        log_warning "Client: Not running"
    fi
fi

log_info "Logs: server-direct.log, client-direct.log"

# Cleanup function
cleanup() {
    echo ""
    log_info "Shutting down Lady Macbeth..."
    
    if [ -f client-direct.pid ]; then
        CLIENT_PID=$(cat client-direct.pid)
        kill -TERM $CLIENT_PID 2>/dev/null || true
        sleep 2
        kill -9 $CLIENT_PID 2>/dev/null || true
    fi
    
    if [ -f agent-direct.pid ]; then
        AGENT_PID=$(cat agent-direct.pid)
        kill -TERM $AGENT_PID 2>/dev/null || true
        sleep 2
        kill -9 $AGENT_PID 2>/dev/null || true
    fi
    
    # Clean up PID files
    rm -f agent-direct.pid client-direct.pid
    
    log_success "Lady Macbeth direct shutdown completed"
}

trap cleanup INT TERM EXIT

echo ""
log_success "🎯 Lady Macbeth running via direct startup! Press Ctrl+C to stop."
log_info "Monitor with: tail -f server-direct.log"

# Keep alive and monitor
while true; do
    sleep 10
    
    if [ -f agent-direct.pid ]; then
        AGENT_PID=$(cat agent-direct.pid)
        if ! kill -0 $AGENT_PID 2>/dev/null; then
            log_error "Agent process died unexpectedly"
            log_error "Check server-direct.log for details"
            break
        fi
    fi
done 