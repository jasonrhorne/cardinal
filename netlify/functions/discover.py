import json
import os
import sys
import logging

# Add the parent directory to the path so we can import our modules
sys.path.append('/opt/build/repo')

try:
    from ai_restaurant_finder import AIRestaurantFinder
except ImportError:
    # Fallback for local testing
    import sys
    sys.path.append('../../')
    from ai_restaurant_finder import AIRestaurantFinder

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def handler(event, context):
    """
    Netlify Function to discover restaurants using AI
    """
    try:
        # Handle CORS preflight
        if event['httpMethod'] == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                'body': ''
            }
        
        # Parse the request
        if event['httpMethod'] != 'POST':
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                'body': json.dumps({'success': False, 'error': 'Method not allowed'})
            }
        
        # Parse request body
        body = json.loads(event['body'])
        city = body.get('city', '').strip()
        state = body.get('state', '').strip()
        
        if not city or not state:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': False,
                    'error': 'Please provide both city and state!'
                })
            }
        
        logger.info(f"Discovering restaurants for {city}, {state}")
        
        # Initialize the AI restaurant finder
        finder = AIRestaurantFinder(city, state)
        
        # Check for API keys
        anthropic_api_key = os.environ.get('ANTHROPIC_API_KEY')
        google_places_key = os.environ.get('GOOGLE_PLACES_API_KEY')
        
        restaurants = []
        
        # Try Claude API discovery first
        if anthropic_api_key:
            logger.info("Using Claude API for restaurant discovery")
            restaurants = finder.discover_restaurants_with_ai(anthropic_api_key)
        
        # Fallback to file-based results if Claude API fails
        if not restaurants:
            logger.info("Falling back to file-based restaurant data")
            # For Netlify, we'll include a fallback dataset
            fallback_data = [
                {
                    "name": "Fet-Fisk",
                    "cuisine_type": "Nordic-Appalachian",
                    "neighborhood": "Bloomfield",
                    "price_range": "Fine Dining",
                    "description": "NY Times 50 Best 2024! James Beard semifinalist chef serving innovative Nordic-Appalachian fusion cuisine.",
                    "google_rating": 4.8
                },
                {
                    "name": "Apteka",
                    "cuisine_type": "Eastern European",
                    "neighborhood": "Bloomfield",
                    "price_range": "Fine Dining",
                    "description": "Vegan Eastern European cuisine. James Beard nominations 2022-2024.",
                    "google_rating": 4.7
                },
                {
                    "name": "Stuntpig", 
                    "cuisine_type": "American",
                    "neighborhood": "Squirrel Hill",
                    "price_range": "Mid-range",
                    "description": "Pop-up turned permanent. Everything made in-house including bread.",
                    "google_rating": 4.9
                }
            ]
            restaurants = fallback_data
        
        # Validate with Google Places if API key available
        if google_places_key and restaurants:
            logger.info("Validating restaurants with Google Places API")
            restaurants = finder.validate_with_google_places(restaurants, google_places_key)
        
        # Format restaurants for the 90s frontend
        formatted_restaurants = []
        for restaurant in restaurants:
            formatted_restaurants.append({
                'name': restaurant.get('name', 'Unknown'),
                'cuisine': restaurant.get('cuisine_type', 'Unknown'),
                'neighborhood': restaurant.get('neighborhood', 'Unknown'),
                'price': restaurant.get('price_range', 'Unknown'),
                'rating': f"{restaurant.get('google_rating', 'N/A')}/5.0" if restaurant.get('google_rating') else 'N/A',
                'description': restaurant.get('description', 'No description available')[:100] + '...' if len(restaurant.get('description', '')) > 100 else restaurant.get('description', 'No description available')
            })
        
        logger.info(f"Successfully found {len(formatted_restaurants)} restaurants")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'success': True,
                'restaurants': formatted_restaurants,
                'count': len(formatted_restaurants),
                'city': city,
                'state': state
            })
        }
        
    except Exception as e:
        logger.error(f"Error discovering restaurants: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': f'Server error: {str(e)}'
            })
        }