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
    
    # Create figure with subplots
    fig = plt.figure(figsize=(16, 12))
    
    # Main title
    # fig.suptitle('EBP Dashboard Repository - Clone Traffic Analysis\n(Historical + Automated Data)', 
    #              fontsize=16, fontweight='bold', y=0.95)
    
    # 1. Weekly Clone Counts (Actual)
    ax1 = plt.subplot(2, 2, 1)
    bars1 = ax1.bar(df['week_label'], df['clones_count'], 
                    color='skyblue', alpha=0.8, edqivagecolor='navy', linewidth=0.5)
    ax1.set_title('Weekly Clone Count (Actual)', fontweight='bold', fontsize=12)
    ax1.set_xlabel('Week (Month/Day)')
    ax1.set_ylabel('Number of Clones')
    ax1.grid(True, alpha=0.3)
    
    # Add value labels on bars
    for bar in bars1:
        height = bar.get_height()
        if height > 0:
            ax1.text(bar.get_x() + bar.get_width()/2., height,
                    f'{int(height)}', ha='center', va='bottom', fontsize=9)
    
    plt.xticks(rotation=45)
    
    # 2. Cumulative Clone Count
    ax2 = plt.subplot(2, 2, 2)
    line1 = ax2.plot(df['week_label'], df['cumulative_clones_count'], 
                     marker='o', linewidth=2.5, markersize=6, color='darkblue')
    ax2.fill_between(df['week_label'], df['cumulative_clones_count'], alpha=0.3, color='lightblue')
    ax2.set_title('Cumulative Clone Count (Total)', fontweight='bold', fontsize=12)
    ax2.set_xlabel('Week (Month/Day)')
    ax2.set_ylabel('Total Clones')
    ax2.grid(True, alpha=0.3)
    
    # Add final total annotation
    final_total = df['cumulative_clones_count'].iloc[-1]
    ax2.text(len(df)-1, final_total, f'Total: {int(final_total)}', 
             ha='right', va='bottom', fontsize=10, fontweight='bold',
             bbox=dict(boxstyle='round,pad=0.3', facecolor='yellow', alpha=0.7))
    
    plt.xticks(rotation=45)
    
    # 3. Weekly Unique Cloners (Actual)
    ax3 = plt.subplot(2, 2, 3)
    bars2 = ax3.bar(df['week_label'], df['clones_uniques'], 
                    color='lightcoral', alpha=0.8, edgecolor='darkred', linewidth=0.5)
    ax3.set_title('Weekly Unique Cloners (Actual)', fontweight='bold', fontsize=12)
    ax3.set_xlabel('Week (Month/Day)')
    ax3.set_ylabel('Number of Unique Cloners')
    ax3.grid(True, alpha=0.3)
    
    # Add value labels on bars
    for bar in bars2:
        height = bar.get_height()
        if height > 0:
            ax3.text(bar.get_x() + bar.get_width()/2., height,
                    f'{int(height)}', ha='center', va='bottom', fontsize=9)
    
    plt.xticks(rotation=45)
    
    # 4. Cumulative Unique Cloners
    ax4 = plt.subplot(2, 2, 4)
    line2 = ax4.plot(df['week_label'], df['cumulative_clones_uniques'], 
                     marker='s', linewidth=2.5, markersize=6, color='darkred')
    ax4.fill_between(df['week_label'], df['cumulative_clones_uniques'], alpha=0.3, color='lightcoral')
    ax4.set_title('Cumulative Unique Cloners (Total)', fontweight='bold', fontsize=12)
    ax4.set_xlabel('Week (Month/Day)')
    ax4.set_ylabel('Total Unique Cloners')
    ax4.grid(True, alpha=0.3)
    
    # Add final total annotation
    final_unique = df['cumulative_clones_uniques'].iloc[-1]
    ax4.text(len(df)-1, final_unique, f'Total: {int(final_unique)}', 
             ha='right', va='bottom', fontsize=10, fontweight='bold',
             bbox=dict(boxstyle='round,pad=0.3', facecolor='yellow', alpha=0.7))
    
    plt.xticks(rotation=45)
    
    # Adjust layout
    plt.tight_layout()
    
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
    
    ax1.set_title('Weekly Git Clone Activities', fontweight='bold', fontsize=14)
    ax1.set_xlabel('Week')
    ax1.set_ylabel('Count')
    ax1.set_xticks(x_pos)
    ax1.set_xticklabels(df['week_label'], rotation=45)
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    
    # Cumulative trend comparison
    ax2.plot(df['week_label'], df['cumulative_clones_count'], 
             marker='o', linewidth=3, label='Total Clones', color='blue')
    ax2.plot(df['week_label'], df['cumulative_clones_uniques'], 
             marker='s', linewidth=3, label='Total Unique Cloners', color='red')
    
    ax2.set_title('Cumulative Git Clone Activities', fontweight='bold', fontsize=14)
    ax2.set_xlabel('Week')
    ax2.set_ylabel('Cumulative Count')
    ax2.legend()
    ax2.grid(True, alpha=0.3)
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
