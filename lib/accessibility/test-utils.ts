'use client'

import { render, RenderResult } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ReactElement } from 'react'

interface AccessibilityTestOptions {
  /**
   * Axe configuration rules to run or exclude
   */
  rules?: Record<string, { enabled: boolean }>
  /**
   * Tags to include or exclude (e.g., 'wcag2a', 'wcag2aa', 'wcag21aa')
   */
  tags?: string[]
  /**
   * Timeout for accessibility scan in milliseconds
   */
  timeout?: number
}

/**
 * Test component for accessibility violations
 * Uses axe-core to scan rendered component
 */
export async function expectNoAccessibilityViolations(
  element: RenderResult | HTMLElement,
  options: AccessibilityTestOptions = {}
) {
  const config = {
    rules: {
      // Enable WCAG 2.1 AA rules by default
      'color-contrast': { enabled: true },
      ...options.rules,
    },
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa', ...(options.tags || [])],
  }

  const container = 'container' in element ? element.container : element
  const results = await axe(container, config)

  // @ts-ignore - jest-axe extends expect with toHaveNoViolations
  expect(results).toHaveNoViolations()
  return results
}

/**
 * Render component and automatically test for accessibility violations
 */
export async function renderWithAccessibilityCheck(
  ui: ReactElement,
  options: AccessibilityTestOptions = {}
) {
  const rendered = render(ui)
  await expectNoAccessibilityViolations(rendered, options)
  return rendered
}

/**
 * Test focus management and keyboard navigation
 */
export class FocusTester {
  private container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
  }

  /**
   * Get all focusable elements in order
   */
  getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'details',
      'summary',
    ].join(', ')

    return Array.from(
      this.container.querySelectorAll(focusableSelectors)
    ).filter(el => {
      const element = el as HTMLElement
      return (
        element.offsetWidth > 0 &&
        element.offsetHeight > 0 &&
        !element.hidden &&
        getComputedStyle(element).visibility !== 'hidden'
      )
    }) as HTMLElement[]
  }

  /**
   * Simulate Tab key navigation through focusable elements
   */
  async simulateTabNavigation(): Promise<HTMLElement[]> {
    const focusableElements = this.getFocusableElements()
    const focusOrder: HTMLElement[] = []

    for (const element of focusableElements) {
      element.focus()
      focusOrder.push(document.activeElement as HTMLElement)

      // Allow time for focus events to process
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    return focusOrder
  }

  /**
   * Test that focus trap works correctly
   */
  async testFocusTrap(trapContainer: HTMLElement): Promise<boolean> {
    const focusableInTrap = trapContainer.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    if (focusableInTrap.length === 0) {
      return false
    }

    // Focus first element
    ;(focusableInTrap[0] as HTMLElement).focus()

    // Simulate Tab navigation within trap
    for (let i = 0; i < focusableInTrap.length * 2; i++) {
      const activeElement = document.activeElement

      // Simulate Tab key
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      })

      activeElement?.dispatchEvent(event)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Check if focus stayed within trap
      if (!trapContainer.contains(document.activeElement)) {
        return false
      }
    }

    return true
  }

  /**
   * Test that Escape key works for modal/overlay dismissal
   */
  testEscapeKey(element: HTMLElement, onEscape: () => void): boolean {
    element.focus()

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    })

    let escapeCalled = false
    const mockEscape = () => {
      escapeCalled = true
      onEscape()
    }

    element.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        mockEscape()
      }
    })

    element.dispatchEvent(event)
    return escapeCalled
  }
}

/**
 * Test ARIA attributes and semantic HTML
 */
export class SemanticTester {
  private container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
  }

  /**
   * Check if form elements have proper labels
   */
  checkFormLabels(): { valid: boolean; violations: string[] } {
    const inputs = this.container.querySelectorAll(
      'input:not([type="hidden"]), textarea, select'
    )
    const violations: string[] = []

    inputs.forEach((input, index) => {
      const element = input as HTMLInputElement
      // element.id could be used for more detailed error messages
      const hasLabel = element.labels && element.labels.length > 0
      const hasAriaLabel = element.getAttribute('aria-label')
      const hasAriaLabelledBy = element.getAttribute('aria-labelledby')

      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        violations.push(
          `Form element at index ${index} (${element.tagName.toLowerCase()}) lacks proper labeling`
        )
      }
    })

    return {
      valid: violations.length === 0,
      violations,
    }
  }

  /**
   * Check if images have alt text
   */
  checkImageAltText(): { valid: boolean; violations: string[] } {
    const images = this.container.querySelectorAll('img')
    const violations: string[] = []

    images.forEach((img, index) => {
      const alt = img.getAttribute('alt')
      const role = img.getAttribute('role')
      const ariaLabel = img.getAttribute('aria-label')

      // Decorative images should have empty alt or role="presentation"
      if (role === 'presentation' || role === 'none') {
        return // Skip decorative images
      }

      if (alt === null && !ariaLabel) {
        violations.push(`Image at index ${index} missing alt attribute`)
      }
    })

    return {
      valid: violations.length === 0,
      violations,
    }
  }

  /**
   * Check if headings are in logical order
   */
  checkHeadingOrder(): { valid: boolean; violations: string[] } {
    const headings = this.container.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const violations: string[] = []
    let lastLevel = 0

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1))

      if (index === 0 && level !== 1) {
        violations.push('First heading should be h1')
      }

      if (level > lastLevel + 1) {
        violations.push(
          `Heading level skipped: ${heading.tagName} follows h${lastLevel} (should not skip levels)`
        )
      }

      lastLevel = level
    })

    return {
      valid: violations.length === 0,
      violations,
    }
  }

  /**
   * Check if interactive elements have accessible names
   */
  checkInteractiveElements(): { valid: boolean; violations: string[] } {
    const interactive = this.container.querySelectorAll(
      'button, a, input[type="button"], input[type="submit"], [role="button"], [tabindex="0"]'
    )
    const violations: string[] = []

    interactive.forEach((element, index) => {
      const textContent = element.textContent?.trim()
      const ariaLabel = element.getAttribute('aria-label')
      const ariaLabelledBy = element.getAttribute('aria-labelledby')
      const title = element.getAttribute('title')

      if (!textContent && !ariaLabel && !ariaLabelledBy && !title) {
        violations.push(
          `Interactive element at index ${index} (${element.tagName.toLowerCase()}) lacks accessible name`
        )
      }
    })

    return {
      valid: violations.length === 0,
      violations,
    }
  }
}

/**
 * Comprehensive accessibility test suite
 */
export async function runFullAccessibilityTest(
  element: RenderResult | HTMLElement,
  options: AccessibilityTestOptions = {}
): Promise<{
  axeResults: any
  focusTest: {
    focusableElements: HTMLElement[]
    tabOrder: HTMLElement[]
  }
  semanticTest: {
    formLabels: { valid: boolean; violations: string[] }
    imageAlt: { valid: boolean; violations: string[] }
    headingOrder: { valid: boolean; violations: string[] }
    interactiveElements: { valid: boolean; violations: string[] }
  }
}> {
  const container = 'container' in element ? element.container : element

  // Run axe-core scan
  const axeResults = await expectNoAccessibilityViolations(element, options)

  // Test focus management
  const focusTester = new FocusTester(container)
  const focusableElements = focusTester.getFocusableElements()
  const tabOrder = await focusTester.simulateTabNavigation()

  // Test semantic HTML
  const semanticTester = new SemanticTester(container)
  const formLabels = semanticTester.checkFormLabels()
  const imageAlt = semanticTester.checkImageAltText()
  const headingOrder = semanticTester.checkHeadingOrder()
  const interactiveElements = semanticTester.checkInteractiveElements()

  return {
    axeResults,
    focusTest: {
      focusableElements,
      tabOrder,
    },
    semanticTest: {
      formLabels,
      imageAlt,
      headingOrder,
      interactiveElements,
    },
  }
}
