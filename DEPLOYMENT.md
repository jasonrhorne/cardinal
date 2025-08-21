# Cardinal - Netlify Deployment Guide

## Overview

This project is configured for deployment on Netlify using the Jamstack architecture with Next.js and serverless functions.

## Configuration Files

### netlify.toml

- Main Netlify configuration file
- Defines build settings, headers, and function configurations
- Configured for Next.js with official plugin integration
- Includes security headers and caching policies

### Plugin Integration

- Uses `@netlify/plugin-nextjs` for seamless Next.js deployment
- Handles SSR, API routes, and static optimization automatically
- No need for manual redirects or headers (handled by plugin)

## Directory Structure

```
netlify/
├── functions/          # Standard Netlify Functions
│   └── health.js      # Health check endpoint
└── edge-functions/    # Netlify Edge Functions
    └── concierge.js   # Main AI orchestration function
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

### Required for Production:

- `ANTHROPIC_API_KEY` - Claude API key
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
- `AUTH_SECRET` - Authentication secret
- `DATABASE_URL` - Database connection string

### Optional:

- `OPENAI_API_KEY` - OpenAI API key (if using GPT models)
- `EMAIL_SERVER_*` - Email configuration for magic links
- `NETLIFY_SITE_ID` - For CI/CD automation

## Deployment Steps

### 1. Initial Setup

1. Connect repository to Netlify
2. Configure environment variables in Netlify dashboard
3. Netlify will automatically detect Next.js and use the plugin
4. Build and deploy will be handled automatically

### 2. Build Configuration

- Build framework: Next.js with official Netlify plugin
- Node.js version: 18
- Package manager: npm
- Build command: `npm run build` (handled automatically by plugin)

### 3. Function Configuration

- Functions directory: `netlify/functions`
- Edge functions directory: `netlify/edge-functions`
- Default timeout: 60 seconds

## Security Features

### Headers

- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- XSS Protection
- Referrer Policy

### CORS

- Configured for API endpoints
- Allows necessary origins for external API calls

## Performance Optimizations

### Caching

- Static assets: 1 year cache
- API responses: No cache (dynamic content)
- Build artifacts: Immutable caching

### CDN

- Global CDN distribution via Netlify
- Edge functions for reduced latency

## Monitoring

### Available Endpoints

- `/api/health` - Health check for standard functions
- `/api/concierge` - Main AI agent endpoint (edge function)

### Logs

- Function logs available in Netlify dashboard
- Error tracking and monitoring recommended

## Next Steps

1. Complete Next.js project scaffolding (Task F003)
2. Set up authentication service (Task F012)
3. Configure database connection (Task F011)
4. Implement AI agent functions (Tasks AI001-AI015)

## Troubleshooting

### Common Issues

- Build failures: Check Node.js version and dependencies
- Function timeouts: Consider using Edge Functions for long-running tasks
- CORS errors: Verify headers configuration in netlify.toml

### Support Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
