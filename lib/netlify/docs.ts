/**
 * API Documentation Generator
 * Automatic OpenAPI documentation for Cardinal functions
 */

import { z } from 'zod'

import { type FunctionMetadata, HTTP_STATUS } from './types'

export interface ApiEndpoint {
  path: string
  method: string
  summary: string
  description?: string
  tags?: string[]
  parameters?: ApiParameter[]
  requestBody?: ApiRequestBody
  responses: ApiResponse[]
  security?: ApiSecurity[]
  examples?: ApiExample[]
}

export interface ApiParameter {
  name: string
  in: 'query' | 'path' | 'header'
  description?: string
  required?: boolean
  schema: any
}

export interface ApiRequestBody {
  description?: string
  required?: boolean
  content: {
    'application/json': {
      schema: any
      examples?: Record<string, any>
    }
  }
}

export interface ApiResponse {
  status: number
  description: string
  content?: {
    'application/json': {
      schema: any
      examples?: Record<string, any>
    }
  }
}

export interface ApiSecurity {
  type: 'bearer' | 'apiKey'
  description?: string
}

export interface ApiExample {
  title: string
  description?: string
  request?: any
  response?: any
}

// Convert Zod schema to JSON Schema (simplified)
function zodToJsonSchema(schema: z.ZodType): any {
  if (schema instanceof z.ZodString) {
    return { type: 'string' }
  }
  if (schema instanceof z.ZodNumber) {
    return { type: 'number' }
  }
  if (schema instanceof z.ZodBoolean) {
    return { type: 'boolean' }
  }
  if (schema instanceof z.ZodArray) {
    return {
      type: 'array',
      items: zodToJsonSchema(schema.element as z.ZodType),
    }
  }
  if (schema instanceof z.ZodObject) {
    const properties: Record<string, any> = {}
    const required: string[] = []

    Object.entries(schema.shape).forEach(([key, value]) => {
      properties[key] = zodToJsonSchema(value as z.ZodType)
      if (!(value as any)._def.optional) {
        required.push(key)
      }
    })

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    }
  }
  if (schema instanceof z.ZodEnum) {
    return {
      type: 'string',
      enum: schema.options,
    }
  }
  if (schema instanceof z.ZodOptional) {
    return zodToJsonSchema(schema.unwrap() as z.ZodType)
  }
  if (schema instanceof z.ZodDefault) {
    const baseSchema = zodToJsonSchema(schema.removeDefault() as z.ZodType)
    return {
      ...baseSchema,
      default: (schema._def as any).defaultValue(),
    }
  }

  // Fallback
  return { type: 'object' }
}

// Generate OpenAPI documentation
export function generateOpenApiDoc(endpoints: ApiEndpoint[]) {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Cardinal API',
      description: 'AI-powered travel itinerary generator API',
      version: '1.0.0',
      contact: {
        name: 'Cardinal Team',
        email: 'support@cardinal.travel',
      },
    },
    servers: [
      {
        url: 'https://cardinal.netlify.app/.netlify/functions',
        description: 'Production server',
      },
      {
        url: 'http://localhost:8888/.netlify/functions',
        description: 'Development server',
      },
    ],
    paths: endpoints.reduce(
      (paths, endpoint) => {
        const path = endpoint.path
        if (!paths[path]) {
          paths[path] = {}
        }

        paths[path][endpoint.method.toLowerCase()] = {
          summary: endpoint.summary,
          description: endpoint.description,
          tags: endpoint.tags,
          parameters: endpoint.parameters?.map(param => ({
            name: param.name,
            in: param.in,
            description: param.description,
            required: param.required,
            schema: param.schema,
          })),
          requestBody: endpoint.requestBody,
          responses: endpoint.responses.reduce(
            (responses, response) => {
              responses[response.status.toString()] = {
                description: response.description,
                content: response.content,
              }
              return responses
            },
            {} as Record<string, any>
          ),
          security: endpoint.security?.map(sec => ({
            [sec.type]: [],
          })),
        }

        return paths
      },
      {} as Record<string, any>
    ),
    components: {
      securitySchemes: {
        bearer: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Supabase JWT token',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for authentication',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['success', 'error'],
            },
            message: {
              type: 'string',
            },
            data: {
              type: 'object',
            },
            error: {
              type: 'string',
            },
            details: {
              type: 'object',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['status', 'message', 'timestamp'],
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['error'],
            },
            message: {
              type: 'string',
            },
            error: {
              type: 'string',
            },
            details: {
              type: 'object',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['status', 'message', 'error', 'timestamp'],
        },
      },
    },
  }
}

// Create API documentation endpoint
export function createApiDocsEndpoint(endpoints: ApiEndpoint[]) {
  const openApiDoc = generateOpenApiDoc(endpoints)

  return async (event: any) => {
    const acceptHeader = event.headers?.accept || ''

    if (acceptHeader.includes('text/html')) {
      // Return Swagger UI HTML
      return {
        statusCode: HTTP_STATUS.OK,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600',
        },
        body: generateSwaggerUI(),
      }
    }

    // Return OpenAPI JSON
    return {
      statusCode: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
      body: JSON.stringify(openApiDoc, null, 2),
    }
  }
}

// Generate Swagger UI HTML
function generateSwaggerUI(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cardinal API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin:0;
      background: #fafafa;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: window.location.href.replace(/\\/docs.*$/, '') + '?format=json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>
  `.trim()
}

// Helper to create endpoint documentation from function metadata
export function createEndpointDocs(
  metadata: FunctionMetadata & {
    path: string
    method: string
    querySchema?: z.ZodType
    bodySchema?: z.ZodType
    responseSchema?: z.ZodType
    requireAuth?: boolean
  }
): ApiEndpoint {
  const parameters: ApiParameter[] = []
  let requestBody: ApiRequestBody | undefined

  // Add query parameters
  if (metadata.querySchema) {
    const schema = zodToJsonSchema(metadata.querySchema)
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([name, propSchema]) => {
        parameters.push({
          name,
          in: 'query',
          required: schema.required?.includes(name),
          schema: propSchema,
        })
      })
    }
  }

  // Add request body
  if (metadata.bodySchema) {
    requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: zodToJsonSchema(metadata.bodySchema),
        },
      },
    }
  }

  // Create responses
  const responses: ApiResponse[] = [
    {
      status: HTTP_STATUS.OK,
      description: 'Success',
      content: {
        'application/json': {
          schema: metadata.responseSchema
            ? zodToJsonSchema(metadata.responseSchema)
            : {
                $ref: '#/components/schemas/ApiResponse',
              },
        },
      },
    },
    {
      status: HTTP_STATUS.BAD_REQUEST,
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
        },
      },
    },
    {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
        },
      },
    },
  ]

  // Add auth-specific responses
  if (metadata.requireAuth) {
    responses.push({
      status: HTTP_STATUS.UNAUTHORIZED,
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
        },
      },
    })
  }

  const endpoint: ApiEndpoint = {
    path: metadata.path,
    method: metadata.method,
    summary: metadata.name,
    description: metadata.description,
    tags: metadata.tags,
    responses,
  }

  if (parameters.length > 0) {
    endpoint.parameters = parameters
  }

  if (requestBody) {
    endpoint.requestBody = requestBody
  }

  if (metadata.requireAuth) {
    endpoint.security = [{ type: 'bearer' }]
  }

  if (metadata.examples) {
    endpoint.examples = metadata.examples
  }

  return endpoint
}
