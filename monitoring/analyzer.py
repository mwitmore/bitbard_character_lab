"""
Schedule Analysis Module
Analyzes posting patterns and generates compliance reports
"""

import sqlite3
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Tuple
import logging

from config import ACCOUNTS, MONITORING_CONFIG, DATA_DIR, REPORTS_DIR

logger = logging.getLogger(__name__)

class ScheduleAnalyzer:
    def __init__(self):
        self.db_path = f"{DATA_DIR}/twitter_monitoring.db"
    
    def get_posts_in_timeframe(self, username: str, hours_back: int = 24) -> List[Dict[str, Any]]:
        """Get all posts for a user in the specified timeframe"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        
        cursor.execute('''
            SELECT id, username, content, timestamp, post_type, reply_to, metrics, scraped_at
            FROM posts 
            WHERE username = ? AND timestamp > ?
            ORDER BY timestamp DESC
        ''', (username, cutoff_time.isoformat()))
        
        posts = []
        for row in cursor.fetchall():
            posts.append({
                'id': row[0],
                'username': row[1],
                'content': row[2],
                'timestamp': datetime.fromisoformat(row[3].replace('Z', '+00:00')),
                'post_type': row[4],
                'reply_to': row[5],
                'metrics': json.loads(row[6]) if row[6] else {},
                'scraped_at': row[7]
            })
        
        conn.close()
        return posts
    
    def analyze_posting_schedule(self, account_key: str, hours_back: int = 24) -> Dict[str, Any]:
        """Analyze how well an account follows its expected schedule"""
        config = ACCOUNTS[account_key]
        posts = self.get_posts_in_timeframe(config.username, hours_back)
        
        analysis = {
            'account': config.username,
            'display_name': config.display_name,
            'analysis_period_hours': hours_back,
            'expected_schedule': config.schedule_description,
            'posts_found': len(posts),
            'compliance_score': 0.0,
            'issues': [],
            'recommendations': [],
            'post_details': []
        }
        
        if not posts:
            analysis['issues'].append("No posts found in analysis period")
            analysis['recommendations'].append("Check if agent is posting or if scraping is working")
            return analysis
        
        # Analyze posting frequency
        original_posts = [p for p in posts if p['post_type'] == 'original']
        analysis['original_posts_count'] = len(original_posts)
        
        # Check daily post limit
        if len(original_posts) > config.max_posts_per_day:
            analysis['issues'].append(f"Exceeded daily post limit: {len(original_posts)}/{config.max_posts_per_day}")
        
        # Analyze posting times
        posting_hours = [p['timestamp'].hour for p in original_posts]
        active_hour_posts = [h for h in posting_hours if h in config.active_hours_utc]
        
        if original_posts:
            active_compliance = len(active_hour_posts) / len(original_posts)
            analysis['active_hours_compliance'] = active_compliance
            
            if active_compliance < 0.8:  # 80% threshold
                analysis['issues'].append(f"Many posts outside active hours: {active_compliance:.1%} compliance")
        
        # Analyze posting intervals
        if len(original_posts) > 1:
            intervals = []
            sorted_posts = sorted(original_posts, key=lambda x: x['timestamp'])
            
            for i in range(1, len(sorted_posts)):
                interval = (sorted_posts[i]['timestamp'] - sorted_posts[i-1]['timestamp']).total_seconds() / 60
                intervals.append(interval)
            
            avg_interval = sum(intervals) / len(intervals)
            analysis['average_interval_minutes'] = avg_interval
            
            # Check if intervals are within expected range
            if avg_interval < config.min_interval_minutes:
                analysis['issues'].append(f"Posting too frequently: {avg_interval:.1f}min avg (min: {config.min_interval_minutes}min)")
            elif avg_interval > config.max_interval_minutes:
                analysis['issues'].append(f"Posting too infrequently: {avg_interval:.1f}min avg (max: {config.max_interval_minutes}min)")
        
        # Account-specific analysis
        if account_key == "bitbard":
            analysis.update(self._analyze_bitbard_schedule(posts, config))
        elif account_key == "ladymacbeth":
            analysis.update(self._analyze_ladymacbeth_schedule(posts, config))
        
        # Calculate overall compliance score
        score = 100.0
        score -= len(analysis['issues']) * 15  # -15 points per issue
        score = max(0, score)
        analysis['compliance_score'] = score
        
        # Add post details for manual review
        for post in posts[:10]:  # Latest 10 posts
            analysis['post_details'].append({
                'timestamp': post['timestamp'].strftime('%Y-%m-%d %H:%M UTC'),
                'content_preview': post['content'][:100] + "..." if len(post['content']) > 100 else post['content'],
                'post_type': post['post_type'],
                'metrics': post['metrics']
            })
        
        return analysis
    
    def _analyze_bitbard_schedule(self, posts: List[Dict], config) -> Dict[str, Any]:
        """BitBard-specific schedule analysis"""
        analysis = {}
        
        # Look for daily "Cue" posts around 14:00-15:00 UTC (8AM Mountain)
        cue_posts = []
        for post in posts:
            if post['post_type'] == 'original' and post['timestamp'].hour in [14, 15]:
                # Check if it's a "cue" type post (would need content analysis)
                cue_posts.append(post)
        
        analysis['daily_cue_posts'] = len(cue_posts)
        
        if len(cue_posts) == 0:
            analysis['issues'] = analysis.get('issues', [])
            analysis['issues'].append("No daily cue posts found at expected time (14:00-15:00 UTC)")
        elif len(cue_posts) > 1:
            analysis['issues'] = analysis.get('issues', [])
            analysis['issues'].append(f"Multiple cue posts found: {len(cue_posts)} (expected: 1)")
        
        return analysis
    
    def _analyze_ladymacbeth_schedule(self, posts: List[Dict], config) -> Dict[str, Any]:
        """Lady Macbeth-specific schedule analysis"""
        analysis = {}
        
        # Check reply responsiveness
        replies = [p for p in posts if p['post_type'] == 'reply']
        analysis['reply_count'] = len(replies)
        
        # Note: In a real implementation, we'd track mention timestamps vs reply timestamps
        # to measure the 30-minute reply window compliance
        
        # Check for consistent activity during night hours (18:00-06:00 UTC)
        night_posts = [p for p in posts if p['timestamp'].hour in config.active_hours_utc]
        if posts:
            night_compliance = len(night_posts) / len(posts)
            analysis['night_hours_compliance'] = night_compliance
            
            if night_compliance < 0.7:  # 70% threshold for night activity
                analysis['issues'] = analysis.get('issues', [])
                analysis['issues'].append(f"Low night activity: {night_compliance:.1%} of posts")
        
        return analysis
    
    def generate_report(self, hours_back: int = 24) -> Dict[str, Any]:
        """Generate comprehensive monitoring report"""
        report = {
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'analysis_period_hours': hours_back,
            'accounts': {},
            'summary': {
                'total_posts': 0,
                'total_issues': 0,
                'average_compliance': 0.0
            }
        }
        
        total_compliance = 0
        account_count = 0
        
        for account_key, config in ACCOUNTS.items():
            logger.info(f"Analyzing {config.display_name} schedule compliance")
            
            analysis = self.analyze_posting_schedule(account_key, hours_back)
            report['accounts'][account_key] = analysis
            
            report['summary']['total_posts'] += analysis['posts_found']
            report['summary']['total_issues'] += len(analysis['issues'])
            total_compliance += analysis['compliance_score']
            account_count += 1
        
        if account_count > 0:
            report['summary']['average_compliance'] = total_compliance / account_count
        
        # Save report to file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        report_file = f"{REPORTS_DIR}/schedule_report_{timestamp}.json"
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"Report saved to {report_file}")
        return report
    
    def print_report_summary(self, report: Dict[str, Any]):
        """Print a human-readable summary of the report"""
        print(f"\n🔍 TWITTER SCHEDULE MONITORING REPORT")
        print(f"📅 Generated: {report['generated_at']}")
        print(f"⏱️  Analysis Period: {report['analysis_period_hours']} hours")
        print(f"📊 Overall Compliance: {report['summary']['average_compliance']:.1f}%")
        print(f"📝 Total Posts: {report['summary']['total_posts']}")
        print(f"⚠️  Total Issues: {report['summary']['total_issues']}")
        
        for account_key, analysis in report['accounts'].items():
            print(f"\n🎭 {analysis['display_name']} (@{analysis['account']})")
            print(f"   Compliance Score: {analysis['compliance_score']:.1f}%")
            print(f"   Posts Found: {analysis['posts_found']}")
            print(f"   Expected: {analysis['expected_schedule']}")
            
            if analysis['issues']:
                print("   ⚠️  Issues:")
                for issue in analysis['issues']:
                    print(f"      • {issue}")
            else:
                print("   ✅ No issues detected")
        
        print(f"\n📂 Full report saved to reports/ directory")

if __name__ == "__main__":
    analyzer = ScheduleAnalyzer()
    
    # Generate report for last 24 hours
    report = analyzer.generate_report(24)
    analyzer.print_report_summary(report) 