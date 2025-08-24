/**
 * Test LLM Provider Integration
 * Netlify function to validate LLM setup and functionality
 */

import { Handler } from '@netlify/functions'
import { z } from 'zod'
import { llm, LLMProvider } from '../../lib/llm'

// Test request schema
const testRequestSchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'auto']).default('auto'),
  testType: z.enum(['simple', 'structured', 'travel', 'all']).default('simple'),
  message: z.string().default('Hello! Tell me about yourself in one sentence.'),
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
      provider: 'auto' as LLMProvider,
      testType: 'simple' as 'simple' | 'structured' | 'travel' | 'all',
      message: 'Hello! Tell me about yourself in one sentence.',
    }

    if (event.httpMethod === 'POST' && event.body) {
      try {
        const body = JSON.parse(event.body)
        const parsedData = testRequestSchema.parse(body)
        requestData = {
          provider: parsedData.provider,
          testType: parsedData.testType,
          message: parsedData.message,
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
    const availableProviders = llm.getAvailableProviders()
    if (availableProviders.length === 0) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          status: 'error',
          error: 'No LLM providers configured',
          message:
            'Please set ANTHROPIC_API_KEY or OPENAI_API_KEY environment variables',
        }),
      }
    }

    console.log(
      `Testing LLM providers - Type: ${requestData.testType}, Provider: ${requestData.provider}`
    )

    const results: any = {
      status: 'success',
      message: 'LLM testing completed',
      data: {
        availableProviders,
        requestedProvider: requestData.provider,
        testType: requestData.testType,
        tests: {} as Record<string, any>,
        timestamp: new Date().toISOString(),
      },
    }

    // Run tests based on type
    if (requestData.testType === 'simple' || requestData.testType === 'all') {
      console.log('Running simple chat test...')
      try {
        const response = await llm.chat(
          requestData.message,
          undefined,
          requestData.provider
        )
        results.data.tests.simple = {
          success: true,
          response:
            response.substring(0, 200) + (response.length > 200 ? '...' : ''),
          length: response.length,
        }
      } catch (error) {
        results.data.tests.simple = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }

    if (
      requestData.testType === 'structured' ||
      requestData.testType === 'all'
    ) {
      console.log('Running structured JSON test...')
      try {
        const schema = z.object({
          greeting: z.string(),
          language: z.string(),
          confidence: z.number().min(0).max(1),
        })

        const result = await llm.generateJson(
          {
            messages: [
              {
                role: 'user',
                content:
                  'Respond with JSON containing: greeting (a friendly hello), language (the language you detected), and confidence (0-1 how sure you are)',
              },
            ],
            maxTokens: 200,
            temperature: 0.3,
          },
          schema,
          requestData.provider
        )

        results.data.tests.structured = {
          success: true,
          data: result.data,
          usage: result.response.usage,
          provider: result.response.provider,
          cost: result.response.estimatedCost,
        }
      } catch (error) {
        results.data.tests.structured = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }

    if (requestData.testType === 'travel' || requestData.testType === 'all') {
      console.log('Running travel-specific test...')
      try {
        const result = await llm.suggestDestinations(
          'San Francisco',
          3,
          ['food', 'art', 'culture'],
          '$1500',
          requestData.provider
        )

        results.data.tests.travel = {
          success: true,
          suggestions:
            result.suggestions.substring(0, 500) +
            (result.suggestions.length > 500 ? '...' : ''),
          usage: result.response.usage,
          provider: result.response.provider,
          cost: result.response.estimatedCost,
          fullLength: result.suggestions.length,
        }
      } catch (error) {
        results.data.tests.travel = {
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
    console.error('LLM test error:', error)

    // Handle specific LLM errors
    if (error && typeof error === 'object' && 'type' in error) {
      const llmError = error as any

      if (llmError.type === 'authentication') {
        return {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            status: 'error',
            error: 'LLM authentication failed',
            message: 'Invalid or missing API key',
            provider: llmError.provider,
            details: llmError.message,
          }),
        }
      }

      if (llmError.type === 'rate_limit') {
        return {
          statusCode: 429,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            status: 'error',
            error: 'Rate limit exceeded',
            message: 'Please try again later',
            provider: llmError.provider,
            details: llmError.message,
          }),
        }
      }

      if (llmError.type === 'quota_exceeded') {
        return {
          statusCode: 402,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            status: 'error',
            error: 'Quota exceeded',
            message: 'Please check your billing and quota settings',
            provider: llmError.provider,
            details: llmError.message,
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
        error: 'LLM test failed',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }),
    }
  }
}
