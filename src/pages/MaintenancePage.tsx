import { Seo } from '../components/layout/Seo'
import { BrandLogo } from '../components/ui/BrandLogo'
import { Icon } from '../components/ui/Icon'
import { company, formattedAddress } from '../data/company'

export function MaintenancePage() {
  return (
    <>
      <Seo
        title="Sito in manutenzione"
        description="Il sito Fastisol è in manutenzione. Torneremo online presto. Per informazioni contattaci per telefono, WhatsApp o email."
        noIndex
      />
      <main className="maintenance-page">
        <div className="maintenance-page__pattern" aria-hidden="true" />
        <div className="container maintenance-page__inner">
          <BrandLogo variant="onDark" className="maintenance-page__logo" />
          <div className="maintenance-page__content">
            <p className="eyebrow">Intervento in corso</p>
            <h1>Stiamo preparando qualcosa di nuovo.</h1>
            <p className="maintenance-page__message">
              Il sito è temporaneamente in manutenzione e tornerà online presto.
              Nel frattempo, siamo a tua disposizione per qualsiasi informazione.
            </p>
            <div className="maintenance-page__contacts" aria-label="Contatti Fastisol">
              <a href={`tel:${company.phoneHref}`}>
                <span className="maintenance-page__contact-icon"><Icon name="phone" size={20} /></span>
                <span><small>Telefono</small><strong>{company.phoneDisplay}</strong></span>
              </a>
              <a href={company.whatsappHref} target="_blank" rel="noreferrer">
                <span className="maintenance-page__contact-icon"><Icon name="message" size={20} /></span>
                <span><small>WhatsApp</small><strong>Scrivici un messaggio</strong></span>
              </a>
              <a href={`mailto:${company.email}`}>
                <span className="maintenance-page__contact-icon"><Icon name="document" size={20} /></span>
                <span><small>Email</small><strong>{company.email}</strong></span>
              </a>
            </div>
            <p className="maintenance-page__address">{formattedAddress}</p>
          </div>
        </div>
      </main>
    </>
  )
}