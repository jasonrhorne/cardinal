/**
 * Netlify Functions Templates
 * Pre-built function templates for common Cardinal use cases
 */

import { z } from 'zod'

import { createFunction } from './middleware'
import { HTTP_STATUS, type FunctionMetadata } from './types'
import { createSuccessResponse, createFunctionError } from './utils'

// Template for simple GET endpoint
export function createGetEndpoint<TQuery = any>(config: {
  functionName: string
  description: string
  querySchema?: z.ZodType<TQuery>
  handler: (query: TQuery, context: any) => Promise<any>
  metadata?: Partial<FunctionMetadata>
}) {
  const functionConfig: any = {
    functionName: config.functionName,
    allowedMethods: ['GET'],
  }

  if (config.querySchema) {
    functionConfig.validation = { query: config.querySchema }
  }

  return createFunction(async (event, context) => {
    const query = event.validatedQuery || context.query
    const result = await config.handler(query, context)
    return createSuccessResponse(
      result,
      `${config.functionName} executed successfully`
    )
  }, functionConfig)
}

// Template for simple POST endpoint
export function createPostEndpoint<TBody = any, TResponse = any>(config: {
  functionName: string
  description: string
  bodySchema: z.ZodType<TBody>
  handler: (body: TBody, context: any) => Promise<TResponse>
  requireAuth?: boolean
  rateLimit?: { requests: number; windowMs: number }
  metadata?: Partial<FunctionMetadata>
}) {
  const functionConfig: any = {
    functionName: config.functionName,
    allowedMethods: ['POST'],
    validation: { body: config.bodySchema },
  }

  if (config.requireAuth) {
    functionConfig.requireAuth = config.requireAuth
  }

  if (config.rateLimit) {
    functionConfig.rateLimit = config.rateLimit
  }

  return createFunction(async (event, context) => {
    const body = event.validatedBody
    const result = await config.handler(body, context)
    return createSuccessResponse(
      result,
      `${config.functionName} executed successfully`
    )
  }, functionConfig)
}

// Template for CRUD endpoint
export function createCrudEndpoint<
  TCreateBody = any,
  TUpdateBody = any,
  TResponse = any,
>(config: {
  functionName: string
  description: string
  createSchema?: z.ZodType<TCreateBody>
  updateSchema?: z.ZodType<TUpdateBody>
  handlers: {
    get?: (id: string, context: any) => Promise<TResponse>
    list?: (query: any, context: any) => Promise<TResponse[]>
    create?: (body: TCreateBody, context: any) => Promise<TResponse>
    update?: (id: string, body: TUpdateBody, context: any) => Promise<TResponse>
    delete?: (id: string, context: any) => Promise<{ success: boolean }>
  }
  requireAuth?: boolean
  metadata?: Partial<FunctionMetadata>
}) {
  return createFunction(
    async (event, context) => {
      const method = context.method
      const pathSegments = context.path.split('/').filter(Boolean)
      const resourceId = pathSegments[pathSegments.length - 1]

      switch (method) {
        case 'GET':
          if (resourceId && resourceId !== config.functionName) {
            // Get single resource
            if (!config.handlers.get) {
              throw createFunctionError(
                'not_found_error',
                'Get operation not supported'
              )
            }
            const result = await config.handlers.get(resourceId, context)
            return createSuccessResponse(
              result,
              'Resource retrieved successfully'
            )
          } else {
            // List resources
            if (!config.handlers.list) {
              throw createFunctionError(
                'not_found_error',
                'List operation not supported'
              )
            }
            const query = event.validatedQuery || context.query
            const result = await config.handlers.list(query, context)
            return createSuccessResponse(
              result,
              'Resources listed successfully'
            )
          }

        case 'POST':
          if (!config.handlers.create) {
            throw createFunctionError(
              'not_found_error',
              'Create operation not supported'
            )
          }
          const createBody = event.validatedBody
          const created = await config.handlers.create(createBody, context)
          return createSuccessResponse(
            created,
            'Resource created successfully',
            HTTP_STATUS.CREATED
          )

        case 'PUT':
        case 'PATCH':
          if (!config.handlers.update) {
            throw createFunctionError(
              'not_found_error',
              'Update operation not supported'
            )
          }
          if (!resourceId || resourceId === config.functionName) {
            throw createFunctionError(
              'validation_error',
              'Resource ID required for update'
            )
          }
          const updateBody = event.validatedBody
          const updated = await config.handlers.update(
            resourceId,
            updateBody,
            context
          )
          return createSuccessResponse(updated, 'Resource updated successfully')

        case 'DELETE':
          if (!config.handlers.delete) {
            throw createFunctionError(
              'not_found_error',
              'Delete operation not supported'
            )
          }
          if (!resourceId || resourceId === config.functionName) {
            throw createFunctionError(
              'validation_error',
              'Resource ID required for deletion'
            )
          }
          const deleted = await config.handlers.delete(resourceId, context)
          return createSuccessResponse(deleted, 'Resource deleted successfully')

        default:
          throw createFunctionError(
            'method_not_allowed_error',
            `Method ${method} not supported`
          )
      }
    },
    (() => {
      const functionConfig: any = {
        functionName: config.functionName,
        allowedMethods: Object.keys(config.handlers).map(op => {
          switch (op) {
            case 'get':
            case 'list':
              return 'GET'
            case 'create':
              return 'POST'
            case 'update':
              return 'PUT'
            case 'delete':
              return 'DELETE'
            default:
              return 'GET'
          }
        }),
      }

      if (config.requireAuth) {
        functionConfig.requireAuth = config.requireAuth
      }

      if (config.createSchema || config.updateSchema) {
        functionConfig.validation = {
          body: config.createSchema || config.updateSchema,
        }
      }

      return functionConfig
    })()
  )
}

// Template for AI/LLM endpoint
export function createAIEndpoint<TInput = any, TOutput = any>(config: {
  functionName: string
  description: string
  inputSchema: z.ZodType<TInput>
  outputSchema?: z.ZodType<TOutput>
  handler: (input: TInput, context: any) => Promise<TOutput>
  requireAuth?: boolean
  rateLimit?: { requests: number; windowMs: number }
  timeout?: number
  metadata?: Partial<FunctionMetadata>
}) {
  return createFunction(
    async (event, context) => {
      const input = event.validatedBody
      let result = await config.handler(input, context)

      // Validate output if schema provided
      if (config.outputSchema) {
        try {
          result = config.outputSchema.parse(result) as Awaited<TOutput>
        } catch (error) {
          console.error(
            `[${config.functionName}] Output validation failed:`,
            error
          )
          throw createFunctionError(
            'internal_error',
            'AI service returned invalid response format',
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            {
              validationError:
                error instanceof z.ZodError ? error.issues : error,
            }
          )
        }
      }

      return createSuccessResponse(
        result,
        `${config.functionName} completed successfully`
      )
    },
    (() => {
      const functionConfig: any = {
        functionName: config.functionName,
        allowedMethods: ['POST'],
        rateLimit: config.rateLimit || { requests: 10, windowMs: 60000 },
        timeout: config.timeout || 30000,
        validation: { body: config.inputSchema },
        logLevel: 'debug',
      }

      if (config.requireAuth) {
        functionConfig.requireAuth = config.requireAuth
      }

      return functionConfig
    })()
  )
}

// Template for webhook endpoint
export function createWebhookEndpoint<TPayload = any>(config: {
  functionName: string
  description: string
  payloadSchema?: z.ZodType<TPayload>
  handler: (
    payload: TPayload,
    headers: Record<string, string>,
    context: any
  ) => Promise<any>
  verifySignature?: (
    payload: string,
    signature: string,
    secret: string
  ) => boolean
  webhookSecret?: string
  metadata?: Partial<FunctionMetadata>
}) {
  return createFunction(
    async (event, context) => {
      // Verify webhook signature if configured
      if (config.verifySignature && config.webhookSecret) {
        const signature =
          context.headers['x-signature'] ||
          context.headers['x-hub-signature-256']
        if (!signature) {
          throw createFunctionError(
            'authentication_error',
            'Webhook signature missing'
          )
        }

        const isValid = config.verifySignature(
          event.body || '',
          signature,
          config.webhookSecret
        )
        if (!isValid) {
          throw createFunctionError(
            'authentication_error',
            'Invalid webhook signature'
          )
        }
      }

      const payload =
        event.validatedBody || (event.body ? JSON.parse(event.body) : {})
      const result = await config.handler(payload, context.headers, context)

      return createSuccessResponse(
        result || { received: true },
        'Webhook processed successfully'
      )
    },
    (() => {
      const functionConfig: any = {
        functionName: config.functionName,
        allowedMethods: ['POST'],
        logLevel: 'debug',
      }

      if (config.payloadSchema) {
        functionConfig.validation = { body: config.payloadSchema }
      }

      return functionConfig
    })()
  )
}

// Template for health check endpoint
export function createHealthCheckEndpoint(config?: {
  functionName?: string
  checks?: Record<string, () => Promise<boolean>>
}) {
  return createFunction(
    async (_event, _context) => {
      const functionName = config?.functionName || 'health-check'
      const checks = config?.checks || {}

      const results: Record<string, boolean> = {}
      let allHealthy = true

      // Run health checks
      for (const [name, check] of Object.entries(checks)) {
        try {
          results[name] = await check()
          if (!results[name]) {
            allHealthy = false
          }
        } catch (error) {
          results[name] = false
          allHealthy = false
          console.error(`Health check '${name}' failed:`, error)
        }
      }

      const response = {
        status: allHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        function: functionName,
        checks: Object.keys(checks).length > 0 ? results : undefined,
      }

      return createSuccessResponse(
        response,
        allHealthy ? 'All systems operational' : 'Some systems are unhealthy',
        allHealthy ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE
      )
    },
    {
      functionName: config?.functionName || 'health-check',
      allowedMethods: ['GET'],
    }
  )
}

// Export all templates for easy access
export const templates = {
  get: createGetEndpoint,
  post: createPostEndpoint,
  crud: createCrudEndpoint,
  ai: createAIEndpoint,
  webhook: createWebhookEndpoint,
  healthCheck: createHealthCheckEndpoint,
}
