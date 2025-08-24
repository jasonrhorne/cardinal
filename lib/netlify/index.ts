/**
 * Netlify Functions Scaffolding
 * Complete serverless function framework for Cardinal
 */

// Core utilities
export {
  createFunctionContext,
  createFunctionError,
  createSuccessResponse,
  createErrorResponse,
  handleCORSPreflight,
  validateRequestBody,
  validateQueryParams,
  validateMethod,
  parseAuthHeader,
  logFunctionCall,
  sanitizeForLog,
  checkRateLimit,
} from './utils'

// Middleware
export {
  withAuth,
  withRateLimit,
  withValidation,
  withMethodValidation,
  withLogging,
  withTimeout,
  compose,
  createFunction,
  type Middleware,
} from './middleware'

// Templates
export {
  createGetEndpoint,
  createPostEndpoint,
  createCrudEndpoint,
  createAIEndpoint,
  createWebhookEndpoint,
  createHealthCheckEndpoint,
  templates,
} from './templates'

// Types
export {
  type TApiResponse,
  type TFunctionContext,
  type FunctionError,
  type FunctionErrorType,
  type FunctionConfig,
  type EnhancedHandler,
  type FunctionMetadata,
  type HttpStatusCode,
  HTTP_STATUS,
  CORS_HEADERS,
  SECURITY_HEADERS,
  apiResponseSchema,
} from './types'

// Re-export common dependencies
export { z } from 'zod'
export type { Handler } from '@netlify/functions'

// Utility functions for common patterns
export function createApiRoute<TInput = any, TOutput = any>(config: {
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  handler: (input: TInput, context: any) => Promise<TOutput>
  inputSchema?: any
  requireAuth?: boolean
  rateLimit?: { requests: number; windowMs: number }
}) {
  const { templates } = require('./templates')

  switch (config.method) {
    case 'GET':
      return templates.get({
        functionName: config.name,
        description: `${config.name} endpoint`,
        querySchema: config.inputSchema,
        handler: config.handler,
      })

    case 'POST':
      return templates.post({
        functionName: config.name,
        description: `${config.name} endpoint`,
        bodySchema: config.inputSchema,
        handler: config.handler,
        requireAuth: config.requireAuth,
        rateLimit: config.rateLimit,
      })

    default:
      throw new Error(`Method ${config.method} not supported in createApiRoute`)
  }
}

// Cardinal-specific helper functions
export function createTravelApiEndpoint<TInput = any, TOutput = any>(config: {
  name: string
  description: string
  inputSchema: any
  handler: (input: TInput, context: any) => Promise<TOutput>
  requireAuth?: boolean
  persona?: string
}) {
  const { templates } = require('./templates')

  return templates.ai({
    functionName: config.name,
    description: config.description,
    inputSchema: config.inputSchema,
    handler: config.handler,
    requireAuth: config.requireAuth || true, // Travel endpoints default to requiring auth
    rateLimit: { requests: 5, windowMs: 60000 }, // Conservative rate limiting for AI operations
    timeout: 45000, // 45 second timeout for travel AI operations
  })
}

export function createAuthenticatedEndpoint<
  TInput = any,
  TOutput = any,
>(config: {
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  inputSchema?: any
  handler: (input: TInput, context: any) => Promise<TOutput>
}) {
  return createApiRoute({
    ...config,
    requireAuth: true,
    rateLimit: { requests: 30, windowMs: 60000 }, // 30 requests per minute for authenticated endpoints
  })
}

export function createPublicEndpoint<TInput = any, TOutput = any>(config: {
  name: string
  method: 'GET' | 'POST'
  inputSchema?: any
  handler: (input: TInput, context: any) => Promise<TOutput>
}) {
  return createApiRoute({
    ...config,
    requireAuth: false,
    rateLimit: { requests: 10, windowMs: 60000 }, // 10 requests per minute for public endpoints
  })
}
