/**
 * Google Maps API Client Configuration
 * Handles initialization and configuration for Google Maps APIs
 */

import { Loader } from '@googlemaps/js-api-loader'

// Google Maps API configuration
export const GOOGLE_MAPS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  version: 'weekly',
  libraries: ['places', 'geometry', 'routes'] as (
    | 'places'
    | 'geometry'
    | 'routes'
  )[],
  region: process.env.GOOGLE_MAPS_REGION || 'US',
  language: process.env.GOOGLE_MAPS_LANGUAGE || 'en',
}

// Validate API key exists
if (!GOOGLE_MAPS_CONFIG.apiKey && typeof window !== 'undefined') {
  console.error(
    'Google Maps API key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.'
  )
}

// Google Maps Loader instance
export const googleMapsLoader = new Loader(GOOGLE_MAPS_CONFIG)

// Load Google Maps API
export async function loadGoogleMaps(): Promise<typeof google> {
  try {
    return await googleMapsLoader.load()
  } catch (error) {
    console.error('Failed to load Google Maps API:', error)
    throw new Error('Failed to initialize Google Maps')
  }
}

// Initialize Google Maps with default options
export async function initializeGoogleMaps(): Promise<{
  maps: typeof google.maps
  places: typeof google.maps.places
}> {
  const google = await loadGoogleMaps()

  return {
    maps: google.maps,
    places: google.maps.places,
  }
}

// Default map options
export const DEFAULT_MAP_OPTIONS: google.maps.MapOptions = {
  zoom: 12,
  center: { lat: 40.7128, lng: -74.006 }, // New York City default
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },
  ],
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
}

// Place photo options
export const DEFAULT_PHOTO_OPTIONS: google.maps.places.PhotoOptions = {
  maxWidth: 800,
  maxHeight: 600,
}

// Autocomplete options for travel destinations
export const DESTINATION_AUTOCOMPLETE_OPTIONS: google.maps.places.AutocompleteOptions =
  {
    types: ['(cities)'],
    fields: [
      'place_id',
      'formatted_address',
      'name',
      'geometry',
      'photos',
      'types',
    ],
  }

// Place details request options
export const PLACE_DETAILS_OPTIONS: google.maps.places.PlaceDetailsRequest = {
  placeId: '',
  fields: [
    'place_id',
    'name',
    'formatted_address',
    'geometry',
    'photos',
    'rating',
    'user_ratings_total',
    'price_level',
    'opening_hours',
    'website',
    'formatted_phone_number',
    'types',
    'reviews',
  ],
}
