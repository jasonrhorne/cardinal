/**
 * LangChain Agent Orchestration
 * Multi-agent system for complex travel planning workflows
 */

// Remove unused imports - BaseMessage, HumanMessage, SystemMessage not needed yet
import { z } from 'zod'

import { travelChains } from './chains'
import { langChain } from './config'
import type {
  TDestinationSuggestionInput,
  TItineraryGenerationInput,
} from './prompts'

// Agent types and their specializations
export const agentTypeSchema = z.enum([
  'destination_expert',
  'itinerary_planner',
  'local_expert',
  'budget_optimizer',
  'logistics_coordinator',
  'refinement_specialist',
])

export type TAgentType = z.infer<typeof agentTypeSchema>

// Agent execution context
export const agentContextSchema = z.object({
  sessionId: z.string(),
  userId: z.string().optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'agent']),
        content: z.string(),
        agentType: agentTypeSchema.optional(),
        timestamp: z.string(),
      })
    )
    .default([]),
  travelerProfile: z
    .object({
      travelers: z.number().positive().default(2),
      interests: z.array(z.string()).default([]),
      budget: z.string().optional(),
      pace: z.enum(['relaxed', 'moderate', 'active']).default('moderate'),
      preferences: z.record(z.string(), z.any()).optional(),
    })
    .optional(),
})

export type TAgentContext = z.infer<typeof agentContextSchema>

// Agent execution result
export const agentResultSchema = z.object({
  agentType: agentTypeSchema,
  success: z.boolean(),
  content: z.string(),
  metadata: z
    .object({
      provider: z.string().optional(),
      tokens: z
        .object({
          input: z.number().optional(),
          output: z.number().optional(),
          total: z.number().optional(),
        })
        .optional(),
      cost: z.number().optional(),
      executionTime: z.number().optional(),
    })
    .optional(),
  nextSuggestedAgent: agentTypeSchema.optional(),
  error: z.string().optional(),
})

export type TAgentResult = z.infer<typeof agentResultSchema>

// Individual agent classes
export class DestinationExpertAgent {
  constructor(private chains = travelChains) {}

  async execute(
    input: TDestinationSuggestionInput,
    _context: TAgentContext,
    provider?: 'anthropic' | 'openai'
  ): Promise<TAgentResult> {
    const startTime = Date.now()

    try {
      const result = await this.chains.suggestDestinations(input, provider)

      return {
        agentType: 'destination_expert',
        success: true,
        content: result,
        metadata: {
          provider: provider || 'auto',
          executionTime: Date.now() - startTime,
        },
        nextSuggestedAgent: 'itinerary_planner',
      }
    } catch (error) {
      return {
        agentType: 'destination_expert',
        success: false,
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          executionTime: Date.now() - startTime,
        },
      }
    }
  }
}

export class ItineraryPlannerAgent {
  constructor(private chains = travelChains) {}

  async execute(
    input: TItineraryGenerationInput,
    _context: TAgentContext,
    provider?: 'anthropic' | 'openai'
  ): Promise<TAgentResult> {
    const startTime = Date.now()

    try {
      const result = await this.chains.generateItinerary(input, provider)

      return {
        agentType: 'itinerary_planner',
        success: true,
        content: result,
        metadata: {
          provider: provider || 'auto',
          executionTime: Date.now() - startTime,
        },
        nextSuggestedAgent: 'local_expert',
      }
    } catch (error) {
      return {
        agentType: 'itinerary_planner',
        success: false,
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          executionTime: Date.now() - startTime,
        },
      }
    }
  }
}

export class LocalExpertAgent {
  constructor(private chains = travelChains) {}

  async execute(
    query: string,
    destination: string,
    _context: TAgentContext,
    provider?: 'anthropic' | 'openai'
  ): Promise<TAgentResult> {
    const startTime = Date.now()

    try {
      const contextualQuery = `As a local expert for ${destination}, please provide detailed insights about: ${query}`
      const result = await this.chains.chatWithTravelExpert(
        contextualQuery,
        `Local expert specializing in ${destination}`,
        provider
      )

      return {
        agentType: 'local_expert',
        success: true,
        content: result,
        metadata: {
          provider: provider || 'auto',
          executionTime: Date.now() - startTime,
        },
        nextSuggestedAgent: 'refinement_specialist',
      }
    } catch (error) {
      return {
        agentType: 'local_expert',
        success: false,
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          executionTime: Date.now() - startTime,
        },
      }
    }
  }
}

export class RefinementSpecialistAgent {
  constructor(private chains = travelChains) {}

  async execute(
    originalItinerary: string,
    userFeedback: string,
    context: {
      destination: string
      duration: number
      travelers: number
      interests: string[]
      budget?: string
    },
    _agentContext: TAgentContext,
    provider?: 'anthropic' | 'openai'
  ): Promise<TAgentResult> {
    const startTime = Date.now()

    try {
      const result = await this.chains.refineItinerary(
        originalItinerary,
        userFeedback,
        context,
        provider
      )

      return {
        agentType: 'refinement_specialist',
        success: true,
        content: result,
        metadata: {
          provider: provider || 'auto',
          executionTime: Date.now() - startTime,
        },
      }
    } catch (error) {
      return {
        agentType: 'refinement_specialist',
        success: false,
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          executionTime: Date.now() - startTime,
        },
      }
    }
  }
}

// Agent orchestrator for coordinating multiple agents
export class AgentOrchestrator {
  private destinationExpert = new DestinationExpertAgent()
  private itineraryPlanner = new ItineraryPlannerAgent()
  private localExpert = new LocalExpertAgent()
  private refinementSpecialist = new RefinementSpecialistAgent()

  constructor(private langChainManager = langChain) {}

  // Execute a single agent
  async executeAgent(
    agentType: TAgentType,
    input: any,
    context: TAgentContext,
    provider?: 'anthropic' | 'openai'
  ): Promise<TAgentResult> {
    switch (agentType) {
      case 'destination_expert':
        return this.destinationExpert.execute(input, context, provider)

      case 'itinerary_planner':
        return this.itineraryPlanner.execute(input, context, provider)

      case 'local_expert':
        if (typeof input === 'object' && input.query && input.destination) {
          return this.localExpert.execute(
            input.query,
            input.destination,
            context,
            provider
          )
        }
        throw new Error('Local expert requires query and destination')

      case 'refinement_specialist':
        if (
          typeof input === 'object' &&
          input.originalItinerary &&
          input.userFeedback &&
          input.context
        ) {
          return this.refinementSpecialist.execute(
            input.originalItinerary,
            input.userFeedback,
            input.context,
            context,
            provider
          )
        }
        throw new Error(
          'Refinement specialist requires originalItinerary, userFeedback, and context'
        )

      default:
        throw new Error(`Unsupported agent type: ${agentType}`)
    }
  }

  // Execute a workflow of multiple agents
  async executeWorkflow(
    workflow: Array<{
      agentType: TAgentType
      input: any
      provider?: 'anthropic' | 'openai'
    }>,
    context: TAgentContext
  ): Promise<TAgentResult[]> {
    const results: TAgentResult[] = []

    for (const step of workflow) {
      try {
        const result = await this.executeAgent(
          step.agentType,
          step.input,
          context,
          step.provider
        )

        results.push(result)

        // Update context with result
        context.conversationHistory.push({
          role: 'agent',
          content: result.content,
          agentType: step.agentType,
          timestamp: new Date().toISOString(),
        })

        // Stop workflow if an agent fails
        if (!result.success) {
          break
        }
      } catch (error) {
        results.push({
          agentType: step.agentType,
          success: false,
          content: '',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        break
      }
    }

    return results
  }

  // Smart agent selection based on user input
  async suggestNextAgent(
    userInput: string,
    _context: TAgentContext,
    currentAgent?: TAgentType
  ): Promise<TAgentType> {
    // Simple rule-based agent selection (can be enhanced with ML in the future)
    const input = userInput.toLowerCase()

    if (
      input.includes('destination') ||
      input.includes('where to go') ||
      input.includes('suggest places')
    ) {
      return 'destination_expert'
    }

    if (
      input.includes('itinerary') ||
      input.includes('plan') ||
      input.includes('schedule')
    ) {
      return 'itinerary_planner'
    }

    if (
      input.includes('local') ||
      input.includes('insider') ||
      input.includes('hidden gems')
    ) {
      return 'local_expert'
    }

    if (
      input.includes('change') ||
      input.includes('modify') ||
      input.includes('different')
    ) {
      return 'refinement_specialist'
    }

    // Default progression
    if (!currentAgent) {
      return 'destination_expert'
    }
    if (currentAgent === 'destination_expert') {
      return 'itinerary_planner'
    }
    if (currentAgent === 'itinerary_planner') {
      return 'local_expert'
    }

    return 'refinement_specialist'
  }

  // Get available providers
  getAvailableProviders(): string[] {
    return this.langChainManager.getAvailableProviders()
  }

  // Create a new agent context
  createContext(sessionId: string, userId?: string): TAgentContext {
    return agentContextSchema.parse({
      sessionId,
      userId,
      conversationHistory: [],
    })
  }

  // Validate agent context
  validateContext(context: any): TAgentContext {
    return agentContextSchema.parse(context)
  }
}

// Default agent orchestrator instance
export const agentOrchestrator = new AgentOrchestrator()
