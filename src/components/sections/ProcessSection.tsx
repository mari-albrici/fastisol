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
    title: 'Preparazione del cantiere',
    text: 'Proteggiamo le aree interessate e prepariamo il supporto per l’applicazione prevista.',
  },
  {
    number: '04',
    title: 'Applicazione e controllo',
    text: 'Gli applicatori eseguono il ciclo concordato e verificano la continuità del lavoro.',
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
