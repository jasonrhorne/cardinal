/**
 * E009: Agent Performance Dashboard
 * React component for visualizing agent performance metrics
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import type {
  AgentBenchmark,
  PerformanceAlert,
  AgentPerformanceReport,
} from '@/lib/agents/performance-metrics'

interface AgentPerformanceDashboardProps {
  agentTypes: string[]
  onRefresh?: () => void
}

export function AgentPerformanceDashboard({
  agentTypes,
  onRefresh,
}: AgentPerformanceDashboardProps) {
  const [benchmarks, setBenchmarks] = useState<Map<string, AgentBenchmark>>(
    new Map()
  )
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [reports, setReports] = useState<Map<string, AgentPerformanceReport>>(
    new Map()
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'hour' | 'day' | 'week'>(
    'day'
  )

  useEffect(() => {
    loadPerformanceData()
  }, [agentTypes, selectedPeriod])

  const loadPerformanceData = async () => {
    setLoading(true)
    setError(null)

    try {
      // In a real implementation, this would call the metrics collector
      // For now, we'll simulate the data structure
      const mockBenchmarks = new Map<string, AgentBenchmark>()
      const mockReports = new Map<string, AgentPerformanceReport>()

      for (const agentType of agentTypes) {
        // Mock benchmark data
        mockBenchmarks.set(agentType, {
          agentType,
          period: selectedPeriod,
          metrics: {
            averageExecutionTime: Math.random() * 10000 + 5000, // 5-15 seconds
            averageConfidence: 0.7 + Math.random() * 0.25, // 0.7-0.95
            totalRequests: Math.floor(Math.random() * 100) + 10,
            successRate: 90 + Math.random() * 10, // 90-100%
            tokensPerRequest: Math.floor(Math.random() * 2000) + 1000,
            executionTimeTrend: Math.random() > 0.5 ? 'improving' : 'stable',
            confidenceTrend: Math.random() > 0.3 ? 'stable' : 'improving',
          },
          sampleSize: Math.floor(Math.random() * 50) + 10,
          lastUpdated: new Date(),
        })

        // Mock report data
        const totalExecutions = Math.floor(Math.random() * 200) + 50
        mockReports.set(agentType, {
          agentType,
          period: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            end: new Date(),
          },
          summary: {
            totalExecutions,
            averageExecutionTime: Math.random() * 8000 + 3000,
            averageConfidence: 0.75 + Math.random() * 0.2,
            successRate: 92 + Math.random() * 7,
            totalTokensUsed: Math.floor(
              totalExecutions * (1000 + Math.random() * 1500)
            ),
            estimatedCost: totalExecutions * (0.01 + Math.random() * 0.03),
          },
          trends: {
            executionTimeHistory: [],
            confidenceHistory: [],
            errorRateHistory: [],
          },
          alerts: [],
          recommendations: [
            'Consider optimizing prompts for better performance',
            'Monitor token usage to control costs',
          ],
        })
      }

      setBenchmarks(mockBenchmarks)
      setReports(mockReports)

      // Mock alerts
      setAlerts([
        {
          id: 'alert_1',
          agentType: agentTypes[0] || 'concierge',
          alertType: 'slow_response',
          severity: 'medium',
          message: 'Average execution time exceeded threshold',
          threshold: {
            metric: 'executionTime',
            expected: 20000,
            actual: 25000,
          },
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
      ])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load performance data'
      )
    } finally {
      setLoading(false)
    }
  }

  const formatExecutionTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`
  }

  const getAlertSeverityColor = (
    severity: PerformanceAlert['severity']
  ): string => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTrendIcon = (
    trend: 'improving' | 'stable' | 'degrading'
  ): string => {
    switch (trend) {
      case 'improving':
        return '📈'
      case 'degrading':
        return '📉'
      default:
        return '➡️'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
        <span className="ml-2 text-gray-600">Loading performance data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-red-600">
          <h3 className="text-lg font-semibold mb-2">
            Error Loading Performance Data
          </h3>
          <p>{error}</p>
          <button
            onClick={loadPerformanceData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Agent Performance Dashboard
          </h2>
          <p className="text-gray-600">
            E009: Real-time AI agent performance monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={e =>
              setSelectedPeriod(e.target.value as 'hour' | 'day' | 'week')
            }
            className="px-3 py-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="hour">Last Hour</option>
            <option value="day">Last Day</option>
            <option value="week">Last Week</option>
          </select>
          <button
            onClick={() => {
              loadPerformanceData()
              onRefresh?.()
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-600">
            🚨 Active Alerts
          </h3>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${getAlertSeverityColor(alert.severity)}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{alert.agentType}</div>
                    <div className="text-sm">{alert.message}</div>
                    <div className="text-xs mt-1">
                      Expected: {alert.threshold.expected}, Actual:{' '}
                      {alert.threshold.actual}
                    </div>
                  </div>
                  <Badge className={getAlertSeverityColor(alert.severity)}>
                    {alert.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Agent Benchmarks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from(benchmarks.entries()).map(([agentType, benchmark]) => (
          <Card key={agentType} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold capitalize">{agentType}</h3>
              <Badge className="bg-green-100 text-green-800">
                {benchmark.sampleSize} samples
              </Badge>
            </div>

            <div className="space-y-4">
              {/* Execution Time */}
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Avg Execution Time
                  </span>
                  <span className="text-sm">
                    {getTrendIcon(benchmark.metrics.executionTimeTrend)}
                  </span>
                </div>
                <div className="text-lg font-semibold">
                  {formatExecutionTime(benchmark.metrics.averageExecutionTime)}
                </div>
              </div>

              {/* Confidence */}
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Confidence</span>
                  <span className="text-sm">
                    {getTrendIcon(benchmark.metrics.confidenceTrend)}
                  </span>
                </div>
                <div className="text-lg font-semibold">
                  {formatConfidence(benchmark.metrics.averageConfidence)}
                </div>
              </div>

              {/* Success Rate */}
              <div>
                <span className="text-sm text-gray-600">Success Rate</span>
                <div className="text-lg font-semibold text-green-600">
                  {Math.round(benchmark.metrics.successRate)}%
                </div>
              </div>

              {/* Token Usage */}
              <div>
                <span className="text-sm text-gray-600">
                  Tokens per Request
                </span>
                <div className="text-lg font-semibold">
                  {Math.round(benchmark.metrics.tokensPerRequest)}
                </div>
              </div>

              {/* Total Requests */}
              <div>
                <span className="text-sm text-gray-600">Total Requests</span>
                <div className="text-lg font-semibold">
                  {benchmark.metrics.totalRequests.toLocaleString()}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Detailed Reports */}
      {reports.size > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            📊 Detailed Performance Reports
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Executions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Tokens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. Cost
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from(reports.entries()).map(([agentType, report]) => (
                  <tr key={agentType}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                      {agentType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.summary.totalExecutions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatExecutionTime(report.summary.averageExecutionTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.round(report.summary.successRate)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.summary.totalTokensUsed.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${report.summary.estimatedCost?.toFixed(2) || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

export default AgentPerformanceDashboard
