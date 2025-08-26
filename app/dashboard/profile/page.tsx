'use client'

import dynamicImport from 'next/dynamic'

import { UserProfileProvider } from '@/lib/auth/providers'

// Dynamic import to prevent SSR issues
const ProfileForm = dynamicImport(
  () =>
    import('@/components/profile/profile-form').then(mod => mod.ProfileForm),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    ),
  }
)

export default function ProfilePage() {
  return (
    <UserProfileProvider>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
        <ProfileForm />
      </div>
    </UserProfileProvider>
  )
}

// Force dynamic rendering to prevent SSR issues with auth state
export const dynamic = 'force-dynamic'
