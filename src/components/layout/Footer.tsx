import { Link, useLocation } from 'react-router-dom'
import { company, formattedAddress } from '../../data/company'
import { footerSolutionLinks, navigationItems } from '../../data/navigation'
import { ButtonLink } from '../ui/ButtonLink'
import { Icon } from '../ui/Icon'

export function Footer() {
  const { pathname } = useLocation()

  return (
    <footer className="site-footer">
      {pathname !== '/' && (
        <div className="container footer-cta">
          <div>
            <p className="eyebrow">Parliamo del tuo edificio</p>
            <h2>Capire da dove intervenire è il primo passo.</h2>
          </div>
          <ButtonLink href="/preventivo" variant="light" showArrow>Richiedi una valutazione</ButtonLink>
        </div>
      )}

      <div className="container footer-grid">
        <div className="footer-brand">
          <img src="/images/fastisol-logo-bianco.png" alt="Fastisol" width="300" height="80" />
          <p>{company.description}</p>
          <a className="footer-phone" href={`tel:${company.phoneHref}`}>
            <Icon name="phone" size={19} /> {company.phoneDisplay}
          </a>
        </div>

        <div>
          <h3>Soluzioni</h3>
          <ul>
            {footerSolutionLinks.map((item) => <li key={item.href}><Link to={item.href}>{item.label}</Link></li>)}
          </ul>
        </div>

        <div>
          <h3>Fastisol</h3>
          <ul>
            {navigationItems.slice(1).map((item) => <li key={item.href}><Link to={item.href}>{item.label}</Link></li>)}
            <li><Link to="/faq">Domande frequenti</Link></li>
          </ul>
        </div>

        <div>
          <h3>Contatti</h3>
          <address>
            {company.legalName}<br />
            {formattedAddress}<br />
            {company.serviceArea}
          </address>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} Fastisol. Tutti i diritti riservati.</p>
        <div>
          <Link to="/privacy-policy">Privacy</Link>
          <Link to="/cookie-policy">Cookie</Link>
        </div>
      </div>
    </footer>
  )
}
