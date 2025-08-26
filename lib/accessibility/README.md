# Cardinal Accessibility Foundation

A comprehensive accessibility library providing WCAG 2.1 AA compliance tools, patterns, and utilities for the Cardinal travel app.

## Quick Start

### 1. Initialize Accessibility Systems

In your app's root component (`app/layout.tsx` or `pages/_app.tsx`):

```tsx
import { initializeAccessibility } from '@/lib/accessibility'

export default function RootLayout() {
  useEffect(() => {
    initializeAccessibility()
  }, [])

  return (
    <html lang="en">
      <body>
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <main id="main-content">{children}</main>
      </body>
    </html>
  )
}
```

### 2. Use Semantic Components

Replace basic HTML with semantic components:

```tsx
import {
  SemanticHeading,
  SemanticButton,
  SemanticFormField,
  SemanticLandmark,
} from '@/lib/accessibility'

function ItineraryForm() {
  return (
    <SemanticLandmark as="section" role="main">
      <SemanticHeading level={1}>Create Your Itinerary</SemanticHeading>

      <form>
        <SemanticFormField
          label="Destination"
          id="destination"
          required
          help="Enter a city or country name"
        >
          <input id="destination" type="text" />
        </SemanticFormField>

        <SemanticButton type="submit" variant="primary">
          Generate Itinerary
        </SemanticButton>
      </form>
    </SemanticLandmark>
  )
}
```

### 3. Add Accessibility Tests

```tsx
import { expectNoAccessibilityViolations } from '@/lib/accessibility'

it('should be accessible', async () => {
  const rendered = render(<ItineraryForm />)
  await expectNoAccessibilityViolations(rendered)
})
```

## Core Modules

### 🎯 Focus Management (`focus-management.ts`)

Tools for keyboard navigation and focus control:

- **`useFocusTrap`**: Contains focus within modals/dropdowns
- **`useAutoFocus`**: Automatically focuses elements on mount
- **`useFocusRestore`**: Saves/restores focus when components unmount
- **`useRovingTabindex`**: Manages focus in radio groups and lists
- **`useLiveAnnouncer`**: Announces messages to screen readers

```tsx
function Modal({ isOpen, onClose }) {
  const [trapRef, releaseFocus] = useFocusTrap(isOpen)
  const { announce } = useLiveAnnouncer()

  useEffect(() => {
    if (isOpen) {
      announce('Modal opened', 'polite')
    }
  }, [isOpen])

  return (
    <div ref={trapRef} role="dialog" aria-modal="true">
      <h2>Modal Title</h2>
      <button onClick={onClose}>Close</button>
    </div>
  )
}
```

### 🏗️ Semantic Patterns (`semantic-patterns.ts`)

Enforces proper HTML structure and labeling:

- **`SemanticHeading`**: Validates heading hierarchy (h1-h6)
- **`SemanticLandmark`**: Creates properly labeled page regions
- **`SemanticFormField`**: Ensures form fields have proper labeling
- **`SemanticButton`**: Accessible buttons with loading states
- **`SemanticValidator`**: Runtime validation of HTML structure

```tsx
function TravelPreferences() {
  return (
    <SemanticLandmark
      as="section"
      role="region"
      aria-label="Travel Preferences"
    >
      <SemanticHeading level={2}>Choose Your Style</SemanticHeading>

      <SemanticFormField
        label="Travel pace"
        id="pace"
        help="How fast do you like to move?"
      >
        <select id="pace">
          <option>Relaxed</option>
          <option>Moderate</option>
          <option>Fast-paced</option>
        </select>
      </SemanticFormField>
    </SemanticLandmark>
  )
}
```

### 🎪 ARIA Patterns (`aria-patterns.ts`)

Hooks for complex interactive components:

- **`useCombobox`**: Searchable dropdowns
- **`useTabs`**: Tab navigation with keyboard support
- **`useAccordion`**: Collapsible content sections
- **`useDialog`**: Modal dialogs with focus management
- **`useTooltip`**: Accessible tooltip patterns

```tsx
function DestinationCombobox({ destinations, onSelect }) {
  const {
    isOpen,
    inputValue,
    filteredOptions,
    handleInputChange,
    inputProps,
    listboxProps,
    getOptionProps,
  } = useCombobox(
    destinations,
    (dest, i) => `dest-${i}`,
    dest => dest.name
  )

  return (
    <div>
      <input
        {...inputProps}
        placeholder="Search destinations..."
        onChange={e => handleInputChange(e.target.value)}
      />
      {isOpen && (
        <ul {...listboxProps}>
          {filteredOptions.map((dest, index) => (
            <li key={dest.id} {...getOptionProps(dest, index)}>
              {dest.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### 🧪 Testing Utils (`test-utils.ts`)

Comprehensive accessibility testing tools:

- **`expectNoAccessibilityViolations`**: Axe-core integration
- **`renderWithAccessibilityCheck`**: Auto-testing on render
- **`FocusTester`**: Keyboard navigation testing
- **`SemanticTester`**: HTML structure validation
- **`runFullAccessibilityTest`**: Complete test suite

```tsx
describe('TravelForm', () => {
  it('should pass all accessibility tests', async () => {
    const rendered = render(<TravelForm />)

    const results = await runFullAccessibilityTest(rendered, {
      rules: {
        'color-contrast': { enabled: false }, // Skip until design system ready
      },
    })

    expect(results.semanticTest.formLabels.valid).toBe(true)
    expect(results.focusTest.focusableElements.length).toBeGreaterThan(0)
  })
})
```

## Development Guidelines

### ✅ Do's

1. **Use semantic HTML first**: Start with proper HTML elements before adding ARIA
2. **Test with keyboard only**: Ensure all functionality works without a mouse
3. **Provide alternative text**: Every image needs meaningful alt text or role="presentation"
4. **Label everything**: All form controls need labels or aria-label
5. **Use heading hierarchy**: h1 → h2 → h3, don't skip levels
6. **Create landmarks**: Use semantic HTML5 elements or ARIA roles
7. **Handle focus states**: Ensure focus is visible and logical
8. **Announce changes**: Use live regions for dynamic content updates

### ❌ Don'ts

1. **Don't rely on color alone**: Provide additional visual cues
2. **Don't use placeholder as label**: Placeholders disappear when typing
3. **Don't hide focus indicators**: Users need to see where focus is
4. **Don't use generic descriptions**: "Click here" and "Read more" aren't helpful
5. **Don't break keyboard navigation**: Ensure Tab order makes sense
6. **Don't use custom controls without ARIA**: Stick to native HTML when possible
7. **Don't ignore screen readers**: Test with actual assistive technology

### Component Checklist

When creating new components, verify:

- [ ] Proper semantic HTML structure
- [ ] All interactive elements are keyboard accessible
- [ ] Focus management works correctly
- [ ] Screen reader announcements are appropriate
- [ ] Color contrast meets WCAG AA standards (4.5:1 normal, 3:1 large text)
- [ ] Component passes automated accessibility tests
- [ ] Manual testing with screen reader completed
- [ ] Error states are properly announced
- [ ] Loading states are communicated to assistive tech

## Testing Strategy

### Automated Testing

Run accessibility tests as part of CI:

```bash
# Test all components for accessibility violations
npm run test:accessibility

# Run full test suite including accessibility
npm run code-quality
```

### Manual Testing

1. **Keyboard Navigation**:
   - Tab through all interactive elements
   - Use arrow keys in lists/menus
   - Test Escape key in modals
   - Verify focus is always visible

2. **Screen Reader Testing**:
   - Use VoiceOver (macOS) or NVDA (Windows)
   - Verify all content is announced correctly
   - Test form field labels and error messages
   - Check landmark navigation

3. **Visual Testing**:
   - Zoom to 200% and verify layout
   - Check color contrast with tools
   - Test high contrast mode
   - Verify focus indicators are visible

### Browser Testing

Priority browser/screen reader combinations:

1. **Chrome + ChromeVox** (Google)
2. **Firefox + NVDA** (Windows)
3. **Safari + VoiceOver** (macOS/iOS)
4. **Edge + NVDA** (Windows)

## Common Patterns in Cardinal

### Travel Forms

```tsx
import { useCombobox, SemanticFormField } from '@/lib/accessibility'

function DestinationPicker() {
  return (
    <SemanticFormField
      label="Where do you want to go?"
      id="destination"
      required
      help="Start typing to search destinations"
    >
      <DestinationCombobox />
    </SemanticFormField>
  )
}
```

### Itinerary Display

```tsx
import { SemanticHeading, SemanticList } from '@/lib/accessibility'

function ItineraryCard({ itinerary }) {
  return (
    <article>
      <SemanticHeading level={2}>{itinerary.destination}</SemanticHeading>
      <SemanticList aria-label="Daily activities">
        {itinerary.days.map(day => (
          <li key={day.id}>
            <SemanticHeading level={3}>Day {day.number}</SemanticHeading>
            <SemanticList aria-label={`Activities for day ${day.number}`}>
              {day.activities.map(activity => (
                <li key={activity.id}>{activity.name}</li>
              ))}
            </SemanticList>
          </li>
        ))}
      </SemanticList>
    </article>
  )
}
```

### Navigation Menus

```tsx
import { useMenu, SemanticLandmark } from '@/lib/accessibility'

function MainNavigation() {
  const menuItems = ['Dashboard', 'My Trips', 'Profile', 'Settings']
  const { isOpen, triggerProps, menuProps, getItemProps } = useMenu(menuItems)

  return (
    <SemanticLandmark as="nav" role="navigation" aria-label="Main navigation">
      <button {...triggerProps}>Menu</button>
      {isOpen && (
        <ul {...menuProps}>
          {menuItems.map((item, index) => (
            <li key={item}>
              <a href={`/${item.toLowerCase()}`} {...getItemProps(item, index)}>
                {item}
              </a>
            </li>
          ))}
        </ul>
      )}
    </SemanticLandmark>
  )
}
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Contributing

When adding new accessibility features:

1. Add comprehensive tests
2. Update this documentation
3. Validate with real screen readers
4. Consider performance impact
5. Follow existing patterns

Remember: Accessibility is not a checklist to complete, but an ongoing commitment to inclusive design. Every user deserves equal access to Cardinal's travel planning features.
