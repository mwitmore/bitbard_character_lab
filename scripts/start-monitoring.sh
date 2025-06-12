#!/bin/bash

# External Monitoring System Startup Script
# Starts the non-intrusive monitoring dashboard

set -e  # Exit on error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MONITORING_DIR="$PROJECT_ROOT/monitoring"
VENV_DIR="$MONITORING_DIR/venv"

echo "📊 === Starting External Monitoring System ==="
echo "Time: $(date)"
echo "Monitoring Directory: $MONITORING_DIR"
echo ""

# Check if monitoring directory exists
if [ ! -d "$MONITORING_DIR" ]; then
    echo "❌ Monitoring directory not found: $MONITORING_DIR"
    echo ""
    echo "🔧 Setup required:"
    echo "  1. Ensure monitoring/ directory exists with required files:"
    echo "     - config.py"
    echo "     - scraper.py" 
    echo "     - analyzer.py"
    echo "     - dashboard.py"
    echo "     - start_monitoring.py"
    echo "     - requirements.txt"
    echo "  2. Run this script again"
    exit 1
fi

# Change to monitoring directory
cd "$MONITORING_DIR"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.11+"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1-2)
echo "🐍 Python version: $PYTHON_VERSION"

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "🔧 Creating Python virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt not found in monitoring directory"
    echo ""
    echo "🔧 Creating basic requirements.txt..."
    cat > requirements.txt << EOF
requests>=2.31.0
beautifulsoup4>=4.12.0
flask>=2.3.0
sqlite3
python-dateutil>=2.8.0
pytz>=2023.3
lxml>=4.9.0
EOF
    echo "✅ Basic requirements.txt created"
fi

# Install/upgrade dependencies
echo "📦 Installing monitoring dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
echo "✅ Dependencies installed"

echo ""

# Check if main monitoring script exists
if [ ! -f "start_monitoring.py" ]; then
    echo "❌ start_monitoring.py not found"
    echo ""
    echo "🔧 Please ensure the monitoring system files are in place:"
    echo "  - config.py (account configurations)"
    echo "  - scraper.py (Twitter scraping)"
    echo "  - analyzer.py (schedule analysis)"
    echo "  - dashboard.py (web interface)"
    echo "  - start_monitoring.py (main script)"
    exit 1
fi

# Default monitoring options
PORT=${1:-8080}
MODE=${2:-dashboard-only}

echo "🚀 Starting monitoring dashboard..."
echo "Port: $PORT"
echo "Mode: $MODE"
echo ""

# Start the monitoring system
if [ "$MODE" = "dashboard-only" ]; then
    echo "📊 Starting dashboard-only mode (external scraping)..."
    python3 start_monitoring.py --dashboard-only --port $PORT &
    MONITOR_PID=$!
    
    # Give it a moment to start
    sleep 3
    
    # Check if it's running
    if ps -p $MONITOR_PID > /dev/null 2>&1; then
        echo "✅ Monitoring dashboard started successfully!"
        echo ""
        echo "🌐 Dashboard URL: http://localhost:$PORT"
        echo "📊 Features available:"
        echo "  - Real-time posting activity"
        echo "  - Schedule compliance analysis"
        echo "  - Agent status monitoring"
        echo "  - Historical performance data"
        echo ""
        echo "🔄 Management:"
        echo "  - View logs: tail -f $MONITORING_DIR/monitoring.log"
        echo "  - Stop: pkill -f start_monitoring.py"
        echo "  - Restart: ./scripts/start-monitoring.sh"
        echo ""
        echo "⚠️  This monitoring system is EXTERNAL and non-intrusive"
        echo "   It will NOT interfere with agent operations"
        echo ""
        echo "🎯 Monitor at: http://localhost:$PORT"
        
        # Save PID for management
        echo $MONITOR_PID > "$PROJECT_ROOT/logs/monitoring.pid"
        
    else
        echo "❌ Failed to start monitoring dashboard"
        echo ""
        echo "🔍 Troubleshooting:"
        echo "  1. Check Python dependencies: pip list"
        echo "  2. Check port availability: lsof -i :$PORT"
        echo "  3. Check monitoring logs: cat monitoring.log"
        echo "  4. Test manually: python3 start_monitoring.py --help"
        exit 1
    fi
    
elif [ "$MODE" = "full" ]; then
    echo "🔄 Starting full monitoring mode (scraping + dashboard)..."
    python3 start_monitoring.py --port $PORT &
    MONITOR_PID=$!
    
    sleep 3
    
    if ps -p $MONITOR_PID > /dev/null 2>&1; then
        echo "✅ Full monitoring system started!"
        echo "🌐 Dashboard: http://localhost:$PORT"
        echo "📊 Active scraping and analysis running"
        echo $MONITOR_PID > "$PROJECT_ROOT/logs/monitoring.pid"
    else
        echo "❌ Failed to start full monitoring"
        exit 1
    fi
    
else
    echo "❌ Unknown mode: $MODE"
    echo "Available modes: dashboard-only, full"
    exit 1
fi

# Return to project root
cd "$PROJECT_ROOT"

echo ""
echo "✅ External monitoring system is running"
echo "🎭 Agents can now operate independently while being monitored externally" 