#!/bin/bash

# Lady Macbeth Bulletproof Startup Script
# Enhanced with automatic rebuilding and database adapter conflict resolution

set -e  # Exit on any error

# Color codes for better visibility
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_debug() {
    echo -e "${YELLOW}🔧 DEBUG: $1${NC}"
}

echo "🎭 === Starting Lady Macbeth Agent (Enhanced) ==="

# System checks with auto-rebuild capability
log_info "Performing enhanced system checks..."

# Switch to Node 20 LTS for compatibility
if command -v fnm &> /dev/null; then
    log_info "Switching to Node.js 20 LTS for compatibility..."
    export PATH="$HOME/.fnm:$PATH"
    eval "$(fnm env)"
    fnm use 20 || fnm install 20
fi

# Verify versions
NODE_VERSION=$(node -v)
PNPM_VERSION=$(pnpm -v)
log_info "Node.js version: $NODE_VERSION"
log_info "pnpm version: $PNPM_VERSION"

# Check if agent needs rebuilding
NEEDS_REBUILD=false
if [ ! -f "agent/dist/index.js" ]; then
    log_warning "Agent not built, rebuild required"
    NEEDS_REBUILD=true
elif [ "agent/src/index.ts" -nt "agent/dist/index.js" ]; then
    log_warning "Agent source newer than build, rebuild required"
    NEEDS_REBUILD=true
elif ! grep -q "🔍 \[DB-ADAPTER\]" agent/dist/index.js; then
    log_warning "Database adapter fix not found in build, rebuild required"
    NEEDS_REBUILD=true
fi

# Auto-rebuild if needed
if [ "$NEEDS_REBUILD" = true ]; then
    log_info "🔧 Auto-rebuilding agent with database adapter fix..."
    cd agent
    
    # Clean build to ensure fresh compilation
    rm -rf dist/ node_modules/.cache/ .cache/
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        log_info "Installing/updating agent dependencies..."
        pnpm install
    fi
    
    # Build with verbose output for debugging
    log_info "Building agent with database adapter enhancement..."
    pnpm build
    
    # Verify the fix is compiled
    if grep -q "🔍 \[DB-ADAPTER\]" dist/index.js; then
        log_success "Database adapter fix successfully compiled"
    else
        log_error "Database adapter fix not found in compiled code!"
        exit 1
    fi
    
    cd ..
    log_success "Agent rebuild completed"
else
    log_success "Agent build is up to date"
fi

log_success "Enhanced system checks completed"

# Enhanced port and process cleanup
log_info "🔄 Enhanced cleanup and validation..."

# Kill any existing Lady Macbeth processes
pkill -f "ladymacbeth\|start-ladymacbeth" || true
sleep 2

# Enhanced port cleanup
PORTS_TO_CHECK=(3000 5173 5174 5175 5176 5177)
for port in "${PORTS_TO_CHECK[@]}"; do
    log_info "Checking port $port..."
    if lsof -ti:$port > /dev/null 2>&1; then
        log_warning "Port $port is busy, cleaning..."
        lsof -ti:$port | xargs kill -9 || true
        sleep 1
    fi
done

# Clear caches that might cause issues
log_info "Clearing caches..."
rm -rf .vite/ client/.vite/ node_modules/.cache/ || true

log_success "Enhanced cleanup completed"

# Show port status
log_info "Port status:"
for port in "${PORTS_TO_CHECK[@]}"; do
    if lsof -ti:$port > /dev/null 2>&1; then
        log_warning "Port $port: BUSY"
    else
        log_info "Port $port: FREE"
    fi
done

# Enhanced character file validation
log_info "🔄 Enhanced character file validation..."
CHARACTER_FILE="characters/ladymacbethcopy.character.json"

if [ ! -f "$CHARACTER_FILE" ]; then
    log_error "Character file not found: $CHARACTER_FILE"
    exit 1
fi

# Validate JSON syntax
if ! jq empty "$CHARACTER_FILE" 2>/dev/null; then
    log_error "Character file has invalid JSON syntax"
    exit 1
fi

# Check for required plugins
REQUIRED_PLUGINS=("@elizaos-plugins/adapter-sqlite" "@elizaos-plugins/client-twitter")
for plugin in "${REQUIRED_PLUGINS[@]}"; do
    if ! jq -e --arg plugin "$plugin" '.plugins[] | select(. == $plugin)' "$CHARACTER_FILE" > /dev/null; then
        log_error "Required plugin missing from character file: $plugin"
        exit 1
    fi
done

log_success "Character file validated"

# Enhanced server startup with database adapter debugging
log_info "🔄 Starting Lady Macbeth server (with DB adapter debugging)..."

# Environment setup for enhanced debugging
export NODE_OPTIONS="--max-old-space-size=4096"
export DEBUG="eliza:*"
export TWITTER_DRY_RUN=false

# Enhanced logging and startup
SERVER_PORT=${SERVER_PORT:-3000}
log_info "Launching server with character: $CHARACTER_FILE"
log_info "Memory limit: 4096MB, Port: $SERVER_PORT"

# Start server with enhanced error handling
cd agent
(
    set +e  # Don't exit on error in subshell
    pnpm start --character "../$CHARACTER_FILE" > ../server.log 2>&1 &
    SERVER_PID=$!
    echo $SERVER_PID > ../server.pid
    
    # Store PID for main script
    echo "ℹ️  Server PID: $SERVER_PID"
) &

cd ..

# Enhanced startup monitoring
log_info "Waiting for server startup (max 60s)..."
STARTUP_TIMEOUT=60
STARTUP_ELAPSED=0

while [ $STARTUP_ELAPSED -lt $STARTUP_TIMEOUT ]; do
    if [ -f server.pid ]; then
        SERVER_PID=$(cat server.pid)
        
        # Check if process is still running
        if ! kill -0 $SERVER_PID 2>/dev/null; then
            log_error "Server process died during startup"
            
            # Enhanced error analysis
            if grep -q "🔍 MULTIPLE DATABASE ADAPTERS FOUND" server.log; then
                log_error "DATABASE ADAPTER CONFLICT DETECTED!"
                log_error "Multiple plugins are providing database adapters."
                log_error "Check character file plugins configuration."
                
                # Show the specific error
                echo ""
                log_error "=== DATABASE ADAPTER ERROR DETAILS ==="
                grep -A 10 -B 5 "🔍 MULTIPLE DATABASE ADAPTERS FOUND" server.log || true
                echo ""
                
            elif grep -q "better-sqlite3.*compiled against.*Node.js" server.log; then
                log_error "NODE.JS VERSION COMPATIBILITY ISSUE!"
                log_info "Attempting to rebuild better-sqlite3..."
                
                # Auto-fix Node.js version issue
                cd agent
                pnpm rebuild better-sqlite3
                cd ..
                
                log_info "Retrying startup after rebuild..."
                continue
                
            else
                log_error "Unknown startup failure"
            fi
            
            # Show recent logs for debugging
            echo ""
            log_error "=== RECENT SERVER LOGS ==="
            tail -20 server.log || true
            echo ""
            
            break
        fi
        
        # Check if server is responding
        if curl -s -f "http://localhost:$SERVER_PORT/health" > /dev/null 2>&1; then
            log_success "Server started successfully on port $SERVER_PORT"
            break
        fi
    fi
    
    sleep 1
    STARTUP_ELAPSED=$((STARTUP_ELAPSED + 1))
    
    # Show progress every 10 seconds
    if [ $((STARTUP_ELAPSED % 10)) -eq 0 ]; then
        log_info "Still waiting... (${STARTUP_ELAPSED}s elapsed)"
    fi
done

# Check final startup status
if [ $STARTUP_ELAPSED -ge $STARTUP_TIMEOUT ]; then
    log_error "Server startup timeout after ${STARTUP_TIMEOUT}s"
    if [ -f server.pid ]; then
        SERVER_PID=$(cat server.pid)
        kill -9 $SERVER_PID 2>/dev/null || true
    fi
    exit 1
fi

# Enhanced client startup
log_info "🔄 Starting client interface..."
CLIENT_PORT=${VITE_SERVER_PORT:-5173}
log_info "Using client port: $CLIENT_PORT"

cd client
(
    export SERVER_PORT=$SERVER_PORT
    export VITE_SERVER_PORT=$CLIENT_PORT
    pnpm dev > ../client.log 2>&1 &
    CLIENT_PID=$!
    echo $CLIENT_PID > ../client.pid
) &
cd ..

# Wait for client to start
sleep 3

if [ -f client.pid ]; then
    CLIENT_PID=$(cat client.pid)
    if kill -0 $CLIENT_PID 2>/dev/null; then
        log_success "Client started on http://localhost:$CLIENT_PORT"
    else
        log_warning "Client failed to start, check client.log"
    fi
else
    log_warning "Client PID file not found"
fi

# Enhanced status display
echo ""
log_info "=== Lady Macbeth Status ==="
if [ -f server.pid ]; then
    SERVER_PID=$(cat server.pid)
    if kill -0 $SERVER_PID 2>/dev/null; then
        log_success "Server: Running (PID: $SERVER_PID, Port: $SERVER_PORT)"
        log_info "Server URL: http://localhost:$SERVER_PORT"
    else
        log_error "Server: Not running"
    fi
fi

if [ -f client.pid ]; then
    CLIENT_PID=$(cat client.pid)
    if kill -0 $CLIENT_PID 2>/dev/null; then
        log_success "Client: Running (PID: $CLIENT_PID)"
        log_info "Client URL: http://localhost:$CLIENT_PORT"
    else
        log_warning "Client: Not running"
    fi
fi

log_info "Logs: server.log, client.log"
log_info "Press Ctrl+C to stop"

echo ""
log_success "Lady Macbeth is now running. Press Ctrl+C to stop."

# Enhanced monitoring loop
monitor_processes() {
    while true; do
        sleep 10
        
        # Check server health
        if [ -f server.pid ]; then
            SERVER_PID=$(cat server.pid)
            if ! kill -0 $SERVER_PID 2>/dev/null; then
                log_error "Server process died unexpectedly"
                log_error "Check server.log for details"
                
                # Show last error from logs
                if [ -f server.log ]; then
                    echo ""
                    log_error "=== LAST SERVER ERROR ==="
                    tail -10 server.log | grep -E "(ERROR|FATAL|🔍.*ERROR)" || tail -5 server.log
                    echo ""
                fi
                
                break
            fi
        fi
    done
}

# Enhanced cleanup function
cleanup() {
    echo ""
    log_info "🔄 Shutting down Lady Macbeth..."
    
    # Stop client
    if [ -f client.pid ]; then
        CLIENT_PID=$(cat client.pid)
        log_info "Stopping client (PID: $CLIENT_PID)"
        kill -TERM $CLIENT_PID 2>/dev/null || true
        sleep 2
        kill -9 $CLIENT_PID 2>/dev/null || true
    fi
    
    # Stop server
    if [ -f server.pid ]; then
        SERVER_PID=$(cat server.pid)
        log_info "Stopping server (PID: $SERVER_PID)"
        kill -TERM $SERVER_PID 2>/dev/null || true
        sleep 3
        kill -9 $SERVER_PID 2>/dev/null || true
    fi
    
    # Enhanced port cleanup
    log_info "🔄 Cleaning up ports and processes..."
    for port in "${PORTS_TO_CHECK[@]}"; do
        log_info "Checking port $port..."
        if lsof -ti:$port > /dev/null 2>&1; then
            log_info "Cleaning port $port..."
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
        fi
    done
    
    # Clean up vite processes specifically
    log_info "Cleaning up vite processes..."
    pkill -f "vite\|rollup" 2>/dev/null || true
    
    # Clear caches
    log_info "Clearing Vite cache..."
    rm -rf .vite/ client/.vite/ || true
    
    # Clean up PID files
    rm -f server.pid client.pid || true
    
    log_success "Enhanced cleanup completed"
    
    # Final port status
    log_info "Final port status:"
    for port in "${PORTS_TO_CHECK[@]}"; do
        if lsof -ti:$port > /dev/null 2>&1; then
            log_warning "Port $port: STILL BUSY"
        else
            log_info "Port $port: FREE"
        fi
    done
    
    log_success "Lady Macbeth shutdown completed"
}

# Set up signal handlers
trap cleanup INT TERM EXIT

# Start monitoring
monitor_processes 