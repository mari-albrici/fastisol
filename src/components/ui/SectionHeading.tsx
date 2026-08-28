import type { ReactNode } from 'react'

interface SectionHeadingProps {
  eyebrow?: string
  title: string
  description?: ReactNode
  align?: 'left' | 'center'
  inverse?: boolean
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  inverse = false,
}: SectionHeadingProps) {
  return (
    <div className={`section-heading section-heading--${align}${inverse ? ' section-heading--inverse' : ''}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {description && <p className="section-heading__description">{description}</p>}
    </div>
  )
}
