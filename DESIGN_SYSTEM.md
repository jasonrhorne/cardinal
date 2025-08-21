# Cardinal Design System

## Overview

Cardinal uses a comprehensive Tailwind CSS-based design system with custom components for consistent UI patterns across the application.

## Colors

### Brand Colors

- **Primary**: `brand-600` (#2563eb) - Main CTAs, primary actions
- **Primary Hover**: `brand-700` (#1d4ed8) - Hover states
- **Primary Light**: `brand-100` (#dbeafe) - Light backgrounds, badges

### Semantic Colors

- **Success**: `success-600` (#16a34a) - Success states, positive actions
- **Warning**: `warning-600` (#ca8a04) - Warning states, attention needed
- **Error**: `error-600` (#dc2626) - Error states, destructive actions
- **Gray**: `gray-50` to `gray-950` - Neutral colors for text and backgrounds

## Typography

### Headings

- **`.heading-1`**: Hero headings (4xl/5xl/6xl responsive)
- **`.heading-2`**: Page titles (3xl/4xl responsive)
- **`.heading-3`**: Section headings (2xl/3xl responsive)
- **`.heading-4`**: Subsection headings (xl/2xl responsive)

### Text Colors

- **`.text-muted`**: Secondary text (gray-600)
- **`.text-subtle`**: Tertiary text (gray-500)

## Components

### Buttons

```tsx
import { Button } from '@/components/ui'

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="success">Success</Button>
<Button variant="warning">Warning</Button>
<Button variant="error">Error</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Loading state
<Button isLoading>Loading...</Button>
```

### Cards

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui'
;<Card hover>
  {' '}
  {/* hover prop adds hover effect */}
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardBody>
    <p>Card content goes here</p>
  </CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Form Inputs

```tsx
import { Input } from '@/components/ui'
;<Input
  label="Email Address"
  placeholder="Enter your email"
  help="We'll never share your email"
  error="Please enter a valid email"
/>
```

### Badges

```tsx
import { Badge } from '@/components/ui'

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="gray">Default</Badge>
```

### Spinners

```tsx
import { Spinner } from '@/components/ui'

<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />
```

## CSS Component Classes

### Button Classes

- **`.btn`**: Base button styles
- **`.btn-primary`**: Primary button variant
- **`.btn-secondary`**: Secondary button variant
- **`.btn-ghost`**: Ghost button variant
- **`.btn-sm/.btn-md/.btn-lg`**: Size variants

### Card Classes

- **`.card`**: Base card styles
- **`.card-hover`**: Card with hover effects
- **`.card-body`**: Card content padding
- **`.card-header/.card-footer`**: Card sections with borders

### Form Classes

- **`.form-input`**: Base input field styles
- **`.form-textarea`**: Textarea styles
- **`.form-select`**: Select dropdown styles
- **`.form-checkbox/.form-radio`**: Checkbox and radio styles
- **`.form-label`**: Form label styles
- **`.form-error/.form-help`**: Form feedback styles

### Layout Classes

- **`.container-custom`**: Responsive container with max-width and padding
- **`.section-padding`**: Standard section padding (py-16 md:py-24)
- **`.grid-auto-fit/.grid-auto-fill`**: CSS Grid auto-sizing

## Animations

### Custom Animations

- **`.animate-fade-in`**: Fade in animation (0.5s ease-in-out)
- **`.animate-slide-in`**: Slide in from top (0.3s ease-out)
- **`.animate-bounce-subtle`**: Subtle bounce effect (0.6s ease-in-out)
- **`.animate-pulse-subtle`**: Subtle pulse effect (2s infinite)

### Animation Delays

- **`.animation-delay-75`**: 75ms delay
- **`.animation-delay-150`**: 150ms delay
- **`.animation-delay-300`**: 300ms delay
- **`.animation-delay-500`**: 500ms delay

## Utility Classes

### Scrollbars

- **`.scrollbar-thin`**: Thin custom scrollbars (cross-browser)

### Safe Areas (iOS)

- **`.safe-top/.safe-bottom/.safe-left/.safe-right`**: iOS safe area padding

## Best Practices

### Do's ✅

- Use semantic color variants (`success`, `warning`, `error`)
- Prefer component classes (`.btn-primary`) over utility classes for common patterns
- Use consistent spacing scale (4, 8, 16, 24, 32px)
- Apply hover states for interactive elements
- Use loading states for async operations

### Don'ts ❌

- Don't mix component classes with conflicting utility classes
- Don't use hardcoded colors outside the design system
- Don't create custom components without following the existing patterns
- Don't ignore responsive design (always test on mobile)

## Mobile-First Approach

All components are designed mobile-first with responsive breakpoints:

- **Default**: Mobile (< 640px)
- **sm**: 640px+
- **md**: 768px+
- **lg**: 1024px+
- **xl**: 1280px+
- **2xl**: 1400px+

## Accessibility

- All interactive elements have focus states
- Color contrast meets WCAG AA standards
- Form inputs have proper labels and error states
- Buttons have disabled states
- Loading states are properly announced to screen readers

## Usage Examples

### Landing Page Section

```tsx
<div className="container-custom section-padding">
  <h1 className="heading-1 text-center">Welcome to Cardinal</h1>
  <p className="mt-6 text-center text-muted">AI-powered travel planning</p>
  <div className="mt-10 text-center">
    <Button size="lg">Get Started</Button>
  </div>
</div>
```

### Form Layout

```tsx
<Card>
  <CardHeader>
    <h2 className="heading-4">Sign In</h2>
  </CardHeader>
  <CardBody className="space-y-4">
    <Input label="Email" type="email" required />
    <Button className="w-full" isLoading={loading}>
      Sign In
    </Button>
  </CardBody>
</Card>
```

### Dashboard Grid

```tsx
<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
  {trips.map(trip => (
    <Card key={trip.id} hover>
      <CardBody>
        <h3 className="heading-4">{trip.name}</h3>
        <p className="text-muted">{trip.description}</p>
        <Badge variant="success">{trip.status}</Badge>
      </CardBody>
    </Card>
  ))}
</div>
```

This design system ensures consistency, accessibility, and maintainability across the Cardinal application.
