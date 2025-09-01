'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import { ItineraryDisplay } from '@/components/travel/itinerary-display'
import type { DestinationRecommendation } from '@/lib/agents/destination-agent'
import type { TTravelRequirements } from '@/lib/schemas/travel-requirements'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function ItineraryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [itinerary, setItinerary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requirements, setRequirements] = useState<TTravelRequirements | null>(
    null
  )
  const [selectedDestination, setSelectedDestination] =
    useState<DestinationRecommendation | null>(null)

  useEffect(() => {
    // Get requirements and destination from sessionStorage
    try {
      const storedRequirements = sessionStorage.getItem(
        'cardinal_travel_requirements'
      )
      const storedDestination = sessionStorage.getItem(
        'cardinal_selected_destination'
      )

      if (storedRequirements) {
        const reqs = JSON.parse(storedRequirements)
        setRequirements(reqs)
      }

      if (storedDestination) {
        const dest = JSON.parse(storedDestination)
        setSelectedDestination(dest)
      }

      // Get destination from URL as fallback
      const destinationParam = searchParams.get('destination')
      if (!storedRequirements && !destinationParam) {
        router.push('/dashboard/new')
        return
      }

      // Generate itinerary
      const finalRequirements = storedRequirements
        ? JSON.parse(storedRequirements)
        : {
            destination: destinationParam,
          }

      if (finalRequirements) {
        generateItinerary(finalRequirements)
      }
    } catch (e) {
      console.error('Error loading trip data:', e)
      setError('Failed to load trip information')
      setIsLoading(false)
    }
  }, [searchParams, router])

  const generateItinerary = async (reqs: TTravelRequirements) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        '/.netlify/functions/generate-itinerary-simple',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requirements: reqs }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to generate itinerary')
      }

      const result = await response.json()

      if (result.status === 'success' && result.data) {
        setItinerary(result.data)

        // TODO: Save itinerary to user's trip history in database
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Error generating itinerary:', error)
      setError('Failed to generate itinerary. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/dashboard/destinations')
  }

  const handleStartOver = () => {
    // Clear session storage
    sessionStorage.removeItem('cardinal_travel_requirements')
    sessionStorage.removeItem('cardinal_selected_destination')
    router.push('/dashboard/new')
  }

  const handleSaveTrip = async () => {
    if (!itinerary || !requirements) {
      return
    }

    // TODO: Implement save to user's trip history
    alert('Save trip functionality coming soon!')
  }

  const handleExportPDF = async () => {
    if (!itinerary) {
      return
    }

    // TODO: Implement PDF export
    alert('PDF export functionality coming soon!')
  }

  const handleShareItinerary = async () => {
    if (!itinerary) {
      return
    }

    // TODO: Implement share link generation
    alert('Share functionality coming soon!')
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
                    requirements && generateItinerary(requirements)
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Try Again
                </button>
                <button
                  onClick={handleBack}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Back to Destinations
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Creating Your Perfect Itinerary
            </h2>
            <p className="text-gray-600">
              Our AI agents are crafting personalized recommendations just for
              you...
            </p>
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
          <div className="flex justify-between items-start mb-4">
            <button
              onClick={handleBack}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
            >
              ← Back to destinations
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleSaveTrip}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Save Trip
              </button>
              <button
                onClick={handleStartOver}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Start Over
              </button>
            </div>
          </div>

          {selectedDestination && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h1 className="text-2xl font-bold text-gray-900">
                Your Itinerary for {selectedDestination.city},{' '}
                {selectedDestination.state}
              </h1>
              <p className="text-gray-700 mt-1">{selectedDestination.vibe}</p>
            </div>
          )}
        </div>

        {/* Itinerary */}
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          {itinerary ? (
            <div className="space-y-8">
              <ItineraryDisplay itinerary={itinerary} />

              {/* Action Buttons */}
              <div className="border-t pt-6 flex flex-wrap gap-4">
                <button
                  onClick={handleExportPDF}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Export as PDF
                </button>
                <button
                  onClick={handleShareItinerary}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                >
                  Share Itinerary
                </button>
                <button
                  onClick={handleSaveTrip}
                  className="px-6 py-3 bg-green-100 text-green-700 rounded-md hover:bg-green-200 font-medium"
                >
                  Save to My Trips
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No itinerary to display</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
