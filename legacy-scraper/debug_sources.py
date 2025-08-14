#!/usr/bin/env python3
"""
Debug script to see what each source is finding before validation.
"""

import sys
sys.path.append('.')
from enhanced_restaurant_scraper import EnhancedRestaurantScraper

def debug_sources():
    scraper = EnhancedRestaurantScraper("Pittsburgh", "PA")
    
    print("🔍 Debugging individual sources...")
    print("=" * 50)
    
    # Test each source individually
    sources = [
        ('Thrillist', scraper.search_thrillist),
        ('Reddit', scraper.search_reddit),
        ('VisitPittsburgh', scraper.search_visit_pittsburgh),
        ('Local Media', scraper.search_local_media),
    ]
    
    all_raw_results = []
    
    for source_name, source_func in sources:
        print(f"\n📊 {source_name} Results:")
        print("-" * 30)
        try:
            restaurants = source_func()
            all_raw_results.extend(restaurants)
            
            if restaurants:
                for i, restaurant in enumerate(restaurants, 1):
                    print(f"{i}. {restaurant['name']}")
                    if len(restaurant.get('description', '')) > 0:
                        desc = restaurant['description'][:100] + "..." if len(restaurant['description']) > 100 else restaurant['description']
                        print(f"   Description: {desc}")
                    print(f"   Source: {restaurant['source']}")
                    print()
            else:
                print("   No results found")
        except Exception as e:
            print(f"   Error: {e}")
    
    print(f"\n📈 Summary:")
    print(f"Total raw results found: {len(all_raw_results)}")
    
    # Show cross-validation impact
    print(f"\nBefore cross-validation: {len(all_raw_results)} restaurants")
    validated = scraper._cross_validate_restaurants(all_raw_results)
    print(f"After cross-validation: {len(validated)} restaurants")
    
    print(f"\nFiltered out: {len(all_raw_results) - len(validated)} restaurants")
    
    if len(all_raw_results) != len(validated):
        filtered_names = [r['name'] for r in all_raw_results if r not in validated]
        print("Restaurants filtered out:")
        for name in filtered_names[:10]:  # Show first 10
            print(f"  - {name}")

if __name__ == "__main__":
    debug_sources()