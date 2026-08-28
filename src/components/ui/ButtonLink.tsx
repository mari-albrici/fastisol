import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'

interface ButtonLinkProps {
  children: ReactNode
  href: string
  variant?: 'primary' | 'secondary' | 'text' | 'light'
  showArrow?: boolean
  className?: string
  ariaLabel?: string
}

export function ButtonLink({
  children,
  href,
  variant = 'primary',
  showArrow = false,
  className = '',
  ariaLabel,
}: ButtonLinkProps) {
  const classes = `button button--${variant} ${className}`.trim()
  const content = (
    <>
      <span>{children}</span>
      {showArrow && <Icon name="arrow" size={19} />}
    </>
  )

  if (href.startsWith('http') || href.startsWith('tel:')) {
    return <a className={classes} href={href} aria-label={ariaLabel}>{content}</a>
  }

  return <Link className={classes} to={href} aria-label={ariaLabel}>{content}</Link>
}
