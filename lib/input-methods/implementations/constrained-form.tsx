/**
 * Constrained Form Input Method Implementation
 * Uses the traditional form interface with structured fields
 */

'use client'

import { useState, useCallback } from 'react'

import { TravelRequirementsForm } from '@/components/travel/travel-requirements-form'
import type { TTravelRequirementsForm } from '@/lib/schemas/travel-requirements'

import type { InputMethodProps } from '../types'

export function ConstrainedFormInput({
  onComplete,
  onCancel,
  defaultValues,
}: InputMethodProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = useCallback(
    async (data: TTravelRequirementsForm) => {
      setIsLoading(true)
      try {
        // Convert form data to TTravelRequirements and create metadata
        const requirements = {
          originCity: data.originCity,
          numberOfAdults: data.numberOfAdults,
          numberOfChildren: data.numberOfChildren,
          childrenAges: data.childrenAges,
          preferredTravelMethods: data.preferredTravelMethods,
          interests: data.interests,
          travelDurationLimits: data.travelDurationLimits,
        }

        const metadata = {
          methodType: 'constrained-form' as const,
          startTime: Date.now() - 30000, // Rough estimate
          completionTime: Date.now(),
          stepCount: 1, // Single form
          revisionsCount: 0,
          userAgent: navigator.userAgent,
        }

        onComplete(requirements, metadata)
      } catch (error) {
        console.error('Error processing constrained form:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [onComplete]
  )

  const handleCancel = useCallback(() => {
    onCancel()
  }, [onCancel])

  return (
    <div className="constrained-form-input">
      <TravelRequirementsForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onSaveDraft={() => {}} // No draft saving in this flow
        {...(defaultValues && {
          initialData: defaultValues as Partial<TTravelRequirementsForm>,
        })}
      />

      {/* Cancel option */}
      <div className="mt-4 text-center">
        <button
          onClick={handleCancel}
          className="text-gray-500 hover:text-gray-700 underline text-sm"
          disabled={isLoading}
        >
          Cancel and choose different input method
        </button>
      </div>
    </div>
  )
}
