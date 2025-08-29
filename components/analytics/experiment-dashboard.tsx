'use client'

/**
 * Experiment Analytics Dashboard
 * Displays experiment tracking data and input method performance metrics
 */

import {
  BarChart3,
  Users,
  Target,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'
import { useState, useEffect } from 'react'

import { Button, Card } from '@/components/ui'
import type { ExperimentAnalytics } from '@/lib/analytics/experiment-tracker'
import { useExperimentTracking } from '@/lib/analytics/experiment-tracker'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

function MetricCard({ title, value, subtitle, icon, trend }: MetricCardProps) {
  const trendColor =
    trend === 'up'
      ? 'text-green-600'
      : trend === 'down'
        ? 'text-red-600'
        : 'text-gray-600'

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg bg-blue-50 ${trendColor}`}>{icon}</div>
      </div>
    </Card>
  )
}

interface MethodComparisonProps {
  analytics: ExperimentAnalytics
}

function MethodComparison({ analytics }: MethodComparisonProps) {
  const methods = [
    { key: 'constrained-form', name: 'Structured Form', color: 'bg-blue-500' },
    { key: 'open-text', name: 'Natural Language', color: 'bg-green-500' },
    { key: 'guided-prompts', name: 'Chat Interview', color: 'bg-purple-500' },
  ]

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        Input Method Comparison
      </h3>

      <div className="space-y-6">
        {/* Popularity Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Method Popularity (Attempts)
          </h4>
          <div className="space-y-3">
            {methods.map(method => {
              const attempts = analytics.methodPopularity[method.key] || 0
              const maxAttempts = Math.max(
                ...Object.values(analytics.methodPopularity)
              )
              const width = maxAttempts > 0 ? (attempts / maxAttempts) * 100 : 0

              return (
                <div key={method.key} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600">
                    {method.name}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${method.color} transition-all duration-500`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <div className="w-12 text-sm font-medium text-gray-900 text-right">
                    {attempts}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Completion Rates */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Completion Rates
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {methods.map(method => {
              const rate = analytics.methodCompletionRates[method.key] || 0
              return (
                <div key={method.key} className="text-center">
                  <div
                    className={`w-16 h-16 mx-auto rounded-full ${method.color} flex items-center justify-center text-white font-bold text-lg mb-2`}
                  >
                    {Math.round(rate)}%
                  </div>
                  <p className="text-xs text-gray-600">{method.name}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Average Completion Time */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Average Completion Time (seconds)
          </h4>
          <div className="space-y-2">
            {methods.map(method => {
              const time =
                analytics.methodAverageCompletionTime[method.key] || 0
              const timeInSeconds = Math.round(time / 1000)

              return (
                <div
                  key={method.key}
                  className="flex justify-between items-center py-1"
                >
                  <span className="text-sm text-gray-600">{method.name}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {timeInSeconds}s
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}

interface UserSegmentProps {
  analytics: ExperimentAnalytics
}

function UserSegments({ analytics }: UserSegmentProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Users className="h-5 w-5" />
        User Segments
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {analytics.userSegments.mobile}
          </div>
          <div className="text-sm text-gray-600">Mobile Users</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {analytics.userSegments.desktop}
          </div>
          <div className="text-sm text-gray-600">Desktop Users</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {analytics.userSegments.authenticated}
          </div>
          <div className="text-sm text-gray-600">Authenticated</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">
            {analytics.userSegments.anonymous}
          </div>
          <div className="text-sm text-gray-600">Anonymous</div>
        </div>
      </div>
    </Card>
  )
}

export function ExperimentDashboard() {
  const [analytics, setAnalytics] = useState<ExperimentAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { getAnalytics, exportData } = useExperimentTracking()

  useEffect(() => {
    loadAnalytics()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadAnalytics = () => {
    setIsLoading(true)
    try {
      const data = getAnalytics()
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cardinal-experiment-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Data Available
        </h3>
        <p className="text-gray-600 mb-4">
          Start using the input methods to generate experiment data.
        </p>
        <Button onClick={loadAnalytics}>Refresh</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Experiment Analytics
          </h1>
          <p className="text-gray-600">
            Input method performance and user behavior tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadAnalytics}>
            Refresh
          </Button>
          <Button onClick={handleExport}>Export Data</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Sessions"
          value={analytics.totalSessions}
          icon={<Users className="h-5 w-5" />}
        />

        <MetricCard
          title="Conversion Rate"
          value={`${analytics.conversionRate.toFixed(1)}%`}
          subtitle={`${analytics.completedSessions} completed`}
          icon={<Target className="h-5 w-5" />}
          trend={
            analytics.conversionRate > 50
              ? 'up'
              : analytics.conversionRate > 25
                ? 'neutral'
                : 'down'
          }
        />

        <MetricCard
          title="Most Popular Method"
          value={
            Object.entries(analytics.methodPopularity).length > 0
              ? Object.entries(analytics.methodPopularity)
                  .sort(([, a], [, b]) => b - a)[0]?.[0]
                  ?.replace('constrained-form', 'Form')
                  ?.replace('open-text', 'Natural')
                  ?.replace('guided-prompts', 'Chat') || 'None'
              : 'None'
          }
          icon={<TrendingUp className="h-5 w-5" />}
        />

        <MetricCard
          title="Average Errors"
          value={`${Object.values(analytics.methodErrorRates)
            .reduce((avg, rate, _, arr) => avg + rate / arr.length, 0)
            .toFixed(1)}%`}
          icon={<AlertTriangle className="h-5 w-5" />}
          trend="neutral"
        />
      </div>

      {/* Method Comparison */}
      <MethodComparison analytics={analytics} />

      {/* User Segments */}
      <UserSegments analytics={analytics} />

      {/* Abandonment Points */}
      {Object.keys(analytics.abandonmentPoints).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Abandonment Points
          </h3>
          <div className="space-y-2">
            {Object.entries(analytics.abandonmentPoints)
              .sort(([, a], [, b]) => b - a)
              .map(([point, count]) => (
                <div
                  key={point}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                >
                  <span className="text-sm text-gray-700">{point}</span>
                  <span className="text-sm font-medium text-red-600">
                    {count} abandonments
                  </span>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Raw Data Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Data Summary
        </h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            • Tracking {Object.keys(analytics.methodPopularity).length} input
            methods
          </p>
          <p>• {analytics.totalSessions} total sessions recorded</p>
          <p>• {analytics.completedSessions} successful completions</p>
          <p>• Data available for export and detailed analysis</p>
        </div>
      </Card>
    </div>
  )
}
