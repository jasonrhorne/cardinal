/**
 * E009: Agent Performance Metrics System
 * Types and interfaces for tracking AI agent performance
 */

export interface AgentPerformanceMetrics {
  // Execution Metrics
  executionTime: number // milliseconds
  totalTokensUsed: number
  requestCount: number

  // Quality Metrics
  confidence: number // 0-1 scale
  successRate: number // percentage of successful executions
  errorRate: number // percentage of failed executions

  // LLM-Specific Metrics
  promptTokens: number
  completionTokens: number
  averageResponseTime: number // milliseconds

  // Agent-Specific Metrics
  agentType: string
  tasksCompleted: number
  averageTaskComplexity?: number // 1-5 scale

  // Timestamp and Session Info
  timestamp: Date
  sessionId: string
  requestId: string
}

export interface AgentBenchmark {
  agentType: string
  period: 'hour' | 'day' | 'week' | 'month'
  metrics: {
    averageExecutionTime: number
    averageConfidence: number
    totalRequests: number
    successRate: number

    // Token efficiency
    tokensPerRequest: number
    costPerRequest?: number

    // Performance trends
    executionTimeTrend: 'improving' | 'stable' | 'degrading'
    confidenceTrend: 'improving' | 'stable' | 'degrading'
  }
  sampleSize: number
  lastUpdated: Date
}

export interface PerformanceAlert {
  id: string
  agentType: string
  alertType:
    | 'performance_degradation'
    | 'high_error_rate'
    | 'slow_response'
    | 'token_limit_exceeded'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  threshold: {
    metric: string
    expected: number
    actual: number
  }
  timestamp: Date
  resolved?: boolean
}

export interface AgentPerformanceReport {
  agentType: string
  period: {
    start: Date
    end: Date
  }
  summary: {
    totalExecutions: number
    averageExecutionTime: number
    averageConfidence: number
    successRate: number
    totalTokensUsed: number
    estimatedCost?: number
  }
  trends: {
    executionTimeHistory: Array<{ date: Date; value: number }>
    confidenceHistory: Array<{ date: Date; value: number }>
    errorRateHistory: Array<{ date: Date; value: number }>
  }
  alerts: PerformanceAlert[]
  recommendations: string[]
}

export interface MetricsCollectionConfig {
  enableCollection: boolean
  sampleRate: number // 0-1, percentage of requests to collect metrics for
  batchSize: number
  flushInterval: number // milliseconds
  retentionPeriod: number // days
  alertThresholds: {
    maxExecutionTime: number // milliseconds
    minConfidence: number // 0-1
    maxErrorRate: number // percentage
    maxTokensPerRequest: number
  }
}

export interface MetricsStorage {
  store(metrics: AgentPerformanceMetrics): Promise<void>
  getBenchmark(
    agentType: string,
    period: AgentBenchmark['period']
  ): Promise<AgentBenchmark | null>
  getReport(
    agentType: string,
    start: Date,
    end: Date
  ): Promise<AgentPerformanceReport>
  getAlerts(
    agentType?: string,
    severity?: PerformanceAlert['severity']
  ): Promise<PerformanceAlert[]>
  cleanup(beforeDate: Date): Promise<void>
}

// Performance thresholds for different agent types
export const DEFAULT_PERFORMANCE_THRESHOLDS: Record<
  string,
  Partial<MetricsCollectionConfig['alertThresholds']>
> = {
  destination: {
    maxExecutionTime: 15000, // 15 seconds
    minConfidence: 0.7,
    maxErrorRate: 5,
    maxTokensPerRequest: 2000,
  },
  concierge: {
    maxExecutionTime: 45000, // 45 seconds (orchestration takes longer)
    minConfidence: 0.75,
    maxErrorRate: 3,
    maxTokensPerRequest: 4000,
  },
  lodging: {
    maxExecutionTime: 20000, // 20 seconds
    minConfidence: 0.8,
    maxErrorRate: 5,
    maxTokensPerRequest: 2500,
  },
  'food-dining': {
    maxExecutionTime: 20000, // 20 seconds
    minConfidence: 0.85, // Higher confidence expected for dining recommendations
    maxErrorRate: 5,
    maxTokensPerRequest: 2500,
  },
  'quality-validator': {
    maxExecutionTime: 10000, // 10 seconds (validation should be fast)
    minConfidence: 0.9, // Very high confidence for validation
    maxErrorRate: 2,
    maxTokensPerRequest: 1500,
  },
}

// Utility functions for metrics calculation
export class MetricsCalculator {
  static calculateSuccessRate(totalRequests: number, failures: number): number {
    if (totalRequests === 0) return 0
    return Math.max(
      0,
      Math.min(100, ((totalRequests - failures) / totalRequests) * 100)
    )
  }

  static calculateAverageResponseTime(executionTimes: number[]): number {
    if (executionTimes.length === 0) return 0
    return (
      executionTimes.reduce((sum, time) => sum + time, 0) /
      executionTimes.length
    )
  }

  static calculateTrend(
    values: number[]
  ): 'improving' | 'stable' | 'degrading' {
    if (values.length < 2) return 'stable'

    const recent = values.slice(-5) // Last 5 values
    const older = values.slice(-10, -5) // Previous 5 values

    if (recent.length === 0 || older.length === 0) return 'stable'

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length

    const changeThreshold = 0.05 // 5% change threshold
    const percentChange = Math.abs(recentAvg - olderAvg) / olderAvg

    if (percentChange < changeThreshold) return 'stable'

    // For execution time, lower is better
    // For confidence, higher is better
    return recentAvg < olderAvg ? 'improving' : 'degrading'
  }

  static shouldTriggerAlert(
    metric: keyof MetricsCollectionConfig['alertThresholds'],
    value: number,
    threshold: number
  ): boolean {
    switch (metric) {
      case 'maxExecutionTime':
        return value > threshold
      case 'minConfidence':
        return value < threshold
      case 'maxErrorRate':
        return value > threshold
      case 'maxTokensPerRequest':
        return value > threshold
      default:
        return false
    }
  }
}
