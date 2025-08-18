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
  
  // Split into 2 prompts for better detail while avoiding timeout
  const prompts = [
    {
      name: 'lodging_dining',
      prompt: `Create a comprehensive lodging and dining guide for a weekend trip to ${destination} for ${adults} adults${hasKids ? ` and ${children.length} children (ages ${kidsAges.join(', ')})` : ''}.

LODGING SECTION - Provide 3 detailed recommendations:
For each hotel/accommodation include:
- Full name and neighborhood
- Why it's perfect for this group (considering ${interests.join(', ')} interests)
- Key amenities ${hasKids ? '(especially family features)' : ''}
- Price range and booking tips

DINING SECTION - Provide 8-10 restaurant recommendations:
Organize by meal (2-3 breakfast, 3-4 lunch, 3-4 dinner) including:
- Restaurant name and exact neighborhood/address area
- Cuisine type and signature dishes
- Why it matches their interests (${interests.includes('food') ? 'especially unique local flavors' : 'quality and convenience'})
- ${hasKids ? 'Kid-friendliness rating and kids menu options' : 'Atmosphere and reservation needs'}
- Price range per person

Be specific with actual establishment names, not generic suggestions.`
    },
    {
      name: 'activities_tips',
      prompt: `Create a detailed hour-by-hour itinerary and insider tips for a weekend in ${destination} for ${adults} adults${hasKids ? ` and ${children.length} children (ages ${kidsAges.join(', ')})` : ''} traveling from ${origin}. Their interests: ${interests.join(', ')}.

DETAILED SCHEDULE:
FRIDAY:
- 6:00 PM: Arrival and check-in logistics
- 7:30 PM: Dinner recommendation with specific restaurant
- 9:00 PM: Evening activity

SATURDAY:
- Morning (9 AM - 12 PM): Specific attraction based on ${interests[0]} interest
- Lunch (12:30 PM): Where and why
- Afternoon (2 PM - 5 PM): Main activity for ${interests.join(' and ')}
- Evening (6 PM - 10 PM): Dinner and evening experience

SUNDAY:
- Morning (10 AM): Brunch spot
- Midday (11:30 AM - 2 PM): Final activity before departure
- 3:00 PM: Departure logistics

INSIDER TIPS (5-7 specific tips):
- Best parking: Specific lots/apps
- Tickets to book ahead: Which attractions and how
- ${hasKids ? 'Kid energy management: Best playground/break spots' : 'Hidden gems: Local favorites tourists miss'}
- Photo spots: Exact locations and best times
- Weather prep for ${new Date().toLocaleString('default', { month: 'long' })}
- Money savers: Discounts, happy hours, free activities
- Local transport: Best ways to get around`
    }
  ];
  
  try {
    // Run 2 parallel prompts for balance between detail and speed
    const models = ['gpt-5-mini', 'gpt-4.1', 'gpt-5-nano'];
    
    const responses = await Promise.all(
      prompts.map(async (p) => {
        for (const model of models) {
          try {
            console.log(`Generating ${p.name} with model: ${model}`);
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
                    content: 'You are a travel expert creating detailed, personalized itineraries. Be specific with actual place names, addresses, and recommendations.'
                  },
                  {
                    role: 'user',
                    content: p.prompt
                  }
                ],
                // GPT-5 models only support temperature: 1, others can use 0.7
                ...(model.startsWith('gpt-5') ? {} : { temperature: 0.7 }),
                // GPT-5 models use max_completion_tokens, others use max_tokens
                ...(model.startsWith('gpt-5') ? { max_completion_tokens: 2000 } : { max_tokens: 2000 })
              })
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log(`Successfully generated ${p.name} with ${model}`);
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
    
    // Extract content from responses
    const lodgingDining = responses.find(r => r.name === 'lodging_dining')?.content || '';
    const activitiesTips = responses.find(r => r.name === 'activities_tips')?.content || '';
    
    // Parse lodging and dining from first response
    const lodgingMatch = lodgingDining.match(/LODGING[^]*?(?=DINING|$)/i);
    const diningMatch = lodgingDining.match(/DINING[^]*$/i);
    
    const lodging = lodgingMatch ? lodgingMatch[0] : 'Lodging recommendations not available';
    const dining = diningMatch ? diningMatch[0] : 'Dining recommendations not available';
    
    // Parse activities and tips from second response
    const scheduleMatch = activitiesTips.match(/DETAILED SCHEDULE[^]*?(?=INSIDER TIPS|$)/i);
    const tipsMatch = activitiesTips.match(/INSIDER TIPS[^]*$/i);
    
    const activities = scheduleMatch ? scheduleMatch[0] : activitiesTips.split('INSIDER TIPS')[0] || 'Activity schedule not available';
    const tips = tipsMatch ? tipsMatch[0] : activitiesTips.split('INSIDER TIPS')[1] || 'Travel tips not available';
    
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