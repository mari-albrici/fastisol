import { Link, Outlet } from 'react-router-dom'
import { Footer } from './Footer'
import { ScrollToTop } from './ScrollToTop'
import { Header } from '../navigation/Header'
import { company } from '../../data/company'
import { Icon } from '../ui/Icon'
import { ConsentManager } from './ConsentManager'

export function SiteLayout() {
  return (
    <>
      <ScrollToTop />
      <a className="skip-link" href="#main-content">Vai al contenuto</a>
      <Header />
      <main id="main-content"><Outlet /></main>
      <Footer />
      <ConsentManager />
      <div className="mobile-contact-bar" aria-label="Contatti rapidi">
        <a href={`tel:${company.phoneHref}`}><Icon name="phone" size={18} /> Chiama</a>
        <a href={company.whatsappHref}><Icon name="message" size={18} /> WhatsApp</a>
        <Link to="/preventivo">Preventivo</Link>
      </div>
    </>
  )
}
