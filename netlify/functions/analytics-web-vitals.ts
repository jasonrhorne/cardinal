/**
 * Web Vitals Analytics Collection
 * Netlify function to collect and store Web Vitals performance data
 */

import { Handler } from '@netlify/functions'
import { z } from 'zod'
import { withErrorHandling } from '../../lib/netlify/error-handler'
import {
  createSuccessResponse,
  createErrorResponse,
  handleCORSPreflight,
} from '../../lib/netlify/utils'
import type { TFunctionContext } from '../../lib/netlify/types'
import { logger } from '../../lib/logging/logger'

// Web Vitals data schema
const webVitalSchema = z.object({
  name: z.enum(['CLS', 'FID', 'FCP', 'LCP', 'TTFB', 'INP']),
  value: z.number(),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  delta: z.number(),
  id: z.string(),
  navigationType: z.enum(['navigate', 'reload', 'back_forward', 'prerender']),
})

const analyticsRequestSchema = z.object({
  type: z.literal('web-vitals'),
  metric: webVitalSchema,
  url: z.string().url(),
  userAgent: z.string(),
  timestamp: z.string(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
})

type AnalyticsRequest = z.infer<typeof analyticsRequestSchema>

// In-memory storage for demonstration (in production, use a database)
const performanceData: AnalyticsRequest[] = []
const MAX_STORED_ENTRIES = 1000

// Performance analytics handler
const analyticsWebVitals = async (
  event: any,
  context: TFunctionContext
): Promise<any> => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleCORSPreflight()
  }

  if (event.httpMethod !== 'POST') {
    return createErrorResponse(
      'Method not allowed',
      405,
      { method: event.httpMethod },
      context.requestId
    )
  }

  try {
    // Parse and validate request body
    const body = JSON.parse(event.body || '{}')
    const data = analyticsRequestSchema.parse(body)

    // Log the performance metric
    await logger.info('function', 'Web Vitals metric received', {
      metric: data.metric.name,
      value: data.metric.value,
      rating: data.metric.rating,
      url: data.url,
      userAgent: data.userAgent.substring(0, 100), // Truncate for logging
      navigationType: data.metric.navigationType,
    })

    // Store data (in production, this would go to a database)
    performanceData.push(data)

    // Keep only the most recent entries
    if (performanceData.length > MAX_STORED_ENTRIES) {
      performanceData.shift()
    }

    // Process the metric for alerts/monitoring
    await processPerformanceMetric(data)

    return createSuccessResponse(
      {
        stored: true,
        timestamp: new Date().toISOString(),
        totalMetrics: performanceData.length,
      },
      'Web Vitals metric recorded'
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'Invalid request data',
        400,
        { errors: error.issues },
        context.requestId
      )
    }

    return createErrorResponse(
      'Failed to process Web Vitals data',
      500,
      { error: (error as Error).message },
      context.requestId
    )
  }
}

// Process performance metric for monitoring/alerting
async function processPerformanceMetric(data: AnalyticsRequest): Promise<void> {
  const { metric } = data

  // Check for performance issues
  if (metric.rating === 'poor') {
    await logger.warn('function', `Poor Web Vital detected: ${metric.name}`, {
      metricName: metric.name,
      value: metric.value,
      rating: metric.rating,
      url: data.url,
      threshold: getPerformanceThreshold(metric.name),
    })

    // In production, you might want to:
    // - Send alerts to monitoring services
    // - Update performance dashboards
    // - Trigger performance optimization workflows
  }

  // Aggregate metrics for performance budgets
  const recentMetrics = performanceData
    .filter(entry => entry.metric.name === metric.name)
    .slice(-10) // Last 10 measurements

  if (recentMetrics.length >= 5) {
    const avgValue =
      recentMetrics.reduce((sum, entry) => sum + entry.metric.value, 0) /
      recentMetrics.length
    const poorCount = recentMetrics.filter(
      entry => entry.metric.rating === 'poor'
    ).length

    // Alert if more than 50% of recent metrics are poor
    if (poorCount > recentMetrics.length * 0.5) {
      await logger.error(
        'function',
        `Performance degradation detected: ${metric.name}`,
        {
          metricName: metric.name,
          averageValue: avgValue,
          poorPercentage: Math.round((poorCount / recentMetrics.length) * 100),
          sampleSize: recentMetrics.length,
        }
      )
    }
  }
}

// Get performance threshold for a metric
function getPerformanceThreshold(metricName: string): number {
  const thresholds: Record<string, number> = {
    LCP: 2500, // 2.5s
    FID: 100, // 100ms
    CLS: 0.1, // 0.1 score
    FCP: 1800, // 1.8s
    TTFB: 800, // 800ms
    INP: 200, // 200ms
  }

  return thresholds[metricName] || 0
}

// Export the handler with error handling wrapper
export const handler: Handler = withErrorHandling(analyticsWebVitals, {
  functionName: 'analytics-web-vitals',
  timeout: 10000,
  retries: 0,
})
