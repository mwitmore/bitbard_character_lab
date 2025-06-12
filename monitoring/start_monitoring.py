#!/usr/bin/env python3
"""
Twitter Monitoring Startup Script
Runs the scraper and dashboard in parallel for complete monitoring
"""

import sys
import time
import threading
import signal
import logging
from multiprocessing import Process

from scraper import TwitterScraper
from dashboard import run_dashboard_server
from analyzer import ScheduleAnalyzer

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MonitoringOrchestrator:
    def __init__(self):
        self.scraper_process = None
        self.dashboard_process = None
        self.running = False
    
    def start_scraper(self):
        """Start the scraper in a separate process"""
        logger.info("🔍 Starting Twitter scraper...")
        
        def run_scraper():
            scraper = TwitterScraper()
            while self.running:
                try:
                    posts_found, errors = scraper.run_monitoring_cycle()
                    logger.info(f"Scraper cycle complete: {posts_found} posts, {len(errors)} errors")
                    
                    if not self.running:
                        break
                    
                    # Sleep for the configured interval
                    time.sleep(300)  # 5 minutes
                    
                except Exception as e:
                    logger.error(f"Scraper error: {e}")
                    if self.running:
                        time.sleep(60)  # Wait 1 minute before retrying
        
        self.scraper_thread = threading.Thread(target=run_scraper, daemon=True)
        self.scraper_thread.start()
    
    def start_dashboard(self, port: int = 8080):
        """Start the dashboard in a separate process"""
        logger.info(f"🌐 Starting dashboard on port {port}...")
        
        def run_dashboard():
            try:
                run_dashboard_server(port)
            except Exception as e:
                logger.error(f"Dashboard error: {e}")
        
        self.dashboard_process = Process(target=run_dashboard)
        self.dashboard_process.start()
    
    def start(self, dashboard_port: int = 8080):
        """Start both scraper and dashboard"""
        logger.info("🚀 Starting Twitter monitoring system...")
        
        self.running = True
        
        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        try:
            # Start components
            self.start_scraper()
            self.start_dashboard(dashboard_port)
            
            logger.info(f"✅ Monitoring system started!")
            logger.info(f"📊 Dashboard: http://localhost:{dashboard_port}")
            logger.info(f"🔍 Scraper: Running every 5 minutes")
            logger.info(f"📁 Data: monitoring/data/")
            logger.info(f"📋 Reports: monitoring/reports/")
            logger.info("Press Ctrl+C to stop")
            
            # Run initial analysis
            analyzer = ScheduleAnalyzer()
            initial_report = analyzer.generate_report(24)
            analyzer.print_report_summary(initial_report)
            
            # Keep main thread alive
            while self.running:
                time.sleep(1)
                
        except KeyboardInterrupt:
            self.stop()
        except Exception as e:
            logger.error(f"Fatal error: {e}")
            self.stop()
            sys.exit(1)
    
    def stop(self):
        """Stop all monitoring components"""
        logger.info("🛑 Stopping monitoring system...")
        
        self.running = False
        
        # Stop dashboard
        if self.dashboard_process and self.dashboard_process.is_alive():
            self.dashboard_process.terminate()
            self.dashboard_process.join(timeout=5)
            if self.dashboard_process.is_alive():
                self.dashboard_process.kill()
        
        # Scraper will stop naturally when self.running = False
        
        logger.info("✅ Monitoring system stopped")
    
    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}, shutting down...")
        self.stop()
        sys.exit(0)

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Twitter AI Agent Monitoring System')
    parser.add_argument('--port', type=int, default=8080, 
                       help='Dashboard port (default: 8080)')
    parser.add_argument('--scraper-only', action='store_true',
                       help='Run only the scraper (no dashboard)')
    parser.add_argument('--dashboard-only', action='store_true',
                       help='Run only the dashboard (no scraper)')
    parser.add_argument('--report-only', action='store_true',
                       help='Generate a one-time report and exit')
    parser.add_argument('--hours', type=int, default=24,
                       help='Hours to analyze for report (default: 24)')
    
    args = parser.parse_args()
    
    if args.report_only:
        # Generate one-time report
        analyzer = ScheduleAnalyzer()
        report = analyzer.generate_report(args.hours)
        analyzer.print_report_summary(report)
        return
    
    orchestrator = MonitoringOrchestrator()
    
    if args.scraper_only:
        # Run only scraper
        logger.info("Running scraper only...")
        orchestrator.running = True
        orchestrator.start_scraper()
        
        try:
            while orchestrator.running:
                time.sleep(1)
        except KeyboardInterrupt:
            orchestrator.stop()
    
    elif args.dashboard_only:
        # Run only dashboard
        logger.info("Running dashboard only...")
        run_dashboard_server(args.port)
    
    else:
        # Run full monitoring system
        orchestrator.start(args.port)

if __name__ == "__main__":
    main() 