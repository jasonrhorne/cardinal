# Google Places API Setup Guide

To use the restaurant verification feature, you'll need a Google Places API key.

## Steps to Get Your API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project** (or select existing)
   - Click "Select a project" → "New Project"
   - Give it a name like "Restaurant Scraper"
   - Click "Create"

3. **Enable the Places API**
   - In the sidebar, go to "APIs & Services" → "Library"
   - Search for "Places API"
   - Click on it and click "Enable"

4. **Create API Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your API key (keep it secure!)

5. **Restrict Your API Key** (Recommended)
   - Click on your API key in the credentials list
   - Under "API restrictions", select "Restrict key"
   - Choose "Places API" from the list
   - Save your changes

## Using Your API Key

### Option 1: Environment Variable (Recommended)
```bash
export GOOGLE_PLACES_API_KEY="your_api_key_here"
python3 enhanced_restaurant_scraper.py
```

### Option 2: Direct Parameter
```python
scraper = EnhancedRestaurantScraper("Pittsburgh", "PA")
restaurants = scraper.scrape_all()
verified_restaurants = scraper.verify_restaurants_with_google_places("your_api_key_here")
```

## API Costs

Google Places API pricing (as of 2024):
- **Places Search**: $32 per 1,000 requests
- **Place Details**: $17 per 1,000 requests

For our verification, each restaurant requires:
- 1 Places Search request
- 1 Place Details request
- **Total: ~$0.049 per restaurant verified**

### Cost Examples:
- 10 restaurants: ~$0.49
- 50 restaurants: ~$2.45
- 100 restaurants: ~$4.90

## Free Tier
Google provides $200 in free credits monthly, which covers:
- ~4,000 restaurant verifications per month
- Perfect for personal use and testing

## What the Verification Provides

For each restaurant, you'll get:
- ✅ **Current Status**: Open/Closed/Permanently Closed
- ⭐ **Google Rating**: Current rating and review count
- 🕒 **Hours**: Current operating hours
- 📍 **Verified Address**: Exact Google Maps address
- 💰 **Price Level**: $ to $$$$ pricing indicator
- 🏷️ **Categories**: Restaurant types from Google
- 📅 **Last Verified**: Timestamp of verification

## Running Without API Key

The scraper works fine without Google Places verification - you'll just get the scraped restaurant data without the additional verification fields.

To skip verification, simply don't set the API key environment variable.