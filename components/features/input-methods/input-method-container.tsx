'use client'

/**
 * Input Method Container
 * Provides tab-based interface to choose between different input methods
 */

import { useState, useEffect } from 'react'

// Removed unused Spinner import
import { useExperimentTracking } from '@/lib/analytics/experiment-tracker'
import { useABTesting } from '@/lib/experimentation/ab-testing'
import { inputMethodRegistry } from '@/lib/input-methods/registry'
import { InputMethodType, InputMethodMetadata } from '@/lib/input-methods/types'
import { TTravelRequirements } from '@/lib/schemas/travel-requirements'
// import { ErrorMessage } from '@/components/ui/error-message' // TODO: Create this component

interface InputMethodContainerProps {
  onComplete: (
    requirements: TTravelRequirements,
    metadata: InputMethodMetadata
  ) => void
  onCancel: () => void
  defaultValues?: Partial<TTravelRequirements>
}

export function InputMethodContainer({
  onComplete,
  onCancel,
  defaultValues,
}: InputMethodContainerProps) {
  const [sessionId, setSessionId] = useState<string>('')
  const [selectedMethod, setSelectedMethod] =
    useState<InputMethodType>('constrained-form')
  const [error, setError] = useState<string | null>(null)
  const [methodStartTime, setMethodStartTime] = useState<number>(0)
  const [showMethodTabs, setShowMethodTabs] = useState<boolean>(true)

  // Initialize experiment tracking
  const {
    initializeSession,
    trackMethodSelection,
    trackMethodStart,
    trackMethodCompletion,
    trackMethodAbandonment,
    trackError,
  } = useExperimentTracking()

  // Initialize A/B testing
  const { getInputMethod, shouldShowSelection, getAssignedVariant } =
    useABTesting(sessionId)

  // Get enabled methods for tabs
  const enabledMethods = inputMethodRegistry.getEnabledMethods()

  // Initialize tracking and A/B testing on mount
  useEffect(() => {
    const newSessionId = initializeSession()
    setSessionId(newSessionId)
  }, [initializeSession])

  // Apply A/B testing assignment
  useEffect(() => {
    if (!sessionId) {
      return
    }

    // TEMPORARILY DISABLED FOR PROTOTYPING - Enable A/B testing by uncommenting below
    /*
    const assignedMethod = getInputMethod()
    const showTabs = shouldShowSelection()
    const variant = getAssignedVariant()

    setShowMethodTabs(showTabs)

    // If not user choice, automatically select the assigned method
    if (assignedMethod !== 'user-choice') {
      setSelectedMethod(assignedMethod)
      trackMethodSelection(assignedMethod)
      trackMethodStart(assignedMethod, {
        variant: variant?.name,
        testId: variant?.id,
      })
      setMethodStartTime(Date.now())
    } else {
    */

    // For prototyping - always show all tabs and let user choose
    setShowMethodTabs(true)

    // User choice - track initial selection
    trackMethodSelection('constrained-form')
    trackMethodStart('constrained-form', {
      variant: 'User Choice',
      testId: 'prototype-mode',
    })
    setMethodStartTime(Date.now())

    // } // Closing brace for else when A/B testing is enabled
  }, [
    sessionId,
    getInputMethod,
    shouldShowSelection,
    getAssignedVariant,
    trackMethodSelection,
    trackMethodStart,
  ])

  // Handle completion from child input method
  const handleComplete = (
    requirements: TTravelRequirements,
    metadata: InputMethodMetadata
  ) => {
    // Track successful completion
    trackMethodCompletion(selectedMethod, requirements, metadata)
    onComplete(requirements, metadata)
  }

  // Handle cancellation
  const handleCancel = () => {
    // Track abandonment at cancellation point
    trackMethodAbandonment(selectedMethod, 'user_cancelled')
    onCancel()
  }

  // Handle method selection
  const handleMethodChange = (methodType: InputMethodType) => {
    const method = inputMethodRegistry.getMethod(methodType)
    if (method && method.enabled) {
      // Track abandonment of previous method if user was partway through
      if (selectedMethod !== methodType && methodStartTime > 0) {
        const timeSpent = Date.now() - methodStartTime
        if (timeSpent > 5000) {
          // Only track if user spent more than 5 seconds
          trackMethodAbandonment(selectedMethod, 'method_switch')
        }
      }

      // Track selection of new method
      setSelectedMethod(methodType)
      trackMethodSelection(methodType)
      trackMethodStart(methodType, { previousMethod: selectedMethod })
      setMethodStartTime(Date.now())
      setError(null) // Clear any previous errors
    }
  }

  // Handle errors from child components
  const handleError = (error: string) => {
    setError(error)
    trackError(selectedMethod, error, {
      timestamp: Date.now(),
      timeInMethod: Date.now() - methodStartTime,
    })
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  // No enabled methods (shouldn't happen)
  if (enabledMethods.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">
          No input methods available. Please contact support.
        </p>
      </div>
    )
  }

  // Get the selected method registration
  const methodRegistration = inputMethodRegistry.getMethod(selectedMethod)
  if (!methodRegistration) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">
          Invalid input method selected. Please refresh the page.
        </p>
      </div>
    )
  }

  const InputMethodComponent = methodRegistration.component

  return (
    <div className="input-method-container">
      {/* Method Selection Tabs - Only show if A/B test allows user choice */}
      {showMethodTabs && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Input methods">
              {enabledMethods.map(method => (
                <button
                  key={method.type}
                  onClick={() => handleMethodChange(method.type)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedMethod === method.type
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  aria-current={
                    selectedMethod === method.type ? 'page' : undefined
                  }
                >
                  {method.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Method Description */}
          <div className="mt-2 text-sm text-gray-600">
            {methodRegistration.description}
          </div>
        </div>
      )}

      {/* A/B Test Indicator - Show when user is assigned to a specific method */}
      {!showMethodTabs && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            🧪 You&apos;re participating in an experiment to improve our travel
            planning experience. You&apos;ve been assigned to test the{' '}
            <strong>{methodRegistration.name}</strong> input method.
          </p>
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <strong>Debug:</strong> Using {methodRegistration.name} (
          {selectedMethod})
          <br />
          <strong>A/B Test:</strong>{' '}
          {showMethodTabs ? 'User Choice' : `Assigned to ${selectedMethod}`}
          <br />
          <strong>Session:</strong> {sessionId.substring(0, 20)}...
          <br />
          <em>{methodRegistration.description}</em>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Render the selected input method */}
      <InputMethodComponent
        onComplete={handleComplete}
        onCancel={handleCancel}
        onError={handleError}
        {...(defaultValues && { defaultValues })}
      />
    </div>
  )
}

// Export props interface for component reuse
export type { InputMethodContainerProps }
