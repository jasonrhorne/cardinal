import { render, screen } from '@testing-library/react'
import React from 'react'

import { Spinner } from '../spinner'

describe('Spinner Component', () => {
  it('renders with default props', () => {
    render(<Spinner />)

    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('spinner', 'spinner-md')
    expect(spinner).toHaveAttribute('aria-label', 'Loading')
  })

  it('applies size classes correctly', () => {
    render(<Spinner size="sm" />)

    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('spinner-sm')
    expect(spinner).not.toHaveClass('spinner-md')
  })

  it('applies large size correctly', () => {
    render(<Spinner size="lg" />)

    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('spinner-lg')
  })

  it('applies custom className', () => {
    render(<Spinner className="custom-spinner" />)

    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('custom-spinner')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLSpanElement>()
    render(<Spinner ref={ref} />)

    expect(ref.current).toBeInstanceOf(HTMLSpanElement)
    expect(ref.current).toHaveClass('spinner')
  })

  it('has correct accessibility attributes', () => {
    render(<Spinner />)

    const spinner = screen.getByRole('status')
    expect(spinner).toHaveAttribute('role', 'status')
    expect(spinner).toHaveAttribute('aria-label', 'Loading')
  })

  it('can accept additional props', () => {
    render(<Spinner data-testid="custom-spinner" />)

    const spinner = screen.getByTestId('custom-spinner')
    expect(spinner).toBeInTheDocument()
  })
})
