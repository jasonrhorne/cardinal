#!/usr/bin/env python3
"""
Helper script to convert AI text results into JSON format for the AI Restaurant Finder.
Paste your Claude Opus Research results and this will convert them to the proper format.
"""

import json
import re
from typing import List, Dict

def convert_text_to_restaurant_json(text_input: str) -> List[Dict]:
    """
    Convert AI text output to structured restaurant data.
    Handles various formats that AI might output restaurant lists in.
    """
    restaurants = []
    
    # Split into lines and process
    lines = text_input.strip().split('\n')
    
    current_restaurant = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Check if this looks like a restaurant entry (numbered or bulleted)
        restaurant_match = re.match(r'^(\d+\.?\s*|[-*•]\s*)?(.+?)(?:\s*[-–—]\s*(.+))?$', line)
        
        if restaurant_match:
            name_part = restaurant_match.group(2).strip()
            description_part = restaurant_match.group(3) if restaurant_match.group(3) else ""
            
            # Skip obvious non-restaurant entries
            if any(skip_word in name_part.lower() for skip_word in [
                'here are', 'the following', 'restaurants include', 'top picks'
            ]):
                continue
            
            # If this looks like a restaurant name
            if len(name_part) >= 3 and not name_part.lower().startswith(('a ', 'an ', 'the ')):
                if current_restaurant:
                    restaurants.append(current_restaurant)
                
                current_restaurant = {
                    'name': name_part,
                    'description': description_part.strip(),
                    'cuisine_type': extract_cuisine_type(description_part),
                    'neighborhood': extract_neighborhood(description_part),
                    'price_range': extract_price_range(description_part),
                    'ai_confidence': 'High',
                    'source': 'Claude Opus Research'
                }
            elif current_restaurant and description_part:
                # This might be a continuation of the description
                current_restaurant['description'] += ' ' + line
        else:
            # This might be a continuation of the current restaurant's description
            if current_restaurant:
                current_restaurant['description'] += ' ' + line
    
    # Don't forget the last restaurant
    if current_restaurant:
        restaurants.append(current_restaurant)
    
    # Clean up descriptions
    for restaurant in restaurants:
        restaurant['description'] = ' '.join(restaurant['description'].split())
        restaurant['cuisine_type'] = extract_cuisine_type(restaurant['description'])
        restaurant['neighborhood'] = extract_neighborhood(restaurant['description'])
        restaurant['price_range'] = extract_price_range(restaurant['description'])
    
    return restaurants

def extract_cuisine_type(description: str) -> str:
    """Extract cuisine type from description text."""
    if not description:
        return 'Unknown'
        
    cuisine_keywords = {
        'Italian': ['italian', 'pasta', 'pizza', 'tuscan', 'sicilian', 'neapolitan'],
        'American': ['american', 'steakhouse', 'burger', 'bbq', 'barbecue'],
        'Asian': ['asian', 'chinese', 'japanese', 'sushi', 'thai', 'korean', 'vietnamese'],
        'French': ['french', 'bistro', 'brasserie'],
        'Mexican': ['mexican', 'taco', 'burrito', 'tex-mex'],
        'Mediterranean': ['mediterranean', 'greek', 'middle eastern'],
        'Seafood': ['seafood', 'fish', 'oyster', 'shellfish'],
        'Farm-to-table': ['farm', 'local', 'seasonal', 'farm-to-table'],
        'Fine dining': ['fine dining', 'michelin', 'tasting menu'],
        'Caribbean': ['caribbean', 'jamaican', 'cuban'],
        'Indian': ['indian', 'curry', 'tandoor'],
        'German': ['german', 'bavarian', 'oktoberfest']
    }
    
    description_lower = description.lower()
    for cuisine, keywords in cuisine_keywords.items():
        if any(keyword in description_lower for keyword in keywords):
            return cuisine
    
    return 'American'  # Default

def extract_neighborhood(description: str) -> str:
    """Extract neighborhood from description text."""
    if not description:
        return 'Unknown'
        
    pittsburgh_neighborhoods = [
        'Downtown', 'Strip District', 'Lawrenceville', 'Shadyside', 'Squirrel Hill',
        'East Liberty', 'Bloomfield', 'Oakland', 'Polish Hill', 'Garfield',
        'Friendship', 'Highland Park', 'Morningside', 'Allegheny', 'North Shore',
        'South Side', 'Mount Washington', 'Point Breeze', 'Greenfield', 'Hazelwood'
    ]
    
    description_lower = description.lower()
    for neighborhood in pittsburgh_neighborhoods:
        if neighborhood.lower() in description_lower:
            return neighborhood
    
    return 'Pittsburgh Area'

def extract_price_range(description: str) -> str:
    """Extract price range from description text."""
    if not description:
        return 'Mid-range'
        
    description_lower = description.lower()
    
    if any(word in description_lower for word in [
        'fine dining', 'upscale', 'expensive', 'high-end', 'luxury', 'michelin',
        'tasting menu', 'prix fixe', 'white tablecloth'
    ]):
        return 'Fine dining'
    elif any(word in description_lower for word in [
        'budget', 'cheap', 'affordable', 'inexpensive', 'casual', 'dive'
    ]):
        return 'Budget'
    else:
        return 'Mid-range'

def main():
    print("🤖 AI Text to JSON Converter")
    print("=" * 40)
    print("Paste your Claude Opus Research results below.")
    print("Press Enter twice when finished:")
    print()
    
    # Collect input
    lines = []
    empty_line_count = 0
    
    while True:
        try:
            line = input()
            if line.strip() == "":
                empty_line_count += 1
                if empty_line_count >= 2:
                    break
            else:
                empty_line_count = 0
                lines.append(line)
        except EOFError:
            break
    
    input_text = '\n'.join(lines)
    
    if not input_text.strip():
        print("❌ No input provided. Exiting.")
        return
    
    # Convert to JSON
    restaurants = convert_text_to_restaurant_json(input_text)
    
    if not restaurants:
        print("❌ No restaurants found in the input text.")
        return
    
    # Save to file
    output_file = "/Users/jason/Projects/cardinal/ai_restaurant_results.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(restaurants, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Successfully converted {len(restaurants)} restaurants!")
    print(f"📁 Saved to: {output_file}")
    print("\nPreview of converted data:")
    print("-" * 30)
    
    for i, restaurant in enumerate(restaurants[:3], 1):
        print(f"{i}. {restaurant['name']}")
        print(f"   Cuisine: {restaurant['cuisine_type']}")
        print(f"   Area: {restaurant['neighborhood']}")
        print(f"   Price: {restaurant['price_range']}")
        if restaurant['description']:
            desc = restaurant['description'][:100] + "..." if len(restaurant['description']) > 100 else restaurant['description']
            print(f"   Description: {desc}")
        print()
    
    if len(restaurants) > 3:
        print(f"... and {len(restaurants) - 3} more restaurants")
    
    print(f"\n🚀 Ready to run: python3 ai_restaurant_finder.py")

if __name__ == "__main__":
    main()