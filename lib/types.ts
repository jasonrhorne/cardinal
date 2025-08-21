// Core type definitions for Cardinal

export type TRequirements = {
  origin: string
  destination?: string
  travelTime: {
    max: number
    modes: ('air' | 'drive' | 'rail')[]
  }
  duration: number
  travelers: {
    adults: number
    children: number
    childAges?: number[]
  }
  interests: string[]
  budget: 'low' | 'medium' | 'high'
  pace: 'relaxed' | 'moderate' | 'packed'
  dietary?: string[]
  accessibility?: string[]
}

export type TDestination = {
  id: string
  name: string
  rationale: string
  highlights: string[]
  travelTime: {
    air?: { duration: string; cost: string }
    drive?: { duration: string; distance: string }
  }
  seasonality: string
  confidence: number
}

export type TActivity = {
  id: string
  name: string
  type: 'attraction' | 'experience' | 'shopping' | 'nature'
  description: string
  duration: string
  timeSlot: string
  location: {
    address: string
    coordinates?: [number, number]
    neighborhood: string
  }
  pricing: {
    range: string
    notes?: string
  }
  tags: string[]
  tips?: string[]
  alternatives?: string[]
}

export type TMeal = {
  id: string
  name: string
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  cuisine: string
  description: string
  location: {
    address: string
    neighborhood: string
  }
  pricing: {
    range: string
    averageCost?: string
  }
  reservations: {
    required: boolean
    notes?: string
  }
  dietary: string[]
  alternatives?: string[]
}

export type TDay = {
  day: number
  date?: string
  theme: string
  activities: TActivity[]
  meals: TMeal[]
  transportation: string
  walkingDistance?: string
  estimatedCost?: string
}

export type TItinerary = {
  id: string
  destination: string
  duration: number
  createdAt: string
  updatedAt: string
  days: TDay[]
  overview: {
    summary: string
    transportation: string
    neighborhoods: string[]
    totalEstimatedCost?: string
  }
  metadata: {
    persona: string
    confidence: number
    lastRefinement?: string
  }
}

export type TUser = {
  id: string
  email: string
  createdAt: string
}
