import type { ReactNode } from 'react'

type BadgeVariant = 'success' | 'neutral' | 'info' | 'danger'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span className={`ui-badge ui-badge--${variant} ${className}`}>
      <span className="ui-badge__dot" aria-hidden="true" />
      {children}
    </span>
  )
}
