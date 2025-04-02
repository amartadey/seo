import json

# Read the original JSON file with UTF-8 encoding
with open('data.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

# Create a dictionary to store unique entries
unique_entries = {}
seen_urls = set()

# Process each entry and keep only the first occurrence of each URL
for entry in data:
    url = entry['url']
    if url not in seen_urls:
        unique_entries[url] = entry
        seen_urls.add(url)

# Convert back to list format
unique_data = list(unique_entries.values())

# Write to a new JSON file with UTF-8 encoding
with open('unique_data.json', 'w', encoding='utf-8') as file:
    json.dump(unique_data, file, indent=4)

print(f"Original entries: {len(data)}")
print(f"Unique entries: {len(unique_data)}")
print("Duplicate entries have been removed and saved to 'unique_data.json'")