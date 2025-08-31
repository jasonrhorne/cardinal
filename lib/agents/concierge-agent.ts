/**
 * Concierge Agent
 * The orchestrator of the multi-agent system, responsible for:
 * - Empathetic user communication
 * - Task distribution to research agents
 * - Quality coordination
 * - Final itinerary assembly
 */

import { BaseAgent } from './base-agent'
import type {
  AgentConfig,
  AgentContext,
  AgentResponse,
  TaskSpecification,
  ResearchOutput,
  Itinerary,
  OrchestrationResult,
  AgentType,
} from './types'

export class ConciergeAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      type: 'concierge',
      name: 'Cardinal Concierge',
      description:
        'Expert travel orchestrator who coordinates specialized agents to craft personalized itineraries',
      model: 'claude-3-sonnet-20240229',
      temperature: 0.7,
      maxTokens: 4000,
      timeout: 60000, // 1 minute total
    }
    super(config)
  }

  async execute(
    _task: TaskSpecification,
    context: AgentContext
  ): Promise<AgentResponse<OrchestrationResult>> {
    const startTime = Date.now()

    try {
      this.log('Starting orchestration for:', context.destinationCity)

      // Step 1: Analyze requirements and create research tasks
      const researchTasks = await this.createResearchTasks(context)
      this.log(`Created ${researchTasks.length} research tasks`)

      // Step 2: Distribute tasks to research agents (simulated for now)
      const researchResults = await this.executeResearchTasks(
        researchTasks,
        context
      )
      this.log('Research phase complete')

      // Step 3: Quality validation will be added later
      // For now, we'll use research results directly

      // Step 4: Assemble final itinerary
      const itinerary = await this.assembleItinerary(context, researchResults)
      this.log('Itinerary assembly complete')

      const executionTime = Date.now() - startTime

      return {
        agentType: this.config.type,
        status: 'success',
        data: {
          success: true,
          itinerary,
          rawResearch: researchResults,
          totalExecutionTime: executionTime,
        },
        confidence: this.calculateConfidence(researchResults),
        executionTime,
      }
    } catch (error) {
      this.log('Orchestration failed:', error)
      return this.buildErrorResponse(error as Error)
    }
  }

  buildPrompt(_task: TaskSpecification, context: AgentContext): string {
    const personaContext = this.formatPersonaContext(context)

    return `You are the Cardinal Concierge, orchestrating a personalized travel itinerary.

${personaContext}

Destination: ${context.destinationCity}
Duration: ${context.userRequirements.duration || '3 days'}

Based on the traveler's profile and preferences, create a detailed task list for research agents.
Each task should be specific and actionable, focusing on finding unique, authentic experiences.

Consider:
1. The traveler's primary persona (${context.personaProfile.primary})
2. Their specific interests (${context.personaProfile.interests.join(', ')})
3. Travel constraints and special needs
4. The destination's unique characteristics

Return a JSON array of tasks with this structure:
[
  {
    "agentType": "lodging" | "food-dining" | "arts-architecture" | etc.,
    "priority": "high" | "medium" | "low",
    "description": "Specific research task",
    "constraints": ["specific requirements"],
    "expectedOutput": "What the agent should return"
  }
]`
  }

  private async createResearchTasks(
    context: AgentContext
  ): Promise<TaskSpecification[]> {
    const prompt = this.buildPrompt(
      {
        taskId: 'orchestrate',
        agentType: 'concierge',
        priority: 'high',
        description: 'Create research tasks',
        constraints: [],
        expectedOutput: 'Task list for research agents',
      },
      context
    )

    const response = await this.callLLM(prompt)
    const tasks = this.parseJSONResponse<TaskSpecification[]>(response)

    // Add unique IDs to each task
    return tasks.map((task, index) => ({
      ...task,
      taskId: `task_${Date.now()}_${index}`,
    }))
  }

  private async executeResearchTasks(
    tasks: TaskSpecification[],
    context: AgentContext
  ): Promise<Map<AgentType, ResearchOutput>> {
    const results = new Map<AgentType, ResearchOutput>()

    // Import research agents dynamically to avoid circular dependencies
    const { LodgingAgent } = await import('./lodging-agent')
    const { FoodDiningAgent } = await import('./food-dining-agent')

    // Create agent instances as needed
    const agents = new Map<AgentType, any>()
    agents.set('lodging', new LodgingAgent())
    agents.set('food-dining', new FoodDiningAgent())

    // Execute tasks in parallel where possible, sequentially for dependencies
    const taskPromises = tasks.map(async task => {
      try {
        this.log(`Executing task for ${task.agentType}: ${task.description}`)

        const agent = agents.get(task.agentType)
        if (!agent) {
          // Fall back to simulation for agents we don't have yet
          this.log(`No agent found for ${task.agentType}, using simulation`)
          const mockResult = await this.simulateResearchAgent(task, context)
          results.set(task.agentType, mockResult)
          return
        }

        // Execute with real agent
        const agentResponse = await agent.execute(task, context)

        if (agentResponse.status === 'success' && agentResponse.data) {
          const researchOutput: ResearchOutput = {
            agentType: task.agentType,
            status: 'success',
            recommendations: agentResponse.data.recommendations || [],
            confidence: agentResponse.confidence || 0.7,
            reasoning:
              agentResponse.data.reasoning || 'Research completed successfully',
          }
          results.set(task.agentType, researchOutput)
        } else {
          // Handle agent failure - fall back to simulation
          this.log(`Agent ${task.agentType} failed, falling back to simulation`)
          const mockResult = await this.simulateResearchAgent(task, context)
          results.set(task.agentType, mockResult)
        }
      } catch (error) {
        this.log(`Error executing task for ${task.agentType}:`, error)
        // Fall back to simulation on error
        const mockResult = await this.simulateResearchAgent(task, context)
        results.set(task.agentType, mockResult)
      }
    })

    // Wait for all tasks to complete
    await Promise.all(taskPromises)

    return results
  }

  private async simulateResearchAgent(
    task: TaskSpecification,
    context: AgentContext
  ): Promise<ResearchOutput> {
    const prompt = `You are a ${task.agentType} specialist researching for a trip to ${context.destinationCity}.

Task: ${task.description}
Constraints: ${task.constraints.join(', ')}

${this.formatPersonaContext(context)}

Provide 3-5 specific, high-quality recommendations that match the traveler's profile.
Each recommendation should include:
- Name and description
- Why it's perfect for this traveler
- Practical details (location, timing, cost)

Return JSON matching this structure:
{
  "recommendations": [
    {
      "name": "Place/Activity Name",
      "category": "Category",
      "description": "Detailed description",
      "whyRecommended": "Why this matches the traveler",
      "personaFit": 85,
      "address": "Full address",
      "neighborhood": "Neighborhood name",
      "estimatedTime": "2-3 hours",
      "bestTimeToVisit": "Morning/Afternoon/Evening",
      "priceRange": "$-$$$$"
    }
  ],
  "confidence": 0.85,
  "reasoning": "Explanation of choices"
}`

    const response = await this.callLLM(prompt)
    const parsed = this.parseJSONResponse<any>(response)

    return {
      agentType: task.agentType,
      status: 'success',
      recommendations: parsed.recommendations || [],
      confidence: parsed.confidence || 0.7,
      reasoning: parsed.reasoning || 'Recommendations based on persona profile',
    }
  }

  private async assembleItinerary(
    context: AgentContext,
    research: Map<AgentType, ResearchOutput>
  ): Promise<Itinerary> {
    const prompt = `You are assembling a final itinerary from research results.

Destination: ${context.destinationCity}
Duration: ${context.userRequirements.duration || '3 days'}
${this.formatPersonaContext(context)}

Research Results:
${JSON.stringify(Array.from(research.values()), null, 2)}

Create a cohesive, day-by-day itinerary that:
1. Flows naturally with logical geographic and temporal progression
2. Balances different types of activities
3. Respects the traveler's pace preference (${context.personaProfile.activityLevel})
4. Includes specific recommendations from the research
5. Provides practical timing and logistics

Return JSON matching this structure:
{
  "destination": "${context.destinationCity}",
  "duration": "3 days",
  "days": [
    {
      "day": 1,
      "theme": "Day theme",
      "activities": [
        {
          "time": "9:00 AM",
          "activity": { ...recommendation object },
          "duration": "2 hours",
          "transitTime": "15 minutes",
          "transitMode": "walk"
        }
      ],
      "meals": [ ...meal recommendations ],
      "notes": "Day-specific tips"
    }
  ],
  "lodging": [ ...lodging recommendations ],
  "personaNotes": "Overall trip notes for this persona"
}`

    const response = await this.callLLM(prompt)
    const itinerary = this.parseJSONResponse<Itinerary>(response)

    // Ensure all required fields are present
    return {
      destination: itinerary.destination || context.destinationCity,
      duration: itinerary.duration || '3 days',
      days: itinerary.days || [],
      lodging: itinerary.lodging || [],
      personaNotes:
        itinerary.personaNotes || 'Enjoy your personalized journey!',
    }
  }

  private calculateConfidence(
    research: Map<AgentType, ResearchOutput>
  ): number {
    const confidences = Array.from(research.values()).map(r => r.confidence)
    if (confidences.length === 0) {
      return 0.5
    }

    const average =
      confidences.reduce((sum, c) => sum + c, 0) / confidences.length
    return Math.round(average * 100) / 100
  }
}
