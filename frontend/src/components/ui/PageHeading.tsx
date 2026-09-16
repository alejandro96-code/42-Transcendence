interface PageHeadingProps {
  title: string
  subtitle?: string
  className?: string
  titleClassName?: string
  subtitleClassName?: string
}

export function PageHeading({
  title,
  subtitle,
  className = '',
  titleClassName = '',
  subtitleClassName = '',
}: PageHeadingProps) {
  return (
    <div className={`ui-page-heading ${className}`}>
      <h1 className={titleClassName}>{title}</h1>

      {subtitle && <p className={subtitleClassName}>{subtitle}</p>}
    </div>
  )
}
