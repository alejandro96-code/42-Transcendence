import type { ReactNode } from 'react'

interface TagProps {
  icon?: string
  children: ReactNode
  className?: string
}

export function Tag({ icon, children, className = '' }: TagProps) {
  return (
    <span className={`ui-tag ${className}`}>
      {icon && <i className={icon} aria-hidden="true" />}
      {children}
    </span>
  )
}
