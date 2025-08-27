/**
 * Travel Requirements Form Schema
 * Validates user input for travel preferences and constraints
 */

import { z } from 'zod'

// Travel method options
export const TRAVEL_METHODS = ['drive', 'rail', 'air'] as const
export type TravelMethod = (typeof TRAVEL_METHODS)[number]

// Interest categories
export const INTEREST_CATEGORIES = [
  'arts',
  'architecture',
  'nature-outdoors',
  'music-nightlife',
  'sports-recreation',
  'history',
  'food-dining',
  'shopping',
  'culture-local-experiences',
] as const
export type InterestCategory = (typeof INTEREST_CATEGORIES)[number]

// Interest labels for UI
export const INTEREST_LABELS: Record<InterestCategory, string> = {
  arts: 'Arts & Museums',
  architecture: 'Architecture & Design',
  'nature-outdoors': 'Nature & Outdoors',
  'music-nightlife': 'Music & Nightlife',
  'sports-recreation': 'Sports & Recreation',
  history: 'History & Heritage',
  'food-dining': 'Food & Dining',
  shopping: 'Shopping & Markets',
  'culture-local-experiences': 'Culture & Local Experiences',
}

// Travel duration options (in hours)
export const TRAVEL_DURATION_OPTIONS = [
  { value: 2, label: 'Up to 2 hours' },
  { value: 4, label: 'Up to 4 hours' },
  { value: 6, label: 'Up to 6 hours' },
  { value: 8, label: 'Up to 8 hours' },
  { value: 12, label: 'Up to 12 hours' },
  { value: 24, label: 'Up to 1 day' },
  { value: 999, label: 'No limit' },
] as const

// Child age schema
const childAgeSchema = z.object({
  age: z.number().min(0).max(17, 'Children must be under 18'),
  id: z.string(), // For form management
})

// Main travel requirements schema
export const travelRequirementsSchema = z.object({
  // Origin city
  originCity: z
    .string()
    .min(1, 'Please enter your origin city')
    .max(100, 'City name is too long'),

  // Number of adults (minimum 1)
  numberOfAdults: z
    .number()
    .min(1, 'At least one adult is required')
    .max(20, 'Maximum 20 adults allowed'),

  // Children details
  numberOfChildren: z
    .number()
    .min(0, 'Cannot be negative')
    .max(10, 'Maximum 10 children allowed'),

  childrenAges: z.array(childAgeSchema).optional().default([]),

  // Preferred travel methods (at least one required)
  preferredTravelMethods: z
    .array(z.enum(TRAVEL_METHODS))
    .min(1, 'Please select at least one travel method')
    .max(3, 'Maximum 3 travel methods allowed'),

  // Maximum travel duration per method
  travelDurationLimits: z
    .record(
      z.enum(TRAVEL_METHODS),
      z.number().positive('Duration must be positive')
    )
    .optional(),

  // Interests (at least one required)
  interests: z
    .array(z.enum(INTEREST_CATEGORIES))
    .min(1, 'Please select at least one interest')
    .max(INTEREST_CATEGORIES.length, 'Too many interests selected'),
})

// Derived types
export type TTravelRequirements = z.infer<typeof travelRequirementsSchema>
export type TChildAge = z.infer<typeof childAgeSchema>

// Form state type (includes UI-only fields)
export type TTravelRequirementsForm = TTravelRequirements & {
  // Additional form state that doesn't go to the server
  _formId?: string
  _isDirty?: boolean
}

// Validation helpers
export const validateTravelRequirements = (data: unknown) => {
  return travelRequirementsSchema.safeParse(data)
}

// Default form values
export const getDefaultTravelRequirements =
  (): Partial<TTravelRequirementsForm> => ({
    numberOfAdults: 2,
    numberOfChildren: 0,
    childrenAges: [],
    preferredTravelMethods: ['drive'],
    interests: [],
    travelDurationLimits: {
      drive: 4,
      rail: 8,
      air: 6,
    },
  })
