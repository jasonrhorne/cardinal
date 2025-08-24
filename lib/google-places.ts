/**
 * Google Places API Client
 * Server-side utilities for Google Places API integration
 */

import { z } from 'zod'

// Place search request schema
export const placeSearchRequestSchema = z.object({
  query: z.string().min(1),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  radius: z.number().positive().optional(),
  type: z.string().optional(),
  maxResults: z.number().positive().max(20).optional(),
})

export type TPlaceSearchRequest = z.infer<typeof placeSearchRequestSchema>

// Place details schema
export const placeDetailsSchema = z.object({
  placeId: z.string(),
  name: z.string(),
  formattedAddress: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  rating: z.number().optional(),
  priceLevel: z.number().min(0).max(4).optional(),
  photos: z
    .array(
      z.object({
        photoReference: z.string(),
        width: z.number(),
        height: z.number(),
      })
    )
    .optional(),
  types: z.array(z.string()),
  openingHours: z
    .object({
      openNow: z.boolean().optional(),
      weekdayText: z.array(z.string()).optional(),
    })
    .optional(),
  website: z.string().url().optional(),
  phoneNumber: z.string().optional(),
  reviews: z
    .array(
      z.object({
        rating: z.number(),
        text: z.string(),
        authorName: z.string(),
        time: z.number(),
      })
    )
    .optional(),
})

export type TPlaceDetails = z.infer<typeof placeDetailsSchema>

// Place search response schema
export const placeSearchResponseSchema = z.object({
  status: z.literal('success'),
  data: z.object({
    places: z.array(placeDetailsSchema),
    nextPageToken: z.string().optional(),
  }),
})

export type TPlaceSearchResponse = z.infer<typeof placeSearchResponseSchema>

// Google Places API client
export class GooglePlacesClient {
  private apiKey: string
  private baseUrl = 'https://maps.googleapis.com/maps/api/place'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_PLACES_API_KEY || ''

    if (!this.apiKey) {
      throw new Error(
        'Google Places API key is required. Set GOOGLE_PLACES_API_KEY environment variable.'
      )
    }
  }

  // Search for places using Text Search API
  async searchPlaces(request: TPlaceSearchRequest): Promise<TPlaceDetails[]> {
    const validatedRequest = placeSearchRequestSchema.parse(request)

    const params = new URLSearchParams({
      key: this.apiKey,
      query: validatedRequest.query,
    })

    if (validatedRequest.location) {
      params.append(
        'locationbias',
        `circle:${validatedRequest.radius || 50000}@${validatedRequest.location.lat},${validatedRequest.location.lng}`
      )
    }

    if (validatedRequest.type) {
      params.append('type', validatedRequest.type)
    }

    const response = await fetch(`${this.baseUrl}/textsearch/json?${params}`)

    if (!response.ok) {
      throw new Error(
        `Google Places API error: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(
        `Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`
      )
    }

    return this.transformPlacesResponse(data.results || [])
  }

  // Get place details by place ID
  async getPlaceDetails(placeId: string): Promise<TPlaceDetails | null> {
    const params = new URLSearchParams({
      key: this.apiKey,
      place_id: placeId,
      fields: [
        'place_id',
        'name',
        'formatted_address',
        'geometry',
        'rating',
        'user_ratings_total',
        'price_level',
        'photos',
        'types',
        'opening_hours',
        'website',
        'formatted_phone_number',
        'reviews',
      ].join(','),
    })

    const response = await fetch(`${this.baseUrl}/details/json?${params}`)

    if (!response.ok) {
      throw new Error(
        `Google Places API error: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()

    if (data.status !== 'OK') {
      if (data.status === 'NOT_FOUND') {
        return null
      }
      throw new Error(
        `Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`
      )
    }

    return this.transformPlaceDetails(data.result)
  }

  // Get nearby places
  async getNearbyPlaces(
    location: { lat: number; lng: number },
    radius: number = 5000,
    type?: string
  ): Promise<TPlaceDetails[]> {
    const params = new URLSearchParams({
      key: this.apiKey,
      location: `${location.lat},${location.lng}`,
      radius: radius.toString(),
      fields: [
        'place_id',
        'name',
        'vicinity',
        'geometry',
        'rating',
        'price_level',
        'photos',
        'types',
        'opening_hours',
      ].join(','),
    })

    if (type) {
      params.append('type', type)
    }

    const response = await fetch(`${this.baseUrl}/nearbysearch/json?${params}`)

    if (!response.ok) {
      throw new Error(
        `Google Places API error: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(
        `Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`
      )
    }

    return this.transformPlacesResponse(data.results || [])
  }

  // Transform raw Google Places API response to our schema
  private transformPlacesResponse(places: any[]): TPlaceDetails[] {
    return places.map(place => this.transformPlaceDetails(place))
  }

  // Transform individual place data
  private transformPlaceDetails(place: any): TPlaceDetails {
    return {
      placeId: place.place_id,
      name: place.name,
      formattedAddress: place.formatted_address || place.vicinity || '',
      location: {
        lat: place.geometry?.location?.lat || 0,
        lng: place.geometry?.location?.lng || 0,
      },
      rating: place.rating,
      priceLevel: place.price_level,
      photos: place.photos?.slice(0, 5).map((photo: any) => ({
        photoReference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
      })),
      types: place.types || [],
      openingHours: place.opening_hours
        ? {
            openNow: place.opening_hours.open_now,
            weekdayText: place.opening_hours.weekday_text,
          }
        : undefined,
      website: place.website,
      phoneNumber: place.formatted_phone_number,
      reviews: place.reviews?.slice(0, 3).map((review: any) => ({
        rating: review.rating,
        text: review.text,
        authorName: review.author_name,
        time: review.time,
      })),
    }
  }

  // Get photo URL from photo reference
  getPhotoUrl(
    photoReference: string,
    maxWidth: number = 400,
    maxHeight: number = 300
  ): string {
    return `${this.baseUrl}/photo?photoreference=${photoReference}&maxwidth=${maxWidth}&maxheight=${maxHeight}&key=${this.apiKey}`
  }
}

// Default client instance
export const googlePlacesClient = new GooglePlacesClient()
