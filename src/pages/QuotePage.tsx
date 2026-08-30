import { useRef, useState, type FormEvent } from 'react'
import { Seo } from '../components/layout/Seo'
import { Icon } from '../components/ui/Icon'
import { company } from '../data/company'
import { contactFormConfig, submitContactForm, type ContactFormPayload } from '../utils/contactForm'
import { trackEvent } from '../utils/analytics'

type FormStatus = 'idle' | 'submitting' | 'success' | 'error' | 'not-configured'

const quoteStructuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Richiedi un preventivo Fastisol',
    url: `${company.websiteUrl}/preventivo`,
    description: 'Invia a Fastisol le informazioni iniziali per una valutazione dell’isolamento di tetti, sottotetti e coperture.',
    inLanguage: 'it-IT',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Valutazione per isolamento termico',
    serviceType: 'Valutazione e preventivo per isolamento di tetti, sottotetti e coperture',
    provider: {
      '@type': 'HomeAndConstructionBusiness',
      name: company.name,
      url: company.websiteUrl,
      telephone: company.phoneDisplay,
    },
    areaServed: 'Nord Italia',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: company.websiteUrl },
      { '@type': 'ListItem', position: 2, name: 'Preventivo', item: `${company.websiteUrl}/preventivo` },
    ],
  },
]

const statusMessages: Record<Exclude<FormStatus, 'idle' | 'submitting'>, string> = {
  success: 'Richiesta inviata. Fastisol ti ricontatterà per verificare le informazioni e definire il passo successivo.',
  error: 'Non è stato possibile inviare la richiesta. Riprova oppure contatta Fastisol via telefono, WhatsApp o email.',
  'not-configured': `Il modulo non è ancora collegato al servizio di invio. Per ora puoi scrivere direttamente a ${company.email}.`,
}

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

export function QuotePage() {
  const [status, setStatus] = useState<FormStatus>('idle')
  const formStarted = useRef(false)

  const trackFormStart = () => {
    if (formStarted.current) return
    formStarted.current = true
    trackEvent('form_start', { form_name: 'quote_request' })
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
      trackEvent('form_error', { form_name: 'quote_request', error_type: 'not_configured' })
      return
    }

    const buildingType = getFormValue(formData, 'buildingType')
    const areaType = getFormValue(formData, 'areaType')
    const approximateSize = getFormValue(formData, 'approximateSize')
    const access = getFormValue(formData, 'access')
    const details = getFormValue(formData, 'details')
    const message = [
      `Tipo di edificio: ${buildingType}`,
      `Zona da isolare: ${areaType}`,
      approximateSize ? `Superficie indicativa: ${approximateSize} m²` : null,
      access ? `Accessibilità: ${access}` : null,
      `Dettagli: ${details}`,
    ].filter(Boolean).join('\n')

    const payload: ContactFormPayload = {
      firstName: getFormValue(formData, 'firstName'),
      lastName: getFormValue(formData, 'lastName'),
      email: getFormValue(formData, 'email'),
      phone: getFormValue(formData, 'phone'),
      company: getFormValue(formData, 'company'),
      requestType: 'preventivo',
      location: getFormValue(formData, 'location'),
      message,
      privacyConsent: formData.get('privacyConsent') === 'on',
      submittedAt: new Date().toISOString(),
    }

    setStatus('submitting')

    try {
      await submitContactForm(payload)
      setStatus('success')
      form.reset()
      formStarted.current = false
      trackEvent('generate_lead', { form_name: 'quote_request', request_type: areaType })
    } catch {
      setStatus('error')
      trackEvent('form_error', { form_name: 'quote_request', error_type: 'submission_failed' })
    }
  }

  return (
    <>
      <Seo
        title="Preventivo isolamento tetto e sottotetto"
        description="Richiedi una prima valutazione Fastisol per isolare tetto, sottotetto o copertura. Invia località, tipologia dell’edificio e superficie indicativa."
        structuredData={quoteStructuredData}
      />

      <header className="public-page-hero public-page-hero--quote">
        <div className="container public-page-hero__inner">
          <div>
            <p className="eyebrow">Richiedi un preventivo</p>
            <h1>Partiamo dalle informazioni giuste.</h1>
          </div>
          <p>Descrivi edificio, zona da isolare e accessibilità. Fastisol userà questi dati per capire se è possibile una prima valutazione o se serve un sopralluogo.</p>
        </div>
      </header>

      <section className="section quote-page">
        <div className="container quote-page__layout">
          <aside className="quote-page__guide">
            <p className="eyebrow">Prima valutazione</p>
            <h2>Cosa succede dopo l’invio.</h2>
            <ol>
              <li><span>1</span><p><strong>Controlliamo i dati</strong><small>Valutiamo struttura, superficie e località.</small></p></li>
              <li><span>2</span><p><strong>Ti contattiamo direttamente</strong><small>Possiamo chiedere misure o fotografie aggiuntive.</small></p></li>
              <li><span>3</span><p><strong>Definiamo il passo successivo</strong><small>Prima stima, approfondimento tecnico o sopralluogo.</small></p></li>
            </ol>
            <p className="quote-page__direct">Preferisci parlarne? <a href={`tel:${company.phoneHref}`}>{company.phoneDisplay}</a></p>
          </aside>

          <div className="contact-form-panel">
            <div className="contact-form-panel__heading">
              <p className="eyebrow">Dati del progetto</p>
              <h2>Raccontaci cosa vuoi isolare.</h2>
              <p>I campi contrassegnati con * sono obbligatori.</p>
            </div>

            {status === 'success' ? (
              <div className="quote-success" role="status" aria-live="polite">
                <Icon name="check" size={34} />
                <h3>Richiesta ricevuta.</h3>
                <p>{statusMessages.success}</p>
                <button type="button" className="button button--secondary" onClick={() => setStatus('idle')}>Invia un’altra richiesta</button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit} onFocusCapture={trackFormStart}>
                <div className="form-field form-field--honeypot" aria-hidden="true">
                  <label htmlFor="quote-website">Sito web</label>
                  <input id="quote-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                </div>

                <div className="form-row">
                  <div className="form-field"><label htmlFor="quote-firstName">Nome *</label><input id="quote-firstName" name="firstName" type="text" autoComplete="given-name" required /></div>
                  <div className="form-field"><label htmlFor="quote-lastName">Cognome *</label><input id="quote-lastName" name="lastName" type="text" autoComplete="family-name" required /></div>
                </div>

                <div className="form-row">
                  <div className="form-field"><label htmlFor="quote-email">Email *</label><input id="quote-email" name="email" type="email" autoComplete="email" required /></div>
                  <div className="form-field"><label htmlFor="quote-phone">Telefono *</label><input id="quote-phone" name="phone" type="tel" autoComplete="tel" required /></div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="quote-buildingType">Tipo di edificio *</label>
                    <select id="quote-buildingType" name="buildingType" defaultValue="" required>
                      <option value="" disabled>Seleziona</option><option>Casa singola</option><option>Appartamento o condominio</option><option>Mansarda</option><option>Capannone o edificio industriale</option><option>Edificio commerciale o agricolo</option><option>Altro</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="quote-areaType">Zona da isolare *</label>
                    <select id="quote-areaType" name="areaType" defaultValue="" required>
                      <option value="" disabled>Seleziona</option><option>Soletta del sottotetto</option><option>Falde del tetto</option><option>Tetto in legno</option><option>Tetto in cemento o laterizio</option><option>Copertura industriale</option><option>Pareti o soffitto</option><option>Da valutare</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field"><label htmlFor="quote-location">Comune dell’immobile *</label><input id="quote-location" name="location" type="text" autoComplete="address-level2" required /></div>
                  <div className="form-field"><label htmlFor="quote-size">Superficie indicativa <span>(facoltativo)</span></label><input id="quote-size" name="approximateSize" type="number" inputMode="decimal" min="1" step="1" placeholder="es. 120" /></div>
                </div>

                <div className="form-row">
                  <div className="form-field"><label htmlFor="quote-access">Accessibilità <span>(facoltativo)</span></label><select id="quote-access" name="access" defaultValue=""><option value="">Non lo so</option><option>Comodamente accessibile</option><option>Accesso basso o stretto</option><option>Non accessibile dall’interno</option><option>Serve una verifica</option></select></div>
                  <div className="form-field"><label htmlFor="quote-company">Azienda <span>(facoltativo)</span></label><input id="quote-company" name="company" type="text" autoComplete="organization" /></div>
                </div>

                <div className="form-field"><label htmlFor="quote-details">Problema e obiettivo *</label><textarea id="quote-details" name="details" rows={6} placeholder="Descrivi caldo, freddo, condensa, uso del sottotetto e ogni informazione utile." required /></div>

                <label className="form-consent"><input name="privacyConsent" type="checkbox" required /><span>Dichiaro di aver letto la <a href="/privacy-policy">Privacy Policy</a> sul trattamento dei dati necessario per rispondere alla richiesta. *</span></label>

                <div className="contact-form__footer">
                  <button className="button button--primary" type="submit" disabled={status === 'submitting'}>{status === 'submitting' ? 'Invio in corso…' : 'Invia la richiesta'}{status !== 'submitting' && <Icon name="arrow" size={19} />}</button>
                  <p>L’invio non costituisce un preventivo definitivo né un impegno.</p>
                </div>

                {status !== 'idle' && status !== 'submitting' && (
                  <div className={`form-status form-status--${status}`} role="status" aria-live="polite">{statusMessages[status]}{status === 'not-configured' && <a href={`mailto:${company.email}`}>Scrivi a {company.email}</a>}</div>
                )}
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
