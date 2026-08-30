import { useRef, useState, type FormEvent } from 'react'
import { Seo } from '../components/layout/Seo'
import { ButtonLink } from '../components/ui/ButtonLink'
import { Icon } from '../components/ui/Icon'
import { company, formattedAddress } from '../data/company'
import {
  contactFormConfig,
  submitContactForm,
  type ContactFormPayload,
} from '../utils/contactForm'
import { trackEvent } from '../utils/analytics'

type FormStatus = 'idle' | 'submitting' | 'success' | 'error' | 'not-configured'

const contactStructuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contatti Fastisol',
    url: `${company.websiteUrl}/contatti`,
    description: 'Recapiti e modulo di contatto Fastisol per richieste di valutazione e preventivo.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: company.name,
    legalName: company.legalName,
    url: company.websiteUrl,
    email: company.email,
    telephone: company.phoneDisplay,
    logo: new URL(company.logos.onLight.src, company.websiteUrl).toString(),
    address: {
      '@type': 'PostalAddress',
      streetAddress: company.address.street,
      postalCode: company.address.postalCode,
      addressLocality: company.address.city,
      addressRegion: company.address.province,
      addressCountry: 'IT',
    },
  },
]

const statusMessages: Record<Exclude<FormStatus, 'idle' | 'submitting'>, string> = {
  success: 'Grazie, la richiesta è stata inviata. Ti ricontatteremo appena possibile.',
  error: 'Non è stato possibile inviare la richiesta. Riprova oppure contattaci via telefono o email.',
  'not-configured': `Il collegamento del modulo a Google Workspace non è ancora attivo. Per ora puoi scriverci direttamente a ${company.email}.`,
}

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

export function ContactPage() {
  const [status, setStatus] = useState<FormStatus>('idle')
  const formStarted = useRef(false)
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedAddress)}`

  const trackFormStart = () => {
    if (formStarted.current) return
    formStarted.current = true
    trackEvent('form_start', { form_name: 'contact_request' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    if (getFormValue(formData, 'website')) {
      setStatus('success')
      form.reset()
      return
    }

    if (!contactFormConfig.endpoint) {
      setStatus('not-configured')
      trackEvent('form_error', { form_name: 'contact_request', error_type: 'not_configured' })
      return
    }

    const payload: ContactFormPayload = {
      firstName: getFormValue(formData, 'firstName'),
      lastName: getFormValue(formData, 'lastName'),
      email: getFormValue(formData, 'email'),
      phone: getFormValue(formData, 'phone'),
      company: getFormValue(formData, 'company'),
      requestType: getFormValue(formData, 'requestType'),
      location: getFormValue(formData, 'location'),
      message: getFormValue(formData, 'message'),
      privacyConsent: formData.get('privacyConsent') === 'on',
      submittedAt: new Date().toISOString(),
    }

    setStatus('submitting')

    try {
      await submitContactForm(payload)
      setStatus('success')
      form.reset()
      formStarted.current = false
      trackEvent('generate_lead', { form_name: 'contact_request', request_type: payload.requestType })
    } catch {
      setStatus('error')
      trackEvent('form_error', { form_name: 'contact_request', error_type: 'submission_failed' })
    }
  }

  return (
    <>
      <Seo
        title="Contatti Fastisol"
        description="Contatta Fastisol per isolamento di tetti, sottotetti e coperture: telefono, WhatsApp, email e modulo per richiedere una valutazione."
        structuredData={contactStructuredData}
      />

      <section className="contact-hero">
        <div className="container contact-hero__inner">
          <div>
            <p className="eyebrow">Contatti</p>
            <h1>Parliamo del tuo edificio.</h1>
          </div>
          <p>
            Descrivi il problema, la zona da isolare e dove si trova l’immobile. Ti aiuteremo a capire se serve una prima valutazione dalle foto o un sopralluogo.
          </p>
        </div>
      </section>

      <section className="section contact-section">
        <div className="container contact-layout">
          <aside className="contact-details" aria-label="Recapiti Fastisol">
            <div className="contact-details__intro">
              <p className="eyebrow">Contatto diretto</p>
              <h2>Scegli il canale che preferisci.</h2>
              <p>Rispondiamo direttamente noi, così la richiesta arriva subito a chi conosce gli interventi.</p>
            </div>

            <div className="contact-methods">
              <a href={`tel:${company.phoneHref}`}>
                <span className="contact-methods__icon"><Icon name="phone" /></span>
                <span><small>Telefono</small><strong>{company.phoneDisplay}</strong></span>
                <Icon name="arrow" size={19} />
              </a>
              <a href={company.whatsappHref} target="_blank" rel="noreferrer">
                <span className="contact-methods__icon"><Icon name="message" /></span>
                <span><small>WhatsApp</small><strong>Scrivici un messaggio</strong></span>
                <Icon name="arrow" size={19} />
              </a>
              <a href={`mailto:${company.email}`}>
                <span className="contact-methods__icon"><Icon name="document" /></span>
                <span><small>Email</small><strong>{company.email}</strong></span>
                <Icon name="arrow" size={19} />
              </a>
            </div>

            <div className="contact-address">
              <Icon name="home" />
              <div>
                <h3>Sede</h3>
                <address>{company.legalName}<br />{formattedAddress}</address>
                <a href={mapUrl} target="_blank" rel="noreferrer">Apri in Google Maps <Icon name="arrow" size={17} /></a>
              </div>
            </div>

            <div className="contact-service-area">
              <strong>Dove operiamo</strong>
              <p>{company.serviceArea}</p>
            </div>
          </aside>

          <div className="contact-form-panel">
            <div className="contact-form-panel__heading">
              <p className="eyebrow">Richiedi informazioni</p>
              <h2>Raccontaci cosa vuoi isolare.</h2>
              <p>I campi contrassegnati con * sono obbligatori.</p>
            </div>

            <form className="contact-form" onSubmit={handleSubmit} onFocusCapture={trackFormStart}>
              <div className="form-field form-field--honeypot" aria-hidden="true">
                <label htmlFor="website">Sito web</label>
                <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="firstName">Nome *</label>
                  <input id="firstName" name="firstName" type="text" autoComplete="given-name" required />
                </div>
                <div className="form-field">
                  <label htmlFor="lastName">Cognome *</label>
                  <input id="lastName" name="lastName" type="text" autoComplete="family-name" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="email">Email *</label>
                  <input id="email" name="email" type="email" autoComplete="email" required />
                </div>
                <div className="form-field">
                  <label htmlFor="phone">Telefono *</label>
                  <input id="phone" name="phone" type="tel" autoComplete="tel" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="company">Azienda <span>(facoltativo)</span></label>
                  <input id="company" name="company" type="text" autoComplete="organization" />
                </div>
                <div className="form-field">
                  <label htmlFor="requestType">Tipo di richiesta *</label>
                  <select id="requestType" name="requestType" defaultValue="" required>
                    <option value="" disabled>Seleziona</option>
                    <option value="preventivo">Richiesta preventivo</option>
                    <option value="valutazione">Valutazione tecnica</option>
                    <option value="sopralluogo">Richiesta sopralluogo</option>
                    <option value="professionisti">Informazioni per professionisti</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="location">Comune o località dell’immobile *</label>
                <input id="location" name="location" type="text" autoComplete="address-level2" required />
              </div>

              <div className="form-field">
                <label htmlFor="message">Come possiamo aiutarti? *</label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  placeholder="Descrivi il tipo di edificio, la zona da isolare e il problema principale."
                  required
                />
              </div>

              <label className="form-consent">
                <input name="privacyConsent" type="checkbox" required />
                <span>Ho letto la <a href="/privacy-policy">Privacy Policy</a> e acconsento al trattamento dei dati per ricevere risposta alla richiesta. *</span>
              </label>

              <div className="contact-form__footer">
                <button className="button button--primary" type="submit" disabled={status === 'submitting'}>
                  {status === 'submitting' ? 'Invio in corso…' : 'Invia la richiesta'}
                  {status !== 'submitting' && <Icon name="arrow" size={19} />}
                </button>
                <p>I dati saranno utilizzati esclusivamente per rispondere alla tua richiesta.</p>
              </div>

              {status !== 'idle' && status !== 'submitting' && (
                <div className={`form-status form-status--${status}`} role="status" aria-live="polite">
                  {statusMessages[status]}
                  {status === 'not-configured' && (
                    <a href={`mailto:${company.email}`}>Scrivi a {company.email}</a>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      <section className="contact-quote-strip">
        <div className="container contact-quote-strip__inner">
          <div>
            <p className="eyebrow">Hai già misure e fotografie?</p>
            <h2>Vai direttamente alla richiesta di preventivo.</h2>
          </div>
          <ButtonLink href="/preventivo" showArrow>Inizia la richiesta</ButtonLink>
        </div>
      </section>
    </>
  )
}
