/**
 * Netlify Functions Error Handler
 * Enhanced error handling utilities for serverless functions
 */

import { z } from 'zod'

import {
  CardinalError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ExternalApiError,
  DatabaseError,
  AiServiceError,
  type BaseError,
} from '../errors/types'
import { logger } from '../logging/logger'
import { getErrorMonitor } from '../monitoring/error-monitor'

import type { TFunctionContext } from './types'
import { createErrorResponse, createFunctionContext } from './utils'

// Enhanced function handler with comprehensive error handling
export function withErrorHandling<TEvent = any, TResult = any>(
  handler: (event: TEvent, context: TFunctionContext) => Promise<TResult>,
  options: {
    functionName: string
    timeout?: number
    retries?: number
    circuitBreaker?: {
      failureThreshold: number
      resetTimeoutMs: number
    }
  }
) {
  return async (event: TEvent, _netlifyContext: any) => {
    const startTime = performance.now()
    const context = createFunctionContext(event)
    const monitor = getErrorMonitor()

    // Start performance tracking
    logger.startTimer(`function-${options.functionName}-${context.requestId}`)

    try {
      // Log function invocation
      await logger.info(
        'function',
        `Function ${options.functionName} invoked`,
        {
          requestId: context.requestId,
          method: context.method,
          path: context.path,
          userId: context.userId,
        }
      )

      // Set timeout if configured
      let timeoutId: NodeJS.Timeout | null = null
      if (options.timeout) {
        timeoutId = setTimeout(() => {
          throw new CardinalError(
            'Function execution timeout',
            'timeout',
            'high',
            'function',
            {
              statusCode: 504,
              details: {
                timeout: options.timeout,
                functionName: options.functionName,
              },
            }
          )
        }, options.timeout)
      }

      try {
        // Execute the handler
        const result = await handler(event, context)

        // Clear timeout
        if (timeoutId) {
          clearTimeout(timeoutId)
        }

        // Log successful completion
        const duration = performance.now() - startTime
        await logger.endTimer(
          `function-${options.functionName}-${context.requestId}`,
          'function',
          `Function ${options.functionName} completed successfully`,
          {
            requestId: context.requestId,
            duration,
            functionName: options.functionName,
          }
        )

        return result
      } catch (handlerError) {
        // Clear timeout
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        throw handlerError
      }
    } catch (error) {
      return await handleFunctionError(
        error,
        context,
        options.functionName,
        monitor
      )
    }
  }
}

// Comprehensive error handling for function errors
async function handleFunctionError(
  error: unknown,
  context: TFunctionContext,
  functionName: string,
  monitor: any
): Promise<{
  statusCode: number
  headers: Record<string, string>
  body: string
}> {
  let cardinalError: BaseError

  // Convert unknown error to CardinalError
  if (error instanceof CardinalError) {
    cardinalError = error
  } else if (error instanceof Error) {
    cardinalError = new CardinalError(
      error.message,
      'internal',
      'high',
      'function',
      {
        statusCode: 500,
        cause: error,
        requestId: context.requestId,
      }
    )
  } else {
    cardinalError = new CardinalError(
      'Unknown error occurred',
      'internal',
      'high',
      'function',
      {
        statusCode: 500,
        details: { originalError: String(error) },
        requestId: context.requestId,
      }
    )
  }

  // Enhance error with context
  cardinalError.requestId = context.requestId
  cardinalError.userId = context.userId
  cardinalError.sessionId = context.sessionId

  // Log the error
  await logger.error(
    'function',
    `Function ${functionName} error`,
    {
      errorId: cardinalError.id,
      errorCategory: cardinalError.category,
      errorSeverity: cardinalError.severity,
      functionName,
      requestId: context.requestId,
      userId: context.userId,
      method: context.method,
      path: context.path,
    },
    cardinalError
  )

  // Record in monitoring system
  await monitor.recordError(cardinalError, {
    userId: context.userId,
    sessionId: context.sessionId,
    requestId: context.requestId,
    url: context.path,
    userAgent: context.userAgent,
    ip: context.ip,
  })

  // Return appropriate error response
  return createErrorResponse(cardinalError as any)
}

// Validation error helper
export function createValidationError(
  zodError: z.ZodError,
  context?: string
): ValidationError {
  const validationErrors = zodError.issues.map(issue => ({
    field: issue.path.join('.') || 'root',
    code: issue.code,
    message: issue.message,
    received: 'received' in issue ? issue.received : undefined,
    expected: 'expected' in issue ? issue.expected : undefined,
  }))

  return new ValidationError(
    `Validation failed${context ? ` for ${context}` : ''}`,
    validationErrors
  )
}

// External API error helper
export function createExternalApiError(
  service: string,
  endpoint: string,
  method: string,
  error: unknown,
  response?: any
): ExternalApiError {
  let message = `${service} API error`
  let statusCode = 502

  if (error instanceof Error) {
    message = error.message
  }

  if (response?.status) {
    statusCode = response.status
  }

  return new ExternalApiError(message, {
    service,
    endpoint,
    method,
    statusCode,
    response: response?.data || response,
    rateLimited: statusCode === 429,
  })
}

// Database error helper
export function createDatabaseError(
  operation: string,
  table: string | undefined,
  error: unknown,
  query?: string
): DatabaseError {
  let message = `Database ${operation} failed`

  if (error instanceof Error) {
    message = error.message
  }

  return new DatabaseError(message, {
    operation,
    table: table || undefined,
    query: query || undefined,
    constraint: extractConstraintViolation(error),
  })
}

// AI service error helper
export function createAiServiceError(
  provider: 'anthropic' | 'openai',
  model: string,
  operation: 'completion' | 'embedding' | 'function_call',
  error: unknown,
  tokenCount?: number
): AiServiceError {
  let message = `${provider} ${operation} failed`
  let rateLimited = false

  if (error instanceof Error) {
    message = error.message

    // Check for rate limiting indicators
    if (
      message.toLowerCase().includes('rate limit') ||
      message.toLowerCase().includes('quota exceeded') ||
      message.toLowerCase().includes('too many requests')
    ) {
      rateLimited = true
    }
  }

  return new AiServiceError(message, {
    provider,
    model,
    operation,
    tokenCount: tokenCount || undefined,
    rateLimited,
  })
}

// Circuit breaker pattern for function reliability
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private failureThreshold: number = 5,
    private resetTimeoutMs: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime < this.resetTimeoutMs) {
        throw new CardinalError(
          'Circuit breaker is open',
          'internal',
          'medium',
          'function',
          { statusCode: 503 }
        )
      }

      this.state = 'half-open'
    }

    try {
      const result = await operation()

      // Success - reset circuit breaker
      this.failures = 0
      this.state = 'closed'

      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()

      if (this.failures >= this.failureThreshold) {
        this.state = 'open'
      }

      throw error
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state
  }

  reset(): void {
    this.failures = 0
    this.lastFailureTime = 0
    this.state = 'closed'
  }
}

// Retry mechanism with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    baseDelayMs?: number
    maxDelayMs?: number
    retryCondition?: (error: unknown) => boolean
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    retryCondition = error =>
      !(
        error instanceof AuthenticationError ||
        error instanceof AuthorizationError
      ),
  } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Don't retry on final attempt
      if (attempt === maxRetries) {
        break
      }

      // Check if we should retry this error
      if (!retryCondition(error)) {
        break
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelayMs
      )

      await new Promise(resolve => setTimeout(resolve, delay))

      await logger.warn(
        'function',
        `Retrying operation (attempt ${attempt + 1}/${maxRetries})`,
        {
          attempt: attempt + 1,
          maxRetries,
          delay,
          error: error instanceof Error ? error.message : String(error),
        }
      )
    }
  }

  throw lastError
}

// Helper to extract constraint violation from database errors
function extractConstraintViolation(error: unknown): string | undefined {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // PostgreSQL constraint patterns
    if (message.includes('unique constraint')) {
      return 'unique_violation'
    }
    if (message.includes('foreign key constraint')) {
      return 'foreign_key_violation'
    }
    if (message.includes('check constraint')) {
      return 'check_violation'
    }
    if (message.includes('not null constraint')) {
      return 'not_null_violation'
    }
  }

  return undefined
}

// Error aggregation for bulk operations
export class ErrorAggregator {
  private errors: BaseError[] = []

  add(error: BaseError): void {
    this.errors.push(error)
  }

  addValidation(field: string, message: string, value?: any): void {
    const validationError = new ValidationError(
      `Validation error on field ${field}`,
      [
        {
          field,
          code: 'custom',
          message,
          received: value,
        },
      ]
    )
    this.add(validationError)
  }

  hasErrors(): boolean {
    return this.errors.length > 0
  }

  getErrors(): BaseError[] {
    return [...this.errors]
  }

  getErrorCount(): number {
    return this.errors.length
  }

  throwIfErrors(): void {
    if (this.hasErrors()) {
      const summary = this.errors
        .slice(0, 5)
        .map(e => e.message)
        .join(', ')

      const message =
        this.errors.length > 5
          ? `${summary} and ${this.errors.length - 5} more errors`
          : summary

      throw new CardinalError(
        `Multiple errors occurred: ${message}`,
        'validation',
        'medium',
        'function',
        {
          statusCode: 400,
          details: { errors: this.errors },
        }
      )
    }
  }

  clear(): void {
    this.errors = []
  }
}

// Function performance monitoring
export async function measureFunctionPerformance<T>(
  functionName: string,
  operation: () => Promise<T>,
  context: TFunctionContext
): Promise<T> {
  const startTime = performance.now()
  const startMemory = process.memoryUsage()

  try {
    const result = await operation()

    const duration = performance.now() - startTime
    const endMemory = process.memoryUsage()
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed

    await logger.info('function', `Function ${functionName} performance`, {
      requestId: context.requestId,
      duration,
      memoryDelta,
      peakMemory: endMemory.heapUsed,
      success: true,
    })

    return result
  } catch (error) {
    const duration = performance.now() - startTime
    const endMemory = process.memoryUsage()
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed

    await logger.warn(
      'function',
      `Function ${functionName} performance (with error)`,
      {
        requestId: context.requestId,
        duration,
        memoryDelta,
        peakMemory: endMemory.heapUsed,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    )

    throw error
  }
}
