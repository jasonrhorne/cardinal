/**
 * LangChain Configuration
 * Central configuration for LangChain agents and orchestration
 */

import { ChatAnthropic } from '@langchain/anthropic'
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'

// LangChain provider configuration
export const langChainConfigSchema = z.object({
  anthropic: z.object({
    apiKey: z.string(),
    model: z.string().default('claude-3-5-sonnet-20241022'),
    temperature: z.number().min(0).max(1).default(0.7),
    maxTokens: z.number().positive().max(4096).default(2000),
  }),
  openai: z.object({
    apiKey: z.string(),
    model: z.string().default('gpt-4o'),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().positive().max(4096).default(2000),
  }),
  defaultProvider: z.enum(['anthropic', 'openai']).default('anthropic'),
})

export type TLangChainConfig = z.infer<typeof langChainConfigSchema>

// Error types for LangChain operations
export type LangChainErrorType =
  | 'initialization'
  | 'prompt_execution'
  | 'chain_failure'
  | 'agent_error'
  | 'provider_unavailable'
  | 'validation_error'

export interface LangChainError extends Error {
  type: LangChainErrorType
  provider?: string
  details?: any
}

export class LangChainManager {
  private config: TLangChainConfig
  private anthropicChat: ChatAnthropic | null = null
  private openaiChat: ChatOpenAI | null = null

  constructor(config?: Partial<TLangChainConfig>) {
    // Initialize configuration from environment and overrides
    const defaultConfig = {
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.7,
        maxTokens: 2000,
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 2000,
      },
      defaultProvider: 'anthropic' as const,
    }

    this.config = langChainConfigSchema.parse({
      ...defaultConfig,
      ...config,
    })

    this.initializeProviders()
  }

  private initializeProviders() {
    try {
      // Initialize Anthropic if API key is available
      if (this.config.anthropic.apiKey) {
        this.anthropicChat = new ChatAnthropic({
          apiKey: this.config.anthropic.apiKey,
          model: this.config.anthropic.model,
          temperature: this.config.anthropic.temperature,
          maxTokens: this.config.anthropic.maxTokens,
        })
      }
    } catch (error) {
      console.warn('Failed to initialize Anthropic LangChain provider:', error)
    }

    try {
      // Initialize OpenAI if API key is available
      if (this.config.openai.apiKey) {
        this.openaiChat = new ChatOpenAI({
          apiKey: this.config.openai.apiKey,
          model: this.config.openai.model,
          temperature: this.config.openai.temperature,
          maxTokens: this.config.openai.maxTokens,
        })
      }
    } catch (error) {
      console.warn('Failed to initialize OpenAI LangChain provider:', error)
    }

    if (!this.anthropicChat && !this.openaiChat) {
      throw new Error(
        'No LangChain providers available. Set ANTHROPIC_API_KEY or OPENAI_API_KEY environment variables.'
      )
    }
  }

  // Get the preferred chat model
  getChatModel(provider?: 'anthropic' | 'openai') {
    const requestedProvider = provider || this.config.defaultProvider

    if (requestedProvider === 'anthropic' && this.anthropicChat) {
      return this.anthropicChat
    }

    if (requestedProvider === 'openai' && this.openaiChat) {
      return this.openaiChat
    }

    // Fallback to available provider
    return this.anthropicChat || this.openaiChat
  }

  // Get available providers
  getAvailableProviders(): string[] {
    const providers: string[] = []
    if (this.anthropicChat) {
      providers.push('anthropic')
    }
    if (this.openaiChat) {
      providers.push('openai')
    }
    return providers
  }

  // Check if a specific provider is available
  isProviderAvailable(provider: 'anthropic' | 'openai'): boolean {
    return provider === 'anthropic' ? !!this.anthropicChat : !!this.openaiChat
  }

  // Update configuration
  updateConfig(updates: Partial<TLangChainConfig>) {
    this.config = langChainConfigSchema.parse({
      ...this.config,
      ...updates,
    })
    this.initializeProviders()
  }

  // Get current configuration (excluding API keys)
  getConfig() {
    return {
      anthropic: {
        model: this.config.anthropic.model,
        temperature: this.config.anthropic.temperature,
        maxTokens: this.config.anthropic.maxTokens,
      },
      openai: {
        model: this.config.openai.model,
        temperature: this.config.openai.temperature,
        maxTokens: this.config.openai.maxTokens,
      },
      defaultProvider: this.config.defaultProvider,
      availableProviders: this.getAvailableProviders(),
    }
  }

  // Error handling utility
  createError(
    type: LangChainErrorType,
    message: string,
    provider?: string,
    details?: any
  ): LangChainError {
    const error = new Error(message) as LangChainError
    error.type = type
    if (provider) {
      error.provider = provider
    }
    if (details) {
      error.details = details
    }
    return error
  }
}

// Default LangChain manager instance
export const langChain = new LangChainManager()
