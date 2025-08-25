/**
 * Cardinal Performance Provider Component
 * Global performance monitoring provider for the application
 */

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

import {
  checkWebVitalAlert,
  checkBudgetAlerts,
} from '../../lib/performance/alerts'
import { clientPerformanceMonitor } from '../../lib/performance/metrics'
import type { WebVitalsMetric } from '../../lib/performance/metrics'
import { webVitalsCollector } from '../../lib/performance/web-vitals'

// Performance context type
interface PerformanceContextType {
  isMonitoring: boolean
  metrics: Record<string, WebVitalsMetric>
  score: number
  alertsEnabled: boolean
  toggleAlerts: (enabled: boolean) => void
  clearMetrics: () => void
}

// Performance context
const PerformanceContext = createContext<PerformanceContextType | null>(null)

// Performance provider props
export interface PerformanceProviderProps {
  children: React.ReactNode
  enableAlerts?: boolean
  debug?: boolean
}

// Performance provider component
export function PerformanceProvider({
  children,
  enableAlerts = true,
  debug = process.env.NODE_ENV === 'development',
}: PerformanceProviderProps) {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [metrics, setMetrics] = useState<Record<string, WebVitalsMetric>>({})
  const [score, setScore] = useState(0)
  const [alertsEnabled, setAlertsEnabled] = useState(enableAlerts)

  // Initialize performance monitoring
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    let mounted = true

    const initializeMonitoring = async () => {
      try {
        // Initialize Web Vitals collector
        await webVitalsCollector.initialize()

        // Set up metric callback
        const unsubscribe = webVitalsCollector.onMetric(
          async (metric: WebVitalsMetric) => {
            if (!mounted) {
              return
            }

            if (debug) {
              console.log('Performance metric received:', metric)
            }

            // Update metrics state
            setMetrics(prev => ({
              ...prev,
              [metric.name]: metric,
            }))

            // Update performance score
            const newScore = webVitalsCollector.getPerformanceScore()
            setScore(newScore)

            // Check for alerts if enabled
            if (alertsEnabled) {
              await checkWebVitalAlert(metric)
            }
          }
        )

        // Periodic budget checks
        const budgetCheckInterval = setInterval(async () => {
          if (mounted && alertsEnabled) {
            await checkBudgetAlerts()
          }
        }, 60000) // Check every minute

        setIsMonitoring(true)

        // Cleanup
        return () => {
          mounted = false
          unsubscribe()
          clearInterval(budgetCheckInterval)
        }
      } catch (error) {
        console.error('Failed to initialize performance monitoring:', error)
        return undefined
      }
    }

    const cleanup = initializeMonitoring()

    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn())
    }
  }, [alertsEnabled, debug])

  // Update alerts enabled state
  const toggleAlerts = (enabled: boolean) => {
    setAlertsEnabled(enabled)
  }

  // Clear all metrics
  const clearMetrics = () => {
    webVitalsCollector.clear()
    clientPerformanceMonitor.clearMetrics()
    setMetrics({})
    setScore(0)
  }

  const contextValue: PerformanceContextType = {
    isMonitoring,
    metrics,
    score,
    alertsEnabled,
    toggleAlerts,
    clearMetrics,
  }

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  )
}

// Hook to use performance context
export function usePerformanceContext(): PerformanceContextType {
  const context = useContext(PerformanceContext)

  if (!context) {
    throw new Error(
      'usePerformanceContext must be used within a PerformanceProvider'
    )
  }

  return context
}

// Performance debug panel (development only)
export function PerformanceDebugPanel() {
  const { metrics, score, alertsEnabled, toggleAlerts, clearMetrics } =
    usePerformanceContext()

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg max-w-sm text-xs z-50">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold">Performance Debug</h4>
        <button
          onClick={clearMetrics}
          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
        >
          Clear
        </button>
      </div>

      <div className="space-y-1">
        <div>
          Score: <span className="font-mono">{score}/100</span>
        </div>
        <div>
          Alerts:
          <button
            onClick={() => toggleAlerts(!alertsEnabled)}
            className={`ml-2 px-2 py-0.5 rounded text-xs ${
              alertsEnabled
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {alertsEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="border-t border-gray-600 pt-2 mt-2">
          {Object.entries(metrics).map(([name, metric]) => (
            <div key={name} className="flex justify-between">
              <span>{name}:</span>
              <span
                className={`font-mono ${
                  metric.rating === 'good'
                    ? 'text-green-400'
                    : metric.rating === 'needs-improvement'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }`}
              >
                {name === 'CLS'
                  ? metric.value.toFixed(3)
                  : Math.round(metric.value)}
                {name !== 'CLS' ? 'ms' : ''}
              </span>
            </div>
          ))}
        </div>

        {Object.keys(metrics).length === 0 && (
          <div className="text-gray-400 italic">No metrics collected yet</div>
        )}
      </div>
    </div>
  )
}

export default PerformanceProvider
