#!/usr/bin/env python3
"""
Traffic Data Analysis and Visualization for EBP Dashboard Repository
Focuses on clone metrics with both actual weekly and cumulative views
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import numpy as np
from pathlib import Path

def load_and_prepare_data():
    """Load traffic data and prepare for analysis"""
    
    csv_file = Path("weekly_summary.csv")
    
    if not csv_file.exists():
        print(f"❌ Could not find {csv_file}")
        return None
    
    # Load data
    df = pd.read_csv(csv_file)
    
    # Convert date column to datetime
    df['collection_date'] = pd.to_datetime(df['collection_date'])
    
    # Sort by date to ensure proper chronological order
    df = df.sort_values('collection_date')
    
    # Calculate cumulative totals
    df['cumulative_clones_count'] = df['clones_count'].cumsum()
    df['cumulative_clones_uniques'] = df['clones_uniques'].cumsum()
    
    # Create readable date labels
    df['week_label'] = df['collection_date'].dt.strftime('%m/%d')
    df['month_year'] = df['collection_date'].dt.strftime('%b %Y')
    
    print(f"✅ Loaded {len(df)} weeks of traffic data")
    print(f"📅 Date range: {df['collection_date'].min().strftime('%Y-%m-%d')} to {df['collection_date'].max().strftime('%Y-%m-%d')}")
    
    return df

def create_comprehensive_analysis(df):
    """Create comprehensive clone analysis visualizations"""
    
    # Set up the plotting style
    plt.style.use('seaborn-v0_8')
    sns.set_palette("husl")
    
    # Create figure with subplots (2 rows, 1 column - vertically stacked)
    fig = plt.figure(figsize=(8, 6))
    
    # Main title
    # fig.suptitle('EBP Dashboard Repository - Clone Traffic Analysis\n(Historical + Automated Data)', 
    #              fontsize=16
    # Top subplot - Clone Activity Overview
    ax1 = plt.subplot(2, 1, 1)
    
    # Create a comprehensive view with clone metrics
    x_pos = range(len(df))
    width = 0.35
    
    # Weekly clones
    bars1 = ax1.bar([x - width/2 for x in x_pos], df['clones_count'], width,
                    label='Weekly Clones', color='skyblue', alpha=0.8, edgecolor='navy', linewidth=0.5)
    
    # Weekly unique users  
    bars2 = ax1.bar([x + width/2 for x in x_pos], df['clones_uniques'], width,
                    label='Weekly Unique Cloners', color='lightcoral', alpha=0.8, edgecolor='darkred', linewidth=0.5)
    
    ax1.set_xlabel('Week (Month/Day)')
    ax1.set_ylabel('Activity Count')
    ax1.set_facecolor('#f8f9fa')
    ax1.grid(True, color='#e0e0e0', linestyle='-', linewidth=0.5, alpha=0.7)
    ax1.legend(loc='upper left')
    ax1.set_xticks(x_pos)
    ax1.set_xticklabels(df['week_label'], rotation=45)
    

    
    # Bottom subplot - Cumulative Trends
    ax2 = plt.subplot(2, 1, 2)
    
    # Cumulative clone count (line + area)
    line1 = ax2.plot(df['week_label'], df['cumulative_clones_count'], 
                     marker='o', linewidth=3, markersize=8, color='darkblue', label='Total Clones')
    ax2.fill_between(df['week_label'], df['cumulative_clones_count'], alpha=0.3, color='lightblue')
    
    # Cumulative unique users (line)
    line2 = ax2.plot(df['week_label'], df['cumulative_clones_uniques'], 
                     marker='s', linewidth=3, markersize=8, color='darkred', label='Total Unique Cloners')
    ax2.fill_between(df['week_label'], df['cumulative_clones_uniques'], alpha=0.3, color='lightcoral')
    
    ax2.set_xlabel('Week (Month/Day)')
    ax2.set_ylabel('Cumulative Count')
    ax2.set_facecolor('#f8f9fa')
    ax2.grid(True, color='#e0e0e0', linestyle='-', linewidth=0.5, alpha=0.7)
    ax2.legend(loc='upper left')
    

    
    plt.xticks(rotation=45)
    
    # Adjust layout with extra spacing
    plt.tight_layout(pad=3.0)
    
    # Save the plot
    output_file = "traffic_analysis_clones.png"
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    print(f"📊 Comprehensive analysis saved as: {output_file}")
    
    # Show the plot
    plt.show()

def create_trend_analysis(df):
    """Create clone traffic trend analysis visualization"""
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7))
    
    # Add main title
    # fig.suptitle('EBP Dashboard Repository - Git Clone Traffic Analysis', 
    #              fontsize=16, fontweight='bold', y=0.95)
    
    # Combined weekly view
    x_pos = np.arange(len(df))
    width = 0.35
    
    bars1 = ax1.bar(x_pos - width/2, df['clones_count'], width, 
                    label='Clone Count', color='skyblue', alpha=0.8)
    bars2 = ax1.bar(x_pos + width/2, df['clones_uniques'], width,
                    label='Unique Cloners', color='lightcoral', alpha=0.8)
    ax1.set_xlabel('Week')
    ax1.set_ylabel('Count')
    ax1.set_xticks(x_pos)
    ax1.set_xticklabels(df['week_label'], rotation=45)
    ax1.legend()
    ax1.set_facecolor('#f8f9fa')
    ax1.grid(True, color='#e0e0e0', linestyle='-', linewidth=0.5, alpha=0.7)
    
    # Cumulative trend comparison
    ax2.plot(df['week_label'], df['cumulative_clones_count'], 
             marker='o', linewidth=3, label='Total Clones', color='blue')
    ax2.plot(df['week_label'], df['cumulative_clones_uniques'], 
             marker='s', linewidth=3, label='Total Unique Cloners', color='red')
    ax2.set_xlabel('Week')
    ax2.set_ylabel('Cumulative Count')
    ax2.legend()
    ax2.set_facecolor('#f8f9fa')
    ax2.grid(True, color='#e0e0e0', linestyle='-', linewidth=0.5, alpha=0.7)
    plt.xticks(rotation=45)
    
    plt.tight_layout()
    
    # Save trend analysis
    trend_file = "traffic_trends_analysis.png"
    plt.savefig(trend_file, dpi=300, bbox_inches='tight')
    print(f"📈 Clone traffic analysis saved as: {trend_file}")
    
    plt.show()

def print_summary_statistics(df):
    """Print summary statistics"""
    
    print("\n" + "="*60)
    print("📈 CLONE TRAFFIC SUMMARY STATISTICS")
    print("="*60)
    
    print(f"\n🗓️  TIMEFRAME:")
    print(f"   • Start Date: {df['collection_date'].min().strftime('%B %d, %Y')}")
    print(f"   • End Date: {df['collection_date'].max().strftime('%B %d, %Y')}")
    print(f"   • Total Weeks: {len(df)}")
    
    print(f"\n📊 CLONE STATISTICS:")
    print(f"   • Total Clones (All Time): {df['cumulative_clones_count'].iloc[-1]:,}")
    print(f"   • Total Unique Cloners: {df['cumulative_clones_uniques'].iloc[-1]:,}")
    print(f"   • Average Clones per Week: {df['clones_count'].mean():.1f}")
    print(f"   • Peak Weekly Clones: {df['clones_count'].max()} (Week of {df.loc[df['clones_count'].idxmax(), 'collection_date'].strftime('%m/%d/%Y')})")
    
    print(f"\n🎯 ENGAGEMENT METRICS:")
    print(f"   • Unique vs Total Clone Ratio: {(df['cumulative_clones_uniques'].iloc[-1] / df['cumulative_clones_count'].iloc[-1] * 100):.1f}%")
    print(f"   • Most Active Week: {df['collection_date'][df['clones_count'].idxmax()].strftime('%B %d, %Y')}")
    print(f"   • Recent Activity: {df['clones_count'].tail(3).sum()} clones in last 3 weeks")
    
    print("="*60)

def main():
    """Main analysis function"""
    
    print("🚀 Starting EBP Dashboard Clone Traffic Analysis...")
    print("="*60)
    
    # Load data
    df = load_and_prepare_data()
    
    if df is None:
        return
    
    # Print data overview
    print("\n📋 DATA OVERVIEW:")
    print(df[['week', 'collection_date', 'clones_count', 'clones_uniques', 
              'cumulative_clones_count', 'cumulative_clones_uniques']].to_string(index=False))
    
    # Create visualizations
    print("\n📈 Creating trend analysis...")
    create_trend_analysis(df)
    
    # Print summary statistics
    print_summary_statistics(df)
    
    print("\n✅ Analysis complete! Check traffic_trends_analysis.png for visualization.")

if __name__ == "__main__":
    main()
