import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
  help?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, label, help, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const classes = error
      ? `form-input border-error-300 focus:border-error-500 focus:ring-error-500 ${className}`
      : `form-input ${className}`

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
          </label>
        )}
        <input ref={ref} id={inputId} className={classes} {...props} />
        {error && <p className="form-error">{error}</p>}
        {help && !error && <p className="form-help">{help}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
