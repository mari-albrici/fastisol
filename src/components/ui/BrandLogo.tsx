import { company } from '../../data/company'

interface BrandLogoProps {
  variant: 'onDark' | 'onLight'
  className?: string
}

export function BrandLogo({ variant, className = '' }: BrandLogoProps) {
  const logo = company.logos[variant]

  return (
    <img
      className={`brand-logo ${className}`.trim()}
      src={logo.src}
      alt={company.name}
      width={logo.width}
      height={logo.height}
    />
  )
}
