/**
 * A/B Testing Service for Input Method Experimentation
 * Automatically assigns users to different input methods for testing
 */

import { InputMethodType } from '@/lib/input-methods/types'

export interface ABTestVariant {
  id: string
  name: string
  inputMethod: InputMethodType
  weight: number // 0-100 representing percentage of traffic
}

export interface ABTestConfig {
  id: string
  name: string
  description: string
  enabled: boolean
  variants: ABTestVariant[]
  startDate?: Date
  endDate?: Date
}

export class ABTestingService {
  private currentTest: ABTestConfig | null = null

  // Default test configuration for E007
  private readonly defaultTest: ABTestConfig = {
    id: 'e007-input-method-test',
    name: 'Input Method Effectiveness Test',
    description: 'Testing which input method produces best user outcomes',
    enabled: true,
    variants: [
      {
        id: 'variant-a',
        name: 'Structured Form (Control)',
        inputMethod: 'constrained-form',
        weight: 25,
      },
      {
        id: 'variant-b',
        name: 'Natural Language',
        inputMethod: 'open-text',
        weight: 25,
      },
      {
        id: 'variant-c',
        name: 'Guided Prompts',
        inputMethod: 'guided-prompts',
        weight: 25,
      },
      {
        id: 'variant-d',
        name: 'User Choice',
        inputMethod: 'constrained-form', // Default, but user can change
        weight: 25,
      },
    ],
  }

  constructor() {
    this.currentTest = this.defaultTest
  }

  /**
   * Get assigned variant for a user/session
   * Uses deterministic assignment based on session ID for consistency
   */
  getAssignedVariant(sessionId: string): ABTestVariant | null {
    if (!this.currentTest || !this.currentTest.enabled) {
      return null
    }

    // Check if test is within date range
    const now = new Date()
    if (this.currentTest.startDate && now < this.currentTest.startDate) {
      return null
    }
    if (this.currentTest.endDate && now > this.currentTest.endDate) {
      return null
    }

    // Deterministic assignment based on session ID
    const hash = this.hashString(sessionId)
    const bucket = hash % 100

    let cumulativeWeight = 0
    for (const variant of this.currentTest.variants) {
      cumulativeWeight += variant.weight
      if (bucket < cumulativeWeight) {
        return variant
      }
    }

    // Fallback to first variant
    return this.currentTest.variants[0] || null
  }

  /**
   * Get the input method for a session
   * Returns the assigned method or allows user choice for certain variants
   */
  getInputMethodForSession(sessionId: string): InputMethodType | 'user-choice' {
    const variant = this.getAssignedVariant(sessionId)

    if (!variant) {
      return 'user-choice' // No active test, let user choose
    }

    // Special handling for user choice variant
    if (variant.id === 'variant-d') {
      return 'user-choice'
    }

    return variant.inputMethod
  }

  /**
   * Check if a session should show method selection tabs
   */
  shouldShowMethodSelection(sessionId: string): boolean {
    const method = this.getInputMethodForSession(sessionId)
    return method === 'user-choice'
  }

  /**
   * Get test configuration for analytics
   */
  getCurrentTest(): ABTestConfig | null {
    return this.currentTest
  }

  /**
   * Update test configuration (for admin panel)
   */
  updateTestConfig(config: ABTestConfig): void {
    this.currentTest = config
  }

  /**
   * Enable/disable current test
   */
  setTestEnabled(enabled: boolean): void {
    if (this.currentTest) {
      this.currentTest.enabled = enabled
    }
  }

  /**
   * Get variant distribution statistics
   */
  getVariantDistribution(): Record<string, number> {
    if (!this.currentTest) {
      return {}
    }

    const distribution: Record<string, number> = {}
    for (const variant of this.currentTest.variants) {
      distribution[variant.name] = variant.weight
    }
    return distribution
  }

  /**
   * Simple string hash function for deterministic assignment
   */
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}

// Export singleton instance
export const abTestingService = new ABTestingService()

// React hook for using A/B testing
export function useABTesting(sessionId: string) {
  const getAssignedVariant = () => {
    return abTestingService.getAssignedVariant(sessionId)
  }

  const getInputMethod = (): InputMethodType | 'user-choice' => {
    return abTestingService.getInputMethodForSession(sessionId)
  }

  const shouldShowSelection = (): boolean => {
    return abTestingService.shouldShowMethodSelection(sessionId)
  }

  const getCurrentTest = () => {
    return abTestingService.getCurrentTest()
  }

  return {
    getAssignedVariant,
    getInputMethod,
    shouldShowSelection,
    getCurrentTest,
  }
}
