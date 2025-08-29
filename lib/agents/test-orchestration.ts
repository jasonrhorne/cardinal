/**
 * Test Harness for Agent Orchestration
 * Tests the multi-agent system with Pittsburgh PA
 */

import { orchestrator } from './orchestrator.ts'
import type { TTravelRequirements, PersonaProfile } from './types.ts'

// Test cases for different personas
export const pittsburghTestCases = {
  photographer: {
    requirements: {
      destination: 'Pittsburgh, PA',
      origin: 'New York, NY',
      duration: '3 days',
      travelers: 2,
      children: 0,
      budget: 'moderate',
      pace: 'moderate',
      interests: ['architecture', 'arts'],
      dietary: [],
      accessibility: [],
    } as unknown as TTravelRequirements,
    persona: {
      primary: 'photographer',
      interests: ['photography', 'architecture', 'street art', 'golden hour'],
      travelStyle: 'balanced',
      activityLevel: 'moderate',
      specialContext: 'Instagram content creator looking for unique shots',
    } as PersonaProfile,
  },

  foodie: {
    requirements: {
      destination: 'Pittsburgh, PA',
      origin: 'Chicago, IL',
      duration: '3 days',
      travelers: 2,
      children: 0,
      budget: 'moderate',
      pace: 'packed',
      interests: ['food-dining', 'shopping'],
      dietary: [],
      accessibility: [],
    } as unknown as TTravelRequirements,
    persona: {
      primary: 'foodie',
      interests: [
        'pierogies',
        'craft beer',
        'food markets',
        'chef-driven restaurants',
      ],
      travelStyle: 'balanced',
      activityLevel: 'packed',
      specialContext: 'Food blogger interested in Pittsburgh food renaissance',
    } as PersonaProfile,
  },

  family: {
    requirements: {
      destination: 'Pittsburgh, PA',
      origin: 'Philadelphia, PA',
      duration: '3 days',
      travelers: 4,
      children: 2,
      budget: 'budget',
      pace: 'relaxed',
      interests: ['culture-local-experiences', 'nature-outdoors'],
      dietary: [],
      accessibility: ['stroller-friendly'],
    } as unknown as TTravelRequirements,
    persona: {
      primary: 'family',
      interests: [
        'children museums',
        'outdoor activities',
        'educational experiences',
      ],
      travelStyle: 'budget',
      activityLevel: 'relaxed',
      specialContext: 'Traveling with 6 and 9 year old children',
    } as PersonaProfile,
  },

  culture: {
    requirements: {
      destination: 'Pittsburgh, PA',
      origin: 'Washington, DC',
      duration: '3 days',
      travelers: 1,
      children: 0,
      budget: 'luxury',
      pace: 'moderate',
      interests: ['history', 'architecture', 'arts'],
      dietary: [],
      accessibility: [],
    } as unknown as TTravelRequirements,
    persona: {
      primary: 'culture',
      interests: [
        'Andy Warhol',
        'Carnegie museums',
        'industrial history',
        'performing arts',
      ],
      travelStyle: 'luxury',
      activityLevel: 'moderate',
      specialContext: 'Art history professor on sabbatical',
    } as PersonaProfile,
  },
}

/**
 * Run orchestration test
 */
export async function testOrchestration(
  testCase: keyof typeof pittsburghTestCases = 'photographer'
) {
  console.log('🚀 Starting Agent Orchestration Test')
  console.log(`📍 Destination: Pittsburgh, PA`)
  console.log(`👤 Persona: ${testCase}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const { requirements, persona } = pittsburghTestCases[testCase]

  try {
    const startTime = Date.now()

    // Run orchestration
    const result = await orchestrator.generateItinerary(requirements, persona)

    const duration = Date.now() - startTime

    if (result.success) {
      console.log('✅ Orchestration Successful!')
      console.log(`⏱️  Total time: ${(duration / 1000).toFixed(1)} seconds`)
      console.log('\n📋 Itinerary Overview:')
      console.log(`   Destination: ${result.itinerary?.destination}`)
      console.log(`   Duration: ${result.itinerary?.duration}`)
      console.log(`   Days planned: ${result.itinerary?.days.length}`)
      console.log(`   Lodging options: ${result.itinerary?.lodging.length}`)

      // Display research summary
      if (result.rawResearch) {
        console.log('\n🔬 Research Summary:')
        result.rawResearch.forEach((output, agentType) => {
          console.log(
            `   ${agentType}: ${output.recommendations?.length || 0} recommendations (confidence: ${(output.confidence * 100).toFixed(0)}%)`
          )
        })
      }

      // Display validation summary
      if (result.validationReport) {
        const verified = result.validationReport.filter(
          v => v.validationStatus === 'verified'
        ).length
        const total = result.validationReport.length
        console.log(
          `\n✓ Validation: ${verified}/${total} recommendations verified`
        )
      }

      // Display cost estimates
      if (result.costs) {
        console.log('\n💰 Cost Estimates:')
        console.log(`   LLM Tokens: ${result.costs.llmTokens}`)
        console.log(`   API Calls: ${result.costs.apiCalls}`)
        console.log(`   Estimated Cost: $${result.costs.estimatedCost}`)
      }

      // Return full result for further inspection
      return result
    } else {
      console.error('❌ Orchestration Failed')
      console.log(
        `   Time before failure: ${(duration / 1000).toFixed(1)} seconds`
      )

      // Show conversation log for debugging
      if (result.conversationLog && result.conversationLog.length > 0) {
        console.log('\n📝 Conversation Log:')
        result.conversationLog.slice(-5).forEach(msg => {
          console.log(
            `   [${msg.from}→${msg.to}] ${msg.type}: ${JSON.stringify(msg.payload).substring(0, 100)}...`
          )
        })
      }

      return result
    }
  } catch (error) {
    console.error('💥 Test failed with error:', error)
    throw error
  }
}

/**
 * Run all test cases
 */
export async function testAllPersonas() {
  const results: Record<string, any> = {}

  for (const [persona, _] of Object.entries(pittsburghTestCases)) {
    console.log(`\n${'═'.repeat(50)}`)
    console.log(`Testing ${persona.toUpperCase()} persona`)
    console.log('═'.repeat(50))

    try {
      const result = await testOrchestration(
        persona as keyof typeof pittsburghTestCases
      )
      results[persona] = {
        success: result.success,
        time: result.totalExecutionTime,
        recommendations: result.rawResearch?.size || 0,
      }

      // Wait a bit between tests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      results[persona] = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Summary
  console.log(`\n${'═'.repeat(50)}`)
  console.log('SUMMARY')
  console.log('═'.repeat(50))
  Object.entries(results).forEach(([persona, result]) => {
    const status = result.success ? '✅' : '❌'
    const time = result.time ? `${(result.time / 1000).toFixed(1)}s` : 'N/A'
    console.log(`${status} ${persona}: ${time}`)
  })

  return results
}

/**
 * Quick test function for development
 */
export async function quickTest() {
  console.log('🧪 Quick Test - Photographer in Pittsburgh')

  const result = await orchestrator.generateItinerary(
    {
      destination: 'Pittsburgh, PA',
      origin: 'New York, NY',
      duration: '2 days',
      travelers: 1,
      children: 0,
      budget: 'moderate',
      pace: 'moderate',
      interests: ['architecture', 'arts'],
    } as unknown as TTravelRequirements,
    {
      primary: 'photographer',
      interests: ['photography', 'architecture', 'bridges'],
      travelStyle: 'balanced',
      activityLevel: 'moderate',
    }
  )

  if (result.success && result.itinerary) {
    console.log('\n📸 Photography Itinerary for Pittsburgh:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    result.itinerary.days.forEach(day => {
      console.log(`\nDay ${day.day}: ${day.theme}`)
      day.activities.forEach(activity => {
        console.log(`  ${activity.time}: ${activity.activity.name}`)
      })
      console.log('\n  Meals:')
      day.meals.forEach(meal => {
        console.log(`    • ${meal.name} (${meal.category})`)
      })
    })

    console.log('\n🏨 Lodging Options:')
    result.itinerary.lodging.forEach(hotel => {
      console.log(
        `  • ${hotel.name} - ${hotel.neighborhood} (${hotel.priceRange})`
      )
    })
  }

  return result
}
