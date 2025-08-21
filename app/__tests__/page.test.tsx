import { render, screen } from '@testing-library/react'
import React from 'react'

import HomePage from '../page'

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<HomePage />)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('Cardinal')
  })

  it('renders the tagline', () => {
    render(<HomePage />)

    const tagline = screen.getByText(
      /AI-powered travel itineraries that discover unique destinations/i
    )
    expect(tagline).toBeInTheDocument()
  })

  it('renders the get started link', () => {
    render(<HomePage />)

    const getStartedLink = screen.getByRole('link', { name: /get started/i })
    expect(getStartedLink).toBeInTheDocument()
    expect(getStartedLink).toHaveAttribute('href', '/auth/signin')
  })

  it('renders all feature cards', () => {
    render(<HomePage />)

    expect(screen.getByText('Persona-Driven')).toBeInTheDocument()
    expect(screen.getByText('AI-Powered')).toBeInTheDocument()
    expect(screen.getByText('Mobile-First')).toBeInTheDocument()
  })

  it('renders feature descriptions', () => {
    render(<HomePage />)

    expect(
      screen.getByText(/Get recommendations through different lenses/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Advanced AI agents create unique itineraries/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Beautiful, responsive itineraries designed for on-the-go/i
      )
    ).toBeInTheDocument()
  })

  it('has proper semantic structure', () => {
    render(<HomePage />)

    // Check for proper heading hierarchy
    const h1 = screen.getByRole('heading', { level: 1 })
    const h3s = screen.getAllByRole('heading', { level: 3 })

    expect(h1).toBeInTheDocument()
    expect(h3s).toHaveLength(3) // Three feature cards
  })

  it('applies correct CSS classes', () => {
    render(<HomePage />)

    const mainContainer = screen
      .getByText('Cardinal')
      .closest('.container-custom')
    expect(mainContainer).toHaveClass('container-custom', 'section-padding')
  })
})
