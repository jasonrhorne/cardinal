# Cardinal API Contracts

## Response Format Standard

All API responses follow this structure:

```typescript
// Success
{
  status: 'success',
  data: T
}

// Error  
{
  status: 'error',
  error: string,
  details?: unknown
}

// Streaming (Server-Sent Events)
data: {
  type: 'chunk' | 'complete' | 'error',
  content: string,
  data?: T
}
```

## Authentication

### Magic Link Flow
```
POST /api/auth/request-magic-link
{
  email: string
}
→ { status: 'success', data: { message: 'Magic link sent' } }

GET /auth/callback?token=...
→ Redirect to dashboard with session cookie
```

### Session Validation
```
GET /api/auth/session
Headers: { Cookie: 'sb-access-token=...' }
→ { status: 'success', data: { user: TUser } }
```

## Core API Endpoints

### 1. Destination Suggestions

```
POST /api/destinations/suggest
{
  origin: string,           // "San Francisco, CA"
  travelTime: {            
    max: number,            // Max hours willing to travel
    modes: ['air', 'drive'] // Preferred travel modes
  },
  duration: number,         // Trip length in days
  travelers: {
    adults: number,
    children: number,
    childAges?: number[]
  },
  interests: string[],      // ["food", "photography", "nightlife"]
  budget: 'low' | 'medium' | 'high',
  pace: 'relaxed' | 'moderate' | 'packed'
}

→ {
  status: 'success',
  data: {
    destinations: TDestination[],
    processingTime: number
  }
}

// TDestination
{
  id: string,
  name: string,            // "Portland, Oregon"
  rationale: string,       // Why it fits user requirements
  highlights: string[],    // 2-3 key attractions
  travelTime: {
    air?: { duration: string, cost: string },
    drive?: { duration: string, distance: string }
  },
  seasonality: string,     // Seasonal considerations
  confidence: number       // AI confidence score 0-1
}
```

### 2. Itinerary Generation

```
POST /api/itinerary/generate
{
  destinationId: string,
  requirements: TRequirements,  // Same as destination suggest
  persona?: string,             // "photographer" | "foodie" | "family"
  accommodationArea?: string,   // Preferred neighborhood
  specialRequests?: string[]    // Additional constraints
}

→ Streaming Response (SSE)
data: { type: 'chunk', content: 'Researching restaurants in...' }
data: { type: 'chunk', content: 'Found 12 kid-friendly activities...' }
data: { 
  type: 'complete', 
  content: 'Itinerary complete!',
  data: {
    itinerary: TItinerary,
    processingTime: number
  }
}
```

### 3. Itinerary Refinement

```
POST /api/itinerary/{id}/refine
{
  changes: string,          // "Add more coffee shops, less walking"
  context?: {               // Optional context
    hotel: string,
    dietary: string[],
    accessibility: string[]
  }
}

→ Streaming Response (SSE)
data: { type: 'complete', data: { itinerary: TItinerary } }
```

### 4. Data Management

```
// Save itinerary
PUT /api/itinerary/{id}
{ itinerary: TItinerary, name?: string }
→ { status: 'success', data: { id: string } }

// Get user itineraries
GET /api/itineraries
→ { status: 'success', data: { itineraries: TItinerarySummary[] } }

// Share link generation
POST /api/itinerary/{id}/share
→ { status: 'success', data: { shareUrl: string, expiresAt: string } }

// PDF export
GET /api/itinerary/{id}/pdf
→ Binary PDF response
```

## Core Type Definitions

```typescript
type TRequirements = {
  origin: string;
  destination?: string;
  travelTime: {
    max: number;
    modes: ('air' | 'drive' | 'rail')[];
  };
  duration: number;
  travelers: {
    adults: number;
    children: number;
    childAges?: number[];
  };
  interests: string[];
  budget: 'low' | 'medium' | 'high';
  pace: 'relaxed' | 'moderate' | 'packed';
  dietary?: string[];
  accessibility?: string[];
};

type TItinerary = {
  id: string;
  destination: string;
  duration: number;
  createdAt: string;
  updatedAt: string;
  days: TDay[];
  overview: {
    summary: string;
    transportation: string;
    neighborhoods: string[];
    totalEstimatedCost?: string;
  };
  metadata: {
    persona: string;
    confidence: number;
    lastRefinement?: string;
  };
};

type TDay = {
  day: number;
  date?: string;
  theme: string;           // "Historic Downtown Exploration"
  activities: TActivity[];
  meals: TMeal[];
  transportation: string;
  walkingDistance?: string;
  estimatedCost?: string;
};

type TActivity = {
  id: string;
  name: string;
  type: 'attraction' | 'experience' | 'shopping' | 'nature';
  description: string;
  duration: string;        // "1-2 hours"
  timeSlot: string;        // "morning" | "afternoon" | "evening"
  location: {
    address: string;
    coordinates?: [number, number];
    neighborhood: string;
  };
  pricing: {
    range: string;         // "Free" | "$10-20" | "$$"
    notes?: string;
  };
  tags: string[];          // ["kid-friendly", "wheelchair-accessible"]
  tips?: string[];         // Insider recommendations
  alternatives?: string[]; // Backup options
};

type TMeal = {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  cuisine: string;
  description: string;
  location: {
    address: string;
    neighborhood: string;
  };
  pricing: {
    range: string;
    averageCost?: string;
  };
  reservations: {
    required: boolean;
    notes?: string;
  };
  dietary: string[];       // ["vegetarian", "gluten-free"]
  alternatives?: string[];
};
```

## External API Integrations

### Google Places API
```
// Internal proxy endpoint
GET /api/places/search?query={query}&location={lat,lng}
→ { status: 'success', data: { places: TPlace[] } }

// Place details
GET /api/places/{placeId}
→ { status: 'success', data: { place: TPlaceDetails } }
```

### Google Maps API
```
// Travel time calculation
POST /api/maps/travel-time
{
  origin: string,
  destination: string,
  mode: 'driving' | 'walking' | 'transit'
}
→ { 
  status: 'success', 
  data: { 
    duration: string, 
    distance: string,
    route?: TRoute
  } 
}
```

## Streaming Events (Server-Sent Events)

### Event Types
```typescript
type StreamEvent = {
  // Progress updates
  type: 'progress';
  content: string;          // Human-readable progress
  step: string;             // Machine-readable step ID
  progress: number;         // 0-100 percentage
} | {
  // Partial results
  type: 'partial';
  content: string;
  data: Partial<TItinerary>;
} | {
  // Final result
  type: 'complete';
  content: string;
  data: TItinerary;
} | {
  // Error occurred
  type: 'error';
  content: string;
  error: string;
};
```

### Client-Side Consumption
```javascript
const eventSource = new EventSource('/api/itinerary/generate');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  switch(data.type) {
    case 'progress':
      updateProgress(data.progress, data.content);
      break;
    case 'complete':
      displayItinerary(data.data);
      eventSource.close();
      break;
    case 'error':
      showError(data.error);
      eventSource.close();
      break;
  }
};
```

## Error Codes

### Client Errors (4xx)
- `400` - Invalid request format (Zod validation failure)
- `401` - Unauthorized (no valid session)
- `403` - Forbidden (valid session, insufficient permissions)
- `404` - Resource not found
- `409` - Conflict (e.g., itinerary already exists)
- `429` - Rate limited

### Server Errors (5xx)
- `500` - Internal server error
- `502` - External API failure (Google, Anthropic)
- `503` - Service temporarily unavailable
- `504` - Request timeout (AI processing)

### Error Response Format
```typescript
{
  status: 'error',
  error: 'VALIDATION_FAILED',      // Machine-readable code
  message: 'Invalid email format',  // Human-readable message
  details?: {                      // Additional context
    field: 'email',
    value: 'invalid-email',
    constraint: 'Must be valid email'
  }
}
```

## Rate Limits

### Public Endpoints
- Magic link requests: 5 per email per hour
- Destination suggestions: 10 per IP per hour (unauthenticated)

### Authenticated Endpoints
- Destination suggestions: 50 per user per day
- Itinerary generation: 10 per user per day
- Refinements: 20 per itinerary
- PDF exports: 100 per user per day

### Headers
```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 49
X-RateLimit-Reset: 1640995200
```

## Webhooks (Future)

### Itinerary Updates
```
POST {webhook_url}
{
  event: 'itinerary.completed' | 'itinerary.refined',
  itineraryId: string,
  userId: string,
  data: TItinerary
}
```

This API contract ensures consistent communication between all system components and provides clear integration points for external services.