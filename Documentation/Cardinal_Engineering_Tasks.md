# Cardinal Engineering Task List

## Document Info

- **Owner**: Cardinal Engineering Team
- **Document Status**: Draft v0.7 - Foundation Phase Complete, Experimentation Phase 89% Complete
- **Last Updated**: 2025-08-29
- **Total Tasks**: 102 (added Experimentation Phase)
- **Estimated Total Effort**: 1,318 story points (~7-9 months for 2-3 engineers)

---

## Task Tracking

### Foundation & Setup Phase

| ✓   | ID   | Task Name                                        | Domain   | Priority | Effort (SP) | Dependencies | Status | Assignee | Due Date   |
| --- | ---- | ------------------------------------------------ | -------- | -------- | ----------- | ------------ | ------ | -------- | ---------- |
| ✓   | F001 | Project Repository Setup                         | DevOps   | P0       | 2           | None         | DONE   | -        | 2025-08-21 |
| ✓   | F002 | Netlify Project Configuration                    | DevOps   | P0       | 3           | F001         | DONE   | -        | 2025-08-21 |
| ✓   | F003 | Next.js Project Scaffolding                      | Frontend | P0       | 5           | F001         | DONE   | -        | 2025-08-21 |
| ✓   | F004 | Tailwind CSS Configuration                       | Frontend | P0       | 2           | F003         | DONE   | -        | 2025-08-21 |
| ✓   | F005 | TypeScript Configuration                         | Frontend | P0       | 2           | F003         | DONE   | -        | 2025-08-21 |
| ✓   | F006 | ESLint & Prettier Setup                          | Frontend | P0       | 2           | F003         | DONE   | -        | 2025-08-21 |
| ✓   | F007 | Testing Framework Setup (Jest + Testing Library) | Testing  | P0       | 4           | F003         | DONE   | -        | 2025-08-21 |
| ✓   | F008 | CI/CD Pipeline Setup                             | DevOps   | P0       | 3           | F002, F007   | DONE   | -        | 2025-08-21 |
| ✓   | F009 | Environment Configuration Management             | DevOps   | P0       | 2           | F002         | DONE   | -        | 2025-08-21 |
| ✓   | F010 | Database Schema Design                           | Database | P0       | 5           | None         | DONE   | -        | 2025-08-22 |
| ✓   | F011 | Supabase/Neon Database Setup                     | Database | P0       | 3           | F010         | DONE   | -        | 2025-08-22 |
| ✓   | F012 | Supabase Authentication Setup (Magic Links)      | Backend  | P0       | 3           | F011         | DONE   | -        | 2025-08-22 |
| ✓   | F013 | Google Maps API Setup & Billing                  | API      | P0       | 3           | None         | DONE   | -        | 2025-08-23 |
| ✓   | F014 | LLM Provider Setup (Anthropic/OpenAI)            | Backend  | P0       | 3           | None         | DONE   | -        | 2025-08-24 |
| ✓   | F015 | LangChain Integration Setup                      | Backend  | P0       | 4           | F014         | DONE   | -        | 2025-08-24 |
| ✓   | F016 | Netlify Functions Scaffolding                    | Backend  | P0       | 3           | F002         | DONE   | -        | 2025-08-24 |
| ✓   | F017 | Error Handling & Logging Infrastructure          | Backend  | P0       | 4           | F016         | DONE   | -        | 2025-08-25 |
| ✓   | F018 | Security Headers & CSP Configuration             | DevOps   | P0       | 2           | F002         | DONE   | -        | 2025-08-25 |
| ✓   | F019 | Performance Monitoring Setup                     | DevOps   | P0       | 3           | F002         | DONE   | Claude   | 2025-08-25 |
| ✓   | F020 | Accessibility Foundation (WCAG AA)               | Frontend | P0       | 4           | F003         | DONE   | Claude   | 2025-08-26 |
| ✓   | F021 | Authentication Middleware Enhancement            | Backend  | P1       | 2           | F012         | DONE   | Claude   | 2025-08-26 |
| ✓   | F022 | Authentication Unit Tests                        | Testing  | P1       | 3           | F012, F007   | DONE   | Claude   | 2025-08-26 |
| ✓   | F023 | User Profile Management System                   | Backend  | P1       | 3           | F012         | DONE   | Claude   | 2025-08-26 |
| ✓   | F024 | Authentication Flow Debugging & Production Fixes | Backend  | P0       | 5           | F012, F021   | DONE   | Claude   | 2025-08-26 |

### Core Features Phase

| ✓   | ID   | Task Name                                   | Domain   | Priority | Effort (SP) | Dependencies | Status | Assignee | Due Date   |
| --- | ---- | ------------------------------------------- | -------- | -------- | ----------- | ------------ | ------ | -------- | ---------- |
| ☐   | C001 | Magic Link Authentication Flow              | Backend  | P0       | 8           | F012, F016   | TODO   | -        | -          |
| ☐   | C002 | User Session Management                     | Backend  | P0       | 5           | C001         | TODO   | -        | -          |
| ✓   | C003 | Travel Requirements Intake Form             | Frontend | P0       | 8           | F003, F004   | DONE   | Claude   | 2025-08-27 |
| ☐   | C004 | Input Method Validation & State Management  | Frontend | P0       | 6           | E002         | TODO   | -        | -          |
| ☐   | C005 | Universal Requirements Data Model & Storage | Database | P0       | 5           | F010, E001   | TODO   | -        | -          |
| ☐   | C006 | AI Destination Generation Engine            | Backend  | P0       | 12          | E008, F014   | TODO   | -        | -          |
| ☐   | C007 | Destination Suggestion UI                   | Frontend | P0       | 6           | C006         | TODO   | -        | -          |
| ☐   | C008 | Itinerary Generation Engine                 | Backend  | P0       | 15          | C006, F015   | TODO   | -        | -          |
| ☐   | C009 | Itinerary Display UI (Mobile-First)         | Frontend | P0       | 10          | C008         | TODO   | -        | -          |
| ☐   | C010 | Chat-Based Refinement Interface             | Frontend | P1       | 8           | C009, E005   | TODO   | -        | -          |
| ☐   | C011 | Refinement Processing Engine                | Backend  | P0       | 10          | C008, C010   | TODO   | -        | -          |
| ☐   | C012 | Itinerary Version History                   | Database | P0       | 6           | C008         | TODO   | -        | -          |
| ☐   | C013 | PDF Export Functionality                    | Frontend | P0       | 8           | C009         | TODO   | -        | -          |
| ☐   | C014 | Share Link Generation                       | Backend  | P0       | 4           | C008         | TODO   | -        | -          |
| ☐   | C015 | Past Itineraries View                       | Frontend | P0       | 6           | C012         | TODO   | -        | -          |
| ☐   | C016 | User Preferences Storage                    | Database | P0       | 4           | C005         | TODO   | -        | -          |
| ☐   | C017 | Mobile Responsiveness & Touch Optimization  | Frontend | P0       | 8           | C003, C009   | TODO   | -        | -          |
| ☐   | C018 | Loading States & Progress Indicators        | Frontend | P0       | 4           | C006, C008   | TODO   | -        | -          |
| ☐   | C019 | Error Boundaries & User Feedback            | Frontend | P0       | 5           | C003, C009   | TODO   | -        | -          |
| ☐   | C020 | Input Method Progress Persistence           | Frontend | P1       | 4           | E002, C004   | TODO   | -        | -          |

### Experimentation & Learning Phase

| ✓   | ID   | Task Name                            | Domain   | Priority | Effort (SP) | Dependencies | Status | Assignee | Due Date   |
| --- | ---- | ------------------------------------ | -------- | -------- | ----------- | ------------ | ------ | -------- | ---------- |
| ✓   | E001 | Input Method Abstraction Layer       | Backend  | P0       | 4           | C003         | DONE   | Claude   | 2025-08-27 |
| ✓   | E002 | Registry Pattern for Input Methods   | Backend  | P0       | 3           | E001         | DONE   | Claude   | 2025-08-27 |
| ✓   | E003 | Open Text Input Method               | Frontend | P0       | 6           | E002         | DONE   | Claude   | 2025-08-28 |
| ✓   | E004 | Guided Hybrid Input Method           | Frontend | P0       | 8           | E002         | DONE   | Claude   | 2025-08-27 |
| ✓   | E005 | Conversational Chat Input Method     | Frontend | P0       | 10          | E002         | DONE   | Claude   | 2025-08-28 |
| ✓   | E006 | Input Method Comparison UI           | Frontend | P0       | 5           | E002         | DONE   | Claude   | 2025-08-27 |
| ✓   | E007 | Experiment Tracking & Analytics      | Backend  | P0       | 6           | E001         | DONE   | Claude   | 2025-08-29 |
| ✓   | E008 | Multi-Agent Orchestration Foundation | Backend  | P0       | 12          | F015, E001   | DONE   | Claude   | 2025-08-29 |
| ☐   | E009 | Agent Performance Metrics System     | Backend  | P1       | 5           | E008         | TODO   | -        | -          |

### Integrations Phase

| ✓   | ID   | Task Name                              | Domain  | Priority | Effort (SP) | Dependencies | Status | Assignee | Due Date |
| --- | ---- | -------------------------------------- | ------- | -------- | ----------- | ------------ | ------ | -------- | -------- |
| ☐   | I001 | Google Places API Integration          | API     | P0       | 8           | F013, E008   | TODO   | -        | -        |
| ☐   | I002 | Google Maps Integration (Travel Times) | API     | P0       | 6           | F013, C006   | TODO   | -        | -        |
| ☐   | I003 | Place Data Validation & Enrichment     | Backend | P0       | 8           | I001, I002   | TODO   | -        | -        |
| ☐   | I004 | Geographic Adjacency Logic             | Backend | P0       | 6           | I003         | TODO   | -        | -        |
| ☐   | I005 | Travel Time Estimation Engine          | Backend | P0       | 8           | I002, I004   | TODO   | -        | -        |
| ☐   | I006 | Seasonal & Event Awareness             | Backend | P1       | 6           | C006         | TODO   | -        | -        |
| ☐   | I007 | Accessibility & Kid-Friendly Tagging   | Backend | P1       | 4           | I003         | TODO   | -        | -        |
| ☐   | I008 | Dietary Restriction Support            | Backend | P1       | 4           | I003         | TODO   | -        | -        |
| ☐   | I009 | Budget Range Support                   | Backend | P1       | 3           | C006         | TODO   | -        | -        |
| ☐   | I010 | Neighborhood & Area Classification     | Backend | P1       | 6           | I003, I004   | TODO   | -        | -        |
| ☐   | I011 | Real-Time Availability Checking        | API     | P2       | 8           | I001         | TODO   | -        | -        |
| ☐   | I012 | Weather Integration                    | API     | P2       | 4           | C006         | TODO   | -        | -        |
| ☐   | I013 | Local Event & Festival Integration     | API     | P2       | 6           | I006         | TODO   | -        | -        |
| ☐   | I014 | Transportation Options Integration     | API     | P2       | 8           | I002         | TODO   | -        | -        |
| ☐   | I015 | Currency & Pricing Integration         | API     | P2       | 4           | I009         | TODO   | -        | -        |

### AI & Intelligence Phase

| ✓   | ID    | Task Name                            | Domain  | Priority | Effort (SP) | Dependencies | Status | Assignee | Due Date |
| --- | ----- | ------------------------------------ | ------- | -------- | ----------- | ------------ | ------ | -------- | -------- |
| ☐   | AI001 | Persona-Based Prompt Engineering     | Backend | P1       | 8           | E008         | TODO   | -        | -        |
| ☐   | AI002 | Structured Output Schema Design      | Backend | P1       | 6           | E008         | TODO   | -        | -        |
| ☐   | AI003 | Multi-Agent Orchestration            | Backend | P1       | 12          | E008         | TODO   | -        | -        |
| ☐   | AI004 | Hallucination Detection & Prevention | Backend | P0       | 8           | AI003, I003  | TODO   | -        | -        |
| ☐   | AI005 | Response Quality Validation          | Backend | P0       | 6           | AI004        | TODO   | -        | -        |
| ☐   | AI006 | Context Window Management            | Backend | P0       | 5           | AI003        | TODO   | -        | -        |
| ☐   | AI007 | Prompt Template Management           | Backend | P0       | 4           | AI001        | TODO   | -        | -        |
| ☐   | AI008 | AI Response Caching                  | Backend | P1       | 6           | AI003        | TODO   | -        | -        |
| ☐   | AI009 | A/B Testing Framework for Prompts    | Backend | P1       | 8           | AI007        | TODO   | -        | -        |
| ☐   | AI010 | Response Personalization Engine      | Backend | P1       | 8           | AI003, C016  | TODO   | -        | -        |
| ☐   | AI011 | Feedback Loop & Learning System      | Backend | P2       | 10          | AI005        | TODO   | -        | -        |
| ☐   | AI012 | RAG Implementation (Phase 2)         | Backend | P2       | 15          | AI003        | TODO   | -        | -        |
| ☐   | AI013 | Embedding Generation & Storage       | Backend | P2       | 8           | AI012        | TODO   | -        | -        |
| ☐   | AI014 | Semantic Search Implementation       | Backend | P2       | 10          | AI013        | TODO   | -        | -        |
| ☐   | AI015 | Multi-Modal AI Integration           | Backend | P3       | 12          | AI003        | TODO   | -        | -        |

### Polish & Optimization Phase

| ✓   | ID   | Task Name                                | Domain   | Priority | Effort (SP) | Dependencies | Status | Assignee | Due Date |
| --- | ---- | ---------------------------------------- | -------- | -------- | ----------- | ------------ | ------ | -------- | -------- |
| ☐   | P001 | Performance Optimization (Bundle Size)   | Frontend | P1       | 6           | C003, C009   | TODO   | -        | -        |
| ☐   | P002 | Image Optimization & Lazy Loading        | Frontend | P1       | 4           | C009         | TODO   | -        | -        |
| ☐   | P003 | SEO Optimization                         | Frontend | P1       | 4           | F003         | TODO   | -        | -        |
| ☐   | P004 | PWA Features (Offline Support)           | Frontend | P2       | 8           | C003, C009   | TODO   | -        | -        |
| ☐   | P005 | Advanced Animations & Micro-interactions | Frontend | P2       | 6           | C003, C009   | TODO   | -        | -        |
| ☐   | P006 | Voice Search & Accessibility             | Frontend | P2       | 8           | C003, C009   | TODO   | -        | -        |
| ☐   | P007 | Internationalization (i18n)              | Frontend | P2       | 10          | C003, C009   | TODO   | -        | -        |
| ☐   | P008 | Dark Mode Support                        | Frontend | P2       | 4           | F004         | TODO   | -        | -        |
| ☐   | P009 | Advanced Print Styles                    | Frontend | P1       | 3           | C013         | TODO   | -        | -        |
| ☐   | P010 | Social Media Sharing Optimization        | Frontend | P1       | 3           | C014         | TODO   | -        | -        |
| ☐   | P011 | Analytics & User Behavior Tracking       | Backend  | P1       | 6           | C003, C009   | TODO   | -        | -        |
| ☐   | P012 | Performance Monitoring & Alerting        | DevOps   | P1       | 4           | F019         | TODO   | -        | -        |
| ☐   | P013 | Security Audit & Penetration Testing     | DevOps   | P1       | 8           | F018         | TODO   | -        | -        |
| ☐   | P014 | Load Testing & Scalability Validation    | DevOps   | P1       | 6           | C006, C008   | TODO   | -        | -        |
| ☐   | P015 | Backup & Disaster Recovery               | DevOps   | P2       | 4           | F011         | TODO   | -        | -        |
| ☐   | P016 | Documentation & API Reference            | DevOps   | P1       | 6           | C001, C006   | TODO   | -        | -        |
| ☐   | P017 | Code Quality Metrics & Coverage          | DevOps   | P1       | 4           | F007         | TODO   | -        | -        |
| ☐   | P018 | Dependency Vulnerability Scanning        | DevOps   | P1       | 3           | F001         | TODO   | -        | -        |
| ☐   | P019 | Environment Parity & Local Development   | DevOps   | P1       | 4           | F009         | TODO   | -        | -        |
| ☐   | P020 | Monitoring & Observability               | DevOps   | P1       | 6           | F019         | TODO   | -        | -        |
| ☐   | P021 | Email Template Customization (Supabase)  | UX       | P2       | 1           | F012         | TODO   | -        | -        |

---

## Task Details by Phase

### Foundation & Setup Phase (Tasks F001-F022)

**Objective**: Establish the technical foundation and development environment
**Timeline**: 4-6 weeks
**Dependencies**: None
**Key Deliverables**:

- Working development environment
- Basic project structure
- Authentication service
- Database setup
- CI/CD pipeline

**Critical Path**: F001 → F002 → F003 → F016 → F012 → F014 → F015

### Core Features Phase (Tasks C001-C020)

**Objective**: Implement core user-facing functionality and data models
**Timeline**: 6-8 weeks  
**Dependencies**: Foundation Phase
**Key Deliverables**:

- User authentication flow
- Travel requirements form (✅ Complete)
- Universal data models
- Basic UI components
- Core system architecture

**Critical Path**: C001 → C003 → C005 → C006 → C007

### Experimentation & Learning Phase (Tasks E001-E009) - 67% COMPLETE

**Objective**: Research and develop multi-agent AI system with input method experimentation
**Timeline**: 4-6 weeks
**Dependencies**: Core Features Phase (C003)
**Key Deliverables**:

- ✅ Multi-input method system (structured form, open text, guided hybrid, conversational chat) - COMPLETE
- ✅ Registry pattern for extensible input methods - COMPLETE
- ✅ Input method abstraction layer - COMPLETE
- ✅ Tab-based comparison UI for input methods - COMPLETE
- ☐ Multi-agent orchestration foundation - IN PROGRESS
- ☐ Agent performance metrics and experiment tracking - PENDING

**Critical Path**: E001 → E002 → E008 → E003/E004/E005 → E007

**Status**: Major milestone achieved! All input methods implemented and ready for user testing. Next focus: Multi-agent orchestration (E008) and experiment tracking (E007).

**Learning Goals**:

- Which input methods produce highest quality AI agent results?
- How does input specificity affect agent reasoning and performance?
- What multi-agent coordination patterns work best for travel recommendations?

### Integrations Phase (Tasks I001-I015)

**Objective**: Connect external services and APIs to multi-agent system
**Timeline**: 6-8 weeks
**Dependencies**: Experimentation Phase (E008)
**Key Deliverables**:

- Google Places/Maps integration with multi-agent research
- Travel time calculations
- Geographic logic
- Data validation and enrichment

**Critical Path**: I001 → I002 → I003 → I004 → I005

### AI & Intelligence Phase (Tasks AI001-AI015)

**Objective**: Advanced AI capabilities and optimization  
**Timeline**: 4-6 weeks
**Dependencies**: Experimentation Phase (E008)
**Key Deliverables**:

- Advanced persona-based prompting (building on E008 foundation)
- Production-ready multi-agent orchestration
- Hallucination detection and quality validation
- Response caching and optimization
- Personalization and learning systems

**Critical Path**: AI001 → AI002 → AI004 → AI005 → AI008

**Note**: Core multi-agent orchestration happens in E008; this phase focuses on production readiness and advanced features.

### Polish & Optimization Phase (Tasks P001-P020)

**Objective**: Performance, security, and user experience improvements
**Timeline**: 4-6 weeks
**Dependencies**: All previous phases
**Key Deliverables**:

- Performance optimization
- Security hardening
- Accessibility improvements
- Monitoring and analytics

---

## Technical Decisions Required

### Frontend

- **State Management**: Redux Toolkit vs Zustand vs React Context
- **Form Library**: React Hook Form vs Formik vs Final Form
- **PDF Generation**: jsPDF vs React-PDF vs Puppeteer
- **Testing Strategy**: Component testing vs E2E vs Visual regression

### Backend

- **Function Architecture**: Monolithic vs Microservices vs Event-driven
- **Caching Strategy**: Redis vs In-memory vs CDN
- **Error Handling**: Centralized vs Distributed vs Circuit breaker
- **Monitoring**: CloudWatch vs DataDog vs Custom solution

### Database

- **Primary Database**: Supabase vs Neon vs PlanetScale
- **Caching Layer**: Upstash vs Redis Cloud vs In-memory
- **Migration Strategy**: Schema-first vs Code-first vs Hybrid
- **Backup Strategy**: Automated vs Manual vs Point-in-time

### AI/ML

- **LLM Provider**: Gemini vs OpenAI vs Anthropic vs Self-hosted
- **Prompt Management**: LangChain vs Custom vs Hybrid
- **Vector Database**: Pinecone vs Weaviate vs Qdrant
- **Model Fine-tuning**: LoRA vs QLoRA vs Full fine-tuning

---

## Risk Assessment

### High Risk (P0)

- **AI Model Performance**: LLM response quality and consistency
- **API Rate Limits**: Google Places/Maps API quotas
- **Authentication Security**: Magic link security and session management
- **Performance**: Response times for AI-generated content

### Medium Risk (P1)

- **Data Quality**: Place information accuracy and freshness
- **Scalability**: Function execution limits and costs
- **User Experience**: Complex AI interaction flows
- **Integration Complexity**: Multiple external API dependencies

### Low Risk (P2)

- **Browser Compatibility**: Modern browser support requirements
- **Mobile Performance**: Progressive Web App capabilities
- **Accessibility**: WCAG compliance and screen reader support
- **Internationalization**: Multi-language support

---

## Success Criteria

### Phase 0 (Internal Prototype)

- [ ] Basic authentication working
- [ ] Simple form submission
- [ ] AI destination generation (any city)
- [ ] Basic itinerary display
- [ ] Share link functionality

### Phase 1 (MVP Public)

- [ ] Full user journey working
- [ ] AI model performance validated
- [ ] Core features stable
- [ ] Basic analytics tracking
- [ ] Performance targets met

### Phase 2 (Enhanced)

- [ ] RAG implementation working
- [ ] Improved AI quality
- [ ] Advanced personalization
- [ ] Performance optimization complete

### Phase 3 (Production Ready)

- [ ] Security audit passed
- [ ] Load testing completed
- [ ] Monitoring and alerting active
- [ ] Documentation complete
- [ ] Deployment automation working

---

## Resource Requirements

### Team Composition

- **Frontend Engineer**: React/Next.js, TypeScript, Tailwind CSS
- **Backend Engineer**: Node.js, Netlify Functions, LangChain
- **DevOps Engineer**: Netlify, CI/CD, Monitoring
- **AI/ML Engineer**: LLM integration, Prompt engineering, RAG

### Infrastructure Costs (Monthly)

- **Netlify**: $19-99 (depending on usage)
- **Database**: $25-100 (Supabase/Neon)
- **Authentication**: $25-99 (Auth0/Clerk)
- **Google APIs**: $200-500 (Places/Maps usage)
- **LLM API**: $100-500 (depending on volume)
- **Monitoring**: $50-200 (DataDog/CloudWatch)

### Development Timeline (Updated v0.5)

- **Foundation**: 4-6 weeks ✅
- **Core Features**: 6-8 weeks (partial - C003 complete)
- **🆕 Experimentation & Learning**: 4-6 weeks
- **Integrations**: 6-8 weeks
- **AI Intelligence**: 4-6 weeks
- **Polish & Optimization**: 4-6 weeks
- **Total**: 28-40 weeks (7-10 months)

---

## Next Steps (Updated for Experimentation Phase - 67% Complete)

1. **Immediate (Current Focus)**
   - ✅ C003: Travel Requirements Intake Form completed
   - ✅ E001-E002: Input method abstraction layer completed
   - ✅ E003-E006: All input methods implemented and UI complete
   - **Next**: E008 (Multi-agent orchestration foundation) + E007 (experiment tracking)

2. **Short Term (Next 2-3 weeks)**
   - Complete E008: Multi-agent orchestration foundation - **PRIORITY**
   - Implement E007: Experiment tracking framework
   - Begin user testing of input methods to gather data
   - Start C004-C005: Data models informed by experimentation results

3. **Medium Term (Month 3-4)**
   - Analyze input method effectiveness and user preferences
   - Complete core features informed by experimentation results
   - Begin integrations with winning input methods and agent patterns
   - Transition from research to production implementation

4. **Long Term (Month 5-10)**
   - Production-ready multi-agent system
   - External API integrations
   - Advanced AI features and optimization
   - Security audit and production deployment

**Key Change**: Experimentation phase front-loads learning about input methods and multi-agent coordination, informing all subsequent development phases.

---

## New Authentication Enhancement Tasks (Added 2025-08-22)

### **F021: Authentication Middleware Enhancement**

- **Description**: Re-enable and improve server-side authentication middleware with proper Supabase session detection
- **Deliverables**:
  - Update middleware to detect Supabase sessions from localStorage/cookies
  - Implement proper server-side session validation
  - Restore route protection without interfering with client-side auth
- **Priority**: P1 (after core features)

### **F022: Supabase Email Template Customization**

- **Description**: Customize magic link email templates in Supabase dashboard for better brand experience
- **Deliverables**:
  - Custom email templates with Cardinal branding
  - Improved email content and styling
  - Multi-language email support (future)
- **Priority**: P2 (nice to have)

### **F023: User Profile Management System**

- **Description**: Implement complete user profile system beyond basic authentication
- **Deliverables**:
  - User profile creation and editing
  - Profile data storage and validation
  - Integration with UserProfileProvider (currently placeholder)
- **Priority**: P1 (needed for personalization)

### **F024: Authentication Unit Tests**

- **Description**: Comprehensive testing suite for authentication system
- **Deliverables**:
  - Unit tests for auth utilities and hooks
  - Integration tests for magic link flow
  - E2E tests for complete authentication journey
- **Priority**: P1 (critical for reliability)

---

_This document should be updated weekly during development to reflect progress, blockers, and any scope changes._
