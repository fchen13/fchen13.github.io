#!/usr/bin/env python3
"""
Google Analytics 4 API Setup Script for EBP Dashboard
Sets up authentication and basic API connection testing
"""

import os
import json
from pathlib import Path
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Metric,
    RunReportRequest,
)
from google.oauth2.service_account import Credentials

class GA4APISetup:
    def __init__(self):
        self.credentials_file = Path("ga4_service_account.json")
        self.config_file = Path("ga4_config.json")
        self.property_id = None
        self.client = None
        
    def create_config_template(self):
        """Create a configuration template file"""
        
        config_template = {
            "property_id": "YOUR_GA4_PROPERTY_ID",
            "measurement_id": "G-XXXXXXXXXX", 
            "website_url": "https://your-dashboard-url.com",
            "data_collection": {
                "start_date": "2024-07-01",
                "frequency": "weekly",
                "timezone": "UTC"
            },
            "metrics_to_collect": [
                "sessions",
                "totalUsers", 
                "newUsers",
                "pageviews",
                "screenPageViews",
                "bounceRate",
                "averageSessionDuration",
                "engagementRate"
            ],
            "dimensions_to_collect": [
                "date",
                "country",
                "city",
                "deviceCategory",
                "browser",
                "operatingSystem"
            ],
            "custom_events": [
                "visualization_click",
                "category_view", 
                "dashboard_loaded",
                "scroll_depth"
            ]
        }
        
        with open(self.config_file, 'w') as f:
            json.dump(config_template, f, indent=2)
        
        print(f"✅ Configuration template created: {self.config_file}")
        print(f"📝 Please update the configuration with your actual GA4 property details")
    
    def load_config(self):
        """Load configuration from file"""
        
        if not self.config_file.exists():
            print(f"❌ Configuration file not found: {self.config_file}")
            print(f"💡 Run create_config_template() first")
            return False
            
        with open(self.config_file, 'r') as f:
            config = json.load(f)
            
        self.property_id = config.get('property_id')
        
        if self.property_id == "YOUR_GA4_PROPERTY_ID":
            print(f"❌ Please update {self.config_file} with your actual property ID")
            return False
            
        print(f"✅ Configuration loaded for property: {self.property_id}")
        return True
    
    def setup_authentication(self):
        """Set up Google Analytics API authentication"""
        
        if not self.credentials_file.exists():
            print(f"❌ Service account credentials not found: {self.credentials_file}")
            print(f"")
            print(f"📋 SETUP INSTRUCTIONS:")
            print(f"")
            print(f"1. Go to Google Cloud Console:")
            print(f"   https://console.cloud.google.com/")
            print(f"")
            print(f"2. Create a new project or select existing project")
            print(f"")
            print(f"3. Enable Google Analytics Data API:")
            print(f"   - Go to APIs & Services > Library")
            print(f"   - Search for 'Google Analytics Data API'")
            print(f"   - Click Enable")
            print(f"")
            print(f"4. Create Service Account:")
            print(f"   - Go to APIs & Services > Credentials")
            print(f"   - Click 'Create Credentials' > 'Service Account'")
            print(f"   - Name: 'EBP Dashboard Analytics'")
            print(f"   - Create key (JSON format)")
            print(f"   - Download and save as: {self.credentials_file}")
            print(f"")
            print(f"5. Grant Access in GA4:")
            print(f"   - Go to GA4 property settings")
            print(f"   - Property Access Management")
            print(f"   - Add service account email as Viewer")
            print(f"")
            return False
            
        try:
            credentials = Credentials.from_service_account_file(
                self.credentials_file,
                scopes=["https://www.googleapis.com/auth/analytics.readonly"]
            )
            self.client = BetaAnalyticsDataClient(credentials=credentials)
            print(f"✅ Authentication successful")
            return True
            
        except Exception as e:
            print(f"❌ Authentication failed: {e}")
            return False
    
    def test_api_connection(self):
        """Test the API connection with a simple query"""
        
        if not self.client or not self.property_id:
            print(f"❌ Setup authentication and load config first")
            return False
            
        try:
            request = RunReportRequest(
                property=f"properties/{self.property_id}",
                date_ranges=[DateRange(start_date="7daysAgo", end_date="today")],
                metrics=[Metric(name="sessions")],
                dimensions=[Dimension(name="date")],
            )
            
            response = self.client.run_report(request=request)
            
            print(f"✅ API connection test successful!")
            print(f"📊 Retrieved {len(response.rows)} days of data")
            
            if response.rows:
                latest_row = response.rows[-1]
                date_value = latest_row.dimension_values[0].value
                sessions_value = latest_row.metric_values[0].value
                print(f"🔍 Latest data: {date_value} - {sessions_value} sessions")
                
            return True
            
        except Exception as e:
            print(f"❌ API connection test failed: {e}")
            print(f"💡 Check your property ID and service account permissions")
            return False
    
    def run_full_setup(self):
        """Run the complete setup process"""
        
        print(f"🚀 Starting GA4 API Setup for EBP Dashboard")
        print(f"=" * 50)
        
        # Step 1: Create config template
        if not self.config_file.exists():
            self.create_config_template()
            print(f"")
            print(f"⚠️  NEXT STEPS:")
            print(f"1. Update {self.config_file} with your GA4 property details")
            print(f"2. Set up service account credentials (see instructions above)")
            print(f"3. Run this script again")
            return False
        
        # Step 2: Load configuration
        if not self.load_config():
            return False
            
        # Step 3: Setup authentication
        if not self.setup_authentication():
            return False
            
        # Step 4: Test API connection
        if not self.test_api_connection():
            return False
            
        print(f"")
        print(f"🎉 GA4 API setup complete!")
        print(f"✅ Ready to collect analytics data")
        print(f"")
        print(f"NEXT STEPS:")
        print(f"- Run collect_ga4_data.py to start collecting data")
        print(f"- Run analyze_web_analytics.py to generate visualizations")
        
        return True

def main():
    setup = GA4APISetup()
    setup.run_full_setup()

if __name__ == "__main__":
    main()
