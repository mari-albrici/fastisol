import { SectionHeading } from '../ui/SectionHeading'

const steps = [
  {
    number: '01',
    title: 'Ascolto e prima valutazione',
    text: 'Raccogliamo problema, foto, misure indicative e informazioni sulla struttura.',
  },
  {
    number: '02',
    title: 'Soluzione e preventivo',
    text: 'Quando serve effettuiamo un sopralluogo, poi definiamo intervento, lavorazioni e tempi.',
  },
  {
    number: '03',
    title: 'Applicazione rapida e pulita',
    text: 'I nostri interventi sono rapidi, proteggendo le aree circostanti e minimizzando i disagi.',
  },
  {
    number: '04',
    title: 'Garanzia e durata nel tempo',
    text: 'Icynene/Huntsman garantisce la continuità e la durata nel tempo dello strato isolante.',
  },
]

export function ProcessSection() {
  return (
    <section className="section section--dark process-section">
      <div className="container">
        <SectionHeading
          eyebrow="Dalla richiesta al lavoro finito"
          title="Un referente, quattro passaggi chiari."
          description="Niente preventivi scollegati dalla realtà del cantiere: ogni proposta parte dalle condizioni dell’edificio."
          inverse
        />
        <ol className="process-list">
          {steps.map((step) => (
            <li key={step.number}>
              <span className="process-list__number">{step.number}</span>
              <div><h3>{step.title}</h3><p>{step.text}</p></div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
