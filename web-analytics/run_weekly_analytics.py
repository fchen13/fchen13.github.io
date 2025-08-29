#!/usr/bin/env python3
"""
Simple runner script for EBP Dashboard weekly web analytics
Handles: collect weekly data → analyze trends → generate visualizations
Similar to GitHub traffic analysis workflow
"""

import os
import sys
from pathlib import Path

def main():
    """Run the complete weekly web analytics workflow"""
    
    # Ensure we're in the right directory
    current_dir = Path.cwd()
    if current_dir.name != "web-analytics":
        print("⚠️  This script should be run from the web-analytics directory")
        print(f"Current directory: {current_dir}")
        print("Please navigate to the web-analytics folder and run again")
        sys.exit(1)
    
    print("🚀 Starting EBP Dashboard Weekly Web Analytics Workflow")
    print("="*80)
    
    # Check if setup is complete
    config_file = Path("ga4_config.json")
    credentials_file = Path("ga4_service_account.json")
    
    if not config_file.exists() or not credentials_file.exists():
        print("⚠️  Setup not complete!")
        print("")
        if not config_file.exists():
            print("❌ Missing: ga4_config.json")
        if not credentials_file.exists():
            print("❌ Missing: ga4_service_account.json")
        print("")
        print("💡 Run 'python setup_ga4_api.py' first to complete setup")
        sys.exit(1)
    
    print("✅ Configuration and credentials found")
    print("")
    
    # Step 1: Collect weekly data
    print("📊 Step 1: Collecting weekly web analytics data...")
    print("-" * 50)
    
    try:
        from collect_weekly_analytics import WeeklyAnalyticsCollector
        
        collector = WeeklyAnalyticsCollector()
        if collector.run_weekly_collection():
            print("✅ Weekly data collection successful")
        else:
            print("❌ Weekly data collection failed")
            sys.exit(1)
            
    except ImportError as e:
        print(f"❌ Could not import weekly collection module: {e}")
        print("💡 Make sure requirements are installed: pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Weekly data collection failed: {e}")
        sys.exit(1)
    
    print("")
    
    # Step 2: Analyze trends (only if we have data)
    weekly_csv = Path("weekly_web_analytics.csv")
    if weekly_csv.exists():
        print("📈 Step 2: Analyzing weekly trends and generating visualizations...")
        print("-" * 60)
        
        try:
            from analyze_weekly_trends import main as run_trends_analysis
            run_trends_analysis()
            
        except ImportError as e:
            print(f"❌ Could not import trends analysis module: {e}")
            sys.exit(1)
        except Exception as e:
            print(f"❌ Trends analysis failed: {e}")
            # Don't exit here - collection was successful
            print("⚠️  Collection was successful, but trends analysis failed")
    else:
        print("⚠️  No historical data yet for trends analysis")
        print("💡 Run this script weekly to build trend data over time")
    
    # Summary
    print("")
    print("🎉 Weekly Web Analytics Workflow Complete!")
    print("="*80)
    print("📁 Generated files:")
    print("   📊 Data Files:")
    print("     • weekly_web_analytics.csv (cumulative weekly data)")
    print("     • weekly_analytics_YYYY-WXX.json (detailed weekly data)")
    
    if weekly_csv.exists():
        print("")
        print("   📈 Trend Visualization:")
        print("     • weekly_engagement_trends.png (engagement trends & growth)")
    
    print("")
    print("💡 Usage Tips:")
    print("   • Run this script weekly to build historical trends")
    print("   • Compare with GitHub repository traffic data in ../traffic-data/")
    print("   • Data format matches repository traffic for consistent analysis")
    print("")
    print("🔄 Automation:")
    print("   • Can be automated via GitHub Actions similar to repository traffic")
    print("   • Weekly collection recommended (Sundays to match repo traffic)")

if __name__ == "__main__":
    main()
