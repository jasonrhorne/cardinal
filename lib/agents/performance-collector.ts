/**
 * E009: Agent Performance Metrics Collector
 * Service for collecting, storing, and analyzing agent performance data
 */

import type {
  AgentPerformanceMetrics,
  AgentBenchmark,
  PerformanceAlert,
  AgentPerformanceReport,
  MetricsCollectionConfig,
  MetricsStorage,
} from './performance-metrics'
import {
  MetricsCalculator,
  DEFAULT_PERFORMANCE_THRESHOLDS,
} from './performance-metrics'

export class AgentPerformanceCollector {
  private config: MetricsCollectionConfig
  private storage: MetricsStorage
  private metricsBuffer: AgentPerformanceMetrics[] = []
  private flushTimer?: NodeJS.Timeout | undefined

  constructor(
    storage: MetricsStorage,
    config?: Partial<MetricsCollectionConfig>
  ) {
    this.storage = storage
    this.config = {
      enableCollection: true,
      sampleRate: 1.0, // Collect all requests during experimentation phase
      batchSize: 50,
      flushInterval: 10000, // 10 seconds
      retentionPeriod: 30, // 30 days
      alertThresholds: {
        maxExecutionTime: 30000, // 30 seconds default
        minConfidence: 0.7,
        maxErrorRate: 10,
        maxTokensPerRequest: 3000,
      },
      ...config,
    }

    this.startFlushTimer()
  }

  /**
   * Collect performance metrics for an agent execution
   */
  async collectMetrics(metrics: AgentPerformanceMetrics): Promise<void> {
    if (!this.config.enableCollection) {
      return
    }

    // Sample based on configured rate
    if (Math.random() > this.config.sampleRate) {
      return
    }

    // Add to buffer
    this.metricsBuffer.push({
      ...metrics,
      timestamp: new Date(),
    })

    // Check for immediate alerts
    await this.checkForAlerts(metrics)

    // Flush if buffer is full
    if (this.metricsBuffer.length >= this.config.batchSize) {
      await this.flush()
    }
  }

  /**
   * Create performance metrics from agent execution data
   */
  createMetrics({
    agentType,
    executionTime,
    confidence,
    success,
    tokenUsage,
    requestId,
    sessionId,
    tasksCompleted = 1,
  }: {
    agentType: string
    executionTime: number
    confidence: number
    success: boolean
    tokenUsage?:
      | { prompt: number; completion: number; total: number }
      | undefined
    requestId: string
    sessionId: string
    tasksCompleted?: number
  }): AgentPerformanceMetrics {
    return {
      executionTime,
      totalTokensUsed: tokenUsage?.total ?? 0,
      requestCount: 1,
      confidence,
      successRate: success ? 100 : 0,
      errorRate: success ? 0 : 100,
      promptTokens: tokenUsage?.prompt ?? 0,
      completionTokens: tokenUsage?.completion ?? 0,
      averageResponseTime: executionTime,
      agentType,
      tasksCompleted,
      timestamp: new Date(),
      sessionId,
      requestId,
    }
  }

  /**
   * Get benchmark data for an agent type
   */
  async getBenchmark(
    agentType: string,
    period: AgentBenchmark['period'] = 'day'
  ): Promise<AgentBenchmark | null> {
    return this.storage.getBenchmark(agentType, period)
  }

  /**
   * Generate performance report for an agent
   */
  async generateReport(
    agentType: string,
    days: number = 7
  ): Promise<AgentPerformanceReport> {
    const end = new Date()
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)

    return this.storage.getReport(agentType, start, end)
  }

  /**
   * Get active alerts
   */
  async getAlerts(
    agentType?: string,
    severity?: PerformanceAlert['severity']
  ): Promise<PerformanceAlert[]> {
    return this.storage.getAlerts(agentType, severity)
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MetricsCollectionConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Check for performance alerts
   */
  private async checkForAlerts(
    metrics: AgentPerformanceMetrics
  ): Promise<void> {
    const thresholds = {
      ...this.config.alertThresholds,
      ...DEFAULT_PERFORMANCE_THRESHOLDS[metrics.agentType],
    }

    const alerts: PerformanceAlert[] = []

    // Check execution time
    if (
      MetricsCalculator.shouldTriggerAlert(
        'maxExecutionTime',
        metrics.executionTime,
        thresholds.maxExecutionTime!
      )
    ) {
      alerts.push({
        id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentType: metrics.agentType,
        alertType: 'slow_response',
        severity:
          metrics.executionTime > thresholds.maxExecutionTime! * 2
            ? 'high'
            : 'medium',
        message: `Agent execution time (${metrics.executionTime}ms) exceeded threshold (${thresholds.maxExecutionTime}ms)`,
        threshold: {
          metric: 'executionTime',
          expected: thresholds.maxExecutionTime!,
          actual: metrics.executionTime,
        },
        timestamp: new Date(),
      })
    }

    // Check confidence
    if (
      MetricsCalculator.shouldTriggerAlert(
        'minConfidence',
        metrics.confidence,
        thresholds.minConfidence!
      )
    ) {
      alerts.push({
        id: `conf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentType: metrics.agentType,
        alertType: 'performance_degradation',
        severity:
          metrics.confidence < thresholds.minConfidence! * 0.8
            ? 'high'
            : 'medium',
        message: `Agent confidence (${metrics.confidence}) below threshold (${thresholds.minConfidence})`,
        threshold: {
          metric: 'confidence',
          expected: thresholds.minConfidence!,
          actual: metrics.confidence,
        },
        timestamp: new Date(),
      })
    }

    // Check token usage
    if (
      metrics.totalTokensUsed &&
      MetricsCalculator.shouldTriggerAlert(
        'maxTokensPerRequest',
        metrics.totalTokensUsed,
        thresholds.maxTokensPerRequest!
      )
    ) {
      alerts.push({
        id: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentType: metrics.agentType,
        alertType: 'token_limit_exceeded',
        severity: 'medium',
        message: `Agent token usage (${metrics.totalTokensUsed}) exceeded threshold (${thresholds.maxTokensPerRequest})`,
        threshold: {
          metric: 'totalTokens',
          expected: thresholds.maxTokensPerRequest!,
          actual: metrics.totalTokensUsed,
        },
        timestamp: new Date(),
      })
    }

    // Store alerts (implementation would depend on storage backend)
    for (const alert of alerts) {
      console.warn(`🚨 Performance Alert: ${alert.message}`)
      // In production, would store alerts via this.storage.storeAlert(alert)
    }
  }

  /**
   * Flush buffered metrics to storage
   */
  private async flush(): Promise<void> {
    if (this.metricsBuffer.length === 0) {
      return
    }

    try {
      // Store each metric
      for (const metric of this.metricsBuffer) {
        await this.storage.store(metric)
      }

      // Clear buffer
      this.metricsBuffer = []
    } catch (error) {
      console.error('Failed to flush metrics:', error)
      // Keep metrics in buffer for retry
    }
  }

  /**
   * Start the flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error)
    }, this.config.flushInterval)
  }

  /**
   * Stop collecting metrics and flush remaining data
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = undefined
    }

    await this.flush()
  }
}

/**
 * In-memory storage implementation for development/testing
 */
export class MemoryMetricsStorage implements MetricsStorage {
  private metrics: AgentPerformanceMetrics[] = []
  private benchmarks: Map<string, AgentBenchmark> = new Map()
  private alerts: PerformanceAlert[] = []

  async store(metrics: AgentPerformanceMetrics): Promise<void> {
    this.metrics.push(metrics)

    // Update benchmark (simplified version)
    const key = `${metrics.agentType}_day`
    const existing = this.benchmarks.get(key)

    if (!existing) {
      this.benchmarks.set(key, {
        agentType: metrics.agentType,
        period: 'day',
        metrics: {
          averageExecutionTime: metrics.executionTime,
          averageConfidence: metrics.confidence,
          totalRequests: 1,
          successRate: metrics.successRate,
          tokensPerRequest: metrics.totalTokensUsed || 0,
          executionTimeTrend: 'stable',
          confidenceTrend: 'stable',
        },
        sampleSize: 1,
        lastUpdated: new Date(),
      })
    } else {
      // Update existing benchmark
      const total = existing.sampleSize + 1
      existing.metrics.averageExecutionTime =
        (existing.metrics.averageExecutionTime * existing.sampleSize +
          metrics.executionTime) /
        total
      existing.metrics.averageConfidence =
        (existing.metrics.averageConfidence * existing.sampleSize +
          metrics.confidence) /
        total
      existing.metrics.totalRequests = total
      existing.metrics.tokensPerRequest =
        (existing.metrics.tokensPerRequest * existing.sampleSize +
          (metrics.totalTokensUsed || 0)) /
        total
      existing.sampleSize = total
      existing.lastUpdated = new Date()
    }
  }

  async getBenchmark(
    agentType: string,
    period: AgentBenchmark['period']
  ): Promise<AgentBenchmark | null> {
    return this.benchmarks.get(`${agentType}_${period}`) || null
  }

  async getReport(
    agentType: string,
    start: Date,
    end: Date
  ): Promise<AgentPerformanceReport> {
    const agentMetrics = this.metrics.filter(
      m =>
        m.agentType === agentType && m.timestamp >= start && m.timestamp <= end
    )

    const totalExecutions = agentMetrics.length
    const averageExecutionTime =
      totalExecutions > 0
        ? agentMetrics.reduce((sum, m) => sum + m.executionTime, 0) /
          totalExecutions
        : 0
    const averageConfidence =
      totalExecutions > 0
        ? agentMetrics.reduce((sum, m) => sum + m.confidence, 0) /
          totalExecutions
        : 0
    const successRate =
      totalExecutions > 0
        ? (agentMetrics.filter(m => m.successRate === 100).length /
            totalExecutions) *
          100
        : 0

    return {
      agentType,
      period: { start, end },
      summary: {
        totalExecutions,
        averageExecutionTime,
        averageConfidence,
        successRate,
        totalTokensUsed: agentMetrics.reduce(
          (sum, m) => sum + (m.totalTokensUsed || 0),
          0
        ),
      },
      trends: {
        executionTimeHistory: agentMetrics.map(m => ({
          date: m.timestamp,
          value: m.executionTime,
        })),
        confidenceHistory: agentMetrics.map(m => ({
          date: m.timestamp,
          value: m.confidence,
        })),
        errorRateHistory: agentMetrics.map(m => ({
          date: m.timestamp,
          value: m.errorRate,
        })),
      },
      alerts: this.alerts.filter(a => a.agentType === agentType),
      recommendations: this.generateRecommendations(agentMetrics),
    }
  }

  async getAlerts(
    agentType?: string,
    severity?: PerformanceAlert['severity']
  ): Promise<PerformanceAlert[]> {
    return this.alerts.filter(alert => {
      if (agentType && alert.agentType !== agentType) {
        return false
      }
      if (severity && alert.severity !== severity) {
        return false
      }
      return !alert.resolved
    })
  }

  async cleanup(beforeDate: Date): Promise<void> {
    this.metrics = this.metrics.filter(m => m.timestamp >= beforeDate)
    this.alerts = this.alerts.filter(a => a.timestamp >= beforeDate)
  }

  private generateRecommendations(
    metrics: AgentPerformanceMetrics[]
  ): string[] {
    const recommendations: string[] = []

    if (metrics.length === 0) {
      return recommendations
    }

    const avgExecutionTime =
      metrics.reduce((sum, m) => sum + m.executionTime, 0) / metrics.length
    const avgConfidence =
      metrics.reduce((sum, m) => sum + m.confidence, 0) / metrics.length
    const avgTokens =
      metrics.reduce((sum, m) => sum + (m.totalTokensUsed || 0), 0) /
      metrics.length

    if (avgExecutionTime > 20000) {
      recommendations.push(
        'Consider optimizing prompts or using faster model variants to reduce execution time'
      )
    }

    if (avgConfidence < 0.75) {
      recommendations.push(
        'Review prompt engineering to improve agent confidence scores'
      )
    }

    if (avgTokens > 2500) {
      recommendations.push(
        'Consider breaking down complex tasks or using more efficient prompting techniques'
      )
    }

    return recommendations
  }
}

// Global metrics collector instance
let globalCollector: AgentPerformanceCollector | null = null

export function getMetricsCollector(): AgentPerformanceCollector {
  if (!globalCollector) {
    const storage = new MemoryMetricsStorage()
    globalCollector = new AgentPerformanceCollector(storage)
  }
  return globalCollector
}

export function initializeMetricsCollector(
  storage: MetricsStorage,
  config?: Partial<MetricsCollectionConfig>
): AgentPerformanceCollector {
  globalCollector = new AgentPerformanceCollector(storage, config)
  return globalCollector
}
