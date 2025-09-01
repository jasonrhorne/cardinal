'use client'

import dynamicImport from 'next/dynamic'
import { useRouter } from 'next/navigation'

import type { InputMethodMetadata } from '@/lib/input-methods/types'
import type { TTravelRequirements } from '@/lib/schemas/travel-requirements'

// Lazy load the input method container to avoid SSR issues
const InputMethodContainer = dynamicImport(
  () =>
    import('@/components/features/input-methods/input-method-container').then(
      mod => ({
        default: mod.InputMethodContainer,
      })
    ),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-32 bg-gray-200 rounded" />
        <div className="h-12 bg-blue-200 rounded" />
      </div>
    ),
  }
)

export default function NewTripPage() {
  const router = useRouter()

  const handleComplete = async (
    requirements: TTravelRequirements,
    metadata: InputMethodMetadata
  ) => {
    try {
      console.log('Travel requirements submitted:', requirements)
      console.log('Input method metadata:', metadata)

      // Store requirements in session storage for the flow
      sessionStorage.setItem(
        'cardinal_travel_requirements',
        JSON.stringify(requirements)
      )

      // Navigate to destination suggestions
      router.push(
        `/dashboard/destinations?requirements=${encodeURIComponent(JSON.stringify(requirements))}`
      )
    } catch (error) {
      console.error('Error submitting travel requirements:', error)
      alert('Error submitting form. Please try again.')
    }
  }

  const handleCancel = () => {
    if (
      confirm('Are you sure you want to cancel? Any progress will be lost.')
    ) {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Plan Your Perfect Trip
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tell us about your travel preferences and we&apos;ll create
            personalized destination recommendations just for you.
          </p>
        </div>

        {/* Input Method Container */}
        <div className="bg-white rounded-lg shadow-sm border p-6 md:p-8">
          <InputMethodContainer
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Your preferences help us create personalized recommendations. We
            never share your information with third parties.
          </p>
        </div>
      </div>
    </div>
  )
}

// Force dynamic rendering to ensure proper hydration
export const dynamic = 'force-dynamic'
