'use client'

/**
 * Open Text Input Method Implementation
 * Allows users to describe travel requirements in natural language
 * E003 - Frontend, P0, 6 SP
 */

import { useState, useCallback, useEffect } from 'react'

import { Spinner } from '@/components/ui/spinner'
import type { TTravelRequirements } from '@/lib/schemas/travel-requirements'

import type { InputMethodProps } from '../types'

// Natural language input state
interface OpenTextState {
  text: string
  isProcessing: boolean
  extractedRequirements: Partial<TTravelRequirements> | null
  error: string | null
  isConfirmed: boolean
}

// Processing status for UX feedback
type ProcessingStatus =
  | 'idle'
  | 'extracting'
  | 'validating'
  | 'complete'
  | 'error'

export function OpenTextInput({ onComplete, onCancel }: InputMethodProps) {
  const [state, setState] = useState<OpenTextState>({
    text: '',
    isProcessing: false,
    extractedRequirements: null,
    error: null,
    isConfirmed: false,
  })

  const [status, setStatus] = useState<ProcessingStatus>('idle')
  const [wordCount, setWordCount] = useState(0)

  // Update word count when text changes
  useEffect(() => {
    const words = state.text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
    setWordCount(state.text.trim() ? words.length : 0)
  }, [state.text])

  // Debounced processing (optional - could be triggered by button instead)
  const processText = useCallback(async (text: string) => {
    if (!text.trim() || text.trim().length < 20) {
      return // Too short to process meaningfully
    }

    setStatus('extracting')
    setState(prev => ({ ...prev, isProcessing: true, error: null }))

    try {
      const response = await fetch(
        '/netlify/edge-functions/extract-requirements',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: text.trim() }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      setStatus('validating')

      // Validate extracted requirements (basic check)
      const extracted = result.requirements as Partial<TTravelRequirements>

      // TODO: Add more sophisticated validation
      if (!extracted.originCity && !extracted.interests) {
        throw new Error(
          'Unable to extract meaningful travel requirements from your description.'
        )
      }

      setStatus('complete')
      setState(prev => ({
        ...prev,
        extractedRequirements: extracted,
        isProcessing: false,
      }))
    } catch (error) {
      console.error('Failed to process text:', error)
      setStatus('error')
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Processing failed. Please try again.',
        isProcessing: false,
      }))
    }
  }, [])

  // Handle text input changes
  const handleTextChange = (value: string) => {
    setState(prev => ({ ...prev, text: value }))

    // Clear previous results when user starts typing again
    if (state.extractedRequirements || state.error) {
      setState(prev => ({
        ...prev,
        extractedRequirements: null,
        error: null,
        isConfirmed: false,
      }))
      setStatus('idle')
    }
  }

  // Handle manual processing trigger
  const handleProcess = () => {
    if (state.text.trim().length < 20) {
      setState(prev => ({
        ...prev,
        error:
          'Please write at least a few sentences about your travel preferences.',
      }))
      return
    }
    processText(state.text)
  }

  // Handle confirmation and submission
  const handleConfirmAndSubmit = () => {
    if (!state.extractedRequirements) {
      return
    }

    // Create metadata for tracking
    const metadata = {
      methodType: 'open-text' as const,
      startTime: Date.now() - 60000, // Rough estimate
      completionTime: Date.now(),
      stepCount: 2, // Input + Confirm
      revisionsCount: 0, // TODO: Track this properly
      userAgent: navigator.userAgent,
    }

    // Convert partial requirements to full requirements with defaults
    const fullRequirements: TTravelRequirements = {
      originCity: state.extractedRequirements.originCity || '',
      numberOfAdults: state.extractedRequirements.numberOfAdults || 2,
      numberOfChildren: state.extractedRequirements.numberOfChildren || 0,
      childrenAges: state.extractedRequirements.childrenAges || [],
      preferredTravelMethods: state.extractedRequirements
        .preferredTravelMethods || ['drive'],
      interests: state.extractedRequirements.interests || ['arts'],
      travelDurationLimits: state.extractedRequirements.travelDurationLimits,
    }

    onComplete(fullRequirements, metadata)
  }

  // Handle manual editing (fallback)
  const handleManualEdit = () => {
    // TODO: Show inline editing interface or redirect to form
    alert(
      'Manual editing interface not yet implemented - for now, please revise your description and try again.'
    )
  }

  return (
    <div className="open-text-input max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Tell us about your ideal trip
        </h3>
        <p className="text-gray-600 text-sm">
          Describe your travel preferences in your own words. Be as specific or
          general as you&apos;d like!
        </p>
      </div>

      {/* Main Input Area */}
      <div className="mb-6">
        <div className="relative">
          <textarea
            value={state.text}
            onChange={e => handleTextChange(e.target.value)}
            placeholder="Example: We're a couple in our 30s living in San Francisco. We love art galleries and great food, and want to visit somewhere we can drive to in about 4 hours. We'd prefer not to fly since it's just a weekend. We're into wine tasting and photography too..."
            className="w-full min-h-[200px] p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 resize-y"
            disabled={state.isProcessing}
          />

          {/* Word Counter */}
          <div className="absolute bottom-3 right-3 text-xs text-gray-500">
            {wordCount} words
          </div>
        </div>

        {/* Example Prompts */}
        <div className="mt-3 text-sm text-gray-500">
          <details className="cursor-pointer">
            <summary className="hover:text-gray-700">
              💡 Need inspiration? Click for example prompts
            </summary>
            <div className="mt-2 space-y-2 pl-4">
              <p className="italic">
                &quot;Family of 4 with kids aged 8 and 12 looking for outdoor
                adventures within driving distance of Denver. Budget around
                $2000 for the weekend.&quot;
              </p>
              <p className="italic">
                &quot;Two couples wanting a sophisticated weekend with great
                restaurants and art galleries, willing to fly up to 3 hours from
                Chicago.&quot;
              </p>
              <p className="italic">
                &quot;Solo traveler interested in architecture and history,
                prefer trains or driving from Boston, budget-conscious but
                willing to splurge on unique experiences.&quot;
              </p>
            </div>
          </details>
        </div>
      </div>

      {/* Processing Button */}
      {!state.extractedRequirements && !state.error && (
        <div className="mb-6">
          <button
            onClick={handleProcess}
            disabled={state.isProcessing || wordCount < 5}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {state.isProcessing && <Spinner className="w-4 h-4" />}
            {status === 'extracting' && 'Understanding your preferences...'}
            {status === 'validating' && 'Validating requirements...'}
            {!state.isProcessing && 'Process my travel description'}
          </button>

          {wordCount < 5 && (
            <p className="mt-2 text-sm text-gray-500 text-center">
              Please write a few sentences about your travel preferences
            </p>
          )}
        </div>
      )}

      {/* Error Display */}
      {state.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-red-500 font-medium">⚠️</span>
            <div>
              <p className="text-red-700 font-medium">Processing Error</p>
              <p className="text-red-600 text-sm mt-1">{state.error}</p>
              <button
                onClick={() => setState(prev => ({ ...prev, error: null }))}
                className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extracted Requirements Preview */}
      {state.extractedRequirements && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2 mb-3">
            <span className="text-green-600 font-medium">✅</span>
            <div>
              <p className="text-green-800 font-medium">
                Requirements Extracted
              </p>
              <p className="text-green-700 text-sm">
                Here&apos;s what we understood from your description:
              </p>
            </div>
          </div>

          <div className="bg-white p-3 rounded border space-y-2 text-sm">
            {state.extractedRequirements.originCity && (
              <div>
                <strong>From:</strong> {state.extractedRequirements.originCity}
              </div>
            )}
            {state.extractedRequirements.numberOfAdults && (
              <div>
                <strong>Travelers:</strong>{' '}
                {state.extractedRequirements.numberOfAdults} adults
                {state.extractedRequirements.numberOfChildren
                  ? `, ${state.extractedRequirements.numberOfChildren} children`
                  : ''}
              </div>
            )}
            {state.extractedRequirements.preferredTravelMethods && (
              <div>
                <strong>Travel:</strong>{' '}
                {state.extractedRequirements.preferredTravelMethods.join(', ')}
              </div>
            )}
            {state.extractedRequirements.interests && (
              <div>
                <strong>Interests:</strong>{' '}
                {state.extractedRequirements.interests.join(', ')}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleConfirmAndSubmit}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700"
            >
              Looks good! Continue
            </button>
            <button
              onClick={handleManualEdit}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded font-medium hover:bg-gray-200"
            >
              Edit details
            </button>
          </div>
        </div>
      )}

      {/* Cancel Button */}
      <div className="text-center">
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 underline text-sm"
        >
          Use a different input method
        </button>
      </div>
    </div>
  )
}
