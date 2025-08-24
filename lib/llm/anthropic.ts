/**
 * Anthropic Claude API Client
 * Primary LLM provider for Cardinal travel app
 */

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

// Claude request schema
export const claudeRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
  model: z
    .enum(['claude-3-sonnet-20240229', 'claude-3-haiku-20240307'])
    .default('claude-3-sonnet-20240229'),
  max_tokens: z.number().positive().max(4096).default(2000),
  temperature: z.number().min(0).max(1).default(0.7),
  system: z.string().optional(),
})

export type TClaudeRequest = z.infer<typeof claudeRequestSchema>

// Claude response schema
export const claudeResponseSchema = z.object({
  content: z.string(),
  usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number(),
  }),
  model: z.string(),
  stop_reason: z.string().optional(),
})

export type TClaudeResponse = z.infer<typeof claudeResponseSchema>

// Error types
export type ClaudeErrorType =
  | 'authentication'
  | 'rate_limit'
  | 'quota_exceeded'
  | 'invalid_request'
  | 'server_error'
  | 'unknown'

export interface ClaudeError extends Error {
  type: ClaudeErrorType
  statusCode?: number
  details?: any
}

export class AnthropicClient {
  private client: Anthropic
  private defaultModel: string = 'claude-3-sonnet-20240229'

  constructor(apiKey?: string) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY

    if (!key) {
      throw new Error(
        'Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable.'
      )
    }

    this.client = new Anthropic({
      apiKey: key,
    })
  }

  // Generate text using Claude
  async generateText(request: TClaudeRequest): Promise<TClaudeResponse> {
    const validatedRequest = claudeRequestSchema.parse(request)

    try {
      const requestParams: any = {
        model: validatedRequest.model,
        max_tokens: validatedRequest.max_tokens,
        temperature: validatedRequest.temperature,
        messages: validatedRequest.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      }

      if (validatedRequest.system) {
        requestParams.system = validatedRequest.system
      }

      const response = await this.client.messages.create(requestParams)

      // Extract content from response
      const content = response.content
        .map(block => (block.type === 'text' ? block.text : ''))
        .join('')

      return {
        content,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
        },
        model: response.model as any,
        stop_reason: response.stop_reason || undefined,
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Generate structured JSON response
  async generateJson<T>(
    request: TClaudeRequest,
    schema: z.ZodType<T>
  ): Promise<{ data: T; usage: TClaudeResponse['usage'] }> {
    const response = await this.generateText({
      ...request,
      system: `${request.system || ''}\n\nIMPORTANT: Your response must be valid JSON only. Do not include any explanation or additional text outside the JSON.`,
    })

    try {
      const parsed = JSON.parse(response.content)
      const validated = schema.parse(parsed)

      return {
        data: validated,
        usage: response.usage,
      }
    } catch (parseError) {
      const error: ClaudeError = new Error(
        `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
      ) as ClaudeError
      error.type = 'invalid_request'
      error.details = { response: response.content, parseError }
      throw error
    }
  }

  // Simple chat interface
  async chat(message: string, systemPrompt?: string): Promise<string> {
    const response = await this.generateText({
      messages: [{ role: 'user', content: message }],
      system: systemPrompt,
      model: this.defaultModel as any,
      max_tokens: 2000,
      temperature: 0.7,
    })

    return response.content
  }

  // Travel-specific helper methods
  async generateItinerary(
    destination: string,
    duration: number,
    interests: string[],
    persona?: string
  ): Promise<string> {
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

    return await this.chat(userPrompt, systemPrompt)
  }

  async suggestDestinations(
    origin: string,
    duration: number,
    interests: string[],
    budget?: string
  ): Promise<string> {
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

    return await this.chat(userPrompt, systemPrompt)
  }

  // Error handling
  private handleError(error: any): ClaudeError {
    const claudeError: ClaudeError = new Error(
      error.message || 'Unknown Anthropic API error'
    ) as ClaudeError

    if (error.status) {
      claudeError.statusCode = error.status

      switch (error.status) {
        case 401:
          claudeError.type = 'authentication'
          break
        case 429:
          claudeError.type = 'rate_limit'
          break
        case 400:
          claudeError.type = 'invalid_request'
          break
        case 500:
        case 502:
        case 503:
          claudeError.type = 'server_error'
          break
        default:
          claudeError.type = 'unknown'
      }
    } else {
      claudeError.type = 'unknown'
    }

    claudeError.details = error
    return claudeError
  }

  // Utility methods
  estimateCost(inputTokens: number, outputTokens: number): number {
    // Claude 3 Sonnet pricing (as of 2024)
    const inputCostPer1k = 0.003 // $3 per million tokens
    const outputCostPer1k = 0.015 // $15 per million tokens

    return (
      (inputTokens / 1000) * inputCostPer1k +
      (outputTokens / 1000) * outputCostPer1k
    )
  }

  getDefaultModel(): string {
    return this.defaultModel
  }

  setDefaultModel(model: string) {
    this.defaultModel = model as any
  }
}

// Default client instance
export const anthropicClient = new AnthropicClient()
