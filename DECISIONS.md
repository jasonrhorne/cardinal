# Cardinal Decision Log

Track key architectural, product, and technical decisions with rationale for future reference.

## 2025-08-21: Hybrid Jamstack Architecture

**Context**: Need balance between performance and dynamic functionality for AI-driven app
**Decision**: Hybrid Jamstack with static frontend + serverless backend
**Alternatives**: Traditional SPA + server, Full SSR, Pure static site
**Rationale**: Static shell for instant loading, serverless functions for AI processing, optimal cost/performance
**Impact**: Deployment complexity, but superior performance and infinite scale
**Status**: Implemented

## 2025-08-21: Next.js App Router over Pages Router

**Context**: Need modern React patterns and better developer experience
**Decision**: Use Next.js 14 with App Router
**Alternatives**: Pages Router, Vite + React, Remix
**Rationale**: App Router provides better DX, streaming, layouts, and is the future direction
**Impact**: Learning curve for team, but better long-term maintainability
**Status**: Planned (F003)

## 2025-08-21: Supabase over Auth0/Clerk for Authentication

**Context**: Need user authentication with magic links and database storage
**Decision**: Use Supabase for both authentication and database
**Alternatives**: Auth0 + separate database, Clerk + database, NextAuth + database
**Rationale**: Single vendor, built-in magic links, includes database, simpler integration
**Impact**: Vendor lock-in, but reduced complexity and faster development
**Status**: Implemented (F011)

## 2025-08-22: Supabase over Neon for Database Infrastructure

**Context**: Need PostgreSQL database with PostGIS for geospatial queries, scalable architecture, and integrated BaaS features
**Decision**: Use Supabase as primary database provider over Neon
**Alternatives**: Neon (PostgreSQL specialist), PlanetScale (MySQL), AWS RDS, self-hosted PostgreSQL
**Rationale**: 
- Integrated authentication eliminates vendor sprawl
- Built-in PostGIS support for location-based features
- Real-time subscriptions for collaborative itinerary editing
- Row Level Security for multi-tenant data isolation
- Comprehensive monitoring and backup automation
- Edge functions for serverless compute co-location
- Better pricing model for Cardinal's usage patterns
**Impact**: 
- Single vendor dependency but reduced integration complexity
- Excellent developer experience and faster iteration
- Built-in security and monitoring vs custom implementation
- Automatic scaling without infrastructure management
**Status**: Implemented (F011)

## 2025-08-21: Netlify Edge Functions for AI Orchestration

**Context**: Need real-time streaming responses for AI-generated content
**Decision**: Use Netlify Edge Functions for main AI agent (concierge)
**Alternatives**: Standard Netlify Functions + polling, WebSockets, dedicated server
**Rationale**: 10-minute timeout for complex AI operations, native streaming support, stays within platform
**Impact**: More complex function architecture, but significantly better user experience
**Status**: Implemented (basic structure)

## 2025-08-21: Multi-Agent AI Architecture

**Context**: Complex travel planning requires different types of AI processing
**Decision**: Separate AI agents for research, validation, and generation
**Alternatives**: Single monolithic AI agent, External AI orchestration service
**Rationale**: Specialized prompts perform better, easier testing, modular development
**Impact**: More complex orchestration logic, but better AI quality and maintainability
**Status**: Planned (AI001-AI015)

## 2025-08-21: Zustand over Redux for State Management

**Context**: Need global state management for user session and itinerary data
**Decision**: Use Zustand for global state, React Query for server state
**Alternatives**: Redux Toolkit, Context API only, Valtio
**Rationale**: Lighter bundle, simpler API, no boilerplate, works well with React Query
**Impact**: Less ecosystem tooling, but faster development and smaller bundle
**Status**: Planned (F003)

## 2025-08-21: React Query for Server State

**Context**: Need sophisticated caching and synchronization for API data
**Decision**: Use React Query (TanStack Query) for all server state
**Alternatives**: SWR, Apollo Client, custom fetch hooks
**Rationale**: Best caching strategy, background refetching, optimistic updates, better DX
**Impact**: Additional dependency, but significantly better data fetching experience
**Status**: Planned (F003)

## 2025-08-21: Zod for Runtime Validation

**Context**: Need type safety for API boundaries and AI response validation
**Decision**: Use Zod schemas for all data validation
**Alternatives**: Yup, Joi, TypeScript only, custom validation
**Rationale**: Runtime + compile-time validation, great TypeScript integration, schema reuse
**Impact**: Additional validation layer, but prevents runtime errors and AI hallucination issues
**Status**: Implemented (patterns defined)

## 2025-08-21: Tailwind CSS over CSS-in-JS

**Context**: Need rapid UI development with consistent design system
**Decision**: Use Tailwind CSS for all styling
**Alternatives**: Styled-components, Emotion, CSS Modules, vanilla CSS
**Rationale**: Utility-first enables rapid prototyping, consistent spacing/colors, smaller bundle
**Impact**: Learning curve, HTML verbosity, but faster development and consistent design
**Status**: Planned (F004)

## 2025-08-21: Claude (Anthropic) as Primary LLM

**Context**: Need high-quality AI responses for travel recommendations
**Decision**: Use Claude as primary LLM with OpenAI as fallback
**Alternatives**: OpenAI primary, Google Gemini, self-hosted models
**Rationale**: Better instruction following, longer context window, less hallucination for factual content
**Impact**: API costs, vendor dependency, but higher quality recommendations
**Status**: Planned (F014)

## 2025-08-21: Google Maps/Places for Location Data

**Context**: Need accurate, up-to-date location information and travel times
**Decision**: Use Google Maps and Places APIs as primary data source
**Alternatives**: Mapbox, OpenStreetMap, Foursquare, HERE Maps
**Rationale**: Most comprehensive data, best integration with travel times, familiar to users
**Impact**: API costs, quota limits, but highest data quality and user trust
**Status**: Planned (F013, I001, I002)

## 2025-08-21: Magic Link Authentication Only

**Context**: Need frictionless user onboarding for travel planning use case
**Decision**: Implement only magic link authentication (no passwords)
**Alternatives**: Password + social login, passwordless + social, traditional forms
**Rationale**: Matches use case (email itineraries anyway), reduces friction, more secure
**Impact**: Email delivery dependency, but significantly better UX for target users
**Status**: Planned (C001)

## 2025-08-21: Mobile-First Design Strategy

**Context**: Users will primarily consume itineraries on mobile devices while traveling
**Decision**: Design and develop mobile-first, enhance for desktop
**Alternatives**: Desktop-first, responsive-first, separate mobile app
**Rationale**: Primary use case is mobile consumption, better performance, simpler testing
**Impact**: More design constraints, but better user experience for primary use case
**Status**: Implemented (design system defined)

## 2025-08-21: PDF Export over Native Apps

**Context**: Need way for users to access itineraries offline while traveling
**Decision**: Implement PDF export functionality
**Alternatives**: Native mobile apps, PWA offline, email export, print styles
**Rationale**: Universal compatibility, works offline, familiar format, lower development cost
**Impact**: Limited interactivity, but broad compatibility and lower complexity
**Status**: Planned (C013)

## 2025-08-21: Minimal Data Collection Strategy

**Context**: Need to balance personalization with privacy concerns
**Decision**: Collect only email address, store preferences transiently
**Alternatives**: Full user profiles, social login data, browsing analytics
**Rationale**: Matches privacy expectations, reduces compliance burden, faster onboarding
**Impact**: Limited personalization initially, but builds user trust and simplifies compliance
**Status**: Implemented (architecture designed)

---

## Decision Template

When adding new decisions, use this format:

```markdown
## YYYY-MM-DD: Decision Title

**Context**: Why was this decision needed?
**Decision**: What was decided?
**Alternatives**: What other options were considered?
**Rationale**: Why was this the best choice?
**Impact**: What are the consequences/trade-offs?
**Status**: Planned/In Progress/Implemented/Revisited
```

## Guidelines for Decision Logging

**What to log:**

- Architectural choices (frameworks, libraries, patterns)
- Product strategy decisions (features, user flows, priorities)
- Technical trade-offs (performance vs complexity, cost vs capability)
- External service selections (APIs, vendors, tools)
- Design system decisions (responsive strategy, accessibility approach)

**What NOT to log:**

- Implementation details (covered in code/docs)
- Bug fixes or minor tweaks
- Routine dependency updates
- Personal preference choices with no impact

**When to update:**

- Mark status changes (Planned → Implemented)
- Add **Revisited** entries if decisions are changed
- Reference decision numbers in PRs/commits when relevant
