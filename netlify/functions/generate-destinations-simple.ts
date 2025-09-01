/**
 * Simplified Generate Destinations Function
 * Creates destination recommendations without complex agent imports
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
    travelDurationLimits: z.record(z.string(), z.number()).optional(),
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

    console.log('Generating destinations for:', requirements)

    // Get API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('API key not configured')
    }

    // Create prompt for destination generation
    const prompt = `You are a travel expert recommending destinations for a trip.

Requirements:
- Origin: ${requirements.originCity}
- Group: ${requirements.numberOfAdults} adults, ${requirements.numberOfChildren} children
- Travel methods: ${requirements.preferredTravelMethods.join(', ')}
- Interests: ${requirements.interests.join(', ')}

Generate 3-5 destination recommendations within reasonable travel distance. Return as JSON:

{
  "destinations": [
    {
      "city": "City Name",
      "state": "State",
      "vibe": "Brief description of the city's character",
      "rationale": "Why this destination fits their interests",
      "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
      "perfectFor": ["Interest 1", "Interest 2"],
      "distance": {
        "miles": 150,
        "driveTime": "2.5 hours"
      }
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
        max_tokens: 2000,
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

    // Parse destinations from response
    let destinations
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        destinations = parsed.destinations || []
      } else {
        throw new Error('No valid JSON found in response')
      }
    } catch (e) {
      console.warn(
        'Failed to parse AI response, using fallback destinations:',
        e
      )
      // Fallback destinations based on origin city
      destinations = createFallbackDestinations(requirements.originCity)
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'success',
        data: { destinations },
        metadata: {
          executionTime: Date.now(),
          model: 'claude-3-haiku',
        },
      }),
    }
  } catch (error) {
    console.error('Destination generation error:', error)

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

// Fallback destinations for when AI fails
function createFallbackDestinations(_originCity: string) {
  const fallbacks = [
    {
      city: 'Portland',
      state: 'Oregon',
      vibe: 'Creative, foodie haven with outdoor access',
      rationale: 'Perfect for arts, food, and outdoor enthusiasts',
      highlights: ['Food truck scene', "Powell's Books", 'Mount Hood nearby'],
      perfectFor: ['Arts', 'Food & Dining', 'Nature'],
      distance: { miles: 200, driveTime: '3 hours' },
    },
    {
      city: 'Asheville',
      state: 'North Carolina',
      vibe: 'Mountain town with arts and craft beer',
      rationale: 'Great blend of nature, arts, and local culture',
      highlights: [
        'Blue Ridge Mountains',
        'Craft breweries',
        'Local art scene',
      ],
      perfectFor: ['Nature', 'Arts', 'Music'],
      distance: { miles: 180, driveTime: '2.5 hours' },
    },
    {
      city: 'Charleston',
      state: 'South Carolina',
      vibe: 'Historic charm with incredible cuisine',
      rationale: 'Rich history, amazing food scene, and beautiful architecture',
      highlights: ['Historic district', 'Lowcountry cuisine', 'Rainbow Row'],
      perfectFor: ['History', 'Food & Dining', 'Architecture'],
      distance: { miles: 220, driveTime: '3.5 hours' },
    },
  ]

  return fallbacks
}
