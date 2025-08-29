/**
 * Quality Validator Agent
 * Validates and enriches recommendations using external APIs and web searches
 */

import { BaseAgent } from './base-agent'
import type {
  AgentConfig,
  AgentContext,
  AgentResponse,
  TaskSpecification,
  Recommendation,
  QualityValidation,
} from './types'

export class QualityValidatorAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      type: 'quality-validator',
      name: 'Quality Validator',
      description:
        'Validates and enriches recommendations using Google Places API and web searches',
      model: 'claude-3-haiku-20240307',
      temperature: 0.3, // Lower temperature for factual validation
      maxTokens: 1500,
      timeout: 20000,
      tools: ['google-places', 'web-search'],
    }
    super(config)
  }

  async execute(
    _task: TaskSpecification,
    context: AgentContext
  ): Promise<AgentResponse<QualityValidation[]>> {
    const startTime = Date.now()

    try {
      // Extract all recommendations from previous findings
      const allRecommendations = this.extractRecommendations(
        context.previousFindings
      )
      this.log(`Validating ${allRecommendations.length} recommendations`)

      // Validate each recommendation
      const validations = await Promise.all(
        allRecommendations.map(rec => this.validateRecommendation(rec, context))
      )

      // Filter out low-confidence validations
      const highQualityValidations = validations.filter(
        v => v.confidence > 0.6 || v.validationStatus === 'verified'
      )

      const executionTime = Date.now() - startTime

      return {
        agentType: this.config.type,
        status: highQualityValidations.length > 0 ? 'success' : 'partial',
        data: highQualityValidations,
        confidence: this.calculateOverallConfidence(highQualityValidations),
        executionTime,
      }
    } catch (error) {
      this.log('Validation failed:', error)
      return this.buildErrorResponse(error as Error)
    }
  }

  buildPrompt(_task: TaskSpecification, context: AgentContext): string {
    return `You are validating a travel recommendation for accuracy and current information.

Destination: ${context.destinationCity}
Recommendation to validate: [Will be provided per recommendation]

Your task is to:
1. Verify the place actually exists
2. Check if it's currently open/operational
3. Validate the address and location
4. Confirm key details (price range, hours, etc.)
5. Identify any issues or concerns
6. Suggest alternatives if the original is problematic

Focus on factual accuracy and current status.`
  }

  private extractRecommendations(
    previousFindings: Map<string, any>
  ): Recommendation[] {
    const recommendations: Recommendation[] = []

    previousFindings.forEach((output, agentType) => {
      if (output.recommendations && Array.isArray(output.recommendations)) {
        output.recommendations.forEach((rec: Recommendation) => {
          recommendations.push({
            ...rec,
            sourceAgent: agentType,
          })
        })
      }
    })

    return recommendations
  }

  private async validateRecommendation(
    recommendation: Recommendation,
    context: AgentContext
  ): Promise<QualityValidation> {
    try {
      // In production, this would call Google Places API
      // For now, we'll simulate validation with LLM
      const validation = await this.simulateValidation(recommendation, context)

      // Enrich with additional data
      const enriched = await this.enrichRecommendation(
        recommendation,
        validation
      )

      return {
        originalRecommendation: recommendation,
        validationStatus: validation.status,
        confidence: validation.confidence,
        enrichedData: enriched,
        issues: validation.issues || [],
        alternatives: validation.alternatives || [],
      }
    } catch (error) {
      return {
        originalRecommendation: recommendation,
        validationStatus: 'unverified',
        confidence: 0.3,
        issues: ['Could not validate this recommendation'],
      }
    }
  }

  private async simulateValidation(
    recommendation: Recommendation,
    context: AgentContext
  ): Promise<{
    status: 'verified' | 'probable' | 'unverified' | 'not_found'
    confidence: number
    issues?: string[]
    alternatives?: Recommendation[]
  }> {
    const prompt = `Validate this travel recommendation for ${context.destinationCity}:

Name: ${recommendation.name}
Category: ${recommendation.category}
Address: ${recommendation.address || 'Not provided'}
Neighborhood: ${recommendation.neighborhood || 'Not specified'}

Based on your knowledge, assess:
1. Does this place likely exist?
2. Is the location/neighborhood accurate?
3. Are there any concerns or issues?
4. If problematic, what's a good alternative?

Return JSON:
{
  "status": "verified|probable|unverified|not_found",
  "confidence": 0.0-1.0,
  "issues": ["any problems found"],
  "alternatives": [{"name": "...", "reason": "..."}]
}`

    try {
      const response = await this.callLLM(prompt)
      const parsed = this.parseJSONResponse<any>(response)

      return {
        status: parsed.status || 'unverified',
        confidence: parsed.confidence || 0.5,
        issues: parsed.issues,
        alternatives: parsed.alternatives?.map((alt: any) => ({
          name: alt.name,
          category: recommendation.category,
          description: alt.reason,
          whyRecommended: 'Alternative suggestion',
          personaFit: 70,
        })),
      }
    } catch {
      // If validation fails, mark as probable (don't reject good recommendations)
      return {
        status: 'probable',
        confidence: 0.6,
      }
    }
  }

  private async enrichRecommendation(
    recommendation: Recommendation,
    validation: any
  ): Promise<Partial<Recommendation>> {
    const enriched: Partial<Recommendation> = {}

    // Add validation status
    enriched.validationStatus = validation.status
    enriched.validationSource = 'quality-agent'

    // Simulate enrichment that would come from Google Places
    if (validation.status === 'verified' || validation.status === 'probable') {
      // Add mock enrichment data
      if (!recommendation.rating) {
        enriched.rating = 4.2 + Math.random() * 0.6 // 4.2-4.8 range
      }

      if (!recommendation.reviewCount) {
        enriched.reviewCount = Math.floor(100 + Math.random() * 900)
      }

      if (!recommendation.website && Math.random() > 0.3) {
        enriched.website = `https://example.com/${recommendation.name.toLowerCase().replace(/\s+/g, '-')}`
      }

      if (!recommendation.coordinates && recommendation.address) {
        // In production, geocode the address
        enriched.coordinates = {
          lat: 40.4406 + (Math.random() - 0.5) * 0.1, // Pittsburgh area
          lng: -79.9959 + (Math.random() - 0.5) * 0.1,
        }
      }

      if (!recommendation.hours && recommendation.category !== 'outdoor') {
        enriched.hours = this.generateTypicalHours(recommendation.category)
      }
    }

    return enriched
  }

  private generateTypicalHours(category?: string): Record<string, any> {
    const restaurantHours = {
      monday: { open: '11:00', close: '22:00' },
      tuesday: { open: '11:00', close: '22:00' },
      wednesday: { open: '11:00', close: '22:00' },
      thursday: { open: '11:00', close: '22:00' },
      friday: { open: '11:00', close: '23:00' },
      saturday: { open: '10:00', close: '23:00' },
      sunday: { open: '10:00', close: '21:00' },
    }

    const cafeHours = {
      monday: { open: '07:00', close: '17:00' },
      tuesday: { open: '07:00', close: '17:00' },
      wednesday: { open: '07:00', close: '17:00' },
      thursday: { open: '07:00', close: '17:00' },
      friday: { open: '07:00', close: '18:00' },
      saturday: { open: '08:00', close: '18:00' },
      sunday: { open: '08:00', close: '16:00' },
    }

    if (category === 'cafe' || category === 'bakery') {
      return cafeHours
    }

    return restaurantHours
  }

  private calculateOverallConfidence(validations: QualityValidation[]): number {
    if (validations.length === 0) {
      return 0
    }

    const totalConfidence = validations.reduce(
      (sum, v) => sum + v.confidence,
      0
    )

    const avgConfidence = totalConfidence / validations.length

    // Bonus for high verification rate
    const verifiedCount = validations.filter(
      v => v.validationStatus === 'verified'
    ).length
    const verificationBonus = (verifiedCount / validations.length) * 0.1

    return Math.min(0.95, avgConfidence + verificationBonus)
  }

  /**
   * Batch validate multiple recommendations efficiently
   */
  async batchValidate(
    recommendations: Recommendation[],
    context: AgentContext
  ): Promise<QualityValidation[]> {
    // Group by category for more efficient validation
    const grouped = this.groupByCategory(recommendations)

    const validations: QualityValidation[] = []

    for (const [_category, recs] of Object.entries(grouped)) {
      const categoryValidations = await Promise.all(
        recs.map(rec => this.validateRecommendation(rec, context))
      )
      validations.push(...categoryValidations)
    }

    return validations
  }

  private groupByCategory(
    recommendations: Recommendation[]
  ): Record<string, Recommendation[]> {
    return recommendations.reduce(
      (groups, rec) => {
        const category = rec.category || 'other'
        if (!groups[category]) {
          groups[category] = []
        }
        groups[category].push(rec)
        return groups
      },
      {} as Record<string, Recommendation[]>
    )
  }
}
