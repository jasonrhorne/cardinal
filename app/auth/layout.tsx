// Force dynamic rendering for all auth pages to avoid SSR issues
export const dynamic = 'force-dynamic'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Cardinal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            AI-powered travel itineraries
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
