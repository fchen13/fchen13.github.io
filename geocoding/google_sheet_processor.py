import pandas as pd
import requests
from datetime import datetime
import os
import re
import json
import io
import urllib.parse

def get_coordinates(address, map_api_key):
    """Fetch coordinates for a given address using Google Maps Geocoding API."""
    if not address:
        return None, None, "Address is empty or invalid"

    try:
        # Clean the address by removing unit numbers and extra spaces
        clean_address = ' '.join(str(address).split())  # Remove extra spaces
        clean_address = re.sub(r'\s*#\d+\s*', '', clean_address)  # Remove unit numbers
        
        url = f"https://maps.googleapis.com/maps/api/geocode/json?address={clean_address.replace(' ', '+')}&key={map_api_key}"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'OK':
                location = data['results'][0]['geometry']['location']
                return location['lat'], location['lng'], None
            elif data['status'] == 'REQUEST_DENIED':
                error_message = data.get('error_message', 'No error message provided')
                return None, None, f"API Request Denied: {error_message}\nPossible causes:\n1. API key quota exceeded\n2. API key not properly configured\n3. Billing issues\n4. API key restrictions"
            else:
                return None, None, f"Failed to geocode address: {clean_address} | Status: {data['status']}"
        else:
            return None, None, f"API request error: {response.status_code}"
    except Exception as e:
        return None, None, f"Error processing address '{clean_address}': {str(e)}"

def get_sheet_data(sheet_id, sheet_name):
    """Retrieve data from a public Google Sheet."""
    try:
        # URL encode the sheet name to handle special characters
        encoded_sheet_name = urllib.parse.quote(sheet_name)
        url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={encoded_sheet_name}"
        response = requests.get(url)
        if response.status_code == 200:
            return pd.read_csv(io.StringIO(response.text))
        else:
            raise Exception(f"Failed to fetch sheet data: HTTP {response.status_code}")
    except Exception as err:
        print(f"Error fetching sheet data: {err}")
        raise

def get_sheet_names(sheet_id):
    """Get all sheet names from the Google Sheet."""
    try:
        # First try to get the first sheet to check if we can access the spreadsheet
        test_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet=Sheet1"
        response = requests.get(test_url)
        if response.status_code != 200:
            raise Exception(f"Failed to access spreadsheet: HTTP {response.status_code}")
        
        # Extract sheet names from the response headers
        sheet_names = []
        current_sheet = 1
        
        while True:
            try:
                # Try to get the next sheet
                url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet=Sheet{current_sheet}"
                response = requests.get(url)
                
                if response.status_code != 200:
                    break
                
                # Extract the actual sheet name from the content-disposition header
                content_disposition = response.headers.get('content-disposition', '')
                if 'filename=' in content_disposition:
                    filename = content_disposition.split('filename=')[1].strip('"')
                    # Extract the actual sheet name, removing any encoding information
                    actual_sheet_name = filename.split(';')[0].strip()
                    # Remove any .csv extension and encoding information
                    actual_sheet_name = re.sub(r'\.csv$', '', actual_sheet_name)
                    actual_sheet_name = re.sub(r'^.*?filename\*?=.*?UTF-8\'\'([^;]+).*$', r'\1', actual_sheet_name)
                    
                    # Clean up the sheet name
                    actual_sheet_name = actual_sheet_name.strip('"')  # Remove any remaining quotes
                    actual_sheet_name = actual_sheet_name.strip()  # Remove any extra whitespace
                    
                    # Skip if the sheet name is empty or is data.csv
                    if not actual_sheet_name or actual_sheet_name.lower() == 'data.csv':
                        continue
                        
                    # Check if this is a new sheet name
                    if actual_sheet_name not in sheet_names:
                        sheet_names.append(actual_sheet_name)
                        print(f"Found sheet: {actual_sheet_name}")
                
                current_sheet += 1
                
            except Exception as e:
                print(f"Error checking sheet {current_sheet}: {str(e)}")
                break
        
        if not sheet_names:
            # If no sheets found, try the default sheet
            sheet_names = ["Sheet1"]
        
        print(f"\nTotal sheets found: {len(sheet_names)}")
        return sheet_names
    except Exception as err:
        print(f"Error getting sheet names: {err}")
        return ["Sheet1"]  # Fallback to default sheet

def clean_dataframe(df):
    """Clean the dataframe by removing empty columns and handling missing values."""
    # Remove columns where all values are NaN
    df = df.dropna(axis=1, how='all')
    
    # Replace NaN values with empty strings in string columns
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].fillna('')
    
    return df

def process_google_sheet(sheet_url, map_api_key, output_format='json'):
    """Process all sheets in a Google Sheets file and output in specified format.
    
    Args:
        sheet_url: URL of the Google Sheet
        map_api_key: Google Maps API key
        output_format: Either 'json', 'csv', or 'excel' (default: 'json')
    """
    try:
        # Retrieve the Google Sheet ID from the URL
        sheet_id = sheet_url.split("/d/")[1].split("/edit")[0]
        
        # Initialize timestamp for filename
        timestamp = datetime.now().strftime("%Y%m%d")
        
        # Ensure the output directory exists
        output_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Store all data in a dictionary
        all_data = {}
        
        # Store all errors and progress for summary at the end
        all_errors = []
        progress_summary = {
            'total_addresses': 0,
            'skipped': 0,
            'successful': 0,
            'failed': 0
        }

        # Get all sheet names
        sheet_names = get_sheet_names(sheet_id)
        print(f"\nFound {len(sheet_names)} sheets: {', '.join(sheet_names)}")

        for sheet_name in sheet_names:
            print(f"\n{'='*50}")
            print(f"Processing sheet: {sheet_name}")
            print(f"{'='*50}")
            
            try:
                # Get the sheet data
                print("\nFetching sheet data...")
                data = get_sheet_data(sheet_id, sheet_name)
                print(f"Original columns found: {', '.join(data.columns)}")
                print(f"Total rows: {len(data)}")
                
                # Clean the dataframe
                print("\nCleaning data...")
                data = clean_dataframe(data)
                print(f"Columns after cleaning: {', '.join(data.columns)}")
                print(f"Rows after cleaning: {len(data)}")
                
                if 'Address' not in data.columns:
                    print(f"\n⚠ Warning: No 'Address' column found in sheet '{sheet_name}'. Required columns are: Address")
                    continue

                # Find the index of the Address column
                address_col_idx = data.columns.get_loc('Address')
                
                # Add latitude and longitude columns right after the Address column
                print("\nAdding coordinate columns...")
                data.insert(address_col_idx + 1, 'Latitude', None)
                data.insert(address_col_idx + 2, 'Longitude', None)
                data.insert(address_col_idx + 3, 'Geocoding_Error', None)
                
                print(f"Final columns: {', '.join(data.columns)}")

                # Count total addresses in this sheet
                total_addresses = len(data)
                progress_summary['total_addresses'] += total_addresses
                print(f"\nTotal addresses to process: {total_addresses}")

                # Process geocoding
                print("\nStarting geocoding process...")
                print(f"{'='*30}")
                for index, row in data.iterrows():
                    address = row['Address']
                    
                    if pd.notna(data.at[index, 'Latitude']) and pd.notna(data.at[index, 'Longitude']):
                        print(f"✓ Skipping already geocoded address: {address}")
                        progress_summary['skipped'] += 1
                        continue
                    
                    if pd.isna(address) or not str(address).strip():
                        print(f"⚠ Skipping empty address at row {index + 2}")
                        progress_summary['skipped'] += 1
                        continue
                    
                    print(f"\nProcessing address {index + 1}/{total_addresses}: {address}")
                    latitude, longitude, error = get_coordinates(address, map_api_key)
                    
                    if error:
                        data.at[index, 'Geocoding_Error'] = error
                        all_errors.append(f"Row {index + 2} ({address}): {error}")
                        progress_summary['failed'] += 1
                        print(f"❌ Failed: {error}")
                    else:
                        data.at[index, 'Latitude'] = latitude
                        data.at[index, 'Longitude'] = longitude
                        data.at[index, 'Geocoding_Error'] = None
                        progress_summary['successful'] += 1
                        print(f"✓ Successfully geocoded: {address}")
                        print(f"  Latitude: {latitude}, Longitude: {longitude}")

                # Store the data
                all_data[sheet_name] = data
                print(f"\n{'='*30}")
                print(f"Sheet '{sheet_name}' processing complete!")
                print(f"Successfully geocoded: {progress_summary['successful']}")
                print(f"Skipped: {progress_summary['skipped']}")
                print(f"Failed: {progress_summary['failed']}")
                print(f"{'='*50}\n")
                
            except Exception as sheet_error:
                print(f"\n❌ Error processing sheet '{sheet_name}': {str(sheet_error)}")
                continue

        if not all_data:
            raise Exception("No data was successfully processed from any sheet")

        # Save the output based on format
        print("\nSaving processed data...")
        if output_format.lower() == 'json':
            # Convert DataFrames to records for JSON serialization
            json_data = {sheet: df.to_dict('records') for sheet, df in all_data.items()}
            output_file = f"affiliate_network_dataset_{timestamp}.json"
            output_path = os.path.join(output_dir, output_file)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, indent=2)
            print(f"\nJSON file saved to: {os.path.abspath(output_path)}")
        elif output_format.lower() == 'csv':
            # Create a directory for CSV files
            csv_dir = os.path.join(output_dir, f"affiliate_network_dataset_{timestamp}")
            os.makedirs(csv_dir, exist_ok=True)
            
            # Save each sheet as a separate CSV file
            for sheet_name, df in all_data.items():
                # Clean sheet name for filename
                safe_sheet_name = "".join(c for c in sheet_name if c.isalnum() or c in (' ', '-', '_')).strip()
                csv_file = f"{safe_sheet_name}.csv"
                csv_path = os.path.join(csv_dir, csv_file)
                df.to_csv(csv_path, index=False)
                print(f"CSV file saved: {csv_path}")
        else:  # Excel format
            output_file = f"affiliate_network_dataset_{timestamp}.xlsx"
            output_path = os.path.join(output_dir, output_file)
            with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
                for sheet_name, df in all_data.items():
                    df.to_excel(writer, sheet_name=sheet_name, index=False)
            print(f"\nExcel file saved to: {os.path.abspath(output_path)}")

        print(f"\nAll sheets have been processed and saved as {output_format.upper()}")
        
        # Print comprehensive summary
        print("\n=== Final Processing Summary ===")
        print(f"Total addresses processed: {progress_summary['total_addresses']}")
        print(f"Successfully geocoded: {progress_summary['successful']}")
        print(f"Skipped (already processed): {progress_summary['skipped']}")
        print(f"Failed to geocode: {progress_summary['failed']}")
        
        if all_errors:
            print("\n=== Error Summary ===")
            print(f"Total errors encountered: {len(all_errors)}")
            print("\nDetailed errors:")
            for error in all_errors:
                print(f"- {error}")
        else:
            print("\nNo errors encountered during processing!")
        
    except Exception as e:
        print(f"Critical error processing sheet: {str(e)}")
        raise

if __name__ == "__main__":
    import os
    from dotenv import load_dotenv
    
    print("Starting script...")
    
    try:
        # Load environment variables
        print("Loading environment variables...")
        load_dotenv()
        
        # Get API keys
        print("Getting API key...")
        map_api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        if not map_api_key:
            print("ERROR: GOOGLE_MAPS_API_KEY not found in environment variables!")
            print("Please make sure you have a .env file with GOOGLE_MAPS_API_KEY=your_api_key")
            exit(1)
        print("API key loaded successfully")
        
        # Sheet URL
        sheet_url = "https://docs.google.com/spreadsheets/d/1mAXInBMDYVKjZ5DVz5OlwDx8co33BuOF-49Vyog57NE/edit?gid=0#gid=0"
        print(f"Processing Google Sheet: {sheet_url}")
        
        # Process the sheet (specify output_format='csv' for CSV output, 'excel' for Excel output)
        process_google_sheet(sheet_url, map_api_key, output_format='excel')
        
    except Exception as e:
        print(f"ERROR: An error occurred while running the script: {str(e)}")
        print("Please check if:")
        print("1. You have the required Python packages installed (pandas, requests, python-dotenv)")
        print("2. You have a valid .env file with your Google Maps API key")
        print("3. You have internet access to reach the Google Sheet and Maps API")
        raise 