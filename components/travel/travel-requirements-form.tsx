'use client'

import { Plus, Minus, MapPin, Users, Clock, Heart } from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'

import { Button, Input } from '@/components/ui'
import {
  type TTravelRequirementsForm,
  type TravelMethod,
  type InterestCategory,
  TRAVEL_METHODS,
  INTEREST_CATEGORIES,
  INTEREST_LABELS,
  TRAVEL_DURATION_OPTIONS,
  getDefaultTravelRequirements,
  validateTravelRequirements,
} from '@/lib/schemas/travel-requirements'

interface TravelRequirementsFormProps {
  initialData?: Partial<TTravelRequirementsForm>
  onSubmit: (data: TTravelRequirementsForm) => void
  onSaveDraft?: (data: Partial<TTravelRequirementsForm>) => void
  isLoading?: boolean
  className?: string
}

export function TravelRequirementsForm({
  initialData,
  onSubmit,
  onSaveDraft,
  isLoading = false,
  className = '',
}: TravelRequirementsFormProps) {
  // Form state
  const [formData, setFormData] = useState<Partial<TTravelRequirementsForm>>(
    () => ({
      ...getDefaultTravelRequirements(),
      ...initialData,
    })
  )

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDirty, setIsDirty] = useState(false)

  // Handle field changes
  const updateField = useCallback(
    (field: keyof TTravelRequirementsForm, value: any) => {
      setFormData(prev => {
        const updated = { ...prev, [field]: value }

        // Special handling for children count changes
        if (field === 'numberOfChildren') {
          const childCount = Number(value) || 0
          const currentAges = prev.childrenAges || []

          if (childCount > currentAges.length) {
            // Add new children with default age
            const newChildren = Array.from(
              { length: childCount - currentAges.length },
              (_, i) => ({
                id: `child-${currentAges.length + i + 1}`,
                age: 5,
              })
            )
            updated.childrenAges = [...currentAges, ...newChildren]
          } else if (childCount < currentAges.length) {
            // Remove excess children
            updated.childrenAges = currentAges.slice(0, childCount)
          }
        }

        return updated
      })
      setIsDirty(true)

      // Clear field-specific errors
      if (errors[field]) {
        setErrors(prev => {
          const { [field]: _, ...rest } = prev
          return rest
        })
      }
    },
    [errors]
  )

  // Handle child age changes
  const updateChildAge = useCallback((childId: string, age: number) => {
    setFormData(prev => ({
      ...prev,
      childrenAges: (prev.childrenAges || []).map(child =>
        child.id === childId ? { ...child, age } : child
      ),
    }))
    setIsDirty(true)
  }, [])

  // Handle travel method selection
  const toggleTravelMethod = useCallback((method: TravelMethod) => {
    setFormData(prev => {
      const currentMethods = prev.preferredTravelMethods || []
      const isSelected = currentMethods.includes(method)

      if (isSelected && currentMethods.length === 1) {
        // Don't allow removing the last method
        return prev
      }

      const updatedMethods = isSelected
        ? currentMethods.filter(m => m !== method)
        : [...currentMethods, method]

      return {
        ...prev,
        preferredTravelMethods: updatedMethods,
      }
    })
    setIsDirty(true)
  }, [])

  // Handle interest selection
  const toggleInterest = useCallback((interest: InterestCategory) => {
    setFormData(prev => {
      const currentInterests = prev.interests || []
      const isSelected = currentInterests.includes(interest)

      const updatedInterests = isSelected
        ? currentInterests.filter(i => i !== interest)
        : [...currentInterests, interest]

      return {
        ...prev,
        interests: updatedInterests,
      }
    })
    setIsDirty(true)
  }, [])

  // Handle travel duration changes
  const updateTravelDuration = useCallback(
    (method: TravelMethod, hours: number) => {
      setFormData(prev => ({
        ...prev,
        travelDurationLimits: {
          ...prev.travelDurationLimits,
          [method]: hours,
        },
      }))
      setIsDirty(true)
    },
    []
  )

  // Form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      const validation = validateTravelRequirements(formData)

      if (!validation.success) {
        const fieldErrors: Record<string, string> = {}
        validation.error.issues.forEach((error: any) => {
          if (error.path.length > 0) {
            fieldErrors[error.path[0] as string] = error.message
          }
        })
        setErrors(fieldErrors)
        return
      }

      setErrors({})
      onSubmit(validation.data)
    },
    [formData, onSubmit]
  )

  // Auto-save draft
  useEffect(() => {
    if (isDirty && onSaveDraft) {
      const timeoutId = setTimeout(() => {
        onSaveDraft(formData)
      }, 2000) // Save after 2 seconds of no changes

      return () => clearTimeout(timeoutId)
    }
    return undefined
  }, [formData, isDirty, onSaveDraft])

  return (
    <form onSubmit={handleSubmit} className={`space-y-8 ${className}`}>
      {/* Origin City */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h2>Where are you traveling from?</h2>
        </div>
        <Input
          label="Origin City"
          placeholder="e.g., San Francisco, CA"
          value={formData.originCity || ''}
          onChange={e => updateField('originCity', e.target.value)}
          error={errors.originCity}
          disabled={isLoading}
          className="max-w-md"
        />
      </section>

      {/* Travelers */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Users className="h-5 w-5 text-blue-600" />
          <h2>Who&apos;s traveling?</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Adults */}
          <div className="space-y-2">
            <label
              htmlFor="adults-count"
              className="block text-sm font-medium text-gray-700"
            >
              Number of Adults
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  updateField(
                    'numberOfAdults',
                    Math.max(1, (formData.numberOfAdults || 1) - 1)
                  )
                }
                disabled={isLoading || (formData.numberOfAdults || 1) <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span
                id="adults-count"
                className="w-12 text-center text-lg font-medium"
                aria-label="Number of adults"
              >
                {formData.numberOfAdults || 1}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  updateField(
                    'numberOfAdults',
                    (formData.numberOfAdults || 1) + 1
                  )
                }
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {errors.numberOfAdults && (
              <p className="text-sm text-red-600">{errors.numberOfAdults}</p>
            )}
          </div>

          {/* Children */}
          <div className="space-y-2">
            <label
              htmlFor="children-count"
              className="block text-sm font-medium text-gray-700"
            >
              Number of Children
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  updateField(
                    'numberOfChildren',
                    Math.max(0, (formData.numberOfChildren || 0) - 1)
                  )
                }
                disabled={isLoading || (formData.numberOfChildren || 0) <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span
                id="children-count"
                className="w-12 text-center text-lg font-medium"
                aria-label="Number of children"
              >
                {formData.numberOfChildren || 0}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  updateField(
                    'numberOfChildren',
                    (formData.numberOfChildren || 0) + 1
                  )
                }
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {errors.numberOfChildren && (
              <p className="text-sm text-red-600">{errors.numberOfChildren}</p>
            )}
          </div>
        </div>

        {/* Children Ages */}
        {(formData.numberOfChildren || 0) > 0 && (
          <div className="space-y-3">
            <label
              htmlFor="children-ages"
              className="block text-sm font-medium text-gray-700"
            >
              Children&apos;s Ages
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(formData.childrenAges || []).map((child, index) => (
                <div key={child.id} className="space-y-1">
                  <label className="block text-xs text-gray-600">
                    Child {index + 1}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={17}
                    value={child.age}
                    onChange={e =>
                      updateChildAge(child.id, parseInt(e.target.value) || 0)
                    }
                    disabled={isLoading}
                    className="text-center"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Travel Methods & Duration */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Clock className="h-5 w-5 text-blue-600" />
          <h2>How would you like to travel?</h2>
        </div>

        <div className="space-y-4">
          {TRAVEL_METHODS.map(method => (
            <div key={method} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`travel-${method}`}
                  checked={(formData.preferredTravelMethods || []).includes(
                    method
                  )}
                  onChange={() => toggleTravelMethod(method)}
                  disabled={isLoading}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor={`travel-${method}`}
                  className="font-medium capitalize"
                >
                  {method === 'air'
                    ? 'Air Travel'
                    : method === 'rail'
                      ? 'Rail/Train'
                      : 'Driving'}
                </label>
              </div>

              {(formData.preferredTravelMethods || []).includes(method) && (
                <div className="ml-6 space-y-2">
                  <label
                    htmlFor={`duration-${method}`}
                    className="block text-sm text-gray-600"
                  >
                    Maximum travel time:
                  </label>
                  <select
                    id={`duration-${method}`}
                    value={formData.travelDurationLimits?.[method] || 4}
                    onChange={e =>
                      updateTravelDuration(method, parseInt(e.target.value))
                    }
                    disabled={isLoading}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {TRAVEL_DURATION_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
        {errors.preferredTravelMethods && (
          <p className="text-sm text-red-600">
            {errors.preferredTravelMethods}
          </p>
        )}
      </section>

      {/* Interests */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Heart className="h-5 w-5 text-blue-600" />
          <h2>What are you interested in?</h2>
        </div>
        <p className="text-gray-600">Select all that apply:</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {INTEREST_CATEGORIES.map(interest => (
            <div key={interest} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`interest-${interest}`}
                checked={(formData.interests || []).includes(interest)}
                onChange={() => toggleInterest(interest)}
                disabled={isLoading}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor={`interest-${interest}`} className="text-sm">
                {INTEREST_LABELS[interest]}
              </label>
            </div>
          ))}
        </div>
        {errors.interests && (
          <p className="text-sm text-red-600">{errors.interests}</p>
        )}
      </section>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          isLoading={isLoading}
          className="flex-1"
        >
          {isLoading ? 'Processing...' : 'Find My Perfect Destinations'}
        </Button>
      </div>
    </form>
  )
}
