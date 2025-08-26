'use client'

import { useEffect, useRef, useCallback } from 'react'

/**
 * Focusable element selector - elements that can receive focus
 */
const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  'details',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ')

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll(FOCUSABLE_ELEMENTS)).filter(
    element => {
      const el = element as HTMLElement
      return (
        el.offsetWidth > 0 &&
        el.offsetHeight > 0 &&
        !el.hidden &&
        getComputedStyle(el).visibility !== 'hidden' &&
        getComputedStyle(el).display !== 'none'
      )
    }
  ) as HTMLElement[]
}

/**
 * Focus trap hook - contains focus within a specific element
 */
export function useFocusTrap(
  enabled: boolean = false
): [(node: HTMLElement | null) => void, () => void] {
  const containerRef = useRef<HTMLElement | null>(null)
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)

  const setContainer = useCallback((node: HTMLElement | null) => {
    containerRef.current = node
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !containerRef.current) {
        return
      }

      const focusableElements = getFocusableElements(containerRef.current)

      if (focusableElements.length === 0) {
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement as HTMLElement

      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab: moving backwards
          if (activeElement === firstElement) {
            event.preventDefault()
            lastElement?.focus()
          }
        } else {
          // Tab: moving forwards
          if (activeElement === lastElement) {
            event.preventDefault()
            firstElement?.focus()
          }
        }
      }

      // Handle Escape key for dismissing focus trap
      if (event.key === 'Escape') {
        releaseFocus()
      }
    },
    [enabled]
  )

  const releaseFocus = useCallback(() => {
    if (previouslyFocusedElement.current) {
      previouslyFocusedElement.current.focus()
      previouslyFocusedElement.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled || !containerRef.current) {
      return
    }

    // Store the previously focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement

    // Focus the first focusable element in the container
    const focusableElements = getFocusableElements(containerRef.current)
    if (focusableElements.length > 0) {
      focusableElements[0]?.focus()
    }

    // Add event listener for keyboard navigation
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (enabled) {
        releaseFocus()
      }
    }
  }, [enabled, handleKeyDown, releaseFocus])

  return [setContainer, releaseFocus]
}

/**
 * Auto-focus hook - automatically focuses an element when component mounts
 */
export function useAutoFocus(
  enabled: boolean = true,
  delay: number = 0
): (node: HTMLElement | null) => void {
  const setRef = useCallback(
    (node: HTMLElement | null) => {
      if (enabled && node) {
        if (delay > 0) {
          setTimeout(() => node.focus(), delay)
        } else {
          node.focus()
        }
      }
    },
    [enabled, delay]
  )

  return setRef
}

/**
 * Focus restoration hook - saves and restores focus when component unmounts
 */
export function useFocusRestore(): [() => void, () => void] {
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)

  const saveFocus = useCallback(() => {
    previouslyFocusedElement.current = document.activeElement as HTMLElement
  }, [])

  const restoreFocus = useCallback(() => {
    if (previouslyFocusedElement.current) {
      previouslyFocusedElement.current.focus()
    }
  }, [])

  return [saveFocus, restoreFocus]
}

/**
 * Roving tabindex hook - manages tabindex for radio groups and similar patterns
 */
export function useRovingTabindex<T extends HTMLElement>(
  items: T[],
  activeIndex: number,
  onIndexChange: (index: number) => void
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!items.length) {
        return
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault()
          onIndexChange((activeIndex + 1) % items.length)
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault()
          onIndexChange(activeIndex === 0 ? items.length - 1 : activeIndex - 1)
          break
        case 'Home':
          event.preventDefault()
          onIndexChange(0)
          break
        case 'End':
          event.preventDefault()
          onIndexChange(items.length - 1)
          break
      }
    },
    [items, activeIndex, onIndexChange]
  )

  useEffect(() => {
    items.forEach((item, index) => {
      if (index === activeIndex) {
        item.tabIndex = 0
        item.focus()
      } else {
        item.tabIndex = -1
      }
    })
  }, [items, activeIndex])

  useEffect(() => {
    const activeItem = items[activeIndex]
    if (activeItem) {
      activeItem.addEventListener('keydown', handleKeyDown)
      return () => activeItem.removeEventListener('keydown', handleKeyDown)
    }
    return undefined
  }, [items, activeIndex, handleKeyDown])
}

/**
 * Skip link functionality - allows users to skip to main content
 */
export function useSkipLink(targetId: string) {
  const handleClick = useCallback(() => {
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [targetId])

  return handleClick
}

/**
 * Focus visible utility - manages focus-visible styling
 */
export class FocusVisibleManager {
  private static instance: FocusVisibleManager
  private isKeyboardUser = false
  private focusVisibleElements = new Set<HTMLElement>()

  private constructor() {
    this.init()
  }

  static getInstance(): FocusVisibleManager {
    if (!FocusVisibleManager.instance) {
      FocusVisibleManager.instance = new FocusVisibleManager()
    }
    return FocusVisibleManager.instance
  }

  private init() {
    // Track keyboard usage
    document.addEventListener('keydown', this.handleKeyDown)
    document.addEventListener('mousedown', this.handleMouseDown)
    document.addEventListener('pointerdown', this.handlePointerDown)

    // Track focus events
    document.addEventListener('focusin', this.handleFocusIn, true)
    document.addEventListener('focusout', this.handleFocusOut, true)
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.metaKey || event.altKey || event.ctrlKey) {
      return
    }
    this.isKeyboardUser = true
  }

  private handleMouseDown = () => {
    this.isKeyboardUser = false
  }

  private handlePointerDown = () => {
    this.isKeyboardUser = false
  }

  private handleFocusIn = (event: FocusEvent) => {
    const target = event.target as HTMLElement
    if (!target) {
      return
    }

    if (this.isKeyboardUser || this.shouldShowFocusVisible(target)) {
      target.classList.add('focus-visible')
      this.focusVisibleElements.add(target)
    }
  }

  private handleFocusOut = (event: FocusEvent) => {
    const target = event.target as HTMLElement
    if (!target) {
      return
    }

    target.classList.remove('focus-visible')
    this.focusVisibleElements.delete(target)
  }

  private shouldShowFocusVisible(element: HTMLElement): boolean {
    // Always show focus visible for keyboard-only users
    if (this.isKeyboardUser) {
      return true
    }

    // Show for elements that typically need visible focus
    const alwaysVisible = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="password"]',
      'input[type="search"]',
      'textarea',
      '[contenteditable="true"]',
    ]

    return alwaysVisible.some(selector => element.matches(selector))
  }
}

/**
 * Initialize focus-visible management
 */
export function initializeFocusVisible() {
  FocusVisibleManager.getInstance()
}

/**
 * Announce to screen readers using aria-live
 */
export class LiveAnnouncer {
  private static instance: LiveAnnouncer
  private politeElement: HTMLElement | null = null
  private assertiveElement: HTMLElement | null = null

  static getInstance(): LiveAnnouncer {
    if (!LiveAnnouncer.instance) {
      LiveAnnouncer.instance = new LiveAnnouncer()
    }
    return LiveAnnouncer.instance
  }

  private createLiveRegion(priority: 'polite' | 'assertive'): HTMLElement {
    const element = document.createElement('div')
    element.setAttribute('aria-live', priority)
    element.setAttribute('aria-atomic', 'true')
    element.style.position = 'absolute'
    element.style.left = '-10000px'
    element.style.width = '1px'
    element.style.height = '1px'
    element.style.overflow = 'hidden'
    document.body.appendChild(element)
    return element
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (priority === 'polite') {
      if (!this.politeElement) {
        this.politeElement = this.createLiveRegion('polite')
      }
      this.politeElement.textContent = message
    } else {
      if (!this.assertiveElement) {
        this.assertiveElement = this.createLiveRegion('assertive')
      }
      this.assertiveElement.textContent = message
    }
  }

  clear() {
    if (this.politeElement) {
      this.politeElement.textContent = ''
    }
    if (this.assertiveElement) {
      this.assertiveElement.textContent = ''
    }
  }
}

/**
 * Hook for announcing messages to screen readers
 */
export function useLiveAnnouncer() {
  const announcer = LiveAnnouncer.getInstance()

  return {
    announce: announcer.announce.bind(announcer),
    clear: announcer.clear.bind(announcer),
  }
}
