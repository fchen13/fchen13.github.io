import json
import re
import os
import subprocess

# Define the data directory
DATA_DIR = os.path.dirname(__file__)

# 1. Read and process affiliate_list.js
def process_affiliate_list():
    """Process affiliate_list.js by directly parsing the JavaScript object."""
    with open(os.path.join(DATA_DIR, 'affiliate_list.json'), 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove the 'const projectsData = ' prefix and any trailing semicolon
    content = content.replace('const projectsData = ', '').strip()
    if content.endswith(';'):
        content = content[:-1]
    
    # Convert JavaScript object to valid JSON
    # First, handle any unquoted property names (if they exist)
    content = re.sub(r'([{,]\s*)(\w+):', r'\1"\2":', content)
    
    try:
        # Parse the JSON
        affiliate_data = json.loads(content)
        
        # Save the raw JSON before processing
        with open(os.path.join(DATA_DIR, 'affiliate_list_raw.json'), 'w', encoding='utf-8') as f:
            json.dump(affiliate_data, f, indent=2, ensure_ascii=False)
        print("Saved raw affiliate data to affiliate_list_raw.json")
        
        # Add type field if not present
        for item in affiliate_data:
            if 'type' not in item:
                # Create a new dict with type inserted before address
                new_item = {}
                for key in item:
                    if key == 'address':
                        new_item['type'] = 'Headquarter'
                    new_item[key] = item[key]
                item.clear()
                item.update(new_item)
        
        return affiliate_data
        
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {str(e)}")
        print("Content causing error:", content[:200] + "...")  # Print first 200 chars for debugging
        raise

# 2. Read and process network dataset
def process_network_dataset():
    with open(os.path.join(DATA_DIR, 'network_dataset_20250309.json'), 'r', encoding='utf-8') as f:
        network_data = json.load(f)
    
    # Convert nested structure to flat array
    flat_data = []
    for project, locations in network_data.items():
        for location in locations:
            # Fill in blank Affiliated Project with parent project name
            affiliated_project = location['Affiliated Project'] if location['Affiliated Project'] else project
            
            # Skip geocoding_error field and create new dict with processed fields
            processed_location = {
                'projectName': affiliated_project,
                'institute': location['Title'],
                'type': location['Type '].strip(),  # Remove space after type
                'address': location['Address'],
                'latitude': location['Latitude'],
                'longitude': location['Longitude']
            }
            flat_data.append(processed_location)
    
    return flat_data

def extract_full_name(project_name):
    """Extract the full name from a project name that might contain acronyms in parentheses."""
    # Remove anything in parentheses and strip whitespace
    return re.sub(r'\s*\([^)]*\)\s*', '', project_name).strip()

def merge_datasets(affiliate_data, network_data):
    """Merge affiliate and network datasets based on project names and types."""
    merged_data = []
    processed_network_entries = set()  # Track which network entries we've used
    
    # First, process network dataset entries
    for network_entry in network_data:
        network_full_name = extract_full_name(network_entry['projectName'])
        network_type = network_entry['type']
        
        # Check if there's a matching affiliate entry
        matching_affiliate = None
        for affiliate_entry in affiliate_data:
            affiliate_full_name = extract_full_name(affiliate_entry['projectName'])
            if affiliate_full_name == network_full_name and affiliate_entry['type'] == network_type:
                matching_affiliate = affiliate_entry
                break
        
        # If we found a match, use the network entry (as per requirement)
        if matching_affiliate:
            merged_data.append(network_entry)
            processed_network_entries.add(network_entry['projectName'])
        else:
            # If no match, add network entry anyway
            merged_data.append(network_entry)
            processed_network_entries.add(network_entry['projectName'])
    
    # Then, add remaining affiliate entries that weren't matched
    for affiliate_entry in affiliate_data:
        affiliate_full_name = extract_full_name(affiliate_entry['projectName'])
        affiliate_type = affiliate_entry['type']
        
        # Check if this entry was already processed
        already_processed = False
        for network_entry in network_data:
            network_full_name = extract_full_name(network_entry['projectName'])
            if network_full_name == affiliate_full_name and network_entry['type'] == affiliate_type:
                already_processed = True
                break
        
        if not already_processed:
            merged_data.append(affiliate_entry)
    
    return merged_data

def main():
    try:
        # Process both datasets
        print("Processing affiliate_list.js...")
        affiliate_data = process_affiliate_list()
        print(f"Processed {len(affiliate_data)} entries from affiliate_list.js")
        
        print("\nProcessing network_dataset_20250309.json...")
        network_data = process_network_dataset()
        print(f"Processed {len(network_data)} entries from network_dataset_20250309.json")
        
        # Merge the datasets
        print("\nMerging datasets...")
        merged_data = merge_datasets(affiliate_data, network_data)
        print(f"Merged dataset contains {len(merged_data)} entries")
        
        # Save processed data to JSON files
        # with open(os.path.join(DATA_DIR, 'processed_network_data.json'), 'w', encoding='utf-8') as f:
        #     json.dump(network_data, f, indent=2, ensure_ascii=False)
        # print("\nSaved processed network data to processed_network_data.json")
        
        with open(os.path.join(DATA_DIR, 'affiliate_network.json'), 'w', encoding='utf-8') as f:
            json.dump(merged_data, f, indent=2, ensure_ascii=False)
        print("Saved merged data to affiliate_network.json")
        
        return {
            'affiliate_data': affiliate_data,
            'network_data': network_data,
            'merged_data': merged_data
        }
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return None

if __name__ == "__main__":
    processed_data = main() 