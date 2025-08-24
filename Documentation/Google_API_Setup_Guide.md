# Google Maps API Setup Guide

## Overview

This guide walks through setting up Google Maps APIs for the Cardinal travel itinerary app. The integration requires multiple Google APIs and proper billing configuration.

## Prerequisites

- Google Cloud Console access
- Billing account setup
- Domain/URL for API key restrictions

## Required APIs

### 1. Maps JavaScript API

**Purpose**: Client-side map rendering and interaction  
**Used in**: Frontend components, place selection  
**Pricing**: $7 per 1,000 loads

### 2. Places API (New)

**Purpose**: Place search, details, and photos  
**Used in**: Destination discovery, place enrichment  
**Pricing**: $17 per 1,000 requests (Basic Data)

### 3. Routes API

**Purpose**: Travel time calculations and route optimization  
**Used in**: Itinerary time estimation, travel planning  
**Pricing**: $5 per 1,000 requests

## Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project"
3. Name: `cardinal-travel-app`
4. Note the Project ID for later use

### Step 2: Enable Billing

1. Navigate to "Billing" in the Cloud Console
2. Link a billing account to your project
3. Set up budget alerts (recommended: $50/month initially)

### Step 3: Enable Required APIs

Navigate to "APIs & Services" → "Library" and enable:

1. **Maps JavaScript API**
   - Search for "Maps JavaScript API"
   - Click "Enable"

2. **Places API (New)**
   - Search for "Places API (New)"
   - Click "Enable"
   - ⚠️ Make sure it's the "New" version, not the legacy one

3. **Routes API**
   - Search for "Routes API"
   - Click "Enable"

### Step 4: Create API Keys

#### Client-Side Key (Maps JavaScript API)

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Name: `Cardinal Client Key`
4. Click "Restrict Key"
5. Under "Application restrictions":
   - Select "HTTP referrers (websites)"
   - Add: `localhost:3000/*`, `localhost:8888/*`
   - Add your production domain: `yourdomain.com/*`
6. Under "API restrictions":
   - Select "Restrict key"
   - Choose: "Maps JavaScript API"
7. Save the key

#### Server-Side Key (Places & Routes APIs)

1. Click "Create Credentials" → "API Key"
2. Name: `Cardinal Server Key`
3. Click "Restrict Key"
4. Under "Application restrictions":
   - Select "IP addresses"
   - Add your server IPs (or leave unrestricted for development)
5. Under "API restrictions":
   - Select "Restrict key"
   - Choose: "Places API (New)" and "Routes API"
6. Save the key

### Step 5: Configure Environment Variables

Update your `.env.local` file:

```bash
# Replace these with your actual API keys
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...your-client-key
GOOGLE_PLACES_API_KEY=AIza...your-server-key

# Optional: Configure regions and language
GOOGLE_MAPS_REGION=US
GOOGLE_MAPS_LANGUAGE=en
```

### Step 6: Test the Integration

1. Start the development server:

   ```bash
   npx netlify dev
   ```

2. Test the API endpoint:

   ```bash
   curl http://localhost:8888/.netlify/functions/test-google-places
   ```

3. Expected response:
   ```json
   {
     "status": "success",
     "message": "Google Places API is working correctly",
     "data": {
       "placesFound": 5,
       "places": [...]
     }
   }
   ```

## Security Best Practices

### API Key Restrictions

✅ **Client Key**: Restrict to your domains only  
✅ **Server Key**: Restrict to server IPs  
✅ **API Scope**: Limit each key to required APIs only

### Environment Variables

✅ Never commit API keys to git  
✅ Use different keys for dev/staging/production  
✅ Rotate keys regularly (quarterly)

### Rate Limiting

✅ Implement client-side request throttling  
✅ Add server-side rate limiting middleware  
✅ Monitor usage in Google Cloud Console

## Billing & Monitoring

### Set Up Quotas

1. Go to "APIs & Services" → "Quotas"
2. Set daily limits for each API:
   - Maps JavaScript API: 1,000 loads/day (dev)
   - Places API: 1,000 requests/day (dev)
   - Routes API: 500 requests/day (dev)

### Usage Monitoring

1. Set up billing alerts at $10, $25, $50
2. Monitor usage in "APIs & Services" → "Dashboard"
3. Review monthly invoices for optimization opportunities

### Cost Optimization Tips

- Cache place details to avoid repeated lookups
- Use photo references instead of downloading images
- Implement search result caching
- Batch route calculations where possible

## Troubleshooting

### Common Errors

#### "API key not valid"

- Check if the API is enabled for your project
- Verify key restrictions match your domain/IP
- Ensure you're using the correct key (client vs server)

#### "This API key is not authorized"

- Check API restrictions on the key
- Verify the referrer/IP restrictions
- Make sure billing is enabled

#### "Quota exceeded"

- Check usage in Google Cloud Console
- Increase quotas if needed
- Review rate limiting implementation

### Development Testing

```bash
# Test without location bias
curl -X POST http://localhost:8888/.netlify/functions/test-google-places \
  -H "Content-Type: application/json" \
  -d '{"query": "pizza restaurants"}'

# Test with location
curl -X POST http://localhost:8888/.netlify/functions/test-google-places \
  -H "Content-Type: application/json" \
  -d '{
    "query": "museums",
    "location": {"lat": 40.7128, "lng": -74.0060}
  }'
```

## Production Deployment

### Netlify Environment Variables

1. Go to your Netlify site dashboard
2. Navigate to "Site settings" → "Environment variables"
3. Add:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-client-key
   GOOGLE_PLACES_API_KEY=your-server-key
   ```

### Update API Key Restrictions

1. Add your production domain to client key restrictions
2. Add Netlify function IPs to server key restrictions
3. Test thoroughly in staging environment

### Monitoring

- Set up Google Cloud alerting
- Monitor Netlify function logs
- Track API usage costs monthly

## Support

### Google Cloud Support

- [Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Places API (New) Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Routes API Documentation](https://developers.google.com/maps/documentation/routes)

### Cardinal Project Support

- Check `netlify/functions/test-google-places.ts` for example usage
- Review `lib/google-*.ts` files for implementation patterns
- See `Documentation/F013_Google_Maps_Setup_Summary.md` for technical details

---

**Last Updated**: August 23, 2025  
**Next Review**: Before production deployment
