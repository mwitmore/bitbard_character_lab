# Agent Migration Plan: Mac Mini M4 Dedicated System

## Executive Summary

This migration plan addresses the critical stability issues discovered in the current Lady Macbeth and BitBard agent deployment and provides a comprehensive roadmap for establishing a stable, dedicated system on the new Mac Mini M4 with 16GB RAM.

## Current System Analysis

### 🔍 **Root Cause Analysis**

**Primary Issue**: Twitter API Integration Instability
- Recurring "Error processing tweet undefined" crashes every 5-15 minutes
- Twitter API returns malformed tweet objects with null/undefined essential fields (id, userId, username, text)
- Current parsing logic lacks robust null checking and error recovery
- Agents crash when encountering ~10-20% of malformed tweets from Twitter's API

**Secondary Issues**:
- Database adapter conflicts ("Multiple database adapters found")
- Node.js version compatibility with native SQLite modules
- Memory management stress during extended operation
- Infrastructure brittleness when monitored internally

**Key Discovery**: External monitoring works reliably while internal monitoring causes destabilization. Agents must be treated as "black boxes" for operational monitoring.

## Migration Strategy Overview

### 🎯 **Core Objectives**
1. **Establish Bulletproof Stability**: Eliminate all crash-causing conditions
2. **Local LLM Integration**: Deploy DeepSeek locally to remove external dependencies
3. **Clean Environment**: Fresh system setup with proper dependency management
4. **External Monitoring**: Non-intrusive activity tracking system
5. **Continuous Operation**: Achieve 24/7 uptime with scheduled posting compliance

## Phase 1: Pre-Migration Preparation

### 1.1 Code Fixes (CRITICAL - Apply Before Migration)

**Twitter Integration Hardening**:
```typescript
// packages/client-twitter/src/base.ts - Enhanced parseTweet method
private parseTweet(raw: any, depth = 0, maxDepth = 3): Tweet | null {
    // CRITICAL: Validate essential fields before processing
    if (!raw || !raw.legacy) {
        elizaLogger.warn("Skipping tweet with missing raw data");
        return null;
    }

    const id = raw.rest_id || raw.legacy?.id_str;
    const userId = raw.core?.user_results?.result?.rest_id || raw.legacy?.user_id_str;
    const username = raw.core?.user_results?.result?.legacy?.screen_name;
    const text = raw.legacy?.full_text || raw.legacy?.text;

    // ABORT if any critical field is missing
    if (!id || !userId || !username || !text) {
        elizaLogger.warn("Skipping tweet with incomplete critical fields", {
            hasId: !!id,
            hasUserId: !!userId, 
            hasUsername: !!username,
            hasText: !!text
        });
        return null;
    }
    
    // Continue with validated data...
}
```

**Enhanced Error Handling**:
```typescript
// packages/client-twitter/src/post.ts - Bulletproof processing
for (const tweet of timelines) {
    try {
        // Multi-layer validation
        if (!tweet || !tweet.id || !tweet.userId || !tweet.username) {
            elizaLogger.warn("Skipping invalid tweet in processing loop");
            continue;
        }
        
        // Process with comprehensive error recovery
        // ... existing processing logic with additional try/catch blocks
        
    } catch (error) {
        elizaLogger.error("Tweet processing error (non-fatal)", {
            tweetId: tweet?.id,
            error: error.message
        });
        // Continue processing other tweets - DO NOT CRASH
        continue;
    }
}
```

### 1.2 Database Configuration Cleanup

**Single Adapter Enforcement**:
```json
// Ensure only one database adapter in plugin configuration
{
  "plugins": [
    "@elizaos-plugins/adapter-sqlite"
    // Remove any other database adapters
  ]
}
```

### 1.3 External Monitoring System (Ready for Migration)

The `/monitoring/` system is proven stable and should be migrated as-is:
- `config.py` - Account configurations
- `scraper.py` - Twitter scraping with multiple fallback methods
- `analyzer.py` - Schedule compliance analysis  
- `dashboard.py` - Real-time web dashboard
- `start_monitoring.py` - Main orchestration
- `requirements.txt` - Python dependencies

## Phase 2: Mac Mini M4 System Setup

### 2.1 Environment Preparation

**Node.js Setup**:
```bash
# Install Node Version Manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js 20 LTS (CRITICAL for stability)
nvm install 20
nvm use 20
nvm alias default 20

# Verify version
node --version  # Should show v20.x.x
```

**Package Manager**:
```bash
# Install pnpm globally
npm install -g pnpm@latest

# Verify installation
pnpm --version
```

**System Dependencies**:
```bash
# Install build tools for native modules
xcode-select --install

# Install Python for monitoring system
brew install python@3.11
pip3 install --upgrade pip
```

### 2.2 Project Migration

**Directory Structure**:
```
/Users/[username]/eliza-production/
├── agent/                 # Main agent code
├── packages/             # Eliza packages  
├── characters/           # Character definitions
├── monitoring/           # External monitoring system
├── logs/                # Centralized logging
└── scripts/             # Operational scripts
```

**Migration Steps**:
```bash
# 1. Clone/transfer codebase to new location
cd /Users/[username]
git clone [your-repo] eliza-production
cd eliza-production

# 2. Install dependencies with clean slate
rm -rf node_modules
rm -rf agent/node_modules
pnpm install

# 3. Rebuild all native modules for M4 architecture
pnpm rebuild

# 4. Build agent with fixes
cd agent
pnpm build
cd ..

# 5. Verify database adapter configuration
grep -r "adapter.*sqlite" . | head -5
```

## Phase 3: Local LLM Integration

### 3.1 DeepSeek Local Setup

**Installation**:
```bash
# Install Ollama for local LLM management
curl -fsSL https://ollama.ai/install.sh | sh

# Pull DeepSeek model
ollama pull deepseek-coder:6.7b
ollama pull deepseek-llm:7b

# Verify installation
ollama list
```

**Configuration Update**:
```json
// Update character files to use local endpoint
{
  "modelProvider": "ollama",
  "settings": {
    "model": "deepseek-llm:7b",
    "endpoint": "http://localhost:11434",
    "temperature": 0.7
  }
}
```

### 3.2 Performance Optimization

**Memory Configuration**:
```bash
# Set optimal memory limits for M4 with 16GB RAM
export NODE_OPTIONS="--max-old-space-size=8192"  # 8GB for Node.js
export OLLAMA_MAX_LOADED_MODELS=2                # Limit concurrent models
```

## Phase 4: Deployment and Hardening

### 4.1 Agent Startup Scripts

**Direct Startup Method** (Proven most stable):
```bash
#!/bin/bash
# start-agents.sh

# Set environment
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=8192"

# Start Lady Macbeth
cd /Users/[username]/eliza-production/agent
nohup node dist/index.js --character "../characters/ladymacbethcopy.character.json" > ../logs/ladymacbeth.log 2>&1 &
LADY_MACBETH_PID=$!

sleep 10

# Start BitBard  
nohup node dist/index.js --character "../characters/bitbardcopy.character.json" --port 3001 > ../logs/bitbard.log 2>&1 &
BITBARD_PID=$!

echo "Lady Macbeth PID: $LADY_MACBETH_PID"
echo "BitBard PID: $BITBARD_PID"

# Save PIDs for monitoring
echo $LADY_MACBETH_PID > ../logs/ladymacbeth.pid
echo $BITBARD_PID > ../logs/bitbard.pid
```

### 4.2 System Monitoring (External Only)

**Start Monitoring Dashboard**:
```bash
#!/bin/bash
# start-monitoring.sh

cd /Users/[username]/eliza-production/monitoring

# Create virtual environment if not exists
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Start dashboard in background
python3 start_monitoring.py --dashboard-only --port 8080 &

echo "Monitoring dashboard: http://localhost:8080"
```

### 4.3 Process Management with launchd

**Lady Macbeth Service**:
```xml
<!-- ~/Library/LaunchAgents/com.eliza.ladymacbeth.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.eliza.ladymacbeth</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/[username]/eliza-production/agent/dist/index.js</string>
        <string>--character</string>
        <string>../characters/ladymacbethcopy.character.json</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/[username]/eliza-production/agent</string>
    <key>StandardOutPath</key>
    <string>/Users/[username]/eliza-production/logs/ladymacbeth.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/[username]/eliza-production/logs/ladymacbeth.error.log</string>
    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_OPTIONS</key>
        <string>--max-old-space-size=8192</string>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
</dict>
</plist>
```

**Load Services**:
```bash
# Load and start services
launchctl load ~/Library/LaunchAgents/com.eliza.ladymacbeth.plist
launchctl load ~/Library/LaunchAgents/com.eliza.bitbard.plist

# Verify services are running
launchctl list | grep eliza
```

## Phase 5: Operational Procedures

### 5.1 Health Monitoring

**System Health Check Script**:
```bash
#!/bin/bash
# health-check.sh

echo "=== Agent Health Check ==="
echo "Time: $(date)"

# Check if agents are running
LADY_PID=$(cat /Users/[username]/eliza-production/logs/ladymacbeth.pid 2>/dev/null)
BITBARD_PID=$(cat /Users/[username]/eliza-production/logs/bitbard.pid 2>/dev/null)

if ps -p $LADY_PID > /dev/null 2>&1; then
    echo "✅ Lady Macbeth: Running (PID: $LADY_PID)"
else
    echo "❌ Lady Macbeth: Not running"
fi

if ps -p $BITBARD_PID > /dev/null 2>&1; then
    echo "✅ BitBard: Running (PID: $BITBARD_PID)"
else
    echo "❌ BitBard: Not running"
fi

# Check recent errors
echo "Recent errors in last 10 minutes:"
find /Users/[username]/eliza-production/logs -name "*.log" -exec grep -l "ERROR" {} \; | \
    xargs grep "$(date -v-10M '+%Y-%m-%d %H:%M')" | grep ERROR | tail -5

# Check monitoring dashboard
if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ Monitoring Dashboard: Active"
else
    echo "❌ Monitoring Dashboard: Down"
fi
```

### 5.2 Restart Procedures

**Safe Restart Script**:
```bash
#!/bin/bash
# restart-agents.sh

echo "=== Safe Agent Restart ==="

# Stop agents gracefully
if [ -f "../logs/ladymacbeth.pid" ]; then
    kill -TERM $(cat ../logs/ladymacbeth.pid) 2>/dev/null
fi

if [ -f "../logs/bitbard.pid" ]; then
    kill -TERM $(cat ../logs/bitbard.pid) 2>/dev/null
fi

# Wait for graceful shutdown
sleep 15

# Force kill if still running
pkill -f "ladymacbeth"
pkill -f "bitbard"

# Wait a moment
sleep 5

# Start agents
./start-agents.sh

echo "✅ Agents restarted"
```

## Phase 6: Success Metrics and Validation

### 6.1 Stability Benchmarks

**Target Metrics**:
- **Uptime**: >99.5% (less than 4 hours downtime per month)
- **Error Rate**: <1% of Twitter API calls result in processing errors
- **Posting Compliance**: 
  - Lady Macbeth: >90% adherence to 18:00-06:00 UTC schedule
  - BitBard: >95% daily "Cue" at 08:00 AM Mountain Time
- **Response Time**: <30 seconds for mentions and interactions

**Validation Tests**:
```bash
# 1. Run agents for 24 hours minimum before production
# 2. Monitor error logs - should see <5 "Error processing tweet" messages per hour
# 3. Verify posting activity via external monitoring dashboard
# 4. Test mention responses manually
# 5. Validate database integrity after 48 hours
```

### 6.2 Monitoring Alerts

**Set up monitoring alerts for**:
- Agent process crashes
- High error rates (>10 errors/hour)
- Missing scheduled posts
- Memory usage >80%
- Disk space <10GB free

## Critical Success Factors

### ✅ **Do This**
1. **Use Node.js 20 LTS exactly** - version compatibility is critical
2. **Apply all Twitter parsing fixes** before first run
3. **Use external monitoring only** - never monitor from within agents
4. **Set up proper process management** with launchd
5. **Monitor via dashboard at http://localhost:8080**
6. **Use local LLM** to eliminate external API dependencies

### ❌ **Never Do This**
1. **Don't use internal monitoring** - it destabilizes agents
2. **Don't ignore Node.js version** - native modules will fail
3. **Don't run multiple database adapters** - causes startup failures  
4. **Don't skip the Twitter parsing fixes** - agents will crash
5. **Don't manually intervene during startup** - let processes stabilize

## Emergency Procedures

### 🚨 **If Agents Crash**
1. Check logs: `tail -f /Users/[username]/eliza-production/logs/*.log`
2. Look for "Error processing tweet undefined" - indicates Twitter API issues
3. Restart with: `./restart-agents.sh`
4. If persistent crashes, check Node.js version and native modules

### 🚨 **If No Posts for 4+ Hours**
1. Check monitoring dashboard: http://localhost:8080
2. Verify Twitter API credentials
3. Check agent logs for authentication errors
4. Restart agents if necessary

## Migration Timeline

**Week 1**: Mac Mini setup, environment configuration, code migration
**Week 2**: Local LLM integration, testing, validation
**Week 3**: Production deployment, monitoring setup
**Week 4**: Optimization, documentation, handoff

## Conclusion

This migration plan addresses every stability issue discovered during extensive debugging. The key insights are:

1. **Twitter integration must be bulletproof** with comprehensive null checking
2. **External monitoring works, internal monitoring fails**
3. **Node.js version compatibility is critical**
4. **Local LLM eliminates external dependencies**
5. **Dedicated hardware provides necessary stability**

Following this plan should result in stable, continuous agent operation on the new Mac Mini M4 system.

---

*Document Version: 1.0*  
*Last Updated: $(date)*  
*Migration Target: Mac Mini M4, 16GB RAM, Local DeepSeek LLM* 