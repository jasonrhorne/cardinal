/**
 * Test LangChain Integration
 * Netlify function to validate LangChain setup and functionality
 */

import { Handler } from '@netlify/functions'
import { z } from 'zod'
import {
  travelChains,
  agentOrchestrator,
  type TDestinationSuggestionInput,
  type TItineraryGenerationInput,
  type TAgentType,
} from '../../lib/langchain'

// Test request schema
const testRequestSchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'auto']).default('auto'),
  testType: z.enum(['chains', 'agents', 'prompts', 'all']).default('chains'),
  sampleData: z
    .object({
      origin: z.string().default('San Francisco'),
      destination: z.string().default('Tokyo'),
      duration: z.number().positive().max(30).default(3),
      interests: z.array(z.string()).default(['food', 'culture', 'history']),
      travelers: z.number().positive().max(20).default(2),
      budget: z.string().default('$2000'),
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
    // Parse request
    let requestData = {
      provider: 'auto' as 'anthropic' | 'openai' | 'auto',
      testType: 'chains' as 'chains' | 'agents' | 'prompts' | 'all',
      sampleData: {
        origin: 'San Francisco',
        destination: 'Tokyo',
        duration: 3,
        interests: ['food', 'culture', 'history'],
        travelers: 2,
        budget: '$2000',
      },
    }

    if (event.httpMethod === 'POST' && event.body) {
      try {
        const body = JSON.parse(event.body)
        const parsedData = testRequestSchema.parse(body)
        requestData = {
          provider: parsedData.provider,
          testType: parsedData.testType,
          sampleData: parsedData.sampleData || requestData.sampleData,
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

    // Check provider availability
    const availableProviders = travelChains.getAvailableProviders()
    if (availableProviders.length === 0) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          status: 'error',
          error: 'No LangChain providers configured',
          message:
            'Please set ANTHROPIC_API_KEY or OPENAI_API_KEY environment variables',
        }),
      }
    }

    console.log(
      `Testing LangChain - Type: ${requestData.testType}, Provider: ${requestData.provider}`
    )

    const results: any = {
      status: 'success',
      message: 'LangChain testing completed',
      data: {
        availableProviders,
        requestedProvider: requestData.provider,
        testType: requestData.testType,
        configuration: travelChains.getConfig(),
        tests: {} as Record<string, any>,
        timestamp: new Date().toISOString(),
      },
    }

    // Run chain tests
    if (requestData.testType === 'chains' || requestData.testType === 'all') {
      console.log('Running chain tests...')

      // Destination suggestion chain test
      try {
        const destinationInput: TDestinationSuggestionInput = {
          origin: requestData.sampleData.origin,
          duration: requestData.sampleData.duration,
          travelers: requestData.sampleData.travelers,
          interests: requestData.sampleData.interests,
          budget: requestData.sampleData.budget,
          pace: 'moderate',
        }

        const destinationResult = await travelChains.suggestDestinations(
          destinationInput,
          requestData.provider === 'auto' ? undefined : requestData.provider
        )

        results.data.tests.destinationChain = {
          success: true,
          input: destinationInput,
          result:
            destinationResult.substring(0, 500) +
            (destinationResult.length > 500 ? '...' : ''),
          fullLength: destinationResult.length,
        }
      } catch (error) {
        results.data.tests.destinationChain = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }

      // Itinerary generation chain test
      try {
        const itineraryInput: TItineraryGenerationInput = {
          destination: requestData.sampleData.destination,
          duration: requestData.sampleData.duration,
          travelers: requestData.sampleData.travelers,
          interests: requestData.sampleData.interests,
          budget: requestData.sampleData.budget,
          pace: 'moderate',
          transportationMode: 'mixed',
        }

        const itineraryResult = await travelChains.generateItinerary(
          itineraryInput,
          requestData.provider === 'auto' ? undefined : requestData.provider
        )

        results.data.tests.itineraryChain = {
          success: true,
          input: itineraryInput,
          result:
            itineraryResult.substring(0, 500) +
            (itineraryResult.length > 500 ? '...' : ''),
          fullLength: itineraryResult.length,
        }
      } catch (error) {
        results.data.tests.itineraryChain = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }

      // Travel chat test
      try {
        const chatResult = await travelChains.chatWithTravelExpert(
          `What are the best local food experiences in ${requestData.sampleData.destination}?`,
          `Expert specializing in ${requestData.sampleData.destination} cuisine`,
          requestData.provider === 'auto' ? undefined : requestData.provider
        )

        results.data.tests.travelChat = {
          success: true,
          result:
            chatResult.substring(0, 300) +
            (chatResult.length > 300 ? '...' : ''),
          fullLength: chatResult.length,
        }
      } catch (error) {
        results.data.tests.travelChat = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }

    // Run agent tests
    if (requestData.testType === 'agents' || requestData.testType === 'all') {
      console.log('Running agent tests...')

      try {
        // Create test context
        const context = agentOrchestrator.createContext(
          'test-session-123',
          'test-user'
        )

        // Test destination expert agent
        const destinationAgentResult = await agentOrchestrator.executeAgent(
          'destination_expert',
          {
            origin: requestData.sampleData.origin,
            duration: requestData.sampleData.duration,
            travelers: requestData.sampleData.travelers,
            interests: requestData.sampleData.interests,
            budget: requestData.sampleData.budget,
            pace: 'moderate',
          },
          context,
          requestData.provider === 'auto' ? undefined : requestData.provider
        )

        results.data.tests.destinationAgent = {
          success: destinationAgentResult.success,
          agentType: destinationAgentResult.agentType,
          result: destinationAgentResult.success
            ? destinationAgentResult.content.substring(0, 300) +
              (destinationAgentResult.content.length > 300 ? '...' : '')
            : undefined,
          nextSuggestedAgent: destinationAgentResult.nextSuggestedAgent,
          metadata: destinationAgentResult.metadata,
          error: destinationAgentResult.error,
        }

        // Test agent suggestion
        const suggestedAgent = await agentOrchestrator.suggestNextAgent(
          'I want to plan an itinerary for my trip',
          context
        )

        results.data.tests.agentSuggestion = {
          success: true,
          userInput: 'I want to plan an itinerary for my trip',
          suggestedAgent,
        }
      } catch (error) {
        results.data.tests.agents = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }

    // Run workflow test
    if (requestData.testType === 'all') {
      console.log('Running workflow test...')

      try {
        const context = agentOrchestrator.createContext('workflow-test-456')

        const workflow = [
          {
            agentType: 'destination_expert' as TAgentType,
            input: {
              origin: requestData.sampleData.origin,
              duration: requestData.sampleData.duration,
              travelers: requestData.sampleData.travelers,
              interests: requestData.sampleData.interests,
              budget: requestData.sampleData.budget,
              pace: 'moderate',
            },
            ...(requestData.provider !== 'auto' && {
              provider: requestData.provider,
            }),
          },
        ]

        const workflowResults = await agentOrchestrator.executeWorkflow(
          workflow,
          context
        )

        results.data.tests.workflow = {
          success: workflowResults.every(r => r.success),
          steps: workflowResults.map(r => ({
            agentType: r.agentType,
            success: r.success,
            executionTime: r.metadata?.executionTime,
            error: r.error,
          })),
          conversationHistory: context.conversationHistory,
        }
      } catch (error) {
        results.data.tests.workflow = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(results, null, 2),
    }
  } catch (error) {
    console.error('LangChain test error:', error)

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'error',
        error: 'LangChain test failed',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }),
    }
  }
}
