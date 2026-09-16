import type { ReactNode } from 'react'

interface FormFieldProps {
  id: string
  label: string
  children: ReactNode
  hideLabel?: boolean
  className?: string
}

export function FormField({ id, label, children, hideLabel = false, className = '' }: FormFieldProps) {
  return (
    <div className={`ui-form-field ${className}`}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'ui-form-field__label'}>
        {label}
      </label>

      {children}
    </div>
  )
}
