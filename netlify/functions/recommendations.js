// For POC - returns intelligent mock data based on inputs
// TODO: Integrate with AI API for real recommendations

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
    const { origin, adults, children, interests } = JSON.parse(event.body);
    
    // Generate recommendations based on inputs
    const destinations = await generateDestinations(origin, adults, children, interests);
    
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

async function generateDestinations(origin, adults, children, interests) {
  // Parse origin to get state/region for better recommendations
  const originLower = origin.toLowerCase();
  const hasKids = children && children.length > 0;
  const kidsAges = children || [];
  
  // Build destination recommendations based on interests and constraints
  let destinations = [];
  
  // Weekend trip = typically within 8 hours drive or 2 hour flight
  // Customize based on origin (this is POC data for Pittsburgh area)
  if (originLower.includes('pittsburgh') || originLower.includes('pa')) {
    
    // Nature & Outdoors destinations
    if (interests.includes('nature')) {
      destinations.push({
        name: "Shenandoah National Park, VA",
        distance: "4-hour drive",
        travel: "Direct drive via I-70 E and I-81 S. Best to rent a car if flying.",
        why: `Stunning mountain vistas along Skyline Drive, 500+ miles of trails including ${hasKids ? 'family-friendly waterfall hikes' : 'challenging backcountry routes'}. Peak fall foliage destination. Dark sky viewing for photography.`,
        highlights: ["Skyline Drive", "Old Rag Mountain", "Dark Hollow Falls", "Luray Caverns nearby"],
        familyFriendly: hasKids ? "Many short, easy trails perfect for kids. Junior Ranger program available." : null
      });
      
      destinations.push({
        name: "Asheville, NC",
        distance: "7-hour drive",
        travel: "Drive via I-77 S and I-26 S, or fly with 1 stop (4 hours total)",
        why: "Gateway to Great Smoky Mountains with Blue Ridge Parkway access. Vibrant arts scene, exceptional farm-to-table dining, and numerous craft breweries. Perfect blend of outdoor adventure and cultural experiences.",
        highlights: ["Biltmore Estate", "Blue Ridge Parkway", "River Arts District", "Downtown food scene"],
        familyFriendly: hasKids ? "Biltmore has kids' audio tour, hands-on museum nearby, family-friendly breweries with games." : null
      });
    }
    
    // History & Architecture
    if (interests.includes('history') || interests.includes('architecture')) {
      destinations.push({
        name: "Washington, DC",
        distance: "4.5-hour drive",
        travel: "Direct drive via I-70 E, or multiple daily 1-hour flights",
        why: `Free world-class museums including ${interests.includes('art') ? 'National Gallery and Hirshhorn' : 'Air & Space and Natural History'}. Iconic monuments and government buildings for architecture buffs. ${interests.includes('food') ? 'Diverse dining from Ethiopian to Michelin-starred.' : ''}`,
        highlights: ["Smithsonian Museums", "National Mall monuments", "Georgetown", "U Street corridor"],
        familyFriendly: hasKids ? "Most museums have dedicated kids' areas. National Zoo is free. Paddle boats at Tidal Basin." : null
      });
      
      destinations.push({
        name: "Philadelphia, PA",
        distance: "5-hour drive",
        travel: "Direct drive via I-76 E, or quick 1-hour flights",
        why: "Revolutionary history at Independence Hall and Liberty Bell. Exceptional food scene from Reading Terminal Market to modern restaurants. World-class art at Philadelphia Museum of Art and Barnes Foundation.",
        highlights: ["Independence Hall", "Reading Terminal Market", "Philadelphia Museum of Art", "Rittenhouse Square"],
        familyFriendly: hasKids ? "Franklin Institute is perfect for kids. Please Touch Museum for younger ones. Great playground at Sister Cities Park." : null
      });
    }
    
    // Food & Urban Culture
    if (interests.includes('food') || interests.includes('music')) {
      destinations.push({
        name: "Nashville, TN",
        distance: "1.5-hour flight",
        travel: "Daily direct flights from PIT, or 8-hour drive",
        why: `Music City with live performances everywhere from honky-tonks to the Grand Ole Opry. ${interests.includes('food') ? 'Hot chicken, innovative Southern cuisine, and great cocktail bars.' : ''} ${interests.includes('history') ? 'Country Music Hall of Fame and historic RCA Studio B.' : ''}`,
        highlights: ["Broadway honky-tonks", "Grand Ole Opry", "East Nashville food scene", "12 South shopping"],
        familyFriendly: hasKids ? "Opry Mills mall, Nashville Zoo, kid-friendly shows at Opry. Many restaurants have play areas." : null
      });
      
      destinations.push({
        name: "Chicago, IL",
        distance: "1.5-hour flight",
        travel: "Multiple daily direct flights, or 7-hour drive",
        why: `${interests.includes('architecture') ? 'Architectural mecca with famous skyline and Frank Lloyd Wright sites.' : ''} ${interests.includes('food') ? 'Legendary food scene from deep-dish to Michelin stars.' : ''} ${interests.includes('art') ? 'Art Institute houses masterpieces.' : ''} ${interests.includes('photography') ? 'Iconic skyline and street photography opportunities.' : ''}`,
        highlights: ["Architecture boat tour", "Art Institute", "Millennium Park", "West Loop restaurants"],
        familyFriendly: hasKids ? "Navy Pier, Museum of Science and Industry, Lincoln Park Zoo (free), beaches in summer." : null
      });
    }
    
    // Beach/Coastal (summer-oriented but worth mentioning)
    if (interests.includes('nature') || interests.includes('photography')) {
      destinations.push({
        name: "Virginia Beach, VA",
        distance: "6-hour drive",
        travel: "Drive via I-70 E and I-64 E, or fly with 1 stop",
        why: `${hasKids ? 'Family-friendly beaches with gentle waves.' : 'Peaceful off-season beach walks.'} First Landing State Park for nature trails. Fresh seafood and boardwalk dining. ${interests.includes('history') ? 'Near Colonial Williamsburg for history.' : ''}`,
        highlights: ["Beach and boardwalk", "First Landing State Park", "Virginia Aquarium", "Cape Henry Lighthouse"],
        familyFriendly: hasKids ? "Perfect for families - gentle beaches, aquarium, adventure park. Many beachfront hotels with pools." : null
      });
    }
    
    // Family-specific recommendations
    if (hasKids) {
      const youngestAge = Math.min(...kidsAges);
      
      if (youngestAge <= 10) {
        destinations.push({
          name: "Williamsburg, VA",
          distance: "5.5-hour drive",
          travel: "Direct drive via I-70 E and I-95 S",
          why: "Living history experience at Colonial Williamsburg where kids can interact with costumed interpreters. Busch Gardens theme park nearby. Water Country USA in summer. Educational and fun combination.",
          highlights: ["Colonial Williamsburg", "Busch Gardens", "Water Country USA", "Jamestown Settlement"],
          familyFriendly: "Designed for families! Kids can try colonial games, crafts. Many hands-on activities. Hotels with pools and family suites."
        });
      }
      
      destinations.push({
        name: "Hershey, PA",
        distance: "3.5-hour drive",
        travel: "Direct drive via I-76 E",
        why: "Chocolate-themed paradise for kids with Hersheypark amusement park, Chocolate World tour, and ZooAmerica. Also has surprising culinary scene at Hotel Hershey. Close enough for easy drive with kids.",
        highlights: ["Hersheypark", "Chocolate World", "ZooAmerica", "Hotel Hershey spa (adults)"],
        familyFriendly: "Built for families! Sweet treats everywhere, ride heights for all ages, character breakfasts available."
      });
    }
    
    // Arts & Culture
    if (interests.includes('art') || interests.includes('photography')) {
      destinations.push({
        name: "New York City, NY",
        distance: "1.5-hour flight",
        travel: "Many daily direct flights, or 6-hour drive",
        why: `Unmatched museums - MoMA, Met, Guggenheim. ${interests.includes('food') ? 'Every cuisine imaginable from street carts to Michelin stars.' : ''} ${interests.includes('architecture') ? 'Iconic skyline and diverse architectural styles.' : ''} ${interests.includes('photography') ? 'Endless photo opportunities from street to skyline.' : ''}`,
        highlights: ["Metropolitan Museum", "Central Park", "High Line", "Brooklyn food scene"],
        familyFriendly: hasKids ? "Natural History Museum with dinosaurs, Central Park playgrounds, Broadway matinees, pizza tours." : null
      });
    }
  } else {
    // Generic recommendations for other origins
    destinations = [
      {
        name: "Nearby City A",
        distance: "3-hour drive",
        travel: "Direct drive or regional flights available",
        why: `Matches your interests in ${interests.join(', ')}. Great weekend destination with variety of activities.`,
        highlights: ["Main attraction", "Food scene", "Cultural site", "Outdoor activity"]
      },
      {
        name: "Nearby City B",
        distance: "2-hour flight",
        travel: "Multiple daily flights",
        why: `Perfect for ${interests.join(' and ')} enthusiasts. Compact downtown makes it ideal for weekend exploration.`,
        highlights: ["Historic district", "Museum quarter", "Restaurant row", "Parks"]
      }
    ];
  }
  
  // Filter to return top 4-5 most relevant based on interests
  // Prioritize family-friendly if kids are involved
  let finalDestinations = destinations
    .filter(d => d.name) // Remove any empty entries
    .slice(0, 5);
  
  // Sort by relevance (in real version, this would be scored by AI)
  if (hasKids) {
    finalDestinations.sort((a, b) => {
      const aFamilyScore = a.familyFriendly ? 1 : 0;
      const bFamilyScore = b.familyFriendly ? 1 : 0;
      return bFamilyScore - aFamilyScore;
    });
  }
  
  return finalDestinations.slice(0, 4); // Return top 4
}

// Future: Add these functions for real AI integration
async function generateWithAI(prompt) {
  // This would call Anthropic API or another LLM
  // For now returns null to use mock data
  return null;
}

async function generateItinerary(destination, interests, travelers) {
  // This would generate detailed itinerary with parallel prompts
  // One for each interest area, then combine
  return null;
}