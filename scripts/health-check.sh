#!/bin/bash

# Agent Health Check Script
# Monitors agent status, errors, and system health

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$PROJECT_ROOT/logs"

echo "🔍 === Agent Health Check ==="
echo "Time: $(date)"
echo "Project: $PROJECT_ROOT"
echo ""

# Check if agents are running
echo "📊 Process Status:"

if [ -f "$LOGS_DIR/ladymacbeth.pid" ]; then
    LADY_PID=$(cat "$LOGS_DIR/ladymacbeth.pid" 2>/dev/null)
    if [ -n "$LADY_PID" ] && ps -p $LADY_PID > /dev/null 2>&1; then
        LADY_UPTIME=$(ps -o etime= -p $LADY_PID | xargs)
        echo "✅ Lady Macbeth: Running (PID: $LADY_PID, Uptime: $LADY_UPTIME)"
    else
        echo "❌ Lady Macbeth: Not running (stale PID file)"
    fi
else
    echo "❌ Lady Macbeth: Not running (no PID file)"
fi

if [ -f "$LOGS_DIR/bitbard.pid" ]; then
    BITBARD_PID=$(cat "$LOGS_DIR/bitbard.pid" 2>/dev/null)
    if [ -n "$BITBARD_PID" ] && ps -p $BITBARD_PID > /dev/null 2>&1; then
        BITBARD_UPTIME=$(ps -o etime= -p $BITBARD_PID | xargs)
        echo "✅ BitBard: Running (PID: $BITBARD_PID, Uptime: $BITBARD_UPTIME)"
    else
        echo "❌ BitBard: Not running (stale PID file)"
    fi
else
    echo "❌ BitBard: Not running (no PID file)"
fi

echo ""

# Check recent errors (last 30 minutes)
echo "⚠️  Recent Errors (last 30 minutes):"
if [ -d "$LOGS_DIR" ]; then
    THIRTY_MIN_AGO=$(date -v-30M '+%Y-%m-%d %H:%M' 2>/dev/null || date -d '30 minutes ago' '+%Y-%m-%d %H:%M' 2>/dev/null || echo "")
    
    if [ -n "$THIRTY_MIN_AGO" ]; then
        ERROR_COUNT=0
        for logfile in "$LOGS_DIR"/*.log; do
            if [ -f "$logfile" ]; then
                RECENT_ERRORS=$(grep "$THIRTY_MIN_AGO" "$logfile" 2>/dev/null | grep -i "ERROR" | wc -l | xargs)
                if [ "$RECENT_ERRORS" -gt 0 ]; then
                    echo "  $(basename "$logfile"): $RECENT_ERRORS errors"
                    ERROR_COUNT=$((ERROR_COUNT + RECENT_ERRORS))
                fi
            fi
        done
        
        if [ "$ERROR_COUNT" -eq 0 ]; then
            echo "  ✅ No recent errors found"
        else
            echo "  ⚠️  Total: $ERROR_COUNT errors"
            
            # Show latest errors
            echo ""
            echo "🔴 Latest Error Details:"
            for logfile in "$LOGS_DIR"/*.log; do
                if [ -f "$logfile" ]; then
                    grep "$THIRTY_MIN_AGO" "$logfile" 2>/dev/null | grep -i "ERROR" | tail -3 | while read line; do
                        echo "  $(basename "$logfile"): $line"
                    done
                fi
            done
        fi
    else
        echo "  ⚠️  Cannot check recent errors (date command issue)"
    fi
else
    echo "  ❌ Logs directory not found"
fi

echo ""

# Check Twitter errors specifically
echo "🐦 Twitter Integration Status:"
TWITTER_ERRORS=0
if [ -f "$LOGS_DIR/ladymacbeth.log" ]; then
    TWITTER_ERRORS=$(tail -n 100 "$LOGS_DIR/ladymacbeth.log" | grep -c "Error processing tweet undefined" 2>/dev/null || echo 0)
fi
if [ -f "$LOGS_DIR/bitbard.log" ]; then
    BITBARD_TWITTER_ERRORS=$(tail -n 100 "$LOGS_DIR/bitbard.log" | grep -c "Error processing tweet undefined" 2>/dev/null || echo 0)
    TWITTER_ERRORS=$((TWITTER_ERRORS + BITBARD_TWITTER_ERRORS))
fi

if [ "$TWITTER_ERRORS" -gt 20 ]; then
    echo "  🔴 High Twitter errors: $TWITTER_ERRORS in recent logs (CRITICAL)"
elif [ "$TWITTER_ERRORS" -gt 5 ]; then
    echo "  🟡 Moderate Twitter errors: $TWITTER_ERRORS in recent logs (WARNING)"
elif [ "$TWITTER_ERRORS" -gt 0 ]; then
    echo "  🟢 Low Twitter errors: $TWITTER_ERRORS in recent logs (NORMAL)"
else
    echo "  ✅ No Twitter processing errors in recent logs"
fi

echo ""

# Check monitoring dashboard
echo "📈 Monitoring Dashboard:"
if curl -s --connect-timeout 5 http://localhost:8080 > /dev/null 2>&1; then
    echo "  ✅ Dashboard active at http://localhost:8080"
else
    echo "  ❌ Dashboard not responding at http://localhost:8080"
fi

echo ""

# Check system resources
echo "💻 System Resources:"
echo "  Memory Usage: $(ps -o pid,pcpu,pmem,comm -p $(pgrep -f "node.*dist/index.js" | tr '\n' ' ') 2>/dev/null | tail -n +2 | awk '{mem+=$3} END {printf "%.1f%%\n", mem}')"
echo "  CPU Usage: $(ps -o pid,pcpu,pmem,comm -p $(pgrep -f "node.*dist/index.js" | tr '\n' ' ') 2>/dev/null | tail -n +2 | awk '{cpu+=$2} END {printf "%.1f%%\n", cpu}')"

# Check disk space
DISK_USAGE=$(df -h "$PROJECT_ROOT" | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "  🔴 Disk Usage: ${DISK_USAGE}% (CRITICAL)"
elif [ "$DISK_USAGE" -gt 80 ]; then
    echo "  🟡 Disk Usage: ${DISK_USAGE}% (WARNING)"
else
    echo "  ✅ Disk Usage: ${DISK_USAGE}%"
fi

echo ""

# Check log file sizes
echo "📁 Log File Status:"
if [ -d "$LOGS_DIR" ]; then
    for logfile in "$LOGS_DIR"/*.log; do
        if [ -f "$logfile" ]; then
            SIZE=$(du -h "$logfile" | cut -f1)
            LINES=$(wc -l < "$logfile" 2>/dev/null || echo "0")
            echo "  $(basename "$logfile"): $SIZE ($LINES lines)"
        fi
    done
else
    echo "  ❌ No logs directory found"
fi

echo ""

# Overall health assessment
echo "🎯 Overall Health Assessment:"

ISSUES=0
WARNINGS=0

# Check if both agents running
if [ ! -f "$LOGS_DIR/ladymacbeth.pid" ] || ! ps -p $(cat "$LOGS_DIR/ladymacbeth.pid" 2>/dev/null) > /dev/null 2>&1; then
    ISSUES=$((ISSUES + 1))
fi

if [ ! -f "$LOGS_DIR/bitbard.pid" ] || ! ps -p $(cat "$LOGS_DIR/bitbard.pid" 2>/dev/null) > /dev/null 2>&1; then
    ISSUES=$((ISSUES + 1))
fi

# Check Twitter error rate
if [ "$TWITTER_ERRORS" -gt 20 ]; then
    ISSUES=$((ISSUES + 1))
elif [ "$TWITTER_ERRORS" -gt 5 ]; then
    WARNINGS=$((WARNINGS + 1))
fi

# Check disk space
if [ "$DISK_USAGE" -gt 90 ]; then
    ISSUES=$((ISSUES + 1))
elif [ "$DISK_USAGE" -gt 80 ]; then
    WARNINGS=$((WARNINGS + 1))
fi

if [ "$ISSUES" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
    echo "  ✅ HEALTHY - All systems operational"
elif [ "$ISSUES" -eq 0 ]; then
    echo "  🟡 STABLE - $WARNINGS warning(s), monitoring recommended"
else
    echo "  🔴 CRITICAL - $ISSUES issue(s) require immediate attention"
    echo ""
    echo "🚨 Recommended Actions:"
    echo "  1. Check agent logs: tail -f $LOGS_DIR/*.log"
    echo "  2. Restart if needed: ./scripts/restart-agents.sh"
    echo "  3. Monitor dashboard: http://localhost:8080"
fi

echo ""
echo "📅 Next check: Run this script again in 15-30 minutes" 