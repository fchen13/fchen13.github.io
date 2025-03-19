import pandas as pd
import requests
from googleapiclient.discovery import build
from oauth_setup import get_credentials
from datetime import datetime
import os
import re
import json

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

def get_sheet_metadata(sheet_id):
    """Retrieve metadata of all sheets in the Google Sheets file."""
    try:
        # Get OAuth 2.0 credentials
        creds = get_credentials()
        
        # Build the service with OAuth credentials
        service = build('sheets', 'v4', credentials=creds)
        
        # Get the spreadsheet metadata
        sheet_metadata = service.spreadsheets().get(spreadsheetId=sheet_id).execute()
        sheets = sheet_metadata.get('sheets', [])
        return {sheet['properties']['sheetId']: sheet['properties']['title'] for sheet in sheets}
    except Exception as err:
        print(f"Error details: {err}")
        if "403" in str(err):
            print("\nThis might mean either:")
            print("1. The Google Sheet is not accessible with current credentials")
            print("2. The OAuth credentials don't have the correct permissions")
            print("\nPlease check:")
            print("1. You're logged in with the correct Google account")
            print("2. The account has access to the Google Sheet")
        raise Exception(f"Error fetching sheet metadata: {err}")

def process_google_sheet(sheet_url, map_api_key, output_format='json'):
    """Process all sheets in a Google Sheets file and output as Excel or JSON.
    
    Args:
        sheet_url: URL of the Google Sheet
        map_api_key: Google Maps API key
        output_format: Either 'json' or 'excel' (default: 'json')
    """
    try:
        # Get OAuth 2.0 credentials
        creds = get_credentials()
        
        # Build the service with OAuth credentials
        service = build('sheets', 'v4', credentials=creds)
        
        # Retrieve the Google Sheet ID from the URL
        sheet_id = sheet_url.split("/d/")[1].split("/edit")[0]

        # Retrieve all sheet GIDs and names dynamically
        sheet_metadata = get_sheet_metadata(sheet_id)

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

        for gid, sheet_name in sheet_metadata.items():
            print(f"\nProcessing sheet: {sheet_name}")
            
            try:
                # First get the sheet's properties to determine the used range
                sheet_info = service.spreadsheets().get(
                    spreadsheetId=sheet_id,
                    ranges=[f"{sheet_name}"],
                    fields="sheets(properties(gridProperties))"
                ).execute()
                
                # Get the actual data range
                result = service.spreadsheets().values().get(
                    spreadsheetId=sheet_id,
                    range=f"{sheet_name}"
                ).execute()
                
                values = result.get('values', [])
                
                if not values:
                    print(f"No data found in sheet '{sheet_name}'")
                    continue
                
                # Get header row and determine number of columns with data
                header_row = values[0]
                num_cols = len(header_row)
                
                print(f"Found {num_cols} columns with data in sheet '{sheet_name}'")
                
                # Convert to DataFrame
                data = pd.DataFrame(values[1:], columns=header_row)
                print(f"Columns found: {', '.join(data.columns)}")
                
                # Add latitude, longitude, and error columns if they don't exist
                if 'Latitude' not in data.columns:
                    data['Latitude'] = None
                if 'Longitude' not in data.columns:
                    data['Longitude'] = None
                if 'Geocoding_Error' not in data.columns:
                    data['Geocoding_Error'] = None
                if 'Address' not in data.columns:
                    print(f"Warning: No 'Address' column found in sheet '{sheet_name}'. Required columns are: Address")
                    continue

                # Count total addresses in this sheet
                total_addresses = len(data)
                progress_summary['total_addresses'] += total_addresses

                # Process geocoding as before
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
                    
                    latitude, longitude, error = get_coordinates(address, map_api_key)
                    
                    if error:
                        data.at[index, 'Geocoding_Error'] = error
                        all_errors.append(f"Row {index + 2} ({address}): {error}")
                        progress_summary['failed'] += 1
                    else:
                        data.at[index, 'Latitude'] = latitude
                        data.at[index, 'Longitude'] = longitude
                        data.at[index, 'Geocoding_Error'] = None
                        progress_summary['successful'] += 1
                        print(f"✓ Successfully geocoded: {address}")

                # Store the data
                all_data[sheet_name] = data
                
            except Exception as sheet_error:
                print(f"Error processing sheet '{sheet_name}': {str(sheet_error)}")
                continue

        # Save the output based on format
        if output_format.lower() == 'json':
            # Convert DataFrames to records for JSON serialization
            json_data = {sheet: df.to_dict('records') for sheet, df in all_data.items()}
            output_file = f"affiliate_network_dataset_{timestamp}.json"
            output_path = os.path.join(output_dir, output_file)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, indent=2)
            print(f"\nJSON file saved to: {os.path.abspath(output_path)}")
        else:  # Excel format
            output_file = f"affiliate_network_dataset_{timestamp}.xlsx"
            output_path = os.path.join(output_dir, output_file)
            with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
                for sheet_name, df in all_data.items():
                    df.to_excel(writer, sheet_name=sheet_name, index=False)
            print(f"\nExcel file saved to: {os.path.abspath(output_path)}")

        print(f"\nAll sheets have been processed and saved as {output_format.upper()}")
        
        # Print comprehensive summary
        print("\n=== Processing Summary ===")
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
    
    # Load environment variables
    load_dotenv()
    
    # Get API keys
    map_api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    
    # Sheet URL
    sheet_url = "https://docs.google.com/spreadsheets/d/1mAXInBMDYVKjZ5DVz5OlwDx8co33BuOF-49Vyog57NE/edit?gid=0#gid=0"
    
    # Process the sheet (specify output_format='excel' for Excel output)
    process_google_sheet(sheet_url, map_api_key, output_format='json') 