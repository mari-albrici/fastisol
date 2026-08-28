import { technology } from '../../data/technicalData'
import { ButtonLink } from '../ui/ButtonLink'
import { Icon } from '../ui/Icon'
import { SectionHeading } from '../ui/SectionHeading'

const benefits = [
  'Segue travi, murature e geometrie irregolari',
  'Forma uno strato continuo sul supporto preparato',
  'Riduce giunti e tagli tipici dei pannelli',
  'Permette di intervenire dall’interno in molte configurazioni',
]

export function TechnologySection() {
  return (
    <section className="section technology-section">
      <div className="container technology-grid">
        <div className="technology-visual" aria-hidden="true">
          <div className="roof-diagram">
            <span className="roof-diagram__beam roof-diagram__beam--one" />
            <span className="roof-diagram__beam roof-diagram__beam--two" />
            <span className="roof-diagram__foam" />
            <span className="roof-diagram__label">strato continuo</span>
          </div>
          <div className="technology-badge">
            <span>Tecnologia</span>
            <strong>ICYNENE<br />/ Huntsman</strong>
          </div>
        </div>

        <div>
          <SectionHeading
            eyebrow="La tecnologia, spiegata bene"
            title="A spruzzo significa continuità, anche dove un pannello fatica ad arrivare."
            description={technology.plainLanguageDescription}
          />
          <ul className="check-list">
            {benefits.map((benefit) => <li key={benefit}><Icon name="check" size={19} /> {benefit}</li>)}
          </ul>
          <p className="technical-note">
            Spessori, prestazioni e comportamento igrometrico vanno definiti sul prodotto e sulla stratigrafia reali. Per questo non proponiamo valori standard senza una verifica tecnica.
          </p>
          <ButtonLink href="/tecnologia" variant="secondary" showArrow>Come funziona la tecnologia</ButtonLink>
        </div>
      </div>
    </section>
  )
}
