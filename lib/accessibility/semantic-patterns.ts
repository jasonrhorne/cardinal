// import { z } from 'zod' // Kept for future validation schemas

/**
 * Semantic HTML validation schemas
 */
// Validation schemas (kept for future use)
// const headingLevelSchema = z.union([
//   z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6),
// ])

// const landmarkRoleSchema = z.union([
//   z.literal('banner'), z.literal('main'), z.literal('navigation'),
//   z.literal('contentinfo'), z.literal('complementary'), z.literal('form'),
//   z.literal('search'), z.literal('region'),
// ])

/**
 * Semantic validation utilities
 */
export class SemanticValidator {
  /**
   * Validate heading hierarchy in a document or section
   */
  static validateHeadingHierarchy(container: HTMLElement): {
    valid: boolean
    violations: string[]
  } {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const violations: string[] = []
    let lastLevel = 0

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1))

      // First heading should ideally be h1 (unless in a section context)
      if (index === 0 && level > 2) {
        violations.push(
          `First heading should be h1 or h2, found ${heading.tagName.toLowerCase()}`
        )
      }

      // Don't skip heading levels
      if (level > lastLevel + 1) {
        violations.push(
          `Heading level skipped: ${heading.tagName.toLowerCase()} follows h${lastLevel}`
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
   * Validate landmark structure
   */
  static validateLandmarks(container: HTMLElement): {
    valid: boolean
    violations: string[]
  } {
    const violations: string[] = []

    // Check for main landmark
    const main = container.querySelector('[role="main"], main')
    if (!main) {
      violations.push('Document should have a main landmark')
    }

    // Check for multiple main landmarks
    const mains = container.querySelectorAll('[role="main"], main')
    if (mains.length > 1) {
      violations.push('Document should have only one main landmark')
    }

    // Check for unlabeled navigation landmarks when multiple exist
    const navs = container.querySelectorAll('[role="navigation"], nav')
    if (navs.length > 1) {
      navs.forEach((nav, index) => {
        const hasLabel =
          nav.getAttribute('aria-label') || nav.getAttribute('aria-labelledby')
        if (!hasLabel) {
          violations.push(
            `Navigation landmark at index ${index} should have an accessible name when multiple nav elements exist`
          )
        }
      })
    }

    return {
      valid: violations.length === 0,
      violations,
    }
  }

  /**
   * Validate form structure
   */
  static validateForms(container: HTMLElement): {
    valid: boolean
    violations: string[]
  } {
    const violations: string[] = []
    const forms = container.querySelectorAll('form')

    forms.forEach((form, formIndex) => {
      // Check for form labels or legends
      const hasLabel =
        form.getAttribute('aria-label') || form.getAttribute('aria-labelledby')
      const hasLegend = form.querySelector('legend')

      if (!hasLabel && !hasLegend) {
        violations.push(
          `Form at index ${formIndex} should have an accessible name via aria-label, aria-labelledby, or legend`
        )
      }

      // Check form controls
      const controls = form.querySelectorAll(
        'input:not([type="hidden"]), textarea, select'
      )

      controls.forEach((control, controlIndex) => {
        const inputElement = control as
          | HTMLInputElement
          | HTMLTextAreaElement
          | HTMLSelectElement
        const hasLabel =
          'labels' in inputElement &&
          inputElement.labels &&
          inputElement.labels.length > 0
        const hasAriaLabel = control.getAttribute('aria-label')
        const hasAriaLabelledBy = control.getAttribute('aria-labelledby')

        if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
          violations.push(
            `Form control at index ${controlIndex} in form ${formIndex} lacks proper labeling`
          )
        }
      })
    })

    return {
      valid: violations.length === 0,
      violations,
    }
  }
}

/**
 * Semantic HTML enforcement runtime checks (development only)
 */
export function enableSemanticValidation() {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  // Add mutation observer to check semantic structure
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement

            // Validate heading hierarchy
            const headingResult =
              SemanticValidator.validateHeadingHierarchy(element)
            if (!headingResult.valid) {
              console.warn(
                'Semantic HTML violations (headings):',
                headingResult.violations
              )
            }

            // Validate landmarks
            const landmarkResult = SemanticValidator.validateLandmarks(element)
            if (!landmarkResult.valid) {
              console.warn(
                'Semantic HTML violations (landmarks):',
                landmarkResult.violations
              )
            }

            // Validate forms
            const formResult = SemanticValidator.validateForms(element)
            if (!formResult.valid) {
              console.warn(
                'Semantic HTML violations (forms):',
                formResult.violations
              )
            }
          }
        })
      }
    })
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  return () => observer.disconnect()
}
