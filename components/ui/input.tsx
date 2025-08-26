import { InputHTMLAttributes, forwardRef, useId } from 'react'

import { useAriaDescribedBy } from '@/lib/accessibility'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
  help?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, label, help, id, required, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id || `input-${generatedId}`
    const labelId = `${inputId}-label`
    const errorId = error ? `${inputId}-error` : undefined
    const helpId = help ? `${inputId}-help` : undefined

    // Use accessibility utility for proper describedby relationships
    const describedByProps = useAriaDescribedBy(errorId, helpId)

    const classes = error
      ? `form-input border-error-300 focus:border-error-500 focus:ring-error-500 ${className}`
      : `form-input ${className}`

    return (
      <div className="space-y-1">
        {label && (
          <label
            id={labelId}
            htmlFor={inputId}
            className={`form-label ${required ? 'required' : ''}`.trim()}
          >
            {label}
            {required && (
              <span aria-label="required" className="text-red-500 ml-1">
                *
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={classes}
          required={required}
          aria-invalid={error ? true : undefined}
          {...describedByProps}
          {...props}
        />
        {error && (
          <p
            id={errorId}
            className="form-error"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
        {help && !error && (
          <p id={helpId} className="form-help">
            {help}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
