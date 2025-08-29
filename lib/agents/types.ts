/**
 * Cardinal Multi-Agent System Types
 * Core interfaces and types for agent orchestration
 */

// Travel Requirements type - matches the actual schema
export interface TTravelRequirements {
  originCity: string
  numberOfAdults: number
  numberOfChildren: number
  childrenAges: { age: number; id: string }[]
  preferredTravelMethods: ('drive' | 'rail' | 'air')[]
  interests: (
    | 'food-dining'
    | 'music-nightlife'
    | 'arts'
    | 'architecture'
    | 'nature-outdoors'
    | 'sports-recreation'
    | 'history'
    | 'shopping'
    | 'culture-local-experiences'
  )[]
  travelDurationLimits?: Record<string, number>
  // Additional fields for itinerary generation
  destination?: string
  duration?: string
  budget?: 'budget' | 'moderate' | 'luxury'
  pace?: 'relaxed' | 'moderate' | 'packed'
  dietary?: string[]
  accessibility?: string[]
}

// Agent Types
export type AgentType =
  | 'concierge'
  | 'lodging'
  | 'food-dining'
  | 'arts-architecture'
  | 'historian'
  | 'outdoor-recreation'
  | 'photography'
  | 'music-nightlife'
  | 'family-activities'
  | 'quality-validator'

// Agent Status
export type AgentStatus = 'idle' | 'working' | 'completed' | 'failed'

// Persona Profile for context injection
export interface PersonaProfile {
  primary:
    | 'photographer'
    | 'foodie'
    | 'adventurer'
    | 'culture'
    | 'family'
    | 'balanced'
  interests: string[]
  travelStyle: 'luxury' | 'budget' | 'balanced'
  activityLevel: 'relaxed' | 'moderate' | 'packed'
  specialContext?: string // "traveling with toddler", "wheelchair accessible", etc.
}

// Travel Constraints
export interface TravelConstraints {
  budget?: 'budget' | 'moderate' | 'luxury'
  accessibility?: string[]
  dietary?: string[]
  mustAvoid?: string[]
  mustInclude?: string[]
}

// Agent Context shared between agents
export interface AgentContext {
  userRequirements: TTravelRequirements
  destinationCity: string
  personaProfile: PersonaProfile
  constraints: TravelConstraints
  previousFindings: Map<AgentType, ResearchOutput>
  conversationHistory?: string[]
}

// Task specification from Concierge to Research Agents
export interface TaskSpecification {
  taskId: string
  agentType: AgentType
  priority: 'high' | 'medium' | 'low'
  description: string
  constraints: string[]
  expectedOutput: string
  timeout?: number // milliseconds
}

// Research Output from Research Agents
export interface ResearchOutput {
  agentType: AgentType
  status: 'success' | 'partial' | 'failed'
  recommendations: Recommendation[]
  confidence: number
  reasoning: string
  sources?: string[]
  warnings?: string[]
}

// Individual Recommendation
export interface Recommendation {
  name: string
  category: string
  description: string
  whyRecommended: string
  personaFit: number // 0-100

  // Location details
  address?: string
  neighborhood?: string
  coordinates?: { lat: number; lng: number }

  // Logistics
  estimatedTime?: string // "2-3 hours"
  bestTimeToVisit?: string
  priceRange?: string

  // Food specific
  cuisine?: string
  mealType?: string[]
  mustTry?: string[]
  localTip?: string

  // Lodging specific
  highlights?: string[]
  walkability?: string
  nearbyAttractions?: string[]

  // Metadata (to be enriched by Quality Agent)
  placeId?: string // Google Places ID
  website?: string
  phone?: string
  hours?: OperatingHours
  rating?: number
  reviewCount?: number
  photos?: string[]
  reservationRequired?: boolean
  seasonalNotes?: string

  // Validation
  validationStatus?: 'verified' | 'probable' | 'unverified'
  validationSource?: string
  sourceAgent?: string
}

// Operating Hours
export interface OperatingHours {
  [key: string]: { open: string; close: string } | 'closed'
}

// Quality Validation Result
export interface QualityValidation {
  originalRecommendation: Recommendation
  validationStatus: 'verified' | 'probable' | 'unverified' | 'not_found'
  confidence: number
  enrichedData?: Partial<Recommendation>
  issues?: string[]
  alternatives?: Recommendation[]
}

// Agent Message for communication
export interface AgentMessage {
  id: string
  timestamp: Date
  from: AgentType
  to: AgentType | 'broadcast'
  type: 'task' | 'result' | 'error' | 'status'
  payload: any
  context?: AgentContext
}

// Itinerary Output
export interface Itinerary {
  destination: string
  duration: string
  days: ItineraryDay[]
  lodging: Recommendation[]
  transportation?: TransportationInfo
  totalEstimatedCost?: string
  personaNotes: string
  warnings?: string[]
}

export interface ItineraryDay {
  day: number
  date?: string
  theme: string
  activities: ItineraryActivity[]
  meals: Recommendation[]
  notes?: string
}

export interface ItineraryActivity {
  time: string
  activity: Recommendation
  duration: string
  transitTime?: string
  transitMode?: string
}

export interface TransportationInfo {
  mode: 'drive' | 'fly' | 'train'
  estimatedTime: string
  estimatedCost?: string
  notes?: string
}

// Agent Response wrapper
export interface AgentResponse<T = any> {
  agentType: AgentType
  status: 'success' | 'partial' | 'fallback' | 'failed'
  data: T
  confidence: number
  executionTime: number
  missingComponents?: string[]
  fallbackReason?: string
  suggestions?: string[]
}

// Agent Configuration
export interface AgentConfig {
  type: AgentType
  name: string
  description: string
  model?: string // LLM model to use
  temperature?: number
  maxTokens?: number
  timeout?: number
  retryAttempts?: number
  tools?: string[] // Available tools/APIs
}

// Orchestration Result
export interface OrchestrationResult {
  success: boolean
  itinerary?: Itinerary
  rawResearch?: Map<AgentType, ResearchOutput>
  validationReport?: QualityValidation[]
  conversationLog?: AgentMessage[]
  totalExecutionTime: number
  costs?: {
    llmTokens: number
    apiCalls: number
    estimatedCost: number
  }
}
