/**
 * Google Routes API Client
 * Handles travel time calculations and route optimization
 */

import { z } from 'zod'

// Route request schema
export const routeRequestSchema = z.object({
  origin: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  destination: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  travelMode: z
    .enum(['DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT'])
    .default('DRIVING'),
  optimize: z.boolean().default(false),
  avoidTolls: z.boolean().default(false),
  avoidHighways: z.boolean().default(false),
})

export type TRouteRequest = z.infer<typeof routeRequestSchema>

// Route response schema
export const routeResponseSchema = z.object({
  distance: z.object({
    meters: z.number(),
    text: z.string(),
  }),
  duration: z.object({
    seconds: z.number(),
    text: z.string(),
  }),
  polyline: z.string().optional(),
  bounds: z
    .object({
      northeast: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
      southwest: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
    })
    .optional(),
})

export type TRouteResponse = z.infer<typeof routeResponseSchema>

// Multiple destinations matrix request
export const routeMatrixRequestSchema = z.object({
  origins: z
    .array(
      z.object({
        lat: z.number(),
        lng: z.number(),
      })
    )
    .max(25),
  destinations: z
    .array(
      z.object({
        lat: z.number(),
        lng: z.number(),
      })
    )
    .max(25),
  travelMode: z
    .enum(['DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT'])
    .default('DRIVING'),
  avoidTolls: z.boolean().default(false),
  avoidHighways: z.boolean().default(false),
})

export type TRouteMatrixRequest = z.infer<typeof routeMatrixRequestSchema>

// Route matrix response schema
export const routeMatrixResponseSchema = z.object({
  matrix: z.array(z.array(routeResponseSchema.nullable())),
})

export type TRouteMatrixResponse = z.infer<typeof routeMatrixResponseSchema>

// Google Routes API client
export class GoogleRoutesClient {
  private apiKey: string
  private baseUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes'
  private matrixUrl =
    'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_PLACES_API_KEY || ''

    if (!this.apiKey) {
      throw new Error(
        'Google Routes API key is required. Set GOOGLE_PLACES_API_KEY environment variable.'
      )
    }
  }

  // Calculate route between two points
  async calculateRoute(request: TRouteRequest): Promise<TRouteResponse> {
    const validatedRequest = routeRequestSchema.parse(request)

    const requestBody = {
      origin: {
        location: {
          latLng: {
            latitude: validatedRequest.origin.lat,
            longitude: validatedRequest.origin.lng,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: validatedRequest.destination.lat,
            longitude: validatedRequest.destination.lng,
          },
        },
      },
      travelMode: validatedRequest.travelMode,
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: validatedRequest.avoidTolls,
        avoidHighways: validatedRequest.avoidHighways,
      },
      languageCode: 'en-US',
      units: 'IMPERIAL',
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask':
          'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.viewport',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(
        `Google Routes API error: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found between the specified locations')
    }

    const route = data.routes[0]

    return {
      distance: {
        meters: route.distanceMeters || 0,
        text: this.formatDistance(route.distanceMeters || 0),
      },
      duration: {
        seconds: parseInt(route.duration?.replace('s', '') || '0'),
        text: this.formatDuration(
          parseInt(route.duration?.replace('s', '') || '0')
        ),
      },
      polyline: route.polyline?.encodedPolyline,
      bounds: route.viewport
        ? {
            northeast: {
              lat: route.viewport.high.latitude,
              lng: route.viewport.high.longitude,
            },
            southwest: {
              lat: route.viewport.low.latitude,
              lng: route.viewport.low.longitude,
            },
          }
        : undefined,
    }
  }

  // Calculate route matrix for multiple origins and destinations
  async calculateRouteMatrix(
    request: TRouteMatrixRequest
  ): Promise<TRouteMatrixResponse> {
    const validatedRequest = routeMatrixRequestSchema.parse(request)

    const requestBody = {
      origins: validatedRequest.origins.map(origin => ({
        waypoint: {
          location: {
            latLng: {
              latitude: origin.lat,
              longitude: origin.lng,
            },
          },
        },
      })),
      destinations: validatedRequest.destinations.map(destination => ({
        waypoint: {
          location: {
            latLng: {
              latitude: destination.lat,
              longitude: destination.lng,
            },
          },
        },
      })),
      travelMode: validatedRequest.travelMode,
      routingPreference: 'TRAFFIC_AWARE',
      routeModifiers: {
        avoidTolls: validatedRequest.avoidTolls,
        avoidHighways: validatedRequest.avoidHighways,
      },
      languageCode: 'en-US',
      units: 'IMPERIAL',
    }

    const response = await fetch(this.matrixUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': '*',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(
        `Google Routes API error: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      throw new Error('No route matrix data available')
    }

    // Transform the response to match our schema
    const matrix: (TRouteResponse | null)[][] = []

    for (let i = 0; i < validatedRequest.origins.length; i++) {
      matrix[i] = []
      for (let j = 0; j < validatedRequest.destinations.length; j++) {
        const rowData = data[i]
        const element = rowData?.elements?.[j]

        if (element && element.status === 'OK' && rowData) {
          matrix[i]![j] = {
            distance: {
              meters: element.distanceMeters || 0,
              text: this.formatDistance(element.distanceMeters || 0),
            },
            duration: {
              seconds: parseInt(element.duration?.replace('s', '') || '0'),
              text: this.formatDuration(
                parseInt(element.duration?.replace('s', '') || '0')
              ),
            },
          }
        } else {
          matrix[i]![j] = null
        }
      }
    }

    return { matrix }
  }

  // Optimize route order for multiple destinations
  async optimizeRoute(
    origin: { lat: number; lng: number },
    destinations: { lat: number; lng: number }[],
    returnToOrigin: boolean = false
  ): Promise<{
    optimizedOrder: number[]
    totalDistance: number
    totalDuration: number
  }> {
    if (destinations.length === 0) {
      return {
        optimizedOrder: [],
        totalDistance: 0,
        totalDuration: 0,
      }
    }

    if (destinations.length === 1) {
      return {
        optimizedOrder: [0],
        totalDistance: 0,
        totalDuration: 0,
      }
    }

    // For now, implement a simple greedy algorithm
    // In production, you might want to use Google's route optimization
    // or implement a more sophisticated algorithm like genetic algorithm

    const unvisited = destinations.map((_, index) => index)
    const optimizedOrder: number[] = []
    let currentLocation = origin
    let totalDistance = 0
    let totalDuration = 0

    while (unvisited.length > 0) {
      let nearestIndex = -1
      let nearestDistance = Infinity
      let nearestDuration = 0

      // Calculate distance to all unvisited destinations
      for (const index of unvisited) {
        try {
          const route = await this.calculateRoute({
            origin: currentLocation!,
            destination: destinations[index]!,
            travelMode: 'DRIVING',
            optimize: false,
            avoidTolls: false,
            avoidHighways: false,
          })

          if (route.distance.meters < nearestDistance) {
            nearestDistance = route.distance.meters
            nearestDuration = route.duration.seconds
            nearestIndex = index
          }
        } catch (error) {
          console.error(
            `Error calculating route to destination ${index}:`,
            error
          )
        }
      }

      if (nearestIndex >= 0 && destinations[nearestIndex]) {
        optimizedOrder.push(nearestIndex)
        currentLocation = destinations[nearestIndex]!
        totalDistance += nearestDistance
        totalDuration += nearestDuration
        unvisited.splice(unvisited.indexOf(nearestIndex), 1)
      } else {
        // Fallback: add remaining destinations in order
        optimizedOrder.push(...unvisited)
        break
      }
    }

    // Add return to origin if requested
    if (returnToOrigin && optimizedOrder.length > 0) {
      try {
        const returnRoute = await this.calculateRoute({
          origin: currentLocation!,
          destination: origin,
          travelMode: 'DRIVING',
          optimize: false,
          avoidTolls: false,
          avoidHighways: false,
        })
        totalDistance += returnRoute.distance.meters
        totalDuration += returnRoute.duration.seconds
      } catch (error) {
        console.error('Error calculating return route:', error)
      }
    }

    return {
      optimizedOrder,
      totalDistance,
      totalDuration,
    }
  }

  // Format distance in meters to readable string
  private formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${meters} m`
    }

    const miles = meters * 0.000621371
    if (miles < 10) {
      return `${miles.toFixed(1)} mi`
    }

    return `${Math.round(miles)} mi`
  }

  // Format duration in seconds to readable string
  private formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} sec`
    }

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) {
      return `${minutes} min`
    }

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (remainingMinutes === 0) {
      return `${hours} hr`
    }

    return `${hours} hr ${remainingMinutes} min`
  }
}

// Default client instance
export const googleRoutesClient = new GoogleRoutesClient()
