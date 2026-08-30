import { Link } from 'react-router-dom'
import { Seo } from '../components/layout/Seo'
import { company, formattedAddress } from '../data/company'

const privacyStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Privacy Policy',
  url: `${company.websiteUrl}/privacy-policy`,
  inLanguage: 'it-IT',
  dateModified: '2026-08-30',
  isPartOf: {
    '@type': 'WebSite',
    name: company.name,
    url: company.websiteUrl,
  },
}

export function PrivacyPolicyPage() {
  return (
    <article className="legal-page">
      <Seo
        title="Privacy Policy"
        description="Informativa sul trattamento dei dati personali degli utenti del sito Fastisol, ai sensi del Regolamento UE 2016/679."
        noIndex
        structuredData={privacyStructuredData}
      />

      <header className="public-page-hero legal-page__hero">
        <div className="container public-page-hero__inner">
          <div>
            <p className="eyebrow">Informativa sul trattamento dei dati</p>
            <h1>Privacy Policy</h1>
          </div>
          <p>
            Informativa resa ai sensi degli articoli 12 e 13 del Regolamento (UE) 2016/679
            (“GDPR”) agli utenti del sito fastisol.it.
          </p>
        </div>
      </header>

      <div className="container legal-page__layout">
        <nav className="legal-page__index" aria-label="Indice della Privacy Policy">
          <strong>In questa pagina</strong>
          <a href="#titolare">Titolare</a>
          <a href="#dati">Dati trattati</a>
          <a href="#finalita">Finalità e basi giuridiche</a>
          <a href="#conservazione">Conservazione</a>
          <a href="#destinatari">Destinatari e trasferimenti</a>
          <a href="#diritti">Diritti</a>
        </nav>

        <div className="legal-page__content">
          <p className="legal-page__updated">Ultimo aggiornamento: <time dateTime="2026-08-30">30 agosto 2026</time></p>

          <section id="titolare">
            <h2>1. Titolare del trattamento</h2>
            <p>Il titolare del trattamento è:</p>
            <address>
              <strong>{company.legalName}</strong><br />
              {formattedAddress}<br />
              Telefono: <a href={`tel:${company.phoneHref}`}>{company.phoneDisplay}</a><br />
              Email: <a href={`mailto:${company.email}`}>{company.email}</a>
            </address>
            <p>Questi recapiti possono essere utilizzati anche per richieste relative alla protezione dei dati personali.</p>
          </section>

          <section id="dati">
            <h2>2. Quali dati vengono trattati</h2>
            <h3>Dati di navigazione e sicurezza</h3>
            <p>
              I sistemi che consentono il funzionamento del sito possono registrare dati tecnici
              quali indirizzo IP, data e ora della richiesta, pagina richiesta, esito della risposta,
              tipo di browser, dispositivo e sistema operativo. Tali informazioni sono normalmente
              trattate per consentire la navigazione, mantenere il sito sicuro e diagnosticare
              eventuali anomalie.
            </p>

            <h3>Dati forniti dall’utente</h3>
            <p>
              Quando l’utente scrive, telefona, usa WhatsApp o compila i moduli di contatto e
              preventivo, possono essere trattati nome, cognome, email, telefono, azienda, comune
              dell’immobile, tipologia e caratteristiche dell’edificio, superficie indicativa,
              accessibilità, contenuto della richiesta e ogni altra informazione comunicata
              volontariamente.
            </p>
            <p>
              Si invita a non inserire nei campi liberi dati particolari non necessari, come
              informazioni relative alla salute, alle convinzioni religiose o politiche. L’invio
              dei dati contrassegnati come obbligatori è necessario per poter esaminare e rispondere
              alla richiesta; in loro assenza il modulo non può essere inviato.
            </p>

            <h3>Dati raccolti con strumenti di misurazione e marketing</h3>
            <p>
              Solo dopo una scelta positiva nel pannello cookie, il sito può raccogliere informazioni
              sull’utilizzo delle pagine e sulle interazioni con i canali di contatto mediante Google
              Analytics, Google Tag Manager e/o Meta Pixel, se effettivamente configurati. Per dettagli
              su categorie, fornitori e durata degli strumenti utilizzati si rimanda alla{' '}
              <Link to="/cookie-policy">Cookie Policy</Link>.
            </p>
          </section>

          <section id="finalita">
            <h2>3. Finalità e basi giuridiche</h2>
            <div className="legal-table-wrap">
              <table>
                <thead><tr><th>Finalità</th><th>Base giuridica</th></tr></thead>
                <tbody>
                  <tr>
                    <td>Mostrare il sito, garantirne la stabilità, prevenire abusi e tutelare i sistemi.</td>
                    <td>Legittimo interesse del titolare alla sicurezza e al corretto funzionamento del sito (art. 6, par. 1, lett. f GDPR).</td>
                  </tr>
                  <tr>
                    <td>Rispondere a richieste di informazioni, valutazioni, sopralluoghi e preventivi.</td>
                    <td>Esecuzione di misure precontrattuali adottate su richiesta dell’interessato (art. 6, par. 1, lett. b GDPR).</td>
                  </tr>
                  <tr>
                    <td>Gestire il rapporto contrattuale e i relativi adempimenti amministrativi, fiscali e contabili.</td>
                    <td>Esecuzione del contratto e adempimento di obblighi di legge (art. 6, par. 1, lett. b e c GDPR).</td>
                  </tr>
                  <tr>
                    <td>Accertare, esercitare o difendere un diritto e gestire eventuali contestazioni.</td>
                    <td>Legittimo interesse del titolare alla tutela dei propri diritti (art. 6, par. 1, lett. f GDPR).</td>
                  </tr>
                  <tr>
                    <td>Produrre statistiche sull’uso del sito e misurare campagne e contatti generati.</td>
                    <td>Consenso dell’utente (art. 6, par. 1, lett. a GDPR e art. 122 del Codice Privacy), revocabile in ogni momento.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Il sito non utilizza i dati forniti nei moduli per inviare newsletter o comunicazioni
              promozionali autonome. Qualora tale attività venisse introdotta, sarà richiesta una
              scelta specifica e separata quando necessaria.
            </p>
          </section>

          <section id="modalita">
            <h2>4. Modalità del trattamento</h2>
            <p>
              I dati sono trattati con strumenti digitali e, quando necessario, su supporto cartaceo,
              adottando misure organizzative e tecniche proporzionate ai rischi. I dati non sono
              diffusi. Non vengono adottate decisioni basate unicamente su trattamenti automatizzati
              che producano effetti giuridici o analogamente significativi sull’interessato.
            </p>
          </section>

          <section id="conservazione">
            <h2>5. Tempi di conservazione</h2>
            <ul>
              <li><strong>Richieste che non danno luogo a un rapporto:</strong> per il tempo necessario a gestirle e, di norma, non oltre 24 mesi dall’ultimo contatto.</li>
              <li><strong>Dati contrattuali, amministrativi e fiscali:</strong> per la durata del rapporto e successivamente per 10 anni, salvo termini diversi imposti dalla legge o necessari in caso di controversia.</li>
              <li><strong>Log tecnici e di sicurezza:</strong> per il periodo strettamente necessario alla relativa finalità e, di norma, non oltre 12 mesi, fatte salve esigenze di accertamento di illeciti.</li>
              <li><strong>Dati di misurazione e marketing:</strong> secondo le impostazioni del servizio attivato e i tempi indicati nella Cookie Policy; il consenso memorizzato dal sito viene nuovamente richiesto entro sei mesi.</li>
            </ul>
            <p>I dati possono essere conservati più a lungo quando necessario per adempiere a un obbligo di legge o tutelare un diritto.</p>
          </section>

          <section id="destinatari">
            <h2>6. Destinatari, responsabili e trasferimenti</h2>
            <p>
              I dati possono essere conosciuti dal titolare e da persone autorizzate, nonché da
              fornitori che prestano servizi di hosting, manutenzione, gestione dei moduli, posta
              elettronica, comunicazione, analisi e pubblicità. Quando trattano dati per conto di
              Fastisol, tali soggetti vengono designati responsabili del trattamento ai sensi
              dell’art. 28 GDPR, ove richiesto. I dati possono inoltre essere comunicati a consulenti,
              autorità o altri soggetti quando necessario per legge o per la tutela di un diritto.
            </p>
            <p>
              Alcuni fornitori tecnologici, in particolare Google e Meta se attivati, possono trattare
              dati anche fuori dallo Spazio Economico Europeo. In tali casi il trasferimento avviene
              sulla base di una decisione di adeguatezza applicabile, del Data Privacy Framework
              UE-USA per i soggetti aderenti o di altre garanzie previste dagli articoli 44 e seguenti
              del GDPR, incluse le clausole contrattuali standard. I collegamenti alle informative dei
              singoli fornitori sono disponibili nella Cookie Policy.
            </p>
            <p>
              I collegamenti a Google Maps, WhatsApp o altri siti esterni trasferiscono l’utente fuori
              da fastisol.it soltanto quando vengono selezionati; il successivo trattamento è regolato
              dalle informative dei rispettivi gestori.
            </p>
          </section>

          <section id="diritti">
            <h2>7. Diritti dell’interessato</h2>
            <p>
              Nei casi previsti dal GDPR, l’interessato può chiedere l’accesso ai dati, la rettifica,
              la cancellazione, la limitazione del trattamento, la portabilità e opporsi al trattamento.
              Quando il trattamento è basato sul consenso, può revocarlo in qualsiasi momento senza
              pregiudicare la liceità del trattamento precedente.
            </p>
            <p>
              Le richieste possono essere inviate a <a href={`mailto:${company.email}`}>{company.email}</a>.
              L’interessato ha inoltre diritto di proporre reclamo al{' '}
              <a href="https://www.garanteprivacy.it/" target="_blank" rel="noreferrer">Garante per la protezione dei dati personali</a>
              {' '}o all’autorità di controllo competente.
            </p>
          </section>

          <section id="modifiche">
            <h2>8. Modifiche all’informativa</h2>
            <p>
              Questa informativa può essere aggiornata in caso di modifiche al sito, ai servizi o alla
              normativa. La data dell’ultima revisione è indicata all’inizio della pagina.
            </p>
          </section>
        </div>
      </div>
    </article>
  )
}
