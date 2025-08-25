/**
 * Cardinal Error Handling Types
 * Comprehensive error classification and typing system
 */

import { z } from 'zod'

// Core error categories
export type ErrorCategory =
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'rate_limit'
  | 'timeout'
  | 'external_api'
  | 'database'
  | 'ai_service'
  | 'network'
  | 'internal'

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

// Error contexts - where the error occurred
export type ErrorContext =
  | 'client'
  | 'server'
  | 'function'
  | 'database'
  | 'external_api'
  | 'ai_service'

// Base error interface
export interface BaseError extends Error {
  id: string
  category: ErrorCategory
  severity: ErrorSeverity
  context: ErrorContext
  statusCode?: number
  details?: Record<string, any>
  timestamp: string
  userId?: string
  requestId?: string
  sessionId?: string
  stack?: string
  cause?: Error | undefined
}

// Validation error details
export interface ValidationErrorDetail {
  field: string
  code: string
  message: string
  received?: any
  expected?: any
}

// External API error details
export interface ExternalApiErrorDetail {
  service: string
  endpoint: string
  method: string
  statusCode?: number | undefined
  response?: any
  rateLimited?: boolean | undefined
}

// Database error details
export interface DatabaseErrorDetail {
  operation: string
  table?: string | undefined
  query?: string | undefined
  constraint?: string | undefined
}

// AI service error details
export interface AiServiceErrorDetail {
  provider: 'anthropic' | 'openai'
  model: string
  operation: 'completion' | 'embedding' | 'function_call'
  tokenCount?: number | undefined
  rateLimited?: boolean | undefined
}

// Specific error classes
export class CardinalError extends Error implements BaseError {
  readonly id: string
  readonly category: ErrorCategory
  readonly severity: ErrorSeverity
  readonly context: ErrorContext
  readonly statusCode?: number | undefined
  readonly details?: Record<string, any> | undefined
  readonly timestamp: string
  readonly userId?: string | undefined
  readonly requestId?: string | undefined
  readonly sessionId?: string | undefined

  constructor(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity = 'medium',
    context: ErrorContext = 'server',
    options: {
      statusCode?: number | undefined
      details?: Record<string, any> | undefined
      userId?: string | undefined
      requestId?: string | undefined
      sessionId?: string | undefined
      cause?: Error | undefined
    } = {}
  ) {
    super(message, { cause: options.cause })

    this.name = 'CardinalError'
    this.id = crypto.randomUUID()
    this.category = category
    this.severity = severity
    this.context = context
    this.statusCode = options.statusCode
    this.details = options.details
    this.timestamp = new Date().toISOString()
    this.userId = options.userId
    this.requestId = options.requestId
    this.sessionId = options.sessionId

    // Maintain stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CardinalError)
    }
  }
}

// Validation error class
export class ValidationError extends CardinalError {
  readonly validationErrors: ValidationErrorDetail[]

  constructor(
    message: string,
    validationErrors: ValidationErrorDetail[],
    options: {
      userId?: string
      requestId?: string
      sessionId?: string
    } = {}
  ) {
    super(message, 'validation', 'low', 'server', {
      statusCode: 400,
      details: { validationErrors },
      ...options,
    })

    this.name = 'ValidationError'
    this.validationErrors = validationErrors
  }
}

// Authentication error class
export class AuthenticationError extends CardinalError {
  constructor(
    message: string = 'Authentication required',
    options: {
      userId?: string
      requestId?: string
      sessionId?: string
      cause?: Error
    } = {}
  ) {
    super(message, 'authentication', 'medium', 'server', {
      statusCode: 401,
      ...options,
    })

    this.name = 'AuthenticationError'
  }
}

// Authorization error class
export class AuthorizationError extends CardinalError {
  constructor(
    message: string = 'Access denied',
    options: {
      userId?: string
      requestId?: string
      sessionId?: string
      cause?: Error
    } = {}
  ) {
    super(message, 'authorization', 'medium', 'server', {
      statusCode: 403,
      ...options,
    })

    this.name = 'AuthorizationError'
  }
}

// External API error class
export class ExternalApiError extends CardinalError {
  readonly apiDetails: ExternalApiErrorDetail

  constructor(
    message: string,
    apiDetails: ExternalApiErrorDetail,
    options: {
      userId?: string
      requestId?: string
      sessionId?: string
      cause?: Error
    } = {}
  ) {
    super(message, 'external_api', 'high', 'external_api', {
      statusCode: apiDetails.statusCode || 502,
      details: { apiDetails },
      ...options,
    })

    this.name = 'ExternalApiError'
    this.apiDetails = apiDetails
  }
}

// Database error class
export class DatabaseError extends CardinalError {
  readonly dbDetails: DatabaseErrorDetail

  constructor(
    message: string,
    dbDetails: DatabaseErrorDetail,
    options: {
      userId?: string
      requestId?: string
      sessionId?: string
      cause?: Error
    } = {}
  ) {
    super(message, 'database', 'high', 'database', {
      statusCode: 500,
      details: { dbDetails },
      ...options,
    })

    this.name = 'DatabaseError'
    this.dbDetails = dbDetails
  }
}

// AI service error class
export class AiServiceError extends CardinalError {
  readonly aiDetails: AiServiceErrorDetail

  constructor(
    message: string,
    aiDetails: AiServiceErrorDetail,
    options: {
      userId?: string
      requestId?: string
      sessionId?: string
      cause?: Error
    } = {}
  ) {
    const severity: ErrorSeverity = aiDetails.rateLimited ? 'medium' : 'high'
    const statusCode = aiDetails.rateLimited ? 429 : 502

    super(message, 'ai_service', severity, 'ai_service', {
      statusCode,
      details: { aiDetails },
      ...options,
    })

    this.name = 'AiServiceError'
    this.aiDetails = aiDetails
  }
}

// Error response schema for API responses
export const errorResponseSchema = z.object({
  status: z.literal('error'),
  error: z.object({
    id: z.string(),
    message: z.string(),
    category: z.string(),
    severity: z.string(),
    context: z.string(),
    timestamp: z.string(),
    statusCode: z.number().optional(),
    details: z.record(z.any()).optional(),
  }),
  requestId: z.string().optional(),
  timestamp: z.string(),
})

export type ErrorResponse = z.infer<typeof errorResponseSchema>

// Error reporting configuration
export interface ErrorReportingConfig {
  enabled: boolean
  services: {
    sentry?: {
      dsn: string
      environment: string
      sampleRate: number
    }
    logflare?: {
      apiKey: string
      sourceToken: string
    }
    webhook?: {
      url: string
      headers?: Record<string, string>
    }
  }
  filters: {
    minSeverity: ErrorSeverity
    excludeCategories?: ErrorCategory[]
    includeUserData: boolean
    includeSensitiveData: boolean
  }
}
