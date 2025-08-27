'use client'

/**
 * Input Method Container
 * Routes users to appropriate input method based on A/B testing
 */

import { useState, useEffect } from 'react'

import { Spinner } from '@/components/ui/spinner'
import { experimentRouter } from '@/lib/experimentation/router'
import { inputMethodRegistry } from '@/lib/input-methods/registry'
import { InputMethodType, InputMethodMetadata } from '@/lib/input-methods/types'
import { TTravelRequirements } from '@/lib/schemas/travel-requirements'
// import { ErrorMessage } from '@/components/ui/error-message' // TODO: Create this component

interface InputMethodContainerProps {
  userId?: string
  onComplete: (
    requirements: TTravelRequirements,
    metadata: InputMethodMetadata
  ) => void
  onCancel: () => void
  defaultValues?: Partial<TTravelRequirements>
}

export function InputMethodContainer({
  userId,
  onComplete,
  onCancel,
  defaultValues,
}: InputMethodContainerProps) {
  const [assignedMethod, setAssignedMethod] = useState<InputMethodType | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Assign input method variant on mount
  useEffect(() => {
    const assignInputMethod = async () => {
      try {
        setIsLoading(true)

        // Get user's assigned input method variant
        const methodType = await experimentRouter.assignVariant(
          userId || 'anonymous'
        )

        // Verify the method is available and enabled
        const method = inputMethodRegistry.getMethod(methodType)
        if (!method) {
          throw new Error(`Input method ${methodType} not found`)
        }

        if (!method.enabled) {
          console.warn(
            `Input method ${methodType} is disabled, falling back to constrained-form`
          )
          setAssignedMethod('constrained-form')
        } else {
          setAssignedMethod(methodType)
        }

        // Track method selection for analytics
        await experimentRouter.trackConversion(
          userId || 'anonymous',
          'method-selected'
        )
      } catch (err) {
        console.error('Failed to assign input method:', err)
        setError('Failed to load input form. Please try again.')

        // Fallback to default method
        setAssignedMethod('constrained-form')
      } finally {
        setIsLoading(false)
      }
    }

    assignInputMethod()
  }, [userId])

  // Handle completion from child input method
  const handleComplete = async (
    requirements: TTravelRequirements,
    metadata: InputMethodMetadata
  ) => {
    try {
      // Track successful completion
      await experimentRouter.trackConversion(
        userId || 'anonymous',
        'requirements-submitted'
      )

      // Pass to parent
      onComplete(requirements, metadata)
    } catch (err) {
      console.error('Failed to track completion:', err)
      // Still complete the flow even if tracking fails
      onComplete(requirements, metadata)
    }
  }

  // Handle cancellation
  const handleCancel = () => {
    if (assignedMethod) {
      // Track cancellation for analytics (don't await to avoid blocking)
      experimentRouter
        .trackConversion(userId || 'anonymous', 'input-started')
        .catch(console.error)
    }
    onCancel()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner className="mb-4" />
        <p className="text-gray-600">
          Setting up your travel preferences form...
        </p>
      </div>
    )
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

  // No assigned method (shouldn't happen with fallback)
  if (!assignedMethod) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">
          Unable to load input form. Please refresh the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh Page
        </button>
      </div>
    )
  }

  // Render the assigned input method component
  const methodRegistration = inputMethodRegistry.getMethod(assignedMethod)!
  const InputMethodComponent = methodRegistration.component

  return (
    <div className="input-method-container">
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <strong>Debug:</strong> Using {methodRegistration.name} (
          {assignedMethod})
          <br />
          <em>{methodRegistration.description}</em>
        </div>
      )}

      {/* Render the selected input method */}
      <InputMethodComponent
        onComplete={handleComplete}
        onCancel={handleCancel}
        {...(defaultValues && { defaultValues })}
      />
    </div>
  )
}

// Export props interface for component reuse
export type { InputMethodContainerProps }
