# Cardinal Travel App: System Design Document

**Document Version:** v1.0  
**Last Updated:** 2025-08-27  
**Status:** Experimentation Phase Architecture

This document outlines the system architecture for Cardinal, a multi-agent AI travel itinerary application designed for high-performance, scalability, and experimentation-driven development. The system leverages a hybrid Jamstack approach on Netlify with a **multi-agent orchestration backend** and modular input method experimentation framework.

---

## 1. System Architecture Overview

### 1.1 Multi-Agent Jamstack Architecture

Cardinal employs a **multi-agent orchestration architecture** built on Jamstack principles, combining static site performance with sophisticated AI agent coordination.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Agent           │    │  External       │
│   (Next.js)     │◄──►│  Orchestration   │◄──►│  Services       │
│                 │    │  (Edge Functions)│    │  (APIs)         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
│                      │                       │
│ • Input Methods      │ • Research Agent      │ • Claude API
│ • User Interface     │ • Curation Agent      │ • Google Maps
│ • Result Display     │ • Validation Agent    │ • Supabase
│ • PDF Export         │ • Response Agent      │ • Places API
│ • Refinements        │ • Orchestrator        │
└─────────────────     └──────────────────     └─────────────────
```

- **Frontend Layer:** Static site with dynamic components for multi-modal input experimentation
- **Agent Orchestration Layer:** Serverless functions coordinating specialized AI agents
- **External Services:** APIs for validation, authentication, and data enrichment

---

## 2. Frontend Architecture

### 2.1 Input Method Experimentation Framework

The frontend implements a **modular input system** to test how input granularity affects AI agent performance:

```typescript
// Registry Pattern for Input Methods
interface RequirementExtractor {
  id: string
  name: string
  description: string
  extractRequirements(userInput: any): Promise<TravelRequirements>
}

// Input Method Registry
const inputMethodRegistry = {
  'constrained-form': new ConstrainedFormExtractor(),
  'guided-prompts': new GuidedPromptsExtractor(),
  conversational: new ConversationalExtractor(),
  hybrid: new HybridExtractor(),
}
```

### 2.2 Technology Stack

- **Framework:** **Next.js 14** (App Router) - Hybrid rendering with dynamic imports
- **State Management:** **Zustand** (global), **React Query** (server state)
- **Styling:** **Tailwind CSS** - Utility-first with design system
- **Real-time:** **Server-Sent Events** - Streaming multi-agent responses
- **Validation:** **Zod** - Runtime type safety throughout
- **A/B Testing:** Custom experimentation framework for input method comparison

---

## 3. Multi-Agent Backend Architecture

### 3.1 Agent Specialization

Each agent is designed for a specific function with optimized prompting and validation:

```typescript
// Agent Architecture
interface Agent {
  id: string
  role: string
  capabilities: string[]
  execute(input: any, context: AgentContext): Promise<AgentResponse>
}

class ResearchAgent implements Agent {
  // Discovers destinations and activities
  // Optimized for comprehensive search and relevance
}

class CurationAgent implements Agent {
  // Crafts detailed itineraries with local insights
  // Optimized for persona-driven storytelling
}

class ValidationAgent implements Agent {
  // Cross-references external APIs and verifies feasibility
  // Optimized for accuracy and real-world validation
}

class ResponseAgent implements Agent {
  // Formats output and handles refinements
  // Optimized for user experience and consistency
}
```

### 3.2 Orchestration Layer

- **Agent Orchestrator:** Coordinates multi-agent workflows with error handling
- **Caching Strategy:** Agent-specific result caching to reduce latency and costs
- **Parallel Execution:** Concurrent agent processing where dependencies allow
- **Fallback Mechanisms:** Graceful degradation if individual agents fail

### 3.3 Technology Stack

- **Platform:** **Netlify Functions** - Edge (orchestration) + Standard (agents)
- **Agent Framework:** Custom orchestration with **Claude API** integration
- **Validation:** External API integration (Google Maps/Places)
- **Caching:** In-memory + persistent caching strategies
- **Error Handling:** Comprehensive agent failure recovery

---

## 4. Data Architecture & External Services

### 4.1 Data Flow

```
User Input → Input Method → Requirements Extraction → Agent Orchestration
     ↓
Research Agent → External APIs (validation) → Curation Agent
     ↓
Validation Agent → Quality Checks → Response Agent → User
```

### 4.2 External Service Integration

- **Primary AI:** **Claude API (Anthropic)** - Multi-agent LLM processing
- **Fallback AI:** **OpenAI API** - Backup LLM for redundancy
- **Authentication:** **Supabase Auth** - Magic link user management
- **Database:** **Supabase PostgreSQL** - User sessions, experiment results, itinerary history
- **Validation APIs:**
  - **Google Maps API** - Distance, routing, place verification
  - **Google Places API** - Business details, hours, ratings
- **Analytics:** Custom experimentation tracking for A/B testing

### 4.3 Caching Strategy

- **Agent Result Caching:** Redis-compatible caching for agent outputs
- **API Response Caching:** Google API results cached with TTL
- **User Session Caching:** Temporary requirement storage during workflows

---

## 5. Experimentation & Testing Framework

### 5.1 Input Method A/B Testing

```typescript
// Experimentation Framework
interface Experiment {
  id: string
  name: string
  variants: ExperimentVariant[]
  metrics: string[]
  startDate: Date
  endDate?: Date
}

// Input Granularity Testing
const inputGranularityExperiment = {
  constrained: ['arts', 'food', 'music', 'outdoors'],
  specific: ['street art', 'fine dining', 'jazz clubs', 'hiking trails'],
}
```

### 5.2 Quality Metrics

- **Agent Performance:** Individual agent success rates and latency
- **Input Method Effectiveness:** Conversion rates by input type
- **User Satisfaction:** Refinement requests, completion rates
- **Technical Metrics:** Error rates, response times, cache hit rates

## 6. Deployment & DevOps

### 6.1 Environment Strategy

- **Development:** Local development with mock agents
- **Staging:** Full agent testing with rate-limited APIs
- **Production:** Multi-agent orchestration with full API access

### 6.2 CI/CD Pipeline

- **Version Control:** **GitHub** with feature branch workflow
- **Automated Testing:** Agent response validation, schema compliance
- **Deployment:** **Netlify** auto-deployment on main branch merge
- **Monitoring:** Agent performance tracking, error alerting

## 7. Security & Privacy

### 7.1 Data Protection

- **Minimal PII:** Email-only storage policy
- **Agent Data:** No persistent storage of user conversations in agents
- **API Security:** Rate limiting, key rotation, request validation
- **Session Management:** Secure token handling via Supabase

### 7.2 AI Safety

- **Content Filtering:** Safety guidelines in agent prompts
- **Validation Layers:** Multi-agent verification of recommendations
- **User Controls:** Refinement and override capabilities
- **Transparency:** Clear attribution of AI-generated content

## 8. Scalability Considerations

### 8.1 Performance Targets

- **Agent Orchestration:** < 20 seconds for full workflow
- **Individual Agents:** < 5 seconds per agent call
- **Concurrent Users:** 100+ simultaneous workflows
- **Experimentation:** Real-time A/B test result collection

### 8.2 Cost Optimization

- **Agent Caching:** Reduce duplicate LLM calls
- **Parallel Processing:** Minimize total workflow time
- **Smart Fallbacks:** Avoid expensive retries
- **Resource Pooling:** Efficient serverless function utilization

---

## 9. Development Phases

### Phase 0: Experimentation (Current)

- Multi-agent foundation architecture
- Input method abstraction and registry
- A/B testing framework implementation
- Agent orchestration proof-of-concept

### Phase 1: MVP Production

- Best-performing input method selection
- Optimized agent coordination
- User authentication and session management
- PDF export and sharing functionality

### Phase 2: Enhanced Intelligence

- RAG integration for city-specific knowledge
- Advanced agent specialization
- Collaborative itinerary features
- Performance optimization

### Phase 3: Advanced Features

- Booking integrations
- Calendar export
- Mobile app considerations
- Enterprise features
