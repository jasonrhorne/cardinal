/**
 * Input Methods - Main Export
 * Centralized exports for input method abstraction layer
 */

// Core types and interfaces
export type {
  InputMethodType,
  ValidationResult,
  InputMethodMetadata,
  IInputMethod,
  InputMethodRegistration,
  InputMethodProps,
  ConversionStage,
  ExperimentConfig,
  ExperimentResults,
} from './types'

export { InputMethodError } from './types'

// Registry and factory
export { inputMethodRegistry, InputMethodRegistry } from './registry'

// Experimentation
export { experimentRouter, ExperimentRouter } from '../experimentation/router'

// Main container component
export { InputMethodContainer } from '../../components/features/input-methods/input-method-container'
export type { InputMethodContainerProps } from '../../components/features/input-methods/input-method-container'

// Individual input method implementations (placeholders for now)
export { ConstrainedFormInput } from './implementations/constrained-form'
export { GuidedPromptsInput } from './implementations/guided-prompts'
export { ConversationalInput } from './implementations/conversational'
