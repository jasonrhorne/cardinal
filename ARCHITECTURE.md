# Cardinal Architecture Overview

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Netlify Edge   │    │  External APIs  │
│   (Next.js)     │◄──►│   Functions      │◄──►│                 │
│                 │    │                  │    │  • Anthropic    │
│  • App Router   │    │  • Concierge     │    │  • Google Maps  │
│  • Tailwind CSS │    │  • AI Agents     │    │  • Google Places│
│  • TypeScript   │    │  • Streaming     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────┐
│  Client State   │    │ Standard Functions│
│                 │    │                  │
│  • Zustand      │    │  • Auth helpers  │
│  • React Query  │    │  • Data utils    │
│  • Local UI     │    │  • Validation    │
└─────────────────┘    └──────────────────┘
         │                        │
         └────────┬─────────────────┘
                  ▼
         ┌─────────────────┐
         │   Supabase      │
         │                 │
         │  • Auth (Magic  │
         │    Links)       │
         │  • Database     │
         │  • Storage      │
         └─────────────────┘
```

## Data Flow

### Primary User Journey

1. **Authentication**: Magic link → Supabase Auth → Session cookie
2. **Requirements**: Form data → Validation → Temporary storage
3. **AI Processing**: Requirements → Edge Function → LLM → Structured response
4. **Display**: Itinerary data → React components → Mobile-first UI
5. **Persistence**: Save/Export → Database/PDF generation

### AI Agent Orchestration

```
User Request
     │
     ▼
┌─────────────────┐
│ Concierge Agent │ (Edge Function - Main orchestrator)
│                 │
│ • Parse request │
│ • Route to      │
│   specialists  │
└─────────────────┘
     │
     ├──► Research Agent (Places, timing, logistics)
     │
     ├──► Validation Agent (Data accuracy, availability)
     │
     └──► Generation Agent (Itinerary creation, formatting)
```

## Component Boundaries

### Frontend Layers

- **Pages** (`/app`): Route handlers, layout, metadata
- **Features** (`/components/features`): Business logic components (ItineraryDisplay, RequirementsForm)
- **UI** (`/components/ui`): Reusable primitives (Button, Card, Input)
- **Utilities** (`/lib`): Hooks, schemas, API clients, types

### Backend Layers

- **Edge Functions**: AI orchestration, streaming responses, long-running tasks
- **Standard Functions**: CRUD operations, auth helpers, external API proxies
- **External APIs**: Direct integrations (Google, Anthropic, Email)

### State Management

- **Server State**: React Query (API data, caching, background updates)
- **Global State**: Zustand (user session, current itinerary, app settings)
- **Local State**: React useState (form inputs, UI toggles, loading states)

## Key Architectural Decisions

### 1. Hybrid Jamstack

- **Static**: Marketing pages, app shell (CDN-cached)
- **Dynamic**: User data, AI responses (serverless functions)
- **Why**: Optimal performance + unlimited scaling

### 2. Edge Functions for AI

- **Streaming**: Real-time response delivery via SSE
- **Timeout**: 10-minute limit for complex AI operations
- **Why**: Better UX than request/wait/poll pattern

### 3. Multi-Agent AI System

- **Separation**: Research, validation, generation as distinct agents
- **Coordination**: Central concierge orchestrates workflow
- **Why**: Modularity, easier testing, specialized prompts

### 4. External-First Data Strategy

- **Primary Sources**: Google APIs for place data
- **AI Role**: Curation and recommendation, not data source
- **Validation**: Cross-reference AI output with authoritative APIs
- **Why**: Accuracy over AI hallucination

## Service Dependencies

### Critical Path

1. **Supabase** - Authentication, user data, itinerary storage
2. **Anthropic/OpenAI** - AI agents for destination and itinerary generation
3. **Google Maps/Places** - Location data, travel times, place details
4. **Netlify** - Hosting, functions, CDN, deployment

### Optional/Enhancement

- **Email Service** - Magic link delivery (fallback: Supabase built-in)
- **Analytics** - Usage tracking (can be added later)
- **Monitoring** - Error tracking (Netlify provides basic)

## Security Architecture

### Authentication Flow

```
Email Input → Magic Link → Email → Link Click → Supabase Auth → JWT → Session
```

### Data Privacy

- **PII Minimization**: Email address only
- **API Keys**: Server-side environment variables only
- **User Data**: Encrypted at rest (Supabase), HTTPS in transit

### Content Security

- **CSP Headers**: Strict policy for XSS prevention
- **CORS**: Explicit origin allowlist
- **Input Validation**: Zod schemas on all boundaries

## Performance Strategy

### Frontend Optimization

- **Code Splitting**: Route-level and component-level lazy loading
- **Caching**: Aggressive static asset caching (1 year)
- **Bundle**: Tree shaking, compression, modern JS only

### Backend Optimization

- **Function Cold Starts**: Keep functions warm with scheduled pings
- **AI Response Caching**: Cache common destination/itinerary pairs
- **Database**: Connection pooling, optimized queries

### User Experience

- **Progressive Loading**: Show UI skeleton while AI generates content
- **Offline Graceful**: Cache recent itineraries for offline viewing
- **Mobile Priority**: Touch-optimized, thumb-friendly navigation

## Monitoring & Observability

### Key Metrics

- **User Journey**: Conversion rates through auth → itinerary → save/share
- **AI Performance**: Response times, quality scores, retry rates
- **System Health**: Function execution times, error rates, API quotas

### Alerting Triggers

- **AI Failures**: >5% error rate from LLM providers
- **API Limits**: Approaching Google Maps quota limits
- **Performance**: >30s average response time for itinerary generation

## Deployment Architecture

### Environment Promotion

```
Feature Branch → Preview Deploy (Netlify) → Manual QA → Main Branch → Production
```

### Rollback Strategy

- **Frontend**: Instant rollback via Netlify deploy history
- **Functions**: Git revert → automatic redeploy
- **Database**: Migration rollback scripts (manual)

### Secrets Management

- **Development**: `.env.local` (gitignored)
- **Production**: Netlify environment variables
- **Rotation**: Quarterly API key rotation planned

## Future Architecture Considerations

### Scale Bottlenecks (>10k MAU)

1. **AI Costs**: Implement response caching, prompt optimization
2. **Database**: Consider read replicas, query optimization
3. **Functions**: May need dedicated server for complex AI workflows

### Feature Extensions

- **Real-time Collaboration**: WebSocket for shared itinerary editing
- **Mobile App**: React Native with shared business logic
- **Integration APIs**: Webhook system for external bookings

This architecture supports the MVP requirements while providing clear paths for scaling and feature expansion.
