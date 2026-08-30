import { Seo } from '../components/layout/Seo'
import { Accordion } from '../components/ui/Accordion'
import { ButtonLink } from '../components/ui/ButtonLink'
import { company } from '../data/company'
import { faqs } from '../data/faqs'

const faqPageStructuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Domande frequenti sull’isolamento termico',
    url: `${company.websiteUrl}/faq`,
    description: 'Risposte Fastisol alle domande più comuni su isolamento di tetti e sottotetti, applicazione a spruzzo, condensa, tempi e preventivi.',
    inLanguage: 'it-IT',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: company.websiteUrl },
      { '@type': 'ListItem', position: 2, name: 'Domande frequenti', item: `${company.websiteUrl}/faq` },
    ],
  },
]

export function FaqPage() {
  return (
    <>
      <Seo
        title="Domande frequenti sull’isolamento termico"
        description="Risposte su isolamento di tetti e sottotetti, schiuma a spruzzo, condensa, tempi di intervento e preparazione del preventivo Fastisol."
        structuredData={faqPageStructuredData}
      />

      <header className="public-page-hero">
        <div className="container public-page-hero__inner">
          <div>
            <p className="eyebrow">Domande frequenti</p>
            <h1>Le prime risposte, prima di valutare il tuo edificio.</h1>
          </div>
          <p>Ogni struttura ha condizioni diverse. Queste indicazioni aiutano a orientarsi, ma non sostituiscono la verifica del supporto e della stratigrafia.</p>
        </div>
      </header>

      <section className="section faq-page">
        <div className="container faq-page__layout">
          <div className="faq-page__intro">
            <p className="eyebrow">Informazioni utili</p>
            <h2>Intervento, tecnologia e preventivo.</h2>
            <p>Le risposte sono formulate con prudenza perché tempi, spessori e fattibilità dipendono sempre dalle condizioni reali.</p>
            <ButtonLink href="/contatti" variant="secondary" showArrow>Parlaci del tuo caso</ButtonLink>
          </div>
          <div className="accordion-list">
            {faqs.map((faq) => <Accordion key={faq.question} question={faq.question} answer={faq.answer} />)}
          </div>
        </div>
      </section>
    </>
  )
}
