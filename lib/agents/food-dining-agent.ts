/**
 * Food & Dining Research Agent
 * Discovers exceptional dining experiences aligned with traveler preferences
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

export class FoodDiningAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      type: 'food-dining',
      name: 'Food & Dining Curator',
      description:
        'Culinary expert finding authentic, memorable dining experiences',
      model: 'claude-3-haiku-20240307',
      temperature: 0.7,
      maxTokens: 2500,
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
      const response = await this.executeWithRetry(
        () => this.callLLM(prompt),
        2
      )

      const parsed = this.parseJSONResponse<{
        recommendations: Recommendation[]
        reasoning: string
      }>(response)

      const recommendations = this.categorizeDining(
        parsed.recommendations,
        context
      )

      const executionTime = Date.now() - startTime

      return {
        agentType: this.config.type,
        status: 'success',
        data: {
          agentType: 'food-dining',
          status: 'success',
          recommendations,
          confidence: this.assessDiningConfidence(recommendations, context),
          reasoning: parsed.reasoning,
          warnings: this.getDietaryWarnings(context) || [],
        },
        confidence: 0.88,
        executionTime,
      }
    } catch (error) {
      this.log('Food research failed:', error)
      return this.buildFallbackResponse(
        {
          agentType: 'food-dining',
          status: 'partial',
          recommendations: this.getFallbackDining(context),
          confidence: 0.5,
          reasoning: 'Using general recommendations',
        },
        'Could not generate personalized dining options'
      )
    }
  }

  buildPrompt(task: TaskSpecification, context: AgentContext): string {
    const { destinationCity, personaProfile, constraints } = context

    return `You are a culinary expert curating dining experiences in ${destinationCity}.

TRAVELER PROFILE:
${this.formatPersonaContext(context)}

TASK: ${task.description}

Find 6-8 exceptional dining experiences that match this traveler's style and interests.

For a ${personaProfile.primary} traveler, emphasize:
${this.getPersonaDiningFocus(personaProfile.primary)}

REQUIREMENTS:
- Mix of meal types (breakfast, lunch, dinner, cafes, markets)
- Range from must-visit icons to hidden local gems
- Consider dietary restrictions: ${constraints.dietary?.join(', ') || 'None specified'}
- Budget level: ${constraints.budget || 'moderate'}
- Include why each place is special for THIS traveler
- Practical details (reservations, best times, what to order)

Return JSON with this structure:
{
  "recommendations": [
    {
      "name": "Restaurant/Venue Name",
      "category": "fine-dining|casual|cafe|market|street-food|bakery|bar",
      "description": "Vivid description of the experience",
      "whyRecommended": "Specific appeal for this traveler",
      "personaFit": 85,
      "cuisine": "Cuisine type",
      "neighborhood": "Area name",
      "address": "Full address",
      "priceRange": "$-$$$$",
      "mealType": ["breakfast", "lunch", "dinner"],
      "mustTry": ["Signature dish 1", "Signature dish 2"],
      "bestTimeToVisit": "Specific timing advice",
      "reservationRequired": true/false,
      "localTip": "Insider advice"
    }
  ],
  "reasoning": "Overall dining strategy for this itinerary"
}`
  }

  private getPersonaDiningFocus(persona: string): string {
    const focuses: Record<string, string> = {
      photographer: `
- Photogenic venues with great lighting
- Instagram-worthy presentations
- Scenic views or unique interiors
- Markets and food halls for documentary shots
- Atmospheric cafes for people watching`,
      foodie: `
- Chef-driven restaurants with tasting menus
- Authentic local specialties
- Hidden gems only locals know
- Markets for ingredients and tastings
- Innovative culinary techniques
- Natural wine bars and craft cocktails`,
      adventurer: `
- Quick, energizing breakfast spots
- Portable lunch options for day trips
- High-protein, healthy options
- Late-night spots after activities
- Local street food experiences`,
      culture: `
- Historic restaurants with stories
- Traditional preparation methods
- Family-run establishments
- Places where locals gather
- Cultural significance of dishes`,
      family: `
- Kid-friendly atmospheres
- Flexible menus for picky eaters
- Quick service options
- Outdoor seating when possible
- Entertainment or activities for children`,
      balanced: `
- Mix of trendy and traditional
- Good value for quality
- Convenient locations
- Reliable crowd-pleasers
- Variety of cuisines`,
    }

    return focuses[persona] || focuses.balanced
  }

  private categorizeDining(
    recommendations: Recommendation[],
    context: AgentContext
  ): Recommendation[] {
    const categorized = recommendations.map(rec => {
      const enhanced = {
        ...rec,
        category: rec.category || 'restaurant',
        personaFit: rec.personaFit || this.calculateDiningFit(rec, context),
      }

      // Add meal type if not specified
      if (!enhanced.mealType) {
        enhanced.mealType = this.inferMealType(enhanced)
      }

      return enhanced
    })

    // Ensure variety in meal types
    return this.balanceMealTypes(categorized)
  }

  private calculateDiningFit(
    recommendation: Recommendation,
    context: AgentContext
  ): number {
    let score = 75

    const desc = (
      recommendation.description + recommendation.whyRecommended
    ).toLowerCase()

    // Persona-specific boosts
    if (context.personaProfile.primary === 'foodie') {
      if (
        desc.includes('chef') ||
        desc.includes('tasting') ||
        desc.includes('innovative')
      ) {
        score += 15
      }
    }

    if (context.personaProfile.primary === 'photographer') {
      if (
        desc.includes('view') ||
        desc.includes('aesthetic') ||
        desc.includes('photogenic')
      ) {
        score += 10
      }
    }

    // Interest matches
    context.personaProfile.interests.forEach(interest => {
      if (desc.includes(interest.toLowerCase())) {
        score += 5
      }
    })

    return Math.min(100, score)
  }

  private inferMealType(rec: Recommendation): string[] {
    const desc = rec.description.toLowerCase()
    const category = rec.category?.toLowerCase() || ''

    const mealTypes = []

    if (
      category === 'cafe' ||
      desc.includes('coffee') ||
      desc.includes('breakfast')
    ) {
      mealTypes.push('breakfast')
    }
    if (
      category === 'bakery' ||
      desc.includes('pastry') ||
      desc.includes('brunch')
    ) {
      mealTypes.push('breakfast')
    }
    if (!category.includes('bar') && !desc.includes('cocktail')) {
      mealTypes.push('lunch')
    }
    if (category !== 'cafe' && category !== 'bakery') {
      mealTypes.push('dinner')
    }

    return mealTypes.length > 0 ? mealTypes : ['lunch', 'dinner']
  }

  private balanceMealTypes(
    recommendations: Recommendation[]
  ): Recommendation[] {
    const byMealType: Record<string, number> = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
    }

    recommendations.forEach(rec => {
      rec.mealType?.forEach(type => {
        if (type in byMealType) {
          const key = type as keyof typeof byMealType
          byMealType[key] = (byMealType[key] || 0) + 1
        }
      })
    })

    // Ensure at least 2 of each meal type
    if ((byMealType.breakfast || 0) < 2) {
      this.log('Warning: Not enough breakfast options')
    }
    if ((byMealType.dinner || 0) < 3) {
      this.log('Warning: Not enough dinner options')
    }

    return recommendations
  }

  private assessDiningConfidence(
    recommendations: Recommendation[],
    context: AgentContext
  ): number {
    if (recommendations.length < 4) {
      return 0.5
    }
    if (recommendations.length > 10) {
      return 0.7
    } // Too many, less focused

    const avgFit =
      recommendations.reduce((sum, rec) => sum + (rec.personaFit || 0), 0) /
      recommendations.length

    const hasDietary =
      context.constraints.dietary && context.constraints.dietary.length > 0
    const dietaryPenalty = hasDietary ? 0.1 : 0 // Less confident with restrictions

    return Math.max(0.4, Math.min(0.95, avgFit / 100 - dietaryPenalty))
  }

  private getDietaryWarnings(context: AgentContext): string[] | undefined {
    const warnings: string[] = []

    if (context.constraints.dietary?.includes('vegetarian')) {
      warnings.push(
        'Vegetarian options may be limited at some traditional venues'
      )
    }
    if (context.constraints.dietary?.includes('gluten-free')) {
      warnings.push('Call ahead to confirm gluten-free options')
    }
    if (
      context.constraints.dietary?.includes('kosher') ||
      context.constraints.dietary?.includes('halal')
    ) {
      warnings.push(
        'Dietary certification should be verified directly with venues'
      )
    }

    return warnings.length > 0 ? warnings : undefined
  }

  private getFallbackDining(_context: AgentContext): Recommendation[] {
    return [
      {
        name: 'Popular Local Restaurant',
        category: 'casual',
        description: 'Well-reviewed local favorite',
        whyRecommended: 'Consistently good reviews from visitors',
        personaFit: 60,
        neighborhood: 'City Center',
        priceRange: '$$',
        mealType: ['lunch', 'dinner'],
      },
      {
        name: 'Breakfast Cafe',
        category: 'cafe',
        description: 'Cozy morning spot',
        whyRecommended: 'Great way to start the day',
        personaFit: 65,
        neighborhood: 'Downtown',
        priceRange: '$',
        mealType: ['breakfast'],
      },
      {
        name: 'Local Market',
        category: 'market',
        description: 'Food hall with various vendors',
        whyRecommended: 'Variety of options for different tastes',
        personaFit: 70,
        neighborhood: 'Market District',
        priceRange: '$-$$',
        mealType: ['lunch'],
      },
    ]
  }
}
