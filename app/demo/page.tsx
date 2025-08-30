'use client'

import { useState } from 'react'

import { DestinationSuggestions } from '@/components/features/destination-suggestions'
import { ItineraryDisplay } from '@/components/features/itinerary-display'
import { TravelRequirementsForm } from '@/components/travel/travel-requirements-form'
import type { DestinationRecommendation } from '@/lib/agents/destination-agent'
import type { TTravelRequirements } from '@/lib/schemas/travel-requirements'

type FlowStep = 'requirements' | 'destinations' | 'itinerary'

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState<FlowStep>('requirements')
  const [requirements, setRequirements] = useState<TTravelRequirements | null>(
    null
  )
  const [destinations, setDestinations] = useState<DestinationRecommendation[]>(
    []
  )
  const [selectedDestination, setSelectedDestination] =
    useState<DestinationRecommendation | null>(null)
  const [itinerary, setItinerary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleRequirementsSubmit = async (data: TTravelRequirements) => {
    setRequirements(data)
    setIsLoading(true)

    try {
      // Call the destination generation API
      const response = await fetch(
        '/.netlify/functions/generate-destinations',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requirements: data }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to generate destinations')
      }

      const result = await response.json()

      if (result.status === 'success' && result.data?.destinations) {
        setDestinations(result.data.destinations)
        setCurrentStep('destinations')
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Error generating destinations:', error)
      alert('Failed to generate destinations. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDestinationSelect = async (
    destination: DestinationRecommendation
  ) => {
    setSelectedDestination(destination)
    setIsLoading(true)

    try {
      // Call the itinerary generation API with the selected destination
      const response = await fetch('/.netlify/functions/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements: {
            ...requirements,
            destination: `${destination.city}, ${destination.state}`,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate itinerary')
      }

      const result = await response.json()

      if (result.status === 'success' && result.data) {
        setItinerary(result.data)
        setCurrentStep('itinerary')
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Error generating itinerary:', error)
      alert('Failed to generate itinerary. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (currentStep === 'destinations') {
      setCurrentStep('requirements')
    } else if (currentStep === 'itinerary') {
      setCurrentStep('destinations')
    }
  }

  const handleStartOver = () => {
    setCurrentStep('requirements')
    setRequirements(null)
    setDestinations([])
    setSelectedDestination(null)
    setItinerary(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cardinal Travel Planning Demo
          </h1>
          <p className="text-gray-600">
            Experience the complete flow from requirements to personalized
            itinerary
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center ${currentStep === 'requirements' ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentStep === 'requirements'
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300'
                }`}
              >
                1
              </div>
              <span className="ml-2 hidden sm:inline">Requirements</span>
            </div>

            <div className="w-16 h-0.5 bg-gray-300" />

            <div
              className={`flex items-center ${currentStep === 'destinations' ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentStep === 'destinations'
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300'
                }`}
              >
                2
              </div>
              <span className="ml-2 hidden sm:inline">Destinations</span>
            </div>

            <div className="w-16 h-0.5 bg-gray-300" />

            <div
              className={`flex items-center ${currentStep === 'itinerary' ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentStep === 'itinerary'
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300'
                }`}
              >
                3
              </div>
              <span className="ml-2 hidden sm:inline">Itinerary</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          {currentStep === 'requirements' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                Tell us about your trip
              </h2>
              <TravelRequirementsForm onSubmit={handleRequirementsSubmit} />
            </div>
          )}

          {currentStep === 'destinations' && (
            <div>
              <button
                onClick={handleBack}
                className="mb-4 text-blue-600 hover:text-blue-700"
              >
                ← Back to requirements
              </button>
              <DestinationSuggestions
                destinations={destinations}
                onSelect={handleDestinationSelect}
                isLoading={isLoading}
              />
            </div>
          )}

          {currentStep === 'itinerary' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={handleBack}
                  className="text-blue-600 hover:text-blue-700"
                >
                  ← Back to destinations
                </button>
                <button
                  onClick={handleStartOver}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Start Over
                </button>
              </div>

              {selectedDestination && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Your Itinerary for {selectedDestination.city},{' '}
                    {selectedDestination.state}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {selectedDestination.vibe}
                  </p>
                </div>
              )}

              {itinerary && <ItineraryDisplay itinerary={itinerary} />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
