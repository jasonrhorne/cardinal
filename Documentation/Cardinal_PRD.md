## Cardinal Product Requirements Document (PRD)

### Document Info

- **Owner**: Cardinal
- **Doc Status**: Draft v0.3 (MVP + Experimentation Phase)
- **Last Updated**: 2025-08-27

---

## 1) Purpose

Cardinal is a web application that helps people find and select travel destinations for short, long-weekend type trips and, once selected, receive bespoke recommendations and beautiful itineraries (mobile-friendly webpages). It helps people discover points of interest, stories, and restaurants that fit their tastes and interests. Think of it as a cross between the best hotel concierge you've ever had and your friend who knows all of the hot restaurants and places around town. At the end of the day, we want to evoke excitement and anticipation.

---

## 2) Background and Context

AI advances enable creating travel recommendations with more soul than generic web scraping. **Multi-agent AI orchestration** with specialized research, curation, and validation agents working together creates a unique experience for finding the right travel situation. Our experimentation-first approach tests how input method granularity affects AI agent performance.

---

## 3) Product Vision

Cardinal curates itineraries through persona-driven lenses (Photographer's Weekend, Architecture Buff, Food-Forward, Family Explorer), blending human-like taste with data-backed validation.

**Core Concept**: Different perspectives reveal different experiences. A photographer visiting Pittsburgh gets recommendations that would resonate with r/photography, not generic tourist lists.

---

## 4) Target Users and Personas

- **Audience**: People in their 20s, 30s, and 40s who are culturally in tune. Think recommendations akin to NYT Travel, Food & Wine, Lonely Planet, and Thrillist.
- **Willingness to Pay**: Comfortable spending a bit more to feel confident in the experience.
- **Need State**: Aging out of pure word-of-mouth; seeking unique (not necessarily prestigious or fancy) places to travel; have concrete travel requirements.

### Proto-Personas

- **The Tasteful Weekender (Early 30s, couple or duo)**: Wants a high-signal list of neighborhoods, 2–3 great meals, a couple can’t-miss activities, and walkable sequences.
- **The Culture Chaser (Late 20s, friends group)**: Prioritizes vibe, nightlife, and local stories over museums. Wants a flexible plan and shareable format.
- **The Food-Led Family (Late 30s/40s, kids)**: Needs kid-aware plans (nap windows, stroller-friendly), reservations, back-up options, and travel time realism.

---

## 5) Product Scope

### In-Scope (MVP)

- **Magic link authentication**
- **Requirements intake**: origin city; number of adults traveling; number of children traveling (with ages for each); preferred travel methods (drive, rail, air) with maximum travel duration tolerance; interests (arts, architecture, nature and outdoors, music and nightlife, sports and recreation, history, etc.)
- **Destination suggestions**: List of candidate destinations with rationale and 2–3 key highlights each
- **Selected destination itinerary**: A more extensive plan that adapts to user requirements (lodging choice, neighborhoods of interest, constraints)
- **Refinement loop**: Users can request changes (e.g., “we’re staying at X hotel,” “spend more time in Y neighborhood”)
- **Save or print**: PDF export and printer-friendly page(s)
- **Share**: Link sharing for fellow travelers
- **History**: View past itineraries

### Out of Scope (MVP)

- Account profiles beyond email magic link (e.g., social login)
- Direct booking (flights/hotels/restaurants)
- Real-time availability, live traffic updates, or dynamic pricing
- Offline mode

---

## 6) User Journey

1. **Onboard**: Email → magic link → authenticated session
2. **Input Method Selection**: Choose from constrained form, guided prompts, or conversational interface
3. **Requirements**: Capture travel preferences through selected input method (testing granularity effects)
4. **Multi-Agent Processing**: Research agents find destinations → Curation agents craft itineraries → Validation agents verify quality
5. **Destinations**: 3–7 suggestions with rationale, highlights, travel times
6. **Select**: Choose destination, adjust constraints (hotel, neighborhoods)
7. **Generate**: Day-by-day itinerary with meals, activities, reservations, backups
8. **Refine**: Chat-based changes ("more coffee shops," "we booked X hotel")
9. **Save/Share**: PDF export, share links, history access

---

## 7) Functional Requirements

- **FR1 Authentication**: Email-based magic link sign-in; sessions persist; minimal PII stored.
- **FR2 Requirements Intake**: Multiple input methods (form, conversational, hybrid); A/B testing framework; granularity experimentation (constrained vs specific); save partial progress.
- **FR3 Destination Generation**: Generate 3–7 candidates with clear rationale and highlights; show estimated drive/flight time bands.
- **FR4 Itinerary Generation**: Persona-lens curation; day segments; adjacency-aware sequencing; budget and child-friendly tags; justification blurbs.
- **FR5 Refinements**: Chat-like prompts that persist; diff previous vs updated itinerary; support specific changes (hotel, neighborhoods, dietary needs).
- **FR6 Save/Print**: Clean PDF export; printer styles; hide non-essential UI.
- **FR7 Sharing**: Shareable link with read-only view; optional collaborator comments (MVP optional).
- **FR8 History**: List past itineraries; view details; duplicate and modify.
- **FR9 Admin/Debug (internal)**: Log prompt inputs/outputs (PII-safe), flag low-quality results, track feedback.

---

## 8) Content, Tone, and Presentation

- **Tone**: Knowledgeable, friendly, specific, and confident—no generic filler. Include brief context for why each choice is great.
- **Format**: Mobile-first cards and day timelines; sections for neighborhoods; concise map callouts; reservation tips and time windows.
- **Inclusion**: Dietary tags (vegan/vegetarian/gluten-free), accessibility notes, kid-friendly indicators.

---

## 9) Multi-Agent AI Architecture & Validation

- **Multi-Agent Orchestration**: Specialized agents working in coordination rather than single LLM calls
  - **Research Agent**: Discovers destinations and activities matching user requirements
  - **Curation Agent**: Crafts detailed, persona-driven itineraries with local insights
  - **Validation Agent**: Cross-references external APIs, checks feasibility, ensures quality
  - **Response Agent**: Formats final output and handles refinement requests

- **Input Method Experimentation**: Test how input granularity affects agent performance
  - **Constrained inputs** ("arts", "food", "music") vs **Specific inputs** ("street art", "fine dining", "jazz")
  - **Form-based** vs **Conversational** vs **Hybrid guided prompts**
  - A/B testing framework to measure quality differences

- **Validation & Enrichment**: Multi-layer validation through agents and APIs
  - Google Places / Maps: place details, hours, ratings, coordinates
  - Agent cross-validation: Research findings verified by Validation agent
  - Event/arts sources (future): museums/galleries calendars
  - Travel time estimation: driving distance via Maps API; flight-time band heuristics

- **Quality Controls**: Agent-based quality assurance
  - Validation agent performs hallucination checks, hours verification, duplicate detection
  - Curation agent ensures geo-adjacency and temporal feasibility
  - Response agent handles formatting consistency and safety guidelines

- **Prompting Strategy**: Agent-specific prompting with inter-agent communication
  - Each agent optimized for its specialized function
  - Structured data passing between agents
  - Persona encoding distributed across Curation and Response agents

---

## 10) Ranking and Personalization

- **Ranking signals**: Fit to interests and constraints, neighborhood adjacency, diversity of experiences, temporal feasibility, crowd avoidance where possible.
- **Personalization**: Use prior refinements and history to bias future recs; simple scoring before advanced models.

---

## 11) Non-Functional Requirements

- **Performance**: Destination suggestions < 10s; initial itinerary < 20s; refinement iteration < 10s (targets on warm cache).
- **Reliability**: Graceful fallbacks if APIs fail; show transparent loading and retry guidance.
- **Security & Privacy**: Store minimal PII (email only); encrypt at rest and in transit; clear data retention policy.
- **Accessibility**: WCAG AA targets; keyboard navigation; sufficient contrast; semantic HTML; print styles.
- **Mobile-First**: Primary consumption on mobile; ensure cards and day timelines are easily scrollable.

---

## 12) Success Metrics (MVP)

At first, success focuses on itinerary quality and basic engagement.

- **Unique visits**
- **Visits → itinerary conversion** (generated at least one itinerary)
- **Itinerary saved or shared** (PDF export or share link copy)
- **Voluntary support** via a "Buy me a coffee" link (count and $)

Secondary diagnostics (internal):

- Iteration count per itinerary (lower may indicate higher initial fit; very high may indicate confusion)
- Time to first usable itinerary
- Refinement satisfaction quick-poll (thumbs up/down)

---

## 13) Release Plan

- **Phase 0 (Experimentation - Current)**: Multi-agent foundation; input method testing; A/B testing framework; quality comparison analysis
- **Phase 1 (MVP Public)**: Best-performing input method; multi-agent orchestration; magic link auth; destination shortlist; itinerary with PDF/share; Buy-me-a-coffee
- **Phase 2**: RAG memories per city; enhanced agent specialization; collaborator comments; improved ranking
- **Phase 3**: Reservations links, calendar export, lodging integrations; advanced agent capabilities

---

## 14) Dependencies and Integrations

- Email auth provider (magic link)
- LLM provider
- Google Maps/Places (and billing)
- Simple payments/donations (Buy Me a Coffee or equivalent)

---

## 15) Risks and Mitigations

- **Multi-Agent Complexity**: Start simple with basic orchestration; add sophistication incrementally; maintain fallback to single-agent
- **Input Method Selection**: Use experimentation phase to validate best approach; avoid premature optimization; maintain multiple working options
- **Agent Coordination Failures**: Implement robust error handling between agents; graceful degradation; clear agent responsibility boundaries
- **Hallucinations/closures**: Validation agent cross-checks with Places API; user report/flag system; freshness metadata
- **Latency costs**: Cache agent results by city/persona; reuse validated data; parallel agent execution where possible
- **Content trust**: Agent-generated rationale and validation timestamps; transparent source attribution
- **Scope creep**: Focus on experimentation phase completion; defer advanced agent features to later phases

---

## 16) Acceptance Criteria (MVP)

- User can sign in with magic link and access their trip workspace.
- User can enter requirements and receive 3–7 destination suggestions with rationale and highlights.
- User can select a destination and receive a complete, mobile-friendly itinerary that references their constraints.
- User can ask for at least three categories of refinements (lodging, neighborhoods, interests/dietary) and get a revised plan.
- User can export a clean PDF and share a read-only link.
- User can view past itineraries from the same account.

---

## 17) Appendix

- **Glossary**:
  - **POI** (point of interest)
  - **RAG** (retrieval-augmented generation)
  - **Persona Lens** (curation perspective)
  - **Adjacency** (geographic/temporal proximity to reduce backtracking)
  - **Multi-Agent Orchestration** (specialized AI agents working in coordination)
  - **Input Granularity** (spectrum from constrained to specific user inputs)
  - **Agent Registry** (modular system for managing input method experiments)

- **Legal/Disclaimer (MVP)**: Recommendations are AI-generated best-effort suggestions; verify hours, availability, and safety; respect local laws and private property; drive safely.
