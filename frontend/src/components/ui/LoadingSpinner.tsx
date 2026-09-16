interface LoadingSpinnerProps {
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

export function LoadingSpinner({ label, size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <span className={`ui-spinner ui-spinner--${size} ${className}`}>
      <i className="pi pi-spin pi-spinner" aria-hidden="true" />
      {label && <span>{label}</span>}
    </span>
  )
}
