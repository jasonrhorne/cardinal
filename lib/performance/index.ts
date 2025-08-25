/**
 * Cardinal Performance Monitoring - Main Export
 * Centralized exports for all performance monitoring functionality
 */

// Core metrics and monitoring
export {
  type WebVitalsMetric,
  type ServerMetrics,
  type DatabaseMetrics,
  type APIMetrics,
  type PerformanceBudget,
  PERFORMANCE_THRESHOLDS,
  getPerformanceRating,
  ClientPerformanceMonitor,
  ServerPerformanceMonitor,
  PerformanceBudgetMonitor,
  clientPerformanceMonitor,
  serverPerformanceMonitor,
  performanceBudgetMonitor,
} from './metrics'

// Web Vitals integration
export {
  type WebVitalCallback,
  type WebVitalsConfig,
  WebVitalsCollector,
  useWebVitals,
  sendWebVital,
  webVitalsCollector,
} from './web-vitals'
import { performanceAlerting } from './alerts'
import {
  performanceBudgetMonitor,
  serverPerformanceMonitor,
  clientPerformanceMonitor,
} from './metrics'
import { webVitalsCollector } from './web-vitals'

// Alerts and monitoring
export {
  type AlertSeverity,
  type PerformanceAlert,
  type AlertEvent,
  PerformanceAlerting,
  performanceAlerting,
  checkWebVitalAlert,
  checkBudgetAlerts,
  checkServerAlerts,
} from './alerts'

// Middleware and utilities
export {
  type PerformanceMiddlewareConfig,
  withPerformanceMonitoring,
  performanceMiddleware,
  usePerformanceMonitoring,
  performanceUtils,
} from './middleware'

// React components
export {
  PerformanceMonitor,
  PerformanceBadge,
} from '../../components/performance/performance-monitor'
export { PerformanceDashboard } from '../../components/performance/performance-dashboard'
export {
  PerformanceProvider,
  PerformanceDebugPanel,
  usePerformanceContext,
} from '../../components/performance/performance-provider'

// Convenience functions for common operations
export const performanceMonitoring = {
  // Initialize all monitoring systems
  async initialize(config?: {
    webVitals?: boolean
    serverMetrics?: boolean
    alerts?: boolean
    debug?: boolean
  }) {
    const {
      webVitals = true,
      serverMetrics = true,
      alerts = true,
      debug = process.env.NODE_ENV === 'development',
    } = config || {}

    if (webVitals && typeof window !== 'undefined') {
      await webVitalsCollector.initialize()
      if (debug) {
        console.log('✅ Web Vitals monitoring initialized')
      }
    }

    if (serverMetrics && typeof process !== 'undefined') {
      // Server metrics are automatically initialized
      if (debug) {
        console.log('✅ Server metrics monitoring initialized')
      }
    }

    if (alerts) {
      // Alerts are automatically initialized
      if (debug) {
        console.log('✅ Performance alerts initialized')
      }
    }
  },

  // Get comprehensive performance summary
  getSummary() {
    return {
      webVitals: webVitalsCollector.getMetrics(),
      score: webVitalsCollector.getPerformanceScore(),
      budgets: performanceBudgetMonitor.getAllBudgets(),
      alerts: performanceAlerting.getAlertStats(),
      recentAlerts: performanceAlerting.getAlertHistory(10),
      serverMetrics:
        typeof process !== 'undefined'
          ? serverPerformanceMonitor.getCurrentMetrics()
          : null,
      clientMetrics:
        typeof window !== 'undefined'
          ? clientPerformanceMonitor.getMetrics()
          : null,
    }
  },

  // Start monitoring session
  startSession(sessionId: string) {
    if (typeof window !== 'undefined') {
      clientPerformanceMonitor.startMeasurement(`session-${sessionId}`)
    }
    if (typeof process !== 'undefined') {
      serverPerformanceMonitor.startTiming(`session-${sessionId}`)
    }
  },

  // End monitoring session
  endSession(sessionId: string) {
    let clientDuration = 0
    let serverMetrics = null

    if (typeof window !== 'undefined') {
      clientDuration = clientPerformanceMonitor.endMeasurement(
        `session-${sessionId}`
      )
    }
    if (typeof process !== 'undefined') {
      serverMetrics = serverPerformanceMonitor.endTiming(`session-${sessionId}`)
    }

    return {
      sessionId,
      clientDuration,
      serverMetrics,
      timestamp: new Date().toISOString(),
    }
  },

  // Quick health check
  healthCheck() {
    const summary = this.getSummary()
    const health = {
      status: 'healthy' as 'healthy' | 'warning' | 'critical',
      score: summary.score,
      issues: [] as string[],
    }

    // Check performance score
    if (summary.score < 50) {
      health.status = 'critical'
      health.issues.push(`Low performance score: ${summary.score}/100`)
    } else if (summary.score < 75) {
      health.status = 'warning'
      health.issues.push(
        `Performance score below optimal: ${summary.score}/100`
      )
    }

    // Check failing budgets
    const failingBudgets = Object.values(summary.budgets).filter(
      b => b.status === 'fail'
    )
    if (failingBudgets.length > 0) {
      health.status = health.status === 'critical' ? 'critical' : 'warning'
      health.issues.push(
        `${failingBudgets.length} performance budget(s) exceeded`
      )
    }

    // Check recent critical alerts
    const recentCritical = summary.recentAlerts.filter(
      alert =>
        alert.severity === 'critical' &&
        Date.now() - new Date(alert.timestamp).getTime() < 300000 // Last 5 minutes
    )
    if (recentCritical.length > 0) {
      health.status = 'critical'
      health.issues.push(
        `${recentCritical.length} critical alert(s) in last 5 minutes`
      )
    }

    return health
  },
}

// Default export
export default performanceMonitoring
