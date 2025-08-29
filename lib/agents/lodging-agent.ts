/**
 * Lodging Research Agent
 * Specializes in finding unique, persona-aligned accommodations
 */

import { BaseAgent } from './base-agent'
import type {
  AgentConfig,
  AgentContext,
  AgentResponse,
  TaskSpecification,
  ResearchOutput,
  Recommendation,
} from './types'

export class LodgingAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      type: 'lodging',
      name: 'Lodging Specialist',
      description:
        'Expert in finding unique accommodations that match traveler personas and preferences',
      model: 'claude-3-haiku-20240307',
      temperature: 0.6,
      maxTokens: 2000,
      timeout: 15000,
    }
    super(config)
  }

  async execute(
    task: TaskSpecification,
    context: AgentContext
  ): Promise<AgentResponse<ResearchOutput>> {
    const startTime = Date.now()

    try {
      const prompt = this.buildPrompt(task, context)
      const response = await this.executeWithTimeout(
        () => this.callLLM(prompt),
        this.config.timeout
      )

      const parsed = this.parseJSONResponse<{
        recommendations: Recommendation[]
        reasoning: string
      }>(response)

      const recommendations = this.enhanceRecommendations(
        parsed.recommendations,
        context
      )

      const executionTime = Date.now() - startTime

      return {
        agentType: this.config.type,
        status: 'success',
        data: {
          agentType: 'lodging',
          status: 'success',
          recommendations,
          confidence: this.calculateConfidence(recommendations, context),
          reasoning: parsed.reasoning,
        },
        confidence: 0.85,
        executionTime,
      }
    } catch (error) {
      this.log('Lodging research failed:', error)
      return this.buildFallbackResponse(
        {
          agentType: 'lodging',
          status: 'partial',
          recommendations: this.getFallbackLodging(context),
          confidence: 0.5,
          reasoning: 'Using fallback recommendations due to error',
        },
        'Failed to get personalized recommendations'
      )
    }
  }

  buildPrompt(task: TaskSpecification, context: AgentContext): string {
    const { destinationCity, personaProfile, constraints } = context

    return `You are a lodging specialist finding accommodations in ${destinationCity}.

TRAVELER PROFILE:
${this.formatPersonaContext(context)}

TASK: ${task.description}

Find 3-5 unique lodging options that perfectly match this traveler's persona and style.

For a ${personaProfile.primary} traveler, prioritize:
${this.getPersonaLodgingPriorities(personaProfile.primary)}

REQUIREMENTS:
- Mix of accommodation types (boutique hotels, unique stays, local gems)
- Clear explanation of why each matches the traveler
- Specific neighborhoods that align with their interests
- Practical details (transit access, walkability)
- Price ranges that match ${constraints.budget || 'moderate'} budget

Return JSON with this structure:
{
  "recommendations": [
    {
      "name": "Hotel/Property Name",
      "category": "boutique-hotel|unique-stay|luxury|budget|hostel",
      "description": "Detailed description focusing on unique features",
      "whyRecommended": "Specific reasons this matches the traveler",
      "personaFit": 90,
      "neighborhood": "Neighborhood name",
      "address": "Full address",
      "priceRange": "$-$$$$",
      "highlights": ["Notable feature 1", "Notable feature 2"],
      "walkability": "High|Medium|Low",
      "nearbyAttractions": ["Attraction 1", "Attraction 2"]
    }
  ],
  "reasoning": "Overall strategy for these selections"
}`
  }

  private getPersonaLodgingPriorities(persona: string): string {
    const priorities: Record<string, string> = {
      photographer: `
- Rooms with great views and natural light
- Architecturally interesting buildings
- Photogenic neighborhoods with character
- Rooftop access or scenic terraces`,
      foodie: `
- Walking distance to restaurant districts
- Properties with notable dining programs
- Near local markets and food halls
- Kitchen facilities for market purchases`,
      adventurer: `
- Easy access to outdoor activities
- Gear storage capabilities
- Early breakfast options
- Flexible check-in/out times`,
      culture: `
- Historic properties with stories
- Near museums and cultural sites
- Architecturally significant buildings
- Local art in common areas`,
      family: `
- Family rooms or connecting rooms
- Kid-friendly amenities
- Safe, walkable neighborhoods
- Near parks and family attractions`,
      balanced: `
- Central location with good transit
- Mix of comfort and character
- Reasonable prices with good value
- Versatile neighborhood options`,
    }

    return priorities[persona] || priorities.balanced
  }

  private enhanceRecommendations(
    recommendations: Recommendation[],
    context: AgentContext
  ): Recommendation[] {
    return recommendations.map(
      rec =>
        ({
          ...rec,
          personaFit: this.calculatePersonaFit(rec, context),
          validationStatus: 'unverified' as const,
          category: rec.category || 'lodging',
        }) as Recommendation
    )
  }

  private calculatePersonaFit(
    recommendation: Recommendation,
    context: AgentContext
  ): number {
    let score = 70 // Base score

    // Boost for matching interests
    const description = recommendation.description.toLowerCase()
    context.personaProfile.interests.forEach(interest => {
      if (description.includes(interest.toLowerCase())) {
        score += 5
      }
    })

    // Boost for good reasoning
    if (
      recommendation.whyRecommended &&
      recommendation.whyRecommended.length > 50
    ) {
      score += 10
    }

    return Math.min(100, score)
  }

  private calculateConfidence(
    recommendations: Recommendation[],
    _context: AgentContext
  ): number {
    if (recommendations.length === 0) {
      return 0.3
    }
    if (recommendations.length < 3) {
      return 0.6
    }

    const avgPersonaFit =
      recommendations.reduce((sum, rec) => sum + (rec.personaFit || 0), 0) /
      recommendations.length

    return Math.min(0.95, avgPersonaFit / 100)
  }

  private getFallbackLodging(_context: AgentContext): Recommendation[] {
    return [
      {
        name: 'Boutique Hotel in City Center',
        category: 'boutique-hotel',
        description: 'Well-located hotel with local character',
        whyRecommended: 'Central location provides easy access to attractions',
        personaFit: 60,
        neighborhood: 'Downtown',
        priceRange: '$$-$$$',
      },
      {
        name: 'Historic Inn',
        category: 'unique-stay',
        description: 'Charming property with local history',
        whyRecommended: 'Offers authentic local experience',
        personaFit: 65,
        neighborhood: 'Historic District',
        priceRange: '$$',
      },
    ]
  }
}
