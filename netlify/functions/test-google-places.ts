/**
 * Test Google Places API Integration
 * Netlify function to validate Google Places API setup
 */

import { Handler } from '@netlify/functions'
import { z } from 'zod'
import { GooglePlacesClient } from '../../lib/google-places'

// Test request schema
const testRequestSchema = z.object({
  query: z.string().default('restaurants in New York'),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
})

export const handler: Handler = async event => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    }
  }

  // Only allow GET and POST
  if (!['GET', 'POST'].includes(event.httpMethod || '')) {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'error',
        error: 'Method not allowed',
      }),
    }
  }

  try {
    // Parse request body for POST or use defaults for GET
    let requestData: {
      query: string
      location: { lat: number; lng: number } | undefined
    } = {
      query: 'restaurants in New York',
      location: undefined,
    }

    if (event.httpMethod === 'POST' && event.body) {
      try {
        const body = JSON.parse(event.body)
        const parsedData = testRequestSchema.parse(body)
        requestData = {
          query: parsedData.query,
          location: parsedData.location,
        }
      } catch (parseError) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            status: 'error',
            error: 'Invalid request format',
            details:
              parseError instanceof z.ZodError
                ? parseError.issues
                : 'JSON parse error',
          }),
        }
      }
    }

    // Check if API key is configured
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          status: 'error',
          error: 'Google Places API key not configured',
          message: 'Please set GOOGLE_PLACES_API_KEY environment variable',
        }),
      }
    }

    // Initialize Google Places client
    const placesClient = new GooglePlacesClient(apiKey)

    // Test API connectivity and search
    console.log('Testing Google Places API with query:', requestData.query)

    const places = await placesClient.searchPlaces({
      query: requestData.query,
      location: requestData.location,
      maxResults: 5,
    })

    // If we have places, test getting details for the first one
    let placeDetails = null
    if (places && places.length > 0 && places[0]) {
      try {
        placeDetails = await placesClient.getPlaceDetails(places[0].placeId)
      } catch (detailsError) {
        console.error('Error getting place details:', detailsError)
        // Don't fail the test if details fail
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'success',
        message: 'Google Places API is working correctly',
        data: {
          query: requestData.query,
          location: requestData.location,
          apiKeyConfigured: !!apiKey,
          apiKeyPrefix: apiKey.substring(0, 10) + '...',
          placesFound: places.length,
          places: places,
          placeDetails: placeDetails,
          timestamp: new Date().toISOString(),
        },
      }),
    }
  } catch (error) {
    console.error('Google Places API test error:', error)

    // Handle specific API errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            status: 'error',
            error: 'Google Places API authentication failed',
            message: 'Invalid or missing API key',
            details: error.message,
          }),
        }
      }

      if (
        error.message.includes('quota') ||
        error.message.includes('billing')
      ) {
        return {
          statusCode: 402,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            status: 'error',
            error: 'Google Places API quota or billing issue',
            message:
              'Please check your Google Cloud billing and quota settings',
            details: error.message,
          }),
        }
      }
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'error',
        error: 'Google Places API test failed',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }),
    }
  }
}
