"""
Simple Web Dashboard for Twitter Monitoring
View real-time posting schedules and compliance reports
"""

import os
import json
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse
import threading
import time

from config import ACCOUNTS, DATA_DIR, REPORTS_DIR
from analyzer import ScheduleAnalyzer

class MonitoringDashboard(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.analyzer = ScheduleAnalyzer()
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urllib.parse.urlparse(self.path)
        
        if parsed_path.path == '/':
            self.serve_dashboard()
        elif parsed_path.path == '/api/status':
            self.serve_status_api()
        elif parsed_path.path == '/api/report':
            hours = int(urllib.parse.parse_qs(parsed_path.query).get('hours', ['24'])[0])
            self.serve_report_api(hours)
        elif parsed_path.path == '/api/posts':
            username = urllib.parse.parse_qs(parsed_path.query).get('username', [''])[0]
            hours = int(urllib.parse.parse_qs(parsed_path.query).get('hours', ['24'])[0])
            self.serve_posts_api(username, hours)
        else:
            self.send_error(404)
    
    def serve_dashboard(self):
        """Serve the main dashboard HTML"""
        html = self.generate_dashboard_html()
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def serve_status_api(self):
        """Serve current monitoring status"""
        try:
            # Get latest monitoring session
            conn = sqlite3.connect(f"{DATA_DIR}/twitter_monitoring.db")
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT session_id, started_at, posts_found, errors
                FROM monitoring_sessions 
                ORDER BY started_at DESC 
                LIMIT 1
            ''')
            
            row = cursor.fetchone()
            if row:
                status = {
                    'last_check': row[1],
                    'posts_found': row[2],
                    'errors': json.loads(row[3]) if row[3] else [],
                    'status': 'active' if not json.loads(row[3]) else 'warning'
                }
            else:
                status = {
                    'last_check': None,
                    'posts_found': 0,
                    'errors': [],
                    'status': 'unknown'
                }
            
            conn.close()
            
            self.send_json_response(status)
            
        except Exception as e:
            self.send_json_response({'error': str(e)}, 500)
    
    def serve_report_api(self, hours: int):
        """Serve analysis report"""
        try:
            report = self.analyzer.generate_report(hours)
            self.send_json_response(report)
        except Exception as e:
            self.send_json_response({'error': str(e)}, 500)
    
    def serve_posts_api(self, username: str, hours: int):
        """Serve posts for a specific user"""
        try:
            posts = self.analyzer.get_posts_in_timeframe(username, hours)
            # Convert datetime objects to strings for JSON serialization
            for post in posts:
                post['timestamp'] = post['timestamp'].isoformat()
            
            self.send_json_response(posts)
        except Exception as e:
            self.send_json_response({'error': str(e)}, 500)
    
    def send_json_response(self, data: Dict, status_code: int = 200):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode())
    
    def generate_dashboard_html(self) -> str:
        """Generate the dashboard HTML"""
        return '''
<!DOCTYPE html>
<html>
<head>
    <title>Twitter AI Agent Monitoring</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status.active { background: #27ae60; color: white; }
        .status.warning { background: #f39c12; color: white; }
        .status.error { background: #e74c3c; color: white; }
        .account-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 20px; }
        .metric { display: inline-block; margin-right: 20px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .metric-label { font-size: 12px; color: #7f8c8d; }
        .issues { background: #ffe6e6; padding: 10px; border-radius: 4px; margin-top: 10px; }
        .no-issues { background: #e8f5e8; padding: 10px; border-radius: 4px; margin-top: 10px; }
        .post-preview { background: #f8f9fa; padding: 10px; border-left: 3px solid #3498db; margin: 5px 0; }
        .auto-refresh { float: right; }
        .refresh-button { background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        .refresh-button:hover { background: #2980b9; }
        .loading { text-align: center; padding: 20px; color: #7f8c8d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎭 AI Agent Twitter Monitoring</h1>
            <p>External monitoring of posting schedules for Lady Macbeth and BitBard</p>
            <div class="auto-refresh">
                <button class="refresh-button" onclick="refreshData()">🔄 Refresh</button>
                <span id="last-update"></span>
            </div>
        </div>
        
        <div class="card">
            <h2>📊 System Status</h2>
            <div id="system-status" class="loading">Loading status...</div>
        </div>
        
        <div class="card">
            <h2>📈 Schedule Compliance (Last 24 Hours)</h2>
            <div id="compliance-report" class="loading">Loading compliance report...</div>
        </div>
        
        <div class="account-grid" id="account-details">
            <!-- Account details will be loaded here -->
        </div>
    </div>

    <script>
        let refreshInterval;
        
        function refreshData() {
            loadSystemStatus();
            loadComplianceReport();
            updateLastUpdate();
        }
        
        function loadSystemStatus() {
            fetch('/api/status')
                .then(response => response.json())
                .then(data => {
                    const statusDiv = document.getElementById('system-status');
                    const statusClass = data.status || 'unknown';
                    const lastCheck = data.last_check ? new Date(data.last_check).toLocaleString() : 'Never';
                    
                    statusDiv.innerHTML = `
                        <div class="metric">
                            <div class="metric-value">
                                <span class="status ${statusClass}">${statusClass.toUpperCase()}</span>
                            </div>
                            <div class="metric-label">System Status</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${data.posts_found || 0}</div>
                            <div class="metric-label">Posts Found (Last Check)</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${lastCheck}</div>
                            <div class="metric-label">Last Check</div>
                        </div>
                        ${data.errors && data.errors.length > 0 ? `
                            <div class="issues">
                                <strong>⚠️ Errors:</strong>
                                <ul>${data.errors.map(e => `<li>${e}</li>`).join('')}</ul>
                            </div>
                        ` : ''}
                    `;
                })
                .catch(error => {
                    document.getElementById('system-status').innerHTML = 
                        `<div class="issues">Error loading status: ${error.message}</div>`;
                });
        }
        
        function loadComplianceReport() {
            fetch('/api/report?hours=24')
                .then(response => response.json())
                .then(data => {
                    const reportDiv = document.getElementById('compliance-report');
                    const accountDetailsDiv = document.getElementById('account-details');
                    
                    // Summary metrics
                    reportDiv.innerHTML = `
                        <div class="metric">
                            <div class="metric-value">${data.summary.average_compliance.toFixed(1)}%</div>
                            <div class="metric-label">Average Compliance</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${data.summary.total_posts}</div>
                            <div class="metric-label">Total Posts</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${data.summary.total_issues}</div>
                            <div class="metric-label">Total Issues</div>
                        </div>
                    `;
                    
                    // Account details
                    accountDetailsDiv.innerHTML = '';
                    Object.entries(data.accounts).forEach(([key, account]) => {
                        const accountCard = document.createElement('div');
                        accountCard.className = 'card';
                        
                        const issuesHtml = account.issues.length > 0 ? 
                            `<div class="issues">
                                <strong>⚠️ Issues:</strong>
                                <ul>${account.issues.map(issue => `<li>${issue}</li>`).join('')}</ul>
                            </div>` :
                            `<div class="no-issues">✅ No issues detected</div>`;
                        
                        const recentPosts = account.post_details.slice(0, 3).map(post => 
                            `<div class="post-preview">
                                <strong>${post.timestamp}</strong> • ${post.post_type}<br>
                                ${post.content_preview}
                            </div>`
                        ).join('');
                        
                        accountCard.innerHTML = `
                            <h3>🎭 ${account.display_name} (@${account.account})</h3>
                            <div class="metric">
                                <div class="metric-value">${account.compliance_score.toFixed(1)}%</div>
                                <div class="metric-label">Compliance Score</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">${account.posts_found}</div>
                                <div class="metric-label">Posts Found</div>
                            </div>
                            <p><strong>Expected Schedule:</strong> ${account.expected_schedule}</p>
                            ${issuesHtml}
                            ${recentPosts ? `<h4>Recent Posts:</h4>${recentPosts}` : ''}
                        `;
                        
                        accountDetailsDiv.appendChild(accountCard);
                    });
                })
                .catch(error => {
                    document.getElementById('compliance-report').innerHTML = 
                        `<div class="issues">Error loading report: ${error.message}</div>`;
                });
        }
        
        function updateLastUpdate() {
            document.getElementById('last-update').textContent = 
                `Last updated: ${new Date().toLocaleTimeString()}`;
        }
        
        // Initial load
        refreshData();
        
        // Auto-refresh every 2 minutes
        refreshInterval = setInterval(refreshData, 120000);
    </script>
</body>
</html>
        '''

def run_dashboard_server(port: int = 8080):
    """Run the dashboard web server"""
    server = HTTPServer(('localhost', port), MonitoringDashboard)
    print(f"🌐 Dashboard running at http://localhost:{port}")
    print("Press Ctrl+C to stop")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Dashboard server stopped")
        server.shutdown()

if __name__ == "__main__":
    run_dashboard_server() 