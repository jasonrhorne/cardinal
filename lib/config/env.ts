/**
 * Environment Configuration with Type Safety and Validation
 * 
 * This module provides:
 * - Type-safe environment variable access
 * - Runtime validation of required variables
 * - Environment-specific configurations
 * - Client/server variable separation
 */

import { z } from 'zod'

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

// Server-side environment schema (secrets, never exposed to client)
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  
  // Database
  DATABASE_URL: z.string().optional(),
  DATABASE_DIRECT_URL: z.string().optional(),
  DATABASE_POOL_MAX: z.coerce.number().default(10),
  DATABASE_POOL_MIN: z.coerce.number().default(2),
  
  // Authentication
  AUTH0_SECRET: z.string().optional(),
  AUTH0_ISSUER_BASE_URL: z.string().url().optional(),
  AUTH0_CLIENT_ID: z.string().optional(),
  AUTH0_CLIENT_SECRET: z.string().optional(),
  
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  
  // AI/LLM APIs
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_ORG_ID: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  
  // Google Services
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
  GOOGLE_CLOUD_CREDENTIALS: z.string().optional(),
  
  // Email Services
  SENDGRID_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  
  // Security
  JWT_SECRET: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  
  // Rate Limiting
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  DATADOG_API_KEY: z.string().optional(),
  
  // Development
  DEBUG: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Testing
  TEST_DATABASE_URL: z.string().optional(),
})

// Client-side environment schema (public, exposed to browser)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  NEXT_PUBLIC_APP_VERSION: z.string().default('0.1.0'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000/api'),
  
  // Public keys only (never secrets)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  
  // Feature flags
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.coerce.boolean().default(false),
  NEXT_PUBLIC_ENABLE_BETA_FEATURES: z.coerce.boolean().default(false),
  NEXT_PUBLIC_ENABLE_DEBUG_MODE: z.coerce.boolean().default(false),
  
  // CDN & Assets
  NEXT_PUBLIC_CDN_URL: z.string().url().optional(),
  NEXT_PUBLIC_ASSETS_URL: z.string().url().optional(),
})

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

/**
 * Validates and parses server environment variables
 * Only call this on the server side!
 */
export function getServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env)
  
  if (!parsed.success) {
    console.error('❌ Invalid server environment variables:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid server environment variables')
  }
  
  return parsed.data
}

/**
 * Validates and parses client environment variables
 * Safe to call on both client and server
 */
export function getClientEnv() {
  const parsed = clientEnvSchema.safeParse(process.env)
  
  if (!parsed.success) {
    console.error('❌ Invalid client environment variables:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid client environment variables')
  }
  
  return parsed.data
}

// =============================================================================
// ENVIRONMENT-SPECIFIC CONFIGURATIONS
// =============================================================================

export const isDevelopment = process.env.NODE_ENV === 'development'
export const isStaging = process.env.NEXT_PUBLIC_APP_ENV === 'staging'
export const isProduction = process.env.NODE_ENV === 'production'

// Configuration that changes based on environment
export const config = {
  app: {
    name: 'Cardinal',
    description: 'AI-powered travel itinerary generator',
    version: getClientEnv().NEXT_PUBLIC_APP_VERSION,
    url: getClientEnv().NEXT_PUBLIC_APP_URL,
  },
  
  api: {
    baseUrl: getClientEnv().NEXT_PUBLIC_API_URL,
    timeout: isDevelopment ? 30000 : 10000, // Longer timeout in dev
  },
  
  features: {
    analytics: getClientEnv().NEXT_PUBLIC_ENABLE_ANALYTICS,
    betaFeatures: getClientEnv().NEXT_PUBLIC_ENABLE_BETA_FEATURES,
    debugMode: getClientEnv().NEXT_PUBLIC_ENABLE_DEBUG_MODE,
  },
  
  // Database configuration (server-only)
  database: {
    poolMax: isDevelopment ? 5 : getServerEnv().DATABASE_POOL_MAX,
    poolMin: getServerEnv().DATABASE_POOL_MIN,
  },
  
  // Logging configuration
  logging: {
    level: isDevelopment ? 'debug' : getServerEnv().LOG_LEVEL,
    enableConsole: isDevelopment,
    enableFile: isProduction,
  },
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Safely gets an environment variable with optional default
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key]
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value || defaultValue!
}

/**
 * Gets a required environment variable or throws an error
 */
export function getRequiredEnvVar(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

/**
 * Validates that all required environment variables are set for a given feature
 */
export function validateFeatureEnv(featureName: string, requiredVars: string[]): void {
  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    throw new Error(
      `❌ ${featureName} is missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    )
  }
  
  console.log(`✅ ${featureName} environment variables validated`)
}

// =============================================================================
// FEATURE-SPECIFIC VALIDATION HELPERS
// =============================================================================

/**
 * Validates OpenAI configuration
 */
export function validateOpenAIEnv(): void {
  validateFeatureEnv('OpenAI', ['OPENAI_API_KEY'])
}

/**
 * Validates Google Maps/Places configuration
 */
export function validateGoogleMapsEnv(): void {
  validateFeatureEnv('Google Maps', ['GOOGLE_MAPS_API_KEY', 'GOOGLE_PLACES_API_KEY'])
}

/**
 * Validates Auth0 configuration
 */
export function validateAuth0Env(): void {
  validateFeatureEnv('Auth0', [
    'AUTH0_SECRET',
    'AUTH0_ISSUER_BASE_URL', 
    'AUTH0_CLIENT_ID',
    'AUTH0_CLIENT_SECRET'
  ])
}

/**
 * Validates database configuration
 */
export function validateDatabaseEnv(): void {
  validateFeatureEnv('Database', ['DATABASE_URL'])
}

// =============================================================================
// TYPES
// =============================================================================

export type ServerEnv = z.infer<typeof serverEnvSchema>
export type ClientEnv = z.infer<typeof clientEnvSchema>
export type Environment = 'development' | 'staging' | 'production'