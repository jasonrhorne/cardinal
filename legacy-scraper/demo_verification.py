#!/usr/bin/env python3
"""
Demo script to show Google Places API verification without requiring a real API key.
This demonstrates what the verification would return.
"""

import json
from datetime import datetime

def demo_google_places_verification():
    """Demo of what Google Places verification would return."""
    
    # Sample restaurant data from our Pittsburgh scraping
    sample_restaurants = [
        {'name': 'The Pleasure Bar', 'city': 'Pittsburgh', 'state': 'PA'},
        {'name': 'Il Tetto', 'city': 'Pittsburgh', 'state': 'PA'},
        {'name': 'Piccolo Forno', 'city': 'Pittsburgh', 'state': 'PA'},
        {'name': 'Eden', 'city': 'Pittsburgh', 'state': 'PA'},
        {'name': 'Fake Restaurant Name', 'city': 'Pittsburgh', 'state': 'PA'}  # This would not be found
    ]
    
    # Mock verification results (what Google Places API would return)
    mock_verified_data = [
        {
            'name': 'The Pleasure Bar',
            'verification_status': 'VERIFIED',
            'business_status': 'OPERATIONAL',
            'permanently_closed': False,
            'google_name': 'The Pleasure Bar',
            'google_address': '5428 Butler St, Pittsburgh, PA 15201, USA',
            'google_rating': 4.4,
            'google_rating_count': 1247,
            'price_level': 2,
            'open_now': True,
            'current_hours': [
                'Monday: 4:00 PM – 12:00 AM',
                'Tuesday: 4:00 PM – 12:00 AM', 
                'Wednesday: 4:00 PM – 12:00 AM',
                'Thursday: 4:00 PM – 12:00 AM',
                'Friday: 4:00 PM – 1:00 AM',
                'Saturday: 4:00 PM – 1:00 AM',
                'Sunday: 4:00 PM – 12:00 AM'
            ],
            'place_types': ['bar', 'restaurant', 'food', 'point_of_interest', 'establishment'],
            'google_place_id': 'ChIJ_example_pleasure_bar',
            'last_verified': datetime.now().isoformat()
        },
        {
            'name': 'Il Tetto',
            'verification_status': 'VERIFIED',
            'business_status': 'OPERATIONAL',
            'permanently_closed': False,
            'google_name': 'Il Tetto',
            'google_address': '2000 Smallman St, Pittsburgh, PA 15222, USA',
            'google_rating': 4.3,
            'google_rating_count': 892,
            'price_level': 3,
            'open_now': False,  # Closed at time of check
            'current_hours': [
                'Monday: Closed',
                'Tuesday: 5:00 PM – 12:00 AM',
                'Wednesday: 5:00 PM – 12:00 AM', 
                'Thursday: 5:00 PM – 12:00 AM',
                'Friday: 5:00 PM – 1:00 AM',
                'Saturday: 5:00 PM – 1:00 AM',
                'Sunday: 5:00 PM – 12:00 AM'
            ],
            'place_types': ['bar', 'restaurant', 'food', 'point_of_interest', 'establishment'],
            'google_place_id': 'ChIJ_example_il_tetto',
            'last_verified': datetime.now().isoformat()
        },
        {
            'name': 'Piccolo Forno',
            'verification_status': 'VERIFIED',
            'business_status': 'OPERATIONAL',
            'permanently_closed': False,
            'google_name': 'Piccolo Forno',
            'google_address': '3801 Butler St, Pittsburgh, PA 15201, USA',
            'google_rating': 4.6,
            'google_rating_count': 1556,
            'price_level': 3,
            'open_now': True,
            'current_hours': [
                'Monday: Closed',
                'Tuesday: 5:00 PM – 10:00 PM',
                'Wednesday: 5:00 PM – 10:00 PM',
                'Thursday: 5:00 PM – 10:00 PM', 
                'Friday: 5:00 PM – 11:00 PM',
                'Saturday: 5:00 PM – 11:00 PM',
                'Sunday: 5:00 PM – 10:00 PM'
            ],
            'place_types': ['restaurant', 'food', 'point_of_interest', 'establishment'],
            'google_place_id': 'ChIJ_example_piccolo_forno',
            'last_verified': datetime.now().isoformat()
        },
        {
            'name': 'Eden',
            'verification_status': 'VERIFIED',
            'business_status': 'CLOSED_PERMANENTLY',
            'permanently_closed': True,  # This restaurant has closed
            'google_name': 'Eden (PERMANENTLY CLOSED)',
            'google_address': '5491 Penn Ave, Pittsburgh, PA 15206, USA',
            'google_rating': 4.2,
            'google_rating_count': 445,
            'price_level': 2,
            'open_now': None,  # No hours because permanently closed
            'current_hours': [],
            'place_types': ['restaurant', 'food', 'point_of_interest', 'establishment'],
            'google_place_id': 'ChIJ_example_eden_closed',
            'last_verified': datetime.now().isoformat()
        },
        {
            'name': 'Fake Restaurant Name',
            'verification_status': 'NOT_FOUND',
            'business_status': 'NOT_FOUND',
            'permanently_closed': False,
            'google_name': '',
            'google_address': '',
            'google_rating': None,
            'google_rating_count': None,
            'price_level': None,
            'open_now': None,
            'current_hours': [],
            'place_types': [],
            'google_place_id': None,
            'last_verified': datetime.now().isoformat()
        }
    ]
    
    print("🔍 Google Places API Verification Demo")
    print("=" * 50)
    print()
    
    for restaurant in mock_verified_data:
        name = restaurant['name']
        status = restaurant['verification_status']
        business_status = restaurant['business_status']
        
        print(f"📍 {name}")
        print(f"   Status: {status}")
        
        if status == 'VERIFIED':
            print(f"   Business Status: {business_status}")
            if restaurant['permanently_closed']:
                print(f"   ⚠️  PERMANENTLY CLOSED")
            else:
                print(f"   Google Name: {restaurant['google_name']}")
                print(f"   Address: {restaurant['google_address']}")
                print(f"   Rating: {restaurant['google_rating']}/5.0 ({restaurant['google_rating_count']} reviews)")
                print(f"   Price Level: {'$' * (restaurant.get('price_level', 1))}")
                print(f"   Open Now: {'✅ Yes' if restaurant['open_now'] else '❌ No' if restaurant['open_now'] is not None else 'Unknown'}")
                
                if restaurant['current_hours']:
                    print(f"   Hours:")
                    for hours in restaurant['current_hours'][:3]:  # Show first 3 days
                        print(f"     {hours}")
                    if len(restaurant['current_hours']) > 3:
                        print(f"     ... and {len(restaurant['current_hours']) - 3} more days")
        
        elif status == 'NOT_FOUND':
            print(f"   ❌ Not found on Google Places")
            
        print(f"   Last Verified: {restaurant['last_verified'][:19]}")  # Show without microseconds
        print()
    
    # Summary
    verified_count = sum(1 for r in mock_verified_data if r['verification_status'] == 'VERIFIED')
    closed_count = sum(1 for r in mock_verified_data if r.get('permanently_closed', False))
    not_found_count = sum(1 for r in mock_verified_data if r['verification_status'] == 'NOT_FOUND')
    
    print("📊 Verification Summary")
    print(f"✅ {verified_count} restaurants verified on Google Places")
    print(f"❌ {closed_count} restaurants permanently closed")
    print(f"🔍 {not_found_count} restaurants not found")

if __name__ == "__main__":
    demo_google_places_verification()