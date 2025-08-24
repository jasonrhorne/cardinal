/**
 * Test Scaffolding Functionality
 * Demonstrates and tests the Netlify Functions scaffolding
 */

import { z } from 'zod'
import {
  createFunction,
  createSuccessResponse,
  createFunctionError,
  templates,
  HTTP_STATUS,
} from '../../lib/netlify'

// Test schemas
const testQuerySchema = z.object({
  message: z.string().default('Hello from Cardinal!'),
  count: z.coerce.number().min(1).max(10).default(1),
})

const testBodySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  preferences: z.array(z.string()).optional(),
})

// Test different endpoint types
const testEndpoints = {
  // Simple GET endpoint
  get: templates.get({
    functionName: 'test-get',
    description: 'Test GET endpoint with query validation',
    querySchema: testQuerySchema,
    handler: async (query, context) => {
      return {
        message: `${query.message} (repeated ${query.count} times)`,
        responses: Array(query.count).fill(query.message),
        context: {
          requestId: context.requestId,
          timestamp: context.timestamp,
          ip: context.ip,
        },
      }
    },
  }),

  // Simple POST endpoint
  post: templates.post({
    functionName: 'test-post',
    description: 'Test POST endpoint with body validation',
    bodySchema: testBodySchema,
    handler: async (body, context) => {
      return {
        message: `Welcome ${body.name}!`,
        email: body.email,
        preferences: body.preferences || [],
        processedAt: new Date().toISOString(),
        requestId: context.requestId,
      }
    },
  }),

  // AI endpoint simulation
  ai: templates.ai({
    functionName: 'test-ai',
    description: 'Test AI endpoint with timeout and rate limiting',
    inputSchema: z.object({
      prompt: z.string().min(1).max(500),
      model: z.enum(['fast', 'accurate']).default('fast'),
    }),
    handler: async (input, context) => {
      // Simulate AI processing time
      const processingTime = input.model === 'fast' ? 1000 : 3000
      await new Promise(resolve => setTimeout(resolve, processingTime))

      return {
        prompt: input.prompt,
        response: `AI response to: "${input.prompt}" (using ${input.model} model)`,
        model: input.model,
        processingTime,
        requestId: context.requestId,
        tokens: {
          input: input.prompt.split(' ').length,
          output: 20,
          total: input.prompt.split(' ').length + 20,
        },
      }
    },
    rateLimit: { requests: 3, windowMs: 60000 },
    timeout: 10000,
  }),

  // Health check endpoint
  health: templates.healthCheck({
    functionName: 'test-health',
    checks: {
      memory: async () => {
        const usage = process.memoryUsage()
        return usage.heapUsed < 100 * 1024 * 1024 // Less than 100MB
      },
      timestamp: async () => {
        return Date.now() > 0
      },
      env: async () => {
        return !!process.env.NODE_ENV
      },
    },
  }),
}

// Main test handler that routes to different test endpoints
export const handler = createFunction(
  async (event, context) => {
    const pathSegments = context.path.split('/').filter(Boolean)
    const testType = pathSegments[pathSegments.length - 1] || 'info'

    // Route to appropriate test endpoint
    switch (testType) {
      case 'get':
        return testEndpoints.get(event, context)

      case 'post':
        return testEndpoints.post(event, context)

      case 'ai':
        return testEndpoints.ai(event, context)

      case 'health':
        return testEndpoints.health(event, context)

      case 'error':
        // Test error handling
        throw createFunctionError(
          'validation_error',
          'This is a test error',
          HTTP_STATUS.BAD_REQUEST,
          { testData: 'error simulation' }
        )

      case 'timeout':
        // Test timeout handling
        await new Promise(resolve => setTimeout(resolve, 35000)) // 35 seconds
        return createSuccessResponse({ message: 'This should timeout' })

      case 'info':
      default:
        // Return information about available test endpoints
        return createSuccessResponse({
          message: 'Cardinal Netlify Functions Scaffolding Test',
          availableEndpoints: {
            'GET /test-scaffolding': 'Show this information',
            'GET /test-scaffolding/get?message=hello&count=3':
              'Test GET with query params',
            'POST /test-scaffolding/post':
              'Test POST with body validation (requires: name, email)',
            'POST /test-scaffolding/ai':
              'Test AI endpoint (requires: prompt, optional: model)',
            'GET /test-scaffolding/health': 'Test health check endpoint',
            'GET /test-scaffolding/error': 'Test error handling',
            'GET /test-scaffolding/timeout':
              'Test timeout handling (will timeout after 30s)',
          },
          scaffoldingFeatures: [
            'Automatic CORS handling',
            'Request/response validation with Zod',
            'Rate limiting',
            'Authentication middleware',
            'Error handling and logging',
            'Timeout protection',
            'Request ID generation',
            'Security headers',
          ],
          timestamp: new Date().toISOString(),
          requestId: context.requestId,
        })
    }
  },
  {
    functionName: 'test-scaffolding',
    allowedMethods: ['GET', 'POST'],
    logLevel: 'debug',
  }
)
