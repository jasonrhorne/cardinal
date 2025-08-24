/**
 * Netlify Functions Type Definitions
 * Standardized types for Cardinal serverless functions
 */

// Handler type imported but may not be used directly in this file
import { z } from 'zod'

// Standard API response structure
export const apiResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  message: z.string(),
  data: z.any().optional(),
  error: z.string().optional(),
  details: z.any().optional(),
  timestamp: z.string(),
})

export type TApiResponse = z.infer<typeof apiResponseSchema>

// Function context with enhanced properties
export interface TFunctionContext {
  requestId: string
  userId?: string
  sessionId?: string
  userAgent?: string
  ip?: string
  timestamp: string
  method: string
  path: string
  query: Record<string, string>
  headers: Record<string, string>
}

// Error types for functions
export type FunctionErrorType =
  | 'validation_error'
  | 'authentication_error'
  | 'authorization_error'
  | 'rate_limit_error'
  | 'internal_error'
  | 'not_found_error'
  | 'method_not_allowed_error'
  | 'timeout_error'
  | 'external_api_error'

export interface FunctionError extends Error {
  type: FunctionErrorType
  statusCode: number
  details?: any
  requestId?: string
}

// Function configuration options
export interface FunctionConfig {
  allowedMethods?: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS')[]
  requireAuth?: boolean
  rateLimit?: {
    requests: number
    windowMs: number
  }
  timeout?: number
  cors?: {
    origin?: string | string[]
    methods?: string[]
    headers?: string[]
    credentials?: boolean
  }
  validation?: {
    body?: z.ZodType
    query?: z.ZodType
    headers?: z.ZodType
  }
}

// Standard function handler type with enhanced context
export type EnhancedHandler = (
  event: any,
  context: TFunctionContext
) => Promise<{
  statusCode: number
  headers: Record<string, string>
  body: string
}>

// Function metadata for documentation
export interface FunctionMetadata {
  name: string
  description: string
  version: string
  author: string
  tags: string[]
  examples?: Array<{
    title: string
    request: any
    response: any
  }>
  schema?: {
    input?: z.ZodType
    output?: z.ZodType
  }
}

// Standard HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const

export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS]

// Common CORS headers
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
} as const

// Security headers
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
} as const
