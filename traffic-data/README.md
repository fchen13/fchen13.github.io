# EBP Dashboard Traffic Data Hub

This directory contains the complete traffic monitoring system for the EBP Dashboard repository.

## 📁 Directory Contents

### 📊 Analysis Tools
- `analyze_traffic_data.py`: Main analysis & visualization script
- `add_historical_traffic.py`: Script for integrating historical data  
- `run_analysis.py`: Simple runner script for easy analysis

### 📈 Visualizations (Generated)
- `traffic_analysis_clones.png`: 4-panel comprehensive clone analysis
- `traffic_trends_analysis.png`: Weekly and cumulative trend comparison

### 📁 Data Files
- `weekly_summary.csv`: Main summary data (grows weekly)
- `traffic-YYYY-WXX.json`: Detailed weekly data with daily breakdowns
- `README.md`: This documentation file

### to get the latest data locally, run git pull origin ebp-main in the traffic-data directory

## 🚀 Quick Start

### Run Analysis (from traffic-data directory):
```bash
# Navigate to traffic-data directory
cd traffic-data

# Run comprehensive analysis
python analyze_traffic_data.py
# OR use the simple runner
python run_analysis.py
```

### Add Historical Data:
```bash
python add_historical_traffic.py
```

## 📊 Data Collection

- **Frequency**: Automated weekly on Mondays at 2:00 AM UTC
- **Collection Strategy**: Collects data for the **completed previous week** to ensure accuracy
- **Source**: GitHub Traffic API via GitHub Actions workflow
- **Historical**: Includes manual snapshots from July 2024 + interpolated data
- **Coverage**: Each collection captures 14-day rolling window

## 📈 Analysis Features

### Visualizations Created:
1. **Weekly Clone Count** - Actual weekly activity bars
2. **Cumulative Clone Count** - Growing total over time
3. **Weekly Unique Cloners** - Unique visitors per week  
4. **Cumulative Unique Cloners** - Total unique visitor growth
5. **Trend Comparisons** - Side-by-side and growth trend analysis

### Statistics Provided:
- Total clones and unique cloners (all-time)
- Weekly averages and peak activity periods
- Engagement ratios and recent activity trends

## 📝 Data Format

### Weekly Summary CSV
```csv
week,collection_date,views_count,views_uniques,clones_count,clones_uniques,collected_at
2024-W29,2024-07-15,0,0,34,26,2024-07-15T02:00:00Z
2025-W34,2025-08-17,0,0,12,8,2025-08-17T02:00:00Z
```

### Weekly JSON  
Contains detailed daily breakdowns within each 14-day collection window.

## 🔧 Requirements

```bash
pip install pandas matplotlib seaborn numpy
```

## 📋 Notes

- **Historical Integration**: July 2024 snapshots + interpolated missing periods  
- **Automated Growth**: New data added weekly via GitHub Actions
- **Local Analysis**: Pull latest data with `git pull origin ebp-main`
- **Clean Organization**: All traffic files contained in this directory

---
*Last updated: Generated automatically by traffic analysis system*
