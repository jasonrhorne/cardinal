/**
 * Cardinal Performance Dashboard Component
 * Comprehensive performance monitoring dashboard with alerts and budgets
 */

'use client'

import React, { useState, useEffect } from 'react'

import { performanceAlerting } from '../../lib/performance/alerts'
import type { AlertEvent } from '../../lib/performance/alerts'
import { performanceBudgetMonitor } from '../../lib/performance/metrics'
import type { PerformanceBudget } from '../../lib/performance/metrics'
import { useWebVitals } from '../../lib/performance/web-vitals'

// Dashboard props
export interface PerformanceDashboardProps {
  className?: string
  refreshIntervalMs?: number
}

// Alert severity badge component
function AlertBadge({ severity }: { severity: string }) {
  const getBadgeStyles = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'error':
        return 'bg-red-50 text-red-700 border-red-100'
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-100'
      case 'info':
        return 'bg-blue-50 text-blue-700 border-blue-100'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100'
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getBadgeStyles(severity)}`}
    >
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  )
}

// Performance score circle component
function PerformanceScoreCircle({ score }: { score: number }) {
  const getScoreColor = (score: number): string => {
    if (score >= 90) {
      return 'text-green-600'
    }
    if (score >= 50) {
      return 'text-yellow-600'
    }
    return 'text-red-600'
  }

  const getStrokeColor = (score: number): string => {
    if (score >= 90) {
      return '#059669'
    } // green-600
    if (score >= 50) {
      return '#d97706'
    } // yellow-600
    return '#dc2626' // red-600
  }

  const circumference = 2 * Math.PI * 45 // radius = 45
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="#e5e7eb"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke={getStrokeColor(score)}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={`text-xl font-bold ${getScoreColor(score)}`}>
            {score}
          </div>
          <div className="text-xs text-gray-500">Score</div>
        </div>
      </div>
    </div>
  )
}

// Budget status component
function BudgetStatus({ budget }: { budget: PerformanceBudget }) {
  const getStatusStyles = (status: string): string => {
    switch (status) {
      case 'pass':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'fail':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const formatValue = (value: number, metric: string): string => {
    if (metric.includes('Paint') || metric.includes('Byte')) {
      return value < 1000
        ? `${Math.round(value)}ms`
        : `${(value / 1000).toFixed(1)}s`
    }
    if (metric.includes('Shift')) {
      return value.toFixed(3)
    }
    if (metric.includes('Size')) {
      return `${Math.round(value / 1024)}KB`
    }
    return value.toString()
  }

  const percentage = Math.min((budget.current / budget.budget) * 100, 100)

  return (
    <div className={`p-4 rounded-lg border ${getStatusStyles(budget.status)}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{budget.metric}</h4>
        <span className="text-xs font-medium uppercase">{budget.status}</span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Current: {formatValue(budget.current, budget.metric)}</span>
          <span>Budget: {formatValue(budget.budget, budget.metric)}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              budget.status === 'pass'
                ? 'bg-green-500'
                : budget.status === 'warning'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        <div className="text-xs text-gray-600">
          {percentage.toFixed(1)}% of budget used
        </div>
      </div>
    </div>
  )
}

// Recent alerts component
function RecentAlerts({ alerts }: { alerts: AlertEvent[] }) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-lg">✅ No recent alerts</div>
        <div className="text-sm">Your application is performing well</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {alerts.slice(0, 10).map((alert, index) => (
        <div
          key={`${alert.alertId}-${index}`}
          className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
        >
          <AlertBadge severity={alert.severity} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">
              {alert.message}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(alert.timestamp).toLocaleString()}
            </div>
            {alert.metadata && (
              <div className="text-xs text-gray-400 mt-1">
                {alert.metric}: {alert.value} (threshold: {alert.threshold})
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Alert statistics component
function AlertStats() {
  const [stats, setStats] = useState<any>({})

  useEffect(() => {
    const updateStats = () => {
      const alertStats = performanceAlerting.getAlertStats()
      const recentAlerts = performanceAlerting.getRecentAlertsBySeverity(24)
      setStats({ ...alertStats, ...recentAlerts })
    }

    updateStats()
    const interval = setInterval(updateStats, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-blue-600">
          {stats.totalAlerts || 0}
        </div>
        <div className="text-sm text-blue-700">Total Alerts</div>
      </div>
      <div className="bg-yellow-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-yellow-600">
          {stats.warning || 0}
        </div>
        <div className="text-sm text-yellow-700">Warnings (24h)</div>
      </div>
      <div className="bg-red-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-red-600">
          {stats.error || 0}
        </div>
        <div className="text-sm text-red-700">Errors (24h)</div>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-purple-600">
          {stats.critical || 0}
        </div>
        <div className="text-sm text-purple-700">Critical (24h)</div>
      </div>
    </div>
  )
}

// Main performance dashboard component
export function PerformanceDashboard({
  className = '',
  refreshIntervalMs = 30000,
}: PerformanceDashboardProps) {
  const { metrics, score, summary } = useWebVitals({
    debug: process.env.NODE_ENV === 'development',
    sendToAnalytics: true,
    endpoint: '/api/analytics/web-vitals',
  })

  const [alerts, setAlerts] = useState<AlertEvent[]>([])
  const [budgets, setBudgets] = useState<Record<string, PerformanceBudget>>({})
  const [activeTab, setActiveTab] = useState<'overview' | 'budgets' | 'alerts'>(
    'overview'
  )

  // Update alerts and budgets
  useEffect(() => {
    const updateData = () => {
      const recentAlerts = performanceAlerting.getAlertHistory(20)
      setAlerts(recentAlerts)

      const allBudgets = performanceBudgetMonitor.getAllBudgets()
      setBudgets(allBudgets)
    }

    updateData()
    const interval = setInterval(updateData, refreshIntervalMs)

    return () => clearInterval(interval)
  }, [refreshIntervalMs])

  const coreMetrics = [
    { key: 'LCP', name: 'Largest Contentful Paint', unit: 'ms' },
    { key: 'FID', name: 'First Input Delay', unit: 'ms' },
    { key: 'CLS', name: 'Cumulative Layout Shift', unit: 'score' },
    { key: 'FCP', name: 'First Contentful Paint', unit: 'ms' },
    { key: 'TTFB', name: 'Time to First Byte', unit: 'ms' },
    { key: 'INP', name: 'Interaction to Next Paint', unit: 'ms' },
  ]

  const availableMetrics = coreMetrics.filter(
    metric => metrics[metric.key as keyof typeof metrics]
  )

  return (
    <div className={`performance-dashboard space-y-6 ${className}`}>
      {/* Header with score */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Performance Dashboard
          </h2>
          <p className="text-gray-600">Real-time monitoring and alerts</p>
        </div>
        <PerformanceScoreCircle score={score} />
      </div>

      {/* Alert statistics */}
      <AlertStats />

      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'budgets', label: 'Budgets', icon: '💰' },
            { key: 'alerts', label: 'Alerts', icon: '🚨' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Core Web Vitals */}
            {availableMetrics.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Core Web Vitals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableMetrics.map(metric => {
                    const metricData =
                      metrics[metric.key as keyof typeof metrics]
                    if (!metricData) {
                      return null
                    }

                    // Type assertion to ensure metricData is defined
                    const data = metricData as any

                    return (
                      <div
                        key={metric.key}
                        className="bg-white p-4 rounded-lg border border-gray-200"
                      >
                        <div className="text-sm font-medium text-gray-700">
                          {metric.name}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mt-1">
                          {metric.unit === 'ms' && data.value < 1000
                            ? `${Math.round(data.value)}ms`
                            : metric.unit === 'ms'
                              ? `${(data.value / 1000).toFixed(1)}s`
                              : metric.unit === 'score'
                                ? data.value.toFixed(3)
                                : Math.round(data.value)}
                        </div>
                        <div
                          className={`text-sm font-medium mt-1 capitalize ${
                            data.rating === 'good'
                              ? 'text-green-600'
                              : data.rating === 'needs-improvement'
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {data.rating.replace('-', ' ')}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Performance Summary */}
            {summary && (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Performance Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {summary.metrics}
                    </div>
                    <div className="text-sm text-gray-600">
                      Metrics Collected
                    </div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${summary.issues > 0 ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {summary.issues}
                    </div>
                    <div className="text-sm text-gray-600">Issues</div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${summary.warnings > 0 ? 'text-yellow-600' : 'text-green-600'}`}
                    >
                      {summary.warnings}
                    </div>
                    <div className="text-sm text-gray-600">Warnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {summary.score}
                    </div>
                    <div className="text-sm text-gray-600">Overall Score</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'budgets' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Performance Budgets
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(budgets).map(budget => (
                <BudgetStatus key={budget.metric} budget={budget} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Alerts
            </h3>
            <RecentAlerts alerts={alerts} />
          </div>
        )}
      </div>
    </div>
  )
}

export default PerformanceDashboard
