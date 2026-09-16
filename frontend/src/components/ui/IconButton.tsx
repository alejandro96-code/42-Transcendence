interface IconButtonProps {
  icon: string
  ariaLabel: string
  onClick: () => void
  variant?: 'solid' | 'ghost'
  className?: string
  disabled?: boolean
}

export function IconButton({
  icon,
  ariaLabel,
  onClick,
  variant = 'ghost',
  className = '',
  disabled = false,
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={`ui-icon-button ui-icon-button--${variant} ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      <i className={icon} aria-hidden="true" />
    </button>
  )
}
