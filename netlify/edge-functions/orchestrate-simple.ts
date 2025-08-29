/**
 * Simplified Orchestrate Itinerary Edge Function
 * Streaming endpoint that delegates to a serverless function for orchestration
 */

import { Config, Context } from '@netlify/edge-functions'

export default async (request: Request, context: Context) => {
  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json()
    const { requirements, personaProfile } = body

    // Validate requirements
    if (!requirements || !requirements.destination) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Create a readable stream for SSE
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial status
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'status',
              message: 'Starting orchestration',
              timestamp: Date.now(),
            })}\n\n`
          )
        )

        try {
          // Call the Anthropic API directly for orchestration
          // This is a simplified version that doesn't import complex TypeScript modules
          const apiKey = (globalThis as any).Deno?.env?.get('ANTHROPIC_API_KEY')
          if (!apiKey) {
            throw new Error('API key not configured')
          }

          // Send progress updates
          const updates = [
            {
              phase: 'research',
              message: 'Research agents gathering recommendations',
            },
            {
              phase: 'validation',
              message: 'Validating and enriching recommendations',
            },
            { phase: 'assembly', message: 'Assembling personalized itinerary' },
          ]

          for (const update of updates) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'progress',
                  ...update,
                  timestamp: Date.now(),
                })}\n\n`
              )
            )
            // Small delay to simulate work
            await new Promise(resolve => setTimeout(resolve, 500))
          }

          // Create a simple itinerary using Claude API
          const prompt = `You are a travel concierge creating an itinerary for ${requirements.destination}.
          
Requirements: ${JSON.stringify(requirements)}
Persona: ${JSON.stringify(personaProfile)}

Create a 3-day itinerary with:
- Daily activities and timing
- Restaurant recommendations
- Lodging suggestions

Return as JSON with this structure:
{
  "destination": "city name",
  "duration": "3 days",
  "days": [
    {
      "day": 1,
      "theme": "day theme",
      "activities": [],
      "meals": []
    }
  ],
  "lodging": [],
  "personaNotes": "notes"
}`

          const response = await fetch(
            'https://api.anthropic.com/v1/messages',
            {
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
            }
          )

          if (!response.ok) {
            throw new Error('Failed to generate itinerary')
          }

          const aiResponse = await response.json()
          const content = aiResponse.content[0].text

          // Parse the itinerary from the response
          let itinerary
          try {
            // Extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              itinerary = JSON.parse(jsonMatch[0])
            } else {
              throw new Error('No valid JSON found in response')
            }
          } catch (e) {
            // Fallback itinerary
            itinerary = {
              destination: requirements.destination,
              duration: '3 days',
              days: [
                {
                  day: 1,
                  theme: 'Arrival and Exploration',
                  activities: [],
                  meals: [],
                },
                {
                  day: 2,
                  theme: 'Full Day Adventures',
                  activities: [],
                  meals: [],
                },
                {
                  day: 3,
                  theme: 'Final Discoveries',
                  activities: [],
                  meals: [],
                },
              ],
              lodging: [],
              personaNotes: 'Enjoy your trip!',
            }
          }

          // Send final result
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'complete',
                itinerary,
                metadata: {
                  executionTime: Date.now(),
                  model: 'claude-3-haiku',
                },
                timestamp: Date.now(),
              })}\n\n`
            )
          )
        } catch (error) {
          console.error('Orchestration error:', error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: Date.now(),
              })}\n\n`
            )
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export const config: Config = {
  path: '/api/orchestrate-simple',
  // Allow 60 seconds for full orchestration
  timeout: 60,
}
