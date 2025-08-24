/**
 * LLM Provider Abstraction Layer
 * Unified interface for Claude (primary) and OpenAI (fallback)
 */

import { z } from 'zod'

import { AnthropicClient, ClaudeError } from './anthropic'
import { OpenAIClient, OpenAIError } from './openai'

// Unified request schema
export const llmRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
  maxTokens: z.number().positive().max(4096).default(2000),
  temperature: z.number().min(0).max(1).default(0.7),
  systemPrompt: z.string().optional(),
})

export type TLLMRequest = z.infer<typeof llmRequestSchema>

// Unified response schema
export const llmResponseSchema = z.object({
  content: z.string(),
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
    totalTokens: z.number(),
  }),
  provider: z.enum(['anthropic', 'openai']),
  model: z.string(),
  estimatedCost: z.number(),
})

export type TLLMResponse = z.infer<typeof llmResponseSchema>

// Provider preference
export type LLMProvider = 'anthropic' | 'openai' | 'auto'

// Error types
export type LLMErrorType =
  | 'authentication'
  | 'rate_limit'
  | 'quota_exceeded'
  | 'invalid_request'
  | 'server_error'
  | 'provider_unavailable'
  | 'unknown'

export interface LLMError extends Error {
  type: LLMErrorType
  provider?: LLMProvider
  statusCode?: number
  details?: any
}

export class LLMManager {
  private anthropicClient: AnthropicClient | null = null
  private openAIClient: OpenAIClient | null = null
  // private preferredProvider: LLMProvider = 'auto' // Not actively used but kept for future enhancements
  private retryAttempts = 2
  private fallbackEnabled = true

  constructor() {
    this.initializeClients()
  }

  private initializeClients() {
    try {
      if (process.env.ANTHROPIC_API_KEY) {
        this.anthropicClient = new AnthropicClient()
      }
    } catch (error) {
      console.warn('Failed to initialize Anthropic client:', error)
    }

    try {
      if (process.env.OPENAI_API_KEY) {
        this.openAIClient = new OpenAIClient()
      }
    } catch (error) {
      console.warn('Failed to initialize OpenAI client:', error)
    }

    if (!this.anthropicClient && !this.openAIClient) {
      throw new Error(
        'No LLM providers available. Set ANTHROPIC_API_KEY or OPENAI_API_KEY environment variables.'
      )
    }
  }

  // Main text generation method with automatic fallback
  async generateText(
    request: TLLMRequest,
    provider: LLMProvider = 'auto'
  ): Promise<TLLMResponse> {
    const validatedRequest = llmRequestSchema.parse(request)
    let attempts = 0
    let lastError: LLMError | null = null

    const providers = this.getProviderOrder(provider)

    for (const providerName of providers) {
      attempts++
      try {
        const response = await this.callProvider(providerName, validatedRequest)
        return response
      } catch (error) {
        lastError = this.normalizeError(error, providerName)

        // Don't retry on authentication or invalid request errors
        if (
          lastError.type === 'authentication' ||
          lastError.type === 'invalid_request'
        ) {
          if (this.fallbackEnabled && providers.length > 1) {
            console.warn(
              `${providerName} error (${lastError.type}), trying fallback...`
            )
            continue
          }
          throw lastError
        }

        // Retry on rate limit or server errors
        if (
          (lastError.type === 'rate_limit' ||
            lastError.type === 'server_error') &&
          attempts <= this.retryAttempts
        ) {
          console.warn(`${providerName} error, retrying in 1s...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }

        // Try fallback provider
        if (this.fallbackEnabled && providers.length > 1) {
          console.warn(`${providerName} failed, trying fallback...`)
          continue
        }

        throw lastError
      }
    }

    throw (
      lastError ||
      new Error('All LLM providers failed and no error was captured')
    )
  }

  // Generate structured JSON with automatic validation
  async generateJson<T>(
    request: TLLMRequest,
    schema: z.ZodType<T>,
    provider: LLMProvider = 'auto'
  ): Promise<{ data: T; response: TLLMResponse }> {
    const response = await this.generateText(
      {
        ...request,
        systemPrompt: `${request.systemPrompt || ''}\n\nIMPORTANT: Respond with valid JSON only. No additional text or explanation.`,
      },
      provider
    )

    try {
      const parsed = JSON.parse(response.content)
      const validated = schema.parse(parsed)

      return {
        data: validated,
        response,
      }
    } catch (parseError) {
      const error: LLMError = new Error(
        `JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
      ) as LLMError
      error.type = 'invalid_request'
      error.provider = response.provider
      error.details = { response: response.content, parseError }
      throw error
    }
  }

  // Simple chat interface
  async chat(
    message: string,
    systemPrompt?: string,
    provider: LLMProvider = 'auto'
  ): Promise<string> {
    const response = await this.generateText(
      {
        messages: [{ role: 'user', content: message }],
        systemPrompt,
        maxTokens: 2000,
        temperature: 0.7,
      },
      provider
    )

    return response.content
  }

  // Travel-specific methods
  async generateItinerary(
    destination: string,
    duration: number,
    interests: string[],
    persona?: string,
    provider: LLMProvider = 'auto'
  ): Promise<{ itinerary: string; response: TLLMResponse }> {
    const systemPrompt = `You are an expert travel concierge${persona ? ` with a ${persona.toLowerCase()} perspective` : ''}. Generate detailed, personalized travel itineraries with specific recommendations for places, restaurants, and activities.`

    const userPrompt = `Create a ${duration}-day travel itinerary for ${destination}. 
    
Traveler interests: ${interests.join(', ')}
    
Include:
- Daily schedule with timing
- Specific restaurant and activity recommendations  
- Local transportation tips
- Hidden gems and authentic experiences
- Budget considerations

Format as a detailed, practical itinerary.`

    const response = await this.generateText(
      {
        messages: [{ role: 'user', content: userPrompt }],
        systemPrompt,
        maxTokens: 3000,
        temperature: 0.8,
      },
      provider
    )

    return {
      itinerary: response.content,
      response,
    }
  }

  async suggestDestinations(
    origin: string,
    duration: number,
    interests: string[],
    budget?: string,
    provider: LLMProvider = 'auto'
  ): Promise<{ suggestions: string; response: TLLMResponse }> {
    const systemPrompt = `You are a travel expert who suggests unique, personalized destinations based on traveler preferences. Focus on authentic, culturally-rich experiences.`

    const userPrompt = `Suggest 5 unique travel destinations from ${origin} for a ${duration}-day trip.

Interests: ${interests.join(', ')}
${budget ? `Budget: ${budget}` : ''}

For each destination, include:
- Why it's perfect for their interests
- Best time to visit
- Unique experiences available
- Rough cost estimate
- Travel logistics from ${origin}

Focus on distinctive, less obvious choices that match their interests.`

    const response = await this.generateText(
      {
        messages: [{ role: 'user', content: userPrompt }],
        systemPrompt,
        maxTokens: 3000,
        temperature: 0.9,
      },
      provider
    )

    return {
      suggestions: response.content,
      response,
    }
  }

  // Provider-specific call handler
  private async callProvider(
    provider: 'anthropic' | 'openai',
    request: TLLMRequest
  ): Promise<TLLMResponse> {
    if (provider === 'anthropic') {
      if (!this.anthropicClient) {
        throw new Error('Anthropic client not available')
      }

      const messages = request.messages.filter(m => m.role !== 'system')
      const claudeResponse = await this.anthropicClient.generateText({
        messages: messages as any,
        system: request.systemPrompt,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        model: 'claude-3-5-sonnet-20241022',
      })

      return {
        content: claudeResponse.content,
        usage: {
          inputTokens: claudeResponse.usage.input_tokens,
          outputTokens: claudeResponse.usage.output_tokens,
          totalTokens:
            claudeResponse.usage.input_tokens +
            claudeResponse.usage.output_tokens,
        },
        provider: 'anthropic',
        model: claudeResponse.model,
        estimatedCost: this.anthropicClient.estimateCost(
          claudeResponse.usage.input_tokens,
          claudeResponse.usage.output_tokens
        ),
      }
    } else {
      if (!this.openAIClient) {
        throw new Error('OpenAI client not available')
      }

      const messages = [...request.messages]
      if (request.systemPrompt) {
        messages.unshift({ role: 'system', content: request.systemPrompt })
      }

      const openAIResponse = await this.openAIClient.generateText({
        messages: messages as any,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        model: 'gpt-4',
      })

      return {
        content: openAIResponse.content,
        usage: {
          inputTokens: openAIResponse.usage.prompt_tokens,
          outputTokens: openAIResponse.usage.completion_tokens,
          totalTokens: openAIResponse.usage.total_tokens,
        },
        provider: 'openai',
        model: openAIResponse.model,
        estimatedCost: this.openAIClient.estimateCost(
          openAIResponse.usage.prompt_tokens,
          openAIResponse.usage.completion_tokens
        ),
      }
    }
  }

  // Get provider order based on preference
  private getProviderOrder(provider: LLMProvider): ('anthropic' | 'openai')[] {
    const available: ('anthropic' | 'openai')[] = []

    if (this.anthropicClient) {
      available.push('anthropic')
    }
    if (this.openAIClient) {
      available.push('openai')
    }

    if (provider === 'anthropic') {
      return ['anthropic']
    } else if (provider === 'openai') {
      return ['openai']
    }

    // Auto: prefer Anthropic, fallback to OpenAI
    return available.sort(a => (a === 'anthropic' ? -1 : 1))
  }

  // Normalize errors from different providers
  private normalizeError(
    error: any,
    provider: 'anthropic' | 'openai'
  ): LLMError {
    const llmError: LLMError = new Error(
      error.message || 'Unknown LLM error'
    ) as LLMError

    llmError.provider = provider

    if (error.type) {
      llmError.type = error.type
    } else if (error.statusCode) {
      llmError.statusCode = error.statusCode
      switch (error.statusCode) {
        case 401:
          llmError.type = 'authentication'
          break
        case 429:
          llmError.type = 'rate_limit'
          break
        case 400:
          llmError.type = 'invalid_request'
          break
        default:
          llmError.type = 'server_error'
      }
    } else {
      llmError.type = 'unknown'
    }

    llmError.details = error
    return llmError
  }

  // Configuration methods
  setPreferredProvider(_provider: LLMProvider) {
    // Store for future use - currently fallback is automatic
    // this.preferredProvider = provider
  }

  setRetryAttempts(attempts: number) {
    this.retryAttempts = Math.max(0, attempts)
  }

  setFallbackEnabled(enabled: boolean) {
    this.fallbackEnabled = enabled
  }

  // Status methods
  getAvailableProviders(): ('anthropic' | 'openai')[] {
    const available: ('anthropic' | 'openai')[] = []
    if (this.anthropicClient) {
      available.push('anthropic')
    }
    if (this.openAIClient) {
      available.push('openai')
    }
    return available
  }

  isProviderAvailable(provider: 'anthropic' | 'openai'): boolean {
    return provider === 'anthropic'
      ? !!this.anthropicClient
      : !!this.openAIClient
  }
}

// Default LLM manager instance
export const llm = new LLMManager()

// Export types and clients for direct access if needed
export { AnthropicClient, OpenAIClient, type ClaudeError, type OpenAIError }
