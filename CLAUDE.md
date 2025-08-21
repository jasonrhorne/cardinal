# Cardinal Development Instructions

AI-powered travel itinerary app using Next.js, Netlify Functions, and Tailwind CSS.

## Project Overview
Cardinal is a web application that helps people find and select travel destinations for short weekend trips and generates bespoke, mobile-friendly itineraries. It combines AI agents, LLM intelligence, and external API validation to craft unique travel experiences through persona-driven lenses (e.g., Photographer's Weekend, Architecture Buff, Food-Forward).

**Target Audience**: Culturally-aware people in their 20s-40s seeking unique travel experiences with confidence in recommendations.

## Tech Stack
- **Frontend**: Next.js 14 App Router, Tailwind CSS, TypeScript
- **Backend**: Netlify Functions (Edge for streaming/AI orchestration, Standard for APIs)
- **Database**: Supabase (auth + data storage)
- **State Management**: Zustand (global), React Query (server state)
- **Validation**: Zod schemas everywhere
- **LLM**: Claude (Anthropic) primary, OpenAI fallback
- **External APIs**: Google Maps/Places, Email (magic links)

## Project Structure
```
/app/(auth)              # Authentication pages (magic link)
/app/(dashboard)         # Protected user pages
/app/api                 # API route handlers (if needed)
/components/ui           # Reusable UI components
/components/features     # Feature-specific components (itinerary, form, etc.)
/lib                     # Hooks, utils, types, schemas, API clients
/netlify/functions       # Standard serverless functions
/netlify/edge-functions  # Edge functions for AI orchestration
/Documentation           # Project docs (PRD, System Design, Tasks)
```

## Naming Conventions
- **Files**: `kebab-case.tsx`
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Types**: `TItinerary`, `TDestination` (T prefix)
- **Schemas**: `itinerarySchema`, `destinationSchema` (suffix)
- **API routes**: `/api/snake_case`

## Component Pattern
```tsx
interface ComponentNameProps {
  data: TData;
  onAction?: (id: string) => void;
}

export function ComponentName({ data, onAction }: ComponentNameProps) {
  // React Query for server data
  const { data: items, isLoading, error } = useQuery({
    queryKey: ['items', id],
    queryFn: fetchItems,
  });
  
  // Zustand for global state
  const { user, setItinerary } = useAppStore();
  
  // Local state for UI
  const [isOpen, setIsOpen] = useState(false);
  
  // Always handle loading and error states
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div className="rounded-lg border border-gray-200 p-4 md:p-6">
      {/* Mobile-first responsive content */}
    </div>
  );
}
```

## Netlify Function Pattern
```typescript
import { Handler } from '@netlify/functions';
import { z } from 'zod';

const requestSchema = z.object({
  destination: z.string(),
  travelers: z.number().positive(),
  interests: z.array(z.string()),
});

export const handler: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  try {
    const body = requestSchema.parse(JSON.parse(event.body || '{}'));
    const result = await processRequest(body);
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ status: 'success', data: result }),
    };
  } catch (error) {
    console.error('Function error:', error);
    
    if (error instanceof z.ZodError) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ status: 'error', error: 'Invalid request', details: error.errors })
      };
    }
    
    return { 
      statusCode: 500, 
      body: JSON.stringify({ status: 'error', error: 'Internal server error' })
    };
  }
};
```

## Tailwind Design System
- **Primary Actions**: `bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md`
- **Secondary Actions**: `bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-md`
- **Cards**: `rounded-lg border border-gray-200 bg-white p-4 md:p-6 shadow-sm`
- **Container**: `container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl`
- **Grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6`
- **Form Fields**: `w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500`

## AI Integration Patterns
```typescript
// Persona-driven prompt structure
const generateItineraryPrompt = (requirements: TRequirements, persona: string) => `
You are a ${persona} travel concierge. Generate a ${requirements.duration}-day itinerary for ${requirements.destination}.

User Profile:
- Origin: ${requirements.origin}
- Travelers: ${requirements.travelers} (${requirements.children} children)
- Interests: ${requirements.interests.join(', ')}
- Budget: ${requirements.budget}
- Pace: ${requirements.pace}

Return valid JSON matching this schema:
${JSON.stringify(itinerarySchema)}

Focus on ${persona.toLowerCase()} perspective: unique local gems, authentic experiences, hidden neighborhoods.
`;

// Always validate AI responses with Zod
const callAIAgent = async (prompt: string, schema: z.ZodType) => {
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4000,
  });
  
  const parsed = JSON.parse(response.content[0].text);
  return schema.parse(parsed); // Throws if invalid
};
```

## Key User Journeys
1. **Magic Link Auth** → Requirements Form → Destination Suggestions → Itinerary Generation
2. **Refinement Loop** → Chat-based modifications → Updated itinerary → PDF export/sharing
3. **History View** → Past itineraries → Duplicate and modify

## API Response Standards
```typescript
// Success responses
{ status: 'success', data: T }

// Error responses  
{ status: 'error', error: string, details?: unknown }

// Streaming responses (SSE)
data: { type: 'chunk' | 'complete', content: string, itinerary?: TItinerary }
```

## Performance Requirements
- **Destination suggestions**: < 10 seconds
- **Initial itinerary**: < 20 seconds  
- **Refinement iterations**: < 10 seconds
- **Mobile-first**: Optimize for mobile consumption
- **Debounced inputs**: 300ms delay for search/filter

## Security & Privacy
- **Magic link authentication** via Supabase Auth
- **Minimal PII storage** (email only)
- **Environment variables** for all API keys
- **CORS configuration** in netlify.toml
- **CSP headers** configured for security
- **No localStorage** for sensitive data

## Critical Rules
1. **Mobile-first**: Design for mobile, enhance for desktop
2. **TypeScript strict**: No `any` types, comprehensive type coverage
3. **Error boundaries**: Handle loading, error, and empty states everywhere
4. **Zod validation**: Validate all inputs and AI responses
5. **Streaming UX**: Use Server-Sent Events for long AI operations
6. **Accessibility**: Semantic HTML, WCAG AA compliance, keyboard navigation
7. **Performance**: Lazy load components, optimize bundle size
8. **Decision logging**: Document architectural/technical decisions in DECISIONS.md with rationale

## Key Architectural Decisions
- **Supabase** over Auth0/Clerk (simpler integration, includes database)
- **Zustand** over Redux Toolkit (lighter, simpler API)  
- **React Query** over SWR (better developer experience, caching)
- **Netlify Edge Functions** for AI orchestration (streaming support, 10min timeout)
- **Next.js App Router** over Pages Router (modern, better DX)
- **Zod everywhere** (runtime + compile-time validation)

## Don'ts
- No localStorage for sensitive data (use Supabase auth state)
- No direct API calls from components (use React Query)
- No custom CSS files (Tailwind utility classes only)
- No Pages Router patterns (App Router only)
- No ignored TypeScript errors (`@ts-ignore`)
- No generic error messages (provide specific, actionable feedback)

## Testing Strategy
- **Unit tests**: Jest + Testing Library for components
- **Integration tests**: API functions with test data
- **E2E tests**: Critical user journeys (auth → itinerary → export)
- **AI validation**: Test prompt responses against schemas

## Environment Variables Required
```bash
# AI/LLM
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Google APIs  
GOOGLE_MAPS_API_KEY=
GOOGLE_PLACES_API_KEY=

# Database & Auth
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=

# Email (Magic Links)
EMAIL_FROM=
EMAIL_SERVER_URL=

# Environment
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## Development Workflow
1. **Tasks tracked** in Documentation/Cardinal_Engineering_Tasks.md
2. **Mark tasks complete** with ✓ and date when finished
3. **Decision logging** - Update DECISIONS.md for any architectural, technical, or product decisions
4. **Mobile-first development** - test on mobile breakpoints first
5. **TypeScript strict** - resolve all type errors before committing
6. **Test AI integrations** thoroughly - LLMs can be unpredictable

## Current Status
- ✅ F001: Project Repository Setup
- ✅ F002: Netlify Project Configuration  
- ⏳ F003: Next.js Project Scaffolding (next priority)

See `Documentation/Cardinal_Engineering_Tasks.md` for full task breakdown and dependencies.