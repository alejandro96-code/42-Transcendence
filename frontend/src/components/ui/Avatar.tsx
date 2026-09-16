import { useState } from 'react'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  src?: string | null
  name: string
  size?: AvatarSize
  className?: string
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return '?'
  }

  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''

  return (first + last).toUpperCase()
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const [hasError, setHasError] = useState(false)
  const showImage = Boolean(src?.trim()) && !hasError

  return (
    <span className={`ui-avatar ui-avatar--${size} ${className}`}>
      {showImage ? (
        <img
          src={src ?? ''}
          alt={name}
          className="ui-avatar__image"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="ui-avatar__initials" aria-label={name}>
          {initialsFor(name)}
        </span>
      )}
    </span>
  )
}
