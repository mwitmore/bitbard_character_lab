#!/bin/bash

# Twitter AI Agent Monitoring System
# Quick startup script

echo "🎭 Twitter AI Agent Monitoring System"
echo "====================================="
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

# Navigate to monitoring directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "🔧 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/installed" ]; then
    echo "📥 Installing dependencies..."
    pip install -r requirements.txt
    touch venv/installed
fi

# Create directories
mkdir -p data logs reports

# Start monitoring system
echo "🚀 Starting monitoring system..."
echo "📊 Dashboard will be available at: http://localhost:8080"
echo "🔍 Scraper will check every 5 minutes"
echo "📝 Press Ctrl+C to stop"
echo ""

python3 start_monitoring.py "$@" 