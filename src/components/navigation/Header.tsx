import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { company } from '../../data/company'
import { navigationItems } from '../../data/navigation'
import { ButtonLink } from '../ui/ButtonLink'
import { Icon } from '../ui/Icon'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('menu-open', isMenuOpen)
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => {
      document.body.classList.remove('menu-open')
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isMenuOpen])

  return (
    <header className="site-header">
      <div className="utility-bar">
        <div className="container utility-bar__inner">
          <p>Isolamento specialistico per abitazioni e imprese</p>
          <a href={`tel:${company.phoneHref}`}>
            <Icon name="phone" size={15} />
            {company.phoneDisplay}
          </a>
        </div>
      </div>

      <div className="site-header__main">
        <div className="container site-header__inner">
          <Link className="brand" to="/" aria-label="Fastisol, torna alla home" onClick={() => setIsMenuOpen(false)}>
            <img src="/images/fastisol-logo-bianco.png" alt="Fastisol" width="300" height="80" />
          </Link>

          <nav className="desktop-nav" aria-label="Navigazione principale">
            {navigationItems.map((item) => (
              <NavLink key={item.href} to={item.href} className={({ isActive }) => isActive ? 'is-active' : undefined}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <ButtonLink className="header-cta" href="/preventivo" variant="light">
            Richiedi preventivo
          </ButtonLink>

          <button
            className="menu-toggle"
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMenuOpen ? 'Chiudi il menu' : 'Apri il menu'}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <Icon name={isMenuOpen ? 'x' : 'menu'} />
          </button>
        </div>
      </div>

      <div className={`mobile-panel${isMenuOpen ? ' is-open' : ''}`} id="mobile-navigation">
        <nav className="container mobile-nav" aria-label="Navigazione mobile" onClick={() => setIsMenuOpen(false)}>
          {navigationItems.map((item) => (
            <NavLink key={item.href} to={item.href} onClick={() => setIsMenuOpen(false)}>{item.label}<Icon name="arrow" size={19} /></NavLink>
          ))}
          <ButtonLink href="/preventivo" showArrow>Richiedi un preventivo</ButtonLink>
          <a className="mobile-nav__phone" href={`tel:${company.phoneHref}`}>
            <Icon name="phone" size={20} /> Chiama {company.phoneDisplay}
          </a>
        </nav>
      </div>
    </header>
  )
}
