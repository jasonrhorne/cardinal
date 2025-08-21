import { HTMLAttributes, forwardRef } from 'react'

interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg'
}

const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className = '', size = 'md', ...props }, ref) => {
    const sizes = {
      sm: 'spinner-sm',
      md: 'spinner-md',
      lg: 'spinner-lg',
    }

    const classes = `spinner ${sizes[size]} ${className}`

    return (
      <span
        ref={ref}
        className={classes}
        role="status"
        aria-label="Loading"
        {...props}
      />
    )
  }
)

Spinner.displayName = 'Spinner'

export { Spinner }
