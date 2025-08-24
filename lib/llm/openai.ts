/**
 * OpenAI API Client
 * Fallback LLM provider for Cardinal travel app
 */

import OpenAI from 'openai'
import { z } from 'zod'

// OpenAI request schema
export const openAIRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
  model: z
    .enum(['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'])
    .default('gpt-4o'),
  max_tokens: z.number().positive().max(4096).default(2000),
  temperature: z.number().min(0).max(2).default(0.7),
})

export type TOpenAIRequest = z.infer<typeof openAIRequestSchema>

// OpenAI response schema
export const openAIResponseSchema = z.object({
  content: z.string(),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }),
  model: z.string(),
  finish_reason: z.string().optional(),
})

export type TOpenAIResponse = z.infer<typeof openAIResponseSchema>

// Error types
export type OpenAIErrorType =
  | 'authentication'
  | 'rate_limit'
  | 'quota_exceeded'
  | 'invalid_request'
  | 'server_error'
  | 'unknown'

export interface OpenAIError extends Error {
  type: OpenAIErrorType
  statusCode?: number
  details?: any
}

export class OpenAIClient {
  private client: OpenAI
  private defaultModel: string = 'gpt-4'

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY

    if (!key) {
      throw new Error(
        'OpenAI API key is required. Set OPENAI_API_KEY environment variable.'
      )
    }

    this.client = new OpenAI({
      apiKey: key,
    })
  }

  // Generate text using GPT
  async generateText(request: TOpenAIRequest): Promise<TOpenAIResponse> {
    const validatedRequest = openAIRequestSchema.parse(request)

    try {
      const response = await this.client.chat.completions.create({
        model: validatedRequest.model,
        messages: validatedRequest.messages,
        max_tokens: validatedRequest.max_tokens,
        temperature: validatedRequest.temperature,
      })

      const choice = response.choices[0]
      if (!choice?.message?.content) {
        throw new Error('No content in OpenAI response')
      }

      return {
        content: choice.message.content,
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
        },
        model: response.model as any,
        finish_reason: choice.finish_reason || undefined,
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Generate structured JSON response
  async generateJson<T>(
    request: TOpenAIRequest,
    schema: z.ZodType<T>
  ): Promise<{ data: T; usage: TOpenAIResponse['usage'] }> {
    // Add JSON instruction to system message
    const messages = [...request.messages]
    const systemMessage = messages.find(m => m.role === 'system')

    if (systemMessage) {
      systemMessage.content +=
        '\n\nIMPORTANT: Your response must be valid JSON only. Do not include any explanation or additional text outside the JSON.'
    } else {
      messages.unshift({
        role: 'system',
        content:
          'IMPORTANT: Your response must be valid JSON only. Do not include any explanation or additional text outside the JSON.',
      })
    }

    const response = await this.generateText({
      ...request,
      messages,
    })

    try {
      const parsed = JSON.parse(response.content)
      const validated = schema.parse(parsed)

      return {
        data: validated,
        usage: response.usage,
      }
    } catch (parseError) {
      const error: OpenAIError = new Error(
        `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
      ) as OpenAIError
      error.type = 'invalid_request'
      error.details = { response: response.content, parseError }
      throw error
    }
  }

  // Simple chat interface
  async chat(message: string, systemPrompt?: string): Promise<string> {
    const messages: TOpenAIRequest['messages'] = []

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }

    messages.push({ role: 'user', content: message })

    const response = await this.generateText({
      messages,
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
  private handleError(error: any): OpenAIError {
    const openAIError: OpenAIError = new Error(
      error.message || 'Unknown OpenAI API error'
    ) as OpenAIError

    if (error.status) {
      openAIError.statusCode = error.status

      switch (error.status) {
        case 401:
          openAIError.type = 'authentication'
          break
        case 429:
          openAIError.type = 'rate_limit'
          break
        case 400:
          openAIError.type = 'invalid_request'
          break
        case 500:
        case 502:
        case 503:
          openAIError.type = 'server_error'
          break
        default:
          openAIError.type = 'unknown'
      }
    } else {
      openAIError.type = 'unknown'
    }

    openAIError.details = error
    return openAIError
  }

  // Utility methods
  estimateCost(promptTokens: number, completionTokens: number): number {
    // GPT-4 pricing (as of 2024)
    const inputCostPer1k = 0.03 // $30 per million tokens
    const outputCostPer1k = 0.06 // $60 per million tokens

    return (
      (promptTokens / 1000) * inputCostPer1k +
      (completionTokens / 1000) * outputCostPer1k
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
export const openAIClient = new OpenAIClient()
