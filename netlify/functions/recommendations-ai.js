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
          // GPT-5 models only support temperature: 1, others can use 0.7
          ...(model.startsWith('gpt-5') ? {} : { temperature: 0.7 }),
          // GPT-5 models use max_completion_tokens, others use max_tokens
          ...(model.startsWith('gpt-5') ? { max_completion_tokens: 2000 } : { max_tokens: 2000 }),
          // Only use JSON format for GPT-4 models
          ...(model.startsWith('gpt-4') ? { response_format: { type: "json_object" } } : {})
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
    let content = data.choices[0].message.content;
    console.log('Raw AI response length:', content.length);
    
    // Clean the response - remove markdown formatting if present
    content = content.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
    
    // Try to extract JSON from the response
    let parsed;
    try {
      // First try direct parsing
      parsed = JSON.parse(content);
    } catch (e) {
      // If that fails, try to find JSON array in the content
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.error('Failed to parse JSON from response:', content.substring(0, 500));
          throw new Error('Invalid JSON response from AI');
        }
      } else {
        console.error('No JSON array found in response:', content.substring(0, 500));
        throw new Error('No valid JSON in AI response');
      }
    }
    
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
  
  // Create a single combined prompt to avoid timeouts
  const combinedPrompt = `Create a detailed weekend itinerary for ${destination} for ${adults} adults${hasKids ? ` and ${children.length} children (ages ${kidsAges.join(', ')})` : ''} traveling from ${origin}. Their interests: ${interests.join(', ')}.

Please provide:

1. LODGING (3 options):
List 3 specific hotels/accommodations with brief descriptions of why they fit this group.

2. DINING:
List 6-8 specific restaurants for the weekend, including neighborhood and cuisine type.

3. ACTIVITIES:
Create a schedule from Friday evening arrival through Sunday afternoon departure. Include specific attractions and timing.

4. TIPS:
5 practical tips for this trip including parking, tickets to book ahead, and ${hasKids ? 'kid-friendly' : 'local'} recommendations.

Format as clear sections with headers.`;
  
  try {
    // Use a single API call instead of parallel ones to avoid timeout
    const models = ['gpt-5-mini', 'gpt-4.1', 'gpt-5-nano'];
    let response;
    let content;
    
    for (const model of models) {
      try {
        console.log(`Generating itinerary with model: ${model}`);
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
                content: 'You are a travel expert creating personalized itineraries. Be specific with names and places.'
              },
              {
                role: 'user',
                content: combinedPrompt
              }
            ],
            // GPT-5 models only support temperature: 1, others can use 0.7
            ...(model.startsWith('gpt-5') ? {} : { temperature: 0.7 }),
            // GPT-5 models use max_completion_tokens, others use max_tokens
            ...(model.startsWith('gpt-5') ? { max_completion_tokens: 3000 } : { max_tokens: 3000 })
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          content = data.choices[0].message.content;
          console.log(`Successfully generated itinerary with ${model}`);
          break;
        }
      } catch (error) {
        console.log(`Model ${model} failed:`, error.message);
        continue;
      }
    }
    
    if (!content) {
      throw new Error('Failed to generate itinerary with all models');
    }
    
    // Parse the content into sections
    const sections = content.split(/\n(?=[A-Z0-9]+[\.\)]\s+[A-Z]+)/);
    
    const lodging = sections.find(s => s.match(/LODGING/i)) || 'Lodging recommendations not available';
    const dining = sections.find(s => s.match(/DINING/i)) || 'Dining recommendations not available';
    const activities = sections.find(s => s.match(/ACTIVITIES|SCHEDULE/i)) || 'Activity schedule not available';
    const tips = sections.find(s => s.match(/TIPS/i)) || 'Travel tips not available';
    
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