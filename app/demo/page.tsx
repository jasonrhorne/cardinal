import dynamic from 'next/dynamic'

// Dynamically import the demo component to prevent static generation
const DemoPageContent = dynamic(
  () => import('@/components/features/demo-page-content'),
  {
    ssr: false, // Disable server-side rendering
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading demo...</p>
        </div>
      </div>
    ),
  }
)

export default function DemoPage() {
  return <DemoPageContent />
}
