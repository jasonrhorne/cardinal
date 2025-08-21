import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cardinal - AI Travel Itineraries',
  description:
    'Discover unique travel destinations and get personalized itineraries crafted by AI',
  keywords: 'travel, itinerary, AI, destinations, travel planning',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
