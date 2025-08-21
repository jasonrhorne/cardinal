export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Trips</h1>
        <p className="mt-2 text-gray-600">
          Create new itineraries or view your saved trips
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* New Trip Card */}
        <a
          href="/dashboard/new"
          className="group relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 hover:border-gray-400 focus:ring-4 focus:ring-blue-200"
        >
          <div className="rounded-full bg-blue-100 p-3 group-hover:bg-blue-200">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Create New Trip
          </h3>
          <p className="mt-2 text-center text-sm text-gray-600">
            Start planning your next adventure with AI-powered recommendations
          </p>
        </a>

        {/* Placeholder for existing trips */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Weekend in Portland
            </h3>
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
              Saved
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Photography-focused itinerary • 2 days
          </p>
          <div className="mt-4 flex space-x-2">
            <button className="text-sm text-blue-600 hover:text-blue-700">
              View
            </button>
            <button className="text-sm text-gray-500 hover:text-gray-700">
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}