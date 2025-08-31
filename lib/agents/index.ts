/**
 * Cardinal Multi-Agent System
 * Export main orchestrator and types
 */

export { orchestrator, AgentOrchestrator } from './orchestrator'
export { BaseAgent } from './base-agent'
export { ConciergeAgent } from './concierge-agent'
export { LodgingAgent } from './lodging-agent'
export { FoodDiningAgent } from './food-dining-agent'
export { QualityValidatorAgent } from './quality-validator-agent'

// Export test utilities for development
export {
  testOrchestration,
  testAllPersonas,
  quickTest,
  pittsburghTestCases,
} from './test-orchestration'

// E008 & E009 Test exports
export { testOrchestration as testE008Orchestration } from './test-e008-orchestration'
export { testE009PerformanceMetrics } from './test-e009-performance-metrics'

// E009: Performance Metrics System
export {
  AgentPerformanceCollector,
  MemoryMetricsStorage,
  getMetricsCollector,
} from './performance-collector'
export type {
  AgentPerformanceMetrics,
  AgentBenchmark,
  PerformanceAlert,
  AgentPerformanceReport,
  MetricsCollectionConfig,
  MetricsStorage,
} from './performance-metrics'

// Export all types
export type {
  AgentType,
  AgentStatus,
  PersonaProfile,
  TravelConstraints,
  AgentContext,
  TaskSpecification,
  ResearchOutput,
  Recommendation,
  OperatingHours,
  QualityValidation,
  AgentMessage,
  Itinerary,
  ItineraryDay,
  ItineraryActivity,
  TransportationInfo,
  AgentResponse,
  AgentConfig,
  OrchestrationResult,
} from './types'
