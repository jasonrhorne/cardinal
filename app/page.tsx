export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
          Cardinal
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 md:text-xl">
          AI-powered travel itineraries that discover unique destinations 
          through persona-driven lenses
        </p>
        <div className="mt-10">
          <a
            href="/auth/signin"
            className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-4 focus:ring-blue-200"
          >
            Get started
          </a>
        </div>
      </div>
      
      <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="text-center">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Persona-Driven
            </h3>
            <p className="mt-2 text-gray-600">
              Get recommendations through different lenses: photographer, foodie, family explorer
            </p>
          </div>
        </div>
        
        <div className="text-center">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              AI-Powered
            </h3>
            <p className="mt-2 text-gray-600">
              Advanced AI agents create unique itineraries validated with real-time data
            </p>
          </div>
        </div>
        
        <div className="text-center">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Mobile-First
            </h3>
            <p className="mt-2 text-gray-600">
              Beautiful, responsive itineraries designed for on-the-go consumption
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}