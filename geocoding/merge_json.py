import json
from datetime import datetime
import os

# Get the directory where the script is located
script_dir = os.path.dirname(os.path.abspath(__file__))

# Read the first JSON file
with open(os.path.join(script_dir, 'affiliateList_20250317.json'), 'r', encoding='utf-8') as f:
    data1 = json.load(f)

# Read the second JSON file
with open(os.path.join(script_dir, 'affiliate_network_list_20250319.json'), 'r', encoding='utf-8') as f:
    data2 = json.load(f)

# Print initial statistics
print(f"\nInitial Statistics:")
print(f"Number of entries in affiliateList: {len(data1)}")
print(f"Number of entries in affiliate_network_list: {len(data2)}")

# Process data2 to handle NaN values
for entry in data2:
    if 'activities' in entry and (entry['activities'] is None or str(entry['activities']).lower() == 'nan'):
        entry['activities'] = ""

# Filter out headquarters entries from data2
filtered_data2 = [entry for entry in data2 if 'type' not in entry or 'headquarters' not in entry['type'].lower()]
headquarters_count = len(data2) - len(filtered_data2)

# Print filtering statistics
print(f"\nFiltering Statistics:")
print(f"Number of headquarters entries filtered out: {headquarters_count}")
print(f"Number of remaining entries from affiliate_network_list: {len(filtered_data2)}")

# Combine filtered entries
merged_data = data1 + filtered_data2

# Print final statistics
print(f"\nFinal Statistics:")
print(f"Total number of entries in merged output: {len(merged_data)}")

# Get current date in YYYYMMDD format
current_date = datetime.now().strftime('%Y%m%d')

# Write the merged data to JSON file with timestamp
json_output_filename = os.path.join(script_dir, f'EBPnetwork_{current_date}.json')
with open(json_output_filename, 'w', encoding='utf-8') as f:
    json.dump(merged_data, f, indent=2, ensure_ascii=False)

# Function to format JavaScript object with proper indentation
def format_js_value(value):
    if isinstance(value, str):
        return f'"{value}"'
    elif isinstance(value, bool):
        return str(value).lower()
    elif value is None:
        return 'null'
    else:
        return str(value)

# Create JavaScript content with proper formatting
js_lines = ['const projectsData = [']

for i, entry in enumerate(merged_data):
    # Start object
    js_lines.append('  {')
    
    # Add properties with proper indentation
    props = []
    for key, value in entry.items():
        formatted_value = format_js_value(value)
        props.append(f'    {key}: {formatted_value}')
    
    js_lines.append(',\n'.join(props))
    
    # Close object
    if i < len(merged_data) - 1:
        js_lines.append('  },')
    else:
        js_lines.append('  }')

js_lines.append('];')

# Write the JavaScript file with timestamp
js_output_filename = os.path.join(script_dir, f'EBPnetwork_{current_date}.js')
with open(js_output_filename, 'w', encoding='utf-8') as f:
    f.write('\n'.join(js_lines))

print(f"\nOutput files created:")
print(f"JSON file: {json_output_filename}")
print(f"JavaScript file: {js_output_filename}") 