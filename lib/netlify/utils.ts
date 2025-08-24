/**
 * Netlify Functions Utilities
 * Common utilities and helpers for Cardinal serverless functions
 */

import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

import {
  type TApiResponse,
  type TFunctionContext,
  type FunctionError,
  type FunctionErrorType,
  type HttpStatusCode,
  HTTP_STATUS,
  CORS_HEADERS,
  SECURITY_HEADERS,
} from './types'

// Create enhanced function context
export function createFunctionContext(event: any): TFunctionContext {
  const requestId = uuidv4()
  const timestamp = new Date().toISOString()

  return {
    requestId,
    timestamp,
    method: event.httpMethod || 'GET',
    path: event.path || '/',
    query: event.queryStringParameters || {},
    headers: event.headers || {},
    userAgent: event.headers?.['user-agent'] || 'unknown',
    ip:
      event.headers?.['x-forwarded-for'] ||
      event.headers?.['x-real-ip'] ||
      'unknown',
    userId: event.headers?.['x-user-id'],
    sessionId: event.headers?.['x-session-id'],
  }
}

// Create function error
export function createFunctionError(
  type: FunctionErrorType,
  message: string,
  statusCode?: HttpStatusCode,
  details?: any,
  requestId?: string
): FunctionError {
  const error = new Error(message) as FunctionError
  error.type = type
  error.statusCode = statusCode || getDefaultStatusCode(type)
  error.details = details
  error.requestId = requestId
  return error
}

// Get default status code for error type
function getDefaultStatusCode(type: FunctionErrorType): HttpStatusCode {
  switch (type) {
    case 'validation_error':
      return HTTP_STATUS.BAD_REQUEST
    case 'authentication_error':
      return HTTP_STATUS.UNAUTHORIZED
    case 'authorization_error':
      return HTTP_STATUS.FORBIDDEN
    case 'not_found_error':
      return HTTP_STATUS.NOT_FOUND
    case 'method_not_allowed_error':
      return HTTP_STATUS.METHOD_NOT_ALLOWED
    case 'rate_limit_error':
      return HTTP_STATUS.TOO_MANY_REQUESTS
    case 'timeout_error':
      return HTTP_STATUS.GATEWAY_TIMEOUT
    case 'external_api_error':
      return HTTP_STATUS.BAD_GATEWAY
    case 'internal_error':
    default:
      return HTTP_STATUS.INTERNAL_SERVER_ERROR
  }
}

// Create success response
export function createSuccessResponse(
  data?: any,
  message: string = 'Success',
  statusCode: HttpStatusCode = HTTP_STATUS.OK,
  additionalHeaders: Record<string, string> = {}
): {
  statusCode: number
  headers: Record<string, string>
  body: string
} {
  const response: TApiResponse = {
    status: 'success',
    message,
    data,
    timestamp: new Date().toISOString(),
  }

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...SECURITY_HEADERS,
      ...additionalHeaders,
    },
    body: JSON.stringify(response, null, 2),
  }
}

// Create error response
export function createErrorResponse(
  error: string | FunctionError,
  statusCode?: HttpStatusCode,
  details?: any,
  requestId?: string
): {
  statusCode: number
  headers: Record<string, string>
  body: string
} {
  let message: string
  let finalStatusCode: HttpStatusCode
  let finalDetails: any
  let finalRequestId: string | undefined

  if (typeof error === 'string') {
    message = error
    finalStatusCode = statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    finalDetails = details
    finalRequestId = requestId
  } else {
    message = error.message
    finalStatusCode = error.statusCode
    finalDetails = error.details || details
    finalRequestId = error.requestId || requestId
  }

  const response: TApiResponse = {
    status: 'error',
    message,
    error: message,
    details: finalDetails,
    timestamp: new Date().toISOString(),
  }

  // Add request ID to response if available
  if (finalRequestId) {
    response.details = {
      ...finalDetails,
      requestId: finalRequestId,
    }
  }

  return {
    statusCode: finalStatusCode,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...SECURITY_HEADERS,
    },
    body: JSON.stringify(response, null, 2),
  }
}

// Handle CORS preflight requests
export function handleCORSPreflight(): {
  statusCode: number
  headers: Record<string, string>
  body: string
} {
  return {
    statusCode: HTTP_STATUS.OK,
    headers: {
      ...CORS_HEADERS,
      ...SECURITY_HEADERS,
    },
    body: '',
  }
}

// Validate request body against schema
export function validateRequestBody<T>(
  body: string | null,
  schema: z.ZodType<T>
): T {
  if (!body) {
    throw createFunctionError(
      'validation_error',
      'Request body is required',
      HTTP_STATUS.BAD_REQUEST
    )
  }

  try {
    const parsed = JSON.parse(body)
    return schema.parse(parsed)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createFunctionError(
        'validation_error',
        'Invalid request body format',
        HTTP_STATUS.BAD_REQUEST,
        error.issues
      )
    }

    throw createFunctionError(
      'validation_error',
      'Invalid JSON in request body',
      HTTP_STATUS.BAD_REQUEST,
      {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      }
    )
  }
}

// Validate query parameters against schema
export function validateQueryParams<T>(
  params: Record<string, string> | null,
  schema: z.ZodType<T>
): T {
  try {
    return schema.parse(params || {})
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createFunctionError(
        'validation_error',
        'Invalid query parameters',
        HTTP_STATUS.BAD_REQUEST,
        error.issues
      )
    }
    throw error
  }
}

// Check if method is allowed
export function validateMethod(method: string, allowedMethods: string[]): void {
  if (!allowedMethods.includes(method.toUpperCase())) {
    throw createFunctionError(
      'method_not_allowed_error',
      `Method ${method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
      HTTP_STATUS.METHOD_NOT_ALLOWED
    )
  }
}

// Parse authorization header
export function parseAuthHeader(headers: Record<string, string>): {
  type?: string
  token?: string
} {
  const authHeader = headers.authorization || headers.Authorization

  if (!authHeader) {
    return {}
  }

  const [type, token] = authHeader.split(' ')
  return {
    type: type || undefined,
    token: token || undefined,
  }
}

// Log function execution
export function logFunctionCall(
  functionName: string,
  context: TFunctionContext,
  duration?: number,
  error?: FunctionError
): void {
  const logData = {
    function: functionName,
    requestId: context.requestId,
    method: context.method,
    path: context.path,
    userId: context.userId,
    ip: context.ip,
    userAgent: context.userAgent,
    timestamp: context.timestamp,
    duration,
    error: error
      ? {
          type: error.type,
          message: error.message,
          statusCode: error.statusCode,
        }
      : undefined,
  }

  if (error) {
    console.error(`[${functionName}] Error:`, logData)
  } else {
    console.log(`[${functionName}] Success:`, logData)
  }
}

// Sanitize sensitive data for logging
export function sanitizeForLog(data: any): any {
  if (!data || typeof data !== 'object') {
    return data
  }

  const sensitiveKeys = [
    'password',
    'token',
    'apiKey',
    'secret',
    'key',
    'authorization',
    'cookie',
    'session',
  ]

  const sanitized = { ...data }

  for (const key of Object.keys(sanitized)) {
    if (
      sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
    ) {
      sanitized[key] = '[REDACTED]'
    }
  }

  return sanitized
}

// Rate limiting utilities (simple in-memory store for demo)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  requests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = identifier

  const current = rateLimitStore.get(key)

  if (!current || now > current.resetTime) {
    // First request or window expired
    const resetTime = now + windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: requests - 1, resetTime }
  }

  if (current.count >= requests) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: current.resetTime }
  }

  // Increment count
  current.count++
  rateLimitStore.set(key, current)

  return {
    allowed: true,
    remaining: requests - current.count,
    resetTime: current.resetTime,
  }
}

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute
