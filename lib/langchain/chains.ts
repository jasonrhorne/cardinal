/**
 * LangChain Chains for Travel Operations
 * Combines prompts with models for specific travel use cases
 */

import { StringOutputParser } from '@langchain/core/output_parsers'
import { z } from 'zod'

import { langChain } from './config'
import {
  promptTemplates,
  validateDestinationInput,
  validateItineraryInput,
  type TDestinationSuggestionInput,
  type TItineraryGenerationInput,
} from './prompts'

// Output schemas for structured responses
export const destinationSuggestionOutputSchema = z.object({
  destinations: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      whyPerfect: z.string(),
      bestTime: z.string(),
      uniqueExperiences: z.array(z.string()),
      costEstimate: z.string(),
      logistics: z.string(),
      recommendedDuration: z.string(),
    })
  ),
})

export const itineraryOutputSchema = z.object({
  destination: z.string(),
  duration: z.number(),
  days: z.array(
    z.object({
      day: z.number(),
      theme: z.string(),
      activities: z.object({
        morning: z.object({
          time: z.string(),
          activity: z.string(),
          details: z.string().optional(),
        }),
        lunch: z.object({
          time: z.string(),
          restaurant: z.string(),
          cuisine: z.string(),
          whySpecial: z.string(),
        }),
        afternoon: z.object({
          time: z.string(),
          activity: z.string(),
          details: z.string().optional(),
        }),
        evening: z.object({
          time: z.string(),
          activity: z.string(),
          details: z.string().optional(),
        }),
        dinner: z.object({
          time: z.string(),
          restaurant: z.string(),
          cuisine: z.string(),
          atmosphere: z.string(),
        }),
        optional: z
          .object({
            activity: z.string(),
            details: z.string(),
          })
          .optional(),
      }),
      logistics: z.string(),
      budgetEstimate: z.string(),
      insiderTips: z.array(z.string()),
    })
  ),
  summary: z.object({
    transportation: z.string(),
    budgetBreakdown: z.string(),
    localTips: z.array(z.string()),
    emergencyContacts: z.array(z.string()),
  }),
})

export type TDestinationSuggestionOutput = z.infer<
  typeof destinationSuggestionOutputSchema
>
export type TItineraryOutput = z.infer<typeof itineraryOutputSchema>

export class TravelChains {
  constructor(private langChainManager = langChain) {}

  // Destination suggestion chain
  async suggestDestinations(
    input: TDestinationSuggestionInput,
    provider?: 'anthropic' | 'openai'
  ): Promise<string> {
    const validatedInput = validateDestinationInput(input)
    const model = this.langChainManager.getChatModel(provider)

    if (!model) {
      throw this.langChainManager.createError(
        'provider_unavailable',
        'No LLM provider available for destination suggestions',
        provider
      )
    }

    try {
      const chain = promptTemplates.destinationSuggestion
        .pipe(model)
        .pipe(new StringOutputParser())

      const result = await chain.invoke({
        origin: validatedInput.origin,
        duration: validatedInput.duration,
        travelers: validatedInput.travelers,
        interests: validatedInput.interests.join(', '),
        budget: validatedInput.budget || 'Not specified',
        pace: validatedInput.pace,
        persona: validatedInput.persona
          ? ` with a ${validatedInput.persona.toLowerCase()} perspective`
          : '',
      })

      return result
    } catch (error) {
      throw this.langChainManager.createError(
        'chain_failure',
        `Destination suggestion chain failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider,
        error
      )
    }
  }

  // Structured destination suggestion chain
  async suggestDestinationsStructured(
    input: TDestinationSuggestionInput,
    provider?: 'anthropic' | 'openai'
  ): Promise<TDestinationSuggestionOutput> {
    const validatedInput = validateDestinationInput(input)
    const model = this.langChainManager.getChatModel(provider)

    if (!model) {
      throw this.langChainManager.createError(
        'provider_unavailable',
        'No LLM provider available for structured destination suggestions',
        provider
      )
    }

    try {
      // Create a chain that formats the prompt for structured output
      const structuredPrompt = promptTemplates.structuredResponse.partial({
        schema: JSON.stringify(
          destinationSuggestionOutputSchema.shape,
          null,
          2
        ),
      })

      const basePromptFormatted =
        await promptTemplates.destinationSuggestion.formatPromptValue({
          origin: validatedInput.origin,
          duration: validatedInput.duration,
          travelers: validatedInput.travelers,
          interests: validatedInput.interests.join(', '),
          budget: validatedInput.budget || 'Not specified',
          pace: validatedInput.pace,
          persona: validatedInput.persona
            ? ` with a ${validatedInput.persona.toLowerCase()} perspective`
            : '',
        })

      const structuredPromptTemplate = await structuredPrompt
      const finalPrompt = await structuredPromptTemplate.format({
        basePrompt: basePromptFormatted.toString(),
      })

      const result = await model.invoke(finalPrompt)
      const content =
        typeof result.content === 'string'
          ? result.content
          : JSON.stringify(result.content)

      const parsed = JSON.parse(content)
      return destinationSuggestionOutputSchema.parse(parsed)
    } catch (error) {
      throw this.langChainManager.createError(
        'validation_error',
        `Structured destination suggestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider,
        error
      )
    }
  }

  // Itinerary generation chain
  async generateItinerary(
    input: TItineraryGenerationInput,
    provider?: 'anthropic' | 'openai'
  ): Promise<string> {
    const validatedInput = validateItineraryInput(input)
    const model = this.langChainManager.getChatModel(provider)

    if (!model) {
      throw this.langChainManager.createError(
        'provider_unavailable',
        'No LLM provider available for itinerary generation',
        provider
      )
    }

    try {
      const chain = promptTemplates.itineraryGeneration
        .pipe(model)
        .pipe(new StringOutputParser())

      const result = await chain.invoke({
        destination: validatedInput.destination,
        duration: validatedInput.duration,
        travelers: validatedInput.travelers,
        interests: validatedInput.interests.join(', '),
        budget: validatedInput.budget || 'Not specified',
        pace: validatedInput.pace,
        persona: validatedInput.persona
          ? ` with a ${validatedInput.persona.toLowerCase()} perspective`
          : '',
        accommodationPreference:
          validatedInput.accommodationPreference || 'No specific preference',
        transportationMode: validatedInput.transportationMode,
      })

      return result
    } catch (error) {
      throw this.langChainManager.createError(
        'chain_failure',
        `Itinerary generation chain failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider,
        error
      )
    }
  }

  // Itinerary refinement chain
  async refineItinerary(
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
    const model = this.langChainManager.getChatModel(provider)

    if (!model) {
      throw this.langChainManager.createError(
        'provider_unavailable',
        'No LLM provider available for itinerary refinement',
        provider
      )
    }

    try {
      const chain = promptTemplates.itineraryRefinement
        .pipe(model)
        .pipe(new StringOutputParser())

      const result = await chain.invoke({
        originalItinerary,
        userFeedback,
        destination: context.destination,
        duration: context.duration,
        travelers: context.travelers,
        interests: context.interests.join(', '),
        budget: context.budget || 'Not specified',
      })

      return result
    } catch (error) {
      throw this.langChainManager.createError(
        'chain_failure',
        `Itinerary refinement chain failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider,
        error
      )
    }
  }

  // Simple chat chain for general travel questions
  async chatWithTravelExpert(
    message: string,
    context?: string,
    provider?: 'anthropic' | 'openai'
  ): Promise<string> {
    const model = this.langChainManager.getChatModel(provider)

    if (!model) {
      throw this.langChainManager.createError(
        'provider_unavailable',
        'No LLM provider available for travel chat',
        provider
      )
    }

    try {
      const systemMessage = `You are an expert travel advisor with deep knowledge of destinations worldwide. You provide helpful, practical travel advice and recommendations.${context ? `\n\nContext: ${context}` : ''}`

      const messages = [
        { role: 'system' as const, content: systemMessage },
        { role: 'human' as const, content: message },
      ]

      const result = await model.invoke(messages)
      return typeof result.content === 'string'
        ? result.content
        : JSON.stringify(result.content)
    } catch (error) {
      throw this.langChainManager.createError(
        'chain_failure',
        `Travel chat chain failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider,
        error
      )
    }
  }

  // Get available providers
  getAvailableProviders(): string[] {
    return this.langChainManager.getAvailableProviders()
  }

  // Get current configuration
  getConfig() {
    return this.langChainManager.getConfig()
  }
}

// Default travel chains instance
export const travelChains = new TravelChains()
