'use client'

import { Card } from '@/components/ui/card'

interface Activity {
  time?: string
  name?: string
  description?: string
  activity?: any
}

interface Meal {
  name: string
  description?: string
  cuisine?: string
  priceRange?: string
}

interface ItineraryDay {
  day: number
  theme: string
  activities: Activity[]
  meals: Meal[]
  notes?: string
}

interface Lodging {
  name: string
  description?: string
  priceRange?: string
  neighborhood?: string
}

interface Itinerary {
  destination: string
  duration: string
  days: ItineraryDay[]
  lodging: Lodging[]
  personaNotes?: string
}

interface ItineraryDisplayProps {
  itinerary: Itinerary
  isStreaming?: boolean
}

export function ItineraryDisplay({
  itinerary,
  isStreaming,
}: ItineraryDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Your {itinerary.destination} Itinerary
        </h2>
        <p className="mt-2 text-lg text-gray-600">{itinerary.duration}</p>
        {itinerary.personaNotes && (
          <p className="mt-4 text-sm text-gray-500 italic">
            {itinerary.personaNotes}
          </p>
        )}
      </div>

      {/* Lodging Recommendations */}
      {itinerary.lodging && itinerary.lodging.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Where to Stay</h3>
          <div className="space-y-3">
            {itinerary.lodging.map((hotel, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium">{hotel.name}</h4>
                {hotel.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {hotel.description}
                  </p>
                )}
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  {hotel.priceRange && <span>{hotel.priceRange}</span>}
                  {hotel.neighborhood && <span>{hotel.neighborhood}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Daily Itinerary */}
      <div className="space-y-6">
        {itinerary.days.map(day => (
          <Card key={day.day} className="p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold">Day {day.day}</h3>
              <p className="text-gray-600">{day.theme}</p>
            </div>

            {/* Activities */}
            {day.activities && day.activities.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-3">Activities</h4>
                <div className="space-y-3">
                  {day.activities.map((activity, index) => (
                    <div key={index} className="flex gap-4">
                      {activity.time && (
                        <span className="text-sm font-medium text-gray-500 w-20">
                          {activity.time}
                        </span>
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          {activity.name ||
                            activity.activity?.name ||
                            'Activity'}
                        </p>
                        {(activity.description ||
                          activity.activity?.description) && (
                          <p className="text-sm text-gray-600 mt-1">
                            {activity.description ||
                              activity.activity?.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meals */}
            {day.meals && day.meals.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Dining</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {day.meals.map((meal, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium">{meal.name}</p>
                      {meal.cuisine && (
                        <p className="text-sm text-gray-600">{meal.cuisine}</p>
                      )}
                      {meal.priceRange && (
                        <p className="text-sm text-gray-500">
                          {meal.priceRange}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Notes */}
            {day.notes && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">{day.notes}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-blue-600">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Generating your personalized itinerary...</span>
          </div>
        </div>
      )}
    </div>
  )
}
