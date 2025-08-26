'use client'

import { useState } from 'react'

import { Button, Input, Card, CardHeader, CardBody } from '@/components/ui'
import { useUserProfile } from '@/lib/auth/providers'
import type { UserProfile } from '@/types/profile'
import {
  TRAVEL_INTERESTS,
  DIETARY_RESTRICTIONS,
  CURRENCIES,
  TravelPace,
  UnitSystem,
} from '@/types/profile'

export function ProfileForm() {
  const { profile, loading, error, updateProfile, createProfile } =
    useUserProfile()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Form state
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    full_name: profile?.full_name || '',
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    travel_preferences: profile?.travel_preferences || {},
    settings: profile?.settings || {
      email_notifications: true,
      marketing_emails: false,
      public_profile: false,
      default_currency: 'USD',
      default_units: UnitSystem.IMPERIAL,
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      if (profile) {
        await updateProfile(formData)
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
      } else {
        await createProfile(formData)
        setMessage({ type: 'success', text: 'Profile created successfully!' })
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save profile',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInterestToggle = (interest: string) => {
    const currentInterests = formData.travel_preferences?.interests || []
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest]

    setFormData({
      ...formData,
      travel_preferences: {
        ...formData.travel_preferences,
        interests: newInterests,
      },
    })
  }

  const handleDietaryToggle = (restriction: string) => {
    const current = formData.travel_preferences?.dietary_restrictions || []
    const updated = current.includes(restriction)
      ? current.filter(r => r !== restriction)
      : [...current, restriction]

    setFormData({
      ...formData,
      travel_preferences: {
        ...formData.travel_preferences,
        dietary_restrictions: updated,
      },
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Basic Information</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Full Name"
            value={formData.full_name || ''}
            onChange={e =>
              setFormData({ ...formData, full_name: e.target.value })
            }
            placeholder="John Doe"
          />
          <Input
            label="Display Name"
            value={formData.display_name || ''}
            onChange={e =>
              setFormData({ ...formData, display_name: e.target.value })
            }
            placeholder="Johnny"
            help="This is how we'll address you in the app"
          />
          <div>
            <label
              htmlFor="bio-field"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Bio
            </label>
            <textarea
              id="bio-field"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              rows={4}
              value={formData.bio || ''}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us a bit about yourself and your travel style..."
            />
          </div>
        </CardBody>
      </Card>

      {/* Travel Preferences */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Travel Preferences</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Travel Pace */}
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              Travel Pace
            </div>
            <div className="flex gap-2">
              {Object.values(TravelPace).map(pace => (
                <button
                  key={pace}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      travel_preferences: {
                        ...formData.travel_preferences,
                        travel_pace: pace,
                      },
                    })
                  }
                  className={`px-4 py-2 rounded-md border ${
                    formData.travel_preferences?.travel_pace === pace
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pace.charAt(0).toUpperCase() + pace.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              Interests
            </div>
            <div className="flex flex-wrap gap-2">
              {TRAVEL_INTERESTS.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    formData.travel_preferences?.interests?.includes(interest)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {interest.charAt(0).toUpperCase() + interest.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              Dietary Restrictions
            </div>
            <div className="flex flex-wrap gap-2">
              {DIETARY_RESTRICTIONS.map(restriction => (
                <button
                  key={restriction}
                  type="button"
                  onClick={() => handleDietaryToggle(restriction)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    formData.travel_preferences?.dietary_restrictions?.includes(
                      restriction
                    )
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {restriction
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Settings</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Currency */}
          <div>
            <label
              htmlFor="currency-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Default Currency
            </label>
            <select
              id="currency-select"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              value={formData.settings?.default_currency || 'USD'}
              onChange={e =>
                setFormData({
                  ...formData,
                  settings: {
                    ...formData.settings,
                    default_currency: e.target.value,
                  },
                })
              }
            >
              {CURRENCIES.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          {/* Email Notifications */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.settings?.email_notifications ?? true}
                onChange={e =>
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      email_notifications: e.target.checked,
                    },
                  })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Email notifications</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.settings?.marketing_emails ?? false}
                onChange={e =>
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      marketing_emails: e.target.checked,
                    },
                  })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Marketing emails</span>
            </label>
          </div>
        </CardBody>
      </Card>

      {/* Messages */}
      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-md bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" isLoading={saving} disabled={saving}>
        {profile ? 'Update Profile' : 'Create Profile'}
      </Button>
    </form>
  )
}
