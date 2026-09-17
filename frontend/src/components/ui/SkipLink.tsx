interface SkipLinkProps {
  targetId: string
  label: string
}

export function SkipLink({ targetId, label }: SkipLinkProps) {
  return (
    <a href={`#${targetId}`} className="ui-skip-link">
      {label}
    </a>
  )
}
