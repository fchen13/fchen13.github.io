import pandas as pd
import numpy as np
from datetime import datetime
import os

def clean_data_for_excel(df):
    """
    Clean DataFrame before Excel export to prevent corruption issues.
    """
    # Create a copy to avoid modifying the original
    df_clean = df.copy()
    
    # Replace NaN with empty string
    df_clean = df_clean.fillna('')
    
    # Clean column names to remove any invalid characters
    df_clean.columns = [str(col).strip() for col in df_clean.columns]
    
    # Convert all columns to string to avoid type issues
    for col in df_clean.columns:
        df_clean[col] = df_clean[col].astype(str)
    
    return df_clean

def export_to_excel(data_dict, output_dir='output'):
    """
    Export multiple DataFrames to Excel with proper data cleaning.
    
    Args:
        data_dict: Dictionary of DataFrames to export
        output_dir: Directory to save the Excel file
    """
    try:
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate timestamp for filename
        timestamp = datetime.now().strftime("%Y%m%d")
        output_file = f"affiliate_network_list_{timestamp}.xlsx"
        output_path = os.path.join(output_dir, output_file)
        
        # Create Excel writer
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            for sheet_name, df in data_dict.items():
                # Clean the data
                df_clean = clean_data_for_excel(df)
                
                # Write to Excel
                df_clean.to_excel(writer, sheet_name=sheet_name, index=False)
        
        print(f"\nExcel file saved successfully to: {os.path.abspath(output_path)}")
        return output_path
        
    except Exception as e:
        print(f"Error exporting to Excel: {str(e)}")
        raise 