/**
 * LangChain Integration for Cardinal Travel App
 * Unified exports for LangChain configuration, chains, and agents
 */

// Configuration and setup
export {
  LangChainManager,
  langChain,
  type TLangChainConfig,
  type LangChainError,
  type LangChainErrorType,
} from './config'

// Prompts and templates
export {
  promptTemplates,
  validateDestinationInput,
  validateItineraryInput,
  addPersonaToPrompt,
  type TDestinationSuggestionInput,
  type TItineraryGenerationInput,
  destinationSuggestionInputSchema,
  itineraryGenerationInputSchema,
} from './prompts'

// Chains for specific operations
export {
  TravelChains,
  travelChains,
  type TDestinationSuggestionOutput,
  type TItineraryOutput,
  destinationSuggestionOutputSchema,
  itineraryOutputSchema,
} from './chains'

// Agent orchestration
export {
  AgentOrchestrator,
  DestinationExpertAgent,
  ItineraryPlannerAgent,
  LocalExpertAgent,
  RefinementSpecialistAgent,
  agentOrchestrator,
  type TAgentType,
  type TAgentContext,
  type TAgentResult,
  agentTypeSchema,
  agentContextSchema,
  agentResultSchema,
} from './agents'

// Convenience functions for common operations
export async function suggestDestinations(
  input: {
    origin: string
    duration: number
    travelers?: number
    interests: string[]
    budget?: string
    pace?: 'relaxed' | 'moderate' | 'active'
    persona?: string
  },
  provider?: 'anthropic' | 'openai'
): Promise<string> {
  const { travelChains } = await import('./chains')
  const validInput = {
    ...input,
    travelers: input.travelers ?? 2,
    pace: input.pace ?? ('moderate' as const),
  }
  return travelChains.suggestDestinations(validInput, provider)
}

export async function generateItinerary(
  input: {
    destination: string
    duration: number
    travelers?: number
    interests: string[]
    budget?: string
    pace?: 'relaxed' | 'moderate' | 'active'
    persona?: string
    accommodationPreference?: string
    transportationMode?: 'walking' | 'public' | 'rideshare' | 'rental' | 'mixed'
  },
  provider?: 'anthropic' | 'openai'
): Promise<string> {
  const { travelChains } = await import('./chains')
  const validInput = {
    ...input,
    travelers: input.travelers ?? 2,
    pace: input.pace ?? ('moderate' as const),
    transportationMode: input.transportationMode ?? ('mixed' as const),
  }
  return travelChains.generateItinerary(validInput, provider)
}

export async function refineItinerary(
  originalItinerary: string,
  userFeedback: string,
  context: {
    destination: string
    duration: number
    travelers: number
    interests: string[]
    budget?: string
  },
  provider?: 'anthropic' | 'openai'
): Promise<string> {
  const { travelChains } = await import('./chains')
  return travelChains.refineItinerary(
    originalItinerary,
    userFeedback,
    context,
    provider
  )
}

export async function chatWithTravelExpert(
  message: string,
  context?: string,
  provider?: 'anthropic' | 'openai'
): Promise<string> {
  const { travelChains } = await import('./chains')
  return travelChains.chatWithTravelExpert(message, context, provider)
}

// Agent execution helpers
export async function executeDestinationExpert(
  input: {
    origin: string
    duration: number
    travelers?: number
    interests: string[]
    budget?: string
    pace?: 'relaxed' | 'moderate' | 'active'
    persona?: string
  },
  sessionId: string,
  userId?: string,
  provider?: 'anthropic' | 'openai'
) {
  const { agentOrchestrator } = await import('./agents')
  const context = agentOrchestrator.createContext(sessionId, userId)
  return agentOrchestrator.executeAgent(
    'destination_expert',
    input,
    context,
    provider
  )
}

export async function executeItineraryPlanner(
  input: {
    destination: string
    duration: number
    travelers?: number
    interests: string[]
    budget?: string
    pace?: 'relaxed' | 'moderate' | 'active'
    persona?: string
    accommodationPreference?: string
    transportationMode?: 'walking' | 'public' | 'rideshare' | 'rental' | 'mixed'
  },
  sessionId: string,
  userId?: string,
  provider?: 'anthropic' | 'openai'
) {
  const { agentOrchestrator } = await import('./agents')
  const context = agentOrchestrator.createContext(sessionId, userId)
  return agentOrchestrator.executeAgent(
    'itinerary_planner',
    input,
    context,
    provider
  )
}

// Status and configuration helpers
export function getAvailableLangChainProviders(): string[] {
  const { langChain } = require('./config')
  return langChain.getAvailableProviders()
}

export function getLangChainConfig() {
  const { langChain } = require('./config')
  return langChain.getConfig()
}

export function isLangChainReady(): boolean {
  const { langChain } = require('./config')
  return langChain.getAvailableProviders().length > 0
}
