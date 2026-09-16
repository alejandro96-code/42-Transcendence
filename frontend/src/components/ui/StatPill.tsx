import type { ReactNode } from 'react'

interface StatPillProps {
  children: ReactNode
  active?: boolean
  className?: string
}

export function StatPill({ children, active = false, className = '' }: StatPillProps) {
  return (
    <span className={`ui-stat-pill ${active ? 'is-active' : ''} ${className}`}>
      {children}
    </span>
  )
}
