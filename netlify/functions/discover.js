exports.handler = async (event, context) => {
  // Handle CORS preflight
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

  // Only allow POST
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
    const { city, state } = JSON.parse(event.body);

    if (!city || !state) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Please provide both city and state!'
        })
      };
    }

    console.log(`Discovering restaurants for ${city}, ${state}`);

    let restaurants = [];

    if (city.toLowerCase() === 'pittsburgh' && state.toUpperCase() === 'PA') {
      restaurants = [
        {
          name: 'Fet-Fisk',
          cuisine: 'Nordic-Appalachian',
          neighborhood: 'Bloomfield',
          price: '$$$$',
          rating: '4.8/5.0',
          description: 'NY Times 50 Best 2024! Innovative Nordic-Appalachian fusion cuisine.'
        },
        {
          name: 'Apteka',
          cuisine: 'Eastern European',
          neighborhood: 'Bloomfield',
          price: '$$$$',
          rating: '4.7/5.0',
          description: 'Vegan Eastern European cuisine. James Beard nominations 2022-2024.'
        },
        {
          name: 'Stuntpig',
          cuisine: 'American',
          neighborhood: 'Squirrel Hill',
          price: '$$$',
          rating: '4.9/5.0',
          description: 'Pop-up turned permanent. Everything made in-house including bread.'
        },
        {
          name: 'Soju',
          cuisine: 'Korean',
          neighborhood: 'Garfield',
          price: '$$$',
          rating: '4.6/5.0',
          description: 'Modern Korean cuisine with creative cocktails.'
        },
        {
          name: 'Umami',
          cuisine: 'Japanese',
          neighborhood: 'Lawrenceville',
          price: '$$$$',
          rating: '4.5/5.0',
          description: 'Upscale Japanese with extensive sake menu.'
        }
      ];
    } else {
      // Generic response for other cities
      restaurants = [
        {
          name: 'Local Favorite #1',
          cuisine: 'American',
          neighborhood: 'Downtown',
          price: '$$$',
          rating: '4.5/5.0',
          description: `A popular spot in ${city}, ${state}`
        },
        {
          name: 'Hidden Gem Restaurant',
          cuisine: 'International',
          neighborhood: 'Midtown',
          price: '$$',
          rating: '4.7/5.0',
          description: `Local favorite in ${city}, ${state}`
        },
        {
          name: "Chef's Table",
          cuisine: 'Contemporary',
          neighborhood: 'Arts District',
          price: '$$$$',
          rating: '4.8/5.0',
          description: `Fine dining experience in ${city}, ${state}`
        }
      ];
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        restaurants: restaurants,
        count: restaurants.length,
        city: city,
        state: state
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