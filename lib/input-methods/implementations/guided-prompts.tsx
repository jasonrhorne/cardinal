/**
 * Guided Hybrid Input Method Implementation
 * Combines structured guidance with flexible input through progressive prompts
 * E004: Tests how guided assistance affects AI agent performance vs pure forms or open text
 */

import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Calendar,
  DollarSign,
  Heart,
  Clock,
  Check,
} from 'lucide-react'
import React, { useState } from 'react'

import type { TTravelRequirements } from '@/lib/schemas/travel-requirements'

import type { InputMethodProps, InputMethodMetadata } from '../types'

// Guided prompt step interface
interface GuidedStep {
  id: string
  title: string
  description: string
  required: boolean
  component: React.ComponentType<StepProps>
}

interface StepProps {
  value: any
  onChange: (value: any) => void
  onNext: () => void
  onBack: () => void
  isValid: boolean
  error?: string
}

// Internal state for guided prompts
interface GuidedPromptsState {
  currentStep: number
  completedSteps: Set<string>
  values: Record<string, any>
  startTime: number
  stepHistory: { stepId: string; timestamp: number; value: any }[]
  errors: Record<string, string>
  isComplete: boolean
}

// Step 1: Destination with smart suggestions
function DestinationStep({
  value,
  onChange,
  onNext,
  isValid,
  error,
}: StepProps) {
  const [input, setInput] = useState(value || '')
  const [suggestions, setSuggestions] = useState<string[]>([])

  const handleInputChange = (newValue: string) => {
    setInput(newValue)
    onChange(newValue)

    // Simple smart suggestions based on input
    if (newValue.length > 2) {
      const mockSuggestions = [
        'Paris, France',
        'Tokyo, Japan',
        'New York City, USA',
        'Barcelona, Spain',
        'Bangkok, Thailand',
        'Rome, Italy',
      ].filter(city => city.toLowerCase().includes(newValue.toLowerCase()))
      setSuggestions(mockSuggestions.slice(0, 3))
    } else {
      setSuggestions([])
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Where would you like to go?</h3>
      </div>

      <p className="text-gray-600 text-sm">
        Tell us your dream destination. We&apos;ll help you discover the perfect
        experiences there.
      </p>

      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={e => handleInputChange(e.target.value)}
          placeholder="e.g., Paris, Tokyo, or 'somewhere warm with great food'"
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onKeyDown={e => e.key === 'Enter' && isValid && onNext()}
        />

        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 shadow-lg z-10">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleInputChange(suggestion)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!isValid}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Step 2: Travel details with guided inputs
function TravelDetailsStep({
  value,
  onChange,
  onNext,
  onBack,
  isValid,
  error,
}: StepProps) {
  const [details, setDetails] = useState(
    value || {
      travelers: 2,
      children: 0,
      duration: 3,
      budget: 'moderate',
    }
  )

  const handleChange = (field: string, newValue: any) => {
    const updated = { ...details, [field]: newValue }
    setDetails(updated)
    onChange(updated)
  }

  const budgetOptions = [
    {
      value: 'budget',
      label: 'Budget-friendly',
      description: 'Under $100/day per person',
    },
    {
      value: 'moderate',
      label: 'Moderate',
      description: '$100-250/day per person',
    },
    { value: 'luxury', label: 'Luxury', description: '$250+/day per person' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Tell us about your trip</h3>
      </div>

      <div className="grid gap-4">
        {/* Travelers */}
        <div>
          <label
            htmlFor="travelers-input"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Number of travelers
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                handleChange('travelers', Math.max(1, details.travelers - 1))
              }
              className="w-10 h-10 rounded-full border border-gray-300 hover:bg-gray-50 flex items-center justify-center"
            >
              -
            </button>
            <span className="text-lg font-medium w-8 text-center">
              {details.travelers}
            </span>
            <button
              onClick={() => handleChange('travelers', details.travelers + 1)}
              className="w-10 h-10 rounded-full border border-gray-300 hover:bg-gray-50 flex items-center justify-center"
            >
              +
            </button>
            <span className="text-gray-500">adults</span>
          </div>

          {details.travelers > 1 && (
            <div className="mt-3 flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Children (under 12)?
              </span>
              <button
                onClick={() =>
                  handleChange('children', Math.max(0, details.children - 1))
                }
                className="w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-50 flex items-center justify-center text-sm"
              >
                -
              </button>
              <span className="text-sm font-medium w-6 text-center">
                {details.children}
              </span>
              <button
                onClick={() => handleChange('children', details.children + 1)}
                className="w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-50 flex items-center justify-center text-sm"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Duration */}
        <div>
          <label
            htmlFor="trip-duration"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            <Calendar className="w-4 h-4 inline mr-1" />
            Trip duration
          </label>
          <select
            id="trip-duration"
            value={details.duration}
            onChange={e => handleChange('duration', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>1 day</option>
            <option value={2}>2 days</option>
            <option value={3}>3 days (weekend)</option>
            <option value={4}>4 days</option>
            <option value={5}>5 days</option>
            <option value={7}>1 week</option>
          </select>
        </div>

        {/* Budget */}
        <div>
          <label
            htmlFor="budget-options"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            <DollarSign className="w-4 h-4 inline mr-1" />
            Budget preference
          </label>
          <div className="grid gap-2">
            {budgetOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleChange('budget', option.value)}
                className={`p-3 text-left border rounded-lg transition-colors ${
                  details.budget === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-gray-600">
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Step 3: Interests with guided selection
function InterestsStep({
  value,
  onChange,
  onNext,
  onBack,
  isValid,
  error,
}: StepProps) {
  const [interests, setInterests] = useState<string[]>(value || [])

  const interestCategories = [
    {
      title: 'Food & Culture',
      interests: [
        'local-cuisine',
        'street-food',
        'fine-dining',
        'cooking-classes',
        'food-markets',
        'cultural-sites',
      ],
    },
    {
      title: 'Arts & History',
      interests: [
        'museums',
        'galleries',
        'architecture',
        'historical-sites',
        'street-art',
        'performances',
      ],
    },
    {
      title: 'Outdoor & Activities',
      interests: [
        'nature',
        'hiking',
        'beaches',
        'adventure',
        'sports',
        'parks',
      ],
    },
    {
      title: 'Lifestyle & Social',
      interests: [
        'nightlife',
        'shopping',
        'photography',
        'local-experiences',
        'markets',
        'social-scene',
      ],
    },
  ]

  const toggleInterest = (interest: string) => {
    const updated = interests.includes(interest)
      ? interests.filter(i => i !== interest)
      : [...interests, interest]
    setInterests(updated)
    onChange(updated)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Heart className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">What interests you most?</h3>
      </div>

      <p className="text-gray-600 text-sm">
        Select the experiences that excite you. This helps us personalize your
        itinerary.
      </p>

      <div className="space-y-4">
        {interestCategories.map(category => (
          <div
            key={category.title}
            className="border border-gray-200 rounded-lg p-4"
          >
            <h4 className="font-medium text-gray-900 mb-3">{category.title}</h4>
            <div className="flex flex-wrap gap-2">
              {category.interests.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    interests.includes(interest)
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {interests.includes(interest) && (
                    <Check className="w-3 h-3 inline mr-1" />
                  )}
                  {interest.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Step 4: Travel style and pace
function TravelStyleStep({
  value,
  onChange,
  onNext,
  onBack,
  isValid,
  error,
}: StepProps) {
  const [style, setStyle] = useState(
    value || { pace: 'balanced', style: 'explorer' }
  )

  const paceOptions = [
    {
      value: 'relaxed',
      label: 'Relaxed',
      description: 'Slow pace, plenty of downtime',
    },
    {
      value: 'balanced',
      label: 'Balanced',
      description: 'Mix of activities and rest',
    },
    {
      value: 'active',
      label: 'Active',
      description: 'Packed schedule, see everything',
    },
  ]

  const styleOptions = [
    {
      value: 'explorer',
      label: 'Explorer',
      description: 'Off the beaten path, authentic local experiences',
    },
    {
      value: 'comfort',
      label: 'Comfort',
      description: 'Popular spots with reliable amenities',
    },
    {
      value: 'luxury',
      label: 'Luxury',
      description: 'Premium experiences and accommodations',
    },
    {
      value: 'adventure',
      label: 'Adventure',
      description: 'Unique activities and challenges',
    },
  ]

  const handleChange = (field: string, newValue: any) => {
    const updated = { ...style, [field]: newValue }
    setStyle(updated)
    onChange(updated)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">
          What&apos;s your travel style?
        </h3>
      </div>

      <div className="space-y-6">
        {/* Pace */}
        <div>
          <label
            htmlFor="pace-options"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            Preferred pace
          </label>
          <div className="grid gap-2">
            {paceOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleChange('pace', option.value)}
                className={`p-3 text-left border rounded-lg transition-colors ${
                  style.pace === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-gray-600">
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <label
            htmlFor="style-options"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            Travel approach
          </label>
          <div className="grid gap-2">
            {styleOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleChange('style', option.value)}
                className={`p-3 text-left border rounded-lg transition-colors ${
                  style.style === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-gray-600">
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Complete Setup <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Main guided prompts component
export function GuidedPromptsInput({
  onComplete,
  onCancel,
  defaultValues: _defaultValues,
}: InputMethodProps) {
  const [state, setState] = useState<GuidedPromptsState>({
    currentStep: 0,
    completedSteps: new Set(),
    values: {},
    startTime: Date.now(),
    stepHistory: [],
    errors: {},
    isComplete: false,
  })

  const steps: GuidedStep[] = [
    {
      id: 'destination',
      title: 'Destination',
      description: 'Where do you want to go?',
      required: true,
      component: DestinationStep,
    },
    {
      id: 'travel-details',
      title: 'Travel Details',
      description: 'Trip basics',
      required: true,
      component: TravelDetailsStep,
    },
    {
      id: 'interests',
      title: 'Interests',
      description: 'What excites you?',
      required: true,
      component: InterestsStep,
    },
    {
      id: 'travel-style',
      title: 'Style & Pace',
      description: 'How do you like to travel?',
      required: true,
      component: TravelStyleStep,
    },
  ]

  const currentStep = steps[state.currentStep]
  if (!currentStep) {
    return <div>Invalid step</div>
  }
  const StepComponent = currentStep.component

  const validateStep = (
    stepId: string,
    value: any
  ): { valid: boolean; error?: string } => {
    switch (stepId) {
      case 'destination': {
        const isValid = typeof value === 'string' && value.trim().length > 0
        return {
          valid: isValid,
          ...(isValid ? {} : { error: 'Please enter a destination' }),
        }
      }
      case 'travel-details': {
        const isValid =
          value && typeof value.travelers === 'number' && value.travelers > 0
        return {
          valid: isValid,
          ...(isValid ? {} : { error: 'Please specify number of travelers' }),
        }
      }
      case 'interests': {
        const isValid = Array.isArray(value) && value.length > 0
        return {
          valid: isValid,
          ...(isValid ? {} : { error: 'Please select at least one interest' }),
        }
      }
      case 'travel-style': {
        const isValid = value && value.pace && value.style
        return {
          valid: isValid,
          ...(isValid
            ? {}
            : { error: 'Please select pace and style preferences' }),
        }
      }
      default:
        return { valid: true }
    }
  }

  const handleStepChange = (value: any) => {
    setState(prev => ({
      ...prev,
      values: { ...prev.values, [currentStep.id]: value },
      errors: { ...prev.errors, [currentStep.id]: '' },
    }))
  }

  const goToNext = () => {
    const validation = validateStep(
      currentStep.id,
      state.values[currentStep.id]
    )

    if (!validation.valid) {
      setState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [currentStep.id]: validation.error || 'Invalid input',
        },
      }))
      return
    }

    // Track step completion
    setState(prev => {
      const newHistory = [
        ...prev.stepHistory,
        {
          stepId: currentStep.id,
          timestamp: Date.now(),
          value: prev.values[currentStep.id],
        },
      ]

      const newCompletedSteps = new Set(prev.completedSteps)
      newCompletedSteps.add(currentStep.id)

      if (prev.currentStep >= steps.length - 1) {
        // Final step - complete the form
        handleComplete({
          ...prev,
          stepHistory: newHistory,
          completedSteps: newCompletedSteps,
          isComplete: true,
        })
        return prev
      }

      return {
        ...prev,
        currentStep: prev.currentStep + 1,
        completedSteps: newCompletedSteps,
        stepHistory: newHistory,
        errors: { ...prev.errors, [currentStep.id]: '' },
      }
    })
  }

  const goToBack = () => {
    if (state.currentStep > 0) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }))
    }
  }

  const handleComplete = (finalState: GuidedPromptsState) => {
    // Transform guided prompts data to TTravelRequirements
    // Map guided prompts interests to schema interests
    const guidedInterests = finalState.values.interests || []
    const mappedInterests = guidedInterests
      .map((interest: string) => {
        // Map guided prompt interests to schema interests
        const interestMap: Record<string, string> = {
          'local-cuisine': 'food-dining',
          'street-food': 'food-dining',
          'fine-dining': 'food-dining',
          'cooking-classes': 'food-dining',
          'food-markets': 'food-dining',
          'cultural-sites': 'culture-local-experiences',
          museums: 'arts',
          galleries: 'arts',
          architecture: 'architecture',
          'historical-sites': 'history',
          'street-art': 'arts',
          performances: 'music-nightlife',
          nature: 'nature-outdoors',
          hiking: 'nature-outdoors',
          beaches: 'nature-outdoors',
          adventure: 'sports-recreation',
          sports: 'sports-recreation',
          parks: 'nature-outdoors',
          nightlife: 'music-nightlife',
          shopping: 'shopping',
          photography: 'arts',
          'local-experiences': 'culture-local-experiences',
          markets: 'shopping',
          'social-scene': 'culture-local-experiences',
        }
        return interestMap[interest] || 'culture-local-experiences'
      })
      .filter(
        (interest: string, index: number, arr: string[]) =>
          arr.indexOf(interest) === index
      ) // Remove duplicates

    const requirements: TTravelRequirements = {
      originCity: 'Not specified', // Will be enhanced in future versions
      numberOfAdults: finalState.values['travel-details']?.travelers || 2,
      numberOfChildren: finalState.values['travel-details']?.children || 0,
      childrenAges: [], // Will be enhanced to capture actual ages
      preferredTravelMethods: ['drive'], // Default, will be enhanced
      travelDurationLimits: {
        drive: 4,
        rail: 8,
        air: 6,
      },
      interests:
        mappedInterests.length > 0
          ? mappedInterests
          : ['culture-local-experiences'],
    }

    const metadata: InputMethodMetadata = {
      methodType: 'guided-prompts',
      startTime: finalState.startTime,
      completionTime: Date.now(),
      stepCount: steps.length,
      revisionsCount: finalState.stepHistory.filter(
        (h, _i, arr) => arr.filter(h2 => h2.stepId === h.stepId).length > 1
      ).length,
      userAgent: navigator.userAgent,
    }

    onComplete(requirements, metadata)
  }

  const currentStepValue = state.values[currentStep.id]
  const validation = validateStep(currentStep.id, currentStepValue)
  const currentStepError = state.errors[currentStep.id]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Step {state.currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(((state.currentStep + 1) / steps.length) * 100)}%
            complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((state.currentStep + 1) / steps.length) * 100}%`,
            }}
          />
        </div>

        {/* Step navigation */}
        <div className="flex justify-between mt-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center text-sm ${
                index <= state.currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-2 ${
                  state.completedSteps.has(step.id)
                    ? 'bg-green-100 text-green-700'
                    : index === state.currentStep
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                {state.completedSteps.has(step.id) ? (
                  <Check className="w-3 h-3" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="hidden sm:block">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current step */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <StepComponent
          {...{
            value: currentStepValue,
            onChange: handleStepChange,
            onNext: goToNext,
            onBack: goToBack,
            isValid: validation.valid,
            ...(currentStepError ? { error: currentStepError } : {}),
          }}
        />
      </div>

      {/* Cancel option */}
      <div className="mt-4 text-center">
        <button
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel and try a different approach
        </button>
      </div>
    </div>
  )
}
