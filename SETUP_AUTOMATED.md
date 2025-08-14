# Automated AI Restaurant Finder Setup

The AI Restaurant Finder now supports **fully automated restaurant discovery** using Claude API + Google Places validation.

## 🔑 Required API Keys

### 1. Anthropic API Key (for Claude restaurant discovery)
1. Go to https://console.anthropic.com/
2. Create account and get API key
3. Set environment variable:
```bash
export ANTHROPIC_API_KEY="your_anthropic_key_here"
```

### 2. Google Places API Key (for restaurant validation)
1. Follow the existing guide in `GOOGLE_PLACES_SETUP.md`
2. Set environment variable:
```bash
export GOOGLE_PLACES_API_KEY="your_google_key_here"
```

## 🚀 Usage

### Fully Automated (One Command)
```bash
# Set both API keys and run
ANTHROPIC_API_KEY="your_key" GOOGLE_PLACES_API_KEY="your_key" python3 ai_restaurant_finder.py
```

### Fallback Options
If you don't have Anthropic API key, the script falls back to:
1. Loading from `ai_restaurant_results.json` 
2. Using the `convert_ai_text_to_json.py` helper

## 💰 Cost Estimates

Per 25 restaurants discovered and validated:
- **Claude API**: ~$0.075 (very cheap!)
- **Google Places**: ~$1.225 
- **Total**: ~$1.30

## 🎯 Customizing the Prompt

The discovery prompt is easily customizable in the `discover_restaurants_with_ai()` method. You can modify:

- **Target criteria**: James Beard, NY Times, etc.
- **Restaurant types**: Fine dining, ethnic, etc.  
- **Geographic focus**: Specific neighborhoods
- **Price ranges**: Budget to fine dining
- **Cuisine preferences**: Specific ethnic cuisines

Example customizations:
```python
# Focus on specific cuisine
prompt = f"Find 25+ exceptional Italian restaurants in {city}..."

# Focus on specific price range  
prompt = f"Find 25+ budget-friendly gems in {city}..."

# Focus on specific neighborhoods
prompt = f"Find 25+ restaurants in Lawrenceville and Strip District..."
```

## 🔄 Automation Options

### Weekly Updates
```bash
# Add to crontab for weekly updates
0 9 * * 1 cd /path/to/cardinal && /path/to/script.sh
```

### Multi-City Discovery
Easy to extend for multiple cities:
```python
cities = [("Pittsburgh", "PA"), ("Philadelphia", "PA"), ("New York", "NY")]
for city, state in cities:
    finder = AIRestaurantFinder(city, state)
    # ... run discovery
```

The automated approach combines the best of both worlds: **Claude's intelligent curation** + **Google Places real-time verification**!