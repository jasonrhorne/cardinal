#!/usr/bin/env python3
"""
AI-powered restaurant finder that uses AI agent discovery + Google Places API validation.
This approach uses AI to discover restaurants, then validates and enriches with Google Places API.
"""

import json
import csv
import logging
import os
import time
from datetime import datetime
from typing import List, Dict, Optional
import re

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AIRestaurantFinder:
    def __init__(self, city: str, state: str):
        self.city = city
        self.state = state
        self.restaurants = []
    
    def discover_restaurants_with_ai(self, anthropic_api_key: Optional[str] = None) -> List[Dict]:
        """
        Use Claude API to automatically discover restaurants.
        """
        if not anthropic_api_key:
            anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
        
        if not anthropic_api_key:
            logger.warning("No Anthropic API key provided. Falling back to file-based input.")
            return []
        
        try:
            import anthropic
            
            logger.info(f"🤖 Using Claude API to discover restaurants in {self.city}, {self.state}")
            
            client = anthropic.Anthropic(api_key=anthropic_api_key)
            
            # Customizable prompt - easy to modify for different criteria
            prompt = f"""Find 25+ exceptional restaurants in {self.city}, {self.state} that meet criteria for buzz, innovation, chef pedigree, awards, or cultural relevance. Focus on discovering:

🏆 PRIORITY TARGETS:
- James Beard nominees/winners and semifinalists
- New York Times restaurant coverage or "50 Best" mentions
- Bon Appétit, Food & Wine, or Eater features
- Pop-up to permanent success stories
- Unique ethnic cuisines rarely found elsewhere
- Chef-driven establishments with notable pedigrees
- Recent openings (2023-2024) gaining buzz
- Reservation hotspots requiring advance booking
- Instagram-famous or social media trending spots

🎯 RESTAURANT TYPES TO INCLUDE:
- Fine dining establishments
- Innovative casual spots
- Authentic ethnic restaurants
- Farm-to-table concepts
- Notable steakhouses and seafood
- Specialty cuisine (vegan, gluten-free innovations)
- Historic establishments with renewed relevance
- Food halls with standout vendors

For each restaurant, provide:
1. **Restaurant Name** (exact name as it appears publicly)
2. **Description** (2-3 sentences highlighting what makes it special, awards, chef background, signature dishes, or unique concept)
3. **Cuisine Type** (be specific: "Sichuan Chinese" not just "Asian")
4. **Neighborhood** (specific area within {self.city})
5. **Price Range** (Budget/Mid-range/Fine dining)

Format as a clean numbered list:
1. Restaurant Name - Description here. Cuisine Type, Neighborhood, Price Range.

Focus on restaurants that food critics, locals, and visitors would consider "must-try" destinations."""

            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Parse the Claude response
            response_text = response.content[0].text
            logger.info("✅ Claude API response received, parsing restaurants...")
            
            restaurants = self._parse_claude_response(response_text)
            logger.info(f"🎯 Parsed {len(restaurants)} restaurants from Claude API")
            
            return restaurants
            
        except ImportError:
            logger.error("anthropic library not installed. Install with: pip install anthropic")
            return []
        except Exception as e:
            logger.error(f"Error calling Claude API: {e}")
            return []
    
    def load_ai_results_from_file(self, file_path: str) -> List[Dict]:
        """
        Load AI-discovered restaurants from a JSON file.
        This allows us to process results from Claude Opus Research or other AI tools.
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                ai_results = json.load(f)
            
            logger.info(f"Loaded {len(ai_results)} restaurants from AI results file")
            return ai_results
            
        except FileNotFoundError:
            logger.error(f"AI results file not found: {file_path}")
            return []
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON in AI results file: {file_path}")
            return []
    
    def load_ai_results_from_text(self, text_content: str) -> List[Dict]:
        """
        Parse AI results from raw text format.
        Handles various formats that AI might output restaurant lists in.
        """
        restaurants = []
        
        # Try to extract restaurant information from text
        # This regex looks for numbered lists with restaurant names
        restaurant_pattern = r'(\d+\.?\s*)([A-Za-z\s&\'-]+?)(?:\s*[-–]\s*(.+?))?(?=\n\d+\.|\n\n|\Z)'
        matches = re.findall(restaurant_pattern, text_content, re.MULTILINE | re.DOTALL)
        
        for match in matches:
            name = match[1].strip()
            description = match[2].strip() if match[2] else ""
            
            # Skip if name is too short or contains common non-restaurant words
            if len(name) < 3 or any(word in name.lower() for word in ['the following', 'restaurants', 'here are']):
                continue
            
            restaurant = {
                'name': name,
                'description': description,
                'cuisine_type': self._extract_cuisine_type(description),
                'neighborhood': self._extract_neighborhood(description),
                'price_range': self._extract_price_range(description),
                'ai_confidence': 'Medium',  # Default confidence
                'source': 'AI Agent Discovery'
            }
            restaurants.append(restaurant)
        
        logger.info(f"Parsed {len(restaurants)} restaurants from text")
        return restaurants
    
    def _extract_cuisine_type(self, description: str) -> str:
        """Extract cuisine type from description text."""
        cuisine_keywords = {
            'italian': ['italian', 'pasta', 'pizza', 'tuscan'],
            'american': ['american', 'steakhouse', 'burger', 'bbq'],
            'asian': ['asian', 'chinese', 'japanese', 'sushi', 'thai'],
            'french': ['french', 'bistro'],
            'mexican': ['mexican', 'taco', 'burrito'],
            'mediterranean': ['mediterranean', 'greek'],
            'seafood': ['seafood', 'fish', 'oyster'],
            'farm-to-table': ['farm', 'local', 'seasonal']
        }
        
        description_lower = description.lower()
        for cuisine, keywords in cuisine_keywords.items():
            if any(keyword in description_lower for keyword in keywords):
                return cuisine.title()
        
        return 'Unknown'
    
    def _extract_neighborhood(self, description: str) -> str:
        """Extract neighborhood from description text."""
        pittsburgh_neighborhoods = [
            'Downtown', 'Strip District', 'Lawrenceville', 'Shadyside', 'Squirrel Hill',
            'East Liberty', 'Bloomfield', 'Oakland', 'Polish Hill', 'Garfield',
            'Friendship', 'Highland Park', 'Morningside', 'Allegheny', 'North Shore'
        ]
        
        description_lower = description.lower()
        for neighborhood in pittsburgh_neighborhoods:
            if neighborhood.lower() in description_lower:
                return neighborhood
        
        return 'Unknown'
    
    def _extract_price_range(self, description: str) -> str:
        """Extract price range from description text."""
        description_lower = description.lower()
        
        if any(word in description_lower for word in ['fine dining', 'upscale', 'expensive', 'high-end']):
            return 'Fine dining'
        elif any(word in description_lower for word in ['mid-range', 'moderate', 'casual']):
            return 'Mid-range'
        elif any(word in description_lower for word in ['budget', 'cheap', 'affordable']):
            return 'Budget'
        else:
            return 'Mid-range'  # Default assumption
    
    def _parse_claude_response(self, response_text: str) -> List[Dict]:
        """
        Parse Claude API response into structured restaurant data.
        Handles the numbered list format specified in the prompt.
        """
        restaurants = []
        
        # Split into lines and look for numbered entries
        lines = response_text.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Look for numbered list items (1. Restaurant Name - Description...)
            numbered_match = re.match(r'^(\d+)\.\s*(.+)', line)
            if numbered_match:
                content = numbered_match.group(2)
                
                # Try to parse "Restaurant Name - Description. Cuisine, Neighborhood, Price."
                if ' - ' in content:
                    name_part, rest = content.split(' - ', 1)
                    name = name_part.strip()
                    
                    # Look for the last sentence which should contain cuisine, neighborhood, price
                    sentences = rest.split('. ')
                    if len(sentences) >= 2:
                        description = '. '.join(sentences[:-1]).strip()
                        details = sentences[-1].strip()
                        
                        # Parse details: "Cuisine Type, Neighborhood, Price Range"
                        detail_parts = [part.strip() for part in details.split(',')]
                        
                        cuisine_type = detail_parts[0] if len(detail_parts) > 0 else 'Unknown'
                        neighborhood = detail_parts[1] if len(detail_parts) > 1 else 'Unknown'
                        price_range = detail_parts[2] if len(detail_parts) > 2 else 'Mid-range'
                        
                    else:
                        description = rest.strip()
                        cuisine_type = self._extract_cuisine_type(description)
                        neighborhood = self._extract_neighborhood(description)
                        price_range = self._extract_price_range(description)
                else:
                    # Fallback parsing if format is different
                    name = content.split('.')[0].strip() if '.' in content else content.strip()
                    description = content
                    cuisine_type = self._extract_cuisine_type(description)
                    neighborhood = self._extract_neighborhood(description)
                    price_range = self._extract_price_range(description)
                
                # Create restaurant entry
                restaurant = {
                    'name': name,
                    'description': description,
                    'cuisine_type': cuisine_type,
                    'neighborhood': neighborhood,
                    'price_range': price_range,
                    'ai_confidence': 'High',
                    'source': 'Claude API Discovery'
                }
                
                restaurants.append(restaurant)
        
        return restaurants
    
    def validate_with_google_places(self, ai_restaurants: List[Dict], api_key: Optional[str] = None) -> List[Dict]:
        """
        Validate and enrich AI-discovered restaurants using Google Places API.
        """
        if not api_key:
            api_key = os.getenv('GOOGLE_PLACES_API_KEY')
        
        if not api_key:
            logger.warning("No Google Places API key provided. Skipping validation.")
            return ai_restaurants
        
        try:
            import googlemaps
            gmaps = googlemaps.Client(key=api_key)
            
            logger.info(f"🔍 Validating {len(ai_restaurants)} AI-discovered restaurants with Google Places API")
            
            validated_restaurants = []
            
            for i, restaurant in enumerate(ai_restaurants, 1):
                try:
                    logger.info(f"Validating {i}/{len(ai_restaurants)}: {restaurant['name']}")
                    
                    # Search for the restaurant
                    search_query = f"{restaurant['name']} restaurant {self.city} {self.state}"
                    places_result = gmaps.places(query=search_query)
                    
                    if places_result['results']:
                        # Get the best match (first result)
                        place = places_result['results'][0]
                        place_id = place['place_id']
                        
                        # Get detailed information
                        place_details = gmaps.place(
                            place_id=place_id,
                            fields=[
                                'name', 'business_status', 'opening_hours', 'rating', 
                                'user_ratings_total', 'formatted_address', 'place_id',
                                'permanently_closed', 'price_level', 'website'
                            ]
                        )
                        
                        details = place_details['result']
                        
                        # Enrich the restaurant data
                        enriched_restaurant = restaurant.copy()
                        enriched_restaurant.update({
                            'verification_status': 'VERIFIED',
                            'business_status': details.get('business_status', 'UNKNOWN'),
                            'permanently_closed': details.get('permanently_closed', False),
                            'google_name': details.get('name', ''),
                            'google_address': details.get('formatted_address', ''),
                            'google_rating': details.get('rating'),
                            'google_rating_count': details.get('user_ratings_total'),
                            'price_level': details.get('price_level'),
                            'google_place_id': place_id,
                            'website': details.get('website', ''),
                            'place_types': place.get('types', []),
                            'last_verified': datetime.now().isoformat(),
                            'url': f"https://maps.google.com/maps?place_id={place_id}"
                        })
                        
                        # Add current hours if available
                        if 'opening_hours' in details and 'weekday_text' in details['opening_hours']:
                            enriched_restaurant['current_hours'] = details['opening_hours']['weekday_text']
                            enriched_restaurant['open_now'] = details['opening_hours'].get('open_now', False)
                        else:
                            enriched_restaurant['current_hours'] = []
                            enriched_restaurant['open_now'] = None
                        
                        # Check if permanently closed
                        if details.get('permanently_closed') or details.get('business_status') == 'CLOSED_PERMANENTLY':
                            enriched_restaurant['permanently_closed'] = True
                            logger.warning(f"Restaurant {restaurant['name']} appears to be permanently closed")
                        
                        validated_restaurants.append(enriched_restaurant)
                        
                    else:
                        # Restaurant not found on Google Places
                        enriched_restaurant = restaurant.copy()
                        enriched_restaurant.update({
                            'verification_status': 'NOT_FOUND',
                            'business_status': 'NOT_FOUND',
                            'permanently_closed': False,
                            'last_verified': datetime.now().isoformat()
                        })
                        validated_restaurants.append(enriched_restaurant)
                        logger.warning(f"Restaurant {restaurant['name']} not found on Google Places")
                    
                    # Rate limiting
                    time.sleep(0.1)
                    
                except Exception as e:
                    logger.error(f"Error validating {restaurant['name']}: {e}")
                    # Add restaurant with error status
                    enriched_restaurant = restaurant.copy()
                    enriched_restaurant.update({
                        'verification_status': 'ERROR',
                        'verification_error': str(e),
                        'last_verified': datetime.now().isoformat()
                    })
                    validated_restaurants.append(enriched_restaurant)
                    continue
            
            # Summary statistics
            verified_count = sum(1 for r in validated_restaurants if r.get('verification_status') == 'VERIFIED')
            closed_count = sum(1 for r in validated_restaurants if r.get('permanently_closed', False))
            not_found_count = sum(1 for r in validated_restaurants if r.get('verification_status') == 'NOT_FOUND')
            
            logger.info("🎯 Validation Summary:")
            logger.info(f"✅ {verified_count} restaurants verified and found on Google Places")
            logger.info(f"❌ {closed_count} restaurants marked as permanently closed")
            logger.info(f"🔍 {not_found_count} restaurants not found on Google Places")
            
            return validated_restaurants
            
        except ImportError:
            logger.error("googlemaps library not installed. Install with: pip install googlemaps")
            return ai_restaurants
        except Exception as e:
            logger.error(f"Error during Google Places validation: {e}")
            return ai_restaurants
    
    def save_to_csv(self, restaurants: List[Dict], filename: Optional[str] = None) -> str:
        """Save validated restaurants to CSV file."""
        if not filename:
            filename = f"{self.city.lower().replace(' ', '_')}_restaurants_ai_validated.csv"
        
        filepath = f"/Users/jason/Projects/cardinal/{filename}"
        
        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = [
                'name', 'description', 'cuisine_type', 'neighborhood', 'price_range', 
                'ai_confidence', 'source', 'verification_status', 'business_status', 
                'permanently_closed', 'google_name', 'google_address', 'google_rating', 
                'google_rating_count', 'price_level', 'open_now', 'current_hours', 
                'place_types', 'website', 'last_verified', 'google_place_id', 
                'url', 'verification_error'
            ]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for restaurant in restaurants:
                writer.writerow(restaurant)
        
        logger.info(f"Saved {len(restaurants)} restaurants to {filepath}")
        return filepath

def main():
    """Main execution function."""
    print("🤖 AI Restaurant Finder - Pittsburgh, PA")
    print("=" * 50)
    
    finder = AIRestaurantFinder("Pittsburgh", "PA")
    
    # Try Claude API first, fall back to file-based input
    anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
    
    if anthropic_api_key:
        print("🎯 Using Claude API for automatic restaurant discovery...")
        ai_restaurants = finder.discover_restaurants_with_ai(anthropic_api_key)
        
        if not ai_restaurants:
            print("❌ Claude API discovery failed, falling back to file-based input...")
            ai_restaurants = []
    else:
        print("⚠️  No Anthropic API key found (ANTHROPIC_API_KEY env var)")
        ai_restaurants = []
    
    # Fallback to file-based input if Claude API didn't work
    if not ai_restaurants:
        ai_results_file = "/Users/jason/Projects/cardinal/ai_restaurant_results.json"
        if os.path.exists(ai_results_file):
            print(f"📁 Loading AI results from {ai_results_file}")
            ai_restaurants = finder.load_ai_results_from_file(ai_results_file)
        else:
            print("📝 No AI results available. Options:")
            print("1. Set ANTHROPIC_API_KEY environment variable for automatic discovery")
            print("2. Create 'ai_restaurant_results.json' with pre-generated results")
            print("3. Use convert_ai_text_to_json.py to convert text results")
            return
    
    if not ai_restaurants:
        print("❌ No AI restaurant results to process. Exiting.")
        return
    
    print(f"🔍 Found {len(ai_restaurants)} AI-discovered restaurants")
    
    # Validate with Google Places API
    api_key = os.getenv('GOOGLE_PLACES_API_KEY')
    if api_key:
        print("🌐 Validating with Google Places API...")
        validated_restaurants = finder.validate_with_google_places(ai_restaurants, api_key)
    else:
        print("⚠️  No Google Places API key found. Skipping validation.")
        validated_restaurants = ai_restaurants
    
    # Save results
    filepath = finder.save_to_csv(validated_restaurants)
    
    print(f"\n✅ AI Restaurant Discovery Complete!")
    print(f"📊 Total restaurants: {len(validated_restaurants)}")
    print(f"💾 Results saved to: {filepath}")
    
    # Show cost estimate
    if anthropic_api_key and api_key:
        claude_cost = len(ai_restaurants) * 0.003  # Rough estimate
        places_cost = len(validated_restaurants) * 0.049
        total_cost = claude_cost + places_cost
        print(f"💰 Estimated cost: Claude ${claude_cost:.2f} + Places ${places_cost:.2f} = ${total_cost:.2f}")

if __name__ == "__main__":
    main()