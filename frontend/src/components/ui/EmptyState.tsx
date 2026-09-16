interface EmptyStateProps {
  icon: string
  message: string
  className?: string
}

export function EmptyState({ icon, message, className = '' }: EmptyStateProps) {
  return (
    <div className={`ui-empty-state ${className}`}>
      <i className={icon} aria-hidden="true" />
      <p>{message}</p>
    </div>
  )
}
