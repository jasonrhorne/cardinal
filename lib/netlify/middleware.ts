/**
 * Netlify Functions Middleware
 * Composable middleware for Cardinal serverless functions
 */

import { z } from 'zod'

import {
  type TFunctionContext,
  type FunctionConfig,
  type EnhancedHandler,
  type FunctionError,
  HTTP_STATUS,
} from './types'
import {
  createFunctionContext,
  createFunctionError,
  createErrorResponse,
  handleCORSPreflight,
  validateRequestBody,
  validateQueryParams,
  validateMethod,
  parseAuthHeader,
  logFunctionCall,
  checkRateLimit,
  sanitizeForLog,
} from './utils'

// Middleware function type
export type Middleware = (
  handler: EnhancedHandler,
  config?: any
) => EnhancedHandler

// Authentication middleware
export const withAuth: Middleware = (
  handler,
  config?: { requireAuth?: boolean }
) => {
  return async (event: any, context: TFunctionContext) => {
    if (!config?.requireAuth) {
      return handler(event, context)
    }

    const { type, token } = parseAuthHeader(context.headers)

    if (!token || type !== 'Bearer') {
      throw createFunctionError(
        'authentication_error',
        'Bearer token required',
        HTTP_STATUS.UNAUTHORIZED,
        { provided: type ? `${type} token` : 'no token' },
        context.requestId
      )
    }

    // TODO: Validate token with Supabase JWT
    // For now, just check if token exists
    if (!token.startsWith('eyJ')) {
      throw createFunctionError(
        'authentication_error',
        'Invalid token format',
        HTTP_STATUS.UNAUTHORIZED,
        undefined,
        context.requestId
      )
    }

    // Add user info to context (would come from JWT in real implementation)
    context.userId = 'user-from-jwt'

    return handler(event, context)
  }
}

// Rate limiting middleware
export const withRateLimit: Middleware = (
  handler,
  config?: { requests: number; windowMs: number }
) => {
  return async (event: any, context: TFunctionContext) => {
    if (!config) {
      return handler(event, context)
    }

    const identifier = context.userId || context.ip || 'anonymous'
    const { allowed, remaining, resetTime } = checkRateLimit(
      identifier,
      config.requests,
      config.windowMs
    )

    if (!allowed) {
      const resetDate = new Date(resetTime)
      throw createFunctionError(
        'rate_limit_error',
        'Rate limit exceeded',
        HTTP_STATUS.TOO_MANY_REQUESTS,
        {
          limit: config.requests,
          window: `${config.windowMs / 1000}s`,
          resetAt: resetDate.toISOString(),
        },
        context.requestId
      )
    }

    // Execute handler and add rate limit headers to response
    try {
      const response = await handler(event, context)

      return {
        ...response,
        headers: {
          ...response.headers,
          'X-RateLimit-Limit': config.requests.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
        },
      }
    } catch (error) {
      throw error
    }
  }
}

// Request validation middleware
export const withValidation: Middleware = (
  handler,
  config?: {
    body?: z.ZodType
    query?: z.ZodType
    headers?: z.ZodType
  }
) => {
  return async (event: any, context: TFunctionContext) => {
    try {
      // Validate body if schema provided and method supports body
      if (config?.body && ['POST', 'PUT', 'PATCH'].includes(context.method)) {
        const validatedBody = validateRequestBody(event.body, config.body)
        event.validatedBody = validatedBody
      }

      // Validate query parameters
      if (config?.query) {
        const validatedQuery = validateQueryParams(context.query, config.query)
        event.validatedQuery = validatedQuery
      }

      // Validate headers
      if (config?.headers) {
        try {
          const validatedHeaders = config.headers.parse(context.headers)
          event.validatedHeaders = validatedHeaders
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw createFunctionError(
              'validation_error',
              'Invalid headers',
              HTTP_STATUS.BAD_REQUEST,
              error.issues,
              context.requestId
            )
          }
          throw error
        }
      }

      return handler(event, context)
    } catch (error) {
      throw error
    }
  }
}

// Method validation middleware
export const withMethodValidation: Middleware = (
  handler,
  config?: { allowedMethods: string[] }
) => {
  return async (event: any, context: TFunctionContext) => {
    if (config?.allowedMethods) {
      validateMethod(context.method, config.allowedMethods)
    }

    return handler(event, context)
  }
}

// Logging middleware
export const withLogging: Middleware = (
  handler,
  config?: { functionName: string; logLevel?: 'info' | 'debug' }
) => {
  return async (event: any, context: TFunctionContext) => {
    const startTime = Date.now()
    const functionName = config?.functionName || 'anonymous'

    try {
      // Log request (sanitized)
      if (config?.logLevel === 'debug') {
        console.log(`[${functionName}] Request:`, {
          requestId: context.requestId,
          method: context.method,
          path: context.path,
          query: sanitizeForLog(context.query),
          headers: sanitizeForLog(context.headers),
          body: event.body ? '[BODY_PRESENT]' : '[NO_BODY]',
        })
      }

      const response = await handler(event, context)

      const duration = Date.now() - startTime
      logFunctionCall(functionName, context, duration)

      return response
    } catch (error) {
      const duration = Date.now() - startTime
      logFunctionCall(functionName, context, duration, error as FunctionError)
      throw error
    }
  }
}

// Timeout middleware
export const withTimeout: Middleware = (
  handler,
  config?: { timeoutMs: number }
) => {
  return async (event: any, context: TFunctionContext) => {
    if (!config?.timeoutMs) {
      return handler(event, context)
    }

    return Promise.race([
      handler(event, context),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(
            createFunctionError(
              'timeout_error',
              `Function timed out after ${config.timeoutMs}ms`,
              HTTP_STATUS.GATEWAY_TIMEOUT,
              { timeoutMs: config.timeoutMs },
              context.requestId
            )
          )
        }, config.timeoutMs)
      }),
    ]) as Promise<{
      statusCode: number
      headers: Record<string, string>
      body: string
    }>
  }
}

// Compose multiple middleware
export function compose(
  ...middlewares: Array<{ middleware: Middleware; config?: any }>
): Middleware {
  return handler => {
    return middlewares.reduceRight((acc, { middleware, config }) => {
      return middleware(acc, config)
    }, handler)
  }
}

// Create function wrapper with full middleware stack
export function createFunction(
  handler: EnhancedHandler,
  config?: FunctionConfig & {
    functionName?: string
    logLevel?: 'info' | 'debug'
  }
) {
  // Build middleware stack based on config
  const middlewares: Array<{ middleware: Middleware; config?: any }> = []

  // Always add logging first
  middlewares.push({
    middleware: withLogging,
    config: {
      functionName: config?.functionName || 'unknown',
      logLevel: config?.logLevel || 'info',
    },
  })

  // Add timeout if configured
  if (config?.timeout) {
    middlewares.push({
      middleware: withTimeout,
      config: { timeoutMs: config.timeout },
    })
  }

  // Add method validation
  if (config?.allowedMethods) {
    middlewares.push({
      middleware: withMethodValidation,
      config: { allowedMethods: config.allowedMethods },
    })
  }

  // Add rate limiting
  if (config?.rateLimit) {
    middlewares.push({
      middleware: withRateLimit,
      config: config.rateLimit,
    })
  }

  // Add authentication
  if (config?.requireAuth) {
    middlewares.push({
      middleware: withAuth,
      config: { requireAuth: config.requireAuth },
    })
  }

  // Add validation
  if (config?.validation) {
    middlewares.push({
      middleware: withValidation,
      config: config.validation,
    })
  }

  // Compose all middleware
  const composedMiddleware = compose(...middlewares)
  const wrappedHandler = composedMiddleware(handler)

  // Return standard Netlify function handler
  return async (event: any, _netlifyContext: any) => {
    try {
      // Handle CORS preflight
      if (event.httpMethod === 'OPTIONS') {
        return handleCORSPreflight()
      }

      // Create enhanced context
      const functionContext = createFunctionContext(event)

      // Execute handler with middleware
      return await wrappedHandler(event, functionContext)
    } catch (error) {
      console.error('Function execution error:', error)

      if (error instanceof Error && 'type' in error) {
        return createErrorResponse(error as FunctionError)
      }

      return createErrorResponse(
        createFunctionError(
          'internal_error',
          error instanceof Error ? error.message : 'Unknown error occurred',
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
      )
    }
  }
}
