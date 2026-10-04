import { Link } from 'react-router-dom'
import { Seo } from '../components/layout/Seo'
import { ButtonLink } from '../components/ui/ButtonLink'
import { Icon } from '../components/ui/Icon'
import { company } from '../data/company'
import { technologyFaqs, technologySources, technologySpecifications } from '../data/technologyPage'

const technologyStructuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'Schiuma a cellule aperte: da Icynene a Huntsman Building Solutions',
    description: 'Guida semplice alla schiuma isolante a celle aperte: funzionamento, differenze, prestazioni, applicazione e documentazione tecnica.',
    mainEntityOfPage: `${company.websiteUrl}/tecnologia`,
    inLanguage: 'it-IT',
    dateModified: '2026-09-29',
    author: {
      '@type': 'Organization',
      name: company.name,
      url: company.websiteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: company.name,
      logo: {
        '@type': 'ImageObject',
        url: new URL(company.logos.onLight.src, company.websiteUrl).toString(),
      },
    },
    about: [
      'isolamento termico a spruzzo',
      'schiuma poliuretanica a celle aperte',
      'isolamento di tetti e sottotetti',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Isolamento termico a spruzzo con schiuma a celle aperte',
    serviceType: 'Isolamento termico di tetti, sottotetti e coperture',
    provider: {
      '@type': 'HomeAndConstructionBusiness',
      name: company.name,
      url: company.websiteUrl,
      telephone: company.phoneDisplay,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Italia',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: technologyFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: company.websiteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Tecnologia',
        item: `${company.websiteUrl}/tecnologia`,
      },
    ],
  },
]

const processSteps = [
  {
    number: '01',
    title: 'Si studia la struttura',
    text: 'Prima dello spruzzo si controllano supporto, umidità, accessibilità e posizione corretta dello strato isolante.',
  },
  {
    number: '02',
    title: 'Si protegge l’area',
    text: 'Superfici, impianti e zone non interessate vengono schermati. L’area di lavoro resta riservata agli applicatori.',
  },
  {
    number: '03',
    title: 'Il materiale si espande',
    text: 'I componenti vengono dosati dall’attrezzatura e spruzzati sul supporto. La schiuma cresce in pochi secondi e segue la geometria.',
  },
  {
    number: '04',
    title: 'Si controlla il risultato',
    text: 'L’applicatore verifica continuità, adesione e spessore, poi prepara lo strato per l’eventuale finitura prevista.',
  },
] as const

const applicationAreas = [
  {
    title: 'Tetti e falde',
    text: 'Per intervenire dall’interno tra travi e cambi di pendenza, anche su tetti a volta e coperture irregolari difficili da seguire con pannelli rigidi.',
    href: '/soluzioni#tetto-o-sottotetto',
  },
  {
    title: 'Sottotetti',
    text: 'Sulla soletta oppure sotto la copertura, in base a come viene usato lo spazio e a quale volume deve restare riscaldato.',
    href: '/soluzioni#soluzione-sottotetto-non-abitabile',
  },
  {
    title: 'Muricci e tavelloni',
    text: 'In spazi bassi e frammentati, dove la continuità dello strato e l’accessibilità richiedono un metodo specifico.',
    href: '/soluzioni#soluzione-muricci-e-tavelloni',
  },
  {
    title: 'Pareti e controsoffitti',
    text: 'All’interno di sistemi progettati con una finitura adeguata e dopo la verifica del comportamento del vapore.',
    href: '/soluzioni#soluzione-isolamento-interno',
  },
] as const

export function TechnologyPage() {
  return (
    <article className="technology-page">
      <Seo
        title="Schiuma a cellule aperte e tecnologia Icynene | Fastisol"
        description="Come funziona la schiuma poliuretanica a cellule aperte: espansione, vapore, applicazioni e passaggio da Icynene a Huntsman Building Solutions."
        structuredData={technologyStructuredData}
      />

      <header className="technology-hero">
        <div className="container technology-hero__inner">
          <div className="technology-hero__copy">
            <p className="eyebrow">Tecnologia ICYNENE / Huntsman</p>
            <h1>Come funziona la schiuma a cellule aperte.</h1>
            <p className="technology-hero__lead">
              Si applica a spruzzo, si espande e forma uno strato continuo. Qui trovi cosa significa davvero, quando può essere utile e quali controlli servono prima di scegliere.
            </p>
            <div className="technology-hero__actions">
              <ButtonLink href="/contatti" showArrow>Valuta il tuo edificio</ButtonLink>
              <a className="button button--light" href="#come-funziona">Come funziona</a>
            </div>
          </div>

          <div className="technology-hero__visual" aria-hidden="true">
            <div className="foam-cutaway">
              <span className="foam-cutaway__support">supporto</span>
              <div className="foam-cutaway__layer">
                {Array.from({ length: 26 }, (_, index) => <i key={index} />)}
              </div>
              <span className="foam-cutaway__finish">ambiente interno</span>
            </div>
            <p><strong>Strato continuo</strong><span>Segue la forma della superficie e riduce giunti e fessure.</span></p>
          </div>
        </div>
      </header>

      <nav className="technology-index" aria-label="Indice della pagina">
        <div className="container technology-index__inner">
          <span>In questa pagina</span>
          <a href="#cos-e">Cos’è</a>
          <a href="#come-funziona">Come funziona</a>
          <a href="#icynene-huntsman">Icynene e Huntsman</a>
          <a href="#celle-aperte-chiuse">Celle aperte o chiuse</a>
          <a href="#dati-tecnici">Dati tecnici</a>
          <a href="#domande">FAQ</a>
        </div>
      </nav>

      <section className="section technology-intro" id="cos-e">
        <div className="container technology-intro__grid">
          <div>
            <p className="eyebrow">Partiamo dalle basi</p>
            <h2>Che cos’è l’isolamento termico a spruzzo?</h2>
          </div>
          <div className="technology-prose">
            <p className="technology-prose__lead">
              È un sistema nel quale il materiale isolante viene formato direttamente sulla superficie da proteggere, invece di arrivare in cantiere sotto forma di pannello o rotolo.
            </p>
            <p>
              L’attrezzatura miscela due componenti e li porta alla pistola di applicazione. A contatto con il supporto la schiuma si espande rapidamente, aderisce e riempie lo spazio disponibile. Il risultato è uno strato senza i tagli e gli accostamenti tipici degli isolanti prefabbricati.
            </p>
            <p>
              Durante l’espansione si formano milioni di piccole celle che non sono completamente chiuse tra loro: da qui il nome “a cellule aperte”. La schiuma poliuretanica finita è leggera e flessibile e raggiunge cavità, interstizi e punti difficili da isolare. Questa struttura consente il passaggio del vapore, da considerare nella progettazione della stratigrafia.
            </p>
          </div>
        </div>

        <div className="container technology-benefits" aria-label="Caratteristiche principali">
          <article><Icon name="layers" /><h3>Continuità</h3><p>Si adatta a travi, angoli, impianti e superfici irregolari.</p></article>
          <article><Icon name="temperature" /><h3>Isolamento termico</h3><p>Lo spessore limita lo scambio di calore tra interno ed esterno.</p></article>
          <article><Icon name="home" /><h3>Tenuta all’aria</h3><p>La posa continua aiuta a ridurre spifferi e passaggi d’aria incontrollati.</p></article>
          <article><Icon name="shield" /><h3>Passaggio del vapore</h3><p>La cella aperta è permeabile al vapore, ma va inserita in una stratigrafia corretta.</p></article>
        </div>
      </section>

      <section className="section technology-process" id="come-funziona">
        <div className="container">
          <div className="technology-section-heading">
            <div>
              <p className="eyebrow">Dalla superficie allo strato isolante</p>
              <h2>Come avviene l’applicazione a spruzzo.</h2>
            </div>
            <p>Il materiale conta, ma preparazione e posa determinano la qualità del lavoro. Per questo non è un prodotto fai-da-te.</p>
          </div>
          <ol className="technology-steps">
            {processSteps.map((step) => (
              <li key={step.number}>
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section technology-intro" id="icynene-huntsman">
        <div className="container technology-intro__grid">
          <div>
            <p className="eyebrow">La tecnologia utilizzata da Fastisol</p>
            <h2>Da Icynene a Huntsman Building Solutions.</h2>
          </div>
          <div className="technology-prose">
            <p>Chi conosce Fastisol da tempo conosce anche Icynene, per anni una delle nostre tecnologie di riferimento. Oggi il marchio fa parte di Huntsman Building Solutions, realtà internazionale del gruppo Huntsman specializzata nelle soluzioni per l’isolamento degli edifici.</p>
            <p>Questo passaggio riunisce competenze e risorse dedicate allo sviluppo di sistemi isolanti, con attenzione all’efficienza energetica e alla sostenibilità. Fastisol porta questa tecnologia sul campo con oltre 10 anni di esperienza nell’applicazione a spruzzo.</p>
            <h3>Efficienza energetica e attenzione all’ambiente</h3>
            <p>Un isolamento correttamente progettato può limitare le dispersioni termiche, contribuire a temperature più uniformi e ridurre il fabbisogno di energia per riscaldamento e raffrescamento. È in questo contributo al funzionamento dell’edificio che valutiamo il ruolo dell’isolamento nella transizione energetica.</p>
            <p>Alcune soluzioni Icynene utilizzano acqua come agente espandente: un approccio che rientra nella ricerca di sistemi con un minore impatto ambientale. Questa caratteristica va riferita al prodotto scelto, senza estenderla indistintamente a tutte le schiume o considerarla da sola una garanzia di sostenibilità.</p>
            <Link className="technology-inline-link" to="/soluzioni#capannoni-e-spazi-commerciali">Le applicazioni negli edifici industriali e commerciali <Icon name="arrow" size={18} /></Link>
          </div>
        </div>
      </section>

      <section className="section cell-comparison" id="celle-aperte-chiuse">
        <div className="container">
          <div className="technology-section-heading">
            <div>
              <p className="eyebrow">Una differenza importante</p>
              <h2>Schiuma a celle aperte o a celle chiuse?</h2>
            </div>
            <p>Non sono due nomi per lo stesso materiale e non esiste una scelta migliore in assoluto. Cambiano struttura, comportamento e applicazioni.</p>
          </div>

          <div className="cell-comparison__grid">
            <article className="cell-card cell-card--open">
              <div className="cell-card__sample" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</div>
              <p className="cell-card__label">La tecnologia usata da Fastisol</p>
              <h3>Celle aperte</h3>
              <ul>
                <li><Icon name="check" size={18} /> Leggera, morbida e flessibile</li>
                <li><Icon name="check" size={18} /> Bassa resistenza al passaggio del vapore</li>
                <li><Icon name="check" size={18} /> Adatta soprattutto ad applicazioni interne</li>
                <li><Icon name="check" size={18} /> Si adatta a cavità e geometrie complesse</li>
              </ul>
              <p>Non è uno strato portante e non sostituisce impermeabilizzazioni o riparazioni della copertura.</p>
            </article>

            <article className="cell-card cell-card--closed">
              <div className="cell-card__sample" aria-hidden="true">{Array.from({ length: 34 }, (_, index) => <i key={index} />)}</div>
              <p className="cell-card__label">Una tecnologia diversa</p>
              <h3>Celle chiuse</h3>
              <ul>
                <li><Icon name="check" size={18} /> Più densa e rigida</li>
                <li><Icon name="check" size={18} /> Maggiore resistenza termica a parità di spessore</li>
                <li><Icon name="check" size={18} /> Maggiore resistenza al passaggio del vapore</li>
                <li><Icon name="check" size={18} /> Alcuni sistemi sono adatti anche all’esterno</li>
              </ul>
              <p>Richiede valutazioni diverse e non va confusa con la schiuma leggera a celle aperte descritta in questa pagina.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section technology-data" id="dati-tecnici">
        <div className="container technology-data__grid">
          <div className="technology-data__intro">
            <p className="eyebrow">I numeri, con il loro significato</p>
            <h2>Dati tecnici della schiuma ICYNENE H2Foam Lite.</h2>
            <p>
              I valori qui riportati provengono dalla Dichiarazione di Prestazione H2Foam Lite V6 n. 0011/09-2020, documento collegato dal sito Fastisol originale.
            </p>
            <div className="technology-data__notice">
              <Icon name="document" size={23} />
              <p><strong>Il nome commerciale non basta.</strong> Versioni e formulazioni possono avere valori differenti. Nel preventivo va identificato il prodotto effettivamente previsto e va allegata la relativa documentazione aggiornata.</p>
            </div>
          </div>

          <dl className="technology-specs">
            {technologySpecifications.map((specification) => (
              <div key={specification.label}>
                <dt>{specification.label}</dt>
                <dd><strong>{specification.value}</strong><span>{specification.explanation}</span></dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section vapor-section">
        <div className="container vapor-section__grid">
          <div className="vapor-diagram" aria-hidden="true">
            <span className="vapor-diagram__inside">interno</span>
            <div className="vapor-diagram__foam"><i /><i /><i /><i /><i /></div>
            <span className="vapor-diagram__outside">esterno</span>
            <div className="vapor-diagram__arrows"><i>→</i><i>→</i><i>→</i></div>
          </div>
          <div>
            <p className="eyebrow">Aria, vapore e condensa</p>
            <h2>“Traspirante” non significa che il tetto si sistema da solo.</h2>
            <div className="technology-prose">
              <p className="technology-prose__lead">La schiuma a celle aperte può limitare i passaggi d’aria e, nello stesso tempo, lasciare migrare il vapore per diffusione. Sono due fenomeni diversi.</p>
              <p>Per evitare condensa dentro la struttura bisogna comunque conoscere tutti gli strati del tetto, la loro posizione, le temperature e l’umidità degli ambienti. Anche ventilazione e tenuta della copertura restano fondamentali.</p>
              <p>Se sono già presenti macchie, muffa o gocciolamenti, la causa va individuata prima della posa. Coprire il problema senza una diagnosi può renderlo meno visibile, non risolverlo.</p>
            </div>
            <Link className="technology-inline-link" to="/soluzioni#muffa-e-umidita">Come valutiamo condensa e umidità <Icon name="arrow" size={18} /></Link>
          </div>
        </div>
      </section>

      <section className="section technology-applications">
        <div className="container">
          <div className="technology-section-heading">
            <div>
              <p className="eyebrow">Dove può essere utilizzata</p>
              <h2>La stessa schiuma non significa lo stesso intervento.</h2>
            </div>
            <p>La posizione dello strato cambia in base all’edificio. Isolare la soletta di un sottotetto non abitato è diverso dall’isolare le falde di una mansarda.</p>
          </div>
          <div className="technology-applications__grid">
            {applicationAreas.map((application, index) => (
              <Link to={application.href} key={application.title}>
                <span>0{index + 1}</span>
                <h3>{application.title}</h3>
                <p>{application.text}</p>
                <Icon name="arrow" size={20} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section application-safety">
        <div className="container application-safety__grid">
          <div>
            <p className="eyebrow">Applicazione professionale</p>
            <h2>La sicurezza riguarda soprattutto il momento della posa.</h2>
          </div>
          <div className="application-safety__content">
            <p>I componenti liquidi richiedono attrezzature dedicate, controllo del rapporto di miscelazione, ventilazione e dispositivi di protezione. Il produttore indica espressamente l’impiego di applicatori formati.</p>
            <ul>
              <li><Icon name="shield" /> Protezione e delimitazione dell’area di lavoro</li>
              <li><Icon name="spray" /> Macchinari professionali e parametri controllati</li>
              <li><Icon name="clock" /> Accesso ai locali secondo istruzioni e tempi del produttore</li>
              <li><Icon name="document" /> Schede di sicurezza e documenti del prodotto disponibili</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section technology-documents">
        <div className="container technology-documents__grid">
          <div>
            <p className="eyebrow">Fonti e documentazione</p>
            <h2>Le prestazioni si verificano sui documenti, non sugli slogan.</h2>
            <p>Queste sono le fonti principali utilizzate per redigere la pagina. Le schede applicabili al singolo lavoro devono essere confermate in fase di offerta.</p>
          </div>
          <ul>
            {technologySources.map((source) => (
              <li key={source.href}>
                <a href={source.href} target="_blank" rel="noreferrer">
                  <Icon name="document" size={22} />
                  <span>{source.label}</span>
                  <Icon name="arrow" size={18} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section technology-faq" id="domande">
        <div className="container technology-faq__grid">
          <div className="technology-faq__intro">
            <p className="eyebrow">Domande frequenti</p>
            <h2>Dubbi sulla schiuma isolante a spruzzo.</h2>
            <p>Risposte brevi per orientarsi. La conferma tecnica arriva sempre dall’analisi dell’edificio.</p>
            <ButtonLink href="/contatti" variant="secondary" showArrow>Fai una domanda a Fastisol</ButtonLink>
          </div>
          <div className="technology-faq__list">
            {technologyFaqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}<span aria-hidden="true">+</span></summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </article>
  )
}
