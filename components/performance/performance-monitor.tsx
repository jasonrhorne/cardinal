/**
 * Cardinal Performance Monitor Component
 * React component for displaying performance metrics and monitoring
 */

'use client'

import React, { useEffect, useState } from 'react'

import { clientPerformanceMonitor } from '../../lib/performance/metrics'
import type { WebVitalsMetric } from '../../lib/performance/metrics'
import { useWebVitals } from '../../lib/performance/web-vitals'

// Performance Monitor Props
export interface PerformanceMonitorProps {
  showDetails?: boolean
  className?: string
  onMetricUpdate?: (metric: WebVitalsMetric) => void
}

// Performance status indicator
interface PerformanceStatusProps {
  score: number
  size?: 'small' | 'medium' | 'large'
}

function PerformanceStatus({ score, size = 'medium' }: PerformanceStatusProps) {
  const getStatusColor = (score: number): string => {
    if (score >= 90) {
      return 'text-green-600 bg-green-100'
    }
    if (score >= 50) {
      return 'text-yellow-600 bg-yellow-100'
    }
    return 'text-red-600 bg-red-100'
  }

  const getStatusText = (score: number): string => {
    if (score >= 90) {
      return 'Good'
    }
    if (score >= 50) {
      return 'Needs Improvement'
    }
    return 'Poor'
  }

  const sizeClasses = {
    small: 'text-xs px-2 py-1',
    medium: 'text-sm px-3 py-1',
    large: 'text-base px-4 py-2',
  }

  return (
    <div
      className={`inline-flex items-center rounded-full font-medium ${getStatusColor(score)} ${sizeClasses[size]}`}
    >
      <div className="w-2 h-2 rounded-full bg-current mr-2" />
      {getStatusText(score)} ({score}/100)
    </div>
  )
}

// Web Vitals metric display
interface MetricDisplayProps {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  unit: string
}

function MetricDisplay({ name, value, rating, unit }: MetricDisplayProps) {
  const getRatingColor = (rating: string): string => {
    switch (rating) {
      case 'good':
        return 'text-green-600'
      case 'needs-improvement':
        return 'text-yellow-600'
      case 'poor':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatValue = (value: number, unit: string): string => {
    if (unit === 'ms') {
      return value < 1000
        ? `${Math.round(value)}ms`
        : `${(value / 1000).toFixed(1)}s`
    }
    if (unit === 'score') {
      return value.toFixed(3)
    }
    return `${Math.round(value)}${unit}`
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
      <div>
        <div className="text-sm font-medium text-gray-900">{name}</div>
        <div
          className={`text-xs font-medium ${getRatingColor(rating)} capitalize`}
        >
          {rating.replace('-', ' ')}
        </div>
      </div>
      <div className={`text-lg font-bold ${getRatingColor(rating)}`}>
        {formatValue(value, unit)}
      </div>
    </div>
  )
}

// Resource timing summary
interface ResourceTimingSummaryProps {
  summary: {
    totalRequests: number
    totalSize: number
    averageDuration: number
    slowRequests: number
    byType: Record<string, { count: number; totalDuration: number }>
  } | null
}

function ResourceTimingSummary({ summary }: ResourceTimingSummaryProps) {
  if (!summary) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500">
          Resource timing data not available
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-3 rounded-lg border">
          <div className="text-2xl font-bold text-gray-900">
            {summary.totalRequests}
          </div>
          <div className="text-sm text-gray-600">Total Requests</div>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(summary.averageDuration)}ms
          </div>
          <div className="text-sm text-gray-600">Avg Duration</div>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(summary.totalSize / 1024)}KB
          </div>
          <div className="text-sm text-gray-600">Total Size</div>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <div
            className={`text-2xl font-bold ${summary.slowRequests > 0 ? 'text-red-600' : 'text-green-600'}`}
          >
            {summary.slowRequests}
          </div>
          <div className="text-sm text-gray-600">Slow Requests</div>
        </div>
      </div>

      {/* Resource breakdown by type */}
      <div className="bg-white p-4 rounded-lg border">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Resources by Type
        </h4>
        <div className="space-y-2">
          {Object.entries(summary.byType).map(([type, data]) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 capitalize">
                {type}
              </span>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {data.count}
                </div>
                <div className="text-xs text-gray-500">
                  {Math.round(data.totalDuration / data.count)}ms avg
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Main Performance Monitor Component
export function PerformanceMonitor({
  showDetails = false,
  className = '',
  onMetricUpdate,
}: PerformanceMonitorProps) {
  const { metrics, score, summary, collector } = useWebVitals({
    debug: process.env.NODE_ENV === 'development',
    sendToAnalytics: true,
    endpoint: '/api/analytics/web-vitals',
  })

  const [resourceSummary, setResourceSummary] = useState<any>(null)
  const [isExpanded, setIsExpanded] = useState(showDetails)

  useEffect(() => {
    // Set up metric callback
    if (collector && onMetricUpdate) {
      return collector.onMetric(onMetricUpdate)
    }
    return undefined
  }, [collector, onMetricUpdate])

  useEffect(() => {
    // Get resource timing summary
    const updateResourceSummary = () => {
      const summary = clientPerformanceMonitor.getResourceTimingSummary()
      setResourceSummary(summary)
    }

    updateResourceSummary()
    const interval = setInterval(updateResourceSummary, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  // Core Web Vitals metrics with their units
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

  if (process.env.NODE_ENV === 'production' && !showDetails) {
    // In production, only show performance status unless explicitly requested
    return (
      <div className={`performance-monitor ${className}`}>
        <PerformanceStatus score={score} />
      </div>
    )
  }

  return (
    <div className={`performance-monitor space-y-4 ${className}`}>
      {/* Performance Status Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Performance Monitor
          </h3>
          <p className="text-sm text-gray-600">Real-time performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <PerformanceStatus score={score} />
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Core Web Vitals */}
          {availableMetrics.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Core Web Vitals
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableMetrics.map(metric => {
                  const metricData = metrics[metric.key as keyof typeof metrics]
                  if (!metricData) {
                    return null
                  }

                  // Type assertion to ensure metricData is defined
                  const data = metricData as any

                  return (
                    <MetricDisplay
                      key={metric.key}
                      name={metric.name}
                      value={data.value}
                      rating={data.rating}
                      unit={metric.unit}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Resource Timing Summary */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Resource Performance
            </h4>
            <ResourceTimingSummary summary={resourceSummary} />
          </div>

          {/* Performance Summary */}
          {summary && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {summary.metrics}
                  </div>
                  <div className="text-xs text-gray-600">Metrics Collected</div>
                </div>
                <div>
                  <div
                    className={`text-lg font-bold ${summary.issues > 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {summary.issues}
                  </div>
                  <div className="text-xs text-gray-600">Issues</div>
                </div>
                <div>
                  <div
                    className={`text-lg font-bold ${summary.warnings > 0 ? 'text-yellow-600' : 'text-green-600'}`}
                  >
                    {summary.warnings}
                  </div>
                  <div className="text-xs text-gray-600">Warnings</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {summary.score}
                  </div>
                  <div className="text-xs text-gray-600">Performance Score</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Lightweight performance badge for production
export function PerformanceBadge({ className = '' }: { className?: string }) {
  const { score } = useWebVitals()

  return (
    <div className={className}>
      <PerformanceStatus score={score} size="small" />
    </div>
  )
}

export default PerformanceMonitor
