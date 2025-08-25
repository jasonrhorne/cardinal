/**
 * Cardinal Error Handling System - Main Export
 * Comprehensive error handling and logging infrastructure
 */

// Import error classes for utility functions
import {
  CardinalError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
} from './types'

// Core error types and classes
export type {
  ErrorCategory,
  ErrorSeverity,
  ErrorContext,
  BaseError,
  ValidationErrorDetail,
  ExternalApiErrorDetail,
  DatabaseErrorDetail,
  AiServiceErrorDetail,
  ErrorResponse,
  ErrorReportingConfig,
} from './types'

export {
  CardinalError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ExternalApiError,
  DatabaseError,
  AiServiceError,
  errorResponseSchema,
} from './types'

// Logging infrastructure
export type {
  LogLevel,
  LogContext,
  LogEntry,
  LoggerConfig,
  LogTransport,
  LogFormatter,
  LogFilter,
} from '../logging/logger'

export { Logger, createLogger, getLogger, logger } from '../logging/logger'

// Log transports
export {
  ConsoleTransport,
  FileTransport,
  HttpTransport,
  WebhookTransport,
  MemoryTransport,
  createDefaultTransports,
} from '../logging/transports'

// Error monitoring
export type {
  AlertRule,
  AlertChannel,
  ErrorEvent,
  ErrorStats,
  AlertNotification,
} from '../monitoring/error-monitor'

export {
  ErrorMonitor,
  getErrorMonitor,
  createDefaultAlertRules,
} from '../monitoring/error-monitor'

// Function error handling utilities
export {
  withErrorHandling,
  createValidationError,
  createExternalApiError,
  createDatabaseError,
  createAiServiceError,
  CircuitBreaker,
  withRetry,
  ErrorAggregator,
  measureFunctionPerformance,
} from '../netlify/error-handler'

// React error boundaries
export {
  ErrorBoundary,
  withErrorBoundary,
  useErrorHandler,
  setupGlobalErrorHandlers,
} from '../../components/error-boundary'

// Utility functions for common error scenarios
export function isRetryableError(error: unknown): boolean {
  if (error instanceof CardinalError) {
    return (
      error.category === 'timeout' ||
      error.category === 'network' ||
      error.category === 'rate_limit' ||
      (error.category === 'external_api' &&
        error.statusCode &&
        error.statusCode >= 500)
    )
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('rate limit')
    )
  }

  return false
}

export function getErrorHttpStatus(error: unknown): number {
  if (error instanceof CardinalError && error.statusCode) {
    return error.statusCode
  }

  // Default to 500 for unknown errors
  return 500
}

export function sanitizeErrorForClient(error: unknown): {
  message: string
  type?: string
  details?: any
} {
  if (error instanceof CardinalError) {
    return {
      message: error.message,
      type: error.category,
      details:
        process.env.NODE_ENV === 'development' ? error.details : undefined,
    }
  }

  if (error instanceof Error) {
    return {
      message:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'An unexpected error occurred',
    }
  }

  return {
    message: 'An unexpected error occurred',
  }
}

// Error context helpers
export function createErrorContext(request?: {
  url?: string
  method?: string
  headers?: Record<string, string>
  userId?: string
  sessionId?: string
  requestId?: string
}): {
  userId?: string
  sessionId?: string
  requestId?: string
  url?: string
  userAgent?: string
  ip?: string
} {
  return {
    userId: request?.userId,
    sessionId: request?.sessionId,
    requestId: request?.requestId || crypto.randomUUID(),
    url: request?.url,
    userAgent: request?.headers?.['user-agent'],
    ip:
      request?.headers?.['x-forwarded-for'] || request?.headers?.['x-real-ip'],
  }
}

// Pre-configured error instances for common scenarios
export const CommonErrors = {
  notFound: (resource: string = 'Resource') =>
    new CardinalError(`${resource} not found`, 'not_found', 'low', 'server', {
      statusCode: 404,
    }),

  unauthorized: (message: string = 'Authentication required') =>
    new AuthenticationError(message),

  forbidden: (message: string = 'Access denied') =>
    new AuthorizationError(message),

  rateLimited: (retryAfter?: number) =>
    new CardinalError('Rate limit exceeded', 'rate_limit', 'medium', 'server', {
      statusCode: 429,
      details: retryAfter ? { retryAfter } : undefined,
    }),

  serviceUnavailable: (service?: string) =>
    new CardinalError(
      `${service || 'Service'} temporarily unavailable`,
      'external_api',
      'high',
      'external_api',
      { statusCode: 503 }
    ),

  validationFailed: (field: string, message: string) =>
    new ValidationError(`Validation failed for ${field}`, [
      {
        field,
        code: 'invalid',
        message,
      },
    ]),
} as const

// Development-only error helpers
if (process.env.NODE_ENV === 'development') {
  // Add development-specific utilities
  ;(global as any).__CARDINAL_ERROR_HELPERS = {
    throwTestError: () => {
      throw new CardinalError(
        'This is a test error for development',
        'internal',
        'low',
        'server'
      )
    },

    logTestMessages: async () => {
      const { logger } = await import('../logging/logger')
      await logger.debug('app', 'Debug message')
      await logger.info('app', 'Info message')
      await logger.warn('app', 'Warning message')
      await logger.error('app', 'Error message')
    },

    getErrorStats: () => {
      const { getErrorMonitor } = require('../monitoring/error-monitor')
      return getErrorMonitor().getErrorStats()
    },

    clearErrorHistory: () => {
      // Clear monitoring history in development
      const { getErrorMonitor } = require('../monitoring/error-monitor')
      const monitor = getErrorMonitor()
      ;(monitor as any).events = []
    },
  }
}
