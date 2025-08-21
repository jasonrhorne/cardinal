// import { Button } from '@/components/ui' // TODO: Add when implementing interactive elements

export default function HomePage() {
  return (
    <div className="container-custom section-padding">
      <div className="text-center">
        <h1 className="heading-1">Cardinal</h1>
        <p className="mt-6 text-lg leading-8 text-muted md:text-xl">
          AI-powered travel itineraries that discover unique destinations
          through persona-driven lenses
        </p>
        <div className="mt-10">
          <a href="/auth/signin" className="btn btn-primary btn-lg">
            Get started
          </a>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="text-center">
          <div className="card card-body">
            <h3 className="heading-4">Persona-Driven</h3>
            <p className="mt-2 text-muted">
              Get recommendations through different lenses: photographer,
              foodie, family explorer
            </p>
          </div>
        </div>

        <div className="text-center">
          <div className="card card-body">
            <h3 className="heading-4">AI-Powered</h3>
            <p className="mt-2 text-muted">
              Advanced AI agents create unique itineraries validated with
              real-time data
            </p>
          </div>
        </div>

        <div className="text-center">
          <div className="card card-body">
            <h3 className="heading-4">Mobile-First</h3>
            <p className="mt-2 text-muted">
              Beautiful, responsive itineraries designed for on-the-go
              consumption
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
