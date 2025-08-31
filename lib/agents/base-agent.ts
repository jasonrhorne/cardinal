/**
 * Base Agent Class
 * Abstract base class for all agents in the Cardinal system
 */

import { Anthropic } from '@anthropic-ai/sdk'

import { getServerEnv } from '@/lib/config/env'

import { getMetricsCollector } from './performance-collector'
import type {
  AgentConfig,
  AgentContext,
  AgentMessage,
  AgentResponse,
  AgentType,
  TaskSpecification,
} from './types'

export abstract class BaseAgent {
  protected config: AgentConfig
  protected anthropic: Anthropic
  protected context?: AgentContext
  protected messages: AgentMessage[] = []

  constructor(config: AgentConfig) {
    this.config = config
    this.anthropic = new Anthropic({
      apiKey:
        getServerEnv().ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || '',
    })
  }

  // Abstract methods that each agent must implement
  abstract execute(
    task: TaskSpecification,
    context: AgentContext
  ): Promise<AgentResponse>

  abstract buildPrompt(task: TaskSpecification, context: AgentContext): string

  // Get agent type
  getType(): AgentType {
    return this.config.type
  }

  // Get agent name
  getName(): string {
    return this.config.name
  }

  // Update context
  updateContext(context: AgentContext): void {
    this.context = context
  }

  // Add message to history
  addMessage(message: AgentMessage): void {
    this.messages.push(message)
  }

  // Get message history
  getMessages(): AgentMessage[] {
    return this.messages
  }

  // Call LLM with prompt and track performance metrics
  protected async callLLM(
    prompt: string,
    systemPrompt?: string
  ): Promise<string> {
    const startTime = Date.now()
    const requestId = `${this.config.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      const response = await this.anthropic.messages.create({
        model: this.config.model || 'claude-3-haiku-20240307',
        max_tokens: this.config.maxTokens || 2000,
        temperature: this.config.temperature || 0.7,
        system: systemPrompt || this.getSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const executionTime = Date.now() - startTime

      // Track successful LLM call metrics
      const tokenUsage = response.usage
        ? {
            prompt: response.usage.input_tokens,
            completion: response.usage.output_tokens,
            total: response.usage.input_tokens + response.usage.output_tokens,
          }
        : undefined

      await this.trackPerformanceMetrics({
        executionTime,
        success: true,
        tokenUsage: tokenUsage || undefined,
        requestId,
        confidence: 0.8, // Base confidence for successful LLM calls
      })

      const content = response.content[0]
      if (content && content.type === 'text') {
        return content.text
      }

      throw new Error('Unexpected response type from LLM')
    } catch (error) {
      const executionTime = Date.now() - startTime

      // Track failed LLM call metrics
      await this.trackPerformanceMetrics({
        executionTime,
        success: false,
        tokenUsage: undefined,
        requestId,
        confidence: 0.0,
      })

      console.error(`LLM call failed for ${this.config.name}:`, error)
      throw error
    }
  }

  // Parse JSON response from LLM
  protected parseJSONResponse<T>(response: string): T {
    try {
      // Handle markdown code blocks
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/)
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1])
      }

      // Try direct parse
      return JSON.parse(response)
    } catch (error) {
      console.error(
        `Failed to parse JSON response from ${this.config.name}:`,
        error
      )
      console.error('Raw response:', response)
      throw new Error(`Invalid JSON response from ${this.config.name}`)
    }
  }

  // Get system prompt for the agent
  protected getSystemPrompt(): string {
    return `You are ${this.config.name}, a specialized AI agent in the Cardinal travel planning system.
${this.config.description}

Your responses should be detailed, accurate, and tailored to the user's specific needs and preferences.
Always consider the persona profile and travel constraints when making recommendations.
Be creative but realistic, and prioritize quality over quantity in your suggestions.`
  }

  // Execute with timeout
  protected async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs?: number
  ): Promise<T> {
    const timeout = timeoutMs || this.config.timeout || 30000

    return Promise.race([
      operation(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Operation timed out after ${timeout}ms`)),
          timeout
        )
      ),
    ])
  }

  // Retry logic for resilience
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxAttempts?: number
  ): Promise<T> {
    const attempts = maxAttempts || this.config.retryAttempts || 3
    let lastError: Error | undefined

    for (let i = 0; i < attempts; i++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        console.warn(`Attempt ${i + 1} failed for ${this.config.name}:`, error)

        if (i < attempts - 1) {
          // Exponential backoff
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, i) * 1000)
          )
        }
      }
    }

    throw lastError || new Error(`Operation failed after ${attempts} attempts`)
  }

  // Build a partial/fallback response
  protected buildFallbackResponse<T>(
    data: Partial<T>,
    reason: string
  ): AgentResponse<T> {
    return {
      agentType: this.config.type,
      status: 'fallback',
      data: data as T,
      confidence: 0.3,
      executionTime: 0,
      fallbackReason: reason,
      suggestions: [
        'Try with different parameters',
        'Provide more specific requirements',
        'Check back later for better results',
      ],
    }
  }

  // Build error response
  protected buildErrorResponse(error: Error): AgentResponse {
    return {
      agentType: this.config.type,
      status: 'failed',
      data: null,
      confidence: 0,
      executionTime: 0,
      fallbackReason: error.message,
      missingComponents: ['Failed to generate recommendations'],
    }
  }

  // Format persona context for prompts
  protected formatPersonaContext(context: AgentContext): string {
    const { personaProfile, constraints } = context

    let personaContext = `Travel Persona: ${personaProfile.primary}\n`
    personaContext += `Interests: ${personaProfile.interests.join(', ')}\n`
    personaContext += `Travel Style: ${personaProfile.travelStyle}\n`
    personaContext += `Activity Level: ${personaProfile.activityLevel}\n`

    if (personaProfile.specialContext) {
      personaContext += `Special Considerations: ${personaProfile.specialContext}\n`
    }

    if (constraints.budget) {
      personaContext += `Budget: ${constraints.budget}\n`
    }

    if (constraints.accessibility?.length) {
      personaContext += `Accessibility Needs: ${constraints.accessibility.join(', ')}\n`
    }

    if (constraints.dietary?.length) {
      personaContext += `Dietary Restrictions: ${constraints.dietary.join(', ')}\n`
    }

    return personaContext
  }

  // Log agent activity
  protected log(message: string, data?: any): void {
    console.log(`[${this.config.name}] ${message}`, data || '')
  }

  // Track performance metrics for agent operations
  protected async trackPerformanceMetrics({
    executionTime,
    success,
    tokenUsage,
    requestId,
    confidence,
    tasksCompleted = 1,
    sessionId,
  }: {
    executionTime: number
    success: boolean
    tokenUsage?:
      | { prompt: number; completion: number; total: number }
      | undefined
    requestId: string
    confidence: number
    tasksCompleted?: number
    sessionId?: string
  }): Promise<void> {
    try {
      const collector = getMetricsCollector()
      const metrics = collector.createMetrics({
        agentType: this.config.type,
        executionTime,
        confidence,
        success,
        tokenUsage,
        requestId,
        sessionId: sessionId || 'default',
        tasksCompleted,
      })

      await collector.collectMetrics(metrics)
    } catch (error) {
      // Don't let metrics collection errors break agent operations
      console.warn(`Failed to collect metrics for ${this.config.name}:`, error)
    }
  }

  // Get performance report for this agent type
  async getPerformanceReport(days: number = 7) {
    try {
      const collector = getMetricsCollector()
      return await collector.generateReport(this.config.type, days)
    } catch (error) {
      console.warn(
        `Failed to generate performance report for ${this.config.name}:`,
        error
      )
      return null
    }
  }

  // Get performance benchmark for this agent type
  async getPerformanceBenchmark(
    period: 'hour' | 'day' | 'week' | 'month' = 'day'
  ) {
    try {
      const collector = getMetricsCollector()
      return await collector.getBenchmark(this.config.type, period)
    } catch (error) {
      console.warn(
        `Failed to get performance benchmark for ${this.config.name}:`,
        error
      )
      return null
    }
  }
}
