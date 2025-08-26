/**
 * User Profile Types and Interfaces
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum TravelPace {
  RELAXED = 'relaxed',
  MODERATE = 'moderate',
  PACKED = 'packed',
}

export enum TravelStyle {
  LUXURY = 'luxury',
  COMFORT = 'comfort',
  BUDGET = 'budget',
  BACKPACKING = 'backpacking',
}

export enum AccommodationType {
  HOTEL = 'hotel',
  AIRBNB = 'airbnb',
  HOSTEL = 'hostel',
  BOUTIQUE = 'boutique',
}

export enum GroupComposition {
  SOLO = 'solo',
  COUPLE = 'couple',
  FAMILY = 'family',
  FRIENDS = 'friends',
}

export enum UnitSystem {
  METRIC = 'metric',
  IMPERIAL = 'imperial',
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface BudgetRange {
  min: number
  max: number
  currency: string
}

export interface TravelPreferences {
  budget_range?: BudgetRange
  travel_pace?: TravelPace
  interests?: string[]
  dietary_restrictions?: string[]
  accessibility_needs?: string[]
  preferred_accommodation?: AccommodationType[]
  travel_style?: TravelStyle[]
  group_composition?: GroupComposition
  preferred_destinations?: string[]
}

export interface UserSettings {
  email_notifications?: boolean
  marketing_emails?: boolean
  public_profile?: boolean
  default_currency?: string
  default_units?: UnitSystem
  timezone?: string
}

export interface UserProfile {
  id: string
  user_id: string
  full_name?: string | null
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
  travel_preferences: TravelPreferences
  settings: UserSettings
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

// ============================================================================
// FORM TYPES (for updates)
// ============================================================================

export interface ProfileUpdatePayload {
  full_name?: string | null
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
  travel_preferences?: Partial<TravelPreferences>
  settings?: Partial<UserSettings>
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ProfileResponse {
  status: 'success' | 'error'
  data?: UserProfile
  error?: string
}

export interface ProfileUpdateResponse {
  status: 'success' | 'error'
  data?: UserProfile
  error?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const TRAVEL_INTERESTS = [
  'photography',
  'food',
  'architecture',
  'nature',
  'culture',
  'history',
  'art',
  'music',
  'nightlife',
  'shopping',
  'adventure',
  'relaxation',
  'sports',
  'wellness',
  'technology',
] as const

export const DIETARY_RESTRICTIONS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'halal',
  'kosher',
  'dairy-free',
  'nut-free',
  'shellfish-free',
  'low-sodium',
  'diabetic',
] as const

export const ACCESSIBILITY_NEEDS = [
  'wheelchair',
  'limited_mobility',
  'visual',
  'hearing',
  'cognitive',
  'service_animal',
] as const

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
] as const

export const DESTINATION_REGIONS = [
  'North America',
  'South America',
  'Europe',
  'Asia',
  'Africa',
  'Oceania',
  'Middle East',
  'Caribbean',
  'Central America',
  'Antarctica',
] as const
