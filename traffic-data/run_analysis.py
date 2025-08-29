#!/usr/bin/env python3
"""
Simple runner script for EBP Dashboard traffic analysis
Run this from the traffic-data directory for easy analysis
"""

import os
import sys
from pathlib import Path

def main():
    """Run the traffic analysis from the traffic-data directory"""
    
    # Ensure we're in the right directory
    current_dir = Path.cwd()
    if current_dir.name != "traffic-data":
        print("⚠️  This script should be run from the traffic-data directory")
        print(f"Current directory: {current_dir}")
        print("Please navigate to the traffic-data folder and run again")
        sys.exit(1)
    
    # Check if data exists
    if not Path("weekly_summary.csv").exists():
        print("❌ No traffic data found!")
        print("Run the historical data script first if this is a new setup")
        sys.exit(1)
    
    print("🚀 Starting traffic analysis from traffic-data directory...")
    print("="*60)
    
    # Import and run the analysis
    try:
        from analyze_traffic_data import main as run_analysis
        run_analysis()
    except ImportError as e:
        print(f"❌ Could not import analysis module: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
