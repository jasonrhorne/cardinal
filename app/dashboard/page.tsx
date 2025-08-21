import { Card, CardBody, Badge, Button } from '@/components/ui'

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-2">Your Trips</h1>
        <p className="mt-2 text-muted">
          Create new itineraries or view your saved trips
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* New Trip Card */}
        <a
          href="/dashboard/new"
          className="group relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-gray-400 focus:ring-4 focus:ring-brand-200 focus:outline-none"
        >
          <div className="rounded-full bg-brand-100 p-3 group-hover:bg-brand-200 transition-colors">
            <svg
              className="h-6 w-6 text-brand-600"
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
          <p className="mt-2 text-center text-sm text-muted">
            Start planning your next adventure with AI-powered recommendations
          </p>
        </a>

        {/* Placeholder for existing trips */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Weekend in Portland
              </h3>
              <Badge variant="success">Saved</Badge>
            </div>
            <p className="mt-2 text-sm text-muted">
              Photography-focused itinerary • 2 days
            </p>
            <div className="mt-4 flex space-x-2">
              <Button variant="ghost" size="sm">
                View
              </Button>
              <Button variant="ghost" size="sm">
                Export PDF
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
