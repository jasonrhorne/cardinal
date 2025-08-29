/**
 * Orchestrate Itinerary Edge Function
 * Streaming endpoint for multi-agent itinerary generation
 */

import { Config, Context } from '@netlify/edge-functions'
import { orchestrator } from '../../lib/agents/index.ts'
import type {
  TTravelRequirements,
  PersonaProfile,
} from '../../lib/agents/types.ts'

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
          // Start orchestration
          const result = await orchestrator.generateItinerary(
            requirements as TTravelRequirements,
            personaProfile as PersonaProfile
          )

          // Send progress updates (simulated for now)
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

          // Send final result
          if (result.success) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'complete',
                  itinerary: result.itinerary,
                  metadata: {
                    executionTime: result.totalExecutionTime,
                    recommendationCount: Array.from(
                      result.rawResearch?.values() || []
                    ).reduce(
                      (sum, r) => sum + (r.recommendations?.length || 0),
                      0
                    ),
                    validationCount: result.validationReport?.length || 0,
                    confidence:
                      Array.from(result.rawResearch?.values() || []).reduce(
                        (sum, r) => sum + r.confidence,
                        0
                      ) / (result.rawResearch?.size || 1),
                  },
                  timestamp: Date.now(),
                })}\n\n`
              )
            )
          } else {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'error',
                  error: 'Failed to generate itinerary',
                  timestamp: Date.now(),
                })}\n\n`
              )
            )
          }
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
  path: '/api/orchestrate',
  // Allow 60 seconds for full orchestration
  timeout: 60,
}
