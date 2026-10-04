import { Link } from 'react-router-dom'
import { Seo } from '../components/layout/Seo'
import { ButtonLink } from '../components/ui/ButtonLink'
import { Icon } from '../components/ui/Icon'
import { company } from '../data/company'
import { exampleScenarios, solutionCategories, solutionsFaqs } from '../data/solutionsPage'

const solutionsStructuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Soluzioni per l’isolamento termico di tetti, sottotetti e coperture',
    url: `${company.websiteUrl}/soluzioni`,
    description: 'Soluzioni Fastisol per isolamento di sottotetti, tetti, pareti e coperture industriali con applicazione professionale a spruzzo.',
    inLanguage: 'it-IT',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: solutionCategories.map((solution, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: solution.title,
        url: `${company.websiteUrl}/soluzioni#${solution.id}`,
      })),
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Isolamento termico professionale a spruzzo',
    serviceType: 'Isolamento di tetti, sottotetti, pareti, soffitti e coperture',
    provider: {
      '@type': 'HomeAndConstructionBusiness',
      name: company.name,
      url: company.websiteUrl,
      telephone: company.phoneDisplay,
      address: {
        '@type': 'PostalAddress',
        addressLocality: company.address.city,
        addressRegion: company.address.province,
        addressCountry: 'IT',
      },
    },
    areaServed: {
      '@type': 'Country',
      name: 'Italia',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: solutionsFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: company.websiteUrl },
      { '@type': 'ListItem', position: 2, name: 'Soluzioni', item: `${company.websiteUrl}/soluzioni` },
    ],
  },
]

const evaluationSteps = [
  {
    number: '01',
    title: 'Capire quale volume va protetto',
    text: 'Abitazione, mansarda, sottotetto non usato o spazio produttivo: il confine dell’area riscaldata cambia la posizione dell’isolante.',
  },
  {
    number: '02',
    title: 'Leggere la struttura esistente',
    text: 'Materiali, accessi, umidità, impianti e stato del supporto determinano se e come è possibile intervenire.',
  },
  {
    number: '03',
    title: 'Definire il ciclo completo',
    text: 'Prodotto, spessore, risvolti, calpestio e finiture vengono coordinati prima della posa.',
  },
] as const

export function SolutionsPage() {
  return (
    <div className="solutions-page">
      <Seo
        title="Isolamento tetto e sottotetto: soluzioni | Fastisol"
        description="Isolamento di sottotetti, mansarde e capannoni: dove intervenire, quando valutare alternative al cappotto e come affrontare condensa e umidità."
        structuredData={solutionsStructuredData}
      />

      <header className="solutions-hero">
        <div className="container solutions-hero__inner">
          <div className="solutions-hero__copy">
            <p className="eyebrow">Soluzioni di isolamento termico</p>
            <h1>Isolamento di sottotetti e coperture: dove intervenire.</h1>
            <p className="solutions-hero__lead">
              Tetto, sottotetto e soletta non sono la stessa cosa. Partiamo dall’uso degli spazi e dalla struttura per capire dove intervenire, con quale ciclo e con quale finitura.
            </p>
            <div className="solutions-hero__actions">
              <ButtonLink href="/contatti" showArrow>Descrivi il tuo caso</ButtonLink>
              <a className="button button--light" href="#tutte-le-soluzioni">Vedi le soluzioni</a>
            </div>
          </div>

          <aside className="solutions-selector" aria-label="Orientamento rapido alla soluzione">
            <p>Da dove iniziare</p>
            <ol>
              <li><span>1</span><div><strong>Lo spazio sotto il tetto è abitato?</strong><small>Se sì, si valutano normalmente le falde.</small></div></li>
              <li><span>2</span><div><strong>Il sottotetto serve solo per manutenzione?</strong><small>Si può considerare la soletta e mantenere un passaggio.</small></div></li>
              <li><span>3</span><div><strong>Ci sono condensa o infiltrazioni?</strong><small>Prima dell’isolamento va individuata la causa.</small></div></li>
            </ol>
            <Link to="/contatti">Chiedi una prima valutazione <Icon name="arrow" size={18} /></Link>
          </aside>
        </div>
      </header>

      <section className="section solutions-intro">
        <div className="container solutions-intro__grid">
          <div>
            <p className="eyebrow">Prima la diagnosi, poi il materiale</p>
            <h2>La soluzione dipende da come vivi l’edificio.</h2>
          </div>
          <div className="solutions-prose">
            <p className="solutions-prose__lead">Due case con lo stesso tipo di tetto possono richiedere interventi diversi.</p>
            <p>Se il sottotetto non viene utilizzato, isolare la soletta può evitare di riscaldare inutilmente quel volume. Se invece lo spazio è una mansarda abitata, il confine termico si sposta sulle falde. Negli edifici industriali entrano in gioco attività, umidità prodotta e caratteristiche della copertura.</p>
            <p>Per questo Fastisol non parte da una soluzione standard: raccoglie foto, misure e informazioni, verifica i punti critici e propone l’intervento compatibile con la struttura esistente.</p>
            <Link className="solutions-inline-link" to="/tecnologia">Come funziona la schiuma a celle aperte <Icon name="arrow" size={18} /></Link>
          </div>
        </div>
      </section>

      <section className="section solutions-catalog" id="tutte-le-soluzioni">
        <div className="container">
          <div className="solutions-section-heading">
            <div>
              <p className="eyebrow">Abitazioni, imprese e professionisti</p>
              <h2>Soluzioni per tetti, sottotetti e coperture.</h2>
            </div>
            <p>Scegli la situazione più vicina alla tua. Le schede aiutano a riconoscere il problema; la conferma arriva con la valutazione tecnica.</p>
          </div>

          <div className="solutions-catalog__grid">
            {solutionCategories.map((solution, index) => (
              <article className="solution-tile" id={solution.id} key={solution.id}>
                <div className="solution-tile__top">
                  <span>{(index + 1).toString().padStart(2, '0')}</span>
                  <Icon name={solution.icon} size={28} />
                </div>
                <p className="solution-tile__problem">{solution.problem}</p>
                <h3>{solution.shortTitle}</h3>
                <p>{solution.description}</p>
                <div className="solution-tile__ideal"><strong>Indicata per</strong><span>{solution.idealFor}</span></div>
                <Link className="solution-tile__link" to={solution.detailHref ?? '/preventivo'}>{solution.detailHref ? 'Approfondisci' : 'Valuta questa soluzione'} <Icon name="arrow" size={18} /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section roof-or-attic" id="tetto-o-sottotetto">
        <div className="container">
          <div className="solutions-section-heading">
            <div>
              <p className="eyebrow">La domanda più frequente</p>
              <h2>Isolare il tetto o isolare il sottotetto?</h2>
            </div>
            <p>La differenza è semplice: bisogna capire se il vano sotto le falde fa parte oppure no degli ambienti che vuoi mantenere confortevoli.</p>
          </div>

          <div className="roof-or-attic__grid">
            <article>
              <div className="roof-or-attic__diagram roof-or-attic__diagram--attic" aria-hidden="true">
                <i className="roof-or-attic__roof" /><i className="roof-or-attic__floor" /><i className="roof-or-attic__insulation" />
              </div>
              <p className="roof-or-attic__label">Volume non utilizzato</p>
              <h3>Isolare la soletta del sottotetto</h3>
              <p>Quando il sottotetto non è abitabile, la coibentazione della soletta permette di intervenire senza modificare gli ambienti abitati sottostanti. Il vano resta fuori dalla zona riscaldata. Se necessario, si può invece valutare la parte interna della copertura, prevedendo le finiture successive, come un controsoffitto.</p>
              <ul>
                <li><Icon name="check" size={17} /> Minore volume da mantenere caldo o fresco</li>
                <li><Icon name="check" size={17} /> Possibilità di prevedere passerelle tecniche</li>
              </ul>
              <ButtonLink href="/soluzioni#soluzione-sottotetto-non-abitabile" variant="text" showArrow>Isolamento sottotetto</ButtonLink>
            </article>

            <article>
              <div className="roof-or-attic__diagram roof-or-attic__diagram--roof" aria-hidden="true">
                <i className="roof-or-attic__roof" /><i className="roof-or-attic__floor" /><i className="roof-or-attic__insulation" />
              </div>
              <p className="roof-or-attic__label">Volume abitato o utilizzato</p>
              <h3>Isolare il tetto della mansarda</h3>
              <p>Una mansarda può essere abitabile ma poco confortevole, con caldo in estate e dispersioni termiche in inverno. Intervenire dall’interno della copertura consente di includerla nel volume da proteggere, completando il lavoro con una finitura adatta, ad esempio una controsoffittatura.</p>
              <ul>
                <li><Icon name="check" size={17} /> Continuità lungo la geometria delle falde</li>
                <li><Icon name="check" size={17} /> Coordinamento con impianti e finiture interne</li>
              </ul>
              <ButtonLink href="/soluzioni#soluzione-tetto-in-legno" variant="text" showArrow>Isolamento tetto</ButtonLink>
            </article>
          </div>
        </div>
      </section>

      <section className="section solutions-intro" id="geometrie-e-accessi">
        <div className="container solutions-intro__grid">
          <div>
            <p className="eyebrow">Geometrie e accessibilità</p>
            <h2>Muricci, tavelloni e coperture a volta.</h2>
          </div>
          <div className="solutions-prose">
            <p>Muricci, cavità e divisori rendono complessa la posa di pannelli o materiali in rotolo. La schiuma a spruzzo segue la geometria della struttura e raggiunge interstizi e zone difficili da trattare, dopo aver verificato le possibilità di accesso.</p>
            <p>Anche tetti e controsoffittature a volta, presenti in molti edifici storici e tradizionali, possono beneficiare di uno strato che segue la superficie senza le giunzioni tipiche dei pannelli.</p>
            <p>Per i sottotetti non accessibili occorre valutare prima come raggiungere l’area di posa. Accessibilità, spazio disponibile, stato della copertura e stratigrafia esistente determinano la fattibilità. Valutiamo anche le coperture esterne, individuando il sistema e le protezioni compatibili con la specifica applicazione.</p>
            <Link className="solutions-inline-link" to="/tecnologia#cos-e">Come si adatta la schiuma a cellule aperte <Icon name="arrow" size={18} /></Link>
          </div>
        </div>
      </section>

      <section className="section solutions-intro" id="isolamento-senza-cappotto">
        <div className="container solutions-intro__grid">
          <div>
            <p className="eyebrow">Interventi mirati</p>
            <h2>Isolare la casa senza intervenire sulle facciate.</h2>
          </div>
          <div className="solutions-prose">
            <p>Il calore si disperde attraverso tutte le parti dell’involucro. Se non vuoi o non puoi realizzare un cappotto esterno, può essere utile partire dalle condizioni del sottotetto e della copertura. Quando sono poco isolati, un intervento sulla soletta o sul lato interno del tetto può risultare più rapido e meno invasivo rispetto a lavori sull’intera facciata.</p>
            <h3>Quando si può intervenire sulle pareti</h3>
            <p>I sistemi Icynene possono essere impiegati anche in determinate stratigrafie verticali. L’applicazione non equivale però alla semplice posa di un cappotto tradizionale: la schiuma non può essere lasciata esposta e richiede finiture e protezioni secondo il progetto, con le lavorazioni edili necessarie.</p>
            <p>Quando serve, collaboriamo con imprese specializzate nelle opere di finitura. La scelta dell’isolamento dall’interno parte sempre dalla compatibilità con la struttura esistente.</p>
            <Link className="solutions-inline-link" to="/contatti">Scopri la soluzione più adatta <Icon name="arrow" size={18} /></Link>
          </div>
        </div>
      </section>

      <section className="section solutions-intro" id="muffa-e-umidita">
        <div className="container solutions-intro__grid">
          <div>
            <p className="eyebrow">Prima individuare la causa</p>
            <h2>Muffa e condensa: quando l’isolamento può aiutare.</h2>
          </div>
          <div className="solutions-prose">
            <p>Una scarsa coibentazione e la presenza di superfici fredde possono contribuire alla formazione di condensa e muffa, soprattutto quando l’umidità interna non viene gestita correttamente. In presenza di un sottotetto non isolato, intervenire sulla soletta o sulla copertura può migliorare le condizioni di temperatura e umidità e il comfort degli ambienti sottostanti.</p>
            <h3>Non tutta l’umidità dipende dall’isolamento</h3>
            <p>Infiltrazioni d’acqua, perdite, umidità di risalita e problemi di impermeabilizzazione richiedono prima l’individuazione e la risoluzione della causa. Quando necessario, consigliamo di rivolgersi a un professionista specializzato in impermeabilizzazioni e risanamento degli edifici.</p>
            <Link className="solutions-inline-link" to="/contatti">Parlaci del problema <Icon name="arrow" size={18} /></Link>
          </div>
        </div>
      </section>

      <section className="section solutions-intro" id="capannoni-e-spazi-commerciali">
        <div className="container solutions-intro__grid">
          <div>
            <p className="eyebrow">Industriale e commerciale</p>
            <h2>Isolamento di capannoni e grandi superfici.</h2>
          </div>
          <div className="solutions-prose">
            <p>Capannoni, magazzini, officine, negozi, concessionarie, uffici e strutture commerciali possono presentare ampie superfici e geometrie poco adatte ad alcuni sistemi tradizionali. Fastisol valuta interventi a spruzzo anche negli ambienti destinati alla lavorazione e allo stoccaggio.</p>
            <h3>Serve sempre un controsoffitto?</h3>
            <p>In determinate applicazioni è possibile intervenire direttamente sulla copertura o su altre strutture senza realizzare necessariamente un controsoffitto. La superficie può essere trattata e rifinita con pittura o altri sistemi di protezione, mediante lavorazioni eseguite da imprese specializzate e compatibili con il progetto.</p>
            <p>Questa possibilità è utile dove ridurre l’altezza disponibile o modificare completamente il soffitto non sarebbe conveniente. Prima della posa valutiamo superficie, altezza, accessibilità, stato della copertura e destinazione d’uso.</p>
            <Link className="solutions-inline-link" to="/contatti">Parlaci del tuo progetto <Icon name="arrow" size={18} /></Link>
          </div>
        </div>
      </section>

      <section className="section solution-examples">
        <div className="container">
          <div className="solutions-section-heading">
            <div>
              <p className="eyebrow">Esempi di applicazione</p>
              <h2>Tre scenari per capire dove può cambiare l’intervento.</h2>
            </div>
            <p>Gli esempi e le fotografie sono temporanei e illustrativi: aiutano a riconoscere le situazioni, ma non documentano cantieri realmente eseguiti da Fastisol.</p>
          </div>

          <div className="solution-examples__grid">
            {exampleScenarios.map((scenario) => (
              <article key={scenario.title}>
                <figure>
                  <img src={scenario.image} alt={scenario.imageAlt} width="1200" height="900" loading="lazy" />
                </figure>
                <div className="solution-example__content">
                  <p className="solution-example__category">{scenario.category}</p>
                  <h3>{scenario.title}</h3>
                  <dl>
                    <div><dt>Situazione</dt><dd>{scenario.problem}</dd></div>
                    <div><dt>Valutazione</dt><dd>{scenario.assessment}</dd></div>
                  </dl>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section solution-method">
        <div className="container solution-method__grid">
          <div>
            <p className="eyebrow">Il metodo Fastisol</p>
            <h2>Una soluzione è completa quando considera anche ciò che sta intorno all’isolante.</h2>
            <p>Accessi, impianti, risvolti, finiture e manutenzione futura fanno parte della valutazione. La posa è soltanto una fase del lavoro.</p>
            <ButtonLink href="/contatti" showArrow>Richiedi una valutazione</ButtonLink>
          </div>
          <ol>
            {evaluationSteps.map((step) => (
              <li key={step.number}>
                <span>{step.number}</span>
                <div><h3>{step.title}</h3><p>{step.text}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section solutions-area">
        <div className="container solutions-area__inner">
          <div>
            <p className="eyebrow">Dalla Valle Camonica ai progetti in Italia</p>
            <h2>La distanza si valuta insieme al tipo di intervento.</h2>
          </div>
          <div>
            <p>Fastisol opera in tutta Italia. La fattibilità di ogni intervento viene valutata in base a superficie, complessità e organizzazione del cantiere. Inviare località, foto e misure permette di capire subito se il progetto è compatibile.</p>
            <ButtonLink href="/contatti" variant="secondary" showArrow>Invia le informazioni</ButtonLink>
          </div>
        </div>
      </section>

      <section className="section solutions-faq">
        <div className="container solutions-faq__grid">
          <div className="solutions-faq__intro">
            <p className="eyebrow">Domande frequenti</p>
            <h2>Come scegliere l’intervento giusto.</h2>
            <p>Le risposte chiariscono i casi più comuni. Per decidere davvero servono le informazioni del tuo edificio.</p>
          </div>
          <div className="solutions-faq__list">
            {solutionsFaqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}<span aria-hidden="true">+</span></summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
