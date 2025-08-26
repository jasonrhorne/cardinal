/**
 * Cardinal Accessibility Foundation Library
 *
 * Provides comprehensive accessibility utilities, patterns, and testing tools
 * for WCAG 2.1 AA compliance.
 */

// Core accessibility testing utilities
export {
  expectNoAccessibilityViolations,
  renderWithAccessibilityCheck,
  runFullAccessibilityTest,
  FocusTester,
  SemanticTester,
} from './test-utils'

// Focus management system
export {
  getFocusableElements,
  useFocusTrap,
  useAutoFocus,
  useFocusRestore,
  useRovingTabindex,
  useSkipLink,
  initializeFocusVisible,
  FocusVisibleManager,
  LiveAnnouncer,
  useLiveAnnouncer,
} from './focus-management'

// Semantic HTML patterns and validation
export {
  SemanticValidator,
  enableSemanticValidation,
} from './semantic-patterns'

// ARIA patterns and hooks
export {
  useAriaExpanded,
  useAriaSelected,
  useAriaPressed,
  useAriaChecked,
  useAriaDescribedBy,
  useAriaLabelledBy,
  useCombobox,
  useAccordion,
  useTabs,
  useDialog,
  useListbox,
  useMenu,
  useTooltip,
  useAriaState,
} from './aria-patterns'

// Types
export type { AriaLivePriority, AriaState } from './aria-patterns'

/**
 * Initialize all accessibility systems
 * Call this once in your app's root component or main entry point
 */
export function initializeAccessibility() {
  // Initialize focus-visible management
  initializeFocusVisible()

  // Enable semantic validation in development
  if (process.env.NODE_ENV === 'development') {
    enableSemanticValidation()
  }

  // Initialize live announcer
  LiveAnnouncer.getInstance()
}

/**
 * Accessibility configuration object for the app
 */
export const accessibilityConfig = {
  // Enable development warnings
  developmentWarnings: process.env.NODE_ENV === 'development',

  // WCAG compliance level
  wcagLevel: '2.1 AA' as const,

  // Focus management settings
  focusManagement: {
    showFocusRings: true,
    restoreFocusOnUnmount: true,
    trapFocusInModals: true,
  },

  // Live announcements
  announcements: {
    politePriority: 'polite' as const,
    assertivePriority: 'assertive' as const,
  },

  // Testing configuration
  testing: {
    enableAxeChecks: process.env.NODE_ENV === 'test',
    skipColorContrastChecks: true, // Enable when design system is ready
    includeExperimentalRules: false,
  },
} as const
