/**
 * Extract Requirements Edge Function
 * Processes natural language input and extracts structured travel requirements
 * E003 - AI Processing Pipeline
 */

// Note: Edge Functions run in Deno environment, not Node.js
// TypeScript checking may show errors but runtime will work correctly

// Travel requirements extraction schema (matches TTravelRequirements)
interface ExtractedRequirements {
  originCity?: string
  numberOfAdults?: number
  numberOfChildren?: number
  childrenAges?: Array<{ age: number; id: string }>
  preferredTravelMethods?: Array<'drive' | 'rail' | 'air'>
  interests?: Array<
    | 'arts'
    | 'architecture'
    | 'food-dining'
    | 'music-nightlife'
    | 'nature-outdoors'
    | 'sports-recreation'
    | 'history'
    | 'shopping'
    | 'culture-local-experiences'
  >
  travelDurationLimits?: Record<'drive' | 'rail' | 'air', number>
}

// System prompt for requirement extraction
const EXTRACTION_PROMPT = `You are an expert travel requirements extractor. Your job is to parse natural language descriptions of travel preferences and extract structured data.

Extract the following information from the user's travel description:

1. **Origin City**: Where they're traveling FROM (city, state/country)
2. **Number of Adults**: Count of adult travelers (default: 2 if not specified)
3. **Number of Children**: Count of children (default: 0)
4. **Children Ages**: If children mentioned, extract ages and assign random IDs
5. **Travel Methods**: Preferred transportation (drive, rail, air) - infer from context
6. **Interests**: Map to these categories only: arts, architecture, food-dining, music-nightlife, nature-outdoors, sports-recreation, history, shopping, culture-local-experiences
7. **Duration Limits**: If they mention time/distance limits for different transport modes

IMPORTANT RULES:
- Return ONLY valid JSON, no markdown formatting
- Use exact field names and values shown above
- Map user interests to the exact category names provided
- If information is unclear or missing, omit the field rather than guessing
- For children ages, generate realistic IDs like "child-1", "child-2"
- Travel duration limits should be in hours

Example Input: "We're a couple from San Francisco who love art galleries and great food. We want to drive somewhere within 4 hours for a weekend trip."

Example Output:
{
  "originCity": "San Francisco, CA",
  "numberOfAdults": 2,
  "numberOfChildren": 0,
  "preferredTravelMethods": ["drive"],
  "interests": ["arts", "food-dining"],
  "travelDurationLimits": {
    "drive": 4
  }
}

Now extract requirements from this travel description:`

export default async function handler(request: Request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // Parse request body
    const { text } = await request.json()

    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return new Response(
        JSON.stringify({
          error:
            'Please provide a travel description of at least 10 characters',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Get API key from environment (Deno environment in Edge Functions)
    const apiKey = (globalThis as any).Deno?.env?.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not found in environment')
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable' }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Fast and cost-effective for extraction
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `${EXTRACTION_PROMPT}\n\n"${text.trim()}"`,
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error(
        'Anthropic API error:',
        response.status,
        await response.text()
      )
      return new Response(
        JSON.stringify({ error: 'AI processing failed. Please try again.' }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    const aiResponse = await response.json()

    if (
      !aiResponse.content ||
      !aiResponse.content[0] ||
      !aiResponse.content[0].text
    ) {
      throw new Error('Invalid AI response format')
    }

    let extractedText = aiResponse.content[0].text.trim()

    // Clean up response (remove markdown formatting if present)
    if (extractedText.startsWith('```json')) {
      extractedText = extractedText
        .replace(/```json\n?/, '')
        .replace(/```$/, '')
        .trim()
    } else if (extractedText.startsWith('```')) {
      extractedText = extractedText
        .replace(/```\n?/, '')
        .replace(/```$/, '')
        .trim()
    }

    // Parse the extracted JSON
    let requirements: ExtractedRequirements
    try {
      requirements = JSON.parse(extractedText)
    } catch (parseError) {
      console.error(
        'Failed to parse AI response as JSON:',
        parseError,
        'Raw response:',
        extractedText
      )
      return new Response(
        JSON.stringify({
          error:
            'Unable to process your description. Please try rephrasing it with more specific details.',
        }),
        {
          status: 422,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Basic validation of extracted requirements
    if (!requirements || typeof requirements !== 'object') {
      throw new Error('Invalid requirements object')
    }

    // Validate interests array if present
    const validInterests = [
      'arts',
      'architecture',
      'food-dining',
      'music-nightlife',
      'nature-outdoors',
      'sports-recreation',
      'history',
      'shopping',
      'culture-local-experiences',
    ]
    if (requirements.interests) {
      requirements.interests = requirements.interests.filter(interest =>
        validInterests.includes(interest)
      )
    }

    // Validate travel methods if present
    const validMethods = ['drive', 'rail', 'air']
    if (requirements.preferredTravelMethods) {
      requirements.preferredTravelMethods =
        requirements.preferredTravelMethods.filter(method =>
          validMethods.includes(method)
        ) as Array<'drive' | 'rail' | 'air'>
    }

    // Return successful extraction
    return new Response(
      JSON.stringify({
        success: true,
        requirements,
        metadata: {
          processingTime: Date.now(),
          model: 'claude-3-haiku',
          textLength: text.length,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Extract requirements error:', error)

    return new Response(
      JSON.stringify({
        error:
          'Processing failed. Please check your description and try again.',
        details:
          (globalThis as any).Deno?.env?.get('NODE_ENV') === 'development'
            ? (error as Error).message
            : undefined,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}
