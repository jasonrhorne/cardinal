/**
 * LangChain Prompt Templates for Travel Use Cases
 * Structured prompts for destination suggestions and itinerary generation
 */

import {
  PromptTemplate,
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from '@langchain/core/prompts'
import { z } from 'zod'

// Input schemas for prompt templates
export const destinationSuggestionInputSchema = z.object({
  origin: z.string(),
  duration: z.number().positive().max(30),
  travelers: z.number().positive().max(20).default(2),
  interests: z.array(z.string()).min(1),
  budget: z.string().optional(),
  pace: z.enum(['relaxed', 'moderate', 'active']).default('moderate'),
  persona: z.string().optional(),
})

export const itineraryGenerationInputSchema = z.object({
  destination: z.string(),
  duration: z.number().positive().max(30),
  travelers: z.number().positive().max(20).default(2),
  interests: z.array(z.string()).min(1),
  budget: z.string().optional(),
  pace: z.enum(['relaxed', 'moderate', 'active']).default('moderate'),
  persona: z.string().optional(),
  accommodationPreference: z.string().optional(),
  transportationMode: z
    .enum(['walking', 'public', 'rideshare', 'rental', 'mixed'])
    .default('mixed'),
})

export type TDestinationSuggestionInput = z.infer<
  typeof destinationSuggestionInputSchema
>
export type TItineraryGenerationInput = z.infer<
  typeof itineraryGenerationInputSchema
>

// Destination suggestion prompt template
export const destinationSuggestionPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`You are an expert travel advisor{persona} with deep knowledge of unique, culturally-rich destinations worldwide. Your specialty is recommending distinctive, less obvious places that match traveler interests perfectly.

Key principles:
- Focus on authentic, local experiences over tourist traps
- Consider practical logistics (travel time, visa requirements, seasonality)
- Match recommendations precisely to stated interests
- Provide actionable, specific information
- Balance well-known gems with hidden discoveries`),

  HumanMessagePromptTemplate.fromTemplate(`Suggest 5 unique travel destinations from {origin} for a {duration}-day trip.

Traveler Profile:
- Travelers: {travelers} people
- Interests: {interests}
- Budget: {budget}
- Travel Pace: {pace}

For each destination, provide:
- Destination name and brief description
- Why it's perfect for their specific interests
- Best time to visit and seasonal considerations
- 3-4 unique experiences available there
- Rough cost estimate and budget considerations
- Travel logistics from {origin} (flights, visas, etc.)
- Recommended duration and ideal pace

Focus on destinations that offer distinctive experiences matching their interests, avoiding generic tourist recommendations.`),
])

// Itinerary generation prompt template
export const itineraryGenerationPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`You are an expert travel concierge{persona} who creates detailed, practical itineraries. You specialize in crafting day-by-day plans that balance must-see experiences with authentic local culture.

Key principles:
- Create realistic, well-paced daily schedules
- Include specific restaurant and venue recommendations
- Consider travel times between locations
- Mix planned activities with flexibility for spontaneity
- Account for practical needs (rest, meals, logistics)
- Provide insider tips and local knowledge`),

  HumanMessagePromptTemplate.fromTemplate(`Create a detailed {duration}-day itinerary for {destination}.

Traveler Profile:
- Travelers: {travelers} people  
- Interests: {interests}
- Budget: {budget}
- Pace: {pace}
- Accommodation: {accommodationPreference}
- Transportation: {transportationMode}

Structure your itinerary with:

**Day X - [Theme/Area]**
- **Morning (9:00-12:00):** Activity with specific timing
- **Lunch (12:00-14:00):** Restaurant recommendation with why it's special
- **Afternoon (14:00-17:00):** Activity or experience
- **Evening (17:00-20:00):** Activity, rest, or preparation
- **Dinner (20:00+):** Restaurant with cuisine type and atmosphere
- **Optional Evening:** Suggested optional activities

For each day include:
- Logistics notes (transportation, booking requirements)
- Budget estimates for major expenses
- Insider tips and local customs
- Weather/seasonal considerations
- Alternative options if places are closed/busy

End with:
- **Getting Around:** Transportation summary
- **Budget Summary:** Estimated costs breakdown
- **Local Tips:** Cultural insights and practical advice
- **Emergency Contacts:** Useful local information`),
])

// Refinement prompt template
export const itineraryRefinementPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`You are a travel concierge assistant helping refine and improve an existing itinerary based on user feedback. You excel at making targeted adjustments while maintaining the overall flow and balance of the trip.

Key principles:
- Make specific changes requested by the user
- Maintain logical flow and realistic timing
- Suggest complementary adjustments when needed
- Preserve what's working well in the original itinerary
- Provide clear explanations for changes made`),

  HumanMessagePromptTemplate.fromTemplate(`Please refine this itinerary based on the user's feedback:

**Original Itinerary:**
{originalItinerary}

**User Feedback/Request:**
{userFeedback}

**Traveler Context:**
- Destination: {destination}
- Duration: {duration} days
- Travelers: {travelers} people
- Interests: {interests}
- Budget: {budget}

Please provide:
1. **Updated Itinerary:** The revised version with requested changes
2. **Changes Made:** Clear summary of what was modified and why
3. **Impact Notes:** How changes affect timing, budget, or other aspects
4. **Additional Suggestions:** Complementary improvements that enhance the changes`),
])

// Prompt template for structured JSON responses
export const structuredResponsePrompt = PromptTemplate.fromTemplate(
  `{basePrompt}

IMPORTANT: Respond with valid JSON only that matches this exact schema:
{schema}

No additional text, explanations, or formatting outside the JSON structure.`
)

// Helper function to create persona-enhanced prompts
export function addPersonaToPrompt(
  basePrompt: string,
  persona?: string
): string {
  if (!persona) {
    return basePrompt
  }

  const personaEnhancement = ` with a ${persona.toLowerCase()} perspective`
  return basePrompt.replace('{persona}', personaEnhancement)
}

// Export prompt template configurations
export const promptTemplates = {
  destinationSuggestion: destinationSuggestionPrompt,
  itineraryGeneration: itineraryGenerationPrompt,
  itineraryRefinement: itineraryRefinementPrompt,
  structuredResponse: structuredResponsePrompt,
}

// Prompt validation utilities
export function validateDestinationInput(
  input: any
): TDestinationSuggestionInput {
  return destinationSuggestionInputSchema.parse(input)
}

export function validateItineraryInput(input: any): TItineraryGenerationInput {
  return itineraryGenerationInputSchema.parse(input)
}
