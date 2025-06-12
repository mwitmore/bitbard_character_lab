#!/bin/bash

# Graceful Agent Stop Script
# Safely stops both agents and cleans up

set -e  # Exit on error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$PROJECT_ROOT/logs"

echo "🛑 === Stopping Eliza Agents ==="
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
            
            # Try graceful shutdown first (SIGTERM)
            kill -TERM $pid 2>/dev/null
            
            # Wait up to 30 seconds for graceful shutdown
            local count=0
            while [ $count -lt 30 ]; do
                if ! ps -p $pid > /dev/null 2>&1; then
                    echo "✅ $agent_name stopped gracefully"
                    rm -f "$pid_file"
                    return 0
                fi
                sleep 1
                count=$((count + 1))
                
                # Show progress every 5 seconds
                if [ $((count % 5)) -eq 0 ]; then
                    echo "   ⏳ Waiting for $agent_name to shutdown... (${count}s)"
                fi
            done
            
            # Force kill if still running
            echo "⚠️  $agent_name not responding to SIGTERM, using SIGKILL..."
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

# Stop Lady Macbeth
stop_agent "ladymacbeth" || echo "⚠️  Issues stopping Lady Macbeth"

echo ""

# Stop BitBard
stop_agent "bitbard" || echo "⚠️  Issues stopping BitBard"

echo ""

# Additional cleanup - kill any remaining processes by character file
echo "🧹 Cleaning up any remaining agent processes..."
pkill -f "ladymacbethcopy.character.json" 2>/dev/null && echo "   Cleaned up remaining Lady Macbeth processes" || true
pkill -f "bitbardcopy.character.json" 2>/dev/null && echo "   Cleaned up remaining BitBard processes" || true

# Clean up any orphaned node processes running agent code
ORPHANED_NODES=$(pgrep -f "node.*dist/index.js" 2>/dev/null || true)
if [ -n "$ORPHANED_NODES" ]; then
    echo "   Found orphaned agent processes: $ORPHANED_NODES"
    echo "$ORPHANED_NODES" | xargs kill -TERM 2>/dev/null || true
    sleep 3
    echo "$ORPHANED_NODES" | xargs kill -KILL 2>/dev/null || true
    echo "   Cleaned up orphaned processes"
fi

echo ""

# Final status check
echo "🔍 Final Status Check:"
REMAINING_PROCESSES=0

if [ -f "$LOGS_DIR/ladymacbeth.pid" ]; then
    LADY_PID=$(cat "$LOGS_DIR/ladymacbeth.pid" 2>/dev/null)
    if [ -n "$LADY_PID" ] && ps -p $LADY_PID > /dev/null 2>&1; then
        echo "❌ Lady Macbeth still running (PID: $LADY_PID)"
        REMAINING_PROCESSES=$((REMAINING_PROCESSES + 1))
    else
        echo "✅ Lady Macbeth stopped"
        rm -f "$LOGS_DIR/ladymacbeth.pid"
    fi
else
    echo "✅ Lady Macbeth stopped"
fi

if [ -f "$LOGS_DIR/bitbard.pid" ]; then
    BITBARD_PID=$(cat "$LOGS_DIR/bitbard.pid" 2>/dev/null)
    if [ -n "$BITBARD_PID" ] && ps -p $BITBARD_PID > /dev/null 2>&1; then
        echo "❌ BitBard still running (PID: $BITBARD_PID)"
        REMAINING_PROCESSES=$((REMAINING_PROCESSES + 1))
    else
        echo "✅ BitBard stopped"
        rm -f "$LOGS_DIR/bitbard.pid"
    fi
else
    echo "✅ BitBard stopped"
fi

echo ""

if [ $REMAINING_PROCESSES -eq 0 ]; then
    echo "🎉 === All Agents Stopped Successfully ==="
    echo ""
    echo "📊 Next steps:"
    echo "  Start agents: ./scripts/start-agents.sh"
    echo "  Check logs: ls -la $LOGS_DIR/"
    echo "  Health check: ./scripts/health-check.sh"
else
    echo "⚠️  === Some Issues During Shutdown ==="
    echo "  $REMAINING_PROCESSES agent(s) may still be running"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "  Check processes: ps aux | grep -E '(ladymacbeth|bitbard)'"
    echo "  Force cleanup: pkill -f 'character.json'"
    echo "  Check logs: tail -f $LOGS_DIR/*.log"
    
    exit 1
fi 