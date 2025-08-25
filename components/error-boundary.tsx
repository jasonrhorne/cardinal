/**
 * Cardinal React Error Boundaries
 * Comprehensive error handling for React components
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

import { logger } from '../lib/logging/logger'

// Error boundary props
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'page' | 'component' | 'feature'
  context?: string
}

// Error boundary state
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorId: string | null
}

// Main error boundary component
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryCount = 0
  private readonly maxRetries = 3

  constructor(props: ErrorBoundaryProps) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    }
  }

  static override getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorId: crypto.randomUUID(),
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component', context } = this.props

    // Log the error
    this.logError(error, errorInfo, level, context)

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo)
    }
  }

  private async logError(
    error: Error,
    errorInfo: ErrorInfo,
    level: string,
    context?: string
  ) {
    try {
      await logger.error(
        'client',
        'React Error Boundary caught error',
        {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          errorInfo: {
            componentStack: errorInfo.componentStack,
          },
          boundary: {
            level,
            context: context || 'unknown',
            retryCount: this.retryCount,
          },
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
        error
      )
    } catch (logError) {
      // Fallback to console if logger fails
      console.error('Error boundary logging failed:', logError)
      console.error('Original error:', error)
      console.error('Error info:', errorInfo)
    }
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      this.setState({
        hasError: false,
        error: null,
        errorId: null,
      })
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleReport = async () => {
    const { error, errorId } = this.state
    if (!error || !errorId) {
      return
    }

    // TODO: Integrate with error reporting service
    try {
      // For now, copy error details to clipboard
      const errorReport = {
        id: errorId,
        message: error.message,
        stack: error.stack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }

      await navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      alert('Error details copied to clipboard')
    } catch {
      alert('Unable to copy error details')
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI based on level
      return (
        <ErrorFallback
          error={this.state.error}
          errorId={this.state.errorId}
          level={this.props.level || 'component'}
          context={this.props.context || 'unknown'}
          canRetry={this.retryCount < this.maxRetries}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
          onReport={this.handleReport}
        />
      )
    }

    return this.props.children
  }
}

// Error fallback component
interface ErrorFallbackProps {
  error: Error | null
  errorId: string | null
  level: string
  context?: string
  canRetry: boolean
  onRetry: () => void
  onReload: () => void
  onReport: () => void
}

function ErrorFallback({
  error,
  errorId,
  level,
  context,
  canRetry,
  onRetry,
  onReload,
  onReport,
}: ErrorFallbackProps) {
  const isPageLevel = level === 'page'

  return (
    <div
      className={`
      flex flex-col items-center justify-center p-6 
      ${isPageLevel ? 'min-h-screen bg-gray-50' : 'min-h-64 bg-gray-100 rounded-lg'}
    `}
    >
      <div className="text-center max-w-md">
        {/* Error icon */}
        <div className="mx-auto mb-4">
          <svg
            className="w-16 h-16 text-red-500 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        {/* Error message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isPageLevel ? 'Something went wrong' : 'Component Error'}
        </h2>

        <p className="text-gray-600 mb-6">
          {isPageLevel
            ? 'We encountered an unexpected error. Please try again.'
            : 'This component failed to load properly.'}
        </p>

        {/* Error details (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 text-left">
            <details className="bg-gray-800 text-green-400 p-4 rounded-lg text-sm">
              <summary className="cursor-pointer font-semibold mb-2">
                Error Details (Dev Mode)
              </summary>
              <div className="space-y-2">
                <p>
                  <strong>Context:</strong> {context || 'Unknown'}
                </p>
                <p>
                  <strong>Error ID:</strong> {errorId}
                </p>
                <p>
                  <strong>Message:</strong> {error?.message}
                </p>
                {error?.stack && (
                  <pre className="whitespace-pre-wrap text-xs">
                    <strong>Stack:</strong>
                    <br />
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          {canRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}

          <button
            onClick={onReload}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Reload Page
          </button>

          <button
            onClick={onReport}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Report Issue
          </button>
        </div>

        {/* Support information */}
        <div className="mt-6 text-sm text-gray-500">
          {errorId && (
            <p>
              Error ID:{' '}
              <code className="bg-gray-200 px-1 rounded">{errorId}</code>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  )

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`

  return WithErrorBoundaryComponent
}

// Hook for handling async errors in components
export function useErrorHandler() {
  const handleError = React.useCallback(
    async (
      error: Error,
      context: string = 'component',
      additionalData?: Record<string, any>
    ) => {
      try {
        await logger.error(
          'client',
          `Async error in ${context}`,
          {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
            context,
            url: window.location.href,
            userAgent: navigator.userAgent,
            ...additionalData,
          },
          error
        )
      } catch (logError) {
        console.error('Error logging failed:', logError)
        console.error('Original error:', error)
      }
    },
    []
  )

  return handleError
}

// Global error handler for unhandled promise rejections
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', async event => {
    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason))

    try {
      await logger.error(
        'client',
        'Unhandled promise rejection',
        {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          url: window.location.href,
          userAgent: navigator.userAgent,
        },
        error
      )
    } catch (logError) {
      console.error('Failed to log unhandled rejection:', logError)
      console.error('Original error:', error)
    }
  })

  // Handle global JavaScript errors
  window.addEventListener('error', async event => {
    const error = event.error || new Error(event.message)

    try {
      await logger.error(
        'client',
        'Global JavaScript error',
        {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          url: window.location.href,
          userAgent: navigator.userAgent,
        },
        error
      )
    } catch (logError) {
      console.error('Failed to log global error:', logError)
      console.error('Original error:', error)
    }
  })
}
