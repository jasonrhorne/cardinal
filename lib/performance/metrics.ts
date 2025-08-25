/**
 * Cardinal Performance Metrics Collection
 * Comprehensive performance monitoring and metrics collection
 */

// Core Web Vitals and performance metrics types
export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType:
    | 'navigate'
    | 'reload'
    | 'back_forward'
    | 'prerender'
    | 'back-forward'
    | 'back-forward-cache'
    | 'restore'
}

export interface ServerMetrics {
  duration: number
  memory: {
    used: number
    total: number
    percentage: number
  }
  cpu?: {
    user: number
    system: number
  }
  timestamp: string
}

export interface DatabaseMetrics {
  query: string
  duration: number
  rowCount?: number
  cached?: boolean
  table?: string
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT'
}

export interface APIMetrics {
  endpoint: string
  method: string
  statusCode: number
  duration: number
  requestSize: number
  responseSize: number
  cached?: boolean
}

export interface PerformanceBudget {
  metric: string
  budget: number
  warning: number
  current: number
  status: 'pass' | 'warning' | 'fail'
}

// Performance thresholds based on Core Web Vitals
export const PERFORMANCE_THRESHOLDS = {
  // Largest Contentful Paint (LCP)
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  // First Input Delay (FID)
  FID: {
    good: 100,
    needsImprovement: 300,
  },
  // Cumulative Layout Shift (CLS)
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  // First Contentful Paint (FCP)
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  // Time to First Byte (TTFB)
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
  // Interaction to Next Paint (INP)
  INP: {
    good: 200,
    needsImprovement: 500,
  },
} as const

// Performance rating calculation
export function getPerformanceRating(
  metric: keyof typeof PERFORMANCE_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = PERFORMANCE_THRESHOLDS[metric]

  if (value <= thresholds.good) {
    return 'good'
  } else if (value <= thresholds.needsImprovement) {
    return 'needs-improvement'
  } else {
    return 'poor'
  }
}

// Client-side performance measurement utilities
export class ClientPerformanceMonitor {
  private metrics: Map<string, number> = new Map()
  private observer?: PerformanceObserver

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers()
    }
  }

  private initializeObservers() {
    // Initialize Performance Observer for various entry types
    try {
      // Navigation timing
      this.observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry)
        }
      })

      // Observe multiple entry types
      this.observer.observe({
        entryTypes: ['navigation', 'resource', 'measure', 'mark'],
      })
    } catch (error) {
      console.warn('Performance Observer not supported:', error)
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'navigation':
        this.processNavigationEntry(entry as PerformanceNavigationTiming)
        break
      case 'resource':
        this.processResourceEntry(entry as PerformanceResourceTiming)
        break
      case 'measure':
        this.processMeasureEntry(entry)
        break
    }
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming) {
    const metrics = {
      'time-to-first-byte': entry.responseStart - entry.requestStart,
      'dom-content-loaded': entry.domContentLoadedEventEnd - entry.startTime,
      'dom-complete': entry.domComplete - entry.startTime,
      'load-complete': entry.loadEventEnd - entry.startTime,
    }

    for (const [name, value] of Object.entries(metrics)) {
      this.metrics.set(name, value)
    }
  }

  private processResourceEntry(entry: PerformanceResourceTiming) {
    // Track slow resources
    const duration = entry.responseEnd - entry.requestStart
    if (duration > 1000) {
      // Resources taking more than 1s
      this.reportSlowResource(entry.name, duration)
    }
  }

  private processMeasureEntry(entry: PerformanceEntry) {
    this.metrics.set(entry.name, entry.duration)
  }

  private reportSlowResource(resource: string, duration: number) {
    // This would be sent to monitoring service
    console.warn(`Slow resource detected: ${resource} (${duration}ms)`)
  }

  // Start custom measurement
  startMeasurement(name: string) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`)
    }
  }

  // End custom measurement
  endMeasurement(name: string) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)

      const measure = performance.getEntriesByName(name, 'measure')[0]
      if (measure) {
        this.metrics.set(name, measure.duration)
        return measure.duration
      }
    }
    return 0
  }

  // Get all collected metrics
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics.entries())
  }

  // Clear metrics
  clearMetrics() {
    this.metrics.clear()
    if (typeof performance !== 'undefined') {
      performance.clearMarks()
      performance.clearMeasures()
    }
  }

  // Get resource timing summary
  getResourceTimingSummary() {
    if (typeof performance === 'undefined') {
      return null
    }

    const resources = performance.getEntriesByType(
      'resource'
    ) as PerformanceResourceTiming[]
    const summary = {
      totalRequests: resources.length,
      totalSize: 0,
      averageDuration: 0,
      slowRequests: 0,
      byType: {} as Record<string, { count: number; totalDuration: number }>,
    }

    let totalDuration = 0

    for (const resource of resources) {
      const duration = resource.responseEnd - resource.requestStart
      totalDuration += duration

      if (duration > 1000) {
        summary.slowRequests++
      }

      // Categorize by resource type
      const type = this.getResourceType(resource.name)
      if (!summary.byType[type]) {
        summary.byType[type] = { count: 0, totalDuration: 0 }
      }
      summary.byType[type].count++
      summary.byType[type].totalDuration += duration

      // Estimate size (not always available)
      if (resource.transferSize) {
        summary.totalSize += resource.transferSize
      }
    }

    summary.averageDuration = totalDuration / resources.length || 0

    return summary
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) {
      return 'javascript'
    }
    if (url.includes('.css')) {
      return 'stylesheet'
    }
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/)) {
      return 'image'
    }
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) {
      return 'font'
    }
    if (url.includes('/api/')) {
      return 'api'
    }
    return 'other'
  }

  // Cleanup
  disconnect() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }
}

// Server-side performance monitoring
export class ServerPerformanceMonitor {
  private startTime: number = Date.now()
  private measurements: Map<string, { start: number; memory?: number }> =
    new Map()

  // Start timing an operation
  startTiming(operation: string): void {
    this.measurements.set(operation, {
      start: Number(process.hrtime.bigint()),
      memory: process.memoryUsage().heapUsed,
    })
  }

  // End timing an operation
  endTiming(operation: string): ServerMetrics | null {
    const measurement = this.measurements.get(operation)
    if (!measurement) {
      return null
    }

    const endTime = Number(process.hrtime.bigint())
    const duration = (endTime - measurement.start) / 1_000_000 // Convert to milliseconds

    const currentMemory = process.memoryUsage()
    const memoryUsed = currentMemory.heapUsed
    const memoryTotal = currentMemory.heapTotal

    this.measurements.delete(operation)

    return {
      duration,
      memory: {
        used: memoryUsed,
        total: memoryTotal,
        percentage: (memoryUsed / memoryTotal) * 100,
      },
      timestamp: new Date().toISOString(),
    }
  }

  // Get current server metrics
  getCurrentMetrics(): ServerMetrics {
    const memory = process.memoryUsage()
    const uptime = Date.now() - this.startTime

    return {
      duration: uptime,
      memory: {
        used: memory.heapUsed,
        total: memory.heapTotal,
        percentage: (memory.heapUsed / memory.heapTotal) * 100,
      },
      timestamp: new Date().toISOString(),
    }
  }

  // Get CPU usage (if available)
  getCPUUsage(): Promise<{ user: number; system: number } | null> {
    return new Promise(resolve => {
      if (typeof process.cpuUsage === 'function') {
        const startUsage = process.cpuUsage()
        setTimeout(() => {
          const endUsage = process.cpuUsage(startUsage)
          resolve({
            user: endUsage.user / 1000, // Convert to milliseconds
            system: endUsage.system / 1000,
          })
        }, 100)
      } else {
        resolve(null)
      }
    })
  }
}

// Performance budget monitoring
export class PerformanceBudgetMonitor {
  private budgets: Record<string, PerformanceBudget> = {
    'bundle-size': {
      metric: 'JavaScript Bundle Size',
      budget: 250_000, // 250KB
      warning: 200_000, // 200KB
      current: 0,
      status: 'pass',
    },
    'first-paint': {
      metric: 'First Paint',
      budget: 2000, // 2s
      warning: 1500, // 1.5s
      current: 0,
      status: 'pass',
    },
    'largest-contentful-paint': {
      metric: 'Largest Contentful Paint',
      budget: 2500, // 2.5s
      warning: 2000, // 2s
      current: 0,
      status: 'pass',
    },
    'cumulative-layout-shift': {
      metric: 'Cumulative Layout Shift',
      budget: 0.1,
      warning: 0.05,
      current: 0,
      status: 'pass',
    },
  }

  // Update budget with current measurement
  updateBudget(metric: string, value: number): PerformanceBudget | null {
    const budget = this.budgets[metric]
    if (!budget) {
      return null
    }

    budget.current = value

    if (value > budget.budget) {
      budget.status = 'fail'
    } else if (value > budget.warning) {
      budget.status = 'warning'
    } else {
      budget.status = 'pass'
    }

    return { ...budget }
  }

  // Get all budgets with their current status
  getAllBudgets(): Record<string, PerformanceBudget> {
    return { ...this.budgets }
  }

  // Get failing budgets
  getFailingBudgets(): PerformanceBudget[] {
    return Object.values(this.budgets).filter(
      budget => budget.status === 'fail'
    )
  }

  // Get budget warnings
  getBudgetWarnings(): PerformanceBudget[] {
    return Object.values(this.budgets).filter(
      budget => budget.status === 'warning'
    )
  }
}

// Global performance monitoring instances
export const clientPerformanceMonitor = new ClientPerformanceMonitor()
export const serverPerformanceMonitor = new ServerPerformanceMonitor()
export const performanceBudgetMonitor = new PerformanceBudgetMonitor()
