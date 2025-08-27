/**
 * Input Method Abstraction Layer Types
 * Core interfaces for experimentation framework
 */

import { TTravelRequirements } from '../schemas/travel-requirements'

// Input method types for A/B testing
export type InputMethodType =
  | 'constrained-form'
  | 'guided-prompts'
  | 'conversational'

// Validation result interface
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// Input method metadata for tracking
export interface InputMethodMetadata {
  methodType: InputMethodType
  startTime: number
  completionTime?: number
  stepCount: number
  revisionsCount: number
  userAgent: string
}

// Abstract input method interface
export interface IInputMethod<TData = any> {
  id: InputMethodType
  name: string
  description: string

  // Core functionality
  collect(): Promise<TData>
  validate(data: TData): ValidationResult
  transform(data: TData): TTravelRequirements

  // Metadata tracking
  getMetadata(): InputMethodMetadata
  reset(): void
}

// Input method registration for factory pattern
export interface InputMethodRegistration {
  type: InputMethodType
  name: string
  description: string
  component: React.ComponentType<InputMethodProps>
  enabled: boolean
}

// Props passed to input method components
export interface InputMethodProps {
  onComplete: (
    requirements: TTravelRequirements,
    metadata: InputMethodMetadata
  ) => void
  onCancel: () => void
  defaultValues?: Partial<TTravelRequirements>
}

// Conversion stage tracking for analytics
export type ConversionStage =
  | 'method-selected'
  | 'input-started'
  | 'input-completed'
  | 'validation-passed'
  | 'requirements-submitted'

// A/B test experiment configuration
export interface ExperimentConfig {
  id: string
  name: string
  description: string
  startDate: Date
  endDate?: Date | undefined
  trafficSplit: Record<InputMethodType, number> // percentages
  enabled: boolean
}

// Experiment results and analytics
export interface ExperimentResults {
  experimentId: string
  totalUsers: number
  variantPerformance: Record<
    InputMethodType,
    {
      users: number
      completionRate: number
      averageTime: number
      satisfactionScore: number
      conversionRate: number
    }
  >
  statisticalSignificance: boolean
  recommendedVariant?: InputMethodType | undefined
}

// Error types for input method failures
export class InputMethodError extends Error {
  constructor(
    message: string,
    public methodType: InputMethodType,
    public stage: ConversionStage,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'InputMethodError'
  }
}
