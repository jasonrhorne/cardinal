'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import { DestinationSuggestions } from '@/components/travel/destination-suggestions'
import type { DestinationRecommendation } from '@/lib/agents/destination-agent'
import type { TTravelRequirements } from '@/lib/schemas/travel-requirements'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function DestinationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [destinations, setDestinations] = useState<DestinationRecommendation[]>(
    []
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requirements, setRequirements] = useState<TTravelRequirements | null>(
    null
  )

  useEffect(() => {
    // Get requirements from URL params or sessionStorage
    const requirementsParam = searchParams.get('requirements')
    let parsedRequirements: TTravelRequirements | null = null

    if (requirementsParam) {
      try {
        parsedRequirements = JSON.parse(decodeURIComponent(requirementsParam))
        setRequirements(parsedRequirements)
      } catch (e) {
        console.error('Failed to parse requirements from URL:', e)
      }
    }

    // Fallback to sessionStorage
    if (!parsedRequirements) {
      try {
        const stored = sessionStorage.getItem('cardinal_travel_requirements')
        if (stored) {
          parsedRequirements = JSON.parse(stored)
          setRequirements(parsedRequirements)
        }
      } catch (e) {
        console.error('Failed to parse requirements from session:', e)
      }
    }

    if (!parsedRequirements) {
      // Redirect back to new trip if no requirements
      router.push('/dashboard/new')
      return
    }

    // Generate destinations
    generateDestinations(parsedRequirements)
  }, [searchParams, router])

  const generateDestinations = async (reqs: TTravelRequirements) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        '/.netlify/functions/generate-destinations-simple',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requirements: reqs }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to generate destinations')
      }

      const result = await response.json()

      if (result.status === 'success' && result.data?.destinations) {
        setDestinations(result.data.destinations)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Error generating destinations:', error)
      setError('Failed to generate destinations. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDestinationSelect = (destination: DestinationRecommendation) => {
    if (!requirements) {
      return
    }

    // Store selected destination and requirements
    const fullRequirements = {
      ...requirements,
      destination: `${destination.city}, ${destination.state}`,
    }

    sessionStorage.setItem(
      'cardinal_travel_requirements',
      JSON.stringify(fullRequirements)
    )
    sessionStorage.setItem(
      'cardinal_selected_destination',
      JSON.stringify(destination)
    )

    // Navigate to itinerary generation
    router.push(
      `/dashboard/itinerary?destination=${encodeURIComponent(`${destination.city}, ${destination.state}`)}`
    )
  }

  const handleBack = () => {
    router.push('/dashboard/new')
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-800 mb-2">
                Something went wrong
              </h2>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() =>
                    requirements && generateDestinations(requirements)
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Try Again
                </button>
                <button
                  onClick={handleBack}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Back to Requirements
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            ← Back to requirements
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Choose Your Destination
          </h1>
          <p className="text-gray-600">
            Based on your preferences, we&apos;ve found these perfect
            destinations for your trip
          </p>
        </div>

        {/* Destinations */}
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <DestinationSuggestions
            destinations={destinations}
            onSelect={handleDestinationSelect}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
