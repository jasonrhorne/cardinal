/**
 * Cardinal Web Vitals Monitoring
 * Client-side performance monitoring using web-vitals library
 */

import type { WebVitalsMetric } from './metrics'
import { getPerformanceRating } from './metrics'

// Web Vitals metric callback type
export type WebVitalCallback = (metric: WebVitalsMetric) => void

// Web Vitals configuration
export interface WebVitalsConfig {
  reportAllChanges?: boolean
  debug?: boolean
  sendToAnalytics?: boolean
  endpoint?: string
}

// Web Vitals collector class
export class WebVitalsCollector {
  private metrics: Map<string, WebVitalsMetric> = new Map()
  private config: WebVitalsConfig
  private callbacks: Set<WebVitalCallback> = new Set()

  constructor(config: WebVitalsConfig = {}) {
    this.config = {
      reportAllChanges: false,
      debug: false,
      sendToAnalytics: true,
      ...config,
    }
  }

  // Initialize Web Vitals monitoring
  async initialize(): Promise<void> {
    if (typeof window === 'undefined') {
      return // Server-side, skip initialization
    }

    try {
      // Dynamic import to avoid SSR issues
      const webVitals = await import('web-vitals')

      // Set up metric collection with unified handler
      const handleMetric = this.createMetricHandler()

      // Initialize all Core Web Vitals with proper options
      const options = this.config.reportAllChanges
        ? { reportAllChanges: true }
        : {}

      if (webVitals.onCLS) {
        webVitals.onCLS(handleMetric as any, options as any)
      }
      if (webVitals.onFCP) {
        webVitals.onFCP(handleMetric as any, options as any)
      }
      if (webVitals.onLCP) {
        webVitals.onLCP(handleMetric as any, options as any)
      }
      if (webVitals.onTTFB) {
        webVitals.onTTFB(handleMetric as any, options as any)
      }

      // Try to get INP (newer metric replacing FID in v4+)
      if (webVitals.onINP) {
        webVitals.onINP(handleMetric as any, options as any)
      }

      // FID is deprecated in web-vitals v4+ in favor of INP
      // Only try FID if INP is not available (backwards compatibility)
      if (!webVitals.onINP && (webVitals as any).onFID) {
        ;(webVitals as any).onFID(handleMetric as any)
      }

      if (this.config.debug) {
        console.log('Web Vitals monitoring initialized')
      }
    } catch (error) {
      console.error('Failed to initialize Web Vitals:', error)
    }
  }

  // Create unified metric handler
  private createMetricHandler(): WebVitalCallback {
    return (metric: any) => {
      // Convert to our WebVitalsMetric format
      const webVitalMetric: WebVitalsMetric = {
        name: metric.name as WebVitalsMetric['name'],
        value: metric.value,
        rating: getPerformanceRating(metric.name, metric.value),
        delta: metric.delta || metric.value,
        id: metric.id,
        navigationType: this.getNavigationType(),
      }

      // Store metric
      this.metrics.set(metric.name, webVitalMetric)

      // Call registered callbacks
      this.callbacks.forEach(callback => {
        try {
          callback(webVitalMetric)
        } catch (error) {
          console.error('Error in Web Vitals callback:', error)
        }
      })

      // Send to analytics if configured
      if (this.config.sendToAnalytics) {
        this.sendToAnalytics(webVitalMetric)
      }

      // Debug logging
      if (this.config.debug) {
        console.log(`${metric.name}:`, webVitalMetric)
      }
    }
  }

  // Get navigation type
  private getNavigationType(): WebVitalsMetric['navigationType'] {
    if (typeof performance === 'undefined' || !performance.getEntriesByType) {
      return 'navigate'
    }

    const navEntries = performance.getEntriesByType(
      'navigation'
    ) as PerformanceNavigationTiming[]
    if (navEntries.length > 0) {
      const navType = navEntries[0]?.type
      return (navType as WebVitalsMetric['navigationType']) || 'navigate'
    }

    return 'navigate'
  }

  // Send metric to analytics/monitoring service
  private async sendToAnalytics(metric: WebVitalsMetric): Promise<void> {
    if (!this.config.endpoint) {
      return
    }

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'web-vitals',
          metric,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (error) {
      console.error('Failed to send Web Vitals to analytics:', error)
    }
  }

  // Register callback for metric updates
  onMetric(callback: WebVitalCallback): () => void {
    this.callbacks.add(callback)

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback)
    }
  }

  // Get current metrics
  getMetrics(): Record<string, WebVitalsMetric> {
    return Object.fromEntries(this.metrics.entries())
  }

  // Get specific metric
  getMetric(name: string): WebVitalsMetric | null {
    return this.metrics.get(name) || null
  }

  // Get performance score (0-100)
  getPerformanceScore(): number {
    const metrics = Array.from(this.metrics.values())
    if (metrics.length === 0) {
      return 0
    }

    const scores = metrics.map(metric => {
      switch (metric.rating) {
        case 'good':
          return 100
        case 'needs-improvement':
          return 50
        case 'poor':
          return 0
        default:
          return 0
      }
    })

    return Math.round(
      scores.reduce((sum: number, score: number) => sum + score, 0) /
        scores.length
    )
  }

  // Get metrics summary
  getSummary() {
    const metrics = this.getMetrics()
    const score = this.getPerformanceScore()

    const summary = {
      score,
      rating: score >= 90 ? 'good' : score >= 50 ? 'needs-improvement' : 'poor',
      metrics: Object.keys(metrics).length,
      issues: Object.values(metrics).filter(m => m.rating === 'poor').length,
      warnings: Object.values(metrics).filter(
        m => m.rating === 'needs-improvement'
      ).length,
      coreWebVitals: {
        lcp: metrics.LCP?.value || 0,
        fid: metrics.FID?.value || 0,
        cls: metrics.CLS?.value || 0,
      },
    }

    return summary
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear()
  }
}

// React Hook for Web Vitals
export function useWebVitals(config?: WebVitalsConfig) {
  if (typeof window === 'undefined') {
    return {
      metrics: {},
      score: 0,
      summary: null,
      collector: null,
    }
  }

  const collector = new WebVitalsCollector(config)

  // Initialize on first use
  collector.initialize()

  return {
    metrics: collector.getMetrics(),
    score: collector.getPerformanceScore(),
    summary: collector.getSummary(),
    collector,
  }
}

// Standalone function to send a single Web Vital to analytics
export async function sendWebVital(
  metric: WebVitalsMetric,
  endpoint: string
): Promise<void> {
  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'web-vitals',
        metric,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: new Date().toISOString(),
      }),
    })
  } catch (error) {
    console.error('Failed to send Web Vital:', error)
  }
}

// Default Web Vitals instance for global use
export const webVitalsCollector = new WebVitalsCollector({
  reportAllChanges: false,
  debug: process.env.NODE_ENV === 'development',
  sendToAnalytics: true,
  endpoint: '/api/analytics/web-vitals',
})

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  webVitalsCollector.initialize()
}
