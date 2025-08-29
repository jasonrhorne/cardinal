import { ExperimentDashboard } from '@/components/analytics/experiment-dashboard'

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ExperimentDashboard />
    </div>
  )
}

export const metadata = {
  title: 'Experiment Analytics | Cardinal',
  description: 'Input method performance tracking and analytics dashboard',
}
