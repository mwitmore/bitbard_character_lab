#!/bin/bash

# Safe Agent Restart Script
# Gracefully stops and restarts both agents

set -e  # Exit on error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$PROJECT_ROOT/logs"

echo "🔄 === Safe Agent Restart ==="
echo "Time: $(date)"
echo ""

# Function to stop agent gracefully
stop_agent() {
    local agent_name="$1"
    local pid_file="$LOGS_DIR/${agent_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file" 2>/dev/null)
        if [ -n "$pid" ] && ps -p $pid > /dev/null 2>&1; then
            echo "🛑 Stopping $agent_name (PID: $pid)..."
            
            # Try graceful shutdown first
            kill -TERM $pid 2>/dev/null
            
            # Wait up to 30 seconds for graceful shutdown
            for i in {1..30}; do
                if ! ps -p $pid > /dev/null 2>&1; then
                    echo "✅ $agent_name stopped gracefully"
                    rm -f "$pid_file"
                    return 0
                fi
                sleep 1
            done
            
            # Force kill if still running
            echo "⚠️  $agent_name not responding to SIGTERM, forcing shutdown..."
            kill -KILL $pid 2>/dev/null || true
            sleep 2
            
            if ps -p $pid > /dev/null 2>&1; then
                echo "❌ Failed to stop $agent_name (PID: $pid)"
                return 1
            else
                echo "✅ $agent_name force stopped"
                rm -f "$pid_file"
                return 0
            fi
        else
            echo "⚠️  $agent_name not running (removing stale PID file)"
            rm -f "$pid_file"
        fi
    else
        echo "ℹ️  $agent_name not running (no PID file)"
    fi
    
    return 0
}

# Stop agents
echo "🛑 Stopping agents..."

stop_agent "ladymacbeth" || true
stop_agent "bitbard" || true

# Additional cleanup - kill any remaining agent processes
echo "🧹 Cleaning up any remaining processes..."
pkill -f "ladymacbethcopy.character.json" 2>/dev/null || true
pkill -f "bitbardcopy.character.json" 2>/dev/null || true
sleep 2

# Wait a moment for complete shutdown
echo "⏳ Waiting for complete shutdown..."
sleep 5

# Archive old logs
echo "📁 Archiving old logs..."
if [ -d "$LOGS_DIR" ]; then
    TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
    
    if [ -f "$LOGS_DIR/ladymacbeth.log" ]; then
        mv "$LOGS_DIR/ladymacbeth.log" "$LOGS_DIR/ladymacbeth_${TIMESTAMP}.log" 2>/dev/null || true
    fi
    
    if [ -f "$LOGS_DIR/bitbard.log" ]; then
        mv "$LOGS_DIR/bitbard.log" "$LOGS_DIR/bitbard_${TIMESTAMP}.log" 2>/dev/null || true
    fi
    
    # Clean up old archived logs (keep last 10)
    cd "$LOGS_DIR"
    ls -t ladymacbeth_*.log 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    ls -t bitbard_*.log 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    cd "$PROJECT_ROOT"
fi

echo ""

# Start agents
echo "🚀 Starting agents..."

# Check if start script exists
if [ ! -f "$SCRIPT_DIR/start-agents.sh" ]; then
    echo "❌ start-agents.sh not found!"
    exit 1
fi

# Make sure it's executable
chmod +x "$SCRIPT_DIR/start-agents.sh"

# Start the agents
if "$SCRIPT_DIR/start-agents.sh"; then
    echo ""
    echo "✅ === Restart Completed Successfully ==="
    echo ""
    
    # Quick health check
    sleep 5
    echo "🔍 Quick health check..."
    
    RESTART_SUCCESS=true
    
    if [ -f "$LOGS_DIR/ladymacbeth.pid" ]; then
        LADY_PID=$(cat "$LOGS_DIR/ladymacbeth.pid")
        if ps -p $LADY_PID > /dev/null 2>&1; then
            echo "✅ Lady Macbeth: Running (PID: $LADY_PID)"
        else
            echo "❌ Lady Macbeth: Failed to start"
            RESTART_SUCCESS=false
        fi
    else
        echo "❌ Lady Macbeth: No PID file created"
        RESTART_SUCCESS=false
    fi
    
    if [ -f "$LOGS_DIR/bitbard.pid" ]; then
        BITBARD_PID=$(cat "$LOGS_DIR/bitbard.pid")
        if ps -p $BITBARD_PID > /dev/null 2>&1; then
            echo "✅ BitBard: Running (PID: $BITBARD_PID)"
        else
            echo "❌ BitBard: Failed to start"
            RESTART_SUCCESS=false
        fi
    else
        echo "❌ BitBard: No PID file created"
        RESTART_SUCCESS=false
    fi
    
    echo ""
    
    if [ "$RESTART_SUCCESS" = true ]; then
        echo "🎉 All agents restarted successfully!"
        echo ""
        echo "📊 Next steps:"
        echo "  Monitor: ./scripts/health-check.sh"
        echo "  Logs: tail -f $LOGS_DIR/*.log"
        echo "  Dashboard: http://localhost:8080"
    else
        echo "⚠️  Restart completed but some agents may have issues"
        echo ""
        echo "🔍 Troubleshooting:"
        echo "  Check logs: tail -f $LOGS_DIR/*.log"
        echo "  Run health check: ./scripts/health-check.sh"
        echo "  Manual restart: ./scripts/start-agents.sh"
        exit 1
    fi
else
    echo "❌ Failed to start agents"
    echo ""
    echo "🔍 Check the following:"
    echo "  1. Agent build: cd agent && pnpm build"
    echo "  2. Character files exist in characters/"
    echo "  3. Node.js version: node --version (should be v20.x)"
    echo "  4. Dependencies: pnpm install"
    exit 1
fi 