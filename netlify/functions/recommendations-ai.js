// AI-powered recommendation engine for Cardinal
// Uses OpenAI API for destination recommendations and itinerary generation

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    const { origin, adults, children, interests, action, destination } = JSON.parse(event.body);
    
    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log('No OpenAI API key found, using mock data fallback');
      // Fall back to mock data if no API key
      return require('./recommendations').handler(event, context);
    }
    
    if (action === 'itinerary') {
      // Generate detailed itinerary for selected destination
      const itinerary = await generateItinerary(apiKey, destination, origin, adults, children, interests);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          itinerary: itinerary
        })
      };
    } else {
      // Generate destination recommendations
      const destinations = await generateDestinations(apiKey, origin, adults, children, interests);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          destinations: destinations
        })
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Server error: ' + error.message
      })
    };
  }
};

async function generateDestinations(apiKey, origin, adults, children, interests) {
  const hasKids = children && children.length > 0;
  const kidsAges = children || [];
  
  // Build the prompt for destination recommendations
  const prompt = `You are a travel expert specializing in weekend getaways. Generate 4-5 weekend destination recommendations based on these criteria:

TRAVELER PROFILE:
- Origin: ${origin}
- Adults: ${adults}
${hasKids ? `- Children ages: ${kidsAges.join(', ')}` : '- No children'}
- Interests: ${interests.join(', ')}

REQUIREMENTS:
- Weekend trips (2-3 days)
- Within 8 hours drive OR 2 hours flight from origin
- Match the stated interests
${hasKids ? '- Must be family-friendly with activities for kids' : ''}

For each destination, provide:
1. Name (city, state)
2. Distance (e.g., "4-hour drive" or "1.5-hour flight")
3. Travel details (driving route or flight options)
4. Why it fits (2-3 sentences connecting to their interests)
5. Highlights (4 main attractions/experiences)
${hasKids ? '6. Family tips (kid-specific activities or considerations)' : ''}

Return as JSON array with this structure:
[{
  "name": "City, State",
  "distance": "X-hour drive/flight",
  "travel": "Specific route or flight details",
  "why": "Why this destination matches their interests",
  "highlights": ["Thing 1", "Thing 2", "Thing 3", "Thing 4"],
  ${hasKids ? '"familyFriendly": "Kid-specific tips and activities"' : ''}
}]

Focus on lesser-known gems alongside popular destinations. Consider seasonality (current month is ${new Date().toLocaleString('default', { month: 'long' })}).`;

  // Try multiple models in order of preference - updated to current OpenAI models
  const models = ['gpt-5-mini', 'gpt-4.1', 'gpt-5-nano'];
  let response;
  let lastError;
  
  for (const model of models) {
    try {
      console.log(`Trying model: ${model}`);
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a travel expert. Return only valid JSON without markdown formatting.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: "json_object" }
        })
      });
      
      if (response.ok) {
        console.log(`Successfully using model: ${model}`);
        break;
      } else {
        const errorData = await response.json();
        lastError = errorData.error;
        console.log(`Model ${model} failed:`, lastError.message);
        continue;
      }
    } catch (error) {
      lastError = error;
      console.log(`Model ${model} error:`, error.message);
      continue;
    }
  }
  
  if (!response || !response.ok) {
    throw new Error(lastError?.message || 'All models failed');
  }

  try {

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    // Parse the response
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    // Handle different response structures
    const destinations = parsed.destinations || parsed.recommendations || parsed;
    
    // Ensure it's an array
    return Array.isArray(destinations) ? destinations : [destinations];
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fall back to mock data
    throw error;
  }
}

async function generateItinerary(apiKey, destination, origin, adults, children, interests) {
  const hasKids = children && children.length > 0;
  const kidsAges = children || [];
  
  // Create parallel prompts for different aspects of the itinerary
  const prompts = [
    {
      name: 'lodging',
      prompt: `Recommend 3 lodging options in ${destination} for ${adults} adults${hasKids ? ` and ${children.length} children (ages ${kidsAges.join(', ')})` : ''}. Consider: location convenience, ${interests.join(', ')} interests, weekend availability. Format: Name - Brief description including why it fits their needs.`
    },
    {
      name: 'dining',
      prompt: `Create a dining guide for a weekend in ${destination} for ${adults} adults${hasKids ? ` and ${children.length} children` : ''}. They're interested in ${interests.includes('food') ? 'food exploration' : 'convenient, quality meals'}. Include 6-8 specific restaurant recommendations across different meals and neighborhoods. Format as: Restaurant Name (Neighborhood) - cuisine type and why to go there.`
    },
    {
      name: 'activities',
      prompt: `Design a detailed Friday evening through Sunday afternoon itinerary in ${destination} for ${adults} adults${hasKids ? ` and ${children.length} children (ages ${kidsAges.join(', ')})` : ''}. Interests: ${interests.join(', ')}. Include specific times, places, and logistics. Consider travel time from ${origin} for Friday arrival.`
    },
    {
      name: 'tips',
      prompt: `Provide 5 insider tips for visiting ${destination} on a weekend trip from ${origin}. Consider: ${interests.join(', ')} interests${hasKids ? `, traveling with kids ages ${kidsAges.join(', ')}` : ''}, best photo spots, parking, tickets to book ahead, weather considerations for ${new Date().toLocaleString('default', { month: 'long' })}.`
    }
  ];
  
  try {
    // Execute prompts in parallel for speed
    const responses = await Promise.all(
      prompts.map(async (p) => {
        // Try models in order of preference - updated to current OpenAI models
        const models = ['gpt-5-mini', 'gpt-4.1', 'gpt-5-nano'];
        
        for (const model of models) {
          try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: model,
                messages: [
                  {
                    role: 'system',
                    content: 'You are a travel expert creating personalized itineraries. Be specific with names and places.'
                  },
                  {
                    role: 'user',
                    content: p.prompt
                  }
                ],
                temperature: 0.7,
                max_tokens: 800
              })
            });
            
            if (response.ok) {
              const data = await response.json();
              return {
                name: p.name,
                content: data.choices[0].message.content
              };
            }
          } catch (error) {
            console.log(`Model ${model} failed for ${p.name}:`, error.message);
            continue;
          }
        }
        
        // If all models fail, return error content
        return {
          name: p.name,
          content: `Unable to generate ${p.name} recommendations at this time.`
        };
      })
    );
    
    // Combine responses into structured itinerary
    const lodging = responses.find(r => r.name === 'lodging').content;
    const dining = responses.find(r => r.name === 'dining').content;
    const activities = responses.find(r => r.name === 'activities').content;
    const tips = responses.find(r => r.name === 'tips').content;
    
    return {
      destination: destination,
      lodging: lodging,
      dining: dining,
      activities: activities,
      tips: tips,
      generated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error generating itinerary:', error);
    throw error;
  }
}

// Helper function to validate and clean AI responses
function cleanAIResponse(text) {
  // Remove any markdown formatting
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  // Try to parse as JSON
  try {
    return JSON.parse(text);
  } catch {
    // If not valid JSON, return as text
    return text;
  }
}