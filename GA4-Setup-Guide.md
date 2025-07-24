# Google Analytics 4 Setup Guide for EBP Dashboard

## 🚀 Quick Setup Steps

### 1. Create Google Analytics 4 Property

1. **Go to Google Analytics**: Visit [analytics.google.com](https://analytics.google.com)
2. **Create Account** (if you don't have one):
   - Click "Start measuring"
   - Enter account name: "Earth BioGenome Project"
   - Configure data sharing settings as desired

3. **Create Property**:
   - Property name: "EBP Dashboard"
   - Reporting time zone: Select your timezone
   - Currency: Select your preferred currency

4. **Set Up Data Stream**:
   - Choose "Web"
   - Website URL: Enter your dashboard URL
   - Stream name: "EBP Dashboard Website"

5. **Get Measurement ID**:
   - After creating the data stream, copy the **Measurement ID** (format: G-XXXXXXXXXX)

### 2. Configure Your Dashboard

1. **Update the Tracking Code**:
   - Open `index.html`
   - Find **two instances** of `YOUR_GA4_MEASUREMENT_ID`
   - Replace both with your actual Measurement ID (G-XXXXXXXXXX)

```html
<!-- Replace this line -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_GA4_MEASUREMENT_ID"></script>

<!-- And this line -->
gtag('config', 'YOUR_GA4_MEASUREMENT_ID', {

<!-- With your actual ID -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
gtag('config', 'G-XXXXXXXXXX', {
```

2. **Deploy Your Dashboard**: Upload the updated files to your web server

3. **Test the Implementation**:
   - Visit your dashboard
   - Open browser developer tools (F12)
   - Check the Network tab for gtag requests
   - Visit Google Analytics Real-time reports to see live data

## 📊 Metrics You'll Track

### Real-time Metrics
- **Active users** on the dashboard right now
- **Page views** and **screen views**
- **Geographic distribution** of current users
- **Traffic sources** (direct, referral, search, etc.)

### Session Metrics
- **Session duration** (tracked via custom event)
- **Pages per session**
- **Bounce rate**
- **New vs returning users**

### Device & Technical Metrics
- **Device categories** (Desktop, Mobile, Tablet)
- **Operating systems** and **browsers**
- **Screen resolutions** and **viewport sizes**
- **Page load performance**
- **Network connection types**

### Custom Dashboard Events
- **visualization_click**: When users click on dashboard items
- **visualization_hover**: When users hover over items (engagement)
- **category_view**: Which categories are most viewed
- **scroll_depth**: How far users scroll (25%, 50%, 75%, 100%)
- **session_duration**: Custom session timing
- **device_info**: Enhanced device specifications
- **page_performance**: Load times and performance metrics

## 🎯 Setting Up Custom Reports

### 1. Enhanced Dashboard in GA4

1. **Go to Reports** → **Library**
2. **Create new report** → **Exploration**
3. **Add dimensions**:
   - Event name
   - Custom parameter 1 (dashboard_category)
   - Custom parameter 2 (visualization_type)
   - Country
   - Device category
   - Browser

4. **Add metrics**:
   - Event count
   - Active users
   - Session duration
   - Engaged sessions

### 2. Custom Events Configuration

In GA4, go to **Configure** → **Events** and create custom events:

1. **Popular Visualizations**:
   - Event name: `visualization_click`
   - Parameter: `event_label` (visualization name)

2. **Category Engagement**:
   - Event name: `category_view`
   - Parameter: `event_label` (category name)

3. **User Engagement Depth**:
   - Event name: `scroll_depth`
   - Parameter: `value` (percentage scrolled)

### 3. Conversion Goals

Set up **Conversions** for key actions:
1. **Visualization Accessed**: `visualization_click`
2. **Deep Engagement**: `scroll_depth` with value ≥ 75
3. **Extended Session**: `session_duration` with value ≥ 120 seconds

## 📈 Key Reports to Monitor

### 1. Real-time Dashboard
- **Path**: Reports → Real-time
- **Monitor**: Current active users, top pages, locations

### 2. Audience Overview
- **Path**: Reports → Demographics
- **Monitor**: User age, gender, interests, locations

### 3. Acquisition Reports
- **Path**: Reports → Acquisition
- **Monitor**: Traffic sources, campaigns, referrals

### 4. Engagement Reports
- **Path**: Reports → Engagement
- **Monitor**: Page views, events, conversions

### 5. Custom Dashboard
Create a custom dashboard with:
- **Real-time users map**
- **Top visualizations (by clicks)**
- **Session duration distribution**
- **Device/browser breakdown**
- **Geographic user distribution**

## 🔧 Advanced Configuration

### Custom Dimensions
Set up custom dimensions in GA4:
1. **Dashboard Category**: Maps to `custom_parameter_1`
2. **Visualization Type**: Maps to `custom_parameter_2`

### Enhanced Measurement
The implementation automatically enables:
- ✅ **Scrolls** (25%, 50%, 75%, 100% depth)
- ✅ **Outbound clicks**
- ✅ **File downloads**
- ✅ **Page views**
- ✅ **Session start**

### Data Retention
- Set data retention to **14 months** (maximum for free GA4)
- Path: Admin → Data Settings → Data Retention

## 🛠️ Troubleshooting

### Common Issues

1. **No data showing**:
   - Check Measurement ID is correct
   - Verify gtag.js is loading (check Network tab)
   - Wait 24-48 hours for full data processing

2. **Custom events not appearing**:
   - Check browser console for JavaScript errors
   - Verify event names match GA4 requirements (no spaces, special chars)
   - Use GA4 DebugView for real-time event debugging

3. **Real-time not working**:
   - Disable ad blockers
   - Check browser privacy settings
   - Verify JavaScript is enabled

### Debug Mode
Add this to your URL for debug mode:
```
?gtm_debug=1
```

Or use GA4's DebugView:
1. Install Google Analytics Debugger extension
2. Visit your site with the extension enabled
3. Check GA4 → Configure → DebugView

## 📋 Data Privacy Compliance

### GDPR Compliance
The implementation respects user privacy:
- No personally identifiable information (PII) is collected
- IP addresses are anonymized by default in GA4
- Users can opt-out via browser settings

### Cookie Notice
Consider adding a cookie notice if required in your jurisdiction:
```html
<!-- Add to your site if needed -->
<div id="cookie-notice">
  This site uses Google Analytics to improve user experience.
  <button onclick="acceptCookies()">Accept</button>
</div>
```

## 🎉 Next Steps

1. **Replace the Measurement ID** in `index.html`
2. **Deploy your updated dashboard**
3. **Visit GA4 Real-time reports** to verify tracking
4. **Set up custom reports** for your specific needs
5. **Create alerts** for important metrics
6. **Schedule regular reports** via email

Your EBP Dashboard now has comprehensive analytics tracking that will provide insights into user behavior, popular visualizations, geographic distribution, and technical performance metrics! 