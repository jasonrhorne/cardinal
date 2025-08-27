/**
 * Experiment Router
 * Handles A/B testing variant assignment and analytics tracking
 */

import {
  InputMethodType,
  ConversionStage,
  ExperimentConfig,
  ExperimentResults,
} from '@/lib/input-methods/types'

// Default experiment configuration
const DEFAULT_EXPERIMENT: ExperimentConfig = {
  id: 'input-method-granularity-v1',
  name: 'Input Method Granularity Test',
  description: 'Test how input granularity affects AI agent performance',
  startDate: new Date('2025-08-27'),
  endDate: undefined as Date | undefined, // Open-ended
  trafficSplit: {
    'constrained-form': 50, // 50% for now (Phase 1)
    'guided-prompts': 50, // 50% for now (Phase 2)
    conversational: 0, // 0% until Phase 3
  },
  enabled: true,
}

// In-memory storage for development (will be replaced with Supabase)
interface UserAssignment {
  userId: string
  variant: InputMethodType
  assignedAt: Date
  completionStage: ConversionStage | null
}

class ExperimentRouter {
  private assignments = new Map<string, UserAssignment>()
  private currentExperiment = DEFAULT_EXPERIMENT

  // Assign variant to user based on experiment configuration
  async assignVariant(userId: string): Promise<InputMethodType> {
    // Check if user already has an assignment
    const existing = this.assignments.get(userId)
    if (existing) {
      return existing.variant
    }

    // Check if experiment is enabled
    if (!this.currentExperiment.enabled) {
      return 'constrained-form' // Default fallback
    }

    // Get enabled variants with their traffic splits
    const enabledVariants = Object.entries(
      this.currentExperiment.trafficSplit
    ).filter(([_, percentage]) => percentage > 0)

    if (enabledVariants.length === 0) {
      return 'constrained-form' // Fallback if no variants enabled
    }

    // Simple random assignment based on percentages
    const random = Math.random() * 100
    let cumulative = 0

    for (const [variant, percentage] of enabledVariants) {
      cumulative += percentage
      if (random <= cumulative) {
        const assignment: UserAssignment = {
          userId,
          variant: variant as InputMethodType,
          assignedAt: new Date(),
          completionStage: null,
        }

        this.assignments.set(userId, assignment)

        // In production, this would be stored in Supabase
        this.logAssignment(assignment)

        return assignment.variant
      }
    }

    // Fallback (shouldn't reach here)
    return (enabledVariants[0]?.[0] as InputMethodType) || 'constrained-form'
  }

  // Track conversion funnel stages
  async trackConversion(userId: string, stage: ConversionStage): Promise<void> {
    const assignment = this.assignments.get(userId)

    if (!assignment) {
      console.warn(
        `No assignment found for user ${userId} when tracking ${stage}`
      )
      return
    }

    // Update completion stage
    assignment.completionStage = stage

    // Log to analytics (in production, this would go to Supabase + analytics service)
    this.logConversion(userId, stage, assignment.variant)
  }

  // Get experiment results (for analytics dashboard)
  async getExperimentResults(): Promise<ExperimentResults> {
    const variantPerformance: ExperimentResults['variantPerformance'] =
      {} as Record<
        InputMethodType,
        {
          users: number
          completionRate: number
          averageTime: number
          satisfactionScore: number
          conversionRate: number
        }
      >

    // Calculate performance metrics for each variant
    for (const [variant] of Object.entries(
      this.currentExperiment.trafficSplit
    )) {
      const variantAssignments = Array.from(this.assignments.values()).filter(
        a => a.variant === variant
      )

      const totalUsers = variantAssignments.length
      const completedUsers = variantAssignments.filter(
        a => a.completionStage === 'requirements-submitted'
      ).length

      variantPerformance[variant as InputMethodType] = {
        users: totalUsers,
        completionRate:
          totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0,
        averageTime: 0, // TODO: Implement time tracking
        satisfactionScore: 0, // TODO: Implement satisfaction tracking
        conversionRate: 0, // TODO: Implement downstream conversion tracking
      }
    }

    return {
      experimentId: this.currentExperiment.id,
      totalUsers: this.assignments.size,
      variantPerformance,
      statisticalSignificance: false, // TODO: Implement statistical analysis
      recommendedVariant: undefined as InputMethodType | undefined, // TODO: Implement recommendation logic
    }
  }

  // Update experiment configuration
  updateExperiment(config: Partial<ExperimentConfig>): void {
    this.currentExperiment = { ...this.currentExperiment, ...config }
    console.log('Experiment configuration updated:', this.currentExperiment)
  }

  // Get current experiment configuration
  getCurrentExperiment(): ExperimentConfig {
    return { ...this.currentExperiment }
  }

  // Private logging methods (will be replaced with proper analytics)
  private logAssignment(assignment: UserAssignment): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Experiment] Assigned ${assignment.userId} to ${assignment.variant}`
      )
    }

    // TODO: Send to analytics service
    // await analytics.track('experiment_assignment', {
    //   userId: assignment.userId,
    //   experimentId: this.currentExperiment.id,
    //   variant: assignment.variant,
    //   timestamp: assignment.assignedAt
    // })
  }

  private logConversion(
    userId: string,
    stage: ConversionStage,
    variant: InputMethodType
  ): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Experiment] User ${userId} (${variant}) reached stage: ${stage}`
      )
    }

    // TODO: Send to analytics service
    // await analytics.track('experiment_conversion', {
    //   userId,
    //   experimentId: this.currentExperiment.id,
    //   variant,
    //   stage,
    //   timestamp: new Date()
    // })
  }

  // Development utilities
  clearAssignments(): void {
    this.assignments.clear()
    console.log('[Experiment] Cleared all user assignments')
  }

  getUserAssignment(userId: string): UserAssignment | undefined {
    return this.assignments.get(userId)
  }

  getAllAssignments(): UserAssignment[] {
    return Array.from(this.assignments.values())
  }
}

// Export singleton instance
export const experimentRouter = new ExperimentRouter()
export { ExperimentRouter }
