/**
 * Generate Destination Suggestions
 * Netlify function to generate travel destination recommendations
 */

import { Handler } from '@netlify/functions'
import { z } from 'zod'
import { DestinationAgent } from '../../lib/agents/destination-agent'
import type {
  TTravelRequirements,
  AgentContext,
  PersonaProfile,
  TravelConstraints,
} from '../../lib/agents/types'

// Request schema
const requestSchema = z.object({
  requirements: z.object({
    originCity: z.string(),
    numberOfAdults: z.number().positive(),
    numberOfChildren: z.number().min(0),
    childrenAges: z.array(z.object({ age: z.number(), id: z.string() })),
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
    const requirements = body.requirements as TTravelRequirements

    // Create destination agent
    const destinationAgent = new DestinationAgent()

    // Build context for agent
    const context = buildContext(requirements)

    // Execute destination discovery
    const response = await destinationAgent.execute(
      {
        taskId: `dest_${Date.now()}`,
        agentType: 'destination' as any,
        priority: 'high',
        description: 'Discover travel destinations based on requirements',
        constraints: [],
        expectedOutput: '3-7 destination recommendations',
      },
      context
    )

    if (response.status === 'success' && response.data) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          status: 'success',
          data: response.data,
          metadata: {
            executionTime: response.executionTime,
            confidence: response.confidence,
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
        error: 'Failed to generate destinations',
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
      }),
    }
  }
}

function buildContext(requirements: TTravelRequirements): AgentContext {
  // Infer persona from requirements
  const persona = inferPersona(requirements)

  // Extract constraints
  const constraints = extractConstraints(requirements)

  return {
    userRequirements: requirements,
    destinationCity: '', // Not yet selected
    personaProfile: persona,
    constraints,
    previousFindings: new Map(),
  }
}

function inferPersona(requirements: TTravelRequirements): PersonaProfile {
  const interests = requirements.interests || []
  const hasKids = requirements.numberOfChildren > 0

  let primary: PersonaProfile['primary'] = 'balanced'

  if (hasKids) {
    primary = 'family'
  } else if (interests.includes('arts')) {
    primary = 'photographer'
  } else if (interests.includes('food-dining')) {
    primary = 'foodie'
  } else if (
    interests.includes('nature-outdoors') ||
    interests.includes('sports-recreation')
  ) {
    primary = 'adventurer'
  } else if (interests.includes('history')) {
    primary = 'culture'
  }

  const profile: PersonaProfile = {
    primary,
    interests: interests.length > 0 ? interests : ['exploration'],
    travelStyle: 'balanced',
    activityLevel: 'moderate',
  }

  if (hasKids) {
    profile.specialContext = `Traveling with ${requirements.numberOfChildren} children`
  }

  return profile
}

function extractConstraints(
  _requirements: TTravelRequirements
): TravelConstraints {
  const constraints: TravelConstraints = {}

  // Add any constraints from requirements
  // These would be expanded based on actual requirements

  return constraints
}
