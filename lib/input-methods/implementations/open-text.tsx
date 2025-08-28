'use client'

/**
 * Hybrid Natural Language Input Method Implementation
 * Combines structured inputs for facts with open text for preferences
 */

import { Plus, Minus, MapPin, Users, Clock, Heart } from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'

import { Button, Input } from '@/components/ui'
import type { TTravelRequirements } from '@/lib/schemas/travel-requirements'

import type { InputMethodProps } from '../types'

// Hybrid form state
interface HybridFormState {
  // Structured fields
  originCity: string
  numberOfAdults: number
  numberOfChildren: number
  childrenAges: Array<{ age: number; id: string }>

  // Open text fields
  travelPreferences: string
  interests: string

  // UI state
  isProcessing: boolean
  errors: Record<string, string>
  processedData: TTravelRequirements | null
}

export function OpenTextInput({
  onComplete,
  onCancel,
  defaultValues,
}: InputMethodProps) {
  const [state, setState] = useState<HybridFormState>({
    originCity: defaultValues?.originCity || '',
    numberOfAdults: defaultValues?.numberOfAdults || 2,
    numberOfChildren: defaultValues?.numberOfChildren || 0,
    childrenAges: defaultValues?.childrenAges || [],
    travelPreferences: '',
    interests: '',
    isProcessing: false,
    errors: {},
    processedData: null,
  })

  // Update children ages when count changes
  useEffect(() => {
    const childCount = state.numberOfChildren
    const currentAges = state.childrenAges

    if (childCount > currentAges.length) {
      // Add new children with default age
      const newChildren = Array.from(
        { length: childCount - currentAges.length },
        (_, i) => ({
          id: `child-${currentAges.length + i + 1}`,
          age: 5,
        })
      )
      setState(prev => ({
        ...prev,
        childrenAges: [...currentAges, ...newChildren],
      }))
    } else if (childCount < currentAges.length) {
      // Remove excess children
      setState(prev => ({
        ...prev,
        childrenAges: currentAges.slice(0, childCount),
      }))
    }
  }, [state.numberOfChildren, state.childrenAges])

  // Update field value
  const updateField = useCallback(
    (field: keyof HybridFormState, value: any) => {
      setState(prev => {
        const newErrors = { ...prev.errors }
        delete newErrors[field] // Clear field error
        return {
          ...prev,
          [field]: value,
          errors: newErrors,
        }
      })
    },
    []
  )

  // Update child age
  const updateChildAge = useCallback((childId: string, age: number) => {
    setState(prev => ({
      ...prev,
      childrenAges: prev.childrenAges.map(child =>
        child.id === childId ? { ...child, age } : child
      ),
    }))
  }, [])

  // Process the open text fields using AI
  const processOpenFields = useCallback(async () => {
    if (!state.travelPreferences.trim() && !state.interests.trim()) {
      setState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          travelPreferences: 'Please describe your travel preferences',
          interests: 'Please describe what interests you',
        },
      }))
      return
    }

    setState(prev => ({ ...prev, isProcessing: true, errors: {} }))

    try {
      // Combine the open text fields into a description for AI processing
      const description = `Travel preferences: ${state.travelPreferences}. Interests: ${state.interests}.`

      const response = await fetch(
        '/netlify/edge-functions/extract-requirements',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: description }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      // Combine structured data with AI-extracted preferences
      const fullRequirements: TTravelRequirements = {
        originCity: state.originCity,
        numberOfAdults: state.numberOfAdults,
        numberOfChildren: state.numberOfChildren,
        childrenAges: state.childrenAges,
        preferredTravelMethods: result.requirements.preferredTravelMethods || [
          'drive',
        ],
        interests: result.requirements.interests || [
          'culture-local-experiences',
        ],
        travelDurationLimits: result.requirements.travelDurationLimits,
      }

      setState(prev => ({
        ...prev,
        processedData: fullRequirements,
        isProcessing: false,
      }))
    } catch (error) {
      console.error('Failed to process preferences:', error)
      setState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          processing:
            error instanceof Error
              ? error.message
              : 'Processing failed. Please try again.',
        },
        isProcessing: false,
      }))
    }
  }, [
    state.originCity,
    state.numberOfAdults,
    state.numberOfChildren,
    state.childrenAges,
    state.travelPreferences,
    state.interests,
  ])

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (!state.processedData) {
      return
    }

    const metadata = {
      methodType: 'open-text' as const,
      startTime: Date.now() - 60000, // Rough estimate
      completionTime: Date.now(),
      stepCount: 2, // Structured input + AI processing
      revisionsCount: 0,
      userAgent: navigator.userAgent,
    }

    onComplete(state.processedData, metadata)
  }, [state.processedData, onComplete])

  // Validation
  const canProcess = Boolean(
    state.originCity.trim() &&
      state.numberOfAdults > 0 &&
      (state.travelPreferences.trim() || state.interests.trim())
  )

  return (
    <div className="hybrid-text-input space-y-8">
      {/* Origin City */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h2>Where are you traveling from?</h2>
        </div>
        <Input
          label="Origin City"
          placeholder="e.g., San Francisco, CA"
          value={state.originCity}
          onChange={e => updateField('originCity', e.target.value)}
          error={state.errors.originCity}
          disabled={state.isProcessing}
          className="max-w-md"
        />
      </section>

      {/* Travelers */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Users className="h-5 w-5 text-blue-600" />
          <h2>Who&apos;s traveling?</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Adults */}
          <div className="space-y-2">
            <label
              htmlFor="adults-count"
              className="block text-sm font-medium text-gray-700"
            >
              Number of Adults
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  updateField(
                    'numberOfAdults',
                    Math.max(1, state.numberOfAdults - 1)
                  )
                }
                disabled={state.isProcessing || state.numberOfAdults <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span
                id="adults-count"
                className="w-12 text-center text-lg font-medium"
                aria-label="Number of adults"
              >
                {state.numberOfAdults}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  updateField('numberOfAdults', state.numberOfAdults + 1)
                }
                disabled={state.isProcessing}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Children */}
          <div className="space-y-2">
            <label
              htmlFor="children-count"
              className="block text-sm font-medium text-gray-700"
            >
              Number of Children
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  updateField(
                    'numberOfChildren',
                    Math.max(0, state.numberOfChildren - 1)
                  )
                }
                disabled={state.isProcessing || state.numberOfChildren <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span
                id="children-count"
                className="w-12 text-center text-lg font-medium"
                aria-label="Number of children"
              >
                {state.numberOfChildren}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  updateField('numberOfChildren', state.numberOfChildren + 1)
                }
                disabled={state.isProcessing}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Children Ages */}
        {state.numberOfChildren > 0 && (
          <div className="space-y-3">
            <div className="block text-sm font-medium text-gray-700">
              Children&apos;s Ages
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {state.childrenAges.map((child, index) => (
                <div key={child.id} className="space-y-1">
                  <label className="block text-xs text-gray-600">
                    Child {index + 1}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={17}
                    value={child.age}
                    onChange={e =>
                      updateChildAge(child.id, parseInt(e.target.value) || 0)
                    }
                    disabled={state.isProcessing}
                    className="text-center"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Travel Preferences */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Clock className="h-5 w-5 text-blue-600" />
          <h2>How would you like to travel?</h2>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="travel-preferences"
            className="block text-sm font-medium text-gray-700"
          >
            Travel Preferences
          </label>
          <textarea
            id="travel-preferences"
            value={state.travelPreferences}
            onChange={e => updateField('travelPreferences', e.target.value)}
            placeholder="Example: We prefer to drive and don't want to travel more than 4 hours. We're not interested in flying for this trip..."
            className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 resize-y"
            disabled={state.isProcessing}
          />
          {state.errors.travelPreferences && (
            <p className="text-sm text-red-600">
              {state.errors.travelPreferences}
            </p>
          )}
        </div>
      </section>

      {/* Interests */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Heart className="h-5 w-5 text-blue-600" />
          <h2>What are you interested in?</h2>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="interests"
            className="block text-sm font-medium text-gray-700"
          >
            Interests & Activities
          </label>
          <textarea
            id="interests"
            value={state.interests}
            onChange={e => updateField('interests', e.target.value)}
            placeholder="Example: We love art galleries, great restaurants, and wine tasting. We're interested in local culture and unique experiences. Not really into nightlife or extreme sports..."
            className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 resize-y"
            disabled={state.isProcessing}
          />
          {state.errors.interests && (
            <p className="text-sm text-red-600">{state.errors.interests}</p>
          )}
        </div>
      </section>

      {/* Process Button */}
      {!state.processedData && (
        <div className="space-y-3">
          <Button
            onClick={processOpenFields}
            disabled={!canProcess || state.isProcessing}
            isLoading={state.isProcessing}
            className="w-full"
          >
            {state.isProcessing
              ? 'Processing your preferences...'
              : 'Process my travel preferences'}
          </Button>
          {!canProcess && (
            <p className="text-sm text-gray-500 text-center">
              Please fill in your origin city and describe your travel
              preferences or interests
            </p>
          )}
          {state.errors.processing && (
            <p className="text-sm text-red-600 text-center">
              {state.errors.processing}
            </p>
          )}
        </div>
      )}

      {/* Processed Results */}
      {state.processedData && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2 mb-3">
            <span className="text-green-600 font-medium">✅</span>
            <div>
              <p className="text-green-800 font-medium">
                Preferences Processed
              </p>
              <p className="text-green-700 text-sm">
                Here&apos;s what we understood from your preferences:
              </p>
            </div>
          </div>

          <div className="bg-white p-3 rounded border space-y-2 text-sm">
            <div>
              <strong>From:</strong> {state.processedData.originCity}
            </div>
            <div>
              <strong>Travelers:</strong> {state.processedData.numberOfAdults}{' '}
              adults
              {state.processedData.numberOfChildren > 0 &&
                `, ${state.processedData.numberOfChildren} children`}
            </div>
            <div>
              <strong>Travel Methods:</strong>{' '}
              {state.processedData.preferredTravelMethods.join(', ')}
            </div>
            <div>
              <strong>Interests:</strong>{' '}
              {state.processedData.interests.join(', ')}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleSubmit} className="flex-1">
              Looks good! Continue
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                setState(prev => ({ ...prev, processedData: null }))
              }
              className="flex-1"
            >
              Revise preferences
            </Button>
          </div>
        </div>
      )}

      {/* Cancel Button */}
      <div className="text-center mt-6">
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 underline text-sm"
        >
          Cancel and choose different input method
        </button>
      </div>
    </div>
  )
}
