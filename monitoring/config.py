# Twitter Monitoring Configuration
import os
from dataclasses import dataclass
from typing import List, Dict, Any

@dataclass
class AccountConfig:
    username: str
    display_name: str
    schedule_description: str
    active_hours_utc: List[int]  # Hours when posts are expected
    max_posts_per_day: int
    min_interval_minutes: int
    max_interval_minutes: int
    reply_window_minutes: int = None  # Expected reply time for mentions

# Account configurations
ACCOUNTS = {
    "ladymacbeth": AccountConfig(
        username="LadyMacbethAI",
        display_name="Lady Macbeth",
        schedule_description="Posts 18:00-06:00 UTC, 1-1.5hr intervals, max 10/day, replies within 30min",
        active_hours_utc=list(range(18, 24)) + list(range(0, 7)),  # 6PM-6AM UTC
        max_posts_per_day=10,
        min_interval_minutes=60,
        max_interval_minutes=90,
        reply_window_minutes=30
    ),
    "bitbard": AccountConfig(
        username="BitBardOfficial", 
        display_name="BitBard",
        schedule_description="Daily 'Cue' at 08:00 Mountain Time (14:00/15:00 UTC), occasional extras",
        active_hours_utc=[14, 15],  # 8AM Mountain = 2PM/3PM UTC (depending on DST)
        max_posts_per_day=5,
        min_interval_minutes=60,
        max_interval_minutes=1440,  # Up to 24 hours between posts
        reply_window_minutes=60
    )
}

# Monitoring settings
MONITORING_CONFIG = {
    "check_interval_minutes": 5,  # How often to scrape
    "lookback_hours": 24,  # How far back to check for posts
    "data_retention_days": 30,  # Keep data for analysis
    "log_level": "INFO",
    "alerts_enabled": True,
    "alert_thresholds": {
        "no_posts_hours": 6,  # Alert if no posts for X hours during active time
        "missed_scheduled_post_minutes": 30,  # Alert if scheduled post is late
        "excessive_posts_count": 15  # Alert if too many posts in 24h
    }
}

# File paths
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
LOGS_DIR = os.path.join(os.path.dirname(__file__), "logs")
REPORTS_DIR = os.path.join(os.path.dirname(__file__), "reports")

# Ensure directories exist
for dir_path in [DATA_DIR, LOGS_DIR, REPORTS_DIR]:
    os.makedirs(dir_path, exist_ok=True) 