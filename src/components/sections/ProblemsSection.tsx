import { problemStatements } from '../../data/services'
import { Icon } from '../ui/Icon'
import { SectionHeading } from '../ui/SectionHeading'

export function ProblemsSection() {
  return (
    <section className="section problems-section">
      <div className="container">
        <div className="intro-grid">
          <SectionHeading
            eyebrow="Partiamo dal problema"
            title="Una casa difficile da scaldare o raffrescare manda segnali precisi."
          />
          <div className="intro-grid__copy">
            <p className="lead-copy">
              Il tetto è una delle superfici più esposte dell’edificio. Capire come è fatto e dove passa il calore permette di scegliere un intervento mirato, senza aggiungere materiali a caso.
            </p>
            <p>
              Fastisol segue valutazione, scelta della soluzione, fornitura, applicazione e finiture previste: un unico referente dall’analisi al lavoro completato.
            </p>
          </div>
        </div>

        <div className="problem-grid">
          {problemStatements.map((problem, index) => (
            <article className="problem-card" key={problem.title}>
              <div className="problem-card__top">
                <span className="problem-card__number">0{index + 1}</span>
                <Icon name={problem.icon} size={27} />
              </div>
              <h3>{problem.title}</h3>
              <p>{problem.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
