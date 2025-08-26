'use client'

import { ProfileForm } from '@/components/profile/profile-form'
import { UserProfileProvider } from '@/lib/auth/providers'

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
