# Explooore

A modern restaurant discovery web application that helps you find the restaurants worth finding.

## Live Demo

🌐 **[restaurantindex.netlify.app](https://restaurantindex.netlify.app)**

## Overview

Explooore is a clean, modern web application for discovering exceptional restaurants in any US city. The app features a minimalist design with an intuitive interface that makes finding great dining experiences simple and enjoyable.

## Features

- **🎨 Modern UI**: Clean, responsive design with smooth animations
- **📍 City & State Search**: Find restaurants in any US city
- **🍽️ Curated Results**: Discover exceptional restaurants with detailed information
- **⚡ Fast & Reliable**: Deployed on Netlify with serverless functions
- **📱 Mobile Friendly**: Fully responsive design that works on all devices

## Technology Stack

- **Frontend**: Modern HTML5, CSS3, and vanilla JavaScript
- **Backend**: Netlify Functions (Node.js serverless)
- **Hosting**: Netlify with automatic deployments from GitHub
- **Design**: Custom CSS with flexbox layout and smooth transitions

## Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/jasonrhorne/cardinal.git
   cd cardinal
   ```

2. **Install Netlify CLI** (optional, for local testing):
   ```bash
   npm install -g netlify-cli
   ```

3. **Run locally with Netlify Dev**:
   ```bash
   netlify dev
   ```
   This will start the app at http://localhost:8888

4. **Or use Python's built-in server** for basic testing:
   ```bash
   python3 -m http.server 8000
   ```
   Visit http://localhost:8000

   Note: The Python server won't run the serverless functions, so API calls won't work.

## Project Structure

```
cardinal/
├── index.html                 # Main application (modern UI)
├── restaurant_finder_90s.html # Legacy 90s-style interface (archived)
├── netlify.toml              # Netlify configuration
└── netlify/
    └── functions/
        ├── discover.js       # Restaurant discovery API endpoint
        └── hello.js         # Test endpoint
```

## API Endpoints

- **POST `/api/discover`**: Discovers restaurants for a given city and state
  - Request: `{ "city": "Pittsburgh", "state": "PA" }`
  - Response: Array of restaurant objects with name, cuisine, neighborhood, price, rating, and description

- **GET `/.netlify/functions/hello`**: Test endpoint to verify functions are working

## Deployment

The app automatically deploys to Netlify when changes are pushed to the main branch on GitHub.

### Manual Deployment

1. Push changes to GitHub:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```

2. Netlify automatically builds and deploys within 1-2 minutes

## Sample Restaurant Data

Currently, the app returns curated restaurant data for Pittsburgh, PA including:
- **Fet-Fisk**: Nordic-Appalachian fusion (NY Times 50 Best 2024)
- **Apteka**: Vegan Eastern European (James Beard nominations)
- **Stuntpig**: American, everything made in-house
- **Soju**: Modern Korean with creative cocktails
- **Umami**: Upscale Japanese with extensive sake menu

For other cities, generic placeholder data is returned.

## Future Enhancements

- Integration with restaurant APIs for real-time data
- User authentication and saved searches
- Restaurant filtering by cuisine type and price
- Map integration for location visualization
- User reviews and ratings

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT