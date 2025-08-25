/**
 * Cardinal Performance Alerts System
 * Configurable alerting for performance metrics and budgets
 */

import { logger } from '../logging/logger'

import type { WebVitalsMetric } from './metrics'
import { performanceBudgetMonitor } from './metrics'

// Alert severity levels
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'

// Performance alert configuration
export interface PerformanceAlert {
  id: string
  name: string
  description: string
  metric: string
  threshold: number
  severity: AlertSeverity
  enabled: boolean
  cooldownMs: number
  lastTriggered?: number
}

// Alert event data
export interface AlertEvent {
  alertId: string
  timestamp: string
  severity: AlertSeverity
  metric: string
  value: number
  threshold: number
  message: string
  metadata?: Record<string, unknown> | undefined
}

// Performance alerting system
export class PerformanceAlerting {
  private alerts: Map<string, PerformanceAlert> = new Map()
  private alertHistory: AlertEvent[] = []
  private maxHistoryLength = 1000

  constructor() {
    this.initializeDefaultAlerts()
  }

  // Initialize default performance alerts
  private initializeDefaultAlerts() {
    const defaultAlerts: PerformanceAlert[] = [
      {
        id: 'lcp-poor',
        name: 'Poor Largest Contentful Paint',
        description: 'LCP is above acceptable threshold',
        metric: 'LCP',
        threshold: 4000, // 4 seconds
        severity: 'error',
        enabled: true,
        cooldownMs: 300000, // 5 minutes
      },
      {
        id: 'cls-poor',
        name: 'Poor Cumulative Layout Shift',
        description: 'CLS is above acceptable threshold',
        metric: 'CLS',
        threshold: 0.25,
        severity: 'warning',
        enabled: true,
        cooldownMs: 300000,
      },
      {
        id: 'fid-poor',
        name: 'Poor First Input Delay',
        description: 'FID is above acceptable threshold',
        metric: 'FID',
        threshold: 300, // 300ms
        severity: 'error',
        enabled: true,
        cooldownMs: 180000, // 3 minutes
      },
      {
        id: 'budget-exceeded',
        name: 'Performance Budget Exceeded',
        description: 'One or more performance budgets have been exceeded',
        metric: 'budget',
        threshold: 1, // Any budget failure
        severity: 'critical',
        enabled: true,
        cooldownMs: 600000, // 10 minutes
      },
      {
        id: 'memory-high',
        name: 'High Memory Usage',
        description: 'Server memory usage is critically high',
        metric: 'memory',
        threshold: 85, // 85% memory usage
        severity: 'warning',
        enabled: true,
        cooldownMs: 300000,
      },
      {
        id: 'slow-requests',
        name: 'Slow API Requests',
        description: 'API requests are taking longer than expected',
        metric: 'api-duration',
        threshold: 5000, // 5 seconds
        severity: 'warning',
        enabled: true,
        cooldownMs: 180000,
      },
    ]

    for (const alert of defaultAlerts) {
      this.alerts.set(alert.id, alert)
    }
  }

  // Register a new performance alert
  registerAlert(alert: PerformanceAlert): void {
    this.alerts.set(alert.id, alert)
  }

  // Update an existing alert
  updateAlert(alertId: string, updates: Partial<PerformanceAlert>): boolean {
    const existing = this.alerts.get(alertId)
    if (!existing) {
      return false
    }

    this.alerts.set(alertId, { ...existing, ...updates })
    return true
  }

  // Enable/disable an alert
  toggleAlert(alertId: string, enabled: boolean): boolean {
    const alert = this.alerts.get(alertId)
    if (!alert) {
      return false
    }

    alert.enabled = enabled
    return true
  }

  // Check Web Vitals metric against alerts
  async checkWebVitalMetric(metric: WebVitalsMetric): Promise<void> {
    const relevantAlerts = Array.from(this.alerts.values()).filter(
      alert => alert.enabled && alert.metric === metric.name
    )

    for (const alert of relevantAlerts) {
      if (this.shouldTriggerAlert(alert, metric.value)) {
        await this.triggerAlert(alert, metric.value, {
          metricName: metric.name,
          rating: metric.rating,
          navigationType: metric.navigationType,
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        })
      }
    }
  }

  // Check performance budgets against alerts
  async checkPerformanceBudgets(): Promise<void> {
    const failingBudgets = performanceBudgetMonitor.getFailingBudgets()

    if (failingBudgets.length > 0) {
      const budgetAlert = this.alerts.get('budget-exceeded')
      if (
        budgetAlert &&
        budgetAlert.enabled &&
        this.shouldTriggerAlert(budgetAlert, failingBudgets.length)
      ) {
        await this.triggerAlert(budgetAlert, failingBudgets.length, {
          failingBudgets: failingBudgets.map(b => ({
            metric: b.metric,
            current: b.current,
            budget: b.budget,
            status: b.status,
          })),
        })
      }
    }
  }

  // Check server performance metrics
  async checkServerMetrics(
    memoryPercentage: number,
    avgResponseTime?: number
  ): Promise<void> {
    // Memory usage alert
    const memoryAlert = this.alerts.get('memory-high')
    if (
      memoryAlert &&
      memoryAlert.enabled &&
      this.shouldTriggerAlert(memoryAlert, memoryPercentage)
    ) {
      await this.triggerAlert(memoryAlert, memoryPercentage, {
        memoryPercentage,
        timestamp: new Date().toISOString(),
      })
    }

    // API response time alert
    if (avgResponseTime) {
      const responseAlert = this.alerts.get('slow-requests')
      if (
        responseAlert &&
        responseAlert.enabled &&
        this.shouldTriggerAlert(responseAlert, avgResponseTime)
      ) {
        await this.triggerAlert(responseAlert, avgResponseTime, {
          avgResponseTime,
          timestamp: new Date().toISOString(),
        })
      }
    }
  }

  // Check if alert should trigger (considering cooldown)
  private shouldTriggerAlert(alert: PerformanceAlert, value: number): boolean {
    if (value <= alert.threshold) {
      return false
    }

    const now = Date.now()
    if (alert.lastTriggered && now - alert.lastTriggered < alert.cooldownMs) {
      return false // Still in cooldown period
    }

    return true
  }

  // Trigger a performance alert
  private async triggerAlert(
    alert: PerformanceAlert,
    value: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const now = Date.now()
    alert.lastTriggered = now

    const alertEvent: AlertEvent = {
      alertId: alert.id,
      timestamp: new Date().toISOString(),
      severity: alert.severity,
      metric: alert.metric,
      value,
      threshold: alert.threshold,
      message: this.generateAlertMessage(alert, value),
      metadata,
    }

    // Add to history
    this.alertHistory.push(alertEvent)
    if (this.alertHistory.length > this.maxHistoryLength) {
      this.alertHistory.shift()
    }

    // Log the alert
    await this.logAlert(alertEvent)

    // Send notifications (in production, this would integrate with monitoring services)
    await this.sendAlertNotification(alertEvent)
  }

  // Generate human-readable alert message
  private generateAlertMessage(alert: PerformanceAlert, value: number): string {
    const formatValue = (value: number, metric: string): string => {
      switch (metric) {
        case 'LCP':
        case 'FID':
        case 'FCP':
        case 'TTFB':
        case 'INP':
        case 'api-duration':
          return value < 1000
            ? `${Math.round(value)}ms`
            : `${(value / 1000).toFixed(1)}s`
        case 'CLS':
          return value.toFixed(3)
        case 'memory':
          return `${Math.round(value)}%`
        case 'budget':
          return `${value} budget(s)`
        default:
          return value.toString()
      }
    }

    const formattedValue = formatValue(value, alert.metric)
    const formattedThreshold = formatValue(alert.threshold, alert.metric)

    return `${alert.name}: ${formattedValue} exceeds threshold of ${formattedThreshold}`
  }

  // Log alert event
  private async logAlert(event: AlertEvent): Promise<void> {
    const logLevel =
      event.severity === 'critical' || event.severity === 'error'
        ? 'error'
        : 'warn'

    await logger[logLevel]('performance', event.message, {
      alertId: event.alertId,
      metric: event.metric,
      value: event.value,
      threshold: event.threshold,
      severity: event.severity,
      metadata: event.metadata,
    })
  }

  // Send alert notification
  private async sendAlertNotification(event: AlertEvent): Promise<void> {
    // In production, integrate with services like:
    // - Slack webhooks
    // - Email notifications
    // - PagerDuty
    // - Discord webhooks
    // - Monitoring dashboards

    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 Performance Alert: ${event.message}`, {
        severity: event.severity,
        metadata: event.metadata,
      })
    }

    // Example: Send to webhook if configured
    const webhookUrl = process.env.PERFORMANCE_ALERT_WEBHOOK
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 **${event.severity.toUpperCase()}** Performance Alert`,
            attachments: [
              {
                color: this.getSeverityColor(event.severity),
                fields: [
                  { title: 'Alert', value: event.message, short: false },
                  {
                    title: 'Value',
                    value: event.value.toString(),
                    short: true,
                  },
                  {
                    title: 'Threshold',
                    value: event.threshold.toString(),
                    short: true,
                  },
                  { title: 'Time', value: event.timestamp, short: true },
                ],
              },
            ],
          }),
        })
      } catch (error) {
        console.error('Failed to send alert webhook:', error)
      }
    }
  }

  // Get color for alert severity
  private getSeverityColor(severity: AlertSeverity): string {
    const colors = {
      info: '#36a3f7',
      warning: '#faad14',
      error: '#ff4d4f',
      critical: '#a8071a',
    }
    return colors[severity]
  }

  // Get all alerts
  getAllAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values())
  }

  // Get alert history
  getAlertHistory(limit?: number): AlertEvent[] {
    const history = [...this.alertHistory].reverse() // Most recent first
    return limit ? history.slice(0, limit) : history
  }

  // Get recent alerts by severity
  getRecentAlertsBySeverity(hours: number = 24): Record<AlertSeverity, number> {
    const cutoff = Date.now() - hours * 60 * 60 * 1000
    const recentAlerts = this.alertHistory.filter(
      alert => new Date(alert.timestamp).getTime() > cutoff
    )

    const counts: Record<AlertSeverity, number> = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    }

    for (const alert of recentAlerts) {
      counts[alert.severity]++
    }

    return counts
  }

  // Clear alert history
  clearHistory(): void {
    this.alertHistory = []
  }

  // Get alert statistics
  getAlertStats() {
    const totalAlerts = this.alerts.size
    const enabledAlerts = Array.from(this.alerts.values()).filter(
      a => a.enabled
    ).length
    const recentAlerts = this.getRecentAlertsBySeverity(24)
    const totalRecentAlerts = Object.values(recentAlerts).reduce(
      (sum, count) => sum + count,
      0
    )

    return {
      totalAlerts,
      enabledAlerts,
      recentAlerts,
      totalRecentAlerts,
      historyLength: this.alertHistory.length,
    }
  }
}

// Global performance alerting instance
export const performanceAlerting = new PerformanceAlerting()

// Convenience functions for common alert operations
export const checkWebVitalAlert = (metric: WebVitalsMetric) =>
  performanceAlerting.checkWebVitalMetric(metric)

export const checkBudgetAlerts = () =>
  performanceAlerting.checkPerformanceBudgets()

export const checkServerAlerts = (
  memoryPercentage: number,
  avgResponseTime?: number
) => performanceAlerting.checkServerMetrics(memoryPercentage, avgResponseTime)
