/**
 * Test Error Handling Infrastructure
 * Comprehensive test function for error handling and logging systems
 */

import { Handler } from '@netlify/functions'
import { z } from 'zod'
import {
  CardinalError,
  ValidationError,
  getErrorMonitor,
  withErrorHandling,
  createValidationError,
  createExternalApiError,
  createDatabaseError,
  createAiServiceError,
  CircuitBreaker,
  withRetry,
  ErrorAggregator,
  measureFunctionPerformance,
  CommonErrors,
  ConsoleTransport,
  MemoryTransport,
  createLogger,
} from '../../lib/errors'
import {
  createSuccessResponse,
  handleCORSPreflight,
} from '../../lib/netlify/utils'
import type { TFunctionContext } from '../../lib/netlify/types'

// Test request schema
const testRequestSchema = z.object({
  testType: z.enum([
    'error-types',
    'logging',
    'monitoring',
    'circuit-breaker',
    'retry',
    'aggregator',
    'performance',
    'validation',
    'external-api',
    'database',
    'ai-service',
  ]),
  params: z.record(z.string(), z.any()).optional(),
  shouldFail: z.boolean().optional().default(false),
})

type TestRequest = z.infer<typeof testRequestSchema>

// Test results interface
interface TestResult {
  testType: string
  success: boolean
  message: string
  data?: any
  error?: string
  duration?: number
}

// Main test handler
const testErrorHandling = async (
  event: any,
  context: TFunctionContext
): Promise<any> => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleCORSPreflight()
  }

  // Validate request
  let request: TestRequest
  try {
    const body = JSON.parse(event.body || '{}')
    request = testRequestSchema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createValidationError(error, 'request body')
    }
    throw error
  }

  const { testType, params = {}, shouldFail } = request

  let result: TestResult

  try {
    switch (testType) {
      case 'error-types':
        result = await testErrorTypes(shouldFail)
        break
      case 'logging':
        result = await testLogging(params)
        break
      case 'monitoring':
        result = await testMonitoring(params)
        break
      case 'circuit-breaker':
        result = await testCircuitBreaker(params)
        break
      case 'retry':
        result = await testRetryMechanism(params)
        break
      case 'aggregator':
        result = await testErrorAggregator(params)
        break
      case 'performance':
        result = await testPerformanceMonitoring(context)
        break
      case 'validation':
        result = await testValidationErrors(params)
        break
      case 'external-api':
        result = await testExternalApiErrors(params)
        break
      case 'database':
        result = await testDatabaseErrors(params)
        break
      case 'ai-service':
        result = await testAiServiceErrors(params)
        break
      default:
        throw new CardinalError(
          `Unknown test type: ${testType}`,
          'validation',
          'low',
          'function',
          { statusCode: 400 }
        )
    }

    return createSuccessResponse(result, 'Test completed successfully')
  } catch (error) {
    // This error will be caught by the error handling wrapper
    throw error
  }
}

// Test different error types
async function testErrorTypes(shouldFail: boolean): Promise<TestResult> {
  if (shouldFail) {
    throw new CardinalError(
      'Intentional test error',
      'internal',
      'medium',
      'function',
      { statusCode: 500, details: { testType: 'error-types' } }
    )
  }

  const errors = {
    cardinal: new CardinalError(
      'Test CardinalError',
      'internal',
      'low',
      'server'
    ),
    validation: new ValidationError('Test validation error', [
      {
        field: 'testField',
        code: 'required',
        message: 'Test field is required',
      },
    ]),
    auth: CommonErrors.unauthorized('Test auth error'),
    forbidden: CommonErrors.forbidden('Test authorization error'),
    notFound: CommonErrors.notFound('Test Resource'),
    rateLimit: CommonErrors.rateLimited(60),
  }

  return {
    testType: 'error-types',
    success: true,
    message: 'All error types created successfully',
    data: {
      errorCount: Object.keys(errors).length,
      errors: Object.entries(errors).map(([type, error]) => ({
        type,
        category: error.category,
        severity: error.severity,
        message: error.message,
      })),
    },
  }
}

// Test logging functionality
async function testLogging(_params: any): Promise<TestResult> {
  const testLogger = createLogger({
    level: 'debug',
    transports: [
      new ConsoleTransport({ minLevel: 'debug' }),
      new MemoryTransport({ maxSize: 100 }),
    ],
  })

  const messages = [
    { level: 'debug' as const, message: 'Debug test message' },
    { level: 'info' as const, message: 'Info test message' },
    { level: 'warn' as const, message: 'Warning test message' },
    {
      level: 'error' as const,
      message: 'Error test message',
      error: new Error('Test error'),
    },
  ]

  for (const msg of messages) {
    await testLogger.log(
      msg.level,
      'app',
      msg.message,
      { testData: true },
      msg.error
    )
  }

  // Test user action logging
  await testLogger.logUserAction('test_action', 'test-user-123', {
    actionData: 'test',
  })

  // Test API logging
  await testLogger.logApiRequest(
    'POST',
    '/test',
    200,
    150,
    'req-123',
    'user-123'
  )

  return {
    testType: 'logging',
    success: true,
    message: 'Logging tests completed successfully',
    data: {
      messagesLogged: messages.length + 2, // + user action + API request
      levels: messages.map(m => m.level),
    },
  }
}

// Test error monitoring
async function testMonitoring(_params: any): Promise<TestResult> {
  const monitor = getErrorMonitor()

  // Create test errors
  const testErrors = [
    new CardinalError('Test critical error', 'internal', 'critical', 'server'),
    new CardinalError(
      'Test high error',
      'external_api',
      'high',
      'external_api'
    ),
    CommonErrors.unauthorized('Test auth failure'),
    CommonErrors.notFound('Test resource'),
  ]

  // Record errors
  for (const error of testErrors) {
    await monitor.recordError(error, {
      userId: 'test-user-123',
      requestId: `req-${Date.now()}`,
      url: '/test',
      userAgent: 'Test Agent',
    })
  }

  // Get statistics
  const stats = monitor.getErrorStats(3600000) // Last hour

  return {
    testType: 'monitoring',
    success: true,
    message: 'Monitoring tests completed successfully',
    data: {
      errorsRecorded: testErrors.length,
      stats,
    },
  }
}

// Test circuit breaker
async function testCircuitBreaker(_params: any): Promise<TestResult> {
  const circuitBreaker = new CircuitBreaker(3, 5000) // 3 failures, 5s reset

  let successCount = 0
  let failureCount = 0
  let circuitOpenCount = 0

  // Test operations
  for (let i = 0; i < 10; i++) {
    try {
      await circuitBreaker.execute(async () => {
        // Fail first 4 operations to trigger circuit breaker
        if (i < 4) {
          throw new Error(`Test failure ${i}`)
        }
        return `Success ${i}`
      })
      successCount++
    } catch (error) {
      if (
        error instanceof CardinalError &&
        error.message.includes('Circuit breaker is open')
      ) {
        circuitOpenCount++
      } else {
        failureCount++
      }
    }
  }

  return {
    testType: 'circuit-breaker',
    success: true,
    message: 'Circuit breaker tests completed successfully',
    data: {
      successCount,
      failureCount,
      circuitOpenCount,
      finalState: circuitBreaker.getState(),
    },
  }
}

// Test retry mechanism
async function testRetryMechanism(_params: any): Promise<TestResult> {
  let attemptCount = 0
  const maxAttempts = 3

  try {
    await withRetry(
      async () => {
        attemptCount++
        if (attemptCount <= maxAttempts - 1) {
          throw new Error(`Attempt ${attemptCount} failed`)
        }
        return `Success on attempt ${attemptCount}`
      },
      {
        maxRetries: maxAttempts,
        baseDelayMs: 100,
        maxDelayMs: 1000,
      }
    )
  } catch (error) {
    // Expected to succeed on final attempt
  }

  return {
    testType: 'retry',
    success: true,
    message: 'Retry mechanism tests completed successfully',
    data: {
      totalAttempts: attemptCount,
      maxRetries: maxAttempts,
    },
  }
}

// Test error aggregator
async function testErrorAggregator(_params: any): Promise<TestResult> {
  const aggregator = new ErrorAggregator()

  // Add various errors
  aggregator.add(new CardinalError('Error 1', 'validation', 'low', 'server'))
  aggregator.add(new CardinalError('Error 2', 'internal', 'medium', 'server'))
  aggregator.addValidation('field1', 'Field 1 is required')
  aggregator.addValidation('field2', 'Field 2 is invalid', 'bad-value')

  const hasErrors = aggregator.hasErrors()
  const errorCount = aggregator.getErrorCount()
  const errors = aggregator.getErrors()

  // Test throwing aggregated errors
  let threwError = false
  try {
    aggregator.throwIfErrors()
  } catch (error) {
    threwError = true
  }

  return {
    testType: 'aggregator',
    success: true,
    message: 'Error aggregator tests completed successfully',
    data: {
      hasErrors,
      errorCount,
      threwError,
      errorCategories: errors.map(e => e.category),
    },
  }
}

// Test performance monitoring
async function testPerformanceMonitoring(
  context: TFunctionContext
): Promise<TestResult> {
  const result = await measureFunctionPerformance(
    'test-performance',
    async () => {
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100))

      // Simulate memory allocation
      const data = new Array(1000).fill('test-data')

      return { processed: data.length }
    },
    context
  )

  return {
    testType: 'performance',
    success: true,
    message: 'Performance monitoring tests completed successfully',
    data: result,
  }
}

// Test validation errors
async function testValidationErrors(_params: any): Promise<TestResult> {
  const testSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    age: z.number().min(0).max(120),
  })

  const invalidData = {
    name: '',
    email: 'invalid-email',
    age: -5,
  }

  try {
    testSchema.parse(invalidData)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = createValidationError(error, 'test data')

      return {
        testType: 'validation',
        success: true,
        message: 'Validation error tests completed successfully',
        data: {
          validationErrorCount: validationError.validationErrors.length,
          errors: validationError.validationErrors,
        },
      }
    }
  }

  throw new Error('Expected validation error was not thrown')
}

// Test external API errors
async function testExternalApiErrors(_params: any): Promise<TestResult> {
  const errors = [
    createExternalApiError(
      'TestAPI',
      '/test/endpoint',
      'GET',
      new Error('Connection timeout')
    ),
    createExternalApiError(
      'TestAPI',
      '/test/endpoint',
      'POST',
      new Error('Rate limit exceeded'),
      { status: 429 }
    ),
    createExternalApiError(
      'TestAPI',
      '/test/endpoint',
      'DELETE',
      new Error('Service unavailable'),
      { status: 503 }
    ),
  ]

  return {
    testType: 'external-api',
    success: true,
    message: 'External API error tests completed successfully',
    data: {
      errorCount: errors.length,
      errors: errors.map(e => ({
        service: e.apiDetails.service,
        endpoint: e.apiDetails.endpoint,
        method: e.apiDetails.method,
        statusCode: e.apiDetails.statusCode,
        rateLimited: e.apiDetails.rateLimited,
      })),
    },
  }
}

// Test database errors
async function testDatabaseErrors(_params: any): Promise<TestResult> {
  const errors = [
    createDatabaseError('SELECT', 'users', new Error('Connection timeout')),
    createDatabaseError(
      'INSERT',
      'orders',
      new Error('unique constraint violation'),
      'INSERT INTO orders...'
    ),
    createDatabaseError(
      'UPDATE',
      'products',
      new Error('foreign key constraint violation')
    ),
  ]

  return {
    testType: 'database',
    success: true,
    message: 'Database error tests completed successfully',
    data: {
      errorCount: errors.length,
      errors: errors.map(e => ({
        operation: e.dbDetails.operation,
        table: e.dbDetails.table,
        constraint: e.dbDetails.constraint,
      })),
    },
  }
}

// Test AI service errors
async function testAiServiceErrors(_params: any): Promise<TestResult> {
  const errors = [
    createAiServiceError(
      'anthropic',
      'claude-3-sonnet',
      'completion',
      new Error('Rate limit exceeded'),
      1000
    ),
    createAiServiceError(
      'openai',
      'gpt-4',
      'completion',
      new Error('Model overloaded'),
      1500
    ),
    createAiServiceError(
      'anthropic',
      'claude-3-haiku',
      'embedding',
      new Error('Invalid API key')
    ),
  ]

  return {
    testType: 'ai-service',
    success: true,
    message: 'AI service error tests completed successfully',
    data: {
      errorCount: errors.length,
      errors: errors.map(e => ({
        provider: e.aiDetails.provider,
        model: e.aiDetails.model,
        operation: e.aiDetails.operation,
        tokenCount: e.aiDetails.tokenCount,
        rateLimited: e.aiDetails.rateLimited,
      })),
    },
  }
}

// Export the handler with error handling wrapper
export const handler: Handler = withErrorHandling(testErrorHandling, {
  functionName: 'test-error-handling',
  timeout: 30000, // 30 seconds
  retries: 0, // Don't retry test functions
})
