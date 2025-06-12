# Twitter AI Agent Monitoring System

External monitoring system for tracking Twitter posting schedules of AI agents without interfering with their operation.

## 🎯 Purpose

This system provides **non-intrusive monitoring** of AI agent posting schedules by scraping Twitter externally rather than monitoring internal logs. This approach avoids the instability issues that occur when monitoring agents "from within the platform."

## 📋 Monitored Accounts

- **@LadyMacbethAI**: Posts 18:00-06:00 UTC, 1-1.5hr intervals, max 10/day, replies within 30min
- **@BitBardOfficial**: Daily "Cue" at 08:00 Mountain Time (14:00/15:00 UTC), occasional extras

## 🏗️ System Architecture

```
monitoring/
├── config.py          # Account configurations and schedules
├── scraper.py         # Twitter scraping engine (Nitter + fallbacks)
├── analyzer.py        # Schedule compliance analysis
├── dashboard.py       # Web dashboard for real-time monitoring
├── start_monitoring.py # Main orchestration script
├── requirements.txt   # Python dependencies
├── data/             # SQLite database and cached data
├── logs/             # Monitoring system logs
└── reports/          # Generated compliance reports
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd monitoring
pip install -r requirements.txt
```

### 2. Start Full Monitoring System

```bash
# Start scraper + dashboard
python start_monitoring.py

# Dashboard available at http://localhost:8080
```

### 3. View Results

- **Web Dashboard**: http://localhost:8080
- **Terminal Reports**: Generated automatically
- **JSON Reports**: Saved to `reports/` directory

## 📊 Usage Options

### Full Monitoring (Recommended)
```bash
python start_monitoring.py
```
Runs both scraper and dashboard with auto-refresh every 5 minutes.

### Dashboard Only
```bash
python start_monitoring.py --dashboard-only --port 8080
```
View existing data without running new scrapes.

### Scraper Only
```bash
python start_monitoring.py --scraper-only
```
Collect data without web interface.

### One-Time Report
```bash
python start_monitoring.py --report-only --hours 48
```
Generate a single compliance report and exit.

### Custom Analysis
```bash
python analyzer.py  # Generate 24-hour report
```

## 🔍 Features

### 📈 Schedule Compliance Analysis
- **Posting Frequency**: Tracks posts per day vs. expected limits
- **Timing Compliance**: Measures adherence to active hour schedules
- **Interval Analysis**: Checks if posts are too frequent or infrequent
- **Reply Responsiveness**: Monitors response times to mentions

### 🌐 Real-Time Dashboard
- **Live Status**: Current system health and last check time
- **Compliance Scores**: Overall percentage scores for each agent
- **Issue Detection**: Automatic flagging of schedule violations
- **Post Previews**: Recent posts with timestamps and metrics

### 📊 Automated Reports
- **JSON Export**: Detailed reports saved to `reports/` directory
- **Historical Data**: 30-day retention for trend analysis
- **Custom Timeframes**: Analyze any time period (hours, days, weeks)

## 🛠️ Technical Details

### Scraping Methods
1. **Nitter Instances**: Primary method using privacy-focused Twitter frontends
2. **Search Fallback**: Web search for recent tweets when Nitter fails
3. **Mock Data**: Demonstration data when real scraping unavailable

### Data Storage
- **SQLite Database**: Stores posts, timestamps, and monitoring sessions
- **JSON Reports**: Human-readable compliance reports
- **Automatic Cleanup**: Removes old data based on retention settings

### Monitoring Intervals
- **Scraping**: Every 5 minutes (configurable in `config.py`)
- **Dashboard Refresh**: Every 2 minutes (auto-refresh)
- **Report Generation**: On-demand and scheduled

## ⚙️ Configuration

Edit `config.py` to customize:

```python
# Modify account schedules
ACCOUNTS["ladymacbeth"].max_posts_per_day = 12
ACCOUNTS["bitbard"].active_hours_utc = [13, 14, 15]

# Adjust monitoring frequency
MONITORING_CONFIG["check_interval_minutes"] = 10

# Set alert thresholds
MONITORING_CONFIG["alert_thresholds"]["no_posts_hours"] = 8
```

## 🔒 Privacy & Ethics

- **No Authentication**: Uses only public, unauthenticated scraping
- **Rate Limiting**: Respectful scraping with appropriate delays
- **No Data Collection**: Only monitors posting patterns, not content
- **External Only**: No interference with agent operations

## 🚨 Alerts & Issues

The system automatically detects:
- **Schedule Violations**: Posts outside expected hours
- **Frequency Issues**: Too many or too few posts
- **Missing Posts**: Expected posts that didn't appear
- **System Errors**: Scraping failures or data issues

## 📁 File Structure

```
monitoring/
├── data/
│   └── twitter_monitoring.db    # SQLite database
├── logs/
│   └── monitor.log             # System logs
├── reports/
│   └── schedule_report_*.json  # Generated reports
└── *.py                        # Python modules
```

## 🤝 Integration

### With Existing Agents
- **Zero Interference**: Monitoring runs completely separately
- **Independent Operation**: Agents unaware of monitoring
- **Shared Nothing**: No shared files or resources

### With Other Tools
- **API Endpoints**: Dashboard provides JSON APIs
- **Export Formats**: JSON reports for external analysis
- **Database Access**: Direct SQLite access for custom queries

## 🔧 Troubleshooting

### Common Issues

**No Posts Found**
```bash
# Check if scraping is working
python scraper.py
```

**Dashboard Not Loading**
```bash
# Check port conflicts
python start_monitoring.py --port 8081
```

**Scraping Failures**
- Multiple Nitter instances provide redundancy
- Search fallback handles instance downtime
- Mock data available for testing

### Debug Mode
```bash
# Enable debug logging
export PYTHONPATH=. 
python -c "
import logging
logging.basicConfig(level=logging.DEBUG)
from scraper import TwitterScraper
scraper = TwitterScraper()
scraper.run_monitoring_cycle()
"
```

## 📈 Future Enhancements

- **Real-time Alerts**: Email/Slack notifications for issues
- **Historical Charts**: Visual trend analysis
- **Content Analysis**: Keyword tracking and sentiment
- **Multi-Account**: Support for additional AI agents
- **API Integration**: REST API for external systems

## 🎯 Key Benefits

1. **Non-Intrusive**: No impact on agent stability
2. **Comprehensive**: Tracks all posting schedule requirements
3. **Real-Time**: Live monitoring with web dashboard
4. **Flexible**: Configurable schedules and thresholds
5. **Free**: No Twitter API costs or paid services
6. **Reliable**: Multiple scraping methods with fallbacks

---

*This monitoring system treats AI agents as "black boxes" and measures their actual posting behavior, providing the oversight needed without the instability risks of internal monitoring.* 