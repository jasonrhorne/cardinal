/**
 * Analytics Events API Endpoint
 * Handles experiment tracking data storage and retrieval
 */

import { Handler } from '@netlify/functions'
import { z } from 'zod'

// Event schema for validation
const eventSchema = z.object({
  id: z.string(),
  timestamp: z.string().transform(str => new Date(str)),
  sessionId: z.string(),
  userId: z.string().optional(),
  eventType: z.enum([
    'method_selected',
    'method_started',
    'method_abandoned',
    'method_completed',
    'requirements_generated',
    'error_occurred',
  ]),
  inputMethod: z.enum([
    'constrained-form',
    'open-text',
    'guided-prompts',
    'conversational',
  ]),
  metadata: z.record(z.string(), z.any()),
})

// In production, this would use a database
// For now, we'll use in-memory storage (will reset on function cold starts)
let eventsStorage: Array<z.infer<typeof eventSchema>> = []

export const handler: Handler = async event => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
    }
  }

  try {
    if (event.httpMethod === 'POST') {
      // Store new analytics event
      const body = JSON.parse(event.body || '{}')
      const validatedEvent = eventSchema.parse(body)

      // Store in memory (in production, save to database)
      eventsStorage.push(validatedEvent)

      console.log(
        '📊 Analytics event stored:',
        validatedEvent.eventType,
        validatedEvent.inputMethod
      )

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'success',
          message: 'Event tracked successfully',
          eventId: validatedEvent.id,
        }),
      }
    }

    if (event.httpMethod === 'GET') {
      // Retrieve analytics events
      const { queryStringParameters } = event
      let filteredEvents = [...eventsStorage]

      // Apply filters if provided
      if (queryStringParameters?.sessionId) {
        filteredEvents = filteredEvents.filter(
          e => e.sessionId === queryStringParameters.sessionId
        )
      }

      if (queryStringParameters?.eventType) {
        filteredEvents = filteredEvents.filter(
          e => e.eventType === queryStringParameters.eventType
        )
      }

      if (queryStringParameters?.inputMethod) {
        filteredEvents = filteredEvents.filter(
          e => e.inputMethod === queryStringParameters.inputMethod
        )
      }

      // Apply date range if provided
      if (queryStringParameters?.startDate) {
        const startDate = new Date(queryStringParameters.startDate)
        filteredEvents = filteredEvents.filter(
          e => new Date(e.timestamp) >= startDate
        )
      }

      if (queryStringParameters?.endDate) {
        const endDate = new Date(queryStringParameters.endDate)
        filteredEvents = filteredEvents.filter(
          e => new Date(e.timestamp) <= endDate
        )
      }

      // Sort by timestamp (newest first)
      filteredEvents.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      // Apply limit if provided
      const limit = queryStringParameters?.limit
        ? parseInt(queryStringParameters.limit)
        : undefined
      if (limit && limit > 0) {
        filteredEvents = filteredEvents.slice(0, limit)
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'success',
          data: filteredEvents,
          total: eventsStorage.length,
          filtered: filteredEvents.length,
        }),
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        status: 'error',
        error: 'Method not allowed',
      }),
    }
  } catch (error) {
    console.error('Analytics API error:', error)

    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          status: 'error',
          error: 'Invalid request data',
          details: error.issues,
        }),
      }
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    }
  }
}
