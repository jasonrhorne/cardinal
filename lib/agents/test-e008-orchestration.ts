/**
 * E008 Multi-Agent Orchestration Test
 * Quick test to verify that real agents work together properly
 */

import type { TTravelRequirements } from '../schemas/travel-requirements'

import { AgentOrchestrator } from './orchestrator'

export async function testOrchestration(): Promise<void> {
  console.log('🧪 Testing E008 Multi-Agent Orchestration...')

  const testRequirements: TTravelRequirements = {
    originCity: 'San Francisco, CA',
    numberOfAdults: 2,
    numberOfChildren: 0,
    childrenAges: [],
    preferredTravelMethods: ['drive'],
    interests: ['food-dining', 'arts', 'nature-outdoors'],
    travelDurationLimits: {
      drive: 4,
    },
  }

  try {
    const orchestrator = new AgentOrchestrator()
    console.log('📋 Starting orchestration for Portland, OR trip...')

    const startTime = Date.now()
    const result = await orchestrator.generateItinerary({
      ...testRequirements,
      destination: 'Portland, OR',
      duration: '3 days',
    } as any)
    const totalTime = Date.now() - startTime

    console.log(`⏱️  Total orchestration time: ${totalTime}ms`)

    if (result.success && result.itinerary) {
      console.log('✅ Orchestration successful!')
      console.log(`📍 Destination: ${result.itinerary.destination}`)
      console.log(`📅 Duration: ${result.itinerary.duration}`)
      console.log(`🗓️  Days planned: ${result.itinerary.days.length}`)
      console.log(`🏨 Lodging options: ${result.itinerary.lodging.length}`)

      // Show first day preview
      if (result.itinerary.days.length > 0) {
        const firstDay = result.itinerary.days[0]
        if (firstDay) {
          console.log(`\n📋 Day 1 Preview:`)
          console.log(`  Theme: ${firstDay.theme || 'Exploration'}`)
          console.log(`  Activities: ${firstDay.activities?.length || 0}`)
          console.log(`  Meals: ${firstDay.meals?.length || 0}`)
        }
      }

      console.log(`\n📊 Performance:`)
      console.log(`  - Total execution: ${result.totalExecutionTime}ms`)
      console.log(`  - Messages: ${result.conversationLog?.length || 0}`)
      console.log(`  - Validations: ${result.validationReport?.length || 0}`)
    } else {
      console.log('❌ Orchestration failed')
      console.log('Details:', result)
    }
  } catch (error) {
    console.error('💥 Orchestration error:', error)
    throw error
  }
}

// Allow running this test directly
if (require.main === module) {
  testOrchestration()
    .then(() => {
      console.log('🎉 E008 test completed!')
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 E008 test failed:', error)
      process.exit(1)
    })
}
