'use client'

import { Calendar, MapPin, Utensils, Bed, Clock } from 'lucide-react'

interface ItineraryDisplayProps {
  itinerary: any // We'll type this properly later
}

export function ItineraryDisplay({ itinerary }: ItineraryDisplayProps) {
  if (!itinerary) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No itinerary to display</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Overview */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {itinerary.destination || 'Your Itinerary'}
        </h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            {itinerary.duration || '3 days'}
          </span>
          {itinerary.personaNotes && (
            <span className="flex items-center gap-2 text-gray-600">
              {itinerary.personaNotes}
            </span>
          )}
        </div>
      </div>

      {/* Lodging Recommendations */}
      {itinerary.lodging && itinerary.lodging.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bed className="h-5 w-5 text-blue-600" />
            Where to Stay
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {itinerary.lodging.map((hotel: any, index: number) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <h4 className="font-semibold text-gray-900">{hotel.name}</h4>
                {hotel.neighborhood && (
                  <p className="text-sm text-gray-600 mt-1">
                    {hotel.neighborhood}
                  </p>
                )}
                {hotel.description && (
                  <p className="text-sm text-gray-700 mt-2">
                    {hotel.description}
                  </p>
                )}
                {hotel.priceRange && (
                  <p className="text-sm font-medium text-green-600 mt-2">
                    {hotel.priceRange}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Itinerary */}
      {itinerary.days && itinerary.days.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Your Daily Itinerary
          </h3>
          <div className="space-y-6">
            {itinerary.days.map((day: any) => (
              <div key={day.day} className="border-l-4 border-blue-600 pl-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Day {day.day}: {day.theme}
                </h4>

                {/* Activities */}
                {day.activities && day.activities.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      Activities
                    </h5>
                    <div className="space-y-2">
                      {day.activities.map((activity: any, index: number) => (
                        <div
                          key={index}
                          className="bg-white rounded p-3 border border-gray-100"
                        >
                          <div className="flex items-start gap-2">
                            {activity.time && (
                              <span className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="h-3 w-3" />
                                {activity.time}
                              </span>
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {activity.name}
                              </p>
                              {activity.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {activity.description}
                                </p>
                              )}
                              {activity.location && (
                                <p className="text-xs text-gray-500 mt-1">
                                  📍 {activity.location}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meals */}
                {day.meals && day.meals.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-orange-600" />
                      Dining
                    </h5>
                    <div className="space-y-2">
                      {day.meals.map((meal: any, index: number) => (
                        <div
                          key={index}
                          className="bg-white rounded p-3 border border-gray-100"
                        >
                          <p className="font-medium text-gray-900">
                            {meal.name}
                          </p>
                          {meal.type && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mt-1 inline-block">
                              {meal.type}
                            </span>
                          )}
                          {meal.cuisine && (
                            <p className="text-sm text-gray-600 mt-1">
                              {meal.cuisine}
                            </p>
                          )}
                          {meal.description && (
                            <p className="text-sm text-gray-700 mt-1">
                              {meal.description}
                            </p>
                          )}
                          {meal.neighborhood && (
                            <p className="text-xs text-gray-500 mt-1">
                              📍 {meal.neighborhood}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="border-t pt-6 flex gap-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Export as PDF
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
          Share Itinerary
        </button>
      </div>
    </div>
  )
}
