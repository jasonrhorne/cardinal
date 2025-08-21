/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for Netlify deployment
  output: 'export',
  
  // Disable image optimization for static export
  images: {
    unoptimized: true
  },
  
  // Trailing slash for consistent routing
  trailingSlash: true,
  
  // Strict mode for better development experience
  reactStrictMode: true,
  
  // Experimental features
  experimental: {
    typedRoutes: true
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  }
}

module.exports = nextConfig