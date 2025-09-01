/**
 * Simplified Generate Itinerary Function
 * Creates travel itineraries without complex agent imports
 */

import { Handler } from '@netlify/functions'
import { z } from 'zod'

// Request schema
const requestSchema = z.object({
  requirements: z.object({
    originCity: z.string(),
    numberOfAdults: z.number().positive(),
    numberOfChildren: z.number().min(0),
    childrenAges: z
      .array(z.object({ age: z.number(), id: z.string() }))
      .optional(),
    preferredTravelMethods: z.array(z.enum(['drive', 'rail', 'air'])),
    interests: z.array(z.string()),
    destination: z.string(),
    duration: z.string().optional(),
    budget: z.enum(['budget', 'moderate', 'luxury']).optional(),
    pace: z.enum(['relaxed', 'moderate', 'packed']).optional(),
  }),
})

export const handler: Handler = async event => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    // Parse and validate request
    const body = requestSchema.parse(JSON.parse(event.body || '{}'))
    const requirements = body.requirements

    console.log('Generating itinerary for:', requirements)

    // Get API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('API key not configured')
    }

    // Determine persona from interests
    const persona = inferPersona(
      requirements.interests,
      requirements.numberOfChildren > 0
    )

    // Create prompt for itinerary generation
    const prompt = `You are an expert travel concierge creating a personalized 3-day itinerary.

Trip Details:
- Destination: ${requirements.destination}
- Group: ${requirements.numberOfAdults} adults, ${requirements.numberOfChildren} children
- Interests: ${requirements.interests.join(', ')}
- Persona: ${persona}
- Budget: ${requirements.budget || 'moderate'}
- Pace: ${requirements.pace || 'moderate'}

Create a detailed 3-day itinerary with specific recommendations. Return as JSON:

{
  "destination": "${requirements.destination}",
  "duration": "3 days",
  "personaNotes": "Brief note about the persona-driven approach",
  "lodging": [
    {
      "name": "Hotel Name",
      "neighborhood": "Area",
      "description": "Why this fits the persona",
      "priceRange": "$100-150/night"
    }
  ],
  "days": [
    {
      "day": 1,
      "theme": "Day theme",
      "activities": [
        {
          "name": "Activity Name",
          "description": "What makes this special",
          "time": "10:00 AM",
          "location": "Address/Area"
        }
      ],
      "meals": [
        {
          "name": "Restaurant Name", 
          "type": "breakfast/lunch/dinner",
          "cuisine": "Cuisine type",
          "description": "Why recommended",
          "neighborhood": "Area"
        }
      ]
    }
  ]
}`

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${error}`)
    }

    const aiResponse = await response.json()
    const content = aiResponse.content[0].text

    // Parse itinerary from response
    let itinerary
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        itinerary = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No valid JSON found in response')
      }
    } catch (e) {
      console.warn('Failed to parse AI response, using fallback itinerary:', e)
      // Fallback itinerary
      itinerary = createFallbackItinerary(requirements.destination, persona)
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'success',
        data: itinerary,
        metadata: {
          executionTime: Date.now(),
          model: 'claude-3-haiku',
          persona: persona,
        },
      }),
    }
  } catch (error) {
    console.error('Itinerary generation error:', error)

    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          status: 'error',
          error: 'Invalid request',
          details: error.issues || (error as any).errors || error.message,
        }),
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
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    }
  }
}

// Infer persona from interests and group composition
function inferPersona(interests: string[], hasChildren: boolean): string {
  if (hasChildren) {
    return 'family-friendly explorer'
  }

  if (interests.includes('arts') || interests.includes('architecture')) {
    return 'culture enthusiast'
  }

  if (interests.includes('food-dining')) {
    return 'foodie explorer'
  }

  if (
    interests.includes('nature-outdoors') ||
    interests.includes('sports-recreation')
  ) {
    return 'adventure seeker'
  }

  if (interests.includes('history')) {
    return 'history buff'
  }

  return 'curious traveler'
}

// Fallback itinerary for when AI fails
function createFallbackItinerary(destination: string, persona: string) {
  return {
    destination: destination,
    duration: '3 days',
    personaNotes: `Curated for the ${persona} looking for authentic local experiences`,
    lodging: [
      {
        name: 'Local Boutique Hotel',
        neighborhood: 'Downtown',
        description: 'Centrally located with character and charm',
        priceRange: '$120-180/night',
      },
    ],
    days: [
      {
        day: 1,
        theme: 'Arrival and First Impressions',
        activities: [
          {
            name: 'Historic Downtown Walking Tour',
            description: "Get oriented with the city's layout and history",
            time: '2:00 PM',
            location: 'Downtown area',
          },
        ],
        meals: [
          {
            name: 'Welcome Dinner',
            type: 'dinner',
            cuisine: 'Local specialty',
            description: "Start with the city's signature dishes",
            neighborhood: 'Downtown',
          },
        ],
      },
      {
        day: 2,
        theme: 'Deep Dive into Local Culture',
        activities: [
          {
            name: 'Main Attraction Visit',
            description: 'The must-see experience this city is known for',
            time: '10:00 AM',
            location: 'City center',
          },
        ],
        meals: [
          {
            name: 'Local Favorite Lunch',
            type: 'lunch',
            cuisine: 'Regional',
            description: 'Where the locals actually eat',
            neighborhood: 'Local district',
          },
        ],
      },
      {
        day: 3,
        theme: 'Hidden Gems and Departure',
        activities: [
          {
            name: 'Off-the-Beaten-Path Experience',
            description: 'Something special that most tourists miss',
            time: '11:00 AM',
            location: 'Local neighborhood',
          },
        ],
        meals: [
          {
            name: 'Farewell Brunch',
            type: 'brunch',
            cuisine: 'Fusion',
            description: 'Perfect send-off meal',
            neighborhood: 'Trendy area',
          },
        ],
      },
    ],
  }
}
