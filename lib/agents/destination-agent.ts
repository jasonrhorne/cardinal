/**
 * Destination Research Agent
 * Discovers and recommends travel destinations based on user requirements
 */

import { BaseAgent } from './base-agent'
import type {
  AgentResponse,
  AgentContext,
  TaskSpecification,
  TTravelRequirements,
} from './types'

export interface DestinationRecommendation {
  city: string
  state: string
  country: string
  distance: {
    miles: number
    driveTime: string
    flightTime?: string
  }
  highlights: string[]
  rationale: string
  bestTimeToVisit?: string
  keyAttractions: string[]
  vibe: string
  perfectFor: string[]
}

export interface DestinationResearchOutput {
  destinations: DestinationRecommendation[]
  reasoning: string
}

export class DestinationAgent extends BaseAgent {
  constructor() {
    super({
      type: 'concierge' as AgentType, // Using concierge as closest match
      name: 'Destination Research Agent',
      description: 'Travel destination discovery and recommendation specialist',
      model: 'claude-3-haiku-20240307',
      temperature: 0.7,
      maxTokens: 2000,
    })
  }

  buildPrompt(task: TaskSpecification, context: AgentContext): string {
    const requirements = context.userRequirements
    const hasChildren = requirements.numberOfChildren > 0
    const interests = requirements.interests || []
    const travelMethods = requirements.preferredTravelMethods || ['drive']

    return `
You are a travel destination expert helping someone find the perfect weekend getaway destination.

REQUIREMENTS:
- Origin: ${requirements.originCity}
- Travelers: ${requirements.numberOfAdults} adults${hasChildren ? `, ${requirements.numberOfChildren} children (ages: ${requirements.childrenAges.map(c => c.age).join(', ')})` : ''}
- Interests: ${interests.join(', ')}
- Travel Methods: ${travelMethods.join(', ')}
- Maximum Travel Time: ${this.getMaxTravelTime(requirements)}
- Travel Style: ${context.personaProfile.travelStyle}
- Activity Level: ${context.personaProfile.activityLevel}

Suggest 3-7 destinations that match these requirements.
`
  }

  async execute(
    task: TaskSpecification,
    context: AgentContext
  ): Promise<AgentResponse> {
    const startTime = Date.now()

    try {
      // Generate destination recommendations
      const destinations = await this.discoverDestinations(context)

      const response: AgentResponse = {
        agentType: this.config.type,
        status: destinations.destinations.length > 0 ? 'success' : 'failed',
        data: destinations,
        confidence: this.calculateConfidence(destinations),
        executionTime: Date.now() - startTime,
      }

      return response
    } catch (error) {
      return {
        agentType: this.config.type,
        status: 'failed',
        data: null,
        confidence: 0,
        executionTime: Date.now() - startTime,
        fallbackReason: (error as Error).message,
      }
    }
  }

  private async discoverDestinations(
    context: AgentContext
  ): Promise<DestinationResearchOutput> {
    const requirements = context.userRequirements
    const hasChildren = requirements.numberOfChildren > 0
    const interests = requirements.interests || []

    // Generate prompt for destination discovery (using buildPrompt method)
    const prompt = `
You are a travel destination expert helping someone find the perfect weekend getaway destination.

REQUIREMENTS:
- Origin: ${requirements.originCity}
- Travelers: ${requirements.numberOfAdults} adults${hasChildren ? `, ${requirements.numberOfChildren} children (ages: ${requirements.childrenAges.map(c => c.age).join(', ')})` : ''}
- Interests: ${interests.join(', ')}
- Travel Methods: ${travelMethods.join(', ')}
- Maximum Travel Time: ${this.getMaxTravelTime(requirements)}
- Travel Style: ${context.personaProfile.travelStyle}
- Activity Level: ${context.personaProfile.activityLevel}

Suggest 3-7 destinations that match these requirements. Focus on places that are:
1. Within reasonable travel distance/time from the origin
2. Well-suited to the stated interests
3. Appropriate for the travel party composition
4. Offer unique experiences worth traveling for

For each destination, provide:
- City, State, Country
- Approximate distance and travel time from origin
- 3-4 key highlights that make it special
- A compelling rationale for why this destination matches their preferences
- 3-5 specific attractions/experiences they shouldn't miss
- The overall vibe/character of the place
- Who it's perfect for

Format your response as a JSON array of destinations.
`

    try {
      // In a real implementation, this would call the LLM
      // For now, return mock data based on origin
      const mockDestinations = await this.generateMockDestinations(
        requirements.originCity,
        interests,
        hasChildren
      )

      return {
        destinations: mockDestinations,
        reasoning: `Based on your origin in ${requirements.originCity} and interests in ${interests.join(', ')}, I've identified destinations that offer unique experiences within your travel parameters.`,
      }
    } catch (error) {
      console.error('Failed to discover destinations:', error)
      throw error
    }
  }

  private buildTravelPreferences(requirements: TTravelRequirements): string {
    const parts = []

    if (requirements.interests.includes('food-dining')) {
      parts.push('culinary experiences')
    }
    if (requirements.interests.includes('arts')) {
      parts.push('art and cultural attractions')
    }
    if (requirements.interests.includes('nature-outdoors')) {
      parts.push('outdoor activities and natural beauty')
    }
    if (requirements.interests.includes('history')) {
      parts.push('historical sites and museums')
    }
    if (requirements.numberOfChildren > 0) {
      parts.push('family-friendly activities')
    }

    return parts.join(', ')
  }

  private getMaxTravelTime(requirements: TTravelRequirements): string {
    const limits = requirements.travelDurationLimits || {}
    const methods = requirements.preferredTravelMethods || ['drive']

    const times = methods.map(method => {
      const limit = limits[method] || (method === 'drive' ? 4 : 2)
      return `${limit} hours by ${method}`
    })

    return times.join(' or ')
  }

  private async generateMockDestinations(
    origin: string,
    interests: string[],
    hasChildren: boolean
  ): Promise<DestinationRecommendation[]> {
    // Mock destinations based on common origins
    const destinationMap: Record<string, DestinationRecommendation[]> = {
      'San Francisco': [
        {
          city: 'Carmel-by-the-Sea',
          state: 'California',
          country: 'USA',
          distance: {
            miles: 120,
            driveTime: '2 hours',
          },
          highlights: [
            'Stunning coastal scenery along Highway 1',
            'Charming European-style village atmosphere',
            'World-class restaurants and wine tasting',
            'Beautiful white sand beach',
          ],
          rationale:
            'Perfect for a romantic coastal escape with incredible food, art galleries, and scenic beauty just 2 hours from San Francisco.',
          keyAttractions: [
            'Scenic 17-Mile Drive',
            'Point Lobos State Natural Reserve',
            'Carmel Beach',
            'Carmel Mission',
            'Ocean Avenue shopping and dining',
          ],
          vibe: 'Romantic, artistic, upscale coastal village',
          perfectFor: [
            'Couples',
            'Art lovers',
            'Food enthusiasts',
            'Beach lovers',
          ],
        },
        {
          city: 'Napa',
          state: 'California',
          country: 'USA',
          distance: {
            miles: 50,
            driveTime: '1 hour',
          },
          highlights: [
            'World-renowned wine country',
            'Michelin-starred restaurants',
            'Hot air balloon rides over vineyards',
            'Luxurious spa resorts',
          ],
          rationale:
            'An hour north of SF, Napa Valley offers world-class wine, dining, and relaxation in a beautiful valley setting.',
          keyAttractions: [
            'Castello di Amorosa',
            'Oxbow Public Market',
            'Wine train experience',
            'Calistoga hot springs',
            'Downtown Napa restaurants',
          ],
          vibe: 'Sophisticated, relaxed, wine-focused luxury',
          perfectFor: ['Wine lovers', 'Foodies', 'Couples', 'Spa enthusiasts'],
        },
        {
          city: 'Santa Cruz',
          state: 'California',
          country: 'USA',
          distance: {
            miles: 75,
            driveTime: '1.5 hours',
          },
          highlights: [
            'Classic beach boardwalk with amusement park',
            'Redwood forests and hiking trails',
            'Surfing and beach activities',
            'Family-friendly attractions',
          ],
          rationale:
            'A quintessential California beach town with something for everyone - beaches, redwoods, and the famous boardwalk.',
          keyAttractions: [
            'Santa Cruz Beach Boardwalk',
            'Natural Bridges State Beach',
            'Roaring Camp Railroad',
            'Mystery Spot',
            'Downtown Pacific Avenue',
          ],
          vibe: 'Laid-back, beachy, family-friendly fun',
          perfectFor: [
            'Families',
            'Beach lovers',
            'Surfers',
            'Nature enthusiasts',
          ],
        },
      ],
      'New York': [
        {
          city: 'Hudson',
          state: 'New York',
          country: 'USA',
          distance: {
            miles: 120,
            driveTime: '2.5 hours',
            flightTime: 'N/A',
          },
          highlights: [
            'Antique shops and art galleries',
            'Farm-to-table restaurants',
            'Historic architecture',
            'Hudson River views',
          ],
          rationale:
            'A perfect weekend escape from NYC with small-town charm, great food, and cultural attractions in the Hudson Valley.',
          keyAttractions: [
            'Warren Street antiques row',
            'FASNY Museum of Firefighting',
            'Olana State Historic Site',
            'Hudson Farmers Market',
            'Basilica Hudson arts center',
          ],
          vibe: 'Artsy, historic, upstate charm',
          perfectFor: [
            'Art lovers',
            'Antique hunters',
            'Foodies',
            'History buffs',
          ],
        },
      ],
    }

    // Return destinations for the origin, or default set
    const destinations =
      destinationMap[origin] || destinationMap['San Francisco']

    // Filter based on interests if needed
    if (hasChildren) {
      return destinations.filter(
        d =>
          d.perfectFor.includes('Families') ||
          d.highlights.some(h => h.toLowerCase().includes('family'))
      )
    }

    return destinations.slice(0, 5) // Return up to 5 destinations
  }

  private calculateConfidence(output: DestinationResearchOutput): number {
    // Calculate confidence based on number of destinations found
    const destinationCount = output.destinations.length

    if (destinationCount >= 5) {
      return 0.95
    }
    if (destinationCount >= 3) {
      return 0.85
    }
    if (destinationCount >= 1) {
      return 0.7
    }
    return 0.3
  }
}
