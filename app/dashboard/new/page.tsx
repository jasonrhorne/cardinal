'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { TravelRequirementsForm } from '@/components/travel/travel-requirements-form'
import type { TTravelRequirementsForm } from '@/lib/schemas/travel-requirements'

export default function NewTripPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: TTravelRequirementsForm) => {
    setIsSubmitting(true)

    try {
      // TODO: Send to API endpoint for processing
      console.log('Travel requirements submitted:', data)

      // For now, just simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // TODO: Navigate to destination suggestions page
      alert(
        'Form submitted successfully! (This will redirect to destination suggestions)'
      )
    } catch (error) {
      console.error('Error submitting travel requirements:', error)
      alert('Error submitting form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = (data: Partial<TTravelRequirementsForm>) => {
    // TODO: Save to localStorage or API
    console.log('Draft saved:', data)
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

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6 md:p-8">
          <TravelRequirementsForm
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            isLoading={isSubmitting}
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
