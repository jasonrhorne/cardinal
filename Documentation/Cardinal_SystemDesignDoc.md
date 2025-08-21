### Travel Itinerary App: System Design Overview

This document outlines the system architecture for a travel itinerary application designed for high-performance, scalability, and maintainability. The system leverages the Jamstack approach on Netlify, with an agentic backend powered by serverless functions and a modern, interactive frontend.

---

### 1. Architecture: Hybrid Jamstack

The application employs a hybrid Jamstack architecture, combining the speed of a pre-rendered static site with the dynamic capabilities of a serverless backend.

* **Frontend (Static):** The public-facing marketing pages and the core application shell are pre-built into static assets (HTML, CSS, JS) at build time. These files are served from Netlify's global CDN, ensuring instant load times.
* **Backend (Dynamic):** All core logic, including the multi-agent orchestration and API calls, is handled by Netlify Functions. These serverless functions are invoked on-demand by the frontend, eliminating the need for a persistent server.

---

### 2. Frontend Technology Stack

The frontend is built for a rich, interactive user experience with a focus on fast iteration.

* **Framework:** **Next.js** (React) - Hybrid rendering (SSG/SSR) for optimal performance
* **Styling:** **Tailwind CSS** - Utility-first CSS for rapid UI development
* **Real-time Communication:** **Server-Sent Events (SSE)** - Streaming AI responses for real-time "typing" experience

---

### 3. Backend Technology Stack

The backend is a decoupled, serverless microservice architecture designed for a complex agentic workflow.

* **Platform:** **Netlify Functions** - Scalable, cost-effective serverless environment
* **Main Function:** **Netlify Edge Function** - Concierge agent with 10min timeout and streaming support
* **Specialized Functions:** **Standard/Background Functions** - Research, validation, and support agents
* **Orchestration:** **LangChain** - Agent communication, tool management, workflow execution

---

### 4. Data and External Services

The application will be a "thin" backend, relying on external services for data and AI models.

* **AI Model:** **Claude API** - Core intelligence for itinerary generation and research
* **Authentication:** **Supabase Auth** - User management with magic link support  
* **Database:** **Supabase PostgreSQL** - User data, itineraries, preferences

---

### 5. Deployment Workflow

The entire system is managed via a Git-based workflow on Netlify.

* **Version Control:** **GitHub**  
* **Continuous Deployment:** Main branch push → automatic Netlify build and deployment
* **Build Process:** Next.js compilation, function bundling, CDN deployment