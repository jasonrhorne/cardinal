/**
 * Generate Itinerary
 * Netlify function to generate a travel itinerary for a selected destination
 */

import { Handler } from '@netlify/functions'
import { z } from 'zod'
import { AgentOrchestrator } from '../../lib/agents/orchestrator'

// Request schema
const requestSchema = z.object({
  requirements: z.object({
    originCity: z.string(),
    numberOfAdults: z.number().positive(),
    numberOfChildren: z.number().min(0),
    childrenAges: z.array(z.object({ age: z.number(), id: z.string() })),
    preferredTravelMethods: z.array(z.enum(['drive', 'rail', 'air'])),
    interests: z.array(z.string()),
    destination: z.string(), // Selected destination
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

    // Create orchestrator
    const orchestrator = new AgentOrchestrator()

    // Generate itinerary for the selected destination
    const result = await orchestrator.generateItinerary(requirements as any)

    if (result.success && result.itinerary) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          status: 'success',
          data: result.itinerary,
          metadata: {
            executionTime: result.totalExecutionTime,
            costs: result.costs,
          },
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
        error: 'Failed to generate itinerary',
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
      }),
    }
  }
}
