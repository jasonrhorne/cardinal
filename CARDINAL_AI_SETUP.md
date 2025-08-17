# Cardinal AI Setup Guide

## Quick Start

Cardinal can work with or without AI. Without an API key, it uses intelligent mock data. With an API key, it generates truly personalized recommendations.

## Setting Up AI (OpenAI)

### 1. Get an OpenAI API Key
- Go to https://platform.openai.com/api-keys
- Create a new API key
- Copy the key (starts with `sk-`)

### 2. Add to Netlify Environment Variables
- Go to your Netlify dashboard
- Navigate to Site Settings → Environment Variables
- Add new variable:
  - Key: `OPENAI_API_KEY`
  - Value: Your OpenAI API key
- Deploy/redeploy your site

### 3. Test the AI Features
- Visit `/cardinal-ai.html` on your deployed site
- Fill in the form and click "Get AI Destination Recommendations"
- The system will now generate personalized recommendations

## How It Works

### Without API Key (Default)
- Returns intelligent mock data based on origin and interests
- Good for testing and development
- No API costs

### With API Key
- **Destination Recommendations**: 
  - Analyzes origin, travelers, and interests
  - Returns 4-5 weekend destinations within appropriate distance
  - Explains why each destination matches your criteria
  
- **Detailed Itineraries**:
  - Runs 4 parallel AI prompts for different aspects:
    - Lodging recommendations
    - Dining guide
    - Day-by-day activities
    - Insider tips
  - Combines into comprehensive weekend plan

## API Costs

Approximate costs per use with GPT-4:
- Destination recommendations: ~$0.05-0.10
- Detailed itinerary: ~$0.10-0.15
- Total per complete session: ~$0.15-0.25

## Customizing the AI Prompts

Edit `netlify/functions/recommendations-ai.js` to customize:
- Destination selection criteria
- Itinerary detail level
- Interest categories
- Distance/time constraints

## Testing Locally

1. Create `.env` file:
```
OPENAI_API_KEY=your-key-here
```

2. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

3. Run locally:
```bash
netlify dev
```

4. Visit http://localhost:8888/cardinal-ai.html

## Troubleshooting

- **"No API key found" message**: Check environment variable in Netlify
- **Slow responses**: AI generation takes 5-10 seconds, this is normal
- **Generic responses**: Make sure you're using GPT-4, not GPT-3.5
- **Rate limits**: OpenAI has rate limits, consider caching for production

## Future Enhancements

- Add caching to reduce API calls
- Store generated itineraries for sharing
- Add more AI providers (Anthropic Claude, Google Gemini)
- Fine-tune prompts based on user feedback
- Add budget preferences to recommendations