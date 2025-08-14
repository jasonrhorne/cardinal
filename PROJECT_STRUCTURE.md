# Cardinal Project Structure

## 🚀 CURRENT SYSTEM (AI-Powered)

### Core Files
- `restaurant_web_server.py` - Flask web server that powers the system
- `ai_restaurant_finder.py` - AI restaurant discovery using Claude + Google Places
- `restaurant_finder_90s.html` - Authentic 90s web interface
- `requirements.txt` - Python dependencies

### Documentation  
- `README.md` - Main project documentation
- `SETUP_AUTOMATED.md` - API setup and usage guide
- `GOOGLE_PLACES_SETUP.md` - Google Places API configuration

### Data
- `ai_restaurant_results.json` - Current Pittsburgh restaurant data
- `pittsburgh_restaurants_ai_validated.csv` - CSV export of validated results

## 📁 ORGANIZED FOLDERS

### `/legacy-scraper/`
Old web scraping approach (no longer used):
- `enhanced_restaurant_scraper.py` - Legacy web scraper
- `debug_sources.py` - Scraper debugging tools
- `demo_verification.py` - Scraper testing utilities  
- `pittsburgh_restaurants_enhanced.csv` - Old scraper results

### `/archive/`
Helper files and research materials:
- `convert_ai_text_to_json.py` - Text-to-JSON converter utility
- `ai_restaurant_results_template.json` - JSON structure template
- `2025-08-13-RestaurantPrompt.md` - Original Claude research prompt

## 🎯 TO RUN THE CURRENT SYSTEM

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start the web server (with your API keys)
ANTHROPIC_API_KEY="your_key" GOOGLE_PLACES_API_KEY="your_key" python3 restaurant_web_server.py

# 3. Visit the 90s interface
open http://localhost:8000
```

---

**The current system is completely AI-powered and no longer uses web scraping.** All files in `/legacy-scraper/` are preserved for reference but not needed for operation.