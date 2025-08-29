/**
 * Agent Orchestrator
 * Main entry point for the multi-agent system
 * Coordinates all agents to generate travel itineraries
 */

import { ConciergeAgent } from './concierge-agent'
import { FoodDiningAgent } from './food-dining-agent'
import { LodgingAgent } from './lodging-agent'
import { QualityValidatorAgent } from './quality-validator-agent'
import type {
  AgentContext,
  AgentType,
  TaskSpecification,
  ResearchOutput,
  OrchestrationResult,
  PersonaProfile,
  TravelConstraints,
  Itinerary,
  AgentMessage,
  QualityValidation,
  TTravelRequirements,
} from './types'

export class AgentOrchestrator {
  private concierge: ConciergeAgent
  private researchAgents: Map<AgentType, any>
  private qualityValidator: QualityValidatorAgent
  private messages: AgentMessage[] = []

  constructor() {
    // Initialize all agents
    this.concierge = new ConciergeAgent()
    this.qualityValidator = new QualityValidatorAgent()

    // Initialize research agents
    this.researchAgents = new Map<AgentType, any>()
    this.researchAgents.set('lodging', new LodgingAgent())
    this.researchAgents.set('food-dining', new FoodDiningAgent())
    // Additional agents will be added here
  }

  /**
   * Main orchestration method
   * Generates a complete itinerary using the multi-agent system
   */
  async generateItinerary(
    requirements: TTravelRequirements,
    personaProfile?: PersonaProfile,
    constraints?: TravelConstraints
  ): Promise<OrchestrationResult> {
    const startTime = Date.now()

    try {
      // Build context for agents
      const context = this.buildContext(
        requirements,
        personaProfile,
        constraints
      )

      // Log orchestration start
      this.addMessage({
        id: this.generateId(),
        timestamp: new Date(),
        from: 'concierge',
        to: 'broadcast',
        type: 'status',
        payload: { message: 'Starting itinerary generation', context },
      })

      // Phase 1: Concierge analyzes and creates tasks
      const tasks = await this.createResearchTasks(context)

      // Phase 2: Execute research tasks in parallel where possible
      const researchResults = await this.executeResearch(tasks, context)

      // Phase 3: Validate and enrich recommendations
      const validatedResults = await this.validateRecommendations(
        researchResults,
        context
      )

      // Phase 4: Assemble final itinerary
      const itinerary = await this.assembleItinerary(context, validatedResults)

      const totalTime = Date.now() - startTime

      return {
        success: true,
        itinerary,
        rawResearch: researchResults,
        validationReport: validatedResults.validations,
        conversationLog: this.messages,
        totalExecutionTime: totalTime,
        costs: {
          llmTokens: this.estimateTokenUsage(),
          apiCalls: validatedResults.validations.length,
          estimatedCost: this.estimateCost(),
        },
      }
    } catch (error) {
      console.error('Orchestration failed:', error)

      return {
        success: false,
        totalExecutionTime: Date.now() - startTime,
        conversationLog: this.messages,
      }
    }
  }

  /**
   * Build context object for agents
   */
  private buildContext(
    requirements: TTravelRequirements,
    personaProfile?: PersonaProfile,
    constraints?: TravelConstraints
  ): AgentContext {
    // Determine persona from requirements if not provided
    const persona = personaProfile || this.inferPersona(requirements)

    // Extract constraints from requirements
    const travelConstraints =
      constraints || this.extractConstraints(requirements)

    return {
      userRequirements: requirements,
      destinationCity: (requirements as any).destination || 'Pittsburgh, PA',
      personaProfile: persona,
      constraints: travelConstraints,
      previousFindings: new Map(),
    }
  }

  /**
   * Infer persona profile from requirements
   */
  private inferPersona(requirements: TTravelRequirements): PersonaProfile {
    const interests = requirements.interests || []
    const hasKids = (requirements.numberOfChildren || 0) > 0

    // Determine primary persona based on interests
    let primary: PersonaProfile['primary'] = 'balanced'

    if (hasKids) {
      primary = 'family'
    } else if (interests.includes('arts') as any) {
      primary = 'photographer'
    } else if (interests.includes('food-dining')) {
      primary = 'foodie'
    } else if (
      interests.includes('nature-outdoors') ||
      interests.includes('sports-recreation')
    ) {
      primary = 'adventurer'
    } else if (
      interests.includes('history') ||
      interests.includes('culture-local-experiences')
    ) {
      primary = 'culture'
    }

    const personaProfile: PersonaProfile = {
      primary,
      interests:
        interests.length > 0 ? interests : ['exploration', 'local experiences'],
      travelStyle:
        (requirements as any).budget === 'luxury'
          ? 'luxury'
          : (requirements as any).budget === 'budget'
            ? 'budget'
            : 'balanced',
      activityLevel:
        (requirements as any).pace === 'packed'
          ? 'packed'
          : (requirements as any).pace === 'relaxed'
            ? 'relaxed'
            : 'moderate',
    }

    if (hasKids) {
      personaProfile.specialContext = `Traveling with ${requirements.numberOfChildren} children`
    }

    return personaProfile
  }

  /**
   * Extract travel constraints from requirements
   */
  private extractConstraints(
    requirements: TTravelRequirements
  ): TravelConstraints {
    const constraints: TravelConstraints = {}

    if ((requirements as any).budget) {
      constraints.budget = (requirements as any).budget
    }

    if (
      (requirements as any).accessibility &&
      (requirements as any).accessibility.length > 0
    ) {
      constraints.accessibility = (requirements as any).accessibility
    }

    if (
      (requirements as any).dietary &&
      (requirements as any).dietary.length > 0
    ) {
      constraints.dietary = (requirements as any).dietary
    }

    return constraints
  }

  /**
   * Create research tasks using the Concierge agent
   */
  private async createResearchTasks(
    context: AgentContext
  ): Promise<TaskSpecification[]> {
    await this.concierge.execute(
      {
        taskId: 'initial-analysis',
        agentType: 'concierge',
        priority: 'high',
        description: 'Analyze requirements and create research tasks',
        constraints: [],
        expectedOutput: 'List of research tasks',
      },
      context
    )

    // Extract tasks from concierge response
    // For now, create default tasks
    return [
      {
        taskId: `task_${Date.now()}_lodging`,
        agentType: 'lodging',
        priority: 'high',
        description: `Find unique lodging options in ${context.destinationCity} for a ${context.personaProfile.primary} traveler`,
        constraints: [
          `Budget: ${context.constraints.budget || 'moderate'}`,
          `Style: ${context.personaProfile.travelStyle}`,
        ],
        expectedOutput: '3-5 lodging recommendations',
      },
      {
        taskId: `task_${Date.now()}_dining`,
        agentType: 'food-dining',
        priority: 'high',
        description: `Discover exceptional dining experiences in ${context.destinationCity}`,
        constraints: context.constraints.dietary || [],
        expectedOutput: '6-8 restaurant and food recommendations',
      },
    ]
  }

  /**
   * Execute research tasks using specialized agents
   */
  private async executeResearch(
    tasks: TaskSpecification[],
    context: AgentContext
  ): Promise<Map<AgentType, ResearchOutput>> {
    const results = new Map<AgentType, ResearchOutput>()

    // Execute tasks in parallel where possible
    const promises = tasks.map(async task => {
      const agent = this.researchAgents.get(task.agentType)

      if (!agent) {
        console.warn(`No agent found for type: ${task.agentType}`)
        return null
      }

      try {
        const response = await agent.execute(task, context)

        if (response.status === 'success' || response.status === 'partial') {
          results.set(task.agentType, response.data)

          // Update context with findings
          context.previousFindings.set(task.agentType, response.data)
        }

        return response
      } catch (error) {
        console.error(`Agent ${task.agentType} failed:`, error)
        return null
      }
    })

    await Promise.all(promises)

    return results
  }

  /**
   * Validate recommendations using the Quality Validator agent
   */
  private async validateRecommendations(
    researchResults: Map<AgentType, ResearchOutput>,
    context: AgentContext
  ): Promise<{
    validated: Map<AgentType, ResearchOutput>
    validations: QualityValidation[]
  }> {
    // Update context with research results
    context.previousFindings = researchResults

    const validatorResponse = await this.qualityValidator.execute(
      {
        taskId: 'validate-all',
        agentType: 'quality-validator',
        priority: 'high',
        description: 'Validate all recommendations',
        constraints: [],
        expectedOutput: 'Validation results',
      },
      context
    )

    const validations = validatorResponse.data || []

    // Merge validation results back into research outputs
    const validated = new Map(researchResults)

    validations.forEach(validation => {
      if (validation.enrichedData) {
        // Find and update the original recommendation
        validated.forEach(output => {
          if (output.recommendations) {
            output.recommendations = output.recommendations.map(rec => {
              if (rec.name === validation.originalRecommendation.name) {
                return { ...rec, ...validation.enrichedData }
              }
              return rec
            })
          }
        })
      }
    })

    return { validated, validations }
  }

  /**
   * Assemble final itinerary from validated results
   */
  private async assembleItinerary(
    context: AgentContext,
    validatedResults: {
      validated: Map<AgentType, ResearchOutput>
      validations: QualityValidation[]
    }
  ): Promise<Itinerary> {
    // Update context with validated results
    context.previousFindings = validatedResults.validated

    // Use concierge to assemble final itinerary
    const assemblyTask: TaskSpecification = {
      taskId: 'final-assembly',
      agentType: 'concierge',
      priority: 'high',
      description: 'Assemble final itinerary from validated recommendations',
      constraints: [],
      expectedOutput: 'Complete itinerary',
    }

    const conciergeResponse = await this.concierge.execute(
      assemblyTask,
      context
    )

    if (
      conciergeResponse.status === 'success' &&
      conciergeResponse.data?.itinerary
    ) {
      return conciergeResponse.data.itinerary
    }

    // Fallback: Create basic itinerary structure
    return this.createFallbackItinerary(context, validatedResults.validated)
  }

  /**
   * Create a fallback itinerary if assembly fails
   */
  private createFallbackItinerary(
    context: AgentContext,
    results: Map<AgentType, ResearchOutput>
  ): Itinerary {
    const lodging = results.get('lodging')?.recommendations || []
    const dining = results.get('food-dining')?.recommendations || []

    return {
      destination: context.destinationCity,
      duration: context.userRequirements.duration || '3 days',
      days: [
        {
          day: 1,
          theme: 'Arrival and Exploration',
          activities: [],
          meals: dining.slice(0, 3),
        },
        {
          day: 2,
          theme: 'Full Day Adventures',
          activities: [],
          meals: dining.slice(3, 6),
        },
        {
          day: 3,
          theme: 'Final Discoveries',
          activities: [],
          meals: dining.slice(6, 9),
        },
      ],
      lodging: lodging.slice(0, 2),
      personaNotes: `Curated for a ${context.personaProfile.primary} traveler`,
    }
  }

  /**
   * Add message to conversation log
   */
  private addMessage(message: AgentMessage): void {
    this.messages.push(message)
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Estimate token usage (mock implementation)
   */
  private estimateTokenUsage(): number {
    // Rough estimate: 500 tokens per agent call
    return this.messages.length * 500
  }

  /**
   * Estimate cost (mock implementation)
   */
  private estimateCost(): number {
    // Rough estimate based on token usage
    const tokens = this.estimateTokenUsage()
    const costPer1kTokens = 0.003 // Haiku pricing
    return Math.round((tokens / 1000) * costPer1kTokens * 100) / 100
  }
}

// Export singleton instance
export const orchestrator = new AgentOrchestrator()
