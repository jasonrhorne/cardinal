# Cardinal

An AI-powered restaurant discovery system that uses Claude AI to find exceptional dining experiences across US cities, validated with real-time Google Places data.

## Overview

Cardinal leverages artificial intelligence to discover outstanding restaurants in any US city. The system uses Claude AI to identify restaurants based on prestigious awards, innovation, chef pedigree, and cultural relevance, then validates each recommendation with Google Places API for current business status, hours, and ratings.

## Features

- **🤖 AI-Powered Discovery**: Claude AI finds 25+ exceptional restaurants per city based on culinary awards, innovation, and cultural significance
- **📍 Google Places Validation**: Real-time verification of business status, hours, ratings, and location data
- **🌐 90s Web Interface**: Authentic retro web interface with period-appropriate design and animations
- **💰 Cost-Effective**: ~$0.50 per comprehensive restaurant search
- **🔄 Multi-City Support**: Easy configuration for any US city and state
- **📊 Structured Data Export**: CSV output with detailed restaurant information and validation metrics

## How It Works

1. **AI Discovery**: Claude AI analyzes the culinary landscape of your target city to identify exceptional restaurants based on:
   - James Beard Awards and nominations
   - NY Times restaurant features
   - Michelin Guide recognition
   - Food & Wine accolades
   - Local press coverage and innovation

2. **Google Places Validation**: Each AI-discovered restaurant is verified through Google Places API for:
   - Current business status (open/closed permanently)
   - Operating hours and contact information
   - Customer ratings and review counts
   - Accurate location data

3. **90s Web Interface**: Results are displayed through an authentic 1990s-style web interface featuring:
   - HTML 3.2 table-based layouts
   - BLINK tags and retro animations
   - Period-appropriate color schemes and fonts
   - Animated loading screens with spinning GIFs

## Usage

### Quick Start (Web Interface)

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set API Keys**:
   ```bash
   export ANTHROPIC_API_KEY="your_anthropic_key"
   export GOOGLE_PLACES_API_KEY="your_google_places_key"
   ```

3. **Start Web Server**:
   ```bash
   python3 restaurant_web_server.py
   ```

4. **Access Interface**: Visit http://localhost:8000 and enjoy the 90s web experience!

### Command Line Usage

```bash
# Direct API discovery
ANTHROPIC_API_KEY="your_key" GOOGLE_PLACES_API_KEY="your_key" python3 ai_restaurant_finder.py
```

## API Keys Setup

### Anthropic API Key (Required for AI Discovery)
1. Visit https://console.anthropic.com/
2. Create account and generate API key
3. Set environment variable: `ANTHROPIC_API_KEY="your_key"`

### Google Places API Key (Optional but Recommended)
1. Visit Google Cloud Console
2. Enable Places API
3. Generate API key
4. Set environment variable: `GOOGLE_PLACES_API_KEY="your_key"`

## Cost Breakdown

**Per 25-restaurant search:**
- Claude API: ~$0.075
- Google Places API: ~$0.43
- **Total: ~$0.50**

## Example Results

For Pittsburgh, PA, the system discovered exceptional restaurants including:
- **Fet-Fisk**: Nordic-Appalachian fusion, NY Times 50 Best 2024, James Beard semifinalist
- **Apteka**: Vegan Eastern European, James Beard nominations 2022-2024
- **Stuntpig**: Pop-up turned permanent, everything made in-house
- **Chengdu Gourmet**: Authentic Sichuan, 2025 James Beard semifinalist

## Technology Stack

- **AI Engine**: Claude 3.5 Sonnet via Anthropic API
- **Validation**: Google Places API
- **Backend**: Flask web server
- **Frontend**: Authentic HTML 3.2 with JavaScript
- **Data Processing**: Python with structured JSON/CSV output

## Customization

The AI discovery prompt is easily customizable for different focus areas:
- Specific cuisines (Italian, Asian, etc.)
- Price ranges (budget-friendly, fine dining)
- Neighborhoods or districts
- Award types (James Beard, Michelin, etc.)

## Files

- `restaurant_web_server.py`: Flask web server connecting frontend to AI backend
- `ai_restaurant_finder.py`: Core AI discovery and validation logic
- `restaurant_finder_90s.html`: Authentic 90s web interface
- `requirements.txt`: Python dependencies
- `SETUP_AUTOMATED.md`: Detailed setup instructions