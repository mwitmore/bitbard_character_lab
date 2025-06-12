#!/bin/bash

# Production Agent Startup Script
# Based on extensive debugging and stability testing

set -e  # Exit on error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AGENT_DIR="$PROJECT_ROOT/agent"
LOGS_DIR="$PROJECT_ROOT/logs"
CHARACTERS_DIR="$PROJECT_ROOT/characters"

# Create logs directory if it doesn't exist
mkdir -p "$LOGS_DIR"

# Environment setup
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=8192"

echo "🎭 === Starting Eliza Agents ==="
echo "Time: $(date)"
echo "Project Root: $PROJECT_ROOT"
echo "Node Version: $(node --version)"
echo "Memory Limit: 8GB"

# Check if agents are already running
if [ -f "$LOGS_DIR/ladymacbeth.pid" ]; then
    LADY_PID=$(cat "$LOGS_DIR/ladymacbeth.pid")
    if ps -p $LADY_PID > /dev/null 2>&1; then
        echo "⚠️  Lady Macbeth already running (PID: $LADY_PID)"
        echo "Use restart-agents.sh to restart"
        exit 1
    fi
fi

if [ -f "$LOGS_DIR/bitbard.pid" ]; then
    BITBARD_PID=$(cat "$LOGS_DIR/bitbard.pid")
    if ps -p $BITBARD_PID > /dev/null 2>&1; then
        echo "⚠️  BitBard already running (PID: $BITBARD_PID)"
        echo "Use restart-agents.sh to restart"
        exit 1
    fi
fi

# Verify prerequisites
if [ ! -f "$AGENT_DIR/dist/index.js" ]; then
    echo "❌ Agent not built. Run 'cd agent && pnpm build' first"
    exit 1
fi

if [ ! -f "$CHARACTERS_DIR/ladymacbethcopy.character.json" ]; then
    echo "❌ Lady Macbeth character file not found"
    exit 1
fi

if [ ! -f "$CHARACTERS_DIR/bitbardcopy.character.json" ]; then
    echo "❌ BitBard character file not found"
    exit 1
fi

# Start Lady Macbeth
echo "🎯 Starting Lady Macbeth..."
cd "$AGENT_DIR"
nohup node dist/index.js --character "../characters/ladymacbethcopy.character.json" > "$LOGS_DIR/ladymacbeth.log" 2>&1 &
LADY_MACBETH_PID=$!

# Save PID
echo $LADY_MACBETH_PID > "$LOGS_DIR/ladymacbeth.pid"
echo "✅ Lady Macbeth started (PID: $LADY_MACBETH_PID)"

# Wait for Lady Macbeth to stabilize
echo "⏳ Waiting for Lady Macbeth to initialize..."
sleep 15

# Verify Lady Macbeth is still running
if ! ps -p $LADY_MACBETH_PID > /dev/null 2>&1; then
    echo "❌ Lady Macbeth failed to start. Check logs:"
    tail -n 20 "$LOGS_DIR/ladymacbeth.log"
    exit 1
fi

# Start BitBard
echo "🎭 Starting BitBard..."
nohup node dist/index.js --character "../characters/bitbardcopy.character.json" --port 3001 > "$LOGS_DIR/bitbard.log" 2>&1 &
BITBARD_PID=$!

# Save PID
echo $BITBARD_PID > "$LOGS_DIR/bitbard.pid"
echo "✅ BitBard started (PID: $BITBARD_PID)"

# Wait for BitBard to stabilize
echo "⏳ Waiting for BitBard to initialize..."
sleep 15

# Verify BitBard is still running
if ! ps -p $BITBARD_PID > /dev/null 2>&1; then
    echo "❌ BitBard failed to start. Check logs:"
    tail -n 20 "$LOGS_DIR/bitbard.log"
    
    # Stop Lady Macbeth since BitBard failed
    echo "🛑 Stopping Lady Macbeth due to BitBard failure..."
    kill $LADY_MACBETH_PID 2>/dev/null || true
    rm -f "$LOGS_DIR/ladymacbeth.pid"
    
    exit 1
fi

# Final status check
echo ""
echo "🎉 === Agents Started Successfully ==="
echo "Lady Macbeth:"
echo "  PID: $LADY_MACBETH_PID"
echo "  Port: 3000"
echo "  Log: $LOGS_DIR/ladymacbeth.log"
echo ""
echo "BitBard:"
echo "  PID: $BITBARD_PID" 
echo "  Port: 3001"
echo "  Log: $LOGS_DIR/bitbard.log"
echo ""
echo "📊 Monitor agents:"
echo "  Health: ./scripts/health-check.sh"
echo "  Logs: tail -f $LOGS_DIR/*.log"
echo "  Dashboard: http://localhost:8080 (if monitoring is running)"
echo ""
echo "🔄 Management:"
echo "  Restart: ./scripts/restart-agents.sh"
echo "  Stop: ./scripts/stop-agents.sh"

cd "$PROJECT_ROOT" 