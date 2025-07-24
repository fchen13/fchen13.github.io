# GA4 Events Tracking Reference

## 📊 All Tracked Events Overview

### 🎯 User Interaction Events

| Event Name | Trigger | Category | Description |
|------------|---------|----------|-------------|
| `visualization_click` | User clicks on dashboard item | `dashboard_interaction` | Tracks which visualizations are accessed |
| `visualization_hover` | User hovers over dashboard item (500ms delay) | `user_engagement` | Measures user interest/engagement |
| `visualization_focus` | User focuses on dashboard item (keyboard navigation) | `accessibility` | Tracks accessibility usage |
| `category_view` | Category section loads on page | `dashboard_navigation` | Tracks which categories are viewed |

### 📈 Engagement Events

| Event Name | Trigger | Category | Description |
|------------|---------|----------|-------------|
| `scroll_depth` | User scrolls to 25%, 50%, 75%, 100% | `user_engagement` | Measures content engagement depth |
| `session_duration` | Page unload | `user_engagement` | Custom session timing in seconds |
| `dashboard_loaded` | All content loaded | `dashboard` | Tracks successful dashboard loads |

### 🖥️ Technical Events

| Event Name | Trigger | Category | Description |
|------------|---------|----------|-------------|
| `page_load` | Initial page load | `dashboard` | Basic page load event |
| `page_performance` | Page load complete | `technical_metrics` | Load times and performance data |
| `device_info` | Page load complete | `technical_metrics` | Enhanced device specifications |

## 🏷️ Event Parameters

### Common Parameters
- `event_category`: Groups related events
- `event_label`: Specific item identifier
- `value`: Numeric value (duration, percentage, count)

### Custom Parameters
- `custom_parameter_1`: Dashboard category ("Assembly Progress", "Network Visualization")
- `custom_parameter_2`: Visualization type ("html_visualization")
- `file_path`: Path to the visualization file

### Technical Parameters
- `screen_resolution`: Display resolution (e.g., "1920x1080")
- `viewport_size`: Browser viewport (e.g., "1200x800")
- `page_load_time`: Time in milliseconds
- `timezone`: User's timezone
- `platform`: Operating system
- `connection_type`: Network connection type

## 📊 Sample Data You'll See

### Popular Visualizations (visualization_click)
```
Event Label: "Progress Over the Years"
Category: "Assembly Progress"
Count: 45 clicks
```

### Engagement Depth (scroll_depth)
```
25% scrolled: 120 users
50% scrolled: 85 users  
75% scrolled: 60 users
100% scrolled: 30 users
```

### Session Duration Distribution
```
< 30 seconds: 25%
30-60 seconds: 35%
1-3 minutes: 25%
> 3 minutes: 15%
```

### Geographic Distribution (automatic)
```
United States: 45%
United Kingdom: 20%
Germany: 15%
Other: 20%
```

### Device Breakdown (automatic)
```
Desktop: 70%
Mobile: 25%
Tablet: 5%
```

## 🔍 How to Find Events in GA4

### Real-time Events
1. Go to **Reports** → **Real-time**
2. Click **Event count by Event name**
3. See live events as they happen

### Historical Events
1. Go to **Reports** → **Engagement** → **Events**
2. Click on event name for details
3. Use **Add comparison** to compare time periods

### Custom Reports
1. Go to **Explore** → **Free form**
2. Add **Event name** as dimension
3. Add **Event count** as metric
4. Filter by event categories

## ⚡ Quick Analytics Queries

### Most Popular Visualizations
- **Dimension**: Event name = visualization_click
- **Secondary**: Event label
- **Metric**: Event count

### User Engagement Quality
- **Dimension**: Event name = scroll_depth  
- **Secondary**: Event label (percentage)
- **Metric**: Active users

### Technical Performance
- **Dimension**: Event name = page_performance
- **Metric**: Average value (load time)
- **Secondary**: Device category

### Session Quality
- **Dimension**: Event name = session_duration
- **Metric**: Average value
- **Filter**: Value > 30 (sessions longer than 30 seconds)

This reference will help you navigate GA4 and understand exactly what data is being collected from your EBP Dashboard! 🚀 