'use client'

import { MapPin, Clock, Sparkles, Users } from 'lucide-react'
import { useState } from 'react'

import type { DestinationRecommendation } from '@/lib/agents/destination-agent'

interface DestinationSuggestionsProps {
  destinations: DestinationRecommendation[]
  onSelect: (destination: DestinationRecommendation) => void
  isLoading?: boolean
}

export function DestinationSuggestions({
  destinations,
  onSelect,
  isLoading = false,
}: DestinationSuggestionsProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">
            Finding perfect destinations for you...
          </p>
        </div>
      </div>
    )
  }

  if (destinations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          No destinations found. Please try adjusting your requirements.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          We found {destinations.length} perfect destinations for your trip
        </h2>
        <p className="text-gray-600">
          Select a destination to generate your personalized itinerary
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {destinations.map((destination, index) => (
          <div
            key={index}
            className={`rounded-lg border-2 transition-all cursor-pointer hover:shadow-lg ${
              selectedIndex === index
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setSelectedIndex(index)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setSelectedIndex(index)
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Select ${destination.city}, ${destination.state}`}
          >
            <div className="p-6">
              {/* Header */}
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {destination.city}, {destination.state}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {destination.distance.miles} miles
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {destination.distance.driveTime}
                  </span>
                </div>
              </div>

              {/* Vibe */}
              <p className="text-sm font-medium text-blue-600 mb-3">
                {destination.vibe}
              </p>

              {/* Rationale */}
              <p className="text-gray-700 mb-4 text-sm">
                {destination.rationale}
              </p>

              {/* Highlights */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  Highlights
                </h4>
                <ul className="space-y-1">
                  {destination.highlights.slice(0, 3).map((highlight, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-600 flex items-start"
                    >
                      <span className="text-blue-600 mr-2">•</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Perfect For */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                  <Users className="h-4 w-4 text-green-600" />
                  Perfect for
                </h4>
                <div className="flex flex-wrap gap-2">
                  {destination.perfectFor.map((type, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Select Button */}
              <button
                onClick={e => {
                  e.stopPropagation()
                  onSelect(destination)
                }}
                className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                  selectedIndex === index
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {selectedIndex === index
                  ? 'Selected'
                  : 'Select This Destination'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Continue button */}
      {selectedIndex !== null && destinations[selectedIndex] && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => {
              const destination = destinations[selectedIndex]
              if (destination) {
                onSelect(destination)
              }
            }}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
          >
            Continue with {destinations[selectedIndex]?.city || ''}
          </button>
        </div>
      )}
    </div>
  )
}
