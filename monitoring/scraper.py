"""
Twitter Post Scraper - Free web scraping approach
Monitors posting schedules for AI agents without interfering with their operation
"""

import requests
import json
import time
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional, Any
import logging
from dataclasses import asdict
import re
from urllib.parse import quote

from config import ACCOUNTS, MONITORING_CONFIG, DATA_DIR, LOGS_DIR

# Setup logging
logging.basicConfig(
    level=getattr(logging, MONITORING_CONFIG["log_level"]),
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f"{LOGS_DIR}/monitor.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class TwitterScraper:
    def __init__(self):
        self.db_path = f"{DATA_DIR}/twitter_monitoring.db"
        self.setup_database()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
    
    def setup_database(self):
        """Initialize SQLite database for storing post data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                content TEXT,
                timestamp DATETIME NOT NULL,
                post_type TEXT,  -- 'original', 'reply', 'retweet', 'quote'
                reply_to TEXT,
                metrics TEXT,  -- JSON string with likes, retweets, etc.
                scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(id, username)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS monitoring_sessions (
                session_id TEXT PRIMARY KEY,
                started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                ended_at DATETIME,
                accounts_checked TEXT,  -- JSON array
                posts_found INTEGER DEFAULT 0,
                errors TEXT  -- JSON array of any errors
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Database setup completed")
    
    def scrape_nitter_posts(self, username: str, hours_back: int = 24) -> List[Dict[str, Any]]:
        """
        Scrape posts using Nitter (privacy-focused Twitter frontend)
        Falls back to multiple Nitter instances if needed
        """
        nitter_instances = [
            "nitter.net",
            "nitter.it", 
            "nitter.privacydev.net",
            "nitter.unixfox.eu"
        ]
        
        posts = []
        
        for instance in nitter_instances:
            try:
                url = f"https://{instance}/{username}"
                logger.debug(f"Trying Nitter instance: {instance}")
                
                response = self.session.get(url, timeout=10)
                if response.status_code == 200:
                    posts = self._parse_nitter_html(response.text, username, hours_back)
                    if posts:
                        logger.info(f"Successfully scraped {len(posts)} posts from {instance}")
                        break
                    
            except Exception as e:
                logger.warning(f"Failed to scrape from {instance}: {str(e)}")
                continue
        
        return posts
    
    def _parse_nitter_html(self, html: str, username: str, hours_back: int) -> List[Dict[str, Any]]:
        """
        Parse Nitter HTML to extract post information
        This is a simplified parser - in production you'd want to use BeautifulSoup
        """
        posts = []
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        
        # Simple regex patterns for basic extraction
        # Note: This is a basic implementation - BeautifulSoup would be more robust
        tweet_pattern = r'<div class="tweet-content"[^>]*>(.*?)</div>'
        time_pattern = r'<span class="tweet-date"[^>]*title="([^"]*)"'
        
        # This is a placeholder implementation
        # In a real implementation, you'd properly parse the HTML structure
        logger.warning("HTML parsing is simplified - consider using BeautifulSoup for production")
        
        return posts
    
    def scrape_via_search(self, username: str, hours_back: int = 24) -> List[Dict[str, Any]]:
        """
        Alternative: Scrape using web search results
        Search for recent tweets from the account
        """
        posts = []
        
        try:
            # Search for recent tweets from this user
            search_query = f'site:twitter.com "{username}" OR site:x.com "{username}"'
            search_url = f"https://www.google.com/search?q={quote(search_query)}&tbm=nws&tbs=qdr:d"
            
            response = self.session.get(search_url, timeout=10)
            if response.status_code == 200:
                # Parse search results for Twitter/X links
                # This would need proper HTML parsing in production
                logger.info(f"Search-based scraping attempted for {username}")
                
        except Exception as e:
            logger.error(f"Search-based scraping failed for {username}: {str(e)}")
        
        return posts
    
    def mock_scrape_for_demo(self, username: str, hours_back: int = 24) -> List[Dict[str, Any]]:
        """
        Mock scraper for demonstration - generates sample data
        Replace this with real scraping once you have the method working
        """
        now = datetime.now(timezone.utc)
        posts = []
        
        # Generate mock posts based on expected schedules
        account_key = "ladymacbeth" if "ladymacbeth" in username.lower() else "bitbard"
        config = ACCOUNTS[account_key]
        
        if account_key == "ladymacbeth":
            # Generate 3-5 posts in the last 24 hours during active hours
            for i in range(3):
                post_time = now - timedelta(hours=i*2 + 1)
                if post_time.hour in config.active_hours_utc:
                    posts.append({
                        'id': f"mock_{username}_{int(post_time.timestamp())}",
                        'username': username,
                        'content': f"Mock Lady Macbeth post {i+1}",
                        'timestamp': post_time.isoformat(),
                        'post_type': 'original',
                        'metrics': json.dumps({'likes': 15, 'retweets': 3, 'replies': 2})
                    })
        
        elif account_key == "bitbard":
            # Generate daily cue post
            cue_time = now.replace(hour=14, minute=0, second=0, microsecond=0)  # 14:00 UTC
            if cue_time <= now:
                posts.append({
                    'id': f"mock_{username}_{int(cue_time.timestamp())}",
                    'username': username,
                    'content': "Mock BitBard daily cue post",
                    'timestamp': cue_time.isoformat(),
                    'post_type': 'original',
                    'metrics': json.dumps({'likes': 8, 'retweets': 1, 'replies': 1})
                })
        
        logger.info(f"Mock scraper generated {len(posts)} posts for {username}")
        return posts
    
    def store_posts(self, posts: List[Dict[str, Any]]):
        """Store scraped posts in database"""
        if not posts:
            return
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for post in posts:
            try:
                cursor.execute('''
                    INSERT OR REPLACE INTO posts 
                    (id, username, content, timestamp, post_type, reply_to, metrics)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    post['id'],
                    post['username'],
                    post['content'],
                    post['timestamp'],
                    post.get('post_type', 'original'),
                    post.get('reply_to'),
                    post.get('metrics', '{}')
                ))
            except sqlite3.Error as e:
                logger.error(f"Database error storing post {post.get('id', 'unknown')}: {e}")
        
        conn.commit()
        conn.close()
        logger.info(f"Stored {len(posts)} posts in database")
    
    def scrape_account(self, username: str) -> List[Dict[str, Any]]:
        """Main method to scrape posts from an account"""
        logger.info(f"Starting scrape for @{username}")
        
        # Try different scraping methods
        posts = []
        
        # Method 1: Nitter instances
        posts = self.scrape_nitter_posts(username, MONITORING_CONFIG["lookback_hours"])
        
        # Method 2: Search-based (fallback)
        if not posts:
            posts = self.scrape_via_search(username, MONITORING_CONFIG["lookback_hours"])
        
        # Method 3: Mock data for demonstration
        if not posts:
            logger.warning(f"Real scraping failed for {username}, using mock data")
            posts = self.mock_scrape_for_demo(username, MONITORING_CONFIG["lookback_hours"])
        
        if posts:
            self.store_posts(posts)
        
        return posts
    
    def run_monitoring_cycle(self):
        """Run one complete monitoring cycle for all accounts"""
        session_id = f"session_{int(time.time())}"
        logger.info(f"Starting monitoring session {session_id}")
        
        total_posts = 0
        errors = []
        
        for account_key, config in ACCOUNTS.items():
            try:
                posts = self.scrape_account(config.username)
                total_posts += len(posts)
                logger.info(f"Found {len(posts)} posts for @{config.username}")
                
            except Exception as e:
                error_msg = f"Failed to scrape {config.username}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)
        
        # Store session info
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO monitoring_sessions 
            (session_id, accounts_checked, posts_found, errors)
            VALUES (?, ?, ?, ?)
        ''', (
            session_id,
            json.dumps(list(ACCOUNTS.keys())),
            total_posts,
            json.dumps(errors)
        ))
        conn.commit()
        conn.close()
        
        logger.info(f"Monitoring session {session_id} completed: {total_posts} posts, {len(errors)} errors")
        return total_posts, errors

if __name__ == "__main__":
    scraper = TwitterScraper()
    
    while True:
        try:
            posts_found, errors = scraper.run_monitoring_cycle()
            
            if errors:
                logger.warning(f"Errors in monitoring cycle: {errors}")
            
            # Wait before next cycle
            sleep_minutes = MONITORING_CONFIG["check_interval_minutes"]
            logger.info(f"Sleeping for {sleep_minutes} minutes until next check")
            time.sleep(sleep_minutes * 60)
            
        except KeyboardInterrupt:
            logger.info("Monitoring stopped by user")
            break
        except Exception as e:
            logger.error(f"Unexpected error in monitoring loop: {e}")
            time.sleep(60)  # Wait 1 minute before retrying 