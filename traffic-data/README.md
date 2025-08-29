# Weekly Traffic Data

This directory contains automatically collected GitHub traffic data for this repository.

## Files

- `weekly_summary.csv`: Weekly summary of views and clones
- `traffic-YYYY-WXX.json`: Detailed weekly traffic data including individual day breakdowns from the 14-day rolling window

## Data Collection

- **Frequency**: Weekly on Sundays at 2:00 AM UTC
- **Source**: GitHub Traffic API
- **Retention**: GitHub only provides 14 days of traffic data, so we collect it weekly to build historical records
- **Coverage**: Each collection captures the full 14-day rolling window available at that time

## Data Format

### Weekly Summary CSV
```
week,collection_date,views_count,views_uniques,clones_count,clones_uniques,collected_at
2025-W03,2025-01-19,156,45,23,8,2025-01-19T02:00:00Z
```

### Weekly JSON
Contains detailed breakdown including individual day data from the 14-day rolling window available at collection time.

## Usage

You can analyze this data with any tool that supports CSV/JSON:
- Excel/Google Sheets for basic analysis
- Python pandas for more complex analysis
- Any data visualization tool

## Notes

- Weekly collection ensures no data loss while avoiding daily commits
- Each week's data represents the 14-day window available at collection time
- Week numbers follow ISO standard (Sunday as start of week)

Last updated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
