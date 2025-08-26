'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

import { getFocusableElements } from './focus-management'

/**
 * ARIA live region priorities
 */
export type AriaLivePriority = 'off' | 'polite' | 'assertive'

/**
 * Common ARIA states and properties
 */
export interface AriaState {
  expanded?: boolean
  selected?: boolean
  checked?: boolean | 'mixed'
  pressed?: boolean
  current?: boolean | 'page' | 'step' | 'location' | 'date' | 'time'
  invalid?: boolean | 'grammar' | 'spelling'
  required?: boolean
  disabled?: boolean
  hidden?: boolean
  busy?: boolean
  grabbed?: boolean
  dropeffect?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup'
  orientation?: 'horizontal' | 'vertical'
  sort?: 'ascending' | 'descending' | 'none' | 'other'
  level?: number
  posinset?: number
  setsize?: number
  multiline?: boolean
  multiselectable?: boolean
  readonly?: boolean
  autocomplete?: 'inline' | 'list' | 'both' | 'none'
  haspopup?:
    | boolean
    | 'false'
    | 'true'
    | 'menu'
    | 'listbox'
    | 'tree'
    | 'grid'
    | 'dialog'
}

/**
 * Hook for managing ARIA expanded state (dropdowns, collapsibles, etc.)
 */
export function useAriaExpanded(initialExpanded: boolean = false) {
  const [expanded, setExpanded] = useState(initialExpanded)

  const toggle = useCallback(() => {
    setExpanded(prev => !prev)
  }, [])

  const open = useCallback(() => {
    setExpanded(true)
  }, [])

  const close = useCallback(() => {
    setExpanded(false)
  }, [])

  const ariaProps = {
    'aria-expanded': expanded,
  }

  return {
    expanded,
    toggle,
    open,
    close,
    ariaProps,
  }
}

/**
 * Hook for managing ARIA selected state (tabs, options, etc.)
 */
export function useAriaSelected(initialSelected: boolean = false) {
  const [selected, setSelected] = useState(initialSelected)

  const select = useCallback(() => {
    setSelected(true)
  }, [])

  const deselect = useCallback(() => {
    setSelected(false)
  }, [])

  const toggle = useCallback(() => {
    setSelected(prev => !prev)
  }, [])

  const ariaProps = {
    'aria-selected': selected,
  }

  return {
    selected,
    select,
    deselect,
    toggle,
    ariaProps,
  }
}

/**
 * Hook for managing ARIA pressed state (toggle buttons)
 */
export function useAriaPressed(initialPressed: boolean = false) {
  const [pressed, setPressed] = useState(initialPressed)

  const toggle = useCallback(() => {
    setPressed(prev => !prev)
  }, [])

  const ariaProps = {
    'aria-pressed': pressed,
  }

  return {
    pressed,
    toggle,
    ariaProps,
  }
}

/**
 * Hook for managing ARIA checked state (checkboxes, radio buttons)
 */
export function useAriaChecked(initialChecked: boolean | 'mixed' = false) {
  const [checked, setChecked] = useState(initialChecked)

  const toggle = useCallback(() => {
    setChecked(prev => (prev === true ? false : true))
  }, [])

  const setMixed = useCallback(() => {
    setChecked('mixed')
  }, [])

  const ariaProps = {
    'aria-checked': checked,
  }

  return {
    checked,
    toggle,
    setMixed,
    setChecked,
    ariaProps,
  }
}

/**
 * Hook for managing ARIA describedby relationships
 */
export function useAriaDescribedBy(...ids: (string | undefined)[]) {
  const validIds = ids.filter(Boolean)
  const describedBy = validIds.length > 0 ? validIds.join(' ') : undefined

  return {
    'aria-describedby': describedBy,
  }
}

/**
 * Hook for managing ARIA labelledby relationships
 */
export function useAriaLabelledBy(...ids: (string | undefined)[]) {
  const validIds = ids.filter(Boolean)
  const labelledBy = validIds.length > 0 ? validIds.join(' ') : undefined

  return {
    'aria-labelledby': labelledBy,
  }
}

/**
 * Combobox ARIA pattern hook
 */
export function useCombobox<T>(
  options: T[],
  getOptionId: (option: T, index: number) => string,
  getOptionLabel: (option: T) => string
) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [inputValue, setInputValue] = useState('')
  const listboxId = useRef(
    `combobox-listbox-${Math.random().toString(36).substr(2, 9)}`
  )

  const filteredOptions = options.filter(option =>
    getOptionLabel(option).toLowerCase().includes(inputValue.toLowerCase())
  )

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)
    setIsOpen(true)
    setSelectedIndex(-1)
  }, [])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
          }
          setSelectedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
          }
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          )
          break
        case 'Enter':
          if (isOpen && selectedIndex >= 0) {
            event.preventDefault()
            const selectedOption = filteredOptions[selectedIndex]
            setInputValue(getOptionLabel(selectedOption))
            setIsOpen(false)
            setSelectedIndex(-1)
          }
          break
        case 'Escape':
          setIsOpen(false)
          setSelectedIndex(-1)
          break
      }
    },
    [isOpen, selectedIndex, filteredOptions, getOptionLabel]
  )

  const inputProps = {
    role: 'combobox',
    'aria-expanded': isOpen,
    'aria-owns': listboxId.current,
    'aria-haspopup': 'listbox' as const,
    'aria-activedescendant':
      selectedIndex >= 0
        ? getOptionId(filteredOptions[selectedIndex], selectedIndex)
        : undefined,
    'aria-autocomplete': 'list' as const,
    value: inputValue,
    onKeyDown: handleKeyDown,
  }

  const listboxProps = {
    id: listboxId.current,
    role: 'listbox',
    hidden: !isOpen,
  }

  const getOptionProps = (option: T, index: number) => ({
    id: getOptionId(option, index),
    role: 'option',
    'aria-selected': index === selectedIndex,
  })

  return {
    isOpen,
    selectedIndex,
    inputValue,
    filteredOptions,
    handleInputChange,
    inputProps,
    listboxProps,
    getOptionProps,
    setIsOpen,
  }
}

/**
 * Accordion ARIA pattern hook
 */
export function useAccordion(panels: string[], allowMultiple: boolean = false) {
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set())

  const togglePanel = useCallback(
    (panelId: string) => {
      setExpandedPanels(prev => {
        const newSet = new Set(prev)

        if (newSet.has(panelId)) {
          newSet.delete(panelId)
        } else {
          if (!allowMultiple) {
            newSet.clear()
          }
          newSet.add(panelId)
        }

        return newSet
      })
    },
    [allowMultiple]
  )

  const getHeaderProps = (panelId: string) => ({
    'aria-expanded': expandedPanels.has(panelId),
    'aria-controls': `${panelId}-content`,
    id: `${panelId}-header`,
  })

  const getPanelProps = (panelId: string) => ({
    id: `${panelId}-content`,
    'aria-labelledby': `${panelId}-header`,
    hidden: !expandedPanels.has(panelId),
  })

  return {
    expandedPanels,
    togglePanel,
    getHeaderProps,
    getPanelProps,
  }
}

/**
 * Tabs ARIA pattern hook
 */
export function useTabs(tabIds: string[], initialActiveTab?: string) {
  const [activeTab, setActiveTab] = useState(
    initialActiveTab || tabIds[0] || ''
  )

  const getTabProps = (tabId: string) => ({
    id: `tab-${tabId}`,
    role: 'tab',
    'aria-selected': tabId === activeTab,
    'aria-controls': `panel-${tabId}`,
    tabIndex: tabId === activeTab ? 0 : -1,
  })

  const getPanelProps = (tabId: string) => ({
    id: `panel-${tabId}`,
    role: 'tabpanel',
    'aria-labelledby': `tab-${tabId}`,
    hidden: tabId !== activeTab,
    tabIndex: 0,
  })

  const tabListProps = {
    role: 'tablist',
  }

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, tabId: string) => {
      const currentIndex = tabIds.indexOf(tabId)

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault()
          const nextIndex = (currentIndex + 1) % tabIds.length
          setActiveTab(tabIds[nextIndex])
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault()
          const prevIndex =
            currentIndex === 0 ? tabIds.length - 1 : currentIndex - 1
          setActiveTab(tabIds[prevIndex])
          break
        case 'Home':
          event.preventDefault()
          setActiveTab(tabIds[0])
          break
        case 'End':
          event.preventDefault()
          setActiveTab(tabIds[tabIds.length - 1])
          break
      }
    },
    [tabIds]
  )

  return {
    activeTab,
    setActiveTab,
    getTabProps,
    getPanelProps,
    tabListProps,
    handleKeyDown,
  }
}

/**
 * Dialog/Modal ARIA pattern hook
 */
export function useDialog(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLElement | null>(null)
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Save previously focused element
      previouslyFocusedElement.current = document.activeElement as HTMLElement

      // Focus the dialog
      if (dialogRef.current) {
        const focusableElements = getFocusableElements(dialogRef.current)
        if (focusableElements.length > 0) {
          focusableElements[0].focus()
        } else {
          dialogRef.current.focus()
        }
      }
    } else {
      // Restore focus
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus()
      }
    }
  }, [isOpen])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  const dialogProps = {
    ref: dialogRef,
    role: 'dialog',
    'aria-modal': true,
    tabIndex: -1,
  }

  return {
    dialogProps,
  }
}

/**
 * Listbox ARIA pattern hook
 */
export function useListbox<T>(
  options: T[],
  getOptionId: (option: T, index: number) => string,
  multiselectable: boolean = false
) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [focusedIndex, setFocusedIndex] = useState(0)

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex(prev => Math.min(prev + 1, options.length - 1))
          break
        case 'ArrowUp':
          event.preventDefault()
          setFocusedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Home':
          event.preventDefault()
          setFocusedIndex(0)
          break
        case 'End':
          event.preventDefault()
          setFocusedIndex(options.length - 1)
          break
        case ' ':
        case 'Enter':
          event.preventDefault()
          setSelectedIndices(prev => {
            const newSet = new Set(prev)
            if (newSet.has(focusedIndex)) {
              newSet.delete(focusedIndex)
            } else {
              if (!multiselectable) {
                newSet.clear()
              }
              newSet.add(focusedIndex)
            }
            return newSet
          })
          break
      }
    },
    [options.length, focusedIndex, multiselectable]
  )

  const listboxProps = {
    role: 'listbox',
    'aria-multiselectable': multiselectable,
    tabIndex: 0,
    onKeyDown: handleKeyDown,
  }

  const getOptionProps = (option: T, index: number) => ({
    id: getOptionId(option, index),
    role: 'option',
    'aria-selected': selectedIndices.has(index),
    tabIndex: index === focusedIndex ? 0 : -1,
  })

  return {
    selectedIndices,
    focusedIndex,
    listboxProps,
    getOptionProps,
    setSelectedIndices,
    setFocusedIndex,
  }
}

/**
 * Menu ARIA pattern hook
 */
export function useMenu(menuItems: string[]) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const menuRef = useRef<HTMLElement | null>(null)

  const handleTriggerKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'Enter':
      case ' ':
        event.preventDefault()
        setIsOpen(true)
        setFocusedIndex(0)
        break
    }
  }, [])

  const handleMenuKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex(prev => (prev < menuItems.length - 1 ? prev + 1 : 0))
          break
        case 'ArrowUp':
          event.preventDefault()
          setFocusedIndex(prev => (prev > 0 ? prev - 1 : menuItems.length - 1))
          break
        case 'Home':
          event.preventDefault()
          setFocusedIndex(0)
          break
        case 'End':
          event.preventDefault()
          setFocusedIndex(menuItems.length - 1)
          break
        case 'Escape':
          event.preventDefault()
          setIsOpen(false)
          setFocusedIndex(-1)
          break
      }
    },
    [menuItems.length]
  )

  const triggerProps = {
    'aria-haspopup': 'menu' as const,
    'aria-expanded': isOpen,
    onKeyDown: handleTriggerKeyDown,
  }

  const menuProps = {
    ref: menuRef,
    role: 'menu',
    hidden: !isOpen,
    onKeyDown: handleMenuKeyDown,
  }

  const getItemProps = (itemId: string, index: number) => ({
    role: 'menuitem',
    tabIndex: index === focusedIndex ? 0 : -1,
  })

  return {
    isOpen,
    setIsOpen,
    focusedIndex,
    triggerProps,
    menuProps,
    getItemProps,
  }
}

/**
 * Tooltip ARIA pattern hook
 */
export function useTooltip() {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`)

  const show = useCallback(() => setIsVisible(true), [])
  const hide = useCallback(() => setIsVisible(false), [])

  const triggerProps = {
    'aria-describedby': isVisible ? tooltipId.current : undefined,
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
  }

  const tooltipProps = {
    id: tooltipId.current,
    role: 'tooltip',
    hidden: !isVisible,
  }

  return {
    isVisible,
    triggerProps,
    tooltipProps,
    show,
    hide,
  }
}

/**
 * Generic ARIA state manager
 */
export function useAriaState(initialState: AriaState = {}) {
  const [state, setState] = useState<AriaState>(initialState)

  const updateState = useCallback((updates: Partial<AriaState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const resetState = useCallback(() => {
    setState(initialState)
  }, [initialState])

  // Convert state to ARIA attributes
  const ariaProps = Object.entries(state).reduce(
    (props, [key, value]) => {
      if (value !== undefined) {
        const ariaKey = `aria-${key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)}`
        props[ariaKey] = value
      }
      return props
    },
    {} as Record<string, any>
  )

  return {
    state,
    updateState,
    resetState,
    ariaProps,
  }
}
