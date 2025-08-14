#!/usr/bin/env python3
"""
Flask web server for the 90s AI Restaurant Finder
Connects the authentic 90s frontend to the AI restaurant discovery backend
"""

from flask import Flask, request, jsonify, render_template_string
import os
import logging
from ai_restaurant_finder import AIRestaurantFinder

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route('/')
def index():
    """Serve the 90s restaurant finder page"""
    try:
        with open('/Users/jason/Projects/cardinal/restaurant_finder_90s.html', 'r') as f:
            html_content = f.read()
        return html_content
    except FileNotFoundError:
        return "HTML file not found!", 404

@app.route('/api/discover', methods=['POST'])
def discover_restaurants():
    """API endpoint to discover restaurants using AI"""
    try:
        # Get city and state from request
        data = request.get_json()
        city = data.get('city', '').strip()
        state = data.get('state', '').strip()
        
        if not city or not state:
            return jsonify({
                'success': False,
                'error': 'Please provide both city and state!'
            }), 400
        
        logger.info(f"Discovering restaurants for {city}, {state}")
        
        # Initialize the AI restaurant finder
        finder = AIRestaurantFinder(city, state)
        
        # Check for API keys
        anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
        google_places_key = os.getenv('GOOGLE_PLACES_API_KEY')
        
        restaurants = []
        
        # Try Claude API discovery first
        if anthropic_api_key:
            logger.info("Using Claude API for restaurant discovery")
            restaurants = finder.discover_restaurants_with_ai(anthropic_api_key)
        
        # Fallback to file-based results if Claude API fails
        if not restaurants:
            logger.info("Falling back to file-based restaurant data")
            ai_results_file = "/Users/jason/Projects/cardinal/ai_restaurant_results.json"
            if os.path.exists(ai_results_file):
                restaurants = finder.load_ai_results_from_file(ai_results_file)
        
        if not restaurants:
            return jsonify({
                'success': False,
                'error': 'No restaurant data available. Please check API keys or provide a JSON file.'
            }), 500
        
        # Validate with Google Places if API key available
        if google_places_key:
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
        
        return jsonify({
            'success': True,
            'restaurants': formatted_restaurants,
            'count': len(formatted_restaurants),
            'city': city,
            'state': state
        })
        
    except Exception as e:
        logger.error(f"Error discovering restaurants: {e}")
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'anthropic_api': 'available' if os.getenv('ANTHROPIC_API_KEY') else 'missing',
        'google_places_api': 'available' if os.getenv('GOOGLE_PLACES_API_KEY') else 'missing'
    })

if __name__ == '__main__':
    print("🍕 Starting AI Restaurant Finder Web Server 🍕")
    print("=" * 50)
    
    # Check API keys
    anthropic_key = os.getenv('ANTHROPIC_API_KEY')
    google_key = os.getenv('GOOGLE_PLACES_API_KEY')
    
    print(f"Anthropic API Key: {'✅ Available' if anthropic_key else '❌ Missing'}")
    print(f"Google Places API Key: {'✅ Available' if google_key else '❌ Missing'}")
    
    if not anthropic_key and not google_key:
        print("\n⚠️  Warning: No API keys found!")
        print("Set ANTHROPIC_API_KEY and/or GOOGLE_PLACES_API_KEY environment variables")
        print("The server will use fallback data if available.")
    
    print(f"\n🌐 Server starting at: http://localhost:8000")
    print("📄 90s Frontend available at: http://localhost:8000")
    print("🔍 API endpoint: http://localhost:8000/api/discover")
    print("💚 Health check: http://localhost:8000/health")
    
    app.run(debug=True, host='0.0.0.0', port=8000)