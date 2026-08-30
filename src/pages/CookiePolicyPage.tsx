import { Seo } from '../components/layout/Seo'
import { company } from '../data/company'
import { analyticsConfig, isAnalyticsConfigured, openCookieSettings } from '../utils/analytics'

const cookieStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Cookie Policy',
  url: `${company.websiteUrl}/cookie-policy`,
  inLanguage: 'it-IT',
  dateModified: '2026-08-30',
  isPartOf: {
    '@type': 'WebSite',
    name: company.name,
    url: company.websiteUrl,
  },
}

export function CookiePolicyPage() {
  const googleConfigured = Boolean(analyticsConfig.gaMeasurementId || analyticsConfig.gtmContainerId)
  const metaConfigured = Boolean(analyticsConfig.metaPixelId)
  const trackingConfigured = isAnalyticsConfigured()

  return (
    <article className="legal-page">
      <Seo
        title="Cookie Policy"
        description="Informazioni sui cookie e sugli altri strumenti di tracciamento utilizzati dal sito Fastisol e su come gestire il consenso."
        noIndex
        structuredData={cookieStructuredData}
      />

      <header className="public-page-hero legal-page__hero">
        <div className="container public-page-hero__inner">
          <div>
            <p className="eyebrow">Cookie e strumenti di tracciamento</p>
            <h1>Cookie Policy</h1>
          </div>
          <p>
            Qui spieghiamo quali tecnologie può utilizzare fastisol.it, a cosa servono e come
            accettarle, rifiutarle o cambiare scelta.
          </p>
        </div>
      </header>

      <div className="container legal-page__layout">
        <nav className="legal-page__index" aria-label="Indice della Cookie Policy">
          <strong>In questa pagina</strong>
          <a href="#definizioni">Cosa sono</a>
          <a href="#strumenti">Strumenti utilizzati</a>
          <a href="#terze-parti">Servizi di terze parti</a>
          <a href="#gestione">Gestire le preferenze</a>
        </nav>

        <div className="legal-page__content">
          <p className="legal-page__updated">Ultimo aggiornamento: <time dateTime="2026-08-30">30 agosto 2026</time></p>

          <section id="definizioni">
            <h2>1. Cosa sono cookie e tecnologie simili</h2>
            <p>
              I cookie sono piccoli file di testo che un sito può salvare nel browser. Tecnologie
              simili, come il local storage e i pixel, possono memorizzare preferenze o raccogliere
              informazioni sull’utilizzo del sito. Questi strumenti possono essere gestiti direttamente
              da Fastisol (“prima parte”) oppure da fornitori esterni (“terze parti”).
            </p>
            <p>
              Gli strumenti strettamente necessari possono essere utilizzati senza consenso. Gli
              strumenti analitici non esenti e quelli destinati alla misurazione pubblicitaria o alla
              profilazione restano disattivati finché l’utente non esprime una scelta positiva.
            </p>
          </section>

          <section id="strumenti">
            <h2>2. Strumenti utilizzati da fastisol.it</h2>
            <div className="legal-table-wrap">
              <table>
                <thead><tr><th>Strumento</th><th>Categoria e finalità</th><th>Durata</th></tr></thead>
                <tbody>
                  <tr>
                    <td><code>fastisol-consent-v2</code><br /><small>Local storage, prima parte</small></td>
                    <td>Tecnico. Memorizza la scelta relativa alle categorie “Analitici” e “Marketing”, senza registrare dati anagrafici.</td>
                    <td>Massimo 6 mesi, poi la scelta viene richiesta nuovamente; può essere cancellato prima dall’utente.</td>
                  </tr>
                  {!trackingConfigured && (
                    <tr>
                      <td colSpan={3}>Al momento della build non risultano configurati servizi analitici o di marketing. Se saranno attivati, compariranno nelle sezioni seguenti e verranno comunque bloccati fino al consenso.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section id="terze-parti">
            <h2>3. Servizi di terze parti</h2>

            {googleConfigured ? (
              <>
                <h3>Google Analytics e Google Tag Manager</h3>
                <p>
                  Con il consenso “Analitici”, Google Analytics può misurare visite, sessioni,
                  pagine consultate, area geografica approssimativa, dispositivo e interazioni con
                  telefono, email, WhatsApp e moduli. I dati sono associati a identificatori online
                  pseudonimi e non vengono inviati intenzionalmente a Google nome, email, telefono o
                  testo compilato nei moduli.
                </p>
                <div className="legal-table-wrap">
                  <table>
                    <thead><tr><th>Possibile cookie</th><th>Fornitore e finalità</th><th>Durata predefinita</th></tr></thead>
                    <tbody>
                      <tr><td><code>_ga</code></td><td>Google Analytics — distingue gli utenti pseudonimi.</td><td>2 anni</td></tr>
                      <tr><td><code>_ga_&lt;ID&gt;</code></td><td>Google Analytics — mantiene lo stato della sessione.</td><td>2 anni</td></tr>
                      {analyticsConfig.gtmContainerId && <tr><td>Variabile in base ai tag</td><td>Google Tag Manager è il contenitore che distribuisce i tag configurati; non stabilisce da solo le finalità. Ogni nuovo tag deve rispettare le preferenze espresse e richiede l’aggiornamento di questa tabella.</td><td>Dipende dal tag pubblicato.</td></tr>}
                    </tbody>
                  </table>
                </div>
                <p className="legal-page__provider-links">
                  Informazioni del fornitore:{' '}
                  <a href="https://policies.google.com/technologies/partner-sites?hl=it" target="_blank" rel="noreferrer">utilizzo dei dati nei siti partner</a>,{' '}
                  <a href="https://policies.google.com/privacy?hl=it" target="_blank" rel="noreferrer">Privacy Policy Google</a> e{' '}
                  <a href="https://tools.google.com/dlpage/gaoptout?hl=it" target="_blank" rel="noreferrer">componente aggiuntivo di disattivazione Analytics</a>.
                </p>
              </>
            ) : (
              <p><strong>Google Analytics/Tag Manager:</strong> non risultano configurati nella versione corrente del sito.</p>
            )}

            {metaConfigured ? (
              <>
                <h3>Meta Pixel</h3>
                <p>
                  Con il consenso “Marketing”, il Meta Pixel può misurare visite, richieste inviate e
                  interazioni con i canali di contatto, attribuire conversioni alle campagne e creare
                  pubblici pubblicitari secondo le impostazioni dell’account Meta. Meta può associare
                  tali informazioni ad altri dati disponibili nei propri servizi.
                </p>
                <div className="legal-table-wrap">
                  <table>
                    <thead><tr><th>Possibile cookie</th><th>Fornitore e finalità</th><th>Durata indicativa</th></tr></thead>
                    <tbody>
                      <tr><td><code>_fbp</code></td><td>Meta Pixel — attribuzione e misurazione delle campagne.</td><td>Circa 3 mesi</td></tr>
                      <tr><td><code>fr</code></td><td>Meta — pubblicità, misurazione e pertinenza degli annunci, quando consentito dal browser.</td><td>Circa 3 mesi</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="legal-page__provider-links">
                  Informazioni del fornitore:{' '}
                  <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noreferrer">Privacy Policy Meta</a> e{' '}
                  <a href="https://www.facebook.com/privacy/policies/cookies/" target="_blank" rel="noreferrer">Cookie Policy Meta</a>.
                </p>
              </>
            ) : (
              <p><strong>Meta Pixel:</strong> non risulta configurato nella versione corrente del sito.</p>
            )}

            <p>
              I servizi di terze parti possono ricevere indirizzo IP, URL visitato, informazioni sul
              browser e dispositivo, data e ora e identificatori online. Possono trattare dati fuori
              dallo Spazio Economico Europeo usando i meccanismi di trasferimento descritti nelle loro
              informative. L’elenco deve essere verificato e aggiornato ogni volta che cambia la
              configurazione dei tag pubblicati.
            </p>
          </section>

          <section id="gestione">
            <h2>4. Come gestire o revocare il consenso</h2>
            <p>
              Accettare gli strumenti non necessari è facoltativo e il rifiuto non limita l’accesso al
              sito. Il consenso può essere modificato o revocato in qualsiasi momento con efficacia per
              il futuro.
            </p>
            {trackingConfigured ? (
              <button className="button button--primary" type="button" onClick={openCookieSettings}>Modifica le preferenze cookie</button>
            ) : (
              <p>Non essendo attualmente configurati strumenti non necessari, il pannello delle preferenze non viene mostrato.</p>
            )}
            <p>
              È inoltre possibile cancellare cookie e dati dei siti dalle impostazioni del browser.
              La cancellazione del local storage elimina anche la preferenza memorizzata e può causare
              la ricomparsa del pannello. Il blocco generalizzato dal browser potrebbe incidere sul
              funzionamento di altri siti o servizi.
            </p>
          </section>

          <section>
            <h2>5. Titolare e ulteriori informazioni</h2>
            <p>
              Il titolare è <strong>{company.legalName}</strong>. Per informazioni sul trattamento dei
              dati, sui diritti esercitabili e sui recapiti del titolare, consulta la{' '}
              <a href="/privacy-policy">Privacy Policy</a> oppure scrivi a{' '}
              <a href={`mailto:${company.email}`}>{company.email}</a>.
            </p>
          </section>
        </div>
      </div>
    </article>
  )
}
