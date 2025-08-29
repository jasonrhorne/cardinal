'use client'

import dynamicImport from 'next/dynamic'
import { useState } from 'react'

import { ItineraryDisplay } from '@/components/features/itinerary-display'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import type { InputMethodMetadata } from '@/lib/input-methods/types'
import type { TTravelRequirements } from '@/lib/schemas/travel-requirements'

// Lazy load the input method container to avoid SSR issues
const InputMethodContainer = dynamicImport(
  () =>
    import('@/components/features/input-methods/input-method-container').then(
      mod => ({
        default: mod.InputMethodContainer,
      })
    ),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-32 bg-gray-200 rounded" />
        <div className="h-12 bg-blue-200 rounded" />
      </div>
    ),
  }
)

interface StreamingUpdate {
  type: 'status' | 'progress' | 'complete' | 'error'
  message?: string
  phase?: string
  itinerary?: any
  error?: string
}

export default function NewTripPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [itinerary, setItinerary] = useState<any>(null)
  const [streamingStatus, setStreamingStatus] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const handleComplete = async (
    requirements: TTravelRequirements,
    metadata: InputMethodMetadata
  ) => {
    try {
      setIsGenerating(true)
      setError(null)
      setStreamingStatus('Connecting to AI assistant...')

      // Create persona profile based on requirements
      const personaProfile = {
        primary: 'balanced',
        interests: requirements.interests || [],
        travelStyle: 'balanced',
        activityLevel: 'moderate',
      }

      // Call the Edge Function with streaming
      const response = await fetch('/api/orchestrate-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requirements: {
            ...requirements,
            destination: requirements.originCity || 'San Francisco, CA',
            duration: '3 days',
          },
          personaProfile,
          metadata,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate itinerary: ${response.statusText}`)
      }

      // Check if response is SSE or regular JSON
      const contentType = response.headers.get('content-type')

      if (contentType?.includes('text/event-stream')) {
        // Handle Server-Sent Events
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error('Failed to initialize stream reader')
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            break
          }

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6)) as StreamingUpdate

                switch (data.type) {
                  case 'status':
                    setStreamingStatus(data.message || 'Processing...')
                    break
                  case 'progress':
                    setStreamingStatus(
                      data.message || `${data.phase}: Processing...`
                    )
                    break
                  case 'complete':
                    if (data.itinerary) {
                      setItinerary(data.itinerary)
                      setStreamingStatus('Itinerary generated successfully!')
                    }
                    break
                  case 'error':
                    setError(data.error || 'An error occurred')
                    setStreamingStatus('')
                    break
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e)
              }
            }
          }
        }
      } else {
        // Handle regular JSON response (fallback)
        const data = await response.json()
        if (data.itinerary) {
          setItinerary(data.itinerary)
          setStreamingStatus('Itinerary generated successfully!')
        } else if (data.error) {
          throw new Error(data.error)
        }
      }
    } catch (error) {
      console.error('Error generating itinerary:', error)
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to generate itinerary. Please try again.'
      )
      setStreamingStatus('')
    } finally {
      setIsGenerating(false)
    }
  }

  // If we have an itinerary, show it
  if (itinerary) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <button
            onClick={() => {
              setItinerary(null)
              setStreamingStatus('')
              setError(null)
            }}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Start New Trip
          </button>
        </div>

        <ItineraryDisplay itinerary={itinerary} />

        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={() => {
              // TODO: Save itinerary to database
              alert('Save functionality coming soon!')
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Itinerary
          </button>
          <button
            onClick={() => {
              // TODO: Share itinerary
              alert('Share functionality coming soon!')
            }}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Share
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Plan Your Next Trip
        </h1>
        <p className="mt-2 text-gray-600">
          Tell us about your travel preferences and we&apos;ll create a
          personalized itinerary for you
        </p>
      </div>

      {/* Show input methods when not generating */}
      {!isGenerating && !itinerary && (
        <InputMethodContainer
          onComplete={handleComplete}
          onCancel={() => {
            // Reset state on cancel
            setError(null)
            setStreamingStatus('')
          }}
        />
      )}

      {/* Show generation status */}
      {isGenerating && (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Spinner className="w-12 h-12" />
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900">
                Creating Your Personalized Itinerary
              </p>
              {streamingStatus && (
                <p className="mt-2 text-sm text-gray-600">{streamingStatus}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Show error if any */}
      {error && (
        <Card className="p-6 border-red-200 bg-red-50 mt-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-red-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="font-medium text-red-900">
                Failed to Generate Itinerary
              </h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={() => {
                  setError(null)
                  setIsGenerating(false)
                }}
                className="mt-3 text-sm text-red-600 hover:text-red-700 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
