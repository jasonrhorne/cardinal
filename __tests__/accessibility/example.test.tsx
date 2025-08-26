import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  expectNoAccessibilityViolations,
  renderWithAccessibilityCheck,
  runFullAccessibilityTest,
  FocusTester,
  SemanticTester,
} from '@/lib/accessibility/test-utils'
import { Input } from '@/components/ui/input'

// Example accessibility test for existing Input component
describe('Input Component Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const rendered = render(
      <Input
        label="Email address"
        id="email"
        type="email"
        placeholder="Enter your email"
      />
    )

    await expectNoAccessibilityViolations(rendered, {
      rules: {
        'color-contrast': { enabled: false }, // Skip color contrast for test environment
      },
    })
  })

  it('should render with accessibility check', async () => {
    await renderWithAccessibilityCheck(
      <Input
        label="Password"
        id="password"
        type="password"
        required
        error="Password is required"
      />,
      {
        rules: {
          'color-contrast': { enabled: false }, // Skip color contrast for test environment
        },
      }
    )
  })

  it('should have proper form labeling', () => {
    const { container } = render(
      <Input label="Username" id="username" help="Choose a unique username" />
    )

    const semanticTester = new SemanticTester(container)
    const formLabels = semanticTester.checkFormLabels()

    expect(formLabels.valid).toBe(true)
    expect(formLabels.violations).toHaveLength(0)
  })

  it('should handle focus management correctly', async () => {
    const { container } = render(
      <form>
        <label htmlFor="first-name">First name</label>
        <input id="first-name" type="text" />
        <label htmlFor="last-name">Last name</label>
        <input id="last-name" type="text" />
        <button type="submit">Submit</button>
      </form>
    )

    const focusTester = new FocusTester(container)
    const focusableElements = focusTester.getFocusableElements()

    expect(focusableElements.length).toBeGreaterThanOrEqual(2)

    const tabOrder = await focusTester.simulateTabNavigation()
    expect(tabOrder.length).toBeGreaterThanOrEqual(2)
  })

  it('should pass comprehensive accessibility test', async () => {
    const rendered = render(
      <form>
        <Input
          label="Full name"
          id="full-name"
          required
          help="Enter your first and last name"
        />
        <Input
          label="Email"
          id="email"
          type="email"
          error="Please enter a valid email address"
        />
        <button type="submit">Create Account</button>
      </form>
    )

    const results = await runFullAccessibilityTest(rendered, {
      rules: {
        'color-contrast': { enabled: false }, // Skip color contrast for now
      },
    })

    expect(results.semanticTest.formLabels.valid).toBe(true)
    expect(results.focusTest.focusableElements.length).toBeGreaterThan(0)
  })

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup()

    render(<Input label="Search" id="search" type="search" />)

    const input = screen.getByLabelText('Search')

    // Test keyboard focus
    await user.tab()
    expect(input).toHaveFocus()

    // Test typing
    await user.type(input, 'test query')
    expect(input).toHaveValue('test query')

    // Test clearing with keyboard
    await user.clear(input)
    expect(input).toHaveValue('')
  })

  it('should announce errors to screen readers', () => {
    render(
      <Input
        label="Age"
        id="age"
        type="number"
        error="Age must be a positive number"
      />
    )

    const errorElement = screen.getByText('Age must be a positive number')
    expect(errorElement).toHaveAttribute('role', 'alert')
    expect(errorElement).toHaveAttribute('aria-live', 'polite')
  })
})
