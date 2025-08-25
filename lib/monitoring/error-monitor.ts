/**
 * Cardinal Error Monitoring & Alerting
 * Centralized error monitoring with alerting capabilities
 */

import type { BaseError, ErrorSeverity, ErrorCategory } from '../errors/types'
import { logger } from '../logging/logger'

// Alert configuration
export interface AlertRule {
  id: string
  name: string
  description: string
  enabled: boolean
  conditions: {
    errorCategory?: ErrorCategory[]
    minSeverity?: ErrorSeverity
    errorPattern?: RegExp
    threshold?: {
      count: number
      timeWindowMs: number
    }
    userThreshold?: {
      affectedUsers: number
      timeWindowMs: number
    }
  }
  channels: AlertChannel[]
  throttle?: {
    maxAlertsPerHour: number
    cooldownMs: number
  }
}

// Alert channel types
export type AlertChannelType =
  | 'email'
  | 'slack'
  | 'webhook'
  | 'sms'
  | 'pagerduty'

export interface AlertChannel {
  type: AlertChannelType
  name: string
  enabled: boolean
  config: Record<string, any>
}

// Error event for monitoring
export interface ErrorEvent {
  id: string
  timestamp: string
  error: BaseError
  context: {
    userId?: string
    sessionId?: string
    requestId?: string
    url?: string
    userAgent?: string
    ip?: string
  }
  metadata: {
    environment: string
    service: string
    version: string
  }
}

// Error statistics
export interface ErrorStats {
  totalErrors: number
  errorsByCategory: Record<ErrorCategory, number>
  errorsBySeverity: Record<ErrorSeverity, number>
  affectedUsers: number
  topErrors: Array<{
    message: string
    count: number
    lastSeen: string
  }>
  timeRange: {
    start: string
    end: string
  }
}

// Alert notification
export interface AlertNotification {
  ruleId: string
  ruleName: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  errors: ErrorEvent[]
  stats: {
    count: number
    affectedUsers: number
    timeWindow: string
  }
  timestamp: string
  environment: string
}

// Error monitoring class
export class ErrorMonitor {
  private events: ErrorEvent[] = []
  private alertRules: AlertRule[] = []
  private alertHistory = new Map<string, { lastSent: number; count: number }>()
  private readonly maxEvents = 10000 // Keep last 10k events in memory

  constructor() {
    // Clean up old events periodically
    setInterval(() => {
      this.cleanup()
    }, 60000) // Every minute
  }

  // Record an error event
  async recordError(
    error: BaseError,
    context: Partial<ErrorEvent['context']> = {}
  ): Promise<void> {
    const event: ErrorEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      error,
      context,
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        service: 'cardinal',
        version: process.env.npm_package_version || '0.1.0',
      },
    }

    // Add to events list
    this.events.push(event)

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Log the error
    await logger.error(
      'monitoring',
      'Error recorded by monitor',
      {
        errorId: event.id,
        errorCategory: error.category,
        errorSeverity: error.severity,
        userId: context.userId,
        requestId: context.requestId,
      },
      error
    )

    // Check alert rules
    await this.checkAlertRules(event)
  }

  // Add or update alert rule
  addAlertRule(rule: AlertRule): void {
    const existingIndex = this.alertRules.findIndex(r => r.id === rule.id)

    if (existingIndex >= 0) {
      this.alertRules[existingIndex] = rule
    } else {
      this.alertRules.push(rule)
    }

    logger.info('monitoring', 'Alert rule updated', {
      ruleId: rule.id,
      ruleName: rule.name,
      enabled: rule.enabled,
    })
  }

  // Remove alert rule
  removeAlertRule(ruleId: string): void {
    const index = this.alertRules.findIndex(r => r.id === ruleId)
    if (index >= 0) {
      this.alertRules.splice(index, 1)
      logger.info('monitoring', 'Alert rule removed', { ruleId })
    }
  }

  // Get error statistics
  getErrorStats(timeRangeMs: number = 3600000): ErrorStats {
    const now = Date.now()
    const cutoff = new Date(now - timeRangeMs)

    const recentEvents = this.events.filter(
      event => new Date(event.timestamp) >= cutoff
    )

    const stats: ErrorStats = {
      totalErrors: recentEvents.length,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      affectedUsers: 0,
      topErrors: [],
      timeRange: {
        start: cutoff.toISOString(),
        end: new Date(now).toISOString(),
      },
    }

    // Initialize counters
    const categories: ErrorCategory[] = [
      'validation',
      'authentication',
      'authorization',
      'not_found',
      'rate_limit',
      'timeout',
      'external_api',
      'database',
      'ai_service',
      'network',
      'internal',
    ]
    const severities: ErrorSeverity[] = ['low', 'medium', 'high', 'critical']

    categories.forEach(cat => (stats.errorsByCategory[cat] = 0))
    severities.forEach(sev => (stats.errorsBySeverity[sev] = 0))

    // Count errors and users
    const affectedUsers = new Set<string>()
    const errorCounts = new Map<string, { count: number; lastSeen: string }>()

    recentEvents.forEach(event => {
      // Count by category and severity
      stats.errorsByCategory[event.error.category]++
      stats.errorsBySeverity[event.error.severity]++

      // Track affected users
      if (event.context.userId) {
        affectedUsers.add(event.context.userId)
      }

      // Count error messages
      const message = event.error.message
      const existing = errorCounts.get(message)
      if (existing) {
        existing.count++
        existing.lastSeen = event.timestamp
      } else {
        errorCounts.set(message, { count: 1, lastSeen: event.timestamp })
      }
    })

    stats.affectedUsers = affectedUsers.size

    // Get top errors
    stats.topErrors = Array.from(errorCounts.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([message, data]) => ({
        message,
        count: data.count,
        lastSeen: data.lastSeen,
      }))

    return stats
  }

  // Get recent error events
  getRecentErrors(
    limit: number = 100,
    filters?: {
      category?: ErrorCategory
      severity?: ErrorSeverity
      userId?: string
    }
  ): ErrorEvent[] {
    let filtered = [...this.events]

    if (filters?.category) {
      filtered = filtered.filter(
        event => event.error.category === filters.category
      )
    }

    if (filters?.severity) {
      filtered = filtered.filter(
        event => event.error.severity === filters.severity
      )
    }

    if (filters?.userId) {
      filtered = filtered.filter(
        event => event.context.userId === filters.userId
      )
    }

    return filtered
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit)
  }

  // Check alert rules for an error event
  private async checkAlertRules(event: ErrorEvent): Promise<void> {
    for (const rule of this.alertRules) {
      if (!rule.enabled) {
        continue
      }

      if (await this.shouldTriggerAlert(rule, event)) {
        await this.sendAlert(rule, [event])
      }
    }
  }

  // Determine if an alert should be triggered
  private async shouldTriggerAlert(
    rule: AlertRule,
    event: ErrorEvent
  ): Promise<boolean> {
    const { conditions } = rule

    // Check error category
    if (
      conditions.errorCategory &&
      !conditions.errorCategory.includes(event.error.category)
    ) {
      return false
    }

    // Check minimum severity
    if (conditions.minSeverity) {
      const severityLevels: Record<ErrorSeverity, number> = {
        low: 0,
        medium: 1,
        high: 2,
        critical: 3,
      }

      if (
        severityLevels[event.error.severity] <
        severityLevels[conditions.minSeverity]
      ) {
        return false
      }
    }

    // Check error pattern
    if (
      conditions.errorPattern &&
      !conditions.errorPattern.test(event.error.message)
    ) {
      return false
    }

    // Check threshold conditions
    if (conditions.threshold) {
      const { count, timeWindowMs } = conditions.threshold
      const cutoff = new Date(Date.now() - timeWindowMs)

      const matchingEvents = this.events.filter(
        e => new Date(e.timestamp) >= cutoff && this.eventMatchesRule(e, rule)
      )

      if (matchingEvents.length < count) {
        return false
      }
    }

    // Check user threshold
    if (conditions.userThreshold) {
      const { affectedUsers, timeWindowMs } = conditions.userThreshold
      const cutoff = new Date(Date.now() - timeWindowMs)

      const matchingEvents = this.events.filter(
        e => new Date(e.timestamp) >= cutoff && this.eventMatchesRule(e, rule)
      )

      const uniqueUsers = new Set(
        matchingEvents.map(e => e.context.userId).filter(Boolean)
      )

      if (uniqueUsers.size < affectedUsers) {
        return false
      }
    }

    // Check throttling
    if (rule.throttle) {
      const history = this.alertHistory.get(rule.id)
      const now = Date.now()

      if (history) {
        // Check cooldown
        if (now - history.lastSent < rule.throttle.cooldownMs) {
          return false
        }

        // Check hourly limit
        const hourAgo = now - 3600000
        if (
          history.lastSent > hourAgo &&
          history.count >= rule.throttle.maxAlertsPerHour
        ) {
          return false
        }
      }
    }

    return true
  }

  // Check if an event matches a rule's conditions
  private eventMatchesRule(event: ErrorEvent, rule: AlertRule): boolean {
    const { conditions } = rule

    if (
      conditions.errorCategory &&
      !conditions.errorCategory.includes(event.error.category)
    ) {
      return false
    }

    if (
      conditions.errorPattern &&
      !conditions.errorPattern.test(event.error.message)
    ) {
      return false
    }

    return true
  }

  // Send alert notification
  private async sendAlert(
    rule: AlertRule,
    events: ErrorEvent[]
  ): Promise<void> {
    const notification: AlertNotification = {
      ruleId: rule.id,
      ruleName: rule.name,
      severity: this.getAlertSeverity(events),
      title: `Alert: ${rule.name}`,
      message: this.generateAlertMessage(rule, events),
      errors: events,
      stats: {
        count: events.length,
        affectedUsers: new Set(
          events.map(e => e.context.userId).filter(Boolean)
        ).size,
        timeWindow: rule.conditions.threshold
          ? `${rule.conditions.threshold.timeWindowMs / 1000}s`
          : 'immediate',
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    }

    // Update alert history
    const history = this.alertHistory.get(rule.id) || { lastSent: 0, count: 0 }
    const now = Date.now()

    // Reset count if more than an hour has passed
    if (now - history.lastSent > 3600000) {
      history.count = 0
    }

    history.lastSent = now
    history.count++
    this.alertHistory.set(rule.id, history)

    // Log the alert
    await logger.warn('monitoring', 'Alert triggered', {
      ruleId: rule.id,
      ruleName: rule.name,
      errorCount: events.length,
      affectedUsers: notification.stats.affectedUsers,
    })

    // Send to configured channels
    for (const channel of rule.channels) {
      if (channel.enabled) {
        await this.sendToChannel(channel, notification)
      }
    }
  }

  // Determine alert severity based on errors
  private getAlertSeverity(
    events: ErrorEvent[]
  ): AlertNotification['severity'] {
    const maxSeverity = Math.max(
      ...events.map(e => {
        const levels: Record<ErrorSeverity, number> = {
          low: 0,
          medium: 1,
          high: 2,
          critical: 3,
        }
        return levels[e.error.severity]
      })
    )

    const severityMap = ['low', 'medium', 'high', 'critical'] as const
    return severityMap[maxSeverity] || 'low'
  }

  // Generate alert message
  private generateAlertMessage(rule: AlertRule, events: ErrorEvent[]): string {
    const errorCounts = new Map<string, number>()
    events.forEach(event => {
      const key = `${event.error.category}: ${event.error.message}`
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1)
    })

    const topErrors = Array.from(errorCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => `• ${error} (${count}x)`)

    return `${rule.description}\n\nTop Errors:\n${topErrors.join('\n')}`
  }

  // Send notification to channel
  private async sendToChannel(
    channel: AlertChannel,
    notification: AlertNotification
  ): Promise<void> {
    try {
      switch (channel.type) {
        case 'webhook':
          await this.sendWebhook(channel, notification)
          break
        case 'slack':
          await this.sendSlack(channel, notification)
          break
        case 'email':
          await this.sendEmail(channel, notification)
          break
        default:
          logger.warn(
            'monitoring',
            `Unsupported alert channel type: ${channel.type}`
          )
      }
    } catch (error) {
      await logger.error(
        'monitoring',
        `Failed to send alert to ${channel.type}`,
        {
          channelName: channel.name,
          alertRule: notification.ruleName,
        },
        error as Error
      )
    }
  }

  // Send webhook alert
  private async sendWebhook(
    channel: AlertChannel,
    notification: AlertNotification
  ): Promise<void> {
    const { url, headers = {} } = channel.config

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(notification),
    })
  }

  // Send Slack alert
  private async sendSlack(
    channel: AlertChannel,
    notification: AlertNotification
  ): Promise<void> {
    const { webhookUrl } = channel.config

    const payload = {
      text: `🚨 ${notification.title}`,
      attachments: [
        {
          color: this.getSlackColor(notification.severity),
          fields: [
            {
              title: 'Errors',
              value: notification.stats.count.toString(),
              short: true,
            },
            {
              title: 'Affected Users',
              value: notification.stats.affectedUsers.toString(),
              short: true,
            },
            {
              title: 'Environment',
              value: notification.environment,
              short: true,
            },
            {
              title: 'Time Window',
              value: notification.stats.timeWindow,
              short: true,
            },
          ],
          text: notification.message,
        },
      ],
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }

  // Send email alert (placeholder)
  private async sendEmail(
    channel: AlertChannel,
    notification: AlertNotification
  ): Promise<void> {
    // TODO: Implement email sending
    logger.info('monitoring', 'Email alert would be sent', {
      to: channel.config.to,
      subject: notification.title,
    })
  }

  // Get Slack color for severity
  private getSlackColor(severity: AlertNotification['severity']): string {
    switch (severity) {
      case 'low':
        return '#36a2eb'
      case 'medium':
        return '#ffce56'
      case 'high':
        return '#ff6384'
      case 'critical':
        return '#ff4757'
      default:
        return '#95a5a6'
    }
  }

  // Clean up old events
  private cleanup(): void {
    const oneHourAgo = new Date(Date.now() - 3600000)
    this.events = this.events.filter(
      event => new Date(event.timestamp) > oneHourAgo
    )
  }
}

// Singleton monitor instance
let monitorInstance: ErrorMonitor | null = null

export function getErrorMonitor(): ErrorMonitor {
  if (!monitorInstance) {
    monitorInstance = new ErrorMonitor()
  }
  return monitorInstance
}

// Default alert rules
export function createDefaultAlertRules(): AlertRule[] {
  return [
    {
      id: 'critical-errors',
      name: 'Critical Errors',
      description: 'Alert on any critical severity errors',
      enabled: true,
      conditions: {
        minSeverity: 'critical',
      },
      channels: [],
      throttle: {
        maxAlertsPerHour: 10,
        cooldownMs: 300000, // 5 minutes
      },
    },
    {
      id: 'high-error-rate',
      name: 'High Error Rate',
      description: 'Alert when error rate exceeds threshold',
      enabled: true,
      conditions: {
        threshold: {
          count: 50,
          timeWindowMs: 300000, // 5 minutes
        },
      },
      channels: [],
      throttle: {
        maxAlertsPerHour: 6,
        cooldownMs: 600000, // 10 minutes
      },
    },
    {
      id: 'auth-failures',
      name: 'Authentication Failures',
      description: 'Alert on authentication errors',
      enabled: true,
      conditions: {
        errorCategory: ['authentication'],
        threshold: {
          count: 10,
          timeWindowMs: 300000, // 5 minutes
        },
      },
      channels: [],
      throttle: {
        maxAlertsPerHour: 12,
        cooldownMs: 300000, // 5 minutes
      },
    },
  ]
}
