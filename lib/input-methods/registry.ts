/**
 * Input Method Registry
 * Factory pattern for managing different input method implementations
 */

import { TTravelRequirements } from '../schemas/travel-requirements'

import { ConstrainedFormInput } from './implementations/constrained-form'
import { ConversationalInput } from './implementations/conversational'
import { GuidedPromptsInput } from './implementations/guided-prompts'
import { OpenTextInput } from './implementations/open-text'
import {
  InputMethodType,
  InputMethodRegistration,
  IInputMethod,
  ValidationResult,
  InputMethodMetadata,
} from './types'

// Registry of available input methods
class InputMethodRegistry {
  private methods = new Map<InputMethodType, InputMethodRegistration>()
  private instances = new Map<InputMethodType, IInputMethod>()

  constructor() {
    this.registerDefaultMethods()
  }

  // Register all default input methods
  private registerDefaultMethods(): void {
    // Constrained form (current implementation enhanced)
    this.register({
      type: 'constrained-form',
      name: 'Structured Form',
      description: 'Categorical selections with predefined options',
      component: ConstrainedFormInput,
      enabled: true,
    })

    // Hybrid input (E003 implementation)
    this.register({
      type: 'open-text',
      name: 'Natural Language',
      description:
        'Structured fields for facts, natural language for preferences',
      component: OpenTextInput,
      enabled: true,
    })

    // Guided prompts (E004 implementation)
    this.register({
      type: 'guided-prompts',
      name: 'Guided Questions',
      description: 'Step-by-step conversational wizard',
      component: GuidedPromptsInput,
      enabled: true, // E004: Enabled for testing
    })

    // Conversational interface (new implementation)
    this.register({
      type: 'conversational',
      name: 'Chat Interface',
      description: 'Natural language conversation with AI',
      component: ConversationalInput,
      enabled: false, // Enable in E005
    })
  }

  // Register a new input method
  register(registration: InputMethodRegistration): void {
    this.methods.set(registration.type, registration)
  }

  // Get all enabled input methods
  getEnabledMethods(): InputMethodRegistration[] {
    return Array.from(this.methods.values()).filter(method => method.enabled)
  }

  // Get specific input method registration
  getMethod(type: InputMethodType): InputMethodRegistration | undefined {
    return this.methods.get(type)
  }

  // Create instance of input method (factory pattern)
  createInstance(type: InputMethodType): IInputMethod {
    const registration = this.methods.get(type)
    if (!registration) {
      throw new Error(`Input method '${type}' not found in registry`)
    }

    if (!registration.enabled) {
      throw new Error(`Input method '${type}' is not enabled`)
    }

    // Return cached instance if available
    if (this.instances.has(type)) {
      const instance = this.instances.get(type)!
      instance.reset() // Reset state for new use
      return instance
    }

    // Create new instance based on type
    let instance: IInputMethod
    switch (type) {
      case 'constrained-form':
        instance = new ConstrainedFormImplementation()
        break
      case 'guided-prompts':
        instance = new GuidedPromptsImplementation()
        break
      case 'conversational':
        instance = new ConversationalImplementation()
        break
      default:
        throw new Error(`No implementation found for input method: ${type}`)
    }

    // Cache the instance
    this.instances.set(type, instance)
    return instance
  }

  // Get method statistics (for A/B testing)
  getMethodStats(_type: InputMethodType): {
    totalUses: number
    averageCompletionTime: number
    completionRate: number
  } {
    // This would be implemented with actual analytics data
    // For now, return placeholder data
    return {
      totalUses: 0,
      averageCompletionTime: 0,
      completionRate: 0,
    }
  }

  // Enable/disable methods dynamically
  setMethodEnabled(type: InputMethodType, enabled: boolean): void {
    const method = this.methods.get(type)
    if (method) {
      method.enabled = enabled
    }
  }

  // Clear all cached instances (useful for testing)
  clearCache(): void {
    this.instances.clear()
  }
}

// Placeholder implementations - these will be created in separate files
class ConstrainedFormImplementation implements IInputMethod {
  id: InputMethodType = 'constrained-form'
  name = 'Structured Form'
  description = 'Categorical selections with predefined options'

  async collect(): Promise<any> {
    throw new Error('Implementation pending - will be created in Phase 1')
  }

  validate(_data: any): ValidationResult {
    return { valid: false, errors: ['Not implemented'], warnings: [] }
  }

  transform(_data: any): TTravelRequirements {
    throw new Error('Implementation pending')
  }

  getMetadata(): InputMethodMetadata {
    throw new Error('Implementation pending')
  }

  reset() {
    // Implementation pending
  }
}

class GuidedPromptsImplementation implements IInputMethod {
  id: InputMethodType = 'guided-prompts'
  name = 'Guided Questions'
  description = 'Step-by-step conversational wizard'

  async collect(): Promise<any> {
    throw new Error('Implementation pending - will be created in Phase 2')
  }

  validate(_data: any): ValidationResult {
    return { valid: false, errors: ['Not implemented'], warnings: [] }
  }

  transform(_data: any): TTravelRequirements {
    throw new Error('Implementation pending')
  }

  getMetadata(): InputMethodMetadata {
    throw new Error('Implementation pending')
  }

  reset() {
    // Implementation pending
  }
}

class ConversationalImplementation implements IInputMethod {
  id: InputMethodType = 'conversational'
  name = 'Chat Interface'
  description = 'Natural language conversation with AI'

  async collect(): Promise<any> {
    throw new Error('Implementation pending - will be created in Phase 3')
  }

  validate(_data: any): ValidationResult {
    return { valid: false, errors: ['Not implemented'], warnings: [] }
  }

  transform(_data: any): TTravelRequirements {
    throw new Error('Implementation pending')
  }

  getMetadata(): InputMethodMetadata {
    throw new Error('Implementation pending')
  }

  reset() {
    // Implementation pending
  }
}

// Export singleton registry instance
export const inputMethodRegistry = new InputMethodRegistry()
export { InputMethodRegistry }
