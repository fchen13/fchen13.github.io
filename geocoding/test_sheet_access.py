import requests
import os
from dotenv import load_dotenv

def test_sheet_access(sheet_url, sheet_api_key):
    """
    Test the accessibility of a Google Sheet and display basic information.
    """
    try:
        # Extract sheet ID from URL
        sheet_id = sheet_url.split("/d/")[1].split("/edit")[0]
        
        # Test 1: Basic API Access
        print("Test 1: Testing basic API access...")
        test_url = f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}?key={sheet_api_key}"
        response = requests.get(test_url)
        print(f"API Response Status: {response.status_code}")
        
        if response.status_code != 200:
            print("❌ Failed to access the sheet via API")
            return False
            
        # Test 2: Get Sheet Metadata
        print("\nTest 2: Retrieving sheet metadata...")
        sheet_data = response.json()
        print(f"Sheet Title: {sheet_data['properties']['title']}")
        print(f"Sheet ID: {sheet_data['spreadsheetId']}")
        
        # Test 3: Try to read actual data
        print("\nTest 3: Attempting to read sheet data...")
        # Get the first sheet's ID
        first_sheet_id = sheet_data['sheets'][0]['properties']['sheetId']
        values_url = f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/Sheet1!A1:D5?key={sheet_api_key}"
        values_response = requests.get(values_url)
        
        if values_response.status_code == 200:
            values_data = values_response.json()
            if 'values' in values_data:
                print("\nFirst few rows of data:")
                for row in values_data['values'][:3]:  # Show first 3 rows
                    print(row)
                print("\n✅ Successfully read sheet data!")
            else:
                print("❌ No data found in the sheet")
        else:
            print(f"❌ Failed to read sheet data. Status code: {values_response.status_code}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error occurred: {str(e)}")
        return False

if __name__ == "__main__":
    # Load environment variables
    load_dotenv()
    
    # Get API key
    sheet_api_key = os.getenv('GOOGLE_SHEET_API_KEY')
    
    # Sheet URL
    sheet_url = "https://docs.google.com/spreadsheets/d/1pzVZWoBOXqkDc6B6GItdhqm2oK1MaE-ZXt_1VlhtmcE/edit?gid=0#gid=0"
    
    # Run the test
    print("Starting sheet accessibility test...")
    test_sheet_access(sheet_url, sheet_api_key) 